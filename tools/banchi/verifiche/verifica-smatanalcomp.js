// verifica di F.calcolo.analisicomplessa contro valori noti e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-analisicomplessa.js']);
const A = C.analisicomplessa, PI = Math.PI;
let ok = 0, ko = 0;
function chk(nome, val, atteso, tol) { const p = Math.abs(val - atteso) <= tol; p ? ok++ : ko++; console.log((p ? 'OK ' : 'KO ') + nome + ': ' + val + ' (atteso ' + atteso + ' ± ' + tol + ')'); }
function vero(nome, c, det) { c ? ok++ : ko++; console.log((c ? 'OK ' : 'KO ') + nome + (det ? ' — ' + det : '')); }
function rnd(s) { return function () { s = (s + 0x6D2B79F5) | 0; let r = Math.imul(s ^ s >>> 15, 1 | s); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
const cab = z => Math.hypot(z[0], z[1]);

// ── aritmetica e funzioni elementari ──
chk('e^(iπ) + 1 = 0', cab(A.ca(A.cexp([0, PI]), [1, 0])), 0, 1e-15);
(function () { const r = rnd(3); let m = 0; for (let k = 0; k < 500; k++) { const z = [4 * r() - 2, 4 * r() - 2], s = A.csin(z), c = A.ccos(z), u = A.ca(A.cm(s, s), A.cm(c, c)); m = Math.max(m, cab(A.cs(u, [1, 0]))); } chk('sin²z + cos²z = 1 su 500 punti', m, 0, 1e-12); })();
(function () { const r = rnd(4); let m = 0; for (let k = 0; k < 500; k++) { const z = [4 * r() - 2, 4 * r() - 2]; m = Math.max(m, cab(A.cs(A.cexp(A.clog(z)), z)), cab(A.cs(A.cm(A.csqrt(z), A.csqrt(z)), z))); } chk('e^(Log z) = z e (√z)² = z', m, 0, 1e-13); })();
chk('salto del Log attraverso il taglio = 2π', A.clog([-1, 1e-14])[1] - A.clog([-1, -1e-14])[1], 2 * PI, 1e-12);
chk('√(−1 + 0i) = i, √(−1 − 0i) = −i (somma delle parti immaginarie)', A.csqrt([-1, 1e-16])[1] + A.csqrt([-1, -1e-16])[1], 0, 1e-12);

// ── Cauchy–Riemann su campioni, per tutte le funzioni ──
Object.keys(A.FUNZIONI).forEach(k => { const r = A.crCampioni(k, 2.4, 20); chk('Cauchy–Riemann ' + A.FUNZIONI[k].nome + ' (' + r.campioni + ' campioni)', r.max, 0, 1e-6); });
(function () { const f = z => [z[0] * z[0] + z[1] * z[1], 0]; chk('controllo negativo: |z|² NON soddisfa Cauchy–Riemann in 1 + i', A.cauchyRiemann(f, 1, 1) > 0.5 ? 1 : 0, 1, 0); })();
chk('derivata numerica di e^z in 0,3 + 0,7i = e^z', cab(A.cs(A.derivata(A.cexp, [0.3, 0.7]), A.cexp([0.3, 0.7]))), 0, 1e-9);

// ── colorazione del dominio ──
(function () {
  const red = A.coloreComplesso([2, 0], false, false), cyan = A.coloreComplesso([-2, 0], false, false), zero = A.coloreComplesso([1e-9, 0], false, false), polo = A.coloreComplesso([1e15, 0], false, false);
  vero('f reale positiva → rosso, negativa → ciano', red[0] > red[1] && red[0] > red[2] && cyan[0] < cyan[1] && cyan[0] < cyan[2]);
  vero('zero → nero, polo → bianco', zero[0] + zero[1] + zero[2] < 0.25 && polo[0] + polo[1] + polo[2] > 2.9);
  const px = A.coloraDominio(A.FUNZIONI.inv.f, -1, 1, -1, 1, 21, 21, false, false); const c = 4 * (10 * 21 + 10);
  vero('immagine di 1/z: pixel centrale (polo) quasi bianco', px[c] > 200 && px[c + 1] > 200 && px[c + 2] > 200);
})();

// ── mappe conformi ──
(function () {
  const r = rnd(7); let m = 0, mr = 0;
  Object.keys(A.MAPPE).forEach(k => { const M = A.MAPPE[k]; for (let i = 0; i < 40; i++) { const z = [0.6 + r(), 0.3 + r()], a = A.angoloImmagini(M.f, z, 1e-6, 2 * PI * r()); m = Math.max(m, Math.abs(Math.abs(a.angolo) - PI / 2)); mr = Math.max(mr, Math.abs(a.rapporto - 1)); } });
  chk('7 mappe × 40 punti: le immagini di segmenti ortogonali restano a 90° (max scarto, rad)', m, 0, 1e-5);
  chk('… e con lo stesso ingrandimento in tutte le direzioni (max |rapporto − 1|)', mr, 0, 1e-5);
  const a0 = A.angoloImmagini(A.MAPPE.z2.f, [0, 0], 1e-3, 0.3);
  chk('z² nell’origine (f′ = 0): l’angolo retto diventa piatto (180°)', Math.abs(a0.angolo), PI, 1e-9);
  const a1 = A.angoloImmagini(A.MAPPE.z2.f, [0.8, -0.4], 1e-7), d = A.derivata(A.MAPPE.z2.f, [0.8, -0.4]);
  chk('scala locale misurata = |f′(z₀)|', a1.scala, cab(d), 1e-5);
  let mm = 0; for (let i = 0; i < 300; i++) { const z = [6 * r() - 3, 4 * r() + 1e-3]; mm = Math.max(mm, cab(A.MAPPE.mob.f(z))); }
  vero('Cayley: il semipiano superiore va dentro il disco unitario', mm < 1, 'max |w| = ' + mm.toFixed(6));
  // birapporto conservato dalla Möbius
  const zs = [[0.3, 0.2], [-1, 0.5], [2, 1], [0.1, -0.7]], cr = p => A.cd(A.cm(A.cs(p[0], p[2]), A.cs(p[1], p[3])), A.cm(A.cs(p[0], p[3]), A.cs(p[1], p[2])));
  chk('Möbius conserva il birapporto', cab(A.cs(cr(zs), cr(zs.map(A.MAPPE.mob.f)))), 0, 1e-12);
})();

// ── Joukowski ──
(function () {
  const P = A.profilo(0.1, 0.08, 6 * PI / 180, 1);
  chk('condizione di Kutta: dF/dζ = 0 sul bordo d’uscita z = 1', cab(A.velocitaZeta(P, [1, 0])), 0, 1e-12);
  const B = A.blasius(P, 4000);
  chk('portanza: Blasius ∮ vs Kutta–Joukowski ρUΓ', B.modulo, Math.abs(P.G), 1e-9);
  const dir = Math.atan2(B.Y, B.X), atteso = 6 * PI / 180 + PI / 2;
  chk('forza perpendicolare alla corrente (Blasius, nessuna resistenza: d’Alembert)', Math.abs(Math.cos(dir - atteso)), 1, 1e-9);
  const Q = A.profilo(0.0, 0.0, 5 * PI / 180, 1);
  chk('lastra piana: C_L = 2Γ/(Uc) = 2π sin α', 2 * Q.G / A.corda(Q), 2 * PI * Math.sin(5 * PI / 180), 1e-4);
  // sul cerchio la velocita' e' tangente: il cerchio e' una linea di corrente (Im F costante)
  let m = 0; const v0 = A.potenziale(P, A.ca(P.c, [P.R, 0]))[1]; for (let k = 1; k < 100; k++) { const th = 2 * PI * k / 100; m = Math.max(m, Math.abs(A.potenziale(P, A.ca(P.c, [P.R * Math.cos(th), P.R * Math.sin(th)]))[1] - v0)); }
  chk('il contorno è una linea di corrente (Im F costante)', m, 0, 1e-12);
})();

// ── integrali di contorno ──
(function () {
  const casi = [['a', [0, 0.5], 1], ['a', [0, 0], 2], ['b', [0.5, 0], 1], ['b', [0, 0], 0.5], ['c', [0, 0], 1.5], ['d', [0, 0], 4], ['e', [0.3, 0.2], 1.3]];
  let m = 0; casi.forEach(c => { const I1 = A.integraleCerchio(A.MERO[c[0]].f, c[1], c[2], 4096), I2 = A.sommaResidui(c[0], c[1], c[2]).due_pi_i; m = Math.max(m, cab(A.cs(I1, I2))); });
  chk('7 cammini: ∮ f dz (trapezi) = 2πi Σ Res (max scarto)', m, 0, 1e-10);
  chk('1/(z²+1) su |z| = 2: i due residui si annullano', cab(A.integraleCerchio(A.MERO.a.f, [0, 0], 2, 4096)), 0, 1e-12);
  chk('e^z/(z(z−1)) su |z| = 2: 2πi(e − 1)', A.integraleCerchio(A.MERO.b.f, [0, 0], 2, 4096)[1], 2 * PI * (Math.E - 1), 1e-10);
  chk('polo doppio: (z³−1)/(z−½)² su |z−½| = 0,3 → 2πi·¾', A.integraleCerchio(A.MERO.e.f, [0.5, 0], 0.3, 4096)[1], 1.5 * PI, 1e-10);
  // principio dell'argomento: integrale di f'/f e numero di giri contro Z − P dalle liste
  const ca2 = [['e', [0, 0], 1.5], ['e', [0.5, 0], 0.3], ['c', [0, 0], 1.5], ['c', [0, 0], 0.5], ['a', [0, 0.5], 1]];
  let mi = 0, mg = 0; ca2.forEach(c => { const zp = A.zeriMenoPoli(c[0], c[1], c[2]), N = zp.Z - zp.P, ap = A.argomentoIntegrale(A.MERO[c[0]].f, c[1], c[2], 4096), g = A.numeroGiri(A.MERO[c[0]].f, c[1], c[2], 4000); mi = Math.max(mi, Math.abs(ap[0] - N), Math.abs(ap[1])); mg = Math.max(mg, Math.abs(g - N)); });
  chk('principio dell’argomento: (1/2πi)∮f′/f = Z − P (5 cammini)', mi, 0, 1e-6);
  chk('principio dell’argomento: giri di f(γ) attorno a 0 = Z − P', mg, 0, 1e-9);
})();

// ── integrali reali ──
Object.keys(A.INTEGRALI).forEach(k => {
  const I = A.INTEGRALI[k];
  chk(I.nome + ' = ' + I.testo + ': teorema dei residui', A.valoreResidui(k), I.esatto, 1e-14);
  chk(I.nome + ' = ' + I.testo + ': quadratura', I.quad(), I.esatto, k === 'coseno' ? 1e-8 : 1e-11);
});
chk('arco del semicerchio per 1/(1+x²) a R = 50 → 0 (≤ πR/(R²−1))', cab(A.integraleArco('uno', 50, 4000)) <= PI * 50 / (2500 - 1) ? 0 : 1, 0, 0);
chk('lemma di Jordan: |∫arco e^(iz)/(1+z²)| a R = 30 sotto π/(R²−1)', cab(A.integraleArco('coseno', 30, 8000)) <= PI / (900 - 1) ? 0 : 1, 0, 0);
chk('regola dei trapezi periodica: 2π/√3 con 32 punti a 1e-14', A.trapeziPeriodico(th => 1 / (2 + Math.cos(th)), 32), 2 * PI / Math.sqrt(3), 1e-14);

console.log(ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
