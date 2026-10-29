/* valida-matematica.js — controllo del kit di studio di MATEMATICA (bsi-studio-matematica.js)
   1) carica bsi-fisica-comune.js + bsi-studio.js + bsi-studio-matematica.js in una vm di node e chiede a
      BSIStudio.valida(dati, { quantita: true }) l'elenco dei problemi (deve essere vuoto);
   2) controlli aggiuntivi dello schema (≥ 4 riassunti e ≥ 20 quiz per argomento, posizione della risposta
      giusta ≤ 32 %, livelli 1/2/3 presenti);
   3) VERIFICA CALCOLATA: per ogni domanda calcolabile (limiti, derivate, integrali, determinanti, autovalori,
      probabilità, somme di serie, aritmetica modulare, conteggi…) il valore viene ricalcolato numericamente o
      per forza bruta e confrontato con l'opzione all'indice k; si controlla anche che NESSUN'ALTRA opzione
      dia lo stesso valore (niente domande con due risposte giuste).
   Uso: node _prove/valida-matematica.js            (esce con codice 1 se qualcosa non va) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RADICE = path.join(__dirname, '..', '..', '..');

/* ═══ 1. caricamento nella vm ═══════════════════════════════════════════ */
function carica() {
  const nulla = () => { };
  const ctx = { console, setTimeout, clearTimeout, addEventListener: nulla, removeEventListener: nulla, dispatchEvent: nulla };
  vm.createContext(ctx);
  for (const f of ['bsi-fisica-comune.js', 'bsi-studio.js', 'bsi-studio-matematica.js']) {
    try { vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }); }
    catch (e) { if (f === 'bsi-fisica-comune.js') console.log('  (nota: ' + f + ' in node senza DOM: ' + e.message + ')'); else throw e; }
  }
  return ctx;
}
const ctx = carica(), S = ctx.BSIStudio, D = S.dati('matematica');
let errori = 0;
function ko(m) { errori++; console.log('  ✗ ' + m); }

console.log('── BSIStudio.valida(dati, { quantita: true }) ──');
const problemi = S.valida(D, { quantita: true });
if (problemi.length) problemi.forEach((p) => ko(p)); else console.log('  ✓ nessun problema');

console.log('── controlli aggiuntivi dello schema ──');
const COLL = ['riassunti', 'quiz', 'flash', 'formule', 'glossario'];
const MIN = { riassunti: 65, quiz: 320, flash: 260, formule: 220, glossario: 260 };
COLL.forEach((c) => { if (D[c].length < MIN[c]) ko(c + ': ' + D[c].length + ' < ' + MIN[c]); });
const perArg = {};
D.argomenti.forEach((a) => { perArg[a.k] = { riassunti: 0, quiz: 0, flash: 0, formule: 0, liv: {} }; });
['riassunti', 'quiz', 'flash', 'formule'].forEach((c) => D[c].forEach((x) => { perArg[x.arg][c]++; if (c === 'quiz') perArg[x.arg].liv[x.liv] = 1; }));
Object.keys(perArg).forEach((a) => {
  const P = perArg[a];
  if (P.riassunti < 4) ko(a + ': riassunti ' + P.riassunti + ' < 4');
  if (P.quiz < 20) ko(a + ': quiz ' + P.quiz + ' < 20');
  if (Object.keys(P.liv).length < 3) ko(a + ': non ha domande di tutti e tre i livelli');
});
const pos = [0, 0, 0, 0];
D.quiz.forEach((q) => pos[q.k]++);
pos.forEach((n, k) => { if (n / D.quiz.length > 0.32) ko('k = ' + k + ' nel ' + Math.round(100 * n / D.quiz.length) + ' % dei quiz (max 32 %)'); });
D.riassunti.forEach((r) => { if (!/<i>Esempio/.test(r.testo)) ko('riassunto «' + r.tit + '» senza esempio'); });
D.formule.forEach((f) => { if (!f.note) ko('formula «' + f.nm + '» senza note (ipotesi)'); });
console.log('  conteggi: ' + COLL.map((c) => c + ' ' + D[c].length).join(', '));
console.log('  per argomento (riassunti/quiz/flash/formule): ' + Object.keys(perArg).map((a) => a + ' ' + perArg[a].riassunti + '/' + perArg[a].quiz + '/' + perArg[a].flash + '/' + perArg[a].formule).join(', '));
console.log('  posizione della risposta giusta (k = 0, 1, 2, 3): ' + pos.join(' / '));

/* ═══ 2. numeri complessi e lettore di espressioni ══════════════════════ */
const C = {
  of: (re, im) => [re, im || 0],
  add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
  exp: (a) => [Math.exp(a[0]) * Math.cos(a[1]), Math.exp(a[0]) * Math.sin(a[1])],
  log: (a) => [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])],
  abs: (a) => Math.hypot(a[0], a[1]),
  pow: (a, b) => {
    if (!a[1] && !b[1] && (a[0] >= 0 || Number.isInteger(b[0]))) return [Math.pow(a[0], b[0]), 0];
    if (!b[1] && Number.isInteger(b[0]) && Math.abs(b[0]) <= 64) { let r = [1, 0]; for (let i = 0; i < Math.abs(b[0]); i++) r = C.mul(r, a); return b[0] < 0 ? C.div([1, 0], r) : r; }
    if (!a[0] && !a[1]) return [0, 0];
    return C.exp(C.mul(b, C.log(a)));
  }
};
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+', 'ˣ': 'x', 'ⁿ': 'n' };
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const FUNZ = ['arctan', 'arcsin', 'cosh', 'sinh', 'tanh', 'sqrt', 'exp', 'sin', 'cos', 'tan', 'ln', 'log'];
function realeF(nome) {
  return { arctan: Math.atan, arcsin: Math.asin, cosh: Math.cosh, sinh: Math.sinh, tanh: Math.tanh, sqrt: Math.sqrt, exp: Math.exp, sin: Math.sin, cos: Math.cos, tan: Math.tan, ln: Math.log, log: Math.log }[nome];
}
function applica(nome, z) {
  if (nome === 'exp') return C.exp(z);
  if (nome === 'cos' && z[1]) return C.mul(C.add(C.exp(C.mul([0, 1], z)), C.exp(C.mul([0, -1], z))), [0.5, 0]);
  if (nome === 'sin' && z[1]) return C.div(C.sub(C.exp(C.mul([0, 1], z)), C.exp(C.mul([0, -1], z))), [0, 2]);
  if ((nome === 'ln' || nome === 'log') && (z[1] || z[0] < 0)) return C.log(z);
  if (nome === 'sqrt' && (z[1] || z[0] < 0)) return C.pow(z, [0.5, 0]);
  if (z[1]) throw new Error('funzione ' + nome + ' su un complesso');
  return [realeF(nome)(z[0]), 0];
}
function preparaTesto(s) {
  let t = String(s).replace(/<[^>]*>/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/(\d),(\d)/g, '$1.$2');
  let out = '';
  for (let i = 0; i < t.length; i++) {
    if (SUP[t[i]] != null) { let e = ''; while (i < t.length && SUP[t[i]] != null) e += SUP[t[i++]]; i--; out += '^(' + e + ')'; }
    else out += t[i];
  }
  return out;
}
function tokenizza(s) {
  const T = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) { let n = ''; while (i < s.length && /[0-9.]/.test(s[i])) n += s[i++]; T.push({ t: 'n', v: parseFloat(n) }); continue; }
    if ('+-*/^(),'.indexOf(c) >= 0) { T.push({ t: c }); i++; continue; }
    if (c === '√') { T.push({ t: 'f', v: 'sqrt' }); i++; continue; }
    if (c === '∞') { T.push({ t: 'n', v: Infinity }); i++; continue; }
    if (c === 'π') { T.push({ t: 'n', v: Math.PI }); i++; continue; }
    const fz = FUNZ.find((f) => s.startsWith(f, i));
    if (fz) { T.push({ t: 'f', v: fz }); i += fz.length; continue; }
    if (/[a-zA-Zθρφλ]/.test(c)) {
      let id = c; i++;
      while (i < s.length && SUB.indexOf(s[i]) >= 0) id += SUB.indexOf(s[i++]);
      T.push({ t: 'id', v: id }); continue;
    }
    throw new Error('carattere non riconosciuto «' + c + '»');
  }
  return T;
}
/* valuta un'espressione (reale o complessa) con eventuali variabili; lancia un errore se non è una formula */
function valutaC(s, vars) {
  vars = vars || {};
  const T = tokenizza(preparaTesto(s));
  let p = 0;
  const vedi = () => T[p], prendi = (t) => { if (!T[p] || T[p].t !== t) throw new Error('atteso ' + t); return T[p++]; };
  function inizioAtomo(tk) { return tk && (tk.t === 'n' || tk.t === 'id' || tk.t === 'f' || tk.t === '('); }
  function espr() { let a = termine(); while (vedi() && (vedi().t === '+' || vedi().t === '-')) { const o = T[p++].t; const b = termine(); a = o === '+' ? C.add(a, b) : C.sub(a, b); } return a; }
  function termine() {
    let a = unario();
    for (;;) {
      const tk = vedi();
      if (tk && (tk.t === '*' || tk.t === '/')) { p++; const b = unario(); a = tk.t === '*' ? C.mul(a, b) : C.div(a, b); }
      else if (inizioAtomo(tk)) a = C.mul(a, potenza());
      else return a;
    }
  }
  function unario() { const tk = vedi(); if (tk && tk.t === '-') { p++; return C.mul([-1, 0], unario()); } if (tk && tk.t === '+') { p++; return unario(); } return potenza(); }
  function potenza() { const a = atomo(); if (vedi() && vedi().t === '^') { p++; const b = unario(); return C.pow(a, b); } return a; }
  function atomo() {
    const tk = T[p++];
    if (!tk) throw new Error('fine inattesa');
    if (tk.t === 'n') return [tk.v, 0];
    if (tk.t === '(') { const a = espr(); prendi(')'); return a; }
    if (tk.t === 'id') {
      if (tk.v === 'e') return [Math.E, 0];
      if (tk.v === 'i') return [0, 1];
      if (vars[tk.v] != null) return typeof vars[tk.v] === 'number' ? [vars[tk.v], 0] : vars[tk.v];
      throw new Error('identificatore «' + tk.v + '»');
    }
    if (tk.t === 'f') {
      let esp = null;
      if (vedi() && vedi().t === '^') { p++; esp = atomo(); }        /* cos²x = (cos x)² */
      let arg = potenza();
      while (inizioAtomo(vedi()) && vedi().t !== 'f' && vedi().t !== '(') arg = C.mul(arg, potenza());   /* cos 2x = cos(2x) */
      const v = applica(tk.v, arg);
      return esp ? C.pow(v, esp) : v;
    }
    throw new Error('simbolo inatteso ' + tk.t);
  }
  const r = espr();
  if (p !== T.length) throw new Error('testo in più');
  return r;
}
function valuta(s, vars) { const z = valutaC(s, vars); if (Math.abs(z[1]) > 1e-9 * Math.max(1, Math.abs(z[0]))) throw new Error('valore complesso'); return z[0]; }
function prova(f) { try { return f(); } catch (e) { return undefined; } }
function vicino(a, b, tol) {
  tol = tol == null ? 1e-6 : tol;
  if (a === undefined || b === undefined || Number.isNaN(a) || Number.isNaN(b)) return false;
  if (!Number.isFinite(b)) return a === b;
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}
const vicinoC = (a, b, tol) => a !== undefined && Math.hypot(a[0] - b[0], a[1] - b[1]) <= (tol || 1e-6) * Math.max(1, C.abs(b));
function spezza(s, sep) {          /* divide al livello 0 delle parentesi */
  const out = []; let d = 0, cur = '';
  for (const ch of s) { if ('([{'.includes(ch)) d++; if (')]}'.includes(ch)) d--; if (ch === sep && d === 0) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out.map((x) => x.trim());
}
function vettore(s) { const m = String(s).trim().match(/^\((.*)\)$/); if (!m) throw new Error('non è un vettore'); return spezza(m[1], ',').map((x) => valuta(x)); }
function matrice(s, vars) {
  const m = String(s).trim().match(/^\[(.*)\]$/); if (!m) throw new Error('non è una matrice');
  return spezza(m[1], ',').map((riga) => { const r = riga.match(/^\[(.*)\]$/); if (!r) throw new Error('riga'); return spezza(r[1], ',').map((x) => valuta(x, vars)); });
}
function intervallo(s) {
  const m = String(s).trim().match(/^([\[(])(.*)([\])])$/); if (!m) throw new Error('non è un intervallo');
  const p = spezza(m[2], ','); if (p.length !== 2) throw new Error('intervallo');
  return { a: valuta(p[0].replace(/^-∞$/, '-∞')), b: valuta(p[1]), chiusoA: m[1] === '[', chiusoB: m[3] === ']' };
}
const lista = (s) => String(s).split(' e ').map((x) => valuta(x)).sort((a, b) => a - b);
const lato = (s) => String(s).replace(/^\s*[a-zA-Zh]\s*(=|<)\s*/, '');

/* ═══ 3. strumenti numerici ═════════════════════════════════════════════ */
function tanhSinh(f, a, b) {          /* quadratura doppio-esponenziale: regge le singolarità agli estremi */
  const c = (a + b) / 2, r = (b - a) / 2, h = 1 / 64;
  let s = 0;
  for (let k = -6 * 64; k <= 6 * 64; k++) {
    const t = k * h, u = Math.PI / 2 * Math.sinh(t), x = Math.tanh(u), w = Math.PI / 2 * Math.cosh(t) / Math.cosh(u) ** 2;
    if (w < 1e-300 || Math.abs(x) >= 1) continue;
    const fx = f(c + r * x);
    if (Number.isFinite(fx)) s += w * fx;
  }
  return s * h * r;
}
function integra(f, a, b) {
  if (b === Infinity && a === -Infinity) return integra(f, 0, Infinity) + integra((x) => f(-x), 0, Infinity);
  if (b === Infinity) return tanhSinh((t) => { const x = a + t / (1 - t); return f(x) / ((1 - t) * (1 - t)); }, 0, 1);
  return tanhSinh(f, a, b);
}
const der = (f, x, h) => { h = h || 1e-5; return (f(x - 2 * h) - 8 * f(x - h) + 8 * f(x + h) - f(x + 2 * h)) / (12 * h); };
const der2 = (f, x, h) => { h = h || 1e-4; return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); };
function lim0(f, h) { h = h || 1e-3; const a = f(h), b = f(h / 2), c = f(h / 4); return (8 * c - 6 * b + a) / 3; }
function limInf(f, X) { X = X || 1e4; const a = f(X), b = f(2 * X), c = f(4 * X); return (8 * c - 6 * b + a) / 3; }
function bisez(f, a, b) { let fa = f(a); for (let i = 0; i < 200; i++) { const m = (a + b) / 2, fm = f(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
function det(M) {
  const A = M.map((r) => r.slice()), n = A.length; let d = 1;
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    if (Math.abs(A[p][i]) < 1e-14) return 0;
    if (p !== i) { [A[p], A[i]] = [A[i], A[p]]; d = -d; }
    d *= A[i][i];
    for (let r = i + 1; r < n; r++) { const m = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= m * A[i][c]; }
  }
  return d;
}
function rango(M) {
  const A = M.map((r) => r.slice()), m = A.length, n = A[0].length; let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    let p = r; for (let i = r + 1; i < m; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    if (Math.abs(A[p][c]) < 1e-10) continue;
    [A[p], A[r]] = [A[r], A[p]];
    for (let i = 0; i < m; i++) if (i !== r) { const f = A[i][c] / A[r][c]; for (let j = c; j < n; j++) A[i][j] -= f * A[r][j]; }
    r++;
  }
  return r;
}
function inversa(M) {
  const n = M.length, A = M.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[p], A[i]] = [A[i], A[p]];
    const d = A[i][i]; for (let c = 0; c < 2 * n; c++) A[i][c] /= d;
    for (let r = 0; r < n; r++) if (r !== i) { const f = A[r][i]; for (let c = 0; c < 2 * n; c++) A[r][c] -= f * A[i][c]; }
  }
  return A.map((r) => r.slice(n));
}
function autovalori2(M) {          /* 2 × 2, anche complessi */
  const tr = M[0][0] + M[1][1], dt = M[0][0] * M[1][1] - M[0][1] * M[1][0], disc = tr * tr - 4 * dt;
  if (disc >= 0) return [[(tr - Math.sqrt(disc)) / 2, 0], [(tr + Math.sqrt(disc)) / 2, 0]];
  return [[tr / 2, -Math.sqrt(-disc) / 2], [tr / 2, Math.sqrt(-disc) / 2]];
}
const matUguali = (A, B, tol) => A.length === B.length && A.every((r, i) => r.length === B[i].length && r.every((x, j) => vicino(x, B[i][j], tol)));
function rk4(f, t0, y0, t1, n) {     /* sistemi: y è un array */
  const h = (t1 - t0) / n; let t = t0, y = y0.slice();
  const piu = (a, b, c) => a.map((x, i) => x + c * b[i]);
  for (let i = 0; i < n; i++) {
    const k1 = f(t, y), k2 = f(t + h / 2, piu(y, k1, h / 2)), k3 = f(t + h / 2, piu(y, k2, h / 2)), k4 = f(t + h, piu(y, k3, h));
    y = y.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); t += h;
  }
  return y;
}
function lgamma(x) {               /* Stirling con correzioni, per x grande */
  if (x < 10) { let s = 0; while (x < 10) { s -= Math.log(x); x++; } return s + lgamma(x); }
  return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x) - 1 / (360 * x ** 3) + 1 / (1260 * x ** 5);
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const powmod = (b, e, m) => { let r = 1n, B = BigInt(b) % BigInt(m), E = BigInt(e), M = BigInt(m); while (E > 0n) { if (E & 1n) r = r * B % M; B = B * B % M; E >>= 1n; } return Number(r); };
function permutazioni(arr) { if (arr.length <= 1) return [arr.slice()]; const out = []; arr.forEach((x, i) => permutazioni(arr.slice(0, i).concat(arr.slice(i + 1))).forEach((p) => out.push([x].concat(p)))); return out; }
function sottoinsiemi(n, k) { const out = []; (function r(s, i) { if (s.length === k) { out.push(s.slice()); return; } for (let j = i; j < n; j++) { s.push(j); r(s, j + 1); s.pop(); } })([], 0); return out; }
const prodotto = (arr, k) => { let out = [[]]; for (let i = 0; i < k; i++) out = [].concat(...out.map((p) => arr.map((x) => p.concat([x])))); return out; };
/* curvatura gaussiana di una superficie parametrizzata, con le forme fondamentali calcolate per differenze finite */
function curvGauss(X, u, v) {
  const h = 1e-4, sub = (a, b) => a.map((x, i) => x - b[i]), sc = (a, c) => a.map((x) => x * c), dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const Xu = sc(sub(X(u + h, v), X(u - h, v)), 1 / (2 * h)), Xv = sc(sub(X(u, v + h), X(u, v - h)), 1 / (2 * h));
  const Xuu = sc(X(u + h, v).map((x, i) => x - 2 * X(u, v)[i] + X(u - h, v)[i]), 1 / (h * h));
  const Xvv = sc(X(u, v + h).map((x, i) => x - 2 * X(u, v)[i] + X(u, v - h)[i]), 1 / (h * h));
  const Xuv = sc(X(u + h, v + h).map((x, i) => x - X(u + h, v - h)[i] - X(u - h, v + h)[i] + X(u - h, v - h)[i]), 1 / (4 * h * h));
  const N0 = cr(Xu, Xv), nn = Math.sqrt(dot(N0, N0)), N = sc(N0, 1 / nn);
  const E = dot(Xu, Xu), F = dot(Xu, Xv), G = dot(Xv, Xv), L = dot(Xuu, N), M = dot(Xuv, N), NN = dot(Xvv, N);
  return { K: (L * NN - M * M) / (E * G - F * F), dA: Math.sqrt(E * G - F * F) };
}

/* ═══ 4. le verifiche ═══════════════════════════════════════════════════
   { q: 'pezzo univoco della domanda', v: () => valore }        confronto numerico con l'opzione k (e unicità)
   { q, z: () => [re, im] }                                       confronto complesso
   { q, ok: (opzioni, k) => true | 'messaggio' }                  verifica su misura
   tol: tolleranza relativa (default 1e-6); vars: variabili per leggere le opzioni */
const V = [];
const ver = (q, v, tol, rel) => V.push({ q, v, tol, rel });
const verC = (q, z, tol) => V.push({ q, z, tol });
const verOk = (q, ok) => V.push({ q, ok });
/* l'opzione giusta è l'unica che, letta come funzione delle variabili, soddisfa il test */
function unicaFunzione(test) {
  return (r, k) => {
    const esiti = r.map((s) => prova(() => test(s)) === true);
    if (!esiti[k]) return 'l’opzione giusta non supera la verifica';
    const altre = esiti.map((e, i) => (e && i !== k ? i : -1)).filter((i) => i >= 0);
    return altre.length ? 'anche l’opzione ' + altre.map((i) => i + 1).join(', ') + ' supera la verifica' : true;
  };
}
/* l'opzione giusta coincide col testo atteso (calcolato) */
const testo = (calcola) => (r, k) => { const t = calcola(); return r[k] === t ? true : 'calcolato «' + t + '», opzione giusta «' + r[k] + '»'; };

/* — basi — */
ver('|A| = 5, quanti elementi ha l’insieme delle parti', () => { let n = 0; for (let m = 0; m < 32; m++) n++; return n; });
ver('funzioni da un insieme di 3 elementi in un insieme di 4', () => prodotto([0, 1, 2, 3], 3).length);
ver('funzioni iniettive da un insieme di 3 elementi', () => prodotto([0, 1, 2, 3], 3).filter((f) => new Set(f).size === 3).length);
ver('|A| = 10, |B| = 8 e |A ∩ B| = 3', () => { const A = new Set([...Array(10).keys()]), B = new Set([7, 8, 9, 10, 11, 12, 13, 14]); return new Set([...A, ...B]).size; });
ver('quanti elementi ha il prodotto cartesiano A × B', () => [0, 1, 2].flatMap((a) => [0, 1, 2, 3].map((b) => [a, b])).length);
ver('1 + 2 + 3 + … + 100', () => { let s = 0; for (let i = 1; i <= 100; i++) s += i; return s; });
ver('relazioni binarie si possono definire su un insieme di 3', () => 2 ** prodotto([0, 1, 2], 2).length);
ver('estremo superiore dell’insieme {x ∈ ℚ : x² < 2}', () => { let s = 0; for (let q = 1; q <= 2000; q++) { const p = Math.floor(Math.sqrt(2) * q - 1e-12); if (p * p < 2 * q * q) s = Math.max(s, p / q); } return s; }, 1e-3);
const TV = [[0, 0], [0, 1], [1, 0], [1, 1]];
const LOGICA = { '¬Q ⇒ ¬P': (P, Q) => Q || !P, 'Q ⇒ P': (P, Q) => !Q || P, '¬P ⇒ ¬Q': (P, Q) => P || !Q, 'P ∧ ¬Q': (P, Q) => P && !Q, 'P ∨ ¬P': (P) => P || !P, 'P ∧ ¬P': (P) => P && !P, 'P ⇒ ¬P': (P) => !P || !P, '¬P': (P) => !P };
verOk('Quale proposizione è logicamente equivalente a P ⇒ Q', unicaFunzione((s) => TV.every(([P, Q]) => !!LOGICA[s](!!P, !!Q) === (!P || !!Q))));
verOk('Quale di queste formule è una tautologia', unicaFunzione((s) => TV.every(([P, Q]) => !!LOGICA[s](!!P, !!Q))));
verOk('L’implicazione P ⇒ Q è falsa esattamente quando', testo(() => { const f = TV.filter(([P, Q]) => !(!P || Q)); return f.length === 1 && f[0][0] === 1 && f[0][1] === 0 ? 'P è vera e Q è falsa' : '?'; }));
verOk('il complementare di A ∩ B è', (r, k) => {        /* tutte le coppie di sottoinsiemi di un universo di 4 elementi */
  const U = 15, ins = { 'Aᶜ ∪ Bᶜ': (A, B) => (~A | ~B) & U, 'Aᶜ ∩ Bᶜ': (A, B) => ~A & ~B & U, 'A ∪ B': (A, B) => A | B, 'Aᶜ ∩ B': (A, B) => ~A & B & U };
  return unicaFunzione((s) => { for (let A = 0; A <= U; A++) for (let B = 0; B <= U; B++) if (ins[s](A, B) !== (~(A & B) & U)) return false; return true; })(r, k);
});
/* — funz — */
ver('lim<sub>x→0</sub> sin(3x)/x', () => lim0((x) => Math.sin(3 * x) / x));
ver('lim<sub>x→0</sub> (1 − cos x)/x²', () => lim0((x) => (1 - Math.cos(x)) / (x * x), 1e-2));
ver('lim<sub>x→+∞</sub> (1 + 2/x)ˣ', () => limInf((x) => Math.pow(1 + 2 / x, x)));
ver('lim<sub>x→0</sub> (eˣ − 1)/x', () => lim0((x) => Math.expm1(x) / x));
ver('lim<sub>x→+∞</sub> (3x² + 1)/(2x² − x)', () => limInf((x) => (3 * x * x + 1) / (2 * x * x - x)));
ver('lim<sub>x→0⁺</sub> x·ln x', () => 1e-12 * Math.log(1e-12), 1e-9);
ver('lim<sub>x→+∞</sub> (√(x² + x) − x)', () => limInf((x) => x / (Math.sqrt(x * x + x) + x)));
ver('lim<sub>x→0</sub> ln(1 + 4x)/(2x)', () => lim0((x) => Math.log1p(4 * x) / (2 * x)));
ver('lim<sub>x→0</sub> (tan x − x)/x³', () => lim0((x) => (Math.tan(x) - x) / x ** 3, 1e-2));
ver('lim<sub>x→+∞</sub> x^(1/x)', () => Math.pow(1e15, 1e-15), 1e-9);
ver('lim<sub>x→+∞</sub> ln x / x^0,01', () => Math.exp(Math.log(1e5) - 0.01 * 1e5), 1e-9);
ver('lim<sub>x→0</sub> x·sin(1/x)', () => 1e-9 * Math.sin(1e9), 1e-8);
ver('lim<sub>x→0</sub> (2ˣ − 1)/x', () => lim0((x) => (Math.pow(2, x) - 1) / x));
ver('lim<sub>x→1</sub> (x³ − 1)/(x − 1)', () => lim0((h) => ((1 + h) ** 3 - 1) / h));
verOk('parte principale di sin x − x', unicaFunzione((s) => [1e-2, -2e-2].every((x) => vicino(valuta(s, { x }) / (Math.sin(x) - x), 1, 1e-3))));
verOk('Quale di queste funzioni è dispari', unicaFunzione((s) => [0.3, 1.7, 2.2].every((x) => vicino(valuta(s, { x: -x }), -valuta(s, { x }), 1e-12))));
verOk('Il teorema degli zeri garantisce una radice di p(x) = x³ + x − 1', unicaFunzione((s) => { const I = intervallo(s), p = (x) => x ** 3 + x - 1; return p(I.a) * p(I.b) < 0; }));
verOk('Qual è il dominio di f(x) = arcsin(2x)', unicaFunzione((s) => { const I = intervallo(s); const dentro = (x) => Math.abs(2 * x) <= 1; return [-0.6, -0.5, -0.2, 0, 0.5, 0.51, 1.5].every((x) => dentro(x) === (x >= I.a && x <= I.b)) && I.chiusoA && I.chiusoB; }));
verOk('Qual è il dominio di f(x) = ln(x² − 4)', (r, k) => { const ok = [-5, -2.1, -2, 0, 2, 2.1, 7].map((x) => Number.isFinite(Math.log(x * x - 4))); return ok.join() === 'true,true,false,false,false,true,true' && r[k] === 'x < −2 oppure x > 2' ? true : 'dominio'; });
/* — deriv — */
ver('Se f(x) = x²·sin x, quanto vale f′(π)', () => der((x) => x * x * Math.sin(x), Math.PI));
ver('Se f(x) = e^(x²), quanto vale f′(1)', () => der((x) => Math.exp(x * x), 1));
ver('Se f(x) = ln(x² + 1), quanto vale f′(1)', () => der((x) => Math.log(x * x + 1), 1));
ver('Se f(x) = arctan x, quanto vale f′(1)', () => der(Math.atan, 1));
ver('Se f(x) = xˣ (x > 0), quanto vale f′(1)', () => der((x) => Math.pow(x, x), 1));
verOk('retta tangente al grafico di f(x) = x³ nel punto di ascissa 1', unicaFunzione((s) => [0, 2].every((x) => vicino(valuta(lato(s), { x }), 1 + der((t) => t ** 3, 1) * (x - 1), 1e-6))));
ver('Per f(x) = x² su [0, 2], qual è il punto c', () => bisez((c) => der((x) => x * x, c) - (4 - 0) / 2, 0, 2));
ver('lim<sub>x→0</sub> (x − sin x)/x³', () => lim0((x) => (x - Math.sin(x)) / x ** 3, 1e-2));
ver('coefficiente di x⁴ nello sviluppo di Maclaurin di cos x', () => lim0((x) => (Math.cos(x) - 1 + x * x / 2) / x ** 4, 2e-2), 1e-4);
ver('valore massimo di f(x) = x·e⁻ˣ per x ≥ 0', () => { let m = -1; for (let x = 0; x <= 20; x += 1e-4) m = Math.max(m, x * Math.exp(-x)); return m; }, 1e-6);
verOk('In quale punto f(x) = x³ − 3x ha un flesso', unicaFunzione((s) => { const x0 = valuta(lato(s)); const f2 = (x) => der2((t) => t ** 3 - 3 * t, x); return f2(x0 - 0.1) * f2(x0 + 0.1) < 0; }));
ver('minimo di f(x) = x² + 16/x per x > 0', () => { let m = Infinity; for (let x = 0.01; x <= 20; x += 1e-4) m = Math.min(m, x * x + 16 / x); return m; }, 1e-6);
verOk('asintoto obliquo di f(x) = (x² + 1)/x', unicaFunzione((s) => { const f = (x) => (x * x + 1) / x, X = 1e7, m = f(X) / X, q = f(X) - m * X; return [0, 3].every((x) => vicino(valuta(lato(s), { x }), m * x + q, 1e-5)); }));
ver('(f⁻¹)′(2)', () => { const x0 = bisez((x) => x ** 3 + x - 2, 0, 2); return 1 / der((x) => x ** 3 + x, x0); });
verOk('Qual è la derivata di tan x', unicaFunzione((s) => [0.3, 1.1, -0.7].every((x) => vicino(valuta(s, { x }), der(Math.tan, x), 1e-6))));
ver('lim<sub>x→0</sub> (eˣ − 1 − x)/x²', () => lim0((x) => (Math.expm1(x) - x) / (x * x), 1e-2));
verOk('polinomio di Taylor di ordine 2 di ln(1 + x)', unicaFunzione((s) => [1e-3, -1e-3].every((x) => Math.abs(valuta(s, { x }) - Math.log1p(x)) < 1e-8)));
/* — integ — */
ver('Quanto vale ∫₀¹ x² dx', () => integra((x) => x * x, 0, 1));
ver('Quanto vale ∫₀^π sin x dx', () => integra(Math.sin, 0, Math.PI));
ver('Quanto vale ∫₁ᵉ ln x dx', () => integra(Math.log, 1, Math.E));
ver('Quanto vale ∫₀¹ x·eˣ dx', () => integra((x) => x * Math.exp(x), 0, 1));
ver('∫₀^∞ e^(−2x) dx', () => integra((x) => Math.exp(-2 * x), 0, Infinity));
ver('∫₀¹ dx/√x', () => integra((x) => 1 / Math.sqrt(x), 0, 1));
ver('Quanto vale ∫₀¹ dx/(1 + x²)', () => integra((x) => 1 / (1 + x * x), 0, 1));
ver('Quanto vale ∫₀^π sin²x dx', () => integra((x) => Math.sin(x) ** 2, 0, Math.PI));
ver('G(x) = ∫₀^(x²) e^(t²) dt, quanto vale G′(1)', () => der((x) => integra((t) => Math.exp(t * t), 0, x * x), 1, 1e-4), 1e-6);
ver('valor medio di f(x) = x² sull’intervallo [0, 3]', () => integra((x) => x * x, 0, 3) / 3);
ver('area della regione compresa fra le curve y = x e y = x²', () => integra((x) => Math.abs(x - x * x), 0, 1));
ver('ruotando attorno all’asse x il grafico di y = √x', () => integra((x) => Math.PI * x, 0, 1));
ver('lunghezza della curva y = (2/3)x^(3/2)', () => { let L = 0, px = 0, py = 0; const N = 200000; for (let i = 1; i <= N; i++) { const x = 3 * i / N, y = 2 / 3 * x ** 1.5; L += Math.hypot(x - px, y - py); px = x; py = y; } return L; }, 1e-6);
ver('Quanto vale ∫₁^∞ dx/(x(x + 1))', () => integra((x) => 1 / (x * (x + 1)), 1, Infinity));
ver('Quanto vale ∫₀^∞ x·e⁻ˣ dx', () => integra((x) => x * Math.exp(-x), 0, Infinity));
ver('Quanto vale ∫₋₁¹ x³ cos x dx', () => integra((x) => x ** 3 * Math.cos(x), -1, 1), 1e-9);
ver('∫₀^∞ e^(−x²) dx', () => integra((x) => Math.exp(-x * x), 0, Infinity));
ver('Quanto vale ∫₂^∞ dx/(x·ln²x)', () => integra((u) => 1 / (u * u), Math.LN2, Infinity));   /* con x = eᵘ: dx/(x ln²x) = du/u² */
ver('Quanto vale ∫₀¹ x/(x² + 1) dx', () => integra((x) => x / (x * x + 1), 0, 1));
ver('Quanto vale ∫₀² |x − 1| dx', () => integra((x) => Math.abs(x - 1), 0, 1) + integra((x) => Math.abs(x - 1), 1, 2));
verOk('Qual è una primitiva di 1/(x² + 4)', unicaFunzione((s) => [0.2, 1.3, -2].every((x) => vicino(der((t) => valuta(s, { x: t }), x), 1 / (x * x + 4), 1e-6))));
verOk('Quale di questi integrali impropri converge', unicaFunzione((s) => {
  const tab = { '∫₁^∞ dx/x²': [(x) => 1 / x ** 2, 1, 'inf'], '∫₁^∞ dx/x': [(x) => 1 / x, 1, 'inf'], '∫₀¹ dx/x': [(x) => 1 / x, 1, 'zero'], '∫₀¹ dx/x²': [(x) => 1 / x ** 2, 1, 'zero'] }[s];
  const parz = (T) => (tab[2] === 'inf' ? integra(tab[0], 1, T) : integra(tab[0], 1 / T, 1));
  return Math.abs(parz(1e6) - parz(1e3)) < 1e-2;              /* le parziali si stabilizzano solo se converge */
}));
/* — serie — */
const somma = (f, a, N) => { let s = 0; for (let n = N; n >= a; n--) s += f(n); return s; };
ver('Quanto vale la somma ∑ₙ₌₀^∞ (1/3)ⁿ', () => somma((n) => (1 / 3) ** n, 0, 200));
ver('Quanto vale ∑ₙ₌₁^∞ 1/(n(n + 1))', () => somma((n) => 1 / (n * (n + 1)), 1, 1e6) + 1 / 1e6, 1e-9);
ver('Quanto vale ∑ₙ₌₁^∞ 1/n²?', () => somma((n) => 1 / (n * n), 1, 1e6) + 1 / 1e6 - 1 / (2e12), 1e-9);
ver('ⁿ√(n!)/n', () => Math.exp(lgamma(1e9 + 1) / 1e9) / 1e9, 1e-6);
ver('la somma di ∑ₙ₌₁^∞ (−1)ⁿ⁺¹/n', () => { const N = 1e6; const s = somma((n) => (n % 2 ? 1 : -1) / n, 1, N); return s + (N % 2 ? -1 : 1) / (2 * (N + 1)); }, 1e-9);
ver('raggio di convergenza della serie ∑ xⁿ/n!', () => { const n = 1e6, R = 1 / Math.exp(-lgamma(n + 1) / n); return R > 1e5 ? Infinity : R; });
ver('raggio di convergenza della serie ∑ₙ₌₁^∞ 2ⁿxⁿ/n', () => { const n = 1e9; return 1 / Math.exp((n * Math.log(2) - Math.log(n)) / n); }, 1e-6);
ver('Quanto vale ∑ₙ₌₁^∞ n/2ⁿ', () => somma((n) => n / 2 ** n, 1, 200));
ver('Quanto vale ∑ₙ₌₀^∞ 1/n!', () => { let s = 0, t = 1; for (let n = 0; n < 30; n++) { s += t; t /= n + 1; } return s; });
ver('lim<sub>n→∞</sub> (3n² + n)/(n² + 1)', () => limInf((n) => (3 * n * n + n) / (n * n + 1)));
ver('1 − 1/3 + 1/5 − …', () => { const N = 1e6; let s = somma((n) => (n % 2 ? 1 : -1) / (2 * n - 1), 1, N); return s + (N % 2 ? -1 : 1) / (4 * N); }, 1e-8);
ver('Quanto vale ∑ₙ₌₁^∞ 1/n⁴', () => somma((n) => 1 / n ** 4, 1, 1e5) + 1 / (3 * 1e15));
ver('aₙ₊₁ = √(2 + aₙ). Qual è il limite', () => { let a = 1; for (let i = 0; i < 100; i++) a = Math.sqrt(2 + a); return a; });
ver('Quanto vale ∑ₙ₌₁^∞ 1/(4n² − 1)', () => somma((n) => 1 / (4 * n * n - 1), 1, 1e6) + 1 / (4e6), 1e-9);
ver('lim<sub>n→∞</sub> n·sin(1/n)', () => limInf((n) => n * Math.sin(1 / n)));
verOk('insieme di convergenza della serie ∑ₙ₌₁^∞ xⁿ/n', unicaFunzione((s) => {
  const I = intervallo(s), conv = (x) => { const a = somma((n) => x ** n / n, 1, 1e5), b = somma((n) => x ** n / n, 1, 2e5); return Math.abs(a - b) < 1e-3; };
  return I.a === -1 && I.b === 1 && I.chiusoA === conv(-1) && I.chiusoB === conv(1);
}));
/* — multi — */
const parz = (f, p, i) => der((t) => f(p.map((x, j) => (j === i ? t : x))), p[i]);
ver('f(x, y) = x²y + y³, quanto vale ∂f/∂x nel punto (1, 2)', () => parz(([x, y]) => x * x * y + y ** 3, [1, 2], 0));
ver('norma del gradiente di f(x, y) = x² + y² nel punto (1, 1)', () => Math.hypot(parz(([x, y]) => x * x + y * y, [1, 1], 0), parz(([x, y]) => x * x + y * y, [1, 1], 1)));
ver('derivata direzionale di f(x, y) = xy nel punto (1, 2)', () => der((t) => (1 + 0.6 * t) * (2 + 0.8 * t), 0));
verOk('Per f(x, y) = x² − y², il punto (0, 0) è', testo(() => { const f = (x, y) => x * x - y * y; return f(1e-3, 0) > 0 && f(0, 1e-3) < 0 ? 'un punto di sella' : '?'; }));
verOk('Per f(x, y) = x² + xy + y², il punto critico', testo(() => { const f = ([x, y]) => x * x + x * y + y * y; let min = true; for (let a = 0; a < 2 * Math.PI; a += 0.01) if (f([1e-2 * Math.cos(a), 1e-2 * Math.sin(a)]) <= 0) min = false; return min ? 'un minimo' : '?'; }));
ver('∬ x·y dx dy sul quadrato', () => { const N = 1000; let s = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) s += ((i + 0.5) / N) * ((j + 0.5) / N); return s / (N * N); }, 1e-6);
ver('∬ (x² + y²) dx dy sul disco', () => { const N = 3000; let s = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -1 + 2 * (i + 0.5) / N, y = -1 + 2 * (j + 0.5) / N, r2 = x * x + y * y; if (r2 <= 1) s += r2; } return s * 4 / (N * N); }, 2e-3);
verOk('determinante jacobiano del passaggio a coordinate polari', unicaFunzione((s) => [[0.7, 0.4], [2.3, 2.9]].every(([r, t]) => {
  const J = [[der((a) => a * Math.cos(t), r), der((b) => r * Math.cos(b), t)], [der((a) => a * Math.sin(t), r), der((b) => r * Math.sin(b), t)]];
  return vicino(valuta(s, { r, θ: t }), Math.abs(det(J)), 1e-6);
})));
verOk('Nelle coordinate sferiche x = ρ sin φ cos θ', unicaFunzione((s) => [[0.7, 0.4, 1.1], [1.9, 2.5, 4]].every(([R, P, T]) => {
  const X = (r, p, t) => [r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p)];
  const J = [0, 1, 2].map((i) => [der((a) => X(a, P, T)[i], R), der((b) => X(R, b, T)[i], P), der((c) => X(R, P, c)[i], T)]);
  return vicino(valuta(s, { ρ: R, φ: P, θ: T }), Math.abs(det(J)), 1e-6);
})));
ver('∭ (x² + y² + z²) dV sulla palla unitaria', () => { const N = 240; let s = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) { const x = -1 + 2 * (i + 0.5) / N, y = -1 + 2 * (j + 0.5) / N, z = -1 + 2 * (k + 0.5) / N, r2 = x * x + y * y + z * z; if (r2 <= 1) s += r2; } return s * 8 / N ** 3; }, 5e-3);
ver('massimo di f(x, y) = xy sotto il vincolo x + y = 10', () => { let m = -Infinity; for (let x = -20; x <= 30; x += 1e-3) m = Math.max(m, x * (10 - x)); return m; });
ver('minimo di x² + y² sotto il vincolo x + y = 2', () => { let m = Infinity; for (let x = -10; x <= 10; x += 1e-3) m = Math.min(m, x * x + (2 - x) ** 2); return m; });
ver('divergenza di F = (x², y², z²) nel punto (1, 1, 1)', () => [0, 1, 2].reduce((s, i) => s + parz((p) => p[i] ** 2, [1, 1, 1], i), 0));
ver('terza componente del rotore del campo F = (−y, x, 0)', () => parz(([x]) => x, [0.3, 0.7, 0], 0) - parz(([, y]) => -y, [0.3, 0.7, 0], 1));
ver('circolazione ∮ (−y dx + x dy)', () => integra((t) => (-Math.sin(t)) * (-Math.sin(t)) + Math.cos(t) * Math.cos(t), 0, 2 * Math.PI));
ver('φ(x, y, z) = xyz, quanto vale ∫<sub>γ</sub> ∇φ·dr', () => integra((t) => { const p = [t, 2 * t, 3 * t], g = [0, 1, 2].map((i) => parz(([x, y, z]) => x * y * z, p, i)); return g[0] + 2 * g[1] + 3 * g[2]; }, 0, 1));
ver('flusso del campo F = (x, y, z) uscente dalla sfera unitaria', () => { const N = 400; let s = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const p = Math.PI * (i + 0.5) / N, t = 2 * Math.PI * (j + 0.5) / N, n = [Math.sin(p) * Math.cos(t), Math.sin(p) * Math.sin(t), Math.cos(p)]; s += (n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) * Math.sin(p); } return s * (Math.PI / N) * (2 * Math.PI / N); }, 1e-4);
ver('definisce vicino a (3/5, 4/5) una funzione y = g(x)', () => der((x) => Math.sqrt(1 - x * x), 0.6));
ver('lim<sub>(x,y)→(0,0)</sub> x²y/(x² + y²)', () => { let m = 0; for (let a = 0; a < 6.3; a += 0.01) { const x = 1e-9 * Math.cos(a), y = 1e-9 * Math.sin(a); m = Math.max(m, Math.abs(x * x * y / (x * x + y * y))); } return m; }, 1e-6);
ver('laplaciano di f(x, y) = x² − y²', () => der2((x) => x * x - 0.49, 0.3) + der2((y) => 0.09 - y * y, 0.7), 1e-5);
ver('∫₀¹ (∫ᵧ¹ e^(x²) dx) dy', () => integra((y) => integra((x) => Math.exp(x * x), y, 1), 0, 1));
verOk('Il limite lim<sub>(x,y)→(0,0)</sub> xy/(x² + y²)', testo(() => { const f = (x, y) => x * y / (x * x + y * y); return Math.abs(f(1e-9, 1e-9) - f(1e-9, 0)) > 0.1 ? 'non esiste' : '?'; }));
/* — edo — */
ver('Se y′ = 2y e y(0) = 3, quanto vale y(1)', () => rk4((t, y) => [2 * y[0]], 0, [3], 1, 2000)[0]);
ver('Se y′ = x·y e y(0) = 1, quanto vale y(2)', () => rk4((t, y) => [t * y[0]], 0, [1], 2, 4000)[0]);
ver('Se y′ + y = 1 e y(0) = 0, quanto vale y(ln 2)', () => rk4((t, y) => [1 - y[0]], 0, [0], Math.LN2, 1000)[0]);
ver('logistica y′ = y(1 − y) con y(0) = 1/2, quanto vale lim', () => rk4((t, y) => [y[0] * (1 - y[0])], 0, [0.5], 60, 6000)[0], 1e-9);
ver('Se y″ + y = 0, y(0) = 0 e y′(0) = 1, quanto vale y(π/2)', () => rk4((t, y) => [y[1], -y[0]], 0, [0, 1], Math.PI / 2, 2000)[0]);
ver('Se y′ = y·cos x e y(0) = 1, quanto vale y(π/2)', () => rk4((t, y) => [y[0] * Math.cos(t)], 0, [1], Math.PI / 2, 2000)[0]);
ver('Se y′ = 1 + y² e y(0) = 0, quanto vale y(π/4)', () => rk4((t, y) => [1 + y[0] * y[0]], 0, [0], Math.PI / 4, 2000)[0]);
verOk('radici del polinomio caratteristico di y″ − 3y′ + 2y = 0', (r, k) => { const ev = autovalori2([[0, 1], [-2, 3]]).map((z) => z[0]).sort((a, b) => a - b); return unicaFunzione((s) => { const L = lista(s); return L.length === 2 && vicino(L[0], ev[0]) && vicino(L[1], ev[1]); })(r, k); });
/* le soluzioni generali: si sostituiscono costanti qualsiasi e si controlla il residuo dell'equazione */
function residuoEDO(s, eq, cost) {
  return cost.every(([c1, c2]) => [0.3, 1.2, -0.8].every((x) => { const y = (t) => valuta(s, { x: t, c1, c2 }); return Math.abs(eq(y(x), der(y, x, 1e-3), der2(y, x, 1e-3), x)) < 1e-4 * Math.max(1, Math.abs(y(x))); }));
}
verOk('integrale generale di y″ + 4y = 0', unicaFunzione((s) => residuoEDO(s, (y, y1, y2) => y2 + 4 * y, [[0.7, -0.3], [1, 2]])));
verOk('integrale generale di y″ + 2y′ + y = 0', unicaFunzione((s) => residuoEDO(s, (y, y1, y2) => y2 + 2 * y1 + y, [[0.7, -0.3], [1, 2]]) && [[1, 0], [0, 1]].every(([a, b]) => Number.isFinite(valuta(s, { x: 1, c1: a, c2: b })))));
verOk('soluzione particolare di y″ + y = sin x', unicaFunzione((s) => residuoEDO(s, (y, y1, y2, x) => y2 + y - Math.sin(x), [[0, 0]])));
verOk('soluzione particolare di y″ − y = eˣ', unicaFunzione((s) => residuoEDO(s, (y, y1, y2, x) => y2 - y - Math.exp(x), [[0, 0]])));
verOk('wronskiano delle funzioni y₁ = eˣ e y₂ = e^(2x)', unicaFunzione((s) => [0, 0.5, -1].every((x) => vicino(valuta(s, { x }), Math.exp(x) * der((t) => Math.exp(2 * t), x) - der(Math.exp, x) * Math.exp(2 * x), 1e-6))));
verOk('intervallo massimale della soluzione di y′ = y², y(0) = 1', unicaFunzione((s) => {
  const I = intervallo(s); let y = 1, t = 0; const h = 1e-6; while (y < 1e6) { y += h * y * y; t += h; }   /* esplode in avanti vicino a t = 1 */
  let z = 1, u = 0; for (let i = 0; i < 1e5; i++) { z -= 1e-3 * z * z; u -= 1e-3; }                       /* all'indietro resta limitata */
  return Math.abs(I.b - t) < 1e-2 && I.a === -Infinity && z > 0 && z < 1;
}));
verOk('Quanto vale e^(tA) per A = [[0, 1], [0, 0]]', unicaFunzione((s) => [0.7, -1.3].every((t) => { const M = matrice(s, { t }), A = [[0, 1], [0, 0]]; let E = [[1, 0], [0, 1]], P = [[1, 0], [0, 1]]; for (let k = 1; k < 20; k++) { P = [[0, 0], [0, 0]].map((r, i) => r.map((_, j) => (P[i][0] * A[0][j] + P[i][1] * A[1][j]) * t / k)); E = E.map((r, i) => r.map((x, j) => x + P[i][j])); } return matUguali(M, E, 1e-9); })));
verOk('Per il sistema x′ = y, y′ = −x, l’origine è', testo(() => { const ev = autovalori2([[0, 1], [-1, 0]]); return ev.every((z) => Math.abs(z[0]) < 1e-12 && Math.abs(z[1]) > 0) ? 'un centro' : '?'; }));
verOk('Le curve soluzione di dy/dx = −x/y sono', testo(() => { const y = rk4((t, Y) => [-t / Y[0]], 0, [2], 1.5, 3000)[0]; return vicino(1.5 ** 2 + y * y, 4, 1e-8) ? 'circonferenze centrate nell’origine' : '?'; }));
verOk('Per y′ = y(1 − y), quale affermazione sugli equilibri', testo(() => { const g = (y) => y * (1 - y); return der(g, 0) > 0 && der(g, 1) < 0 ? 'y = 0 è instabile e y = 1 è asintoticamente stabile' : '?'; }));
verOk('trasformata di Laplace di f(t) = e^(3t)', unicaFunzione((s) => [5, 7.5].every((sv) => vicino(valuta(s, { s: sv }), integra((t) => Math.exp(-sv * t) * Math.exp(3 * t), 0, Infinity), 1e-6))));
/* — lin — */
ver('determinante della matrice [[2, 1], [3, 4]]', () => det([[2, 1], [3, 4]]));
ver('determinante della matrice triangolare [[1, 2, 3], [0, 4, 5], [0, 0, 6]]', () => det([[1, 2, 3], [0, 4, 5], [0, 0, 6]]));
ver('determinante di [[1, 2, 3], [4, 5, 6], [7, 8, 9]]', () => det([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), 1e-9);
verOk('autovalori della matrice [[2, 1], [1, 2]]', unicaFunzione((s) => { const L = lista(s), ev = autovalori2([[2, 1], [1, 2]]).map((z) => z[0]); return L.length === 2 && vicino(L[0], ev[0]) && vicino(L[1], ev[1]); }));
ver('rango della matrice [[1, 2], [2, 4]]', () => rango([[1, 2], [2, 4]]));
ver('Una matrice A di tipo 3 × 5 ha rango 3', () => { const A = [[1, 0, 0, 1, 2], [0, 1, 0, 3, 4], [0, 0, 1, 5, 6]]; return 5 - rango(A); });
ver('Se A è una matrice 3 × 3 con det A = 5, quanto vale det(2A)', () => { const A = [[5, 1, 2], [0, 1, 7], [0, 0, 1]]; return det(A.map((r) => r.map((x) => 2 * x))); });
ver('Se det A = 4, quanto vale det(A⁻¹)', () => det(inversa([[4, 3], [0, 1]])));
verOk('inversa della matrice [[1, 2], [3, 4]]', unicaFunzione((s) => matUguali(matrice(s), inversa([[1, 2], [3, 4]]), 1e-9)));
ver('Una matrice 3 × 3 ha autovalori 1, 2 e 3', () => det([[1, 5, -2], [0, 2, 7], [0, 0, 3]]));
ver('due sottospazi hanno dimensioni 3 e 4', () => { let mn = 9; for (let prova2 = 0; prova2 < 50; prova2++) { let seme = prova2 + 1; const rnd = () => { seme = (seme * 16807) % 2147483647; return seme / 2147483647 - 0.5; }; const U = [0, 1, 2].map(() => [0, 1, 2, 3, 4].map(rnd)), W = [0, 1, 2, 3].map(() => [0, 1, 2, 3, 4].map(rnd)); mn = Math.min(mn, 3 + 4 - rango(U.concat(W))); } return mn; });
ver('angolo fra i vettori u = (1, 0, 1) e v = (0, 1, 1)', () => Math.acos(1 / (Math.SQRT2 * Math.SQRT2)));
ver('dimensione dello spazio delle matrici reali simmetriche 3 × 3', () => sottoinsiemi(3, 2).length + 3);
verOk('dimensione dello spazio dei polinomi reali di grado al più n', unicaFunzione((s) => [3, 7].every((n) => { const base = []; for (let k = 0; k <= n; k++) base.push([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => x ** k)); return valuta(s, { n }) === rango(base); })));
verOk('autovalori della rotazione del piano di 90°', testo(() => { const ev = autovalori2([[0, -1], [1, 0]]); return vicinoC(ev[0], [0, -1]) && vicinoC(ev[1], [0, 1]) ? 'i e −i' : '?'; }));
verOk('autovalori della matrice [[4, 1], [2, 3]]', unicaFunzione((s) => { const L = lista(s), ev = autovalori2([[4, 1], [2, 3]]).map((z) => z[0]); return vicino(L[0], ev[0]) && vicino(L[1], ev[1]); }));
verOk('I vettori (1, 2, 3), (4, 5, 6), (7, 8, 9) di ℝ³', testo(() => (rango([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) < 3 ? 'sono linearmente dipendenti' : '?')));
verOk('matrice della proiezione ortogonale di ℝ² sulla retta generata da (1, 1)', unicaFunzione((s) => matUguali(matrice(s), [[0.5, 0.5], [0.5, 0.5]], 1e-12)));
verOk('Se una matrice P soddisfa P² = P', testo(() => { const P = [[1, 1], [0, 0]], ev = autovalori2(P).map((z) => z[0]); return vicino(ev[0], 0) && vicino(ev[1], 1) ? 'solo 0 e 1' : '?'; }));
/* — geo — */
ver('distanza del punto (1, 2) dalla retta 3x + 4y − 1 = 0', () => { let m = Infinity; for (let t = -10; t <= 10; t += 1e-5) { const x = t, y = (1 - 3 * t) / 4; m = Math.min(m, Math.hypot(x - 1, y - 2)); } return m; }, 1e-6);
ver('distanza del punto (1, 1, 1) dal piano x + 2y + 2z = 2', () => Math.abs(1 + 2 + 2 - 2) / 3);
verOk('prodotto vettoriale (1, 0, 0) × (0, 1, 0)', unicaFunzione((s) => { const v = vettore(s); return v.length === 3 && v[0] === 0 && v[1] === 0 && v[2] === 1; }));
ver('area del triangolo di vertici (0, 0), (4, 0), (0, 3)', () => Math.abs(4 * 3 - 0 * 0) / 2);
ver('volume del parallelepipedo generato da (1, 0, 0), (0, 2, 0) e (1, 1, 3)', () => Math.abs(det([[1, 0, 0], [0, 2, 0], [1, 1, 3]])));
verOk('Quali sono i fuochi dell’ellisse x²/25 + y²/9 = 1', testo(() => {   /* il c per cui la somma delle distanze dai punti (±c, 0) è costante sull’ellisse */
  let best = 0, err = Infinity;
  for (let c = 0; c <= 5; c += 1e-3) { let mn = Infinity, mx = -Infinity; for (let t = 0; t < 6.3; t += 0.05) { const x = 5 * Math.cos(t), y = 3 * Math.sin(t), d = Math.hypot(x - c, y) + Math.hypot(x + c, y); mn = Math.min(mn, d); mx = Math.max(mx, d); } if (mx - mn < err) { err = mx - mn; best = c; } }
  return '(±' + Math.round(best) + ', 0)';
}));
ver('eccentricità dell’ellisse x²/25 + y²/9 = 1', () => Math.sqrt(25 - 9) / 5);
verOk('fuoco della parabola y = x²/4', unicaFunzione((s) => { const F = vettore(s); return [0.5, 1, 3, -2].every((x) => { const y = x * x / 4; return vicino(Math.hypot(x - F[0], y - F[1]), y + F[1], 1e-12); }); }));
const curvatura = (g, t) => { const d1 = [0, 1, 2].map((i) => der((u) => g(u)[i], t)), d2 = [0, 1, 2].map((i) => der2((u) => g(u)[i], t, 1e-4)); const c = [d1[1] * d2[2] - d1[2] * d2[1], d1[2] * d2[0] - d1[0] * d2[2], d1[0] * d2[1] - d1[1] * d2[0]]; return Math.hypot(...c) / Math.hypot(...d1) ** 3; };
ver('curvatura di una circonferenza di raggio 2', () => curvatura((t) => [2 * Math.cos(t), 2 * Math.sin(t), 0], 0.4), 1e-5);
ver('curvatura della parabola y = x² nell’origine', () => curvatura((t) => [t, t * t, 0], 0), 1e-5);
ver('lunghezza di un giro dell’elica', () => integra((t) => Math.hypot(-Math.sin(t), Math.cos(t), 1), 0, 2 * Math.PI));
ver('curvatura gaussiana di una sfera di raggio 3', () => curvGauss((u, v) => [3 * Math.sin(u) * Math.cos(v), 3 * Math.sin(u) * Math.sin(v), 3 * Math.cos(u)], 0.8, 0.3).K, 1e-4);
ver('curvatura gaussiana di un cilindro circolare di raggio R', () => curvGauss((u, v) => [2 * Math.cos(u), 2 * Math.sin(u), v], 0.8, 0.3).K, 1e-5);
ver('Per il toro, quanto vale l’integrale della curvatura gaussiana', () => { const N = 120; let s = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const u = 2 * Math.PI * (i + 0.5) / N, v = 2 * Math.PI * (j + 0.5) / N, g = curvGauss((a, b) => [(2 + Math.cos(b)) * Math.cos(a), (2 + Math.cos(b)) * Math.sin(a), Math.sin(b)], u, v); s += g.K * g.dA; } return s * (2 * Math.PI / N) ** 2; }, 1e-4);
verOk('piano tangente al paraboloide z = x² + y² nel punto (1, 1, 2)', unicaFunzione((s) => [[0, 0], [2, -1], [1.5, 3]].every(([x, y]) => { const f = (a, b) => a * a + b * b; return vicino(valuta(lato(s), { x, y }), f(1, 1) + der((a) => f(a, 1), 1) * (x - 1) + der((b) => f(1, b), 1) * (y - 1), 1e-6); })));
ver('angolo fra i piani x + y = 0 e x = 0', () => Math.acos(1 / Math.SQRT2));
ver('raggio della circonferenza x² + y² − 4x + 6y = 3', () => { const cx = bisez((x) => 2 * x - 4, -10, 10), cy = bisez((y) => 2 * y + 6, -10, 10); return Math.sqrt(3 - (cx * cx - 4 * cx) - (cy * cy + 6 * cy)); });
verOk('Che conica (non degenere) è xy = 1', testo(() => (1 * 1 - 4 * 0 * 0 > 0 ? 'un’iperbole' : '?')));
verOk('Che conica è x² − y² = 1', testo(() => (0 - 4 * 1 * -1 > 0 ? 'un’iperbole' : '?')));
/* — compl — */
const zv = (s) => valutaC(s);
ver('Quanto vale il modulo |3 + 4i|', () => C.abs([3, 4]));
const verZ = (q, z) => verOk(q, unicaFunzione((s) => vicinoC(zv(s), z(), 1e-9)));
verZ('Quanto vale (1 + i)²', () => C.pow([1, 1], [2, 0]));
verZ('Quanto vale (1 + i)⁸', () => C.pow([1, 1], [8, 0]));
verZ('Quanto vale 1/i', () => C.div([1, 0], [0, 1]));
ver('argomento principale (in (−π, π]) di z = −1 − i', () => Math.atan2(-1, -1));
ver('somma delle n radici n-esime dell’unità', () => { let s = [0, 0]; for (let k = 0; k < 7; k++) s = C.add(s, C.exp([0, 2 * Math.PI * k / 7])); return C.abs(s); }, 1e-9);
ver('soluzioni complesse distinte ha l’equazione z⁵ = 1', () => { const R = []; for (let a = 0; a < 2 * Math.PI; a += 1e-4) { const z = C.exp([0, a]), w = C.pow(z, [5, 0]); if (C.abs(C.sub(w, [1, 0])) < 1e-3 && !R.some((x) => C.abs(C.sub(x, z)) < 0.1)) R.push(z); } return R.length; });
verZ('Quanto vale e^(iπ)', () => C.exp([0, Math.PI]));
ver('parte reale di (2 + i)(3 − i)', () => C.mul([2, 1], [3, -1])[0]);
const contorno = (f, c, r) => { const N = 4000; let s = [0, 0]; for (let j = 0; j < N; j++) { const t = 2 * Math.PI * (j + 0.5) / N, e = C.exp([0, t]), z = C.add(c, C.mul([r, 0], e)), dz = C.mul([0, r * 2 * Math.PI / N], e); s = C.add(s, C.mul(f(z), dz)); } return s; };
verZ('Quanto vale ∮ dz/z lungo la circonferenza |z| = 1', () => contorno((z) => C.div([1, 0], z), [0, 0], 1));
verZ('Quanto vale ∮ dz/(z − 1)² lungo |z| = 2', () => contorno((z) => C.div([1, 0], C.pow(C.sub(z, [1, 0]), [2, 0])), [0, 0], 2));
verZ('residuo di f(z) = 1/(z² + 1) nel punto z = i', () => C.div(contorno((z) => C.div([1, 0], C.add(C.mul(z, z), [1, 0])), [0, 1], 0.5), [0, 2 * Math.PI]));
ver('Quanto vale ∫₋∞^∞ dx/(1 + x²)', () => 2 * integra((x) => 1 / (1 + x * x), 0, Infinity));
verZ('residuo di e^z/z³ in z = 0', () => C.div(contorno((z) => C.div(C.exp(z), C.pow(z, [3, 0])), [0, 0], 1), [0, 2 * Math.PI]));
verZ('Quanto vale il logaritmo principale Log(i)', () => C.log([0, 1]));
verZ('Qual è il valore principale di i^i', () => C.exp(C.mul([0, 1], C.log([0, 1]))));
verZ('Quanto vale ∮ e^z/(z − 1) dz lungo |z| = 3', () => contorno((z) => C.div(C.exp(z), C.sub(z, [1, 0])), [0, 0], 3));
ver('raggio di convergenza della serie di Taylor di 1/(1 + z²)', () => { const a = [1, 0]; for (let n = 2; n <= 2000; n++) a.push(-a[n - 2]); return 1 / Math.pow(Math.abs(a[2000]), 1 / 2000); });
verZ('Quanto vale cos(i)', () => C.mul(C.add(C.exp([-1, 0]), C.exp([1, 0])), [0.5, 0]));
verOk('Che tipo di singolarità ha sin z / z in z = 0', testo(() => { const z = [1e-6, 1e-6], v = C.div(applica('sin', z), z); return C.abs(C.sub(v, [1, 0])) < 1e-9 ? 'eliminabile' : '?'; }));
/* — prob — */
const dadi = (n) => prodotto([1, 2, 3, 4, 5, 6], n);
ver('due dadi equi, qual è la probabilità che la somma sia 7', () => dadi(2).filter((d) => d[0] + d[1] === 7).length / 36);
ver('almeno un 6 in 4 lanci', () => dadi(4).filter((d) => d.includes(6)).length / 6 ** 4);
ver('esattamente 5 teste', () => prodotto([0, 1], 10).filter((s) => s.reduce((a, b) => a + b, 0) === 5).length / 1024);
ver('valore atteso del risultato del lancio di un dado', () => dadi(1).reduce((s, d) => s + d[0], 0) / 6);
ver('varianza del risultato del lancio di un dado', () => { const m = 3.5; return dadi(1).reduce((s, d) => s + (d[0] - m) ** 2, 0) / 6; });
ver('Una malattia ha prevalenza 1 %', () => { const N = 1e6, malati = N * 0.01, veriPos = malati * 0.99, falsiPos = (N - malati) * 0.05; return veriPos / (veriPos + falsiPos); });
ver('legge di Poisson di parametro λ = 2, quanto vale P(X = 0)', () => Math.exp(-2) * 2 ** 0 / 1);
ver('Se X è esponenziale con media 2, quanto vale P(X > 2)', () => integra((x) => 0.5 * Math.exp(-0.5 * x), 2, Infinity));
ver('P(−1,96 ≤ Z ≤ 1,96)', () => integra((x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), -1.96, 1.96), 1e-3);
ver('Se Var X = 5, quanto vale Var(2X + 3)', () => { const v = [-Math.sqrt(5), Math.sqrt(5)].map((x) => 2 * x + 3), m = (v[0] + v[1]) / 2; return ((v[0] - m) ** 2 + (v[1] - m) ** 2) / 2; });
ver('entrambe assi', () => { let f = 0, t = 0; for (let a = 0; a < 52; a++) for (let b = 0; b < 52; b++) if (a !== b) { t++; if (a < 4 && b < 4) f++; } return f / t; });
ver('numero atteso di prove fino al primo successo', () => somma((k) => k * 0.25 * 0.75 ** (k - 1), 1, 400));
ver('varianza di una variabile uniforme su [0, 1]', () => integra((x) => (x - 0.5) ** 2, 0, 1));
ver('Se P(A) = 0,5, P(B) = 0,4 e P(A ∩ B) = 0,2', () => { const A = [0, 1, 2, 3, 4], B = [3, 4, 5, 6]; return new Set([...A, ...B]).size / 10; });
ver('Se X ∼ N(2, 9)', () => integra((x) => x * x * Math.exp(-((x - 2) ** 2) / 18) / (3 * Math.sqrt(2 * Math.PI)), -60, 60), 1e-6);
ver('disuguaglianza di Chebyshev, P(|X − μ| ≥ 2σ)', () => 1 / 2 ** 2);
ver('E[max(X, Y)]', () => integra((x) => integra((y) => Math.max(x, y), 0, x) + integra((y) => Math.max(x, y), x, 1), 0, 1));
ver('Monty Hall', () => { let v = 0, n = 0; for (let auto = 0; auto < 3; auto++) for (let scelta = 0; scelta < 3; scelta++) { const apre = [0, 1, 2].find((p) => p !== auto && p !== scelta), nuova = [0, 1, 2].find((p) => p !== scelta && p !== apre); n++; if (nuova === auto) v++; } return v / n; });
verOk('Per dimezzare la larghezza di un intervallo di confidenza', testo(() => { let n = 1; while (1 / Math.sqrt(n) > 0.5 + 1e-12) n++; return n === 4 ? 'quadruplicata' : '?'; }));
/* — alg — */
ver('Quanto vale MCD(252, 198)', () => gcd(252, 198));
ver('Quanto vale mcm(12, 18)', () => { for (let m = 1; ; m++) if (m % 12 === 0 && m % 18 === 0) return m; });
ver('resto della divisione di 2¹⁰⁰ per 7', () => powmod(2, 100, 7));
ver('inverso di 3 modulo 11', () => [...Array(11).keys()].find((x) => (3 * x) % 11 === 1));
ver('funzione di Eulero φ(36)', () => [...Array(36).keys()].filter((x) => gcd(x + 1, 36) === 1).length);
ver('resto della divisione di 3²⁰²⁶ per 5', () => powmod(3, 2026, 5));
ver('ultima cifra decimale di 7²⁰²⁶', () => powmod(7, 2026, 10));
ver('x ≡ 2 (mod 3) e x ≡ 3 (mod 5)', () => [...Array(15).keys()].find((x) => x % 3 === 2 && x % 5 === 3));
ver('ordine di 2 nel gruppo moltiplicativo (ℤ/7ℤ)*', () => { let k = 1; while (powmod(2, k, 7) !== 1) k++; return k; });
ver('Quanti elementi ha il gruppo simmetrico S₄', () => permutazioni([1, 2, 3, 4]).length);
verOk('Un gruppo di ordine 15 può avere un sottogruppo di ordine', unicaFunzione((s) => 15 % valuta(s) === 0));
ver('Quanti generatori ha il gruppo ciclico (ℤ/12ℤ, +)', () => [...Array(12).keys()].filter((g) => { const vis = new Set(); for (let k = 0; k < 12; k++) vis.add((g * k) % 12); return vis.size === 12; }).length);
ver('Quanti divisori positivi ha 360', () => [...Array(360).keys()].filter((d) => 360 % (d + 1) === 0).length);
ver('Quanto vale MCD(240, 46)', () => gcd(240, 46));
ver('resto della divisione di 6! per 7', () => 720 % 7);
ver('ordine della permutazione (1 2 3)(4 5)', () => { const p = [1, 2, 0, 4, 3]; let q = p.slice(), k = 1; while (q.some((x, i) => x !== i)) { q = q.map((x) => p[x]); k++; } return k; });
ver('Quanti elementi ha il gruppo moltiplicativo (ℤ/15ℤ)*', () => [...Array(15).keys()].filter((x) => gcd(x, 15) === 1).length);
ver('In RSA con p = 3, q = 11', () => { const m = [...Array(33).keys()]; const d = [...Array(20).keys()].find((dd) => dd > 0 && (3 * dd) % 20 === 1); return m.every((x) => powmod(powmod(x, 3, 33), d, 33) === x) ? d : NaN; });
ver('sottogruppi di Sylow di ordine 5 ha un gruppo di ordine 15', () => [1, 3].filter((n) => n % 5 === 1).length === 1 ? 1 : NaN);
verOk('Per quali n l’anello ℤ/nℤ è un campo', testo(() => { const campo = (n) => [...Array(n - 1).keys()].every((a) => [...Array(n).keys()].some((b) => ((a + 1) * b) % n === 1)); const primo = (n) => n > 1 && [...Array(n).keys()].slice(2).every((d) => n % d); return [...Array(40).keys()].slice(2).every((n) => campo(n) === primo(n)) ? 'Per n primo' : '?'; }));
/* — disc — */
ver('coefficiente binomiale C(10, 3)', () => sottoinsiemi(10, 3).length);
ver('anagrammi (anche privi di senso) della parola MAMMA', () => new Set(permutazioni('MAMMA'.split('')).map((p) => p.join(''))).size);
ver('10 persone si stringono la mano', () => sottoinsiemi(10, 2).length);
ver('Quanti lati ha il grafo completo K₆', () => sottoinsiemi(6, 2).length);
ver('Quanti lati ha un albero con 10 vertici', () => { const lati = []; for (let v = 1; v < 10; v++) lati.push([Math.floor(v / 2), v]); return lati.length; });
ver('Un grafo ha 12 lati', () => { const lati = sottoinsiemi(7, 2).slice(0, 12), g = new Array(7).fill(0); lati.forEach(([a, b]) => { g[a]++; g[b]++; }); return g.reduce((s, x) => s + x, 0); });
ver('permutazioni di 4 oggetti senza punti fissi', () => permutazioni([0, 1, 2, 3]).filter((p) => p.every((x, i) => x !== i)).length);
ver('quanto vale F₁₀', () => { let a = 1, b = 1; for (let i = 3; i <= 10; i++) [a, b] = [b, a + b]; return b; });
ver('numero di Catalan C₄', () => prodotto([1, -1], 8).filter((w) => { let s = 0; for (const x of w) { s += x; if (s < 0) return false; } return s === 0; }).length);
ver('x + y + z = 10', () => { let n = 0; for (let x = 0; x <= 10; x++) for (let y = 0; y <= 10 - x; y++) n++; return n; });
ver('coefficiente di x²y³ nello sviluppo di (x + y)⁵', () => prodotto(['x', 'y'], 5).filter((w) => w.filter((c) => c === 'x').length === 2).length);
ver('Quanto vale ∑ₖ₌₀⁸ C(8, k)', () => [0, 1, 2, 3, 4, 5, 6, 7, 8].reduce((s, k) => s + sottoinsiemi(8, k).length, 0));
ver('almeno due siano nate nello stesso mese', () => { for (let n = 1; ; n++) if (n > 12) return n; });
ver('Un grafo planare connesso ha 6 vertici e 10 lati', () => 2 - 6 + 10);
verOk('Quale di questi grafi NON è planare', testo(() => (sottoinsiemi(5, 2).length > 3 * 5 - 6 ? 'K₅' : '?')));
ver('numero cromatico del ciclo C₅', () => { for (let c = 1; c <= 5; c++) if (prodotto([...Array(c).keys()], 5).some((col) => col.every((x, i) => x !== col[(i + 1) % 5]))) return c; });
ver('alberi ricoprenti (con vertici etichettati) ha il grafo completo K₄', () => { const L = sottoinsiemi(4, 2); return sottoinsiemi(L.length, 3).filter((s) => { const p = [0, 1, 2, 3]; const f = (x) => (p[x] === x ? x : (p[x] = f(p[x]))); return s.every((i) => { const [a, b] = L[i], ra = f(a), rb = f(b); if (ra === rb) return false; p[ra] = rb; return true; }); }).length; });
ver('aₙ = 3aₙ₋₁ − 2aₙ₋₂', () => { const a = [0, 1]; for (let n = 2; n <= 10; n++) a.push(3 * a[n - 1] - 2 * a[n - 2]); return a[10]; });
verOk('La formula (P ∨ Q) ∧ ¬P ∧ ¬Q è', testo(() => (TV.some(([P, Q]) => (P || Q) && !P && !Q) ? '?' : 'insoddisfacibile')));
ver('stringhe binarie di lunghezza 6 non contengono due 1 consecutivi', () => prodotto([0, 1], 6).filter((s) => !s.some((x, i) => x && s[i + 1])).length);
ver('funzioni suriettive ci sono da un insieme di 4 elementi', () => prodotto([0, 1], 4).filter((f) => new Set(f).size === 2).length);
ver('partizionare un insieme di 3 elementi', () => { const parts = new Set(); prodotto([0, 1, 2], 3).forEach((f) => { const m = {}; let c = 0; parts.add(f.map((x) => (m[x] == null ? (m[x] = c++) : m[x])).join('')); }); return parts.size; });
/* — num — */
const newton = (x, n) => { for (let i = 0; i < n; i++) x = x - (x * x - 2) / (2 * x); return x; };
ver('Applicando un passo del metodo di Newton a f(x) = x² − 2', () => newton(1, 1));
ver('Continuando il metodo di Newton per x² − 2', () => newton(1, 2));
ver('Con il metodo di bisezione su [0, 1], quanti passi', () => { let n = 0; while (1 / 2 ** n >= 1e-3) n++; return n; });
ver('regola dei trapezi semplice (un solo intervallo) per ∫₀¹ x² dx', () => (0 + 1) / 2);
ver('Cavalieri-Simpson semplice per ∫₀² x³ dx', () => 2 / 6 * (0 + 4 * 1 + 8));
ver('ordine di convergenza del metodo di Newton verso una radice semplice', () => { const e = [0, 1, 2].map((n) => newton(3, n) - Math.SQRT2); return Math.round(Math.log(e[2] / e[1]) / Math.log(e[1] / e[0])); });
verOk('verso una radice doppia', testo(() => { let x = 1; const f = (t) => (t - 0) ** 2 * Math.exp(t), fp = (t) => der(f, t); let r = 0; for (let i = 0; i < 30; i++) { const nx = x - f(x) / fp(x); r = nx / x; x = nx; } return Math.abs(r - 0.5) < 1e-3 ? 'linearmente, con fattore 1/2' : '?'; }));
ver('Eulero esplicito per y′ = y, y(0) = 1, con h = 0,1', () => 1 + 0.1 * 1);
ver('passo h = 0,5, quale approssimazione di y(1)', () => { let y = 1; for (let i = 0; i < 2; i++) y += 0.5 * y; return y; });
ver('numero di condizionamento in norma 2 della matrice diag(1, 100)', () => 100 / 1);
ver('precisione di macchina ε in doppia precisione', () => { let e = 1; while (1 + e / 2 > 1) e /= 2; return e; }, 2e-2, true);
ver('polinomio interpolante dei punti (0, 1), (1, 3), (2, 7)', () => { const P = [[0, 1], [1, 3], [2, 7]], x = 3; return P.reduce((s, [xi, yi], i) => s + yi * P.reduce((p, [xj], j) => (j === i ? p : p * (x - xj) / (xi - xj)), 1), 0); });
verOk('ordine dell’errore della formula dei trapezi composita', testo(() => { const T = (n) => { const h = 1 / n; let s = (Math.exp(0) + Math.exp(1)) / 2; for (let i = 1; i < n; i++) s += Math.exp(i * h); return s * h; }, ex = Math.E - 1, p = Math.log2((T(50) - ex) / (T(100) - ex)); return 'O(h' + ['', '', '²', '³', '⁴'][Math.round(p)] + ')'; }));
verOk('quadratura gaussiana con n nodi', unicaFunzione((s) => { const nodi = [-Math.sqrt(0.6), 0, Math.sqrt(0.6)], pesi = [5 / 9, 8 / 9, 5 / 9]; let g = 0; while ([0, 1, 2, 3, 4, 5, 6, 7].includes(g) && Math.abs(nodi.reduce((a, x, i) => a + pesi[i] * x ** g, 0) - (g % 2 ? 0 : 2 / (g + 1))) < 1e-12) g++; return valuta(s, { n: 3 }) === g - 1; }));
verOk('modo numericamente stabile di calcolare √(x + 1) − √x', unicaFunzione((s) => { const x = 1e15, rif = 1 / (2 * Math.sqrt(x)) * (1 - 1 / (4 * x)); return vicino(valuta(s, { x }), rif, 1e-12); }));
ver('ordine del metodo di Runge-Kutta classico', () => { const err = (n) => Math.abs(rk4((t, y) => [y[0]], 0, [1], 1, n)[0] - Math.E); return Math.round(Math.log2(err(10) / err(20))); });
verOk('Per y′ = −100y, quale condizione sul passo h', unicaFunzione((s) => { const H = valuta(lato(s)); const stabile = (h) => Math.abs(1 - 100 * h) < 1; return stabile(H * 0.999) && !stabile(H * 1.001); }));
ver('approssimando π con 22/7', () => Math.abs(22 / 7 - Math.PI) / Math.PI, 2e-2, true);

/* ═══ 5. esecuzione delle verifiche ═════════════════════════════════════ */
console.log('── verifica calcolata delle risposte ──');
const nq = (s) => S.norm(s);
let fatte = 0;
const usate = new Set();
V.forEach((c) => {
  const trovate = D.quiz.filter((q) => nq(q.d).indexOf(nq(c.q)) >= 0);
  if (trovate.length !== 1) { ko('verifica «' + c.q + '»: trovate ' + trovate.length + ' domande'); return; }
  const q = trovate[0];
  usate.add(q);
  let esito;
  try {
    if (c.ok) esito = c.ok(q.r, q.k);
    else {
      const v = c.v();
      const valori = q.r.map((s) => prova(() => valuta(s)));
      const vic = (a, b) => (c.rel ? a !== undefined && Math.abs(a - b) <= c.tol * Math.abs(b) : vicino(a, b, c.tol));
      if (!vic(valori[q.k], v)) esito = 'calcolato ' + v + ', opzione giusta «' + q.r[q.k] + '» = ' + valori[q.k];
      else {
        const doppie = valori.map((x, i) => (i !== q.k && vic(x, v) ? i : -1)).filter((i) => i >= 0);
        esito = doppie.length ? 'anche l’opzione «' + q.r[doppie[0]] + '» vale ' + v : true;
      }
    }
  } catch (e) { esito = 'errore: ' + e.message; }
  if (esito === true) fatte++; else ko('«' + q.d.replace(/<[^>]*>/g, '') + '»: ' + esito);
});
console.log('  ✓ ' + fatte + ' domande verificate col calcolo su ' + V.length + ' verifiche (' + D.quiz.length + ' domande in tutto)');
const perArgVer = {};
usate.forEach((q) => { perArgVer[q.arg] = (perArgVer[q.arg] || 0) + 1; });
console.log('  per argomento: ' + D.argomenti.map((a) => a.k + ' ' + (perArgVer[a.k] || 0)).join(', '));

if (process.env.ELENCA) D.quiz.filter((q) => !usate.has(q)).forEach((q) => console.log('  · [' + q.arg + '] ' + q.d.replace(/<[^>]*>/g, '') + ' → ' + q.r[q.k] + '   | ' + q.r.filter((x, i) => i !== q.k).join(' | ')));
console.log(errori ? '\n✗ ' + errori + ' problemi' : '\n✓ tutto in ordine');
process.exit(errori ? 1 : 0);
