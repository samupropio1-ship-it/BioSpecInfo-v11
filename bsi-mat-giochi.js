/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-giochi.js — ♟️ teoria dei giochi
   BioSpecInfo · © Samuele Pio Provenzano

   · GIOCHI 2×2: la matrice dei pagamenti modificabile e i classici (dilemma
     del prigioniero, caccia al cervo, battaglia dei sessi, gioco del
     pollo, testa o croce); gli equilibri di Nash puri, quello misto dalla
     condizione di indifferenza, il diagramma delle migliori risposte in
     cui gli equilibri sono le intersezioni;
   · DILEMMA RIPETUTO: un torneo all'italiana alla Axelrod fra sette
     strategie (sempre collabora, sempre tradisce, colpo su colpo, rancore,
     a caso, Pavlov, colpo su colpo generoso) con il rumore sulle mosse, e
     poi la dinamica del replicatore: chi guadagna di piu' si moltiplica;
   · MINIMAX: il tris contro un giocatore perfetto (negamax con potatura
     alfa-beta), il valore di ogni mossa, i nodi esplorati con e senza
     potatura;
   · NIM: la strategia vincente di Bouton con la somma-nim (XOR in binario),
     giocata contro il computer.
   Il caso entra solo con mulberry32 e un seme: i risultati si ripetono.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  var COLV = ['#5eead4', '#ff8a80', '#6bcfff', '#ffc45a', '#c9b9ff', '#ffd24a', '#a8e07a'];

  /* ═══ calcoli: giochi 2×2 ═══════════════════════════════════════════════
     A[i][j] = pagamento del giocatore di riga, B[i][j] = di colonna;
     strategia 0 = la prima (alto / sinistra), 1 = la seconda */
  var CLASSICI = {
    dilemma: { nome: ['Dilemma del prigioniero', 'Prisoner’s dilemma'], mosse: [['Collabora', 'Cooperate'], ['Tradisce', 'Defect']], A: [[3, 0], [5, 1]], B: [[3, 5], [0, 1]] },
    cervo: { nome: ['Caccia al cervo', 'Stag hunt'], mosse: [['Cervo', 'Stag'], ['Lepre', 'Hare']], A: [[4, 0], [3, 3]], B: [[4, 3], [0, 3]] },
    sessi: { nome: ['Battaglia dei sessi', 'Battle of the sexes'], mosse: [['Opera', 'Opera'], ['Calcio', 'Football']], A: [[3, 0], [0, 2]], B: [[2, 0], [0, 3]] },
    pollo: { nome: ['Gioco del pollo', 'Chicken'], mosse: [['Sterza', 'Swerve'], ['Dritto', 'Straight']], A: [[0, -1], [1, -10]], B: [[0, 1], [-1, -10]] },
    monete: { nome: ['Testa o croce (matching pennies)', 'Matching pennies'], mosse: [['Testa', 'Heads'], ['Croce', 'Tails']], A: [[1, -1], [-1, 1]], B: [[-1, 1], [1, -1]] }
  };
  function nashPuri(A, B) {
    var out = [];
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) if (A[i][j] >= A[1 - i][j] && B[i][j] >= B[i][1 - j]) out.push([i, j]);
    return out;
  }
  /* misto: p = prob. che la riga giochi 0, scelta per rendere INDIFFERENTE la colonna; q viceversa */
  function nashMisto(A, B) {
    var dp = B[0][0] - B[1][0] - B[0][1] + B[1][1], dq = A[0][0] - A[0][1] - A[1][0] + A[1][1];
    if (dp === 0 || dq === 0) return null;
    var p = (B[1][1] - B[1][0]) / dp, q = (A[1][1] - A[0][1]) / dq;
    if (!(p > 0 && p < 1 && q > 0 && q < 1)) return null;
    return { p: p, q: q, uA: guadagno(A, p, q), uB: guadagno(B, p, q) };
  }
  function guadagno(M, p, q) { return p * q * M[0][0] + p * (1 - q) * M[0][1] + (1 - p) * q * M[1][0] + (1 - p) * (1 - q) * M[1][1]; }
  /* miglior risposta della riga a q: 1 = gioca 0, 0 = gioca 1, 0.5 = indifferente */
  function brRiga(A, q) { var d = q * (A[0][0] - A[1][0]) + (1 - q) * (A[0][1] - A[1][1]); return Math.abs(d) < 1e-12 ? 0.5 : d > 0 ? 1 : 0; }
  function brColonna(B, p) { var d = p * (B[0][0] - B[0][1]) + (1 - p) * (B[1][0] - B[1][1]); return Math.abs(d) < 1e-12 ? 0.5 : d > 0 ? 1 : 0; }
  /* la spezzata della miglior risposta: soglia dove la differenza lineare cambia segno */
  function soglia(d0, d1) { return d0 === d1 ? null : d0 / (d0 - d1); }
  function curvaBR(A, B) {
    var a0 = A[0][1] - A[1][1], a1 = A[0][0] - A[1][0], qs = soglia(a0, a1), riga = [];
    var y0 = a0 > 0 ? 1 : a0 < 0 ? 0 : (a1 > 0 ? 1 : 0), y1 = a1 > 0 ? 1 : a1 < 0 ? 0 : y0;
    riga.push([0, y0]); if (qs !== null && qs > 0 && qs < 1) { riga.push([qs, y0]); riga.push([qs, y1]); } riga.push([1, y1]);
    var b0 = B[1][0] - B[1][1], b1 = B[0][0] - B[0][1], ps = soglia(b0, b1), col = [];
    var x0 = b0 > 0 ? 1 : b0 < 0 ? 0 : (b1 > 0 ? 1 : 0), x1 = b1 > 0 ? 1 : b1 < 0 ? 0 : x0;
    col.push([x0, 0]); if (ps !== null && ps > 0 && ps < 1) { col.push([x0, ps]); col.push([x1, ps]); } col.push([x1, 1]);
    return { riga: riga, colonna: col };
  }

  /* ═══ calcoli: dilemma ripetuto ═════════════════════════════════════════
     mosse 0 = collabora, 1 = tradisce; pagamenti R = 3, S = 0, T = 5, P = 1 */
  var PAGA = [[3, 0], [5, 1]];
  var STRATEGIE = [
    { k: 'allc', nome: ['Sempre collabora', 'Always cooperate'], f: function () { return 0; } },
    { k: 'alld', nome: ['Sempre tradisce', 'Always defect'], f: function () { return 1; } },
    { k: 'tft', nome: ['Colpo su colpo', 'Tit for tat'], f: function (io, lui) { return lui.length ? lui[lui.length - 1] : 0; } },
    { k: 'grim', nome: ['Rancore (grim)', 'Grim trigger'], f: function (io, lui) { return lui.indexOf(1) >= 0 ? 1 : 0; } },
    { k: 'rand', nome: ['A caso', 'Random'], f: function (io, lui, r) { return r() < 0.5 ? 1 : 0; } },
    { k: 'pavlov', nome: ['Pavlov (vinci-resta)', 'Pavlov (win-stay)'], f: function (io, lui) { if (!io.length) return 0; return io[io.length - 1] === lui[lui.length - 1] ? 0 : 1; } },
    { k: 'gtft', nome: ['Colpo su colpo generoso', 'Generous tit for tat'], f: function (io, lui, r) { if (!lui.length || lui[lui.length - 1] === 0) return 0; return r() < 1 / 3 ? 0 : 1; } }
  ];
  /* una partita: con probabilita' eps la mossa voluta si capovolge (errore di esecuzione) */
  function partita(s1, s2, turni, eps, r) {
    var h1 = [], h2 = [], p1 = 0, p2 = 0;
    for (var k = 0; k < turni; k++) {
      var m1 = s1.f(h1, h2, r), m2 = s2.f(h2, h1, r);
      if (eps > 0 && r() < eps) m1 = 1 - m1;
      if (eps > 0 && r() < eps) m2 = 1 - m2;
      h1.push(m1); h2.push(m2); p1 += PAGA[m1][m2]; p2 += PAGA[m2][m1];
    }
    return [p1, p2];
  }
  /* torneo all'italiana, anche contro se stessi; M[i][j] = pagamento medio per turno di i contro j */
  function torneo(chiavi, turni, eps, seme) {
    var r = mulberry32(seme || 1), S = chiavi.map(function (k) { return STRATEGIE.filter(function (s) { return s.k === k; })[0]; }), n = S.length, M = [], tot = [];
    for (var i = 0; i < n; i++) { M.push(new Array(n).fill(0)); tot.push(0); }
    for (i = 0; i < n; i++) for (var j = i; j < n; j++) { var p = partita(S[i], S[j], turni, eps, r); M[i][j] = p[0] / turni; M[j][i] = p[1] / turni; if (i === j) M[i][i] = (p[0] + p[1]) / (2 * turni); }
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) tot[i] += M[i][j] * turni;
    return { M: M, totale: tot };
  }
  /* dinamica del replicatore discreta: x_i ← x_i f_i / f̄, f_i = Σ_j M_ij x_j */
  function replicatore(M, x0, generazioni) {
    var x = x0.slice(), storia = [x.slice()], n = x.length;
    for (var g = 0; g < generazioni; g++) {
      var f = [], fm = 0; for (var i = 0; i < n; i++) { f.push(0); for (var j = 0; j < n; j++) f[i] += M[i][j] * x[j]; fm += x[i] * f[i]; }
      if (!(fm > 0)) break;
      x = x.map(function (v, i2) { return v * f[i2] / fm; });
      var s = x.reduce(function (a, b) { return a + b; }, 0); x = x.map(function (v) { return v / s; });
      storia.push(x.slice());
    }
    return storia;
  }

  /* ═══ calcoli: tris con negamax ═════════════════════════════════════════
     tavola: 9 caselle, 0 vuota, 1 = X, 2 = O. Il valore e' per chi deve muovere:
     +(10 − profondita') se vince, 0 patta, negativo se perde (vincere prima vale di piu') */
  var LINEE = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function vincitore(b) { for (var k = 0; k < 8; k++) { var L = LINEE[k]; if (b[L[0]] && b[L[0]] === b[L[1]] && b[L[1]] === b[L[2]]) return b[L[0]]; } return b.indexOf(0) < 0 ? 0 : -1; }
  /* le linee che passano per ogni casella: dopo una mossa basta guardare quelle (l'albero completo ha ~550 000 nodi) */
  var PER_CASELLA = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return LINEE.filter(function (L) { return L.indexOf(i) >= 0; }); });
  function stato(b, ultima) {
    if (ultima === undefined || ultima < 0) return vincitore(b);
    var c = b[ultima], P = PER_CASELLA[ultima];
    for (var k = 0; k < P.length; k++) { var L = P[k]; if (b[L[0]] === c && b[L[1]] === c && b[L[2]] === c) return c; }
    for (var i = 0; i < 9; i++) if (!b[i]) return -1;
    return 0;
  }
  function negamax(b, p, prof, cnt, ultima) {
    cnt.n++;
    var w = stato(b, ultima); if (w > 0) { cnt.foglie++; return -(10 - prof); } if (w === 0) { cnt.foglie++; return 0; }
    var meglio = -Infinity;
    for (var i = 0; i < 9; i++) if (!b[i]) { b[i] = p; var v = -negamax(b, 3 - p, prof + 1, cnt, i); b[i] = 0; if (v > meglio) meglio = v; }
    return meglio;
  }
  function alfabeta(b, p, prof, a, be, cnt, ultima) {
    cnt.n++;
    var w = stato(b, ultima); if (w > 0) return -(10 - prof); if (w === 0) return 0;
    var meglio = -Infinity;
    for (var i = 0; i < 9; i++) if (!b[i]) { b[i] = p; var v = -alfabeta(b, 3 - p, prof + 1, -be, -a, cnt, i); b[i] = 0; if (v > meglio) meglio = v; if (v > a) a = v; if (a >= be) break; }
    return meglio;
  }
  function valoreTris(b, p, potatura) { var c = { n: 0, foglie: 0 }, bb = b.slice(); var v = potatura ? alfabeta(bb, p, 0, -Infinity, Infinity, c) : negamax(bb, p, 0, c); return { v: v, nodi: c.n, foglie: c.foglie }; }
  /* valore esatto di ogni mossa possibile per chi muove (finestra piena: il valore e' esatto) */
  function valoriMosse(b, p) { var out = []; var prof = b.filter(function (x) { return x; }).length; for (var i = 0; i < 9; i++) { if (b[i]) { out.push(null); continue; } var bb = b.slice(); bb[i] = p; var c = { n: 0 }; out.push(-alfabeta(bb, 3 - p, prof + 1, -Infinity, Infinity, c, i)); } return out; }
  function mossaMigliore(b, p) { var V = valoriMosse(b, p), m = -1; V.forEach(function (v, i) { if (v !== null && (m < 0 || v > V[m])) m = i; }); return m; }

  /* ═══ calcoli: nim ══════════════════════════════════════════════════════ */
  function nimSomma(h) { return h.reduce(function (a, b) { return a ^ b; }, 0); }
  /* Bouton: se la somma-nim s ≠ 0 c'e' un mucchio con h ^ s < h; lo si riduce a h ^ s */
  function mossaNim(h) { var s = nimSomma(h); if (!s) return null; for (var i = 0; i < h.length; i++) if ((h[i] ^ s) < h[i]) return [i, h[i] ^ s]; return null; }
  /* verifica per forza bruta: una posizione e' vincente se esiste una mossa verso una perdente */
  function vincenteForzaBruta(h, memo) {
    memo = memo || {}; var k = h.slice().sort().join(','); if (memo[k] !== undefined) return memo[k];
    var v = false;
    for (var i = 0; i < h.length && !v; i++) for (var x = 0; x < h[i] && !v; x++) { var g = h.slice(); g[i] = x; if (!vincenteForzaBruta(g, memo)) v = true; }
    memo[k] = v; return v;
  }
  F.calcolo.giochi = { CLASSICI: CLASSICI, nashPuri: nashPuri, nashMisto: nashMisto, guadagno: guadagno, brRiga: brRiga, brColonna: brColonna, curvaBR: curvaBR,
    PAGA: PAGA, STRATEGIE: STRATEGIE, partita: partita, torneo: torneo, replicatore: replicatore, mulberry32: mulberry32,
    vincitore: vincitore, negamax: negamax, alfabeta: alfabeta, valoreTris: valoreTris, valoriMosse: valoriMosse, mossaMigliore: mossaMigliore,
    nimSomma: nimSomma, mossaNim: mossaNim, vincenteForzaBruta: vincenteForzaBruta };

  /* ═══ 1. giochi 2×2 ═════════════════════════════════════════════════════ */
  function schedaDueXDue(div) {
    var Gp = griglia(div), st = { g: 'dilemma', A: null, B: null }, info = nota(Gp.pan), celle = [], tabella = F.el('table', { 'class': 'bsiFX-tab', style: 'table-layout:fixed' });
    F.scelta(Gp.pan, ['Gioco', 'Game'], Object.keys(CLASSICI).map(function (k) { return [k, CLASSICI[k].nome]; }), st.g, function (v) { st.g = v; carica(); });
    Gp.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Pagamenti (riga, colonna): modificali a piacere.', 'Payoffs (row, column): edit them freely.') }));
    Gp.pan.appendChild(tabella);
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.85);
    function costruisciTabella() {
      var M = CLASSICI[st.g].mosse; tabella.innerHTML = ''; celle = [];
      var tr = F.el('tr'); tr.appendChild(F.el('th', { testo: '' })); M.forEach(function (m) { tr.appendChild(F.el('th', { testo: F.tt(m), style: 'text-align:center;color:#ffc45a' })); }); tabella.appendChild(tr);
      for (var i = 0; i < 2; i++) {
        var r = F.el('tr'); r.appendChild(F.el('th', { testo: F.tt(M[i]), style: 'color:#5eead4;text-align:left' }));
        for (var j = 0; j < 2; j++) {
          var td = F.el('td', { style: 'text-align:center' }), a = F.el('input', { type: 'number', value: st.A[i][j], step: 1, 'aria-label': t('pagamento riga ', 'row payoff ') + (i + 1) + ',' + (j + 1), style: 'width:46%;padding:4px;color:#5eead4' }), b = F.el('input', { type: 'number', value: st.B[i][j], step: 1, 'aria-label': t('pagamento colonna ', 'column payoff ') + (i + 1) + ',' + (j + 1), style: 'width:46%;padding:4px;margin-left:4%;color:#ffc45a' });
          (function (i, j, a, b) { a.addEventListener('input', function () { var v = parseFloat(a.value); if (isFinite(v)) { st.A[i][j] = v; disegna(); } }); b.addEventListener('input', function () { var v = parseFloat(b.value); if (isFinite(v)) { st.B[i][j] = v; disegna(); } }); })(i, j, a, b);
          td.appendChild(a); td.appendChild(b); r.appendChild(td); celle.push(td);
        }
        tabella.appendChild(r);
      }
    }
    function carica() { var G = CLASSICI[st.g]; st.A = G.A.map(function (r) { return r.slice(); }); st.B = G.B.map(function (r) { return r.slice(); }); costruisciTabella(); disegna(); }
    function disegna() {
      var A = st.A, B = st.B, M = CLASSICI[st.g].mosse, NP = nashPuri(A, B), NM = nashMisto(A, B), C = curvaBR(A, B);
      celle.forEach(function (td, k) { var i = k >> 1, j = k & 1, eq = NP.some(function (e) { return e[0] === i && e[1] === j; }); td.style.background = eq ? 'rgba(255,210,74,.22)' : ''; td.style.outline = eq ? '2px solid #ffd24a' : ''; });
      var punti = NP.map(function (e) { return { x: e[1] === 0 ? 1 : 0, y: e[0] === 0 ? 1 : 0, col: '#ffd24a', r: 7 }; });
      if (NM) punti.push({ x: NM.q, y: NM.p, col: '#ff8a80', r: 7 });
      F.grafico(cv, { serie: [{ x: C.riga.map(function (v) { return v[0]; }), y: C.riga.map(function (v) { return v[1]; }), col: '#5eead4', larg: 3, etich: ['MR riga', 'BR row'] }, { x: C.colonna.map(function (v) { return v[0]; }), y: C.colonna.map(function (v) { return v[1]; }), col: '#ffc45a', larg: 3, tratt: true, etich: ['MR colonna', 'BR column'] }], punti: punti, xmin: -0.02, xmax: 1.02, ymin: -0.02, ymax: 1.02,
        xl: [t('q = prob. colonna gioca «', 'q = prob. column plays “') + F.tt(M[0]) + t('»', '”'), 'q'], yl: [t('p = prob. riga gioca «', 'p = prob. row plays “') + F.tt(M[0]) + t('»', '”'), 'p'], legenda: [{ col: '#5eead4', etich: ['miglior risposta riga', 'row best response'] }, { col: '#ffc45a', etich: ['miglior risposta colonna', 'column best response'] }], descr: ['diagramma delle migliori risposte: gli equilibri sono le intersezioni', 'best-response diagram: equilibria are the intersections'] });
      var nomi = function (e) { return '(' + F.tt(M[e[0]]) + ', ' + F.tt(M[e[1]]) + ')'; };
      info.innerHTML = t('Equilibri puri: ', 'Pure equilibria: ') + (NP.length ? '<b style="color:#ffd24a">' + NP.map(nomi).join(' · ') + '</b>' : t('nessuno', 'none')) +
        '<br>' + t('Equilibrio misto: ', 'Mixed equilibrium: ') + (NM ? '<b style="color:#ff8a80">p = ' + fmt(NM.p) + ', q = ' + fmt(NM.q) + '</b> · ' + t('guadagni attesi ', 'expected payoffs ') + fmt(NM.uA) + ', ' + fmt(NM.uB) : t('nessuno strettamente misto', 'none strictly mixed')) +
        '<br>' + t('Un profilo è un equilibrio di Nash se nessuno guadagna cambiando da solo strategia. Nel misto ognuno sceglie la probabilità che rende l’ALTRO indifferente: p = (b₂₂ − b₂₁)/(b₁₁ − b₂₁ − b₁₂ + b₂₂). Nel dilemma del prigioniero tradire è strettamente dominante: l’unico equilibrio (T, T) è peggiore per entrambi di (C, C). La caccia al cervo ha due equilibri (sicuro e ottimo), la battaglia dei sessi due puri più uno misto, testa o croce solo il misto (½, ½). Nash (1950): ogni gioco finito ha almeno un equilibrio, eventualmente misto.', 'A profile is a Nash equilibrium if nobody gains by changing strategy alone. In the mixed one each player chooses the probability that makes the OTHER indifferent: p = (b₂₂ − b₂₁)/(b₁₁ − b₂₁ − b₁₂ + b₂₂). In the prisoner’s dilemma defecting is strictly dominant: the only equilibrium (D, D) is worse for both than (C, C). Stag hunt has two equilibria (safe and optimal), battle of the sexes two pure plus a mixed one, matching pennies only the mixed (½, ½). Nash (1950): every finite game has at least one equilibrium, possibly mixed.');
    }
    carica(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. dilemma ripetuto: torneo ed evoluzione ═════════════════════════ */
  function schedaTorneo(div) {
    var Gp = griglia(div), st = { turni: 200, eps: 0, seme: 1, gen: 150 }, info = nota(Gp.pan), R = null;
    F.cursore(Gp.pan, ['turni per partita', 'rounds per match'], 10, 500, 10, st.turni, function (v) { st.turni = v; calcola(); });
    F.cursore(Gp.pan, ['rumore ε (mosse sbagliate)', 'noise ε (wrong moves)'], 0, 0.2, 0.01, st.eps, function (v) { st.eps = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(Gp.pan, ['generazioni (replicatore)', 'generations (replicator)'], 10, 400, 10, st.gen, function (v) { st.gen = v; calcola(); });
    F.bottone(Gp.pan, ['Nuovo seme', 'New seed'], function () { st.seme = 1 + Math.floor(Math.random() * 1e6); calcola(); });
    Gp.pan.appendChild(info);
    var cb = F.tela(Gp.dx, 0.6), cr = F.tela(Gp.dx, 0.6);
    var chiavi = STRATEGIE.map(function (s) { return s.k; });
    function calcola() {
      R = torneo(chiavi, st.turni, st.eps, st.seme);
      var x0 = chiavi.map(function () { return 1 / chiavi.length; });
      R.storia = replicatore(R.M, x0, st.gen);
      disegna();
    }
    function disegna() {
      /* barre orizzontali dei punteggi totali */
      var P = F.pennello(cb), q = P.q, W = P.W, H = P.H, n = chiavi.length, mx = Math.max.apply(null, R.totale), h = (H - 20) / n, ord = chiavi.map(function (_, i) { return i; }).sort(function (a, b) { return R.totale[b] - R.totale[a]; }), sx = Math.min(185, W * 0.46);
      q.font = (W < 400 ? 10 : 12) + 'px system-ui'; q.textBaseline = 'middle';
      ord.forEach(function (i, r) { var y = 10 + r * h, w = (W - sx - 50) * R.totale[i] / (mx || 1); q.fillStyle = COLV[i]; q.fillRect(sx, y + 3, Math.max(1, w), h - 6); q.fillStyle = '#c9d3df'; q.textAlign = 'right'; q.fillText(F.tt(STRATEGIE[i].nome), sx - 6, y + h / 2); q.textAlign = 'left'; q.fillStyle = '#e6fffb'; q.fillText(String(Math.round(R.totale[i])), sx + w + 5, y + h / 2); });
      q.textBaseline = 'alphabetic';
      cb.setAttribute('aria-label', t('punteggi totali del torneo', 'tournament total scores'));
      var S = R.storia, xs = S.map(function (_, g) { return g; });
      F.grafico(cr, { serie: chiavi.map(function (_, i) { return { x: xs, y: S.map(function (x) { return x[i]; }), col: COLV[i], larg: 2, etich: STRATEGIE[i].nome }; }), xmin: 0, xmax: Math.max(1, S.length - 1), ymin: 0, ymax: 1, xl: ['generazione', 'generation'], yl: ['quota della popolazione', 'population share'], legenda: chiavi.map(function (_, i) { return { col: COLV[i], etich: STRATEGIE[i].nome }; }), descr: ['dinamica del replicatore: quote delle strategie', 'replicator dynamics: strategy shares'] });
      var fin = S[S.length - 1], vinc = fin.indexOf(Math.max.apply(null, fin)), somma = fin.reduce(function (a, b) { return a + b; }, 0), primo = ord[0];
      var iT = chiavi.indexOf('tft'), iD = chiavi.indexOf('alld');
      info.innerHTML = t('Vince il torneo: ', 'Tournament winner: ') + '<b style="color:' + COLV[primo] + '">' + F.tt(STRATEGIE[primo].nome) + '</b> · ' + t('colpo su colpo contro sempre tradisce: ', 'tit for tat vs always defect: ') + Math.round(R.M[iT][iD] * st.turni) + ' – ' + Math.round(R.M[iD][iT] * st.turni) +
        '<br>' + t('Dopo ', 'After ') + (S.length - 1) + t(' generazioni domina ', ' generations the leader is ') + '<b style="color:' + COLV[vinc] + '">' + F.tt(STRATEGIE[vinc].nome) + '</b> (' + fmt(fin[vinc] * 100) + ' %) · Σ ' + t('quote', 'shares') + ' = ' + somma.toFixed(6) +
        '<br>' + t('Pagamenti per turno: R = 3 (entrambi collaborano), T = 5 (tradisci chi collabora), S = 0, P = 1. Nel torneo di Axelrod (1980) vinse colpo su colpo: gentile (non tradisce per primo), reattivo, indulgente, chiaro. Tradire sempre non perde mai una partita, ma raccoglie poco. Il replicatore xᵢ ← xᵢ fᵢ/f̄ fa crescere le strategie con guadagno medio sopra la media: prima spariscono gli ingenui, poi i traditori restano senza prede. Con il rumore il colpo su colpo cade in faide di ritorsioni; la versione generosa e Pavlov le interrompono.', 'Payoffs per round: R = 3 (both cooperate), T = 5 (defect on a cooperator), S = 0, P = 1. In Axelrod’s tournament (1980) tit for tat won: nice (never defects first), retaliating, forgiving, clear. Always defect never loses a match but collects little. The replicator xᵢ ← xᵢ fᵢ/f̄ grows strategies earning above average: first the naive ones vanish, then the defectors run out of prey. With noise tit for tat falls into retaliation feuds; the generous version and Pavlov break them.');
    }
    calcola(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. tris e minimax ═════════════════════════════════════════════════ */
  function schedaTris(div) {
    var Gp = griglia(div), st = { b: [0, 0, 0, 0, 0, 0, 0, 0, 0], umano: 1, conti: null }, info = nota(Gp.pan), conti = F.el('div', { 'class': 'bsiFX-nota' });
    F.bottone(Gp.pan, ['Nuova partita (inizi tu, X)', 'New game (you start, X)'], function () { st.b = [0, 0, 0, 0, 0, 0, 0, 0, 0]; st.umano = 1; aggiorna(); });
    F.bottone(Gp.pan, ['Nuova partita (inizia il computer)', 'New game (computer starts)'], function () { st.b = [0, 0, 0, 0, 0, 0, 0, 0, 0]; st.umano = 2; st.b[mossaMigliore(st.b, 1)] = 1; aggiorna(); });
    Gp.pan.appendChild(info); Gp.pan.appendChild(conti);
    var cv = F.tela(Gp.dx, 1); cv.style.maxWidth = '340px'; cv.style.margin = '0 auto';
    function turno() { var x = st.b.filter(function (v) { return v === 1; }).length, o = st.b.filter(function (v) { return v === 2; }).length; return x > o ? 2 : 1; }
    cv.addEventListener('click', function (ev) {
      var r = cv.getBoundingClientRect(); if (!r.width) return;
      var c = Math.floor((ev.clientX - r.left) / r.width * 3), rg = Math.floor((ev.clientY - r.top) / r.height * 3), i = rg * 3 + c;
      if (c < 0 || c > 2 || rg < 0 || rg > 2 || st.b[i] || vincitore(st.b) >= 0 || turno() !== st.umano) return;
      st.b[i] = st.umano;
      if (vincitore(st.b) < 0) { var m = mossaMigliore(st.b, 3 - st.umano); if (m >= 0) st.b[m] = 3 - st.umano; }
      aggiorna();
    });
    function disegna() {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, s = Math.min(W, H) / 3, ox = (W - 3 * s) / 2, w = vincitore(st.b), mio = turno() === st.umano && w < 0, V = mio ? valoriMosse(st.b, st.umano) : [];
      q.strokeStyle = '#34465f'; q.lineWidth = 3;
      for (var k = 1; k < 3; k++) { q.beginPath(); q.moveTo(ox + k * s, 8); q.lineTo(ox + k * s, 3 * s - 8); q.stroke(); q.beginPath(); q.moveTo(ox + 8, k * s); q.lineTo(ox + 3 * s - 8, k * s); q.stroke(); }
      q.lineWidth = 6; q.lineCap = 'round';
      for (var i = 0; i < 9; i++) {
        var cx = ox + (i % 3 + 0.5) * s, cy = (Math.floor(i / 3) + 0.5) * s, r = s * 0.28;
        if (st.b[i] === 1) { q.strokeStyle = '#6bcfff'; q.beginPath(); q.moveTo(cx - r, cy - r); q.lineTo(cx + r, cy + r); q.moveTo(cx + r, cy - r); q.lineTo(cx - r, cy + r); q.stroke(); }
        else if (st.b[i] === 2) { q.strokeStyle = '#ff8a80'; q.beginPath(); q.arc(cx, cy, r, 0, Math.PI * 2); q.stroke(); }
        else if (mio && V[i] !== null) { var v = V[i]; q.fillStyle = v > 0 ? '#5eead4' : v < 0 ? '#ff8a80' : '#ffd24a'; q.font = 'bold ' + Math.round(s * 0.2) + 'px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(v > 0 ? '+1' : v < 0 ? '−1' : '0', cx, cy); }
      }
      if (w > 0) { var L = LINEE.filter(function (L2) { return st.b[L2[0]] === w && st.b[L2[1]] === w && st.b[L2[2]] === w; })[0]; q.strokeStyle = '#ffd24a'; q.lineWidth = 5; q.beginPath(); q.moveTo(ox + (L[0] % 3 + 0.5) * s, (Math.floor(L[0] / 3) + 0.5) * s); q.lineTo(ox + (L[2] % 3 + 0.5) * s, (Math.floor(L[2] / 3) + 0.5) * s); q.stroke(); }
      q.lineWidth = 1; q.lineCap = 'butt'; q.textAlign = 'left'; q.textBaseline = 'alphabetic';
      cv.setAttribute('aria-label', t('tris: clicca una casella vuota; i numeri sono il valore minimax della mossa', 'tic-tac-toe: click an empty cell; numbers are the minimax value of the move'));
      return w;
    }
    function aggiorna() {
      var w = disegna(), tu = st.umano === 1 ? 'X' : 'O';
      info.innerHTML = (w > 0 ? (w === st.umano ? t('Hai vinto (non dovrebbe succedere!)', 'You won (should not happen!)') : t('Ha vinto il computer.', 'The computer won.')) : w === 0 ? t('Patta: con il gioco perfetto il tris finisce sempre così.', 'Draw: with perfect play tic-tac-toe always ends like this.') : t('Tocca a te (', 'Your move (') + tu + ').') +
        '<br>' + t('Nelle caselle vuote il valore della mossa per te: ', 'In the empty cells the value of the move for you: ') + '<span style="color:#5eead4">+1</span> ' + t('vinci', 'you win') + ', <span style="color:#ffd24a">0</span> ' + t('patta', 'draw') + ', <span style="color:#ff8a80">−1</span> ' + t('perdi (contro il gioco perfetto)', 'you lose (against perfect play)') +
        '<br>' + t('Minimax: il valore di una posizione è il massimo, sulle mie mosse, del minimo sulle risposte dell’avversario (negamax: v = max(−v_figlio)). La potatura alfa-beta smette di esaminare una mossa appena si sa che è peggiore di una già trovata: stesso valore, molti meno nodi. Il tris è un gioco a somma zero a informazione perfetta: per il teorema di Zermelo ha un valore, ed è la patta.', 'Minimax: the value of a position is the maximum, over my moves, of the minimum over the opponent’s replies (negamax: v = max(−v_child)). Alpha-beta pruning stops examining a move as soon as it is known to be worse than one already found: same value, far fewer nodes. Tic-tac-toe is a zero-sum game of perfect information: by Zermelo’s theorem it has a value, and it is a draw.');
      contaNodi();
    }
    /* i nodi esplorati: dalla posizione attuale, a lotti fuori dal disegno (dall'inizio sono ~550 000) */
    var giro = 0;
    function contaNodi() {
      var mio = ++giro, b = st.b.slice(), p = turno();
      conti.textContent = t('Conto i nodi…', 'Counting nodes…');
      setTimeout(function () {
        if (mio !== giro) return;
        if (vincitore(b) >= 0) { conti.textContent = t('Partita finita.', 'Game over.'); return; }
        var A = valoreTris(b, p, true), N = { v: -Infinity, nodi: 1 }, figli = [];
        for (var i = 0; i < 9; i++) if (!b[i]) figli.push(i);
        /* minimax senza potatura un sottoalbero alla volta: nessun blocco lungo */
        (function lotto() {
          if (mio !== giro) return;
          if (figli.length) { var i2 = figli.shift(), bb = b.slice(), c = { n: 0, foglie: 0 }; bb[i2] = p; var v = -negamax(bb, 3 - p, 1, c, i2); N.nodi += c.n; if (v > N.v) N.v = v; setTimeout(lotto, 0); return; }
          conti.innerHTML = t('Da questa posizione: valore ', 'From this position: value ') + '<b>' + (N.v > 0 ? '+1' : N.v < 0 ? '−1' : '0') + '</b> · ' + t('nodi senza potatura ', 'nodes without pruning ') + '<b class="bsiFX-num">' + N.nodi.toLocaleString() + '</b> · ' + t('con alfa-beta ', 'with alpha-beta ') + '<b class="bsiFX-num">' + A.nodi.toLocaleString() + '</b> (' + fmt(100 * A.nodi / N.nodi) + ' %) · ' + t('stesso valore ', 'same value ') + (A.v === N.v ? '✓' : '✗');
        })();
      }, 30);
    }
    aggiorna(); F.alRidimensiona(disegna);
  }

  /* ═══ 4. nim ════════════════════════════════════════════════════════════ */
  function schedaNim(div) {
    var Gp = griglia(div), st = { k: 4, seme: 3, h: [], tocca: 0, ultima: null, fine: false }, info = nota(Gp.pan), bin = F.el('div', { style: 'overflow-x:auto' }), timer = null;
    F.cursore(Gp.pan, ['mucchi', 'heaps'], 2, 6, 1, st.k, function (v) { st.k = v; nuova(); });
    F.bottone(Gp.pan, ['Nuova partita', 'New game'], function () { st.seme++; nuova(); });
    F.bottone(Gp.pan, ['Fai muovere il computer', 'Let the computer move'], function () { if (!st.fine && st.tocca === 0) { clearTimeout(timer); computer(); } });
    Gp.pan.appendChild(bin); Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.7);
    function nuova() { var r = mulberry32(st.seme * 31 + st.k); st.h = []; for (var i = 0; i < st.k; i++) st.h.push(1 + Math.floor(r() * 7)); st.tocca = 0; st.ultima = null; st.fine = false; clearTimeout(timer); aggiorna(); }
    function geometria(W, H) { var n = st.h.length, rh = H / n, d = Math.min(rh * 0.7, (W - 60) / 7.6); return { rh: rh, d: d, x0: 50 }; }
    cv.addEventListener('click', function (ev) {
      if (st.fine || st.tocca !== 0) return;
      var r = cv.getBoundingClientRect(); if (!r.width) return;
      var P = { W: Math.max(280, cv.clientWidth || 600) }; P.H = Math.round(P.W * cv._rapporto);
      var x = (ev.clientX - r.left) / r.width * P.W, y = (ev.clientY - r.top) / r.height * P.H, g = geometria(P.W, P.H), i = Math.floor(y / g.rh), j = Math.floor((x - g.x0) / (g.d * 1.05));
      if (i < 0 || i >= st.h.length || j < 0 || j >= st.h[i]) return;
      /* si tolgono il gettone toccato e tutti quelli alla sua destra */
      st.ultima = { i: i, da: st.h[i], a: j, chi: 0 }; st.h[i] = j; st.tocca = 1; aggiorna();
      if (!fine()) { clearTimeout(timer); timer = setTimeout(computer, 700); }
    });
    function fine() { if (st.h.every(function (v) { return v === 0; })) { st.fine = true; aggiorna(); return true; } return false; }
    function computer() {
      var m = mossaNim(st.h);
      if (!m) { var i = st.h.indexOf(Math.max.apply(null, st.h)); m = [i, st.h[i] - 1]; }
      st.ultima = { i: m[0], da: st.h[m[0]], a: m[1], chi: 1 }; st.h[m[0]] = m[1]; st.tocca = 0; aggiorna(); fine();
    }
    function aggiorna() {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, g = geometria(W, H);
      q.font = '12px system-ui'; q.textBaseline = 'middle';
      st.h.forEach(function (n, i) {
        var y = (i + 0.5) * g.rh; q.fillStyle = '#9fb1c6'; q.fillText(String(n), 14, y);
        for (var j = 0; j < 7; j++) {
          var x = g.x0 + j * g.d * 1.05 + g.d / 2;
          if (j < n) { q.fillStyle = '#ffc45a'; q.beginPath(); q.arc(x, y, g.d * 0.42, 0, Math.PI * 2); q.fill(); }
          else if (st.ultima && st.ultima.i === i && j < st.ultima.da) { q.strokeStyle = st.ultima.chi ? '#ff8a80' : '#6bcfff'; q.lineWidth = 2; q.beginPath(); q.arc(x, y, g.d * 0.42, 0, Math.PI * 2); q.stroke(); q.lineWidth = 1; }
          else { q.fillStyle = 'rgba(52,70,95,.35)'; q.beginPath(); q.arc(x, y, g.d * 0.12, 0, Math.PI * 2); q.fill(); }
        }
      });
      q.textBaseline = 'alphabetic';
      cv.setAttribute('aria-label', t('mucchi di gettoni del nim: clicca un gettone per togliere lui e quelli alla sua destra', 'nim heaps: click a token to remove it and those to its right'));
      var s = nimSomma(st.h), bits = 3;
      bin.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('mucchio', 'heap') + '</th><th>n</th><th>' + t('binario', 'binary') + '</th></tr>' + st.h.map(function (n, i) { return '<tr><td>' + (i + 1) + '</td><td class="bsiFX-num">' + n + '</td><td class="bsiFX-num" style="font-family:monospace">' + ('000' + n.toString(2)).slice(-bits) + '</td></tr>'; }).join('') + '<tr><td><b>⊕</b></td><td class="bsiFX-num"><b>' + s + '</b></td><td class="bsiFX-num" style="font-family:monospace;color:' + (s ? '#5eead4' : '#ff8a80') + '"><b>' + ('000' + s.toString(2)).slice(-bits) + '</b></td></tr></table>';
      var m = mossaNim(st.h);
      info.innerHTML = (st.fine ? (st.tocca === 1 ? '<b class="bsiFX-ok">' + t('Hai preso l’ultimo gettone: hai vinto!', 'You took the last token: you won!') + '</b>' : '<b class="bsiFX-ko">' + t('Il computer ha preso l’ultimo gettone.', 'The computer took the last token.') + '</b>') : st.tocca === 0 ? t('Tocca a te. ', 'Your move. ') + (s ? t('Somma-nim ≠ 0: sei in vantaggio, una mossa vincente è portare il mucchio ', 'Nim-sum ≠ 0: you are ahead, a winning move is to bring heap ') + (m[0] + 1) + t(' a ', ' to ') + m[1] + '.' : t('Somma-nim = 0: ogni tua mossa la rende ≠ 0, e il computer la riporta a 0.', 'Nim-sum = 0: any move of yours makes it ≠ 0, and the computer brings it back to 0.')) : t('Muove il computer…', 'Computer moving…')) +
        '<br>' + t('Regole: a turno si tolgono quanti gettoni si vuole da un solo mucchio; chi prende l’ultimo vince. Teorema di Bouton (1901): una posizione è perdente per chi muove se e solo se la somma-nim h₁ ⊕ h₂ ⊕ … (XOR delle cifre binarie, colonna per colonna senza riporto) è 0. Da somma 0 ogni mossa cambia un solo mucchio e quindi la somma; da somma s ≠ 0 basta ridurre un mucchio con il bit più alto di s a h ⊕ s. Per il teorema di Sprague–Grundy ogni gioco imparziale equivale a un mucchio di nim.', 'Rules: in turn you remove any number of tokens from a single heap; whoever takes the last wins. Bouton’s theorem (1901): a position is losing for the player to move iff the nim-sum h₁ ⊕ h₂ ⊕ … (XOR of the binary digits, column by column without carry) is 0. From sum 0 every move changes one heap and therefore the sum; from sum s ≠ 0 it suffices to reduce a heap having the top bit of s to h ⊕ s. By the Sprague–Grundy theorem every impartial game is equivalent to a nim heap.');
    }
    nuova(); F.alRidimensiona(aggiorna);
  }

  F.sezione('smatgiochi', {
    titolo: ['♟️ Teoria dei giochi', '♟️ Game theory'],
    sotto: ['Gli equilibri di Nash puri e misti nei giochi 2×2, il dilemma del prigioniero ripetuto con il torneo di Axelrod e la dinamica del replicatore, il minimax con la potatura alfa-beta sul tris, la strategia vincente del nim.', 'Pure and mixed Nash equilibria in 2×2 games, the iterated prisoner’s dilemma with Axelrod’s tournament and replicator dynamics, minimax with alpha-beta pruning on tic-tac-toe, the winning strategy of nim.'],
    schede: [
      { nome: ['⚖️ Giochi 2×2', '⚖️ 2×2 games'], costruisci: schedaDueXDue },
      { nome: ['🔁 Dilemma ripetuto', '🔁 Iterated dilemma'], costruisci: schedaTorneo },
      { nome: ['❌ Tris e minimax', '❌ Tic-tac-toe and minimax'], costruisci: schedaTris },
      { nome: ['🪙 Nim', '🪙 Nim'], costruisci: schedaNim }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
