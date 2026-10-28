/* verifica di bsi-astro-esopianeti.js (F.calcolo.esopianeti) contro valori noti, forme chiuse e metodi indipendenti */
'use strict';
var C = require('./carica.js')(['bsi-astro-esopianeti.js']).esopianeti;
var ok = 0, ko = 0;
function chk(nome, cond, val) { if (cond) ok++; else ko++; console.log((cond ? '  ok ' : '  KO ') + nome + (val !== undefined ? '  → ' + val : '')); }
var K = C.costanti;

/* 1. stella e zona abitabile */
var sole = C.stella(1);
chk('il Sole dalla relazione massa-luminosità: L = 1, R = 1, T = 5772 K, classe G', sole.L === 1 && sole.R === 1 && Math.abs(sole.T - 5772) < 1e-9 && sole.classe === 'G', sole.T);
var za = C.zonaAbitabile(1);
chk('zona abitabile del Sole (1.1 e 0.36 S⊕) = 0.95–1.67 UA', Math.abs(za.interno - 0.953) < 0.001 && Math.abs(za.esterno - 1.667) < 0.001, za.interno.toFixed(4) + '–' + za.esterno.toFixed(4) + ' UA');
chk('flusso ai bordi = 1.1 e 0.36 S⊕ (L/d²)', Math.abs(C.flusso(1, za.interno) - 1.1) < 1e-12 && Math.abs(C.flusso(1, za.esterno) - 0.36) < 1e-12);
var zm = C.zonaAbitabile(C.stella(0.15).L);
chk('nana M5 (0.15 M☉): zona abitabile entro ~0.1 UA', zm.esterno < 0.15 && zm.interno > 0.02, zm.interno.toFixed(4) + '–' + zm.esterno.toFixed(4) + ' UA');
chk('T_eq della Terra (A = 0.3) ≈ 255 K', Math.abs(C.tEquilibrio(1, 1, 0.3) - 255) < 1.5, C.tEquilibrio(1, 1, 0.3).toFixed(1) + ' K');
/* T_eq da bilancio energetico indipendente: σT⁴ = L(1−A)/(16πd²σ) */
var Lsun = 3.828e26, sig = 5.670374419e-8, Tb = Math.pow(Lsun * 0.7 / (16 * Math.PI * Math.pow(K.UA, 2) * sig), 0.25);
chk('278.6 K·L^¼(1−A)^¼/√d = bilancio σT⁴ = L(1−A)/(16πd²)', Math.abs(C.tEquilibrio(1, 1, 0.3) / Tb - 1) < 2e-3, Tb.toFixed(2) + ' K');
chk('terza legge: P(1 UA, 1 M☉) = 1 anno; P(5.2 UA) = 11.86 anni', Math.abs(C.periodo(1, 1) - 1) < 1e-12 && Math.abs(C.periodo(5.2026, 1, K.MGIOVE) - 11.86) < 0.01, C.periodo(5.2026, 1, K.MGIOVE).toFixed(3));

/* 2. transito */
chk('profondità di un disco uniforme = k² (area)', Math.abs(1 - C.flussoTransito(0, 0.1, 0, 0, 4000) - 0.01) < 1e-6, (1 - C.flussoTransito(0, 0.1, 0, 0, 4000)).toFixed(7));
var dmax = 0; [[0.5, 0.1], [0.95, 0.1], [1.05, 0.1], [0.3, 0.25], [0.9, 0.3]].forEach(function (c) { dmax = Math.max(dmax, Math.abs((1 - C.flussoTransito(c[0], c[1], 0, 0, 4000)) - C.areaSovrapposizione(c[0], c[1]) / Math.PI)); });
chk('sorgente uniforme: integrazione sugli anelli = area della lente (forma chiusa), anche al bordo', dmax < 2e-5, dmax.toExponential(2));
var u1 = 0.45, u2 = 0.2, k = 0.05, d0 = 1 - C.flussoTransito(0, k, u1, u2, 4000), dp = k * k * 1 / (1 - u1 / 3 - u2 / 6);
chk('con oscuramento: profondità centrale ≈ k² I(1)/⟨I⟩ (pianeta piccolo)', Math.abs(d0 / dp - 1) < 2e-3, (d0 * 1e6).toFixed(1) + ' vs ' + (dp * 1e6).toFixed(1) + ' ppm');
/* normalizzazione: flusso totale ∫ I 2πr dr = π(1 − u1/3 − u2/6) — con un «pianeta» che copre tutta la stella si ottiene 0 */
chk('un disco opaco più grande della stella la spegne del tutto (normalizzazione)', Math.abs(C.flussoTransito(0, 1.5, u1, u2, 4000)) < 1e-5, C.flussoTransito(0, 1.5, u1, u2, 4000).toExponential(2));
var P = 3.5, aRs = 10, inc = 88.5, T14 = C.durataT14(P, aRs, 0.1, inc), T14n = C.durataNumerica(P, aRs, 0.1, inc);
chk('durata T₁₄: formula vs corda numerica (bisezione sulla separazione proiettata)', Math.abs(T14 / T14n - 1) < 1e-9, (T14 * 24).toFixed(5) + ' h vs ' + (T14n * 24).toFixed(5) + ' h');
var Tc = C.durataT14(365.25, 215.03, 0.00917, 90);
chk('transito della Terra visto da lontano: T₁₄ ≈ 13 h', Math.abs(Tc * 24 - 13.0) < 0.2, (Tc * 24).toFixed(2) + ' h');
chk('profondità della Terra sul Sole ≈ 84 ppm, di Giove ≈ 1 %', Math.abs(Math.pow(K.RTERRA / K.RSOLE, 2) * 1e6 - 84) < 1 && Math.abs(Math.pow(K.RGIOVE / K.RSOLE, 2) - 0.0106) < 3e-4, (Math.pow(K.RTERRA / K.RSOLE, 2) * 1e6).toFixed(1) + ' ppm, ' + (Math.pow(K.RGIOVE / K.RSOLE, 2) * 100).toFixed(3) + ' %');
chk('radente: b > 1 + k → nessun transito; T₂₃ = 0 se b > 1 − k', C.durataT14(P, aRs, 0.1, 83) === 0 && C.durataT23(P, aRs, 0.1, 84.3) === 0 && C.durataT23(P, aRs, 0.1, 89) > 0);
var cl = C.curvaLuce(P, aRs, 0.1, 89.5, u1, u2, 200), mn = Math.min.apply(null, cl.f), simm = Math.abs(cl.f[20] - cl.f[180]);
chk('curva di luce simmetrica e con il minimo al centro', simm < 1e-12 && cl.f[100] === mn, mn.toFixed(6));

/* 3. velocita' radiale */
var Kj = C.semiampiezzaK(4332.59, K.MGIOVE, K.MSOLE, 0.0489, 90), Ke = C.semiampiezzaK(365.256, K.MTERRA, K.MSOLE, 0.0167, 90);
chk('K di Giove sul Sole ≈ 12.5 m/s', Math.abs(Kj - 12.5) < 0.1, Kj.toFixed(3) + ' m/s');
chk('K della Terra sul Sole ≈ 0.09 m/s', Math.abs(Ke - 0.0895) < 0.001, Ke.toFixed(4) + ' m/s');
chk('costante 28.43 m/s (1 M_J, 1 anno, 1 M☉, m_p ≪ M)', Math.abs(C.semiampiezzaK(365.25, K.MGIOVE * 1e-6, K.MSOLE, 0, 90) * 1e6 - 28.43) < 0.05, (C.semiampiezzaK(365.25, K.MGIOVE * 1e-6, K.MSOLE, 0, 90) * 1e6).toFixed(3));
/* secondo metodo: derivata numerica della posizione della stella lungo la linea di vista */
var e = 0.5, w = 60, Kx = C.semiampiezzaK(100, 3 * K.MGIOVE, K.MSOLE, e, 70), dv = 0, vmin = 1e9, vmax = -1e9;
for (var j = 0; j < 400; j++) { var f = j / 400, a1 = C.velocitaRadiale(f, Kx, e, w), a2 = C.vrNumerica(f, 100, 3 * K.MGIOVE, K.MSOLE, e, w, 70); dv = Math.max(dv, Math.abs(a1 - a2)); vmin = Math.min(vmin, a2); vmax = Math.max(vmax, a2); }
chk('v_r = K[cos(ν+ω) + e cos ω] = derivata numerica dell’orbita (e = 0.5, i = 70°)', dv / Kx < 1e-5, (dv / Kx).toExponential(2));
chk('semiampiezza (max − min)/2 dall’orbita = K', Math.abs((vmax - vmin) / 2 / Kx - 1) < 1e-3, ((vmax - vmin) / 2).toFixed(4) + ' vs ' + Kx.toFixed(4) + ' m/s');
var media = 0; for (j = 0; j < 20000; j++) media += C.velocitaRadiale(j / 20000, 1, 0.7, 123); media /= 20000;
chk('media temporale di v_r = 0 (orbita chiusa), anche con e = 0.7', Math.abs(media) < 1e-4, media.toExponential(2));
var Em = C.kepler(2.0, 0.95);
chk('equazione di Keplero con e = 0.95', Math.abs(Em - 0.95 * Math.sin(Em) - 2.0) < 1e-12, Em.toFixed(10));

/* 4. astrometria e immagine diretta */
var al = C.oscillazioneAstrometrica(K.MGIOVE, K.MSOLE, 5.2, 10);
chk('oscillazione astrometrica di un Giove a 10 pc ≈ 0.5 mas', Math.abs(al * 1000 - 0.497) < 0.01, (al * 1000).toFixed(3) + ' mas');
var cj = C.contrasto(0.5, K.RGIOVE, 5.2), ce = C.contrasto(0.3, K.RTERRA, 1);
chk('contrasto in luce riflessa: Giove ~10⁻⁹, Terra ~10⁻¹⁰', cj > 1e-9 && cj < 1e-8 && ce > 1e-10 && ce < 1e-9, cj.toExponential(2) + ', ' + ce.toExponential(2));
var tr = C.tracciaCielo(1, 400, 10, [0, 0], 0, K.MSOLE, 5.2, 11.86, false);
chk('parallasse a 10 pc: semiasse della traccia = 100 mas', Math.abs(Math.max.apply(null, tr.x) - 100) < 0.01, Math.max.apply(null, tr.x).toFixed(3));
var pop = C.popolazione(2024), pop2 = C.popolazione(2024);
chk('popolazione illustrativa riproducibile (mulberry32), con i quattro metodi', pop.length === pop2.length && pop.every(function (p, i) { return p.P === pop2[i].P && p.M === pop2[i].M; }) && ['transito', 'vr', 'immagine', 'microlente'].every(function (m) { return pop.some(function (p) { return p.met === m; }); }), pop.length + ' pianeti');

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
