/* La guida al proxy deve stare DOVE nasce il problema.
   Il proxy e' l'unica risposta definitiva ai blocchi CORS e ai limiti al
   minuto, e non era difficile da attivare: era difficile da trovare, perche'
   le istruzioni stavano in un README del repository — cioe' fuori dal
   telefono su cui Spectra smette di rispondere. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'] });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) err.push('console: ' + m.text());
  });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => document.getElementById('bsi-spectra-fab').click());
  await pg.waitForTimeout(1200);

  console.log('\n1) Si arriva alla guida dal riquadro del proxy');
  const apre = await pg.evaluate(() => {
    document.getElementById('bsi-hub-proxyhead').click();      // apre il riquadro
    const b = document.getElementById('bsi-hub-comefare');
    if (!b) return { bottone: false };
    b.click();
    const g = document.getElementById('bsi-hub-guidaproxy');
    return {
      bottone: true,
      aperta: !!(g && g.style.display === 'block'),
      // solo i comandi veri: fra i <code> c'e' anche il "proxy/" citato
      // nel testo del passo 3, che non e' un comando da eseguire
      passi: g ? g.querySelectorAll('code[id^="bsi-cmd-"]').length : 0,
      testo: g ? g.textContent.replace(/\s+/g, ' ') : ''
    };
  });
  att('il pulsante "come si attiva" esiste', true, apre.bottone);
  att('e apre la guida', true, apre.aperta);
  att('con i comandi da eseguire', 4, apre.passi);
  att('spiega che le chiavi finiscono sul server', true, /chiavi stanno sul server/i.test(apre.testo));
  att('e che i fornitori bloccati tornano a rispondere', true, /non rispondono cominciano a rispondere/i.test(apre.testo));
  att('nomina wrangler deploy', true, /wrangler deploy/.test(apre.testo));
  att('e il segreto con la chiave', true, /wrangler secret put GROQ_KEYS/.test(apre.testo));

  console.log('\n2) I comandi si copiano davvero');
  const cop = await pg.evaluate(async () => {
    const b = document.querySelector('#bsi-hub-guidaproxy .bsi-copia');
    if (!b) return { ok: false };
    const atteso = b.getAttribute('data-cmd');
    b.click();
    await new Promise(r => setTimeout(r, 400));
    let letto = '';
    try { letto = await navigator.clipboard.readText(); } catch (e) { letto = '(non leggibile)'; }
    return { ok: true, atteso, letto, etichetta: b.textContent };
  });
  att('c\'è un pulsante copia', true, cop.ok);
  att('e ha copiato il comando giusto', cop.atteso, cop.letto);
  att('dandone conferma a schermo', true, /copiato/.test(cop.etichetta || ''));

  console.log('\n3) Chiudendo si richiude, senza rompere nulla');
  const chiudi = await pg.evaluate(() => {
    document.getElementById('bsi-hub-comefare').click();
    const g = document.getElementById('bsi-hub-guidaproxy');
    return { chiusa: g.style.display === 'none' };
  });
  att('la guida si richiude', true, chiudi.chiusa);
  att('nessun errore JS', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 150)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
