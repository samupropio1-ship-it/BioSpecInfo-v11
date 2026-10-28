/* verifica di bsi-astro-matcelesti.js (F.calcolo.matcelesti) */
var C = require('./carica.js')(['bsi-astro-matcelesti.js']), K = C.matcelesti;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var G = Math.PI / 180;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(5);

/* 1. Keplero */
var p1 = 0, p2 = 0, p3 = 0;
for (var e = 0.05; e <= 0.951; e += 0.05) for (var M = 0.05; M < 2 * Math.PI; M += 0.3) {
  var En = K.kepleroNewton(M, e).E, Ef = K.kepleroPuntoFisso(M, e, 20000).E;
  p1 = Math.max(p1, Math.abs(En - e * Math.sin(En) - M)); p2 = Math.max(p2, Math.abs(En - Ef));
  if (e <= 0.6) p3 = Math.max(p3, Math.abs(En - K.kepleroBessel(M, e, 120).E));
}
ok('Newton: residuo < 1e-12 per e fino a 0,95', p1.toExponential(2), p1 < 1e-12);
ok('punto fisso = Newton entro 1e-12', p2.toExponential(2), p2 < 1e-12);
ok('serie di Bessel (120 termini, e ≤ 0,6) = Newton entro 1e-12', p3.toExponential(2), p3 < 1e-12);
/* Bessel: J_n con la serie di potenze per argomenti piccoli, e J0(2,404825557695773) = 0 */
var x = 1.3, js = 0, fat = 1; for (var k = 0; k < 30; k++) { if (k) fat *= k; var fk2 = 1; for (var j = 1; j <= k + 2; j++) fk2 *= j; js += Math.pow(-1, k) / (fat * fk2) * Math.pow(x / 2, 2 * k + 2); }
ok('J₂(1,3) dall’integrale = serie di potenze; J₀ si annulla in 2,404825557695773', K.besselJ(2, 1.3).toFixed(15) + ' vs ' + js.toFixed(15) + ', J₀ = ' + K.besselJ(0, 2.404825557695773).toExponential(1), Math.abs(K.besselJ(2, 1.3) - js) < 1e-14 && Math.abs(K.besselJ(0, 2.404825557695773)) < 1e-14);
ok('limite di Laplace = 0,6627434', K.limiteLaplace().toFixed(7), Math.abs(K.limiteLaplace() - 0.6627434) < 1e-7);
var l6a = Math.abs(K.kepleroLagrange(1.2, 0.55, 20).E - K.kepleroNewton(1.2, 0.55).E), l6b = Math.abs(K.kepleroLagrange(1.2, 0.55, 40).E - K.kepleroNewton(1.2, 0.55).E);
var l7a = Math.abs(K.kepleroLagrange(Math.PI / 2, 0.75, 20).E - K.kepleroNewton(Math.PI / 2, 0.75).E), l7b = Math.abs(K.kepleroLagrange(Math.PI / 2, 0.75, 40).E - K.kepleroNewton(Math.PI / 2, 0.75).E);
ok('serie di Lagrange: converge a e = 0,55, diverge a e = 0,75 (oltre il limite di Laplace)', 'e=0,55: ' + l6a.toExponential(1) + ' → ' + l6b.toExponential(1) + '; e=0,75: ' + l7a.toExponential(1) + ' → ' + l7b.toExponential(1), l6b < l6a && l6b < 1e-6 && l7b > l7a && l7b > 1e-2);
var st = K.kepleroNewton(1, 0.5, 10, 1).storia, E = st[st.length - 1], r1 = Math.abs(st[2] - E) / Math.pow(Math.abs(st[1] - E), 2), r2 = Math.abs(st[3] - E) / Math.pow(Math.abs(st[2] - E), 2);
ok('Newton converge quadraticamente: e_{k+1}/e_k² ≈ costante (e sin E /(2(1 − e cos E)))', r1.toFixed(3) + ', ' + r2.toFixed(3) + ' vs ' + (0.5 * Math.sin(E) / (2 * (1 - 0.5 * Math.cos(E)))).toFixed(3), Math.abs(r2 / (0.5 * Math.sin(E) / (2 * (1 - 0.5 * Math.cos(E)))) - 1) < 0.05);
var sf = K.kepleroPuntoFisso(1, 0.5, 60).storia, Ef2 = sf[sf.length - 1], rap = Math.abs(sf[4] - Ef2) / Math.abs(sf[3] - Ef2);
ok('punto fisso converge linearmente con rapporto e cos E', rap.toFixed(6) + ' vs ' + (0.5 * Math.cos(Ef2)).toFixed(6), Math.abs(rap / (0.5 * Math.cos(Ef2)) - 1) < 0.01);

/* 2. rotazioni e quaternioni */
var pegQ = 0, pegC = 0, pegO = 0;
for (k = 0; k < 500; k++) {
  var q = K.qAsse([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], rnd() * 2 * Math.PI), Rm = K.qMatrice(q), v = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5];
  var a = K.mv(Rm, v), b = K.qRuota(q, v); pegQ = Math.max(pegQ, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
  var q2 = K.qAsse([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], rnd() * 6), c1 = K.qMatrice(K.qMul(q, q2)), c2 = K.mm(Rm, K.qMatrice(q2));
  for (var i = 0; i < 3; i++) for (j = 0; j < 3; j++) pegC = Math.max(pegC, Math.abs(c1[i][j] - c2[i][j]));
  var qb = K.qDaMatrice(Rm), s = q[0] < 0 ? -1 : 1; pegO = Math.max(pegO, Math.max.apply(null, qb.map(function (x, i) { return Math.abs(x - s * q[i]); })));
}
ok('quaternione q v q* = matrice R(q) v (500 rotazioni casuali)', pegQ.toExponential(2), pegQ < 1e-14);
ok('composizione: R(q₁q₂) = R(q₁)R(q₂)', pegC.toExponential(2), pegC < 1e-14);
ok('matrice → quaternione (Shepperd) → stesso q, a meno del segno', pegO.toExponential(2), pegO < 1e-13);
var qa = K.qAsse([0, 0, 1], 0.3), qbb = K.qAsse([1, 1, 0], 2.1), rel0 = K.qMul(K.qConj(qa), qbb), Om = Math.atan2(Math.hypot(rel0[1], rel0[2], rel0[3]), Math.abs(rel0[0])), pegS = 0;
for (var u = 0; u <= 1.0001; u += 0.1) { var qs = K.slerp(qa, qbb, u), rel = K.qMul(K.qConj(qa), qs), dd = Math.atan2(Math.hypot(rel[1], rel[2], rel[3]), Math.abs(rel[0])); pegS = Math.max(pegS, Math.abs(dd - u * Om), Math.abs(Math.hypot(qs[0], qs[1], qs[2], qs[3]) - 1)); }
ok('slerp: norma 1 e velocità angolare costante (angolo da q₀ = u·Ω)', pegS.toExponential(2), pegS < 1e-12);
var Mg = K.EQ_GAL, MgT = K.mm(Mg, K.tr(Mg)), orto = 0; for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) orto = Math.max(orto, Math.abs(MgT[i][j] - (i === j ? 1 : 0)));
ok('matrice galattica ortogonale con det = +1', orto.toExponential(1) + ', det ' + K.det(Mg).toFixed(12), orto < 1e-9 && Math.abs(K.det(Mg) - 1) < 1e-9);
var cg = K.eqGal(266.40499, -28.93617), ng = K.eqGal(192.85948, 27.12825);
ok('centro galattico (α 266,405°, δ −28,936°) → l = 0, b = 0; polo nord galattico → b = 90°', 'l = ' + ((cg[0] + 180) % 360 - 180).toFixed(4) + ', b = ' + cg[1].toFixed(4) + '; b = ' + ng[1].toFixed(5), Math.abs((cg[0] + 180) % 360 - 180) < 0.01 && Math.abs(cg[1]) < 0.01 && Math.abs(ng[1] - 90) < 1e-4);
var sol = K.eqEcl(90, 23.4392911), pe = K.eclEq(0, 90);
ok('Sole al solstizio (α 90°, δ = ε) → λ = 90°, β = 0; polo dell’eclittica → α = 270°, δ = 66,56°', sol[0].toFixed(10) + ', ' + sol[1].toExponential(1) + '; ' + pe[0].toFixed(6) + ', ' + pe[1].toFixed(6), Math.abs(sol[0] - 90) < 1e-9 && Math.abs(sol[1]) < 1e-9 && Math.abs(pe[0] - 270) < 1e-9 && Math.abs(pe[1] - 66.5607089) < 1e-6);
var rt = 0;
for (k = 0; k < 300; k++) {
  var al = rnd() * 360, de = (rnd() - 0.5) * 178, c = K.eclEq.apply(null, K.eqEcl(al, de)), g = K.galEq.apply(null, K.eqGal(al, de)), M2 = K.eqOrizz(rnd() * 360, (rnd() - 0.5) * 180), w = K.mv(K.tr(M2), K.mv(M2, K.versore(al, de))), w0 = K.versore(al, de);
  rt = Math.max(rt, Math.abs(((c[0] - al + 540) % 360) - 180), Math.abs(c[1] - de), Math.abs(((g[0] - al + 540) % 360) - 180), Math.abs(g[1] - de), Math.hypot(w[0] - w0[0], w[1] - w0[1], w[2] - w0[2]));
}
ok('andata e ritorno equatoriale ↔ eclittico, galattico, orizzontale', rt.toExponential(2), rt < 1e-9);
ok('la trasformazione equatoriale → orizzontale è una rotazione propria (det = +1)', K.det(K.eqOrizz(123, 41.9)).toFixed(14), Math.abs(K.det(K.eqOrizz(123, 41.9)) - 1) < 1e-13);

/* 3. tempo siderale e altezza-azimut (Meeus) */
var g1 = K.gmst(K.giuliano(1987, 4, 10, 0)), g2 = K.gmst(K.giuliano(1987, 4, 10, 19 + 21 / 60));
ok('tempo siderale medio: 1987 apr 10 0h UT = 13h10m46,3668s; 19:21 UT = 128,7378734° (Meeus 12.a, 12.b)', g1.toFixed(6) + '°, ' + g2.toFixed(7) + '°', Math.abs(g1 - 197.693195) < 1e-5 && Math.abs(g2 - 128.7378734) < 1e-5);
/* Meeus usa il tempo siderale apparente 8h34m56,853s = 128,7368875° */
var th = 128.7368875 - (77 + 3 / 60 + 56 / 3600), ven = K.altAzFormule(347.3193375, -6.719892, th, 38 + 55 / 60 + 17 / 3600);
ok('Meeus es. 13.b (Venere da Washington): h = 15,1249°, A = 68,0337° da sud (248,0337° da nord)', 'h = ' + ven.alt.toFixed(4) + '°, A = ' + ven.az.toFixed(4) + '°, H = ' + ven.H.toFixed(6) + '°', Math.abs(ven.alt - 15.1249) < 2e-4 && Math.abs(ven.az - 248.0337) < 2e-4);
var E1 = K.esempioSirio(K.giuliano(2026, 1, 15, 21));
ok('Sirio da Roma, 2026 gen 15 21:00 UT: formule = matrice = quaternione', 'h = ' + E1.formule.alt.toFixed(6) + '°, A = ' + E1.formule.az.toFixed(6) + '° · scarti ' + Math.abs(E1.formule.alt - E1.matrice.alt).toExponential(1) + ', ' + Math.abs(E1.formule.alt - E1.quaternione.alt).toExponential(1),
  Math.abs(E1.formule.alt - E1.matrice.alt) < 1e-10 && Math.abs(E1.formule.az - E1.matrice.az) < 1e-10 && Math.abs(E1.formule.alt - E1.quaternione.alt) < 1e-10 && E1.formule.alt > 20 && E1.formule.alt < 32);
var hmax = -90; for (var tt = 0; tt < 1; tt += 1 / 86400) hmax = Math.max(hmax, K.esempioSirio(K.giuliano(2026, 1, 15, 0) + tt).formule.alt);
ok('altezza massima di Sirio a Roma (culminazione) = 90° − φ + δ = 31,381°', hmax.toFixed(4) + '°', Math.abs(hmax - (90 - 41.9028 - 16.716)) < 1e-3);

/* 4. integratori */
var ordini = { eulero: [[800, 1600, 3200, 6400, 12800], 1], rk4: [[150, 225, 340, 500, 750], 4], leapfrog: [[40, 80, 160, 320, 640], 2], yoshida: [[60, 90, 135, 200, 300], 4] }, mis = [];
Object.keys(ordini).forEach(function (m) { var o = K.ordine(m, 0.3, ordini[m][0]); mis.push([m, o.pendenza, ordini[m][1]]); });
ok('ordini misurati dalla pendenza log-log (attesi 1, 4, 2, 4)', mis.map(function (x) { return x[0] + ' ' + x[1].toFixed(3); }).join(', '), mis.every(function (x) { return Math.abs(x[1] - x[2]) < 0.25; }));
var h = 2 * Math.PI / 100, lf = K.integra('leapfrog', 0.5, h, 100 * 100, 1), rk = K.integra('rk4', 0.5, h, 100 * 100, 1);
function maxAbs(a, i0, i1) { var m = 0; for (var i = i0; i < i1; i++) m = Math.max(m, Math.abs(a[i])); return m; }
var lfA = maxAbs(lf.dE, 0, 1000), lfB = maxAbs(lf.dE, 9000, 10001), rkA = Math.abs(rk.dE[1000]), rkB = Math.abs(rk.dE[10000]);
ok('leapfrog: errore sull’energia limitato (max nelle orbite 0–10 ≈ max nelle orbite 90–100)', lfA.toExponential(2) + ' vs ' + lfB.toExponential(2), lfB < 1.5 * lfA);
ok('RK4: l’energia deriva (errore ∝ t: ×10 fra l’orbita 10 e la 100)', rkA.toExponential(2) + ' → ' + rkB.toExponential(2), rkB / rkA > 8 && rkB / rkA < 12);
ok('leapfrog conserva il momento angolare fino all’arrotondamento (100 orbite)', maxAbs(lf.dL, 0, lf.dL.length).toExponential(1), maxAbs(lf.dL, 0, lf.dL.length) < 1e-12);
var eu = K.integra('eulero', 0.5, h, 1000, 1);
ok('Eulero esplicito aggiunge energia (ΔE > 0, crescente)', eu.dE[500].toExponential(2) + ' → ' + eu.dE[1000].toExponential(2), eu.dE[1000] > eu.dE[500] && eu.dE[500] > 0);
var p100 = K.precessione('leapfrog', 0.5, 100, 10), p200 = K.precessione('leapfrog', 0.5, 200, 10);
ok('precessione spuria del pericentro del leapfrog ∝ h²: dimezzando h si riduce di 4', p100.toExponential(3) + ' → ' + p200.toExponential(3) + ', rapporto ' + (p100 / p200).toFixed(3), Math.abs(p100 / p200 - 4) < 0.15);
var yo = K.integra('yoshida', 0.5, h, 100 * 100, 100);
ok('Yoshida: errore sull’energia limitato e molto più piccolo del leapfrog allo stesso passo', maxAbs(yo.dE, 0, yo.dE.length).toExponential(2) + ' vs ' + lfB.toExponential(2), maxAbs(yo.dE, 0, yo.dE.length) < lfB / 20);

/* 5. periodogrammi */
var tt0 = [], yy0 = []; for (k = 0; k < 64; k++) { tt0.push(k); yy0.push(Math.sin(2 * Math.PI * 5 * k / 64 + 0.4) + 0.3 * Math.cos(2 * Math.PI * 11 * k / 64)); }
var fk = 7 / 64, ls = K.lombScargle(tt0, yy0, [fk, 5 / 64])[0], re = 0, im = 0, m0 = yy0.reduce(function (s, v) { return s + v / 64; }, 0), vv = 0;
yy0.forEach(function (y, k) { re += (y - m0) * Math.cos(2 * Math.PI * fk * k); im += (y - m0) * Math.sin(2 * Math.PI * fk * k); vv += (y - m0) * (y - m0); });
var tt1 = [], yy1 = []; for (k = 0; k < 64; k++) { tt1.push(k); yy1.push(Math.sin(2 * Math.PI * 7 * k / 64 + 1) + 0.5 * Math.sin(2 * Math.PI * 3 * k / 64)); }
var a1 = K.lombScargle(tt1, yy1, [7 / 64])[0], re1 = 0, im1 = 0, m1 = yy1.reduce(function (s, v) { return s + v / 64; }, 0), v1 = 0; yy1.forEach(function (y, k) { re1 += (y - m1) * Math.cos(2 * Math.PI * 7 * k / 64); im1 += (y - m1) * Math.sin(2 * Math.PI * 7 * k / 64); v1 += (y - m1) * (y - m1); });
ok('campionamento uniforme: Lomb–Scargle = periodogramma di Fourier (2/N)|Y_k|²/Σ(y−ȳ)²', a1.toFixed(12) + ' vs ' + (2 / 64 * (re1 * re1 + im1 * im1) / v1).toFixed(12), Math.abs(a1 - 2 / 64 * (re1 * re1 + im1 * im1) / v1) < 1e-12);
void ls; void re; void im; void vv;
var O = K.osservazioni('seno', 1.3, 40, 5, 0, 3), fr = K.griglia(O.t, 3, 10), pk = K.picco(function (f) { return K.lombScargle(O.t, O.y, [f])[0]; }, fr, K.lombScargle(O.t, O.y, fr));
/* Lomb–Scargle classico: la media e' tolta prima, non adattata; con il campionamento irregolare la media
   campionaria della sinusoide non e' zero e la potenza resta un po' sotto 1 */
ok('sinusoide senza rumore, campionamento irregolare: picco al periodo vero entro 1e-5 e potenza ≈ 1', pk.potenza.toFixed(5) + ', P = ' + pk.P.toFixed(8), pk.potenza > 0.95 && Math.abs(pk.P - 1.3) < 1e-5);
var Ls1 = K.lombScargle(O.t, O.y, [0.31, 0.77, 1.9]), Ls2 = K.lombScargle(O.t.map(function (x) { return x + 1234.567; }), O.y, [0.31, 0.77, 1.9]);
ok('invarianza per traslazione dei tempi (lo sfasamento τ)', Math.max.apply(null, Ls1.map(function (v, i) { return Math.abs(v - Ls2[i]); })).toExponential(1), Math.max.apply(null, Ls1.map(function (v, i) { return Math.abs(v - Ls2[i]); })) < 1e-9);
var esiti = [];
[['cefeide', 5.366249, 0.05], ['rrlyrae', 0.566838, 0.05], ['seno', 1.3, 0.1], ['cefeide', 12.3, 0.08]].forEach(function (c) { var Oc = K.osservazioni(c[0], c[1], c[1] > 10 ? 150 : 80, 5, c[2], 11), r = K.trovaPeriodo(Oc.t, Oc.y, 'ls', 5); esiti.push([c[0], c[1], r.P, Math.abs(r.P / c[1] - 1) * 100]); });
ok('Lomb–Scargle ritrova il periodo iniettato entro lo 0,5 % (Cefeide, RR Lyrae, sinusoide, Cefeide 12,3 d su 150 notti; rumore e notti irregolari)', esiti.map(function (x) { return x[0] + ' ' + x[2].toFixed(4) + ' (' + x[3].toFixed(3) + ' %)'; }).join(', '), esiti.every(function (x) { return x[3] < 0.5; }));
var Ot = K.osservazioni('transito', 3.524749, 120, 8, 0.004, 5), rb = K.trovaPeriodo(Ot.t, Ot.y, 'bls', 1.5);
ok('BLS ritrova il periodo del transito di HD 209458 b (profondità 1,6 %, rumore 0,4 %)', rb.P.toFixed(5) + ' d (' + (Math.abs(rb.P / 3.524749 - 1) * 100).toFixed(3) + ' %)', Math.abs(rb.P / 3.524749 - 1) < 0.005);
var Oa = K.osservazioni('algol', 2.867328, 80, 6, 0.02, 9), ra = K.trovaPeriodo(Oa.t, Oa.y, 'ls', 5);
ok('Algol: il picco LS cade a P/2 (due minimi per ciclo), ×2 ritrova il periodo', ra.P.toFixed(5) + ' × 2 = ' + (2 * ra.P).toFixed(5), Math.abs(2 * ra.P / 2.867328 - 1) < 0.005);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
