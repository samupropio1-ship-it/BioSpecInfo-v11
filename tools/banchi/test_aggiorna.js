/* La finestra degli aggiornamenti dev'essere RAGGIUNGIBILE.
   Esisteva, funzionava, e il suo unico pulsante stava dentro #hdr-actions,
   che un foglio di stile successivo nasconde con display:none!important.
   Cioe': nessun modo di aprirla. Ed era la ragione letterale di "non ci
   sono aggiornamenti in app". */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };
  const visibile = sel => pg.evaluate(s => {
    const e = document.querySelector(s);
    if (!e) return 'assente';
    let p = e;
    while (p && p !== document.documentElement) {
      if (getComputedStyle(p).display === 'none') return 'nascosto da ' + (p.id || p.tagName);
      p = p.parentElement;
    }
    return 'visibile';
  }, sel);

  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(3500);

  console.log('\n1) La versione dichiarata e\' quella vera');
  const ver = await pg.evaluate(() => window.BSI_APP_VERSION);
  const sw = await pg.evaluate(() => fetch('./sw.js').then(r => r.text())
    .then(t => (t.match(/CACHE\s*=\s*'([^']+)'/) || [])[1]));
  console.log('    · app: ' + ver + '   ·  sw.js: ' + sw);
  att('BSI_APP_VERSION coincide con la cache del service worker', sw, ver);
  att('e non e\' piu\' la vecchia v140', false, /v140/.test(String(ver)));

  console.log('\n2) Si arriva alla finestra degli aggiornamenti');
  att('il vecchio 🔄 e\' ancora sepolto (il difetto era questo)',
    'nascosto da hdr-actions', await visibile('#bsiUp-btn'));
  // il menu ✨ e' dove sono finite le icone dell'header
  /* Il menu vivo NON e' #bsi105-menu della v10.5 (nascosto anche quello,
     verificato: display:none sia su desktop sia su telefono) ma il pannello
     #bsi14-sheet aperto dal ✨ #bsi14-fab, l'unico realmente cliccabile
     insieme a Spectra. Mettere la voce nel menu sbagliato avrebbe
     riprodotto esattamente il difetto che si stava correggendo. */
  const nelMenu = await pg.evaluate(() => {
    const f = document.getElementById('bsi14-fab');
    if (f) f.click();
    const sheet = document.getElementById('bsi14-sheet');
    const riga = sheet ? sheet.querySelector('[data-key="aggiorna"]') : null;
    return {
      fabVisibile: !!(f && getComputedStyle(f).display !== 'none'),
      pannelloAperto: !!(sheet && sheet.classList.contains('open')),
      ceLaVoce: !!riga,
      testo: riga ? riga.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : ''
    };
  });
  att('il ✨ e\' davvero cliccabile', true, nelMenu.fabVisibile);
  att('il pannello strumenti si apre', true, nelMenu.pannelloAperto);
  att('e contiene la voce Aggiornamenti', true, nelMenu.ceLaVoce);
  console.log('    · voce: ' + nelMenu.testo);

  console.log('\n3) La voce apre davvero la finestra');
  await pg.evaluate(() => {
    const r = document.querySelector('#bsi14-sheet [data-key="aggiorna"]');
    if (r) r.click();
  });
  await pg.waitForTimeout(900);
  const ap = await pg.evaluate(() => {
    const m = document.getElementById('bsiUp-modal');
    return { aperta: !!(m && m.classList.contains('open')),
             testo: m ? m.textContent.slice(0, 90) : '' };
  });
  att('la finestra si apre', true, ap.aperta);
  att('e dichiara la versione giusta', true, ap.testo.indexOf(String(ver).replace('bsi-', '')) >= 0
    || ap.testo.indexOf(String(ver)) >= 0);
  console.log('    · ' + ap.testo.replace(/\s+/g, ' '));

  att('nessun errore JS', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 150)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
