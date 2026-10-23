#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_esami — i risolutori d'esame (Matematica e Fisica UniBA) e le due
   sezioni nuove di chimica fisica

   PERCHE' QUESTO BANCO ESISTE

   Uno svolgimento sbagliato e' peggio di nessuno svolgimento: lo studente
   lo copia. Ogni risultato qui e' confrontato con un valore ottenuto
   altrove — calcolato a mano, o con un sistema di algebra simbolica
   indipendente (SymPy) al momento di scrivere il banco, o rifatto dentro
   il banco con una formula diversa da quella del risolutore:

   · Matematica: domini, limiti (Taylor, 1^∞, rapporti di polinomi),
     integrali (fratti semplici con radice doppia e fattore irriducibile,
     per parti, ciclici), impropri, Taylor, serie (fattoriali, Leibniz,
     armonica, n·ln n, 1/√n), serie di potenze con gli estremi, due
     variabili, estremi assoluti su rettangolo/disco/triangolo, integrali
     doppi (anche in polari), forme differenziali, EDO del primo e del
     secondo ordine con il problema di Cauchy; e tutti gli esercizi degli
     appelli svolti devono produrre un risultato.
   · Fisica: ogni modello contro la stessa grandezza calcolata per altra
     via (gittata da v₀²sin2θ/g, Kirchhoff con la regola di Cramer,
     conservazione dell'energia negli urti, orbita geostazionaria ≈ un
     giorno siderale…), e tutte le prove svolte.
   · Chimica fisica: Tafel e Eyring ricavano i parametri usati per generare
     i dati, BET e Langmuir ritrovano la capacita' del monostrato, Mn/Mw a
     mano, Carothers, rese quantiche che sommano a 1.

   Poi nel browser: le quattro sezioni si aprono senza errori, ogni scheda
   ha contenuto, niente sborda a 390 px, un appello svolto mostra la
   soluzione, i pulsanti sono tradotti.

   USO   node tools/banchi/test_esami.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright-core');

const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MINIMO = 150;

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
function vero(d, c) { att(d, true, !!c); }

function carica() {
  const ctx = { console, Math, Float64Array, Int32Array, Date, Number, Array, Object, String, JSON, isFinite, Infinity, NaN, BigInt, setTimeout, clearTimeout };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({ style: {} }), querySelectorAll: () => [] };
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  ['bsi-fisica-comune.js', 'bsi-mat-cas.js', 'bsi-mat-funzioni.js', 'bsi-mat-multi.js', 'bsi-mat-complessi.js', 'bsi-mat-risolutore.js', 'bsi-mat-esame.js',
   'bsi-fis-esame.js', 'bsi-fis-elettrodi.js', 'bsi-fis-superfici.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx.BSIFisica;
}

(async () => {
  const FIS = carica(), K = FIS.calcolo, R = K.risolutore.RISOLUTORI, C = K.cas;
  const ris = r => r.risultato;

  console.log('── Matematica I ──');
  att('dominio √(4 − x²)', '[−2, 2]', ris(R.dominio('sqrt(4-x^2)')));
  att('dominio ln(x² − 1)', '(−∞, −1) ∪ (1, +∞)', ris(R.dominio('ln(x^2-1)')));
  att('dominio 1/(x² − 3x + 2)', '(−∞, 1) ∪ (1, 2) ∪ (2, +∞)', ris(R.dominio('1/(x^2-3x+2)')));
  att('dominio √((x − 1)/(x + 2))', '(−∞, −2) ∪ [1, +∞)', ris(R.dominio('sqrt((x-1)/(x+2))')));
  att('dominio arcsin(2x − 1)', '[0, 1]', ris(R.dominio('asin(2x-1)')));
  att('dominio ln(ln x)', '(1, +∞)', ris(R.dominio('ln(ln(x))')));
  att('dominio x·e^(−x): ℝ (il trabocco numerico per x → −∞ non toglie punti)', 'ℝ', ris(R.dominio('x*e^(-x)')));
  att('dominio eˣ/x', '(−∞, 0) ∪ (0, +∞)', ris(R.dominio('e^x/x')));
  att('dominio x^(1/3)/(x − 1): la radice cubica esiste anche per x < 0', '(−∞, 1) ∪ (1, +∞)', ris(R.dominio('x^(1/3)/(x-1)')));
  att('dominio x·ln x', '(0, +∞)', ris(R.dominio('x*ln(x)')));
  att('lim (x³ + 1)/(x + 1) in −1 (0/0)', '3', ris(R.limite('(x^3+1)/(x+1)', '-1')));
  att('lim (1 − cos x)/x²', '1/2', ris(R.limite('(1-cos(x))/x^2', '0')));
  att('lim (sin x − x)/x³ (SymPy: −1/6)', '−1/6', ris(R.limite('(sin(x)-x)/x^3', '0')));
  att('lim (eˣ − 1 − x)/x²', '1/2', ris(R.limite('(e^x-1-x)/x^2', '0')));
  att('lim (1 + 2/x)ˣ a +∞ (SymPy: e²)', 'e²', ris(R.limite('(1+2/x)^x', 'inf')));
  att('lim (2x² + 1)/(3x² − x) a ∞', '2/3', ris(R.limite('(2x^2+1)/(3x^2-x)', 'inf')));
  att('lim x·ln x in 0⁺', '0', ris(R.limite('x*ln(x)', '0')));
  vero('lim 1/(x − 2) in 2: non esiste, −∞ e +∞', /non esiste/.test(ris(R.limite('1/(x-2)', '2'))) && /−∞/.test(ris(R.limite('1/(x-2)', '2'))));
  vero('il limite 0/0 mostra gli sviluppi di Taylor', R.limite('(sin(x)-x)/x^3', '0').passi.some(p => /Taylor/.test(p.titolo)));
  let st = R.studio('(x^2+1)/(x^2-1)');
  vero('studio (x² + 1)/(x² − 1): asintoti verticali ±1 e orizzontale 1', st.asintoti.some(a => /verticale x = −1/.test(a)) && st.asintoti.some(a => /verticale x = 1$/.test(a)) && st.asintoti.some(a => /orizzontale y = 1/.test(a)));
  vero('  · massimo relativo in (0, −1)', st.estremi.some(p => p.tipo === 'max' && p.x === 0 && p.y === -1));
  vero('  · f′ in forma razionale −4x/(x² − 1)²', st.passi.some(p => /\(−4x\)\/\(x² − 1\)²/.test(p.html)));
  st = R.studio('x*e^(-x)');
  vero('studio x·e^(−x): massimo in x = 1, flesso in x = 2', st.estremi.some(p => p.tipo === 'max' && Math.abs(p.x - 1) < 1e-9) && st.flessi.some(v => Math.abs(v - 2) < 1e-9));
  const I = s => ris(R.integraleIndefinito(s));
  att('∫ (x + 3)/(x² − x − 2) (SymPy)', '5·ln(|x − 2|)/3 − 2·ln(|x + 1|)/3 + c', I('(x+3)/(x^2-x-2)'));
  att('∫ (2x + 1)/(x² + 2x + 5) (SymPy)', '−atan(x/2 + 1/2)/2 + ln(x² + 2x + 5) + c', I('(2x+1)/(x^2+2x+5)'));
  att('∫ 1/((x − 1)²(x + 1)): radice doppia', '−1/(2(x − 1)) − ln(|x − 1|)/4 + ln(|x + 1|)/4 + c', I('1/((x-1)^2*(x+1))'));
  att('∫ x·arctg x (SymPy)', 'x²·atan(x)/2 − x/2 + atan(x)/2 + c', I('x*atan(x)'));
  att('∫ eˣ cos x (ciclico, SymPy)', 'e^x·(cos(x) + sin(x))/2 + c', I('e^x*cos(x)'));
  att('∫ ln² x', 'x·ln(x)² − 2x·ln(x) + 2x + c', I('ln(x)^2'));
  vero('∫ x²eˣ: lo svolgimento nomina l’integrazione per parti', R.integraleIndefinito('x^2*e^x').passi.some(p => /per parti/.test(p.titolo)));
  vero('∫ 2x·cos(x²): lo svolgimento nomina la sostituzione u = x²', R.integraleIndefinito('2x*cos(x^2)').passi.some(p => /Sostituzione/.test(p.titolo) && /u = x²/.test(p.html)));
  vero('∫ fratti: lo svolgimento mostra A = −2/3, B = 5/3', R.integraleIndefinito('(x+3)/(x^2-x-2)').passi.some(p => /A = −2\/3, B = 5\/3/.test(p.html)));
  att('∫ e^(−x²) dx: nessuna primitiva elementare', null, ris(R.integraleIndefinito('e^(-x^2)')));
  att('∫₀^∞ x e^(−x) dx (SymPy: 1)', '1', ris(R.integraleDefinito('x*e^(-x)', '0', 'inf')));
  att('∫₀¹ ln x dx (SymPy: −1)', '−1', ris(R.integraleDefinito('ln(x)', '0', '1')));
  att('∫₋∞^∞ 1/(1 + x²) dx = π', 'π', ris(R.integraleDefinito('1/(1+x^2)', '-inf', 'inf')));
  att('∫₀¹ 1/√x dx = 2', '2', ris(R.integraleDefinito('1/sqrt(x)', '0', '1')));
  vero('∫₁^∞ 1/x dx diverge', /diverge/.test(ris(R.integraleDefinito('1/x', '1', 'inf'))));
  att('Taylor di eˣ sin x al 5° ordine (SymPy)', 'x + x² + (1/3)·x³ − (1/30)·x⁵', ris(R.taylor('e^x*sin(x)', '0', 5)));
  att('Taylor di ln x in 1', '(x − 1) − (1/2)·(x − 1)² + (1/3)·(x − 1)³ − (1/4)·(x − 1)⁴', ris(R.taylor('ln(x)', '1', 4)));
  att('complessi: z³ = 8i', '√3 + i; −√3 + i; −2i', ris(R.complessi({ tipo: 'radici', n: 3, w: '8i' })));
  att('complessi: (1 + i)⁸ = 16', '16', ris(R.complessi({ tipo: 'forma', z: '1+i', n: 8 })));
  att('complessi: z² + 2z + 5 = 0', '−1 − 2i; −1 + 2i', ris(R.complessi({ tipo: 'eq2', a: 1, b: 2, c: 5 })));

  console.log('\n── Matematica II ──');
  const car = s => R.serieNumerica(s.split('|')[0], s.split('|')[1] ? +s.split('|')[1] : 1).carattere;
  att('Σ n!/nⁿ converge (rapporto 1/e)', 'converge', car('n!/n^n'));
  att('Σ 2ⁿ/n! converge', 'converge', car('2^n/n!|0'));
  att('Σ 1/n diverge', 'diverge', car('1/n'));
  att('Σ 1/n² converge', 'converge', car('1/n^2'));
  att('Σ (−1)ⁿ/n converge semplicemente', 'semplice', car('(-1)^n/n'));
  att('Σ (−1)ⁿ/n² converge assolutamente', 'assoluta', car('(-1)^n/n^2'));
  att('Σ 1/(n ln n) diverge (caso critico)', 'diverge', car('1/(n*ln(n))|2'));
  att('Σ (2n)!/((n!)²4ⁿ) ~ 1/√(πn) diverge', 'diverge', car('(2n)!/(n!)^2/4^n'));
  att('Σ (n/(n + 1))ⁿ: aₙ → 1/e, diverge', 'diverge', car('(n/(n+1))^n'));
  att('Σ cos n/n² converge assolutamente', 'assoluta', car('cos(n)/n^2'));
  vicino('Σ (2/3)ⁿ da 1: somma geometrica 2', 2, R.serieNumerica('(2/3)^n', 1).somma, 1e-12);
  att('Σ xⁿ/n: [−1, 1)', '[−1, 1)', ris(R.seriePotenze('1/n', '0')));
  att('Σ xⁿ/(n3ⁿ): [−3, 3)', '[−3, 3)', ris(R.seriePotenze('1/(n*3^n)', '0')));
  att('Σ xⁿ/n²: [−1, 1]', '[−1, 1]', ris(R.seriePotenze('1/n^2', '0')));
  att('Σ n2ⁿxⁿ: (−1/2, 1/2)', '(−1/2, 1/2)', ris(R.seriePotenze('n*2^n', '0')));
  const dv = R.dueVariabili('x^3-3x*y+y^3', [1, 2], [3, 4]);
  att('x³ − 3xy + y³: sella in (0,0), minimo in (1,1)', 'sella (0, 0); minimo (1, 1)', dv.risultato);
  vicino('  · derivata direzionale in (1,2) lungo (3,4) = (−3·3 + 9·4)/5', 27 / 5, dv.direzionale, 1e-12);
  att('max/min di x² + y² − 2x su [0,2]×[−1,1]', 'max 1, min −1', ris(R.maxMinCompatto('x^2+y^2-2x', { tipo: 'rettangolo', a: 0, b: 2, c: -1, d: 1 })));
  att('max/min di xy sul disco unitario', 'max 1/2, min −1/2', ris(R.maxMinCompatto('x*y', { tipo: 'disco', cx: 0, cy: 0, r: 1 })));
  att('max/min di x² − xy + y sul triangolo (0,0),(2,0),(0,2)', 'max 4, min 0', ris(R.maxMinCompatto('x^2-x*y+y', { tipo: 'triangolo', v: [[0, 0], [2, 0], [0, 2]] })));
  att('∬ xy, x² ≤ y ≤ x (SymPy: 1/24)', '1/24', ris(R.integraleDoppio({ f: 'x*y', tipo: 'x', a: 0, b: 1, g1: 'x^2', g2: 'x' })));
  att('∬ (x² + y²) sul disco unitario in polari = π/2', 'π/2', ris(R.integraleDoppio({ f: 'x^2+y^2', tipo: 'polari', a: 0, b: '2*pi', g1: 0, g2: 1 })));
  att('∬ (x + y), y ≤ x ≤ 1 (normale rispetto a y)', '1/2', ris(R.integraleDoppio({ f: 'x+y', tipo: 'y', a: 0, b: 1, g1: 'y', g2: '1' })));
  const fd = R.formeDifferenziali({ M: '2x*y+1', N: 'x^2+3y^2', xt: 't', yt: 't^2', t0: 0, t1: 1 });
  vero('ω = (2xy + 1)dx + (x² + 3y²)dy è chiusa, ∫ = U(1,1) − U(0,0) = 3', fd.chiusa && Math.abs(fd.integrale - 3) < 1e-9);
  const fd2 = R.formeDifferenziali({ M: '-y', N: 'x', xt: 'cos(t)', yt: 'sin(t)', t0: 0, t1: '2*pi' });
  vero('−y dx + x dy non è chiusa, sul cerchio ∫ = 2π', !fd2.chiusa && Math.abs(fd2.integrale - 2 * Math.PI) < 1e-9);
  att("y′ + 2y = eˣ, y(0) = 1 (SymPy)", '2·e^(−2x)/3 + e^x/3', ris(R.lineare1({ a: '2', b: 'e^x', x0: 0, y0: 1 })));
  att("y′ + y/x = x², y(1) = 0 (SymPy)", 'x³/4 − 1/(4x)', ris(R.lineare1({ a: '1/x', b: 'x^2', x0: 1, y0: 0 })));
  att("y′ = xy, y(0) = 2", 'y = 2·e^(x²/2)', ris(R.separabile({ g: 'x', h: 'y', x0: 0, y0: 2 })));
  att("y′ = y², y(0) = 1", 'y = −1/(x − 1)', ris(R.separabile({ g: '1', h: 'y^2', x0: 0, y0: 1 })));
  att("y′ = 2x(1 + y²), y(0) = 0", 'y = tan(x²)', ris(R.separabile({ g: '2x', h: '1+y^2', x0: 0, y0: 0 })));
  att("y″ − 3y′ + 2y = eˣ, Cauchy (SymPy, risonanza)", '−x·e^x + 2·e^(2x) − 2·e^x', ris(R.secondoOrdine({ a: 1, b: -3, c: 2, f: 'e^x', x0: 0, y0: 0, y1: 1 })));
  att("y″ + 4y = sin 2x, Cauchy (SymPy, risonanza)", '−x·cos(2x)/4 + sin(2x)/8', ris(R.secondoOrdine({ a: 1, b: 0, c: 4, f: 'sin(2x)', x0: 0, y0: 0, y1: 0 })));
  const o3 = R.secondoOrdine({ a: 1, b: 2, c: 1, f: 'x^2' });
  vero("y″ + 2y′ + y = x²: soluzione particolare x² − 4x + 6", C.uguali(o3.particolare, C.leggi('x^2-4x+6'), ['x']));
  const o4 = R.secondoOrdine({ a: 1, b: -2, c: 1, f: 'e^x' });
  vero("y″ − 2y′ + y = eˣ: radice doppia, y_p = x²eˣ/2", C.uguali(o4.particolare, C.leggi('x^2*e^x/2'), ['x']));
  att("y″ + 2y′ + 5y = 0, y(0) = 1, y′(0) = 0", 'cos(2x)·e^(−x) + e^(−x)·sin(2x)/2', ris(R.secondoOrdine({ a: 1, b: 2, c: 5, f: '0', x0: 0, y0: 1, y1: 0 })));
  /* tutti gli appelli svolti producono un risultato */
  const EM = K.esameMatematica; let tot = 0, buoni = 0;
  ['I', 'II'].forEach(k => EM.APPELLI[k].forEach(ap => ap.forEach(es => { tot++; try { const r = EM.TIPI[es.tipo].esegui(es.v); if (r && r.passi.length && r.risultato != null && !/ERRORE/.test(r.risultato)) buoni++; } catch (e) { } })));
  att('tutti gli esercizi degli appelli svolti di Matematica hanno uno svolgimento', tot, buoni);
  vero('  · e sono almeno 60', tot >= 60);

  console.log('\n── Fisica ──');
  const EF = K.esameFisica, rf = (id, d) => { const r = EF.risolvi(id, d); const o = {}; r.risultati.forEach(x => { o[x.nome] = x.v; }); return o; };
  const g = 9.81;
  vicino('proiettile da terra: R = v₀² sin 2θ/g', 25 * 25 * Math.sin(80 * Math.PI / 180) / g, rf('proiettile', { v0: 25, th: 40, h: 0 }).R, 1e-9);
  vicino('caduta: velocità d’impatto √(v₀² + 2gh)', Math.sqrt(100 + 2 * g * 20), rf('caduta', { h: 20, v0: 10 }).v, 1e-9);
  vicino('piano inclinato: a = g(sin θ − μ cos θ)', g * (Math.sin(Math.PI / 6) - 0.3 * Math.cos(Math.PI / 6)), rf('piano', { m: 5, th: 30, ms: 0.4, md: 0.3 }).a, 1e-9);
  att('piano inclinato a 25° con μs = 0,5: resta fermo', 0, rf('piano', { m: 3, th: 25, ms: 0.5, md: 0.35 }).a);
  vicino('Atwood: a = (m₂ − m₁)g/(m₁ + m₂)', g / 5, rf('atwood', { m1: 2, m2: 3 }).a, 1e-12);
  const el = rf('elastico', { m1: 1, v1: 6, m2: 2, v2: 0 });
  vicino('urto elastico: energia cinetica conservata', 0.5 * 36, 0.5 * el['v₁′'] ** 2 + 0.5 * 2 * el['v₂′'] ** 2, 1e-9);
  vicino('urto anelastico: quantità di moto conservata', 1.5 * 4 + 2.5 * -1, 4 * rf('anelastico', { m1: 1.5, v1: 4, m2: 2.5, v2: -1 }).V, 1e-12);
  vicino('orbita geostazionaria: periodo ≈ giorno siderale (86164 s)', 86164, rf('orbita', { M: 5.972e24, r: 4.2164e7 }).T, 30);
  vicino('rotolamento della sfera: v = √(10gh/7)', Math.sqrt(10 * g * 1.5 / 7), rf('rotolamento', { forma: 'sfera', h: 1.5, th: 20 }).v, 1e-12);
  vicino('giro della morte: h = 5R/2', 5, rf('giro', { R: 2, m: 1 }).h_min, 1e-12);
  vicino('Torricelli: v = √(2gh)', Math.sqrt(2 * g * 2), rf('torricelli', { h: 2, A: 1e-4 }).v, 1e-12);
  vicino('Venturi: la portata si conserva (A₂v₂ = A₁v₁)', 0.01 * 2, 0.004 * rf('venturi', {})['v₂'], 1e-12);
  vicino('isoterma: L = nRT ln 3', 8.314462618 * 300 * Math.log(3), rf('isoterma', {})['L = Q'], 1e-9);
  const ib = rf('isobara', { n: 2, gas: 'bi', T1: 300, T2: 400 });
  vicino('isobara: Q − L = ΔU (primo principio)', ib.ΔU, ib.Q - ib.L, 1e-9);
  vicino('adiabatica: T V^(γ−1) costante (γ = 7/5)', 300 * Math.pow(0.02, 0.4), rf('adiabatica', {})['T₂'] * Math.pow(0.01, 0.4), 1e-9);
  vicino('Carnot fra 500 e 300 K: η = 0,4', 0.4, rf('carnot', {}).η, 1e-12);
  const cm = rf('calorimetria', {});
  vicino('calorimetria: acqua 0,2 kg a 80 °C + 0,3 kg a 20 °C → 44 °C', 317, cm.T_e, 1e-9);
  vero('  · ΔS del mescolamento > 0', cm.ΔS > 0);
  vicino('ghiaccio: 50 g in 300 g a 40 °C → 22,9 °C (bilancio a mano)', (0.3 * 4186 * 40 - 0.05 * 333500) / (0.35 * 4186), rf('ghiaccio', {}).T, 1e-9);
  vicino('Coulomb: 3 μC e −5 μC a 20 cm → 3,37 N', 8.9875517923e9 * 15e-12 / 0.04, rf('coulomb', {}).F, 1e-3);
  vicino('Gauss: sfera uniforme dentro, E = kQr/R³', 8.9875517923e9 * 5e-9 * 0.1 / 0.008, rf('gauss', { tipo: 'sferapiena', Q: 5e-9, R: 0.2, r: 0.1 }).E, 1e-3);
  vicino('condensatore piano: C = ε₀A/d', 8.8541878128e-12 * 0.02 / 0.001, rf('condpiano', {}).C, 1e-20);
  const kr = rf('kirchhoff', { E1: 12, E2: 6, R1: 4, R2: 2, R3: 6 });
  /* Cramer sul sistema  R1 I1 + R3 I3 = E1 ; R2 I2 + R3 I3 = E2 ; I1 + I2 − I3 = 0 */
  const D = 4 * (2 * -1 - 6 * 1) - 0 + 6 * (0 * 1 - 2 * 1), D1 = 12 * (2 * -1 - 6) - 0 + 6 * (6 * 1 - 2 * 0);
  vicino('Kirchhoff: I₁ con la regola di Cramer', D1 / D, kr['I₁'], 1e-12);
  vicino('  · nodo: I₃ = I₁ + I₂', kr['I₁'] + kr['I₂'], kr['I₃'], 1e-12);
  vicino('RC: dopo τ la carica è Cℰ(1 − 1/e)', 100e-6 * 9 * (1 - Math.exp(-1)), rf('rc', { R: 10, C: 100, E: 9, t: 1 }).q, 1e-12);
  vicino('protone in 0,5 T a 2·10⁶ m/s: r = mv/qB', 1.673e-27 * 2e6 / (1.602e-19 * 0.5), rf('lorentz', {}).r, 1e-12);
  vicino('filo: B = μ₀I/(2πd) = 2·10⁻⁷·I/d', 2e-7 * 10 / 0.05, rf('filo', {}).B, 1e-15);
  vicino('barretta: P meccanica = ℰ²/R', 0.6 * 0.6 / 2, rf('barretta', {}).P, 1e-12);
  vicino('RL: dopo τ la corrente è (ℰ/R)(1 − 1/e)', 1.2 * (1 - Math.exp(-1)), rf('rl', { L: 50, R: 10, E: 12, t: 5 }).i, 1e-12);
  vicino('Snell: angolo limite vetro-aria arcsin(1/1,5)', Math.asin(1 / 1.5) * 180 / Math.PI, rf('snell', {})['θ_L'], 1e-9);
  vicino('lente: f = 10, p = 15 → q = 30 cm', 30, rf('lente', {}).q, 1e-9);
  vicino('Malus: 100 W/m² non polarizzati, 60° → 12,5', 12.5, rf('malus', {})['I₂'], 1e-12);
  let ptot = 0, pbuoni = 0;
  ['I', 'II'].forEach(k => EF.PROBLEMI[k].forEach(ap => ap.forEach(p => { ptot++; try { const r = EF.risolvi(p[0], p[1]); if (r.risultati.length && r.risultati.every(x => typeof x.v === 'number')) pbuoni++; } catch (e) { } })));
  att('tutte le prove svolte di Fisica hanno uno svolgimento', ptot, pbuoni);
  att('ogni modello del risolutore funziona con i dati predefiniti', EF.MODELLI.length, EF.MODELLI.filter(m => { try { return EF.risolvi(m.id, {}).risultati.length > 0; } catch (e) { return false; } }).length);
  vero('  · i modelli sono almeno 45', EF.MODELLI.length >= 45);

  console.log('\n── Chimica fisica ──');
  const EL = K.elettrodi, SU = K.superfici;
  const p = { i0: 2e-6, aa: 0.4, ac: 0.6, T: 298.15 }, dati = [-0.3, -0.25, -0.2, -0.15, 0.15, 0.2, 0.25, 0.3].map(e => [e, EL.butlerVolmer(e, p)]), tf = EL.tafel(dati, 298.15, 0.1);
  vicino('Tafel: α anodico ritrovato (0,4)', 0.4, tf.an.alfa, 2e-3);
  vicino('Tafel: i₀ ritrovata (2·10⁻⁶)', 2e-6, tf.an.i0, 2e-8);
  vicino('Tafel: pendenza anodica 2,303RT/(αF) = 147,8 mV/dec', 2.302585 * 8.314462618 * 298.15 / (0.4 * 96485.33212) * 1000, tf.an.pend, 0.5);
  const sint = [280, 300, 320, 340].map(T => [T, 1.380649e-23 * T / 6.62607015e-34 * Math.exp(-50 / 8.314462618) * Math.exp(-70000 / (8.314462618 * T))]), ey = EL.fitEyring(sint);
  vicino('Eyring: ΔH‡ ritrovato (70 kJ/mol)', 70000, ey.dH, 1e-6);
  vicino('Eyring: ΔS‡ ritrovato (−50 J/(mol·K))', -50, ey.dS, 1e-8);
  vicino('Eyring: Eₐ = ΔH‡ + RT medio', 70000 + 8.314462618 * 310, ey.Ea, 60);
  vicino('Eyring: k(80 kJ/mol, 298 K) = 0,05996 s⁻¹', 0.05996, EL.eyring(80000, 298.15), 1e-4);
  const bt = SU.bet([[0.05, 0.885], [0.10, 1.019], [0.15, 1.113], [0.20, 1.202], [0.25, 1.294], [0.30, 1.396], [0.35, 1.510], [0.5, 1.98]]);
  vicino('BET: n_m ritrovato (1,000 mmol/g)', 1, bt.nm, 2e-3);
  vicino('BET: c ritrovato (100)', 100, bt.c, 1);
  vicino('BET: area = n_m N_A σ = 97,6 m²/g', 1e-3 * 6.02214076e23 * 0.162e-18, bt.area, 0.3);
  att('BET usa solo 0,05 ≤ P/P₀ ≤ 0,35', 7, bt.usati);
  const lg = SU.langmuir([[5, 0.32], [10, 0.533], [20, 0.8], [40, 1.067], [80, 1.28], [160, 1.422]]);
  vicino('Langmuir: n_m = 1,6', 1.6, lg.nm, 2e-3);
  vicino('Langmuir: K = 0,05 kPa⁻¹', 0.05, lg.K, 2e-4);
  const md = SU.medie([[10000, 1], [20000, 3], [30000, 4], [40000, 2], [50000, 1]]);
  vicino('Mn a mano = 320000/11', 320000 / 11, md.Mn, 1e-6);
  vicino('Mw a mano = 1,06·10¹⁰/320000', 1.06e10 / 320000, md.Mw, 1e-6);
  vicino('Carothers p = 0,99: X̄n = 100, Đ = 1,99', 100, SU.carothers(0.99).Xn, 1e-9);
  const ff = SU.fotofisica({ kf: 1e8, kic: 2e7, kisc: 5e7, kq: 1e10, Q: 0.001, kp: 100, knrT: 1000 });
  vicino('fotofisica: le rese da S₁ sommano a 1', 1, ff.phiF + ff.phiIC + ff.phiISC + ff.phiQ, 1e-12);
  vicino('Stern-Volmer: K_SV dai dati ≈ 101,7 M⁻¹', 101.714, SU.sternVolmer([[0, 1], [0.002, 1.21], [0.004, 1.4], [0.006, 1.62], [0.008, 1.81], [0.01, 2.02]], 10e-9).Ksv, 0.01);

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const SEZ = [[7, 'selettrodi'], [7, 'sfotosup'], [7, 'sfisesame'], [8, 'smatesame']];
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') err.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async (SEZ) => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const out = {};
      for (const [grp, s] of SEZ) {
        document.querySelector('.nav-group-tab[data-group="' + grp + '"]').click();
        const b = document.querySelector('#navGroup' + grp + ' .nav-btn[data-s="' + s + '"]');
        if (!b) { out[s] = { manca: true }; continue; }
        b.click(); await new Promise(r => setTimeout(r, 1000));
        const sec = document.getElementById(s), sch = sec.querySelectorAll('.bsiFX-schede button');
        let piene = 0, avvisi = 0, tele = 0, disegnate = 0;
        for (let i = 0; i < sch.length; i++) {
          sch[i].click(); await new Promise(r => setTimeout(r, 2200));
          const p = [...sec.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent);
          if (p && p.textContent.length > 100) piene++;
          if (p && /⚠/.test(p.textContent)) avvisi++;
          sec.querySelectorAll('canvas').forEach(c => { if (!c.offsetParent) return; tele++; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 0; k < d.length; k += 4 * 97) if (d[k] + d[k + 1] + d[k + 2] > 120) n++; if (n > 5) disegnate++; });
        }
        out[s] = { schede: sch.length, piene, avvisi, tele, disegnate, sborda: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      }
      /* un appello di matematica: si apre e lo svolgimento compare */
      document.querySelector('.nav-group-tab[data-group="8"]').click();
      document.querySelector('.nav-btn[data-s="smatesame"]').click(); await new Promise(r => setTimeout(r, 400));
      const sm = document.getElementById('smatesame'); sm.querySelectorAll('.bsiFX-schede button')[2].click(); await new Promise(r => setTimeout(r, 400));
      const pan = [...sm.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), det = pan.querySelector('details'); det.open = true;
      det.querySelector('.bsiFX-bott').click(); await new Promise(r => setTimeout(r, 2500));
      out.appello = /Risultato/.test(det.textContent) && /Dominio|Segno|Asintoti/.test(det.textContent);
      /* il risolutore di fisica risponde a un dato nuovo */
      document.querySelector('.nav-group-tab[data-group="7"]').click();
      document.querySelector('.nav-btn[data-s="sfisesame"]').click(); await new Promise(r => setTimeout(r, 400));
      const sf = document.getElementById('sfisesame'); sf.querySelectorAll('.bsiFX-schede button')[1].click(); await new Promise(r => setTimeout(r, 400));
      const pf = [...sf.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), inp = pf.querySelector('input[type=text]'); inp.value = '30'; inp.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 300));
      out.fisica = /30 m\/s/.test(pf.textContent);
      return out;
    }, SEZ);
    console.log('── ' + nome + ' ──');
    for (const [, s] of SEZ) {
      const x = r[s];
      att(s + ': ogni scheda ha contenuto, nessun avviso, le tele disegnano', true, !!x && !x.manca && x.piene === x.schede && x.avvisi === 0 && x.disegnate === x.tele);
      if (nome === 'telefono') att('  · a 390 px niente sborda', 0, x.sborda);
    }
    if (nome === 'schermo grande') { att('un appello di matematica mostra lo svolgimento', true, r.appello); att('il risolutore di fisica rifà i conti con il dato nuovo', true, r.fisica); }
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
    await new Promise(r => setTimeout(r, 1500));
    return [document.querySelector('.nav-btn[data-s="smatesame"]').textContent.trim(), document.querySelector('.nav-btn[data-s="sfisesame"]').textContent.trim(), document.querySelector('.nav-btn[data-s="selettrodi"]').textContent.trim()];
  });
  att('in inglese: «Mathematics exam (UniBA)», «Physics exam (UniBA)», «Electrodes and transition state»', '🎓 Mathematics exam (UniBA)|🎓 Physics exam (UniBA)|⚡ Electrodes and transition state', tr.join('|'));
  await ctxE.close();
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
