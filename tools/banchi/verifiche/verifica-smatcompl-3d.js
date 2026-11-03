// verifica della scheda 3D «sfera di Riemann» di F.calcolo.complessi (v238): proiezione stereografica, cerchi
// in cerchi, conformita', rotazioni della sfera = trasformazioni di Möbius di SU(2)
const C = require('./carica.js')(['bsi-mat-cas.js', 'bsi-mat-complessi.js']);
const K = C.complessi, Z = K.Z; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// 1. punti noti: 0 → polo sud, 1 → (1, 0, 0), i → (0, 1, 0), |z| = 1 sull'equatore, |z| grande verso N
{ const s0 = K.stereo([0, 0]), s1 = K.stereo([1, 0]), si = K.stereo([0, 1]), se = K.stereo([Math.cos(1), Math.sin(1)]), sg = K.stereo([1e6, 0]);
  prova('0 → S, 1 → (1,0,0), i → (0,1,0), |z| = 1 → equatore, 10⁶ → N', [s0, s1, si].map(p => p.join(',')).join(' | ') + ' | ' + se[2] + ' | ' + sg[2].toFixed(9), d3(s0, [0, 0, -1]) === 0 && d3(s1, [1, 0, 0]) < 1e-15 && d3(si, [0, 1, 0]) < 1e-15 && Math.abs(se[2]) < 1e-15 && Math.abs(sg[2] - 1) < 1e-9); }
// 2. l'immagine sta sulla sfera e l'inversa riporta al punto di partenza
{ let m = 0, mi = 0; for (let k = 0; k < 200; k++) { const z = [Math.sin(k) * 3, Math.cos(1.7 * k) * 3], P = K.stereo(z), w = K.stereoInv(P); m = Math.max(m, Math.abs(Math.hypot(...P) - 1)); mi = Math.max(mi, Math.hypot(w[0] - z[0], w[1] - z[1])); }
  prova('|P| = 1 e stereo⁻¹(stereo(z)) = z (200 punti)', m.toExponential(1) + ', ' + mi.toExponential(1), m < 1e-15 && mi < 1e-13); }
// 3. cerchi e rette del piano → curve piane sulla sfera (cerchi); le rette passano per N
{ const F1 = K.figure('cerchio', [0.7, -0.4], [2, 0.3])[0], F2 = K.figure('retta', [-1, 1], [2, 0])[0], P1 = [], P2 = []; for (let i = 0; i < 50; i++) { P1.push(K.stereo(F1.f(i / 50))); P2.push(K.stereo(F2.f(0.02 + 0.96 * i / 49))); }
  const c1 = K.complanarita(P1), c2 = K.complanarita(P2.concat([[0, 0, 1]]));
  prova('cerchio → cerchio sulla sfera; retta → cerchio per N (scarto dal piano)', c1.toExponential(1) + ', ' + c2.toExponential(1), c1 < 1e-12 && c2 < 1e-12); }
// 4. conformita': l'angolo fra due rette del piano si conserva sulla sfera
{ const z0 = [0.6, 0.8], a = 0.3, b = 1.4, h = 1e-6, tg = th => { const p = K.stereo(z0), q = K.stereo([z0[0] + h * Math.cos(th), z0[1] + h * Math.sin(th)]); return [q[0] - p[0], q[1] - p[1], q[2] - p[2]]; }, u = tg(a), v = tg(b), ang = Math.acos((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v)));
  prova('angolo di 1,1 rad conservato dalla proiezione', ang.toFixed(6), Math.abs(ang - (b - a)) < 1e-5); }
// 5. rotazione della sfera = Möbius: per assi diversi e angoli diversi, stereo(f(z)) = R·stereo(z)
{ let m = 0; [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.48, 0.6, 0.64]].forEach(n => [0.3, 1.2, 2.9].forEach(th => { const M = K.mobiusRotazione(n, th); for (let k = 0; k < 30; k++) { const z = [Math.sin(3 * k) * 2, Math.cos(5 * k) * 2], w = K.applicaMobius(M, z); m = Math.max(m, d3(K.stereo(w), K.ruota3(n, th, K.stereo(z)))); } }));
  prova('rotazioni (4 assi × 3 angoli × 30 punti) = Möbius di SU(2), scarto max', m.toExponential(1), m < 1e-12); }
// 6. la matrice e' in SU(2): ad − bc = 1 e d = ā; la rotazione attorno all'asse z e' f(z) = e^(iθ)z
{ const M = K.mobiusRotazione([0.48, 0.6, 0.64], 1.1), det = Z.add(Z.mul(M.a, M.d), Z.mul([-1, 0], Z.mul(M.b, M.c))), Mz = K.mobiusRotazione([0, 0, 1], 0.9), w = K.applicaMobius(Mz, [2, 1]), e = Z.mul(Z.exp([0, 0.9]), [2, 1]);
  prova('det = 1, d = ā, asse z: f(z) = e^(iθ)z', det.map(x => x.toFixed(12)).join(',') + ' · ' + Math.hypot(w[0] - e[0], w[1] - e[1]).toExponential(1), Math.abs(det[0] - 1) < 1e-14 && Math.abs(det[1]) < 1e-14 && M.d[0] === M.a[0] && M.d[1] === -M.a[1] && Math.hypot(w[0] - e[0], w[1] - e[1]) < 1e-14); }
// 7. rotazione di π attorno all'asse reale: f(z) = 1/z (scambia 0 e ∞, fissa ±1)
{ const M = K.mobiusRotazione([1, 0, 0], Math.PI), w = K.applicaMobius(M, [0.3, 0.4]), inv = Z.div([1, 0], [0.3, 0.4]), w0 = K.applicaMobius(M, [0, 0]);
  prova('rotazione di π attorno a x: f(z) = 1/z, f(0) = ∞', Math.hypot(w[0] - inv[0], w[1] - inv[1]).toExponential(1) + ' · ' + w0, Math.hypot(w[0] - inv[0], w[1] - inv[1]) < 1e-14 && w0 === null); }

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
