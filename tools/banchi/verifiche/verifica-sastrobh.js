/* verifica di bsi-astro-buchineri.js (F.calcolo.buchineri) */
var C = require('./carica.js')(['bsi-astro-buchineri.js']), K = C.buchineri;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* 1. potenziale efficace: ISCO, sfera dei fotoni, orbita marginale (numerici, senza le formule chiuse) */
var isco = K.iscoNumerico();
ok('ISCO dal potenziale: il minimo sparisce a L = √12 M, r = 6M', 'L = ' + isco.L.toFixed(6) + ', r = ' + isco.r.toFixed(3), Math.abs(isco.L - Math.sqrt(12)) < 1e-5 && Math.abs(isco.r - 6) < 0.02);
var rf = K.sferaFotoniNumerica();
ok('sfera dei fotoni: massimo di (1 − 2M/r)/r² a 3M', rf.toFixed(8), Math.abs(rf - 3) < 1e-6);
var rm = K.marginaleNumerica();
ok('orbita marginalmente legata (E = 1) a 4M', rm.toFixed(8) + ', L = ' + K.Lcircolare(rm).toFixed(6), Math.abs(rm - 4) < 1e-8 && Math.abs(K.Lcircolare(rm) - 4) < 1e-6);
var e4 = K.estremiNumerici(4.5), oc = K.orbiteCircolari(4.5);
ok('estremi numerici di V = formula r = (L²/2)(1 ± √(1 − 12/L²)) (L = 4,5)', e4.map(function (e) { return e.tipo + ' ' + e.r.toFixed(6); }).join(', '), e4.length === 2 && Math.abs(e4[0].r - oc.instabile) < 1e-6 && Math.abs(e4[1].r - oc.stabile) < 1e-6);
ok('E e L dell’orbita circolare all’ISCO: √(8/9), √12', K.Ecircolare(6).toFixed(8) + ', ' + K.Lcircolare(6).toFixed(8), Math.abs(K.Ecircolare(6) - Math.sqrt(8 / 9)) < 1e-12 && Math.abs(K.Lcircolare(6) - Math.sqrt(12)) < 1e-12);

/* 2. orbite: L(p, a), precessione con due metodi e limite di campo debole */
var o = K.orbitaDaPA(10, 30), inv = K.inversioni(o.L, o.E);
ok('L, E da pericentro 10M e apocentro 30M: i punti di inversione tornano', inv.map(function (x) { return x.toFixed(6); }).join(', '), Math.abs(inv[0] - 30) < 1e-6 && Math.abs(inv[1] - 10) < 1e-6);
var dI = K.precessioneIntegrale(10, 30), dT = K.precessioneIntegrata(o.L, o.E, 30);
ok('angolo per periodo radiale: integrale ellittico = integrazione RK4 nel tempo proprio', dI.toFixed(6) + ' vs ' + dT.toFixed(6), Math.abs(dI - dT) < 1e-4);
var o2 = K.orbitaDaPA(2000, 3000), p2 = 2 / (1 / 2000 + 1 / 3000), dW = K.precessioneIntegrale(2000, 3000) - 2 * Math.PI;
ok('campo debole: Δφ − 2π → 6πM/p (p = 2400M)', dW.toExponential(5) + ' vs ' + (6 * Math.PI / p2).toExponential(5), Math.abs(dW / (6 * Math.PI / p2) - 1) < 3e-3);
var cl = [K.classifica(o.L, o.E).tipo, K.classifica(3.6, 0.97).tipo, K.classifica(4.6, 1.02).tipo, K.classifica(3.6, 1.05).tipo];
ok('classificazione: legata, tuffo, diffusione, caduta', cl.join(', '), cl.join() === 'legata,tuffo,diffusione,tuffoLibero');
var m = K.mercurio();
ok('Mercurio: 42,98″ al secolo', m.arcsecSecolo.toFixed(3) + '″', Math.abs(m.arcsecSecolo - 42.98) < 0.02);
/* conservazione dell'energia nell'integratore delle particelle */
var y = [30, 0, 0, 0], md = 0; for (var i = 0; i < 20000; i++) { y = K.passoGeodetica(y, K.passoAdatto(y[0]) * 0.5, o.L, o.E); md = Math.max(md, Math.abs(y[1] * y[1] + K.veff(y[0], o.L) - o.E * o.E)); }
ok('integratore delle particelle: (dr/dτ)² + V(r) = E² conservato', md.toExponential(2), md < 1e-8);

/* 3. fotoni */
var tr = K.tracciaFotone(-40, 6, 1, 0, { invariante: true, passi: 5000, b: 6 }), I = tr.invariante, Imax = 0;
for (i = 0; i < I.length; i++) Imax = Math.max(Imax, Math.abs(I[i] - I[0]) / I[0]);
ok('geodetica nulla: u′² + u² − 2u³ = 1/b² conservato (b = 6M, passaggio a ~3,5M)', 'scarto relativo ' + Imax.toExponential(2) + ', b = ' + tr.b.toFixed(6), Imax < 1e-6 && Math.abs(tr.b - 6) < 1e-9);
var bc = K.B_CRITICO, sotto = K.tracciaFotone(-40, bc * (1 - 1e-4), 1, 0, { passi: 20000, b: bc * (1 - 1e-4) }).esito, sopra = K.tracciaFotone(-40, bc * (1 + 1e-4), 1, 0, { passi: 20000, b: bc * (1 + 1e-4) }).esito;
ok('b_c = 3√3 M separa cattura e fuga', 'b_c(1 − 10⁻⁴): ' + sotto + ', b_c(1 + 10⁻⁴): ' + sopra, sotto === 'cattura' && sopra === 'fuga');
/* deflessione: integrale esatto, integrazione delle traiettorie e serie */
var b = 20, aEx = K.deflessione(b), tf = K.tracciaFotone(-1e5, b, 1, 0, { rFuga: 1e5, passi: 200000 }), aNum = Math.atan2(tf.dir[1], tf.dir[0]);
aNum = -aNum; /* il fotone che passa sopra (y > 0) viene piegato verso il basso */
ok('deflessione b = 20M: integrale = traiettoria RK4', aEx.toFixed(6) + ' vs ' + aNum.toFixed(6), Math.abs(aEx - aNum) < 3e-4);
ok('deflessione b = 1000M: serie 4M/b + 15πM²/4b² + …', K.deflessione(1000).toExponential(7) + ' vs ' + K.deflessioneSerie(1000).toExponential(7), Math.abs(K.deflessione(1000) / K.deflessioneSerie(1000) - 1) < 1e-6);
var aS = K.deflessioneSI(K.MSOLE, K.RSOLE) * K.ARCSEC;
ok('luce al bordo del Sole: 1,75″', aS.toFixed(4) + '″', Math.abs(aS - 1.75) < 0.005);
var bS = K.RSOLE / (K.G * K.MSOLE / (K.c * K.c));
ok('… e coincide con la deflessione esatta in unità geometriche (b = ' + bS.toExponential(3) + ' M)', (K.deflessione(bS) * K.ARCSEC).toFixed(4) + '″', Math.abs(K.deflessione(bS) * K.ARCSEC - aS) < 1e-3);
var sh = K.shapiro(K.MSOLE, K.UA, 0.723 * K.UA, K.RSOLE) * 1e6;
ok('ritardo di Shapiro Terra-Venere radente al Sole ≈ 230 μs (Shapiro 1968: ~200 μs)', sh.toFixed(1) + ' μs', sh > 200 && sh < 260);

/* 4. GPS */
var g = K.gps(K.R_GPS);
ok('GPS gravitazionale +45,7 μs/giorno', g.grav.toFixed(2), Math.abs(g.grav - 45.7) < 0.1);
ok('GPS cinematico −7,2 μs/giorno', g.cin.toFixed(2), Math.abs(g.cin + 7.2) < 0.05);
ok('GPS netto ≈ +38,5 μs/giorno', g.netto.toFixed(2), Math.abs(g.netto - 38.5) < 0.15);
var z = K.gps(1.5 * K.R_TERRA).netto;
ok('i due effetti si annullano a r = 3R⊕/2 (secondo controllo)', z.toExponential(2), Math.abs(z) < 1e-9);

/* 5. Flamm */
var dp = K.distanzaPropria(3, 6), s = 0, N = 200000; for (i = 0; i < N; i++) { var r = 3 + 3 * (i + 0.5) / N; s += 3 / N / Math.sqrt(1 - 2 / r); }
ok('distanza propria 3M → 6M: forma chiusa = quadratura (4,14M, non 3M)', dp.toFixed(6) + ' vs ' + s.toFixed(6), Math.abs(dp - s) < 1e-6 && Math.abs(dp - 4.1424) < 1e-3);
var hh = 1e-5, rr = 7, slope = (K.flamm(rr + hh) - K.flamm(rr - hh)) / (2 * hh);
ok('Flamm: 1 + (dz/dr)² = 1/(1 − 2M/r)', (1 + slope * slope).toFixed(8) + ' vs ' + (1 / (1 - 2 / rr)).toFixed(8), Math.abs(1 + slope * slope - 1 / (1 - 2 / rr)) < 1e-7);

/* 6. Hawking */
var Th = K.hawkingT(K.MSOLE);
ok('T_H(1 M☉) ≈ 6,17·10⁻⁸ K', Th.toExponential(4), Math.abs(Th - 6.17e-8) < 0.01e-8);
var M = 1e12, dM = M * 1e-6, dS = (K.entropia(M + dM) - K.entropia(M - dM)) / (2 * dM), pr = K.c * K.c / (K.KB * K.hawkingT(M));
ok('primo principio: dS/dM = c²/T (S in unità di k_B)', dS.toExponential(6) + ' vs ' + pr.toExponential(6), Math.abs(dS / pr - 1) < 1e-8);
var te = K.evaporazione(1e11), tn = K.evaporazioneNumerica(1e11);
ok('t_ev = 5120πG²M³/(ħc⁴) = ∫ c² dM / P (integrazione numerica)', te.toExponential(5) + ' vs ' + tn.toExponential(5), Math.abs(te / tn - 1) < 1e-4);
var tS = K.evaporazione(K.MSOLE) / 3.15576e7;
ok('vita di un buco nero solare ≈ 2·10⁶⁷ anni', tS.toExponential(3), tS > 2.0e67 && tS < 2.2e67);
var Mp = K.massaPerVita(13.8e9 * 3.15576e7);
ok('massa primordiale che evapora oggi ≈ 1,7·10¹¹ kg (solo fotoni)', Mp.toExponential(3), Mp > 1.6e11 && Mp < 1.9e11);
var Ssun = K.entropia(K.MSOLE);
ok('entropia di un buco nero solare ≈ 1,05·10⁷⁷ k_B', Ssun.toExponential(3), Math.abs(Ssun / 1.05e77 - 1) < 0.02);

console.log(n - ko + ' superati, ' + ko + ' falliti');
process.exit(ko > 0 ? 1 : 0);
