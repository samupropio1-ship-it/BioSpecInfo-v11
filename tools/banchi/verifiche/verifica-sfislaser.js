/* verifica di bsi-fis-laser.js (F.calcolo.laser) */
var C = require('./carica.js')(['bsi-fis-laser.js']), L = C.laser;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var EPS = 1e-6;

/* 1. equazioni di bilancio: inversione bloccata alla soglia, uscita lineare, oscillazioni di rilassamento */
[1.5, 2, 4].forEach(function (x) {
  var tr = L.evolviLaser(x, 1000, EPS, 15, 5e-5, 100), fin = tr[tr.length - 1];
  ok('x = ' + x + ': inversione stazionaria bloccata a n = 1 (RK4, t = 15τ)', fin[1].toFixed(5), Math.abs(fin[1] - 1) < 1e-3);
  ok('x = ' + x + ': fotoni s = x − 1', fin[2].toFixed(4) + ' vs ' + (x - 1), Math.abs(fin[2] - (x - 1)) / (x - 1) < 2e-3);
});
var sz = L.stazionario(0.5, 1000, EPS), tr0 = L.evolviLaser(0.5, 1000, EPS, 15, 5e-5, 100), f0 = tr0[tr0.length - 1];
ok('sotto soglia x = 0,5: n = x, s ≈ εx/(r(1−x)) (stazionario esatto = RK4)', f0[1].toFixed(5) + ', s = ' + f0[2].toExponential(3) + ' vs ' + sz.s.toExponential(3), Math.abs(f0[1] - 0.5) < 1e-3 && Math.abs(f0[2] / sz.s - 1) < 1e-3 && Math.abs(sz.s - EPS * 0.5 / (1000 * 0.5)) / sz.s < 1e-3);
/* pendenza dell'uscita e soglia da un fit lineare degli stati stazionari simulati */
var X = [1.5, 2.5, 3.5], S = X.map(function (x) { var tr = L.evolviLaser(x, 1000, EPS, 15, 5e-5, 1000); return tr[tr.length - 1][2]; });
var pend = (S[2] - S[0]) / (X[2] - X[0]), soglia = X[0] - S[0] / pend;
ok('uscita lineare: pendenza 1, soglia x = 1', pend.toFixed(4) + ', ' + soglia.toFixed(4), Math.abs(pend - 1) < 2e-3 && Math.abs(soglia - 1) < 2e-3);
/* periodo delle oscillazioni di rilassamento dai picchi di s */
var tr2 = L.evolviLaser(2, 1000, EPS, 12, 2e-5, 1), picchi = [];
/* il regime lineare: solo i picchi dopo t = 6τ, quando l'oscillazione e' ormai piccola (i primi spike sono non lineari e piu' lenti) */
for (var i = 1; i < tr2.length - 1; i++) if (tr2[i][2] > tr2[i - 1][2] && tr2[i][2] >= tr2[i + 1][2] && tr2[i][0] > 6) picchi.push([tr2[i][0], tr2[i][2] - 1]);
var smorz = Math.log(picchi[0][1] / picchi[picchi.length - 1][1]) / (picchi[picchi.length - 1][0] - picchi[0][0]); picchi = picchi.map(function (p) { return p[0]; });
var Tsim = (picchi[picchi.length - 1] - picchi[0]) / (picchi.length - 1), rl = L.rilassamento(2, 1000);
ok('oscillazioni di rilassamento: smorzamento γ = x/2 (= 1/τ per x = 2)', smorz.toFixed(4), Math.abs(smorz - 1) < 0.03);
ok('oscillazioni di rilassamento: T = 2π/ω_R, ω_R = √(r(x−1) − x²/4)', Tsim.toFixed(5) + ' vs ' + (2 * Math.PI / rl.omega).toFixed(5) + ' (' + picchi.length + ' picchi)', Math.abs(Tsim * rl.omega / (2 * Math.PI) - 1) < 0.02);
/* tre e quattro livelli: soglie dalla formula e dalla simulazione dipendente dal tempo */
var N = 20, W3 = L.soglia3(N), W4 = L.soglia4(N);
ok('soglia 3 livelli (N+1)/(N−1) e 4 livelli 1/(N−1), rapporto = N+1', W3.toFixed(4) + ', ' + W4.toFixed(4) + ', ' + (W3 / W4).toFixed(2), Math.abs(W3 / W4 - (N + 1)) < 1e-12);
var e3 = L.evolvi3(W3 * 1.5, N, 1000, 20, 5e-5);
ok('3 livelli sopra soglia (RK4): inversione bloccata a 1, fotoni = W N₁ − N₂', e3.inv.toFixed(4) + ', ' + e3.phi.toFixed(3) + ' vs ' + L.uscita3(W3 * 1.5, N).toFixed(3), Math.abs(e3.inv - 1) < 1e-3 && Math.abs(e3.phi / L.uscita3(W3 * 1.5, N) - 1) < 2e-3);
var e3b = L.evolvi3(W3 * 0.9, N, 1000, 20, 5e-5);
ok('3 livelli sotto soglia: nessuna emissione stimolata', e3b.phi.toExponential(2) + ', inv = ' + e3b.inv.toFixed(3), e3b.phi < 1e-3 && e3b.inv < 1);

/* 2. modi della cavita' e mode locking */
var M = L.modi(0.3, 473.612e12, 1.5e9, 2, 1);
ok('Δν = c/2L per L = 30 cm = 499,65 MHz', (M.dnu / 1e6).toFixed(3), Math.abs(M.dnu - 299792458 / 0.6) < 1e-6);
var nl = M.modi.filter(function (m) { return m.lasa; }), larga = 1.5e9 * Math.sqrt(Math.log(2) / Math.LN2);
ok('modi che lasano = quelli entro la larghezza dove g > perdite (g₀ = 2: banda = FWHM)', nl.length + ' modi, tutti con |ν−ν₀| < ' + (larga / 2e9).toFixed(3) + ' GHz', nl.every(function (m) { return Math.abs(m.d) < larga / 2; }) && M.modi.filter(function (m) { return !m.lasa && Math.abs(m.d) < larga / 2; }).length === 0);
ok('frequenze multiple intere di c/2L', nl[0].q + '·Δν', Math.abs(nl[0].nu - nl[0].q * M.dnu) < 1e-3);
var Nm = 25, I = L.intensita(Nm, L.fasiNulle(Nm), 4000, 1), media = 0, mx = 0; for (i = 0; i < 4000; i++) { media += I[i] / 4000; mx = Math.max(mx, I[i]); }
ok('fasi bloccate: picco = N², media = N', mx.toFixed(3) + ', ' + media.toFixed(4), Math.abs(mx - Nm * Nm) < 1e-9 && Math.abs(media - Nm) < 1e-9);
var w = L.fwhm(I, 4000, 1);
ok('durata dell’impulso ≈ 0,886 T/N (sinc²)', (w * Nm).toFixed(4), Math.abs(w * Nm - 0.886) < 0.01);
var Ir = L.intensita(Nm, L.fasiCasuali(Nm, 3), 4000, 1), mr = 0, pr = 0; for (i = 0; i < 4000; i++) { mr += Ir[i] / 4000; pr = Math.max(pr, Ir[i]); }
ok('fasi casuali: stessa media N (Parseval), picco molto minore di N²', mr.toFixed(4) + ', picco ' + pr.toFixed(1), Math.abs(mr - Nm) < 1e-9 && pr < 0.5 * Nm * Nm);

/* 3. Rabi: formula contro Schrödinger RK4 e contro le equazioni di Bloch */
var mxs = 0, mxb = 0;
[[1, 0], [1, 1], [0.5, -2], [2, 0.7]].forEach(function (c) {
  var f = L.schrodinger(c[0], c[1]), y = [1, 0, 0, 0], g = L.bloch(c[0], c[1], 0, 0), R = [0, 0, -1], h = 1e-3;
  for (var k = 1; k <= 20000; k++) { y = L.rk4(f, y, h); R = L.rk4(g, R, h); if (k % 500 === 0) { var tt = k * h, P = L.rabi(c[0], c[1], tt); mxs = Math.max(mxs, Math.abs(y[2] * y[2] + y[3] * y[3] - P)); mxb = Math.max(mxb, Math.abs((R[2] + 1) / 2 - P)); } }
});
ok('Rabi: formula = Schrödinger (RK4), 4 casi Ω, Δ, t ≤ 20', mxs.toExponential(2), mxs < 1e-9);
ok('Rabi: formula = equazioni di Bloch (w = 2P − 1)', mxb.toExponential(2), mxb < 1e-9);
var yy = [1, 0, 0, 0], ff = L.schrodinger(1, 0); for (i = 0; i < Math.round(Math.PI / 1e-3); i++) yy = L.rk4(ff, yy, 1e-3);
ok('impulso π a risonanza: inversione completa', (yy[2] * yy[2] + yy[3] * yy[3]).toFixed(6), Math.abs(yy[2] * yy[2] + yy[3] * yy[3] - 1) < 1e-5);
var G = 0.3, Rb = [0, 0, -1], gb = L.bloch(1, 0.5, 1 / G, 2 / G); for (i = 0; i < 200000; i++) Rb = L.rk4(gb, Rb, 1e-3);
ok('con smorzamento: ρ_ee stazionario = (Ω²/4)/(Δ² + Ω²/2 + Γ²/4)', ((Rb[2] + 1) / 2).toFixed(6) + ' vs ' + L.rhoStaz(1, 0.5, G).toFixed(6), Math.abs((Rb[2] + 1) / 2 - L.rhoStaz(1, 0.5, G)) < 1e-6);
ok('saturazione: ρ_ee < ½ anche con Ω = 100', L.rhoStaz(100, 0, 1).toFixed(6), L.rhoStaz(100, 0, 1) < 0.5 && L.rhoStaz(100, 0, 1) > 0.4999);

/* 4. Mach–Zehnder */
function misura(D, seme) { var g = L.fotoni(seme), NB = 48, PER = 120, ph = [], c1 = []; for (var i = 0; i < NB; i++) { ph.push(4 * Math.PI * (i + 0.5) / NB); var c = 0; for (var k = 0; k < PER; k++) if (g(ph[i], D) === 1) c++; c1.push(c); } return L.visibilita(ph, c1); }
var v0 = misura(0, 11), v1 = misura(1, 11), vh = misura(0.6, 11);
ok('senza informazione sul cammino: V ≈ 1 (48 fasi × 120 fotoni)', v0.V.toFixed(3), v0.V > 0.95);
ok('cammino noto: V ≈ 0', v1.V.toFixed(3), v1.V < 0.08);
ok('D = 0,6: V ≈ √(1 − D²) = 0,8 (Englert)', vh.V.toFixed(3), Math.abs(vh.V - 0.8) < 0.06);
ok('fit della visibilità su dati esatti', L.visibilita([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5].map(function (p) { return 50 * (1 + 0.7 * Math.cos(p - 0.3)); })).V.toFixed(6), Math.abs(L.visibilita([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5].map(function (p) { return 50 * (1 + 0.7 * Math.cos(p - 0.3)); })).V - 0.7) < 1e-9);
ok('P(D1) + P(D2) = 1 e P(D1) = cos²(φ/2) per D = 0', L.pMZ(1, 0).toFixed(6) + ' vs ' + Math.pow(Math.cos(0.5), 2).toFixed(6), Math.abs(L.pMZ(1, 0) - Math.pow(Math.cos(0.5), 2)) < 1e-12);

console.log('\n' + (n - ko) + '/' + n + ' controlli superati');
process.exit(ko ? 1 : 0);
