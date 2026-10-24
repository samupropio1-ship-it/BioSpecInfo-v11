/* verifica di bsi-fis-analitica.js (F.calcolo.analitica) */
var C = require('./carica.js')(['bsi-fis-analitica.js']), A = C.analitica;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* 1. K(k) con l'AGM contro valori tabulati e contro la quadratura diretta ∫₀^{π/2} dφ/√(1 − k² sin²φ) */
ok('K(0) = π/2', A.K(0), Math.abs(A.K(0) - Math.PI / 2) < 1e-15);
ok('K(1/√2) = Γ(1/4)²/(4√π) = 1,854074677301372', A.K(Math.SQRT1_2).toFixed(15), Math.abs(A.K(Math.SQRT1_2) - 1.854074677301372) < 1e-13);
function Kquad(k) { var N = 20000, s = 0; for (var i = 0; i < N; i++) { var f = (i + 0.5) / N * Math.PI / 2; s += 1 / Math.sqrt(1 - k * k * Math.sin(f) * Math.sin(f)); } return s * Math.PI / 2 / N; }
var md = 0; [0.1, 0.5, 0.9, 0.99].forEach(function (k) { md = Math.max(md, Math.abs(A.K(k) - Kquad(k)) / Kquad(k)); });
ok('K(k) AGM = quadratura (k = 0,1 … 0,99)', md.toExponential(2), md < 1e-8);

/* 2. periodo esatto contro integrazione numerica RK4 */
var mx = 0, righe = [];
[-0.9, 0, 0.5, 0.9, 0.99, 1.5, 3].forEach(function (E) { var a = A.periodo(E), b = A.periodoNumerico(E, 1e-3), r = Math.abs(a - b) / a; mx = Math.max(mx, r); righe.push('E=' + E + ': ' + a.toFixed(6) + ' vs ' + b.toFixed(6)); });
console.log('    ' + righe.join('\n    '));
ok('periodo 4K(k) e 2K(1/k)/k = RK4 (librazioni e rotazioni)', mx.toExponential(2), mx < 1e-6);
var th0 = 0.01, Ts = A.periodo(-Math.cos(th0));
ok('limite piccole oscillazioni: θ₀ = 0,01 → T = 2π(1 + θ₀²/16)', Ts.toFixed(10), Math.abs(Ts - 2 * Math.PI * (1 + th0 * th0 / 16)) < 1e-9);
var T90 = A.periodo(0); ok('θ₀ = 90°: T/T₀ = 1,18034', (T90 / 2 / Math.PI).toFixed(5), Math.abs(T90 / 2 / Math.PI - 1.18034) < 1e-5);
ok('il periodo diverge alla separatrice', A.periodo(0.999999).toFixed(2), A.periodo(0.999999) > 30 && A.periodo(1.000001) > 15);

/* 3. doppio pendolo: equazioni contro Lagrange (sistema lineare), conservazione dell'energia, caos */
var par = { m1: 1, m2: 1.5, L1: 1, L2: 0.7, g: 9.81 }, f = A.doppioCampo(par), mdiff = 0;
for (var i = 0; i < 50; i++) { var y = [Math.sin(i) * 3, Math.cos(i * 1.3) * 3, Math.sin(i * 0.7) * 4, Math.cos(i * 2.1) * 4], a = f(y), b = A.doppioLagrange(y, par); mdiff = Math.max(mdiff, Math.abs(a[2] - b[0]), Math.abs(a[3] - b[1])); }
ok('accelerazioni = equazioni di Lagrange risolte come sistema lineare', mdiff.toExponential(2), mdiff < 1e-10);
var p1 = { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81 }, f1 = A.doppioCampo(p1), y1 = [120 * Math.PI / 180, 120 * Math.PI / 180, 0, 0], y2 = [y1[0] + 1e-6, y1[1], 0, 0], E0 = A.doppioEnergia(y1, p1), dmax = 0, d10 = 0, d20 = 0, lnd = [];
for (i = 1; i <= 20000; i++) { y1 = A.rk4(f1, y1, 1e-3); y2 = A.rk4(f1, y2, 1e-3); dmax = Math.max(dmax, Math.abs(A.doppioEnergia(y1, p1) - E0) / Math.abs(E0)); if (i % 100 === 0) lnd.push([i * 1e-3, Math.log(A.distanza(y1, y2))]); }
ok('deriva relativa dell’energia RK4 (dt = 1 ms, 20 s, θ = 120°/120°)', dmax.toExponential(2), dmax < 1e-6);
var dfin = Math.exp(lnd[lnd.length - 1][1]);
ok('separazione: da 10⁻⁶ a O(1) in 20 s (caos)', dfin.toExponential(2), dfin > 0.1);
var xs = [], ys = []; lnd.forEach(function (p) { if (p[1] > Math.log(1e-4) && p[1] < Math.log(0.1)) { xs.push(p[0]); ys.push(p[1]); } });
var mxx = xs.reduce(function (s, v) { return s + v; }, 0) / xs.length, myy = ys.reduce(function (s, v) { return s + v; }, 0) / ys.length, sxy = 0, sxx = 0; for (i = 0; i < xs.length; i++) { sxy += (xs[i] - mxx) * (ys[i] - myy); sxx += (xs[i] - mxx) * (xs[i] - mxx); }
ok('esponente di Lyapunov positivo', (sxy / sxx).toFixed(3) + ' s⁻¹', sxy / sxx > 0.3);
/* angoli piccoli: niente caos, la distanza resta piccola */
var z1 = [0.05, 0.05, 0, 0], z2 = [0.05 + 1e-6, 0.05, 0, 0]; for (i = 0; i < 20000; i++) { z1 = A.rk4(f1, z1, 1e-3); z2 = A.rk4(f1, z2, 1e-3); }
ok('angoli piccoli: la distanza resta ~10⁻⁶ (regolare)', A.distanza(z1, z2).toExponential(2), A.distanza(z1, z2) < 1e-4);
/* piccole oscillazioni: modi normali ω² = (g/L)(2 ∓ √2) per masse e lunghezze uguali */
var w1 = Math.sqrt(9.81 * (2 - Math.SQRT2)), v = [0.001, 0.001 * Math.SQRT2, 0, 0], tt = 0, ultimo = v[0], attr = [];
for (i = 0; i < 20000; i++) { var nv = A.rk4(f1, v, 1e-3); if (v[0] > 0 && nv[0] <= 0) attr.push(tt + 1e-3 * v[0] / (v[0] - nv[0])); v = nv; tt += 1e-3; }
var Tm = (attr[attr.length - 1] - attr[0]) / (attr.length - 1);
ok('modo normale in fase: T = 2π/√(g(2−√2)/L)', Tm.toFixed(5) + ' vs ' + (2 * Math.PI / w1).toFixed(5), Math.abs(Tm - 2 * Math.PI / w1) / Tm < 1e-4);

/* 4. anello rotante */
var R = 0.2, wc = Math.sqrt(9.81 / R), eq = A.anelloEquilibri(R, 9), th = Math.acos(9.81 / (R * 81));
ok('ω = 9 > ω_c = 7,0: equilibri ±θ* con cos θ* = g/(Rω²)', (eq[2].th * 180 / Math.PI).toFixed(3) + '°', eq.length === 4 && Math.abs(eq[2].th - th) < 1e-12 && !eq[0].stabile);
var fA = A.anelloCampo(R, 9, 0); ok('θ̈ = 0 negli equilibri', Math.abs(fA([th, 0])[1]).toExponential(1), Math.abs(fA([th, 0])[1]) < 1e-12);
var hh = 1e-4, Ud = (A.anelloUeff(th + hh, R, 9) - 2 * A.anelloUeff(th, R, 9) + A.anelloUeff(th - hh, R, 9)) / (hh * hh);
ok('U_eff″(θ*) = ω² sin²θ* (curvatura = Ω²)', Ud.toFixed(4) + ' vs ' + eq[2].Om2.toFixed(4), Math.abs(Ud - eq[2].Om2) / eq[2].Om2 < 1e-5);
ok('ω < ω_c: solo fondo stabile, Ω² = g/R − ω²', A.anelloEquilibri(R, 5).length + ' equilibri, Ω² = ' + A.anelloEquilibri(R, 5)[0].Om2, A.anelloEquilibri(R, 5).length === 2 && A.anelloEquilibri(R, 5)[0].stabile && Math.abs(A.anelloEquilibri(R, 5)[0].Om2 - (9.81 / R - 25)) < 1e-12);
/* frequenza di piccola oscillazione attorno a θ* misurata con RK4 */
var q = [th + 1e-3, 0], tq = 0, cr = []; for (i = 0; i < 200000 && cr.length < 6; i++) { var nq = A.rk4(fA, q, 1e-4); if ((q[0] - th) > 0 && (nq[0] - th) <= 0) cr.push(tq + 1e-4 * (q[0] - th) / (q[0] - nq[0])); q = nq; tq += 1e-4; }
var Tq = (cr[cr.length - 1] - cr[0]) / (cr.length - 1);
ok('oscillazione attorno a θ*: T = 2π/(ω sin θ*)', Tq.toFixed(5) + ' vs ' + (2 * Math.PI / Math.sqrt(eq[2].Om2)).toFixed(5), Math.abs(Tq - 2 * Math.PI / Math.sqrt(eq[2].Om2)) / Tq < 1e-3);
/* con attrito la perlina finisce in θ* */
var qd = [0.3, 0], fd = A.anelloCampo(R, 9, 0.5); for (i = 0; i < 60000; i++) qd = A.rk4(fd, qd, 5e-4);
ok('con attrito la perlina si ferma nell’equilibrio fuori asse', (qd[0] * 180 / Math.PI).toFixed(3) + '°', Math.abs(qd[0] - th) < 1e-4);

/* 5. Noether */
var s = [1, 0, 0, 0.8], L0 = A.momentoL(s), E0n = A.energiaNoether(s, 0), dl = 0, de = 0;
for (i = 0; i < 100000; i++) { s = A.passoNoether(s, 0.002, 0); dl = Math.max(dl, Math.abs(A.momentoL(s) - L0)); de = Math.max(de, Math.abs(A.energiaNoether(s, 0) - E0n)); }
ok('ε = 0: L_z conservato (Verlet, 10⁵ passi)', dl.toExponential(2), dl < 1e-11);
ok('ε = 0: energia conservata (oscillazione limitata)', de.toExponential(2), de < 1e-3);
s = [1, 0, 0, 0.8]; var eps = 0.1, Lprev = A.momentoL(s), errT = 0, Lvar = 0, E1 = A.energiaNoether(s, eps), de1 = 0;
for (i = 0; i < 20000; i++) { var sn = A.passoNoether(s, 0.002, eps), dLdt = (A.momentoL(sn) - A.momentoL(s)) / 0.002, tau = 2 * eps * (s[0] * s[1] + sn[0] * sn[1]) / 2; errT = Math.max(errT, Math.abs(dLdt - tau)); s = sn; Lvar = Math.max(Lvar, Math.abs(A.momentoL(s) - L0)); de1 = Math.max(de1, Math.abs(A.energiaNoether(s, eps) - E1)); }
ok('ε = 0,1: dL/dt = τ_z = 2ε x y', errT.toExponential(2), errT < 1e-4);
ok('ε = 0,1: L_z non conservato, energia sì', 'ΔL = ' + Lvar.toFixed(3) + ', ΔE = ' + de1.toExponential(1), Lvar > 0.05 && de1 < 1e-3);

/* 6. Liouville */
function evolvi(sis, gam, c, r, T) { var S = A.statoBordo(A.nube(c[0], c[1], r, 400)), A0 = A.areaPoligono(S.P), f = A.SISTEMI[sis](gam); while (S.t < T - 1e-9) A.evolviBordo(S, f, 0.01, 3, 0.1); return { r: A.areaPoligono(S.P) / A0, hull: A.areaPoligono(A.involucro(S.P)) / A0, n: S.P.length, A0: A0 }; }
var o = evolvi('oscillatore', 0, [0.8, 0.3], 0.35, 20);
ok('nube iniziale: area del poligono = πr² (400 punti)', o.A0.toFixed(6) + ' vs ' + (Math.PI * 0.35 * 0.35).toFixed(6), Math.abs(o.A0 / (Math.PI * 0.1225) - 1) < 1e-3);
ok('oscillatore: area conservata e involucro = area (rotazione rigida)', o.r.toFixed(6) + ' / ' + o.hull.toFixed(4), Math.abs(o.r - 1) < 1e-4 && Math.abs(o.hull - 1) < 1e-3);
var t0 = Date.now(), pp = evolvi('pendolo', 0, [0, 1.6], 0.3, 40), dtp = Date.now() - t0;
ok('pendolo, grandi oscillazioni (come nella scheda), t = 40: area entro 1 %', pp.r.toFixed(5) + ' (' + pp.n + ' punti, ' + dtp + ' ms)', Math.abs(pp.r - 1) < 0.01);
ok('pendolo: l’involucro convesso cresce (filamentazione)', pp.hull.toFixed(2), pp.hull > 3);
var pc = evolvi('pendolo', 0, [0.8, 0.3], 0.35, 40); ok('pendolo vicino al fondo, t = 40: area entro 1 %', pc.r.toFixed(5), Math.abs(pc.r - 1) < 0.01);
var sm = evolvi('smorzato', 0.15, [0.8, 0.3], 0.35, 10); ok('pendolo smorzato: A/A₀ = e^(−γt)', sm.r.toFixed(5) + ' vs ' + Math.exp(-1.5).toFixed(5), Math.abs(sm.r / Math.exp(-1.5) - 1) < 0.01);
ok('involucro convesso di un quadrato con punto interno', A.areaPoligono(A.involucro([[0, 0], [1, 0], [0.5, 0.5], [1, 1], [0, 1]])), A.areaPoligono(A.involucro([[0, 0], [1, 0], [0.5, 0.5], [1, 1], [0, 1]])) === 1);

console.log('\n' + (n - ko) + '/' + n + ' controlli superati');
process.exit(ko ? 1 : 0);
