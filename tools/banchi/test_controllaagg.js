#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_controllaagg — «Controlla aggiornamenti» risponde sempre

   PERCHE' QUESTO BANCO ESISTE
   Segnalazione dell'utente: «provando ad aggiornare non esce nulla». Era
   vero in due sensi: la versione pubblicata non era cambiata, e l'app non
   aveva modo di dirlo. La riga del menu ✨ (bsi-aggiorna.js) deve dare una
   risposta in ognuno dei tre casi:
   · stessa versione → «già aggiornata», con il numero;
   · versione diversa in rete → «trovata la versione…», e il service worker
     riceve l'ordine di aggiornarsi;
   · rete assente → lo dice, invece di tacere.
   Il secondo caso si ottiene servendo un sw.js con un nome di cache diverso
   (solo per la richiesta di controllo, con il parametro ?controllo=).

   USO   node tools/banchi/test_controllaagg.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  const pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  let modo = 'normale';
  await ctx.route(/sw\.js\?controllo=/, async (r) => {
    if (modo === 'offline') return r.abort('internetdisconnected');
    const resp = await r.fetch(); let s = await resp.text();
    if (modo === 'nuova') s = s.replace(/var CACHE = '[^']+'/, "var CACHE = 'bsi-v999'");
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: s });
  });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  /* il service worker deve controllare la pagina: alla prima visita serve una ricarica */
  await pg.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.ready, null, { timeout: 60000 });
  await pg.evaluate(() => navigator.serviceWorker.ready);
  if (!(await pg.evaluate(() => !!navigator.serviceWorker.controller))) { await pg.reload({ waitUntil: 'load' }); }
  await pg.waitForFunction(() => !!navigator.serviceWorker.controller && !!window.BSIAggiorna, null, { timeout: 60000 });
  /* alla prima installazione il service worker manda BSI_SW_UPDATED e la pagina, senza lavoro aperto,
     si ricarica da sola: si aspetta che lo abbia fatto prima di cominciare */
  await pg.waitForTimeout(4000);
  await pg.waitForLoadState('load');
  await pg.waitForFunction(() => !!navigator.serviceWorker.controller && !!window.BSIAggiorna, null, { timeout: 60000 });
  await pg.waitForTimeout(1500);
  const atteso = (await (await pg.request.get(BASE + 'sw.js')).text()).match(/var CACHE = '([^']+)'/)[1];

  /* la riga nel menu ✨ */
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); const f = document.getElementById('bsi14-fab'); if (f) f.click(); });
  await pg.waitForSelector('#bsi-agg-riga', { state: 'attached', timeout: 20000 });
  await pg.waitForFunction(() => !/…/.test(document.querySelector('#bsi-agg-riga .bsi14-ds').textContent), null, { timeout: 10000 }).catch(() => {});
  att('il menu ✨ ha la riga e mostra la versione in uso', 'Versione in uso: ' + atteso.replace('bsi-v', 'v'), await pg.textContent('#bsi-agg-riga .bsi14-ds'));

  const esito = async () => { await pg.waitForFunction(() => { const a = document.getElementById('bsi-agg-esito'); return a && !/Controllo/.test(a.textContent); }, null, { timeout: 20000 }).catch(() => {}); return pg.evaluate(() => (document.getElementById('bsi-agg-esito') || {}).textContent || ''); };

  await pg.click('#bsi-agg-riga');
  const r1 = await esito();
  vero('stessa versione: dice che è già aggiornata, con il numero  [' + r1.slice(0, 90) + ']', /già aggiornata/.test(r1) && r1.indexOf(atteso.replace('bsi-v', 'v')) >= 0);

  modo = 'nuova';
  await pg.evaluate(() => { const a = document.getElementById('bsi-agg-esito'); if (a) a.remove(); });
  await pg.evaluate(() => { window._aggChiesto = 0; navigator.serviceWorker.getRegistration().then(r => { const u = r.update.bind(r); r.update = () => { window._aggChiesto++; return u(); }; }); });
  await pg.waitForTimeout(300);
  const r2 = await pg.evaluate(() => BSIAggiorna.controlla());
  const t2 = await pg.evaluate(() => (document.getElementById('bsi-agg-esito') || {}).textContent || '');
  att('versione nuova in rete: la trova', 'nuova', r2);
  vero('e lo dice, con le due versioni  [' + t2.slice(0, 90) + ']', /v999/.test(t2) && t2.indexOf(atteso.replace('bsi-v', 'v')) >= 0);
  await pg.waitForTimeout(500);
  vero('e chiede al service worker di aggiornarsi', await pg.evaluate(() => window._aggChiesto > 0));

  modo = 'offline';
  const r3 = await pg.evaluate(() => BSIAggiorna.controlla());
  const t3 = await pg.evaluate(() => (document.getElementById('bsi-agg-esito') || {}).textContent || '');
  att('senza rete: lo dice', 'offline', r3);
  vero('con un messaggio comprensibile  [' + t3.slice(0, 70) + ']', /connessione/.test(t3));

  att('nessun errore JavaScript', 0, errs.length);
  errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
