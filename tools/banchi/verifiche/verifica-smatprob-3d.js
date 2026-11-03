// verifica della scheda 3D «normale bivariata» di F.calcolo.probabilita (v238): normalizzazione, marginali,
// probabilita' delle ellissi di Mahalanobis, campionamento (correlazione, varianze), assi dell'ellisse
const C = require('./carica.js')(['bsi-mat-probabilita.js']);
const P = C.probabilita; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
const sx = 1.3, sy = 0.7, rho = 0.6, L = 9, N = 600, h = 2 * L / N;
// integrale doppio con il punto medio su [−L, L]² (la coda oltre 9σ e' trascurabile)
function doppio(g) { let s = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -L + (i + 0.5) * h, y = -L + (j + 0.5) * h; s += g(x, y); } return s * h * h; }

// 1. la densita' e' normalizzata
{ const I = doppio((x, y) => P.densitaBiv(x, y, sx, sy, rho)); prova('∬ f dx dy = 1 (σx = 1,3; σy = 0,7; ρ = 0,6)', I.toFixed(10), Math.abs(I - 1) < 1e-8); }
// 2. la marginale in x e' N(0, σx²), indipendente da ρ
{ let m = 0; [-2, -0.5, 0.3, 1.7].forEach(x => { let s = 0; for (let j = 0; j < 4000; j++) { const y = -L + (j + 0.5) * 2 * L / 4000; s += P.densitaBiv(x, y, sx, sy, rho); } m = Math.max(m, Math.abs(s * 2 * L / 4000 - P.normale(x, 0, sx))); });
  prova('∫ f(x, y) dy = N(0, σx²)(x)', m.toExponential(1), m < 1e-10); }
// 3. covarianza: ∬ xy f = ρσxσy
{ const c = doppio((x, y) => x * y * P.densitaBiv(x, y, sx, sy, rho)); prova('∬ xy f = ρσxσy = 0,546', c.toFixed(8), Math.abs(c - rho * sx * sy) < 1e-7); }
// 4. probabilita' dell'ellisse Q ≤ k²: 1 − e^(−k²/2), confrontata con l'integrale numerico
{ const r = [1, 2].map(k => doppio((x, y) => P.mahalanobis2(x, y, sx, sy, rho) <= k * k ? P.densitaBiv(x, y, sx, sy, rho) : 0));
  prova('P(Q ≤ 1) = 39,35 %, P(Q ≤ 4) = 86,47 % (integrale)', r.map(v => (100 * v).toFixed(3)).join(', ') + ' / ' + [1, 2].map(k => (100 * P.probEllisse(k)).toFixed(3)).join(', '), Math.abs(r[0] - P.probEllisse(1)) < 2e-3 && Math.abs(r[1] - P.probEllisse(2)) < 2e-3); }
// 5. il campionamento: 200 000 estrazioni con seme danno r ≈ ρ, s ≈ σ
{ const rnd = P.generatore(7), pts = []; for (let i = 0; i < 200000; i++) pts.push(P.campionaBiv(rnd, sx, sy, -0.8)); const R = P.correlazione(pts);
  prova('campioni: r ≈ −0,8, s_x ≈ 1,3, s_y ≈ 0,7', [R.r, R.sx, R.sy].map(v => v.toFixed(4)).join(', '), Math.abs(R.r + 0.8) < 0.005 && Math.abs(R.sx - sx) < 0.01 && Math.abs(R.sy - sy) < 0.01); }
// 6. frazione dei campioni nell'ellisse Q ≤ 1 contro 1 − e^(−1/2)
{ const rnd = P.generatore(11); let d = 0, n = 100000; for (let i = 0; i < n; i++) { const p = P.campionaBiv(rnd, sx, sy, rho); if (P.mahalanobis2(p[0], p[1], sx, sy, rho) <= 1) d++; }
  prova('campioni dentro Q ≤ 1: 39,35 % (entro 3 errori standard)', (100 * d / n).toFixed(2) + ' %', Math.abs(d / n - P.probEllisse(1)) < 3 * Math.sqrt(0.3935 * 0.6065 / n)); }
// 7. assi dell'ellisse: autovalori della covarianza (traccia e determinante) e direzione a 45° con σx = σy
{ const A = P.assiEllisse(sx, sy, rho), B = P.assiEllisse(1, 1, 0.6);
  prova('λ₁ + λ₂ = σx² + σy², λ₁λ₂ = σx²σy²(1 − ρ²); σx = σy → 45°', [(A.l1 + A.l2).toFixed(6), (A.l1 * A.l2).toFixed(6), (B.angolo * 180 / Math.PI).toFixed(6)].join(', '), Math.abs(A.l1 + A.l2 - sx * sx - sy * sy) < 1e-12 && Math.abs(A.l1 * A.l2 - sx * sx * sy * sy * (1 - rho * rho)) < 1e-12 && Math.abs(B.angolo - Math.PI / 4) < 1e-12); }

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
