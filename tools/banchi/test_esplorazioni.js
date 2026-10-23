#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_esplorazioni — probabilita', matematica visiva, elettromagnetismo,
   suono, semiconduttori, distillazione, voltammetria ciclica

   PERCHE' QUESTO BANCO ESISTE

   Sono sezioni in cui lo studente guarda una simulazione e si fida. Qui la
   simulazione viene messa davanti alla risposta nota:

   · probabilita': la binomiale normalizzata, Bayes con il caso classico
     (prevalenza 1 %, sensibilita' 99 %, specificita' 95 % → VPP 1/6), il
     Monte Carlo di π, le medie che convergono;
   · matematica visiva: autovalori di matrici note, la trasformata di Fourier
     che ricostruisce esattamente con tutti i termini, il periodo della mappa
     logistica (1, 2, 4, 8, 3 nella finestra, caos), Mandelbrot;
   · elettromagnetismo: il flusso del dipolo in forma chiusa contro
     l'integrale sul disco, il generatore ε₀ = NBAω, il campo di una carica;
   · suono: le armoniche di corda e canne, la velocita' del suono a 20 °C,
     +3 dB per due sorgenti, Doppler;
   · semiconduttori: n_i di Si, Ge e GaAs a 300 K contro la letteratura, la
     resistivita' del silicio drogato 10¹⁶, V_bi ≈ 0,71 V, Shockley;
   · distillazione: ebollizione dei puri (Antoine), l'azeotropo etanolo-acqua
     (modello contro misura), McCabe-Thiele contro Fenske, il pinch sotto il
     riflusso minimo e oltre l'azeotropo;
   · voltammetria: il picco reversibile contro Randles-Ševčík, ΔE_p ≈ 58 mV,
     E_pc = E½ − 28,5 mV, il picco irreversibile contro 0,4958 nFAC√(αnFvD/RT),
     D ricavato dalla pendenza di i_p contro √v;
   e nel browser tutte le schede su due schermi.

   USO   node tools/banchi/test_esplorazioni.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright-core');

const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MINIMO = 80;

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vicino(d, atteso, avuto, tol) {
  eseguiti++;
  if (Math.abs(avuto - atteso) <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+(+avuto).toPrecision(8)) + ' (atteso ' + (+(+atteso).toPrecision(8)) + ' ± ' + tol + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tol + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

function carica() {
  const ctx = { console, Math, Float64Array, Float32Array, Int8Array, Int32Array, Uint8Array, Date, Number, Array, Object, String, JSON, isFinite, Infinity, NaN, BigInt, setTimeout, clearTimeout, RegExp, Promise };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({ style: {} }), querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  ['bsi-fisica-comune.js', 'bsi-mat-probabilita.js', 'bsi-mat-visiva.js', 'bsi-fis-em.js', 'bsi-fis-suono.js', 'bsi-fis-solido.js', 'bsi-chi-distillazione.js', 'bsi-chi-voltammetria.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx.BSIFisica.calcolo;
}

(async () => {
  const K = carica();

  console.log('── Probabilità ──');
  const P = K.probabilita;
  let s = 0; for (let k = 0; k <= 12; k++) s += P.binomiale(12, k, 0.3); vicino('la binomiale B(12; 0,3) somma a 1', 1, s, 1e-12);
  vicino('B(10, 5; ½) = 252/1024', 252 / 1024, P.binomiale(10, 5, 0.5), 1e-12);
  vicino('Bayes: prevalenza 1 %, sens. 99 %, spec. 95 % → VPP = 1/6', 1 / 6, P.bayes(0.01, 0.99, 0.95).ppv, 1e-12);
  vero('Bayes: VPN altissimo (> 99,9 %)', P.bayes(0.01, 0.99, 0.95).npv > 0.999);
  vicino('Monte Carlo con 10⁶ freccette: π entro 0,005', Math.PI, P.montecarloPi(1e6, P.generatore(1)), 0.005);
  const r = P.generatore(5), D = P.DISTR.esponenziale; let m = 0; for (let i = 0; i < 200000; i++) m += D[1](r); vicino('legge dei grandi numeri: la media di 200 000 esponenziali → 1', 1, m / 200000, 0.01);
  const r2 = P.generatore(9), medie = []; for (let k = 0; k < 4000; k++) { let a = 0; for (let i = 0; i < 25; i++) a += P.DISTR.dado[1](r2); medie.push(a / 25); }
  const mm = medie.reduce((a, b) => a + b) / 4000, sd = Math.sqrt(medie.reduce((a, b) => a + (b - mm) ** 2, 0) / 3999); vicino('limite centrale: le medie di 25 dadi hanno σ/√n = 0,3416', Math.sqrt(35 / 12) / 5, sd, 0.012);

  console.log('\n── Matematica visiva ──');
  const V = K.visiva;
  const E1 = V.autovalori2(2, 1, 1, 2); att('autovalori di [[2,1],[1,2]] = 3 e 1', '3 1', E1.l1 + ' ' + E1.l2); att('autovettori (1,1) e (1,−1)', '1,1 1,-1', E1.v1.join(',') + ' ' + E1.v2.join(','));
  const E2 = V.autovalori2(0, -1, 1, 0); att('rotazione di 90°: autovalori ±i', 'false 0 1', [E2.reali, E2.re, E2.im].join(' '));
  vicino('determinante del taglio = 1', 1, V.autovalori2(1, 1, 0, 1).det, 1e-15);
  const pts = []; for (let i = 0; i < 128; i++) pts.push(V.FORME.quadrato(2 * Math.PI * i / 128)); const c = V.dft(pts); let e = 0; for (let i = 0; i < 128; i++) { const q = V.ricostruisci(c, 128, 2 * Math.PI * i / 128); e = Math.max(e, Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])); }
  vicino('Fourier: con tutti i termini il quadrato si ricostruisce esattamente', 0, e, 1e-12);
  let e10 = 0; for (let i = 0; i < 128; i++) { const q = V.ricostruisci(c, 10, 2 * Math.PI * i / 128); e10 = Math.max(e10, Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])); } vero('con 10 termini il quadrato è approssimato (errore ' + e10.toFixed(3) + ')', e10 > 0.01 && e10 < 0.3);
  att('mappa logistica: periodi a r = 2,8 / 3,2 / 3,5 / 3,55 / 3,83', '1 2 4 8 3', [2.8, 3.2, 3.5, 3.55, 3.83].map(V.periodo).join(' '));
  att('r = 3,9: caos (nessun periodo)', 'Infinity', V.periodo(3.9));
  vicino('punto fisso a r = 2,8: x* = 1 − 1/r', 1 - 1 / 2.8, V.attrattore(2.8, 0.3, 4000, 1)[0], 1e-9);
  vero('Mandelbrot: 0 e −1 dentro, 1 fuori', V.mandelbrot(0, 0, 200) === 200 && V.mandelbrot(-1, 0, 200) === 200 && V.mandelbrot(1, 0, 200) < 10);

  console.log('\n── Elettromagnetismo ──');
  const EM = K.em;
  for (const z of [0.5, 1, 2]) vicino('flusso del dipolo a z = ' + z + ': forma chiusa = integrale sul disco', EM.flussoDipolo(1, 1, z), EM.flussoNumerico(1, 1, z), 1e-6);
  vicino('flusso massimo al centro: μ₀m/(2a)', 0.5, EM.flussoDipolo(1, 1, 0), 1e-12);
  const G = EM.generatore(100, 0.2, 0.01, 50, 100); vicino('generatore: ε₀ = NBAω', 100 * 0.2 * 0.01 * 2 * Math.PI * 50, G.e0, 1e-9); vicino('efficace ε₀/√2', G.e0 / Math.SQRT2, G.eff, 1e-12);
  const Ec = EM.campo([{ q: 1, x: 0, y: 0 }], 2, 0); vicino('campo di una carica a r = 2: q/r²', 0.25, Ec[0], 1e-12);
  vicino('potenziale del dipolo sull’asse di simmetria = 0', 0, EM.potenziale([{ q: 1, x: -1, y: 0 }, { q: -1, x: 1, y: 0 }], 0, 3), 1e-12);

  console.log('\n── Suono ──');
  const S = K.suono;
  const vc = S.velocitaCorda(70, 0.0006); vicino('corda: v = √(T/μ)', Math.sqrt(70 / 0.0006), vc, 1e-9);
  att('corda: armoniche 1, 2, 3 × fondamentale', '1 2 3', S.armoniche('corda', 0.65, vc, 3).map(f => Math.round(f / (vc / 1.3))).join(' '));
  att('canna chiusa: solo armoniche dispari', '1 3 5', S.armoniche('chiusa', 0.5, 343, 3).map(f => Math.round(f / (343 / 2))).join(' '));
  vicino('velocità del suono a 20 °C ≈ 343 m/s', 343.2, S.velocitaAria(20), 0.1);
  vicino('due sorgenti uguali: +3,01 dB', 83.0103, S.sommaDB([80, 80]), 1e-4);
  vicino('Doppler: sorgente a 0,1 v in avvicinamento, f/(1 − 0,1)', 440 / 0.9, S.doppler(440, 343, 34.3), 1e-9);
  vicino('dB: 1 W/m² = 120 dB', 120, S.dB(1), 1e-12);

  console.log('\n── Semiconduttori ──');
  const So = K.solido, Mt = So.MATERIALI;
  vicino('Si: E_g(300 K) ≈ 1,12 eV', 1.12, So.Eg(Mt.Si, 300), 0.005);
  vicino('Si: n_i(300 K) ≈ 1,0·10¹⁰ cm⁻³ (letteratura 0,97–1,08·10¹⁰)', 1.02e10, So.ni(Mt.Si, 300), 0.08e10);
  vicino('Ge: n_i(300 K) ≈ 2,0·10¹³', 2.1e13, So.ni(Mt.Ge, 300), 0.3e13);
  vicino('GaAs: n_i(300 K) ≈ 2,1·10⁶', 2.2e6, So.ni(Mt.GaAs, 300), 0.4e6);
  const d = So.drogaggio(Mt.Si, 300, 1e16, 0); vicino('Si drogato 10¹⁶ (P): ρ ≈ 0,45 Ω·cm', 0.45, d.rho, 0.03); vicino('legge di azione di massa: n·p = n_i²', d.ni * d.ni, d.n * d.p, 1e-6 * d.ni * d.ni);
  vicino('giunzione p-n Si 10¹⁶/10¹⁶: V_bi ≈ 0,71 V', 0.71, So.giunzione(Mt.Si, 300, 1e16, 1e16).Vbi, 0.01);
  vicino('Shockley: a 0 V corrente nulla', 0, So.shockley(0, 1e-12, 0.0257), 1e-20);
  vicino('Shockley: in inversa → −I₀', -1e-12, So.shockley(-1, 1e-12, 0.0257), 1e-15);
  vicino('LED GaN 3,4 eV → 365 nm', 364.7, 1239.84 / So.LED[5][2], 0.1);

  console.log('\n── Distillazione ──');
  const Di = K.distillazione, SI = Di.SISTEMI;
  att('ebollizione dei puri a 1 atm (Antoine): benzene, toluene, etanolo, acqua', '80.1 110.6 78.3 100.0', ['benzene', 'toluene', 'etanolo', 'acqua'].map(x => Di.Teb(x).toFixed(1)).join(' '));
  const az = Di.azeotropo(SI.ea); vicino('azeotropo etanolo-acqua (van Laar): x ≈ 0,89 misurato', 0.894, az.x, 0.03); vicino('azeotropo: T ≈ 78,15 °C', 78.15, az.T, 0.2);
  vero('benzene-toluene: nessun azeotropo', Di.azeotropo(SI.bt) === null);
  vicino('Raoult: punto di bolla di benzene puro = 80,1 °C', 80.1, Di.bolla(SI.bt, 1).T, 0.05);
  const al = Di.alfaMedia(SI.bt), Nmin = Di.fenske(al, 0.95, 0.05); vicino('volatilità relativa benzene-toluene ≈ 2,47', 2.47, al, 0.03);
  vero('McCabe a riflusso altissimo: piatti ≥ Fenske e vicini (' + Di.mccabe(SI.bt, 0.95, 0.05, 0.5, 100).piatti + ' vs ' + Nmin.toFixed(2) + ')', Di.mccabe(SI.bt, 0.95, 0.05, 0.5, 100).piatti >= Nmin && Di.mccabe(SI.bt, 0.95, 0.05, 0.5, 100).piatti <= Nmin + 1.5);
  vero('più riflusso, meno piatti', Di.mccabe(SI.bt, 0.95, 0.05, 0.5, 1.5).piatti > Di.mccabe(SI.bt, 0.95, 0.05, 0.5, 5).piatti);
  vero('sotto il riflusso minimo (R = 0,9 < ' + Di.riflussoMinimo(al, 0.95, 0.5).toFixed(2) + ') la colonna non separa', Di.mccabe(SI.bt, 0.95, 0.05, 0.5, 0.9).pinch || Di.mccabe(SI.bt, 0.95, 0.05, 0.5, 0.9).piatti > 60);
  vero('etanolo-acqua: x_D oltre l’azeotropo è irraggiungibile', Di.mccabe(SI.ea, 0.95, 0.05, 0.3, 3).pinch);
  vero('Rayleigh: distillando, il residuo si impoverisce del più volatile', Di.rayleigh(SI.bt, 0.5, 0.3) < 1 && Di.rayleigh(SI.bt, 0.5, 0.3) > 0);

  console.log('\n── Voltammetria ciclica ──');
  const Vo = K.voltammetria, base = { E0: 0, Ei: 0.4, El: -0.4, v: 0.1, k0: 1, alfa: 0.5, n: 1, D: 1e-5, C: 1e-6, A: 1, Nt: 6000 };
  let Pk = Vo.picchi(Vo.simula(base)); const ir = Vo.randles(1, 1, 1e-6, 0.1, 1e-5);
  vicino('reversibile: |i_pc| = Randles-Ševčík (entro 1 %)', 1, -Pk.ipc / ir, 0.01);
  vicino('reversibile: ΔE_p ≈ 58 mV', 58, Pk.dEp * 1000, 1.5);
  vicino('reversibile: E_pc = E½ − 28,5 mV', -28.5, Pk.Epc * 1000, 1);
  vicino('reversibile: E½ = E⁰', 0, Pk.E12 * 1000, 1.5);
  Pk = Vo.picchi(Vo.simula(Object.assign({}, base, { n: 2 }))); vicino('n = 2: ΔE_p ≈ 29 mV', 29, Pk.dEp * 1000, 1.5);
  const irr = Vo.picchi(Vo.simula(Object.assign({}, base, { k0: 1e-5, El: -0.6 }))), F_ = 96485.33212; vicino('irreversibile: i_p = 0,4958 nFAC√(αnFvD/RT)', 0.4958 * F_ * 1e-6 * Math.sqrt(0.5 * F_ * 0.1 * 1e-5 / (8.314462618 * 298.15)), -irr.ipc, 0.01 * 0.4958 * F_ * 1e-6 * Math.sqrt(0.5 * F_ * 0.1 * 1e-5 / (8.314462618 * 298.15)));
  vero('k⁰ lento: ΔE_p cresce (> 100 mV con k⁰ = 10⁻³)', Vo.picchi(Vo.simula(Object.assign({}, base, { k0: 1e-3 }))).dEp * 1000 > 100);
  const vs = [0.01, 0.04, 0.16, 0.64], ips = vs.map(v => -Vo.picchi(Vo.simula(Object.assign({}, base, { v, Nt: 3000 }))).ipc), rapp = ips.map((i, k) => i / Math.sqrt(vs[k]));
  vicino('i_p ∝ √v (diffusione): i_p/√v costante', 0, (Math.max(...rapp) - Math.min(...rapp)) / rapp[0], 0.01);

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const SEZ = [[8, 'smatprob', 4], [8, 'smatvis', 4], [7, 'sfisem', 4], [7, 'sfissuono', 4], [7, 'sfissolido', 3], [4, 'schidist', 3], [4, 'schivolt', 2]];
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r2 = await pg.evaluate(async (SEZ) => {
      const gg = document.getElementById('bsi-guide'); if (gg) gg.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms)), out = {};
      for (const [g, s] of SEZ) {
        document.querySelector('.nav-group-tab[data-group="' + g + '"]').click();
        const b = document.querySelector('#navGroup' + g + ' .nav-btn[data-s="' + s + '"]'); if (!b) { out[s] = { manca: true }; continue; }
        b.click(); await pausa(600);
        const sec = document.getElementById(s), sch = sec.querySelectorAll('.bsiFX-schede button'); let piene = 0, tele = 0, disegnate = 0, avvisi = 0, etichette = true;
        for (let i = 0; i < sch.length; i++) {
          sch[i].click(); await pausa(2200);
          const pan = [...sec.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent); if (pan.textContent.length > 100) piene++; if (/⚠/.test(pan.textContent)) avvisi++;
          pan.querySelectorAll('canvas').forEach(c => { if (!c.offsetParent) return; tele++; if ((c.getAttribute('aria-label') || '').length < 3) etichette = false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 0; k < d.length; k += 4 * 31) if (d[k] + d[k + 1] + d[k + 2] > 120) n++; if (n > 5) disegnate++; });
        }
        out[s] = { schede: sch.length, piene, tele, disegnate, avvisi, etichette };
      }
      /* una figura disegnata a mano viene ricostruita dagli epicicli */
      document.querySelector('.nav-group-tab[data-group="8"]').click(); document.querySelector('.nav-btn[data-s="smatvis"]').click(); await pausa(400);
      const sv = document.getElementById('smatvis'); sv.querySelectorAll('.bsiFX-schede button')[1].click(); await pausa(600);
      const pv = [...sv.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), sel = pv.querySelector('select'); sel.value = 'mano'; sel.dispatchEvent(new Event('change'));
      const cv = pv.querySelector('canvas'), rc = cv.getBoundingClientRect(), cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
      cv.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 3, clientX: cx + 80, clientY: cy, bubbles: true }));
      for (let k = 1; k <= 40; k++) { const a = 2 * Math.PI * k / 40; cv.dispatchEvent(new PointerEvent('pointermove', { pointerId: 3, clientX: cx + 80 * Math.cos(a), clientY: cy + 50 * Math.sin(a), bubbles: true })); }
      cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, bubbles: true })); await pausa(400);
      out.mano = /Termini usati|Terms used/.test(pv.textContent);
      /* le cariche si trascinano */
      document.querySelector('.nav-group-tab[data-group="7"]').click(); document.querySelector('.nav-btn[data-s="sfisem"]').click(); await pausa(400);
      const se = document.getElementById('sfisem'); se.querySelectorAll('.bsiFX-schede button')[0].click(); await pausa(800);
      const pe = [...se.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), ce = pe.querySelector('canvas'), re = ce.getBoundingClientRect(), prima = ce.toDataURL();
      const xq = re.left + (-1.2 + 3) / 6 * re.width, yq = re.top + re.height / 2;
      ce.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 4, clientX: xq, clientY: yq, bubbles: true })); ce.dispatchEvent(new PointerEvent('pointermove', { pointerId: 4, clientX: xq, clientY: yq - 60, bubbles: true })); ce.dispatchEvent(new PointerEvent('pointerup', { pointerId: 4, bubbles: true }));
      await pausa(400); out.trascina = ce.toDataURL() !== prima;
      out.ascolta = !!document.querySelector('#sfissuono') && [...document.querySelectorAll('#sfissuono .bsiFX-bott')].some(b => /Ascolta|Listen/.test(b.textContent));
      out.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return out;
    }, SEZ);
    console.log('── ' + nome + ' ──');
    for (const [, s, n] of SEZ) { const x = r2[s]; vero(s + ': ' + n + ' schede piene, nessun avviso, le tele disegnano e hanno un nome', x && !x.manca && x.schede === n && x.piene === n && x.avvisi === 0 && x.disegnate === x.tele && x.tele > 0 && x.etichette); }
    if (nome === 'schermo grande') { vero('una figura disegnata con il dito viene ricostruita dagli epicicli', r2.mano); vero('le cariche si trascinano e il campo si ridisegna', r2.trascina); vero('il suono ha il pulsante «Ascolta»', r2.ascolta); }
    else att('a 390 px niente sborda', 0, r2.sborda);
    att('nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
    await ctx.close();
  }
  const ctxE = await browser.newContext({ serviceWorkers: 'block' });
  const pgE = await ctxE.newPage();
  await pgE.addInitScript(() => { try { localStorage.setItem('bsi_lang', 'en'); localStorage.setItem('bsi-lingua', 'en'); } catch (e) {} });
  await pgE.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgE.waitForTimeout(5000);
  const tr = await pgE.evaluate(async () => { if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en'); await new Promise(r => setTimeout(r, 1500)); return ['smatprob', 'sfissolido', 'schivolt'].map(s => document.querySelector('.nav-btn[data-s="' + s + '"]').textContent.trim()); });
  att('in inglese: i nomi delle sezioni', '🎲 Probability in motion|💡 Semiconductors|🔋 Cyclic voltammetry', tr.join('|'));
  await ctxE.close();
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
