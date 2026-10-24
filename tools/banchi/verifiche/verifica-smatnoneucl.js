// verifica di F.calcolo.noneuclidea contro valori noti e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-noneuclidea.js']);
const N = C.noneuclidea, PI = Math.PI;
let ok = 0, ko = 0;
function chk(nome, val, atteso, tol) { const p = Math.abs(val - atteso) <= tol; p ? ok++ : ko++; console.log((p ? 'OK ' : 'KO ') + nome + ': ' + val + ' (atteso ' + atteso + ' ± ' + tol + ')'); }
function rnd(s) { return function () { s = (s + 0x6D2B79F5) | 0; let r = Math.imul(s ^ s >>> 15, 1 | s); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

// ── 1. sfera ──
const Re = N.R_TERRA, A = N.vett(90, 0), B = N.vett(0, 0), Cc = N.vett(0, 90), Tott = N.triangoloSferico(A, B, Cc, Re);
Tott.angoli.forEach((a, k) => chk('ottante angolo ' + k + ' = π/2', a, PI / 2, 1e-12));
chk('ottante: area Girard = 4πR²/8', Tott.areaGirard, 4 * PI * Re * Re / 8, 1e-3);
chk('ottante: area Van Oosterom-Strackee', Tott.areaVOS, 4 * PI * Re * Re / 8, 1e-3);
const Ci = N.CITTA, dRNY = N.haversine(Ci.roma[1], Ci.roma[2], Ci.ny[1], Ci.ny[2], Re);
chk('haversine Roma–New York (km) ≈ 6890', dRNY, 6890, 15); console.log('   valore calcolato: ' + dRNY.toFixed(2) + ' km');
chk('Roma–New York: haversine vs atan2(|a×b|, a·b)', dRNY, N.distCentrale(N.vett(Ci.roma[1], Ci.roma[2]), N.vett(Ci.ny[1], Ci.ny[2])) * Re, 1e-6);
const dRT = N.haversine(Ci.roma[1], Ci.roma[2], Ci.tokyo[1], Ci.tokyo[2], Re);
chk('haversine Roma–Tokyo (km) ≈ 9860', dRT, 9860, 30); console.log('   valore calcolato: ' + dRT.toFixed(2) + ' km');
chk('haversine: quarto di meridiano = πR/2', N.haversine(0, 0, 90, 0, Re), PI * Re / 2, 1e-9);
// angoli: legge dei coseni contro vettori, Girard contro Van Oosterom-Strackee, su 200 triangoli casuali
(function () { const r = rnd(5); let maxA = 0, maxE = 0, maxS = 0; for (let k = 0; k < 200; k++) { const P = [0, 1, 2].map(() => N.vett(Math.asin(2 * r() - 1) * 180 / PI, 360 * r() - 180)), T = N.triangoloSferico(P[0], P[1], P[2], 1), Ac = N.angoliCoseni(P[0], P[1], P[2]); for (let i = 0; i < 3; i++) maxA = Math.max(maxA, Math.abs(T.angoli[i] - Ac[i])); maxE = Math.max(maxE, Math.abs(T.areaGirard - T.areaVOS)); maxS = Math.max(maxS, T.somma > PI ? 0 : 1); }
  chk('200 triangoli: max |angolo coseni − vettori|', maxA, 0, 1e-7); chk('200 triangoli: max |Girard − Van Oosterom|', maxE, 0, 1e-9); chk('200 triangoli: somma sempre > π', maxS, 0, 0); })();
// area di una calotta per integrazione numerica come terzo metodo: triangolo N, (0,0), (0,Δλ) ha area Δλ (fuso/2)
(function () { const dl = 1.1, T = N.triangoloSferico([0, 0, 1], N.vett(0, 0), N.vett(0, dl * 180 / PI), 1); chk('triangolo polo–equatore Δλ = 1,1: area = Δλ', T.areaGirard, dl, 1e-12); })();
// ── 2. Poincaré ──
(function () {
  const r = rnd(9), pt = () => { const a = 2 * PI * r(), m = 0.95 * Math.sqrt(r()); return [m * Math.cos(a), m * Math.sin(a)]; };
  let maxOrt = 0, maxPass = 0;
  for (let k = 0; k < 300; k++) {
    const p = pt(), q = pt(), g = N.geodetica(p, q); if (g.retta) continue;
    // passa per p e q
    maxPass = Math.max(maxPass, Math.abs(Math.hypot(p[0] - g.c[0], p[1] - g.c[1]) - g.r), Math.abs(Math.hypot(q[0] - g.c[0], q[1] - g.c[1]) - g.r));
    // ortogonalità: nei punti d'intersezione col cerchio unitario (intersezione calcolata in modo indipendente) i raggi sono perpendicolari
    const d = Math.hypot(g.c[0], g.c[1]), a = (1 - g.r * g.r + d * d) / (2 * d), h = Math.sqrt(Math.max(0, 1 - a * a)), ux = g.c[0] / d, uy = g.c[1] / d;
    [[a * ux - h * uy, a * uy + h * ux], [a * ux + h * uy, a * uy - h * ux]].forEach(X => { const v1 = X, v2 = [X[0] - g.c[0], X[1] - g.c[1]]; maxOrt = Math.max(maxOrt, Math.abs(v1[0] * v2[0] + v1[1] * v2[1]) / g.r); });
  }
  chk('300 geodetiche: passano per i due punti (max scarto)', maxPass, 0, 1e-9);
  chk('300 geodetiche: ortogonali al cerchio unitario (max |cos|)', maxOrt, 0, 1e-9);
  let maxSim = 0, minTri = Infinity, maxMob = 0;
  for (let k = 0; k < 2000; k++) { const a = pt(), b = pt(), c = pt(); maxSim = Math.max(maxSim, Math.abs(N.distH(a, b) - N.distH(b, a))); minTri = Math.min(minTri, N.distH(a, b) + N.distH(b, c) - N.distH(a, c)); maxMob = Math.max(maxMob, Math.abs(N.distH(N.mobius(c, a), N.mobius(c, b)) - N.distH(a, b)) / N.distH(a, b)); }
  chk('2000 terne: simmetria d(a,b) = d(b,a)', maxSim, 0, 1e-12);
  chk('2000 terne: disuguaglianza triangolare (min d(a,b)+d(b,c)−d(a,c) ≥ 0)', minTri >= -1e-12 ? 0 : minTri, 0, 0); console.log('   minimo = ' + minTri.toExponential(3));
  chk('2000 coppie: invarianza per Möbius (scarto relativo max)', maxMob, 0, 1e-7);
  chk('d(0, r) = ln((1+r)/(1−r)), r = 0,7', N.distH([0, 0], [0.7, 0]), Math.log(1.7 / 0.3), 1e-12);
  // distanza come integrale di 2|dz|/(1−|z|²) lungo l'arco geodetico (Simpson): metodo indipendente
  const p = [-0.5, 0.3], q = [0.6, 0.4], g = N.geodetica(p, q), a1 = Math.atan2(p[1] - g.c[1], p[0] - g.c[0]); let a2 = Math.atan2(q[1] - g.c[1], q[0] - g.c[0]), dd = a2 - a1; while (dd > PI) dd -= 2 * PI; while (dd < -PI) dd += 2 * PI;
  let s = 0; const M = 4000; for (let i = 0; i <= M; i++) { const th = a1 + dd * i / M, z = [g.c[0] + g.r * Math.cos(th), g.c[1] + g.r * Math.sin(th)], f = 2 * g.r / (1 - z[0] * z[0] - z[1] * z[1]), w = i === 0 || i === M ? 1 : i % 2 ? 4 : 2; s += w * f; }
  chk('distanza: formula vs integrale lungo la geodetica', N.distH(p, q), s * Math.abs(dd) / M / 3, 1e-9);
  // triangolo: difetto positivo, area = π − Σ contro integrazione numerica di 4/(1−|z|²)² sul triangolo
  const V = [[-0.55, -0.35], [0.6, -0.3], [0.05, 0.62]], T = N.triangoloIperb(V[0], V[1], V[2]);
  chk('difetto angolare positivo', T.difetto > 0 ? 1 : 0, 1, 0); console.log('   somma = ' + (T.somma * 180 / PI).toFixed(4) + '°, difetto = ' + T.difetto.toFixed(6));
  let area = 0; const G = 1600, hgr = 2 / G; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const z = [-1 + (i + 0.5) * hgr, -1 + (j + 0.5) * hgr], m = z[0] * z[0] + z[1] * z[1]; if (m < 1 && N.dentroTriangolo(V[0], V[1], V[2], z)) area += 4 / ((1 - m) * (1 - m)) * hgr * hgr; }
  chk('area = π − Σ vs integrale numerico (griglia 1600²)', T.area, area, 2e-3);
  let maxD = 0; const r2 = rnd(21); for (let k = 0; k < 300; k++) { const P = [pt(), pt(), pt()], T2 = N.triangoloIperb(P[0], P[1], P[2]); if (T2.difetto <= 0) maxD = 1; } chk('300 triangoli casuali: difetto sempre > 0', maxD, 0, 0);
  // legge iperbolica dei coseni: cosh c = cosh a cosh b − sinh a sinh b cos γ
  const [la, lb, lc] = T.lati; chk('legge iperbolica dei coseni (angolo in C)', Math.cosh(lc), Math.cosh(la) * Math.cosh(lb) - Math.sinh(la) * Math.sinh(lb) * Math.cos(T.angoli[2]), 1e-10);
  // parallele: per P le geodetiche per i punti ideali di L non tagliano L; alcune direzioni la tagliano, infinite no
  const L = N.geodetica([-0.6, -0.45], [0.65, -0.35]), E = N.estremi(L), P = [0.05, 0.35];
  chk('estremi ideali sul bordo', Math.hypot(E[0][0], E[0][1]), 1, 1e-12);
  let par = 0, sec = 0; for (let k = 0; k < 3600; k++) { if (N.siTagliano(N.geodeticaDir(P, PI * k / 3600), L)) sec++; else par++; }
  chk('parallele per P: un intervallo di direzioni (non zero e non tutte)', par > 0 && sec > 0 ? 1 : 0, 1, 0); console.log('   ' + par + ' parallele e ' + sec + ' secanti su 3600 direzioni');
  const gD = N.geodeticaDir(P, 0.7); chk('geodeticaDir: ortogonale al bordo (|c|² − r² = 1)', gD.c[0] ** 2 + gD.c[1] ** 2 - gD.r * gD.r, 1, 1e-12);
  // tassellazione {7,3}
  const Tz = N.tassellazione(7, 3, 4, 3000), v = Tz.tessere[0].v;
  chk('{7,3}: angolo interno al vertice = 2π/3', N.angoloH(v[0], v[1], v[6]), 2 * PI / 3, 1e-10);
  chk('{7,3}: lato = 2 arccosh(cos(π/p)/sin(π/q))', N.distH(v[0], v[1]), Tz.lato, 1e-10);
  chk('{7,3}: area tessera (Gauss-Bonnet) = π/3', Tz.areaTessera, PI / 3, 1e-12);
  let maxLato = 0; Tz.tessere.forEach(T3 => { if (Math.hypot(T3.c[0], T3.c[1]) > 0.97) return; for (let i = 0; i < 7; i++) maxLato = Math.max(maxLato, Math.abs(N.distH(T3.v[i], T3.v[(i + 1) % 7]) - Tz.lato)); });
  chk('{7,3}: tutte le tessere congruenti (max scarto dei lati)', maxLato, 0, 1e-6);
  const intorno = Tz.tessere.filter(T3 => T3.v.some(w => Math.hypot(w[0] - v[0][0], w[1] - v[0][1]) < 1e-9)).length;
  chk('{7,3}: tessere attorno a un vertice = 3', intorno, 3, 0);
  const T54 = N.tassellazione(5, 4, 3, 3000), v5 = T54.tessere[0].v;
  chk('{5,4}: angolo interno = π/2', N.angoloH(v5[0], v5[1], v5[4]), PI / 2, 1e-10);
  chk('{5,4}: tessere attorno a un vertice = 4', T54.tessere.filter(T3 => T3.v.some(w => Math.hypot(w[0] - v5[0][0], w[1] - v5[0][1]) < 1e-9)).length, 4, 0);
  console.log('   {7,3} profondità 4: ' + Tz.tessere.length + ' tessere; {5,4} profondità 3: ' + T54.tessere.length);
})();
// ── 3. curvatura ──
(function () {
  const R = 2;
  chk('K sfera (grafico z = √(R²−x²−y²)) = 1/R²', N.curvaturaGrafico((x, y) => Math.sqrt(R * R - x * x - y * y), 0.3, -0.4, 1e-3), 1 / (R * R), 1e-5);
  chk('K piano = 0', N.curvaturaGrafico((x, y) => 0.3 * x - 0.2 * y + 1, 0.5, 0.5), 0, 1e-9);
  chk('K sella z = (x²−y²)/(2R) nell’origine = −1/R²', N.curvaturaGrafico((x, y) => (x * x - y * y) / (2 * R), 0, 0, 1e-3), -1 / (R * R), 1e-6);
  chk('K sfera come superficie di rotazione', N.curvaturaRotazione(s => R * Math.cos(s), s => R * Math.sin(s), 0.4), 1 / (R * R), 1e-5);
  chk('K pseudosfera (trattrice) = −1/R²', N.curvaturaRotazione(s => R / Math.cosh(s), s => R * (s - Math.tanh(s)), 1.3), -1 / (R * R), 1e-5);
  chk('C sfera: formula vs 20000 corde, r = 1,3', N.circonferenza(1 / (R * R), 1.3), N.circonferenzaMisurata(R, 1.3, 20000), 1e-6);
  chk('C sfera: emisfero r = πR/2 → 2πR', N.circonferenza(1 / (R * R), PI * R / 2), 2 * PI * R, 1e-12);
  // Bertrand-Diguet-Puiseux: (3/π)(2πr − C)/r³ → K con Richardson
  const bdp = (K, r) => 3 / PI * (2 * PI * r - N.circonferenza(K, r)) / r ** 3;
  [1 / (R * R), -1 / (R * R)].forEach(K => { const r = 0.02, est = (4 * bdp(K, r / 2) - bdp(K, r)) / 3; chk('K da C(r) (Richardson) per K = ' + K, est, K, 1e-7); });
  chk('C(r) − (2πr − (π/3)Kr³) = 2π(K²r⁵/120 − K³r⁷/5040 + …), r = 0,1', N.circonferenza(0.25, 0.1) - N.circonferenzaSerie(0.25, 0.1), 2 * PI * (0.25 ** 2 * 0.1 ** 5 / 120 - 0.25 ** 3 * 0.1 ** 7 / 5040), 1e-15);
  // olonomia
  const A = [0, 0, 1];
  [30, 90, 150].forEach(dl => { const B = N.vett(0, 0), Cc = N.vett(0, dl), T = N.trasporto(A, B, Cc, [1, 0, 0], 90), E = N.triangoloSferico(A, B, Cc).eccesso; chk('olonomia Δλ = ' + dl + '°: |rotazione| = area/R²', Math.abs(T.rotazione), E, 1e-12); chk('olonomia Δλ = ' + dl + '°: metodo per proiezioni (20000 passi)', Math.abs(N.trasportoProiezione(A, B, Cc, [1, 0, 0], 20000)), E, 1e-3); });
  const P = [N.vett(20, 10), N.vett(-10, 40), N.vett(35, 70)], Tg = N.triangoloSferico(P[0], P[1], P[2]), v0 = (() => { const t = [0, 0, 1], d = t[2] * P[0][2]; const w = [t[0] - d * P[0][0], t[1] - d * P[0][1], t[2] - d * P[0][2]], n = Math.hypot(...w); return w.map(x => x / n); })();
  const Tt = N.trasporto(P[0], P[1], P[2], v0, 60);
  chk('olonomia triangolo generico = eccesso (con segno dell’orientazione)', Tt.rotazione, Tg.orient * Tg.eccesso, 1e-12);
  chk('trasporto conserva la lunghezza', Math.hypot(...Tt.finale), 1, 1e-12);
})();
console.log('\n' + ok + ' superati, ' + ko + ' falliti');
