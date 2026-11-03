/* verifica della scheda 3D di bsi-fis-dinamica.js (v238): Lennard-Jones in 3D, Verlet, temperatura e pressione */
var D = require('./carica.js')(['bsi-fis-dinamica.js']).dinamica;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* il reticolo di partenza: CFC, 12 primi vicini a a/√2, T e quantita' di moto come richiesto */
var S = D.sistema3D(3, 0.9, 1.2, 5), m0 = D.misure3D(S), a = S.L / 3, nv = 0;
for (var j = 1; j < S.N; j++) { var dx = S.x[0] - S.x[3 * j], dy = S.x[1] - S.x[3 * j + 1], dz = S.x[2] - S.x[3 * j + 2]; dx -= S.L * Math.round(dx / S.L); dy -= S.L * Math.round(dy / S.L); dz -= S.L * Math.round(dz / S.L); if (Math.abs(Math.hypot(dx, dy, dz) - a / Math.SQRT2) < 1e-9) nv++; }
ok('partenza CFC: 108 atomi, 12 vicini a a/√2, T = 1,2, Σp = 0', S.N + ', ' + nv + ', ' + m0.T.toFixed(12) + ', ' + m0.p.toExponential(1), S.N === 108 && nv === 12 && Math.abs(m0.T - 1.2) < 1e-12 && m0.p < 1e-12);
/* forze = −∇U, con le differenze finite su una configurazione disordinata */
for (var q = 0; q < 300; q++) D.passo3D(S, 0.004, 1.2);
function U(S2) { D.forze3D(S2); return S2.Ep; }
var md = 0, h = 1e-6;
[0, 17, 55, 101].forEach(function (i) { for (var c = 0; c < 3; c++) { var x0 = S.x[3 * i + c]; S.x[3 * i + c] = x0 + h; var up = U(S); S.x[3 * i + c] = x0 - h; var um = U(S); S.x[3 * i + c] = x0; D.forze3D(S); md = Math.max(md, Math.abs(-(up - um) / (2 * h) - S.f[3 * i + c]) / (1 + Math.abs(S.f[3 * i + c]))); } });
ok('forze = −∂U/∂x (differenze finite, errore relativo massimo)', md.toExponential(2), md < 1e-5);
/* il viriale e' −dU/dλ per una dilatazione uniforme r → λr, L → λL: la pressione di configurazione */
var x0 = S.x.slice(), L0 = S.L, e = 1e-6;
function Ul(l) { for (var k = 0; k < x0.length; k++) S.x[k] = x0[k] * l; S.L = L0 * l; D.forze3D(S); return S.Ep; }
var dU = (Ul(1 + e) - Ul(1 - e)) / (2 * e); Ul(1); for (var k2 = 0; k2 < x0.length; k2++) S.x[k2] = x0[k2]; S.L = L0; D.forze3D(S);
ok('viriale Σ r·f = −dU/dλ (dilatazione)', S.vir.toFixed(4) + ' vs ' + (-dU).toFixed(4), Math.abs(S.vir + dU) / Math.abs(S.vir) < 1e-5);
/* senza termostato l'energia si conserva (velocity Verlet) e la quantita' di moto resta zero */
var E0 = D.misure3D(S).E, dE = 0;
for (q = 0; q < 2000; q++) { D.passo3D(S, 0.004, 0); if (q % 50 === 0) dE = Math.max(dE, Math.abs(D.misure3D(S).E - E0)); }
var mf = D.misure3D(S);
ok('NVE: |ΔE| per particella su 2000 passi < 5·10⁻³ e Σp = 0', dE.toExponential(2) + ', ' + mf.p.toExponential(1), dE < 5e-3 && mf.p < 1e-10);
/* liste di celle e somma diretta danno le stesse forze (scatola grande: 500 atomi a ρ = 0,4) */
var G = D.sistema3D(5, 0.4, 1.5, 9); for (q = 0; q < 50; q++) D.passo3D(G, 0.004, 1.5);
D.forze3D(G); var f1 = G.f.slice(), Ep1 = G.Ep, L = G.L, f2 = new Float64Array(3 * G.N), Ep2 = 0, RC2 = 6.25, VSH = 4 * (Math.pow(2.5, -12) - Math.pow(2.5, -6));
for (var i = 0; i < G.N; i++) for (j = i + 1; j < G.N; j++) { var d = [0, 1, 2].map(function (c) { var v = G.x[3 * i + c] - G.x[3 * j + c]; return v - L * Math.round(v / L); }), r2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2]; if (r2 >= RC2) continue; var ir6 = 1 / (r2 * r2 * r2), ff = 48 / r2 * ir6 * (ir6 - 0.5); for (var c = 0; c < 3; c++) { f2[3 * i + c] += ff * d[c]; f2[3 * j + c] -= ff * d[c]; } Ep2 += 4 * ir6 * (ir6 - 1) - VSH; }
var mf2 = 0; for (i = 0; i < f1.length; i++) mf2 = Math.max(mf2, Math.abs(f1[i] - f2[i]));
ok('liste di celle = somma su tutte le coppie (forze ed energia)', mf2.toExponential(1) + ', ' + Math.abs(Ep1 - Ep2).toExponential(1), mf2 < 1e-9 && Math.abs(Ep1 - Ep2) < 1e-9);
/* gas rarefatto: Z = P/ρT → 1 + B₂ρ; a T* = 2 il secondo coefficiente del viriale LJ vale B₂* ≈ −0,63 */
var Gs = D.sistema3D(4, 0.02, 2.0, 11), Ps = 0, Ts = 0, ns = 0;
for (q = 0; q < 4000; q++) { D.passo3D(Gs, 0.004, 2.0); if (q > 1000 && q % 10 === 0) { var mm = D.misure3D(Gs); Ps += mm.P; Ts += mm.T; ns++; } }
var Z = Ps / ns / (0.02 * Ts / ns);
ok('gas rarefatto (ρ* 0,02, T* 2): Z ≈ 1 + B₂ρ ≈ 0,99', Z.toFixed(3), Math.abs(Z - 0.987) < 0.03);
/* il termostato porta la temperatura media al valore del bagno */
var Gt = D.sistema3D(4, 0.7, 0.6, 13), Tm = 0, nt = 0;
for (q = 0; q < 1500; q++) { D.passo3D(Gt, 0.004, 1.4); if (q > 700) { Tm += D.misure3D(Gt).T; nt++; } }
ok('termostato: ⟨T⟩ → T del bagno (1,4)', (Tm / nt).toFixed(3), Math.abs(Tm / nt - 1.4) < 0.03);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
