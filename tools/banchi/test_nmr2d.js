/* ═══════════════════════════════════════════════════════════════════════════
   test_nmr2d — una mappa di correlazioni si verifica contando i cammini

   PERCHE' QUESTO BANCO ESISTE

   Uno spettro bidimensionale è un rettangolo con delle macchie: se le macchie
   sono nel posto sbagliato, o se ce ne sono di troppo, il disegno sembra lo
   stesso. Anzi, sembra più ricco.

   Ma una mappa di correlazioni non è un'opinione: è topologia. Un HSQC ha
   esattamente una macchia per ogni carbonio che porta idrogeni — non una di
   più — e un COSY del benzene ha SOLO la diagonale, perché i sei protoni sono
   lo stesso segnale e due protoni equivalenti non si accoppiano in modo
   osservabile. Sono numeri che si contano a mano sulla struttura, ed è così
   che si verifica.

   Le prove stanno nei due versi: dove la correlazione ci deve essere e dove
   NON ci deve essere. Un HMBC che collegasse tutto con tutto passerebbe
   qualunque prova scritta solo nel primo verso.

   USO   node tools/banchi/test_nmr2d.js    (serve un server su :8899)
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

  console.log('NMR bidimensionale — COSY, HSQC, HMBC contati sul grafo\n');

  console.log('── Il motore ──');
  att('BSINMR2D è caricato', 'object',
      await pg.evaluate(() => typeof window.BSINMR2D));

  const m = await pg.evaluate(async () => {
    await new Promise(r => window.bsiLoadRDKit(r));
    const D = window.BSINMR2D;
    const out = {};
    const p = (smi, tipo) => D.prevedi(smi, { tipo: tipo });

    /* ── HSQC: una macchia per ogni C che porta H, e nessun'altra ───────── */
    /* acetato di etile CCOC(C)=O: tre carboni con idrogeni (OCH₂, CH₃ etile,
       CH₃ acetile) e due senza (il carbonile e nessun altro) */
    const h1 = p('CCOC(C)=O', 'HSQC');
    out.hsqcEstere = h1.picchi.length;
    out.hsqcEstereSegni = h1.picchi.map(x => x.segno).sort().join(',');
    /* il benzene: un solo segnale, una sola macchia */
    out.hsqcBenzene = p('c1ccccc1', 'HSQC').picchi.length;
    /* il toluene: quattro intorni con H (CH₃, orto, meta, para) */
    out.hsqcToluene = p('Cc1ccccc1', 'HSQC').picchi.length;
    /* e nei due versi: una molecola SENZA idrogeni sui carboni non dà
       nessuna macchia HSQC. L'esafluorobenzene non ne ha uno. */
    out.hsqcSenzaH = p('Fc1c(F)c(F)c(F)c(F)c1F', 'HSQC').picchi.length;
    /* il segno: in un HSQC editato i CH₂ escono dalla parte opposta */
    const hb = p('CCCCO', 'HSQC');
    out.hsqcButanoloNeg = hb.picchi.filter(x => x.segno < 0).length;   /* 3 CH₂ */
    out.hsqcButanoloPos = hb.picchi.filter(x => x.segno > 0).length;   /* 1 CH₃ */

    /* ── COSY: la diagonale sempre, le macchie solo fra vicini diversi ──── */
    const c1 = p('CCO', 'COSY');
    out.cosyEtanoloDiag = c1.diagonale.length;      /* CH₃, CH₂, OH */
    out.cosyEtanoloFuori = c1.picchi.length;        /* CH₃↔CH₂, in due versi */
    /* IL CASO CHE CONTA: nel benzene i sei protoni sono equivalenti, quindi
       SOLO la diagonale. Una mappa disegnata a caso avrebbe delle macchie. */
    const c2 = p('c1ccccc1', 'COSY');
    out.cosyBenzeneDiag = c2.diagonale.length;
    out.cosyBenzeneFuori = c2.picchi.length;
    /* e l'acetone, dove i due metili sono equivalenti E non sono nemmeno
       vicini: niente macchie fuori diagonale */
    out.cosyAcetoneFuori = p('CC(C)=O', 'COSY').picchi.length;
    /* mentre il toluene ne ha: orto↔meta e meta↔para */
    out.cosyTolueneFuori = p('Cc1ccccc1', 'COSY').picchi.length;
    /* l'OH non accoppia in modo osservabile: non compare fuori diagonale */
    out.cosyEtanoloConOH = c1.picchi.filter(x => /O–H|OH/.test(x.etichetta)).length;

    /* ── HMBC: due e tre legami, mai uno ────────────────────────────────── */
    const m1 = p('CCOC(C)=O', 'HMBC');
    out.hmbcEstere = m1.picchi.length;
    /* il carbonile non ha protoni suoi ma si vede: il CH₃ acetile lo tocca a
       due legami e l'OCH₂ a tre. È il motivo per cui l'HMBC esiste. */
    out.hmbcCarbonile = (function () {
      const c = p('CCOC(C)=O', 'HMBC');
      const car = c.segnali13C.filter(s => s.ppm > 160)[0];
      if (!car) return 'nessun carbonile previsto';
      return c.picchi.filter(x => Math.abs(x.x - car.ppm) < 0.01).length;
    })();
    /* e nei due versi: nessuna macchia a UN legame — quella è dell'HSQC.
       Si verifica che per ogni macchia il cammino dichiarato sia ²J o ³J. */
    out.hmbcCamminiStrani = m1.picchi.filter(x => !/[²³]J/.test(x.dettaglio)).length;
    /* e il metano, che non ha nessun carbonio a due o tre legami, non dà
       nessuna macchia HMBC pur avendo quattro protoni */
    out.hmbcMetano = p('C', 'HMBC').picchi.length;

    /* ── Gli assi ────────────────────────────────────────────────────────── */
    out.assiHSQC = h1.asseX.nucleo + '/' + h1.asseY.nucleo;
    out.assiCOSY = c1.asseX.nucleo + '/' + c1.asseY.nucleo;

    /* ── I rifiuti ───────────────────────────────────────────────────────── */
    const rotto = D.prevedi('questo non e uno smiles', { tipo: 'HSQC' });
    out.rotto = rotto === null ? 'null' : (rotto.errore ? 'errore' : 'picchi:' + rotto.picchi.length);
    out.vuoto = D.prevedi('', { tipo: 'HSQC' }) === null ? 'null' : 'oggetto';
    /* un tipo inventato non inventa una mappa: ricade su HSQC e lo dichiara */
    out.tipoStrano = D.prevedi('CCO', { tipo: 'NOESY' }).tipo;

    /* ── Il disegno ──────────────────────────────────────────────────────── */
    const tela = document.createElement('canvas');
    tela.width = 520; tela.height = 380;
    const mappa = D.disegna(tela, h1, {});
    out.disegnato = !!(mappa && mappa.X && mappa.Y);
    const dd = tela.getContext('2d').getImageData(0, 0, tela.width, tela.height).data;
    let colorati = 0;
    for (let i = 0; i < dd.length; i += 4 * 53) {
      if (dd[i + 1] > 90 && dd[i + 2] > 90) colorati++;
    }
    out.pixelMacchie = colorati;
    /* gli assi vanno a decrescere: δ grande a SINISTRA e in ALTO */
    out.assiVerso = (mappa.X(10) > mappa.X(200)) && (mappa.Y(1) > mappa.Y(9));
    /* e si ritrova una macchia da dove è stata disegnata */
    const q = h1.picchi[0];
    const trovata = D.vicinoA(h1, mappa, mappa.X(q.x), mappa.Y(q.y), 10);
    out.ritrovata = !!(trovata && trovata.etichetta === q.etichetta);
    /* ma non se ne trova una dove non ce n'è */
    out.nonTrovata = D.vicinoA(h1, mappa, 5, 5, 10) === null;

    out.csv = D.csvDa(h1).split('\n').length;
    return out;
  });

  console.log('\n── HSQC: un protone e il suo carbonio ──');
  /* L'acetato di etile ha tre carboni con idrogeni: si contano sulla
     struttura, non si chiedono al programma. */
  att('l’acetato di etile dà tre macchie, una per carbonio protonato',
      3, m.hsqcEstere);
  att('il benzene, che ha un solo intorno, ne dà una', 1, m.hsqcBenzene);
  att('il toluene ne dà quattro', 4, m.hsqcToluene);
  /* La prova contraria: senza idrogeni sui carboni non c'è HSQC. */
  att('l’esafluorobenzene, che non ha idrogeni, non ne dà nessuna',
      0, m.hsqcSenzaH);
  console.log('\n   · il segno, come in un HSQC editato');
  att('il 1-butanolo ha tre CH₂, e tre macchie negative', 3, m.hsqcButanoloNeg);
  att('  · e un CH₃, con una macchia positiva', 1, m.hsqcButanoloPos);

  console.log('\n── COSY: due protoni a tre legami ──');
  att('l’etanolo ha tre segnali ¹H sulla diagonale', 3, m.cosyEtanoloDiag);
  att('  · e una coppia fuori diagonale, in due versi', 2, m.cosyEtanoloFuori);
  /* Questa è la prova che distingue una mappa calcolata da una disegnata. */
  att('il benzene ha la diagonale', 1, m.cosyBenzeneDiag);
  att('  · e NESSUNA macchia fuori: i sei protoni sono equivalenti',
      0, m.cosyBenzeneFuori);
  att('l’acetone nemmeno: i due metili sono equivalenti e lontani',
      0, m.cosyAcetoneFuori);
  att('il toluene invece sì: orto↔meta e meta↔para', 4, m.cosyTolueneFuori);
  att('e l’O–H, che si scambia col solvente, non compare fuori diagonale',
      0, m.cosyEtanoloConOH);

  console.log('\n── HMBC: due e tre legami ──');
  att('l’acetato di etile dà le sue correlazioni', true, m.hmbcEstere >= 4);
  console.log('      (' + m.hmbcEstere + ' macchie)');
  /* È il motivo per cui l'HMBC esiste: vedere un carbonio senza protoni. */
  att('il carbonile, che non ha protoni suoi, si vede lo stesso',
      true, typeof m.hmbcCarbonile === 'number' && m.hmbcCarbonile >= 2);
  console.log('      (' + m.hmbcCarbonile + ' protoni lo toccano)');
  att('ogni macchia dichiara un cammino a due o tre legami, mai a uno',
      0, m.hmbcCamminiStrani);
  /* La prova contraria: il metano ha protoni ma nessun carbonio a due o tre
     legami, quindi nessuna macchia. */
  att('il metano, che non ha un secondo carbonio, non dà nessuna macchia',
      0, m.hmbcMetano);

  console.log('\n── Gli assi ──');
  att('l’HSQC ha ¹³C in ascissa e ¹H in ordinata', '13C/1H', m.assiHSQC);
  att('il COSY ha ¹H su entrambi', '1H/1H', m.assiCOSY);
  att('e vanno a decrescere, come si disegna un NMR', true, m.assiVerso);

  console.log('\n── I rifiuti ──');
  att('uno SMILES illeggibile non produce una mappa inventata', true,
      m.rotto === 'null' || m.rotto === 'errore');
  att('e una stringa vuota nemmeno', 'null', m.vuoto);
  att('un tipo inventato ricade su HSQC e lo dichiara', 'HSQC', m.tipoStrano);

  console.log('\n── Il disegno ──');
  att('la mappa si disegna', true, m.disegnato);
  att('e ci sono macchie, non un rettangolo vuoto', true, m.pixelMacchie > 3);
  console.log('      (' + m.pixelMacchie + ' campioni colorati)');
  att('una macchia si ritrova da dove è stata disegnata', true, m.ritrovata);
  att('  · ma non se ne trova una dove non ce n’è', true, m.nonTrovata);
  att('e l’uscita CSV ha una riga per macchia più l’intestazione',
      4, m.csv);

  /* ── §2 · La mappa nel pannello, e il collegamento con la struttura ─────
     Una mappa che non si può interrogare è una figura. La prova sta nei due
     versi: cliccando una macchia gli atomi si illuminano, e cliccando dove
     non c'è niente si spengono. */
  console.log('\n── La mappa nel pannello ──');
  const pan = await pg.evaluate(async () => {
    const P = window.BSINmrPannello, out = {};
    const body = document.querySelector('#bsi-chemdraw-ov .bsi-cd-body') ||
                 document.getElementById('ctrC13');
    P.montaIn(body, 'CCOC(C)=O');
    await new Promise(r => setTimeout(r, 2200));
    out.spentaPrima = body.querySelector('#bsiNP-due').style.display;
    out.tipo = P.mostra2d('HSQC');
    await new Promise(r => setTimeout(r, 1200));
    out.visibile = body.querySelector('#bsiNP-due').style.display;
    const s0 = P.stato2d();
    out.picchi = s0.picchi;
    out.accesoPrima = s0.acceso;
    out.atomiPrima = s0.atomi.length;
    /* si clicca una macchia: gli atomi che la producono si illuminano */
    const p = P.cliccaMacchia(0);
    await new Promise(r => setTimeout(r, 600));
    const s1 = P.stato2d();
    out.accesoDopo = !!s1.acceso;
    out.atomiDopo = s1.atomi.slice();
    out.atomiDellaMacchia = p ? (p.atomi || []).slice() : null;
    /* e passando a COSY la mappa cambia davvero */
    P.mostra2d('COSY');
    await new Promise(r => setTimeout(r, 1200));
    out.cosy = P.stato2d().picchi;
    /* spegnendo, la sezione sparisce */
    P.mostra2d(null);
    await new Promise(r => setTimeout(r, 400));
    out.spentaDopo = body.querySelector('#bsiNP-due').style.display;
    return out;
  });
  att('la sezione 2D parte nascosta', 'none', pan.spentaPrima);
  att('il bottone HSQC la mostra', 'HSQC', pan.tipo);
  att('  · e diventa visibile', '', pan.visibile);
  att('con le macchie dell’acetato di etile', 3, pan.picchi);
  att('prima del clic nessuna macchia è accesa', null, pan.accesoPrima);
  att('  · e nessun atomo è illuminato dalla mappa', 0, pan.atomiPrima);
  att('dopo il clic la macchia si accende', true, pan.accesoDopo);
  /* LA PROVA: sono GLI STESSI atomi della macchia, non un numero uguale */
  att('  · e illumina esattamente i suoi atomi',
      JSON.stringify(pan.atomiDellaMacchia), JSON.stringify(pan.atomiDopo));
  /* Due, non quattro: nell'acetato di etile l'unica coppia di protoni a tre
     legami è CH₃–CH₂ dell'etile, e dà le sue due macchie simmetriche. Il
     metile acetilico non ha protoni vicini — sta su un carbonio attaccato
     solo al carbonile. Contarne quattro era un errore mio, non del modulo. */
  att('passando a COSY la mappa cambia: due macchie, non tre', 2, pan.cosy);
  att('e spegnendola la sezione sparisce', 'none', pan.spentaDopo);

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 38) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 38');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
