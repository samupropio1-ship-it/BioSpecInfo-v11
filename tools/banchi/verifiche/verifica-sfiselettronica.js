/* verifica di bsi-fis-elettronica.js (F.calcolo.elettronica) */
var C = require('./carica.js')(['bsi-fis-elettronica.js']), E = C.elettronica;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var PI = Math.PI;

/* 1. raddrizzatori: con corrente costante e diodi quasi ideali la scarica e' una retta; l'istante in cui
   la sinusoide la raggiunge di nuovo da' l'ondulazione esatta (bisezione), da confrontare con la simulazione */
function rippleEsatto(Vp, f, C, I, Vd, ponte) {
  var w = 2 * PI * f, nd = ponte ? 2 : 1, T = ponte ? 0.5 / f : 1 / f;
  /* la scarica comincia quando la pendenza della sinusoide scende sotto −I/C: Vp ω cos(ωt1) = −I/C */
  var t1 = (PI - Math.acos(I / (C * Vp * w))) / w, V1 = Vp * Math.sin(w * t1) - nd * Vd;
  var g = function (tt) { return Vp * Math.abs(Math.sin(w * tt)) - nd * Vd - (V1 - I * (tt - t1) / C); };
  var lo = t1 + T / 2, hi = t1 + T; for (var k = 0; k < 200; k++) { var m = (lo + hi) / 2; if (g(m) < 0) lo = m; else hi = m; }
  return I * (lo - t1) / C;
}
[[false, 50, 2200e-6, 0.5], [true, 50, 2200e-6, 0.5], [true, 60, 4700e-6, 1]].forEach(function (c) {
  var R = E.raddrizzatore({ Vp: 17, f: c[1], C: c[2], I: c[3], Vd: 0.7, Rs: 0.002, ponte: c[0] }, 10, 40000), st = E.rippleStima(c[3], c[1], c[2], c[0]), ex = rippleEsatto(17, c[1], c[2], c[3], 0.7, c[0]);
  ok((c[0] ? 'ponte' : 'semionda') + ' ' + c[1] + ' Hz, I = ' + c[3] + ' A: ripple simulato = esatto (scarica lineare), ≤ I/(' + (c[0] ? '2' : '') + 'fC)', R.ripple.toFixed(4) + ' vs ' + ex.toFixed(4) + ' (stima ' + st.toFixed(4) + ') V', Math.abs(R.ripple / ex - 1) < 0.02 && R.ripple <= st);
});
var Rr = E.raddrizzatore({ Vp: 17, f: 50, C: 1000e-6, R: 100, Vd: 0.7, Rs: 0.5, ponte: true }, 10, 8000), I = Rr.Vdc / 100;
ok('ponte con carico resistivo: ripple ≈ I/(2fC), V_dc < V_p − 2V_d', Rr.ripple.toFixed(3) + ' vs ' + E.rippleStima(I, 50, 1000e-6, true).toFixed(3) + ', V_dc = ' + Rr.Vdc.toFixed(2), Math.abs(Rr.ripple / E.rippleStima(I, 50, 1000e-6, true) - 1) < 0.25 && Rr.Vdc < 15.6);
ok('picco di corrente nei diodi molto maggiore della corrente media', (Rr.idMax / I).toFixed(1) + ' × I', Rr.idMax > 5 * I);

/* 2. diodi */
var dN = E.diodoNewton(5, 1000, 2.52e-9, 1.752), dL = E.diodoLambert(5, 1000, 2.52e-9, 1.752);
ok('diodo: residuo KVL di Newton', dN.residuo.toExponential(2) + ' V (' + dN.iter + ' iterazioni)', Math.abs(dN.residuo) < 1e-12);
ok('diodo: Newton = forma chiusa con W di Lambert', dN.V.toFixed(9) + ' vs ' + dL.V.toFixed(9), Math.abs(dN.V - dL.V) < 1e-9);
var mx = 0; [[0.6, 100, 1e-14, 1], [12, 10, 1e-18, 2], [3, 5000, 1e-6, 1.05], [1, 1e5, 1e-12, 1.2]].forEach(function (c) { var a = E.diodoNewton(c[0], c[1], c[2], c[3]), b = E.diodoLambert(c[0], c[1], c[2], c[3]); mx = Math.max(mx, Math.abs(a.V - b.V)); });
ok('Newton = Lambert su 4 circuiti diversi (LED, Schottky, Si)', mx.toExponential(2) + ' V', mx < 1e-8);
ok('W di Lambert: W(1) = Ω = 0,567143', E.lambertW(1).toFixed(9), Math.abs(E.lambertW(1) - 0.567143290) < 1e-9);
var z = E.zener(12, 220, 1000, 5.1, 5e-3, 1.5);
ok('Zener: residuo KVL e tensione vicina a V_Z', z.residuo.toExponential(2) + ' A, V = ' + z.V.toFixed(4), Math.abs(z.residuo) < 1e-12 && Math.abs(z.V - 5.1) < 0.2);
var zb = E.bisezione(function (V) { return (12 - V) / 220 - V / 1000 - 5e-3 * Math.exp((V - 5.1) / (1.5 * E.VT)); }, 0, 12);
ok('Zener: Newton = bisezione', z.V.toFixed(10) + ' vs ' + zb.toFixed(10), Math.abs(z.V - zb) < 1e-9);
var dv = E.zener(12.5, 220, 1000, 5.1, 5e-3, 1.5).V - E.zener(11.5, 220, 1000, 5.1, 5e-3, 1.5).V;
ok('regolazione di linea ≈ r_z/(R_s + r_z)', dv.toFixed(5) + ' vs ' + (z.rz / (220 + z.rz)).toFixed(5), Math.abs(dv / (z.rz / (220 + z.rz)) - 1) < 0.05);

/* 3. emettitore comune */
var p = { Vcc: 12, R1: 47000, R2: 10000, RC: 4700, RE: 1000, beta: 150, Is: 1e-14 }, Q = E.polarizza(p);
ok('polarizzazione: residuo KVL di base', Q.residuo.toExponential(2) + ' V; I_C = ' + (Q.Ic * 1000).toFixed(4) + ' mA, V_CE = ' + Q.Vce.toFixed(3), Math.abs(Q.residuo) < 1e-12 && Q.Vce > 1 && !Q.sat);
var stima = (Q.Vth - 0.65) / (p.RE + p.R1 * p.R2 / (p.R1 + p.R2) / p.beta);
ok('I_C ≈ (V_TH − V_BE)/(R_E + R_TH/β) (stima da libro, entro 5 %)', (stima * 1000).toFixed(4) + ' vs ' + (Q.Ic * 1000).toFixed(4) + ' mA', Math.abs(stima / Q.Ic - 1) < 0.05);
var Av = E.guadagnoCE(p, null), amp = 1e-5, vp = E.ceUscita(p, Q, amp, null), vm = E.ceUscita(p, Q, -amp, null), Asim = (vp - vm) / (2 * amp);
ok('guadagno a piccolo segnale simulato = −g_m R_C', Asim.toFixed(4) + ' vs ' + Av.toFixed(4), Math.abs(Asim / Av - 1) < 1e-3);
var big = [E.ceUscita(p, Q, 0.01, null), E.ceUscita(p, Q, -0.01, null)], esa = [-Q.Ic * Math.expm1(0.01 / E.VT) * p.RC, -Q.Ic * Math.expm1(-0.01 / E.VT) * p.RC];
ok('10 mV: semionde asimmetriche = I_C R_C (e^(±v/V_T) − 1) (distorsione esponenziale)', big[0].toFixed(4) + ' / ' + big[1].toFixed(4) + ' V', Math.abs(big[0] - esa[0]) < 1e-9 && Math.abs(big[1] - esa[1]) < 1e-9 && Math.abs(big[0]) > 1.3 * Math.abs(big[1]));

/* 4. operazionali */
var po = { Rf: 100e3, Rin: 10e3, R1: 10e3, A0: 1e5, GBW: 1e6, Vsat: 13 };
ok('guadagni ideali: invertente −10, non invertente 11', E.guadagnoIdeale('inv', po) + ', ' + E.guadagnoIdeale('noninv', po), E.guadagnoIdeale('inv', po) === -10 && E.guadagnoIdeale('noninv', po) === 11);
function ampiezza(tipo, f, a) { var T = 1 / f, R = E.opamp(tipo, po, function (t) { return a * Math.sin(2 * PI * f * t); }, 6 * T, T / 4000), k = Math.floor(R.vo.length / 2), m = 0; for (var i = k; i < R.vo.length; i++) m = Math.max(m, Math.abs(R.vo[i])); return m / a; }
var gi = ampiezza('inv', 100, 0.5), gn = ampiezza('noninv', 100, 0.5);
ok('simulazione a 100 Hz: |G| = 10 e 11 (A₀ finito: correzione < 10⁻³)', gi.toFixed(4) + ', ' + gn.toFixed(4), Math.abs(gi - 10) < 0.01 && Math.abs(gn - 11) < 0.01);
var g10 = ampiezza('noninv', 90909, 0.1);
ok('a f = GBW/(1/β) il guadagno cala di 3 dB', g10.toFixed(3) + ' vs ' + (11 / Math.SQRT2).toFixed(3), Math.abs(g10 / (11 / Math.SQRT2) - 1) < 0.03);
ok('saturazione: con 2 V in ingresso l\'uscita si ferma a 13 V', (ampiezza('inv', 100, 2) * 2).toFixed(3), Math.abs(ampiezza('inv', 100, 2) * 2 - 13) < 1e-9);
var pi = { R: 10e3, C: 10e-9, A0: 1e5, GBW: 1e6, Vsat: 13 }, Ri = E.opamp('integ', pi, function () { return 0.5; }, 1e-3, 1e-7), k1 = Math.floor(Ri.t.length * 0.2), k2 = Math.floor(Ri.t.length * 0.6), pend = (Ri.vo[k2] - Ri.vo[k1]) / (Ri.t[k2] - Ri.t[k1]);
ok('integratore: pendenza = −V_in/(RC) = −5000 V/s', pend.toFixed(2), Math.abs(pend / -5000 - 1) < 2e-3);
var ps = { R1: 10e3, R2: 30e3, A0: 1e5, GBW: 1e6, Vsat: 13 }, sg = E.soglieSchmitt(13, 10e3, 30e3), Rs = E.opamp('schmitt', ps, function (t) { var u = (t * 100) % 1; return 6 * (u < 0.5 ? 4 * u - 1 : 3 - 4 * u); }, 0.03, 2e-7), sal = [], dis = [];
for (var i = 1; i < Rs.vo.length; i++) { if (Rs.vo[i - 1] > 0 && Rs.vo[i] < 0) sal.push(Rs.vin[i]); if (Rs.vo[i - 1] < 0 && Rs.vo[i] > 0) dis.push(Rs.vin[i]); }
ok('trigger di Schmitt: commuta a ±V_sat R₁/(R₁+R₂) = ±3,25 V (entro un campione, 0,04 V)', 'salita ' + sal.map(function (v) { return v.toFixed(3); }).join(',') + ' · discesa ' + dis.map(function (v) { return v.toFixed(3); }).join(','), sal.length >= 2 && dis.length >= 2 && sal.every(function (v) { return Math.abs(v - sg[1]) < 0.05; }) && dis.every(function (v) { return Math.abs(v - sg[0]) < 0.05; }));

/* 5. digitale */
var mxe = 0, tutti = true;
for (var N = 3; N <= 12; N++) for (var k = 0; k < 500; k++) { var V = 5 * k / 499.3, s = E.sar(V, 5, N), att = Math.min(Math.pow(2, N) - 1, Math.floor(V / 5 * Math.pow(2, N))); if (s.codice !== att) tutti = false; }
ok('SAR: codice = ⌊V_in 2ᴺ/V_ref⌋ per 5000 ingressi (N = 3…12)', tutti, tutti);
for (N = 2; N <= 10; N++) for (k = 0; k < Math.pow(2, N); k++) mxe = Math.max(mxe, Math.abs(E.r2r(k, N, 5) - 5 * k / Math.pow(2, N)));
ok('DAC R-2R (analisi nodale) = V_ref·codice/2ᴺ per tutti i codici fino a 10 bit', mxe.toExponential(2) + ' V', mxe < 1e-12);
var Cs = E.contatore(40, 1, 0.05, true), fin = Cs.stati[Cs.stati.length - 1][1];
ok('contatore sincrono: 40 impulsi → 40 mod 16 = 8, nessuno stato spurio', fin + ', ' + Cs.stati.length + ' stati', fin === 8 && Cs.stati.length === 40);
var Ca = E.contatore(16, 1, 0.05, false), spuri = Ca.stati.length - 16;
ok('contatore asincrono: torna a 0 dopo 16 impulsi, con stati transitori (14 spuri in un giro)', Ca.stati[Ca.stati.length - 1][1] + ', spuri ' + spuri, Ca.stati[Ca.stati.length - 1][1] === 0 && spuri === 14);
var q3 = Ca.tracce[3].map(function (e) { return e[0]; });
ok('Q3 divide la frequenza per 16 (salita al clock 8, discesa al 16, piu\' 4 ritardi)', q3.map(function (x) { return x.toFixed(2); }).join(', '), Math.abs(q3[0] - (7 + 0.2)) < 1e-9 && Math.abs(q3[1] - (15 + 0.2)) < 1e-9);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
