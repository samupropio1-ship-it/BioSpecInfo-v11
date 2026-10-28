/* verifica di bsi-fis-nuclei.js (F.calcolo.nuclei) */
var C = require('./carica.js')(['bsi-fis-nuclei.js']), N = C.nuclei;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* 1. SEMF e masse */
var fe = N.semf(56, 26) / 56, feSp = N.Bsperimentale('Fe56') / 56;
ok('B/A(⁵⁶Fe) dalle masse = 8,790 MeV', feSp.toFixed(4), Math.abs(feSp - 8.790) < 0.002);
ok('SEMF B/A(⁵⁶Fe) entro 1 % di 8,79 MeV', fe.toFixed(4) + ' (' + (100 * (fe / 8.79 - 1)).toFixed(2) + ' %)', Math.abs(fe / 8.79 - 1) < 0.01);
ok('B(⁴He) dalle masse = 28,296 MeV', N.Bsperimentale('He4').toFixed(3), Math.abs(N.Bsperimentale('He4') - 28.296) < 0.002);
var ni = N.Bsperimentale('Ni62') / 62;
ok('⁶²Ni ha il B/A piu\' alto (8,7945 MeV) sopra il ⁵⁶Fe', ni.toFixed(4), ni > feSp && Math.abs(ni - 8.7945) < 0.001);
var pb = N.semf(208, 82) / 208, u = N.semf(238, 92) / 238;
ok('SEMF entro 1,5 % per ²⁰⁸Pb e ²³⁸U', (pb / (N.Bsperimentale('Pb208') / 208)).toFixed(4) + ', ' + (u / (N.Bsperimentale('U238') / 238)).toFixed(4), Math.abs(pb / (N.Bsperimentale('Pb208') / 208) - 1) < 0.015 && Math.abs(u / (N.Bsperimentale('U238') / 238) - 1) < 0.015);
/* massimo della curva lungo la valle tra A = 50 e 65 */
var best = 0, bA = 0; for (var A = 10; A < 250; A++) { var z = Math.round(N.zStabile(A)), b = N.semf(A, z) / A; if (b > best) { best = b; bA = A; } }
ok('massimo di B/A (SEMF lungo la valle) tra A = 50 e 65', 'A = ' + bA, bA >= 50 && bA <= 65);
/* Z stabile: minimo della massa atomica a A fisso, contro la formula chiusa */
var dz = 0; [27, 64, 125, 200].forEach(function (A) { var zb = 1, mb = 1e9; for (var Z = 1; Z < A; Z++) { var m = N.massaAtomica(A, Z) + (Z % 2 === 0 && (A - Z) % 2 === 0 ? 0 : 0); if (m < mb) { mb = m; zb = Z; } } dz = Math.max(dz, Math.abs(zb - N.zStabile(A))); });
ok('Z stabile chiuso = minimo numerico della massa (± 1,5)', dz.toFixed(2), dz <= 1.5);
ok('destini SEMF: ⁵⁶Fe stabile, ⁶⁴Fe β⁻, ⁵⁰Fe β⁺, ²³⁸U α', [N.destino(56, 26), N.destino(64, 26), N.destino(50, 26), N.destino(238, 92)].join(','), N.destino(56, 26) === 'stabile' && N.destino(64, 26) === 'bm' && N.destino(50, 26) === 'bp' && N.destino(238, 92) === 'alfa');

/* 2. valori Q */
var R = N.REAZIONI;
function q(k) { return N.valoreQ(R[k].sx, R[k].dx); }
ok('D + T → ⁴He + n: Q = 17,59 MeV', q('dt').toFixed(3), Math.abs(q('dt') - 17.589) < 0.005);
var dc = N.dueCorpi(q('dt'), N.MASSE.He4[0], N.MASSE.n[0]);
ok('D–T: il neutrone porta 14,05 MeV, l\'α 3,54', dc.T2.toFixed(3) + ', ' + dc.T1.toFixed(3), Math.abs(dc.T2 - 14.05) < 0.02 && Math.abs(dc.T1 + dc.T2 - q('dt')) < 1e-12);
ok('α del ²³⁸U: Q = 4,27 MeV', q('u238a').toFixed(3), Math.abs(q('u238a') - 4.270) < 0.003);
ok('α del ²²⁶Ra 4,871 e del ²¹⁰Po 5,407 MeV', q('ra226a').toFixed(3) + ', ' + q('po210a').toFixed(3), Math.abs(q('ra226a') - 4.871) < 0.003 && Math.abs(q('po210a') - 5.407) < 0.003);
ok('fissione ²³⁵U fino ai prodotti stabili ≈ 200 MeV', q('fisstot').toFixed(1) + ' (prompta ' + q('fiss').toFixed(1) + ')', Math.abs(q('fisstot') - 200) < 5 && q('fiss') > 165 && q('fiss') < 180);
ok('D + D → ³He + n: Q = 3,27 MeV', q('dd').toFixed(3), Math.abs(q('dd') - 3.269) < 0.005);
var qs = N.qFissioneSim(236, 92);
ok('SEMF: fissione simmetrica del ²³⁶U ≈ 170–200 MeV, negativa per A = 60', qs.toFixed(1) + ', ' + N.qFissioneSim(60, 28).toFixed(1), qs > 160 && qs < 220 && N.qFissioneSim(60, 28) < 0);

/* 3. Gamow */
var md = 0; N.ALFA.forEach(function (a) { var g = N.gamowAlfa(a[3], a[1] - 2, a[2] - 4).G, gn = N.gamowNumerico(a[3], a[1] - 2, a[2] - 4); md = Math.max(md, Math.abs(gn / g - 1)); });
ok('fattore di Gamow: forma chiusa = integrale numerico (12 nuclei)', md.toExponential(2), md < 1e-6);
var err = N.ALFA.map(function (a) { return Math.log10(N.emivitaAlfa(a[3], a[1] - 2, a[2] - 4)) - Math.log10(a[4]); });
var rms = Math.sqrt(err.reduce(function (s, e) { return s + e * e; }, 0) / err.length), span = Math.log10(N.ALFA[0][4]) - Math.log10(N.ALFA[11][4]);
ok('Geiger–Nuttall: ' + span.toFixed(1) + ' ordini di grandezza riprodotti entro 1,5 decadi rms', 'rms = ' + rms.toFixed(2) + ' decadi', rms < 1.5 && span > 23);
ok('²³⁸U: t½ Gamow entro un fattore 30 da 4,47·10⁹ anni', (N.emivitaAlfa(4.2697, 90, 234) / 3.15576e7).toExponential(2) + ' a', Math.abs(err[1]) < 1.5);
var EG = N.energiaGamow(1, 1, 1.00727646688, 1.00727646688) * 1000, kT = 8.617333262e-5 * 15e6 / 1000, pk = N.piccoGamow(EG, kT);
var lo = 0.1, hi = 100, g = (Math.sqrt(5) - 1) / 2, f = function (E) { return -E / kT - Math.sqrt(EG / E); };
for (var k = 0; k < 200; k++) { var x1 = hi - g * (hi - lo), x2 = lo + g * (hi - lo); if (f(x1) > f(x2)) hi = x2; else lo = x1; }
ok('picco di Gamow pp a 15 MK: E_G ≈ 493 keV, E₀ = (√E_G kT/2)^(2/3) = massimo numerico ≈ 5,9 keV', EG.toFixed(1) + ', ' + pk.E0.toFixed(4) + ' vs ' + ((lo + hi) / 2).toFixed(4), Math.abs(pk.E0 - (lo + hi) / 2) < 1e-5 && Math.abs(EG - 493) < 2 && Math.abs(pk.E0 - 5.9) < 0.15);
var h = 1e-3, d2 = (f(pk.E0 + h) - 2 * f(pk.E0) + f(pk.E0 - h)) / (h * h), Dnum = Math.sqrt(-8 / d2);
ok('larghezza Δ = 4√(E₀kT/3) = curvatura numerica', pk.larghezza.toFixed(4) + ' vs ' + Dnum.toFixed(4), Math.abs(Dnum / pk.larghezza - 1) < 1e-4);
ok('barriera D–T ≈ 0,4 MeV, ¹²C–¹²C ≈ 9 MeV', N.barrieraCoulomb(1, 2, 1, 3).toFixed(3) + ', ' + N.barrieraCoulomb(6, 12, 6, 12).toFixed(2), N.barrieraCoulomb(1, 2, 1, 3) > 0.3 && N.barrieraCoulomb(1, 2, 1, 3) < 0.5 && Math.abs(N.barrieraCoulomb(6, 12, 6, 12) - 9.4) < 1);

/* 4. impacchettamento */
var P = N.impacchetta(56, 26, 7), cntP = 0; for (var i = 0; i < 56; i++) cntP += P.protone[i];
ok('nucleo 3D: Z protoni esatti, sfere quasi senza sovrapposizione', cntP + ', distanza minima ' + P.minD.toFixed(3), cntP === 26 && P.minD > 0.85);

/* 5. cinetica */
var K = N.REATTORE, rho = 0.001, x0 = N.equilibrio(1, K), xs = N.cineticaEvolvi(x0, 0, 100, K);
ok('a ρ = 0 l\'equilibrio resta (100 s)', xs[0].toFixed(12), Math.abs(xs[0] - 1) < 1e-10);
var xe = N.cineticaEvolvi(x0, rho, 2, K), xr = N.cineticaRK4(x0, rho, 2e-6, 1000000, K);
ok('soluzione esatta (Sylvester) = RK4 a passo 2 μs', (xe[0] / xr[0] - 1).toExponential(2), Math.abs(xe[0] / xr[0] - 1) < 1e-8);
var xp = N.cineticaEvolvi(x0, rho, 0.1, K), sp = N.saltoPronto(rho, K);
ok('salto pronto n₊/n₀ = β/(β−ρ) = 1,1818 (dopo 0,1 s ≈ 5,5 Λ/(β−ρ))', xp[0].toFixed(4) + ' vs ' + sp.toFixed(4), Math.abs(xp[0] / sp - 1) < 0.01);
var w = N.inhour(rho, K), rr = N.cineticaRadici(rho, K);
ok('inhour = autovalore positivo della matrice', w.toExponential(6) + ' vs ' + rr[0].toExponential(6), Math.abs(w / rr[0] - 1) < 1e-9);
var a1 = N.cineticaEvolvi(x0, rho, 100, K), a2 = N.cineticaEvolvi(x0, rho, 200, K), wfit = Math.log(a2[0] / a1[0]) / 100;
ok('periodo stabile dalla simulazione = 1/ω (≈ 72 s)', (1 / wfit).toFixed(3) + ' vs ' + (1 / w).toFixed(3), Math.abs(wfit / w - 1) < 1e-6 && 1 / w > 60 && 1 / w < 85);
ok('approssimazione λρ/(β−ρ) del periodo entro 2 %', (K.lambda * rho / (K.beta - rho)).toExponential(4) + ' vs ' + w.toExponential(4), Math.abs(K.lambda * rho / (K.beta - rho) / w - 1) < 0.02);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
