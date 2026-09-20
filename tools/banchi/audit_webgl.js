/* CONTESTI WEBGL: la risorsa piu' scarsa del browser.
   Ne concede una quindicina per scheda; al sedicesimo uccide il piu' vecchio
   senza avvisare, e una vista 3D aperta prima smette di disegnare. Se ogni
   apertura del visore molecolare ne crea uno nuovo senza liberare il
   precedente, dopo una decina di molecole guardate la app "si rompe" — ed e'
   esattamente il tipo di guasto che compare solo dopo un'ora di studio. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const SONDA = () => {
  window.__gl = { creati: 0, persi: 0, vivi: 0 };
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (tipo) {
    const c = orig.apply(this, arguments);
    if (c && /webgl/i.test(String(tipo))) {
      window.__gl.creati++; window.__gl.vivi++;
      this.addEventListener('webglcontextlost', () => { window.__gl.persi++; window.__gl.vivi--; });
    }
    return c;
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  for (const [file, sezioni] of [
    ['index.html', ['smol', 'smacro3d', 'sstruct', 'smol', 'smacro3d', 'sstruct', 'smol', 'smacro3d']],
    ['astro.html', null]
  ]) {
    console.log('\n── ' + file + ' ──');
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const pg = await ctx.newPage();
    const err = [];
    pg.on('pageerror', e => err.push(e.message));
    await pg.addInitScript(SONDA);
    await pg.goto('http://127.0.0.1:8899/' + file, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(3000);

    if (sezioni) {
      for (const s of sezioni) {
        await pg.evaluate(id => {
          const el = document.querySelector('[data-s="' + id + '"]');
          if (el) el.click();
        }, s);
        await pg.waitForTimeout(700);
      }
    } else {
      // astro: si girano le viste principali piu' volte
      for (let g = 0; g < 3; g++) {
        const n = await pg.evaluate(async () => {
          const b = Array.from(document.querySelectorAll('button')).slice(0, 14);
          for (const x of b) { try { x.click(); } catch (e) {} await new Promise(r => setTimeout(r, 150)); }
          return b.length;
        });
        if (!g) console.log('    · ' + n + ' comandi per giro');
      }
    }
    await pg.waitForTimeout(1500);

    const gl = await pg.evaluate(() => window.__gl);
    console.log('    · contesti WebGL creati: ' + gl.creati + ', persi: ' + gl.persi + ', vivi: ' + gl.vivi);
    // Il limite vero del browser e' intorno a 16: restare sotto 12 lascia
    // margine anche a chi ha altre schede aperte sullo stesso dominio.
    att('i contesti WebGL vivi restano sotto il limite del browser', true, gl.vivi < 12);
    att('nessun contesto e\' stato ucciso dal browser', 0, gl.persi);
    att('nessun errore JS', 0, err.length);
    err.slice(0, 3).forEach(e => console.log('       ! ' + e.slice(0, 150)));
    await ctx.close();
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
