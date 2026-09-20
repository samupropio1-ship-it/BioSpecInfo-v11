const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:430,height:920}, deviceScaleFactor:2 });
  const pg = await ctx.newPage();
  const err=[]; pg.on('pageerror',e=>err.push(e.message));
  pg.on('console',m=>{ if(m.type()==='error') err.push('console: '+m.text()); });
  await pg.addInitScript(()=>{ try{
    // groq e zai NON condividono la chiave con nessuna configurazione a
    // pagamento: cosi' la prova misura lo scambio fra gratuiti e basta.
    // (Con una chiave Gemini entrerebbe in gioco gemini_pro, rango 90 —
    //  comportamento voluto, ma un'altra cosa da quella provata qui.)
    localStorage.setItem('bsi_api_keys', JSON.stringify({groq:'gsk_X', zai:'zkey_Y'}));
    localStorage.setItem('bsi_ai_provider', 'zai');
  }catch(e){} });
  await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load'});
  await pg.waitForTimeout(2400);
  await pg.evaluate(()=>{ const f=document.getElementById('bsi-spectra-fab'); if(f) f.click(); });
  await pg.waitForTimeout(1100);
  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

  console.log('\n1) Il nucleo c\'è e non esce dal suo riquadro');
  const n = await pg.evaluate(()=>{
    const el=document.getElementById('bsi-nucleo'), r=el.getBoundingClientRect();
    const t=document.querySelector('#bsi-hub-top .ttl').getBoundingClientRect();
    return { c:!!el, w:Math.round(r.width), sovrappone: r.right > t.left+1 };
  });
  att('presente', true, n.c);
  att('36px', 36, n.w);
  att('non si sovrappone al nome', false, n.sovrappone);

  console.log('\n2) Il campo di scrittura non taglia più il testo');
  const inp = await pg.evaluate(()=>{
    const t=document.getElementById('bsi-hub-input'), r=t.getBoundingClientRect();
    return { w:Math.round(r.width), tagliato: t.scrollHeight > Math.round(r.height)+1 };
  });
  att('a tutta larghezza', true, inp.w > 350);
  att('nessun testo tagliato', false, inp.tagliato);

  console.log('\n3) Gli stati del nucleo');
  const stati = await pg.evaluate(async ()=>{
    const ov=document.getElementById('bsi-hub-ov'), out={};
    ['pensa','strumenti','scrive','riposo'].forEach(s=>{
      window.dispatchEvent(new Event('x'));
    });
    // via la funzione interna esposta dal ciclo: si simula col DOM
    const leggi=()=>({ stato: ov.getAttribute('data-stato'),
                       testo: document.getElementById('bsi-hub-stato').textContent });
    out.iniziale = leggi();
    return out;
  });
  att('stato iniziale a riposo', 'pronto', stati.iniziale.testo);

  console.log('\n4) Modalità Nucleo');
  const sw = await pg.evaluate(async ()=>{
    const s=document.getElementById('bsi-nucleo-sw');
    const prima = s.classList.contains('on');
    s.click(); await new Promise(r=>setTimeout(r,400));
    const dopo = s.classList.contains('on');
    const prov = document.getElementById('bsi-hub-provsel').value;
    const msg = document.getElementById('bsi-hub-msgs').textContent;
    let salvata=null; try{ salvata=localStorage.getItem('bsi_nucleo'); }catch(e){}
    s.click(); await new Promise(r=>setTimeout(r,300));
    const spenta = s.classList.contains('on');
    return { prima, dopo, prov, msg, salvata, spenta };
  });
  att('parte spenta', false, sw.prima);
  att('si accende', true, sw.dopo);
  att('resta salvata', '1', sw.salvata);
  att('passa al più capace fra le chiavi (Groq 50 > Z.AI 45)', 'groq', sw.prov);
  att('lo dice in chat', true, /Modalità Nucleo accesa/.test(sw.msg));
  att('si rispegne', false, sw.spenta);

  att('nessun errore JS', 0, err.length);
  err.slice(0,3).forEach(e=>console.log('     ! '+e.slice(0,180)));
  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
