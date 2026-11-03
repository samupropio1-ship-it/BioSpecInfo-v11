/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-hartreefock.js — Hartree-Fock in diretta
   BioSpecInfo · © Samuele Pio Provenzano

   Un calcolo AB INITIO vero, nel browser: Hartree-Fock ristretto (RHF) con
   la base minima STO-3G, per molecole fino al fluoro.

   COME

   · Gli integrali (sovrapposizione, energia cinetica, attrazione nucleare,
     repulsione fra elettroni) fra gaussiane cartesiane di tipo s e p con lo
     schema di MCMURCHIE-DAVIDSON: ogni prodotto di due gaussiane si sviluppa
     in gaussiane di Hermite (coefficienti E), e gli integrali coulombiani si
     riducono agli integrali di Hermite R costruiti dalla FUNZIONE DI BOYS
     Fₙ(T) (serie per T < 30, asintotica oltre).
   · La base STO-3G: tre gaussiane per orbitale di Slater, con gli esponenti e
     i coefficienti di Hehre, Stewart e Pople (1969), come li pubblica la
     Basis Set Exchange.
   · Il campo autoconsistente: ortogonalizzazione simmetrica S^-1/2 (Jacobi),
     punto di partenza l'hamiltoniano del nucleo, matrice di Fock
     F = H + Σ P (2J − K)/2, densita' dagli orbitali occupati, convergenza
     sull'energia (10⁻¹⁰ Eh) e sulla densita' (10⁻⁸); DIIS per accelerare.
   · La verifica: H₂ a 1,4 bohr (−1,116714 Eh, Szabo-Ostlund), HeH⁺ a
     1,4632 bohr con l'elio di Szabo-Ostlund (ζ = 2,0925: −2,860662 Eh),
     H₂O alla geometria del progetto di
     programmazione di Crawford (−74,942079928 Eh): il banco li riproduce.
   · Gli orbitali in 3D (v238): ψ su una griglia cubica (le gaussiane si
     separano asse per asse, quindi la griglia costa poco), l'isosuperficie
     con i tetraedri in marcia per +c e −c (due colori: il segno), c scelto
     perche' racchiuda una frazione data di |ψ|², i lobi contati come
     componenti connesse della superficie.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;

  /* ── la base STO-3G ───────────────────────────────────────────────────── */
  var C1S = [0.15432897, 0.53532814, 0.44463454], C2S = [-0.09996723, 0.39951283, 0.70011547], C2P = [0.15591627, 0.60768372, 0.39195739];
  var STO3G = {
    1: { s1: [3.42525091, 0.62391373, 0.16885540] },
    2: { s1: [6.36242139, 1.15892300, 0.31364979] },
    3: { s1: [16.1195750, 2.9362007, 0.7946505], sp: [0.6362897, 0.1478601, 0.0480887] },
    4: { s1: [30.1678710, 5.4951153, 1.4871927], sp: [1.3148331, 0.3055389, 0.0993707] },
    5: { s1: [48.7911130, 8.8873622, 2.4052670], sp: [2.2369561, 0.5198205, 0.1690618] },
    6: { s1: [71.6168370, 13.0450960, 3.5305122], sp: [2.9412494, 0.6834831, 0.2222899] },
    7: { s1: [99.1061690, 18.0523120, 4.8856602], sp: [3.7804559, 0.8784966, 0.2857144] },
    8: { s1: [130.7093200, 23.8088610, 6.4436083], sp: [5.0331513, 1.1695961, 0.3803890] },
    9: { s1: [166.6791300, 30.3608120, 8.2168207], sp: [6.4648032, 1.5022812, 0.4885885] }
  };
  var SIMBOLI = { 1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F' };

  function fattDoppio(n) { var r = 1; for (var k = n; k > 1; k -= 2) r *= k; return r; }
  function normPrim(a, l, m, n) {
    return Math.pow(2 * a / Math.PI, 0.75) * Math.pow(4 * a, (l + m + n) / 2) /
           Math.sqrt(fattDoppio(2 * l - 1) * fattDoppio(2 * m - 1) * fattDoppio(2 * n - 1));
  }
  /* una funzione contratta: centro, (l,m,n), esponenti, coefficienti normalizzati */
  function contratta(centro, lmn, esp, coef) {
    var f = { A: centro, lmn: lmn, a: esp.slice(), c: coef.map(function (c, i) { return c * normPrim(esp[i], lmn[0], lmn[1], lmn[2]); }) };
    var s = sovrapposizione(f, f);
    f.c = f.c.map(function (c) { return c / Math.sqrt(s); });
    return f;
  }
  function base(atomi) {
    var B = [];
    atomi.forEach(function (at, ia) {
      var b = STO3G[at.Z];
      B.push(Object.assign(contratta(at.r, [0, 0, 0], at.esp || b.s1, C1S), { atomo: ia, nome: SIMBOLI[at.Z] + ' 1s' }));
      if (b.sp) {
        B.push(Object.assign(contratta(at.r, [0, 0, 0], b.sp, C2S), { atomo: ia, nome: SIMBOLI[at.Z] + ' 2s' }));
        [[1, 0, 0, 'x'], [0, 1, 0, 'y'], [0, 0, 1, 'z']].forEach(function (p) {
          B.push(Object.assign(contratta(at.r, [p[0], p[1], p[2]], b.sp, C2P), { atomo: ia, nome: SIMBOLI[at.Z] + ' 2p' + p[3] }));
        });
      }
    });
    return B;
  }

  /* ── McMurchie-Davidson ───────────────────────────────────────────────── */
  /* coefficienti di Hermite E_t^{ij} per la coordinata con separazione Qx */
  function E(i, j, tt, Qx, a, b) {
    var p = a + b, q = a * b / p;
    if (tt < 0 || tt > i + j) return 0;
    if (i === 0 && j === 0 && tt === 0) return Math.exp(-q * Qx * Qx);
    if (j === 0) return (1 / (2 * p)) * E(i - 1, j, tt - 1, Qx, a, b) - (q * Qx / a) * E(i - 1, j, tt, Qx, a, b) + (tt + 1) * E(i - 1, j, tt + 1, Qx, a, b);
    return (1 / (2 * p)) * E(i, j - 1, tt - 1, Qx, a, b) + (q * Qx / b) * E(i, j - 1, tt, Qx, a, b) + (tt + 1) * E(i, j - 1, tt + 1, Qx, a, b);
  }
  /* la funzione di Boys */
  function boys(n, T) {
    if (T < 1e-12) return 1 / (2 * n + 1);
    if (T > 35) return fattDoppio(2 * n - 1) / Math.pow(2, n + 1) * Math.sqrt(Math.PI / Math.pow(T, 2 * n + 1));
    var termine = 1 / (2 * n + 1), somma = termine;
    for (var k = 1; k < 300; k++) { termine *= 2 * T / (2 * n + 2 * k + 1); somma += termine; if (termine < 1e-17 * somma) break; }
    return Math.exp(-T) * somma;
  }
  /* integrali di Hermite R^n_{tuv} */
  function R(tt, u, v, n, p, PCx, PCy, PCz, RPC) {
    if (tt < 0 || u < 0 || v < 0) return 0;
    if (tt === 0 && u === 0 && v === 0) return Math.pow(-2 * p, n) * boys(n, p * RPC * RPC);
    if (tt === 0 && u === 0) return (v > 1 ? (v - 1) * R(tt, u, v - 2, n + 1, p, PCx, PCy, PCz, RPC) : 0) + PCz * R(tt, u, v - 1, n + 1, p, PCx, PCy, PCz, RPC);
    if (tt === 0) return (u > 1 ? (u - 1) * R(tt, u - 2, v, n + 1, p, PCx, PCy, PCz, RPC) : 0) + PCy * R(tt, u - 1, v, n + 1, p, PCx, PCy, PCz, RPC);
    return (tt > 1 ? (tt - 1) * R(tt - 2, u, v, n + 1, p, PCx, PCy, PCz, RPC) : 0) + PCx * R(tt - 1, u, v, n + 1, p, PCx, PCy, PCz, RPC);
  }
  function primS(a, l1, A, b, l2, B) {
    return E(l1[0], l2[0], 0, A[0] - B[0], a, b) * E(l1[1], l2[1], 0, A[1] - B[1], a, b) * E(l1[2], l2[2], 0, A[2] - B[2], a, b) * Math.pow(Math.PI / (a + b), 1.5);
  }
  function primT(a, l1, A, b, l2, B) {
    var l = l2[0], m = l2[1], n = l2[2];
    var t0 = b * (2 * (l + m + n) + 3) * primS(a, l1, A, b, l2, B);
    var t1 = -2 * b * b * (primS(a, l1, A, b, [l + 2, m, n], B) + primS(a, l1, A, b, [l, m + 2, n], B) + primS(a, l1, A, b, [l, m, n + 2], B));
    var t2 = -0.5 * (l * (l - 1) * (l >= 2 ? primS(a, l1, A, b, [l - 2, m, n], B) : 0) + m * (m - 1) * (m >= 2 ? primS(a, l1, A, b, [l, m - 2, n], B) : 0) + n * (n - 1) * (n >= 2 ? primS(a, l1, A, b, [l, m, n - 2], B) : 0));
    return t0 + t1 + t2;
  }
  function primV(a, l1, A, b, l2, B, C) {
    var p = a + b, P = [(a * A[0] + b * B[0]) / p, (a * A[1] + b * B[1]) / p, (a * A[2] + b * B[2]) / p];
    var RPC = Math.hypot(P[0] - C[0], P[1] - C[1], P[2] - C[2]), s = 0;
    for (var tt = 0; tt <= l1[0] + l2[0]; tt++) for (var u = 0; u <= l1[1] + l2[1]; u++) for (var v = 0; v <= l1[2] + l2[2]; v++)
      s += E(l1[0], l2[0], tt, A[0] - B[0], a, b) * E(l1[1], l2[1], u, A[1] - B[1], a, b) * E(l1[2], l2[2], v, A[2] - B[2], a, b) *
           R(tt, u, v, 0, p, P[0] - C[0], P[1] - C[1], P[2] - C[2], RPC);
    return 2 * Math.PI / p * s;
  }
  function primERI(a, la, A, b, lb, B, c, lc, C, d, ld, D) {
    var p = a + b, q = c + d, al = p * q / (p + q);
    var P = [(a * A[0] + b * B[0]) / p, (a * A[1] + b * B[1]) / p, (a * A[2] + b * B[2]) / p];
    var Q = [(c * C[0] + d * D[0]) / q, (c * C[1] + d * D[1]) / q, (c * C[2] + d * D[2]) / q];
    var RPQ = Math.hypot(P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]), s = 0;
    for (var t1 = 0; t1 <= la[0] + lb[0]; t1++) for (var u1 = 0; u1 <= la[1] + lb[1]; u1++) for (var v1 = 0; v1 <= la[2] + lb[2]; v1++) {
      var e1 = E(la[0], lb[0], t1, A[0] - B[0], a, b) * E(la[1], lb[1], u1, A[1] - B[1], a, b) * E(la[2], lb[2], v1, A[2] - B[2], a, b);
      if (e1 === 0) continue;
      for (var t2 = 0; t2 <= lc[0] + ld[0]; t2++) for (var u2 = 0; u2 <= lc[1] + ld[1]; u2++) for (var v2 = 0; v2 <= lc[2] + ld[2]; v2++) {
        var e2 = E(lc[0], ld[0], t2, C[0] - D[0], c, d) * E(lc[1], ld[1], u2, C[1] - D[1], c, d) * E(lc[2], ld[2], v2, C[2] - D[2], c, d);
        if (e2 === 0) continue;
        s += e1 * e2 * ((t2 + u2 + v2) % 2 ? -1 : 1) * R(t1 + t2, u1 + u2, v1 + v2, 0, al, P[0] - Q[0], P[1] - Q[1], P[2] - Q[2], RPQ);
      }
    }
    return 2 * Math.pow(Math.PI, 2.5) / (p * q * Math.sqrt(p + q)) * s;
  }
  function sovrapposizione(f, g) {
    var s = 0;
    for (var i = 0; i < f.a.length; i++) for (var j = 0; j < g.a.length; j++) s += f.c[i] * g.c[j] * primS(f.a[i], f.lmn, f.A, g.a[j], g.lmn, g.A);
    return s;
  }
  function cinetica(f, g) {
    var s = 0;
    for (var i = 0; i < f.a.length; i++) for (var j = 0; j < g.a.length; j++) s += f.c[i] * g.c[j] * primT(f.a[i], f.lmn, f.A, g.a[j], g.lmn, g.A);
    return s;
  }
  function nucleare(f, g, atomi) {
    var s = 0;
    for (var i = 0; i < f.a.length; i++) for (var j = 0; j < g.a.length; j++)
      for (var k = 0; k < atomi.length; k++) s -= atomi[k].Z * f.c[i] * g.c[j] * primV(f.a[i], f.lmn, f.A, g.a[j], g.lmn, g.A, atomi[k].r);
    return s;
  }
  function eri(f, g, h, w) {
    var s = 0;
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) for (var l = 0; l < 3; l++)
      s += f.c[i] * g.c[j] * h.c[k] * w.c[l] * primERI(f.a[i], f.lmn, f.A, g.a[j], g.lmn, g.A, h.a[k], h.lmn, h.A, w.a[l], w.lmn, w.A);
    return s;
  }

  /* ── algebra lineare: Jacobi per matrici simmetriche ───────────────────── */
  function jacobi(M) {
    var n = M.length, A = M.map(function (r) { return r.slice(); }), V = [];
    for (var i = 0; i < n; i++) { V.push(new Array(n).fill(0)); V[i][i] = 1; }
    for (var sw = 0; sw < 100; sw++) {
      var off = 0;
      for (var p = 0; p < n; p++) for (var q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
      if (off < 1e-26) break;
      for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        var th = (A[q][q] - A[p][p]) / (2 * A[p][q]), tg = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        var c = 1 / Math.sqrt(tg * tg + 1), s = tg * c;
        for (var k = 0; k < n; k++) { var akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (k = 0; k < n; k++) { var apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (k = 0; k < n; k++) { var vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    var val = A.map(function (r, i) { return r[i]; }), ord = val.map(function (v, i) { return i; }).sort(function (x, y) { return val[x] - val[y]; });
    return { val: ord.map(function (i) { return val[i]; }), vec: V.map(function (r) { return ord.map(function (i) { return r[i]; }); }) };
  }
  function mul(A, B) {
    var n = A.length, m = B[0].length, k = B.length, C = [];
    for (var i = 0; i < n; i++) { C.push(new Array(m).fill(0)); for (var j = 0; j < m; j++) { var s = 0; for (var l = 0; l < k; l++) s += A[i][l] * B[l][j]; C[i][j] = s; } }
    return C;
  }
  function trasp(A) { return A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); }); }

  /* ── il campo autoconsistente ─────────────────────────────────────────── */
  function scf(atomi, carica, opz) {
    opz = opz || {};
    var B = base(atomi), n = B.length, nel = atomi.reduce(function (s, a) { return s + a.Z; }, 0) - (carica || 0);
    if (nel % 2) throw new Error(t('serve un numero pari di elettroni (RHF a guscio chiuso)', 'an even number of electrons is needed (closed-shell RHF)'));
    var nocc = nel / 2, S = [], H = [], i, j, k, l;
    for (i = 0; i < n; i++) { S.push([]); H.push([]); for (j = 0; j < n; j++) { S[i][j] = sovrapposizione(B[i], B[j]); H[i][j] = cinetica(B[i], B[j]) + nucleare(B[i], B[j], atomi); } }
    /* gli integrali a due elettroni, con le otto simmetrie */
    var idx = function (a, b) { return a > b ? a * (a + 1) / 2 + b : b * (b + 1) / 2 + a; };
    var G = {};
    for (i = 0; i < n; i++) for (j = 0; j <= i; j++) for (k = 0; k < n; k++) for (l = 0; l <= k; l++) {
      var ij = idx(i, j), kl = idx(k, l); if (ij < kl) continue;
      G[ij * 100000 + kl] = eri(B[i], B[j], B[k], B[l]);
    }
    var gi = function (a, b, c, d) { var x = idx(a, b), y = idx(c, d); return x >= y ? G[x * 100000 + y] : G[y * 100000 + x]; };
    var Enuc = 0;
    for (i = 0; i < atomi.length; i++) for (j = 0; j < i; j++) Enuc += atomi[i].Z * atomi[j].Z / Math.hypot(atomi[i].r[0] - atomi[j].r[0], atomi[i].r[1] - atomi[j].r[1], atomi[i].r[2] - atomi[j].r[2]);
    var es = jacobi(S), X = [];
    for (i = 0; i < n; i++) { X.push([]); for (j = 0; j < n; j++) { var s = 0; for (k = 0; k < n; k++) s += es.vec[i][k] * es.vec[j][k] / Math.sqrt(es.val[k]); X[i][j] = s; } }
    var P = []; for (i = 0; i < n; i++) P.push(new Array(n).fill(0));
    var storia = [], Eel = 0, Eprec = 0, C = null, eps = null, Fm = null, diisF = [], diisE = [];
    for (var it = 0; it < 120; it++) {
      Fm = [];
      for (i = 0; i < n; i++) { Fm.push([]); for (j = 0; j < n; j++) {
        var g = 0;
        for (k = 0; k < n; k++) for (l = 0; l < n; l++) g += P[k][l] * (gi(i, j, k, l) - 0.5 * gi(i, k, j, l));
        Fm[i][j] = H[i][j] + g;
      } }
      Eel = 0; for (i = 0; i < n; i++) for (j = 0; j < n; j++) Eel += 0.5 * P[i][j] * (H[i][j] + Fm[i][j]);
      storia.push(Eel + Enuc);
      /* DIIS: l'errore e' FPS − SPF */
      var FPS = mul(mul(Fm, P), S), SPF = mul(mul(S, P), Fm), err = FPS.map(function (r, a) { return r.map(function (v, b) { return v - SPF[a][b]; }); });
      var errMax = 0; err.forEach(function (r) { r.forEach(function (v) { errMax = Math.max(errMax, Math.abs(v)); }); });
      if (it > 0 && Math.abs(Eel - Eprec) < 1e-11 && errMax < 1e-7) break;
      Eprec = Eel;
      var Fuso = Fm;
      if (it > 0) {
        diisF.push(Fm); diisE.push(err); if (diisF.length > 6) { diisF.shift(); diisE.shift(); }
        if (diisF.length >= 2) {
          var m = diisF.length, Bm = [];
          for (var a = 0; a <= m; a++) { Bm.push(new Array(m + 1).fill(a === m ? -1 : 0)); }
          for (a = 0; a < m; a++) { for (var b = 0; b < m; b++) { var d = 0; for (var x = 0; x < n; x++) for (var y = 0; y < n; y++) d += diisE[a][x][y] * diisE[b][x][y]; Bm[a][b] = d; } Bm[a][m] = -1; }
          Bm[m][m] = 0;
          var rhs = new Array(m + 1).fill(0); rhs[m] = -1;
          var cc = risolviLineare(Bm, rhs);
          if (cc) { Fuso = []; for (x = 0; x < n; x++) { Fuso.push(new Array(n).fill(0)); for (y = 0; y < n; y++) for (a = 0; a < m; a++) Fuso[x][y] += cc[a] * diisF[a][x][y]; } }
        }
      }
      var Fp = mul(trasp(X), mul(Fuso, X)), ef = jacobi(Fp);
      C = mul(X, ef.vec); eps = ef.val;
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) { var sp = 0; for (k = 0; k < nocc; k++) sp += 2 * C[i][k] * C[j][k]; P[i][j] = sp; }
    }
    /* gli autovalori della Fock convergita */
    var efin = jacobi(mul(trasp(X), mul(Fm, X))); C = mul(X, efin.vec); eps = efin.val;
    /* le cariche di Mulliken */
    var PS = mul(P, S), q = atomi.map(function (at) { return at.Z; });
    for (i = 0; i < n; i++) q[B[i].atomo] -= PS[i][i];
    return { E: Eel + Enuc, Eel: Eel, Enuc: Enuc, eps: eps, C: C, P: P, S: S, base: B, nocc: nocc, storia: storia, iterazioni: storia.length, mulliken: q, atomi: atomi };
  }
  function risolviLineare(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-14) return null;
      var tmp = M[c]; M[c] = M[p]; M[p] = tmp;
      for (r = 0; r < n; r++) if (r !== c) { var f = M[r][c] / M[c][c]; for (var k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map(function (r, i) { return r[n] / r[i]; });
  }
  /* il valore di un orbitale molecolare in un punto */
  function valoreMO(ris, k, x, y, z) {
    var s = 0;
    ris.base.forEach(function (f, i) {
      var dx = x - f.A[0], dy = y - f.A[1], dz = z - f.A[2], r2 = dx * dx + dy * dy + dz * dz;
      var ang = Math.pow(dx, f.lmn[0]) * Math.pow(dy, f.lmn[1]) * Math.pow(dz, f.lmn[2]), v = 0;
      for (var p = 0; p < 3; p++) v += f.c[p] * Math.exp(-f.a[p] * r2);
      s += ris.C[i][k] * ang * v;
    });
    return s;
  }

  /* ── le molecole (bohr) ───────────────────────────────────────────────── */
  var MOL = {
    H2:   { nome: 'H₂', carica: 0, atomi: function (R) { return [{ Z: 1, r: [0, 0, 0] }, { Z: 1, r: [0, 0, R] }]; }, R: 1.4, scan: [0.6, 5], rif: -1.116714 },
    HeH:  { nome: 'HeH⁺', carica: 1, atomi: function (R) { return [{ Z: 2, r: [0, 0, 0] }, { Z: 1, r: [0, 0, R] }]; }, R: 1.4632, scan: [0.8, 5] },
    /* come nel libro di Szabo e Ostlund (§3.5.3): l'elio con ζ = 2,0925 invece dell'1,69 della STO-3G standard */
    HeHs: { nome: 'HeH⁺ (Szabo-Ostlund, ζHe = 2,0925)', carica: 1, atomi: function (R) { return [{ Z: 2, r: [0, 0, 0], esp: [9.753934616, 1.776691148, 0.4808442903] }, { Z: 1, r: [0, 0, R] }]; }, R: 1.4632, scan: [0.8, 5], rif: -2.860662 },
    LiH:  { nome: 'LiH', carica: 0, atomi: function (R) { return [{ Z: 3, r: [0, 0, 0] }, { Z: 1, r: [0, 0, R] }]; }, R: 3.015, scan: [2, 7] },
    H2O:  { nome: 'H₂O', carica: 0, atomi: function () { return [{ Z: 8, r: [0, -0.143225816552, 0] }, { Z: 1, r: [1.638036840407, 1.136548822547, 0] }, { Z: 1, r: [-1.638036840407, 1.136548822547, 0] }]; }, rif: -74.942079928192 },
    NH3:  { nome: 'NH₃', carica: 0, atomi: function () { return [{ Z: 7, r: [0, 0, 0.2163] }, { Z: 1, r: [1.7716, 0, -0.5047] }, { Z: 1, r: [-0.8858, 1.5342, -0.5047] }, { Z: 1, r: [-0.8858, -1.5342, -0.5047] }]; } },
    CH4:  { nome: 'CH₄', carica: 0, atomi: function () { var a = 1.1860; return [{ Z: 6, r: [0, 0, 0] }, { Z: 1, r: [a, a, a] }, { Z: 1, r: [a, -a, -a] }, { Z: 1, r: [-a, a, -a] }, { Z: 1, r: [-a, -a, a] }]; } },
    HF:   { nome: 'HF', carica: 0, atomi: function (R) { return [{ Z: 9, r: [0, 0, 0] }, { Z: 1, r: [0, 0, R] }]; }, R: 1.7328, scan: [1.2, 5] },
    N2:   { nome: 'N₂', carica: 0, atomi: function (R) { return [{ Z: 7, r: [0, 0, 0] }, { Z: 7, r: [0, 0, R] }]; }, R: 2.074, scan: [1.6, 4] }
  };

  /* ── v238: l'orbitale su una griglia e la sua isosuperficie ──────────────
     Una gaussiana cartesiana x^l y^m z^n e^(−a r²) e' il prodotto di tre
     funzioni di una variabile: sulla griglia si calcolano i fattori 1D una
     volta sola e il valore in ogni nodo e' una somma di prodotti. */
  function grigliaMO(ris, k, N, margine) {
    var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    ris.atomi.forEach(function (a) { for (var d = 0; d < 3; d++) { lo[d] = Math.min(lo[d], a.r[d]); hi[d] = Math.max(hi[d], a.r[d]); } });
    var L = 0; for (var d = 0; d < 3; d++) L = Math.max(L, hi[d] - lo[d]);
    L += 2 * (margine || 4.5); var h = L / N, n1 = N + 1, x0 = [0, 1, 2].map(function (q) { return (lo[q] + hi[q]) / 2 - L / 2; });
    var v = new Float32Array(n1 * n1 * n1), ax = [new Float64Array(n1), new Float64Array(n1), new Float64Array(n1)];
    ris.base.forEach(function (f, i) {
      var C = ris.C[i][k]; if (Math.abs(C) < 1e-12) return;
      for (var p = 0; p < f.a.length; p++) {
        for (var q = 0; q < 3; q++) for (var u = 0; u < n1; u++) { var dx = x0[q] + u * h - f.A[q]; ax[q][u] = Math.pow(dx, f.lmn[q]) * Math.exp(-f.a[p] * dx * dx); }
        var cc = C * f.c[p], X = ax[0], Y = ax[1], Z = ax[2];
        for (var a = 0; a < n1; a++) { var xa = cc * X[a]; if (Math.abs(xa) < 1e-14) continue; for (var b = 0; b < n1; b++) { var xy = xa * Y[b], base0 = (a * n1 + b) * n1; if (Math.abs(xy) < 1e-14) continue; for (var c = 0; c < n1; c++) v[base0 + c] += xy * Z[c]; } }
      }
    });
    return { n: N, h: h, x0: x0, v: v };
  }
  function normaGriglia(G) { var s = 0; for (var i = 0; i < G.v.length; i++) s += G.v[i] * G.v[i]; return s * G.h * G.h * G.h; }
  /* la soglia c tale che la regione |ψ| > c contenga la frazione data di ∫|ψ|² */
  function sogliaIso(G, frazione) {
    var a = Array.prototype.slice.call(G.v).map(Math.abs).sort(function (x, y) { return y - x; }), tot = 0, s = 0, i;
    for (i = 0; i < a.length; i++) tot += a[i] * a[i];
    for (i = 0; i < a.length; i++) { s += a[i] * a[i]; if (s >= frazione * tot) return a[i]; }
    return a[a.length - 1];
  }
  /* tetraedri in marcia: la superficie segno·ψ = c, triangoli orientati con la normale verso l'esterno (ψ che cala) */
  var TETRA = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]], VERT = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  function isosuperficie(G, c, segno) {
    var n = G.n, n1 = n + 1, v = G.v, sg = segno || 1, pos = [], idx = [], mappa = new Map();
    function lin(a, b, d) { return (a * n1 + b) * n1 + d; }
    function punto(ia, ib) {
      var key = ia < ib ? ia * 4e6 + ib : ib * 4e6 + ia, g = mappa.get(key); if (g !== undefined) return g;
      var va = sg * v[ia] - c, vb = sg * v[ib] - c, tt = va / (va - vb);
      var pa = [Math.floor(ia / (n1 * n1)), Math.floor(ia / n1) % n1, ia % n1], pb = [Math.floor(ib / (n1 * n1)), Math.floor(ib / n1) % n1, ib % n1];
      g = pos.length / 3; for (var q = 0; q < 3; q++) pos.push(G.x0[q] + G.h * (pa[q] + (pb[q] - pa[q]) * tt));
      mappa.set(key, g); return g;
    }
    function tri(i1, i2, i3, fuori, dentro) {
      var A = [pos[3 * i1], pos[3 * i1 + 1], pos[3 * i1 + 2]], B = [pos[3 * i2] - A[0], pos[3 * i2 + 1] - A[1], pos[3 * i2 + 2] - A[2]], C = [pos[3 * i3] - A[0], pos[3 * i3 + 1] - A[1], pos[3 * i3 + 2] - A[2]];
      var nr = [B[1] * C[2] - B[2] * C[1], B[2] * C[0] - B[0] * C[2], B[0] * C[1] - B[1] * C[0]], d = [fuori[0] - dentro[0], fuori[1] - dentro[1], fuori[2] - dentro[2]];
      if (nr[0] * d[0] + nr[1] * d[1] + nr[2] * d[2] < 0) idx.push(i1, i3, i2); else idx.push(i1, i2, i3);
    }
    function centro(ids) { var s = [0, 0, 0]; ids.forEach(function (g) { s[0] += Math.floor(g / (n1 * n1)) / ids.length; s[1] += (Math.floor(g / n1) % n1) / ids.length; s[2] += (g % n1) / ids.length; }); return s; }
    for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) for (var d = 0; d < n; d++) {
      var g8 = VERT.map(function (o) { return lin(a + o[0], b + o[1], d + o[2]); }), dentroN = 0;
      for (var q = 0; q < 8; q++) if (sg * v[g8[q]] > c) dentroN++;
      if (dentroN === 0 || dentroN === 8) continue;
      TETRA.forEach(function (T4) {
        var g4 = T4.map(function (q2) { return g8[q2]; }), din = g4.filter(function (g) { return sg * v[g] > c; }), fu = g4.filter(function (g) { return sg * v[g] <= c; });
        if (din.length === 0 || din.length === 4) return;
        var cf = centro(fu), cd = centro(din);
        if (din.length === 1 || din.length === 3) {
          var solo = din.length === 1 ? din[0] : fu[0], altri = din.length === 1 ? fu : din;
          tri(punto(solo, altri[0]), punto(solo, altri[1]), punto(solo, altri[2]), cf, cd);
        } else {
          var p1 = punto(din[0], fu[0]), p2 = punto(din[0], fu[1]), p3 = punto(din[1], fu[1]), p4 = punto(din[1], fu[0]);
          tri(p1, p2, p3, cf, cd); tri(p1, p3, p4, cf, cd);
        }
      });
    }
    return { pos: new Float32Array(pos), idx: idx };
  }
  /* i lobi: componenti connesse della superficie; e la caratteristica di Eulero V − E + F */
  function lobi(M) {
    var nv = M.pos.length / 3, P = new Int32Array(nv); for (var i = 0; i < nv; i++) P[i] = i;
    function radice(x) { while (P[x] !== x) { P[x] = P[P[x]]; x = P[x]; } return x; }
    var spigoli = new Set();
    for (i = 0; i < M.idx.length; i += 3) {
      var a = M.idx[i], b = M.idx[i + 1], c = M.idx[i + 2];
      P[radice(a)] = radice(b); P[radice(b)] = radice(c);
      [[a, b], [b, c], [c, a]].forEach(function (e) { spigoli.add(Math.min(e[0], e[1]) * 4e6 + Math.max(e[0], e[1])); });
    }
    var r = new Set(); for (i = 0; i < nv; i++) r.add(radice(i));
    return { componenti: nv ? r.size : 0, eulero: nv - spigoli.size + M.idx.length / 3 };
  }
  F.calcolo.hartreefock = { scf: scf, base: base, boys: boys, MOL: MOL, valoreMO: valoreMO, jacobi: jacobi, grigliaMO: grigliaMO, normaGriglia: normaGriglia, sogliaIso: sogliaIso, isosuperficie: isosuperficie, lobi: lobi };

  /* ── l'interfaccia ────────────────────────────────────────────────────── */
  function schedaSCF(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var mol = 'H2O', ris = null, orb = 0;
    F.scelta(pan, ['Molecola', 'Molecule'], Object.keys(MOL).map(function (k) { return [k, MOL[k].nome]; }), mol, function (v) { mol = v; calcola(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.45), c2 = F.tela(destra, 0.75), tab = F.el('div'); destra.appendChild(tab);
    var selOrb = null;
    function calcola() {
      info.textContent = t('Calcolo in corso…', 'Computing…');
      setTimeout(function () {
        var t0 = performance.now(), M = MOL[mol];
        try { ris = scf(M.atomi(M.R), M.carica); } catch (e) { info.textContent = '⚠ ' + e.message; return; }
        var ms = performance.now() - t0;
        orb = ris.nocc - 1;
        info.innerHTML = '<b>' + M.nome + '</b> · STO-3G · ' + ris.base.length + t(' funzioni di base', ' basis functions') + '<br>' +
          t('Energia totale', 'Total energy') + ': <b class="bsiFX-num">' + ris.E.toFixed(8) + ' Eh</b><br>' +
          (M.rif ? t('Riferimento pubblicato', 'Published reference') + ': <span class="bsiFX-num">' + M.rif.toFixed(6) + '</span> (Δ ' + (ris.E - M.rif).toExponential(1) + ')<br>' : '') +
          t('Energia nucleare', 'Nuclear repulsion') + ': <span class="bsiFX-num">' + ris.Enuc.toFixed(6) + '</span><br>' +
          t('Iterazioni SCF', 'SCF iterations') + ': ' + ris.iterazioni + ' · ' + Math.round(ms) + ' ms<br><br>' +
          t('Cariche di Mulliken', 'Mulliken charges') + ': ' + ris.atomi.map(function (a, i) { return SIMBOLI[a.Z] + (i + 1) + ' ' + (ris.mulliken[i] >= 0 ? '+' : '') + ris.mulliken[i].toFixed(3); }).join(' · ');
        if (selOrb) selOrb.parentNode.parentNode.removeChild(selOrb.parentNode);
        selOrb = F.scelta(pan, ['Orbitale da disegnare', 'Orbital to draw'], ris.eps.map(function (e, k) { return [String(k), (k < ris.nocc ? '● ' : '○ ') + 'MO ' + (k + 1) + (k === ris.nocc - 1 ? ' HOMO' : k === ris.nocc ? ' LUMO' : '') + ' · ' + e.toFixed(3) + ' Eh']; }), String(orb), function (v) { orb = +v; mappa(); });
        disegna(); mappa();
      }, 20);
    }
    function disegna() {
      if (!ris) return;
      var xs = ris.storia.map(function (_, i) { return i + 1; });
      F.grafico(c, { serie: [{ x: xs, y: ris.storia.map(function (E) { return Math.log10(Math.max(1e-14, Math.abs(E - ris.E))); }), col: '#5eead4' }], xl: ['iterazione SCF', 'SCF iteration'], yl: ['log₁₀ |E − E_finale|', 'log₁₀ |E − E_final|'] });
      var h = '<table class="bsiFX-tab"><tr><th>MO</th><th>ε (Eh)</th><th>ε (eV)</th><th>' + t('occupazione', 'occupation') + '</th><th>' + t('contributo maggiore', 'largest contribution') + '</th></tr>';
      ris.eps.forEach(function (e, k) {
        var mx = 0, chi = 0; ris.base.forEach(function (f, i) { if (Math.abs(ris.C[i][k]) > mx) { mx = Math.abs(ris.C[i][k]); chi = i; } });
        h += '<tr><td>' + (k + 1) + (k === ris.nocc - 1 ? ' HOMO' : k === ris.nocc ? ' LUMO' : '') + '</td><td class="bsiFX-num">' + e.toFixed(5) + '</td><td class="bsiFX-num">' + (e * 27.211386).toFixed(2) + '</td><td>' + (k < ris.nocc ? 2 : 0) + '</td><td>' + ris.base[chi].nome + '</td></tr>';
      });
      tab.innerHTML = h + '</table><div class="bsiFX-nota">' + t('Per il teorema di Koopmans −ε(HOMO) approssima il primo potenziale di ionizzazione (acqua: 12,6 eV sperimentale).', 'By Koopmans’ theorem −ε(HOMO) approximates the first ionisation potential (water: 12.6 eV experimental).') + '</div>';
    }
    /* la mappa dell'orbitale nel piano che contiene la molecola (xy per H₂O, xz per le lineari) */
    function mappa() {
      if (!ris) return;
      var P = c2.getContext('2d'), dpr = Math.min(2, globale.devicePixelRatio || 1), W = Math.max(280, c2.clientWidth || 600), H = Math.round(W * c2._rapporto);
      c2.width = Math.round(W * dpr); c2.height = Math.round(H * dpr); P.setTransform(dpr, 0, 0, dpr, 0, 0);
      var lin = ris.atomi.every(function (a) { return a.r[0] === 0 && a.r[1] === 0; });
      var xs = ris.atomi.map(function (a) { return lin ? a.r[2] : a.r[0]; }), ys = ris.atomi.map(function (a) { return lin ? a.r[0] : a.r[1]; });
      var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
      var span = Math.max(Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)) + 5;
      var sc = Math.min(W, H) / span, passo = 4, img = P.createImageData(Math.ceil(W / passo), Math.ceil(H / passo)), mx = 1e-9, val = [];
      for (var j = 0; j < img.height; j++) for (var i = 0; i < img.width; i++) {
        var X = cx + (i * passo - W / 2) / sc, Y = cy - (j * passo - H / 2) / sc;
        var v = lin ? valoreMO(ris, orb, Y, 0, X) : valoreMO(ris, orb, X, Y, 0);
        val.push(v); mx = Math.max(mx, Math.abs(v));
      }
      for (var k = 0; k < val.length; k++) {
        var f = val[k] / mx, a = Math.min(1, Math.pow(Math.abs(f), 0.6));
        var col = f >= 0 ? [94, 234, 212] : [255, 120, 140];
        img.data[k * 4] = 8 + col[0] * a; img.data[k * 4 + 1] = 21 + col[1] * a; img.data[k * 4 + 2] = 34 + col[2] * a; img.data[k * 4 + 3] = 255;
      }
      var tmp = document.createElement('canvas'); tmp.width = img.width; tmp.height = img.height; tmp.getContext('2d').putImageData(img, 0, 0);
      P.imageSmoothingEnabled = true; P.drawImage(tmp, 0, 0, W, H);
      ris.atomi.forEach(function (a) {
        var X = W / 2 + ((lin ? a.r[2] : a.r[0]) - cx) * sc, Y = H / 2 - ((lin ? a.r[0] : a.r[1]) - cy) * sc;
        P.fillStyle = '#ffffff'; P.beginPath(); P.arc(X, Y, 4, 0, 6.29); P.fill();
        P.font = 'bold 13px system-ui'; P.fillText(SIMBOLI[a.Z], X + 6, Y - 6);
      });
      P.fillStyle = '#c9d3df'; P.font = '12px system-ui';
      P.fillText('MO ' + (orb + 1) + ' · ε = ' + ris.eps[orb].toFixed(4) + ' Eh · ' + t('verde +, rosa −', 'green +, pink −'), 10, 18);
      c2.setAttribute('aria-label', t('mappa dell’orbitale molecolare', 'molecular orbital map'));
    }
    calcola();
    F.alRidimensiona(function () { disegna(); mappa(); });
  }

  function schedaDissociazione(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var mol = 'H2', dati = null;
    var bi = Object.keys(MOL).filter(function (k) { return MOL[k].scan; });
    F.scelta(pan, ['Molecola biatomica', 'Diatomic molecule'], bi.map(function (k) { return [k, MOL[k].nome]; }), mol, function (v) { mol = v; calcola(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.6);
    function calcola() {
      info.textContent = t('Calcolo della curva…', 'Computing the curve…');
      setTimeout(function () {
        var M = MOL[mol], R = [], E = [];
        for (var r = M.scan[0]; r <= M.scan[1] + 1e-9; r += (M.scan[1] - M.scan[0]) / 36) { R.push(r); E.push(scf(M.atomi(r), M.carica).E); }
        var im = 0; E.forEach(function (e, i) { if (e < E[im]) im = i; });
        /* il minimo affinato con una parabola sui tre punti */
        var r0 = R[im];
        if (im > 0 && im < E.length - 1) { var h = R[1] - R[0], d = (E[im + 1] - E[im - 1]) / (2 * h), d2 = (E[im + 1] - 2 * E[im] + E[im - 1]) / (h * h); r0 = R[im] - d / d2; }
        dati = { R: R, E: E, r0: r0 };
        var sep = scf(M.atomi(30), M.carica).E;
        info.innerHTML = t('Minimo RHF/STO-3G', 'RHF/STO-3G minimum') + ': <b class="bsiFX-num">' + r0.toFixed(3) + ' bohr = ' + (r0 * 0.529177).toFixed(3) + ' Å</b><br>' +
          t('Energia a 30 bohr', 'Energy at 30 bohr') + ': <span class="bsiFX-num">' + sep.toFixed(4) + ' Eh</span><br><br>' +
          (mol === 'H2' ? t('Il limite di dissociazione dell’RHF è sbagliato: a distanza infinita H₂ dovrebbe dare due atomi di idrogeno (−0,9332 Eh in STO-3G), ma la funzione d’onda a guscio chiuso tiene i due elettroni insieme e ci mescola i termini ionici H⁺ H⁻. È il motivo per cui esistono i metodi a più determinanti.',
                         'The RHF dissociation limit is wrong: at infinite distance H₂ should give two hydrogen atoms (−0.9332 Eh in STO-3G), but the closed-shell wavefunction keeps the two electrons together and mixes in the ionic H⁺ H⁻ terms. This is why multi-determinant methods exist.') :
                         t('Distanza di equilibrio sperimentale: H₂ 0,741 Å · HeH⁺ 0,774 Å · LiH 1,595 Å · HF 0,917 Å · N₂ 1,098 Å.', 'Experimental equilibrium distance: H₂ 0.741 Å · HeH⁺ 0.774 Å · LiH 1.595 Å · HF 0.917 Å · N₂ 1.098 Å.'));
        disegna();
      }, 20);
    }
    function disegna() {
      if (!dati) return;
      F.grafico(c, { serie: [{ x: dati.R, y: dati.E, col: '#5eead4' }], punti: [{ x: dati.r0, y: Math.min.apply(null, dati.E), col: '#ffd24a', r: 4 }],
                     xl: ['distanza internucleare R (bohr)', 'internuclear distance R (bohr)'], yl: ['energia totale (Eh)', 'total energy (Eh)'] });
    }
    calcola();
    F.alRidimensiona(disegna);
  }

  /* ── v238: gli orbitali in 3D ─────────────────────────────────────────── */
  var MENO_MOTO = false; try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  /* il pannello subito, la scena dopo (three.js al primo uso, il contesto WebGL e il contenuto in compiti separati) */
  function scheda3D(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new L3.Scena(destra, 0.75);
          var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
          destra.insertBefore(S.box, destra.firstChild);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.nome));
          div._scena = S;
          setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
        }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  var COL_ATOMO = { 1: 0xf2f5f8, 2: 0x7fe6ff, 3: 0xb388ff, 4: 0x9be37a, 5: 0xffb27a, 6: 0x9aa6b2, 7: 0x6b8cff, 8: 0xff5a4f, 9: 0x7ef07e };
  function schedaOrbitali3D(pan) {
    var st = { mol: 'H2O', R: null, k: null, frazione: 0.85, taglio: true }, ris = null, cb = {}, gettone = 0, G = null;
    F.scelta(pan, ['Molecola', 'Molecule'], Object.keys(MOL).map(function (k) { return [k, MOL[k].nome]; }), st.mol, function (v) { st.mol = v; st.R = MOL[v].R || null; st.k = null; zonaR(); scf3D(); });
    var contR = F.el('div'), contO = F.el('div'); pan.appendChild(contR); pan.appendChild(contO);
    F.cursore(pan, ['probabilità racchiusa dalla superficie', 'probability enclosed by the surface'], 0.5, 0.95, 0.05, st.frazione, function (v) { st.frazione = v; superficie(); }, function (v) { return Math.round(v * 100) + ' %'; });
    var cT = F.el('input', { type: 'checkbox' }); cT.checked = st.taglio; cT.addEventListener('change', function () { st.taglio = cT.checked; if (cb.taglio) cb.taglio(); });
    pan.appendChild(F.el('label', { style: 'display:flex;gap:6px;align-items:center;font-size:.82rem;color:#aebccd;margin:6px 0' }, [cT, F.el('span', { testo: t('piano di taglio che scorre (la mappa di ψ)', 'sweeping cut plane (the ψ map)') })]));
    var info = F.el('div', { 'class': 'bsiFX-nota' }), spiega = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info); pan.appendChild(spiega);
    spiega.innerHTML = t('La superficie è dove |ψ| vale c, con c scelto perché dentro ci sia la frazione indicata della probabilità |ψ|²: verde dove ψ > 0, rosa dove ψ < 0 (gli stessi colori della mappa nella prima scheda). Dove due lobi di segno opposto si toccano passa un piano nodale: gli orbitali di antilegame ne hanno uno fra i nuclei. ψ viene dai coefficienti dell’SCF appena convergito (RHF/STO-3G) calcolati su una griglia di 49³ punti; la superficie è costruita con i tetraedri in marcia. Il piano che scorre mostra ψ fetta per fetta.',
      'The surface is where |ψ| equals c, with c chosen so that it encloses the given fraction of the probability |ψ|²: green where ψ > 0, pink where ψ < 0 (the same colours as the map in the first tab). Where two lobes of opposite sign meet there is a nodal plane: antibonding orbitals have one between the nuclei. ψ comes from the coefficients of the SCF just converged (RHF/STO-3G), evaluated on a 49³ grid; the surface is built with marching tetrahedra. The sweeping plane shows ψ slice by slice.');
    var selR = null;
    function zonaR() {
      contR.innerHTML = ''; var M = MOL[st.mol]; if (!M.scan) return;
      if (st.R == null) st.R = M.R;
      var attesa = null;
      F.cursore(contR, ['distanza R (bohr)', 'distance R (bohr)'], M.scan[0], Math.min(M.scan[1], 4.5), 0.05, st.R, function (v) { st.R = v; clearTimeout(attesa); attesa = setTimeout(scf3D, 250); }, function (v) { return v.toFixed(2) + ' bohr = ' + (v * 0.529177).toFixed(3) + ' Å'; });
    }
    function scf3D() {
      var mio = ++gettone; info.textContent = t('Calcolo SCF…', 'SCF running…');
      setTimeout(function () {
        if (mio !== gettone) return;
        var M = MOL[st.mol];
        try { ris = scf(M.atomi(st.R || M.R), M.carica); } catch (e) { info.textContent = e.message; return; }
        if (st.k == null || st.k >= ris.eps.length) st.k = ris.nocc - 1;
        contO.innerHTML = '';
        F.scelta(contO, ['Orbitale', 'Orbital'], ris.eps.map(function (e, k) { return [String(k), (k < ris.nocc ? '● ' : '○ ') + 'MO ' + (k + 1) + (k === ris.nocc - 1 ? ' HOMO' : k === ris.nocc ? ' LUMO' : '') + ' · ' + e.toFixed(3) + ' Eh']; }), String(st.k), function (v) { st.k = +v; griglia3D(); });
        if (cb.molecola) cb.molecola();
        griglia3D();
      }, 0);
    }
    function griglia3D() {
      var mio = ++gettone; info.textContent = t('Orbitale sulla griglia…', 'Orbital on the grid…');
      setTimeout(function () { if (mio !== gettone || !ris) return; G = grigliaMO(ris, st.k, 48, 4.5); G.k = st.k; superficie(); }, 0);
    }
    function superficie() {
      if (!G) return;
      var mio = ++gettone, c = sogliaIso(G, st.frazione), pos = null;
      /* le due superfici in due compiti: + poi − */
      setTimeout(function () {
        if (mio !== gettone) return; pos = isosuperficie(G, c, 1);
        setTimeout(function () {
          if (mio !== gettone) return; var neg = isosuperficie(G, c, -1), lp = lobi(pos), ln = lobi(neg), e = ris.eps[G.k];
          info.innerHTML = '<b>' + MOL[st.mol].nome + '</b>' + (st.R && MOL[st.mol].scan ? ' · R = ' + st.R.toFixed(2) + ' bohr' : '') + ' · E = <b class="bsiFX-num">' + ris.E.toFixed(6) + ' Eh</b><br>' +
            'MO ' + (G.k + 1) + (G.k === ris.nocc - 1 ? ' (HOMO)' : G.k === ris.nocc ? ' (LUMO)' : '') + ': ε = <b class="bsiFX-num">' + e.toFixed(4) + ' Eh = ' + (e * 27.211386).toFixed(2) + ' eV</b> · ' + t('occupazione ', 'occupation ') + (G.k < ris.nocc ? 2 : 0) + '<br>' +
            t('Isovalore ', 'Isovalue ') + '|ψ| = ' + c.toFixed(4) + ' bohr⁻³ᐟ² ' + t('(racchiude il ', '(encloses ') + Math.round(st.frazione * 100) + ' %)' + '<br>' +
            t('Lobi: ', 'Lobes: ') + '<b class="bsiFX-num">' + lp.componenti + '</b> ' + t('positivi', 'positive') + ', <b class="bsiFX-num">' + ln.componenti + '</b> ' + t('negativi', 'negative') + ' · ' + ((pos.idx.length + neg.idx.length) / 3) + t(' triangoli', ' triangles');
          if (cb.disegna) cb.disegna(pos, neg);
        }, 0);
      }, 0);
    }
    zonaR(); st.R = MOL[st.mol].R || null; scf3D();
    return {
      nome: ['Orbitali molecolari RHF in 3D', 'RHF molecular orbitals in 3D'],
      tre: function (S, T, L3) {
        var s = 0.85, gMol = new T.Group(), gOrb = new T.Group(), piano = null, tela = null, ctxT = null, tex = null; S.aggiungi(gMol); S.aggiungi(gOrb);
        function svuota(gr) { while (gr.children.length) { var o = gr.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } }); } }
        var centro = [0, 0, 0];
        cb.molecola = function () {
          svuota(gMol); if (!ris) return;
          centro = [0, 1, 2].map(function (d) { var a = ris.atomi.map(function (x) { return x.r[d]; }); return (Math.min.apply(null, a) + Math.max.apply(null, a)) / 2; });
          ris.atomi.forEach(function (a, i) {
            var p = [(a.r[0] - centro[0]) * s, (a.r[1] - centro[1]) * s, (a.r[2] - centro[2]) * s];
            gMol.add(L3.sfera(T, a.Z > 1 ? 0.2 : 0.13, COL_ATOMO[a.Z] || 0xffffff, p[0], p[1], p[2]));
            var et = L3.testo3d(T, SIMBOLI[a.Z], '#e6fffb', 0.28); et.position.set(p[0], p[1], p[2] + 0.38); gMol.add(et);
            for (var j = 0; j < i; j++) { var b = ris.atomi[j], d = Math.hypot(a.r[0] - b.r[0], a.r[1] - b.r[1], a.r[2] - b.r[2]); if (d < (a.Z === 1 && b.Z === 1 ? 2 : 3.4)) gMol.add(L3.linea(T, [p, [(b.r[0] - centro[0]) * s, (b.r[1] - centro[1]) * s, (b.r[2] - centro[2]) * s]], 0xdfe8f2, 0.85)); }
          });
          S.sporca = true; S.avvia();
        };
        cb.disegna = function (pos, neg) {
          svuota(gOrb);
          [[pos, 0x5eead4], [neg, 0xff7890]].forEach(function (q) {
            if (!q[0].idx.length) return;
            var p = q[0].pos, pp = new Float32Array(p.length);
            for (var i = 0; i < p.length; i += 3) { pp[i] = (p[i] - centro[0]) * s; pp[i + 1] = (p[i + 1] - centro[1]) * s; pp[i + 2] = (p[i + 2] - centro[2]) * s; }
            var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pp, 3)); geo.setIndex(q[0].idx); geo.computeVertexNormals();
            gOrb.add(new T.Mesh(geo, new T.MeshStandardMaterial({ color: q[1], roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.72, side: T.DoubleSide, depthWrite: false })));
          });
          preparaTaglio();
          S.didascalia.textContent = MOL[st.mol].nome + ' · MO ' + (G.k + 1) + (G.k === ris.nocc - 1 ? ' HOMO' : G.k === ris.nocc ? ' LUMO' : '') + ' · ' + t('verde ψ > 0, rosa ψ < 0', 'green ψ > 0, pink ψ < 0');
          S.sporca = true; S.avvia();
        };
        /* il piano di taglio: perpendicolare all'asse lungo cui gli atomi si allargano meno */
        var asseT = 2, iT = -1;
        function preparaTaglio() {
          if (piano) { gOrb.remove(piano); }
          var sp = [0, 1, 2].map(function (d) { var a = ris.atomi.map(function (x) { return x.r[d]; }); return Math.max.apply(null, a) - Math.min.apply(null, a); });
          asseT = sp.indexOf(Math.min.apply(null, sp)); if (sp[0] === sp[1] && sp[1] === 0) asseT = 0;
          if (!tela) { tela = document.createElement('canvas'); tela.width = tela.height = G.n + 1; ctxT = tela.getContext('2d'); tex = new T.CanvasTexture(tela); tex.magFilter = T.LinearFilter; }
          if (tela.width !== G.n + 1) { tela.width = tela.height = G.n + 1; }
          var L = G.n * G.h * s, mat = new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide, depthWrite: false });
          piano = new T.Mesh(new T.PlaneGeometry(L, L), mat);
          if (asseT === 0) piano.rotation.y = Math.PI / 2; else if (asseT === 1) piano.rotation.x = Math.PI / 2;
          var bordo = new T.LineSegments(new T.EdgesGeometry(piano.geometry), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.45 })); piano.add(bordo);
          gOrb.add(piano); piano.visible = st.taglio; iT = -1;
        }
        function fetta(i) {
          var n1 = G.n + 1, img = ctxT.createImageData(n1, n1), d = img.data, c = sogliaIso(G, 0.5) * 2.2;
          for (var a = 0; a < n1; a++) for (var b = 0; b < n1; b++) {
            /* a, b sono le due coordinate del piano (le altre due dopo asseT), in modo coerente con la rotazione del piano */
            var g3 = [0, 0, 0]; g3[asseT] = i;
            if (asseT === 0) { g3[2] = a; g3[1] = b; } else if (asseT === 1) { g3[0] = a; g3[2] = b; } else { g3[0] = a; g3[1] = b; }
            var v = G.v[(g3[0] * n1 + g3[1]) * n1 + g3[2]], f = Math.min(1, Math.abs(v) / c), k = 4 * ((n1 - 1 - b) * n1 + a);
            var col = v >= 0 ? [94, 234, 212] : [255, 120, 144];
            d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = Math.round(235 * Math.pow(f, 0.7));
          }
          ctxT.putImageData(img, 0, 0); tex.needsUpdate = true;
        }
        cb.taglio = function () { if (piano) piano.visible = st.taglio; S.sporca = true; S.avvia(); };
        var tempo = 0;
        S.ogniFotogramma(function (dt) {
          if (!piano || !st.taglio) return false;
          if (!MENO_MOTO) tempo += dt;
          var n = G.n, u = 0.5 + 0.45 * Math.sin(tempo * 0.6), i = Math.round(u * n);
          if (i !== iT) { iT = i; fetta(i); var q = G.x0[asseT] + i * G.h - centro[asseT]; piano.position.set(0, 0, 0); piano.position.setComponent(asseT, q * s); var o = [0, 1, 2].filter(function (d) { return d !== asseT; }); o.forEach(function (d) { piano.position.setComponent(d, (G.x0[d] + n * G.h / 2 - centro[d]) * s); }); }
          return !MENO_MOTO;
        });
        if (ris) cb.molecola();
        if (G) superficie();
        if (!MENO_MOTO) { S.gira = true; var bg = S.box.querySelector('.bsi3d-barra button'); if (bg) bg.setAttribute('aria-pressed', 'true'); }
        S.inquadra(12, 0.6, 1.2);
      }
    };
  }

  F.sezione('shf', {
    titolo: ['🧮 Hartree-Fock in diretta', '🧮 Live Hartree-Fock'],
    sotto: ['Un calcolo ab initio vero nel browser: RHF con la base STO-3G, tutti gli integrali calcolati qui (McMurchie-Davidson), il campo autoconsistente con DIIS, gli orbitali molecolari disegnati.',
            'A real ab initio calculation in the browser: RHF in the STO-3G basis, every integral computed here (McMurchie-Davidson), the self-consistent field with DIIS, the molecular orbitals drawn.'],
    schede: [
      { nome: ['Calcolo SCF e orbitali', 'SCF and orbitals'], costruisci: schedaSCF },
      { nome: ['Curva di dissociazione', 'Dissociation curve'], costruisci: schedaDissociazione },
      { nome: ['🧊 Orbitali in 3D', '🧊 Orbitals in 3D'], costruisci: scheda3D(schedaOrbitali3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
