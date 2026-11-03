/* verifica della superficie p-V-T 3D di bsi-fis-termo.js (F.calcolo.termo, v238): i cicli stanno sulla
   superficie pV = RT, le adiabatiche su pV^γ costante; van der Waals: punto critico, costruzione di
   Maxwell contro i valori tabulati e contro un'integrazione numerica indipendente */
'use strict';
var K = require('./carica.js')(['bsi-fis-termo.js']).termo;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

/* 1. tutti i punti dei quattro cicli stanno sulla superficie pV = RT (1 mol) */
var P = { Tc: 900, Tf: 300, r: 6, rc: 2, gamma: 1.4 }, e1 = 0, e2 = 0;
['carnot', 'otto', 'diesel', 'stirling'].forEach(function (c) {
  K.ciclo(c, P).forEach(function (tr) {
    tr.punti.forEach(function (q) { e1 = Math.max(e1, Math.abs(q[1] * q[0] / (K.R * q[2]) - 1)); });
    if (tr.tipo === 'adiabatica') { var a = tr.punti[0], b = tr.punti[tr.punti.length - 1]; e2 = Math.max(e2, Math.abs(a[1] * Math.pow(a[0], 1.4) / (b[1] * Math.pow(b[0], 1.4)) - 1)); }
  });
});
ok('punti dei cicli sulla superficie pV = RT', e1.toExponential(2), e1 < 1e-12);
ok('adiabatiche: pV^γ costante (γ = 1,4)', e2.toExponential(2), e2 < 1e-12);

/* 2. punto critico ridotto: p(1, 1) = 1, ∂p/∂V = ∂²p/∂V² = 0 */
var h = 1e-4, d1 = (K.vdw(1 + h, 1) - K.vdw(1 - h, 1)) / (2 * h), d2 = (K.vdw(1 + h, 1) - 2 * K.vdw(1, 1) + K.vdw(1 - h, 1)) / (h * h);
ok('punto critico: p = 1, ∂p/∂V = 0, ∂²p/∂V² = 0', K.vdw(1, 1) + ', ' + d1.toExponential(1) + ', ' + d2.toExponential(1), Math.abs(K.vdw(1, 1) - 1) < 1e-15 && Math.abs(d1) < 1e-7 && Math.abs(d2) < 1e-4);

/* 3. Maxwell a T = 0,9 T_c: valori tabulati p = 0,6470, V_l = 0,6034, V_g = 2,3488 */
var M = K.maxwellVdw(0.9);
ok('T = 0,9: p_sat, V_l, V_g contro i valori tabulati', M.p.toFixed(4) + ', ' + M.Vl.toFixed(4) + ', ' + M.Vg.toFixed(4), Math.abs(M.p - 0.6470) < 2e-4 && Math.abs(M.Vl - 0.6034) < 2e-4 && Math.abs(M.Vg - 2.3488) < 2e-4);

/* 4. aree uguali con Simpson (secondo metodo, senza la primitiva) e p(V_l) = p(V_g) = p_sat */
var e4 = 0, e5 = 0;
[0.82, 0.9, 0.97].forEach(function (Tr) {
  var m = K.maxwellVdw(Tr), N = 20000, hh = (m.Vg - m.Vl) / N, s = 0;
  for (var i = 0; i <= N; i++) { var V = m.Vl + i * hh, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * (K.vdw(V, Tr) - m.p); }
  e4 = Math.max(e4, Math.abs(s * hh / 3)); e5 = Math.max(e5, Math.abs(K.vdw(m.Vl, Tr) - m.p), Math.abs(K.vdw(m.Vg, Tr) - m.p));
});
ok('∫(p − p_sat) dV = 0 con Simpson (T = 0,82; 0,9; 0,97)', e4.toExponential(2), e4 < 1e-9);
ok('p(V_l) = p(V_g) = p_sat', e5.toExponential(2), e5 < 1e-12);

/* 5. la cupola si chiude al punto critico e p_sat cresce con T */
var a = K.maxwellVdw(0.999), cresce = true, prec = 0; for (var T = 0.8; T < 0.999; T += 0.01) { var q = K.maxwellVdw(T).p; cresce = cresce && q > prec; prec = q; }
ok('T → T_c: V_l, V_g → 1 (come √(1 − T)) e p_sat → 1; p_sat cresce con T', a.Vl.toFixed(3) + ', ' + a.Vg.toFixed(3) + ', ' + a.p.toFixed(4), Math.abs(a.Vl - 1) < 0.08 && Math.abs(a.Vg - 1) < 0.08 && Math.abs(a.p - 1) < 0.005 && cresce && K.maxwellVdw(1.05) === null);

/* 6. sull'isoterma d'equilibrio la pressione non cresce mai espandendo (stabilita' meccanica) */
var Me = K.maxwellVdw(0.85), mono = true, pp = Infinity; for (var V = 0.45; V < 8; V *= 1.01) { var pe = K.pEquilibrio(V, 0.85, Me); mono = mono && pe <= pp + 1e-15; pp = pe; }
ok('isoterma d’equilibrio: ∂p/∂V ≤ 0 ovunque (T = 0,85)', mono, mono);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
