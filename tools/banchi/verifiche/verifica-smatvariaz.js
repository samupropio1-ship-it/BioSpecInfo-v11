// verifica di F.calcolo.variazioni contro forme chiuse e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-variazioni.js']);
const V = C.variazioni; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
const g = V.G;

// 1. brachistocrona: tempo numerico della cicloide contro √(R/g)·θ, per vari B
[[3, 1.2], [1, 2], [5, 0.5], [Math.PI / 2, 1]].forEach(([x, y]) => {
  const K = V.curve(x, y), Tn = V.tempo(K.cicloide), Tc = K.dati.T;
  prova(`cicloide B=(${x.toFixed(3)},${y}): numerico vs √(R/g)θ`, Tn.toFixed(8) + ' vs ' + Tc.toFixed(8), Math.abs(Tn - Tc) / Tc < 1e-6);
});
// 2. θ = π quando xB/yB = π/2 (B nel punto piu' basso della cicloide)
prova('xB/yB = π/2 ⇒ θ_fine = π', V.cicloide(Math.PI / 2, 1).theta, Math.abs(V.cicloide(Math.PI / 2, 1).theta - Math.PI) < 1e-9);
// 3. segmento: numerico vs √(2L²/(g yB))
{ const K = V.curve(3, 1.2), Tn = V.tempo(K.retta), Tc = V.tempoRetta(3, 1.2); prova('segmento: numerico vs forma chiusa', Tn.toFixed(8) + ' vs ' + Tc.toFixed(8), Math.abs(Tn - Tc) / Tc < 1e-6); }
// 4. arco di cerchio a quarto (xB = yB): T = √(R/g)·K(1/√2)… confronto con l'integrale ellittico via AGM
{ const R = 1, K = V.curve(R, R), Tn = V.tempo(K.cerchio, 20000);
  // per il quarto di cerchio con tangente verticale in A: T = √(R/(2g)) ∫₀^{π/2} dφ/√sin φ = √(R/(2g))·√2·K(1/√2)
  const agm = (a, b) => { for (let i = 0; i < 40; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return a; };
  const Kell = Math.PI / (2 * agm(1, Math.SQRT1_2)); const Tc = Math.sqrt(R / (2 * g)) * Math.SQRT2 * Kell;
  prova('quarto di cerchio: numerico vs integrale ellittico K(1/√2)', Tn.toFixed(7) + ' vs ' + Tc.toFixed(7), Math.abs(Tn - Tc) / Tc < 1e-5); }
// 5. la cicloide e' la piu' veloce per molti B
{ let sempre = true, peggio = 0; for (let x = 0.5; x <= 5; x += 0.5) for (let y = 0.3; y <= 3; y += 0.3) { const K = V.curve(x, y), Tc = V.tempo(K.cicloide, 1500); ['retta', 'cerchio', 'parabola'].forEach(k => { const T = V.tempo(K[k], 1500); if (!(Tc < T)) sempre = false; peggio = Math.max(peggio, Tc / T); }); }
  prova('cicloide più veloce di retta, cerchio, parabola (100 casi), max Tc/T', peggio.toFixed(4), sempre); }
// 6. minimizzazione diretta di una spezzata (30 nodi, discesa coordinata) → tende al tempo della cicloide e non lo batte
{ const xB = 3, yB = 1.2, n = 30, K = V.curve(xB, yB); let pts = []; for (let i = 0; i <= n; i++) pts.push([xB * i / n, yB * i / n]);
  let passo = 0.2; for (let it = 0; it < 4000 && passo > 1e-7; it++) { let migl = false; for (let i = 1; i < n; i++) for (const s of [passo, -passo]) { const v = pts[i][1]; const T0 = V.tempoSpezzata(pts); pts[i][1] = v + s; if (pts[i][1] > 0 && V.tempoSpezzata(pts) < T0) migl = true; else pts[i][1] = v; } if (!migl) passo /= 2; }
  const Ts = V.tempoSpezzata(pts), Tc = K.dati.T;
  prova('spezzata ottimizzata (30 nodi) vs cicloide: Ts ≥ Tc e entro 1%', Ts.toFixed(5) + ' vs ' + Tc.toFixed(5), Ts >= Tc && Ts / Tc - 1 < 0.01); }
// 7. catenaria continua: d = 2, L = 2 sinh 1, h = 0 ⇒ a = 1
{ const K = V.catenaria(2, 0, 2 * Math.sinh(1)); prova('catenaria simmetrica d=2, L=2 sinh 1 ⇒ a = 1', K.a, Math.abs(K.a - 1) < 1e-10); }
// 8. catenaria con dislivello: estremi e lunghezza d'arco numerica
{ const d = 2, h = 0.5, L = 3, K = V.catenaria(d, h, L); let s = 0, n = 20000; for (let i = 0; i < n; i++) { const x = d * (i + 0.5) / n; s += Math.sqrt(1 + Math.sinh((x - K.x0) / K.a) ** 2) * d / n; }
  prova('catenaria d=2, h=0,5, L=3: y(0), y(d)−h, lunghezza−L', [K.y(0), K.y(d) - h, s - L].map(v => v.toExponential(1)).join(', '), Math.abs(K.y(0)) < 1e-12 && Math.abs(K.y(d) - h) < 1e-10 && Math.abs(s - L) < 1e-8); }
// 9. catena discreta minimizzata: vincoli rispettati, nodi sulla catenaria a O(1/N²)
{ const dev = N => { const Cc = V.catenaMinimizza(N, 2, 0.5, 3), P = V.catenaPunti(Cc), K = V.catenaria(2, 0.5, 3); let m = 0; P.forEach(p => m = Math.max(m, Math.abs(p[1] - K.y(p[0])))); return { m, fine: P[N], passi: Cc.passi, res: Cc.residuo }; };
  const a = dev(40), b = dev(80), c = dev(160);
  prova('catena N=40: estremo finale = (2, 0,5)', a.fine.map(v => v.toFixed(12)).join(', ') + ' in ' + a.passi + ' passi', Math.abs(a.fine[0] - 2) < 1e-12 && Math.abs(a.fine[1] - 0.5) < 1e-12 && a.res < 1e-12);
  prova('catena N=40/80/160: scarto max dalla catenaria', [a.m, b.m, c.m].map(v => v.toExponential(2)).join(' / ') + ' (rapporti ' + (a.m / b.m).toFixed(2) + ', ' + (b.m / c.m).toFixed(2) + ')', c.m < 2e-4 && a.m / b.m > 3.5 && b.m / c.m > 3.5); }
// 10. energia minima: perturbazioni che rispettano i vincoli la aumentano
{ const Cc = V.catenaMinimizza(30, 2, 0.4, 3), E0 = V.catenaEnergia(Cc), base = Float64Array.from(Cc.phi); let peggiori = 0, r = 12345;
  const rnd = () => { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648 - 0.5; };
  for (let k = 0; k < 200; k++) { for (let i = 0; i < 30; i++) Cc.phi[i] = base[i] + 0.02 * rnd(); V.catenaVincoli(Cc, 30); if (V.catenaEnergia(Cc) < E0 - 1e-13) peggiori++; }
  prova('200 perturbazioni vincolate: nessuna abbassa l’energia', 'E0 = ' + E0.toFixed(10) + ', eccezioni ' + peggiori, peggiori === 0); }
// 11. catenoide: separazione critica h/R = 1,3255 (u* tanh u* = 1, u* = 1,19967864)
prova('u* (u tanh u = 1) = 1,19967864', V.USTAR.toFixed(8), Math.abs(V.USTAR - 1.19967864) < 1e-8);
prova('h*/R critico = 1,32548684', V.CRITICO.toFixed(8), Math.abs(V.CRITICO - 1.3254868) < 1e-6);
prova('nessun catenoide oltre h*: h/R = 1,33', V.catenoide(1.33, 1), V.catenoide(1.33, 1) === null && V.catenoide(1.32, 1) !== null);
// 12. incrocio con i due dischi (Goldschmidt): h/R ≈ 1,0554
prova('area catenoide = 2πR² a h/R = 1,0554', V.INCROCIO.toFixed(5), Math.abs(V.INCROCIO - 1.0554) < 1e-3);
// 13. area in forma chiusa vs integrazione numerica, e condizione al bordo
{ const c = V.catenoide(0.8, 1), a = c.stabile.a, An = V.areaNumerica(a, 0.8);
  prova('area catenoide h=0,8: forma chiusa vs Simpson', c.stabile.area.toFixed(10) + ' vs ' + An.toFixed(10), Math.abs(c.stabile.area - An) < 1e-9);
  prova('a cosh(h/2a) = R per stabile e instabile', [c.stabile, c.instabile].map(s => (s.a * Math.cosh(0.4 / s.a)).toFixed(12)).join(', '), Math.abs(c.stabile.a * Math.cosh(0.4 / c.stabile.a) - 1) < 1e-10 && Math.abs(c.instabile.a * Math.cosh(0.4 / c.instabile.a) - 1) < 1e-10);
  prova('area stabile < area instabile', c.stabile.area.toFixed(4) + ' < ' + c.instabile.area.toFixed(4), c.stabile.area < c.instabile.area);
  // Eulero–Lagrange r r'' = 1 + r'² con differenze finite
  let m = 0; for (let z = -0.4; z <= 0.4; z += 0.05) { const r = q => a * Math.cosh(q / a), e = 1e-4, r1 = (r(z + e) - r(z - e)) / (2 * e), r2 = (r(z + e) - 2 * r(z) + r(z - e)) / (e * e); m = Math.max(m, Math.abs(r(z) * r2 - 1 - r1 * r1)); }
  prova('residuo di Eulero–Lagrange r r″ − 1 − r′²', m.toExponential(2), m < 1e-5); }
// 14. Snell dalla minimizzazione del tempo (sezione aurea: x e' noto solo a ~√ε_macchina, quindi tolleranza 1e-7)
[[1, 1.5], [1.33, 1], [2.4, 1.1]].forEach(([n1, n2]) => {
  const R = V.fermatNetta({ X: 3, yA: 1, yB: 1, n1, n2 }); prova(`Snell n1=${n1}, n2=${n2}: n1 sinθ1 − n2 sinθ2`, R.snell.toExponential(2), Math.abs(R.snell) < 1e-7);
});
// 15. metodo di tiro: colpisce B, coincide con la forma chiusa cosh, conserva C di Beltrami
{ const P = { X: 4, yA: 0.6, yB: 0.6, n0: 1, alfa: 0.25 }, R = V.tiro(P), S = R.soluzione, ex = V.raggioEsatto(S.s, P);
  let m = 0; S.pts.forEach(p => m = Math.max(m, Math.abs(p[1] - ex(p[0]))));
  prova('tiro α=0,25: errore sul bersaglio', Math.abs(S.errore).toExponential(2), Math.abs(S.errore) < 1e-9);
  prova('tiro vs soluzione esatta n = C cosh(α(x−x₀)/C)', m.toExponential(2), m < 1e-9);
  prova('simmetria: y(0) = y(X) nella forma chiusa (A, B alla stessa quota), pendenza iniziale', S.s.toFixed(8), Math.abs(ex(0) - ex(4)) < 1e-9);
  // Beltrami lungo il raggio (differenze finite su y(x))
  let cmin = 1e9, cmax = -1e9; for (let i = 1; i < S.pts.length - 1; i += 10) { const v = (S.pts[i + 1][1] - S.pts[i - 1][1]) / (S.pts[i + 1][0] - S.pts[i - 1][0]); const c = V.costanteBeltrami(S.pts[i][1], v, P); cmin = Math.min(cmin, c); cmax = Math.max(cmax, c); }
  prova('costante di Beltrami n/√(1+y′²) lungo il raggio', 'escursione ' + (cmax - cmin).toExponential(2), cmax - cmin < 1e-5);
  // cammino ottico minimo rispetto a raggi vicini deformati (stessi estremi)
  const Lp = e => { let L = 0, n = 2000; for (let i = 0; i < n; i++) { const x0 = 4 * i / n, x1 = 4 * (i + 1) / n, y = x => ex(x) + e * Math.sin(Math.PI * x / 4); const ym = (y(x0) + y(x1)) / 2; L += (1 + 0.25 * ym) * Math.hypot(x1 - x0, y(x1) - y(x0)); } return L; };
  prova('cammino ottico: deformazioni ±0,05 lo allungano', [Lp(-0.05), Lp(0), Lp(0.05)].map(v => v.toFixed(7)).join(' / '), Lp(0) < Lp(0.05) && Lp(0) < Lp(-0.05) && Math.abs(Lp(0) - S.L) < 1e-5); }
// 16. α = 0: il raggio e' la retta
{ const R = V.tiro({ X: 4, yA: 0.6, yB: 1.4, n0: 1, alfa: 0 }); prova('α = 0: pendenza = (yB − yA)/X = 0,2', R.soluzione.s.toFixed(10), Math.abs(R.soluzione.s - 0.2) < 1e-9); }
console.log('\n' + ok + ' superati, ' + ko + ' falliti');
