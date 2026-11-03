/* verifica della scheda 3D di bsi-fis-hartreefock.js (v238): ψ sulla griglia, isosuperfici, lobi */
var H = require('./carica.js')(['bsi-fis-hartreefock.js']).hartreefock;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

var M = H.MOL.H2, r = H.scf(M.atomi(1.4), 0);
ok('H₂ a 1,4 bohr: E = −1,116714 Eh (Szabo-Ostlund), il punto di partenza degli orbitali', r.E.toFixed(6), Math.abs(r.E + 1.116714) < 2e-6);
var Gg = H.grigliaMO(r, 0, 48, 4.5), Gu = H.grigliaMO(r, 1, 48, 4.5);
/* la griglia separabile da' gli stessi valori di valoreMO punto per punto */
var md = 0, n1 = 49;
[[3, 7, 11], [24, 24, 20], [30, 12, 40], [10, 40, 25]].forEach(function (q) { var x = Gg.x0[0] + q[0] * Gg.h, y = Gg.x0[1] + q[1] * Gg.h, z = Gg.x0[2] + q[2] * Gg.h; md = Math.max(md, Math.abs(Gg.v[(q[0] * n1 + q[1]) * n1 + q[2]] - H.valoreMO(r, 0, x, y, z))); });
ok('griglia separabile = valoreMO nei nodi', md.toExponential(2), md < 1e-6);
ok('∫|ψ|² sulla griglia = 1 (σg e σu)', H.normaGriglia(Gg).toFixed(4) + ', ' + H.normaGriglia(Gu).toFixed(4), Math.abs(H.normaGriglia(Gg) - 1) < 0.01 && Math.abs(H.normaGriglia(Gu) - 1) < 0.01);
/* parita': σg pari, σu dispari rispetto al centro del legame (0, 0, 0,7) */
var pg = Math.abs(H.valoreMO(r, 0, 0.3, 0.2, 0.7 + 0.5) - H.valoreMO(r, 0, -0.3, -0.2, 0.7 - 0.5)), pu = Math.abs(H.valoreMO(r, 1, 0.3, 0.2, 0.7 + 0.5) + H.valoreMO(r, 1, -0.3, -0.2, 0.7 - 0.5));
ok('σg pari e σu dispari per inversione', pg.toExponential(1) + ', ' + pu.toExponential(1), pg < 1e-12 && pu < 1e-12);
/* la soglia racchiude davvero la frazione richiesta */
var c = H.sogliaIso(Gg, 0.85), s = 0, tot = 0; for (var i = 0; i < Gg.v.length; i++) { var q = Gg.v[i] * Gg.v[i]; tot += q; if (Math.abs(Gg.v[i]) >= c) s += q; }
ok('la regione |ψ| ≥ c contiene l\'85 % di ∫|ψ|²', (s / tot).toFixed(4), Math.abs(s / tot - 0.85) < 0.005);
/* i vertici della superficie stanno sull'isovalore (interpolazione lineare sugli spigoli) */
var Sp = H.isosuperficie(Gg, c, 1), em = 0;
for (i = 0; i < Sp.pos.length; i += 3 * 37) em = Math.max(em, Math.abs(H.valoreMO(r, 0, Sp.pos[i], Sp.pos[i + 1], Sp.pos[i + 2]) - c) / c);
ok('i vertici hanno ψ = c (errore relativo massimo)', em.toFixed(4), em < 0.02);
/* topologia: σg un lobo chiuso (Eulero 2), nessun lobo negativo; σu due lobi di segno opposto separati dal piano nodale */
var lg = H.lobi(Sp), lgn = H.lobi(H.isosuperficie(Gg, c, -1)), cu = H.sogliaIso(Gu, 0.85), lu1 = H.lobi(H.isosuperficie(Gu, cu, 1)), lu2 = H.lobi(H.isosuperficie(Gu, cu, -1));
ok('σg: 1 lobo + (sfera: V − E + F = 2), 0 lobi −', lg.componenti + ' (χ ' + lg.eulero + '), ' + lgn.componenti, lg.componenti === 1 && lg.eulero === 2 && lgn.componenti === 0);
ok('σu: 1 lobo + e 1 lobo −, superfici chiuse (χ = 2)', lu1.componenti + ' (χ ' + lu1.eulero + '), ' + lu2.componenti + ' (χ ' + lu2.eulero + ')', lu1.componenti === 1 && lu2.componenti === 1 && lu1.eulero === 2 && lu2.eulero === 2);
/* acqua: l'HOMO 1b₁ e' il doppietto p perpendicolare al piano della molecola: due lobi, ψ(x, y, z) = −ψ(x, y, −z) */
var W = H.MOL.H2O, rw = H.scf(W.atomi(), 0), k = rw.nocc - 1, Gw = H.grigliaMO(rw, k, 48, 4.5), cw = H.sogliaIso(Gw, 0.85);
var a1 = H.lobi(H.isosuperficie(Gw, cw, 1)).componenti, a2 = H.lobi(H.isosuperficie(Gw, cw, -1)).componenti, an = Math.abs(H.valoreMO(rw, k, 0.2, 0.4, 0.9) + H.valoreMO(rw, k, 0.2, 0.4, -0.9));
ok('H₂O HOMO (1b₁): un lobo per segno, antisimmetrico rispetto al piano molecolare', a1 + ' + ' + a2 + ', |ψ(z) + ψ(−z)| = ' + an.toExponential(1), a1 === 1 && a2 === 1 && an < 1e-10);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
