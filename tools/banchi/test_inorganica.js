#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_inorganica — ⚗️ Inorganica quantistica (v268)

   PERCHE' QUESTO BANCO ESISTE
   L'autore studia Inorganica II: le tracce d'esame chiedono numeri, non
   disegni. Qui si pretende che i quattro solutori diano i risultati dei
   testi, senza browser:
   · SLATER (regole standard 1930): σ, ζ, n*; per il boro 2p σ = 2,40,
     ζ = 2,60; sodio 3s σ = 8,80, ζ = 2,20; per lo xeno il 4f resta VUOTO
     (gli elettroni vanno su 5s5p). |Y_lm|²: il massimo del 2p_z è a θ = 0°,
     il d_z² ha i coni nodali a 54,7° e 125,3°.
   · HÜCKEL (determinante secolare, diagonalizzazione esatta): allile α±√2β,
     benzene α±2β e α±β doppi con E_deloc = 2β, butadiene E_deloc = 0,472β,
     ciclobutadiene E_deloc = 0 (diradicale), ciclopropenile⁺ E_deloc = 2β;
     autovettori normalizzati (∑c² = 1).
   · SALC con soglia: più alza la soglia ΔE, più interazioni passano; i
     conteggi OA sono coerenti (9 + 4·n_leganti).
   · COMPLESSI (VBT+CFT+LFT): [FeCl₄]⁻ d⁵ Td alto spin μ = 5,92, CFSE = 0;
     [IrCl₆]²⁻ d⁵ basso spin μ = 1,73, CFSE = −2Δ; [Ni(NH₃)₆]²⁺ d⁸ μ = 2,83;
     [Ni(CN)₄]²⁻ planare quadrata diamagnetica; [Ni(CO)₄] EAN 36; Jahn–Teller
     forte per d⁹, debole per t₂g asimmetrico.
   Poi la pagina, sul telefono: le quattro schede disegnano con il report
   numerico, il cursore della soglia SALC cambia i conti, lo strumento di
   Spectra calcola. Nessun errore.

   USO   node tools/banchi/test_inorganica.js   (serve un server su :8899)
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
const vic = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);

(async () => {
  const ctx = { Math, Object, Array, String, Number, isFinite, JSON }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-inorganica-quantum-dati.js'), 'utf8'), ctx);
  const I = ctx.BSIInorganicaDati;

  console.log('── Slater ──');
  { const b = I.slater(5), na = I.slater(11), f = I.slater(9); att('boro 2p: σ = 2,40, ζ = 2,60', '2.4 2.6', b.sigma + ' ' + b.zeta);
    att('sodio 3s: σ = 8,80, ζ = 2,20', '8.8 2.2', na.sigma + ' ' + na.zeta);
    att('fluoro 2p: σ = 3,80, ζ = 5,20', '3.8 5.2', f.sigma + ' ' + f.zeta); }
  { const xe = I.slater(54), i = I.slater(53); vero('xeno e iodio: 4f VUOTO, valenza 5s5p (ζ_Xe = ' + xe.zeta + ', ζ_I = ' + i.zeta + ')', xe.gruppo === '5s5p' && i.gruppo === '5s5p' && xe.n === 5 && vic(xe.zeta, 8.25, 0.01)); }
  { const fe = I.slater(26), fe3d = I.slater(26, I.occupazione(26).findIndex(gpp => gpp.et === '3d')); vero('ferro neutro: valenza 4s4p (ζ_4s ≈ ' + fe.zeta + '); l\'elettrone 3d è molto meno schermato (ζ_3d ≈ ' + fe3d.zeta + ')', fe.gruppo === '4s4p' && fe.zeta > 3 && fe.zeta < 5 && fe3d.gruppo === '3d' && fe3d.zeta > 6 && fe3d.zeta < 7); }
  { const pz = I.angolo('pz'), dz2 = I.angolo('dz2'), px = I.angolo('px');
    att('|Y|² del 2p_z: massimo a θ = 0°, piano nodale a 90°', '0 90', pz.thetaMax + ' ' + pz.nodi[0]);
    vero('d_z²: coni nodali a 54,7° e 125,3°', vic(dz2.nodi[0], 54.7356, 0.01) && vic(dz2.nodi[1], 125.2644, 0.01));
    att('2p_x: massimo a θ = 90°', 90, px.thetaMax); }
  vero('raggio più probabile r_mp = n*²/ζ (idrogenoide)', vic(I.elemento('B').rmp_a0, 4 / I.slater(5).zeta, 1e-2));

  console.log('\n── Hückel ──');
  { const a = I.huckel(I.HUCKEL.allile); att('allile: E = α + √2β, α, α − √2β', '1.4142 0 -1.4142', a.orbitali.map(o => o.x).join(' ')); }
  { const bz = I.huckel(I.HUCKEL.benzene); att('benzene: α ± 2β, α ± β (×2); E_deloc = 2β', '2,1,1,-1,-1,-2 2', bz.orbitali.map(o => o.x).join(',') + ' ' + bz.deloc_coeffBeta);
    vero('autovettori normalizzati (∑c² = 1, coefficienti a 4 cifre)', bz.orbitali.every(o => vic(o.coeff.reduce((s, c) => s + c * c, 0), 1, 2e-3))); }
  att('butadiene: E_deloc = 0,472β', 0.472, I.huckel(I.HUCKEL.butadiene).deloc_coeffBeta);
  att('ciclobutadiene: E_deloc = 0 (diradicale, 2 MO a α)', '0 2', I.huckel(I.HUCKEL.ciclobutadiene).deloc_coeffBeta + ' ' + I.huckel(I.HUCKEL.ciclobutadiene).orbitali.filter(o => Math.abs(o.x) < 1e-6).length);
  att('ciclopropenile⁺: E_deloc = 2β (aromatico, 2 e⁻)', 2, I.huckel(I.HUCKEL.ciclopropenile).deloc_coeffBeta);
  { const li = I.huckel(I.HUCKEL.LiH); vero('LiH eteronucleare: diagonale α diversa (autovalori asimmetrici)', li.orbitali.length === 2 && Math.abs(li.orbitali[0].x) !== Math.abs(li.orbitali[1].x) || li.orbitali[0].coeff[0] !== li.orbitali[0].coeff[1]); }

  console.log('\n── SALC con soglia ──');
  { const a = I.salc('XeOF4', 15, 15), b = I.salc('XeOF4', 30, 30); vero('XeOF₄: OA totali = 9 + 4·O + 16·F... = ' + a.oaTot + '; soglia più alta ⇒ più interazioni (' + a.attiveSigma + ' → ' + b.attiveSigma + ')', a.oaTot === 29 && b.attiveSigma >= a.attiveSigma && b.attivePi >= a.attivePi);
    vero('con soglia 0 nessuna interazione passa; con soglia enorme tutte', I.salc('XeOF4', 0, 0).attiveSigma === 0 && I.salc('XeOF4', 999, 999).attiveSigma === I.salc('XeOF4', 999, 999).interazioni.length); }
  att('otto molecole ipervalenti/interalogene', 'XeOF4,IOF5,XeF4,SF4,BrF3,SO2,SO3,I3', Object.keys(I.MOLECOLE).join(','));
  vero('ogni molecola: conteggio coerente OL + AL + non-legame = OA totali', Object.keys(I.MOLECOLE).every(k => { const s = I.salc(k); return s.OL + s.AL + s.NL === s.oaTot; }));

  console.log('\n── Complessi (VBT + CFT + LFT) ──');
  { const fe = I.complesso('FeCl4-'); att('[FeCl₄]⁻ d⁵ Td alto spin: 5 spaiati, μ = 5,92, CFSE = 0', '5 5.92 0', fe.spaiati + ' ' + fe.mu_BM + ' ' + fe.cfse_Delta); }
  { const ir = I.complesso('IrCl6-2'); att('[IrCl₆]²⁻ d⁵ Oh basso spin: 1 spaiato, μ = 1,73, CFSE = −2Δ', '1 1.73 -2', ir.spaiati + ' ' + ir.mu_BM + ' ' + ir.cfse_Delta); }
  { const ni = I.complesso('Ni(NH3)6-2'); att('[Ni(NH₃)₆]²⁺ d⁸ Oh: 2 spaiati, μ = 2,83, CFSE = −1,2Δ', '2 2.83 -1.2', ni.spaiati + ' ' + ni.mu_BM + ' ' + ni.cfse_Delta); }
  { const nicn = I.complesso('Ni(CN)4-2'); vero('[Ni(CN)₄]²⁻ planare quadrata: diamagnetica (0 spaiati, μ = 0)', nicn.spaiati === 0 && nicn.mu_BM === 0 && nicn.geom === 'D4h'); }
  { const mn = I.complesso('MnF6-4'); att('[MnF₆]⁴⁻ d⁵ alto spin: CFSE 0, μ 5,92, nessun Jahn–Teller (t₂g³eg²)', '0 5.92 no', mn.cfse_Delta + ' ' + mn.mu_BM + ' ' + mn.jahnTeller); }
  { const co = I.complesso('Ni(CO)4'), ag = I.complesso('Ag(CN)2-'); att('[Ni(CO)₄] EAN 36 (18 e⁻), [Ag(CN)₂]⁻ EAN 50, entrambi diamagnetici', '36 50 0 0', co.EAN + ' ' + ag.EAN + ' ' + co.spaiati + ' ' + ag.spaiati); }
  vero('μ = √(n(n+2)) coerente per ogni complesso', Object.keys(I.COMPLESSI).every(k => { const c = I.complesso(k); return vic(c.mu_BM, Math.sqrt(c.spaiati * (c.spaiati + 2)), 0.01); }));
  { /* Jahn–Teller dall'occupazione: d⁹ forte, d⁵ alto spin no */
    const jtD9 = I.jahnTeller(3, 3), jtHS5 = I.jahnTeller(3, 2), jtT2g5 = I.jahnTeller(5, 0);
    att('Jahn–Teller: d⁹ (eg³) forte, d⁵ alto spin (eg²) no, t₂g⁵ debole', 'forte no debole', jtD9.split(' ')[0] + ' ' + jtHS5 + ' ' + jtT2g5.split(' ')[0]); }

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); localStorage.setItem('bsi-risoluzione', 'ultra'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIInorganica && window.BSIInorganicaDati && window.BSISpectraLive && window.BSILab3D), null, { timeout: 60000 });
  vero('il pulsante «Inorganica quantistica» è nella barra', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="sinorganica"]')));
  vero('Spectra ha lo strumento inorganica_quantica', await pg.evaluate(() => (window.BSI_AI_TOOLS || []).some(t => t.name === 'inorganica_quantica')));
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = { schede: [] };
    const pix = S => { S.disegna(); const c = document.createElement('canvas'); c.width = 80; c.height = 110; const q = c.getContext('2d'); q.drawImage(S.ren.domElement, 0, 0, 80, 110); const d = q.getImageData(0, 0, 80, 110).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 150) n++; return n; };
    BSISpectraLive.calcolo.apriSezione('sinorganica'); await P(900);
    const bar = document.querySelector('#sinorganica .bsiFX-schede'); o.nTab = bar.children.length;
    for (let k = 0; k < 4; k++) { bar.children[k].click(); await P(1400); const pan = document.querySelector('#sinorganica [role="tabpanel"]:not([style*="none"])'); const api = pan._iq; for (let i = 0; i < 40 && !(api && api.pronto); i++) await P(150);
      pan.querySelector('.bsiIQ-palco').scrollIntoView({ block: 'center' }); await P(700);
      o.schede.push({ px: api && api.S ? pix(api.S) : 0, rep: pan.querySelector('.bsiIQ-rep').textContent.length, grid: pan.querySelectorAll('.bsiIQ-grid b').length }); }
    /* il cursore della soglia SALC cambia il report */
    const barS = document.querySelector('#sinorganica .bsiFX-schede'); barS.children[2].click(); await P(1200);
    const panS = document.querySelector('#sinorganica [role="tabpanel"]:not([style*="none"])'), rng = panS.querySelector('input[type=range]');
    rng.value = '8'; rng.dispatchEvent(new Event('input')); await P(500); const bassa = panS.querySelectorAll('.bsiIQ-tab .on').length;
    rng.value = '40'; rng.dispatchEvent(new Event('input')); await P(500); const alta = panS.querySelectorAll('.bsiIQ-tab .on').length;
    o.soglia = { bassa, alta };
    /* lo strumento di Spectra */
    const tool = await (window.BSI_AI_TOOLS.find(t => t.name === 'inorganica_quantica')).execute({ scheda: 'complessi', complesso: 'IrCl6-2' }); await P(400);
    o.tool = tool.ok && tool.risultato && tool.risultato.spaiati === 1 && Math.abs(tool.risultato.mu - 1.73) < 0.01;
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o;
  });
  att('quattro schede', 4, r.nTab);
  const nomi = ['Slater', 'Hückel', 'SALC', 'Complessi'];
  r.schede.forEach((s, i) => vero(nomi[i] + ': disegna in 3D (' + s.px + ' px) con il report numerico (' + s.grid + ' valori, ' + s.rep + ' caratteri)', s.px > 60 && s.grid >= 4 && s.rep > 120));
  vero('il cursore della soglia SALC cambia le interazioni attive (' + r.soglia.bassa + ' con 8 eV → ' + r.soglia.alta + ' con 40 eV)', r.soglia.alta > r.soglia.bassa);
  vero('lo strumento di Spectra calcola [IrCl₆]²⁻ (μ = 1,73, 1 spaiato)', r.tool);
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 4).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
