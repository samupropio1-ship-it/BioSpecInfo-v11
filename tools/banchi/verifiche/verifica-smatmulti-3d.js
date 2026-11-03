// verifica della scheda 3D di F.calcolo.multi (v238): piano tangente, hessiana, derivata direzionale,
// contro valori noti e contro secondi metodi (differenze finite, ordine dell'errore di Taylor)
const C = require('./carica.js')(['bsi-mat-cas.js', 'bsi-mat-multi.js']);
const M = C.multi; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
const B = [-2.2, 2.2, -2.2, 2.2];

// 1. piano tangente di x² + y² in (1, 2): z = 5 + 2(x − 1) + 4(y − 2)
{ const R = M.analizza('x^2 + y^2', B), P = M.pianoTangente(R, 1, 2);
  prova('x² + y² in (1, 2): f = 5, ∇f = (2, 4), piano in (1,5; 2,5) = 8', [P.z0, P.fx, P.fy, P.z(1.5, 2.5)].join(', '), P.z0 === 5 && P.fx === 2 && P.fy === 4 && Math.abs(P.z(1.5, 2.5) - 8) < 1e-12); }
// 2. l'errore f − piano e' O(h²): dimezzando h si divide per 4 (doppia buca, punto generico)
{ const R = M.analizza('(x^2 - 1)^2 + 2y^2 - 0.3x', B), P = M.pianoTangente(R, 0.3, 0.4), e = h => Math.abs(R.f(0.3 + h, 0.4 + h) - P.z(0.3 + h, 0.4 + h)), r = e(1e-2) / e(5e-3);
  prova('doppia buca: (f − piano)(h)/(f − piano)(h/2) → 4 (ordine 2)', r.toFixed(4), Math.abs(r - 4) < 0.05); }
// 3. hessiana simbolica contro differenze finite centrate, e autovalori con traccia e determinante
{ const R = M.analizza('x*y*e^(-(x^2 + y^2)/2)', B), x = 0.7, y = -0.4, h = 1e-4, f = R.f;
  const fxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h), fyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h), fxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h), H = M.hessiana(R, x, y), l = H.autovalori;
  const d = Math.max(Math.abs(H.a - fxx), Math.abs(H.d - fyy), Math.abs(H.b - fxy));
  prova('hessiana simbolica = differenze finite (scarto massimo)', d.toExponential(2), d < 1e-5);
  prova('λ₁ + λ₂ = traccia, λ₁λ₂ = det', (l[0] + l[1] - H.traccia).toExponential(1) + ', ' + (l[0] * l[1] - H.det).toExponential(1), Math.abs(l[0] + l[1] - H.traccia) < 1e-12 && Math.abs(l[0] * l[1] - H.det) < 1e-12); }
// 4. classificazione dei punti critici con l'hessiana, casi di scuola
{ const s = M.hessiana(M.analizza('x^2 - y^2', B), 0, 0), m = M.hessiana(M.analizza('x^2 + y^2', B), 0, 0), sc = M.hessiana(M.analizza('x^3 - 3x*y^2', B), 0, 0);
  prova('x² − y²: sella con λ = 2, −2; x² + y²: minimo λ = 2, 2; sella di scimmia: indecisa', [s.tipo, s.autovalori.join('/'), m.tipo, m.autovalori.join('/'), sc.tipo].join(' '), s.tipo === 'sella' && s.autovalori[0] === 2 && s.autovalori[1] === -2 && m.tipo === 'minimo' && sc.tipo === 'indeciso'); }
// 5. doppia buca: due minimi e una sella, e per ognuno l'hessiana concorda con analizza
{ const R = M.analizza('(x^2 - 1)^2 + 2y^2 - 0.3x', B), tipi = R.critici.map(p => p.tipo).sort().join(','), acc = R.critici.every(p => M.hessiana(R, p.x, p.y).tipo === p.tipo);
  const sella = R.critici.filter(p => p.tipo === 'sella')[0], ls = M.hessiana(R, sella.x, sella.y).autovalori;
  prova('doppia buca: minimo, minimo, sella; classificazione coerente', tipi + (acc ? ' coerente' : ' INCOERENTE'), tipi === 'minimo,minimo,sella' && acc);
  prova('sella: un autovalore 4 (2y²) e uno 12x² − 4 < 0', ls.map(v => v.toFixed(6)).join(', '), Math.abs(ls[0] - 4) < 1e-9 && Math.abs(ls[1] - (12 * sella.x * sella.x - 4)) < 1e-9 && ls[1] < 0); }
// 6. la derivata direzionale massima sui θ e' |∇f|, nella direzione del gradiente
{ const R = M.analizza('sin(x)*cos(y)', B), P = M.pianoTangente(R, 0.4, 0.9); let mx = -Infinity, th0 = 0; for (let k = 0; k < 36000; k++) { const th = 2 * Math.PI * k / 36000, v = M.direzionale(R, 0.4, 0.9, th); if (v > mx) { mx = v; th0 = th; } }
  prova('max_θ D_θ f = |∇f| e θ = arg ∇f', mx.toFixed(8) + ' / ' + P.gradiente.toFixed(8), Math.abs(mx - P.gradiente) < 1e-7 && Math.abs(Math.atan2(Math.sin(th0 - Math.atan2(P.fy, P.fx)), Math.cos(th0 - Math.atan2(P.fy, P.fx)))) < 2e-3); }
// 7. la discesa del gradiente dalla posizione iniziale della scheda finisce in un minimo
{ const R = M.analizza('(x^2 - 1)^2 + 2y^2 - 0.3x', B), c = M.discesa(R, -0.6, 0.5, 1500), f = c[c.length - 1], P = M.pianoTangente(R, f[0], f[1]);
  prova('discesa da (−0,6; 0,5): arriva al minimo di sinistra con piano orizzontale', f.map(v => v.toFixed(4)).join(', ') + ' |∇f| = ' + P.gradiente.toExponential(1), Math.abs(f[0] + 0.9601) < 1e-3 && Math.abs(f[1]) < 1e-3 && P.gradiente < 1e-5); }

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
