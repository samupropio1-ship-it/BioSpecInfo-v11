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
  F.calcolo.hartreefock = { scf: scf, base: base, boys: boys, MOL: MOL, valoreMO: valoreMO, jacobi: jacobi };

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

  F.sezione('shf', {
    titolo: ['🧮 Hartree-Fock in diretta', '🧮 Live Hartree-Fock'],
    sotto: ['Un calcolo ab initio vero nel browser: RHF con la base STO-3G, tutti gli integrali calcolati qui (McMurchie-Davidson), il campo autoconsistente con DIIS, gli orbitali molecolari disegnati.',
            'A real ab initio calculation in the browser: RHF in the STO-3G basis, every integral computed here (McMurchie-Davidson), the self-consistent field with DIIS, the molecular orbitals drawn.'],
    schede: [
      { nome: ['Calcolo SCF e orbitali', 'SCF and orbitals'], costruisci: schedaSCF },
      { nome: ['Curva di dissociazione', 'Dissociation curve'], costruisci: schedaDissociazione }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
