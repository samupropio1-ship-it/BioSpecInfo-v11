/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-svd.js — 🧩 SVD e algebra lineare applicata
   BioSpecInfo · © Samuele Pio Provenzano

   La decomposizione ai valori singolari A = UΣVᵀ dice che ogni matrice e'
   una rotazione, uno stiramento lungo assi perpendicolari e un'altra
   rotazione. Qui e' calcolata da zero con il metodo di Jacobi «a un lato»
   (Hestenes: si ruotano le colonne a coppie finche' sono tutte ortogonali)
   e controllata con un secondo algoritmo indipendente (Jacobi simmetrico
   sugli autovalori di AᵀA). Poi le applicazioni:

   · 2×2 E 3×3 COME ROTAZIONE–SCALA–ROTAZIONE: il cerchio unitario che
     diventa un'ellisse, la sfera che diventa un ellissoide in 3D, animati
     un fattore alla volta (Vᵀ, Σ, U), con la riflessione quando det A < 0;
   · COMPRESSIONE DI UN'IMMAGINE: un'immagine in scala di grigi sintetica
     (deterministica) approssimata con k valori singolari; l'errore e'
     esattamente √(Σ_{i>k} σ_i²) (Eckart–Young), e nessun'altra matrice di
     rango k fa meglio;
   · PCA DI UNA NUVOLA 3D: gli assi principali e la varianza spiegata dalla
     SVD dei dati centrati, confrontati con gli autovettori della
     covarianza, e la proiezione sul piano principale;
   · MINIMI QUADRATI: QR di Householder contro equazioni normali
     (Cholesky), che elevano al quadrato il numero di condizionamento, e la
     matrice di Hilbert, il caso di scuola: κ₂(H₅) ≈ 4,77·10⁵, controllato
     anche con l'inversa esatta a interi.

   I calcoli stanno in F.calcolo.svd (provati in
   tools/banchi/verifiche/verifica-smatsvd.js).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI, D = globale.document;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }
  function zeri(m, n) { var A = []; for (var i = 0; i < m; i++) { A.push([]); for (var j = 0; j < n; j++) A[i].push(0); } return A; }
  function identita(n) { var A = zeri(n, n); for (var i = 0; i < n; i++) A[i][i] = 1; return A; }
  function trasposta(A) { return A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); }); }
  function prodotto(A, B) { var m = A.length, n = B[0].length, p = B.length, C = zeri(m, n); for (var i = 0; i < m; i++) for (var k = 0; k < p; k++) { var a = A[i][k]; if (a) for (var j = 0; j < n; j++) C[i][j] += a * B[k][j]; } return C; }
  function frobenius(A) { var s = 0; A.forEach(function (r) { r.forEach(function (v) { s += v * v; }); }); return Math.sqrt(s); }
  function differenza(A, B) { return A.map(function (r, i) { return r.map(function (v, j) { return v - B[i][j]; }); }); }
  function det3(A) { return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]); }

  /* ── SVD con Jacobi a un lato (Hestenes) ──
     Le colonne di W = A (m × n, m ≥ n) si ruotano a coppie (i, j) con la rotazione di Givens che le
     rende ortogonali; la stessa rotazione si accumula in V. Quando tutte le coppie sono ortogonali
     W = UΣ: le norme delle colonne sono i valori singolari. Lo stato permette di fare una passata
     alla volta (le immagini si decompongono a lotti senza bloccare la pagina). */
  function jacobiInizia(A) {
    var m = A.length, n = A[0].length, W = [], V = [], i, j;
    for (j = 0; j < n; j++) { var c = new Float64Array(m); for (i = 0; i < m; i++) c[i] = A[i][j]; W.push(c); var v = new Float64Array(n); v[j] = 1; V.push(v); }
    return { m: m, n: n, W: W, V: V, passate: 0, finito: false, off: Infinity };
  }
  function jacobiPassata(S, tol) {
    var W = S.W, V = S.V, n = S.n, m = S.m, rot = 0, offMax = 0, i, j, k;
    tol = tol || 1e-15;
    for (i = 0; i < n - 1; i++) for (j = i + 1; j < n; j++) {
      var a = 0, b = 0, g = 0, wi = W[i], wj = W[j];
      for (k = 0; k < m; k++) { a += wi[k] * wi[k]; b += wj[k] * wj[k]; g += wi[k] * wj[k]; }
      if (a === 0 || b === 0) continue;
      var rel = Math.abs(g) / Math.sqrt(a * b); if (rel > offMax) offMax = rel;
      if (rel <= tol) continue;
      var z = (b - a) / (2 * g), tt = (z >= 0 ? 1 : -1) / (Math.abs(z) + Math.sqrt(1 + z * z)), c = 1 / Math.sqrt(1 + tt * tt), s = c * tt;
      for (k = 0; k < m; k++) { var x = wi[k], y = wj[k]; wi[k] = c * x - s * y; wj[k] = s * x + c * y; }
      var vi = V[i], vj = V[j];
      for (k = 0; k < n; k++) { var p = vi[k], q = vj[k]; vi[k] = c * p - s * q; vj[k] = s * p + c * q; }
      rot++;
    }
    S.passate++; S.off = offMax; if (!rot || S.passate > 60) S.finito = true;
    return S;
  }
  function jacobiFinisci(S) {
    var n = S.n, m = S.m, ord = [], j, i;
    for (j = 0; j < n; j++) { var s = 0; for (i = 0; i < m; i++) s += S.W[j][i] * S.W[j][i]; ord.push([Math.sqrt(s), j]); }
    ord.sort(function (a, b) { return b[0] - a[0]; });
    var U = zeri(m, n), V = zeri(n, n), sig = [];
    ord.forEach(function (o, c) { var sj = o[0], j0 = o[1]; sig.push(sj); for (var i = 0; i < m; i++) U[i][c] = sj > 0 ? S.W[j0][i] / sj : 0; for (i = 0; i < n; i++) V[i][c] = S.V[j0][i]; });
    /* colonne nulle (rango basso): si completano a una base ortonormale con Gram–Schmidt */
    for (var c = 0; c < n; c++) if (!(sig[c] > 1e-300)) {
      for (var e = 0; e < m; e++) { var v = []; for (i = 0; i < m; i++) v.push(i === e ? 1 : 0); for (var q = 0; q < n; q++) if (q !== c && (sig[q] > 1e-300 || q < c)) { var d = 0; for (i = 0; i < m; i++) d += v[i] * U[i][q]; for (i = 0; i < m; i++) v[i] -= d * U[i][q]; } var nn = Math.sqrt(v.reduce(function (s, x) { return s + x * x; }, 0)); if (nn > 1e-8) { for (i = 0; i < m; i++) U[i][c] = v[i] / nn; break; } }
    }
    return { U: U, S: sig, V: V, passate: S.passate };
  }
  function svd(A, tol) {
    var m = A.length, n = A[0].length;
    if (m < n) { var R = svd(trasposta(A), tol); return { U: R.V, S: R.S, V: R.U, passate: R.passate }; }
    var S = jacobiInizia(A); while (!S.finito) jacobiPassata(S, tol);
    return jacobiFinisci(S);
  }
  function ricomponi(R, k) { var m = R.U.length, n = R.V.length, A = zeri(m, n); k = k == null ? R.S.length : k; for (var q = 0; q < k; q++) for (var i = 0; i < m; i++) { var a = R.U[i][q] * R.S[q]; if (a) for (var j = 0; j < n; j++) A[i][j] += a * R.V[j][q]; } return A; }
  /* metodo indipendente: Jacobi simmetrico ciclico (rotazioni a due lati) per gli autovalori */
  function autoSimmetrica(A0) {
    var n = A0.length, A = A0.map(function (r) { return r.slice(); }), V = identita(n), p, q, k;
    for (var sweep = 0; sweep < 100; sweep++) {
      var off = 0; for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
      if (off < 1e-30) break;
      for (p = 0; p < n - 1; p++) for (q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        var th = (A[q][q] - A[p][p]) / (2 * A[p][q]), tt = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(tt * tt + 1), s = tt * c;
        for (k = 0; k < n; k++) { var akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (k = 0; k < n; k++) { var apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (k = 0; k < n; k++) { var vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    var ord = []; for (p = 0; p < n; p++) ord.push([A[p][p], p]); ord.sort(function (a, b) { return b[0] - a[0]; });
    return { valori: ord.map(function (o) { return o[0]; }), vettori: ord.map(function (o) { return V.map(function (r) { return r[o[1]]; }); }) };
  }
  /* SVD «geometrica» di una matrice quadrata: V rotazione; U = U′·D con U′ rotazione e D = diag(1,…,±1) */
  function svdGeometrica(A) {
    var R = svd(A), n = A.length, U = R.U.map(function (r) { return r.slice(); }), V = R.V.map(function (r) { return r.slice(); }), d;
    function detq(M) { return n === 2 ? M[0][0] * M[1][1] - M[0][1] * M[1][0] : det3(M); }
    if (detq(V) < 0) for (var i = 0; i < n; i++) { V[i][n - 1] = -V[i][n - 1]; U[i][n - 1] = -U[i][n - 1]; }
    d = detq(U) < 0 ? -1 : 1;
    var Ur = U.map(function (r) { return r.slice(); }); if (d < 0) for (i = 0; i < n; i++) Ur[i][n - 1] = -Ur[i][n - 1];
    return { U: U, Urot: Ur, S: R.S, V: V, riflessione: d < 0 };
  }
  function angolo2(R) { return Math.atan2(R[1][0], R[0][0]); }

  /* ── immagine sintetica e compressione ── */
  function immagineSintetica(h, w) {
    var A = zeri(h, w);
    for (var i = 0; i < h; i++) for (var j = 0; j < w; j++) {
      var x = j / w, y = i / h, v = 0.55 - 0.3 * y + 0.1 * x;
      var ds = Math.hypot(x - 0.78, (y - 0.24) * h / w); if (ds < 0.09) v = 0.97; else if (ds < 0.13) v = Math.max(v, 0.97 - (ds - 0.09) * 6);
      var cresta = 0.58 + 0.1 * Math.sin(x * 9.5) + 0.04 * Math.sin(x * 27 + 1); if (y > cresta) v = 0.3 + 0.12 * Math.sin(x * 40) * (y - cresta) * 3;
      if (x > 0.12 && x < 0.42 && y > 0.5 && y < 0.88) { v = 0.82; if (x > 0.23 && x < 0.31 && y > 0.68) v = 0.12; if (y > 0.56 && y < 0.64 && ((x > 0.15 && x < 0.21) || (x > 0.33 && x < 0.39))) v = ((Math.floor(x * w / 2) + Math.floor(y * h / 2)) % 2) ? 0.95 : 0.35; }
      if (y > 0.36 && y <= 0.5 && Math.abs(x - 0.27) < (y - 0.36) * 1.25) v = 0.62;
      if (y > 0.9) v = 0.5 + 0.4 * Math.sin(x * 60) * Math.sin(y * 30);
      A[i][j] = Math.max(0, Math.min(1, v));
    }
    return A;
  }
  /* errori di tutte le approssimazioni di rango k, accumulando σ_k u_k v_kᵀ */
  function erroriRango(A, R) {
    var m = A.length, n = A[0].length, Ak = zeri(m, n), nA = frobenius(A), fro = [], due = [], kk = R.S.length;
    fro.push(1);
    for (var q = 0; q < kk; q++) { var e = 0; for (var i = 0; i < m; i++) { var a = R.U[i][q] * R.S[q], riga = Ak[i], ra = A[i]; for (var j = 0; j < n; j++) { riga[j] += a * R.V[j][q]; var d = ra[j] - riga[j]; e += d * d; } } fro.push(Math.sqrt(e) / nA); }
    var coda = []; for (q = 0; q <= kk; q++) { var s = 0; for (var p = q; p < kk; p++) s += R.S[p] * R.S[p]; coda.push(Math.sqrt(s) / nA); due.push(q < kk ? R.S[q] : 0); }
    return { misurato: fro, teorico: coda, sigmaSucc: due };
  }

  /* ── PCA ── */
  function rotazioneEuler(a, b) { var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b); return prodotto([[ca, -sa, 0], [sa, ca, 0], [0, 0, 1]], [[1, 0, 0], [0, cb, -sb], [0, sb, cb]]); }
  function nuvola(n, sig, R, seme) { var r = mulberry32(seme || 4), P = []; for (var i = 0; i < n; i++) { var z = [gauss(r) * sig[0], gauss(r) * sig[1], gauss(r) * sig[2]]; P.push([R[0][0] * z[0] + R[0][1] * z[1] + R[0][2] * z[2] + 0.3, R[1][0] * z[0] + R[1][1] * z[1] + R[1][2] * z[2] - 0.2, R[2][0] * z[0] + R[2][1] * z[1] + R[2][2] * z[2] + 0.1]); } return P; }
  function pca(P) {
    var n = P.length, mu = [0, 0, 0]; P.forEach(function (p) { mu[0] += p[0] / n; mu[1] += p[1] / n; mu[2] += p[2] / n; });
    var X = P.map(function (p) { return [p[0] - mu[0], p[1] - mu[1], p[2] - mu[2]]; }), R = svd(X), tot = R.S.reduce(function (s, v) { return s + v * v; }, 0);
    return { media: mu, assi: [0, 1, 2].map(function (k) { return [R.V[0][k], R.V[1][k], R.V[2][k]]; }), dev: R.S.map(function (s) { return s / Math.sqrt(n - 1); }), spiegata: R.S.map(function (s) { return s * s / tot; }), X: X };
  }
  function covarianza(P) { var n = P.length, mu = [0, 0, 0]; P.forEach(function (p) { for (var k = 0; k < 3; k++) mu[k] += p[k] / n; }); var C = zeri(3, 3); P.forEach(function (p) { for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) C[a][b] += (p[a] - mu[a]) * (p[b] - mu[b]) / (n - 1); }); return C; }

  /* ── minimi quadrati ── */
  /* QR di Householder: Rx = Qᵀb senza mai formare AᵀA */
  function minimiQuadratiQR(A0, b0) {
    var A = A0.map(function (r) { return r.slice(); }), b = b0.slice(), m = A.length, n = A[0].length, i, j, k;
    for (k = 0; k < n; k++) {
      var nn = 0; for (i = k; i < m; i++) nn += A[i][k] * A[i][k]; nn = Math.sqrt(nn); if (nn === 0) continue;
      var alfa = A[k][k] > 0 ? -nn : nn, v = []; for (i = 0; i < m; i++) v.push(i < k ? 0 : A[i][k]); v[k] -= alfa;
      var vv = 0; for (i = k; i < m; i++) vv += v[i] * v[i]; if (vv === 0) continue;
      for (j = k; j < n; j++) { var s = 0; for (i = k; i < m; i++) s += v[i] * A[i][j]; s = 2 * s / vv; for (i = k; i < m; i++) A[i][j] -= s * v[i]; }
      var sb = 0; for (i = k; i < m; i++) sb += v[i] * b[i]; sb = 2 * sb / vv; for (i = k; i < m; i++) b[i] -= sb * v[i];
    }
    var x = new Array(n); for (i = n - 1; i >= 0; i--) { var s2 = b[i]; for (j = i + 1; j < n; j++) s2 -= A[i][j] * x[j]; x[i] = s2 / A[i][i]; }
    return x;
  }
  /* equazioni normali AᵀA x = Aᵀb con Cholesky */
  function minimiQuadratiNormali(A, b) {
    var n = A[0].length, m = A.length, N = zeri(n, n), c = [], i, j, k;
    for (i = 0; i < n; i++) { var s = 0; for (k = 0; k < m; k++) s += A[k][i] * b[k]; c.push(s); for (j = 0; j < n; j++) { s = 0; for (k = 0; k < m; k++) s += A[k][i] * A[k][j]; N[i][j] = s; } }
    var L = zeri(n, n);
    for (i = 0; i < n; i++) for (j = 0; j <= i; j++) { var s1 = N[i][j]; for (k = 0; k < j; k++) s1 -= L[i][k] * L[j][k]; if (i === j) { if (s1 <= 0) return null; L[i][i] = Math.sqrt(s1); } else L[i][j] = s1 / L[j][j]; }
    var y = []; for (i = 0; i < n; i++) { var s3 = c[i]; for (k = 0; k < i; k++) s3 -= L[i][k] * y[k]; y.push(s3 / L[i][i]); }
    var x = new Array(n); for (i = n - 1; i >= 0; i--) { var s4 = y[i]; for (k = i + 1; k < n; k++) s4 -= L[k][i] * x[k]; x[i] = s4 / L[i][i]; }
    return x;
  }
  function vandermonde(xs, grado) { return xs.map(function (x) { var r = [], p = 1; for (var k = 0; k <= grado; k++) { r.push(p); p *= x; } return r; }); }
  function numeroCondizione(A) { var S = svd(A).S; return S[0] / S[S.length - 1]; }
  function hilbert(n) { var H = zeri(n, n); for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) H[i][j] = 1 / (i + j + 1); return H; }
  function binom(n, k) { if (k < 0 || k > n) return 0; var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  /* l'inversa esatta di H_n (interi): (H⁻¹)_ij = (−1)^(i+j)(i+j−1) C(n+i−1, n−j) C(n+j−1, n−i) C(i+j−2, i−1)², indici da 1 */
  function hilbertInversa(n) { var B = zeri(n, n); for (var i = 1; i <= n; i++) for (var j = 1; j <= n; j++) B[i - 1][j - 1] = ((i + j) % 2 ? -1 : 1) * (i + j - 1) * binom(n + i - 1, n - j) * binom(n + j - 1, n - i) * Math.pow(binom(i + j - 2, i - 1), 2); return B; }
  /* norma 2 di una matrice simmetrica con il metodo delle potenze */
  function norma2Potenze(A, it) { var n = A.length, v = []; for (var i = 0; i < n; i++) v.push(1 + i * 0.01); var l = 0; for (var k = 0; k < (it || 500); k++) { var w = A.map(function (r) { return r.reduce(function (s, a, j) { return s + a * v[j]; }, 0); }), nw = Math.sqrt(w.reduce(function (s, x) { return s + x * x; }, 0)); l = nw / Math.sqrt(v.reduce(function (s, x) { return s + x * x; }, 0)); v = w.map(function (x) { return x / nw; }); } return l; }
  var KAPPA_HILBERT = { 2: 19.2814700679, 3: 524.056777586, 4: 15513.7387389, 5: 476607.250242, 6: 14951058.6425 };

  F.calcolo.svd = {
    zeri: zeri, identita: identita, trasposta: trasposta, prodotto: prodotto, frobenius: frobenius, differenza: differenza, det3: det3,
    jacobiInizia: jacobiInizia, jacobiPassata: jacobiPassata, jacobiFinisci: jacobiFinisci, svd: svd, ricomponi: ricomponi, autoSimmetrica: autoSimmetrica, svdGeometrica: svdGeometrica, angolo2: angolo2,
    immagineSintetica: immagineSintetica, erroriRango: erroriRango,
    rotazioneEuler: rotazioneEuler, nuvola: nuvola, pca: pca, covarianza: covarianza,
    minimiQuadratiQR: minimiQuadratiQR, minimiQuadratiNormali: minimiQuadratiNormali, vandermonde: vandermonde, numeroCondizione: numeroCondizione,
    hilbert: hilbert, hilbertInversa: hilbertInversa, norma2Potenze: norma2Potenze, KAPPA_HILBERT: KAPPA_HILBERT, mulberry32: mulberry32
  };

  /* ═══ disegno: pezzi comuni ═════════════════════════════════════════════ */
  function grigliaUI(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function casella(pan, et, val, cambia) {
    var c = F.el('input', { type: 'checkbox' }); c.checked = !!val; c.addEventListener('change', function () { cambia(c.checked); });
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(et) })])); return c;
  }
  function scheda3d(costruisci, rapporto) {
    return function (div) {
      var G = grigliaUI(div), lab = globale.BSILab3D;
      if (!lab) { nota(G.pan, t('Serve il Laboratorio 3D (bsi-lab3d.js) per questa scheda: qui si vedrebbe la scena tridimensionale.', 'The 3D Laboratory (bsi-lab3d.js) is needed for this tab: it would show the three-dimensional scene.')); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); G.dx.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () { attesa.remove(); var S = new lab.Scena(G.dx, rapporto || 0.7); div._scena = S; costruisci(G.pan, S, G.dx); })
        .catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; if (!attesa.parentNode) G.dx.appendChild(attesa); });
    };
  }
  function mostraMat(A, cifre) { return '<span class="bsiFX-num">[' + A.map(function (r) { return r.map(function (v) { var s = (+v).toFixed(cifre == null ? 3 : cifre); return s === '-0.000' ? '0.000' : s; }).join('  '); }).join(' ; ') + ']</span>'; }
  var COL_ASSI = ['#ff8a80', '#5eead4', '#6bcfff'];
  /* interpolazione fra fasi con un ritardo morbido */
  function morbido(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }

  /* ═══ 1. SVD 2×2 ════════════════════════════════════════════════════════ */
  function schedaDue(div) {
    var G = grigliaUI(div), pan = G.pan, st = { a: 2, b: 1, c: 0.5, d: 1.5 };
    var gr = F.el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:0 10px' }); pan.appendChild(gr);
    [['a', 'a₁₁'], ['b', 'a₁₂'], ['c', 'a₂₁'], ['d', 'a₂₂']].forEach(function (p) { F.cursore(gr, [p[1], p[1]], -3, 3, 0.1, st[p[0]], function (v) { st[p[0]] = v; calcola(); }, function (v) { return v.toFixed(1); }); });
    F.scelta(pan, ['Esempi', 'Examples'], [['', '—'], ['tagl', t('taglio [[1, 1], [0, 1]]', 'shear [[1, 1], [0, 1]]')], ['rifl', t('con riflessione (det < 0)', 'with reflection (det < 0)')], ['sing', t('singolare (rango 1)', 'singular (rank 1)')], ['rot', t('rotazione pura', 'pure rotation')]], '', function (v) {
      var E = { tagl: [1, 1, 0, 1], rifl: [1, 2, 1.5, -0.5], sing: [2, 1, 1, 0.5], rot: [0.8, -0.6, 0.6, 0.8] }[v]; if (!E) return; st.a = E[0]; st.b = E[1]; st.c = E[2]; st.d = E[3];
      [].forEach.call(gr.querySelectorAll('input'), function (inp, i) { inp.value = E[i]; var b = inp.parentNode.querySelector('b'); if (b) b.textContent = (+E[i]).toFixed(1); }); calcola();
    });
    var info = nota(pan);
    nota(pan, t('Ogni matrice A = UΣVᵀ: Vᵀ ruota il piano portando i vettori singolari destri v₁, v₂ sugli assi, Σ stira lungo gli assi dei fattori σ₁ ≥ σ₂ ≥ 0, U ruota (o ruota e riflette, se det A < 0) sugli assi u₁, u₂ dell’ellisse. Il cerchio unitario diventa un’ellisse di semiassi σ₁ e σ₂: σ₁ = ‖A‖₂ è il massimo allungamento, σ₂ il minimo, |det A| = σ₁σ₂ è il fattore d’area e κ = σ₁/σ₂ misura quanto la matrice è vicina a essere singolare. I valori singolari sono le radici degli autovalori di AᵀA; qui sono calcolati con Jacobi a un lato e confrontati con la formula chiusa del caso 2×2.',
      'Every matrix A = UΣVᵀ: Vᵀ rotates the plane taking the right singular vectors v₁, v₂ to the axes, Σ stretches along the axes by σ₁ ≥ σ₂ ≥ 0, U rotates (or rotates and reflects, if det A < 0) onto the axes u₁, u₂ of the ellipse. The unit circle becomes an ellipse with semi-axes σ₁ and σ₂: σ₁ = ‖A‖₂ is the largest stretch, σ₂ the smallest, |det A| = σ₁σ₂ is the area factor and κ = σ₁/σ₂ measures how close the matrix is to singular. Singular values are the square roots of the eigenvalues of AᵀA; here they are computed with one-sided Jacobi and checked against the 2×2 closed form.'));
    var ca = F.tela(G.dx, 0.62), R, A;
    function calcola() {
      A = [[st.a, st.b], [st.c, st.d]]; R = svdGeometrica(A);
      var AtA = prodotto(trasposta(A), A), tr = AtA[0][0] + AtA[1][1], de = AtA[0][0] * AtA[1][1] - AtA[0][1] * AtA[1][0], disc = Math.sqrt(Math.max(0, tr * tr / 4 - de)), s1 = Math.sqrt(tr / 2 + disc), s2 = Math.sqrt(Math.max(0, tr / 2 - disc));
      var dt = st.a * st.d - st.b * st.c, err = frobenius(differenza(A, ricomponi({ U: R.U, S: R.S, V: R.V })));
      info.innerHTML = 'σ₁ = <b>' + R.S[0].toFixed(6) + '</b>, σ₂ = <b>' + R.S[1].toFixed(6) + '</b> (' + t('formula chiusa ', 'closed form ') + s1.toFixed(6) + ', ' + s2.toFixed(6) + ')<br>' +
        'V: ' + t('rotazione di ', 'rotation by ') + (angolo2(R.V) * 180 / PI).toFixed(2) + '° · U: ' + (R.riflessione ? t('riflessione · ', 'reflection · ') : '') + t('rotazione di ', 'rotation by ') + (angolo2(R.Urot) * 180 / PI).toFixed(2) + '°<br>' +
        'det A = ' + dt.toFixed(4) + ' = ' + (dt < 0 ? '−' : '') + 'σ₁σ₂ = ' + (R.S[0] * R.S[1] * (dt < 0 ? -1 : 1)).toFixed(4) + ' · κ = σ₁/σ₂ = <b>' + (R.S[1] > 1e-12 ? fmt(R.S[0] / R.S[1]) : '∞') + '</b><br>‖A − UΣVᵀ‖_F = ' + err.toExponential(1);
    }
    calcola();
    F.anima(ca, function (dt, tempo) {
      var Pp = F.pennello(ca), q = Pp.q, W = Pp.W, H = Pp.H, sc = Math.min(W, H) / (2 * Math.max(1.6, R.S[0] * 1.15)), cx = W / 2, cy = H / 2;
      var per = 8, f = (tempo % per) / per * 4, fase = Math.floor(f), u = morbido((f - fase) * 1.3);
      /* M(t): I → Vᵀ → Σ' Vᵀ → U' Σ' Vᵀ (Σ' = Σ·diag(1, ±1)) */
      var thV = -angolo2(R.V), thU = angolo2(R.Urot), sg = R.riflessione ? -1 : 1;
      function rot(a) { return [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]]; }
      var M;
      if (fase === 0) M = rot(thV * u);
      else if (fase === 1) M = prodotto([[1 + (R.S[0] - 1) * u, 0], [0, 1 + (sg * R.S[1] - 1) * u]], rot(thV));
      else if (fase === 2) M = prodotto(rot(thU * u), prodotto([[R.S[0], 0], [0, sg * R.S[1]]], rot(thV)));
      else M = A;
      var X = function (p) { return cx + p[0] * sc; }, Y = function (p) { return cy - p[1] * sc; }, ap = function (p) { return [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]]; };
      q.strokeStyle = '#1d2f49'; q.lineWidth = 1; for (var g = -6; g <= 6; g++) { q.beginPath(); q.moveTo(X([g, -6]), Y([g, -6])); q.lineTo(X([g, 6]), Y([g, 6])); q.moveTo(X([-6, g]), Y([-6, g])); q.lineTo(X([6, g]), Y([6, g])); q.stroke(); }
      q.strokeStyle = 'rgba(132,148,168,.5)'; q.setLineDash([4, 4]); q.beginPath(); q.arc(cx, cy, sc, 0, 7); q.stroke(); q.setLineDash([]);
      /* la griglia trasformata e il cerchio immagine colorato per angolo */
      q.strokeStyle = 'rgba(94,234,212,.22)'; for (g = -2; g <= 2; g++) { q.beginPath(); for (var k = -20; k <= 20; k++) { var p = ap([g / 2, k / 10]); if (k > -20) q.lineTo(X(p), Y(p)); else q.moveTo(X(p), Y(p)); } q.stroke(); q.beginPath(); for (k = -20; k <= 20; k++) { p = ap([k / 10, g / 2]); if (k > -20) q.lineTo(X(p), Y(p)); else q.moveTo(X(p), Y(p)); } q.stroke(); }
      for (k = 0; k < 120; k++) { var a0 = 2 * PI * k / 120, a1 = 2 * PI * (k + 1) / 120, p0 = ap([Math.cos(a0), Math.sin(a0)]), p1 = ap([Math.cos(a1), Math.sin(a1)]); q.strokeStyle = 'hsl(' + Math.round(360 * k / 120) + ',85%,62%)'; q.lineWidth = 3; q.beginPath(); q.moveTo(X(p0), Y(p0)); q.lineTo(X(p1), Y(p1)); q.stroke(); }
      [0, 1].forEach(function (i) { var v = [R.V[0][i], R.V[1][i]], w = ap(v); q.strokeStyle = COL_ASSI[i]; q.fillStyle = COL_ASSI[i]; q.lineWidth = 2.5; q.beginPath(); q.moveTo(cx, cy); q.lineTo(X(w), Y(w)); q.stroke(); q.beginPath(); q.arc(X(w), Y(w), 4, 0, 7); q.fill(); q.font = 'bold 12px system-ui,sans-serif'; q.fillText(fase === 3 ? 'σ' + (i + 1) + 'u' + (i + 1) : 'v' + (i + 1), X(w) + 6, Y(w) - 6); });
      var nomi = [t('1. Vᵀ: rotazione', '1. Vᵀ: rotation'), t('2. Σ: stiramento lungo gli assi', '2. Σ: stretch along the axes'), t('3. U: rotazione', '3. U: rotation') + (R.riflessione ? t(' (dopo la riflessione)', ' (after the reflection)') : ''), t('A = UΣVᵀ', 'A = UΣVᵀ')];
      q.fillStyle = '#cfe3f7'; q.font = '13px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(nomi[fase], 10, 18);
      ca.setAttribute('aria-label', t('Il cerchio unitario trasformato da Vᵀ, Σ e U', 'The unit circle transformed by Vᵀ, Σ and U'));
    });
  }

  /* ═══ 2. SVD 3×3 in 3D ══════════════════════════════════════════════════ */
  var ESEMPI3 = { esempio: [[2.2, 0.8, 0.3], [0.4, 1.4, 0.5], [-0.3, 0.6, 0.8]], rango2: [[1, 2, 0.5], [0.5, 1, 0.25], [1.5, 0.2, 1]], riflessione: [[0, 1.5, 0], [1, 0, 0], [0, 0, 0.7]], taglio: [[1, 1.2, 0], [0, 1, 0.8], [0, 0, 1]] };
  var semeCasuale = 0;
  function schedaTre(pan, S, destra) {
    var T = S.T, lab = globale.BSILab3D, st = { A: ESEMPI3.esempio.map(function (r) { return r.slice(); }), vel: 1, pausa: false };
    F.scelta(pan, ['Matrice', 'Matrix'], [['esempio', t('esempio generico', 'generic example')], ['rango2', t('rango 2: l’ellissoide si schiaccia', 'rank 2: the ellipsoid flattens')], ['riflessione', t('scambio di assi (det < 0)', 'axis swap (det < 0)')], ['taglio', t('taglio', 'shear')], ['casuale', t('casuale', 'random')]], 'esempio', function (v) {
      if (v === 'casuale') { var r = mulberry32(++semeCasuale * 7919); st.A = [0, 1, 2].map(function () { return [0, 1, 2].map(function () { return Math.round((r() * 4 - 2) * 10) / 10; }); }); }
      else st.A = ESEMPI3[v].map(function (r) { return r.slice(); });
      [].forEach.call(gr.querySelectorAll('input'), function (inp, k) { var vv = st.A[Math.floor(k / 3)][k % 3]; inp.value = vv; var b = inp.parentNode.querySelector('b'); if (b) b.textContent = (+vv).toFixed(1); }); calcola();
    });
    var gr = F.el('div', { style: 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 8px' }); pan.appendChild(gr);
    for (var k0 = 0; k0 < 9; k0++) (function (k) { var i = Math.floor(k / 3), j = k % 3; F.cursore(gr, ['a' + (i + 1) + (j + 1), 'a' + (i + 1) + (j + 1)], -3, 3, 0.1, st.A[i][j], function (v) { st.A[i][j] = v; calcola(); }, function (v) { return v.toFixed(1); }); })(k0);
    var riga = F.el('div', { 'class': 'bsiFX-anim' });
    var bp = F.el('button', { type: 'button', testo: '❚❚', 'aria-label': t('Pausa', 'Pause'), onclick: function () { st.pausa = !st.pausa; bp.textContent = st.pausa ? '▶' : '❚❚'; S.avvia(); } }); riga.appendChild(bp);
    riga.appendChild(F.el('button', { type: 'button', testo: '↺', 'aria-label': t('Ricomincia', 'Restart'), onclick: function () { tempo = 0; st.pausa = false; bp.textContent = '❚❚'; S.avvia(); } }));
    [0.5, 1, 2].forEach(function (v) { riga.appendChild(F.el('button', { type: 'button', testo: '×' + v, 'aria-label': t('Velocità ', 'Speed ') + v, onclick: function () { st.vel = v; } })); });
    pan.appendChild(riga);
    var info = nota(pan);
    nota(pan, t('La sfera unitaria (con meridiani e paralleli per vedere le rotazioni) subisce i tre fattori uno dopo l’altro: Vᵀ la ruota portando i vettori singolari destri v₁, v₂, v₃ (frecce) sugli assi, Σ la stira in un ellissoide allineato agli assi, U lo ruota nella posizione finale. Le rotazioni sono interpolate con la slerp dei quaternioni (velocità angolare costante). Se det A < 0 serve anche una riflessione, che si vede come lo schiacciamento dell’ellissoide fino a un disco e il suo ribaltamento; se A ha rango 2 l’ellissoide resta piatto. Il volume dell’ellissoide è (4/3)π σ₁σ₂σ₃ = (4/3)π |det A|.',
      'The unit sphere (with meridians and parallels to make rotations visible) undergoes the three factors one after another: Vᵀ rotates it taking the right singular vectors v₁, v₂, v₃ (arrows) to the axes, Σ stretches it into an axis-aligned ellipsoid, U rotates it into the final position. Rotations are interpolated with quaternion slerp (constant angular speed). If det A < 0 a reflection is also needed, seen as the ellipsoid flattening to a disc and flipping over; if A has rank 2 the ellipsoid stays flat. The ellipsoid volume is (4/3)π σ₁σ₂σ₃ = (4/3)π |det A|.'));
    var R, gruppo, frecce = [], qV, qU, tempo = 0, etFase = F.el('div', { 'class': 'bsiFX-nota' }); pan.insertBefore(etFase, info);
    function costruisci() {
      S.pulisci(); frecce = [];
      gruppo = new T.Group(); gruppo.matrixAutoUpdate = false;
      var sf = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshStandardMaterial({ color: 0x5eead4, transparent: true, opacity: 0.38, roughness: 0.35, metalness: 0.1, side: T.DoubleSide, depthWrite: false }));
      gruppo.add(sf);
      var pts = []; for (var m = 0; m < 12; m++) { var ph = PI * m / 12; for (var k = 0; k < 64; k++) { var a = 2 * PI * k / 64, b = 2 * PI * (k + 1) / 64; pts.push(new T.Vector3(Math.cos(a) * Math.sin(ph + 0), Math.sin(a) * Math.sin(ph), Math.cos(ph))); void b; } }
      var lin = []; for (m = 1; m < 8; m++) { var th = PI * m / 8; for (k = 0; k < 64; k++) { var a1 = 2 * PI * k / 64, a2 = 2 * PI * (k + 1) / 64; lin.push(new T.Vector3(Math.sin(th) * Math.cos(a1), Math.sin(th) * Math.sin(a1), Math.cos(th)), new T.Vector3(Math.sin(th) * Math.cos(a2), Math.sin(th) * Math.sin(a2), Math.cos(th))); } }
      for (m = 0; m < 8; m++) { var fi = PI * m / 8; for (k = 0; k < 32; k++) { var t1 = 2 * PI * k / 32, t2 = 2 * PI * (k + 1) / 32; lin.push(new T.Vector3(Math.sin(t1) * Math.cos(fi), Math.sin(t1) * Math.sin(fi), Math.cos(t1)), new T.Vector3(Math.sin(t2) * Math.cos(fi), Math.sin(t2) * Math.sin(fi), Math.cos(t2))); } }
      gruppo.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(lin), new T.LineBasicMaterial({ color: 0xe6fffb, transparent: true, opacity: 0.35 })));
      void pts;
      S.aggiungi(gruppo);
      [0, 1, 2].forEach(function (i) { var fr = lab.freccia(T, [0, 0, 0], [1, 0, 0], new T.Color(COL_ASSI[i]).getHex(), 0.25); S.aggiungi(fr); frecce.push(fr); });
      S.aggiungi(lab.assi(T, 3.2, ['x', 'y', 'z'], 0.3));
      var luce = new T.PointLight(0xffffff, 0.5, 40); luce.position.set(4, -3, 6); S.aggiungi(luce);
      S.ogniFotogramma(function (dt) { if (st.pausa || !R) return false; tempo += dt * st.vel; aggiorna(); });
      S.inquadra(10, -0.8, 1.1);
    }
    function m4(M) { var m = new T.Matrix4(); m.set(M[0][0], M[0][1], M[0][2], 0, M[1][0], M[1][1], M[1][2], 0, M[2][0], M[2][1], M[2][2], 0, 0, 0, 0, 1); return m; }
    function calcola() {
      R = svdGeometrica(st.A);
      var Vt = trasposta(R.V); qV = new T.Quaternion().setFromRotationMatrix(m4(Vt)); qU = new T.Quaternion().setFromRotationMatrix(m4(R.Urot));
      var AtA = prodotto(trasposta(st.A), st.A), E = autoSimmetrica(AtA), dt = det3(st.A), err = frobenius(differenza(st.A, ricomponi({ U: R.U, S: R.S, V: R.V })));
      var ortU = frobenius(differenza(prodotto(trasposta(R.U), R.U), identita(3))), ortV = frobenius(differenza(prodotto(trasposta(R.V), R.V), identita(3)));
      info.innerHTML = 'σ = <b>' + R.S.map(function (v) { return v.toFixed(5); }).join(', ') + '</b><br>' + t('√autovalori di AᵀA (Jacobi simmetrico): ', '√eigenvalues of AᵀA (symmetric Jacobi): ') + E.valori.map(function (v) { return Math.sqrt(Math.max(0, v)).toFixed(5); }).join(', ') + '<br>' +
        'det A = ' + dt.toFixed(4) + ', σ₁σ₂σ₃ = ' + (R.S[0] * R.S[1] * R.S[2]).toFixed(4) + (R.riflessione ? t(' (det < 0: U contiene una riflessione)', ' (det < 0: U contains a reflection)') : '') + '<br>' +
        '‖A − UΣVᵀ‖_F = ' + err.toExponential(1) + ' · ‖UᵀU − I‖ = ' + ortU.toExponential(1) + ' · ‖VᵀV − I‖ = ' + ortV.toExponential(1) + '<br>V = ' + mostraMat(R.V) + '<br>U = ' + mostraMat(R.U);
      tempo = 0; S.avvia();
    }
    function aggiorna() {
      var per = 10, f = (tempo % per) / per * 4, fase = Math.floor(f), u = morbido((f - fase) * 1.3), sg = R.riflessione ? -1 : 1, q = new T.Quaternion(), M3;
      var mq = function (qq) { var m = new T.Matrix4().makeRotationFromQuaternion(qq), e = m.elements; return [[e[0], e[4], e[8]], [e[1], e[5], e[9]], [e[2], e[6], e[10]]]; };
      var Vt = mq(qV), Sg = function (w) { return [[1 + (R.S[0] - 1) * w, 0, 0], [0, 1 + (R.S[1] - 1) * w, 0], [0, 0, 1 + (sg * R.S[2] - 1) * w]]; };
      if (fase === 0) { q.copy(new T.Quaternion()).slerp(qV, u); M3 = mq(q); }
      else if (fase === 1) M3 = prodotto(Sg(u), Vt);
      else if (fase === 2) { q.copy(new T.Quaternion()).slerp(qU, u); M3 = prodotto(mq(q), prodotto(Sg(1), Vt)); }
      else M3 = st.A;
      gruppo.matrix.copy(m4(M3)); gruppo.matrixWorldNeedsUpdate = true;
      frecce.forEach(function (fr, i) { var v = [R.V[0][i], R.V[1][i], R.V[2][i]], w = [M3[0][0] * v[0] + M3[0][1] * v[1] + M3[0][2] * v[2], M3[1][0] * v[0] + M3[1][1] * v[1] + M3[1][2] * v[2], M3[2][0] * v[0] + M3[2][1] * v[1] + M3[2][2] * v[2]], L = Math.hypot(w[0], w[1], w[2]); if (L > 1e-6) { fr.visible = true; fr.setDirection(new T.Vector3(w[0] / L, w[1] / L, w[2] / L)); fr.setLength(Math.max(0.05, L), Math.min(0.25, L * 0.3), Math.min(0.15, L * 0.2)); } else fr.visible = false; });
      var nomi = [t('1. Vᵀ: rotazione (v₁, v₂, v₃ → assi)', '1. Vᵀ: rotation (v₁, v₂, v₃ → axes)'), t('2. Σ: stiramento ', '2. Σ: stretch ') + R.S.map(function (v) { return v.toFixed(2); }).join(' × ') + (R.riflessione ? t(' con riflessione', ' with reflection') : ''), t('3. U: rotazione finale', '3. U: final rotation'), 'A = UΣVᵀ'];
      S.didascalia.textContent = nomi[fase];
      if (etFase._f !== fase) { etFase._f = fase; etFase.innerHTML = '<b>' + nomi[fase] + '</b>'; }
    }
    costruisci(); calcola(); aggiorna();
  }

  /* ═══ 3. compressione di un'immagine ════════════════════════════════════ */
  function schedaImmagine(div) {
    var G = grigliaUI(div), pan = G.pan, h = 96, w = 128, st = { k: 10 };
    var ck = F.cursore(pan, ['valori singolari tenuti k', 'singular values kept k'], 1, 96, 1, st.k, function (v) { st.k = v; disegna(); });
    var info = nota(pan);
    nota(pan, t('Un’immagine in scala di grigi è una matrice A (96 × 128, valori fra 0 e 1, disegnata qui da una formula, sempre la stessa). La SVD la scrive come somma di matrici di rango 1, A = Σ σ_i u_i v_iᵀ, in ordine di importanza; tenere i primi k termini costa k(m + n + 1) numeri invece di mn. Eckart–Young–Mirsky: A_k è la migliore approssimazione di rango k sia in norma di Frobenius, con errore √(σ²_{k+1} + … + σ²_r), sia in norma 2, con errore σ_{k+1}. Il grafico confronta l’errore misurato pixel per pixel con quello previsto dai soli valori singolari: le due curve coincidono. Le parti lisce (cielo, sole) si ricostruiscono con pochi termini, i bordi netti e le strisce ne chiedono molti.',
      'A greyscale image is a matrix A (96 × 128, values between 0 and 1, drawn here from a formula, always the same). The SVD writes it as a sum of rank-one matrices, A = Σ σ_i u_i v_iᵀ, in order of importance; keeping the first k terms costs k(m + n + 1) numbers instead of mn. Eckart–Young–Mirsky: A_k is the best rank-k approximation both in Frobenius norm, with error √(σ²_{k+1} + … + σ²_r), and in 2-norm, with error σ_{k+1}. The chart compares the error measured pixel by pixel with the one predicted from the singular values alone: the two curves coincide. Smooth parts (sky, sun) are rebuilt with few terms, sharp edges and stripes need many.'));
    var ci = F.tela(G.dx, 0.42), ce = F.tela(G.dx, 0.45);
    var A = immagineSintetica(h, w), R = null, err = null, stato = jacobiInizia(trasposta(A)), lavoro = true;
    function immagine(M, alto, largo) { var c = D.createElement('canvas'); c.width = largo; c.height = alto; var q = c.getContext('2d'), im = q.createImageData(largo, alto); for (var i = 0; i < alto; i++) for (var j = 0; j < largo; j++) { var v = Math.max(0, Math.min(255, Math.round(M[i][j] * 255))), k = 4 * (i * largo + j); im.data[k] = v; im.data[k + 1] = v; im.data[k + 2] = v; im.data[k + 3] = 255; } q.putImageData(im, 0, 0); return c; }
    var origCanvas = immagine(A, h, w);
    function disegna() {
      ci._rapporto = (ci.clientWidth || 600) > 620 ? 0.29 : 0.42;
      var Pp = F.pennello(ci), q = Pp.q, W = Pp.W, H = Pp.H, tre = W > 620, nP = tre ? 3 : 2, pw = (W - 10 * (nP + 1)) / nP, ph = pw * h / w;
      if (ph > H - 30) { ph = H - 30; pw = ph * w / h; }
      q.imageSmoothingEnabled = false;
      var x0 = (W - nP * pw - (nP - 1) * 10) / 2;
      q.drawImage(origCanvas, x0, 22, pw, ph);
      q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(t('originale (rango ', 'original (rank ') + (R ? R.S.filter(function (s) { return s > 1e-10 * R.S[0]; }).length : '…') + ')', x0, 15);
      if (R) {
        var Ak = ricomponi(R, st.k), Ak2 = Ak.map(function (r) { return r.map(function (v) { return Math.max(0, Math.min(1, v)); }); });
        q.drawImage(immagine(Ak2, h, w), x0 + pw + 10, 22, pw, ph);
        q.fillText(t('rango k = ', 'rank k = ') + st.k + ' · ' + Math.round(100 * st.k * (h + w + 1) / (h * w)) + t(' % dei numeri', ' % of the numbers'), x0 + pw + 10, 15);
        if (tre) { var E = A.map(function (r, i) { return r.map(function (v, j) { return Math.min(1, Math.abs(v - Ak[i][j]) * 4); }); }); q.drawImage(immagine(E, h, w), x0 + 2 * (pw + 10), 22, pw, ph); q.fillText(t('|errore| × 4', '|error| × 4'), x0 + 2 * (pw + 10), 15); }
        var e2 = 0, ef = frobenius(differenza(A, Ak)) / frobenius(A);
        e2 = st.k < R.S.length ? R.S[st.k] : 0;
        info.innerHTML = 'σ₁ = ' + R.S[0].toFixed(3) + ', σ₁₀ = ' + R.S[9].toFixed(3) + ', σ₅₀ = ' + R.S[49].toFixed(4) + '<br>' + t('Errore relativo di Frobenius con k = ', 'Relative Frobenius error with k = ') + st.k + ': ' + t('misurato ', 'measured ') + '<b>' + ef.toFixed(6) + '</b>, ' + t('previsto ', 'predicted ') + '<b>' + err.teorico[st.k].toFixed(6) + '</b><br>' +
          t('Errore in norma 2: σ_{k+1} = ', '2-norm error: σ_{k+1} = ') + fmt(e2) + ' · ' + t('Jacobi a un lato: ', 'one-sided Jacobi: ') + R.passate + t(' passate', ' sweeps');
      } else {
        q.fillText(t('Jacobi a un lato in corso: passata ', 'One-sided Jacobi running: sweep ') + stato.passate + ', max |cos| = ' + (isFinite(stato.off) ? stato.off.toExponential(1) : '—'), x0 + pw + 10, 40);
        info.innerHTML = t('Decomposizione in corso (una passata di Jacobi per volta)…', 'Decomposition in progress (one Jacobi sweep at a time)…') + ' ' + t('passata ', 'sweep ') + stato.passate;
      }
      ci.setAttribute('aria-label', t('Immagine originale e approssimazione di rango ', 'Original image and rank ') + st.k + t('', ' approximation'));
    }
    function grafico() {
      if (!R) { F.grafico(ce, { serie: [{ x: [0, 96], y: [0, 0], col: '#34465f' }], xmin: 0, xmax: 96, ymin: -6, ymax: 0, xl: ['k', 'k'], yl: ['log₁₀', 'log₁₀'], descr: ['Errore di approssimazione (in calcolo)', 'Approximation error (computing)'] }); return; }
      var K = [], m = [], tt = [], sg = [];
      for (var k = 0; k <= 96; k++) { K.push(k); m.push(Math.log10(Math.max(1e-16, err.misurato[k]))); tt.push(Math.log10(Math.max(1e-16, err.teorico[k]))); sg.push(Math.log10(Math.max(1e-16, (R.S[k] || 1e-16) / R.S[0]))); }
      F.grafico(ce, { serie: [{ x: K, y: tt, col: '#ffd24a', larg: 3, etich: ['previsto', 'predicted'] }, { x: K, y: m, col: '#5eead4', tratt: true, etich: ['misurato', 'measured'] }, { x: K, y: sg, col: '#c9a0ff', larg: 1.5, etich: ['σ_k/σ₁', 'σ_k/σ₁'] }], punti: [{ x: st.k, y: Math.log10(Math.max(1e-16, err.misurato[st.k])), col: '#ffffff', r: 5 }], xmin: 0, xmax: 96, ymin: -16, ymax: 0.3, xl: ['k', 'k'], yl: ['log₁₀', 'log₁₀'], legenda: [{ col: '#ffd24a', etich: ['√(Σ_{i>k} σ_i²)/‖A‖ (Eckart–Young)', '√(Σ_{i>k} σ_i²)/‖A‖ (Eckart–Young)'] }, { col: '#5eead4', etich: ['‖A − A_k‖_F/‖A‖ misurato', 'measured ‖A − A_k‖_F/‖A‖'] }, { col: '#c9a0ff', etich: ['σ_k/σ₁', 'σ_k/σ₁'] }], descr: ['Errore relativo contro il rango k', 'Relative error against the rank k'] });
    }
    disegna(); grafico();
    ck.addEventListener('input', function () { if (R) grafico(); });
    (function lotto() {
      if (!lavoro) return;
      if (ci.offsetParent === null) { setTimeout(lotto, 400); return; }
      jacobiPassata(stato, 1e-14);
      if (stato.finito) { var Rt = jacobiFinisci(stato); R = { U: Rt.V, S: Rt.S, V: Rt.U, passate: Rt.passate }; lavoro = false; setTimeout(function () { err = erroriRango(A, R); disegna(); grafico(); }, 0); }
      else { disegna(); setTimeout(lotto, 0); }
    })();
    F.alRidimensiona(function () { if (ci.offsetParent) disegna(); });
  }

  /* ═══ 4. PCA in 3D ══════════════════════════════════════════════════════ */
  function schedaPCA(pan, S, destra) {
    var T = S.T, lab = globale.BSILab3D, st = { n: 2000, s1: 1.6, s2: 0.8, s3: 0.25, a: 35, b: 50, proietta: false };
    F.cursore(pan, ['punti', 'points'], 200, 6000, 200, st.n, function (v) { st.n = v; calcola(); });
    F.cursore(pan, ['deviazione lungo l’asse 1', 'spread along axis 1'], 0.1, 2, 0.05, st.s1, function (v) { st.s1 = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['deviazione lungo l’asse 2', 'spread along axis 2'], 0.1, 2, 0.05, st.s2, function (v) { st.s2 = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['deviazione lungo l’asse 3', 'spread along axis 3'], 0.05, 2, 0.05, st.s3, function (v) { st.s3 = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['rotazione attorno a z (°)', 'rotation about z (°)'], 0, 180, 5, st.a, function (v) { st.a = v; calcola(); });
    F.cursore(pan, ['inclinazione (°)', 'tilt (°)'], 0, 90, 5, st.b, function (v) { st.b = v; calcola(); });
    casella(pan, ['proietta sul piano dei primi due assi', 'project onto the plane of the first two axes'], st.proietta, function (v) { st.proietta = v; S.avvia(); });
    var info = nota(pan);
    nota(pan, t('Analisi delle componenti principali: si centrano i dati (n punti × 3 coordinate) nella matrice X e se ne fa la SVD, X = UΣVᵀ. Le colonne di V sono le direzioni principali (frecce), σ_i²/(n − 1) le varianze lungo di esse, σ_i²/Σσ² la frazione di varianza spiegata. È lo stesso che diagonalizzare la covarianza C = XᵀX/(n − 1), ma senza formarla: la SVD lavora con κ(X) invece di κ(X)². Proiettare sui primi k assi è la migliore approssimazione di rango k dei dati (Eckart–Young). L’ellissoide trasparente ha semiassi 2σ.',
      'Principal component analysis: the data (n points × 3 coordinates) are centred into the matrix X and decomposed, X = UΣVᵀ. The columns of V are the principal directions (arrows), σ_i²/(n − 1) the variances along them, σ_i²/Σσ² the fraction of explained variance. It is the same as diagonalising the covariance C = XᵀX/(n − 1), but without forming it: the SVD works with κ(X) instead of κ(X)². Projecting onto the first k axes is the best rank-k approximation of the data (Eckart–Young). The transparent ellipsoid has semi-axes 2σ.'));
    var cs = F.tela(destra, 0.36);
    var punti = null, pos, orig, proiez, P0, frazione = 0, ell, frecce = [];
    function calcola() {
      S.pulisci(); frecce = [];
      var Rm = rotazioneEuler(st.a * PI / 180, st.b * PI / 180), P = nuvola(st.n, [st.s1, st.s2, st.s3], Rm, 4), C = pca(P), Cv = covarianza(P), E = autoSimmetrica(Cv);
      P0 = C;
      pos = new Float32Array(st.n * 3); orig = new Float32Array(st.n * 3); proiez = new Float32Array(st.n * 3);
      var col = new Float32Array(st.n * 3), a3 = C.assi[2], mx = 0;
      P.forEach(function (p, i) { var d = (p[0] - C.media[0]) * a3[0] + (p[1] - C.media[1]) * a3[1] + (p[2] - C.media[2]) * a3[2]; mx = Math.max(mx, Math.abs(d)); });
      P.forEach(function (p, i) {
        var x = p[0] - C.media[0], y = p[1] - C.media[1], z = p[2] - C.media[2], d = x * a3[0] + y * a3[1] + z * a3[2];
        orig[3 * i] = x; orig[3 * i + 1] = y; orig[3 * i + 2] = z; proiez[3 * i] = x - d * a3[0]; proiez[3 * i + 1] = y - d * a3[1]; proiez[3 * i + 2] = z - d * a3[2];
        var f = 0.5 + 0.5 * d / (mx || 1), c = new T.Color().setHSL(0.6 - 0.55 * f, 0.85, 0.6); col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b;
      });
      pos.set(st.proietta ? proiez : orig); frazione = st.proietta ? 1 : 0;
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
      punti = new T.Points(g, new T.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })); S.aggiungi(punti);
      /* ellissoide di semiassi 2σ orientato sugli assi principali */
      ell = new T.Mesh(new T.SphereGeometry(1, 40, 24), new T.MeshStandardMaterial({ color: 0xffd24a, transparent: true, opacity: 0.12, depthWrite: false, side: T.DoubleSide }));
      ell.matrixAutoUpdate = false; var A3 = C.assi, d2 = C.dev.map(function (v) { return 2 * v; });
      ell.matrix.set(A3[0][0] * d2[0], A3[1][0] * d2[1], A3[2][0] * d2[2], 0, A3[0][1] * d2[0], A3[1][1] * d2[1], A3[2][1] * d2[2], 0, A3[0][2] * d2[0], A3[1][2] * d2[1], A3[2][2] * d2[2], 0, 0, 0, 0, 1);
      S.aggiungi(ell);
      C.assi.forEach(function (a, i) { var L = 2 * C.dev[i] + 0.05; S.aggiungi(lab.freccia(T, [0, 0, 0], [a[0] * L, a[1] * L, a[2] * L], new T.Color(COL_ASSI[i]).getHex(), 0.22)); var e = lab.testo3d(T, 'PC' + (i + 1), COL_ASSI[i], 0.28); e.position.set(a[0] * (L + 0.3), a[1] * (L + 0.3), a[2] * (L + 0.3)); S.aggiungi(e); });
      /* il piano principale */
      var pl = new T.Mesh(new T.PlaneGeometry(2 * 2.2 * C.dev[0] + 0.5, 2 * 2.2 * C.dev[1] + 0.5), new T.MeshBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.07, side: T.DoubleSide, depthWrite: false }));
      pl.matrixAutoUpdate = false; pl.matrix.set(A3[0][0], A3[1][0], A3[2][0], 0, A3[0][1], A3[1][1], A3[2][1], 0, A3[0][2], A3[1][2], A3[2][2], 0, 0, 0, 0, 1); S.aggiungi(pl);
      S.aggiungi(lab.assi(T, 3.4, ['x', 'y', 'z'], 0.28));
      S.ogniFotogramma(function (dt) {
        var obiettivo = st.proietta ? 1 : 0; if (Math.abs(frazione - obiettivo) < 1e-3) return false;
        frazione += Math.sign(obiettivo - frazione) * Math.min(Math.abs(obiettivo - frazione), dt * 0.8);
        var u = morbido(frazione); for (var i = 0; i < pos.length; i++) pos[i] = orig[i] + (proiez[i] - orig[i]) * u; punti.geometry.attributes.position.needsUpdate = true;
      });
      /* confronto con la covarianza e con gli assi veri */
      var cosMax = C.assi.map(function (a, i) { return Math.abs(a[0] * E.vettori[i][0] + a[1] * E.vettori[i][1] + a[2] * E.vettori[i][2]); }), veri = [0, 1, 2].map(function (k) { return [Rm[0][k], Rm[1][k], Rm[2][k]]; });
      var ang = C.assi.map(function (a, i) { return Math.acos(Math.min(1, Math.abs(a[0] * veri[i][0] + a[1] * veri[i][1] + a[2] * veri[i][2]))) * 180 / PI; });
      info.innerHTML = t('Varianza spiegata: ', 'Explained variance: ') + C.spiegata.map(function (v, i) { return 'PC' + (i + 1) + ' <b>' + (100 * v).toFixed(2) + ' %</b>'; }).join(', ') + '<br>' +
        t('Deviazioni (SVD): ', 'Deviations (SVD): ') + C.dev.map(function (v) { return v.toFixed(4); }).join(', ') + ' · ' + t('dalla covarianza: ', 'from the covariance: ') + E.valori.map(function (v) { return Math.sqrt(v).toFixed(4); }).join(', ') + '<br>' +
        t('|cos| fra assi SVD e autovettori di C: ', '|cos| between SVD axes and eigenvectors of C: ') + cosMax.map(function (v) { return v.toFixed(8); }).join(', ') + '<br>' + t('Angolo fra gli assi stimati e quelli veri: ', 'Angle between estimated and true axes: ') + ang.map(function (v) { return v.toFixed(2) + '°'; }).join(', ') + t(' (si riduce come 1/√n)', ' (shrinks like 1/√n)');
      var tot = st.s1 * st.s1 + st.s2 * st.s2 + st.s3 * st.s3;
      F.grafico(cs, { barre: C.spiegata.map(function (v, i) { return { x: i + 1 - 0.1, y: v, col: COL_ASSI[i], larg: 18 }; }), punti: [st.s1, st.s2, st.s3].sort(function (a, b) { return b - a; }).map(function (s, i) { return { x: i + 1 + 0.15, y: s * s / tot, col: '#ffffff', r: 5 }; }), xmin: 0.4, xmax: 3.6, ymin: 0, ymax: 1, xl: ['componente principale', 'principal component'], yl: ['varianza spiegata', 'explained variance'], legenda: [{ col: '#5eead4', etich: ['dai dati (SVD)', 'from the data (SVD)'] }, { col: '#ffffff', etich: ['dalla distribuzione vera', 'from the true distribution'] }], descr: ['Varianza spiegata dalle componenti principali', 'Variance explained by the principal components'] });
      S.didascalia.textContent = t('Nuvola di ', 'Cloud of ') + st.n + t(' punti con gli assi principali (PCA)', ' points with the principal axes (PCA)');
      if (!S.vistaIniziale) S.inquadra(9.5, -0.7, 1.15);
      S.avvia();
    }
    calcola();
  }

  /* ═══ 5. minimi quadrati e Hilbert ══════════════════════════════════════ */
  function schedaMinimi(div) {
    var G = grigliaUI(div), pan = G.pan, st = { g: 8 };
    F.cursore(pan, ['grado del polinomio', 'polynomial degree'], 1, 14, 1, st.g, function (v) { st.g = v; adatta(); });
    var info = nota(pan);
    nota(pan, t('Minimi quadrati: si cerca x che rende minimo ‖Ax − b‖. Le equazioni normali AᵀAx = Aᵀb sono comode ma elevano al quadrato il condizionamento, κ(AᵀA) = κ(A)²: si perdono il doppio delle cifre. La fattorizzazione QR di Householder (A = QR, poi Rx = Qᵀb) lavora con κ(A). Qui i dati vengono esattamente dal polinomio 1 + x + x² + … (40 punti in [0, 1], base dei monomi, sempre più mal condizionata al crescere del grado): l’errore sui coefficienti cresce come ε·κ per QR e come ε·κ² per le equazioni normali, che oltre il grado 11 non hanno più cifre giuste (o Cholesky fallisce). La matrice di Hilbert H_ij = 1/(i + j − 1), la Gram dei monomi su [0, 1], è il caso estremo: κ₂(H₅) ≈ 4,77·10⁵, κ₂(H₁₂) ≈ 10¹⁶.',
      'Least squares: find x minimising ‖Ax − b‖. The normal equations AᵀAx = Aᵀb are convenient but square the conditioning, κ(AᵀA) = κ(A)²: twice as many digits are lost. Householder QR (A = QR, then Rx = Qᵀb) works with κ(A). Here the data come exactly from the polynomial 1 + x + x² + … (40 points in [0, 1], monomial basis, ever more ill-conditioned as the degree grows): the coefficient error grows like ε·κ for QR and like ε·κ² for the normal equations, which beyond degree 11 have no correct digits left (or Cholesky fails). The Hilbert matrix H_ij = 1/(i + j − 1), the Gram matrix of monomials on [0, 1], is the extreme case: κ₂(H₅) ≈ 4.77·10⁵, κ₂(H₁₂) ≈ 10¹⁶.'));
    var cf = F.tela(G.dx, 0.5), ce = F.tela(G.dx, 0.45), ch = F.tela(G.dx, 0.42);
    var xs = [], ys = [], rnd = mulberry32(12); for (var i = 0; i < 40; i++) { var x = i / 39; xs.push(x); ys.push(Math.sin(2 * PI * x) + 0.5 * x + 0.06 * gauss(rnd)); }
    var curve = null;
    function errori() {
      /* da calcolare una volta: errori sui coefficienti per i gradi 1..14 e κ */
      var Gs = [], eq = [], en = [], kap = [];
      for (var g = 1; g <= 14; g++) {
        var A = vandermonde(xs, g), c = []; for (var k = 0; k <= g; k++) c.push(1);
        var b = A.map(function (r) { return r.reduce(function (s, v) { return s + v; }, 0); }), x1 = minimiQuadratiQR(A, b), x2 = minimiQuadratiNormali(A, b);
        var e1 = Math.sqrt(x1.reduce(function (s, v, k) { return s + (v - 1) * (v - 1); }, 0) / (g + 1)), e2 = x2 ? Math.sqrt(x2.reduce(function (s, v, k) { return s + (v - 1) * (v - 1); }, 0) / (g + 1)) : NaN;
        Gs.push(g); eq.push(Math.log10(Math.max(e1, 1e-17))); en.push(isFinite(e2) ? Math.log10(Math.max(e2, 1e-17)) : NaN); kap.push(numeroCondizione(A)); void c;
      }
      return { G: Gs, eq: eq, en: en, kap: kap };
    }
    function hilb() { var N = [], K = [], E = []; for (var n = 2; n <= 12; n++) { var H = hilbert(n), k = numeroCondizione(H); N.push(n); K.push(Math.log10(k)); var b = H.map(function (r) { return r.reduce(function (s, v) { return s + v; }, 0); }), x = minimiQuadratiQR(H, b); E.push(Math.log10(Math.max(1e-17, Math.max.apply(null, x.map(function (v) { return Math.abs(v - 1); }))))); } return { N: N, K: K, E: E }; }
    var Er = null, Hi = null;
    function adatta() {
      var A = vandermonde(xs, st.g), cq = minimiQuadratiQR(A, ys), cn = minimiQuadratiNormali(A, ys), X = [], Yq = [], Yn = [];
      for (var k = 0; k <= 200; k++) { var x = k / 200, p = 1, sq = 0, sn = 0; for (var j = 0; j <= st.g; j++) { sq += cq[j] * p; if (cn) sn += cn[j] * p; p *= x; } X.push(x); Yq.push(sq); Yn.push(cn ? sn : NaN); }
      var res = function (c) { if (!c) return NaN; var s = 0; A.forEach(function (r, i) { var v = r.reduce(function (a, b, j) { return a + b * c[j]; }, 0) - ys[i]; s += v * v; }); return Math.sqrt(s); };
      F.grafico(cf, { serie: [{ x: X, y: Yq, col: '#5eead4', larg: 2.5, etich: ['QR', 'QR'] }, { x: X, y: Yn, col: '#ff8a80', tratt: true, etich: [t('eq. normali', 'normal eq.'), t('eq. normali', 'normal eq.')] }], punti: xs.map(function (x, i) { return { x: x, y: ys[i], col: '#ffd24a', r: 3 }; }), ymin: -1.6, ymax: 2, xl: ['x', 'x'], yl: ['y', 'y'], legenda: [{ col: '#ffd24a', etich: ['dati', 'data'] }, { col: '#5eead4', etich: ['QR (Householder)', 'QR (Householder)'] }, { col: '#ff8a80', etich: ['equazioni normali (Cholesky)', 'normal equations (Cholesky)'] }], descr: ['Polinomio dei minimi quadrati di grado ', 'Least-squares polynomial of degree '].map(function (s) { return s + st.g; }) });
      if (!Er) Er = errori(); if (!Hi) Hi = hilb();
      var eps = Math.log10(2.22e-16);
      F.grafico(ce, { serie: [{ x: Er.G, y: Er.eq, col: '#5eead4', etich: ['QR', 'QR'] }, { x: Er.G, y: Er.en, col: '#ff8a80', etich: [t('normali', 'normal'), t('normali', 'normal')] }, { x: Er.G, y: Er.kap.map(function (k) { return Math.min(2, eps + Math.log10(k)); }), col: '#5eead4', tratt: true, larg: 1, etich: ['ε κ', 'ε κ'] }, { x: Er.G, y: Er.kap.map(function (k) { return Math.min(2, eps + 2 * Math.log10(k)); }), col: '#ff8a80', tratt: true, larg: 1, etich: ['ε κ²', 'ε κ²'] }], punti: [{ x: st.g, y: Er.eq[st.g - 1], col: '#ffffff', r: 5 }], ymin: -17, ymax: 2, xl: ['grado', 'degree'], yl: ['log₁₀ errore sui coefficienti', 'log₁₀ coefficient error'], legenda: [{ col: '#5eead4', etich: ['QR · tratteggio ε κ(A)', 'QR · dashed ε κ(A)'] }, { col: '#ff8a80', etich: ['equazioni normali · tratteggio ε κ(A)²', 'normal equations · dashed ε κ(A)²'] }], descr: ['Errore sui coefficienti: QR contro equazioni normali', 'Coefficient error: QR against normal equations'] });
      F.grafico(ch, { serie: [{ x: Hi.N, y: Hi.K, col: '#ffd24a', etich: ['log₁₀ κ₂(H_n)', 'log₁₀ κ₂(H_n)'] }, { x: Hi.N, y: Hi.E.map(function (e) { return e + 16; }), col: '#c9a0ff', etich: [t('errore + 16', 'error + 16'), t('errore + 16', 'error + 16')] }], punti: [{ x: 5, y: Math.log10(476607.25), col: '#ffffff', r: 5 }], linee: [{ y: 16, col: '#ff8a80', etich: '1/ε ≈ 10¹⁶' }], xl: ['n', 'n'], yl: ['log₁₀', 'log₁₀'], legenda: [{ col: '#ffd24a', etich: ['κ₂(H_n) = σ_max/σ_min (SVD)', 'κ₂(H_n) = σ_max/σ_min (SVD)'] }, { col: '#c9a0ff', etich: ['log₁₀ max|x − 1| + 16 per H x = H·1', 'log₁₀ max|x − 1| + 16 for H x = H·1'] }], descr: ['Numero di condizionamento delle matrici di Hilbert', 'Condition number of Hilbert matrices'] });
      var k5 = numeroCondizione(hilbert(5));
      info.innerHTML = t('Grado ', 'Degree ') + st.g + ': κ(A) = <b>' + Er.kap[st.g - 1].toExponential(2) + '</b>, κ(AᵀA) = κ² = ' + Math.pow(Er.kap[st.g - 1], 2).toExponential(2) + '<br>' + t('Residuo ‖Ax − b‖: QR ', 'Residual ‖Ax − b‖: QR ') + res(cq).toFixed(6) + ', ' + t('normali ', 'normal ') + (cn ? res(cn).toFixed(6) : t('Cholesky fallisce (AᵀA non è più definita positiva in virgola mobile)', 'Cholesky fails (AᵀA is no longer positive definite in floating point)')) + '<br>' +
        'κ₂(H₅) = <b>' + k5.toFixed(2) + '</b> (' + t('valore noto ', 'known value ') + '476607,25) · ' + t('con l’inversa esatta a interi: ', 'with the exact integer inverse: ') + '‖H₅‖₂‖H₅⁻¹‖₂ = ' + (norma2Potenze(hilbert(5)) * norma2Potenze(hilbertInversa(5))).toFixed(2);
    }
    adatta();
  }

  F.sezione('smatsvd', {
    titolo: ['🧩 SVD e algebra lineare applicata', '🧩 SVD and applied linear algebra'],
    sotto: ['La decomposizione ai valori singolari calcolata da zero (Jacobi a un lato) e vista come rotazione–scala–rotazione in 2D e in 3D, poi al lavoro: compressione di un’immagine, PCA di una nuvola di punti in 3D, minimi quadrati e condizionamento.', 'The singular value decomposition computed from scratch (one-sided Jacobi) and seen as rotation–scaling–rotation in 2D and 3D, then put to work: image compression, PCA of a 3D point cloud, least squares and conditioning.'],
    schede: [
      { nome: ['⭕ SVD 2×2', '⭕ SVD 2×2'], costruisci: schedaDue },
      { nome: ['🥚 SVD 3×3 in 3D', '🥚 SVD 3×3 in 3D'], costruisci: scheda3d(schedaTre) },
      { nome: ['🖼️ Compressione', '🖼️ Compression'], costruisci: schedaImmagine },
      { nome: ['☁️ PCA 3D', '☁️ PCA 3D'], costruisci: scheda3d(schedaPCA) },
      { nome: ['📏 Minimi quadrati', '📏 Least squares'], costruisci: schedaMinimi }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
