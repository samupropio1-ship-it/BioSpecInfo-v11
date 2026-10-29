// verifica di F.calcolo.markov contro forme chiuse, metodi indipendenti e simulazioni
const C = require('./carica.js')(['bsi-mat-markov.js']);
const M = C.markov;
let ok = 0, ko = 0;
function chk(nome, val, atteso, tol) { const p = Math.abs(val - atteso) <= tol; p ? ok++ : ko++; console.log((p ? 'OK ' : 'KO ') + nome + ': ' + val + ' (atteso ' + atteso + ' ± ' + tol + ')'); }
function vero(nome, c, det) { c ? ok++ : ko++; console.log((c ? 'OK ' : 'KO ') + nome + (det ? ' — ' + det : '')); }
const s1 = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);

// ── catene ──
const Pm = M.PRESET.meteo.P;
const pl = M.stazionariaLineare(Pm), pp = M.stazionariaPotenze(Pm, 0, 1e-15, 5000);
chk('meteo: π potenze vs sistema lineare', s1(pl, pp.pi), 0, 1e-12);
chk('meteo: πP = π', s1(M.vettMat(pl, Pm), pl), 0, 1e-14);
// meteo a mano: π = (0.4594…) — soluzione esatta razionale (23/50? ) verificata con Cramer
(function () { const P = Pm; // π0 = 0.7π0+0.3π1+0.2π2, π1 = 0.2π0+0.4π1+0.4π2, somma 1
  // da sistema 2x2 risolto a mano: −0.3π0 + 0.3π1 + 0.2π2 = 0, 0.2π0 − 0.6π1 + 0.4π2 = 0, π2 = 1 − π0 − π1
  const a11 = -0.3 - 0.2, a12 = 0.3 - 0.2, b1 = -0.2, a21 = 0.2 - 0.4, a22 = -0.6 - 0.4, b2 = -0.4, det = a11 * a22 - a12 * a21;
  const p0 = (b1 * a22 - a12 * b2) / det, p1 = (a11 * b2 - b1 * a21) / det;
  chk('meteo: π₀ con la regola di Cramer (metodo indipendente)', pl[0], p0, 1e-14); chk('meteo: π₁ con Cramer', pl[1], p1, 1e-14); void P; })();
const Pe = M.PRESET.ehrenfest.P, pe = M.stazionariaLineare(Pe), bin = [1, 4, 6, 4, 1].map(v => v / 16);
chk('Ehrenfest: π = binomiale C(4,i)/16', s1(pe, bin), 0, 1e-14);
(function () { let m = 0; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) m = Math.max(m, Math.abs(pe[i] * Pe[i][j] - pe[j] * Pe[j][i])); chk('Ehrenfest: bilancio dettagliato π_i P_ij = π_j P_ji', m, 0, 1e-15); })();
chk('Ehrenfest: periodo 2', M.periodo(Pe), 2, 0);
vero('Ehrenfest: il metodo delle potenze da uno stato non converge (periodica)', !M.stazionariaPotenze(Pe, 0, 1e-13, 2000).converge);
chk('rotazione a 3: periodo 3', M.periodo(M.PRESET.rotazione.P), 3, 0);
chk('meteo: aperiodica (periodo 1)', M.periodo(Pm), 1, 0);
vero('irriducibilità: meteo sì, catena con stato assorbente no', M.irriducibile(Pm) && !M.irriducibile([[1, 0], [0.5, 0.5]]));
// autovalori
(function () {
  const P = M.matriceCasuale(6, 13), L = M.autovalori(P), tr = P.reduce((s, r, i) => s + r[i], 0);
  let sre = 0, sim = 0, pr = [1, 0]; L.forEach(z => { sre += z[0]; sim += z[1]; pr = [pr[0] * z[0] - pr[1] * z[1], pr[0] * z[1] + pr[1] * z[0]]; });
  chk('6×6 casuale: λ₁ = 1 (stocastica)', Math.hypot(L[0][0] - 1, L[0][1]), 0, 1e-10);
  chk('6×6: Σλ = traccia', Math.hypot(sre - tr, sim), 0, 1e-10);
  chk('6×6: Πλ = det (eliminazione di Gauss)', Math.hypot(pr[0] - M.determinante(P), pr[1]), 0, 1e-10);
  // |λ₂| contro il tasso di convergenza misurato del metodo delle potenze
  const pi = M.stazionariaLineare(P); let v = [1, 0, 0, 0, 0, 0], e = []; for (let k = 0; k < 60; k++) { e.push(s1(v, pi)); v = M.vettMat(v, P); }
  const l2 = Math.hypot(L[1][0], L[1][1]), tasso = Math.pow(e[59] / e[39], 1 / 20);
  chk('|λ₂| = tasso di convergenza misurato di |π_k − π|', tasso, l2, 0.02 * l2 + 0.01); console.log('   |λ₂| = ' + l2.toFixed(5) + ', tasso = ' + tasso.toFixed(5));
  const Le = M.autovalori(Pe); vero('Ehrenfest: −1 è autovalore (periodo 2)', Le.some(z => Math.hypot(z[0] + 1, z[1]) < 1e-8));
  const ev = M.autovalori(Pe).map(z => z[0]).sort((a, b) => a - b); chk('Ehrenfest: autovalori 1 − 2k/4 = −1, −½, 0, ½, 1', s1(ev, [-1, -0.5, 0, 0.5, 1]), 0, 1e-8);
})();
// simulazione: frequenze → π, tempo di ritorno di Kac
(function () {
  const S = M.simulaCatena(Pm, 0, 400000, 1);
  chk('meteo: frequenze simulate (400 000 passi) → π', s1(S.freq, pl), 0, 0.01);
  chk('Kac: tempo medio di ritorno in 0 = 1/π₀', S.ritorno[0], 1 / pl[0], 0.03);
  const Se = M.simulaCatena(Pe, 0, 400000, 2); chk('Ehrenfest periodica: le frequenze tendono comunque a π (ergodico)', s1(Se.freq, bin), 0, 0.01);
})();

// ── PageRank ──
Object.keys(M.RETI).forEach(k => { const R = M.RETI[k], a = M.pagerankPotenze(R.n, R.archi, 0.85).r, b = M.pagerankLineare(R.n, R.archi, 0.85); chk('PageRank ' + k + ': potenze vs sistema lineare', s1(a, b), 0, 1e-12); });
(function () {
  const R = M.RETI.anello, r = M.pagerankLineare(R.n, R.archi, 0.85); chk('anello simmetrico: PageRank uniforme 1/n', Math.max(...r.map(v => Math.abs(v - 1 / 7))), 0, 1e-14);
  const Z = M.pagerankLineare(8, M.RETI.piccola.archi, 0); chk('d = 0: tutte le pagine valgono 1/n', Math.max(...Z.map(v => Math.abs(v - 1 / 8))), 0, 1e-14);
  const st = M.RETI.stella, rs = M.pagerankLineare(st.n, st.archi, 0.85), c = (1 + 0.85 * 5 * ((1 - 0.85) / 6) / 1) ;
  // stella: r₀ = (1−d)/n + d·5r_f, r_f = (1−d)/n + d r₀/5 → r₀ = [(1−d)/n](1+5d)/(1−d²)
  chk('stella: punteggio del centro in forma chiusa', rs[0], (0.15 / 6) * (1 + 5 * 0.85) / (1 - 0.85 * 0.85), 1e-14); void c;
  const G = M.matriceGoogle(8, M.RETI.piccola.archi, 0.85), L = M.autovalori(G); chk('|λ₂(G)| ≤ d = 0,85', Math.hypot(L[1][0], L[1][1]) <= 0.85 + 1e-9 ? 0 : 1, 0, 0);
  const sim = M.navigatore(8, M.RETI.piccola.archi, 0.85, 400000, 3), pr = M.pagerankLineare(8, M.RETI.piccola.archi, 0.85); chk('navigatore simulato (400 000 clic) vs PageRank', s1(sim, pr), 0, 0.01);
})();

// ── rovina del giocatore ──
(function () {
  let m = 0, me = 0; [[0.48, 20], [0.5, 10], [0.6, 15], [0.3, 7]].forEach(c => { const R = M.rovinaRicorsione(c[0], c[1]); for (let i = 0; i <= c[1]; i++) { m = Math.max(m, Math.abs(R.P[i] - M.probVittoria(c[0], i, c[1]))); me = Math.max(me, Math.abs(R.E[i] - M.durataAttesa(c[0], i, c[1]))); } });
  chk('P(vittoria): formula chiusa vs ricorrenza tridiagonale (Thomas)', m, 0, 1e-12);
  chk('durata media: formula vs ricorrenza', me, 0, 1e-9);
  chk('gioco equo: P = i/N (i = 3, N = 10)', M.probVittoria(0.5, 3, 10), 0.3, 1e-15);
  chk('gioco equo: durata i(N − i) = 21', M.durataAttesa(0.5, 3, 10), 21, 1e-12);
  const S = M.simulaRovina(0.48, 10, 20, 20000, 4), p = M.probVittoria(0.48, 10, 20);
  chk('simulazione 20 000 partite (p = 0,48, i = 10, N = 20) entro 3σ', S.pVittoria, p, 3 * Math.sqrt(p * (1 - p) / 20000)); console.log('   formula ' + p.toFixed(5) + ', simulazione ' + S.pVittoria.toFixed(5));
  chk('durata simulata vs formula (±3 %)', S.durata, M.durataAttesa(0.48, 10, 20), 0.03 * M.durataAttesa(0.48, 10, 20));
})();

// ── passeggiate ──
(function () {
  [1, 2, 3].forEach(d => { const R = M.msd(d, 4000, 400, 10 + d); chk('MSD ' + d + 'D a t = 400 → t (4000 camminatori, ±4σ)', R.msd[400], 400, 4 * 400 * Math.sqrt(2 / 4000) * (d === 1 ? 1 : 0.8)); });
  const R1 = M.msd(1, 5000, 1000, 77); chk('1D: ritorno entro 1000 passi, simulato vs 1 − C(1000,500)/2¹⁰⁰⁰', R1.ritorno, M.ritorno1D(1000), 0.01); console.log('   esatto ' + M.ritorno1D(1000).toFixed(5));
  chk('1D: P(ritorno entro 2 passi) = ½', M.ritorno1D(2), 0.5, 1e-15);
  chk('1D: P(ritorno entro 4 passi) = 1 − 6/16', M.ritorno1D(4), 1 - 6 / 16, 1e-15);
  const R3 = M.msd(3, 3000, 3000, 5); vero('3D transiente: ritorno entro 3000 passi poco sopra 0,34 e ben sotto 1', R3.ritorno > 0.3 && R3.ritorno < 0.4, 'simulato ' + R3.ritorno.toFixed(3) + ' (Pólya ∞: 0,3405)');
})();

// ── Poisson e M/M/1 ──
(function () {
  let s = 0; for (let k = 0; k < 60; k++) s += M.poissonPmf(k, 4); chk('Σ pmf di Poisson = 1', s, 1, 1e-12);
  const P = M.simulaPoisson(4, 20000, 9), n = P.conta.length; let me = 0, va = 0; for (const c of P.conta) me += c; me /= n; for (const c of P.conta) va += (c - me) ** 2; va /= n - 1;
  chk('Poisson simulato: media = λ = 4', me, 4, 0.06); chk('Poisson simulato: varianza = λ = 4', va, 4, 0.15);
  chk('attese esponenziali: media 1/λ', P.attese.reduce((a, b) => a + b, 0) / P.attese.length, 0.25, 0.005);
  const T = M.teoriaMM1(0.8, 1), S = M.simulaMM1(0.8, 1, 400000, 11);
  chk('M/M/1 ρ = 0,8: L simulato vs ρ/(1−ρ) = 4 (±5 %)', S.L, T.L, 0.05 * T.L);
  chk('M/M/1: W simulato vs 1/(μ−λ) = 5 (±5 %)', S.W, T.W, 0.05 * T.W);
  chk('legge di Little sul cammino simulato: L = λ_eff W', S.L, S.lamEff * S.W, 0.002 * S.L);
  chk('M/M/1: P(vuoto) = 1 − ρ', S.p0, T.p0, 0.01);
  const T2 = M.teoriaMM1(0.5, 1); chk('M/M/1 ρ = ½: L = 1, Lq = ½', T2.L + T2.Lq, 1.5, 1e-15);
})();

console.log(ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
