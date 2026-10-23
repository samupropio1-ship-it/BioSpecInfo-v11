/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-numerici.js — 🧮 metodi numerici
   BioSpecInfo · © Samuele Pio Provenzano

   Quando la formula chiusa non c'e' (o non conviene) si calcola: ma ogni
   metodo ha un ORDINE, cioe' quanto in fretta l'errore scende, e un modo
   di sbagliare. Qui si vede l'uno e l'altro, e l'ordine si MISURA:

   · ZERI di una funzione: bisezione (lineare, sicura), Newton (quadratica,
     se parte vicino), secanti (ordine aureo 1,618), punto fisso; la tabella
     delle iterazioni e l'ordine stimato da log|e_{n+1}| / log|e_n|;
   · INTEGRAZIONE: rettangoli, trapezi, Simpson, Gauss-Legendre; l'errore
     contro il numero di intervalli in scala log-log, con la pendenza che
     dice l'ordine (2 per i trapezi, 4 per Simpson);
   · EQUAZIONI DIFFERENZIALI: Eulero, Heun, Runge-Kutta 4 su y' = f(x, y);
     l'errore finale contro il passo (ordini 1, 2, 4) e il caso «rigido»
     in cui Eulero esplode;
   · INTERPOLAZIONE: il polinomio di Lagrange su nodi equispaziati e su nodi
     di Čebyšëv, e la spline cubica naturale; il fenomeno di Runge.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function campo(pan, et, val, cambia) { var i = F.el('input', { type: 'text', value: val, 'aria-label': F.tt(et), spellcheck: 'false', autocomplete: 'off' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: F.tt(et) })]), i])); i.addEventListener('change', function () { cambia(i.value); }); return i; }
  function funzione(testo, vars) { var e = C.leggi(testo), extra = C.simboli(e).filter(function (v) { return vars.indexOf(v) < 0; }); if (extra.length) throw new Error(t('variabili non previste: ', 'unexpected variables: ') + extra.join(', ')); var f = C.compila(e); return { e: e, f: f }; }
  /* pendenza di una retta ai minimi quadrati (per stimare l'ordine) */
  function pendenza(x, y) { var n = x.length, mx = 0, my = 0, sxx = 0, sxy = 0; for (var i = 0; i < n; i++) { mx += x[i] / n; my += y[i] / n; } for (i = 0; i < n; i++) { sxx += (x[i] - mx) * (x[i] - mx); sxy += (x[i] - mx) * (y[i] - my); } return sxy / sxx; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function bisezione(f, a, b, tol, max) {
    var fa = f(a), fb = f(b), it = []; if (!(fa * fb <= 0)) throw new Error(t('f(a) e f(b) devono avere segni opposti', 'f(a) and f(b) must have opposite signs'));
    for (var i = 0; i < (max || 60); i++) { var m = (a + b) / 2, fm = f(m); it.push(m); if (fm === 0 || (b - a) / 2 < tol) break; if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; } }
    return it;
  }
  function newton(f, df, x0, tol, max) { var it = [x0], x = x0; for (var i = 0; i < (max || 50); i++) { var d = df(x); if (!d) break; var xn = x - f(x) / d; it.push(xn); if (!isFinite(xn) || Math.abs(xn - x) < tol) break; x = xn; } return it; }
  function secanti(f, x0, x1, tol, max) { var it = [x0, x1]; for (var i = 0; i < (max || 50); i++) { var f0 = f(x0), f1 = f(x1); if (f1 === f0) break; var x2 = x1 - f1 * (x1 - x0) / (f1 - f0); it.push(x2); if (!isFinite(x2) || Math.abs(x2 - x1) < tol) break; x0 = x1; x1 = x2; } return it; }
  function puntoFisso(g, x0, tol, max) { var it = [x0], x = x0; for (var i = 0; i < (max || 80); i++) { var xn = g(x); it.push(xn); if (!isFinite(xn) || Math.abs(xn - x) < tol) break; x = xn; } return it; }
  /* ordine di convergenza dagli ultimi errori: p ≈ log(e_{n+1}/e_n) / log(e_n/e_{n−1}) */
  function ordine(it, radice) {
    var e = it.map(function (x) { return Math.abs(x - radice); }).filter(function (v) { return v > 1e-14 && v < 0.5; });
    if (e.length < 3) return NaN;
    var k = e.length - 1; return Math.log(e[k] / e[k - 1]) / Math.log(e[k - 1] / e[k - 2]);
  }
  /* quadrature */
  function rettangoli(f, a, b, n) { var h = (b - a) / n, s = 0; for (var i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }
  function trapezi(f, a, b, n) { var h = (b - a) / n, s = (f(a) + f(b)) / 2; for (var i = 1; i < n; i++) s += f(a + i * h); return s * h; }
  function simpson(f, a, b, n) { if (n % 2) n++; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
  var GL = { 2: [[-0.5773502691896257, 1], [0.5773502691896257, 1]], 3: [[-0.7745966692414834, 5 / 9], [0, 8 / 9], [0.7745966692414834, 5 / 9]], 4: [[-0.8611363115940526, 0.3478548451374538], [-0.3399810435848563, 0.6521451548625461], [0.3399810435848563, 0.6521451548625461], [0.8611363115940526, 0.3478548451374538]] };
  function gauss(f, a, b, n, punti) { var h = (b - a) / n, s = 0, P = GL[punti || 3]; for (var i = 0; i < n; i++) { var c = a + (i + 0.5) * h; P.forEach(function (p) { s += p[1] * f(c + p[0] * h / 2); }); } return s * h / 2; }
  /* integratori per y' = f(x, y) */
  function eulero(f, x0, y0, x1, n) { var h = (x1 - x0) / n, x = x0, y = y0, xs = [x], ys = [y]; for (var i = 0; i < n; i++) { y += h * f(x, y); x += h; xs.push(x); ys.push(y); } return { xs: xs, ys: ys }; }
  function heun(f, x0, y0, x1, n) { var h = (x1 - x0) / n, x = x0, y = y0, xs = [x], ys = [y]; for (var i = 0; i < n; i++) { var k1 = f(x, y), k2 = f(x + h, y + h * k1); y += h / 2 * (k1 + k2); x += h; xs.push(x); ys.push(y); } return { xs: xs, ys: ys }; }
  function rk4(f, x0, y0, x1, n) { var h = (x1 - x0) / n, x = x0, y = y0, xs = [x], ys = [y]; for (var i = 0; i < n; i++) { var k1 = f(x, y), k2 = f(x + h / 2, y + h / 2 * k1), k3 = f(x + h / 2, y + h / 2 * k2), k4 = f(x + h, y + h * k3); y += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); x += h; xs.push(x); ys.push(y); } return { xs: xs, ys: ys }; }
  /* interpolazione */
  function lagrange(xn, yn) { return function (x) { var s = 0; for (var i = 0; i < xn.length; i++) { var l = 1; for (var j = 0; j < xn.length; j++) if (j !== i) l *= (x - xn[j]) / (xn[i] - xn[j]); s += yn[i] * l; } return s; }; }
  function chebyshev(a, b, n) { var out = []; for (var k = 0; k < n; k++) out.push((a + b) / 2 + (b - a) / 2 * Math.cos((2 * k + 1) * Math.PI / (2 * n))); return out.sort(function (p, q) { return p - q; }); }
  function spline(xn, yn) {
    /* spline cubica naturale: momenti M_i dal sistema tridiagonale (algoritmo di Thomas) */
    var n = xn.length - 1, h = [], al = [], l = [1], mu = [0], z = [0], c = new Array(n + 1).fill(0), b = [], d = [];
    for (var i = 0; i < n; i++) h.push(xn[i + 1] - xn[i]);
    for (i = 1; i < n; i++) al[i] = 3 / h[i] * (yn[i + 1] - yn[i]) - 3 / h[i - 1] * (yn[i] - yn[i - 1]);
    for (i = 1; i < n; i++) { l[i] = 2 * (xn[i + 1] - xn[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]; }
    l[n] = 1; z[n] = 0; c[n] = 0;
    for (var j = n - 1; j >= 0; j--) { c[j] = z[j] - mu[j] * c[j + 1]; b[j] = (yn[j + 1] - yn[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3; d[j] = (c[j + 1] - c[j]) / (3 * h[j]); }
    return function (x) { var k = 0; while (k < n - 1 && x > xn[k + 1]) k++; var u = x - xn[k]; return yn[k] + b[k] * u + c[k] * u * u + d[k] * u * u * u; };
  }
  F.calcolo.numerici = { bisezione: bisezione, newton: newton, secanti: secanti, puntoFisso: puntoFisso, ordine: ordine, rettangoli: rettangoli, trapezi: trapezi, simpson: simpson, gauss: gauss, eulero: eulero, heun: heun, rk4: rk4, lagrange: lagrange, chebyshev: chebyshev, spline: spline, pendenza: pendenza };

  /* ═══ 1. zeri ═══════════════════════════════════════════════════════════ */
  function schedaZeri(div) {
    var G = griglia(div), st = { f: 'x^3 - 2*x - 5', a: 2, b: 3, x0: 2, g: '(2*x + 5)^(1/3)' }, info, tab;
    campo(G.pan, ['f(x) = 0', 'f(x) = 0'], st.f, function (v) { st.f = v; calcola(); });
    campo(G.pan, ['intervallo a (bisezione)', 'interval a (bisection)'], String(st.a), function (v) { st.a = +v; calcola(); });
    campo(G.pan, ['intervallo b', 'interval b'], String(st.b), function (v) { st.b = +v; calcola(); });
    campo(G.pan, ['x₀ (Newton, secanti, punto fisso)', 'x₀ (Newton, secant, fixed point)'], String(st.x0), function (v) { st.x0 = +v; calcola(); });
    campo(G.pan, ['g(x) per il punto fisso x = g(x)', 'g(x) for the fixed point x = g(x)'], st.g, function (v) { st.g = v; calcola(); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.5); tab = F.el('div', { style: 'overflow-x:auto' }); G.dx.appendChild(tab);
    function calcola() {
      try {
        var A = funzione(st.f, ['x']), fx = function (x) { return A.f({ x: x }); }, D = C.compila(C.deriva(A.e, 'x')), dfx = function (x) { return D({ x: x }); }, g = st.g ? funzione(st.g, ['x']) : null;
        var M = { bis: bisezione(fx, st.a, st.b, 1e-14), new: newton(fx, dfx, st.x0, 1e-15), sec: secanti(fx, st.x0, st.x0 + 0.1, 1e-15), fis: g ? puntoFisso(function (x) { return g.f({ x: x }); }, st.x0, 1e-15) : [] };
        var r = M.new[M.new.length - 1]; if (!isFinite(r) || Math.abs(fx(r)) > 1e-8) r = M.bis[M.bis.length - 1];
        var serie = [], nomi = [['bis', t('bisezione', 'bisection'), '#9fb1c6'], ['new', 'Newton', '#5eead4'], ['sec', t('secanti', 'secant'), '#ffd24a'], ['fis', t('punto fisso', 'fixed point'), '#ff8a80']];
        nomi.forEach(function (N) { var it = M[N[0]]; if (!it.length) return; var xs = [], ys = []; it.forEach(function (x, k) { var e = Math.abs(x - r); if (e > 0 && isFinite(e)) { xs.push(k); ys.push(Math.log10(e)); } }); if (xs.length) serie.push({ x: xs, y: ys, col: N[2], larg: 2, etich: N[1] }); });
        F.grafico(c, { serie: serie, xl: [t('iterazione', 'iteration'), t('iterazione', 'iteration')], yl: ['log₁₀ |errore|', 'log₁₀ |error|'], ymin: -16, legenda: serie.map(function (s) { return { col: s.col, etich: s.etich }; }) });
        var righe = []; for (var k = 0; k < 12; k++) righe.push('<tr><td>' + k + '</td>' + nomi.map(function (N) { var x = M[N[0]][k]; return '<td class="bsiFX-num">' + (x === undefined ? '' : (+x.toPrecision(15)).toString()) + '</td>'; }).join('') + '</tr>');
        tab.innerHTML = '<table class="bsiFX-tab"><tr><th>n</th>' + nomi.map(function (N) { return '<th>' + N[1] + '</th>'; }).join('') + '</tr>' + righe.join('') + '</table>';
        var gd = g ? Math.abs(C.compila(C.deriva(g.e, 'x'))({ x: r })) : NaN;
        info.innerHTML = t('Radice ', 'Root ') + 'x* = <b class="bsiFX-num">' + (+r.toPrecision(15)) + '</b> (f(x*) = ' + fx(r).toExponential(1) + ')<br>' + t('Ordine misurato: ', 'Measured order: ') + nomi.map(function (N) { var o = ordine(M[N[0]], r); return N[1] + ' ' + (isFinite(o) ? fmt(o) : '—') + ' (' + M[N[0]].length + ' it.)'; }).join(' · ') +
          '<br>' + t('Attesi: bisezione 1 (dimezza l’intervallo), Newton 2 (raddoppia le cifre esatte), secanti 1,618, punto fisso 1 con fattore |g′(x*)|', 'Expected: bisection 1 (halves the interval), Newton 2 (doubles the correct digits), secant 1.618, fixed point 1 with factor |g′(x*)|') + (isFinite(gd) ? ' = ' + fmt(gd) + (gd < 1 ? t(' < 1: converge', ' < 1: converges') : t(' ≥ 1: non converge', ' ≥ 1: does not converge')) : '') + '.';
      } catch (e) { info.textContent = '⚠ ' + e.message; tab.innerHTML = ''; }
    }
    calcola(); F.alRidimensiona(calcola);
  }

  /* ═══ 2. integrazione ═══════════════════════════════════════════════════ */
  function schedaIntegrazione(div) {
    var G = griglia(div), st = { f: 'e^(-x^2)', a: 0, b: 2 }, info;
    campo(G.pan, ['f(x)', 'f(x)'], st.f, function (v) { st.f = v; calcola(); });
    campo(G.pan, ['a', 'a'], String(st.a), function (v) { st.a = +v; calcola(); });
    campo(G.pan, ['b', 'b'], String(st.b), function (v) { st.b = +v; calcola(); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.55);
    function calcola() {
      try {
        var A = funzione(st.f, ['x']), f = function (x) { return A.f({ x: x }); }, esatto = gauss(f, st.a, st.b, 400, 4), metodi = [['ret', t('rettangoli (punto medio)', 'midpoint'), rettangoli, '#9fb1c6', 2], ['tra', t('trapezi', 'trapezoid'), trapezi, '#ffd24a', 2], ['sim', 'Simpson', simpson, '#5eead4', 4], ['gau', 'Gauss-Legendre 3', function (f, a, b, n) { return gauss(f, a, b, n, 3); }, '#ff8a80', 6]];
        var serie = [], ordini = [];
        metodi.forEach(function (M) { var xs = [], ys = []; [2, 4, 8, 16, 32, 64, 128, 256].forEach(function (n) { var e = Math.abs(M[2](f, st.a, st.b, n) - esatto); if (e > 1e-15) { xs.push(Math.log10(n)); ys.push(Math.log10(e)); } }); if (xs.length > 1) { serie.push({ x: xs, y: ys, col: M[3], larg: 2, etich: M[1] }); var k = Math.min(4, xs.length); ordini.push(M[1] + ' ' + fmt(-pendenza(xs.slice(0, k), ys.slice(0, k))) + ' (' + t('teoria ', 'theory ') + M[4] + ')'); } });
        F.grafico(c, { serie: serie, punti: [], xl: ['log₁₀ n', 'log₁₀ n'], yl: ['log₁₀ |errore|', 'log₁₀ |error|'], legenda: serie.map(function (s) { return { col: s.col, etich: s.etich }; }) });
        info.innerHTML = '∫ = <b class="bsiFX-num">' + (+esatto.toPrecision(14)) + '</b> (' + t('riferimento: Gauss a 4 punti su 400 intervalli', 'reference: 4-point Gauss over 400 intervals') + ')<br>' + t('Con n = 8: ', 'With n = 8: ') + metodi.map(function (M) { return M[1] + ' ' + (+M[2](f, st.a, st.b, 8).toPrecision(10)); }).join(' · ') + '<br>' + t('Ordini misurati (pendenza della retta): ', 'Measured orders (line slope): ') + ordini.join(' · ') + '<br>' + t('Raddoppiare gli intervalli divide l’errore per 4 con i trapezi, per 16 con Simpson: con funzioni lisce Simpson è quasi sempre la scelta giusta. Se f ha un angolo o una singolarità gli ordini crollano: prova |x − 1| su [0, 2].', 'Doubling the intervals divides the error by 4 with the trapezoid rule, by 16 with Simpson: for smooth functions Simpson is almost always the right choice. If f has a kink or a singularity the orders collapse: try |x − 1| on [0, 2].');
      } catch (e) { info.textContent = '⚠ ' + e.message; }
    }
    calcola(); F.alRidimensiona(calcola);
  }

  /* ═══ 3. EDO ════════════════════════════════════════════════════════════ */
  var EDO = [['-2*x*y', '1', '0', '2', 'e^(-x^2)', ['y′ = −2xy (gaussiana)', 'y′ = −2xy (Gaussian)']], ['y', '1', '0', '2', 'e^x', ['y′ = y', 'y′ = y']], ['x - y', '0', '0', '3', 'x - 1 + e^(-x)', ['y′ = x − y', 'y′ = x − y']], ['-50*(y - cos(x))', '0', '0', '1', '', ['rigida: y′ = −50(y − cos x)', 'stiff: y′ = −50(y − cos x)']]];
  function schedaEDO(div) {
    var G = griglia(div), st = { f: EDO[0][0], y0: EDO[0][1], x0: EDO[0][2], x1: EDO[0][3], es: EDO[0][4], n: 10 }, info, campi = {};
    F.scelta(G.pan, ['Esempi', 'Examples'], EDO.map(function (e, i) { return [String(i), F.tt(e[5])]; }), '0', function (v) { var e = EDO[+v]; st.f = e[0]; st.y0 = e[1]; st.x0 = e[2]; st.x1 = e[3]; st.es = e[4]; ['f', 'y0', 'x0', 'x1', 'es'].forEach(function (k) { campi[k].value = st[k]; }); calcola(); });
    campi.f = campo(G.pan, ["y′ = f(x, y)", "y′ = f(x, y)"], st.f, function (v) { st.f = v; calcola(); });
    campi.x0 = campo(G.pan, ['x₀', 'x₀'], st.x0, function (v) { st.x0 = v; calcola(); });
    campi.y0 = campo(G.pan, ['y(x₀)', 'y(x₀)'], st.y0, function (v) { st.y0 = v; calcola(); });
    campi.x1 = campo(G.pan, [t('fino a x', 'up to x'), t('fino a x', 'up to x')], st.x1, function (v) { st.x1 = v; calcola(); });
    campi.es = campo(G.pan, [t('soluzione esatta (facoltativa)', 'exact solution (optional)'), t('soluzione esatta (facoltativa)', 'exact solution (optional)')], st.es, function (v) { st.es = v; calcola(); });
    F.cursore(G.pan, ['passi n', 'steps n'], 2, 100, 1, st.n, function (v) { st.n = v; calcola(); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.5), ce = F.tela(G.dx, 0.4);
    function calcola() {
      try {
        var A = funzione(st.f, ['x', 'y']), f = function (x, y) { return A.f({ x: x, y: y }); }, x0 = +C.valuta(C.leggi(st.x0)), x1 = +C.valuta(C.leggi(st.x1)), y0 = +C.valuta(C.leggi(st.y0));
        var ex = st.es ? funzione(st.es, ['x']) : null, Y = ex ? function (x) { return ex.f({ x: x }); } : (function () { var R = rk4(f, x0, y0, x1, 20000); return function (x) { var k = Math.round((x - x0) / (x1 - x0) * 20000); return R.ys[Math.max(0, Math.min(20000, k))]; }; })();
        var E = eulero(f, x0, y0, x1, st.n), Hn = heun(f, x0, y0, x1, st.n), K = rk4(f, x0, y0, x1, st.n), xr = [], yr = [];
        for (var i = 0; i <= 300; i++) { var x = x0 + (x1 - x0) * i / 300; xr.push(x); yr.push(Y(x)); }
        F.grafico(c, { serie: [{ x: xr, y: yr, col: '#c9d3df', larg: 3, etich: ex ? t('esatta', 'exact') : t('riferimento', 'reference') }, { x: E.xs, y: E.ys, col: '#ff8a80', etich: 'Eulero' }, { x: Hn.xs, y: Hn.ys, col: '#ffd24a', etich: 'Heun' }, { x: K.xs, y: K.ys, col: '#5eead4', etich: 'RK4' }], punti: K.xs.map(function (x, i) { return { x: x, y: K.ys[i], col: '#5eead4', r: 2.5 }; }), xl: ['x', 'x'], yl: ['y', 'y'], descr: ['soluzione esatta e soluzioni numeriche', 'exact and numerical solutions'], legenda: [{ col: '#c9d3df', etich: ex ? ['esatta', 'exact'] : ['riferimento', 'reference'] }, { col: '#ff8a80', etich: 'Eulero' }, { col: '#ffd24a', etich: 'Heun' }, { col: '#5eead4', etich: 'RK4' }] });
        var serie = [], ordini = [];
        [['Eulero', eulero, '#ff8a80', 1], ['Heun', heun, '#ffd24a', 2], ['RK4', rk4, '#5eead4', 4]].forEach(function (M) { var xs = [], ys = []; [4, 8, 16, 32, 64, 128].forEach(function (n) { var r = M[1](f, x0, y0, x1, n), e = Math.abs(r.ys[n] - Y(x1)); if (e > 1e-13 && isFinite(e)) { xs.push(Math.log10((x1 - x0) / n)); ys.push(Math.log10(e)); } }); if (xs.length > 1) { serie.push({ x: xs, y: ys, col: M[2], larg: 2, etich: M[0] }); ordini.push(M[0] + ' ' + fmt(pendenza(xs.slice(-3), ys.slice(-3))) + ' (' + t('teoria ', 'theory ') + M[3] + ')'); } });
        F.grafico(ce, { serie: serie, xl: ['log₁₀ h', 'log₁₀ h'], yl: ['log₁₀ |errore in x₁|', 'log₁₀ |error at x₁|'], legenda: serie.map(function (s) { return { col: s.col, etich: s.etich }; }) });
        var h = (x1 - x0) / st.n;
        info.innerHTML = 'h = ' + fmt(h) + ' · ' + t('errore in x = ', 'error at x = ') + fmt(x1) + ': Eulero ' + fmt(Math.abs(E.ys[st.n] - Y(x1))) + ', Heun ' + fmt(Math.abs(Hn.ys[st.n] - Y(x1))) + ', RK4 ' + fmt(Math.abs(K.ys[st.n] - Y(x1))) + '<br>' + t('Ordini misurati: ', 'Measured orders: ') + ordini.join(' · ') +
          (/-50/.test(st.f) ? '<br>' + t('Equazione rigida: per h > 2/50 = 0,04 Eulero esplicito è instabile (oscilla e cresce) anche se la soluzione è liscia; prova n < 25. Servono metodi impliciti.', 'Stiff equation: for h > 2/50 = 0.04 explicit Euler is unstable (oscillates and grows) although the solution is smooth; try n < 25. Implicit methods are needed.') : '');
      } catch (e) { info.textContent = '⚠ ' + e.message; }
    }
    calcola(); F.alRidimensiona(calcola);
  }

  /* ═══ 4. interpolazione ═════════════════════════════════════════════════ */
  function schedaInterpolazione(div) {
    var G = griglia(div), st = { f: '1/(1 + 25*x^2)', n: 11, a: -1, b: 1 }, info;
    campo(G.pan, ['f(x)', 'f(x)'], st.f, function (v) { st.f = v; calcola(); });
    F.cursore(G.pan, ['nodi n', 'nodes n'], 3, 25, 1, st.n, function (v) { st.n = v; calcola(); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.6);
    function calcola() {
      try {
        var A = funzione(st.f, ['x']), f = function (x) { return A.f({ x: x }); }, a = st.a, b = st.b, n = st.n;
        var xe = [], xc = chebyshev(a, b, n); for (var i = 0; i < n; i++) xe.push(a + (b - a) * i / (n - 1));
        var Le = lagrange(xe, xe.map(f)), Lc = lagrange(xc, xc.map(f)), S = spline(xe, xe.map(f)), xs = [], y0 = [], y1 = [], y2 = [], y3 = [], m1 = 0, m2 = 0, m3 = 0;
        for (i = 0; i <= 600; i++) { var x = a + (b - a) * i / 600, v = f(x); xs.push(x); y0.push(v); y1.push(Le(x)); y2.push(Lc(x)); y3.push(S(x)); m1 = Math.max(m1, Math.abs(Le(x) - v)); m2 = Math.max(m2, Math.abs(Lc(x) - v)); m3 = Math.max(m3, Math.abs(S(x) - v)); }
        F.grafico(c, { serie: [{ x: xs, y: y0, col: '#c9d3df', larg: 3, etich: 'f' }, { x: xs, y: y1, col: '#ff8a80', etich: t('Lagrange equispaziato', 'Lagrange equispaced') }, { x: xs, y: y2, col: '#5eead4', etich: t('Lagrange Čebyšëv', 'Lagrange Chebyshev') }, { x: xs, y: y3, col: '#ffd24a', tratt: true, etich: 'spline' }], punti: xe.map(function (x) { return { x: x, y: f(x), col: '#ff8a80', r: 3 }; }).concat(xc.map(function (x) { return { x: x, y: f(x), col: '#5eead4', r: 3 }; })), ymin: -0.6, ymax: 1.4, xl: ['x', 'x'], yl: ['y', 'y'], descr: ['f e i tre interpolanti', 'f and the three interpolants'], legenda: [{ col: '#c9d3df', etich: 'f' }, { col: '#ff8a80', etich: ['Lagrange, nodi equispaziati', 'Lagrange, equispaced nodes'] }, { col: '#5eead4', etich: ['Lagrange, nodi di Čebyšëv', 'Lagrange, Chebyshev nodes'] }, { col: '#ffd24a', etich: ['spline cubica naturale', 'natural cubic spline'] }] });
        info.innerHTML = t('Errore massimo su [−1, 1]: ', 'Maximum error on [−1, 1]: ') + t('equispaziati ', 'equispaced ') + '<b class="bsiFX-num">' + fmt(m1) + '</b> · Čebyšëv <b class="bsiFX-num">' + fmt(m2) + '</b> · spline <b class="bsiFX-num">' + fmt(m3) + '</b><br>' + t('Fenomeno di Runge: con nodi equispaziati aumentare il grado PEGGIORA l’approssimazione ai bordi (prova n = 21). I nodi di Čebyšëv, più fitti agli estremi, la fanno convergere; la spline, a pezzi di grado 3, non oscilla mai. È per questo che una curva di taratura non si interpola con un polinomio di grado alto.', 'Runge’s phenomenon: with equispaced nodes raising the degree MAKES the approximation worse near the ends (try n = 21). Chebyshev nodes, denser at the ends, make it converge; the spline, piecewise cubic, never oscillates. This is why a calibration curve is not interpolated with a high-degree polynomial.');
      } catch (e) { info.textContent = '⚠ ' + e.message; }
    }
    calcola(); F.alRidimensiona(calcola);
  }

  F.sezione('smatnum', {
    titolo: ['🧮 Metodi numerici', '🧮 Numerical methods'],
    sotto: ['Zeri, integrali, equazioni differenziali e interpolazione calcolati con i metodi numerici classici, con l’ordine di convergenza misurato e i casi in cui ogni metodo sbaglia.', 'Roots, integrals, differential equations and interpolation computed with the classical numerical methods, with the order of convergence measured and the cases where each method fails.'],
    schede: [
      { nome: ['🎯 Zeri', '🎯 Roots'], costruisci: schedaZeri },
      { nome: ['∫ Integrazione', '∫ Integration'], costruisci: schedaIntegrazione },
      { nome: ['🌀 EDO', '🌀 ODEs'], costruisci: schedaEDO },
      { nome: ['📈 Interpolazione', '📈 Interpolation'], costruisci: schedaInterpolazione }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
