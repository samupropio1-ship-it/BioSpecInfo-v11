#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_spaziotempo — 🌀 Spaziotempo curvo e wormhole (v253): i numeri e le pagine

   PERCHE' QUESTO BANCO ESISTE
   Richiesta dell'autore: la teoria della curvatura dello spaziotempo e dei
   wormhole, «però scientificamente accurata». Una sezione su un argomento così
   attira esagerazioni; qui i numeri si confrontano con le soluzioni esatte e
   con i valori noti, e si pretende che ogni affermazione dica il suo stato
   (misurato, teoria, ipotesi, speculazione).
   · Schwarzschild: r_s della Terra 8,87 mm e del Sole 2,953 km; un orologio
     alla superficie della Terra perde 60 μs al giorno rispetto all'infinito;
     marea di 2×10⁸ m/s² su 2 m all'orizzonte di 10 M☉ e di 1,1×10⁻³ m/s² a
     quello di Sgr A*; curvatura K = 12 r_s²/r⁶.
   · Morris–Thorne: il diagramma di immersione di Ellis contro la formula
     esatta b₀·arccosh(r/b₀); la tensione alla gola c⁴/(8πG b₀²) =
     4,815×10⁴² Pa per b₀ = 1 m; la condizione di energia nulla violata per
     ogni forma; la «massa esotica» di Ellis contro −c²b₀/(2G); il paraboloide
     di Flamm.
   · Casimir: −4,33×10⁻⁴ J/m³ a 1 μm, che scala come 1/a⁴.
   Poi la pagina a 412 e 1280 px: quattro schede, i grafici, la superficie che
   ruota con il dito, le etichette di stato, niente NaN, niente sbordi.

   USO   node tools/banchi/test_spaziotempo.js    (serve un server su :8899)
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
function vicino(d, atteso, avuto, tol) { const e = Math.abs(avuto - atteso) / Math.max(1e-300, Math.abs(atteso)); if (e <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+avuto.toPrecision(6)) + ' (atteso ' + atteso + ')'); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + (tol * 100) + ' %\n      avuto:  ' + avuto); } }

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-astro-wormhole.js'), 'utf8'), ctx);
  const W = ctx.BSIFisica.calcolo.wormhole, MS = W.MSOLE;

  console.log('── Schwarzschild ──');
  vicino('r_s della Terra (mm)', 8.870, W.raggioSchwarzschild(5.9722e24) * 1000, 1e-3);
  vicino('r_s del Sole (km)', 2.953, W.raggioSchwarzschild(MS) / 1000, 1e-3);
  vicino('orologio alla superficie della Terra: μs persi al giorno', 60.15, (1 - W.dilatazione(5.9722e24, 6.371e6)) * 86400e6, 2e-3);
  vicino('marea su 2 m all\'orizzonte di 10 M☉ (m/s²)', 2.061e8, W.marea(10 * MS, W.raggioSchwarzschild(10 * MS), 2), 3e-3);
  vicino('marea su 2 m all\'orizzonte di Sgr A* (m/s²)', 1.116e-3, W.marea(4.297e6 * MS, W.raggioSchwarzschild(4.297e6 * MS), 2), 3e-3);
  vero('la marea all\'orizzonte scala come 1/M²', Math.abs(W.marea(10 * MS, W.raggioSchwarzschild(10 * MS), 2) / W.marea(20 * MS, W.raggioSchwarzschild(20 * MS), 2) - 4) < 1e-9);
  vicino('curvatura: K^(−1/4) = (12 r_s²/r⁶)^(−1/4) per una stella di neutroni (km)', 10.98, W.lunghezzaCurvatura(1.4 * MS, 1.2e4) / 1000, 3e-3);
  att('all\'orizzonte e dentro, un orologio fermo non esiste', 0, W.dilatazione(MS, W.raggioSchwarzschild(MS)));

  console.log('\n── Morris–Thorne ──');
  const p = W.immersione(1, 1, 6, 400), u = p[p.length - 1];
  vicino('Ellis: z(6 b₀) contro b₀·arccosh(6)', Math.acosh(6), u.z, 1e-5);
  vero('il profilo cresce sempre e parte da zero alla gola', p[0].z === 0 && p.every((q, i) => !i || q.z > p[i - 1].z));
  vicino('tensione alla gola, b₀ = 1 m (Pa)', 4.8155e42, -W.materia(1, 1, 1).pr, 1e-4);
  vicino('tensione per una gola di un anno luce (Pa)', 5.380e10, -W.materia(W.ANNO_LUCE, 0, W.ANNO_LUCE).pr, 2e-3);
  vero('la tensione non dipende dalla forma (n = 0, 1, 2)', [0, 1, 2].every(n => Math.abs(W.materia(1, n, 1).pr / W.materia(1, 0, 1).pr - 1) < 1e-12));
  vero('la condizione di energia nulla è violata alla gola per ogni forma', [0, 0.5, 1, 2, 3].every(n => W.materia(1, n, 1).nec < 0));
  vicino('ρc² + p_r alla gola = −(1+n)·c⁴/(8πG b₀²), n = 2', -3 * 4.8155e42, W.materia(1, 2, 1).nec, 1e-4);
  vicino('Ellis: massa esotica entro 1000 b₀ contro −c²b₀(1 − 1/1000)/(2G) (kg)', -(W.C ** 2) / (2 * W.G) * (1 - 1 / 1000), W.massaEsotica(1, 1, 1000), 1e-6);
  vicino('Flamm: z(2 r_s) = 2 r_s', 2, W.flamm(1, 2), 1e-12);
  vicino('Casimir a 1 μm (J/m³)', -4.3338e-4, W.casimir(1e-6), 1e-4);
  vicino('Casimir scala come 1/a⁴', 1e4, W.casimir(1e-7) / W.casimir(1e-6), 1e-9);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.wormhole), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = { tele: [], sb: 0, strano: null, stati: new Set() };
      const x = BSISpectraLive.calcolo.apriSezione('sastrowh'); await pausa(700); o.aperta = x && x.id; o.nav = !!document.querySelector('.nav-btn[data-s="sastrowh"]');
      const el = document.getElementById('sastrowh'), schede = [...el.querySelectorAll('.bsiFX-schede button')]; o.schede = schede.length;
      for (const bt of schede) {
        bt.click(); await pausa(700);
        o.tele.push([...el.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 100 && c.height > 60).length);
        o.sb = Math.max(o.sb, document.documentElement.scrollWidth - document.documentElement.clientWidth);
        o.strano = o.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b).{0,20}/) || [null])[0];
        ['MISURATO', 'TEORIA', 'IPOTESI', 'SPECULAZIONE'].forEach(s => { if (el.innerText.indexOf(s) >= 0) o.stati.add(s); });
      }
      o.stati = [...o.stati].sort().join(',');
      schede[1].click(); await pausa(500);
      o.nec = /condizione di energia nulla violata/.test(el.innerText);
      const cv = [...el.querySelectorAll('canvas')].filter(c => c.offsetParent !== null)[0], prima = cv.toDataURL(), rc = cv.getBoundingClientRect();
      cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: rc.left + 60, clientY: rc.top + 60, pointerId: 1, bubbles: true })); cv.dispatchEvent(new PointerEvent('pointermove', { clientX: rc.left + 160, clientY: rc.top + 90, pointerId: 1, bubbles: true })); cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true })); await pausa(150);
      o.ruota = cv.toDataURL() !== prima;
      const vis = () => [...el.querySelectorAll('select')].filter(x => x.offsetParent !== null);
      const sel = vis()[0]; sel.value = 'f'; sel.dispatchEvent(new Event('change')); await pausa(200); o.flamm = cv.toDataURL() !== prima;
      schede[0].click(); await pausa(300); const s0 = vis()[0]; s0.value = 'sgra'; s0.dispatchEvent(new Event('change')); await pausa(300); o.sgra = /impercettibil|minima|dolc/.test(el.innerText) || /orizzonti più dolci|più dolce/.test(el.innerText);
      return o;
    });
    vero(nome + ' · nella barra, si apre, 4 schede, i grafici ci sono (' + r.tele.join(',') + ')', r.nav && r.aperta === 'sastrowh' && r.schede === 4 && r.tele.join(',') === '1,1,1,1');
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', r.sb + ' ' + r.strano);
    att(nome + ' · ogni affermazione dice il suo stato: le quattro etichette ci sono', 'IPOTESI,MISURATO,SPECULAZIONE,TEORIA', r.stati);
    vero(nome + ' · la violazione della condizione di energia nulla è scritta', r.nec);
    vero(nome + ' · il diagramma ruota con il dito, e si passa a Einstein–Rosen', r.ruota && r.flamm);
    vero(nome + ' · per Sgr A* dice che l\'orizzonte è dolce', r.sgra);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
