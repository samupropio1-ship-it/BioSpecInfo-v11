#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_metodi — 📐 Metodi Fisici in Chimica Organica (v270)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha integrato la teoria delle dispense (IR Hooke, UV Woodward,
   NMR Larmor/Karplus, MS) con il catalogo delle tracce e il risolutore,
   chiedendo UNA SOLA base di conoscenza, senza duplicati. Qui si pretende:
   · i calcoli nuovi danno i numeri giusti del libro — Hooke (con l'effetto
     isotopico C–H/C–D), Woodward-Fieser per dieni ed enoni, Karplus,
     conversione δ↔Hz, Larmor, regola dell'azoto;
   · il catalogo esiste, con data/formula/prosa leggibile;
   · sulla pagina: le due schede si costruiscono, i calcolatori mostrano un
     risultato, e il risolutore DELEGA al motore esistente (BSIQuesito →
     BSIElucida) e produce le deduzioni; lo strumento di Spectra risponde.
   Nessun errore JavaScript, non sborda.

   USO   node tools/banchi/test_metodi.js   (serve un server su :8899)
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
function vicino(d, a, v, tol) { if (Math.abs(a - v) <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + v); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + ' ±' + tol + '\n      avuto:  ' + v); } }

(async () => {
  /* ── 1. i calcoli, senza browser ── */
  const ctx = { Math, Object, Array, String, Number, isFinite, JSON, Date, setInterval: () => 0, clearInterval() {}, Promise };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: (a) => a, tt: (v) => Array.isArray(v) ? v[0] : v, el: () => ({ appendChild() {} }), sezione() {}, calcolo: {}, scelta() {}, cursore() {}, bottone() {}, tela() {}, alRidimensiona() {}, apri() {} };
  ctx.document = { getElementById: () => null, createElement: () => ({ appendChild() {}, style: {} }), head: { appendChild() {} }, documentElement: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-metodi-fisici.js'), 'utf8'), ctx);
  const M = ctx.BSIMetodi;

  console.log('── I calcoli delle slide ──');
  vicino('Hooke C–H ≈ 3032 cm⁻¹', 3032.1, M.hooke('C–H').cm1, 1);
  vicino('Hooke C–D ≈ 2225 cm⁻¹ (stessa k, massa doppia)', 2224.9, M.hooke('C–D').cm1, 1);
  vicino('effetto isotopico C–H/C–D ≈ 1,36', 1.363, M.hooke('C–H').cm1 / M.hooke('C–D').cm1, 0.003);
  vicino('Hooke C=O ≈ 1731 cm⁻¹', 1730.6, M.hooke('C=O').cm1, 1);
  att('Woodward diene eteroanulare + 2 alchili = 224 nm', 224, M.woodward('diene', 'eteroanulare', ['sost_alchilico', 'sost_alchilico']).lambdaMax);
  att('Woodward enone 6-term + esteso + β-R = 257 nm', 257, M.woodward('enone', 'sei_o_aciclico', ['doppio_esteso', 'beta_R']).lambdaMax);
  att('Karplus 0°/90°/180° = 11 / 2 / 13 Hz', '11 2 13', M.karplus(0).J + ' ' + M.karplus(90).J + ' ' + M.karplus(180).J);
  att('δ↔Hz: 7,26 ppm @400 MHz = 2904 Hz', 2904, M.ppmHz({ ppm: 7.26, mhz: 400 }).hz);
  att('δ↔Hz inverso: 2400 Hz @400 MHz = 6,0 ppm', 6, M.ppmHz({ hz: 2400, mhz: 400 }).ppm);
  vicino('Larmor ¹H a 11,74 T ≈ 500 MHz', 499.85, M.larmor(11.74).mhz, 0.1);
  att('regola dell\'azoto: massa 133 dispari → N dispari', true, M.regolaAzoto(133).dispari);
  att('regola dell\'azoto: massa 134 pari → N pari/zero', false, M.regolaAzoto(134).dispari);

  console.log('\n── Il catalogo delle tracce ──');
  vero('almeno sei tracce con data, formula e prosa', M.CATALOGO.length >= 6 && M.CATALOGO.every(c => /\d{2}\/\d{2}\/\d{4}/.test(c.data) && /^C\d/.test(c.formula) && typeof c.prosa === 'string' && c.prosa.length > 0));
  vero('le tracce illustrative sono dichiarate tali (onestà)', M.CATALOGO.some(c => c.illustrativa) && M.CATALOGO.filter(c => c.illustrativa).every(c => Array.isArray(c.note)));
  { const c = M.CATALOGO.find(x => x.data === '27/02/2023'); vero('la traccia 27/02/2023 è C8H7NO', c && c.formula === 'C8H7NO'); }

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIMetodi && window.BSISpectraLive && window.BSIQuesito), null, { timeout: 60000 });
  vero('il pulsante «Metodi Fisici» è nella barra', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="smetodi"]')));
  vero('Spectra ha lo strumento metodi_fisici', await pg.evaluate(() => (window.BSI_AI_TOOLS || []).some(t => t.name === 'metodi_fisici')));
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = {};
    BSISpectraLive.calcolo.apriSezione('smetodi'); await P(800);
    const sec = document.getElementById('smetodi');
    o.schede = sec.querySelectorAll('.bsiFX-schede button').length;
    /* scheda teoria: i calcolatori mostrano risultati */
    o.ris = sec.querySelectorAll('.bsiMF-ris').length;
    o.haCm = /cm⁻¹/.test(sec.textContent);
    o.haNm = /nm/.test(sec.textContent);
    o.haHz = /Hz/.test(sec.textContent);
    /* passa alla seconda scheda (tracce) */
    const tabs = sec.querySelectorAll('.bsiFX-schede button'); if (tabs[1]) tabs[1].click(); await P(500);
    o.txt = !!sec.querySelector('.bsiMF-txt');
    const solve = Array.prototype.slice.call(sec.querySelectorAll('button')).find(x => /Risolvi|Solve/.test(x.textContent));
    if (solve) solve.dispatchEvent(new MouseEvent('click', { bubbles: true })); await P(500);
    o.ded = sec.querySelectorAll('.bsiMF-ded tr').length;
    o.haIHD = /6/.test((sec.querySelector('.bsiMF-ris') || {}).textContent || '');
    /* lo strumento di Spectra */
    const tool = window.BSI_AI_TOOLS.find(t => t.name === 'metodi_fisici');
    o.toolHooke = await tool.execute({ azione: 'hooke', legame: 'C=O' });
    o.toolTraccia = await tool.execute({ azione: 'traccia', testo: 'C8H7NO IR 1680 cm-1; MS m/z=133' });
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  });
  att('la sezione ha due schede', 2, r.schede);
  vero('i calcolatori mostrano i risultati (cm⁻¹, nm, Hz)', r.ris >= 3 && r.haCm && r.haNm && r.haHz);
  vero('la scheda tracce ha l\'area di testo per incollare lo spettro', r.txt);
  vero('«Risolvi» delega al motore e produce le deduzioni (IHD = 6 per C8H7NO)', r.ded >= 2 && r.haIHD);
  vero('lo strumento calcola Hooke per il C=O (≈1731 cm⁻¹)', r.toolHooke && r.toolHooke.ok && Math.abs(r.toolHooke.risultato.cm1 - 1730.6) < 1);
  vero('lo strumento risolve una traccia (formula letta, deduzioni > 0)', r.toolTraccia && r.toolTraccia.ok && r.toolTraccia.risultato.formula === 'C8H7NO' && r.toolTraccia.risultato.deduzioni > 0);
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 4).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
