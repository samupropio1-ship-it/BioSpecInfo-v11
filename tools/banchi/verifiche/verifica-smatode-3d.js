// verifica della scheda 3D «caos nello spazio delle fasi» di F.calcolo.ode (v238): esponenti di Ljapunov contro
// i valori della letteratura, divergenza e contrazione dei volumi, punti fissi, ordine di RK4
const C = require('./carica.js')(['bsi-mat-cas.js', 'bsi-mat-ode.js']);
const O = C.ode; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
const PL = { s: 10, r: 28, b: 8 / 3 }, PR = { a: 0.2, b: 0.2, c: 5.7 }, fL = O.campo3('lorenz', PL), fR = O.campo3('rossler', PR);

// 1. Lorenz (10, 28, 8/3): λ₁ ≈ 0,9056 (Sprott, Chaos and Time-Series Analysis)
{ const l = O.ljapunov(fL, [1, 1, 20], 0.005, 1000, 50); prova('Lorenz: λ₁ (Benettin, t = 1000) ≈ 0,9056', l.toFixed(4), Math.abs(l - 0.9056) < 0.03); }
// 2. Rössler (0,2; 0,2; 5,7): λ₁ ≈ 0,0714
{ const l = O.ljapunov(fR, [1, 1, 0], 0.01, 5000, 100); prova('Rössler: λ₁ (Benettin, t = 5000) ≈ 0,0714', l.toFixed(4), Math.abs(l - 0.0714) < 0.01); }
// 3. sotto la soglia del caos (ρ = 15) le traiettorie cadono in un punto fisso: λ₁ < 0
{ const l = O.ljapunov(O.campo3('lorenz', { s: 10, r: 15, b: 8 / 3 }), [1, 1, 20], 0.005, 300, 50); prova('Lorenz con ρ = 15: λ₁ < 0 (punto fisso stabile)', l.toFixed(4), l < -0.01); }
// 4. divergenza: Lorenz −(σ + 1 + β) in ogni punto (numerica contro formula)
{ let m = 0; [[1, 2, 3], [-7, 4, 30], [0.3, -9, 12]].forEach(v => { m = Math.max(m, Math.abs(O.divergenza3(fL, v) + (10 + 1 + 8 / 3))); });
  prova('Lorenz: div F = −(σ + 1 + β) = −13,667 (scarto max)', m.toExponential(1), m < 1e-6); }
// 5. contrazione dei volumi: un tetraedro piccolo, dopo t = 0,5, ha volume × e^(−13,667·0,5)
{ const vol = P => { const a = P[1].map((x, i) => x - P[0][i]), b = P[2].map((x, i) => x - P[0][i]), c = P[3].map((x, i) => x - P[0][i]); return Math.abs(a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])); };
  let P = [[1, 2, 20], [1 + 1e-5, 2, 20], [1, 2 + 1e-5, 20], [1, 2, 20 + 1e-5]]; const V0 = vol(P); for (let i = 0; i < 500; i++) P = P.map(p => O.passoRK4(fL, p, 0.001)); const r = vol(P) / V0, es = Math.exp(-(11 + 8 / 3) * 0.5);
  prova('volume dopo t = 0,5: rapporto = e^(div·t)', r.toExponential(4) + ' / ' + es.toExponential(4), Math.abs(r / es - 1) < 0.01); }
// 6. punti fissi: il campo vi si annulla (Lorenz C± e Rössler)
{ const m = Math.max(...O.puntiFissiLorenz(PL).concat([]).map(p => Math.hypot(...fL(p))), ...O.puntiFissiRossler(PR).map(p => Math.hypot(...fR(p))));
  prova('punti fissi di Lorenz (3) e Rössler (2): |F| = 0', m.toExponential(1) + ' · C+ = ' + O.puntiFissiLorenz(PL)[1].map(x => x.toFixed(3)).join(', '), m < 1e-12 && Math.abs(O.puntiFissiLorenz(PL)[1][0] - Math.sqrt(72)) < 1e-12); }
// 7. RK4 e' del quarto ordine: errore(h)/errore(h/2) → 16 (riferimento con h/16)
{ const vai = (h, T) => { let v = [1, 1, 20]; for (let i = 0; i < Math.round(T / h); i++) v = O.passoRK4(fL, v, h); return v; }, ref = vai(0.005 / 16, 0.5), e = h => Math.hypot(...vai(h, 0.5).map((x, i) => x - ref[i])), r = e(0.005) / e(0.0025);
  prova('RK4 su Lorenz fino a t = 0,5: errore(h)/errore(h/2) ≈ 16', r.toFixed(2), r > 15 && r < 17); }
// 8. sensibilita': ε = 10⁻⁸, dopo t = 25 la distanza e' cresciuta di molti ordini (λ₁ > 0)
{ let a = [1, 1, 20], b = [1 + 1e-8, 1, 20]; for (let i = 0; i < 5000; i++) { a = O.passoRK4(fL, a, 0.005); b = O.passoRK4(fL, b, 0.005); } const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  prova('ε = 10⁻⁸: dopo t = 25 la distanza supera 10⁻³', d.toExponential(2), d > 1e-3); }
// 9. sistema scritto dall'utente (Thomas): coincide con la formula; una variabile estranea e' rifiutata
{ const f = O.campo3('libero', {}, ['sin(y) - 0.208*x', 'sin(z) - 0.208*y', 'sin(x) - 0.208*z']), v = f([0.3, -1.1, 2]), es = [Math.sin(-1.1) - 0.208 * 0.3, Math.sin(2) + 0.208 * 1.1, Math.sin(0.3) - 0.208 * 2]; let msg = ''; try { O.campo3('libero', {}, ['x + q', 'y', 'z']); } catch (e) { msg = e.message; }
  prova('Thomas dal testo = formula; «q» rifiutata', Math.hypot(v[0] - es[0], v[1] - es[1], v[2] - es[2]).toExponential(1) + ' · ' + msg, Math.hypot(v[0] - es[0], v[1] - es[1], v[2] - es[2]) < 1e-15 && /q/.test(msg)); }

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
