#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_materiaoscura — 🌑 Materia oscura e lenti gravitazionali (v255)

   PERCHE' QUESTO BANCO ESISTE
   Lo standard del progetto chiede la materia oscura «come nel video» ma vera.
   Qui ogni pezzo si confronta con un valore noto o con una forma esatta:
   · cosmologia ΛCDM di Planck 2018: D(z = 1) = 0,607 e D(a)/a → 1,269 nel
     passato remoto (la soppressione della crescita dovuta a Λ); distanza di
     diametro angolare a z = 1: 1700 Mpc; σ₈ = 0,811 dalla normalizzazione;
   · la FFT contro la trasformata discreta scritta per esteso;
   · la rete cosmica: lo scarto quadratico di δ sulla griglia uguale a
     √(Σ P(k)/V), e div ψ = −δ alla precisione della macchina;
   · le lenti: SIS con immagini a β ± θ_E e amplificazioni θ/(θ − θ_E);
     massa puntiforme con amplificazione totale (u² + 2)/(u√(u² + 4));
     curva critica della SIS al raggio di Einstein; SIE con quattro immagini
     per una sorgente vicino al centro; θ_E di una galassia (σ = 200 km/s)
     e di un ammasso (σ = 1000 km/s);
   · la rete neurale impara (l'errore di validazione su θ_E scende sotto
     0,15″) e il fit fisico che parte dalla sua risposta ritrova i parametri
     veri (χ²/ν ≈ 1);
   · le curve di rotazione: picco del disco di Freeman a 2,2 R_d, curva piatta
     con l'alone;
   · la pagina, con le cinque schede (anche la regia «dalla materia alla
     lente»), a due larghezze.

   USO   node tools/banchi/test_materiaoscura.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }
function vicino(d, atteso, avuto, tol) { const e = Math.abs(avuto - atteso) / Math.max(1e-300, Math.abs(atteso)); if (e <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+avuto.toPrecision(6)) + ' (atteso ' + atteso + ')'); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + (tol * 100) + ' %\n      avuto:  ' + avuto); } }

(async () => {
  global.window = global; global.BSIFisica = { t: a => a, calcolo: {}, sezione() {}, el() {} };
  require(path.join(RADICE, 'bsi-astro-materiaoscura-fisica.js')); require(path.join(RADICE, 'bsi-astro-materiaoscura.js'));
  const M = global.BSIMateriaOscura, Q = global.BSIFisica.calcolo.materiaoscura;

  console.log('── Cosmologia ──');
  vicino('D(z = 1)', 0.6068, M.crescita(0.5), 2e-3);
  vicino('D(a)/a a a = 0,01 (soppressione da Λ: 1/0,788)', 1.2693, M.crescita(0.01) / 0.01, 2e-3);
  vicino('distanza di diametro angolare a z = 1 (Mpc)', 1700.6, M.diametroAngolare(1), 2e-3);
  vicino('σ₈ dalla normalizzazione', 0.811, M.sigmaR(8, M.ampiezza()), 1e-4);
  vero('la funzione di trasferimento vale 1 a grande scala e scende a piccola', Math.abs(M.trasferimento(1e-5) - 1) < 1e-3 && M.trasferimento(1) < 0.05);

  console.log('\n── FFT e rete cosmica ──');
  const n = 16, re = new Float64Array(n).map((_, i) => Math.sin(i * 1.3) + i * 0.1), im = new Float64Array(n), r0 = Array.from(re); M.fft1(re, im, false); let e = 0;
  for (let k = 0; k < n; k++) { let sr = 0, si = 0; for (let j = 0; j < n; j++) { sr += r0[j] * Math.cos(-2 * Math.PI * j * k / n); si += r0[j] * Math.sin(-2 * Math.PI * j * k / n); } e = Math.max(e, Math.hypot(sr - re[k], si - im[k])); }
  vero('FFT contro la trasformata discreta (scarto ' + e.toExponential(1) + ')', e < 1e-12);
  const R = M.reteCosmica(32, 200, 5); let s = 0, dv = 0; for (let i = 0; i < R.delta.length; i++) { s += R.delta[i] ** 2; dv = Math.max(dv, Math.abs(R.dpsi.xx[i] + R.dpsi.yy[i] + R.dpsi.zz[i] + R.delta[i])); }
  let a2 = 0; const N = 32, L = 200, kf = 2 * Math.PI / L, kk = j => (j <= N / 2 ? j : j - N) * kf;
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (x === N / 2 || y === N / 2 || z === N / 2) continue; const k = Math.hypot(kk(x), kk(y), kk(z)); if (k > 0) a2 += M.spettro(k) / L ** 3; }
  vicino('scarto quadratico di δ sulla griglia = √(Σ P(k)/V)', Math.sqrt(a2), Math.sqrt(s / R.delta.length), 0.02);
  vero('div ψ = −δ (scarto ' + dv.toExponential(1) + ')', dv < 1e-10);
  const pos = new Float32Array(N * N * N * 3), d0 = new Float32Array(N * N * N), d1 = new Float32Array(N * N * N); M.evolvi(R, 0, pos, d0); M.evolvi(R, 1, pos, d1);
  vero('a D = 0 la densità è uniforme; a D = 1 ci sono vuoti e nodi', d0.every(v => Math.abs(v - 1) < 1e-6) && Math.min(...d1) < 0.5 && Math.max(...d1) > 5);

  console.log('\n── Lenti ──');
  const sis = M.immagini({ tipo: 'sis', te: 1.2 }, 0.3, 0, 3).sort((a, b) => a[0] - b[0]);
  vero('SIS: immagini a β − θ_E e β + θ_E (−0,9 e 1,5)', sis.length === 2 && Math.abs(sis[0][0] + 0.9) < 1e-6 && Math.abs(sis[1][0] - 1.5) < 1e-6);
  vero('SIS: amplificazioni −3 e 5', Math.abs(sis[0][2] + 3) < 1e-3 && Math.abs(sis[1][2] - 5) < 1e-3);
  const pt = M.immagini({ tipo: 'punto', te: 1 }, 0.5, 0, 3), mt = pt.reduce((a, p) => a + Math.abs(p[2]), 0);
  vicino('massa puntiforme: amplificazione totale (u² + 2)/(u√(u² + 4))', (0.25 + 2) / (0.5 * Math.sqrt(4.25)), mt, 1e-5);
  const cc = M.curveCritiche({ tipo: 'sis', te: 1.2 }, 3, 160); let rr = 0; cc.critiche.forEach(sg => rr = Math.max(rr, Math.abs(Math.hypot(...sg[0]) - 1.2)));
  vero('curva critica della SIS sul raggio di Einstein (scarto ' + rr.toFixed(4) + '″)', rr < 0.002 && cc.critiche.length > 100);
  att('SIE con la sorgente vicino al centro: quattro immagini (croce di Einstein)', 4, M.immagini({ tipo: 'sie', te: 1, q: 0.7, ang: 0.3 }, 0.05, 0.03, 3).length);
  vicino('θ_E di una galassia, σ = 200 km/s, z = 0,5 → 2 (″)', 0.730, M.einsteinSIS(200, 0.5, 2), 3e-3);
  vicino('θ_E di un ammasso, σ = 1000 km/s, z = 0,3 → 2 (″)', 22.13, M.einsteinSIS(1000, 0.3, 2), 3e-3);
  vero('NFW: h(x) continua in x = 1', Math.abs(M.hNFW(0.999) - M.hNFW(1.001)) < 1e-3);

  console.log('\n── Fisica + apprendimento automatico ──');
  const tr = Q.dataset(1200, 11, 0.04), va = Q.dataset(150, 99, 0.04), net = new Q.Rete([576, 64, 32, 3], 5);
  let primo = null;
  for (let ep = 0; ep < 18; ep++) { const o = tr.X.map((_, i) => i), rnd = M.mulberry(100 + ep); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } for (let b = 0; b < o.length; b += 32) { const ix = o.slice(b, b + 32); net.passo(ix.map(i => tr.X[i]), ix.map(i => tr.Y[i]), 0.0015); } if (!ep) primo = Math.sqrt(va.X.reduce((q, x, i) => q + (net.predici(x)[0] - va.P[i].te) ** 2, 0) / va.X.length); }
  const rms = Math.sqrt(va.X.reduce((q, x, i) => q + (net.predici(x)[0] - va.P[i].te) ** 2, 0) / va.X.length);
  vero('la rete impara: errore su θ_E da ' + primo.toFixed(3) + '″ a ' + rms.toFixed(3) + '″ (sotto 0,15″)', rms < 0.15 && rms < primo);
  const rnd = M.mulberry(777); let eF = 0, chi = 0;
  for (let k = 0; k < 3; k++) { const v = Q.parametriCasuali(rnd), o = Q.immagineLente(v, 0.04, rnd), pr = Q.daBersaglio(net.predici(Q.normalizza(o))), f = Q.fitFisico(o, { te: pr.te, q: pr.q, ang: pr.ang }, 0.04, 500); eF = Math.max(eF, Math.abs(f.te - v.te)); chi += f.chi2 / f.dof / 3; }
  vero('il fit fisico che parte dalla rete ritrova θ_E entro 0,02″ (' + eF.toFixed(4) + ') con χ²/ν ≈ 1 (' + chi.toFixed(2) + ')', eF < 0.02 && chi > 0.8 && chi < 1.25);

  console.log('\n── Curve di rotazione ──');
  let vmax = 0, rmax = 0; for (let r = 0.2; r < 20; r += 0.05) { const v = M.vDisco(r, 5e10, 3); if (v > vmax) { vmax = v; rmax = r; } }
  vicino('il disco di Freeman ha il picco a 2,15 R_d', 2.15, rmax / 3, 0.02);
  vero('senza alone la curva scende come Keplero lontano dal disco', M.vDisco(40, 5e10, 3) / M.vDisco(20, 5e10, 3) < 0.75);
  const vt = r => Math.hypot(M.vDisco(r, 5e10, 3), M.vAlone(r, 1e12, 10, 210)); vero('con l\'alone resta quasi piatta da 10 a 40 kpc (' + vt(10).toFixed(0) + ' → ' + vt(40).toFixed(0) + ' km/s)', Math.abs(vt(40) / vt(10) - 1) < 0.2);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e2 => errs.push(e2.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.materiaoscura), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(x => setTimeout(x, ms)), o = { tele: [], sb: 0, strano: null, testi: [] };
      const x = BSISpectraLive.calcolo.apriSezione('sastrooscura'); await pausa(600); o.aperta = x && x.id; o.nav = !!document.querySelector('.nav-btn[data-s="sastrooscura"]');
      const el = document.getElementById('sastrooscura'), schede = [...el.querySelectorAll('.bsiFX-schede button')]; o.schede = schede.length;
      for (const bt of schede) { bt.click(); for (let i = 0; i < 40 && /Caricamento/.test(el.innerText); i++) await pausa(250); await pausa(1200); o.tele.push([...el.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 100).length); o.sb = Math.max(o.sb, document.documentElement.scrollWidth - document.documentElement.clientWidth); o.strano = o.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b|Infinity).{0,20}/) || [null])[0]; o.testi.push(el.innerText); }
      o.rete = /troncata/.test(o.testi[0]) && /σ₈ = 0,811/.test(o.testi[0]); o.lente = /0,73″/.test(o.testi[1]) && /Immagini della sorgente/.test(o.testi[1]); o.ml = /Hezaveh/.test(o.testi[2]); o.rot = /229/.test(o.testi[3]); o.regia = /anello di Einstein|rete cosmica/.test(o.testi[4]);
      return o;
    });
    vero(nome + ' · nella barra, si apre, 5 schede con le tele (' + r.tele.join(',') + ')', r.nav && r.aperta === 'sastrooscura' && r.schede === 5 && r.tele.every(k => k >= 1));
    vero(nome + ' · la regia: la sequenza dalla rete alla lente con le sue fasi', r.regia);
    vero(nome + ' · i testi: rete troncata con σ₈, lente con θ_E vero, apprendimento con la fonte, rotazione con la misura del Sole', r.rete && r.lente && r.ml && r.rot);
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', r.sb + ' ' + r.strano);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e2 => console.log('      ! ' + e2));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
