/* ═══════════════════════════════════════════════════════════════════════════
   bsi-orbitali.js — 🔮 Laboratorio degli orbitali (fase 2 del progetto, §5.3 e §7.2)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v254)
   Lo standard del progetto per gli orbitali: un pannello di selezione pulito con
   quattro grafici collegati (distribuzione radiale, funzione d'onda radiale,
   parte angolare, nuvola) e un'animazione dell'orbitale scelto di livello alto:
   isosuperficie calcolata, fase complessa come colore, evoluzione nel tempo,
   sovrapposizioni che oscillano davvero, corrente di probabilità, nodi e
   spaccato. Tutto calcolato dalle soluzioni esatte.

   LA MATEMATICA (unità atomiche: distanze in a₀, energie in hartree dove non detto)
     ψ_nlm(r,θ,φ) = R_nl(r)·Y_l^m(θ,φ)
     R_nl(r) = N·e^(−ρ/2)·ρ^l·L_(n−l−1)^(2l+1)(ρ),   ρ = 2Zr/n,
               N = √[(2Z/n)³·(n−l−1)!/(2n·(n+l)!)]
     Y_l^m = K·P_l^m(cos θ)·e^(imφ),  K = √[(2l+1)/(4π)·(l−m)!/(l+m)!]  (Condon–Shortley)
     forme reali: m > 0 → √2·K·P·cos mφ (px, dxz…), m < 0 → √2·K·P·sin|m|φ (py, dxy…)
     E_n = −13,6057·Z²/n² eV,  ⟨r⟩ = [3n² − l(l+1)]/(2Z) a₀
     ψ(t) = ψ·e^(−iEt/ħ): in uno stato stazionario la densità è FERMA e ruota solo la fase
     sovrapposizione (ψ₁ e^(−iE₁t/ħ) + ψ₂ e^(−iE₂t/ħ))/√2: la densità oscilla con ν = (E₂ − E₁)/h
     corrente j = (ħ/mₑ)·Im(ψ*∇ψ): zero per gli orbitali reali, azimutale per m ≠ 0,
     velocità v_φ = ħm/(mₑ r sin θ)
     H₂⁺ (LCAO): σ = (1s_A ± 1s_B)/√(2(1 ± S)),  S(R) = e^(−R)(1 + R + R²/3)

   ONESTA'
   · Per Z > 1 gli orbitali sono idrogenoidi (un solo elettrone): per gli atomi
     a molti elettroni sono un'approssimazione, e lo si dice.
   · Le animazioni nel tempo sono rallentate di circa 10¹⁶ volte; quelle della
     corrente esagerano la velocità per renderla visibile. È scritto sulla figura.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI, HARTREE_EV = 27.211386, H_EV_S = 4.135667696e-15;

  /* ═══ 1. LA MATEMATICA ══════════════════════════════════════════════════ */
  var FATT = [1]; for (var q = 1; q < 30; q++) FATT.push(FATT[q - 1] * q);
  function laguerre(k, a, x) { if (k === 0) return 1; var L0 = 1, L1 = 1 + a - x; for (var i = 1; i < k; i++) { var L2 = ((2 * i + 1 + a - x) * L1 - (i + a) * L0) / (i + 1); L0 = L1; L1 = L2; } return L1; }
  function radiale(n, l, Z, r) { var rho = 2 * Z * r / n, N = Math.sqrt(Math.pow(2 * Z / n, 3) * FATT[n - l - 1] / (2 * n * FATT[n + l])); return N * Math.exp(-rho / 2) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho); }
  /** P_l^m(x) con la fase di Condon–Shortley, m ≥ 0. */
  function legendre(l, m, x) {
    var pmm = 1; if (m > 0) { var s = Math.sqrt(Math.max(0, (1 - x) * (1 + x))), f = 1; for (var i = 1; i <= m; i++) { pmm *= -f * s; f += 2; } }
    if (l === m) return pmm; var p1 = x * (2 * m + 1) * pmm; if (l === m + 1) return p1;
    var p2 = 0; for (var ll = m + 2; ll <= l; ll++) { p2 = ((2 * ll - 1) * x * p1 - (ll + m - 1) * pmm) / (ll - m); pmm = p1; p1 = p2; } return p2;
  }
  function Kn(l, m) { return Math.sqrt((2 * l + 1) / (4 * PI) * FATT[l - m] / FATT[l + m]); }
  /** Parte angolare: { re, im }. reale = forme cartesiane (px, dxy…), altrimenti le complesse di m. */
  function angolare(l, m, reale, th, ph) {
    var am = Math.abs(m), P = legendre(l, am, Math.cos(th)), K = Kn(l, am);
    if (reale) {
      if (m === 0) return { re: K * P, im: 0 };
      var segno = am % 2 ? -1 : 1;                                       /* toglie la fase di Condon–Shortley: px positivo verso +x */
      return { re: segno * Math.SQRT2 * K * P * (m > 0 ? Math.cos(am * ph) : Math.sin(am * ph)), im: 0 };
    }
    var v = K * P, f = m < 0 && am % 2 ? -1 : 1;                          /* Y_l^(−m) = (−1)^m · conj(Y_l^m) */
    return { re: f * v * Math.cos(m * ph), im: f * v * Math.sin(m * ph) };
  }
  function psi(o, x, y, z) {
    var r = Math.sqrt(x * x + y * y + z * z), th = r > 0 ? Math.acos(z / r) : 0, ph = Math.atan2(y, x), R = radiale(o.n, o.l, o.Z, r), A = angolare(o.l, o.m, o.reale, th, ph);
    return { re: R * A.re, im: R * A.im };
  }
  function energia(n, Z) { return -HARTREE_EV / 2 * Z * Z / (n * n); }
  function rMedio(n, l, Z) { return (3 * n * n - l * (l + 1)) / (2 * Z); }
  function rMax(n, Z) { return (n * n * 3 + 10) / Z; }                    /* fin dove disegnare */
  /** Distribuzione radiale P(r) = r²R²: massimo, nodi e normalizzazione numerica. */
  function radialeInfo(n, l, Z) {
    var R0 = rMax(n, Z) * 1.4, N = 6000, h = R0 / N, best = 0, rb = 0, norm = 0, nodi = [], prev = radiale(n, l, Z, h / 2);
    for (var i = 1; i <= N; i++) { var r = i * h, R = radiale(n, l, Z, r), P = r * r * R * R; norm += P * h; if (P > best) { best = P; rb = r; } if (R * prev < 0) nodi.push(+(r - h / 2).toFixed(3)); prev = R; }
    return { rPiuProbabile: rb, norma: norm, nodiRadiali: nodi };
  }
  var NOMI = { 1: { 0: 'pz', 1: 'px', '-1': 'py' }, 2: { 0: 'dz²', 1: 'dxz', '-1': 'dyz', 2: 'dx²−y²', '-2': 'dxy' }, 3: { 0: 'fz³', 1: 'fxz²', '-1': 'fyz²', 2: 'fz(x²−y²)', '-2': 'fxyz', 3: 'fx(x²−3y²)', '-3': 'fy(3x²−y²)' } };
  function nome(o) { var L = 'spdfgh'[o.l]; if (o.l === 0) return o.n + 's'; if (o.reale && o.l <= 3) return o.n + NOMI[o.l][o.m]; return o.n + L + ' (m = ' + (o.m > 0 ? '+' : o.m < 0 ? '−' : '') + Math.abs(o.m) + ')'; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  /** N punti distribuiti come |ψ|²: r dalla distribuzione radiale esatta (inversione della cumulata), gli angoli da |Y|² per rifiuto. */
  function campiona(o, N, seme) {
    var rnd = mulberry(seme || 7), R0 = rMax(o.n, o.Z) * 1.4, M = 4000, h = R0 / M, cdf = [0], s = 0;
    for (var i = 1; i <= M; i++) { var r = (i - 0.5) * h, R = radiale(o.n, o.l, o.Z, r); s += r * r * R * R * h; cdf.push(s); }
    var ymax = 0; for (var a = 0; a <= 60; a++) for (var b = 0; b < 60; b++) { var A = angolare(o.l, o.m, o.reale, a / 60 * PI, b / 60 * 2 * PI); ymax = Math.max(ymax, A.re * A.re + A.im * A.im); }
    var out = [];
    while (out.length < N) {
      var u = rnd() * s, lo = 0, hi = M; while (hi - lo > 1) { var md = (lo + hi) >> 1; if (cdf[md] < u) lo = md; else hi = md; } var rr = (lo + rnd()) * h;
      var th, ph, A2, tries = 0; do { var cz = 2 * rnd() - 1; th = Math.acos(cz); ph = 2 * PI * rnd(); A2 = angolare(o.l, o.m, o.reale, th, ph); tries++; } while (rnd() * ymax * 1.05 > A2.re * A2.re + A2.im * A2.im && tries < 400);
      out.push([rr * Math.sin(th) * Math.cos(ph), rr * Math.sin(th) * Math.sin(ph), rr * Math.cos(th)]);
    }
    return out;
  }
  /** La soglia di |ψ|² che racchiude la frazione f della probabilità, su una griglia. */
  function soglia(valori, dV, f) { var a = Array.prototype.slice.call(valori).sort(function (x, y) { return y - x; }), s = 0, tot = 0; for (var i = 0; i < a.length; i++) tot += a[i] * dV; for (var j = 0; j < a.length; j++) { s += a[j] * dV; if (s >= f * tot) return a[j]; } return a[a.length - 1]; }
  /** Isosuperficie con i tetraedri marcianti: funzione campo(x,y,z) → valore, mezzo lato L, N celle per lato, livello c. Restituisce i vertici (triangoli). */
  var TET = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];
  var CUBO = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  function isosuperficie(campo, L, N, c) {
    var h = 2 * L / N, val = new Float32Array((N + 1) * (N + 1) * (N + 1)), id = function (i, j, k) { return (k * (N + 1) + j) * (N + 1) + i; }, tri = [];
    for (var k = 0; k <= N; k++) for (var j = 0; j <= N; j++) for (var i = 0; i <= N; i++) val[id(i, j, k)] = campo(-L + i * h, -L + j * h, -L + k * h);
    function interp(p1, v1, p2, v2) { var s = (c - v1) / (v2 - v1); return [p1[0] + s * (p2[0] - p1[0]), p1[1] + s * (p2[1] - p1[1]), p1[2] + s * (p2[2] - p1[2])]; }
    for (var kk = 0; kk < N; kk++) for (var jj = 0; jj < N; jj++) for (var ii = 0; ii < N; ii++) {
      var P = [], V = [], dentro = 0;
      for (var v = 0; v < 8; v++) { var cc = CUBO[v]; P.push([-L + (ii + cc[0]) * h, -L + (jj + cc[1]) * h, -L + (kk + cc[2]) * h]); V.push(val[id(ii + cc[0], jj + cc[1], kk + cc[2])]); if (V[v] > c) dentro++; }
      if (!dentro || dentro === 8) continue;
      TET.forEach(function (T4) {
        var a = [], b = []; T4.forEach(function (x) { (V[x] > c ? a : b).push(x); });
        if (!a.length || !b.length) return;
        if (a.length === 1 || b.length === 1) { var s1 = a.length === 1 ? a[0] : b[0], al = a.length === 1 ? b : a; tri.push([interp(P[s1], V[s1], P[al[0]], V[al[0]]), interp(P[s1], V[s1], P[al[1]], V[al[1]]), interp(P[s1], V[s1], P[al[2]], V[al[2]])]); }
        else { var p0 = interp(P[a[0]], V[a[0]], P[b[0]], V[b[0]]), p1 = interp(P[a[0]], V[a[0]], P[b[1]], V[b[1]]), p2 = interp(P[a[1]], V[a[1]], P[b[0]], V[b[0]]), p3 = interp(P[a[1]], V[a[1]], P[b[1]], V[b[1]]); tri.push([p0, p1, p3]); tri.push([p0, p3, p2]); }
      });
    }
    return tri;
  }
  /* H₂⁺ con il metodo LCAO */
  function sovrapposizione(R) { return Math.exp(-R) * (1 + R + R * R / 3); }
  function h2piu(R, legante, x, y, z) { var a = Math.exp(-Math.sqrt(x * x + y * y + (z - R / 2) * (z - R / 2))) / Math.sqrt(PI), b = Math.exp(-Math.sqrt(x * x + y * y + (z + R / 2) * (z + R / 2))) / Math.sqrt(PI), S = sovrapposizione(R); return legante ? (a + b) / Math.sqrt(2 * (1 + S)) : (a - b) / Math.sqrt(2 * (1 - S)); }
  /** Frequenza dell'oscillazione di una sovrapposizione di due livelli dell'idrogeno (Hz) e lunghezza d'onda della riga (nm). */
  function battimento(n1, n2, Z) { var dE = Math.abs(energia(n2, Z) - energia(n1, Z)); return { dE: dE, nu: dE / H_EV_S, lambda: dE > 0 ? 1239.84193 / dE : Infinity, periodo: dE > 0 ? H_EV_S / dE : Infinity }; }
  /** Regola di selezione di dipolo: Δl = ±1 e |Δm| ≤ 1. */
  function permessa(a, b) { return Math.abs(a.l - b.l) === 1 && Math.abs(a.m - b.m) <= 1; }

  F.calcolo.orbitali = { laguerre: laguerre, radiale: radiale, legendre: legendre, angolare: angolare, psi: psi, energia: energia, rMedio: rMedio, radialeInfo: radialeInfo, nome: nome, campiona: campiona, soglia: soglia, isosuperficie: isosuperficie, sovrapposizione: sovrapposizione, h2piu: h2piu, battimento: battimento, permessa: permessa };

  /* ═══ 2. I COLORI DELLA FASE ════════════════════════════════════════════ */
  function hsl(h, s, l) { h = ((h % 1) + 1) % 1; var a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }
  var POS = [0.36, 0.78, 1.0], NEG = [1.0, 0.55, 0.22];                     /* segno +: azzurro, −: arancio */
  function coloreFase(re, im, complessa, fase) { if (!complessa) return re >= 0 ? POS : NEG; var a = Math.atan2(im, re) + fase; return hsl(a / (2 * PI), 0.85, 0.58); }

  /* ═══ 3. LE SCHEDE ═════════════════════════════════════════════════════ */
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function scena3D(dx, pronto) {
    var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.appendChild(attesa);
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
    L3.stile(); L3.caricaThree().then(function () { attesa.remove(); var S = new L3.Scena(dx, 0.78); dx.insertBefore(S.box, dx.firstChild); setTimeout(function () { pronto(S, globale.THREE); }, 0); }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
  }
  function telefono() { return Math.min(globale.innerWidth || 1000, globale.screen ? globale.screen.width : 1000) < 700; }
  /** Controlli n, l, m, forma, Z: chiama cambia(o) a ogni modifica. */
  function selettore(pan, o, cambia) {
    var sn, sl, sm, sf, sz;
    function opzioniL() { sl.innerHTML = ''; for (var l = 0; l < o.n; l++) sl.appendChild(F.el('option', { value: String(l), testo: l + ' (' + 'spdfgh'[l] + ')' })); sl.value = String(Math.min(o.l, o.n - 1)); o.l = +sl.value; opzioniM(); }
    function opzioniM() { sm.innerHTML = ''; for (var m = -o.l; m <= o.l; m++) { var nm = o.reale && o.l >= 1 && o.l <= 3 ? NOMI[o.l][m] : (m > 0 ? '+' : '') + m; sm.appendChild(F.el('option', { value: String(m), testo: (o.reale && o.l >= 1 && o.l <= 3 ? nm + ' (' + (m > 0 ? '+' : m < 0 ? '−' : '') + Math.abs(m) + ')' : 'm = ' + String(nm).replace('-', '−')) })); } if (Math.abs(o.m) > o.l) o.m = 0; sm.value = String(o.m); }
    sn = F.scelta(pan, ['Numero quantico principale n', 'Principal quantum number n'], [1, 2, 3, 4, 5, 6].map(function (n) { return [String(n), String(n)]; }), String(o.n), function (v) { o.n = +v; opzioniL(); cambia(o); });
    sl = F.scelta(pan, ['Momento angolare l', 'Angular momentum l'], [['0', '0 (s)']], String(o.l), function (v) { o.l = +v; opzioniM(); cambia(o); });
    sm = F.scelta(pan, ['Numero magnetico m', 'Magnetic number m'], [['0', '0']], String(o.m), function (v) { o.m = +v; cambia(o); });
    sf = F.scelta(pan, ['Forma', 'Form'], [['r', ['Reale (px, dxy…): segno ±', 'Real (px, dxy…): sign ±']], ['c', ['Complessa (e^(imφ)): fase come colore', 'Complex (e^(imφ)): phase as colour']]], o.reale ? 'r' : 'c', function (v) { o.reale = v === 'r'; opzioniM(); cambia(o); });
    sz = F.cursore(pan, ['Carica nucleare Z (idrogenoide)', 'Nuclear charge Z (hydrogen-like)'], 1, 10, 1, o.Z, function (v) { o.Z = v; cambia(o); });
    opzioniL();
    return { aggiorna: function () { sn.value = String(o.n); opzioniL(); sf.value = o.reale ? 'r' : 'c'; } };
  }

  function schedaOrbitale(div) {
    var g = griglia(div), o = { n: 3, l: 2, m: 0, reale: true, Z: 1 }, S = null, T = null, gruppo = null, fase = 0, mostra = { superficie: true, nuvola: true, nodi: true, taglio: false, corrente: true };
    selettore(g.pan, o, function () { ricostruisci(); });
    var sv = F.el('div', { style: 'display:grid;gap:2px;margin:8px 0' }); g.pan.appendChild(sv);
    [['superficie', ['Isosuperficie 90 %', 'Isosurface 90 %']], ['nuvola', ['Nuvola (|ψ|²)', 'Cloud (|ψ|²)']], ['nodi', ['Nodi radiali', 'Radial nodes']], ['taglio', ['Spaccato (piano xz)', 'Cutaway (xz plane)']], ['corrente', ['Corrente di probabilità', 'Probability current']]].forEach(function (x) {
      var lab = F.el('label', { style: 'display:flex;align-items:center;justify-content:flex-start;gap:10px;min-height:36px;width:100%;box-sizing:border-box;text-align:left;cursor:pointer' }), c = F.el('input', { type: 'checkbox', style: 'width:20px;height:20px;flex:0 0 auto;margin:0' }); c.checked = mostra[x[0]]; c.addEventListener('change', function () { mostra[x[0]] = c.checked; ricostruisci(); }); lab.appendChild(c); lab.appendChild(F.el('span', { testo: t(x[1][0], x[1][1]) })); sv.appendChild(lab);
    });
    var info = nota(g.pan);
    function testo() {
      var I = radialeInfo(o.n, o.l, o.Z), E = energia(o.n, o.Z);
      info.innerHTML = '<b style="font-size:1.1em">' + nome(o) + '</b>' + (o.Z > 1 ? ' · Z = ' + o.Z : '') + '<br>' +
        'E = −13,6·Z²/n² = <b class="bsiFX-num">' + E.toFixed(3).replace('.', ',').replace('-', '−') + ' eV</b><br>' +
        '⟨r⟩ = <b class="bsiFX-num">' + rMedio(o.n, o.l, o.Z).toFixed(2).replace('.', ',') + ' a₀</b>, ' + t('raggio più probabile', 'most probable radius') + ' <b class="bsiFX-num">' + I.rPiuProbabile.toFixed(2).replace('.', ',') + ' a₀</b><br>' +
        t('Nodi: ', 'Nodes: ') + '<b class="bsiFX-num">' + (o.n - o.l - 1) + t(' radiali', ' radial') + '</b> (' + (I.nodiRadiali.map(function (x) { return x.toFixed(2).replace('.', ','); }).join(', ') || '—') + ' a₀) + <b class="bsiFX-num">' + o.l + t(' angolari', ' angular') + '</b><br>' +
        '<small>' + (o.reale ? t('Colori: azzurro dove ψ > 0, arancio dove ψ < 0. Una funzione reale non ha corrente: la densità è ferma, e così il colore.', 'Colours: blue where ψ > 0, orange where ψ < 0. A real function carries no current: the density is still, and so is the colour.')
          : o.m ? t('Il colore è la fase arg ψ = mφ − Et/ħ: gira attorno all\'asse z e ruota nel tempo, mentre la densità resta ferma (stato stazionario). La corrente scorre attorno all\'asse z, v = ħm/(mₑ r sin θ). Animazione rallentata di ~10¹⁶ volte.', 'The colour is the phase arg ψ = mφ − Et/ħ: it winds around the z axis and turns in time, while the density stays still (stationary state). The current flows around the z axis, v = ħm/(mₑ r sin θ). Animation slowed ~10¹⁶ times.')
            : t('Con m = 0 la fase dipende solo dal tempo: tutto l\'orbitale cambia colore insieme, e non c\'è corrente.', 'With m = 0 the phase depends only on time: the whole orbital changes colour together, and there is no current.')) +
        (o.Z > 1 ? ' ' + t('Per Z > 1: ione con un solo elettrone; negli atomi veri gli altri elettroni schermano il nucleo.', 'For Z > 1: a one-electron ion; in real atoms the other electrons screen the nucleus.') : '') + '</small>';
    }
    function ricostruisci() {
      testo(); if (!S) return;
      S.pulisci(); gruppo = new T.Group(); S.aggiungi(gruppo);
      var L = rMax(o.n, o.Z) * 0.9, N = telefono() ? 34 : 46, h = 2 * L / N, campo = function (x, y, z) { var p = psi(o, x, y, z); return p.re * p.re + p.im * p.im; };
      /* la soglia al 90 % dalla griglia */
      var vals = new Float32Array((N + 1) * (N + 1) * (N + 1)), k = 0; for (var a = 0; a <= N; a++) for (var b = 0; b <= N; b++) for (var c = 0; c <= N; c++) vals[k++] = campo(-L + c * h, -L + b * h, -L + a * h);
      var c90 = soglia(vals, h * h * h, 0.9);
      if (mostra.superficie) {
        var tri = isosuperficie(campo, L, N, c90), pos = new Float32Array(tri.length * 9), col = new Float32Array(tri.length * 9), ps = [];
        tri.forEach(function (T3, i) { T3.forEach(function (p, j) { pos.set(p, i * 9 + j * 3); ps.push(p); }); });
        var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
        var mat = new T.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.62, side: T.DoubleSide, shininess: 60, depthWrite: false });
        var mesh = new T.Mesh(geo, mat); gruppo.add(mesh);
        var psiV = ps.map(function (p) { return psi(o, p[0], p[1], p[2]); });
        mesh.userData.colora = function (f) { for (var i = 0; i < psiV.length; i++) { var cc = coloreFase(psiV[i].re, psiV[i].im, !o.reale, f); col[i * 3] = cc[0]; col[i * 3 + 1] = cc[1]; col[i * 3 + 2] = cc[2]; } geo.attributes.color.needsUpdate = true; };
        mesh.userData.colora(fase); gruppo.userData.superficie = mesh;
      }
      if (mostra.nuvola) {
        var NP = telefono() ? 9000 : 22000, pts = campiona(o, NP, 11), pp = new Float32Array(NP * 3), cp = new Float32Array(NP * 3), pv = [];
        pts.forEach(function (p, i) { pp.set(p, i * 3); pv.push(psi(o, p[0], p[1], p[2])); });
        var gp = new T.BufferGeometry(); gp.setAttribute('position', new T.BufferAttribute(pp, 3)); gp.setAttribute('color', new T.BufferAttribute(cp, 3));
        var pm = new T.Points(gp, new T.PointsMaterial({ size: L * 0.012, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false, blending: T.AdditiveBlending }));
        pm.userData.colora = function (f) { for (var i = 0; i < pv.length; i++) { var cc = coloreFase(pv[i].re, pv[i].im, !o.reale, f); cp[i * 3] = cc[0] * 0.8; cp[i * 3 + 1] = cc[1] * 0.8; cp[i * 3 + 2] = cc[2] * 0.8; } gp.attributes.color.needsUpdate = true; };
        pm.userData.colora(fase); pm.userData.punti = pts; gruppo.add(pm); gruppo.userData.nuvola = pm;
      }
      if (mostra.nodi) radialeInfo(o.n, o.l, o.Z).nodiRadiali.forEach(function (rn) { var sf = new T.Mesh(new T.SphereGeometry(rn, 40, 24), new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.16 })); gruppo.add(sf); });
      if (mostra.taglio) {
        var R = 220, cv = globale.document.createElement('canvas'); cv.width = R; cv.height = R; var q = cv.getContext('2d'), im = q.createImageData(R, R), max = 0, buf = [];
        for (var yy = 0; yy < R; yy++) for (var xx = 0; xx < R; xx++) { var X = -L + 2 * L * xx / (R - 1), Zz = L - 2 * L * yy / (R - 1), p2 = psi(o, X, 0, Zz); buf.push(p2); max = Math.max(max, p2.re * p2.re + p2.im * p2.im); }
        buf.forEach(function (p2, i) { var d = Math.pow((p2.re * p2.re + p2.im * p2.im) / max, 0.45), cc = coloreFase(p2.re, p2.im, !o.reale, fase); im.data[i * 4] = 255 * cc[0] * d; im.data[i * 4 + 1] = 255 * cc[1] * d; im.data[i * 4 + 2] = 255 * cc[2] * d; im.data[i * 4 + 3] = 235; });
        q.putImageData(im, 0, 0);
        var tex = new T.CanvasTexture(cv), piano = new T.Mesh(new T.PlaneGeometry(2 * L, 2 * L), new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide, transparent: true, opacity: 0.92 }));
        piano.rotation.x = PI / 2; gruppo.add(piano);                     /* il piano y = 0 (xz) */
      }
      /* le traccianti della corrente: solo per le forme complesse con m ≠ 0 */
      var traccianti = null;
      if (mostra.corrente && !o.reale && o.m !== 0) {
        var NT = 260, pt = campiona(o, NT, 29), tp = new Float32Array(NT * 3), st = pt.map(function (p) { var rr = Math.sqrt(p[0] * p[0] + p[1] * p[1]); return { rho: rr, z: p[2], ph: Math.atan2(p[1], p[0]), r: Math.sqrt(rr * rr + p[2] * p[2]) }; });
        var gt = new T.BufferGeometry(); gt.setAttribute('position', new T.BufferAttribute(tp, 3));
        traccianti = new T.Points(gt, new T.PointsMaterial({ size: L * 0.035, color: 0xffffff, transparent: true, opacity: 0.95 }));
        traccianti.userData.muovi = function (dt) { st.forEach(function (s, i) { var w = o.m / Math.max(0.25, s.rho * s.rho); s.ph += w * dt * 0.6; tp[i * 3] = s.rho * Math.cos(s.ph); tp[i * 3 + 1] = s.rho * Math.sin(s.ph); tp[i * 3 + 2] = s.z; }); gt.attributes.position.needsUpdate = true; };
        traccianti.userData.muovi(0); gruppo.add(traccianti);
      }
      /* assi e luci */
      var ax = new T.AxesHelper(L * 1.05); ax.material.transparent = true; ax.material.opacity = 0.35; gruppo.add(ax);
      gruppo.add(new T.AmbientLight(0xffffff, 0.55)); var dl = new T.DirectionalLight(0xffffff, 0.7); dl.position.set(L, -L, 2 * L); gruppo.add(dl);
      S.inquadra(L * 3.1, 0.7, 1.15);
      S.didascalia.textContent = nome(o) + ' · ' + t('isosuperficie al 90 % di probabilità', '90 % probability isosurface') + (o.reale ? '' : ' · ' + t('colore = fase', 'colour = phase')) + ' · ' + t('lato ', 'side ') + (2 * L).toFixed(0) + ' a₀';
      gruppo.userData.traccianti = traccianti;
    }
    scena3D(g.dx, function (S0, T0) {
      S = S0; T = T0; ricostruisci();
      var ferma = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches;
      S.ogniFotogramma(function (dt) {
        if (ferma || !gruppo) return false;
        if (o.reale) { if (gruppo.userData.traccianti) gruppo.userData.traccianti.userData.muovi(dt); return false; }
        fase -= dt * 1.1 * Math.max(0.15, Math.abs(energia(o.n, o.Z)) / 13.6);   /* e^(−iEt/ħ): più alto il livello, più lenta la fase */
        if (gruppo.userData.superficie) gruppo.userData.superficie.userData.colora(fase);
        if (gruppo.userData.nuvola) gruppo.userData.nuvola.userData.colora(fase);
        if (gruppo.userData.traccianti) gruppo.userData.traccianti.userData.muovi(dt);
        return true;
      });
    });
    testo();
  }

  function schedaGrafici(div) {
    var g = griglia(div), o = { n: 3, l: 1, m: 0, reale: true, Z: 1 };
    selettore(g.pan, o, disegna);
    var info = nota(g.pan), c1 = F.tela(g.dx, 0.5), c2 = F.tela(g.dx, 0.5), c3 = F.el('canvas', { role: 'img', 'aria-label': t('Parte angolare |Y|² in coordinate polari, piano xz', 'Angular part |Y|² in polar coordinates, xz plane'), style: 'width:100%;max-width:420px;display:block;margin:8px auto;border-radius:12px;background:#06111d' }); g.dx.appendChild(c3);
    function disegna() {
      var R0 = rMax(o.n, o.Z), xs = [], P = [], Rr = [], I = radialeInfo(o.n, o.l, o.Z);
      for (var i = 0; i <= 400; i++) { var r = R0 * i / 400, R = radiale(o.n, o.l, o.Z, r); xs.push(r); P.push(r * r * R * R); Rr.push(R); }
      F.grafico(c1, { serie: [{ x: xs, y: P, col: '#5eead4', larg: 2.5 }], punti: [{ x: I.rPiuProbabile, y: Math.max.apply(null, P), col: '#ffd24a', r: 5 }].concat(I.nodiRadiali.map(function (x) { return { x: x, y: 0, col: '#ff8fab', r: 5 }; })), xl: ['r (a₀)', 'r (a₀)'], yl: ['P(r) = r²R² (a₀⁻¹)', 'P(r) = r²R² (a₀⁻¹)'], ymin: 0 });
      F.grafico(c2, { serie: [{ x: xs, y: Rr, col: '#9d8cff', larg: 2.5 }, { x: [0, R0], y: [0, 0], col: '#3a5470' }], xl: ['r (a₀)', 'r (a₀)'], yl: ['R(r) (a₀^−3/2)', 'R(r) (a₀^−3/2)'] });
      /* polare: |Y|² nel piano xz, con il segno */
      var W = Math.max(220, Math.min(420, c3.parentNode.clientWidth || 300)), dpr = Math.min(2, globale.devicePixelRatio || 1); c3.style.height = W + 'px'; c3.width = W * dpr; c3.height = W * dpr; var q = c3.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, W);
      var max = 0, pts = []; for (var a = 0; a <= 360; a++) { var th = a / 180 * PI, A = angolare(o.l, o.m, true, th, 0), A2 = angolare(o.l, o.m, true, th, PI), v = th <= PI ? A : A2; var th2 = a <= 180 ? th : 2 * PI - th, Y = a <= 180 ? A.re : A2.re; pts.push([th2, a <= 180 ? 0 : PI, Y]); max = Math.max(max, Y * Y); }
      q.strokeStyle = '#1f3a55'; q.beginPath(); q.moveTo(W / 2, 8); q.lineTo(W / 2, W - 8); q.moveTo(8, W / 2); q.lineTo(W - 8, W / 2); q.stroke(); q.fillStyle = '#7fa6c9'; q.font = '12px system-ui'; q.fillText('z', W / 2 + 6, 16); q.fillText('x', W - 16, W / 2 - 6);
      pts.forEach(function (p, i) { if (!i) return; var pr = pts[i - 1], rr = (W * 0.44) * p[2] * p[2] / (max || 1), r0 = (W * 0.44) * pr[2] * pr[2] / (max || 1); var x = W / 2 + rr * Math.sin(p[0]) * (p[1] ? -1 : 1), y = W / 2 - rr * Math.cos(p[0]), x0 = W / 2 + r0 * Math.sin(pr[0]) * (pr[1] ? -1 : 1), y0 = W / 2 - r0 * Math.cos(pr[0]); q.strokeStyle = p[2] >= 0 ? '#5cc8ff' : '#ff8c38'; q.lineWidth = 2.5; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x, y); q.stroke(); });
      info.innerHTML = '<b>' + nome(o) + '</b>: ' + t('in alto la distribuzione radiale P(r) = r²R²(r), la probabilità di trovare l\'elettrone a distanza r (in giallo il massimo, ', 'at the top the radial distribution P(r) = r²R²(r), the probability of finding the electron at distance r (yellow: the maximum, ') + I.rPiuProbabile.toFixed(2).replace('.', ',') + ' a₀; ' + t('in rosa i nodi radiali', 'pink: the radial nodes') + '). ' +
        t('Sotto R(r) con il suo segno, poi la parte angolare |Y|² nel piano xz (azzurro dove Y > 0, arancio dove Y < 0). ', 'Below R(r) with its sign, then the angular part |Y|² in the xz plane (blue where Y > 0, orange where Y < 0). ') +
        t('Normalizzazione numerica ∫P(r)dr = ', 'Numerical normalisation ∫P(r)dr = ') + '<b class="bsiFX-num">' + I.norma.toFixed(5).replace('.', ',') + '</b>.';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  function schedaSovrapposizione(div) {
    var g = griglia(div), a = { n: 1, l: 0, m: 0, reale: true, Z: 1 }, b = { n: 2, l: 1, m: 0, reale: true, Z: 1 }, S = null, T = null, tempo = 0, dati = null;
    var COPPIE = [['1s+2pz', [1, 0, 0], [2, 1, 0]], ['1s+2s', [1, 0, 0], [2, 0, 0]], ['2pz+3dz²', [2, 1, 0], [3, 2, 0]], ['2s+2pz', [2, 0, 0], [2, 1, 0]], ['1s+3pz', [1, 0, 0], [3, 1, 0]]];
    F.scelta(g.pan, ['Sovrapposizione di due stati', 'Superposition of two states'], COPPIE.map(function (c) { return [c[0], c[0]]; }), '1s+2pz', function (v) { var c = COPPIE.filter(function (x) { return x[0] === v; })[0]; a.n = c[1][0]; a.l = c[1][1]; a.m = c[1][2]; b.n = c[2][0]; b.l = c[2][1]; b.m = c[2][2]; costruisci(); });
    var info = nota(g.pan);
    function testo() {
      var B = battimento(a.n, b.n, 1), ok = permessa(a, b);
      info.innerHTML = '<div class="bsiFX-eq">ψ(t) = [ψ₁·e^(−iE₁t/ħ) + ψ₂·e^(−iE₂t/ħ)]/√2</div>' +
        (B.dE > 0 ? t('La densità oscilla alla frequenza ', 'The density oscillates at ') + '<b class="bsiFX-num">ν = ΔE/h = ' + (B.nu / 1e15).toFixed(3).replace('.', ',') + '×10¹⁵ Hz</b> (' + t('periodo ', 'period ') + (B.periodo * 1e15).toFixed(3).replace('.', ',') + ' fs), ' + t('la stessa della luce che l\'atomo emetterebbe passando da uno stato all\'altro: ', 'the same as the light the atom would emit going from one state to the other: ') + '<b class="bsiFX-num">λ = ' + B.lambda.toFixed(1).replace('.', ',') + ' nm</b>' + (a.n === 1 && b.n === 2 ? ' (Lyman-α)' : '') + '.<br>'
          : t('Stessa energia: la sovrapposizione è ancora stazionaria, la densità non si muove (è un ibrido, come gli sp).', 'Same energy: the superposition is still stationary, the density does not move (it is a hybrid, like the sp ones).') + '<br>') +
        (B.dE > 0 ? (ok ? t('Transizione di dipolo permessa (Δl = ±1): la carica oscilla da una parte all\'altra del nucleo, un dipolo che irraggia.', 'Dipole-allowed transition (Δl = ±1): the charge sloshes from one side of the nucleus to the other, a radiating dipole.') : t('Transizione di dipolo proibita (Δl ≠ ±1): la densità respira ma il dipolo resta zero, e non irraggia (in approssimazione di dipolo).', 'Dipole-forbidden transition (Δl ≠ ±1): the density breathes but the dipole stays zero, and it does not radiate (in the dipole approximation).')) : '') +
        '<br><small>' + t('Animazione rallentata di circa 10¹⁶ volte.', 'Animation slowed about 10¹⁶ times.') + '</small>';
    }
    function costruisci() {
      testo(); if (!S) return;
      S.pulisci(); var L = Math.max(rMax(a.n, 1), rMax(b.n, 1)) * 0.85, NP = telefono() ? 12000 : 26000, rnd = mulberry(5);
      var pa = campiona(a, NP / 2, 3), pb = campiona(b, NP / 2, 4), pts = pa.concat(pb), N = pts.length;
      var pos = new Float32Array(N * 3), col = new Float32Array(N * 3), va = [], vb = [], pesi = [];
      pts.forEach(function (p, i) { pos.set(p, i * 3); var A = psi(a, p[0], p[1], p[2]), Bv = psi(b, p[0], p[1], p[2]); va.push(A.re); vb.push(Bv.re); var ra = A.re * A.re, rb = Bv.re * Bv.re; pesi.push(1 / ((ra + rb) / 2 + 1e-12)); });
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
      var nub = new T.Points(geo, new T.PointsMaterial({ size: L * 0.014, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); S.aggiungi(nub);
      var Ea = energia(a.n, 1), Eb = energia(b.n, 1), w = (Eb - Ea);
      dati = { colora: function (tt) {
        /* |ψ(t)|² = (ψa² + ψb² + 2ψaψb·cos(ΔE t/ħ))/2 per funzioni reali; i punti campionati dalle due densità pesano come densità vera / densità di campionamento */
        var cw = Math.cos(w * tt); for (var i = 0; i < N; i++) { var d = (va[i] * va[i] + vb[i] * vb[i] + 2 * va[i] * vb[i] * cw) / 2 * pesi[i], k = Math.min(1, d * 0.9); col[i * 3] = 0.25 * k; col[i * 3 + 1] = 0.75 * k; col[i * 3 + 2] = 1.0 * k; }
        geo.attributes.color.needsUpdate = true;
      } };
      dati.colora(0);
      var ax = new T.AxesHelper(L); ax.material.transparent = true; ax.material.opacity = 0.35; S.aggiungi(ax);
      S.inquadra(L * 3, 0.6, 1.2); S.didascalia.textContent = COPPIE.filter(function (c) { return c[1][0] === a.n && c[1][1] === a.l && c[2][0] === b.n && c[2][1] === b.l; }).map(function (c) { return c[0]; })[0] + ' · ' + t('densità che oscilla nel tempo', 'density oscillating in time');
    }
    scena3D(g.dx, function (S0, T0) {
      S = S0; T = T0; costruisci();
      var ferma = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches;
      S.ogniFotogramma(function (dt) { if (ferma || !dati) return false; tempo += dt * 0.9; dati.colora(tempo); return true; });
    });
    testo();
  }

  function schedaMolecolare(div) {
    var g = griglia(div), R = 2.0, legante = true, S = null, T = null;
    F.cursore(g.pan, ['Distanza fra i nuclei R (a₀)', 'Internuclear distance R (a₀)'], 0.5, 6, 0.05, R, function (v) { R = v; costruisci(); }, function (v) { return v.toFixed(2).replace('.', ',') + ' a₀'; });
    F.scelta(g.pan, ['Orbitale', 'Orbital'], [['g', ['σg legante: (1s_A + 1s_B)', 'σg bonding: (1s_A + 1s_B)']], ['u', ['σu* antilegante: (1s_A − 1s_B)', 'σu* antibonding: (1s_A − 1s_B)']]], 'g', function (v) { legante = v === 'g'; costruisci(); });
    var info = nota(g.pan), c = F.tela(g.dx, 0.42);
    function costruisci() {
      var Sv = sovrapposizione(R), xs = [], ys = [], ya = [];
      for (var i = 0; i <= 300; i++) { var z = -R / 2 - 4 + (R + 8) * i / 300, v = h2piu(R, legante, 0, 0, z); xs.push(z); ys.push(v * v); var a1 = Math.exp(-Math.abs(z - R / 2)) / Math.sqrt(PI), b1 = Math.exp(-Math.abs(z + R / 2)) / Math.sqrt(PI); ya.push((a1 * a1 + b1 * b1) / 2); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: legante ? '#5eead4' : '#ff8fab', larg: 2.5 }, { x: xs, y: ya, col: '#9fb3c8', tratt: true }], xl: ['z lungo l\'asse (a₀)', 'z along the axis (a₀)'], yl: ['|ψ|² (a₀⁻³)', '|ψ|² (a₀⁻³)'], ymin: 0, legenda: [{ col: legante ? '#5eead4' : '#ff8fab', etich: [legante ? 'σg' : 'σu*', legante ? 'σg' : 'σu*'] }, { col: '#9fb3c8', etich: ['metà della somma delle due 1s (nessuna interferenza)', 'half the sum of the two 1s (no interference)'] }] });
      var mid = h2piu(R, legante, 0, 0, 0);
      info.innerHTML = '<div class="bsiFX-eq">σ = (1s_A ± 1s_B)/√(2(1 ± S)),  S = e^(−R)(1 + R + R²/3)</div>' + t('Integrale di sovrapposizione ', 'Overlap integral ') + '<b class="bsiFX-num">S = ' + Sv.toFixed(4).replace('.', ',') + '</b><br>' +
        t('Densità a metà fra i nuclei: ', 'Density midway between the nuclei: ') + '<b class="bsiFX-num">' + (mid * mid).toFixed(4).replace('.', ',') + ' a₀⁻³</b>' + (legante ? t(' — le due onde si sommano in fase e l\'elettrone si accumula fra i nuclei: è il legame.', ' — the two waves add in phase and the electron piles up between the nuclei: that is the bond.') : t(' — le onde sono in opposizione di fase: un piano nodale a metà, l\'elettrone esce dalla regione di legame.', ' — the waves are out of phase: a nodal plane in the middle, the electron leaves the bonding region.')) +
        '<br><small>' + t('LCAO con le 1s dell\'idrogeno: dà la forma giusta e il legame, ma l\'energia di legame di H₂⁺ calcolata così (1,76 eV a R ≈ 2,5 a₀) è minore di quella esatta (2,79 eV a R = 2,00 a₀).', 'LCAO with hydrogen 1s orbitals: it gives the right shape and the bond, but the H₂⁺ binding energy computed this way (1.76 eV at R ≈ 2.5 a₀) is smaller than the exact one (2.79 eV at R = 2.00 a₀).') + '</small>';
      if (!S) return;
      S.pulisci(); var Lb = R / 2 + 4, N = telefono() ? 34 : 46, h = 2 * Lb / N, campo = function (x, y, z) { var v = h2piu(R, legante, x, y, z); return v * v; };
      var vals = new Float32Array((N + 1) * (N + 1) * (N + 1)), k = 0; for (var aa = 0; aa <= N; aa++) for (var bb = 0; bb <= N; bb++) for (var cc = 0; cc <= N; cc++) vals[k++] = campo(-Lb + cc * h, -Lb + bb * h, -Lb + aa * h);
      var tri = isosuperficie(campo, Lb, N, soglia(vals, h * h * h, 0.9)), pos = new Float32Array(tri.length * 9), col = new Float32Array(tri.length * 9);
      tri.forEach(function (T3, i) { T3.forEach(function (p, j) { pos.set(p, i * 9 + j * 3); var v = h2piu(R, legante, p[0], p[1], p[2]), cl = v >= 0 ? POS : NEG; col.set(cl, i * 9 + j * 3); }); });
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
      S.aggiungi(new T.Mesh(geo, new T.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false })));
      [R / 2, -R / 2].forEach(function (z) { var nu = new T.Mesh(new T.SphereGeometry(0.12, 16, 12), new T.MeshBasicMaterial({ color: 0xffffff })); nu.position.set(0, 0, z); S.aggiungi(nu); });
      S.aggiungi(new T.AmbientLight(0xffffff, 0.55)); var dl = new T.DirectionalLight(0xffffff, 0.7); dl.position.set(4, -4, 6); S.aggiungi(dl);
      S.inquadra(Lb * 3, 0.5, 1.2); S.didascalia.textContent = 'H₂⁺ · ' + (legante ? 'σg' : 'σu*') + ' · R = ' + R.toFixed(2).replace('.', ',') + ' a₀ · ' + t('isosuperficie al 90 %', '90 % isosurface');
    }
    scena3D(g.dx, function (S0, T0) { S = S0; T = T0; costruisci(); });
    costruisci(); F.alRidimensiona(costruisci);
  }

  F.sezione('sorbitali', {
    titolo: ['🔮 Laboratorio degli orbitali', '🔮 Orbital laboratory'],
    sotto: ['Gli orbitali dell\'idrogeno dalla soluzione esatta: isosuperficie al 90 %, fase complessa come colore, nodi, spaccato, corrente di probabilità; le sovrapposizioni che oscillano davvero e la luce che ne nasce; l\'orbitale molecolare di H₂⁺ come interferenza di due onde.',
            'Hydrogen orbitals from the exact solution: 90 % isosurface, complex phase as colour, nodes, cutaway, probability current; superpositions that really oscillate and the light they give; the molecular orbital of H₂⁺ as interference of two waves.'],
    schede: [
      { nome: ['L\'orbitale in 3D', 'The orbital in 3D'], costruisci: schedaOrbitale },
      { nome: ['I grafici', 'The graphs'], costruisci: schedaGrafici },
      { nome: ['Sovrapposizioni', 'Superpositions'], costruisci: schedaSovrapposizione },
      { nome: ['Orbitale molecolare H₂⁺', 'H₂⁺ molecular orbital'], costruisci: schedaMolecolare }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
