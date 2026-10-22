/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-matematica.js — la matematica per la chimica
   BioSpecInfo · © Samuele Pio Provenzano

   Quattro strumenti, ognuno con un problema chimico vero dietro:

   · LA TRASFORMATA DI FOURIER: un FID (il segnale che misura uno
     spettrometro NMR) costruito da righe note, con rumore, apodizzazione
     esponenziale e riempimento di zeri; la FFT radix-2 di Cooley-Tukey lo
     trasforma nello spettro. Si vede perche' una riga larga e' un segnale
     che muore presto, e perche' piu' scansioni migliorano il rapporto
     segnale/rumore come √n.
   · HÜCKEL: la matrice di adiacenza del sistema π, i suoi autovalori (Jacobi)
     sono i livelli E = α + xβ; ne vengono l'energia di delocalizzazione, le
     cariche e gli ordini di legame π. Con gli eteroatomi (parametri di
     Streitwieser: h_N = 0,5, k_CN = 1).
   · LE CINETICHE: le equazioni differenziali dei meccanismi integrate con
     RUNGE-KUTTA del quarto ordine, confrontate con la soluzione esatta dove
     c'e' (consecutive A → B → C), e i sistemi che una soluzione chiusa non
     l'hanno (il Bruxellatore, che oscilla).
   · I MINIMI QUADRATI: la retta di Arrhenius con gli errori dei parametri,
     dai dati che si incollano.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;

  /* ── FFT radix-2 (Cooley-Tukey, in loco) ──────────────────────────────── */
  function fft(re, im) {
    var n = re.length, i, j = 0, k;
    for (i = 1; i < n; i++) { var bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { var tr = re[i]; re[i] = re[j]; re[j] = tr; var ti = im[i]; im[i] = im[j]; im[j] = ti; } }
    for (var len = 2; len <= n; len <<= 1) {
      var ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          var ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k + len / 2] = re[i + k] - ar; im[i + k + len / 2] = im[i + k] - ai;
          re[i + k] += ar; im[i + k] += ai;
          var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }
  /* il FID: somma di sinusoidi smorzate campionate a passo dt, rumore gaussiano */
  function fid(righe, n, dt, rumore, seme) {
    var re = new Float64Array(n), im = new Float64Array(n), s = seme || 99, rnd = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    var gauss = function () { var u = Math.max(1e-12, rnd()), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    for (var i = 0; i < n; i++) {
      var tt = i * dt;
      righe.forEach(function (r) { var a = r.A * Math.exp(-tt / r.T2); re[i] += a * Math.cos(2 * Math.PI * r.f * tt); im[i] += a * Math.sin(2 * Math.PI * r.f * tt); });
      re[i] += rumore * gauss(); im[i] += rumore * gauss();
    }
    return { re: re, im: im };
  }
  function spettro(F0, dt, lb, zf) {
    var n = F0.re.length, N = n * (zf || 1), re = new Float64Array(N), im = new Float64Array(N);
    for (var i = 0; i < n; i++) { var w = Math.exp(-Math.PI * lb * i * dt); re[i] = F0.re[i] * w; im[i] = F0.im[i] * w; }
    re[0] *= 0.5; im[0] *= 0.5;
    fft(re, im);
    var f = [], y = [];
    /* frequenze da −1/2dt a +1/2dt: si riordina */
    for (var k = 0; k < N; k++) { var kk = (k + N / 2) % N; f.push((k - N / 2) / (N * dt)); y.push(re[kk] * dt); }
    return { f: f, y: y };
  }

  /* ── Hückel ───────────────────────────────────────────────────────────── */
  function jacobi(M) { return F.calcolo.hartreefock ? F.calcolo.hartreefock.jacobi(M) : jacobiLocale(M); }
  function jacobiLocale(M) {
    var n = M.length, A = M.map(function (r) { return r.slice(); }), V = [];
    for (var i = 0; i < n; i++) { V.push(new Array(n).fill(0)); V[i][i] = 1; }
    for (var sw = 0; sw < 100; sw++) {
      var off = 0; for (var p = 0; p < n; p++) for (var q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
      if (off < 1e-26) break;
      for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        var th = (A[q][q] - A[p][p]) / (2 * A[p][q]), tg = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(tg * tg + 1), s = tg * c;
        for (var k = 0; k < n; k++) { var a1 = A[k][p], a2 = A[k][q]; A[k][p] = c * a1 - s * a2; A[k][q] = s * a1 + c * a2; }
        for (k = 0; k < n; k++) { var b1 = A[p][k], b2 = A[q][k]; A[p][k] = c * b1 - s * b2; A[q][k] = s * b1 + c * b2; }
        for (k = 0; k < n; k++) { var v1 = V[k][p], v2 = V[k][q]; V[k][p] = c * v1 - s * v2; V[k][q] = s * v1 + c * v2; }
      }
    }
    var val = A.map(function (r, i) { return r[i]; }), ord = val.map(function (v, i) { return i; }).sort(function (x, y) { return val[x] - val[y]; });
    return { val: ord.map(function (i) { return val[i]; }), vec: V.map(function (r) { return ord.map(function (i) { return r[i]; }); }) };
  }
  /* i sistemi π: atomi (h = parametro di Coulomb relativo, elettroni π dati) e legami */
  var PI = {
    etilene: { nome: ['Etilene', 'Ethylene'], n: 2, legami: [[0, 1]], el: 2, rif: 2 },
    allile: { nome: ['Allile (catione)', 'Allyl (cation)'], n: 3, legami: [[0, 1], [1, 2]], el: 2 },
    butadiene: { nome: ['1,3-Butadiene', '1,3-Butadiene'], n: 4, legami: [[0, 1], [1, 2], [2, 3]], el: 4, rif: 2 * 2 },
    ciclobutadiene: { nome: ['Ciclobutadiene', 'Cyclobutadiene'], n: 4, legami: [[0, 1], [1, 2], [2, 3], [3, 0]], el: 4, rif: 2 * 2 },
    cp: { nome: ['Ciclopentadienile (anione)', 'Cyclopentadienyl (anion)'], n: 5, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], el: 6, rif: 2 * 2 },   /* due doppi legami localizzati e il doppietto: 4β */
    benzene: { nome: ['Benzene', 'Benzene'], n: 6, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]], el: 6, rif: 3 * 2 },
    tropilio: { nome: ['Tropilio (catione)', 'Tropylium (cation)'], n: 7, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]], el: 6, rif: 3 * 2 },
    esatriene: { nome: ['1,3,5-Esatriene', '1,3,5-Hexatriene'], n: 6, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], el: 6, rif: 3 * 2 },
    naftalene: { nome: ['Naftalene', 'Naphthalene'], n: 10, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 9], [9, 0], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]], el: 10, rif: 5 * 2 },
    piridina: { nome: ['Piridina', 'Pyridine'], n: 6, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]], el: 6, h: { 0: 0.5 } },
    pirrolo: { nome: ['Pirrolo', 'Pyrrole'], n: 5, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], el: 6, h: { 0: 1.5 }, k: { '0-1': 0.8, '0-4': 0.8 } },
    fulvene: { nome: ['Fulvene', 'Fulvene'], n: 6, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5]], el: 6 }
  };
  /* E = α + xβ con β < 0: la matrice in unita' di β e' A (adiacenza) + h; i livelli
     piu' bassi hanno x piu' grande. Si diagonalizza −M e si ordina */
  function huckel(sis) {
    var n = sis.n, M = [];
    for (var i = 0; i < n; i++) M.push(new Array(n).fill(0));
    if (sis.h) Object.keys(sis.h).forEach(function (k) { M[+k][+k] = sis.h[k]; });
    sis.legami.forEach(function (l) { var kk = (sis.k && (sis.k[l[0] + '-' + l[1]] || sis.k[l[1] + '-' + l[0]])) || 1; M[l[0]][l[1]] = M[l[1]][l[0]] = kk; });
    var neg = M.map(function (r) { return r.map(function (v) { return -v; }); }), e = jacobi(neg);
    var x = e.val.map(function (v) { return -v; }), C = e.vec;
    /* occupazione dal basso (x grande), due elettroni per livello */
    var occ = new Array(n).fill(0), rest = sis.el, k = 0;
    while (rest > 0 && k < n) {
      var deg = 1; while (k + deg < n && Math.abs(x[k + deg] - x[k]) < 1e-8) deg++;
      var dentro = Math.min(rest, 2 * deg); for (var d = 0; d < deg; d++) occ[k + d] = dentro / deg;
      rest -= dentro; k += deg;
    }
    var Epi = 0; for (i = 0; i < n; i++) Epi += occ[i] * x[i];
    var q = [], p = {};
    for (i = 0; i < n; i++) { var s = 0; for (k = 0; k < n; k++) s += occ[k] * C[i][k] * C[i][k]; q.push(s); }
    sis.legami.forEach(function (l) { var s2 = 0; for (var kk = 0; kk < n; kk++) s2 += occ[kk] * C[l[0]][kk] * C[l[1]][kk]; p[l[0] + '-' + l[1]] = s2; });
    return { x: x, C: C, occ: occ, Epi: Epi, deloc: sis.rif != null ? Epi - sis.rif : null, carica: q, ordini: p };
  }

  /* ── Runge-Kutta del quarto ordine ─────────────────────────────────────── */
  function rk4(f, y0, t0, t1, n) {
    var h = (t1 - t0) / n, y = y0.slice(), ts = [t0], ys = [y0.slice()], m = y.length;
    for (var i = 0; i < n; i++) {
      var tt = t0 + i * h, k1 = f(tt, y), y2 = y.map(function (v, j) { return v + h / 2 * k1[j]; }), k2 = f(tt + h / 2, y2),
          y3 = y.map(function (v, j) { return v + h / 2 * k2[j]; }), k3 = f(tt + h / 2, y3), y4 = y.map(function (v, j) { return v + h * k3[j]; }), k4 = f(tt + h, y4);
      for (var j = 0; j < m; j++) y[j] += h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
      ts.push(tt + h); ys.push(y.slice());
    }
    return { t: ts, y: ys };
  }
  function consecutiveEsatta(k1, k2, A0, tt) {
    var A = A0 * Math.exp(-k1 * tt), B = A0 * k1 / (k2 - k1) * (Math.exp(-k1 * tt) - Math.exp(-k2 * tt));
    return [A, B, A0 - A - B];
  }
  /* ── minimi quadrati con gli errori ───────────────────────────────────── */
  function retta(x, y) {
    var n = x.length, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
    for (var i = 0; i < n; i++) { sx += x[i]; sy += y[i]; sxx += x[i] * x[i]; sxy += x[i] * y[i]; syy += y[i] * y[i]; }
    var D = n * sxx - sx * sx, m = (n * sxy - sx * sy) / D, q = (sy - m * sx) / n, ss = 0;
    for (i = 0; i < n; i++) { var r = y[i] - (m * x[i] + q); ss += r * r; }
    var s2 = n > 2 ? ss / (n - 2) : 0, sm = Math.sqrt(n * s2 / D), sq = Math.sqrt(s2 * sxx / D);
    var st = syy - sy * sy / n;
    return { m: m, q: q, sm: sm, sq: sq, R2: st > 0 ? 1 - ss / st : 1 };
  }
  F.calcolo.matematica = { fft: fft, fid: fid, spettro: spettro, huckel: huckel, PI: PI, rk4: rk4, consecutiveEsatta: consecutiveEsatta, retta: retta };

  /* ── l'interfaccia ────────────────────────────────────────────────────── */
  function schedaFourier(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var T2 = 0.25, lb = 0, rumore = 0.3, scan = 1, zf = 2;
    var righe = function () { return [{ f: 120, A: 1, T2: T2 }, { f: 127, A: 1, T2: T2 }, { f: -85, A: 3, T2: T2 }, { f: -300, A: 1.5, T2: T2 * 0.6 }]; };
    F.cursore(pan, ['T₂ (s): quanto dura il segnale', 'T₂ (s): how long the signal lasts'], 0.02, 1, 0.01, T2, function (v) { T2 = v; disegna(); });
    F.cursore(pan, ['Allargamento esponenziale LB (Hz)', 'Exponential line broadening LB (Hz)'], 0, 10, 0.2, lb, function (v) { lb = v; disegna(); });
    F.cursore(pan, ['Rumore', 'Noise'], 0, 1.5, 0.05, rumore, function (v) { rumore = v; disegna(); });
    F.cursore(pan, ['Scansioni accumulate', 'Accumulated scans'], 1, 256, 1, scan, function (v) { scan = v; disegna(); });
    F.scelta(pan, ['Riempimento di zeri', 'Zero filling'], [['1', '×1'], ['2', '×2'], ['4', '×4']], '2', function (v) { zf = +v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c1 = F.tela(destra, 0.32), c2 = F.tela(destra, 0.45);
    function disegna() {
      var n = 1024, dt = 1 / 1000, Fd = fid(righe(), n, dt, rumore / Math.sqrt(scan), 7), ts = [], ys = [];
      for (var i = 0; i < n; i += 2) { ts.push(i * dt); ys.push(Fd.re[i] * Math.exp(-Math.PI * lb * i * dt)); }
      F.grafico(c1, { serie: [{ x: ts, y: ys, col: '#7c6fff', larg: 1.2 }], xl: ['tempo (s)', 'time (s)'], yl: ['FID (parte reale)', 'FID (real part)'] });
      var sp = spettro(Fd, dt, lb, zf);
      F.grafico(c2, { serie: [{ x: sp.f, y: sp.y, col: '#5eead4', larg: 1.4 }], xmin: -500, xmax: 500, invertiX: true, xl: ['frequenza (Hz)', 'frequency (Hz)'], yl: ['spettro', 'spectrum'] });
      var larg = 1 / (Math.PI * T2) + lb;
      info.innerHTML = t('Larghezza di riga a metà altezza', 'Linewidth at half height') + ' = 1/(πT₂) + LB = <b class="bsiFX-num">' + larg.toFixed(2) + ' Hz</b><br>' +
        t('Il doppietto a 120 e 127 Hz si separa solo se la larghezza resta sotto i 7 Hz.', 'The doublet at 120 and 127 Hz splits only if the width stays below 7 Hz.') + '<br>' +
        t('Rumore ridotto di √n: con ', 'Noise reduced by √n: with ') + scan + t(' scansioni, ', ' scans, ') + (1 / Math.sqrt(scan)).toFixed(3) + '×.';
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaHuckel(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var mol = 'benzene';
    F.scelta(pan, ['Sistema π', 'π system'], Object.keys(PI).map(function (k) { return [k, PI[k].nome]; }), mol, function (v) { mol = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.6), tab = F.el('div'); destra.appendChild(tab);
    function disegna() {
      var s = PI[mol], r = huckel(s);
      /* il diagramma dei livelli: x sull'asse verticale (α in 0), elettroni come punti */
      var P = c.getContext('2d'), dpr = Math.min(2, globale.devicePixelRatio || 1), W = Math.max(280, c.clientWidth || 500), H = Math.round(W * c._rapporto);
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); P.setTransform(dpr, 0, 0, dpr, 0, 0);
      P.fillStyle = '#081522'; P.fillRect(0, 0, W, H);
      var Y = function (x) { return H / 2 - x * (H * 0.2); };
      P.strokeStyle = '#34465f'; P.setLineDash([4, 4]); P.beginPath(); P.moveTo(40, Y(0)); P.lineTo(W - 10, Y(0)); P.stroke(); P.setLineDash([]);
      P.fillStyle = '#8494a8'; P.font = '12px system-ui'; P.fillText('α', 12, Y(0) + 4);
      [-2, -1, 1, 2].forEach(function (x) { P.fillText((x > 0 ? 'α+' : 'α') + (x > 0 ? x : x) + 'β', 4, Y(x) + 4); });
      var gruppi = [];
      r.x.forEach(function (x, k) { var gg = gruppi.filter(function (q) { return Math.abs(q.x - x) < 1e-6; })[0]; if (gg) gg.k.push(k); else gruppi.push({ x: x, k: [k] }); });
      gruppi.forEach(function (gg) {
        var n = gg.k.length, w = 70, gap = 18, tot = n * w + (n - 1) * gap, x0 = W / 2 - tot / 2;
        gg.k.forEach(function (k, i) {
          var xa = x0 + i * (w + gap), y = Y(gg.x);
          P.strokeStyle = '#5eead4'; P.lineWidth = 2.5; P.beginPath(); P.moveTo(xa, y); P.lineTo(xa + w, y); P.stroke();
          var e = r.occ[k]; P.fillStyle = '#ffd24a';
          if (e >= 0.5) { P.beginPath(); P.arc(xa + w / 2 - 8, y - 7, 4, 0, 6.3); P.fill(); }
          if (e >= 1.5) { P.beginPath(); P.arc(xa + w / 2 + 8, y - 7, 4, 0, 6.3); P.fill(); }
        });
        P.fillStyle = '#c9d3df'; P.fillText((gg.x >= 0 ? '+' : '') + gg.x.toFixed(3), x0 + tot + 10, Y(gg.x) + 4);
      });
      c.setAttribute('aria-label', t('diagramma dei livelli di Hückel', 'Hückel level diagram'));
      info.innerHTML = t('Energia π', 'π energy') + ' = ' + s.el + 'α + <b class="bsiFX-num">' + r.Epi.toFixed(4) + 'β</b><br>' +
        (r.deloc != null ? t('Energia di delocalizzazione', 'Delocalisation energy') + ' = <b class="bsiFX-num">' + r.deloc.toFixed(4) + 'β</b> (β ≈ −75 kJ/mol → ' + (-75 * r.deloc).toFixed(0) + ' kJ/mol)<br>' : '') +
        '<br>' + (mol === 'ciclobutadiene' ? t('Il ciclobutadiene ha due elettroni spaiati su due livelli degeneri a energia α: è antiaromatico (4n elettroni π), e la sua energia di delocalizzazione è zero.', 'Cyclobutadiene has two unpaired electrons on two degenerate levels at α: it is antiaromatic (4n π electrons), and its delocalisation energy is zero.') :
                  t('Regola di Hückel: un anello planare coniugato con 4n+2 elettroni π (benzene, Cp⁻, tropilio) riempie tutti i livelli leganti a guscio chiuso.', 'Hückel’s rule: a planar conjugated ring with 4n+2 π electrons (benzene, Cp⁻, tropylium) fills all bonding levels in a closed shell.'));
      var h = '<table class="bsiFX-tab"><tr><th>' + t('atomo', 'atom') + '</th><th>' + t('densità π', 'π density') + '</th></tr>';
      r.carica.forEach(function (q, i) { h += '<tr><td>' + (i + 1) + '</td><td class="bsiFX-num">' + q.toFixed(4) + '</td></tr>'; });
      h += '</table><table class="bsiFX-tab"><tr><th>' + t('legame', 'bond') + '</th><th>' + t('ordine π', 'π order') + '</th></tr>';
      Object.keys(r.ordini).forEach(function (k) { var a = k.split('-'); h += '<tr><td>' + (+a[0] + 1) + '–' + (+a[1] + 1) + '</td><td class="bsiFX-num">' + r.ordini[k].toFixed(4) + '</td></tr>'; });
      tab.innerHTML = h + '</table>';
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaCinetica(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var mec = 'consecutive', k1 = 1, k2 = 0.5, cont = F.el('div');
    F.scelta(pan, ['Meccanismo', 'Mechanism'], [['consecutive', ['A → B → C (consecutive)', 'A → B → C (consecutive)']], ['equilibrio', ['A ⇌ B (opposte)', 'A ⇌ B (opposing)']], ['enzima', ['E + S ⇌ ES → E + P (enzima)', 'E + S ⇌ ES → E + P (enzyme)']], ['bruxellatore', ['Bruxellatore (oscillante)', 'Brusselator (oscillating)']]], mec, function (v) { mec = v; disegna(); });
    F.cursore(pan, ['k₁', 'k₁'], 0.05, 5, 0.05, k1, function (v) { k1 = v; disegna(); });
    F.cursore(pan, ['k₂', 'k₂'], 0.05, 5, 0.05, k2, function (v) { k2 = v; disegna(); });
    pan.appendChild(cont);
    var c = F.tela(destra, 0.55);
    function disegna() {
      var COL = ['#5eead4', '#ffd24a', '#7c6fff', '#ff8a80'], r, nomi, tmax = 12, nota = '';
      if (mec === 'consecutive') {
        r = rk4(function (tt, y) { return [-k1 * y[0], k1 * y[0] - k2 * y[1], k2 * y[1]]; }, [1, 0, 0], 0, tmax, 600); nomi = ['A', 'B', 'C'];
        var ex = consecutiveEsatta(k1, k2, 1, tmax), err = Math.max.apply(null, r.y[r.y.length - 1].map(function (v, i) { return Math.abs(v - ex[i]); }));
        var tmaxB = Math.log(k2 / k1) / (k2 - k1);
        nota = t('Massimo di B a t = ln(k₂/k₁)/(k₂−k₁) = ', 'B peaks at t = ln(k₂/k₁)/(k₂−k₁) = ') + (isFinite(tmaxB) ? tmaxB.toFixed(3) : '1/k') + '<br>' + t('Scarto massimo RK4 dalla soluzione esatta: ', 'Largest RK4 deviation from the exact solution: ') + err.toExponential(2);
      } else if (mec === 'equilibrio') {
        r = rk4(function (tt, y) { return [-k1 * y[0] + k2 * y[1], k1 * y[0] - k2 * y[1]]; }, [1, 0], 0, tmax, 600); nomi = ['A', 'B'];
        nota = t('All’equilibrio [B]/[A] = k₁/k₂ = K = ', 'At equilibrium [B]/[A] = k₁/k₂ = K = ') + (k1 / k2).toFixed(3) + t('; si raggiunge con costante k₁ + k₂ = ', '; it is approached with rate constant k₁ + k₂ = ') + (k1 + k2).toFixed(3);
      } else if (mec === 'enzima') {
        var kc = k2, km1 = 1, E0 = 0.05;
        r = rk4(function (tt, y) { var v1 = 10 * k1 * y[0] * y[1], v2 = km1 * y[2], v3 = kc * y[2]; return [-v1 + v2 + v3, -v1 + v2, v1 - v2 - v3, v3]; }, [E0, 1, 0, 0], 0, tmax * 5, 1500); nomi = ['E', 'S', 'ES', 'P'];
        nota = 'K_M = (k₋₁ + k_cat)/k₁ = ' + ((km1 + kc) / (10 * k1)).toFixed(3) + ' · v_max = k_cat [E]₀ = ' + (kc * E0).toFixed(4) + '<br>' + t('Dopo un istante [ES] resta quasi costante: è l’approssimazione dello stato stazionario di Briggs-Haldane.', 'After an instant [ES] stays almost constant: it is the Briggs-Haldane steady-state approximation.');
      } else {
        var A = 1, B = 1.5 + k2;
        r = rk4(function (tt, y) { return [A - (B + 1) * y[0] + y[0] * y[0] * y[1], B * y[0] - y[0] * y[0] * y[1]]; }, [1, 1], 0, 40, 4000); nomi = ['X', 'Y'];
        nota = t('Il Bruxellatore oscilla quando B > 1 + A² (qui B = ', 'The Brusselator oscillates when B > 1 + A² (here B = ') + B.toFixed(2) + '): ' + t('è il modello delle reazioni oscillanti come la Belousov-Žabotinskij.', 'it is the model of oscillating reactions such as the Belousov-Zhabotinsky.');
      }
      var serie = nomi.map(function (nm, i) { return { x: r.t, y: r.y.map(function (v) { return v[i]; }), col: COL[i] }; });
      F.grafico(c, { serie: serie, ymin: 0, xl: ['tempo', 'time'], yl: ['concentrazione', 'concentration'], legenda: nomi.map(function (nm, i) { return { col: COL[i], etich: nm }; }) });
      cont.innerHTML = '<div class="bsiFX-nota">' + nota + '</div>';
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaFit(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Dati: una coppia T (K), k per riga. Esempio: decomposizione di N₂O₅.', 'Data: one T (K), k pair per line. Example: N₂O₅ decomposition.') }));
    var ta = F.el('textarea', { rows: 9, style: 'width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px;font-family:var(--font-mono,monospace);font-size:.82rem', 'aria-label': t('dati T e k', 'T and k data') });
    ta.value = '273 7.87e-7\n298 3.46e-5\n308 1.35e-4\n318 4.98e-4\n328 1.50e-3\n338 4.87e-3';
    pan.appendChild(ta);
    F.bottone(pan, ['Calcola il fit', 'Fit'], disegna);
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.55);
    function disegna() {
      var dati = ta.value.split(/\n/).map(function (l) { return l.trim().split(/[\s,;]+/).map(Number); }).filter(function (p) { return p.length >= 2 && p[0] > 0 && p[1] > 0; });
      if (dati.length < 3) { info.textContent = t('Servono almeno tre punti.', 'At least three points are needed.'); return; }
      var x = dati.map(function (p) { return 1 / p[0]; }), y = dati.map(function (p) { return Math.log(p[1]); }), r = retta(x, y), Ea = -r.m * 8.314462618 / 1000, sEa = r.sm * 8.314462618 / 1000;
      var xs = [Math.min.apply(null, x), Math.max.apply(null, x)];
      F.grafico(c, { punti: x.map(function (v, i) { return { x: v * 1000, y: y[i], col: '#ffd24a', r: 4 }; }), serie: [{ x: xs.map(function (v) { return v * 1000; }), y: xs.map(function (v) { return r.m * v + r.q; }), col: '#5eead4' }],
                     xl: ['1000 / T (K⁻¹)', '1000 / T (K⁻¹)'], yl: ['ln k', 'ln k'] });
      info.innerHTML = 'Eₐ = <b class="bsiFX-num">' + Ea.toFixed(1) + ' ± ' + sEa.toFixed(1) + ' kJ/mol</b><br>A = <b class="bsiFX-num">' + Math.exp(r.q).toExponential(3) + '</b> (ln A = ' + r.q.toFixed(2) + ' ± ' + r.sq.toFixed(2) + ')<br>R² = ' + r.R2.toFixed(5) +
        '<br><br>' + t('Gli errori sono gli scarti tipo dei parametri della regressione (n − 2 gradi di libertà).', 'The errors are the standard errors of the regression parameters (n − 2 degrees of freedom).');
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  F.sezione('smatchim', {
    titolo: ['∑ Matematica per la chimica', '∑ Mathematics for chemistry'],
    sotto: ['La trasformata di Fourier dal FID allo spettro, gli autovalori di Hückel, le equazioni differenziali delle cinetiche (Runge-Kutta), i minimi quadrati di Arrhenius con gli errori.',
            'The Fourier transform from FID to spectrum, Hückel eigenvalues, the differential equations of kinetics (Runge-Kutta), the Arrhenius least-squares fit with errors.'],
    schede: [
      { nome: ['Fourier: FID → spettro', 'Fourier: FID → spectrum'], costruisci: schedaFourier },
      { nome: ['Hückel', 'Hückel'], costruisci: schedaHuckel },
      { nome: ['Cinetiche (RK4)', 'Kinetics (RK4)'], costruisci: schedaCinetica },
      { nome: ['Minimi quadrati', 'Least squares'], costruisci: schedaFit }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
