/* ═══════════════════════════════════════════════════════════════════════════
   test_spettrolettore — leggere uno spettro, e i modelli che ne seguono

   PERCHE' QUESTO BANCO ESISTE

   Un lettore di spettri sbaglia in silenzio. Se il decodificatore JCAMP-DX
   legge male, non si rompe: produce una curva — storta, ma una curva. Se il
   rilevatore di picchi e' troppo sensibile trova trenta picchi dove ce ne
   sono tre, e se e' troppo rigido non ne trova nessuno. In nessuno dei tre
   casi compare un messaggio d'errore.

   Qui si parte da spettri COSTRUITI, di cui si conoscono i centri delle
   gaussiane, e si pretende che il lettore li ritrovi — e che non ne trovi
   altri. E il decodificatore ASDF si verifica sui suoi simboli uno per uno:
   @ABCDEFGHI sono 0..9, abcdefghi sono −1..−9, e `n` vale −5, non −4.

   I MODELLI

   ESOL e i filtri di drug-likeness sono equazioni e soglie PUBBLICATE: si
   verificano contro valori sperimentali di letteratura e contro il conto a
   mano, non contro sé stessi. La foresta casuale si verifica su una relazione
   non lineare costruita apposta, e si pretende che sia DETERMINISTICA a parita'
   di seme: un modello che cambia risposta a ogni esecuzione non si puo'
   verificare, e uno che non si puo' verificare non si puo' usare per decidere.

   USO   node tools/banchi/test_spettrolettore.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto){
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function sotto(d, limite, avuto){
  eseguiti++;
  if (avuto <= limite) { ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (limite ' + limite + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      limite: ' + limite + '\n      avuto:  ' + avuto); }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1200, height: 1000 } })).newPage();
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

  console.log('Lettore di spettri e modelli avanzati\n');

  /* ── §1 · Il decodificatore ASDF, simbolo per simbolo ────────────────── */
  console.log('── JCAMP-DX ──');
  const asdf = await pg.evaluate(() => {
    const S = window.BSILettoreSpettri;
    if (!S) return { assente: true };
    const casi = [
      ['@ABCDEFGHI', [0,1,2,3,4,5,6,7,8,9]],
      ['abcdefghi',  [-1,-2,-3,-4,-5,-6,-7,-8,-9]],
      ['A23',        [123]],
      ['99',         [99]]
    ];
    return { assente: false, esiti: casi.map(function (c) {
      return { in: c[0], atteso: JSON.stringify(c[1]),
               avuto: JSON.stringify(S.decodificaASDF(c[0]).valori) };
    }) };
  });
  if (asdf.assente) { ko++; eseguiti++; console.log('  ✗ il modulo non è caricato'); }
  else asdf.esiti.forEach(function (e) {
    att('ASDF «' + e.in + '»', e.atteso, e.avuto);
  });

  const jc = await pg.evaluate(() => {
    const S = window.BSILettoreSpettri;
    /* esplicito */
    const a = S.leggi(['##TITLE=prova','##JCAMP-DX=4.24','##DATA TYPE=INFRARED SPECTRUM',
      '##XUNITS=1/CM','##YUNITS=ABSORBANCE','##XFACTOR=1','##YFACTOR=1','##FIRSTX=1000',
      '##LASTX=1004','##NPOINTS=5','##XYPOINTS=(XY..XY)',
      '1000 0.10','1001 0.50','1002 0.90','1003 0.40','1004 0.05','##END='].join('\n'));
    /* compresso in DIF: y = 10, 12, 15, 15, 15, 10 — «n» vale −5 */
    const c = S.leggi(['##TITLE=dif','##JCAMP-DX=4.24','##DATA TYPE=INFRARED SPECTRUM',
      '##XFACTOR=1','##YFACTOR=1','##FIRSTX=1000','##LASTX=1005','##NPOINTS=6',
      '##XYDATA=(X++(Y..Y))','1000 10KL%%n','##END='].join('\n'));
    /* due colonne */
    const d = S.leggi('1 2\n2 4\n3 6\n');
    return { formatoA: a && a.formato, yA: a ? JSON.stringify(a.y) : null,
             titoloA: a ? a.titolo : null, tipoA: a ? a.tipo : null,
             yC: c ? JSON.stringify(c.y) : null, xC: c ? JSON.stringify(c.x) : null,
             formatoD: d && d.formato, puntiD: d ? d.x.length : 0 };
  });
  att('un JCAMP esplicito si legge', 'JCAMP-DX', jc.formatoA);
  att('  · con i suoi valori', '[0.1,0.5,0.9,0.4,0.05]', jc.yA);
  att('  · e il suo titolo', 'prova', jc.titoloA);
  att('un JCAMP compresso in DIF si decomprime', '[10,12,15,15,15,10]', jc.yC);
  att('  · e le x si ricostruiscono dall’intervallo',
      '[1000,1001,1002,1003,1004,1005]', jc.xC);
  att('due colonne si leggono comunque', 3, jc.puntiD);

  /* ── §2 · I picchi, su spettri costruiti ─────────────────────────────── */
  console.log('\n── I picchi ──');
  const pk = await pg.evaluate(() => {
    const S = window.BSILettoreSpettri;
    function g(v, c, a, w) { return a * Math.exp(-Math.pow(v - c, 2) / (2 * w * w)); }
    let seme = 12345;
    function caso() { seme = (seme * 1103515245 + 12345) & 0x7fffffff; return seme / 0x7fffffff - 0.5; }
    const x = [], y = [];
    for (let v = 400; v <= 4000; v += 2) {
      x.push(v);
      y.push(g(v,1715,100,12) + g(v,2950,60,25) + g(v,3400,45,60) + 2 + caso() * 1.5);
    }
    const an = S.analizza({ x: x, y: y, tipo: 'INFRARED SPECTRUM',
                            unitaY: 'ABSORBANCE', formato: 'prova' }, { tipo: 'ir' });
    /* e uno spettro PIATTO: non deve trovare niente */
    const xp = [], yp = [];
    for (let v = 400; v <= 1400; v += 2) { xp.push(v); yp.push(5 + caso() * 0.5); }
    const piatto = S.analizza({ x: xp, y: yp, tipo: 'INFRARED SPECTRUM',
                                unitaY: 'ABSORBANCE' }, { tipo: 'ir' });
    return { quanti: an.picchi.length,
             centri: an.picchi.map(p => Math.round(p.x)).sort((a,b) => a-b),
             piatto: piatto.picchi.length,
             assegnazioni: an.bande[0].assegnazioni.map(a => a.legame + ' ' + a.nota) };
  });
  att('sui tre picchi costruiti ne trova tre', 3, pk.quanti);
  att('  · e sono quelli giusti (±2 cm⁻¹)', true,
      pk.centri.length === 3 && Math.abs(pk.centri[0]-1715) <= 2 &&
      Math.abs(pk.centri[1]-2950) <= 2 && Math.abs(pk.centri[2]-3400) <= 2);
  console.log('      (trovati: ' + pk.centri.join(', ') + ' · attesi 1715, 2950, 3400)');
  /* la guardia opposta: su rumore puro non deve trovare picchi, altrimenti
     i tre di sopra non dimostrano niente */
  att('su rumore puro non ne trova nessuno', 0, pk.piatto);
  att('e la banda a 1715 ha più assegnazioni compatibili, non una', true,
      pk.assegnazioni.length >= 2);
  console.log('      (' + pk.assegnazioni.join(' | ') + ')');

  /* ── §2-bis · Uno spettro letto da una IMMAGINE ──────────────────────── */
  console.log('\n── Dall\u2019immagine ──');
  const img = await pg.evaluate(async () => {
    const S = window.BSILettoreSpettri;
    function tela(disegna) {
      const W = 900, H = 300, c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      disegna(x, W, H);
      return c.toDataURL();
    }
    async function carica(url) {
      const im = new Image(); im.src = url;
      await new Promise(r => { im.onload = r; });
      return im;
    }
    function g(v, ctr, amp, wid) { return amp * Math.exp(-Math.pow(v - ctr, 2) / (2 * wid * wid)); }
    /* una figura con tre gaussiane a posizioni NOTE */
    const buona = await carica(tela(function (x, W, H) {
      x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath();
      for (let i = 0; i < W; i++) {
        const cm = 4000 - (4000 - 400) * i / (W - 1);
        const y = H - 20 - (g(cm, 1715, 120, 14) + g(cm, 2950, 70, 28) + g(cm, 3400, 55, 65));
        if (i === 0) x.moveTo(i, y); else x.lineTo(i, y);
      }
      x.stroke();
    }));
    /* e un foglio BIANCO: non c'è traccia, e il lettore deve dirlo */
    const bianca = await carica(tela(function () {}));
    const sp = S.daImmagine(buona, { xDa: 4000, xA: 400, unitaX: 'cm-1' });
    const an = (sp && !sp.errore) ? S.analizza(sp, { tipo: 'ir' }) : null;
    const vuota = S.daImmagine(bianca, { xDa: 4000, xA: 400 });
    return {
      colonne: sp && sp.colonne, punti: sp && sp.x ? sp.x.length : 0,
      picchi: an ? an.picchi.map(q => Math.round(q.x)).sort((a2, b2) => a2 - b2) : [],
      avviso: !!(sp && sp.avviso),
      primo: sp && sp.x ? Math.round(sp.x[0]) : null,
      ultimo: sp && sp.x ? Math.round(sp.x[sp.x.length - 1]) : null,
      erroreSuBianca: !!(vuota && vuota.errore),
      messaggioBianca: vuota && vuota.errore ? String(vuota.errore).slice(0, 60) : ''
    };
  });
  att('una figura si legge colonna per colonna', 900, img.colonne);
  att('  · e produce una curva completa', 900, img.punti);
  att('i tre picchi costruiti si ritrovano (±6 cm⁻¹)', true,
      img.picchi.length === 3 && Math.abs(img.picchi[0] - 1715) <= 6 &&
      Math.abs(img.picchi[1] - 2950) <= 6 && Math.abs(img.picchi[2] - 3400) <= 6);
  console.log('      (letti dai pixel: ' + img.picchi.join(', ') + ' · attesi 1715, 2950, 3400)');
  /* l'IR si scrive 4000 → 400 ma tutto il lettore vuole x crescenti: se non
     venissero riordinate, i picchi uscirebbero specchiati */
  att('le x vengono riordinate crescenti', true, img.primo < img.ultimo);
  /* la guardia opposta: su un foglio bianco non deve INVENTARE una traccia */
  att('su un foglio bianco rifiuta invece di inventare una curva', true, img.erroreSuBianca);
  console.log('      (' + img.messaggioBianca + '…)');
  /* e deve dire che la taratura non viene dall'immagine */
  att('e dichiara che la scala non sta nei pixel', true, img.avviso);

  /* ── §3 · Curva o lista di picchi ────────────────────────────────────── */
  console.log('\n── Curva o lista ──');
  const cl = await pg.evaluate(() => {
    const S = window.BSILettoreSpettri;
    const curva = [], lista = [39, 51, 65, 91, 92, 93];
    for (let v = 500; v <= 4000; v += 4) curva.push(v);
    return { curvaEListaNo: S.eListaDiPicchi(curva),
             listaESiLista: S.eListaDiPicchi(lista),
             tipoLista: S.tipoDa({ x: lista, y: [12,18,42,100,68,5], tipo: '' }) };
  });
  /* due versi: una curva campionata ogni 4 cm⁻¹ NON è una lista, e sei righe
     di m/z lo sono. Confonderle è ciò che rendeva inutile lo spettro di massa */
  att('una curva campionata fitta non è una lista di picchi', false, cl.curvaEListaNo);
  att('e sei righe di m/z lo sono', true, cl.listaESiLista);
  att('  · riconosciute come spettro di massa', 'ms', cl.tipoLista);

  const ms = await pg.evaluate(() => {
    const S = window.BSILettoreSpettri;
    /* toluene: M⁺ 92, tropilio 91 (perdita di H), 65 (perdita di C2H2 da 91) */
    const an = S.analizza({ x: [39,51,65,91,92,93], y: [12,18,42,100,68,5], tipo: '' });
    return { tipo: an.tipo, piccoBase: an.piccoBase ? an.piccoBase.x : null,
             piuPesante: an.ionePiuPesante ? an.ionePiuPesante.x : null,
             perdite: an.perdite.map(p => p.da + '→' + p.a + ' ' + p.frammento) };
  });
  att('il picco base del toluene è m/z 91', 91, ms.piccoBase);
  att('e lo ione più pesante osservato è 93', 93, ms.piuPesante);
  att('fra 92 e 91 riconosce la perdita di H', true,
      ms.perdite.some(p => /92→91 H$/.test(p)));
  console.log('      (' + ms.perdite.slice(0, 4).join(' · ') + ')');

  /* ── §4 · ESOL, contro valori sperimentali ───────────────────────────── */
  console.log('\n── I modelli ──');
  const mod = await pg.evaluate(async () => {
    const C = window.BSIChem;
    await new Promise(r => window.bsiLoadRDKit(r));
    const R = window.__rdkit;
    function desc(smi) { const m = R.get_mol(smi); const d = JSON.parse(m.get_descriptors()); m.delete(); return d; }
    /* logS sperimentali dalla raccolta di Delaney */
    const prove = [['aspirina','CC(=O)Oc1ccccc1C(=O)O',-1.72],
                   ['benzene','c1ccccc1',-1.64],
                   ['naftalene','c1ccc2ccccc2c1',-3.60],
                   ['etanolo','CCO',1.10]];
    const esol = prove.map(function (p) {
      const e = C.solubilitaESOL(desc(p[1]));
      return { nome: p[0], sper: p[2], stim: e ? +e.logS.toFixed(2) : null,
               scarto: e ? Math.abs(e.logS - p[2]) : null, inc: e ? e.incertezza : null };
    });
    const filtri = C.filtriDrugLikeness(desc('CC(=O)Oc1ccccc1C(=O)O'));
    /* una molecola che Lipinski DEVE bocciare: ciclosporina è enorme */
    const grande = C.filtriDrugLikeness({ amw: 1202, CrippenClogP: 7.5, tpsa: 279,
                                          lipinskiHBD: 5, lipinskiHBA: 23,
                                          NumRotatableBonds: 15, CrippenMR: 300,
                                          NumHeavyAtoms: 85 });
    return { esol: esol, scartoMedio: esol.reduce((s,e)=>s+e.scarto,0)/esol.length,
             filtri: filtri.map(f => f.nome + ':' + (f.passa ? 'passa' : 'viola')),
             grandeLipinski: grande[0].passa, grandeViolazioni: grande[0].violazioni.length };
  });
  mod.esol.forEach(function (e) {
    console.log('      ' + e.nome.padEnd(11) + ' sperimentale ' + String(e.sper).padStart(6) +
                '  stimato ' + String(e.stim).padStart(6) + '  scarto ' + e.scarto.toFixed(2));
  });
  /* ESOL dichiara ~1 unita' logaritmica di errore: si pretende che lo scarto
     medio ci stia dentro, non che sia zero. Un modello pubblicato si verifica
     contro il suo errore dichiarato, non contro la perfezione. */
  sotto('lo scarto medio di ESOL sta nell’errore dichiarato', 1.3,
        +mod.scartoMedio.toFixed(2));
  att('e l’incertezza viene riportata accanto alla stima', 1, mod.esol[0].inc);
  att('i quattro filtri danno un verdetto ciascuno', 4, mod.filtri.length);
  console.log('      (aspirina → ' + mod.filtri.join(' · ') + ')');
  /* la guardia opposta: se passassero tutto, non filtrerebbero niente */
  att('una molecola enorme NON passa Lipinski', false, mod.grandeLipinski);
  att('  · e le violazioni sono più di una', true, mod.grandeViolazioni >= 2);

  /* ── §5 · La foresta casuale ─────────────────────────────────────────── */
  console.log('\n── La foresta ──');
  const fo = await pg.evaluate(() => {
    const C = window.BSIChem;
    const X = [], y = [];
    let s = 7; const rnd = () => { s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
    for (let i = 0; i < 220; i++) {
      const a = rnd()*6, b = rnd()*2-1;
      X.push([a, b, rnd()]);
      y.push(Math.sin(a)*3 + b*b*4 + (rnd()-0.5)*0.2);
    }
    const f1 = C.forestaCasuale(X, y, { alberi: 60, seme: 1 });
    const f2 = C.forestaCasuale(X, y, { alberi: 60, seme: 1 });
    const f3 = C.forestaCasuale(X, y, { alberi: 60, seme: 2 });
    /* e un bersaglio che è PURO RUMORE: la foresta non deve trovarci niente */
    const yr = X.map(() => rnd()*10);
    const fr = C.forestaCasuale(X, yr, { alberi: 60, seme: 1 });
    return { r2: +f1.fuoriSacco.r2.toFixed(3), alberi: f1.alberi,
             deterministica: Math.abs(f1.predici(X[0]) - f2.predici(X[0])) < 1e-12,
             semeDiverso: Math.abs(f1.predici(X[0]) - f3.predici(X[0])) > 1e-12,
             r2Rumore: +fr.fuoriSacco.r2.toFixed(3),
             usate: f1.fuoriSacco.usate };
  });
  att('su una relazione non lineare la foresta spiega molto', true, fo.r2 > 0.8);
  console.log('      (R² fuori sacco ' + fo.r2 + ' su ' + fo.usate + ' osservazioni)');
  /* le due direzioni: su rumore puro deve fallire, altrimenti l'R² di sopra
     non dimostra che il modello impari qualcosa */
  att('e su un bersaglio di puro rumore NON spiega niente', true, fo.r2Rumore < 0.2);
  console.log('      (R² fuori sacco su rumore: ' + fo.r2Rumore + ')');
  att('a parità di seme la risposta è identica', true, fo.deterministica);
  att('e con un seme diverso cambia', true, fo.semeDiverso);

  /* ── §6 · La sezione ─────────────────────────────────────────────────── */
  console.log('\n── La sezione ──');
  const sez = await pg.evaluate(async () => {
    const btn = document.querySelector('.nav-btn[data-s="sspettrolettore"]');
    if (!btn) return { pulsante: false };
    btn.click();
    await new Promise(r => setTimeout(r, 900));
    const sec = document.getElementById('sspettrolettore');
    const base = { pulsante: true, nodi: sec.getElementsByTagName('*').length,
                   costruzione: /costruzione|construction/i.test(sec.textContent) };
    document.querySelector('[data-es="ir"]').click();
    await new Promise(r => setTimeout(r, 700));
    base.ir = { tela: !!document.getElementById('bsiSP-tela'),
                righe: document.querySelectorAll('#bsiSP-out .bsiSP-tbl tr').length,
                /* la crescita conta piu' di una soglia: dimostra che il
                   pannello REAGISCE, non solo che qualcosa era disegnato */
                nodi: sec.getElementsByTagName('*').length };
    document.querySelector('[data-es="ms"]').click();
    await new Promise(r => setTimeout(r, 600));
    base.ms = { righe: document.querySelectorAll('#bsiSP-out .bsiSP-tbl tr').length,
                diceLista: /lista di picchi|peak list/i.test(
                  document.getElementById('bsiSP-out').textContent) };
    document.querySelector('[data-es="nmr"]').click();
    await new Promise(r => setTimeout(r, 800));
    base.nmr = { righe: document.querySelectorAll('#bsiSP-out .bsiSP-tbl tr').length };
    base.dichiara = /non deduce la struttura|does not deduce/i.test(sec.textContent);
    return base;
  });
  att('«Lettore spettri» ha il suo pulsante di navigazione', true, sez.pulsante);
  att('e la sezione si disegna (intestazione, schede, caricamento)', true, sez.nodi >= 12);
  console.log('      (' + sez.nodi + ' nodi nello scheletro)');
  att('senza cadere nel cartello «Sezione in costruzione»', false, sez.costruzione);
  att('l’esempio IR produce una tela e una tabella', true,
      sez.ir.tela && sez.ir.righe >= 3);
  att('  · e la sezione CRESCE quando si carica uno spettro', true,
      sez.ir.nodi > sez.nodi);
  console.log('      (' + sez.nodi + ' → ' + sez.ir.nodi + ' nodi)');
  att('l’esempio MS produce la tabella delle perdite', true, sez.ms.righe >= 3);
  att('  · e dichiara che è una lista di picchi, non una curva', true, sez.ms.diceLista);
  att('l’esempio NMR produce le integrazioni', true, sez.nmr.righe >= 3);
  /* il punto d'onore: dichiarare che non deduce la struttura */
  att('e la sezione dichiara che NON deduce la struttura', true, sez.dichiara);

  /* ── §7 · Una sola porta d'ingresso ──────────────────────────────────────
     Il difetto che questo blocco guarda era REALE e arrivava da una foto:
     il selettore dichiarava `accept=".jdx,.dx,.txt,.csv,.jcamp"`, e su un
     telefono un `accept` non restringe — NASCONDE. Chi apriva «carica uno
     spettro» con in mano il PDF di un compito vedeva una cartella vuota e
     concludeva che l'applicazione fosse rotta. Lo era.

     Quindi qui si pretendono tre cose insieme: che la porta sia UNA, che non
     filtri NIENTE, e che per ogni tipo di file il programma DICA che cosa ha
     deciso — perché un instradamento silenzioso che sbaglia è peggio di un
     errore: non si distingue da un programma che non ha fatto nulla.
     ───────────────────────────────────────────────────────────────────────── */
  console.log('\n── Una sola porta d’ingresso ──');
  const fs = require('fs'), os = require('os'), path = require('path');
  const Q = path.join(__dirname, '..', 'dati', 'quesiti');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bsi-porta-'));
  /* un JCAMP-DX minimo ma vero: due colonne, XYDATA in (X++(Y..Y)) */
  const jdx = path.join(tmp, 'spettro.jdx');
  fs.writeFileSync(jdx, '##TITLE=prova\n##JCAMP-DX=4.24\n##XUNITS=1/CM\n' +
    '##YUNITS=ABSORBANCE\n##FIRSTX=1000\n##LASTX=1009\n##DELTAX=1\n##NPOINTS=10\n' +
    '##XYDATA=(X++(Y..Y))\n1000 10 12 40 90 40 12 10 11 10 9\n##END=\n');
  /* due colonne di numeri senza intestazione: si decide dal CONTENUTO */
  const csv = path.join(tmp, 'colonne.csv');
  fs.writeFileSync(csv, Array.from({ length: 40 }, (_, i) =>
    (1000 + i) + ',' + (0.1 + 0.8 * Math.exp(-Math.pow(i - 20, 2) / 8))).join('\n') + '\n');

  const ingresso = await pg.evaluate(() => {
    /* Un `<input type=file>` si tiene SEMPRE nascosto e si apre con un
       bottone: è il modo normale di avere un controllo che si possa disegnare.
       Quindi non conto gli ingressi — conto i BOTTONI che l'utente vede, e
       pretendo che ne esista uno solo per aprire un file. */
    const bottoni = [].filter.call(
      document.querySelectorAll('#sspettrolettore button'),
      b => b.offsetParent !== null && /apri|open/i.test(b.textContent) &&
           !/immagine|image|rileggi|again/i.test(b.textContent));
    const f = document.getElementById('bsiSP-file');
    return { bottoni: bottoni.map(b => b.textContent.trim()),
             filtro: f ? (f.getAttribute('accept') || '') : '(manca l’ingresso)',
             apreIlNostro: bottoni.length === 1 && bottoni[0].id === 'bsiSP-apri',
             dice: !!document.getElementById('bsiSP-deciso') };
  });
  att('un solo bottone visibile per aprire un file', 1, ingresso.bottoni.length);
  console.log('      (' + ingresso.bottoni.join(' | ') + ')');
  att('  · ed è quello dell’ingresso unico', true, ingresso.apreIlNostro);
  /* la direzione che conta: NESSUN filtro. Un accept non vuoto qui è il bug. */
  att('  · che non filtra nessuna estensione', '', ingresso.filtro);
  att('  · e c’è una riga che annuncia la decisione', true, ingresso.dice);

  async function instrada(file, attesa) {
    await pg.evaluate(() => {
      const d = document.getElementById('bsiSP-deciso'); if (d) d.textContent = '';
      const s = document.getElementById('bsiSP-docStato'); if (s) s.textContent = '';
    });
    await pg.setInputFiles('#bsiSP-file', file);
    await pg.waitForTimeout(attesa || 3500);
    return pg.evaluate(() => ({
      deciso: (document.getElementById('bsiSP-deciso') || {}).textContent || '',
      stato: (document.getElementById('bsiSP-docStato') || {}).textContent || '',
      pagine: document.querySelectorAll('#bsiSP-pagine canvas').length,
      tela: !!document.getElementById('bsiSP-tela'),
      svolto: /svolgimento|working it out|passaggi/i.test(
        (document.getElementById('bsiSP-docOut') || {}).textContent || '')
    }));
  }

  const vPdf = await instrada(path.join(Q, 'quesito-benzilacetato.pdf'), 14000);
  att('un PDF viene instradato come documento', true, /documento|document/i.test(vPdf.deciso));
  att('  · le sue pagine compaiono disegnate', true, vPdf.pagine >= 1);
  att('  · e la traccia dentro viene svolta', true, vPdf.svolto);
  att('  · senza che lo stato menta («aperto» solo se è aperto)', true,
      /aperto|opened/.test(vPdf.stato) && !/errore|error/i.test(vPdf.stato));
  console.log('      (' + vPdf.stato.trim().slice(0, 70) + ')');

  const vDocx = await instrada(path.join(Q, 'quesito-benzilacetato.docx'), 4500);
  att('un .docx viene instradato come documento e svolto', true,
      /documento|document/i.test(vDocx.deciso) && vDocx.svolto);

  const vTxt = await instrada(path.join(Q, 'quesito-benzilacetato.txt'), 4500);
  att('un testo senza numeri di spettro diventa un quesito', true,
      /quesito|problem|testo|text/i.test(vTxt.deciso) && vTxt.svolto);

  const vJdx = await instrada(jdx, 4000);
  att('un .jdx viene letto come spettro, non come documento', true,
      /spettro|spectrum/i.test(vJdx.deciso) && vJdx.tela);

  const vCsv = await instrada(csv, 4500);
  att('due colonne di numeri si riconoscono dal contenuto', true,
      /spettro|spectrum/i.test(vCsv.deciso) && vCsv.tela);

  /* L'altra direzione del riconoscimento del testo: un binario travestito da
     `.txt` non deve finire nella casella di testo come byte illeggibili. Il
     nome dice «testo»; il contenuto no, e vince il contenuto. */
  const finto = path.join(tmp, 'travestito.txt');
  fs.writeFileSync(finto, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(600, 0)
  ]));
  const vFinto = await instrada(finto, 3500);
  att('un binario chiamato .txt non viene riversato come testo', false,
      /quesito|problem text/i.test(vFinto.deciso));
  att('  · e il lettore di documenti dice che non lo sa leggere', true,
      /non|not|binario|binary|formato|format/i.test(vFinto.stato + vFinto.deciso));
  console.log('      (' + (vFinto.stato || vFinto.deciso).trim().slice(0, 80) + ')');

  const vPng = await instrada(path.join(__dirname, '..', '..', 'icon-192.png'), 6000);
  att('un’immagine fa entrambe le cose (traccia e pagina)', true,
      /immagine|image/i.test(vPng.deciso) && vPng.tela && vPng.pagine >= 1);

  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}

  /* ── §8 · Il distintivo di versione ──────────────────────────────────────
     Per circa ottanta versioni l'intestazione ha scritto «v13l»: una stringa
     fissa nell'HTML, mai aggiornata, mentre l'applicazione era a v195.
     Nessun controllo la guardava. Ora c'è. */
  const distintivo = await pg.evaluate(() => ({
    badge: ((document.getElementById('version-badge') || {}).textContent || '').trim(),
    atteso: String(window.BSI_APP_VERSION || '').replace(/^bsi-/, '')
  }));
  att('il distintivo in intestazione riporta la versione vera',
      distintivo.atteso, distintivo.badge);

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 60) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 60');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
