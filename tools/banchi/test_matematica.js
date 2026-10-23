#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_matematica — le otto sezioni di MATEMATICA e il motore simbolico

   PERCHE' QUESTO BANCO ESISTE

   Un calcolatore simbolico che sbaglia un segno insegna un errore con la
   faccia di un risultato esatto. Qui ogni risposta e' confrontata con un
   valore che NON viene dal codice stesso:

   · il motore (bsi-mat-cas.js): semplificazioni, derivate e primitive
     note dalle tavole, derivate controllate anche con le differenze
     finite, serie di Taylor (1/120, 17/315), limiti notevoli, radici;
   · le basi: le regole delle cifre significative, il pH, l'equilibrio
     dell'acido acetico (formula risolutiva) ed eˣ = 3 − x (x = 3 − W(e³));
   · lo studio di funzione: estremi, flessi, asintoti di funzioni da libro;
   · l'algebra lineare: la matrice di Hilbert (inversa intera, det 1/2160),
     un determinante 4×4 rifatto a parte in frazioni, autovalori 2 ± √2,
     reazioni bilanciate (combustione, permanganato, redox con cariche,
     processo Wöhler del fosforo);
   · le equazioni differenziali: l'ordine di Eulero (2), Heun (4), RK4 (16),
     gli equilibri di Lotka-Volterra e del Bruxellatore;
   · le funzioni di piu' variabili: punti critici e la relazione di Maxwell;
   · complessi e Fourier: e^(iπ) = −1, iⁱ = e^(−π/2), Gibbs 1,1790, Parseval;
   · la statistica: t, F e Grubbs delle tabelle, la retta di taratura
     dell'esempio di Miller & Miller (Statistics and Chemometrics for
     Analytical Chemistry), la propagazione contro un Monte Carlo.

   Poi nel browser: la categoria 📐 c'e', ogni sezione e ogni scheda si apre
   senza errori e disegna, niente sborda a 390 px, i pulsanti sono tradotti.

   USO   node tools/banchi/test_matematica.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright-core');

const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MINIMO = 120;

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vicino(d, atteso, avuto, tol) {
  eseguiti++;
  if (Math.abs(avuto - atteso) <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+(+avuto).toPrecision(10)) + ' (atteso ' + atteso + ' ± ' + tol + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tol + '\n      avuto:  ' + avuto); }
}
function vero(d, cond) { att(d, true, !!cond); }

function carica() {
  const ctx = { console, Math, Float64Array, Int32Array, Date, Number, Array, Object, String, JSON, isFinite, Infinity, NaN, BigInt, setTimeout, clearTimeout };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({ style: {} }) };
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  ['bsi-fisica-comune.js', 'bsi-mat-cas.js', 'bsi-mat-basi.js', 'bsi-mat-funzioni.js', 'bsi-mat-calcolo.js', 'bsi-mat-lineare.js',
   'bsi-mat-ode.js', 'bsi-mat-multi.js', 'bsi-mat-complessi.js', 'bsi-mat-statistica.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f });
  });
  return ctx.BSIFisica;
}

(async () => {
  const FIS = carica(), K = FIS.calcolo, C = K.cas;
  const P = s => C.stampa(C.leggi(s)), D = s => C.stampa(C.deriva(C.leggi(s), 'x')), I = s => { const r = C.integra(C.leggi(s), 'x'); return r ? C.stampa(r) : null; };

  console.log('── Motore simbolico: forma canonica ──');
  att('termini simili raccolti', '2x² + 2x + 1', P('2x² + 3x - x + 1'));
  att('√2·√2 = 2', '2', P('sqrt(2)*sqrt(2)'));
  att('frazioni esatte: 0,1 + 0,2 = 3/10', '3/10', P('0.1+0.2'));
  att('∛8 = 2', '2', P('8^(1/3)'));
  att('ln(eˣ) = x', 'x', P('ln(e^x)'));
  att('−(x + 1) si distribuisce', '−x − 1', P('-(x+1)'));
  att('espansione di (x + 1)³', 'x³ + 3x² + 3x + 1', C.stampa(C.espandi(C.leggi('(x+1)^3'))));
  att('espansione di (x − 1)(x + 1)', 'x² − 1', C.stampa(C.espandi(C.leggi('(x-1)(x+1)'))));
  att('sintassi italiana: sen, tg, √, ², ·', true, C.uguali(C.leggi('sen(x)·tg(x) + √x + x²'), C.leggi('sin(x)*tan(x)+sqrt(x)+x^2'), ['x']));

  console.log('\n── Derivate ──');
  att("(x³)′", '3x²', D('x^3'));
  att("sin(x²)′ (catena)", '2x·cos(x²)', D('sin(x^2)'));
  att("(xˣ)′", 'x^x·(ln(x) + 1)', D('x^x'));
  att("atan(x)′", '1/(x² + 1)', D('atan(x)'));
  att("ln(x² + 1)′", '2x/(x² + 1)', D('ln(x^2+1)'));
  const passi = []; C.deriva(C.leggi('sin(x)/x'), 'x', passi);
  vero('il registro dei passi riconosce il quoziente', passi.some(p => p.regola === 'quoziente'));
  { const e = C.leggi('e^(-x^2)*sin(3x)/(1+x^2) + ln(2+cos(x))*x^3'), f = C.funzione(e, 'x'), df = C.funzione(C.deriva(e, 'x'), 'x'); let m = 0;
    for (const x of [-1.7, -0.4, 0.3, 1.1, 2.5]) { const h = 1e-5, nd = (f(x + h) - f(x - h)) / (2 * h); m = Math.max(m, Math.abs(nd - df(x))); }
    vicino('derivata simbolica = differenze finite (funzione complicata)', 0, m, 1e-6); }

  console.log('\n── Primitive (verificate derivando) ──');
  att('∫ x·eˣ', 'x·e^x − e^x', I('x*e^x'));
  att('∫ 1/(1 + x²)', 'atan(x)', I('1/(1+x^2)'));
  att('∫ ln x', 'x·ln(x) − x', I('ln(x)'));
  att('∫ 2x·cos(x²) (sostituzione)', 'sin(x²)', I('2x*cos(x^2)'));
  vero('∫ x²·sin x (per parti due volte)', C.uguali(C.leggi(I('x^2*sin(x)')), C.leggi('-x^2*cos(x) + 2x*sin(x) + 2cos(x)'), ['x']));
  att('∫ sin(x)·cos(x)', '−cos(x)²/2', I('sin(x)*cos(x)'));
  att('e^(−x²) non ha primitiva elementare', null, I('e^(-x^2)'));
  vicino('∫ e^(−x²) su ℝ = √π (Simpson adattivo)', Math.sqrt(Math.PI), C.integraleDefinito(C.funzione(C.leggi('e^(-x^2)')), -8, 8).valore, 1e-9);
  vicino('∫₀^π sin x = 2', 2, C.integraleDefinito(Math.sin, 0, Math.PI).valore, 1e-10);

  console.log('\n── Serie e limiti ──');
  const sSin = C.serie(C.leggi('sin(x)'), 'x', 0, 7), sTan = C.serie(C.leggi('tan(x)'), 'x', 0, 7), sExp = C.serie(C.leggi('e^x'), 'x', 0, 18);
  att('sin x: coefficiente di x⁵ = 1/120', '1/120', C.numeroBello(sSin[5]));
  att('tan x: coefficiente di x⁷ = 17/315', '17/315', C.numeroBello(sTan[7]));
  vicino('Σ 1/k! (serie di eˣ in 1) = e', Math.E, sExp.reduce((a, b) => a + b, 0), 1e-12);
  att('ln(1 + x): coefficienti 1, −1/2, 1/3, −1/4', '1,−1/2,1/3,−1/4', C.serie(C.leggi('ln(1+x)'), 'x', 0, 4).slice(1).map(C.numeroBello).join(','));
  const L = (s, a) => C.limite(C.leggi(s), 'x', a);
  att('lim sin x / x = 1 (con le serie)', '1 serie', L('sin(x)/x', 0).valore + ' ' + L('sin(x)/x', 0).metodo);
  att('lim (1 − cos x)/x² = 1/2', 0.5, L('(1-cos(x))/x^2', 0).valore);
  vicino('lim (1 + 1/x)ˣ per x → ∞ = e', Math.E, L('(1+1/x)^x', Infinity).valore, 1e-7);
  const ab = L('abs(x)/x', 0);
  att('|x|/x in 0: sinistro −1, destro 1, il limite non esiste', '-1 1 NaN', ab.sinistro + ' ' + ab.destro + ' ' + ab.valore);
  att('lim 1/x² = +∞', Infinity, L('1/x^2', 0).valore);
  att('lim x·ln x per x → 0⁺ = 0', 0, L('x*ln(x)', 0).valore);
  att('lim ln x per x → 0⁺ = −∞', -Infinity, L('ln(x)', 0).valore);
  att('radici di x³ − 6x² + 11x − 6', '1,2,3', C.radiciPolinomio(C.coeffPolinomio(C.leggi('x^3-6x^2+11x-6'), 'x')).map(z => +z.re.toFixed(9)).join(','));
  att('radici di x² + 1: ±i', '0-1,01', C.radiciPolinomio([1, 0, 1]).map(z => z.re + '' + z.im).join(','));

  console.log('\n── Basi ──');
  const B = K.basi;
  att('0,004050 ha 4 cifre significative', 4, B.cifre('0,004050').n);
  att('1200 è ambiguo', true, B.cifre('1200').ambiguo);
  att('1,20e3 ha 3 cifre significative', 3, B.cifre('1.20e3').n);
  att('12,11 × 0,0150 → 3 cifre: 0.182', '0.182', B.operaMisure('12.11', '*', '0.0150').testo);
  att('12,11 + 18,0 → 1 decimale: 30.1', '30.1', B.operaMisure('12.11', '+', '18.0').testo);
  att('pH di 2,5·10⁻⁴ M = 3.60 (2 decimali per 2 cifre)', '3.60', B.pH('2.5e-4').testo);
  const ac = B.risolvi('x^2/(0.1 - x) = 1.8e-5').radici.filter(z => !z.im && z.re > 0)[0];
  vicino('acido acetico 0,1 M: [H⁺] dalla formula risolutiva', 0.001332670973077975, ac.re, 1e-12);
  vicino('eˣ = 3 − x → x = 3 − W(e³)', 0.7920599684306769, B.risolvi('e^x = 3 - x').radici[0].re, 1e-9);
  att('x² + 2x + 5 = 0 → −1 ± 2i', '-1-2,-12', B.risolvi('x^2+2x+5=0').radici.map(z => +z.re.toFixed(9) + '' + +z.im.toFixed(9)).join(','));
  att('2° grado: Δ', 1, B.risolvi('x^2 - 5x + 6 = 0').delta);
  for (const k of Object.keys(B.GENERATORI)) { const es = B.GENERATORI[k](); vero('allenamento «' + k + '»: la risposta giusta è accettata', B.correggi(es, es.risposta)); }
  vero('allenamento: una risposta sbagliata è respinta', !B.correggi({ tipo: 'espressione', risposta: '2x' }, 'x^2'));

  console.log('\n── Studio di funzione ──');
  const SF = K.funzioni.studio;
  let r = SF('x^3 - 3x', -6, 6);
  att('x³ − 3x: massimo in −1, minimo in 1', 'max-1,min1', r.estremi.map(p => p.tipo + Math.round(p.x)).join(','));
  att('  · flesso in 0, funzione dispari', '0 dispari', r.flessi.map(p => Math.round(p.x * 1e6) / 1e6).join(',') + ' ' + r.simmetria);
  r = SF('(x^2-1)/(x-2)', -6, 6);
  att('(x² − 1)/(x − 2): asintoto verticale x = 2', '2', r.verticali.join(','));
  att('  · asintoto obliquo y = x + 2', 'obliquo 1 2', r.infinito[0].tipo + ' ' + r.infinito[0].m + ' ' + r.infinito[0].q);
  r = SF('x*e^(-x)', -6, 6);
  att('x·e^(−x): massimo in 1, flesso in 2, y = 0 a +∞', 'max1 2 orizzontale0', r.estremi.map(p => p.tipo + Math.round(p.x * 1e6) / 1e6).join(',') + ' ' + r.flessi.map(p => Math.round(p.x * 1e6) / 1e6).join(',') + ' ' + r.infinito[0].tipo + r.infinito[0].q);
  vicino('ln(x)/x: massimo in x = e', Math.E, SF('ln(x)/x', 0.1, 10).estremi[0].x, 1e-8);

  console.log('\n── Derivate, integrali e serie (sezione) ──');
  const CI = K.calcoloinf, fq = x => x * x;
  vicino('Riemann punto medio di x² su [0, 1], n = 10', 0.3325, CI.riemann(fq, 0, 1, 10, 'medio').valore, 1e-12);
  vicino('trapezi, n = 10', 0.335, CI.riemann(fq, 0, 1, 10, 'trapezi').valore, 1e-12);
  att('Taylor di sin x al 7° grado', 'x − (1/6)·x³ + (1/120)·x⁵ − (1/5040)·x⁷', CI.stampaTaylor(CI.taylor(C.leggi('sin(x)'), 'x', 0, 7).coeff, 'x', 0));

  console.log('\n── Algebra lineare ──');
  const LA = K.lineare, Qf = LA.Qf, M = s => LA.leggiMatrice(s);
  let A = M('2 1 -1 8\n-3 -1 2 -11\n-2 1 2 -3'), s = LA.risolviSistema(A.M, Qf);
  att('sistema 3×3: x = 2, y = 3, z = −1', 'unica 2,3,−1', s.tipo + ' ' + s.sol.map(z => Qf.str(z.cost)).join(','));
  att('sistema con infinite soluzioni', 'infinite', LA.risolviSistema(M('1 2 3 6\n2 4 6 12\n1 1 1 3').M, Qf).tipo);
  att('sistema impossibile', 'impossibile', LA.risolviSistema(M('1 1 2\n1 1 3').M, Qf).tipo);
  const H = M('1 1/2 1/3\n1/2 1/3 1/4\n1/3 1/4 1/5');
  att('inversa della matrice di Hilbert 3×3 (intera)', '9 −36 30 −36 192 −180 30 −180 180', LA.inversa(H.M, Qf).map(r => r.map(Qf.str).join(' ')).join(' '));
  att('det di Hilbert 3×3 = 1/2160', '1/2160', Qf.str(LA.determinante(H.M, Qf)));
  att('det 4×4 (rifatto a parte in frazioni: 86)', '86', Qf.str(LA.determinante(M('1 2 0 3\n4 0 1 2\n0 1 3 1\n2 2 1 0').M, Qf)));
  let E = LA.autovalori(M('2 -1 0\n-1 2 -1\n0 -1 2').M, Qf);
  att('autovalori di tridiag(−1, 2, −1): 2 − √2, 2, 2 + √2', [2 - Math.SQRT2, 2, 2 + Math.SQRT2].map(v => v.toFixed(10)).join(','), E.valori.map(d => d.re).sort((a, b) => a - b).map(v => v.toFixed(10)).join(','));
  E = LA.autovalori(M('2 1\n0 2').M, Qf);
  att('[2 1; 0 2]: λ = 2 doppio con un solo autovettore', '2 2 1', E.valori[0].re + ' ' + E.valori[0].molt + ' ' + E.valori[0].vettori.length);
  att('rotazione di 90°: autovalori ±i', '0,-1 0,1', LA.autovalori(M('0 -1\n1 0').M, Qf).valori.map(d => d.re + ',' + d.im).join(' '));
  att('polinomio caratteristico di [4 1; 2 3] = λ² − 7λ + 10', '10,−7,1', LA.polCaratteristico(M('4 1\n2 3').M, Qf).map(Qf.str).join(','));
  const bil = q => { const b = LA.bilancia(q); return b.coeff ? b.coeff.join(' ') : 'dim ' + b.dim; };
  att('C₃H₈ + O₂ → CO₂ + H₂O', '1 5 3 4', bil('C3H8 + O2 -> CO2 + H2O'));
  att('KMnO₄ + HCl → KCl + MnCl₂ + H₂O + Cl₂', '2 16 2 2 8 5', bil('KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2'));
  att('redox con cariche: MnO₄⁻ + Fe²⁺ + H⁺', '1 5 8 1 5 4', bil('MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O'));
  att('processo Wöhler: Ca₃(PO₄)₂ + SiO₂ + C', '2 6 10 6 1 10', bil('Ca3(PO4)2 + SiO2 + C -> CaSiO3 + P4 + CO'));
  att('idrato CuSO₄·5H₂O', '1 1 5', bil('CuSO4·5H2O -> CuSO4 + H2O'));
  att('H₂ + O₂ → H₂O + H₂O₂: nucleo di dimensione 2, non unica', 'dim 2', bil('H2 + O2 -> H2O + H2O2'));

  console.log('\n── Equazioni differenziali ──');
  const O = K.ode, e8 = O.errori(8), e16 = O.errori(16);
  vicino('Eulero: dimezzando h l’errore cala di ~2 (ordine 1)', 2, e8.eulero / e16.eulero, 0.12);
  vicino('Heun: cala di ~4 (ordine 2)', 4, e8.heun / e16.heun, 0.25);
  vicino('RK4: cala di ~16 (ordine 4)', 16, e8.rk4 / e16.rk4, 1);
  const eqd = k => O.equilibri(C.leggi(O.SISTEMI[k].f), C.leggi(O.SISTEMI[k].g), O.SISTEMI[k].box);
  att('Lotka-Volterra: equilibrio (c/d, a/b) = (4; 2,75), centro', '4 2.75 centro', eqd('lv').filter(p => p.x > 0).map(p => +p.x.toFixed(9) + ' ' + +p.y.toFixed(9) + ' ' + p.tipo).join());
  att('oscillatore smorzato: fuoco stabile', 'fuoco stabile', eqd('smorz')[0].tipo);
  att('pendolo: sella in θ = π', 'sella', eqd('pendolo').filter(p => Math.abs(p.x - Math.PI) < 1e-6)[0].tipo);
  att('Bruxellatore (A = 1, B = 3 > 1 + A²): (1, 3) fuoco instabile', '1 3 fuoco instabile', eqd('brux').map(p => +p.x.toFixed(9) + ' ' + +p.y.toFixed(9) + ' ' + p.tipo).join());
  att('SIR: una curva di equilibri (I = 0)', 'curva', eqd('sir').map(p => p.tipo).join());

  console.log('\n── Più variabili ──');
  const MV = K.multi, BX = [-2.2, 2.2, -2.2, 2.2], tipi = q => MV.analizza(q, BX).critici.map(p => p.tipo).sort().join(',');
  att('x² − y²: sella', 'sella', tipi('x^2 - y^2'));
  att('x·y·e^(−(x²+y²)/2): 2 massimi, 2 minimi, 1 sella', 'massimo,massimo,minimo,minimo,sella', tipi('x*y*e^(-(x^2 + y^2)/2)'));
  att('doppia buca: due minimi e uno stato di transizione', 'minimo,minimo,sella', tipi('(x^2 - 1)^2 + 2y^2 - 0.3x'));
  att('Rosenbrock: minimo in (1, 1)', '1 1', MV.analizza('(1 - x)^2 + 5(y - x^2)^2', BX).critici.map(p => +p.x.toFixed(9) + ' ' + +p.y.toFixed(9)).join());
  const mx = MV.maxwellVdW();
  att('Maxwell (van der Waals): (∂S/∂V)_T = (∂p/∂T)_V = R/(V − b)', 'R/(V − b) R/(V − b) true', C.stampa(mx.dSdV) + ' ' + C.stampa(mx.dpdT) + ' ' + mx.uguali);
  att('δq = Cv dT + (RT/V) dV non è esatto', false, MV.esatto(C.leggi('Cv'), C.leggi('R*T/V'), 'T', 'V').esatto);
  const dS = MV.esatto(C.leggi('Cv/T'), C.leggi('R/V'), 'T', 'V');
  vero('δq/T è esatto e il potenziale è S = Cv ln T + R ln V', dS.esatto && C.uguali(dS.potenziale, C.leggi('Cv*ln(T) + R*ln(V)'), ['Cv', 'R', 'T', 'V']));
  const dsc = MV.discesa(MV.analizza('x^2 + y^2', BX), 1.5, 1);
  vicino('discesa del gradiente su x² + y²: arriva all’origine', 0, Math.hypot(dsc[dsc.length - 1][0], dsc[dsc.length - 1][1]), 1e-4);

  console.log('\n── Complessi e Fourier ──');
  const CX = K.complessi, z = s => CX.leggiZ(s);
  att('e^(iπ) = −1', '−1', CX.strZ(z('e^(i*pi)')));
  att('(1 + i)⁸ = 16', '16', CX.strZ(z('(1+i)^8')));
  vicino('iⁱ = e^(−π/2)', Math.exp(-Math.PI / 2), z('i^i')[0], 1e-14);
  att('(3 + 4i)/(1 − 2i) = −1 + 2i', '−1 + 2i', CX.strZ(z('(3+4i)/(1-2i)')));
  vicino('le radici cubiche dell’unità sommano a 0', 0, Math.hypot(...CX.radici([1, 0], 3).reduce((a, b) => [a[0] + b[0], a[1] + b[1]])), 1e-14);
  { const cf = CX.coeffOnda('quadra', 401); let m = -1; for (let i = 0; i <= 40000; i++) m = Math.max(m, CX.somma(cf, 401, -Math.PI + 2 * Math.PI * i / 40000));
    vicino('fenomeno di Gibbs: massimo della somma dell’onda quadra → 1,1790', 1.178979744, m, 1e-3); }
  vicino('onda quadra: b₁ numerico = 4/π', 4 / Math.PI, CX.coefficienti(x => x < 0 ? -1 : 1, 1).b[1], 1e-8);
  att('f = x²: aₙ = 4(−1)ⁿ/n²', '-4,1,-0.444444', CX.coefficienti(x => x * x, 3).a.slice(1).map(v => +v.toFixed(6)).join(','));
  { const cf = CX.coeffOnda('quadra', 20001); let s2 = 0; for (let n = 1; n <= 20001; n++) s2 += cf.b[n] * cf.b[n];
    vicino('Parseval per l’onda quadra: Σ bₙ² = (1/π)∫f² = 2', 2, s2, 1e-4); }

  console.log('\n── Statistica di laboratorio ──');
  const ST = K.statistica;
  vicino('t(0,975; 9) = 2,262', 2.262, ST.tInv(0.975, 9), 5e-4);
  vicino('t(0,975; 4) = 2,776', 2.776, ST.tInv(0.975, 4), 5e-4);
  vicino('t(0,975; 1) = 12,706', 12.706, ST.tInv(0.975, 1), 1e-3);
  vicino('F(0,975; 4, 4) = 9,605', 9.605, ST.fInv(0.975, 4, 4), 1e-3);
  vicino('Grubbs critico n = 10 (95 %, due code) = 2,290', 2.290, ST.grubbsCritico(10), 1e-3);
  vicino('Grubbs critico n = 5 = 1,715', 1.715, ST.grubbsCritico(5), 1e-3);
  const dati = [10.12, 10.15, 10.09, 10.14, 10.11, 10.48, 10.13, 10.10];
  att('Grubbs e Dixon segnalano 10,48', '10.48 10.48', ST.grubbs(dati).sospetto + ' ' + ST.dixon(dati).sospetto);
  const T = ST.taratura([0, 2, 4, 6, 8, 10, 12], [2.1, 5.0, 9.0, 12.6, 17.3, 21.0, 24.7]);
  vicino('Miller & Miller: pendenza 1,93', 1.9304, T.b, 1e-4);
  vicino('  · intercetta 1,52', 1.5179, T.a, 1e-4);
  vicino('  · s_y/x 0,4329', 0.4329, T.syx, 1e-4);
  vicino('  · r 0,9989', 0.9989, T.r, 1e-4);
  vicino('  · y₀ = 2,9 → x₀ = 0,72', 0.716, ST.inverso(T, 2.9, 1).x0, 1e-3);
  vicino('  · s(x₀) = 0,26', 0.265, ST.inverso(T, 2.9, 1).s, 2e-3);
  vicino('  · y₀ = 13,5 → x₀ = 6,21 ± 0,24', 0.24, ST.inverso(T, 13.5, 1).s, 2e-3);
  const val = ST.leggiValori('m = 0.2045 ± 0.0002\nM = 204.22 ± 0.01\nV = 0.02500 ± 0.00003'), pr = ST.propaga('m/(M*V)', val), mc = ST.monteCarlo(pr.e, val, 20000);
  vicino('propagazione: molarità 0,04005 M', 0.040055, pr.f, 1e-6);
  vicino('  · u dalle derivate = u del Monte Carlo (entro il 5 %)', 1, mc.s / pr.u, 0.05);
  const tt = ST.tUnCampione([98.2, 99.1, 98.7, 98.9, 98.5], 100);
  vero('t a un campione: 98,7 contro 100 è significativo (p < 0,05)', tt.p < 0.05 && Math.abs(tt.t) > tt.tc);

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const SEZ = ['smatbasi', 'smatfunz', 'smatcalc', 'smatlin', 'smatode', 'smatmulti', 'smatcompl', 'smatstat'];
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') err.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async (SEZ) => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const out = { categoria: !!document.querySelector('.nav-group-tab[data-group="8"]'), pulsanti: 0, sezioni: {} };
      document.querySelector('.nav-group-tab[data-group="8"]').click();
      out.pannello = getComputedStyle(document.getElementById('navGroup8')).display;
      for (const s of SEZ) {
        const b = document.querySelector('#navGroup8 .nav-btn[data-s="' + s + '"]');
        if (!b) { out.sezioni[s] = { manca: true }; continue; }
        out.pulsanti++;
        b.click(); await new Promise(r => setTimeout(r, 1200));
        const sec = document.getElementById(s), schede = sec.querySelectorAll('.bsiFX-schede button');
        let disegnate = 0, tele = 0, avvisi = 0;
        for (let i = 0; i < schede.length; i++) {
          schede[i].click(); await new Promise(r => setTimeout(r, 1500));
          sec.querySelectorAll('canvas').forEach(c => {
            if (!c.offsetParent) return; tele++;
            const q = c.getContext('2d'), d = q.getImageData(0, 0, c.width, c.height).data; let n = 0;
            for (let k = 0; k < d.length; k += 4 * 97) if (d[k] + d[k + 1] + d[k + 2] > 120) n++;
            if (n > 5) disegnate++;
          });
          sec.querySelectorAll('[role=tabpanel]').forEach(p => { if (p.offsetParent && /⚠/.test(p.textContent)) avvisi++; });
        }
        out.sezioni[s] = { visibile: sec.offsetHeight > 200, schede: schede.length, tele, disegnate, avvisi,
                           sborda: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      }
      /* un'interazione vera: si scrive una derivata e la sezione risponde */
      document.querySelector('.nav-btn[data-s="smatcalc"]').click(); await new Promise(r => setTimeout(r, 600));
      const sc = document.getElementById('smatcalc'); sc.querySelector('.bsiFX-schede button').click(); await new Promise(r => setTimeout(r, 400));
      const inp = sc.querySelector('[role=tabpanel] input[type=text]'); inp.value = 'x^3*ln(x)'; inp.dispatchEvent(new Event('change'));
      await new Promise(r => setTimeout(r, 500));
      out.derivata = (sc.querySelector('.bsiFX-eq') || {}).textContent || '';
      return out;
    }, SEZ);
    console.log('── ' + nome + ' ──');
    if (nome === 'schermo grande') {
      att('la categoria 📐 Matematica c’è', true, r.categoria);
      att('  · e il suo pannello si apre', 'flex', r.pannello);
      att('  · con le otto sezioni', 8, r.pulsanti);
      vero('scrivendo x³·ln x la sezione dà f′ = 3x²·ln(x) + x²', /f′\(x\) = 3x²·ln\(x\) \+ x²/.test(r.derivata) || /f′\(x\) = x² \+ 3x²·ln\(x\)/.test(r.derivata));
    }
    for (const s of SEZ) {
      const x = r.sezioni[s];
      att(s + ': si apre, ogni scheda disegna, nessun avviso', true, !!x && x.visibile && x.tele > 0 && x.disegnate === x.tele && x.avvisi === 0);
      if (nome === 'telefono') att('  · a 390 px niente sborda', 0, x.sborda);
    }
    att('nessun errore JavaScript', 0, err.length);
    err.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
    await ctx.close();
  }

  const ctxE = await browser.newContext({ serviceWorkers: 'block' });
  const pgE = await ctxE.newPage();
  await pgE.addInitScript(() => { try { localStorage.setItem('bsi_lang', 'en'); localStorage.setItem('bsi-lingua', 'en'); } catch (e) {} });
  await pgE.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgE.waitForTimeout(5000);
  const tr = await pgE.evaluate(async () => {
    if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en');
    else if (window.BSILingue && window.BSILingue.cambia) window.BSILingue.cambia('en');
    await new Promise(r => setTimeout(r, 1500));
    return { tab: document.querySelector('.nav-group-tab[data-group="8"]').textContent.trim(),
             st: document.querySelector('.nav-btn[data-s="smatstat"]').textContent.trim() };
  });
  att('in inglese la categoria si chiama «Mathematics»', '📐 Mathematics', tr.tab);
  att('  · e la statistica «Laboratory statistics»', '📏 Laboratory statistics', tr.st);
  await ctxE.close();
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
