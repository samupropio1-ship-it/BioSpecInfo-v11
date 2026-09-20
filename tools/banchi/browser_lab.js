/* I difetti visti nello screenshot del lab: chimica sbagliata sul benzene,
   due pulsanti "Indietro", i FAB dell'app sopra i comandi del lab. */
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:430,height:920}, serviceWorkers:'block' });
  const pg = await ctx.newPage();
  const err=[]; pg.on('pageerror', e=>err.push('page: '+e.message));
  pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) err.push('console: '+m.text()); });
  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

  await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load',timeout:60000});
  await pg.waitForTimeout(2500);
  await pg.evaluate(()=>window.openRDKitLab());
  await pg.waitForTimeout(3000);
  const fr = pg.frames().find(f=>/rdkit_lab/.test(f.url()));

  // feat/irPk vivono dentro la chiusura di SpectralLab: si guida l'interfaccia
  // vera e si legge la legenda dal DOM — cioe' esattamente cio' che vede
  // l'utente, che e' anche il modo piu' fedele di provarlo.
  async function spettro(smi, tipo){
    await fr.evaluate(([s,t])=>{ window.bsiRDKitAPI.runSpectra(s, t, ''); }, [smi, tipo]);
    await pg.waitForTimeout(700);
    return fr.evaluate(()=>Array.from(document.querySelectorAll('#spec-lgd *'))
      .map(e=>e.textContent.trim()).filter(t=>t && t.length < 40));
  }

  console.log('\n1) La chimica: il benzene NON ha CH₂ né CH₃');
  const bz = { ir: await spettro('c1ccccc1','ir'), nmr: await spettro('c1ccccc1','nmr'),
               f: { nCsp3: 0, me: false } };
  console.log('   IR benzene:', JSON.stringify(bz.ir));
  console.log('   ¹H benzene:', JSON.stringify(bz.nmr));
  att('IR: niente CH₂ str', false, bz.ir.some(l=>/CH₂ str/.test(l)));
  att('IR: niente CH₂ bend', false, bz.ir.some(l=>/CH₂ bend/.test(l)));
  att('IR: niente CH₃ bend', false, bz.ir.some(l=>/CH₃ bend/.test(l)));
  att('IR: niente C-H alifatico', false, bz.ir.some(l=>/^C-H str$/.test(l)));
  att('IR: c\'è =C-H aromatico', true, bz.ir.some(l=>/=C-H \(Ar\)/.test(l)));
  att('IR: c\'è C=C aromatico', true, bz.ir.some(l=>/C=C Ar/.test(l)));
  att('¹H: nessun metile a 0,9', false, bz.nmr.some(l=>/CH₃/.test(l)));

  console.log('\n2) Il toluene invece il metile ce l\'ha — ma a 2,3 non a 0,9');
  const tol = { ir: await spettro('Cc1ccccc1','ir'), nmr: await spettro('Cc1ccccc1','nmr') };
  console.log('   ¹H toluene:', JSON.stringify(tol.nmr));
  att('IR: CH₃ bend c\'è', true, tol.ir.some(l=>/CH₃ bend/.test(l)));
  att('IR: CH₂ NON c\'è (il toluene non ne ha)', false, tol.ir.some(l=>/CH₂/.test(l)));
  att('¹H: il metile è marcato come aromatico', true, tol.nmr.some(l=>/Ar-CH₃/.test(l)));
  att('e NON compare un metile alifatico a 0,9', false, tol.nmr.some(l=>/^CH₃$/.test(l)));

  console.log('\n3) Il cicloesano ha CH₂ ma nessun CH₃');
  const cy = { ir: await spettro('C1CCCCC1','ir') };
  att('CH₂ sì', true, cy.ir.some(l=>/CH₂/.test(l)));
  att('CH₃ no', false, cy.ir.some(l=>/CH₃/.test(l)));

  console.log('\n4) Un solo pulsante "Indietro"');
  const btn = await pg.evaluate(()=>{
    const ov = document.getElementById('bsi-rdkitlab-ov');
    const suoi = Array.from(ov.querySelectorAll('button')).filter(b=>/Indietro/.test(b.textContent)).length;
    const fr = ov.querySelector('iframe');
    let dentro = 0;
    try{
      const fb = fr.contentDocument.getElementById('bsi-float-back');
      dentro = (fb && fb.style.display === 'block') ? 1 : 0;
    }catch(e){}
    return { suoi, dentro };
  });
  att('quello dell\'overlay c\'è', 1, btn.suoi);
  att('e il lab non ne aggiunge un secondo', 0, btn.dentro);

  console.log('\n5) I pulsanti flottanti non coprono i comandi del lab');
  const fab = await pg.evaluate(()=>{
    const st = id => { const e=document.getElementById(id); return e ? getComputedStyle(e).display : 'assente'; };
    return { classe: window._bsiOverlayOpen(),
             spectra: st('bsi-spectra-fab'), tondo: st('bsi14-fab') };
  });
  att('l\'app sa che c\'è un overlay', true, fab.classe);
  att('FAB Spectra nascosto', 'none', fab.spectra);
  att('FAB strumenti nascosto', 'none', fab.tondo);

  console.log('\n6) Chiudendo l\'overlay tornano');
  await pg.evaluate(()=>{ document.getElementById('bsi-rdkitlab-ov').style.display='none'; });
  await pg.waitForTimeout(600);
  const fab2 = await pg.evaluate(()=>({
    classe: window._bsiOverlayOpen(),
    spectra: getComputedStyle(document.getElementById('bsi-spectra-fab')).display }));
  att('l\'app sa che è chiuso', false, fab2.classe);
  att('FAB di nuovo visibile', true, fab2.spectra !== 'none');

  console.log('\n7) Nessun errore JS');
  att('errori', 0, err.length);
  err.slice(0,4).forEach(e=>console.log('     ! '+e.slice(0,180)));
  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
