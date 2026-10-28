/* verifica di bsi-astro-ondegrav.js (F.calcolo.ondegrav) */
var C = require('./carica.js')(['bsi-astro-ondegrav.js']), K = C.ondegrav;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var MS = K.MSOLE;

/* 1. massa di chirp */
var Mc = K.massaChirp(36 * MS, 29 * MS) / MS;
ok('massa di chirp di GW150914 (36 + 29 M☉) ≈ 28,1 M☉', Mc.toFixed(3), Math.abs(Mc - 28.1) < 0.1);
var eta = 36 * 29 / (65 * 65), Mc2 = Math.pow(eta, 0.6) * 65;
ok('ℳ = η^(3/5) M (secondo modo di scriverla)', Mc2.toFixed(6) + ' vs ' + Mc.toFixed(6), Math.abs(Mc2 - Mc) < 1e-9);
ok('masse uguali: ℳ = M/2^(6/5) = 0,4353 M', (K.massaChirp(MS, MS) / (2 * MS)).toFixed(6), Math.abs(K.massaChirp(MS, MS) / (2 * MS) - Math.pow(2, -1.2)) < 1e-12);

/* 2. f(t): legge di potenza, inversione, fase */
var M = K.massaChirp(36 * MS, 29 * MS), t1 = 0.1, t2 = 0.001, sl = Math.log(K.frequenza(M, t2) / K.frequenza(M, t1)) / Math.log(t2 / t1);
ok('f ∝ (t_c − t)^(−3/8): pendenza log-log', sl.toFixed(8), Math.abs(sl + 0.375) < 1e-12);
var f = 50, tau = K.tempoDaFrequenza(M, f);
ok('τ(f) inverte f(τ)', K.frequenza(M, tau).toFixed(10) + ' Hz', Math.abs(K.frequenza(M, tau) - 50) < 1e-9);
var h = 1e-7, fn = (K.fase(M, tau - h) - K.fase(M, tau + h)) / (2 * h) / (2 * Math.PI);
ok('dΦ/dt = 2πf (derivata numerica della fase)', fn.toFixed(6) + ' Hz', Math.abs(fn - 50) < 1e-4);
var fp = (K.frequenza(M, tau - 1e-6) - K.frequenza(M, tau + 1e-6)) / 2e-6;
ok('ḟ formula = derivata numerica', K.fpunto(M, 50).toFixed(4) + ' vs ' + fp.toFixed(4), Math.abs(K.fpunto(M, 50) / fp - 1) < 1e-6);
ok('ℳ ricavata da f e ḟ (come fanno i rivelatori)', (K.chirpDaFFpunto(50, K.fpunto(M, 50)) / MS).toFixed(6), Math.abs(K.chirpDaFFpunto(50, K.fpunto(M, 50)) / M - 1) < 1e-10);
ok('GW150914: da 35 Hz alla coalescenza ~0,2 s', K.tempoDaFrequenza(M, 35).toFixed(4) + ' s', Math.abs(K.tempoDaFrequenza(M, 35) - 0.2) < 0.05);

/* 3. decadimento orbitale */
var m1 = 1.4 * MS, m2 = 1.4 * MS, a0 = 1e9, T1 = K.tempoCoalescenza(m1, m2, a0), T2 = K.tempoCoalescenzaNumerico(m1, m2, a0);
ok('tempo di coalescenza (Peters) = integrazione di da/dt', (T1 / K.ANNO).toExponential(5) + ' vs ' + (T2 / K.ANNO).toExponential(5) + ' anni', Math.abs(T1 / T2 - 1) < 1e-6);
var aF = K.separazione(65 * MS, 50), Tf = K.tempoCoalescenza(36 * MS, 29 * MS, aF);
ok('Peters a(f) di Keplero = τ(f) del chirp (stesso tempo per due vie)', Tf.toFixed(6) + ' vs ' + K.tempoDaFrequenza(M, 50).toFixed(6) + ' s', Math.abs(Tf / K.tempoDaFrequenza(M, 50) - 1) < 1e-9);
var aa = 3e8, dE = (K.energiaOrbitale(m1, m2, aa * (1 + 1e-6)) - K.energiaOrbitale(m1, m2, aa * (1 - 1e-6))) / (2e-6 * aa);
ok('bilancio: dE/da · da/dt = −P (quadrupolo)', (dE * K.dadt(m1, m2, aa)).toExponential(6) + ' vs ' + (-K.potenza(m1, m2, aa)).toExponential(6), Math.abs(dE * K.dadt(m1, m2, aa) / -K.potenza(m1, m2, aa) - 1) < 1e-6);

/* 4. GW150914 */
var s = K.segnale(36, 29, 410, 30, 12);
ok('GW150914: picco ~150 Hz', s.fPicco.toFixed(1) + ' Hz', Math.abs(s.fPicco - 150) < 15);
ok('GW150914: strain di picco ~10⁻²¹ a 410 Mpc (newtoniano, di faccia)', s.hPicco.toExponential(2), s.hPicco > 0.5e-21 && s.hPicco < 3e-21);
ok('buco nero finale (0,95 M, a = 0,67): f_ring ≈ 250-290 Hz, τ ≈ 4 ms', s.ring.f.toFixed(1) + ' Hz, ' + (s.ring.tau * 1e3).toFixed(2) + ' ms', s.ring.f > 240 && s.ring.f < 300 && Math.abs(s.ring.tau - 0.004) < 0.001);
var sb = K.segnale(1.46, 1.27, 40, 30, 24), Mb = sb.Mc, cicli = (K.fase(Mb, K.tempoDaFrequenza(Mb, sb.fPicco)) - K.fase(Mb, K.tempoDaFrequenza(Mb, 30))) / (2 * Math.PI), zeri = 0;
for (i = 1; i < sb.h.length; i++) if (sb.t[i] < 0 && sb.h[i - 1] < 0 && sb.h[i] >= 0) zeri++;
ok('GW170817 da 30 Hz: ~2·10³ cicli (dalla fase); gli ultimi 120 risolti nella forma d’onda', cicli.toFixed(0) + ' cicli in ' + sb.durata.toFixed(1) + ' s; ' + zeri + ' passaggi per zero campionati', cicli > 1500 && cicli < 3500 && Math.abs(zeri - 120) <= 2);
var i;
var fi = K.fISCO(MS);
ok('f_ISCO = 4,4 kHz × M☉/M', fi.toFixed(1) + ' Hz', Math.abs(fi - 4397) < 5);
var lc = Math.log(K.ampiezza(M, 200, 1e25) / K.ampiezza(M, 100, 1e25)) / Math.log(2), ld = K.ampiezza(M, 100, 1e25) / K.ampiezza(M, 100, 2e25);
ok('h ∝ f^(2/3) / d', lc.toFixed(10) + ', ' + ld.toFixed(10), Math.abs(lc - 2 / 3) < 1e-12 && Math.abs(ld - 2) < 1e-12);

/* 5. risposta direzionale */
var a0f = K.antenna(0, 0, 0);
ok('sorgente sulla verticale: F₊ = 1, F× = 0, F₊² + F×² = 1 (massimo)', a0f.piu + ', ' + a0f.croce + ', ' + K.antenna2(0, 0), a0f.piu === 1 && a0f.croce === 0 && K.antenna2(0, 0) === 1);
var mx = 0, sum = 0, Ns = 0, psiMax = 0;
for (var i = 0; i <= 180; i++) for (var j = 0; j < 360; j++) {
  var th = Math.PI * i / 180, ph = Math.PI * j / 180, v = K.antenna2(th, ph); mx = Math.max(mx, v); sum += v * Math.sin(th); Ns += Math.sin(th);
  if (j % 30 === 0 && i % 15 === 0) { var r = K.antenna(th, ph, 0.7); psiMax = Math.max(psiMax, Math.abs(r.piu * r.piu + r.croce * r.croce - v)); }
}
ok('il massimo su tutto il cielo è 1', mx.toFixed(12), Math.abs(mx - 1) < 1e-12);
ok('F₊² + F×² non dipende da ψ', psiMax.toExponential(1), psiMax < 1e-12);
ok('media sul cielo ⟨F₊² + F×²⟩ = 2/5', (sum / Ns).toFixed(5), Math.abs(sum / Ns - 0.4) < 1e-3);
ok('punti ciechi nel piano a 45° dai bracci', K.antenna2(Math.PI / 2, Math.PI / 4).toExponential(1), K.antenna2(Math.PI / 2, Math.PI / 4) < 1e-30);

/* 6. Hulse-Taylor */
var H = K.HT, Pd = K.pbDot(H.Pb, H.e, H.mp, H.mc);
ok('f(e = 0,617) = 11,86', K.fEcc(H.e).toFixed(3), Math.abs(K.fEcc(H.e) - 11.86) < 0.02);
ok('Ṗ_b di PSR B1913+16 ≈ −2,40·10⁻¹² (Peters-Mathews)', Pd.toExponential(4), Math.abs(Pd + 2.40e-12) < 0.02e-12);
ok('e il rapporto con il valore osservato ≈ 1,00', (H.osservato / Pd).toFixed(4), Math.abs(H.osservato / Pd - 1) < 0.02);
var nOrb = Math.floor(30 * K.ANNO / H.Pb), sh1 = K.spostamento(nOrb * H.Pb, H.Pb, Pd), sh2 = K.spostamentoSomma(nOrb, H.Pb, Pd);
ok('spostamento del periastro in 30 anni: parabola = somma orbita per orbita (~−39 s)', sh1.toFixed(3) + ' vs ' + sh2.toFixed(3) + ' s', Math.abs(sh1 - sh2) < 0.01 * Math.abs(sh1) && sh1 < -35 && sh1 > -45);
var wd = K.omegaPunto(H.Pb, H.e, H.mp + H.mc) * K.ANNO * 180 / Math.PI;
ok('avanzamento del periastro ≈ 4,23°/anno con le stesse masse', wd.toFixed(4), Math.abs(wd - 4.2266) < 0.01);
var E = K.keplero(1.3, 0.617);
ok('equazione di Keplero risolta', (E - 0.617 * Math.sin(E) - 1.3).toExponential(1), Math.abs(E - 0.617 * Math.sin(E) - 1.3) < 1e-13);

console.log(n - ko + ' superati, ' + ko + ' falliti');
process.exit(ko > 0 ? 1 : 0);
