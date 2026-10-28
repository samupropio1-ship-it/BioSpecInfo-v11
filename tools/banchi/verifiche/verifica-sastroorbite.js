/* verifica di bsi-astro-orbite.js (F.calcolo.orbite) */
var C = require('./carica.js')(['bsi-astro-orbite.js']), O = C.orbite;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var G = Math.PI / 180, MU = O.MU;
function norma(a) { return Math.hypot(a[0], a[1], a[2]); }
function diff(a, b) { return norma([a[0] - b[0], a[1] - b[1], a[2] - b[2]]); }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dang(x, y) { var d = Math.abs(((x - y) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); return d; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

/* 1. elementi ↔ stato */
var rnd = mulberry32(3), peg = 0, pegAng = 0;
for (var k = 0; k < 2000; k++) {
  var iper = k % 5 === 0, e = iper ? 1.05 + rnd() * 2 : 0.001 + rnd() * 0.95, a = iper ? -(7000 + rnd() * 30000) : 7000 + rnd() * 50000;
  var el = { a: a, e: e, i: (1 + rnd() * 178) * G, O: rnd() * 2 * Math.PI, w: rnd() * 2 * Math.PI, nu: iper ? (rnd() - 0.5) * 2 * Math.acos(-1 / e) * 0.9 : rnd() * 2 * Math.PI };
  var s = O.elementiStato(el), b = O.statoElementi(s.r, s.v);
  peg = Math.max(peg, Math.abs(b.a - a) / Math.abs(a), Math.abs(b.e - e));
  pegAng = Math.max(pegAng, dang(b.i, el.i), dang(b.O, el.O), dang(b.w, el.w), dang(b.nu, el.nu));
}
ok('elementi → stato → elementi: 2000 orbite casuali (400 iperboliche), errore relativo su a ed e', peg.toExponential(2), peg < 1e-9);
ok('… e sugli angoli i, Ω, ω, ν', (pegAng / G).toExponential(2) + '°', pegAng < 1e-8);
/* Curtis, esempio 4.3 */
var c43 = O.statoElementi([-6045, -3490, 2500], [-3.457, 6.618, 2.533]);
ok('Curtis es. 4.3: h = 58 310 km²/s, i = 153,2°, Ω = 255,3°, e = 0,1712, ω = 20,07°, ν = 28,45°, a = 8788 km', [c43.h.toFixed(0), (c43.i / G).toFixed(2), (c43.O / G).toFixed(2), c43.e.toFixed(4), (c43.w / G).toFixed(2), (c43.nu / G).toFixed(2), c43.a.toFixed(0)].join(', '),
  Math.abs(c43.h - 58310) < 5 && Math.abs(c43.i / G - 153.2) < 0.05 && Math.abs(c43.O / G - 255.3) < 0.05 && Math.abs(c43.e - 0.1712) < 2e-4 && Math.abs(c43.w / G - 20.07) < 0.05 && Math.abs(c43.nu / G - 28.45) < 0.05 && Math.abs(c43.a - 8788) < 2);
/* casi degeneri */
var circ = O.statoElementi([7000, 0, 0], [0, Math.sqrt(MU / 7000) * Math.cos(0.5), Math.sqrt(MU / 7000) * Math.sin(0.5)]), eq = O.statoElementi(O.elementiStato({ a: 9000, e: 0.2, i: 0, O: 0, w: 1.0, nu: 0.7 }).r, O.elementiStato({ a: 9000, e: 0.2, i: 0, O: 0, w: 1.0, nu: 0.7 }).v);
ok('orbita circolare: e = 0, ω = 0, ν = argomento della latitudine; equatoriale: Ω = 0, ω = longitudine del pericentro', 'e = ' + circ.e.toExponential(1) + ', ν = ' + circ.nu.toFixed(6) + '; Ω = ' + eq.O + ', ω = ' + eq.w.toFixed(10), circ.e < 1e-12 && Math.abs(circ.nu) < 1e-9 && eq.O === 0 && Math.abs(eq.w - 1.0) < 1e-9 && Math.abs(eq.nu - 0.7) < 1e-9);

/* 2. vis-viva, energia, momento angolare */
var s2 = O.elementiStato({ a: 26600, e: 0.74, i: 63.4 * G, O: 1, w: 270 * G, nu: 2.0 }), R2 = norma(s2.r);
ok('vis-viva: |v| = √(μ(2/r − 1/a)) (Molniya)', norma(s2.v).toFixed(10) + ' vs ' + O.visViva(R2, 26600).toFixed(10), Math.abs(norma(s2.v) - O.visViva(R2, 26600)) < 1e-10);
var pegE = 0, pegH = 0, h0 = norma(cross(s2.r, s2.v)), en0 = norma(s2.v) * norma(s2.v) / 2 - MU / R2;
for (var tt = 0; tt < 86400; tt += 977) { var p = O.propaga(s2.r, s2.v, tt), en = norma(p.v) * norma(p.v) / 2 - MU / norma(p.r); pegE = Math.max(pegE, Math.abs(en / en0 - 1)); pegH = Math.max(pegH, Math.abs(norma(cross(p.r, p.v)) / h0 - 1)); }
ok('propagazione universale: energia e momento angolare conservati su un giorno', pegE.toExponential(1) + ', ' + pegH.toExponential(1), pegE < 1e-10 && pegH < 1e-10);
var pegP = 0;
[[s2.r, s2.v], [O.elementiStato({ a: -12000, e: 1.6, i: 0.3, O: 2, w: 1, nu: 0.2 }).r, O.elementiStato({ a: -12000, e: 1.6, i: 0.3, O: 2, w: 1, nu: 0.2 }).v], [[7000, 100, 30], [0.1, 7.6, 1.2]]].forEach(function (S0) {
  [600, 5000, 30000].forEach(function (dt) { var u = O.propaga(S0[0], S0[1], dt), k2 = O.propagaElementi(S0[0], S0[1], dt); pegP = Math.max(pegP, diff(u.r, k2.r) / norma(k2.r)); });
});
ok('variabili universali = Keplero classico con gli elementi (ellisse e iperbole)', pegP.toExponential(2), pegP < 1e-9);
var Tp = O.periodo(26600), pT = O.propaga(s2.r, s2.v, Tp);
ok('dopo un periodo 2π√(a³/μ) si torna al punto di partenza', (diff(pT.r, s2.r)).toExponential(2) + ' km', diff(pT.r, s2.r) < 1e-5);

/* 3. manovre */
var H = O.hohmann(O.RT + 300, O.raggioGEO());
ok('Hohmann LEO (300 km) → GEO: Δv₁ = 2,43, Δv₂ = 1,47, totale ≈ 3,89 km/s, 5,26 h', H.dv1.toFixed(3) + ' + ' + H.dv2.toFixed(3) + ' = ' + H.tot.toFixed(3) + ' km/s, ' + (H.tempo / 3600).toFixed(2) + ' h', Math.abs(H.tot - 3.893) < 0.01 && Math.abs(H.tempo / 3600 - 5.26) < 0.02);
var sB = O.sogliaBiellittica();
ok('soglia bi-ellittica (r_b → ∞) contro Hohmann: R = 11,9388', sB.toFixed(6), Math.abs(sB - 11.938765) < 1e-5);
ok('bi-ellittica con r_b grande = formula limite (√2 − 1)(1 + 1/√R)', O.bielliptica(1, 20, 1e9, 1).tot.toFixed(6) + ' vs ' + O.biellitticaInf(20).toFixed(6), Math.abs(O.bielliptica(1, 20, 1e9, 1).tot - O.biellitticaInf(20)) < 1e-4);
ok('Hohmann con le formule chiuse = Hohmann dalla vis-viva (R = 7)', O.hohmannRel(7).toFixed(12) + ' vs ' + O.hohmann(1, 7, 1).tot.toFixed(12), Math.abs(O.hohmannRel(7) - O.hohmann(1, 7, 1).tot) < 1e-12);
var sO = O.sogliaOgniRb(), Rmax = 0, vmax = 0; for (var R = 2; R < 40; R += 0.001) { var v = O.hohmannRel(R); if (v > vmax) { vmax = v; Rmax = R; } }
ok('oltre R = 15,58 la bi-ellittica vince per ogni r_b; e' + "'" + ' anche il massimo del costo di Hohmann (0,536 v₁)', sO.toFixed(4) + ', massimo a ' + Rmax.toFixed(3) + ' = ' + vmax.toFixed(4), Math.abs(sO - 15.5817) < 2e-3 && Math.abs(Rmax - 15.58) < 0.01 && Math.abs(vmax - 0.5363) < 1e-3);
ok('cambio di piano: 2v sin(Δi/2) = manovra combinata con v uguali', O.cambioPiano(3.07, 28.5 * G).toFixed(10) + ' vs ' + O.combinata(3.07, 3.07, 28.5 * G).toFixed(10), Math.abs(O.cambioPiano(3.07, 28.5 * G) - O.combinata(3.07, 3.07, 28.5 * G)) < 1e-12);

/* 4. satelliti */
ok('raggio geostazionario (μT²/4π²)^(1/3), T = giorno siderale = 42 164 km', O.raggioGEO().toFixed(2) + ' km', Math.abs(O.raggioGEO() - 42164.17) < 0.1);
var iss = O.inclinazioneEliosincrona(O.RT + 700, 0);
ok('inclinazione eliosincrona a 700 km ≈ 98,2°', (iss / G).toFixed(3) + '°', Math.abs(iss / G - 98.19) < 0.03);
var rJ = O.tassiJ2(O.RT + 700, 0, iss);
ok('… e la precessione dei nodi che ne risulta = 360°/anno tropico', (rJ.Odot / G * 86400).toFixed(6) + '°/giorno', Math.abs(rJ.Odot / G * 86400 - 0.985647) < 1e-5);
var rIss = O.tassiJ2(O.RT + 420, 0.0005, 51.64 * G);
ok('ISS: regressione dei nodi ≈ −5,0°/giorno', (rIss.Odot / G * 86400).toFixed(3) + '°/giorno', Math.abs(rIss.Odot / G * 86400 + 5.0) < 0.15);
var ic = O.inclinazioneCritica(), rM = O.tassiJ2(26600, 0.74, ic);
ok('inclinazione critica 63,43°: dω/dt = 0 (Molniya)', (ic / G).toFixed(4) + '°, dω/dt = ' + rM.wdot.toExponential(1), Math.abs(ic / G - 63.4349) < 1e-3 && Math.abs(rM.wdot) < 1e-20);
var geo = O.SATELLITI.geo, tr = O.traccia({ a: geo.a, e: 0, i: 0, O: 0, w: 0, M0: 0 }, 2451545, 0, 86400 * 3, 60, false), lons = tr.map(function (p) { return p[1]; });
ok('traccia geostazionaria: un punto fermo sull’equatore per 3 giorni', 'lon da ' + Math.min.apply(null, lons).toFixed(5) + ' a ' + Math.max.apply(null, lons).toFixed(5) + '°, lat max ' + Math.max.apply(null, tr.map(function (p) { return Math.abs(p[0]); })).toExponential(1), Math.max.apply(null, lons) - Math.min.apply(null, lons) < 1e-3 && tr.every(function (p) { return Math.abs(p[0]) < 1e-9; }));
var gps = O.SATELLITI.gps, eg = { a: gps.a, e: 0.005, i: 55 * G, O: 1, w: 0.3, M0: 0.4 }, a1 = O.traccia(eg, 2451545, 0, 0, 1, false)[0], a2 = O.traccia(eg, 2451545, 86164.0905, 86164.0905, 1, false)[0];
ok('GPS (mezzo giorno siderale): la traccia si ripete dopo un giorno siderale', 'Δlat = ' + Math.abs(a1[0] - a2[0]).toExponential(1) + '°, Δlon = ' + Math.abs(a1[1] - a2[1]).toExponential(1) + '°', Math.abs(a1[0] - a2[0]) < 1e-6 && Math.abs(a1[1] - a2[1]) < 1e-6);

/* 5. Lambert */
var L = O.lambert([5000, 10000, 2100], [-14600, 2500, 7000], 3600);
ok('Curtis es. 5.2: v₁ = (−5,9925, 1,9254, 3,2456), v₂ = (−3,3125, −4,1966, −0,38529) km/s', L.v1.map(function (x) { return x.toFixed(4); }).join(', ') + ' | ' + L.v2.map(function (x) { return x.toFixed(4); }).join(', '), diff(L.v1, [-5.9925, 1.9254, 3.2456]) < 2e-4 && diff(L.v2, [-3.3125, -4.1966, -0.38529]) < 2e-4);
var pegL = 0; rnd = mulberry32(9);
for (k = 0; k < 300; k++) {
  var r1 = [7000 + rnd() * 20000, (rnd() - 0.5) * 20000, (rnd() - 0.5) * 8000], r2 = [(rnd() - 0.5) * 50000, 7000 + rnd() * 30000, (rnd() - 0.5) * 8000], dt = 1800 + rnd() * 40000, Lk = O.lambert(r1, r2, dt);
  var arr = O.propaga(r1, Lk.v1, dt); pegL = Math.max(pegL, diff(arr.r, r2) / norma(r2), diff(arr.v, Lk.v2) / norma(Lk.v2));
}
ok('Lambert: la soluzione propagata per Δt arriva a r₂ con velocità v₂ (300 casi casuali, ellissi e iperboli)', pegL.toExponential(2), pegL < 1e-8);
var Hm = O.hohmann(1.00000261, 1.52371034, O.MU_S_UA), Lh = O.lambert([1, 0, 0], [-1.52371034 * Math.cos(1e-7), -1.52371034 * Math.sin(1e-7), 0], Hm.tempo * 0.99999, O.MU_S_UA);
ok('Lambert vicino a Δθ = 180° con il tempo di Hohmann ritrova la velocità di perielio dell’ellisse di Hohmann', (Lh.v1[1] * O.UAG_KMS).toFixed(3) + ' vs ' + (O.visViva(1, (1 + 1.52371034) / 2, O.MU_S_UA) * O.UAG_KMS).toFixed(3) + ' km/s', Math.abs(norma(Lh.v1) - O.visViva(1, (1 + 1.52371034) / 2, O.MU_S_UA)) * O.UAG_KMS < 0.02);

/* 6. porkchop Terra → Marte */
var jd0 = 2461041.5, Z = O.porkchop(jd0, 1600, 161, 120, 400, 57), mins = [];
for (var b = 0; b < 161; b++) { var best = 1e9, bt = 0; for (var aa = 0; aa < 57; aa++) if (Z[aa][b] < best) { best = Z[aa][b]; bt = 120 + 280 * aa / 56; } mins.push([best, jd0 + 10 * b, bt]); }
var loc = mins.filter(function (m, i) { return i > 0 && i < mins.length - 1 && m[0] < mins[i - 1][0] && m[0] <= mins[i + 1][0] && m[0] < 7; });
var Hkm = Hm.tot * O.UAG_KMS;
ok('minimo del porkchop vicino al costo di Hohmann (5,59 km/s, 259 giorni)', loc.map(function (m) { return m[0].toFixed(3) + ' km/s, ' + m[2].toFixed(0) + ' d'; }).join('; ') + ' vs ' + Hkm.toFixed(3), loc.length >= 2 && loc.every(function (m) { return m[0] >= Hkm - 1e-3 && m[0] < Hkm + 0.15 && Math.abs(m[2] - 259) < 15; }));
var sin = 1 / (1 / 365.25636 / 1.0000039 - 1 / 686.98);
ok('le finestre si ripetono con il periodo sinodico 1/(1/P⊕ − 1/P♂) ≈ 780 giorni', (loc[1][1] - loc[0][1]).toFixed(0) + ' vs ' + sin.toFixed(0) + ' d', loc.length >= 2 && Math.abs(loc[1][1] - loc[0][1] - sin) < 15);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
