/* verifica di bsi-astro-cosmo.js (F.calcolo.cosmo) contro valori noti, forme chiuse e metodi indipendenti */
'use strict';
var C = require('./carica.js')(['bsi-astro-cosmo.js']).cosmo;
var ok = 0, ko = 0;
function chk(nome, cond, val) { if (cond) ok++; else ko++; console.log((cond ? '  ok ' : '  KO ') + nome + (val !== undefined ? '  → ' + val : '')); }
var P = C.PLANCK;

/* 1. eta' */
var t0 = C.eta(P);
chk('età per Planck (0.315/0.685/9e-5/67.4) = 13.8 ± 0.1 Gyr', Math.abs(t0 - 13.8) < 0.1, t0.toFixed(3) + ' Gyr');
var eds = { Om: 1, OL: 0, Or: 0, H0: 67.4 };
chk('Einstein–de Sitter: età numerica = 2/(3H₀)', Math.abs(C.eta(eds) / C.etaEdS(67.4) - 1) < 1e-6, C.eta(eds).toFixed(5) + ' vs ' + C.etaEdS(67.4).toFixed(5));
/* universo vuoto (Milne): t0 = 1/H0 */
chk('universo vuoto (Ω = 0): età = 1/H₀', Math.abs(C.eta({ Om: 0, OL: 0, Or: 0, H0: 70 }) / (977.792 / 70) - 1) < 1e-5, C.eta({ Om: 0, OL: 0, Or: 0, H0: 70 }).toFixed(4));
/* piatto materia + Λ: forma chiusa t0 = 2/(3H0√ΩΛ) asinh(√(ΩΛ/Ωm)) */
var fl = { Om: 0.3, OL: 0.7, Or: 0, H0: 70 }, chiuso = 2 / (3 * Math.sqrt(0.7)) * Math.asinh(Math.sqrt(0.7 / 0.3)) * 977.792 / 70;
chk('ΛCDM piatto senza radiazione: età = forma chiusa con asinh', Math.abs(C.eta(fl) / chiuso - 1) < 1e-6, C.eta(fl).toFixed(5) + ' vs ' + chiuso.toFixed(5));
/* materia + radiazione: integrale numerico vs formula chiusa per a piccolo */
var a1 = 1e-3, tn = C.tempo(a1, P), tc = C.tempoMR(a1, P);
chk('t(a = 10⁻³): integrale vs forma chiusa materia+radiazione', Math.abs(tn / tc - 1) < 1e-4, (tn * 1e6).toFixed(2) + ' vs ' + (tc * 1e6).toFixed(2) + ' kyr');
/* tabella a(t) dall'equazione di accelerazione: a = 1 all'eta' giusta (metodo indipendente dall'integrale) */
var tab = C.tabellaA(P, 30);
chk('a(t) integrata (ODE del 2° ordine): a = 1 a t₀ = età integrale', Math.abs(tab.t0 - t0) < 0.01, tab.t0.toFixed(3) + ' Gyr');

/* 2. distanze */
var z = 1.3, dl = C.luminosita(z, P), da = C.diametro(z, P);
chk('d_L = (1+z)² d_A', Math.abs(dl / (Math.pow(1 + z, 2) * da) - 1) < 1e-12, (dl / 1000).toFixed(4) + ' Gpc');
var zm = C.zMaxDiametro(P);
chk('massimo di D_A a z ≈ 1.6 (Planck)', Math.abs(zm - 1.6) < 0.08, zm.toFixed(3) + ', D_A max = ' + (C.diametro(zm, P) / 1000).toFixed(3) + ' Gpc');
/* EdS: D_A max a z = 1.25 esattamente (forma chiusa D_C = 2c/H0 (1 − 1/√(1+z))) */
var zmE = C.zMaxDiametro(eds), dcE = C.comovente(2, eds), dcEc = 2 * 299792.458 / 67.4 * (1 - 1 / Math.sqrt(3));
chk('EdS: D_A massimo a z = 5/4', Math.abs(zmE - 1.25) < 1e-3, zmE.toFixed(4));
chk('EdS: D_C(z=2) = 2c/H₀(1 − 1/√3)', Math.abs(dcE / dcEc - 1) < 1e-8, dcE.toFixed(2) + ' Mpc');
var d1100 = C.comovente(1100, P);
chk('distanza comovente a z = 1100 ≈ 14 Gpc', Math.abs(d1100 / 1000 - 14) < 0.3, (d1100 / 1000).toFixed(3) + ' Gpc');
/* universo aperto: D_M con sinh contro integrazione diretta della geometria iperbolica: Milne D_L = c/H0 z(1+z/2) */
var milne = { Om: 0, OL: 0, Or: 0, H0: 70 }, zz = 2, dlM = C.luminosita(zz, milne), dlMc = 299792.458 / 70 * zz * (1 + zz / 2);
chk('Milne (aperto, Ω_k = 1): D_L = (c/H₀) z(1 + z/2)', Math.abs(dlM / dlMc - 1) < 1e-8, dlM.toFixed(2) + ' Mpc');
/* la tabella cumulativa dei grafici contro gli integrali di Simpson (due metodi) */
var TD = C.tabellaDistanze({ Om: 0.4, OL: 0.5, Or: 9e-5, H0: 70 }, [0.5, 2, 9]), dev = 0;
[0.5, 2, 9].forEach(function (z, i) { var pp = { Om: 0.4, OL: 0.5, Or: 9e-5, H0: 70 }; dev = Math.max(dev, Math.abs(TD.DM[i] / C.trasversale(z, pp) - 1), Math.abs(TD.TL[i] / C.ritorno(z, pp) - 1)); });
chk('tabella cumulativa (trapezi) = integrali di Simpson, anche aperto (Ω_k = 0.1)', dev < 1e-5, dev.toExponential(2));
/* lookback: a z → ∞ tende all'eta' */
chk('tempo di ritorno a z = 10⁶ → età', Math.abs(C.ritorno(1e6, P) - t0) < 0.002, C.ritorno(1e6, P).toFixed(4));

/* 3. equivalenza, radiazione, accelerazione */
var zeq = C.zEquivalenza(P);
chk('z di equivalenza ≈ 3400 (parametri del brief, Ω_r = 9e-5)', Math.abs(zeq - 3400) / 3400 < 0.04, zeq.toFixed(0));
var Or = C.omegaR(67.4, 2.7255, 3.046), zeq2 = C.zEquivalenza({ Om: 0.315, OL: 0.685, Or: Or, H0: 67.4 });
chk('Ω_r da T_CMB e N_eff = 9.2e-5 → z_eq = 3400 ± 50 (Planck 3387)', Math.abs(Or - 9.2e-5) < 0.1e-5 && Math.abs(zeq2 - 3400) < 50, Or.toExponential(3) + ', z_eq = ' + zeq2.toFixed(0));
var za = C.zAccelerazione({ Om: 0.315, OL: 0.685, Or: 0, H0: 67.4 }), zac = Math.pow(2 * 0.685 / 0.315, 1 / 3) - 1;
chk('inizio dell’accelerazione: z = (2Ω_Λ/Ω_m)^⅓ − 1', Math.abs(za - zac) < 1e-6, za.toFixed(4));

/* 4. CMB */
var sa = C.scalaAcustica(P, 0.0224);
chk('z* (Hu & Sugiyama) ≈ 1090', Math.abs(sa.zs - 1090) < 5, sa.zs.toFixed(1));
chk('orizzonte sonoro r_s ≈ 145 ± 4 Mpc', Math.abs(sa.rs - 145) < 4, sa.rs.toFixed(2) + ' Mpc');
chk('scala acustica ℓ_A ≈ 300 ± 6', Math.abs(sa.lA - 300) < 6, sa.lA.toFixed(1) + ', θ = ' + sa.theta.toFixed(3) + '°');
var pk = C.picchi(sa.lA);
chk('primo picco a ℓ ≈ 220 ± 10, secondo ≈ 540 ± 40, terzo ≈ 810 ± 40', Math.abs(pk[0][0] - 220) <= 10 && Math.abs(pk[1][0] - 540) <= 40 && Math.abs(pk[2][0] - 810) <= 40, pk.slice(0, 3).map(function (p) { return p[0]; }).join(', '));
chk('primo picco più alto del secondo (≈ 5700 vs 2500 μK²)', pk[0][1] > 1.6 * pk[1][1], pk.slice(0, 3).map(function (p) { return Math.round(p[1]); }).join(', '));
/* universo chiuso: il picco si sposta a ℓ minori */
var chiusoP = { Om: 0.4, OL: 0.7, Or: 9e-5, H0: 67.4 }, pkC = C.picchi(C.scalaAcustica(chiusoP, 0.0224).lA);
chk('Ω_k < 0 (chiuso): primo picco a ℓ minore', pkC[0][0] < pk[0][0] - 20, pkC[0][0]);
/* armoniche: ortonormalità di λ_ℓm (∫ λ_ℓm λ_ℓ'm 2π dx = δ) con Gauss-Legendre semplice a punti medi */
var L = 20, n = 4000, lam = new Float64Array((L + 1) * (L + 2) / 2), s1 = 0, s2 = 0, s3 = 0;
for (var i = 0; i < n; i++) { var x = -1 + (2 * i + 1) / n; C.lambdaRiga(L, x, lam); var a = lam[17 * 18 / 2 + 5], b = lam[12 * 13 / 2 + 5], c0 = lam[3 * 4 / 2 + 0]; s1 += a * a; s2 += a * b; s3 += c0 * c0; }
var w = 2 * Math.PI * 2 / n;
chk('ortonormalità λ_ℓm: ‖Y_17,5‖ = 1, ⟨Y_17,5|Y_12,5⟩ = 0, ‖Y_3,0‖ = 1', Math.abs(s1 * w - 1) < 1e-5 && Math.abs(s2 * w) < 1e-6 && Math.abs(s3 * w - 1) < 1e-5, (s1 * w).toFixed(7) + ', ' + (s2 * w).toExponential(1) + ', ' + (s3 * w).toFixed(7));
/* mappa: Parseval per la singola realizzazione, ∫T² dΩ/4π = Σ(b² + c²)/4π (sintesi e quadratura indipendenti),
   e in media sulle realizzazioni la varianza = Σ(2ℓ+1)C_ℓ/4π (teorema di addizione) */
var Lm = 96, cl = function (l) { return C.spettroCl(l, 301); }, coef = C.coefficienti(Lm, cl, 7), M = C.mappaCMB(Lm, 2 * 192, 192, coef);
while (!M.passo(16));
var stt = C.statMappa(M), vt = C.varianzaTeorica(Lm, cl), sq = 0;
for (i = 0; i < coef.B.length; i++) sq += coef.B[i] * coef.B[i] + coef.C[i] * coef.C[i];
chk('Parseval sulla mappa: ⟨T²⟩ = Σ(b²+c²)/4π', Math.abs((stt.varianza + stt.media * stt.media) / (sq / (4 * Math.PI)) - 1) < 1e-5, ((stt.varianza + stt.media * stt.media) / (sq / (4 * Math.PI))).toFixed(8));
var Le = 40, rapp = [], s1 = 0, s2 = 0;
for (var l = 2; l <= Le; l++) { s1 += (2 * l + 1) * cl(l); s2 += 2 * (2 * l + 1) * cl(l) * cl(l); }
for (var seme = 1; seme <= 64; seme++) { var Me = C.mappaCMB(Le, 128, 64, C.coefficienti(Le, cl, seme)); while (!Me.passo(16)); rapp.push(C.statMappa(Me).varianza / C.varianzaTeorica(Le, cl)); }
var mr = rapp.reduce(function (a, b) { return a + b; }) / rapp.length, sm = Math.sqrt(s2) / s1 / Math.sqrt(64);
chk('media su 64 cieli: varianza / Σ(2ℓ+1)C_ℓ/4π = 1 entro 3σ (σ = ' + sm.toFixed(3) + ')', Math.abs(mr - 1) < 3 * sm, mr.toFixed(4));
chk('media della mappa ≈ 0 (rispetto a σ)', Math.abs(stt.media) / Math.sqrt(vt) < 0.01, (stt.media / Math.sqrt(vt)).toExponential(2));
/* riproducibilita' */
var M2 = C.mappaCMB(16, 64, 32, C.coefficienti(16, cl, 3)), M3 = C.mappaCMB(16, 64, 32, C.coefficienti(16, cl, 3)); while (!M2.passo(8)); while (!M3.passo(8));
var ug = true; for (i = 0; i < M2.map.length; i++) if (M2.map[i] !== M3.map[i]) ug = false;
chk('mappa riproducibile con lo stesso seme (mulberry32)', ug);
/* corpo nero */
var pg = C.piccoPlanckGHz(2.7255);
chk('picco del corpo nero a 58.79 GHz/K × 2.7255 = 160.2 GHz', Math.abs(pg - 160.23) < 0.1, pg.toFixed(2) + ' GHz');
chk('brillanza al picco ≈ 384.6 MJy/sr (FIRAS)', Math.abs(C.planckNu(pg, 2.7255) - 384.6) < 1, C.planckNu(pg, 2.7255).toFixed(1));
/* integrale del corpo nero = σT⁴/π (Stefan-Boltzmann, indipendente) */
var tot = 0; for (var nu = 0.5; nu < 5000; nu += 0.5) tot += C.planckNu(nu, 2.7255) * 1e-20 * 0.5e9;
var sig = 5.670374419e-8 * Math.pow(2.7255, 4) / Math.PI;
chk('∫B_ν dν = σT⁴/π', Math.abs(tot / sig - 1) < 1e-3, (tot / sig).toFixed(5));

/* 5. storia termica */
chk('T(z = 1100) ≈ 3000 K', Math.abs(C.temperatura(1100) - 3000) < 5, C.temperatura(1100).toFixed(1) + ' K');
var aR = C.tabellaA(P, 15), Tz = 2.7255 / C.interp(aR.t, aR.a, 1);
chk('T ∝ 1/a: T a 1 Gyr = 2.7255 K/a(1 Gyr)', Tz > 10 && Tz < 20, Tz.toFixed(2) + ' K');
var r1 = C.tempo(1e-6, P) / C.tempo(1e-7, P);
chk('era della radiazione: t ∝ a² (t(10⁻⁶)/t(10⁻⁷) = 100)', Math.abs(r1 - 100) < 0.5, r1.toFixed(3));
chk('t(kT = 1 MeV, g* = 10.75) ≈ 0.74 s', Math.abs(C.tempoDaT(1, 10.75) - 0.738) < 0.005, C.tempoDaT(1, 10.75).toFixed(4) + ' s');
var He = C.elio(3, 879.4);
chk('frazione in massa di elio Y ≈ 0.25', Math.abs(He.Y - 0.25) < 0.01, He.Y.toFixed(4) + ' (n/p_f = ' + He.np0.toFixed(3) + ')');
chk('più neutrini → più elio (N_ν = 4)', C.elio(4, 879.4).Y > He.Y + 0.005, C.elio(4, 879.4).Y.toFixed(4));
chk('g*(N_ν = 3) = 10.75', Math.abs(C.gstarNu(3) - 10.75) < 1e-12, C.gstarNu(3));

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
