/* Il ponte Spectra → RDKit Lab, provato dove vive davvero: due documenti,
   un iframe, e RDKit che carica dopo. */
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  // serviceWorkers:'block' e' necessario: il SW di BioSpecInfo intercetta le
  // richieste PRIMA di page.route, quindi la copia patchata non arriverebbe
  // mai e il test misurerebbe il file non patchato senza accorgersene.
  const ctx = await b.newContext({ viewport:{width:430,height:920}, serviceWorkers:'block' });
  const pg = await ctx.newPage();
  const err=[]; pg.on('pageerror', e=>err.push('page: '+e.message));
  pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) err.push('console: '+m.text()); });
  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

  // Il file e' avvolto in una IIFE: TOOLS non e' esposto, e non voglio
  // esporlo solo per il test. Si serve una copia patchata al volo, cosi'
  // il file spedito resta com'e'.
  const fs = require('fs');
  const sorgente = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8')
    .replace('window.bsiRunAgentTurn = runAgentTurn;',
             'window.bsiRunAgentTurn = runAgentTurn; window.bsiTOOLSTest = TOOLS;');
  await pg.route('**/bsi-ai-hub.js*', r => r.fulfill({ status:200,
    contentType:'application/javascript; charset=utf-8', body: sorgente }));

  await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load',timeout:60000});
  await pg.waitForTimeout(2500);

  console.log('\n1) Gli strumenti esistono e sono ben formati');
  const t = await pg.evaluate(()=>{
    const T = window.bsiTOOLS || null;
    return null;   // TOOLS non è esposto: si verifica per effetto, sotto
  });
  const reg = await pg.evaluate(()=>({
    api: typeof window.bsiRunAgentTurn,
    molecole: (function(){ try{ return Object.keys(window.__moldb||{}).length; }catch(e){ return -1; } })()
  }));
  att('Spectra caricato', 'function', reg.api);

  console.log('\n2) analizza_molecola: dati tabulati');
  // gli strumenti si invocano dal registro interno tramite un turno finto:
  // più semplice e più fedele è chiamarli via l'oggetto TOOLS esposto ai test
  const an = await pg.evaluate(async ()=>{
    const T = window.bsiTOOLSTest;
    if(!T) return { errore:'TOOLS non esposto' };
    const f = T.find(x=>x.name==='analizza_molecola');
    const r1 = await f.execute({ nome:'aspirina' });
    const r2 = await f.execute({ nome:'ASPIRINA' });
    const r3 = await f.execute({ nome:'acido acetilsalicilico' });
    const r4 = await f.execute({ smiles:'CC(=O)Oc1ccccc1C(O)=O' });
    const r5 = await f.execute({ smiles:'CCCCCCCCCCCCC(=O)OCC' });   // estere puro, fuori elenco
    const r7 = await f.execute({ smiles:'CCCCO' });                  // alcol vero
    const r8 = await f.execute({ smiles:'CC(=O)Nc1ccc(O)cc1X' });    // ammide + fenolo
    const r6 = await f.execute({ nome:'xyzynonesiste' });
    return { r1, r2, r3, r4, r5, r6, r7, r8 };
  });
  if(an.errore){ console.log('  ! ' + an.errore); }
  att('trova l\'aspirina', 'tabulato', an.r1 && an.r1.fonte);
  att('formula giusta', 'C9H8O4', an.r1 && an.r1.formula);
  att('due bande C=O (estere + acido)', true, !!(an.r1 && an.r1.ir.join(' ').includes('1750') && an.r1.ir.join(' ').includes('1690')));
  att('insensibile alle maiuscole', 'tabulato', an.r2 && an.r2.fonte);
  att('trova per sinonimo', 'aspirina', an.r3 && an.r3.nome);
  att('trova per SMILES', 'aspirina', an.r4 && an.r4.nome);
  att('dichiara che i valori dipendono dal solvente', true, /solvente/.test((an.r1&&an.r1.avvertenza)||''));
  console.log('   fuori elenco →', JSON.stringify((an.r5&&an.r5.gruppi)||an.r5));
  att('fuori elenco: dice che è dedotto', 'dedotto dai gruppi funzionali', an.r5 && an.r5.fonte);
  att('e riconosce l\'estere', true, ((an.r5&&an.r5.gruppi)||[]).indexOf('estere')>=0);
  att('e AVVERTE che non è misurato', true, /NON e' fra le/.test((an.r5&&an.r5.avvertenza)||''));
  // il difetto corretto: l'ossigeno carbonilico dell'estere veniva riletto
  // come alcol, e l'analisi prometteva una banda O–H che non c'e'.
  att('un estere NON viene dato anche per alcol', false, ((an.r5&&an.r5.gruppi)||[]).indexOf('alcol o fenolo')>=0);
  att('nessuna banda O–H fantasma', false, ((an.r5&&an.r5.ir)||[]).join(' ').includes('3300 larga'));
  att('un alcol vero però lo riconosce', true, ((an.r7&&an.r7.gruppi)||[]).indexOf('alcol o fenolo')>=0);
  console.log('   ammide+fenolo →', JSON.stringify((an.r8&&an.r8.gruppi)||an.r8));
  att('ammide riconosciuta', true, ((an.r8&&an.r8.gruppi)||[]).indexOf('ammide')>=0);
  att('e il fenolo che resta pure', true, ((an.r8&&an.r8.gruppi)||[]).indexOf('alcol o fenolo')>=0);
  // un nome inventato NON deve produrre un'analisi: il riconoscitore e' un
  // parser di SMILES, su una parola qualsiasi troverebbe finte formule.
  att('nome inventato: fallisce onestamente', false, an.r6 && an.r6.ok);
  att('e spiega cosa fare', true, /SMILES|cerca_pubchem/.test((an.r6&&an.r6.error)||''));

  console.log('\n3) disegna_molecola: apre il lab e carica lo SMILES');
  const dis = await pg.evaluate(async ()=>{
    const T = window.bsiTOOLSTest;
    const f = T.find(x=>x.name==='disegna_molecola');
    const r = await f.execute({ smiles:'CC(=O)Oc1ccccc1C(O)=O', nome:'aspirina' });
    const fr = document.querySelector('#bsi-rdkitlab-ov iframe');
    let dentro = null;
    try{
      const d = fr.contentDocument;
      dentro = { smiles: d.getElementById('smiles-input').value,
                 pannello: d.querySelector('.panel.active') ? d.querySelector('.panel.active').id : null,
                 api: typeof fr.contentWindow.bsiRDKitAPI };
    }catch(e){ dentro = { errore: e.message }; }
    return { r, dentro };
  });
  att('lo strumento riesce', true, dis.r && dis.r.ok);
  att('il lab è aperto e ha l\'API', 'object', dis.dentro && dis.dentro.api);
  att('lo SMILES è arrivato nel campo', 'CC(=O)Oc1ccccc1C(O)=O', dis.dentro && dis.dentro.smiles);
  att('è sul pannello molecola', 'p-mol', dis.dentro && dis.dentro.pannello);

  console.log('\n4) mostra_spettri: cambia pannello e tipo');
  const sp = await pg.evaluate(async ()=>{
    const T = window.bsiTOOLSTest;
    const f = T.find(x=>x.name==='mostra_spettri');
    const r = await f.execute({ smiles:'CC(=O)Oc1ccccc1C(O)=O', tipo:'ir', nome:'aspirina' });
    const fr = document.querySelector('#bsi-rdkitlab-ov iframe');
    const d = fr.contentDocument;
    return { r,
      pannello: d.querySelector('.panel.active') ? d.querySelector('.panel.active').id : null,
      tipoAttivo: (function(){ const b=d.querySelector('.sptb.on'); return b?b.getAttribute('data-spt'):null; })(),
      smiSpec: (d.getElementById('spec-smi-input')||{}).value };
  });
  att('lo strumento riesce', true, sp.r && sp.r.ok);
  att('siamo sul pannello spettri', 'p-speclive', sp.pannello);
  att('il tipo richiesto è attivo', 'ir', sp.tipoAttivo);
  att('lo SMILES è nel campo spettri', 'CC(=O)Oc1ccccc1C(O)=O', sp.smiSpec);
  att('dice che si vede un tipo per volta', true, /un tipo per volta/.test((sp.r&&sp.r.nota)||''));

  console.log('\n5) Un tipo non valido non rompe niente');
  const bad = await pg.evaluate(async ()=>{
    const T = window.bsiTOOLSTest;
    const f = T.find(x=>x.name==='mostra_spettri');
    const r = await f.execute({ smiles:'CCO', tipo:'inventato' });
    const d = document.querySelector('#bsi-rdkitlab-ov iframe').contentDocument;
    return { r, tipo:(function(){ const b=d.querySelector('.sptb.on'); return b?b.getAttribute('data-spt'):null; })() };
  });
  att('ripiega su nmr', 'nmr', bad.tipo);
  att('senza fallire', true, bad.r && bad.r.ok);

  console.log('\n6) Il lab non obbedisce a una pagina qualsiasi');
  const sec = await pg.evaluate(()=>{
    const fr = document.querySelector('#bsi-rdkitlab-ov iframe');
    // un messaggio la cui source NON è il parent dev'essere ignorato
    const prima = fr.contentDocument.getElementById('smiles-input').value;
    fr.contentWindow.dispatchEvent(new MessageEvent('message', {
      data:{ type:'bsi-load-smiles', smiles:'CCCCCCCC' }, source: null }));
    return { prima, dopo: fr.contentDocument.getElementById('smiles-input').value };
  });
  att('messaggio senza mittente valido: ignorato', sec.prima, sec.dopo);

  console.log('\n7) Nessun errore JS in tutto il giro');
  att('errori', 0, err.length);
  err.slice(0,5).forEach(e=>console.log('     ! '+e.slice(0,200)));

  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
