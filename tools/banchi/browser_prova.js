/* La prova dei fornitori: deve MISURARE la raggiungibilita' dal browser,
   funzionare senza chiave, e concludere con un consiglio utile. */
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

  async function apri(seed){
    // serviceWorkers:'block' come negli altri banchi: senza, il SW puo'
    // servire una copia in cache e si finisce per misurare il file vecchio.
    const ctx = await b.newContext({ serviceWorkers:'block' });
    const pg = await ctx.newPage();
    const err=[];
    pg.on('pageerror', e=>err.push(e.message));
    // "Failed to load resource" NON e' un errore dell'app: e' Chromium che
    // riporta lo stato HTTP o il blocco CORS. Qui la prova li provoca
    // APPOSTA — sono il dato che sta misurando. Contarli come guasti
    // renderebbe impossibile testare proprio la cosa che va testata.
    pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) err.push('console: '+m.text()); });
    if(seed) await pg.addInitScript(seed);
    await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load',timeout:60000});
    await pg.waitForTimeout(2500);
    await pg.evaluate(()=>{ const f=document.getElementById('bsi-spectra-fab'); if(f) f.click(); });
    await pg.waitForTimeout(1200);
    return { pg, err };
  }
  // Tutto il traffico verso i fornitori e' finto: Z.AI bloccata, gli altri
  // rispondono 401 (che per la prova significa "ci arrivo").
  async function fingiRete(pg, bloccati, chiaviBuone){
    await pg.route('**://*/**', r => {
      const u = r.request().url();
      if(u.indexOf('127.0.0.1:8899') >= 0) return r.continue();
      if(bloccati.some(h => u.indexOf(h) >= 0)) return r.abort('failed');
      if(/googleapis|anthropic|openai|groq|zai|z\.ai|deepseek|x\.ai/.test(u)){
        const buona = chiaviBuone && chiaviBuone.some(h => u.indexOf(h) >= 0);
        return r.fulfill({ status: buona ? 200 : 401, contentType:'application/json',
          body: buona ? '{"choices":[]}' : '{"error":"no key"}',
          headers: { 'access-control-allow-origin':'*' } });
      }
      return r.continue();
    });
  }
  const leggi = pg => pg.evaluate(()=>{
    const bx = document.getElementById('bsi-hub-provabox');
    return {
      visibile: !!(bx && bx.style.display === 'block'),
      testo: bx ? bx.textContent : '',
      esito: (function(){ const e=document.getElementById('bsi-prova-esito'); return e?e.textContent:''; })(),
      classe: (function(){ const e=document.getElementById('bsi-prova-esito'); return e?e.className:''; })()
    };
  });

  // ── A. il caso reale: un fornitore bloccato e nessun'altra chiave.
  //       Era NVIDIA, ora rimossa dalla tendina; il meccanismo e' identico
  //       per chiunque altro smetta di rispondere. ──
  console.log('\nA) Un fornitore bloccato, nessun\'altra chiave');
  var a = await apri(()=>{ try{
    localStorage.setItem('bsi_ai_provider','zai');
    localStorage.setItem('bsi_api_keys', JSON.stringify({ zai:'zkey-X' }));
  }catch(e){} });
  await fingiRete(a.pg, ['api.z.ai']);
  await a.pg.evaluate(()=>document.getElementById('bsi-hub-prova').click());
  await a.pg.waitForTimeout(6000);
  var s = await leggi(a.pg);
  att('il pannello si apre', true, s.visibile);
  att('Z.AI risulta non contattabile', true, /Z.AI[^⛔]*non riesce a contattarlo/.test(s.testo));
  att('Groq invece risponde', true, /Groq[^·]*· risponde/.test(s.testo));
  // Senza chiave la riga resta asciutta: undici righe che ripetono la stessa
  // postilla nasconderebbero l'unica differenza che conta, ✅ contro ⛔.
  att('la riga senza chiave resta asciutta', false, /chiave non ancora inserita/.test(s.testo));
  att('e la misura funziona comunque senza chiave', true, /Gemini Flash · risponde/.test(s.testo));
  att('la conclusione e\' incoraggiante, non un vicolo cieco', 'esito buono', s.classe);
  att('nomina i gratuiti raggiungibili', true, /Groq/.test(s.esito));
  att('e dice cosa fare', true, /riquadro 🔑|Manca solo la chiave/.test(s.esito));
  att('nessun errore JS', 0, a.err.length);
  a.err.slice(0,3).forEach(e=>console.log('     ! '+e.slice(0,200)));

  console.log('\nB) La prova aggiorna cio\' che l\'app sa, subito');
  var mem = await a.pg.evaluate(()=>({
    ko: localStorage.getItem('bsi_prov_ko'),
    voci: Array.from(document.getElementById('bsi-hub-provsel').options).map(o=>o.textContent),
    // il gruppo, non piu' il prefisso ⚠: un fornitore che non risponde ora
    // viene spostato nell'optgroup in fondo
    gruppi: Array.from(document.getElementById('bsi-hub-provsel').options)
      .map(o=>o.parentNode.tagName==='OPTGROUP'?o.parentNode.label:'')
  }));
  att('Z.AI annotata', true, /zai/.test(mem.ko||''));
  att('Groq NON annotato', false, /groq/.test(mem.ko||''));
  att('un solo fornitore finisce fra i non raggiungibili', 1, mem.gruppi.filter(g=>g).length);
  att('ed e\' proprio Z.AI', true,
    mem.voci.some((v,i)=>/Z\.AI/.test(v) && /Non hanno risposto/.test(mem.gruppi[i])));
  await a.pg.close();

  // ── C. chiave valida da qualche parte: la conclusione cambia ──
  console.log('\nC) Con una chiave che funziona');
  var c = await apri(()=>{ try{
    localStorage.setItem('bsi_ai_provider','zai');
    localStorage.setItem('bsi_api_keys', JSON.stringify({ zai:'zkey-X', groq:'gsk_BUONA' }));
  }catch(e){} });
  await fingiRete(c.pg, ['api.z.ai'], ['api.groq.com']);
  await c.pg.evaluate(()=>document.getElementById('bsi-hub-prova').click());
  await c.pg.waitForTimeout(6000);
  var s3 = await leggi(c.pg);
  att('dice che puoi usarlo subito', true, /Puoi usare subito/.test(s3.esito));
  att('e nomina Groq', true, /Groq/.test(s3.esito));
  att('la chiave di Groq risulta a posto', true, /Groq · risponde, chiave a posto/.test(s3.testo));
  att('nessun errore JS', 0, c.err.length);
  await c.pg.close();

  // ── D. chiave sbagliata: si distingue dal blocco di rete ──
  console.log('\nD) Chiave sbagliata ≠ fornitore irraggiungibile');
  var d = await apri(()=>{ try{
    localStorage.setItem('bsi_api_keys', JSON.stringify({ groq:'gsk_SBAGLIATA' }));
  }catch(e){} });
  await fingiRete(d.pg, []);
  await d.pg.evaluate(()=>document.getElementById('bsi-hub-prova').click());
  await d.pg.waitForTimeout(6000);
  var s4 = await leggi(d.pg);
  att('lo dice esplicitamente', true, /Groq · risponde, ma la chiave non è valida/.test(s4.testo));
  var mem4 = await d.pg.evaluate(()=>localStorage.getItem('bsi_prov_ko'));
  att('e NON marca il fornitore come irraggiungibile', null, mem4);
  att('nessun errore JS', 0, d.err.length);
  await d.pg.close();

  // ── E. rete completamente giu' ──
  console.log('\nD2) La conclusione DEVE dire quali costano');
  var p2 = await apri(()=>{ try{
    // chiave Gemini valida: copre sia il Flash (gratis) sia il 3 Pro (a pagamento)
    localStorage.setItem('bsi_api_keys', JSON.stringify({ gemini:'AIza_BUONA' }));
  }catch(e){} });
  await fingiRete(p2.pg, [], ['googleapis']);
  await p2.pg.evaluate(()=>document.getElementById('bsi-hub-prova').click());
  await p2.pg.waitForTimeout(6000);
  var s6 = await leggi(p2.pg);
  console.log('   conclusione:', s6.esito.slice(0,190));
  att('separa il gratis dal pagamento', true, /gratis/i.test(s6.esito));
  att('nomina il Flash come gratuito', true, /Gemini Flash/.test(s6.esito));
  att('e AVVERTE che il 3 Pro si paga', true, /a pagamento/i.test(s6.esito));
  att('spiegando cosa comporta', true, /credito|limite al minuto/i.test(s6.esito));
  att('nessun errore JS', 0, p2.err.length);
  await p2.pg.close();

  console.log('\nE) Nessuno raggiungibile');
  var e = await apri();
  await fingiRete(e.pg, ['groq','googleapis','zai','z.ai','openai','anthropic','deepseek','x.ai']);
  await e.pg.evaluate(()=>document.getElementById('bsi-hub-prova').click());
  await e.pg.waitForTimeout(6000);
  var s5 = await leggi(e.pg);
  att('la conclusione avverte', 'esito brutto', s5.classe);
  att('ipotizza la rete bloccata', true, /aziendale o scolastica/.test(s5.esito));
  att('e propone il proxy come soluzione definitiva', true, /proxy/.test(s5.esito));
  att('nessun errore JS', 0, e.err.length);
  await e.pg.close();

  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
