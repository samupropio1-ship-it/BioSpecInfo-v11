#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_cinema — 🌌 Onde di fase e correnti, 🌌 Dal Sole alla Galassia (v255)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto animazioni «come nei video» di divulgazione: orbitali
   con correnti e onde di fase, e il viaggio dal Sole alle bolle della
   Galassia. Animazioni belle e sbagliate sarebbero il fallimento peggiore:
   qui si controlla la fisica che le muove.
   · Orbitali: la corrente di probabilità calcolata con le differenze finite
     di ψ coincide con la formula ħm|ψ|²/(mₑ ρ) φ̂ (scarto relativo < 10⁻⁶),
     non ha componenti radiali né polari, cambia verso con m; il contorno del
     90 % esiste; il piano della densità massima del 2p, m = 1 è l'equatore.
   · Galassia: il piano galattico inclinato di 60,2° sull'eclittica; il centro
     galattico a longitudine eclittica 266,8° e latitudine −5,5°, a 8,18 kpc;
     Alfa Centauri a latitudine eclittica −42,6°. Flusso di Rankine: velocità
     nulla al naso dell'eliopausa (punto di ristagno), lontano uguale al vento
     interstellare.
   Poi le due schede nella pagina: formule in sovrimpressione, le scie, il
   cursore della scala che porta alle bolle, «riduci movimento», niente
   errori, niente sbordi.

   USO   node tools/banchi/test_cinema.js    (serve un server su :8899)
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
  const ctx = { console, Math, Array, Object, isFinite, String, Number, Float32Array, Date, Infinity }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  ['bsi-orbitali.js', 'bsi-orbitali-cinema.js', 'bsi-astro-eliosfera.js', 'bsi-astro-viaggio.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx));
  const C = ctx.BSIFisica.calcolo.orbitaliCinema, V = ctx.BSIFisica.calcolo.viaggio, E = ctx.BSIFisica.calcolo.eliosfera;

  console.log('── La corrente di probabilità ──');
  let peggio = 0, trasv = 0;
  [{ n: 4, l: 3, m: 3 }, { n: 3, l: 2, m: 1 }, { n: 3, l: 2, m: -2 }, { n: 2, l: 1, m: 1 }, { n: 5, l: 4, m: 4 }].forEach(o => [[1.3, 2.1, 0.7], [-2.5, 0.8, -1.9], [3.4, -3.1, 2.2]].forEach(p => {
    const J = C.corrente(o, p[0] * o.n / 2, p[1] * o.n / 2, p[2] * o.n / 2), mod = Math.hypot(...J.formula);
    peggio = Math.max(peggio, Math.hypot(J.numerica[0] - J.formula[0], J.numerica[1] - J.formula[1], J.numerica[2] - J.formula[2]) / mod);
    const x = p[0] * o.n / 2, y = p[1] * o.n / 2, z = p[2] * o.n / 2, r = Math.hypot(x, y, z); trasv = Math.max(trasv, Math.abs((J.numerica[0] * x + J.numerica[1] * y + J.numerica[2] * z) / r) / mod, Math.abs(J.numerica[2]) / mod);
  }));
  vero('J numerica = ħm|ψ|²/(mₑρ) φ̂ in 15 punti di 5 orbitali (scarto relativo ' + peggio.toExponential(1) + ')', peggio < 1e-6);
  vero('nessuna componente radiale né lungo z (' + trasv.toExponential(1) + ')', trasv < 1e-6);
  const Jp = C.corrente({ n: 3, l: 2, m: 2 }, 2, 1, 1).formula, Jm = C.corrente({ n: 3, l: 2, m: -2 }, 2, 1, 1).formula;
  vero('m → −m inverte la corrente', Math.abs(Jp[0] + Jm[0]) < 1e-15 && Math.abs(Jp[1] + Jm[1]) < 1e-15);
  att('m = 0: corrente nulla', 0, Math.hypot(...C.corrente({ n: 3, l: 2, m: 0 }, 2, 1, 1).numerica) < 1e-12 ? 0 : 1);
  vero('il contorno del 90 % del 4f, m = 3 esiste (' + C.contorno({ n: 4, l: 3, m: 3 }, 40, 100, 200, 1e-6).length + ' segmenti)', C.contorno({ n: 4, l: 3, m: 3 }, 40, 100, 200, 1e-6).length > 50);
  const pm = C.pianoMassimo({ n: 2, l: 1, m: 1 });
  vero('2p, m = 1: densità massima all\'equatore, a 4 a₀', Math.abs(pm.theta - Math.PI / 2) < 0.01 && Math.abs(pm.r - 4) < 0.01);
  const pm3 = C.pianoMassimo({ n: 3, l: 2, m: 1 });
  vicino('3d, m = 1: densità massima a θ = 45°', 45, pm3.theta * 180 / Math.PI, 2e-3);

  console.log('\n── La Galassia e il flusso ──');
  vicino('inclinazione del piano galattico sull\'eclittica (gradi)', 60.19, V.inclinazione(), 1e-3);
  const g = V.GC, gn = Math.hypot(...g);
  vicino('distanza del centro galattico (kpc)', 8.178, gn / V.KPC, 1e-6);
  vicino('centro galattico: longitudine eclittica (gradi)', 266.84, (Math.atan2(g[1], g[0]) * 180 / Math.PI + 360) % 360, 1e-4);
  vicino('centro galattico: latitudine eclittica (gradi)', -5.536, Math.asin(g[2] / gn) * 180 / Math.PI, 1e-3);
  const ac = V.radec(219.9, -60.83); vicino('Alfa Centauri: latitudine eclittica (gradi)', -42.59, Math.asin(ac[2]) * 180 / Math.PI, 1e-3);
  const n = E.versore(E.NASO.lon, E.NASO.lat), v0 = V.campoFlusso(n.map(x => x * 112), n, 112, 26), vl = V.campoFlusso([1e6, 3e5, -2e5], n, 112, 26);
  vero('punto di ristagno sul naso dell\'eliopausa: |v| = 0', Math.hypot(...v0) < 1e-9);
  vicino('lontano, la velocità è quella del gas interstellare (km/s)', 26, Math.hypot(...vl), 1e-3);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono, riduci movimento', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.orbitaliCinema && BSIFisica.calcolo.viaggio), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      BSISpectraLive.calcolo.apriSezione('sorbitali'); await pausa(600);
      let el = document.getElementById('sorbitali'), bt = [...el.querySelectorAll('.bsiFX-schede button')].find(b => /Onde di fase/.test(b.textContent)); o.tabOrb = !!bt; bt && bt.click();
      for (let i = 0; i < 60 && !el.querySelector('.bsiOC-formule'); i++) await pausa(250); await pausa(1200);
      const f = el.querySelector('.bsiOC-formule'); o.formule = !!f && /J/.test(f.textContent) && /2πmħ/.test(f.textContent) && /3λ/.test(f.textContent);
      const S = BSILab3D.scene().filter(s => s.box.offsetParent && s.box.closest('#sorbitali'))[0]; o.ar = !!(S && S.box.querySelector('.bsiAR-tasto'));
      const scie = S && S.radice.children[0] && S.radice.children[0].children.find(c => c.name === 'scie');
      const prima = scie ? Array.from(scie.geometry.attributes.position.array.slice(0, 6)).join() : ''; await pausa(600); o.scieMuovono = scie ? Array.from(scie.geometry.attributes.position.array.slice(0, 6)).join() !== prima : null;
      o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; o.strano = (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b).{0,20}/) || [null])[0];
      BSISpectraLive.calcolo.apriSezione('sastroelio'); await pausa(600);
      el = document.getElementById('sastroelio'); bt = [...el.querySelectorAll('.bsiFX-schede button')].find(b => /Dal Sole alla Galassia/.test(b.textContent)); o.tabGal = !!bt; bt && bt.click();
      for (let i = 0; i < 60 && !el.querySelector('.bsiVG-cap'); i++) await pausa(250); await pausa(800);
      const cap = el.querySelector('.bsiVG-cap'), rg = [...el.querySelectorAll('input[type=range]')].filter(x => x.offsetParent)[0];
      o.capPianeti = cap && /UA/.test(cap.textContent);
      rg.value = 9.6; rg.dispatchEvent(new Event('input')); await pausa(500); o.capBolle = /Fermi/.test(cap.textContent) && /eROSITA/.test(cap.textContent) && /kpc/.test(cap.textContent);
      const S2 = BSILab3D.scene().filter(s => s.box.offsetParent && s.box.closest('#sastroelio'))[0], R = S2.radice.children[0];
      o.visibili = R.children.filter(c => c.visible && c.userData.taglia >= 4e9).length; o.nascosti = R.children.filter(c => !c.visible && c.userData.taglia && c.userData.taglia < 1000).length;
      o.sb = Math.max(o.sb, document.documentElement.scrollWidth - document.documentElement.clientWidth); o.strano = o.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b).{0,20}/) || [null])[0];
      return o;
    });
    vero(nome + ' · orbitali: la scheda «Onde di fase e correnti» con le formule in sovrimpressione e il pulsante AR', r.tabOrb && r.formule && r.ar);
    att(nome + ' · ' + (opz.reducedMotion ? 'con «riduci movimento» le scie restano ferme' : 'le scie si muovono'), opz.reducedMotion ? false : true, r.scieMuovono);
    vero(nome + ' · Galassia: la scheda, la didascalia in UA, a 4×10⁹ UA le bolle di Fermi ed eROSITA', r.tabGal && r.capPianeti && r.capBolle);
    vero(nome + ' · alla scala galattica si vedono Galassia e bolle (' + r.visibili + '), i pianeti sono spenti (' + r.nascosti + ')', r.visibili >= 6 && r.nascosti >= 5);
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', r.sb + ' ' + r.strano);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
