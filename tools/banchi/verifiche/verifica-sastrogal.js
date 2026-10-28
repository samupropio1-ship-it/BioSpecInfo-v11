/* verifica di bsi-astro-galassie.js (F.calcolo.galassie) contro valori noti e metodi indipendenti */
'use strict';
var C = require('./carica.js')(['bsi-astro-galassie.js']).galassie;
var ok = 0, ko = 0;
function chk(nome, cond, val) { if (cond) ok++; else ko++; console.log((cond ? '  ok ' : '  KO ') + nome + (val !== undefined ? '  → ' + val : '')); }
function vicino(a, b, tol) { return Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)); }
var G = C.G;

/* 1. funzioni di Bessel modificate: valori di Abramowitz & Stegun (tabella 9.8) */
chk('I0(1) = 1.2660659', vicino(C.besselI0(1), 1.2660658778, 1e-6), C.besselI0(1));
chk('I1(1) = 0.5651591', vicino(C.besselI1(1), 0.5651591040, 1e-6), C.besselI1(1));
chk('K0(1) = 0.4210244', vicino(C.besselK0(1), 0.4210244382, 1e-6), C.besselK0(1));
chk('K1(1) = 0.6019072', vicino(C.besselK1(1), 0.6019072302, 1e-6), C.besselK1(1));
chk('K0(3) = 0.0347395, I0(5) = 27.239872', vicino(C.besselK0(3), 0.0347395044, 1e-5) && vicino(C.besselI0(5), 27.239871823, 1e-6), C.besselK0(3) + ', ' + C.besselI0(5));
/* Wronskiano I0 K1 + I1 K0 = 1/x (identita' indipendente) */
var wr = [0.3, 1.7, 4, 12].map(function (x) { return x * (C.besselI0(x) * C.besselK1(x) + C.besselI1(x) * C.besselK0(x)); });
chk('Wronskiano x(I0K1 + I1K0) = 1', wr.every(function (w) { return Math.abs(w - 1) < 2e-6; }), wr.map(function (w) { return w.toFixed(7); }).join(' '));

/* 2. disco di Freeman contro integrale di Hankel indipendente (J1 con le approssimazioni di Numerical Recipes):
      v²/(2πGΣ0 Rd) = (R/Rd) ∫0^∞ u J1(u R/Rd) (1+u²)^(−3/2) du */
function J1(x) {
  var ax = Math.abs(x), y, a1, a2, z, xx;
  if (ax < 8) { y = x * x; a1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606)))))); a2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y * 1.0)))); return a1 / a2; }
  z = 8 / ax; y = z * z; xx = ax - 2.356194491;
  a1 = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
  a2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
  var r = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * a1 - z * Math.sin(xx) * a2); return x < 0 ? -r : r;
}
function vHankel(R, Md, Rd) {
  var s = R / Rd, U = 600, n = 600000, h = U / n, somma = 0;
  for (var i = 0; i <= n; i++) { var u = i * h, f = u * J1(u * s) * Math.pow(1 + u * u, -1.5), w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; somma += w * f; }
  somma *= h / 3;
  var Sig0 = Md / (2 * Math.PI * Rd * Rd);
  return Math.sqrt(2 * Math.PI * G * Sig0 * Rd * s * somma);
}
var Md = 5e10, Rd = 3, err = [];
[0.5, 1, 2.15, 4, 8].forEach(function (x) { var a = C.vFreeman(x * Rd, Md, Rd), b = vHankel(x * Rd, Md, Rd); err.push(Math.abs(a / b - 1)); });
chk('Freeman vs integrale di Hankel (R/Rd = 0.5, 1, 2.15, 4, 8): scarto max < 0.3 %', Math.max.apply(null, err) < 3e-3, err.map(function (e) { return e.toExponential(1); }).join(' '));
/* picco del disco esponenziale: R ≈ 2.15 Rd, v_max ≈ 0.622 √(GM/Rd) (Binney & Tremaine) */
var best = 0, Rbest = 0; for (var R = 0.5; R < 15; R += 0.001) { var v = C.vFreeman(R, Md, Rd); if (v > best) { best = v; Rbest = R; } }
chk('picco a R/Rd = 2.15 ± 0.02', Math.abs(Rbest / Rd - 2.15) < 0.02, (Rbest / Rd).toFixed(3));
chk('v_max/√(GM/Rd) = 0.622 ± 0.002', Math.abs(best / Math.sqrt(G * Md / Rd) - 0.622) < 0.002, (best / Math.sqrt(G * Md / Rd)).toFixed(4));
/* lontano dal disco: v² R/(G M) → 1 (Kepler) */
var kfar = Math.pow(C.vFreeman(30 * Rd, Md, Rd), 2) * 30 * Rd / (G * Md);
/* sviluppo in multipoli (metodo indipendente): un anello di raggio a nel suo piano da'
   v² = GM/R Σ (2n+1) P₂ₙ(0)² (a/R)²ⁿ = GM/R (1 + ¾x² + 45/64 x⁴ + 175/256 x⁶ …); per il disco ⟨a²ⁿ⟩ = (2n+1)! Rd²ⁿ */
var xR = 1 / 30, mult = 1 + 0.75 * 6 * xR * xR + 45 / 64 * 120 * Math.pow(xR, 4) + 175 / 256 * 5040 * Math.pow(xR, 6);
chk('disco a 30 Rd: v²R/GM = sviluppo in multipoli entro 1e-5', Math.abs(kfar - mult) < 1e-5, kfar.toFixed(7) + ' vs ' + mult.toFixed(7));
var cont = Math.abs(C.vFreeman(23.999 * Rd, Md, Rd) / C.vFreeman(24.001 * Rd, Md, Rd) - 1);
chk('Freeman continuo al cambio di formula (y = 12)', cont < 1e-4, cont.toExponential(2));

/* 3. NFW: massa racchiusa contro integrazione numerica di 4πr²ρ */
function simpson(f, a, b, n) { var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
var rhos = 1.1e7, rs = 16, eN = [];
[2, 16, 50, 200].forEach(function (r) { var num = simpson(function (x) { var rr = Math.exp(x); return 4 * Math.PI * rr * rr * C.rhoNFW(rr, rhos, rs) * rr; }, Math.log(1e-6), Math.log(r), 4000); eN.push(Math.abs(num / C.massaNFW(r, rhos, rs) - 1)); });
chk('M_NFW(r) formula vs ∫4πr²ρ dr (r = 2, 16, 50, 200 kpc)', Math.max.apply(null, eN) < 1e-6, Math.max.apply(null, eN).toExponential(2));
var bN = 0, xN = 0; for (var x = 0.5; x < 6; x += 1e-4) { var vn = C.vNFW(x * rs, rhos, rs); if (vn > bN) { bN = vn; xN = x; } }
chk('NFW: massimo di v_c a r = 2.163 r_s', Math.abs(xN - 2.1626) < 0.002, xN.toFixed(4));
/* bulge di Hernquist: massa racchiusa vs integrale */
var eH = simpson(function (x) { var rr = Math.exp(x); return 4 * Math.PI * rr * rr * C.rhoHernquist(rr, 1.5e10, 0.6) * rr; }, Math.log(1e-7), Math.log(5), 4000) / C.massaHernquist(5, 1.5e10, 0.6) - 1;
chk('Hernquist: M(r) formula vs integrale', Math.abs(eH) < 1e-5, eH.toExponential(2));

/* 4. curva piatta con l'alone scelto, kepleriana senza */
var vs = []; for (R = 5; R <= 30; R += 0.5) vs.push(C.curva(R).vt);
var vmin = Math.min.apply(null, vs), vmax = Math.max.apply(null, vs);
chk('curva totale piatta tra 5 e 30 kpc: (max−min)/media < 18 %', (vmax - vmin) / ((vmax + vmin) / 2) < 0.18, Math.round(vmin) + '–' + Math.round(vmax) + ' km/s');
var vis = function (R) { return C.curva(R, { Mb: 1.5e10, ab: 0.6, Md: 5.5e10, Rd: 3, alone: false }).vt; };
var pend = Math.log(vis(400) / vis(100)) / Math.log(4);
chk('senza alone, lontano: v ∝ r^(−1/2) (pendenza log-log)', Math.abs(pend + 0.5) < 0.01, pend.toFixed(4));
/* κ = √2 Ω per una curva piatta */
var kap = C.kappa(8, function () { return 220; }) / (220 / 8);
chk('κ/Ω = √2 per curva piatta', Math.abs(kap - Math.SQRT2) < 1e-5, kap.toFixed(6));
var rr = C.risonanze(25, 2, function (r) { return C.curva(r).vt; });
chk('corotazione: Ω(R_CR) = Ω_p', rr.cr && Math.abs(C.curva(rr.cr).vt / rr.cr - 25) < 1e-3, rr.cr && rr.cr.toFixed(3) + ' kpc');

/* 5. generatore: riproducibile, spirali logaritmiche, ellitticita' */
var g1 = C.generaGalassia('Sb', 20000, 5), g2 = C.generaGalassia('Sb', 20000, 5);
var uguali = g1.stelle.n === g2.stelle.n; for (var i = 0; i < g1.stelle.pos.length && uguali; i++) if (g1.stelle.pos[i] !== g2.stelle.pos[i]) uguali = false;
chk('generatore riproducibile con lo stesso seme e N stelle esatto', uguali && g1.stelle.n === 20000, g1.stelle.n);
chk('angolo di avvolgimento misurato = 13° (Sb) a ogni raggio', [4, 8, 12].every(function (R) { return Math.abs(C.pitchMisurato(g1.par.K, g1.par.R0, R) - 13) < 1e-6; }), C.pitchMisurato(g1.par.K, g1.par.R0, 8).toFixed(6));
var e3 = C.generaGalassia('E3', 30000, 9).stelle, sxx = 0, szz = 0;
for (i = 0; i < e3.n; i++) { var Ri = e3.pos[3 * i], z = e3.pos[3 * i + 2]; sxx += Ri * Ri / 2; szz += z * z; }
chk('E3: rapporto assiale √(⟨z²⟩/⟨x²⟩) = 0.7', Math.abs(Math.sqrt(szz / sxx) - 0.7) < 0.02, Math.sqrt(szz / sxx).toFixed(3));
/* profilo esponenziale del disco vecchio: pendenza di ln Σ tra 2Rd e 4Rd ≈ −1/Rd */
var gS = C.generaGalassia('Sc', 60000, 3), pr = C.profilo(gS.stelle, 15, 15), xs = [], ys = [];
pr.R.forEach(function (R, k) { if (R > 6 && R < 12 && pr.sigma[k] > 0) { xs.push(R); ys.push(Math.log(pr.sigma[k])); } });
var mx = xs.reduce(function (a, b) { return a + b; }) / xs.length, my = ys.reduce(function (a, b) { return a + b; }) / ys.length, num = 0, den = 0;
xs.forEach(function (x, k) { num += (x - mx) * (ys[k] - my); den += (x - mx) * (x - mx); });
chk('profilo del disco: R_d dalla pendenza = 3 kpc ± 15 %', Math.abs(-den / num / 3 - 1) < 0.15, (-den / num).toFixed(2) + ' kpc');

/* 6. collisione: conservazione dell'energia e del momento angolare dei nuclei (leapfrog) */
var Cc = C.collisione, s = Cc.crea({ rapp: 0.6, q: 0.8, N1: 0, N2: 0, eps: 0.1, r0: 4 }, 1);
s.cm[6] *= 0.8; s.cm[7] *= 0.8; s.cm[9] *= 0.8; s.cm[10] *= 0.8; /* orbita legata, con passaggi ravvicinati */
var E0 = Cc.energia(s), L0 = Cc.momento(s)[2], dEmax = 0, dmin = 1e9;
for (i = 0; i < 20000; i++) { Cc.passo(s, 0.002); dEmax = Math.max(dEmax, Math.abs(Cc.energia(s) / E0 - 1)); dmin = Math.min(dmin, Cc.separazione(s)); }
chk('nuclei: |ΔE/E| < 1e-4 su 20 000 passi (con pericentri a ' + dmin.toFixed(2) + ')', dEmax < 1e-4, dEmax.toExponential(2));
chk('nuclei: momento angolare conservato', Math.abs(Cc.momento(s)[2] / L0 - 1) < 1e-10, (Cc.momento(s)[2] / L0 - 1).toExponential(2));
/* orbita parabolica iniziale: energia (con ε → 0) nulla */
var sp = Cc.crea({ rapp: 1, q: 1, N1: 0, N2: 0, eps: 1e-6, r0: 6 }, 1);
chk('condizioni iniziali paraboliche: E ≈ 0', Math.abs(Cc.energia(sp)) < 1e-6, Cc.energia(sp).toExponential(2));
/* 7. Kepler: particella di prova in orbita circolare attorno a un nucleo puntiforme; T ∝ r^(3/2) */
function periodo(r) {
  var st = { cm: new Float64Array([0, 0, 0, 1e6, 0, 0, 0, 0, 0, 0, 0, 0]), m: [1, 0], eps: 0, n: 1, pos: new Float64Array([r, 0, 0]), vel: new Float64Array([0, Math.sqrt(1 / r), 0]), t: 0 };
  var dt = 1e-3 * Math.pow(r, 1.5), prevY = 0, giri = 0, tc = 0;
  for (var k = 0; k < 1e6; k++) { var y0 = st.pos[1]; Cc.passo(st, dt); if (y0 < 0 && st.pos[1] >= 0) { tc = st.t - dt * st.pos[1] / (st.pos[1] - y0); break; } }
  return { T: tc, v: Math.hypot(st.vel[0], st.vel[1]) };
}
var p1 = periodo(1), p4 = periodo(4);
chk('Kepler: T(4r)/T(r) = 8', Math.abs(p4.T / p1.T - 8) < 1e-3, (p4.T / p1.T).toFixed(5));
chk('Kepler: v(4r)/v(r) = 1/2 (v ∝ r^(−1/2))', Math.abs(p4.v / p1.v - 0.5) < 1e-4, (p4.v / p1.v).toFixed(6));
chk('T(r=1) = 2π (unità G = M = 1)', Math.abs(p1.T / (2 * Math.PI) - 1) < 1e-4, p1.T.toFixed(5));

/* 8. Gruppo Locale */
var m31 = C.galattocentriche(121.17, -21.57, 765), dS = Math.hypot(m31[0] + 8.2, m31[1], m31[2] - 0.02);
chk('M31: distanza dal Sole ricostruita = 765 kpc', Math.abs(dS - 765) < 1e-9, dS.toFixed(3));
var lmc = Math.hypot.apply(null, C.galattocentriche(280.5, -32.9, 50));
chk('LMC dal centro galattico ≈ 49–50 kpc', lmc > 48 && lmc < 51, lmc.toFixed(2));
/* separazione M31–M33 da (l, b) contro quella da (α, δ) equatoriali (metodo indipendente) */
function sepEq(a1, d1, a2, d2) { var r = Math.PI / 180; return Math.acos(Math.sin(d1 * r) * Math.sin(d2 * r) + Math.cos(d1 * r) * Math.cos(d2 * r) * Math.cos((a1 - a2) * r)) / r; }
var sGal = C.separazioneAngolare(121.17, -21.57, 133.61, -31.33), sEq = sepEq(10.6847, 41.2690, 23.4621, 30.6602);
chk('separazione M31–M33: galattiche vs equatoriali (≈ 14.8°)', Math.abs(sGal - sEq) < 0.05, sGal.toFixed(3) + '° vs ' + sEq.toFixed(3) + '°');
var Ts = C.periodoOrbitaSole(8.2, 230);
chk('periodo orbitale del Sole 2πR0/v0 ≈ 219 Myr', Math.abs(Ts - 219) < 2, Ts.toFixed(1) + ' Myr');

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
