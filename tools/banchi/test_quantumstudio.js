#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_quantumstudio — 🌌 BioSpec Quantum Studio (v265)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto «un unico sistema olografico integrato» per tutte le
   aree, al massimo livello. La proposta arrivava con three.js da una CDN e
   grafici decorativi; qui tutto gira sul motore locale e i grafici vengono
   da modelli calcolati. Si pretende che quei modelli diano i numeri giusti
   e che la pagina li mostri davvero:

   · 13 aree, 16 moduli, ognuno con equazione, teoria, focus d'esame, una
     domanda e cursori con minimo/massimo coerenti;
   · Morse dell'H₂ (minimo −458 kJ/mol a 74 pm); carattere ionico 1 − e^(−Δχ²/4);
   · NMR: ν₀ = 42,577·B₀, J in ppm = J/ν₀ (più stretto a campo alto), CH₂
     quartetto 1:3:3:1, CH₃ tripletto;
   · dose–risposta: EC₅₀′ = EC₅₀(1 + [B]/K_B), rapporto di dose giusto;
   · PCA vera: autovalori ordinati, somma = traccia = n. variabili (dati
     autoscalati), più separazione → più varianza su PC1;
   · HPLC: N piatti, risoluzione cresce con √N, u ottimo = √(B/C);
   · PES: reagente e prodotto minimi, sella massima sul cammino, Eyring
     accelera con T;
   · Hodgkin–Huxley: spara con g_Na pieno, non spara con g_Na = 0
     (tetrodotossina); E_K dalla Nernst sale con [K⁺]ₑ;
   · Rabi: a risonanza P₁ tocca 1 (impulso π), fuori risonanza < 1; Bloch
     resta unitario; n-cubi: 2ⁿ vertici, n·2ⁿ⁻¹ spigoli, tesseratto 16/32/24;
   · Calabi–Yau: ogni punto disegnato soddisfa z₁ⁿ + z₂ⁿ = 1; quintica
     χ = −200; Gibbs: ΔG = ΔH − TΔS, T* = ΔH/ΔS, segno di spontaneità.
   Poi la pagina, sul telefono: le 13 aree e i 16 moduli, ognuno disegna in
   3D con il grafico vivo e la telemetria; il ponte SPECTRA_3D_BRIDGE apre un
   modulo, imposta un parametro e cambia rappresentazione; lo strumento di
   Spectra «quantum_studio»; nessun errore, non sborda.

   USO   node tools/banchi/test_quantumstudio.js   (serve un server su :8899)
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
const vicino = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON, Float32Array }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-quantum-studio-dati.js'), 'utf8'), ctx);
  const Q = ctx.BSIQuantumDati;
  console.log('── Il catalogo ──');
  att('13 aree', 13, Q.AREE.length);
  att('16 moduli', 16, Q.moduli().length);
  vero('ogni modulo ha motore, equazione, badge, ≥ 1 rappresentazione, ≥ 2 cursori con min < max, teoria completa in due lingue', Q.moduli().every(m => m.motore && m.eq && m.badge.length === 2 && (m.rappr || []).length >= 1 && m.sliders.length >= 2 && m.sliders.every(s => s.min < s.max && s.val >= s.min && s.val <= s.max && s.label.length === 2) && m.teoria.core.length === 2 && m.teoria.punti.length >= 1 && m.teoria.esame.length === 2));
  vero('ogni modulo ha almeno una domanda del professore con risposta', Q.moduli().every(m => (m.teoria.domande || []).length >= 1 && m.teoria.domande.every(d => d.q.length === 2 && d.a.length === 2)));
  vero('la 13ª area è la fisica quantistica (Hilbert, n-cubi, Calabi–Yau)', /quantistica|Hilbert/.test(JSON.stringify(Q.AREE[11])) && Q.perId('qm_qubit') && Q.perId('hyper_ncubo') && Q.perId('string_cy'));

  console.log('\n── I modelli ──');
  att('Morse dell\'H₂: minimo −458 kJ/mol a rₑ = 74 pm', '-458 0', Math.round(Q.morse(74.1)) + ' ' + Math.round(Q.morse(1e4)));
  vero('carattere ionico cresce con Δχ (0 → 0, Δχ=1,7 ≈ 51 %)', vicino(Q.carattereIonico(0), 0) && vicino(Q.carattereIonico(1.7), 0.513, 0.02));
  { const n = Q.nmr(11.74, 7); att('NMR a 11,74 T: ν₀ = 500 MHz', 500, Math.round(n.nu0));
    const n9 = Q.nmr(9.4, 7); vero('J in ppm più stretto a campo alto (9,4 T vs 11,74 T)', 7 / n9.nu0 > 7 / n.nu0);
    const ch2 = n.righe.filter(r => r.gruppo === 'CH₂'); vero('CH₂ quartetto 1:3:3:1 (4 righe)', ch2.length === 4 && vicino(ch2[1].I / ch2[0].I, 3, 0.01));
    const ch3 = n.righe.filter(r => r.gruppo === 'CH₃'); vero('CH₃ tripletto 1:2:1 (3 righe)', ch3.length === 3 && vicino(ch3[1].I / ch3[0].I, 2, 0.01)); }
  { const r0 = Q.doseRisposta(-8, 0), r = Q.doseRisposta(-8, 18); att('dose–risposta: antagonista 18 nM (K_B 2) → rapporto di dose 10', 10, Math.round(r.DR)); vero('Eₘₐₓ invariata, EC₅₀ spostata a destra', r.EC50 > r0.EC50 && vicino(Q.doseRisposta(-3, 0).E, Q.doseRisposta(-3, 18).E, 0.02)); }
  { const p = Q.pca(Q.generaDati(0.65, 0.1, 7).X); vero('PCA: autovalori decrescenti, Σλ = traccia = 10 (autoscalati)', p.autovalori.every((v, i) => i === 0 || v <= p.autovalori[i - 1] + 1e-9) && vicino(p.traccia, 10, 1e-6) && vicino(p.spiegata.reduce((a, b) => a + b, 0), 1, 1e-9));
    const alta = Q.pca(Q.generaDati(1, 0.1, 7).X), bassa = Q.pca(Q.generaDati(0.2, 0.1, 7).X); vero('più separazione → più varianza su PC1 (' + Math.round(alta.spiegata[0] * 100) + '% vs ' + Math.round(bassa.spiegata[0] * 100) + '%)', alta.spiegata[0] > bassa.spiegata[0]); }
  { const h = Q.hplc(1, 0.5); vero('HPLC: N > 10 000 piatti, 3 picchi in ordine, 2 risoluzioni', h.N > 10000 && h.picchi.length === 3 && h.picchi[0].tR < h.picchi[1].tR && h.picchi[1].tR < h.picchi[2].tR && h.Rs.length === 2);
    const h2 = Q.hplc(0.5, 0.5); vero('risoluzione cresce con √N: dimezzando il flusso (più piatti) Rs sale', h2.Rs[0] > h.Rs[0] && h2.N > h.N);
    vero('u ottimo = √(B/C) minimizza H', h.H_di(h.uOtt) <= h.H_di(h.uOtt * 1.5) + 1e-9 && h.H_di(h.uOtt) <= h.H_di(h.uOtt * 0.6) + 1e-9); }
  { const p = Q.pesPunti(); vero('PES: reagente e prodotto a energia più bassa della sella (Eₐ > 0), prodotto più in basso del reagente', p.sella[1] > p.reagente[1] && p.sella[1] > p.prodotto[1] && p.Ea > 0 && p.dE < 0);
    vero('Eyring accelera con la temperatura', Q.eyring(350, p.Ea) > Q.eyring(298, p.Ea)); }
  { let s = Q.hhNuovo(4, 1); for (let i = 0; i < 12000; i++) Q.hhPasso(s, 0.01, Q.stimolo(s.t)); const spariNa = s.spari;
    let s0 = Q.hhNuovo(4, 0); for (let i = 0; i < 12000; i++) Q.hhPasso(s0, 0.01, Q.stimolo(s0.t));
    vero('Hodgkin–Huxley: spara con g_Na pieno (' + spariNa + '), tace con g_Na = 0 (tetrodotossina)', spariNa >= 3 && s0.spari === 0);
    vero('E_K dalla Nernst sale con [K⁺]ₑ (4 → 10 mM)', Q.nernstK(10) > Q.nernstK(4) && Q.nernstK(4) < -70 && Q.nernstK(4) > -85); }
  { const r = Q.rabi(1, 0, Math.PI); vero('Rabi a risonanza: impulso π porta P₁ ≈ 1, Bloch a |1⟩', vicino(r.P1, 1, 1e-6) && vicino(r.bloch[2], -1, 1e-6));
    vero('fuori risonanza P₁ < 1 e il vettore di Bloch resta unitario', Q.rabi(1, 2, 100).P1 < 0.5 && vicino(Math.hypot(...Q.rabi(1, 1.3, 7).bloch), 1, 1e-9)); }
  { const c = Q.ncubo(4); att('tesseratto: 16 vertici, 32 spigoli, 24 facce quadrate', '16 32 24', c.V.length + ' ' + c.E.length + ' ' + c.facce2);
    const c5 = Q.ncubo(5); att('5-cubo: 32 vertici, 80 spigoli', '32 80', c5.V.length + ' ' + c5.E.length);
    const pr = Q.proietta([1, 1, 1, 1], 0, 3); vero('proiezione R⁴ → R³ dà tre coordinate finite', pr.length === 3 && pr.every(x => isFinite(x))); }
  { let m = 0; for (let k1 = 0; k1 < 5; k1++) for (let k2 = 0; k2 < 5; k2++) for (let a = -1; a <= 1; a += 0.25) for (let b = 0; b <= Math.PI / 2; b += 0.25) m = Math.max(m, Q.residuoCY(Q.calabiYau(5, k1, k2, a, b), 5));
    vero('Calabi–Yau: ogni punto della sezione soddisfa z₁⁵ + z₂⁵ = 1 (residuo max ' + m.toExponential(1) + ')', m < 1e-9); }
  { const g0 = Q.gibbs(298, -40, -100); att('Gibbs: ΔH −40, ΔS −100 → ΔG(298) = −10,2 kJ/mol, T* = 400 K', '-10.2 400', g0.dG.toFixed(1) + ' ' + Math.round(g0.Tstar));
    vero('spontanea sotto T*, non spontanea sopra', Q.gibbs(350, -40, -100).dG < 0 && Q.gibbs(450, -40, -100).dG > 0 && vicino(Q.gibbs(298, -40, -100).K, Math.exp(10200 / (8.314462618 * 298)), 1)); }
  { vero('paracetamolo: la linea di trattamento dimezza ogni 4 h (150 a 4 h, 75 a 8 h)', vicino(Q.lineaTrattamento(4), 150) && vicino(Q.lineaTrattamento(8), 75));
    vero('sopra la linea → rischio; una curva alta sta sopra, una bassa sotto', Q.paracetamolo(300, 4, 4).sopra && !Q.paracetamolo(80, 4, 4).sopra); }

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIQuantumStudio && window.BSIQuantumDati && window.SPECTRA_3D_BRIDGE && window.BSISpectraLive && window.BSILab3D), null, { timeout: 60000 });
  vero('il pulsante «Quantum Studio» è nella barra', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="squantum"]')));
  vero('16 motori registrati', await pg.evaluate(() => Object.keys(window.BSIQuantumStudio.MOTORI).length) === 16);
  vero('Spectra ha lo strumento quantum_studio e il ponte SPECTRA_3D_BRIDGE', await pg.evaluate(() => (window.BSI_AI_TOOLS || []).some(t => t.name === 'quantum_studio') && typeof window.SPECTRA_3D_BRIDGE.apri === 'function' && typeof window.SPECTRA_3D_BRIDGE.openSection === 'function'));
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = { m: [] };
    const pix = S => { S.disegna(); const c = document.createElement('canvas'); c.width = 80; c.height = 110; const q = c.getContext('2d'); q.drawImage(S.ren.domElement, 0, 0, 80, 110); const d = q.getImageData(0, 0, 80, 110).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 150) n++; return n; };
    const vivo = cv => { const q = cv.getContext('2d'), d = q.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] > 300) n++; return n; };
    BSISpectraLive.calcolo.apriSezione('squantum'); await P(900);
    o.aree = document.querySelectorAll('#squantum .bsiQS-chips[role="tablist"] button').length;
    for (const m of BSIQuantumDati.moduli()) {
      window.SPECTRA_3D_BRIDGE.apri(m.id); await P(700); const tp = document.querySelector('#squantum [role="tabpanel"]'); const api = tp._qs;
      for (let i = 0; i < 40 && !api.pronto; i++) await P(150);
      api.S.box.scrollIntoView({ block: 'center' }); await P(1100);
      const cv = api.S.box.querySelector('.bsiQS-vivo');
      o.m.push({ id: m.id, px: pix(api.S), chart: vivo(cv), tel: document.querySelectorAll('#squantum .bsiQS-tel div').length });
    }
    /* il ponte: apri un modulo, imposta un parametro, cambia rappresentazione */
    window.SPECTRA_3D_BRIDGE.apri('bio_atp'); await P(500); const i1 = window.SPECTRA_3D_BRIDGE.imposta('uncoupler', 80); await P(400); const st = window.SPECTRA_3D_BRIDGE.stato();
    const i2 = window.SPECTRA_3D_BRIDGE.rappresentazione('schema'); await P(400);
    const alias = window.SPECTRA_3D_BRIDGE.openSection('quantistica', 2); await P(500); const modDopo = document.querySelector('#squantum [role="tabpanel"]')._qs.modulo;
    const tool = await (window.BSI_AI_TOOLS.find(t => t.name === 'quantum_studio')).execute({ modulo: 'thermo_gibbs', parametro: 'tempK', valore: 500 }); await P(600);
    o.bridge = { imposta: i1, stato: !!(st && st.tele && st.tele.length), rappr: i2, alias: alias && modDopo, tool: tool.ok && /Gibbs/.test(tool.aperto), modDopo };
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o;
  });
  att('13 aree nella barra', 13, r.aree);
  r.m.forEach(m => vero(m.id + ': disegna in 3D (' + m.px + ' px), grafico vivo (' + m.chart + '), telemetria (' + m.tel + ' voci)', m.px > 15 && m.chart > 200 && m.tel >= 4));
  vero('il ponte imposta un parametro e dà lo stato', r.bridge.imposta === true && r.bridge.stato);
  vero('il ponte cambia rappresentazione e apre un\'area con l\'alias openSection (' + r.bridge.modDopo + ')', r.bridge.rappr === true && r.bridge.alias === 'string_cy');
  vero('lo strumento quantum_studio apre il modulo chiesto', r.bridge.tool);
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 4).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
