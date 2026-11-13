#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_motore — 🔧 Il motore in spaccato (v254): la termodinamica e il disegno

   PERCHE' QUESTO BANCO ESISTE
   È l'esempio dello standard della fisica del progetto (§5.2): spaccato,
   flussi, bilancio, dettaglio. Il bilancio deve tornare e i numeri devono
   essere quelli del ciclo Otto ad aria standard:
   · η = 1 − ρ^(1−γ) = 60,2 % con ρ = 10; il lavoro dal bilancio Q_in − Q_out
     coincide con l'integrale di p dV calcolato a parte;
   · fine compressione T₂ = T₁ ρ^(γ−1) = 754 K e p₂ = p₁ ρ^γ = 25,1 bar;
   · il manovellismo: punto morto inferiore a θ = 0, superiore a θ = π,
     corsa 2r, volume massimo V_c + V_d;
   · lungo la compressione p V^γ è costante;
   · potenza = L · giri / 120.
   Poi la pagina: la scheda c'è dentro «Termodinamica in movimento», il
   bilancio è scritto, con «riduci movimento» il disegno resta fermo, senza
   si muove; niente sbordi, nessun errore.

   USO   node tools/banchi/test_motore.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }
function vicino(d, atteso, avuto, tol) { const e = Math.abs(avuto - atteso) / Math.max(1e-300, Math.abs(atteso)); if (e <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+avuto.toPrecision(6)) + ' (atteso ' + atteso + ')'); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + (tol * 100) + ' %\n      avuto:  ' + avuto); } }

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-fis-motore.js'), 'utf8'), ctx);
  const K = ctx.BSIFisica.calcolo.motore, p = { Vd: 0.5e-3, alesaggio: 0.084, rho: 10, T1: 300, p1: 1e5, T3: 2400, gamma: 1.4, giri: 3000 }, M = K.motore(p);

  console.log('── Il ciclo ──');
  vicino('η = 1 − ρ^(1−γ) con ρ = 10', 0.601893, M.eta, 1e-6);
  vicino('lavoro: bilancio Q_in − Q_out = ∮p dV', M.Lint, M.L, 1e-9);
  vicino('fine compressione T₂ (K)', 753.57, M.T2, 1e-4);
  vicino('fine compressione p₂ (bar)', 25.119, M.p2 / 1e5, 1e-4);
  vicino('moli nel cilindro n = p₁V₁/(RT₁)', 0.0222727, M.n, 1e-4);
  vicino('potenza = L · giri / 120 (W)', M.L * 25, M.potenza, 1e-12);
  vero('rendimento sotto Carnot fra T₁ e T₃', M.eta < M.carnot);

  console.log('\n── Il manovellismo ──');
  const S0 = K.statoAngolo(0, p, M), Spi = K.statoAngolo(Math.PI, p, M);
  vicino('punto morto inferiore a θ = 0: V = V_c + V_d', M.V1, S0.V, 1e-9);
  vicino('punto morto superiore a θ = π: V = V_c', M.V2, Spi.V, 1e-9);
  vicino('corsa = 2r', 2 * S0.rM, K.corsa(0, S0.rM, S0.l) - K.corsa(Math.PI, S0.rM, S0.l), 1e-12);
  let pv = []; for (let th = 0.1; th < Math.PI; th += 0.3) { const s = K.statoAngolo(th, p, M); pv.push(s.p * Math.pow(s.V, 1.4)); }
  vero('in compressione p V^γ è costante', Math.max(...pv) / Math.min(...pv) - 1 < 1e-9);
  vero('in espansione la temperatura scende da T₃ a T₄', Math.abs(K.statoAngolo(Math.PI + 1e-9, p, M).T - M.T3) / M.T3 < 1e-6 && Math.abs(K.statoAngolo(2 * Math.PI - 1e-9, p, M).T - M.T4) / M.T4 < 1e-6);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono, riduci movimento', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.motore), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      BSISpectraLive.calcolo.apriSezione('sfistermo'); await pausa(600);
      const el = document.getElementById('sfistermo'), sch = [...el.querySelectorAll('.bsiFX-schede button')], bt = sch.find(b => /motore/i.test(b.textContent)); o.scheda = !!bt;
      if (!bt) return o;
      bt.click(); await pausa(800);
      const c = [...el.querySelectorAll('canvas')].find(x => x.offsetParent && /Spaccato del motore/.test(x.getAttribute('aria-label') || ''));
      o.tela = !!c; const a = c.toDataURL(); await pausa(700); o.muove = c.toDataURL() !== a;
      o.bilancio = /762 J = 459 J \+ 303 J/.test(el.innerText) && /η = 60,2 %/.test(el.innerText);
      o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; o.strano = (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b).{0,20}/) || [null])[0];
      return o;
    });
    vero(nome + ' · la scheda «Il motore in spaccato» c\'è e disegna', r.scheda && r.tela);
    vero(nome + ' · il bilancio è scritto: 762 J = 459 J + 303 J, η = 60,2 %', r.bilancio);
    att(nome + ' · ' + (opz.reducedMotion ? 'con «riduci movimento» il disegno resta fermo' : 'senza, il motore gira'), opz.reducedMotion ? false : true, r.muove);
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', r.sb + ' ' + r.strano);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
