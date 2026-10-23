#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_approfondimenti — numeri e crittografia, grafi e ottimizzazione,
   gravitazione, calore, modello di Ising, diagrammi di fase, superficie di
   energia potenziale

   PERCHE' QUESTO BANCO ESISTE

   Ogni sezione nuova fa un calcolo che lo studente non puo' controllare a
   occhio. Qui ognuno e' messo davanti a un risultato noto o a un secondo
   metodo indipendente:

   · numeri: π(10⁵) = 9592, il teorema di Bézout, l'inverso modulare del
     manuale RSA (e = 17, φ = 3120 → d = 2753), un messaggio cifrato e
     decifrato, Li(x) contro i valori tabulati;
   · grafi: Dijkstra contro Floyd–Warshall, Kruskal contro Prim, la
     programmazione lineare contro una ricerca a griglia, la discesa del
     gradiente che arriva al minimo;
   · gravitazione: la figura a otto che si richiude, energia e momento
     angolare conservati, i punti di Lagrange Terra–Luna, la fionda che
     conserva v∞ nel sistema del pianeta e cambia la velocita' nel sistema
     del Sole;
   · calore: lo stato stazionario lineare, l'energia conservata con gli
     estremi isolati, il modo fondamentale che decade come e^(−π²αt/L²),
     Newton, le resistenze in serie;
   · Ising: Tc di Onsager, la magnetizzazione simulata contro la formula
     esatta, il disordine sopra Tc, il picco del calore specifico;
   · diagrammi di fase: l'acqua bolle a 373,124 K a 1 atm (IAPWS), il ghiaccio
     secco sublima a 194,7 K, la regola delle fasi, l'eutettico ideale
     benzene–naftalene contro la misura, la regola della leva;
   · superficie LEPS: l'asintoto alla Morse di H₂, la sella simmetrica a
     0,93 Å con barriera 0,42 eV (H₃ ab initio), traiettorie che conservano
     l'energia, reattive sopra soglia e non reattive sotto;
   e nel browser tutte le schede su due schermi.

   USO   node tools/banchi/test_approfondimenti.js    (serve un server su :8899)
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
  ['bsi-fisica-comune.js', 'bsi-mat-numeri.js', 'bsi-mat-grafi.js', 'bsi-fis-gravita.js', 'bsi-fis-calore.js', 'bsi-fis-ising.js', 'bsi-chi-fasi.js', 'bsi-chi-pes.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx.BSIFisica.calcolo;
}

(async () => {
  const K = carica();

  console.log('── Numeri e crittografia ──');
  const N = K.numeri, P5 = N.crivello(100000);
  att('π(100) = 25', 25, N.pigreco(100, P5));
  att('π(10⁵) = 9592', 9592, P5.length);
  att('i primi fino a 30', '2,3,5,7,11,13,17,19,23,29', N.crivello(30).join(','));
  att('MCD(1071, 462) = 21 (l’esempio di Euclide)', 21, N.euclide(1071, 462).mcd);
  att('l’algoritmo di Euclide su 1071, 462 fa 3 divisioni', 3, N.euclide(1071, 462).passi.length);
  const E = N.esteso(240, 46); att('Bézout: 240x + 46y = MCD', E.mcd, 240 * E.x + 46 * E.y);
  att('inverso di 17 modulo 3120 = 2753 (RSA da manuale)', 2753, N.inverso(17, 3120));
  att('3 non ha inverso modulo 12', null, N.inverso(3, 12));
  att('Fermat: 2^(p−1) ≡ 1 (mod 101)', '1', String(N.potenzaMod(2, 100, 101)));
  att('potenza modulare grande: 4^13 mod 497 = 445', '445', String(N.potenzaMod(4, 13, 497)));
  const C = N.rsa(61, 53, 17); att('RSA p = 61, q = 53: n = 3233, φ = 3120, d = 2753', '3233,3120,2753', [C.n, C.phi, C.d].join(','));
  att('RSA: 65 → 2790 (Wikipedia)', '2790', String(N.potenzaMod(65, C.e, C.n)));
  const C2 = N.rsa(1009, 2003); att('RSA: «Ciao, mondo! àè» cifrato e decifrato', 'Ciao, mondo! àè', N.decifra(N.cifra('Ciao, mondo! àè', C2), C2));
  vero('RSA: e·d ≡ 1 (mod φ)', (C2.e * C2.d) % C2.phi === 1);
  vicino('Li(10⁴) = 1245,09 (tabulato)', 1245.09, N.Li(1e4), 0.05);
  vicino('Li(10⁶) = 78626,5 (tabulato)', 78626.5, N.Li(1e6), 0.5);
  vero('Li(x) approssima π(x) meglio di x/ln x a 10⁵', Math.abs(N.Li(1e5) - 9592) < Math.abs(1e5 / Math.log(1e5) - 9592));
  vero('primo: 7919 sì, 7917 no', N.primo(7919) && !N.primo(7917));

  console.log('\n── Grafi e ottimizzazione ──');
  const Gr = K.grafi;
  let tuttiD = true, tuttiK = true;
  for (const seme of [1, 2, 3, 7, 11]) {
    const G = Gr.grafoCasuale(14, seme), n = G.V.length, D = [];
    for (let i = 0; i < n; i++) { D.push(new Array(n).fill(Infinity)); D[i][i] = 0; }
    G.E.forEach(e => { D[e[0]][e[1]] = Math.min(D[e[0]][e[1]], e[2]); D[e[1]][e[0]] = Math.min(D[e[1]][e[0]], e[2]); });
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (D[i][k] + D[k][j] < D[i][j]) D[i][j] = D[i][k] + D[k][j];
    const R = Gr.dijkstra(G, 0, n - 1); if (R.dist[n - 1] !== D[0][n - 1]) tuttiD = false;
    let lung = 0; for (let i = 1; i < R.cammino.length; i++) { const a = R.cammino[i - 1], b = R.cammino[i]; lung += Math.min(...G.E.filter(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a)).map(e => e[2])); }
    if (R.cammino.length && lung !== R.dist[n - 1]) tuttiD = false;
    /* Prim, indipendente */
    const dentro = new Array(n).fill(false); dentro[0] = true; let peso = 0, presi = 1;
    while (presi < n) { let best = null; G.E.forEach(e => { if (dentro[e[0]] !== dentro[e[1]] && (!best || e[2] < best[2])) best = e; }); if (!best) break; dentro[best[0]] = dentro[best[1]] = true; peso += best[2]; presi++; }
    const Kr = Gr.kruskal(G); if (presi === n && (Kr.peso !== peso || Kr.archi.length !== n - 1)) tuttiK = false;
  }
  vero('Dijkstra = Floyd–Warshall su 5 grafi casuali, e il cammino ha la lunghezza dichiarata', tuttiD);
  vero('Kruskal = Prim su 5 grafi casuali (peso e n − 1 archi)', tuttiK);
  const LP = Gr.pl2([30, 50], [[2, 1], [1, 2], [0, 1]], [100, 80, 35]);
  let gz = -1; for (let x = 0; x <= 60; x += 0.05) for (let y = 0; y <= 60; y += 0.05) if (2 * x + y <= 100 + 1e-9 && x + 2 * y <= 80 + 1e-9 && y <= 35 + 1e-9) gz = Math.max(gz, 30 * x + 50 * y);
  vicino('programmazione lineare: il vertice ottimo batte una griglia fitta', gz, LP.ottimo.z, 1);
  vero('programmazione lineare: l’ottimo è un vertice della regione', LP.vertici.some(v => Math.hypot(v[0] - LP.ottimo.x, v[1] - LP.ottimo.y) < 1e-9));
  const d1 = Gr.discesa('rotonda', 0.1, 0, 200), u1 = d1[d1.length - 1]; vicino('discesa sulla ciotola: arriva in (0, 0)', 0, Math.hypot(u1[0], u1[1]), 1e-6);
  const d2 = Gr.discesa('valle', 0.11, 0, 50); vero('discesa: con passo oltre 2/λ_max (0,1) diverge lungo y', Math.abs(d2[d2.length - 1][1]) > 1.5);
  const d3 = Gr.discesa('rosenbrock', 0.0015, 0.9, 6000), u3 = d3[d3.length - 1]; vicino('Rosenbrock con il momento: arriva a (1, 1)', 0, Math.hypot(u3[0] - 1, u3[1] - 1), 0.02);

  console.log('\n── Gravitazione ──');
  const Gv = K.gravita, S8 = Gv.SISTEMI.otto, C8 = S8.crea(), x0 = C8.map(c => [c.x, c.y]), E0 = Gv.energia(C8, 0), L0 = Gv.momentoAngolare(C8);
  const T8 = 6.32591398; for (let i = 0, n = Math.round(T8 / 0.001); i < n; i++) Gv.passoVerlet(C8, 0.001, 0);
  vicino('figura a otto: dopo un periodo i corpi tornano al punto di partenza', 0, Math.max(...C8.map((c, i) => Math.hypot(c.x - x0[i][0], c.y - x0[i][1]))), 1e-3);
  vicino('figura a otto: energia conservata', E0, Gv.energia(C8, 0), 1e-6);
  vicino('figura a otto: momento angolare nullo e conservato', L0, Gv.momentoAngolare(C8), 1e-9);
  const SP = Gv.SISTEMI.pianeti.crea(), Ep = Gv.energia(SP, 0); for (let i = 0; i < 5000; i++) Gv.passoVerlet(SP, 0.002, 0);
  vicino('stella con tre pianeti: energia conservata (relativa 10⁻⁵)', 0, Math.abs(Gv.energia(SP, 0) / Ep - 1), 1e-5);
  const La = Gv.lagrange(0.012150585);
  vicino('L1 Terra–Luna (unità di distanza)', 0.836915, La.L1[0], 1e-4);
  vicino('L2 Terra–Luna', 1.155682, La.L2[0], 1e-4);
  vicino('L3 Terra–Luna', -1.005063, La.L3[0], 1e-4);
  vero('L4 e L5 stabili per Terra–Luna (μ < 0,0385), non per μ = 0,1', La.stabiliL45 && !Gv.lagrange(0.1).stabiliL45);
  const fl = Gv.fionda(1, 1, 0.8, [0.2, 1.3]);
  vicino('fionda: v∞ uguale in entrata e in uscita nel sistema del pianeta', fl.vinfIn, fl.vinfOut, 1e-3);
  vero('fionda: nel sistema del Sole la velocità cambia', Math.abs(fl.vfin - fl.vin) > 0.05);

  console.log('\n── Calore ──');
  const Ca = K.calore;
  let T = new Float64Array(51); for (let k = 0; k < 20000; k++) T = Ca.passo1D(T, 0.4, 'fisso', 100, 0);
  vicino('barra con estremi a 100 e 0 °C: a metà 50 °C', 50, T[25], 1e-6);
  vicino('barra: il profilo stazionario è lineare (a un quarto 75 °C)', 75, T[12.5 | 0] + (T[13] - T[12]) * 0.5, 1e-6);
  let U = new Float64Array(51); for (let i = 0; i < 51; i++) U[i] = i < 25 ? 100 : 0; const media = a => { let s = 0; for (let i = 0; i < 51; i++) s += a[i] * (i === 0 || i === 50 ? 0.5 : 1); return s / 50; }, m0 = media(U);
  for (let k = 0; k < 20000; k++) U = Ca.passo1D(U, 0.4, 'isolato'); vicino('estremi isolati: l’energia si conserva', m0, media(U), 1e-9);
  vicino('estremi isolati: alla fine tutto alla temperatura media', 0, Math.max(...U) - Math.min(...U), 1e-6);
  let Vv = new Float64Array(101); for (let i = 0; i < 101; i++) Vv[i] = Math.sin(Math.PI * i / 100); for (let k = 0; k < 1000; k++) Vv = Ca.passo1D(Vv, 0.4, 'fisso', 0, 0);
  vicino('modo fondamentale: decade come e^(−π² r n / N²)', Math.exp(-Math.PI * Math.PI * 0.4 * 1000 / 1e4), Vv[50], 1e-4);
  let P2 = new Float64Array(30 * 30); for (let i = 0; i < 900; i++) P2[i] = 1; for (let k = 0; k < 5; k++) P2 = Ca.passo2D(P2, 30, 0.24); vero('piastra: bordi a 0, interno che si raffredda dai bordi', P2[0] === 0 && P2[15 * 30 + 15] > 0.99 && P2[30 + 1] < 0.9);
  vicino('Newton: dopo ln2/k la differenza si dimezza', 55, Ca.newton(90, 20, 0.04, Math.LN2 / 0.04), 1e-9);
  const Pa = Ca.parete([['mattone', 0.2, 0.7]], 20, 0, 7.7, 25);
  vicino('parete: R = 1/7,7 + 0,2/0,7 + 1/25 m²K/W', 1 / 7.7 + 0.2 / 0.7 + 1 / 25, Pa.Rt, 1e-12);
  vicino('parete: il profilo arriva alla temperatura esterna', 0, Pa.T[Pa.T.length - 1], 1e-9);
  vero('parete: 8 cm di isolante abbattono U più di 30 cm di mattone in più', Ca.parete([['m', 0.25, 0.7], ['i', 0.08, 0.035]], 20, 0, 7.7, 25).U < Ca.parete([['m', 0.55, 0.7]], 20, 0, 7.7, 25).U / 2);

  console.log('\n── Ising ──');
  const Is = K.ising;
  vicino('Tc = 2/ln(1 + √2) (Onsager)', 2.269185, Is.TC, 1e-6);
  vicino('Onsager: m(T = 2) = 0,9113', 0.91136, Is.onsager(2), 1e-4);
  att('Onsager: m = 0 sopra Tc', 0, Is.onsager(2.5));
  const sc = Is.scansione(32, [1.5, 2.0, 3.5], 300, 800, 5);
  vicino('Metropolis 32×32 a T = 1,5: |m| = Onsager', Is.onsager(1.5), sc[0].m, 0.01);
  vicino('Metropolis 32×32 a T = 2,0: |m| = Onsager', Is.onsager(2.0), sc[1].m, 0.02);
  vero('Metropolis a T = 3,5: disordinato (|m| < 0,1)', sc[2].m < 0.1);
  vicino('energia a T = 1,5 vicina a −2 (stato fondamentale)', -1.95, sc[0].e, 0.02);
  const sc2 = Is.scansione(24, [1.8, 2.3, 3.0], 300, 1500, 9);
  vero('il calore specifico ha il picco vicino a Tc', sc2[1].c > sc2[0].c && sc2[1].c > sc2[2].c);
  const R0 = Is.reticolo(16, false, 1); for (let k = 0; k < 50; k++) Is.sweep(R0, 1.0, 0.5); vicino('campo positivo a bassa T: tutti su', 1, Is.misura(R0, 0.5).m, 1e-9);

  console.log('\n── Diagrammi di fase ──');
  const Fa = K.fasi, Wa = Fa.SOST.acqua, Co = Fa.SOST.co2;
  vicino('acqua: tensione di vapore 101 325 Pa a 373,124 K (IAPWS)', 101325, Wa.vap(373.124), 5);
  vicino('acqua: le tre curve si incontrano al punto triplo', 611.657, Wa.sub(273.16), 0.01);
  vicino('acqua: a 0 °C e 1 atm la fusione (curva) cade a 0,0024 K dal triplo', 101325, Wa.fus(273.1525), 2e4);
  vicino('ghiaccio Ih: il limite a 251,165 K è a 209,9 MPa', 209.9, Wa.fus(251.165) / 1e6, 0.1);
  vicino('CO₂: il ghiaccio secco sublima a 194,686 K a 1 atm', 101325, Co.sub(194.686), 50);
  vicino('CO₂: 3,485 MPa a 0 °C (Span–Wagner)', 3.4851, Co.vap(273.15) / 1e6, 0.002);
  att('fasi: acqua a 25 °C e 1 atm', 'liquido', Fa.fase('acqua', 298.15, 101325));
  att('fasi: acqua a −5 °C e 1 atm', 'solido', Fa.fase('acqua', 268.15, 101325));
  att('fasi: acqua a −5 °C e 100 MPa (il ghiaccio fonde sotto pressione)', 'liquido', Fa.fase('acqua', 268.15, 1e8));
  att('fasi: CO₂ a 20 °C e 1 atm', 'gas', Fa.fase('co2', 293.15, 101325));
  att('fasi: CO₂ a 40 °C e 10 MPa', 'supercritico', Fa.fase('co2', 313.15, 1e7));
  vicino('Clausius–Clapeyron: ΔH_vap dell’acqua a 100 °C ≈ 41 kJ/mol (40,7 misurato; gas ideale)', 41.0, Fa.dHvap('acqua', 373.15) / 1000, 1);
  att('regola delle fasi: punto triplo di una sostanza pura, F = 0', 0, Fa.varianza(1, 3));
  const Eu = Fa.eutettico(Fa.COPPIE.benzna);
  vicino('eutettico ideale benzene–naftalene: T = 269,6 K (misura −3,5 °C)', 269.6, Eu.T, 1);
  vicino('eutettico ideale benzene–naftalene: x = 0,13', 0.13, Eu.x, 0.01);
  const Lv = Fa.leva(Fa.COPPIE.bicd, 0.3, 450); vicino('leva: bilancio di massa fl·x_l = x_B', 0.3, Lv.fl * Lv.xl, 1e-12);
  const cr = Fa.raffreddamento(Fa.COPPIE.bicd, 0.3, 614, 339, 400, 800), Te = Fa.eutettico(Fa.COPPIE.bicd).T;
  vero('curva di raffreddamento: una sosta all’eutettico', cr.filter(p => Math.abs(p[1] - Te) < 1e-6).length > 50);
  vero('curva di raffreddamento: sempre in discesa', cr.every((p, i) => !i || p[1] <= cr[i - 1][1] + 1e-9));

  console.log('\n── Superficie di energia potenziale ──');
  const Pe = K.pes, Se = Pe.sella();
  vicino('LEPS: H lontano da H₂ dà la Morse (−D_e a r_e)', -4.7466, Pe.V(0.7416, 20), 1e-9);
  vicino('LEPS: la superficie è simmetrica', Pe.V(0.8, 1.7), Pe.V(1.7, 0.8), 1e-12);
  vicino('sella simmetrica a r‡ = 0,93 Å (H₃ ab initio 0,930)', 0.930, Se.r, 0.005);
  vicino('barriera 0,42 eV (H₃ ab initio)', 0.42, Se.Ea, 0.01);
  const g = Pe.grad(Se.r, Se.r); vicino('alla sella il gradiente è nullo', 0, Math.hypot(g[0], g[1]), 1e-6);
  vero('la sella è un massimo lungo la reazione e un minimo lungo lo stiramento simmetrico', Pe.V(Se.r + 0.05, Se.r - 0.05) < Se.V && Pe.V(Se.r + 0.05, Se.r + 0.05) > Se.V);
  vicino('quanto vibrazionale di H₂ (Morse): 4144 cm⁻¹, misurato 4161', 4161, (Pe.Evib(1) - Pe.Evib(0)) * 8065.54, 30);
  const tr1 = Pe.traiettoria(0.6, 0, 0.3), tr2 = Pe.traiettoria(0.05, 0, 0.3);
  att('traiettoria sopra soglia: reattiva', 'reattiva', tr1.esito);
  att('traiettoria molto sotto soglia: rimbalza', 'non reattiva', tr2.esito);
  vicino('traiettoria: energia totale conservata', tr1.E0, tr1.Etot, 5e-4);
  const cm = Pe.cammino(), fine = cm[cm.length - 1]; vicino('il cammino di minima energia scende nella valle di H₂ + H', 0.7416, Math.min(fine[2], fine[3]), 0.01);
  vero('Polanyi: a 0,15 eV solo la molecola vibrante reagisce', Pe.probabilita(0.15, 0, 8) === 0 && Pe.probabilita(0.15, 1, 8) > 0);

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const SEZ = [[8, 'smatnumeri', 5], [8, 'smatgrafi', 4], [7, 'sfisgrav', 3], [7, 'sfiscalore', 4], [7, 'sfisising', 3], [4, 'schifasi', 3], [4, 'schipes', 3]];
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
      /* RSA nel browser: il messaggio torna uguale */
      document.querySelector('.nav-group-tab[data-group="8"]').click(); document.querySelector('.nav-btn[data-s="smatnumeri"]').click(); await pausa(400);
      const sn = document.getElementById('smatnumeri'); sn.querySelectorAll('.bsiFX-schede button')[3].click(); await pausa(600);
      const pn = [...sn.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent); out.rsa = /2753|decifrat|decrypt/i.test(pn.textContent);
      /* la piastra si scalda dove si tocca */
      document.querySelector('.nav-group-tab[data-group="7"]').click(); document.querySelector('.nav-btn[data-s="sfiscalore"]').click(); await pausa(400);
      const sc = document.getElementById('sfiscalore'); sc.querySelectorAll('.bsiFX-schede button')[1].click(); await pausa(600);
      const pc = [...sc.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), cv = pc.querySelector('canvas'), rc = cv.getBoundingClientRect();
      cv.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 5, clientX: rc.left + rc.width * 0.2, clientY: rc.top + rc.height * 0.2, bubbles: true })); await pausa(2500);
      const q = cv.getContext('2d'), w = cv.width, h = cv.height, lum = (x, y) => { const d = q.getImageData(Math.round(x * w), Math.round(y * h), 1, 1).data; return d[0] + d[1]; };
      out.piastra = lum(0.2, 0.22) > lum(0.8, 0.8) + 60;
      /* il Monte Carlo di Ising gira: il reticolo cambia */
      document.querySelector('.nav-btn[data-s="sfisising"]').click(); await pausa(400);
      const si = document.getElementById('sfisising'); si.querySelectorAll('.bsiFX-schede button')[0].click(); await pausa(500);
      const ci = [...si.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent).querySelector('canvas'), a1 = ci.toDataURL(); await pausa(800); out.ising = ci.toDataURL() !== a1;
      out.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return out;
    }, SEZ);
    console.log('── ' + nome + ' ──');
    for (const [, s, n] of SEZ) { const x = r2[s]; vero(s + ': ' + n + ' schede piene, nessun avviso, le tele disegnano e hanno un nome', x && !x.manca && x.schede === n && x.piene === n && x.avvisi === 0 && x.disegnate === x.tele && x.tele > 0 && x.etichette); }
    if (nome === 'schermo grande') { vero('RSA: la chiave privata d = 2753 è mostrata', r2.rsa); vero('la piastra si scalda dove si tocca', r2.piastra); vero('il reticolo di Ising evolve', r2.ising); }
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
  const tr = await pgE.evaluate(async () => { if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en'); await new Promise(r => setTimeout(r, 1500)); return ['smatnumeri', 'sfisising', 'schipes'].map(s => document.querySelector('.nav-btn[data-s="' + s + '"]').textContent.trim()); });
  att('in inglese: i nomi delle sezioni', '🔐 Numbers and cryptography|🧲 Ising model|🏔️ Potential energy surface', tr.join('|'));
  await ctxE.close();
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
