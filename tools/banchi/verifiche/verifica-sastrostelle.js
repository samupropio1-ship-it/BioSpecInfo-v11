/* verifica di bsi-astro-stelle.js (F.calcolo.stelle) */
var C = require('./carica.js')(['bsi-astro-stelle.js']), K = C.stelle;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* 1. Lane-Emden */
var L0 = K.laneEmden(0), L1 = K.laneEmden(1), L15 = K.laneEmden(1.5), L3 = K.laneEmden(3), L5 = K.laneEmden(5, { h: 1e-3, xmax: 30 });
ok('n = 0: ξ₁ = √6 (esatto)', L0.xi1.toFixed(8) + ' vs ' + Math.sqrt(6).toFixed(8), Math.abs(L0.xi1 - Math.sqrt(6)) < 1e-7);
ok('n = 1: ξ₁ = π (esatto)', L1.xi1.toFixed(8), Math.abs(L1.xi1 - Math.PI) < 1e-7);
ok('n = 1,5: ξ₁ = 3,65375', L15.xi1.toFixed(5), Math.abs(L15.xi1 - 3.65375) < 2e-5);
ok('n = 3: ξ₁ = 6,89685', L3.xi1.toFixed(5), Math.abs(L3.xi1 - 6.89685) < 2e-5);
ok('n = 5: nessuno zero (raggio infinito)', String(L5.xi1), L5.xi1 === Infinity);
var md = 0; [[0, L0], [1, L1], [5, L5]].forEach(function (p) { var L = p[1]; for (var i = 0; i < L.xi.length; i += 50) md = Math.max(md, Math.abs(L.theta[i] - K.laneEmdenEsatta(p[0], L.xi[i]))); });
ok('soluzioni numeriche = esatte (1 − ξ²/6, sin ξ/ξ, (1 + ξ²/3)^(−1/2))', md.toExponential(2), md < 1e-8);
ok('n = 3: ω₃ = −ξ₁²θ′(ξ₁) = 2,01824', L3.omega.toFixed(5), Math.abs(L3.omega - 2.01824) < 1e-4);
ok('n = 3: ρ_c/ρ̄ = 54,18', L3.rhoRapporto.toFixed(2), Math.abs(L3.rhoRapporto - 54.18) < 0.05);
ok('n = 1,5: ρ_c/ρ̄ = 5,99', L15.rhoRapporto.toFixed(3), Math.abs(L15.rhoRapporto - 5.991) < 0.005);
ok('n = 1: ω₁ = π (−ξ₁²θ′ con θ′(π) = −1/π)', L1.omega.toFixed(7), Math.abs(L1.omega - Math.PI) < 1e-6);
/* teorema del viriale per i politropi: ∫ ... qui si controlla la massa con il secondo metodo: ω_n = ∫₀^ξ₁ θⁿ ξ² dξ */
var s = 0; for (var i = 1; i < L3.xi.length; i++) { var a = L3.xi[i - 1], b = L3.xi[i]; s += 0.5 * (Math.pow(Math.max(0, L3.theta[i - 1]), 3) * a * a + Math.pow(Math.max(0, L3.theta[i]), 3) * b * b) * (b - a); }
ok('ω₃ = ∫θ³ξ²dξ (integrale della massa, secondo metodo)', s.toFixed(5) + ' vs ' + L3.omega.toFixed(5), Math.abs(s - L3.omega) < 1e-4);
var Mch = K.chandrasekhar(2, L3.omega) / K.MSOLE;
ok('massa di Chandrasekhar dal politropo n = 3 (μ_e = 2): ≈ 1,44-1,46 M☉ (5,836/μ_e² M☉)', Mch.toFixed(4) + ' vs ' + (5.836 / 4).toFixed(4), Math.abs(Mch - 1.44) < 0.02 && Math.abs(Mch / (5.836 / 4) - 1) < 0.005);
var Pc = K.pressioneCentrale(L3.Wn, K.MSOLE, K.RSOLE);
ok('Sole n = 3: P_c = 11,05 GM²/(4π… ) ≈ 1,25·10¹⁶ Pa', L3.Wn.toFixed(3) + ', ' + Pc.toExponential(3), Math.abs(L3.Wn - 11.05) < 0.02 && Math.abs(Pc / 1.245e16 - 1) < 0.01);
ok('massa-raggio: n = 1,5 → R ∝ M^(−1/3), n = 1 → R indipendente da M', K.esponenteMR(1.5).toFixed(6) + ', ' + K.esponenteMR(1), Math.abs(K.esponenteMR(1.5) + 1 / 3) < 1e-12 && K.esponenteMR(1) === 0);
var rn = K.raggioNucleo(3, 4, 0.9);
ok('nucleo del Sole (n = 3, ε ∝ ρT⁴): 90 % di L entro ~0,2-0,3 R', rn.toFixed(3), rn > 0.15 && rn < 0.32);

/* 2. sequenza principale */
var sol = K.sequenza(1), vc = K.vitaCombustibile(1, 1);
ok('vita del Sole sulla sequenza principale ≈ 10 miliardi di anni (scala M^−2,5)', (sol.tMS / 1e9).toFixed(2) + ' Gyr', Math.abs(sol.tMS - 1e10) < 1);
ok('… e dal combustibile: 10 % di H, efficienza 0,007 → 10,4 Gyr', (vc / 1e9).toFixed(2) + ' Gyr', Math.abs(vc / 1e9 - 10.4) < 0.3);
ok('15 M☉ vive ~11 milioni di anni', (K.sequenza(15).tMS / 1e6).toFixed(1) + ' Myr', Math.abs(K.sequenza(15).tMS / 1e6 - 11.5) < 0.5);

/* 3. Wien */
var lw = K.wien(5772) * 1e9, lp = K.piccoPlanck(5772) * 1e9;
ok('Wien: Sole 5772 K → 502 nm', lw.toFixed(1) + ' nm', Math.abs(lw - 502.0) < 0.3);
ok('il picco di Wien = massimo numerico della legge di Planck', lp.toFixed(2) + ' vs ' + lw.toFixed(2), Math.abs(lp - lw) < 0.05);
var cB = K.coloreT(3600), cS = K.coloreT(5772), cV = K.coloreT(9600);
ok('colori: Betelgeuse 3600 K rossastra, Sole bianco-giallo, Vega 9600 K azzurrina', [cB, cS, cV].map(function (c) { return c.map(function (x) { return x.toFixed(2); }).join('/'); }).join('  '), cB[2] < cB[0] * 0.6 && cS[2] > 0.8 && cV[2] >= cV[0]);
ok('classi spettrali: Sole G, Vega A, Betelgeuse M', K.classe(5772) + K.classe(9600) + K.classe(3600), K.classe(5772) + K.classe(9600) + K.classe(3600) === 'GAM');

/* 4. nucleosintesi */
var Ehe = K.energiaElio();
ok('4 m(¹H) − m(⁴He) = 26,73 MeV', Ehe.toFixed(3), Math.abs(Ehe - 26.731) < 0.002);
ok('catena pp: 2Q(pp) + 2Q(dp) + Q(³He³He) = stessa energia', K.energiaPP().toFixed(4) + ' vs ' + Ehe.toFixed(4), Math.abs(K.energiaPP() - Ehe) < 1e-9);
ok('ciclo CNO: somma delle sei Q = stessa energia (i catalizzatori tornano)', K.energiaCNO().toFixed(4), Math.abs(K.energiaCNO() - Ehe) < 1e-9);
ok('Q delle tre reazioni pp: 1,442, 5,493, 12,860 MeV', K.PP.map(function (r) { return K.Q(r).toFixed(3); }).join(', '), Math.abs(K.Q(K.PP[0]) - 1.442) < 0.001 && Math.abs(K.Q(K.PP[1]) - 5.493) < 0.001 && Math.abs(K.Q(K.PP[2]) - 12.860) < 0.001);
var rho = 1.5e5, nuP = K.nuNumerico(function (T) { return K.epsPP(T, rho, 0.7); }, 15e6), nuC = K.nuNumerico(function (T) { return K.epsCNO(T, rho, 0.7, 0.014); }, 15e6);
ok('a 15 MK: ε_pp ∝ T^≈4, ε_CNO ∝ T^≈18-20', nuP.toFixed(2) + ', ' + nuC.toFixed(2), Math.abs(nuP - 4) < 0.4 && nuC > 17 && nuC < 21);
var T9 = 0.015, g11 = 1 + 3.82 * T9 + 1.51 * T9 * T9 + 0.144 * Math.pow(T9, 3) - 0.0114 * Math.pow(T9, 4), dg = T9 * (3.82 + 3.02 * T9 + 0.432 * T9 * T9 - 0.0456 * Math.pow(T9, 3)) / g11, nuG = K.nuGamow(3.381, 15e6) + dg;
ok('ν_pp numerico = forma di Gamow τ/3 − 2/3 + d ln g₁₁/d ln T (analitica)', nuP.toFixed(4) + ' vs ' + nuG.toFixed(4), Math.abs(nuP - nuG) < 1e-4);
var Tx = K.sorpasso(rho, 0.7, 0.014) / 1e6;
ok('sorpasso pp ↔ CNO vicino a 17-18 milioni di K', Tx.toFixed(2) + ' MK', Tx > 16 && Tx < 19.5);
var Bfe = K.legameMasse(26, 56, K.MASSE.Fe56), Bni = K.legameMasse(28, 62, K.MASSE.Ni62), Bhe = K.legameMasse(2, 4, K.MASSE.He4), Bu = K.legameMasse(92, 238, K.MASSE.U238);
ok('B/A dalle masse: ⁴He 7,074, ⁵⁶Fe 8,790, ⁶²Ni 8,795, ²³⁸U 7,570 MeV', [Bhe, Bfe, Bni, Bu].map(function (x) { return x.toFixed(3); }).join(', '), Math.abs(Bhe - 7.074) < 0.002 && Math.abs(Bfe - 8.790) < 0.002 && Math.abs(Bni - 8.795) < 0.002 && Math.abs(Bu - 7.570) < 0.002);
var best = 0, Abest = 0; for (var A = 10; A <= 250; A++) { var v = K.legameValle(A); if (v > best) { best = v; Abest = A; } }
ok('formula semiempirica: massimo di B/A tra A = 50 e 65', 'A = ' + Abest + ', ' + best.toFixed(3) + ' MeV', Abest >= 50 && Abest <= 65);
ok('SEMF per ⁵⁶Fe entro 1 % del valore dalle masse', K.legameSEMF(26, 56).toFixed(3), Math.abs(K.legameSEMF(26, 56) / Bfe - 1) < 0.01);

console.log(n - ko + ' superati, ' + ko + ' falliti');
process.exit(ko > 0 ? 1 : 0);
