/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-lineare.js — 🔲 l'algebra lineare, in frazioni esatte
   BioSpecInfo · © Samuele Pio Provenzano

   · MATRICI: riduzione di Gauss-Jordan con TUTTI i passaggi (scambi,
     moltiplicazioni, combinazioni di righe), determinante, inversa, rango,
     nucleo, sistemi lineari (unica soluzione, infinite con i parametri,
     nessuna), autovalori dal polinomio caratteristico (Faddeev-LeVerrier,
     esatto) e autovettori. Le frazioni sono vere frazioni (BigInt): 1/3
     resta 1/3 per tutta la riduzione; solo se si scrive un irrazionale
     (√2, pi) si passa ai numeri in virgola mobile.
   · TRASFORMAZIONI DEL PIANO: una matrice 2×2 deforma la griglia; si
     vedono il determinante come rapporto delle aree e gli autovettori come
     direzioni che non ruotano.
   · BILANCIAMENTO: una reazione chimica e' un sistema lineare omogeneo; i
     coefficienti stechiometrici sono il NUCLEO della matrice di
     composizione (elementi × specie, carica compresa).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ── i due campi: frazioni esatte e reali ─────────────────────────────── */
  function bgcd(a, b) { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { var r = a % b; a = b; b = r; } return a; }
  function fr(n, d) {
    if (d === undefined) d = 1n;
    if (d < 0n) { n = -n; d = -d; }
    var g = bgcd(n, d); if (g > 1n) { n /= g; d /= g; }
    return { n: n, d: d };
  }
  var Qf = {
    nome: 'Q', zero: fr(0n), uno: fr(1n),
    add: function (a, b) { return fr(a.n * b.d + b.n * a.d, a.d * b.d); },
    sub: function (a, b) { return fr(a.n * b.d - b.n * a.d, a.d * b.d); },
    mul: function (a, b) { return fr(a.n * b.n, a.d * b.d); },
    div: function (a, b) { return fr(a.n * b.d, a.d * b.n); },
    neg: function (a) { return fr(-a.n, a.d); },
    nullo: function (a) { return a.n === 0n; },
    da: function (v) { var r = C.rationalizza(v, 1e6); return r ? fr(BigInt(r[0]), BigInt(r[1])) : null; },
    val: function (a) { return Number(a.n) / Number(a.d); },
    str: function (a) { var s = a.d === 1n ? String(a.n) : a.n + '/' + a.d; return s.replace(/^-/, '−'); },
    abs: function (a) { return Math.abs(Number(a.n) / Number(a.d)); }
  };
  var Rf = {
    nome: 'R', zero: 0, uno: 1,
    add: function (a, b) { return a + b; }, sub: function (a, b) { return a - b; }, mul: function (a, b) { return a * b; }, div: function (a, b) { return a / b; },
    neg: function (a) { return -a; }, nullo: function (a) { return Math.abs(a) < 1e-10; }, da: function (v) { return v; },
    val: function (a) { return a; }, str: function (a) { return Math.abs(a) < 1e-10 ? '0' : C.numeroBello(+a.toPrecision(10)); }, abs: Math.abs
  };

  /* legge una matrice: una riga per linea, elementi separati da spazi, tab o ; */
  function leggiMatrice(testo) {
    var righe = String(testo).split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { return l.split(/[\s;]+/).filter(Boolean); });
    if (!righe.length) throw new Error(t('matrice vuota', 'empty matrix'));
    var n = righe[0].length;
    righe.forEach(function (r, i) { if (r.length !== n) throw new Error(t('la riga ', 'row ') + (i + 1) + t(' ha ', ' has ') + r.length + t(' elementi, la prima ', ' entries, the first ') + n); });
    var esatta = true, nodi = righe.map(function (r) { return r.map(function (s) { var e = C.leggi(s); if (C.simboli(e).length) throw new Error(t('solo numeri: «', 'numbers only: «') + s + '»'); if (!(e.t === 'n' && e.f === undefined)) esatta = false; return e; }); });
    var campo = esatta ? Qf : Rf;
    var M = nodi.map(function (r) { return r.map(function (e) { return esatta ? fr(BigInt(e.n), BigInt(e.d)) : C.valuta(e); }); });
    return { M: M, campo: campo };
  }
  function copia(M) { return M.map(function (r) { return r.slice(); }); }
  function identita(n, K) { var I = []; for (var i = 0; i < n; i++) { I.push([]); for (var j = 0; j < n; j++) I[i].push(i === j ? K.uno : K.zero); } return I; }

  /* «R2 ← R2 + 3·R1» invece di «R2 − (−3)·R1»; «R1 ← (1/2)·R1», «R3 ← −R3» */
  function coeffRiga(c, K) { var s = K.str(c); if (s === '1') return ''; if (s === '−1') return '−'; return (s.indexOf('/') > 0 ? '(' + s + ')' : s) + '·'; }
  function combinazione(f, K) { var s = K.str(f), neg = s.charAt(0) === '−'; if (neg) s = s.slice(1); return (neg ? ' + ' : ' − ') + (s === '1' ? '' : (s.indexOf('/') > 0 ? '(' + s + ')' : s) + '·'); }

  /* Gauss-Jordan con il registro dei passi; colonne = quante colonne pivotare */
  function rref(M0, K, colonne, passi) {
    var M = copia(M0), m = M.length, n = colonne || M[0].length, r = 0, pivot = [];
    function reg(testo) { if (passi && passi.length < 60) passi.push({ op: testo, M: copia(M) }); }
    for (var c = 0; c < n && r < m; c++) {
      var p = -1;
      if (K === Rf) { var best = 1e-10; for (var i = r; i < m; i++) if (Math.abs(M[i][c]) > best) { best = Math.abs(M[i][c]); p = i; } }
      else for (var i2 = r; i2 < m; i2++) if (!K.nullo(M[i2][c])) { p = i2; break; }
      if (p < 0) continue;
      if (p !== r) { var tmp = M[p]; M[p] = M[r]; M[r] = tmp; reg('R' + (r + 1) + ' ↔ R' + (p + 1)); }
      var pv = M[r][c];
      if (!(K === Qf ? (pv.n === 1n && pv.d === 1n) : Math.abs(pv - 1) < 1e-14)) {
        M[r] = M[r].map(function (v) { return K.div(v, pv); });
        reg('R' + (r + 1) + ' ← ' + coeffRiga(K.div(K.uno, pv), K) + 'R' + (r + 1));
      }
      for (var k = 0; k < m; k++) {
        if (k === r || K.nullo(M[k][c])) continue;
        var f = M[k][c];
        M[k] = M[k].map(function (v, j) { return K.sub(v, K.mul(f, M[r][j])); });
        reg('R' + (k + 1) + ' ← R' + (k + 1) + combinazione(f, K) + 'R' + (r + 1));
      }
      if (K === Rf) for (var a = 0; a < m; a++) for (var b = 0; b < M[0].length; b++) if (Math.abs(M[a][b]) < 1e-12) M[a][b] = 0;
      pivot.push(c); r++;
    }
    return { R: M, pivot: pivot, rango: r };
  }
  function determinante(M0, K, passi) {
    var M = copia(M0), n = M.length, segno = 1;
    if (n !== M[0].length) throw new Error(t('il determinante esiste solo per matrici quadrate', 'the determinant exists only for square matrices'));
    function reg(s) { if (passi && passi.length < 60) passi.push({ op: s, M: copia(M) }); }
    for (var c = 0; c < n; c++) {
      var p = -1;
      if (K === Rf) { var best = 1e-12; for (var i = c; i < n; i++) if (Math.abs(M[i][c]) > best) { best = Math.abs(M[i][c]); p = i; } }
      else for (var i2 = c; i2 < n; i2++) if (!K.nullo(M[i2][c])) { p = i2; break; }
      if (p < 0) { reg(t('colonna ', 'column ') + (c + 1) + t(' senza pivot → det = 0', ' has no pivot → det = 0')); return K.zero; }
      if (p !== c) { var tmp = M[p]; M[p] = M[c]; M[c] = tmp; segno = -segno; reg('R' + (c + 1) + ' ↔ R' + (p + 1) + t(' (il segno cambia)', ' (the sign flips)')); }
      for (var k = c + 1; k < n; k++) {
        if (K.nullo(M[k][c])) continue;
        var f = K.div(M[k][c], M[c][c]);
        M[k] = M[k].map(function (v, j) { return K.sub(v, K.mul(f, M[c][j])); });
        reg('R' + (k + 1) + ' ← R' + (k + 1) + combinazione(f, K) + 'R' + (c + 1));
      }
    }
    var d = segno > 0 ? K.uno : K.neg(K.uno);
    for (var q = 0; q < n; q++) d = K.mul(d, M[q][q]);
    return d;
  }
  function inversa(M, K, passi) {
    var n = M.length;
    if (n !== M[0].length) throw new Error(t('serve una matrice quadrata', 'a square matrix is needed'));
    var I = identita(n, K), A = M.map(function (r, i) { return r.concat(I[i]); });
    var r = rref(A, K, n, passi);
    if (r.rango < n) return null;
    return r.R.map(function (riga) { return riga.slice(n); });
  }
  function nucleo(M, K) {
    var r = rref(M, K), n = M[0].length, liberi = [], base = [];
    for (var j = 0; j < n; j++) if (r.pivot.indexOf(j) < 0) liberi.push(j);
    liberi.forEach(function (lib) {
      var v = []; for (var j = 0; j < n; j++) v.push(K.zero);
      v[lib] = K.uno;
      r.pivot.forEach(function (pc, i) { v[pc] = K.neg(r.R[i][lib]); });
      base.push(v);
    });
    return base;
  }
  function risolviSistema(Ab, K) {
    var n = Ab[0].length - 1, r = rref(Ab, K, n), m = Ab.length;
    for (var i = r.rango; i < m; i++) if (!K.nullo(r.R[i][n])) return { tipo: 'impossibile', R: r.R };
    var liberi = []; for (var j = 0; j < n; j++) if (r.pivot.indexOf(j) < 0) liberi.push(j);
    var sol = [];
    for (j = 0; j < n; j++) sol.push({ cost: K.zero, par: {} });
    r.pivot.forEach(function (pc, i) { sol[pc].cost = r.R[i][n]; liberi.forEach(function (l) { if (!K.nullo(r.R[i][l])) sol[pc].par[l] = K.neg(r.R[i][l]); }); });
    liberi.forEach(function (l) { sol[l].par[l] = K.uno; });
    return { tipo: liberi.length ? 'infinite' : 'unica', sol: sol, liberi: liberi, R: r.R };
  }
  function moltiplica(A, B, K) {
    if (A[0].length !== B.length) throw new Error(t('colonne di A ≠ righe di B', 'columns of A ≠ rows of B'));
    return A.map(function (r) { return B[0].map(function (_, j) { var s = K.zero; for (var k = 0; k < B.length; k++) s = K.add(s, K.mul(r[k], B[k][j])); return s; }); });
  }
  function trasposta(A) { return A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); }); }
  /* polinomio caratteristico det(λI − A) con Faddeev-LeVerrier: coefficienti c[k] di λ^k */
  function polCaratteristico(A, K) {
    var n = A.length, c = new Array(n + 1), Mk = identita(n, K).map(function (r) { return r.map(function () { return K.zero; }); });
    c[n] = K.uno;
    for (var k = 1; k <= n; k++) {
      var AM = moltiplica(A, Mk, K);
      Mk = AM.map(function (r, i) { return r.map(function (v, j) { return i === j ? K.add(v, c[n - k + 1]) : v; }); });
      var AMk = moltiplica(A, Mk, K), tr = K.zero;
      for (var i = 0; i < n; i++) tr = K.add(tr, AMk[i][i]);
      c[n - k] = K.div(K.neg(tr), K === Qf ? fr(BigInt(k)) : k);
    }
    return c;
  }
  /* con coefficienti razionali le radici razionali si trovano ESATTE (teorema delle radici
     razionali) e si tolgono per divisione; il resto va a Durand-Kerner */
  function divisori(n) {
    n = n < 0n ? -n : n; var out = [];
    if (n === 0n || n > 1000000000000n) return out;
    for (var d = 1n; d * d <= n; d++) if (n % d === 0n) { out.push(d); if (d * d !== n) out.push(n / d); }
    return out;
  }
  function radiciRazionaliPrima(c) {
    var l = 1n; c.forEach(function (x) { l = l / bgcd(l, x.d) * x.d; });
    var a = c.map(function (x) { return x.n * (l / x.d); }), radici = [];
    while (a.length > 1 && a[0] === 0n) { radici.push({ re: 0, im: 0 }); a.shift(); }
    var trovata = true;
    while (a.length > 2 && trovata) {
      trovata = false;
      var P = divisori(a[0]), Qd = divisori(a[a.length - 1]);
      if (P.length * Qd.length > 4000) break;
      for (var i = 0; i < P.length && !trovata; i++) for (var j = 0; j < Qd.length && !trovata; j++) for (var sg = 0; sg < 2 && !trovata; sg++) {
        var p = sg ? -P[i] : P[i], q = Qd[j];
        if (bgcd(p, q) !== 1n) continue;
        /* Σ a_k p^k q^(n−k) = 0 ? */
        var n = a.length - 1, somma = 0n, pk = 1n, qk = 1n, qp = [];
        for (var k = 0; k <= n; k++) { qp.push(qk); qk *= q; }
        for (k = 0; k <= n; k++) { somma += a[k] * pk * qp[n - k]; pk *= p; }
        if (somma !== 0n) continue;
        /* divisione per (q·λ − p): coefficienti dal grado alto */
        var b = new Array(n), resto = a[n];
        for (k = n - 1; k >= 0; k--) { b[k] = resto / q; resto = a[k] + b[k] * p; }
        a = b; radici.push({ re: Number(p) / Number(q), im: 0 }); trovata = true;
      }
    }
    if (a.length > 1) C.radiciPolinomio(a.map(Number)).forEach(function (z) { radici.push(z); });
    return radici;
  }
  function autovalori(A, K) {
    if (A.length !== A[0].length) throw new Error(t('serve una matrice quadrata', 'a square matrix is needed'));
    var c = polCaratteristico(A, K), rad = K === Qf ? radiciRazionaliPrima(c) : C.radiciPolinomio(c.map(K.val));
    var n = A.length, distinti = [];
    /* le radici multiple escono sparpagliate di ~ε^(1/m): si raggruppano e se ne prende la media, che e' precisa */
    rad.forEach(function (z) {
      var g = distinti.filter(function (d) { return Math.hypot(d.re / d.molt - z.re, d.im / d.molt - z.im) < 1e-4 * (1 + Math.hypot(z.re, z.im)); })[0];
      if (g) { g.molt++; g.re += z.re; g.im += z.im; } else distinti.push({ re: z.re, im: z.im, molt: 1 });
    });
    distinti.forEach(function (d) { d.re /= d.molt; d.im /= d.molt; if (Math.abs(d.im) < 1e-9) d.im = 0; });
    distinti.forEach(function (d) {
      if (d.im) return;
      var q = null;
      for (var den = 1; den <= 1000 && !q; den++) { var nn = Math.round(d.re * den); if (Math.abs(d.re - nn / den) < 1e-7 * Math.max(1, Math.abs(d.re))) q = [nn, den]; }
      var lam = q ? (K === Qf ? fr(BigInt(q[0]), BigInt(q[1])) : q[0] / q[1]) : null;
      var Km = lam !== null ? K : Rf, L = lam !== null ? lam : d.re;
      if (lam !== null) d.re = q[0] / q[1];
      var B = A.map(function (r, i) { return r.map(function (v, j) { var vv = Km === K ? v : K.val(v); return i === j ? Km.sub(vv, L) : vv; }); });
      var N = Km === Rf ? nucleoTollerante(B) : nucleo(B, Km);
      d.vettori = N.map(function (v) { return interiOUnitario(v, Km); });
      d.campo = Km;
    });
    return { pol: c, valori: distinti, simmetrica: A.every(function (r, i) { return r.every(function (v, j) { return K.val(v) === K.val(A[j][i]); }); }) };
  }
  /* nucleo numerico: RREF con soglia relativa all'ampiezza della matrice */
  function nucleoTollerante(B) {
    var s = 0; B.forEach(function (r) { r.forEach(function (v) { s = Math.max(s, Math.abs(v)); }); });
    var M = copia(B), m = M.length, n = M[0].length, r = 0, piv = [], tol = 1e-7 * Math.max(1, s);
    for (var c = 0; c < n && r < m; c++) {
      var p = -1, best = tol; for (var i = r; i < m; i++) if (Math.abs(M[i][c]) > best) { best = Math.abs(M[i][c]); p = i; }
      if (p < 0) continue;
      var tmp = M[p]; M[p] = M[r]; M[r] = tmp;
      var pv = M[r][c]; M[r] = M[r].map(function (v) { return v / pv; });
      for (var k = 0; k < m; k++) if (k !== r) { var f = M[k][c]; M[k] = M[k].map(function (v, j) { return v - f * M[r][j]; }); }
      piv.push(c); r++;
    }
    var base = [];
    for (var j = 0; j < n; j++) if (piv.indexOf(j) < 0) { var v = new Array(n).fill(0); v[j] = 1; piv.forEach(function (pc, i) { v[pc] = -M[i][j]; }); base.push(v); }
    return base;
  }
  function interiOUnitario(v, K) {
    if (K === Qf) {
      var l = 1n; v.forEach(function (x) { l = l / bgcd(l, x.d) * x.d; });
      var w = v.map(function (x) { return x.n * (l / x.d); }), g = 0n; w.forEach(function (x) { g = bgcd(g, x); });
      if (g > 1n) w = w.map(function (x) { return x / g; });
      return w.map(function (x) { return String(x).replace(/^-/, '−'); });
    }
    var nrm = Math.sqrt(v.reduce(function (s, x) { return s + x * x; }, 0)) || 1;
    return v.map(function (x) { return Rf.str(x / nrm); });
  }

  function tabellaMatrice(M, K, sep) {
    return '<table class="bsiFX-tab" style="width:auto;margin:4px 0">' + M.map(function (r) {
      return '<tr>' + r.map(function (v, j) { return '<td class="bsiFX-num" style="padding:2px 8px;' + (sep !== undefined && j === sep ? 'border-left:1px solid #5eead4;' : '') + '">' + esc(K.str(v)) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</table>';
  }
  function stampaPol(c, K) {
    var parti = [];
    for (var k = c.length - 1; k >= 0; k--) {
      var v = K.val(c[k]); if (Math.abs(v) < 1e-14) continue;
      var s = K.str(c[k]), neg = s.charAt(0) === '−'; if (neg) s = s.slice(1);
      var mon = k === 0 ? '' : k === 1 ? 'λ' : 'λ' + String(k).split('').map(function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; }).join('');
      var term = k === 0 ? s : (s === '1' ? mon : (s.indexOf('/') > 0 ? '(' + s + ')' : s) + mon);
      parti.push((parti.length ? (neg ? ' − ' : ' + ') : (neg ? '−' : '')) + term);
    }
    return parti.join('') || '0';
  }

  function schedaMatrici(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { 'class': 'bsiFX-pannello', style: 'overflow-x:auto' });
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var op = 'rref';
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Matrice A: una riga per linea, numeri separati da spazi (frazioni come 1/3).', 'Matrix A: one row per line, numbers separated by spaces (fractions as 1/3).') }));
    var ta = F.el('textarea', { rows: 5, 'aria-label': 'A', style: 'width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px;font-family:var(--font-mono,monospace);font-size:.9rem' });
    ta.value = '2 1 -1 8\n-3 -1 2 -11\n-2 1 2 -3'; pan.appendChild(ta);
    var selOp = F.scelta(pan, ['Operazione', 'Operation'], [['rref', ['Riduzione di Gauss-Jordan (passi)', 'Gauss-Jordan reduction (steps)']], ['sistema', ['Sistema lineare (ultima colonna = termini noti)', 'Linear system (last column = constants)']], ['det', ['Determinante (passi)', 'Determinant (steps)']], ['inv', ['Inversa', 'Inverse']], ['rango', ['Rango e nucleo', 'Rank and null space']], ['eig', ['Autovalori e autovettori', 'Eigenvalues and eigenvectors']], ['prod', ['Prodotto A·B', 'Product A·B']], ['tr', ['Trasposta', 'Transpose']]], op, function (v) { op = v; tb.style.display = op === 'prod' ? '' : 'none'; lb.style.display = tb.style.display; calcola(); });
    var lb = F.el('div', { 'class': 'bsiFX-nota', testo: t('Matrice B:', 'Matrix B:'), style: 'display:none' }); pan.appendChild(lb);
    var tb = F.el('textarea', { rows: 3, 'aria-label': 'B', style: 'display:none;width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px;font-family:var(--font-mono,monospace);font-size:.9rem' });
    tb.value = '1 0\n0 1\n1 1'; pan.appendChild(tb);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
    [[t('sistema 3×3', '3×3 system'), '2 1 -1 8\n-3 -1 2 -11\n-2 1 2 -3', 'sistema'], [t('infinite soluzioni', 'infinitely many'), '1 2 3 6\n2 4 6 12\n1 1 1 3', 'sistema'], [t('impossibile', 'inconsistent'), '1 1 2\n1 1 3', 'sistema'],
     ['Hilbert 3×3', '1 1/2 1/3\n1/2 1/3 1/4\n1/3 1/4 1/5', 'inv'], [t('simmetrica', 'symmetric'), '2 -1 0\n-1 2 -1\n0 -1 2', 'eig'], [t('rotazione', 'rotation'), '0 -1\n1 0', 'eig'], [t('non diagonalizzabile', 'defective'), '2 1\n0 2', 'eig'], ['det 4×4', '1 2 0 3\n4 0 1 2\n0 1 3 1\n2 2 1 0', 'det']].forEach(function (p) {
      es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: p[0], onclick: function () { ta.value = p[1]; op = p[2]; selOp.value = p[2]; tb.style.display = 'none'; lb.style.display = 'none'; calcola(); } }));
    });
    F.bottone(pan, ['Calcola', 'Compute'], calcola);
    function calcola() {
      var A;
      try { A = leggiMatrice(ta.value); } catch (err) { dx.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; return; }
      var K = A.campo, M = A.M, h = '<div class="bsiFX-nota">' + (K === Qf ? t('Aritmetica esatta in frazioni.', 'Exact arithmetic in fractions.') : t('Ci sono irrazionali: aritmetica in virgola mobile.', 'There are irrationals: floating-point arithmetic.')) + '</div>', passi = [];
      function mostraPassi(sep) { if (!passi.length) return ''; return '<details open><summary style="cursor:pointer;color:#5eead4">' + passi.length + t(' passi', ' steps') + '</summary>' + passi.map(function (p, i) { return '<div style="margin:6px 0"><b>' + (i + 1) + '.</b> <span class="bsiFX-num">' + esc(p.op) + '</span>' + tabellaMatrice(p.M, K, sep) + '</div>'; }).join('') + '</details>'; }
      try {
        h += '<b>A</b>' + tabellaMatrice(M, K, op === 'sistema' ? M[0].length - 1 : undefined);
        if (op === 'rref') { var r = rref(M, K, null, passi); h += mostraPassi() + '<b>RREF</b>' + tabellaMatrice(r.R, K) + '<div class="bsiFX-nota">' + t('Rango: ', 'Rank: ') + r.rango + t(' · colonne pivot: ', ' · pivot columns: ') + r.pivot.map(function (c) { return c + 1; }).join(', ') + '</div>'; }
        else if (op === 'sistema') {
          var s = risolviSistema(M, K), nv = M[0].length - 1, nomi = []; for (var i = 0; i < nv; i++) nomi.push(nv <= 4 ? 'xyzw'[i] : 'x' + (i + 1));
          rref(M, K, nv, passi); h += mostraPassi(nv);
          if (s.tipo === 'impossibile') h += '<div class="bsiFX-eq bsiFX-ko">' + t('Sistema impossibile: una riga dice 0 = c con c ≠ 0 (rango di A < rango di [A|b], Rouché-Capelli).', 'Inconsistent system: a row says 0 = c with c ≠ 0 (rank of A < rank of [A|b], Rouché-Capelli).') + '</div>';
          else {
            var par = {}; s.liberi.forEach(function (l, k) { par[l] = String.fromCharCode(116 + k); });
            h += '<div class="bsiFX-eq">' + (s.tipo === 'unica' ? t('Soluzione unica:', 'Unique solution:') : t('Infinite soluzioni, ', 'Infinitely many solutions, ') + s.liberi.length + t(' parametri liberi:', ' free parameters:')) + '<br>' + s.sol.map(function (z, j) {
              var parti = []; if (!K.nullo(z.cost) || !Object.keys(z.par).length) parti.push(K.str(z.cost));
              Object.keys(z.par).forEach(function (l) { var c = K.str(z.par[l]), neg = c.charAt(0) === '−'; c = neg ? c.slice(1) : c; parti.push((neg ? '− ' : (parti.length ? '+ ' : '')) + (c === '1' ? '' : c + '·') + par[l]); });
              return nomi[j] + ' = ' + parti.join(' ');
            }).join('<br>') + '</div>';
          }
        }
        else if (op === 'det') { var d = determinante(M, K, passi); h += mostraPassi() + '<div class="bsiFX-eq">det A = ' + t('(segno) × prodotto della diagonale = ', '(sign) × product of the diagonal = ') + '<b>' + K.str(d) + '</b></div>' + (K.nullo(d) ? '<div class="bsiFX-nota">' + t('det = 0: la matrice è singolare (righe dipendenti, niente inversa).', 'det = 0: the matrix is singular (dependent rows, no inverse).') + '</div>' : ''); }
        else if (op === 'inv') { var I = inversa(M, K, passi); h += mostraPassi(M.length) + (I ? '<b>A⁻¹</b>' + tabellaMatrice(I, K) + '<div class="bsiFX-nota">' + t('Controllo: A·A⁻¹ = I ', 'Check: A·A⁻¹ = I ') + (moltiplica(M, I, K).every(function (r, i) { return r.every(function (v, j) { return Math.abs(K.val(v) - (i === j ? 1 : 0)) < 1e-9; }); }) ? '✓' : '✗') + '</div>' : '<div class="bsiFX-eq bsiFX-ko">' + t('Non invertibile: il rango è minore della dimensione.', 'Not invertible: the rank is below the size.') + '</div>'); }
        else if (op === 'rango') { var rr = rref(M, K), N = nucleo(M, K); h += t('Rango: ', 'Rank: ') + '<b>' + rr.rango + '</b> · ' + t('dimensione del nucleo: ', 'null-space dimension: ') + '<b>' + N.length + '</b> (' + t('teorema del rango: ', 'rank theorem: ') + rr.rango + ' + ' + N.length + ' = ' + M[0].length + ')' + (N.length ? '<div class="bsiFX-nota">' + t('Base del nucleo:', 'Null-space basis:') + '</div>' + N.map(function (v) { return '<div class="bsiFX-num">(' + interiOUnitario(v, K).join(', ') + ')</div>'; }).join('') : ''); }
        else if (op === 'eig') {
          var E = autovalori(M, K);
          h += '<div class="bsiFX-eq">p(λ) = det(λI − A) = ' + esc(stampaPol(E.pol, K)) + '</div><table class="bsiFX-tab"><tr><th>λ</th><th>' + t('molt.', 'mult.') + '</th><th>' + t('autovettori', 'eigenvectors') + '</th></tr>' +
            E.valori.map(function (d) { return '<tr><td class="bsiFX-num">' + (d.im ? Rf.str(d.re) + (d.im > 0 ? ' + ' : ' − ') + Rf.str(Math.abs(d.im)) + 'i' : C.numeroBello(+d.re.toPrecision(10))) + '</td><td>' + d.molt + '</td><td class="bsiFX-num">' + (d.im ? t('complessi', 'complex') : (d.vettori || []).map(function (v) { return '(' + v.join(', ') + ')'; }).join('<br>')) + '</td></tr>'; }).join('') + '</table>';
          var tot = E.valori.filter(function (d) { return !d.im; }).reduce(function (s, d) { return s + (d.vettori || []).length; }, 0), ncomp = E.valori.filter(function (d) { return d.im; }).reduce(function (s, d) { return s + d.molt; }, 0);
          h += '<div class="bsiFX-nota">' + (E.simmetrica ? t('Matrice simmetrica: autovalori reali e autovettori ortogonali (teorema spettrale) — come le matrici di Hückel e di Fock.', 'Symmetric matrix: real eigenvalues and orthogonal eigenvectors (spectral theorem) — like the Hückel and Fock matrices.') + '<br>' : '') +
            (ncomp ? t('Autovalori complessi: la trasformazione ruota il piano.', 'Complex eigenvalues: the map rotates the plane.') : tot < M.length ? t('Meno autovettori indipendenti della dimensione: la matrice non è diagonalizzabile.', 'Fewer independent eigenvectors than the size: the matrix is not diagonalisable.') : t('Diagonalizzabile: A = P·D·P⁻¹ con gli autovettori come colonne di P.', 'Diagonalisable: A = P·D·P⁻¹ with the eigenvectors as columns of P.')) + '</div>';
        }
        else if (op === 'prod') { var B = leggiMatrice(tb.value), KK = K === Qf && B.campo === Qf ? Qf : Rf; var conv = function (X, from) { return from === KK ? X : X.map(function (r) { return r.map(function (v) { return from.val(v); }); }); }; h += '<b>B</b>' + tabellaMatrice(B.M, B.campo) + '<b>A·B</b>' + tabellaMatrice(moltiplica(conv(M, K), conv(B.M, B.campo), KK), KK); }
        else if (op === 'tr') h += '<b>Aᵀ</b>' + tabellaMatrice(trasposta(M), K);
      } catch (err) { h += '<div class="bsiFX-ko">⚠ ' + esc(err.message) + '</div>'; }
      dx.innerHTML = h;
    }
    calcola();
  }

  /* ── trasformazioni del piano ────────────────────────────────────────── */
  function schedaPiano(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var A = [[1, 1], [0, 1]], cur = [];
    var pre = { taglio: [[1, 1], [0, 1]], rot: [[0.7071, -0.7071], [0.7071, 0.7071]], rifl: [[1, 0], [0, -1]], scala: [[2, 0], [0, 0.5]], proiez: [[1, 0], [0, 0]], simm: [[2, 1], [1, 2]] };
    F.scelta(pan, ['Esempio', 'Example'], [['taglio', ['taglio', 'shear']], ['rot', ['rotazione di 45°', '45° rotation']], ['rifl', ['riflessione', 'reflection']], ['scala', ['dilatazione', 'scaling']], ['proiez', ['proiezione (det = 0)', 'projection (det = 0)']], ['simm', ['simmetrica', 'symmetric']]], 'taglio', function (v) {
      A = pre[v].map(function (r) { return r.slice(); }); cur.forEach(function (c, i) { c.value = A[i >> 1][i & 1]; c.dispatchEvent(new Event('input')); }); disegna();
    });
    [['a₁₁', 0, 0], ['a₁₂', 0, 1], ['a₂₁', 1, 0], ['a₂₂', 1, 1]].forEach(function (q) {
      cur.push(F.cursore(pan, [q[0], q[0]], -3, 3, 0.05, A[q[1]][q[2]], function (v) { A[q[1]][q[2]] = v; disegna(); }, function (v) { return v.toFixed(2); }));
    });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(dx, 0.8);
    function disegna() {
      var o = F.grafico(c, { serie: [{ x: [-4, 4], y: [0, 0], col: '#1d2f49' }], xmin: -4, xmax: 4, ymin: -3.2, ymax: 3.2, xl: 'x', yl: 'y' }), q = o.q;
      function P(x, y) { return [o.X(A[0][0] * x + A[0][1] * y), o.Y(A[1][0] * x + A[1][1] * y)]; }
      q.save(); q.beginPath(); q.rect(54, 14, o.W - 68, o.H - 54); q.clip();
      q.strokeStyle = 'rgba(124,111,255,.35)'; q.lineWidth = 1;
      for (var k = -6; k <= 6; k++) {
        var a = P(k, -8), b = P(k, 8); q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke();
        a = P(-8, k); b = P(8, k); q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke();
      }
      var Q0 = [[0, 0], [1, 0], [1, 1], [0, 1]];
      q.fillStyle = 'rgba(94,234,212,.12)'; q.beginPath(); Q0.forEach(function (p, i) { var s = [o.X(p[0]), o.Y(p[1])]; if (i) q.lineTo(s[0], s[1]); else q.moveTo(s[0], s[1]); }); q.closePath(); q.fill();
      q.fillStyle = 'rgba(255,210,74,.3)'; q.strokeStyle = '#ffd24a'; q.beginPath(); Q0.forEach(function (p, i) { var s = P(p[0], p[1]); if (i) q.lineTo(s[0], s[1]); else q.moveTo(s[0], s[1]); }); q.closePath(); q.fill(); q.stroke();
      function freccia(p, col, et) { var o0 = [o.X(0), o.Y(0)]; q.strokeStyle = col; q.lineWidth = 2.5; q.beginPath(); q.moveTo(o0[0], o0[1]); q.lineTo(p[0], p[1]); q.stroke(); q.fillStyle = col; q.font = '12px system-ui'; q.fillText(et, p[0] + 4, p[1] - 4); }
      freccia(P(1, 0), '#5eead4', 'A·e₁'); freccia(P(0, 1), '#ff8a80', 'A·e₂');
      var tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0], disc = tr * tr - 4 * det, testo;
      if (disc >= -1e-12) {
        var l1 = (tr + Math.sqrt(Math.max(0, disc))) / 2, l2 = (tr - Math.sqrt(Math.max(0, disc))) / 2;
        [l1, l2].forEach(function (l, i) {
          var v = Math.abs(A[0][1]) > 1e-9 ? [A[0][1], l - A[0][0]] : Math.abs(A[1][0]) > 1e-9 ? [l - A[1][1], A[1][0]] : (i === 0 ? [1, 0] : [0, 1]);
          if (Math.abs(A[0][1]) < 1e-9 && Math.abs(A[1][0]) < 1e-9 && Math.abs(A[0][0] - A[1][1]) > 1e-9) v = Math.abs(l - A[0][0]) < 1e-9 ? [1, 0] : [0, 1];
          var n = Math.hypot(v[0], v[1]) || 1; v = [v[0] / n, v[1] / n];
          q.strokeStyle = '#c9b6ff'; q.setLineDash([6, 5]); q.lineWidth = 1.5; q.beginPath(); q.moveTo(o.X(-6 * v[0]), o.Y(-6 * v[1])); q.lineTo(o.X(6 * v[0]), o.Y(6 * v[1])); q.stroke(); q.setLineDash([]);
        });
        testo = 'λ₁ = ' + l1.toFixed(3) + ', λ₂ = ' + l2.toFixed(3) + t(' — le rette tratteggiate sono gli autovettori: vengono solo allungati, non ruotati.', ' — the dashed lines are the eigenvectors: they are only stretched, not rotated.');
      } else testo = 'λ = ' + (tr / 2).toFixed(3) + ' ± ' + (Math.sqrt(-disc) / 2).toFixed(3) + 'i' + t(' — autovalori complessi: nessuna direzione resta ferma, la trasformazione ruota.', ' — complex eigenvalues: no direction stays put, the map rotates.');
      q.restore();
      info.innerHTML = 'det A = <b class="bsiFX-num">' + det.toFixed(3) + '</b>: ' + t('il quadrato unitario (verde) diventa il parallelogramma giallo di area |det| = ', 'the unit square (green) becomes the yellow parallelogram of area |det| = ') + Math.abs(det).toFixed(3) + (det < 0 ? t(', con l’orientazione ribaltata.', ', with flipped orientation.') : '.') + '<br>' + testo;
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ── bilanciamento delle reazioni come nucleo ─────────────────────────── */
  function leggiFormula(s) {
    var carica = 0, m;
    s = s.trim();
    if (s === 'e^-' || s === 'e-' || s === 'e⁻') return { atomi: {}, carica: -1 };
    if ((m = /\^(\d*)([+-])$/.exec(s))) { carica = (m[1] ? +m[1] : 1) * (m[2] === '+' ? 1 : -1); s = s.slice(0, m.index); }
    var parti = s.split(/[·*]/), tot = {};
    parti.forEach(function (p) {
      var mm = /^(\d+)(.*)$/.exec(p), molt = 1; if (mm && p !== s) { molt = +mm[1]; p = mm[2]; }
      var pila = [{}], i = 0;
      while (i < p.length) {
        var c = p[i];
        if (c === '(' || c === '[') { pila.push({}); i++; continue; }
        if (c === ')' || c === ']') {
          i++; var n = ''; while (i < p.length && /\d/.test(p[i])) n += p[i++];
          var top = pila.pop(), k = n ? +n : 1;
          Object.keys(top).forEach(function (el) { pila[pila.length - 1][el] = (pila[pila.length - 1][el] || 0) + top[el] * k; });
          continue;
        }
        var e = /^[A-Z][a-z]?/.exec(p.slice(i));
        if (!e) throw new Error(t('formula non leggibile: ', 'unreadable formula: ') + s);
        i += e[0].length; var nn = ''; while (i < p.length && /\d/.test(p[i])) nn += p[i++];
        pila[pila.length - 1][e[0]] = (pila[pila.length - 1][e[0]] || 0) + (nn ? +nn : 1);
      }
      if (pila.length !== 1) throw new Error(t('parentesi non chiuse in ', 'unbalanced brackets in ') + s);
      Object.keys(pila[0]).forEach(function (el) { tot[el] = (tot[el] || 0) + pila[0][el] * molt; });
    });
    return { atomi: tot, carica: carica };
  }
  function bilancia(testo) {
    var lati = String(testo).split(/->|→|=|⟶/);
    if (lati.length !== 2) throw new Error(t('scrivi reagenti -> prodotti', 'write reactants -> products'));
    var spec = [], segno = [];
    lati.forEach(function (lato, k) {
      /* il «+» separa le specie, tranne quando chiude una carica (Fe^3+) */
      var cur = '';
      for (var i = 0; i < lato.length; i++) {
        var ch = lato[i];
        if (ch === '+' && !/\^\d*$/.test(cur.trim())) { if (cur.trim()) { spec.push(cur.trim()); segno.push(k ? -1 : 1); } cur = ''; }
        else cur += ch;
      }
      if (cur.trim()) { spec.push(cur.trim()); segno.push(k ? -1 : 1); }
    });
    var formule = spec.map(leggiFormula), elementi = [];
    formule.forEach(function (f) { Object.keys(f.atomi).forEach(function (e) { if (elementi.indexOf(e) < 0) elementi.push(e); }); });
    var righe = elementi.map(function (e) { return formule.map(function (f, j) { return fr(BigInt((f.atomi[e] || 0) * segno[j])); }); });
    if (formule.some(function (f) { return f.carica; })) { righe.push(formule.map(function (f, j) { return fr(BigInt(f.carica * segno[j])); })); elementi.push(t('carica', 'charge')); }
    var N = nucleo(righe, Qf);
    var r = { specie: spec, lato: segno.map(function (x) { return x > 0 ? 0 : 1; }), elementi: elementi, matrice: righe, dim: N.length };
    if (N.length === 1) {
      var v = interiOUnitario(N[0], Qf).map(function (s) { return +s.replace('−', '-'); });
      if (v.some(function (x) { return x < 0; })) v = v.map(function (x) { return -x; });
      r.coeff = v; r.valido = v.every(function (x) { return x > 0; });
    }
    return r;
  }
  function schedaBilancia(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { 'class': 'bsiFX-pannello', style: 'overflow-x:auto' });
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Scrivi la reazione senza coefficienti (cariche come <b>Fe^3+</b>, <b>MnO4^-</b>, elettroni <b>e^-</b>):', 'Type the reaction without coefficients (charges as <b>Fe^3+</b>, <b>MnO4^-</b>, electrons <b>e^-</b>):') }));
    var inp = F.el('input', { type: 'text', value: 'C3H8 + O2 -> CO2 + H2O', 'aria-label': t('reazione', 'reaction') }); pan.appendChild(inp);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
    ['C3H8 + O2 -> CO2 + H2O', 'KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2', 'MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O', 'Ca3(PO4)2 + SiO2 + C -> CaSiO3 + P4 + CO', 'C6H12O6 + O2 -> CO2 + H2O', 'CuSO4·5H2O -> CuSO4 + H2O'].forEach(function (s) {
      es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: s, onclick: function () { inp.value = s; calcola(); } }));
    });
    F.bottone(pan, ['Bilancia', 'Balance'], calcola);
    inp.addEventListener('change', calcola);
    function calcola() {
      var r;
      try { r = bilancia(inp.value); } catch (err) { dx.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; return; }
      var h = '<div class="bsiFX-nota">' + t('Ogni elemento dà un’equazione: Σ (atomi nei reagenti) − Σ (atomi nei prodotti) = 0. Matrice di composizione (prodotti col segno meno):', 'Each element gives an equation: Σ (atoms in reactants) − Σ (atoms in products) = 0. Composition matrix (products with a minus sign):') + '</div>';
      h += '<table class="bsiFX-tab" style="width:auto"><tr><th></th>' + r.specie.map(function (s) { return '<th>' + esc(s) + '</th>'; }).join('') + '</tr>' + r.matrice.map(function (riga, i) { return '<tr><td>' + esc(r.elementi[i]) + '</td>' + riga.map(function (v) { return '<td class="bsiFX-num">' + Qf.str(v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
      if (r.dim === 0) h += '<div class="bsiFX-eq bsiFX-ko">' + t('Il nucleo è vuoto: la reazione non si può bilanciare (manca o avanza qualche specie).', 'The null space is empty: the reaction cannot be balanced (a species is missing or extra).') + '</div>';
      else if (r.dim > 1) h += '<div class="bsiFX-eq">' + t('Il nucleo ha dimensione ', 'The null space has dimension ') + r.dim + t(': ci sono più reazioni indipendenti mescolate, i coefficienti non sono unici.', ': several independent reactions are mixed, the coefficients are not unique.') + '</div>';
      else {
        var lati = [[], []]; r.specie.forEach(function (s, j) { lati[r.lato[j]].push((r.coeff[j] === 1 ? '' : r.coeff[j] + ' ') + s); });
        h += '<div class="bsiFX-eq" style="font-size:1.05rem"><b>' + esc(lati[0].join(' + ') + ' → ' + lati[1].join(' + ')) + '</b></div><div class="bsiFX-nota">' + t('Un nucleo di dimensione 1: i coefficienti sono il vettore della base ridotto ai più piccoli interi.', 'A one-dimensional null space: the coefficients are the basis vector reduced to the smallest integers.') + (r.valido ? '' : ' <span class="bsiFX-ko">' + t('(qualche coefficiente è ≤ 0: controlla i lati)', '(some coefficient is ≤ 0: check the sides)') + '</span>') + '</div>';
      }
      dx.innerHTML = h;
    }
    calcola();
  }

  /* ── trasformazioni dello spazio (v238) ──────────────────────────────────
     M(s) = (1 − s) I + s A porta con continuita' l'identita' in A. Se Av = λv allora
     M(s)v = (1 − s + sλ) v: gli autovettori di A restano autovettori per ogni s, quindi le rette
     invarianti stanno ferme per tutta l'animazione mentre lo spazio si deforma attorno a loro.
     Il volume dell'immagine del cubo unitario e' |det M(s)| = |Π(1 − s + sλᵢ)|: a s = 1 e'
     |det A|, e se det A < 0 a meta' strada il cubo si schiaccia (det = 0) e si ribalta. */
  function analizza3(testo) {
    var L = leggiMatrice(testo), M = L.M, K = L.campo;
    if (M.length !== 3 || M[0].length !== 3) throw new Error(t('serve una matrice 3 × 3 (tre righe di tre numeri)', 'a 3 × 3 matrix is needed (three rows of three numbers)'));
    var A = M.map(function (r) { return r.map(K.val); }), det = determinante(M, K), E = autovalori(M, K), rette = [];
    E.valori.forEach(function (d) {
      if (d.im) return;
      var B = A.map(function (r, i) { return r.map(function (v, j) { return i === j ? v - d.re : v; }); });
      nucleoTollerante(B).forEach(function (v) { var n = Math.hypot(v[0], v[1], v[2]) || 1; rette.push({ lambda: d.re, v: [v[0] / n, v[1] / n, v[2] / n], dimensione: nucleoTollerante(B).length }); });
    });
    return { M: M, K: K, A: A, det: det, detNum: K.val(det), E: E, rette: rette };
  }
  function interpola(A, s) { return A.map(function (r, i) { return r.map(function (v, j) { return (1 - s) * (i === j ? 1 : 0) + s * v; }); }); }
  function det3n(M) { return M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]); }
  /* volume del parallelepipedo immagine del cubo unitario: prodotto misto delle colonne Ae₁·(Ae₂ × Ae₃) */
  function prodottoMisto(M) { var a = [M[0][0], M[1][0], M[2][0]], b = [M[0][1], M[1][1], M[2][1]], c = [M[0][2], M[1][2], M[2][2]]; return a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0]); }

  /* la scheda 3D: il pannello si costruisce subito (testo e comandi), la scena dopo, fuori dal gestore del clic */
  function scheda3d(costruisci, etichetta, rapporto) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'), posto = F.el('div');
      g.appendChild(pan); g.appendChild(dx); div.appendChild(g); dx.appendChild(posto);
      var vista = costruisci(pan, dx), lab = globale.BSILab3D;
      if (!lab) { posto.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serve il Laboratorio 3D (bsi-lab3d.js) per la vista tridimensionale.', 'The 3D Laboratory (bsi-lab3d.js) is needed for the three-dimensional view.') })); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); posto.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new lab.Scena(posto, rapporto || 0.72);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(etichetta));
          globale.requestAnimationFrame(function () { try { vista(S, lab, globale.THREE); } catch (e) { if (globale.console) console.error(e); } div._scena = S; });
        }, 0);
      }).catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  var ESEMPI3 = {
    gen: ['1 2 0\n0 2 0\n1 1 3', ['autovalori 1, 2, 3 (non simmetrica)', 'eigenvalues 1, 2, 3 (non-symmetric)']],
    simm: ['2 1 0\n1 2 1\n0 1 2', ['simmetrica: autovettori ortogonali', 'symmetric: orthogonal eigenvectors']],
    taglio: ['1 1 0\n0 1 0\n0 0 1', ['taglio: un piano di autovettori, det = 1', 'shear: a plane of eigenvectors, det = 1']],
    rot: ['0 -1 0\n1 0 0\n0 0 3/2', ['rotazione di 90° e allungamento: λ complessi', '90° rotation and stretch: complex λ']],
    rifl: ['1 0 0\n0 1 0\n0 0 -1', ['riflessione: det = −1, il cubo si ribalta', 'reflection: det = −1, the cube flips']],
    proiez: ['1 0 0\n0 1 0\n0 0 0', ['proiezione: det = 0, volume nullo', 'projection: det = 0, zero volume']],
    scala: ['2 0 0\n0 1/2 0\n0 0 3/2', ['dilatazione lungo gli assi, det = 3/2', 'scaling along the axes, det = 3/2']]
  };
  function schedaSpazio(pan) {
    var st = { testo: ESEMPI3.gen[0], vel: 1, pausa: false }, R = null, S = null, T = null, lab = null, tempo = 0, oggetti = {}, ultimo = 0;
    F.scelta(pan, ['Esempi', 'Examples'], Object.keys(ESEMPI3).map(function (k) { return [k, F.tt(ESEMPI3[k][1])]; }), 'gen', function (v) { st.testo = ta.value = ESEMPI3[v][0]; calcola(); });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('La matrice A (tre righe; frazioni e radici ammesse):', 'The matrix A (three rows; fractions and roots allowed):') }));
    var ta = F.el('textarea', { rows: '3', spellcheck: 'false', 'aria-label': t('matrice A 3 × 3', '3 × 3 matrix A'), style: 'width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px 8px;font:.9rem ui-monospace,monospace;resize:vertical' });
    ta.value = st.testo; pan.appendChild(ta);
    ta.addEventListener('change', function () { st.testo = ta.value; calcola(); });
    F.bottone(pan, ['Applica', 'Apply'], function () { st.testo = ta.value; calcola(); });
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli dell’animazione', 'Animation controls') });
    var bp = F.el('button', { type: 'button', testo: '❚❚', 'aria-label': t('Pausa', 'Pause'), onclick: function () { st.pausa = !st.pausa; bp.textContent = st.pausa ? '▶' : '❚❚'; bp.setAttribute('aria-label', st.pausa ? t('Avvia', 'Play') : t('Pausa', 'Pause')); if (S) S.avvia(); } });
    riga.appendChild(bp);
    riga.appendChild(F.el('button', { type: 'button', testo: '↺', 'aria-label': t('Ricomincia', 'Restart'), onclick: function () { tempo = 0; if (S) S.avvia(); } }));
    [0.5, 1, 2].forEach(function (v) { riga.appendChild(F.el('button', { type: 'button', testo: '×' + (v === 0.5 ? '½' : v), 'aria-label': t('Velocità ', 'Speed ') + v, onclick: function () { st.vel = v; } })); });
    pan.appendChild(riga);
    var fase = F.el('div', { 'class': 'bsiFX-nota' }), info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(fase); pan.appendChild(info);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Il cubo [0, 1]³ (con il reticolo) viene deformato da M(s) = (1 − s)I + sA, con s che va da 0 a 1 e torna: le colonne di A sono le immagini dei tre spigoli e₁, e₂, e₃ (frecce rossa, verde e azzurra). Le rette gialle sono gli autovettori: poiché M(s)v = (1 − s + sλ)v, restano ferme per tutto il tempo e i punti su di esse si allungano solo del fattore λ. Il volume del parallelepipedo è |det M(s)|, il prodotto dei fattori (1 − s + sλ): a fine corsa è |det A|, calcolato qui in frazioni esatte con l’eliminazione di Gauss e controllato con il prodotto misto delle colonne. Se det A < 0 il cubo passa per un volume nullo e si ribalta (cambia l’orientazione); se det A = 0 lo spazio si schiaccia su un piano o una retta. Autovalori complessi: in quel piano A ruota, e nessuna retta resta ferma.',
      'The cube [0, 1]³ (with its lattice) is deformed by M(s) = (1 − s)I + sA, with s going from 0 to 1 and back: the columns of A are the images of the three edges e₁, e₂, e₃ (red, green and blue arrows). The yellow lines are the eigenvectors: since M(s)v = (1 − s + sλ)v, they stay put all along and points on them are only stretched by λ. The volume of the parallelepiped is |det M(s)|, the product of the factors (1 − s + sλ): at the end it is |det A|, computed here in exact fractions by Gaussian elimination and checked with the triple product of the columns. If det A < 0 the cube passes through zero volume and flips (orientation reverses); if det A = 0 space collapses onto a plane or a line. Complex eigenvalues: in that plane A rotates, and no line stays put.') }));
    function calcola() {
      try { R = analizza3(st.testo); }
      catch (e) { R = null; info.innerHTML = '<span class="bsiFX-ko">' + t('Matrice non valida: ', 'Invalid matrix: ') + esc(e.message) + '</span>'; fase.textContent = ''; if (S) { S.pulisci(); S.aggiungi(lab.assi(T, 3, ['x', 'y', 'z'], 0.3)); } return; }
      var K = R.K, vals = R.E.valori.filter(function (d) { return !(d.im < 0); }).map(function (d) { var s = d.im ? C.numeroBello(+d.re.toPrecision(8)) + ' ± ' + C.numeroBello(+Math.abs(d.im).toPrecision(8)) + 'i' : C.numeroBello(+d.re.toPrecision(10)); return s + (d.molt > 1 ? ' (×' + d.molt + ')' : ''); });
      var righe = R.rette.map(function (r) { return 'λ = ' + C.numeroBello(+r.lambda.toPrecision(10)) + ': v = (' + r.v.map(function (x) { return (Math.abs(x) < 1e-12 ? 0 : x).toFixed(3); }).join(', ') + ')' + (r.dimensione > 1 ? t(' (fa parte di un ', ' (part of a ') + (r.dimensione === 2 ? t('piano', 'plane') : t('spazio', 'space')) + t(' di autovettori)', ' of eigenvectors)') : ''); });
      info.innerHTML = 'det A = <b class="bsiFX-num">' + esc(K.str(R.det)) + '</b> (' + t('Gauss, ', 'Gauss, ') + (K === Qf ? t('frazioni esatte', 'exact fractions') : t('numeri reali', 'real numbers')) + ') · ' + t('prodotto misto delle colonne ', 'triple product of the columns ') + C.numeroBello(+prodottoMisto(R.A).toPrecision(10)) + '<br>' +
        t('polinomio caratteristico: ', 'characteristic polynomial: ') + '<span class="bsiFX-num">' + esc(stampaPol(R.E.pol, K)) + '</span><br>' + t('autovalori: ', 'eigenvalues: ') + '<b>' + esc(vals.join(', ')) + '</b><br>' + (righe.length ? esc(righe.join(' · ')) : t('nessun autovettore reale', 'no real eigenvector'));
      tempo = 0; scena();
    }
    function v3(p) { return new T.Vector3(p[0], p[1], p[2]); }
    function scena() {
      if (!S || !R) return;
      S.pulisci(); oggetti = {};
      /* il reticolo del cubo [0, 1]³ con passo 1/3: le posizioni di partenza si tengono a parte */
      var base = [], n = 3, i, j, k;
      for (i = 0; i <= n; i++) for (j = 0; j <= n; j++) { base.push([i / n, j / n, 0], [i / n, j / n, 1]); base.push([i / n, 0, j / n], [i / n, 1, j / n]); base.push([0, i / n, j / n], [1, i / n, j / n]); }
      var gr = new T.BufferGeometry(); gr.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(base.length * 3), 3));
      oggetti.ret = new T.LineSegments(gr, new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.5 })); oggetti.base = base; S.aggiungi(oggetti.ret);
      /* le facce del cubo: 12 triangoli trasparenti */
      var V = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], fac = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3]], idx = [];
      fac.forEach(function (f) { idx.push(f[0], f[1], f[2], f[0], f[2], f[3]); });
      var gc = new T.BufferGeometry(); gc.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(24), 3)); gc.setIndex(idx);
      oggetti.cubo = new T.Mesh(gc, new T.MeshStandardMaterial({ color: 0x7c6fff, transparent: true, opacity: 0.4, side: T.DoubleSide, depthWrite: false, roughness: 0.5 })); oggetti.V = V; S.aggiungi(oggetti.cubo);
      /* le immagini di e₁, e₂, e₃ */
      oggetti.e = [0xff6b6b, 0x5eead4, 0x6bcfff].map(function (c, q) { var f = lab.freccia(T, [0, 0, 0], q === 0 ? [1, 0, 0] : q === 1 ? [0, 1, 0] : [0, 0, 1], c, 0.25); S.aggiungi(f); return f; });
      /* le rette invarianti e, su ciascuna, il vettore v che diventa (1 − s + sλ)v */
      oggetti.av = [];
      R.rette.forEach(function (r) {
        var d = r.v, Lr = 4.2; S.aggiungi(lab.linea(T, [[-Lr * d[0], -Lr * d[1], -Lr * d[2]], [Lr * d[0], Lr * d[1], Lr * d[2]]], 0xffd24a, 0.55));
        var f = lab.freccia(T, [0, 0, 0], d, 0xffd24a, 0.25); S.aggiungi(f); oggetti.av.push({ f: f, r: r });
        var et = lab.testo3d(T, 'λ = ' + C.numeroBello(+r.lambda.toPrecision(6)), '#ffd24a', 0.26); et.position.set(Lr * d[0] * 0.92, Lr * d[1] * 0.92, Lr * d[2] * 0.92 + 0.2); S.aggiungi(et);
      });
      S.aggiungi(lab.assi(T, 3.2, ['x', 'y', 'z'], 0.3));
      /* l'inquadratura segue il cubo: centro fra il cubo di partenza e la sua immagine, distanza dalla dimensione */
      var est = 1.8; V.forEach(function (p) { var q = [0, 1, 2].map(function (r) { return R.A[r][0] * p[0] + R.A[r][1] * p[1] + R.A[r][2] * p[2]; }); est = Math.max(est, Math.hypot(q[0], q[1], q[2])); });
      var cA = [0, 1, 2].map(function (r) { return (R.A[r][0] + R.A[r][1] + R.A[r][2]) / 2; });
      S.vista.bersaglio.set((0.5 + cA[0]) / 2, (0.5 + cA[1]) / 2, (0.5 + cA[2]) / 2);
      S.inquadra(Math.max(7.5, 2.1 * est), S.vistaIniziale ? S.vista.th : -0.6, S.vistaIniziale ? S.vista.ph : 1.15);
      S.ogniFotogramma(function (dt) { if (st.pausa) return false; tempo += dt * st.vel; aggiorna(dt); });
      aggiorna(0);
    }
    /* un ciclo di 8 s: 3 s da I ad A, 1 s fermo su A, 3 s di ritorno, 1 s fermo su I */
    function parametro() { var u = tempo % 8, f = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }; return u < 3 ? f(u / 3) : u < 4 ? 1 : u < 7 ? 1 - f((u - 4) / 3) : 0; }
    function aggiorna(dt) {
      if (!R || !oggetti.ret) return;
      var s = parametro(), M = interpola(R.A, s), ap = function (p) { return [M[0][0] * p[0] + M[0][1] * p[1] + M[0][2] * p[2], M[1][0] * p[0] + M[1][1] * p[1] + M[1][2] * p[2], M[2][0] * p[0] + M[2][1] * p[1] + M[2][2] * p[2]]; };
      var at = oggetti.ret.geometry.attributes.position; oggetti.base.forEach(function (p, i) { var q = ap(p); at.setXYZ(i, q[0], q[1], q[2]); }); at.needsUpdate = true; oggetti.ret.geometry.computeBoundingSphere();
      var ac = oggetti.cubo.geometry.attributes.position; oggetti.V.forEach(function (p, i) { var q = ap(p); ac.setXYZ(i, q[0], q[1], q[2]); }); ac.needsUpdate = true; oggetti.cubo.geometry.computeVertexNormals(); oggetti.cubo.geometry.computeBoundingSphere();
      oggetti.e.forEach(function (f, q) { var c = [M[0][q], M[1][q], M[2][q]], l = Math.hypot(c[0], c[1], c[2]); f.visible = l > 1e-6; if (l > 1e-6) { f.setDirection(v3(c).normalize()); f.setLength(l, Math.min(0.25, 0.4 * l), Math.min(0.15, 0.25 * l)); } });
      oggetti.av.forEach(function (o) { var fct = 1 - s + s * o.r.lambda, d = o.r.v, l = Math.abs(fct); o.f.visible = l > 1e-6; if (l > 1e-6) { o.f.setDirection(v3(fct > 0 ? d : [-d[0], -d[1], -d[2]])); o.f.setLength(l, Math.min(0.25, 0.4 * l), Math.min(0.15, 0.25 * l)); } });
      var dM = det3n(M);
      S.didascalia.textContent = 's = ' + s.toFixed(2) + ' · det M(s) = ' + dM.toFixed(3) + ' · ' + t('volume ', 'volume ') + Math.abs(dM).toFixed(3);
      var ora = Date.now(); if (dt && ora - ultimo < 250) return; ultimo = ora;
      fase.innerHTML = '<b>M(s) = (1 − s)I + sA, s = ' + s.toFixed(2) + '</b><br>' + t('volume del parallelepipedo = |det M(s)| = ', 'parallelepiped volume = |det M(s)| = ') + '<b class="bsiFX-num">' + Math.abs(dM).toFixed(4) + '</b>' + (dM < -1e-9 ? t(' (orientazione rovesciata)', ' (orientation reversed)') : Math.abs(dM) < 1e-9 ? t(' (schiacciato)', ' (flattened)') : '');
    }
    calcola();
    return function (Sc, L3, Tr) { S = Sc; lab = L3; T = Tr; scena(); };
  }

  F.calcolo.lineare = { Qf: Qf, Rf: Rf, fr: fr, leggiMatrice: leggiMatrice, rref: rref, determinante: determinante, inversa: inversa, nucleo: nucleo, risolviSistema: risolviSistema, polCaratteristico: polCaratteristico, autovalori: autovalori, moltiplica: moltiplica, bilancia: bilancia, leggiFormula: leggiFormula, analizza3: analizza3, interpola: interpola, prodottoMisto: prodottoMisto, det3n: det3n };

  F.sezione('smatlin', {
    titolo: ['🔲 Algebra lineare', '🔲 Linear algebra'],
    sotto: ['Matrici in frazioni esatte con tutti i passaggi di Gauss-Jordan: sistemi, determinante, inversa, rango, nucleo, autovalori. Le trasformazioni del piano e il bilanciamento delle reazioni come nucleo di una matrice.',
            'Matrices in exact fractions with every Gauss-Jordan step: systems, determinant, inverse, rank, null space, eigenvalues. Plane transformations and reaction balancing as the null space of a matrix.'],
    schede: [
      { nome: ['Matrici e sistemi', 'Matrices and systems'], costruisci: schedaMatrici },
      { nome: ['Trasformazioni del piano', 'Plane transformations'], costruisci: schedaPiano },
      { nome: ['Bilanciare con il nucleo', 'Balancing with the null space'], costruisci: schedaBilancia },
      { nome: ['🧊 Trasformazioni dello spazio', '🧊 Space transformations'], costruisci: scheda3d(schedaSpazio, ['Trasformazione lineare 3D di un cubo, da I ad A, con le rette invarianti', '3D linear transformation of a cube, from I to A, with the invariant lines']) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
