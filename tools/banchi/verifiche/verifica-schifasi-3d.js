/* verifica della scheda 3D di bsi-chi-fasi.js (v238): Peng–Robinson, saturazione, aree di Maxwell */
var X = require('./carica.js')(['bsi-chi-fasi.js']).fasi, R = 8.314462618;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* fattori acentrici dalle curve di vapore della sezione contro i valori tabulati (acqua 0,3443, CO₂ 0,2239) */
ok('ω dalla curva di vapore: acqua 0,344, CO₂ 0,224', X.omega('acqua').toFixed(4) + ', ' + X.omega('co2').toFixed(4), Math.abs(X.omega('acqua') - 0.3443) < 0.002 && Math.abs(X.omega('co2') - 0.2239) < 0.002);
/* il punto critico di PR: a Tc e V_c = 0,3074 RTc/Pc la pressione e' Pc e l'isoterma ha un flesso orizzontale */
var dc = ['acqua', 'co2'].map(function (s) {
  var p = X.parametriPR(s), Vc = 0.307401 * R * p.Tc / p.Pc, h = Vc * 1e-3, P0 = X.pressionePR(p, p.Tc, Vc), d1 = (X.pressionePR(p, p.Tc, Vc + h) - X.pressionePR(p, p.Tc, Vc - h)) / (2 * h), d2 = (X.pressionePR(p, p.Tc, Vc + h) - 2 * P0 + X.pressionePR(p, p.Tc, Vc - h)) / (h * h);
  return [Math.abs(P0 / p.Pc - 1), Math.abs(d1 * Vc / p.Pc), Math.abs(d2 * Vc * Vc / p.Pc)];
});
ok('PR a (Tc, V_c): P = Pc, ∂P/∂V = 0, ∂²P/∂V² = 0 (relativi)', dc.map(function (x) { return x.map(function (y) { return y.toExponential(0); }).join('/'); }).join(' · '), dc.every(function (x) { return x[0] < 1e-4 && x[1] < 1e-3 && x[2] < 2e-3; }));
/* saturazione: fugacita' uguali ⇔ aree uguali di Maxwell, ∫P dV = P_sat (V_v − V_l) */
var mw = 0;
['acqua', 'co2'].forEach(function (s) { var S = X.SOST[s], p = X.parametriPR(s); [0.5, 0.65, 0.8, 0.9, 0.97, 0.995].forEach(function (f) { var T = f * S.Tc; if (T < S.Tt) return; var r = X.saturazione(s, T); mw = Math.max(mw, Math.abs(X.lavoroPR(p, T, r.Vl, r.Vv) / (r.P * (r.Vv - r.Vl)) - 1)); }); });
ok('aree di Maxwell uguali sulla cupola (scarto relativo massimo)', mw.toExponential(2), mw < 1e-7);
/* la pressione di saturazione di PR segue la curva di riferimento della sezione (Span–Wagner per la CO₂) entro il 4 % */
var dv = 0; [220, 240, 260, 280, 300].forEach(function (T) { var r = X.saturazione('co2', T); dv = Math.max(dv, Math.abs(r.P / r.rif - 1)); });
ok('CO₂: P_sat(PR) vs curva della sezione da 220 a 300 K (scarto massimo)', (dv * 100).toFixed(2) + ' %', dv < 0.04);
/* a 0,7 Tc PR riproduce per costruzione il fattore acentrico: P_sat ≈ Pc·10^(−1−ω) */
var r7 = X.saturazione('acqua', 0.7 * X.SOST.acqua.Tc), P7 = X.SOST.acqua.Pc * Math.pow(10, -1 - X.omega('acqua'));
ok('acqua a 0,7 Tc: P_sat(PR) ≈ Pc·10^(−1−ω) (entro 2 %)', (r7.P / P7).toFixed(4), Math.abs(r7.P / P7 - 1) < 0.02);
/* la cupola si chiude: V_l e V_v convergono a V_c avvicinandosi a Tc, e lontano dal critico V_v ≈ RT/P (gas quasi ideale) */
var rc = X.saturazione('co2', 0.999 * X.SOST.co2.Tc), Vc = 0.3074 * R * X.SOST.co2.Tc / X.SOST.co2.Pc, rb = X.saturazione('co2', X.SOST.co2.Tt);
ok('cupola: a 0,999 Tc V_v/V_l < 1,3; al punto triplo Z_vap = PV/RT tra 0,85 e 1', (rc.Vv / rc.Vl).toFixed(3) + ', Z = ' + (rb.P * rb.Vv / (R * X.SOST.co2.Tt)).toFixed(3), rc.Vv / rc.Vl < 1.3 && rc.Vl < Vc && rc.Vv > Vc && rb.P * rb.Vv / (R * X.SOST.co2.Tt) > 0.85 && rb.P * rb.Vv / (R * X.SOST.co2.Tt) < 1);
/* la superficie: dentro la cupola P = P_sat e la frazione di liquido segue la leva; fuori P di PR */
var T = 270, s0 = X.saturazione('co2', T), Vm = Math.sqrt(s0.Vl * s0.Vv), q = X.superficiePVT('co2', T, Vm, s0), q2 = X.superficiePVT('co2', T, s0.Vv * 3, s0);
ok('superficie: coesistenza piatta con la leva, vapore fuori', q.regione + ' ' + (q.P / s0.P).toFixed(6) + ' x_l ' + q.xl.toFixed(4) + ' · ' + q2.regione, q.regione === 'coesistenza' && q.P === s0.P && Math.abs(q.xl - (s0.Vv - Vm) / (s0.Vv - s0.Vl)) < 1e-12 && q2.regione === 'gas' && Math.abs(q2.P - X.pressionePR(X.parametriPR('co2'), T, s0.Vv * 3)) < 1e-9);
/* il liquido e' quasi incomprimibile: la compressibilita' isoterma del liquido saturo e' migliaia di volte piu' piccola di quella del vapore */
var p = X.parametriPR('co2'), kap = function (V) { var h = V * 1e-6; return -1 / V * (2 * h) / (X.pressionePR(p, T, V + h) - X.pressionePR(p, T, V - h)); };
ok('κ_T(liquido) ≪ κ_T(vapore) a 270 K (0,89 Tc: vicino al critico la differenza cala)', (kap(s0.Vv * 0.999) / kap(s0.Vl * 0.999)).toFixed(0) + ' volte', kap(s0.Vv * 0.999) / kap(s0.Vl * 0.999) > 20);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
