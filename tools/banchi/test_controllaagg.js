#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_controllaagg — «Controlla aggiornamenti» risponde sempre

   PERCHE' QUESTO BANCO ESISTE
   Segnalazione dell'utente: «provando ad aggiornare non esce nulla». Era
   vero: la finestra «🔄 Aggiornamenti» del menu ✨ cercava in sw.js una riga
   «CACHE_VERSION = …» che sw.js non contiene da molte versioni («var CACHE =
   'bsi-vNNN'»), e la cercava su raw.githubusercontent.com. La versione
   remota non si leggeva mai. test_aggiorna apriva la finestra ma non premeva
   «Controlla»: per questo il difetto e' sopravvissuto. Qui si preme, in tre
   casi, e ognuno deve dare una risposta:
   · stessa versione → «Hai già l'ultima versione pubblicata», con il numero;
   · versione nuova sul sito → la annuncia e mostra «Aggiorna ora»;
   · sito irraggiungibile → lo dice, invece di tacere.
   Il secondo caso si ottiene servendo un sw.js con un nome di cache diverso
   (solo per la richiesta di controllo, con il parametro ?controllo=); il
   terzo interrompendo quella richiesta e il ripiego su GitHub.
   Si controlla anche BSIAggiorna.controlla(), l'avviso a comparsa.

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
  await ctx.route(/raw\.githubusercontent\.com/, r => modo === 'offline' ? r.abort('internetdisconnected') : r.fulfill({ status: 404, body: '' }));
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

  /* la finestra, aperta come la apre l'utente: ✨ → 🔄 Aggiornamenti → «Controlla aggiornamenti» */
  const premi = async () => {
    await pg.evaluate(() => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const m = document.getElementById('bsiUp-modal');
      if (!m || !m.classList.contains('open')) { const f = document.getElementById('bsi14-fab'); if (f) f.click(); const r = document.querySelector('#bsi14-sheet [data-key="aggiorna"]'); if (r) r.click(); }
    });
    await pg.waitForFunction(() => { const m = document.getElementById('bsiUp-modal'); return m && m.classList.contains('open'); }, null, { timeout: 15000 });
    await pg.click('#bsiUp-check');
    await pg.waitForFunction(() => !/Controllo in corso/.test(document.getElementById('bsiUp-status').textContent), null, { timeout: 30000 }).catch(() => {});
    return pg.evaluate(() => ({ testo: document.getElementById('bsiUp-status').textContent, aggiorna: getComputedStyle(document.getElementById('bsiUp-do')).display !== 'none' }));
  };
  const v = atteso.replace('bsi-', '');

  const r1 = await premi();
  vero('stessa versione: «hai già l\'ultima versione», con il numero  [' + r1.testo.slice(0, 80) + ']', /già l.ultima versione/.test(r1.testo) && r1.testo.indexOf(v) >= 0);
  att('e niente pulsante «Aggiorna ora»', false, r1.aggiorna);

  modo = 'nuova';
  const r2 = await premi();
  vero('versione nuova sul sito: la annuncia, con le due versioni  [' + r2.testo.slice(0, 80) + ']', /Nuova versione/.test(r2.testo) && /v999/.test(r2.testo) && r2.testo.indexOf(v) >= 0);
  att('e offre «Aggiorna ora»', true, r2.aggiorna);

  modo = 'offline';
  const r3 = await premi();
  vero('sito irraggiungibile: lo dice  [' + r3.testo.slice(0, 80) + ']', /Impossibile verificare/.test(r3.testo));
  await pg.evaluate(() => document.getElementById('bsiUp-modal').classList.remove('open'));

  /* l'avviso a comparsa di BSIAggiorna.controlla(), negli stessi tre casi */
  const avviso = () => pg.evaluate(() => (document.getElementById('bsi-agg-esito') || {}).textContent || '');
  modo = 'normale';
  att('controlla(): stessa versione', 'aggiornata', await pg.evaluate(() => BSIAggiorna.controlla()));
  vero('e l\'avviso lo dice  [' + (await avviso()).slice(0, 70) + ']', /già aggiornata/.test(await avviso()));
  modo = 'nuova';
  await pg.evaluate(() => { window._aggChiesto = 0; return navigator.serviceWorker.getRegistration().then(r => { const u = r.update.bind(r); r.update = () => { window._aggChiesto++; return u(); }; }); });
  att('controlla(): versione nuova', 'nuova', await pg.evaluate(() => BSIAggiorna.controlla()));
  await pg.waitForTimeout(500);
  vero('e chiede al service worker di aggiornarsi', await pg.evaluate(() => window._aggChiesto > 0));
  modo = 'offline';
  att('controlla(): senza rete', 'offline', await pg.evaluate(() => BSIAggiorna.controlla()));
  vero('e l\'avviso parla della connessione', /connessione/.test(await avviso()));

  att('nessun errore JavaScript', 0, errs.length);
  errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
