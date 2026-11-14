/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-materiaoscura-fisica.js — il calcolo della sezione
   🌑 Materia oscura e lenti gravitazionali (v255)
   BioSpecInfo · © Samuele Pio Provenzano

   Tutto il calcolo, senza disegno, così il banco lo prova in Node.

   COSMOLOGIA (ΛCDM piatto, Planck 2018: Ωm = 0,315, ΩΛ = 0,685, h = 0,674,
   n_s = 0,965, σ₈ = 0,811)
   · E(z) = √(Ωm(1+z)³ + ΩΛ); distanza comovente D_C = (c/H₀)∫dz/E;
     distanza di diametro angolare D_A = D_C/(1+z), fra due redshift
     D_A(z₁,z₂) = (D_C(z₂) − D_C(z₁))/(1+z₂).
   · Fattore di crescita lineare D(a) ∝ (5Ωm/2) E(a) ∫₀ᵃ da'/(a'E(a'))³,
     normalizzato a D(1) = 1 (Heath 1977).
   · Spettro P(k) = A kⁿˢ T(k)², T di Bardeen, Bond, Kaiser e Szalay (1986) con
     Γ = Ωm h; A fissata da σ₈ (finestra a cilindro, R = 8 Mpc/h).

   LA RETE COSMICA (approssimazione di Zel'dovich, 1970)
   · Campo gaussiano δ(k) sulla griglia N³ in una scatola di lato L (Mpc/h),
     spostamento ψ(k) = i k δ(k)/k², particelle x = q + D(a) ψ(q).
   · Densità di ogni particella dal determinante del gradiente della
     mappa: ρ/ρ̄ = 1/|det(I + D ∂ψ/∂q)|. Dopo l'incrocio delle orbite
     l'approssimazione non vale più: lo si dice.

   LE LENTI (unità: secondi d'arco)
   · Massa puntiforme: α = θ_E² θ/|θ|².  SIS: α = θ_E θ/|θ|,
     θ_E = 4π (σ_v/c)² D_ls/D_s.  SIE (Kormann, Schneider e Bartelmann 1994,
     forma di Keeton 2001):
       α_x = (b q/√(1−q²)) atan(√(1−q²) x/ψ), α_y = (b q/√(1−q²)) atanh(√(1−q²) y/ψ),
       ψ = √(q²x² + y²).
   · NFW (Bartelmann 1996): α(x) = 4 κ_s r_s h(x)/x, h(x) = ln(x/2) + F(x).
   · Equazione della lente β = θ − α(θ); amplificazione μ = 1/det A,
     A = ∂β/∂θ; curve critiche det A = 0, caustiche la loro immagine in β.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var PI = Math.PI, C_KMS = 299792.458, ARCSEC = PI / 180 / 3600;
  var COSMO = { Om: 0.315, OL: 0.685, h: 0.674, ns: 0.965, s8: 0.811 };

  /* ═══ 1. COSMOLOGIA ════════════════════════════════════════════════════ */
  function E(z) { return Math.sqrt(COSMO.Om * Math.pow(1 + z, 3) + COSMO.OL); }
  function simpson(f, a, b, n) { n = n || 400; if (n % 2) n++; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
  /** Distanza comovente (Mpc). */
  function distanzaComovente(z) { return C_KMS / (100 * COSMO.h) * simpson(function (x) { return 1 / E(x); }, 0, z, 600); }
  function diametroAngolare(z1, z2) { if (z2 == null) { z2 = z1; z1 = 0; } return (distanzaComovente(z2) - distanzaComovente(z1)) / (1 + z2); }
  /** Fattore di crescita lineare normalizzato a D(a = 1) = 1. */
  function crescitaGrezza(a) { if (a <= 0) return 0; var Ea = Math.sqrt(COSMO.Om / (a * a * a) + COSMO.OL); return 2.5 * COSMO.Om * Ea * simpson(function (x) { if (x <= 0) return 0; var e = Math.sqrt(COSMO.Om / (x * x * x) + COSMO.OL); return 1 / Math.pow(x * e, 3); }, 1e-6, a, 800); }
  var D1 = null;
  function crescita(a) { if (D1 == null) D1 = crescitaGrezza(1); return crescitaGrezza(a) / D1; }
  /** Funzione di trasferimento BBKS, k in h/Mpc. */
  function trasferimento(k) { var q = k / (COSMO.Om * COSMO.h); if (q < 1e-8) return 1; var t = Math.log(1 + 2.34 * q) / (2.34 * q); return t * Math.pow(1 + 3.89 * q + Math.pow(16.1 * q, 2) + Math.pow(5.46 * q, 3) + Math.pow(6.71 * q, 4), -0.25); }
  function finestra(x) { return x < 1e-4 ? 1 - x * x / 10 : 3 * (Math.sin(x) - x * Math.cos(x)) / (x * x * x); }
  /** σ(R) per uno spettro di ampiezza A (integrale in log k). */
  function sigmaR(R, A) { return Math.sqrt(simpson(function (lk) { var k = Math.exp(lk), P = A * Math.pow(k, COSMO.ns) * Math.pow(trasferimento(k), 2), W = finestra(k * R); return k * k * k * P * W * W / (2 * PI * PI); }, Math.log(1e-4), Math.log(1e2), 2000)); }
  var AMP = null;
  function ampiezza() { if (AMP == null) { var s = sigmaR(8, 1); AMP = Math.pow(COSMO.s8 / s, 2); } return AMP; }
  /** Spettro lineare a z = 0, (Mpc/h)³. */
  function spettro(k) { return ampiezza() * Math.pow(k, COSMO.ns) * Math.pow(trasferimento(k), 2); }

  /* ═══ 2. FFT 3D (radice 2) ═════════════════════════════════════════════ */
  function fft1(re, im, inversa) {
    var n = re.length, i, j, k, m;
    for (i = 1, j = 0; i < n; i++) { var bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (m = 2; m <= n; m <<= 1) { var ang = (inversa ? 2 : -2) * PI / m, wr = Math.cos(ang), wi = Math.sin(ang); for (i = 0; i < n; i += m) { var ur = 1, ui = 0; for (k = 0; k < m / 2; k++) { var a = i + k, b = a + m / 2, tr = re[b] * ur - im[b] * ui, ti = re[b] * ui + im[b] * ur; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; var nr = ur * wr - ui * wi; ui = ur * wi + ui * wr; ur = nr; } } }
  }
  /** FFT 3D sul posto di un campo N³ (indice (z·N + y)·N + x); l'inversa divide per N³. */
  function fft3(re, im, N, inversa) {
    var lr = new Float64Array(N), li = new Float64Array(N), x, y, z, i;
    for (z = 0; z < N; z++) for (y = 0; y < N; y++) { var o = (z * N + y) * N; for (x = 0; x < N; x++) { lr[x] = re[o + x]; li[x] = im[o + x]; } fft1(lr, li, inversa); for (x = 0; x < N; x++) { re[o + x] = lr[x]; im[o + x] = li[x]; } }
    for (z = 0; z < N; z++) for (x = 0; x < N; x++) { for (y = 0; y < N; y++) { i = (z * N + y) * N + x; lr[y] = re[i]; li[y] = im[i]; } fft1(lr, li, inversa); for (y = 0; y < N; y++) { i = (z * N + y) * N + x; re[i] = lr[y]; im[i] = li[y]; } }
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) { for (z = 0; z < N; z++) { i = (z * N + y) * N + x; lr[z] = re[i]; li[z] = im[i]; } fft1(lr, li, inversa); for (z = 0; z < N; z++) { i = (z * N + y) * N + x; re[i] = lr[z]; im[i] = li[z]; } }
    if (inversa) { var s = 1 / (N * N * N); for (i = 0; i < re.length; i++) { re[i] *= s; im[i] *= s; } }
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { var u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }

  /* ═══ 3. LA RETE COSMICA ═══════════════════════════════════════════════ */
  /** Condizioni iniziali di Zel'dovich: N per lato (potenza di 2), L lato (Mpc/h), seme. Restituisce δ e ψ (Mpc/h) a z = 0 e i gradienti di ψ. */
  function reteCosmica(N, L, seme) {
    var M = N * N * N, dx = L / N, rnd = mulberry(seme || 3), re = new Float64Array(M), im = new Float64Array(M);
    for (var i = 0; i < M; i++) re[i] = gauss(rnd);
    fft3(re, im, N, false);
    var kf = 2 * PI / L, dk = new Float64Array(M * 2), psi = [new Float64Array(M), new Float64Array(M), new Float64Array(M)], grad = [];
    function kk(j) { return (j <= N / 2 ? j : j - N) * kf; }
    var fattore = 1 / Math.sqrt(dx * dx * dx);
    for (var z = 0; z < N; z++) for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var id = (z * N + y) * N + x, kx = kk(x), ky = kk(y), kz = kk(z), k = Math.sqrt(kx * kx + ky * ky + kz * kz);
      var a = k > 0 ? Math.sqrt(spettro(k)) * fattore : 0;
      if (x === N / 2 || y === N / 2 || z === N / 2) a = 0;               /* la frequenza di Nyquist non ha un partner hermitiano: si toglie */
      re[id] *= a; im[id] *= a;
    }
    /* δ in spazio reale */
    var dr = Float64Array.from(re), di = Float64Array.from(im); fft3(dr, di, N, true);
    /* ψ_j = IFFT( i k_j δ / k² ), e ∂ψ_j/∂q_l = IFFT( −k_j k_l δ / k² ) */
    var comp = [[0], [1], [2], [0, 0], [1, 1], [2, 2], [0, 1], [0, 2], [1, 2]], campi = [];
    comp.forEach(function (c) {
      var r2 = new Float64Array(M), i2 = new Float64Array(M);
      for (var z = 0; z < N; z++) for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var id = (z * N + y) * N + x, K = [kk(x), kk(y), kk(z)], k2 = K[0] * K[0] + K[1] * K[1] + K[2] * K[2]; if (!k2) continue;
        if (c.length === 1) { var f = K[c[0]] / k2; r2[id] = -f * im[id]; i2[id] = f * re[id]; }
        else { var g = -K[c[0]] * K[c[1]] / k2; r2[id] = g * re[id]; i2[id] = g * im[id]; }
      }
      fft3(r2, i2, N, true); campi.push(r2);
    });
    return { N: N, L: L, delta: dr, psi: [campi[0], campi[1], campi[2]], dpsi: { xx: campi[3], yy: campi[4], zz: campi[5], xy: campi[6], xz: campi[7], yz: campi[8] } };
  }
  /** Posizioni (Mpc/h, periodiche in [0, L)) e densità relative al fattore di crescita D. */
  function evolvi(R, D, pos, dens) {
    var N = R.N, L = R.L, dx = L / N, p = R.psi, d = R.dpsi, i = 0;
    for (var z = 0; z < N; z++) for (var y = 0; y < N; y++) for (var x = 0; x < N; x++, i++) {
      var X = (x + 0.5) * dx + D * p[0][i], Y = (y + 0.5) * dx + D * p[1][i], Z = (z + 0.5) * dx + D * p[2][i];
      pos[i * 3] = ((X % L) + L) % L; pos[i * 3 + 1] = ((Y % L) + L) % L; pos[i * 3 + 2] = ((Z % L) + L) % L;
      if (dens) { var a11 = 1 + D * d.xx[i], a22 = 1 + D * d.yy[i], a33 = 1 + D * d.zz[i], a12 = D * d.xy[i], a13 = D * d.xz[i], a23 = D * d.yz[i]; var det = a11 * (a22 * a33 - a23 * a23) - a12 * (a12 * a33 - a23 * a13) + a13 * (a12 * a23 - a22 * a13); dens[i] = 1 / Math.max(0.02, Math.abs(det)); }
    }
  }

  /* ═══ 4. LE LENTI ══════════════════════════════════════════════════════ */
  function hNFW(x) { if (x < 1e-6) return 0; var F; if (x < 1) F = 2 / Math.sqrt(1 - x * x) * Math.atanh(Math.sqrt((1 - x) / (1 + x))); else if (x > 1) F = 2 / Math.sqrt(x * x - 1) * Math.atan(Math.sqrt((x - 1) / (x + 1))); else F = 1; return Math.log(x / 2) + F; }
  /** Deflessione (secondi d'arco) di una lente: m = { tipo: 'punto'|'sis'|'sie'|'nfw', te, q, ang, ks, rs, gamma, phig } nel punto (x, y). */
  function deflessione(m, x, y) {
    var ax = 0, ay = 0, c = Math.cos(m.ang || 0), s = Math.sin(m.ang || 0), u = c * x + s * y, v = -s * x + c * y, r = Math.hypot(u, v) || 1e-9, au = 0, av = 0;
    if (m.tipo === 'punto') { au = m.te * m.te * u / (r * r); av = m.te * m.te * v / (r * r); }
    else if (m.tipo === 'sis') { au = m.te * u / r; av = m.te * v / r; }
    else if (m.tipo === 'sie') { var q = Math.min(0.999, Math.max(0.2, m.q)), e = Math.sqrt(1 - q * q), ps = Math.sqrt(q * q * u * u + v * v) || 1e-9, b = m.te * Math.sqrt(q); au = b * q / e * Math.atan(e * u / ps) / q; av = b * q / e * Math.atanh(Math.min(0.999999, e * v / ps)) / q; }
    else if (m.tipo === 'nfw') { var X = r / m.rs, a = 4 * m.ks * m.rs * hNFW(X) / X; au = a * u / r; av = a * v / r; }
    ax = c * au - s * av; ay = s * au + c * av;
    if (m.gamma) { var g1 = m.gamma * Math.cos(2 * m.phig), g2 = m.gamma * Math.sin(2 * m.phig); ax += g1 * x + g2 * y; ay += g2 * x - g1 * y; }
    return [ax, ay];
  }
  function sorgente(m, x, y) { var a = deflessione(m, x, y); return [x - a[0], y - a[1]]; }
  /** det A e amplificazione μ = 1/det A con differenze finite. */
  function jacobiano(m, x, y) { var h = 1e-4, p = sorgente(m, x + h, y), q = sorgente(m, x - h, y), r = sorgente(m, x, y + h), s = sorgente(m, x, y - h), a11 = (p[0] - q[0]) / (2 * h), a21 = (p[1] - q[1]) / (2 * h), a12 = (r[0] - s[0]) / (2 * h), a22 = (r[1] - s[1]) / (2 * h); var det = a11 * a22 - a12 * a21; return { det: det, mu: 1 / det }; }
  /** Raggio di Einstein di una SIS (secondi d'arco) da σ_v (km/s) e redshift. */
  function einsteinSIS(sv, zl, zs) { return 4 * PI * Math.pow(sv / C_KMS, 2) * diametroAngolare(zl, zs) / diametroAngolare(zs) / ARCSEC; }
  /** Raggio di Einstein di una massa puntiforme M (masse solari). */
  function einsteinPunto(M, zl, zs) { var G = 6.674e-11, c = 2.998e8, MPC = 3.0857e22, Dl = diametroAngolare(zl) * MPC, Ds = diametroAngolare(zs) * MPC, Dls = diametroAngolare(zl, zs) * MPC; return Math.sqrt(4 * G * M * 1.989e30 / (c * c) * Dls / (Dl * Ds)) / ARCSEC; }
  /** Curve critiche (quadrati marcianti su det A = 0) e caustiche (la loro immagine). */
  function curveCritiche(m, R, n) {
    n = n || 200; var h = 2 * R / n, g = [], seg = [], cau = [];
    for (var j = 0; j <= n; j++) { var riga = []; for (var i = 0; i <= n; i++) riga.push(jacobiano(m, -R + i * h + 1e-3, -R + j * h + 1e-3).det); g.push(riga); }
    function P(i, j, i2, j2) { var a = g[j][i], b = g[j2][i2], s = a / (a - b); return [-R + (i + s * (i2 - i)) * h + 1e-3, -R + (j + s * (j2 - j)) * h + 1e-3]; }
    for (var jj = 0; jj < n; jj++) for (var ii = 0; ii < n; ii++) {
      var pts = [], v = [[ii, jj], [ii + 1, jj], [ii + 1, jj + 1], [ii, jj + 1]];
      var grande = v.some(function (w) { return !isFinite(g[w[1]][w[0]]) || Math.abs(g[w[1]][w[0]]) > 30; }); if (grande) continue;   /* le singolarità (centro della SIS, massa puntiforme) non sono curve critiche */
      for (var e = 0; e < 4; e++) { var A = v[e], B = v[(e + 1) % 4]; if ((g[A[1]][A[0]] > 0) !== (g[B[1]][B[0]] > 0)) pts.push(P(A[0], A[1], B[0], B[1])); }
      if (pts.length >= 2) { seg.push([pts[0], pts[1]]); cau.push([sorgente(m, pts[0][0], pts[0][1]), sorgente(m, pts[1][0], pts[1][1])]); }
      if (pts.length === 4) { seg.push([pts[2], pts[3]]); cau.push([sorgente(m, pts[2][0], pts[2][1]), sorgente(m, pts[3][0], pts[3][1])]); }
    }
    return { critiche: seg, caustiche: cau };
  }
  /** Immagini di una sorgente puntiforme: zeri di θ − α(θ) − β trovati con Newton da una griglia di partenze. */
  function immagini(m, bx, by, R) {
    var out = [];
    for (var j = -6; j <= 6; j++) for (var i = -6; i <= 6; i++) {
      var x = i * R / 6 + 0.013, y = j * R / 6 + 0.017;
      for (var k = 0; k < 40; k++) { var s = sorgente(m, x, y), fx = s[0] - bx, fy = s[1] - by; if (Math.hypot(fx, fy) < 1e-10) break; var h = 1e-5, sx = sorgente(m, x + h, y), sy = sorgente(m, x, y + h), a11 = (sx[0] - s[0]) / h, a21 = (sx[1] - s[1]) / h, a12 = (sy[0] - s[0]) / h, a22 = (sy[1] - s[1]) / h, det = a11 * a22 - a12 * a21; if (Math.abs(det) < 1e-12) break; x -= (a22 * fx - a12 * fy) / det; y -= (-a21 * fx + a11 * fy) / det; if (Math.abs(x) > 3 * R || Math.abs(y) > 3 * R) break; }
      var s2 = sorgente(m, x, y); if (Math.hypot(s2[0] - bx, s2[1] - by) < 1e-7 && Math.hypot(x, y) > 1e-3 && !out.some(function (p) { return Math.hypot(p[0] - x, p[1] - y) < 1e-4; })) out.push([x, y, jacobiano(m, x, y).mu]);
    }
    return out;
  }

  /* ═══ 5. CURVE DI ROTAZIONE ════════════════════════════════════════════ */
  /** Disco esponenziale (Freeman 1970): v² = 4πGΣ₀R_d y² [I₀K₀ − I₁K₁](y), y = R/(2R_d). Unità: kpc, M☉, km/s. */
  var G_KPC = 4.30091e-6;                                                   /* G in kpc (km/s)² / M☉ */
  function besselI(n, x) { var s = 0, t = Math.pow(x / 2, n) / (n ? 1 : 1); for (var k = 0; k < 60; k++) { var f = Math.pow(x / 2, 2 * k + n); var d = 1; for (var q = 2; q <= k; q++) d *= q; var d2 = 1; for (var r = 2; r <= k + n; r++) d2 *= r; s += f / (d * d2); } return s; }
  function besselK(n, x) {
    /* integrale K_n(x) = ∫₀^∞ e^(−x cosh t) cosh(n t) dt */
    return simpson(function (tt) { return Math.exp(-x * Math.cosh(tt)) * Math.cosh(n * tt); }, 0, Math.max(4, Math.acosh(40 / Math.max(x, 1e-3) + 1)), 600);
  }
  function vDisco(R, Md, Rd) { if (R <= 0) return 0; var y = R / (2 * Rd), S0 = Md / (2 * PI * Rd * Rd); var v2 = 4 * PI * G_KPC * S0 * Rd * y * y * (besselI(0, y) * besselK(0, y) - besselI(1, y) * besselK(1, y)); return Math.sqrt(Math.max(0, v2)); }
  /** Alone NFW: v² = G M(<R)/R, M(<R) = 4π ρ_s r_s³ [ln(1+x) − x/(1+x)]. */
  function vAlone(R, M200, c, r200) { var rs = r200 / c, m = function (x) { return Math.log(1 + x) - x / (1 + x); }; var Mr = M200 * m(R / rs) / m(c); return Math.sqrt(G_KPC * Mr / Math.max(R, 1e-6)); }

  globale.BSIMateriaOscura = { COSMO: COSMO, E: E, distanzaComovente: distanzaComovente, diametroAngolare: diametroAngolare, crescita: crescita, trasferimento: trasferimento, sigmaR: sigmaR, spettro: spettro, ampiezza: ampiezza,
    fft1: fft1, fft3: fft3, reteCosmica: reteCosmica, evolvi: evolvi, hNFW: hNFW, deflessione: deflessione, sorgente: sorgente, jacobiano: jacobiano, einsteinSIS: einsteinSIS, einsteinPunto: einsteinPunto,
    curveCritiche: curveCritiche, immagini: immagini, vDisco: vDisco, vAlone: vAlone, besselI: besselI, besselK: besselK, mulberry: mulberry, gauss: gauss, ARCSEC: ARCSEC, G_KPC: G_KPC };
})(typeof window !== 'undefined' ? window : globalThis);
