/* Cosa succede quando localStorage.setItem LANCIA.
   Non simulo la quota riempiendola (un byte ci sta sempre): sostituisco
   setItem con una funzione che lancia sempre, come fa Safari in navigazione
   privata e come fa qualunque browser a memoria esaurita. Ogni setItem non
   protetto uccide la funzione che lo conteneva: il pulsante smette di
   rispondere e l'utente pensa che l'app sia rotta. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const SEME = () => {
  const err = () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; };
  try {
    const proto = Object.getPrototypeOf(localStorage);
    Object.defineProperty(localStorage, 'setItem', { value: err, configurable: true });
    Object.defineProperty(localStorage, 'removeItem', { value: err, configurable: true });
  } catch (e) { /* niente da fare */ }
};

const PAGINE = [
  ['index.html', ['[data-s="smol"]', '[data-s="spt"]', '[data-s="scalc"]', '[data-s="snotes"]',
                  '[data-s="spomo"]', '#bsi-spectra-fab']],
  ['astro.html', ['button', '[onclick]']],
  ['chimorga.html', ['button', '[onclick]']],
  ['accademia.html', ['button', '[onclick]']],
  ['rdkit_lab.html', ['button', '[onclick]']],
  ['sr_completo.html', ['button', '[onclick]']],
  ['sr_essenziale.html', ['button', '[onclick]']],
  ['pro.html', ['button', '[onclick]']],
  ['simulazioni.html', ['button', '[onclick]']],
  ['file_manager.html', ['button', '[onclick]']]
];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  for (const [file, sel] of PAGINE) {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const pg = await ctx.newPage();
    const err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => {
      if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text()))
        err.push('console: ' + m.text());
    });
    await pg.addInitScript(SEME);
    await pg.goto('http://127.0.0.1:8899/' + file, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(2000);
    // clicca i primi 12 comandi visibili: e' li' che vivono i salvataggi
    await pg.evaluate(async sels => {
      const visti = [];
      for (const s of sels) document.querySelectorAll(s).forEach(e => { if (visti.indexOf(e) < 0) visti.push(e); });
      for (const el of visti.slice(0, 12)) {
        try { el.click(); } catch (e) { /* raccolto da pageerror */ }
        await new Promise(r => setTimeout(r, 90));
      }
    }, sel);
    await pg.waitForTimeout(800);
    att(file + ' sopravvive a una memoria esaurita', 0, err.length);
    err.slice(0, 4).forEach(e => console.log('       ! ' + e.slice(0, 160)));
    await ctx.close();
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
