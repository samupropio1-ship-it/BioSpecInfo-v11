/* verifica della scheda 3D di bsi-chi-equilibrio.js (v238): equilibrio con l'algoritmo di Gillespie, K misurata contro K teorica */
var Q = require('./carica.js')(['bsi-chi-equilibrio.js']).equilibrio;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* propensioni: all'equilibrio deterministico (grandi numeri) le due velocita' si uguagliano */
var R = Q.REAZIONI.haber, K = Q.costante(R, R.T).K, Om = 1e6, ce = Q.equilibrio(R, R.c0, K).c, a = Q.propensioni(R, ce.map(function (c) { return Math.round(c * Om); }), Om, 1, K);
ok('Haber, Ω = 10⁶: a→ = a← all\'equilibrio deterministico (entro 10⁻⁴)', (a[0] / a[1]).toFixed(6), Math.abs(a[0] / a[1] - 1) < 1e-4);
/* A ⇌ B: la distribuzione stazionaria e' binomiale, ⟨N_B⟩/⟨N_A⟩ = K esattamente */
var I = Q.ISOMERO, KI = Q.costante(I, 298).K, G = Q.gillespie(I, [240, 0], 240, 0.6, KI, 7919);
Q.avanzaSSA(G, 20); Q.iniziaMedia(G); Q.avanzaSSA(G, 20000); var c = Q.concMedie(G);
var pB = KI / (1 + KI);
ok('A ⇌ B: ⟨c_B⟩ = K/(1+K) (media su 20000 unita\' di tempo, entro lo 0,5 %)', c[1].toFixed(5) + ' vs ' + pB.toFixed(5), Math.abs(c[1] / pB - 1) < 0.005);
ok('A ⇌ B: K misurata ⟨c_B⟩/⟨c_A⟩ = K teorica entro l\'1,5 %', (c[1] / c[0]).toFixed(4) + ' vs ' + KI.toFixed(4), Math.abs(c[1] / c[0] / KI - 1) < 0.015);
/* conservazione: ogni evento rispetta la stechiometria (atomi di N e H in Haber) */
var H = Q.gillespie(R, [60, 180, 0], 60, 1, K, 5), N0 = 2 * 60 + 0, H0 = 2 * 180;
Q.avanzaSSA(H, 50);
ok('Haber: atomi conservati (N = 2N₂ + NH₃, H = 2H₂ + 3NH₃) dopo ' + H.contati + ' reazioni', (2 * H.N[0] + H.N[2]) + ' N, ' + (2 * H.N[1] + 3 * H.N[2]) + ' H', 2 * H.N[0] + H.N[2] === N0 && 2 * H.N[1] + 3 * H.N[2] === H0 && H.contati > 100);
/* N₂O₄ ⇌ 2NO₂ con 240 molecole: le medie seguono l'equilibrio deterministico e Q(⟨c⟩) ≈ K a meno di O(1/N) */
var R2 = Q.REAZIONI.n2o4, K2 = Q.costante(R2, R2.T).K, G2 = Q.gillespie(R2, [240, 0], 240, 0.6, K2, 7);
Q.avanzaSSA(G2, 20); Q.iniziaMedia(G2); Q.avanzaSSA(G2, 4000); var c2 = Q.concMedie(G2), e2 = Q.equilibrio(R2, [1, 0], K2).c;
ok('N₂O₄ ⇌ 2NO₂: ⟨c⟩ = equilibrio deterministico entro il 2 %', c2.map(function (x) { return x.toFixed(4); }).join(', ') + ' vs ' + e2.map(function (x) { return x.toFixed(4); }).join(', '), Math.abs(c2[0] / e2[0] - 1) < 0.02 && Math.abs(c2[1] / e2[1] - 1) < 0.02);
ok('N₂O₄ ⇌ 2NO₂: K misurata = Q(⟨c⟩) = K teorica entro il 5 %', Q.quoziente(R2, c2).toFixed(4) + ' vs ' + K2.toFixed(4), Math.abs(Q.quoziente(R2, c2) / K2 - 1) < 0.05);
/* Le Chatelier sui numeri: dimezzando il volume (Ω/2) la dissociazione (Δn = +1) arretra */
var G3 = Q.gillespie(R2, G2.N.slice(), 120, 0.6, K2, 9); Q.avanzaSSA(G3, 20); Q.iniziaMedia(G3); Q.avanzaSSA(G3, 3000); var c3 = Q.concMedie(G3);
var gr2 = c2[1] / 2 / (c2[0] + c2[1] / 2), gr3 = c3[1] / 2 / (c3[0] + c3[1] / 2);
ok('volume ÷ 2: il grado di dissociazione cala (Le Chatelier)', gr2.toFixed(3) + ' → ' + gr3.toFixed(3), gr3 < gr2 - 0.03);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
