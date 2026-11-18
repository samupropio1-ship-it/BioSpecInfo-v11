#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_spaccati — gli spaccati tecnici di fisica (v257, §5.2 del progetto)

   PERCHE' QUESTO BANCO ESISTE
   Lo standard della fisica chiede lo spaccato con le parti etichettate, i
   flussi proporzionali, i campi calcolati, il bilancio che regge la figura e
   la vista di dettaglio. Un bilancio che non torna o un campo disegnato a
   mano tradiscono lo standard. Qui si pretende: Kirchhoff esatto ai nodi e
   sulle maglie e potenza erogata = dissipata per mille circuiti casuali; il
   bilancio di potenza del laser che chiude al watt per ogni pompa, la soglia
   e l'inversione bloccata sopra soglia; il campo della giunzione integrato da
   Poisson uguale alla formula chiusa, la neutralità N_A x_p = N_D x_n, il
   salto di potenziale = V_bi − V. Poi le tre schede nella pagina vera, sul
   telefono con «riduci movimento» e su schermo grande.

   USO   node tools/banchi/test_spaccati.js    (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-fis-spaccati.js'), 'utf8'), ctx);
  const S = ctx.BSIFisica.calcolo.spaccati;

  console.log('── Il circuito a due maglie ──');
  let c = S.circuito({ E1: 12, E2: 6, R1: 2, R2: 4, R3: 10 });
  att('caso del manuale: I₁, I₂, I₃ (A)', '1.5882 -0.7059 0.8824', [c.I1, c.I2, c.I3].map(x => x.toFixed(4)).join(' '));
  vero('E₂ assorbe potenza (si ricarica) quando I₂ < 0', c.P2 < 0);
  let peggio = 0, seme = 1; const rnd = () => (seme = (seme * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 1000; k++) { const p = { E1: rnd() * 24, E2: rnd() * 24, R1: 1 + rnd() * 46, R2: 1 + rnd() * 46, R3: 1 + rnd() * 99 }, x = S.circuito(p); peggio = Math.max(peggio, Math.abs(x.nodo), Math.abs(x.maglia1), Math.abs(x.maglia2), Math.abs(x.Pgen - x.Pdis)); }
  vero('1000 circuiti casuali: nodo, due maglie e potenza chiudono (scarto massimo ' + peggio.toExponential(1) + ')', peggio < 1e-9);
  att('deriva in 1 mm² di rame con 1 A: 0,0735 mm/s', '0.0735', (S.deriva(1, 1e-6) * 1000).toFixed(4));
  att('codice colori: 10 Ω marrone-nero-nero, 47 Ω giallo-viola-nero, 100 Ω marrone-nero-marrone', '1,0,0 4,7,0 1,0,1', [10, 47, 100].map(r => S.fasce(r).join(',')).join(' '));

  console.log('\n── Il laser Nd:YAG ──');
  let l = S.laser({ Pp: 10, T: 0.05, Li: 0.02 });
  att('soglia P_th = (T + L_i)/κ = 2,80 W', '2.80', l.Pth.toFixed(2));
  att('difetto quantico 808/1064', '0.7594', l.etaQ.toFixed(4));
  att('a 10 W di pompa: P_out 3,51 W, efficienza differenziale 48,8 %', '3.51 48.8', l.Pout.toFixed(2) + ' ' + (l.pendenza * 100).toFixed(1));
  let chiude = 0; [0, 1, 2.8, 5, 12, 20].forEach(Pp => [0.01, 0.05, 0.2].forEach(T => { const x = S.laser({ Pp, T, Li: 0.02 }); chiude = Math.max(chiude, Math.abs(x.somma - Pp)); }));
  vero('bilancio P_p = P_out + perdite + calore + non assorbita per 18 casi (scarto ' + chiude.toExponential(1) + ' W)', chiude < 1e-12);
  att('sotto soglia: niente fascio', 0, S.laser({ Pp: 2, T: 0.05, Li: 0.02 }).Pout);
  att('inversione: cresce sotto soglia, poi resta ferma (gain clamping)', '0.714 1 1', [2, 2.8, 15].map(Pp => +S.laser({ Pp, T: 0.05, Li: 0.02 }).inversione.toFixed(3)).join(' '));
  vero('la potenza d\'uscita cresce linearmente sopra soglia', (() => { const a = S.laser({ Pp: 6, T: 0.05, Li: 0.02 }).Pout, b2 = S.laser({ Pp: 10, T: 0.05, Li: 0.02 }).Pout, d = S.laser({ Pp: 14, T: 0.05, Li: 0.02 }).Pout; return Math.abs((b2 - a) - (d - b2)) < 1e-12; })());

  console.log('\n── La giunzione p–n ──');
  const cm = x => Math.pow(10, x) * 1e6;
  let g = S.giunzione(cm(16), cm(16), 0, 1e-6);
  att('N_A = N_D = 10¹⁶ cm⁻³: V_bi = 0,714 V (n_i = 10¹⁰)', '0.714', g.Vbi.toFixed(3));
  att('e W = 0,430 µm (Sze: ≈ 0,43 µm)', '0.430', (g.W * 1e6).toFixed(3));
  let maxE = 0, maxV = 0, maxN = 0;
  [[14, 18], [16, 16.5], [17, 15], [18, 14], [15.5, 17.2]].forEach(([a, d]) => [-5, -1, 0, 0.3, 0.6].forEach(V => {
    const G = S.giunzione(cm(a), cm(d), V, 1e-6), P = S.campoPoisson(G, cm(a), cm(d), 400);
    maxE = Math.max(maxE, Math.abs(P.Emax / G.Emax - 1)); maxV = Math.max(maxV, Math.abs(P.dV - (G.Vbi - G.V)) / (G.Vbi - G.V)); maxN = Math.max(maxN, Math.abs(cm(a) * G.xp / (cm(d) * G.xn) - 1));
    maxE = Math.max(maxE, Math.abs(P.E[P.E.length - 1]) / P.Emax);
  }));
  vero('25 giunzioni: il campo integrato da Poisson = la formula chiusa e si annulla ai bordi (scarto ' + maxE.toExponential(1) + ')', maxE < 1e-9);
  vero('il salto di potenziale integrato = V_bi − V (scarto relativo ' + maxV.toExponential(1) + ')', maxV < 1e-9);
  vero('neutralità N_A x_p = N_D x_n (scarto ' + maxN.toExponential(1) + ')', maxN < 1e-12);
  g = S.giunzione(cm(16), cm(16), -5, 1e-6); const g0 = S.giunzione(cm(16), cm(16), 0, 1e-6);
  vero('in inversa la zona si allarga come √(V_bi − V)', Math.abs(g.W / g0.W - Math.sqrt((g.Vbi + 5) / g0.Vbi)) < 1e-12);
  vero('corrente di Shockley: inversa ≈ −I₀, diretta cresce di e per ogni 25,85 mV', Math.abs(g.I / g.I0 + 1) < 1e-6 && Math.abs(S.giunzione(cm(16), cm(16), 0.5258520, 1e-6).I / S.giunzione(cm(16), cm(16), 0.5, 1e-6).I - Math.E) < 1e-3);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const CASI = [['sfiscirc', /circuito in spaccato/i, /Spaccato del circuito/, /1,588 \+ −0,706 = 0,882 A/], ['sfislaser', /laser in spaccato/i, /Spaccato di un laser/, /10,00 W = 3,51 \+ 1,41 \+ 4,08 \+ 1,00 W/], ['sfissolido', /giunzione in spaccato/i, /Spaccato di un diodo/, /V_bi = \(kT\/q\) ln\(N_A N_D\/n_i²\) = 0,744 V/]];
  for (const [nome, opz] of [['telefono, riduci movimento', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.spaccati), null, { timeout: 60000 });
    for (const [sez, reTab, reAria, reBil] of CASI) {
      const r = await pg.evaluate(async ([sez, sTab, sAria, sBil]) => {
        const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {}, reTab = new RegExp(sTab, 'i'), reAria = new RegExp(sAria), reBil = new RegExp(sBil);
        BSISpectraLive.calcolo.apriSezione(sez); await pausa(600);
        const el = document.getElementById(sez), sch = [...el.querySelectorAll('.bsiFX-schede button')], bt = sch.find(x => reTab.test(x.textContent)); o.scheda = !!bt; o.ultima3D = /3D/.test((sch[sch.length - 1] || {}).textContent || '') || sez !== 'sfissolido';
        if (!bt) return o;
        bt.click(); await pausa(900);
        const c = [...el.querySelectorAll('canvas')].find(x => x.offsetParent && reAria.test(x.getAttribute('aria-label') || ''));
        o.tela = !!c && c.width > 200; if (c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] + d[i + 1] + d[i + 2] > 200) n++; o.acceso = n; const a = c.toDataURL(); await pausa(700); o.muove = c.toDataURL() !== a; }
        o.bilancio = reBil.test(el.innerText); o.testo = (el.innerText.match(reBil) || [''])[0];
        o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; o.strano = (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b|Infinity).{0,20}/) || [null])[0];
        return o;
      }, [sez, reTab.source, reAria.source, reBil.source]);
      vero(nome + ' · ' + sez + ': la scheda in spaccato c\'è e disegna (' + (r.acceso || 0) + ' campioni accesi)', r.scheda && r.tela && r.acceso > 100);
      vero(nome + ' · ' + sez + ': il bilancio è scritto «' + (r.testo || '') + '»', r.bilancio);
      att(nome + ' · ' + sez + ': ' + (opz.reducedMotion ? 'con «riduci movimento» resta fermo' : 'senza, si anima'), opz.reducedMotion ? false : true, r.muove);
      vero(nome + ' · ' + sez + ': l\'ultima scheda resta quella 3D dove c\'era', r.ultima3D);
      att(nome + ' · ' + sez + ': non sborda e non mostra valori mancanti', '0 null', r.sb + ' ' + r.strano);
    }
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
