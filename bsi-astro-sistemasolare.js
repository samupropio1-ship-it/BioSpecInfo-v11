/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-sistemasolare.js — 🪐 Sistema solare 3D
   BioSpecInfo · © Samuele Pio Provenzano

   Il sistema solare vero, a una data qualsiasi, in tre dimensioni.
   La sezione bsi-fis-astro.js ha gia' un sistema solare piatto (ellissi
   nel piano, solo a, e e perielio) e bsi-fis-gravita.js integra N corpi
   in 2D: qui si va oltre, con le effemeridi vere e la geometria vera.

   · IL SISTEMA SOLARE ALLA DATA: gli otto pianeti e Plutone con gli
     elementi kepleriani J2000 e le loro variazioni secolari (la tabella
     JPL «Approximate positions of the planets», valida 1800–2050), Cerere,
     Eris, Haumea e Makemake con elementi osculanti approssimati;
     l'equazione di Keplero risolta con Newton; le orbite nella loro
     inclinazione vera rispetto all'eclittica (sopra il piano piene, sotto
     tenui); il Sole con una superficie granulare calcolata da uno shader e
     un alone additivo, che illumina i pianeti con una luce puntiforme;
     pianeti con tessiture procedurali (bande e Grande Macchia Rossa di
     Giove, anelli di Saturno con la divisione di Cassini, Terra con
     continenti e nubi, Marte con le calotte polari), con l'asse polare
     IAU vero e la rotazione; la fascia principale, i troiani di Giove e la
     fascia di Kuiper (migliaia di punti, posizioni kepleriane calcolate
     dalla scheda grafica); scala lineare o logaritmica; un clic su un
     corpo lo mette al centro e ne mostra i dati.
   · TERRA, LUNA ED ECLISSI: la Luna con la teoria di Meeus troncata, l'orbita
     inclinata di 5,14° con la linea dei nodi che regredisce in 18,6 anni,
     i coni d'ombra e di penombra, le fasi viste dalla Terra; perche' le
     eclissi sono rare (la Luna nuova cade quasi sempre sopra o sotto il
     Sole); le stagioni con il terminatore e la durata del giorno.
   · DA VICINO: Giove con i quattro satelliti medicei e la risonanza di
     Laplace 1:2:4 (λ_Io − 3λ_Europa + 2λ_Ganimede = 180°), Saturno con
     migliaia di particelle degli anelli in orbite kepleriane (rotazione
     differenziale, divisione di Cassini in risonanza 2:1 con Mimante).

   I calcoli stanno in F.calcolo.sistemasolare (provati in
   tools/banchi/verifiche/verifica-sastrosole.js), il disegno usa il motore
   3D del Laboratorio 3D (BSILab3D, three.js caricato al primo uso).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, D = globale.document;
  var GRAD = Math.PI / 180, J2000 = 2451545.0, UA = 149597870.7, KGAUSS = 0.01720209895;
  var GM_SOLE = 1.32712440018e11; /* km³/s² */
  var EPS0 = 23.4392911 * GRAD;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function norm180(x) { x = norm360(x); return x > 180 ? x - 360 : x; }

  /* data giuliana dal calendario gregoriano (Meeus, cap. 7) e ritorno */
  function giuliano(anno, mese, giorno, ore) {
    var Y = anno, M = mese; if (M <= 2) { Y -= 1; M += 12; }
    var A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + giorno + B - 1524.5 + (ore || 0) / 24;
  }
  function calendario(jd) {
    var z = Math.floor(jd + 0.5), f = jd + 0.5 - z, A = z;
    if (z >= 2299161) { var al = Math.floor((z - 1867216.25) / 36524.25); A = z + 1 + al - Math.floor(al / 4); }
    var B = A + 1524, C = Math.floor((B - 122.1) / 365.25), Dd = Math.floor(365.25 * C), E = Math.floor((B - Dd) / 30.6001);
    var g = B - Dd - Math.floor(30.6001 * E) + f, mese = E < 14 ? E - 1 : E - 13, anno = mese > 2 ? C - 4716 : C - 4715;
    return { anno: anno, mese: mese, giorno: Math.floor(g), ore: (g - Math.floor(g)) * 24 };
  }
  function daData(d) { return 2440587.5 + d.getTime() / 86400000; }
  function testoData(jd, ore) {
    var c = calendario(jd), p = function (n) { return (n < 10 ? '0' : '') + n; };
    var s = c.anno + '-' + p(c.mese) + '-' + p(c.giorno);
    if (ore) { var m = Math.round(c.ore * 60); if (m >= 1440) m = 1439; s += ' ' + p(Math.floor(m / 60)) + ':' + p(m % 60) + ' UT'; }
    return s;
  }
  /* tempo siderale medio di Greenwich (gradi), Meeus 12.4 */
  function gmst(jd) { var T = (jd - J2000) / 36525; return norm360(280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * T * T - T * T * T / 38710000); }

  /* equazione di Keplero M = E − e sin E: Newton partendo da una stima che
     converge sempre (M + e sin M, o π per e alte vicino al perielio), con un
     controllo a bisezione se un passo esce dall'intervallo */
  function kepleroE(M, e) {
    var dM = M % (2 * Math.PI); if (dM < 0) dM += 2 * Math.PI;
    var giri = M - dM, E = e < 0.8 ? dM + e * Math.sin(dM) : Math.PI, lo = 0, hi = 2 * Math.PI;
    for (var i = 0; i < 60; i++) {
      var f = E - e * Math.sin(E) - dM;
      if (f > 0) hi = Math.min(hi, E); else lo = Math.max(lo, E);
      var d = f / (1 - e * Math.cos(E)), En = E - d;
      if (!(En > lo && En < hi)) En = (lo + hi) / 2;
      if (Math.abs(En - E) < 1e-15) { E = En; break; }
      E = En;
    }
    return E + giri;
  }
  function residuoKeplero(M, e) { var E = kepleroE(M, e); return E - e * Math.sin(E) - M; }

  /* Tabella 1 di E. M. Standish (JPL), «Keplerian elements for the approximate
     positions of the major planets», 1800–2050: a (UA), e, I (°), L (°),
     longitudine del perielio ϖ (°), del nodo Ω (°), e le derivate per secolo */
  var ELEMENTI = {
    mercurio: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
    venere: [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255], [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
    terra: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0]],
    marte: [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
    giove: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
    saturno: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
    urano: [[19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503], [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]],
    nettuno: [[30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]],
    plutone: [[39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 110.30393684], [-0.00031596, 0.00005170, 0.00004818, 145.20780515, -0.04062942, -0.01183482]]
  };
  /* pianeti nani oltre Plutone: elementi osculanti approssimati (a, e, i, Ω, ω,
     istante del perielio in JD). Posizioni indicative, a qualche grado */
  var NANI = {
    cerere: [2.7675, 0.0758, 10.59, 80.27, 73.6, 2459920.5],
    eris: [67.86, 0.4361, 44.04, 35.95, 151.6, 2545500],
    haumea: [43.13, 0.1955, 28.21, 122.2, 239.0, 2500200],
    makemake: [45.43, 0.1613, 29.0, 79.4, 297.0, 2519500]
  };
  /* dati fisici: nome, massa (kg), raggio medio (km), periodo siderale (giorni),
     periodo di rotazione (ore, negativo = retrogrado attorno al polo nord IAU), polo IAU
     (α, δ J2000, °; per i pianeti nani e' il polo positivo della regola della mano destra,
     quindi Plutone ruota in verso diretto attorno a un polo inclinato di 119,6°;
     per Nettuno il polo include il termine di precessione a J2000), colore dell'orbita */
  var CORPI = [
    ['mercurio', ['Mercurio', 'Mercury'], 3.3011e23, 2439.7, 87.9691, 1407.6, 281.0103, 61.4155, 0x9fa3a8],
    ['venere', ['Venere', 'Venus'], 4.8675e24, 6051.8, 224.701, -5832.6, 272.76, 67.16, 0xe8c98a],
    ['terra', ['Terra', 'Earth'], 5.9722e24, 6371.0, 365.25636, 23.9345, 0, 90, 0x6bcfff],
    ['marte', ['Marte', 'Mars'], 6.4171e23, 3389.5, 686.980, 24.6229, 317.681, 52.887, 0xff8a6a],
    ['giove', ['Giove', 'Jupiter'], 1.89819e27, 69911, 4332.59, 9.9250, 268.057, 64.495, 0xe0b98a],
    ['saturno', ['Saturno', 'Saturn'], 5.6834e26, 58232, 10759.22, 10.656, 40.589, 83.537, 0xf0d9a0],
    ['urano', ['Urano', 'Uranus'], 8.6810e25, 25362, 30688.5, -17.24, 257.311, -15.175, 0xa8e8f0],
    ['nettuno', ['Nettuno', 'Neptune'], 1.02413e26, 24622, 60182, 16.11, 299.334, 42.950, 0x6b8cff],
    ['plutone', ['Plutone', 'Pluto'], 1.303e22, 1188.3, 90560, 153.29, 132.993, -6.163, 0xc9a98a],
    ['cerere', ['Cerere', 'Ceres'], 9.3835e20, 469.7, 1680.5, 9.074, 291.418, 66.764, 0xb0b0b0],
    ['eris', ['Eris', 'Eris'], 1.6466e22, 1163, 203830, 378.9, 0, 90, 0xd8d8e8],
    ['haumea', ['Haumea', 'Haumea'], 4.006e21, 780, 103468, 3.9155, 0, 90, 0xd0d8e0],
    ['makemake', ['Makemake', 'Makemake'], 3.1e21, 715, 111845, 22.83, 0, 90, 0xc08a6a]
  ];
  var INDICE = {}; CORPI.forEach(function (c, i) { INDICE[c[0]] = i; });

  /* elementi a una data: a, e, i, Ω, ω, M in radianti (a in UA) */
  function elementi(nome, jd) {
    var T = (jd - J2000) / 36525, E0 = ELEMENTI[nome];
    if (E0) {
      var v = E0[0].map(function (x, k) { return x + E0[1][k] * T; });
      var a = v[0], e = v[1], I = v[2], L = v[3], w = v[4], O = v[5];
      return { a: a, e: e, i: I * GRAD, O: O * GRAD, w: (w - O) * GRAD, M: norm180(L - w) * GRAD, n: E0[1][3] / 36525 * GRAD };
    }
    var N = NANI[nome], n = KGAUSS / Math.pow(N[0], 1.5);
    return { a: N[0], e: N[1], i: N[2] * GRAD, O: N[3] * GRAD, w: N[4] * GRAD, M: n * (jd - N[5]), n: n };
  }
  /* posizione eclittica J2000 (UA) dagli elementi */
  function dalPiano(x, y, el) {
    var cO = Math.cos(el.O), sO = Math.sin(el.O), cw = Math.cos(el.w), sw = Math.sin(el.w), ci = Math.cos(el.i), si = Math.sin(el.i);
    return [(cw * cO - sw * sO * ci) * x + (-sw * cO - cw * sO * ci) * y, (cw * sO + sw * cO * ci) * x + (-sw * sO + cw * cO * ci) * y, sw * si * x + cw * si * y];
  }
  function posizioneDa(el) {
    var E = kepleroE(el.M, el.e), x = el.a * (Math.cos(E) - el.e), y = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
    return dalPiano(x, y, el);
  }
  function posizione(nome, jd) { return posizioneDa(elementi(nome, jd)); }
  /* velocita' (UA/giorno) dalla derivata analitica di E: dE/dt = n/(1 − e cos E) */
  function velocita(nome, jd) {
    var el = elementi(nome, jd), E = kepleroE(el.M, el.e), Ed = el.n / (1 - el.e * Math.cos(E));
    return dalPiano(-el.a * Math.sin(E) * Ed, el.a * Math.sqrt(1 - el.e * el.e) * Math.cos(E) * Ed, el);
  }
  function orbita(nome, jd, n) {
    var el = elementi(nome, jd), out = [];
    for (var k = 0; k <= n; k++) { var E = 2 * Math.PI * k / n; out.push(dalPiano(el.a * (Math.cos(E) - el.e), el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E), el)); }
    return out;
  }
  function distanza(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
  /* terza legge di Keplero con la massa del pianeta: P = 2π √(a³ / G(M☉ + m)) */
  function periodoKepler(aUA, massa) { var a = aUA * UA; return 2 * Math.PI * Math.sqrt(a * a * a / (GM_SOLE * (1 + massa / 1.98847e30))) / 86400; }
  /* polo di rotazione in coordinate eclittiche, e angolo con la normale all'orbita */
  function eqEcl(v) { var c = Math.cos(EPS0), s = Math.sin(EPS0); return [v[0], c * v[1] + s * v[2], -s * v[1] + c * v[2]]; }
  function eclEq(v) { var c = Math.cos(EPS0), s = Math.sin(EPS0); return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]]; }
  function polo(nome) { var C = CORPI[INDICE[nome]], a = C[6] * GRAD, d = C[7] * GRAD; return eqEcl([Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]); }
  function normaleOrbita(nome, jd) { var el = elementi(nome, jd); return [Math.sin(el.i) * Math.sin(el.O), -Math.sin(el.i) * Math.cos(el.O), Math.cos(el.i)]; }
  function obliquita(nome, jd) {
    var p = polo(nome), n = normaleOrbita(nome, jd), s = CORPI[INDICE[nome]][5] < 0 ? -1 : 1;
    return Math.acos(Math.max(-1, Math.min(1, s * (p[0] * n[0] + p[1] * n[1] + p[2] * n[2])))) / GRAD;
  }

  /* ── il Sole visto dalla Terra (Meeus, cap. 25, precisione 0,01°) ── */
  function sole(jd) {
    var T = (jd - J2000) / 36525, L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T, M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * GRAD;
    var C = (1.914602 - 0.004817 * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    var lam = norm360(L0 + C), e = 0.016708634 - 0.000042037 * T, nu = M + C * GRAD, R = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(nu));
    var eps = (23.439291 - 0.0130042 * T) * GRAD, l = lam * GRAD;
    var dec = Math.asin(Math.sin(eps) * Math.sin(l)) / GRAD, ra = norm360(Math.atan2(Math.cos(eps) * Math.sin(l), Math.cos(l)) / GRAD);
    return { lambda: lam, R: R, dec: dec, ra: ra, eps: eps / GRAD };
  }
  /* durata del giorno (ore) alla latitudine φ con il Sole a declinazione δ;
     h0 = altezza del centro del Sole al sorgere (0 geometrico, −0,833° con rifrazione) */
  function durataGiorno(lat, dec, h0) {
    var f = lat * GRAD, d = dec * GRAD, c = (Math.sin((h0 || 0) * GRAD) - Math.sin(f) * Math.sin(d)) / (Math.cos(f) * Math.cos(d));
    if (c >= 1) return 0; if (c <= -1) return 24;
    return 2 * Math.acos(c) / GRAD / 15;
  }

  /* ── la Luna (Meeus, cap. 47, i termini maggiori: ~0,1° in longitudine) ── */
  function luna(jd) {
    var T = (jd - J2000) / 36525;
    var Lp = 218.3164477 + 481267.88123421 * T, Dm = (297.8501921 + 445267.1114034 * T) * GRAD, M = (357.5291092 + 35999.0502909 * T) * GRAD,
      Mp = (134.9633964 + 477198.8675055 * T) * GRAD, Fm = (93.2720950 + 483202.0175233 * T) * GRAD, Ec = 1 - 0.002516 * T, s = Math.sin, c = Math.cos;
    var lam = Lp + 6.288774 * s(Mp) + 1.274027 * s(2 * Dm - Mp) + 0.658314 * s(2 * Dm) + 0.213618 * s(2 * Mp) - 0.185116 * Ec * s(M) - 0.114332 * s(2 * Fm) +
      0.058793 * s(2 * Dm - 2 * Mp) + 0.057066 * Ec * s(2 * Dm - M - Mp) + 0.053322 * s(2 * Dm + Mp) + 0.045758 * Ec * s(2 * Dm - M) - 0.040923 * Ec * s(M - Mp) - 0.034720 * s(Dm) - 0.030383 * Ec * s(M + Mp) +
      0.015327 * s(2 * Dm - 2 * Fm) - 0.012528 * s(Mp + 2 * Fm) + 0.010980 * s(Mp - 2 * Fm) + 0.010675 * s(4 * Dm - Mp) + 0.010034 * s(3 * Mp);
    var bet = 5.128122 * s(Fm) + 0.280602 * s(Mp + Fm) + 0.277693 * s(Mp - Fm) + 0.173237 * s(2 * Dm - Fm) + 0.055413 * s(2 * Dm - Mp + Fm) + 0.046271 * s(2 * Dm - Mp - Fm) + 0.032573 * s(2 * Dm + Fm) + 0.017198 * s(2 * Mp + Fm) + 0.009266 * s(2 * Dm + Mp - Fm) + 0.008822 * s(2 * Mp - Fm);
    var dist = 385000.56 - 20905.355 * c(Mp) - 3699.111 * c(2 * Dm - Mp) - 2955.968 * c(2 * Dm) - 569.925 * c(2 * Mp) + 48.888 * Ec * c(M) - 3.149 * c(2 * Fm) + 246.158 * c(2 * Dm - 2 * Mp) - 152.138 * Ec * c(2 * Dm - M - Mp) - 170.733 * c(2 * Dm + Mp) - 204.586 * Ec * c(2 * Dm - M) - 129.620 * Ec * c(M - Mp) + 108.743 * c(Dm) + 104.755 * Ec * c(M + Mp);
    var nodo = norm360(125.04452 - 1934.136261 * T);
    var S = sole(jd), el = norm360(lam - S.lambda);
    /* frazione illuminata: angolo di fase dall'elongazione (Sole all'infinito, a meno di Δ/R) */
    var psi = Math.acos(Math.cos(bet * GRAD) * Math.cos(el * GRAD)), ii = Math.atan2(S.R * UA * Math.sin(psi), dist - S.R * UA * Math.cos(psi));
    return { lambda: norm360(lam), beta: bet, dist: dist, nodo: nodo, elong: el, illum: (1 + Math.cos(ii)) / 2, sole: S };
  }
  function nomeFase(el) {
    var k = Math.round(norm360(el) / 45) % 8;
    return [['Luna nuova', 'New Moon'], ['Falce crescente', 'Waxing crescent'], ['Primo quarto', 'First quarter'], ['Gibbosa crescente', 'Waxing gibbous'], ['Luna piena', 'Full Moon'], ['Gibbosa calante', 'Waning gibbous'], ['Ultimo quarto', 'Last quarter'], ['Falce calante', 'Waning crescent']][k];
  }
  /* sizigie: lune nuove (fase 0) e piene (fase 180) fra jd0 e jd1, ciascuna
     raffinata con il metodo delle secanti sull'elongazione, e il tipo di
     eclisse dalla distanza dell'asse dell'ombra dal centro (γ, in raggi terrestri) */
  var R_T = 6378.14, R_L = 1737.4, R_S = 696000;
  function sizigia(jd, bersaglio) {
    for (var i = 0; i < 6; i++) { var L = luna(jd), d = norm180(L.elong - bersaglio); if (Math.abs(d) < 1e-7) break; jd -= d / 12.1907; }
    return jd;
  }
  function tipoEclisse(L, nuova) {
    var S = L.sole, Rkm = S.R * UA, gamma = L.dist / R_T * Math.sin(Math.abs(L.beta) * GRAD);
    if (nuova) {
      /* ombra della Luna: penombra sulla Terra (raggio in R⊕) e lunghezza del cono d'ombra */
      var pen = (L.dist * (R_S + R_L) / Rkm) / R_T, lungh = R_L * Rkm / (R_S - R_L);
      if (gamma > 1 + pen) return null;
      if (gamma < 0.997) return { tipo: lungh > L.dist - R_T ? 'totale' : 'anulare', solare: true, gamma: gamma };
      return { tipo: 'parziale', solare: true, gamma: gamma };
    }
    /* ombra della Terra alla distanza della Luna, ingrandita del 2 % dall'atmosfera */
    var um = (1 - L.dist * (R_S - R_T) / Rkm / R_T) * 1.02, pe = (1 + L.dist * (R_S + R_T) / Rkm / R_T) * 1.02, rl = R_L / R_T;
    if (gamma < um - rl) return { tipo: 'totale', solare: false, gamma: gamma };
    if (gamma < um + rl) return { tipo: 'parziale', solare: false, gamma: gamma };
    if (gamma < pe + rl) return { tipo: 'penombra', solare: false, gamma: gamma };
    return null;
  }
  function sizigie(jd0, jd1) {
    var out = [], k = Math.floor((jd0 - 2451550.09766) / 29.530588861) - 1;
    for (; ; k += 0.5) {
      var appr = 2451550.09766 + 29.530588861 * k; if (appr > jd1 + 20) break;
      var nuova = Math.abs(k - Math.round(k)) < 0.25, jd = sizigia(appr, nuova ? 0 : 180);
      if (jd < jd0 || jd > jd1) continue;
      var L = luna(jd), ecl = tipoEclisse(L, nuova);
      out.push({ jd: jd, nuova: nuova, beta: L.beta, dist: L.dist, eclisse: ecl });
    }
    return out;
  }

  /* ── i satelliti medicei: longitudini medie (Meeus, cap. 44, t da JD 2443000,5) ── */
  var MEDICEI = [
    ['io', 'Io', 106.07719, 203.488955790, 421700, 1821.6, 8.931938e22],
    ['europa', 'Europa', 175.73161, 101.374724735, 671034, 1560.8, 4.799844e22],
    ['ganimede', ['Ganimede', 'Ganymede'], 120.55883, 50.317609207, 1070412, 2634.1, 1.4819e23],
    ['callisto', 'Callisto', 84.44459, 21.571071177, 1882709, 2410.3, 1.075938e23]
  ];
  function medicei(jd) { var d = jd - 2443000.5; return MEDICEI.map(function (m) { return norm360(m[2] + m[3] * d); }); }
  function laplace(jd) { var l = medicei(jd); return norm360(l[0] - 3 * l[1] + 2 * l[2]); }
  function periodiMedicei() { return MEDICEI.map(function (m) { return 360 / m[3]; }); }

  /* ── Saturno e gli anelli ── */
  var GM_SAT = 3.7931187e7, R_SAT = 60268; /* km³/s², km */
  function periodoAnello(rkm) { return 2 * Math.PI * Math.sqrt(rkm * rkm * rkm / GM_SAT) / 3600; } /* ore */
  /* raggio dove un'orbita fa p giri mentre il satellite di periodo P ne fa q */
  function raggioRisonanza(Pore, p, q) { var Pr = Pore * q / p, s = Pr * 3600 / (2 * Math.PI); return Math.cbrt(GM_SAT * s * s); }
  var MIMANTE = { a: 185539, P: 22.6 }; MIMANTE.P = periodoAnello(MIMANTE.a);
  var GIANO = { a: 151460 }; GIANO.P = periodoAnello(GIANO.a);
  /* profilo degli anelli: [r interno, r esterno (km), densita' relativa, nome] */
  var ANELLI = [[74658, 92000, 0.18, 'C'], [92000, 117580, 1.0, 'B'], [117580, 122170, 0.04, 'Cassini'], [122170, 133423, 0.62, 'A'], [133423, 133745, 0.0, 'Encke'], [133745, 136775, 0.55, 'A']];

  /* ── piccoli corpi: elementi casuali riproducibili ──
     fascia principale con le lacune di Kirkwood (risonanze 3:1, 5:2, 7:3, 2:1 con
     Giove, dove le orbite vengono svuotate), troiani a ±60° da Giove, fascia di Kuiper
     con i plutini in risonanza 3:2 con Nettuno */
  function lacunaKirkwood(p, q) { return 5.2029 * Math.pow(q / p, 2 / 3); }
  function piccoliCorpi(nF, nT, nK, seme) {
    var rnd = mulberry32(seme || 2024), n = nF + nT + nK, el = new Float32Array(n * 6), tipo = new Uint8Array(n);
    var lac = [[3, 1], [5, 2], [7, 3], [2, 1]].map(function (r) { return lacunaKirkwood(r[0], r[1]); });
    var Lg = 34.39644051 * GRAD, wg = 14.72847983 * GRAD; /* longitudine media e del perielio di Giove a J2000 */
    function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd()); }
    for (var k = 0; k < n; k++) {
      var a, e, inc, O = rnd() * 2 * Math.PI, w = rnd() * 2 * Math.PI, M = rnd() * 2 * Math.PI;
      if (k < nF) {
        tipo[k] = 0;
        do { a = 2.1 + 1.2 * Math.pow(rnd(), 0.8); var vicino = lac.some(function (L) { return Math.abs(a - L) < 0.035; }); } while (vicino && rnd() < 0.93);
        e = Math.min(0.3, Math.abs(gauss() * 0.08)); inc = Math.abs(gauss() * 7) * GRAD;
      } else if (k < nF + nT) {
        tipo[k] = 1; a = 5.2029 + gauss() * 0.06; e = Math.abs(gauss() * 0.05); inc = Math.abs(gauss() * 10) * GRAD;
        var lam = Lg + (rnd() < 0.5 ? 60 : -60) * GRAD + gauss() * 14 * GRAD; M = lam - O - w;
      } else {
        tipo[k] = 2;
        if (rnd() < 0.25) { a = 39.45 + gauss() * 0.2; e = 0.1 + rnd() * 0.2; } else { a = 42 + rnd() * 6; e = Math.abs(gauss() * 0.06); }
        inc = Math.abs(gauss() * 8) * GRAD;
      }
      el.set([a, e, inc, O, w, M], k * 6);
    }
    return { el: el, tipo: tipo, n: n, lacune: lac, wg: wg };
  }
  /* scala logaritmica delle distanze: 1 UA → 8,4 unita', 30 UA → 25 */
  function scalaLog(r) { return 12 * Math.log10(1 + r / 0.25); }

  /* ── contorni dei continenti (lon, lat; molto semplificati) per la tessitura della Terra ── */
  var CONTINENTI = [
    [-168, 66, -162, 70, -156, 71.3, -140, 69.6, -128, 70, -115, 68.5, -95, 72, -82, 73, -80, 63, -94, 59, -92, 57, -82, 55, -79, 52, -77, 58.5, -71, 61, -64, 60, -61, 56, -56, 52, -60, 47, -66, 44.5, -70, 41.5, -74, 40.5, -76, 37, -75.5, 35, -81, 31.5, -80, 27, -80.5, 25.2, -82.5, 28, -84, 30, -89, 30.2, -94, 29.5, -97, 27.5, -97.5, 22, -96, 19, -91, 18.8, -90.5, 21, -87, 21.5, -88, 16, -83.5, 15, -83.5, 11, -79.5, 9, -77.5, 8.5, -80, 7.5, -85, 10, -87.5, 13, -92, 14.5, -95, 16, -105, 19.5, -106, 23, -110, 23, -112.5, 29, -114.5, 31, -114, 29, -110, 24, -112, 27, -117, 32.5, -120.5, 34.5, -124, 40, -124.5, 48, -127, 50.5, -131, 54, -135, 57.5, -140, 60, -147, 61, -152, 59, -158, 57, -163, 55, -157, 58.5, -162, 60, -165, 62.5, -161, 64.5],
    [-77, 8, -72, 12, -63, 10.5, -60, 8.5, -52, 5, -50, 0, -44, -2.5, -35, -5, -35, -9, -39, -13.5, -39, -18, -42, -22.5, -48, -26, -48.5, -28.5, -53, -34, -58, -34.5, -57, -38.5, -62, -39, -65, -42, -63.5, -43, -67, -46, -66, -48, -69, -51, -68.5, -53, -71, -54.5, -74, -52, -75, -47, -73.5, -42, -73, -37, -71.5, -31, -70.5, -23, -70, -18, -76, -14, -80, -7, -81, -4.5, -80, -1, -80, 1, -78, 3, -77.5, 6.5],
    [-17, 21, -16, 28, -9.5, 30.5, -6, 35.8, -2, 35, 3, 36.8, 10, 37.3, 11, 33.5, 20, 30.5, 20, 32, 29, 31, 32.5, 31.3, 34, 27.5, 37, 22, 38.5, 18, 43, 12.5, 51, 11.8, 51, 10, 47.5, 4.5, 41, -2, 39, -5, 39.5, -10, 40.5, -15, 35, -20, 35.5, -24, 32.7, -26, 32, -29, 28, -33, 20, -35, 18.3, -34, 17.5, -30, 15, -27, 11.8, -17, 13.5, -11, 12.3, -6, 9, -1, 9.5, 3.5, 6, 4.3, 2, 6.3, -2, 4.8, -7.5, 4.4, -11.5, 6.8, -13.3, 9, -16.5, 12.5, -17.5, 14.7, -16.5, 19.5],
    [44, -25, 47, -25, 50.4, -15.5, 49.5, -12, 47.9, -13.5, 44.4, -16.3, 43.3, -22],
    [-9, 43, -1.5, 43.5, -1.2, 46, -4.5, 48, -1.5, 49.5, 2, 51, 4.5, 52.5, 8.5, 53.6, 8, 57, 10.5, 57.7, 12, 55.5, 14, 54, 21, 54.8, 21.5, 57, 24, 57.5, 23.5, 59.5, 29, 60, 22, 60.5, 21.5, 63, 25, 65.5, 21.5, 65.8, 17.5, 62.5, 18.5, 60, 16.5, 56.2, 12.8, 56, 10.7, 59.3, 5.5, 58.5, 5, 62, 13, 66, 17, 69, 25, 71, 31, 70, 40, 67.5, 41, 66.5, 34.5, 66, 44, 68.5, 53, 68.5, 59, 68.8, 68, 68.5, 73, 72.8, 80, 72.5, 87, 74.5, 100, 77.8, 113, 73.5, 129, 72, 140, 72.5, 160, 70, 170, 70, 180, 69, 180, 65.5, 178, 64.5, 170, 60, 163, 60, 156, 57.5, 156, 51, 160, 54, 163, 56, 162, 58, 155, 59.3, 142, 59.3, 135, 54.6, 141, 52, 140, 48, 133, 42.8, 129.5, 41, 129, 35.5, 126.5, 34.5, 126, 37.7, 124.5, 40, 121.5, 40.5, 122, 37, 119, 35, 121.5, 31.5, 122, 29, 119.5, 25.5, 116, 22.7, 110.5, 21, 108, 21.5, 106, 19, 109, 15, 109, 11.5, 105, 8.6, 103, 10.5, 100.5, 13.5, 99.5, 10, 101.5, 6.5, 103.5, 1.4, 101, 2.5, 98.5, 8, 98, 16, 94.5, 17, 94, 21, 91.5, 22.5, 90, 21.8, 86.5, 20, 85, 19.3, 80.2, 15.5, 80, 10, 77.5, 8, 76, 10, 73, 17, 72.5, 21, 68.5, 23.5, 66.5, 25.5, 61.5, 25.2, 57, 25.7, 56.3, 26.5, 54, 24, 51.5, 24.5, 50, 26.5, 48.5, 29.5, 47.5, 30, 50.5, 27, 56, 24, 59.8, 22.5, 57.8, 19, 55, 17, 52, 16, 45, 13, 43, 13, 39, 21.5, 35, 28, 32.6, 30, 34, 31.5, 35.5, 33.8, 36, 36.5, 30, 36.3, 26.5, 38.3, 26.2, 40.5, 29, 41.2, 28, 41.6, 28.5, 43.5, 30.5, 46.5, 33.5, 46, 35.5, 45.3, 39, 47, 38, 44.5, 41.5, 41.5, 36, 41.5, 33.5, 42, 31, 41, 28.2, 41, 26, 40.8, 23, 40.3, 23.5, 38, 22.4, 36.5, 21, 38.8, 19.5, 41.8, 16, 43.5, 13.5, 45.6, 12.4, 44.5, 14, 42, 16, 40.5, 18.5, 40.2, 16, 38, 15.6, 40.2, 12.5, 41.5, 10, 44, 7.5, 43.8, 3.2, 43.3, 3.2, 42, 0.5, 40.5, -0.3, 39.5, 0, 38.6, -2, 36.8, -5.5, 36, -6.5, 37, -9, 37, -8.8, 42],
    [-5.7, 50, 1.5, 51.2, 1.7, 52.7, 0, 53.5, -2, 55.8, -1.8, 57.6, -4, 58.6, -5, 58.6, -6.3, 56.5, -5, 55, -3, 54, -4.5, 53.3, -4.5, 51.7],
    [-10, 51.6, -6, 52, -6, 54, -7.5, 55.2, -10, 54.2],
    [130, 31, 131.5, 31.5, 132, 33.8, 135, 33.5, 139.8, 35, 141, 37, 141.5, 40.5, 140, 41.5, 141.5, 42.5, 143, 42, 145.5, 43.3, 142, 45.5, 140.4, 43.3, 140, 40.5, 139, 38, 137, 37, 133, 35.5, 130.9, 34],
    [114, -22, 114, -26.5, 115, -34, 118, -35, 123.5, -34, 126, -32.3, 131, -31.5, 135, -34.8, 138, -35.5, 140, -38, 144, -38.3, 146.5, -39, 150, -37.5, 153, -31.5, 153.5, -28, 153, -25, 150, -22.5, 146, -19, 145.4, -15, 143.5, -14, 142.5, -10.7, 141.5, -13.5, 141.5, -17, 139.5, -17.5, 136, -15.5, 137, -12, 132.5, -11.5, 130, -13, 129.5, -15, 126, -14, 122, -17.5, 121, -19.5, 117, -20.7],
    [172.7, -34.5, 174.5, -36.5, 178, -37.6, 176.9, -39.6, 175, -41.5, 172.5, -40.8, 170.5, -44, 166.5, -46, 169, -46.6, 172.8, -43.8, 174.3, -41.7, 173, -40],
    [-73, 78, -60, 82, -35, 83.5, -20, 82, -18, 77, -22, 70.5, -32, 68, -40, 65, -43, 60, -48, 61, -52, 65, -54, 69.5, -56, 73, -66, 76],
    [-24, 65.5, -18, 66.5, -13.5, 65, -18, 63.4, -22.5, 63.8],
    [-90, 72, -80, 74, -68, 70, -62, 66.5, -65, 63, -72, 65, -78, 64.5, -75, 68.8],
    [-85, 21.8, -74, 20, -77, 19.8, -82.5, 22.6],
    [95.5, 5.5, 98, 4, 104, -1, 106, -6, 104.5, -5.8, 101, -2.5, 98.5, 1, 95.3, 3],
    [109, 1.5, 110, -2, 116, -4, 117.5, 0, 119, 5, 116.5, 7, 113.5, 3.5],
    [131, -1, 138, -1.5, 146, -5.5, 150, -10.5, 143, -9, 138, -8.3, 134.5, -4],
    [105.5, -6.8, 114.5, -7.8, 114, -8.7, 106, -7.6],
    [-180, -90, -180, -78, -160, -77, -150, -76, -140, -75, -120, -73, -100, -72, -80, -73, -68, -70, -62, -64, -58, -63.5, -60, -68, -62, -73, -50, -78, -35, -78, -25, -73, -10, -71, 0, -70, 20, -69.5, 40, -68.5, 55, -66.5, 70, -68, 80, -67, 100, -66, 120, -66.5, 140, -66.5, 160, -70, 170, -72, 180, -78, 180, -90]
  ];

  F.calcolo.sistemasolare = {
    giuliano: giuliano, calendario: calendario, gmst: gmst, kepleroE: kepleroE, residuoKeplero: residuoKeplero,
    ELEMENTI: ELEMENTI, NANI: NANI, CORPI: CORPI, elementi: elementi, posizione: posizione, velocita: velocita, orbita: orbita, distanza: distanza,
    periodoKepler: periodoKepler, polo: polo, normaleOrbita: normaleOrbita, obliquita: obliquita, eqEcl: eqEcl, eclEq: eclEq,
    sole: sole, durataGiorno: durataGiorno, luna: luna, sizigie: sizigie, tipoEclisse: tipoEclisse,
    MEDICEI: MEDICEI, medicei: medicei, laplace: laplace, periodiMedicei: periodiMedicei,
    periodoAnello: periodoAnello, raggioRisonanza: raggioRisonanza, MIMANTE: MIMANTE, GIANO: GIANO, ANELLI: ANELLI,
    piccoliCorpi: piccoliCorpi, lacunaKirkwood: lacunaKirkwood, scalaLog: scalaLog, CONTINENTI: CONTINENTI, GM_SOLE: GM_SOLE, UA: UA
  };

  /* ═══ tessiture procedurali ═════════════════════════════════════════════
     Disegnate su tela pixel per pixel con rumore a valori (fBm) periodico in
     longitudine, cosi' non c'e' la cucitura. Ogni tela si calcola una volta,
     a turno, in un setTimeout: la scheda si apre subito con colori pieni e
     le tessiture arrivano una dopo l'altra (mai un blocco lungo). */
  function Rumore(seme) {
    var rnd = mulberry32(seme), val = new Float32Array(256), perm = new Uint8Array(256), i;
    for (i = 0; i < 256; i++) { val[i] = rnd(); perm[i] = i; }
    for (i = 255; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), s = perm[i]; perm[i] = perm[j]; perm[j] = s; }
    function h(x, y) { return val[perm[(perm[x & 255] + y) & 255]]; }
    function vn(x, y, px) {
      var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px;
      var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), a = h(x0, yi), b = h(x1, yi), c = h(x0, yi + 1), d = h(x1, yi + 1);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    }
    /* u ∈ [0,1) periodico, v ∈ [0,1] */
    this.fbm = function (u, v, ott, f0) { var s = 0, amp = 0.5, f = f0 || 4, tot = 0; for (var k = 0; k < ott; k++) { s += amp * vn(u * f, v * f * 0.5 + k * 17.3, f); tot += amp; amp *= 0.5; f *= 2; } return s / tot; };
  }
  function tela(W, H) { var c = D.createElement('canvas'); c.width = W; c.height = H; return c; }
  /* una pittura e' una ricetta: dimensioni, colore di ogni pixel, ritocchi finali.
     Si esegue a righe, in fette di pochi millisecondi */
  function dipingi(W, H, f) { return { W: W, H: H, f: f, dopo: [] }; }
  function esegui(def) {
    var W = def.W, H = def.H, c = tela(W, H), q = c.getContext('2d'), img = q.createImageData(W, H), d = img.data, y = 0;
    return function (ms) {
      var t0 = Date.now();
      while (y < H) {
        var v = (y + 0.5) / H, lat = 90 - 180 * v;
        for (var x = 0; x < W; x++) {
          var u = (x + 0.5) / W, col = def.f(u, v, 360 * u - 180, lat), k = 4 * (y * W + x);
          d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = col.length > 3 ? col[3] : 255;
        }
        y++;
        if (Date.now() - t0 > ms) break;
      }
      if (y < H) return null;
      q.putImageData(img, 0, 0); def.dopo.forEach(function (g) { g(c); });
      return c;
    };
  }
  function mix(a, b, f) { f = Math.max(0, Math.min(1, f)); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function liscio(a, b, x) { var u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); }
  function crateri(def, n, seme, rmax, scuro) {
    def.dopo.push(function (c) {
      var q = c.getContext('2d'), W = c.width, H = c.height, rnd = mulberry32(seme);
      for (var i = 0; i < n; i++) {
        var x = rnd() * W, y = H * (0.08 + 0.84 * rnd()), r = Math.pow(rnd(), 3) * rmax + 1.2, sx = 1 / Math.max(0.25, Math.cos((0.5 - y / H) * Math.PI));
        q.save(); q.translate(x, y); q.scale(sx, 1);
        q.fillStyle = 'rgba(0,0,0,' + (scuro || 0.16) + ')'; q.beginPath(); q.arc(0, 0, r, 0, 2 * Math.PI); q.fill();
        q.strokeStyle = 'rgba(255,255,255,.16)'; q.lineWidth = Math.max(0.8, r * 0.18); q.beginPath(); q.arc(-r * 0.08, -r * 0.08, r, Math.PI * 0.9, Math.PI * 1.9); q.stroke();
        q.restore();
      }
    });
    return def;
  }
  function mascheraContinenti(W, H) {
    var c = tela(W, H), q = c.getContext('2d'); q.fillStyle = '#fff';
    CONTINENTI.forEach(function (P) { q.beginPath(); for (var i = 0; i < P.length; i += 2) { var x = (P[i] + 180) / 360 * W, y = (90 - P[i + 1]) / 180 * H; if (i) q.lineTo(x, y); else q.moveTo(x, y); } q.closePath(); q.fill(); });
    return q.getImageData(0, 0, W, H).data;
  }
  var PITTORI = {
    terra: function () {
      var W = 1024, H = 512, N = new Rumore(11), mk = mascheraContinenti(W, H);
      return dipingi(W, H, function (u, v, lon, lat) {
        var n = N.fbm(u, v, 5, 6), dx = Math.round((n - 0.5) * 14), dy = Math.round((N.fbm(u + 0.37, v, 3, 5) - 0.5) * 10);
        var x = Math.min(W - 1, Math.max(0, Math.floor(u * W) + dx)), y = Math.min(H - 1, Math.max(0, Math.floor(v * H) + dy)), terra = mk[4 * (y * W + x)] > 127, al = Math.abs(lat);
        if (!terra) { var prof = 0.6 + 0.4 * N.fbm(u, v, 3, 3); var mare = mix([8, 30, 80], [22, 70, 140], prof); if (al > 72) mare = mix(mare, [230, 240, 250], liscio(72, 78, al + n * 6)); return mare; }
        var deserto = liscio(10, 20, al) * (1 - liscio(32, 40, al)) * liscio(0.42, 0.62, N.fbm(u + 0.5, v, 4, 5) + 0.12);
        var verde = mix([38, 92, 36], [92, 120, 52], n), col = mix(verde, [196, 164, 110], deserto);
        col = mix(col, [120, 110, 92], liscio(52, 68, al) * 0.7);
        return mix(col, [245, 248, 252], liscio(62, 70, al + n * 10));
      });
    },
    nubi: function () {
      var N = new Rumore(23);
      return dipingi(512, 256, function (u, v, lon, lat) {
        var n = N.fbm(u + 0.03 * Math.sin(lat * 0.2), v, 6, 5), banda = 0.18 * Math.exp(-lat * lat / 30) + 0.12 * Math.exp(-Math.pow(Math.abs(lat) - 55, 2) / 120);
        var a = liscio(0.55, 0.78, n + banda); return [255, 255, 255, Math.round(200 * a)];
      });
    },
    mercurio: function () { var N = new Rumore(5); return crateri(dipingi(512, 256, function (u, v) { var n = N.fbm(u, v, 5, 6); return mix([88, 84, 80], [170, 164, 156], n); }), 420, 5, 14, 0.2); },
    venere: function () { var N = new Rumore(7); return dipingi(512, 256, function (u, v, lon, lat) { var n = N.fbm(u + 0.08 * Math.sin(lat * 0.09), v, 5, 4), y = 0.12 * Math.sin(lat * 0.12 + n * 6); return mix([196, 160, 96], [246, 226, 170], n + y); }); },
    marte: function () {
      var N = new Rumore(9);
      return crateri(dipingi(512, 256, function (u, v, lon, lat) {
        var n = N.fbm(u, v, 6, 4), m = N.fbm(u + 0.5, v, 3, 3), col = mix([150, 62, 28], [214, 120, 70], n);
        col = mix(col, [86, 44, 30], liscio(0.55, 0.7, m) * (1 - liscio(40, 60, Math.abs(lat))));
        return mix(col, [244, 240, 236], liscio(74, 80, Math.abs(lat) + (n - 0.5) * 12));
      }), 140, 9, 8, 0.12);
    },
    giove: function () {
      var N = new Rumore(13), bande = [[90, [196, 186, 170]], [62, [178, 150, 120]], [48, [230, 214, 186]], [36, [186, 132, 92]], [24, [238, 222, 196]], [17, [168, 108, 70]], [7, [242, 228, 204]], [-7, [226, 196, 160]], [-18, [164, 102, 66]], [-26, [236, 220, 194]], [-36, [184, 138, 100]], [-48, [226, 210, 182]], [-62, [176, 150, 122]], [-90, [190, 182, 168]]];
      return dipingi(1024, 512, function (u, v, lon, lat) {
        var tur = N.fbm(u, v, 6, 8), l = lat + (tur - 0.5) * 7 + 1.4 * Math.sin(u * 2 * Math.PI * 9 + lat * 0.4) * liscio(5, 30, Math.abs(lat));
        var col = bande[bande.length - 1][1];
        for (var k = 0; k < bande.length - 1; k++) if (l <= bande[k][0] && l > bande[k + 1][0]) { var f = (bande[k][0] - l) / (bande[k][0] - bande[k + 1][0]); col = mix(bande[k][1], bande[k + 1][1], liscio(0.35, 0.65, f)); break; }
        col = mix(col, [255, 255, 255], (N.fbm(u + 0.3, v, 4, 16) - 0.5) * 0.35);
        /* la Grande Macchia Rossa a 22° S, con il vortice */
        var dl = norm180(lon - 40) / 13, db = (lat + 22) / 6.5, r2 = dl * dl + db * db;
        if (r2 < 2.2) { var sw = 0.5 + 0.5 * Math.sin(Math.sqrt(r2) * 9 - Math.atan2(db, dl) * 2); col = mix(col, mix([186, 76, 48], [226, 136, 96], sw * 0.6), liscio(1.3, 0.55, r2)); }
        return col;
      });
    },
    saturno: function () {
      var N = new Rumore(17);
      return dipingi(1024, 512, function (u, v, lon, lat) {
        var tur = N.fbm(u, v, 5, 8), l = lat + (tur - 0.5) * 3, b = 0.5 + 0.5 * Math.sin(l * 0.32) * Math.cos(l * 0.11);
        var col = mix([196, 166, 112], [242, 222, 172], b);
        col = mix(col, [150, 150, 140], liscio(70, 82, Math.abs(lat)) * 0.6);
        /* l'esagono polare nord a 78° N */
        var r = 90 - lat, ang = (lon * GRAD) % (Math.PI / 3), hx = 12 / Math.cos(ang - Math.PI / 6);
        if (lat > 70 && Math.abs(r - hx) < 1.2) col = mix(col, [120, 110, 90], 0.6);
        return col;
      });
    },
    urano: function () { var N = new Rumore(19); return dipingi(512, 256, function (u, v, lon, lat) { var n = N.fbm(u, v, 3, 4); return mix([150, 210, 220], [196, 236, 240], 0.5 + 0.25 * Math.sin(lat * 0.15) + (n - 0.5) * 0.3); }); },
    nettuno: function () {
      var N = new Rumore(29);
      return dipingi(512, 256, function (u, v, lon, lat) {
        var n = N.fbm(u, v, 5, 6), col = mix([40, 70, 190], [96, 140, 236], 0.5 + 0.3 * Math.sin(lat * 0.2) + (n - 0.5) * 0.5);
        var dl = norm180(lon + 30) / 14, db = (lat + 20) / 7; if (dl * dl + db * db < 1) col = mix(col, [20, 30, 100], 0.7);
        if (liscio(0.66, 0.74, N.fbm(u + 0.4, v, 4, 10)) > 0.5 && Math.abs(lat + 40) < 6) col = mix(col, [240, 245, 255], 0.8);
        return col;
      });
    },
    plutone: function () {
      var N = new Rumore(31);
      return crateri(dipingi(512, 256, function (u, v, lon, lat) {
        var n = N.fbm(u, v, 5, 5), col = mix([120, 84, 60], [214, 188, 156], n);
        var dl = norm180(lon - 175) / 30, db = (lat - 18) / 22, r = Math.sqrt(dl * dl + db * db), cuore = r < 1 + 0.25 * Math.sin(Math.atan2(db, dl) * 2);
        return cuore ? mix(col, [246, 236, 222], 0.8) : mix(col, [70, 40, 30], liscio(-10, -30, lat) * 0.5);
      }), 60, 31, 6, 0.1);
    },
    luna: function () {
      var N = new Rumore(37), mari = [[-15, 20, 22, 14], [10, 25, 13, 10], [30, 10, 11, 8], [-40, 15, 28, 22], [55, 15, 7, 6], [-20, -10, 16, 9], [35, -10, 9, 9]];
      return crateri(dipingi(1024, 512, function (u, v, lon, lat) {
        var n = N.fbm(u, v, 6, 6), col = mix([128, 126, 122], [206, 204, 198], n), m = 0;
        mari.forEach(function (M) { var dl = norm180(lon - M[0]) / M[2], db = (lat - M[1]) / M[3]; m = Math.max(m, liscio(1.2, 0.6, dl * dl + db * db + (n - 0.5))); });
        return mix(col, [70, 72, 78], m * 0.8);
      }), 900, 37, 16, 0.18);
    },
    cerere: function () { var N = new Rumore(41); return crateri(dipingi(256, 128, function (u, v, lon, lat) { var n = N.fbm(u, v, 5, 6), c = mix([90, 88, 86], [150, 146, 140], n); var dl = norm180(lon - 120) / 4, db = (lat - 20) / 3; return dl * dl + db * db < 1 ? [250, 250, 245] : c; }), 160, 41, 8, 0.2); },
    eris: function () { var N = new Rumore(43); return dipingi(256, 128, function (u, v) { return mix([196, 196, 206], [246, 246, 250], N.fbm(u, v, 4, 4)); }); },
    haumea: function () { var N = new Rumore(47); return dipingi(256, 128, function (u, v, lon, lat) { var c = mix([200, 206, 214], [240, 242, 246], N.fbm(u, v, 4, 4)); var dl = norm180(lon) / 25, db = lat / 15; return dl * dl + db * db < 1 ? mix(c, [150, 70, 70], 0.5) : c; }); },
    makemake: function () { var N = new Rumore(53); return dipingi(256, 128, function (u, v) { return mix([150, 96, 70], [220, 170, 130], N.fbm(u, v, 4, 4)); }); },
    io: function () { var N = new Rumore(59); return crateri(dipingi(256, 128, function (u, v, lon, lat) { var n = N.fbm(u, v, 5, 6), m = N.fbm(u + 0.5, v, 3, 8); var c = mix([220, 190, 80], [250, 240, 160], n); c = mix(c, [150, 70, 30], liscio(0.62, 0.72, m)); return mix(c, [150, 120, 90], liscio(60, 80, Math.abs(lat))); }), 50, 59, 4, 0.25); },
    europa: function () {
      var N = new Rumore(61), def = dipingi(256, 128, function (u, v) { return mix([196, 180, 150], [244, 238, 226], N.fbm(u, v, 4, 5)); });
      def.dopo.push(function (c) {
        var q = c.getContext('2d'), rnd = mulberry32(61); q.strokeStyle = 'rgba(140,80,50,.55)'; q.lineWidth = 1;
        for (var i = 0; i < 40; i++) { q.beginPath(); var x = rnd() * 256, y = rnd() * 128; q.moveTo(x, y); q.quadraticCurveTo(x + (rnd() - 0.5) * 120, y + (rnd() - 0.5) * 60, x + (rnd() - 0.5) * 200, y + (rnd() - 0.5) * 80); q.stroke(); }
      });
      return def;
    },
    ganimede: function () { var N = new Rumore(67); return crateri(dipingi(256, 128, function (u, v) { var n = N.fbm(u, v, 5, 4); return mix([96, 86, 74], [186, 176, 160], liscio(0.4, 0.6, n)); }), 120, 67, 5, 0.12); },
    callisto: function () {
      var N = new Rumore(71), def = dipingi(256, 128, function (u, v) { return mix([60, 52, 44], [110, 98, 84], N.fbm(u, v, 5, 6)); });
      def.dopo.push(function (c) { var q = c.getContext('2d'), rnd = mulberry32(71); q.fillStyle = 'rgba(255,255,255,.7)'; for (var i = 0; i < 260; i++) { q.beginPath(); q.arc(rnd() * 256, 8 + rnd() * 112, rnd() * 1.4 + 0.3, 0, 7); q.fill(); } });
      return def;
    },
    anelliS: function () {
      /* profilo radiale: 1024 colonne da 74 658 km (C interno) a 136 775 km (A esterno) */
      var c = tela(1024, 4), q = c.getContext('2d'), img = q.createImageData(1024, 4), d = img.data, N = new Rumore(73);
      for (var x = 0; x < 1024; x++) {
        var r = 74658 + (136775 - 74658) * (x + 0.5) / 1024, dens = 0, col = [210, 196, 170];
        ANELLI.forEach(function (A) { if (r >= A[0] && r < A[1]) dens = A[2]; });
        if (r < 92000) col = [150, 140, 128]; else if (r > 122170) col = [200, 190, 172];
        var fine = 0.75 + 0.5 * N.fbm(x / 1024, 0.5, 5, 64);
        for (var y = 0; y < 4; y++) { var k = 4 * (y * 1024 + x); d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = Math.round(255 * Math.min(1, dens * fine * 0.92)); }
      }
      q.putImageData(img, 0, 0); return c;
    },
    anelliU: function () { var c = tela(256, 4), q = c.getContext('2d'); q.clearRect(0, 0, 256, 4); q.fillStyle = 'rgba(180,200,210,.5)'; [20, 60, 90, 140, 236].forEach(function (x, i) { q.fillRect(x, 0, i === 4 ? 8 : 2, 4); }); return c; },
    bagliore: function () {
      var c = tela(256, 256), q = c.getContext('2d'), g = q.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,250,230,1)'); g.addColorStop(0.12, 'rgba(255,220,140,.85)'); g.addColorStop(0.3, 'rgba(255,170,60,.32)'); g.addColorStop(0.6, 'rgba(255,120,30,.08)'); g.addColorStop(1, 'rgba(255,100,20,0)');
      q.fillStyle = g; q.fillRect(0, 0, 256, 256); return c;
    }
  };
  var tele = {}, attese = {}, coda = [], lavoro = false, corrente = null;
  /* la tessitura arriva quando e' pronta: fn(canvas) */
  function tessitura(nome, fn) {
    if (tele[nome]) { fn(tele[nome]); return; }
    if (attese[nome]) { attese[nome].push(fn); return; }
    attese[nome] = [fn]; coda.push(nome);
    if (!lavoro) { lavoro = true; setTimeout(prossima, 0); }
  }
  function prossima() {
    try {
      if (!corrente) {
        if (!coda.length) { lavoro = false; return; }
        var nome = coda.shift(), r = PITTORI[nome]();
        corrente = { nome: nome, passo: r.getContext ? function () { return r; } : esegui(r) };
      }
      var c = corrente.passo(12);
      if (c) {
        var n = corrente.nome, fs = attese[n] || []; corrente = null; tele[n] = c; delete attese[n];
        fs.forEach(function (f) { try { f(c); } catch (e) { if (globale.console) console.error(e); } });
      }
    } catch (e) { corrente = null; if (globale.console) console.error(e); }
    setTimeout(prossima, 0);
  }

  /* ═══ pezzi 3D comuni ═══════════════════════════════════════════════════ */
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
        var S = new lab.Scena(destra, 0.7);
        S.cam.far = 6000; S.cam.updateProjectionMatrix();
        /* luci del Laboratorio attenuate: qui la luce viene dal Sole */
        S.sc.children.forEach(function (o) { if (o.isHemisphereLight) o.intensity = 0.16; else if (o.isDirectionalLight) o.intensity = 0.06; });
        div._scena = S;
        costruisci(pan, S, destra);
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function casella(pan, etichetta, valore, cambia) {
    var c = F.el('input', { type: 'checkbox' }); c.checked = !!valore;
    var l = F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(etichetta) })]);
    c.addEventListener('change', function () { cambia(c.checked); }); pan.appendChild(l); return c;
  }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  /* il materiale nasce gia' con una mappa (4×4 pixel del colore di base): quando la tessitura
     procedurale e' pronta si cambia solo l'immagine, senza ricompilare lo shader */
  function segnaposto(T, colore, alfa) {
    var c = tela(4, 4), q = c.getContext('2d'), col = new T.Color(colore == null ? 0xffffff : colore);
    q.fillStyle = 'rgba(' + Math.round(col.r * 255) + ',' + Math.round(col.g * 255) + ',' + Math.round(col.b * 255) + ',' + (alfa == null ? 1 : alfa) + ')'; q.fillRect(0, 0, 4, 4);
    return new T.CanvasTexture(c);
  }
  function materiale(T, nome, colore, opz) {
    opz = opz || {};
    var m = new T.MeshStandardMaterial({ color: 0xffffff, roughness: opz.ruvido != null ? opz.ruvido : 0.85, metalness: 0, transparent: !!opz.trasparente, depthWrite: !opz.trasparente });
    m.map = segnaposto(T, colore, opz.trasparente ? 0 : 1);
    if (nome) tessitura(nome, function (c) { var tx = m.map; tx.image = c; tx.anisotropy = 4; tx.needsUpdate = true; });
    return m;
  }
  /* una sfera con i poli lungo z (la tessitura equirettangolare ha la longitudine 0 su +x) */
  function geoSfera(T, seg) { var g = new T.SphereGeometry(1, seg || 48, Math.round((seg || 48) * 0.66)); g.rotateX(Math.PI / 2); return g; }
  /* anello con le coordinate u radiali (0 interno, 1 esterno) per la tessitura del profilo */
  function geoAnello(T, r0, r1) {
    var g = new T.RingGeometry(r0, r1, 160, 1), p = g.attributes.position, uv = g.attributes.uv;
    for (var i = 0; i < p.count; i++) { var r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (r - r0) / (r1 - r0), 0.5); }
    return g;
  }
  function materialeAnello(T, nome, opac) {
    var m = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: opac || 1, side: T.DoubleSide, depthWrite: false });
    m.map = segnaposto(T, 0xd8c8a8, 0);
    tessitura(nome, function (c) { m.map.image = c; m.map.needsUpdate = true; });
    return m;
  }
  /* il Sole: superficie granulare in uno shader (rumore 3D animato, oscuramento al bordo) */
  function sole3D(T, r) {
    var g = new T.Group();
    var mat = new T.ShaderMaterial({
      uniforms: { uT: { value: 0 } },
      vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: [
        'uniform float uT; varying vec3 vP; varying vec3 vN; varying vec3 vV;',
        'float h(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
        'float n3(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);',
        ' return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y), mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }',
        'void main(){ vec3 p = normalize(vP)*7.0; float s = 0.0, a = 0.5;',
        ' for (int i = 0; i < 5; i++){ s += a*n3(p + vec3(uT*0.03*float(i+1), -uT*0.02, uT*0.05)); p *= 2.07; a *= 0.5; }',
        ' float gr = smoothstep(0.25, 0.85, s); float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);',
        ' float limbo = 0.38 + 0.62*pow(mu, 0.55);',
        ' vec3 c = mix(vec3(0.93,0.38,0.06), vec3(1.0,0.92,0.62), gr);',
        ' gl_FragColor = vec4(c*limbo*1.12, 1.0); }'
      ].join('\n')
    });
    var sfera = new T.Mesh(geoSfera(T, 64), mat); sfera.scale.setScalar(r); g.add(sfera);
    tessitura('bagliore', function (c) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
      sp.scale.set(r * 7, r * 7, 1); g.add(sp);
    });
    g.userData.mat = mat;
    return g;
  }
  /* campo stellare con la Via Lattea: stelle concentrate verso il piano galattico */
  var EQ_GAL = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
  function stelle(T, R, n) {
    var rnd = mulberry32(99), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var l = rnd() * 2 * Math.PI, b, z;
      if (i < n * 0.45) { z = (rnd() + rnd() + rnd() - 1.5) * 0.18; b = Math.asin(Math.max(-1, Math.min(1, z))); } else b = Math.asin(2 * rnd() - 1);
      var g = [Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)];
      var eq = [EQ_GAL[0][0] * g[0] + EQ_GAL[1][0] * g[1] + EQ_GAL[2][0] * g[2], EQ_GAL[0][1] * g[0] + EQ_GAL[1][1] * g[1] + EQ_GAL[2][1] * g[2], EQ_GAL[0][2] * g[0] + EQ_GAL[1][2] * g[1] + EQ_GAL[2][2] * g[2]];
      var e = eqEcl(eq), lum = 0.25 + 0.75 * Math.pow(rnd(), 3), tinta = rnd();
      pos[3 * i] = e[0] * R; pos[3 * i + 1] = e[1] * R; pos[3 * i + 2] = e[2] * R;
      var c = tinta < 0.15 ? [1, 0.8, 0.6] : tinta < 0.3 ? [0.7, 0.8, 1] : [1, 1, 1];
      col[3 * i] = c[0] * lum; col[3 * i + 1] = c[1] * lum; col[3 * i + 2] = c[2] * lum;
    }
    var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Points(geo, new T.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
  }
  /* alone atmosferico (fresnel, additivo) */
  function atmosfera(T, r, colore, forza) {
    var m = new T.ShaderMaterial({
      uniforms: { uC: { value: new T.Color(colore) }, uF: { value: forza || 1 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 uC; uniform float uF; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5); gl_FragColor = vec4(uC*f*uF, f*uF); }',
      transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.FrontSide
    });
    var s = new T.Mesh(geoSfera(T, 48), m); s.scale.setScalar(r); return s;
  }
  function etichetta(T, testo, col) { var e = L3().testo3d(T, testo, col || '#cfe3f7', 1); e.userData.asp = e.scale.x / e.scale.y; return e; }
  function scalaEtichetta(e, cam, h) { var d = cam.position.distanceTo(e.getWorldPosition(e.userData.tmp || (e.userData.tmp = new e.position.constructor()))); var s = d * (h || 0.028); e.scale.set(s * e.userData.asp, s, 1); }
  /* clic o tocco senza trascinare: fn(x, y) in pixel della tela */
  function alClic(S, fn) {
    var el = S.ren.domElement, giu = null;
    el.addEventListener('pointerdown', function (e) { giu = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    el.addEventListener('pointerup', function (e) {
      if (!giu) return; var d = Math.hypot(e.clientX - giu.x, e.clientY - giu.y), dt = Date.now() - giu.t; giu = null;
      if (d < 7 && dt < 600) { var r = el.getBoundingClientRect(); fn(e.clientX - r.left, e.clientY - r.top, r.width, r.height); }
    });
  }
  /* comandi del tempo: ⏯, verso, velocita' (logaritmica), data, «oggi» */
  function orologio(pan, st, opz) {
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli del tempo', 'Time controls') });
    var bP = F.el('button', { type: 'button' }), bV = F.el('button', { type: 'button', testo: '⇄', title: t('Inverti il verso del tempo', 'Reverse time'), 'aria-label': t('Inverti il verso del tempo', 'Reverse time') });
    var bO = F.el('button', { type: 'button', testo: t('Oggi', 'Today') });
    riga.appendChild(bP); riga.appendChild(bV); riga.appendChild(bO); pan.appendChild(riga);
    function aggP() { bP.textContent = st.gira ? '❚❚' : '▶'; var n = st.gira ? t('Pausa', 'Pause') : t('Avvia', 'Play'); bP.title = n; bP.setAttribute('aria-label', n); bV.setAttribute('aria-pressed', String(st.verso < 0)); }
    bP.addEventListener('click', function () { st.gira = !st.gira; aggP(); if (opz.cambia) opz.cambia(); });
    bV.addEventListener('click', function () { st.verso = -st.verso; aggP(); });
    bO.addEventListener('click', function () { st.jd = daData(new Date()); aggD(true); if (opz.cambia) opz.cambia(true); });
    var lmin = Math.log10(opz.min), lmax = Math.log10(opz.max);
    F.cursore(pan, opz.etichetta, 0, 1, 0.01, (Math.log10(st.vel) - lmin) / (lmax - lmin), function (v) { st.vel = Math.pow(10, lmin + v * (lmax - lmin)); }, function (v) { return opz.formato(Math.pow(10, lmin + v * (lmax - lmin))); });
    var inp = F.el('input', { type: 'date', 'aria-label': t('Data', 'Date'), style: 'width:100%;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:5px 8px;font-family:inherit;box-sizing:border-box;color-scheme:dark' });
    inp.addEventListener('change', function () { var p = inp.value.split('-'); if (p.length === 3) { st.jd = giuliano(+p[0], +p[1], +p[2], 12); aggD(true); if (opz.cambia) opz.cambia(true); } });
    var et = F.el('b', { 'class': 'bsiFX-num', style: 'font-size:.95rem' });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: t('Data', 'Date') }), et]), inp]));
    var ultimo = '';
    function aggD(forza) { var s = testoData(st.jd, opz.ore); if (s !== ultimo || forza) { ultimo = s; et.textContent = s; if (D.activeElement !== inp) inp.value = testoData(st.jd).slice(0, 10); } }
    aggP(); aggD(true);
    return { data: aggD, play: aggP };
  }
  function formatoGiorni(v) { return v >= 300 ? fmt(v / 365.25) + t(' anni/s', ' yr/s') : v >= 1 ? fmt(v) + t(' giorni/s', ' days/s') : fmt(v * 24) + t(' ore/s', ' h/s'); }

  /* un pianeta: gruppo «asse» orientato sul polo, con il corpo che ruota e gli eventuali anelli */
  function pianeta3D(T, nome, R, colore) {
    var asse = new T.Group(), corpo = new T.Mesh(geoSfera(T, nome === 'giove' || nome === 'saturno' || nome === 'terra' ? 64 : 40), materiale(T, nome, colore));
    corpo.scale.setScalar(R); asse.add(corpo);
    if (nome === 'haumea') corpo.scale.set(R * 1.3, R * 1.0, R * 0.68);
    if (nome === 'giove' || nome === 'saturno') corpo.scale.z = R * (nome === 'giove' ? 0.935 : 0.902);
    if (nome === 'terra') {
      var nubi = new T.Mesh(geoSfera(T, 48), materiale(T, 'nubi', 0xffffff, { trasparente: true })); nubi.scale.setScalar(R * 1.012); asse.add(nubi); asse.userData.nubi = nubi;
      asse.add(atmosfera(T, R * 1.06, 0x5fa8ff, 1.1));
    }
    if (nome === 'saturno') { var an = new T.Mesh(geoAnello(T, R * 74658 / 58232, R * 136775 / 58232), materialeAnello(T, 'anelliS')); asse.add(an); }
    if (nome === 'urano') { var au = new T.Mesh(geoAnello(T, R * 1.64, R * 2.0), materialeAnello(T, 'anelliU', 0.7)); asse.add(au); asse.add(atmosfera(T, R * 1.05, 0x9ff0ff, 0.6)); }
    if (nome === 'nettuno') asse.add(atmosfera(T, R * 1.05, 0x6b8cff, 0.7));
    if (nome === 'venere') asse.add(atmosfera(T, R * 1.05, 0xffe0a0, 0.6));
    if (nome === 'marte') asse.add(atmosfera(T, R * 1.03, 0xff9a70, 0.35));
    var p = INDICE[nome] != null && CORPI[INDICE[nome]][7] !== 90 || nome === 'terra' ? polo(nome) : [0, 0, 1];
    asse.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(p[0], p[1], p[2]));
    asse.userData.corpo = corpo;
    return asse;
  }

  /* ═══ 1. il sistema solare alla data ═══════════════════════════════════ */
  var NOMI_NANI = ['cerere', 'eris', 'haumea', 'makemake'];
  function schedaSistema(pan, S, destra) {
    var T = S.T, st = { jd: daData(new Date()), vel: 10, verso: 1, gira: true, log: false, orbite: true, etich: true, fascia: true, nani: true, ingr: 1, sel: -1 };
    var K = 4; /* unita' per UA nella scala lineare */
    function sc(p) { var r = Math.hypot(p[0], p[1], p[2]); if (!r) return [0, 0, 0]; var k = st.log ? scalaLog(r) / r : K; return [p[0] * k, p[1] * k, p[2] * k]; }
    var oro = orologio(pan, st, { min: 1, max: 365.25, etichetta: ['Velocità del tempo', 'Time speed'], formato: formatoGiorni, cambia: function (salto) { if (salto) { ricostruisciOrbite(); grafico(true); } S.avvia(); } });
    casella(pan, ['Distanze in scala logaritmica', 'Logarithmic distance scale'], st.log, function (v) { st.log = v; ricostruisciOrbite(); aggiornaFascia(); S.avvia(); if (st.sel < 0) S.inquadra(st.log ? 70 : 60, null, null); });
    casella(pan, ['Orbite', 'Orbits'], st.orbite, function (v) { st.orbite = v; gOrb.visible = v; S.sporca = true; S.avvia(); });
    casella(pan, ['Nomi', 'Labels'], st.etich, function (v) { st.etich = v; S.avvia(); });
    casella(pan, ['Asteroidi, troiani, fascia di Kuiper', 'Asteroids, Trojans, Kuiper belt'], st.fascia, function (v) { st.fascia = v; if (fascia) fascia.visible = v; S.sporca = true; S.avvia(); });
    casella(pan, ['Pianeti nani (Cerere, Eris, Haumea, Makemake)', 'Dwarf planets (Ceres, Eris, Haumea, Makemake)'], st.nani, function (v) { st.nani = v; S.avvia(); });
    F.cursore(pan, ['Ingrandimento dei pianeti', 'Planet magnification'], 0.4, 3, 0.1, 1, function (v) { st.ingr = v; S.avvia(); }, function (v) { return '×' + v.toFixed(1); });
    var scegli = F.scelta(pan, ['Centra su', 'Centre on'], [['-1', t('Sole', 'Sun')]].concat(CORPI.map(function (c, i) { return [String(i), F.tt(c[1])]; })), '-1', function (v) { seleziona(+v); });
    var dati = nota(pan);
    nota(pan, t('Le posizioni vengono dagli elementi kepleriani J2000 della tabella JPL di Standish (valida 1800–2050), fatti variare linearmente nel tempo: a, e, i, L, ϖ, Ω. Per ogni corpo: M = L − ϖ, ω = ϖ − Ω, poi l’equazione di Keplero M = E − e sin E (Newton), x′ = a(cos E − e), y′ = a√(1−e²) sin E, e tre rotazioni R_z(−Ω) R_x(−i) R_z(−ω) portano il punto nel piano dell’eclittica. Precisione: secondi d’arco o minuti d’arco per i pianeti interni, qualche minuto d’arco per gli esterni. Le orbite sono tratteggiate a piena luce sopra l’eclittica e tenui sotto: si vede l’inclinazione di 17° di Plutone e di 44° di Eris. Fra Marte e Giove le lacune di Kirkwood (risonanze 3:1, 5:2, 7:3 con Giove), i troiani nei punti L4 e L5 di Giove, i plutini in risonanza 3:2 con Nettuno.',
      'Positions come from the J2000 Keplerian elements of Standish’s JPL table (valid 1800–2050), varied linearly in time: a, e, i, L, ϖ, Ω. For each body: M = L − ϖ, ω = ϖ − Ω, then Kepler’s equation M = E − e sin E (Newton), x′ = a(cos E − e), y′ = a√(1−e²) sin E, and three rotations R_z(−Ω) R_x(−i) R_z(−ω) bring the point into the ecliptic frame. Accuracy: arcseconds to arcminutes for the inner planets, a few arcminutes for the outer ones. Orbits are bright above the ecliptic and faint below: you can see Pluto’s 17° and Eris’s 44° inclination. Between Mars and Jupiter the Kirkwood gaps (3:1, 5:2, 7:3 resonances with Jupiter), the Trojans at Jupiter’s L4 and L5 points, the plutinos in 3:2 resonance with Neptune.'));
    var cg = F.tela(destra, 0.36);

    /* la scena */
    var radice = new T.Group(); S.aggiungi(radice);
    radice.add(stelle(T, 2500, 5000));
    var luce = new T.PointLight(0xfff4e0, 1.7, 0, 1); radice.add(luce);
    radice.add(new T.AmbientLight(0x404858, 0.25));
    var sol = sole3D(T, 0.9); radice.add(sol);
    /* il piano dell'eclittica: cerchi e raggi, la direzione del punto vernale */
    var gEcl = new T.Group(); radice.add(gEcl);
    function ricostruisciEclittica() {
      while (gEcl.children.length) { var o = gEcl.children.pop(); o.geometry && o.geometry.dispose(); }
      var seg = [], cerchi = [1, 2, 5, 10, 20, 30, 50, 80];
      cerchi.forEach(function (r) { var R = st.log ? scalaLog(r) : r * K; for (var k = 0; k < 128; k++) { var a = 2 * Math.PI * k / 128, b = 2 * Math.PI * (k + 1) / 128; seg.push(R * Math.cos(a), R * Math.sin(a), 0, R * Math.cos(b), R * Math.sin(b), 0); } });
      var Rm = st.log ? scalaLog(80) : 80 * K;
      for (var k = 0; k < 12; k++) { var a = k * Math.PI / 6; seg.push(0, 0, 0, Rm * Math.cos(a), Rm * Math.sin(a), 0); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(seg, 3));
      gEcl.add(new T.LineSegments(g, new T.LineBasicMaterial({ color: 0x2a4a6e, transparent: true, opacity: 0.28, depthWrite: false })));
    }
    var vern = etichetta(T, '♈ γ', '#8494a8'); radice.add(vern);
    /* i corpi */
    var corpi = CORPI.map(function (c, i) {
      var nome = c[0], R = 0.24 * Math.pow(c[3] / 6371, 0.42), nano = NOMI_NANI.indexOf(nome) >= 0;
      if (nano) R = Math.max(R, 0.09);
      var g = new T.Group(), asse = pianeta3D(T, nome, R, c[8]); g.add(asse); radice.add(g);
      var et = etichetta(T, F.tt(c[1]), '#' + c[8].toString(16).padStart(6, '0')); radice.add(et);
      /* linea verticale fino all'eclittica: mostra quanto il corpo e' sopra o sotto */
      var piede = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineBasicMaterial({ color: c[8], transparent: true, opacity: 0.45 })); radice.add(piede);
      return { nome: nome, g: g, asse: asse, R: R, et: et, piede: piede, nano: nano, p: [0, 0, 0] };
    });
    /* la Luna attorno alla Terra (distanza non in scala) */
    var lunaM = new T.Mesh(geoSfera(T, 32), materiale(T, 'luna', 0xbbbbbb)); lunaM.scale.setScalar(0.065); radice.add(lunaM);
    /* le orbite */
    var gOrb = new T.Group(); radice.add(gOrb); var jdOrb = null;
    function ricostruisciOrbite() {
      while (gOrb.children.length) { var o = gOrb.children.pop(); o.geometry.dispose(); o.material.dispose(); }
      jdOrb = st.jd;
      CORPI.forEach(function (c) {
        var pts = orbita(c[0], st.jd, 360), pos = [], col = [], co = new T.Color(c[8]);
        pts.forEach(function (p) { var q = sc(p); pos.push(q[0], q[1], q[2]); var f = p[2] >= 0 ? 0.95 : 0.32; col.push(co.r * f, co.g * f, co.b * f); });
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
        var l = new T.Line(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: NOMI_NANI.indexOf(c[0]) >= 0 ? 0.45 : 0.8 })); l.userData.nome = c[0]; gOrb.add(l);
      });
      ricostruisciEclittica();
      var v = st.log ? scalaLog(60) : 34 * K; vern.position.set(v, 0, 0);
    }
    /* fascia principale, troiani, Kuiper: la posizione kepleriana si calcola nel vertex shader */
    var fascia = null, PC = piccoliCorpi(6000, 1400, 3000, 7);
    (function () {
      var n = PC.n, a1 = new Float32Array(n * 3), a2 = new Float32Array(n * 3), col = new Float32Array(n * 3), rnd = mulberry32(5);
      for (var k = 0; k < n; k++) {
        a1[3 * k] = PC.el[6 * k]; a1[3 * k + 1] = PC.el[6 * k + 1]; a1[3 * k + 2] = PC.el[6 * k + 2]; a2[3 * k] = PC.el[6 * k + 3]; a2[3 * k + 1] = PC.el[6 * k + 4]; a2[3 * k + 2] = PC.el[6 * k + 5];
        var c = PC.tipo[k] === 0 ? [0.72, 0.66, 0.58] : PC.tipo[k] === 1 ? [0.55, 0.85, 0.6] : [0.55, 0.7, 0.95], l = 0.6 + 0.4 * rnd();
        col[3 * k] = c[0] * l; col[3 * k + 1] = c[1] * l; col[3 * k + 2] = c[2] * l;
      }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('el1', new T.BufferAttribute(a1, 3)); g.setAttribute('el2', new T.BufferAttribute(a2, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
      var mat = new T.ShaderMaterial({
        uniforms: { uD: { value: 0 }, uLog: { value: 0 }, uK: { value: K }, uPx: { value: 400 } },
        vertexShader: [
          'attribute vec3 el1; attribute vec3 el2; attribute vec3 color; uniform float uD; uniform float uLog; uniform float uK; uniform float uPx; varying vec3 vC;',
          'void main(){ float a = el1.x, e = el1.y, inc = el1.z;',
          ' float n = 0.01720209895/(a*sqrt(a)); float M = mod(el2.z + n*uD, 6.2831853); float E = M + e*sin(M);',
          ' for (int k = 0; k < 5; k++){ E = E - (E - e*sin(E) - M)/(1.0 - e*cos(E)); }',
          ' float xp = a*(cos(E) - e), yp = a*sqrt(1.0 - e*e)*sin(E);',
          ' float cO = cos(el2.x), sO = sin(el2.x), cw = cos(el2.y), sw = sin(el2.y), ci = cos(inc), si = sin(inc);',
          ' vec3 p = vec3((cw*cO - sw*sO*ci)*xp + (-sw*cO - cw*sO*ci)*yp, (cw*sO + sw*cO*ci)*xp + (-sw*sO + cw*cO*ci)*yp, sw*si*xp + cw*si*yp);',
          ' float r = length(p); float rv = uLog > 0.5 ? 12.0*log(1.0 + r/0.25)/2.302585 : r*uK; p *= rv/r;',
          ' vec4 mv = modelViewMatrix*vec4(p, 1.0); gl_PointSize = clamp(uPx*0.06/(-mv.z), 1.0, 3.0); vC = color; gl_Position = projectionMatrix*mv; }'
        ].join('\n'),
        fragmentShader: 'varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.25) discard; gl_FragColor = vec4(vC, 0.85); }',
        transparent: true, depthWrite: false
      });
      fascia = new T.Points(g, mat); fascia.frustumCulled = false; radice.add(fascia);
    })();
    function aggiornaFascia() { if (!fascia) return; fascia.material.uniforms.uD.value = st.jd - J2000; fascia.material.uniforms.uLog.value = st.log ? 1 : 0; fascia.material.uniforms.uPx.value = S.ren.domElement.height || 400; }

    function seleziona(i) {
      st.sel = i; scegli.value = String(i);
      var R = i >= 0 ? corpi[i].R * st.ingr : 0.9;
      st.rMira = i >= 0 ? Math.max(0.8, R * (CORPI[i][0] === 'saturno' ? 14 : 9)) : (st.log ? 70 : 60);
      mostraDati(); grafico(true); S.avvia();
    }
    alClic(S, function (x, y, w, h) {
      var best = -2, bd = 30, v = new T.Vector3();
      corpi.forEach(function (c, i) { if (c.nano && !st.nani) return; c.g.getWorldPosition(v); v.project(S.cam); if (v.z > 1) return; var px = (v.x + 1) / 2 * w, py = (1 - v.y) / 2 * h, d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = i; } });
      v.set(0, 0, 0).project(S.cam); if (Math.hypot((v.x + 1) / 2 * w - x, (1 - v.y) / 2 * h - y) < Math.min(bd, 24)) best = -1;
      if (best > -2) seleziona(best);
    });
    function mostraDati() {
      if (st.sel < 0) {
        dati.innerHTML = '<b>' + t('Sole', 'Sun') + '</b> · M = 1,989·10³⁰ kg · R = 696 000 km · GM☉ = 1,327·10¹¹ km³/s²<br>' + t('Clicca o tocca un corpo per centrarlo e vederne i dati.', 'Click or tap a body to centre it and see its data.');
        return;
      }
      var c = CORPI[st.sel], el = elementi(c[0], st.jd), p = posizione(c[0], st.jd), pT = posizione('terra', st.jd), r = Math.hypot(p[0], p[1], p[2]), dT = c[0] === 'terra' ? 0 : distanza(p, pT);
      var Pk = periodoKepler(el.a, c[2]), anni = c[4] / 365.25;
      dati.innerHTML = '<b style="color:#' + c[8].toString(16).padStart(6, '0') + '">' + F.tt(c[1]) + '</b>' + (NOMI_NANI.indexOf(c[0]) >= 0 ? t(' (elementi osculanti approssimati)', ' (approximate osculating elements)') : '') +
        '<table class="bsiFX-tab"><tr><td>a</td><td>' + el.a.toFixed(4) + ' UA</td></tr><tr><td>e</td><td>' + el.e.toFixed(4) + '</td></tr><tr><td>i</td><td>' + (el.i / GRAD).toFixed(2) + '°</td></tr>' +
        '<tr><td>Ω · ω</td><td>' + norm360(el.O / GRAD).toFixed(1) + '° · ' + norm360(el.w / GRAD).toFixed(1) + '°</td></tr>' +
        '<tr><td>' + t('Periodo siderale', 'Sidereal period') + '</td><td>' + (anni > 2 ? fmt(anni) + t(' anni', ' yr') : fmt(c[4]) + t(' giorni', ' d')) + '</td></tr>' +
        '<tr><td>' + t('Keplero III: 2π√(a³/G(M☉+m))', 'Kepler III: 2π√(a³/G(M☉+m))') + '</td><td>' + (anni > 2 ? fmt(Pk / 365.25) + t(' anni', ' yr') : fmt(Pk) + t(' giorni', ' d')) + '</td></tr>' +
        '<tr><td>' + t('Massa', 'Mass') + '</td><td>' + c[2].toExponential(3).replace('e+', '·10^') + ' kg</td></tr><tr><td>' + t('Raggio', 'Radius') + '</td><td>' + fmt(c[3]) + ' km</td></tr>' +
        '<tr><td>' + t('Inclinazione dell’asse', 'Axial tilt') + '</td><td>' + (CORPI[st.sel][7] === 90 && c[0] !== 'terra' ? '—' : obliquita(c[0], st.jd).toFixed(2) + '°') + '</td></tr>' +
        '<tr><td>' + t('Rotazione', 'Rotation') + '</td><td>' + fmt(Math.abs(c[5])) + ' h' + (c[5] < 0 ? t(' (retrograda)', ' (retrograde)') : '') + '</td></tr>' +
        '<tr><td>' + t('Distanza dal Sole', 'Distance from Sun') + '</td><td>' + r.toFixed(4) + ' UA</td></tr>' +
        (dT ? '<tr><td>' + t('Distanza dalla Terra', 'Distance from Earth') + '</td><td>' + dT.toFixed(4) + ' UA · ' + fmt(dT * UA / 299792.458 / 60) + ' min-luce</td></tr>' : '') + '</table>';
    }
    /* grafico: distanza Terra–corpo in una finestra di ±2 anni (le opposizioni sono i minimi) */
    var gCentro = null;
    function grafico(forza) {
      var i = st.sel < 0 || CORPI[st.sel][0] === 'terra' ? INDICE.marte : st.sel, c = CORPI[i];
      if (!forza && gCentro != null && Math.abs(st.jd - gCentro) < 200) { return; }
      gCentro = st.jd;
      var xs = [], ys = [], rs = [];
      for (var k = -120; k <= 120; k++) { var jd = st.jd + k * 6.1, p = posizione(c[0], jd), q = posizione('terra', jd); xs.push(k * 6.1 / 365.25); ys.push(distanza(p, q)); rs.push(Math.hypot(p[0], p[1], p[2])); }
      F.grafico(cg, { serie: [{ x: xs, y: ys, col: '#' + c[8].toString(16).padStart(6, '0'), etich: [t('dalla Terra', 'from Earth'), 'from Earth'] }, { x: xs, y: rs, col: '#ffd24a', tratt: true, larg: 1.5, etich: [t('dal Sole', 'from the Sun'), 'from the Sun'] }], punti: [{ x: 0, y: ys[120], col: '#e6fffb', r: 4 }], xl: ['anni dalla data scelta', 'years from the chosen date'], yl: ['distanza (UA)', 'distance (AU)'], legenda: [{ col: '#' + c[8].toString(16).padStart(6, '0'), etich: [F.tt(c[1]) + ' – ' + t('Terra', 'Earth'), F.tt(c[1]) + ' – Earth'] }, { col: '#ffd24a', etich: [F.tt(c[1]) + ' – ' + t('Sole', 'Sun'), F.tt(c[1]) + ' – Sun'] }], descr: [t('Distanza dalla Terra e dal Sole di ', 'Distance from Earth and from the Sun of ') + F.tt(c[1]) + t(' in ±2 anni', ' over ±2 years'), 'distance chart'] });
    }

    ricostruisciOrbite(); aggiornaFascia(); mostraDati(); grafico(true);
    S.inquadra(60, -1.2, 0.95);
    var tempoTesto = 0, vtmp = new T.Vector3(), tSole = 0;
    S.ogniFotogramma(function (dt) {
      tSole += dt; sol.userData.mat.uniforms.uT.value = tSole;
      if (st.gira) st.jd += dt * st.vel * st.verso;
      if (Math.abs(st.jd - jdOrb) > 3650) ricostruisciOrbite();
      aggiornaFascia();
      var pT = null;
      corpi.forEach(function (c, i) {
        var vis = !c.nano || st.nani; c.g.visible = vis; c.et.visible = vis && st.etich; c.piede.visible = vis && st.orbite;
        var gO = gOrb.children[i]; if (gO) gO.visible = vis;
        if (!vis) return;
        var p = posizione(c.nome, st.jd), q = sc(p); c.p = p; if (c.nome === 'terra') pT = q;
        c.g.position.set(q[0], q[1], q[2]); c.asse.scale.setScalar(st.ingr);
        /* rotazione: angolo vero se il tempo scorre piano, altrimenti un giro lento e simbolico */
        var Prot = CORPI[i][5] / 24, ang;
        if (c.nome === 'terra') ang = gmst(st.jd) * GRAD; else ang = 2 * Math.PI * ((st.jd - J2000) / Prot % 1);
        if (st.vel > 3 && st.gira) ang = (c.asse.userData.cosm = (c.asse.userData.cosm || 0) + dt * 0.8 * Math.sign(Prot));
        c.asse.userData.corpo.rotation.z = ang;
        if (c.asse.userData.nubi) c.asse.userData.nubi.rotation.z = ang * 1.04 + 0.4;
        c.et.position.set(q[0], q[1], q[2] + c.R * st.ingr * 1.6 + 0.15); scalaEtichetta(c.et, S.cam, 0.022);
        var pp = c.piede.geometry.attributes.position; pp.setXYZ(0, q[0], q[1], q[2]); pp.setXYZ(1, q[0], q[1], 0); pp.needsUpdate = true;
      });
      scalaEtichetta(vern, S.cam, 0.02);
      if (pT) { var L = luna(st.jd), d = corpi[2].R * st.ingr * 2.6 + 0.12; lunaM.position.set(pT[0] + d * Math.cos(L.lambda * GRAD), pT[1] + d * Math.sin(L.lambda * GRAD), pT[2] + d * Math.sin(L.beta * GRAD)); lunaM.scale.setScalar(0.065 * st.ingr); lunaM.rotation.z = (L.lambda + 180) * GRAD; }
      /* la camera segue il corpo scelto */
      if (st.sel >= 0) vtmp.copy(corpi[st.sel].g.position); else vtmp.set(0, 0, 0);
      var f = Math.min(1, dt * 5); S.vista.bersaglio.lerp(vtmp, f);
      if (st.rMira) { S.vista.r += (st.rMira - S.vista.r) * f; if (Math.abs(st.rMira - S.vista.r) < 0.01 * st.rMira) st.rMira = 0; }
      tempoTesto += dt;
      if (tempoTesto > 0.25) { tempoTesto = 0; oro.data(); if (st.gira) { mostraDati(); grafico(false); } }
      S.didascalia.textContent = t('Sistema solare il ', 'Solar System on ') + testoData(st.jd) + (st.log ? t(' · distanze in scala logaritmica', ' · logarithmic distance scale') : t(' · distanze in scala, pianeti ingranditi', ' · distances to scale, planets enlarged'));
      return true;
    });
  }

  /* ═══ 2. Terra, Luna, eclissi, stagioni ═════════════════════════════════ */
  function schedaTerraLuna(pan, S, destra) {
    var T = S.T, st = { jd: daData(new Date()), vel: 0.25, verso: 1, gira: true, modo: 'luna', vera: false, lat: 45 };
    var oro = orologio(pan, st, { min: 1 / 24, max: 60, etichetta: ['Velocità del tempo', 'Time speed'], formato: formatoGiorni, ore: true, cambia: function (salto) { if (salto) { listaEclissi(); grafici(true); } S.avvia(); } });
    F.scelta(pan, ['Vista', 'View'], [['luna', t('Luna, fasi ed eclissi', 'Moon, phases and eclipses')], ['stagioni', t('Stagioni e durata del giorno', 'Seasons and day length')]], st.modo, function (v) { st.modo = v; costruisci(); grafici(true); });
    var cas = casella(pan, ['Distanza Terra–Luna vera (60 R⊕)', 'True Earth–Moon distance (60 R⊕)'], st.vera, function (v) { st.vera = v; costruisci(); });
    var cLat = F.el('div'); pan.appendChild(cLat);
    F.cursore(cLat, ['Latitudine (°)', 'Latitude (°)'], -89, 89, 1, st.lat, function (v) { st.lat = v; grafici(true); aggiornaLat(); S.avvia(); }, function (v) { return v + '°'; });
    var info = nota(pan), elenco = nota(pan), spiega = nota(pan);
    var cf = F.tela(destra, 0.42), cf2 = F.tela(destra, 0.42);
    var corpo = null, nubi = null, lunaM = null, ombra = null, penombra = null, ombraL = null, orbitaL = null, nodi = null, cerchioLat = null, subsolare = null, luceS = null, soleSp = null, terraG = null, lunaPiano = null;
    var RT = 1, kComp = 12 / 60.27;
    function k() { return st.vera ? 1 : kComp; }
    function vLuna(L) { /* vettore Terra→Luna in R⊕, compresso nel piano dell'eclittica se richiesto */
      var r = L.dist / R_T, b = L.beta * GRAD, l = L.lambda * GRAD;
      return [r * Math.cos(b) * Math.cos(l) * k(), r * Math.cos(b) * Math.sin(l) * k(), r * Math.sin(b)];
    }
    function costruisci() {
      S.pulisci();
      cas.parentNode.style.display = st.modo === 'luna' ? '' : 'none'; elenco.style.display = st.modo === 'luna' ? '' : 'none'; cLat.style.display = st.modo === 'stagioni' ? '' : 'none';
      var R = st.modo === 'stagioni' ? 3 : RT;
      S.aggiungi(stelle(T, 3000, 3000));
      S.aggiungi(new T.AmbientLight(0x334055, 0.35));
      luceS = new T.DirectionalLight(0xfff6e8, 1.6); S.aggiungi(luceS); S.aggiungi(luceS.target);
      tessitura('bagliore', function (c) { soleSp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), blending: T.AdditiveBlending, depthWrite: false, transparent: true })); soleSp.scale.set(30, 30, 1); S.aggiungi(soleSp); });
      terraG = new T.Group(); terraG.rotation.x = -EPS0; S.aggiungi(terraG);
      corpo = new T.Mesh(geoSfera(T, 72), materiale(T, 'terra', 0x3a6ea8, { ruvido: 0.75 })); corpo.scale.setScalar(R); terraG.add(corpo);
      nubi = new T.Mesh(geoSfera(T, 48), materiale(T, 'nubi', 0xffffff, { trasparente: true })); nubi.scale.setScalar(R * 1.012); terraG.add(nubi);
      terraG.add(atmosfera(T, R * 1.06, 0x5fa8ff, 1.2));
      /* l'asse e l'equatore celeste */
      terraG.add(L3().linea(T, [[0, 0, -R * 1.6], [0, 0, R * 1.6]], 0x9fb1c6, 0.7));
      /* il piano dell'eclittica */
      var Rp = st.modo === 'stagioni' ? 7 : st.vera ? 70 : 16;
      var pe = new T.Mesh(new T.RingGeometry(R * 1.3, Rp, 96, 1), new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.06, side: T.DoubleSide, depthWrite: false })); S.aggiungi(pe);
      S.aggiungi(new T.LineLoop(new T.BufferGeometry().setFromPoints(Array.apply(null, Array(128)).map(function (_, i) { var a = 2 * Math.PI * i / 128; return new T.Vector3(Rp * Math.cos(a), Rp * Math.sin(a), 0); })), new T.LineBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.4 })));
      if (st.modo === 'luna') {
        lunaM = new T.Mesh(geoSfera(T, 48), materiale(T, 'luna', 0xbbbbbb)); lunaM.scale.setScalar(R_L / R_T); S.aggiungi(lunaM);
        /* coni d'ombra e penombra della Terra (lunghi fin oltre l'orbita della Luna) */
        /* raggi in R⊕ alla distanza vera Lc/k: l'ombra si stringe con pendenza (R☉ − R⊕)/UA, la penombra si allarga con (R☉ + R⊕)/UA */
        var Lc = (st.vera ? 75 : 17), ru = 1 - (Lc / k()) * (R_S - R_T) / UA, rp = 1 + (Lc / k()) * (R_S + R_T) / UA;
        ombra = new T.Mesh(new T.CylinderGeometry(RT, Math.max(0.01, ru), Lc, 48, 1, true), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false }));
        penombra = new T.Mesh(new T.CylinderGeometry(RT, rp, Lc, 48, 1, true), new T.MeshBasicMaterial({ color: 0x223355, transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false }));
        ombra.userData.L = Lc; penombra.userData.L = Lc; S.aggiungi(ombra); S.aggiungi(penombra);
        /* cono d'ombra della Luna verso la Terra */
        var Lu = 374000 / R_T * k(); ombraL = new T.Mesh(new T.CylinderGeometry(R_L / R_T, 0.003, Lu, 24, 1, true), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, side: T.DoubleSide, depthWrite: false })); ombraL.userData.L = Lu; S.aggiungi(ombraL);
        orbitaL = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xc9d3df, transparent: true, opacity: 0.7 })); S.aggiungi(orbitaL);
        lunaPiano = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({ color: 0x9fb1c6, transparent: true, opacity: 0.08, side: T.DoubleSide, depthWrite: false })); S.aggiungi(lunaPiano);
        nodi = new T.Group(); S.aggiungi(nodi);
        nodi.add(L3().linea(T, [[-1, 0, 0], [1, 0, 0]], 0xff8a80, 0.9));
        var eA = etichetta(T, '☊', '#ff8a80'), eD = etichetta(T, '☋', '#ff8a80'); eA.position.set(1, 0, 0); eD.position.set(-1, 0, 0); nodi.add(eA); nodi.add(eD); nodi.userData.et = [eA, eD];
        orbitaLuna();
        S.inquadra(st.vera ? 150 : 34, -1.0, 1.12);
      } else {
        lunaM = null; ombra = null;
        cerchioLat = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffd24a })); terraG.add(cerchioLat); aggiornaLat();
        subsolare = new T.Mesh(new T.SphereGeometry(0.08, 12, 8), new T.MeshBasicMaterial({ color: 0xffd24a })); terraG.add(subsolare);
        [-66.56, -23.44, 0, 23.44, 66.56].forEach(function (lat) { var pts = []; for (var i = 0; i <= 128; i++) { var a = 2 * Math.PI * i / 128; pts.push([R * 1.004 * Math.cos(lat * GRAD) * Math.cos(a), R * 1.004 * Math.cos(lat * GRAD) * Math.sin(a), R * 1.004 * Math.sin(lat * GRAD)]); } terraG.add(L3().linea(T, pts, lat === 0 ? 0x5eead4 : 0x8494a8, 0.5)); });
        S.inquadra(15, -0.6, 1.2);
      }
      aggiorna(0);
      S.ogniFotogramma(fot);
    }
    function aggiornaLat() {
      if (!cerchioLat) return; var R = 3 * 1.006, pts = [];
      for (var i = 0; i <= 128; i++) { var a = 2 * Math.PI * i / 128; pts.push(new T.Vector3(R * Math.cos(st.lat * GRAD) * Math.cos(a), R * Math.cos(st.lat * GRAD) * Math.sin(a), R * Math.sin(st.lat * GRAD))); }
      cerchioLat.geometry.dispose(); cerchioLat.geometry = new T.BufferGeometry().setFromPoints(pts); S.sporca = true;
    }
    var jdOrbL = null;
    function orbitaLuna() {
      if (!orbitaL) return; jdOrbL = st.jd;
      var pts = [], tri = [];
      for (var i = 0; i <= 120; i++) { var v = vLuna(luna(st.jd - 13.66 + 27.32 * i / 120)); pts.push(new T.Vector3(v[0], v[1], v[2])); }
      orbitaL.geometry.dispose(); orbitaL.geometry = new T.BufferGeometry().setFromPoints(pts);
      for (i = 0; i < 120; i++) tri.push(0, 0, 0, pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(tri, 3)); lunaPiano.geometry.dispose(); lunaPiano.geometry = g;
      /* la linea dei nodi: dove l'orbita attraversa l'eclittica */
      var L = luna(st.jd), Om = L.nodo * GRAD, Rn = L.dist / R_T * k() * 1.12;
      nodi.children[0].geometry.dispose(); nodi.children[0].geometry = new T.BufferGeometry().setFromPoints([new T.Vector3(-Rn * Math.cos(Om), -Rn * Math.sin(Om), 0), new T.Vector3(Rn * Math.cos(Om), Rn * Math.sin(Om), 0)]);
      nodi.userData.et[0].position.set(Rn * 1.06 * Math.cos(Om), Rn * 1.06 * Math.sin(Om), 0.6); nodi.userData.et[1].position.set(-Rn * 1.06 * Math.cos(Om), -Rn * 1.06 * Math.sin(Om), 0.6);
    }
    function aggiorna(dt) {
      var L = luna(st.jd), Sn = L.sole, ls = Sn.lambda * GRAD, sdir = [Math.cos(ls), Math.sin(ls), 0];
      var Ds = st.modo === 'luna' ? (st.vera ? 400 : 160) : 60;
      luceS.position.set(sdir[0] * Ds, sdir[1] * Ds, 0); luceS.target.position.set(0, 0, 0);
      if (soleSp) soleSp.position.set(sdir[0] * Ds, sdir[1] * Ds, 0);
      var ang = gmst(st.jd) * GRAD; corpo.rotation.z = ang; nubi.rotation.z = ang + 0.3 + st.jd * 0.02;
      if (st.modo === 'luna') {
        var v = vLuna(L); lunaM.position.set(v[0], v[1], v[2]);
        /* rotazione sincrona: la faccia visibile (longitudine 0) guarda la Terra */
        lunaM.rotation.set(0, 0, Math.atan2(-v[1], -v[0]));
        var anti = [-sdir[0], -sdir[1], 0];
        /* i coni partono dal centro della Terra in direzione opposta al Sole */
        ombra.position.set(anti[0] * ombra.userData.L / 2, anti[1] * ombra.userData.L / 2, 0); ombra.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(sdir[0], sdir[1], 0));
        penombra.position.copy(ombra.position); penombra.quaternion.copy(ombra.quaternion);
        var Lu = ombraL.userData.L; ombraL.quaternion.copy(ombra.quaternion); ombraL.position.set(v[0] + anti[0] * Lu / 2, v[1] + anti[1] * Lu / 2, v[2]);
        if (Math.abs(st.jd - jdOrbL) > 2) orbitaLuna();
        nodi.userData.et.forEach(function (e) { scalaEtichetta(e, S.cam, 0.03); });
      } else {
        var lon = norm180(Sn.ra - gmst(st.jd)), R = 3 * 1.02;
        subsolare.position.set(R * Math.cos(Sn.dec * GRAD) * Math.cos(Sn.ra * GRAD), R * Math.cos(Sn.dec * GRAD) * Math.sin(Sn.ra * GRAD), R * Math.sin(Sn.dec * GRAD));
        void lon;
      }
    }
    function testoInfo() {
      var L = luna(st.jd), Sn = L.sole, fase = nomeFase(L.elong);
      if (st.modo === 'luna') {
        info.innerHTML = '<b>' + F.tt(fase) + '</b> · ' + t('illuminata al ', 'illuminated ') + Math.round(L.illum * 100) + ' %<br>' +
          t('Elongazione λ☾ − λ☉ = ', 'Elongation λ☾ − λ☉ = ') + L.elong.toFixed(1) + '° · ' + t('latitudine eclittica β = ', 'ecliptic latitude β = ') + L.beta.toFixed(2) + '°<br>' +
          t('Distanza ', 'Distance ') + Math.round(L.dist).toLocaleString() + ' km (' + (L.dist / R_T).toFixed(1) + ' R⊕) · ' + t('nodo ascendente Ω = ', 'ascending node Ω = ') + L.nodo.toFixed(1) + '°';
      } else {
        var dg = durataGiorno(st.lat, Sn.dec), dgr = durataGiorno(st.lat, Sn.dec, -0.833);
        info.innerHTML = t('Declinazione del Sole δ = ', 'Solar declination δ = ') + '<b>' + Sn.dec.toFixed(2) + '°</b> (sin δ = sin ε sin λ☉, λ☉ = ' + Sn.lambda.toFixed(1) + '°)<br>' +
          t('Alla latitudine ', 'At latitude ') + st.lat + '°: ' + t('giorno di ', 'day length ') + '<b>' + fmt(dg) + ' h</b> ' + t('(geometrico, cos H₀ = −tan φ tan δ); ', '(geometric, cos H₀ = −tan φ tan δ); ') + fmt(dgr) + t(' h con rifrazione e semidiametro (h₀ = −0,833°)', ' h with refraction and semidiameter (h₀ = −0.833°)') + '<br>' +
          t('Altezza del Sole a mezzogiorno: ', 'Noon Sun altitude: ') + fmt(90 - Math.abs(st.lat - Sn.dec)) + '° · ' + t('distanza Terra–Sole ', 'Earth–Sun distance ') + Sn.R.toFixed(5) + ' UA';
      }
    }
    function listaEclissi() {
      var Z = sizigie(st.jd - 1, st.jd + 3 * 365.25).filter(function (z) { return z.eclisse; }).slice(0, 8);
      var nomi = { totale: t('totale', 'total'), anulare: t('anulare', 'annular'), parziale: t('parziale', 'partial'), penombra: t('di penombra', 'penumbral') };
      elenco.innerHTML = '<b>' + t('Prossime eclissi (modello: γ dall’ombra geometrica)', 'Next eclipses (model: γ from geometric shadow)') + '</b><table class="bsiFX-tab"><tr><th>' + t('data', 'date') + '</th><th>' + t('tipo', 'type') + '</th><th>β</th><th>γ</th></tr>' +
        Z.map(function (z) { return '<tr><td>' + testoData(z.jd, true).slice(0, 16) + '</td><td>' + (z.eclisse.solare ? '☀ ' + t('solare ', 'solar ') : '☾ ' + t('lunare ', 'lunar ')) + nomi[z.eclisse.tipo] + '</td><td>' + z.beta.toFixed(2) + '°</td><td>' + z.eclisse.gamma.toFixed(2) + '</td></tr>'; }).join('') + '</table>';
    }
    function disegnaFase() {
      /* la Luna vista dall'emisfero nord: mezzo disco illuminato piu' (gibbosa) o meno (falce)
         una mezza ellisse di semiasse |2k − 1| r, k = frazione illuminata */
      var P = F.pennello(cf), q = P.q, W = P.W, H = P.H, L = luna(st.jd), r = Math.min(W, H) * 0.36, cx = W * 0.27, cy = H / 2, k2 = 2 * L.illum - 1;
      q.fillStyle = '#1b2433'; q.beginPath(); q.arc(cx, cy, r, 0, 2 * Math.PI); q.fill();
      q.save(); if (L.elong > 180) { q.translate(2 * cx, 0); q.scale(-1, 1); }
      q.fillStyle = '#e8e6df'; q.beginPath(); q.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
      if (k2 >= 0) q.ellipse(cx, cy, Math.max(0.01, k2 * r), r, 0, Math.PI / 2, 3 * Math.PI / 2, false);
      else q.ellipse(cx, cy, Math.max(0.01, -k2 * r), r, 0, Math.PI / 2, -Math.PI / 2, true);
      q.fill(); q.restore();
      q.strokeStyle = '#34465f'; q.beginPath(); q.arc(cx, cy, r, 0, 2 * Math.PI); q.stroke();
      q.fillStyle = '#cfe3f7'; q.font = '13px system-ui,sans-serif'; q.textAlign = 'left';
      var x0 = W * 0.55; q.fillText(F.tt(nomeFase(L.elong)), x0, cy - 30); q.fillText(t('illuminata ', 'illuminated ') + Math.round(L.illum * 100) + ' %', x0, cy - 10);
      q.fillText(t('elongazione ', 'elongation ') + L.elong.toFixed(0) + '°', x0, cy + 10); q.fillText('k = (1 + cos i)/2', x0, cy + 30);
      cf.setAttribute('aria-label', t('Fase della Luna vista dalla Terra: ', 'Moon phase seen from Earth: ') + F.tt(nomeFase(L.elong)));
    }
    function grafici(forza) {
      if (st.modo === 'luna') {
        /* β della Luna a ogni Luna nuova e piena: le eclissi solo dentro le fasce */
        var Z = sizigie(st.jd - 400, st.jd + 800), nuove = Z.filter(function (z) { return z.nuova; }), piene = Z.filter(function (z) { return !z.nuova; }), y0 = (st.jd - J2000) / 365.25;
        var xs = [], ys = []; for (var i = -400; i <= 800; i += 2) { xs.push((st.jd + i - J2000) / 365.25 + 2000); ys.push(luna(st.jd + i).beta); }
        var o = F.grafico(cf2, {
          serie: [{ x: xs, y: ys, col: 'rgba(159,177,198,.45)', larg: 1, etich: ['β(t)', 'β(t)'] }],
          punti: nuove.map(function (z) { return { x: (z.jd - J2000) / 365.25 + 2000, y: z.beta, col: z.eclisse ? '#ffd24a' : '#5b6b80', r: z.eclisse ? 5 : 3 }; }).concat(piene.map(function (z) { return { x: (z.jd - J2000) / 365.25 + 2000, y: z.beta, col: z.eclisse ? '#ff8a80' : '#3f4c5e', r: z.eclisse ? 5 : 3 }; })),
          linee: [{ y: 1.5, col: '#ffd24a', etich: t('limite eclissi solare ≈ 1,5°', 'solar eclipse limit ≈ 1.5°') }, { y: -1.5, col: '#ffd24a' }, { y: 1.0, col: '#ff8a80', etich: t('ombra ≈ 1°', 'umbra ≈ 1°') }, { y: -1.0, col: '#ff8a80' }],
          ymin: -5.6, ymax: 5.6, xl: ['anno', 'year'], yl: ['β Luna (°)', 'Moon β (°)'],
          legenda: [{ col: '#ffd24a', etich: ['Luna nuova con eclisse', 'New Moon with eclipse'] }, { col: '#ff8a80', etich: ['Luna piena con eclisse', 'Full Moon with eclipse'] }],
          descr: ['Latitudine della Luna alle sizigie: le eclissi accadono solo vicino ai nodi', 'Moon latitude at syzygies: eclipses happen only near the nodes']
        });
        void o; void y0;
        disegnaFase();
      } else {
        var Sn = sole(st.jd), lat = [], dl = [], dr = [];
        for (var f = -90; f <= 90; f += 1) { lat.push(f); dl.push(durataGiorno(f, Sn.dec)); dr.push(durataGiorno(f, Sn.dec, -0.833)); }
        F.grafico(cf, { serie: [{ x: lat, y: dl, col: '#ffd24a', etich: ['geometrico', 'geometric'] }, { x: lat, y: dr, col: '#ff8a80', tratt: true, larg: 1.5, etich: ['con rifrazione', 'with refraction'] }], punti: [{ x: st.lat, y: durataGiorno(st.lat, Sn.dec), col: '#5eead4', r: 5 }], ymin: 0, ymax: 24, xl: ['latitudine (°)', 'latitude (°)'], yl: ['ore di luce', 'daylight hours'], legenda: [{ col: '#ffd24a', etich: ['geometrico', 'geometric'] }, { col: '#ff8a80', etich: ['con rifrazione', 'with refraction'] }], descr: ['Durata del giorno in funzione della latitudine alla data', 'Day length versus latitude at the date'] });
        var anno = calendario(st.jd).anno, j0 = giuliano(anno, 1, 1, 12), gs = [], ds = [], dsS = [];
        for (var g = 0; g <= 365; g += 2) { var s = sole(j0 + g); gs.push(g); ds.push(durataGiorno(st.lat, s.dec)); dsS.push(durataGiorno(-st.lat, s.dec)); }
        F.grafico(cf2, { serie: [{ x: gs, y: ds, col: '#5eead4', etich: [st.lat + '°', st.lat + '°'] }, { x: gs, y: dsS, col: '#c9a0ff', tratt: true, larg: 1.5, etich: [(-st.lat) + '°', (-st.lat) + '°'] }], punti: [{ x: st.jd - j0, y: durataGiorno(st.lat, Sn.dec), col: '#ffd24a', r: 5 }], ymin: 0, ymax: 24, xl: ['giorno dell’anno ' + anno, 'day of year ' + anno], yl: ['ore di luce', 'daylight hours'], legenda: [{ col: '#5eead4', etich: ['latitudine ' + st.lat + '°', 'latitude ' + st.lat + '°'] }, { col: '#c9a0ff', etich: ['latitudine ' + (-st.lat) + '° (opposta)', 'latitude ' + (-st.lat) + '° (opposite)'] }], descr: ['Durata del giorno durante l’anno alla latitudine scelta', 'Day length over the year at the chosen latitude'] });
      }
      void forza;
      spiega.innerHTML = st.modo === 'luna' ?
        t('L’orbita della Luna è inclinata di 5,14° sull’eclittica e la incrocia nei due nodi (☊ ascendente, ☋ discendente). Un’eclisse richiede una sizigia (Luna nuova o piena) con la Luna vicina a un nodo: |β| ≲ 1,5° per un’eclisse di Sole, ≲ 1° per una di Luna nell’ombra. Ogni mese la Luna nuova cade di solito fino a 5° sopra o sotto il Sole: per questo non c’è un’eclisse al mese, ma 4–7 l’anno, in due «stagioni delle eclissi» lunghe circa 35 giorni. I nodi regrediscono di 19,3° l’anno (periodo 18,6 anni): le stagioni arrivano ogni 173,3 giorni (mezzo anno draconitico). Nella vista compressa la distanza è ridotta di 5 volte ma l’altezza sull’eclittica no, così le ombre colpiscono la Luna esattamente quando lo fanno nel cielo vero.',
          'The Moon’s orbit is tilted 5.14° to the ecliptic and crosses it at the two nodes (☊ ascending, ☋ descending). An eclipse needs a syzygy (new or full Moon) with the Moon near a node: |β| ≲ 1.5° for a solar eclipse, ≲ 1° for a lunar one in the umbra. Each month the new Moon usually passes up to 5° above or below the Sun: that is why there is no eclipse every month but 4–7 a year, in two “eclipse seasons” about 35 days long. The nodes regress 19.3° a year (18.6-year period): seasons come every 173.3 days (half a draconic year). In the compressed view the distance is reduced five times but the height above the ecliptic is not, so the shadows hit the Moon exactly when they do in the real sky.') :
        t('Le stagioni nascono dall’inclinazione dell’asse terrestre (ε = 23,44°), non dalla distanza dal Sole: il perielio cade il 3–4 gennaio, in pieno inverno boreale. La declinazione del Sole va da −ε a +ε; il terminatore (il cerchio d’ombra) taglia i paralleli in archi diversi, e la frazione di parallelo illuminata è la durata del giorno: cos H₀ = −tan φ tan δ, durata = 2H₀/15° ore. Oltre il circolo polare (|φ| > 90° − ε) il giorno o la notte durano 24 ore. Il punto giallo è il punto subsolare, dove il Sole è allo zenit.',
          'Seasons come from the tilt of Earth’s axis (ε = 23.44°), not from the distance to the Sun: perihelion falls on 3–4 January, in the middle of northern winter. The Sun’s declination ranges from −ε to +ε; the terminator (the shadow circle) cuts the parallels into different arcs, and the lit fraction of a parallel is the day length: cos H₀ = −tan φ tan δ, length = 2H₀/15° hours. Beyond the polar circle (|φ| > 90° − ε) day or night lasts 24 hours. The yellow dot is the subsolar point, where the Sun is at the zenith.');
    }
    var acc = 0, accG = 0;
    function fot(dt) {
      if (st.gira) st.jd += dt * st.vel * st.verso;
      aggiorna(dt);
      acc += dt; accG += dt;
      if (acc > 0.25) { acc = 0; oro.data(); testoInfo(); if (st.modo === 'luna') disegnaFase(); }
      if (accG > 3 && st.gira) { accG = 0; grafici(false); listaEclissi(); }
      S.didascalia.textContent = st.modo === 'luna' ? t('Terra e Luna, ', 'Earth and Moon, ') + testoData(st.jd, true) + ' · ' + F.tt(nomeFase(luna(st.jd).elong)) : t('Stagioni: la Terra illuminata dal Sole il ', 'Seasons: Earth lit by the Sun on ') + testoData(st.jd, true);
      return true;
    }
    costruisci(); listaEclissi(); grafici(true); testoInfo();
  }

  /* ═══ 3. Giove e Saturno da vicino ══════════════════════════════════════ */
  function schedaVicino(pan, S, destra) {
    var T = S.T, st = { pianeta: 'giove', jd: daData(new Date()), vel: 0.25, verso: 1, gira: true, ore: 0 };
    F.scelta(pan, ['Pianeta', 'Planet'], [['giove', t('Giove e i satelliti medicei', 'Jupiter and the Galilean moons')], ['saturno', t('Saturno e le particelle degli anelli', 'Saturn and the ring particles')]], st.pianeta, function (v) { st.pianeta = v; costruisci(); });
    var oro = orologio(pan, st, { min: 1 / 96, max: 4, etichetta: ['Velocità del tempo', 'Time speed'], formato: formatoGiorni, ore: true, cambia: function () { S.avvia(); } });
    var bSpoke = F.bottone(pan, ['Riallinea il raggio colorato', 'Realign the coloured spoke'], function () { st.ore = 0; });
    var info = nota(pan), spiega = nota(pan);
    var cg = F.tela(destra, 0.5);
    var stato = null, I = new T.Matrix4();
    void I;
    function costruisci() {
      S.pulisci(); stato = { tipo: st.pianeta };
      bSpoke.style.display = st.pianeta === 'saturno' ? '' : 'none';
      S.aggiungi(stelle(T, 3000, 3000));
      S.aggiungi(new T.AmbientLight(0x404858, 0.3));
      var luce = new T.DirectionalLight(0xfff4e0, 1.5); S.aggiungi(luce); S.aggiungi(luce.target); stato.luce = luce;
      var pl = pianeta3D(T, st.pianeta, 1, st.pianeta === 'giove' ? 0xe0b98a : 0xf0d9a0); stato.pl = pl;
      /* nella vista ravvicinata il piano equatoriale del pianeta e' il piano xy */
      pl.quaternion.identity(); S.aggiungi(pl);
      if (st.pianeta === 'giove') {
        var mondi = MEDICEI.map(function (m) {
          var mesh = new T.Mesh(geoSfera(T, 32), materiale(T, m[0], 0xcccccc)); mesh.scale.setScalar(m[5] / 69911 * 4); S.aggiungi(mesh);
          var a = m[4] / 69911, pts = []; for (var i = 0; i <= 160; i++) { var x = 2 * Math.PI * i / 160; pts.push([a * Math.cos(x), a * Math.sin(x), 0]); }
          S.aggiungi(L3().linea(T, pts, 0x5eead4, 0.25));
          var et = etichetta(T, F.tt(m[1]), '#cfe3f7'); S.aggiungi(et);
          var raggio = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.35 })); S.aggiungi(raggio);
          return { mesh: mesh, a: a, et: et, raggio: raggio };
        });
        stato.mondi = mondi;
        /* congiunzioni Io–Europa ed Europa–Ganimede: un segno dove avvengono */
        var nSeg = 90, pos = new Float32Array(nSeg * 3), col = new Float32Array(nSeg * 3), g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setDrawRange(0, 0);
        stato.cong = new T.Points(g, new T.PointsMaterial({ size: 6, sizeAttenuation: false, vertexColors: true })); S.aggiungi(stato.cong); stato.nCong = 0; stato.prec = null;
        S.inquadra(44, -1.2, 1.05);
      } else {
        /* anelli: migliaia di particelle (InstancedMesh) in orbite circolari kepleriane */
        var NP = 16000, rnd = mulberry32(31), geo = new T.IcosahedronGeometry(1, 0), mat = new T.MeshLambertMaterial({ color: 0xffffff });
        var im = new T.InstancedMesh(geo, mat, NP), r = new Float32Array(NP), th = new Float32Array(NP), z = new Float32Array(NP), w = new Float32Array(NP), s = new Float32Array(NP), c = new T.Color();
        var tot = 0; ANELLI.forEach(function (A) { tot += (A[1] - A[0]) * A[2]; });
        for (var i = 0; i < NP; i++) {
          var u = rnd() * tot, A = ANELLI[0];
          for (var j = 0; j < ANELLI.length; j++) { var p = (ANELLI[j][1] - ANELLI[j][0]) * ANELLI[j][2]; if (u < p) { A = ANELLI[j]; break; } u -= p; }
          var rk = A[0] + rnd() * (A[1] - A[0]); r[i] = rk / R_SAT; th[i] = rnd() * 2 * Math.PI; z[i] = (rnd() - 0.5) * 0.004; s[i] = 0.007 + 0.012 * Math.pow(rnd(), 2);
          w[i] = 2 * Math.PI / periodoAnello(rk); /* rad/ora */
          var raggioSpoke = Math.abs(norm180(th[i] / GRAD)) < 4;
          if (raggioSpoke) { c.setRGB(1, 0.3, 0.1); s[i] *= 1.4; } else if (rk < 92000) c.setRGB(0.55, 0.52, 0.48); else if (rk < 117580) c.setRGB(0.92, 0.86, 0.74); else c.setRGB(0.8, 0.76, 0.68);
          im.setColorAt(i, c);
        }
        im.instanceMatrix.setUsage(T.DynamicDrawUsage); S.aggiungi(im);
        stato.anelli = { im: im, r: r, th: th, z: z, w: w, s: s, n: NP };
        /* un velo continuo sotto le particelle, per la densita' */
        var velo = new T.Mesh(geoAnello(T, 74658 / R_SAT, 136775 / R_SAT), materialeAnello(T, 'anelliS', 0.45)); S.aggiungi(velo);
        /* Mimante e il cerchio della risonanza 2:1 (il bordo interno della divisione di Cassini) */
        var mim = new T.Mesh(geoSfera(T, 24), materiale(T, 'callisto', 0xbbbbbb)); mim.scale.setScalar(0.035); S.aggiungi(mim); stato.mim = mim;
        var aM = MIMANTE.a / R_SAT, pts = []; for (var k = 0; k <= 200; k++) { var x = 2 * Math.PI * k / 200; pts.push([aM * Math.cos(x), aM * Math.sin(x), 0]); }
        S.aggiungi(L3().linea(T, pts, 0x9fb1c6, 0.35));
        var r21 = raggioRisonanza(MIMANTE.P, 2, 1) / R_SAT; pts = []; for (k = 0; k <= 200; k++) { x = 2 * Math.PI * k / 200; pts.push([r21 * Math.cos(x), r21 * Math.sin(x), 0.002]); }
        S.aggiungi(L3().linea(T, pts, 0xff8a80, 0.8));
        var em = etichetta(T, t('Mimante', 'Mimas'), '#cfe3f7'); S.aggiungi(em); stato.em = em;
        /* l'asse di Saturno inclinato di 26,7° sul piano dell'orbita: si guarda di sbieco */
        S.inquadra(7.5, -1.0, 1.15);
      }
      stato.etP = etichetta(T, st.pianeta === 'giove' ? t('Giove', 'Jupiter') : t('Saturno', 'Saturn'), '#ffd24a'); stato.etP.position.set(0, 0, 1.5); S.aggiungi(stato.etP);
      testi(); grafico();
      S.ogniFotogramma(fotogramma);
    }
    function testi() {
      if (st.pianeta === 'giove') {
        var P = periodiMedicei();
        spiega.innerHTML = t('Periodi: Io ', 'Periods: Io ') + P[0].toFixed(3) + ' d, Europa ' + P[1].toFixed(3) + ' d, ' + t('Ganimede ', 'Ganymede ') + P[2].toFixed(3) + ' d, Callisto ' + P[3].toFixed(3) + ' d. ' +
          t('I rapporti P_E/P_I = ', 'Ratios P_E/P_I = ') + (P[1] / P[0]).toFixed(4) + ', P_G/P_E = ' + (P[2] / P[1]).toFixed(4) + t(': quasi 2 e 2. Esattamente invece n_I − 3n_E + 2n_G = 0 e l’argomento di Laplace φ = λ_I − 3λ_E + 2λ_G resta fermo a 180°: i tre satelliti non sono mai allineati tutti insieme dalla stessa parte. Le congiunzioni Io–Europa (punti verdi) avvengono sempre dalla parte opposta a quelle Europa–Ganimede (punti viola), e lentamente ruotano insieme. Le lune sono ingrandite ×4; quando entrano nell’ombra di Giove si spengono (eclissi dei satelliti, che Rømer usò nel 1676 per misurare la velocità della luce).',
            ': almost 2 and 2. Exactly instead n_I − 3n_E + 2n_G = 0 and the Laplace argument φ = λ_I − 3λ_E + 2λ_G stays at 180°: the three moons are never all lined up on the same side. Io–Europa conjunctions (green dots) always happen opposite to Europa–Ganymede ones (violet dots), and they slowly rotate together. Moons are enlarged ×4; when they enter Jupiter’s shadow they go dark (eclipses of the satellites, which Rømer used in 1676 to measure the speed of light).');
      } else {
        var Pin = periodoAnello(92000), Pout = periodoAnello(136775), r21 = raggioRisonanza(MIMANTE.P, 2, 1), r76 = raggioRisonanza(GIANO.P, 7, 6);
        spiega.innerHTML = t('Ogni particella segue un’orbita circolare kepleriana con ω = √(GM/r³): l’interno dell’anello B gira in ', 'Each particle follows a circular Keplerian orbit with ω = √(GM/r³): the inner B ring turns in ') + fmt(Pin) + ' h, ' + t('il bordo dell’anello A in ', 'the edge of ring A in ') + fmt(Pout) + ' h. ' +
          t('Il raggio colorato si deforma in una spirale: è la rotazione differenziale (lo stesso taglio che allunga i bracci delle galassie). La divisione di Cassini comincia a ', 'The coloured spoke shears into a spiral: this is differential rotation (the same shear that stretches galactic arms). The Cassini division starts at ') + Math.round(r21).toLocaleString() + ' km, ' +
          t('dove il periodo orbitale è metà di quello di Mimante (', 'where the orbital period is half that of Mimas (') + fmt(MIMANTE.P) + ' h): ' + t('risonanza 2:1, le spinte periodiche svuotano la regione. Il bordo esterno dell’anello A (136 775 km) è la risonanza 7:6 con Giano (', '2:1 resonance, periodic kicks clear the region. The outer edge of ring A (136 775 km) is the 7:6 resonance with Janus (') + Math.round(r76).toLocaleString() + ' km).';
      }
    }
    function grafico() {
      if (st.pianeta === 'giove') {
        /* il diagramma di Galileo: posizione di ogni satellite lungo la linea di vista nei prossimi 16 giorni */
        var cols = ['#ffd24a', '#c9d3df', '#c9a0ff', '#8494a8'], serie = [], j0 = st.jd, lamJ = 0;
        var pJ = posizione('giove', j0), pE = posizione('terra', j0); lamJ = Math.atan2(pJ[1] - pE[1], pJ[0] - pE[0]);
        MEDICEI.forEach(function (m, k) { var xs = [], ys = []; for (var d = 0; d <= 16; d += 0.05) { var l = medicei(j0 + d)[k] * GRAD; xs.push(d); ys.push(m[4] / 69911 * Math.sin(l - lamJ)); } serie.push({ x: xs, y: ys, col: cols[k], larg: 1.6, etich: [F.tt(m[1]), F.tt(m[1])] }); });
        F.grafico(cg, { serie: serie, linee: [{ y: 1, col: '#e0b98a' }, { y: -1, col: '#e0b98a', etich: t('disco di Giove', 'Jupiter’s disc') }], xl: ['giorni da ' + testoData(j0), 'days from ' + testoData(j0)], yl: ['posizione (R♃)', 'position (R♃)'], legenda: MEDICEI.map(function (m, k) { return { col: cols[k], etich: [F.tt(m[1]), F.tt(m[1])] }; }), descr: ['Diagramma di Galileo: posizione dei satelliti medicei visti dalla Terra nei prossimi 16 giorni', 'Galileo diagram: Galilean moon positions seen from Earth over the next 16 days'] });
      } else {
        var rs = [], ps = [], pr = []; for (var r = 70000; r <= 190000; r += 500) { rs.push(r / 1000); ps.push(periodoAnello(r)); }
        ANELLI.forEach(function (A) { if (A[2] > 0.05) pr.push({ x: (A[0] + A[1]) / 2000, y: periodoAnello((A[0] + A[1]) / 2), col: '#ffd24a', r: 4 }); });
        pr.push({ x: MIMANTE.a / 1000, y: MIMANTE.P, col: '#c9d3df', r: 5 }); pr.push({ x: raggioRisonanza(MIMANTE.P, 2, 1) / 1000, y: MIMANTE.P / 2, col: '#ff8a80', r: 5 });
        F.grafico(cg, { serie: [{ x: rs, y: ps, col: '#5eead4', etich: ['T(r) = 2π√(r³/GM)', 'T(r) = 2π√(r³/GM)'] }], punti: pr, linee: [{ y: MIMANTE.P / 2, col: '#ff8a80', etich: t('½ periodo di Mimante: Cassini (2:1)', '½ Mimas period: Cassini (2:1)') }, { y: MIMANTE.P, col: '#c9d3df', etich: t('Mimante', 'Mimas') }], xl: ['distanza dal centro (10³ km)', 'distance from centre (10³ km)'], yl: ['periodo orbitale (h)', 'orbital period (h)'], descr: ['Periodo orbitale in funzione della distanza da Saturno', 'Orbital period versus distance from Saturn'] });
      }
    }
    function fotogramma(dt) {
      var giorni = st.gira ? dt * st.vel * st.verso : 0; st.jd += giorni; st.ore += giorni * 24;
      var pP = posizione(st.pianeta, st.jd), ls = Math.atan2(-pP[1], -pP[0]), sd = [Math.cos(ls), Math.sin(ls), 0];
      stato.luce.position.set(sd[0] * 50, sd[1] * 50, 0);
      var Prot = (st.pianeta === 'giove' ? 9.925 : 10.656) / 24; stato.pl.userData.corpo.rotation.z = 2 * Math.PI * ((st.jd - J2000) / Prot % 1);
      scalaEtichetta(stato.etP, S.cam, 0.025);
      if (st.pianeta === 'giove') {
        var l = medicei(st.jd);
        stato.mondi.forEach(function (m, k) {
          var a = l[k] * GRAD, x = m.a * Math.cos(a), y = m.a * Math.sin(a); m.mesh.position.set(x, y, 0); m.mesh.rotation.z = a + Math.PI;
          /* nell'ombra di Giove: dietro rispetto al Sole e entro un raggio dall'asse */
          var dietro = x * sd[0] + y * sd[1] < 0, perp = Math.abs(-x * sd[1] + y * sd[0]) < 1;
          m.mesh.material.emissive && m.mesh.material.color.setScalar(dietro && perp ? 0.08 : 1);
          m.et.position.set(x, y, 0.9); scalaEtichetta(m.et, S.cam, 0.02);
          var pr = m.raggio.geometry.attributes.position; pr.setXYZ(1, x, y, 0); pr.needsUpdate = true;
        });
        /* congiunzioni: quando la differenza di longitudine cambia segno */
        var d12 = norm180(l[0] - l[1]), d23 = norm180(l[1] - l[2]);
        if (stato.prec && st.gira) {
          [[d12, stato.prec[0], 1, [0.37, 0.92, 0.83]], [d23, stato.prec[1], 2, [0.79, 0.63, 1]]].forEach(function (c) {
            if (c[1] < 0 && c[0] >= 0 && Math.abs(c[0] - c[1]) < 90) {
              var a = l[c[2]] * GRAD, R = stato.mondi[c[2]].a, g = stato.cong.geometry, k = stato.nCong % 90;
              g.attributes.position.setXYZ(k, R * Math.cos(a), R * Math.sin(a), 0.05); g.attributes.color.setXYZ(k, c[3][0], c[3][1], c[3][2]);
              g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; stato.nCong++; g.setDrawRange(0, Math.min(90, stato.nCong));
            }
          });
        }
        stato.prec = [d12, d23];
        info.innerHTML = t('Argomento di Laplace ', 'Laplace argument ') + 'φ = λ_I − 3λ_E + 2λ_G = <b>' + laplace(st.jd).toFixed(3) + '°</b><br>λ_I = ' + l[0].toFixed(1) + '°, λ_E = ' + l[1].toFixed(1) + '°, λ_G = ' + l[2].toFixed(1) + '°, λ_C = ' + l[3].toFixed(1) + '°<br>' + t('Congiunzioni registrate: ', 'Conjunctions recorded: ') + stato.nCong;
        S.didascalia.textContent = t('Giove e i satelliti medicei, ', 'Jupiter and the Galilean moons, ') + testoData(st.jd, true) + ' · φ = ' + laplace(st.jd).toFixed(2) + '°';
      } else {
        var A = stato.anelli, arr = A.im.instanceMatrix.array, h = st.ore;
        for (var i = 0; i < A.n; i++) {
          var th = A.th[i] + A.w[i] * h, r = A.r[i], s = A.s[i], o = 16 * i;
          arr[o] = s; arr[o + 1] = 0; arr[o + 2] = 0; arr[o + 3] = 0; arr[o + 4] = 0; arr[o + 5] = s; arr[o + 6] = 0; arr[o + 7] = 0; arr[o + 8] = 0; arr[o + 9] = 0; arr[o + 10] = s; arr[o + 11] = 0;
          arr[o + 12] = r * Math.cos(th); arr[o + 13] = r * Math.sin(th); arr[o + 14] = A.z[i]; arr[o + 15] = 1;
        }
        A.im.instanceMatrix.needsUpdate = true;
        var aM = MIMANTE.a / R_SAT, tM = 2 * Math.PI * h / MIMANTE.P; stato.mim.position.set(aM * Math.cos(tM + 1), aM * Math.sin(tM + 1), 0);
        stato.em.position.set(stato.mim.position.x, stato.mim.position.y, 0.25); scalaEtichetta(stato.em, S.cam, 0.02);
        info.innerHTML = t('Tempo dall’allineamento del raggio: ', 'Time since the spoke was aligned: ') + '<b>' + fmt(h) + ' h</b><br>' + t('In questo tempo l’anello B interno ha fatto ', 'In this time the inner B ring has made ') + fmt(h / periodoAnello(92000)) + t(' giri, il bordo dell’anello A ', ' turns, the edge of ring A ') + fmt(h / periodoAnello(136775)) + '.<br>' + A.n.toLocaleString() + t(' particelle, una InstancedMesh aggiornata a ogni fotogramma.', ' particles, one InstancedMesh updated every frame.');
        S.didascalia.textContent = t('Saturno: anelli in rotazione differenziale kepleriana, ', 'Saturn: rings in differential Keplerian rotation, ') + fmt(h) + ' h';
      }
      if (S._accT == null) S._accT = 0; S._accT += dt; if (S._accT > 0.25) { S._accT = 0; oro.data(); }
      return true;
    }
    costruisci();
  }

  /* i pezzi 3D, per le altre sezioni di astronomia (meccanica orbitale, matematica celeste) */
  globale.BSIAstro3D = { scheda: scheda, tessitura: tessitura, geoSfera: geoSfera, materiale: materiale, atmosfera: atmosfera, stelle: stelle, sole3D: sole3D, etichetta: etichetta, scalaEtichetta: scalaEtichetta, casella: casella, nota: nota, orologio: orologio, formatoGiorni: formatoGiorni, alClic: alClic, pianeta3D: pianeta3D, testoData: testoData, daData: daData, CONTINENTI: CONTINENTI };

  F.sezione('sastrosole', {
    titolo: ['🪐 Sistema solare 3D', '🪐 Solar system 3D'],
    sotto: ['Il Sistema solare vero a una data qualsiasi, con le effemeridi JPL e l’equazione di Keplero; Terra, Luna, fasi, eclissi e stagioni; Giove con la risonanza di Laplace dei satelliti medicei e Saturno con migliaia di particelle negli anelli. Si ruota con il dito o il mouse, si ingrandisce con due dita o la rotellina; un clic su un pianeta lo mette al centro.', 'The real Solar System at any date, with JPL ephemerides and Kepler’s equation; Earth, Moon, phases, eclipses and seasons; Jupiter with the Laplace resonance of the Galilean moons and Saturn with thousands of ring particles. Rotate with a finger or the mouse, zoom with two fingers or the wheel; click a planet to centre it.'],
    schede: [
      { nome: ['🪐 Sistema solare alla data', '🪐 Solar System at a date'], costruisci: scheda(schedaSistema) },
      { nome: ['🌗 Terra, Luna ed eclissi', '🌗 Earth, Moon and eclipses'], costruisci: scheda(schedaTerraLuna) },
      { nome: ['🔭 Giove e Saturno da vicino', '🔭 Jupiter and Saturn close up'], costruisci: scheda(schedaVicino) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
