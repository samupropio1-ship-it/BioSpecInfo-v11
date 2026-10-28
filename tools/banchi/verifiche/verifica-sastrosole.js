/* verifica di bsi-astro-sistemasolare.js (F.calcolo.sistemasolare) */
var C = require('./carica.js')(['bsi-astro-sistemasolare.js']), S = C.sistemasolare;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var G = Math.PI / 180;

/* 1. equazione di Keplero */
var peggiore = 0, contro = 0;
for (var e = 0; e <= 0.97001; e += 0.01) for (var k = 0; k <= 720; k++) {
  var M = -4 * Math.PI + 8 * Math.PI * k / 720, r = Math.abs(S.residuoKeplero(M, e)); if (r > peggiore) peggiore = r;
  /* secondo metodo: bisezione pura su [M − e, M + e] */
  var lo = M - e - 1e-9, hi = M + e + 1e-9; for (var j = 0; j < 200; j++) { var m = (lo + hi) / 2; if (m - e * Math.sin(m) - M > 0) hi = m; else lo = m; }
  contro = Math.max(contro, Math.abs(S.kepleroE(M, e) - (lo + hi) / 2));
}
ok('Keplero: residuo |E − e sin E − M| < 1e-12 per e ≤ 0,97 (70 000 casi, anche M fuori da [0, 2π])', peggiore.toExponential(2), peggiore < 1e-12);
ok('Keplero: Newton = bisezione indipendente entro 1e-12', contro.toExponential(2), contro < 1e-12);

/* 2. date giuliane e tempo siderale (Meeus) */
ok('JD del 1957 ott 4,81 = 2436116,31 (Meeus es. 7.a)', S.giuliano(1957, 10, 4, 0.81 * 24).toFixed(2), Math.abs(S.giuliano(1957, 10, 4, 0.81 * 24) - 2436116.31) < 1e-6);
var c = S.calendario(2436116.31);
ok('calendario inverso di JD 2436116,31', c.anno + '-' + c.mese + '-' + c.giorno + ' ' + c.ore.toFixed(2) + ' h', c.anno === 1957 && c.mese === 10 && c.giorno === 4 && Math.abs(c.ore - 19.44) < 1e-3);
var g = S.gmst(S.giuliano(1987, 4, 10, 0)), atteso = (13 + 10 / 60 + 46.3668 / 3600) * 15;
ok('tempo siderale medio a Greenwich, 1987 apr 10 0h UT = 13h10m46,3668s (Meeus es. 12.a)', g.toFixed(6) + '° vs ' + atteso.toFixed(6) + '°', Math.abs(g - atteso) < 1e-5);

/* 3. la Terra (baricentro Terra-Luna) */
var j0 = S.giuliano(2024, 1, 1, 0), dmin = 9, jmin = 0, dmax = 0, jmax = 0, somma = 0, N = 0, Panom = 365.259636;
for (var d = 0; d < 366; d += 0.05) { var p = S.posizione('terra', j0 + d), rr = Math.hypot(p[0], p[1], p[2]); if (rr < dmin) { dmin = rr; jmin = j0 + d; } if (rr > dmax) { dmax = rr; jmax = j0 + d; } }
/* media su un anno anomalistico esatto (da perielio a perielio) */
for (var kk = 0; kk < 20000; kk++) { var pq = S.posizione('terra', j0 + (kk + 0.5) * Panom / 20000); somma += Math.hypot(pq[0], pq[1], pq[2]); N++; }
var cm = S.calendario(jmin), cM = S.calendario(jmax);
ok('distanza Terra–Sole: perielio a inizio gennaio 2024 (vero: 3 gen), r = a(1−e) ≈ 0,9833 UA', cm.giorno + '/' + cm.mese + ', ' + dmin.toFixed(5) + ' UA', cm.mese === 1 && cm.giorno >= 1 && cm.giorno <= 6 && Math.abs(dmin - 0.98329) < 3e-4);
ok('afelio a inizio luglio 2024 (vero: 5 lug), r ≈ 1,0167 UA', cM.giorno + '/' + cM.mese + ', ' + dmax.toFixed(5) + ' UA', cM.mese === 7 && cM.giorno >= 2 && cM.giorno <= 8 && Math.abs(dmax - 1.01671) < 3e-4);
ok('media temporale di r su un anno anomalistico = a(1 + e²/2)', (somma / N).toFixed(6) + ' vs ' + (1.0000026 * (1 + 0.0167 * 0.0167 / 2)).toFixed(6), Math.abs(somma / N - 1.0000026 * (1 + 0.0167 * 0.0167 / 2)) < 2e-5);
/* vis-viva: la velocita' dalla derivata analitica degli elementi contro v² = GM(2/r − 1/a) */
var vv = S.velocita('terra', S.giuliano(2024, 1, 3, 0)), pp = S.posizione('terra', S.giuliano(2024, 1, 3, 0)), kms = S.UA / 86400;
var v = Math.hypot(vv[0], vv[1], vv[2]) * kms, rp = Math.hypot(pp[0], pp[1], pp[2]), vis = Math.sqrt(S.GM_SOLE * (1 + 3.0e-6) * (2 / (rp * S.UA) - 1 / (1.0000026 * S.UA)));
ok('velocità al perielio dalla derivata di Keplero = vis-viva √(GM(2/r − 1/a)) ≈ 30,29 km/s', v.toFixed(3) + ' vs ' + vis.toFixed(3) + ' km/s', Math.abs(v - vis) / vis < 3e-4 && Math.abs(v - 30.29) < 0.02);
/* derivata numerica come terzo controllo */
var h = 1e-3, pa = S.posizione('terra', S.giuliano(2024, 1, 3, 0) - h), pb = S.posizione('terra', S.giuliano(2024, 1, 3, 0) + h), vn = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]) / (2 * h) * kms;
ok('velocità analitica = derivata numerica della posizione', vn.toFixed(4) + ' km/s', Math.abs(vn - v) < 1e-4);

/* 4. opposizioni di Marte */
function minimo(a, b) { var best = 9, jb = 0; for (var j = a; j < b; j += 0.02) { var dd = S.distanza(S.posizione('marte', j), S.posizione('terra', j)); if (dd < best) { best = dd; jb = j; } } return [best, jb]; }
var m03 = minimo(S.giuliano(2003, 8, 1, 0), S.giuliano(2003, 9, 30, 0)), c03 = S.calendario(m03[1]);
ok('Marte 2003: massimo avvicinamento 0,3727 UA il 27 agosto', m03[0].toFixed(4) + ' UA il ' + c03.giorno + '/' + c03.mese, Math.abs(m03[0] - 0.37272) < 0.002 && c03.mese === 8 && Math.abs(c03.giorno - 27) <= 2);
var m20 = minimo(S.giuliano(2020, 9, 1, 0), S.giuliano(2020, 11, 1, 0)), c20 = S.calendario(m20[1]);
ok('Marte 2020: minimo 0,4149 UA il 6 ottobre', m20[0].toFixed(4) + ' UA il ' + c20.giorno + '/' + c20.mese, Math.abs(m20[0] - 0.41492) < 0.003 && c20.mese === 10 && Math.abs(c20.giorno - 6) <= 2);

/* 5. terza legge di Keplero contro i periodi siderali, e contro i moti medi della tabella */
var peg3 = 0, pegn = 0;
['mercurio', 'venere', 'terra', 'marte', 'giove', 'saturno', 'urano', 'nettuno', 'plutone'].forEach(function (nome) {
  var cc = S.CORPI.filter(function (x) { return x[0] === nome; })[0], el = S.elementi(nome, 2451545), Pk = S.periodoKepler(el.a, cc[2] + (nome === 'terra' ? 7.346e22 : 0)), Pn = 2 * Math.PI / el.n;
  peg3 = Math.max(peg3, Math.abs(Pk / cc[4] - 1)); pegn = Math.max(pegn, Math.abs(Pn / cc[4] - 1));
});
ok('P = 2π√(a³/G(M☉+m)) = periodo siderale per i 9 corpi (scarto massimo)', (peg3 * 100).toFixed(3) + ' %', peg3 < 2e-3);
ok('P = 360°/(dL/dt) dalla tabella JPL = periodo siderale (scarto massimo)', (pegn * 100).toFixed(3) + ' %', pegn < 2e-3);

/* 6. poli IAU: l'angolo fra polo di rotazione e normale all'orbita e' l'obliquita' nota */
var obl = { terra: 23.44, marte: 25.19, giove: 3.13, saturno: 26.73, urano: 97.77, venere: 177.36, nettuno: 28.32, plutone: 119.59 }, pego = 0, testo = [];
Object.keys(obl).forEach(function (nome) { var o = S.obliquita(nome, 2451545); testo.push(nome + ' ' + o.toFixed(2)); pego = Math.max(pego, Math.abs(o - obl[nome])); });
ok('obliquità dai poli IAU e dagli elementi orbitali (Terra 23,44, Urano 97,77, Venere 177,36, Plutone 119,59…)', testo.join(', ') + ' · scarto max ' + pego.toFixed(2) + '°', pego < 0.6);

/* 7. la risonanza di Laplace dei satelliti medicei */
var pegL = 0;
[2443000.5, 2451545, 2460000, 2470000.25, 2400000].forEach(function (jd) { pegL = Math.max(pegL, Math.abs(S.laplace(jd) - 180)); });
ok('λ_Io − 3λ_Europa + 2λ_Ganimede = 180° (5 date fra il 1858 e il 2050)', 'scarto max ' + pegL.toExponential(2) + '°', pegL < 0.01);
var P = S.periodiMedicei();
ok('periodi 1,769 / 3,551 / 7,155 / 16,689 d e rapporti ≈ 2 (1:2:4)', P.map(function (x) { return x.toFixed(3); }).join(', ') + ' · ' + (P[1] / P[0]).toFixed(4) + ', ' + (P[2] / P[1]).toFixed(4), Math.abs(P[0] - 1.769) < 1e-3 && Math.abs(P[1] - 3.551) < 1e-3 && Math.abs(P[2] - 7.155) < 1e-3 && Math.abs(P[3] - 16.689) < 1e-3 && Math.abs(P[1] / P[0] - 2) < 0.01 && Math.abs(P[2] / P[1] - 2) < 0.02);
/* terza legge per i satelliti: a³/P² = G M_Giove */
var gm = S.MEDICEI.map(function (m) { var Pp = 360 / m[3] * 86400; return 4 * Math.PI * Math.PI * Math.pow(m[4], 3) / (Pp * Pp); });
ok('Keplero III per i medicei: 4π²a³/P² = GM♃ = 1,2669·10⁸ km³/s² per tutti e quattro', gm.map(function (x) { return (x / 1e8).toFixed(4); }).join(', '), gm.every(function (x) { return Math.abs(x / 1.26687e8 - 1) < 3e-3; }));

/* 8. stagioni e durata del giorno */
var dg = S.durataGiorno(45, 23.44);
ok('giorno a 45° N al solstizio di giugno (δ = 23,44°, geometrico) ≈ 15,4 h', dg.toFixed(3) + ' h', Math.abs(dg - 15.43) < 0.02);
ok('con rifrazione e semidiametro (h₀ = −0,833°) ≈ 15,6 h', S.durataGiorno(45, 23.44, -0.833).toFixed(3) + ' h', Math.abs(S.durataGiorno(45, 23.44, -0.833) - 15.6) < 0.06);
var simm = 0, eq = 0; for (var f = -85; f <= 85; f += 5) for (var de = -23; de <= 23; de += 1) { simm = Math.max(simm, Math.abs(S.durataGiorno(f, de) + S.durataGiorno(-f, de) - 24)); eq = Math.max(eq, Math.abs(S.durataGiorno(f, 0) - 12)); }
ok('simmetria L(φ) + L(−φ) = 24 h e 12 h a tutte le latitudini agli equinozi', simm.toExponential(1) + ', ' + eq.toExponential(1), simm < 1e-12 && eq < 1e-12);
ok('notte polare e giorno polare oltre il circolo (70° N, δ = ±23,44°)', S.durataGiorno(70, 23.44) + ' h, ' + S.durataGiorno(70, -23.44) + ' h', S.durataGiorno(70, 23.44) === 24 && S.durataGiorno(70, -23.44) === 0);
var jj = S.giuliano(2024, 6, 15, 0), best = -99, jb = 0; for (var x = 0; x < 12; x += 0.002) { var dd2 = S.sole(jj + x).dec; if (dd2 > best) { best = dd2; jb = jj + x; } }
var vero = S.giuliano(2024, 6, 20, 20 + 51 / 60);
ok('solstizio di giugno 2024: massimo di δ = ε il 20 giugno 20:51 UT', ((jb - vero) * 24).toFixed(2) + ' h di scarto, δ max = ' + best.toFixed(4) + '°', Math.abs(jb - vero) < 0.15 && Math.abs(best - 23.4365) < 0.01);

/* 9. Luna ed eclissi */
var Z = S.sizigie(S.giuliano(2024, 1, 1, 0), S.giuliano(2027, 1, 1, 0)), cerca = function (y, mo, dd, nuova) { var j = S.giuliano(y, mo, dd, 12); return Z.filter(function (z) { return z.nuova === nuova && Math.abs(z.jd - j) < 1.5; })[0]; };
var e1 = cerca(2024, 4, 8, true);
ok('Luna nuova del 2024 apr 8 alle 18:21 UT (entro 1 h) con eclisse solare totale', ((e1.jd - S.giuliano(2024, 4, 8, 18 + 21 / 60)) * 24).toFixed(2) + ' h, ' + (e1.eclisse && e1.eclisse.tipo) + ', γ = ' + (e1.eclisse && e1.eclisse.gamma.toFixed(2)), Math.abs(e1.jd - S.giuliano(2024, 4, 8, 18 + 21 / 60)) < 1 / 24 && e1.eclisse && e1.eclisse.solare && e1.eclisse.tipo === 'totale');
var e2 = cerca(2024, 10, 2, true), e3 = cerca(2026, 8, 12, true), e4 = cerca(2026, 2, 17, true);
ok('eclissi solari 2024 ott 2 (anulare), 2026 feb 17 (anulare), 2026 ago 12 (totale)', [e2, e4, e3].map(function (z) { return z.eclisse ? z.eclisse.tipo : 'nessuna'; }).join(', '), e2.eclisse && e2.eclisse.tipo === 'anulare' && e4.eclisse && e4.eclisse.tipo === 'anulare' && e3.eclisse && e3.eclisse.tipo === 'totale');
var l1 = cerca(2025, 3, 14, false), l2 = cerca(2025, 9, 7, false), l3 = cerca(2026, 3, 3, false);
ok('eclissi lunari totali 2025 mar 14, 2025 set 7, 2026 mar 3', [l1, l2, l3].map(function (z) { return z.eclisse ? z.eclisse.tipo + ' (γ ' + z.eclisse.gamma.toFixed(2) + ')' : 'nessuna'; }).join(', '), [l1, l2, l3].every(function (z) { return z.eclisse && !z.eclisse.solare && z.eclisse.tipo === 'totale'; }));
var nessuna = cerca(2024, 6, 6, true), nessuna2 = cerca(2025, 6, 11, false);
ok('nessuna eclisse lontano dai nodi (Luna nuova 2024 giu 6, Luna piena 2025 giu 11)', 'β = ' + nessuna.beta.toFixed(2) + '°, ' + nessuna2.beta.toFixed(2) + '°', !nessuna.eclisse && !nessuna2.eclisse && Math.abs(nessuna.beta) > 2);
var perAnno = []; for (var y = 2020; y < 2031; y++) { var zz = S.sizigie(S.giuliano(y, 1, 1, 0), S.giuliano(y + 1, 1, 1, 0)).filter(function (z) { return z.eclisse; }); perAnno.push(zz.length); }
ok('da 4 a 7 eclissi l’anno (comprese quelle di penombra), 2020–2030', perAnno.join(' '), perAnno.every(function (x) { return x >= 4 && x <= 7; }));
var Lm = 0, Nm = 0; for (var q = 0; q < 3650; q += 0.5) { Lm += S.luna(2451545 + q).dist; Nm++; }
ok('distanza media Terra–Luna ≈ 385 000 km', Math.round(Lm / Nm) + ' km', Math.abs(Lm / Nm - 385000) < 600);
/* nodi della Luna: regressione completa in 18,6 anni */
var n0 = S.luna(2451545).nodo, n1 = S.luna(2451545 + 18.6129 * 365.25).nodo;
ok('i nodi lunari regrediscono di 360° in 18,61 anni (6798 giorni)', (n1 - n0).toFixed(3) + '°', Math.abs(((n1 - n0) + 540) % 360 - 180) < 0.05);

/* 10. Saturno: la divisione di Cassini e' la risonanza 2:1 con Mimante */
var r21 = S.raggioRisonanza(S.MIMANTE.P, 2, 1);
ok('periodo di Mimante dalla terza legge = 22,6 h (vero 0,9424 d = 22,62 h)', S.MIMANTE.P.toFixed(3) + ' h', Math.abs(S.MIMANTE.P - 22.618) < 0.05);
ok('risonanza 2:1 con Mimante sul bordo interno della divisione di Cassini (117 580 km; Keplero puro, senza il J2 di Saturno)', Math.round(r21) + ' km, ' + ((r21 / 117580 - 1) * 100).toFixed(2) + ' %', Math.abs(r21 - 117580) / 117580 < 0.01);
ok('risonanza 7:6 con Giano sul bordo esterno dell’anello A (136 775 km)', Math.round(S.raggioRisonanza(S.GIANO.P, 7, 6)) + ' km', Math.abs(S.raggioRisonanza(S.GIANO.P, 7, 6) - 136775) / 136775 < 0.005);
var rA = 120000, rB = 100000;
ok('rotazione differenziale kepleriana: T₁/T₂ = (r₁/r₂)^(3/2)', (S.periodoAnello(rA) / S.periodoAnello(rB)).toFixed(10) + ' vs ' + Math.pow(1.2, 1.5).toFixed(10), Math.abs(S.periodoAnello(rA) / S.periodoAnello(rB) - Math.pow(1.2, 1.5)) < 1e-12);

/* 11. lacune di Kirkwood nella fascia generata */
var L31 = S.lacunaKirkwood(3, 1), PC = S.piccoliCorpi(6000, 0, 0, 7), dentro = 0, accanto = 0;
for (var i = 0; i < PC.n; i++) { var a = PC.el[6 * i]; if (Math.abs(a - L31) < 0.03) dentro++; else if (Math.abs(a - L31) < 0.09) accanto++; }
ok('lacuna 3:1 a a = a♃·(1/3)^(2/3) = 2,50 UA, svuotata (densità dentro / accanto)', L31.toFixed(4) + ' UA, ' + (dentro / 0.06).toFixed(0) + ' vs ' + (accanto / 0.12).toFixed(0) + ' per UA', Math.abs(L31 - 2.502) < 0.002 && dentro / 0.06 < 0.25 * accanto / 0.12);

/* 12. l'orbita di Plutone esce dal piano: z massimo ≈ a(1+e) sin i sin ω... confronto con il campionamento */
var orb = S.orbita('plutone', 2451545, 2000), zmax = Math.max.apply(null, orb.map(function (p) { return Math.abs(p[2]); })), elp = S.elementi('plutone', 2451545);
var zform = 0; for (var E = 0; E < 2 * Math.PI; E += 1e-3) { var xp = elp.a * (Math.cos(E) - elp.e), yp = elp.a * Math.sqrt(1 - elp.e * elp.e) * Math.sin(E); zform = Math.max(zform, Math.abs(Math.sin(elp.i) * (Math.sin(elp.w) * xp + Math.cos(elp.w) * yp))); }
ok('orbita inclinata di Plutone: |z| massimo campionato = massimo di a sin i (sin ω x′ + cos ω y′) ≈ 14 UA', zmax.toFixed(3) + ' vs ' + zform.toFixed(3) + ' UA', Math.abs(zmax - zform) < 0.01 && zmax > 13 && zmax < 15);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
