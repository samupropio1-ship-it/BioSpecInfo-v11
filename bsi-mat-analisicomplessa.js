/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-analisicomplessa.js — 🌀 Analisi complessa
   BioSpecInfo · © Samuele Pio Provenzano

   Le funzioni di una variabile complessa non si possono disegnare come un
   grafico (servirebbero quattro dimensioni): qui si guardano in quattro modi
   diversi, e ogni teorema si controlla con i numeri.

   · COLORAZIONE DEL DOMINIO: il colore di un punto z e' l'argomento di f(z),
     la luminosita' il modulo (bande ogni raddoppio di |f|): gli zeri sono i
     punti neri attorno ai quali i colori girano, i poli quelli bianchi, il
     numero di giri dice l'ordine; il taglio del logaritmo e della radice si
     vede come un salto di colore. Le equazioni di Cauchy–Riemann sono
     controllate su campioni con le differenze finite;
   · IL PAESAGGIO |f| IN 3D: la quota e' log|f| (poli come picchi, zeri come
     pozzi), il colore e' arg f; un cammino chiuso disegnato sulla superficie
     conta zeri meno poli (principio dell'argomento);
   · MAPPE CONFORMI: una griglia e la sua immagine, con la misura dell'angolo
     fra le immagini di due segmenti ortogonali (90° dove f′ ≠ 0, raddoppiato
     dove f′ = 0) e il profilo alare di Joukowski con le linee di corrente,
     la condizione di Kutta, il coefficiente di pressione e la portanza
     (Kutta–Joukowski contro il teorema di Blasius);
   · INTEGRALI DI CONTORNO: ∮ f dz calcolato con i trapezi lungo un cerchio
     contro 2πi Σ residui, il principio dell'argomento come numero di giri
     dell'immagine f(γ) attorno all'origine;
   · INTEGRALI REALI CON I RESIDUI: π, π/√2, π/e, 2π/√3, 2π/(3√3), con il
     contributo dell'arco che si annulla (lemma di Jordan) e il confronto con
     la quadratura doppio-esponenziale.

   I calcoli stanno in F.calcolo.analisicomplessa (provati in
   tools/banchi/verifiche/verifica-smatanalcomp.js).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI, D = globale.document;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* aritmetica complessa su coppie [re, im] */
  function ca(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function cs(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function cm(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cd(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function ck(a, k) { return [a[0] * k, a[1] * k]; }
  function cexp(a) { var r = Math.exp(a[0]); return [r * Math.cos(a[1]), r * Math.sin(a[1])]; }
  function clog(a) { return [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])]; }
  function csin(a) { return [Math.sin(a[0]) * Math.cosh(a[1]), Math.cos(a[0]) * Math.sinh(a[1])]; }
  function ccos(a) { return [Math.cos(a[0]) * Math.cosh(a[1]), -Math.sin(a[0]) * Math.sinh(a[1])]; }
  function csqrt(a) { var r = Math.sqrt(Math.hypot(a[0], a[1])), th = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(th), r * Math.sin(th)]; }
  function cabs(a) { return Math.hypot(a[0], a[1]); }
  function carg(a) { return Math.atan2(a[1], a[0]); }
  var I = [0, 1], UNO = [1, 0];

  /* le funzioni della colorazione e del paesaggio, con zeri e poli (per i segni in 3D) */
  var R3 = Math.sqrt(3) / 2;
  var FUNZIONI = {
    z2: { nome: 'z²', f: function (z) { return cm(z, z); }, zeri: [[0, 0, 2]], poli: [] },
    inv: { nome: '1/z', f: function (z) { return cd(UNO, z); }, zeri: [], poli: [[0, 0, 1]] },
    raz: { nome: '(z² − 1)/(z² + 1)', f: function (z) { var q = cm(z, z); return cd([q[0] - 1, q[1]], [q[0] + 1, q[1]]); }, zeri: [[1, 0, 1], [-1, 0, 1]], poli: [[0, 1, 1], [0, -1, 1]] },
    exp: { nome: 'e^z', f: cexp, zeri: [], poli: [] },
    sin: { nome: 'sin z', f: csin, zeri: [[0, 0, 1], [PI, 0, 1], [-PI, 0, 1], [2 * PI, 0, 1], [-2 * PI, 0, 1]], poli: [] },
    log: { nome: 'Log z', f: clog, zeri: [[1, 0, 1]], poli: [], taglio: true },
    sqrt: { nome: '√z', f: csqrt, zeri: [[0, 0, 1]], poli: [], taglio: true },
    mob: { nome: '(z − i)/(z + i)', f: function (z) { return cd([z[0], z[1] - 1], [z[0], z[1] + 1]); }, zeri: [[0, 1, 1]], poli: [[0, -1, 1]] },
    cubo: { nome: 'z³ − 1', f: function (z) { var q = cm(cm(z, z), z); return [q[0] - 1, q[1]]; }, zeri: [[1, 0, 1], [-0.5, R3, 1], [-0.5, -R3, 1]], poli: [] }
  };
  /* derivata numerica centrata e residuo delle equazioni di Cauchy–Riemann u_x = v_y, u_y = −v_x */
  function derivata(f, z, h) { h = h || 1e-5; return ck(cs(f([z[0] + h, z[1]]), f([z[0] - h, z[1]])), 1 / (2 * h)); }
  function cauchyRiemann(f, x, y, h) {
    h = h || 1e-5;
    var fx1 = f([x + h, y]), fx0 = f([x - h, y]), fy1 = f([x, y + h]), fy0 = f([x, y - h]);
    var ux = (fx1[0] - fx0[0]) / (2 * h), vx = (fx1[1] - fx0[1]) / (2 * h), uy = (fy1[0] - fy0[0]) / (2 * h), vy = (fy1[1] - fy0[1]) / (2 * h);
    return Math.max(Math.abs(ux - vy), Math.abs(uy + vx)) / Math.max(1, Math.hypot(ux, vx));
  }
  /* il massimo residuo di Cauchy–Riemann su una griglia, lontano da poli, zeri multipli e tagli */
  function crCampioni(chiave, R, n) {
    var Fz = FUNZIONI[chiave], m = 0, conta = 0;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var x = -R + 2 * R * (i + 0.37) / n, y = -R + 2 * R * (j + 0.61) / n, vic = false;
      Fz.poli.concat(Fz.zeri).forEach(function (p) { if (Math.hypot(x - p[0], y - p[1]) < 0.15) vic = true; });
      if (Fz.taglio && x < 0.05 && Math.abs(y) < 0.05) vic = true;
      if (vic) continue;
      m = Math.max(m, cauchyRiemann(Fz.f, x, y)); conta++;
    }
    return { max: m, campioni: conta };
  }

  /* colore di un valore complesso: tinta = arg, luminosita' = modulo (nero 0, bianco ∞) con le bande di log₂|f| */
  function hsl(h, s, l) {
    function k(n) { var kk = (n + h * 12) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(kk - 3, 9 - kk, 1)); }
    return [k(0), k(8), k(4)];
  }
  function coloreComplesso(w, bande, griglia) {
    var m = cabs(w);
    if (!isFinite(m) || m > 1e12) return [1, 1, 1];
    var h = (carg(w) / (2 * PI) + 1) % 1, l = 0.06 + 0.86 * (2 / PI) * Math.atan(Math.pow(m, 0.55));
    if (bande && m > 0) { var lg = Math.log(m) / Math.LN2; l *= 0.8 + 0.2 * (lg - Math.floor(lg)); }
    var c = hsl(h, 0.92, l);
    if (griglia) { var fr = Math.abs(w[0] - Math.round(w[0])), fi = Math.abs(w[1] - Math.round(w[1])); if (fr < 0.035 || fi < 0.035) c = [c[0] * 0.55, c[1] * 0.55, c[2] * 0.55]; }
    return c;
  }
  /* l'immagine RGBA della colorazione del dominio sul riquadro [x0,x1]×[y0,y1] (y verso l'alto) */
  function coloraDominio(f, x0, x1, y0, y1, w, h, bande, griglia) {
    var px = new Uint8ClampedArray(w * h * 4);
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var z = [x0 + (x1 - x0) * (i + 0.5) / w, y1 - (y1 - y0) * (j + 0.5) / h], c = coloreComplesso(f(z), bande, griglia), k = 4 * (j * w + i);
      px[k] = c[0] * 255; px[k + 1] = c[1] * 255; px[k + 2] = c[2] * 255; px[k + 3] = 255;
    }
    return px;
  }

  /* ── mappe conformi ── */
  var MAPPE = {
    z2: { nome: 'w = z²', f: function (z) { return cm(z, z); }, tipo: 'cart', dom: [-1.6, 1.6, -1.6, 1.6], imm: [-2.8, 2.8, -2.8, 2.8] },
    exp: { nome: 'w = e^z', f: cexp, tipo: 'cart', dom: [-1.2, 1.2, -PI, PI], imm: [-3.5, 3.5, -3.5, 3.5] },
    inv: { nome: 'w = 1/z', f: function (z) { return cd(UNO, z); }, tipo: 'cart', dom: [-2, 2, -2, 2], imm: [-2.6, 2.6, -2.6, 2.6] },
    sin: { nome: 'w = sin z', f: csin, tipo: 'cart', dom: [-PI / 2, PI / 2, -1.4, 1.4], imm: [-2.4, 2.4, -2.4, 2.4] },
    jouk: { nome: 'w = z + 1/z', f: function (z) { return ca(z, cd(UNO, z)); }, tipo: 'polare', dom: [1, 2.6, -PI, PI], imm: [-3.2, 3.2, -3.2, 3.2] },
    log: { nome: 'w = Log z', f: clog, tipo: 'polare', dom: [0.25, 3, -PI + 0.02, PI - 0.02], imm: [-1.8, 1.8, -3.4, 3.4] },
    mob: { nome: 'w = (z − i)/(z + i)', f: function (z) { return cd([z[0], z[1] - 1], [z[0], z[1] + 1]); }, tipo: 'cart', dom: [-3, 3, 0.02, 4], imm: [-1.25, 1.25, -1.25, 1.25] }
  };
  /* l'angolo fra le immagini di due segmenti ortogonali per z₀ (lunghezza h), misurato sulle immagini stesse */
  function angoloImmagini(f, z0, h, dir) {
    h = h || 1e-6; var a = dir || 0, u = [Math.cos(a), Math.sin(a)], v = [-Math.sin(a), Math.cos(a)];
    var w0 = f(z0), w1 = cs(f(ca(z0, ck(u, h))), w0), w2 = cs(f(ca(z0, ck(v, h))), w0);
    var ang = Math.atan2(w1[0] * w2[1] - w1[1] * w2[0], w1[0] * w2[0] + w1[1] * w2[1]);
    return { angolo: ang, rapporto: cabs(w2) / cabs(w1), scala: cabs(w1) / h, rotazione: carg(w1) - a };
  }

  /* ── Joukowski: cerchio di centro c che passa per z = 1, corrente uniforme U con incidenza α,
     circolazione fissata dalla condizione di Kutta Γ = 4πUR sin(α + β) ── */
  function profilo(mx, my, alfa, U) {
    U = U || 1; var c = [-mx, my], R = cabs(cs(UNO, c)), beta = Math.atan2(my, 1 + mx), G = 4 * PI * U * R * Math.sin(alfa + beta);
    return { c: c, R: R, beta: beta, alfa: alfa, U: U, G: G };
  }
  /* potenziale complesso F(ζ) = U(ζ e^(−iα) + R² e^(iα)/ζ) + iΓ/(2π) ln ζ e la sua derivata, ζ = z − c */
  function potenziale(P, z) { var q = cs(z, P.c), ea = [Math.cos(P.alfa), -Math.sin(P.alfa)], eb = [Math.cos(P.alfa), Math.sin(P.alfa)]; return ca(ck(ca(cm(q, ea), cd(ck(eb, P.R * P.R), q)), P.U), cm([0, P.G / (2 * PI)], clog(q))); }
  function velocitaZeta(P, z) { var q = cs(z, P.c), ea = [Math.cos(P.alfa), -Math.sin(P.alfa)], eb = [Math.cos(P.alfa), Math.sin(P.alfa)]; return ca(ck(cs(ea, cd(ck(eb, P.R * P.R), cm(q, q))), P.U), cd([0, P.G / (2 * PI)], q)); }
  function joukowski(z) { return ca(z, cd(UNO, z)); }
  /* dF/dw = (dF/dζ)/(dw/dz), dw/dz = 1 − 1/z² */
  function velocitaW(P, z) { return cd(velocitaZeta(P, z), cs(UNO, cd(UNO, cm(z, z)))); }
  function puntiProfilo(P, n) { var o = []; for (var k = 0; k <= n; k++) { var th = 2 * PI * k / n, z = ca(P.c, [P.R * Math.cos(th), P.R * Math.sin(th)]); o.push({ z: z, w: joukowski(z), th: th }); } return o; }
  function corda(P) { var pts = puntiProfilo(P, 720), a = Infinity, b = -Infinity; pts.forEach(function (p) { a = Math.min(a, p.w[0]); b = Math.max(b, p.w[0]); }); return b - a; }
  /* forza dal teorema di Blasius: X − iY = (iρ/2)∮(dF/dw)² dw, cammino z = c + 2R e^(iθ) (trapezi) */
  function blasius(P, n) {
    n = n || 4000; var s = [0, 0];
    for (var k = 0; k < n; k++) { var th = 2 * PI * k / n, e = [Math.cos(th), Math.sin(th)], z = ca(P.c, ck(e, 2 * P.R)), dz = ck(cm(I, e), 2 * P.R * 2 * PI / n), dwdz = cs(UNO, cd(UNO, cm(z, z))), V = velocitaZeta(P, z); s = ca(s, cm(cd(cm(V, V), dwdz), dz)); }
    var XmY = cm([0, 0.5], s); return { X: XmY[0], Y: -XmY[1], modulo: cabs(XmY) };
  }

  /* ── integrali di contorno ── */
  var c4 = [Math.SQRT1_2, Math.SQRT1_2];
  var MERO = {
    a: { nome: '1/(z² + 1)', f: function (z) { var q = cm(z, z); return cd(UNO, [q[0] + 1, q[1]]); }, poli: [{ z: [0, 1], m: 1, res: [0, -0.5] }, { z: [0, -1], m: 1, res: [0, 0.5] }], zeri: [] },
    b: { nome: 'e^z / (z(z − 1))', f: function (z) { return cd(cexp(z), cm(z, [z[0] - 1, z[1]])); }, poli: [{ z: [0, 0], m: 1, res: [-1, 0] }, { z: [1, 0], m: 1, res: [Math.E, 0] }], zeri: [] },
    c: { nome: 'z² / (z⁴ + 1)', f: function (z) { var q = cm(z, z); return cd(q, [cm(q, q)[0] + 1, cm(q, q)[1]]); }, poli: [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(function (s) { var z0 = [s[0] * c4[0], s[1] * c4[1]]; return { z: z0, m: 1, res: cd(UNO, ck(z0, 4)) }; }), zeri: [{ z: [0, 0], m: 2 }] },
    d: { nome: '1/sin z', f: function (z) { return cd(UNO, csin(z)); }, poli: [-2, -1, 0, 1, 2].map(function (k) { return { z: [k * PI, 0], m: 1, res: [k % 2 ? -1 : 1, 0] }; }), zeri: [] },
    e: { nome: '(z³ − 1)/(z − ½)²', f: function (z) { var q = cm(cm(z, z), z), d = [z[0] - 0.5, z[1]]; return cd([q[0] - 1, q[1]], cm(d, d)); }, poli: [{ z: [0.5, 0], m: 2, res: [0.75, 0] }], zeri: [{ z: [1, 0], m: 1 }, { z: [-0.5, R3], m: 1 }, { z: [-0.5, -R3], m: 1 }] }
  };
  /* ∮ f dz sul cerchio di centro z₀ e raggio r con la regola dei trapezi (esponenziale per f analitica sul cerchio) */
  function integraleCerchio(f, z0, r, n) {
    n = n || 2048; var s = [0, 0];
    for (var k = 0; k < n; k++) { var th = 2 * PI * k / n, e = [Math.cos(th), Math.sin(th)]; s = ca(s, cm(f(ca(z0, ck(e, r))), ck(cm(I, e), r * 2 * PI / n))); }
    return s;
  }
  function sommaResidui(chiave, z0, r) {
    var s = [0, 0], n = 0;
    MERO[chiave].poli.forEach(function (p) { if (cabs(cs(p.z, z0)) < r) { s = ca(s, p.res); n++; } });
    return { somma: s, dentro: n, due_pi_i: cm([0, 2 * PI], s) };
  }
  function zeriMenoPoli(chiave, z0, r) {
    var M = MERO[chiave], Z = 0, P = 0;
    M.zeri.forEach(function (p) { if (cabs(cs(p.z, z0)) < r) Z += p.m; });
    M.poli.forEach(function (p) { if (cabs(cs(p.z, z0)) < r) P += p.m; });
    return { Z: Z, P: P };
  }
  /* principio dell'argomento in due modi: (1/2πi)∮ f′/f dz e il numero di giri di f(γ) attorno a 0 */
  function argomentoIntegrale(f, z0, r, n) { var g = function (z) { return cd(derivata(f, z, 1e-6), f(z)); }, s = integraleCerchio(g, z0, r, n || 4096); return cd(s, [0, 2 * PI]); }
  function numeroGiri(f, z0, r, n) {
    n = n || 4000; var tot = 0, prec = carg(f(ca(z0, [r, 0])));
    for (var k = 1; k <= n; k++) { var th = 2 * PI * k / n, a = carg(f(ca(z0, [r * Math.cos(th), r * Math.sin(th)]))), d = a - prec; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; tot += d; prec = a; }
    return tot / (2 * PI);
  }

  /* ── integrali reali con i residui ── */
  /* quadratura doppio-esponenziale: su ℝ con x = sinh(π/2 sinh τ), su [0, ∞) con x = exp(π/2 sinh τ) */
  function deReale(f, h) { h = h || 1 / 64; var s = 0; for (var tau = -4.5; tau <= 4.5 + 1e-12; tau += h) { var u = PI / 2 * Math.sinh(tau), x = Math.sinh(u), dx = PI / 2 * Math.cosh(tau) * Math.cosh(u); var v = f(x) * dx; if (isFinite(v)) s += v; } return s * h; }
  function deSemiretta(f, h) { h = h || 1 / 64; var s = 0; for (var tau = -4.5; tau <= 4.5 + 1e-12; tau += h) { var u = PI / 2 * Math.sinh(tau), x = Math.exp(u), dx = PI / 2 * Math.cosh(tau) * x; var v = f(x) * dx; if (isFinite(v)) s += v; } return s * h; }
  /* per cos x/(1+x²): Simpson fino a X = Kπ (dove sin X = 0) e la coda integrata due volte per parti,
     ∫_X^∞ ≈ 2X cos X/(1 + X²)², con errore O(1/X⁴) */
  function oscillante(K) { K = K || 400; var X = K * PI, n = K * 400, h = X / n, s = 0; for (var i = 0; i <= n; i++) { var x = i * h; s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * Math.cos(x) / (1 + x * x); } return 2 * (s * h / 3 + 2 * X * Math.cos(X) / Math.pow(1 + X * X, 2)); }
  function trapeziPeriodico(f, n) { var s = 0; for (var k = 0; k < n; k++) s += f(2 * PI * k / n); return s * 2 * PI / n; }
  var INTEGRALI = {
    uno: { nome: '∫ dx/(1 + x²)', esatto: PI, testo: 'π', contorno: 'semi', fz: function (z) { var q = cm(z, z); return cd(UNO, [q[0] + 1, q[1]]); }, poli: [{ z: [0, 1], res: [0, -0.5] }], fr: function (x) { return 1 / (1 + x * x); }, quad: function () { return deReale(function (x) { return 1 / (1 + x * x); }); } },
    quattro: { nome: '∫ dx/(1 + x⁴)', esatto: PI / Math.SQRT2, testo: 'π/√2', contorno: 'semi', fz: function (z) { var q = cm(z, z), q2 = cm(q, q); return cd(UNO, [q2[0] + 1, q2[1]]); }, poli: [[1, 1], [-1, 1]].map(function (s) { var z0 = [s[0] * c4[0], s[1] * c4[1]]; return { z: z0, res: cd(UNO, ck(cm(cm(z0, z0), z0), 4)) }; }), fr: function (x) { return 1 / (1 + x * x * x * x); }, quad: function () { return deReale(function (x) { return 1 / (1 + x * x * x * x); }); } },
    coseno: { nome: '∫ cos x/(1 + x²) dx', esatto: PI / Math.E, testo: 'π/e', contorno: 'semi', reale: true, fz: function (z) { var q = cm(z, z); return cd(cexp(cm(I, z)), [q[0] + 1, q[1]]); }, poli: [{ z: [0, 1], res: cd(cexp([-1, 0]), [0, 2]) }], fr: function (x) { return Math.cos(x) / (1 + x * x); }, quad: function () { return oscillante(400); } },
    trig: { nome: '∫₀^2π dθ/(2 + cos θ)', esatto: 2 * PI / Math.sqrt(3), testo: '2π/√3', contorno: 'cerchio', fz: function (z) { var q = cm(z, z); return cd([2, 0], cm(I, [q[0] + 4 * z[0] + 1, q[1] + 4 * z[1]])); }, poli: [{ z: [-2 + Math.sqrt(3), 0], res: cd([2, 0], [0, 2 * Math.sqrt(3)]) }], fr: function (th) { return 1 / (2 + Math.cos(th)); }, quad: function () { return trapeziPeriodico(function (th) { return 1 / (2 + Math.cos(th)); }, 32); } },
    cubo: { nome: '∫₀^∞ dx/(1 + x³)', esatto: 2 * PI / (3 * Math.sqrt(3)), testo: '2π/(3√3)', contorno: 'settore', fz: function (z) { var q = cm(cm(z, z), z); return cd(UNO, [q[0] + 1, q[1]]); }, poli: [{ z: [0.5, R3], res: cd(UNO, ck(cm([0.5, R3], [0.5, R3]), 3)) }], fr: function (x) { return 1 / (1 + x * x * x); }, quad: function () { return deSemiretta(function (x) { return 1 / (1 + x * x * x); }); } }
  };
  /* il valore dal teorema dei residui per ciascun cammino */
  function valoreResidui(chiave) {
    var A = INTEGRALI[chiave], s = [0, 0]; A.poli.forEach(function (p) { s = ca(s, p.res); });
    var v = cm([0, 2 * PI], s);
    if (A.contorno === 'settore') v = cd(v, cs(UNO, cexp([0, 2 * PI / 3])));
    return A.reale ? v[0] : v[0];
  }
  /* il contributo dell'arco di raggio R (semicerchio superiore o arco del settore) */
  function integraleArco(chiave, R, n) {
    var A = INTEGRALI[chiave], a1 = A.contorno === 'settore' ? 2 * PI / 3 : PI, s = [0, 0]; n = n || 4000;
    for (var k = 0; k < n; k++) { var th = a1 * (k + 0.5) / n, e = [Math.cos(th), Math.sin(th)]; s = ca(s, cm(A.fz(ck(e, R)), ck(cm(I, e), R * a1 / n))); }
    return s;
  }

  F.calcolo.analisicomplessa = {
    ca: ca, cs: cs, cm: cm, cd: cd, cexp: cexp, clog: clog, csin: csin, ccos: ccos, csqrt: csqrt, cabs: cabs, carg: carg,
    FUNZIONI: FUNZIONI, derivata: derivata, cauchyRiemann: cauchyRiemann, crCampioni: crCampioni, coloreComplesso: coloreComplesso, coloraDominio: coloraDominio, hsl: hsl,
    MAPPE: MAPPE, angoloImmagini: angoloImmagini,
    profilo: profilo, potenziale: potenziale, velocitaZeta: velocitaZeta, velocitaW: velocitaW, joukowski: joukowski, puntiProfilo: puntiProfilo, corda: corda, blasius: blasius,
    MERO: MERO, integraleCerchio: integraleCerchio, sommaResidui: sommaResidui, zeriMenoPoli: zeriMenoPoli, argomentoIntegrale: argomentoIntegrale, numeroGiri: numeroGiri,
    INTEGRALI: INTEGRALI, deReale: deReale, deSemiretta: deSemiretta, oscillante: oscillante, trapeziPeriodico: trapeziPeriodico, valoreResidui: valoreResidui, integraleArco: integraleArco
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
      if (!lab) { nota(G.pan, t('Serve il Laboratorio 3D (bsi-lab3d.js) per questa scheda: qui si vedrebbe il paesaggio del modulo di f sopra il piano complesso.', 'The 3D Laboratory (bsi-lab3d.js) is needed for this tab: it would show the landscape of |f| over the complex plane.')); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); G.dx.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () { attesa.remove(); var S = new lab.Scena(G.dx, rapporto || 0.7); div._scena = S; costruisci(G.pan, S, G.dx); })
        .catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; if (!attesa.parentNode) G.dx.appendChild(attesa); });
    };
  }
  /* la colorazione del dominio su una tela fuori schermo a risoluzione ridotta, poi scalata */
  function immagineDominio(f, box, W, H, bande, griglia) {
    var w = Math.min(420, Math.round(W)), h = Math.max(2, Math.round(w * H / W)), c = D.createElement('canvas'); c.width = w; c.height = h;
    var q = c.getContext('2d'), im = q.createImageData(w, h); im.data.set(coloraDominio(f, box[0], box[1], box[2], box[3], w, h, bande, griglia)); q.putImageData(im, 0, 0);
    return c;
  }
  function rgb(c) { return 'rgb(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ')'; }
  function fz(z) { return (Math.abs(z[0]) < 5e-13 ? '0' : fmt(z[0])) + (z[1] < 0 ? ' − ' : ' + ') + fmt(Math.abs(z[1]) < 5e-13 ? 0 : Math.abs(z[1])) + 'i'; }
  /* un piano complesso disegnato: trasformazioni e assi */
  function piano(q, W, H, box, mg) {
    mg = mg || 0;
    var sx = (W - 2 * mg) / (box[1] - box[0]), sy = (H - 2 * mg) / (box[3] - box[2]);
    return { X: function (x) { return mg + (x - box[0]) * sx; }, Y: function (y) { return H - mg - (y - box[2]) * sy; }, sx: sx, sy: sy };
  }
  function assiPiano(q, P, box, col) {
    q.strokeStyle = col || 'rgba(230,255,251,.35)'; q.lineWidth = 1; q.beginPath();
    if (box[2] < 0 && box[3] > 0) { q.moveTo(P.X(box[0]), P.Y(0)); q.lineTo(P.X(box[1]), P.Y(0)); }
    if (box[0] < 0 && box[1] > 0) { q.moveTo(P.X(0), P.Y(box[2])); q.lineTo(P.X(0), P.Y(box[3])); }
    q.stroke();
  }

  /* ═══ 1. colorazione del dominio ════════════════════════════════════════ */
  function schedaDominio(div) {
    var G = grigliaUI(div), pan = G.pan, st = { f: 'raz', R: 2.5, bande: true, griglia: false };
    F.scelta(pan, ['Funzione f(z)', 'Function f(z)'], Object.keys(FUNZIONI).map(function (k) { return [k, FUNZIONI[k].nome]; }), st.f, function (v) { st.f = v; disegna(); });
    F.cursore(pan, ['semiampiezza del riquadro', 'half-width of the box'], 1, 8, 0.5, st.R, function (v) { st.R = v; disegna(); }, function (v) { return '±' + v; });
    casella(pan, ['bande di |f| (ogni raddoppio)', '|f| bands (every doubling)'], st.bande, function (v) { st.bande = v; disegna(); });
    casella(pan, ['reticolo Re f, Im f interi', 'grid Re f, Im f integers'], st.griglia, function (v) { st.griglia = v; disegna(); });
    var info = nota(pan);
    nota(pan, t('Ogni punto z del piano è colorato con f(z): la tinta è l’argomento (rosso = reale positivo, ciano = reale negativo, giallo-verde ≈ +i, viola ≈ −i), la luminosità il modulo (nero vicino a 0, bianco verso ∞). Attorno a uno zero di ordine k i colori fanno k giri in senso antiorario, attorno a un polo k giri in senso orario: è il principio dell’argomento a colpo d’occhio. Log z e √z non sono continue sul semiasse reale negativo (il taglio del ramo principale, −π < arg z ≤ π): lì il colore salta. Una funzione è olomorfa se soddisfa Cauchy–Riemann u_x = v_y, u_y = −v_x; qui le derivate sono stimate con le differenze finite su una griglia di campioni.',
      'Each point z of the plane is coloured with f(z): hue is the argument (red = positive real, cyan = negative real, yellow-green ≈ +i, violet ≈ −i), brightness the modulus (black near 0, white towards ∞). Around a zero of order k the colours wind k times anticlockwise, around a pole k times clockwise: the argument principle at a glance. Log z and √z are not continuous on the negative real axis (the principal branch cut, −π < arg z ≤ π): there the colour jumps. A function is holomorphic if it satisfies Cauchy–Riemann u_x = v_y, u_y = −v_x; here the derivatives are estimated with finite differences on a grid of samples.'));
    var ca2 = F.tela(G.dx, 0.75), ruota = F.tela(G.dx, 0.2);
    function disegna() {
      var P0 = F.pennello(ca2), q = P0.q, W = P0.W, H = P0.H, Fz = FUNZIONI[st.f], asp = H / W, box = [-st.R, st.R, -st.R * asp, st.R * asp];
      q.imageSmoothingEnabled = true; q.drawImage(immagineDominio(Fz.f, box, W, H, st.bande, st.griglia), 0, 0, W, H);
      var P = piano(q, W, H, box); assiPiano(q, P, box, 'rgba(255,255,255,.35)');
      q.font = '11px system-ui,sans-serif'; q.fillStyle = 'rgba(255,255,255,.8)'; q.textAlign = 'left';
      [-2, -1, 1, 2].forEach(function (k) { var v = k * Math.max(1, Math.round(st.R / 2.5)); if (Math.abs(v) < st.R) { q.fillText(String(v), P.X(v) + 2, P.Y(0) - 3); if (Math.abs(v) < st.R * asp) q.fillText(v + 'i', P.X(0) + 3, P.Y(v) - 2); } });
      Fz.zeri.forEach(function (p) { if (Math.abs(p[0]) < st.R && Math.abs(p[1]) < st.R * asp) { q.strokeStyle = '#ffffff'; q.lineWidth = 1.5; q.beginPath(); q.arc(P.X(p[0]), P.Y(p[1]), 7, 0, 7); q.stroke(); q.fillStyle = '#ffffff'; q.fillText(p[2] > 1 ? t('zero ×', 'zero ×') + p[2] : t('zero', 'zero'), P.X(p[0]) + 9, P.Y(p[1]) + 12); } });
      Fz.poli.forEach(function (p) { if (Math.abs(p[0]) < st.R && Math.abs(p[1]) < st.R * asp) { q.strokeStyle = '#081522'; q.lineWidth = 1.5; q.beginPath(); q.arc(P.X(p[0]), P.Y(p[1]), 7, 0, 7); q.stroke(); q.fillStyle = '#081522'; q.fillText(t('polo', 'pole'), P.X(p[0]) + 9, P.Y(p[1]) + 12); } });
      if (Fz.taglio) { q.strokeStyle = '#ffffff'; q.setLineDash([5, 4]); q.lineWidth = 1.5; q.beginPath(); q.moveTo(P.X(-st.R), P.Y(0)); q.lineTo(P.X(0), P.Y(0)); q.stroke(); q.setLineDash([]); q.fillStyle = '#ffffff'; q.fillText(t('taglio', 'branch cut'), P.X(-st.R) + 6, P.Y(0) - 6); }
      ca2.setAttribute('aria-label', t('Colorazione del dominio di f(z) = ', 'Domain colouring of f(z) = ') + Fz.nome);
      /* la legenda: la ruota dei colori lungo l'argomento e il modulo */
      var R2 = F.pennello(ruota), q2 = R2.q, W2 = R2.W, H2 = R2.H, n = 120;
      for (var i = 0; i < n; i++) { var a = -PI + 2 * PI * i / n; q2.fillStyle = rgb(coloreComplesso([Math.cos(a), Math.sin(a)], false, false)); q2.fillRect(10 + (W2 / 2 - 20) * i / n, H2 * 0.3, (W2 / 2 - 20) / n + 1, H2 * 0.3); }
      for (i = 0; i < n; i++) { var m = Math.pow(10, -2 + 4 * i / n); q2.fillStyle = rgb(coloreComplesso([m, 0], st.bande, false)); q2.fillRect(W2 / 2 + 10 + (W2 / 2 - 20) * i / n, H2 * 0.3, (W2 / 2 - 20) / n + 1, H2 * 0.3); }
      q2.fillStyle = '#cfe3f7'; q2.font = '11px system-ui,sans-serif'; q2.textAlign = 'left'; q2.fillText('arg f: −π', 10, H2 * 0.25); q2.textAlign = 'right'; q2.fillText('π', W2 / 2 - 10, H2 * 0.25);
      q2.textAlign = 'left'; q2.fillText('|f| = 0,01', W2 / 2 + 10, H2 * 0.25); q2.textAlign = 'right'; q2.fillText('100', W2 - 10, H2 * 0.25);
      q2.textAlign = 'center'; q2.fillText(t('1 → al centro', '1 → in the middle'), W2 * 0.75, H2 * 0.85);
      ruota.setAttribute('aria-label', t('Legenda: tinta = argomento, luminosità = modulo', 'Legend: hue = argument, brightness = modulus'));
      var cr = crCampioni(st.f, Math.min(st.R, 2.5), 24), z0 = [0.7, 0.4], d = derivata(Fz.f, z0);
      info.innerHTML = 'f(z) = <b>' + Fz.nome + '</b><br>' + t('Cauchy–Riemann su ', 'Cauchy–Riemann on ') + cr.campioni + t(' campioni: max |u_x − v_y|, |u_y + v_x| (relativo) = ', ' samples: max |u_x − v_y|, |u_y + v_x| (relative) = ') + '<b>' + cr.max.toExponential(1) + '</b> ' + t('(errore delle differenze finite: la funzione è olomorfa)', '(finite-difference error: the function is holomorphic)') +
        '<br>f′(0,7 + 0,4i) ≈ ' + fz(d) + (Fz.zeri.length || Fz.poli.length ? '<br>' + t('Zeri: ', 'Zeros: ') + (Fz.zeri.map(function (p) { return fz([p[0], p[1]]) + (p[2] > 1 ? ' (×' + p[2] + ')' : ''); }).join(', ') || '—') + ' · ' + t('poli: ', 'poles: ') + (Fz.poli.map(function (p) { return fz([p[0], p[1]]); }).join(', ') || '—') : '') +
        (st.f === 'log' ? '<br>' + t('Salto attraverso il taglio: Log(−1 + 0i) − Log(−1 − 0i) = 2πi', 'Jump across the cut: Log(−1 + 0i) − Log(−1 − 0i) = 2πi') : st.f === 'sqrt' ? '<br>' + t('Attraverso il taglio √z cambia segno: √(−1 ± 0i) = ±i', 'Across the cut √z changes sign: √(−1 ± 0i) = ±i') : st.f === 'mob' ? '<br>' + t('Trasformazione di Cayley: il semipiano Im z > 0 va nel disco |w| < 1 (qui scuro: |f| < 1).', 'Cayley transform: the half-plane Im z > 0 goes to the disc |w| < 1 (here dark: |f| < 1).') : '');
    }
    disegna();
    F.alRidimensiona(function () { if (ca2.offsetParent) disegna(); });
  }

  /* ═══ 2. il paesaggio |f| in 3D ═════════════════════════════════════════ */
  function schedaPaesaggio(pan, S, destra) {
    var T = S.T, lab = globale.BSILab3D, L = 2.5, N = 150, st = { f: 'raz', quota: 'log', cx: 0, cy: 0, r: 1.3, giro: true };
    F.scelta(pan, ['Funzione f(z)', 'Function f(z)'], Object.keys(FUNZIONI).map(function (k) { return [k, FUNZIONI[k].nome]; }), st.f, function (v) { st.f = v; costruisci(); });
    F.scelta(pan, ['Quota', 'Height'], [['log', 'log |f|'], ['mod', '|f|']], st.quota, function (v) { st.quota = v; costruisci(); });
    F.cursore(pan, ['cammino: centro Re', 'path: centre Re'], -1.5, 1.5, 0.05, st.cx, function (v) { st.cx = v; cammino(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['cammino: centro Im', 'path: centre Im'], -1.5, 1.5, 0.05, st.cy, function (v) { st.cy = v; cammino(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['cammino: raggio', 'path: radius'], 0.1, 2.4, 0.05, st.r, function (v) { st.r = v; cammino(); }, function (v) { return v.toFixed(2); });
    casella(pan, ['perlina che percorre il cammino', 'bead running along the path'], st.giro, function (v) { st.giro = v; S.avvia(); });
    var info = nota(pan);
    nota(pan, t('La superficie ha quota log|f(z)| (o |f| tagliato) sopra il piano complesso e il colore di arg f: i poli sono picchi che salgono all’infinito (tagliati), gli zeri pozzi senza fondo. Teorema del modulo massimo: una funzione olomorfa non ha massimi locali di |f| all’interno del dominio, e log|f| = Re log f è armonica (nessun massimo né minimo locale fuori dagli zeri): il paesaggio è fatto solo di selle, picchi e pozzi. Il cerchio disegnato sulla superficie è un cammino γ; lungo di esso il colore (arg f) fa N = Z − P giri, zeri meno poli contenuti, con la molteplicità.',
      'The surface has height log|f(z)| (or clipped |f|) over the complex plane and the colour of arg f: poles are peaks rising to infinity (clipped), zeros bottomless wells. Maximum modulus theorem: a holomorphic function has no local maxima of |f| inside its domain, and log|f| = Re log f is harmonic (no local max or min away from zeros): the landscape is made only of saddles, peaks and wells. The circle drawn on the surface is a path γ; along it the colour (arg f) winds N = Z − P times, zeros minus poles enclosed, with multiplicity.'));
    var g = null, quotaDi = null, ogg = [], perla = null, fase = 0, Fz;
    function altezza(w) { var m = cabs(w); if (st.quota === 'log') return Math.max(-2.4, Math.min(2.4, isFinite(m) ? Math.log(m) : 2.4)) * 0.75; return Math.min(4, isFinite(m) ? m : 4) * 0.7 - 1.2; }
    function costruisci() {
      S.pulisci(); ogg = []; Fz = FUNZIONI[st.f];
      var K = N + 1, pos = new Float32Array(K * K * 3), col = new Float32Array(K * K * 3), idx = [], i, j;
      for (i = 0; i <= N; i++) for (j = 0; j <= N; j++) {
        var x = -L + 2 * L * i / N, y = -L + 2 * L * j / N, w = Fz.f([x, y]), k = i * K + j, c = coloreComplesso(w, true, false), m = cabs(w);
        if (!isFinite(m) || m > 1e12) c = [1, 1, 1];
        var hs = hsl((carg(w) / (2 * PI) + 1) % 1, 0.85, 0.52); c = isFinite(m) && m < 1e12 ? [hs[0] * 0.75 + c[0] * 0.25, hs[1] * 0.75 + c[1] * 0.25, hs[2] * 0.75 + c[2] * 0.25] : c;
        pos[3 * k] = x; pos[3 * k + 1] = y; pos[3 * k + 2] = altezza(w); col[3 * k] = c[0]; col[3 * k + 1] = c[1]; col[3 * k + 2] = c[2];
      }
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) { var a = i * K + j, b = (i + 1) * K + j; idx.push(a, b, b + 1, a, b + 1, a + 1); }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      S.aggiungi(new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.5, metalness: 0.05 })));
      var lin = []; for (i = 0; i <= N; i += 10) for (j = 0; j < N; j++) { lin.push(i * K + j, i * K + j + 1, j * K + i, (j + 1) * K + i); }
      var gw = new T.BufferGeometry(); gw.setAttribute('position', geo.attributes.position); gw.setIndex(lin);
      S.aggiungi(new T.LineSegments(gw, new T.LineBasicMaterial({ color: 0x06101c, transparent: true, opacity: 0.35 })));
      /* il piano z = 0 come riferimento (|f| = 1 nella quota logaritmica) */
      var pz = st.quota === 'log' ? 0 : 0.7 - 1.2, pl = new T.Mesh(new T.PlaneGeometry(2 * L, 2 * L), new T.MeshBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.08, side: T.DoubleSide, depthWrite: false })); pl.position.z = pz; S.aggiungi(pl);
      Fz.zeri.forEach(function (p) { if (Math.abs(p[0]) <= L && Math.abs(p[1]) <= L) { S.aggiungi(lab.sfera(T, 0.08, 0x6bcfff, p[0], p[1], altezza([1e-9, 0]) - 0.05, true)); var e = lab.testo3d(T, p[2] > 1 ? 'zero ×' + p[2] : 'zero', '#9fe3ff', 0.26); e.position.set(p[0], p[1], -2.1); S.aggiungi(e); } });
      Fz.poli.forEach(function (p) { if (Math.abs(p[0]) <= L && Math.abs(p[1]) <= L) { S.aggiungi(lab.sfera(T, 0.08, 0xff8a80, p[0], p[1], altezza([1e12, 0]) + 0.08, true)); var e = lab.testo3d(T, t('polo', 'pole'), '#ffb4ae', 0.26); e.position.set(p[0], p[1], 2.3); S.aggiungi(e); } });
      S.aggiungi(lab.assi(T, L * 1.12, ['Re', 'Im', st.quota === 'log' ? 'log|f|' : '|f|'], 0.26));
      perla = lab.sfera(T, 0.07, 0xffffff, 0, 0, 0, true); S.aggiungi(perla);
      S.ogniFotogramma(function (dt) { if (!st.giro || !camm) return false; fase = (fase + dt * 0.25) % 1; var k = Math.floor(fase * (camm.length - 1)); perla.position.set(camm[k][0], camm[k][1], camm[k][2] + 0.05); });
      cammino();
      if (!S.vistaIniziale) S.inquadra(10.5, -1.0, 0.95);
    }
    var camm = null, lineaC = null;
    function cammino() {
      if (lineaC) { S.radice.remove(lineaC); lineaC.geometry.dispose(); lineaC.material.dispose(); }
      var n = 360, pts = [], col = []; camm = [];
      for (var k = 0; k <= n; k++) { var th = 2 * PI * k / n, z = [st.cx + st.r * Math.cos(th), st.cy + st.r * Math.sin(th)], w = Fz.f(z), c = hsl((carg(w) / (2 * PI) + 1) % 1, 1, 0.6); var p = [z[0], z[1], altezza(w) + 0.04]; camm.push(p); pts.push(p[0], p[1], p[2]); col.push(c[0], c[1], c[2]); }
      var gc = new T.BufferGeometry(); gc.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); gc.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      lineaC = new T.Line(gc, new T.LineBasicMaterial({ vertexColors: true, depthTest: false })); lineaC.renderOrder = 6; S.aggiungi(lineaC);
      var z0 = [st.cx, st.cy], Z = 0, P = 0;
      Fz.zeri.forEach(function (p) { if (Math.hypot(p[0] - z0[0], p[1] - z0[1]) < st.r) Z += p[2]; }); Fz.poli.forEach(function (p) { if (Math.hypot(p[0] - z0[0], p[1] - z0[1]) < st.r) P += p[2]; });
      var vicino = Fz.zeri.concat(Fz.poli).some(function (p) { return Math.abs(Math.hypot(p[0] - z0[0], p[1] - z0[1]) - st.r) < 0.03; }), taglio = Fz.taglio && (st.cx - st.r < 0 && Math.abs(st.cy) < st.r);
      var giri = numeroGiri(Fz.f, z0, st.r, 3000);
      info.innerHTML = 'f(z) = <b>' + Fz.nome + '</b><br>' + t('Cammino |z − (', 'Path |z − (') + fz(z0) + ')| = ' + st.r.toFixed(2) + '<br>' + t('Zeri dentro Z = ', 'Zeros inside Z = ') + Z + ', ' + t('poli dentro P = ', 'poles inside P = ') + P + ' → Z − P = <b>' + (Z - P) + '</b><br>' +
        t('Giri di arg f lungo γ (misurati): ', 'Turns of arg f along γ (measured): ') + '<b>' + giri.toFixed(4) + '</b>' + (vicino ? '<br><span class="bsiFX-ko">' + t('Il cammino passa vicino a uno zero o a un polo: il conteggio è instabile.', 'The path passes close to a zero or pole: the count is unstable.') + '</span>' : '') + (taglio ? '<br><span class="bsiFX-ko">' + t('Il cammino attraversa il taglio: f non è continua lungo γ e il teorema non si applica.', 'The path crosses the branch cut: f is not continuous along γ and the theorem does not apply.') + '</span>' : '');
      S.didascalia.textContent = (st.quota === 'log' ? 'log|f|, ' : '|f|, ') + t('colore = arg f, f(z) = ', 'colour = arg f, f(z) = ') + Fz.nome;
      S.avvia();
    }
    costruisci();
  }

  /* ═══ 3. mappe conformi ═════════════════════════════════════════════════ */
  function schedaMappe(div) {
    var G = grigliaUI(div), pan = G.pan, st = { m: 'z2', u: 0.62, v: 0.7, n: 12 };
    F.scelta(pan, ['Mappa', 'Map'], Object.keys(MAPPE).map(function (k) { return [k, MAPPE[k].nome]; }), st.m, function (v) { st.m = v; disegna(); });
    F.cursore(pan, ['punto z₀: posizione orizzontale', 'point z₀: horizontal position'], 0, 1, 0.01, st.u, function (v) { st.u = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['punto z₀: posizione verticale', 'point z₀: vertical position'], 0, 1, 0.01, st.v, function (v) { st.v = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['linee per direzione', 'lines per direction'], 6, 24, 1, st.n, function (v) { st.n = v; disegna(); });
    var info = nota(pan);
    nota(pan, t('Una funzione olomorfa con f′(z₀) ≠ 0 agisce vicino a z₀ come la moltiplicazione per il numero f′(z₀): una rotazione di arg f′ e un ingrandimento |f′| uguali in tutte le direzioni. Per questo le immagini delle rette ortogonali della griglia si tagliano ancora ad angolo retto (mappa conforme) e i quadratini piccoli restano quadrati. Dove f′ = 0 (z² nell’origine, z + 1/z in ±1) gli angoli si moltiplicano per l’ordine dello zero di f′ più uno. Le due frecce misurano l’angolo fra le immagini di due segmenti ortogonali per z₀ calcolando f, non f′. Log z trasforma la griglia polare in una cartesiana, la trasformazione di Cayley porta il semipiano superiore nel disco.',
      'A holomorphic function with f′(z₀) ≠ 0 acts near z₀ like multiplication by the number f′(z₀): a rotation by arg f′ and a magnification |f′| equal in every direction. This is why the images of the orthogonal grid lines still cross at right angles (conformal map) and small squares stay square. Where f′ = 0 (z² at the origin, z + 1/z at ±1) angles are multiplied by the order of the zero of f′ plus one. The two arrows measure the angle between the images of two orthogonal segments through z₀ by computing f, not f′. Log z turns the polar grid into a Cartesian one, the Cayley transform takes the upper half-plane to the disc.'));
    var c1 = F.tela(G.dx, 0.62), c2 = F.tela(G.dx, 0.62);
    function z0() { var M = MAPPE[st.m], d = M.dom; if (M.tipo === 'polare') { var r = d[0] + (d[1] - d[0]) * st.u, a = d[2] + (d[3] - d[2]) * st.v; return [r * Math.cos(a), r * Math.sin(a)]; } return [d[0] + (d[1] - d[0]) * st.u, d[2] + (d[3] - d[2]) * st.v]; }
    function linee() {
      /* le famiglie di curve della griglia nel dominio: [punti, colore] */
      var M = MAPPE[st.m], d = M.dom, out = [], n = st.n, k, s;
      for (k = 0; k <= n; k++) {
        var a = [], b = [], fa = k / n;
        for (s = 0; s <= 240; s++) {
          var fs = s / 240;
          if (M.tipo === 'polare') { var r1 = d[0] + (d[1] - d[0]) * fa, t1 = d[2] + (d[3] - d[2]) * fs, r2 = d[0] + (d[1] - d[0]) * fs, t2 = d[2] + (d[3] - d[2]) * fa; a.push([r1 * Math.cos(t1), r1 * Math.sin(t1)]); b.push([r2 * Math.cos(t2), r2 * Math.sin(t2)]); }
          else { a.push([d[0] + (d[1] - d[0]) * fa, d[2] + (d[3] - d[2]) * fs]); b.push([d[0] + (d[1] - d[0]) * fs, d[2] + (d[3] - d[2]) * fa]); }
        }
        out.push([a, 'hsl(' + Math.round(160 + 60 * fa) + ',80%,62%)']); out.push([b, 'hsl(' + Math.round(10 + 40 * fa) + ',90%,62%)']);
      }
      return out;
    }
    function quadro(c, box, fn, etich) {
      var P0 = F.pennello(c), q = P0.q, W = P0.W, H = P0.H, sc = Math.min(W / (box[1] - box[0]), H / (box[3] - box[2])) * 0.94, cx = (box[0] + box[1]) / 2, cy = (box[2] + box[3]) / 2;
      var X = function (x) { return W / 2 + (x - cx) * sc; }, Y = function (y) { return H / 2 - (y - cy) * sc; };
      q.strokeStyle = 'rgba(132,148,168,.35)'; q.beginPath(); q.moveTo(0, Y(0)); q.lineTo(W, Y(0)); q.moveTo(X(0), 0); q.lineTo(X(0), H); q.stroke();
      fn(q, X, Y, W, H);
      q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(etich, 8, 16);
    }
    function traccia(q, X, Y, pts, col, larg, lim) {
      q.strokeStyle = col; q.lineWidth = larg; q.beginPath(); var su = false, pp = null;
      pts.forEach(function (p) { var ok = isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) < lim && Math.abs(p[1]) < lim; if (ok && su && pp && Math.hypot(p[0] - pp[0], p[1] - pp[1]) > lim * 0.5) su = false; if (!ok) { su = false; pp = null; return; } if (su) q.lineTo(X(p[0]), Y(p[1])); else { q.moveTo(X(p[0]), Y(p[1])); su = true; } pp = p; });
      q.stroke();
    }
    function freccia(q, X, Y, a, b, col) {
      var x1 = X(a[0]), y1 = Y(a[1]), x2 = X(b[0]), y2 = Y(b[1]), an = Math.atan2(y2 - y1, x2 - x1);
      q.strokeStyle = col; q.fillStyle = col; q.lineWidth = 2.5; q.beginPath(); q.moveTo(x1, y1); q.lineTo(x2, y2); q.stroke();
      q.beginPath(); q.moveTo(x2, y2); q.lineTo(x2 - 9 * Math.cos(an - 0.4), y2 - 9 * Math.sin(an - 0.4)); q.lineTo(x2 - 9 * Math.cos(an + 0.4), y2 - 9 * Math.sin(an + 0.4)); q.closePath(); q.fill();
    }
    function disegna() {
      var M = MAPPE[st.m], L = linee(), p = z0(), A = angoloImmagini(M.f, p, 1e-6), dz = 0.07 * Math.max(M.dom[1] - M.dom[0], M.dom[3] - M.dom[2]) / 4;
      var dbox = M.tipo === 'polare' ? [-M.dom[1], M.dom[1], -M.dom[1], M.dom[1]] : M.dom;
      quadro(c1, dbox, function (q, X, Y) {
        L.forEach(function (l) { traccia(q, X, Y, l[0], l[1], 1.1, 1e9); });
        if (st.m === 'jouk') { q.strokeStyle = '#ffffff'; q.lineWidth = 2; q.beginPath(); q.arc(X(0), Y(0), Math.abs(X(1) - X(0)), 0, 7); q.stroke(); }
        freccia(q, X, Y, p, [p[0] + dz * 3, p[1]], '#ffd24a'); freccia(q, X, Y, p, [p[0], p[1] + dz * 3], '#ff8ac8');
        q.fillStyle = '#ffffff'; q.beginPath(); q.arc(X(p[0]), Y(p[1]), 4, 0, 7); q.fill();
      }, t('piano z', 'z-plane'));
      var imm = M.imm, lim = 1e3;
      quadro(c2, imm, function (q, X, Y) {
        L.forEach(function (l) { traccia(q, X, Y, l[0].map(M.f), l[1], 1.1, Math.max(imm[1], imm[3]) * 3); });
        if (st.m === 'mob') { q.strokeStyle = 'rgba(255,255,255,.6)'; q.setLineDash([4, 4]); q.beginPath(); q.arc(X(0), Y(0), Math.abs(X(1) - X(0)), 0, 7); q.stroke(); q.setLineDash([]); }
        /* le immagini dei due segmenti, prese dalla mappa (curve, non rette) */
        var w0 = M.f(p), s1 = [], s2 = [];
        for (var k = 0; k <= 30; k++) { s1.push(M.f([p[0] + dz * 3 * k / 30, p[1]])); s2.push(M.f([p[0], p[1] + dz * 3 * k / 30])); }
        traccia(q, X, Y, s1, '#ffd24a', 3, lim); traccia(q, X, Y, s2, '#ff8ac8', 3, lim);
        q.fillStyle = '#ffffff'; q.beginPath(); q.arc(X(w0[0]), Y(w0[1]), 4, 0, 7); q.fill();
      }, t('piano w = f(z)', 'w-plane, w = f(z)'));
      c1.setAttribute('aria-label', t('Griglia nel piano z e punto z₀', 'Grid in the z-plane and point z₀'));
      c2.setAttribute('aria-label', t('Immagine della griglia con ', 'Image of the grid under ') + M.nome);
      var ang = Math.abs(A.angolo) * 180 / PI, d = derivata(M.f, p, 1e-6);
      info.innerHTML = M.nome + ' · z₀ = ' + fz(p) + '<br>' + t('Angolo fra le immagini (misurato): ', 'Angle between the images (measured): ') + '<b>' + ang.toFixed(6) + '°</b> · ' + t('rapporto delle lunghezze ', 'length ratio ') + '<b>' + A.rapporto.toFixed(6) + '</b><br>' +
        "|f′(z₀)| = " + fmt(cabs(d)) + ' (' + t('ingrandimento', 'magnification') + '), arg f′(z₀) = ' + (carg(d) * 180 / PI).toFixed(2) + '° (' + t('rotazione', 'rotation') + ')' +
        (cabs(d) < 0.05 ? '<br><span class="bsiFX-ko">' + t('Vicino a un punto critico (f′ ≈ 0): la mappa smette di essere conforme, gli angoli si raddoppiano.', 'Near a critical point (f′ ≈ 0): the map stops being conformal, angles double.') + '</span>' : '');
    }
    disegna();
    F.alRidimensiona(function () { if (c1.offsetParent) disegna(); });
  }

  /* ═══ 4. Joukowski ══════════════════════════════════════════════════════ */
  function schedaJoukowski(div) {
    var G = grigliaUI(div), pan = G.pan, st = { mx: 0.1, my: 0.08, alfa: 6, linee: true };
    F.cursore(pan, ['spessore (centro −μₓ)', 'thickness (centre −μₓ)'], 0, 0.3, 0.01, st.mx, function (v) { st.mx = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['curvatura (centro iμ_y)', 'camber (centre iμ_y)'], 0, 0.3, 0.01, st.my, function (v) { st.my = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['incidenza α (°)', 'angle of attack α (°)'], -10, 15, 0.5, st.alfa, function (v) { st.alfa = v; disegna(); }, function (v) { return v + '°'; });
    casella(pan, ['linee di corrente', 'streamlines'], st.linee, function (v) { st.linee = v; disegna(); });
    var info = nota(pan);
    nota(pan, t('La trasformazione di Joukowski w = z + 1/z porta un cerchio che passa per z = 1 e contiene z = −1 in un profilo alare con il bordo d’uscita a spigolo (in z = 1 f′ si annulla e l’angolo di 180° diventa 360°). Il flusso attorno al cilindro si scrive in forma chiusa, F(ζ) = U(ζe^(−iα) + R²e^(iα)/ζ) + (iΓ/2π) ln ζ, e le linee di corrente Im F = cost. si trasportano sul profilo. Fra tutte le circolazioni Γ solo una rende finita la velocità sullo spigolo: la condizione di Kutta, Γ = 4πUR sin(α + β). Il teorema di Kutta–Joukowski dà la portanza L = ρUΓ; qui è confrontata con l’integrale di Blasius X − iY = (iρ/2)∮(dF/dw)² dw calcolato sul contorno. Il grafico mostra il coefficiente di pressione C_p = 1 − |V|²/U² sul dorso e sul ventre.',
      'The Joukowski map w = z + 1/z takes a circle through z = 1 that contains z = −1 to an aerofoil with a sharp trailing edge (at z = 1 f′ vanishes and the 180° angle becomes 360°). The flow around the cylinder is known in closed form, F(ζ) = U(ζe^(−iα) + R²e^(iα)/ζ) + (iΓ/2π) ln ζ, and the streamlines Im F = const. are carried onto the aerofoil. Of all circulations Γ only one keeps the velocity at the edge finite: the Kutta condition, Γ = 4πUR sin(α + β). The Kutta–Joukowski theorem gives the lift L = ρUΓ; here it is compared with Blasius’ integral X − iY = (iρ/2)∮(dF/dw)² dw computed along a contour. The chart shows the pressure coefficient C_p = 1 − |V|²/U² on the upper and lower surfaces.'));
    var c1 = F.tela(G.dx, 0.62), c2 = F.tela(G.dx, 0.45);
    function streamlines(P) {
      /* Im F su una griglia polare attorno al cerchio (piu' fitta vicino al bordo); per ogni cella solo i
         livelli compresi fra il minimo e il massimo dei quattro vertici (quadrati in marcia) */
      var NR = 60, NT = 180, K = NT + 1, zx = new Float64Array((NR + 1) * K), zy = new Float64Array((NR + 1) * K), val = new Float64Array((NR + 1) * K), i, j, seg = [], passo = 0.2;
      for (i = 0; i <= NR; i++) { var rho = P.R * (1 + 4 * Math.pow(i / NR, 1.6)); for (j = 0; j <= NT; j++) { var th = 2 * PI * j / NT, k = i * K + j, z = [P.c[0] + rho * Math.cos(th), P.c[1] + rho * Math.sin(th)]; zx[k] = z[0]; zy[k] = z[1]; val[k] = potenziale(P, z)[1]; } }
      var c = [0, 0, 0, 0], tg = [];
      for (i = 0; i < NR; i++) for (j = 0; j < NT; j++) {
        c[0] = i * K + j; c[1] = c[0] + K; c[2] = c[1] + 1; c[3] = c[0] + 1;
        var lo = Math.min(val[c[0]], val[c[1]], val[c[2]], val[c[3]]), hi = Math.max(val[c[0]], val[c[1]], val[c[2]], val[c[3]]);
        for (var L = Math.ceil(lo / passo) * passo; L < hi && L <= 3.21; L += passo) {
          if (L < -3.21) continue; tg.length = 0;
          for (var e = 0; e < 4; e++) { var a = c[e], b = c[(e + 1) % 4], va = val[a], vb = val[b]; if ((va - L) * (vb - L) < 0) { var f = (L - va) / (vb - va); tg.push([zx[a] + (zx[b] - zx[a]) * f, zy[a] + (zy[b] - zy[a]) * f]); } }
          if (tg.length >= 2) seg.push([tg[0], tg[1]]); if (tg.length === 4) seg.push([tg[2], tg[3]]);
        }
      }
      return seg;
    }
    function disegna() {
      var P = profilo(st.mx, st.my, st.alfa * PI / 180, 1), cerchio = puntiProfilo(P, 360), seg = st.linee ? streamlines(P) : [];
      var P0 = F.pennello(c1), q = P0.q, W = P0.W, H = P0.H, wide = W > 560, w1 = wide ? W * 0.4 : W, h1 = wide ? H : H * 0.42;
      /* sinistra (o sopra): il piano z con il cerchio; destra: il profilo */
      function vista(x0, y0, w, h, box) { var sc = Math.min(w / (box[1] - box[0]), h / (box[3] - box[2])); return { X: function (x) { return x0 + w / 2 + (x - (box[0] + box[1]) / 2) * sc; }, Y: function (y) { return y0 + h / 2 - (y - (box[2] + box[3]) / 2) * sc; } }; }
      var V1 = vista(0, 0, w1, h1, [-2.4, 2.4, -2, 2]), V2 = wide ? vista(w1, 0, W - w1, H, [-3, 3, -1.6, 1.6]) : vista(0, h1, W, H - h1, [-3, 3, -1.6, 1.6]);
      q.strokeStyle = '#1d2f49'; q.beginPath(); if (wide) { q.moveTo(w1, 0); q.lineTo(w1, H); } else { q.moveTo(0, h1); q.lineTo(W, h1); } q.stroke();
      q.strokeStyle = 'rgba(107,207,255,.55)'; q.lineWidth = 1; q.beginPath();
      seg.forEach(function (s) { var a = s[0], b = s[1]; if (Math.abs(a[0]) < 2.4 && Math.abs(a[1]) < 2) { q.moveTo(V1.X(a[0]), V1.Y(a[1])); q.lineTo(V1.X(b[0]), V1.Y(b[1])); } }); q.stroke();
      q.strokeStyle = 'rgba(94,234,212,.7)'; q.beginPath();
      seg.forEach(function (s) { var a = joukowski(s[0]), b = joukowski(s[1]); if (Math.abs(a[0]) < 3 && Math.abs(a[1]) < 1.6 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5) { q.moveTo(V2.X(a[0]), V2.Y(a[1])); q.lineTo(V2.X(b[0]), V2.Y(b[1])); } }); q.stroke();
      q.fillStyle = 'rgba(255,210,74,.25)'; q.strokeStyle = '#ffd24a'; q.lineWidth = 2;
      [[V1, function (p) { return p.z; }], [V2, function (p) { return p.w; }]].forEach(function (A) { q.beginPath(); cerchio.forEach(function (p, k) { var z = A[1](p); if (k) q.lineTo(A[0].X(z[0]), A[0].Y(z[1])); else q.moveTo(A[0].X(z[0]), A[0].Y(z[1])); }); q.closePath(); q.fill(); q.stroke(); });
      q.fillStyle = '#ffffff'; [[1, 0], [-1, 0]].forEach(function (z) { q.beginPath(); q.arc(V1.X(z[0]), V1.Y(z[1]), 3, 0, 7); q.fill(); });
      q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(V1.X(P.c[0]), V1.Y(P.c[1]), 3, 0, 7); q.fill();
      q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillStyle = '#cfe3f7'; q.fillText(t('piano z: cerchio per z = 1', 'z-plane: circle through z = 1'), 8, 16); q.fillText(t('piano w = z + 1/z: profilo', 'w-plane w = z + 1/z: aerofoil'), wide ? w1 + 8 : 8, wide ? 16 : h1 + 16);
      /* la corrente all'infinito */
      q.strokeStyle = '#ffffff'; q.lineWidth = 2; var ax = wide ? w1 + 30 : 30, ay = wide ? H - 30 : H - 24, an = st.alfa * PI / 180; q.beginPath(); q.moveTo(ax, ay); q.lineTo(ax + 34 * Math.cos(an), ay - 34 * Math.sin(an)); q.stroke(); q.fillStyle = '#ffffff'; q.fillText('U, α', ax + 38, ay - 4);
      c1.setAttribute('aria-label', t('Profilo di Joukowski con le linee di corrente', 'Joukowski aerofoil with streamlines'));
      /* C_p sul profilo */
      var dor = [], ven = [], xd = [], xv = [];
      /* dorso: dal bordo d'uscita (θ = −β) in senso antiorario fino al bordo d'attacco (x minimo) */
      var n0 = cerchio.length - 1, kte = Math.round((((-P.beta) % (2 * PI)) + 2 * PI) % (2 * PI) / (2 * PI) * n0) % n0, kle = 0;
      for (var k = 0; k < n0; k++) if (cerchio[k].w[0] < cerchio[kle].w[0]) kle = k;
      var dle = (kle - kte + n0) % n0, sup = [], inf = [];
      for (k = 0; k < n0; k++) { var dd = (k - kte + n0) % n0; if (dd < 3 || dd > n0 - 3) continue; var p = cerchio[k], V = velocitaW(P, p.z), cp = 1 - (V[0] * V[0] + V[1] * V[1]); if (!isFinite(cp) || cp < -8) continue; (dd < dle ? sup : inf).push([dd, p.w[0], -cp]); }
      sup.sort(function (a, b) { return a[0] - b[0]; }); inf.sort(function (a, b) { return b[0] - a[0]; }); sup.forEach(function (a) { xd.push(a[1]); dor.push(a[2]); }); inf.forEach(function (a) { xv.push(a[1]); ven.push(a[2]); });
      F.grafico(c2, { serie: [{ x: xd, y: dor, col: '#ff8a80', etich: ['dorso', 'upper'] }, { x: xv, y: ven, col: '#6bcfff', etich: ['ventre', 'lower'] }], xl: ['x sul profilo', 'x on the aerofoil'], yl: ['−C_p', '−C_p'], legenda: [{ col: '#ff8a80', etich: ['dorso', 'upper surface'] }, { col: '#6bcfff', etich: ['ventre', 'lower surface'] }], descr: ['Coefficiente di pressione sul profilo', 'Pressure coefficient on the aerofoil'] });
      var Bl = blasius(P, 4000), ch = corda(P), te = cabs(velocitaZeta(P, [1, 0]));
      info.innerHTML = 'R = ' + P.R.toFixed(4) + ' · β = ' + (P.beta * 180 / PI).toFixed(3) + '° · ' + t('corda ', 'chord ') + ch.toFixed(4) + '<br>' + t('Circolazione di Kutta ', 'Kutta circulation ') + 'Γ = 4πUR sin(α + β) = <b>' + P.G.toFixed(5) + '</b><br>' +
        t('|dF/dζ| sul bordo d’uscita: ', '|dF/dζ| at the trailing edge: ') + te.toExponential(1) + ' (' + t('Kutta: zero', 'Kutta: zero') + ')<br>' +
        t('Portanza ρUΓ = ', 'Lift ρUΓ = ') + '<b>' + Math.abs(P.G).toFixed(5) + '</b> · Blasius |X − iY| = <b>' + Bl.modulo.toFixed(5) + '</b><br>' +
        'C_L = 2Γ/(U c) = <b>' + (2 * P.G / ch).toFixed(4) + '</b> · ' + t('lastra sottile: ', 'thin plate: ') + '2π sin α = ' + (2 * PI * Math.sin(st.alfa * PI / 180)).toFixed(4) + '<br>' + t('Angolo di portanza nulla: α = −β = ', 'Zero-lift angle: α = −β = ') + (-P.beta * 180 / PI).toFixed(2) + '°';
    }
    disegna();
    F.alRidimensiona(function () { if (c1.offsetParent) disegna(); });
  }

  /* ═══ 5. integrali di contorno e residui ════════════════════════════════ */
  function schedaResidui(div) {
    var G = grigliaUI(div), pan = G.pan, st = { f: 'b', cx: 0.4, cy: 0, r: 1.2, vista: 'integrale' };
    F.scelta(pan, ['Funzione', 'Function'], Object.keys(MERO).map(function (k) { return [k, MERO[k].nome]; }), st.f, function (v) { st.f = v; prepara(); });
    F.cursore(pan, ['centro Re', 'centre Re'], -2, 2, 0.05, st.cx, function (v) { st.cx = v; prepara(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['centro Im', 'centre Im'], -1.5, 1.5, 0.05, st.cy, function (v) { st.cy = v; prepara(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['raggio r', 'radius r'], 0.2, 3, 0.05, st.r, function (v) { st.r = v; prepara(); }, function (v) { return v.toFixed(2); });
    F.scelta(pan, ['A destra', 'On the right'], [['integrale', ['∫ f dz lungo il cammino', '∫ f dz along the path']], ['giri', ['immagine f(γ) e giri attorno a 0', 'image f(γ) and turns around 0']]], st.vista, function (v) { st.vista = v; });
    var info = nota(pan);
    nota(pan, t('Teorema dei residui: se f è olomorfa dentro e su γ tranne che in poli isolati, ∮_γ f dz = 2πi Σ Res(f, z_k) sui poli interni. Il residuo è il coefficiente di 1/(z − z_k) nello sviluppo di Laurent: per un polo semplice p(z_k)/q′(z_k), per un polo doppio la derivata di (z − z_k)²f. L’integrale qui è calcolato con la regola dei trapezi su 2048 punti del cerchio, che per funzioni analitiche e periodiche converge in modo esponenziale; il punto che gira accumula l’integrale parziale (a destra), che arriva esattamente su 2πi Σ Res. Principio dell’argomento: (1/2πi)∮ f′/f dz = Z − P è il numero di giri che l’immagine f(γ) fa attorno all’origine.',
      'Residue theorem: if f is holomorphic inside and on γ except at isolated poles, ∮_γ f dz = 2πi Σ Res(f, z_k) over the interior poles. The residue is the coefficient of 1/(z − z_k) in the Laurent expansion: for a simple pole p(z_k)/q′(z_k), for a double pole the derivative of (z − z_k)²f. The integral here is computed with the trapezoidal rule on 2048 points of the circle, which for analytic periodic functions converges exponentially; the moving point accumulates the partial integral (right), which lands exactly on 2πi Σ Res. Argument principle: (1/2πi)∮ f′/f dz = Z − P is the number of times the image f(γ) winds around the origin.'));
    var c1 = F.tela(G.dx, 0.62), c2 = F.tela(G.dx, 0.62), fondo = null, chiaveF = '', parz = [], imm = [], tot, sr, box;
    function prepara() {
      var M = MERO[st.f], n = 720, z0 = [st.cx, st.cy]; parz = [[0, 0]]; imm = [];
      var s = [0, 0];
      for (var k = 0; k < n; k++) { var th = 2 * PI * (k + 0.5) / n, e = [Math.cos(th), Math.sin(th)], z = ca(z0, ck(e, st.r)), w = M.f(z); s = ca(s, cm(w, ck(cm(I, e), st.r * 2 * PI / n))); parz.push(s); imm.push(w); }
      tot = integraleCerchio(M.f, z0, st.r, 2048); sr = sommaResidui(st.f, z0, st.r);
      var zp = zeriMenoPoli(st.f, z0, st.r), giri = numeroGiri(M.f, z0, st.r, 4000), ap = argomentoIntegrale(M.f, z0, st.r, 4096);
      var vicino = M.poli.concat(M.zeri).some(function (p) { return Math.abs(cabs(cs(p.z, z0)) - st.r) < 0.04; });
      info.innerHTML = '∮ f dz (' + t('trapezi', 'trapezoid') + ') = <b>' + fz(tot) + '</b><br>2πi Σ Res = <b>' + fz(sr.due_pi_i) + '</b> (' + sr.dentro + t(' poli dentro', ' poles inside') + ')<br>' + t('scarto ', 'gap ') + cabs(cs(tot, sr.due_pi_i)).toExponential(1) + '<br>' +
        t('Residui: ', 'Residues: ') + M.poli.map(function (p) { return 'Res(' + fz(p.z) + ') = ' + fz(p.res); }).join('; ') + '<br>' +
        t('Principio dell’argomento: Z − P = ', 'Argument principle: Z − P = ') + zp.Z + ' − ' + zp.P + ' = <b>' + (zp.Z - zp.P) + '</b> · (1/2πi)∮f′/f dz = ' + ap[0].toFixed(5) + ' · ' + t('giri di f(γ): ', 'turns of f(γ): ') + giri.toFixed(5) +
        (vicino ? '<br><span class="bsiFX-ko">' + t('Il cerchio passa vicino a un polo o a uno zero: la quadratura perde precisione.', 'The circle passes close to a pole or zero: quadrature loses accuracy.') + '</span>' : '');
      fondo = null;
    }
    prepara();
    F.anima(c1, function (dt, tempo) {
      var M = MERO[st.f], P0 = F.pennello(c1), q = P0.q, W = P0.W, H = P0.H, asp = H / W;
      box = [-2.8, 2.8, -2.8 * asp, 2.8 * asp];
      var ch = st.f + W + 'x' + H; if (!fondo || chiaveF !== ch) { fondo = immagineDominio(M.f, box, W, H, true, false); chiaveF = ch; }
      q.drawImage(fondo, 0, 0, W, H); q.fillStyle = 'rgba(8,21,34,.25)'; q.fillRect(0, 0, W, H);
      var P = piano(q, W, H, box); assiPiano(q, P, box);
      q.strokeStyle = '#ffffff'; q.lineWidth = 2.2; q.beginPath(); q.arc(P.X(st.cx), P.Y(st.cy), st.r * P.sx, 0, 7); q.stroke();
      q.font = '11px system-ui,sans-serif'; q.textAlign = 'left';
      M.poli.forEach(function (p) { var dentro = cabs(cs(p.z, [st.cx, st.cy])) < st.r; q.fillStyle = dentro ? '#ffd24a' : '#8494a8'; q.beginPath(); q.arc(P.X(p.z[0]), P.Y(p.z[1]), 5, 0, 7); q.fill(); q.fillStyle = '#ffffff'; q.fillText('Res ' + fz(p.res), P.X(p.z[0]) + 7, P.Y(p.z[1]) - 6); });
      M.zeri.forEach(function (p) { q.strokeStyle = '#6bcfff'; q.lineWidth = 2; q.beginPath(); q.arc(P.X(p.z[0]), P.Y(p.z[1]), 5, 0, 7); q.stroke(); });
      var fr = (tempo * 0.12) % 1, k = Math.floor(fr * (parz.length - 1)), th = 2 * PI * fr, zp = [st.cx + st.r * Math.cos(th), st.cy + st.r * Math.sin(th)];
      q.fillStyle = '#ffffff'; q.beginPath(); q.arc(P.X(zp[0]), P.Y(zp[1]), 6, 0, 7); q.fill(); q.strokeStyle = '#081522'; q.lineWidth = 2; q.stroke();
      q.fillStyle = '#ffffff'; q.font = '12px system-ui,sans-serif'; q.fillText('f(z) = ' + M.nome + t('   giallo: poli dentro γ', '   yellow: poles inside γ'), 8, 16);
      c1.setAttribute('aria-label', t('Cammino circolare sul piano colorato di f = ', 'Circular path on the coloured plane of f = ') + M.nome);
      /* a destra */
      var Q = F.pennello(c2), q2 = Q.q, W2 = Q.W, H2 = Q.H;
      if (st.vista === 'integrale') {
        var pts = parz.concat([sr.due_pi_i]), mx = 0.5; pts.forEach(function (p) { if (isFinite(p[0]) && isFinite(p[1])) mx = Math.max(mx, Math.abs(p[0]), Math.abs(p[1])); }); mx = Math.min(mx * 1.15, 60);
        var b2 = [-mx * W2 / H2, mx * W2 / H2, -mx, mx], P2 = piano(q2, W2, H2, b2, 10); assiPiano(q2, P2, b2);
        q2.strokeStyle = 'rgba(94,234,212,.35)'; q2.lineWidth = 1.5; q2.beginPath(); parz.forEach(function (p, i) { if (i) q2.lineTo(P2.X(p[0]), P2.Y(p[1])); else q2.moveTo(P2.X(p[0]), P2.Y(p[1])); }); q2.stroke();
        q2.strokeStyle = '#5eead4'; q2.lineWidth = 2.5; q2.beginPath(); for (var i = 0; i <= k; i++) { var p = parz[i]; if (i) q2.lineTo(P2.X(p[0]), P2.Y(p[1])); else q2.moveTo(P2.X(p[0]), P2.Y(p[1])); } q2.stroke();
        q2.strokeStyle = '#ffd24a'; q2.lineWidth = 2; q2.beginPath(); q2.arc(P2.X(sr.due_pi_i[0]), P2.Y(sr.due_pi_i[1]), 8, 0, 7); q2.stroke();
        q2.fillStyle = '#ffd24a'; q2.font = '12px system-ui,sans-serif'; q2.textAlign = 'left'; q2.fillText('2πi Σ Res', P2.X(sr.due_pi_i[0]) + 10, P2.Y(sr.due_pi_i[1]) - 8);
        q2.fillStyle = '#cfe3f7'; q2.fillText(t('integrale parziale ∫₀^θ f dz: ', 'partial integral ∫₀^θ f dz: ') + fz(parz[k]), 8, 16);
        c2.setAttribute('aria-label', t('Integrale parziale lungo il cammino che arriva a 2πi per la somma dei residui', 'Partial integral along the path reaching 2πi times the sum of residues'));
      } else {
        var mm = 0.5; imm.forEach(function (w) { if (isFinite(w[0]) && isFinite(w[1])) mm = Math.max(mm, Math.min(30, Math.hypot(w[0], w[1]))); }); mm *= 1.1;
        var b3 = [-mm * W2 / H2, mm * W2 / H2, -mm, mm], P3 = piano(q2, W2, H2, b3, 10); assiPiano(q2, P3, b3);
        q2.lineWidth = 2; for (i = 1; i < imm.length; i++) { var a = imm[i - 1], b = imm[i]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) > mm) continue; q2.strokeStyle = 'hsl(' + Math.round(360 * i / imm.length) + ',80%,62%)'; q2.beginPath(); q2.moveTo(P3.X(a[0]), P3.Y(a[1])); q2.lineTo(P3.X(b[0]), P3.Y(b[1])); q2.stroke(); }
        var wk = imm[Math.min(imm.length - 1, k)]; q2.fillStyle = '#ffffff'; q2.beginPath(); q2.arc(P3.X(wk[0]), P3.Y(wk[1]), 5, 0, 7); q2.fill();
        q2.strokeStyle = '#ffffff'; q2.beginPath(); q2.moveTo(P3.X(0), P3.Y(0)); q2.lineTo(P3.X(wk[0]), P3.Y(wk[1])); q2.stroke();
        q2.fillStyle = '#ff8a80'; q2.beginPath(); q2.arc(P3.X(0), P3.Y(0), 4, 0, 7); q2.fill();
        q2.fillStyle = '#cfe3f7'; q2.font = '12px system-ui,sans-serif'; q2.textAlign = 'left'; q2.fillText(t('f(γ): giri attorno a 0 = ', 'f(γ): turns around 0 = ') + Math.round(numeroGiri(M.f, [st.cx, st.cy], st.r, 720)), 8, 16);
        c2.setAttribute('aria-label', t('Immagine del cammino e numero di giri attorno all’origine', 'Image of the path and winding number around the origin'));
      }
    }, { ricomincia: function () { } });
  }

  /* ═══ 6. integrali reali ════════════════════════════════════════════════ */
  function schedaReali(div) {
    var G = grigliaUI(div), pan = G.pan, st = { i: 'coseno' };
    F.scelta(pan, ['Integrale', 'Integral'], Object.keys(INTEGRALI).map(function (k) { return [k, INTEGRALI[k].nome + ' = ' + INTEGRALI[k].testo]; }), st.i, function (v) { st.i = v; prepara(); });
    var info = nota(pan);
    nota(pan, t('Per ∫ R(x) dx su ℝ si chiude il segmento [−R, R] con il semicerchio superiore: se |f| decade come 1/|z|² l’arco dà al più πR·max|f| → 0 (stima ML), e l’integrale è 2πi volte la somma dei residui nel semipiano superiore. Per cos x/(1 + x²) si integra e^(iz)/(1 + z²) e si prende la parte reale: |e^(iz)| = e^(−y) ≤ 1 sopra l’asse e il lemma di Jordan uccide l’arco anche se f decade solo come 1/|z|. Un integrale trigonometrico su [0, 2π] diventa, con z = e^(iθ), un integrale sul cerchio unitario. Per ∫₀^∞ dx/(1 + x³) si usa il settore di apertura 2π/3, lungo il cui lato obliquo l’integrando si ripete moltiplicato per e^(2πi/3). L’animazione fa crescere R: l’arco (grafico sotto) va a zero.',
      'For ∫ R(x) dx over ℝ the segment [−R, R] is closed with the upper semicircle: if |f| decays like 1/|z|² the arc contributes at most πR·max|f| → 0 (ML bound), and the integral is 2πi times the sum of residues in the upper half-plane. For cos x/(1 + x²) one integrates e^(iz)/(1 + z²) and takes the real part: |e^(iz)| = e^(−y) ≤ 1 above the axis and Jordan’s lemma kills the arc even though f decays only like 1/|z|. A trigonometric integral over [0, 2π] becomes, with z = e^(iθ), an integral over the unit circle. For ∫₀^∞ dx/(1 + x³) one uses the sector of opening 2π/3, along whose slanted side the integrand repeats multiplied by e^(2πi/3). The animation grows R: the arc (chart below) goes to zero.'));
    var c1 = F.tela(G.dx, 0.6), c2 = F.tela(G.dx, 0.42), fondo = null, chiave = '';
    function prepara() {
      var A = INTEGRALI[st.i], v = valoreResidui(st.i), qd = A.quad(), ser = [];
      if (A.contorno === 'cerchio') {
        var N = [], E = []; for (var n = 2; n <= 40; n += 2) { N.push(n); E.push(Math.log10(Math.max(1e-17, Math.abs(trapeziPeriodico(A.fr, n) - A.esatto)))); }
        F.grafico(c2, { serie: [{ x: N, y: E, col: '#5eead4', etich: ['errore', 'error'] }], xl: ['punti della regola dei trapezi', 'trapezoid points'], yl: ['log₁₀ |errore|', 'log₁₀ |error|'], descr: ['Convergenza esponenziale dei trapezi per un integrando periodico', 'Exponential convergence of the trapezoid rule for a periodic integrand'] });
      } else {
        var Rs = [], ar = [], bound = []; for (var R = 1.5; R <= 20; R += 0.25) { Rs.push(R); ar.push(Math.log10(cabs(integraleArco(st.i, R, 2000)))); var a1 = A.contorno === 'settore' ? 2 * PI / 3 : PI, mxf = 0; for (var k = 0; k <= 200; k++) { var th = a1 * k / 200; mxf = Math.max(mxf, cabs(A.fz([R * Math.cos(th), R * Math.sin(th)]))); } bound.push(Math.log10(a1 * R * mxf)); }
        ser = [{ x: Rs, y: ar, col: '#5eead4', etich: ['|∫ arco|', '|∫ arc|'] }, { x: Rs, y: bound, col: '#ffd24a', tratt: true, etich: ['stima ML', 'ML bound'] }];
        F.grafico(c2, { serie: ser, xl: ['raggio R', 'radius R'], yl: ['log₁₀', 'log₁₀'], legenda: [{ col: '#5eead4', etich: ['|∫ sull’arco|', '|∫ over the arc|'] }, { col: '#ffd24a', etich: ['stima ML = lunghezza × max|f|', 'ML bound = length × max|f|'] }], descr: ['Il contributo dell’arco tende a zero', 'The arc contribution tends to zero'] });
      }
      var sres = [0, 0]; A.poli.forEach(function (p) { sres = ca(sres, p.res); });
      info.innerHTML = A.nome + ' = <b>' + A.testo + '</b> = ' + A.esatto.toFixed(14) + '<br>' + t('Residui: ', 'Residues: ') + A.poli.map(function (p) { return 'Res(' + fz(p.z) + ') = ' + fz(p.res); }).join('; ') + '<br>' +
        t('Dal teorema dei residui: ', 'From the residue theorem: ') + '<b>' + v.toFixed(14) + '</b>' + (A.contorno === 'settore' ? ' = 2πi Res/(1 − e^(2πi/3))' : A.reale ? ' = Re(2πi Res)' : ' = 2πi Σ Res') + '<br>' +
        t('Quadratura numerica: ', 'Numerical quadrature: ') + '<b>' + qd.toFixed(14) + '</b> (' + (A.contorno === 'cerchio' ? t('trapezi, 32 punti', 'trapezoid, 32 points') : st.i === 'coseno' ? t('Simpson su [−400π, 400π]', 'Simpson on [−400π, 400π]') : t('doppio esponenziale', 'double exponential')) + ')<br>' +
        t('Scarti: residui ', 'Gaps: residues ') + Math.abs(v - A.esatto).toExponential(1) + ', ' + t('quadratura ', 'quadrature ') + Math.abs(qd - A.esatto).toExponential(1);
      fondo = null;
    }
    prepara();
    F.anima(c1, function (dt, tempo) {
      var A = INTEGRALI[st.i], P0 = F.pennello(c1), q = P0.q, W = P0.W, H = P0.H, asp = H / W, Rm = A.contorno === 'cerchio' ? 2.6 : 3.2, box = [-Rm, Rm, -Rm * asp * 0.35, Rm * asp * 1.65];
      if (A.contorno === 'cerchio') box = [-Rm, Rm, -Rm * asp, Rm * asp];
      var ch = st.i + W + 'x' + H; if (!fondo || ch !== chiave) { fondo = immagineDominio(A.fz, box, W, H, true, false); chiave = ch; }
      q.drawImage(fondo, 0, 0, W, H); q.fillStyle = 'rgba(8,21,34,.35)'; q.fillRect(0, 0, W, H);
      var P = piano(q, W, H, box); assiPiano(q, P, box, 'rgba(255,255,255,.5)');
      var R = A.contorno === 'cerchio' ? 1 : 1.2 + 1.8 * (0.5 - 0.5 * Math.cos(tempo * 0.6));
      q.strokeStyle = '#ffffff'; q.lineWidth = 2.5; q.beginPath();
      if (A.contorno === 'semi') { q.moveTo(P.X(-R), P.Y(0)); q.lineTo(P.X(R), P.Y(0)); q.arc(P.X(0), P.Y(0), R * P.sx, 0, -PI, true); }
      else if (A.contorno === 'settore') { q.moveTo(P.X(0), P.Y(0)); q.lineTo(P.X(R), P.Y(0)); q.arc(P.X(0), P.Y(0), R * P.sx, 0, -2 * PI / 3, true); q.closePath(); }
      else q.arc(P.X(0), P.Y(0), P.sx, 0, 7);
      q.stroke();
      /* frecce di percorrenza */
      q.fillStyle = '#ffffff'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'left';
      A.poli.forEach(function (p) { q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(P.X(p.z[0]), P.Y(p.z[1]), 5, 0, 7); q.fill(); q.fillStyle = '#ffffff'; q.fillText('Res = ' + fz(p.res), P.X(p.z[0]) + 8, P.Y(p.z[1]) - 6); });
      var ar = A.contorno === 'cerchio' ? null : integraleArco(st.i, R, 600);
      q.fillText(A.contorno === 'cerchio' ? t('z = e^(iθ): il cerchio unitario', 'z = e^(iθ): the unit circle') : 'R = ' + R.toFixed(2) + ' · |∫ ' + t('arco', 'arc') + '| = ' + cabs(ar).toExponential(2), 8, 16);
      c1.setAttribute('aria-label', t('Cammino di integrazione e poli per ', 'Integration path and poles for ') + A.nome);
    }, { ricomincia: function () { } });
  }

  F.sezione('smatanalcomp', {
    titolo: ['🌀 Analisi complessa', '🌀 Complex analysis'],
    sotto: ['Funzioni di variabile complessa viste a colori e in 3D, mappe conformi e il profilo di Joukowski, integrali di contorno e residui: ogni teorema controllato con i numeri.', 'Functions of a complex variable seen in colour and in 3D, conformal maps and the Joukowski aerofoil, contour integrals and residues: every theorem checked with numbers.'],
    schede: [
      { nome: ['🎨 Colorazione del dominio', '🎨 Domain colouring'], costruisci: schedaDominio },
      { nome: ['🏔️ Paesaggio |f| 3D', '🏔️ |f| landscape 3D'], costruisci: scheda3d(schedaPaesaggio) },
      { nome: ['📐 Mappe conformi', '📐 Conformal maps'], costruisci: schedaMappe },
      { nome: ['✈️ Joukowski', '✈️ Joukowski'], costruisci: schedaJoukowski },
      { nome: ['⭕ Residui', '⭕ Residues'], costruisci: schedaResidui },
      { nome: ['∫ Integrali reali', '∫ Real integrals'], costruisci: schedaReali }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
