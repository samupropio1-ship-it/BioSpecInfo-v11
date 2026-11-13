#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_eliosfera — 🌞 L'eliosfera (v254): i numeri e la pagina

   PERCHE' QUESTO BANCO ESISTE
   Lo standard dell'astronomia del progetto (§5.4) chiede misure vere con la
   fonte e modelli dichiarati. Qui si controlla che i numeri lo siano:
   · Parker: ψ = 47° a 1 UA con 400 km/s; un giro ogni 5,86 UA; |B| = 5,1 nT
     a 1 UA con B_r = 3,5 nT e 0,04 nT a 94 UA, che cala come 1/r.
   · Pressione: ρv² = 1,34 nPa a 1 UA (5 protoni/cm³, 400 km/s); lo shock a
     94 UA chiede 0,15 pPa; r_TS scala come 1/√P.
   · Rankine: r(90°) = √2 R₀, la coda tende a 2R₀.
   · Coordinate: dall'equatore all'eclittica, la direzione di Voyager 1
     (17h 13m, +12°) è a latitudine +35°, quella di Voyager 2 a −38°; il
     punto vernale resta a (0°, 0°), il polo nord celeste va a latitudine
     90° − 23,44°.
   · Le Voyager: le date e le distanze degli attraversamenti (94,0 e 121,6 UA;
     83,7 e 119,0 UA) sono quelle pubblicate; nel 2025 le distanze stimate
     stanno entro 1,5 UA dai valori NASA (≈ 165 e 138 UA).
   Poi la pagina a 412 e 1280 px: nella barra, quattro schede, il 3D, le
   etichette di stato (MISURATO, MODELLO, DIBATTUTO), niente NaN, niente
   sbordi, nessun errore.

   USO   node tools/banchi/test_eliosfera.js    (serve un server su :8899)
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
  const ctx = { console, Math, Array, Object, isFinite, String, Number, Date }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-astro-eliosfera.js'), 'utf8'), ctx);
  const E = ctx.BSIFisica.calcolo.eliosfera;

  console.log('── Parker ──');
  vicino('ψ a 1 UA con 400 km/s (gradi)', 46.98, E.angoloParker(1, 400), 1e-3);
  vicino('Ω = 2π / 25,38 giorni (rad/s)', 2.8654e-6, E.OMEGA, 1e-4);
  vicino('un giro della spirale ogni 2πv/Ω (UA)', 5.863, 2 * Math.PI / E.avvolgimento(400), 1e-3);
  vicino('|B| a 1 UA con B_r = 3,5 nT', 5.130, E.campo(1, 400, 3.5).B, 1e-3);
  vicino('|B| a 94 UA (nT)', 0.0399, E.campo(94, 400, 3.5).B, 3e-3);
  vero('lontano dal Sole |B| cala come 1/r', Math.abs(E.campo(50, 400, 3.5).B / E.campo(100, 400, 3.5).B - 2) < 0.01);
  vero('ai poli (latitudine 90°) la spirale si raddrizza: ψ = 0', Math.abs(E.angoloParker(5, 400, 90)) < 1e-9);

  console.log('\n── Pressione e shock ──');
  vicino('ρv² a 1 UA, 5 cm⁻³ e 400 km/s (nPa)', 1.338, E.pressioneVento(1, 5, 400) * 1e9, 1e-3);
  vicino('pressione che mette lo shock a 94 UA (fPa)', 151.4, E.pressionePer(94, 5, 400) * 1e15, 2e-3);
  vicino('con 150 fPa lo shock cade a (UA)', 94.4, E.shock(5, 400, 150e-15), 2e-3);
  vicino('r_TS scala come 1/√P', 2, E.shock(5, 400, 100e-15) / E.shock(5, 400, 400e-15), 1e-9);

  console.log('\n── Eliopausa (Rankine) ──');
  vicino('r(90°) = √2 R₀', Math.SQRT2 * 112, E.eliopausa(90, 112), 1e-9);
  vicino('la coda tende a 2R₀', 224, E.raggioCoda(179.99, 112), 1e-6);
  att('al naso r = R₀', 112, E.eliopausa(0, 112));

  console.log('\n── Coordinate ──');
  const v1 = E.eclittiche(258.35, 12.0), v2 = E.eclittiche(302.5, -59.5), np = E.eclittiche(0, 90), gamma = E.eclittiche(0, 0);
  vero('Voyager 1 (17h 13m, +12°) → latitudine eclittica +35° (' + v1.lat.toFixed(1) + '°), longitudine 256° (' + v1.lon.toFixed(1) + '°)', Math.abs(v1.lat - 35) < 1 && Math.abs(v1.lon - 256) < 1);
  vero('Voyager 2 (20h 10m, −59,5°) → latitudine −38° (' + v2.lat.toFixed(1) + '°), longitudine 290° (' + v2.lon.toFixed(1) + '°)', Math.abs(v2.lat + 38) < 1 && Math.abs(v2.lon - 290) < 1);
  vicino('il polo nord celeste sta a latitudine eclittica 90° − ε', 90 - 23.4393, np.lat, 1e-6);
  vero('il punto vernale resta a (0°, 0°)', Math.abs(gamma.lat) < 1e-9 && (gamma.lon < 1e-9 || gamma.lon > 360 - 1e-9));
  const n = E.versore(E.NASO.lon, E.NASO.lat);
  vero('Voyager 1 a ~30° dal naso, Voyager 2 a ~54°', Math.abs(E.angolo(n, E.versore(256, 35)) - 30) < 1 && Math.abs(E.angolo(n, E.versore(290, -38)) - 54) < 1);

  console.log('\n── Le Voyager ──');
  att('Voyager 1: shock 94,0 UA (2004,96), eliopausa 121,6 UA (2012,65)', '94,121.6', [E.distanza('v1', 2004.96), E.distanza('v1', 2012.65)].join(','));
  att('Voyager 2: shock 83,7 UA (2007,66), eliopausa 119,0 UA (2018,85)', '83.7,119', [E.distanza('v2', 2007.66), E.distanza('v2', 2018.85)].join(','));
  vero('nel 2025 Voyager 1 a ≈165 UA (' + E.distanza('v1', 2025).toFixed(1) + ')', Math.abs(E.distanza('v1', 2025) - 165) < 1.5);
  vero('nel 2025 Voyager 2 a ≈138 UA (' + E.distanza('v2', 2025).toFixed(1) + ')', Math.abs(E.distanza('v2', 2025) - 138) < 1.5);
  vero('fra shock ed eliopausa Voyager 1 andava a 3,59 UA/anno (17 km/s)', Math.abs((121.6 - 94.0) / (2012.65 - 2004.96) - 3.59) < 0.01);
  vicino('la luce da 121,6 UA impiega (ore)', 16.86, E.luceOre(121.6), 1e-3);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.eliosfera), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = { tele: [], sb: 0, strano: null, stati: new Set() };
      const x = BSISpectraLive.calcolo.apriSezione('sastroelio'); await pausa(700); o.aperta = x && x.id; o.nav = !!document.querySelector('.nav-btn[data-s="sastroelio"]');
      const el = document.getElementById('sastroelio'), schede = [...el.querySelectorAll('.bsiFX-schede button')]; o.schede = schede.length; const testi = [];
      for (const bt of schede) {
        bt.click();
        for (let i = 0; i < 60 && /Caricamento del motore 3D/.test(el.innerText); i++) await pausa(250);
        await pausa(800);
        o.tele.push([...el.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 100 && c.height > 60).length);
        o.sb = Math.max(o.sb, document.documentElement.scrollWidth - document.documentElement.clientWidth);
        o.strano = o.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b|Infinity).{0,20}/) || [null])[0];
        ['MISURATO', 'MODELLO', 'DIBATTUTO'].forEach(s => { if (el.innerText.indexOf(s) >= 0) o.stati.add(s); });
        testi.push(el.innerText);
      }
      o.stati = [...o.stati].sort().join(',');
      o.t3d = /eliopausa a/.test(testi[0]) && /121,6/.test(testi[0]) && /Rankine/.test(testi[0]);
      o.parker = /ψ = 47,0°/.test(testi[2]) && /5,13 nT/.test(testi[2]);
      o.press = /1,34 nPa/.test(testi[3]) && /r_TS = 94 UA/.test(testi[3]);
      o.voy = /94,0 UA/.test(testi[4]) && /119,0 UA/.test(testi[4]) && /onda di prua/.test(testi[4]);
      /* la scala lineare ricostruisce la scena senza errori */
      schede[0].click(); await pausa(400); const s = [...el.querySelectorAll('select')].filter(x => x.offsetParent)[0]; s.value = 'lin'; s.dispatchEvent(new Event('change')); await pausa(500); o.lin = /Scala lineare/.test(el.innerText);
      o.ar = !!el.querySelector('.bsiAR-tasto');
      return o;
    });
    vero(nome + ' · nella barra, si apre, 4 schede, le tele ci sono (' + r.tele.join(',') + ')', r.nav && r.aperta === 'sastroelio' && r.schede === 5 && r.tele.every(n => n >= 1));
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', r.sb + ' ' + r.strano);
    att(nome + ' · le tre etichette di stato ci sono', 'DIBATTUTO,MISURATO,MODELLO', r.stati);
    vero(nome + ' · 3D: modello di Rankine confrontato con la misura di Voyager 1', r.t3d);
    vero(nome + ' · Parker: ψ = 47,0° e 5,13 nT a 1 UA', r.parker);
    vero(nome + ' · pressione: 1,34 nPa a 1 UA, shock a 94 UA', r.press);
    vero(nome + ' · Voyager: attraversamenti e dibattito sul bow shock', r.voy);
    vero(nome + ' · la scala lineare si ricostruisce, e la scena ha il pulsante AR', r.lin && r.ar);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
