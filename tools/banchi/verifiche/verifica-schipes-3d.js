/* verifica della scheda 3D di bsi-chi-pes.js (v238): la superficie, la sella, le frequenze */
var P = require('./carica.js')(['bsi-chi-pes.js']).pes;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

var S = P.sella(), g = P.grad(S.r, S.r);
ok('la sella e\' un punto stazionario: |∇V| ≈ 0', Math.hypot(g[0], g[1]).toExponential(2), Math.hypot(g[0], g[1]) < 1e-6);
var f = P.frequenze(S.r, S.r);
ok('alla sella una sola curvatura negativa (ω² < 0): frequenza immaginaria', f.cm.map(function (x) { return x.toFixed(0); }).join(', ') + ' cm⁻¹', f.w2[0] > 0 && f.w2[1] < 0);
/* il modo immaginario e' l'antisimmetrico (1, −1): H·(1,−1) ∥ (1,−1) per la simmetria r_AB ↔ r_BC */
var Hv = [f.H[0][0] - f.H[0][1], f.H[1][0] - f.H[1][1]];
ok('hessiana simmetrica per scambio r_AB ↔ r_BC (H₁₁ = H₂₂)', (f.H[0][0] - f.H[1][1]).toExponential(2), Math.abs(f.H[0][0] - f.H[1][1]) < 1e-4 * Math.abs(f.H[0][0]));
ok('la direzione (1, −1) e\' un autovettore di H', (Hv[0] + Hv[1]).toExponential(2), Math.abs(Hv[0] + Hv[1]) < 1e-6 * Math.abs(Hv[0]));
/* lontano dalla sella (A staccato) le frequenze tornano quelle di H₂ libero: ω = β√(2De/μ) */
var fa = P.frequenze(8, P.RE);
ok('asintoto: una frequenza = ω(H₂) del modello, l\'altra ≈ 0', fa.cm[0].toFixed(2) + ' vs ' + P.omega_cm.toFixed(2) + '; ' + fa.cm[1].toFixed(2), Math.abs(fa.cm[0] - P.omega_cm) < 0.5 && Math.abs(fa.cm[1]) < 20);
ok('ω(H₂) del modello vicino al valore misurato 4401 cm⁻¹', P.omega_cm.toFixed(1), Math.abs(P.omega_cm - 4401) < 20);
/* la griglia della superficie: il fondo delle valli e' −De, l'altopiano tende a 0 */
var G = P.griglia(96, 0.5, 2.9);
ok('griglia: il minimo e\' il fondo della valle −De (entro 0,01 eV)', G.min.toFixed(4), Math.abs(G.min + P.De) < 0.01);
/* le curve di livello: ogni punto trovato ha davvero la quota del livello (interpolazione lineare, errore piccolo) */
var sg = P.livelli(G, [-4.5, -4, -3.5]), e = 0;
sg.forEach(function (q) { var r1 = 0.5 + 2.4 * q[0] / 96, r2 = 0.5 + 2.4 * q[1] / 96; e = Math.max(e, Math.abs(P.V(r1, r2) - q[2])); });
ok('curve di livello: V nei punti trovati = quota (errore massimo)', e.toFixed(4) + ' eV su ' + sg.length + ' punti', sg.length > 100 && e < 0.03);
/* la pallina non supera mai il velo dell'energia totale */
var tr = P.traiettoria(0.6, 0, 0.3, { ogni: 3 }), sopra = 0;
tr.punti.forEach(function (p) { sopra = Math.max(sopra, P.V(p[0], p[1]) - tr.E0); });
ok('la traiettoria resta sotto l\'energia totale (V − E ≤ 0)', sopra.toExponential(2) + ' eV, esito ' + tr.esito, sopra <= 1e-3 && tr.esito === 'reattiva');

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
