#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_matmappa — 🧭 Mappa dei prerequisiti di matematica (v254)

   PERCHE' QUESTO BANCO ESISTE
   Fase 9 del progetto. Un percorso di studio sbagliato manda a studiare le
   cose nell'ordine sbagliato. Qui si pretende che il grafo sia aciclico, che
   ogni prerequisito sia a un livello non più alto, che ogni percorso metta
   ogni argomento dopo tutti i suoi prerequisiti, che ciò che si sa già lo
   accorci, e che ogni sezione citata esista davvero nella barra dell'app.
   Poi la pagina a 412 e 1280 px: il grafo, il percorso, il tocco sul grafo,
   la spunta che resta, niente sbordi, nessun errore.

   USO   node tools/banchi/test_matmappa.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-mat-mappa.js'), 'utf8'), ctx);
  const M = ctx.BSIFisica.calcolo.matmappa, A = M.ARGOMENTI;

  console.log('── Il grafo ──');
  att('41 argomenti su quattro livelli', '41 0,1,2,3', A.length + ' ' + [...new Set(A.map(a => a[1]))].sort().join(','));
  att('aciclico, prerequisiti esistenti, livelli non crescenti', '', M.verifica().join('; '));
  att('identificativi unici', A.length, new Set(A.map(a => a[0])).size);
  vero('ogni argomento ha almeno una sezione che lo insegna', A.every(a => a[5].length > 0));
  let tuttiOk = true, peggiore = '';
  A.forEach(a => { const p = M.percorso(a[0]); if (!p || p[p.length - 1] !== a[0] || p.length !== M.antenati(a[0]).length + 1) { tuttiOk = false; peggiore = a[0]; return; } const pos = {}; p.forEach((y, i) => pos[y] = i); p.forEach(y => M.nodo(y).pre.forEach(q => { if (!(pos[q] < pos[y])) { tuttiOk = false; peggiore = y; } })); });
  vero('per ognuno dei 41 obiettivi il percorso mette ogni argomento dopo i suoi prerequisiti e finisce con l\'obiettivo' + (peggiore ? ' (' + peggiore + ')' : ''), tuttiOk);
  att('le EDP chiedono 21 argomenti prima', 21, M.antenati('edp').length);
  att('chi sa già numeri, algebra e funzioni ha 3 tappe in meno', M.percorso('edp').length - 3, M.percorso('edp', { aritm: 1, algebra: 1, funzioni: 1 }).length);
  att('i numeri sbloccano tutto il resto (40)', 40, M.sblocca('aritm').length);
  att('le EDP sbloccano la matematica della meccanica quantistica', 'quantistica', M.sblocca('edp').join(','));

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); localStorage.removeItem('bsi-mat-mappa-noti'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.matmappa), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      const ids = new Set([...document.querySelectorAll('.nav-btn[data-s]')].map(b => b.getAttribute('data-s')));
      const M = BSIFisica.calcolo.matmappa; o.mancanti = [...new Set(M.ARGOMENTI.flatMap(a => a[5].concat(a[6])))].filter(s => !ids.has(s));
      const x = BSISpectraLive.calcolo.apriSezione('smatmappa'); await pausa(700); o.aperta = x && x.id; o.nav = ids.has('smatmappa');
      const el = document.getElementById('smatmappa'); o.passi = el.querySelectorAll('input[type=checkbox]').length; o.tela = !!el.querySelector('canvas') && el.querySelector('canvas').height > 200;
      o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; o.strano = (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b).{0,20}/) || [null])[0];
      el.querySelector('input[type=checkbox]').click(); await pausa(300); o.dopo = el.querySelectorAll('input[type=checkbox]').length; o.salvato = Object.keys(JSON.parse(localStorage.getItem('bsi-mat-mappa-noti') || '{}')).length;
      /* tocco sul grafo: il primo riquadro della colonna «Superiori» diventa l'obiettivo */
      const c = el.querySelector('canvas'), rc = c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('click', { clientX: rc.left + rc.width / 8, clientY: rc.top + 34 + 8, bubbles: true })); await pausa(300);
      o.obiettivo = [...el.querySelectorAll('select')].filter(s => s.offsetParent)[0].value;
      o.bottoni = el.querySelectorAll('.bsiFX-bott').length;
      return o;
    });
    att(nome + ' · ogni sezione citata esiste nella barra', '', r.mancanti.join(','));
    vero(nome + ' · nella barra, si apre, il grafo e il percorso (' + r.passi + ' tappe)', r.nav && r.aperta === 'smatmappa' && r.tela && r.passi === 22);
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', r.sb + ' ' + r.strano);
    vero(nome + ' · «lo so già» accorcia il percorso e resta salvato', r.dopo === 21 && r.salvato === 1);
    att(nome + ' · un tocco sul grafo sceglie l\'obiettivo', 'aritm', r.obiettivo);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
