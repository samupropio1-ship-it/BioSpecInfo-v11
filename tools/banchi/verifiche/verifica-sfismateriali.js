/* verifica di bsi-fis-materiali.js (F.calcolo.materiali) */
var C = require('./carica.js')(['bsi-fis-materiali.js']), M = C.materiali;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var PI = Math.PI;

/* 1. curve sforzo–deformazione */
var ac = M.MAT.acciaio, ey = ac.sy / (ac.E * 1000), h = 1e-6;
ok('acciaio: pendenza elastica = E = 207 GPa', ((M.sforzo(ac, 5e-4 + h) - M.sforzo(ac, 5e-4 - h)) / (2 * h) / 1000).toFixed(3), Math.abs((M.sforzo(ac, 5e-4 + h) - M.sforzo(ac, 5e-4 - h)) / (2 * h) / 1000 - 207) < 1e-6);
ok('continuita\' allo snervamento, al carico massimo σ = σ_UTS', M.sforzo(ac, ey).toFixed(3) + ', ' + M.sforzo(ac, ac.eu).toFixed(3), Math.abs(M.sforzo(ac, ey) - 250) < 1e-9 && Math.abs(M.sforzo(ac, ac.eu) - 400) < 1e-9);
var mx = 0; for (var e = 0; e < ac.ef; e += 1e-4) mx = Math.max(mx, M.sforzo(ac, e));
ok('il massimo della curva nominale e\' σ_UTS', mx.toFixed(3), Math.abs(mx - 400) < 1e-6);
var res = M.simpson(function (e) { return M.sforzo(ac, e); }, 0, ey, 2000);
ok('resilienza = area elastica = σ_y²/2E', res.toExponential(5) + ' vs ' + M.resilienza(ac).toExponential(5), Math.abs(res / M.resilienza(ac) - 1) < 1e-9);
var gm = M.MAT.gomma, dg = (M.sforzo(gm, h) - 0) / h;
ok('gomma neo-hookeana: modulo iniziale = 3μ', dg.toFixed(5) + ' vs ' + (3 * gm.mu), Math.abs(dg - 3 * gm.mu) < 1e-4);
var v = M.vera(ac, 0.1);
ok('sforzo vero = nominale·(1+ε), deformazione vera = ln(1+ε)', v.s.toFixed(4) + ', ' + v.e.toFixed(6), Math.abs(v.s - M.sforzo(ac, 0.1) * 1.1) < 1e-9 && Math.abs(v.e - Math.log(1.1)) < 1e-15);
/* tenacita': Simpson contro trapezi fitti */
var tr = 0, N = 200000, a = ac.ef * 0.99999; for (var i = 0; i < N; i++) { var e1 = a * i / N, e2 = a * (i + 1) / N; tr += 0.5 * (M.sforzo(ac, e1) + M.sforzo(ac, e2)) * a / N; }
ok('tenacita\' acciaio (Simpson = trapezi)', M.tenacita(ac).toFixed(2) + ' vs ' + tr.toFixed(2) + ' MJ/m³', Math.abs(M.tenacita(ac) / tr - 1) < 2e-3);

/* 2. sezioni */
var s = M.sezione('rett', { b: 100, h: 200 });
ok('rettangolo: I = bh³/12', s.I.toExponential(6), Math.abs(s.I - 100 * 8e6 / 12) < 1e-6);
['rett', 'I', 'tubo'].forEach(function (tp) {
  var d = tp === 'rett' ? { b: 100, h: 200 } : tp === 'I' ? { B: 150, H: 300, tw: 7.1, tf: 10.7 } : { D: 200, d: 180 }, ss = M.sezione(tp, d), st = M.inerziaStrisce(tp, d, 400000);
  ok('sezione ' + tp + ': I chiuso = ∫y² dA a strisce', (st.I / ss.I).toFixed(6) + ' (A ' + (st.A / ss.A).toFixed(6) + ')', Math.abs(st.I / ss.I - 1) < 2e-4 && Math.abs(st.A / ss.A - 1) < 2e-4);
});
var ipe = M.sezione('I', { B: 150, H: 300, tw: 7.1, tf: 10.7 });
/* teorema di Huygens–Steiner: due ali + anima */
var ali = 2 * (150 * Math.pow(10.7, 3) / 12 + 150 * 10.7 * Math.pow(150 - 10.7 / 2, 2)), anima = 7.1 * Math.pow(300 - 2 * 10.7, 3) / 12;
ok('profilo a I: formula = Huygens–Steiner (ali + anima); IPE 300 senza raccordi 8,0·10⁷ mm⁴ (tabella 8,36·10⁷ con i raccordi)', (ipe.I / 1e7).toFixed(4) + ' vs ' + ((ali + anima) / 1e7).toFixed(4), Math.abs(ipe.I / (ali + anima) - 1) < 1e-12 && Math.abs(ipe.I / 8.356e7 - 1) < 0.05);

/* 3. travi: integrazione numerica contro le formule chiuse */
var EI = 207e9 * 8.356e-5, L = 4, P = 20000, q = 5000;
[['mensola', 'conc', P, L, 0], ['mensola', 'distr', 0, L, q], ['appoggiata', 'conc', P, L / 2, 0], ['appoggiata', 'distr', 0, L / 2, q]].forEach(function (c) {
  var R = M.trave(c[0], L, c[2], c[3], c[4], EI, 4000), fc = M.frecciaChiusa(c[0], c[1], L, c[2], c[4], EI);
  ok(c[0] + ', carico ' + c[1] + ': freccia numerica = chiusa', (R.freccia * 1000).toFixed(5) + ' vs ' + (fc * 1000).toFixed(5) + ' mm', Math.abs(R.freccia / fc - 1) < 1e-5);
});
var Rm = M.trave('mensola', L, P, L, 0, EI, 2000);
ok('mensola: momento all\'incastro = −PL, taglio = P, M(L) = 0', (Rm.M[0] / 1000).toFixed(3) + ', ' + (Rm.V[1] / 1000).toFixed(3) + ', ' + Rm.M[2000].toExponential(1), Math.abs(Rm.M[0] + P * L) < 1e-6 && Math.abs(Rm.V[1] - P) < 1e-9 && Math.abs(Rm.M[2000]) < 1e-6);
var Rs = M.trave('appoggiata', L, 0, L / 2, q, EI, 2000);
ok('appoggiata, q: M_max = qL²/8 a metà, M(L) = 0 (equilibrio)', (Rs.Mmax / 1000).toFixed(5) + ' vs ' + (q * L * L / 8000).toFixed(5), Math.abs(Rs.Mmax - q * L * L / 8) < 1e-3 && Math.abs(Rs.M[2000]) < 1e-6);
var Ra = M.trave('appoggiata', 6, 10000, 2, 0, EI, 3000), bb = 2, fa = 10000 * bb * Math.pow(36 - bb * bb, 1.5) / (9 * Math.sqrt(3) * 6 * EI);
ok('appoggiata, P fuori centro (a = 2, L = 6): freccia max = Pb(L²−b²)^{3/2}/(9√3 L EI), b il tratto piu\' corto', (Ra.freccia * 1000).toFixed(5) + ' vs ' + (fa * 1000).toFixed(5), Math.abs(Ra.freccia / fa - 1) < 1e-5);

/* 4. Eulero: K dal determinante 4×4 */
var Kcc = PI / M.kCritico('cc'), Kll = PI / M.kCritico('ll'), Kic = PI / M.kCritico('ic'), Kii = PI / M.kCritico('ii');
ok('K dal determinante: 1, 2, 0,6992, 0,5', [Kcc, Kll, Kic, Kii].map(function (k) { return k.toFixed(5); }).join(', '), Math.abs(Kcc - 1) < 1e-6 && Math.abs(Kll - 2) < 1e-6 && Math.abs(Kic - 0.69915) < 1e-4 && Math.abs(Kii - 0.5) < 1e-6);
var rapp = [Kll, Kcc, Kic, Kii].map(function (k) { return 1 / (k * k); });
ok('rapporti P_cr/P_cr(cerniere) = 0,25 : 1 : 2,046 : 4', rapp.map(function (r) { return r.toFixed(4); }).join(' : '), Math.abs(rapp[0] - 0.25) < 1e-6 && Math.abs(rapp[2] - 2.0457) < 1e-3 && Math.abs(rapp[3] - 4) < 1e-5);
ok('incastro-cerniera: kL radice di tan(kL) = kL (4,4934)', M.kCritico('ic').toFixed(6), Math.abs(Math.tan(M.kCritico('ic')) - M.kCritico('ic')) < 1e-5 && Math.abs(M.kCritico('ic') - 4.493409) < 1e-5);
var md = M.modo('cc', 60), sd = 0; for (i = 0; i <= 60; i++) sd = Math.max(sd, Math.abs(Math.abs(md.y[i]) - Math.sin(PI * i / 60)));
ok('modo cerniera–cerniera = sin(πx/L)', sd.toExponential(2), sd < 1e-9);
ok('P_cr cerniere: π²EI/L² (acciaio 40×60, L = 3 m)', (M.caricoCritico(207e9, 60 * 64000 / 12 * 1e-12, 3, 1) / 1000).toFixed(3) + ' kN', Math.abs(M.caricoCritico(207e9, 60 * 64000 / 12 * 1e-12, 3, 1) - PI * PI * 207e9 * 3.2e-7 / 9) < 1e-6);

/* 5. suono */
var va = M.velocitaSuono(M.MAT.acciaio);
ok('acciaio: c_L ≈ 5900, c_T ≈ 3200 m/s', va.L.toFixed(0) + ', ' + va.T.toFixed(0), Math.abs(va.L - 5900) < 100 && Math.abs(va.T - 3200) < 60);
ok('c_L/c_T = √(2(1−ν)/(1−2ν)) e c_L > c_barra > c_T', (va.L / va.T).toFixed(6) + ' vs ' + Math.sqrt(2 * 0.71 / 0.42).toFixed(6), Math.abs(va.L / va.T - Math.sqrt(2 * 0.71 / 0.42)) < 1e-12 && va.L > va.barra && va.barra > va.T);
var cat = M.catenaVelocita(207e9, 7850, 1e-3, 1200, 3000);
ok('catena di masse e molle: velocita\' dell\'impulso = √(E/ρ)', cat.misurata.toFixed(1) + ' vs ' + cat.teorica.toFixed(1), Math.abs(cat.misurata / cat.teorica - 1) < 0.01);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
