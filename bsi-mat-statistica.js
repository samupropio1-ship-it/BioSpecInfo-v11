/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-statistica.js — 📏 la statistica del laboratorio
   BioSpecInfo · © Samuele Pio Provenzano

   Quello che serve per scrivere una relazione di chimica analitica:

   · DATI RIPETUTI: media, deviazione standard, errore standard, intervallo
     di confidenza con la t di Student, e i due test per i valori anomali
     (Grubbs, con il valore critico calcolato; Dixon Q, con la tabella di
     Rorabacher 1991 al 95 %);
   · TEST DI IPOTESI: t a un campione (contro un valore certificato), a due
     campioni (prima il test F sulle varianze, poi t combinata o di Welch),
     t appaiata; il valore p esatto dalla funzione beta incompleta;
   · PROPAGAZIONE DELLE INCERTEZZE: la formula si scrive, le derivate
     parziali le calcola il motore simbolico (u² = Σ (∂f/∂xᵢ · uᵢ)²), e un
     Monte Carlo di 20 000 estrazioni controlla il risultato;
   · RETTA DI TARATURA: minimi quadrati con gli errori di pendenza e
     intercetta, s_y/x, LOD e LOQ (3,3 s/b e 10 s/b), e la concentrazione
     di un campione con la sua incertezza (Miller & Miller).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function g4(v) { return isFinite(v) ? String(+v.toPrecision(4)) : '—'; }

  /* ── le distribuzioni ─────────────────────────────────────────────────── */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    var s = 1.000000000190015; for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-16) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tCDF(x, nu) { var p = 0.5 * ibeta(nu / (nu + x * x), nu / 2, 0.5); return x >= 0 ? 1 - p : p; }
  function fCDF(x, d1, d2) { return x <= 0 ? 0 : ibeta(d1 * x / (d1 * x + d2), d1 / 2, d2 / 2); }
  function inversa(cdf, p, lo, hi) { for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (cdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
  function tInv(p, nu) { return inversa(function (x) { return tCDF(x, nu); }, p, -1e4, 1e4); }
  function fInv(p, d1, d2) { return inversa(function (x) { return fCDF(x, d1, d2); }, p, 0, 1e5); }

  /* ── dati ripetuti ────────────────────────────────────────────────────── */
  function numeri(testo) { return String(testo).replace(/,/g, '.').split(/[\s;]+/).filter(Boolean).map(Number).filter(isFinite); }
  function descrittiva(x) {
    var n = x.length, m = x.reduce(function (a, b) { return a + b; }, 0) / n, s2 = x.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (n - 1), s = Math.sqrt(s2);
    var o = x.slice().sort(function (a, b) { return a - b; }), med = n % 2 ? o[(n - 1) / 2] : (o[n / 2 - 1] + o[n / 2]) / 2, tc = n > 1 ? tInv(0.975, n - 1) : NaN;
    return { n: n, media: m, s: s, var: s2, sem: s / Math.sqrt(n), mediana: med, min: o[0], max: o[n - 1], cv: 100 * s / Math.abs(m), t: tc, ic: tc * s / Math.sqrt(n), ordinati: o };
  }
  function grubbsCritico(n, alfa) { var tt = tInv(1 - (alfa || 0.05) / (2 * n), n - 2); return (n - 1) / Math.sqrt(n) * Math.sqrt(tt * tt / (n - 2 + tt * tt)); }
  function grubbs(x) {
    var d = descrittiva(x), k = 0, G = 0;
    x.forEach(function (v, i) { var g = Math.abs(v - d.media) / d.s; if (g > G) { G = g; k = i; } });
    var Gc = grubbsCritico(x.length);
    return { G: G, Gc: Gc, sospetto: x[k], anomalo: G > Gc };
  }
  var DIXON95 = { 3: 0.970, 4: 0.829, 5: 0.710, 6: 0.625, 7: 0.568, 8: 0.526, 9: 0.493, 10: 0.466 };
  function dixon(x) {
    var o = x.slice().sort(function (a, b) { return a - b; }), n = o.length, R = o[n - 1] - o[0];
    var qb = (o[1] - o[0]) / R, qa = (o[n - 1] - o[n - 2]) / R, alto = qa > qb;
    return { Q: Math.max(qa, qb), Qc: DIXON95[n], sospetto: alto ? o[n - 1] : o[0], anomalo: DIXON95[n] ? Math.max(qa, qb) > DIXON95[n] : null };
  }

  /* ── test di ipotesi ──────────────────────────────────────────────────── */
  function tUnCampione(x, mu) { var d = descrittiva(x), tt = (d.media - mu) / d.sem, nu = d.n - 1; return { t: tt, nu: nu, p: 2 * (1 - tCDF(Math.abs(tt), nu)), tc: tInv(0.975, nu) }; }
  function fTest(x, y) {
    var a = descrittiva(x), b = descrittiva(y), grande = a.var >= b.var, Fv = grande ? a.var / b.var : b.var / a.var, d1 = grande ? a.n - 1 : b.n - 1, d2 = grande ? b.n - 1 : a.n - 1;
    return { F: Fv, d1: d1, d2: d2, p: Math.min(1, 2 * (1 - fCDF(Fv, d1, d2))), Fc: fInv(0.975, d1, d2) };
  }
  function tDueCampioni(x, y) {
    var a = descrittiva(x), b = descrittiva(y), f = fTest(x, y), r = { F: f };
    if (f.p > 0.05) {
      var sp = Math.sqrt(((a.n - 1) * a.var + (b.n - 1) * b.var) / (a.n + b.n - 2));
      r.tipo = 'combinata'; r.t = (a.media - b.media) / (sp * Math.sqrt(1 / a.n + 1 / b.n)); r.nu = a.n + b.n - 2;
    } else {
      var va = a.var / a.n, vb = b.var / b.n;
      r.tipo = 'Welch'; r.t = (a.media - b.media) / Math.sqrt(va + vb); r.nu = (va + vb) * (va + vb) / (va * va / (a.n - 1) + vb * vb / (b.n - 1));
    }
    r.p = 2 * (1 - tCDF(Math.abs(r.t), r.nu)); r.tc = tInv(0.975, r.nu);
    return r;
  }
  function tAppaiato(x, y) { return tUnCampione(x.map(function (v, i) { return v - y[i]; }), 0); }

  /* ── propagazione delle incertezze ────────────────────────────────────── */
  function propaga(formula, valori) {
    var e = C.leggi(formula), vs = C.simboli(e);
    vs.forEach(function (v) { if (!valori[v]) throw new Error(t('manca il valore di ', 'missing the value of ') + v); });
    var amb = {}; vs.forEach(function (v) { amb[v] = valori[v][0]; });
    var f0 = C.valuta(e, amb), termini = vs.map(function (v) { var d = C.deriva(e, v), dv = C.valuta(d, amb); return { v: v, d: d, dv: dv, contr: dv * valori[v][1] }; });
    var u = Math.sqrt(termini.reduce(function (s, q) { return s + q.contr * q.contr; }, 0));
    termini.forEach(function (q) { q.quota = u ? q.contr * q.contr / (u * u) : 0; });
    return { e: e, f: f0, u: u, termini: termini, vars: vs };
  }
  function monteCarlo(e, valori, N, seme) {
    var c = C.compila(e), vs = C.simboli(e), s = seme || 12345, xs = [];
    function rnd() { s = (s * 1103515245 + 12345) % 2147483648; return (s + 0.5) / 2147483648; }
    function gauss() { return Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd()); }
    for (var i = 0; i < N; i++) { var amb = {}; vs.forEach(function (v) { amb[v] = valori[v][0] + valori[v][1] * gauss(); }); var y = c(amb); if (isFinite(y)) xs.push(y); }
    var d = descrittiva(xs); return { media: d.media, s: d.s, n: xs.length };
  }
  function leggiValori(testo) {
    var out = {};
    String(testo).split(/\n/).forEach(function (l) {
      var m = /^\s*([A-Za-zα-ωΑ-Ω_][\w]*)\s*=\s*([^±]+?)\s*(?:±|\+-|\+\/-)\s*(.+?)\s*$/.exec(l.replace(/,/g, '.'));
      if (m) out[m[1]] = [C.valuta(C.leggi(m[2])), C.valuta(C.leggi(m[3]))];
    });
    return out;
  }

  /* ── retta di taratura ────────────────────────────────────────────────── */
  function taratura(x, y) {
    var n = x.length, mx = x.reduce(function (a, b) { return a + b; }, 0) / n, my = y.reduce(function (a, b) { return a + b; }, 0) / n;
    var Sxx = 0, Sxy = 0, Syy = 0; for (var i = 0; i < n; i++) { Sxx += (x[i] - mx) * (x[i] - mx); Sxy += (x[i] - mx) * (y[i] - my); Syy += (y[i] - my) * (y[i] - my); }
    var b = Sxy / Sxx, a = my - b * mx, res = 0; for (i = 0; i < n; i++) res += Math.pow(y[i] - a - b * x[i], 2);
    var syx = Math.sqrt(res / (n - 2)), sb = syx / Math.sqrt(Sxx), sa = syx * Math.sqrt(x.reduce(function (s, v) { return s + v * v; }, 0) / (n * Sxx));
    return { n: n, b: b, a: a, r: Sxy / Math.sqrt(Sxx * Syy), syx: syx, sb: sb, sa: sa, mx: mx, my: my, Sxx: Sxx, LOD: 3.3 * syx / b, LOQ: 10 * syx / b, t: tInv(0.975, n - 2) };
  }
  function inverso(T, y0, m) {
    var x0 = (y0 - T.a) / T.b, s = T.syx / Math.abs(T.b) * Math.sqrt(1 / (m || 1) + 1 / T.n + Math.pow(y0 - T.my, 2) / (T.b * T.b * T.Sxx));
    return { x0: x0, s: s, ic: T.t * s };
  }

  /* ── le schede ────────────────────────────────────────────────────────── */
  function area(rows, val, et) { var a = F.el('textarea', { rows: rows, 'aria-label': et, style: 'width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px;font-family:var(--font-mono,monospace);font-size:.85rem' }); a.value = val; return a; }
  function griglia(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }

  function schedaDati(div) {
    var G = griglia(div);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Misure ripetute (separate da spazi o a capo):', 'Replicate measurements (separated by spaces or new lines):') }));
    var ta = area(5, '10,12 10,15 10,09 10,14 10,11 10,48 10,13 10,10', 'dati'); G.pan.appendChild(ta);
    F.bottone(G.pan, ['Analizza', 'Analyse'], calcola); ta.addEventListener('change', calcola);
    var out = F.el('div'); G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.42), oc = F.el('div', { 'class': 'bsiFX-nota' }); G.dx.appendChild(oc);
    function calcola() {
      var x = numeri(ta.value);
      if (x.length < 3) { out.innerHTML = '<div class="bsiFX-nota bsiFX-ko">' + t('Servono almeno 3 valori.', 'At least 3 values are needed.') + '</div>'; return; }
      var d = descrittiva(x), gr = grubbs(x), dq = dixon(x);
      out.innerHTML = '<table class="bsiFX-tab"><tr><td>n</td><td class="bsiFX-num">' + d.n + '</td></tr><tr><td>' + t('media', 'mean') + ' x̄</td><td class="bsiFX-num">' + g4(d.media) + '</td></tr><tr><td>' + t('deviazione standard', 'standard deviation') + ' s</td><td class="bsiFX-num">' + g4(d.s) + '</td></tr>' +
        '<tr><td>' + t('errore standard', 'standard error') + ' s/√n</td><td class="bsiFX-num">' + g4(d.sem) + '</td></tr><tr><td>CV</td><td class="bsiFX-num">' + d.cv.toFixed(2) + ' %</td></tr><tr><td>' + t('mediana', 'median') + '</td><td class="bsiFX-num">' + g4(d.mediana) + '</td></tr>' +
        '<tr><td>t(95 %, ' + (d.n - 1) + ')</td><td class="bsiFX-num">' + d.t.toFixed(3) + '</td></tr><tr><td><b>' + t('IC 95 %', '95 % CI') + '</b></td><td class="bsiFX-num"><b>' + g4(d.media) + ' ± ' + g4(d.ic) + '</b></td></tr></table>';
      oc.innerHTML = '<b>' + t('Valori anomali', 'Outliers') + '</b><br>Grubbs: G = ' + gr.G.toFixed(3) + ' · G<sub>crit</sub>(n = ' + d.n + ', 95 %) = ' + gr.Gc.toFixed(3) + ' → ' + (gr.anomalo ? '<span class="bsiFX-ko">' + gr.sospetto + t(' è anomalo', ' is an outlier') + '</span>' : '<span class="bsiFX-ok">' + t('nessun anomalo', 'no outlier') + '</span>') +
        '<br>Dixon: Q = ' + dq.Q.toFixed(3) + (dq.Qc ? ' · Q<sub>crit</sub> = ' + dq.Qc + ' → ' + (dq.anomalo ? '<span class="bsiFX-ko">' + dq.sospetto + t(' è anomalo', ' is an outlier') + '</span>' : '<span class="bsiFX-ok">' + t('nessun anomalo', 'no outlier') + '</span>') : ' (' + t('tabella solo per 3 ≤ n ≤ 10', 'table only for 3 ≤ n ≤ 10') + ')') +
        '<br>' + t('Un anomalo si scarta solo con una ragione sperimentale o con un test come questi, mai «a occhio» — e va dichiarato nella relazione.', 'An outlier is discarded only with an experimental reason or a test like these, never “by eye” — and it must be stated in the report.');
      var o = F.grafico(c, { punti: x.map(function (v) { return { x: v, y: 0.5, col: gr.anomalo && v === gr.sospetto ? '#ff8a80' : '#5eead4', r: 6 }; }), serie: [{ x: [d.media - d.ic, d.media + d.ic], y: [0.5, 0.5], col: '#ffd24a', larg: 6 }], ymin: 0, ymax: 1, xl: t('valore', 'value'), yl: '' });
      o.q.fillStyle = '#ffd24a'; o.q.font = '12px system-ui'; o.q.fillText(t('IC 95 % della media', '95 % CI of the mean'), o.X(d.media - d.ic), o.Y(0.62));
    }
    calcola(); F.alRidimensiona(calcola);
  }

  function schedaTest(div) {
    var G = griglia(div), tipo = 'uno';
    F.scelta(G.pan, ['Test', 'Test'], [['uno', ['t a un campione (contro un valore di riferimento)', 'one-sample t (against a reference value)']], ['due', ['t a due campioni (con test F)', 'two-sample t (with F test)']], ['app', ['t appaiato (stessi campioni, due metodi)', 'paired t (same samples, two methods)']]], tipo, function (v) { tipo = v; lb.style.display = v === 'uno' ? 'none' : ''; tb.style.display = lb.style.display; lm.style.display = v === 'uno' ? '' : 'none'; mu.style.display = lm.style.display; calcola(); });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serie A:', 'Series A:') }));
    var ta = area(3, '98.2 99.1 98.7 98.9 98.5', 'A'); G.pan.appendChild(ta);
    var lb = F.el('div', { 'class': 'bsiFX-nota', testo: t('Serie B:', 'Series B:'), style: 'display:none' }); G.pan.appendChild(lb);
    var tb = area(3, '99.6 99.9 99.4 99.8 100.1', 'B'); tb.style.display = 'none'; G.pan.appendChild(tb);
    var lm = F.el('div', { 'class': 'bsiFX-nota', testo: t('Valore di riferimento μ₀ (es. certificato):', 'Reference value μ₀ (e.g. certified):') }); G.pan.appendChild(lm);
    var mu = F.el('input', { type: 'text', value: '100', 'aria-label': 'μ₀' }); G.pan.appendChild(mu);
    F.bottone(G.pan, ['Esegui il test', 'Run the test'], calcola);
    var out = F.el('div', { 'class': 'bsiFX-pannello' }); G.dx.appendChild(out);
    var c = F.tela(G.dx, 0.45);
    function calcola() {
      var x = numeri(ta.value), y = numeri(tb.value), r, h = '';
      try {
        if (x.length < 2 || (tipo !== 'uno' && y.length < 2)) throw new Error(t('servono almeno 2 valori per serie', 'at least 2 values per series are needed'));
        if (tipo === 'app' && x.length !== y.length) throw new Error(t('nel test appaiato le serie hanno la stessa lunghezza', 'in the paired test the series have the same length'));
        if (tipo === 'uno') { r = tUnCampione(x, +mu.value.replace(',', '.')); h += 'H₀: μ = μ₀<br>t = (x̄ − μ₀)/(s/√n) = <b>' + r.t.toFixed(3) + '</b>, ν = ' + r.nu; }
        else if (tipo === 'due') { r = tDueCampioni(x, y); h += t('Test F sulle varianze: F = ', 'F test on the variances: F = ') + r.F.F.toFixed(3) + ' (F<sub>crit</sub> = ' + r.F.Fc.toFixed(3) + ', p = ' + r.F.p.toFixed(4) + ') → ' + (r.tipo === 'combinata' ? t('varianze compatibili: t con varianza combinata', 'compatible variances: t with pooled variance') : t('varianze diverse: t di Welch', 'different variances: Welch’s t')) + '<br>H₀: μ_A = μ_B<br>t = <b>' + r.t.toFixed(3) + '</b>, ν = ' + (+r.nu.toFixed(2)); }
        else { r = tAppaiato(x, y); h += t('Sulle differenze A − B: ', 'On the differences A − B: ') + 'H₀: μ_d = 0<br>t = <b>' + r.t.toFixed(3) + '</b>, ν = ' + r.nu; }
        h += '<br>t<sub>crit</sub>(95 %, ' + t('due code', 'two-tailed') + ') = ' + r.tc.toFixed(3) + ' · p = <b>' + (r.p < 1e-4 ? r.p.toExponential(2) : r.p.toFixed(4)) + '</b><div class="bsiFX-eq">' +
          (r.p < 0.05 ? '<span class="bsiFX-ko">' + t('Differenza significativa al 95 %: H₀ si rifiuta (errore sistematico probabile).', 'Significant difference at 95 %: H₀ is rejected (a systematic error is likely).') + '</span>' : '<span class="bsiFX-ok">' + t('Nessuna differenza significativa al 95 %: i dati sono compatibili con H₀.', 'No significant difference at 95 %: the data are compatible with H₀.') + '</span>') + '</div>';
        out.innerHTML = h;
        var nu = r.nu, xs = [], ys = [], L = Math.max(4.5, Math.abs(r.t) * 1.2);
        for (var i = 0; i <= 400; i++) { var v = -L + 2 * L * i / 400; xs.push(v); ys.push(Math.exp(lgamma((nu + 1) / 2) - lgamma(nu / 2)) / Math.sqrt(nu * Math.PI) * Math.pow(1 + v * v / nu, -(nu + 1) / 2)); }
        var coda = xs.map(function (v, i) { return Math.abs(v) >= r.tc ? ys[i] : NaN; });
        var o = F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4' }, { x: xs, y: coda, col: '#ff8a80', larg: 3 }], ymin: 0, xl: 't', yl: t('densità', 'density') });
        o.q.strokeStyle = '#ffd24a'; o.q.lineWidth = 2; o.q.beginPath(); o.q.moveTo(o.X(r.t), o.Y(0)); o.q.lineTo(o.X(r.t), o.Y(Math.max.apply(null, ys))); o.q.stroke();
        o.q.fillStyle = '#ffd24a'; o.q.font = '12px system-ui'; o.q.fillText('t = ' + r.t.toFixed(2), o.X(r.t) + 4, o.Y(Math.max.apply(null, ys)) + 12);
      } catch (err) { out.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; }
    }
    calcola(); F.alRidimensiona(calcola);
  }

  function schedaPropaga(div) {
    var G = griglia(div);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Formula del risultato:', 'Result formula:') }));
    var fi = F.el('input', { type: 'text', value: 'm/(M*V)', 'aria-label': t('formula', 'formula') }); G.pan.appendChild(fi);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Valori e incertezze (una riga per variabile):', 'Values and uncertainties (one line per variable):') }));
    var ta = area(4, 'm = 0.2045 ± 0.0002\nM = 204.22 ± 0.01\nV = 0.02500 ± 0.00003', 'valori'); G.pan.appendChild(ta);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); G.pan.appendChild(es);
    [[t('molarità da pesata', 'molarity from weighing'), 'm/(M*V)', 'm = 0.2045 ± 0.0002\nM = 204.22 ± 0.01\nV = 0.02500 ± 0.00003'],
     [t('titolazione', 'titration'), 'C1*V1/V2', 'C1 = 0.1002 ± 0.0002\nV1 = 24.35 ± 0.03\nV2 = 25.00 ± 0.03'],
     ['Lambert-Beer', 'A/(eps*l)', 'A = 0.452 ± 0.003\neps = 6220 ± 50\nl = 1.000 ± 0.002'],
     ['pH', '-log(c)', 'c = 2.5e-4 ± 0.1e-4'],
     ['Arrhenius k', 'A0*e^(-Ea/(8.314*T))', 'A0 = 1.0e13 ± 0.1e13\nEa = 100000 ± 1000\nT = 298.15 ± 0.1']].forEach(function (p) {
      es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: p[0], onclick: function () { fi.value = p[1]; ta.value = p[2]; calcola(); } }));
    });
    F.bottone(G.pan, ['Propaga', 'Propagate'], calcola);
    var out = F.el('div', { 'class': 'bsiFX-pannello' }); G.dx.appendChild(out);
    var c = F.tela(G.dx, 0.4);
    function calcola() {
      try {
        var val = leggiValori(ta.value), r = propaga(fi.value, val), mc = monteCarlo(r.e, val, 20000);
        var h = '<div class="bsiFX-eq">f = ' + C.html(r.e) + '<br>u(f)² = Σ (∂f/∂xᵢ · u(xᵢ))²</div><table class="bsiFX-tab"><tr><th>' + t('variabile', 'variable') + '</th><th>∂f/∂x</th><th>' + t('valore', 'value') + '</th><th>' + t('contributo', 'contribution') + '</th></tr>' +
          r.termini.map(function (q) { return '<tr><td>' + esc(q.v) + '</td><td>' + C.html(q.d) + '</td><td class="bsiFX-num">' + g4(q.dv) + '</td><td class="bsiFX-num">' + (100 * q.quota).toFixed(1) + ' %</td></tr>'; }).join('') + '</table>';
        var cifre = Math.max(0, -Math.floor(Math.log10(r.u)) + 1);
        h += '<div class="bsiFX-eq" style="font-size:1.05rem">f = <b>' + (cifre <= 12 ? r.f.toFixed(cifre) + ' ± ' + r.u.toFixed(cifre) : g4(r.f) + ' ± ' + g4(r.u)) + '</b> &nbsp; (u<sub>rel</sub> = ' + (100 * r.u / Math.abs(r.f)).toFixed(3) + ' %)</div>' +
          '<div class="bsiFX-nota">Monte Carlo (' + mc.n + t(' estrazioni gaussiane): s = ', ' Gaussian draws): s = ') + g4(mc.s) + ' (' + t('formula: ', 'formula: ') + g4(r.u) + ')' + t('. L’incertezza si scrive con 1-2 cifre significative e il risultato si arrotonda alla stessa posizione decimale. Il contributo maggiore dice quale misura conviene migliorare.', '. The uncertainty is written with 1-2 significant figures and the result is rounded at the same decimal place. The largest contribution tells which measurement is worth improving.') + '</div>';
        out.innerHTML = h;
        F.grafico(c, { barre: r.termini.map(function (q, i) { return { x: i + 1, y: 100 * q.quota, col: '#ffd24a', larg: 26 }; }), xmin: 0.3, xmax: r.termini.length + 0.7, ymin: 0, ymax: 100, xl: r.termini.map(function (q) { return q.v; }).join('   ·   '), yl: t('% della varianza', '% of the variance') });
      } catch (err) { out.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; }
    }
    calcola(); F.alRidimensiona(calcola);
  }

  function schedaTaratura(div) {
    var G = griglia(div);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Standard: una coppia «concentrazione segnale» per riga.', 'Standards: one «concentration signal» pair per line.') }));
    var ta = area(7, '0 2.1\n2 5.0\n4 9.0\n6 12.6\n8 17.3\n10 21.0\n12 24.7', 'standard'); G.pan.appendChild(ta);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Segnale del campione incognito (media di m letture) e m:', 'Unknown sample signal (mean of m readings) and m:') }));
    var y0 = F.el('input', { type: 'text', value: '13.5', 'aria-label': 'y₀' }), mm = F.el('input', { type: 'number', value: '1', min: '1', 'aria-label': 'm' });
    G.pan.appendChild(F.el('div', { style: 'display:grid;grid-template-columns:2fr 1fr;gap:6px' }, [y0, mm]));
    F.bottone(G.pan, ['Calcola la retta', 'Fit the line'], calcola);
    var out = F.el('div'); G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.55), c2 = F.tela(G.dx, 0.28);
    function calcola() {
      var righe = ta.value.replace(/,/g, '.').split(/\n/).map(function (l) { return l.trim().split(/[\s;]+/).map(Number); }).filter(function (p) { return p.length >= 2 && isFinite(p[0]) && isFinite(p[1]); });
      if (righe.length < 3) { out.innerHTML = '<div class="bsiFX-nota bsiFX-ko">' + t('Servono almeno 3 standard.', 'At least 3 standards are needed.') + '</div>'; return; }
      var x = righe.map(function (p) { return p[0]; }), y = righe.map(function (p) { return p[1]; }), T = taratura(x, y), Y0 = +y0.value.replace(',', '.'), inv = inverso(T, Y0, Math.max(1, +mm.value || 1));
      out.innerHTML = '<table class="bsiFX-tab"><tr><td>' + t('pendenza', 'slope') + ' b</td><td class="bsiFX-num">' + g4(T.b) + ' ± ' + g4(T.sb) + '</td></tr><tr><td>' + t('intercetta', 'intercept') + ' a</td><td class="bsiFX-num">' + g4(T.a) + ' ± ' + g4(T.sa) + '</td></tr>' +
        '<tr><td>r</td><td class="bsiFX-num">' + T.r.toFixed(5) + '</td></tr><tr><td>s<sub>y/x</sub></td><td class="bsiFX-num">' + g4(T.syx) + '</td></tr><tr><td>LOD = 3,3·s<sub>y/x</sub>/b</td><td class="bsiFX-num">' + g4(T.LOD) + '</td></tr><tr><td>LOQ = 10·s<sub>y/x</sub>/b</td><td class="bsiFX-num">' + g4(T.LOQ) + '</td></tr>' +
        '<tr><td><b>x₀ ' + t('del campione', 'of the sample') + '</b></td><td class="bsiFX-num"><b>' + g4(inv.x0) + ' ± ' + g4(inv.ic) + '</b> (IC 95 %)</td></tr></table>' +
        '<div class="bsiFX-nota">s<sub>x₀</sub> = (s<sub>y/x</sub>/b)·√(1/m + 1/n + (y₀ − ȳ)²/(b²Σ(xᵢ − x̄)²)) = ' + g4(inv.s) + t('. L’incertezza è minima al centro della retta: conviene che i campioni cadano vicino a ȳ. r vicino a 1 non basta: guarda i residui.', '. The uncertainty is smallest at the centre of the line: samples should fall near ȳ. r close to 1 is not enough: look at the residuals.') + '</div>';
      var xs = [Math.min.apply(null, x), Math.max.apply(null, x)], band = [], bx = [];
      for (var i = 0; i <= 60; i++) { var xv = xs[0] + (xs[1] - xs[0]) * i / 60; bx.push(xv); band.push(T.t * T.syx * Math.sqrt(1 / T.n + Math.pow(xv - T.mx, 2) / T.Sxx)); }
      F.grafico(c, { punti: x.map(function (v, i) { return { x: v, y: y[i], col: '#ffd24a', r: 4 }; }).concat(isFinite(inv.x0) ? [{ x: inv.x0, y: Y0, col: '#ff8a80', r: 6 }] : []),
        serie: [{ x: bx, y: bx.map(function (v) { return T.a + T.b * v; }), col: '#5eead4' }, { x: bx, y: bx.map(function (v, i) { return T.a + T.b * v + band[i]; }), col: '#5eead4', larg: 1, tratt: true }, { x: bx, y: bx.map(function (v, i) { return T.a + T.b * v - band[i]; }), col: '#5eead4', larg: 1, tratt: true }],
        xl: t('concentrazione', 'concentration'), yl: t('segnale', 'signal') });
      F.grafico(c2, { punti: x.map(function (v, i) { return { x: v, y: y[i] - T.a - T.b * v, col: '#c9b6ff', r: 4 }; }), linee: [{ y: 0, col: '#8494a8' }], xl: t('concentrazione', 'concentration'), yl: t('residui', 'residuals') });
    }
    calcola(); F.alRidimensiona(calcola);
  }

  F.calcolo.statistica = { lgamma: lgamma, ibeta: ibeta, tCDF: tCDF, fCDF: fCDF, tInv: tInv, fInv: fInv, descrittiva: descrittiva, grubbs: grubbs, grubbsCritico: grubbsCritico, dixon: dixon, DIXON95: DIXON95,
    tUnCampione: tUnCampione, fTest: fTest, tDueCampioni: tDueCampioni, tAppaiato: tAppaiato, propaga: propaga, monteCarlo: monteCarlo, leggiValori: leggiValori, taratura: taratura, inverso: inverso };

  F.sezione('smatstat', {
    titolo: ['📏 Statistica di laboratorio', '📏 Laboratory statistics'],
    sotto: ['Media, deviazione standard e intervallo di confidenza con la t di Student; Grubbs e Dixon per i valori anomali; test t e F con il valore p; propagazione delle incertezze con derivate simboliche e Monte Carlo; retta di taratura con LOD, LOQ e l’incertezza del campione.',
            'Mean, standard deviation and Student-t confidence interval; Grubbs and Dixon for outliers; t and F tests with p-values; uncertainty propagation with symbolic derivatives and Monte Carlo; calibration line with LOD, LOQ and the sample uncertainty.'],
    schede: [
      { nome: ['Dati ripetuti e anomali', 'Replicates and outliers'], costruisci: schedaDati },
      { nome: ['Test t e F', 't and F tests'], costruisci: schedaTest },
      { nome: ['Propagazione delle incertezze', 'Uncertainty propagation'], costruisci: schedaPropaga },
      { nome: ['Retta di taratura', 'Calibration line'], costruisci: schedaTaratura }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
