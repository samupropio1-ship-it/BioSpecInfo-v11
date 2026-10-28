/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-orbite.js — 🛰️ Meccanica orbitale 3D
   BioSpecInfo · © Samuele Pio Provenzano

   La meccanica del volo spaziale, in tre dimensioni. La sezione di
   astrofisica (bsi-fis-astro.js) ha gia' un trasferimento di Hohmann
   Terra–Marte nel piano; qui ci sono gli strumenti veri del mestiere:

   · ELEMENTI ↔ STATO: i sei elementi kepleriani (a, e, i, Ω, ω, ν) e il
     vettore di stato (r, v) si trasformano l'uno nell'altro; l'orbita e'
     disegnata in 3D con il piano equatoriale, la linea dei nodi, il
     pericentro, gli archi di Ω, i, ω e ν, i vettori r, v, h ed e;
   · MANOVRE: Hohmann e bi-ellittica (Δv, tempi; la bi-ellittica conviene
     oltre r₂/r₁ = 11,94, e per qualunque r_b oltre 15,58), il costo del
     cambio di piano e la manovra combinata, con un veicolo che vola;
   · SATELLITI TERRESTRI: LEO (ISS), GPS, geostazionario, Molniya,
     eliosincrono, con la precessione dei nodi dovuta a J₂ (lo
     schiacciamento terrestre); la traccia al suolo su una carta e
     l'orbita attorno a una Terra che ruota;
   · IL PROBLEMA DI LAMBERT: da r₁ a r₂ in un tempo dato (variabili
     universali, funzioni di Stumpff); il diagramma «porkchop» del Δv per
     Terra → Marte in funzione della data di partenza e della durata.

   I calcoli stanno in F.calcolo.orbite (provati in
   tools/banchi/verifiche/verifica-sastroorbite.js); il disegno usa il
   motore 3D del Laboratorio 3D e, se c'e', le tessiture del Sistema solare 3D.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, D = globale.document;
  var GRAD = Math.PI / 180, MU = 398600.4418, RT = 6378.137, J2 = 1.08262668e-3, GSID = 86164.0905, OMT = 2 * Math.PI / 86164.0905;
  var KG = 0.01720209895, MU_S_UA = KG * KG, UA = 149597870.7, UAG_KMS = UA / 86400, J2000 = 2451545.0;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norma(a) { return Math.sqrt(dot(a, a)); }
  function ang2pi(x) { x = x % (2 * Math.PI); return x < 0 ? x + 2 * Math.PI : x; }

  function kepleroE(M, e) {
    M = ang2pi(M); var E = e < 0.8 ? M : Math.PI;
    for (var i = 0; i < 60; i++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-15) break; }
    return E;
  }
  function kepleroH(M, e) { /* M = e sinh H − H */
    var H = Math.asinh(M / e);
    for (var i = 0; i < 80; i++) { var d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1); H -= d; if (Math.abs(d) < 1e-15) break; }
    return H;
  }
  function anomaliaVera(M, e) {
    if (e < 1) { var E = kepleroE(M, e); return ang2pi(2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))); }
    var H = kepleroH(M, e); return 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(H / 2));
  }
  function anomaliaMedia(nu, e) {
    if (e < 1) { var E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2)); return ang2pi(E - e * Math.sin(E)); }
    var H = 2 * Math.atanh(Math.sqrt((e - 1) / (e + 1)) * Math.tan(nu / 2)); return e * Math.sinh(H) - H;
  }
  /* la matrice perifocale → riferimento: R_z(Ω) R_x(i) R_z(ω) */
  function matricePQW(O, i, w) {
    var cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(i), si = Math.sin(i), cw = Math.cos(w), sw = Math.sin(w);
    return [[cO * cw - sO * sw * ci, -cO * sw - sO * cw * ci, sO * si], [sO * cw + cO * sw * ci, -sO * sw + cO * cw * ci, -cO * si], [sw * si, cw * si, ci]];
  }
  function applica(R, v) { return [R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2], R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2], R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2]]; }
  /* elementi → stato. el = {a, e, i, O, w, nu} (radianti; a < 0 per l'iperbole) */
  function elementiStato(el, mu) {
    mu = mu || MU; var p = el.a * (1 - el.e * el.e), c = Math.cos(el.nu), s = Math.sin(el.nu), r = p / (1 + el.e * c), k = Math.sqrt(mu / p);
    var R = matricePQW(el.O, el.i, el.w);
    return { r: applica(R, [r * c, r * s, 0]), v: applica(R, [-k * s, k * (el.e + c), 0]) };
  }
  /* stato → elementi, con i casi degeneri (orbita equatoriale: Ω = 0 e ω dalla
     longitudine del pericentro; orbita circolare: ω = 0 e ν = argomento della latitudine) */
  function statoElementi(r, v, mu) {
    mu = mu || MU;
    var R = norma(r), V = norma(v), h = cross(r, v), H = norma(h), n = cross([0, 0, 1], h), N = norma(n), vr = dot(r, v) / R;
    var ev = mul(sub(mul(r, V * V - mu / R), mul(v, R * vr)), 1 / mu), e = norma(ev), en = V * V / 2 - mu / R;
    var a = Math.abs(1 - e) > 1e-12 ? -mu / (2 * en) : Infinity, i = Math.acos(Math.max(-1, Math.min(1, h[2] / H)));
    var EPS = 1e-11, O, w, nu;
    O = N > EPS * H ? ang2pi(Math.atan2(n[1], n[0])) : 0;
    var nh = N > EPS * H ? mul(n, 1 / N) : [1, 0, 0];
    var m = cross(mul(h, 1 / H), nh);
    if (e > EPS) {
      w = ang2pi(Math.atan2(dot(ev, m), dot(ev, nh)));
      var eh = mul(ev, 1 / e), q = cross(mul(h, 1 / H), eh);
      nu = ang2pi(Math.atan2(dot(r, q), dot(r, eh)));
    } else { w = 0; nu = ang2pi(Math.atan2(dot(r, m), dot(r, nh))); }
    return { a: a, e: e, i: i, O: O, w: w, nu: nu, h: H, p: H * H / mu, energia: en, ev: ev, hv: h };
  }
  function visViva(r, a, mu) { return Math.sqrt((mu || MU) * (2 / r - 1 / a)); }
  function periodo(a, mu) { return 2 * Math.PI * Math.sqrt(a * a * a / (mu || MU)); }

  /* ── funzioni di Stumpff e propagazione con le variabili universali (Curtis, alg. 3.3–3.4) ── */
  function stC(z) { if (z > 1e-3) { var s = Math.sqrt(z); return (1 - Math.cos(s)) / z; } if (z < -1e-3) { var q = Math.sqrt(-z); return (Math.cosh(q) - 1) / -z; } return 1 / 2 - z / 24 + z * z / 720 - z * z * z / 40320; }
  function stS(z) { if (z > 1e-3) { var s = Math.sqrt(z); return (s - Math.sin(s)) / (s * s * s); } if (z < -1e-3) { var q = Math.sqrt(-z); return (Math.sinh(q) - q) / (q * q * q); } return 1 / 6 - z / 120 + z * z / 5040 - z * z * z / 362880; }
  function propaga(r0, v0, dt, mu) {
    mu = mu || MU; var sm = Math.sqrt(mu), R0 = norma(r0), V0 = norma(v0), vr0 = dot(r0, v0) / R0, al = 2 / R0 - V0 * V0 / mu;
    var x = sm * Math.abs(al) * dt;
    if (!(Math.abs(al) > 1e-12)) x = sm * dt / R0;
    if (al < 0) { /* iperbole: stima iniziale di Vallado */ var a = 1 / al; x = Math.sign(dt) * Math.sqrt(-a) * Math.log(Math.max(1e-12, -2 * mu * al * dt / (dot(r0, v0) + Math.sign(dt) * Math.sqrt(-mu * a) * (1 - R0 * al)))); }
    /* F(χ) e' strettamente crescente (F' = r > 0): Newton dentro un intervallo che contiene
       la radice, con bisezione se il passo esce (le orbite quasi paraboliche altrimenti divergono) */
    function Fx(x) { var z = al * x * x; return R0 * vr0 / sm * x * x * stC(z) + (1 - al * R0) * x * x * x * stS(z) + R0 * x - sm * dt; }
    if (al > 1e-12) { var Tp = 2 * Math.PI / Math.sqrt(mu * al * al * al); if (Math.abs(dt) > Tp) { var giri = Math.trunc(dt / Tp); dt -= giri * Tp; } x = sm * al * dt; }
    if (!isFinite(x)) x = 0;
    var lo = x, hi = x, passo = Math.max(1e-3, Math.abs(x) * 0.5 + 1e-3);
    while (Fx(lo) > 0) { lo -= passo; passo *= 2; }
    passo = Math.max(1e-3, Math.abs(x) * 0.5 + 1e-3);
    while (Fx(hi) < 0) { hi += passo; passo *= 2; }
    x = Math.min(hi, Math.max(lo, x));
    for (var k = 0; k < 200; k++) {
      var z = al * x * x, C = stC(z), S = stS(z);
      var f0 = R0 * vr0 / sm * x * x * C + (1 - al * R0) * x * x * x * S + R0 * x - sm * dt;
      if (f0 > 0) hi = x; else lo = x;
      var dF = R0 * vr0 / sm * x * (1 - al * x * x * S) + (1 - al * R0) * x * x * C + R0;
      var xn = x - f0 / dF;
      if (!(xn > lo && xn < hi)) xn = (lo + hi) / 2;
      if (Math.abs(xn - x) < 1e-13 * Math.max(1, Math.abs(x))) { x = xn; break; }
      x = xn;
    }
    var z2 = al * x * x, C2 = stC(z2), S2 = stS(z2), f = 1 - x * x / R0 * C2, g = dt - x * x * x / sm * S2;
    var r = add(mul(r0, f), mul(v0, g)), R = norma(r), fd = sm / (R * R0) * (al * x * x * x * S2 - x), gd = 1 - x * x / R * C2;
    return { r: r, v: add(mul(r0, fd), mul(v0, gd)) };
  }
  /* propagazione con gli elementi (secondo metodo indipendente: Keplero classico) */
  function propagaElementi(r0, v0, dt, mu) {
    var el = statoElementi(r0, v0, mu), n = Math.sqrt((mu || MU) / Math.pow(Math.abs(el.a), 3)), M = anomaliaMedia(el.nu, el.e) + n * dt;
    el.nu = anomaliaVera(M, el.e); return elementiStato(el, mu);
  }

  /* ── il problema di Lambert (variabili universali, Curtis alg. 5.2) ──
     Si cerca z tale che il tempo di volo F(z) coincida con dt; F e' crescente in z,
     quindi bisezione garantita fra il limite iperbolico (y > 0) e 4π² (un giro) */
  function lambert(r1, r2, dt, mu, retrogrado) {
    mu = mu || MU; var R1 = norma(r1), R2 = norma(r2), c12 = cross(r1, r2), cth = Math.max(-1, Math.min(1, dot(r1, r2) / (R1 * R2))), dth = Math.acos(cth);
    if (retrogrado ? c12[2] >= 0 : c12[2] < 0) dth = 2 * Math.PI - dth;
    var A = Math.sin(dth) * Math.sqrt(R1 * R2 / (1 - cth));
    function y(z) { return R1 + R2 + A * (z * stS(z) - 1) / Math.sqrt(stC(z)); }
    function tempo(z) { var Y = y(z); if (Y < 0) return -Infinity; return (Math.pow(Y / stC(z), 1.5) * stS(z) + A * Math.sqrt(Y)) / Math.sqrt(mu); }
    var lo = -4 * Math.PI * Math.PI, hi = 4 * Math.PI * Math.PI * (1 - 1e-12);
    while (tempo(lo) > dt && lo > -1e6) lo *= 2;
    /* dove y(z) < 0 il tempo vale −∞: la bisezione lo tratta come «troppo corto» */
    for (var k = 0; k < 200; k++) { var m = (lo + hi) / 2, tm = tempo(m); if (tm > dt) hi = m; else lo = m; if (hi - lo < 1e-14 * Math.max(1, Math.abs(m))) break; }
    var z = (lo + hi) / 2, Y = y(z), f = 1 - Y / R1, gg = A * Math.sqrt(Y / mu), gd = 1 - Y / R2;
    return { v1: mul(sub(r2, mul(r1, f)), 1 / gg), v2: mul(sub(mul(r2, gd), r1), 1 / gg), z: z, dth: dth };
  }

  /* ── manovre ── */
  function hohmann(r1, r2, mu) {
    mu = mu || MU; var at = (r1 + r2) / 2, v1 = Math.sqrt(mu / r1), v2 = Math.sqrt(mu / r2), vp = visViva(r1, at, mu), va = visViva(r2, at, mu);
    return { dv1: Math.abs(vp - v1), dv2: Math.abs(v2 - va), tot: Math.abs(vp - v1) + Math.abs(v2 - va), tempo: periodo(at, mu) / 2, at: at, v1: v1, v2: v2, vp: vp, va: va };
  }
  function bielliptica(r1, r2, rb, mu) {
    mu = mu || MU; var a1 = (r1 + rb) / 2, a2 = (r2 + rb) / 2, v1 = Math.sqrt(mu / r1), v2 = Math.sqrt(mu / r2);
    var dv1 = visViva(r1, a1, mu) - v1, dv2 = Math.abs(visViva(rb, a2, mu) - visViva(rb, a1, mu)), dv3 = Math.abs(visViva(r2, a2, mu) - v2);
    return { dv1: dv1, dv2: dv2, dv3: dv3, tot: dv1 + dv2 + dv3, tempo: periodo(a1, mu) / 2 + periodo(a2, mu) / 2, a1: a1, a2: a2 };
  }
  /* in unita' di v₁: la bi-ellittica con r_b → ∞ costa (√2 − 1)(1 + 1/√R) */
  function hohmannRel(R) { return Math.sqrt(2 * R / (1 + R)) - 1 + 1 / Math.sqrt(R) - Math.sqrt(2 / (R * (1 + R))); }
  function biellitticaInf(R) { return (Math.SQRT2 - 1) * (1 + 1 / Math.sqrt(R)); }
  function bisezione(f, a, b) { var fa = f(a); for (var k = 0; k < 200; k++) { var m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
  function sogliaBiellittica() { return bisezione(function (R) { return hohmannRel(R) - biellitticaInf(R); }, 5, 30); }
  /* la seconda soglia: oltre R = 15,58 la bi-ellittica conviene per ogni r_b > r₂
     (la derivata del costo rispetto a r_b in r_b = r₂ diventa negativa) */
  function sogliaOgniRb() { return bisezione(function (R) { var h = 1e-6 * R; return (bielliptica(1, R, R + h, 1).tot - bielliptica(1, R, R, 1).tot) / h; }, 11, 30); }
  function cambioPiano(v, di) { return 2 * v * Math.sin(di / 2); }
  function combinata(va, vb, di) { return Math.sqrt(va * va + vb * vb - 2 * va * vb * Math.cos(di)); }

  /* ── satelliti terrestri: J₂ e traccia al suolo ── */
  function tassiJ2(a, e, i) {
    var n = Math.sqrt(MU / (a * a * a)), p = a * (1 - e * e), k = 1.5 * n * J2 * (RT / p) * (RT / p);
    return { n: n, Odot: -k * Math.cos(i), wdot: k * (2 - 2.5 * Math.sin(i) * Math.sin(i)), Mdot: k * Math.sqrt(1 - e * e) * (1.5 * Math.cos(i) * Math.cos(i) - 0.5) };
  }
  var OMEGA_SOLE = 2 * Math.PI / (365.2421897 * 86400);
  function inclinazioneEliosincrona(a, e) { var n = Math.sqrt(MU / (a * a * a)), p = a * (1 - (e || 0) * (e || 0)), c = -OMEGA_SOLE / (1.5 * n * J2 * (RT / p) * (RT / p)); return Math.acos(c); }
  function inclinazioneCritica() { return Math.asin(Math.sqrt(0.8)); }
  function raggioGEO() { return Math.cbrt(MU * GSID * GSID / (4 * Math.PI * Math.PI)); }
  function gmst(jd) { var T = (jd - J2000) / 36525; return ang2pi((280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * T * T - T * T * T / 38710000) * GRAD); }
  /* stato del satellite al tempo t (s) dall'epoca, con le derive secolari di J₂ se richieste */
  function satellite(el, ts, conJ2) {
    var r = conJ2 ? tassiJ2(el.a, el.e, el.i) : { n: Math.sqrt(MU / Math.pow(el.a, 3)), Odot: 0, wdot: 0, Mdot: 0 };
    var M = (el.M0 || 0) + (r.n + r.Mdot) * ts, nu = anomaliaVera(M, el.e);
    return elementiStato({ a: el.a, e: el.e, i: el.i, O: el.O + r.Odot * ts, w: el.w + r.wdot * ts, nu: nu });
  }
  function latLon(r, theta) { var R = norma(r), lon = Math.atan2(r[1], r[0]) - theta; lon = ang2pi(lon + Math.PI) - Math.PI; return [Math.asin(r[2] / R) / GRAD, lon / GRAD]; }
  function traccia(el, jd0, t0, t1, n, conJ2) {
    var out = [];
    for (var k = 0; k <= n; k++) { var ts = t0 + (t1 - t0) * k / n, s = satellite(el, ts, conJ2); out.push(latLon(s.r, gmst(jd0 + ts / 86400))); }
    return out;
  }
  var SATELLITI = {
    leo: { nome: ['LEO: Stazione Spaziale (420 km, 51,6°)', 'LEO: Space Station (420 km, 51.6°)'], a: RT + 420, e: 0.0005, i: 51.64, O: 30, w: 0 },
    sso: { nome: ['Eliosincrono (700 km)', 'Sun-synchronous (700 km)'], a: RT + 700, e: 0.001, i: null, O: 60, w: 90 },
    gps: { nome: ['MEO: GPS (20 200 km, 55°)', 'MEO: GPS (20 200 km, 55°)'], a: null, e: 0.005, i: 55, O: 120, w: 0 },
    molniya: { nome: ['Molniya (12 h, e = 0,74, 63,4°)', 'Molniya (12 h, e = 0.74, 63.4°)'], a: null, e: 0.74, i: null, O: 300, w: 270 },
    geo: { nome: ['Geostazionario (35 786 km)', 'Geostationary (35 786 km)'], a: null, e: 0, i: 0, O: 0, w: 0 }
  };
  SATELLITI.sso.i = inclinazioneEliosincrona(SATELLITI.sso.a, 0.001) / GRAD;
  SATELLITI.gps.a = Math.cbrt(MU * Math.pow(GSID / 2, 2) / (4 * Math.PI * Math.PI));
  SATELLITI.molniya.a = SATELLITI.gps.a; SATELLITI.molniya.i = inclinazioneCritica() / GRAD;
  SATELLITI.geo.a = raggioGEO();

  /* ── Terra → Marte su orbite circolari complanari ── */
  var R_TERRA = 1.00000261, R_MARTE = 1.52371034;
  function lonTerra(jd) { return (100.46457166 + 35999.37244981 * (jd - J2000) / 36525) * GRAD; }
  function lonMarte(jd) { return (-4.55343205 + 19140.30268499 * (jd - J2000) / 36525) * GRAD; }
  function pianetaCirc(R, lon) { var n = Math.sqrt(MU_S_UA / (R * R * R)); return { r: [R * Math.cos(lon), R * Math.sin(lon), 0], v: [-R * n * Math.sin(lon), R * n * Math.cos(lon), 0] }; }
  function trasferimentoMarte(jdP, tof) {
    var T = pianetaCirc(R_TERRA, lonTerra(jdP)), M = pianetaCirc(R_MARTE, lonMarte(jdP + tof)), L = lambert(T.r, M.r, tof, MU_S_UA);
    var d1 = norma(sub(L.v1, T.v)) * UAG_KMS, d2 = norma(sub(M.v, L.v2)) * UAG_KMS;
    return { dv1: d1, dv2: d2, tot: d1 + d2, C3: d1 * d1, T: T, M: M, L: L };
  }
  function porkchop(jd0, giorni, nP, tof0, tof1, nT) {
    var Z = [];
    for (var a = 0; a < nT; a++) { var riga = []; for (var b = 0; b < nP; b++) riga.push(trasferimentoMarte(jd0 + giorni * b / (nP - 1), tof0 + (tof1 - tof0) * a / (nT - 1)).tot); Z.push(riga); }
    return Z;
  }

  F.calcolo.orbite = {
    MU: MU, RT: RT, J2: J2, kepleroE: kepleroE, kepleroH: kepleroH, anomaliaVera: anomaliaVera, anomaliaMedia: anomaliaMedia,
    elementiStato: elementiStato, statoElementi: statoElementi, visViva: visViva, periodo: periodo, stC: stC, stS: stS, propaga: propaga, propagaElementi: propagaElementi,
    lambert: lambert, hohmann: hohmann, bielliptica: bielliptica, hohmannRel: hohmannRel, biellitticaInf: biellitticaInf, sogliaBiellittica: sogliaBiellittica, sogliaOgniRb: sogliaOgniRb,
    cambioPiano: cambioPiano, combinata: combinata, tassiJ2: tassiJ2, inclinazioneEliosincrona: inclinazioneEliosincrona, inclinazioneCritica: inclinazioneCritica, raggioGEO: raggioGEO,
    gmst: gmst, satellite: satellite, latLon: latLon, traccia: traccia, SATELLITI: SATELLITI, trasferimentoMarte: trasferimentoMarte, porkchop: porkchop, pianetaCirc: pianetaCirc, lonTerra: lonTerra, lonMarte: lonMarte,
    MU_S_UA: MU_S_UA, UAG_KMS: UAG_KMS
  };

  /* ═══ pezzi comuni del disegno ══════════════════════════════════════════ */
  function A3() { return globale.BSIAstro3D; }
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
        var S = new lab.Scena(destra, 0.68); S.cam.far = 5000; S.cam.updateProjectionMatrix();
        S.sc.children.forEach(function (o) { if (o.isHemisphereLight) o.intensity = 0.3; else if (o.isDirectionalLight) o.intensity = 0.12; });
        div._scena = S;
        costruisci(pan, S, destra);
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function casella(pan, et, val, cambia) {
    var c = F.el('input', { type: 'checkbox' }); c.checked = !!val;
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(et) })]));
    c.addEventListener('change', function () { cambia(c.checked); }); return c;
  }
  function v3(T, p) { return new T.Vector3(p[0], p[1], p[2]); }
  function linea(T, pts, col, opac) { return L3().linea(T, pts, col, opac); }
  function freccia(T, da, a, col, testa) { return L3().freccia(T, da, a, col, testa); }
  function etichetta(T, s, col, h) { var e = L3().testo3d(T, s, col || '#cfe3f7', h || 0.35); return e; }
  function stelle(T, n) { if (A3()) return A3().stelle(T, 2500, n); var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([], 3)); return new T.Points(g); }
  function terra(T, R, conNubi) {
    var g = new T.Group(), A = A3(), sfera;
    if (A) {
      sfera = new T.Mesh(A.geoSfera(T, 64), A.materiale(T, 'terra', 0x3a6ea8, { ruvido: 0.75 })); sfera.scale.setScalar(R); g.add(sfera);
      if (conNubi) { var nb = new T.Mesh(A.geoSfera(T, 48), A.materiale(T, 'nubi', 0xffffff, { trasparente: true })); nb.scale.setScalar(R * 1.012); sfera.add(nb); nb.scale.setScalar(1.012); }
      g.add(A.atmosfera(T, R * 1.05, 0x5fa8ff, 0.9));
    } else { sfera = new T.Mesh(new T.SphereGeometry(R, 48, 32), new T.MeshStandardMaterial({ color: 0x3a6ea8, roughness: 0.7 })); g.add(sfera); }
    g.userData.sfera = sfera; return g;
  }
  function cerchio(T, R, col, opac, n) { var pts = []; n = n || 128; for (var k = 0; k <= n; k++) { var a = 2 * Math.PI * k / n; pts.push([R * Math.cos(a), R * Math.sin(a), 0]); } return linea(T, pts, col, opac); }
  function arco(T, c, u, v, r, a0, a1, col) { var pts = [], n = 48; for (var k = 0; k <= n; k++) { var a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * (Math.cos(a) * u[0] + Math.sin(a) * v[0]), c[1] + r * (Math.cos(a) * u[1] + Math.sin(a) * v[1]), c[2] + r * (Math.cos(a) * u[2] + Math.sin(a) * v[2])]); } return linea(T, pts, col, 0.95); }
  function vett(v, cifre) { return '(' + v.map(function (x) { return x.toFixed(cifre == null ? 3 : cifre); }).join(', ') + ')'; }
  function scalaEt(e, cam, h) { if (A3()) A3().scalaEtichetta(e, cam, h); }
  function etS(T, s, col) { if (A3()) return A3().etichetta(T, s, col); var e = etichetta(T, s, col); e.userData.asp = e.scale.x / e.scale.y; return e; }

  /* ═══ 1. elementi ↔ stato ═══════════════════════════════════════════════ */
  function schedaElementi(pan, S, destra) {
    var T = S.T, st = { a: 2.2, e: 0.45, i: 50, O: 60, w: 40, nu: 70, anima: false };
    var cur = {};
    function cursore(k, et, min, max, passo, form) { cur[k] = F.cursore(pan, et, min, max, passo, st[k], function (v) { st[k] = v; aggiorna(); }, form); }
    cursore('a', ['a, semiasse maggiore (R⊕)', 'a, semi-major axis (R⊕)'], 1.1, 8, 0.01, function (v) { return v.toFixed(2) + ' R⊕ = ' + Math.round(v * RT).toLocaleString() + ' km'; });
    cursore('e', ['e, eccentricità', 'e, eccentricity'], 0, 0.9, 0.005, function (v) { return v.toFixed(3); });
    cursore('i', ['i, inclinazione (°)', 'i, inclination (°)'], 0, 180, 0.5, function (v) { return v + '°'; });
    cursore('O', ['Ω, longitudine del nodo ascendente (°)', 'Ω, right ascension of the ascending node (°)'], 0, 360, 1, function (v) { return v + '°'; });
    cursore('w', ['ω, argomento del pericentro (°)', 'ω, argument of periapsis (°)'], 0, 360, 1, function (v) { return v + '°'; });
    cursore('nu', ['ν, anomalia vera (°)', 'ν, true anomaly (°)'], 0, 360, 1, function (v) { return v + '°'; });
    casella(pan, ['Fai volare il satellite (legge delle aree)', 'Fly the satellite (law of areas)'], st.anima, function (v) { st.anima = v; S.avvia(); });
    var stato = nota(pan);
    /* l'inverso: si scrive r e v, si ottengono gli elementi */
    var campi = F.el('div', { style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin-top:8px' }), inp = [];
    ['rx (km)', 'ry (km)', 'rz (km)', 'vx (km/s)', 'vy (km/s)', 'vz (km/s)'].forEach(function (n) { var x = F.el('input', { type: 'number', step: 'any', 'aria-label': n, title: n, style: 'width:100%;min-width:0' }); inp.push(x); campi.appendChild(x); });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Oppure scrivi il vettore di stato (r in km, v in km/s):', 'Or type the state vector (r in km, v in km/s):') })); pan.appendChild(campi);
    F.bottone(pan, ['r, v → elementi', 'r, v → elements'], function () {
      var r = inp.slice(0, 3).map(function (x) { return +x.value; }), v = inp.slice(3).map(function (x) { return +x.value; });
      if (!r.concat(v).every(isFinite) || norma(r) < RT * 1.01) { esito.textContent = t('Serve r fuori dalla Terra (|r| > 6440 km).', 'r must be outside the Earth (|r| > 6440 km).'); return; }
      var el = statoElementi(r, v);
      if (!(el.e < 0.9) || !(el.a / RT > 1.1 && el.a / RT < 8)) { esito.textContent = t('Orbita fuori dai cursori: a = ', 'Orbit outside the sliders: a = ') + fmt(el.a) + ' km, e = ' + fmt(el.e) + t(' (servono e < 0,9 e 1,1 < a/R⊕ < 8).', ' (need e < 0.9 and 1.1 < a/R⊕ < 8).'); return; }
      st.a = el.a / RT; st.e = el.e; st.i = el.i / GRAD; st.O = el.O / GRAD; st.w = el.w / GRAD; st.nu = el.nu / GRAD;
      Object.keys(cur).forEach(function (k) { cur[k].value = st[k]; cur[k].dispatchEvent(new Event('input')); });
      esito.textContent = t('Elementi ricavati: a = ', 'Elements found: a = ') + fmt(el.a) + ' km, e = ' + el.e.toFixed(4) + ', i = ' + (el.i / GRAD).toFixed(2) + '°, Ω = ' + (el.O / GRAD).toFixed(2) + '°, ω = ' + (el.w / GRAD).toFixed(2) + '°, ν = ' + (el.nu / GRAD).toFixed(2) + '°';
    });
    var esito = nota(pan);
    nota(pan, t('Dagli elementi: p = a(1 − e²), r = p/(1 + e cos ν); nel piano perifocale r = r(cos ν, sin ν, 0), v = √(μ/p)(−sin ν, e + cos ν, 0); poi R_z(Ω)·R_x(i)·R_z(ω). Dallo stato: h = r × v, n = ẑ × h (linea dei nodi), e = [(v² − μ/r) r − (r·v) v]/μ, a = −μ/(2ε) con ε = v²/2 − μ/r; i = arccos(h_z/h), Ω = atan2(n_y, n_x), ω = angolo fra n ed e, ν = angolo fra e ed r. Se l’orbita è equatoriale Ω non è definito (si pone 0), se è circolare non lo è ω: sono i casi degeneri da trattare a parte.',
      'From the elements: p = a(1 − e²), r = p/(1 + e cos ν); in the perifocal plane r = r(cos ν, sin ν, 0), v = √(μ/p)(−sin ν, e + cos ν, 0); then R_z(Ω)·R_x(i)·R_z(ω). From the state: h = r × v, n = ẑ × h (node line), e = [(v² − μ/r) r − (r·v) v]/μ, a = −μ/(2ε) with ε = v²/2 − μ/r; i = arccos(h_z/h), Ω = atan2(n_y, n_x), ω = angle between n and e, ν = angle between e and r. For an equatorial orbit Ω is undefined (set to 0), for a circular one ω is: these degenerate cases need separate handling.'));

    S.aggiungi(stelle(T, 2500));
    S.aggiungi(new T.AmbientLight(0x6070a0, 0.5)); var luce = new T.DirectionalLight(0xffffff, 1.1); luce.position.set(30, -20, 15); S.aggiungi(luce);
    var Tg = terra(T, 1, true); S.aggiungi(Tg);
    var piano = new T.Mesh(new T.RingGeometry(1.02, 9.5, 96, 1), new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.06, side: T.DoubleSide, depthWrite: false })); S.aggiungi(piano);
    S.aggiungi(cerchio(T, 9.5, 0x5eead4, 0.35));
    S.aggiungi(freccia(T, [0, 0, 0], [10.5, 0, 0], 0x9fb1c6, 0.3)); var eg = etichetta(T, '♈ x', '#9fb1c6', 0.45); eg.position.set(11.1, 0, 0); S.aggiungi(eg);
    S.aggiungi(freccia(T, [0, 0, 0], [0, 0, 4], 0x9fb1c6, 0.25)); var ez = etichetta(T, 'z', '#9fb1c6', 0.45); ez.position.set(0, 0, 4.4); S.aggiungi(ez);
    var dinamici = new T.Group(); S.aggiungi(dinamici);
    var sat = new T.Mesh(new T.SphereGeometry(0.11, 20, 14), new T.MeshStandardMaterial({ color: 0xffd24a, emissive: 0xffd24a, emissiveIntensity: 0.5 })); S.aggiungi(sat);
    var cg = F.tela(destra, 0.34);
    function svuota(g) { while (g.children.length) { var o = g.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } }); } }
    function el() { return { a: st.a * RT, e: st.e, i: st.i * GRAD, O: st.O * GRAD, w: st.w * GRAD, nu: st.nu * GRAD }; }
    function aggiorna() {
      svuota(dinamici);
      var E = el(), s = elementiStato(E), back = statoElementi(s.r, s.v), a = st.a, e = st.e, p = a * (1 - e * e);
      var R = matricePQW(E.O, E.i, E.w), punti = [];
      for (var k = 0; k <= 256; k++) { var nu = 2 * Math.PI * k / 256, r = p / (1 + e * Math.cos(nu)); punti.push(applica(R, [r * Math.cos(nu), r * Math.sin(nu), 0])); }
      dinamici.add(linea(T, punti, 0xffd24a, 1));
      /* il piano dell'orbita */
      var tri = []; for (k = 0; k < 256; k++) tri.push(0, 0, 0, punti[k][0], punti[k][1], punti[k][2], punti[k + 1][0], punti[k + 1][1], punti[k + 1][2]);
      var gp = new T.BufferGeometry(); gp.setAttribute('position', new T.Float32BufferAttribute(tri, 3));
      dinamici.add(new T.Mesh(gp, new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.07, side: T.DoubleSide, depthWrite: false })));
      var nh = [Math.cos(E.O), Math.sin(E.O), 0], hh = [Math.sin(E.i) * Math.sin(E.O), -Math.sin(E.i) * Math.cos(E.O), Math.cos(E.i)], mh = cross(hh, nh), eeq = [-Math.sin(E.O), Math.cos(E.O), 0];
      var ph = applica(R, [1, 0, 0]), qh = applica(R, [0, 1, 0]);
      /* linea dei nodi, pericentro, archi */
      var Ln = Math.max(a * (1 + e), 3) * 1.1;
      dinamici.add(linea(T, [mul(nh, -Ln), mul(nh, Ln)], 0xff8a80, 0.9));
      var na = etS(T, '☊', '#ff8a80'); na.position.set(nh[0] * Ln * 1.06, nh[1] * Ln * 1.06, 0.25); dinamici.add(na);
      var rp = a * (1 - e); dinamici.add(linea(T, [[0, 0, 0], mul(ph, rp)], 0x6bcfff, 0.9));
      var pm = new T.Mesh(new T.SphereGeometry(0.07, 12, 8), new T.MeshBasicMaterial({ color: 0x6bcfff })); pm.position.copy(v3(T, mul(ph, rp))); dinamici.add(pm);
      var pe = etS(T, t('pericentro', 'periapsis'), '#6bcfff'); pe.position.copy(v3(T, mul(ph, rp + 0.4))); dinamici.add(pe);
      if (e > 0.01) { var ap = etS(T, t('apocentro', 'apoapsis'), '#9fb1c6'); ap.position.copy(v3(T, mul(ph, -a * (1 + e) - 0.4))); dinamici.add(ap); }
      dinamici.add(arco(T, [0, 0, 0], [1, 0, 0], [0, 1, 0], 1.6, 0, E.O, 0xffd24a));
      var eO = etS(T, 'Ω', '#ffd24a'); eO.position.set(1.9 * Math.cos(E.O / 2), 1.9 * Math.sin(E.O / 2), 0.15); dinamici.add(eO);
      var ci = mul(nh, Math.min(Ln * 0.6, 2.6)); dinamici.add(arco(T, ci, eeq, [0, 0, 1], 0.9, 0, E.i, 0xc9a0ff));
      var ei = etS(T, 'i', '#c9a0ff'); ei.position.copy(v3(T, add(ci, add(mul(eeq, 1.15 * Math.cos(E.i / 2)), mul([0, 0, 1], 1.15 * Math.sin(E.i / 2)))))); dinamici.add(ei);
      dinamici.add(linea(T, [ci, add(ci, mul(eeq, 1.2))], 0xc9a0ff, 0.5));
      dinamici.add(arco(T, [0, 0, 0], nh, mh, 1.25, 0, E.w, 0x6bcfff));
      var ew = etS(T, 'ω', '#6bcfff'); ew.position.copy(v3(T, add(mul(nh, 1.5 * Math.cos(E.w / 2)), mul(mh, 1.5 * Math.sin(E.w / 2))))); dinamici.add(ew);
      dinamici.add(arco(T, [0, 0, 0], ph, qh, 0.95, 0, E.nu, 0x5eead4));
      /* vettori r, v, h, e */
      var r = mul(s.r, 1 / RT), vsc = 0.35;
      dinamici.add(freccia(T, [0, 0, 0], r, 0x5eead4, 0.22));
      dinamici.add(freccia(T, r, add(r, mul(s.v, vsc)), 0xff8a80, 0.2));
      var hv = mul(hh, 2.2); dinamici.add(freccia(T, [0, 0, 0], hv, 0xe6fffb, 0.2)); var eh = etS(T, 'h', '#e6fffb'); eh.position.copy(v3(T, mul(hh, 2.5))); dinamici.add(eh);
      if (e > 0.02) { dinamici.add(freccia(T, [0, 0, 0], mul(ph, 3 * e + 0.3), 0x6bcfff, 0.18)); }
      sat.position.copy(v3(T, r));
      dinamici.traverse(function (o) { if (o.isSprite && !o.userData.asp) o.userData.asp = o.scale.x / o.scale.y; });
      var R0 = norma(s.r), V0 = norma(s.v), errA = Math.abs(back.a - E.a) / E.a, dang = function (x, y) { var d = Math.abs(ang2pi(x) - ang2pi(y)); return Math.min(d, 2 * Math.PI - d); };
      var errAng = Math.max(dang(back.i, E.i), dang(back.O, E.O), dang(back.w, E.w), dang(back.nu, E.nu)) / GRAD;
      stato.innerHTML = '<b>r</b> = ' + vett(s.r, 1) + ' km, |r| = ' + fmt(R0) + ' km<br><b>v</b> = ' + vett(s.v, 4) + ' km/s, |v| = ' + V0.toFixed(4) + ' km/s<br>' +
        t('vis-viva √(μ(2/r − 1/a)) = ', 'vis-viva √(μ(2/r − 1/a)) = ') + visViva(R0, E.a).toFixed(4) + ' km/s · h = ' + fmt(back.h) + ' km²/s<br>' +
        t('Periodo ', 'Period ') + fmt(periodo(E.a) / 60) + ' min · ' + t('altezza al pericentro ', 'periapsis altitude ') + fmt(E.a * (1 - e) - RT) + ' km' + (E.a * (1 - e) < RT ? ' <span class="bsiFX-ko">' + t('(sotto la superficie!)', '(below the surface!)') + '</span>' : '') + '<br>' +
        t('Andata e ritorno elementi → stato → elementi: |Δa|/a = ', 'Round trip elements → state → elements: |Δa|/a = ') + errA.toExponential(1) + t(', angoli entro ', ', angles within ') + errAng.toExponential(1) + '°';
      inp.forEach(function (x, k) { if (D.activeElement !== x) x.value = (k < 3 ? s.r[k].toFixed(3) : s.v[k - 3].toFixed(6)); });
      S.didascalia.textContent = 'a = ' + Math.round(E.a) + ' km, e = ' + e.toFixed(3) + ', i = ' + st.i + '°, Ω = ' + st.O + '°, ω = ' + st.w + '°, ν = ' + Math.round(st.nu) + '°';
      /* grafico: r(ν) e v(ν) lungo l'orbita */
      var nus = [], rs = [], vs = [];
      for (k = 0; k <= 180; k++) { var nn = 2 * Math.PI * k / 180, rr = E.a * (1 - e * e) / (1 + e * Math.cos(nn)); nus.push(k * 2); rs.push(rr / RT); vs.push(visViva(rr, E.a)); }
      F.grafico(cg, { serie: [{ x: nus, y: rs, col: '#5eead4', etich: ['r (R⊕)', 'r (R⊕)'] }, { x: nus, y: vs, col: '#ff8a80', etich: ['v (km/s)', 'v (km/s)'] }], punti: [{ x: st.nu, y: R0 / RT, col: '#ffd24a', r: 5 }, { x: st.nu, y: V0, col: '#ffd24a', r: 5 }], xl: ['anomalia vera ν (°)', 'true anomaly ν (°)'], yl: ['r (R⊕) e v (km/s)', 'r (R⊕) and v (km/s)'], legenda: [{ col: '#5eead4', etich: ['r(ν) = p/(1 + e cos ν)', 'r(ν) = p/(1 + e cos ν)'] }, { col: '#ff8a80', etich: ['v(ν) dalla vis-viva', 'v(ν) from vis-viva'] }], descr: ['Distanza e velocità lungo l’orbita', 'Distance and speed along the orbit'] });
      S.sporca = true; S.avvia();
    }
    aggiorna();
    S.inquadra(17, -0.9, 1.05);
    var acc = 0;
    S.ogniFotogramma(function (dt) {
      dinamici.children.forEach(function (o) { if (o.isSprite && o.userData.asp) scalaEt(o, S.cam, 0.03); });
      if (!st.anima) return false;
      var E = el(), n = Math.sqrt(MU / Math.pow(E.a, 3)), M = anomaliaMedia(E.nu, E.e) + n * dt * 600;
      st.nu = anomaliaVera(M, E.e) / GRAD; acc += dt;
      if (acc > 0.05) { acc = 0; cur.nu.value = Math.round(st.nu); cur.nu.parentNode.querySelector('b').textContent = Math.round(st.nu) + '°'; aggiorna(); }
      return true;
    });
  }

  /* ═══ 2. manovre ════════════════════════════════════════════════════════ */
  function schedaManovre(pan, S, destra) {
    var T = S.T, st = { modo: 'hohmann', h1: 300, R: 6.31, rb: 2, di: 28.5 };
    F.scelta(pan, ['Manovra', 'Manoeuvre'], [['hohmann', 'Hohmann'], ['bi', t('Bi-ellittica', 'Bi-elliptic')], ['piano', t('Hohmann con cambio di piano', 'Hohmann with plane change')]], st.modo, function (v) { st.modo = v; vis(); costruisci(); });
    F.cursore(pan, ['quota iniziale (km)', 'initial altitude (km)'], 160, 2000, 10, st.h1, function (v) { st.h1 = v; costruisci(); });
    var cR = F.cursore(pan, ['r₂/r₁', 'r₂/r₁'], 0, 1.8, 0.005, Math.log10(st.R), function (v) { st.R = Math.pow(10, v); costruisci(); }, function (v) { return Math.pow(10, v).toFixed(2); });
    var bRb = F.el('div'); pan.appendChild(bRb);
    F.cursore(bRb, ['r_b/r₂ (apocentro intermedio)', 'r_b/r₂ (intermediate apoapsis)'], 1, 6, 0.05, st.rb, function (v) { st.rb = v; costruisci(); }, function (v) { return v.toFixed(2); });
    var bDi = F.el('div'); pan.appendChild(bDi);
    F.cursore(bDi, ['Δi, cambio di piano (°)', 'Δi, plane change (°)'], 0, 60, 0.5, st.di, function (v) { st.di = v; costruisci(); }, function (v) { return v + '°'; });
    F.bottone(pan, ['LEO → GEO', 'LEO → GEO'], function () { st.h1 = 300; cR.value = Math.log10(raggioGEO() / (RT + 300)); cR.dispatchEvent(new Event('input')); });
    var info = nota(pan), spiega = nota(pan);
    var cg = F.tela(destra, 0.4);
    function vis() { bRb.style.display = st.modo === 'bi' ? '' : 'none'; bDi.style.display = st.modo === 'piano' ? '' : 'none'; }
    vis();
    var corpo = null, fasi = [], tVis = 0, durata = 1, frecce = [], kS = 1;
    /* una fase: posizioni campionate nel tempo (Keplero) e la durata visiva */
    function fase(f, Treale, nome) { return { f: f, T: Treale, nome: nome }; }
    function costruisci() {
      S.pulisci(); frecce = [];
      S.aggiungi(stelle(T, 2500));
      S.aggiungi(new T.AmbientLight(0x6070a0, 0.5)); var luce = new T.DirectionalLight(0xffffff, 1.1); luce.position.set(30, -20, 15); S.aggiungi(luce);
      var r1 = RT + st.h1, r2 = r1 * st.R, rb = r2 * st.rb, rmax = st.modo === 'bi' ? rb : r2;
      kS = 9 / rmax; /* km → unita' di scena */
      var Rt = Math.max(RT * kS, 0.05); S.aggiungi(terra(T, Rt, false));
      var di = st.modo === 'piano' ? st.di * GRAD : 0, y2 = [0, Math.cos(di), Math.sin(di)];
      S.aggiungi(cerchio(T, r1 * kS, 0x5eead4, 0.8, 192));
      var c2 = []; for (var k = 0; k <= 192; k++) { var a = 2 * Math.PI * k / 192; c2.push([-r2 * kS * Math.cos(a), -r2 * kS * Math.sin(a) * y2[1], -r2 * kS * Math.sin(a) * y2[2]]); } S.aggiungi(linea(T, c2, 0xff8a80, 0.8));
      if (st.modo === 'piano') S.aggiungi(new T.Mesh(new T.RingGeometry(r1 * kS * 0.2, r2 * kS * 1.05, 96, 1), new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.05, side: T.DoubleSide, depthWrite: false })));
      /* le fasi del volo */
      fasi = []; var T1 = periodo(r1), T2 = periodo(r2), H = hohmann(r1, r2), B = bielliptica(r1, r2, rb);
      function semiEllisse(rp, ra, da, verso, piano) { /* da = angolo del pericentro, verso ±1 (dal pericentro all'apocentro o viceversa) */
        var a = (rp + ra) / 2, e = (ra - rp) / (ra + rp), n = Math.sqrt(MU / (a * a * a));
        return function (u) { var M = verso > 0 ? u * Math.PI : Math.PI + u * Math.PI, nu = anomaliaVera(M, e), r = a * (1 - e * e) / (1 + e * Math.cos(nu)), th = da + nu; void n; return piano ? [r * Math.cos(th), r * Math.sin(th) * piano[1], r * Math.sin(th) * piano[2]] : [r * Math.cos(th), r * Math.sin(th), 0]; };
      }
      fasi.push(fase(function (u) { var a = -Math.PI + u * Math.PI; return [r1 * Math.cos(a), r1 * Math.sin(a), 0]; }, T1 / 2, t('orbita iniziale', 'initial orbit')));
      if (st.modo === 'bi') {
        fasi.push(fase(semiEllisse(r1, rb, 0, 1), periodo(B.a1) / 2, t('prima ellisse', 'first ellipse')));
        fasi.push(fase(function (u) { var a = (r2 + rb) / 2, e = (rb - r2) / (rb + r2), nu = Math.PI + u * Math.PI, r = a * (1 - e * e) / (1 + e * Math.cos(nu)), th = nu; return [-r * Math.cos(th), -r * Math.sin(th), 0]; }, periodo(B.a2) / 2, t('seconda ellisse', 'second ellipse')));
        fasi.push(fase(function (u) { var a = u * Math.PI; return [r2 * Math.cos(a), r2 * Math.sin(a), 0]; }, T2 / 2, t('orbita finale', 'final orbit')));
      } else {
        fasi.push(fase(semiEllisse(r1, r2, 0, 1), H.tempo, t('ellisse di trasferimento', 'transfer ellipse')));
        fasi.push(fase(function (u) { var a = u * Math.PI; return [-r2 * Math.cos(a), -r2 * Math.sin(a) * y2[1], -r2 * Math.sin(a) * y2[2]]; }, T2 / 2, t('orbita finale', 'final orbit')));
      }
      /* le traiettorie di trasferimento disegnate */
      fasi.slice(1, fasi.length - 1).forEach(function (F0) { var pts = []; for (var k = 0; k <= 160; k++) pts.push(mul(F0.f(k / 160), kS)); S.aggiungi(linea(T, pts, 0xffd24a, 0.95)); });
      /* durate visive: 2 s + 2 s per decade del rapporto con il periodo iniziale */
      durata = 0; fasi.forEach(function (F0) { F0.dv = 1.5 + 1.6 * Math.log10(1 + F0.T / T1); F0.t0 = durata; durata += F0.dv; });
      corpo = new T.Mesh(new T.ConeGeometry(Math.max(0.06, Rt * 0.12), Math.max(0.18, Rt * 0.36), 12), new T.MeshStandardMaterial({ color: 0xe6fffb, emissive: 0x5eead4, emissiveIntensity: 0.4 })); S.aggiungi(corpo);
      /* le accensioni: frecce nella direzione del moto, lunghezza ∝ Δv */
      var accensioni = st.modo === 'bi' ? [B.dv1, B.dv2, B.dv3] : st.modo === 'piano' ? [H.dv1, combinata(H.va, H.v2, st.di * GRAD)] : [H.dv1, H.dv2];
      accensioni.forEach(function (dv, j) {
        var F0 = fasi[j + 1], p0 = F0.f(0), p1 = F0.f(0.002), dir = sub(p1, p0), L = norma(dir); dir = mul(dir, 1 / L);
        var fr = freccia(T, mul(p0, kS), add(mul(p0, kS), mul(dir, 0.6 + dv * 0.5)), 0xffd24a, 0.25); fr.visible = false; S.aggiungi(fr); frecce.push({ fr: fr, t: F0.t0 });
        var et = etS(T, 'Δv' + (j + 1) + ' = ' + dv.toFixed(3), '#ffd24a'); et.position.copy(v3(T, add(mul(p0, kS), [0, 0, 0.6]))); S.aggiungi(et); frecce[frecce.length - 1].et = et;
      });
      tVis = 0;
      testi(H, B, r1, r2, rb);
      grafico();
      S.inquadra(st.modo === 'piano' ? 20 : 21, -1.25, st.modo === 'piano' ? 1.15 : 0.75);
      S.ogniFotogramma(fot);
    }
    function fot(dt) {
      tVis = (tVis + dt) % (durata + 1);
      var tt = Math.min(tVis, durata - 1e-6), F0 = fasi[0];
      for (var k = 0; k < fasi.length; k++) if (tt >= fasi[k].t0) F0 = fasi[k];
      var u = (tt - F0.t0) / F0.dv, p = F0.f(Math.min(1, u)), q = F0.f(Math.min(1, u + 0.003)), d = sub(q, p);
      corpo.position.copy(v3(T, mul(p, kS)));
      if (norma(d) > 0) corpo.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v3(T, mul(d, 1 / norma(d))));
      frecce.forEach(function (f) { var vis = tVis >= f.t && tVis < f.t + 1.4; f.fr.visible = vis; f.et.visible = vis; if (vis) scalaEt(f.et, S.cam, 0.026); });
      S.didascalia.textContent = F0.nome + ' · ' + (st.modo === 'bi' ? t('bi-ellittica', 'bi-elliptic') : 'Hohmann') + ' · r₂/r₁ = ' + st.R.toFixed(2);
      return true;
    }
    function testi(H, B, r1, r2, rb) {
      var R = r2 / r1, h = '<table class="bsiFX-tab"><tr><th></th><th>Δv (km/s)</th></tr>', sB = sogliaBiellittica(), sO = sogliaOgniRb();
      if (st.modo === 'hohmann') h += '<tr><td>Δv₁ (' + t('al pericentro', 'at periapsis') + ')</td><td>' + H.dv1.toFixed(4) + '</td></tr><tr><td>Δv₂ (' + t('all’apocentro', 'at apoapsis') + ')</td><td>' + H.dv2.toFixed(4) + '</td></tr><tr><td><b>' + t('totale', 'total') + '</b></td><td><b>' + H.tot.toFixed(4) + '</b></td></tr></table>' + t('Tempo di volo ', 'Flight time ') + fmt(H.tempo / 3600) + ' h (' + t('mezzo periodo dell’ellisse con a = (r₁ + r₂)/2', 'half the period of the ellipse with a = (r₁ + r₂)/2') + ')';
      else if (st.modo === 'bi') h += '<tr><td>Δv₁</td><td>' + B.dv1.toFixed(4) + '</td></tr><tr><td>Δv₂ (r_b)</td><td>' + B.dv2.toFixed(4) + '</td></tr><tr><td>Δv₃</td><td>' + B.dv3.toFixed(4) + '</td></tr><tr><td><b>' + t('totale bi-ellittica', 'bi-elliptic total') + '</b></td><td><b>' + B.tot.toFixed(4) + '</b></td></tr><tr><td>' + t('Hohmann', 'Hohmann') + '</td><td>' + H.tot.toFixed(4) + '</td></tr></table>' + t('Tempo di volo ', 'Flight time ') + fmt(B.tempo / 3600) + ' h ' + t('contro ', 'versus ') + fmt(H.tempo / 3600) + ' h. ' + (B.tot < H.tot ? '<span class="bsiFX-ok">' + t('La bi-ellittica risparmia ', 'Bi-elliptic saves ') + fmt((H.tot - B.tot) * 1000) + ' m/s</span>' : t('Qui conviene Hohmann.', 'Here Hohmann wins.'));
      else { var dc = combinata(H.va, H.v2, st.di * GRAD), sep2 = H.dv2 + cambioPiano(H.v2, st.di * GRAD), sep1 = cambioPiano(H.v1, st.di * GRAD) + H.dv2; h += '<tr><td>Δv₁</td><td>' + H.dv1.toFixed(4) + '</td></tr><tr><td>' + t('Δv₂ combinata all’apocentro', 'Δv₂ combined at apoapsis') + '</td><td>' + dc.toFixed(4) + '</td></tr><tr><td><b>' + t('totale', 'total') + '</b></td><td><b>' + (H.dv1 + dc).toFixed(4) + '</b></td></tr><tr><td>' + t('cambio di piano separato su r₂', 'separate plane change on r₂') + '</td><td>' + (H.dv1 + sep2).toFixed(4) + '</td></tr><tr><td>' + t('cambio di piano su r₁ (in basso)', 'plane change on r₁ (low)') + '</td><td>' + (H.dv1 + sep1).toFixed(4) + '</td></tr></table>'; }
      info.innerHTML = 'r₁ = ' + fmt(r1) + ' km, r₂ = ' + fmt(r2) + ' km' + (st.modo === 'bi' ? ', r_b = ' + fmt(rb) + ' km' : '') + ' · R = r₂/r₁ = ' + R.toFixed(3) + '<br>' + h;
      spiega.innerHTML = st.modo === 'piano' ?
        t('Cambiare piano costa Δv = 2v sin(Δi/2): conviene farlo dove si va piano, cioè in alto, e insieme all’ultima accensione, perché i vettori si sommano: Δv = √(v_a² + v₂² − 2v_a v₂ cos Δi). Da Cape Canaveral (28,5°) all’orbita geostazionaria il cambio di piano combinato all’apogeo costa circa 1,8 km/s invece di 1,5.', 'Changing plane costs Δv = 2v sin(Δi/2): do it where you are slow, i.e. high up, and together with the last burn, because the vectors add: Δv = √(v_a² + v₂² − 2v_a v₂ cos Δi). From Cape Canaveral (28.5°) to geostationary orbit the combined plane change at apogee costs about 1.8 km/s instead of 1.5.') :
        t('In unità della velocità circolare v₁ il costo di Hohmann è √(2R/(1+R)) − 1 + 1/√R − √(2/(R(1+R))), quello della bi-ellittica con r_b → ∞ è (√2 − 1)(1 + 1/√R). Le due curve si incrociano a R = ', 'In units of the circular speed v₁ the Hohmann cost is √(2R/(1+R)) − 1 + 1/√R − √(2/(R(1+R))), the bi-elliptic one with r_b → ∞ is (√2 − 1)(1 + 1/√R). The curves cross at R = ') + '<b>' + sB.toFixed(4) + '</b>' + t('; oltre R = ', '; beyond R = ') + '<b>' + sO.toFixed(3) + '</b>' + t(' la bi-ellittica vince per qualunque r_b > r₂. Il prezzo è il tempo: la bi-ellittica sale molto in alto e impiega molto di più. Il massimo costo di Hohmann (0,536 v₁) è a R = 15,58.', ' the bi-elliptic wins for any r_b > r₂. The price is time: the bi-elliptic climbs very high and takes much longer. The maximum Hohmann cost (0.536 v₁) is at R = 15.58.');
    }
    function grafico() {
      if (st.modo === 'piano') {
        var r1 = RT + st.h1, H = hohmann(r1, r1 * st.R), xs = [], a = [], b = [], c = [];
        for (var d = 0; d <= 60; d += 1) { xs.push(d); a.push(H.dv1 + combinata(H.va, H.v2, d * GRAD)); b.push(H.dv1 + H.dv2 + cambioPiano(H.v2, d * GRAD)); c.push(H.dv1 + H.dv2 + cambioPiano(H.v1, d * GRAD)); }
        F.grafico(cg, { serie: [{ x: xs, y: a, col: '#5eead4', etich: ['combinata', 'combined'] }, { x: xs, y: b, col: '#ffd24a', tratt: true, etich: ['separata in alto', 'separate, high'] }, { x: xs, y: c, col: '#ff8a80', tratt: true, etich: ['separata in basso', 'separate, low'] }], punti: [{ x: st.di, y: H.dv1 + combinata(H.va, H.v2, st.di * GRAD), col: '#e6fffb', r: 5 }], xl: ['Δi (°)', 'Δi (°)'], yl: ['Δv totale (km/s)', 'total Δv (km/s)'], legenda: [{ col: '#5eead4', etich: ['combinata all’apocentro', 'combined at apoapsis'] }, { col: '#ffd24a', etich: ['separata su r₂', 'separate on r₂'] }, { col: '#ff8a80', etich: ['separata su r₁', 'separate on r₁'] }], descr: ['Costo del cambio di piano', 'Plane change cost'] });
        return;
      }
      var X = [], h = [], b2 = [], b5 = [], bi = [];
      for (var k = 0; k <= 200; k++) { var R = Math.pow(10, 2 * k / 200); X.push(Math.log10(R)); h.push(hohmannRel(R)); b2.push(R > 1 ? bielliptica(1, R, 2 * R, 1).tot : NaN); b5.push(bielliptica(1, R, 5 * R, 1).tot); bi.push(biellitticaInf(R)); }
      var sB = sogliaBiellittica(), sO = sogliaOgniRb(), o = F.grafico(cg, { serie: [{ x: X, y: h, col: '#5eead4', etich: ['Hohmann', 'Hohmann'] }, { x: X, y: b2, col: '#ffd24a', tratt: true, larg: 1.5, etich: ['bi r_b = 2r₂', 'bi r_b = 2r₂'] }, { x: X, y: b5, col: '#ff8a80', tratt: true, larg: 1.5, etich: ['bi r_b = 5r₂', 'bi r_b = 5r₂'] }, { x: X, y: bi, col: '#c9a0ff', etich: ['bi r_b → ∞', 'bi r_b → ∞'] }], punti: [{ x: Math.log10(st.R), y: hohmannRel(st.R), col: '#e6fffb', r: 5 }], ymin: 0, ymax: 0.65, xl: ['log₁₀(r₂/r₁)', 'log₁₀(r₂/r₁)'], yl: ['Δv totale / v₁', 'total Δv / v₁'], legenda: [{ col: '#5eead4', etich: ['Hohmann', 'Hohmann'] }, { col: '#ffd24a', etich: ['bi-ellittica r_b = 2r₂', 'bi-elliptic r_b = 2r₂'] }, { col: '#ff8a80', etich: ['bi-ellittica r_b = 5r₂', 'bi-elliptic r_b = 5r₂'] }, { col: '#c9a0ff', etich: ['bi-ellittica r_b → ∞', 'bi-elliptic r_b → ∞'] }], descr: ['Costo di Hohmann e bi-ellittica in funzione di r₂/r₁', 'Hohmann and bi-elliptic cost versus r₂/r₁'] });
      var q = o.q; q.save(); q.setLineDash([3, 4]); q.strokeStyle = '#8494a8'; q.fillStyle = '#9fb1c6'; q.font = '11px system-ui,sans-serif';
      [[sB, '11,94'], [sO, '15,58']].forEach(function (s) { var x = o.X(Math.log10(s[0])); q.beginPath(); q.moveTo(x, 14); q.lineTo(x, o.H - 40); q.stroke(); q.fillText(s[1], x + 3, o.H - 46); });
      q.restore();
    }
    costruisci();
  }

  /* ═══ 3. satelliti terrestri ════════════════════════════════════════════ */
  function sole(jd) { /* direzione del Sole in coordinate equatoriali (bassa precisione) */
    var d = jd - J2000, g = (357.529 + 0.98560028 * d) * GRAD, q = 280.459 + 0.98564736 * d, L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * GRAD, e = (23.439 - 3.6e-7 * d) * GRAD;
    return [Math.cos(L), Math.cos(e) * Math.sin(L), Math.sin(e) * Math.sin(L)];
  }
  function schedaSatelliti(pan, S, destra) {
    var T = S.T, st = { tipo: 'leo', j2: true, vel: 300, gira: true, ts: 0, jd0: 2440587.5 + Date.now() / 86400000 };
    F.scelta(pan, ['Orbita', 'Orbit'], Object.keys(SATELLITI).map(function (k) { return [k, F.tt(SATELLITI[k].nome)]; }), st.tipo, function (v) { st.tipo = v; st.ts = 0; costruisci(); });
    casella(pan, ['Perturbazione J₂ (schiacciamento della Terra)', 'J₂ perturbation (Earth’s oblateness)'], st.j2, function (v) { st.j2 = v; });
    var riga = F.el('div', { 'class': 'bsiFX-anim' }), bP = F.el('button', { type: 'button', testo: '❚❚', 'aria-label': t('Pausa', 'Pause') }); riga.appendChild(bP); pan.appendChild(riga);
    bP.addEventListener('click', function () { st.gira = !st.gira; bP.textContent = st.gira ? '❚❚' : '▶'; bP.setAttribute('aria-label', st.gira ? t('Pausa', 'Pause') : t('Avvia', 'Play')); S.avvia(); });
    F.cursore(pan, ['Velocità del tempo', 'Time speed'], 0, 1, 0.01, Math.log10(300) / 4, function (v) { st.vel = Math.pow(10, v * 4); }, function (v) { var s = Math.pow(10, v * 4); return s < 60 ? Math.round(s) + ' s/s' : s < 3600 ? fmt(s / 60) + ' min/s' : fmt(s / 3600) + ' h/s'; });
    var info = nota(pan), spiega = nota(pan);
    var cm = F.tela(destra, 0.5);
    var gT = null, orb = null, sat = null, luce = null, el0 = null, scia = null;
    function elementi() { var s = SATELLITI[st.tipo]; return { a: s.a, e: s.e, i: s.i * GRAD, O: s.O * GRAD, w: s.w * GRAD, M0: 0 }; }
    function costruisci() {
      S.pulisci(); el0 = elementi();
      S.aggiungi(stelle(T, 2500));
      S.aggiungi(new T.AmbientLight(0x505870, 0.35)); luce = new T.DirectionalLight(0xfff6e8, 1.5); S.aggiungi(luce);
      gT = terra(T, 1, true); S.aggiungi(gT);
      S.aggiungi(cerchio(T, 1.003, 0x5eead4, 0.4)); /* equatore */
      orb = new T.Line(new T.BufferGeometry().setFromPoints(Array.apply(null, Array(257)).map(function () { return new T.Vector3(); })), new T.LineBasicMaterial({ color: 0xffd24a })); S.aggiungi(orb);
      sat = new T.Mesh(new T.SphereGeometry(0.05, 14, 10), new T.MeshBasicMaterial({ color: 0xffd24a })); S.aggiungi(sat);
      scia = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineBasicMaterial({ color: 0xff8a80, transparent: true, opacity: 0.7 })); S.aggiungi(scia);
      var ra = el0.a * (1 + el0.e) / RT; S.inquadra(Math.max(5, ra * 2.6), -0.7, 1.1);
      testi(); S.ogniFotogramma(fot);
    }
    function aggiornaOrbita() {
      var r = st.j2 ? tassiJ2(el0.a, el0.e, el0.i) : { Odot: 0, wdot: 0 }, O = el0.O + r.Odot * st.ts, w = el0.w + r.wdot * st.ts, p = el0.a * (1 - el0.e * el0.e), R = matricePQW(O, el0.i, w), pos = orb.geometry.attributes.position;
      for (var k = 0; k <= 256; k++) { var nu = 2 * Math.PI * k / 256, rr = p / (1 + el0.e * Math.cos(nu)) / RT, q = applica(R, [rr * Math.cos(nu), rr * Math.sin(nu), 0]); pos.setXYZ(k, q[0], q[1], q[2]); }
      pos.needsUpdate = true;
    }
    var accM = 1;
    function fot(dt) {
      if (st.gira) st.ts += dt * st.vel;
      var jd = st.jd0 + st.ts / 86400, s = satellite(el0, st.ts, st.j2), sd = sole(jd);
      gT.userData.sfera.rotation.z = gmst(jd);
      luce.position.set(sd[0] * 50, sd[1] * 50, sd[2] * 50);
      sat.position.set(s.r[0] / RT, s.r[1] / RT, s.r[2] / RT);
      var pv = scia.geometry.attributes.position; pv.setXYZ(0, 0, 0, 0); pv.setXYZ(1, s.r[0] / RT, s.r[1] / RT, s.r[2] / RT); pv.needsUpdate = true;
      aggiornaOrbita();
      accM += dt; if (accM > 0.12) { accM = 0; mappa(jd, s); }
      S.didascalia.textContent = F.tt(SATELLITI[st.tipo].nome) + ' · t = ' + fmt(st.ts / 3600) + ' h';
      return true;
    }
    var CONT = (A3() && A3().CONTINENTI) || [];
    function mappa(jd, s) {
      var P = F.pennello(cm), q = P.q, W = P.W, H = P.H, X = function (lon) { return (lon + 180) / 360 * W; }, Y = function (lat) { return (90 - lat) / 180 * H; };
      q.fillStyle = '#0b2440'; q.fillRect(0, 0, W, H);
      q.fillStyle = '#2f5a3a'; CONT.forEach(function (Pg) { q.beginPath(); for (var i = 0; i < Pg.length; i += 2) { if (i) q.lineTo(X(Pg[i]), Y(Pg[i + 1])); else q.moveTo(X(Pg[i]), Y(Pg[i + 1])); } q.closePath(); q.fill(); });
      q.strokeStyle = 'rgba(159,177,198,.18)'; q.lineWidth = 1;
      for (var lo = -180; lo <= 180; lo += 30) { q.beginPath(); q.moveTo(X(lo), 0); q.lineTo(X(lo), H); q.stroke(); }
      for (var la = -60; la <= 60; la += 30) { q.beginPath(); q.moveTo(0, Y(la)); q.lineTo(W, Y(la)); q.stroke(); }
      /* notte: dove il Sole e' sotto l'orizzonte (ombreggiatura a colonne) */
      var sd = sole(jd), dec = Math.asin(sd[2]), ra = Math.atan2(sd[1], sd[0]), lonS = (ra - gmst(jd)) / GRAD;
      q.fillStyle = 'rgba(0,0,10,.38)';
      for (var x = 0; x < W; x += 3) { var lon = x / W * 360 - 180, H0 = (lon - lonS) * GRAD, latT = Math.atan(-Math.cos(H0) / Math.tan(dec || 1e-6)) / GRAD; if (dec > 0) q.fillRect(x, Y(latT), 3, H - Y(latT)); else q.fillRect(x, 0, 3, Y(latT)); }
      /* la traccia: le ultime 2,5 orbite */
      var Tp = periodo(el0.a), tr = traccia(el0, st.jd0, Math.max(0, st.ts - 2.5 * Tp), st.ts, 500, st.j2);
      q.strokeStyle = '#ffd24a'; q.lineWidth = 1.6; q.beginPath();
      for (var k = 0; k < tr.length; k++) { var xx = X(tr[k][1]), yy = Y(tr[k][0]); if (k && Math.abs(tr[k][1] - tr[k - 1][1]) > 180) q.moveTo(xx, yy); else if (k) q.lineTo(xx, yy); else q.moveTo(xx, yy); }
      q.stroke();
      var ll = latLon(s.r, gmst(jd)); q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(X(ll[1]), Y(ll[0]), 5, 0, 7); q.fill();
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(X(((lonS + 540) % 360) - 180), Y(dec / GRAD), 4, 0, 7); q.fill();
      q.fillStyle = '#cfe3f7'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(t('lat ', 'lat ') + ll[0].toFixed(1) + '°, lon ' + ll[1].toFixed(1) + '° · ' + t('quota ', 'altitude ') + Math.round(norma(s.r) - RT) + ' km', 6, H - 6);
      cm.setAttribute('aria-label', t('Traccia al suolo del satellite sulla carta della Terra', 'Satellite ground track on the map of the Earth'));
    }
    function testi() {
      var e = el0, r = tassiJ2(e.a, e.e, e.i), Tp = periodo(e.a), dl = -(OMT - r.Odot) * Tp / GRAD;
      info.innerHTML = 'a = ' + fmt(e.a) + ' km, e = ' + e.e + ', i = ' + (e.i / GRAD).toFixed(2) + '°<br>' + t('Periodo ', 'Period ') + fmt(Tp / 60) + ' min · ' + t('perigeo ', 'perigee ') + fmt(e.a * (1 - e.e) - RT) + ' km · ' + t('apogeo ', 'apogee ') + fmt(e.a * (1 + e.e) - RT) + ' km<br>' +
        t('J₂: dΩ/dt = ', 'J₂: dΩ/dt = ') + '<b>' + (r.Odot / GRAD * 86400).toFixed(4) + '°/' + t('giorno', 'day') + '</b>, dω/dt = ' + (r.wdot / GRAD * 86400).toFixed(4) + '°/' + t('giorno', 'day') + '<br>' +
        t('Spostamento della traccia a ogni giro: ', 'Ground-track shift per orbit: ') + dl.toFixed(2) + '°';
      var testiTipo = {
        leo: t('La Stazione Spaziale gira in 93 minuti; la Terra sotto ruota di circa 23° a ogni giro, e la traccia si sposta verso ovest. J₂ fa regredire il piano dell’orbita di circa 5° al giorno.', 'The Space Station orbits in 93 minutes; the Earth turns about 23° beneath it every orbit, and the track shifts west. J₂ makes the orbital plane regress about 5° per day.'),
        sso: t('Eliosincrona: l’inclinazione (', 'Sun-synchronous: the inclination (') + (e.i / GRAD).toFixed(2) + t('°, retrograda) è scelta perché la precessione dei nodi dovuta a J₂, −(3/2) n J₂ (R/p)² cos i, valga +0,9856°/giorno: il piano segue il Sole e il satellite passa sempre alla stessa ora locale. Serve ai satelliti per l’osservazione della Terra.', '°, retrograde) is chosen so that the J₂ nodal precession, −(3/2) n J₂ (R/p)² cos i, equals +0.9856°/day: the plane follows the Sun and the satellite always passes at the same local time. Used by Earth-observation satellites.'),
        gps: t('Il periodo dei GPS è mezzo giorno siderale (11 h 58 min): dopo due giri la Terra ha fatto un giro rispetto alle stelle, e la traccia si ripete identica ogni giorno (4 minuti prima).', 'The GPS period is half a sidereal day (11 h 58 min): after two orbits the Earth has turned once relative to the stars, and the track repeats every day (4 minutes earlier).'),
        molniya: t('Molniya: molto eccentrica, apogeo sopra l’emisfero nord dove il satellite resta 8 ore su 12. Con i = 63,43° (inclinazione critica, 4 − 5 sin² i = 0) J₂ non fa ruotare il pericentro: l’apogeo resta a nord.', 'Molniya: highly eccentric, apogee over the northern hemisphere where the satellite lingers 8 hours out of 12. At i = 63.43° (critical inclination, 4 − 5 sin² i = 0) J₂ does not rotate the perigee: the apogee stays north.'),
        geo: t('Geostazionaria: periodo = giorno siderale, r = (μT²/4π²)^(1/3) = ', 'Geostationary: period = sidereal day, r = (μT²/4π²)^(1/3) = ') + fmt(raggioGEO()) + t(' km. La traccia si riduce a un punto sull’equatore.', ' km. The ground track shrinks to a point on the equator.')
      };
      spiega.innerHTML = testiTipo[st.tipo] + '<br>' + t('Il punto giallo sulla carta è il punto subsolare, l’ombra è la notte.', 'The yellow dot on the map is the subsolar point, the shading is night.');
    }
    costruisci();
  }

  /* ═══ 4. il problema di Lambert e il porkchop Terra → Marte ═════════════ */
  function schedaLambert(pan, S, destra) {
    var T = S.T, jd0 = 2440587.5 + Date.UTC(2026, 0, 1) / 86400000, GIORNI = 1600, NP = 72, NT = 54, TOF0 = 80, TOF1 = 480;
    var st = { p: 300, tof: 260, toccato: false };
    var cP = F.cursore(pan, ['Partenza (giorni dal 1/1/2026)', 'Departure (days from 1/1/2026)'], 0, GIORNI, 1, st.p, function (v) { st.p = v; st.toccato = true; scegli(); }, function (v) { return A3() ? A3().testoData(jd0 + v) : Math.round(v); });
    var cT = F.cursore(pan, ['Durata del volo (giorni)', 'Time of flight (days)'], TOF0, TOF1, 1, st.tof, function (v) { st.tof = v; st.toccato = true; scegli(); }, function (v) { return v + ' d'; });
    F.bottone(pan, ['Vai al minimo', 'Go to the minimum'], function () { if (!minimo) return; cP.value = minimo.p; cT.value = minimo.tof; cP.dispatchEvent(new Event('input')); cT.dispatchEvent(new Event('input')); });
    var info = nota(pan), spiega = nota(pan, t('Il problema di Lambert: dati r₁, r₂ e il tempo Δt, trovare l’orbita che li collega. Con le variabili universali (z = αχ², funzioni di Stumpff C(z), S(z)) l’equazione del tempo √μ Δt = (y/C)^(3/2) S + A√y, con y(z) = r₁ + r₂ + A(zS − 1)/√C, A = sin Δθ √(r₁r₂/(1 − cos Δθ)), ha una sola soluzione per z < 4π² (meno di un giro): la si trova per bisezione, poi f = 1 − y/r₁, g = A√(y/μ), ġ = 1 − y/r₂ danno v₁ = (r₂ − f r₁)/g e v₂ = (ġ r₂ − r₁)/g. Il porkchop mostra il Δv totale (partenza + arrivo, eccessi iperbolici) per ogni coppia data–durata, con Terra e Marte su orbite circolari complanari: le «valli» si ripetono ogni periodo sinodico, 780 giorni. I trasferimenti brevi (Δθ < 180°, «tipo I») e lunghi (tipo II) sono le due lobi separate dalla cresta a Δθ = 180°, dove il piano dell’orbita è indeterminato.',
      'Lambert’s problem: given r₁, r₂ and the time Δt, find the orbit joining them. With universal variables (z = αχ², Stumpff functions C(z), S(z)) the time equation √μ Δt = (y/C)^(3/2) S + A√y, with y(z) = r₁ + r₂ + A(zS − 1)/√C, A = sin Δθ √(r₁r₂/(1 − cos Δθ)), has one solution for z < 4π² (less than one revolution): found by bisection, then f = 1 − y/r₁, g = A√(y/μ), ġ = 1 − y/r₂ give v₁ = (r₂ − f r₁)/g and v₂ = (ġ r₂ − r₁)/g. The porkchop shows the total Δv (departure + arrival hyperbolic excesses) for each date–duration pair, with Earth and Mars on circular coplanar orbits: the “valleys” repeat every synodic period, 780 days. Short transfers (Δθ < 180°, “type I”) and long ones (type II) are the two lobes separated by the ridge at Δθ = 180°, where the orbit plane is undetermined.'));
    var cp = F.tela(destra, 0.62);
    var Z = [], righe = 0, minimo = null, K = 4, parziale = null, ultimoDis = 0;
    /* calcolo a lotti: qualche riga per volta, il resto al giro successivo */
    function calcola() {
      var t0 = Date.now();
      while (righe < NT && Date.now() - t0 < 20) {
        var tof = TOF0 + (TOF1 - TOF0) * righe / (NT - 1), riga = parziale || (parziale = []), b = riga.length, p = GIORNI * b / (NP - 1), v = trasferimentoMarte(jd0 + p, tof).tot;
        riga.push(v); if (!minimo || v < minimo.v) minimo = { v: v, p: p, tof: tof };
        if (riga.length === NP) { Z.push(riga); parziale = null; righe++; }
      }
      if (righe >= NT && !st.toccato && minimo) { cP.value = minimo.p; cT.value = minimo.tof; cP.dispatchEvent(new Event('input')); cT.dispatchEvent(new Event('input')); }
      if (righe >= NT || Date.now() - ultimoDis > 250) { ultimoDis = Date.now(); disegnaPork(); }
      if (righe < NT) setTimeout(calcola, 0);
    }
    function colore(v) { var f = Math.max(0, Math.min(1, (v - 5.4) / 9)), V = [[253, 231, 37], [94, 201, 98], [33, 145, 140], [59, 82, 139], [68, 1, 84]], x = f * 4, i = Math.min(3, Math.floor(x)), u = x - i; return 'rgb(' + [0, 1, 2].map(function (c) { return Math.round(V[i][c] + (V[i + 1][c] - V[i][c]) * u); }).join(',') + ')'; }
    function disegnaPork() {
      var P = F.pennello(cp), q = P.q, W = P.W, H = P.H, m = { s: 50, d: 12, a: 12, b: 36 }, w = W - m.s - m.d, h = H - m.a - m.b;
      var X = function (p) { return m.s + p / GIORNI * w; }, Y = function (tof) { return m.a + h - (tof - TOF0) / (TOF1 - TOF0) * h; };
      var cw = w / (NP - 1), ch = h / (NT - 1);
      for (var a = 0; a < Z.length; a++) for (var b = 0; b < NP; b++) { q.fillStyle = colore(Z[a][b]); q.fillRect(X(GIORNI * b / (NP - 1)) - cw / 2, Y(TOF0 + (TOF1 - TOF0) * a / (NT - 1)) - ch / 2, cw + 1, ch + 1); }
      /* curve di livello (quadrati in marcia) */
      q.strokeStyle = 'rgba(8,21,34,.75)'; q.lineWidth = 1;
      [6, 7, 8, 10, 13].forEach(function (L) {
        for (var a = 0; a < Z.length - 1; a++) for (var b = 0; b < NP - 1; b++) {
          var v = [Z[a][b], Z[a][b + 1], Z[a + 1][b + 1], Z[a + 1][b]], c = [[b, a], [b + 1, a], [b + 1, a + 1], [b, a + 1]], tg = [];
          for (var k = 0; k < 4; k++) { var u = v[k], z = v[(k + 1) % 4]; if ((u - L) * (z - L) < 0) { var f = (L - u) / (z - u); tg.push([c[k][0] + (c[(k + 1) % 4][0] - c[k][0]) * f, c[k][1] + (c[(k + 1) % 4][1] - c[k][1]) * f]); } }
          if (tg.length >= 2) { q.beginPath(); q.moveTo(X(GIORNI * tg[0][0] / (NP - 1)), Y(TOF0 + (TOF1 - TOF0) * tg[0][1] / (NT - 1))); q.lineTo(X(GIORNI * tg[1][0] / (NP - 1)), Y(TOF0 + (TOF1 - TOF0) * tg[1][1] / (NT - 1))); q.stroke(); }
        }
      });
      q.fillStyle = '#8494a8'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'center';
      for (var y = 2026; y <= 2030; y++) { var p = (Date.UTC(y, 0, 1) - Date.UTC(2026, 0, 1)) / 86400000; if (p <= GIORNI) { q.fillText(String(y), X(p), H - m.b + 14); q.fillRect(X(p), H - m.b, 1, 4); } }
      q.textAlign = 'right'; for (var tt = 100; tt <= 450; tt += 50) q.fillText(String(tt), m.s - 4, Y(tt) + 4);
      q.textAlign = 'center'; q.fillStyle = '#aebccd'; q.fillText(t('data di partenza', 'departure date'), m.s + w / 2, H - 6);
      q.save(); q.translate(12, m.a + h / 2); q.rotate(-Math.PI / 2); q.fillText(t('durata (giorni)', 'flight time (days)'), 0, 0); q.restore();
      q.strokeStyle = '#e6fffb'; q.lineWidth = 2; q.beginPath(); q.arc(X(st.p), Y(st.tof), 6, 0, 7); q.stroke();
      if (minimo && righe >= NT) { q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(X(minimo.p), Y(minimo.tof), 4, 0, 7); q.fill(); }
      q.textAlign = 'left'; q.fillStyle = '#e6fffb'; q.fillText('Δv ' + t('totale', 'total') + ' (km/s): ' + (righe < NT ? t('calcolo… ', 'computing… ') + Math.round(righe / NT * 100) + ' %' : t('giallo ≈ 5,6 → viola ≥ 14; curve a 6, 7, 8, 10, 13', 'yellow ≈ 5.6 → violet ≥ 14; contours at 6, 7, 8, 10, 13')), m.s + 4, m.a + 14);
      cp.setAttribute('aria-label', t('Diagramma porkchop: Δv di un trasferimento Terra–Marte in funzione della data di partenza e della durata', 'Porkchop plot: Δv of an Earth–Mars transfer versus departure date and flight time'));
      P.X = X; P.Y = Y; cp._P = P;
    }
    cp.addEventListener('click', function (e) {
      var P = cp._P; if (!P) return; var r = cp.getBoundingClientRect(), x = (e.clientX - r.left) * P.W / r.width, y = (e.clientY - r.top) * P.H / r.height;
      var p = (x - 50) / (P.W - 62) * GIORNI, tof = TOF0 + (P.H - 36 - y) / (P.H - 48) * (TOF1 - TOF0);
      if (p < 0 || p > GIORNI || tof < TOF0 || tof > TOF1) return;
      cP.value = Math.round(p); cT.value = Math.round(tof); cP.dispatchEvent(new Event('input')); cT.dispatchEvent(new Event('input'));
    });
    /* la scena: Sole, orbite, trasferimento */
    S.aggiungi(stelle(T, 3000));
    if (A3()) { var so = A3().sole3D(T, 0.35); S.aggiungi(so); S.ogniFotogramma(function (dt) { so.userData.mat.uniforms.uT.value += dt; }); } else S.aggiungi(new T.Mesh(new T.SphereGeometry(0.35, 24, 16), new T.MeshBasicMaterial({ color: 0xffd24a })));
    S.aggiungi(new T.PointLight(0xfff4e0, 1.6, 0, 1)); S.aggiungi(new T.AmbientLight(0x404858, 0.4));
    S.aggiungi(cerchio(T, R_TERRA * K, 0x6bcfff, 0.6)); S.aggiungi(cerchio(T, R_MARTE * K, 0xff8a6a, 0.6));
    function pianeta(nome, R, col) { var m = A3() ? new T.Mesh(A3().geoSfera(T, 32), A3().materiale(T, nome, col)) : new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshStandardMaterial({ color: col })); m.scale.setScalar(R); S.aggiungi(m); return m; }
    var mT = pianeta('terra', 0.16, 0x3a6ea8), mM = pianeta('marte', 0.12, 0xc1440e), nave = new T.Mesh(new T.SphereGeometry(0.06, 12, 8), new T.MeshBasicMaterial({ color: 0xe6fffb }));
    S.aggiungi(nave);
    var arcoT = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffd24a })); S.aggiungi(arcoT);
    var fantT = new T.Mesh(new T.SphereGeometry(0.07, 12, 8), new T.MeshBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.5 })), fantM = new T.Mesh(new T.SphereGeometry(0.07, 12, 8), new T.MeshBasicMaterial({ color: 0xff8a6a, transparent: true, opacity: 0.5 }));
    S.aggiungi(fantT); S.aggiungi(fantM);
    var sol = null, tA = 0;
    function scegli() {
      sol = trasferimentoMarte(jd0 + st.p, st.tof);
      var pts = []; for (var k = 0; k <= 200; k++) { var p = propaga(sol.T.r, sol.L.v1, st.tof * k / 200, MU_S_UA); pts.push(new T.Vector3(p.r[0] * K, p.r[1] * K, p.r[2] * K)); }
      arcoT.geometry.dispose(); arcoT.geometry = new T.BufferGeometry().setFromPoints(pts); sol.pts = pts;
      fantT.position.set(sol.T.r[0] * K, sol.T.r[1] * K, 0); fantM.position.set(sol.M.r[0] * K, sol.M.r[1] * K, 0);
      var arr = propaga(sol.T.r, sol.L.v1, st.tof, MU_S_UA), err = norma(sub(arr.r, sol.M.r)) * UA;
      var dth = sol.L.dth / GRAD;
      info.innerHTML = (A3() ? t('Partenza ', 'Departure ') + A3().testoData(jd0 + st.p) + ', ' + t('arrivo ', 'arrival ') + A3().testoData(jd0 + st.p + st.tof) + '<br>' : '') +
        'Δθ = ' + dth.toFixed(1) + '° (' + (dth < 180 ? t('tipo I', 'type I') : t('tipo II', 'type II')) + ')<br>' +
        'Δv₁ = |v₁ − v⊕| = <b>' + sol.dv1.toFixed(3) + ' km/s</b> (C₃ = ' + sol.C3.toFixed(2) + ' km²/s²)<br>Δv₂ = |v♂ − v₂| = <b>' + sol.dv2.toFixed(3) + ' km/s</b><br>' + t('Totale ', 'Total ') + '<b>' + sol.tot.toFixed(3) + ' km/s</b> · Hohmann: ' + (function () { var H = hohmann(R_TERRA, R_MARTE, MU_S_UA); return (H.tot * UAG_KMS).toFixed(3) + ' km/s, ' + Math.round(H.tempo) + ' d'; })() + '<br>' +
        t('Controllo: propagando v₁ per Δt (variabili universali) si arriva a ', 'Check: propagating v₁ for Δt (universal variables) lands ') + fmt(err) + t(' km da Marte', ' km from Mars');
      if (Z.length) disegnaPork();
      tA = 0; S.avvia();
    }
    S.ogniFotogramma(function (dt) {
      if (!sol) return true;
      tA = (tA + dt / 6) % 1.15; var u = Math.min(1, tA), k = Math.round(u * 200), p = sol.pts[k];
      nave.position.copy(p);
      var jd = jd0 + st.p + st.tof * u, lT = lonTerra(jd), lM = lonMarte(jd);
      mT.position.set(R_TERRA * K * Math.cos(lT), R_TERRA * K * Math.sin(lT), 0); mM.position.set(R_MARTE * K * Math.cos(lM), R_MARTE * K * Math.sin(lM), 0);
      S.didascalia.textContent = t('Trasferimento Terra → Marte, giorno ', 'Earth → Mars transfer, day ') + Math.round(st.tof * u) + ' / ' + st.tof;
      return true;
    });
    S.inquadra(17, -1.3, 0.75);
    scegli();
    setTimeout(calcola, 30);
  }

  F.sezione('sastroorbite', {
    titolo: ['🛰️ Meccanica orbitale 3D', '🛰️ Orbital mechanics 3D'],
    sotto: ['Elementi kepleriani e vettori di stato, manovre di Hohmann e bi-ellittiche, cambi di piano, satelliti terrestri con la perturbazione J₂ e la traccia al suolo, il problema di Lambert e il diagramma porkchop Terra–Marte. Tutto in 3D: si ruota con il dito o il mouse.', 'Keplerian elements and state vectors, Hohmann and bi-elliptic manoeuvres, plane changes, Earth satellites with the J₂ perturbation and the ground track, Lambert’s problem and the Earth–Mars porkchop plot. All in 3D: rotate with a finger or the mouse.'],
    schede: [
      { nome: ['📐 Elementi ↔ stato', '📐 Elements ↔ state'], costruisci: scheda(schedaElementi) },
      { nome: ['🚀 Manovre', '🚀 Manoeuvres'], costruisci: scheda(schedaManovre) },
      { nome: ['🌍 Satelliti terrestri', '🌍 Earth satellites'], costruisci: scheda(schedaSatelliti) },
      { nome: ['🎯 Lambert e porkchop', '🎯 Lambert and porkchop'], costruisci: scheda(schedaLambert) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
