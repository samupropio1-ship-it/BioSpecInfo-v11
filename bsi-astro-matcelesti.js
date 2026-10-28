/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-matcelesti.js — 📐 Matematica celeste
   BioSpecInfo · © Samuele Pio Provenzano

   La matematica che sta sotto l'astrofisica e la meccanica orbitale, con
   i numeri e i grafici che mostrano perche' i metodi funzionano (o no):

   · L'EQUAZIONE DI KEPLERO M = E − e sin E: Newton (convergenza
     quadratica), punto fisso E = M + e sin E (lineare, rapporto e cos E),
     serie di Bessel (E = M + Σ 2/k J_k(ke) sin kM, converge per ogni e < 1)
     e serie di Lagrange in potenze di e (diverge oltre il limite di
     Laplace 0,6627); le tre anomalie (media, eccentrica, vera) su
     un'ellisse animata;
   · TRIGONOMETRIA SFERICA E SISTEMI DI COORDINATE: la sfera celeste in 3D
     con i riferimenti equatoriale, eclittico, orizzontale e galattico come
     rotazioni (matrici e quaternioni, interpolazione slerp fra un
     riferimento e l'altro); il tempo siderale; un esempio svolto: Sirio
     vista da Roma;
   · INTEGRATORI PER IL PROBLEMA DEGLI N CORPI sul problema di Keplero:
     Eulero, Runge-Kutta 4, leapfrog (Verlet) e Yoshida del 4° ordine;
     l'errore sull'energia (limitato per i simplettici, in deriva per gli
     altri), la precessione spuria del pericentro, l'ordine misurato dalla
     pendenza log-log (1, 4, 2, 4);
   · PERIODOGRAMMI: curve di luce di stelle variabili e di un pianeta in
     transito con rumore e campionamento irregolare (notti, nuvole, il
     giorno), il periodogramma di Lomb–Scargle e la ricerca di box (BLS)
     che ritrovano il periodo, gli alias a 1 giorno⁻¹, la curva in fase.

   I calcoli stanno in F.calcolo.matcelesti (provati in
   tools/banchi/verifiche/verifica-sastromat.js).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, D = globale.document;
  var GRAD = Math.PI / 180, J2000 = 2451545.0, EPS = 23.4392911 * GRAD;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function ang360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  /* ── 1. Keplero: quattro metodi, ciascuno con la storia della convergenza ── */
  function kepleroNewton(M, e, nmax, E0) {
    var E = E0 != null ? E0 : (e < 0.8 ? M : Math.PI), st = [E];
    for (var k = 0; k < (nmax || 50); k++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; st.push(E); if (Math.abs(d) < 1e-16) break; }
    return { E: E, storia: st };
  }
  function kepleroPuntoFisso(M, e, nmax) {
    var E = M, st = [E];
    for (var k = 0; k < (nmax || 5000); k++) { var En = M + e * Math.sin(E); st.push(En); if (Math.abs(En - E) < 1e-16) { E = En; break; } E = En; }
    return { E: E, storia: st };
  }
  /* J_n(x) = (1/π)∫₀^π cos(nτ − x sin τ) dτ: con la regola dei trapezi la convergenza e'
     esponenziale perche' l'integrando e' periodico e analitico */
  function besselJ(n, x) {
    var N = Math.max(64, 2 * Math.ceil(n + Math.abs(x)) + 64), s = 0;
    for (var k = 0; k <= N; k++) { var tau = Math.PI * k / N, w = k === 0 || k === N ? 0.5 : 1; s += w * Math.cos(n * tau - x * Math.sin(tau)); }
    return s / N;
  }
  function kepleroBessel(M, e, N) {
    var E = M, st = [E];
    for (var k = 1; k <= N; k++) { E += 2 / k * besselJ(k, k * e) * Math.sin(k * M); st.push(E); }
    return { E: E, storia: st };
  }
  /* serie di Lagrange: E = M + Σ eⁿ/(2ⁿ⁻¹ n!) Σ_k (−1)^k C(n,k) (n − 2k)ⁿ⁻¹ sin((n − 2k)M) */
  function kepleroLagrange(M, e, N) {
    var E = M, st = [E], fatt = 1;
    for (var n = 1; n <= N; n++) {
      fatt *= n; var s = 0, C = 1;
      for (var k = 0; k <= Math.floor(n / 2); k++) { if (k > 0) C = C * (n - k + 1) / k; var m = n - 2 * k; s += (k % 2 ? -1 : 1) * C * Math.pow(m, n - 1) * Math.sin(m * M); }
      E += Math.pow(e, n) / (Math.pow(2, n - 1) * fatt) * s; st.push(E);
    }
    return { E: E, storia: st };
  }
  /* il limite di Laplace: x e^√(1+x²) / (1 + √(1+x²)) = 1 */
  function limiteLaplace() { var a = 0.5, b = 0.8; for (var k = 0; k < 200; k++) { var x = (a + b) / 2, s = Math.sqrt(1 + x * x); if (x * Math.exp(s) / (1 + s) < 1) a = x; else b = x; } return (a + b) / 2; }
  function veraDaE(E, e) { return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)); }

  /* ── 2. rotazioni, quaternioni, riferimenti celesti ── */
  function Rx(a) { var c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; }
  function Ry(a) { var c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; }
  function Rz(a) { var c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; }
  function mm(A, B) { var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j]; return C; }
  function mv(A, v) { return [A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2], A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2], A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]]; }
  function tr(A) { return [[A[0][0], A[1][0], A[2][0]], [A[0][1], A[1][1], A[2][1]], [A[0][2], A[1][2], A[2][2]]]; }
  function det(A) { return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]); }
  /* quaternioni [w, x, y, z] */
  function qAsse(asse, ang) { var n = Math.hypot(asse[0], asse[1], asse[2]), s = Math.sin(ang / 2) / n; return [Math.cos(ang / 2), asse[0] * s, asse[1] * s, asse[2] * s]; }
  function qMul(a, b) { return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]]; }
  function qConj(q) { return [q[0], -q[1], -q[2], -q[3]]; }
  function qRuota(q, v) { var p = qMul(qMul(q, [0, v[0], v[1], v[2]]), qConj(q)); return [p[1], p[2], p[3]]; }
  function qMatrice(q) {
    var w = q[0], x = q[1], y = q[2], z = q[3];
    return [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]];
  }
  /* dalla matrice al quaternione (metodo di Shepperd: si parte dal termine piu' grande) */
  function qDaMatrice(R) {
    var tr0 = R[0][0] + R[1][1] + R[2][2], q;
    if (tr0 > Math.max(R[0][0], R[1][1], R[2][2])) { var s = Math.sqrt(1 + tr0) * 2; q = [s / 4, (R[2][1] - R[1][2]) / s, (R[0][2] - R[2][0]) / s, (R[1][0] - R[0][1]) / s]; }
    else if (R[0][0] >= R[1][1] && R[0][0] >= R[2][2]) { s = Math.sqrt(1 + R[0][0] - R[1][1] - R[2][2]) * 2; q = [(R[2][1] - R[1][2]) / s, s / 4, (R[0][1] + R[1][0]) / s, (R[0][2] + R[2][0]) / s]; }
    else if (R[1][1] >= R[2][2]) { s = Math.sqrt(1 + R[1][1] - R[0][0] - R[2][2]) * 2; q = [(R[0][2] - R[2][0]) / s, (R[0][1] + R[1][0]) / s, s / 4, (R[1][2] + R[2][1]) / s]; }
    else { s = Math.sqrt(1 + R[2][2] - R[0][0] - R[1][1]) * 2; q = [(R[1][0] - R[0][1]) / s, (R[0][2] + R[2][0]) / s, (R[1][2] + R[2][1]) / s, s / 4]; }
    if (q[0] < 0) q = q.map(function (x) { return -x; });
    return q;
  }
  function slerp(a, b, u) {
    var c = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (c < 0) { b = b.map(function (x) { return -x; }); c = -c; }
    if (c > 0.9999995) { var r = a.map(function (x, i) { return x + (b[i] - x) * u; }), n = Math.hypot(r[0], r[1], r[2], r[3]); return r.map(function (x) { return x / n; }); }
    var th = Math.acos(c), s = Math.sin(th), ka = Math.sin((1 - u) * th) / s, kb = Math.sin(u * th) / s;
    return a.map(function (x, i) { return ka * x + kb * b[i]; });
  }
  function versore(lon, lat) { return [Math.cos(lat * GRAD) * Math.cos(lon * GRAD), Math.cos(lat * GRAD) * Math.sin(lon * GRAD), Math.sin(lat * GRAD)]; }
  function angoli(v) { return [ang360(Math.atan2(v[1], v[0]) / GRAD), Math.asin(Math.max(-1, Math.min(1, v[2] / Math.hypot(v[0], v[1], v[2])))) / GRAD]; }
  /* le matrici di cambio di riferimento: v_nuovo = M v_equatoriale */
  var EQ_ECL = Rx(-EPS);
  var EQ_GAL = [[-0.0548755604162154, -0.8734370902348850, -0.4838350155487132], [0.4941094278755837, -0.4448296299600112, 0.7469822444972189], [-0.8676661490190047, -0.1980763734312015, 0.4559837761750669]];
  function gmst(jd) { var T = (jd - J2000) / 36525; return ang360(280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * T * T - T * T * T / 38710000); }
  /* orizzontale (x = nord, y = ovest, z = zenit) da equatoriale: riflessione nell'angolo orario
     H = θ − α (che cresce verso ovest) e rotazione per la latitudine. Il prodotto ha det = +1 */
  function eqOrizz(theta, lat) {
    var th = theta * GRAD, f = lat * GRAD, Rf = [[-Math.sin(f), 0, Math.cos(f)], [0, 1, 0], [Math.cos(f), 0, Math.sin(f)]];
    return mm(Rf, [[Math.cos(th), Math.sin(th), 0], [Math.sin(th), -Math.cos(th), 0], [0, 0, 1]]);
  }
  /* altezza e azimut (da nord verso est) con le formule della trigonometria sferica */
  function altAzFormule(alfa, delta, theta, lat) {
    var H = (theta - alfa) * GRAD, d = delta * GRAD, f = lat * GRAD;
    var h = Math.asin(Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H));
    var A = Math.atan2(-Math.cos(d) * Math.sin(H), Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.cos(H) * Math.sin(f));
    return { alt: h / GRAD, az: ang360(A / GRAD), H: ang360(H / GRAD) };
  }
  function altAzMatrice(alfa, delta, theta, lat) { var v = mv(eqOrizz(theta, lat), versore(alfa, delta)); return { alt: Math.asin(v[2]) / GRAD, az: ang360(Math.atan2(-v[1], v[0]) / GRAD) }; }
  function altAzQuaternione(alfa, delta, theta, lat) { var v = qRuota(qDaMatrice(eqOrizz(theta, lat)), versore(alfa, delta)); return { alt: Math.asin(Math.max(-1, Math.min(1, v[2]))) / GRAD, az: ang360(Math.atan2(-v[1], v[0]) / GRAD) }; }
  function eqEcl(alfa, delta) { return angoli(mv(EQ_ECL, versore(alfa, delta))); }
  function eclEq(l, b) { return angoli(mv(tr(EQ_ECL), versore(l, b))); }
  function eqGal(alfa, delta) { return angoli(mv(EQ_GAL, versore(alfa, delta))); }
  function galEq(l, b) { return angoli(mv(tr(EQ_GAL), versore(l, b))); }
  /* stelle brillanti (α, δ J2000 in gradi, magnitudine visuale) */
  var STELLE = [['Sirio', 'Sirius', 101.287, -16.716, -1.46], ['Canopo', 'Canopus', 95.988, -52.696, -0.74], ['Arturo', 'Arcturus', 213.915, 19.182, -0.05], ['Vega', 'Vega', 279.234, 38.784, 0.03], ['Capella', 'Capella', 79.172, 45.998, 0.08], ['Rigel', 'Rigel', 78.634, -8.202, 0.13], ['Procione', 'Procyon', 114.825, 5.225, 0.34], ['Betelgeuse', 'Betelgeuse', 88.793, 7.407, 0.42], ['Achernar', 'Achernar', 24.429, -57.237, 0.46], ['Altair', 'Altair', 297.696, 8.868, 0.76], ['Aldebaran', 'Aldebaran', 68.980, 16.509, 0.86], ['Antares', 'Antares', 247.352, -26.432, 0.96], ['Spica', 'Spica', 201.298, -11.161, 0.97], ['Polluce', 'Pollux', 116.329, 28.026, 1.14], ['Fomalhaut', 'Fomalhaut', 344.413, -29.622, 1.16], ['Deneb', 'Deneb', 310.358, 45.280, 1.25], ['Regolo', 'Regulus', 152.093, 11.967, 1.35], ['Castore', 'Castor', 113.650, 31.888, 1.58], ['Polare', 'Polaris', 37.955, 89.264, 1.98], ['Acrux', 'Acrux', 186.650, -63.099, 0.76], ['Bellatrix', 'Bellatrix', 81.283, 6.350, 1.64], ['Alnilam', 'Alnilam', 84.053, -1.202, 1.69], ['Alnitak', 'Alnitak', 85.190, -1.943, 1.77], ['Mintaka', 'Mintaka', 83.002, -0.299, 2.23], ['Saiph', 'Saiph', 86.939, -9.670, 2.09], ['Dubhe', 'Dubhe', 165.932, 61.751, 1.79], ['Merak', 'Merak', 165.460, 56.383, 2.37], ['Phecda', 'Phecda', 178.458, 53.695, 2.44], ['Megrez', 'Megrez', 183.857, 57.033, 3.31], ['Alioth', 'Alioth', 193.507, 55.960, 1.77], ['Mizar', 'Mizar', 200.981, 54.925, 2.04], ['Alkaid', 'Alkaid', 206.885, 49.313, 1.86], ['Schedar', 'Schedar', 10.127, 56.537, 2.24], ['Caph', 'Caph', 2.295, 59.150, 2.28], ['γ Cas', 'γ Cas', 14.177, 60.717, 2.47], ['Ruchbah', 'Ruchbah', 21.454, 60.235, 2.68], ['Segin', 'Segin', 28.599, 63.670, 3.37]];
  var FIGURE = [['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Alnitak', 'Saiph'], ['Saiph', 'Rigel'], ['Rigel', 'Mintaka'], ['Alnitak', 'Betelgeuse'], ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid'], ['Caph', 'Schedar'], ['Schedar', 'γ Cas'], ['γ Cas', 'Ruchbah'], ['Ruchbah', 'Segin'], ['Castore', 'Polluce']];
  var ROMA = { lat: 41.9028, lon: 12.4964 };
  function giuliano(Y, M, Dd, ore) { if (M <= 2) { Y -= 1; M += 12; } var A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + Dd + B - 1524.5 + (ore || 0) / 24; }
  function esempioSirio(jd) {
    var g = gmst(jd), th = ang360(g + ROMA.lon), s = STELLE[0], a = altAzFormule(s[2], s[3], th, ROMA.lat), b = altAzMatrice(s[2], s[3], th, ROMA.lat), c = altAzQuaternione(s[2], s[3], th, ROMA.lat);
    return { jd: jd, gmst: g, lst: th, H: a.H, formule: a, matrice: b, quaternione: c };
  }

  /* ── 3. integratori sul problema di Keplero (μ = 1, a = 1, partenza al pericentro) ── */
  function accel(x, y) { var r2 = x * x + y * y, r3 = r2 * Math.sqrt(r2); return [-x / r3, -y / r3]; }
  function energia(s) { return (s[2] * s[2] + s[3] * s[3]) / 2 - 1 / Math.hypot(s[0], s[1]); }
  function momento(s) { return s[0] * s[3] - s[1] * s[2]; }
  var Y1 = 1 / (2 - Math.cbrt(2)), Y0 = -Math.cbrt(2) / (2 - Math.cbrt(2));
  function kdk(s, h) { var a = accel(s[0], s[1]), vx = s[2] + h / 2 * a[0], vy = s[3] + h / 2 * a[1], x = s[0] + h * vx, y = s[1] + h * vy, b = accel(x, y); return [x, y, vx + h / 2 * b[0], vy + h / 2 * b[1]]; }
  var PASSI = {
    eulero: function (s, h) { var a = accel(s[0], s[1]); return [s[0] + h * s[2], s[1] + h * s[3], s[2] + h * a[0], s[3] + h * a[1]]; },
    rk4: function (s, h) {
      function f(u) { var a = accel(u[0], u[1]); return [u[2], u[3], a[0], a[1]]; }
      function piu(u, k, c) { return [u[0] + c * k[0], u[1] + c * k[1], u[2] + c * k[2], u[3] + c * k[3]]; }
      var k1 = f(s), k2 = f(piu(s, k1, h / 2)), k3 = f(piu(s, k2, h / 2)), k4 = f(piu(s, k3, h));
      return [0, 1, 2, 3].map(function (i) { return s[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); });
    },
    leapfrog: kdk,
    /* Yoshida: tre passi leapfrog con pesi w₁, w₀, w₁ (w₀ < 0: un passo all'indietro) */
    yoshida: function (s, h) { return kdk(kdk(kdk(s, Y1 * h), Y0 * h), Y1 * h); }
  };
  function statoIniziale(e) { return [1 - e, 0, 0, Math.sqrt((1 + e) / (1 - e))]; }
  function integra(metodo, e, h, nPassi, ogni) {
    var s = statoIniziale(e), E0 = energia(s), L0 = momento(s), out = { t: [], x: [], y: [], dE: [], dL: [] }, p = PASSI[metodo];
    ogni = ogni || 1;
    for (var k = 0; k <= nPassi; k++) {
      if (k % ogni === 0) { out.t.push(k * h); out.x.push(s[0]); out.y.push(s[1]); out.dE.push((energia(s) - E0) / Math.abs(E0)); out.dL.push((momento(s) - L0) / L0); }
      if (k < nPassi) s = p(s, h);
    }
    out.fine = s; return out;
  }
  /* errore globale dopo un periodo (l'orbita esatta torna al punto di partenza) */
  function erroreGlobale(metodo, e, N) { var s = statoIniziale(e), h = 2 * Math.PI / N, p = PASSI[metodo]; for (var k = 0; k < N; k++) s = p(s, h); var s0 = statoIniziale(e); return Math.hypot(s[0] - s0[0], s[1] - s0[1]); }
  function pendenza(xs, ys) { var n = xs.length, mx = 0, my = 0; xs.forEach(function (x, i) { mx += x / n; my += ys[i] / n; }); var a = 0, b = 0; xs.forEach(function (x, i) { a += (x - mx) * (ys[i] - my); b += (x - mx) * (x - mx); }); return a / b; }
  /* ordine misurato: pendenza di log(errore) contro log(h) */
  function ordine(metodo, e, Ns) { var xs = [], ys = []; Ns.forEach(function (N) { xs.push(Math.log10(2 * Math.PI / N)); ys.push(Math.log10(erroreGlobale(metodo, e, N))); }); return { pendenza: pendenza(xs, ys), x: xs, y: ys }; }
  /* precessione del pericentro dal vettore di Laplace-Runge-Lenz dopo n orbite */
  function precessione(metodo, e, N, orbite) {
    var s = statoIniziale(e), h = 2 * Math.PI / N, p = PASSI[metodo]; for (var k = 0; k < N * orbite; k++) s = p(s, h);
    var L = momento(s), ex = s[3] * L - s[0] / Math.hypot(s[0], s[1]), ey = -s[2] * L - s[1] / Math.hypot(s[0], s[1]);
    return Math.atan2(ey, ex) / GRAD / orbite;
  }

  /* ── 4. curve di luce e periodogrammi ── */
  var VARIABILI = {
    cefeide: { nome: ['Cefeide (δ Cephei, 5,366 d)', 'Cepheid (δ Cephei, 5.366 d)'], P: 5.366249, forma: function (f) { return -0.36 * Math.cos(2 * Math.PI * f) - 0.13 * Math.cos(4 * Math.PI * f + 0.9) - 0.05 * Math.cos(6 * Math.PI * f + 1.8); } },
    rrlyrae: { nome: ['RR Lyrae (0,5669 d)', 'RR Lyrae (0.5669 d)'], P: 0.566838, forma: function (f) { return -0.4 * Math.cos(2 * Math.PI * f) - 0.2 * Math.cos(4 * Math.PI * f + 1.0) - 0.12 * Math.cos(6 * Math.PI * f + 2.0) - 0.07 * Math.cos(8 * Math.PI * f + 3.0); } },
    algol: { nome: ['Binaria a eclisse (Algol, 2,867 d)', 'Eclipsing binary (Algol, 2.867 d)'], P: 2.867328, forma: function (f) { var d = Math.min(f, 1 - f), d2 = Math.abs(f - 0.5); return (d < 0.05 ? 1.3 * (1 - Math.pow(d / 0.05, 2)) : 0) + (d2 < 0.05 ? 0.06 * (1 - Math.pow(d2 / 0.05, 2)) : 0); } },
    transito: { nome: ['Pianeta in transito (HD 209458 b, 3,525 d)', 'Transiting planet (HD 209458 b, 3.525 d)'], P: 3.524749, forma: function (f) { var d = Math.min(f, 1 - f); return d < 0.0177 ? 0.016 : 0; } },
    seno: { nome: ['Sinusoide pura (1,3 d)', 'Pure sinusoid (1.3 d)'], P: 1.3, forma: function (f) { return 0.2 * Math.sin(2 * Math.PI * f); } }
  };
  /* osservazioni da terra: notti serene (65 %), qualche ora attorno a mezzanotte, rumore gaussiano */
  function osservazioni(tipo, P, notti, perNotte, sigma, seme) {
    var rnd = mulberry32(seme || 1), V = VARIABILI[tipo], t0 = rnd() * P, tt = [], yy = [];
    function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd()); }
    for (var n = 0; n < notti; n++) {
      if (rnd() > 0.65) continue;
      var k = Math.max(1, Math.round(perNotte * (0.5 + rnd())));
      for (var j = 0; j < k; j++) { var x = n + (rnd() - 0.5) * 0.34, f = (((x - t0) / P) % 1 + 1) % 1; tt.push(x); yy.push(10 + V.forma(f) + sigma * gauss()); }
    }
    return { t: tt, y: yy, t0: t0, P: P };
  }
  /* Lomb–Scargle (normalizzazione «standard»: frazione della varianza spiegata da una sinusoide) */
  function lombScargle(tt, yy, freq) {
    var N = tt.length, m = 0, i; for (i = 0; i < N; i++) m += yy[i] / N;
    var v = 0; for (i = 0; i < N; i++) v += (yy[i] - m) * (yy[i] - m);
    return freq.map(function (f) {
      var w = 2 * Math.PI * f, s2 = 0, c2 = 0;
      for (var i = 0; i < N; i++) { s2 += Math.sin(2 * w * tt[i]); c2 += Math.cos(2 * w * tt[i]); }
      var tau = Math.atan2(s2, c2) / (2 * w), yc = 0, ys = 0, cc = 0, ss = 0;
      for (i = 0; i < N; i++) { var a = w * (tt[i] - tau), c = Math.cos(a), s = Math.sin(a), d = yy[i] - m; yc += d * c; ys += d * s; cc += c * c; ss += s * s; }
      return (yc * yc / cc + ys * ys / ss) / v;
    });
  }
  /* Box Least Squares (Kovács et al. 2002): per ogni periodo la scatola che separa meglio
     i punti dentro da quelli fuori; SR = s²/(r(1 − r)) */
  function bls(tt, yy, freq, nb, qmax) {
    var N = tt.length, m = 0, i; for (i = 0; i < N; i++) m += yy[i] / N;
    nb = nb || 200; qmax = qmax || 0.08;
    var kmax = Math.max(1, Math.round(qmax * nb)), cn = new Float64Array(nb), cs = new Float64Array(nb);
    return freq.map(function (f) {
      cn.fill(0); cs.fill(0);
      for (var i = 0; i < N; i++) { var ph = tt[i] * f; ph -= Math.floor(ph); var b = Math.min(nb - 1, Math.floor(ph * nb)); cn[b]++; cs[b] += yy[i] - m; }
      var best = 0;
      for (var a = 0; a < nb; a++) { var n = 0, s = 0; for (var k = 0; k < kmax; k++) { var j = (a + k) % nb; n += cn[j]; s += cs[j]; if (n > 0 && n < N) { var r = n / N, sr = s * s / (N * N * r * (1 - r)); if (sr > best) best = sr; } } }
      return best;
    });
  }
  function griglia(tt, fmax, sovra) { var T = Math.max.apply(null, tt) - Math.min.apply(null, tt), fmin = 1 / T, df = 1 / (T * (sovra || 10)), out = []; for (var f = fmin; f <= fmax; f += df) out.push(f); return out; }
  /* il picco, raffinato con la sezione aurea intorno al massimo della griglia */
  function picco(fun, freq, pot) {
    var k = 0; for (var i = 1; i < pot.length; i++) if (pot[i] > pot[k]) k = i;
    var a = freq[Math.max(0, k - 1)], b = freq[Math.min(freq.length - 1, k + 1)], g = (Math.sqrt(5) - 1) / 2;
    var x1 = b - g * (b - a), x2 = a + g * (b - a), f1 = fun(x1), f2 = fun(x2);
    for (var j = 0; j < 40; j++) { if (f1 > f2) { b = x2; x2 = x1; f2 = f1; x1 = b - g * (b - a); f1 = fun(x1); } else { a = x1; x1 = x2; f1 = f2; x2 = a + g * (b - a); f2 = fun(x2); } }
    var fb = (a + b) / 2; return { f: fb, P: 1 / fb, potenza: fun(fb) };
  }
  function trovaPeriodo(tt, yy, metodo, fmax) {
    var fr = griglia(tt, fmax || 5, metodo === 'bls' ? 4 : 10), fn = metodo === 'bls' ? function (f) { return bls(tt, yy, [f])[0]; } : function (f) { return lombScargle(tt, yy, [f])[0]; };
    var pot = metodo === 'bls' ? bls(tt, yy, fr) : lombScargle(tt, yy, fr);
    return picco(fn, fr, pot);
  }
  /* probabilita' di falso allarme (Scargle/Baluev semplificata): M frequenze indipendenti */
  function falsoAllarme(P, N, M) { var p1 = Math.pow(1 - P, (N - 3) / 2); return 1 - Math.pow(1 - p1, M); }

  F.calcolo.matcelesti = {
    kepleroNewton: kepleroNewton, kepleroPuntoFisso: kepleroPuntoFisso, kepleroBessel: kepleroBessel, kepleroLagrange: kepleroLagrange, besselJ: besselJ, limiteLaplace: limiteLaplace, veraDaE: veraDaE,
    Rx: Rx, Ry: Ry, Rz: Rz, mm: mm, mv: mv, tr: tr, det: det, qAsse: qAsse, qMul: qMul, qConj: qConj, qRuota: qRuota, qMatrice: qMatrice, qDaMatrice: qDaMatrice, slerp: slerp,
    versore: versore, angoli: angoli, EQ_ECL: EQ_ECL, EQ_GAL: EQ_GAL, gmst: gmst, giuliano: giuliano, eqOrizz: eqOrizz, altAzFormule: altAzFormule, altAzMatrice: altAzMatrice, altAzQuaternione: altAzQuaternione,
    eqEcl: eqEcl, eclEq: eclEq, eqGal: eqGal, galEq: galEq, STELLE: STELLE, ROMA: ROMA, esempioSirio: esempioSirio,
    PASSI: PASSI, integra: integra, energia: energia, momento: momento, statoIniziale: statoIniziale, erroreGlobale: erroreGlobale, ordine: ordine, precessione: precessione, pendenza: pendenza,
    VARIABILI: VARIABILI, osservazioni: osservazioni, lombScargle: lombScargle, bls: bls, griglia: griglia, picco: picco, trovaPeriodo: trovaPeriodo, falsoAllarme: falsoAllarme
  };

  /* ═══ disegno ═══════════════════════════════════════════════════════════ */
  function grigliaUI(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  var COL = { newton: '#5eead4', fisso: '#ffd24a', bessel: '#c9a0ff', lagrange: '#ff8a80', eulero: '#ff8a80', rk4: '#ffd24a', leapfrog: '#5eead4', yoshida: '#c9a0ff' };

  /* ═══ 1. Keplero ═════════════════════════════════════════════════════════ */
  function schedaKeplero(div) {
    var G0 = grigliaUI(div), pan = G0.pan, st = { e: 0.6, M: 40, N: 20, gira: true };
    F.cursore(pan, ['eccentricità e', 'eccentricity e'], 0, 0.97, 0.01, st.e, function (v) { st.e = v; grafici(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['anomalia media M per i grafici (°)', 'mean anomaly M for the charts (°)'], 1, 359, 1, st.M, function (v) { st.M = v; grafici(); }, function (v) { return v + '°'; });
    F.cursore(pan, ['termini delle serie', 'series terms'], 2, 60, 1, st.N, function (v) { st.N = v; grafici(); });
    var info = nota(pan);
    nota(pan, t('Newton: E ← E − (E − e sin E − M)/(1 − e cos E); l’errore si eleva al quadrato a ogni passo (le cifre giuste raddoppiano). Punto fisso: E ← M + e sin E è una contrazione con costante |e cos E| < 1, quindi converge sempre, ma linearmente: per e vicino a 1 servono centinaia di passi. Serie di Bessel: E = M + Σ (2/k) J_k(ke) sin kM converge per ogni e < 1, lentamente vicino a 1. Serie di Lagrange in potenze di e: converge solo per e < 0,6627 (limite di Laplace), oltre i termini crescono e la somma esplode. Il grafico in basso mostra le anomalie: la vera ν corre avanti alla media M dopo il pericentro (equazione del centro).',
      'Newton: E ← E − (E − e sin E − M)/(1 − e cos E); the error is squared at each step (correct digits double). Fixed point: E ← M + e sin E is a contraction with constant |e cos E| < 1, so it always converges, but linearly: for e close to 1 it needs hundreds of steps. Bessel series: E = M + Σ (2/k) J_k(ke) sin kM converges for any e < 1, slowly near 1. Lagrange series in powers of e: converges only for e < 0.6627 (Laplace limit); beyond, the terms grow and the sum blows up. The lower chart shows the anomalies: the true ν runs ahead of the mean M after periapsis (equation of the centre).'));
    var ca = F.tela(G0.dx, 0.6), cc = F.tela(G0.dx, 0.5), cn = F.tela(G0.dx, 0.42);
    var Mt = 0;
    F.anima(ca, function (dt) {
      Mt = (Mt + dt * 0.6) % (2 * Math.PI);
      var P = F.pennello(ca), q = P.q, W = P.W, H = P.H, e = st.e, a = Math.min(W * 0.4, H * 0.42), b = a * Math.sqrt(1 - e * e), cx = W / 2, cy = H / 2, fx = cx + a * e;
      var E = kepleroNewton(Mt, e).E, nu = veraDaE(E, e), px = cx + a * Math.cos(E), py = cy - b * Math.sin(E), Qx = cx + a * Math.cos(E), Qy = cy - a * Math.sin(E), Mx = cx + a * Math.cos(Mt), My = cy - a * Math.sin(Mt);
      q.strokeStyle = '#34465f'; q.setLineDash([4, 4]); q.beginPath(); q.arc(cx, cy, a, 0, 2 * Math.PI); q.stroke(); q.setLineDash([]);
      q.strokeStyle = '#5eead4'; q.lineWidth = 2; q.beginPath(); q.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI); q.stroke(); q.lineWidth = 1;
      q.strokeStyle = '#5b6b80'; q.beginPath(); q.moveTo(cx - a - 10, cy); q.lineTo(cx + a + 10, cy); q.stroke();
      /* raggi e archi */
      q.strokeStyle = '#ff8a80'; q.beginPath(); q.moveTo(cx, cy); q.lineTo(Mx, My); q.stroke();
      q.strokeStyle = '#c9a0ff'; q.beginPath(); q.moveTo(cx, cy); q.lineTo(Qx, Qy); q.stroke(); q.setLineDash([2, 3]); q.beginPath(); q.moveTo(Qx, Qy); q.lineTo(px, py); q.stroke(); q.setLineDash([]);
      q.strokeStyle = '#ffd24a'; q.beginPath(); q.moveTo(cx - a * e, cy); q.lineTo(px, py); q.stroke();
      function arco(x, y, r, a1, col, et) { q.strokeStyle = col; q.beginPath(); q.arc(x, y, r, 0, -a1, a1 > 0); q.stroke(); q.fillStyle = col; q.font = '12px system-ui,sans-serif'; q.fillText(et, x + (r + 8) * Math.cos(a1 / 2) - 4, y - (r + 8) * Math.sin(a1 / 2) + 4); }
      var nn = ((nu % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), EE = ((E % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      arco(cx, cy, 26, Mt, '#ff8a80', 'M'); arco(cx, cy, 40, EE, '#c9a0ff', 'E'); arco(cx - a * e, cy, 22, nn, '#ffd24a', 'ν');
      /* il Sole nel fuoco (a sinistra: x = −ae con la convenzione x = a(cos E − e) traslata) */
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx - a * e, cy, 7, 0, 7); q.fill();
      q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(Mx, My, 4, 0, 7); q.fill();
      q.fillStyle = '#c9a0ff'; q.beginPath(); q.arc(Qx, Qy, 4, 0, 7); q.fill();
      q.fillStyle = '#6bcfff'; q.beginPath(); q.arc(px, py, 7, 0, 7); q.fill();
      void fx;
      q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'left';
      q.fillText('M = ' + (Mt / GRAD).toFixed(1) + '°   E = ' + (EE / GRAD).toFixed(1) + '°   ν = ' + (nn / GRAD).toFixed(1) + '°', 10, 18);
      q.fillStyle = '#8494a8'; q.fillText(t('punto rosso: pianeta fittizio (moto medio); viola: sul cerchio ausiliario; azzurro: il pianeta', 'red: fictitious planet (mean motion); violet: on the auxiliary circle; blue: the planet'), 10, H - 8);
      ca.setAttribute('aria-label', t('Ellisse con le anomalie media, eccentrica e vera, e = ', 'Ellipse with mean, eccentric and true anomalies, e = ') + e.toFixed(2));
    });
    function grafici() {
      var e = st.e, M = st.M * GRAD, rif = kepleroNewton(M, e, 80).E;
      var ser = [], it = [];
      function err(storia) { return storia.map(function (E) { return Math.max(-16.5, Math.log10(Math.abs(E - rif) + 1e-18)); }); }
      var n = kepleroNewton(M, e, 30), p = kepleroPuntoFisso(M, e, 300), b = kepleroBessel(M, e, st.N), l = kepleroLagrange(M, e, st.N);
      [[n, 'newton', ['Newton', 'Newton']], [p, 'fisso', ['punto fisso', 'fixed point']], [b, 'bessel', ['serie di Bessel', 'Bessel series']], [l, 'lagrange', ['serie di Lagrange', 'Lagrange series']]].forEach(function (z) {
        var y = err(z[0].storia).slice(0, 61), x = y.map(function (_, k) { return k; }); ser.push({ x: x, y: y.map(function (v) { return Math.min(4, v); }), col: COL[z[1]], etich: z[2] });
        var k = z[0].storia.findIndex(function (E) { return Math.abs(E - rif) < 1e-12; }); it.push([z[2], k]);
      });
      F.grafico(cc, { serie: ser, ymin: -16.5, ymax: 2, xl: ['iterazione (o numero di termini)', 'iteration (or number of terms)'], yl: ['log₁₀ |E_k − E|', 'log₁₀ |E_k − E|'], legenda: ser.map(function (s) { return { col: s.col, etich: s.etich }; }), descr: ['Convergenza dei metodi per l’equazione di Keplero', 'Convergence of the methods for Kepler’s equation'] });
      var Ms = [], Es = [], Ns = []; for (var k = 0; k <= 360; k += 2) { var EE = kepleroNewton(k * GRAD, e).E; Ms.push(k); Es.push((EE / GRAD) - k); Ns.push(((veraDaE(EE, e) / GRAD - k) + 540) % 360 - 180); }
      F.grafico(cn, { serie: [{ x: Ms, y: Es, col: '#c9a0ff', etich: ['E − M', 'E − M'] }, { x: Ms, y: Ns, col: '#ffd24a', etich: ['ν − M', 'ν − M'] }], xl: ['anomalia media M (°)', 'mean anomaly M (°)'], yl: ['differenza (°)', 'difference (°)'], legenda: [{ col: '#c9a0ff', etich: ['E − M = e sin E', 'E − M = e sin E'] }, { col: '#ffd24a', etich: ['ν − M (equazione del centro)', 'ν − M (equation of the centre)'] }], descr: ['Anomalia eccentrica e vera meno anomalia media', 'Eccentric and true minus mean anomaly'] });
      info.innerHTML = 'E = ' + (rif / GRAD).toFixed(10) + '° · ' + t('residuo ', 'residual ') + Math.abs(rif - e * Math.sin(rif) - M).toExponential(1) + '<br>' + t('Passi (o termini) per arrivare a 10⁻¹²: ', 'Steps (or terms) to reach 10⁻¹²: ') + it.map(function (x) { return F.tt(x[0]) + ' <b>' + (x[1] < 0 ? '> ' + (x[0][0] === 'punto fisso' ? 300 : st.N) : x[1]) + '</b>'; }).join(', ') + '<br>' +
        t('Limite di Laplace: ', 'Laplace limit: ') + limiteLaplace().toFixed(7) + (e > limiteLaplace() ? ' <span class="bsiFX-ko">' + t('— qui la serie di Lagrange diverge', '— here the Lagrange series diverges') + '</span>' : '');
    }
    grafici();
  }

  /* ═══ 2. la sfera celeste ════════════════════════════════════════════════ */
  function schedaSfera(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div'); g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var lab = globale.BSILab3D;
    if (!lab) { nota(pan, t('Serve il Laboratorio 3D (bsi-lab3d.js).', 'The 3D Laboratory (bsi-lab3d.js) is required.')); return; }
    var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); destra.appendChild(attesa);
    lab.stile();
    lab.caricaThree().then(function () { attesa.remove(); var S = new lab.Scena(destra, 0.68); div._scena = S; costruisci(pan, S, destra); }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    function costruisci(pan, S, destra) {
      var T = S.T, st = { ore: 21, giorno: 15, vis: { eq: true, ecl: true, oriz: true, gal: false }, bersaglio: 'eq', u: 1, da: [1, 0, 0, 0], a: [1, 0, 0, 0] };
      F.cursore(pan, ['Giorno di gennaio 2026', 'Day of January 2026'], 1, 31, 1, st.giorno, function (v) { st.giorno = v; aggiorna(); });
      F.cursore(pan, ['Ora (UT)', 'Time (UT)'], 0, 24, 0.05, st.ore, function (v) { st.ore = v; aggiorna(); }, function (v) { var h = Math.floor(v), m = Math.round((v - h) * 60); if (m === 60) { h++; m = 0; } return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; });
      [['eq', ['Equatore celeste e griglia equatoriale', 'Celestial equator and equatorial grid']], ['ecl', ['Eclittica', 'Ecliptic']], ['oriz', ['Orizzonte di Roma e zenit', 'Rome horizon and zenith']], ['gal', ['Equatore galattico', 'Galactic equator']]].forEach(function (c) {
        var x = F.el('input', { type: 'checkbox' }); x.checked = st.vis[c[0]]; x.addEventListener('change', function () { st.vis[c[0]] = x.checked; visibilita(); });
        pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:3px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [x, F.el('span', { testo: F.tt(c[1]) })]));
      });
      F.scelta(pan, ['Porta in alto il polo del riferimento (slerp)', 'Bring the frame’s pole up (slerp)'], [['eq', t('equatoriale', 'equatorial')], ['ecl', t('eclittico', 'ecliptic')], ['oriz', t('orizzontale (Roma)', 'horizontal (Rome)')], ['gal', t('galattico', 'galactic')]], st.bersaglio, function (v) { st.bersaglio = v; st.da = slerp(st.da, st.a, Math.min(1, st.u)); st.a = qDaMatrice(matrice(v)); st.u = 0; S.avvia(); });
      var info = nota(pan), esempio = nota(pan);
      nota(pan, t('Ogni riferimento è una rotazione dell’equatoriale: eclittico = R_x(−ε)·v, galattico = la matrice IAU (polo nord galattico α = 192,859°, δ = 27,128°), orizzontale = R_y-like(90° − φ)·(riflessione nell’angolo orario H = θ − α). Una rotazione si può scrivere anche come quaternione q = (cos θ/2, n sin θ/2) e applicare come q v q*; il quaternione si ricava dalla matrice (metodo di Shepperd) e la slerp q(u) = [sin((1−u)Ω) q₀ + sin(uΩ) q₁]/sin Ω interpola a velocità angolare costante: è il modo giusto di animare un cambio di riferimento (interpolare le matrici elemento per elemento non dà rotazioni).',
        'Each frame is a rotation of the equatorial one: ecliptic = R_x(−ε)·v, galactic = the IAU matrix (north galactic pole α = 192.859°, δ = 27.128°), horizontal = R(90° − φ)·(reflection in hour angle H = θ − α). A rotation can also be written as a quaternion q = (cos θ/2, n sin θ/2) and applied as q v q*; the quaternion comes from the matrix (Shepperd’s method) and slerp q(u) = [sin((1−u)Ω) q₀ + sin(uΩ) q₁]/sin Ω interpolates at constant angular speed: the right way to animate a change of frame (interpolating matrices element by element does not give rotations).'));
      function jd() { return giuliano(2026, 1, st.giorno, st.ore); }
      function lst() { return ang360(gmst(jd()) + ROMA.lon); }
      function matrice(nome) { return nome === 'ecl' ? EQ_ECL : nome === 'gal' ? EQ_GAL : nome === 'oriz' ? eqOrizz(lst(), ROMA.lat) : [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; }
      var R = 5, mondo = new T.Group(); S.aggiungi(mondo);
      S.aggiungi(new T.AmbientLight(0xffffff, 0.6));
      /* l'osservatore al centro: una piccola Terra */
      mondo.add(new T.Mesh(new T.SphereGeometry(0.35, 32, 20), new T.MeshStandardMaterial({ color: 0x3a6ea8, roughness: 0.6 })));
      mondo.add(new T.Mesh(new T.SphereGeometry(R, 48, 32), new T.MeshBasicMaterial({ color: 0x0b1a2e, transparent: true, opacity: 0.25, side: T.BackSide, depthWrite: false })));
      function cerchioDa(M, lat, col, opac) { /* cerchio a latitudine lat nel riferimento M (v_rif = M v_eq ⇒ v_eq = Mᵀ v_rif) */ var Mt = tr(M), pts = []; for (var k = 0; k <= 180; k++) pts.push(mv(Mt, versore(k * 2, lat)).map(function (x) { return x * R; })); return lab.linea(T, pts, col, opac); }
      function meridianoDa(M, lon, col, opac) { var Mt = tr(M), pts = []; for (var k = -90; k <= 90; k += 2) pts.push(mv(Mt, versore(lon, k)).map(function (x) { return x * R; })); return lab.linea(T, pts, col, opac); }
      var gruppi = { eq: new T.Group(), ecl: new T.Group(), oriz: new T.Group(), gal: new T.Group() };
      Object.keys(gruppi).forEach(function (k) { mondo.add(gruppi[k]); });
      var I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      gruppi.eq.add(cerchioDa(I, 0, 0x5eead4, 0.9)); [-60, -30, 30, 60].forEach(function (l) { gruppi.eq.add(cerchioDa(I, l, 0x5eead4, 0.25)); }); for (var h = 0; h < 24; h += 2) gruppi.eq.add(meridianoDa(I, h * 15, 0x5eead4, 0.18));
      gruppi.eq.add(lab.linea(T, [[0, 0, -R * 1.15], [0, 0, R * 1.15]], 0x5eead4, 0.7));
      var ePN = lab.testo3d(T, t('PNC', 'NCP'), '#5eead4', 0.3); ePN.position.set(0, 0, R * 1.22); gruppi.eq.add(ePN);
      gruppi.ecl.add(cerchioDa(EQ_ECL, 0, 0xffd24a, 0.9)); var eg = lab.testo3d(T, '♈ γ', '#ffd24a', 0.35); eg.position.set(R * 1.08, 0, 0); gruppi.ecl.add(eg);
      gruppi.gal.add(cerchioDa(EQ_GAL, 0, 0xc9a0ff, 0.9)); var cG = mv(tr(EQ_GAL), [1, 0, 0]).map(function (x) { return x * R; }), eC = lab.testo3d(T, t('centro galattico', 'galactic centre'), '#c9a0ff', 0.28); eC.position.set(cG[0], cG[1], cG[2]); gruppi.gal.add(eC);
      /* stelle e figure */
      var pos = [], col = [], nomi = {};
      STELLE.forEach(function (s) { var v = versore(s[2], s[3]).map(function (x) { return x * R * 0.995; }); nomi[s[0]] = v; pos.push(v[0], v[1], v[2]); var l = Math.max(0.35, 1 - (s[4] + 1.5) / 5.5); col.push(l, l, l * 0.95); });
      var gs = new T.BufferGeometry(); gs.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); gs.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      mondo.add(new T.Points(gs, new T.PointsMaterial({ size: 6, sizeAttenuation: false, vertexColors: true })));
      var seg = []; FIGURE.forEach(function (f) { seg.push(nomi[f[0]], nomi[f[1]]); });
      mondo.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(seg.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })), new T.LineBasicMaterial({ color: 0x8494a8, transparent: true, opacity: 0.7 })));
      ['Sirio', 'Betelgeuse', 'Rigel', 'Vega', 'Polare', 'Arturo', 'Antares', 'Canopo', 'Deneb', 'Altair', 'Dubhe', 'Schedar'].forEach(function (n) { var s = STELLE.filter(function (x) { return x[0] === n; })[0], e = lab.testo3d(T, F.tt([s[0], s[1]]), n === 'Sirio' ? '#ffd24a' : '#cfe3f7', 0.22), v = nomi[n]; e.position.set(v[0] * 1.04, v[1] * 1.04, v[2] * 1.04); mondo.add(e); });
      /* triade di assi del riferimento scelto */
      var triade = new T.Group(); mondo.add(triade);
      function costruisciOriz() {
        while (gruppi.oriz.children.length) { var o = gruppi.oriz.children.pop(); o.geometry && o.geometry.dispose(); }
        var M = eqOrizz(lst(), ROMA.lat), Mt = tr(M);
        gruppi.oriz.add(cerchioDa(M, 0, 0x7ee081, 0.95)); gruppi.oriz.add(cerchioDa(M, 30, 0x7ee081, 0.25)); gruppi.oriz.add(cerchioDa(M, 60, 0x7ee081, 0.25));
        var z = mv(Mt, [0, 0, 1]).map(function (x) { return x * R; }); gruppi.oriz.add(lab.linea(T, [[0, 0, 0], z], 0x7ee081, 0.8));
        var ez = lab.testo3d(T, t('zenit', 'zenith'), '#7ee081', 0.28); ez.position.set(z[0] * 1.06, z[1] * 1.06, z[2] * 1.06); gruppi.oriz.add(ez);
        [['N', 0], ['E', 90], ['S', 180], ['O', 270]].forEach(function (c) { var v = mv(Mt, [Math.cos(c[1] * GRAD), -Math.sin(c[1] * GRAD), 0]).map(function (x) { return x * R * 1.06; }), e = lab.testo3d(T, c[0] === 'O' ? t('O', 'W') : c[0], '#7ee081', 0.3); e.position.set(v[0], v[1], v[2]); gruppi.oriz.add(e); });
        var dsk = new T.Mesh(new T.CircleGeometry(R, 64), new T.MeshBasicMaterial({ color: 0x1d3a22, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false }));
        dsk.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(z[0] / R, z[1] / R, z[2] / R)); gruppi.oriz.add(dsk);
      }
      function visibilita() { Object.keys(gruppi).forEach(function (k) { gruppi[k].visible = st.vis[k]; }); S.sporca = true; S.avvia(); }
      function aggiorna() {
        costruisciOriz();
        if (st.bersaglio === 'oriz') { st.a = qDaMatrice(matrice('oriz')); if (st.u >= 1) st.da = st.a; }
        var E = esempioSirio(jd()), c = E.formule, m = E.matrice, qq = E.quaternione, q = qDaMatrice(eqOrizz(E.lst, ROMA.lat));
        var hms = function (g) { var h = g / 15, H = Math.floor(h), mi = Math.floor((h - H) * 60), s = ((h - H) * 60 - mi) * 60; return H + 'h ' + mi + 'm ' + s.toFixed(1) + 's'; };
        esempio.innerHTML = '<b>' + t('Esempio svolto: Sirio vista da Roma', 'Worked example: Sirius seen from Rome') + '</b> (φ = 41,903° N, λ = 12,496° E)<br>' +
          'JD = ' + E.jd.toFixed(5) + ', T = (JD − 2451545)/36525<br>θ₀ = 280,46061837° + 360,98564736629°·(JD − 2451545) + 0,000387933 T² − T³/38 710 000 = <b>' + E.gmst.toFixed(4) + '°</b> (' + hms(E.gmst) + ')<br>' +
          t('tempo siderale locale θ = θ₀ + λ = ', 'local sidereal time θ = θ₀ + λ = ') + E.lst.toFixed(4) + '°<br>α = 101,287°, δ = −16,716° → H = θ − α = ' + E.H.toFixed(4) + '°<br>' +
          'sin h = sin φ sin δ + cos φ cos δ cos H → h = <b>' + c.alt.toFixed(4) + '°</b><br>tan A = −cos δ sin H / (sin δ cos φ − cos δ cos H sin φ) → A = <b>' + c.az.toFixed(4) + '°</b> ' + t('(da nord verso est)', '(from north through east)') + '<br>' +
          t('Con la matrice: ', 'With the matrix: ') + 'h = ' + m.alt.toFixed(10) + '°, A = ' + m.az.toFixed(10) + '°<br>' + t('Con il quaternione ', 'With the quaternion ') + 'q = (' + q.map(function (x) { return x.toFixed(4); }).join(', ') + '): h = ' + qq.alt.toFixed(10) + '°' +
          (c.alt < 0 ? '<br>' + t('Sirio è sotto l’orizzonte.', 'Sirius is below the horizon.') : '');
        S.didascalia.textContent = t('Sfera celeste vista dall’esterno, ', 'Celestial sphere seen from outside, ') + st.giorno + '/01/2026 ' + st.ore.toFixed(2) + ' UT · ' + t('θ locale ', 'local θ ') + E.lst.toFixed(1) + '°';
        S.sporca = true; S.avvia();
      }
      function triadaPer(q) {
        while (triade.children.length) { var o = triade.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); }); }
        /* gli assi del riferimento di destinazione, espressi nel mondo equatoriale: colonne di Mᵀ */
        var M = tr(matrice(st.bersaglio)); [[0xff6b6b, 0], [0x7ee081, 1], [0x6bcfff, 2]].forEach(function (c) { var v = [M[0][c[1]], M[1][c[1]], M[2][c[1]]]; triade.add(lab.freccia(T, [0, 0, 0], v.map(function (x) { return x * 2.2; }), c[0], 0.3)); });
        void q;
      }
      visibilita(); aggiorna(); triadaPer();
      var Qm = new T.Quaternion();
      S.ogniFotogramma(function (dt) {
        if (st.u < 1) { st.u = Math.min(1, st.u + dt / 2.2); if (st.u >= 1) st.da = st.a; triadaPer(); }
        var q = slerp(st.da, st.a, st.u);
        /* il mondo ruota con la matrice del riferimento: il polo del riferimento va su z */
        Qm.set(q[1], q[2], q[3], q[0]); mondo.quaternion.copy(Qm);
        var M = qMatrice(q), Mo = matrice(st.bersaglio), qa = qDaMatrice(Mo);
        info.innerHTML = t('Rotazione verso il riferimento ', 'Rotation towards the frame ') + '<b>' + ({ eq: t('equatoriale', 'equatorial'), ecl: t('eclittico', 'ecliptic'), oriz: t('orizzontale', 'horizontal'), gal: t('galattico', 'galactic') })[st.bersaglio] + '</b>, slerp u = ' + st.u.toFixed(2) + '<br>q(u) = (' + q.map(function (x) { return x.toFixed(4); }).join(', ') + ')<br>' +
          t('Matrice del cambio di riferimento M (v′ = M v):', 'Change-of-frame matrix M (v′ = M v):') + '<table class="bsiFX-tab">' + Mo.map(function (r) { return '<tr>' + r.map(function (x) { return '<td>' + x.toFixed(5) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
          'det M = ' + det(Mo).toFixed(12) + ' · ' + t('angolo di rotazione ', 'rotation angle ') + (2 * Math.acos(Math.min(1, Math.abs(qa[0]))) / GRAD).toFixed(3) + '° · |M − M(q)| = ' + (function () { var Mq = qMatrice(qa), s = 0; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) s = Math.max(s, Math.abs(Mq[i][j] - Mo[i][j])); return s.toExponential(1); })();
        void M;
        return st.u < 1;
      });
      S.inquadra(15, -0.9, 1.15);
    }
  }

  /* ═══ 3. integratori ════════════════════════════════════════════════════ */
  function schedaIntegratori(div) {
    var G0 = grigliaUI(div), pan = G0.pan, st = { e: 0.5, N: 100, orbite: 30, met: { eulero: true, rk4: true, leapfrog: true, yoshida: true } };
    F.cursore(pan, ['eccentricità e', 'eccentricity e'], 0, 0.9, 0.05, st.e, function (v) { st.e = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['passi per orbita (h = 2π/N)', 'steps per orbit (h = 2π/N)'], 20, 1000, 10, st.N, function (v) { st.N = v; calcola(); });
    F.cursore(pan, ['orbite', 'orbits'], 1, 200, 1, st.orbite, function (v) { st.orbite = v; calcola(); });
    Object.keys(st.met).forEach(function (m) { var x = F.el('input', { type: 'checkbox' }); x.checked = true; x.addEventListener('change', function () { st.met[m] = x.checked; calcola(); }); pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:3px 0;font-size:.84rem;color:' + COL[m] + ';cursor:pointer' }, [x, F.el('span', { testo: { eulero: t('Eulero (ordine 1)', 'Euler (order 1)'), rk4: 'Runge-Kutta 4', leapfrog: t('Leapfrog / Verlet (2, simplettico)', 'Leapfrog / Verlet (2, symplectic)'), yoshida: t('Yoshida (4, simplettico)', 'Yoshida (4, symplectic)') }[m] })])); });
    var info = nota(pan);
    nota(pan, t('Un integratore simplettico (leapfrog, Yoshida) conserva esattamente un’energia «ombra» vicina a quella vera: l’errore sull’energia oscilla ma non cresce, anche per milioni di orbite; il momento angolare (forza centrale) è conservato fino all’arrotondamento. RK4 è più preciso a parità di passo ma dissipa: l’energia deriva lentamente e l’orbita si stringe. Eulero esplicito aggiunge energia a ogni passo e il pianeta spirala via. Leapfrog = kick–drift–kick; Yoshida = tre leapfrog con pesi w₁ = 1/(2 − ∛2), w₀ = −∛2/(2 − ∛2), w₁. L’ordine si misura dalla pendenza di log(errore) contro log(h): 1, 4, 2, 4. Per gli N corpi del Sistema solare si usano proprio i simplettici (Wisdom–Holman).',
      'A symplectic integrator (leapfrog, Yoshida) exactly conserves a “shadow” energy close to the true one: the energy error oscillates but does not grow, even over millions of orbits; angular momentum (central force) is conserved to round-off. RK4 is more accurate at the same step but dissipative: energy slowly drifts and the orbit shrinks. Explicit Euler adds energy at every step and the planet spirals away. Leapfrog = kick–drift–kick; Yoshida = three leapfrogs with weights w₁ = 1/(2 − ∛2), w₀ = −∛2/(2 − ∛2), w₁. The order is measured from the slope of log(error) versus log(h): 1, 4, 2, 4. For the N bodies of the Solar System symplectic methods are used (Wisdom–Holman).'));
    var co = F.tela(G0.dx, 0.62), ce = F.tela(G0.dx, 0.45), cs = F.tela(G0.dx, 0.45);
    var dati = {}, k = 0;
    function calcola() {
      var n = st.N * st.orbite, ogni = Math.max(1, Math.floor(n / 1500)); dati = {};
      Object.keys(st.met).forEach(function (m) { if (st.met[m]) dati[m] = integra(m, st.e, 2 * Math.PI / st.N, n, ogni); });
      k = 0;
      var ser = [];
      Object.keys(dati).forEach(function (m) { ser.push({ x: dati[m].t.map(function (x) { return x / (2 * Math.PI); }), y: dati[m].dE.map(function (v) { return Math.max(-16, Math.log10(Math.abs(v) + 1e-17)); }), col: COL[m], larg: 1.4, etich: [m, m] }); });
      if (ser.length) F.grafico(ce, { serie: ser, xl: ['orbite', 'orbits'], yl: ['log₁₀ |ΔE/E|', 'log₁₀ |ΔE/E|'], legenda: Object.keys(dati).map(function (m) { return { col: COL[m], etich: [m, m] }; }), descr: ['Errore relativo sull’energia nel tempo', 'Relative energy error over time'] });
      if (studio) disegnaStudio(); else avviaStudio();
      var testo = Object.keys(dati).map(function (m) { var d = dati[m], mx = 0, ml = 0; d.dE.forEach(function (v) { mx = Math.max(mx, Math.abs(v)); }); d.dL.forEach(function (v) { ml = Math.max(ml, Math.abs(v)); }); return '<span style="color:' + COL[m] + '">' + m + '</span>: max|ΔE/E| = ' + mx.toExponential(1) + ', max|ΔL/L| = ' + ml.toExponential(1); });
      info.innerHTML = 'h = 2π/' + st.N + ' = ' + (2 * Math.PI / st.N).toFixed(4) + ', ' + st.orbite + t(' orbite', ' orbits') + '<br>' + testo.join('<br>') + (dati.leapfrog ? '<br>' + t('Precessione spuria del pericentro (leapfrog): ', 'Spurious periapsis precession (leapfrog): ') + precessione('leapfrog', st.e, st.N, Math.min(st.orbite, 20)).toExponential(2) + '°/' + t('orbita', 'orbit') : '') + '<span class="sastromat-ordini"></span>';
      scriviOrdini();
    }
    /* lo studio del passo (e = 0,3) non dipende dai cursori: si calcola una volta, un metodo per giro */
    var studio = null, inCorso = false;
    function avviaStudio() {
      if (inCorso) return; inCorso = true; var acc = [], metodi = ['eulero', 'rk4', 'leapfrog', 'yoshida'];
      (function uno(i) {
        if (i >= metodi.length) { studio = acc; inCorso = false; disegnaStudio(); scriviOrdini(); return; }
        var m = metodi[i], o = ordine(m, 0.3, m === 'eulero' ? [400, 800, 1600, 3200, 6400] : m === 'rk4' ? [150, 225, 340, 500, 750] : m === 'yoshida' ? [60, 90, 135, 200, 300] : [40, 80, 160, 320, 640]);
        acc.push([m, o]); setTimeout(function () { uno(i + 1); }, 0);
      })(0);
    }
    function disegnaStudio() {
      var serS = studio.map(function (z) { return { x: z[1].x, y: z[1].y, col: COL[z[0]], etich: [z[0], z[0]] }; });
      F.grafico(cs, { serie: serS, punti: [].concat.apply([], serS.map(function (s) { return s.x.map(function (x, i) { return { x: x, y: s.y[i], col: s.col, r: 3 }; }); })), xl: ['log₁₀ h', 'log₁₀ h'], yl: ['log₁₀ errore dopo un’orbita', 'log₁₀ error after one orbit'], legenda: studio.map(function (z) { return { col: COL[z[0]], etich: [z[0] + ': ' + t('pendenza ', 'slope ') + z[1].pendenza.toFixed(2), z[0] + ': slope ' + z[1].pendenza.toFixed(2)] }; }), descr: ['Errore globale contro passo, scala log-log (e = 0,3)', 'Global error versus step, log-log (e = 0.3)'] });
    }
    function scriviOrdini() { var el = info.querySelector('.sastromat-ordini'); if (el && studio) el.innerHTML = '<br>' + t('Ordini misurati: ', 'Measured orders: ') + studio.map(function (z) { return z[0] + ' ' + z[1].pendenza.toFixed(2); }).join(', '); }
    calcola();
    F.anima(co, function (dt) {
      var P = F.pennello(co), q = P.q, W = P.W, H = P.H, sc = Math.min(W, H) / (2 * (1 + st.e) + 0.6) * 0.95, cx = W * 0.5 + sc * st.e * 0.5, cy = H / 2;
      var n = 0; Object.keys(dati).forEach(function (m) { n = Math.max(n, dati[m].x.length); });
      k = Math.min(n - 1, k + Math.max(1, Math.round(dt * n / 8)));
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx, cy, 6, 0, 7); q.fill();
      Object.keys(dati).forEach(function (m) {
        var d = dati[m], K = Math.min(k, d.x.length - 1); q.strokeStyle = COL[m]; q.globalAlpha = 0.75; q.lineWidth = 1.2; q.beginPath();
        for (var i = 0; i <= K; i++) { var x = cx + d.x[i] * sc, y = cy - d.y[i] * sc; if (Math.abs(d.x[i]) > 50 || Math.abs(d.y[i]) > 50) break; if (i) q.lineTo(x, y); else q.moveTo(x, y); }
        q.stroke(); q.globalAlpha = 1; q.fillStyle = COL[m]; q.beginPath(); q.arc(cx + d.x[K] * sc, cy - d.y[K] * sc, 4, 0, 7); q.fill();
      });
      q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(t('orbita ', 'orbit ') + (n ? (k / (n - 1) * st.orbite).toFixed(1) : 0) + ' / ' + st.orbite, 10, 18);
      co.setAttribute('aria-label', t('Orbite di Keplero calcolate con quattro integratori', 'Kepler orbits computed with four integrators'));
      if (k >= n - 1) k = 0;
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 4. periodogrammi ══════════════════════════════════════════════════ */
  function schedaPeriodogramma(div) {
    var G0 = grigliaUI(div), pan = G0.pan, st = { tipo: 'cefeide', P: VARIABILI.cefeide.P, notti: 60, perNotte: 5, sigma: 0.05, seme: 7 };
    var cP;
    F.scelta(pan, ['Stella', 'Star'], Object.keys(VARIABILI).map(function (k) { return [k, F.tt(VARIABILI[k].nome)]; }), st.tipo, function (v) { st.tipo = v; cP.value = Math.log10(VARIABILI[v].P); cP.dispatchEvent(new Event('input')); st.P = VARIABILI[v].P; cP.parentNode.querySelector('b').textContent = st.P.toFixed(4); calcola(); });
    cP = F.cursore(pan, ['periodo vero (giorni)', 'true period (days)'], -0.5, 1.3, 0.0001, Math.log10(st.P), function (v) { st.P = Math.pow(10, v); calcola(); }, function (v) { return Math.pow(10, v).toFixed(4); });
    F.cursore(pan, ['notti di osservazione', 'observing nights'], 10, 150, 1, st.notti, function (v) { st.notti = v; calcola(); });
    F.cursore(pan, ['misure per notte (media)', 'measurements per night (mean)'], 1, 15, 1, st.perNotte, function (v) { st.perNotte = v; calcola(); });
    F.cursore(pan, ['rumore σ (mag)', 'noise σ (mag)'], 0, 0.3, 0.005, st.sigma, function (v) { st.sigma = v; calcola(); }, function (v) { return v.toFixed(3); });
    F.bottone(pan, ['Nuove osservazioni', 'New observations'], function () { st.seme++; calcola(); });
    var info = nota(pan);
    nota(pan, t('Lomb–Scargle: per ogni frequenza f si adatta ai dati, con i minimi quadrati, y = A cos ωt + B sin ωt; la potenza è la frazione della varianza spiegata. Lo sfasamento τ, con tan 2ωτ = Σ sin 2ωt / Σ cos 2ωt, rende il risultato indipendente dall’origine dei tempi; con campionamento uniforme coincide con il periodogramma di Fourier. Le osservazioni da terra sono solo di notte: la finestra spettrale ha picchi a 1 giorno⁻¹ e compaiono alias a f ± 1, f ± 2 d⁻¹ (linee tratteggiate). Per un transito, un buco stretto e rado, la sinusoide è una pessima ipotesi: si usa la Box Least Squares, che adatta una scatola.',
      'Lomb–Scargle: for each frequency f the data are fitted by least squares with y = A cos ωt + B sin ωt; the power is the fraction of variance explained. The phase τ, with tan 2ωτ = Σ sin 2ωt / Σ cos 2ωt, makes the result independent of the time origin; with uniform sampling it equals the Fourier periodogram. Ground-based observations are only at night: the spectral window has peaks at 1 day⁻¹ and aliases appear at f ± 1, f ± 2 d⁻¹ (dashed lines). For a transit, a narrow and rare dip, a sinusoid is a poor hypothesis: Box Least Squares fits a box instead.'));
    var cl = F.tela(G0.dx, 0.4), cg = F.tela(G0.dx, 0.42), cf = F.tela(G0.dx, 0.42);
    var lavoro = 0;
    function calcola() {
      var id = ++lavoro, O = osservazioni(st.tipo, st.P, st.notti, st.perNotte, st.sigma, st.seme), metodo = st.tipo === 'transito' ? 'bls' : 'ls', fmax = Math.max(5, 2.5 / st.P);
      F.grafico(cl, { punti: O.t.map(function (x, i) { return { x: x, y: -O.y[i], col: '#cfe3f7', r: 2 }; }), xl: ['tempo (giorni)', 'time (days)'], yl: ['−magnitudine', '−magnitude'], descr: ['Curva di luce osservata, ' + O.t.length + ' misure', 'Observed light curve, ' + O.t.length + ' measurements'] });
      var fr = griglia(O.t, fmax, metodo === 'bls' ? 4 : 10), pot = new Array(fr.length), i0 = 0;
      info.innerHTML = t('Calcolo del periodogramma… ', 'Computing the periodogram… ');
      (function lotto() {
        if (id !== lavoro) return;
        var t0 = Date.now();
        while (i0 < fr.length && Date.now() - t0 < 25) { var fine = Math.min(fr.length, i0 + 40), parte = metodo === 'bls' ? bls(O.t, O.y, fr.slice(i0, fine)) : lombScargle(O.t, O.y, fr.slice(i0, fine)); for (var j = 0; j < parte.length; j++) pot[i0 + j] = parte[j]; i0 = fine; }
        if (i0 < fr.length) { setTimeout(lotto, 0); return; }
        mostra(O, fr, pot, metodo);
      })();
    }
    function mostra(O, fr, pot, metodo) {
      var fn = metodo === 'bls' ? function (f) { return bls(O.t, O.y, [f])[0]; } : function (f) { return lombScargle(O.t, O.y, [f])[0]; };
      var pk = picco(fn, fr, pot), f0 = 1 / st.P, err = (pk.P / st.P - 1) * 100, mx = Math.max.apply(null, pot);
      var pres = st.tipo === 'algol' && Math.abs(pk.P * 2 / st.P - 1) < 0.01 ? pk.P * 2 : pk.P;
      var o = F.grafico(cg, { serie: [{ x: fr, y: pot.map(function (v) { return v / mx; }), col: '#5eead4', larg: 1.2, etich: [metodo === 'bls' ? 'BLS' : 'Lomb–Scargle', metodo === 'bls' ? 'BLS' : 'Lomb–Scargle'] }], punti: [{ x: pk.f, y: pk.potenza / mx, col: '#ffd24a', r: 5 }], ymin: 0, ymax: 1.08, xl: ['frequenza (giorni⁻¹)', 'frequency (days⁻¹)'], yl: [metodo === 'bls' ? 'potenza BLS (norm.)' : 'potenza LS (norm.)', metodo === 'bls' ? 'BLS power (norm.)' : 'LS power (norm.)'], descr: ['Periodogramma con il picco trovato', 'Periodogram with the peak found'] });
      var q = o.q; q.save(); q.setLineDash([3, 4]);
      [-2, -1, 1, 2].forEach(function (k) { var f = f0 + k; if (f > fr[0] && f < fr[fr.length - 1]) { q.strokeStyle = 'rgba(255,138,128,.6)'; q.beginPath(); q.moveTo(o.X(f), 14); q.lineTo(o.X(f), o.H - 40); q.stroke(); } });
      q.strokeStyle = '#ffd24a'; q.setLineDash([]); q.beginPath(); q.moveTo(o.X(f0), 14); q.lineTo(o.X(f0), 30); q.stroke(); q.restore();
      /* curva in fase sul periodo trovato, due cicli */
      var pts = []; O.t.forEach(function (x, i) { var ph = ((x / pres) % 1 + 1) % 1; pts.push({ x: ph, y: -O.y[i], col: '#cfe3f7', r: 2 }); pts.push({ x: ph + 1, y: -O.y[i], col: 'rgba(207,227,247,.45)', r: 2 }); });
      F.grafico(cf, { punti: pts, xmin: 0, xmax: 2, xl: ['fase (P = ' + pres.toFixed(5) + ' d)', 'phase (P = ' + pres.toFixed(5) + ' d)'], yl: ['−magnitudine', '−magnitude'], descr: ['Curva di luce ripiegata in fase sul periodo trovato', 'Light curve folded on the period found'] });
      var M = Math.round((fr[fr.length - 1] - fr[0]) * (O.t[O.t.length - 1] - O.t[0])), fap = metodo === 'ls' ? falsoAllarme(pk.potenza, O.t.length, M) : null;
      info.innerHTML = O.t.length + t(' misure in ', ' measurements over ') + Math.round(O.t[O.t.length - 1] - O.t[0]) + t(' giorni', ' days') + '<br>' + t('Periodo trovato ', 'Period found ') + '<b>' + pk.P.toFixed(5) + ' d</b>' + (pres !== pk.P ? ' → ×2 = ' + pres.toFixed(5) + t(' d (due minimi per ciclo: il picco è a P/2)', ' d (two minima per cycle: the peak is at P/2)') : '') + '<br>' + t('Periodo vero ', 'True period ') + st.P.toFixed(5) + ' d · ' + t('scarto ', 'error ') + '<b>' + ((pres / st.P - 1) * 100).toFixed(3) + ' %</b>' +
        (fap != null ? '<br>' + t('Potenza ', 'Power ') + pk.potenza.toFixed(3) + t(', falso allarme ≈ ', ', false-alarm probability ≈ ') + (fap < 1e-10 ? '< 10⁻¹⁰' : fap.toExponential(1)) + ' (' + M + t(' frequenze indipendenti)', ' independent frequencies)') : '<br>' + t('BLS: potenza SR = s²/(r(1 − r)) della scatola migliore', 'BLS: SR = s²/(r(1 − r)) of the best box'));
      void err;
    }
    calcola();
  }

  F.sezione('sastromat', {
    titolo: ['📐 Matematica celeste', '📐 Celestial mathematics'],
    sotto: ['La matematica sotto l’astrofisica: l’equazione di Keplero e i suoi metodi, la trigonometria sferica con matrici di rotazione e quaternioni sulla sfera celeste in 3D, gli integratori numerici per gli N corpi (simplettici e non), i periodogrammi che trovano il periodo di una stella variabile o di un pianeta in transito.', 'The mathematics beneath astrophysics: Kepler’s equation and its methods, spherical trigonometry with rotation matrices and quaternions on the 3D celestial sphere, numerical integrators for the N-body problem (symplectic and not), periodograms that find the period of a variable star or a transiting planet.'],
    schede: [
      { nome: ['🔁 Equazione di Keplero', '🔁 Kepler’s equation'], costruisci: schedaKeplero },
      { nome: ['🌐 Sfera celeste e rotazioni', '🌐 Celestial sphere and rotations'], costruisci: schedaSfera },
      { nome: ['🧮 Integratori N corpi', '🧮 N-body integrators'], costruisci: schedaIntegratori },
      { nome: ['📈 Periodogrammi', '📈 Periodograms'], costruisci: schedaPeriodogramma }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
