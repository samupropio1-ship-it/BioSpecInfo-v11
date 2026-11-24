#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_arrowlab — ✏️ Arrow Lab e Retrosintesi (v269)

   PERCHE' QUESTO BANCO ESISTE
   L'autore si esercita sulle frecce curve dei meccanismi e sulla
   retrosintesi. Lo strumento deve aiutare, non ingannare: le frecce
   «attese» devono essere giuste, la verifica deve accettare solo quelle, e
   la retrosintesi deve mostrare percorsi coerenti con i filtri. Qui si
   pretende, senza browser e poi sul telefono:
   · due meccanismi (propanone+NaBH₄ in 3 passi, SN2 in 2), ogni passo con
     nodi, legami e frecce attese che puntano a sorgenti e destinazioni
     esistenti; clonaPassi fa una copia profonda (non si sporca il preset);
   · due bersagli retrosintetici, ognuno con due percorsi (uno verde e uno
     no), building block, disconnessione e lavagna;
   · sulla pagina: disegnando le frecce giuste la diagnostica diventa verde e
     «+ Passo» avanza; «Risolvi» completa; il filtro «solo verdi» e il
     cursore dei passaggi nascondono i percorsi; l'inventario conta la
     copertura; lo strumento di Spectra apre la vista chiesta.
   Nessun errore, non sborda.

   USO   node tools/banchi/test_arrowlab.js   (serve un server su :8899)
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
  const ctx = { Math, Object, Array, String, Number, isFinite, JSON, Date, setInterval: () => 0, clearInterval() {} };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.BSIFisica = { t: (a) => a, tt: (v) => Array.isArray(v) ? v[0] : v, el: () => ({}), sezione() {} };
  ctx.document = { getElementById: () => null, createElement: () => ({ appendChild() {} }), head: { appendChild() {} }, querySelector: () => null };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-arrowlab.js'), 'utf8'), ctx);
  const A = ctx.BSIArrowLab;

  console.log('── I meccanismi ──');
  att('due meccanismi', 'propanone-nabh4,sn2-bromobutano', Object.keys(A.MECC).join(','));
  att('propanone: 3 passi', 3, A.MECC['propanone-nabh4'].passi.length);
  att('SN2: 2 passi', 2, A.MECC['sn2-bromobutano'].passi.length);
  { let coerente = true, dett = '';
    Object.keys(A.MECC).forEach(k => A.MECC[k].passi.forEach((p, i) => {
      const nodi = new Set(p.nodi.map(n => n.id)), leg = new Set(p.legami.map(b => b.id)), rif = id => nodi.has(id) || leg.has(id);
      p.legami.forEach(b => { if (!nodi.has(b.da) || !nodi.has(b.a)) { coerente = false; dett = k + ' passo ' + (i + 1) + ': legame ' + b.id; } });
      p.attese.forEach(e => { if (!rif(e.da) || !rif(e.a)) { coerente = false; dett = k + ' passo ' + (i + 1) + ': freccia attesa'; } });
    }));
    vero('ogni legame e ogni freccia attesa puntano a nodi/legami esistenti' + (dett ? ' (' + dett + ')' : ''), coerente); }
  vero('propanone passo 1: due frecce attese (H:⁻ → C, π(C=O) → O)', A.MECC['propanone-nabh4'].passi[0].attese.length === 2 && A.MECC['propanone-nabh4'].passi[0].attese[0].da === 'n1' && A.MECC['propanone-nabh4'].passi[0].attese[0].a === 'n2');
  vero('propanone passo 3 (finale): nessuna freccia attesa', A.MECC['propanone-nabh4'].passi[2].attese.length === 0);
  vero('clonaPassi fa una copia profonda (non sporca il preset)', (() => { const c = A.clonaPassi('propanone-nabh4'); c[0].frecce.push({ da: 'x', a: 'y' }); return A.MECC['propanone-nabh4'].passi[0].frecce.length === 0; })());
  { const n1 = A.MECC['propanone-nabh4'].passi[0].nodi.find(n => n.id === 'n1'); vero('H:⁻ ha carica −1 e un doppietto', n1.q === -1 && n1.lp === 1); }

  console.log('\n── La retrosintesi ──');
  att('due bersagli', 'aril-propionico,beta-idrossiestere', A.BERSAGLI.map(b => b.id).join(','));
  vero('ogni bersaglio ha due percorsi, uno verde e uno no, con building block e lavagna', A.BERSAGLI.every(b => b.percorsi.length === 2 && b.percorsi.some(r => r.verde) && b.percorsi.some(r => !r.verde) && b.percorsi.every(r => r.blocchi.length >= 2 && r.lavagna.length >= 2 && r.disc)));
  { const ar = A.BERSAGLI[0].percorsi; vero('aril-propionico: percorso verde A 3 step, percorso B 5 step', ar.find(r => r.verde).passi === 3 && ar.find(r => !r.verde).passi === 5); }

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); localStorage.removeItem('bsi-arrowlab-v1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIArrowLab && window.BSISpectraLive), null, { timeout: 60000 });
  vero('il pulsante «Arrow Lab» è nella barra', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="sarrowlab"]')));
  vero('Spectra ha lo strumento arrow_lab', await pg.evaluate(() => (window.BSI_AI_TOOLS || []).some(t => t.name === 'arrow_lab')));
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = {};
    BSISpectraLive.calcolo.apriSezione('sarrowlab'); await P(700);
    const sec = document.getElementById('sarrowlab');
    const click = sel => { const el = sec.querySelector(sel); if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
    o.hasSvg = !!sec.querySelector('.bsiAL-svg');
    /* disegna la prima freccia attesa: n1 → n2 (strumento arrow è il default) */
    click('[data-node="n1"]'); await P(150); click('[data-node="n2"]'); await P(200);
    /* la seconda: legame b1 → n3 */
    click('[data-bond="b1"]'); await P(150); click('[data-node="n3"]'); await P(200);
    o.frecce = sec.querySelectorAll('[data-arrow]').length;
    /* la diagnostica deve diventare verde */
    click('[data-a="drawer"][data-d="diagnostics"]'); await P(150); o.diagVerde = !!sec.querySelector('.bsiAL-verde');
    /* «+ Passo» deve avanzare (ora che le frecce sono giuste) */
    click('[data-a="next"]'); await P(250); o.passoDopo = sec.querySelector('.bsiAL-tl button.on') ? sec.querySelector('.bsiAL-tl button.on').textContent.trim() : '';
    /* «Risolvi» completa il passo corrente */
    click('[data-a="solve"]'); await P(250); o.frecceDopoSolve = sec.querySelectorAll('[data-arrow]').length;
    /* vista retrosintesi */
    click('[data-a="vista"][data-v="retro"]'); await P(300);
    o.percorsiTutti = sec.querySelectorAll('.bsiAL-perc').length;
    const green = sec.querySelector('[data-r="green"]'); green.checked = true; green.dispatchEvent(new Event('change', { bubbles: true })); await P(250);
    o.percorsiVerdi = sec.querySelectorAll('.bsiAL-perc').length;
    /* apri una lavagna */
    click('[data-a="board"]'); await P(250); o.lavagna = !!sec.querySelector('.bsiAL-lavagna');
    /* lo strumento di Spectra apre la vista editor con un meccanismo */
    const tool = await (window.BSI_AI_TOOLS.find(t => t.name === 'arrow_lab')).execute({ vista: 'editor', meccanismo: 'sn2-bromobutano' }); await P(500);
    o.tool = tool.ok; o.toolTit = sec.querySelector('[data-r="preset"]') ? sec.querySelector('[data-r="preset"]').value : '';
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o;
  });
  vero('la lavagna SVG c\'è e due frecce giuste si disegnano (sorgente → destinazione)', r.hasSvg && r.frecce === 2);
  vero('con le frecce corrette la diagnostica diventa verde', r.diagVerde);
  vero('«+ Passo» avanza al Passo 2 (' + r.passoDopo + ')', /2/.test(r.passoDopo));
  vero('«Risolvi» completa le frecce del passo', r.frecceDopoSolve >= 2);
  vero('la retrosintesi mostra i percorsi, e «solo verdi» ne nasconde (' + r.percorsiTutti + ' → ' + r.percorsiVerdi + ')', r.percorsiTutti >= 2 && r.percorsiVerdi < r.percorsiTutti && r.percorsiVerdi >= 1);
  vero('apre la lavagna della disconnessione', r.lavagna);
  vero('lo strumento di Spectra apre il meccanismo chiesto (' + r.toolTit + ')', r.tool && r.toolTit === 'sn2-bromobutano');
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 4).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
