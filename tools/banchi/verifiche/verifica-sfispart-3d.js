/* verifica del rivelatore 3D di bsi-fis-particelle.js (F.calcolo.particelle, v238): eliche nel campo,
   ricostruzione di p_T e della carica dai colpi, massa invariante, H → γγ, sagitta, campo di ritorno.
   Gli stessi controlli sono anche in verifica-sfispart.js (la sezione); qui nel formato del banco test_3d238 */
'use strict';
var P = require('./carica.js')(['bsi-fis-particelle.js']).particelle;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

/* il rivelatore 3D (v238): eliche nel campo di 3,8 T, ricostruzione dai colpi, massa invariante */
var gz = P.generatore(5, 0, 0), ept = 0, em = 0, cariche = true;
for (var i = 0; i < 200; i++) { var ez = gz(), rr = [0, 1].map(function (j) { return P.ricostruisci(P.traccia(ez.mu[j], j ? -1 : 1, 'mu').colpi, 0.1056583755); }); cariche = cariche && rr[0].q === 1 && rr[1].q === -1; ept = Math.max(ept, Math.abs(rr[0].pT / Math.hypot(ez.mu[0][1], ez.mu[0][2]) - 1)); em = Math.max(em, Math.abs(P.massa(P.somma4(rr[0].p4, rr[1].p4)) / ez.m - 1)); }
ok('rivelatore: p_T = 0,3·B·R dal cerchio per vertice e colpi (200 coppie Z → μμ), cariche giuste', ept.toExponential(2), ept < 1e-4 && cariche);
ok('rivelatore: massa invariante ricostruita = massa generata', em.toExponential(2), em < 1e-4);
/* raggio dell'elica contro R = p_T/(0,3 B): un muone di 1 GeV trasverso nel piano (resta nel solenoide su un cerchio di 0,877 m) */
var t1 = P.traccia([Math.sqrt(1 + 0.0112), 1, 0, 0], 1, 'mu', 0.001), c1 = P.cerchio3(t1.pts[10], t1.pts[200], t1.pts[400]);
ok('elica: R = p_T/(0,3·3,8 T) = 0,8772 m', c1.R.toFixed(5), Math.abs(c1.R - 1 / (0.3 * 3.8)) < 1e-4);
/* H → γγ: i due fotoni ricostruiti dal calorimetro danno 125,2 GeV; sagitta s = 0,3BL²/(8p_T) */
var rh = mulberry32(9), mh = 0;
for (i = 0; i < 100; i++) { var f = P.eventoHgg(rh); mh = Math.max(mh, Math.abs(P.massa(P.somma4(f[0], f[1])) - 125.2)); }
var tS = P.traccia([Math.sqrt(400 + 0.0112), 20, 0, 0], 1, 'mu', 0.0005), cS = tS.colpi[tS.colpi.length - 1], L = Math.hypot(cS[0], cS[1]);
/* sagitta misurata: il punto dell'elica a meta' corda (r = L/2… il colpo piu' vicino al mezzo) e la sua distanza dalla corda */
var mezzo = tS.pts.reduce(function (b, q) { var d = Math.abs((q[0] * cS[0] + q[1] * cS[1]) / L - L / 2); return d < b[0] ? [d, q] : b; }, [9, null])[1];
var sagMis = Math.abs(mezzo[0] * cS[1] - mezzo[1] * cS[0]) / L, sagForm = 0.3 * 3.8 * L * L / (8 * 20);
ok('H → γγ: m_γγ = 125,2 GeV; sagitta misurata a 20 GeV su L = ' + L.toFixed(2) + ' m contro 0,3BL²/(8p_T) = ' + (sagForm * 1000).toFixed(3) + ' mm', mh.toExponential(1) + ', ' + (sagMis * 1000).toFixed(3) + ' mm', mh < 1e-9 && Math.abs(sagMis / sagForm - 1) < 5e-3);

/* il giogo: fuori dal solenoide il campo e' opposto, la curvatura cambia verso (i muoni di CMS «a S») */
ok('campo: +3,8 T dentro il solenoide, −1,8 T nel ferro, 0 fuori', P.campoRiv(1) + ' / ' + P.campoRiv(5) + ' / ' + P.campoRiv(8), P.campoRiv(1) === 3.8 && P.campoRiv(5) === -1.8 && P.campoRiv(8) === 0);
/* i fotoni (senza carica) vanno dritti fino al calorimetro: punto d'impatto sulla loro direzione */
var tg = P.traccia([10, 6, 8, 0], 0, 'gamma'), dg = tg.impatto ? Math.abs(tg.impatto[0] * 8 - tg.impatto[1] * 6) : 1;
ok('fotone: retta fino all’ECAL (r = 1,29 m)', tg.fine + ', scarto ' + dg.toExponential(1), tg.fine === 'ecal' && dg < 1e-9 && Math.abs(Math.hypot(tg.impatto[0], tg.impatto[1]) - 1.29) < 0.01);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
