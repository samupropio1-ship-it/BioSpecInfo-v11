#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_3d238 — le schede 3D nuove di chimica, fisica e matematica

   PERCHE' QUESTO BANCO ESISTE

   Richiesta dell'utente: «animazioni in 3D dove serve in chimica, fisica e
   matematica». Nella v238 molte sezioni che erano solo 2D ricevono una scheda
   3D in coda alle loro, costruita sul modello vero della sezione (la superficie
   LEPS che la traiettoria percorre, le celle elementari con i piani di Miller,
   le linee di campo integrate, il cono di luce con la trasformazione di
   Lorentz, la sfera di Riemann con le Möbius che la ruotano, …).

   Per ogni sezione il banco:
   · esegue lo script di verifica dei calcoli della scheda 3D
     (verifiche/verifica-<id>-3d.js, o quello della sezione se la verifica e'
     stata aggiunta li'), che confronta i numeri mostrati con valori noti o un
     secondo metodo;
   · apre la sezione nel browser a 1280 e a 390 px, apre OGNI scheda e
     controlla che sia piena, senza avvisi, con le tele che disegnano e hanno
     un nome; che l'ultima scheda contenga davvero una scena 3D che disegna
     (Scena.campiona() > 0);
   · conta gli errori JavaScript.

   I tempi: qui WebGL gira in SwiftShader (senza GPU); il lavoro sincrono al
   clic di una scheda 3D deve restare sotto i 250 ms (la scena si costruisce
   dopo), come per tutte le altre schede.

   USO   node tools/banchi/test_3d238.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path'), fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const VERIFICHE = path.join(__dirname, 'verifiche');

/* [id della sezione, script di verifica dei calcoli 3D] */
const SEZ = [
  ['schipes', 'verifica-schipes-3d.js'], ['scristalli', 'verifica-scristalli-3d.js'], ['sschrod', 'verifica-sschrod-3d.js'],
  ['shf', 'verifica-shf-3d.js'], ['srotovib', 'verifica-srotovib-3d.js'], ['sdinmol', 'verifica-sdinmol-3d.js'], ['schifasi', 'verifica-schifasi-3d.js'],
  ['sfismecc', 'verifica-sfismecc-3d.js'], ['sfisem', 'verifica-sfisem-3d.js'], ['sfisonde', 'verifica-sfisonde-3d.js'], ['sfisgrav', 'verifica-sfisgrav-3d.js'],
  ['sfisrel', 'verifica-sfisrel-3d.js'], ['sfisfluidi', 'verifica-sfisfluidi-3d.js'], ['sfistermo', 'verifica-sfistermo-3d.js'],
  ['smatmulti', 'verifica-smatmulti-3d.js'], ['smatvett', 'verifica-smatvett-3d.js'], ['smatcalc', 'verifica-smatcalc-3d.js'], ['smatlin', 'verifica-smatlin-3d.js'],
  ['smatode', 'verifica-smatode-3d.js'], ['smatprob', 'verifica-smatprob-3d.js'], ['smattopo', 'verifica-smattopo.js'], ['smatnoneucl', 'verifica-smatnoneucl.js'],
  ['smatcompl', 'verifica-smatcompl-3d.js'], ['sfissolido', 'verifica-sfissolido-3d.js'], ['schicinet', 'verifica-schicinet-3d.js']
];
const SOLO = process.env.BSI_SOLO ? process.env.BSI_SOLO.split(',') : null;

let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const lista = SEZ.filter(s => !SOLO || SOLO.indexOf(s[0]) >= 0);
  console.log('── Le verifiche dei calcoli ──');
  for (const [id, script] of lista) {
    if (!script) continue;
    let out = '', codice = 0;
    try { out = execFileSync(process.execPath, [path.join(VERIFICHE, script)], { encoding: 'utf8', timeout: 600000 }); }
    catch (e) { out = (e.stdout || '') + (e.stderr || ''); codice = e.status || 1; }
    const m = out.match(/(\d+) superati, (\d+) falliti/);
    const sup = m ? +m[1] : 0, fal = m ? +m[2] : 1;
    ok += sup; ko += fal; if (codice && !fal) ko++;
    console.log('  ' + (codice || fal ? '✗' : '✓') + ' ' + id + ': ' + sup + ' controlli superati' + (fal ? ', ' + fal + ' falliti' : ''));
  }

  console.log('\n── Nel browser ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const pg = await (await b.newContext({ serviceWorkers: 'block', viewport: vp })).newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.goSection && window.BSIMaterie), null, { timeout: 60000 });
    await pg.waitForTimeout(3000);
    for (const [id] of lista) {
      const x = await pg.evaluate(async (id) => {
        const gg = document.getElementById('bsi-guide'); if (gg) gg.remove();
        const pausa = ms => new Promise(r => setTimeout(r, ms));
        const bt = document.querySelector('.nav-btn[data-s="' + id + '"]'); if (!bt) return { manca: true };
        const g = +bt.closest('[id^="navGroup"]').id.replace('navGroup', '');
        const M = BSIMaterie; for (const k in M.MATERIE) if (M.MATERIE[k].gruppi.indexOf(g) >= 0 && M.corrente() !== k) M.imposta(k);
        const tab = document.querySelector('.nav-group-tab[data-group="' + g + '"]'); if (tab) tab.click();
        bt.click(); await pausa(900);
        const sec = document.getElementById(id), sch = sec.querySelectorAll('.bsiFX-schede button');
        const scenaDi = el => { for (let e = el; e && e !== sec.parentNode; e = e.parentNode) if (e._scena) return e._scena; return null; };
        let piene = 0, tele = 0, disegnate = 0, avvisi = 0, etichette = true, lenta = 0, ultima3d = false, vuote = [];
        for (let i = 0; i < sch.length; i++) {
          const t0 = performance.now(); sch[i].click(); const dt = performance.now() - t0; await pausa(i === sch.length - 1 ? 4500 : 2200);
          lenta = Math.max(lenta, dt);
          const pan = [...sec.querySelectorAll('[role=tabpanel]')].find(p => p.offsetParent) || sec;
          if (pan.textContent.length > 100) piene++; if (/⚠/.test(pan.textContent)) avvisi++;
          for (const c of pan.querySelectorAll('canvas')) {
            if (!c.offsetParent || c.width < 8 || c.height < 8) continue; tele++;
            const nomeT = c.getAttribute('aria-label') || (c.parentNode && c.parentNode.getAttribute && c.parentNode.getAttribute('aria-label')) || '';
            if (nomeT.length < 3 && c.getAttribute('aria-hidden') !== 'true') etichette = false;
            let pieno = false; const q = c.getContext('2d');
            if (q) { const d = q.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 0; k < d.length; k += 4 * 31) if (d[k] + d[k + 1] + d[k + 2] > 120) n++; pieno = n > 5; }
            else { const S = scenaDi(c); pieno = !!(S && S.campiona && S.campiona() > 0); if (i === sch.length - 1 && pieno) ultima3d = true; }
            if (pieno) disegnate++; else vuote.push(i);
          }
        }
        return { schede: sch.length, piene, tele, disegnate, avvisi, etichette, lenta: Math.round(lenta), ultima3d, vuote, nomeUltima: sch.length ? sch[sch.length - 1].textContent.trim() : '' };
      }, id);
      const buona = x && !x.manca && x.piene === x.schede && x.avvisi === 0 && x.disegnate === x.tele && x.etichette;
      vero(nome + ' · ' + id + ': ' + (x.schede || 0) + ' schede piene, tele disegnate e con un nome', buona);
      if (!buona) console.log('      ! ' + JSON.stringify(x));
      vero(nome + ' · ' + id + ': l\'ultima scheda («' + (x.nomeUltima || '') + '») è una scena 3D che disegna', x.ultima3d);
      vero(nome + ' · ' + id + ': ogni scheda si apre entro 250 ms (' + x.lenta + ' ms)', x.lenta < 250);
    }
    if (vp.width < 400) att('a 390 px niente sborda', 0, await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 200)));
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
