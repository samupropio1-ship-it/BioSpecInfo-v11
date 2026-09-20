/* Il motore spettri messo alla prova su molecole di cui lo spettro IR e'
   noto a memoria a chiunque abbia dato un esame di organica. Se sbaglia
   queste, sbaglia tutto. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(3000);

  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  const analizza = smi => pg.evaluate(s => new Promise(res => {
    window.BSISpettri.gruppi(s, function (g) {
      if (!g) return res({ err: 'RDKit non disponibile' });
      const bande = window.BSISpettri.bandeDaGruppi(g);
      res({
        gruppi: g,
        bande: bande.map(x => ({ n: x.n, pk: Math.round(x.pk), i: x.i })),
        vicino: function () { return null; }
      });
    });
  }), smi);

  // c'e' una banda entro ±tolleranza da pk?
  const banda = (r, pk, tol) => (r.bande || []).find(x => Math.abs(x.pk - pk) <= (tol || 25));

  // ── 1. ASPIRINA: il caso che il vecchio motore sbagliava ──
  console.log('\n1) Aspirina — estere E acido carbossilico insieme');
  const asp = await analizza('CC(=O)Oc1ccccc1C(=O)O');
  if (asp.err) { console.log('   ! ' + asp.err); ko++; }
  else {
    console.log('    gruppi: ' + Object.keys(asp.gruppi).join(', '));
    att('riconosce l\'acido carbossilico', 1, asp.gruppi.acidoCarbossilico);
    att('riconosce anche l\'estere', 1, asp.gruppi.estere);
    att('e l\'anello aromatico', true, !!asp.gruppi.aromatico);
    att('O–H largo dell\'acido presente (~3000)', true, !!banda(asp, 3000, 80));
    att('C=O estere presente (~1735, coniugato)', true, !!banda(asp, 1720, 40));
    att('C=O acido presente (~1710, coniugato)', true, !!banda(asp, 1690, 40));
    att('C–O acido presente (~1280)', true, !!banda(asp, 1280, 40));
    att('anello orto-disostituito riconosciuto', true,
      !!(asp.bande || []).find(x => /orto/.test(x.n)));
  }

  // ── 2. ETANOLO ──
  console.log('\n2) Etanolo — O–H largo, C–O, nessun carbonile');
  const et = await analizza('CCO');
  att('O–H alcol largo (~3340)', true, !!banda(et, 3340, 40));
  att('C–O alcol primario (~1050)', true, !!banda(et, 1050, 40));
  att('NESSUN carbonile', undefined, (et.bande || []).find(x => /C=O/.test(x.n)));
  att('C–H presenti', true, !!banda(et, 2960, 60));

  // ── 3. ACETONE: chetone puro ──
  console.log('\n3) Acetone — un solo C=O, a 1715');
  const ac = await analizza('CC(C)=O');
  att('riconosce il chetone', 1, ac.gruppi && ac.gruppi.chetone);
  att('C=O chetone a ~1715', true, !!banda(ac, 1715, 20));
  att('nessun O–H', undefined, (ac.bande || []).find(x => /O–H/.test(x.n)));
  att('nessun estere', undefined, (ac.bande || []).find(x => /estere/.test(x.n)));

  // ── 4. BENZALDEIDE: il doppietto di Fermi ──
  console.log('\n4) Benzaldeide — doppietto di Fermi 2820/2720');
  const bz = await analizza('O=Cc1ccccc1');
  att('riconosce l\'aldeide', 1, bz.gruppi && bz.gruppi.aldeide);
  att('prima banda di Fermi (2820)', true, !!banda(bz, 2820, 15));
  att('seconda banda di Fermi (2720)', true, !!banda(bz, 2720, 15));
  att('C=O abbassato dalla coniugazione (<1715)', true,
    !!(bz.bande || []).find(x => /C=O aldeide/.test(x.n) && x.pk < 1715));
  att('anello monosostituito', true, !!(bz.bande || []).find(x => /monosost/.test(x.n)));

  // ── 5. ACETAMMIDE: bande I e II ──
  console.log('\n5) Acetammide — banda ammide I e II');
  const am = await analizza('CC(N)=O');
  att('riconosce l\'ammide primaria', 1, am.gruppi && am.gruppi.ammidePrim);
  att('banda ammide I (~1655)', true, !!banda(am, 1655, 20));
  att('banda ammide II (~1550)', true, !!banda(am, 1550, 20));
  att('due N–H (asim. e sim.)', 2, (am.bande || []).filter(x => /N–H ammide/.test(x.n)).length);

  // ── 6. NITROBENZENE: le due bande del nitro ──
  console.log('\n6) Nitrobenzene — nitro asimmetrica e simmetrica');
  const nb = await analizza('O=[N+]([O-])c1ccccc1');
  att('riconosce il gruppo nitro', true, !!(nb.gruppi && nb.gruppi.nitro));
  att('N=O asimmetrica (~1520)', true, !!banda(nb, 1520, 20));
  att('N=O simmetrica (~1345)', true, !!banda(nb, 1345, 20));

  // ── 7. TOLUENE vs XILENI: la zona oop distingue la sostituzione ──
  console.log('\n7) La sostituzione dell\'anello si legge sotto 900 cm⁻¹');
  const tol = await analizza('Cc1ccccc1');
  const para = await analizza('Cc1ccc(C)cc1');
  const meta = await analizza('Cc1cccc(C)c1');
  att('toluene: monosostituito', true, !!(tol.bande || []).find(x => /monosost/.test(x.n)));
  att('p-xilene: para-disostituito', true, !!(para.bande || []).find(x => /para/.test(x.n)));
  att('m-xilene: meta-disostituito', true, !!(meta.bande || []).find(x => /meta/.test(x.n)));

  // ── 8. determinismo ──
  console.log('\n8) Lo stesso spettro, disegnato due volte, dev\'essere identico');
  const stabile = await pg.evaluate(() => new Promise(res => {
    window.BSISpettri.gruppi('CC(=O)Oc1ccccc1C(=O)O', function (g) {
      const bande = window.BSISpettri.bandeDaGruppi(g);
      const a = window.BSISpettri.svgIR(bande);
      const c = window.BSISpettri.svgIR(bande);
      res({ uguali: a === c, lung: a.length });
    });
  }));
  att('due disegni identici', true, stabile.uguali);
  console.log('    · ' + stabile.lung + ' caratteri di SVG');

  // ── 9. la trasmittanza va verso il basso ──
  console.log('\n9) Convenzione: trasmittanza, non assorbanza');
  const conv = await pg.evaluate(() => new Promise(res => {
    window.BSISpettri.gruppi('CC(C)=O', function (g) {
      const s = window.BSISpettri.svgIR(window.BSISpettri.bandeDaGruppi(g));
      res({
        asseY: /Trasmittanza/.test(s),
        centoInAlto: /y="20"[^>]*>100</.test(s) || s.indexOf('>100<') > 0,
        impronta: /impronta digitale/.test(s),
        assorbanza: /Assorbanza/.test(s)
      });
    });
  }));
  att('l\'asse Y e\' la trasmittanza', true, conv.asseY);
  att('e non l\'assorbanza', false, conv.assorbanza);
  att('la regione dell\'impronta digitale e\' segnata', true, conv.impronta);

  att('nessun errore JS in tutto il banco', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 150)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
