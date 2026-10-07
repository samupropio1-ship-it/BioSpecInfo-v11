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
  ['2-butanone', 'CCC(C)=O', [209.3, 36.7, 29.3, 7.9]],
  /* I cinque problemi svolti del manuale di Metodi Fisici, con i ¹³C che la
     soluzione dichiara. Sono casi che lo studente deve saper risolvere, e
     quindi la misura giusta su cui farsi giudicare. */
  ['benzoato di etile', 'CCOC(=O)c1ccccc1', [166.6, 133.0, 130.4, 129.6, 128.3, 60.9, 14.3]],
  ['acetofenone', 'CC(=O)c1ccccc1', [198.1, 137.1, 133.1, 128.6, 128.3, 26.6]],
  ['4-metossiacetofenone', 'COc1ccc(cc1)C(C)=O', [196.8, 163.5, 130.6, 113.7, 55.5, 26.3]],
  ['butanoato di etile', 'CCCC(=O)OCC', [173.7, 60.2, 36.2, 18.5, 14.3, 13.7]],
  ['isobutano', 'CC(C)C', [25.0, 24.3]],
  /* Trovato dal banco dei documenti, non da qui: nel quesito del
     benzilacetato il confronto struttura↔dati segnalava che l'OCH₂ a 66,3
     non trovava corrispondenza. Un carbonio con DUE sostituenti in α — un
     ossigeno estereo e un anello aromatico — è il punto in cui uno schema
     additivo sbaglia di più, e la molecola entra in validazione proprio
     perché mostra dove cede. */
  ['acetato di benzile', 'CC(=O)OCc1ccccc1',
   [170.9, 136.0, 128.6, 128.2, 66.3, 21.0]]
];
/* ¹H: valori di letteratura in CDCl₃.
   Le ultime sei sono la prova delle CAPACITA' NUOVE: fino a ieri ogni H
   aromatico usciva a 7,26 e ogni H vinilico a 5,35, e queste molecole
   sarebbero state sbagliate di oltre mezzo ppm su quasi ogni segnale. */
const PROTONI = [
  ['etanolo', 'CCO', [3.72, 2.60, 1.25]],
  ['acetato di etile', 'CCOC(C)=O', [4.12, 2.04, 1.26]],
  ['acido acetico', 'CC(=O)O', [11.40, 2.10]],
  ['acetone', 'CC(C)=O', [2.17]],
  ['benzene', 'c1ccccc1', [7.26]],
  ['TMS', 'C[Si](C)(C)C', [0.00]],
  ['ciclopropano', 'C1CC1', [0.22]],
  ['benzaldeide', 'O=Cc1ccccc1', [10.02, 7.88, 7.60, 7.52]],
  ['anisolo', 'COc1ccccc1', [7.27, 6.93, 6.89, 3.80]],
  ['fenolo', 'Oc1ccccc1', [7.24, 6.94, 6.84, 5.20]],
  ['nitrobenzene', 'O=[N+]([O-])c1ccccc1', [8.22, 7.70, 7.55]],
  ['toluene', 'Cc1ccccc1', [7.25, 7.17, 2.32]],
  ['stirene', 'C=Cc1ccccc1', [7.40, 7.32, 7.25, 6.72, 5.74, 5.23]],
  ['1-butanolo', 'CCCCO', [3.57, 1.55, 1.39, 0.93]]
];
/* Le molecole su cui si vede se gli H aromatici sono ancora piatti: se il
   predittore tornasse a dare 7,26 a tutti, lo scarto su queste salirebbe
   subito sopra la soglia e il banco lo direbbe. Sono un sottoinsieme di
   PROTONI, misurate a parte perche' la media generale potrebbe nasconderle. */
const AROMATICI_1H = ['anisolo', 'fenolo', 'nitrobenzene', 'benzaldeide', 'stirene'];
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
    /* ── Le prove delle capacita' NUOVE, nei due versi ──────────────────
       Ognuna dice sia che la cosa funziona dove deve, sia che NON si applica
       dove non deve. Una tabella di incrementi che si applica dappertutto
       non e' una tabella, e' un offset. */
    const nuove = {};
    const sp = (smi, nuc) => window.BSINMR.predici(smi, { nucleo: nuc || '13C' });
    const ppmDi = r => (r && r.segnali) ? r.segnali.map(s => s.ppm) : [];

    /* a. gli H aromatici NON sono piu' piatti: il nitrobenzene li ha tutti
          oltre 7,5 e l'anisolo tutti sotto 7,4 */
    nuove.nitroMin = Math.min.apply(null, ppmDi(sp('O=[N+]([O-])c1ccccc1', '1H')));
    nuove.anisoloArMax = Math.max.apply(null,
      ppmDi(sp('COc1ccccc1', '1H')).filter(x => x > 2));
    /* e il benzene nudo resta al suo valore di base: nessun incremento */
    nuove.benzene1H = ppmDi(sp('c1ccccc1', '1H'))[0];

    /* b. un =CH₂ terminale da' DUE segnali, cis e trans; un =CH₂ senza
          sostituenti di fronte (l'etilene) ne da' uno solo */
    const st = sp('C=Cc1ccccc1', '1H');
    nuove.stireneVinilici = st.segnali.filter(s => /vinilic/i.test(s.etichetta)).length;
    nuove.etilene = ppmDi(sp('C=C', '1H')).length;

    /* c. l'estere visto dai due lati: l'OCH₂ dell'acetato di etile sta a 60,4
          e il CH₃ acilico a 21,0 — trentanove ppm di distanza con lo stesso
          gruppo in α */
    const ae = ppmDi(sp('CCOC(C)=O')).sort((x, y) => y - x);
    nuove.esterePiuAlto = ae[1];          /* dopo il carbonile */
    nuove.estereCH3 = ae[2];              /* il più alto fra i restanti */

    /* d. il composto di riferimento ciclico: il cicloesano nudo torna
          ESATTO per costruzione, e il cicloesanone non eredita il suo valore */
    nuove.cicloesano = ppmDi(sp('C1CCCCC1'))[0];
    nuove.cicloesanoneAlfa = ppmDi(sp('O=C1CCCCC1')).sort((x, y) => y - x)[1];
    /* mentre una catena aperta non passa dal riferimento ciclico */
    nuove.esano = ppmDi(sp('CCCCCC')).length;

    /* e. la tabella c'e' davvero, ed e' grande: se qualcuno la svuotasse,
          la predizione continuerebbe a dare numeri senza dirlo */
    const P = window.BSIPretsch || {};
    nuove.quanteAr13C = (P.AR13C || []).length;
    nuove.quanteAr1H = (P.AR1H || []).length;
    nuove.quanteEtilene = (P.ETILENE1H || []).length;
    nuove.quanteAlcani = (P.ALCANI1H || []).length;
    nuove.fonte = (P.fonte || '').slice(0, 20);

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
      vuoto: vuoto === null ? 'null' : 'oggetto',
      nuove: nuove
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
  /* La soglia si STRINGE quando il predittore migliora: era 2,5 quando lo
     scarto misurato era 1,93; con le correzioni steriche di Grant–Paul, il
     CH₂ in α distinto fra acido ed estere e le sovrapposizioni tolte fra gli
     incrementi, è sceso a 1,77. Lasciare 2,5 vorrebbe dire permettere al
     predittore di tornare indietro senza che nessuno se ne accorga. */
  sotto('lo scarto medio sulla validazione sta nel valore dichiarato', 1.3,
        +mis.validazione.medio.toFixed(2));
  /* Il caso peggiore: era 15,0 ppm (cicloesanone, che prendeva il valore del
     cicloesano nudo), sceso a 4,9 con il composto di riferimento ciclico.
     Ora è 7,5 — l'OCH₂ dell'acetato di benzile — e la soglia è SALITA, non
     perché il predittore sia peggiorato ma perché è entrata in validazione
     una molecola che mostra dove cede: un carbonio con due sostituenti in α.
     Alzare una soglia dopo aver trovato un caso peggiore è onesto solo se lo
     si dichiara anche nel pannello, e lì sta scritto. */
  sotto('  · e il caso peggiore sta nel valore dichiarato', 8.0,
        +mis.validazione.peggiore.toFixed(1));
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
    else console.log('      ' + x.nome.padEnd(20) + ' medio ' + x.med.toFixed(3));
  });
  att('nessuna molecola ¹H fallisce', 0, mis.protoni.length - mh.length);
  const medioH = mh.reduce((a, x) => a + x.med, 0) / mh.length;
  /* La soglia si STRINGE quando il predittore migliora. Era 0,5 quando i
     valori ¹H erano ventiquattro intorni fissi; con le tabelle di Pretsch lo
     scarto misurato è sceso a 0,08 su quattordici molecole, aromatici e
     vinilici compresi. Lasciarla a 0,5 vorrebbe dire permettere al
     predittore di tornare indietro senza che nessuno se ne accorga. */
  sotto('lo scarto medio ¹H sta nel valore dichiarato', 0.15, +medioH.toFixed(2));
  /* E separatamente gli aromatici, che prima erano tutti a 7,26: la media
     generale, tirata dagli alifatici che erano già buoni, li nasconderebbe. */
  const mAr = mh.filter(x => AROMATICI_1H.indexOf(x.nome) >= 0);
  att('le molecole aromatiche ¹H sono tutte misurate', AROMATICI_1H.length, mAr.length);
  const medioAr = mAr.reduce((a, x) => a + x.med, 0) / mAr.length;
  sotto('  · e il loro scarto sta nel valore dichiarato', 0.15, +medioAr.toFixed(2));

  /* ── §2-bis · Le capacità nuove, nei due versi ──────────────────────────── */
  console.log('\n── Le capacità nuove ──');
  const N = mis.nuove;
  /* a. gli incrementi aromatici ¹H: dove devono spostare, e dove no */
  att('il nitrobenzene ha TUTTI gli H aromatici oltre 7,5', true, N.nitroMin > 7.5);
  console.log('      (il più schermato a ' + N.nitroMin + ')');
  att('l’anisolo li ha TUTTI sotto 7,4', true, N.anisoloArMax < 7.4);
  console.log('      (il più deschermato a ' + N.anisoloArMax + ')');
  att('e il benzene nudo resta al valore di base, senza incrementi',
      7.34, N.benzene1H);
  /* b. il =CH₂ terminale: due segnali quando c'è qualcosa di fronte, uno no */
  att('lo stirene dà TRE segnali vinilici (CH, =CH₂ cis, =CH₂ trans)',
      3, N.stireneVinilici);
  att('ma l’etilene, che non ha nulla di fronte, ne dà uno solo', 1, N.etilene);
  /* c. l'estere dai due lati */
  att('l’OCH₂ dell’acetato di etile sta oltre 55 ppm', true, N.esterePiuAlto > 55);
  att('mentre ogni altro suo carbonio sta sotto 25: lo stesso gruppo, due valori',
      true, N.estereCH3 < 25);
  console.log('      (' + N.esterePiuAlto + ' e ' + N.estereCH3 + ')');
  /* d. il composto di riferimento ciclico */
  att('il cicloesano torna esatto per costruzione', 26.9, N.cicloesano);
  att('ma il cicloesanone NON eredita quel valore sui carboni in α',
      true, N.cicloesanoneAlfa > 35);
  console.log('      (α al carbonile: ' + N.cicloesanoneAlfa + ' ppm)');
  att('e una catena aperta dà i suoi carboni senza riferimento ciclico',
      3, N.esano);
  /* e. le tabelle ci sono, e sono quelle grandi */
  att('la tabella ¹³C dei benzeni ha più di settanta righe', true, N.quanteAr13C > 70);
  att('la tabella ¹H dei benzeni ha più di cinquanta righe', true, N.quanteAr1H > 50);
  att('la tabella degli etileni ha più di trenta righe', true, N.quanteEtilene > 30);
  att('la tabella degli alcani ha più di venticinque righe', true, N.quanteAlcani > 25);
  att('e la fonte è dichiarata', 'Pretsch, Bühlmann,', N.fonte.slice(0, 18));
  console.log('      (' + N.quanteAr13C + ' + ' + N.quanteAr1H + ' + ' +
              N.quanteEtilene + ' + ' + N.quanteAlcani + ' righe)');

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

  /* ── §4 · La cronologia delle molecole ──────────────────────────────────
     Serve a confrontare due spettri senza ridisegnare la prima molecola. Si
     verifica nei DUE versi: che ricordi quello che deve, e che NON ricordi
     quello che non deve — uno SMILES illeggibile non e' una molecola su cui
     si tornera', e due scritture della stessa molecola non sono due voci. */
  console.log('\n── La cronologia ──');
  const cro = await pg.evaluate(async () => {
    const P = window.BSINmrPannello;
    P.svuotaStoria();
    const out = {};
    out.parteVuota = P.storia().length;
    P.prevediDi('CCO');
    P.prevediDi('c1ccccc1');
    out.dopoDue = P.storia().length;
    out.inCima = P.storia()[0].smiles;
    /* lo stesso etanolo scritto al contrario: stessa molecola, stessa voce */
    P.prevediDi('OCC');
    out.dopoIlDoppione = P.storia().length;
    out.doppioneInCima = P.storia()[0].smiles;
    /* una struttura illeggibile non entra */
    P.prevediDi('questo non e uno smiles');
    out.dopoLoScarto = P.storia().length;
    /* di ogni voce si tiene l'InChI e la sua chiave, non solo lo SMILES */
    const e = P.storia().filter(x => /CCO/.test(x.smiles))[0] || {};
    out.inchi = e.inchi || '';
    out.chiave = e.chiave || '';
    /* e sopravvive a un rimontaggio del pannello */
    const body = document.querySelector('#bsi-chemdraw-ov .bsi-cd-body') ||
                 document.getElementById('ctrC13');
    if (body) P.montaIn(body, 'CCO');
    await new Promise(r => setTimeout(r, 1200));
    out.dopoIlRimontaggio = P.storia().length;
    /* Si guarda DENTRO il pannello appena montato, non in tutta la pagina:
       montati in due posti, i due pannelli hanno elementi con lo stesso id e
       una ricerca su `document` li conterebbe tutti. E' la stessa ragione per
       cui il pannello cerca a partire dalla propria radice. */
    const str = body ? body.querySelector('#bsiNP-storia') : null;
    out.chip = str ? str.querySelectorAll('[data-st]').length : -1;
    /* e un clic su una voce riporta quella molecola sul tavolo */
    const chips = str ? str.querySelectorAll('[data-st]') : [];
    if (chips.length > 1) { chips[1].click(); await new Promise(r => setTimeout(r, 900)); }
    out.dopoIlClic = P.stato().smiles;
    P.svuotaStoria();
    out.dopoLoSvuotamento = P.storia().length;
    return out;
  });
  att('parte vuota', 0, cro.parteVuota);
  att('due molecole previste, due voci', 2, cro.dopoDue);
  att('e l’ultima sta in cima', 'c1ccccc1', cro.inCima);
  att('lo stesso etanolo scritto «OCC» non fa una voce nuova', 2, cro.dopoIlDoppione);
  att('  · ma risale in cima, perché è quella su cui si lavora adesso',
      'CCO', cro.doppioneInCima);
  att('uno SMILES illeggibile non entra in cronologia', 2, cro.dopoLoScarto);
  att('di ogni voce si tiene l’InChI', true, /^InChI=/.test(cro.inchi));
  att('  · e la sua chiave', true, /^[A-Z]{14}-[A-Z]{10}-[A-Z]$/.test(cro.chiave));
  console.log('      (' + cro.inchi + ' · ' + cro.chiave + ')');
  att('sopravvive al rimontaggio del pannello', 2, cro.dopoIlRimontaggio);
  att('  · e si vede, una pastiglia per voce', 2, cro.chip);
  att('un clic su una voce la riporta sul tavolo', true, !!cro.dopoIlClic);
  console.log('      (' + cro.dopoIlClic + ')');
  att('e si può svuotare', 0, cro.dopoLoSvuotamento);

  /* ── §5 · La sincronia picco ↔ struttura ↔ 3D ───────────────────────────
     È la cosa per cui esiste `bsi-geom3d.js`: un picco cliccato deve
     accendere GLI STESSI atomi nella struttura piatta e nel modello
     tridimensionale. Perché sia lecito, l'atomo numero k deve essere lo
     stesso atomo nei tre posti — e questo si verifica, non si suppone. */
  console.log('\n── Picco ↔ struttura ↔ 3D ──');
  const tre = await pg.evaluate(async () => {
    const P = window.BSINmrPannello, out = {};
    const body = document.querySelector('#bsi-chemdraw-ov .bsi-cd-body') ||
                 document.getElementById('ctrC13');
    P.montaIn(body, 'CC(=O)Oc1ccccc1C(=O)O');
    await new Promise(r => setTimeout(r, 2500));
    out.spentoPrima = (body.querySelector('#bsiNP-tre') || {}).style
      ? body.querySelector('#bsiNP-tre').style.display : 'assente';
    out.acceso = P.mostra3d(true);
    await new Promise(r => setTimeout(r, 2500));
    const v = P.visore3d();
    out.visore = !!v;
    out.illuminatiPrima = v ? v.illuminati().length : -1;
    /* si clicca una riga: il segnale si accende e gli atomi con lui */
    const tr = body.querySelector('#bsiNP-tab tr[data-seg]');
    if (tr) { tr.click(); await new Promise(r => setTimeout(r, 900)); }
    const st = P.stato();
    const seg = st.segnali.filter(x => x.nome === st.acceso)[0] || {};
    out.atomiDelSegnale = (seg.atomi || []).slice();
    out.illuminatiDopo = P.visore3d() ? P.visore3d().illuminati() : [];
    /* e si rispegne cliccando di nuovo */
    if (tr) { tr.click(); await new Promise(r => setTimeout(r, 900)); }
    out.illuminatiDopoIlSecondo = P.visore3d() ? P.visore3d().illuminati().length : -1;
    /* la tela esiste e ha dei pixel diversi dal fondo */
    const c = body.querySelector('#bsiNP-tela3d');
    out.tela = !!c;
    if (c) {
      const g = c.getContext('2d');
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let diversi = 0;
      for (let i = 0; i < d.length; i += 4 * 97) {
        if (d[i] > 40 || d[i + 1] > 40 || d[i + 2] > 60) diversi++;
      }
      out.pixelDisegnati = diversi;
    }
    return out;
  });
  att('la tela 3D parte nascosta', 'none', tre.spentoPrima);
  att('il bottone 3D la mostra', true, tre.acceso);
  att('e il visore si monta', true, tre.visore);
  att('prima del clic non c’è niente di illuminato', 0, tre.illuminatiPrima);
  att('dopo il clic su una riga gli atomi si illuminano anche in 3D', true,
      tre.illuminatiDopo.length > 0);
  /* LA PROVA: sono GLI STESSI atomi, non un numero uguale di atomi diversi */
  att('  · e sono esattamente quelli del segnale', JSON.stringify(tre.atomiDelSegnale),
      JSON.stringify(tre.illuminatiDopo));
  att('un secondo clic li rispegne', 0, tre.illuminatiDopoIlSecondo);
  att('la molecola viene disegnata davvero', true, tre.tela && tre.pixelDisegnati > 5);
  console.log('      (' + tre.pixelDisegnati + ' campioni non di fondo)');

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 62) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 62');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
