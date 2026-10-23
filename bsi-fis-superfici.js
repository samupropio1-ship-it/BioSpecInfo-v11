/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-superfici.js — 🌟 fotochimica, superfici e polimeri
   BioSpecInfo · © Samuele Pio Provenzano

   · FOTOFISICA: il diagramma di Jablonski con le costanti dei processi
     (fluorescenza, conversione interna, intersystem crossing,
     fosforescenza, quenching); rese quantiche e tempi di vita; la retta di
     Stern-Volmer F₀/F = 1 + K_SV[Q] dai dati, con k_q confrontata con il
     limite diffusivo.
   · ADSORBIMENTO: Langmuir, Freundlich e BET, ciascuna nella sua forma
     linearizzata; dalla BET la capacita' del monostrato e l'area
     superficiale specifica (N₂, 0,162 nm² per molecola).
   · POLIMERI: le medie Mn, Mw, Mz e la dispersita' da una distribuzione;
     la polimerizzazione a stadi di Carothers (Xn = 1/(1 − p), Đ = 1 + p)
     con la distribuzione di Flory; la catena ideale: ⟨r²⟩ = C∞ n l²,
     R_g² = ⟨r²⟩/6.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, NA = 6.02214076e23;
  function retta(x, y) {
    var n = x.length, mx = 0, my = 0; for (var i = 0; i < n; i++) { mx += x[i]; my += y[i]; } mx /= n; my /= n;
    var sxx = 0, sxy = 0, syy = 0; for (i = 0; i < n; i++) { sxx += (x[i] - mx) * (x[i] - mx); sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) * (y[i] - my); }
    var m = sxy / sxx; return { m: m, q: my - m * mx, r2: sxy * sxy / (sxx * syy) };
  }
  function leggiCoppie(s) { return s.replace(/,/g, '.').split(/\n/).map(function (l) { return l.trim().split(/[\s;]+/).map(Number); }).filter(function (p) { return p.length >= 2 && isFinite(p[0]) && isFinite(p[1]); }); }
  function areaDati(val, et, righe) { var a = F.el('textarea', { rows: righe || 7, 'aria-label': et, style: 'width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px;font-family:var(--font-mono,monospace);font-size:.82rem' }); a.value = val; return a; }
  function griglia(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }

  /* ── fotofisica ───────────────────────────────────────────────────────── */
  function fotofisica(k) {
    var kS = k.kf + k.kic + k.kisc + k.kq * k.Q, kT = k.kp + k.knrT;
    return { tauS: 1 / kS, phiF: k.kf / kS, phiIC: k.kic / kS, phiISC: k.kisc / kS, phiQ: k.kq * k.Q / kS, tauT: 1 / kT, phiP: k.kisc / kS * k.kp / kT, tau0: 1 / (k.kf + k.kic + k.kisc) };
  }
  function sternVolmer(dati, tau0) {
    var r = retta(dati.map(function (p) { return p[0]; }), dati.map(function (p) { return p[1]; }));
    return { Ksv: r.m, intercetta: r.q, kq: r.m / tau0, r2: r.r2 };
  }
  function schedaJablonski(div) {
    var G = griglia(div), k = { kf: 1e8, kic: 2e7, kisc: 5e7, kq: 1e10, Q: 0, kp: 1e2, knrT: 1e3 };
    [['kf', 'log k_f (s⁻¹)', 5, 10, 8], ['kic', 'log k_IC (s⁻¹)', 4, 10, 7.3], ['kisc', 'log k_ISC (s⁻¹)', 4, 10, 7.7], ['kp', 'log k_P (s⁻¹)', -1, 5, 2], ['knrT', 'log k_nr,T (s⁻¹)', -1, 7, 3]].forEach(function (q) {
      F.cursore(G.pan, [q[1], q[1]], q[2], q[3], 0.1, q[4], function (v) { k[q[0]] = Math.pow(10, v); disegna(); }, function (v) { return v.toFixed(1); });
    });
    F.cursore(G.pan, ['[Q] quencher (mM)', '[Q] quencher (mM)'], 0, 50, 0.5, 0, function (v) { k.Q = v / 1000; disegna(); }, function (v) { return v.toFixed(1); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); G.pan.appendChild(info);
    var c = F.tela(G.dx, 0.62);
    function disegna() {
      var r = fotofisica(k);
      var P = F.grafico(c, { serie: [], xmin: 0, xmax: 1, ymin: 0, ymax: 1 }), q = P.q, W = P.W, H = P.H;
      q.clearRect(0, 0, W, H); q.fillStyle = '#081522'; q.fillRect(0, 0, W, H);
      var y = function (e) { return H - 30 - e * (H - 60); }, L = [['S₀', 0.08, 0, 0.42], ['S₁', 0.08, 0.62, 0.42], ['S₂', 0.08, 0.9, 0.42], ['T₁', 0.58, 0.48, 0.92]];
      q.lineWidth = 2.5; q.font = 'bold 14px system-ui';
      L.forEach(function (l) {
        q.strokeStyle = '#c9d3df'; q.beginPath(); q.moveTo(l[1] * W, y(l[2])); q.lineTo(l[3] * W, y(l[2])); q.stroke();
        q.strokeStyle = 'rgba(201,211,223,.25)'; q.lineWidth = 1; for (var v = 1; v <= 3; v++) { q.beginPath(); q.moveTo(l[1] * W, y(l[2] + v * 0.035)); q.lineTo(l[3] * W, y(l[2] + v * 0.035)); q.stroke(); } q.lineWidth = 2.5;
        q.fillStyle = '#e6fffb'; q.fillText(l[0], (l[1] * W) - 28, y(l[2]) + 5);
      });
      function freccia(x1, e1, x2, e2, col, ondulata, et, spess) {
        var X1 = x1 * W, Y1 = y(e1), X2 = x2 * W, Y2 = y(e2);
        q.strokeStyle = col; q.fillStyle = col; q.lineWidth = spess; q.beginPath();
        if (ondulata) { var n = 40; for (var i = 0; i <= n; i++) { var u = i / n, px = X1 + (X2 - X1) * u, py = Y1 + (Y2 - Y1) * u, nx = -(Y2 - Y1), ny = X2 - X1, l = Math.hypot(nx, ny), a = Math.sin(u * 30) * 5; px += nx / l * a; py += ny / l * a; if (i) q.lineTo(px, py); else q.moveTo(px, py); } }
        else { q.moveTo(X1, Y1); q.lineTo(X2, Y2); }
        q.stroke(); var an = Math.atan2(Y2 - Y1, X2 - X1); q.beginPath(); q.moveTo(X2, Y2); q.lineTo(X2 - 10 * Math.cos(an - 0.4), Y2 - 10 * Math.sin(an - 0.4)); q.lineTo(X2 - 10 * Math.cos(an + 0.4), Y2 - 10 * Math.sin(an + 0.4)); q.closePath(); q.fill();
        if (et) { q.font = '12px system-ui'; q.fillText(et, (X1 + X2) / 2 + 6, (Y1 + Y2) / 2); }
      }
      function sp(phi) { return 1 + 5 * Math.sqrt(Math.max(0, phi)); }
      freccia(0.13, 0, 0.13, 0.9, '#7c6fff', false, t('assorbimento', 'absorption'), 2);
      freccia(0.18, 0.9, 0.18, 0.62, '#9fb1c6', true, 'IC', 1.5);
      freccia(0.26, 0.62, 0.26, 0, '#5eead4', false, 'Φ_F ' + r.phiF.toFixed(3), sp(r.phiF));
      freccia(0.36, 0.62, 0.36, 0, '#9fb1c6', true, 'IC ' + r.phiIC.toFixed(3), sp(r.phiIC));
      freccia(0.42, 0.62, 0.62, 0.48, '#ffd24a', true, 'ISC ' + r.phiISC.toFixed(3), sp(r.phiISC));
      freccia(0.72, 0.48, 0.38, 0.0, '#ff8a80', false, 'Φ_P ' + r.phiP.toExponential(1), sp(r.phiP * 10));
      c.setAttribute('aria-label', t('diagramma di Jablonski', 'Jablonski diagram'));
      info.innerHTML = 'τ_S = 1/Σk = <b class="bsiFX-num">' + (r.tauS * 1e9).toFixed(2) + ' ns</b> · Φ_F = <b class="bsiFX-num">' + r.phiF.toFixed(3) + '</b> · Φ_ISC = ' + r.phiISC.toFixed(3) + (k.Q ? ' · Φ_quench = ' + r.phiQ.toFixed(3) : '') +
        '<br>τ_T = ' + (r.tauT * 1000).toPrecision(3) + ' ms · Φ_P = ' + r.phiP.toExponential(2) +
        '<br>' + t('La somma delle rese da S₁ è 1. La fosforescenza (T₁ → S₀) è proibita di spin: costante piccola, vita lunga, facilmente spenta dall’O₂. Stern-Volmer: F₀/F = 1 + k_q τ₀ [Q] = ', 'The yields from S₁ add up to 1. Phosphorescence (T₁ → S₀) is spin-forbidden: small constant, long lifetime, easily quenched by O₂. Stern-Volmer: F₀/F = 1 + k_q τ₀ [Q] = ') + (1 + k.kq * r.tau0 * k.Q).toFixed(3);
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaStern(div) {
    var G = griglia(div);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('[Q] (M) e F₀/F per riga; τ₀ in ns:', '[Q] (M) and F₀/F per line; τ₀ in ns:') }));
    var ta = areaDati('0 1.00\n0.002 1.21\n0.004 1.40\n0.006 1.62\n0.008 1.81\n0.010 2.02', 'dati'); G.pan.appendChild(ta);
    var tau = F.el('input', { type: 'text', value: '10', 'aria-label': 'τ₀' }); G.pan.appendChild(tau);
    F.bottone(G.pan, ['Retta di Stern-Volmer', 'Stern-Volmer plot'], calcola);
    var out = F.el('div', { 'class': 'bsiFX-nota' }); G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.6);
    function calcola() {
      var d = leggiCoppie(ta.value), t0 = +tau.value.replace(',', '.') * 1e-9, r = sternVolmer(d, t0);
      out.innerHTML = 'K_SV = <b>' + r.Ksv.toFixed(1) + ' M⁻¹</b> (' + t('intercetta ', 'intercept ') + r.intercetta.toFixed(3) + t(', deve essere 1', ', should be 1') + ') · R² = ' + r.r2.toFixed(4) + '<br>k_q = K_SV/τ₀ = <b>' + r.kq.toExponential(2) + ' M⁻¹s⁻¹</b><br>' +
        (r.kq > 2e10 ? t('Più del limite diffusivo (~10¹⁰ in acqua): c’è anche quenching statico (complesso al buio).', 'Above the diffusion limit (~10¹⁰ in water): static quenching (a ground-state complex) is also present.') : r.kq > 1e9 ? t('Vicino al limite diffusivo: quasi ogni incontro spegne.', 'Close to the diffusion limit: almost every encounter quenches.') : t('Ben sotto il limite diffusivo: solo una parte degli incontri spegne.', 'Well below the diffusion limit: only some encounters quench.'));
      var xs = d.map(function (p) { return p[0]; }), mx = Math.max.apply(null, xs);
      F.grafico(c, { punti: d.map(function (p) { return { x: p[0] * 1000, y: p[1], col: '#ffd24a', r: 5 }; }), serie: [{ x: [0, mx * 1000], y: [r.intercetta, r.intercetta + r.Ksv * mx], col: '#5eead4' }], xl: '[Q] (mM)', yl: 'F₀/F' });
    }
    calcola(); F.alRidimensiona(calcola);
  }

  /* ── adsorbimento ─────────────────────────────────────────────────────── */
  function langmuir(dati) { var r = retta(dati.map(function (p) { return p[0]; }), dati.map(function (p) { return p[0] / p[1]; })); var nm = 1 / r.m; return { nm: nm, K: r.m / r.q, r2: r.r2 }; }
  function freundlich(dati) { var r = retta(dati.map(function (p) { return Math.log10(p[0]); }), dati.map(function (p) { return Math.log10(p[1]); })); return { k: Math.pow(10, r.q), invn: r.m, r2: r.r2 }; }
  function bet(dati, sigma) {
    var d = dati.filter(function (p) { return p[0] >= 0.05 && p[0] <= 0.35; });
    var r = retta(d.map(function (p) { return p[0]; }), d.map(function (p) { return p[0] / (p[1] * (1 - p[0])); }));
    var nm = 1 / (r.m + r.q), c = 1 + r.m / r.q;
    return { nm: nm, c: c, area: nm * 1e-3 * NA * (sigma || 0.162e-18), r2: r.r2, usati: d.length };
  }
  function schedaAdsorbimento(div) {
    var G = griglia(div), tipo = 'bet';
    var ESEMPI = { bet: '0.05 0.885\n0.10 1.019\n0.15 1.113\n0.20 1.202\n0.25 1.294\n0.30 1.396\n0.35 1.510\n0.50 1.980\n0.70 3.319', lang: '5 0.320\n10 0.533\n20 0.800\n40 1.067\n80 1.280\n160 1.422', freu: '5 0.40\n10 0.56\n20 0.79\n40 1.12\n80 1.58\n160 2.24' };
    F.scelta(G.pan, ['Isoterma', 'Isotherm'], [['bet', ['BET (N₂ a 77 K): x = P/P₀, n in mmol/g', 'BET (N₂ at 77 K): x = P/P₀, n in mmol/g']], ['lang', ['Langmuir: P (kPa), n (mmol/g)', 'Langmuir: P (kPa), n (mmol/g)']], ['freu', ['Freundlich: C, q', 'Freundlich: C, q']]], tipo, function (v) { tipo = v; ta.value = ESEMPI[v]; calcola(); });
    var ta = areaDati(ESEMPI.bet, 'dati', 9); G.pan.appendChild(ta);
    F.bottone(G.pan, ['Analizza', 'Analyse'], calcola);
    var out = F.el('div', { 'class': 'bsiFX-nota' }); G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.5), c2 = F.tela(G.dx, 0.4);
    function calcola() {
      var d = leggiCoppie(ta.value); if (d.length < 3) return;
      var xs = d.map(function (p) { return p[0]; }), mx = Math.max.apply(null, xs), mod = [], lin = null;
      if (tipo === 'bet') {
        var r = bet(d);
        out.innerHTML = t('Retta BET su 0,05 ≤ P/P₀ ≤ 0,35 (', 'BET line over 0.05 ≤ P/P₀ ≤ 0.35 (') + r.usati + t(' punti)', ' points)') + ': x/[n(1−x)] = 1/(n_m c) + (c−1)x/(n_m c)<br>n_m = <b>' + r.nm.toFixed(3) + ' mmol/g</b> · c = <b>' + r.c.toFixed(1) + '</b> · R² = ' + r.r2.toFixed(4) +
          '<br>' + t('Area specifica', 'Specific surface area') + ' = n_m·N_A·σ(N₂ 0,162 nm²) = <b>' + r.area.toFixed(0) + ' m²/g</b><br>' + t('Fuori dall’intervallo la BET non vale: sotto, siti forti; sopra, condensazione capillare.', 'Outside the range BET fails: below, strong sites; above, capillary condensation.');
        for (var i = 0; i <= 100; i++) { var x = 0.01 + 0.84 * i / 100; mod.push([x, r.nm * r.c * x / ((1 - x) * (1 + (r.c - 1) * x))]); }
        var sel = d.filter(function (p) { return p[0] >= 0.05 && p[0] <= 0.35; });
        lin = { punti: sel.map(function (p) { return { x: p[0], y: p[0] / (p[1] * (1 - p[0])), col: '#ffd24a', r: 4 }; }), xl: 'P/P₀', yl: 'x/[n(1−x)]' };
      } else if (tipo === 'lang') {
        var l = langmuir(d);
        out.innerHTML = 'P/n = 1/(n_m K) + P/n_m → n_m = <b>' + l.nm.toFixed(3) + ' mmol/g</b>, K = <b>' + l.K.toFixed(4) + ' kPa⁻¹</b> · R² = ' + l.r2.toFixed(5) + '<br>θ = KP/(1 + KP): ' + t('un solo strato, siti equivalenti e indipendenti.', 'a single layer, equivalent and independent sites.');
        for (i = 0; i <= 100; i++) { var P = mx * 1.1 * i / 100; mod.push([P, l.nm * l.K * P / (1 + l.K * P)]); }
        lin = { punti: d.map(function (p) { return { x: p[0], y: p[0] / p[1], col: '#ffd24a', r: 4 }; }), xl: 'P', yl: 'P/n' };
      } else {
        var f = freundlich(d);
        out.innerHTML = 'log q = log k + (1/n) log C → k = <b>' + f.k.toFixed(3) + '</b>, 1/n = <b>' + f.invn.toFixed(3) + '</b> · R² = ' + f.r2.toFixed(5) + '<br>' + t('Empirica, per superfici eterogenee; 1/n < 1 vuol dire adsorbimento favorevole.', 'Empirical, for heterogeneous surfaces; 1/n < 1 means favourable adsorption.');
        for (i = 1; i <= 100; i++) { var C = mx * 1.1 * i / 100; mod.push([C, f.k * Math.pow(C, f.invn)]); }
        lin = { punti: d.map(function (p) { return { x: Math.log10(p[0]), y: Math.log10(p[1]), col: '#ffd24a', r: 4 }; }), xl: 'log C', yl: 'log q' };
      }
      F.grafico(c, { punti: d.map(function (p) { return { x: p[0], y: p[1], col: '#ffd24a', r: 4 }; }), serie: [{ x: mod.map(function (p) { return p[0]; }), y: mod.map(function (p) { return p[1]; }), col: '#5eead4' }], ymin: 0, xl: tipo === 'bet' ? 'P/P₀' : tipo === 'lang' ? 'P (kPa)' : 'C', yl: 'n' });
      F.grafico(c2, lin);
    }
    calcola(); F.alRidimensiona(calcola);
  }

  /* ── polimeri ─────────────────────────────────────────────────────────── */
  function medie(dist) {
    var s0 = 0, s1 = 0, s2 = 0, s3 = 0;
    dist.forEach(function (p) { var M = p[0], N = p[1]; s0 += N; s1 += N * M; s2 += N * M * M; s3 += N * M * M * M; });
    return { Mn: s1 / s0, Mw: s2 / s1, Mz: s3 / s2, D: (s2 / s1) / (s1 / s0) };
  }
  function carothers(p) { return { Xn: 1 / (1 - p), Xw: (1 + p) / (1 - p), D: 1 + p }; }
  function catena(M, M0, l, Cinf, legamiPerUnita) {
    var n = M / M0 * (legamiPerUnita || 2), r2 = Cinf * n * l * l;
    return { n: n, r: Math.sqrt(r2), Rg: Math.sqrt(r2 / 6), Rmax: n * l * 0.83 };
  }
  function schedaPolimeri(div) {
    var G = griglia(div), p = 0.99;
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Distribuzione: M (g/mol) e numero di catene per riga:', 'Distribution: M (g/mol) and number of chains per line:') }));
    var ta = areaDati('10000 1\n20000 3\n30000 4\n40000 2\n50000 1', 'distribuzione', 6); G.pan.appendChild(ta);
    var out = F.el('div', { 'class': 'bsiFX-nota' }); G.pan.appendChild(out);
    F.bottone(G.pan, ['Calcola le medie', 'Compute the averages'], calcola);
    F.cursore(G.pan, ['Carothers: conversione p', 'Carothers: conversion p'], 0.5, 0.999, 0.001, p, function (v) { p = v; calcola(); }, function (v) { return v.toFixed(3); });
    var out2 = F.el('div', { 'class': 'bsiFX-nota' }); G.pan.appendChild(out2);
    var c = F.tela(G.dx, 0.55);
    function calcola() {
      var d = leggiCoppie(ta.value);
      if (d.length) { var m = medie(d); out.innerHTML = 'M_n = ΣN_iM_i/ΣN_i = <b>' + m.Mn.toFixed(0) + '</b> · M_w = ΣN_iM_i²/ΣN_iM_i = <b>' + m.Mw.toFixed(0) + '</b> · M_z = ' + m.Mz.toFixed(0) + '<br>Đ = M_w/M_n = <b>' + m.D.toFixed(3) + '</b> (1 = ' + t('monodisperso', 'monodisperse') + ')'; }
      var cr = carothers(p), ch = catena(cr.Xn * 100, 100, 0.154, 6.7, 2);
      out2.innerHTML = 'X̄_n = 1/(1 − p) = <b>' + cr.Xn.toFixed(1) + '</b> · X̄_w = (1 + p)/(1 − p) = ' + cr.Xw.toFixed(1) + ' · Đ = 1 + p = ' + cr.D.toFixed(3) +
        '<br>' + t('Per avere catene lunghe a stadi servono conversioni altissime: al 99 % solo 100 unità.', 'Step growth needs very high conversion for long chains: at 99 % only 100 units.') +
        '<br>' + t('Catena ideale (polietilene, l = 0,154 nm, C∞ = 6,7) con X̄_n unità da 2 legami: ', 'Ideal chain (polyethylene, l = 0.154 nm, C∞ = 6.7) of X̄_n two-bond units: ') + '√⟨r²⟩ = ' + ch.r.toFixed(2) + ' nm, R_g = ' + ch.Rg.toFixed(2) + ' nm ' + t('contro ', 'versus ') + ch.Rmax.toFixed(1) + t(' nm tutta tesa', ' nm fully stretched');
      var xs = [], ys = [], wy = [];
      for (var x = 1; x <= Math.min(2000, cr.Xn * 6); x++) { xs.push(x); ys.push((1 - p) * Math.pow(p, x - 1)); wy.push(x * Math.pow(1 - p, 2) * Math.pow(p, x - 1)); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4' }, { x: xs, y: wy, col: '#ffd24a' }], ymin: 0, xl: t('grado di polimerizzazione x', 'degree of polymerisation x'), yl: t('frazione', 'fraction'), legenda: [{ col: '#5eead4', etich: t('in numero', 'number fraction') }, { col: '#ffd24a', etich: t('in peso', 'weight fraction') }] });
    }
    calcola(); F.alRidimensiona(calcola);
  }

  F.calcolo.superfici = { fotofisica: fotofisica, sternVolmer: sternVolmer, langmuir: langmuir, freundlich: freundlich, bet: bet, medie: medie, carothers: carothers, catena: catena };

  F.sezione('sfotosup', {
    titolo: ['🌟 Fotochimica, superfici e polimeri', '🌟 Photochemistry, surfaces and polymers'],
    sotto: ['Il diagramma di Jablonski con rese quantiche e tempi di vita, la retta di Stern-Volmer; le isoterme di Langmuir, Freundlich e BET con l’area superficiale; le masse medie dei polimeri, Carothers e la catena ideale.',
            'The Jablonski diagram with quantum yields and lifetimes, the Stern-Volmer plot; Langmuir, Freundlich and BET isotherms with surface area; polymer average masses, Carothers and the ideal chain.'],
    schede: [
      { nome: ['Jablonski', 'Jablonski'], costruisci: schedaJablonski },
      { nome: ['Stern-Volmer', 'Stern-Volmer'], costruisci: schedaStern },
      { nome: ['Adsorbimento', 'Adsorption'], costruisci: schedaAdsorbimento },
      { nome: ['Polimeri', 'Polymers'], costruisci: schedaPolimeri }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
