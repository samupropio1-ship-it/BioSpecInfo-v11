/* PROMESSE RIFIUTATE E MAI RACCOLTE.
   Una promise che fallisce senza .catch non alza un "pageerror": nei banchi
   precedenti passava del tutto inosservata. Eppure e' proprio il guasto che
   lascia le interfacce a meta' — la barra che non sparisce, il pulsante che
   resta grigio — perche' la funzione muore fra un await e l'altro senza dire
   niente a nessuno. Qui si ascolta unhandledrejection, e si stressa la app
   nelle condizioni in cui le promesse falliscono davvero: rete morta. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://127.0.0.1:8899/';

const PAGINE = ['index.html', 'astro.html', 'chimorga.html', 'accademia.html',
  'rdkit_lab.html', 'simulazioni.html', 'pro.html', 'sr_completo.html',
  'sr_essenziale.html', 'file_manager.html', 'Biochimica_Guida_Definitiva.html'];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  async function prova(file, reteMorta) {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const pg = await ctx.newPage();
    const rifiuti = [];
    await pg.addInitScript(() => {
      window.__rifiuti = [];
      window.addEventListener('unhandledrejection', ev => {
        const r = ev.reason;
        window.__rifiuti.push(r && r.message ? r.message : String(r));
      });
    });
    if (reteMorta) {
      // tutto cio' che non e' la pagina stessa non risponde: e' la condizione
      // in cui ogni fetch dell'app fallisce, e le promesse scoperte emergono
      await pg.route('**/*', r =>
        r.request().url().indexOf('127.0.0.1:8899') >= 0 ? r.continue() : r.abort('failed'));
    }
    await pg.goto(BASE + file, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(2000);
    // si toccano i comandi principali: e' li' che partono le promesse
    await pg.evaluate(async () => {
      const els = Array.from(document.querySelectorAll('button, [data-s], [onclick]')).slice(0, 20);
      for (const el of els) {
        try { el.click(); } catch (e) {}
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await pg.waitForTimeout(1500);
    const out = await pg.evaluate(() => window.__rifiuti.slice(0, 6));
    await ctx.close();
    return out;
  }

  console.log('\n═══ Rete a posto ═══');
  for (const p of PAGINE) {
    const r = await prova(p, false);
    att(p.replace('.html', '') + ' — nessuna promessa rifiutata e abbandonata', 0, r.length);
    r.forEach(x => console.log('       ! ' + String(x).slice(0, 150)));
  }

  console.log('\n═══ Rete morta (ogni fetch verso l\'esterno fallisce) ═══');
  for (const p of PAGINE) {
    const r = await prova(p, true);
    att(p.replace('.html', '') + ' — nessuna promessa rifiutata e abbandonata', 0, r.length);
    r.forEach(x => console.log('       ! ' + String(x).slice(0, 150)));
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
