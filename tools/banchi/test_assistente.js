#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_assistente — le tre macro-aree e il loro assistente

   PERCHE' QUESTO BANCO ESISTE

   L'assistente legge una domanda scritta come la si scrive al professore e
   sceglie da solo il metodo, i dati e le unita'. Ogni passaggio puo'
   sbagliare in silenzio: un «M» letto come metri, un «carbonio 14» preso
   per un dato, un problema di relativita' risolto come un proiettile. Una
   risposta sbagliata ma ben impaginata e' la peggiore possibile. Qui:

   · per ogni domanda si controlla CHE COSA ha capito (tipo di esercizio o
     modello) e il RISULTATO, confrontato con un valore ottenuto per altra
     via: a mano, con SymPy al momento di scrivere il banco, o rifatto qui
     con una formula diversa (gittata v₀²sin2θ/g, pV = nRT, Henderson…);
   · le unita': km/h, mL, μC, nm, eV, masse solari, °C, percentuali;
   · il problema inverso («quanti grammi servono…»);
   · le aggiunte al motore simbolico (integrali trigonometrici, e^(c·ln u),
     frazioni di polinomi), verificate derivando;
   · nel browser: le tre aree si aprono, l'assistente risponde a una
     domanda scritta nella casella, il catalogo raccoglie gli strumenti della
     barra, i livelli portano alle sezioni, i tre strumenti di Spectra
     rispondono, niente sborda a 390 px, i nomi sono tradotti.

   USO   node tools/banchi/test_assistente.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright-core');

const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MINIMO = 140;

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vicino(d, atteso, avuto, tol) {
  eseguiti++;
  if (Math.abs(avuto - atteso) <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+(+avuto).toPrecision(10)) + ' (atteso ' + (+atteso.toPrecision(10)) + ' ± ' + tol + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tol + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

function carica() {
  const ctx = { console, Math, Float64Array, Int32Array, Date, Number, Array, Object, String, JSON, isFinite, Infinity, NaN, BigInt, setTimeout, clearTimeout, RegExp };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({ style: {} }), querySelector: () => null, querySelectorAll: () => [] };
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  ['bsi-fisica-comune.js', 'bsi-mat-cas.js', 'bsi-mat-basi.js', 'bsi-mat-lineare.js', 'bsi-mat-funzioni.js', 'bsi-mat-multi.js', 'bsi-mat-complessi.js', 'bsi-mat-risolutore.js',
   'bsi-fis-esame.js', 'bsi-chi-esame.js', 'bsi-percorsi.js', 'bsi-assistente.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx;
}

(async () => {
  const W = carica(), A = W.BSIAssistente, C = W.BSIMatCAS;
  const chiedi = (q, m) => A.rispondi(q, m) || {};
  const val = (r, nome) => { const x = (r.risultati || []).filter(y => y.nome === nome)[0]; return x ? x.v : NaN; };
  const g = 9.81;

  console.log('── Il motore simbolico: le aggiunte (ogni primitiva e\' verificata derivando) ──');
  const prim = e => { const I = C.integra(C.leggi(e), 'x'); return I ? C.stampa(I) : null; };
  const derivaDiNuovo = (e) => { const f = C.leggi(e), I = C.integra(f, 'x'); if (!I) return false; const d = C.compila(C.deriva(I, 'x')), ff = C.compila(f); return [0.3, 0.9, 1.7, 2.6, -1.1].every(x => Math.abs(d({ x }) - ff({ x })) < 1e-9); };
  for (const e of ['sin(x)^2', 'cos(3x)^2', 'sin(x)^4', 'sin(x)^3', 'cos(x)^5', 'sin(3x)*cos(2x)', 'sin(x)*sin(2x)', 'cos(x)*cos(4x)', 'sin(x)^2*cos(x)^2', 'x*sin(x)^2', 'sin(2x)^2*cos(x)'])
    vero('∫ ' + e + ' dx: esiste e la sua derivata ridà la funzione', derivaDiNuovo(e));
  att('∫ sin²x dx = x/2 − sin(2x)/4', 'x/2 − sin(2x)/4', prim('sin(x)^2'));
  att('∫ sin³x dx = cos³x/3 − cos x', 'cos(x)³/3 − cos(x)', prim('sin(x)^3'));
  att('e^(−ln x) = 1/x', '1/x', C.stampa(C.leggi('e^(-ln(x))')));
  att('e^(2 ln x + x) = x²·eˣ', 'x²·e^x', C.stampa(C.leggi('e^(2*ln(x)+x)')));
  att('e^(ln(x)/2) = √x', '√x', C.stampa(C.leggi('e^(ln(x)/2)')));

  console.log('\n── Matematica: domande in linguaggio naturale ──');
  const M = q => chiedi(q, 'matematica');
  let r;
  r = M('studia la funzione (x^2+1)/(x^2-1)'); att('«studia la funzione…» → studio di funzione', 'studio', r.tipo);
  r = M('integra x*e^x da 0 a 1'); att('∫₀¹ x·eˣ dx = 1', 'integraleDefinito|1', r.tipo + '|' + r.risultato);
  r = M('integrale definito di x^2 da 0 a 3'); att('∫₀³ x² dx = 9', '9', r.risultato);
  r = M('integrate e^(-x^2) from -inf to inf'); vero('in inglese: ∫ e^(−x²) su ℝ ≈ √π = 1,7724538509', /1\.77245385/.test(r.risultato));
  r = M('∫ sin(x)^2 dx'); att('∫ sin²x dx (bisezione)', 'x/2 − sin(2x)/4 + c', r.risultato);
  r = M('integrale di 1/(x^2-1)'); att('∫ 1/(x² − 1) dx (fratti semplici)', 'ln(|x − 1|)/2 − ln(|x + 1|)/2 + c', r.risultato);
  r = M('limite di (sin(x)-x)/x^3 per x che tende a 0'); att('lim (sin x − x)/x³ = −1/6 (SymPy)', '−1/6', r.risultato);
  r = M('limite per x che tende a 0 di sin(x)/x'); att('«limite per x che tende a 0 di …» (ordine invertito)', 'limite|1', r.tipo + '|' + r.risultato);
  r = M('lim x->inf (1+1/x)^x'); att('lim (1 + 1/x)^x per x → ∞ = e', 'e', r.risultato);
  r = M('deriva x^2*sin(3x)'); att('d/dx x²·sin 3x', '3x²·cos(3x) + 2x·sin(3x)', r.risultato);
  r = M('calcola la derivata di ln(x^2+1)'); att('d/dx ln(x² + 1)', '2x/(x² + 1)', r.risultato);
  r = M('differentiate sin(x)*cos(x)'); att('in inglese: d/dx sin x cos x', 'cos(x)² − sin(x)²', r.risultato);
  r = M("y'' - 3y' + 2y = e^x, y(0)=0, y'(0)=1"); att("y″ − 3y′ + 2y = eˣ, y(0)=0, y′(0)=1 (SymPy: 2e^{2x} − 2eˣ − x eˣ)", '−x·e^x + 2·e^(2x) − 2·e^x', r.risultato);
  r = M("y'' + 4y = 0, y(0)=1, y'(0)=0"); att('y″ + 4y = 0 → cos 2x', 'cos(2x)', r.risultato);
  r = M('2y\'\' = -8y + sin(x)'); att('termini sparsi nei due membri: 2y″ + 8y = sin x → particolare sin x/6', 'c1·cos(2x) + c2·sin(2x) + sin(x)/6', r.risultato);
  r = M("y' + 2y = 4, y(0)=0"); att("y′ + 2y = 4, y(0) = 0 → 2 − 2e^(−2x)", '−2·e^(−2x) + 2', r.risultato);
  r = M("x*y' = y + x^2"); att("x·y′ = y + x² (lineare, fattore e^(−ln x) = 1/x)", 'x² + c·x', r.risultato);
  r = M("y' = x*y, y(0)=1"); att("y′ = xy, y(0) = 1 → e^(x²/2)", 'separabile|y = e^(x²/2)', r.tipo + '|' + r.risultato);
  r = M('dy/dx = y^2'); att('dy/dx = y² (separabile)', 'y = −1/(c + x)', r.risultato);
  r = M("risolvi l'equazione y'' - y = x"); att("«risolvi l'equazione y″ − y = x»: riconosciuta come EDO", 'secondoOrdine', r.tipo);
  r = M('serie di n!/n^n'); att('Σ n!/nⁿ converge (rapporto → 1/e)', 'converge', r.risultato);
  r = M('serie di 1/n^2'); att('Σ 1/n² converge', 'converge', r.risultato);
  r = M('raggio di convergenza della serie di potenze x^n/n'); att('Σ xⁿ/n: insieme di convergenza [−1, 1)', 'seriePotenze|[−1, 1)', r.tipo + '|' + r.risultato);
  r = M('autovalori di [[2,1],[1,2]]'); att('autovalori di [[2,1],[1,2]] (la virgola separa, non è decimale)', '1, 3', r.risultato);
  r = M('autovalori della matrice [[4,1],[2,3]]'); att('autovalori di [[4,1],[2,3]]', '2, 5', r.risultato);
  r = M('risolvi x^3 - 6x^2 + 11x - 6 = 0'); att('x³ − 6x² + 11x − 6 = 0', '1; 2; 3', r.risultato);
  r = M('z^3 = 8'); att('z³ = 8: tre radici', '2; −1 + √3i; −1 − √3i', r.risultato);
  r = M('taylor di e^x*sin(x) ordine 5'); att('Taylor di eˣ sin x al quinto ordine (SymPy)', 'x + x² + (1/3)·x³ − (1/30)·x⁵', r.risultato);
  r = M('residui 1/(x^4+1)'); att('∫ 1/(x⁴ + 1) su ℝ = π/√2 con i residui', '√2/2·π', r.risultato);
  r = M('laplace di t*e^(2t)'); att('L{t e^{2t}} = 1/(s − 2)²', '1/(s − 2)²', r.risultato);
  r = M('dominio di sqrt(4-x^2)/ln(x)'); att('dominio √(4 − x²)/ln x', '[0, 1) ∪ (1, 2]', r.risultato);
  r = M('semplifica (x^2-1)/(x-1)'); att('(x² − 1)/(x − 1) = x + 1 (MCD di Euclide)', 'x + 1', r.risultato);
  r = M('semplifica (x^2-1)/(x^2-2x+1)'); att('(x² − 1)/(x − 1)² = (x + 1)/(x − 1)', '(x + 1)/(x − 1)', r.risultato);
  r = M('2^10'); att('un numero: 2¹⁰', '1024', r.risultato);

  console.log('\n── Fisica: modello scelto, dati letti, risultato rifatto per altra via ──');
  const P = q => chiedi(q, 'fisica');
  r = P('un proiettile è lanciato a 25 m/s con un angolo di 40°');
  att('proiettile', 'proiettile', r.tipo); vicino('gittata = v₀² sin 2θ / g', 25 * 25 * Math.sin(80 * Math.PI / 180) / g, val(r, 'R'), 1e-6);
  r = P('a ball is launched at 30 m/s at 45°'); att('in inglese: «a ball is launched…» → proiettile', 'proiettile', r.tipo); vicino('gittata a 45°: v₀²/g', 900 / g, val(r, 'R'), 1e-6);
  r = P("un'auto viaggia a 90 km/h e frena con decelerazione 5 m/s²");
  att('«frena»: accelerazione negativa e tempo fino all\'arresto', 'mua|-5|5', r.tipo + '|' + r.dati.dati.a + '|' + r.dati.dati.t);
  vicino('90 km/h = 25 m/s; spazio di arresto v²/2a = 62,5 m', 62.5, val(r, 'x'), 1e-9);
  r = P("un sasso cade da un'altezza di 45 m"); att('«cade»: velocità iniziale nulla', 0, r.dati.dati.v0); vicino('tempo di caduta √(2h/g)', Math.sqrt(90 / g), val(r, 'tempo'), 1e-9);
  r = P('un blocco di 5 kg su un piano inclinato di 30° con μ_s = 0,4 e μ_d = 0,3'); att('piano inclinato', 'piano', r.tipo); vicino('a = g(sin θ − μ_d cos θ)', g * (Math.sin(Math.PI / 6) - 0.3 * Math.cos(Math.PI / 6)), val(r, 'a'), 1e-9);
  r = P('pendolo lungo 2 m'); att('pendolo', 'pendolo', r.tipo); vicino('T ≈ 2π√(L/g) (piccole oscillazioni, 10° di ampiezza: +0,19 %)', 2 * Math.PI * Math.sqrt(2 / g), val(r, 'T'), 0.01);
  r = P('molla di costante 200 N/m con massa 0,5 kg'); vicino('molla: T = 2π√(m/k)', 2 * Math.PI * Math.sqrt(0.5 / 200), val(r, 'T'), 1e-9);
  r = P('un satellite in orbita circolare di raggio 6,771e6 m attorno a M = 5,972e24 kg'); att('orbita', 'orbita', r.tipo); vicino('v = √(GM/r)', Math.sqrt(6.6743e-11 * 5.972e24 / 6.771e6), val(r, 'v'), 1);
  r = P('2 mol di gas biatomico scaldate a pressione costante da 300 K a 400 K'); att('isobara, gas biatomico', 'isobara|bi', r.tipo + '|' + r.dati.dati.gas); vicino('Q = n·(7/2)R·ΔT', 2 * 3.5 * 8.314462618 * 100, val(r, 'Q'), 0.5);
  r = P('rendimento di una macchina di Carnot tra 600 K e 300 K'); vicino('Carnot: η = 1 − T₂/T₁', 0.5, val(r, 'η'), 1e-12);
  r = P('due cariche di 3 μC e -5 μC a 0,2 m'); att('μC convertiti nei nC del modello', '3000|-5000', Math.round(r.dati.dati.q1) + '|' + Math.round(r.dati.dati.q2));
  r = P('resistenze di 100 Ω e 200 Ω in parallelo'); att('due resistenze in parallelo: la terza non c\'è', 'parallelo', r.dati.dati.schema); vicino('R_eq = R₁R₂/(R₁ + R₂)', 200 / 3, val(r, 'R_eq'), 1e-9);
  r = P('un elettrone in un campo magnetico di 0,01 T con velocità 1e6 m/s'); att('«un elettrone»: carica e massa dell\'elettrone', 'lorentz|9.1093837e-31', r.tipo + '|' + r.dati.dati.m); vicino('r = mv/(qB)', 9.1093837e-31 * 1e6 / (1.602176634e-19 * 0.01), val(r, 'r'), 1e-9);
  r = P('lente con focale 10 cm e oggetto a 30 cm'); vicino('lente: 1/q = 1/f − 1/p → 15 cm', 15, val(r, 'q'), 1e-9);
  r = P('doppia fenditura di Young con λ = 600 nm, d = 0,1 mm, L = 2 m'); att('Young', 'young', r.tipo); vicino('interfrangia λL/d = 12 mm', 0.012, val(r, 'Δy'), 1e-12);
  r = P('effetto fotoelettrico con luce di 250 nm e lavoro di estrazione 4,3 eV'); vicino('K = hc/λ − W', 1239.84198 / 250 - 4.3, val(r, 'K'), 1e-4);
  r = P('effetto Doppler di una sirena a 500 Hz che si avvicina a 30 m/s'); vicino('f′ = f·v/(v − v_s)', 500 * 343 / 313, val(r, 'f′'), 1e-6);
  r = P('dilatazione del tempo a 0,8c'); att('«0,8c» → relatività, β = 0,8', 'relativita|0.8', r.tipo + '|' + r.dati.dati.beta); vicino('γ = 1/√(1 − β²) = 5/3', 5 / 3, val(r, 'γ'), 1e-12);
  r = P('datazione al carbonio 14 di un reperto con 30% di attività'); att('«carbonio 14» non è un dato; 30 % → 0,3', 'datazione|0.3', r.tipo + '|' + r.dati.dati.f); vicino('t = t½·log₂(1/0,3)', 5730 * Math.log2(1 / 0.3), val(r, 't'), 1e-6);
  r = P('buco nero di 10 masse solari, raggio di Schwarzschild'); att('«10 masse solari»', 'schwarzschild|10', r.tipo + '|' + r.dati.dati.M); vicino('R_s = 2GM/c²', 2 * 6.6743e-11 * 10 * 1.98892e30 / 299792458 ** 2, val(r, 'R_s'), 30);
  r = P('una stella di 9940 K con raggio 1,71 R☉'); vicino('Sirio A: L/L☉ = (R/R☉)²(T/T☉)⁴ ≈ 25,7', 25.7, val(r, 'L/L☉'), 0.3);
  r = P('energia di legame del nucleo con Z = 26, A = 56, massa 55,934936 u'); vicino('⁵⁶Fe: B/A = 8,79 MeV', 8.790, val(r, 'B/A'), 2e-3);
  r = P('particella in una scatola di 1 nm'); vicino('elettrone in 1 nm: E₁ = h²/(8mL²) = 0,376 eV', 0.37603, val(r, 'Eₙ'), 1e-3);

  console.log('\n── Chimica ──');
  const Q = q => chiedi(q, 'chimica');
  const hh = (ka, c) => { const x = (-ka + Math.sqrt(ka * ka + 4 * ka * c)) / 2; return -Math.log10(x); };
  r = Q('calcola il pH di una soluzione 0,1 M di acido acetico con Ka = 1,8e-5'); att('«0,1 M» è una concentrazione (non 0,1 metri)', 'acidodebole|0.1', r.tipo + '|' + r.dati.dati.C); vicino('pH dall\'equazione di secondo grado', hh(1.8e-5, 0.1), val(r, 'pH'), 1e-3);
  r = Q('pH di HCl 0,01 M'); att('acido forte', 'phforte', r.tipo); vicino('pH = 2', 2, val(r, 'pH'), 1e-9);
  r = Q('pH di una soluzione 0,2 M di ammoniaca, Kb = 1,8e-5'); att('base debole', 'basedebole', r.tipo); vicino('pOH dalla Kb, pH = 14 − pOH', 14 - hh(1.8e-5, 0.2), val(r, 'pH'), 2e-3);
  r = Q('tampone con 0,1 M di acido acetico e 0,15 M di acetato, pKa 4,76'); att('tampone: le concentrazioni diventano moli su 1 L', 'tampone|0.1|0.15', r.tipo + '|' + r.dati.dati.na + '|' + r.dati.dati.nb); vicino('Henderson-Hasselbalch', 4.76 + Math.log10(1.5), val(r, 'pH'), 1e-9);
  r = Q('Al + Cl2 -> AlCl3 con Al: 10 g e Cl2: 30 g, reagente limitante'); att('reazione e masse lette dal testo', 'Al + Cl2 -> AlCl3|Al: 10, Cl2: 30|AlCl3', r.dati.dati.rx + '|' + r.dati.dati.masse + '|' + r.dati.dati.prod);
  vicino('2Al + 3Cl₂ → 2AlCl₃: limitante il cloro, AlCl₃ teorico = 30/70,906·(2/3)·133,34', 30 / 70.906 * 2 / 3 * 133.34, val(r, 'm_teorica'), 0.05);
  r = Q('massa molare di Ca3(PO4)2 e moli in 10 g'); vicino('M(Ca₃(PO₄)₂) = 310,17 g/mol', 310.17, val(r, 'M'), 0.01);
  r = Q('solubilità di AgCl con Ksp = 1,8e-10'); vicino('s = √Ksp', Math.sqrt(1.8e-10), val(r, 's'), 1e-12);
  r = Q('pila con E° catodo 0,34 V e anodo -0,76 V, n = 2'); vicino('E° = 0,34 − (−0,76) = 1,10 V', 1.1, val(r, 'E°'), 1e-12);
  r = Q('titolazione di 25 mL di acido debole 0,1 M (Ka = 1,8e-5) con NaOH 0,1 M dopo 12,5 mL'); att('tutti e cinque i dati dal testo', 'titolazione|5', r.tipo + '|' + Object.values(r.dati.origine).filter(o => o === 'testo').length); vicino('a metà titolazione pH = pKa', -Math.log10(1.8e-5), val(r, 'pH'), 2e-3);
  r = Q('punto isoelettrico di un amminoacido con pKa 2,19, 9,67, 4,25'); att('la lista dei pKa letta per intero', '2.19, 9.67, 4.25', r.dati.dati.pk); vicino('acido glutammico: pI = (2,19 + 4,25)/2', 3.22, val(r, 'pI'), 1e-9);
  r = Q('gradi di insaturazione di C8H9NO2'); vicino('paracetamolo: DBE = 5', 5, val(r, 'DBE'), 1e-12);
  r = Q('emivita di una reazione del primo ordine con k = 0,05 s⁻¹'); vicino('t½ = ln 2/k', Math.LN2 / 0.05, val(r, 't½'), 1e-9);
  r = Q('energia di attivazione da k1 = 0,01 a 300 K e k2 = 0,05 a 320 K'); vicino('Eₐ = R ln(k₂/k₁)/(1/T₁ − 1/T₂)', 8.314462618 * Math.log(5) / (1 / 300 - 1 / 320) / 1000, val(r, 'Eₐ'), 0.01);
  r = Q('CH4 + O2 -> CO2 + H2O entalpia di reazione'); vicino('combustione del metano: ΔH° = −890,3 kJ/mol', -890.3, val(r, 'ΔH°'), 0.05);
  r = Q('assorbanza 0,5 con ε = 15000 e cammino 1 cm, concentrazione?'); att('Beer-Lambert', 'beer', r.tipo); vicino('c = A/(εl)', 0.5 / 15000, val(r, 'c'), 1e-12);
  r = Q('elettrolisi: 2 A per 30 min, quanti grammi di Cu si depositano?'); att('«2 A» è una corrente, «30 min» un tempo', '2|30', r.dati.dati.I + '|' + r.dati.dati.t); vicino('m = I·t·M/(nF)', 2 * 1800 * 63.546 / (2 * 96485.33212), val(r, 'm'), 1e-3);
  r = Q('transizione di Bohr da n = 3 a n = 2'); att('n iniziale e finale da due «n =»', '3|2', r.dati.dati.ni + '|' + r.dati.dati.nf); vicino('Hα = 656 nm', 656.1, val(r, 'λ'), 0.3);
  r = Q('formula minima con C: 40, H: 6,71, O: 53,29'); vicino('glucosio: unità CH₂O = 30,03', 30.026, val(r, 'formula minima CH₂O'), 0.01);
  r = Q('resa complessiva di una sintesi in 4 stadi con rese 85, 70, 92 e 60 %'); vicino('resa = prodotto delle rese', 85 * 70 * 92 * 60 / 1e6, val(r, 'resa'), 1e-9);

  console.log('\n── Il problema inverso ──');
  r = Q('quanti grammi di NaCl servono per 250 mL di soluzione 0,5 M'); att('si risolve per la massa del soluto', 'soluzioni|calcolato', r.tipo + '|' + r.dati.origine.ms); vicino('m = c·V·M = 0,5·0,25·58,44', 0.5 * 0.25 * 58.44, r.dati.dati.ms, 0.01);
  r = Q('2 mol di gas a 300 K in 10 L, che pressione?'); att('si risolve per la pressione', 'calcolato', r.dati.origine.p); vicino('p = nRT/V', 2 * 0.0820574 * 300 / 10, r.dati.dati.p, 1e-3);
  vero('lo svolgimento dichiara il problema inverso', r.passi && /inverso|Inverse/.test(r.passi[0].titolo));

  console.log('\n── Unità e lettura dei numeri ──');
  const u = s => A.quantita(s).map(q => q.dim + ':' + (+(q.v * q.fat).toPrecision(6))).join(' ');
  att('km/h, mL, μC, nm, eV', 'v:25 V:0.000025 Q:0.000003 L:5e-7 eV:2.5', u('90 km/h, 25 mL, 3 μC, 500 nm, 2,5 eV'));
  att('M maiuscola = molare, m minuscola = metri', 'c:0.1 L:0.1', u('0,1 M e 0,1 m'));
  att('notazione scientifica: 1,8·10⁻⁵ e 6,02x10^23', '0.000018|6.02e+23', A.quantita('1,8·10⁻⁵ e 6,02x10^23').map(q => q.v).join('|'));
  vero('una domanda vuota non dà risposta', A.rispondi('   ', 'fisica') === null);
  vero('una domanda senza senso non inventa un modello', !(A.rispondi('ciao come stai', 'matematica') || {}).titolo);

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const AREE = [[0, 'sareachim'], [7, 'sareafis'], [8, 'sareamat']];
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') err.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r2 = await pg.evaluate(async (AREE) => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms));
      const out = {};
      const DOMANDE = { sareachim: 'calcola il pH di una soluzione 0,1 M di acido acetico con Ka = 1,8e-5', sareafis: 'un proiettile è lanciato a 25 m/s con un angolo di 40°', sareamat: 'integra x*e^x da 0 a 1' };
      for (const [grp, s] of AREE) {
        document.querySelector('.nav-group-tab[data-group="' + grp + '"]').click();
        const b = document.querySelector('#navGroup' + grp + ' .nav-btn[data-s="' + s + '"]');
        if (!b) { out[s] = { manca: true }; continue; }
        const primo = [...document.querySelectorAll('#navGroup' + grp + ' .nav-btn')].indexOf(b) <= (grp === 0 ? 2 : 0); /* in Chimica vengono prima la Dashboard e gli Articoli, che un modulo inserisce al caricamento */
        b.click(); await pausa(800);
        const sec = document.getElementById(s), sch = sec.querySelectorAll('.bsiFX-schede button');
        const vis = () => [...sec.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent);
        /* l'assistente: si scrive la domanda e si preme il pulsante */
        sch[0].click(); await pausa(300);
        const ta = vis().querySelector('textarea'); ta.value = DOMANDE[s];
        [...vis().querySelectorAll('button')].find(x => /Risolvi e spiega|Solve and explain/.test(x.textContent)).click(); await pausa(800);
        const risposta = vis().textContent;
        /* il catalogo */
        sch[1].click(); await pausa(400);
        const strumenti = vis().querySelectorAll('.bsiFX-bott').length;
        const cerca = vis().querySelector('input'); cerca.value = s === 'sareamat' ? 'integrali' : s === 'sareafis' ? 'Schr' : 'Titolazione'; cerca.dispatchEvent(new Event('input')); await pausa(200);
        const filtrati = vis().querySelectorAll('.bsiFX-bott').length;
        /* i livelli */
        sch[2].click(); await pausa(400);
        const livelli = vis().querySelectorAll('.bsiFX-pannello').length, vai = vis().querySelectorAll('.bsiFX-bott').length;
        out[s] = { primo, schede: sch.length, risposta: risposta.slice(0, 4000), strumenti, filtrati, livelli, vai, sborda: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      }
      /* un pulsante del catalogo apre davvero la sezione */
      document.querySelector('.nav-group-tab[data-group="8"]').click(); document.querySelector('.nav-btn[data-s="sareamat"]').click(); await pausa(400);
      const sm = document.getElementById('sareamat'); sm.querySelectorAll('.bsiFX-schede button')[1].click(); await pausa(300);
      const pc = [...sm.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent); const c0 = pc.querySelector('input'); c0.value = 'Algebra'; c0.dispatchEvent(new Event('input')); await pausa(100);
      [...pc.querySelectorAll('.bsiFX-bott')].find(x => /Algebra lineare|Linear algebra/.test(x.textContent)).click(); await pausa(800);
      const lin = document.getElementById('smatlin'); out.apre = !!lin && lin.offsetParent !== null;
      /* gli strumenti di Spectra */
      const T = window.BSI_AI_TOOLS || [], trova = n => T.filter(x => x.name === n)[0];
      const sm2 = trova('risolvi_matematica'), sf = trova('risolvi_fisica'), sc = trova('risolvi_chimica');
      out.spectra = {
        n: T.length,
        mat: sm2 ? sm2.execute({ domanda: 'limite di (1-cos(x))/x^2 per x che tende a 0' }) : null,
        fis: sf ? sf.execute({ modello: 'proiettile', dati: { v0: 20, th: 45, h: 0 } }) : null,
        chi: sc ? sc.execute({ domanda: 'quanti grammi di NaCl servono per 250 mL di soluzione 0,5 M' }) : null,
        ignoto: sf ? sf.execute({ modello: 'nonesiste' }) : null
      };
      return out;
    }, AREE);
    console.log('── ' + nome + ' ──');
    for (const [, s] of AREE) {
      const x = r2[s];
      vero(s + ': c\'è, è in testa alla sua categoria, ha tre schede', x && !x.manca && x.primo && x.schede === 3);
      if (!x || x.manca) continue;
      if (nome === 'schermo grande') {
        vero(s + ': l\'assistente risponde con lo svolgimento', s === 'sareachim' ? /pH di un acido debole[\s\S]*2[,.]875/.test(x.risposta) : s === 'sareafis' ? /Moto del proiettile[\s\S]*62[,.]74/.test(x.risposta) : /Integrale definito[\s\S]*Risultato/.test(x.risposta));
        vero(s + ': il catalogo raccoglie gli strumenti della materia (' + x.strumenti + ')', x.strumenti >= (s === 'sareachim' ? 60 : s === 'sareafis' ? 15 : 10));
        vero(s + ': la ricerca filtra (' + x.filtrati + ')', x.filtrati >= 1 && x.filtrati < x.strumenti);
        att(s + ': quattro livelli, dalle superiori al dottorato', 4, x.livelli);
        vero(s + ': i livelli portano alle sezioni (' + x.vai + ' pulsanti)', x.vai >= 8);
      } else att(s + ': a 390 px niente sborda', 0, x.sborda);
    }
    if (nome === 'schermo grande') {
      vero('un pulsante del catalogo apre la sezione', r2.apre);
      const S2 = r2.spectra;
      att('Spectra ha i tre strumenti nuovi (38 in tutto)', 38, S2.n);
      vero('risolvi_matematica: lim (1 − cos x)/x² = 1/2 con lo svolgimento', S2.mat && S2.mat.ok && S2.mat.risultato === '1/2' && S2.mat.svolgimento.length > 1);
      vero('risolvi_fisica con modello e dati espliciti: gittata v₀²/g', S2.fis && S2.fis.ok && Math.abs(S2.fis.risultati.filter(y => y.nome === 'R')[0].valore - 400 / 9.81) < 1e-6);
      vero('risolvi_chimica risolve il problema inverso (7,3 g di NaCl)', S2.chi && S2.chi.ok && Math.abs(S2.chi.dati.ms.valore - 7.305) < 0.01 && S2.chi.dati.ms.origine === 'calcolato');
      vero('un modello inesistente dà un errore con l\'elenco dei modelli', S2.ignoto && S2.ignoto.ok === false && S2.ignoto.modelli.length > 80);
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
    await new Promise(r => setTimeout(r, 1500));
    return ['sareachim', 'sareafis', 'sareamat'].map(s => document.querySelector('.nav-btn[data-s="' + s + '"]').textContent.trim());
  });
  att('in inglese: le tre aree', '⚗️ Chemistry area · assistant|⚛️ Physics area · assistant|📐 Mathematics area · assistant', tr.join('|'));
  await ctxE.close();
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
