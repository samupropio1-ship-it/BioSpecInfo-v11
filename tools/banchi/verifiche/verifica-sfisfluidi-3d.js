/* verifica del flusso potenziale 3D di bsi-fis-fluidi.js (F.calcolo.fluidi, v238): divergenza nulla,
   superficie impermeabile, velocita' massime e C_p note, portanza di Kutta-Zukovskij e resistenza nulla
   (d'Alembert) integrando la pressione di Bernoulli, punti di ristagno, corrente uniforme lontano */
'use strict';
var Fl = require('./carica.js')(['bsi-fis-fluidi.js']).fluidi;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

var sf = Fl.flussoPotenziale('sfera', 1, 2), ci = Fl.flussoPotenziale('cilindro', 1, 2, 3);
/* 1. ∇·v = 0 (differenze centrate) fuori dall'ostacolo */
var dmax = 0, h = 1e-5;
[[1.3, 0.4, 0.2], [-0.8, 1.1, -0.6], [2.5, -1.2, 0.9]].forEach(function (p) { [sf, ci].forEach(function (M) { var d = (M.v(p[0] + h, p[1], p[2])[0] - M.v(p[0] - h, p[1], p[2])[0] + M.v(p[0], p[1] + h, p[2])[1] - M.v(p[0], p[1] - h, p[2])[1] + M.v(p[0], p[1], p[2] + h)[2] - M.v(p[0], p[1], p[2] - h)[2]) / (2 * h); dmax = Math.max(dmax, Math.abs(d)); }); });
ok('∇·v = 0 per sfera e cilindro con Γ', dmax.toExponential(2), dmax < 1e-6);

/* 2. sulla superficie la velocita' normale e' nulla */
var vn = 0;
for (var i = 0; i < 200; i++) { var th = Math.acos(2 * (i + 0.5) / 200 - 1), ph = 2.4 * i, x = Math.sin(th) * Math.cos(ph), y = Math.sin(th) * Math.sin(ph), z = Math.cos(th), w = sf.v(x, y, z); vn = Math.max(vn, Math.abs(w[0] * x + w[1] * y + w[2] * z)); var f = 2 * Math.PI * i / 200, c = ci.v(Math.cos(f), Math.sin(f), 0); vn = Math.max(vn, Math.abs(c[0] * Math.cos(f) + c[1] * Math.sin(f))); }
ok('velocità normale alla superficie', vn.toExponential(2), vn < 1e-12);

/* 3. velocita' massime: sfera 3U/2 sull'equatore (C_p = −5/4), cilindro senza Γ 2U (C_p = −3) */
var c0 = Fl.flussoPotenziale('cilindro', 1, 2, 0);
ok('sfera: v = 1,5U e C_p = −1,25; cilindro: v = 2U e C_p = −3', sf.v(0, 1, 0)[0] / 2 + ', ' + sf.cp(0, 0, 1) + ' / ' + c0.v(0, 1, 0)[0] / 2 + ', ' + c0.cp(0, -1, 0), Math.abs(sf.v(0, 1, 0)[0] - 3) < 1e-12 && Math.abs(sf.cp(0, 0, 1) + 1.25) < 1e-12 && Math.abs(c0.v(0, 1, 0)[0] - 4) < 1e-12 && Math.abs(c0.cp(0, -1, 0) + 3) < 1e-12);

/* 4. forze sul cilindro integrando p − p∞ = ½ρ(U² − v²) sul contorno: F_x = 0 (d'Alembert), F_y = −ρUΓ */
var rho = 998, Fx = 0, Fy = 0, N = 20000;
for (i = 0; i < N; i++) { var f2 = 2 * Math.PI * (i + 0.5) / N, w2 = ci.v(Math.cos(f2), Math.sin(f2), 0), p = Fl.bernoulli(0, rho, 2, Math.hypot(w2[0], w2[1])); Fx -= p * Math.cos(f2) * 2 * Math.PI / N; Fy -= p * Math.sin(f2) * 2 * Math.PI / N; }
ok('cilindro: F_x = 0 e F_y = −ρUΓ = −5988 N/m', Fx.toExponential(1) + ' / ' + Fy.toFixed(3), Math.abs(Fx) < 1e-6 && Math.abs(Fy + rho * 2 * 3) < 1e-6);

/* 5. punti di ristagno sul cilindro a sin θ = Γ/(4πUa) */
var sr = 3 / (4 * Math.PI * 2), tr = Math.asin(sr), vs = Math.max(Math.hypot.apply(null, ci.v(Math.cos(tr), Math.sin(tr), 0)), Math.hypot.apply(null, ci.v(Math.cos(Math.PI - tr), Math.sin(Math.PI - tr), 0)));
ok('ristagno a θ = ' + (tr * 180 / Math.PI).toFixed(3) + '° e ' + (180 - tr * 180 / Math.PI).toFixed(3) + '°', '|v| = ' + vs.toExponential(2), vs < 1e-12);

/* 6. lontano la corrente torna uniforme: |v − U x̂|/U ~ (a/r)³ per la sfera, (a/r)² per il cilindro */
var ls = Math.hypot(sf.v(30, 4, 2)[0] - 2, sf.v(30, 4, 2)[1], sf.v(30, 4, 2)[2]) / 2, lc = Math.hypot(c0.v(30, 4, 0)[0] - 2, c0.v(30, 4, 0)[1]) / 2;
ok('lontano (r ≈ 30a): scarto dalla corrente uniforme', ls.toExponential(1) + ' / ' + lc.toExponential(1), ls < 1e-4 && lc < 2e-3 && ls < lc);

/* 7. Bernoulli coerente con il Venturi della sezione */
var V = Fl.venturi(0.02, 0.01, 1, 998, 120000);
ok('bernoulli(p₁, ρ, v₁, v₂) = p₂ del Venturi', Fl.bernoulli(120000, 998, 1, V.v2).toFixed(6) + ' / ' + V.p2.toFixed(6), Math.abs(Fl.bernoulli(120000, 998, 1, V.v2) - V.p2) < 1e-9);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
