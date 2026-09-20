/* Il motore nuovo deve arrivare fin dove l'utente guarda: i sei punti
   dell'app che disegnano uno spettro passano tutti da irBandList e
   makeIRsvg, e qui si controlla che l'innesto sia davvero avvenuto e che
   il ridisegno automatico funzioni. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) err.push('console: ' + m.text());
  });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(3000);

  console.log('\n1) L\'innesto e\' avvenuto');
  const inn = await pg.evaluate(() => ({
    haMotore: !!window.BSISpettri,
    innestato: !!(window.BSISpettri && window.BSISpettri.makeIRsvgLegacy),
    svgTrasm: /Trasmittanza/.test(window.makeIRsvg([{ n: 'x', pk: 1700, w: 25, i: 1 }], '#c62828'))
  }));
  att('il motore spettri e\' caricato', true, inn.haMotore);
  att('irBandList/makeIRsvg sono state sostituite', true, inn.innestato);
  att('e il disegno esce in trasmittanza', true, inn.svgTrasm);

  console.log('\n2) Anche il percorso di ripiego usa la convenzione giusta');
  // bande dal metodo vecchio + disegno nuovo: l'asse dev'essere comunque
  // trasmittanza, mai assorbanza
  /* ATTENZIONE: la prima versione di questo controllo guardava solo la
     scritta sull'asse, e passava mentre il disegno era rotto. Le bande del
     predittore vecchio usano fw/h invece di w/i: il renderer nuovo leggeva
     w e i, trovava undefined e sfornava un path "M58.0,NaN" — uno spettro
     vuoto, per i pochi secondi prima che RDKit arrivasse. Un banco che
     controlla l'etichetta e non il contenuto non serve a niente. */
  const rip = await pg.evaluate(() => {
    const vecchie = window.BSISpettri.irBandListLegacy('CCO');
    const s = window.makeIRsvg(vecchie, '#c62828');
    const d = (s.match(/<path d="([^"]*)"/) || [])[1] || '';
    return {
      trasm: /Trasmittanza/.test(s), ass: /Assorbanza/.test(s), n: vecchie.length,
      nan: /NaN|Infinity|undefined/.test(s),
      puntiPath: (d.match(/[ML]/g) || []).length,
      formaVecchia: vecchie.length ? ('fw' in vecchie[0] && 'h' in vecchie[0]) : false
    };
  });
  att('le bande vecchie hanno davvero la forma fw/h (prova valida)', true, rip.formaVecchia);
  att('trasmittanza anche col ripiego', true, rip.trasm);
  att('mai assorbanza', false, rip.ass);
  att('nessun NaN nel disegno', false, rip.nan);
  att('e la traccia ha punti veri', true, rip.puntiPath > 500);

  console.log('\n3) Niente rumore casuale: due disegni identici');
  const det = await pg.evaluate(() => {
    const bande = window.irBandList('CC(=O)Oc1ccccc1C(=O)O');
    return window.makeIRsvg(bande, '#c62828') === window.makeIRsvg(bande, '#c62828');
  });
  att('lo stesso spettro e\' sempre lo stesso', true, det);

  console.log('\n4) Dal centro di analisi: l\'aspirina mostra le bande giuste');
  await pg.evaluate(() => window.goSection && window.goSection('scentro'));
  await pg.waitForTimeout(600);
  await pg.evaluate(() => {
    const inp = document.getElementById('ctrSmiles');
    if (inp) inp.value = 'CC(=O)Oc1ccccc1C(=O)O';
    window.ctrAnalyze();
  });
  // il primo disegno puo' essere di ripiego: si aspetta il ridisegno vero
  await pg.waitForTimeout(6000);
  const centro = await pg.evaluate(() => {
    const ir = document.getElementById('ctrIR');
    const t = ir ? ir.textContent : '';
    return {
      haSvg: !!(ir && ir.querySelector('svg')),
      trasm: /Trasmittanza/.test(t),
      acido: /acido/i.test(t),
      estere: /estere/i.test(t),
      orto: /orto/i.test(t),
      analizzata: !!(window.BSISpettri.gruppiSync('CC(=O)Oc1ccccc1C(=O)O'))
    };
  });
  att('RDKit ha analizzato la molecola', true, centro.analizzata);
  att('lo spettro c\'e\'', true, centro.haSvg);
  att('in trasmittanza', true, centro.trasm);
  att('la legenda nomina l\'acido carbossilico', true, centro.acido);
  att('e anche l\'estere (prima ne mostrava uno solo)', true, centro.estere);
  att('e riconosce l\'anello orto-disostituito', true, centro.orto);

  att('nessun errore JS', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('     ! ' + e.slice(0, 160)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
