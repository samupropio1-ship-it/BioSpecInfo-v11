#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_animmat — 🎞️ Animazioni matematiche (v262)

   PERCHE' QUESTO BANCO ESISTE
   I film di matematica mostrano numeri nell'HUD: devono essere quelli veri.
   · Fourier: il picco della somma parziale tende a 1,179 (Gibbs, ~9 % del
     salto di 2), non a 1;
   · Riemann: con f(0) = f(π) l'errore scende come 1/n² (raddoppiando n si
     divide per 4);
   · Taylor: l'errore in π del polinomio di grado 7 sta sotto il limite di
     Lagrange π⁹/9!;
   · derivata: la secante di x³ − 2x in 1 con h = 0,001 vale 1,003;
   · Galton: media ≈ 6 e varianza ≈ 3 per 12 righe, entro le fluttuazioni;
   · Buffon: la stima di π entro 3 errori standard;
   · Fibonacci → φ; (1 + 1/n)ⁿ con n = 10⁶ a meno di e/(2n) da e.
   Poi la pagina, sul telefono: le nove animazioni disegnano, l'HUD ha i
   numeri, nessun errore.

   USO   node tools/banchi/test_animmat.js   (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, a, v) { if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON, NaN }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, tt: a => a[0], sezione() {}, el() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-mat-animazioni.js'), 'utf8'), ctx);
  const C = ctx.BSIAnimMat.calcolo;
  console.log('── I numeri ──');
  att('nove animazioni', 'fourier,riemann,taylor,derivata,eulero,galton,buffon,fibonacci,e', ctx.BSIAnimMat.A.map(a => a.id).join(','));
  att('Gibbs: picco della somma parziale fino a k = 199', '1.179', C.piccoGibbs(199).toFixed(3));
  { const e64 = C.riemann(64) - C.ESATTO_RIEMANN, e128 = C.riemann(128) - C.ESATTO_RIEMANN; att('Riemann: raddoppiando n l\'errore si divide per 4', '4.00', (e64 / e128).toFixed(2)); }
  { const r = Math.abs(C.taylorSin(Math.PI, 7) - Math.sin(Math.PI)), lag = Math.pow(Math.PI, 9) / 362880; vero('Taylor grado 7 in π: errore ' + r.toExponential(2) + ' ≤ Lagrange ' + lag.toExponential(2), r <= lag); }
  att('secante di x³ − 2x in 1 con h = 0,001', '1.003001', C.secante(1, 1e-3).toFixed(6));
  { const G = C.galton(800, 12, 11); let m = 0, v = 0; G.conta.forEach((c, k) => m += k * c); m /= 800; G.conta.forEach((c, k) => v += c * (k - m) ** 2); v /= 799;
    vero('Galton: media ' + m.toFixed(2) + ' (6 ± 0,06), varianza ' + v.toFixed(2) + ' (3 ± 0,45)', Math.abs(m - 6) < 0.18 && Math.abs(v - 3) < 0.45); att('Galton: tutte le 800 palline contate', 800, G.conta.reduce((a, b) => a + b, 0)); }
  { const B = C.buffon(3000, 1, 1, 5), se = Math.PI * Math.sqrt((Math.PI / 2 - 1) / 3000); vero('Buffon: π ≈ ' + B.stima.toFixed(4) + ' entro 3 errori standard (' + (3 * se).toFixed(3) + ')', Math.abs(B.stima - Math.PI) < 3 * se); }
  vero('Fibonacci: F(20)/F(19) a meno di 10⁻⁷ da φ', Math.abs(C.fib(20) / C.fib(19) - C.PHI) < 1e-7);
  vero('(1 + 1/n)ⁿ con n = 10⁶: scarto ' + (Math.E - C.eLim(1e6)).toExponential(2) + ' ≈ e/(2n) = 1,36·10⁻⁶', Math.abs((Math.E - C.eLim(1e6)) / (Math.E / 2e6) - 1) < 0.01);

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIAnimMat && window.BSISpectraLive), null, { timeout: 60000 });
  vero('il pulsante «Animazioni matematiche» è nella barra della matematica', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="sanimmat"]')));
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = { a: [] };
    BSISpectraLive.calcolo.apriSezione('sanimmat'); await P(900);
    const d = document.querySelector('#sanimmat .bsiAM-scelte').parentNode; o.scelte = document.querySelectorAll('#sanimmat .bsiAM-scelte button').length;
    for (const A of BSIAnimMat.A) {
      const a = d._apri(A.id); a.gioca(false); a.tela.scrollIntoView({ block: 'center' }); a.vai(A.durata * 0.8); await P(200);
      const c = a.tela, q = c.getContext('2d'), dd = q.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < dd.length; i += 40) if (dd[i] + dd[i + 1] + dd[i + 2] > 200) n++;
      o.a.push({ id: A.id, px: n, hud: a.hud.textContent.length, rapp: +(c.clientHeight / c.clientWidth).toFixed(2), dida: (c.getAttribute('aria-label') || '').length });
    }
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o;
  });
  att('nove animazioni da scegliere', 9, r.scelte);
  r.a.forEach(s => vero(s.id + ': disegna (' + s.px + ' campioni luminosi), HUD con i numeri, formato verticale (' + s.rapp + '), descritta per i lettori di schermo', s.px > 40 && s.hud > 10 && s.rapp > 1.5 && s.dida > 30));
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
