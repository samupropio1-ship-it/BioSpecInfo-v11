// verifica della scheda 3D di F.calcolo.vettoriale (v238): teorema della divergenza, rotore, linee di flusso,
// contro valori esatti e fra due metodi indipendenti (integrale di superficie e integrale di volume)
const C = require('./carica.js')(['bsi-mat-cas.js', 'bsi-mat-vettoriale.js']);
const V = C.vettoriale, CAS = C.cas; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
const PI = Math.PI;

// 1. Gauss–Legendre a 16 nodi integra esattamente i polinomi fino al grado 31
{ const G = V.gaussLegendre(16), s = G.x.reduce((a, x, i) => a + G.w[i] * Math.pow(x, 30), 0), w = G.w.reduce((a, b) => a + b, 0);
  prova('Gauss–Legendre 16: ∫x³⁰ = 2/31, Σ pesi = 2', s.toPrecision(15) + ', ' + w.toPrecision(15), Math.abs(s - 2 / 31) < 1e-14 && Math.abs(w - 2) < 1e-14); }
// 2. F = (x, y, z): flusso = 3·volume = 4πr³ per qualunque centro
{ const A = V.analizzaCampo3('x', 'y', 'z'), c = [0.3, -0.2, 0.5], fl = V.flussoSfera(A, c, 1.2), dv = V.divergenzaPalla(A, c, 1.2), es = 4 * PI * Math.pow(1.2, 3);
  prova('F = (x, y, z), r = 1,2: flusso = ∭3 dV = 4πr³', fl.toFixed(10) + ' / ' + dv.toFixed(10) + ' / ' + es.toFixed(10), Math.abs(fl - es) < 1e-10 && Math.abs(dv - es) < 1e-10 && CAS.stampa(A.div) === '3'); }
// 3. F = (x³, y³, z³): div = 3|p|², ∭ = 3(4πr⁵/5 + |c|²·4πr³/3) (formula esatta), i due metodi la ritrovano
{ const A = V.analizzaCampo3('x^3', 'y^3', 'z^3'), c = [0.2, -0.1, 0.4], r = 1.3, c2 = 0.04 + 0.01 + 0.16, es = 3 * (4 * PI * Math.pow(r, 5) / 5 + c2 * 4 * PI * Math.pow(r, 3) / 3), fl = V.flussoSfera(A, c, r), dv = V.divergenzaPalla(A, c, r);
  prova('F = (x³, y³, z³): flusso, ∭ div F e formula esatta', fl.toFixed(9) + ' / ' + dv.toFixed(9) + ' / ' + es.toFixed(9), Math.abs(fl - es) < 1e-9 && Math.abs(dv - es) < 1e-9); }
// 4. un campo non polinomiale: i due membri coincidono comunque (convergenza spettrale)
{ const A = V.analizzaCampo3('sin(y*z) + x^2', 'e^(x)*cos(z)', 'z*e^(-x^2-y^2)'), c = [0.1, 0.3, -0.2], fl = V.flussoSfera(A, c, 0.9, 24), dv = V.divergenzaPalla(A, c, 0.9, 16);
  prova('campo generico: ∯ F·n dS = ∭ div F dV', fl.toFixed(12) + ' / ' + dv.toFixed(12), Math.abs(fl - dv) < 1e-9); }
// 5. flusso ABC di Beltrami: div F = 0 e rot F = F in punti a caso
{ const A = V.analizzaCampo3('sin(z) + cos(y)', 'sin(x) + cos(z)', 'sin(y) + cos(x)'); let m = 0; for (let i = 0; i < 50; i++) { const p = [Math.sin(i), Math.cos(3 * i), Math.sin(7 * i) * 2], r = A.rotF(...p), f = A.F(...p); m = Math.max(m, Math.hypot(r[0] - f[0], r[1] - f[1], r[2] - f[2])); }
  prova('ABC: div F = 0, max |rot F − F|', CAS.stampa(A.div) + ', ' + m.toExponential(1), CAS.stampa(A.div) === '0' && m < 1e-12); }
// 6. carica puntiforme: div F = 0 (riconosciuta nulla), flusso 4π con l'origine dentro, 0 con l'origine fuori
{ const A = V.analizzaCampo3('x/(x^2+y^2+z^2)^(3/2)', 'y/(x^2+y^2+z^2)^(3/2)', 'z/(x^2+y^2+z^2)^(3/2)'), dentro = V.flussoSfera(A, [0.3, 0, 0], 1), fuori = V.flussoSfera(A, [1.5, 0.2, 0], 1);
  prova('carica puntiforme: div = 0; flusso 4π (origine dentro), 0 (fuori, entro la soglia 10⁻⁶ della scheda)', CAS.stampa(A.div) + ', ' + dentro.toFixed(8) + ', ' + fuori.toExponential(1), CAS.stampa(A.div) === '0' && Math.abs(dentro - 4 * PI) < 1e-6 && Math.abs(fuori) < 1e-6); }
// 7. rotazione rigida: rot F = (0, 0, 2) e la linea di flusso resta sul cerchio
{ const A = V.analizzaCampo3('-y', 'x', '0'), r = A.rotF(0.4, 0.1, 0), L = V.lineaFlusso3(A, [1, 0, 0.5], 1, 160, 0.04, 2), dev = Math.max(...L.map(p => Math.abs(Math.hypot(p[0], p[1]) - 1) + Math.abs(p[2] - 0.5)));
  prova('(−y, x, 0): rot = (0, 0, 2); linea di flusso sul cerchio r = 1 (scarto max)', r.join(', ') + ' · ' + dev.toExponential(1), r[0] === 0 && r[1] === 0 && r[2] === 2 && dev < 1e-7 && L.length === 161); }
// 8. campo conservativo φ = xyz: rotore identicamente nullo; espressione sbagliata: errore con messaggio
{ const A = V.analizzaCampo3('y*z', 'x*z', 'x*y'); let msg = ''; try { V.analizzaCampo3('w*x', 'y', 'z'); } catch (e) { msg = e.message; }
  prova('∇(xyz): rot = 0; «w» rifiutata con un messaggio', A.rot.map(CAS.stampa).join(',') + ' · ' + msg, A.rot.every(e => CAS.stampa(e) === '0') && /w/.test(msg)); }

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
