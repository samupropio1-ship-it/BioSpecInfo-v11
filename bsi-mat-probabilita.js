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

  F.sezione('smatprob', {
    titolo: ['🎲 Probabilità in movimento', '🎲 Probability in motion'],
    sotto: ['La macchina di Galton e la binomiale, la legge dei grandi numeri e il teorema del limite centrale, il metodo Monte Carlo, il teorema di Bayes con i test diagnostici.', 'The Galton board and the binomial, the law of large numbers and the central limit theorem, the Monte Carlo method, Bayes’ theorem with diagnostic tests.'],
    schede: [
      { nome: ['🔻 Galton', '🔻 Galton'], costruisci: schedaGalton },
      { nome: ['📊 Limite centrale', '📊 Central limit'], costruisci: schedaLimiteCentrale },
      { nome: ['🎯 Monte Carlo', '🎯 Monte Carlo'], costruisci: schedaMonteCarlo },
      { nome: ['🩺 Bayes', '🩺 Bayes'], costruisci: schedaBayes }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
