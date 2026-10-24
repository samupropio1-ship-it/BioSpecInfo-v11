/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-algebra.js — 🔣 strutture algebriche
   BioSpecInfo · © Samuele Pio Provenzano

   · SIMMETRIE DEI POLIGONI: il gruppo diedrale Dₙ (n = 3…8) agisce su un
     poligono colorato; rotazioni e riflessioni animate, la tavola di Cayley
     costruita componendo davvero le permutazioni dei vertici, l'ordine di
     ogni elemento, tutti i sottogruppi, il controllo degli assiomi;
   · PERMUTAZIONI: una permutazione di al piu' 9 elementi scritta in cicli o
     in riga, la decomposizione in cicli disgiunti, il segno, l'ordine come
     mcm delle lunghezze; il gioco del quindici e perche' meta' delle
     posizioni sono irraggiungibili (la parita');
   · ANELLI E CAMPI: la tavola di ℤₙ, unita' e divisori dello zero, ℤₚ e' un
     campo, le radici primitive e il logaritmo discreto; i campi finiti
     GF(4), GF(8), GF(16) costruiti con un polinomio irriducibile su GF(2);
   · LAGRANGE: le classi laterali di un sottogruppo ripartiscono il gruppo
     in blocchi uguali, quindi |H| divide |G|; sinistre e destre coincidono
     solo per i sottogruppi normali.
   I gruppi sono rappresentati dalla loro tavola (indici), cosi' le stesse
   funzioni servono per Dₙ e per ℤₙ.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function campo(pan, et, val, cambia) { var i = F.el('input', { type: 'text', value: val, 'aria-label': F.tt(et), spellcheck: 'false', autocomplete: 'off' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: F.tt(et) })]), i])); i.addEventListener('change', function () { cambia(i.value); }); return i; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  var APICE = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function apice(k) { return String(k).split('').map(function (c) { return APICE[+c]; }).join(''); }
  function mcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var r = a % b; a = b; b = r; } return a; }
  function mcm(a, b) { return a / mcd(a, b) * b; }

  /* ═══ calcoli: gruppi dati dalla tavola ═════════════════════════════════
     Un gruppo e' { m: ordine, nomi: [...], tab: tab[a][b] = indice di a·b, e }.
     In Dₙ l'elemento a·b e' «prima b, poi a» (composizione di funzioni). */
  function componiP(a, b) { return b.map(function (x) { return a[x]; }); }
  /* Dₙ come permutazioni delle posizioni dei vertici: r^k: x ↦ x + k, r^k s: x ↦ k − x */
  function diedrale(n) {
    var perm = [], nomi = [], k, x;
    for (k = 0; k < n; k++) { var p = []; for (x = 0; x < n; x++) p.push((x + k) % n); perm.push(p); nomi.push(k === 0 ? 'e' : k === 1 ? 'r' : 'r' + apice(k)); }
    for (k = 0; k < n; k++) { var q = []; for (x = 0; x < n; x++) q.push(((k - x) % n + n) % n); perm.push(q); nomi.push((k === 0 ? '' : k === 1 ? 'r' : 'r' + apice(k)) + 's'); }
    var indice = {}; perm.forEach(function (p, i) { indice[p.join(',')] = i; });
    var tab = perm.map(function (a) { return perm.map(function (b) { return indice[componiP(a, b).join(',')]; }); });
    return { m: 2 * n, n: n, nomi: nomi, tab: tab, e: 0, perm: perm };
  }
  function ciclico(n) {
    var tab = [], nomi = []; for (var a = 0; a < n; a++) { nomi.push(String(a)); var r = []; for (var b = 0; b < n; b++) r.push((a + b) % n); tab.push(r); }
    return { m: n, n: n, nomi: nomi, tab: tab, e: 0 };
  }
  function ordineElem(G, a) { var x = a, k = 1; while (x !== G.e && k <= G.m) { x = G.tab[x][a]; k++; } return k; }
  function inversoElem(G, a) { for (var b = 0; b < G.m; b++) if (G.tab[a][b] === G.e) return b; return -1; }
  function assiomi(G) {
    var m = G.m, T = G.tab, chiuso = true, ass = true, id = true, inv = true, comm = true, a, b, c;
    for (a = 0; a < m; a++) for (b = 0; b < m; b++) { var v = T[a][b]; if (!(v >= 0 && v < m)) chiuso = false; if (T[a][b] !== T[b][a]) comm = false; }
    if (chiuso) for (a = 0; a < m; a++) for (b = 0; b < m; b++) for (c = 0; c < m; c++) if (T[T[a][b]][c] !== T[a][T[b][c]]) ass = false;
    for (a = 0; a < m; a++) { if (T[G.e][a] !== a || T[a][G.e] !== a) id = false; if (inversoElem(G, a) < 0) inv = false; }
    return { chiuso: chiuso, associativo: ass, identita: id, inversi: inv, commutativo: comm };
  }
  /* il sottogruppo generato: si moltiplica finche' l'insieme non cresce piu' */
  function generato(G, gen) {
    var dentro = {}, lista = [G.e]; dentro[G.e] = 1;
    gen.forEach(function (g) { if (!dentro[g]) { dentro[g] = 1; lista.push(g); } });
    for (var i = 0; i < lista.length; i++) for (var j = 0; j <= i; j++) [G.tab[lista[i]][lista[j]], G.tab[lista[j]][lista[i]]].forEach(function (v) { if (!dentro[v]) { dentro[v] = 1; lista.push(v); } });
    return lista.sort(function (x, y) { return x - y; });
  }
  /* tutti i sottogruppi: in Dₙ e ℤₙ ogni sottogruppo e' generato da al piu' due elementi */
  function sottogruppi(G) {
    var visti = {}, out = [];
    for (var a = 0; a < G.m; a++) for (var b = a; b < G.m; b++) { var H = generato(G, [a, b]), k = H.join(','); if (!visti[k]) { visti[k] = 1; out.push(H); } }
    return out.sort(function (x, y) { if (x.length !== y.length) return x.length - y.length; for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; });
  }
  function classi(G, H, destra) {
    var preso = new Array(G.m).fill(false), out = [];
    for (var g = 0; g < G.m; g++) { if (preso[g]) continue; var C = H.map(function (h) { return destra ? G.tab[h][g] : G.tab[g][h]; }).sort(function (x, y) { return x - y; }); C.forEach(function (x) { preso[x] = true; }); out.push(C); }
    return out;
  }
  function normale(G, H) {
    var s = classi(G, H, false).map(function (c) { return c.join(','); }).sort().join('|'), d = classi(G, H, true).map(function (c) { return c.join(','); }).sort().join('|');
    return s === d;
  }

  /* ═══ calcoli: permutazioni (vettori con indici da 0) ════════════════════ */
  function cicli(p) {
    var visto = new Array(p.length).fill(false), out = [];
    for (var i = 0; i < p.length; i++) { if (visto[i]) continue; var c = [], j = i; while (!visto[j]) { visto[j] = true; c.push(j); j = p[j]; } out.push(c); }
    return out;
  }
  function segno(p) { return (p.length - cicli(p).length) % 2 ? -1 : 1; }
  function inversioni(p) { var s = 0; for (var i = 0; i < p.length; i++) for (var j = i + 1; j < p.length; j++) if (p[i] > p[j]) s++; return s; }
  function ordineP(p) { return cicli(p).reduce(function (a, c) { return mcm(a, c.length); }, 1); }
  function tipoCiclo(p) { return cicli(p).map(function (c) { return c.length; }).sort(function (a, b) { return b - a; }); }
  function scriviCicli(p) { var s = cicli(p).filter(function (c) { return c.length > 1; }).map(function (c) { return '(' + c.map(function (x) { return x + 1; }).join(' ') + ')'; }).join(''); return s || 'e'; }
  function identitaP(n) { var p = []; for (var i = 0; i < n; i++) p.push(i); return p; }
  function potenzaP(p, k) { var r = identitaP(p.length); for (var i = 0; i < k; i++) r = componiP(p, r); return r; }
  /* «(1 2 3)(4 5)» in cicli (composti da destra a sinistra) oppure «2 3 1 5 4» in riga */
  function leggiPermutazione(s, n) {
    s = String(s || '').trim(); var p = identitaP(n);
    if (!s || s === 'e') return p;
    if (s.indexOf('(') >= 0) {
      var gruppi = s.match(/\(([^)]*)\)/g); if (!gruppi) return null;
      for (var g = gruppi.length - 1; g >= 0; g--) {
        var c = gruppi[g].replace(/[()]/g, '').split(/[\s,]+/).filter(Boolean).map(Number);
        if (c.some(function (x) { return !(x >= 1 && x <= n && x === Math.floor(x)); })) return null;
        if (c.length !== new Set(c).size) return null;
        var q = identitaP(n); for (var i = 0; i < c.length; i++) q[c[i] - 1] = c[(i + 1) % c.length] - 1;
        p = componiP(q, p);
      }
      return p;
    }
    var v = s.split(/[\s,]+/).filter(Boolean).map(Number);
    if (v.length !== n) return null;
    var r = v.map(function (x) { return x - 1; });
    if (r.some(function (x) { return !(x >= 0 && x < n && x === Math.floor(x)); }) || new Set(r).size !== n) return null;
    return r;
  }
  function fattoriale(n) { var f = 1; for (var i = 2; i <= n; i++) f *= i; return f; }
  function partizioni(n, max) { if (max === undefined) max = n; if (n === 0) return [[]]; var out = []; for (var k = Math.min(n, max); k >= 1; k--) partizioni(n - k, k).forEach(function (r) { out.push([k].concat(r)); }); return out; }
  /* quante permutazioni di Sₙ hanno un dato tipo: n! / ∏ k^(m_k) m_k! */
  function contaTipi(n) {
    return partizioni(n).map(function (tipo) {
      var m = {}; tipo.forEach(function (k) { m[k] = (m[k] || 0) + 1; });
      var den = 1; Object.keys(m).forEach(function (k) { den *= Math.pow(+k, m[k]) * fattoriale(m[k]); });
      return { tipo: tipo, conteggio: fattoriale(n) / den };
    });
  }
  function tuttePermutazioni(n) {
    var a = identitaP(n), c = new Array(n).fill(0), out = [a.slice()], i = 0;
    while (i < n) { if (c[i] < i) { var j = i % 2 ? c[i] : 0, tmp = a[j]; a[j] = a[i]; a[i] = tmp; out.push(a.slice()); c[i]++; i = 0; } else { c[i] = 0; i++; } }
    return out;
  }
  /* il gioco del quindici (lato w, 0 = casella vuota, obiettivo 1, 2, …, vuota in basso a destra).
     Regola delle inversioni: w dispari → risolvibile se le inversioni sono pari;
     w pari → se inversioni + riga della vuota contata dal basso (1, 2, …) e' dispari */
  function risolvibile(b, w) {
    var v = b.filter(function (x) { return x !== 0; }), inv = inversioni(v);
    if (w % 2) return inv % 2 === 0;
    var rigaDalBasso = w - Math.floor(b.indexOf(0) / w);
    return (inv + rigaDalBasso) % 2 === 1;
  }
  function posizioneCasuale(seme, w) {
    var r = mulberry32(seme), N = w * w, b = []; for (var i = 1; i < N; i++) b.push(i); b.push(0);
    for (i = N - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), tmp = b[i]; b[i] = b[j]; b[j] = tmp; }
    return b;
  }

  /* ═══ calcoli: aritmetica modulare e campi finiti ═══════════════════════ */
  function potMod(b, e, m) { var r = 1 % m; b %= m; while (e > 0) { if (e & 1) r = r * b % m; b = b * b % m; e = Math.floor(e / 2); } return r; }
  function phi(n) { var r = n, x = n; for (var p = 2; p * p <= x; p++) if (x % p === 0) { while (x % p === 0) x /= p; r -= r / p; } if (x > 1) r -= r / x; return r; }
  function unita(n) { var u = []; for (var a = 1; a < n; a++) if (mcd(a, n) === 1) u.push(a); if (n === 1) u.push(0); return u; }
  function divisoriZero(n) { var z = []; for (var a = 1; a < n; a++) { for (var b = 1; b < n; b++) if (a * b % n === 0) { z.push(a); break; } } return z; }
  function ordineMod(a, n) { if (mcd(a, n) !== 1) return 0; var x = a % n, k = 1; while (x !== 1 % n) { x = x * a % n; k++; if (k > n) return 0; } return k; }
  function radiciPrimitive(n) { var f = phi(n); return unita(n).filter(function (a) { return ordineMod(a, n) === f; }); }
  function primo(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  /* tabelle di log discreto in base g: pot[k] = g^k, log[a] = k */
  function logDiscreto(g, n) { var f = phi(n), pot = [], log = {}, x = 1 % n; for (var k = 0; k < f; k++) { pot.push(x); if (log[x] === undefined) log[x] = k; x = x * g % n; } return { pot: pot, log: log }; }
  /* GF(2^k): elementi = polinomi su GF(2) come bit (b0 = termine noto); prodotto ridotto modulo il polinomio */
  function mulGF(a, b, poli, k) { var r = 0; while (b) { if (b & 1) r ^= a; b >>= 1; a <<= 1; if (a & (1 << k)) a ^= poli; } return r; }
  function gradoP(p) { var g = -1; while (p >> (g + 1)) g++; return g; }
  function restoP(a, b) { var gb = gradoP(b); while (a && gradoP(a) >= gb) a ^= b << (gradoP(a) - gb); return a; }
  /* irriducibile se nessun polinomio di grado 1 … ⌊k/2⌋ lo divide */
  function irriducibile(poli) { var k = gradoP(poli); for (var d = 2; d < (1 << (Math.floor(k / 2) + 1)); d++) if (restoP(poli, d) === 0) return false; return k >= 1; }
  function polinomio(a) { if (!a) return '0'; var s = []; for (var i = gradoP(a); i >= 0; i--) if (a >> i & 1) s.push(i === 0 ? '1' : i === 1 ? 'x' : 'x' + apice(i)); return s.join('+'); }
  function campoGF(k, poli) {
    var q = 1 << k, add = [], mul = [];
    for (var a = 0; a < q; a++) { add.push([]); mul.push([]); for (var b = 0; b < q; b++) { add[a].push(a ^ b); mul[a].push(mulGF(a, b, poli, k)); } }
    var nomi = []; for (a = 0; a < q; a++) nomi.push(polinomio(a));
    return { q: q, k: k, poli: poli, add: add, mul: mul, nomi: nomi };
  }
  /* una tavola moltiplicativa e' di un campo se ogni elemento ≠ 0 ha l'inverso */
  function ogniNonNulloInvertibile(mul, uno) { for (var a = 1; a < mul.length; a++) if (mul[a].indexOf(uno) < 0) return false; return true; }
  var POLINOMI = { gf4: [2, 7], gf8: [3, 11], gf8b: [3, 13], gf16: [4, 19] };
  F.calcolo.algebra = { componiP: componiP, diedrale: diedrale, ciclico: ciclico, ordineElem: ordineElem, inversoElem: inversoElem, assiomi: assiomi, generato: generato, sottogruppi: sottogruppi, classi: classi, normale: normale,
    cicli: cicli, segno: segno, inversioni: inversioni, ordineP: ordineP, tipoCiclo: tipoCiclo, scriviCicli: scriviCicli, potenzaP: potenzaP, leggiPermutazione: leggiPermutazione, contaTipi: contaTipi, tuttePermutazioni: tuttePermutazioni, risolvibile: risolvibile, posizioneCasuale: posizioneCasuale,
    mcd: mcd, mcm: mcm, potMod: potMod, phi: phi, unita: unita, divisoriZero: divisoriZero, ordineMod: ordineMod, radiciPrimitive: radiciPrimitive, primo: primo, logDiscreto: logDiscreto, mulGF: mulGF, irriducibile: irriducibile, polinomio: polinomio, campoGF: campoGF, ogniNonNulloInvertibile: ogniNonNulloInvertibile, POLINOMI: POLINOMI, mulberry32: mulberry32 };

  /* ═══ disegno di una tavola (Cayley, ℤₙ, campi) ═════════════════════════ */
  function disegnaTavola(cv, nomiR, nomiC, val, colore, opz) {
    opz = opz || {};
    var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, nr = nomiR.length, nc = nomiC.length, m0 = Math.min(34, Math.max(18, W * 0.07));
    var cw = (W - m0 - 4) / nc, ch = (H - m0 - 4) / nr, fs = Math.max(7, Math.min(13, Math.min(cw, ch) * 0.42));
    q.font = fs + 'px system-ui,sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle';
    for (var j = 0; j < nc; j++) { q.fillStyle = opz.colC ? opz.colC(j) : '#9fb1c6'; if (cw > 9) q.fillText(nomiC[j], m0 + (j + 0.5) * cw, m0 / 2); }
    for (var i = 0; i < nr; i++) {
      q.fillStyle = opz.colR ? opz.colR(i) : '#9fb1c6'; if (ch > 9) q.fillText(nomiR[i], m0 / 2, m0 + (i + 0.5) * ch);
      for (j = 0; j < nc; j++) {
        var v = val(i, j); q.fillStyle = colore(v, i, j); q.fillRect(m0 + j * cw + 0.5, m0 + i * ch + 0.5, cw - 1, ch - 1);
        if (cw > 15 && ch > 12 && opz.testo) { q.fillStyle = '#081522'; q.fillText(opz.testo(v), m0 + (j + 0.5) * cw, m0 + (i + 0.5) * ch); }
      }
    }
    if (opz.evid != null) { q.strokeStyle = '#e6fffb'; q.lineWidth = 2; q.strokeRect(m0, m0 + opz.evid * ch, nc * cw, ch); q.lineWidth = 1; }
    q.textBaseline = 'alphabetic'; q.textAlign = 'left';
    cv.setAttribute('aria-label', F.tt(opz.descr || ['tavola dell’operazione', 'operation table']));
  }
  function colDiedro(k, n) { return k < n ? 'hsl(' + Math.round(165 + 60 * k / n) + ',65%,' + (62 - 18 * k / n) + '%)' : 'hsl(' + Math.round(8 + 40 * (k - n) / n) + ',90%,' + (66 - 14 * (k - n) / n) + '%)'; }
  var COLV = ['#ff8a80', '#ffc45a', '#5eead4', '#6bcfff', '#c9b9ff', '#ffd24a', '#a8e07a', '#ff6b9d', '#7c9cff'];

  /* ═══ 1. simmetrie dei poligoni ═════════════════════════════════════════ */
  function schedaDiedro(div) {
    var Gp = griglia(div), st = { n: 5, cur: 0, parola: '' }, info = nota(Gp.pan), G, SG, anim = null;
    F.cursore(Gp.pan, ['lati del poligono n', 'polygon sides n'], 3, 8, 1, st.n, function (v) { st.n = v; nuovo(); });
    F.bottone(Gp.pan, ['↻ r (rotazione)', '↻ r (rotation)'], function () { applica(1); });
    F.bottone(Gp.pan, ['⇋ s (riflessione)', '⇋ s (reflection)'], function () { applica(st.n); });
    F.bottone(Gp.pan, ['Torna a e', 'Back to e'], function () { st.cur = 0; st.parola = ''; anim = null; testo(); tavola(); ctl.sveglia(); });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.75), ctl, ct = F.tela(Gp.dx, 1); ct.style.maxWidth = '520px';
    function nuovo() { G = diedrale(st.n); SG = sottogruppi(G); st.cur = 0; st.parola = ''; anim = null; testo(); tavola(); if (ctl) ctl.sveglia(); }
    function applica(g) { if (anim) { st.cur = G.tab[anim.g][st.cur]; } anim = { g: g, f: 0 }; st.parola = (g === 1 ? 'r' : 's') + st.parola; if (st.parola.length > 24) st.parola = st.parola.slice(0, 24) + '…'; ctl.sveglia(); }
    function tavola() {
      disegnaTavola(ct, G.nomi, G.nomi, function (i, j) { return G.tab[i][j]; }, function (v) { return colDiedro(v, st.n); }, { testo: function (v) { return G.nomi[v]; }, colR: function (i) { return i < st.n ? '#5eead4' : '#ffc45a'; }, colC: function (j) { return j < st.n ? '#5eead4' : '#ffc45a'; }, evid: st.cur, descr: ['tavola di Cayley del gruppo diedrale', 'Cayley table of the dihedral group'] });
    }
    function testo() {
      var A = assiomi(G), ord = G.nomi.map(function (nm, i) { return nm + ':' + ordineElem(G, i); }), c = st.cur, n = st.n;
      var cont = 0; for (var a = 0; a < G.m; a++) for (var b = 0; b < G.m; b++) if (G.tab[a][b] !== G.tab[b][a]) cont++;
      info.innerHTML = t('Elemento attuale ', 'Current element ') + '<b class="bsiFX-num">' + G.nomi[c] + '</b> (' + t('ordine ', 'order ') + ordineElem(G, c) + ')' + (st.parola ? ' = ' + st.parola + t(' (da destra a sinistra)', ' (right to left)') : '') +
        '<br>|D' + '₃₄₅₆₇₈'[n - 3] + '| = 2n = <b>' + G.m + '</b> · ' + t('ordini: ', 'orders: ') + ord.join(' ') +
        '<br>' + t('Assiomi: chiusura ', 'Axioms: closure ') + (A.chiuso ? '✓' : '✗') + ' · ' + t('associatività ', 'associativity ') + (A.associativo ? '✓' : '✗') + ' · ' + t('neutro ', 'identity ') + (A.identita ? '✓' : '✗') + ' · ' + t('inversi ', 'inverses ') + (A.inversi ? '✓' : '✗') + ' · ' + t('commutativo: ', 'commutative: ') + (A.commutativo ? t('sì', 'yes') : t('no (', 'no (') + cont + t(' coppie con ab ≠ ba, es. rs = ', ' pairs with ab ≠ ba, e.g. rs = ') + G.nomi[G.tab[1][n]] + t(' ma sr = ', ' but sr = ') + G.nomi[G.tab[n][1]] + ')') +
        '<br>' + SG.length + t(' sottogruppi (τ(n) + σ(n) = ', ' subgroups (τ(n) + σ(n) = ') + tauSigma(n) + '): ' + SG.map(function (H) { return '{' + H.map(function (h) { return G.nomi[h]; }).join(',') + '}'; }).join(' ') +
        '<br>' + t('Le n rotazioni rᵏ e le n riflessioni rᵏs sono tutte le isometrie che riportano il poligono su sé stesso. Relazioni: rⁿ = s² = e, srs = r⁻¹, quindi sr = r⁻¹s ≠ rs per n ≥ 3. Nella tavola (riga a, colonna b, casella a·b = «prima b, poi a») ogni elemento compare una sola volta per riga e per colonna (quadrato latino): è la cancellazione. Il quadrante rotazione·rotazione è ℤₙ, il sottogruppo normale di indice 2. La freccia sul poligono mostra l’orientazione: le riflessioni la invertono.', 'The n rotations rᵏ and the n reflections rᵏs are all the isometries mapping the polygon onto itself. Relations: rⁿ = s² = e, srs = r⁻¹, hence sr = r⁻¹s ≠ rs for n ≥ 3. In the table (row a, column b, cell a·b = “first b, then a”) each element appears once per row and column (a Latin square): that is cancellation. The rotation·rotation block is ℤₙ, the normal subgroup of index 2. The arrow on the polygon shows the orientation: reflections reverse it.');
    }
    function tauSigma(n) { var s = 0, c = 0; for (var d = 1; d <= n; d++) if (n % d === 0) { s += d; c++; } return s + c; }
    nuovo();
    ctl = F.anima(cv, function (dt) {
      var n = st.n, perm = G.perm[st.cur], P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.38, rot = 0, sx = 1;
      if (anim) { anim.f = Math.min(1, anim.f + dt * 1.6); var e = 0.5 - 0.5 * Math.cos(Math.PI * anim.f); if (anim.g === 1) rot = e * 2 * Math.PI / n; else sx = Math.cos(Math.PI * e); }
      /* l'etichetta k sta nella posizione perm[k]; la posizione p ha angolo −π/2 + 2πp/n */
      function punto(p) { var a = -Math.PI / 2 + 2 * Math.PI * p / n + rot; return [cx + R * Math.cos(a) * sx, cy + R * Math.sin(a)]; }
      q.strokeStyle = 'rgba(201,211,223,.25)'; q.setLineDash([4, 4]);
      if (anim && anim.g !== 1) { q.beginPath(); q.moveTo(cx, cy - R - 14); q.lineTo(cx, cy + R + 14); q.stroke(); }
      q.setLineDash([]);
      var pos = []; for (var k = 0; k < n; k++) pos[perm[k]] = k;
      q.beginPath(); for (var p = 0; p < n; p++) { var Pp = punto(p); if (p) q.lineTo(Pp[0], Pp[1]); else q.moveTo(Pp[0], Pp[1]); } q.closePath();
      q.fillStyle = sx * (st.cur < n ? 1 : -1) >= 0 ? 'rgba(94,234,212,.16)' : 'rgba(255,196,90,.16)'; q.fill(); q.strokeStyle = '#5eead4'; q.lineWidth = 2; q.stroke(); q.lineWidth = 1;
      /* spicchi colorati: dal centro al lato fra l'etichetta k e k+1 */
      for (k = 0; k < n; k++) { var A = punto(perm[k]), B = punto(perm[(k + 1) % n]); q.fillStyle = COLV[k % COLV.length]; q.globalAlpha = 0.35; q.beginPath(); q.moveTo(cx, cy); q.lineTo(A[0], A[1]); q.lineTo(B[0], B[1]); q.closePath(); q.fill(); q.globalAlpha = 1; }
      /* freccia d'orientazione dal vertice 1 verso il 2 */
      var A1 = punto(perm[0]), B1 = punto(perm[1]), mx = A1[0] + (B1[0] - A1[0]) * 0.55, my = A1[1] + (B1[1] - A1[1]) * 0.55, ang = Math.atan2(B1[1] - A1[1], B1[0] - A1[0]);
      q.strokeStyle = '#ffd24a'; q.lineWidth = 3; q.beginPath(); q.moveTo(A1[0] + (B1[0] - A1[0]) * 0.15, A1[1] + (B1[1] - A1[1]) * 0.15); q.lineTo(mx, my); q.stroke();
      q.fillStyle = '#ffd24a'; q.beginPath(); q.moveTo(mx + 9 * Math.cos(ang), my + 9 * Math.sin(ang)); q.lineTo(mx + 9 * Math.cos(ang + 2.5), my + 9 * Math.sin(ang + 2.5)); q.lineTo(mx + 9 * Math.cos(ang - 2.5), my + 9 * Math.sin(ang - 2.5)); q.fill(); q.lineWidth = 1;
      q.font = 'bold 14px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle';
      for (k = 0; k < n; k++) { var V = punto(perm[k]); q.fillStyle = COLV[k % COLV.length]; q.beginPath(); q.arc(V[0], V[1], 12, 0, Math.PI * 2); q.fill(); q.fillStyle = '#081522'; q.fillText(String(k + 1), V[0], V[1] + 1); }
      q.textBaseline = 'alphabetic'; q.textAlign = 'left'; q.fillStyle = '#c9d3df'; q.font = '13px system-ui'; q.fillText(G.nomi[st.cur], 10, 20);
      cv.setAttribute('aria-label', t('poligono regolare e simmetria ', 'regular polygon and symmetry ') + G.nomi[st.cur]);
      if (anim && anim.f >= 1) { st.cur = G.tab[anim.g][st.cur]; anim = null; testo(); tavola(); }
      if (!anim) return false;
    }, { ricomincia: function () { } });
    F.alRidimensiona(function () { tavola(); ctl.sveglia(); });
  }

  /* ═══ 2. permutazioni e gioco del quindici ═════════════════════════════ */
  function schedaPermutazioni(div) {
    var Gp = griglia(div), st = { n: 7, p: null, k: 1, seme: 4, gioco: null, mosse: 0 }, info = nota(Gp.pan), info2 = F.el('div', { 'class': 'bsiFX-nota' }), tipi = F.el('div', { style: 'overflow-x:auto' });
    var inpN = F.cursore(Gp.pan, ['elementi n', 'elements n'], 2, 9, 1, st.n, function (v) { st.n = v; st.p = leggiPermutazione(campoP.value, v) || casuale(); st.k = 1; tutto(); });
    var campoP = campo(Gp.pan, ['σ in cicli «(1 2 3)(4 5)» o in riga «2 3 1 5 4 …»', 'σ in cycles “(1 2 3)(4 5)” or one-line “2 3 1 5 4 …”'], '(1 2 3)(4 5)', function (v) { var p = leggiPermutazione(v, st.n); if (p) { st.p = p; st.k = 1; } tutto(!p); });
    F.bottone(Gp.pan, ['Casuale', 'Random'], function () { st.seme++; st.p = casuale(); campoP.value = scriviCicli(st.p); st.k = 1; tutto(); });
    F.bottone(Gp.pan, ['Potenza successiva σᵏ', 'Next power σᵏ'], function () { st.k = st.k % ordineP(st.p) + 1; tutto(); });
    Gp.pan.appendChild(info); Gp.pan.appendChild(tipi);
    function casuale() { var r = mulberry32(st.seme * 7919), p = identitaP(st.n); for (var i = st.n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = p[i]; p[i] = p[j]; p[j] = x; } return p; }
    st.p = leggiPermutazione('(1 2 3)(4 5)', st.n);
    var cv = F.tela(Gp.dx, 0.5);
    var bar = F.el('div'); Gp.dx.appendChild(bar);
    F.bottone(bar, ['Nuova posizione del 15', 'New 15-puzzle position'], function () { st.seme++; st.gioco = posizioneCasuale(st.seme, 4); st.mosse = 0; quindici(); });
    F.bottone(bar, ['Loyd: scambia 14 e 15', 'Loyd: swap 14 and 15'], function () { st.gioco = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0]; st.mosse = 0; quindici(); });
    var cq = F.tela(Gp.dx, 1); cq.style.maxWidth = '340px'; cq.style.margin = '0 auto';
    Gp.dx.appendChild(info2);
    st.gioco = posizioneCasuale(st.seme, 4);
    cq.addEventListener('click', function (ev) {
      var r = cq.getBoundingClientRect(); if (!r.width) return;
      var c = Math.floor((ev.clientX - r.left) / r.width * 4), rg = Math.floor((ev.clientY - r.top) / r.height * 4), i = rg * 4 + c, z = st.gioco.indexOf(0), zr = Math.floor(z / 4), zc = z % 4;
      if (c < 0 || c > 3 || rg < 0 || rg > 3) return;
      if (Math.abs(zr - rg) + Math.abs(zc - c) === 1) { st.gioco[z] = st.gioco[i]; st.gioco[i] = 0; st.mosse++; quindici(); }
    });
    function frecce() {
      var n = st.n, p = potenzaP(st.p, st.k), P = F.pennello(cv), q = P.q, W = P.W, H = P.H, dx = (W - 40) / Math.max(1, n - 1), y0 = 30, y1 = H - 30, C = cicli(p), col = [];
      C.forEach(function (c, k) { c.forEach(function (x) { col[x] = c.length === 1 ? '#5b6b80' : COLV[k % COLV.length]; }); });
      q.lineWidth = 2;
      for (var i = 0; i < n; i++) { var xa = 20 + i * dx, xb = 20 + p[i] * dx; q.strokeStyle = col[i]; q.beginPath(); q.moveTo(xa, y0 + 12); q.bezierCurveTo(xa, (y0 + y1) / 2, xb, (y0 + y1) / 2, xb, y1 - 14); q.stroke(); q.fillStyle = col[i]; q.beginPath(); q.moveTo(xb, y1 - 12); q.lineTo(xb - 5, y1 - 21); q.lineTo(xb + 5, y1 - 21); q.fill(); }
      q.lineWidth = 1; q.font = 'bold 13px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle';
      for (i = 0; i < n; i++) { [y0, y1].forEach(function (y) { q.fillStyle = col[i]; q.beginPath(); q.arc(20 + i * dx, y, 11, 0, Math.PI * 2); q.fill(); q.fillStyle = '#081522'; q.fillText(String(i + 1), 20 + i * dx, y + 1); }); }
      q.textBaseline = 'alphabetic'; q.textAlign = 'left';
      cv.setAttribute('aria-label', t('diagramma a frecce della permutazione ', 'arrow diagram of the permutation ') + scriviCicli(p));
    }
    function quindici() {
      var b = st.gioco, P = F.pennello(cq), q = P.q, W = P.W, H = P.H, s = Math.min(W, H) / 4, ok = risolvibile(b, 4), fatto = b.every(function (x, i) { return x === (i + 1) % 16; });
      q.font = 'bold ' + Math.round(s * 0.36) + 'px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle';
      for (var i = 0; i < 16; i++) { var x = (i % 4) * s, y = Math.floor(i / 4) * s; if (!b[i]) continue; var giusto = b[i] === i + 1; q.fillStyle = giusto ? 'rgba(94,234,212,.75)' : 'rgba(107,207,255,.35)'; q.fillRect(x + 3, y + 3, s - 6, s - 6); q.fillStyle = giusto ? '#081522' : '#e6fffb'; q.fillText(String(b[i]), x + s / 2, y + s / 2 + 1); }
      q.textBaseline = 'alphabetic'; q.textAlign = 'left';
      cq.setAttribute('aria-label', t('gioco del quindici: clicca una tessera vicina al buco', '15 puzzle: click a tile next to the hole'));
      var v = b.filter(function (x) { return x; }), inv = inversioni(v), riga = 4 - Math.floor(b.indexOf(0) / 4);
      info2.innerHTML = t('Inversioni ', 'Inversions ') + '<b class="bsiFX-num">' + inv + '</b> · ' + t('riga del buco dal basso ', 'hole row from bottom ') + riga + ' · ' + t('somma ', 'sum ') + (inv + riga) + ' → ' + (ok ? '<b class="bsiFX-ok">' + t('risolvibile', 'solvable') + '</b>' : '<b class="bsiFX-ko">' + t('irrisolvibile', 'unsolvable') + '</b>') + ' · ' + t('mosse ', 'moves ') + st.mosse + (fatto ? ' · ' + t('risolto!', 'solved!') : '') + '<br>' + t('Ogni mossa è una trasposizione delle 16 caselle (il buco con una tessera) e sposta il buco di un passo: la parità della permutazione e quella della distanza del buco da casa cambiano insieme, quindi il loro «accordo» si conserva. Con la vuota in basso a destra serve una permutazione pari delle 15 tessere: lo scambio 14–15 di Sam Loyd (1880) è impossibile. Le posizioni raggiungibili sono 16!/2.', 'Each move is a transposition of the 16 cells (the hole with a tile) and moves the hole one step: the parity of the permutation and that of the hole’s distance from home change together, so their “agreement” is conserved. With the hole at the bottom right an even permutation of the 15 tiles is needed: Sam Loyd’s 14–15 swap (1880) is impossible. The reachable positions are 16!/2.');
    }
    function tutto(errore) {
      var p = potenzaP(st.p, st.k), o = ordineP(st.p), C = cicli(st.p);
      info.innerHTML = (errore ? '<span class="bsiFX-ko">' + t('Scrittura non valida, resta la precedente.', 'Invalid input, the previous one is kept.') + '</span><br>' : '') + 'σ = <b class="bsiFX-num">' + scriviCicli(st.p) + '</b> · ' + t('in riga ', 'one-line ') + '[' + st.p.map(function (x) { return x + 1; }).join(' ') + ']' +
        '<br>' + t('tipo ', 'type ') + '(' + tipoCiclo(st.p).join(',') + ') · ' + t('segno ', 'sign ') + (segno(st.p) > 0 ? '+1 (' + t('pari', 'even') + ')' : '−1 (' + t('dispari', 'odd') + ')') + ' · ' + t('inversioni ', 'inversions ') + inversioni(st.p) + ' · ' + t('ordine ', 'order ') + '= mcm(' + C.map(function (c) { return c.length; }).join(',') + ') = <b>' + o + '</b>' +
        '<br>' + t('Nel disegno: ', 'Drawn: ') + 'σ' + apice(st.k) + ' = ' + scriviCicli(p) + (st.k === o ? ' = e ✓' : '') +
        '<br>' + t('Ogni permutazione è un prodotto di cicli disgiunti (che commutano); un k-ciclo è il prodotto di k − 1 trasposizioni, quindi sgn σ = (−1)^(n − numero di cicli) = (−1)^(inversioni), ed è un omomorfismo: sgn(στ) = sgn σ · sgn τ. L’ordine è il mcm delle lunghezze: (1 2 3)(4 5) ha ordine 6.', 'Every permutation is a product of disjoint cycles (which commute); a k-cycle is a product of k − 1 transpositions, so sgn σ = (−1)^(n − number of cycles) = (−1)^(inversions), and it is a homomorphism: sgn(στ) = sgn σ · sgn τ. The order is the lcm of the lengths: (1 2 3)(4 5) has order 6.');
      var T = contaTipi(st.n);
      tipi.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('tipo in S', 'type in S') + '<sub>' + st.n + '</sub></th><th>' + t('quante', 'how many') + '</th><th>' + t('ordine', 'order') + '</th></tr>' + T.map(function (r) { return '<tr><td>(' + r.tipo.join(',') + ')</td><td class="bsiFX-num">' + r.conteggio + '</td><td class="bsiFX-num">' + r.tipo.reduce(mcm, 1) + '</td></tr>'; }).join('') + '<tr><td>Σ = ' + st.n + '!</td><td class="bsiFX-num">' + T.reduce(function (s, r) { return s + r.conteggio; }, 0) + '</td><td></td></tr></table>';
      frecce();
    }
    tutto(); quindici();
    F.alRidimensiona(function () { frecce(); quindici(); });
    void inpN;
  }

  /* ═══ 3. anelli ℤₙ e campi finiti ═══════════════════════════════════════ */
  function schedaModulare(div) {
    var Gp = griglia(div), st = { s: 'zn', n: 12, v: 'molt' }, info = nota(Gp.pan), extra = F.el('div', { style: 'overflow-x:auto' });
    F.scelta(Gp.pan, ['Struttura', 'Structure'], [['zn', 'ℤₙ'], ['gf4', 'GF(4) = GF(2)[x]/(x²+x+1)'], ['gf8', 'GF(8) = GF(2)[x]/(x³+x+1)'], ['gf8b', 'GF(8) = GF(2)[x]/(x³+x²+1)'], ['gf16', 'GF(16) = GF(2)[x]/(x⁴+x+1)']], st.s, function (v) { st.s = v; disegna(); });
    F.cursore(Gp.pan, ['modulo n (per ℤₙ)', 'modulus n (for ℤₙ)'], 2, 30, 1, st.n, function (v) { st.n = v; disegna(); });
    F.scelta(Gp.pan, ['Tavola', 'Table'], [['molt', ['moltiplicazione ×', 'multiplication ×']], ['add', ['addizione +', 'addition +']], ['pot', ['potenze aᵏ delle unità', 'powers aᵏ of the units']]], st.v, function (v) { st.v = v; disegna(); });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 1); cv.style.maxWidth = '560px'; Gp.dx.appendChild(extra);
    function struttura() {
      if (st.s === 'zn') { var n = st.n, el = []; for (var a = 0; a < n; a++) el.push(a); return { m: n, nomi: el.map(String), add: function (a, b) { return (a + b) % n; }, mul: function (a, b) { return a * b % n; }, uno: 1 % n }; }
      var P = POLINOMI[st.s], C = campoGF(P[0], P[1]);
      return { m: C.q, nomi: C.nomi.map(function (x, i) { return C.q > 8 ? String(i) : x; }), add: function (a, b) { return C.add[a][b]; }, mul: function (a, b) { return C.mul[a][b]; }, uno: 1, C: C };
    }
    function disegna() {
      var S = struttura(), m = S.m, U = [], Z = [], a, b;
      for (a = 0; a < m; a++) { var inv = -1, zd = false; for (b = 0; b < m; b++) { var p = S.mul(a, b); if (p === S.uno) inv = b; if (a && b && p === 0) zd = true; } if (inv >= 0) U.push(a); if (zd) Z.push(a); }
      var col = function (v) { return v === 0 ? '#16263d' : 'hsl(' + Math.round(200 + 200 * v / m) % 360 + ',70%,' + (58 + 10 * (v % 2)) + '%)'; };
      var gen = U.filter(function (g) { var x = g, k = 1; while (x !== S.uno) { x = S.mul(x, g); k++; if (k > m) break; } return k === U.length; });
      if (st.v === 'pot') {
        var kk = []; for (var k = 1; k <= U.length; k++) kk.push(String(k));
        disegnaTavola(cv, U.map(function (u) { return S.nomi[u]; }), kk, function (i, j) { var x = S.uno; for (var r = 0; r <= j; r++) x = S.mul(x, U[i]); return x; }, col, { testo: function (v) { return S.nomi[v]; }, colR: function (i) { return gen.indexOf(U[i]) >= 0 ? '#ffd24a' : '#9fb1c6'; }, descr: ['tavola delle potenze: le righe dorate sono generatori', 'power table: golden rows are generators'] });
      } else {
        var op = st.v === 'add' ? S.add : S.mul;
        disegnaTavola(cv, S.nomi, S.nomi, function (i, j) { return op(i, j); }, function (v, i, j) { return st.v === 'molt' && v === 0 && i && j ? '#5a2430' : col(v); }, { testo: function (v) { return S.nomi[v]; }, colR: function (i) { return st.v !== 'molt' ? '#9fb1c6' : U.indexOf(i) >= 0 ? '#5eead4' : Z.indexOf(i) >= 0 ? '#ff8a80' : '#9fb1c6'; }, colC: function (j) { return st.v !== 'molt' ? '#9fb1c6' : U.indexOf(j) >= 0 ? '#5eead4' : Z.indexOf(j) >= 0 ? '#ff8a80' : '#9fb1c6'; }, descr: ['tavola dell’anello: in rosso scuro i prodotti nulli di elementi non nulli', 'ring table: dark red marks zero products of nonzero elements'] });
      }
      var campo = U.length === m - 1, g = gen[0], testoF = '';
      if (st.s === 'zn') {
        var n = st.n, ferm = primo(n) ? (function () { for (var x = 1; x < n; x++) if (potMod(x, n - 1, n) !== 1) return false; return true; })() : null;
        testoF = 'φ(' + n + ') = <b class="bsiFX-num">' + phi(n) + '</b> = ' + t('numero di unità', 'number of units') + ' (' + U.length + ')' + '<br><span style="color:#5eead4">' + t('unità', 'units') + '</span>: ' + U.join(' ') + '<br><span style="color:#ff8a80">' + t('divisori dello zero', 'zero divisors') + '</span>: ' + (Z.join(' ') || '—') +
          '<br>' + (campo ? '<b class="bsiFX-ok">ℤ' + n + t(' è un campo', ' is a field') + '</b> (' + n + t(' è primo', ' is prime') + ')' : 'ℤ' + n + t(' non è un campo: ', ' is not a field: ') + n + t(' non è primo', ' is not prime')) +
          ' · ' + (gen.length ? t('radici primitive: ', 'primitive roots: ') + '<b>' + gen.join(' ') + '</b> (' + gen.length + ' = φ(φ(n)) = ' + phi(phi(n)) + ')' : t('nessuna radice primitiva: (ℤ/', 'no primitive root: (ℤ/') + n + ')* ' + t('non è ciclico', 'is not cyclic')) +
          (ferm !== null ? '<br>Fermat: a^' + (n - 1) + ' ≡ 1 (mod ' + n + t(') per ogni a = 1…', ') for every a = 1…') + (n - 1) + ' ' + (ferm ? '✓' : '✗') : '');
      } else {
        var C = S.C;
        testoF = 'GF(' + C.q + t('): polinomio ', '): polynomial ') + '<b>' + polinomio(C.poli) + '</b> ' + (irriducibile(C.poli) ? t('irriducibile su GF(2) ✓', 'irreducible over GF(2) ✓') : t('riducibile ✗', 'reducible ✗')) + '<br>' + t('ogni elemento ≠ 0 ha l’inverso: ', 'every element ≠ 0 has an inverse: ') + (ogniNonNulloInvertibile(C.mul, 1) ? '✓' : '✗') + ' · ' + t('generatori del gruppo moltiplicativo (ordine ', 'generators of the multiplicative group (order ') + (C.q - 1) + '): ' + gen.map(function (x) { return C.nomi[x]; }).join(', ') + '<br>' + t('La somma è lo XOR dei coefficienti (caratteristica 2: a + a = 0).', 'Addition is XOR of the coefficients (characteristic 2: a + a = 0).');
      }
      /* il logaritmo discreto in base al primo generatore */
      if (g !== undefined) {
        var pot = [], x = S.uno; for (var k2 = 0; k2 < U.length; k2++) { pot.push(x); x = S.mul(x, g); }
        extra.innerHTML = '<table class="bsiFX-tab"><tr><th>k</th>' + pot.map(function (_, i) { return '<th>' + i + '</th>'; }).join('') + '</tr><tr><td>' + S.nomi[g] + '<sup>k</sup></td>' + pot.map(function (v) { return '<td class="bsiFX-num">' + S.nomi[v] + '</td>'; }).join('') + '</tr></table><div class="bsiFX-nota">' + t('Logaritmo discreto in base ', 'Discrete logarithm base ') + S.nomi[g] + ': log(a) = k ' + t('se ', 'if ') + S.nomi[g] + '<sup>k</sup> = a. ' + t('Calcolare le potenze è facile, invertirle (trovare k) è difficile per moduli grandi: su questo si basano Diffie–Hellman e ElGamal.', 'Computing powers is easy, inverting them (finding k) is hard for large moduli: Diffie–Hellman and ElGamal rest on this.') + '</div>';
      } else extra.innerHTML = '';
      info.innerHTML = testoF + '<br>' + t('Un anello ha somma e prodotto con le proprietà distributive; è un campo se ogni elemento non nullo è invertibile. In ℤₙ a è un’unità se e solo se MCD(a, n) = 1 (Bézout), altrimenti è un divisore dello zero: ℤₙ è un campo solo per n primo. Il gruppo delle unità di ℤₚ è ciclico di ordine p − 1, generato dalle radici primitive. Per ogni potenza di primo q = pᵏ esiste un solo campo con q elementi: GF(2ᵏ) si costruisce come i polinomi su GF(2) modulo un irriducibile di grado k (è l’aritmetica dei codici di Reed–Solomon e dell’AES).', 'A ring has addition and multiplication with distributivity; it is a field if every nonzero element is invertible. In ℤₙ a is a unit iff GCD(a, n) = 1 (Bézout), otherwise it is a zero divisor: ℤₙ is a field only for n prime. The unit group of ℤₚ is cyclic of order p − 1, generated by the primitive roots. For every prime power q = pᵏ there is exactly one field with q elements: GF(2ᵏ) is built as polynomials over GF(2) modulo an irreducible of degree k (the arithmetic of Reed–Solomon codes and AES).');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 4. teorema di Lagrange ════════════════════════════════════════════ */
  function schedaLagrange(div) {
    var Gp = griglia(div), st = { tipo: 'D', n: 4, h: 0, destra: false }, info = nota(Gp.pan), G, SG;
    F.scelta(Gp.pan, ['Gruppo', 'Group'], [['D', ['diedrale Dₙ (n = 3…8)', 'dihedral Dₙ (n = 3…8)']], ['Z', ['ciclico ℤₙ (n = 2…24)', 'cyclic ℤₙ (n = 2…24)']]], st.tipo, function (v) { st.tipo = v; aggiornaN(); nuovo(); });
    var inpN = F.cursore(Gp.pan, ['n', 'n'], 3, 8, 1, st.n, function (v) { st.n = v; nuovo(); });
    var selH = F.scelta(Gp.pan, ['Sottogruppo H', 'Subgroup H'], [['0', '—']], '0', function (v) { st.h = +v; disegna(); });
    F.scelta(Gp.pan, ['Classi laterali', 'Cosets'], [['s', ['sinistre gH', 'left gH']], ['d', ['destre Hg', 'right Hg']]], 's', function (v) { st.destra = v === 'd'; disegna(); });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.85);
    function aggiornaN() { if (st.tipo === 'D') { inpN.min = 3; inpN.max = 8; } else { inpN.min = 2; inpN.max = 24; } st.n = Math.max(+inpN.min, Math.min(+inpN.max, st.n)); inpN.value = st.n; inpN.dispatchEvent(new Event('input')); }
    function nuovo() {
      G = st.tipo === 'D' ? diedrale(st.n) : ciclico(st.n); SG = sottogruppi(G);
      /* si parte da un sottogruppo NON normale (se c'e'): si vede subito che gH ≠ Hg */
      st.h = SG.findIndex(function (H) { return !normale(G, H); });
      if (st.h < 0) st.h = Math.min(SG.length - 1, SG.length > 2 ? 1 : 0);
      selH.innerHTML = ''; SG.forEach(function (H, i) { var o = F.el('option', { value: String(i), testo: '|H| = ' + H.length + ': {' + H.map(function (x) { return G.nomi[x]; }).join(',') + '}' }); if (i === st.h) o.selected = true; selH.appendChild(o); });
      disegna();
    }
    function disegna() {
      var H = SG[st.h] || SG[0], C = classi(G, H, st.destra), dove = [], P = F.pennello(cv), q = P.q, W = P.W, Ht = P.H, cx = W / 2, cy = Ht / 2, R = Math.min(W, Ht) * 0.42, m = G.m;
      C.forEach(function (c, k) { c.forEach(function (x) { dove[x] = k; }); });
      function colC(k) { return C.length <= COLV.length ? COLV[k] : 'hsl(' + Math.round(360 * k / C.length) + ',75%,62%)'; }
      function pos(x) { if (st.tipo === 'D') { var n = G.n, r = x < n ? R : R * 0.58, a = -Math.PI / 2 + 2 * Math.PI * (x % n) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; } var b = -Math.PI / 2 + 2 * Math.PI * x / m; return [cx + R * Math.cos(b), cy + R * Math.sin(b)]; }
      /* i membri di ogni classe uniti da un poligono tenue */
      C.forEach(function (c, k) { if (c.length < 2) return; q.strokeStyle = colC(k); q.globalAlpha = 0.45; q.lineWidth = 2; q.beginPath(); c.forEach(function (x, i) { var p = pos(x); if (i) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); }); q.closePath(); q.stroke(); q.globalAlpha = 1; q.lineWidth = 1; });
      var rr = Math.max(8, Math.min(16, R * Math.PI / Math.max(m, 6) * 0.7)); q.font = 'bold ' + Math.round(rr * 0.85) + 'px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle';
      for (var x = 0; x < m; x++) { var p = pos(x), inH = H.indexOf(x) >= 0; q.fillStyle = colC(dove[x]); q.beginPath(); q.arc(p[0], p[1], rr, 0, Math.PI * 2); q.fill(); if (inH) { q.strokeStyle = '#e6fffb'; q.lineWidth = 2.5; q.stroke(); q.lineWidth = 1; } q.fillStyle = '#081522'; q.fillText(G.nomi[x], p[0], p[1] + 1); }
      q.textBaseline = 'alphabetic'; q.textAlign = 'left';
      cv.setAttribute('aria-label', t('classi laterali del sottogruppo, un colore per classe', 'cosets of the subgroup, one colour per coset'));
      var ordini = SG.map(function (S) { return S.length; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      info.innerHTML = '|G| = <b class="bsiFX-num">' + m + '</b> · |H| = <b class="bsiFX-num">' + H.length + '</b> · ' + t('indice ', 'index ') + '[G : H] = ' + C.length + ' = ' + m + '/' + H.length + ' · ' + (normale(G, H) ? '<span class="bsiFX-ok">' + t('H è normale (gH = Hg)', 'H is normal (gH = Hg)') + '</span>' : '<span class="bsiFX-ko">' + t('H non è normale: classi sinistre e destre diverse', 'H is not normal: left and right cosets differ') + '</span>') +
        '<br>' + C.map(function (c, k) { return '<span style="color:' + colC(k) + '">{' + c.map(function (y) { return G.nomi[y]; }).join(',') + '}</span>'; }).join(' ') +
        '<br>' + t('Ordini dei sottogruppi: ', 'Subgroup orders: ') + ordini.join(', ') + ' — ' + t('tutti dividono ', 'all divide ') + m + ' ' + (ordini.every(function (o) { return m % o === 0; }) ? '✓' : '✗') +
        '<br>' + t('Lagrange: le classi gH hanno tutte |H| elementi (h ↦ gh è biiettiva) e due classi o coincidono o sono disgiunte; quindi ripartiscono G e |G| = [G : H]·|H|. Conseguenze: l’ordine di ogni elemento divide |G|, un gruppo di ordine primo è ciclico, e a^φ(n) ≡ 1 (mod n) (Eulero). L’inverso non vale: A₄ (ordine 12) non ha sottogruppi di ordine 6. Il cerchio bordato è H stesso, la classe dell’elemento neutro.', 'Lagrange: the cosets gH all have |H| elements (h ↦ gh is a bijection) and two cosets either coincide or are disjoint; so they partition G and |G| = [G : H]·|H|. Consequences: the order of every element divides |G|, a group of prime order is cyclic, and a^φ(n) ≡ 1 (mod n) (Euler). The converse fails: A₄ (order 12) has no subgroup of order 6. The outlined circles are H itself, the coset of the identity.');
    }
    nuovo(); F.alRidimensiona(disegna);
  }

  F.sezione('smatalgebra', {
    titolo: ['🔣 Strutture algebriche', '🔣 Algebraic structures'],
    sotto: ['I gruppi delle simmetrie dei poligoni con la tavola di Cayley, le permutazioni e la parità del gioco del quindici, gli anelli ℤₙ e i campi finiti GF(2ᵏ), il teorema di Lagrange con le classi laterali.', 'The symmetry groups of polygons with the Cayley table, permutations and the parity of the 15 puzzle, the rings ℤₙ and the finite fields GF(2ᵏ), Lagrange’s theorem with cosets.'],
    schede: [
      { nome: ['⬟ Simmetrie Dₙ', '⬟ Symmetries Dₙ'], costruisci: schedaDiedro },
      { nome: ['🔀 Permutazioni', '🔀 Permutations'], costruisci: schedaPermutazioni },
      { nome: ['🔢 Anelli e campi', '🔢 Rings and fields'], costruisci: schedaModulare },
      { nome: ['🧩 Lagrange', '🧩 Lagrange'], costruisci: schedaLagrange }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
