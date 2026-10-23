#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_laboratori — meccanica, onde e ottica, circuiti, termodinamica,
   metodi numerici, geometria analitica, equilibrio chimico

   PERCHE' QUESTO BANCO ESISTE

   Una simulazione si puo' sbagliare in un modo che non si vede: la palla
   vola, il pendolo oscilla, il grafico e' bello, e il numero e' falso. Ogni
   laboratorio qui viene messo davanti al caso in cui esiste la risposta
   esatta, e deve trovarla:

   · il proiettile con k = 0 ritrova v₀² sin 2θ / g, e con l'aria l'angolo
     ottimo scende sotto 45°; negli urti la quantita' di moto si conserva e
     l'energia persa e' ½μ(1 − e²)v_rel²; il periodo del pendolo a 90° e'
     1,18034 volte quello delle piccole oscillazioni (integrale ellittico);
     i modi normali sono √(k/m) e √((k+2k_c)/m);
   · la lente ritrova i punti coniugati, la diffrazione l'inviluppo
     (sin β/β)² sul massimo di ordine 1;
   · i transitori RLC soddisfano la legge di Kirchhoff (L di/dt + Ri + v_C =
     E) nei tre regimi; il passa-basso e' a −3,01 dB e −45° al taglio;
   · nei cicli ΔU = 0 e ΔS = 0 e il rendimento dal bilancio coincide con la
     formula (Carnot, Otto, Diesel, Stirling); il gas di dischi conserva
     l'energia, ha la velocita' media di Maxwell-Boltzmann e la pressione
     del gas di dischi duri (sviluppo del viriale);
   · i metodi numerici hanno gli ordini dei libri (Newton 2, secanti 1,6,
     trapezi 2, Simpson 4, Eulero 1, Heun 2, RK4 4) e il fenomeno di Runge;
   · le coniche hanno centro, semiassi e fuochi giusti; le rette sghembe la
     distanza giusta;
   · l'equilibrio raggiunto dalla cinetica coincide con quello calcolato,
     l'esterificazione con K = 4 da' 2/3, e Le Chatelier va nel verso
     giusto: piu' reagente → piu' prodotto; volume dimezzato → Haber verso
     NH₃; scaldando una reazione esotermica K diminuisce.

   USO   node tools/banchi/test_laboratori.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright-core');

const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MINIMO = 110;

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
  ctx.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({ style: {} }), querySelector: () => null, querySelectorAll: () => [] };
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  ['bsi-fisica-comune.js', 'bsi-mat-cas.js', 'bsi-fis-meccanica.js', 'bsi-fis-onde.js', 'bsi-fis-circuiti.js', 'bsi-fis-termo.js', 'bsi-mat-numerici.js', 'bsi-mat-geometria.js', 'bsi-chi-equilibrio.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx.BSIFisica.calcolo;
}

(async () => {
  const K = carica(), g = 9.80665;

  console.log('── Meccanica ──');
  const M = K.meccanica;
  let p = M.proiettile(30, 45, 0, 0);
  vicino('gittata nel vuoto = v₀² sin 2θ / g', 900 / g, p.R, 1e-3);
  vicino('tempo di volo = 2 v₀ sin θ / g', 2 * 30 * Math.SQRT1_2 / g, p.T, 1e-4);
  vicino('quota massima = v₀² sin²θ / 2g', 225 / g, p.H, 1e-3);
  p = M.proiettile(20, 30, 0, 10);
  const vy = 10, tv = (vy + Math.sqrt(vy * vy + 2 * g * 10)) / g;
  vicino('lancio da 10 m: gittata = v₀ cos θ · t_volo', 20 * Math.cos(Math.PI / 6) * tv, p.R, 1e-3);
  vicino('nel vuoto da terra l\'angolo ottimo è 45°', 45, M.angoloOttimo(30, 0, 0), 0.05);
  vero('con l\'aria l\'angolo ottimo scende sotto 45° (' + M.angoloOttimo(30, 0.01, 0).toFixed(2) + '°)', M.angoloOttimo(30, 0.01, 0) < 44);
  vero('con l\'aria la gittata è minore', M.proiettile(30, 45, 0.01, 0).R < 900 / g);
  let u = M.urto(2, 3, 1, -1, 1);
  vicino('urto elastico: quantità di moto conservata', u.P0, u.P1, 1e-12);
  vicino('urto elastico: energia conservata', u.K0, u.K1, 1e-12);
  u = M.urto(1, 2, 1, 0, 1); att('masse uguali, urto elastico: le velocità si scambiano', '0 2', [u.u1, u.u2].map(x => Math.round(x * 1e9) / 1e9).join(' '));
  u = M.urto(2, 3, 1, -1, 0); vicino('anelastico: velocità comune = P/M', 5 / 3, u.u1, 1e-12); vicino('energia persa = ½μ(1 − e²)v_rel²', 0.5 * (2 / 3) * 16, u.persa, 1e-12);
  u = M.urto(2, 3, 1, -1, 0.5); vicino('e = 0,5: energia persa = ½μ(1 − e²)v_rel²', 0.5 * (2 / 3) * 0.75 * 16, u.persa, 1e-12);
  vicino('K(0) = π/2', Math.PI / 2, M.ellitticoK(0), 1e-15);
  vicino('pendolo a 90°: T/T₀ = 1,18034', 1.18034060, M.periodoPendolo(1, 90) / (2 * Math.PI * Math.sqrt(1 / g)), 1e-7);
  vicino('pendolo a 10°: T/T₀ ≈ 1 + θ₀²/16', 1 + Math.pow(10 * Math.PI / 180, 2) / 16, M.periodoPendolo(1, 10) / (2 * Math.PI * Math.sqrt(1 / g)), 1e-5);
  let s = [Math.PI / 3, 0], E0 = -g * Math.cos(s[0]); for (let i = 0; i < 20000; i++) s = M.passoPendolo(s, 1, 0, 1e-3);
  vicino('pendolo senza attrito: energia conservata dopo 20 s (RK4)', E0, 0.5 * s[1] * s[1] - g * Math.cos(s[0]), 1e-6);
  const A = M.accoppiati(10, 1, 1, 1, 0);
  vicino('modo in fase ω₁ = √(k/m)', Math.sqrt(10), A.w1, 1e-12); vicino('modo in opposizione ω₂ = √((k + 2k_c)/m)', Math.sqrt(12), A.w2, 1e-12);
  vicino('battimento: dopo π/(ω₂ − ω₁) tutta l\'energia è nella seconda massa', 0, A.x1(Math.PI / (A.w2 - A.w1)) * Math.cos(0), 0.15);

  console.log('\n── Onde e ottica ──');
  const O = K.onde;
  let I = O.immagine(10, 25); vicino('lente f = 10, p = 25: q = 50/3', 50 / 3, I.q, 1e-12); att('immagine reale e capovolta', 'true false', I.reale + ' ' + I.dritta);
  I = O.immagine(10, 5); vicino('dentro il fuoco: q = −10 (virtuale)', -10, I.q, 1e-12); vicino('ingrandimento 2', 2, I.M, 1e-12);
  I = O.immagine(-10, 25); att('lente divergente: virtuale e dritta', 'false true', I.reale + ' ' + I.dritta);
  I = O.immagine(10, 20); vicino('p = 2f: q = 2f e M = −1', -1, I.M, 1e-12);
  vicino('N fenditure al centro: I = 1', 1, O.reticolo(0, 0.55, 2, 8, 5), 1e-12);
  vicino('primo ordine: inviluppo (sin β/β)² con β = π a/d', Math.pow(Math.sin(Math.PI / 4) / (Math.PI / 4), 2), O.reticolo(Math.asin(0.55 / 8), 0.55, 2, 8, 5), 1e-9);
  vicino('minimo di diffrazione a sin θ = λ/a', 0, O.reticolo(Math.asin(0.55 / 2), 0.55, 2, 8, 5), 1e-12);
  vicino('fra due massimi principali, a sin(Nα) = 0, l\'intensità è zero (N = 4)', 0, O.reticolo(Math.asin(0.55 / (4 * 8)), 0.55, 2, 8, 4), 1e-12);
  const verde = O.coloreLambda(530), rosso = O.coloreLambda(680);
  vero('530 nm è verde, 680 nm rosso', verde[1] > verde[0] && verde[1] > verde[2] && rosso[0] > rosso[1] && rosso[0] > rosso[2]);

  console.log('\n── Circuiti ──');
  const Cc = K.circuiti, L = 0.01, Cap = 1e-5, E = 10;
  for (const [R, reg] of [[20, 'sotto'], [400, 'sovra'], [2 * Math.sqrt(L / Cap), 'critico']]) {
    const S = Cc.rlcGradino(R, L, Cap, E), tt = 3.7e-4, h = 1e-9, di = (S.i(tt + h) - S.i(tt - h)) / (2 * h), dv = (S.vC(tt + h) - S.vC(tt - h)) / (2 * h);
    vicino('RLC ' + reg + ': Kirchhoff L di/dt + Ri + v_C = E', 0, L * di + R * S.i(tt) + S.vC(tt) - E, 1e-6);
    vicino('RLC ' + reg + ': i = C dv_C/dt', 0, Cap * dv - S.i(tt), 1e-8);
    vicino('RLC ' + reg + ': parte da v_C = 0 e i = 0', 0, Math.abs(S.vC(0)) + Math.abs(S.i(0)), 1e-12);
    att('regime riconosciuto: ' + reg, reg, S.regime);
  }
  const Sx = Cc.rlcGradino(20, L, Cap, E); vicino('sovraelongazione = e^(−πζ/√(1−ζ²))', Math.exp(-Math.PI * Sx.zeta / Math.sqrt(1 - Sx.zeta ** 2)), (Math.max(...Array.from({ length: 20000 }, (_, k) => Sx.vC(k * 1e-6))) - E) / E, 1e-4);
  const rc = Cc.rcGradino(1000, 1e-6, 5); vicino('RC: dopo τ al 63,2 %', 1 - Math.exp(-1), rc.vC(1e-3) / 5, 1e-12);
  let fl = Cc.filtro('pb', 1000, 0, 1e-7, 1 / (2 * Math.PI * 1e-4)); vicino('passa-basso al taglio: −3,01 dB', -10 * Math.log10(2), fl.dB, 1e-9); vicino('passa-basso al taglio: −45°', -45, fl.fase, 1e-9);
  fl = Cc.filtro('pb', 1000, 0, 1e-7, 10 / (2 * Math.PI * 1e-4)); vicino('una decade sopra: circa −20 dB', -20.04, fl.dB, 0.01);
  fl = Cc.filtro('pa', 1000, 0, 1e-7, 1 / (2 * Math.PI * 1e-4)); vicino('passa-alto al taglio: +45°', 45, fl.fase, 1e-9);
  fl = Cc.filtro('bp', 100, 0.01, 1e-6, 1 / (2 * Math.PI * Math.sqrt(1e-8))); vicino('passa-banda alla risonanza: 0 dB', 0, fl.dB, 1e-9);
  const Z = Cc.impedenza(50, 0.1, 1e-5, 1 / (2 * Math.PI * Math.sqrt(1e-6))); vicino('alla risonanza |Z| = R', 50, Z.mod, 1e-9);

  console.log('\n── Termodinamica ──');
  const T = K.termo;
  for (const tipo of ['carnot', 'otto', 'diesel', 'stirling']) {
    const Cy = T.ciclo(tipo, { Tc: 1500, Tf: 300, r: 8, rc: 2, gamma: 1.4 });
    vicino(tipo + ': ΔU del ciclo = 0', 0, Cy.reduce((a, x) => a + x.dU, 0), 1e-6);
    vicino(tipo + ': ΔS del ciclo = 0', 0, Cy.reduce((a, x) => a + x.dS, 0), 1e-9);
    vicino(tipo + ': rendimento dal bilancio = formula', Cy.teorico, Cy.eta, 1e-9);
  }
  vicino('Otto r = 8, γ = 1,4: η = 1 − 8^(−0,4) = 56,5 %', 1 - Math.pow(8, -0.4), T.ciclo('otto', { Tc: 1500, r: 8, gamma: 1.4 }).eta, 1e-9);
  vero('Otto: se la combustione partisse sotto la fine compressione, la temperatura viene alzata e segnalata', T.ciclo('otto', { Tc: 400, r: 8, gamma: 1.4 }).avviso > 400);
  vero('Diesel con lo stesso r rende meno di Otto', T.ciclo('diesel', { r: 8, rc: 2, gamma: 1.4 }).eta < T.ciclo('otto', { Tc: 1500, r: 8, gamma: 1.4 }).eta);
  const G = T.gasNuovo(200, 100, 1.2, 20), e0 = T.energiaCinetica(G);
  for (let i = 0; i < 3000; i++) T.gasPasso(G, 0.025);
  vicino('gas di dischi: energia conservata negli urti', e0, T.energiaCinetica(G), 1e-6);
  G.impulso = 0; G.tempo = 0; for (let i = 0; i < 6000; i++) T.gasPasso(G, 0.025);
  const kT = T.energiaCinetica(G) / 200; let vm = 0; G.P.forEach(q => { vm += Math.hypot(q.vx, q.vy); }); vm /= 200;
  vicino('velocità media = √(πkT/2) (Maxwell-Boltzmann 2D)', Math.sqrt(Math.PI * kT / 2), vm, 0.03 * vm);
  const eta = 200 * Math.PI * 1.44 / 1e4, pmis = G.impulso / G.tempo / 400, pid = 200 * kT / 1e4;
  vicino('pressione: gas di dischi duri N kT/A (1 + 2η + 2,78η²)', pid * (1 + 2 * eta + 2.7826 * eta * eta), pmis, 0.05 * pid);
  let integ = 0; for (let k = 0; k < 4000; k++) { const v = (k + 0.5) * 0.02; integ += T.maxwell2D(v, 3) * 0.02; } vicino('la distribuzione 2D è normalizzata', 1, integ, 1e-3);

  console.log('\n── Metodi numerici ──');
  const N = K.numerici, f = x => x * x * x - 2 * x - 5, df = x => 3 * x * x - 2, r = 2.0945514815423265;
  vicino('Newton trova la radice di x³ − 2x − 5 (Wallis)', r, N.newton(f, df, 2, 1e-15).pop(), 1e-14);
  vicino('ordine di Newton ≈ 2', 2, N.ordine(N.newton(f, df, 2, 1e-15), r), 0.1);
  vicino('ordine delle secanti ≈ 1,618 (sezione aurea)', 1.618, N.ordine(N.secanti(f, 2, 2.1, 1e-15), r), 0.15);
  vicino('punto fisso x = ∛(2x + 5): ordine 1', 1, N.ordine(N.puntoFisso(x => Math.cbrt(2 * x + 5), 2, 1e-15), r), 0.05);
  let err = null; try { N.bisezione(f, 3, 4, 1e-12); } catch (e) { err = e.message; } vero('bisezione senza cambio di segno: errore spiegato', /segni|signs/.test(err || ''));
  const gss = x => Math.exp(-x * x), Iex = 0.8820813907624215, rate = (fn, a, b) => Math.log2(Math.abs(fn(gss, 0, 2, a) - Iex) / Math.abs(fn(gss, 0, 2, b) - Iex));
  vicino('trapezi: ordine 2', 2, rate(N.trapezi, 8, 16), 0.1);
  vicino('Simpson: ordine 4', 4, rate(N.simpson, 8, 16), 0.1);
  vicino('rettangoli (punto medio): ordine 2', 2, rate(N.rettangoli, 8, 16), 0.1);
  vicino('Gauss a 3 punti su 1 intervallo integra x⁵ esattamente', 1 / 6, N.gauss(x => Math.pow(x, 5), 0, 1, 1, 3), 1e-15);
  const fe = (x, y) => -2 * x * y, Y = Math.exp(-4), ordE = fn => Math.log2(Math.abs(fn(fe, 0, 1, 2, 32).ys[32] - Y) / Math.abs(fn(fe, 0, 1, 2, 64).ys[64] - Y));
  vicino('Eulero: ordine 1', 1, ordE(N.eulero), 0.1); vicino('Heun: ordine 2', 2, ordE(N.heun), 0.2); vicino('RK4: ordine 4', 4, ordE(N.rk4), 0.25);
  const rig = N.eulero((x, y) => -50 * (y - Math.cos(x)), 0, 0, 1, 20), rigOk = N.eulero((x, y) => -50 * (y - Math.cos(x)), 0, 0, 1, 100);
  vero('equazione rigida: Eulero con h = 0,05 > 2/50 esplode, con h = 0,01 no', Math.abs(rig.ys[20]) > 10 && Math.abs(rigOk.ys[100] - Math.cos(1)) < 0.05);
  const xe = []; for (let i = 0; i < 11; i++) xe.push(-1 + 0.2 * i); const ru = x => 1 / (1 + 25 * x * x), Le = N.lagrange(xe, xe.map(ru)), xc = N.chebyshev(-1, 1, 11), Lc = N.lagrange(xc, xc.map(ru)), Sp = N.spline(xe, xe.map(ru));
  let m1 = 0, m2 = 0, m3 = 0; for (let i = 0; i <= 1000; i++) { const x = -1 + i / 500; m1 = Math.max(m1, Math.abs(Le(x) - ru(x))); m2 = Math.max(m2, Math.abs(Lc(x) - ru(x))); m3 = Math.max(m3, Math.abs(Sp(x) - ru(x))); }
  vicino('Runge, 11 nodi equispaziati: errore ≈ 1,92', 1.9156, m1, 0.01);
  vero('nodi di Čebyšëv e spline correggono Runge (errori ' + m2.toFixed(3) + ', ' + m3.toFixed(3) + ')', m2 < 0.15 && m3 < 0.03);
  vicino('la spline passa per i nodi', 0, Sp(0.2) - ru(0.2), 1e-14);

  console.log('\n── Geometria analitica ──');
  const Ge = K.geometria;
  let c = Ge.conica(5, 4, 2, 0, 0, -6); att('5x² + 4xy + 2y² = 6 è un\'ellisse', 'ellisse', c.tipo); vicino('semiasse maggiore √6', Math.sqrt(6), c.a, 1e-12); vicino('semiasse minore 1', 1, c.b, 1e-12);
  vicino('fuoco in (1, −2) o (−1, 2): |F| = √5', Math.sqrt(5), Math.hypot(...c.fuochi[0]), 1e-12); vero('il fuoco sta sulla retta y = −2x (asse maggiore)', Math.abs(c.fuochi[0][1] + 2 * c.fuochi[0][0]) < 1e-12);
  c = Ge.conica(1, 0, 1, -2, -4, -4); att('x² + y² − 2x − 4y − 4 = 0: circonferenza', 'circonferenza', c.tipo); att('centro (1, 2) e raggio 3', '1 2 3', [c.centro[0], c.centro[1], c.a].map(v => Math.round(v * 1e9) / 1e9).join(' '));
  c = Ge.conica(0, 2, 0, 0, 0, -1); att('xy = ½: iperbole', 'iperbole', c.tipo); vicino('eccentricità √2 (equilatera)', Math.SQRT2, c.e, 1e-12); vicino('fuoco in (1, 1)', 0, Math.hypot(c.fuochi[0][0] - 1, c.fuochi[0][1] - 1), 1e-12);
  c = Ge.conica(1, 2, 1, -4, 4, 0); att('x² + 2xy + y² − 4x + 4y = 0: parabola', 'parabola', c.tipo); vicino('parametro p = √2', Math.SQRT2, c.p, 1e-12);
  att('x² − y² = 0: coppia di rette (Δ = 0)', 'rette incidenti', Ge.conica(1, 0, -1, 0, 0, 0).tipo);
  att('x² + y² + 1 = 0: ellisse immaginaria', 'ellisse immaginaria', Ge.conica(1, 0, 1, 0, 0, 1).tipo);
  const pi = Ge.piano3([1, 0, 0], [0, 2, 0], [0, 0, 3]); att('piano per (1,0,0), (0,2,0), (0,0,3): 6x + 3y + 2z − 6 = 0', '6 3 2 -6', pi.n.concat([pi.d]).join(' '));
  vicino('distanza dell\'origine dal piano = 6/7', 6 / 7, Ge.distPuntoPiano([0, 0, 0], pi), 1e-12);
  const rp = Ge.rettaPiano([0, 0, 0], [1, 1, 1], pi); vicino('la retta x = y = z incontra il piano in (6/11, 6/11, 6/11)', 6 / 11, rp.punto[0], 1e-12);
  const dr = Ge.dueRette([0, 0, 0], [1, 0, 0], [0, 1, 1], [0, 1, 0]); att('due rette sghembe', 'sghembe', dr.tipo); vicino('distanza 1', 1, dr.distanza, 1e-12);
  att('rette parallele riconosciute', 'parallele', Ge.dueRette([0, 0, 0], [1, 2, 3], [1, 0, 0], [2, 4, 6]).tipo);
  const vv = Ge.vettori([2, 1, 0], [1, 3, 1], [0, 1, 2]); att('u × v = (1, −2, 5)', '1 -2 5', vv.vettoriale.join(' ')); vicino('prodotto misto = det[u; v; w]', 2 * (6 - 1) - 1 * (2 - 0) + 0, vv.misto, 1e-12);
  vero('vettori complanari: prodotto misto nullo', Math.abs(Ge.vettori([1, 0, 0], [0, 1, 0], [1, 1, 0]).misto) < 1e-15);

  console.log('\n── Equilibrio chimico ──');
  const Q = K.equilibrio;
  for (const k of Object.keys(Q.REAZIONI)) {
    const R = Q.REAZIONI[k], Kc = Q.costante(R, R.T).K, eq = Q.equilibrio(R, R.c0, Kc);
    vicino(R.nome + ': all\'equilibrio calcolato Q = K', 1, Q.quoziente(R, eq.c) / Kc, 1e-9);
    let cc = R.c0.slice(); const kk = 0.6 / Math.pow(Math.max(...cc), Math.max(1, -R.nu.filter(v => v < 0).reduce((s, v) => s + v, 0)) - 1); for (let i = 0; i < 200000; i++) cc = Q.passo(R, cc, Kc, kk, 0.01);
    vicino(R.nome + ': la cinetica arriva allo stesso equilibrio', 0, Math.max(...cc.map((v, i) => Math.abs(v - eq.c[i]))), 1e-6);
  }
  vicino('esterificazione con K = 4, 1:1: estere 2/3', 2 / 3, Q.equilibrio(Q.REAZIONI.ester, [1, 1, 0, 0], 4).c[2], 1e-12);
  const H = Q.REAZIONI.haber, KH = Q.costante(H, 700).K, e1 = Q.equilibrio(H, H.c0, KH);
  const e2 = Q.equilibrio(H, e1.c.map(v => 2 * v), KH); vero('Haber, volume dimezzato: la frazione di NH₃ aumenta (Le Chatelier, Δn = −2)', e2.c[2] / e2.c.reduce((a, b) => a + b, 0) > e1.c[2] / e1.c.reduce((a, b) => a + b, 0));
  const e3 = Q.equilibrio(H, [e1.c[0] + 0.5, e1.c[1], e1.c[2]], KH); vero('Haber, aggiungendo N₂: NH₃ aumenta', e3.c[2] > e1.c[2]);
  vero('reazione esotermica (Haber): scaldando K diminuisce', Q.costante(H, 750).K < KH);
  vero('reazione endotermica (N₂O₄ ⇌ 2NO₂): scaldando K aumenta', Q.costante(Q.REAZIONI.n2o4, 400).K > Q.costante(Q.REAZIONI.n2o4, 350).K);
  vicino('Haber: ΔG° = 0 a T = ΔH°/ΔS° = 464 K', 1, Q.costante(H, 92200 / 198.7).Kp, 1e-9);

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const SEZ = [[7, 'sfismecc', 4], [7, 'sfisonde', 3], [7, 'sfiscirc', 3], [7, 'sfistermo', 3], [8, 'smatnum', 4], [8, 'smatgeo', 3], [4, 'schiequil', 2]];
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async (SEZ) => {
      const gg = document.getElementById('bsi-guide'); if (gg) gg.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms)), out = {};
      for (const [g, s] of SEZ) {
        document.querySelector('.nav-group-tab[data-group="' + g + '"]').click();
        const b = document.querySelector('#navGroup' + g + ' .nav-btn[data-s="' + s + '"]'); if (!b) { out[s] = { manca: true }; continue; }
        b.click(); await pausa(700);
        const sec = document.getElementById(s), sch = sec.querySelectorAll('.bsiFX-schede button'); let piene = 0, tele = 0, disegnate = 0, avvisi = 0;
        for (let i = 0; i < sch.length; i++) {
          sch[i].click(); await pausa(2400);
          const pan = [...sec.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent); if (pan.textContent.length > 100) piene++; if (/⚠/.test(pan.textContent)) avvisi++;
          pan.querySelectorAll('canvas').forEach(c => { if (!c.offsetParent) return; tele++; const q = c.getContext('2d'); if (!q) { if (pan._scena && pan._scena.campiona() > 300) disegnate++; return; } const d = q.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 0; k < d.length; k += 4 * 97) if (d[k] + d[k + 1] + d[k + 2] > 120) n++; if (n > 5) disegnate++; });
        }
        out[s] = { schede: sch.length, piene, tele, disegnate, avvisi, etichette: [...sec.querySelectorAll('canvas')].every(c => !c.offsetParent || (c.getAttribute('aria-label') || '').length > 2) };
      }
      /* Le Chatelier nella pagina: aggiungo N₂ e guardo NH₃ salire */
      document.querySelector('.nav-group-tab[data-group="4"]').click(); document.querySelector('.nav-btn[data-s="schiequil"]').click(); await pausa(500);
      const sq = document.getElementById('schiequil'); sq.querySelectorAll('.bsiFX-schede button')[0].click(); await pausa(4000);
      const pq = [...sq.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), leggiNH3 = () => +(/NH₃ ([\d.]+) M/.exec(pq.textContent) || [0, NaN])[1];
      const prima = leggiNH3(); [...pq.querySelectorAll('.bsiFX-bott')].find(x => x.textContent.trim() === '+ N₂').click(); await pausa(3500);
      out.chatelier = { prima, dopo: leggiNH3(), testo: /verso destra|to the right|all’equilibrio|at equilibrium/.test(pq.textContent) };
      out.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return out;
    }, SEZ);
    console.log('── ' + nome + ' ──');
    for (const [, s, n] of SEZ) {
      const x = r[s];
      vero(s + ': ' + n + ' schede piene, nessun avviso, le tele disegnano', x && !x.manca && x.schede === n && x.piene === n && x.avvisi === 0 && x.disegnate === x.tele && x.tele > 0);
      if (nome === 'schermo grande') vero(s + ': ogni tela ha un nome accessibile', x && x.etichette);
    }
    if (nome === 'schermo grande') vero('Le Chatelier nella pagina: aggiungendo N₂ la concentrazione di NH₃ sale (' + r.chatelier.prima + ' → ' + r.chatelier.dopo + ' M)', r.chatelier.dopo > r.chatelier.prima && r.chatelier.testo);
    else att('a 390 px niente sborda', 0, r.sborda);
    att('nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
    await ctx.close();
  }
  const ctxE = await browser.newContext({ serviceWorkers: 'block' });
  const pgE = await ctxE.newPage();
  await pgE.addInitScript(() => { try { localStorage.setItem('bsi_lang', 'en'); localStorage.setItem('bsi-lingua', 'en'); } catch (e) {} });
  await pgE.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgE.waitForTimeout(5000);
  const tr = await pgE.evaluate(async () => { if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en'); await new Promise(r => setTimeout(r, 1500)); return ['sfismecc', 'smatnum', 'schiequil'].map(s => document.querySelector('.nav-btn[data-s="' + s + '"]').textContent.trim()); });
  att('in inglese: i nomi delle sezioni', '🎯 Mechanics in motion|🧮 Numerical methods|⚖️ Equilibrium and Le Chatelier', tr.join('|'));
  await ctxE.close();
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
