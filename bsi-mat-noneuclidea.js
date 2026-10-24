/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-noneuclidea.js — 🌐 geometrie non euclidee
   BioSpecInfo · © Samuele Pio Provenzano

   Che cosa succede alla geometria quando cade il quinto postulato:

   · GEOMETRIA SFERICA: una sfera che si ruota col dito, tre vertici da
     spostare, il triangolo di archi di cerchio massimo; la somma degli
     angoli supera π di esattamente area/R² (Girard, 1629); gli angoli si
     calcolano in due modi (legge sferica dei coseni e vettori tangenti) e
     l'area anche con la formula di Van Oosterom-Strackee; le distanze fra
     città con la formula dell'emisenoverso (R = 6371 km);
   · GEOMETRIA IPERBOLICA nel disco di Poincaré: le rette sono archi di
     cerchio ortogonali al bordo; un triangolo ha somma degli angoli < π e
     area π − (α + β + γ); per un punto fuori da una retta passano infinite
     parallele; le tassellazioni regolari {7,3} e {5,4} costruite per
     riflessioni successive (inversioni circolari);
   · CURVATURA: la curvatura gaussiana K di sfera (+1/R²), piano (0), sella
     e pseudosfera (< 0), la circonferenza dei cerchi geodetici
     C(r) = 2πr − (π/3) K r³ + … (Bertrand-Diguet-Puiseux) e il trasporto
     parallelo lungo un triangolo sferico, che ruota il vettore di un angolo
     uguale all'area racchiusa (olonomia).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI, RAD = PI / 180;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function gradi(x) { return (x / RAD).toFixed(2) + '°'; }

  /* ═══ calcoli: vettori in 3D ═══════════════════════════════════════════ */
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function croce(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norma(a) { return Math.sqrt(dot(a, a)); }
  function unit(a) { var n = norma(a); return [a[0] / n, a[1] / n, a[2] / n]; }
  function comb(a, x, b, y) { return [a[0] * x + b[0] * y, a[1] * x + b[1] * y, a[2] * x + b[2] * y]; }
  /* latitudine e longitudine in gradi → versore */
  function vett(lat, lon) { var f = lat * RAD, l = lon * RAD; return [Math.cos(f) * Math.cos(l), Math.cos(f) * Math.sin(l), Math.sin(f)]; }
  function latlon(v) { return [Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD, Math.atan2(v[1], v[0]) / RAD]; }

  /* ═══ geometria sferica (sfera unitaria; le lunghezze si moltiplicano per R, le aree per R²) ═══ */
  /* angolo al centro con atan2: preciso anche per punti vicinissimi o quasi antipodali */
  function distCentrale(a, b) { return Math.atan2(norma(croce(a, b)), dot(a, b)); }
  /* formula dell'emisenoverso: d = 2R asin √(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2)) */
  function haversine(lat1, lon1, lat2, lon2, R) {
    var f1 = lat1 * RAD, f2 = lat2 * RAD, df = f2 - f1, dl = (lon2 - lon1) * RAD;
    var h = Math.pow(Math.sin(df / 2), 2) + Math.cos(f1) * Math.cos(f2) * Math.pow(Math.sin(dl / 2), 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  /* angolo in A fra gli archi AB e AC: l'angolo fra i vettori tangenti B − (A·B)A e C − (A·C)A */
  function angoloVett(A, B, C) { var tb = comb(B, 1, A, -dot(A, B)), tc = comb(C, 1, A, -dot(A, C)); return Math.atan2(norma(croce(tb, tc)), dot(tb, tc)); }
  function angoliVettori(A, B, C) { return [angoloVett(A, B, C), angoloVett(B, C, A), angoloVett(C, A, B)]; }
  /* legge sferica dei coseni: cos A = (cos a − cos b cos c)/(sin b sin c) */
  function angoliCoseni(A, B, C) {
    var a = distCentrale(B, C), b = distCentrale(A, C), c = distCentrale(A, B);
    function ang(x, y, z) { return Math.acos(Math.max(-1, Math.min(1, (Math.cos(x) - Math.cos(y) * Math.cos(z)) / (Math.sin(y) * Math.sin(z))))); }
    return [ang(a, b, c), ang(b, c, a), ang(c, a, b)];
  }
  /* triangolo completo: lati, angoli, eccesso (Girard), area con Van Oosterom-Strackee: tan(E/2) = |A·(B×C)|/(1 + A·B + B·C + C·A) */
  function triangoloSferico(A, B, C, R) {
    R = R || 1;
    var ang = angoliVettori(A, B, C), E = ang[0] + ang[1] + ang[2] - PI;
    var Evs = 2 * Math.atan2(Math.abs(dot(A, croce(B, C))), 1 + dot(A, B) + dot(B, C) + dot(C, A));
    return { lati: [distCentrale(B, C) * R, distCentrale(A, C) * R, distCentrale(A, B) * R], angoli: ang, somma: ang[0] + ang[1] + ang[2], eccesso: E, areaGirard: E * R * R, areaVOS: Evs * R * R, orient: dot(A, croce(B, C)) >= 0 ? 1 : -1 };
  }
  /* punti lungo l'arco di cerchio massimo (slerp) */
  function arco(a, b, n) {
    var w = distCentrale(a, b), s = Math.sin(w), out = [];
    for (var i = 0; i <= n; i++) { var u = i / n; out.push(s < 1e-9 ? a.slice() : comb(a, Math.sin((1 - u) * w) / s, b, Math.sin(u * w) / s)); }
    return out;
  }
  var CITTA = { roma: [['Roma', 'Rome'], 41.9028, 12.4964], ny: [['New York', 'New York'], 40.7128, -74.0060], tokyo: [['Tokyo', 'Tokyo'], 35.6762, 139.6503], sydney: [['Sydney', 'Sydney'], -33.8688, 151.2093] };
  var R_TERRA = 6371;

  /* ═══ geometria iperbolica nel disco di Poincaré ═══
     un punto è [x, y] con x² + y² < 1; una geodetica è {retta: true, u: versore} (un diametro)
     oppure {c: centro, r: raggio} di una circonferenza ortogonale al bordo (|c|² = r² + 1) */
  function d2(a, b) { return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]); }
  function modulo2(a) { return a[0] * a[0] + a[1] * a[1]; }
  /* la circonferenza per p e q ortogonale al bordo: |c − p|² = |c|² − 1 ⇒ c·p = (1 + |p|²)/2, e lo stesso per q.
     Vale anche se q è un punto ideale (|q| = 1). Se p, q e l'origine sono allineati la geodetica è un diametro */
  function geodetica(p, q) {
    var det = p[0] * q[1] - p[1] * q[0];
    if (Math.abs(det) < 1e-12) { var v = modulo2(p) > modulo2(q) ? p : q, n = Math.sqrt(modulo2(v)) || 1; return { retta: true, u: n > 0 ? [v[0] / n, v[1] / n] : [1, 0] }; }
    var bp = (1 + modulo2(p)) / 2, bq = (1 + modulo2(q)) / 2, c = [(bp * q[1] - p[1] * bq) / det, (p[0] * bq - bp * q[0]) / det];
    return { c: c, r: Math.sqrt(Math.max(0, modulo2(c) - 1)) };
  }
  /* la geodetica che passa per P con direzione θ: il centro sta sulla normale, a distanza λ = (1 − |P|²)/(2 P·n) */
  function geodeticaDir(P, th) {
    var u = [Math.cos(th), Math.sin(th)], n = [-u[1], u[0]], pn = P[0] * n[0] + P[1] * n[1];
    if (Math.abs(pn) < 1e-12) return { retta: true, u: u };
    var lam = (1 - modulo2(P)) / (2 * pn);
    return { c: [P[0] + lam * n[0], P[1] + lam * n[1]], r: Math.abs(lam) };
  }
  /* i due punti ideali (sul bordo) di una geodetica: X·c = 1 e |X| = 1 */
  function estremi(g) {
    if (g.retta) return [[g.u[0], g.u[1]], [-g.u[0], -g.u[1]]];
    var m2 = modulo2(g.c), m = Math.sqrt(m2), h = Math.sqrt(Math.max(0, 1 - 1 / m2)), b = [g.c[0] / m2, g.c[1] / m2], pp = [-g.c[1] / m, g.c[0] / m];
    return [[b[0] + h * pp[0], b[1] + h * pp[1]], [b[0] - h * pp[0], b[1] - h * pp[1]]];
  }
  /* distanza iperbolica (curvatura −1): cosh d = 1 + 2|p − q|²/((1 − |p|²)(1 − |q|²)) */
  function distH(p, q) { return Math.acosh(1 + 2 * d2(p, q) / ((1 - modulo2(p)) * (1 - modulo2(q)))); }
  /* versore tangente in p alla geodetica verso q: sull'arco interno al disco (meno di mezzo cerchio) punta verso la corda */
  function tangente(p, q) {
    var g = geodetica(p, q), v;
    if (g.retta) v = [q[0] - p[0], q[1] - p[1]];
    else { v = [-(p[1] - g.c[1]), p[0] - g.c[0]]; if (v[0] * (q[0] - p[0]) + v[1] * (q[1] - p[1]) < 0) v = [-v[0], -v[1]]; }
    var n = Math.sqrt(modulo2(v)) || 1; return [v[0] / n, v[1] / n];
  }
  /* il modello è conforme: l'angolo iperbolico è l'angolo euclideo fra le tangenti */
  function angoloH(V, P, Q) { var a = tangente(V, P), b = tangente(V, Q); return Math.atan2(Math.abs(a[0] * b[1] - a[1] * b[0]), a[0] * b[0] + a[1] * b[1]); }
  function triangoloIperb(A, B, C) {
    var ang = [angoloH(A, B, C), angoloH(B, C, A), angoloH(C, A, B)], s = ang[0] + ang[1] + ang[2];
    return { angoli: ang, somma: s, difetto: PI - s, area: PI - s, lati: [distH(B, C), distH(A, C), distH(A, B)] };
  }
  /* z dalla stessa parte di R rispetto alla geodetica per p, q (serve per decidere se z è dentro il triangolo) */
  function stessaParte(p, q, R, z) {
    var g = geodetica(p, q);
    if (g.retta) { var s1 = g.u[0] * R[1] - g.u[1] * R[0], s2 = g.u[0] * z[1] - g.u[1] * z[0]; return s1 * s2 >= 0; }
    return (d2(R, g.c) - g.r * g.r) * (d2(z, g.c) - g.r * g.r) >= 0;
  }
  function dentroTriangolo(A, B, C, z) { return stessaParte(B, C, A, z) && stessaParte(A, C, B, z) && stessaParte(A, B, C, z); }
  /* due geodetiche si tagliano se i loro estremi ideali si alternano sul bordo */
  function suArco(x, a, b) { var tx = Math.atan2(x[1], x[0]), ta = Math.atan2(a[1], a[0]), tb = Math.atan2(b[1], b[0]); var w = (tb - ta + 4 * PI) % (2 * PI), v = (tx - ta + 4 * PI) % (2 * PI); return v < w; }
  function siTagliano(g1, g2) { var e1 = estremi(g1), e2 = estremi(g2); return suArco(e2[0], e1[0], e1[1]) !== suArco(e2[1], e1[0], e1[1]); }
  /* riflessione iperbolica in una geodetica = inversione nel suo cerchio (o simmetria rispetto al diametro) */
  function rifletti(g, z) {
    if (g.retta) { var k = 2 * (z[0] * g.u[0] + z[1] * g.u[1]); return [k * g.u[0] - z[0], k * g.u[1] - z[1]]; }
    var dx = z[0] - g.c[0], dy = z[1] - g.c[1], q = g.r * g.r / (dx * dx + dy * dy);
    return [g.c[0] + q * dx, g.c[1] + q * dy];
  }
  /* trasformazione di Möbius che porta a in 0 (isometria del disco): T(z) = (z − a)/(1 − ā z) */
  function mobius(a, z) {
    var nr = [z[0] - a[0], z[1] - a[1]], dr = [1 - (a[0] * z[0] + a[1] * z[1]), -(a[0] * z[1] - a[1] * z[0])], m = dr[0] * dr[0] + dr[1] * dr[1];
    return [(nr[0] * dr[0] + nr[1] * dr[1]) / m, (nr[1] * dr[0] - nr[0] * dr[1]) / m];
  }
  /* tassellazione regolare {p, q}: il p-gono centrale ha raggio iperbolico ρ con cosh ρ = cot(π/p) cot(π/q),
     e il lato ℓ con cosh(ℓ/2) = cos(π/p)/sin(π/q) (triangolo caratteristico di angoli π/p, π/q, π/2);
     nel disco r₀ = tanh(ρ/2); le altre tessere nascono riflettendo nei lati, in ampiezza, fino alla profondità data */
  function tassellazione(p, qv, prof, maxTessere) {
    if ((p - 2) * (qv - 2) <= 4) return { tessere: [], r0: NaN };
    var rho = Math.acosh(1 / (Math.tan(PI / p) * Math.tan(PI / qv))), r0 = Math.tanh(rho / 2), V = [];
    for (var k = 0; k < p; k++) V.push([r0 * Math.cos(2 * PI * k / p + PI / p), r0 * Math.sin(2 * PI * k / p + PI / p)]);
    var tessere = [{ v: V, c: [0, 0], prof: 0 }], visti = { '0,0': 1 }, coda = [tessere[0]], cap = maxTessere || 3000;
    while (coda.length && tessere.length < cap) {
      var T = coda.shift(); if (T.prof >= prof) continue;
      for (k = 0; k < p && tessere.length < cap; k++) {
        var g = geodetica(T.v[k], T.v[(k + 1) % p]), c = rifletti(g, T.c);
        if (modulo2(c) > 0.9985) continue;
        var chiave = Math.round(c[0] * 1e6) + ',' + Math.round(c[1] * 1e6);
        if (visti[chiave]) continue; visti[chiave] = 1;
        /* i vertici riflessi in ordine inverso: l'orientazione si conserva */
        var nv = T.v.map(function (z) { return rifletti(g, z); }).reverse(), N = { v: nv, c: c, prof: T.prof + 1 };
        tessere.push(N); coda.push(N);
      }
    }
    return { tessere: tessere, r0: r0, rho: rho, lato: 2 * Math.acosh(Math.cos(PI / p) / Math.sin(PI / qv)), areaTessera: (p - 2) * PI - 2 * PI * p / qv };
  }

  /* ═══ curvatura ═══ */
  /* superficie grafico z = f(x, y): K = (f_xx f_yy − f_xy²)/(1 + f_x² + f_y²)² con differenze finite */
  function curvaturaGrafico(f, x, y, h) {
    h = h || 1e-3;
    var fx = (f(x + h, y) - f(x - h, y)) / (2 * h), fy = (f(x, y + h) - f(x, y - h)) / (2 * h);
    var fxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h), fyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h);
    var fxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);
    return (fxx * fyy - fxy * fxy) / Math.pow(1 + fx * fx + fy * fy, 2);
  }
  /* superficie di rotazione con profilo (ρ(s), z(s)): K = z'(ρ'z'' − ρ''z') / (ρ (ρ'² + z'²)²) */
  function curvaturaRotazione(rho, zf, s, h) {
    h = h || 1e-4;
    var r1 = (rho(s + h) - rho(s - h)) / (2 * h), z1 = (zf(s + h) - zf(s - h)) / (2 * h), r2 = (rho(s + h) - 2 * rho(s) + rho(s - h)) / (h * h), z2 = (zf(s + h) - 2 * zf(s) + zf(s - h)) / (h * h);
    return z1 * (r1 * z2 - r2 * z1) / (rho(s) * Math.pow(r1 * r1 + z1 * z1, 2));
  }
  var SUPERFICI = {
    sfera: [['sfera, K = +1/R²', 'sphere, K = +1/R²'], function (R) { return 1 / (R * R); }],
    piano: [['piano (o cilindro), K = 0', 'plane (or cylinder), K = 0'], function () { return 0; }],
    sella: [['sella z = (x² − y²)/(2R), K = −1/R² al centro', 'saddle z = (x² − y²)/(2R), K = −1/R² at the centre'], function (R) { return -1 / (R * R); }],
    pseudo: [['pseudosfera (trattricoide), K = −1/R²', 'pseudosphere (tractricoid), K = −1/R²'], function (R) { return -1 / (R * R); }]
  };
  /* circonferenza di un cerchio geodetico di raggio r su una superficie di curvatura costante K */
  function circonferenza(K, r) {
    if (Math.abs(K) < 1e-15) return 2 * PI * r;
    var k = Math.sqrt(Math.abs(K));
    return K > 0 ? 2 * PI * Math.sin(k * r) / k : 2 * PI * Math.sinh(k * r) / k;
  }
  function circonferenzaSerie(K, r) { return 2 * PI * r - PI / 3 * K * r * r * r; }
  /* misura «da geometra» sulla sfera di raggio R: N punti a distanza geodetica r dal polo, somma delle corde */
  function circonferenzaMisurata(R, r, N) {
    var th = r / R, s = 0, prev = null;
    for (var i = 0; i <= N; i++) { var l = 2 * PI * i / N, p = [R * Math.sin(th) * Math.cos(l), R * Math.sin(th) * Math.sin(l), R * Math.cos(th)]; if (prev) s += norma(comb(p, 1, prev, -1)); prev = p; }
    return s;
  }
  /* trasporto parallelo ESATTO lungo un arco di cerchio massimo: rotazione attorno all'asse a×b (Rodrigues) */
  function ruota(v, k, ang) { var c = Math.cos(ang), s = Math.sin(ang), kv = croce(k, v), kd = dot(k, v); return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)]; }
  /* percorre A → B → C → A; restituisce i fotogrammi (punto, vettore) e l'angolo di rotazione finale con segno attorno ad A */
  function trasporto(A, B, C, v0, passiPerLato) {
    var n = passiPerLato || 60, fr = [], v = v0.slice(), vert = [A, B, C, A];
    for (var e = 0; e < 3; e++) {
      var a = vert[e], b = vert[e + 1], w = distCentrale(a, b), k = unit(croce(a, b));
      for (var i = 0; i < n; i++) { var u = i / n; fr.push({ p: ruota(a, k, u * w), v: ruota(v, k, u * w), lato: e }); }
      v = ruota(v, k, w);
    }
    fr.push({ p: A.slice(), v: v.slice(), lato: 3 });
    return { fotogrammi: fr, finale: v, rotazione: Math.atan2(dot(croce(v0, v), A), dot(v0, v)) };
  }
  /* lo stesso trasporto in modo puramente numerico: piccoli passi sulla sfera e proiezione sul piano tangente (connessione di Levi-Civita indotta) */
  function trasportoProiezione(A, B, C, v0, passi) {
    var v = v0.slice(), vert = [A, B, C, A], L = norma(v0);
    for (var e = 0; e < 3; e++) {
      var pts = arco(vert[e], vert[e + 1], passi);
      for (var i = 1; i < pts.length; i++) { var p = pts[i]; v = comb(v, 1, p, -dot(v, p)); var nv = norma(v); v = [v[0] * L / nv, v[1] * L / nv, v[2] * L / nv]; }
    }
    return Math.atan2(dot(croce(v0, v), A), dot(v0, v));
  }

  F.calcolo.noneuclidea = {
    vett: vett, latlon: latlon, distCentrale: distCentrale, haversine: haversine, angoliVettori: angoliVettori, angoliCoseni: angoliCoseni, triangoloSferico: triangoloSferico, arco: arco, CITTA: CITTA, R_TERRA: R_TERRA,
    geodetica: geodetica, geodeticaDir: geodeticaDir, estremi: estremi, distH: distH, tangente: tangente, angoloH: angoloH, triangoloIperb: triangoloIperb, dentroTriangolo: dentroTriangolo, siTagliano: siTagliano, rifletti: rifletti, mobius: mobius, tassellazione: tassellazione,
    curvaturaGrafico: curvaturaGrafico, curvaturaRotazione: curvaturaRotazione, SUPERFICI: SUPERFICI, circonferenza: circonferenza, circonferenzaSerie: circonferenzaSerie, circonferenzaMisurata: circonferenzaMisurata, ruota: ruota, trasporto: trasporto, trasportoProiezione: trasportoProiezione
  };

  /* ═══ disegno: la sfera in proiezione ortografica ═══════════════════════
     vista: la longitudine λ₀ e la latitudine φ₀ rivolte all'osservatore; x'' > 0 è l'emisfero visibile */
  function vista(lon0, lat0) {
    var cl = Math.cos(lon0 * RAD), sl = Math.sin(lon0 * RAD), cf = Math.cos(lat0 * RAD), sf = Math.sin(lat0 * RAD);
    return {
      su: function (v) { var x1 = v[0] * cl + v[1] * sl, y1 = -v[0] * sl + v[1] * cl, z1 = v[2]; return [x1 * cf + z1 * sf, y1, -x1 * sf + z1 * cf]; },
      giu: function (w) { var x1 = w[0] * cf - w[2] * sf, z1 = w[0] * sf + w[2] * cf; return [x1 * cl - w[1] * sl, x1 * sl + w[1] * cl, z1]; }
    };
  }
  function polilinea(q, pts, Vw, cx, cy, r, colF, colB, larg) {
    q.lineWidth = larg || 1;
    for (var lato = 0; lato < 2; lato++) {
      q.strokeStyle = lato ? colF : colB; q.beginPath(); var su = false;
      for (var i = 0; i < pts.length; i++) {
        var w = Vw.su(pts[i]), vis = w[0] >= 0;
        if (vis !== !!lato) { su = false; continue; }
        var X = cx + r * w[1], Y = cy - r * w[2];
        if (!su) { q.moveTo(X, Y); su = true; } else q.lineTo(X, Y);
      }
      q.stroke();
    }
    q.lineWidth = 1;
  }
  function sferaBase(q, Vw, cx, cy, r) {
    var g = q.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#1a3b5c'); g.addColorStop(1, '#0b1d30');
    q.fillStyle = g; q.beginPath(); q.arc(cx, cy, r, 0, 2 * PI); q.fill(); q.strokeStyle = '#34465f'; q.stroke();
    for (var la = -60; la <= 60; la += 30) { var pts = []; for (var lo = -180; lo <= 180; lo += 5) pts.push(vett(la, lo)); polilinea(q, pts, Vw, cx, cy, r, la === 0 ? 'rgba(107,207,255,.55)' : 'rgba(107,207,255,.22)', 'rgba(107,207,255,.06)'); }
    for (lo = -180; lo < 180; lo += 30) { pts = []; for (la = -90; la <= 90; la += 5) pts.push(vett(la, lo)); polilinea(q, pts, Vw, cx, cy, r, 'rgba(107,207,255,.22)', 'rgba(107,207,255,.06)'); }
  }

  /* ═══ 1. geometria sferica ══════════════════════════════════════════════ */
  var TRIANGOLI = {
    ottante: [['ottante (tre angoli retti)', 'octant (three right angles)'], [[90, 0], [0, 0], [0, 90]]],
    piccolo: [['piccolo (quasi euclideo)', 'small (nearly Euclidean)'], [[10, 0], [0, -6], [2, 8]]],
    grande: [['grande', 'large'], [[70, -30], [-20, -60], [-10, 80]]],
    citta: [['Roma, New York, Tokyo', 'Rome, New York, Tokyo'], [[CITTA.roma[1], CITTA.roma[2]], [CITTA.ny[1], CITTA.ny[2]], [CITTA.tokyo[1], CITTA.tokyo[2]]]]
  };
  function schedaSferica(div) {
    var G = griglia(div), st = { tri: 'ottante', coppia: 'roma-ny', sel: 0, lon0: 35, lat0: 25 }, info = nota(G.pan), V = TRIANGOLI.ottante[1].map(function (p) { return p.slice(); }), cur = [];
    F.scelta(G.pan, ['Triangolo', 'Triangle'], Object.keys(TRIANGOLI).map(function (k) { return [k, TRIANGOLI[k][0]]; }), st.tri, function (v) { st.tri = v; V = TRIANGOLI[v][1].map(function (p) { return p.slice(); }); sincronizza(); disegna(); });
    var selV = F.scelta(G.pan, ['Vertice da muovere', 'Vertex to move'], [['0', 'A'], ['1', 'B'], ['2', 'C']], '0', function (v) { st.sel = +v; sincronizza(); });
    cur.push(F.cursore(G.pan, ['latitudine del vertice', 'vertex latitude'], -89, 89, 0.1, V[0][0], function (v) { V[st.sel][0] = v; disegna(); }, function (v) { return v.toFixed(1) + '°'; }));
    cur.push(F.cursore(G.pan, ['longitudine del vertice', 'vertex longitude'], -180, 180, 0.1, V[0][1], function (v) { V[st.sel][1] = v; disegna(); }, function (v) { return v.toFixed(1) + '°'; }));
    F.scelta(G.pan, ['Distanza fra città', 'Distance between cities'], [['roma-ny', ['Roma – New York', 'Rome – New York']], ['roma-tokyo', ['Roma – Tokyo', 'Rome – Tokyo']], ['ny-tokyo', ['New York – Tokyo', 'New York – Tokyo']], ['roma-sydney', ['Roma – Sydney', 'Rome – Sydney']], ['nessuna', ['nessuna', 'none']]], st.coppia, function (v) { st.coppia = v; disegna(); });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Trascina un vertice per spostarlo, il resto della sfera per ruotarla.', 'Drag a vertex to move it, the rest of the sphere to rotate it.') }));
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.85), geo = null, presa = null;
    cv.style.touchAction = 'none'; cv.style.cursor = 'grab'; cv.style.maxWidth = '560px'; cv.style.margin = '0 auto';
    /* i cursori seguono il vertice scelto; si aggiorna solo l'etichetta, senza l'evento input (che arrotonderebbe il vertice al passo) */
    function sincronizza() { [0, 1].forEach(function (i) { cur[i].value = V[st.sel][i]; try { var b = cur[i].parentNode.querySelector('b'); if (b) b.textContent = (+V[st.sel][i]).toFixed(1) + '°'; } catch (e) { } }); }
    function pos(ev) { var r = cv.getBoundingClientRect(), k = geo && r.width ? geo.W / r.width : 1; return [(ev.clientX - r.left) * k, (ev.clientY - r.top) * k]; }
    cv.addEventListener('pointerdown', function (ev) {
      if (!geo) return; var p = pos(ev), Vw = vista(st.lon0, st.lat0), mi = -1, md = 18;
      V.forEach(function (ll, i) { var w = Vw.su(vett(ll[0], ll[1])); if (w[0] < 0) return; var dd = Math.hypot(geo.cx + geo.r * w[1] - p[0], geo.cy - geo.r * w[2] - p[1]); if (dd < md) { md = dd; mi = i; } });
      presa = mi >= 0 ? { vert: mi } : { ruota: p }; if (mi >= 0 && mi !== st.sel) { st.sel = mi; selV.value = String(mi); sincronizza(); }
      try { cv.setPointerCapture(ev.pointerId); } catch (er) { }
    });
    cv.addEventListener('pointermove', function (ev) {
      if (!presa || !geo) return; var p = pos(ev);
      if (presa.ruota) { st.lon0 -= (p[0] - presa.ruota[0]) * 0.4; st.lat0 = Math.max(-89, Math.min(89, st.lat0 + (p[1] - presa.ruota[1]) * 0.4)); presa.ruota = p; disegna(); return; }
      var y = (p[0] - geo.cx) / geo.r, z = -(p[1] - geo.cy) / geo.r, m = y * y + z * z;
      if (m > 0.995) { var s = Math.sqrt(0.995 / m); y *= s; z *= s; m = 0.995; }
      var ll = latlon(vista(st.lon0, st.lat0).giu([Math.sqrt(1 - m), y, z]));
      V[presa.vert] = [Math.max(-89, Math.min(89, ll[0])), ll[1]]; sincronizza(); disegna();
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { cv.addEventListener(n, function () { presa = null; }); });
    function disegna() {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, r = Math.min(W, H) / 2 - 14, cx = W / 2, cy = H / 2, Vw = vista(st.lon0, st.lat0);
      geo = { W: W, cx: cx, cy: cy, r: r };
      sferaBase(q, Vw, cx, cy, r);
      var A = V.map(function (ll) { return vett(ll[0], ll[1]); }), T = triangoloSferico(A[0], A[1], A[2], R_TERRA), Tc = angoliCoseni(A[0], A[1], A[2]);
      /* riempimento: il triangolo diviso in fette dal vertice A, disegnato solo dove è visibile */
      q.fillStyle = 'rgba(94,234,212,.16)';
      var lato = arco(A[1], A[2], 40);
      for (var i = 0; i < lato.length - 1; i++) {
        var a1 = arco(A[0], lato[i], 12), a2 = arco(A[0], lato[i + 1], 12);
        for (var j = 0; j < 12; j++) {
          var quad = [a1[j], a1[j + 1], a2[j + 1], a2[j]].map(Vw.su); if (quad.some(function (w) { return w[0] < 0; })) continue;
          q.beginPath(); quad.forEach(function (w, k) { var X = cx + r * w[1], Y = cy - r * w[2]; if (k) q.lineTo(X, Y); else q.moveTo(X, Y); }); q.closePath(); q.fill();
        }
      }
      for (i = 0; i < 3; i++) polilinea(q, arco(A[i], A[(i + 1) % 3], 80), Vw, cx, cy, r, '#5eead4', 'rgba(94,234,212,.25)', 2.5);
      var colV = ['#ffd24a', '#ff8a80', '#c9b9ff'];
      A.forEach(function (v, k) { var w = Vw.su(v); q.globalAlpha = w[0] >= 0 ? 1 : 0.3; q.fillStyle = colV[k]; q.beginPath(); q.arc(cx + r * w[1], cy - r * w[2], k === st.sel ? 7 : 5.5, 0, 2 * PI); q.fill(); q.font = 'bold 12px system-ui'; q.fillText('ABC'[k], cx + r * w[1] + 8, cy - r * w[2] - 6); q.globalAlpha = 1; });
      /* la rotta fra due città */
      var dc = '';
      if (st.coppia !== 'nessuna') {
        var cc = st.coppia.split('-'), c1 = CITTA[cc[0]], c2 = CITTA[cc[1]], v1 = vett(c1[1], c1[2]), v2 = vett(c2[1], c2[2]), dh = haversine(c1[1], c1[2], c2[1], c2[2], R_TERRA);
        polilinea(q, arco(v1, v2, 120), Vw, cx, cy, r, '#ffc45a', 'rgba(255,196,90,.25)', 2);
        [[v1, c1], [v2, c2]].forEach(function (x) { var w = Vw.su(x[0]); if (w[0] < 0) return; q.fillStyle = '#ffc45a'; q.beginPath(); q.arc(cx + r * w[1], cy - r * w[2], 4, 0, 2 * PI); q.fill(); q.font = '11px system-ui'; q.fillText(F.tt(x[1][0]), cx + r * w[1] + 6, cy - r * w[2] + 12); });
        dc = '<br>' + F.tt(c1[0]) + ' – ' + F.tt(c2[0]) + t(' (rotta ortodromica, in giallo): ', ' (great-circle route, in yellow): ') + '<b class="bsiFX-num">' + dh.toFixed(0) + ' km</b> (' + t('emisenoverso', 'haversine') + '; ' + t('con i vettori ', 'with vectors ') + (distCentrale(v1, v2) * R_TERRA).toFixed(0) + ' km)';
      }
      cv.setAttribute('aria-label', t('sfera con un triangolo sferico, somma degli angoli ', 'sphere with a spherical triangle, angle sum ') + gradi(T.somma));
      info.innerHTML = '<table class="bsiFX-tab"><tr><th></th><th>' + t('vettori', 'vectors') + '</th><th>' + t('coseni', 'cosines') + '</th></tr>' + ['A', 'B', 'C'].map(function (n, k) { return '<tr><td>' + n + '</td><td class="bsiFX-num">' + gradi(T.angoli[k]) + '</td><td class="bsiFX-num">' + gradi(Tc[k]) + '</td></tr>'; }).join('') + '</table>' +
        t('Somma degli angoli: ', 'Angle sum: ') + '<b class="bsiFX-num">' + gradi(T.somma) + '</b> · ' + t('eccesso E = ', 'excess E = ') + '<b class="bsiFX-num">' + (T.eccesso).toFixed(5) + ' rad</b><br>' +
        t('Area (Girard, E·R²): ', 'Area (Girard, E·R²): ') + '<b class="bsiFX-num">' + fmt(T.areaGirard) + ' km²</b> · Van Oosterom-Strackee: ' + fmt(T.areaVOS) + ' km² · ' + t('frazione della sfera ', 'fraction of the sphere ') + (T.eccesso / (4 * PI)).toFixed(4) + '<br>' +
        t('Lati: ', 'Sides: ') + T.lati.map(function (l) { return l.toFixed(0); }).join(', ') + ' km' + dc + '<br>' +
        t('Sulla sfera le «rette» sono i cerchi massimi: due di esse si incontrano sempre (niente parallele). Teorema di Girard: α + β + γ − π = Area/R², quindi l’eccesso misura la curvatura racchiusa. Un triangolo piccolo è quasi euclideo (eccesso ≈ 0); l’ottante ha tre angoli retti e area 4πR²/8. Gli angoli si ottengono con la legge sferica dei coseni cos α = (cos a − cos b cos c)/(sin b sin c) o con i vettori tangenti t = B − (A·B)A: i due metodi coincidono. Distanze: d = 2R asin √(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2)), con R = 6371 km (la Terra vera è un ellissoide: errori fino a ~0,5 %).', 'On the sphere the «lines» are great circles: any two of them always meet (no parallels). Girard’s theorem: α + β + γ − π = Area/R², so the excess measures the enclosed curvature. A small triangle is nearly Euclidean (excess ≈ 0); the octant has three right angles and area 4πR²/8. The angles come from the spherical law of cosines cos α = (cos a − cos b cos c)/(sin b sin c) or from the tangent vectors t = B − (A·B)A: the two methods agree. Distances: d = 2R asin √(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2)), with R = 6371 km (the real Earth is an ellipsoid: errors up to ~0.5 %).');
    }
    sincronizza(); disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. disco di Poincaré ══════════════════════════════════════════════ */
  /* disegna l'arco di geodetica fra p e q (in coordinate del disco) con la trasformazione S → schermo */
  function tracciaArco(q, p1, p2, S, inizia) {
    var g = geodetica(p1, p2), a = S(p1), b = S(p2);
    if (inizia) q.moveTo(a[0], a[1]);
    if (g.retta || g.r > 1e3) { q.lineTo(b[0], b[1]); return; }
    var c = S(g.c), R = g.r * S.k, a1 = Math.atan2(a[1] - c[1], a[0] - c[0]), a2 = Math.atan2(b[1] - c[1], b[0] - c[0]), d = a2 - a1;
    while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI;
    q.arc(c[0], c[1], R, a1, a1 + d, d < 0);
  }
  function tracciaGeod(q, g, S) { var e = estremi(g); q.beginPath(); tracciaArco(q, e[0], e[1], S, true); q.stroke(); }
  function schedaIperbolica(div) {
    var G = griglia(div), st = { modo: 'triangolo', prof: 4, sel: -1 }, info = nota(G.pan), cache = {};
    var punti = { triangolo: [[-0.55, -0.35], [0.6, -0.3], [0.05, 0.62]], parallele: [[-0.6, -0.45], [0.65, -0.35], [0.05, 0.35]] };
    F.scelta(G.pan, ['Che cosa disegnare', 'What to draw'], [['triangolo', ['triangolo iperbolico', 'hyperbolic triangle']], ['parallele', ['parallele per un punto', 'parallels through a point']], ['t73', ['tassellazione {7,3}', 'tiling {7,3}']], ['t54', ['tassellazione {5,4}', 'tiling {5,4}']]], st.modo, function (v) { st.modo = v; disegna(); });
    F.cursore(G.pan, ['profondità delle riflessioni', 'reflection depth'], 1, 6, 1, st.prof, function (v) { st.prof = v; disegna(); }, function (v) { return String(v); });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Trascina i punti nel disco; tocca un punto vuoto per spostarvi il punto più vicino.', 'Drag the points in the disk; tap an empty spot to move the nearest point there.') }));
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 1), S = null; cv.style.maxWidth = '540px'; cv.style.margin = '0 auto'; cv.style.touchAction = 'none';
    function disco(ev) { var r = cv.getBoundingClientRect(), k = S && r.width ? S.W / r.width : 1, x = ((ev.clientX - r.left) * k - S.cx) / S.k, y = -((ev.clientY - r.top) * k - S.cy) / S.k, m = Math.hypot(x, y); if (m > 0.97) { x *= 0.97 / m; y *= 0.97 / m; } return [x, y]; }
    cv.addEventListener('pointerdown', function (ev) {
      if (!S || !punti[st.modo]) return; var z = disco(ev), P = punti[st.modo], mi = 0, md = Infinity;
      P.forEach(function (p, i) { var dd = d2(p, z); if (dd < md) { md = dd; mi = i; } });
      st.sel = mi; P[mi] = z; disegna(); try { cv.setPointerCapture(ev.pointerId); } catch (er) { }
    });
    cv.addEventListener('pointermove', function (ev) { if (st.sel < 0 || !S || !punti[st.modo]) return; punti[st.modo][st.sel] = disco(ev); disegna(); });
    ['pointerup', 'pointercancel'].forEach(function (n) { cv.addEventListener(n, function () { st.sel = -1; }); });
    function disegna() {
      var Pn = F.pennello(cv), q = Pn.q, W = Pn.W, H = Pn.H, R = Math.min(W, H) / 2 - 10, cx = W / 2, cy = H / 2;
      S = function (z) { return [cx + R * z[0], cy - R * z[1]]; }; S.k = R; S.cx = cx; S.cy = cy; S.W = W;
      q.fillStyle = '#0b1d30'; q.beginPath(); q.arc(cx, cy, R, 0, 2 * PI); q.fill(); q.strokeStyle = '#6bcfff'; q.lineWidth = 1.5; q.stroke(); q.lineWidth = 1;
      var testo = '';
      if (st.modo === 'triangolo') {
        var V = punti.triangolo, T = triangoloIperb(V[0], V[1], V[2]);
        /* le tre geodetiche intere, poi il triangolo */
        q.strokeStyle = 'rgba(107,207,255,.35)'; for (var i = 0; i < 3; i++) tracciaGeod(q, geodetica(V[i], V[(i + 1) % 3]), S);
        q.fillStyle = 'rgba(94,234,212,.18)'; q.strokeStyle = '#5eead4'; q.lineWidth = 2.5; q.beginPath(); tracciaArco(q, V[0], V[1], S, true); tracciaArco(q, V[1], V[2], S); tracciaArco(q, V[2], V[0], S); q.closePath(); q.fill(); q.stroke(); q.lineWidth = 1;
        V.forEach(function (p, k) { var s = S(p); q.fillStyle = ['#ffd24a', '#ff8a80', '#c9b9ff'][k]; q.beginPath(); q.arc(s[0], s[1], 6, 0, 2 * PI); q.fill(); q.font = 'bold 12px system-ui'; q.fillText('ABC'[k] + ' ' + gradi(T.angoli[k]), s[0] + 8, s[1] - 8); });
        testo = t('Angoli: ', 'Angles: ') + T.angoli.map(gradi).join(', ') + '<br>' + t('Somma ', 'Sum ') + '<b class="bsiFX-num">' + gradi(T.somma) + '</b> < 180° · ' + t('difetto = area = π − Σ = ', 'defect = area = π − Σ = ') + '<b class="bsiFX-num">' + T.difetto.toFixed(4) + '</b><br>' + t('Lati iperbolici: ', 'Hyperbolic sides: ') + T.lati.map(function (l) { return l.toFixed(3); }).join(', ') + '<br>' +
          t('Le geodetiche sono archi di cerchi ortogonali al bordo (il centro c soddisfa |c|² = r² + 1) o diametri. Il modello è conforme: gli angoli si leggono come in Euclide, le lunghezze no: d = arccosh(1 + 2|p − q|²/((1 − |p|²)(1 − |q|²))), e il bordo è all’infinito. Con K = −1 l’area del triangolo è π − (α + β + γ) (Gauss-Bonnet): non supera mai π, anche per triangoli coi vertici sul bordo (ideali, angoli nulli).', 'Geodesics are arcs of circles orthogonal to the boundary (the centre c satisfies |c|² = r² + 1) or diameters. The model is conformal: angles are read as in Euclid, lengths are not: d = arccosh(1 + 2|p − q|²/((1 − |p|²)(1 − |q|²))), and the boundary is at infinity. With K = −1 the triangle area is π − (α + β + γ) (Gauss-Bonnet): it never exceeds π, even for triangles with vertices on the boundary (ideal, zero angles).');
      } else if (st.modo === 'parallele') {
        var Pp = punti.parallele, L = geodetica(Pp[0], Pp[1]), E = estremi(L), X = Pp[2], nP = 0, nN = 0;
        /* un ventaglio di geodetiche per X: quelle che non tagliano L sono parallele (ultraparallele) */
        for (var k = 0; k < 90; k++) { var g = geodeticaDir(X, PI * k / 90), tg = siTagliano(g, L); if (tg) nN++; else nP++; q.strokeStyle = tg ? 'rgba(132,148,168,.18)' : 'rgba(94,234,212,.45)'; tracciaGeod(q, g, S); }
        q.lineWidth = 2.2; q.strokeStyle = '#ffd24a'; tracciaGeod(q, geodetica(X, E[0]), S); tracciaGeod(q, geodetica(X, E[1]), S);
        q.strokeStyle = '#ff8a80'; q.lineWidth = 3; tracciaGeod(q, L, S); q.lineWidth = 1;
        [Pp[0], Pp[1]].forEach(function (p) { var s = S(p); q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(s[0], s[1], 6, 0, 2 * PI); q.fill(); });
        var s = S(X); q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(s[0], s[1], 7, 0, 2 * PI); q.fill(); q.font = 'bold 12px system-ui'; q.fillText('P', s[0] + 9, s[1] - 8);
        testo = t('Retta L (rossa) per due punti; per P passano ', 'Line L (red) through two points; through P pass ') + '<b>' + t('infinite', 'infinitely many') + '</b>' + t(' rette che non la incontrano: delle 90 direzioni disegnate, ', ' lines that never meet it: of the 90 directions drawn, ') + '<b class="bsiFX-num">' + nP + '</b>' + t(' sono parallele (verdi) e ', ' are parallel (green) and ') + nN + t(' secanti (grigie).', ' secant (grey).') + '<br>' +
          t('Le due gialle sono le parallele limite, asintotiche a L nei suoi punti ideali; quelle in mezzo sono ultraparallele. È la negazione del quinto postulato di Euclide (Playfair: una sola parallela): Bolyai e Lobačevskij (1830 circa) mostrarono che il sistema resta coerente, e Beltrami e Poincaré ne costruirono i modelli dentro la geometria euclidea.', 'The two yellow ones are the limiting parallels, asymptotic to L at its ideal points; those in between are ultraparallel. This negates Euclid’s fifth postulate (Playfair: exactly one parallel): Bolyai and Lobachevsky (c. 1830) showed that the system stays consistent, and Beltrami and Poincaré built models of it inside Euclidean geometry.');
      } else {
        var pq = st.modo === 't73' ? [7, 3] : [5, 4], ch = st.modo + st.prof;
        if (!cache[ch]) cache[ch] = tassellazione(pq[0], pq[1], st.prof, 2500);
        var Tz = cache[ch], colori = ['#5eead4', '#6bcfff', '#c9b9ff', '#ffc45a', '#ff8a80', '#ffd24a', '#8494a8'];
        Tz.tessere.forEach(function (T2) {
          q.beginPath(); for (var i2 = 0; i2 < T2.v.length; i2++) tracciaArco(q, T2.v[i2], T2.v[(i2 + 1) % T2.v.length], S, i2 === 0); q.closePath();
          q.globalAlpha = 0.28; q.fillStyle = colori[T2.prof % colori.length]; q.fill(); q.globalAlpha = 1; q.strokeStyle = 'rgba(230,255,251,.55)'; q.stroke();
        });
        testo = t('Tassellazione {', 'Tiling {') + pq[0] + ',' + pq[1] + '}: ' + pq[1] + t(' poligoni regolari di ', ' regular polygons with ') + pq[0] + t(' lati attorno a ogni vertice; tessere disegnate: ', ' sides around each vertex; tiles drawn: ') + '<b class="bsiFX-num">' + Tz.tessere.length + '</b><br>' +
          t('Angolo interno 2π/', 'Interior angle 2π/') + pq[1] + ' = ' + gradi(2 * PI / pq[1]) + ' · ' + t('lato iperbolico ', 'hyperbolic side ') + Tz.lato.toFixed(4) + ' · ' + t('area di ogni tessera ', 'area of each tile ') + '(p − 2)π − 2πp/q = ' + Tz.areaTessera.toFixed(4) + '<br>' +
          t('Nel piano euclideo esistono solo {3,6}, {4,4}, {6,3}; se (p − 2)(q − 2) > 4 la somma degli angoli è troppo piccola e la tassellazione esiste solo nel piano iperbolico. Si costruisce riflettendo il poligono centrale nei suoi lati (inversioni nei cerchi delle geodetiche) e poi le immagini nei loro lati: tutte le tessere sono congruenti, anche se verso il bordo sembrano rimpicciolire (è il disegno di Escher «Limite del cerchio»). Il numero di tessere cresce esponenzialmente con la profondità, come l’area di un cerchio iperbolico (∝ e^r).', 'In the Euclidean plane only {3,6}, {4,4}, {6,3} exist; if (p − 2)(q − 2) > 4 the angle sum is too small and the tiling exists only in the hyperbolic plane. It is built by reflecting the central polygon in its sides (inversions in the geodesic circles) and then the images in theirs: all tiles are congruent, even if they seem to shrink towards the boundary (Escher’s «Circle Limit»). The number of tiles grows exponentially with depth, like the area of a hyperbolic circle (∝ e^r).');
      }
      cv.setAttribute('aria-label', t('disco di Poincaré: ', 'Poincaré disk: ') + (st.modo === 'triangolo' ? t('triangolo iperbolico', 'hyperbolic triangle') : st.modo === 'parallele' ? t('parallele per un punto', 'parallels through a point') : t('tassellazione regolare', 'regular tiling')));
      info.innerHTML = testo;
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. curvatura e olonomia ═══════════════════════════════════════════ */
  function schedaCurvatura(div) {
    var G = griglia(div), st = { sup: 'sfera', R: 1, dl: 90, rot: 30 }, info = nota(G.pan), info2 = F.el('div', { 'class': 'bsiFX-nota' }), Tr = null, s = 0;
    F.scelta(G.pan, ['Superficie', 'Surface'], Object.keys(SUPERFICI).map(function (k) { return [k, SUPERFICI[k][0]]; }), st.sup, function (v) { st.sup = v; disegnaSup(); testo(); });
    F.cursore(G.pan, ['raggio di curvatura R', 'radius of curvature R'], 0.5, 3, 0.05, st.R, function (v) { st.R = v; disegnaSup(); disegnaC(); testo(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['rotazione della vista', 'view rotation'], 0, 360, 1, st.rot, function (v) { st.rot = v; disegnaSup(); }, function (v) { return v + '°'; });
    F.cursore(G.pan, ['triangolo dell’olonomia: Δλ', 'holonomy triangle: Δλ'], 10, 180, 1, st.dl, function (v) { st.dl = v; nuovoTr(); }, function (v) { return v + '°'; });
    G.pan.appendChild(info); G.pan.appendChild(info2);
    var cs = F.tela(G.dx, 0.6), cc = F.tela(G.dx, 0.45), ch = F.tela(G.dx, 0.75);
    /* la superficie in fil di ferro, vista obliqua; colore: verde K > 0, azzurro K = 0, arancio K < 0 */
    function disegnaSup() {
      var P = F.pennello(cs), q = P.q, W = P.W, H = P.H, R = st.R, a = st.rot * RAD, el = 0.45, sc = Math.min(W, H) * 0.26 / Math.max(1, R * 0.9), K = SUPERFICI[st.sup][1](R);
      function pr(x, y, z) { var x1 = x * Math.cos(a) - y * Math.sin(a), y1 = x * Math.sin(a) + y * Math.cos(a); return [W / 2 + sc * x1, H / 2 - sc * (z * Math.cos(el) - y1 * Math.sin(el))]; }
      var punto, N = 24, M = 24, i, j, col = K > 0 ? 'rgba(94,234,212,.7)' : K < 0 ? 'rgba(255,196,90,.7)' : 'rgba(107,207,255,.7)';
      if (st.sup === 'sfera') punto = function (u, v) { var th = PI * u, ph = 2 * PI * v; return [R * Math.sin(th) * Math.cos(ph), R * Math.sin(th) * Math.sin(ph), R * Math.cos(th)]; };
      else if (st.sup === 'piano') punto = function (u, v) { return [2.4 * (u - 0.5) * R, 2.4 * (v - 0.5) * R, 0]; };
      else if (st.sup === 'sella') punto = function (u, v) { var x = 2 * (u - 0.5) * R * 1.2, y = 2 * (v - 0.5) * R * 1.2; return [x, y, (x * x - y * y) / (2 * R)]; };
      else punto = function (u, v) { var tt = 0.05 + 3.2 * u, ph = 2 * PI * v, rr = R / Math.cosh(tt), z = R * (tt - Math.tanh(tt)); return [rr * Math.cos(ph), rr * Math.sin(ph), z - R * 0.9]; };
      q.strokeStyle = col; q.lineWidth = 1;
      for (i = 0; i <= N; i++) { q.beginPath(); for (j = 0; j <= M; j++) { var p = pr.apply(null, punto(i / N, j / M)); if (j) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); } q.stroke(); }
      for (j = 0; j <= M; j++) { q.beginPath(); for (i = 0; i <= N; i++) { p = pr.apply(null, punto(i / N, j / M)); if (i) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); } q.stroke(); }
      q.fillStyle = '#e6fffb'; q.font = '12px system-ui'; q.textAlign = 'left'; q.fillText('K = ' + (K === 0 ? '0' : fmt(K)), 10, 18);
      cs.setAttribute('aria-label', t('superficie: ', 'surface: ') + F.tt(SUPERFICI[st.sup][0]));
    }
    /* C(r)/(2πr) per K = +1/R², 0, −1/R², con la serie troncata e le misure sulla sfera */
    function disegnaC() {
      var R = st.R, K = 1 / (R * R), xs = [], yp = [], y0 = [], ym = [], sp = [], sm = [], rmax = PI * R;
      for (var i = 1; i <= 200; i++) { var r = rmax * i / 200; xs.push(r / R); yp.push(circonferenza(K, r) / (2 * PI * r)); y0.push(1); ym.push(Math.min(3, circonferenza(-K, r) / (2 * PI * r))); sp.push(circonferenzaSerie(K, r) / (2 * PI * r)); sm.push(Math.min(3, circonferenzaSerie(-K, r) / (2 * PI * r))); }
      var misure = [0.5, 1, 1.5, 2, 2.5, 3].map(function (u) { return { x: u, y: circonferenzaMisurata(R, u * R, 720) / (2 * PI * u * R), col: '#ffd24a', r: 4 }; });
      F.grafico(cc, { serie: [{ x: xs, y: yp, col: '#5eead4', larg: 2, etich: 'K > 0' }, { x: xs, y: y0, col: '#6bcfff', larg: 1.5, etich: 'K = 0' }, { x: xs, y: ym, col: '#ffc45a', larg: 2, etich: 'K < 0' }, { x: xs, y: sp, col: '#5eead4', larg: 1, tratt: true, etich: [t('serie K>0', 'series K>0'), 'series K>0'] }, { x: xs, y: sm, col: '#ffc45a', larg: 1, tratt: true, etich: [t('serie K<0', 'series K<0'), 'series K<0'] }], punti: misure, xmin: 0, xmax: PI, ymin: 0, ymax: 2.5, xl: ['r/R', 'r/R'], yl: ['C(r) / 2πr', 'C(r) / 2πr'], descr: ['circonferenza dei cerchi geodetici divisa per 2πr', 'circumference of geodesic circles divided by 2πr'], legenda: [{ col: '#5eead4', etich: ['sfera', 'sphere'] }, { col: '#6bcfff', etich: ['piano', 'plane'] }, { col: '#ffc45a', etich: ['iperbolico', 'hyperbolic'] }, { col: '#ffd24a', etich: ['misura (corde)', 'measured (chords)'] }] });
    }
    /* olonomia: triangolo polo nord, (0°, 0°), (0°, Δλ): angoli 90°, 90°, Δλ, area Δλ R² */
    function nuovoTr() { var A = [0, 0, 1], B = vett(0, 0), C = vett(0, st.dl); Tr = { A: A, B: B, C: C, T: trasporto(A, B, C, [1, 0, 0], 90), area: triangoloSferico(A, B, C).eccesso }; s = 0; testo(); }
    function testo() {
      var R = st.R, K = SUPERFICI[st.sup][1](R), r = 0.2 * R, Ces = circonferenza(K, r), Cse = circonferenzaSerie(K, r);
      info.innerHTML = t('Curvatura gaussiana K = k₁ k₂ (prodotto delle curvature principali): ', 'Gaussian curvature K = k₁ k₂ (product of the principal curvatures): ') + '<b class="bsiFX-num">K = ' + (K === 0 ? '0' : fmt(K)) + '</b><br>' + t('Cerchio geodetico di raggio r = 0,2 R: C = ', 'Geodesic circle of radius r = 0.2 R: C = ') + Ces.toFixed(6) + ' · 2πr − (π/3)K r³ = ' + Cse.toFixed(6) + ' · 2πr = ' + (2 * PI * r).toFixed(6) + '<br>' +
        t('Il «Theorema egregium» di Gauss: K si misura stando DENTRO la superficie, per esempio dalla circonferenza dei cerchi: K = (3/π) lim (2πr − C)/r³. Sulla sfera C = 2πR sin(r/R) < 2πr, nel piano iperbolico C = 2πR sinh(r/R) > 2πr cresce esponenzialmente. Un cilindro ha K = 0 come il piano: si srotola senza deformarsi; una sfera no (per questo ogni carta geografica deforma). I punti gialli sono circonferenze misurate sommando 720 corde sulla sfera.', 'Gauss’s «Theorema egregium»: K can be measured from INSIDE the surface, for instance from the circumference of circles: K = (3/π) lim (2πr − C)/r³. On the sphere C = 2πR sin(r/R) < 2πr, in the hyperbolic plane C = 2πR sinh(r/R) > 2πr grows exponentially. A cylinder has K = 0 like the plane: it unrolls without stretching; a sphere does not (which is why every map distorts). The yellow dots are circumferences measured by summing 720 chords on the sphere.');
      if (Tr) info2.innerHTML = t('Trasporto parallelo lungo il triangolo N → (0°, 0°) → (0°, ', 'Parallel transport around the triangle N → (0°, 0°) → (0°, ') + st.dl + '°) → N: ' + t('il vettore torna ruotato di ', 'the vector comes back rotated by ') + '<b class="bsiFX-num">' + gradi(Math.abs(Tr.T.rotazione)) + '</b>; ' + t('area racchiusa / R² = eccesso = ', 'enclosed area / R² = excess = ') + '<b class="bsiFX-num">' + gradi(Tr.area) + '</b>.<br>' + t('Lungo ogni geodetica il vettore conserva l’angolo con la direzione di marcia, eppure al ritorno è ruotato: l’angolo di olonomia è ∬K dA (Gauss-Bonnet). È lo stesso fenomeno del pendolo di Foucault, il cui piano di oscillazione ruota di 2π sin φ al giorno.', 'Along each geodesic the vector keeps its angle with the direction of travel, yet on return it is rotated: the holonomy angle is ∬K dA (Gauss-Bonnet). It is the same phenomenon as Foucault’s pendulum, whose swing plane turns by 2π sin φ per day.');
    }
    nuovoTr();
    F.anima(ch, function (dt) {
      s += dt * 60; var fr = Tr.T.fotogrammi, n = fr.length, k = Math.min(n - 1, Math.floor(s));
      if (s > n + 90) s = 0;
      var P = F.pennello(ch), q = P.q, W = P.W, H = P.H, r = Math.min(W, H) / 2 - 16, cx = W / 2, cy = H / 2 + 4, Vw = vista(st.dl / 2, 35);
      sferaBase(q, Vw, cx, cy, r);
      [[Tr.A, Tr.B], [Tr.B, Tr.C], [Tr.C, Tr.A]].forEach(function (e) { polilinea(q, arco(e[0], e[1], 60), Vw, cx, cy, r, '#5eead4', 'rgba(94,234,212,.2)', 2); });
      /* frecce: ogni 15 fotogrammi una traccia sbiadita, e la freccia corrente */
      function freccia(p, v, col, larg) {
        var a = Vw.su(p), b = Vw.su(unit(comb(p, 1, v, 0.32))); if (a[0] < 0) return;
        var x0 = cx + r * a[1], y0 = cy - r * a[2], x1 = cx + r * b[1], y1 = cy - r * b[2], an = Math.atan2(y1 - y0, x1 - x0);
        q.strokeStyle = col; q.fillStyle = col; q.lineWidth = larg; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x1, y1); q.stroke();
        q.beginPath(); q.moveTo(x1, y1); q.lineTo(x1 - 8 * Math.cos(an - 0.4), y1 - 8 * Math.sin(an - 0.4)); q.lineTo(x1 - 8 * Math.cos(an + 0.4), y1 - 8 * Math.sin(an + 0.4)); q.closePath(); q.fill(); q.lineWidth = 1;
      }
      for (var i = 0; i < k; i += 15) freccia(fr[i].p, fr[i].v, 'rgba(255,196,90,.4)', 1.2);
      freccia(Tr.A, fr[0].v, '#6bcfff', 2);
      freccia(fr[k].p, fr[k].v, k >= n - 1 ? '#ff8a80' : '#ffd24a', 2.4);
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.textAlign = 'left';
      q.fillText(k >= n - 1 ? t('rotazione = ', 'rotation = ') + gradi(Math.abs(Tr.T.rotazione)) + ' = ' + t('area/R²', 'area/R²') : t('trasporto parallelo…', 'parallel transport…'), 10, 18);
      ch.setAttribute('aria-label', t('trasporto parallelo di un vettore lungo un triangolo sferico', 'parallel transport of a vector around a spherical triangle'));
    }, { ricomincia: function () { s = 0; } });
    disegnaSup(); disegnaC(); F.alRidimensiona(function () { disegnaSup(); disegnaC(); });
  }

  F.sezione('smatnoneucl', {
    titolo: ['🌐 Geometrie non euclidee', '🌐 Non-Euclidean geometries'],
    sotto: ['Che cosa diventa la geometria senza il quinto postulato: triangoli sferici con eccesso angolare e rotte ortodromiche, il disco di Poincaré con le sue infinite parallele e le tassellazioni, la curvatura gaussiana e il trasporto parallelo.', 'What geometry becomes without the fifth postulate: spherical triangles with angular excess and great-circle routes, the Poincaré disk with its infinitely many parallels and tilings, Gaussian curvature and parallel transport.'],
    schede: [
      { nome: ['🌍 Sfera', '🌍 Sphere'], costruisci: schedaSferica },
      { nome: ['🌀 Disco di Poincaré', '🌀 Poincaré disk'], costruisci: schedaIperbolica },
      { nome: ['〰️ Curvatura', '〰️ Curvature'], costruisci: schedaCurvatura }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
