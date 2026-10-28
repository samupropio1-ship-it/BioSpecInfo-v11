/* verifica di bsi-fis-statistica.js (F.calcolo.statistica) */
var C = require('./carica.js')(['bsi-fis-statistica.js']), S = C.statistica, K = S.costanti;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var PI = Math.PI;

/* 1. livelli */
var L2 = S.livelli('due'), maxd = 0;
[0.1, 0.3, 0.5, 1, 2, 4].forEach(function (tau) { maxd = Math.max(maxd, Math.abs(S.termo(L2, tau).C - S.schottky(1 / tau))); });
ok('due livelli: C da varianza = x²eˣ/(1+eˣ)²', maxd.toExponential(2), maxd < 1e-12);
var md = 0;
[0.2, 0.5, 1.3, 3].forEach(function (tau) { var h = 1e-5, dU = (S.termo(L2, tau + h).U - S.termo(L2, tau - h).U) / (2 * h); md = Math.max(md, Math.abs(dU - S.termo(L2, tau).C)); });
ok('C = dU/dT (derivata numerica) = varianza/kT²', md.toExponential(2), md < 1e-8);
var pk = S.schottkyPicco();
ok('picco di Schottky: kT = 0,4168 Δ, C = 0,4392 k', pk.tau.toFixed(5) + ', ' + pk.C.toFixed(5), Math.abs(pk.tau - 0.41678) < 2e-4 && Math.abs(pk.C - 0.43923) < 2e-4);
/* condizione analitica del massimo: d/dx [x² eˣ/(1+eˣ)²] = 0 ⇔ x tanh(x/2) = 2 */
var x = 1 / pk.tau;
ok('al picco x tanh(x/2) = 2 (condizione esatta)', (x * Math.tanh(x / 2)).toFixed(8), Math.abs(x * Math.tanh(x / 2) - 2) < 1e-6);
var LH = S.livelli('armonico', 200), mo = 0;
[0.3, 1, 2.5].forEach(function (tau) { var xx = 1 / tau, cE = xx * xx * Math.exp(xx) / Math.pow(Math.expm1(xx), 2); mo = Math.max(mo, Math.abs(S.termo(LH, tau).C - cE)); });
ok('oscillatore con 200 livelli = Einstein 1D x²eˣ/(eˣ−1)²', mo.toExponential(2), mo < 1e-9);
var S2 = S.termo(S.livelli('duedeg'), 1e4).S;
ok('entropia ad alta T → k ln Σg (= ln 4)', S2.toFixed(6) + ' vs ' + Math.log(4).toFixed(6), Math.abs(S2 - Math.log(4)) < 1e-3);

/* 2. Maxwell–Boltzmann */
var m = 28.0134 * K.uma, T = 300, V = S.velocita(m, T);
ok('N₂ a 300 K: v_rms ≈ 517 m/s', V.rms.toFixed(2), Math.abs(V.rms - 516.8) < 1);
var norm = S.simpson(function (v) { return S.mb(v, m, T); }, 0, 4000, 4000);
var media = S.simpson(function (v) { return v * S.mb(v, m, T); }, 0, 4000, 4000), v2 = S.simpson(function (v) { return v * v * S.mb(v, m, T); }, 0, 4000, 4000);
ok('∫f dv = 1', norm.toFixed(10), Math.abs(norm - 1) < 1e-9);
ok('⟨v⟩ = √(8kT/πm) e v_rms = √(3kT/m) dagli integrali', media.toFixed(3) + ', ' + Math.sqrt(v2).toFixed(3), Math.abs(media - V.media) < 1e-6 && Math.abs(Math.sqrt(v2) - V.rms) < 1e-6);
var dmx = (S.mb(V.p * (1 + 1e-6), m, T) - S.mb(V.p * (1 - 1e-6), m, T));
ok('v_p e\' il massimo di f(v)', dmx.toExponential(2), Math.abs(dmx) < 1e-12);
/* gas di sfere dure: energia conservata, curtosi da 1 a 5/3, frazione sotto v_p */
var G = S.duroCrea(600, 10, 0.22, 1, 3), E0 = S.duroMomenti(G).E;
ok('sfere dure, all\'inizio ⟨v⁴⟩/⟨v²⟩² = 1 (velocita\' tutte uguali)', S.duroMomenti(G).kurt.toFixed(6), Math.abs(S.duroMomenti(G).kurt - 1) < 1e-9);
var ku = [];
for (var i = 0; i < 6000; i++) { S.duroPasso(G, 0.02); if (i >= 3000 && i % 50 === 0) ku.push(S.duroMomenti(G)); }
var E1 = S.duroMomenti(G).E, kurt = ku.reduce(function (s, q) { return s + q.kurt; }, 0) / ku.length;
ok('urti elastici: energia conservata', ((E1 - E0) / E0).toExponential(2) + ' (' + G.urti + ' urti)', Math.abs(E1 - E0) / E0 < 1e-10 && G.urti > 3000);
ok('dopo gli urti ⟨v⁴⟩/⟨v²⟩² → 5/3 (Maxwell)', kurt.toFixed(4), Math.abs(kurt - 5 / 3) < 0.06);
var vr2 = S.duroMomenti(G).v2, vp = Math.sqrt(2 * vr2 / 3), sotto = 0; for (i = 0; i < G.N; i++) if (Math.hypot(G.v[3 * i], G.v[3 * i + 1], G.v[3 * i + 2]) < vp) sotto++;
var att = 0.8427007929 - 2 / Math.sqrt(PI) * Math.exp(-1);
ok('frazione con v < v_p = erf(1) − 2e⁻¹/√π = 0,4276', (sotto / G.N).toFixed(4), Math.abs(sotto / G.N - att) < 0.05);

/* 3. Fermi e Bose */
var EF = S.energiaFermi(8.47e28) / K.eV;
ok('rame: E_F ≈ 7,0 eV', EF.toFixed(3), Math.abs(EF - 7.03) < 0.05);
ok('a T → 0 μ = E_F (numero di particelle)', S.fermiMu(0.01).toFixed(6), Math.abs(S.fermiMu(0.01) - S.sommerfeld(0.01)) < 1e-5);
var dm = 0; [0.02, 0.05, 0.08].forEach(function (tau) { dm = Math.max(dm, Math.abs(S.fermiMu(tau) - S.sommerfeld(tau)) / (tau * tau)); });
ok('μ(T) numerico = 1 − (π²/12)(kT/E_F)² a bassa T', dm.toExponential(2), dm < 0.02);
var mu5 = S.fermiMu(5), clas = 5 * Math.log(4 / (3 * Math.sqrt(PI)) * Math.pow(5, -1.5));
ok('alta T: μ → kT ln(nλ³/2) classico', mu5.toFixed(4) + ' vs ' + clas.toFixed(4), Math.abs(mu5 - clas) / Math.abs(clas) < 0.03);
ok('ζ(3/2) = 2,612375', S.zeta(1.5).toFixed(6), Math.abs(S.zeta(1.5) - 2.6123753487) < 1e-7);
var IB = S.integraleBose(), att2 = Math.sqrt(PI) / 2 * 2.6123753487;
ok('∫√x/(eˣ−1)dx = Γ(3/2)ζ(3/2) (integrale contro serie)', IB.toFixed(6) + ' vs ' + att2.toFixed(6), Math.abs(IB - att2) < 1e-5);
ok('BEC: N₀/N = 1 − (T/T_c)^{3/2}, T = 0,5 T_c', S.bose(0.5).n0.toFixed(6), Math.abs(S.bose(0.5).n0 - (1 - Math.pow(0.5, 1.5))) < 1e-12);
var b2 = S.bose(1.5);
ok('sopra T_c: g_{3/2}(z) = ζ(3/2)/τ^{3/2} risolto, μ < 0', b2.z.toFixed(6) + ', ' + (S.polilog(1.5, b2.z) * Math.pow(1.5, 1.5) / S.zeta(1.5)).toFixed(8), Math.abs(S.polilog(1.5, b2.z) * Math.pow(1.5, 1.5) / S.zeta(1.5) - 1) < 1e-6 && b2.mu < 0);
var mHe = 4.002602 * K.uma, Tc = S.tempCritica(145 / mHe, mHe);
ok('elio-4 come gas ideale: T_c ≈ 3,13 K', Tc.toFixed(3), Math.abs(Tc - 3.13) < 0.03);

/* 4. Einstein e Debye */
ok('Debye ad alta T → 3R (Dulong–Petit)', (S.debyeC(1e5, 343) / (3 * K.R)).toFixed(6), Math.abs(S.debyeC(1e5, 343) / (3 * K.R) - 1) < 1e-4);
ok('Einstein ad alta T → 3R', (S.einsteinC(1e5, 300) / (3 * K.R)).toFixed(6), Math.abs(S.einsteinC(1e5, 300) / (3 * K.R) - 1) < 1e-4);
var rT3 = S.debyeC(343 / 50, 343) / S.debyeT3(343 / 50, 343);
ok('legge T³ a T = Θ/50', rT3.toFixed(6), Math.abs(rT3 - 1) < 1e-3);
ok('C_D(T = Θ_D) = 0,952 · 3R', (S.debyeC(343, 343) / (3 * K.R)).toFixed(4), Math.abs(S.debyeC(343, 343) / (3 * K.R) - 0.952) < 1e-3);
var dd = 0; [20, 100, 300].forEach(function (T) { var h = 1e-3, dU = (S.debyeU(T + h, 343) - S.debyeU(T - h, 343)) / (2 * h); dd = Math.max(dd, Math.abs(dU / S.debyeC(T, 343) - 1)); });
ok('Debye: C = dU/dT (derivata numerica dell\'energia)', dd.toExponential(2), dd < 1e-5);
var de = 0; [20, 100, 300].forEach(function (T) { var h = 1e-3, dU = (S.einsteinU(T + h, 265) - S.einsteinU(T - h, 265)) / (2 * h); de = Math.max(de, Math.abs(dU / S.einsteinC(T, 265) - 1)); });
ok('Einstein: C = dU/dT', de.toExponential(2), de < 1e-6);
var cCu = S.debyeC(298.15, 343);
ok('rame 298 K: C_V(Debye) + 0,6 ≈ C_p misurato 24,44 J/(mol K)', cCu.toFixed(3) + ' + 0,6', Math.abs(cCu + 0.6 - 24.44) / 24.44 < 0.03);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
