/* ═══════════════════════════════════════════════════════════════════════════
   test_datasci — la matematica che la sezione Data Science MOSTRA

   PERCHE' QUESTO BANCO ESISTE

   La sezione mostra R², validazione incrociata, AUC e una classifica di
   modelli. Erano numeri che si potevano solo leggere sullo schermo e credere:
   le funzioni che li producono stavano chiuse in un ambito privato, e nessun
   banco poteva confrontarle con un valore noto.

   E la sezione stessa era IRRAGGIUNGIBILE. Era un `.section` del documento con
   383 nodi e ZERO agganci: nessun pulsante di navigazione, nessun `onclick`,
   nessun collegamento. Non compariva nemmeno nelle misure, perche' i banchi
   percorrono i PULSANTI (88) e non le sezioni (90) — un altro «numero
   perfetto» che non copriva tutto.

   Qui si verifica che la matematica dia i valori giusti su dati di cui la
   risposta si calcola a mano, e che nessuna sezione resti orfana.

   USO   node tools/banchi/test_datasci.js     (serve un server su :8899)
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
function vicino(d, atteso, avuto, tol){
  eseguiti++;
  tol = tol === undefined ? 1e-6 : tol;
  if (avuto !== null && avuto !== undefined && isFinite(avuto) && Math.abs(avuto - atteso) <= tol) {
    ok++; console.log('  ✓ ' + d + '  → ' + (+avuto).toFixed(6));
  } else {
    ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ±' + tol + '\n      avuto:  ' + avuto);
  }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1280, height: 900 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(3000);
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

  console.log('Data Science — la matematica che la sezione mostra\n');

  /* ── §1 · Nessuna sezione orfana ────────────────────────────────────── */
  console.log('── Raggiungibilità delle sezioni ──');
  const orfane = await pg.evaluate(() => {
    const sezioni = [].map.call(document.querySelectorAll('.section'), function (s) { return s.id; });
    const bottoni = [].map.call(document.querySelectorAll('.nav-btn[data-s]'),
                               function (b) { return b.getAttribute('data-s'); });
    /* Una sezione e' raggiungibile da un pulsante, oppure da un gestore che la
       nomina: `scentro` e' una sezione legacy aperta da `openLegacyCentro`, e
       va bene cosi' purche' QUALCOSA la raggiunga. */
    const senzaPulsante = sezioni.filter(function (s) { return bottoni.indexOf(s) === -1; });
    const senzaNiente = senzaPulsante.filter(function (id) {
      if (!id) return true;
      const agganci = document.querySelectorAll(
        '[onclick*="' + id + '"],[href="#' + id + '"],[data-target="' + id + '"]').length;
      /* un gestore nel sorgente che la nomina conta come aggancio */
      const nelCodice = document.documentElement.innerHTML.indexOf("'" + id + "'") !== -1 ||
                        document.documentElement.innerHTML.indexOf('"' + id + '"') !== -1;
      return agganci === 0 && !nelCodice;
    });
    return {
      sezioni: sezioni.length, bottoni: bottoni.length,
      senzaPulsante: senzaPulsante, senzaNiente: senzaNiente,
      bottoniNelVuoto: bottoni.filter(function (x) { return sezioni.indexOf(x) === -1; })
    };
  });
  att('le sezioni sono molte', true, orfane.sezioni >= 85);
  att('nessuna sezione è del tutto irraggiungibile', '', orfane.senzaNiente.join(', '));
  att('nessun pulsante punta a una sezione che non esiste', '', orfane.bottoniNelVuoto.join(', '));
  att('la sezione Data Science ha il suo pulsante', false,
      orfane.senzaPulsante.indexOf('sdatasci') !== -1);
  console.log('      (' + orfane.sezioni + ' sezioni, ' + orfane.bottoni + ' pulsanti; ' +
              'senza pulsante ma raggiungibili: ' + (orfane.senzaPulsante.join(', ') || 'nessuna') + ')');

  /* ── §2 · La sezione si apre e costruisce ───────────────────────────── */
  await pg.evaluate(() => {
    const n = document.querySelector('.nav-btn[data-s="sdatasci"]');
    if (n) n.click();
  });
  await pg.waitForTimeout(1500);
  const aperta = await pg.evaluate(() => {
    const s = document.getElementById('sdatasci');
    return {
      visibile: s ? getComputedStyle(s).display !== 'none' : false,
      nodi: s ? s.querySelectorAll('*').length : 0,
      matematicaEsposta: !!(window.BSIDataSci && typeof window.BSIDataSci.cvRegressione === 'function')
    };
  });
  att('la sezione si apre', true, aperta.visibile);
  att('e costruisce il suo contenuto', true, aperta.nodi > 300);
  att('la matematica è esposta per la verifica', true, aperta.matematicaEsposta);

  /* ── §3 · Media e deviazione su valori calcolabili a mano ───────────── */
  console.log('\n── Media e dispersione ──');
  const ms = await pg.evaluate(() => {
    const D = window.BSIDataSci;
    return { noti: D.mediaEScarto([2, 4, 4, 4, 5, 5, 7, 9]), vuoto: D.mediaEScarto([]) };
  });
  vicino('media di [2,4,4,4,5,5,7,9]', 5, ms.noti[0], 1e-9);
  /* Questa funzione usa la deviazione di POPOLAZIONE (divide per n): la
     radice di 32/8 = 2. Fissarlo qui rende la scelta esplicita invece che
     implicita, cosi' chi legge il «±» sullo schermo sa cosa sta leggendo. */
  vicino('deviazione di popolazione (divide per n): √(32/8)', 2, ms.noti[1], 1e-9);
  att('un insieme vuoto non inventa numeri', '0,0', ms.vuoto.join(','));

  /* ── §4 · La regressione su una relazione ESATTA ────────────────────── */
  console.log('\n── Regressione: la discesa del gradiente converge? ──');
  const reg = await pg.evaluate(() => {
    const D = window.BSIDataSci;
    /* y = 2·x1 + 3·x2 + 1, senza rumore. Standardizzate le colonne, un
       modello lineare deve arrivare a R² = 1: se la discesa del gradiente non
       convergesse, si vedrebbe qui e in nessun altro posto. */
    let s = 7;
    const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    const X = [], y = [];
    for (let i = 0; i < 60; i++) {
      const a = rnd() * 10, c = rnd() * 10;
      X.push([a, c]); y.push(2 * a + 3 * c + 1);
    }
    /* standardizzazione, come fa la sezione prima di addestrare */
    const Z = X.map(r => r.slice());
    for (let j = 0; j < 2; j++) {
      let mu = 0; Z.forEach(r => mu += r[j]); mu /= Z.length;
      let sd = 0; Z.forEach(r => sd += (r[j] - mu) * (r[j] - mu)); sd = Math.sqrt(sd / Z.length) || 1;
      Z.forEach(r => r[j] = (r[j] - mu) / sd);
    }
    const idx = []; for (let i = 0; i < Z.length; i++) idx.push(i);
    const fit = D.adattaDiscesa(Z, y, idx, 2500);
    /* R² sull'insieme intero */
    let mu = 0; y.forEach(v => mu += v); mu /= y.length;
    let ssr = 0, sst = 0;
    for (let i = 0; i < Z.length; i++) {
      let p = fit.b; for (let j = 0; j < 2; j++) p += fit.w[j] * Z[i][j];
      ssr += (y[i] - p) * (y[i] - p); sst += (y[i] - mu) * (y[i] - mu);
    }
    const cvLin = D.mediaEScarto(D.cvRegressione(Z, y, 5));
    const cvRif = D.mediaEScarto(D.cvRiferimentoRegressione(y, 5));
    const cvKnn = D.mediaEScarto(D.cvKnnRegressione(Z, y, 5, 5));
    /* i pesi standardizzati devono stare nel rapporto vero: 2·sd1 : 3·sd2 */
    let m1 = 0, m2 = 0; X.forEach(r => { m1 += r[0]; m2 += r[1]; }); m1 /= X.length; m2 /= X.length;
    let s1 = 0, s2 = 0; X.forEach(r => { s1 += (r[0]-m1)*(r[0]-m1); s2 += (r[1]-m2)*(r[1]-m2); });
    s1 = Math.sqrt(s1 / X.length); s2 = Math.sqrt(s2 / X.length);
    return {
      r2: 1 - ssr / sst,
      rapportoPesi: fit.w[0] / fit.w[1],
      rapportoVero: (2 * s1) / (3 * s2),
      cvLin: cvLin[0], cvRif: cvRif[0], cvKnn: cvKnn[0]
    };
  });
  vicino('su una relazione lineare ESATTA l\'R² è 1', 1, reg.r2, 1e-4);
  vicino('i pesi standardizzati stanno nel rapporto vero 2·σ₁ : 3·σ₂',
         reg.rapportoVero, reg.rapportoPesi, 1e-3);
  vicino('la validazione incrociata della regressione dà 1', 1, reg.cvLin, 1e-3);
  att('il kNN resta sotto la regressione su dati lineari', true, reg.cvKnn < reg.cvLin);
  att('il riferimento banale è ben peggiore di entrambi', true, reg.cvRif < reg.cvKnn);
  console.log('      (regressione ' + reg.cvLin.toFixed(3) + ' · kNN ' + reg.cvKnn.toFixed(3) +
              ' · riferimento ' + reg.cvRif.toFixed(3) + ')');

  /* ── §5 · Il riferimento su dati SENZA segnale ──────────────────────── */
  console.log('\n── E se nei dati non c\'è segnale? ──');
  const nulla = await pg.evaluate(() => {
    const D = window.BSIDataSci;
    let s = 99;
    const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    const Z = [], y = [];
    for (let i = 0; i < 60; i++) { Z.push([rnd(), rnd()]); y.push(rnd() * 10); }
    const lin = D.mediaEScarto(D.cvRegressione(Z, y, 5))[0];
    const knn = D.mediaEScarto(D.cvKnnRegressione(Z, y, 5, 5))[0];
    return { lin, knn };
  });
  /* Su rumore puro nessun modello deve avvicinarsi a 1: se lo facesse,
     starebbe memorizzando invece di apprendere, e la validazione incrociata
     non lo starebbe separando dall'addestramento. */
  att('su rumore puro la regressione non si avvicina a 1', true, nulla.lin < 0.5);
  att('e nemmeno il kNN', true, nulla.knn < 0.5);
  console.log('      (regressione ' + nulla.lin.toFixed(3) + ' · kNN ' + nulla.knn.toFixed(3) + ')');

  /* ── §6 · La curva ROC su valori calcolabili a mano ─────────────────── */
  console.log('\n── Curva ROC ──');
  const roc = await pg.evaluate(() => {
    const D = window.BSIDataSci;
    const p = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const perfetto = D.roc(p, [1, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
    const pessimo = D.roc(p, [0, 0, 0, 0, 0, 0, 0, 0, 1, 1]);
    const medio = D.roc(p, [0, 1, 0, 0, 1, 0, 0, 0, 0, 0]);
    const leggi = r => (r && typeof r.auc === 'number') ? r.auc
                     : (typeof r === 'number' ? r : (r && r.AUC) || null);
    return { perfetto: leggi(perfetto), pessimo: leggi(pessimo), medio: leggi(medio),
             forma: Object.keys(perfetto || {}).join(',') };
  });
  if (roc.perfetto === null) {
    ko++; eseguiti++;
    console.log('  ✗ la forma restituita da roc() non è leggibile: ' + roc.forma);
  } else {
    vicino('ordinamento perfetto: AUC 1', 1, roc.perfetto, 1e-9);
    vicino('ordinamento pessimo: AUC 0', 0, roc.pessimo, 1e-9);
    /* attivi ai ranghi 2 e 5: 12 coppie concordanti su 16 */
    vicino('attivi ai ranghi 2 e 5: AUC 12/16 = 0,75', 0.75, roc.medio, 1e-9);
  }

  /* ── §7 · Il target non si sceglie a caso ───────────────────────────── */
  console.log('\n── Il banco di lavoro: quale colonna viene prevista ──');
  const target = await pg.evaluate(async () => {
    const ta = document.getElementById('dsWbInput');
    if (!ta) return { assente: true };
    let r = 'x1,x2,risposta\n', s = 7;
    const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    for (let i = 0; i < 40; i++) {
      const a = +(rnd() * 10).toFixed(3), c = +(rnd() * 10).toFixed(3);
      r += a + ',' + c + ',' + (2 * a + 3 * c + 1).toFixed(6) + '\n';
    }
    ta.value = r;
    const an = document.getElementById('dsWbAnalyze');
    if (an) an.click();
    await new Promise(res => setTimeout(res, 2000));
    const sel = document.getElementById('dsMlTarget');
    return { assente: false, scelto: sel ? sel.value : '(selettore assente)',
             opzioni: sel ? sel.options.length : 0 };
  });
  if (target.assente) {
    ko++; eseguiti++;
    console.log('  ✗ il banco di lavoro dati non è presente');
  } else {
    /* La convenzione universale e' che la risposta stia nell'ULTIMA colonna.
       Il valore iniziale era la PRIMA: su questi dati il pannello prevedeva x1
       dai valori di x2 e della risposta, e riportava R² = 1,000. Il numero era
       giusto, la domanda no, e niente nell'interfaccia lo diceva. */
    att('il target parte dall\'ultima colonna numerica', 'risposta', target.scelto);
    att('il selettore offre tutte le colonne', 3, target.opzioni);
  }

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 20) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 20');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
