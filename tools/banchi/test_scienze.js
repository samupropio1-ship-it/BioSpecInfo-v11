#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_scienze — astrofisica, relativita', fluidi, calcolo vettoriale,
   cinetica complessa, e il motore comune delle animazioni

   PERCHE' QUESTO BANCO ESISTE

   Le nuove sezioni mostrano cose che lo studente non puo' verificare a
   occhio: l'eta' dell'universo, la profondita' di un transito, il periodo
   di un oscillatore chimico. Ogni numero qui e' confrontato con un valore
   indipendente (letteratura, soluzione esatta, teorema):

   · astrofisica: il Sole sulla sequenza principale (1 L☉, 1 R☉, 5772 K),
     Wien a 502 nm, B − V del Sole ≈ 0,65, raggio di Betelgeuse, eta' ΛCDM
     13,8 Ga ed Einstein-de Sitter 2/(3H₀) esatta, Hohmann Terra-Marte 259
     giorni e 2,94 km/s, transito della Terra 84 ppm in 13 h, HD 209458 b
     con K ≈ 84 m/s (misurato 84,3), terza legge di Keplero sui pianeti;
   · relativita': i gemelli verso Proxima, l'intervallo invariante, la
     composizione delle velocita' (mai oltre c), il Doppler;
   · fluidi: continuita' e Bernoulli, Poiseuille con R⁴, Stokes, Jurin;
   · calcolo vettoriale: Green nelle due forme su ellisse e quadrato, il
     potenziale di un campo conservativo, il vortice con rotore nullo ma
     circuitazione 2π (il buco conta);
   · cinetica: t_max e [B]_max delle consecutive, il bilancio di massa, la
     soglia di Hopf del Brusselator e il periodo, Gray-Scott che forma
     strutture;
   · animazioni: ogni simulazione ha i controlli (pausa, ricomincia,
     velocita'), in pausa non avanza, a ×4 avanza piu' in fretta che a ×¼,
     si ferma quando esce dallo schermo, con «riduci movimento» parte in
     pausa ma con il primo fotogramma disegnato.

   USO   node tools/banchi/test_scienze.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright-core');

const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MINIMO = 90;

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
  ['bsi-fisica-comune.js', 'bsi-mat-cas.js', 'bsi-fis-onde.js', 'bsi-fis-astro.js', 'bsi-fis-relativita.js', 'bsi-fis-fluidi.js', 'bsi-mat-vettoriale.js', 'bsi-chi-cinetica.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx;
}

(async () => {
  const W = carica(), K = W.BSIFisica.calcolo, Cs = W.BSIMatCAS;

  console.log('── Astrofisica ──');
  const A = K.astro, sole = A.sequenzaPrincipale(1);
  att('il Sole sulla sequenza principale: 1 L☉, 1 R☉, 5772 K, classe G', '1 1 5772 G', [sole.L, sole.R, Math.round(sole.T), sole.classe].join(' '));
  vero('una stella di 10 M☉ è di tipo B e vive decine di milioni di anni', A.sequenzaPrincipale(10).classe === 'B' && A.sequenzaPrincipale(10).vita < 1e8 && A.sequenzaPrincipale(10).vita > 1e7);
  vero('una nana rossa di 0,2 M☉ vive più dell’età dell’universo', A.sequenzaPrincipale(0.2).vita > 1.38e10);
  vicino('Wien: il Sole ha il picco a 502 nm', 502.04, A.wien(5772) * 1e9, 0.05);
  vicino('B − V del Sole ≈ 0,65 (Ballesteros)', 0.65, A.bmenoV(5772), 0.03);
  vicino('Vega (9602 K) ha B − V ≈ 0', 0, A.bmenoV(9602), 0.05);
  vicino('raggio di Betelgeuse da L e T: ≈ 900 R☉', 912.5, A.raggioDa(1.26e5, 3600), 1);
  vicino('Sirio B: raggio ≈ 0,012 R☉ (nana bianca)', 0.0125, A.raggioDa(0.056, 25000), 0.001);
  vicino('Stefan-Boltzmann: raggio del Sole da L e T = 1', 1, A.raggioDa(1, 5772), 1e-12);
  let integ = 0; for (let l = 10; l < 1e5; l += 10) integ += A.planck(l * 1e-9, 5772) * 10e-9; vicino('∫B_λ dλ · π = σT⁴ (Planck integrato)', 5.670374419e-8 * Math.pow(5772, 4), integ * Math.PI, 0.002 * 5.670374419e-8 * Math.pow(5772, 4));
  const C0 = A.cosmo(67.7, 0.31, 0.69); vicino('ΛCDM Planck: età dell’universo 13,8 miliardi di anni', 13.79, C0.etaGa, 0.05);
  vicino('Einstein-de Sitter: età = 2/(3H₀) esatta', 2 / 3 * 977.79 / 67.7, A.cosmo(67.7, 1, 0, 0).etaGa, 0.005);
  vero('ΛCDM: l’espansione accelera (q₀ < 0); Einstein-de Sitter rallenta (q₀ = ½)', C0.q0 < 0 && Math.abs(A.cosmo(67.7, 1, 0, 0).q0 - 0.5) < 1e-12);
  vicino('ΛCDM: distanza comovente a z = 1 ≈ 3,4 Gpc', 3.4, C0.dc(1) / 3.0857e25, 0.1);
  const H = A.hohmann(1, 1.5237); vicino('Hohmann Terra → Marte: 259 giorni', 259, H.giorni, 1); vicino('Δv alla partenza 2,94 km/s', 2.94, H.dv1, 0.01); vicino('Marte avanti di 44° alla partenza', 44.3, H.fase, 0.3);
  let T = A.transito({ Ms: 1, Rs: 1, Ls: 1, Rp: 1, Mp: 1, P: 365.25, b: 0.2 }); vicino('la Terra in transito sul Sole: 84 ppm', 83.9, T.profondita * 1e6, 0.1); vicino('a = 1 UA dalla terza legge', 1, T.aUA, 1e-3); vicino('temperatura di equilibrio della Terra ≈ 255 K', 255, T.Teq, 1.5); vicino('durata del transito ≈ 13 h', 12.9, T.durata / 3600, 0.3); vicino('la Terra fa oscillare il Sole di 9 cm/s', 0.0894, T.K, 0.001);
  T = A.transito({ Ms: 1.15, Rs: 1.2, Ls: 1.77, Rp: 15.5, Mp: 219, P: 3.5247, b: 0.5 }); vicino('HD 209458 b: K ≈ 84 m/s (misurato 84,3)', 84.3, T.K, 1.5); vicino('HD 209458 b: profondità ≈ 1,4 %', 0.014, T.profondita, 0.0005);
  vicino('transito senza oscuramento: frazione bloccata = p²', 0.01, A.bloccata(0.1, 0, 0), 2e-4);
  vero('con l’oscuramento al bordo il centro è più profondo', A.bloccata(0.1, 0, 0.6) > A.bloccata(0.1, 0, 0));
  att('nessun transito oltre 1 + p', 0, A.bloccata(0.1, 1.2, 0.6));
  const la = A.PIANETI.map(p => Math.log10(p[2])), lp = A.PIANETI.map(p => Math.log10(p[4])), mx = la.reduce((a, b) => a + b) / 8, my = lp.reduce((a, b) => a + b) / 8;
  let nu = 0, de = 0; la.forEach((v, i) => { nu += (v - mx) * (lp[i] - my); de += (v - mx) ** 2; }); vicino('terza legge di Keplero sui dati: pendenza 3/2', 1.5, nu / de, 0.002);
  const pos = A.posizione(0.3871, 0.2056, 0.2408, 77.46, 0, 0); vicino('Mercurio al perielio: r = a(1 − e)', 0.3871 * (1 - 0.2056), Math.hypot(pos[0], pos[1]), 1e-9);

  console.log('\n── Relatività ──');
  const R = K.relativita, gm = R.gemelli(4.24, 0.8);
  vicino('gemelli verso Proxima a 0,8c: 10,6 anni sulla Terra', 10.6, gm.T, 1e-9); vicino('6,36 anni per chi viaggia', 6.36, gm.tau, 1e-9); vicino('Doppler a 0,8c: fattore 3', 3, gm.k, 1e-12);
  const a1 = R.lorentz(1, 2, 0.5), b1 = R.lorentz(3, 2, 0.5); vicino('intervallo invariante', R.intervallo(2, 0), R.intervallo(b1[0] - a1[0], b1[1] - a1[1]), 1e-12);
  vero('eventi simultanei per uno non lo sono per l’altro', Math.abs(b1[1] - a1[1]) > 0.5);
  vicino('0,6c ⊕ 0,6c = 0,882c', 30 / 34, R.somma(0.6, 0.6), 1e-12); vicino('c ⊕ 0,5c = c', 1, R.somma(1, 0.5), 1e-12); vero('0,99c ⊕ 0,99c < c', R.somma(0.99, 0.99) < 1);
  vicino('γ a 0,6c = 1,25', 1.25, R.gamma(0.6), 1e-12);

  console.log('\n── Fluidi ──');
  const Fl = K.fluidi, V = Fl.venturi(0.02, 0.01, 1, 998, 120000);
  vicino('continuità: raggio dimezzato → velocità × 4', 4, V.v2, 1e-12); vicino('Bernoulli: Δp = ½ρ(v₂² − v₁²)', 0.5 * 998 * 15, V.dp, 1e-9);
  const p1 = Fl.poiseuille(1e-3, 0.1, 100, 1e-3), p2 = Fl.poiseuille(0.5e-3, 0.1, 100, 1e-3); vicino('Poiseuille: raggio dimezzato → portata / 16', 16, p1.Q / p2.Q, 1e-9); vicino('v_max = 2 v_media', 2, p1.vmax / p1.vmedia, 1e-12);
  vicino('Stokes: globulo di 4 μm in acqua a 1 g ≈ 3,6 μm/s', 3.556e-6, Fl.stokes(4e-6, 1100, 998, 1e-3), 1e-8);
  vicino('Jurin: acqua in un capillare di 0,5 mm sale di 2,98 cm', 0.02975, Fl.jurin(0.0728, 0, 998, 5e-4), 1e-4); vero('il mercurio scende', Fl.jurin(0.485, 140, 13534, 5e-4) < 0);
  vicino('Reynolds: acqua 1 m/s in tubo da 2 cm ≈ 20 000 (turbolento)', 19960, Fl.reynolds(998, 1, 0.02, 1e-3), 1);

  console.log('\n── Calcolo vettoriale ──');
  const Vt = K.vettoriale;
  let Fm = Vt.analizzaCampo('-y^3', 'x^3'), Kc = Vt.curva('ellisse', 1.5, 1, 0, 0), L = Vt.lungoCurva(Fm, Kc);
  vicino('Green: ∮F·dr = 3πab(a² + b²)/4 su ellisse', 3 * Math.PI * 1.5 * 3.25 / 4, L.circ, 1e-9); vicino('Green: ∬ rot F dA uguale', L.circ, Vt.suRegione(Fm.frot, Kc), 0.01);
  Fm = Vt.analizzaCampo('x', 'y'); Kc = Vt.curva('quadrato', 1, 1, 0.5, 0); L = Vt.lungoCurva(Fm, Kc); vicino('Gauss nel piano: flusso di (x, y) dal quadrato = 2·area = 8', 8, L.flusso, 1e-9); vicino('∬ div F = 8', 8, Vt.suRegione(Fm.fdiv, Kc), 1e-6);
  Fm = Vt.analizzaCampo('-y', 'x'); vicino('(−y, x): circuitazione = 2 × area', 2 * Math.PI * 2 * 1, Vt.lungoCurva(Fm, Vt.curva('ellisse', 2, 1, 0, 0)).circ, 1e-9);
  Fm = Vt.analizzaCampo('2*x*y', 'x^2+3*y^2'); att('campo conservativo: potenziale x²y + y³', 'y³ + x²·y', Cs.stampa(Fm.potenziale));
  vicino('conservativo: circuitazione nulla', 0, Vt.lungoCurva(Fm, Vt.curva('ellisse', 1.3, 0.7, 0.4, -0.2)).circ, 1e-9);
  Fm = Vt.analizzaCampo('-y/(x^2+y^2)', 'x/(x^2+y^2)'); att('vortice: rotore 0 (verificato anche numericamente)', '0', Cs.stampa(Fm.rot));
  vicino('vortice: circuitazione attorno all’origine = 2π (il buco conta)', 2 * Math.PI, Vt.lungoCurva(Fm, Vt.curva('ellisse', 1, 1, 0, 0)).circ, 1e-9);
  vicino('vortice: attorno a una curva che NON contiene l’origine = 0', 0, Vt.lungoCurva(Fm, Vt.curva('ellisse', 0.5, 0.5, 2, 0)).circ, 1e-9);

  console.log('\n── Cinetica complessa ──');
  const Kn = K.cinetica, S = Kn.consecutive(1, 0.3, 1);
  vicino('t_max = ln(k₁/k₂)/(k₁ − k₂)', Math.log(1 / 0.3) / 0.7, S.tmax, 1e-12);
  let dmax = 0; for (let k = 0; k < 200; k++) { const tt = S.tmax * (0.5 + k / 200); dmax = Math.max(dmax, S.B(tt)); } vicino('[B] è massimo in t_max', dmax, S.B(S.tmax), 1e-9);
  vicino('bilancio di massa A + B + C = A₀', 1, S.A(3.7) + S.B(3.7) + S.C(3.7), 1e-12);
  const Su = Kn.consecutive(0.5, 0.5, 1); vicino('k₁ = k₂: [B]_max = A₀/e', 1 / Math.E, Su.Bmax, 1e-12);
  const Ss = Kn.consecutive(0.1, 5, 1); vicino('k₂ ≫ k₁: lo stato stazionario sbaglia solo dell’ordine di k₁/k₂ (= 2 %)', Ss.Bss(10), Ss.B(10), 0.03 * Ss.Bss(10));
  const br = Kn.brusselatore(1, 3, 1.3, 3, 80, 0.01); vicino('Brusselator A = 1, B = 3: periodo ≈ 7,16', 7.16, Kn.periodo(br), 0.1);
  const bs = Kn.brusselatore(1, 1.5, 1.3, 1.5, 80, 0.01); vicino('sotto la soglia di Hopf: torna allo stazionario (A, B/A)', 0, Math.hypot(bs.x[bs.x.length - 1] - 1, bs.y[bs.y.length - 1] - 1.5), 1e-4);
  const Gs = Kn.grayScott(64); Gs.semina(7); for (let i = 0; i < 2500; i++) Gs.passo(0.0367, 0.0649); let vmax = 0, vmin = 1; Gs.v().forEach(v => { vmax = Math.max(vmax, v); vmin = Math.min(vmin, v); });
  vero('Gray-Scott: dopo 2500 passi la struttura esiste (contrasto ' + (vmax - vmin).toFixed(2) + ') e i valori restano fisici', vmax - vmin > 0.2 && vmin >= -1e-6 && vmax <= 1);

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const SEZ = [[7, 'sfisastro', 5], [7, 'sfisrel', 3], [7, 'sfisfluidi', 3], [8, 'smatvett', 3], [4, 'schicinet', 3]];
  for (const [nome, vp, ridotto] of [['schermo grande', { width: 1280, height: 900 }, false], ['telefono', { width: 390, height: 844 }, false], ['riduci movimento', { width: 1280, height: 900 }, true]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp, reducedMotion: ridotto ? 'reduce' : 'no-preference' });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async ([SEZ, ridotto]) => {
      const gg = document.getElementById('bsi-guide'); if (gg) gg.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms)), out = {};
      for (const [g, s] of SEZ) {
        document.querySelector('.nav-group-tab[data-group="' + g + '"]').click();
        const b = document.querySelector('#navGroup' + g + ' .nav-btn[data-s="' + s + '"]'); if (!b) { out[s] = { manca: true }; continue; }
        b.click(); await pausa(700);
        const sec = document.getElementById(s), sch = sec.querySelectorAll('.bsiFX-schede button'); let piene = 0, tele = 0, disegnate = 0, avvisi = 0, barre = 0, barreOk = 0;
        for (let i = 0; i < sch.length; i++) {
          sch[i].click(); await pausa(2200);
          const pan = [...sec.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent); if (pan.textContent.length > 100) piene++; if (/⚠/.test(pan.textContent)) avvisi++;
          pan.querySelectorAll('canvas').forEach(c => { if (!c.offsetParent) return; tele++; const q = c.getContext('2d'); const d = q.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 0; k < d.length; k += 4 * 31) if (d[k] + d[k + 1] + d[k + 2] > 120) n++; if (n > 5) disegnate++; });
          pan.querySelectorAll('.bsiFX-anim').forEach(bar => { barre++; const bt = [...bar.querySelectorAll('button')]; if (bt.length >= 6 && bt.every(x => (x.getAttribute('aria-label') || '').length > 2)) barreOk++; });
        }
        out[s] = { schede: sch.length, piene, tele, disegnate, avvisi, barre, barreOk };
      }
      /* il motore: pausa, velocita', fuori schermo — sul sistema solare */
      document.querySelector('.nav-group-tab[data-group="7"]').click(); document.querySelector('.nav-btn[data-s="sfisastro"]').click(); await pausa(500);
      const sa = document.getElementById('sfisastro'); sa.querySelectorAll('.bsiFX-schede button')[2].click(); await pausa(1500);
      const pan = [...sa.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), bar = pan.querySelector('.bsiFX-anim'), tempo = () => +(/t = ([\d.]+)/.exec(bar.textContent) || [0, 0])[1];
      const bott = [...bar.querySelectorAll('button')];
      out.motore = { ridotto };
      if (ridotto) { out.motore.partePausa = bott[0].textContent === '▶'; const t0 = tempo(); await pausa(600); out.motore.fermo = tempo() === t0; bott[0].click(); await pausa(800); out.motore.avvia = tempo() > t0; }
      else {
        const t0 = tempo(); await pausa(800); out.motore.avanza = tempo() > t0;
        bott[0].click(); await pausa(200); const tp = tempo(); await pausa(800); out.motore.pausa = tempo() === tp; bott[0].click();
        bott[2].click(); await pausa(100); const q0 = tempo(); await pausa(1000); const lento = tempo() - q0; bott[6].click(); await pausa(100); const q1 = tempo(); await pausa(1000); const veloce = tempo() - q1; out.motore.velocita = [lento, veloce]; bott[4].click();
        /* fuori schermo: si porta la tela lontano con lo scorrimento e il tempo non avanza */
        const spazio = document.createElement('div'); spazio.style.height = '6000px'; document.body.appendChild(spazio); window.scrollTo(0, document.body.scrollHeight); await pausa(500); const f0 = tempo(); await pausa(800); out.motore.fuori = tempo() === f0; spazio.remove(); window.scrollTo(0, 0); pan.scrollIntoView(); await pausa(800); out.motore.torna = tempo() > f0;
        out.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      }
      return out;
    }, [SEZ, ridotto]);
    console.log('── ' + nome + ' ──');
    if (!ridotto) for (const [, s, n] of SEZ) {
      const x = r[s];
      vero(s + ': ' + n + ' schede piene, nessun avviso, le tele disegnano', x && !x.manca && x.schede === n && x.piene === n && x.avvisi === 0 && x.disegnate === x.tele && x.tele > 0);
      if (nome === 'schermo grande') vero(s + ': ogni animazione ha la barra completa con i nomi (' + x.barreOk + '/' + x.barre + ')', x.barre > 0 && x.barre === x.barreOk);
    }
    if (nome === 'schermo grande') {
      vero('il tempo avanza', r.motore.avanza); vero('in pausa il tempo si ferma', r.motore.pausa);
      vero('a ×4 si va più veloce che a ×¼ (' + r.motore.velocita.map(v => v.toFixed(2)).join(' / ') + ' s in 1 s)', r.motore.velocita[1] > 6 * r.motore.velocita[0]);
      vero('fuori dallo schermo l’animazione si ferma', r.motore.fuori); vero('tornando visibile riparte', r.motore.torna);
    } else if (nome === 'telefono') att('a 390 px niente sborda', 0, r.sborda);
    else { vero('«riduci movimento»: parte in pausa', r.motore.partePausa && r.motore.fermo); vero('«riduci movimento»: con ▶ si avvia', r.motore.avvia); }
    att('nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
    await ctx.close();
  }
  const ctxE = await browser.newContext({ serviceWorkers: 'block' });
  const pgE = await ctxE.newPage();
  await pgE.addInitScript(() => { try { localStorage.setItem('bsi_lang', 'en'); localStorage.setItem('bsi-lingua', 'en'); } catch (e) {} });
  await pgE.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgE.waitForTimeout(5000);
  const tr = await pgE.evaluate(async () => { if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en'); await new Promise(r => setTimeout(r, 1500)); return ['sfisastro', 'sfisrel', 'smatvett', 'schicinet'].map(s => document.querySelector('.nav-btn[data-s="' + s + '"]').textContent.trim()); });
  att('in inglese: i nomi delle sezioni', '🔭 Astrophysics|⏱️ Special relativity|∇ Vector calculus|🌀 Complex kinetics', tr.join('|'));
  await ctxE.close();
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
