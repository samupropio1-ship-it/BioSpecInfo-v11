/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-topologia.js — 🍩 topologia e superfici
   BioSpecInfo · © Samuele Pio Provenzano

   · CARATTERISTICA DI EULERO: i cinque solidi platonici, un prisma e una
     «cornice» (poliedro toroidale) in fil di ferro 3D che si trascina col
     dito; V, S, F sono contati dalle liste di vertici e facce (le facce dei
     solidi convessi si trovano cercando i piani d'appoggio), χ = V − S + F
     = 2 − 2g;
   · SUPERFICI PARAMETRICHE: sfera, toro, cilindro, nastro di Möbius,
     bottiglia di Klein (immersione «a otto»); una freccia normale portata
     lungo un giro torna capovolta sulle superfici non orientabili; χ, bordi e
     orientabilita' sono calcolati dalla maglia con le sue identificazioni;
   · POLIGONI FONDAMENTALI: il quadrato con i lati incollati (sfera, toro,
     piano proiettivo, Klein, e la parola che si vuole): classi di vertici,
     lati, una faccia, χ, orientabilita' e la superficie che ne risulta;
   · NODI: trifoglio, nodo a otto, nodo torico (2, 5) e banali, disegnati da
     una parametrizzazione; gli incroci del diagramma piano sono trovati per
     intersezione, e le colorazioni di Fox (mod p) sono contate con
     l'eliminazione di Gauss: il trifoglio ha 9 tricolorazioni, il banale 3.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PHI = (1 + Math.sqrt(5)) / 2;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function croce(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function pscal(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(a) { var l = Math.sqrt(pscal(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function uf(n) { var p = []; for (var i = 0; i < n; i++) p.push(i); function r(x) { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; } return { r: r, u: function (a, b) { p[r(a)] = r(b); } }; }

  /* ═══ calcoli: poliedri ═════════════════════════════════════════════════ */
  /* facce di un poliedro convesso: per ogni terna di vertici, il piano e' d'appoggio se tutti gli altri
     stanno da una parte; la faccia sono tutti i vertici sul piano, ordinati per angolo attorno al centro */
  function facceConvesse(V) {
    var n = V.length, viste = {}, facce = [], c0 = [0, 0, 0];
    V.forEach(function (p) { c0 = [c0[0] + p[0] / n, c0[1] + p[1] / n, c0[2] + p[2] / n]; });
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) for (var k = j + 1; k < n; k++) {
      var nr = croce(sub(V[j], V[i]), sub(V[k], V[i])), l = Math.sqrt(pscal(nr, nr)); if (l < 1e-9) continue; nr = [nr[0] / l, nr[1] / l, nr[2] / l];
      var d = pscal(nr, V[i]), pos = 0, neg = 0, sul = [];
      for (var m = 0; m < n; m++) { var s = pscal(nr, V[m]) - d; if (s > 1e-7) pos++; else if (s < -1e-7) neg++; else sul.push(m); }
      if (pos && neg) continue;
      var chiave = sul.join(','); if (viste[chiave]) continue; viste[chiave] = 1;
      if (pscal(nr, sub(c0, V[i])) > 0) nr = [-nr[0], -nr[1], -nr[2]];
      var cf = [0, 0, 0]; sul.forEach(function (m) { cf = [cf[0] + V[m][0] / sul.length, cf[1] + V[m][1] / sul.length, cf[2] + V[m][2] / sul.length]; });
      var e1 = norm(sub(V[sul[0]], cf)), e2 = croce(nr, e1);
      sul.sort(function (a, b) { var pa = sub(V[a], cf), pb = sub(V[b], cf); return Math.atan2(pscal(pa, e2), pscal(pa, e1)) - Math.atan2(pscal(pb, e2), pscal(pb, e1)); });
      facce.push(sul);
    }
    return facce;
  }
  function tetraedro() { return [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]; }
  function cubo() { var V = []; [-1, 1].forEach(function (x) { [-1, 1].forEach(function (y) { [-1, 1].forEach(function (z) { V.push([x, y, z]); }); }); }); return V; }
  function ottaedro() { return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(function (p) { return p.map(function (c) { return c * 1.4; }); }); }
  function icosaedro() { var V = []; [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { V.push([0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]); }); }); return V.map(function (p) { return p.map(function (c) { return c * 0.85; }); }); }
  /* dodecaedro come duale dell'icosaedro: i centri delle 20 facce triangolari */
  function dodecaedro() { var V = icosaedro(); return facceConvesse(V).map(function (f) { var c = [0, 0, 0]; f.forEach(function (m) { c = [c[0] + V[m][0] / 3, c[1] + V[m][1] / 3, c[2] + V[m][2] / 3]; }); return c.map(function (x) { return x * 1.35; }); }); }
  function prisma(n) { var V = []; for (var k = 0; k < n; k++) { var a = 2 * Math.PI * k / n; V.push([1.3 * Math.cos(a), 1.3 * Math.sin(a), 0.8], [1.3 * Math.cos(a), 1.3 * Math.sin(a), -0.8]); } return V; }
  /* la cornice: quadrato esterno ±2, interno ±1, spessore ±0,5 (non convesso: facce scritte a mano) */
  function cornice() {
    var V = [], Fc = [], q = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    [1.6, 0.8].forEach(function (s) { [0.4, -0.4].forEach(function (z) { q.forEach(function (c) { V.push([s * c[0], s * c[1], z]); }); }); });
    /* indici: esterno sopra 0–3, esterno sotto 4–7, interno sopra 8–11, interno sotto 12–15 */
    for (var k = 0; k < 4; k++) { var k1 = (k + 1) % 4; Fc.push([k, k1, 8 + k1, 8 + k], [4 + k, 4 + k1, 12 + k1, 12 + k], [k, k1, 4 + k1, 4 + k], [8 + k, 8 + k1, 12 + k1, 12 + k]); }
    return { V: V, F: Fc };
  }
  var SOLIDI = {
    tetra: [['tetraedro', 'tetrahedron'], function () { var V = tetraedro(); return { V: V, F: facceConvesse(V) }; }],
    cubo: [['cubo', 'cube'], function () { var V = cubo(); return { V: V, F: facceConvesse(V) }; }],
    otta: [['ottaedro', 'octahedron'], function () { var V = ottaedro(); return { V: V, F: facceConvesse(V) }; }],
    dode: [['dodecaedro', 'dodecahedron'], function () { var V = dodecaedro(); return { V: V, F: facceConvesse(V) }; }],
    icosa: [['icosaedro', 'icosahedron'], function () { var V = icosaedro(); return { V: V, F: facceConvesse(V) }; }],
    prisma: [['prisma esagonale', 'hexagonal prism'], function () { var V = prisma(6); return { V: V, F: facceConvesse(V) }; }],
    cornice: [['cornice (toro poliedrico)', 'picture frame (polyhedral torus)'], cornice]
  };
  /* V, S (spigoli), F contati dai dati; ogni spigolo deve stare in esattamente due facce (superficie chiusa) */
  function eulero(P) {
    var usati = {}, spig = {}; P.F.forEach(function (f) { f.forEach(function (v, i) { usati[v] = 1; var w = f[(i + 1) % f.length], k = Math.min(v, w) + '-' + Math.max(v, w); spig[k] = (spig[k] || 0) + 1; }); });
    var V = Object.keys(usati).length, S = Object.keys(spig).length, Fn = P.F.length, chiusa = Object.keys(spig).every(function (k) { return spig[k] === 2; });
    var lati = {}; P.F.forEach(function (f) { lati[f.length] = (lati[f.length] || 0) + 1; });
    return { V: V, S: S, F: Fn, chi: V - S + Fn, g: (2 - (V - S + Fn)) / 2, chiusa: chiusa, spigoli: Object.keys(spig).map(function (k) { return k.split('-').map(Number); }), lati: lati };
  }

  /* ═══ calcoli: superfici parametriche ═══════════════════════════════════
     ogni superficie: P(u, v), intervalli, e l'incollaggio della griglia (indici canonici) */
  var SUP = {
    sfera: { nome: ['sfera', 'sphere'], u: [0, 2 * Math.PI], v: [0, Math.PI], v0: Math.PI / 2,
      P: function (u, v) { return [1.3 * Math.sin(v) * Math.cos(u), 1.3 * Math.sin(v) * Math.sin(u), 1.3 * Math.cos(v)]; },
      canon: function (i, j, nu, nv) { return j === 0 ? 'N' : j === nv ? 'S' : (i % nu) + ',' + j; } },
    toro: { nome: ['toro', 'torus'], u: [0, 2 * Math.PI], v: [0, 2 * Math.PI], v0: 0,
      P: function (u, v) { return [(1.2 + 0.5 * Math.cos(v)) * Math.cos(u), (1.2 + 0.5 * Math.cos(v)) * Math.sin(u), 0.5 * Math.sin(v)]; },
      canon: function (i, j, nu, nv) { return (i % nu) + ',' + (j % nv); } },
    cilindro: { nome: ['cilindro (anello)', 'cylinder (annulus)'], u: [0, 2 * Math.PI], v: [-1, 1], v0: 0,
      P: function (u, v) { return [1.3 * Math.cos(u), 1.3 * Math.sin(u), 0.5 * v]; },
      canon: function (i, j, nu) { return (i % nu) + ',' + j; } },
    mobius: { nome: ['nastro di Möbius', 'Möbius strip'], u: [0, 2 * Math.PI], v: [-1, 1], v0: 0,
      P: function (u, v) { var r = 1.3 + 0.5 * v * Math.cos(u / 2); return [r * Math.cos(u), r * Math.sin(u), 0.5 * v * Math.sin(u / 2)]; },
      canon: function (i, j, nu, nv) { return i === nu ? '0,' + (nv - j) : i + ',' + j; } },
    klein: { nome: ['bottiglia di Klein (a otto)', 'Klein bottle (figure-8)'], u: [0, 2 * Math.PI], v: [0, 2 * Math.PI], v0: 0,
      P: function (u, v) { var c = Math.cos(u / 2), s = Math.sin(u / 2), r = 1.1 + c * Math.sin(v) - s * Math.sin(2 * v); return [0.75 * r * Math.cos(u), 0.75 * r * Math.sin(u), 0.75 * (s * Math.sin(v) + c * Math.sin(2 * v))]; },
      canon: function (i, j, nu, nv) { return i === nu ? '0,' + ((nv - j) % nv) : i + ',' + (j % nv); } }
  };
  /* la maglia: quadrilateri della griglia con i vertici incollati; χ, bordi, orientabilita' combinatoria */
  function maglia(k, nu, nv) {
    var S = SUP[k], id = {}, nV = 0, facce = [];
    function c(i, j) { var key = S.canon(i, j, nu, nv); if (!(key in id)) id[key] = nV++; return id[key]; }
    for (var i = 0; i < nu; i++) for (var j = 0; j < nv; j++) {
      var q = [c(i, j), c(i + 1, j), c(i + 1, j + 1), c(i, j + 1)], f = [];
      q.forEach(function (v, m) { if (v !== q[(m + 1) % 4]) f.push(v); });
      if (f.length >= 3) facce.push(f);
    }
    var spig = {}; facce.forEach(function (f, fi) { f.forEach(function (v, m) { var w = f[(m + 1) % f.length], key = Math.min(v, w) + '-' + Math.max(v, w); (spig[key] = spig[key] || []).push([fi, v, w]); }); });
    var chiavi = Object.keys(spig), bordo = chiavi.filter(function (key) { return spig[key].length === 1; });
    var U = uf(nV), toccati = {}; bordo.forEach(function (key) { var e = key.split('-').map(Number); U.u(e[0], e[1]); toccati[e[0]] = toccati[e[1]] = 1; });
    var comp = {}; Object.keys(toccati).forEach(function (v) { comp[U.r(+v)] = 1; });
    /* orientabilita': si propaga un verso a tutte le facce; uno spigolo comune va percorso in versi opposti */
    var verso = facce.map(function () { return 0; }), ok = true, coda = [0]; verso[0] = 1;
    while (coda.length && ok) {
      var fi = coda.shift();
      facce[fi].forEach(function (v, m) {
        var w = facce[fi][(m + 1) % facce[fi].length], key = Math.min(v, w) + '-' + Math.max(v, w);
        spig[key].forEach(function (e) {
          if (e[0] === fi) return;
          /* se l'altra faccia, nel suo verso naturale, percorre lo spigolo come noi, va invertita */
          var vuole = e[1] === v ? -verso[fi] : verso[fi];
          if (!verso[e[0]]) { verso[e[0]] = vuole; coda.push(e[0]); } else if (verso[e[0]] !== vuole) ok = false;
        });
      });
    }
    return { V: nV, S: chiavi.length, F: facce.length, chi: nV - chiavi.length + facce.length, bordi: Object.keys(comp).length, orientabile: ok };
  }
  /* derivate parziali e normale per differenze finite */
  function normale(k, u, v) {
    var S = SUP[k], h = 1e-5, Pu = sub(S.P(u + h, v), S.P(u - h, v)), Pv = sub(S.P(u, v + h), S.P(u, v - h));
    return norm(croce(Pu, Pv));
  }
  /* trasporto della normale lungo il giro u: 0 → 2π a v = v0, scegliendo a ogni passo il verso continuo;
     restituisce il prodotto scalare con la normale di partenza (+1 si conserva, −1 capovolta) */
  function trasporta(k, M) {
    var S = SUP[k], M2 = M || 720, n = normale(k, 0, S.v0), n0 = n;
    for (var i = 1; i <= M2; i++) { var m = normale(k, 2 * Math.PI * i / M2, S.v0); if (pscal(m, n) < 0) m = [-m[0], -m[1], -m[2]]; n = m; }
    return { fine: n, prodotto: pscal(n, n0), chiuso: Math.hypot.apply(null, sub(S.P(2 * Math.PI, S.v0), S.P(0, S.v0))) < 1e-9 };
  }

  /* ═══ calcoli: poligoni fondamentali ════════════════════════════════════
     parola: lettere minuscole, maiuscola = inversa (aBAb…); il lato i va dal vertice i al vertice i+1 */
  var PAROLE = { sfera: 'abBA', toro: 'abAB', proiettivo: 'abab', klein: 'abAb', genere2: 'abABcdCD', bottiglia2: 'aabb' };
  function leggiParola(w) {
    var lati = [], conta = {};
    for (var i = 0; i < w.length; i++) { var ch = w[i]; if (!/[a-zA-Z]/.test(ch)) continue; var l = ch.toLowerCase(); lati.push({ l: l, e: ch === l ? 1 : -1 }); conta[l] = (conta[l] || 0) + 1; }
    var valida = lati.length >= 2 && Object.keys(conta).every(function (l) { return conta[l] === 2; });
    return { lati: lati, valida: valida };
  }
  function poligono(w) {
    var P = leggiParola(w); if (!P.valida) return null;
    var n = P.lati.length, U = uf(n), primo = {};
    P.lati.forEach(function (s, i) {
      var coda = s.e > 0 ? i : (i + 1) % n, testa = s.e > 0 ? (i + 1) % n : i;
      if (primo[s.l]) { U.u(primo[s.l][0], coda); U.u(primo[s.l][1], testa); } else primo[s.l] = [coda, testa];
    });
    var classi = {}, classe = []; for (var i = 0; i < n; i++) { var r = U.r(i); if (!(r in classi)) classi[r] = Object.keys(classi).length; classe.push(classi[r]); }
    var V = Object.keys(classi).length, S = n / 2, chi = V - S + 1;
    var segni = {}; P.lati.forEach(function (s) { segni[s.l] = (segni[s.l] || 0) + s.e; });
    var orientabile = Object.keys(segni).every(function (l) { return segni[l] === 0; });
    /* classificazione: orientabile → genere g = (2 − χ)/2; non orientabile → somma di k = 2 − χ piani proiettivi */
    return { lati: P.lati, V: V, S: S, F: 1, chi: chi, orientabile: orientabile, genere: orientabile ? (2 - chi) / 2 : 2 - chi, classe: classe };
  }

  /* ═══ calcoli: nodi ═════════════════════════════════════════════════════ */
  var NODI = {
    banale: [['banale (cerchio)', 'unknot (circle)'], function (s) { return [2 * Math.cos(s), 2 * Math.sin(s), 0]; }],
    riccio: [['banale con un ricciolo', 'unknot with a kink'], function (s) { return [2.4 * Math.sin(s), 1.4 * Math.sin(2 * s), Math.cos(s)]; }],
    trifoglio: [['trifoglio 3₁', 'trefoil 3₁'], function (s) { return [Math.sin(s) + 2 * Math.sin(2 * s), Math.cos(s) - 2 * Math.cos(2 * s), -Math.sin(3 * s)]; }],
    otto: [['nodo a otto 4₁', 'figure-eight 4₁'], function (s) { return [(2 + Math.cos(2 * s)) * Math.cos(3 * s), (2 + Math.cos(2 * s)) * Math.sin(3 * s), Math.sin(4 * s)]; }],
    cinque: [['nodo torico (2,5) 5₁', 'torus knot (2,5) 5₁'], function (s) { return [(2 + Math.cos(5 * s)) * Math.cos(2 * s), (2 + Math.cos(5 * s)) * Math.sin(2 * s), Math.sin(5 * s)]; }]
  };
  /* diagramma piano: proiezione su xy, incroci per intersezione dei segmenti, sopra/sotto dalla quota */
  function diagramma(k, M) {
    M = M || 600; var f = NODI[k][1], P = [], X = [];
    for (var i = 0; i < M; i++) P.push(f(2 * Math.PI * i / M));
    for (i = 0; i < M; i++) for (var j = i + 2; j < M; j++) {
      if (i === 0 && j === M - 1) continue;
      var a = P[i], b = P[(i + 1) % M], c = P[j], d = P[(j + 1) % M], r0 = b[0] - a[0], r1 = b[1] - a[1], s0 = d[0] - c[0], s1 = d[1] - c[1], den = r0 * s1 - r1 * s0;
      if (Math.abs(den) < 1e-15) continue;
      var q0 = c[0] - a[0], q1 = c[1] - a[1], u = (q0 * s1 - q1 * s0) / den, v = (q0 * r1 - q1 * r0) / den;
      if (u >= 0 && u < 1 && v >= 0 && v < 1) { var za = a[2] + u * (b[2] - a[2]), zc = c[2] + v * (d[2] - c[2]); X.push(za > zc ? { sopra: i + u, sotto: j + v } : { sopra: j + v, sotto: i + u }); }
    }
    /* archi: il filo si spezza a ogni passaggio di sotto */
    var tagli = X.map(function (x) { return x.sotto; }).sort(function (a, b) { return a - b; }), n = Math.max(1, tagli.length);
    function arco(p) { if (!tagli.length) return 0; var c = 0; while (c < tagli.length && tagli[c] <= p) c++; return (c - 1 + n) % n; }
    X.forEach(function (x) { var c = tagli.indexOf(x.sotto); x.o = arco(x.sopra); x.u1 = (c - 1 + n) % n; x.u2 = c; });
    return { P: P, incroci: X, archi: n, tagli: tagli, arco: arco, M: M };
  }
  /* colorazioni di Fox mod p: a ogni incrocio 2·c(sopra) ≡ c(sotto₁) + c(sotto₂). Le soluzioni sono uno spazio
     vettoriale su Z_p: numero = p^(dim nucleo), con l'eliminazione di Gauss mod p */
  function matriceFox(D) { return D.incroci.map(function (x) { var r = []; for (var a = 0; a < D.archi; a++) r.push(0); r[x.o] += 2; r[x.u1] -= 1; r[x.u2] -= 1; return r; }); }
  function rangoMod(A, p, nc) {
    var M = A.map(function (r) { return r.map(function (x) { return ((x % p) + p) % p; }); }), rk = 0;
    for (var c = 0; c < nc && rk < M.length; c++) {
      var piv = -1; for (var i = rk; i < M.length; i++) if (M[i][c]) { piv = i; break; } if (piv < 0) continue;
      var tmp = M[rk]; M[rk] = M[piv]; M[piv] = tmp;
      var inv = 1; while ((M[rk][c] * inv) % p !== 1) inv++;
      for (i = 0; i < M.length; i++) if (i !== rk && M[i][c]) { var f = (M[i][c] * inv) % p; for (var j = 0; j < nc; j++) M[i][j] = ((M[i][j] - f * M[rk][j]) % p + p) % p; }
      rk++;
    }
    return rk;
  }
  function colorazioni(D, p) { return Math.pow(p, D.archi - rangoMod(matriceFox(D), p, D.archi)); }
  /* elenco esplicito (forza bruta) per l'animazione e come secondo metodo */
  function elencoColorazioni(D, p, max) {
    var out = [], n = D.archi, tot = Math.pow(p, n); if (tot > (max || 200000)) return null;
    for (var m = 0; m < tot; m++) { var c = [], x = m; for (var a = 0; a < n; a++) { c.push(x % p); x = Math.floor(x / p); } if (D.incroci.every(function (q) { return ((2 * c[q.o] - c[q.u1] - c[q.u2]) % p + p) % p === 0; })) out.push(c); }
    return out;
  }
  /* determinante del nodo: |det| di un minore (n−1)×(n−1) della matrice di Fox (Bareiss, interi esatti) */
  function determinante(D) {
    if (D.archi <= 1) return 1;
    var A = matriceFox(D).slice(0, D.archi - 1).map(function (r) { return r.slice(0, D.archi - 1); }), n = A.length, prec = 1, segno = 1;
    for (var k = 0; k < n - 1; k++) {
      if (!A[k][k]) { var s = k + 1; while (s < n && !A[s][k]) s++; if (s === n) return 0; var tmp = A[k]; A[k] = A[s]; A[s] = tmp; segno = -segno; }
      for (var i = k + 1; i < n; i++) for (var j = k + 1; j < n; j++) A[i][j] = (A[i][j] * A[k][k] - A[i][k] * A[k][j]) / prec;
      prec = A[k][k];
    }
    return Math.abs(segno * A[n - 1][n - 1]);
  }

  F.calcolo.topologia = { facceConvesse: facceConvesse, SOLIDI: SOLIDI, eulero: eulero, SUP: SUP, maglia: maglia, normale: normale, trasporta: trasporta, PAROLE: PAROLE, poligono: poligono, NODI: NODI, diagramma: diagramma, colorazioni: colorazioni, elencoColorazioni: elencoColorazioni, determinante: determinante, rangoMod: rangoMod };

  /* ═══ la vista 3D: rotazione, prospettiva, trascinamento ═════════════════ */
  function vista3D(cv) {
    var V = { yaw: 0.6, pitch: 0.5, giu: false, x: 0, y: 0, fermo: 0 };
    cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
    cv.addEventListener('pointerdown', function (e) { V.giu = true; V.x = e.clientX; V.y = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (er) { } });
    cv.addEventListener('pointermove', function (e) { if (!V.giu) return; V.yaw += (e.clientX - V.x) * 0.01; V.pitch = Math.max(-1.5, Math.min(1.5, V.pitch + (e.clientY - V.y) * 0.01)); V.x = e.clientX; V.y = e.clientY; V.fermo = 2; });
    function su() { V.giu = false; }
    cv.addEventListener('pointerup', su); cv.addEventListener('pointercancel', su);
    /* proietta: rotazione attorno a z (yaw) e poi attorno a x (pitch), prospettiva debole */
    V.proietta = function (p, W, H, sc) {
      var cy = Math.cos(V.yaw), sy = Math.sin(V.yaw), cp = Math.cos(V.pitch), sp = Math.sin(V.pitch);
      var x = cy * p[0] - sy * p[1], y = sy * p[0] + cy * p[1], z = p[2];
      var y2 = cp * y - sp * z, z2 = sp * y + cp * z, f = 7 / (7 + y2);
      return [W / 2 + x * sc * f, H / 2 - z2 * sc * f, y2];
    };
    V.avanza = function (dt) { if (!V.giu) { if (V.fermo > 0) V.fermo -= dt; else V.yaw += dt * 0.35; } };
    V.vista = function () { var cy = Math.cos(V.yaw), sy = Math.sin(V.yaw), cp = Math.cos(V.pitch), sp = Math.sin(V.pitch); return [sy * cp, cy * cp, -sp]; };
    return V;
  }

  /* ═══ 1. Eulero ═════════════════════════════════════════════════════════ */
  function schedaEulero(div) {
    var G = griglia(div), st = { s: 'dode' }, info = nota(G.pan), P, E;
    F.scelta(G.pan, ['Poliedro', 'Polyhedron'], Object.keys(SOLIDI).map(function (k) { return [k, F.tt(SOLIDI[k][0])]; }), st.s, function (v) { st.s = v; calcola(); });
    G.pan.appendChild(info);
    var tab = F.el('table', { 'class': 'bsiFX-tab' }); G.pan.appendChild(tab);
    var righe = '<tr><th></th><th>V</th><th>S</th><th>F</th><th>χ</th><th>g</th></tr>';
    Object.keys(SOLIDI).forEach(function (k) { var e = eulero(SOLIDI[k][1]()); righe += '<tr><td>' + F.tt(SOLIDI[k][0]) + '</td><td>' + e.V + '</td><td>' + e.S + '</td><td>' + e.F + '</td><td>' + e.chi + '</td><td>' + e.g + '</td></tr>'; });
    tab.innerHTML = righe;
    var cv = F.tela(G.dx, 0.85), V3 = vista3D(cv), ctl;
    function calcola() {
      P = SOLIDI[st.s][1](); E = eulero(P);
      info.innerHTML = 'V = <b class="bsiFX-num">' + E.V + '</b> · S = <b class="bsiFX-num">' + E.S + '</b> · F = <b class="bsiFX-num">' + E.F + '</b> → χ = V − S + F = <b class="bsiFX-num">' + E.chi + '</b>, ' + t('genere', 'genus') + ' g = ' + E.g + '<br>' +
        t('Facce: ', 'Faces: ') + Object.keys(E.lati).map(function (l) { return E.lati[l] + ' × ' + l + t(' lati', ' sides'); }).join(', ') + ' · ' + (E.chiusa ? t('ogni spigolo sta in due facce (superficie chiusa)', 'every edge lies in two faces (closed surface)') : t('superficie con bordo', 'surface with boundary')) + '<br>' +
        t('I conteggi vengono dalle liste di vertici e facce, non da una tabella: le facce dei solidi convessi sono i piani d’appoggio trovati fra tutte le terne di vertici, gli spigoli le coppie consecutive distinte. χ è un invariante topologico: per ogni poliedro deformabile in una sfera vale 2 (Eulero, 1758); la cornice ha un buco e χ = 0 = 2 − 2g con g = 1, come il toro. Trascina per ruotare.', 'The counts come from the vertex and face lists, not from a table: the faces of convex solids are the supporting planes found among all vertex triples, the edges are the distinct consecutive pairs. χ is a topological invariant: for every polyhedron deformable into a sphere it equals 2 (Euler, 1758); the frame has a hole and χ = 0 = 2 − 2g with g = 1, like the torus. Drag to rotate.');
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      V3.avanza(dt);
      var D = F.pennello(cv), q = D.q, W = D.W, H = D.H, sc = Math.min(W, H) / 5, pr = P.V.map(function (p) { return V3.proietta(p, W, H, sc); });
      var zs = pr.map(function (p) { return p[2]; }), zmin = Math.min.apply(null, zs), zmax = Math.max.apply(null, zs);
      E.spigoli.slice().sort(function (a, b) { return (pr[b[0]][2] + pr[b[1]][2]) - (pr[a[0]][2] + pr[a[1]][2]); }).forEach(function (e) {
        var z = ((pr[e[0]][2] + pr[e[1]][2]) / 2 - zmin) / (zmax - zmin || 1); q.strokeStyle = 'rgba(94,234,212,' + (1 - 0.75 * z).toFixed(2) + ')'; q.lineWidth = 2.6 - 1.6 * z;
        q.beginPath(); q.moveTo(pr[e[0]][0], pr[e[0]][1]); q.lineTo(pr[e[1]][0], pr[e[1]][1]); q.stroke();
      });
      pr.forEach(function (p) { var z = (p[2] - zmin) / (zmax - zmin || 1); q.fillStyle = 'rgba(255,196,90,' + (1 - 0.7 * z).toFixed(2) + ')'; q.beginPath(); q.arc(p[0], p[1], 4 - 2 * z, 0, 2 * Math.PI); q.fill(); });
      q.lineWidth = 1; q.fillStyle = '#e6fffb'; q.font = '12px system-ui'; q.fillText('χ = ' + E.V + ' − ' + E.S + ' + ' + E.F + ' = ' + E.chi, 10, 18);
      cv.setAttribute('aria-label', t('poliedro in fil di ferro: ', 'wireframe polyhedron: ') + F.tt(SOLIDI[st.s][0]));
    });
  }

  /* ═══ 2. superfici ══════════════════════════════════════════════════════ */
  function schedaSuperfici(div) {
    var G = griglia(div), st = { s: 'mobius' }, info = nota(G.pan), tau = 0, M;
    F.scelta(G.pan, ['Superficie', 'Surface'], Object.keys(SUP).map(function (k) { return [k, F.tt(SUP[k].nome)]; }), st.s, function (v) { st.s = v; calcola(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.85), V3 = vista3D(cv), ctl, giri = 0;
    function calcola() {
      M = maglia(st.s, 48, 16); var T = trasporta(st.s); tau = 0;
      info.innerHTML = t('Maglia incollata: V − S + F = ', 'Glued mesh: V − E + F = ') + M.V + ' − ' + M.S + ' + ' + M.F + ' = <b class="bsiFX-num">χ = ' + M.chi + '</b> · ' + t('bordi: ', 'boundaries: ') + M.bordi + ' · ' + (M.orientabile ? '<span class="bsiFX-ok">' + t('orientabile', 'orientable') + '</span>' : '<span class="bsiFX-ko">' + t('non orientabile', 'non-orientable') + '</span>') + '<br>' +
        t('Normale portata lungo un giro e confrontata con quella di partenza: n_fine · n_inizio = ', 'Normal carried once around and compared with the start: n_end · n_start = ') + '<b class="bsiFX-num">' + T.prodotto.toFixed(6) + '</b><br>' +
        t('Una superficie è orientabile se si può scegliere con continuità un verso della normale ovunque, cioè se nessun cammino chiuso capovolge la freccia. Sul nastro di Möbius dopo un giro la freccia punta dall’altra parte (serve un secondo giro per riportarla): la superficie ha una sola faccia e un solo bordo. La bottiglia di Klein è il nastro con il bordo incollato a sé stesso: chiusa, χ = 0 come il toro, ma non orientabile; nello spazio a tre dimensioni si può solo immergere attraversandosi (qui la sezione «a otto»). I colori: azzurro dove la normale calcolata guarda verso di te, arancio dove guarda via; sul nastro il cambio di colore lungo la cucitura è il segno che manca un verso globale.', 'A surface is orientable if a direction of the normal can be chosen continuously everywhere, i.e. if no closed path flips the arrow. On the Möbius strip after one lap the arrow points the other way (a second lap brings it back): the surface has one side and one boundary. The Klein bottle is the strip with its boundary glued to itself: closed, χ = 0 like the torus, but non-orientable; in three-dimensional space it can only be immersed by passing through itself (here the figure-8 cross-section). Colours: blue where the computed normal faces you, orange where it faces away; on the strip the colour change along the seam is the sign that no global side exists.');
      if (ctl) ctl.sveglia();
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      V3.avanza(dt); tau += dt * 0.6;
      var S = SUP[st.s], D = F.pennello(cv), q = D.q, W = D.W, H = D.H, sc = Math.min(W, H) / 4.2, nu = 48, nv = 16, griglia0 = [], quad = [], vis = V3.vista();
      for (var i = 0; i <= nu; i++) { griglia0.push([]); for (var j = 0; j <= nv; j++) { var u = S.u[0] + (S.u[1] - S.u[0]) * i / nu, v = S.v[0] + (S.v[1] - S.v[0]) * j / nv, p = S.P(u, v); griglia0[i].push({ p: p, s: V3.proietta(p, W, H, sc) }); } }
      for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) {
        var a = griglia0[i][j], b = griglia0[i + 1][j], c = griglia0[i + 1][j + 1], d = griglia0[i][j + 1], n = norm(croce(sub(c.p, a.p), sub(d.p, b.p))), luce = pscal(n, vis);
        quad.push({ z: (a.s[2] + b.s[2] + c.s[2] + d.s[2]) / 4, pts: [a.s, b.s, c.s, d.s], l: luce });
      }
      quad.sort(function (x, y) { return y.z - x.z; });
      quad.forEach(function (Q) {
        var k = 0.35 + 0.6 * Math.abs(Q.l), col = Q.l < 0 ? [107, 207, 255] : [255, 196, 90];
        q.fillStyle = 'rgba(' + Math.round(col[0] * k) + ',' + Math.round(col[1] * k) + ',' + Math.round(col[2] * k) + ',0.88)'; q.strokeStyle = 'rgba(8,21,34,.5)';
        q.beginPath(); Q.pts.forEach(function (p, m) { if (m) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); }); q.closePath(); q.fill(); q.stroke();
      });
      /* la freccia normale che gira: due giri completi (4π) prima di ricominciare */
      var uu = tau % (4 * Math.PI), base = S.P(uu, S.v0), nn = normale(st.s, uu, S.v0), n0 = normale(st.s, 0, S.v0), punta = [base[0] + 0.7 * nn[0], base[1] + 0.7 * nn[1], base[2] + 0.7 * nn[2]], b2 = V3.proietta(base, W, H, sc), p2 = V3.proietta(punta, W, H, sc);
      q.strokeStyle = '#ff8a80'; q.lineWidth = 3; q.beginPath(); q.moveTo(b2[0], b2[1]); q.lineTo(p2[0], p2[1]); q.stroke();
      var ang = Math.atan2(p2[1] - b2[1], p2[0] - b2[0]); q.fillStyle = '#ff8a80'; q.beginPath(); q.moveTo(p2[0], p2[1]); q.lineTo(p2[0] - 9 * Math.cos(ang - 0.4), p2[1] - 9 * Math.sin(ang - 0.4)); q.lineTo(p2[0] - 9 * Math.cos(ang + 0.4), p2[1] - 9 * Math.sin(ang + 0.4)); q.closePath(); q.fill();
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(b2[0], b2[1], 4, 0, 2 * Math.PI); q.fill(); q.lineWidth = 1;
      var giro = Math.floor(uu / (2 * Math.PI)) + 1, verso = pscal(nn, n0);
      q.fillStyle = '#e6fffb'; q.font = '12px system-ui'; q.fillText(t('giro ', 'lap ') + giro + ' · u = ' + (uu % (2 * Math.PI)).toFixed(2) + ' · n·n₀ = ' + verso.toFixed(2), 10, 18);
      cv.setAttribute('aria-label', t('superficie parametrica con freccia normale: ', 'parametric surface with normal arrow: ') + F.tt(S.nome));
    }, { ricomincia: function () { tau = 0; } });
  }

  /* ═══ 3. poligoni fondamentali ══════════════════════════════════════════ */
  var NOMIPAROLE = { sfera: ['sfera  abb⁻¹a⁻¹', 'sphere  abb⁻¹a⁻¹'], toro: ['toro  aba⁻¹b⁻¹', 'torus  aba⁻¹b⁻¹'], proiettivo: ['piano proiettivo  abab', 'projective plane  abab'], klein: ['bottiglia di Klein  aba⁻¹b', 'Klein bottle  aba⁻¹b'], genere2: ['toro a due buchi  aba⁻¹b⁻¹cdc⁻¹d⁻¹', 'double torus  aba⁻¹b⁻¹cdc⁻¹d⁻¹'], bottiglia2: ['Klein di nuovo  aabb', 'Klein again  aabb'] };
  var COLLETTERE = ['#ff8a80', '#6bcfff', '#ffd24a', '#c9b9ff', '#5eead4', '#ffc45a'];
  var COLCLASSI = ['#e6fffb', '#ff8a80', '#ffd24a', '#6bcfff', '#c9b9ff', '#5eead4', '#ffc45a', '#a8e07a'];
  function scritta(lati) { return lati.map(function (s) { return s.l + (s.e < 0 ? '⁻¹' : ''); }).join(''); }
  function schedaPoligoni(div) {
    var G = griglia(div), st = { w: PAROLE.toro }, info = nota(G.pan), R, campo, k = 0;
    F.scelta(G.pan, ['Identificazione', 'Identification'], Object.keys(PAROLE).map(function (c) { return [c, F.tt(NOMIPAROLE[c])]; }), 'toro', function (v) { st.w = PAROLE[v]; campo.value = st.w; calcola(); });
    campo = F.el('input', { type: 'text', value: st.w, 'aria-label': t('parola (maiuscola = inversa)', 'word (uppercase = inverse)'), spellcheck: 'false', autocomplete: 'off' });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: t('parola (maiuscola = inversa)', 'word (uppercase = inverse)') })]), campo]));
    campo.addEventListener('change', function () { st.w = campo.value.slice(0, 16); calcola(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.85), ctl;
    function calcola() {
      R = poligono(st.w); k = 0;
      if (!R) { info.innerHTML = t('Parola non valida: ogni lettera deve comparire esattamente due volte (minuscola = lato percorso nel verso della freccia, maiuscola = contro). Esempio: abAB per il toro.', 'Invalid word: each letter must appear exactly twice (lowercase = edge along the arrow, uppercase = against). Example: abAB for the torus.'); }
      else {
        var nome = R.orientabile ? (R.genere === 0 ? t('sfera', 'sphere') : R.genere === 1 ? t('toro', 'torus') : t('somma connessa di ', 'connected sum of ') + R.genere + t(' tori', ' tori')) : (R.genere === 1 ? t('piano proiettivo', 'projective plane') : R.genere === 2 ? t('bottiglia di Klein', 'Klein bottle') : t('somma di ', 'sum of ') + R.genere + t(' piani proiettivi', ' projective planes'));
        info.innerHTML = t('Parola ', 'Word ') + '<b>' + scritta(R.lati) + '</b><br>' + t('Classi di vertici V = ', 'Vertex classes V = ') + '<b class="bsiFX-num">' + R.V + '</b> · ' + t('lati S = ', 'edges E = ') + R.S + ' · ' + t('facce F = 1', 'faces F = 1') + ' → χ = <b class="bsiFX-num">' + R.chi + '</b><br>' + (R.orientabile ? '<span class="bsiFX-ok">' + t('orientabile', 'orientable') + '</span>' : '<span class="bsiFX-ko">' + t('non orientabile', 'non-orientable') + '</span>') + ' → <b>' + nome + '</b><br>' +
          t('Incollando i lati con la stessa lettera nel verso delle frecce, i vertici del poligono si raggruppano in classi (stesso colore = stesso punto della superficie). Con χ = V − S + F e l’orientabilità (ogni lettera compare una volta come x e una come x⁻¹) il teorema di classificazione dice tutto: ogni superficie chiusa è una sfera con g manici (χ = 2 − 2g) o con k cuffie incrociate (χ = 2 − k). Le cifre sui vertici sono le classi.', 'Gluing the edges with the same letter along the arrows, the polygon’s vertices fall into classes (same colour = same point of the surface). With χ = V − E + F and orientability (each letter appears once as x and once as x⁻¹) the classification theorem says it all: every closed surface is a sphere with g handles (χ = 2 − 2g) or with k cross-caps (χ = 2 − k). The digits on the vertices are the classes.');
      }
      if (ctl) ctl.sveglia();
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      k += dt;
      var D = F.pennello(cv), q = D.q, W = D.W, H = D.H;
      cv.setAttribute('aria-label', t('poligono fondamentale con i lati identificati', 'fundamental polygon with identified edges'));
      if (!R) { q.fillStyle = '#8494a8'; q.font = '13px system-ui'; q.fillText(t('parola non valida', 'invalid word'), 20, 30); return false; }
      var n = R.lati.length, rr = Math.min(W, H) * 0.36, cx = W / 2, cy = H / 2, V = [], lettere = {};
      R.lati.forEach(function (s) { if (!(s.l in lettere)) lettere[s.l] = Object.keys(lettere).length; });
      for (var i = 0; i < n; i++) { var a = Math.PI * 3 / 4 - 2 * Math.PI * i / n + (n === 4 ? 0 : Math.PI / n - Math.PI / 4); V.push([cx + rr * Math.cos(a) * (n === 4 ? 1.15 : 1), cy - rr * Math.sin(a) * (n === 4 ? 1.15 : 1)]); }
      q.fillStyle = 'rgba(94,234,212,.08)'; q.beginPath(); V.forEach(function (p, i) { if (i) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); }); q.closePath(); q.fill();
      var acceso = Math.floor(k / 1.2) % Object.keys(lettere).length;
      R.lati.forEach(function (s, i) {
        var A = V[i], B = V[(i + 1) % n], col = COLLETTERE[lettere[s.l] % COLLETTERE.length], on = lettere[s.l] === acceso;
        q.strokeStyle = col; q.lineWidth = on ? 4.5 : 2.5; q.beginPath(); q.moveTo(A[0], A[1]); q.lineTo(B[0], B[1]); q.stroke();
        var da = s.e > 0 ? A : B, a2 = s.e > 0 ? B : A, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, ang = Math.atan2(a2[1] - da[1], a2[0] - da[0]);
        for (var m = 0; m < (lettere[s.l] % 2 ? 2 : 1); m++) { var ox = mx + Math.cos(ang) * (m * 10 - 2), oy = my + Math.sin(ang) * (m * 10 - 2); q.fillStyle = col; q.beginPath(); q.moveTo(ox + 8 * Math.cos(ang), oy + 8 * Math.sin(ang)); q.lineTo(ox - 6 * Math.cos(ang - 0.6), oy - 6 * Math.sin(ang - 0.6)); q.lineTo(ox - 6 * Math.cos(ang + 0.6), oy - 6 * Math.sin(ang + 0.6)); q.closePath(); q.fill(); }
        var ln = Math.hypot(mx - cx, my - cy) || 1; q.font = 'bold 14px system-ui'; q.textAlign = 'center'; q.fillText(s.l + (s.e < 0 ? '⁻¹' : ''), mx + (mx - cx) / ln * 18, my + (my - cy) / ln * 18 + 5);
      });
      q.lineWidth = 1;
      V.forEach(function (p, i) { q.fillStyle = COLCLASSI[R.classe[i] % COLCLASSI.length]; q.beginPath(); q.arc(p[0], p[1], 7, 0, 2 * Math.PI); q.fill(); q.fillStyle = '#081522'; q.font = 'bold 10px system-ui'; q.textAlign = 'center'; q.fillText(String(R.classe[i] + 1), p[0], p[1] + 3.5); });
      q.textAlign = 'left'; q.fillStyle = '#e6fffb'; q.font = '12px system-ui'; q.fillText('χ = ' + R.V + ' − ' + R.S + ' + 1 = ' + R.chi, 10, 18);
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 4. nodi ═══════════════════════════════════════════════════════════ */
  var COLFOX = ['#ff8a80', '#5eead4', '#6bcfff', '#ffd24a', '#c9b9ff', '#ffc45a', '#a8e07a'];
  function schedaNodi(div) {
    var G = griglia(div), st = { k: 'trifoglio', p: 3 }, info = nota(G.pan), D, L, k = 0;
    F.scelta(G.pan, ['Nodo', 'Knot'], Object.keys(NODI).map(function (c) { return [c, F.tt(NODI[c][0])]; }), st.k, function (v) { st.k = v; calcola(); });
    F.scelta(G.pan, ['Colorazioni modulo p', 'Colourings modulo p'], [['3', 'p = 3'], ['5', 'p = 5'], ['7', 'p = 7']], '3', function (v) { st.p = +v; calcola(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.85), ctl;
    function calcola() {
      D = diagramma(st.k); L = elencoColorazioni(D, st.p) || []; k = 0;
      var N = colorazioni(D, st.p), det = determinante(D), nb = L.filter(function (c) { return c.some(function (x) { return x !== c[0]; }); }).length;
      info.innerHTML = t('Incroci nel diagramma: ', 'Crossings in the diagram: ') + '<b class="bsiFX-num">' + D.incroci.length + '</b> · ' + t('archi: ', 'arcs: ') + D.archi + ' · ' + t('determinante ', 'determinant ') + '<b class="bsiFX-num">' + det + '</b><br>' +
        t('Colorazioni di Fox mod ', 'Fox colourings mod ') + st.p + ': <b class="bsiFX-num">' + N + '</b> (' + t('di cui costanti ', 'of which constant ') + st.p + ', ' + t('non banali ', 'non-trivial ') + nb + ') → ' + (N > st.p ? '<span class="bsiFX-ok">' + t('il nodo non è banale', 'the knot is not trivial') + '</span>' : t('il test non distingue questo nodo dal banale', 'the test does not tell this knot from the unknot')) + '<br>' +
        (st.k === 'riccio' ? t('Un incrocio, ma il nodo è banale: il ricciolo si scioglie con la mossa di Reidemeister I. Il numero di incroci di un nodo è il minimo su tutti i diagrammi: qui 0. ', 'One crossing, but the knot is trivial: the kink undoes by a Reidemeister I move. The crossing number of a knot is the minimum over all diagrams: here 0. ') : st.k === 'trifoglio' ? t('Il trifoglio ha numero di incroci 3, il minimo per un nodo non banale. ', 'The trefoil has crossing number 3, the least for a non-trivial knot. ') : st.k === 'otto' ? t('Il nodo a otto ha 4 incroci e determinante 5: non è tricolorabile ma è 5-colorabile, quindi non è banale. ', 'The figure-eight has 4 crossings and determinant 5: not 3-colourable but 5-colourable, hence non-trivial. ') : st.k === 'cinque' ? t('Il nodo torico (2,5) gira 5 volte attorno al toro mentre fa 2 giri: 5 incroci, determinante 5. ', 'The (2,5) torus knot winds 5 times around the torus while going round twice: 5 crossings, determinant 5. ') : '') +
        t('Regola di Fox: si colora ogni arco con un elemento di Z_p, e a ogni incrocio 2·(sopra) ≡ (sotto₁) + (sotto₂). Il numero di colorazioni non cambia con le mosse di Reidemeister, quindi è un invariante del nodo; è p^(dimensione del nucleo) e supera p esattamente quando p divide il determinante. Per p = 3 la regola dice che a ogni incrocio i tre colori sono tutti uguali o tutti diversi; il nodo è tricolorabile se si riesce a usarne più di uno.', 'Fox’s rule: colour every arc with an element of Z_p, and at every crossing 2·(over) ≡ (under₁) + (under₂). The number of colourings does not change under Reidemeister moves, so it is a knot invariant; it is p^(kernel dimension) and exceeds p exactly when p divides the determinant. For p = 3 the rule says that at each crossing the three colours are all equal or all different; the knot is 3-colourable if more than one colour can be used.');
      if (ctl) ctl.sveglia();
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      k += dt;
      var Dp = F.pennello(cv), q = Dp.q, W = Dp.W, H = Dp.H, P = D.P, M = D.M, xmin = 1e9, xmax = -1e9, ymin = 1e9, ymax = -1e9;
      P.forEach(function (p) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); });
      var sc = Math.min((W - 40) / (xmax - xmin), (H - 50) / (ymax - ymin)), X = function (x) { return W / 2 + (x - (xmin + xmax) / 2) * sc; }, Y = function (y) { return H / 2 + 8 - (y - (ymin + ymax) / 2) * sc; };
      var nb = L.filter(function (c) { return c.some(function (x) { return x !== c[0]; }); }), col = nb.length ? nb[Math.floor(k / 1.5) % nb.length] : (L[Math.floor(k / 1.5) % Math.max(1, L.length)] || [0]);
      function tratto(i0, i1, larg, colore) { q.strokeStyle = colore; q.lineWidth = larg; q.lineCap = 'round'; q.beginPath(); for (var i = i0; i <= i1; i++) { var p = P[((i % M) + M) % M]; if (i === i0) q.moveTo(X(p[0]), Y(p[1])); else q.lineTo(X(p[0]), Y(p[1])); } q.stroke(); }
      for (var i = 0; i < M; i++) tratto(i, i + 1, 4, COLFOX[col[D.arco(i + 0.5)] % COLFOX.length]);
      /* sopra gli incroci: il filo che passa sopra si ridisegna su una fascia del colore di fondo */
      D.incroci.forEach(function (x) { var c0 = Math.floor(x.sopra); tratto(c0 - 6, c0 + 7, 11, '#081522'); for (var j = c0 - 6; j < c0 + 7; j++) tratto(j, j + 1, 4, COLFOX[col[D.arco(((j + 0.5) % M + M) % M)] % COLFOX.length]); });
      q.lineWidth = 1; q.lineCap = 'butt'; q.fillStyle = '#e6fffb'; q.font = '12px system-ui';
      q.fillText((nb.length ? t('colorazione non banale ', 'non-trivial colouring ') + (Math.floor(k / 1.5) % nb.length + 1) + '/' + nb.length : t('solo colorazioni costanti', 'constant colourings only')) + ' (mod ' + st.p + ')', 10, 18);
      cv.setAttribute('aria-label', t('diagramma del nodo con colorazione di Fox: ', 'knot diagram with Fox colouring: ') + F.tt(NODI[st.k][0]));
    });
  }

  F.sezione('smattopo', {
    titolo: ['🍩 Topologia e superfici', '🍩 Topology and surfaces'],
    sotto: ['Ciò che non cambia deformando: la caratteristica di Eulero dei poliedri, l’orientabilità di sfera, toro, nastro di Möbius e bottiglia di Klein, i poligoni fondamentali e la classificazione delle superfici, i nodi e le colorazioni di Fox.', 'What does not change under deformation: the Euler characteristic of polyhedra, the orientability of sphere, torus, Möbius strip and Klein bottle, fundamental polygons and the classification of surfaces, knots and Fox colourings.'],
    schede: [
      { nome: ['🧊 V − S + F', '🧊 V − E + F'], costruisci: schedaEulero },
      { nome: ['🎀 Superfici', '🎀 Surfaces'], costruisci: schedaSuperfici },
      { nome: ['🔲 Poligoni fondamentali', '🔲 Fundamental polygons'], costruisci: schedaPoligoni },
      { nome: ['🪢 Nodi', '🪢 Knots'], costruisci: schedaNodi }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
