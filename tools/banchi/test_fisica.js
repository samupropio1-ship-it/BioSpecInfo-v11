#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_fisica — le otto sezioni di FISICA, contro i numeri della letteratura

   PERCHE' QUESTO BANCO ESISTE

   Una sezione di fisica che disegna belle curve ma sbaglia i numeri e'
   peggio di nessuna sezione: insegna una cosa falsa con autorita'. Qui ogni
   calcolo e' messo davanti a un valore che NON viene dal codice stesso:

   · Schrödinger: le soluzioni esatte (oscillatore armonico, pozzo
     infinito, Morse) e la norma conservata da Crank-Nicolson;
   · Hartree-Fock STO-3G: le energie pubblicate — H₂ a 1,4 bohr e HeH⁺
     (Szabo-Ostlund), H₂O alla geometria del progetto di Crawford;
   · rotovibrazionale: la lunghezza di legame di HCl e le costanti B
     ricavate di nuovo dalle righe;
   · termodinamica statistica: le entropie standard NIST-JANAF;
   · dinamica molecolare: la conservazione dell'energia senza termostato
     e il primo picco di g(r) al minimo del potenziale;
   · matematica: Hückel (benzene, butadiene, naftalene, ciclobutadiene),
     la FFT, Runge-Kutta contro la soluzione esatta, l'Eₐ di N₂O₅;
   · cristallografia: gli angoli 2θ delle schede di riferimento (NaCl, Si,
     Cu, α-Fe con Cu Kα) e le estinzioni sistematiche;
   · nucleare: il massimo del ⁹⁹ᵐTc, l'equilibrio secolare Sr/Y, l'eta' al
     ¹⁴C, B/A del ⁵⁶Fe.

   Poi, nel browser: la categoria ⚛️ c'e', ogni sezione e ogni scheda si
   apre senza errori e disegna, niente sborda a 390 px, la dinamica
   molecolare si ferma a sezione chiusa, i pulsanti sono tradotti.

   USO   node tools/banchi/test_fisica.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright-core');

const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vicino(d, atteso, avuto, tol) {
  eseguiti++;
  if (Math.abs(avuto - atteso) <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+avuto.toPrecision(10)) + ' (atteso ' + atteso + ' ± ' + tol + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tol + '\n      avuto:  ' + avuto); }
}

/* i moduli caricati in node, senza browser: solo i calcoli */
function carica() {
  const ctx = { console, Math, Float64Array, Int32Array, Date, Number, Array, Object, String, JSON, isFinite, Infinity, NaN, setTimeout, clearTimeout };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({ style: {} }) };
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  ['bsi-fisica-comune.js', 'bsi-fis-schrodinger.js', 'bsi-fis-hartreefock.js', 'bsi-fis-rotovib.js', 'bsi-fis-termostat.js',
   'bsi-fis-dinamica.js', 'bsi-fis-matematica.js', 'bsi-fis-cristalli.js', 'bsi-fis-nucleare.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f });
  });
  return ctx.BSIFisica;
}

(async () => {
  const F = carica(), C = F.calcolo;

  console.log('── Schrödinger ──');
  const ho = C.schrodinger.risolvi(x => 0.5 * x * x, -8, 8, 1200, 0.5, 5);
  [0.5, 1.5, 2.5, 3.5, 4.5].forEach((e, n) => vicino('oscillatore armonico E' + n + ' = ' + e, e, ho.E[n], 5e-4));
  const box = C.schrodinger.risolvi(() => 0, -0.5, 0.5, 1200, 0.5, 2);
  vicino('pozzo infinito L = 1: E₁ = π²/2', Math.PI * Math.PI / 2, box.E[0], 1e-4);
  vicino('  · E₂ = 4 E₁', 4 * Math.PI * Math.PI / 2, box.E[1], 1e-3);
  for (const m of ['HCl', 'CO']) {
    const M = C.schrodinger.MOLECOLE[m], n = C.schrodinger.morseNumerico(M, 2);
    vicino('Morse ' + m + ': fondamentale numerica = esatta (cm⁻¹)', C.schrodinger.morseEsatto(M, 1) - C.schrodinger.morseEsatto(M, 0), n.E[1] - n.E[0], 0.5);
  }
  vicino('Morse CO: vicino allo sperimentale 2143,27 cm⁻¹', 2143.27, C.schrodinger.morseEsatto(C.schrodinger.MOLECOLE.CO, 1) - C.schrodinger.morseEsatto(C.schrodinger.MOLECOLE.CO, 0), 2);
  const ev = C.schrodinger.evolutore(x => Math.abs(x) < 0.5 ? 2 : 0, -40, 40, 1600, 0.5, 0.02), pk = C.schrodinger.pacchetto(ev.x, -14, 2.2, Math.sqrt(3));
  for (let i = 0; i < 400; i++) ev.passo(pk.re, pk.im);
  let nn = 0; for (let i = 0; i < ev.x.length; i++) nn += (pk.re[i] ** 2 + pk.im[i] ** 2) * ev.dx;
  vicino('Crank-Nicolson conserva la norma (400 passi)', 1, nn, 1e-9);
  vicino('trasmissione esatta per E = V₀ (1/(1 + V₀a²/2))', 1 / (1 + 2 * 1 / 2), C.schrodinger.trasmissione(2, 2, 1), 1e-9);

  console.log('\n── Hartree-Fock STO-3G ──');
  const H = C.hartreefock;
  const h2 = H.scf(H.MOL.H2.atomi(1.4), 0), hehs = H.scf(H.MOL.HeHs.atomi(1.4632), 1), h2o = H.scf(H.MOL.H2O.atomi(), 0);
  vicino('H₂ a 1,4 bohr (Szabo-Ostlund −1,116714 Eh)', -1.116714, h2.E, 2e-6);
  vicino('HeH⁺ a 1,4632 bohr (Szabo-Ostlund −2,860662 Eh)', -2.860662, hehs.E, 1e-5);
  vicino('H₂O (Crawford −74,942079928 Eh)', -74.942079928192, h2o.E, 1e-6);
  vicino('H₂O: repulsione nucleare 8,002367 Eh', 8.002367, h2o.Enuc, 1e-5);
  att('H₂O: cinque orbitali occupati', 5, h2o.nocc);
  vicino('H₂O: la somma delle cariche di Mulliken è zero', 0, h2o.mulliken.reduce((a, b) => a + b, 0), 1e-8);
  vicino('funzione di Boys F₀(0) = 1', 1, H.boys(0, 0), 1e-12);
  vicino('funzione di Boys F₀(1) = 0,746824', 0.746824132812427, H.boys(0, 1), 1e-10);

  console.log('\n── Rotovibrazionale ──');
  const RV = C.rotovib, hcl = RV.MOLECOLE['H35Cl'];
  vicino('rₑ di HCl dalla costante Bₑ (1,2746 Å)', 1.2746, RV.lunghezza(hcl.mu, hcl.Be), 5e-4);
  const ri = RV.righe(hcl, 298, 20), cb = RV.combinazione(ri.righe);
  vicino('B₀ ricavato dalle righe = B₀ di partenza', RV.Bv(hcl, 0), cb.B0, 2e-3);
  vicino('B₁ ricavato dalle righe = B₁ di partenza', RV.Bv(hcl, 1), cb.B1, 2e-3);
  att('nessuna riga all’origine della banda (ΔJ = 0 proibito)', 0, ri.righe.filter(r => Math.abs(r.nu - ri.nu0) < 1).length);
  att('Raman O₂: solo J dispari', 0, RV.raman(RV.RAMAN.O2, 298, 40).filter(r => r.J % 2 === 0).length);

  console.log('\n── Termodinamica statistica (S° NIST-JANAF, 298,15 K, 1 bar) ──');
  const TS = C.termostat;
  for (const g of ['Ar', 'N2', 'O2', 'CO', 'CO2', 'H2O', 'CH4', 'NH3']) {
    const r = TS.contributi(TS.GAS[g], 298.15);
    vicino('S°(' + g + ') = ' + TS.GAS[g].rif + ' J mol⁻¹ K⁻¹', TS.GAS[g].rif, r.tot.S, g === 'NH3' ? 0.6 : 0.3);
  }
  vicino('Cp(N₂, 298 K) = 29,12 J mol⁻¹ K⁻¹', 29.12, TS.contributi(TS.GAS.N2, 298.15).tot.Cp, 0.05);

  console.log('\n── Dinamica molecolare ──');
  const MD = C.dinamica;
  let S = MD.sistema(196, 0.7, 1.0, 7); for (let i = 0; i < 400; i++) MD.passo(S, 0.005, 1.0);
  const E0 = MD.misure(S).E; let dev = 0;
  for (let i = 0; i < 2000; i++) { MD.passo(S, 0.005, 0); dev = Math.max(dev, Math.abs(MD.misure(S).E - E0)); }
  vicino('senza termostato l’energia per particella si conserva (scarto relativo)', 0, dev / Math.abs(E0), 2e-3);
  const g = MD.rdf(S, 80, 4), picco = g.reduce((a, b) => b.g > a.g ? b : a);
  vicino('primo picco di g(r) al minimo del potenziale (2^1/6 σ)', Math.pow(2, 1 / 6), picco.r, 0.08);
  let St = MD.sistema(144, 0.4, 0.8, 3); for (let i = 0; i < 1500; i++) MD.passo(St, 0.005, 0.8);
  vicino('il termostato porta la temperatura al valore chiesto (T* 0,8)', 0.8, MD.misure(St).T, 0.08);

  console.log('\n── Matematica ──');
  const MT = C.matematica, hk = k => MT.huckel(MT.PI[k]);
  att('Hückel benzene: livelli 2, 1, 1, −1, −1, −2', '2,1,1,-1,-1,-2', hk('benzene').x.map(v => Math.round(v * 1000) / 1000).join(','));
  vicino('  · energia di delocalizzazione 2β', 2, hk('benzene').deloc, 1e-9);
  vicino('Hückel butadiene: delocalizzazione 0,472β', 0.4721, hk('butadiene').deloc, 1e-4);
  vicino('Hückel naftalene: delocalizzazione 3,683β', 3.6832, hk('naftalene').deloc, 1e-4);
  vicino('Hückel ciclobutadiene: delocalizzazione 0 (antiaromatico)', 0, hk('ciclobutadiene').deloc, 1e-9);
  vicino('Hückel anione Cp⁻: delocalizzazione 2,472β', 2.4721, hk('cp').deloc, 1e-4);
  const fd = MT.fid([{ f: 100, A: 1, T2: 0.5 }], 1024, 0.001, 0, 1), sp = MT.spettro(fd, 0.001, 0, 4);
  let ip = 0; sp.y.forEach((v, i) => { if (v > sp.y[ip]) ip = i; });
  vicino('FFT: la riga a 100 Hz cade a 100 Hz', 100, sp.f[ip], 0.5);
  const rk = MT.rk4((t, y) => [-y[0], y[0] - 0.5 * y[1], 0.5 * y[1]], [1, 0, 0], 0, 12, 600), ex = MT.consecutiveEsatta(1, 0.5, 1, 12);
  vicino('RK4 su A → B → C: scarto da [B] esatta', 0, Math.abs(rk.y[600][1] - ex[1]), 1e-9);
  const xs = [273, 298, 308, 318, 328, 338].map(T => 1 / T), ys = [7.87e-7, 3.46e-5, 1.35e-4, 4.98e-4, 1.5e-3, 4.87e-3].map(Math.log), fit = MT.retta(xs, ys);
  vicino('Arrhenius N₂O₅: Eₐ ≈ 103 kJ/mol', 103, -fit.m * 8.314462618 / 1000, 3);

  console.log('\n── Cristallografia (Cu Kα, 1,5406 Å) ──');
  const CR = C.cristalli, pat = k => CR.diffrattogramma(CR.STRUTTURE[k], 1.5406, 90), tt = (k, hkl) => pat(k).find(p => p.hkl === hkl).tt;
  vicino('NaCl (200) a 2θ = 31,70°', 31.70, tt('NaCl', '200'), 0.02);
  vicino('NaCl (220) a 2θ = 45,45°', 45.45, tt('NaCl', '220'), 0.02);
  vicino('Si (111) a 2θ = 28,44°', 28.44, tt('Si', '111'), 0.02);
  vicino('Cu (111) a 2θ = 43,30°', 43.30, tt('Cu', '111'), 0.05);
  vicino('α-Fe (110) a 2θ = 44,67°', 44.67, tt('Fe', '110'), 0.02);
  att('fcc: (100) e (110) estinti', 'true', ['100', '110'].every(h => pat('Cu').find(p => p.hkl === h).Irel < 0.05));
  att('bcc: (100) e (111) estinti', 'true', ['100', '111'].every(h => pat('Fe').find(p => p.hkl === h).Irel < 0.05));
  att('diamante: (200) estinto, al contrario del NaCl', 'true', pat('Si').find(p => p.hkl === '200').Irel < 0.05 && pat('NaCl').find(p => p.hkl === '200').Irel > 50);
  vicino('d(111) cubico a = 5,64 Å', 5.64 / Math.sqrt(3), CR.dSpaziatura('cubico', { a: 5.64 }, 1, 1, 1), 1e-9);

  console.log('\n── Nucleare ──');
  const NU = C.nucleare, mt = NU.CATENE.MoTc, lam = mt.T.map(NU.lambda);
  let best = 0, tb = 0; for (let t = 0; t < 120; t += 0.01) { const a = NU.bateman(lam, mt.ramo, 1, t)[1] * lam[1]; if (a > best) { best = a; tb = t; } }
  vicino('⁹⁹ᵐTc al massimo dopo ln(λ₂/λ₁)/(λ₂ − λ₁) = 22,84 h', 22.84, tb, 0.02);
  const sy = NU.CATENE.SrY, l2 = sy.T.map(NU.lambda), nS = NU.bateman(l2, sy.ramo, 1, 1000);
  vicino('equilibrio secolare ⁹⁰Sr/⁹⁰Y: attività uguali', 1, nS[1] * l2[1] / (nS[0] * l2[0]), 1e-3);
  vicino('¹⁴C: metà del carbonio = 5730 anni', 5730, NU.etaC14(0.5), 1e-6);
  vicino('B/A del ⁵⁶Fe ≈ 8,79 MeV (Weizsäcker)', 8.79, NU.legame(26, 56) / 56, 0.1);
  vicino('valle di stabilità: Z ≈ 26 per A = 56', 26, NU.zStabile(56), 1);

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const SEZ = ['sschrod', 'shf', 'srotovib', 'stermostat', 'sdinmol', 'smatchim', 'scristalli', 'snucleare'];
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') err.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async (SEZ) => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const out = { categoria: !!document.querySelector('.nav-group-tab[data-group="7"]'), pulsanti: 0, sezioni: {} };
      document.querySelector('.nav-group-tab[data-group="7"]').click();
      out.pannello = getComputedStyle(document.getElementById('navGroup7')).display;
      for (const s of SEZ) {
        const b = document.querySelector('#navGroup7 .nav-btn[data-s="' + s + '"]');
        if (!b) { out.sezioni[s] = { manca: true }; continue; }
        out.pulsanti++;
        b.click(); await new Promise(r => setTimeout(r, 1500));
        const sec = document.getElementById(s), schede = sec.querySelectorAll('.bsiFX-schede button');
        let disegnate = 0, tele = 0;
        for (let i = 0; i < schede.length; i++) {
          schede[i].click(); await new Promise(r => setTimeout(r, 1800));
          sec.querySelectorAll('canvas').forEach(c => {
            if (!c.offsetParent) return; tele++;
            const q = c.getContext('2d'), d = q.getImageData(0, 0, c.width, c.height).data; let n = 0;
            for (let k = 0; k < d.length; k += 4 * 97) if (d[k] + d[k + 1] + d[k + 2] > 120) n++;
            if (n > 5) disegnate++;
          });
        }
        out.sezioni[s] = { visibile: sec.offsetHeight > 200, schede: schede.length, tele, disegnate,
                           sborda: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      }
      /* la dinamica molecolare si ferma a sezione chiusa */
      document.querySelector('.nav-btn[data-s="sdinmol"]').click(); await new Promise(r => setTimeout(r, 800));
      const p0 = +(document.querySelector('#sdinmol .bsiFX-nota').textContent.match(/\d+/) || [0])[0];
      document.querySelector('.nav-btn[data-s="snucleare"]').click(); await new Promise(r => setTimeout(r, 1500));
      const p1 = +(document.querySelector('#sdinmol .bsiFX-nota').textContent.match(/\d+/) || [0])[0];
      await new Promise(r => setTimeout(r, 1500));
      const p2 = +(document.querySelector('#sdinmol .bsiFX-nota').textContent.match(/\d+/) || [0])[0];
      out.mdFerma = p2 === p1 && p1 >= p0;
      return out;
    }, SEZ);
    console.log('── ' + nome + ' ──');
    if (nome === 'schermo grande') {
      att('la categoria ⚛️ Fisica c’è', true, r.categoria);
      att('  · e il suo pannello si apre', 'flex', r.pannello);
      att('  · con le otto sezioni', 8, r.pulsanti);
    }
    for (const s of SEZ) {
      const x = r.sezioni[s];
      att(s + ': si apre, ogni scheda disegna', true, !!x && x.visibile && x.tele > 0 && x.disegnate === x.tele);
      if (nome === 'telefono') att('  · a 390 px niente sborda', 0, x.sborda);
    }
    if (nome === 'schermo grande') att('la dinamica molecolare si ferma a sezione chiusa', true, r.mdFerma);
    att('nessun errore JavaScript', 0, err.length);
    err.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
    await ctx.close();
  }

  /* le traduzioni: in inglese i pulsanti cambiano */
  const ctxE = await browser.newContext({ serviceWorkers: 'block' });
  const pgE = await ctxE.newPage();
  await pgE.addInitScript(() => { try { localStorage.setItem('bsi_lang', 'en'); localStorage.setItem('bsi-lingua', 'en'); } catch (e) {} });
  await pgE.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgE.waitForTimeout(5000);
  const tr = await pgE.evaluate(async () => {
    if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en');
    else if (window.BSILingue && window.BSILingue.cambia) window.BSILingue.cambia('en');
    await new Promise(r => setTimeout(r, 1500));
    return { tab: document.querySelector('.nav-group-tab[data-group="7"]').textContent.trim(),
             md: document.querySelector('.nav-btn[data-s="sdinmol"]').textContent.trim() };
  });
  att('in inglese la categoria si chiama «Physics»', '⚛️ Physics', tr.tab);
  att('  · e la dinamica molecolare «Molecular dynamics»', '🎱 Molecular dynamics', tr.md);
  await ctxE.close();
  await browser.close();

  if (eseguiti < 90) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 90'); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
