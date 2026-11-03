/* verifica della scheda 3D di bsi-chi-cinetica.js (v238): urti di sfere dure, energia lungo la linea dei centri, Arrhenius */
var K = require('./carica.js')(['bsi-chi-cinetica.js']).cinetica;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* partenza: nessuna sovrapposizione, quantita' di moto nulla, energia media (3/2)kT */
var G = K.gasUrti(300, 10, 0.18, 1.3, 7), sovr = 0, p = [0, 0, 0];
for (var i = 0; i < G.N; i++) { for (var c = 0; c < 3; c++) p[c] += G.v[3 * i + c]; for (var j = i + 1; j < G.N; j++) if (Math.hypot(G.x[3 * i] - G.x[3 * j], G.x[3 * i + 1] - G.x[3 * j + 1], G.x[3 * i + 2] - G.x[3 * j + 2]) < 2 * G.r) sovr++; }
ok('partenza: 300 sfere senza sovrapposizioni, Σp = 0, ⟨E⟩ = 3/2 kT', sovr + ', ' + Math.hypot(p[0], p[1], p[2]).toExponential(1) + ', ' + (K.energiaCin(G) / G.N / 1.95).toFixed(12), sovr === 0 && Math.hypot(p[0], p[1], p[2]) < 1e-10 && Math.abs(K.energiaCin(G) / G.N - 1.5 * 1.3) < 1e-12);
/* urti elastici e pareti riflettenti: energia conservata alla precisione della macchina */
var E0 = K.energiaCin(G); for (i = 0; i < 6000; i++) K.passoUrti(G, 0.01, 1e9);
ok('energia cinetica conservata dopo 6000 passi e ' + G.urti + ' urti', (K.energiaCin(G) / E0 - 1).toExponential(2), Math.abs(K.energiaCin(G) / E0 - 1) < 1e-10 && G.urti > 2000);
/* frequenza di urto: √2 nπd²⟨v⟩ (gas rarefatto: frazione di volume 0,7 %, correzione di Enskog ~2 %) */
var z = 2 * G.urti / G.N / G.t, zt = K.frequenzaUrti(300, 10, 0.18, 1.3);
ok('urti per molecola per unita\' di tempo = √2 nπd²⟨v⟩ (entro 8 %)', z.toFixed(4) + ' vs ' + zt.toFixed(4), Math.abs(z / zt - 1) < 0.08);
/* la frazione di urti con ½μv_n² ≥ E₀ e' e^(−E₀/kT): due soglie */
[[1, 1], [2.5, 1]].forEach(function (q, k) {
  var H = K.gasUrti(300, 10, 0.18, q[1], 11 + k); for (var s = 0; s < 30000; s++) K.passoUrti(H, 0.01, q[0] * q[1]);
  var f = H.sopra / H.urti, e = Math.exp(-q[0]), err = Math.sqrt(e * (1 - e) / H.urti);
  ok('frazione sopra soglia E₀/kT = ' + q[0] + ': misurata = e^(−E₀/kT) entro 3σ', f.toFixed(4) + ' vs ' + e.toFixed(4) + ' (σ ' + err.toFixed(4) + ', ' + H.urti + ' urti)', Math.abs(f - e) < 3 * err);
});
/* le reazioni: solo coppie A–B sopra soglia diventano C + D; A e B calano insieme */
var R = K.gasUrti(300, 10, 0.18, 1, 21); for (i = 0; i < 4000; i++) K.passoUrti(R, 0.01, 1.5);
var cnt = [0, 0, 0, 0]; for (i = 0; i < R.N; i++) cnt[R.sp[i]]++;
ok('reazioni A + B → C + D: C = D = reazioni, A + C = B + D = 150', cnt.join(',') + ' (' + R.reazioni + ' reazioni)', cnt[2] === R.reazioni && cnt[3] === R.reazioni && cnt[0] + cnt[2] === 150 && cnt[1] + cnt[3] === 150 && R.reazioni > 5);
/* raddoppiare T a parita' di soglia: il rapporto delle frazioni e' e^(E₀/kT₁ − E₀/kT₂) (Arrhenius) */
var A1 = K.gasUrti(300, 10, 0.18, 1, 31), A2 = K.gasUrti(300, 10, 0.18, 2, 32);
for (i = 0; i < 25000; i++) { K.passoUrti(A1, 0.01, 2); K.passoUrti(A2, 0.01, 2); }
var rap = (A2.sopra / A2.urti) / (A1.sopra / A1.urti);
ok('Arrhenius: frazione a 2T / frazione a T = e^(E₀/kT − E₀/2kT) = e¹ (entro 12 %)', rap.toFixed(3) + ' vs ' + Math.E.toFixed(3), Math.abs(rap / Math.E - 1) < 0.12);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
