/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-cosmo.js — 🌠 Cosmologia 3D
   BioSpecInfo · © Samuele Pio Provenzano

   La sezione di astrofisica (bsi-fis-astro.js) da' l'eta' di un universo
   ΛCDM; qui la cosmologia diventa un laboratorio in tre dimensioni:

   · L'UNIVERSO CHE SI ESPANDE: un reticolo di galassie a coordinate
     comoventi fisse, le cui distanze proprie crescono come a(t); a(t) viene
     dall'equazione di Friedmann H² = H₀²[Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_k a⁻² + Ω_Λ]
     integrata nel tempo (anche i casi che ricollassano). Raggi di luce
     partono dalle galassie verso di noi: percorrono la distanza comovente
     χ = ∫c dt/a e si arrossano con 1 + z = a(oss)/a(emiss).
   · LE DISTANZE: comovente D_C = c∫dz/H, di luminosita' D_L = (1+z)D_M, di
     diametro angolare D_A = D_M/(1+z) (con il massimo vicino a z ≈ 1,6:
     oltre, gli oggetti sembrano di nuovo piu' grandi), tempo di ritorno; in
     3D il cono di luce passato in distanza propria — la «goccia» di Davis &
     Lineweaver, larga proprio D_A — con la sfera di Hubble c/H(t) e le
     linee d'universo delle galassie.
   · LA RADIAZIONE COSMICA DI FONDO: una sfera con un campo gaussiano casuale
     sintetizzato con le armoniche sferiche (a_ℓm con varianza C_ℓ, spettro
     con picchi acustici le cui posizioni ℓ_n ≈ ℓ_A(n − 0,27) seguono la
     scala acustica ℓ_A = π D_M(z*)/r_s calcolata dalla cosmologia scelta),
     la proiezione di Mollweide, lo spettro di potenza e il corpo nero a
     2,7255 K.
   · LA STORIA TERMICA: dall'inflazione a oggi in un «imbuto» 3D, la
     temperatura T ∝ 1/a, la nucleosintesi (frazione di elio Y ≈ 0,25 dal
     congelamento n/p e dal decadimento del neutrone), la ricombinazione a
     z ≈ 1100, la reionizzazione, le prime stelle.

   Unita': H₀ in km/s/Mpc, distanze in Mpc, tempi in Gyr
   (1/(km/s/Mpc) = 977,79 Gyr), c = 299 792,458 km/s = 306,6 Mpc/Gyr.
   I calcoli (F.calcolo.cosmo) sono funzioni pure, separate dal disegno.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;

  var C_KMS = 299792.458, GYR_H = 977.792, C_MPC_GYR = C_KMS * 3.15576e16 / 3.0856775814913673e19; /* c = 306,6 Mpc/Gyr */
  var T_CMB = 2.7255, H_PL = 6.62607015e-34, K_B = 1.380649e-23, C_SI = 299792458;
  var PLANCK = { Om: 0.315, OL: 0.685, Or: 9e-5, H0: 67.4 };

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rnd) { var u = rnd() || 1e-12, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function simpson(f, a, b, n) { n = n % 2 ? n + 1 : n; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }

  /* ═══ Friedmann ════════════════════════════════════════════════════════ */
  function norm(p) { p = p || PLANCK; var q = { Om: p.Om, OL: p.OL, Or: p.Or == null ? 0 : p.Or, H0: p.H0 }; q.Ok = 1 - q.Om - q.OL - q.Or; return q; }
  function E2(a, q) { return q.Or / (a * a * a * a) + q.Om / (a * a * a) + q.Ok / (a * a) + q.OL; }
  function E(a, q) { return Math.sqrt(Math.max(0, E2(a, q))); }
  function Ez(z, q) { return E(1 / (1 + z), q); }
  function hGyr(q) { return q.H0 / GYR_H; } /* H₀ in 1/Gyr */
  function haBigBang(p) { var q = norm(p); for (var i = 0; i <= 400; i++) { var a = Math.pow(10, -5 + 5 * i / 400); if (E2(a, q) <= 0) return false; } return true; }
  /* eta' quando il fattore di scala vale a (ramo in espansione): t = ∫₀^a da/(a H); con a = s² l'integrando e' regolare in 0 */
  function tempo(a, p, n) {
    var q = norm(p), H = hGyr(q);
    return simpson(function (s) { if (s <= 0) return 0; var aa = s * s, e = E(aa, q); return e > 0 ? 2 / (s * e) : 0; }, 0, Math.sqrt(a), n || 4000) / H;
  }
  function eta(p) { return tempo(1, p); }
  function etaEdS(H0) { return 2 / 3 * GYR_H / H0; }
  /* formula chiusa per materia + radiazione (Λ trascurabile, a piccolo): H₀t = (2 a_eq^{3/2}/(3√Ω_m))[(y−2)√(y+1) + 2], y = a/a_eq */
  function tempoMR(a, p) { var q = norm(p), aeq = q.Or / q.Om, y = a / aeq; return 2 * Math.pow(aeq, 1.5) / (3 * Math.sqrt(q.Om)) * ((y - 2) * Math.sqrt(y + 1) + 2) / hGyr(q); }
  function zEquivalenza(p) { var q = norm(p); return q.Om / q.Or - 1; }
  /* Ω_r da T_CMB e N_eff: Ω_γh² = 2,473·10⁻⁵ (T/2,7255)⁴, neutrini × (1 + 0,2271 N_eff) */
  function omegaR(H0, T, Neff) { var h = H0 / 100; return 2.473e-5 * Math.pow((T || T_CMB) / 2.7255, 4) * (1 + 0.2271 * (Neff == null ? 3.046 : Neff)) / (h * h); }
  function decelerazione(a, p) { var q = norm(p), e2 = E2(a, q); return (q.Or / Math.pow(a, 4) + 0.5 * q.Om / Math.pow(a, 3) - q.OL) / e2; }
  function zAccelerazione(p) { var q = norm(p); if (q.OL <= 0) return null; var lo = 0.01, hi = 1; if (decelerazione(hi, p) > 0) return null; for (var k = 0; k < 80; k++) { var m = 0.5 * (lo + hi); if (decelerazione(m, p) > 0) lo = m; else hi = m; } return 1 / (0.5 * (lo + hi)) - 1; }

  /* ═══ distanze (Mpc) ═══════════════════════════════════════════════════ */
  /* integrali in x = ln(1+z): dz = (1+z) dx, cosi' anche z = 1100 e' preciso con pochi punti */
  function comovente(z, p, n) { var q = norm(p); if (z <= 0) return 0; return C_KMS / q.H0 * simpson(function (x) { var zz = Math.exp(x) - 1; return Math.exp(x) / Ez(zz, q); }, 0, Math.log(1 + z), n || 2000); }
  function trasversale(z, p) {
    var q = norm(p), Dc = comovente(z, p), DH = C_KMS / q.H0, k = Math.sqrt(Math.abs(q.Ok));
    if (q.Ok > 1e-8) return DH / k * Math.sinh(k * Dc / DH);
    if (q.Ok < -1e-8) return DH / k * Math.sin(k * Dc / DH);
    return Dc;
  }
  function luminosita(z, p) { return (1 + z) * trasversale(z, p); }
  function diametro(z, p) { return trasversale(z, p) / (1 + z); }
  function ritorno(z, p, n) { var q = norm(p); if (z <= 0) return 0; return simpson(function (x) { return 1 / Ez(Math.exp(x) - 1, q); }, 0, Math.log(1 + z), n || 2000) / hGyr(q); }
  function zMaxDiametro(p) { var a = 0.3, b = 6, g = (Math.sqrt(5) - 1) / 2; for (var k = 0; k < 80; k++) { var x1 = b - g * (b - a), x2 = a + g * (b - a); if (diametro(x1, p) < diametro(x2, p)) a = x1; else b = x2; } return 0.5 * (a + b); }
  /* tutte le distanze su una griglia in un solo passaggio (integrale cumulativo a trapezi in x = ln(1+z)), per i grafici */
  function tabellaDistanze(p, zs) {
    var q = norm(p), DH = C_KMS / q.H0, H = hGyr(q), out = { z: zs, DC: [], DM: [], DL: [], DA: [], TL: [] }, k = Math.sqrt(Math.abs(q.Ok));
    var x = 0, Ic = 0, It = 0, f0 = 1 / Ez(0, q), g0 = f0;
    for (var i = 0; i < zs.length; i++) {
      var xt = Math.log(1 + zs[i]), n = Math.max(1, Math.ceil((xt - x) / 0.002)), h = (xt - x) / n;
      for (var j = 0; j < n; j++) { var x1 = x + h, e = Ez(Math.exp(x1) - 1, q), f1 = Math.exp(x1) / e, g1 = 1 / e; Ic += 0.5 * h * (f0 + f1); It += 0.5 * h * (g0 + g1); f0 = f1; g0 = g1; x = x1; }
      var dc = DH * Ic, dm = q.Ok > 1e-8 ? DH / k * Math.sinh(k * Ic) : q.Ok < -1e-8 ? DH / k * Math.sin(k * Ic) : dc;
      out.DC.push(dc); out.DM.push(dm); out.DL.push((1 + zs[i]) * dm); out.DA.push(dm / (1 + zs[i])); out.TL.push(It / H);
    }
    return out;
  }
  function modulo(z, p) { return 5 * Math.log10(luminosita(z, p) * 1e6 / 10); }

  /* ═══ CMB: scala acustica e spettro ════════════════════════════════════ */
  /* redshift del disaccoppiamento (formula di Hu & Sugiyama 1996) */
  function zStella(obh2, omh2) {
    var g1 = 0.0783 * Math.pow(obh2, -0.238) / (1 + 39.5 * Math.pow(obh2, 0.763)), g2 = 0.560 / (1 + 21.1 * Math.pow(obh2, 1.81));
    return 1048 * (1 + 0.00124 * Math.pow(obh2, -0.738)) * (1 + g1 * Math.pow(omh2, g2));
  }
  /* orizzonte sonoro comovente r_s = ∫_{z*}^∞ c_s dz/H, c_s = c/√(3(1+R)), R = ¾ ρ_b/ρ_γ */
  function orizzonteSonoro(p, obh2, zs) {
    var q = norm(p), h = q.H0 / 100, ogh2 = 2.473e-5;
    return simpson(function (x) { var z = Math.exp(x) - 1, R = 0.75 * obh2 / ogh2 / (1 + z); return Math.exp(x) * C_KMS / Math.sqrt(3 * (1 + R)) / (q.H0 * Ez(z, q)); }, Math.log(1 + zs), Math.log(1 + 1e9), 3000);
  }
  function scalaAcustica(p, obh2) {
    var q = norm(p), h = q.H0 / 100, zs = zStella(obh2 || 0.0224, q.Om * h * h), rs = orizzonteSonoro(p, obh2 || 0.0224, zs), DM = trasversale(zs, p);
    return { zs: zs, rs: rs, DM: DM, lA: Math.PI * DM / rs, theta: rs / DM * 180 / Math.PI };
  }
  /* spettro illustrativo D_ℓ = ℓ(ℓ+1)C_ℓ/2π in μK²: plateau di Sachs-Wolfe, oscillazioni acustiche
     (R − cos x)² + s sin² x con x = πℓ/ℓ_A + φ (picchi dispari, compressioni, piu' alti per i barioni),
     smorzamento di Silk; i parametri sono tarati perche' con ℓ_A ≈ 300 i picchi somiglino a quelli di Planck */
  function spettroDl(l, lA) {
    lA = lA || 301;
    var x = Math.PI * l / lA + 0.84, drive = 1 / (1 + Math.pow(59 / l, 2));
    return 5000 * drive * (Math.pow(0.0975 - Math.cos(x), 2) + 0.53 * Math.pow(Math.sin(x), 2)) * Math.exp(-Math.pow(l / (1023 * lA / 301), 1.885)) + 1063 / (1 + Math.pow(l / 35.2, 1.5));
  }
  function spettroCl(l, lA) { return l < 2 ? 0 : 2 * Math.PI * spettroDl(l, lA) / (l * (l + 1)); }
  function picchi(lA, lmax) { var out = [], a = 0, b = 0; for (var l = 2; l < (lmax || 1500); l++) { var d = spettroDl(l, lA); if (b < a && a > d && l > 20) out.push([l - 1, a]); b = a; a = d; } return out; }
  /* polinomi di Legendre associati normalizzati λ_ℓm(x) (Y_ℓm = λ_ℓm e^{imφ}), ricorrenza stabile in ℓ */
  function lambdaRiga(L, x, out) {
    /* out[ℓ(ℓ+1)/2 + m] per 0 ≤ m ≤ ℓ ≤ L */
    var s = Math.sqrt(Math.max(0, 1 - x * x)), pmm = Math.sqrt(1 / (4 * Math.PI));
    for (var m = 0; m <= L; m++) {
      if (m > 0) pmm = -Math.sqrt((2 * m + 1) / (2 * m)) * s * pmm;
      var i0 = m * (m + 1) / 2 + m; out[i0] = pmm;
      if (m === L) break;
      var p1 = x * Math.sqrt(2 * m + 3) * pmm; out[(m + 1) * (m + 2) / 2 + m] = p1;
      var p0 = pmm;
      for (var l = m + 2; l <= L; l++) {
        var a = Math.sqrt((4 * l * l - 1) / (l * l - m * m)), b = Math.sqrt(((l - 1) * (l - 1) - m * m) / (4 * (l - 1) * (l - 1) - 1));
        var p2 = a * (x * p1 - b * p0); out[l * (l + 1) / 2 + m] = p2; p0 = p1; p1 = p2;
      }
    }
    return out;
  }
  /* coefficienti casuali: b_ℓm, c_ℓm ~ N(0, C_ℓ) per il campo reale T = Σ λ_ℓ0 a_ℓ0 + √2 Σ_{m>0} λ_ℓm (b cos mφ + c sin mφ) */
  function coefficienti(L, cl, seme) {
    var rnd = mulberry32(seme || 1), n = (L + 1) * (L + 2) / 2, B = new Float64Array(n), Cc = new Float64Array(n);
    for (var l = 2; l <= L; l++) { var sd = Math.sqrt(cl(l)); for (var m = 0; m <= l; m++) { var i = l * (l + 1) / 2 + m; B[i] = sd * gauss(rnd); Cc[i] = m ? sd * gauss(rnd) : 0; } }
    return { L: L, B: B, C: Cc };
  }
  /* sintesi della mappa equirettangolare (Nφ × Nθ), riga per riga: crea → passo(n righe) finche' finito */
  function mappaCMB(L, Nphi, Nth, coef) {
    var map = new Float32Array(Nphi * Nth), lam = new Float64Array((L + 1) * (L + 2) / 2), Sc = new Float64Array(L + 1), Ss = new Float64Array(L + 1);
    var cosT = new Float64Array(Nphi), sinT = new Float64Array(Nphi), j = 0, R2 = Math.SQRT2;
    for (var k = 0; k < Nphi; k++) { cosT[k] = Math.cos(2 * Math.PI * k / Nphi); sinT[k] = Math.sin(2 * Math.PI * k / Nphi); }
    var M = { map: map, Nphi: Nphi, Nth: Nth, L: L, finito: false };
    M.passo = function (nr) {
      for (var r = 0; r < nr && j < Nth; r++, j++) {
        var th = Math.PI * (j + 0.5) / Nth, x = Math.cos(th);
        lambdaRiga(L, x, lam);
        for (var m = 0; m <= L; m++) {
          var sc = 0, ss = 0;
          for (var l = Math.max(2, m); l <= L; l++) { var i = l * (l + 1) / 2 + m; sc += coef.B[i] * lam[i]; ss += coef.C[i] * lam[i]; }
          Sc[m] = m ? R2 * sc : sc; Ss[m] = R2 * ss;
        }
        var off = j * Nphi;
        for (k = 0; k < Nphi; k++) {
          var v = Sc[0], idx = 0;
          for (m = 1; m <= L; m++) { idx += k; if (idx >= Nphi) idx -= Nphi; v += Sc[m] * cosT[idx] + Ss[m] * sinT[idx]; }
          map[off + k] = v;
        }
      }
      if (j >= Nth) M.finito = true;
      return M.finito;
    };
    return M;
  }
  function varianzaTeorica(L, cl) { var s = 0; for (var l = 2; l <= L; l++) s += (2 * l + 1) * cl(l); return s / (4 * Math.PI); }
  function statMappa(M) {
    var sw = 0, s1 = 0, s2 = 0;
    for (var j = 0; j < M.Nth; j++) { var w = Math.sin(Math.PI * (j + 0.5) / M.Nth); for (var k = 0; k < M.Nphi; k++) { var v = M.map[j * M.Nphi + k]; sw += w; s1 += w * v; s2 += w * v * v; } }
    var media = s1 / sw; return { media: media, varianza: s2 / sw - media * media };
  }
  /* corpo nero: brillanza B_ν in MJy/sr, ν in GHz */
  function planckNu(nuGHz, T) { var nu = nuGHz * 1e9, x = H_PL * nu / (K_B * T); return 2 * H_PL * nu * nu * nu / (C_SI * C_SI) / Math.expm1(x) / 1e-20; }
  function piccoPlanckGHz(T) { var lo = 1, hi = 2000; for (var k = 0; k < 100; k++) { var m = 0.5 * (lo + hi), d = planckNu(m * 1.0001, T) - planckNu(m * 0.9999, T); if (d > 0) lo = m; else hi = m; } return 0.5 * (lo + hi); }

  /* ═══ storia termica ═══════════════════════════════════════════════════ */
  /* era della radiazione: t = 2,42 s/√g* · (1 MeV/kT)² */
  function tempoDaT(TMeV, gstar) { return 2.42 / Math.sqrt(gstar) / (TMeV * TMeV); }
  function TdaTempo(ts, gstar) { return Math.sqrt(2.42 / (Math.sqrt(gstar) * ts)); }
  function gstarNu(Nnu) { return 2 + 7 / 8 * (4 + 2 * Nnu); }
  /* nucleosintesi «a mano»: congelamento di n/p a T_f ∝ g*^{1/6} (Γ ∝ T⁵ = H ∝ √g* T²), poi decadimento del neutrone
     fino a t_nuc, quando quasi tutti i neutroni finiscono nell'elio 4: Y = 2(n/p)/(1 + n/p) */
  function elio(Nnu, tau) {
    var g = gstarNu(Nnu == null ? 3 : Nnu), Tf = 0.75 * Math.pow(g / 10.75, 1 / 6), np0 = Math.exp(-1.2933 / Tf), tn = 180 * Math.sqrt(10.75 / g);
    var np = np0 * Math.exp(-tn / (tau || 879.4));
    return { g: g, Tf: Tf, np0: np0, tnuc: tn, np: np, Y: 2 * np / (1 + np) };
  }
  function temperatura(z) { return T_CMB * (1 + z); }
  /* tabella a(t) integrando l'equazione di accelerazione ä = H₀² a[−Ω_r a⁻⁴ − ½Ω_m a⁻³ + Ω_Λ] (vale anche se l'universo ricollassa) */
  function tabellaA(p, tmax) {
    var q = norm(p), H = hGyr(q), a = 2e-3, ta = tempo(a, p, 800), v = H * a * E(a, q), T = [ta], A = [a];
    function acc(x) { return H * H * x * (-q.Or / Math.pow(x, 4) - 0.5 * q.Om / Math.pow(x, 3) + q.OL); }
    tmax = tmax || 60;
    for (var i = 0; i < 20000 && ta < tmax; i++) {
      var dt = Math.min(0.05, 0.01 * a / Math.max(1e-9, Math.abs(v)));
      var k1a = v, k1v = acc(a), k2a = v + 0.5 * dt * k1v, k2v = acc(a + 0.5 * dt * k1a), k3a = v + 0.5 * dt * k2v, k3v = acc(a + 0.5 * dt * k2a), k4a = v + dt * k3v, k4v = acc(a + dt * k3a);
      a += dt * (k1a + 2 * k2a + 2 * k3a + k4a) / 6; v += dt * (k1v + 2 * k2v + 2 * k3v + k4v) / 6; ta += dt;
      if (!(a > 2e-3) || a > 1e3) break;
      T.push(ta); A.push(a);
    }
    var t0 = null; for (i = 1; i < A.length; i++) if (A[i - 1] < 1 && A[i] >= 1) { t0 = T[i - 1] + (1 - A[i - 1]) / (A[i] - A[i - 1]) * (T[i] - T[i - 1]); break; }
    /* tempo conforme cumulativo η(t) = ∫ c dt/a (Mpc), con il pezzo iniziale della radiazione */
    var ETA = [C_MPC_GYR * 2 * T[0] / A[0]]; for (i = 1; i < T.length; i++) ETA.push(ETA[i - 1] + C_MPC_GYR * 0.5 * (1 / A[i] + 1 / A[i - 1]) * (T[i] - T[i - 1]));
    return { t: T, a: A, eta: ETA, t0: t0, ricollasso: A[A.length - 1] < A[Math.floor(A.length / 2)] };
  }
  function interp(xs, ys, x) {
    if (x <= xs[0]) return ys[0]; var n = xs.length; if (x >= xs[n - 1]) return ys[n - 1];
    var lo = 0, hi = n - 1; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (xs[m] > x) hi = m; else lo = m; }
    return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
  }

  F.calcolo.cosmo = {
    PLANCK: PLANCK, C_MPC_GYR: C_MPC_GYR, norm: norm, E: E, haBigBang: haBigBang, tempo: tempo, eta: eta, etaEdS: etaEdS, tempoMR: tempoMR,
    zEquivalenza: zEquivalenza, omegaR: omegaR, decelerazione: decelerazione, zAccelerazione: zAccelerazione,
    comovente: comovente, trasversale: trasversale, tabellaDistanze: tabellaDistanze, luminosita: luminosita, diametro: diametro, ritorno: ritorno, zMaxDiametro: zMaxDiametro, modulo: modulo,
    zStella: zStella, orizzonteSonoro: orizzonteSonoro, scalaAcustica: scalaAcustica, spettroDl: spettroDl, spettroCl: spettroCl, picchi: picchi,
    lambdaRiga: lambdaRiga, coefficienti: coefficienti, mappaCMB: mappaCMB, varianzaTeorica: varianzaTeorica, statMappa: statMappa,
    planckNu: planckNu, piccoPlanckGHz: piccoPlanckGHz, tempoDaT: tempoDaT, TdaTempo: TdaTempo, gstarNu: gstarNu, elio: elio, temperatura: temperatura,
    tabellaA: tabellaA, interp: interp
  };

  /* ═══ grafica ══════════════════════════════════════════════════════════ */
  function L3() { return globale.BSILab3D; }
  function scheda(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var lab = L3();
      if (!lab) { pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serve il Laboratorio 3D (bsi-lab3d.js).', 'The 3D Laboratory (bsi-lab3d.js) is required.') })); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); destra.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () {
        attesa.remove();
        var S = new lab.Scena(destra, 0.66);
        S.cam.far = 8000; S.cam.updateProjectionMatrix();
        S.ren.setClearColor(0x02050b, 1);
        div._scena = S;
        costruisci(pan, S, destra);
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function casella(pan, etichetta, valore, cambia) {
    var c = F.el('input', { type: 'checkbox' }); c.checked = !!valore;
    var l = F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(etichetta) })]);
    c.addEventListener('change', function () { cambia(c.checked); }); pan.appendChild(l); return c;
  }
  function controlliTempo(pan, st) {
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli del tempo', 'Time controls') });
    var bp = F.el('button', { type: 'button' });
    function agg() { bp.textContent = st.pausa ? '▶' : '❚❚'; var n = st.pausa ? t('Avvia', 'Play') : t('Pausa', 'Pause'); bp.title = n; bp.setAttribute('aria-label', n); }
    bp.addEventListener('click', function () { st.pausa = !st.pausa; agg(); if (st.sveglia) st.sveglia(); });
    riga.appendChild(bp); agg();
    var vel = [];
    [0.25, 0.5, 1, 2, 4].forEach(function (v) {
      var b = F.el('button', { type: 'button', testo: '×' + (v === 0.25 ? '¼' : v === 0.5 ? '½' : v), title: t('Velocità ', 'Speed ') + v, 'aria-label': t('Velocità ', 'Speed ') + v, onclick: function () { st.vel = v; vel.forEach(function (x) { x[1].setAttribute('aria-pressed', String(x[0] === v)); }); } });
      b.setAttribute('aria-pressed', String(v === (st.vel || 1))); vel.push([v, b]); riga.appendChild(b);
    });
    var et = F.el('span'); riga.appendChild(et);
    pan.appendChild(riga);
    return { tempo: function (s) { et.textContent = s; }, aggiorna: agg };
  }
  var bagliore = null;
  function texBagliore(T) {
    if (bagliore) return bagliore;
    var c = globale.document.createElement('canvas'); c.width = c.height = 64;
    var q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = gr; q.fillRect(0, 0, 64, 64);
    bagliore = new T.CanvasTexture(c); return bagliore;
  }
  function sprite(T, col, s, opac) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: texBagliore(T), color: col, transparent: true, opacity: opac == null ? 1 : opac, blending: T.AdditiveBlending, depthWrite: false }));
    sp.scale.set(s, s, 1); return sp;
  }
  /* colore di una lunghezza d'onda visibile (nm); oltre 700 nm rosso cupo che si spegne (infrarosso) */
  function coloreLambda(l) {
    var r = 0, g = 0, b = 0;
    if (l < 380) { r = 0.5; g = 0; b = 1; }
    else if (l < 440) { r = -(l - 440) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = -(l - 645) / 65; }
    else { r = 1; }
    var f = l > 700 ? Math.max(0.25, Math.exp(-(l - 700) / 600)) : 1;
    return [r * f, g * f, b * f];
  }
  /* colore di corpo nero (temperatura in K), approssimazione di Tanner Helland */
  function coloreT(T) {
    var x = Math.max(1000, Math.min(40000, T)) / 100, r, g, b;
    r = x <= 66 ? 255 : 329.7 * Math.pow(x - 60, -0.1332);
    g = x <= 66 ? 99.47 * Math.log(x) - 161.1 : 288.1 * Math.pow(x - 60, -0.0755);
    b = x >= 66 ? 255 : x <= 19 ? 0 : 138.5 * Math.log(x - 10) - 305.0;
    return [Math.max(0, Math.min(255, r)) / 255, Math.max(0, Math.min(255, g)) / 255, Math.max(0, Math.min(255, b)) / 255];
  }
  /* i cursori cosmologici comuni */
  function cursoriCosmo(pan, p, cambia, opz) {
    opz = opz || {};
    var c = {};
    c.Om = F.cursore(pan, ['Ω_m (materia)', 'Ω_m (matter)'], 0.05, opz.maxOm || 1.5, 0.005, p.Om, function (v) { p.Om = v; cambia(); }, function (v) { return v.toFixed(3); });
    c.OL = F.cursore(pan, ['Ω_Λ (energia oscura)', 'Ω_Λ (dark energy)'], opz.minOL != null ? opz.minOL : -0.5, 1.5, 0.005, p.OL, function (v) { p.OL = v; cambia(); }, function (v) { return v.toFixed(3); });
    if (!opz.senzaOr) c.Or = F.cursore(pan, ['log₁₀ Ω_r (radiazione)', 'log₁₀ Ω_r (radiation)'], -5, -2, 0.01, Math.log10(p.Or), function (v) { p.Or = Math.pow(10, v); cambia(); }, function (v) { return v.toFixed(2); });
    c.H0 = F.cursore(pan, ['H₀ (km/s/Mpc)', 'H₀ (km/s/Mpc)'], 50, 90, 0.1, p.H0, function (v) { p.H0 = v; cambia(); }, function (v) { return v.toFixed(1); });
    F.bottone(pan, ['Valori di Planck 2018', 'Planck 2018 values'], function () { p.Om = PLANCK.Om; p.OL = PLANCK.OL; p.Or = PLANCK.Or; p.H0 = PLANCK.H0; ['Om', 'OL', 'H0'].forEach(function (k) { c[k].value = p[k]; c[k].dispatchEvent(new Event('input')); }); if (c.Or) { c.Or.value = Math.log10(p.Or); c.Or.dispatchEvent(new Event('input')); } cambia(); });
    return c;
  }
  function copia(p) { return { Om: p.Om, OL: p.OL, Or: p.Or, H0: p.H0 }; }
  function descrizione(p) {
    var q = norm(p), s = 'Ω_k = ' + q.Ok.toFixed(3) + (Math.abs(q.Ok) < 0.005 ? t(' (piatto)', ' (flat)') : q.Ok > 0 ? t(' (aperto, curvatura negativa)', ' (open, negative curvature)') : t(' (chiuso, curvatura positiva)', ' (closed, positive curvature)'));
    return s;
  }

  /* ─── scheda 1: l'universo che si espande ─────────────────────────────── */
  function schedaEspansione(pan, S, destra) {
    var T = S.T, p = copia(PLANCK), st = { pausa: false, vel: 1, t: 1, auto: true };
    var info = nota(pan);
    cursoriCosmo(pan, p, function () { clearTimeout(st.tm); st.tm = setTimeout(ricalcola, 60); });
    casella(pan, ['Emetti luce ogni 2 Gyr', 'Emit light every 2 Gyr'], st.auto, function (v) { st.auto = v; });
    F.bottone(pan, ['✦ Emetti luce adesso', '✦ Emit light now'], function () { emetti(); });
    F.bottone(pan, ['↺ Dal Big Bang', '↺ From the Big Bang'], function () { st.t = tab.t[0] + 0.3; fotoni = []; aggiornaFotoni(); });
    var ctl = controlliTempo(pan, st);
    nota(pan, t('Le galassie restano ferme nella griglia <b>comovente</b> x; le distanze proprie sono d = a(t)·x, quindi crescono tutte nello stesso rapporto: chiunque, da qualunque galassia, vede le altre allontanarsi con v = H d (legge di Hubble-Lemaître, H = ȧ/a). Non c’è un centro: è lo spazio che si dilata. Un fotone percorre in coordinate comoventi dχ = c dt/a: emesso quando il fattore di scala era a_e e ricevuto quando vale a_o, la sua lunghezza d’onda è stirata di 1 + z = a_o/a_e (qui da 450 nm, blu, verso il rosso e l’infrarosso). Con Ω_Λ > 0 l’espansione prima rallenta (q > 0, domina la materia) poi accelera (q < 0); con molta materia e poca Λ l’universo arriva a un massimo e ricollassa. Il tempo cosmico è quello degli osservatori comoventi.',
      'Galaxies stay fixed in the <b>comoving</b> grid x; proper distances are d = a(t)·x, so they all grow by the same factor: anyone, from any galaxy, sees the others recede at v = H d (Hubble-Lemaître law, H = ȧ/a). There is no centre: space itself stretches. A photon travels dχ = c dt/a in comoving coordinates: emitted when the scale factor was a_e and received when it is a_o, its wavelength is stretched by 1 + z = a_o/a_e (here from 450 nm, blue, towards red and infrared). With Ω_Λ > 0 expansion first decelerates (q > 0, matter dominates) then accelerates (q < 0); with much matter and little Λ the universe reaches a maximum and recollapses. Cosmic time is that of comoving observers.'));
    var cv = F.tela(destra, 0.42);
    var N = 7, SP = 1000, K = 4 / SP, gal = [], punti = null, reticolo = null, tab = null, fotoni = [], tEmissione = 0, linee = null;
    var rnd = mulberry32(5);
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) for (var k = 0; k < N; k++) gal.push([(i - 3) * SP + 120 * gauss(rnd), (j - 3) * SP + 120 * gauss(rnd), (k - 3) * SP + 120 * gauss(rnd)]);
    gal[(3 * N + 3) * N + 3] = [0, 0, 0]; /* noi, al centro */
    /* galassie: punti con il bagliore */
    var pos = new Float32Array(3 * gal.length), col = new Float32Array(3 * gal.length);
    gal.forEach(function (g, n) { var c = n === (3 * N + 3) * N + 3 ? [0.4, 1, 0.85] : [0.95, 0.85 + 0.15 * rnd(), 0.7 + 0.3 * rnd()]; col[3 * n] = c[0]; col[3 * n + 1] = c[1]; col[3 * n + 2] = c[2]; });
    var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(pos, 3)); gg.setAttribute('color', new T.BufferAttribute(col, 3));
    punti = new T.Points(gg, new T.PointsMaterial({ size: 1.1, map: texBagliore(T), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    punti.frustumCulled = false; S.aggiungi(punti);
    var noi = sprite(T, 0x5eead4, 2.2); S.aggiungi(noi);
    var etNoi = L3().testo3d(T, t('noi', 'us'), '#5eead4', 0.9); etNoi.position.set(0, 0, 1.2); S.aggiungi(etNoi);
    /* reticolo comovente: segmenti tra vicini sui piani principali */
    var segs = []; for (i = 0; i < N; i++) for (j = 0; j < N; j++) { segs.push([[(i - 3) * SP, (j - 3) * SP, -3 * SP], [(i - 3) * SP, (j - 3) * SP, 3 * SP]], [[(i - 3) * SP, -3 * SP, (j - 3) * SP], [(i - 3) * SP, 3 * SP, (j - 3) * SP]], [[-3 * SP, (i - 3) * SP, (j - 3) * SP], [3 * SP, (i - 3) * SP, (j - 3) * SP]]); }
    var rp = new Float32Array(segs.length * 6), rp0 = new Float32Array(segs.length * 6);
    segs.forEach(function (s, n) { for (var c = 0; c < 3; c++) { rp0[6 * n + c] = s[0][c]; rp0[6 * n + 3 + c] = s[1][c]; } });
    var rg = new T.BufferGeometry(); rg.setAttribute('position', new T.BufferAttribute(rp, 3));
    reticolo = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0x2a4a6e, transparent: true, opacity: 0.22, depthWrite: false })); reticolo.frustumCulled = false; S.aggiungi(reticolo);
    /* fotoni: fino a 24, con la scia */
    var NF = 24, NS = 60, fp = new Float32Array(3 * NF), fc = new Float32Array(3 * NF), sp = new Float32Array(3 * NF * NS * 2), sc = new Float32Array(3 * NF * NS * 2);
    var fgeo = new T.BufferGeometry(); fgeo.setAttribute('position', new T.BufferAttribute(fp, 3)); fgeo.setAttribute('color', new T.BufferAttribute(fc, 3));
    var fpts = new T.Points(fgeo, new T.PointsMaterial({ size: 1.6, map: texBagliore(T), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); fpts.frustumCulled = false; S.aggiungi(fpts);
    var sgeo = new T.BufferGeometry(); sgeo.setAttribute('position', new T.BufferAttribute(sp, 3)); sgeo.setAttribute('color', new T.BufferAttribute(sc, 3));
    linee = new T.LineSegments(sgeo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); linee.frustumCulled = false; S.aggiungi(linee);
    function emetti() {
      if (!tab) return;
      var cand = gal.filter(function (g) { var d = Math.hypot(g[0], g[1], g[2]); return d > 900 && d < 3300; });
      for (var n = 0; n < 6; n++) {
        var g = cand[Math.floor(rnd() * cand.length)];
        if (fotoni.length >= NF) fotoni.shift();
        fotoni.push({ x: g, te: st.t, ae: aDi(st.t), etae: interp(tab.t, tab.eta, st.t), arrivato: false, z: null });
      }
      aggiornaFotoni();
    }
    function aDi(tt) { return interp(tab.t, tab.a, tt); }
    var ultimiZ = [];
    function aggiornaFotoni() {
      var a = aDi(st.t), etaOra = interp(tab.t, tab.eta, st.t);
      fp.fill(0); fc.fill(0); sp.fill(0); sc.fill(0);
      fotoni.forEach(function (f, n) {
        var d0 = Math.hypot(f.x[0], f.x[1], f.x[2]), chi = Math.min(d0, Math.max(0, etaOra - f.etae)), u = 1 - chi / d0;
        if (!f.arrivato && chi >= d0) { f.arrivato = true; f.z = a / f.ae - 1; ultimiZ.unshift([f.z, f.te]); ultimiZ = ultimiZ.slice(0, 4); }
        if (f.arrivato) return;
        var lam = 450 * a / f.ae, c = coloreLambda(lam);
        for (var k = 0; k < 3; k++) { fp[3 * n + k] = f.x[k] * u * a * K; fc[3 * n + k] = c[k]; }
        /* scia: dal punto di partenza (comovente) al fotone, colori lungo il percorso */
        for (var s = 0; s < NS; s++) {
          var u1 = 1 - (chi * s / NS) / d0, u2 = 1 - (chi * (s + 1) / NS) / d0, b = 6 * (n * NS + s);
          /* la parte di scia emessa al tempo in cui il fotone stava li' ha la lunghezza d'onda di allora */
          var cc = coloreLambda(450 * interp(tab.eta, tab.a, f.etae + chi * (s + 0.5) / NS) / f.ae), fade = 0.25 + 0.75 * s / NS;
          for (k = 0; k < 3; k++) { sp[b + k] = f.x[k] * u1 * a * K; sp[b + 3 + k] = f.x[k] * u2 * a * K; sc[b + k] = cc[k] * fade * 0.8; sc[b + 3 + k] = cc[k] * fade * 0.8; }
        }
      });
      fgeo.attributes.position.needsUpdate = true; fgeo.attributes.color.needsUpdate = true; sgeo.attributes.position.needsUpdate = true; sgeo.attributes.color.needsUpdate = true;
    }
    function posiziona() {
      var a = aDi(st.t);
      gal.forEach(function (g, n) { pos[3 * n] = g[0] * a * K; pos[3 * n + 1] = g[1] * a * K; pos[3 * n + 2] = g[2] * a * K; });
      gg.attributes.position.needsUpdate = true;
      for (var i = 0; i < rp.length; i++) rp[i] = rp0[i] * a * K;
      rg.attributes.position.needsUpdate = true;
      aggiornaFotoni();
    }
    function ricalcola() {
      if (!haBigBang(p)) { info.innerHTML = t('Con questi parametri E²(a) diventa negativo prima di a = 1: niente Big Bang (universo «a rimbalzo»). Riduci Ω_Λ o aumenta Ω_m.', 'With these parameters E²(a) becomes negative before a = 1: no Big Bang («bounce» universe). Lower Ω_Λ or raise Ω_m.'); return; }
      tab = tabellaA(p, 60); fotoni = []; ultimiZ = [];
      if (tab.t0 == null) { info.innerHTML = t('Questo universo ricollassa prima di raggiungere la densità di oggi (a non arriva a 1).', 'This universe recollapses before reaching today’s density (a never reaches 1).'); }
      st.t = Math.min(st.t, tab.t[tab.t.length - 1]);
      if (st.t < tab.t[0]) st.t = tab.t[0] + 0.3;
      grafico(); posiziona();
    }
    function grafico() {
      var xs = [], ys = [], passo = Math.max(1, Math.floor(tab.t.length / 400));
      for (var i = 0; i < tab.t.length; i += passo) { xs.push(tab.t[i]); ys.push(tab.a[i]); }
      var EdS = xs.map(function (x) { return Math.pow(x / etaEdS(p.H0), 2 / 3); });
      var tmax = xs[xs.length - 1], a = aDi(st.t);
      var P = F.grafico(cv, { serie: [{ x: xs, y: ys, col: '#5eead4', etich: ['a(t)', 'a(t)'] }, { x: xs, y: EdS, col: '#8494a8', tratt: true, larg: 1.2, etich: ['Einstein–de Sitter', 'Einstein–de Sitter'] }], punti: [{ x: st.t, y: a, col: '#ffd24a', r: 5 }], xmin: 0, xmax: Math.min(tmax, 40), ymin: 0, ymax: Math.min(4, Math.max(1.3, Math.max.apply(null, ys.filter(function (v, k) { return xs[k] <= 40; })) * 1.05)), xl: ['t (miliardi di anni)', 't (billion years)'], yl: ['a(t)', 'a(t)'], legenda: [{ col: '#5eead4', etich: ['a(t) dei parametri scelti', 'a(t) for the chosen parameters'] }, { col: '#8494a8', etich: ['Einstein–de Sitter (Ω_m = 1)', 'Einstein–de Sitter (Ω_m = 1)'] }], descr: ['Fattore di scala in funzione del tempo', 'Scale factor versus time'] });
      if (tab.t0) { P.q.strokeStyle = 'rgba(255,210,74,.5)'; P.q.setLineDash([4, 4]); P.q.beginPath(); P.q.moveTo(P.X(tab.t0), P.Y(0)); P.q.lineTo(P.X(tab.t0), P.Y(1)); P.q.stroke(); P.q.setLineDash([]); P.q.fillStyle = '#ffd24a'; P.q.fillText(t('oggi', 'today'), P.X(tab.t0) + 4, P.Y(0.08)); }
      testo();
    }
    function testo() {
      var a = aDi(st.t), q = norm(p), H = hGyr(q) * E(a, q) * GYR_H, za = zAccelerazione(p);
      info.innerHTML = 't = <b>' + st.t.toFixed(2) + ' Gyr</b>, a = ' + a.toFixed(3) + ' (z = ' + (1 / a - 1).toFixed(2) + '), H = ' + H.toFixed(1) + ' km/s/Mpc, q = ' + decelerazione(a, p).toFixed(2) + '<br>' +
        (tab.t0 ? t('Età dell’universo oggi: ', 'Age of the universe today: ') + '<b>' + tab.t0.toFixed(2) + ' Gyr</b> (EdS 2/3H₀ = ' + etaEdS(p.H0).toFixed(2) + ' Gyr). ' : '') + descrizione(p) + '. ' + (za != null ? t('Accelera da z = ', 'Accelerating since z = ') + za.toFixed(2) + '. ' : '') + (tab.ricollasso ? t('Destino: ricollasso (Big Crunch).', 'Fate: recollapse (Big Crunch).') : '') +
        (ultimiZ.length ? '<br>' + t('Fotoni arrivati: ', 'Photons received: ') + ultimiZ.map(function (u) { return 'z = ' + u[0].toFixed(2); }).join(', ') : '');
      S.didascalia.textContent = t('Universo in espansione: ', 'Expanding universe: ') + 't = ' + st.t.toFixed(1) + ' Gyr, a = ' + a.toFixed(2);
    }
    F.alRidimensiona(function () { if (tab) grafico(); });
    ricalcola();
    st.t = 3; posiziona(); grafico();
    st.sveglia = function () { S.avvia(); };
    var tg = 0;
    S.ogniFotogramma(function (dt) {
      if (st.pausa || !tab) return false;
      var prima = st.t;
      st.t += dt * 0.8 * st.vel;
      var fine = Math.min(tab.t[tab.t.length - 1], Math.max(30, (tab.t0 || 14) * 2));
      if (st.t >= fine) { st.t = tab.t[0] + 0.3; fotoni = []; }
      if (st.auto && Math.floor(st.t / 2) !== Math.floor(prima / 2)) emetti();
      posiziona();
      tg += dt; if (tg > 0.25) { tg = 0; grafico(); }
      ctl.tempo('t = ' + st.t.toFixed(1) + ' Gyr');
      return true;
    });
    S.inquadra(46, -0.7, 1.1);
  }

  /* ─── scheda 2: distanze e cono di luce ───────────────────────────────── */
  function schedaDistanze(pan, S, destra) {
    var T = S.T, p = copia(PLANCK), st = { z: 1.6, zmax: '10' };
    var info = nota(pan);
    cursoriCosmo(pan, p, function () { clearTimeout(st.tm); st.tm = setTimeout(tutto, 80); }, { senzaOr: true });
    F.cursore(pan, ['Redshift z dell’oggetto', 'Object redshift z'], 0.01, 10, 0.01, st.z, function (v) { st.z = v; testo(); marcatore(); }, function (v) { return v.toFixed(2); });
    F.scelta(pan, ['Asse del grafico', 'Chart axis'], [['3', 'z ≤ 3'], ['10', 'z ≤ 10'], ['1100', t('log₁₀(1+z), fino a z = 1100', 'log₁₀(1+z), up to z = 1100')]], st.zmax, function (v) { st.zmax = v; grafici(); });
    nota(pan, t('<b>Distanze</b> (Hogg 1999): D_C = (c/H₀)∫₀^z dz′/E(z′) è la distanza comovente (quella di oggi lungo la linea di vista); D_M = D_C se Ω_k = 0, altrimenti (c/H₀)/√|Ω_k| · sinh o sin. La distanza di luminosità D_L = (1+z) D_M dà il flusso F = L/(4πD_L²): un fattore (1+z) per l’energia di ogni fotone arrossata, uno per il ritmo di arrivo rallentato. La distanza di diametro angolare D_A = D_M/(1+z) dà l’angolo θ = ℓ/D_A: ha un <b>massimo</b> (z ≈ 1,6 per Planck), oltre il quale un oggetto più lontano appare più grande, perché la luce è partita quando l’universo era piccolo. Vale sempre D_L = (1+z)² D_A (relazione di Etherington). Tempo di ritorno t_L = ∫ dz/[(1+z)H]. <b>In 3D</b>: in verticale il tempo cosmico, in orizzontale la distanza propria. La «goccia» è il nostro cono di luce passato: la sua larghezza a ogni tempo è proprio D_A. La sfera di Hubble (viola) ha raggio c/H: le galassie fuori si allontanano più veloci della luce, eppure la loro luce di oggi a volte ci raggiungerà. Le linee grigie sono galassie a χ fisso.',
      '<b>Distances</b> (Hogg 1999): D_C = (c/H₀)∫₀^z dz′/E(z′) is the comoving distance (today’s, along the line of sight); D_M = D_C if Ω_k = 0, otherwise (c/H₀)/√|Ω_k| · sinh or sin. The luminosity distance D_L = (1+z) D_M gives the flux F = L/(4πD_L²): one factor (1+z) for the redshifted energy of each photon, one for the slower arrival rate. The angular-diameter distance D_A = D_M/(1+z) gives the angle θ = ℓ/D_A: it has a <b>maximum</b> (z ≈ 1.6 for Planck), beyond which a farther object looks larger, because the light left when the universe was small. Always D_L = (1+z)² D_A (Etherington relation). Lookback time t_L = ∫ dz/[(1+z)H]. <b>In 3D</b>: vertically cosmic time, horizontally proper distance. The «teardrop» is our past light cone: its width at each time is exactly D_A. The Hubble sphere (violet) has radius c/H: galaxies outside it recede faster than light, yet some of their light emitted today will reach us. Grey lines are galaxies at fixed χ.'));
    var cv1 = F.tela(destra, 0.5), cv2 = F.tela(destra, 0.36);
    var KX = 1.2, KT = 0.9, mk = null;
    function tutto() {
      S.pulisci();
      if (!haBigBang(p)) { info.innerHTML = t('Niente Big Bang con questi parametri.', 'No Big Bang with these parameters.'); return; }
      var tab = tabellaA(p, 45), t0 = tab.t0;
      if (!t0) { info.innerHTML = t('Questo universo non arriva ad a = 1.', 'This universe never reaches a = 1.'); return; }
      var eta0 = interp(tab.t, tab.eta, t0), q = norm(p);
      /* superfici di rivoluzione attorno all'asse z (tempo) */
      function rivoluzione(rad, tt, col, opac) {
        var nS = 60, pos = [], idx = [];
        for (var i = 0; i < rad.length; i++) for (var j = 0; j <= nS; j++) { var f = 2 * Math.PI * j / nS; pos.push(rad[i] * Math.cos(f), rad[i] * Math.sin(f), tt[i]); }
        for (i = 0; i < rad.length - 1; i++) for (j = 0; j < nS; j++) { var a = i * (nS + 1) + j, b = a + nS + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        var m = new T.Mesh(g, new T.MeshStandardMaterial({ color: col, transparent: true, opacity: opac, side: T.DoubleSide, depthWrite: false, roughness: 0.6, emissive: col, emissiveIntensity: 0.25 }));
        S.aggiungi(m);
        /* qualche meridiano e parallelo, invece del reticolo completo */
        for (var jj = 0; jj < nS; jj += 6) { var mer = []; for (var ii = 0; ii < rad.length; ii += 2) { var ff = 2 * Math.PI * jj / nS; mer.push([rad[ii] * Math.cos(ff), rad[ii] * Math.sin(ff), tt[ii]]); } S.aggiungi(L3().linea(T, mer, col, 0.25)); }
      }
      var rc = [], tc = [], rh = [], th = [], np = 90;
      for (var i = 0; i <= np; i++) {
        var tt = tab.t[0] + (t0 - tab.t[0]) * Math.pow(i / np, 1.5), a = interp(tab.t, tab.a, tt), e = interp(tab.t, tab.eta, tt);
        rc.push(a * (eta0 - e) / 1000 * KX); tc.push(tt * KT);
      }
      var tfin = Math.min(tab.t[tab.t.length - 1], 2 * t0);
      for (i = 0; i <= np; i++) { tt = tab.t[0] + (tfin - tab.t[0]) * i / np; a = interp(tab.t, tab.a, tt); rh.push(Math.min(40, C_KMS / (q.H0 * E(a, q)) / 1000 * KX)); th.push(tt * KT); }
      rivoluzione(rc, tc, 0xffd24a, 0.22);
      rivoluzione(rh, th, 0xb28dff, 0.08);
      /* linee d'universo delle galassie a χ fisso, in 4 direzioni */
      [2000, 4000, 6000, 8000, 10000, 12000, 14000].forEach(function (chi) {
        [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach(function (f) {
          var pts = []; for (var k = 0; k <= 80; k++) { var tt2 = tab.t[0] + (tfin - tab.t[0]) * k / 80, a2 = interp(tab.t, tab.a, tt2); pts.push([a2 * chi / 1000 * KX * Math.cos(f), a2 * chi / 1000 * KX * Math.sin(f), tt2 * KT]); }
          S.aggiungi(L3().linea(T, pts, 0x8494a8, 0.35));
        });
      });
      /* asse del tempo, oggi */
      S.aggiungi(L3().linea(T, [[0, 0, 0], [0, 0, tfin * KT]], 0x5eead4, 0.8));
      var cerchio = []; for (i = 0; i <= 96; i++) { var f2 = 2 * Math.PI * i / 96; cerchio.push([14 * KX * Math.cos(f2), 14 * KX * Math.sin(f2), t0 * KT]); }
      S.aggiungi(L3().linea(T, cerchio, 0x5eead4, 0.4));
      var eo = L3().testo3d(T, t('oggi, t₀ = ', 'today, t₀ = ') + t0.toFixed(2) + ' Gyr', '#5eead4', 0.8); eo.position.set(0, 0, t0 * KT + 0.8); S.aggiungi(eo);
      var eb = L3().testo3d(T, 'Big Bang', '#ffd24a', 0.7); eb.position.set(0, 0, -0.7); S.aggiungi(eb);
      var eh = L3().testo3d(T, t('sfera di Hubble c/H', 'Hubble sphere c/H'), '#b28dff', 0.6); eh.position.set(rh[np] * 0.7, 0, th[np]); S.aggiungi(eh);
      var el = L3().testo3d(T, t('cono di luce passato', 'past light cone'), '#ffd24a', 0.6); var im = rc.indexOf(Math.max.apply(null, rc)); el.position.set(rc[im] + 1.5, 0, tc[im]); S.aggiungi(el);
      mk = sprite(T, 0xff6b6b, 1.4); S.aggiungi(mk);
      st.tab = tab; st.t0 = t0; st.eta0 = eta0;
      marcatore();
      S.didascalia.textContent = t('Cono di luce passato e sfera di Hubble (tempo in verticale)', 'Past light cone and Hubble sphere (time vertical)');
      if (!S.vistaIniziale) S.inquadra(40, -1.2, 1.25);
      setTimeout(function () { grafici(); testo(); }, 0);
    }
    function marcatore() {
      if (!mk || !st.tab) return;
      var a = 1 / (1 + st.z), tt = interp(st.tab.a, st.tab.t, a), dA = diametro(st.z, p);
      mk.position.set(dA / 1000 * KX, 0, tt * KT); S.sporca = true; S.avvia();
    }
    function grafici() {
      var lg = st.zmax === '1100', zm = lg ? 1100 : +st.zmax, n = 160, xs = [], zs = [];
      for (var i = 1; i <= n; i++) { var z = lg ? Math.pow(10, 3.0414 * i / n) - 1 : zm * i / n; zs.push(z); xs.push(lg ? Math.log10(1 + z) : z); }
      var TD = tabellaDistanze(p, zs), g = function (v) { return v / 1000; }, dc = TD.DC.map(g), dl = TD.DL.map(g), da = TD.DA.map(g), lb = TD.TL, et = lb.map(function (L) { return st.t0 - L; });
      var ymax = lg ? 20 : Math.min(Math.max.apply(null, dl) * 1.05, 120);
      F.grafico(cv1, { serie: [{ x: xs, y: dc, col: '#5eead4', etich: ['D_C', 'D_C'] }, { x: xs, y: dl, col: '#ff8a80', etich: ['D_L', 'D_L'] }, { x: xs, y: da, col: '#ffd24a', etich: ['D_A', 'D_A'] }], xmin: lg ? 0 : 0, xmax: lg ? 3.0414 : zm, ymin: 0, ymax: ymax, xl: lg ? ['log₁₀(1+z)', 'log₁₀(1+z)'] : ['z', 'z'], yl: ['distanza (Gpc)', 'distance (Gpc)'], legenda: [{ col: '#5eead4', etich: ['comovente D_C', 'comoving D_C'] }, { col: '#ff8a80', etich: ['luminosità D_L', 'luminosity D_L'] }, { col: '#ffd24a', etich: ['diametro angolare D_A', 'angular diameter D_A'] }], descr: ['Distanze cosmologiche in funzione del redshift', 'Cosmological distances versus redshift'] });
      F.grafico(cv2, { serie: [{ x: xs, y: lb, col: '#6bcfff', etich: ['t_L', 't_L'] }, { x: xs, y: et, col: '#b28dff', etich: ['età', 'age'] }], xmin: 0, xmax: lg ? 3.0414 : zm, ymin: 0, ymax: Math.ceil(st.t0 + 0.5), xl: lg ? ['log₁₀(1+z)', 'log₁₀(1+z)'] : ['z', 'z'], yl: ['Gyr', 'Gyr'], legenda: [{ col: '#6bcfff', etich: ['tempo di ritorno', 'lookback time'] }, { col: '#b28dff', etich: ['età dell’universo a quel z', 'age of the universe at that z'] }], descr: ['Tempo di ritorno ed età in funzione del redshift', 'Lookback time and age versus redshift'] });
    }
    function testo() {
      if (!st.tab) return;
      var z = st.z, dc = comovente(z, p), dm = trasversale(z, p), dl = (1 + z) * dm, da = dm / (1 + z), L = ritorno(z, p), zmx = zMaxDiametro(p);
      info.innerHTML = 'z = <b>' + z.toFixed(2) + '</b>: D_C = ' + (dc / 1000).toFixed(3) + ' Gpc, D_L = ' + (dl / 1000).toFixed(3) + ' Gpc, D_A = ' + (da / 1000).toFixed(3) + ' Gpc<br>' +
        t('tempo di ritorno ', 'lookback ') + L.toFixed(2) + ' Gyr, ' + t('età allora ', 'age then ') + (st.t0 - L).toFixed(2) + ' Gyr; 1″ ↔ ' + (da * 1000 / 206265).toFixed(2) + ' kpc; ' + t('modulo di distanza ', 'distance modulus ') + 'μ = ' + modulo(z, p).toFixed(2) + '<br>' +
        t('Età oggi ', 'Age today ') + '<b>' + st.t0.toFixed(2) + ' Gyr</b>; ' + t('D_A massimo a z = ', 'D_A peaks at z = ') + '<b>' + zmx.toFixed(2) + '</b> (' + (diametro(zmx, p) / 1000).toFixed(2) + ' Gpc); D_C(z = 1100) = ' + (comovente(1100, p) / 1000).toFixed(2) + ' Gpc. ' + descrizione(p);
    }
    F.alRidimensiona(function () { if (st.tab) grafici(); });
    tutto();
  }

  /* ─── scheda 3: la radiazione cosmica di fondo ────────────────────────── */
  var MAPPA_PLANCK = [[0, [0.0, 0.0, 0.55]], [0.2, [0.0, 0.35, 0.95]], [0.4, [0.55, 0.85, 1.0]], [0.5, [0.98, 0.95, 0.88]], [0.62, [1.0, 0.82, 0.35]], [0.8, [1.0, 0.45, 0.05]], [1, [0.55, 0.05, 0.0]]];
  function mappaColore(f) { f = Math.max(0, Math.min(1, f)); for (var i = 1; i < MAPPA_PLANCK.length; i++) if (f <= MAPPA_PLANCK[i][0]) { var a = MAPPA_PLANCK[i - 1], b = MAPPA_PLANCK[i], u = (f - a[0]) / (b[0] - a[0]); return [a[1][0] + (b[1][0] - a[1][0]) * u, a[1][1] + (b[1][1] - a[1][1]) * u, a[1][2] + (b[1][2] - a[1][2]) * u]; } return MAPPA_PLANCK[MAPPA_PLANCK.length - 1][1]; }
  function schedaCMB(pan, S, destra) {
    var T = S.T, p = copia(PLANCK), st = { obh2: 0.0224, seme: 1, dipolo: false, dentro: false, L: 300 };
    var info = nota(pan), stato = nota(pan);
    cursoriCosmo(pan, p, function () { clearTimeout(st.tm); st.tm = setTimeout(rigenera, 250); }, { senzaOr: true, minOL: 0 });
    F.cursore(pan, ['Ω_b h² (barioni)', 'Ω_b h² (baryons)'], 0.01, 0.04, 0.0005, st.obh2, function (v) { st.obh2 = v; clearTimeout(st.tm); st.tm = setTimeout(rigenera, 250); }, function (v) { return v.toFixed(4); });
    F.bottone(pan, ['🎲 Un altro cielo', '🎲 Another sky'], function () { st.seme++; rigenera(); });
    casella(pan, ['Aggiungi il dipolo (moto del Sole, 3,36 mK)', 'Add the dipole (Sun’s motion, 3.36 mK)'], st.dipolo, function (v) { st.dipolo = v; colora(); });
    casella(pan, ['Guarda dall’interno (siamo al centro)', 'View from inside (we are at the centre)'], st.dentro, function (v) { st.dentro = v; vista(); });
    nota(pan, t('La CMB è la luce della ricombinazione (z* ≈ 1090, t ≈ 380 000 anni, T ≈ 3000 K), oggi un corpo nero perfetto a 2,7255 K (FIRAS: picco a 160 GHz, 1,06 mm). Le anisotropie ΔT/T ~ 10⁻⁵ sono un campo gaussiano: T(n̂) = Σ a_ℓm Y_ℓm(n̂) con ⟨|a_ℓm|²⟩ = C_ℓ, qui sintetizzato davvero con le armoniche sferiche fino a ℓ = 300 (riga per riga, polinomi di Legendre normalizzati). Lo spettro D_ℓ = ℓ(ℓ+1)C_ℓ/2π ha il plateau di Sachs-Wolfe a ℓ piccoli e poi i <b>picchi acustici</b>: il plasma fotoni-barioni oscillava come un suono, e alla ricombinazione i modi che avevano appena raggiunto la prima compressione massima avevano lunghezza pari all’orizzonte sonoro r_s ≈ 147 Mpc. Visto a D_M(z*) ≈ 14 Gpc sottende θ ≈ 0,6°: ℓ_A = π D_M/r_s ≈ 300 e il primo picco a ℓ ≈ 0,73 ℓ_A ≈ 220 (lo spostamento viene dalla fase dell’oscillazione). Se l’universo fosse chiuso o aperto D_M cambierebbe e il picco si sposterebbe: misurarlo a ℓ ≈ 220 dice che Ω_k ≈ 0. Più barioni rendono i picchi dispari (compressioni) più alti dei pari. Lo spettro disegnato è un modello illustrativo, non un calcolo di Boltzmann.',
      'The CMB is light from recombination (z* ≈ 1090, t ≈ 380,000 years, T ≈ 3000 K), today a perfect black body at 2.7255 K (FIRAS: peak at 160 GHz, 1.06 mm). The anisotropies ΔT/T ~ 10⁻⁵ are a Gaussian field: T(n̂) = Σ a_ℓm Y_ℓm(n̂) with ⟨|a_ℓm|²⟩ = C_ℓ, really synthesised here with spherical harmonics up to ℓ = 300 (row by row, normalised Legendre polynomials). The spectrum D_ℓ = ℓ(ℓ+1)C_ℓ/2π shows the Sachs-Wolfe plateau at low ℓ and then the <b>acoustic peaks</b>: the photon-baryon plasma oscillated like sound, and at recombination the modes that had just reached their first maximum compression had a wavelength equal to the sound horizon r_s ≈ 147 Mpc. Seen at D_M(z*) ≈ 14 Gpc it subtends θ ≈ 0.6°: ℓ_A = π D_M/r_s ≈ 300 and the first peak at ℓ ≈ 0.73 ℓ_A ≈ 220 (the shift comes from the oscillation phase). If the universe were closed or open D_M would change and the peak would move: measuring it at ℓ ≈ 220 says Ω_k ≈ 0. More baryons make the odd peaks (compressions) higher than the even ones. The drawn spectrum is an illustrative model, not a Boltzmann computation.'));
    var cvM = F.tela(destra, 0.5), cvS = F.tela(destra, 0.42), cvB = F.tela(destra, 0.36);
    var NP = 600, NT = 300, tela = globale.document.createElement('canvas'); tela.width = NP; tela.height = NT;
    var q2 = tela.getContext('2d'), img = q2.createImageData(NP, NT);
    /* una prima immagine a bande, cosi' la sfera si vede subito */
    for (var i = 0; i < NP * NT; i++) { img.data[4 * i] = 40; img.data[4 * i + 1] = 60; img.data[4 * i + 2] = 120; img.data[4 * i + 3] = 255; }
    q2.putImageData(img, 0, 0);
    var tex = new T.CanvasTexture(tela);
    var geo = new T.SphereGeometry(10, 96, 64); geo.rotateX(Math.PI / 2);
    var mat = new T.MeshBasicMaterial({ map: tex, side: T.FrontSide });
    var sfera = new T.Mesh(geo, mat); S.aggiungi(sfera);
    var occhio = sprite(T, 0x5eead4, 1.2); S.aggiungi(occhio);
    var M = null, lavoro = null, sa = null;
    function vista() { mat.side = st.dentro ? T.BackSide : T.FrontSide; mat.needsUpdate = true; S.inquadra(st.dentro ? 3 : 30, -1.2, 1.3); }
    function rigenera() {
      clearTimeout(lavoro);
      sa = scalaAcustica(p, st.obh2);
      if (!isFinite(sa.lA) || sa.lA <= 0) { stato.textContent = t('Parametri fuori dal dominio.', 'Parameters out of range.'); return; }
      var lA = sa.lA, cl = function (l) { return spettroCl(l, lA); };
      M = mappaCMB(st.L, NP, NT, coefficienti(st.L, cl, st.seme));
      M.sigma = Math.sqrt(varianzaTeorica(st.L, cl));
      spettro(); testo();
      var j0 = 0;
      (function lotto() {
        var t1 = Date.now(); while (!M.finito && Date.now() - t1 < 25) M.passo(2);
        stato.textContent = M.finito ? '' : t('Sintesi delle armoniche: ', 'Harmonic synthesis: ') + Math.round(100 * (M.finito ? 1 : (M.map.length ? riga() / NT : 0))) + ' %';
        if (M.finito) { colora(); return; }
        lavoro = setTimeout(lotto, 0);
      })();
      function riga() { var k = 0; for (var j = NT - 1; j >= 0; j--) if (M.map[j * NP + 3] !== 0) { k = j + 1; break; } return k; }
    }
    function colora() {
      if (!M || !M.finito) return;
      var s = M.sigma, d = img.data, dip = 3362 / 2.7255e6 * 2.7255e6; /* μK */
      var dx = Math.cos(264 * Math.PI / 180) * Math.cos(48 * Math.PI / 180), dy = Math.sin(264 * Math.PI / 180) * Math.cos(48 * Math.PI / 180), dz = Math.sin(48 * Math.PI / 180);
      for (var j = 0; j < NT; j++) {
        var th = Math.PI * (j + 0.5) / NT, ct = Math.cos(th), stt = Math.sin(th);
        for (var k = 0; k < NP; k++) {
          var v = M.map[j * NP + k], ph = 2 * Math.PI * k / NP;
          if (st.dipolo) v += 3362 * (stt * Math.cos(ph) * dx + stt * Math.sin(ph) * dy + ct * dz);
          var c = mappaColore(0.5 + v / (st.dipolo ? 3362 * 2.2 : 3 * s * 2)), n = 4 * ((NT - 1 - j) * NP + k);
          d[n] = 255 * c[0]; d[n + 1] = 255 * c[1]; d[n + 2] = 255 * c[2]; d[n + 3] = 255;
        }
      }
      q2.putImageData(img, 0, 0); tex.needsUpdate = true; S.sporca = true; S.avvia();
      mollweide();
    }
    function mollweide() {
      var P = F.pennello(cvM), q = P.q, W = P.W, H = P.H, cx = W / 2, cy = H / 2, Rx = W * 0.47, Ry = Math.min(H * 0.46, Rx / 2);
      var w = Math.round(2 * Rx), h = Math.round(2 * Ry), id = q.createImageData(w, h), dpr = cvM.width / W;
      for (var y = 0; y < h; y++) {
        var Y = 1 - 2 * (y + 0.5) / h, th = Math.asin(Y), sinlat = (2 * th + Math.sin(2 * th)) / Math.PI;
        if (Math.abs(sinlat) > 1) continue;
        var lat = Math.asin(sinlat), j = Math.min(NT - 1, Math.max(0, Math.floor((Math.PI / 2 - lat) / Math.PI * NT)));
        for (var x = 0; x < w; x++) {
          var X = 2 * (x + 0.5) / w - 1, lon = Math.PI * X / Math.cos(th);
          if (Math.abs(lon) > Math.PI) continue;
          var k = Math.floor(((Math.PI - lon) / (2 * Math.PI)) * NP) % NP, s = 4 * ((NT - 1 - j) * NP + k), n = 4 * (y * w + x);
          id.data[n] = img.data[s]; id.data[n + 1] = img.data[s + 1]; id.data[n + 2] = img.data[s + 2]; id.data[n + 3] = 255;
        }
      }
      var tmp = globale.document.createElement('canvas'); tmp.width = w; tmp.height = h; tmp.getContext('2d').putImageData(id, 0, 0);
      q.drawImage(tmp, cx - Rx, cy - Ry, 2 * Rx, 2 * Ry);
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'left';
      q.fillText(t('Proiezione di Mollweide (tutto il cielo), ±3σ = ±', 'Mollweide projection (whole sky), ±3σ = ±') + Math.round(3 * M.sigma) + ' μK' + (st.dipolo ? t(' — con il dipolo', ' — with the dipole') : ''), 8, 14);
      cvM.setAttribute('aria-label', t('Mappa della CMB in proiezione di Mollweide', 'CMB map in Mollweide projection'));
    }
    function spettro() {
      var lA = sa.lA, xs = [], ys = [];
      for (var l = 2; l <= 1500; l += (l < 100 ? 1 : 4)) { xs.push(l); ys.push(spettroDl(l, lA)); }
      var pk = picchi(lA, 1500).slice(0, 4);
      var P = F.grafico(cvS, { serie: [{ x: xs, y: ys, col: '#ff8a80', etich: ['D_ℓ', 'D_ℓ'] }], punti: pk.map(function (q) { return { x: q[0], y: q[1], col: '#ffd24a', r: 4 }; }), xmin: 0, xmax: 1500, ymin: 0, ymax: 6500, xl: ['multipolo ℓ', 'multipole ℓ'], yl: ['D_ℓ (μK²)', 'D_ℓ (μK²)'], descr: ['Spettro di potenza angolare della CMB (modello illustrativo)', 'CMB angular power spectrum (illustrative model)'] });
      P.q.fillStyle = '#ffd24a'; P.q.font = '11px system-ui,sans-serif'; P.q.textAlign = 'center';
      pk.forEach(function (q) { P.q.fillText('ℓ ≈ ' + q[0], P.X(q[0]), P.Y(q[1]) - 8); });
      P.q.fillStyle = 'rgba(94,234,212,.12)'; P.q.fillRect(P.X(2), P.Y(6500), P.X(st.L) - P.X(2), P.Y(0) - P.Y(6500));
      P.q.fillStyle = '#5eead4'; P.q.textAlign = 'left'; P.q.fillText(t('ℓ ≤ 300 nella mappa', 'ℓ ≤ 300 in the map'), P.X(10), P.Y(6100));
      /* corpo nero */
      var nu = [], B = []; for (var f = 5; f <= 800; f += 5) { nu.push(f); B.push(planckNu(f, T_CMB)); }
      var pg = piccoPlanckGHz(T_CMB);
      F.grafico(cvB, { serie: [{ x: nu, y: B, col: '#ffd24a', etich: ['B_ν', 'B_ν'] }], punti: [{ x: pg, y: planckNu(pg, T_CMB), col: '#ff8a80', r: 4 }], xmin: 0, xmax: 800, ymin: 0, xl: ['ν (GHz)', 'ν (GHz)'], yl: ['B_ν (MJy/sr)', 'B_ν (MJy/sr)'], descr: ['Spettro di corpo nero della CMB a 2,7255 K', 'CMB black-body spectrum at 2.7255 K'] });
    }
    function testo() {
      var pk = picchi(sa.lA, 1500);
      info.innerHTML = 'z* = ' + sa.zs.toFixed(0) + ', r_s = <b>' + sa.rs.toFixed(1) + ' Mpc</b>, D_M(z*) = ' + (sa.DM / 1000).toFixed(2) + ' Gpc → θ_s = ' + sa.theta.toFixed(3) + '°, ℓ_A = π D_M/r_s = <b>' + sa.lA.toFixed(0) + '</b>; ' + t('primo picco a ℓ ≈ ', 'first peak at ℓ ≈ ') + '<b>' + (pk[0] ? pk[0][0] : '—') + '</b>. ' + descrizione(p) + '. ' + t('Picco del corpo nero a ', 'Black-body peak at ') + piccoPlanckGHz(T_CMB).toFixed(1) + ' GHz.';
      S.didascalia.textContent = t('Sfera della CMB: campo gaussiano con picchi acustici (ℓ_A = ', 'CMB sphere: Gaussian field with acoustic peaks (ℓ_A = ') + sa.lA.toFixed(0) + ')';
    }
    F.alRidimensiona(function () { if (sa) { spettro(); if (M && M.finito) mollweide(); } });
    rigenera();
    S.ogniFotogramma(function (dt) { sfera.rotation.z += dt * 0.05; return true; });
    S.inquadra(30, -1.2, 1.3);
  }

  /* ─── scheda 4: la storia termica ─────────────────────────────────────── */
  var EPOCHE = [
    [-43.3, ['Era di Planck', 'Planck era'], 1.2e32, ['gravità quantistica: la fisica nota non vale', 'quantum gravity: known physics breaks down']],
    [-34, ['Inflazione', 'Inflation'], 1e28, ['espansione esponenziale di un fattore e⁶⁰, fluttuazioni quantistiche → semi delle strutture', 'exponential expansion by e⁶⁰, quantum fluctuations → seeds of structure']],
    [-11, ['Transizione elettrodebole', 'Electroweak transition'], 1.5e15, ['T ≈ 100 GeV: il campo di Higgs dà massa a W, Z e fermioni', 'T ≈ 100 GeV: the Higgs field gives mass to W, Z and fermions']],
    [-4.7, ['Adronizzazione', 'Hadronisation'], 1.7e12, ['T ≈ 150 MeV: quark e gluoni si chiudono in protoni e neutroni', 'T ≈ 150 MeV: quarks and gluons confine into protons and neutrons']],
    [0, ['Disaccoppiamento dei neutrini', 'Neutrino decoupling'], 1e10, ['T ≈ 1 MeV: i neutrini viaggiano liberi; n/p si congela poco dopo', 'T ≈ 1 MeV: neutrinos stream freely; n/p freezes out shortly after']],
    [1.0, ['Annichilazione e⁺e⁻', 'e⁺e⁻ annihilation'], 3e9, ['i fotoni ereditano l’entropia: T_ν = (4/11)^⅓ T', 'photons inherit the entropy: T_ν = (4/11)^⅓ T']],
    [2.3, ['Nucleosintesi', 'Nucleosynthesis'], 9e8, ['3 minuti: si formano ²H, ³He, ⁴He (Y ≈ 0,25), ⁷Li', '3 minutes: ²H, ³He, ⁴He (Y ≈ 0.25), ⁷Li form']],
    [12.2, ['Equivalenza materia-radiazione', 'Matter-radiation equality'], 9300, ['z ≈ 3400, t ≈ 50 000 anni', 'z ≈ 3400, t ≈ 50,000 years']],
    [13.08, ['Ricombinazione — CMB', 'Recombination — CMB'], 2970, ['z ≈ 1100, t ≈ 380 000 anni: si formano gli atomi, l’universo diventa trasparente', 'z ≈ 1100, t ≈ 380,000 years: atoms form, the universe becomes transparent']],
    [15.0, ['Prime stelle', 'First stars'], 60, ['z ≈ 20, t ≈ 180 Myr: fine dei secoli bui (popolazione III)', 'z ≈ 20, t ≈ 180 Myr: end of the dark ages (population III)']],
    [16.35, ['Reionizzazione', 'Reionisation'], 24, ['z ≈ 7–8, t ≈ 700 Myr: la luce UV ionizza di nuovo l’idrogeno', 'z ≈ 7–8, t ≈ 700 Myr: UV light ionises hydrogen again']],
    [17.46, ['Nasce il Sole', 'The Sun forms'], 3.6, ['t ≈ 9,2 Gyr (4,6 miliardi di anni fa)', 't ≈ 9.2 Gyr (4.6 billion years ago)']],
    [17.64, ['Oggi', 'Today'], 2.7255, ['t ≈ 13,8 Gyr, T = 2,7255 K, domina l’energia oscura', 't ≈ 13.8 Gyr, T = 2.7255 K, dark energy dominates']]
  ];
  function schedaStoria(pan, S, destra) {
    var T = S.T, st = { Nnu: 3, tau: 879.4 };
    var info = nota(pan), elioDiv = nota(pan);
    F.cursore(pan, ['Specie di neutrini N_ν', 'Neutrino species N_ν'], 1, 6, 1, st.Nnu, function (v) { st.Nnu = v; elioTesto(); });
    F.cursore(pan, ['Vita media del neutrone τ_n (s)', 'Neutron lifetime τ_n (s)'], 600, 1100, 1, st.tau, function (v) { st.tau = v; elioTesto(); });
    nota(pan, t('Nell’era della radiazione ρ ∝ a⁻⁴, a ∝ t^½ e T ∝ 1/a: t ≈ 2,42 s/√g* · (1 MeV/kT)², cioè circa 1 MeV a 1 s (g* = 10,75 conta i gradi di libertà relativistici: fotoni, e±, tre neutrini). <b>Elio</b>: finché le reazioni deboli n + ν ⇄ p + e⁻ sono più veloci dell’espansione, n/p = e^(−Q/kT) con Q = 1,293 MeV; il ritmo cala come T⁵ mentre H ∝ √g* T², così si congelano a kT_f ≈ 0,75 MeV con n/p ≈ 1/6. Poi i neutroni liberi decadono (τ_n ≈ 879 s) finché, a t ≈ 3 minuti, il deuterio sopravvive alla fotodissociazione e quasi tutti finiscono nel ⁴He: Y = 2(n/p)/(1 + n/p) ≈ 0,25. Più specie di neutrini → espansione più veloce → congelamento più caldo → più elio: è così che la nucleosintesi «contò» tre famiglie di neutrini prima del LEP. Dopo la ricombinazione la temperatura dei fotoni continua a scendere come 1/a fino ai 2,7255 K di oggi.',
      'In the radiation era ρ ∝ a⁻⁴, a ∝ t^½ and T ∝ 1/a: t ≈ 2.42 s/√g* · (1 MeV/kT)², i.e. about 1 MeV at 1 s (g* = 10.75 counts relativistic degrees of freedom: photons, e±, three neutrinos). <b>Helium</b>: while the weak reactions n + ν ⇄ p + e⁻ are faster than expansion, n/p = e^(−Q/kT) with Q = 1.293 MeV; their rate drops as T⁵ while H ∝ √g* T², so they freeze out at kT_f ≈ 0.75 MeV with n/p ≈ 1/6. Free neutrons then decay (τ_n ≈ 879 s) until, at t ≈ 3 minutes, deuterium survives photodissociation and almost all end up in ⁴He: Y = 2(n/p)/(1 + n/p) ≈ 0.25. More neutrino species → faster expansion → hotter freeze-out → more helium: this is how nucleosynthesis «counted» three neutrino families before LEP. After recombination the photon temperature keeps falling as 1/a down to today’s 2.7255 K.'));
    var cv = F.tela(destra, 0.5);
    var lista = F.el('div', { 'class': 'bsiFX-nota' }); destra.appendChild(lista);
    /* l'imbuto: asse x = log₁₀ t (s), raggio da log₁₀ a */
    var x0 = -44, KX = 0.62, p = PLANCK, q = norm(p), H0s = p.H0 / 3.0856775814913673e19;
    function log10a(lt) {
      /* radiazione: a = (2H₀√Ω_r t)^½; inflazione prima di 1e−32 s: a cresce di e⁶⁰ tra 1e−36 e 1e−32 s; materia e Λ dalla tabella */
      var tt = Math.pow(10, lt);
      if (lt < -36) return 0.5 * Math.log10(2 * H0s * Math.sqrt(q.Or) * 1e-32) - 60 / Math.LN10;
      if (lt < -32) return 0.5 * Math.log10(2 * H0s * Math.sqrt(q.Or) * 1e-32) - 60 / Math.LN10 * (-32 - lt) / 4;
      if (lt < 11) return 0.5 * Math.log10(2 * H0s * Math.sqrt(q.Or) * tt);
      return Math.log10(interp(tabT, tabA, tt / 3.15576e16));
    }
    var tab = tabellaA(p, 15), tabT = tab.t, tabA = tab.a;
    function raggio(lt) { return 0.3 + 0.075 * (log10a(lt) + 52); }
    function TdiLog(lt) { return T_CMB / Math.pow(10, log10a(lt)); }
    var nX = 220, nS = 64, pos = [], col = [], idx = [];
    for (var i = 0; i <= nX; i++) {
      var lt = x0 + (17.64 - x0) * i / nX, r = raggio(lt), Tk = TdiLog(lt), c;
      if (Tk > 3000) { var u = Math.min(1, (Math.log10(Tk) - 3.5) / 10); c = coloreT(Math.min(30000, Tk)); c = [c[0] * (0.8 + 0.2 * u), c[1] * (0.8 + 0.2 * u), c[2] * (0.7 + 0.3 * u)]; }
      else if (lt < 15) { var f = Math.max(0.06, (Math.log10(Tk) - 1.5) / 2); c = [0.55 * f + 0.05, 0.12 * f + 0.03, 0.05 * f + 0.06]; }
      else { c = [0.10, 0.16, 0.32]; }
      for (var j = 0; j <= nS; j++) { var a = 2 * Math.PI * j / nS; pos.push((lt - x0) * KX - 19, r * Math.cos(a), r * Math.sin(a)); col.push(c[0], c[1], c[2]); }
    }
    for (i = 0; i < nX; i++) for (j = 0; j < nS; j++) { var A = i * (nS + 1) + j, B = A + nS + 1; idx.push(A, B, A + 1, B, B + 1, A + 1); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    S.aggiungi(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })));
    /* stelle e galassie dentro l'imbuto dopo le prime stelle */
    var rnd = mulberry32(17), gp = [], gc = [];
    for (i = 0; i < 2200; i++) { var lt2 = 15 + 2.64 * Math.pow(rnd(), 0.6), r2 = raggio(lt2) * Math.sqrt(rnd()) * 0.95, a2 = 2 * Math.PI * rnd(), cc = [0.8 + 0.2 * rnd(), 0.8 + 0.2 * rnd(), 1]; gp.push((lt2 - x0) * KX - 19, r2 * Math.cos(a2), r2 * Math.sin(a2)); gc.push(cc[0], cc[1], cc[2]); }
    for (i = 0; i < 2500; i++) { var lt3 = -32 + 45 * rnd(), r3 = raggio(lt3) * Math.sqrt(rnd()) * 0.9, a3 = 2 * Math.PI * rnd(), c3 = coloreT(Math.min(30000, TdiLog(lt3))); gp.push((lt3 - x0) * KX - 19, r3 * Math.cos(a3), r3 * Math.sin(a3)); gc.push(c3[0] * 0.7, c3[1] * 0.7, c3[2] * 0.7); }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.Float32BufferAttribute(gp, 3)); pg.setAttribute('color', new T.Float32BufferAttribute(gc, 3));
    var stelle = new T.Points(pg, new T.PointsMaterial({ size: 0.28, map: texBagliore(T), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); S.aggiungi(stelle);
    /* anelli ed etichette delle epoche */
    EPOCHE.forEach(function (e, k) {
      var X = (e[0] - x0) * KX - 19, r = raggio(e[0]) + 0.05, pts = [];
      for (var j = 0; j <= 64; j++) { var a = 2 * Math.PI * j / 64; pts.push([X, r * Math.cos(a), r * Math.sin(a)]); }
      S.aggiungi(L3().linea(T, pts, 0x5eead4, 0.6));
      var et = L3().testo3d(T, F.tt(e[1]), '#e6fffb', 0.55); et.position.set(X, 0, r + 0.6 + (k % 2) * 0.7); S.aggiungi(et);
    });
    var ass = []; ass.push([-19.5, 0, 0], [(17.8 - x0) * KX - 19, 0, 0]); S.aggiungi(L3().linea(T, ass, 0x34465f, 0.8));
    [-40, -30, -20, -10, 0, 10, 17].forEach(function (lt) { var e = L3().testo3d(T, '10^' + lt + ' s', '#8494a8', 0.45); e.position.set((lt - x0) * KX - 19, 0, -raggio(lt) - 0.6); S.aggiungi(e); });
    lista.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('Epoca', 'Epoch') + '</th><th>t</th><th>T (K)</th></tr>' + EPOCHE.map(function (e) { var s = Math.pow(10, e[0]); var tt = s < 60 ? fmt(s) + ' s' : s < 3.15e7 ? fmt(s / 60) + ' min' : s < 3.15e13 ? fmt(s / 3.15576e7) + t(' anni', ' yr') : fmt(s / 3.15576e16) + ' Gyr'; return '<tr><td><b>' + F.tt(e[1]) + '</b><br><span style="color:#9fb1c6">' + F.tt(e[3]) + '</span></td><td>' + tt + '</td><td>' + fmt(e[2]) + '</td></tr>'; }).join('') + '</table>';
    function grafico() {
      var xs = [], ys = [], yr = [];
      for (var lt = -12; lt <= 17.64; lt += 0.1) { xs.push(lt); ys.push(Math.log10(TdiLog(lt))); yr.push(lt < 4 ? Math.log10(TdaTempo(Math.pow(10, lt), 10.75) * 1.16045e10) : NaN); }
      var P = F.grafico(cv, { serie: [{ x: xs, y: ys, col: '#ffd24a', etich: ['T = T₀/a', 'T = T₀/a'] }, { x: xs, y: yr, col: '#ff8a80', tratt: true, larg: 1.4, etich: ['2,42 s/√g* (g* = 10,75)', '2.42 s/√g* (g* = 10.75)'] }], xmin: -12, xmax: 18, ymin: 0, ymax: 16, xl: ['log₁₀ t (s)', 'log₁₀ t (s)'], yl: ['log₁₀ T (K)', 'log₁₀ T (K)'], legenda: [{ col: '#ffd24a', etich: ['T = 2,7255 K / a(t) (ΛCDM)', 'T = 2.7255 K / a(t) (ΛCDM)'] }, { col: '#ff8a80', etich: ['radiazione con g* = 10,75', 'radiation with g* = 10.75'] }], descr: ['Temperatura dell’universo in funzione del tempo', 'Temperature of the universe versus time'] });
      P.q.fillStyle = '#5eead4'; P.q.font = '10px system-ui,sans-serif'; P.q.textAlign = 'left';
      EPOCHE.forEach(function (e, k) { if (e[0] < -12) return; var y = Math.log10(e[2]); P.q.beginPath(); P.q.arc(P.X(e[0]), P.Y(y), 3, 0, 7); P.q.fill(); if (k % 2 === 0 || e[0] > 12) P.q.fillText(F.tt(e[1]).split(' ')[0], P.X(e[0]) + 4, P.Y(y) - 4); });
    }
    function elioTesto() {
      var e = elio(st.Nnu, st.tau);
      elioDiv.innerHTML = t('Nucleosintesi con N_ν = ', 'Nucleosynthesis with N_ν = ') + st.Nnu + ': g* = ' + e.g.toFixed(2) + ', kT_f = ' + e.Tf.toFixed(3) + ' MeV, (n/p)_f = ' + e.np0.toFixed(3) + ', t_nuc ≈ ' + Math.round(e.tnuc) + ' s → n/p = ' + e.np.toFixed(3) + '<br>' + t('Frazione in massa di elio ', 'Helium mass fraction ') + '<b>Y = ' + e.Y.toFixed(3) + '</b> (' + t('osservato 0,245 ± 0,003', 'observed 0.245 ± 0.003') + ')';
    }
    var zeq = zEquivalenza(p), aeq = 1 / (1 + zeq), teq = tempoMR(aeq, p);
    info.innerHTML = t('Con i parametri di Planck: equivalenza materia-radiazione a z_eq = Ω_m/Ω_r − 1 = ', 'With Planck parameters: matter-radiation equality at z_eq = Ω_m/Ω_r − 1 = ') + '<b>' + Math.round(zeq) + '</b> (t = ' + Math.round(teq * 1e9 / 1000) + t(' mila anni', ' thousand years') + ', T = ' + Math.round(temperatura(zeq)) + ' K); ' + t('ricombinazione a z ≈ 1090: T = ', 'recombination at z ≈ 1090: T = ') + Math.round(temperatura(1090)) + ' K, t = ' + Math.round(tempo(1 / 1091, p) * 1e6) + t(' mila anni; età oggi ', ' thousand years; age today ') + tab.t0.toFixed(2) + ' Gyr.';
    elioTesto(); grafico();
    F.alRidimensiona(grafico);
    S.didascalia.textContent = t('La storia termica dell’universo: dall’inflazione a oggi (tempo in scala logaritmica)', 'The thermal history of the universe: from inflation to today (logarithmic time)');
    S.ogniFotogramma(function (dt) { stelle.rotation.x += dt * 0.05; return true; });
    S.inquadra(34, -1.57, 1.15);
  }

  F.sezione('sastrocosmo', {
    titolo: ['🌠 Cosmologia 3D', '🌠 Cosmology 3D'],
    sotto: ['L’universo di Friedmann-Lemaître in tre dimensioni: l’espansione con la luce che si arrossa, le distanze cosmologiche e il cono di luce, la radiazione cosmica di fondo sintetizzata con le armoniche sferiche, la storia termica dall’inflazione a oggi. Parametri di partenza: Planck 2018.', 'The Friedmann-Lemaître universe in three dimensions: expansion with redshifting light, cosmological distances and the light cone, the cosmic microwave background synthesised with spherical harmonics, the thermal history from inflation to today. Starting parameters: Planck 2018.'],
    schede: [
      { nome: ['🎈 Espansione', '🎈 Expansion'], costruisci: scheda(schedaEspansione) },
      { nome: ['📏 Distanze', '📏 Distances'], costruisci: scheda(schedaDistanze) },
      { nome: ['🌡️ CMB', '🌡️ CMB'], costruisci: scheda(schedaCMB) },
      { nome: ['⏳ Storia termica', '⏳ Thermal history'], costruisci: scheda(schedaStoria) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
