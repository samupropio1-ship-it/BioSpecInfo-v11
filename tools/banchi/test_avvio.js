#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_avvio — l'avvio non carica da solo il motore chimico (RDKit)

   PERCHE' QUESTO BANCO ESISTE

   Richiesta dell'autore (v247): «ottimizza tutto». Misurato l'avvio su un
   telefono simulato lento (CPU ×4): il blocco piu' lungo dello schermo, ~2 s,
   veniva da due precaricamenti partiti da soli pochi secondi dopo l'apertura:
   · l'archivio dei nomi di «Linguaggi delle molecole» (bsi-pannelli-lingua.js),
     che caricava RDKit (6,7 MB di wasm) e indicizzava tutte le molecole;
   · il riscaldamento di RDKit (bsi-spettri.js), 1,5 s dopo il caricamento.
   Dalla v247 l'archivio si costruisce quando si apre il convertitore, e RDKit
   si scalda solo in Chimica, solo con l'app ferma da 4 s, mai con «Risparmio
   dati». Chi apre una sezione che lo usa lo carica subito, come prima.

   Il banco pretende i COMPORTAMENTI (non i millisecondi, che su una macchina
   di prova non sono ripetibili):
   · con l'app in uso (scorrimento continuo) RDKit non parte da solo;
   · in Fisica, anche da fermi, non parte;
   · con «Risparmio dati» non parte;
   · in Chimica, da fermi, si scalda da solo (la prima molecola lo trova pronto);
   · l'archivio dei nomi non c'e' all'avvio e si costruisce aprendo
     «Linguaggi delle molecole», con le sue molecole;
   · chi chiede RDKit lo ottiene comunque subito.

   USO   node tools/banchi/test_avvio.js    (serve un server su :8899)
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
  const errs = [];
  async function pagina(prima) {
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    if (prima) await pg.addInitScript(prima);
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSIMaterie && window.bsiLoadRDKit && window.BSIMolLingue), null, { timeout: 60000 });
    return { ctx, pg };
  }
  const stato = pg => pg.evaluate(() => ({ rd: !!(window.__rdkit || window.__rdkitLoading), arch: !!BSIMolLingue.archivio }));

  console.log('\n── Con l\'app in uso ──');
  let { ctx, pg } = await pagina();
  for (let i = 0; i < 14; i++) { await pg.waitForTimeout(500); await pg.mouse.wheel(0, 120); }
  let s = await stato(pg);
  vero('7 secondi di scorrimento: RDKit non è partito da solo', !s.rd);
  vero('e l\'archivio dei nomi non è stato costruito', !s.arch);
  /* chi lo chiede lo ottiene subito */
  const chiesto = await pg.evaluate(() => new Promise(r => window.bsiLoadRDKit(R => r(!!R && typeof R.get_mol === 'function'))));
  vero('chi chiede RDKit (una sezione che lo usa) lo ottiene comunque', chiesto);
  await ctx.close();

  console.log('\n── Da fermi ──');
  ({ ctx, pg } = await pagina());
  await pg.evaluate(() => BSIMaterie.imposta('fisica')); await pg.waitForTimeout(7000);
  s = await stato(pg);
  vero('in Fisica, 7 secondi da fermi: RDKit non parte', !s.rd);
  await ctx.close();

  ({ ctx, pg } = await pagina(() => { try { Object.defineProperty(navigator, 'connection', { configurable: true, get() { return { saveData: true, addEventListener() {} }; } }); } catch (e) {} }));
  await pg.waitForTimeout(7000); s = await stato(pg);
  vero('con «Risparmio dati», in Chimica da fermi: RDKit non parte', !s.rd);
  await ctx.close();

  ({ ctx, pg } = await pagina());
  const caldo = await pg.waitForFunction(() => !!window.__rdkit, null, { timeout: 60000 }).then(() => true).catch(() => false);
  vero('in Chimica, da fermi: RDKit si scalda da solo (la prima molecola lo trova pronto)', caldo);
  s = await stato(pg);
  vero('ma l\'archivio dei nomi aspetta che serva', !s.arch);
  await pg.evaluate(() => window.bsiApriMolingue());
  const n = await pg.waitForFunction(() => BSIMolLingue.archivio && Object.keys(BSIMolLingue.archivio).length, null, { timeout: 60000 }).then(h => h.jsonValue()).catch(() => 0);
  vero('aperto «Linguaggi delle molecole», l\'archivio si costruisce (' + n + ' molecole)', n > 100);
  await ctx.close();

  att('nessun errore JavaScript', 0, errs.length);
  errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
