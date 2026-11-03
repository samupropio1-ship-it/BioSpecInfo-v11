/* verifica dell'ondoscopio 3D di bsi-fis-onde.js (F.calcolo.onde, v238): linee nodali come iperboli,
   loro numero e direzioni lontane, media temporale dell'energia, sorgenti in opposizione, 1/√r */
'use strict';
var O = require('./carica.js')(['bsi-fis-onde.js']).onde;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

/* 1. sulle iperboli r₁ − r₂ = Δ_m l'ampiezza (onde senza smorzamento) e' zero */
var P = { lam: 1.2, d: 3.6, fase: 0, smorza: false }, N = O.lineeNodali(P.lam, P.d, 0), mx = 0;
N.forEach(function (q) { for (var u = -2; u <= 2; u += 0.25) { var c = O.puntoIperbole(q.delta, P.d, u); mx = Math.max(mx, O.inviluppo(c[0], c[1], P)); } });
ok('ampiezza sulle iperboli nodali (onde uguali)', mx.toExponential(2), mx < 1e-9);

/* 2. quante linee nodali: per d = 3λ sono 2·3 = 6; per d = 0,4λ nessuna */
ok('d = 3λ → 6 linee nodali; d = 0,4λ → 0', O.lineeNodali(1, 3, 0).length + ' / ' + O.lineeNodali(1, 0.4, 0).length, O.lineeNodali(1, 3, 0).length === 6 && O.lineeNodali(1, 0.4, 0).length === 0);

/* 3. lontano i minimi stanno a sin θ = (m + ½)λ/d: li cerco sul cerchio di raggio 4000λ */
var R = 4000 * P.lam, minimi = [], prec = null, dprec = null;
for (var i = 0; i <= 200000; i++) { var th = -Math.PI / 2 + Math.PI * i / 200000, v = O.inviluppo(R * Math.sin(th), R * Math.cos(th), P); if (prec !== null && dprec !== null && v > prec && dprec < 0) minimi.push(th); if (prec !== null) dprec = v - prec; prec = v; }
var err = minimi.length === N.length ? Math.max.apply(null, minimi.map(function (th, k) { return Math.abs(th - N[k].theta); })) : 1;
ok('direzioni dei minimi lontani = arcsin((m + ½)λ/d)', minimi.length + ' minimi, scarto ' + err.toExponential(2) + ' rad', err < 2e-3);

/* 4. media su un periodo di z² = ½ ampiezza² (anche con smorzamento e sfasamento) */
var Q = { lam: 1.5, d: 2.5, fase: 1.1, smorza: true, f: 0.8 }, pt = [1.3, 2.7], M = 2000, s2 = 0;
for (i = 0; i < M; i++) { var z = O.ondoscopio(pt[0], pt[1], i / M / Q.f, Q); s2 += z * z / M; }
var A = O.inviluppo(pt[0], pt[1], Q);
ok('⟨z²⟩ sul periodo = ½A²', s2.toFixed(9) + ' / ' + (A * A / 2).toFixed(9), Math.abs(s2 - A * A / 2) < 1e-9);

/* 5. sorgenti in opposizione (φ = π): l'asse fra le sorgenti diventa una linea nodale */
var Opp = { lam: 1.2, d: 3.6, fase: Math.PI, smorza: true }, mo = 0;
for (var y = -6; y <= 6; y += 0.5) mo = Math.max(mo, O.inviluppo(0, y, Opp));
ok('φ = π: ampiezza nulla su tutto l’asse x = 0', mo.toExponential(2), mo < 1e-12 && O.lineeNodali(1.2, 3.6, Math.PI).some(function (q) { return Math.abs(q.delta) < 1e-12; }));

/* 6. una sorgente sola: a²·r → costante (l'energia si spalma su cerchi, a ∝ 1/√r) */
var S1 = { lam: 1, d: 0, fase: 0, smorza: true }, e1 = Math.pow(O.inviluppo(1000, 0, S1) / 2, 2) * 1000, e2 = Math.pow(O.inviluppo(4000, 0, S1) / 2, 2) * 4000;
ok('a²·r costante lontano (r = 1000λ e 4000λ)', e1.toFixed(5) + ' / ' + e2.toFixed(5), Math.abs(e1 / e2 - 1) < 1e-3);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
