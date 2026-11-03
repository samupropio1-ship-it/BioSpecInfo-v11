// verifica della scheda 3D «pellicola di sapone» di F.calcolo.variazioni (v238): flusso di curvatura media,
// catenoide come punto d'arrivo, separazione critica, strappo, curvatura media nulla
const C = require('./carica.js')(['bsi-mat-variazioni.js']);
const V = C.variazioni; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
function rilassa(h, N) { const P = V.pellicolaCrea(h, 1, N || 48); let k = 0; while (!P.strappata && k < 600000) { V.pellicolaPassi(P, 250); k += 250; if (P.vel < 1e-7) break; } return P; }
function scarto(P, a) { let e = 0; P.r.forEach((r, i) => { const z = -P.h / 2 + P.h * i / P.N; e = Math.max(e, Math.abs(r - a * Math.cosh(z / a))); }); return e; }

// 1. la separazione critica: 2u*/cosh u* con u* tanh u* = 1 → 1,32549 (valore noto)
prova('h*/R = 1,32549 (u* tanh u* = 1, u* = 1,19968)', V.CRITICO.toFixed(5) + ', u* = ' + V.USTAR.toFixed(5), Math.abs(V.CRITICO - 1.32549) < 1e-5 && Math.abs(V.USTAR - 1.19968) < 1e-5);
// 2. il catenoide esatto ha curvatura media nulla (Eulero–Lagrange r r″ = 1 + r′²)
{ let m = 0; const a = 0.73; for (let z = -0.6; z <= 0.6; z += 0.05) m = Math.max(m, Math.abs(V.curvaturaMedia(a * Math.cosh(z / a), Math.sinh(z / a), Math.cosh(z / a) / a)));
  prova('r = a cosh(z/a): κ₁ + κ₂ = 0 (scarto max)', m.toExponential(1), m < 1e-14); }
// 3. il flusso partito dal cilindro arriva al catenoide STABILE della forma chiusa (h/R = 0,9)
{ const P = rilassa(0.9), c = V.catenoide(0.9, 1);
  prova('h/R = 0,9: profilo finale = a cosh(z/a) stabile (a = 0,8828)', 'scarto ' + scarto(P, c.stabile.a).toExponential(2) + ', collo ' + Math.min(...P.r).toFixed(5), !P.strappata && scarto(P, c.stabile.a) < 2e-5); }
// 4. l'errore di discretizzazione cala come dz²: N = 24 → 48, scarto / 4
{ const c = V.catenoide(1.2, 1), e1 = scarto(rilassa(1.2, 24), c.stabile.a), e2 = scarto(rilassa(1.2, 48), c.stabile.a);
  prova('h/R = 1,2: scarto(N = 24)/scarto(N = 48) ≈ 4', (e1 / e2).toFixed(2), e1 / e2 > 3.5 && e1 / e2 < 4.5); }
// 5. l'area della pellicola rilassata = area del catenoide stabile (forma chiusa e Simpson)
{ const P = rilassa(0.9, 96), c = V.catenoide(0.9, 1), A = V.pellicolaArea(P), An = V.areaNumerica(c.stabile.a, 0.9);
  prova('area finale = π a (h + a sinh(h/a)) = Simpson', A.toFixed(5) + ' / ' + c.stabile.area.toFixed(5) + ' / ' + An.toFixed(5), Math.abs(A - c.stabile.area) < 5e-5 && Math.abs(An - c.stabile.area) < 1e-9); }
// 6. il flusso scende: l'area non aumenta mai (discesa del gradiente)
{ const P = V.pellicolaCrea(1.1, 1, 48); let a0 = V.pellicolaArea(P), mono = true; for (let k = 0; k < 80; k++) { V.pellicolaPassi(P, 100); const a = V.pellicolaArea(P); if (a > a0 + 1e-12) mono = false; a0 = a; }
  prova('area monotona decrescente lungo il flusso (h/R = 1,1)', mono ? 'sì, fino a ' + a0.toFixed(5) : 'NO', mono); }
// 7. oltre la soglia la pellicola si strappa; appena sotto no
{ const s1 = rilassa(1.36).strappata, s2 = rilassa(1.3).strappata;
  prova('h/R = 1,36 > h*: si strappa; h/R = 1,30 < h*: resta un catenoide', s1 + ', ' + s2, s1 === true && s2 === false); }
// 8. l'incrocio delle aree catenoide/dischi a h/R ≈ 1,0554
prova('incrocio area catenoide = 2πR² a h/R ≈ 1,0554', V.INCROCIO.toFixed(4), Math.abs(V.INCROCIO - 1.0554) < 1e-3);

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
