/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-galassie.js — 🌌 Galassie 3D
   BioSpecInfo · © Samuele Pio Provenzano

   Le galassie viste davvero in tre dimensioni, con decine di migliaia di
   stelle mosse dalla fisica giusta:

   · LA SEQUENZA DI HUBBLE: ellittiche E0–E7 (sferoidi di Hernquist con
     rapporto assiale b/a = 1 − n/10), lenticolari S0, spirali Sa–Sc e
     barrate SBa–SBc, irregolari. Nelle spirali i bracci sono spirali
     logaritmiche φ(R) = −cot(i)·ln(R/R₀) e sono un'ONDA DI DENSITA': il
     disegno ruota rigido con velocita' angolare Ω_p, le stelle con Ω(R)
     (rotazione differenziale) e lo attraversano. Le stelle vecchie si
     affollano nei bracci (la fase nel sistema del disegno e'
     θ = ψ − (ε/m)·sin mψ, densita' ∝ 1/(1 − ε cos mψ)); le stelle giovani
     blu e le regioni HII rosa nascono nel braccio, ne escono trascinate da
     Ω − Ω_p e si spengono in poche decine di milioni di anni; le corsie di
     polvere stanno sul lato interno, dove il gas viene compresso. Tutto il
     moto e' calcolato nello shader dei vertici: la CPU non tocca le stelle.
   · LE CURVE DI ROTAZIONE: bulge di Hernquist, disco esponenziale di
     Freeman (v² = 4πGΣ₀R_d y²[I₀K₀ − I₁K₁](y), y = R/2R_d, con le funzioni
     di Bessel modificate) e alone di materia oscura NFW
     (M(r) = 4πρ_s r_s³[ln(1+x) − x/(1+x)]); senza alone la curva cade come
     Kepler, con l'alone resta piatta. La galassia 3D gira con la curva
     scelta e i «raggi» di stelle allineate si avvolgono (il problema
     dell'avvolgimento dei bracci materiali).
   · LA COLLISIONE: N corpi ristretto alla Toomre & Toomre (1972): due
     nuclei massicci (potenziale di Plummer) su un'orbita parabolica,
     migliaia di particelle di prova sui dischi; ne escono le code mareali
     delle Antenne, il ponte della galassia Vortice, l'anello della Ruota
     del Carro. Leapfrog (simplettico): l'energia dei nuclei si conserva.
   · LA VIA LATTEA E IL GRUPPO LOCALE: le galassie vicine dalle coordinate
     galattiche (l, b) e dalle distanze (Andromeda ~765 kpc, Grande Nube di
     Magellano ~50 kpc…), la posizione del Sole a 8,2 kpc dal centro e la
     sua orbita (~230 km/s, ~220 milioni di anni).

   Unita': kpc, km/s, masse solari, G = 4,30091·10⁻⁶ kpc (km/s)² M☉⁻¹;
   1 km/s/kpc = 1,0227·10⁻³ rad/Myr. I calcoli (F.calcolo.galassie) sono
   funzioni pure, separate dal disegno: il banco li prova in node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;

  var G = 4.30091e-6;            /* kpc (km/s)² / M☉ */
  var OM_MYR = 1.02271e-3;       /* 1 km/s/kpc in rad/Myr */
  var KPC_KMS_MYR = 977.79;      /* 1 kpc/(km/s) in Myr */

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rnd) { var u = rnd() || 1e-12, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ═══ funzioni di Bessel modificate (Abramowitz & Stegun 9.8), in forma
     scalata: i0s = I₀(x)e^(−x), k0s = K₀(x)e^(x), cosi' i prodotti I·K non
     traboccano nemmeno per x grandi ════════════════════════════════════════ */
  function i0s(x) {
    var ax = Math.abs(x), y;
    if (ax < 3.75) { y = x / 3.75; y *= y; return (1 + y * (3.5156229 + y * (3.0899424 + y * (1.2067492 + y * (0.2659732 + y * (0.0360768 + y * 0.0045813)))))) * Math.exp(-ax); }
    y = 3.75 / ax;
    return (0.39894228 + y * (0.01328592 + y * (0.00225319 + y * (-0.00157565 + y * (0.00916281 + y * (-0.02057706 + y * (0.02635537 + y * (-0.01647633 + y * 0.00392377)))))))) / Math.sqrt(ax);
  }
  function i1s(x) {
    var ax = Math.abs(x), y, a;
    if (ax < 3.75) { y = x / 3.75; y *= y; a = ax * (0.5 + y * (0.87890594 + y * (0.51498869 + y * (0.15084934 + y * (0.02658733 + y * (0.00301532 + y * 0.00032411)))))) * Math.exp(-ax); }
    else {
      y = 3.75 / ax;
      a = 0.02282967 + y * (-0.02895312 + y * (0.01787654 - y * 0.00420059));
      a = (0.39894228 + y * (-0.03988024 + y * (-0.00362018 + y * (0.00163801 + y * (-0.01031555 + y * a))))) / Math.sqrt(ax);
    }
    return x < 0 ? -a : a;
  }
  function k0s(x) {
    var y;
    if (x <= 2) { y = x * x / 4; return (-Math.log(x / 2) * i0s(x) * Math.exp(x) + (-0.57721566 + y * (0.42278420 + y * (0.23069756 + y * (0.03488590 + y * (0.00262698 + y * (0.00010750 + y * 0.0000074))))))) * Math.exp(x); }
    y = 2 / x;
    return (1.25331414 + y * (-0.07832358 + y * (0.02189568 + y * (-0.01062446 + y * (0.00587872 + y * (-0.00251540 + y * 0.00053208)))))) / Math.sqrt(x);
  }
  function k1s(x) {
    var y;
    if (x <= 2) { y = x * x / 4; return (Math.log(x / 2) * i1s(x) * Math.exp(x) + (1 / x) * (1 + y * (0.15443144 + y * (-0.67278579 + y * (-0.18156897 + y * (-0.01919402 + y * (-0.00110404 + y * (-0.00004686)))))))) * Math.exp(x); }
    y = 2 / x;
    return (1.25331414 + y * (0.23498619 + y * (-0.03655620 + y * (0.01504268 + y * (-0.00780353 + y * (0.00325614 + y * (-0.00068245))))))) / Math.sqrt(x);
  }
  function besselI0(x) { return i0s(x) * Math.exp(Math.abs(x)); }
  function besselI1(x) { return i1s(x) * Math.exp(Math.abs(x)); }
  function besselK0(x) { return k0s(x) * Math.exp(-x); }
  function besselK1(x) { return k1s(x) * Math.exp(-x); }

  /* ═══ le componenti della curva di rotazione ═══════════════════════════ */
  /* disco esponenziale sottile Σ(R) = Σ₀ e^(−R/R_d), Σ₀ = M_d/(2πR_d²) (Freeman 1970) */
  function vFreeman(R, Md, Rd) {
    if (!(R > 0) || !(Md > 0)) return 0;
    var y = R / (2 * Rd), f;
    /* per y grandi la differenza I₀K₀ − I₁K₁ ≈ 1/(4y³) nasce da una cancellazione: si usa lo sviluppo
       asintotico I_νK_ν ~ (1/2y)[1 − ½(μ−1)/(2y)² + ⅜(μ−1)(μ−9)/(2y)⁴ − …], μ = 4ν² */
    if (y >= 12) { var u = 1 / (y * y); f = 0.5 / y * u * (0.5 + u * (0.5625 + u * (2.63671875 + u * 26.92))); }
    else f = i0s(y) * k0s(y) - i1s(y) * k1s(y);
    return Math.sqrt(Math.max(0, 2 * G * Md / Rd * y * y * f));
  }
  function massaDisco(R, Md, Rd) { var x = R / Rd; return Md * (1 - (1 + x) * Math.exp(-x)); }
  /* bulge di Hernquist: ρ = M a /(2π r (r+a)³), M(r) = M r²/(r+a)² */
  function massaHernquist(r, M, a) { return M * r * r / ((r + a) * (r + a)); }
  function vHernquist(r, M, a) { return r > 0 && M > 0 ? Math.sqrt(G * M * r) / (r + a) : 0; }
  function rhoHernquist(r, M, a) { return M * a / (2 * Math.PI * r * Math.pow(r + a, 3)); }
  /* alone NFW: ρ = ρ_s / [x(1+x)²], x = r/r_s */
  function rhoNFW(r, rhos, rs) { var x = r / rs; return rhos / (x * (1 + x) * (1 + x)); }
  function massaNFW(r, rhos, rs) { var x = r / rs; return 4 * Math.PI * rhos * rs * rs * rs * (Math.log(1 + x) - x / (1 + x)); }
  function vNFW(r, rhos, rs) { return r > 0 && rhos > 0 ? Math.sqrt(G * massaNFW(r, rhos, rs) / r) : 0; }
  /* parametri simili alla Via Lattea (illustrativi) */
  var MODELLO = { Mb: 1.5e10, ab: 0.6, Md: 5.5e10, Rd: 3.0, rhos: 1.1e7, rs: 16, alone: true };
  function curva(R, p) {
    p = p || MODELLO;
    var vb = vHernquist(R, p.Mb, p.ab), vd = vFreeman(R, p.Md, p.Rd), vh = p.alone === false ? 0 : vNFW(R, p.rhos, p.rs);
    return { vb: vb, vd: vd, vh: vh, vvis: Math.sqrt(vb * vb + vd * vd), vt: Math.sqrt(vb * vb + vd * vd + vh * vh) };
  }
  /* frequenza epiciclica κ² = R dΩ²/dR + 4Ω² (derivata numerica centrata) */
  function kappa(R, fv) {
    var h = 1e-3 * R, O = function (r) { var v = fv(r); return v * v / (r * r); };
    return Math.sqrt(Math.max(0, R * (O(R + h) - O(R - h)) / (2 * h) + 4 * O(R)));
  }
  /* risonanze del disegno: corotazione Ω = Ω_p, Lindblad interna/esterna Ω ∓ κ/m = Ω_p */
  function risonanze(Omp, m, fv) {
    function radice(g) {
      var a = 0.2, prec = g(a), out = null;
      for (var i = 1; i <= 400; i++) { var b = 0.2 * Math.pow(250, i / 400), v = g(b); if (prec * v < 0) { var lo = a, hi = b; for (var k = 0; k < 60; k++) { var mm = 0.5 * (lo + hi); if (g(lo) * g(mm) <= 0) hi = mm; else lo = mm; } out = 0.5 * (lo + hi); break; } a = b; prec = v; }
      return out;
    }
    return {
      cr: radice(function (r) { return fv(r) / r - Omp; }),
      ilr: radice(function (r) { return fv(r) / r - kappa(r, fv) / m - Omp; }),
      olr: radice(function (r) { return fv(r) / r + kappa(r, fv) / m - Omp; })
    };
  }

  /* ═══ i tipi di Hubble ═════════════════════════════════════════════════ */
  var TIPI = {
    S0: { fb: 0.42, m: 0, pitch: 0, giovani: 0, hii: 0, polv: 0, barra: 0, eps: 0 },
    Sa: { fb: 0.30, m: 2, pitch: 8, giovani: 0.07, hii: 0.004, polv: 0.07, barra: 0, eps: 0.25 },
    Sb: { fb: 0.17, m: 2, pitch: 13, giovani: 0.14, hii: 0.008, polv: 0.10, barra: 0, eps: 0.32 },
    Sc: { fb: 0.07, m: 2, pitch: 20, giovani: 0.24, hii: 0.012, polv: 0.09, barra: 0, eps: 0.36 },
    SBa: { fb: 0.24, m: 2, pitch: 9, giovani: 0.07, hii: 0.004, polv: 0.07, barra: 1.25, eps: 0.28 },
    SBb: { fb: 0.14, m: 2, pitch: 14, giovani: 0.14, hii: 0.008, polv: 0.10, barra: 1.1, eps: 0.34 },
    SBc: { fb: 0.06, m: 2, pitch: 21, giovani: 0.22, hii: 0.012, polv: 0.09, barra: 0.9, eps: 0.38 },
    Irr: { irr: true }
  };
  for (var nE = 0; nE <= 7; nE++) TIPI['E' + nE] = { ell: nE / 10 };
  function parametriTipo(tipo) { return TIPI[tipo] || TIPI.Sb; }
  /* fase del braccio a raggio R (bracci che seguono: rotazione verso +φ, il braccio arretra verso fuori) */
  function faseBraccio(R, K, R0) { return -K * Math.log(Math.max(R, R0) / R0); }
  /* angolo di avvolgimento misurato sulla curva: tan i = |d ln R / dφ| */
  function pitchMisurato(K, R0, R) { var h = 1e-4 * R, dphi = faseBraccio(R + h, K, R0) - faseBraccio(R - h, K, R0), dlnR = Math.log((R + h) / (R - h)); return Math.atan(Math.abs(dlnR / dphi)) * 180 / Math.PI; }

  /* colore da B − V (interpolazione su stelle tipiche) */
  var BV = [[-0.35, 0.60, 0.70, 1.00], [-0.1, 0.72, 0.80, 1.00], [0.15, 0.88, 0.91, 1.00], [0.45, 1.00, 0.97, 0.92], [0.68, 1.00, 0.92, 0.80], [1.0, 1.00, 0.82, 0.62], [1.4, 1.00, 0.70, 0.45], [1.9, 1.00, 0.58, 0.35]];
  function coloreBV(bv) {
    if (bv <= BV[0][0]) return BV[0].slice(1);
    for (var i = 1; i < BV.length; i++) if (bv <= BV[i][0]) { var a = BV[i - 1], b = BV[i], u = (bv - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u]; }
    return BV[BV.length - 1].slice(1);
  }

  /* tipi di stella per lo shader: 0 disco vecchio (onda di densita'), 1 giovane (nasce nel braccio e si spegne),
     2 barra (ruota con Ω_p), 3 rotazione semplice φ₀ + Ω t, 4 legato al braccio (polvere) */
  function Lista() { this.R = []; this.ph = []; this.z = []; this.tipo = []; this.col = []; this.size = []; this.vita = []; this.off = []; this.fom = []; }
  Lista.prototype.agg = function (R, ph, z, tipo, rgb, lum, size, vita, off, fom) { this.R.push(R); this.ph.push(ph); this.z.push(z); this.tipo.push(tipo); this.col.push(rgb[0] * lum, rgb[1] * lum, rgb[2] * lum); this.size.push(size); this.vita.push(vita || 0); this.off.push(off || 0); this.fom.push(fom == null ? 1 : fom); };
  Lista.prototype.dacart = function (x, y, z, tipo, rgb, lum, size, fom) { this.agg(Math.sqrt(x * x + y * y), Math.atan2(y, x), z, tipo, rgb, lum, size, 0, 0, fom); };
  Lista.prototype.pacco = function () {
    var n = this.R.length, pos = new Float32Array(3 * n);
    for (var i = 0; i < n; i++) { pos[3 * i] = this.R[i]; pos[3 * i + 1] = this.ph[i]; pos[3 * i + 2] = this.z[i]; }
    return { n: n, pos: pos, R: new Float32Array(this.R), tipo: new Float32Array(this.tipo), col: new Float32Array(this.col), size: new Float32Array(this.size), vita: new Float32Array(this.vita), off: new Float32Array(this.off), fom: new Float32Array(this.fom) };
  };
  function campionaEsp(rnd, Rd, Rmin, Rmax) { for (var k = 0; k < 200; k++) { var R = -Rd * Math.log((rnd() || 1e-12) * (rnd() || 1e-12)); if (R >= Rmin && R <= Rmax) return R; } return Rmin + (Rmax - Rmin) * rnd(); }
  function campionaSech2(rnd, h, zmax) { var z = h * 0.5 * Math.log((1 + (2 * rnd() - 1) * 0.999) / (1 - (2 * rnd() - 1) * 0.999)); return Math.max(-zmax, Math.min(zmax, z)); }
  function zSech2(rnd, h) { var u = 2 * rnd() - 1; u = Math.max(-0.995, Math.min(0.995, u)); return h * 0.5 * Math.log((1 + u) / (1 - u)); }
  function hernquistR(rnd, a, umax) { var s = Math.sqrt(Math.min(umax || 0.97, rnd())); return a * s / (1 - s); }
  function direzione(rnd) { var z = 2 * rnd() - 1, f = 2 * Math.PI * rnd(), s = Math.sqrt(1 - z * z); return [s * Math.cos(f), s * Math.sin(f), z]; }

  function generaGalassia(tipo, N, seme, opz) {
    opz = opz || {};
    var rnd = mulberry32(seme || 1), P = parametriTipo(tipo), Rd = opz.Rd || 3, m = opz.m || P.m || 2;
    var K = P.pitch ? 1 / Math.tan(P.pitch * Math.PI / 180) : 0, Rbar = P.barra ? P.barra * Rd : 0, R0 = Math.max(Rbar, 0.55 * Rd);
    var S = new Lista(), D = new Lista(), i, R, ph, z, bv, j;
    var PI2 = 2 * Math.PI, HII = [1.0, 0.42, 0.62], POLV = [0.10, 0.065, 0.045];
    var materiale = !!opz.materiale; /* bracci materiali (tutti tipo 3) per la scheda delle curve di rotazione */
    if (P.ell != null) {
      var q = 1 - P.ell, a = 0.9 * Rd;
      for (i = 0; i < N; i++) {
        var r = hernquistR(rnd, a, 0.965), d = direzione(rnd);
        bv = 0.86 + 0.22 * Math.exp(-r / a) + 0.05 * gauss(rnd);
        S.dacart(r * d[0], r * d[1], r * d[2] * q, 3, coloreBV(bv), 0.30, 2.2, 0.12);
      }
      return { stelle: S.pacco(), polvere: D.pacco(), par: { tipo: tipo, m: 2, K: 0, R0: 1, eps: 0, Rd: Rd, q: q, ell: true } };
    }
    if (P.irr) {
      var Ri = 0.55 * Rd, nc = 6 + Math.floor(rnd() * 4), centri = [];
      for (j = 0; j < nc; j++) { var rc = 1.6 * Ri * Math.sqrt(rnd()), fc = PI2 * rnd(); centri.push([rc * Math.cos(fc) + 0.6, rc * Math.sin(fc) * 0.7]); }
      var nOld = Math.round(N * 0.58), nY = Math.round(N * 0.36), nH = Math.round(N * 0.02);
      for (i = 0; i < nOld; i++) { R = campionaEsp(rnd, Ri, 0, 5 * Ri); ph = PI2 * rnd(); S.agg(R, ph, zSech2(rnd, 0.35), 3, coloreBV(0.5 + 0.35 * rnd()), 0.34, 2.2, 0, 0, 1); }
      for (i = 0; i < nY + nH; i++) {
        var c = centri[Math.floor(rnd() * nc)], x = c[0] + 0.5 * gauss(rnd), y = c[1] + 0.5 * gauss(rnd), hii = i >= nY;
        S.dacart(x, y, 0.12 * gauss(rnd), 3, hii ? HII : coloreBV(-0.3 + 0.35 * rnd()), hii ? 0.55 : 0.9, hii ? 7 : 2.8, 1);
      }
      for (i = 0; i < Math.round(N * 0.04); i++) { c = centri[Math.floor(rnd() * nc)]; D.dacart(c[0] + 0.7 * gauss(rnd), c[1] + 0.7 * gauss(rnd), 0.08 * gauss(rnd), 3, POLV, 0.08, 5, 1); }
      return { stelle: S.pacco(), polvere: D.pacco(), par: { tipo: tipo, m: 2, K: 0, R0: 1, eps: 0, Rd: Ri, irr: true } };
    }
    var nb = Math.round(P.fb * N), nbar = Rbar ? Math.round(0.08 * N) : 0, ny = Math.round(P.giovani * N), nh = Math.round(P.hii * N);
    var nd = P.m ? Math.round(P.polv * N) : 0, nold = Math.max(0, N - nb - nbar - ny - nh);
    var ab = 0.16 * Rd * (1 + P.fb), eps = opz.eps != null ? opz.eps : P.eps, spirale = P.m > 0;
    /* bulge: Hernquist schiacciato, ruota piano (sostenuto in parte dalla dispersione delle velocita') */
    for (i = 0; i < nb; i++) { var rb = hernquistR(rnd, ab, 0.95), db = direzione(rnd); bv = 0.95 + 0.12 * gauss(rnd); S.dacart(rb * db[0], rb * db[1], rb * db[2] * 0.62, 3, coloreBV(bv), 0.42, 2.2, 0.4); }
    /* barra: ellissoide allungato su x, ruota rigida con il disegno */
    for (i = 0; i < nbar; i++) {
      var xb; do { xb = 0.5 * Rbar * gauss(rnd); } while (Math.abs(xb) > Rbar);
      var yb = 0.26 * Rbar * gauss(rnd) * Math.sqrt(1 - Math.min(0.9, Math.abs(xb) / Rbar)), zb = 0.18 * gauss(rnd);
      S.dacart(xb, yb, zb, 2, coloreBV(0.85 + 0.1 * gauss(rnd)), 0.40, 2.2, 1);
    }
    /* disco vecchio: esponenziale, sech² in z, ε per stella (l'onda si accende fuori dalla barra) */
    for (i = 0; i < nold; i++) {
      R = campionaEsp(rnd, Rd, 0.05, 5 * Rd); ph = PI2 * rnd(); z = zSech2(rnd, 0.28);
      bv = 0.48 + 0.45 * rnd() - 0.05 * R / Rd;
      var ei = spirale && !materiale ? eps * Math.max(0, Math.min(1, (R - 0.5 * R0) / (0.5 * R0))) : 0;
      if (materiale && spirale && rnd() < 0.25) { j = Math.floor(rnd() * m); ph = faseBraccio(R, K, R0) + j * PI2 / m + 0.25 * gauss(rnd); }
      S.agg(R, ph, z, spirale && !materiale ? 0 : 3, coloreBV(bv), 0.42, 2.0, ei, 0, 1);
    }
    /* stelle giovani e regioni HII: nascono nel braccio, vivono decine di Myr */
    for (i = 0; i < ny + nh; i++) {
      var hii2 = i >= ny;
      R = campionaEsp(rnd, Rd, R0, 4.3 * Rd); j = Math.floor(rnd() * m);
      var vita = hii2 ? 10 + 6 * rnd() : 35 + 35 * rnd();
      if (materiale) { ph = faseBraccio(R, K, R0) + j * PI2 / m + 0.08 * gauss(rnd); S.agg(R, ph, 0.07 * gauss(rnd), 3, hii2 ? HII : coloreBV(-0.3 + 0.35 * rnd()), hii2 ? 0.55 : 0.9, hii2 ? 7 : 2.8, 0, 0, 1); }
      else S.agg(R, j * PI2 / m + 0.09 * gauss(rnd), 0.07 * gauss(rnd), 1, hii2 ? HII : coloreBV(-0.3 + 0.35 * rnd()), hii2 ? 0.6 : 0.95, hii2 ? 8 : 2.8, vita, vita * rnd(), 1);
    }
    /* polvere sul lato interno (a monte) del braccio, dove il gas e' compresso */
    for (i = 0; i < nd; i++) {
      R = campionaEsp(rnd, Rd, R0 * 0.9, 4 * Rd); j = Math.floor(rnd() * m);
      if (materiale) D.agg(R, faseBraccio(R, K, R0) + j * PI2 / m - 0.1 + 0.035 * gauss(rnd), 0.04 * gauss(rnd), 3, POLV, 0.065, 4.5, 0, 0, 1);
      else D.agg(R, j * PI2 / m - 0.1 + 0.035 * gauss(rnd), 0.04 * gauss(rnd), 4, POLV, 0.065, 4.5, 0, 0, 1);
    }
    return { stelle: S.pacco(), polvere: D.pacco(), par: { tipo: tipo, m: m, K: K, R0: R0, eps: eps, Rd: Rd, pitch: P.pitch, barra: Rbar } };
  }
  /* Ω di ogni stella (rad/Myr) da una curva di rotazione v(R) in km/s */
  function omegaStelle(pk, fv) {
    var n = pk.n, om = new Float32Array(n);
    for (var i = 0; i < n; i++) { var R = Math.max(0.25, pk.R[i]); om[i] = pk.fom[i] * fv(R) / R * OM_MYR; }
    return om;
  }
  /* profilo di densita' superficiale delle stelle (conteggi per kpc²) */
  function profilo(pk, Rmax, nb) {
    var cont = new Float64Array(nb), out = { R: [], sigma: [] };
    for (var i = 0; i < pk.n; i++) { if (pk.tipo[i] === 1 && pk.size[i] > 5) continue; var R = pk.R[i]; if (R < Rmax) cont[Math.floor(R / Rmax * nb)]++; }
    for (var k = 0; k < nb; k++) { var a = Rmax * k / nb, b = Rmax * (k + 1) / nb, A = Math.PI * (b * b - a * a); out.R.push((a + b) / 2); out.sigma.push(cont[k] / A); }
    return out;
  }

  /* ═══ collisione: N corpi ristretto ════════════════════════════════════
     unita': G = 1, massa 10¹¹ M☉, lunghezza 10 kpc → tempo 47,15 Myr, velocita' 207 km/s */
  var UNITA = { kpc: 10, Myr: 47.15, kms: 207.4 };
  var PRESET = {
    antenne: { rapp: 1, q: 0.9, i1: 20, w1: 0, i2: 55, w2: 90, nome: ['Antenne (NGC 4038/39)', 'Antennae (NGC 4038/39)'] },
    topi: { rapp: 1, q: 0.6, i1: 30, w1: 30, i2: 120, w2: 200, nome: ['Topi (NGC 4676)', 'Mice (NGC 4676)'] },
    vortice: { rapp: 0.3, q: 1.3, i1: 12, w1: 0, i2: 60, w2: 40, nome: ['Vortice (M51 + NGC 5195)', 'Whirlpool (M51 + NGC 5195)'] },
    ruota: { rapp: 0.25, q: 0.12, i1: 90, w1: 90, i2: 30, w2: 0, nome: ['Ruota del Carro (urto frontale)', 'Cartwheel (head-on)'] }
  };
  function collisioneCrea(p, seme) {
    var rnd = mulberry32(seme || 4242), M1 = 1, M2 = p.rapp == null ? 1 : p.rapp, Mt = M1 + M2, q = p.q || 1, r0 = p.r0 || 5.5, eps = p.eps || 0.1;
    var cosv = Math.max(-1, Math.min(1, 2 * q / r0 - 1)), nu = -Math.acos(cosv), vv = Math.sqrt(Mt / (2 * q));
    var rel = [r0 * Math.cos(nu), r0 * Math.sin(nu), 0], vrel = [-vv * Math.sin(nu), vv * (1 + Math.cos(nu)), 0];
    var cm = new Float64Array(12);
    for (var k = 0; k < 3; k++) { cm[k] = -M2 / Mt * rel[k]; cm[3 + k] = M1 / Mt * rel[k]; cm[6 + k] = -M2 / Mt * vrel[k]; cm[9 + k] = M1 / Mt * vrel[k]; }
    var n1 = p.N1 != null ? p.N1 : 3000, n2 = p.N2 != null ? p.N2 : Math.round(n1 * Math.sqrt(Math.min(1, M2))), n = n1 + n2;
    var pos = new Float64Array(3 * n), vel = new Float64Array(3 * n), gal = new Uint8Array(n), rag = new Float32Array(n);
    var masse = [M1, M2], inc = [p.i1 || 0, p.i2 || 0], arg = [p.w1 || 0, p.w2 || 0];
    for (var g = 0, idx = 0; g < 2; g++) {
      var ng = g ? n2 : n1, Mg = masse[g], rmax = (p.rmax || 1.0) * Math.cbrt(Mg), rmin = (p.rmin || 0.18) * Math.cbrt(Mg);
      var I = inc[g] * Math.PI / 180, W = arg[g] * Math.PI / 180;
      var e1 = [Math.cos(W), Math.sin(W), 0], e2 = [-Math.sin(W) * Math.cos(I), Math.cos(W) * Math.cos(I), Math.sin(I)];
      for (var i = 0; i < ng; i++, idx++) {
        var r = p.rfisso || Math.sqrt(rmin * rmin + (rmax * rmax - rmin * rmin) * rnd()), f = 2 * Math.PI * rnd();
        var vc = Math.sqrt(Mg * r * r / Math.pow(r * r + eps * eps, 1.5)), c = Math.cos(f), s = Math.sin(f);
        for (k = 0; k < 3; k++) { pos[3 * idx + k] = cm[3 * g + k] + r * (c * e1[k] + s * e2[k]); vel[3 * idx + k] = cm[6 + 3 * g + k] + vc * (-s * e1[k] + c * e2[k]); }
        gal[idx] = g; rag[idx] = r / rmax;
      }
    }
    var st = { cm: cm, m: masse, eps: eps, n: n, pos: pos, vel: vel, gal: gal, rag: rag, t: 0 };
    st.E0 = energiaNuclei(st); st.L0 = momentoNuclei(st);
    st.K0 = 0.5 * M1 * (cm[6] * cm[6] + cm[7] * cm[7] + cm[8] * cm[8]) + 0.5 * M2 * (cm[9] * cm[9] + cm[10] * cm[10] + cm[11] * cm[11]) || 1;
    return st;
  }
  function accNuclei(st, out) {
    var c = st.cm, dx = c[3] - c[0], dy = c[4] - c[1], dz = c[5] - c[2], r2 = dx * dx + dy * dy + dz * dz + st.eps * st.eps, i3 = 1 / (r2 * Math.sqrt(r2));
    out[0] = st.m[1] * dx * i3; out[1] = st.m[1] * dy * i3; out[2] = st.m[1] * dz * i3;
    out[3] = -st.m[0] * dx * i3; out[4] = -st.m[0] * dy * i3; out[5] = -st.m[0] * dz * i3;
  }
  function calciaParticelle(st, h) {
    var c = st.cm, e2 = st.eps * st.eps, P = st.pos, V = st.vel, m1 = st.m[0], m2 = st.m[1];
    for (var i = 0, n = st.n; i < n; i++) {
      var i3 = 3 * i, x = P[i3], y = P[i3 + 1], z = P[i3 + 2];
      var ax = c[0] - x, ay = c[1] - y, az = c[2] - z, r2 = ax * ax + ay * ay + az * az + e2, f1 = m1 / (r2 * Math.sqrt(r2));
      var bx = c[3] - x, by = c[4] - y, bz = c[5] - z, s2 = bx * bx + by * by + bz * bz + e2, f2 = m2 / (s2 * Math.sqrt(s2));
      V[i3] += h * (f1 * ax + f2 * bx); V[i3 + 1] += h * (f1 * ay + f2 * by); V[i3 + 2] += h * (f1 * az + f2 * bz);
    }
  }
  var ACC = new Float64Array(6);
  /* un passo leapfrog (calcio-deriva-calcio) di nuclei e particelle insieme */
  function collisionePasso(st, dt) {
    var c = st.cm, h = dt / 2, k;
    accNuclei(st, ACC); for (k = 0; k < 6; k++) c[6 + k] += h * ACC[k];
    calciaParticelle(st, h);
    for (k = 0; k < 6; k++) c[k] += dt * c[6 + k];
    var P = st.pos, V = st.vel; for (var i = 0, n3 = 3 * st.n; i < n3; i++) P[i] += dt * V[i];
    accNuclei(st, ACC); for (k = 0; k < 6; k++) c[6 + k] += h * ACC[k];
    calciaParticelle(st, h);
    st.t += dt;
  }
  function energiaNuclei(st) {
    var c = st.cm, m1 = st.m[0], m2 = st.m[1], dx = c[3] - c[0], dy = c[4] - c[1], dz = c[5] - c[2];
    return 0.5 * m1 * (c[6] * c[6] + c[7] * c[7] + c[8] * c[8]) + 0.5 * m2 * (c[9] * c[9] + c[10] * c[10] + c[11] * c[11]) - m1 * m2 / Math.sqrt(dx * dx + dy * dy + dz * dz + st.eps * st.eps);
  }
  function momentoNuclei(st) {
    var c = st.cm, L = [0, 0, 0];
    for (var g = 0; g < 2; g++) { var m = st.m[g], x = c[3 * g], y = c[3 * g + 1], z = c[3 * g + 2], vx = c[6 + 3 * g], vy = c[7 + 3 * g], vz = c[8 + 3 * g]; L[0] += m * (y * vz - z * vy); L[1] += m * (z * vx - x * vz); L[2] += m * (x * vy - y * vx); }
    return L;
  }
  function separazione(st) { var c = st.cm; return Math.hypot(c[3] - c[0], c[4] - c[1], c[5] - c[2]); }

  /* ═══ il Gruppo Locale ═════════════════════════════════════════════════
     coordinate galattiche (l, b) in gradi, distanze dal Sole in kpc (valori arrotondati delle
     compilazioni di Mateo 1998 e McConnachie 2012) */
  var GRUPPO = [
    ['LMC', ['Grande Nube di Magellano', 'Large Magellanic Cloud'], 280.5, -32.9, 50, 'Irr', 'grande'],
    ['SMC', ['Piccola Nube di Magellano', 'Small Magellanic Cloud'], 302.8, -44.3, 62, 'Irr', 'grande'],
    ['Sgr', ['Nana del Sagittario', 'Sagittarius dwarf'], 5.6, -14.2, 26, 'dSph'],
    ['UMi', ['Orsa Minore', 'Ursa Minor'], 105.0, 44.8, 76, 'dSph'],
    ['Dra', ['Dragone', 'Draco'], 86.4, 34.7, 76, 'dSph'],
    ['Scl', ['Scultore', 'Sculptor'], 287.5, -83.2, 86, 'dSph'],
    ['Sex', ['Sestante', 'Sextans'], 243.5, 42.3, 86, 'dSph'],
    ['Car', ['Carena', 'Carina'], 260.1, -22.2, 105, 'dSph'],
    ['For', ['Fornace', 'Fornax'], 237.1, -65.7, 147, 'dSph'],
    ['Leo II', ['Leone II', 'Leo II'], 220.2, 67.2, 233, 'dSph'],
    ['Leo I', ['Leone I', 'Leo I'], 226.0, 49.1, 254, 'dSph'],
    ['NGC 6822', ['NGC 6822 (Barnard)', 'NGC 6822 (Barnard)'], 25.3, -18.4, 500, 'Irr'],
    ['NGC 185', ['NGC 185', 'NGC 185'], 120.8, -14.5, 620, 'dE'],
    ['NGC 147', ['NGC 147', 'NGC 147'], 119.8, -14.3, 675, 'dE'],
    ['IC 1613', ['IC 1613', 'IC 1613'], 129.8, -60.6, 730, 'Irr'],
    ['M32', ['M32', 'M32'], 121.15, -21.98, 763, 'E2'],
    ['M31', ['Andromeda (M31)', 'Andromeda (M31)'], 121.17, -21.57, 765, 'Sb', 'grande'],
    ['Leo A', ['Leone A', 'Leo A'], 196.9, 52.4, 800, 'Irr'],
    ['NGC 205', ['NGC 205 (M110)', 'NGC 205 (M110)'], 120.7, -21.1, 824, 'dE'],
    ['M33', ['Triangolo (M33)', 'Triangulum (M33)'], 133.61, -31.33, 840, 'Sc', 'grande'],
    ['WLM', ['WLM', 'WLM'], 75.9, -73.6, 930, 'Irr']
  ];
  var SOLE = { R0: 8.2, z0: 0.02, v0: 230 };
  /* galattocentriche: x verso il centro dal Sole, y nel verso della rotazione (l = 90°), z verso il polo nord galattico */
  function galattocentriche(l, b, d, R0) {
    var L = l * Math.PI / 180, B = b * Math.PI / 180, r0 = R0 == null ? SOLE.R0 : R0;
    return [-r0 + d * Math.cos(B) * Math.cos(L), d * Math.cos(B) * Math.sin(L), SOLE.z0 + d * Math.sin(B)];
  }
  function separazioneAngolare(l1, b1, l2, b2) {
    var r = Math.PI / 180, c = Math.sin(b1 * r) * Math.sin(b2 * r) + Math.cos(b1 * r) * Math.cos(b2 * r) * Math.cos((l1 - l2) * r);
    return Math.acos(Math.max(-1, Math.min(1, c))) / r;
  }
  function periodoOrbitaSole(R0, v0) { return 2 * Math.PI * R0 / v0 * KPC_KMS_MYR; }

  F.calcolo.galassie = {
    G: G, OM_MYR: OM_MYR, mulberry32: mulberry32,
    besselI0: besselI0, besselI1: besselI1, besselK0: besselK0, besselK1: besselK1,
    vFreeman: vFreeman, massaDisco: massaDisco, vHernquist: vHernquist, massaHernquist: massaHernquist, rhoHernquist: rhoHernquist,
    rhoNFW: rhoNFW, massaNFW: massaNFW, vNFW: vNFW, curva: curva, MODELLO: MODELLO, kappa: kappa, risonanze: risonanze,
    TIPI: TIPI, generaGalassia: generaGalassia, omegaStelle: omegaStelle, profilo: profilo, faseBraccio: faseBraccio, pitchMisurato: pitchMisurato, coloreBV: coloreBV,
    collisione: { crea: collisioneCrea, passo: collisionePasso, energia: energiaNuclei, momento: momentoNuclei, separazione: separazione, PRESET: PRESET, UNITA: UNITA },
    GRUPPO: GRUPPO, SOLE: SOLE, galattocentriche: galattocentriche, separazioneAngolare: separazioneAngolare, periodoOrbitaSole: periodoOrbitaSole
  };

  /* ═══ grafica 3D ═══════════════════════════════════════════════════════ */
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
        var S = new lab.Scena(destra, 0.72);
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
  /* pausa e velocita' del tempo simulato */
  function controlliTempo(pan, st) {
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli del tempo', 'Time controls') });
    var bp = F.el('button', { type: 'button' });
    function agg() { bp.textContent = st.pausa ? '▶' : '❚❚'; var n = st.pausa ? t('Avvia', 'Play') : t('Pausa', 'Pause'); bp.title = n; bp.setAttribute('aria-label', n); }
    bp.addEventListener('click', function () { st.pausa = !st.pausa; agg(); if (st.sveglia) st.sveglia(); });
    riga.appendChild(bp); agg();
    var vel = [];
    [0.25, 0.5, 1, 2, 4, 8].forEach(function (v) {
      var b = F.el('button', { type: 'button', testo: '×' + (v === 0.25 ? '¼' : v === 0.5 ? '½' : v), title: t('Velocità ', 'Speed ') + v, 'aria-label': t('Velocità ', 'Speed ') + v, onclick: function () { st.vel = v; vel.forEach(function (x) { x[1].setAttribute('aria-pressed', String(x[0] === v)); }); } });
      b.setAttribute('aria-pressed', String(v === (st.vel || 1))); vel.push([v, b]); riga.appendChild(b);
    });
    var et = F.el('span'); riga.appendChild(et);
    pan.appendChild(riga);
    return { tempo: function (s) { et.textContent = s; }, aggiorna: agg };
  }
  var VS = [
    'attribute float aOm; attribute float aTipo; attribute float aVita; attribute float aOff; attribute float aSize; attribute vec3 aCol;',
    'uniform float uT; uniform float uOmP; uniform float uM; uniform float uK; uniform float uR0; uniform float uPx;',
    'varying vec3 vCol; varying float vA;',
    'void main(){',
    ' float R = position.x; float ph = position.y; float a = 1.0; float fase;',
    ' float armo = -uK * log(max(R, uR0) / uR0);',
    ' if (aTipo < 0.5) { float psi = ph + (aOm - uOmP) * uT; fase = psi - (aVita / uM) * sin(uM * psi) + armo + uOmP * uT; }',
    ' else if (aTipo < 1.5) { float e = mod(uT + aOff, aVita); float f = e / aVita; fase = ph + armo + uOmP * uT + (aOm - uOmP) * e; a = smoothstep(0.0, 0.06, f) * (1.0 - f) * (1.0 - f); }',
    ' else if (aTipo < 2.5) { fase = ph + uOmP * uT; }',
    ' else if (aTipo < 3.5) { fase = ph + aOm * uT; }',
    ' else { fase = ph + armo + uOmP * uT; }',
    ' vec4 mv = modelViewMatrix * vec4(R * cos(fase), R * sin(fase), position.z, 1.0);',
    ' gl_Position = projectionMatrix * mv;',
    ' gl_PointSize = clamp(aSize * uPx / max(0.01, -mv.z), 1.0, 64.0);',
    ' vCol = aCol; vA = a;',
    '}'].join('\n');
  var FS = [
    'uniform float uLum; uniform float uPolv; varying vec3 vCol; varying float vA;',
    'void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d) * 4.0; if (r2 > 1.0) discard; float f = exp(-r2 * 4.0) * vA;',
    ' if (uPolv > 0.5) gl_FragColor = vec4(vCol, f * uLum); else gl_FragColor = vec4(vCol * f * uLum, 1.0); }'].join('\n');
  function materialeStelle(T, par, polvere) {
    return new T.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uOmP: { value: 25 * OM_MYR }, uM: { value: par.m || 2 }, uK: { value: par.K || 0 }, uR0: { value: par.R0 || 1 }, uPx: { value: 30 }, uLum: { value: polvere ? 0.9 : 1 }, uPolv: { value: polvere ? 1 : 0 } },
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
      blending: polvere ? T.NormalBlending : T.AdditiveBlending
    });
  }
  function puntiGalassia(T, pk, par, om, polvere) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pk.pos, 3));
    g.setAttribute('aCol', new T.BufferAttribute(pk.col, 3));
    g.setAttribute('aTipo', new T.BufferAttribute(pk.tipo, 1));
    g.setAttribute('aVita', new T.BufferAttribute(pk.vita, 1));
    g.setAttribute('aOff', new T.BufferAttribute(pk.off, 1));
    g.setAttribute('aSize', new T.BufferAttribute(pk.size, 1));
    g.setAttribute('aOm', new T.BufferAttribute(om, 1));
    var p = new T.Points(g, materialeStelle(T, par, polvere));
    p.frustumCulled = false; p.renderOrder = polvere ? 2 : 1;
    return p;
  }
  /* una galassia completa (stelle + polvere) in un gruppo, con le uniformi in comune */
  function galassia3D(T, gal, fv) {
    var gr = new T.Group(), st = puntiGalassia(T, gal.stelle, gal.par, omegaStelle(gal.stelle, fv), false);
    gr.add(st); var po = null;
    if (gal.polvere.n) { po = puntiGalassia(T, gal.polvere, gal.par, omegaStelle(gal.polvere, fv), true); gr.add(po); }
    gr.userData = { stelle: st, polvere: po };
    gr.uniformi = function (nome, v) { st.material.uniforms[nome].value = v; if (po) po.material.uniforms[nome].value = v; };
    return gr;
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
  /* un fondo di stelle lontane (sfera grande, colori da B − V) */
  function fondoStelle(T, n, R, seme) {
    var rnd = mulberry32(seme || 99), pos = new Float32Array(3 * n), col = new Float32Array(3 * n);
    for (var i = 0; i < n; i++) { var d = direzione(rnd), c = coloreBV(-0.2 + 1.6 * rnd()), l = 0.25 + 0.6 * Math.pow(rnd(), 3); pos[3 * i] = R * d[0]; pos[3 * i + 1] = R * d[1]; pos[3 * i + 2] = R * d[2]; col[3 * i] = c[0] * l; col[3 * i + 1] = c[1] * l; col[3 * i + 2] = c[2] * l; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Points(g, new T.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  }
  function pxScala(S) { return S.ren.domElement.height * 0.07; }
  var NOMI_TIPI = { E0: 'E0', E1: 'E1', E2: 'E2', E3: 'E3', E4: 'E4', E5: 'E5', E6: 'E6', E7: 'E7', S0: 'S0', Sa: 'Sa', Sb: 'Sb', Sc: 'Sc', SBa: 'SBa', SBb: 'SBb', SBc: 'SBc', Irr: 'Irr' };
  function descrizioneTipo(tipo) {
    var P = parametriTipo(tipo);
    if (P.ell != null) return t('Ellittica ' + tipo + ': ellitticità ε = 1 − b/a = ' + P.ell.toFixed(1) + ' (rapporto assiale apparente b/a = ' + (1 - P.ell).toFixed(1) + '). Profilo di Hernquist ρ ∝ 1/[r(r+a)³], che proiettato somiglia alla legge R^¼ di de Vaucouleurs. Stelle vecchie e rosse (B − V ≈ 0,9–1,1), quasi niente gas né formazione stellare; sostenute dalla dispersione delle velocità più che dalla rotazione.', 'Elliptical ' + tipo + ': ellipticity ε = 1 − b/a = ' + P.ell.toFixed(1) + ' (apparent axis ratio b/a = ' + (1 - P.ell).toFixed(1) + '). Hernquist profile ρ ∝ 1/[r(r+a)³], which in projection resembles the de Vaucouleurs R^¼ law. Old red stars (B − V ≈ 0.9–1.1), almost no gas or star formation; supported by velocity dispersion more than by rotation.');
    if (P.irr) return t('Irregolare (tipo Nubi di Magellano): niente simmetria, grumi di formazione stellare con stelle blu e regioni HII rosa, disco esponenziale piccolo e rotazione lenta.', 'Irregular (Magellanic-Cloud-like): no symmetry, clumps of star formation with blue stars and pink HII regions, a small exponential disc and slow rotation.');
    if (!P.m) return t('Lenticolare S0: disco e bulge come una spirale, ma senza bracci né gas: una popolazione vecchia e uniforme, a metà tra ellittiche e spirali.', 'Lenticular S0: disc and bulge like a spiral, but no arms or gas: an old, uniform population halfway between ellipticals and spirals.');
    return t('Spirale ' + tipo + ': bulge ' + Math.round(P.fb * 100) + ' % delle stelle, angolo di avvolgimento i = ' + P.pitch + '° (bracci φ = −cot i · ln(R/R₀))' + (P.barra ? ', barra lunga ' + (P.barra * 3).toFixed(1) + ' kpc che ruota con il disegno' : '') + '. Dalla a alla c il bulge si rimpicciolisce, i bracci si aprono e cresce la formazione stellare.', 'Spiral ' + tipo + ': bulge ' + Math.round(P.fb * 100) + ' % of the stars, pitch angle i = ' + P.pitch + '° (arms φ = −cot i · ln(R/R₀))' + (P.barra ? ', a ' + (P.barra * 3).toFixed(1) + ' kpc bar rotating with the pattern' : '') + '. From a to c the bulge shrinks, the arms open up and star formation increases.');
  }

  /* ─── scheda 1: la sequenza di Hubble ─────────────────────────────────── */
  function schedaTipi(pan, S, destra) {
    var T = S.T, st = { tipo: 'SBb', N: 40000, m: 2, Omp: 25, eps: 0.32, polv: true, pausa: false, vel: 1, t: 0 };
    var info = nota(pan), ris = nota(pan);
    F.scelta(pan, ['Tipo di Hubble', 'Hubble type'], Object.keys(NOMI_TIPI).map(function (k) { return [k, k]; }), st.tipo, function (v) { st.tipo = v; st.eps = parametriTipo(v).eps || 0; cEps.value = st.eps; cEps.dispatchEvent(new Event('input')); costruisci(); });
    F.cursore(pan, ['Stelle', 'Stars'], 10000, 60000, 5000, st.N, function (v) { st.N = v; costruisci(); }, function (v) { return (v / 1000) + ' 000'; });
    F.cursore(pan, ['Bracci m', 'Arms m'], 2, 4, 1, st.m, function (v) { st.m = v; costruisci(); });
    F.cursore(pan, ['Ω_p del disegno (km/s/kpc)', 'Pattern Ω_p (km/s/kpc)'], 10, 60, 1, st.Omp, function (v) { st.Omp = v; if (gal3) gal3.uniformi('uOmP', v * OM_MYR); scriviRis(); });
    var cEps = F.cursore(pan, ['Ampiezza dell’onda ε', 'Wave amplitude ε'], 0, 0.6, 0.02, st.eps, function (v) { if (Math.abs(v - st.eps) > 1e-9) { st.eps = v; costruisci(); } }, function (v) { return v.toFixed(2); });
    casella(pan, ['Corsie di polvere', 'Dust lanes'], st.polv, function (v) { st.polv = v; if (gal3 && gal3.userData.polvere) gal3.userData.polvere.visible = v; S.sporca = true; });
    var vista = F.el('div'); pan.appendChild(vista);
    F.bottone(vista, ['Di faccia', 'Face-on'], function () { S.inquadra(34, -1.2, 0.08); });
    F.bottone(vista, ['Di taglio', 'Edge-on'], function () { S.inquadra(34, -1.2, Math.PI / 2 - 0.02); });
    F.bottone(vista, ['Inclinata', 'Inclined'], function () { S.inquadra(32, -1.2, 0.95); });
    var ctl = controlliTempo(pan, st);
    nota(pan, t('<b>Onda di densità</b> (Lin & Shu 1964): il disegno a spirale ruota rigido con Ω_p, le stelle con Ω(R) = v(R)/R. Dentro la corotazione (Ω > Ω_p) le stelle raggiungono il braccio da dietro, vi rallentano e si affollano: nel sistema del disegno la fase è θ = ψ − (ε/m) sin mψ e la densità ∝ 1/(1 − ε cos mψ). Il gas viene compresso sul lato interno del braccio (corsie di polvere scure), lì nascono le stelle O e B blu e le regioni HII rosa, che vengono trascinate a valle da Ω − Ω_p e si spengono dopo 10–70 milioni di anni: per questo i bracci sono blu. I bracci esistono tra le risonanze di Lindblad interna ed esterna, Ω_p = Ω ∓ κ/m, con κ² = R dΩ²/dR + 4Ω² (per una curva piatta κ = √2 Ω).',
      '<b>Density wave</b> (Lin & Shu 1964): the spiral pattern rotates rigidly at Ω_p, the stars at Ω(R) = v(R)/R. Inside corotation (Ω > Ω_p) stars catch up with the arm from behind, slow down in it and crowd: in the pattern frame the phase is θ = ψ − (ε/m) sin mψ and the density ∝ 1/(1 − ε cos mψ). Gas is compressed on the inner side of the arm (dark dust lanes), where blue O and B stars and pink HII regions are born, dragged downstream by Ω − Ω_p and fading after 10–70 million years: that is why arms are blue. Arms live between the inner and outer Lindblad resonances, Ω_p = Ω ∓ κ/m, with κ² = R dΩ²/dR + 4Ω² (for a flat curve κ = √2 Ω).'));
    var cv = F.tela(destra, 0.42);
    var fondo = fondoStelle(T, 2500, 900, 7); S.sc.add(fondo);
    var gal3 = null, gal = null, fv = function (R) { return curva(R).vt; };
    function scriviRis() {
      var P = parametriTipo(st.tipo);
      if (!P.m) { ris.innerHTML = ''; return; }
      var r = risonanze(st.Omp, st.m, fv), f = function (x) { return x == null ? '—' : x.toFixed(1) + ' kpc'; };
      ris.innerHTML = t('Con la curva di rotazione del modello (v ≈ 220 km/s): corotazione R_CR = ', 'With the model rotation curve (v ≈ 220 km/s): corotation R_CR = ') + '<b>' + f(r.cr) + '</b>, ' + t('Lindblad interna ', 'inner Lindblad ') + f(r.ilr) + ', ' + t('esterna ', 'outer ') + f(r.olr) + '. ' + t('Periodo del disegno 2π/Ω_p = ', 'Pattern period 2π/Ω_p = ') + Math.round(2 * Math.PI / (st.Omp * OM_MYR)) + ' Myr.';
    }
    function costruisci() {
      if (gal3) { S.radice.remove(gal3); gal3.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
      var P = parametriTipo(st.tipo);
      gal = generaGalassia(st.tipo, st.N, 2024, { m: st.m, eps: st.eps });
      fv = P.irr ? function (R) { return 70 * (1 - Math.exp(-R / 1.2)); } : function (R) { return curva(R).vt; };
      gal3 = galassia3D(T, gal, fv);
      gal3.uniformi('uOmP', st.Omp * OM_MYR); gal3.uniformi('uT', st.t); gal3.uniformi('uPx', pxScala(S));
      if (gal3.userData.polvere) gal3.userData.polvere.visible = st.polv;
      S.aggiungi(gal3);
      info.innerHTML = descrizioneTipo(st.tipo);
      scriviRis();
      S.didascalia.textContent = t('Galassia ' + st.tipo + ' — ', 'Galaxy ' + st.tipo + ' — ') + gal.stelle.n.toLocaleString() + t(' stelle', ' stars');
      grafico();
    }
    function grafico() {
      var pr = profilo(gal.stelle, 18, 36), y = pr.sigma.map(function (s) { return s > 0 ? Math.log10(s) : NaN; });
      var serie = [{ x: pr.R, y: y, col: '#ffd24a', etich: ['stelle', 'stars'] }], leg = [{ col: '#ffd24a', etich: ['conteggi delle stelle', 'star counts'] }];
      var P = parametriTipo(st.tipo);
      if (P.ell == null && !P.irr) {
        var Rd = gal.par.Rd, ref = 0, nref = 0; pr.R.forEach(function (R, k) { if (R > 1.5 * Rd && R < 3 * Rd && pr.sigma[k] > 0) { ref += Math.log10(pr.sigma[k]) + R / Rd / Math.LN10; nref++; } });
        ref /= nref || 1;
        serie.push({ x: pr.R, y: pr.R.map(function (R) { return ref - R / Rd / Math.LN10; }), col: '#6bcfff', tratt: true, etich: ['esponenziale', 'exponential'] });
        leg.push({ col: '#6bcfff', etich: ['disco esponenziale R_d = 3 kpc', 'exponential disc R_d = 3 kpc'] });
      }
      F.grafico(cv, { serie: serie, xmin: 0, xmax: 18, xl: ['R (kpc)', 'R (kpc)'], yl: ['log₁₀ Σ (stelle/kpc²)', 'log₁₀ Σ (stars/kpc²)'], legenda: leg, descr: ['Profilo di densità superficiale delle stelle', 'Stellar surface density profile'] });
    }
    F.alRidimensiona(function () { if (gal) grafico(); });
    costruisci();
    st.sveglia = function () { S.avvia(); };
    S.ogniFotogramma(function (dt) {
      if (gal3) gal3.uniformi('uPx', pxScala(S));
      if (st.pausa) return false;
      st.t += dt * 15 * st.vel;
      if (gal3) gal3.uniformi('uT', st.t);
      ctl.tempo('t = ' + Math.round(st.t) + ' Myr');
      return true;
    });
    S.inquadra(32, -1.2, 0.95);
  }

  /* ─── scheda 2: le curve di rotazione ─────────────────────────────────── */
  function schedaCurve(pan, S, destra) {
    var T = S.T, p = {}; for (var k in MODELLO) p[k] = MODELLO[k];
    var st = { pausa: false, vel: 1, t: 0, scuro: true };
    var info = nota(pan);
    F.cursore(pan, ['Massa del disco M_d (10¹⁰ M☉)', 'Disc mass M_d (10¹⁰ M☉)'], 1, 15, 0.5, p.Md / 1e10, function (v) { p.Md = v * 1e10; aggiorna(); });
    F.cursore(pan, ['Scala del disco R_d (kpc)', 'Disc scale R_d (kpc)'], 1.5, 6, 0.1, p.Rd, function (v) { p.Rd = v; aggiorna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Massa del bulge (10¹⁰ M☉)', 'Bulge mass (10¹⁰ M☉)'], 0, 5, 0.25, p.Mb / 1e10, function (v) { p.Mb = v * 1e10; aggiorna(); });
    F.cursore(pan, ['Alone: log₁₀ ρ_s (M☉/kpc³)', 'Halo: log₁₀ ρ_s (M☉/kpc³)'], 6, 7.8, 0.02, Math.log10(p.rhos), function (v) { p.rhos = Math.pow(10, v); aggiorna(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Alone: r_s (kpc)', 'Halo: r_s (kpc)'], 4, 40, 1, p.rs, function (v) { p.rs = v; aggiorna(); });
    casella(pan, ['La galassia 3D gira con l’alone', '3D galaxy rotates with the halo'], st.scuro, function (v) { st.scuro = v; aggiorna(); });
    F.bottone(pan, ['Riallinea i raggi di stelle', 'Realign the star spokes'], function () { riallinea(); });
    var ctl = controlliTempo(pan, st);
    nota(pan, t('Le velocità di rotazione si sommano in quadratura: v² = v²_bulge + v²_disco + v²_alone. Disco di Freeman: v²(R) = 4πGΣ₀R_d y²[I₀(y)K₀(y) − I₁(y)K₁(y)], y = R/(2R_d), picco a R ≈ 2,15 R_d con v_max ≈ 0,62 √(GM_d/R_d). Bulge di Hernquist: v² = GM_b r/(r+a)². Alone NFW (Navarro, Frenk & White 1996): M(r) = 4πρ_s r_s³[ln(1+x) − x/(1+x)]. Lontano da tutta la massa visibile v ∝ r^(−½) (Kepler); le curve osservate (Rubin & Ford, 1970; HI a 21 cm) restano invece piatte: serve materia che non si vede, con M(r) ∝ r. I «raggi» di stelle allineate mostrano la rotazione differenziale: dopo un giro si sono già avvolti a spirale — se i bracci fossero fatti sempre delle stesse stelle si avvolgerebbero in pochi giri (problema dell’avvolgimento).',
      'Rotation speeds add in quadrature: v² = v²_bulge + v²_disc + v²_halo. Freeman disc: v²(R) = 4πGΣ₀R_d y²[I₀(y)K₀(y) − I₁(y)K₁(y)], y = R/(2R_d), peaking at R ≈ 2.15 R_d with v_max ≈ 0.62 √(GM_d/R_d). Hernquist bulge: v² = GM_b r/(r+a)². NFW halo (Navarro, Frenk & White 1996): M(r) = 4πρ_s r_s³[ln(1+x) − x/(1+x)]. Far from all the visible mass v ∝ r^(−½) (Kepler); observed curves (Rubin & Ford, 1970; 21 cm HI) stay flat instead: invisible matter is needed, with M(r) ∝ r. The «spokes» of aligned stars show differential rotation: after one turn they have already wound into a spiral — if arms were always made of the same stars they would wind up in a few turns (the winding problem).'));
    var cv = F.tela(destra, 0.55);
    S.sc.add(fondoStelle(T, 2000, 900, 11));
    /* «osservazioni» illustrative: il modello di riferimento con rumore riproducibile */
    var rnd = mulberry32(31), oss = [];
    for (var R = 1.5; R <= 32; R += 1.5) oss.push({ x: R, y: curva(R, MODELLO).vt + 6 * gauss(rnd), e: 6 + R * 0.3 });
    var gal = generaGalassia('Sb', 26000, 77, { materiale: true }), gal3 = null, raggi = null, omR = null, omG = null, omP = null;
    var nR = 3 * 60, pr = new Lista();
    for (var j = 0; j < 3; j++) for (var i = 0; i < 60; i++) { var r = 0.4 + 15 * i / 59; pr.agg(r, j * 2 * Math.PI / 3, 0, 3, [0.4, 1, 0.9], 1.6, 5.5, 0, 0, 1); }
    var pkR = pr.pacco();
    function fvAttuale() { var q = {}; for (var kk in p) q[kk] = p[kk]; q.alone = st.scuro; return function (r) { return curva(r, q).vt; }; }
    /* Ω cambia: la fase φ₀ + Ω t viene riportata a t = 0 per ogni stella, cosi' nessuna salta */
    function rifasa(pk, omVecchio, tt) { if (!omVecchio) return; for (var i = 0; i < pk.n; i++) pk.pos[3 * i + 1] = (pk.pos[3 * i + 1] + omVecchio[i] * tt) % (2 * Math.PI); }
    function aggiornaOmega() {
      var fv = fvAttuale();
      rifasa(gal.stelle, omG, st.t); rifasa(gal.polvere, omP, st.t); rifasa(pkR, omR, st.t); st.t = 0;
      omG = omegaStelle(gal.stelle, fv); omP = omegaStelle(gal.polvere, fv); omR = omegaStelle(pkR, fv);
      if (!gal3) {
        gal3 = galassia3D(T, gal, fv); S.aggiungi(gal3);
        raggi = puntiGalassia(T, pkR, gal.par, omR, false); S.aggiungi(raggi);
      }
      var gs = gal3.userData.stelle.geometry, gp = gal3.userData.polvere && gal3.userData.polvere.geometry, gr = raggi.geometry;
      gs.setAttribute('aOm', new T.BufferAttribute(omG, 1)); gs.attributes.position.needsUpdate = true;
      if (gp) { gp.setAttribute('aOm', new T.BufferAttribute(omP, 1)); gp.attributes.position.needsUpdate = true; }
      gr.setAttribute('aOm', new T.BufferAttribute(omR, 1)); gr.attributes.position.needsUpdate = true;
      gal3.uniformi('uT', 0); raggi.material.uniforms.uT.value = 0;
      S.sporca = true; S.avvia();
    }
    function riallinea() {
      for (var j = 0; j < 3; j++) for (var i = 0; i < 60; i++) pkR.pos[3 * (j * 60 + i) + 1] = j * 2 * Math.PI / 3 - (omR ? omR[j * 60 + i] * st.t : 0);
      raggi.geometry.attributes.position.needsUpdate = true; S.sporca = true; S.avvia();
    }
    function aggiorna() {
      aggiornaOmega();
      var Rs = [], vb = [], vd = [], vh = [], vt = [], vv = [];
      for (var R = 0.2; R <= 40; R += 0.4) { var c = curva(R, p); Rs.push(R); vb.push(c.vb); vd.push(c.vd); vh.push(c.vh); vt.push(c.vt); vv.push(c.vvis); }
      var chi = 0; oss.forEach(function (o) { var d = (curva(o.x, p).vt - o.y) / o.e; chi += d * d; });
      var P = F.grafico(cv, {
        serie: [{ x: Rs, y: vt, col: '#e6fffb', larg: 2.6, etich: ['totale', 'total'] }, { x: Rs, y: vv, col: '#ffd24a', tratt: true, etich: ['visibile', 'visible'] }, { x: Rs, y: vd, col: '#6bcfff', larg: 1.4, etich: ['disco', 'disc'] }, { x: Rs, y: vb, col: '#ff8a80', larg: 1.4, etich: ['bulge', 'bulge'] }, { x: Rs, y: vh, col: '#b28dff', larg: 1.4, etich: ['alone', 'halo'] }],
        punti: oss.map(function (o) { return { x: o.x, y: o.y, col: '#5eead4', r: 3 }; }),
        xmin: 0, xmax: 40, ymin: 0, ymax: 320, xl: ['R (kpc)', 'R (kpc)'], yl: ['v (km/s)', 'v (km/s)'],
        legenda: [{ col: '#e6fffb', etich: ['totale', 'total'] }, { col: '#ffd24a', etich: ['solo materia visibile', 'visible matter only'] }, { col: '#6bcfff', etich: ['disco (Freeman)', 'disc (Freeman)'] }, { col: '#ff8a80', etich: ['bulge (Hernquist)', 'bulge (Hernquist)'] }, { col: '#b28dff', etich: ['alone NFW', 'NFW halo'] }, { col: '#5eead4', etich: ['«osservazioni» illustrative', 'illustrative «observations»'] }],
        descr: ['Curva di rotazione: componenti e totale', 'Rotation curve: components and total']
      });
      P.q.strokeStyle = 'rgba(94,234,212,.6)'; P.q.lineWidth = 1;
      oss.forEach(function (o) { P.q.beginPath(); P.q.moveTo(P.X(o.x), P.Y(o.y - o.e)); P.q.lineTo(P.X(o.x), P.Y(o.y + o.e)); P.q.stroke(); });
      var R20 = 20, c20 = curva(R20, p), Mtot = massaHernquist(R20, p.Mb, p.ab) + massaDisco(R20, p.Md, p.Rd) + massaNFW(R20, p.rhos, p.rs), Mvis = massaHernquist(R20, p.Mb, p.ab) + massaDisco(R20, p.Md, p.Rd);
      info.innerHTML = t('A R = 20 kpc: v = ', 'At R = 20 kpc: v = ') + '<b>' + Math.round(c20.vt) + ' km/s</b> (' + t('solo visibile ', 'visible only ') + Math.round(c20.vvis) + ' km/s). ' + t('Massa entro 20 kpc: ', 'Mass within 20 kpc: ') + fmt(Mtot / 1e10) + '·10¹⁰ M☉, ' + t('di cui oscura ', 'dark ') + Math.round(100 * (1 - Mvis / Mtot)) + ' %. χ² ' + t('sulle osservazioni', 'on the observations') + ' = ' + chi.toFixed(1) + ' (' + oss.length + t(' punti).', ' points).') + '<br>' + t('Periodo di rotazione a 8 kpc: ', 'Rotation period at 8 kpc: ') + Math.round(2 * Math.PI * 8 / curva(8, st.scuro ? p : { Mb: p.Mb, ab: p.ab, Md: p.Md, Rd: p.Rd, alone: false }).vt * KPC_KMS_MYR) + ' Myr.';
      S.didascalia.textContent = t('Galassia che ruota con la curva scelta' + (st.scuro ? ' (con alone oscuro)' : ' (senza alone: solo materia visibile)'), 'Galaxy rotating with the chosen curve' + (st.scuro ? ' (with dark halo)' : ' (no halo: visible matter only)'));
    }
    F.alRidimensiona(aggiorna);
    aggiorna();
    st.sveglia = function () { S.avvia(); };
    S.ogniFotogramma(function (dt) {
      if (gal3) { gal3.uniformi('uPx', pxScala(S)); raggi.material.uniforms.uPx.value = pxScala(S); }
      if (st.pausa) return false;
      st.t += dt * 20 * st.vel;
      gal3.uniformi('uT', st.t); raggi.material.uniforms.uT.value = st.t;
      ctl.tempo('t = ' + Math.round(st.t) + ' Myr');
      return true;
    });
    S.inquadra(34, -1.2, 0.55);
  }

  /* ─── scheda 3: la collisione ─────────────────────────────────────────── */
  function schedaCollisione(pan, S, destra) {
    var T = S.T, SC = 4;  /* unita' di scena per unita' di simulazione (10 kpc) */
    var st = { preset: 'antenne', N: 3500, pausa: false, vel: 1 }, par = {};
    function carica(nome) { var q = PRESET[nome]; for (var k in q) par[k] = q[k]; }
    carica(st.preset);
    var info = nota(pan), cur = {};
    F.scelta(pan, ['Incontro', 'Encounter'], Object.keys(PRESET).map(function (k) { return [k, PRESET[k].nome]; }), st.preset, function (v) { st.preset = v; carica(v); ['rapp', 'q', 'i1', 'i2'].forEach(function (k) { cur[k].value = par[k]; cur[k].dispatchEvent(new Event('input')); }); ricomincia(); });
    cur.rapp = F.cursore(pan, ['Rapporto delle masse M₂/M₁', 'Mass ratio M₂/M₁'], 0.1, 1, 0.05, par.rapp, function (v) { par.rapp = v; ricominciaPoi(); }, function (v) { return v.toFixed(2); });
    cur.q = F.cursore(pan, ['Pericentro (×10 kpc)', 'Pericentre (×10 kpc)'], 0.05, 3, 0.05, par.q, function (v) { par.q = v; ricominciaPoi(); }, function (v) { return v.toFixed(2); });
    cur.i1 = F.cursore(pan, ['Inclinazione disco 1 (°)', 'Disc 1 inclination (°)'], 0, 180, 5, par.i1, function (v) { par.i1 = v; ricominciaPoi(); });
    cur.i2 = F.cursore(pan, ['Inclinazione disco 2 (°)', 'Disc 2 inclination (°)'], 0, 180, 5, par.i2, function (v) { par.i2 = v; ricominciaPoi(); });
    F.cursore(pan, ['Particelle (galassia 1)', 'Particles (galaxy 1)'], 1000, 6000, 500, st.N, function (v) { st.N = v; ricominciaPoi(); });
    F.bottone(pan, ['↺ Ricomincia', '↺ Restart'], function () { ricomincia(); });
    var ctl = controlliTempo(pan, st);
    nota(pan, t('N corpi <b>ristretto</b> (Toomre & Toomre 1972): i due nuclei (masse M₁, M₂, potenziale di Plummer Φ = −GM/√(r²+ε²)) si muovono su un’orbita parabolica e si attraggono; le stelle dei dischi sono particelle di prova che sentono solo i nuclei. È poco costoso (2 forze per particella invece di N) e già mostra la fisica delle maree: le forze differenziali ∝ GM d/r³ strappano dal lato vicino un <i>ponte</i> e dal lato lontano una <i>coda</i>. I dischi che ruotano nello stesso verso dell’orbita (inclinazione piccola, «progradi») risuonano con la marea e fanno code lunghissime come le Antenne; i retrogradi (≈ 180°) quasi non reagiscono; un urto frontale attraverso il disco lancia un’onda di densità ad anello (Ruota del Carro). Integratore leapfrog simplettico: l’energia dei nuclei oscilla ma non deriva. Unità: 10 kpc, 10¹¹ M☉, 47 Myr.',
      '<b>Restricted</b> N-body (Toomre & Toomre 1972): the two cores (masses M₁, M₂, Plummer potential Φ = −GM/√(r²+ε²)) move on a parabolic orbit and attract each other; the disc stars are test particles feeling only the cores. It is cheap (2 forces per particle instead of N) and already shows tidal physics: differential forces ∝ GM d/r³ pull a <i>bridge</i> from the near side and a <i>tail</i> from the far side. Discs spinning in the same sense as the orbit (small inclination, «prograde») resonate with the tide and grow very long tails like the Antennae; retrograde ones (≈ 180°) barely react; a head-on impact through a disc launches a ring density wave (Cartwheel). Symplectic leapfrog integrator: the cores’ energy oscillates but does not drift. Units: 10 kpc, 10¹¹ M☉, 47 Myr.'));
    var cv = F.tela(destra, 0.38);
    S.sc.add(fondoStelle(T, 2500, 900, 5));
    var sim = null, punti = null, nuclei = [], scie = [], storia = { t: [], d: [], dE: [] }, tGraf = 0, tAtt = null;
    function ricominciaPoi() { clearTimeout(tAtt); tAtt = setTimeout(ricomincia, 120); }
    function ricomincia() {
      S.pulisci();
      sim = collisioneCrea({ rapp: par.rapp, q: par.q, i1: par.i1, w1: par.w1, i2: par.i2, w2: par.w2, N1: st.N, N2: st.preset === 'ruota' ? Math.round(st.N * 0.15) : undefined }, 4242);
      var n = sim.n, pos = new Float32Array(3 * n), col = new Float32Array(3 * n);
      for (var i = 0; i < n; i++) {
        var c = sim.gal[i] ? coloreBV(0.9 - 0.6 * sim.rag[i]) : coloreBV(0.5 - 0.75 * sim.rag[i]), l = 0.75;
        col[3 * i] = c[0] * l; col[3 * i + 1] = c[1] * l; col[3 * i + 2] = c[2] * l;
      }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
      punti = new T.Points(g, new T.PointsMaterial({ size: 0.42, map: texBagliore(T), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      punti.frustumCulled = false; S.aggiungi(punti);
      nuclei = [sprite(T, 0xfff1c8, 3.2), sprite(T, 0xffd6a0, 3.2 * Math.sqrt(par.rapp))]; nuclei.forEach(function (s) { S.aggiungi(s); });
      scie = [0, 1].map(function (k) { var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(new Float32Array(3 * 3000), 3)); gg.setDrawRange(0, 0); var L = new T.Line(gg, new T.LineBasicMaterial({ color: k ? 0xffb070 : 0x9fd7ff, transparent: true, opacity: 0.45 })); L.frustumCulled = false; S.aggiungi(L); return L; });
      storia = { t: [], d: [], dE: [] }; tGraf = 0;
      copia(); grafico();
      S.didascalia.textContent = t('Collisione di galassie: ', 'Galaxy collision: ') + F.tt(PRESET[st.preset].nome) + ' — ' + n + t(' particelle', ' particles');
      S.avvia();
    }
    function copia() {
      var a = punti.geometry.attributes.position.array, P = sim.pos;
      for (var i = 0, n3 = 3 * sim.n; i < n3; i++) a[i] = P[i] * SC;
      punti.geometry.attributes.position.needsUpdate = true;
      for (var g = 0; g < 2; g++) {
        nuclei[g].position.set(sim.cm[3 * g] * SC, sim.cm[3 * g + 1] * SC, sim.cm[3 * g + 2] * SC);
        var L = scie[g], arr = L.geometry.attributes.position.array, nn = L.geometry.drawRange.count;
        if (nn < 3000 && (nn === 0 || Math.hypot(arr[3 * nn - 3] - nuclei[g].position.x, arr[3 * nn - 2] - nuclei[g].position.y, arr[3 * nn - 1] - nuclei[g].position.z) > 0.15)) {
          arr[3 * nn] = nuclei[g].position.x; arr[3 * nn + 1] = nuclei[g].position.y; arr[3 * nn + 2] = nuclei[g].position.z;
          L.geometry.setDrawRange(0, nn + 1); L.geometry.attributes.position.needsUpdate = true;
        }
      }
    }
    function grafico() {
      F.grafico(cv, { serie: [{ x: storia.t.length ? storia.t : [0], y: storia.d.length ? storia.d : [separazione(sim) * 10], col: '#ffd24a', etich: ['separazione', 'separation'] }], xmin: 0, xmax: Math.max(200, (storia.t[storia.t.length - 1] || 0) * 1.1), ymin: 0, xl: ['t (Myr)', 't (Myr)'], yl: ['d (kpc)', 'd (kpc)'], descr: ['Distanza tra i due nuclei nel tempo', 'Distance between the two cores over time'] });
      var E = energiaNuclei(sim);
      info.innerHTML = 't = <b>' + Math.round(sim.t * UNITA.Myr) + ' Myr</b>, ' + t('distanza dei nuclei ', 'core separation ') + (separazione(sim) * 10).toFixed(1) + ' kpc. ' + t('Energia dei nuclei (orbita parabolica, E₀ ≈ 0): ΔE/K₀ = ', 'Core energy (parabolic orbit, E₀ ≈ 0): ΔE/K₀ = ') + ((E - sim.E0) / sim.K0).toExponential(1) + t(' (K₀ energia cinetica iniziale).', ' (K₀ initial kinetic energy).');
    }
    F.alRidimensiona(function () { if (sim) grafico(); });
    ricomincia();
    st.sveglia = function () { S.avvia(); };
    S.ogniFotogramma(function (dt) {
      if (st.pausa || !sim) return false;
      var passi = Math.max(1, Math.round(st.vel * 1.5)), h = 0.012 * Math.min(1, st.vel * 1.5) * Math.min(1.6, dt * 60);
      for (var k = 0; k < passi; k++) collisionePasso(sim, h);
      copia();
      tGraf += dt;
      if (tGraf > 0.4) { tGraf = 0; storia.t.push(sim.t * UNITA.Myr); storia.d.push(separazione(sim) * 10); grafico(); }
      ctl.tempo('t = ' + Math.round(sim.t * UNITA.Myr) + ' Myr');
      return true;
    });
    S.inquadra(44, -1.3, 0.75);
  }

  /* ─── scheda 4: la Via Lattea e il Gruppo Locale ──────────────────────── */
  function schedaGruppo(pan, S, destra) {
    var T = S.T, st = { log: true, etich: true, linee: true, pausa: false, vel: 1, t: 0 };
    var info = nota(pan);
    F.scelta(pan, ['Scala delle distanze', 'Distance scale'], [['log', ['logaritmica (oltre 25 kpc)', 'logarithmic (beyond 25 kpc)']], ['lin', ['lineare', 'linear']]], 'log', function (v) { st.log = v === 'log'; costruisci(); S.inquadra(st.log ? 190 : 1500, -0.6, 1.0); });
    casella(pan, ['Nomi', 'Names'], st.etich, function (v) { st.etich = v; costruisci(); });
    casella(pan, ['Linee dalla Via Lattea', 'Lines from the Milky Way'], st.linee, function (v) { st.linee = v; costruisci(); });
    var vista = F.el('div'); pan.appendChild(vista);
    F.bottone(vista, ['Via Lattea da vicino', 'Milky Way close-up'], function () { S.inquadra(45, -0.4, 0.85); });
    F.bottone(vista, ['Tutto il Gruppo', 'Whole Group'], function () { S.inquadra(st.log ? 190 : 1500, -0.6, 1.0); });
    var ctl = controlliTempo(pan, st);
    var tab = F.el('div', { style: 'max-height:260px;overflow:auto' }); pan.appendChild(tab);
    nota(pan, t('Il Sole sta a R₀ ≈ 8,2 kpc dal centro galattico (misura diretta dalle orbite delle stelle attorno a Sgr A*, GRAVITY 2019), circa 20 pc sopra il piano, e gira a v₀ ≈ 230 km/s: un giro in 2πR₀/v₀ ≈ 220 milioni di anni (un «anno galattico»), mentre oscilla su e giù attraverso il disco ogni ~70–90 Myr. La Via Lattea è una spirale barrata (SBbc) di ~10¹¹ stelle; con l’alone la massa entro 200 kpc è ~10¹² M☉. Andromeda, a ~765 kpc, si avvicina a ~110 km/s: incontro previsto fra ~4–5 miliardi di anni. Le coordinate galattiche: l è la longitudine misurata dal centro (l = 0°) nel verso della rotazione (l = 90°), b la latitudine.',
      'The Sun lies R₀ ≈ 8.2 kpc from the Galactic centre (directly measured from stellar orbits around Sgr A*, GRAVITY 2019), about 20 pc above the plane, and moves at v₀ ≈ 230 km/s: one turn in 2πR₀/v₀ ≈ 220 million years (a «galactic year»), while it bobs up and down through the disc every ~70–90 Myr. The Milky Way is a barred spiral (SBbc) of ~10¹¹ stars; with the halo the mass within 200 kpc is ~10¹² M☉. Andromeda, at ~765 kpc, approaches at ~110 km/s: an encounter is expected in ~4–5 billion years. Galactic coordinates: l is the longitude from the centre (l = 0°) towards the rotation (l = 90°), b the latitude.'));
    S.sc.add(fondoStelle(T, 3000, 5000, 3));
    var vl = null, sole = null, orbitaSole = null, oggetti = [], fv = function (R) { return curva(R).vt; };
    function scala(p) {
      var r = Math.hypot(p[0], p[1], p[2]); if (!st.log || r <= 25) return p;
      var f = (25 + 40 * Math.log10(r / 25)) / r; return [p[0] * f, p[1] * f, p[2] * f];
    }
    function costruisci() {
      S.pulisci(); oggetti = [];
      vl = galassia3D(T, generaGalassia('SBb', 30000, 1977, { Rd: 2.6 }), fv); S.aggiungi(vl);
      vl.uniformi('uPx', pxScala(S)); vl.uniformi('uT', st.t); vl.uniformi('uOmP', 30 * OM_MYR);
      /* l'orbita del Sole e il Sole */
      var pts = []; for (var i = 0; i <= 128; i++) { var a = 2 * Math.PI * i / 128; pts.push([SOLE.R0 * Math.cos(a), SOLE.R0 * Math.sin(a), 0]); }
      orbitaSole = L3().linea(T, pts, 0xffd24a, 0.6); S.aggiungi(orbitaSole);
      sole = sprite(T, 0xffe27a, 2.2); S.aggiungi(sole);
      if (st.etich) { var es = L3().testo3d(T, t('Sole', 'Sun'), '#ffd24a', 1.1); es.name = 'etSole'; S.aggiungi(es); }
      var cG = sprite(T, 0xfff0d0, 2.5); S.aggiungi(cG);
      if (st.etich) { var ec = L3().testo3d(T, 'Sgr A*', '#ffe9c4', 0.9); ec.position.set(0, 0, 1.5); S.aggiungi(ec); }
      /* cerchi di distanza nel piano */
      [50, 100, 250, 500, 1000].forEach(function (d) {
        var p = []; for (var i = 0; i <= 160; i++) { var a = 2 * Math.PI * i / 160; p.push(scala([d * Math.cos(a), d * Math.sin(a), 0])); }
        S.aggiungi(L3().linea(T, p, 0x2a4a6e, 0.55));
        if (st.etich) { var e = L3().testo3d(T, d + ' kpc', '#6f88a6', st.log ? 2.2 : 18); e.position.set.apply(e.position, scala([d * 0.71, -d * 0.71, 0])); S.aggiungi(e); }
      });
      var righe = [];
      GRUPPO.forEach(function (g, k) {
        var p = galattocentriche(g[2], g[3], g[4]), q = scala(p), dGC = Math.hypot(p[0], p[1], p[2]);
        righe.push([F.tt(g[1]), g[4], dGC, g[5]]);
        var col = g[5] === 'dSph' ? 0xc9d3df : g[5].charAt(0) === 'E' || g[5] === 'dE' ? 0xffc690 : 0x9fd7ff;
        if (g[6] === 'grande') {
          var tipo = g[5] === 'Irr' ? 'Irr' : g[5], gx = generaGalassia(tipo, g[0] === 'M31' ? 9000 : 4000, 50 + k, {}), gg = galassia3D(T, gx, function (R) { return (g[0] === 'M31' ? 250 : g[5] === 'Irr' ? 80 : 120) * (1 - Math.exp(-R / 2)); });
          var dim = st.log ? (g[0] === 'M31' ? 0.45 : g[0] === 'M33' ? 0.3 : 0.38) : (g[0] === 'M31' ? 1.4 : g[0] === 'M33' ? 0.6 : g[0] === 'LMC' ? 0.45 : 0.3);
          gg.scale.set(dim, dim, dim); gg.position.set(q[0], q[1], q[2]); gg.rotation.set(0.9 + k, 0.4 * k, 0.7 * k);
          gg.uniformi('uPx', pxScala(S) * dim); gg.uniformi('uOmP', 20 * OM_MYR);
          S.aggiungi(gg); oggetti.push(gg);
        } else { var sp = sprite(T, col, st.log ? 2.6 : 14, 0.9); sp.position.set(q[0], q[1], q[2]); S.aggiungi(sp); }
        if (st.linee) S.aggiungi(L3().linea(T, [[0, 0, 0], q], 0x34465f, 0.35));
        if (st.etich && (g[6] === 'grande' || g[4] < 300 || g[0] === 'NGC 6822' || g[0] === 'WLM' || g[0] === 'IC 1613')) { var et = L3().testo3d(T, g[0], '#cfe3f7', st.log ? 1.8 : 14); et.position.set(q[0], q[1], q[2] + (st.log ? 2.6 : 22)); S.aggiungi(et); }
      });
      righe.sort(function (a, b) { return a[1] - b[1]; });
      tab.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('Galassia', 'Galaxy') + '</th><th>d☉ (kpc)</th><th>d_GC</th><th>' + t('tipo', 'type') + '</th></tr>' + righe.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + Math.round(r[2]) + '</td><td>' + r[3] + '</td></tr>'; }).join('') + '</table>';
      var T0 = periodoOrbitaSole(SOLE.R0, SOLE.v0);
      info.innerHTML = t('Sole: R₀ = ', 'Sun: R₀ = ') + SOLE.R0 + ' kpc, v₀ = ' + SOLE.v0 + ' km/s, ' + t('periodo ', 'period ') + '<b>' + Math.round(T0) + ' Myr</b>. ' + t('Andromeda dista ', 'Andromeda is ') + Math.round(Math.hypot.apply(null, galattocentriche(121.17, -21.57, 765))) + t(' kpc dal centro galattico; la Grande Nube ', ' kpc from the Galactic centre; the LMC ') + Math.round(Math.hypot.apply(null, galattocentriche(280.5, -32.9, 50))) + ' kpc. ' + (st.log ? t('Oltre 25 kpc la distanza è compressa in scala logaritmica (25 + 40 log₁₀(r/25)); i cerchi segnano 50–1000 kpc.', 'Beyond 25 kpc distance is compressed logarithmically (25 + 40 log₁₀(r/25)); the circles mark 50–1000 kpc.') : t('Scala lineare: la Via Lattea (30 kpc) è un puntino rispetto ad Andromeda a 765 kpc.', 'Linear scale: the Milky Way (30 kpc) is a dot compared with Andromeda at 765 kpc.'));
      S.didascalia.textContent = t('Via Lattea e Gruppo Locale in 3D', 'Milky Way and Local Group in 3D');
      posSole();
    }
    function posSole() {
      var Om = SOLE.v0 / SOLE.R0 * OM_MYR, a = Math.PI + Om * st.t, z = SOLE.z0 + 0.08 * Math.sin(2 * Math.PI * st.t / 80);
      sole.position.set(SOLE.R0 * Math.cos(a), SOLE.R0 * Math.sin(a), z);
      S.radice.children.forEach(function (o) { if (o.name === 'etSole') o.position.set(SOLE.R0 * Math.cos(a), SOLE.R0 * Math.sin(a), z + 1.6); });
    }
    costruisci();
    st.sveglia = function () { S.avvia(); };
    S.ogniFotogramma(function (dt) {
      if (vl) vl.uniformi('uPx', pxScala(S));
      if (st.pausa) return false;
      st.t += dt * 10 * st.vel;
      vl.uniformi('uT', st.t); oggetti.forEach(function (g) { g.uniformi('uT', st.t); });
      posSole();
      ctl.tempo('t = ' + Math.round(st.t) + ' Myr');
      return true;
    });
    S.inquadra(190, -0.6, 1.0);
  }

  F.sezione('sastrogal', {
    titolo: ['🌌 Galassie 3D', '🌌 Galaxies 3D'],
    sotto: ['Galassie di decine di migliaia di stelle in tre dimensioni: la sequenza di Hubble con i bracci come onde di densità, le curve di rotazione e la materia oscura, le collisioni con le code mareali, la Via Lattea e il Gruppo Locale. Si ruota con il dito o il mouse, si ingrandisce con due dita o la rotellina.', 'Galaxies of tens of thousands of stars in three dimensions: the Hubble sequence with arms as density waves, rotation curves and dark matter, collisions with tidal tails, the Milky Way and the Local Group. Rotate with a finger or the mouse, zoom with two fingers or the wheel.'],
    schede: [
      { nome: ['🌀 Tipi di Hubble', '🌀 Hubble types'], costruisci: scheda(schedaTipi) },
      { nome: ['📈 Curve di rotazione', '📈 Rotation curves'], costruisci: scheda(schedaCurve) },
      { nome: ['💥 Collisione', '💥 Collision'], costruisci: scheda(schedaCollisione) },
      { nome: ['🗺️ Gruppo Locale', '🗺️ Local Group'], costruisci: scheda(schedaGruppo) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
