#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_meccanismi3d — 🧪 Meccanismi 3D (v262)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto le animazioni di chimica «al massimo possibile». Un
   film di un meccanismo è credibile solo se la chimica non si rompe mentre
   scorre. Qui si pretende, per ognuno degli otto meccanismi:
   · la CARICA TOTALE resta la stessa in ogni istante (nessuna carica nasce
     dal nulla);
   · agli estremi della reazione i legami pieni hanno lunghezze tipiche
     (C–H 1,0–1,15 Å, C=C 1,30–1,36, C–C 1,45–1,56…);
   · due atomi NON legati non si compenetrano mai (> 1,15 Å);
   · ogni freccia parte e arriva su atomi o legami che esistono;
   · il profilo energetico ha gli stati di transizione nei massimi e i
     reagenti a zero; la Diels–Alder e la clorurazione usano i numeri veri
     (Ea 115, ΔH −166; 243, +7, −109 kJ/mol).
   Poi la pagina, sul telefono: ogni meccanismo disegna, il profilo segue il
   punto, i passi si leggono, nessun errore.

   USO   node tools/banchi/test_meccanismi3d.js   (serve un server su :8899)
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
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, tt: a => a[0], sezione() {}, el() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-chim-meccanismi3d.js'), 'utf8'), ctx);
  const K = ctx.BSIMeccanismi3D, TIP = { 'C-H': [1.0, 1.15], 'C-C': [1.30, 1.56], 'C-O': [1.2, 1.48], 'Br-C': [1.9, 2.0], 'C-N': [1.4, 1.52], 'N-O': [1.15, 1.3], 'H-O': [0.9, 1.0], 'C-Cl': [1.7, 1.85], 'Cl-Cl': [1.95, 2.05], 'Cl-H': [1.2, 1.35], 'Br-H': [1.35, 1.45], 'C-Me': [1.45, 1.56], 'Me-O': [1.38, 1.48] };
  console.log('── La chimica di ogni meccanismo ──');
  att('otto meccanismi', 'sn2,sn1,e2,markovnikov,dielsalder,nitrazione,acilica,radicalica', K.M.map(m => m.id).join(','));
  K.M.forEach(m => {
    const q0 = K.caricaTotale(m, 0); let dq = 0; for (let x = 0; x <= m.N; x += 0.01) dq = Math.max(dq, Math.abs(K.caricaTotale(m, x) - q0));
    const lung = []; [0, m.N].forEach(x => { const G = m.geom(x); m.legami.forEach(l => { const o = G.ord[l[0] + '-' + l[1]]; if (o == null) lung.push('manca l\'ordine di ' + l.join('-')); else if (o >= 0.95) { const k = [m.atomi[l[0]], m.atomi[l[1]]].sort().join('-'), r = TIP[k], d = K.distanza(m, x, l[0], l[1]); if (!r) lung.push('tipo ' + k); else if (d < r[0] - 0.02 || d > r[1] + 0.02) lung.push(l.join('-') + ' ' + d.toFixed(2) + ' a x=' + x); } }); });
    const legati = new Set(m.legami.map(l => l.slice().sort().join('|'))); let vicini = 9, coppia = '';
    for (let x = 0; x <= m.N + 1e-9; x += 0.02) { const G = m.geom(x), ids = Object.keys(G.pos); for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { if (legati.has([ids[i], ids[j]].sort().join('|'))) continue; if (m.atomi[ids[i]] === 'H' && m.atomi[ids[j]] === 'H') continue; const d = Math.hypot(...[0, 1, 2].map(k => G.pos[ids[i]][k] - G.pos[ids[j]][k])); if (d < vicini) { vicini = d; coppia = ids[i] + '–' + ids[j]; } } }
    const fr = m.frecce.every(f => [f.da, f.a].every(r => (Array.isArray(r) ? r : [r]).every(a => m.atomi[a])));
    const E = m.energia, ts = E.filter((p, i) => i > 0 && i < E.length - 1 && p[1] > E[i - 1][1] && p[1] > E[i + 1][1]);
    vero(m.id + ': carica totale costante (' + q0 + ', scarto ' + dq.toExponential(0) + '), legami tipici agli estremi, atomi non legati a ' + vicini.toFixed(2) + ' Å (' + coppia + '), frecce su atomi veri, ' + ts.length + ' stato/i di transizione, reagenti a 0', dq < 1e-9 && !lung.length && vicini > 1.15 && fr && ts.length >= 1 && E[0][1] === 0 && ts.every(p => /ET/.test(p[2])));
    if (lung.length) console.log('      ! ' + lung.slice(0, 4).join(' | '));
  });
  { const da = K.M.find(m => m.id === 'dielsalder'), ra = K.M.find(m => m.id === 'radicalica'); att('Diels–Alder: Ea e ΔH misurati (kJ/mol)', '115 -166', Math.max(...da.energia.map(p => p[1])) + ' ' + da.energia[da.energia.length - 1][1]);
    const e = ra.energia; att('clorurazione: Cl–Cl 243, propagazione 1 +7, propagazione 2 −109 (kJ/mol)', '243 7 -109', e[1][1] + ' ' + (e[3][1] - e[1][1]) + ' ' + (e[5][1] - e[3][1])); }
  { const s = K.M.find(m => m.id === 'sn2'); const G0 = s.geom(0), G2 = s.geom(2), ang = (G, h) => { const a = G.pos[h], b = G.pos.Br, c = [0, 0, 0]; const u = a.map((v, i) => v - c[i]), w = b.map((v, i) => v - c[i]); return Math.acos(u.reduce((p, v, i) => p + v * w[i], 0) / Math.hypot(...u) / Math.hypot(...w)) * 180 / Math.PI; };
    vero('SN2: inversione di Walden (angolo H–C–Br da ' + ang(G0, 'H1').toFixed(1) + '° a ' + ang(G2, 'H1').toFixed(1) + '°)', Math.abs(ang(G0, 'H1') - 109.5) < 0.5 && Math.abs(ang(G2, 'H1') - 70.5) < 0.5); }
  { const s = K.M.find(m => m.id === 'e2'), G = s.geom(0), d = (a, b) => [0, 1, 2].map(k => G.pos[b][k] - G.pos[a][k]); const u = d('Cb', 'Hx'), w = d('Ca', 'Br'); const diedro = Math.acos(u.reduce((p, v, i) => p + v * w[i], 0) / Math.hypot(...u) / Math.hypot(...w)) * 180 / Math.PI;
    vero('E2: H e Br antiperiplanari (angolo fra i legami ' + diedro.toFixed(0) + '°, > 150°)', diedro > 150); }

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIMeccanismi3D && window.BSISpectraLive && window.BSILab3D), null, { timeout: 60000 });
  vero('il pulsante «Meccanismi 3D» è nella barra della chimica', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="smecc3d"]')));
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = { m: [] };
    BSISpectraLive.calcolo.apriSezione('smecc3d'); await P(900);
    const d = document.querySelector('#smecc3d .bsiM3-scelte').parentNode; o.scelte = document.querySelectorAll('#smecc3d .bsiM3-scelte button').length;
    for (const m of BSIMeccanismi3D.M) {
      const a = d._apri(m.id); for (let i = 0; i < 80; i++) { if (a.pronto) break; await P(200); } a.gioca(false); a.S.box.scrollIntoView({ block: 'center' }); await P(150);
      const xs = m.energia.find(p => /ET/.test(p[2]))[0]; a.vai(xs); await P(500);
      const px = (() => { a.S.disegna(); const c = document.createElement('canvas'); c.width = 90; c.height = 120; const q = c.getContext('2d'); q.drawImage(a.S.ren.domElement, 0, 0, 90, 120); const dd = q.getImageData(0, 0, 90, 120).data; let n = 0; for (let i = 0; i < dd.length; i += 4) if (dd[i] + dd[i + 1] + dd[i + 2] > 150) n++; return n; })();
      const pr = a.S.box.querySelector('.bsiM3-vivo'), prof = (() => { const q = pr.getContext('2d'), dd = q.getImageData(0, 0, pr.width, pr.height).data; let n = 0; for (let i = 0; i < dd.length; i += 16) if (dd[i + 3] > 200 && dd[i] + dd[i + 1] + dd[i + 2] > 300) n++; return n; })();
      const passo = document.querySelector('#smecc3d .bsiM3-passo').textContent;
      a.vai(m.N); await P(400);
      o.m.push({ id: m.id, px, prof, passo: passo.length, fine: a.ultimo && Math.abs(a.ultimo.x - m.N) < 1e-6, Efine: a.ultimo && Math.round(a.ultimo.energia) });
    }
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o;
  });
  att('otto meccanismi da scegliere', 8, r.scelte);
  r.m.forEach(s => vero(s.id + ': disegna allo stato di transizione (' + s.px + ' px), profilo vivo (' + s.prof + '), spiegazione del passo, arriva ai prodotti (E = ' + s.Efine + ' kJ/mol)', s.px > 120 && s.prof > 30 && s.passo > 60 && s.fine));
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
