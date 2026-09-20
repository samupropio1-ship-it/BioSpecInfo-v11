/* GLI SPETTRI DISEGNATI SU CANVAS.
   Tre grafici non passano dagli SVG e quindi sfuggivano al banco degli assi:
   drawIRSpectrum (#irCanvas), drawMSSpectrum (#msCanvas) e drawUVSpectrum
   (#uvCanvas). Per misurarli si intercetta fillText: le etichette delle
   tacche, con la loro x, dicono in che verso corre l'asse — la stessa cosa
   che negli SVG si legge dai <text>. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const SONDA = () => {
  window.__etichette = [];
  const orig = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (t, x, y) {
    try {
      window.__etichette.push({
        tela: (this.canvas && this.canvas.id) || '?',
        t: String(t), x: x, y: y
      });
    } catch (e) {}
    return orig.apply(this, arguments);
  };
};

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
  await pg.addInitScript(SONDA);
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(3000);

  async function misura(sezione, tela, disegna) {
    await pg.evaluate(s => {
      const b = document.querySelector('[data-s="' + s + '"]');
      if (b) b.click();
    }, sezione);
    await pg.waitForTimeout(900);
    await pg.evaluate(d => { window.__etichette = []; try { eval(d); } catch (e) {} }, disegna);
    await pg.waitForTimeout(700);
    return pg.evaluate(t => {
      const e = (window.__etichette || []).filter(x => x.tela === t);
      if (!e.length) return { n: 0, tutte: [] };
      /* "la riga piu' in basso" non funziona: sotto le tacche c'e' ancora il
         TITOLO dell'asse, che e' l'elemento con y massima, e il filtro
         scartava proprio i numeri da misurare. Si raggruppano invece le
         etichette numeriche per riga (y arrotondata) e si prende la riga
         piu' popolosa: le tacche di un asse stanno tutte alla stessa
         altezza, e sono molte. */
      // Le tacche non sono sempre numeri nudi: l'asse UV scrive "200 nm".
      // Il filtro solo-numerico le buttava via e la misura restava vuota.
      const num = e.filter(x => /^-?\d+(\.\d+)?(\s*(nm|ppm|cm⁻¹|Da))?$/.test(x.t.trim()))
                   .map(x => ({ x: x.x, y: x.y, t: (x.t.match(/-?\d+(\.\d+)?/) || ['0'])[0] }));
      if (num.length < 3) return { n: num.length, tutte: e.slice(0, 8).map(x => x.t) };
      const righe = {};
      num.forEach(x => { const k = Math.round(x.y / 6) * 6; (righe[k] = righe[k] || []).push(x); });
      let basso = [];
      Object.keys(righe).forEach(k => { if (righe[k].length > basso.length) basso = righe[k]; });
      if (basso.length < 3) return { n: basso.length, tutte: num.slice(0, 8).map(x => x.t) };
      const ord = basso.slice().sort((a, c) => a.x - c.x);
      let su = 0, giu = 0;
      for (let i = 1; i < ord.length; i++) {
        const va = parseFloat(ord[i].t), vb = parseFloat(ord[i - 1].t);
        if (va > vb) su++; else if (va < vb) giu++;
      }
      return { n: basso.length, primo: parseFloat(ord[0].t),
               ultimo: parseFloat(ord[ord.length - 1].t),
               verso: su > giu ? 'crescente' : (giu > su ? 'decrescente' : 'incerto') };
    }, tela);
  }

  console.log('\n1) IR su canvas (sezione "IR & Vis") — deve calare, 4000 → 400');
  const ir = await misura('sirvis', 'irCanvas', "window.drawIRSpectrum && window.drawIRSpectrum('alcol')");
  console.log('    · ' + JSON.stringify(ir));
  if (ir.n >= 3) {
    att('asse decrescente come vuole la convenzione IR', 'decrescente', ir.verso);
    att('parte da un numero d\'onda alto', true, ir.primo >= 3000);
  } else { ko++; console.log('  ✗ non sono riuscito a misurare le tacche di irCanvas'); }

  console.log('\n2) MS (spettro di massa) — m/z deve CRESCERE');
  const ms = await misura('sms', 'msCanvas', "window.drawMSSpectrum && window.drawMSSpectrum('arene')");
  console.log('    · ' + JSON.stringify(ms));
  if (ms.n >= 3) {
    att('asse m/z crescente', 'crescente', ms.verso);
  } else { ko++; console.log('  ✗ non sono riuscito a misurare le tacche di msCanvas'); }

  console.log('\n3) UV-Vis — la lunghezza d\'onda deve CRESCERE');
  const uv = await misura('suvvis', 'uvCanvas', "window.drawUVSpectrum && window.drawUVSpectrum('cromofori')");
  console.log('    · ' + JSON.stringify(uv));
  if (uv.n >= 3) {
    att('asse λ crescente', 'crescente', uv.verso);
    att('parte da ~200 nm', true, uv.primo <= 260);
  } else { ko++; console.log('  ✗ non sono riuscito a misurare le tacche di uvCanvas'); }

  att('nessun errore JS', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 150)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
