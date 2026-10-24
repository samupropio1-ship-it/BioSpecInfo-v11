/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-serie.js — ♾️ successioni e serie
   BioSpecInfo · © Samuele Pio Provenzano

   · SUCCESSIONI: la definizione di limite con ε e N; si sceglie ε, una fascia
     [L − ε, L + ε] attorno al limite e i termini che compaiono uno a uno; il
     primo N da cui in poi tutti i termini restano dentro e' calcolato (e per
     (−1)ⁿ si vede che non esiste);
   · SERIE E CRITERI: somme parziali di geometrica, armonica, serie p,
     armonica a segni alterni (→ ln 2), Σ1/n² (→ π²/6), Σ1/n! (→ e); i
     criteri del rapporto, della radice, dell'integrale e di Leibniz, con le
     stime dell'errore (resto di Leibniz, limiti integrali, resto esatto);
   · RIORDINO: il teorema di Riemann; l'armonica alterna riordinata con
     l'algoritmo goloso converge a qualunque numero scelto, mentre la stessa
     permutazione applicata a Σ(−1)ⁿ⁺¹/n² (assolutamente convergente) non
     cambia la somma π²/12;
   · SERIE DI POTENZE: il disco di convergenza nel piano complesso, il raggio
     dal criterio del rapporto e da Cauchy–Hadamard, le singolarita' che lo
     limitano, e le somme parziali sulla retta reale contro la funzione vera.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* ln n!: somma esatta fino a 200, poi la serie di Stirling (errore < 10⁻¹²) */
  function lnFatt(n) {
    if (n < 2) return 0;
    if (n <= 200) { var s = 0; for (var i = 2; i <= n; i++) s += Math.log(i); return s; }
    return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n) + 1 / (12 * n) - 1 / (360 * n * n * n);
  }
  function fatt(n) { var f = 1; for (var i = 2; i <= n; i++) f *= i; return f; }

  /* successioni: [nome, aₙ, limite (null se non esiste)] */
  var SUCC = {
    inv: [['1/n', '1/n'], function (n) { return 1 / n; }, 0],
    e: [['(1 + 1/n)ⁿ', '(1 + 1/n)ⁿ'], function (n) { return Math.exp(n * Math.log1p(1 / n)); }, Math.E],
    sinn: [['sin(n)/n', 'sin(n)/n'], function (n) { return Math.sin(n) / n; }, 0],
    geo: [['0,9ⁿ', '0.9ⁿ'], function (n) { return Math.pow(0.9, n); }, 0],
    rad: [['ⁿ√n', 'ⁿ√n'], function (n) { return Math.exp(Math.log(n) / n); }, 1],
    alt: [['(−1)ⁿ (non converge)', '(−1)ⁿ (does not converge)'], function (n) { return n % 2 ? -1 : 1; }, null]
  };
  /* il primo N tale che |aₙ − L| < ε per ogni n ≥ N (controllato fino a nmax);
     per (−1)ⁿ si prova il candidato L = 0: funziona solo se ε > 1, e nessun L va bene per ε ≤ 1 */
  function soglia(chiave, eps, nmax) {
    var S = SUCC[chiave], L = S[2] === null ? 0 : S[2]; nmax = nmax || Math.ceil(50 / eps) + 100;
    if (S[2] === null && eps <= 1) return null;
    var ultimo = 0;
    for (var n = 1; n <= nmax; n++) if (!(Math.abs(S[1](n) - L) < eps)) ultimo = n;
    return ultimo + 1;
  }

  /* serie numeriche: termine aₙ (n dall'indice iniziale i0), ln|aₙ| per i criteri */
  var SERIE = {
    geom: [['geometrica Σ rⁿ (n ≥ 0)', 'geometric Σ rⁿ (n ≥ 0)'], 0],
    arm: [['armonica Σ 1/n', 'harmonic Σ 1/n'], 1],
    p: [['serie p: Σ 1/nᵖ', 'p-series Σ 1/nᵖ'], 1],
    alt: [['armonica alterna Σ (−1)ⁿ⁺¹/n', 'alternating harmonic Σ (−1)ⁿ⁺¹/n'], 1],
    basel: [['Basilea Σ 1/n²', 'Basel Σ 1/n²'], 1],
    espo: [['esponenziale Σ 1/n! (n ≥ 0)', 'exponential Σ 1/n! (n ≥ 0)'], 0]
  };
  function termine(k, n, par) {
    switch (k) {
      case 'geom': return Math.pow(par.r, n);
      case 'arm': return 1 / n;
      case 'p': return Math.pow(n, -par.p);
      case 'alt': return (n % 2 ? 1 : -1) / n;
      case 'basel': return 1 / (n * n);
      default: return Math.exp(-lnFatt(n));
    }
  }
  function lnTermine(k, n, par) {
    switch (k) {
      case 'geom': return n * Math.log(Math.abs(par.r));
      case 'arm': case 'alt': return -Math.log(n);
      case 'p': return -par.p * Math.log(n);
      case 'basel': return -2 * Math.log(n);
      default: return -lnFatt(n);
    }
  }
  /* somme parziali S₁ … S_N (S_N = somma dei primi N termini) */
  function somme(k, par, N) {
    var i0 = SERIE[k][1], s = 0, out = [];
    for (var j = 0; j < N; j++) { s += termine(k, i0 + j, par); out.push(s); }
    return out;
  }
  /* ζ(p) con Eulero–Maclaurin: somma fino a M e la coda in forma chiusa */
  function codaP(p, M) {
    return Math.pow(M, 1 - p) / (p - 1) - 0.5 * Math.pow(M, -p) + p * Math.pow(M, -p - 1) / 12 - p * (p + 1) * (p + 2) * Math.pow(M, -p - 3) / 720 + p * (p + 1) * (p + 2) * (p + 3) * (p + 4) * Math.pow(M, -p - 5) / 30240;
  }
  /* Σ_{n=1}^{N} n^−p più la coda Σ_{n>N}: la coda di E–M parte da M = N + 1 con il termine ½f(M) già incluso */
  function sommaConCoda(p, N) {
    var s = 0; for (var n = 1; n <= N; n++) s += Math.pow(n, -p);
    var M = N + 1;
    return s + Math.pow(M, -p) + codaP(p, M);
  }
  function zeta(p) { return p > 1 ? sommaConCoda(p, 20) : Infinity; }
  function sommaEsatta(k, par) {
    switch (k) {
      case 'geom': return Math.abs(par.r) < 1 ? 1 / (1 - par.r) : NaN;
      case 'arm': return Infinity;
      case 'p': return zeta(par.p);
      case 'alt': return Math.LN2;
      case 'basel': return Math.PI * Math.PI / 6;
      default: return Math.E;
    }
  }
  /* i criteri, valutati a n = 10⁶ (ln|aₙ| non va mai in overflow): limite stimato e verdetto */
  function verdetto(L) { return !isFinite(L) ? 'div' : Math.abs(L - 1) < 1e-3 ? 'nulla' : L < 1 ? 'conv' : 'div'; }
  function testRapporto(k, par) {
    if (k === 'geom') { var a = Math.abs(par.r); return { L: a, v: verdetto(a) }; }
    var n = 1e6, L = Math.exp(lnTermine(k, n + 1, par) - lnTermine(k, n, par)); return { L: L, v: verdetto(L) };
  }
  function testRadice(k, par) {
    if (k === 'geom') { var a = Math.abs(par.r); return { L: a, v: verdetto(a) }; }
    var n = 1e6, L = Math.exp(lnTermine(k, n, par) / n); return { L: L, v: verdetto(L) };
  }
  /* integrale: per f positiva e decrescente, Σ f(n) e ∫₁^∞ f convergono insieme */
  function testIntegrale(k, par) {
    if (k === 'arm') return 'div';
    if (k === 'p') return par.p > 1 ? 'conv' : 'div';
    if (k === 'basel') return 'conv';
    if (k === 'geom') return par.r > 0 ? (par.r < 1 ? 'conv' : 'div') : null;
    return null;
  }
  function leibniz(k, par) { return k === 'alt' || (k === 'geom' && par.r < 0 && par.r > -1); }
  /* stima dell'errore dopo N termini: intervallo [basso, alto] che contiene la somma */
  function stima(k, par, N) {
    var S = somme(k, par, N + 1), SN = S[N - 1];
    if (k === 'geom') { if (Math.abs(par.r) >= 1) return { S: SN, metodo: 'div' }; var R = Math.pow(par.r, N) / (1 - par.r); return { S: SN, basso: SN + R, alto: SN + R, metodo: 'esatto' }; }
    if (k === 'alt') return { S: SN, basso: Math.min(SN, S[N]), alto: Math.max(SN, S[N]), resto: 1 / (N + 1), metodo: 'leibniz' };
    if (k === 'espo') { var u = Math.exp(-lnFatt(N)); return { S: SN, basso: SN + u, alto: SN + u * (N + 1) / N, metodo: 'espo' }; }
    var p = k === 'basel' ? 2 : k === 'arm' ? 1 : par.p;
    if (p <= 1) return { S: SN, basso: p === 1 ? Math.log(N + 1) : (Math.pow(N + 1, 1 - p) - 1) / (1 - p), metodo: 'div' };
    return { S: SN, basso: SN + Math.pow(N + 1, 1 - p) / (p - 1), alto: SN + Math.pow(N, 1 - p) / (p - 1), metodo: 'integrale' };
  }

  /* riordino goloso dell'armonica alterna verso T: positivi 1/(2k−1) finche' S ≤ T, negativi −1/(2k) finche' S > T.
     Restituisce le somme parziali, l'indice originale di ogni termine usato e il limite rigoroso dell'errore */
  function riordina(T, n) {
    var s = 0, ip = 1, in_ = 2, somme0 = [], idx = [], lastP = 1, lastN = 0.5, incrociato = false, pos = 0, neg = 0;
    for (var j = 0; j < n; j++) {
      if (s <= T) { s += 1 / ip; idx.push(ip); lastP = 1 / ip; ip += 2; pos++; if (s > T) incrociato = true; }
      else { s -= 1 / in_; idx.push(in_); lastN = 1 / in_; in_ += 2; neg++; if (s <= T) incrociato = true; }
      somme0.push(s);
    }
    return { somme: somme0, idx: idx, pos: pos, neg: neg, limite: incrociato ? Math.max(lastP, lastN) : Infinity };
  }
  /* la stessa permutazione applicata a una serie qualunque bₙ */
  function applica(idx, b) { var s = 0; return idx.map(function (n) { s += b(n); return s; }); }
  /* riordino a blocchi: p positivi, q negativi → ln 2 + ½ ln(p/q) */
  function blocchi(p, q, nb) {
    var s = 0, ip = 1, in_ = 2;
    for (var b = 0; b < nb; b++) { for (var i = 0; i < p; i++) { s += 1 / ip; ip += 2; } for (i = 0; i < q; i++) { s -= 1 / in_; in_ += 2; } }
    return s;
  }

  /* serie di potenze Σ cₙ zⁿ: coefficiente, ln|cₙ|, funzione vera sulla retta reale, singolarita' */
  var POT = {
    geom: [['Σ zⁿ = 1/(1 − z)', 'Σ zⁿ = 1/(1 − z)'], function (n) { return 1; }, function (n) { return 0; }, function (x) { return x < 1 ? 1 / (1 - x) : NaN; }, [[1, 0]]],
    log: [['Σ zⁿ/n = −ln(1 − z)', 'Σ zⁿ/n = −ln(1 − z)'], function (n) { return n ? 1 / n : 0; }, function (n) { return n ? -Math.log(n) : -Infinity; }, function (x) { return x < 1 ? -Math.log(1 - x) : NaN; }, [[1, 0]]],
    log1p: [['Σ (−1)ⁿ⁺¹zⁿ/n = ln(1 + z)', 'Σ (−1)ⁿ⁺¹zⁿ/n = ln(1 + z)'], function (n) { return n ? (n % 2 ? 1 : -1) / n : 0; }, function (n) { return n ? -Math.log(n) : -Infinity; }, function (x) { return x > -1 ? Math.log(1 + x) : NaN; }, [[-1, 0]]],
    espo: [['Σ zⁿ/n! = eᶻ', 'Σ zⁿ/n! = eᶻ'], function (n) { return 1 / fatt(n); }, function (n) { return -lnFatt(n); }, Math.exp, []],
    mezzi: [['Σ zⁿ/2ⁿ = 2/(2 − z)', 'Σ zⁿ/2ⁿ = 2/(2 − z)'], function (n) { return Math.pow(0.5, n); }, function (n) { return -n * Math.LN2; }, function (x) { return x < 2 ? 2 / (2 - x) : NaN; }, [[2, 0]]],
    atan: [['Σ (−1)ᵏ z²ᵏ⁺¹/(2k+1) = arctan z', 'Σ (−1)ᵏ z²ᵏ⁺¹/(2k+1) = arctan z'], function (n) { return n % 2 ? ((n - 1) / 2 % 2 ? -1 : 1) / n : 0; }, function (n) { return n % 2 ? -Math.log(n) : -Infinity; }, Math.atan, [[0, 1], [0, -1]]],
    runge: [['Σ (−1)ᵏ z²ᵏ = 1/(1 + z²)', 'Σ (−1)ᵏ z²ᵏ = 1/(1 + z²)'], function (n) { return n % 2 ? 0 : (n / 2 % 2 ? -1 : 1); }, function (n) { return n % 2 ? -Infinity : 0; }, function (x) { return 1 / (1 + x * x); }, [[0, 1], [0, -1]]],
    fatt: [['Σ n! zⁿ (raggio nullo)', 'Σ n! zⁿ (zero radius)'], function (n) { return fatt(n); }, function (n) { return lnFatt(n); }, function () { return NaN; }, []]
  };
  function classifica(R) { return R > 1e4 ? Infinity : R < 1e-4 ? 0 : Math.round(R * 1000) / 1000; }
  /* rapporto: R = lim |cₙ/cₙ₊ₛ|^(1/s), con s = 2 se i coefficienti dispari (o pari) sono nulli */
  function raggioRapporto(k) {
    var L = POT[k][2], n = 1e6, s = isFinite(L(n)) && isFinite(L(n + 1)) ? 1 : 2;
    if (!isFinite(L(n))) n++;
    var R = Math.exp((L(n) - L(n + s)) / s); return { stima: R, R: classifica(R) };
  }
  /* Cauchy–Hadamard: 1/R = limsup |cₙ|^(1/n), il limsup preso su due indici consecutivi */
  function raggioRadice(k) {
    var L = POT[k][2], n = 1e6, m = Math.max(L(n) / n, L(n + 1) / (n + 1)), R = Math.exp(-m); return { stima: R, R: classifica(R) };
  }
  function sommaPot(k, x, N) { var c = POT[k][1], s = 0, xn = 1; for (var n = 0; n <= N; n++) { s += c(n) * xn; xn *= x; } return s; }
  /* somma parziale complessa (per la mappa di convergenza) */
  function sommaPotC(k, re, im, N) { var c = POT[k][1], sr = 0, si = 0, pr = 1, pi = 0; for (var n = 0; n <= N; n++) { var cn = c(n); sr += cn * pr; si += cn * pi; var q = pr * re - pi * im; pi = pr * im + pi * re; pr = q; } return [sr, si]; }

  F.calcolo.serie = { lnFatt: lnFatt, SUCC: SUCC, soglia: soglia, SERIE: SERIE, termine: termine, somme: somme, sommaConCoda: sommaConCoda, zeta: zeta, sommaEsatta: sommaEsatta, testRapporto: testRapporto, testRadice: testRadice, testIntegrale: testIntegrale, leibniz: leibniz, stima: stima, riordina: riordina, applica: applica, blocchi: blocchi, POT: POT, raggioRapporto: raggioRapporto, raggioRadice: raggioRadice, sommaPot: sommaPot, sommaPotC: sommaPotC };

  function nomeVerdetto(v) { return v === 'conv' ? '<span class="bsiFX-ok">' + t('converge', 'converges') + '</span>' : v === 'div' ? '<span class="bsiFX-ko">' + t('diverge', 'diverges') + '</span>' : v === 'nulla' ? t('inconcludente (L = 1)', 'inconclusive (L = 1)') : t('non applicabile', 'not applicable'); }

  /* ═══ 1. successioni ════════════════════════════════════════════════════ */
  function schedaSucc(div) {
    var G = griglia(div), st = { s: 'inv', le: -1 }, info = nota(G.pan), N, nVis, k = 0;
    F.scelta(G.pan, ['Successione', 'Sequence'], Object.keys(SUCC).map(function (c) { return [c, F.tt(SUCC[c][0])]; }), st.s, function (v) { st.s = v; calcola(); });
    F.cursore(G.pan, ['ε (scala logaritmica)', 'ε (log scale)'], -2, Math.log10(1.5), 0.01, st.le, function (v) { st.le = v; calcola(); }, function (v) { return fmt(Math.pow(10, v)); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6), ctl;
    function calcola() {
      var eps = Math.pow(10, st.le), S = SUCC[st.s];
      N = soglia(st.s, eps); nVis = Math.min(800, Math.max(40, Math.ceil((N || 40) * 1.4))); k = 0;
      info.innerHTML = 'ε = <b class="bsiFX-num">' + fmt(eps) + '</b> · ' + (N !== null ? 'N = <b class="bsiFX-num">' + N + '</b>' : '<b class="bsiFX-ko">' + t('nessun N esiste', 'no N exists') + '</b>') + '<br>' +
        (S[2] === null ? t('I termini saltano fra −1 e +1: distano 2, quindi nessuna fascia di semiampiezza ε ≤ 1 li contiene definitivamente, qualunque sia L. La successione non ha limite (ha due punti di accumulazione).', 'The terms jump between −1 and +1: they are 2 apart, so no band of half-width ε ≤ 1 eventually contains them, whatever L is. The sequence has no limit (it has two accumulation points).') :
          t('Limite L = ', 'Limit L = ') + fmt(S[2]) + '. ' + (st.s === 'inv' ? t('Qui N = ⌊1/ε⌋ + 1 esattamente.', 'Here N = ⌊1/ε⌋ + 1 exactly.') : st.s === 'e' ? t('L’errore è e − (1+1/n)ⁿ ≈ e/(2n): N ≈ e/(2ε), convergenza lenta.', 'The error is e − (1+1/n)ⁿ ≈ e/(2n): N ≈ e/(2ε), slow convergence.') : st.s === 'sinn' ? t('|sin n/n| ≤ 1/n basta per N ≤ ⌈1/ε⌉, ma i termini oscillano e il vero N può essere più piccolo.', '|sin n/n| ≤ 1/n gives N ≤ ⌈1/ε⌉, but the terms oscillate and the true N can be smaller.') : st.s === 'geo' ? t('0,9ⁿ < ε per n > ln ε / ln 0,9: convergenza geometrica, N cresce solo come ln(1/ε).', '0.9ⁿ < ε for n > ln ε / ln 0.9: geometric convergence, N grows only like ln(1/ε).') : t('ⁿ√n − 1 ≈ ln n / n: decresce più lentamente di 1/n.', 'ⁿ√n − 1 ≈ ln n / n: decreases more slowly than 1/n.'))) +
        '<br>' + t('Definizione: aₙ → L se per ogni ε > 0 esiste N tale che n ≥ N ⇒ |aₙ − L| < ε. N dipende da ε: più stretta la fascia, più avanti bisogna andare.', 'Definition: aₙ → L if for every ε > 0 there is N such that n ≥ N ⇒ |aₙ − L| < ε. N depends on ε: the narrower the band, the further one must go.');
      if (ctl) ctl.sveglia();
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      k = Math.min(nVis, k + Math.max(1, dt * nVis / 3));
      var S = SUCC[st.s], eps = Math.pow(10, st.le), L = S[2] === null ? 0 : S[2], punti = [], nk = Math.max(1, Math.floor(k));
      for (var n = 1; n <= nk; n++) { var a = S[1](n); punti.push({ x: n, y: a, col: Math.abs(a - L) < eps ? '#5eead4' : '#ff8a80', r: nVis > 200 ? 1.6 : 2.6 }); }
      var lo = Math.min(L - eps, L - 0.2), hi = Math.max(L + eps, L + 0.2);
      if (st.s === 'inv' || st.s === 'geo') hi = Math.max(hi, 1); if (st.s === 'e') lo = Math.min(lo, 2); if (st.s === 'rad') hi = Math.max(hi, 1.45); if (st.s === 'alt' || st.s === 'sinn') { lo = Math.min(lo, -1.1); hi = Math.max(hi, 1.1); }
      var serie = [{ x: [0, nVis + 1], y: [L + eps, L + eps], col: 'rgba(255,196,90,.8)', larg: 1, tratt: true, etich: 'L + ε' }, { x: [0, nVis + 1], y: [L - eps, L - eps], col: 'rgba(255,196,90,.8)', larg: 1, tratt: true, etich: 'L − ε' }];
      if (N !== null && N <= nVis && k >= N) serie.push({ x: [N, N], y: [lo, hi], col: '#c9b9ff', larg: 1.5, etich: 'N' });
      var o = F.grafico(cv, { serie: serie, punti: punti, xmin: 0, xmax: nVis + 1, ymin: lo, ymax: hi, xl: ['n', 'n'], yl: ['aₙ', 'aₙ'], linee: [{ y: L, col: '#ffd24a', etich: S[2] === null ? t('candidato L = 0', 'candidate L = 0') : 'L' }], descr: ['termini della successione e fascia ε', 'sequence terms and ε band'] });
      o.q.fillStyle = 'rgba(255,196,90,.08)'; o.q.fillRect(o.X(0), o.Y(L + eps), o.X(nVis + 1) - o.X(0), o.Y(L - eps) - o.Y(L + eps));
      if (N !== null && N > nVis) { o.q.fillStyle = '#c9b9ff'; o.q.font = '11px system-ui'; o.q.textAlign = 'right'; o.q.fillText('N = ' + N + ' →', o.W - 20, o.H - 50); }
      if (k >= nVis) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 2. serie e criteri ════════════════════════════════════════════════ */
  function schedaCriteri(div) {
    var G = griglia(div), st = { s: 'alt', p: 1.5, r: 0.5, N: 50 }, info = nota(G.pan);
    F.scelta(G.pan, ['Serie', 'Series'], Object.keys(SERIE).map(function (c) { return [c, F.tt(SERIE[c][0])]; }), st.s, function (v) { st.s = v; disegna(); });
    F.cursore(G.pan, ['esponente p (serie p)', 'exponent p (p-series)'], 0.5, 3, 0.05, st.p, function (v) { st.p = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['ragione r (geometrica)', 'ratio r (geometric)'], -1.2, 1.2, 0.05, st.r, function (v) { st.r = Math.abs(v) < 1e-9 ? 0 : v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['termini N', 'terms N'], 1, 200, 1, st.N, function (v) { st.N = v; disegna(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.62);
    function disegna() {
      var par = { p: st.p, r: st.r }, k = st.s, S = somme(k, par, st.N), xs = S.map(function (_, i) { return i + 1; }), E = stima(k, par, st.N), esatta = sommaEsatta(k, par);
      var linee = [], ys = S.filter(isFinite);
      if (isFinite(esatta)) linee.push({ y: esatta, col: '#ffd24a', etich: 'S = ' + fmt(esatta) });
      if (E.alto != null && E.metodo !== 'esatto') { linee.push({ y: E.basso, col: '#c9b9ff' }); linee.push({ y: E.alto, col: '#c9b9ff' }); }
      var lo = Math.min.apply(null, ys.concat(isFinite(esatta) ? [esatta] : [])), hi = Math.max.apply(null, ys.concat(isFinite(esatta) ? [esatta] : []));
      if (Math.abs(hi) > 1e6) hi = 1e6; if (lo < -1e6) lo = -1e6;
      F.grafico(cv, { serie: [{ x: xs, y: S, col: '#6bcfff', larg: 2, etich: 'Sₙ' }], punti: st.N <= 60 ? S.map(function (v, i) { return { x: i + 1, y: v, col: '#6bcfff', r: 2.5 }; }) : [], xmin: 0, xmax: st.N + 1, ymin: lo - 0.08 * (hi - lo + 0.1), ymax: hi + 0.08 * (hi - lo + 0.1), linee: linee, xl: [t('numero di termini n', 'number of terms n'), 'number of terms n'], yl: [t('somma parziale Sₙ', 'partial sum Sₙ'), 'partial sum Sₙ'], descr: ['somme parziali della serie', 'partial sums of the series'] });
      var R = testRapporto(k, par), Q = testRadice(k, par), I = testIntegrale(k, par), errore = '';
      if (E.metodo === 'esatto') errore = t('Resto esatto: S − S_N = r^N/(1 − r) = ', 'Exact remainder: S − S_N = r^N/(1 − r) = ') + fmt(E.basso - E.S);
      else if (E.metodo === 'leibniz') errore = t('Leibniz: |S − S_N| ≤ a_{N+1} = ', 'Leibniz: |S − S_N| ≤ a_{N+1} = ') + fmt(E.resto) + t('; errore vero ', '; true error ') + fmt(Math.abs(esatta - E.S));
      else if (E.metodo === 'integrale') errore = t('Integrale: S_N + ∫_{N+1}^∞ ≤ S ≤ S_N + ∫_N^∞, cioè ', 'Integral: S_N + ∫_{N+1}^∞ ≤ S ≤ S_N + ∫_N^∞, i.e. ') + fmt(E.basso) + ' ≤ S ≤ ' + fmt(E.alto);
      else if (E.metodo === 'espo') errore = t('Resto: 1/N! ≤ e − S_N ≤ (N+1)/(N·N!), quindi ', 'Remainder: 1/N! ≤ e − S_N ≤ (N+1)/(N·N!), so ') + fmt(E.basso) + ' ≤ e ≤ ' + fmt(E.alto);
      else errore = t('Diverge: ', 'Diverges: ') + (E.basso != null ? 'S_N ≥ ∫₁^{N+1} x⁻ᵖ dx = ' + fmt(E.basso) : '|r| ≥ 1, ' + t('i termini non tendono a 0', 'the terms do not tend to 0'));
      info.innerHTML = 'S_' + st.N + ' = <b class="bsiFX-num">' + fmt(S[st.N - 1]) + '</b>' + (isFinite(esatta) ? ' · S = ' + fmt(esatta) : '') + '<br>' +
        t('Rapporto', 'Ratio') + ' |aₙ₊₁/aₙ| → ' + fmt(R.L) + ': ' + nomeVerdetto(R.v) + '<br>' + t('Radice', 'Root') + ' |aₙ|^(1/n) → ' + fmt(Q.L) + ': ' + nomeVerdetto(Q.v) + '<br>' + t('Integrale', 'Integral') + ': ' + nomeVerdetto(I) + ' · Leibniz: ' + (leibniz(k, par) ? '<span class="bsiFX-ok">' + t('converge', 'converges') + '</span>' : t('non applicabile', 'not applicable')) + '<br>' + errore + '<br>' +
        t('Rapporto e radice dicono «converge» se il limite è < 1 e tacciono se è 1: per tutte le serie p (anche Σ1/n², che converge) il limite è 1. Il criterio dell’integrale le separa: Σ 1/nᵖ converge se e solo se p > 1. Leibniz: termini alterni decrescenti verso 0 convergono e l’errore è minore del primo termine trascurato.', 'Ratio and root say “converges” if the limit is < 1 and are silent if it is 1: for every p-series (even Σ1/n², which converges) the limit is 1. The integral test separates them: Σ 1/nᵖ converges if and only if p > 1. Leibniz: alternating terms decreasing to 0 converge and the error is smaller than the first neglected term.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. riordino di Riemann ════════════════════════════════════════════ */
  function schedaRiordino(div) {
    var G = griglia(div), st = { T: 1.5 }, info = nota(G.pan), NT = 1000, R, B, k = 0, Z = Math.PI * Math.PI / 12;
    F.cursore(G.pan, ['somma voluta T', 'target sum T'], -2, 3, 0.05, st.T, function (v) { st.T = v; calcola(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.62), ctl;
    function calcola() {
      R = riordina(st.T, NT); B = applica(R.idx, function (n) { return (n % 2 ? 1 : -1) / (n * n); }); k = 0;
      info.innerHTML = t('Dopo ', 'After ') + NT + t(' termini: ', ' terms: ') + R.pos + t(' positivi, ', ' positive, ') + R.neg + t(' negativi', ' negative') + '<br>' +
        t('Armonica alterna riordinata: S = ', 'Rearranged alternating harmonic: S = ') + '<b class="bsiFX-num">' + R.somme[NT - 1].toFixed(5) + '</b> (|S − T| = ' + fmt(Math.abs(R.somme[NT - 1] - st.T)) + ' ≤ ' + fmt(R.limite) + ')<br>' +
        t('Stessa permutazione su Σ(−1)ⁿ⁺¹/n²: ', 'Same permutation on Σ(−1)ⁿ⁺¹/n²: ') + '<b class="bsiFX-num">' + B[NT - 1].toFixed(5) + '</b> (π²/12 = ' + Z.toFixed(5) + ')<br>' +
        t('Teorema di Riemann: se Σaₙ converge ma Σ|aₙ| = ∞, i positivi e i negativi presi da soli divergono, e riordinando si ottiene qualunque somma: si aggiungono positivi finché si supera T, poi negativi finché si scende sotto, e così via; poiché i termini → 0 le oscillazioni attorno a T si spengono. Se invece Σ|aₙ| < ∞ (Dirichlet) ogni riordino dà la stessa somma: la seconda curva arriva comunque a π²/12, con un ritardo dovuto ai negativi usati con parsimonia.', 'Riemann’s theorem: if Σaₙ converges but Σ|aₙ| = ∞, the positive and negative parts each diverge, and rearranging gives any sum: add positives until T is exceeded, then negatives until below, and so on; since the terms → 0 the oscillations around T die out. If instead Σ|aₙ| < ∞ (Dirichlet) every rearrangement gives the same sum: the second curve still reaches π²/12, delayed by the sparingly used negatives.');
      if (ctl) ctl.sveglia();
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      k = Math.min(NT, k + Math.max(1, dt * 220));
      var n = Math.max(2, Math.floor(k)), xs = []; for (var i = 1; i <= n; i++) xs.push(i);
      F.grafico(cv, { serie: [{ x: xs, y: R.somme.slice(0, n), col: '#6bcfff', larg: 1.8, etich: t('armonica alterna', 'alternating harmonic') }, { x: xs, y: B.slice(0, n), col: '#ff8a80', larg: 1.8, etich: 'Σ(−1)ⁿ⁺¹/n²' }], xmin: 0, xmax: NT, ymin: Math.min(-0.2, st.T - 0.5), ymax: Math.max(1.6, st.T + 0.5), linee: [{ y: st.T, col: '#ffd24a', etich: 'T' }, { y: Z, col: '#ff8a80', etich: 'π²/12' }, { y: Math.LN2, col: '#34465f', etich: 'ln 2' }], xl: [t('termini usati', 'terms used'), 'terms used'], yl: [t('somma parziale', 'partial sum'), 'partial sum'], legenda: [{ col: '#6bcfff', etich: ['armonica alterna riordinata', 'rearranged alternating harmonic'] }, { col: '#ff8a80', etich: ['stesso riordino, Σ(−1)ⁿ⁺¹/n²', 'same rearrangement, Σ(−1)ⁿ⁺¹/n²'] }], descr: ['somme parziali delle serie riordinate', 'partial sums of rearranged series'] });
      if (k >= NT) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 4. serie di potenze ═══════════════════════════════════════════════ */
  function schedaPotenze(div) {
    var G = griglia(div), st = { s: 'runge', N: 12 }, info = nota(G.pan);
    F.scelta(G.pan, ['Serie di potenze', 'Power series'], Object.keys(POT).map(function (c) { return [c, F.tt(POT[c][0])]; }), st.s, function (v) { st.s = v; disegna(); });
    F.cursore(G.pan, ['grado della somma parziale N', 'degree of partial sum N'], 1, 40, 1, st.N, function (v) { st.N = v; disegna(); });
    G.pan.appendChild(info);
    var cc = F.tela(G.dx, 0.75), cr = F.tela(G.dx, 0.55);
    function disegna() {
      var D = POT[st.s], Ra = raggioRapporto(st.s), Rr = raggioRadice(st.s), R = Rr.R;
      /* piano complesso */
      var P = F.pennello(cc), q = P.q, W = P.W, H = P.H, Lv = R === Infinity ? 4 : R === 0 ? 1 : 1.7 * R, sc = Math.min(W, H) / (2 * Lv), cx = W / 2, cy = H / 2;
      var nx = 90, ny = Math.round(nx * H / W), dw = W / nx, dh = H / ny, N2 = Math.min(80, 2 * st.N);
      for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) {
        var re = ((i + 0.5) * dw - cx) / sc, im = (cy - (j + 0.5) * dh) / sc, a = sommaPotC(st.s, re, im, st.N), b = sommaPotC(st.s, re, im, N2), d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        q.fillStyle = d < 1e-3 ? 'rgba(94,234,212,.30)' : d < 0.1 ? 'rgba(107,207,255,.16)' : d < 10 ? 'rgba(52,70,95,.35)' : 'rgba(8,21,34,0)';
        q.fillRect(i * dw, j * dh, dw + 0.5, dh + 0.5);
      }
      q.strokeStyle = '#34465f'; q.lineWidth = 1; q.beginPath(); q.moveTo(0, cy); q.lineTo(W, cy); q.moveTo(cx, 0); q.lineTo(cx, H); q.stroke();
      q.fillStyle = '#8494a8'; q.font = '11px system-ui'; q.textAlign = 'center';
      [-1, 1].forEach(function (s) { var u = s * (Lv > 2 ? Math.round(Lv / 2) : 1); q.fillText(String(u), cx + u * sc, cy + 14); q.fillText(u + 'i', cx + 14, cy - u * sc + 4); });
      if (R > 0 && isFinite(R)) { q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.setLineDash([6, 4]); q.beginPath(); q.arc(cx, cy, R * sc, 0, 2 * Math.PI); q.stroke(); q.setLineDash([]); q.lineWidth = 1; }
      if (R === 0) { q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx, cy, 4, 0, 2 * Math.PI); q.fill(); }
      D[4].forEach(function (z) { q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(cx + z[0] * sc, cy - z[1] * sc, 5, 0, 2 * Math.PI); q.fill(); });
      q.textAlign = 'left'; q.fillStyle = '#e6fffb'; q.fillText('R = ' + (R === Infinity ? '∞' : fmt(R)), 8, 16);
      q.fillStyle = '#8494a8'; q.fillText(t('verde: S_N ≈ S_2N (converge)', 'green: S_N ≈ S_2N (converges)'), 8, H - 8);
      cc.setAttribute('aria-label', t('disco di convergenza nel piano complesso', 'disc of convergence in the complex plane'));
      /* retta reale */
      var xr = R === Infinity ? 4 : R === 0 ? 1 : 1.5 * R, xs = [], yv = [], ys = [];
      for (var k = 0; k <= 300; k++) { var x = -xr + 2 * xr * k / 300; xs.push(x); yv.push(D[3](x)); ys.push(sommaPot(st.s, x, st.N)); }
      var fin = yv.filter(function (v) { return isFinite(v) && Math.abs(v) < 60; }), lo = fin.length ? Math.min.apply(null, fin) : -3, hi = fin.length ? Math.max.apply(null, fin) : 3;
      if (st.s === 'geom' || st.s === 'log' || st.s === 'mezzi') hi = Math.min(hi, 8); if (st.s === 'log1p') lo = Math.max(lo, -4);
      var pad = 0.25 * (hi - lo + 0.5), serie = [{ x: xs, y: yv, col: '#ffd24a', larg: 2.2, etich: 'f(x)' }, { x: xs, y: ys, col: '#6bcfff', larg: 1.8, etich: 'S_N(x)' }];
      if (R > 0 && isFinite(R)) { serie.push({ x: [-R, -R], y: [lo - pad, hi + pad], col: '#c9b9ff', larg: 1, tratt: true, etich: '−R' }); serie.push({ x: [R, R], y: [lo - pad, hi + pad], col: '#c9b9ff', larg: 1, tratt: true, etich: 'R' }); }
      F.grafico(cr, { serie: serie, xmin: -xr, xmax: xr, ymin: lo - pad, ymax: hi + pad, xl: ['x', 'x'], yl: ['f(x), S_N(x)', 'f(x), S_N(x)'], legenda: [{ col: '#ffd24a', etich: ['funzione vera', 'true function'] }, { col: '#6bcfff', etich: ['somma parziale di grado N', 'partial sum of degree N'] }], descr: ['somma parziale contro funzione sulla retta reale', 'partial sum versus function on the real line'] });
      info.innerHTML = t('Rapporto: R = lim |cₙ/cₙ₊₁| ≈ ', 'Ratio: R = lim |cₙ/cₙ₊₁| ≈ ') + '<b class="bsiFX-num">' + (Ra.R === Infinity ? '∞' : fmt(Ra.R)) + '</b> · Cauchy–Hadamard 1/R = limsup |cₙ|^(1/n): R ≈ <b class="bsiFX-num">' + (R === Infinity ? '∞' : fmt(R)) + '</b><br>' +
        (st.s === 'runge' || st.s === 'atan' ? t('Sulla retta reale la funzione è liscia ovunque, eppure la serie diverge per |x| > 1: il raggio è fissato dai poli complessi ±i (in rosso), a distanza 1 dall’origine.', 'On the real line the function is smooth everywhere, yet the series diverges for |x| > 1: the radius is set by the complex poles ±i (red), at distance 1 from the origin.') : st.s === 'fatt' ? t('I coefficienti n! crescono più di ogni potenza: la serie converge solo in z = 0. È una serie asintotica, non convergente.', 'The coefficients n! outgrow every power: the series converges only at z = 0. It is an asymptotic, not a convergent, series.') : st.s === 'espo' ? t('Raggio infinito: eᶻ è intera, e le somme parziali seguono la funzione su intervalli sempre più grandi al crescere di N.', 'Infinite radius: eᶻ is entire, and the partial sums follow the function on ever larger intervals as N grows.') : t('Il raggio è la distanza dall’origine della singolarità più vicina (in rosso). Sul bordo |z| = R la convergenza va studiata punto per punto: Σzⁿ/n diverge in z = 1 ma converge in z = −1.', 'The radius is the distance from the origin to the nearest singularity (red). On the boundary |z| = R convergence must be checked point by point: Σzⁿ/n diverges at z = 1 but converges at z = −1.')) + '<br>' +
        t('Dentro il disco |z| < R la serie converge assolutamente, fuori i termini non vanno a 0 e diverge.', 'Inside the disc |z| < R the series converges absolutely, outside the terms do not go to 0 and it diverges.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('smatserie', {
    titolo: ['♾️ Successioni e serie', '♾️ Sequences and series'],
    sotto: ['Il limite di una successione con ε e N, le serie numeriche con i criteri di convergenza e le stime dell’errore, il teorema di riordino di Riemann, le serie di potenze con il disco di convergenza nel piano complesso.', 'The limit of a sequence with ε and N, numerical series with convergence tests and error estimates, Riemann’s rearrangement theorem, power series with the disc of convergence in the complex plane.'],
    schede: [
      { nome: ['📏 Limite ε–N', '📏 ε–N limit'], costruisci: schedaSucc },
      { nome: ['➕ Serie e criteri', '➕ Series and tests'], costruisci: schedaCriteri },
      { nome: ['🔀 Riordino di Riemann', '🔀 Riemann rearrangement'], costruisci: schedaRiordino },
      { nome: ['🎯 Serie di potenze', '🎯 Power series'], costruisci: schedaPotenze }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
