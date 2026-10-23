/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-geometria.js — 📐 geometria analitica e vettori
   BioSpecInfo · © Samuele Pio Provenzano

   · VETTORI nello spazio: modulo, prodotto scalare e angolo, prodotto
     vettoriale (con l'area del parallelogramma), proiezione, prodotto misto
     (volume del parallelepipedo e test di complanarita'); disegnati in 3D;
   · RETTE E PIANI: il piano per tre punti, la retta per un punto con una
     direzione; distanza punto-piano e punto-retta, intersezione retta-piano,
     angolo fra retta e piano, posizione reciproca di due rette (incidenti,
     parallele, sghembe) con la distanza e la perpendicolare comune;
   · CONICHE: da Ax² + Bxy + Cy² + Dx + Ey + F = 0 la classificazione con
     gli invarianti (Δ = det della matrice 3×3, δ = AC − B²/4), il centro, la
     rotazione degli assi, la forma canonica, semiassi, eccentricita' e
     fuochi; la curva disegnata per quadrati in marcia.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F) return;
  var t = F.t, fmt = F.fmt, D = globale.document;

  /* ── algebra dei vettori ───────────────────────────────────────────────── */
  function somma(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function diff(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function per(k, a) { return [k * a[0], k * a[1], k * a[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norma(a) { return Math.sqrt(dot(a, a)); }
  function leggiVettore(s) {
    var p = String(s).replace(/[()\[\]]/g, '').split(/[,;\s]+/).filter(Boolean).map(function (x) { return C ? C.valuta(C.leggi(x)) : +x; });
    if (p.length !== 3 || p.some(function (x) { return !isFinite(x); })) throw new Error(t('servono tre numeri: ', 'three numbers needed: ') + s);
    return p;
  }
  function vt(a) { return '(' + a.map(function (x) { return fmt(Math.abs(x) < 1e-12 ? 0 : x); }).join(', ') + ')'; }

  function vettori(u, v, w) {
    var uv = dot(u, v), nu = norma(u), nv = norma(v), x = cross(u, v), misto = w ? dot(x, w) : null;
    return { pu: nu, pv: nv, scalare: uv, angolo: nu && nv ? Math.acos(Math.max(-1, Math.min(1, uv / (nu * nv)))) * 180 / Math.PI : NaN, vettoriale: x, area: norma(x), proiezione: nv ? per(uv / (nv * nv), v) : [0, 0, 0], misto: misto, volume: misto === null ? null : Math.abs(misto) };
  }
  /* il piano per tre punti: n·x + d = 0 */
  function piano3(A, B, Cc) { var n = cross(diff(B, A), diff(Cc, A)); if (norma(n) < 1e-12) throw new Error(t('i tre punti sono allineati: non individuano un piano', 'the three points are collinear: they do not define a plane')); return { n: n, d: -dot(n, A) }; }
  function distPuntoPiano(P, pi) { return Math.abs(dot(pi.n, P) + pi.d) / norma(pi.n); }
  function distPuntoRetta(P, Q, d) { return norma(cross(diff(P, Q), d)) / norma(d); }
  function rettaPiano(Q, d, pi) {
    var den = dot(pi.n, d), num = -(dot(pi.n, Q) + pi.d);
    if (Math.abs(den) < 1e-12) return { parallela: true, contenuta: Math.abs(num) < 1e-12 };
    var s = num / den; return { punto: somma(Q, per(s, d)), angolo: Math.asin(Math.min(1, Math.abs(den) / (norma(pi.n) * norma(d)))) * 180 / Math.PI };
  }
  /* due rette Q1 + s d1 e Q2 + u d2: posizione, distanza, punti piu' vicini */
  function dueRette(Q1, d1, Q2, d2) {
    var n = cross(d1, d2), w = diff(Q2, Q1);
    if (norma(n) < 1e-12) { var dd = distPuntoRetta(Q2, Q1, d1); return { tipo: dd < 1e-12 ? 'coincidenti' : 'parallele', distanza: dd }; }
    var dist = Math.abs(dot(w, n)) / norma(n);
    /* punti piu' vicini: risolve il sistema 2×2 */
    var a = dot(d1, d1), b = dot(d1, d2), c = dot(d2, d2), e = dot(d1, w), f = dot(d2, w), det = a * c - b * b, s = (e * c - b * f) / det, u = (b * e - a * f) / det;
    return { tipo: dist < 1e-12 ? 'incidenti' : 'sghembe', distanza: dist, P1: somma(Q1, per(s, d1)), P2: somma(Q2, per(u, d2)), angolo: Math.acos(Math.min(1, Math.abs(dot(d1, d2)) / (norma(d1) * norma(d2)))) * 180 / Math.PI };
  }
  /* coniche: autovalori della parte quadratica e invarianti */
  function conica(A, B, Cq, Dl, E, Fc) {
    var M = [[A, B / 2, Dl / 2], [B / 2, Cq, E / 2], [Dl / 2, E / 2, Fc]];
    var Delta = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    var delta = A * Cq - B * B / 4, I = A + Cq, disc = Math.sqrt(Math.max(0, (A - Cq) * (A - Cq) + B * B)), l1 = (I + disc) / 2, l2 = (I - disc) / 2;
    var theta = 0.5 * Math.atan2(B, A - Cq), out = { Delta: Delta, delta: delta, I: I, l1: l1, l2: l2, theta: theta * 180 / Math.PI };
    var eps = 1e-10 * (1 + Math.abs(A) + Math.abs(B) + Math.abs(Cq) + Math.abs(Dl) + Math.abs(E) + Math.abs(Fc));
    if (Math.abs(Delta) < eps) out.tipo = delta > eps ? 'punto' : delta < -eps ? 'rette incidenti' : 'rette parallele o coincidenti';
    else if (delta > eps) out.tipo = Delta * I < 0 ? (Math.abs(A - Cq) < eps && Math.abs(B) < eps ? 'circonferenza' : 'ellisse') : 'ellisse immaginaria';
    else if (delta < -eps) out.tipo = 'iperbole';
    else out.tipo = 'parabola';
    if (Math.abs(delta) > eps) {
      /* centro: gradiente nullo */
      var cx = (B * E - 2 * Cq * Dl) / (4 * A * Cq - B * B), cy = (B * Dl - 2 * A * E) / (4 * A * Cq - B * B);
      out.centro = [cx, cy]; var k = Delta / delta; out.k = k; /* forma canonica l1 X² + l2 Y² + k = 0 */
      if (out.tipo === 'ellisse' || out.tipo === 'circonferenza') {
        var a2 = -k / l2, b2 = -k / l1; /* l2 <= l1: il semiasse maggiore e' lungo l'autovettore di l2 */
        out.a = Math.sqrt(a2); out.b = Math.sqrt(b2); out.e = Math.sqrt(1 - b2 / a2); out.c = Math.sqrt(a2 - b2); out.asseMagg = 2;
      } else if (out.tipo === 'iperbole') {
        /* il semiasse trasverso sta lungo l'autovalore di segno opposto a k */
        var lt = -k / l1 > 0 ? l1 : l2, lc = lt === l1 ? l2 : l1; out.a = Math.sqrt(-k / lt); out.b = Math.sqrt(k / lc); out.c = Math.sqrt(out.a * out.a + out.b * out.b); out.e = out.c / out.a; out.asseMagg = lt === l1 ? 1 : 2;
      }
    } else if (out.tipo === 'parabola') {
      var l = Math.abs(l1) > Math.abs(l2) ? l1 : l2; out.p = Math.sqrt(Math.abs(Delta / (l * l * l))); out.e = 1;
    }
    /* direzione dell'autovettore di l1 */
    var ang1 = Math.abs(B) < 1e-14 ? (A >= Cq ? 0 : Math.PI / 2) : Math.atan2(l1 - A, B / 2);
    out.ang1 = ang1;
    if (out.c !== undefined && out.centro) {
      var asse = out.asseMagg === 1 ? ang1 : ang1 + Math.PI / 2;
      out.fuochi = [[out.centro[0] + out.c * Math.cos(asse), out.centro[1] + out.c * Math.sin(asse)], [out.centro[0] - out.c * Math.cos(asse), out.centro[1] - out.c * Math.sin(asse)]];
    }
    return out;
  }
  F.calcolo.geometria = { vettori: vettori, piano3: piano3, distPuntoPiano: distPuntoPiano, distPuntoRetta: distPuntoRetta, rettaPiano: rettaPiano, dueRette: dueRette, conica: conica, cross: cross, dot: dot };

  /* ── l'interfaccia ─────────────────────────────────────────────────────── */
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function campo(pan, et, val, cambia) { var i = F.el('input', { type: 'text', value: val, 'aria-label': F.tt(et), spellcheck: 'false', autocomplete: 'off' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: F.tt(et) })]), i])); i.addEventListener('change', function () { cambia(i.value); }); return i; }
  function con3D(G, costruisci) {
    var L = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); G.dx.appendChild(attesa);
    if (!L) { attesa.textContent = '⚠ ' + t('motore 3D non disponibile', '3D engine not available'); return; }
    L.stile();
    L.caricaThree().then(function () { attesa.remove(); var S = new L.Scena(G.dx); G.dx.parentNode.parentNode._scena = S; costruisci(S, L, globale.THREE); }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
  }
  function cubo(T, L, S, M) { /* il riquadro di riferimento e gli assi */ S.aggiungi(L.assi(T, M, ['x', 'y', 'z'], 0.3)); }

  function schedaVettori(div) {
    var G = griglia(div), st = { u: '2, 1, 0', v: '1, 3, 1', w: '0, 1, 2' }, info = F.el('div', { 'class': 'bsiFX-nota' });
    campo(G.pan, ['u', 'u'], st.u, function (x) { st.u = x; disegna(); });
    campo(G.pan, ['v', 'v'], st.v, function (x) { st.v = x; disegna(); });
    campo(G.pan, ['w (per il prodotto misto)', 'w (for the triple product)'], st.w, function (x) { st.w = x; disegna(); });
    G.pan.appendChild(info);
    var S, L, T;
    function disegna() {
      try {
        var u = leggiVettore(st.u), v = leggiVettore(st.v), w = st.w.trim() ? leggiVettore(st.w) : null, r = vettori(u, v, w);
        info.innerHTML = '|u| = ' + fmt(r.pu) + ' · |v| = ' + fmt(r.pv) + '<br>u·v = <b class="bsiFX-num">' + fmt(r.scalare) + '</b> · ' + t('angolo ', 'angle ') + '<b>' + fmt(r.angolo) + '°</b>' + (Math.abs(r.scalare) < 1e-12 ? t(' (ortogonali)', ' (orthogonal)') : '') + '<br>u × v = <b class="bsiFX-num">' + vt(r.vettoriale) + '</b> · ' + t('area del parallelogramma ', 'parallelogram area ') + '|u × v| = <b>' + fmt(r.area) + '</b><br>' + t('proiezione di u su v ', 'projection of u on v ') + vt(r.proiezione) +
          (w ? '<br>' + t('prodotto misto ', 'triple product ') + '(u × v)·w = <b class="bsiFX-num">' + fmt(r.misto) + '</b> → ' + (Math.abs(r.misto) < 1e-12 ? t('complanari (linearmente dipendenti)', 'coplanar (linearly dependent)') : t('volume del parallelepipedo ', 'parallelepiped volume ') + fmt(r.volume) + (r.misto > 0 ? t(', terna destrorsa', ', right-handed triple') : t(', terna sinistrorsa', ', left-handed triple'))) : '');
        if (!S) return;
        S.pulisci();
        var M = Math.max(2, r.pu, r.pv, w ? norma(w) : 0, r.area * 0.6) * 1.1, sc = 3.5 / M, P = function (a) { return per(sc, a); };
        cubo(T, L, S, 4);
        S.aggiungi(L.freccia(T, [0, 0, 0], P(u), 0x5eead4, 0.3)); S.aggiungi(L.freccia(T, [0, 0, 0], P(v), 0xff8a80, 0.3));
        var x = r.vettoriale, xs = per(Math.min(1, M / Math.max(1e-9, norma(x))), x); if (norma(x) > 1e-12) S.aggiungi(L.freccia(T, [0, 0, 0], P(xs), 0xffd24a, 0.3));
        if (w) S.aggiungi(L.freccia(T, [0, 0, 0], P(w), 0x6bcfff, 0.3));
        /* il parallelogramma */
        var q = [[0, 0, 0], P(u), P(somma(u, v)), P(v)], g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([].concat(q[0], q[1], q[2], q[0], q[2], q[3]), 3));
        S.aggiungi(new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false })));
        if (w) { var spig = []; [[0, 0, 0], u, v, somma(u, v)].forEach(function (b) { spig.push([P(b), P(somma(b, w))]); }); [[0, 0, 0], w].forEach(function (b) { spig.push([P(b), P(somma(b, u))], [P(b), P(somma(b, v))], [P(somma(b, u)), P(somma(somma(b, u), v))], [P(somma(b, v)), P(somma(somma(b, u), v))]); }); spig.forEach(function (s) { S.aggiungi(L.linea(T, s, 0x6bcfff, 0.45)); }); }
        [['u', u, '#5eead4'], ['v', v, '#ff8a80'], ['u×v', xs, '#ffd24a']].concat(w ? [['w', w, '#6bcfff']] : []).forEach(function (e) { if (norma(e[1]) < 1e-12) return; var s = L.testo3d(T, e[0], e[2], 0.32), p = P(e[1]); s.position.set(p[0] * 1.08, p[1] * 1.08, p[2] * 1.08 + 0.15); S.aggiungi(s); });
        S.didascalia.textContent = 'u ' + vt(u) + ' · v ' + vt(v);
        if (!S.vistaIniziale) S.inquadra(11, 0.7, 1.15);
      } catch (e) { info.textContent = '⚠ ' + e.message; }
    }
    disegna();
    con3D(G, function (s, l, tt) { S = s; L = l; T = tt; disegna(); });
  }

  function schedaRettePiani(div) {
    var G = griglia(div), st = { A: '1, 0, 0', B: '0, 2, 0', C: '0, 0, 3', Q: '0, 0, 0', d: '1, 1, 1', P: '3, 3, 3', Q2: '2, 0, 1', d2: '0, 1, -1' }, info = F.el('div', { 'class': 'bsiFX-nota' });
    F.el('div'); G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Piano per tre punti', 'Plane through three points') + '</b>' }));
    ['A', 'B', 'C'].forEach(function (k) { campo(G.pan, [k, k], st[k], function (x) { st[k] = x; disegna(); }); });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Retta r: punto e direzione', 'Line r: point and direction') + '</b>' }));
    campo(G.pan, ['Q', 'Q'], st.Q, function (x) { st.Q = x; disegna(); }); campo(G.pan, ['d', 'd'], st.d, function (x) { st.d = x; disegna(); });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Seconda retta s e punto P', 'Second line s and point P') + '</b>' }));
    campo(G.pan, ['Q₂', 'Q₂'], st.Q2, function (x) { st.Q2 = x; disegna(); }); campo(G.pan, ['d₂', 'd₂'], st.d2, function (x) { st.d2 = x; disegna(); }); campo(G.pan, ['P', 'P'], st.P, function (x) { st.P = x; disegna(); });
    G.pan.appendChild(info);
    var S, L, T;
    function disegna() {
      try {
        var A = leggiVettore(st.A), B = leggiVettore(st.B), Cc = leggiVettore(st.C), Q = leggiVettore(st.Q), d = leggiVettore(st.d), P = leggiVettore(st.P), Q2 = leggiVettore(st.Q2), d2 = leggiVettore(st.d2);
        var pi = piano3(A, B, Cc), ip = rettaPiano(Q, d, pi), rr = dueRette(Q, d, Q2, d2), eq = function (n, dd) { var g = 0, nn = n.concat([dd]); /* semplifica per un fattore comune se sono interi */ return fmt(n[0]) + 'x ' + (n[1] < 0 ? '− ' : '+ ') + fmt(Math.abs(n[1])) + 'y ' + (n[2] < 0 ? '− ' : '+ ') + fmt(Math.abs(n[2])) + 'z ' + (dd < 0 ? '− ' : '+ ') + fmt(Math.abs(dd)) + ' = 0'; };
        var TIPI = { incidenti: t('incidenti', 'intersecting'), parallele: t('parallele', 'parallel'), coincidenti: t('coincidenti', 'coincident'), sghembe: t('sghembe', 'skew') };
        info.innerHTML = t('Piano π: ', 'Plane π: ') + '<b>' + eq(pi.n, pi.d) + '</b> · n = ' + vt(pi.n) + '<br>' + t('distanza di P da π: ', 'distance of P from π: ') + '|n·P + d|/|n| = <b class="bsiFX-num">' + fmt(distPuntoPiano(P, pi)) + '</b><br>' +
          (ip.parallela ? t('r è parallela a π', 'r is parallel to π') + (ip.contenuta ? t(' e vi è contenuta', ' and lies in it') : '') : t('r incontra π in ', 'r meets π at ') + '<b>' + vt(ip.punto) + '</b>, ' + t('angolo retta-piano ', 'line-plane angle ') + fmt(ip.angolo) + '°') + '<br>' +
          t('distanza di P da r: ', 'distance of P from r: ') + '|(P − Q) × d|/|d| = <b class="bsiFX-num">' + fmt(distPuntoRetta(P, Q, d)) + '</b><br>' + t('r e s sono ', 'r and s are ') + '<b>' + TIPI[rr.tipo] + '</b>' + (rr.tipo === 'sghembe' ? ', ' + t('distanza ', 'distance ') + '|(Q₂ − Q)·(d × d₂)|/|d × d₂| = <b class="bsiFX-num">' + fmt(rr.distanza) + '</b>; ' + t('perpendicolare comune fra ', 'common perpendicular between ') + vt(rr.P1) + t(' e ', ' and ') + vt(rr.P2) : rr.tipo === 'incidenti' ? t(' nel punto ', ' at ') + vt(rr.P1) + ', ' + t('angolo ', 'angle ') + fmt(rr.angolo) + '°' : rr.tipo === 'parallele' ? ', ' + t('distanza ', 'distance ') + fmt(rr.distanza) : '');
        if (!S) return;
        S.pulisci();
        var pts = [A, B, Cc, Q, P, Q2].concat(ip.punto ? [ip.punto] : []), M = Math.max.apply(null, pts.map(norma).concat([2])) * 1.2, sc = 3.6 / M, Ps = function (a) { return per(sc, a); };
        cubo(T, L, S, 4);
        /* il piano: un quadrato di lato 2M centrato sul piede dell'origine */
        var n = pi.n, nn = norma(n), u0 = Math.abs(n[0]) < 0.9 * nn ? [1, 0, 0] : [0, 1, 0], e1 = per(1 / norma(cross(n, u0)), cross(n, u0)), e2 = per(1 / nn, cross(n, e1)), O = per(-pi.d / (nn * nn), n), R = M * 1.1;
        var V = [somma(O, somma(per(R, e1), per(R, e2))), somma(O, somma(per(-R, e1), per(R, e2))), somma(O, somma(per(-R, e1), per(-R, e2))), somma(O, somma(per(R, e1), per(-R, e2)))].map(Ps), g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute([].concat(V[0], V[1], V[2], V[0], V[2], V[3]), 3));
        S.aggiungi(new T.Mesh(g, new T.MeshBasicMaterial({ color: 0x7c6fff, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false })));
        S.aggiungi(L.linea(T, V.concat([V[0]]), 0x7c6fff, 0.7));
        var lungo = function (Q0, dd, col) { var k = 2 * M / norma(dd); S.aggiungi(L.linea(T, [Ps(somma(Q0, per(-k, dd))), Ps(somma(Q0, per(k, dd)))], col)); };
        lungo(Q, d, 0x5eead4); lungo(Q2, d2, 0xff8a80);
        [[A, 0xc49bff], [B, 0xc49bff], [Cc, 0xc49bff], [P, 0xffffff]].forEach(function (p) { var s = Ps(p[0]); S.aggiungi(L.sfera(T, 0.09, p[1], s[0], s[1], s[2], true)); });
        if (ip.punto) { var ps = Ps(ip.punto); S.aggiungi(L.sfera(T, 0.11, 0xffd24a, ps[0], ps[1], ps[2], true)); }
        /* proiezione di P sul piano */
        var piede = diff(P, per((dot(n, P) + pi.d) / (nn * nn), n)); S.aggiungi(L.linea(T, [Ps(P), Ps(piede)], 0xffffff, 0.6));
        if (rr.tipo === 'sghembe') S.aggiungi(L.linea(T, [Ps(rr.P1), Ps(rr.P2)], 0xffd24a));
        S.didascalia.textContent = 'π: ' + eq(pi.n, pi.d);
        if (!S.vistaIniziale) S.inquadra(12, 0.8, 1.1);
      } catch (e) { info.textContent = '⚠ ' + e.message; }
    }
    disegna();
    con3D(G, function (s, l, tt) { S = s; L = l; T = tt; disegna(); });
  }

  var CONICHE = [['5, 4, 2, 0, 0, -6', ['ellisse ruotata', 'rotated ellipse']], ['1, 0, 1, -2, -4, -4', ['circonferenza', 'circle']], ['1, 0, -1, 0, 0, -1', ['iperbole equilatera', 'rectangular hyperbola']], ['0, 2, 0, 0, 0, -1', ['iperbole xy = ½', 'hyperbola xy = ½']], ['1, 2, 1, -4, 4, 0', ['parabola ruotata', 'rotated parabola']], ['1, 0, -1, 0, 0, 0', ['coppia di rette', 'pair of lines']], ['3, -2, 3, -4, 4, -6', ['ellisse traslata', 'translated ellipse']]];
  var NOMI_CON = { circonferenza: ['circonferenza', 'circle'], ellisse: ['ellisse', 'ellipse'], 'ellisse immaginaria': ['ellisse immaginaria (nessun punto reale)', 'imaginary ellipse (no real point)'], iperbole: ['iperbole', 'hyperbola'], parabola: ['parabola', 'parabola'], punto: ['un solo punto (degenere)', 'a single point (degenerate)'], 'rette incidenti': ['due rette incidenti (degenere)', 'two intersecting lines (degenerate)'], 'rette parallele o coincidenti': ['rette parallele o coincidenti (degenere)', 'parallel or coincident lines (degenerate)'] };
  function schedaConiche(div) {
    var G = griglia(div), st = { c: CONICHE[0][0] }, info = F.el('div', { 'class': 'bsiFX-nota' }), inp;
    F.scelta(G.pan, ['Esempi', 'Examples'], CONICHE.map(function (c) { return [c[0], F.tt(c[1])]; }), st.c, function (v) { st.c = v; inp.value = v; disegna(); });
    inp = campo(G.pan, ['A, B, C, D, E, F', 'A, B, C, D, E, F'], st.c, function (v) { st.c = v; disegna(); });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: 'Ax² + Bxy + Cy² + Dx + Ey + F = 0' }));
    G.pan.appendChild(info);
    var c = F.tela(G.dx, 0.75);
    function disegna() {
      try {
        var k = st.c.split(/[,;\s]+/).filter(Boolean).map(Number); if (k.length !== 6 || k.some(function (x) { return !isFinite(x); })) throw new Error(t('servono sei coefficienti', 'six coefficients needed'));
        var r = conica(k[0], k[1], k[2], k[3], k[4], k[5]), R = 6, N = 240, Z = [];
        if (r.centro) R = Math.max(3, Math.min(30, Math.abs(r.centro[0]) + Math.abs(r.centro[1]) + 2 * Math.max(r.a || 2, r.b || 2, 2)));
        var x0 = r.centro ? r.centro[0] : 0, y0 = r.centro ? r.centro[1] : 0;
        var f = function (x, y) { return k[0] * x * x + k[1] * x * y + k[2] * y * y + k[3] * x + k[4] * y + k[5]; };
        var o = F.grafico(c, { serie: [], xmin: x0 - R, xmax: x0 + R, ymin: y0 - R * 0.75, ymax: y0 + R * 0.75, xl: ['x', 'x'], yl: ['y', 'y'] }), q = o.q;
        /* quadrati in marcia sul riquadro */
        q.strokeStyle = '#5eead4'; q.lineWidth = 2.2; q.beginPath();
        var nx = N, ny = Math.round(N * 0.75), hx = 2 * R / nx, hy = 1.5 * R / ny;
        for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) {
          var X = x0 - R + i * hx, Y = y0 - 0.75 * R + j * hy, v = [f(X, Y), f(X + hx, Y), f(X + hx, Y + hy), f(X, Y + hy)], cc = [[X, Y], [X + hx, Y], [X + hx, Y + hy], [X, Y + hy]], tg = [];
          for (var s = 0; s < 4; s++) { var a = v[s], b = v[(s + 1) % 4]; if (a * b < 0) { var u = a / (a - b), A = cc[s], B = cc[(s + 1) % 4]; tg.push([A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u]); } }
          for (s = 0; s + 1 < tg.length; s += 2) { q.moveTo(o.X(tg[s][0]), o.Y(tg[s][1])); q.lineTo(o.X(tg[s + 1][0]), o.Y(tg[s + 1][1])); }
        }
        q.stroke();
        if (r.centro) { q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(o.X(r.centro[0]), o.Y(r.centro[1]), 4, 0, Math.PI * 2); q.fill(); /* gli assi di simmetria */ q.strokeStyle = 'rgba(255,210,74,.5)'; q.setLineDash([5, 4]); [r.ang1, r.ang1 + Math.PI / 2].forEach(function (a) { q.beginPath(); q.moveTo(o.X(r.centro[0] - 3 * R * Math.cos(a)), o.Y(r.centro[1] - 3 * R * Math.sin(a))); q.lineTo(o.X(r.centro[0] + 3 * R * Math.cos(a)), o.Y(r.centro[1] + 3 * R * Math.sin(a))); q.stroke(); }); q.setLineDash([]); }
        (r.fuochi || []).forEach(function (p) { q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(o.X(p[0]), o.Y(p[1]), 4.5, 0, Math.PI * 2); q.fill(); });
        c.setAttribute('aria-label', F.tt(NOMI_CON[r.tipo] || [r.tipo, r.tipo]));
        info.innerHTML = '<b>' + F.tt(NOMI_CON[r.tipo] || [r.tipo, r.tipo]) + '</b><br>Δ = ' + fmt(r.Delta) + ' · δ = AC − B²/4 = ' + fmt(r.delta) + ' · ' + t('autovalori ', 'eigenvalues ') + 'λ₁ = ' + fmt(r.l1) + ', λ₂ = ' + fmt(r.l2) +
          (r.centro ? '<br>' + t('centro ', 'centre ') + '(' + fmt(r.centro[0]) + ', ' + fmt(r.centro[1]) + ') · ' + t('rotazione degli assi ', 'axis rotation ') + 'θ = ½ arctan(B/(A − C)) = ' + fmt(r.theta) + '°<br>' + t('forma canonica ', 'canonical form ') + fmt(r.l1) + ' X² ' + (r.l2 < 0 ? '− ' : '+ ') + fmt(Math.abs(r.l2)) + ' Y² ' + (r.k < 0 ? '− ' : '+ ') + fmt(Math.abs(r.k)) + ' = 0' : '') +
          (r.a ? '<br>' + t('semiassi ', 'semi-axes ') + 'a = ' + fmt(r.a) + ', b = ' + fmt(r.b) + ' · c = ' + fmt(r.c) + ' · ' + t('eccentricità ', 'eccentricity ') + '<b>e = ' + fmt(r.e) + '</b>' + (r.fuochi ? '<br>' + t('fuochi ', 'foci ') + r.fuochi.map(function (p) { return '(' + fmt(p[0]) + ', ' + fmt(p[1]) + ')'; }).join(', ') : '') : '') +
          (r.tipo === 'parabola' ? '<br>' + t('parametro ', 'parameter ') + 'p = √|Δ/λ³| = ' + fmt(r.p) + ' · e = 1' : '') +
          '<br>' + t('Regola: δ > 0 ellisse, δ < 0 iperbole, δ = 0 parabola; Δ = 0 conica degenere. Gli invarianti non cambiano ruotando o traslando gli assi.', 'Rule: δ > 0 ellipse, δ < 0 hyperbola, δ = 0 parabola; Δ = 0 degenerate conic. The invariants do not change when the axes are rotated or translated.');
      } catch (e) { info.textContent = '⚠ ' + e.message; }
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('smatgeo', {
    titolo: ['📐 Geometria analitica e vettori', '📐 Analytic geometry and vectors'],
    sotto: ['Vettori nello spazio con prodotto scalare, vettoriale e misto; rette e piani con distanze, intersezioni e rette sghembe, in 3D; le coniche classificate con gli invarianti, con centro, assi, fuochi e forma canonica.', 'Vectors in space with dot, cross and triple products; lines and planes with distances, intersections and skew lines, in 3D; conics classified with the invariants, with centre, axes, foci and canonical form.'],
    schede: [
      { nome: ['➡️ Vettori', '➡️ Vectors'], costruisci: schedaVettori },
      { nome: ['📏 Rette e piani', '📏 Lines and planes'], costruisci: schedaRettePiani },
      { nome: ['⭕ Coniche', '⭕ Conics'], costruisci: schedaConiche }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
