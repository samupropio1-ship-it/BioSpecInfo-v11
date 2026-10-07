/* ═══════════════════════════════════════════════════════════════════════════
   test_nmr — un predittore si verifica contro la letteratura, non contro sé

   PERCHE' QUESTO BANCO ESISTE

   Un predittore di spettri non si rompe mai: produce sempre dei numeri. Se
   sono sbagliati di venti ppm, lo spettro si disegna lo stesso e sembra uno
   spettro. L'unico modo di sapere se serve a qualcosa e' confrontarlo con
   valori MISURATI da altri, e dire lo scarto.

   E c'e' una trappola che rende quel confronto inutile: tarare i parametri
   sulle stesse molecole su cui poi si misura l'errore. Il numero che esce
   dice allora quanto bene lo schema ricorda i propri esempi, che non e' una
   domanda interessante. Qui le molecole sono divise in due insiemi:

     · TARATURA — quelle usate per scegliere valori e regole;
     · VALIDAZIONE — mai usate per quello, e il numero DICHIARATO nel modulo
       e' quello che esce da qui.

   Lo scarto sulla validazione e' sempre peggiore di quello sulla taratura.
   Se un giorno fossero uguali, vorrebbe dire che qualcuno ha spostato una
   molecola da un insieme all'altro.

   USO   node tools/banchi/test_nmr.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function sotto(d, limite, avuto) {
  eseguiti++;
  if (avuto <= limite) { ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (limite ' + limite + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      limite: ' + limite + '\n      avuto:  ' + avuto); }
}

/* ── Gli insiemi, con i valori di letteratura ────────────────────────────── */
const TARATURA = [
  ['benzene', 'c1ccccc1', [128.5]],
  ['toluene', 'Cc1ccccc1', [137.8, 129.3, 128.5, 125.6, 21.4]],
  ['fenolo', 'Oc1ccccc1', [155.6, 130.0, 121.0, 115.7]],
  ['anisolo', 'COc1ccccc1', [159.9, 129.5, 120.7, 114.1, 55.1]],
  ['etanolo', 'CCO', [58.0, 18.2]],
  ['butano', 'CCCC', [25.0, 13.2]],
  ['acetone', 'CC(C)=O', [206.0, 30.8]],
  ['acido acetico', 'CC(=O)O', [178.1, 20.8]],
  ['cicloesano', 'C1CCCCC1', [27.0]]
];
const VALIDAZIONE = [
  ['naftalene', 'c1ccc2ccccc2c1', [133.5, 127.9, 125.8]],
  ['difenile', 'c1ccc(cc1)-c1ccccc1', [141.2, 128.8, 127.3, 127.2]],
  ['stirene', 'C=Cc1ccccc1', [137.6, 136.9, 128.5, 127.8, 126.2, 113.8]],
  ['acetofenone', 'CC(=O)c1ccccc1', [198.1, 137.1, 133.1, 128.6, 128.3, 26.6]],
  ['m-cresolo', 'Cc1cccc(O)c1', [155.4, 139.8, 129.4, 121.9, 116.2, 112.3, 21.3]],
  ['p-cresolo', 'Cc1ccc(O)cc1', [153.1, 130.1, 130.0, 115.1, 20.5]],
  ['benzonitrile', 'N#Cc1ccccc1', [132.8, 132.1, 129.1, 118.7, 112.4]],
  ['4-nitrotoluene', 'Cc1ccc(cc1)[N+](=O)[O-]', [146.3, 146.2, 130.0, 123.6, 21.6]],
  ['acido salicilico', 'OC(=O)c1ccccc1O', [174.0, 162.0, 136.0, 130.9, 119.2, 117.5, 110.8]],
  ['acetato di etile', 'CCOC(C)=O', [171.0, 60.4, 21.0, 14.2]],
  ['acido propanoico', 'CCC(=O)O', [180.6, 27.6, 9.0]],
  ['isopropanolo', 'CC(C)O', [64.0, 25.3]],
  ['etere dietilico', 'CCOCC', [65.9, 15.2]],
  ['cicloesanone', 'O=C1CCCCC1', [211.9, 41.9, 26.9, 25.0]],
  ['1-butanolo', 'CCCCO', [62.6, 34.9, 19.1, 13.9]],
  ['terz-butanolo', 'CC(C)(C)O', [69.0, 31.4]],
  ['2-butanone', 'CCC(C)=O', [209.3, 36.7, 29.3, 7.9]]
];
/* ¹H: valori di letteratura in CDCl₃ */
const PROTONI = [
  ['etanolo', 'CCO', [3.72, 2.60, 1.25]],
  ['acetato di etile', 'CCOC(C)=O', [4.12, 2.04, 1.26]],
  ['acido acetico', 'CC(=O)O', [11.40, 2.10]],
  ['acetone', 'CC(C)=O', [2.17]],
  ['benzene', 'c1ccccc1', [7.26]],
  ['TMS', 'C[Si](C)(C)C', [0.00]],
  ['ciclopropano', 'C1CC1', [0.22]],
  ['benzaldeide', 'O=Cc1ccccc1', [10.02, 7.88, 7.60, 7.52]]
];
/* molecole di cui si sa QUANTI segnali ¹³C distinti danno: e' la prova che
   l'equivalenza chimica funziona. Il benzene ne da' UNO, non sei. */
const QUANTI_SEGNALI = [
  ['benzene', 'c1ccccc1', 1],
  ['toluene', 'Cc1ccccc1', 5],
  ['p-xilene', 'Cc1ccc(C)cc1', 3],
  ['naftalene', 'c1ccc2ccccc2c1', 3],
  ['cicloesano', 'C1CCCCC1', 1],
  ['acetone', 'CC(C)=O', 2],
  ['difenile', 'c1ccc(cc1)-c1ccccc1', 4],
  ['aspirina', 'CC(=O)Oc1ccccc1C(=O)O', 9]
];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1300, height: 1000 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(6000);
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

  console.log('Predizione NMR — assegnata per atomo, verificata contro la letteratura\n');

  /* ── §1 · Il modulo c'è ─────────────────────────────────────────────────── */
  console.log('── Il motore ──');
  const presente = await pg.evaluate(() => ({
    nmr: typeof window.BSINMR, draw: typeof window.BSIMolDraw,
    pannello: typeof window.BSINmrPannello
  }));
  att('BSINMR è caricato', 'object', presente.nmr);
  att('BSIMolDraw è caricato', 'object', presente.draw);
  att('il pannello è caricato', 'object', presente.pannello);

  /* ── §2 · Lo scarto sui due insiemi ─────────────────────────────────────── */
  const mis = await pg.evaluate(async (dati) => {
    await new Promise(r => window.bsiLoadRDKit(r));
    function scartoDi(lista) {
      const per = lista.map(function (c) {
        const r = window.BSINMR.predici(c[1], { nucleo: '13C' });
        if (!r || r.errore) return { nome: c[0], errore: r ? r.errore : 'nullo' };
        const prev = r.segnali.map(s => s.ppm);
        const sc = c[2].map(v => Math.min.apply(null, prev.map(x => Math.abs(x - v))));
        return { nome: c[0], nP: prev.length, nA: c[2].length,
                 max: Math.max.apply(null, sc),
                 med: sc.reduce((a, b2) => a + b2, 0) / sc.length };
      });
      const buoni = per.filter(x => !x.errore);
      return { per: per,
               medio: buoni.length ? buoni.reduce((a, x) => a + x.med, 0) / buoni.length : 99,
               peggiore: buoni.length ? Math.max.apply(null, buoni.map(x => x.max)) : 99,
               errori: per.filter(x => x.errore).length };
    }
    const h = dati.PROTONI.map(function (c) {
      const r = window.BSINMR.predici(c[1], { nucleo: '1H' });
      if (!r || r.errore) return { nome: c[0], errore: r ? r.errore : 'nullo' };
      const prev = r.segnali.map(s => s.ppm);
      const sc = c[2].map(v => Math.min.apply(null, prev.map(x => Math.abs(x - v))));
      return { nome: c[0], med: sc.reduce((a, b2) => a + b2, 0) / sc.length };
    });
    const conta = dati.QUANTI_SEGNALI.map(function (c) {
      const r = window.BSINMR.predici(c[1], { nucleo: '13C' });
      return { nome: c[0], atteso: c[2], avuto: (r && r.segnali) ? r.segnali.length : -1 };
    });
    /* le due prove contrarie: uno SMILES illeggibile non deve inventare uno
       spettro, e un errore non deve restare silenzioso */
    const rotto = window.BSINMR.predici('questo non e uno smiles', { nucleo: '13C' });
    const vuoto = window.BSINMR.predici('', { nucleo: '13C' });
    return {
      taratura: scartoDi(dati.TARATURA),
      validazione: scartoDi(dati.VALIDAZIONE),
      protoni: h,
      conta: conta,
      rotto: rotto === null ? 'null' : (rotto.errore ? 'errore' : ('segnali:' + rotto.segnali.length)),
      vuoto: vuoto === null ? 'null' : 'oggetto'
    };
  }, { TARATURA, VALIDAZIONE, PROTONI, QUANTI_SEGNALI });

  console.log('\n── ¹³C: insieme di TARATURA ──');
  att('nessuna molecola di taratura fallisce', 0, mis.taratura.errori);
  console.log('      scarto medio ' + mis.taratura.medio.toFixed(2) +
              ' ppm · peggiore ' + mis.taratura.peggiore.toFixed(1));

  console.log('\n── ¹³C: insieme di VALIDAZIONE (mai usato per tarare) ──');
  mis.validazione.per.forEach(function (x) {
    if (x.errore) console.log('      ! ' + x.nome + ' → ' + x.errore);
    else console.log('      ' + x.nome.padEnd(20) + ' segnali ' + x.nP + '/' + x.nA +
                     '  medio ' + x.med.toFixed(2) + '  max ' + x.max.toFixed(1));
  });
  att('nessuna molecola di validazione fallisce', 0, mis.validazione.errori);
  /* La soglia e' quella DICHIARATA nel modulo e nel pannello. Se lo scarto
     cresce oltre, la dichiarazione e' diventata falsa e il banco lo dice. */
  sotto('lo scarto medio sulla validazione sta nel valore dichiarato', 2.5,
        +mis.validazione.medio.toFixed(2));
  /* E la guardia opposta: la validazione deve restare PEGGIORE della
     taratura. Se diventasse migliore o uguale, qualcuno avrebbe spostato
     molecole da un insieme all'altro e il numero non direbbe piu' niente. */
  att('la validazione è più severa della taratura', true,
      mis.validazione.medio > mis.taratura.medio);
  console.log('      (taratura ' + mis.taratura.medio.toFixed(2) +
              ' · validazione ' + mis.validazione.medio.toFixed(2) + ')');

  console.log('\n── ¹H ──');
  const mh = mis.protoni.filter(x => !x.errore);
  mis.protoni.forEach(function (x) {
    if (x.errore) console.log('      ! ' + x.nome + ' → ' + x.errore);
  });
  att('nessuna molecola ¹H fallisce', 0, mis.protoni.length - mh.length);
  const medioH = mh.reduce((a, x) => a + x.med, 0) / mh.length;
  sotto('lo scarto medio ¹H sta nel valore dichiarato', 0.5, +medioH.toFixed(2));

  console.log('\n── L\'equivalenza chimica ──');
  let sbagliati = 0;
  mis.conta.forEach(function (c) {
    if (c.avuto !== c.atteso) {
      sbagliati++;
      console.log('      ✗ ' + c.nome + ': ' + c.avuto + ' segnali, attesi ' + c.atteso);
    } else console.log('      ' + c.nome.padEnd(18) + c.avuto + ' segnali');
  });
  /* Il benzene ha sei carboni e UN segnale. Senza equivalenza ne darebbe sei,
     e l'integrazione del ¹H sarebbe sbagliata su ogni molecola simmetrica. */
  att('ogni molecola dà il numero di segnali che la letteratura le attribuisce',
      0, sbagliati);

  console.log('\n── I rifiuti ──');
  att('uno SMILES illeggibile non produce uno spettro inventato', true,
      mis.rotto === 'null' || mis.rotto === 'errore');
  console.log('      (' + mis.rotto + ')');
  att('e una stringa vuota nemmeno', 'null', mis.vuoto);

  /* ── §3 · Il pannello nell'applicazione ─────────────────────────────────── */
  console.log('\n── Il pannello ──');
  const pan = await pg.evaluate(async () => {
    const out = {};
    out.sostituita = !!(window.ctrC13 && window.ctrC13.__bsiNmr);
    out.ripiego = typeof window.ctrC13Legacy;
    window.openChemDrawWith('CC(=O)Oc1ccccc1C(=O)O');
    await new Promise(r => setTimeout(r, 2500));
    const bot = [].filter.call(document.querySelectorAll('#bsi-chemdraw-ov button'),
                               b => /13C|¹³C/.test(b.textContent));
    out.scheda = bot.length;
    if (bot.length) { bot[0].click(); await new Promise(r => setTimeout(r, 3500)); }
    out.tela = !!document.getElementById('bsiNP-tela');
    out.righe = document.querySelectorAll('#bsiNP-tab tr[data-seg]').length;
    out.svg = !!document.querySelector('#bsiNP-dep svg');
    const s = window.BSINmrPannello.stato();
    out.n = s.segnali.length; out.smiles = s.smiles; out.errore = s.errore;
    /* clic su una riga → il segnale si accende e gli atomi si illuminano */
    const tr = document.querySelector('#bsiNP-tab tr[data-seg]');
    out.primaDelClic = window.BSINmrPannello.stato().acceso;
    if (tr) { tr.click(); await new Promise(r => setTimeout(r, 500)); }
    const s2 = window.BSINmrPannello.stato();
    out.dopoIlClic = s2.acceso;
    out.atomiAccesi = (s2.segnali.filter(x => x.nome === s2.acceso)[0] || {}).atomi;
    /* e il nucleo si cambia restando sulla stessa molecola */
    const h = document.querySelector('#bsi-chemdraw-ov [data-nuc="1H"]');
    if (h) { h.click(); await new Promise(r => setTimeout(r, 1500)); }
    const s3 = window.BSINmrPannello.stato();
    out.h = { nucleo: s3.nucleo, n: s3.segnali.length, smiles: s3.smiles };
    return out;
  });
  att('la scheda ¹³C passa dal motore nuovo', true, pan.sostituita);
  att('e l’originale resta come ripiego', 'function', pan.ripiego);
  att('la scheda esiste nell’editor', 1, pan.scheda);
  att('lo spettro si disegna', true, pan.tela);
  att('nessun errore nella predizione del pannello', null, pan.errore);
  att('l’aspirina dà i suoi nove segnali ¹³C', 9, pan.n);
  att('e la tabella ha una riga per segnale', 9, pan.righe);
  att('la struttura viene disegnata accanto', true, pan.svg);
  /* nei due versi: prima del clic nessun segnale è acceso, dopo sì */
  att('prima del clic nessun segnale è acceso', null, pan.primaDelClic);
  att('dopo il clic su una riga il segnale si accende', true, !!pan.dopoIlClic);
  att('e porta con sé gli atomi che lo producono', true,
      Array.isArray(pan.atomiAccesi) && pan.atomiAccesi.length > 0);
  console.log('      (segnale ' + pan.dopoIlClic + ' → atomi ' +
              JSON.stringify(pan.atomiAccesi) + ')');
  att('passando a ¹H resta la stessa molecola', 'CC(=O)Oc1ccccc1C(=O)O', pan.h.smiles);
  att('  · e i segnali sono quelli del ¹H', true, pan.h.nucleo === '1H' && pan.h.n > 0);

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 25) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 25');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
