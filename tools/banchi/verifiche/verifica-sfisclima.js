/* verifica di bsi-fis-clima.js (F.calcolo.clima) */
var C = require('./carica.js')(['bsi-fis-clima.js']), K = C.clima;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* 1. bilancio radiativo */
var Te = K.Teff(1361, 0.30);
ok('T_e(1361 W/m², α = 0,30) ≈ 255 K', Te.toFixed(2), Math.abs(Te - 254.6) < 0.5);
ok('bilancio: σT_e⁴ = S(1−α)/4 = 238,2 W/m²', (K.SIGMA * Math.pow(Te, 4)).toFixed(3), Math.abs(K.SIGMA * Math.pow(Te, 4) - 1361 * 0.7 / 4) < 1e-9);
var Ts = K.Tgrigio(Te, 0.78);
ok('strato grigio ε = 0,78: T_s ≈ 288 K', Ts.toFixed(2), Math.abs(Ts - 288) < 1);
/* secondo metodo per lo strato grigio: iterazione del punto fisso sui due bilanci (superficie e strato) */
var ts = 250, ta = 200, Q = 1361 * 0.7 / 4; for (var i = 0; i < 200; i++) { ts = Math.pow((Q + 0.78 * K.SIGMA * Math.pow(ta, 4)) / K.SIGMA, 0.25); ta = Math.pow(Math.pow(ts, 4) / 2, 0.25); }
ok('strato grigio = iterazione dei bilanci di superficie e strato', ts.toFixed(6) + ' vs ' + Ts.toFixed(6), Math.abs(ts - Ts) < 1e-6);
ok('ε = 1 coincide con n = 1 strato: T_s = 2^(1/4) T_e', K.Tgrigio(Te, 1).toFixed(4) + ' = ' + K.Tstrati(Te, 1).toFixed(4), Math.abs(K.Tgrigio(Te, 1) - K.Tstrati(Te, 1)) < 1e-12);
var mx = 0; for (var nn = 0; nn <= 6; nn++) { var Ls = K.stratiLineare(1361, 0.3, nn); mx = Math.max(mx, Math.abs(Ls[0] - K.Tstrati(Te, nn))); }
ok('n strati: (n+1)^(1/4) = soluzione del sistema lineare dei bilanci (n = 0…6)', mx.toExponential(2), mx < 1e-9);
var L3 = K.stratiLineare(1361, 0.3, 3); ok('strato più alto a T_e (n = 3)', L3[3].toFixed(4), Math.abs(L3[3] - Te) < 1e-9);
var ve = K.PIANETI.venere, ma = K.PIANETI.marte, Tv = K.Teff(1361 / (ve.d * ve.d), ve.alfa), Tm = K.Teff(1361 / (ma.d * ma.d), ma.alfa);
ok('Venere T_e ≈ 230 K (< Terra), Marte T_e ≈ 210 K', Tv.toFixed(1) + ', ' + Tm.toFixed(1), Math.abs(Tv - 229) < 3 && Math.abs(Tm - 210) < 3);

/* 2. CO₂ */
ok('forzante del raddoppio 5,35 ln 2 = 3,71 W/m²', K.forzante(560, 280).toFixed(4), Math.abs(K.forzante(560, 280) - 3.708) < 0.001);
ok('forzante additiva nei logaritmi: F(4×) = 2F(2×)', K.forzante(1120).toFixed(4), Math.abs(K.forzante(1120) - 2 * K.forzante(560)) < 1e-12);
ok('scenario: 315 ppm nel 1958, 420 nel 2023', K.scenarioCO2(1958).toFixed(2) + ', ' + K.scenarioCO2(2023).toFixed(2), Math.abs(K.scenarioCO2(1958) - 315) < 1e-9 && Math.abs(K.scenarioCO2(2023) - 420) < 1e-9);
ok('tasso di crescita dell’eccesso ≈ 2,1 %/anno', (K.K_KEELING * 100).toFixed(3), Math.abs(K.K_KEELING - 0.02133) < 0.0002);
var lam = 3 / K.forzante(560); ok('ECS 3 °C → λ = 0,81 K/(W/m²); 420 ppm → ΔT_eq', lam.toFixed(3) + ', ' + (lam * K.forzante(420)).toFixed(2) + ' °C', Math.abs(lam - 0.809) < 0.002 && Math.abs(lam * K.forzante(420) - 3 * Math.log(1.5) / Math.LN2) < 1e-9);

/* 3. ghiaccio–albedo */
var eqS0 = K.equilibri(1361);
ok('S₀: tre equilibri (palla di neve, instabile, caldo)', eqS0.map(function (e) { return e.T.toFixed(1) + (e.stabile ? '' : '*'); }).join(', '), eqS0.length === 3 && eqS0[0].stabile && !eqS0[1].stabile && eqS0[2].stabile);
ok('ramo caldo con S₀ ≈ 287 K', eqS0[2].T.toFixed(2), Math.abs(eqS0[2].T - 287.5) < 1.5);
ok('equilibri = zeri del bilancio', Math.max.apply(null, eqS0.map(function (e) { return Math.abs(K.bilancio(e.T, 1361)); })).toExponential(1), eqS0.every(function (e) { return Math.abs(K.bilancio(e.T, 1361)) < 1e-6; }));
var bf = K.biforcazioni();
ok('due biforcazioni nodo-sella (estremi di S(T))', bf.map(function (b) { return (b.S / 1361).toFixed(4) + ' S₀ a ' + b.T.toFixed(1) + ' K'; }).join('; '), bf.length === 2);
var Sa = Math.min(bf[0].S, bf[1].S), Sb = Math.max(bf[0].S, bf[1].S);
ok('isteresi: S₀ dentro la finestra bistabile [S_a, S_b]', (Sa / 1361).toFixed(3) + ' < 1 < ' + (Sb / 1361).toFixed(3), Sa < 1361 && 1361 < Sb);
/* secondo metodo: il numero di radici per S fissato cambia esattamente ai punti di biforcazione */
var c1 = K.equilibri(Sa * 0.995).length, c2 = K.equilibri(Sa * 1.005).length, c3 = K.equilibri(Sb * 0.995).length, c4 = K.equilibri(Sb * 1.005).length;
ok('numero di equilibri: 1 | 3 | 3 | 1 attorno a S_a e S_b', [c1, c2, c3, c4].join(' | '), c1 === 1 && c2 === 3 && c3 === 3 && c4 === 1);
var hh = 1e-3, Tbf = bf[0].T, dfdT = (K.bilancio(Tbf + hh, bf[0].S) - K.bilancio(Tbf - hh, bf[0].S)) / (2 * hh);
ok('al nodo-sella f = 0 e ∂f/∂T = 0', K.bilancio(Tbf, bf[0].S).toExponential(1) + ', ' + dfdT.toExponential(1), Math.abs(K.bilancio(Tbf, bf[0].S)) < 1e-6 && Math.abs(dfdT) < 1e-4);
/* integrazione nel tempo: ciclo lento S da 1,5 a 0,8 e ritorno, partendo caldo */
var cyc = K.ciclo(0.8 * 1361, 1.5 * 1361, 20000, 320), giu = null, su = null;
for (i = 1; i < cyc.length; i++) { var dT = cyc[i][1] - cyc[i - 1][1]; if (dT < -1 && giu === null) giu = cyc[i][0]; if (dT > 1 && su === null && giu !== null) su = cyc[i][0]; }
ok('integrazione: il clima crolla vicino a S_a in discesa e si scongela vicino a S_b in salita', (giu / 1361).toFixed(3) + ' vs ' + (Sa / 1361).toFixed(3) + ' ; ' + (su / 1361).toFixed(3) + ' vs ' + (Sb / 1361).toFixed(3), Math.abs(giu - Sa) / Sa < 0.02 && Math.abs(su - Sb) / Sb < 0.02);
var meta = cyc[Math.round(cyc.length * 0.25)], tre = cyc[Math.round(cyc.length * 0.75)];
ok('stessa S, due climi diversi (isteresi): T in discesa ≠ T in salita', 'S = ' + (meta[0] / 1361).toFixed(3) + ': ' + meta[1].toFixed(1) + ' K / ' + tre[1].toFixed(1) + ' K', Math.abs(meta[0] - tre[0]) < 2 && meta[1] - tre[1] > 30);

/* 4. Coriolis */
var r0 = [-0.9, 0], v = [0.6, 0.1], Om = 1.2, f = K.campoRotante(Om), y = [r0[0], r0[1], v[0], v[1]], md = 0;
for (i = 1; i <= 2000; i++) { y = K.rk4(f, y, 1e-3); if (i % 100 === 0) { var p = K.rotante(r0, v, Om, i * 1e-3); md = Math.max(md, Math.hypot(y[0] - p[0], y[1] - p[1])); } }
ok('equazioni nel riferimento rotante (Coriolis + centrifuga, RK4) = retta inerziale ruotata di −Ωt', md.toExponential(2), md < 1e-10);
var a = K.inerziale(r0, v, Om, 0.5), b = K.inerziale(r0, v, Om, 1), c = K.inerziale(r0, v, Om, 1.5);
ok('nel riferimento inerziale il moto è rettilineo uniforme', Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])).toExponential(1), Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 1e-15);
var pr = K.rotante(r0, [0.6, 0], 1, 0.3), pl = K.rotante(r0, [0.6, 0], -1, 0.3);
ok('Ω > 0 (antiorario, nord): deviazione a destra (y < 0); Ω < 0: a sinistra', pr[1].toFixed(4) + ', ' + pl[1].toFixed(4), pr[1] < 0 && pl[1] > 0);
var f45 = K.fCoriolis(45); ok('f(45°) = 1,031·10⁻⁴ s⁻¹, periodo inerziale 16,9 h', f45.toExponential(4) + ', ' + (2 * Math.PI / f45 / 3600).toFixed(2) + ' h', Math.abs(f45 - 1.0313e-4) < 1e-7 && Math.abs(2 * Math.PI / f45 / 3600 - 16.93) < 0.02);
var g = function (s) { return [s[2], s[3], f45 * s[3], -f45 * s[2]]; }, s = [0, 0, 10, 0], me = 0;
for (i = 1; i <= 600; i++) { s = K.rk4(g, s, 100); if (i % 50 === 0) { var cc = K.cerchioInerziale(45, 10, i * 100); me = Math.max(me, Math.hypot(s[0] - cc[0], s[1] - cc[1])); } }
ok('cerchio inerziale analitico = integrazione numerica (raggio v/f = 97 km)', me.toExponential(2) + ' m', me < 1e-3);
ok('emisfero sud: stesso cerchio speculare (antiorario)', K.cerchioInerziale(-45, 10, 3600)[1].toFixed(1) + ' vs ' + K.cerchioInerziale(45, 10, 3600)[1].toFixed(1), Math.abs(K.cerchioInerziale(-45, 10, 3600)[1] + K.cerchioInerziale(45, 10, 3600)[1]) < 1e-9);

console.log('\n' + (n - ko) + '/' + n + ' controlli superati');
process.exit(ko ? 1 : 0);
