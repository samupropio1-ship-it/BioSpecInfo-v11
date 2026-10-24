/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-inferenza.js — 📊 la logica dell'inferenza statistica
   BioSpecInfo · © Samuele Pio Provenzano

   La statistica del laboratorio (bsi-mat-statistica.js) applica i test ai
   dati; qui si guarda DENTRO i test, simulando molte volte lo stesso
   esperimento da una popolazione nota:

   · INTERVALLI DI CONFIDENZA: 100 campioni dalla stessa popolazione, 100
     intervalli; quelli che mancano la vera media sono rossi. La copertura
     a lungo andare torna al livello nominale (con la t di Student) o no
     (con z e la s del campione, l'errore classico con n piccolo). I
     quantili della t si calcolano invertendo la sua funzione di
     ripartizione, scritta con la beta incompleta;
   · TEST DI IPOTESI: le distribuzioni della statistica sotto H₀ e H₁, la
     regione di rifiuto α, l'errore β e la potenza 1 − β al variare
     dell'effetto e di n; i valori p simulati, uniformi sotto H₀;
   · REGRESSIONE: punti trascinabili, la retta dei minimi quadrati, r, R²,
     i residui e la banda di confidenza; il quartetto di Anscombe (1973):
     quattro insiemi con le stesse statistiche e forme diversissime;
   · BOOTSTRAP: ricampionare il campione stesso per stimare la variabilità
     di media e mediana, e confrontare l'intervallo percentile con la t.
   I numeri casuali vengono da mulberry32 con seme: le simulazioni si
   ripetono identiche.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function c4(v) { return isFinite(v) ? String(+v.toPrecision(4)) : '—'; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* una gaussiana con Box-Muller (1 − u evita log 0) */
  function gauss(rnd) { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ── la normale: erfc con la serie (x < 3) e la frazione continua (x ≥ 3) */
  function erfc(x) {
    if (x < 0) return 2 - erfc(-x);
    if (x < 3) {
      /* erf x = 2/√π e^(−x²) Σ 2ⁿ x^(2n+1) / (1·3·…·(2n+1)): termini tutti positivi, niente cancellazioni */
      var term = x, s = x, n = 0;
      while (term > 1e-17 * s) { n++; term *= 2 * x * x / (2 * n + 1); s += term; }
      return 1 - 2 / Math.sqrt(Math.PI) * Math.exp(-x * x) * s;
    }
    /* erfc x = e^(−x²)/√π · 1/(x + (1/2)/(x + 1/(x + (3/2)/(x + …)))) valutata all'indietro */
    var f = x; for (var k = 80; k >= 1; k--) f = x + (k / 2) / f;
    return Math.exp(-x * x) / (Math.sqrt(Math.PI) * f);
  }
  function Phi(z) { return 0.5 * erfc(-z / Math.SQRT2); }
  /* quantile: l'approssimazione razionale di Acklam e due passi di Halley sulla Φ esatta */
  function PhiInv(p) {
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    var a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239],
      b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1],
      c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
      d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416], x, q, r;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    for (var i = 0; i < 2; i++) { var e = Phi(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2); x = x - u / (1 + x * u / 2); }
    return x;
  }

  /* ── la t di Student: ln Γ (Lanczos, g = 7), la beta incompleta regolarizzata (frazione continua di Lentz) */
  var LZ = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lnGamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
    x -= 1; var s = LZ[0], tt = x + 7.5;
    for (var i = 1; i < 9; i++) s += LZ[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(tt) - tt + Math.log(s);
  }
  function fcBeta(a, b, x) {
    var PIC = 1e-300, c = 1, d = 1 - (a + b) * x / (a + 1); if (Math.abs(d) < PIC) d = PIC; d = 1 / d; var h = d;
    for (var m = 1; m <= 400; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((a - 1 + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < PIC) d = PIC; c = 1 + aa / c; if (Math.abs(c) < PIC) c = PIC; d = 1 / d; h *= d * c;
      aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + 1 + m2));
      d = 1 + aa * d; if (Math.abs(d) < PIC) d = PIC; c = 1 + aa / c; if (Math.abs(c) < PIC) c = PIC; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break;
    }
    return h;
  }
  function betaInc(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var lb = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? lb * fcBeta(a, b, x) / a : 1 - lb * fcBeta(b, a, 1 - x) / b;
  }
  /* F_t(x; ν) = 1 − ½ I_{ν/(ν+x²)}(ν/2, ½) per x ≥ 0 */
  function tCDF(x, nu) { var p = 0.5 * betaInc(nu / (nu + x * x), nu / 2, 0.5); return x >= 0 ? 1 - p : p; }
  /* il quantile: si allarga la forchetta finché contiene p, poi bisezione (100 passi: precisione di macchina) */
  function tInv(p, nu) {
    if (p === 0.5) return 0;
    var lo = -1, hi = 1;
    while (tCDF(hi, nu) < p) { lo = hi; hi *= 2; if (hi > 1e8) break; }
    while (tCDF(lo, nu) > p) { hi = lo; lo *= 2; if (lo < -1e8) break; }
    for (var i = 0; i < 100; i++) { var m = (lo + hi) / 2; if (tCDF(m, nu) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  /* ── descrittiva ── */
  function media(v) { var s = 0; for (var i = 0; i < v.length; i++) s += v[i]; return s / v.length; }
  function devst(v) { var m = media(v), s = 0; for (var i = 0; i < v.length; i++) s += (v[i] - m) * (v[i] - m); return Math.sqrt(s / (v.length - 1)); }
  function mediana(v) { var w = v.slice().sort(function (a, b) { return a - b; }), n = w.length; return n % 2 ? w[(n - 1) / 2] : (w[n / 2 - 1] + w[n / 2]) / 2; }
  /* quantile empirico con interpolazione lineare (tipo 7 di Hyndman-Fan, quello di R) su un vettore ORDINATO */
  function quantile(ord, p) { var h = (ord.length - 1) * p, i = Math.floor(h); return i + 1 < ord.length ? ord[i] + (h - i) * (ord[i + 1] - ord[i]) : ord[i]; }

  /* ═══ 1. intervalli di confidenza ═══
     tipo: 'z' (σ nota, quantile z), 't' (s del campione, quantile t), 'zs' (s del campione con il quantile z: sbagliato con n piccolo) */
  function campione(rnd, mu, sigma, n) { var v = []; for (var i = 0; i < n; i++) v.push(mu + sigma * gauss(rnd)); return v; }
  function quantileIC(n, livello, tipo) { var a = 1 - (1 - livello) / 2; return tipo === 't' ? tInv(a, n - 1) : PhiInv(a); }
  /* q si può passare già calcolato: con migliaia di intervalli uguali non si inverte la t ogni volta */
  function intervallo(v, livello, tipo, sigma, qFisso) {
    var n = v.length, m = media(v), s = devst(v);
    var q = qFisso != null ? qFisso : quantileIC(n, livello, tipo), sc = tipo === 'z' ? sigma : s, h = q * sc / Math.sqrt(n);
    return { media: m, s: s, q: q, lo: m - h, hi: m + h, semi: h };
  }
  function copertura(mu, sigma, n, livello, tipo, reps, seme) {
    var rnd = mulberry32(seme || 1), dentro = 0, q = quantileIC(n, livello, tipo);
    for (var k = 0; k < reps; k++) { var I = intervallo(campione(rnd, mu, sigma, n), livello, tipo, sigma, q); if (I.lo <= mu && mu <= I.hi) dentro++; }
    return dentro / reps;
  }

  /* ═══ 2. test di ipotesi sulla media, σ = 1 nota, effetto d = (μ₁ − μ₀)/σ ═══ */
  function potenza(d, n, alfa, code) {
    var dn = d * Math.sqrt(n);
    if (code === 1) return 1 - Phi(PhiInv(1 - alfa) - dn);
    var z = PhiInv(1 - alfa / 2);
    return Phi(dn - z) + Phi(-dn - z);
  }
  /* simula reps esperimenti: n misure da N(d, 1), z = x̄ √n, il valore p (bilaterale o unilaterale) */
  function esperimento(rnd, d, n, code) {
    var s = 0; for (var i = 0; i < n; i++) s += d + gauss(rnd);
    var z = s / n * Math.sqrt(n); return code === 1 ? 1 - Phi(z) : 2 * (1 - Phi(Math.abs(z)));
  }
  function simulaP(d, n, reps, code, seme) {
    var rnd = mulberry32(seme || 1), out = new Float64Array(reps);
    for (var k = 0; k < reps; k++) out[k] = esperimento(rnd, d, n, code);
    return out;
  }
  /* statistica di Kolmogorov-Smirnov contro l'uniforme su [0, 1] */
  function ksUniforme(p) {
    var w = Array.prototype.slice.call(p).sort(function (a, b) { return a - b; }), n = w.length, D = 0;
    for (var i = 0; i < n; i++) D = Math.max(D, (i + 1) / n - w[i], w[i] - i / n);
    return D;
  }

  /* ═══ 3. regressione lineare ═══ */
  function regressione(xs, ys, livello) {
    var n = xs.length, mx = media(xs), my = media(ys), sxx = 0, syy = 0, sxy = 0, i;
    for (i = 0; i < n; i++) { sxx += (xs[i] - mx) * (xs[i] - mx); syy += (ys[i] - my) * (ys[i] - my); sxy += (xs[i] - mx) * (ys[i] - my); }
    var b = sxy / sxx, a = my - b * mx, res = [], sse = 0;
    for (i = 0; i < n; i++) { var e = ys[i] - (a + b * xs[i]); res.push(e); sse += e * e; }
    var s = n > 2 ? Math.sqrt(sse / (n - 2)) : NaN, tq = n > 2 ? tInv(1 - (1 - (livello || 0.95)) / 2, n - 2) : NaN;
    return {
      n: n, mx: mx, my: my, sxx: sxx, syy: syy, sxy: sxy, b: b, a: a, r: sxy / Math.sqrt(sxx * syy), R2: 1 - sse / syy,
      varx: sxx / (n - 1), vary: syy / (n - 1), residui: res, s: s, tq: tq,
      /* semiampiezza della banda di confidenza della RETTA (della media di y) in x0 */
      banda: function (x0) { return tq * s * Math.sqrt(1 / n + (x0 - mx) * (x0 - mx) / sxx); }
    };
  }
  /* Anscombe F. J. (1973) Graphs in statistical analysis, Am. Stat. 27, 17–21 */
  var ANSCOMBE = {
    x123: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
    y1: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68],
    y2: [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74],
    y3: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73],
    x4: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8],
    y4: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.50, 5.56, 7.91, 6.89]
  };
  function anscombe(k) { var A = ANSCOMBE; return k === 4 ? { x: A.x4.slice(), y: A.y4.slice() } : { x: A.x123.slice(), y: A['y' + k].slice() }; }

  /* ═══ 4. bootstrap ═══ */
  function bootstrap(dati, stat, B, seme, livello) {
    var rnd = mulberry32(seme || 1), n = dati.length, f = stat === 'mediana' ? mediana : media, val = new Float64Array(B), w = new Array(n);
    for (var k = 0; k < B; k++) { for (var i = 0; i < n; i++) w[i] = dati[(rnd() * n) | 0]; val[k] = f(w); }
    var ord = Array.prototype.slice.call(val).sort(function (a, b) { return a - b; }), mb = media(ord), a = (1 - (livello || 0.95)) / 2;
    return { valori: ord, media: mb, se: devst(ord), lo: quantile(ord, a), hi: quantile(ord, 1 - a), stima: f(dati) };
  }
  /* distribuzione ESATTA della mediana bootstrap per n dispari: P(med* ≤ x₍ₖ₎) = P(Bin(n, k/n) ≥ (n+1)/2) */
  function medianaBootEsatta(n, k) {
    var p = k / n, m = (n + 1) / 2, s = 0, lc = lnGamma(n + 1);
    for (var j = m; j <= n; j++) s += Math.exp(lc - lnGamma(j + 1) - lnGamma(n - j + 1) + (p > 0 ? j * Math.log(p) : (j ? -Infinity : 0)) + (p < 1 ? (n - j) * Math.log(1 - p) : (n - j ? -Infinity : 0)));
    return s;
  }
  var DATI = {
    asimm: [['tempi di attesa (min), asimmetrici', 'waiting times (min), skewed'], [1.2, 1.5, 1.7, 2.0, 2.1, 2.4, 2.9, 3.3, 4.1, 5.6, 7.8, 12.5]],
    simm: [['titolazioni ripetute (mL), simmetriche', 'repeated titrations (mL), symmetric'], [9.8, 10.1, 10.3, 9.6, 10.0, 10.4, 9.9, 10.2, 9.7, 10.1]],
    anomalo: [['con un valore anomalo', 'with an outlier'], [5.1, 4.9, 5.3, 5.0, 5.2, 4.8, 5.1, 9.7, 5.0]]
  };

  F.calcolo.inferenza = {
    mulberry32: mulberry32, gauss: gauss, erfc: erfc, Phi: Phi, PhiInv: PhiInv, lnGamma: lnGamma, betaInc: betaInc, tCDF: tCDF, tInv: tInv,
    media: media, devst: devst, mediana: mediana, quantile: quantile, campione: campione, quantileIC: quantileIC, intervallo: intervallo, copertura: copertura,
    potenza: potenza, simulaP: simulaP, ksUniforme: ksUniforme, regressione: regressione, ANSCOMBE: ANSCOMBE, anscombe: anscombe,
    bootstrap: bootstrap, medianaBootEsatta: medianaBootEsatta, DATI: DATI
  };

  /* istogramma: conteggi in nb classi fra a e b, normalizzati a densità */
  function istogramma(v, a, b, nb) {
    var h = new Array(nb).fill(0), w = (b - a) / nb;
    for (var i = 0; i < v.length; i++) { var k = Math.floor((v[i] - a) / w); if (k === nb && v[i] === b) k = nb - 1; if (k >= 0 && k < nb) h[k]++; }
    return h.map(function (c) { return c / (v.length * w); });
  }
  /* disegna le colonne dell'istogramma sul contesto restituito da F.grafico */
  function colonne(o, h, a, b, col) {
    var w = (b - a) / h.length, q = o.q; q.fillStyle = col;
    h.forEach(function (y, k) { var x0 = o.X(a + k * w), x1 = o.X(a + (k + 1) * w), y0 = o.Y(0), y1 = o.Y(y); q.fillRect(x0 + 0.5, y1, Math.max(0.5, x1 - x0 - 1), y0 - y1); });
  }

  /* ═══ 1. intervalli di confidenza ═══════════════════════════════════════ */
  function schedaIntervalli(div) {
    var G = griglia(div), MU = 50, SIG = 10, st = { n: 5, liv: 0.95, tipo: 't', seme: 1 }, info = nota(G.pan), lotto = [], storia = [], dentro = 0, totale = 0;
    F.cursore(G.pan, ['dimensione del campione n', 'sample size n'], 2, 50, 1, st.n, function (v) { st.n = v; azzera(); }, function (v) { return String(v); });
    F.cursore(G.pan, ['livello di confidenza', 'confidence level'], 0.5, 0.99, 0.01, st.liv, function (v) { st.liv = v; azzera(); }, function (v) { return Math.round(v * 100) + ' %'; });
    F.scelta(G.pan, ['Intervallo', 'Interval'], [['t', ['t di Student con s', 'Student t with s']], ['z', ['z con σ nota', 'z with known σ']], ['zs', ['z con s (sbagliato con n piccolo)', 'z with s (wrong for small n)']]], st.tipo, function (v) { st.tipo = v; azzera(); });
    F.bottone(G.pan, ['Altri 100 campioni', '100 more samples'], function () { nuovo(1); });
    F.bottone(G.pan, ['Ripeti 100 × 100', 'Repeat 100 × 100'], function () { nuovo(100); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.8), cc = F.tela(G.dx, 0.42);
    function azzera() { storia = []; dentro = 0; totale = 0; st.seme = 1; nuovo(1); }
    /* ogni lotto ha il suo seme: si ripete identico */
    /* a lotti di 10 × 100 intervalli per volta con setTimeout, ridisegnando: la copertura si vede crescere */
    var giro = 0;
    function nuovo(volte) {
      var qq = quantileIC(st.n, st.liv, st.tipo), mio = ++giro, fatti = 0;
      (function lotti() {
        if (mio !== giro) return;
        for (var r = 0; r < 10 && fatti < volte; r++, fatti++) {
          var rnd = mulberry32(1000 * st.seme + 7); st.seme++; lotto = [];
          for (var k = 0; k < 100; k++) { var I = intervallo(campione(rnd, MU, SIG, st.n), st.liv, st.tipo, SIG, qq); I.ok = I.lo <= MU && MU <= I.hi; lotto.push(I); dentro += I.ok ? 1 : 0; totale++; if (totale % 20 === 0) storia.push([totale, dentro / totale]); }
        }
        disegna();
        if (fatti < volte) setTimeout(lotti, 0);
      })();
    }
    function disegna() {
      var L = SIG * (st.tipo === 't' && st.n < 4 ? 5 : 2.4), o = F.grafico(cv, { serie: [], xmin: MU - L, xmax: MU + L, ymin: 0, ymax: 101, xl: ['valore della media', 'value of the mean'], yl: ['campione n.', 'sample no.'], descr: ['100 intervalli di confidenza: rossi quelli che mancano la vera media', '100 confidence intervals: red the ones missing the true mean'] }), q = o.q, mancati = 0;
      lotto.forEach(function (I, k) {
        var y = o.Y(k + 1), x0 = o.X(Math.max(MU - L, I.lo)), x1 = o.X(Math.min(MU + L, I.hi));
        q.strokeStyle = I.ok ? 'rgba(94,234,212,.75)' : '#ff8a80'; q.lineWidth = I.ok ? 1.4 : 2.2; q.beginPath(); q.moveTo(x0, y); q.lineTo(x1, y); q.stroke();
        q.fillStyle = I.ok ? '#c9d3df' : '#ff8a80'; q.fillRect(o.X(I.media) - 1, y - 1, 2, 2); if (!I.ok) mancati++;
      });
      q.lineWidth = 1.5; q.strokeStyle = '#ffd24a'; q.beginPath(); q.moveTo(o.X(MU), o.Y(0)); q.lineTo(o.X(MU), o.Y(101)); q.stroke(); q.lineWidth = 1;
      var xs = storia.map(function (p) { return p[0]; }), ys = storia.map(function (p) { return p[1]; });
      F.grafico(cc, { serie: xs.length > 1 ? [{ x: xs, y: ys, col: '#6bcfff', larg: 2, etich: [t('copertura', 'coverage'), 'coverage'] }] : [], linee: [{ y: st.liv, col: '#ffd24a', etich: t('nominale ', 'nominal ') + Math.round(st.liv * 100) + ' %' }], xmin: 0, xmax: Math.max(200, totale), ymin: Math.max(0, st.liv - 0.25), ymax: 1, xl: ['intervalli costruiti', 'intervals built'], yl: ['copertura', 'coverage'], descr: ['copertura cumulativa contro il livello nominale', 'running coverage against the nominal level'] });
      var q4 = tInv(0.975, 4), q9 = tInv(0.975, 9), q29 = tInv(0.975, 29), atteso = st.tipo === 'zs' ? 2 * tCDF(PhiInv(1 - (1 - st.liv) / 2), st.n - 1) - 1 : st.liv;
      info.innerHTML = t('Popolazione N(μ = 50, σ = 10). In questo lotto ', 'Population N(μ = 50, σ = 10). In this batch ') + '<b class="bsiFX-num">' + mancati + '</b>' + t(' intervalli su 100 mancano μ; in tutto ', ' intervals out of 100 miss μ; overall ') + '<b class="bsiFX-num">' + totale + '</b>' + t(' intervalli, copertura ', ' intervals, coverage ') + '<b class="bsiFX-num">' + (totale ? (100 * dentro / totale).toFixed(1) : '—') + ' %</b> (' + t('attesa ', 'expected ') + (100 * atteso).toFixed(1) + ' %).<br>' +
        'x̄ ± q · s/√n · q = ' + c4(lotto.length ? lotto[0].q : NaN) + '<br>' +
        t('Il livello di confidenza è una proprietà del METODO, non del singolo intervallo: dopo averlo calcolato μ è dentro o fuori, non «al 95 %». Con s al posto di σ la quantità (x̄ − μ)/(s/√n) segue la t di Student con n − 1 gradi di libertà, con code più pesanti della normale: usare z con n = 5 dà una copertura vera di P(|T₄| < 1,96) ≈ 87,8 % invece del 95 %. ', 'The confidence level is a property of the METHOD, not of the single interval: once computed μ is either inside or out, not «95 % inside». With s instead of σ the quantity (x̄ − μ)/(s/√n) follows Student’s t with n − 1 degrees of freedom, with heavier tails than the normal: using z with n = 5 gives a true coverage of P(|T₄| < 1.96) ≈ 87.8 % instead of 95 %. ') +
        t('Quantili t₀,₉₇₅ calcolati invertendo F_t(x) = 1 − ½ I_{ν/(ν+x²)}(ν/2, ½): ', 'Quantiles t₀.₉₇₅ obtained by inverting F_t(x) = 1 − ½ I_{ν/(ν+x²)}(ν/2, ½): ') + 'ν = 4 → ' + q4.toFixed(3) + ', ν = 9 → ' + q9.toFixed(3) + ', ν = 29 → ' + q29.toFixed(3) + ', ν → ∞ → ' + PhiInv(0.975).toFixed(3) + '.';
    }
    nuovo(1); F.alRidimensiona(disegna);
  }

  /* ═══ 2. test di ipotesi ════════════════════════════════════════════════ */
  function schedaTest(div) {
    var G = griglia(div), st = { d: 0.5, n: 20, alfa: 0.05, code: 2 }, info = nota(G.pan), P0 = null, P1 = null, timer = null;
    F.cursore(G.pan, ['effetto d = (μ₁ − μ₀)/σ', 'effect size d = (μ₁ − μ₀)/σ'], 0, 1.5, 0.01, st.d, function (v) { st.d = v; aggiorna(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['numero di misure n', 'number of measurements n'], 2, 100, 1, st.n, function (v) { st.n = v; aggiorna(); }, function (v) { return String(v); });
    F.cursore(G.pan, ['livello di significatività α', 'significance level α'], 0.005, 0.2, 0.005, st.alfa, function (v) { st.alfa = v; aggiorna(); }, function (v) { return v.toFixed(3); });
    F.scelta(G.pan, ['Ipotesi alternativa', 'Alternative hypothesis'], [['2', ['bilaterale μ ≠ μ₀', 'two-sided μ ≠ μ₀']], ['1', ['unilaterale μ > μ₀', 'one-sided μ > μ₀']]], '2', function (v) { st.code = +v; aggiorna(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.5), ch = F.tela(G.dx, 0.42);
    function aggiorna() { disegnaDistr(); clearTimeout(timer); timer = setTimeout(simula, 60); }
    /* 2000 esperimenti per ipotesi, ogni volta n misure gaussiane vere */
    /* a lotti di 250 esperimenti con setTimeout: con n = 100 sono 400 000 estrazioni, non devono bloccare la pagina */
    var giro = 0;
    function simula() {
      var mio = ++giro, r0 = mulberry32(11), r1 = mulberry32(12), N = 2000, k = 0, A = new Float64Array(N), B = new Float64Array(N), d = st.d, n = st.n, code = st.code;
      (function lotto() {
        if (mio !== giro) return;
        for (var j = 0; j < 250 && k < N; j++, k++) { A[k] = esperimento(r0, 0, n, code); B[k] = esperimento(r1, d, n, code); }
        if (k < N) { setTimeout(lotto, 0); return; }
        P0 = A; P1 = B; disegnaP(); testo();
      })();
    }
    function disegnaDistr() {
      var dn = st.d * Math.sqrt(st.n), zc = st.code === 1 ? PhiInv(1 - st.alfa) : PhiInv(1 - st.alfa / 2), a = -4, b = Math.max(4, dn + 4), xs = [], y0 = [], y1 = [];
      for (var i = 0; i <= 300; i++) { var x = a + (b - a) * i / 300; xs.push(x); y0.push(Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)); y1.push(Math.exp(-(x - dn) * (x - dn) / 2) / Math.sqrt(2 * Math.PI)); }
      var o = F.grafico(cv, { serie: [{ x: xs, y: y0, col: '#6bcfff', larg: 2, etich: 'H₀' }, { x: xs, y: y1, col: '#ffc45a', larg: 2, etich: 'H₁' }], xmin: a, xmax: b, ymin: 0, ymax: 0.45, xl: ['statistica z = (x̄ − μ₀)√n/σ', 'statistic z = (x̄ − μ₀)√n/σ'], yl: ['densità', 'density'], descr: ['distribuzioni di z sotto H₀ e H₁ con le regioni α e β', 'distributions of z under H₀ and H₁ with the α and β regions'], legenda: [{ col: '#6bcfff', etich: ['sotto H₀', 'under H₀'] }, { col: '#ffc45a', etich: ['sotto H₁', 'under H₁'] }] }), q = o.q;
      /* α: la coda (o le code) di H₀ oltre il valore critico; β: la parte di H₁ dentro la regione di accettazione */
      function area(f, x0, x1, col) { if (x1 <= x0) return; q.fillStyle = col; q.beginPath(); q.moveTo(o.X(x0), o.Y(0)); for (var k = 0; k <= 80; k++) { var x = x0 + (x1 - x0) * k / 80; q.lineTo(o.X(x), o.Y(f(x))); } q.lineTo(o.X(x1), o.Y(0)); q.closePath(); q.fill(); }
      var f0 = function (x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }, f1 = function (x) { return f0(x - dn); };
      area(f1, st.code === 1 ? a : Math.max(a, -zc), Math.min(b, zc), 'rgba(255,196,90,.25)');
      area(f0, zc, b, 'rgba(255,138,128,.55)'); if (st.code === 2) area(f0, a, -zc, 'rgba(255,138,128,.55)');
      q.strokeStyle = '#ff8a80'; q.setLineDash([4, 3]); [zc].concat(st.code === 2 ? [-zc] : []).forEach(function (z) { q.beginPath(); q.moveTo(o.X(z), o.Y(0)); q.lineTo(o.X(z), o.Y(0.45)); q.stroke(); }); q.setLineDash([]);
      q.fillStyle = '#ff8a80'; q.font = '11px system-ui'; q.textAlign = 'left'; q.fillText('α', o.X(zc) + 4, o.Y(0.03)); q.fillStyle = '#ffc45a'; q.fillText('β', o.X(Math.min(zc, dn) - 0.6), o.Y(0.05));
      testo();
    }
    function disegnaP() {
      if (!P0) return;
      var nb = 20, h0 = istogramma(P0, 0, 1, nb), h1 = istogramma(P1, 0, 1, nb), mx = Math.min(20, Math.max(2, Math.max.apply(null, h1) * 1.05));
      var o = F.grafico(ch, { serie: [], linee: [{ y: 1, col: '#6bcfff', etich: t('uniforme', 'uniform') }], xmin: 0, xmax: 1, ymin: 0, ymax: mx, xl: ['valore p', 'p-value'], yl: ['densità', 'density'], descr: ['istogrammi dei valori p simulati sotto H₀ e sotto H₁', 'histograms of simulated p-values under H₀ and under H₁'], legenda: [{ col: '#6bcfff', etich: ['sotto H₀', 'under H₀'] }, { col: '#ffc45a', etich: ['sotto H₁', 'under H₁'] }] });
      colonne(o, h0, 0, 1, 'rgba(107,207,255,.55)'); colonne(o, h1.map(function (v) { return Math.min(v, mx); }), 0, 1, 'rgba(255,196,90,.45)');
      o.q.strokeStyle = '#ff8a80'; o.q.beginPath(); o.q.moveTo(o.X(st.alfa), o.Y(0)); o.q.lineTo(o.X(st.alfa), o.Y(mx)); o.q.stroke();
    }
    function testo() {
      var pw = potenza(st.d, st.n, st.alfa, st.code), rif0 = 0, rif1 = 0, i;
      if (P0) { for (i = 0; i < P0.length; i++) { if (P0[i] < st.alfa) rif0++; if (P1[i] < st.alfa) rif1++; } }
      var zb = PhiInv(1 - (st.code === 1 ? st.alfa : st.alfa / 2)), n80 = st.d > 0 ? Math.ceil(Math.pow((zb + PhiInv(0.8)) / st.d, 2)) : Infinity;
      info.innerHTML = t('Potenza 1 − β (formula): ', 'Power 1 − β (formula): ') + '<b class="bsiFX-num">' + (100 * pw).toFixed(1) + ' %</b> · β = ' + (100 * (1 - pw)).toFixed(1) + ' %<br>' +
        (P0 ? t('Simulazione (2000 esperimenti): rifiuti sotto H₀ ', 'Simulation (2000 experiments): rejections under H₀ ') + '<b class="bsiFX-num">' + (100 * rif0 / P0.length).toFixed(1) + ' %</b> (α = ' + (100 * st.alfa).toFixed(1) + ' %), ' + t('sotto H₁ ', 'under H₁ ') + '<b class="bsiFX-num">' + (100 * rif1 / P1.length).toFixed(1) + ' %</b><br>' : '') +
        t('Per una potenza dell’80 % con questo d servono n ≈ ', 'For 80 % power with this d you need n ≈ ') + (isFinite(n80) ? n80 : '∞') + ' ((z₁₋α' + (st.code === 2 ? '/₂' : '') + ' + z₀,₈)²/d²).<br>' +
        t('Bilaterale: 1 − β = Φ(d√n − z₁₋α/₂) + Φ(−d√n − z₁₋α/₂). α è la probabilità di rifiutare H₀ quando è vera e la sceglie chi fa il test; β quella di non rifiutarla quando è falsa e dipende da d e n. Sotto H₀ il valore p è uniforme su [0, 1] (P(p < α) = α esattamente): un p piccolo non è la probabilità che H₀ sia vera. Sotto H₁ i p si ammucchiano vicino a 0, tanto più quanto più grande è d√n.', 'Two-sided: 1 − β = Φ(d√n − z₁₋α/₂) + Φ(−d√n − z₁₋α/₂). α is the probability of rejecting H₀ when true and is chosen by the tester; β that of not rejecting it when false and depends on d and n. Under H₀ the p-value is uniform on [0, 1] (P(p < α) = α exactly): a small p is not the probability that H₀ is true. Under H₁ the p-values pile up near 0, the more so the larger d√n.');
    }
    disegnaDistr(); simula(); F.alRidimensiona(function () { disegnaDistr(); disegnaP(); });
  }

  /* ═══ 3. regressione e correlazione ═════════════════════════════════════ */
  function schedaRegressione(div) {
    var G = griglia(div), st = { set: 'a1' }, info = nota(G.pan), pts = [], preso = -1, B = [0, 20, 0, 14];
    function carica(k) { if (k.charAt(0) === 'a') { var A = anscombe(+k.charAt(1)); pts = A.x.map(function (x, i) { return [x, A.y[i]]; }); } else { var rnd = mulberry32(5); pts = []; for (var i = 0; i < 12; i++) { var x = 2 + 16 * rnd(); pts.push([x, 2 + 0.45 * x + 1.4 * gauss(rnd)]); } } }
    F.scelta(G.pan, ['Dati', 'Data'], [['a1', ['Anscombe I', 'Anscombe I']], ['a2', ['Anscombe II (curva)', 'Anscombe II (curve)']], ['a3', ['Anscombe III (un anomalo)', 'Anscombe III (one outlier)']], ['a4', ['Anscombe IV (un punto di leva)', 'Anscombe IV (one leverage point)']], ['cas', ['nuvola casuale', 'random cloud']]], st.set, function (v) { st.set = v; carica(v); disegna(); });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Trascina i punti; tocca un punto vuoto per aggiungerne uno (al massimo 40).', 'Drag the points; tap an empty spot to add one (at most 40).') }));
    F.bottone(G.pan, ['Togli l’ultimo punto', 'Remove last point'], function () { if (pts.length > 3) { pts.pop(); disegna(); } });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.7), cr = F.tela(G.dx, 0.35), o = null;
    cv.style.touchAction = 'none'; cv.style.cursor = 'crosshair';
    function dati(ev) { var r = cv.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top, x0 = o.X(0), x1 = o.X(1), y0 = o.Y(0), y1 = o.Y(1); return [(px - x0) / (x1 - x0), (py - y0) / (y1 - y0), px, py]; }
    cv.addEventListener('pointerdown', function (ev) {
      if (!o) return; var d = dati(ev), mi = -1, md = 18;
      pts.forEach(function (p, i) { var dd = Math.hypot(o.X(p[0]) - d[2], o.Y(p[1]) - d[3]); if (dd < md) { md = dd; mi = i; } });
      if (mi < 0 && pts.length < 40) { pts.push([Math.max(B[0], Math.min(B[1], d[0])), Math.max(B[2], Math.min(B[3], d[1]))]); mi = pts.length - 1; disegna(); }
      preso = mi; try { cv.setPointerCapture(ev.pointerId); } catch (er) { }
    });
    cv.addEventListener('pointermove', function (ev) { if (preso < 0 || !o) return; var d = dati(ev); pts[preso] = [Math.max(B[0], Math.min(B[1], d[0])), Math.max(B[2], Math.min(B[3], d[1]))]; disegna(); });
    ['pointerup', 'pointercancel'].forEach(function (n) { cv.addEventListener(n, function () { preso = -1; }); });
    function disegna() {
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }), R = regressione(xs, ys, 0.95), ok = R.sxx > 1e-12 && R.syy > 1e-12, lx = [], ly = [], su = [], giu = [];
      if (ok) for (var i = 0; i <= 100; i++) { var x = B[0] + (B[1] - B[0]) * i / 100, y = R.a + R.b * x, h = R.banda(x); lx.push(x); ly.push(y); su.push(isFinite(h) ? y + h : y); giu.push(isFinite(h) ? y - h : y); }
      o = F.grafico(cv, { serie: ok ? [{ x: lx, y: su, col: 'rgba(201,185,255,.8)', larg: 1, tratt: true, nascondiMirino: true }, { x: lx, y: giu, col: 'rgba(201,185,255,.8)', larg: 1, tratt: true, nascondiMirino: true }, { x: lx, y: ly, col: '#5eead4', larg: 2.2, nascondiMirino: true }] : [], punti: pts.map(function (p, k) { return { x: p[0], y: p[1], col: k === preso ? '#ff8a80' : '#ffd24a', r: 5 }; }), xmin: B[0], xmax: B[1], ymin: B[2], ymax: B[3], xl: ['x', 'x'], yl: ['y', 'y'], descr: ['punti trascinabili, retta dei minimi quadrati e banda di confidenza al 95 %', 'draggable points, least-squares line and 95 % confidence band'] });
      F.grafico(cr, { serie: [], punti: ok ? xs.map(function (x, k) { return { x: x, y: R.residui[k], col: '#ff8a80', r: 3.5 }; }) : [], linee: [{ y: 0, col: '#5eead4' }], xmin: B[0], xmax: B[1], ymin: ok ? -Math.max(1, Math.max.apply(null, R.residui.map(Math.abs)) * 1.2) : -1, ymax: ok ? Math.max(1, Math.max.apply(null, R.residui.map(Math.abs)) * 1.2) : 1, xl: ['x', 'x'], yl: ['residuo', 'residual'], descr: ['grafico dei residui', 'residual plot'] });
      info.innerHTML = ok ? 'ŷ = <b class="bsiFX-num">' + R.a.toFixed(3) + ' + ' + R.b.toFixed(4) + ' x</b><br>r = <b class="bsiFX-num">' + R.r.toFixed(4) + '</b> · R² = <b class="bsiFX-num">' + R.R2.toFixed(4) + '</b> · n = ' + R.n + '<br>x̄ = ' + R.mx.toFixed(3) + ' · s²ₓ = ' + R.varx.toFixed(3) + ' · ȳ = ' + R.my.toFixed(3) + ' · s²ᵧ = ' + R.vary.toFixed(3) + ' · s_y/x = ' + c4(R.s) + '<br>' +
        t('b = Sxy/Sxx, a = ȳ − b x̄ minimizzano Σ(yᵢ − a − bxᵢ)²; r = Sxy/√(Sxx Syy) e R² = 1 − SSE/Syy = r². La banda è ŷ ± t₀,₉₇₅;ₙ₋₂ · s_y/x √(1/n + (x − x̄)²/Sxx): si allarga lontano da x̄. Anscombe (1973) costruì quattro insiemi con x̄ = 9, s²ₓ = 11, ȳ ≈ 7,50, s²ᵧ ≈ 4,12, r ≈ 0,816 e la stessa retta y ≈ 3 + 0,5x: una curva, un anomalo, un punto di leva. Le statistiche riassuntive non bastano, i dati vanno guardati (e così i residui).', 'b = Sxy/Sxx, a = ȳ − b x̄ minimise Σ(yᵢ − a − bxᵢ)²; r = Sxy/√(Sxx Syy) and R² = 1 − SSE/Syy = r². The band is ŷ ± t₀.₉₇₅;ₙ₋₂ · s_y/x √(1/n + (x − x̄)²/Sxx): it widens away from x̄. Anscombe (1973) built four sets with x̄ = 9, s²ₓ = 11, ȳ ≈ 7.50, s²ᵧ ≈ 4.12, r ≈ 0.816 and the same line y ≈ 3 + 0.5x: a curve, an outlier, a leverage point. Summary statistics are not enough: look at the data (and at the residuals).') : t('Servono almeno due valori diversi di x e di y.', 'At least two different values of x and y are needed.');
    }
    carica(st.set); disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 4. bootstrap ══════════════════════════════════════════════════════ */
  function schedaBootstrap(div) {
    var G = griglia(div), st = { dati: 'asimm', stat: 'media', B: 2000, seme: 1 }, info = nota(G.pan), timer = null;
    F.scelta(G.pan, ['Campione', 'Sample'], Object.keys(DATI).map(function (k) { return [k, DATI[k][0]]; }), st.dati, function (v) { st.dati = v; calcola(); });
    F.scelta(G.pan, ['Statistica', 'Statistic'], [['media', ['media', 'mean']], ['mediana', ['mediana', 'median']]], st.stat, function (v) { st.stat = v; calcola(); });
    F.cursore(G.pan, ['ricampionamenti B', 'resamples B'], 100, 10000, 100, st.B, function (v) { st.B = v; clearTimeout(timer); timer = setTimeout(calcola, 80); }, function (v) { return String(v); });
    F.bottone(G.pan, ['Nuovo seme', 'New seed'], function () { st.seme = 1 + ((Math.random() * 1e6) | 0); calcola(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.55), cd = F.tela(G.dx, 0.25), R = null;
    function calcola() { R = bootstrap(DATI[st.dati][1], st.stat, st.B, st.seme, 0.95); disegna(); }
    function disegna() {
      var x = DATI[st.dati][1], n = x.length, m = media(x), s = devst(x), tq = tInv(0.975, n - 1), tl = m - tq * s / Math.sqrt(n), th = m + tq * s / Math.sqrt(n);
      var a = Math.min(R.valori[0], tl), b = Math.max(R.valori[R.valori.length - 1], th); if (!(b > a)) b = a + 1;
      var pad = (b - a) * 0.05, h = istogramma(R.valori, a - pad, b + pad, 40), mx = Math.max.apply(null, h) * 1.15;
      var o = F.grafico(cv, { serie: [], xmin: a - pad, xmax: b + pad, ymin: 0, ymax: mx, xl: [st.stat === 'media' ? 'media bootstrap x̄*' : 'mediana bootstrap', st.stat === 'media' ? 'bootstrap mean x̄*' : 'bootstrap median'], yl: ['densità', 'density'], descr: ['distribuzione bootstrap con intervallo percentile e intervallo t', 'bootstrap distribution with percentile interval and t interval'], legenda: [{ col: '#ffd24a', etich: ['percentile 95 %', 'percentile 95 %'] }, { col: '#c9b9ff', etich: ['t 95 % (media)', 't 95 % (mean)'] }] }), q = o.q;
      colonne(o, h, a - pad, b + pad, 'rgba(94,234,212,.55)');
      function vert(v, col, tr) { q.strokeStyle = col; q.lineWidth = 2; q.setLineDash(tr ? [5, 4] : []); q.beginPath(); q.moveTo(o.X(v), o.Y(0)); q.lineTo(o.X(v), o.Y(mx)); q.stroke(); q.setLineDash([]); q.lineWidth = 1; }
      vert(R.lo, '#ffd24a'); vert(R.hi, '#ffd24a'); vert(tl, '#c9b9ff', true); vert(th, '#c9b9ff', true); vert(R.stima, '#ff8a80');
      /* il campione originale come punti su una riga */
      var mn = Math.min.apply(null, x), MX = Math.max.apply(null, x), pd = (MX - mn) * 0.08 || 1;
      F.grafico(cd, { serie: [], punti: x.map(function (v, k) { return { x: v, y: 0.5 + 0.12 * ((k % 3) - 1), col: '#ffd24a', r: 4 }; }), xmin: mn - pd, xmax: MX + pd, ymin: 0, ymax: 1, xl: ['dati originali', 'original data'], yl: [' ', ' '], descr: ['il campione originale', 'the original sample'] });
      info.innerHTML = t('Stima dal campione: ', 'Sample estimate: ') + '<b class="bsiFX-num">' + c4(R.stima) + '</b> · ' + t('errore standard bootstrap ', 'bootstrap standard error ') + '<b class="bsiFX-num">' + c4(R.se) + '</b><br>' +
        t('Percentile 95 %: ', 'Percentile 95 %: ') + '<b class="bsiFX-num">[' + c4(R.lo) + ' ; ' + c4(R.hi) + ']</b><br>' + t('t 95 % per la media: ', 't 95 % for the mean: ') + '[' + c4(tl) + ' ; ' + c4(th) + '] · s/√n = ' + c4(s / Math.sqrt(n)) + '<br>' +
        t('Il bootstrap (Efron, 1979) tratta il campione come se fosse la popolazione: si estraggono B campioni di n valori CON reinserimento e si ricalcola ogni volta la statistica. La loro dispersione stima l’errore standard senza formule, anche per la mediana, che non ne ha una semplice. Per la media l’errore standard bootstrap tende a σ̂/√n con σ̂² = Σ(xᵢ − x̄)²/n. Con dati asimmetrici l’intervallo percentile è asimmetrico, mentre quello t è per costruzione simmetrico; con n piccolo il bootstrap tende a essere troppo stretto, perché il campione non contiene le code della popolazione. La mediana bootstrap assume solo valori del campione: istogramma a denti.', 'The bootstrap (Efron, 1979) treats the sample as if it were the population: B samples of n values are drawn WITH replacement and the statistic is recomputed each time. Their spread estimates the standard error without formulas, even for the median, which has no simple one. For the mean the bootstrap standard error tends to σ̂/√n with σ̂² = Σ(xᵢ − x̄)²/n. With skewed data the percentile interval is asymmetric, while the t interval is symmetric by construction; with small n the bootstrap tends to be too narrow, because the sample does not contain the population’s tails. The bootstrap median only takes sample values: a spiky histogram.');
    }
    calcola(); F.alRidimensiona(disegna);
  }

  F.sezione('smatinfer', {
    titolo: ['📊 Statistica inferenziale', '📊 Statistical inference'],
    sotto: ['La logica dell’inferenza vista con la simulazione: che cosa significa «confidenza al 95 %», gli errori α e β e la potenza di un test, la regressione con i punti da trascinare e il quartetto di Anscombe, il bootstrap.', 'The logic of inference seen through simulation: what «95 % confidence» means, α and β errors and the power of a test, regression with draggable points and Anscombe’s quartet, the bootstrap.'],
    schede: [
      { nome: ['📏 Intervalli di confidenza', '📏 Confidence intervals'], costruisci: schedaIntervalli },
      { nome: ['⚖️ Test di ipotesi', '⚖️ Hypothesis testing'], costruisci: schedaTest },
      { nome: ['📈 Regressione', '📈 Regression'], costruisci: schedaRegressione },
      { nome: ['🔁 Bootstrap', '🔁 Bootstrap'], costruisci: schedaBootstrap }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
