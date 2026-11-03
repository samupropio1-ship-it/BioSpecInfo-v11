/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-probabilita.js — 🎲 probabilita' in movimento
   BioSpecInfo · © Samuele Pio Provenzano

   · MACCHINA DI GALTON: palline che rimbalzano su n file di chiodi; il
     mucchio prende la forma della binomiale B(n, p) e, per n grande, della
     gaussiana (teorema di de Moivre-Laplace); media np, varianza np(1 − p);
   · GRANDI NUMERI E LIMITE CENTRALE: si estraggono campioni da un dado, una
     moneta, un'uniforme o un'esponenziale; la media corrente converge a μ
     (legge dei grandi numeri) e le medie di campioni di ampiezza n si
     distribuiscono come N(μ, σ²/n) anche se la distribuzione di partenza
     non e' gaussiana (teorema del limite centrale);
   · MONTE CARLO: π dalle freccette in un quadrato; l'errore scende come
     1/√N, non come 1/N;
   · BAYES: un test diagnostico con prevalenza, sensibilita' e
     specificita'; il valore predittivo positivo spiegato con mille persone
     disegnate (frequenze naturali): con una malattia rara la maggior parte
     dei positivi e' sana.
   Il generatore pseudo-casuale e' mulberry32 con seme: le prove sono
   riproducibili.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function generatore(seme) { var s = (seme || 1) >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var q = Math.imul(s ^ (s >>> 15), 1 | s); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }; }
  function lnFatt(n) { var s = 0; for (var i = 2; i <= n; i++) s += Math.log(i); return s; }
  function binomiale(n, k, p) { if (k < 0 || k > n) return 0; if (p <= 0) return k === 0 ? 1 : 0; if (p >= 1) return k === n ? 1 : 0; return Math.exp(lnFatt(n) - lnFatt(k) - lnFatt(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p)); }
  function normale(x, mu, s) { return Math.exp(-0.5 * Math.pow((x - mu) / s, 2)) / (s * Math.sqrt(2 * Math.PI)); }
  /* distribuzioni di partenza: estrazione, media, deviazione standard */
  var DISTR = {
    dado: [['dado (1–6)', 'die (1–6)'], function (r) { return 1 + Math.floor(r() * 6); }, 3.5, Math.sqrt(35 / 12)],
    moneta: [['moneta (0/1)', 'coin (0/1)'], function (r) { return r() < 0.5 ? 0 : 1; }, 0.5, 0.5],
    uniforme: [['uniforme [0, 1]', 'uniform [0, 1]'], function (r) { return r(); }, 0.5, Math.sqrt(1 / 12)],
    esponenziale: [['esponenziale (λ = 1, molto asimmetrica)', 'exponential (λ = 1, very skewed)'], function (r) { return -Math.log(1 - r()); }, 1, 1]
  };
  function bayes(prev, sens, spec) { var vp = prev * sens, fp = (1 - prev) * (1 - spec), fn = prev * (1 - sens), vn = (1 - prev) * spec; return { ppv: vp / (vp + fp), npv: vn / (vn + fn), vp: vp, fp: fp, fn: fn, vn: vn }; }
  function montecarloPi(N, r) { var dentro = 0; for (var i = 0; i < N; i++) { var x = r(), y = r(); if (x * x + y * y <= 1) dentro++; } return 4 * dentro / N; }
  F.calcolo.probabilita = { generatore: generatore, binomiale: binomiale, normale: normale, DISTR: DISTR, bayes: bayes, montecarloPi: montecarloPi };

  /* ═══ 1. Galton ═════════════════════════════════════════════════════════ */
  function schedaGalton(div) {
    var G = griglia(div), st = { n: 12, p: 0.5 }, info = nota(G.pan), cont, palline, rnd, totale;
    F.cursore(G.pan, ['file di chiodi n', 'rows of pins n'], 2, 24, 1, st.n, function (v) { st.n = v; azzera(); });
    F.cursore(G.pan, ['probabilità di andare a destra p', 'probability of going right p'], 0.1, 0.9, 0.05, st.p, function (v) { st.p = v; azzera(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.85);
    function azzera() { cont = new Array(st.n + 1).fill(0); palline = []; rnd = generatore(2024); totale = 0; }
    azzera();
    F.anima(cv, function (dt) {
      /* nuove palline e caduta: ogni pallina scende di una fila ogni 0,06 s */
      for (var k = 0; k < Math.round(dt * 60 * 2); k++) if (palline.length < 60) palline.push({ fila: 0, dx: 0, f: 0, cammino: [] });
      palline.forEach(function (b) { b.f += dt / 0.06; while (b.f >= 1 && b.fila < st.n) { b.f -= 1; var d = rnd() < st.p ? 1 : 0; b.dx += d; b.cammino.push(d); b.fila++; } });
      palline = palline.filter(function (b) { if (b.fila >= st.n && b.f >= 1) { cont[b.dx]++; totale++; return false; } return true; });
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, n = st.n, top = 16, alto = H * 0.5, passoX = (W - 40) / (n + 1), passoY = alto / n;
      /* chiodi */
      q.fillStyle = '#34465f';
      for (var r = 0; r < n; r++) for (var j = 0; j <= r; j++) { var x = W / 2 + (j - r / 2) * passoX, y = top + r * passoY; q.beginPath(); q.arc(x, y, 2.5, 0, Math.PI * 2); q.fill(); }
      /* palline in volo */
      q.fillStyle = '#ffd24a';
      palline.forEach(function (b) { var fila = Math.min(n, b.fila), x = W / 2 + (b.dx - fila / 2) * passoX, y = top + (fila + Math.min(1, b.f)) * passoY - passoY / 2; q.beginPath(); q.arc(x, y, 3.2, 0, Math.PI * 2); q.fill(); });
      /* istogramma e curve teoriche */
      var base = H - 14, hmax = H - top - alto - 30, mx = Math.max(1, Math.max.apply(null, cont)), bmax = 0;
      for (var k2 = 0; k2 <= n; k2++) bmax = Math.max(bmax, binomiale(n, k2, st.p));
      var scala = hmax / Math.max(mx / Math.max(1, totale), bmax);
      for (k2 = 0; k2 <= n; k2++) { var xx = W / 2 + (k2 - n / 2) * passoX, h = totale ? cont[k2] / totale * scala : 0; q.fillStyle = 'rgba(94,234,212,.75)'; q.fillRect(xx - passoX * 0.4, base - h, passoX * 0.8, h); }
      q.strokeStyle = '#ff8a80'; q.lineWidth = 2; q.beginPath(); for (k2 = 0; k2 <= n; k2++) { var xb = W / 2 + (k2 - n / 2) * passoX, yb = base - binomiale(n, k2, st.p) * scala; if (k2) q.lineTo(xb, yb); else q.moveTo(xb, yb); } q.stroke();
      var mu = n * st.p, sg = Math.sqrt(n * st.p * (1 - st.p)); q.strokeStyle = '#ffd24a'; q.setLineDash([4, 4]); q.beginPath(); for (var i = 0; i <= 200; i++) { var kk = -0.5 + (n + 1) * i / 200, xn = W / 2 + (kk - n / 2) * passoX, yn = base - normale(kk, mu, sg) * scala; if (i) q.lineTo(xn, yn); else q.moveTo(xn, yn); } q.stroke(); q.setLineDash([]); q.lineWidth = 1;
      var media = 0, m2 = 0; cont.forEach(function (c, k3) { media += c * k3; m2 += c * k3 * k3; }); media /= Math.max(1, totale); var varz = m2 / Math.max(1, totale) - media * media;
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.fillText(t('palline: ', 'balls: ') + totale, 10, H - 2);
      cv.setAttribute('aria-label', t('macchina di Galton', 'Galton board'));
      if (totale % 25 === 0 || totale < 5) info.innerHTML = t('Media misurata ', 'Measured mean ') + '<b class="bsiFX-num">' + fmt(media) + '</b> · np = ' + fmt(mu) + '<br>' + t('Varianza misurata ', 'Measured variance ') + '<b class="bsiFX-num">' + fmt(varz) + '</b> · np(1 − p) = ' + fmt(sg * sg) + '<br>' + t('In rosso la binomiale B(n, p), tratteggiata la gaussiana con la stessa media e varianza: per n grande coincidono (de Moivre-Laplace). Ogni pallina somma n scelte indipendenti: è il teorema del limite centrale in legno e chiodi.', 'In red the binomial B(n, p), dashed the Gaussian with the same mean and variance: for large n they coincide (de Moivre-Laplace). Each ball adds up n independent choices: the central limit theorem in wood and pins.');
    }, { ricomincia: azzera });
  }

  /* ═══ 2. grandi numeri e limite centrale ════════════════════════════════ */
  function schedaLimiteCentrale(div) {
    var G = griglia(div), st = { d: 'esponenziale', n: 10 }, info = nota(G.pan), rnd, medie, corrente, storia, conteggio;
    F.scelta(G.pan, ['Distribuzione', 'Distribution'], Object.keys(DISTR).map(function (k) { return [k, F.tt(DISTR[k][0])]; }), st.d, function (v) { st.d = v; azzera(); });
    F.cursore(G.pan, ['ampiezza del campione n', 'sample size n'], 1, 100, 1, st.n, function (v) { st.n = v; azzera(); });
    G.pan.appendChild(info);
    var ch = F.tela(G.dx, 0.5), cm = F.tela(G.dx, 0.4);
    function azzera() { rnd = generatore(7); medie = []; corrente = 0; storia = { x: [], y: [] }; conteggio = 0; }
    azzera();
    F.anima(ch, function (dt) {
      var D = DISTR[st.d], quanti = Math.max(1, Math.round(dt * 60 * 5));
      for (var k = 0; k < quanti && medie.length < 4000; k++) {
        var s = 0; for (var i = 0; i < st.n; i++) { var x = D[1](rnd); s += x; conteggio++; corrente += (x - corrente) / conteggio; if (conteggio % 5 === 0 && storia.x.length < 3000) { storia.x.push(conteggio); storia.y.push(corrente); } }
        medie.push(s / st.n);
      }
      var mu = D[2], sg = D[3] / Math.sqrt(st.n), lo = mu - 4.5 * sg, hi = mu + 4.5 * sg, nb = 40, h = new Array(nb).fill(0);
      medie.forEach(function (m) { var b = Math.floor((m - lo) / (hi - lo) * nb); if (b >= 0 && b < nb) h[b]++; });
      var w = (hi - lo) / nb, xs = [], gs = [];
      for (var j = 0; j <= 200; j++) { var x2 = lo + (hi - lo) * j / 200; xs.push(x2); gs.push(normale(x2, mu, sg)); }
      F.grafico(ch, { barre: h.map(function (c, b) { return { x: lo + (b + 0.5) * w, y: c / Math.max(1, medie.length) / w, col: '#5eead4', larg: Math.max(2, (ch.clientWidth || 400) / nb * 0.7) }; }), serie: [{ x: xs, y: gs, col: '#ffd24a', larg: 2, etich: 'N(μ, σ²/n)' }], xmin: lo, xmax: hi, ymin: 0, xl: ['media del campione', 'sample mean'], yl: ['densità', 'density'], legenda: [{ col: '#ffd24a', etich: 'N(μ, σ²/n)' }] });
      F.grafico(cm, { serie: [{ x: storia.x, y: storia.y, col: '#5eead4', larg: 1.8, etich: ['media corrente', 'running mean'] }], linee: [{ y: mu, col: '#ffd24a', etich: 'μ = ' + fmt(mu) }], xl: ['estrazioni', 'draws'], yl: ['media di tutte le estrazioni', 'mean of all draws'], ymin: mu - 3 * D[3] / Math.sqrt(Math.max(5, Math.min(conteggio, 20))), ymax: mu + 3 * D[3] / Math.sqrt(Math.max(5, Math.min(conteggio, 20))) });
      var mm = medie.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, medie.length), vv = medie.reduce(function (a, b) { return a + (b - mm) * (b - mm); }, 0) / Math.max(1, medie.length - 1);
      info.innerHTML = t('Medie raccolte: ', 'Means collected: ') + medie.length + ' · ' + t('loro media ', 'their mean ') + '<b class="bsiFX-num">' + fmt(mm) + '</b> (μ = ' + fmt(mu) + ') · ' + t('deviazione standard ', 'standard deviation ') + '<b class="bsiFX-num">' + fmt(Math.sqrt(vv)) + '</b> (σ/√n = ' + fmt(sg) + ')<br>' + t('Anche partendo da una distribuzione storta come l’esponenziale, le medie diventano gaussiane quando n cresce: per questo l’errore di una media di misure ripetute si stima con σ/√n.', 'Even starting from a skewed distribution like the exponential, means become Gaussian as n grows: this is why the error of a mean of repeated measurements is estimated as σ/√n.');
      if (medie.length >= 4000) return false;
    }, { ricomincia: azzera });
  }

  /* ═══ 3. Monte Carlo ════════════════════════════════════════════════════ */
  function schedaMonteCarlo(div) {
    var G = griglia(div), info = nota(G.pan), rnd, N, dentro, storia, punti;
    G.pan.appendChild(info);
    var cq = F.tela(G.dx, 0.62), ce = F.tela(G.dx, 0.42);
    function azzera() { rnd = generatore(31415); N = 0; dentro = 0; storia = { x: [], y: [] }; punti = []; }
    azzera();
    F.anima(cq, function (dt) {
      var quanti = Math.max(1, Math.round(dt * 60 * 40));
      for (var k = 0; k < quanti && N < 200000; k++) { var x = rnd(), y = rnd(), d = x * x + y * y <= 1; N++; if (d) dentro++; if (punti.length < 6000) punti.push([x, y, d]); if (N > 10 && (N & (N - 1)) === 0 || N % 500 === 0) { storia.x.push(Math.log10(N)); storia.y.push(Math.log10(Math.abs(4 * dentro / N - Math.PI) || 1e-7)); } }
      var P = F.pennello(cq), q = P.q, W = P.W, H = P.H, L = Math.min(W, H) - 20, ox = (W - L) / 2, oy = 10;
      q.strokeStyle = '#34465f'; q.strokeRect(ox, oy, L, L); q.strokeStyle = '#ffd24a'; q.beginPath(); q.arc(ox, oy + L, L, -Math.PI / 2, 0); q.stroke();
      punti.forEach(function (p) { q.fillStyle = p[2] ? 'rgba(94,234,212,.75)' : 'rgba(255,138,128,.75)'; q.fillRect(ox + p[0] * L - 1, oy + L - p[1] * L - 1, 2, 2); });
      cq.setAttribute('aria-label', t('freccette in un quadrato per stimare π', 'darts in a square to estimate π'));
      if (N % 400 < quanti || N >= 200000) {
        F.grafico(ce, { serie: [{ x: storia.x, y: storia.y, col: '#5eead4', etich: ['errore', 'error'] }, { x: [1, 5.3], y: [0.2 - 0.5, 0.2 - 0.5 * 5.3], col: '#ffd24a', tratt: true, etich: '∝ 1/√N' }], xl: ['log₁₀ N', 'log₁₀ N'], yl: ['log₁₀ |π̂ − π|', 'log₁₀ |π̂ − π|'], legenda: [{ col: '#5eead4', etich: ['errore della stima', 'estimate error'] }, { col: '#ffd24a', etich: ['pendenza −½', 'slope −½'] }] });
        info.innerHTML = 'N = ' + N + ' · π ≈ 4 · ' + t('dentro', 'inside') + '/N = <b class="bsiFX-num">' + (4 * dentro / N).toFixed(5) + '</b> (' + t('errore ', 'error ') + fmt(Math.abs(4 * dentro / N - Math.PI)) + ')<br>' + t('L’errore scende come 1/√N: per una cifra in più servono 100 volte più punti. Il Monte Carlo conviene quando le dimensioni sono tante (integrali su molte variabili, dinamica molecolare, propagazione delle incertezze).', 'The error falls like 1/√N: one more digit needs 100 times more points. Monte Carlo pays off when dimensions are many (integrals over many variables, molecular dynamics, uncertainty propagation).');
      }
      if (N >= 200000) return false;
    }, { ricomincia: azzera });
  }

  /* ═══ 4. Bayes ══════════════════════════════════════════════════════════ */
  function schedaBayes(div) {
    var G = griglia(div), st = { prev: 1, sens: 99, spec: 95 }, info = nota(G.pan);
    F.cursore(G.pan, ['prevalenza (%)', 'prevalence (%)'], 0.1, 50, 0.1, st.prev, function (v) { st.prev = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['sensibilità (%)', 'sensitivity (%)'], 50, 100, 0.5, st.sens, function (v) { st.sens = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['specificità (%)', 'specificity (%)'], 50, 100, 0.5, st.spec, function (v) { st.spec = v; disegna(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.62);
    function disegna() {
      var B = bayes(st.prev / 100, st.sens / 100, st.spec / 100), N = 1000, malati = Math.round(N * st.prev / 100), vp = Math.round(malati * st.sens / 100), fp = Math.round((N - malati) * (1 - st.spec / 100));
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, col = 40, righe = 25, cw = (W - 20) / col, rh = (H - 30) / righe;
      for (var i = 0; i < N; i++) {
        var r = Math.floor(i / col), c = i % col, x = 10 + c * cw + cw / 2, y = 10 + r * rh + rh / 2, malato = i < malati, positivo = malato ? i < vp : i - malati < fp;
        q.fillStyle = malato ? (positivo ? '#ff8a80' : '#8a3a3a') : (positivo ? '#ffd24a' : '#2a4a6e');
        q.beginPath(); q.arc(x, y - rh * 0.12, Math.min(cw, rh) * 0.2, 0, Math.PI * 2); q.fill(); q.fillRect(x - Math.min(cw, rh) * 0.18, y + rh * 0.05, Math.min(cw, rh) * 0.36, rh * 0.3);
      }
      q.font = '11px system-ui'; [['#ff8a80', t('malato, positivo', 'ill, positive')], ['#8a3a3a', t('malato, negativo', 'ill, negative')], ['#ffd24a', t('sano, positivo (falso allarme)', 'healthy, positive (false alarm)')], ['#2a4a6e', t('sano, negativo', 'healthy, negative')]].forEach(function (l, k) { q.fillStyle = l[0]; q.fillRect(10 + k * (W - 20) / 4, H - 14, 10, 10); q.fillStyle = '#c9d3df'; q.fillText(l[1], 24 + k * (W - 20) / 4, H - 5); });
      cv.setAttribute('aria-label', t('mille persone sottoposte al test', 'a thousand people tested'));
      info.innerHTML = t('Su 1000 persone: ', 'Out of 1000 people: ') + malati + t(' malate, ', ' ill, ') + vp + t(' veri positivi, ', ' true positives, ') + fp + t(' falsi positivi', ' false positives') + '<br>' + t('Valore predittivo positivo ', 'Positive predictive value ') + 'P(malato | +) = <b class="bsiFX-num">' + fmt(B.ppv * 100) + ' %</b><br>' + t('Valore predittivo negativo ', 'Negative predictive value ') + 'P(sano | −) = ' + fmt(B.npv * 100) + ' %<br>' + t('Teorema di Bayes: P(M|+) = P(+|M)P(M) / [P(+|M)P(M) + P(+|S)P(S)]. Con una malattia rara anche un ottimo test produce più falsi positivi che veri: per questo un positivo di screening si conferma con un secondo esame.', 'Bayes’ theorem: P(I|+) = P(+|I)P(I) / [P(+|I)P(I) + P(+|H)P(H)]. With a rare disease even an excellent test gives more false positives than true ones: this is why a screening positive is confirmed with a second test.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 5. normale bivariata in 3D (v238) ═════════════════════════════════
     (X, Y) normale con medie 0, deviazioni σx, σy e correlazione ρ:
       f(x, y) = exp(−Q/2) / (2π σx σy √(1 − ρ²)),  Q = (u² − 2ρuv + v²)/(1 − ρ²), u = x/σx, v = y/σy.
     Q e' il quadrato della distanza di Mahalanobis; Q ha distribuzione χ² con 2 gradi di liberta',
     quindi l'ellisse Q ≤ k² contiene la probabilita' 1 − e^(−k²/2) (39,35 % per k = 1, 86,47 % per
     k = 2). Le marginali sono N(0, σx²) e N(0, σy²) qualunque sia ρ; la media condizionata
     E[Y | X = x] = ρ σy/σx · x e' la retta di regressione. I campioni: Box–Muller e poi
     X = σx Z₁, Y = σy (ρ Z₁ + √(1 − ρ²) Z₂). */
  function densitaBiv(x, y, sx, sy, rho) { var u = x / sx, v = y / sy, d = 1 - rho * rho; return Math.exp(-(u * u - 2 * rho * u * v + v * v) / (2 * d)) / (2 * Math.PI * sx * sy * Math.sqrt(d)); }
  function mahalanobis2(x, y, sx, sy, rho) { var u = x / sx, v = y / sy; return (u * u - 2 * rho * u * v + v * v) / (1 - rho * rho); }
  function probEllisse(k) { return 1 - Math.exp(-k * k / 2); }
  function campionaBiv(r, sx, sy, rho) { var u = 1 - r(), w = r(), R = Math.sqrt(-2 * Math.log(u)), z1 = R * Math.cos(2 * Math.PI * w), z2 = R * Math.sin(2 * Math.PI * w); return [sx * z1, sy * (rho * z1 + Math.sqrt(1 - rho * rho) * z2)]; }
  function correlazione(P) { var n = P.length, mx = 0, my = 0, sxx = 0, syy = 0, sxy = 0, i; for (i = 0; i < n; i++) { mx += P[i][0] / n; my += P[i][1] / n; } for (i = 0; i < n; i++) { var a = P[i][0] - mx, b = P[i][1] - my; sxx += a * a; syy += b * b; sxy += a * b; } return { r: sxy / Math.sqrt(sxx * syy), mx: mx, my: my, sx: Math.sqrt(sxx / (n - 1)), sy: Math.sqrt(syy / (n - 1)) }; }
  /* assi dell'ellisse: autovalori e autovettori della covarianza [[σx², ρσxσy], [ρσxσy, σy²]] */
  function assiEllisse(sx, sy, rho) { var a = sx * sx, b = rho * sx * sy, d = sy * sy, m = (a + d) / 2, q = Math.sqrt((a - d) * (a - d) / 4 + b * b), l1 = m + q, l2 = m - q, th = Math.abs(b) < 1e-15 ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b); return { l1: l1, l2: l2, angolo: th }; }
  F.calcolo.probabilita.densitaBiv = densitaBiv; F.calcolo.probabilita.mahalanobis2 = mahalanobis2; F.calcolo.probabilita.probEllisse = probEllisse; F.calcolo.probabilita.campionaBiv = campionaBiv; F.calcolo.probabilita.correlazione = correlazione; F.calcolo.probabilita.assiEllisse = assiEllisse;

  /* la scheda 3D: il pannello si costruisce subito (testo e comandi), la scena dopo, fuori dal gestore del clic */
  function scheda3d(costruisci, etichetta, rapporto) {
    return function (div) {
      var G = griglia(div), posto = F.el('div'); G.dx.appendChild(posto);
      var vista = costruisci(G.pan, G.dx), lab = globale.BSILab3D;
      if (!lab) { posto.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serve il Laboratorio 3D (bsi-lab3d.js) per la vista tridimensionale.', 'The 3D Laboratory (bsi-lab3d.js) is needed for the three-dimensional view.') })); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); posto.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new lab.Scena(posto, rapporto || 0.72);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(etichetta));
          globale.requestAnimationFrame(function () { try { vista(S, lab, globale.THREE); } catch (e) { if (globale.console) console.error(e); } div._scena = S; });
        }, 0);
      }).catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function schedaBivariata(pan) {
    var st = { rho: 0.6, sx: 1, sy: 1, vel: 40 }, S = null, T = null, lab = null, rnd = generatore(2026), ogg = {}, cadono = [], caduti = [], ultimo = 0, MAXC = 5000, L = 4, Hs = 2.6;
    var f2 = function (v) { return v.toFixed(2); };
    F.cursore(pan, ['correlazione ρ', 'correlation ρ'], -0.95, 0.95, 0.05, st.rho, function (v) { st.rho = v; nuova(); }, f2);
    F.cursore(pan, ['deviazione standard σx', 'standard deviation σx'], 0.5, 2, 0.05, st.sx, function (v) { st.sx = v; nuova(); }, f2);
    F.cursore(pan, ['deviazione standard σy', 'standard deviation σy'], 0.5, 2, 0.05, st.sy, function (v) { st.sy = v; nuova(); }, f2);
    F.cursore(pan, ['campioni al secondo', 'samples per second'], 5, 400, 5, st.vel, function (v) { st.vel = v; }, function (v) { return String(v); });
    F.bottone(pan, ['↺ Ricomincia la pioggia', '↺ Restart the rain'], function () { nuova(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }), conti = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info); pan.appendChild(conti);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('La superficie è la densità congiunta f(x, y) (altezza riscalata al suo massimo): con ρ > 0 la campana si allunga lungo la diagonale, con ρ < 0 lungo l’altra, e per ρ → ±1 si schiaccia su una retta. I punti che cadono sono estrazioni casuali (Box–Muller, generatore con seme): si accumulano sul pavimento e la loro nuvola prende la forma delle curve di livello. Le due ellissi gialle sono le regioni Q ≤ 1 e Q ≤ 4 (Mahalanobis), che contengono il 39,35 % e l’86,47 % della probabilità: la frazione di punti che ci cade dentro converge a questi numeri, con un errore che cala come 1/√N. Sulle pareti, in rosso e azzurro, le densità marginali N(0, σx²) e N(0, σy²) con gli istogrammi dei campioni: non dipendono da ρ, perché la correlazione sta solo nella forma congiunta. La retta tratteggiata è la regressione E[Y | X = x] = ρ(σy/σx)x.',
      'The surface is the joint density f(x, y) (height rescaled to its maximum): with ρ > 0 the bell stretches along the diagonal, with ρ < 0 along the other one, and as ρ → ±1 it collapses onto a line. The falling points are random draws (Box–Muller, seeded generator): they pile up on the floor and their cloud takes the shape of the contour lines. The two yellow ellipses are the regions Q ≤ 1 and Q ≤ 4 (Mahalanobis), holding 39.35 % and 86.47 % of the probability: the fraction of points falling inside converges to these numbers, with an error shrinking like 1/√N. On the walls, in red and blue, the marginal densities N(0, σx²) and N(0, σy²) with the sample histograms: they do not depend on ρ, because the correlation lives only in the joint shape. The dashed line is the regression E[Y | X = x] = ρ(σy/σx)x.') }));
    function testo() {
      var A = assiEllisse(st.sx, st.sy, st.rho), picco = densitaBiv(0, 0, st.sx, st.sy, st.rho);
      info.innerHTML = t('picco ', 'peak ') + 'f(0, 0) = 1/(2πσxσy√(1 − ρ²)) = <b class="bsiFX-num">' + picco.toFixed(4) + '</b><br>' + t('assi dell’ellisse: √λ = ', 'ellipse axes: √λ = ') + Math.sqrt(A.l1).toFixed(3) + ', ' + Math.sqrt(Math.max(0, A.l2)).toFixed(3) + ' · ' + t('inclinazione ', 'tilt ') + (A.angolo * 180 / Math.PI).toFixed(1) + '°<br>' + t('regressione: ', 'regression: ') + 'E[Y | X = x] = <b class="bsiFX-num">' + (st.rho * st.sy / st.sx).toFixed(3) + '</b>·x';
    }
    function nuova() { cadono = []; caduti = []; rnd = generatore(2026); testo(); conti.innerHTML = ''; scena(); }
    /* altezza nella scena: la densita' divisa per il suo massimo, per Hs */
    function scena() {
      if (!S) return;
      S.pulisci(); ogg = {};
      var N = 70, picco = densitaBiv(0, 0, st.sx, st.sy, st.rho), pos = [], col = [], idx = [], i, j;
      for (i = 0; i <= N; i++) for (j = 0; j <= N; j++) { var x = -L + 2 * L * i / N, y = -L + 2 * L * j / N, u = densitaBiv(x, y, st.sx, st.sy, st.rho) / picco; pos.push(x, y, u * Hs); var c = colScala(u); col.push(c[0], c[1], c[2]); }
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) { var a = i * (N + 1) + j, b = a + N + 1; idx.push(a, b, b + 1, a, b + 1, a + 1); }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      S.aggiungi(new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.78, side: T.DoubleSide, roughness: 0.5, depthWrite: false })));
      S.aggiungi(new T.LineSegments(new T.WireframeGeometry(geo), new T.LineBasicMaterial({ color: 0x0b1a2a, transparent: true, opacity: 0.15 })));
      /* il pavimento con le ellissi Q = 1 e Q = 4 (anche sulla superficie, alla quota e^(−k²/2)) */
      S.aggiungi(lab.linea(T, [[-L, -L, 0], [L, -L, 0], [L, L, 0], [-L, L, 0], [-L, -L, 0]], 0x34465f));
      var A = assiEllisse(st.sx, st.sy, st.rho);
      [1, 2].forEach(function (k) {
        var e = [], es = []; for (var q = 0; q <= 120; q++) { var th = 2 * Math.PI * q / 120, p = k * Math.sqrt(A.l1) * Math.cos(th), r = k * Math.sqrt(Math.max(0, A.l2)) * Math.sin(th), x = p * Math.cos(A.angolo) - r * Math.sin(A.angolo), y = p * Math.sin(A.angolo) + r * Math.cos(A.angolo); e.push([x, y, 0.01]); es.push([x, y, Math.exp(-k * k / 2) * Hs + 0.01]); }
        S.aggiungi(lab.linea(T, e, 0xffd24a, k === 1 ? 0.95 : 0.7)); S.aggiungi(lab.linea(T, es, 0xffd24a, 0.6));
      });
      var m = st.rho * st.sy / st.sx, xr = Math.min(L, L / Math.max(1e-9, Math.abs(m))), reg = [];
      for (var q = 0; q <= 20; q += 2) { var x0 = -xr + 2 * xr * q / 20, x1 = -xr + 2 * xr * (q + 1) / 20; reg.push(new T.Vector3(x0, m * x0, 0.02), new T.Vector3(x1, m * x1, 0.02)); }
      S.aggiungi(new T.LineSegments(new T.BufferGeometry().setFromPoints(reg), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })));
      /* le marginali sulle pareti y = L (in x) e x = −L (in y), alte 2 al massimo */
      var mx = [], my = []; for (q = 0; q <= 120; q++) { var v = -L + 2 * L * q / 120; mx.push([v, L, 2 * normale(v, 0, st.sx) * st.sx * Math.sqrt(2 * Math.PI)]); my.push([-L, v, 2 * normale(v, 0, st.sy) * st.sy * Math.sqrt(2 * Math.PI)]); }
      S.aggiungi(lab.linea(T, mx, 0xff8a80)); S.aggiungi(lab.linea(T, my, 0x6bcfff));
      S.aggiungi(lab.linea(T, [[-L, L, 0], [L, L, 0], [L, L, 2.4], [-L, L, 2.4], [-L, L, 0]], 0x34465f, 0.6)); S.aggiungi(lab.linea(T, [[-L, -L, 0], [-L, L, 0], [-L, L, 2.4], [-L, -L, 2.4], [-L, -L, 0]], 0x34465f, 0.6));
      ogg.istoX = lab.linea(T, [[0, 0, 0], [0, 0, 0]], 0xffc4b8, 0.9); ogg.istoY = lab.linea(T, [[0, 0, 0], [0, 0, 0]], 0xbfe6ff, 0.9); S.aggiungi(ogg.istoX); S.aggiungi(ogg.istoY);
      /* i punti: quelli in aria e quelli caduti, in due nuvole con buffer preallocati */
      var gc = new T.BufferGeometry(); gc.setAttribute('position', new T.BufferAttribute(new Float32Array(MAXC * 3), 3)); gc.setDrawRange(0, 0);
      ogg.caduti = new T.Points(gc, new T.PointsMaterial({ color: 0xe6fffb, size: 0.06, transparent: true, opacity: 0.85, depthWrite: false })); ogg.caduti.frustumCulled = false; S.aggiungi(ogg.caduti);
      var ga = new T.BufferGeometry(); ga.setAttribute('position', new T.BufferAttribute(new Float32Array(600 * 3), 3)); ga.setDrawRange(0, 0);
      ogg.aria = new T.Points(ga, new T.PointsMaterial({ color: 0xffd24a, size: 0.12, transparent: true, depthWrite: false })); ogg.aria.frustumCulled = false; S.aggiungi(ogg.aria);
      S.aggiungi(lab.assi(T, L * 1.15, ['x', 'y', 'f'], 0.32));
      S.didascalia.textContent = 'ρ = ' + st.rho.toFixed(2) + ' · σx = ' + st.sx.toFixed(2) + ' · σy = ' + st.sy.toFixed(2);
      if (!S.vistaIniziale) S.inquadra(14, -0.95, 1.05);
      var accumulo = 0;
      /* una prima manciata di punti gia' a terra: la scena non parte vuota */
      for (q = 0; q < 400; q++) atterra(campionaBiv(rnd, st.sx, st.sy, st.rho));
      S.ogniFotogramma(function (dt) {
        accumulo += dt * st.vel;
        while (accumulo >= 1 && cadono.length < 600) { accumulo -= 1; var p = campionaBiv(rnd, st.sx, st.sy, st.rho); cadono.push([p[0], p[1], 5 + Math.random() * 0.5, 0]); }
        if (accumulo > 1) accumulo = 1;
        var pa = ogg.aria.geometry.attributes.position, k = 0;
        cadono = cadono.filter(function (c) { c[3] += 9.8 * dt * 0.6; c[2] -= c[3] * dt; if (c[2] <= 0) { atterra(c); return false; } return true; });
        cadono.forEach(function (c) { pa.setXYZ(k++, c[0], c[1], c[2]); }); pa.needsUpdate = true; ogg.aria.geometry.setDrawRange(0, k);
        var ora = Date.now(); if (ora - ultimo > 400) { ultimo = ora; statistiche(); }
      });
      statistiche();
    }
    function atterra(c) {
      if (caduti.length >= MAXC) caduti.shift();
      caduti.push([c[0], c[1]]);
      var pc = ogg.caduti.geometry.attributes.position; if (caduti.length < MAXC) pc.setXYZ(caduti.length - 1, c[0], c[1], 0.015); else caduti.forEach(function (p, i) { pc.setXYZ(i, p[0], p[1], 0.015); });
      pc.needsUpdate = true; ogg.caduti.geometry.setDrawRange(0, caduti.length);
    }
    function statistiche() {
      var n = caduti.length; if (n < 3) return;
      var d1 = 0, d2 = 0, hx = [], hy = [], nb = 32, i; for (i = 0; i < nb; i++) { hx.push(0); hy.push(0); }
      caduti.forEach(function (p) { var q = mahalanobis2(p[0], p[1], st.sx, st.sy, st.rho); if (q <= 1) d1++; if (q <= 4) d2++; var a = Math.floor((p[0] + L) / (2 * L) * nb), b = Math.floor((p[1] + L) / (2 * L) * nb); if (a >= 0 && a < nb) hx[a]++; if (b >= 0 && b < nb) hy[b]++; });
      /* istogrammi normalizzati come densita' e riscalati come le marginali (altezza 2·σ√(2π)·f) */
      var w = 2 * L / nb, sx = [], sy = [];
      for (i = 0; i < nb; i++) { var x0 = -L + i * w, hX = 2 * hx[i] / (n * w) * st.sx * Math.sqrt(2 * Math.PI), hY = 2 * hy[i] / (n * w) * st.sy * Math.sqrt(2 * Math.PI); sx.push(new T.Vector3(x0, L, hX), new T.Vector3(x0 + w, L, hX)); sy.push(new T.Vector3(-L, x0, hY), new T.Vector3(-L, x0 + w, hY)); }
      ogg.istoX.geometry.setFromPoints(sx); ogg.istoY.geometry.setFromPoints(sy);
      var R = correlazione(caduti), e1 = Math.sqrt(probEllisse(1) * (1 - probEllisse(1)) / n);
      conti.innerHTML = 'N = <b class="bsiFX-num">' + n + '</b>' + (n >= MAXC ? t(' (gli ultimi)', ' (the latest)') : '') + '<br>' + t('dentro Q ≤ 1: ', 'inside Q ≤ 1: ') + '<b class="bsiFX-num">' + (100 * d1 / n).toFixed(1) + ' %</b> (' + t('teoria ', 'theory ') + (100 * probEllisse(1)).toFixed(2) + ' % ± ' + (100 * e1).toFixed(1) + ')<br>' + t('dentro Q ≤ 4: ', 'inside Q ≤ 4: ') + '<b class="bsiFX-num">' + (100 * d2 / n).toFixed(1) + ' %</b> (' + t('teoria ', 'theory ') + (100 * probEllisse(2)).toFixed(2) + ' %)<br>' + t('correlazione campionaria ', 'sample correlation ') + 'r = <b class="bsiFX-num">' + R.r.toFixed(3) + '</b> (ρ = ' + st.rho.toFixed(2) + ') · s_x = ' + R.sx.toFixed(3) + ', s_y = ' + R.sy.toFixed(3);
    }
    function colScala(u) { var P = [[0.12, 0.2, 0.45], [0.15, 0.55, 0.75], [0.37, 0.92, 0.83], [1, 0.82, 0.29], [1, 0.54, 0.5]], k = Math.min(3, Math.floor(u * 4)), f = u * 4 - k, a = P[k], b = P[k + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
    testo();
    return function (Sc, L3, Tr) { S = Sc; lab = L3; T = Tr; nuova(); };
  }

  F.sezione('smatprob', {
    titolo: ['🎲 Probabilità in movimento', '🎲 Probability in motion'],
    sotto: ['La macchina di Galton e la binomiale, la legge dei grandi numeri e il teorema del limite centrale, il metodo Monte Carlo, il teorema di Bayes con i test diagnostici.', 'The Galton board and the binomial, the law of large numbers and the central limit theorem, the Monte Carlo method, Bayes’ theorem with diagnostic tests.'],
    schede: [
      { nome: ['🔻 Galton', '🔻 Galton'], costruisci: schedaGalton },
      { nome: ['📊 Limite centrale', '📊 Central limit'], costruisci: schedaLimiteCentrale },
      { nome: ['🎯 Monte Carlo', '🎯 Monte Carlo'], costruisci: schedaMonteCarlo },
      { nome: ['🩺 Bayes', '🩺 Bayes'], costruisci: schedaBayes },
      { nome: ['🧊 Normale bivariata 3D', '🧊 Bivariate normal 3D'], costruisci: scheda3d(schedaBivariata, ['Densità normale bivariata in 3D con campioni che cadono e marginali', 'Bivariate normal density in 3D with falling samples and marginals']) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
