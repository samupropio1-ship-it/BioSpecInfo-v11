#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_risoluzione — la risoluzione di tutte le animazioni (v264)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto «4K, non così sgranato, per tutte le animazioni».
   Le cause erano tre: ogni tela limitava i pixel a 2× (su un telefono a 3×
   l'immagine veniva ingrandita), la resa «cinema» disegnava su un buffer
   senza antialiasing e ci aggiungeva una grana voluta. Qui si pretende:
   · nel codice non resta nessun limite fisso «Math.min(2, devicePixelRatio)»:
     tutte le tele passano da BSIRisoluzione;
   · i conti: 4K = 1,5× i pixel fisici (fino a 4×), nativa = i pixel fisici,
     risparmio = 1×; mai oltre 3840 px sul lato lungo né oltre 3840×2160
     pixel per tela;
   · sul telefono a 3× una scena 3D disegna davvero a 4× (non più a 2×), la
     resa cinema usa un bersaglio multicampionato e niente grana;
   · cambiare modo aggiorna subito le scene già aperte; la foto 📷 esce a
     3840 px; nessun errore.

   USO   node tools/banchi/test_risoluzione.js   (serve un server su :8899)
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
  console.log('── Il codice ──');
  const file = fs.readdirSync(RADICE).filter(f => /^bsi-.*\.js$/.test(f) || /^(index|astro|chimorga|rdkit_lab|spectra-studio)\.html$/.test(f));
  const fissi = [];
  file.forEach(f => { const s = fs.readFileSync(path.join(RADICE, f), 'utf8').split('\n'); s.forEach((l, i) => { if (/Math\.min\([^)]*devicePixelRatio[^)]*\)/.test(l) && !/BSIRisoluzione/.test(l)) fissi.push(f + ':' + (i + 1)); }); });
  att('nessun limite fisso alla risoluzione fuori da BSIRisoluzione', '', fissi.slice(0, 5).join(' '));
  vero('bsi-risoluzione.js è caricato per primo nelle cinque pagine', ['index', 'astro', 'chimorga', 'rdkit_lab', 'spectra-studio'].every(p => { const s = fs.readFileSync(path.join(RADICE, p + '.html'), 'utf8'); return s.indexOf('bsi-risoluzione.js') >= 0 && s.indexOf('bsi-risoluzione.js') < s.indexOf('<script', s.indexOf('<script') + 1); }));

  console.log('\n── I conti ──');
  const mem = {}, ctx = { Math, Object, Array, String, Number, setInterval: () => 0, clearInterval() {}, localStorage: { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } }, devicePixelRatio: 3, Event: function () {}, CustomEvent: function () {}, dispatchEvent() {} };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-risoluzione.js'), 'utf8'), ctx);
  const R = ctx.BSIRisoluzione;
  att('telefono a 3×, modo 4K (predefinito): 4× (prima 2×)', 4, R.dpr(412, 500));
  R.imposta('nativa'); att('modo nativa: 3×', 3, R.dpr(412, 500));
  R.imposta('risparmio'); att('modo risparmio: 1×', 1, R.dpr(412, 500));
  R.imposta('ultra'); ctx.devicePixelRatio = 1; att('schermo a 1×, modo 4K: 1,5× (supercampionamento)', 1.5, R.dpr(800, 450));
  ctx.devicePixelRatio = 2; vero('schermo intero 1920×1080 a 2×: si disegna in 4K esatto (3840 px), non oltre', Math.abs(1920 * R.dpr(1920, 1080) - 3840) < 1);
  ctx.devicePixelRatio = 3; { const r = R.dpr(1600, 1600); vero('tela quadrata enorme: mai oltre 3840×2160 pixel (' + Math.round(1600 * r) + '² px)', (1600 * r) ** 2 <= 3840 * 2160 + 1); }

  console.log('\n── La pagina, telefono a 3× ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIRisoluzione && window.BSIBioLab3D && window.BSISpectraLive && window.BSILab3D), null, { timeout: 60000 });
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = {};
    BSISpectraLive.calcolo.apriSezione('smecc3d'); await P(900);
    const d = document.querySelector('#smecc3d .bsiM3-scelte').parentNode, a = d._m3; for (let i = 0; i < 80 && !a.pronto; i++) await P(200);
    a.gioca(false); a.S.box.scrollIntoView({ block: 'center' }); await P(600);
    const c = a.S.ren.domElement; o.modo = BSIRisoluzione.modo(); o.rapporto = +(c.width / c.clientWidth).toFixed(2);
    o.msaa = a.S._post && a.S._post.msaa; o.grana = a.S._post && a.S._post.grana;
    o.agganciato = BSIRisoluzione.renderer().indexOf(a.S.ren) >= 0;
    o.bottone = !!a.S.box.querySelector('.bsi3d-qualita') && a.S.box.querySelector('.bsi3d-qualita').textContent;
    BSIRisoluzione.imposta('risparmio'); await P(300); o.risparmio = +(c.width / c.clientWidth).toFixed(2); o.bottone2 = a.S.box.querySelector('.bsi3d-qualita').textContent;
    BSIRisoluzione.imposta('ultra'); await P(300); o.ritorno = +(c.width / c.clientWidth).toFixed(2);
    const url = BSIRisoluzione.foto4K(a.S.ren, () => a.S.disegna()); const im = new Image(); im.src = url; await im.decode(); o.foto = Math.max(im.width, im.height); o.dopoFoto = +(c.width / c.clientWidth).toFixed(2);
    /* una tela 2D del motore comune */
    const cv = [...document.querySelectorAll('canvas')].find(x => x.clientWidth > 100 && x.getContext && !x.getAttribute('data-engine') && x.width / x.clientWidth > 1);
    o.tela2d = cv ? +(cv.width / cv.clientWidth).toFixed(2) : 0;
    return o;
  });
  att('modo predefinito: 4K', 'ultra', r.modo);
  att('una scena 3D (Meccanismi 3D) disegna a 4× i pixel CSS (prima 2×)', 4, r.rapporto);
  vero('resa cinema con bersaglio multicampionato (MSAA ' + r.msaa + '×) e senza grana', r.msaa >= 2 && r.grana === 0);
  vero('il renderer è registrato, il pulsante della qualità c\'è («' + r.bottone + '» → «' + r.bottone2 + '»)', r.agganciato && r.bottone === '4K' && /Risparmio|Saver/.test(r.bottone2));
  att('cambiando modo la scena aperta si aggiorna subito (risparmio 1×, poi di nuovo 4×)', '1 4', r.risparmio + ' ' + r.ritorno);
  att('la foto 📷 esce a 3840 px e poi la scena torna come prima', '3840 4', r.foto + ' ' + r.dopoFoto);
  vero('anche le tele 2D disegnano oltre 2× (' + r.tela2d + '×)', r.tela2d > 2);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
