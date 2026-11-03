/* verifica della scheda 3D di bsi-fis-cristalli.js (v238): celle, impaccamento, piani di Miller */
var X = require('./carica.js')(['bsi-fis-cristalli.js']).cristalli, C = X.CELLE;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var PI = Math.PI;

/* atomi per cella contati con i pesi (vertici, spigoli, facce) */
var conta = ['sc', 'bcc', 'fcc', 'hcp', 'nacl', 'cscl', 'diamante'].map(function (k) { var c = X.contaAtomi(C[k]); return Object.keys(c).map(function (e) { return c[e]; }).join('+'); }).join(' ');
ok('atomi per cella: SC 1, CCC 2, CFC 4, EC 2 (primitiva), NaCl 4+4, CsCl 1+1, diamante 8', conta, conta === '1 2 4 2 4+4 1+1 8');
/* coordinazione dalle immagini periodiche */
var cn = ['sc', 'bcc', 'fcc', 'hcp', 'nacl', 'cscl', 'diamante'].map(function (k) { return X.vicini(C[k]).cn; }).join(' ');
ok('numeri di coordinazione 6 8 12 12 6 8 4', cn, cn === '6 8 12 12 6 8 4');
/* frazioni di impaccamento contro le formule chiuse */
var pf = { sc: PI / 6, bcc: PI * Math.sqrt(3) / 8, fcc: PI / (3 * Math.sqrt(2)), diamante: PI * Math.sqrt(3) / 16 }, md = 0;
Object.keys(pf).forEach(function (k) { md = Math.max(md, Math.abs(X.impaccamento(C[k]).pf - pf[k])); });
ok('impaccamento SC π/6, CCC π√3/8, CFC π/(3√2), diamante π√3/16', md.toExponential(2), md < 1e-12);
/* esagonale compatta: con c/a ideale = √(8/3) torna 0,7405 come la CFC; con il Mg reale un po' meno */
var ideale = { sis: 'esagonale', esa: true, a: 1, c: Math.sqrt(8 / 3), base: C.hcp.base, el: C.hcp.el };
var pi = X.impaccamento(ideale).pf, pm = X.impaccamento(C.hcp).pf;
ok('EC ideale = π/(3√2), Mg reale (c/a 1,624) < ideale', pi.toFixed(6) + ' / ' + pm.toFixed(4), Math.abs(pi - PI / (3 * Math.sqrt(2))) < 1e-9 && pm < pi && pm > 0.73);
/* contatto ionico: in NaCl la distanza Na–Cl a/2 e' la somma dei raggi di Shannon (entro 1 %) */
var vn = X.vicini(C.nacl);
ok('NaCl: d(Na–Cl) = a/2 ≈ r₊ + r₋', vn.d.toFixed(4) + ' vs ' + (1.02 + 1.81).toFixed(2), Math.abs(vn.d - C.nacl.a / 2) < 1e-9 && Math.abs(vn.d - 2.83) / 2.83 < 0.01);
/* la distanza fra i piani dal vettore reciproco = formula della sezione (cubico ed esagonale) */
var dm = 0;
[[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 1, 0], [3, 1, 1]].forEach(function (h) { dm = Math.max(dm, Math.abs(X.pianiMiller(C.fcc, 1, h[0], h[1], h[2]).d - X.dSpaziatura('cubico', { a: C.fcc.a }, h[0], h[1], h[2]))); });
[[1, 0, 0], [0, 0, 2], [1, 0, 1], [1, 1, 0], [1, 0, 3]].forEach(function (h) { dm = Math.max(dm, Math.abs(X.pianiMiller(C.hcp, 1, h[0], h[1], h[2]).d - X.dSpaziatura('esagonale', { a: C.hcp.a, c: C.hcp.c }, h[0], h[1], h[2]))); });
ok('d(hkl) = 1/|G| coincide con dSpaziatura (cubico ed esagonale)', dm.toExponential(2), dm < 1e-12);
/* estinzioni sistematiche: CFC (100) e (110) spenti, (111) e (200) presenti; CCC (100) spento, (110) presente; EC (001) spento */
var est = [X.strutturaZ(C.fcc, 1, 0, 0), X.strutturaZ(C.fcc, 1, 1, 0), X.strutturaZ(C.bcc, 1, 0, 0), X.strutturaZ(C.hcp, 0, 0, 1), X.strutturaZ(C.diamante, 2, 0, 0)];
var pres = [X.strutturaZ(C.fcc, 1, 1, 1), X.strutturaZ(C.fcc, 2, 0, 0), X.strutturaZ(C.bcc, 1, 1, 0), X.strutturaZ(C.hcp, 0, 0, 2), X.strutturaZ(C.diamante, 1, 1, 1)];
ok('estinzioni: CFC 100/110, CCC 100, EC 001, diamante 200 spenti; gli altri presenti', est.map(function (v) { return v.toFixed(0); }).join(',') + ' | ' + pres.map(function (v) { return v.toFixed(0); }).join(','), est.every(function (v) { return v < 1e-9; }) && pres.every(function (v) { return v > 1; }));
/* i piani (111) dentro la cella CFC: due triangoli equilateri di lato a√2 (n = 1, 2) con 6 atomi ciascuno */
var P = X.pianiMiller(C.fcc, 1, 1, 1, 1), tri = P.piani.filter(function (q) { return q.n === 1; })[0], A = X.areaPoligono(tri.poly), aa = C.fcc.a;
ok('CFC (111): triangolo di area (√3/4)(a√2)², 12 atomi sui piani', A.toFixed(4) + ' vs ' + (Math.sqrt(3) / 4 * 2 * aa * aa).toFixed(4) + ', ' + P.su.length + ' atomi', Math.abs(A - Math.sqrt(3) / 4 * 2 * aa * aa) < 1e-9 && P.su.length === 12);
/* il prisma esagonale contiene 12 vertici + 2 centri delle basi + 3 atomi interni = 17 sfere, cioe' 6 atomi (3 celle primitive) */
var at = X.atomiRegione(C.hcp, 1);
ok('prisma esagonale: 17 sfere disegnate (12·1/6 + 2·1/2 + 3 = 6 atomi)', at.length, at.length === 17);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
