/* verifica di bsi-astro-cielo.js (F.calcolo.cielo) contro valori noti e metodi indipendenti */
'use strict';
var C = require('./carica.js')(['bsi-astro-cielo.js']).cielo;
var ok = 0, ko = 0;
function chk(nome, cond, val) { if (cond) ok++; else ko++; console.log((cond ? '  ok ' : '  KO ') + nome + (val !== undefined ? '  → ' + val : '')); }
function mod(x, m) { return ((x % m) + m) % m; }
var LAT = 41.12, LON = 16.87;

/* 1. calendario e tempo siderale */
chk('JD di 2000-01-01 12h TT = 2451545.0; 1987-04-10 0h = 2446895.5 (Meeus 7)', C.giuliano(2000, 1, 1, 12) === 2451545 && C.giuliano(1987, 4, 10, 0) === 2446895.5, C.giuliano(1987, 4, 10, 0));
var g1 = C.gmst(2446895.5), g1v = (13 + 10 / 60 + 46.3668 / 3600) * 15;
chk('GMST 1987-04-10 0h UT = 13h10m46.3668s (Meeus es. 12.a)', Math.abs(g1 - g1v) * 240 < 0.01, (g1 / 15).toFixed(7) + ' h');
var g2 = C.gmst(2446896.30625), g2v = (8 + 34 / 60 + 57.0896 / 3600) * 15;
chk('GMST 1987-04-10 19:21 UT = 8h34m57.0896s (Meeus es. 12.b)', Math.abs(g2 - g2v) * 240 < 0.01, (g2 / 15).toFixed(7) + ' h');
/* secondo metodo: formula USNO in ore, con D0 dalla mezzanotte e H ore UT */
var dev = 0;
[2455000.5, 2460000.5, 2461340.5].forEach(function (jd0) { [0, 7.3, 19.9].forEach(function (H) { var D0 = jd0 - 2451545, T = (jd0 + H / 24 - 2451545) / 36525, u = mod(6.697374558 + 0.06570982441908 * D0 + 1.00273790935 * H + 0.000026 * T * T, 24); dev = Math.max(dev, Math.abs(mod(C.gmst(jd0 + H / 24) / 15 - u + 12, 24) - 12) * 3600); }); });
chk('GMST IAU 1982 vs formula USNO (scarto < 0.1 s)', dev < 0.1, dev.toFixed(4) + ' s');
var gd = mod(C.gmst(2451546) - C.gmst(2451545), 360);
chk('in un giorno solare il tempo siderale avanza di 360.9856°: giorno siderale 23h56m4.09s', Math.abs(86400 * 360 / (360 + gd) - 86164.09) < 0.01, (86400 * 360 / (360 + gd)).toFixed(3) + ' s');

/* 2. la Polare: altezza ≈ latitudine */
var P = C.STELLE.filter(function (s) { return s[1] === 'Polaris'; })[0], hmin = 99, hmax = -99;
for (var i = 0; i < 1440; i++) { var h = C.altAz(P[2] * 15, P[3], LAT, i / 4).alt; hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); }
chk('Polare a Bari: (h_max + h_min)/2 = latitudine', Math.abs((hmax + hmin) / 2 - LAT) < 1e-3, ((hmax + hmin) / 2).toFixed(4) + '°');
chk('Polare: escursione = 2(90° − δ) = ' + (2 * (90 - P[3])).toFixed(3) + '°', Math.abs(hmax - hmin - 2 * (90 - P[3])) < 1e-3, (hmax - hmin).toFixed(4));
/* altazimutali: una stella sul meridiano a sud culmina a 90 − φ + δ */
var cu = C.altAz(100, 10, LAT, 100);
chk('culminazione: h = 90° − φ + δ, A = 180°', Math.abs(cu.alt - (90 - LAT + 10)) < 1e-9 && Math.abs(cu.az - 180) < 1e-9, cu.alt.toFixed(6) + '°, ' + cu.az.toFixed(3) + '°');

/* 3. levata e tramonto a Bari, contro la ricerca numerica dell'altezza −0.5667° */
function numerico(ra, dec, jd0, t0) {
  var f = function (t) { return C.altAz(ra, dec, LAT, C.lst(jd0 + t, LON)).alt + 0.5667; }, a = t0 - 0.02, b = t0 + 0.02;
  for (var k = 0; k < 60; k++) { var m = 0.5 * (a + b); if (f(a) * f(m) <= 0) b = m; else a = m; } return 0.5 * (a + b);
}
var jd0 = C.giuliano(2026, 3, 15, 0), sir = [6.7525 * 15, -16.716], lt = C.levataTramonto(sir[0], sir[1], LAT, LON, jd0);
var nl = numerico(sir[0], sir[1], jd0, lt.levata), nt = numerico(sir[0], sir[1], jd0, lt.tramonto);
chk('Sirio a Bari, 15/3/2026: levata e tramonto = zeri numerici di h + 0.567° (< 1 s)', Math.abs(nl - lt.levata) * 86400 < 1 && Math.abs(nt - lt.tramonto) * 86400 < 1, ((lt.levata * 24) % 24).toFixed(4) + ' h, ' + ((lt.tramonto * 24) % 24).toFixed(4) + ' h UT');
var dur = (lt.tramonto - lt.levata) * 24 * 1.0027379, H0 = Math.acos((Math.sin(-0.5667 * Math.PI / 180) - Math.sin(LAT * Math.PI / 180) * Math.sin(sir[1] * Math.PI / 180)) / (Math.cos(LAT * Math.PI / 180) * Math.cos(sir[1] * Math.PI / 180))) * 180 / Math.PI;
chk('Sirio: tempo sopra l’orizzonte = 2H₀/15 ore siderali (H₀ = ' + H0.toFixed(3) + '°)', Math.abs(dur - 2 * H0 / 15) < 1e-6, dur.toFixed(5) + ' h sid.');
var circ = C.levataTramonto(0, 48.4, LAT, LON, jd0), quasi = C.levataTramonto(0, 48.2, LAT, LON, jd0), mai = C.levataTramonto(0, -49.5, LAT, LON, jd0), appena = C.levataTramonto(0, -49.3, LAT, LON, jd0);
chk('soglie a Bari con la rifrazione: circumpolare se δ > 90 − φ − 0.567 = 48.31°, invisibile se δ < −(90 − φ) − 0.567 = −49.45°', circ.circumpolare && quasi.levata != null && mai.maiSorge && appena.levata != null);

/* 4. Sole: due metodi indipendenti e l'equazione del tempo */
/* la serie da' la longitudine dell'equinozio della data, gli elementi quella J2000: si toglie la precessione 50.29″/anno */
var dmax = 0; for (var d = 0; d < 365; d += 7) { var jd = C.giuliano(2026, 1, 1, 0) + d, a = C.sole(jd), b = C.soleDaElementi(jd), pr0 = 50.29 / 3600 * (jd - 2451545) / 365.25; dmax = Math.max(dmax, Math.abs(mod(a.lam - pr0 - b.lam + 180, 360) - 180)); }
chk('longitudine del Sole: serie dell’Almanac (della data − precessione) vs elementi JPL della Terra (< 0.02°)', dmax < 0.02, dmax.toFixed(4) + '°');
var mx = { e: -99 }, mn = { e: 99 };
for (var g = 0; g < 365; g += 0.25) { var jj = C.giuliano(2026, 1, 1, 12) + g, e = C.equazioneTempo(jj); if (e > mx.e) mx = { e: e, g: g }; if (e < mn.e) mn = { e: e, g: g }; }
chk('equazione del tempo: massimo +16.4 min verso il 3 novembre (giorno 307 ± 3)', Math.abs(mx.e - 16.4) < 0.25 && Math.abs(mx.g + 1 - 307) <= 3, mx.e.toFixed(2) + ' min, giorno ' + (mx.g + 1).toFixed(1));
chk('equazione del tempo: minimo −14.2 min verso l’11 febbraio (giorno 42 ± 3)', Math.abs(mn.e + 14.2) < 0.25 && Math.abs(mn.g + 1 - 42) <= 3, mn.e.toFixed(2) + ' min, giorno ' + (mn.g + 1).toFixed(1));
var sol = C.sole(C.giuliano(2026, 6, 21, 12)), equi = C.sole(C.giuliano(2026, 3, 20, 14.7));
chk('solstizio: δ = +23.44°; equinozio (20/3/2026 14:46 UT): δ ≈ 0', Math.abs(sol.dec - 23.44) < 0.02 && Math.abs(equi.dec) < 0.02, sol.dec.toFixed(3) + '°, ' + equi.dec.toFixed(3) + '°');

/* 5. Luna */
var ln = C.luna(C.giuliano(2000, 1, 6, 18.23)), lp = C.luna(C.giuliano(2000, 1, 21, 4.67));
chk('Luna nuova 6/1/2000 18:14 UT: elongazione < 3°, fase < 0.1 %', ln.elongazione < 3 && ln.fase < 0.001, ln.elongazione.toFixed(2) + '°');
chk('Luna piena 21/1/2000 04:40 UT: elongazione > 177°', lp.elongazione > 177, lp.elongazione.toFixed(2) + '°');

/* 6. pianeti */
var kk = C.kepler(1.2, 0.6);
chk('equazione di Keplero: E − e sin E = M', Math.abs(kk - 0.6 * Math.sin(kk) - 1.2) < 1e-13, kk.toFixed(10));
var marte = C.pianeta('Marte', C.giuliano(2003, 8, 27, 10));
chk('Marte all’opposizione del 27/8/2003: distanza 0.3727 UA (record in 60 000 anni)', Math.abs(marte.d - 0.3727) < 0.002, marte.d.toFixed(4) + ' UA');
var rmin = 9, gmin = 0; for (var q = 0; q < 30; q += 0.25) { var r = Math.hypot.apply(null, C.eliocentrico('Terra', C.giuliano(2026, 1, 1, 0) + q)); if (r < rmin) { rmin = r; gmin = q; } }
chk('perielio della Terra: r = 0.9833 UA all’inizio di gennaio', Math.abs(rmin - 0.9833) < 0.0003 && gmin < 6, rmin.toFixed(5) + ' UA, giorno ' + (gmin + 1));
var emax = 0; for (q = 0; q < 600; q += 1) { var jdq = C.giuliano(2026, 1, 1, 0) + q, v = C.pianeta('Venere', jdq), s = C.sole(jdq); emax = Math.max(emax, C.distanzaAngolare(v.ra, v.dec, s.ra, s.dec)); }
chk('Venere: massima elongazione 45–47.5°', emax > 45 && emax < 47.5, emax.toFixed(2) + '°');

/* 7. precessione */
chk('periodo di precessione 360°/50.29″ ≈ 25 770 anni', Math.abs(C.periodoPrecessione() - 25770) < 10, Math.round(C.periodoPrecessione()));
var p2000 = C.poloCeleste(2000);
chk('polo del 2000 = polo J2000 (δ = 90°)', p2000.dec > 89.9999, p2000.dec.toFixed(6));
function minimo(nome, a, b) { var s = C.STELLE.filter(function (x) { return x[1] === nome; })[0], best = { d: 999 }; for (var y = a; y <= b; y += 10) { var p = C.poloCeleste(y), dd = C.distanzaAngolare(s[2] * 15, s[3], p.ra, p.dec); if (dd < best.d) best = { d: dd, y: y }; } return best; }
var mv = minimo('Vega', 8000, 18000), mp = minimo('Polaris', 1500, 2600), mt = minimo('Thuban', -5000, 0);
chk('Vega polare fra ~12 000 anni: distanza minima ≈ 4.5–5.5° (anno 13 000–14 500)', mv.d > 4.5 && mv.d < 5.5 && mv.y > 13000 && mv.y < 14500, mv.d.toFixed(2) + '° nel ' + mv.y);
chk('Polare: minimo < 0.6° verso il 2100', mp.d < 0.6 && mp.y > 2000 && mp.y < 2200, mp.d.toFixed(3) + '° nel ' + mp.y);
chk('Thuban polare verso il 2800 a.C. (< 1°)', mt.d < 1 && mt.y > -3400 && mt.y < -2200, mt.d.toFixed(2) + '° nel ' + mt.y);
/* precedere le coordinate di un'eta' di 25 770 anni riporta al punto di partenza; 1 anno sposta il punto vernale di 50.29″ */
var pr = C.precedi(100, 20, C.periodoPrecessione());
chk('precessione di un periodo intero = identità', Math.abs(pr.ra - 100) < 1e-8 && Math.abs(pr.dec - 20) < 1e-8, pr.ra.toFixed(8));
var gc = C.galEq(0, 0);
chk('centro galattico (l = b = 0) a α = 266.40°, δ = −28.94°', Math.abs(gc.ra - 266.405) < 0.01 && Math.abs(gc.dec + 28.936) < 0.01, gc.ra.toFixed(3) + ', ' + gc.dec.toFixed(3));
/* trasformazioni eclittiche ↔ equatoriali inverse */
var ec = C.eqEcl(123.4, -33.3, 23.4393), back = C.eclEq(ec.lam, ec.bet, 23.4393);
chk('eclittiche ↔ equatoriali: andata e ritorno', Math.abs(back.ra - 123.4) < 1e-9 && Math.abs(back.dec + 33.3) < 1e-9);
chk('catalogo: almeno 120 stelle, tutte con |δ| ≤ 90 e 0 ≤ α < 24', C.STELLE.length >= 120 && C.STELLE.every(function (s) { return Math.abs(s[3]) <= 90 && s[2] >= 0 && s[2] < 24; }), C.STELLE.length + ' stelle, ' + C.COSTELLAZIONI.length + ' costellazioni');

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
