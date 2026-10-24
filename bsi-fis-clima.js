/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-clima.js — 🌍 fisica del clima
   BioSpecInfo · © Samuele Pio Provenzano

   · BILANCIO RADIATIVO: costante solare 1361 W/m², albedo α, temperatura
     efficace T_e = [S(1−α)/(4σ)]^(1/4) ≈ 255 K per α = 0,30; il modello a
     n strati opachi all'infrarosso T_s = T_e (n+1)^(1/4) e quello a uno
     strato con emissivita' ε, T_s = T_e [2/(2−ε)]^(1/4) (ε ≈ 0,78 → 288 K);
     Venere, Terra e Marte con la loro albedo e distanza dal Sole;
   · FORZANTE DELLA CO₂: ΔF = 5,35 ln(C/C₀) W/m² (3,71 W/m² per un
     raddoppio), riscaldamento di equilibrio ΔT = λ ΔF con la sensibilita'
     climatica regolabile (incerta: intervallo probabile IPCC 2,5–4 °C per
     raddoppio); uno scenario esponenziale illustrativo di tipo Keeling;
   · GHIACCIO–ALBEDO: modello a bilancio energetico a zero dimensioni con
     albedo che dipende dalla temperatura; il diagramma di biforcazione
     degli equilibri contro la costante solare, con l'isteresi della «Terra
     a palla di neve»; un'integrazione nel tempo che salta da un ramo
     all'altro quando S sale e scende lentamente;
   · CORIOLIS: un disco lanciato su una piattaforma che ruota, visto da
     dentro (traiettoria curva) e da fuori (linea retta); le oscillazioni
     inerziali e il verso della deviazione nei due emisferi.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, SIGMA = 5.670374419e-8, S0 = 1361, OMEGA_T = 7.2921159e-5;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function rk4(f, y, h) {
    var n = y.length, k1 = f(y), y2 = new Array(n), i;
    for (i = 0; i < n; i++) y2[i] = y[i] + h / 2 * k1[i];
    var k2 = f(y2); for (i = 0; i < n; i++) y2[i] = y[i] + h / 2 * k2[i];
    var k3 = f(y2); for (i = 0; i < n; i++) y2[i] = y[i] + h * k3[i];
    var k4 = f(y2), out = new Array(n);
    for (i = 0; i < n; i++) out[i] = y[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  }
  function Teff(S, alfa) { return Math.pow(S * (1 - alfa) / (4 * SIGMA), 0.25); }
  function Tstrati(Te, n) { return Te * Math.pow(n + 1, 0.25); }
  function Tgrigio(Te, eps) { return Te * Math.pow(2 / (2 - eps), 0.25); }
  /* secondo metodo per n strati: il bilancio di ogni strato come sistema lineare nei flussi x_i = σT_i⁴ (Gauss) */
  function stratiLineare(S, alfa, n) {
    var N = n + 1, A = [], b = [], i, j, Q = S * (1 - alfa) / 4;
    /* incognita 0 = superficie, 1..n = strati dal basso; ogni strato assorbe tutto l'IR che riceve ed emette x_i verso l'alto e verso il basso */
    for (i = 0; i < N; i++) { A.push([]); for (j = 0; j < N; j++) A[i].push(0); b.push(0); }
    A[0][0] = 1; if (n > 0) A[0][1] = -1; b[0] = Q;                         /* superficie: x0 = Q + x1 */
    for (i = 1; i <= n; i++) { A[i][i] = 2; A[i][i - 1] = -1; if (i < n) A[i][i + 1] = -1; }   /* strato i: 2x_i = x_{i−1} + x_{i+1} */
    if (n === 0) { A[0][0] = 1; b[0] = Q; }
    for (var k = 0; k < N; k++) { var p = k; for (i = k + 1; i < N; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i; var tmp = A[k]; A[k] = A[p]; A[p] = tmp; var tb = b[k]; b[k] = b[p]; b[p] = tb; for (i = k + 1; i < N; i++) { var m = A[i][k] / A[k][k]; for (j = k; j < N; j++) A[i][j] -= m * A[k][j]; b[i] -= m * b[k]; } }
    var x = new Array(N); for (i = N - 1; i >= 0; i--) { var s = b[i]; for (j = i + 1; j < N; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
    /* condizione al bordo: lo strato piu' alto emette verso lo spazio quanto entra, x_n = Q */
    var scala = Q / x[N - 1];
    return x.map(function (v) { return Math.pow(v * scala / SIGMA, 0.25); });
  }
  var PIANETI = {
    venere: { n: ['Venere', 'Venus'], d: 0.723, alfa: 0.76, Tvera: 737 },
    terra: { n: ['Terra', 'Earth'], d: 1.0, alfa: 0.30, Tvera: 288 },
    marte: { n: ['Marte', 'Mars'], d: 1.524, alfa: 0.25, Tvera: 210 }
  };
  function forzante(C, C0) { return 5.35 * Math.log(C / (C0 || 280)); }
  /* scenario illustrativo: l'eccesso sopra 280 ppm cresce in modo esponenziale (315 ppm nel 1958, 420 nel 2023) */
  var K_KEELING = Math.log(140 / 35) / 65;
  function scenarioCO2(anno, k) { k = k == null ? K_KEELING : k; var C = 280 + 35 * Math.exp(K_KEELING * (Math.min(anno, 2023) - 1958)); if (anno > 2023) C = 280 + 140 * Math.exp(k * (anno - 2023)); return C; }
  /* modello a bilancio energetico con albedo dipendente da T */
  var EBM = { ai: 0.7, aw: 0.3, Tm: 265, w: 10, eps: 0.6114, C: 4e8 };
  function albedo(T, p) { p = p || EBM; return 0.5 * (p.ai + p.aw) - 0.5 * (p.ai - p.aw) * Math.tanh((T - p.Tm) / p.w); }
  function bilancio(T, S, p) { p = p || EBM; return S / 4 * (1 - albedo(T, p)) - p.eps * SIGMA * Math.pow(T, 4); }
  /* equilibri per S fissato: scansione dei cambi di segno e bisezione; stabile se d(bilancio)/dT < 0 */
  function equilibri(S, p) {
    p = p || EBM; var out = [], a = 150, fa = bilancio(a, S, p);
    for (var T = 150.5; T <= 400; T += 0.5) {
      var fb = bilancio(T, S, p);
      if (fa === 0 || fa * fb < 0) {
        var lo = T - 0.5, hi = T; for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2; if (bilancio(lo, S, p) * bilancio(m, S, p) <= 0) hi = m; else lo = m; }
        var r = (lo + hi) / 2, d = (bilancio(r + 1e-4, S, p) - bilancio(r - 1e-4, S, p)) / 2e-4;
        out.push({ T: r, stabile: d < 0 });
      }
      fa = fb;
    }
    return out;
  }
  /* la curva degli equilibri in forma parametrica: S(T) = 4εσT⁴/(1 − α(T)); i punti di biforcazione sono i suoi estremi */
  function Seq(T, p) { p = p || EBM; return 4 * p.eps * SIGMA * Math.pow(T, 4) / (1 - albedo(T, p)); }
  function biforcazioni(p) {
    p = p || EBM; var out = [], h = 0.01, prev = Seq(150, p), d0 = Seq(150 + h, p) - prev;
    for (var T = 150 + h; T < 400; T += h) {
      var s = Seq(T + h, p), d = s - Seq(T, p);
      if (d0 * d < 0) {
        var lo = T - h, hi = T + h; for (var k = 0; k < 60; k++) { var m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; var f1 = Seq(m1, p), f2 = Seq(m2, p); if ((d0 > 0) === (f1 < f2)) lo = m1; else hi = m2; }
        var Tb = (lo + hi) / 2; out.push({ T: Tb, S: Seq(Tb, p), tipo: d0 > 0 ? 'max' : 'min' });
      }
      d0 = d;
    }
    return out;
  }
  /* integrazione nel tempo: C dT/dt = bilancio; t in anni */
  var ANNO = 3.15576e7;
  function passoEBM(T, S, dtAnni, p) { p = p || EBM; return rk4(function (y) { return [bilancio(y[0], S, p) * ANNO / p.C]; }, [T], dtAnni)[0]; }
  /* ciclo di isteresi: S da Smin a Smax e ritorno in molti anni */
  function ciclo(Smin, Smax, anni, T0, p) {
    var n = Math.round(anni / 0.5), T = T0, out = [];
    for (var k = 0; k <= n; k++) { var fr = k / n, S = fr < 0.5 ? Smax - (Smax - Smin) * 2 * fr : Smin + (Smax - Smin) * (2 * fr - 1); T = passoEBM(T, S, 0.5, p); out.push([S, T]); }
    return out;
  }
  /* Coriolis: il disco nel riferimento inerziale (retta) e la stessa retta vista dalla piattaforma che ruota con Ω */
  function inerziale(r0, vrel, Om, tt) { var vx = vrel[0] - Om * r0[1], vy = vrel[1] + Om * r0[0]; return [r0[0] + vx * tt, r0[1] + vy * tt]; }
  function ruota(p, ang) { var c = Math.cos(ang), s = Math.sin(ang); return [c * p[0] - s * p[1], s * p[0] + c * p[1]]; }
  function rotante(r0, vrel, Om, tt) { return ruota(inerziale(r0, vrel, Om, tt), -Om * tt); }
  /* secondo metodo: le equazioni nel riferimento rotante, a = −2Ω×v + Ω²r (Coriolis + centrifuga) */
  function campoRotante(Om) { return function (y) { return [y[2], y[3], 2 * Om * y[3] + Om * Om * y[0], -2 * Om * y[2] + Om * Om * y[1]]; }; }
  /* oscillazioni inerziali sul piano f: du/dt = f v, dv/dt = −f u, f = 2Ω sin φ */
  function fCoriolis(lat) { return 2 * OMEGA_T * Math.sin(lat * Math.PI / 180); }
  function cerchioInerziale(lat, u0, tt) { var f = fCoriolis(lat); if (Math.abs(f) < 1e-12) return [u0 * tt, 0]; return [u0 / f * Math.sin(f * tt), u0 / f * (Math.cos(f * tt) - 1)]; }
  F.calcolo.clima = { SIGMA: SIGMA, S0: S0, Teff: Teff, Tstrati: Tstrati, Tgrigio: Tgrigio, stratiLineare: stratiLineare, PIANETI: PIANETI, forzante: forzante, scenarioCO2: scenarioCO2, K_KEELING: K_KEELING, EBM: EBM, albedo: albedo, bilancio: bilancio, equilibri: equilibri, Seq: Seq, biforcazioni: biforcazioni, passoEBM: passoEBM, ciclo: ciclo, inerziale: inerziale, rotante: rotante, campoRotante: campoRotante, rk4: rk4, fCoriolis: fCoriolis, cerchioInerziale: cerchioInerziale, OMEGA_T: OMEGA_T };

  /* ═══ 1. bilancio radiativo ═════════════════════════════════════════════ */
  function schedaBilancio(div) {
    var G = griglia(div), st = { pl: 'terra', alfa: 0.30, mod: 'grigio', eps: 0.78, n: 1 }, info = nota(G.pan), inA;
    F.scelta(G.pan, ['Pianeta', 'Planet'], Object.keys(PIANETI).map(function (k) { return [k, PIANETI[k].n]; }), st.pl, function (v) { st.pl = v; st.alfa = PIANETI[v].alfa; inA.value = st.alfa; inA.dispatchEvent(new Event('input')); });
    inA = F.cursore(G.pan, ['albedo α', 'albedo α'], 0, 0.95, 0.01, st.alfa, function (v) { st.alfa = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.scelta(G.pan, ['Modello dell’atmosfera', 'Atmosphere model'], [['grigio', ['uno strato con emissività ε', 'one layer with emissivity ε']], ['strati', ['n strati opachi all’IR', 'n IR-opaque layers']]], st.mod, function (v) { st.mod = v; disegna(); });
    F.cursore(G.pan, ['emissività ε dello strato', 'layer emissivity ε'], 0, 1, 0.01, st.eps, function (v) { st.eps = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['numero di strati n', 'number of layers n'], 0, 6, 1, st.n, function (v) { st.n = v; disegna(); });
    G.pan.appendChild(info);
    var cd = F.tela(G.dx, 0.5), cg = F.tela(G.dx, 0.42);
    function disegna() {
      var P0 = PIANETI[st.pl], S = S0 / (P0.d * P0.d), Te = Teff(S, st.alfa), Ts = st.mod === 'grigio' ? Tgrigio(Te, st.eps) : Tstrati(Te, st.n);
      /* lo schema: Sole, superficie, strati, frecce dei flussi in W/m² */
      var P = F.pennello(cd), q = P.q, W = P.W, H = P.H, yS = H - 34, nS = st.mod === 'grigio' ? 1 : st.n, Q = S * (1 - st.alfa) / 4;
      q.fillStyle = '#3a6b4a'; q.fillRect(0, yS, W, 34); q.fillStyle = '#e6fffb'; q.font = '12px system-ui'; q.textAlign = 'left'; q.fillText(t('superficie ', 'surface ') + fmt(Ts) + ' K (' + fmt(Ts - 273.15) + ' °C)', 10, yS + 21);
      var Tl = st.mod === 'grigio' ? [Ts * Math.pow(0.5, 0.25)] : stratiLineare(S, st.alfa, st.n).slice(1);
      for (var i = 0; i < nS; i++) {
        var y = yS - (i + 1) * (yS - 40) / (nS + 1);
        q.fillStyle = 'rgba(201,185,255,' + (st.mod === 'grigio' ? 0.15 + 0.4 * st.eps : 0.35) + ')'; q.fillRect(W * 0.08, y - 7, W * 0.84, 14);
        q.fillStyle = '#c9b9ff'; q.font = '11px system-ui'; q.textAlign = 'right'; q.fillText(fmt(Tl[i]) + ' K', W * 0.92 - 4, y + 4);
      }
      var freccia = function (x, ya, yb, col, testo) { q.strokeStyle = col; q.fillStyle = col; q.lineWidth = 3; q.beginPath(); q.moveTo(x, ya); q.lineTo(x, yb); q.stroke(); var s = yb > ya ? 1 : -1; q.beginPath(); q.moveTo(x, yb + s * 2); q.lineTo(x - 6, yb - s * 8); q.lineTo(x + 6, yb - s * 8); q.fill(); q.lineWidth = 1; q.font = '11px system-ui'; q.textAlign = 'left'; q.fillText(testo, x + 8, (ya + yb) / 2); };
      freccia(W * 0.2, 8, yS - 4, '#ffd24a', t('Sole ', 'Sun ') + fmt(Q) + ' W/m²');
      freccia(W * 0.5, yS - 4, 26, '#ff8a80', 'σT_s⁴ = ' + fmt(SIGMA * Math.pow(Ts, 4)));
      freccia(W * 0.75, 40, 6, '#6bcfff', 'OLR ' + fmt(Q));
      cd.setAttribute('aria-label', t('schema del bilancio radiativo con gli strati di atmosfera', 'radiative balance diagram with atmospheric layers'));
      var xs = [], ys = []; for (var e = 0; e <= 1.0001; e += 0.01) { xs.push(e); ys.push(Tgrigio(Te, e)); }
      F.grafico(cg, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2.5, etich: 'T_s(ε)' }], punti: st.mod === 'grigio' ? [{ x: st.eps, y: Ts, col: '#ffd24a', r: 5 }] : [], linee: [{ y: P0.Tvera, col: '#ff8a80', etich: t('osservata ', 'observed ') + P0.Tvera + ' K' }, { y: Te, col: '#8494a8', etich: 'T_e' }], xmin: 0, xmax: 1, xl: [t('emissività ε', 'emissivity ε'), 'emissivity ε'], yl: ['T_s (K)', 'T_s (K)'], descr: ['temperatura superficiale contro emissività', 'surface temperature versus emissivity'] });
      info.innerHTML = 'S = 1361/d² = <b class="bsiFX-num">' + fmt(S) + ' W/m²</b> (d = ' + P0.d + ' UA)<br>T_e = [S(1−α)/(4σ)]^(1/4) = <b class="bsiFX-num">' + fmt(Te) + ' K</b><br>' +
        (st.mod === 'grigio' ? 'T_s = T_e [2/(2−ε)]^(1/4) = ' : 'T_s = T_e (n+1)^(1/4) = ') + '<b class="bsiFX-num">' + fmt(Ts) + ' K</b> · ' + t('osservata ', 'observed ') + P0.Tvera + ' K<br>' +
        t('Il pianeta assorbe S(1−α)/4 (il fattore 4 è il rapporto fra superficie della sfera e disco che intercetta la luce) e all’equilibrio irraggia la stessa potenza nell’infrarosso: senza atmosfera la Terra sarebbe a 255 K, −18 °C. Uno strato che assorbe una frazione ε dell’IR e la riemette metà in su e metà in giù scalda la superficie: con ε ≈ 0,78 si ottengono i 288 K osservati. Con n strati completamente opachi all’infrarosso T_s⁴ = (n+1)T_e⁴: ogni strato aggiunge un T_e⁴. Venere (α = 0,76) ha T_e più bassa della Terra ma 737 K al suolo: un’atmosfera di CO₂ a 92 bar equivale a decine di strati opachi. Il modello trascura convezione, nubi e profilo verticale: è un’illustrazione dell’effetto serra, non una previsione.',
          'The planet absorbs S(1−α)/4 (the factor 4 is the ratio between the sphere’s area and the disc intercepting sunlight) and at equilibrium radiates the same power in the infrared: without an atmosphere the Earth would be at 255 K, −18 °C. A layer absorbing a fraction ε of the IR and re-emitting half up and half down warms the surface: with ε ≈ 0.78 one gets the observed 288 K. With n fully opaque layers T_s⁴ = (n+1)T_e⁴. Venus (α = 0.76) has a lower T_e than Earth but 737 K at the ground: a 92-bar CO₂ atmosphere is equivalent to tens of opaque layers. The model ignores convection, clouds and the vertical profile: it illustrates the greenhouse effect, it is not a forecast.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. forzante della CO₂ ═════════════════════════════════════════════ */
  function schedaCO2(div) {
    var G = griglia(div), st = { C: 560, ecs: 3, k: 1.5 }, info = nota(G.pan);
    F.cursore(G.pan, ['concentrazione di CO₂ (ppm)', 'CO₂ concentration (ppm)'], 180, 1200, 5, st.C, function (v) { st.C = v; disegna(); });
    F.cursore(G.pan, ['sensibilità climatica (°C per raddoppio)', 'climate sensitivity (°C per doubling)'], 1.5, 6, 0.1, st.ecs, function (v) { st.ecs = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['crescita dell’eccesso dopo il 2023 (%/anno)', 'growth of the excess after 2023 (%/yr)'], -2, 3, 0.1, st.k, function (v) { st.k = v; disegna(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    var cf = F.tela(G.dx, 0.42), cs = F.tela(G.dx, 0.45);
    function disegna() {
      var lam = st.ecs / forzante(560), dF = forzante(st.C), xs = [], yf = [], C;
      for (C = 180; C <= 1200; C += 5) { xs.push(C); yf.push(lam * forzante(C)); }
      F.grafico(cf, { serie: [{ x: xs, y: yf, col: '#ff8a80', larg: 2.5, etich: 'ΔT' }, { x: xs, y: xs.map(function (c) { return 2.5 / forzante(560) * forzante(c); }), col: '#8494a8', tratt: true, larg: 1, etich: '2,5 °C' }, { x: xs, y: xs.map(function (c) { return 4 / forzante(560) * forzante(c); }), col: '#8494a8', tratt: true, larg: 1, etich: '4 °C' }], punti: [{ x: st.C, y: lam * dF, col: '#ffd24a', r: 5 }, { x: 560, y: st.ecs, col: '#5eead4', r: 4 }], xmin: 180, xmax: 1200, xl: ['C (ppm)', 'C (ppm)'], yl: [t('ΔT di equilibrio (°C)', 'equilibrium ΔT (°C)'), 'equilibrium ΔT (°C)'], descr: ['riscaldamento di equilibrio contro CO₂', 'equilibrium warming versus CO₂'], legenda: [{ col: '#ff8a80', etich: ['sensibilità scelta', 'chosen sensitivity'] }, { col: '#8494a8', etich: ['intervallo probabile IPCC 2,5–4 °C', 'IPCC likely range 2.5–4 °C'] }] });
      var an = [], yc = [], yt = [], k = st.k / 100;
      for (var a = 1850; a <= 2100; a += 1) { an.push(a); var c = scenarioCO2(a, k); yc.push(c); yt.push(lam * forzante(c)); }
      F.grafico(cs, { serie: [{ x: an, y: yc.map(function (c) { return c / 100; }), col: '#6bcfff', larg: 2.5, etich: 'CO₂/100' }, { x: an, y: yt, col: '#ff8a80', larg: 2, etich: 'ΔT_eq' }], xmin: 1850, xmax: 2100, ymin: 0, xl: [t('anno', 'year'), 'year'], yl: [t('CO₂ (centinaia di ppm), ΔT (°C)', 'CO₂ (hundreds of ppm), ΔT (°C)'), 'CO₂ (hundreds of ppm), ΔT (°C)'], descr: ['scenario illustrativo di CO₂ e riscaldamento di equilibrio', 'illustrative CO₂ scenario and equilibrium warming'], legenda: [{ col: '#6bcfff', etich: ['CO₂ / 100 ppm (illustrativo)', 'CO₂ / 100 ppm (illustrative)'] }, { col: '#ff8a80', etich: ['ΔT di equilibrio', 'equilibrium ΔT'] }] });
      var c2100 = scenarioCO2(2100, k);
      info.innerHTML = 'ΔF = 5,35 ln(C/280) = <b class="bsiFX-num">' + fmt(dF) + ' W/m²</b> · ' + t('raddoppio: ', 'doubling: ') + fmt(forzante(560)) + ' W/m²<br>λ = ' + fmt(lam) + ' K/(W/m²) · ΔT = λΔF = <b class="bsiFX-num">' + fmt(lam * dF) + ' °C</b><br>' + t('scenario: ', 'scenario: ') + '2100 → ' + fmt(c2100) + ' ppm, ΔT_eq = ' + fmt(lam * forzante(c2100)) + ' °C<br>' +
        t('La forzante cresce col logaritmo della concentrazione perché le bande di assorbimento della CO₂ sono già sature al centro e conta l’allargamento delle ali (formula di Myhre et al. 1998). La sensibilità climatica di equilibrio, il riscaldamento per un raddoppio dopo che tutto si è assestato, è incerta soprattutto per le retroazioni delle nubi: IPCC AR6 indica 2,5–4 °C come intervallo probabile, 3 °C come miglior stima. ΔT qui è di equilibrio: il riscaldamento effettivo arriva in ritardo di decenni per l’inerzia termica degli oceani. Lo scenario è illustrativo: l’eccesso di CO₂ sopra 280 ppm cresce in modo esponenziale (315 ppm nel 1958, 420 nel 2023, circa 2,1 % l’anno), poi con il tasso scelto; non è una proiezione IPCC.',
          'The forcing grows with the logarithm of the concentration because CO₂ absorption bands are already saturated at their centre and what counts is the broadening of the wings (Myhre et al. 1998). Equilibrium climate sensitivity, the warming for a doubling once everything has settled, is uncertain mainly because of cloud feedbacks: IPCC AR6 gives 2.5–4 °C as the likely range, 3 °C as best estimate. ΔT here is the equilibrium value: actual warming lags by decades because of ocean thermal inertia. The scenario is illustrative: the CO₂ excess above 280 ppm grows exponentially (315 ppm in 1958, 420 in 2023, about 2.1 % per year), then at the chosen rate; it is not an IPCC projection.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. ghiaccio–albedo e isteresi ═════════════════════════════════════ */
  function schedaIsteresi(div) {
    var G = griglia(div), st = { Smin: 0.8, Smax: 1.5, vel: 1 }, info = nota(G.pan), T, S, fase, pts, bif = biforcazioni(), ramo;
    F.cursore(G.pan, ['S minima (× 1361 W/m²)', 'minimum S (× 1361 W/m²)'], 0.7, 1.0, 0.01, st.Smin, function (v) { st.Smin = v; azzera(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['S massima (× 1361 W/m²)', 'maximum S (× 1361 W/m²)'], 1.0, 1.7, 0.01, st.Smax, function (v) { st.Smax = v; azzera(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['velocità del ciclo', 'cycle speed'], 0.25, 4, 0.25, st.vel, function (v) { st.vel = v; }, function (v) { return '×' + v; });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6), ca = F.tela(G.dx, 0.3);
    /* il diagramma di biforcazione: si percorre la curva parametrica S(T) e si colora per stabilita' (dS/dT > 0 ⇔ stabile) */
    var curva = { st: [[], []], in: [[], []] };
    (function () {
      var prev = null;
      for (var Tk = 180; Tk <= 330; Tk += 0.25) {
        var s = Seq(Tk) / S0, d = Seq(Tk + 0.01) - Seq(Tk - 0.01), stab = d > 0;
        var k = stab ? 'st' : 'in';
        if (prev !== null && prev !== stab) { curva[k][0].push(NaN); curva[k][1].push(NaN); }
        curva[k][0].push(s); curva[k][1].push(Tk); curva[stab ? 'in' : 'st'][0].push(NaN); curva[stab ? 'in' : 'st'][1].push(NaN); prev = stab;
      }
    })();
    function azzera() { S = st.Smax; var eq = equilibri(S * S0); T = eq.length ? eq[eq.length - 1].T : 300; fase = 0; pts = []; if (ctl) ctl.sveglia(); }
    var ctl = null; azzera();
    ctl = F.anima(cv, function (dt) {
      /* un ciclo completo in 40 s (×1): ogni secondo dello schermo sono 25 anni di modello */
      var anni = dt * 25 * st.vel, n = Math.max(1, Math.ceil(anni / 0.5));
      for (var k = 0; k < n; k++) { fase += dt * st.vel / 40 / n; var fr = fase % 1; S = fr < 0.5 ? st.Smax - (st.Smax - st.Smin) * 2 * fr : st.Smin + (st.Smax - st.Smin) * (2 * fr - 1); T = passoEBM(T, S * S0, anni / n); }
      pts.push([S, T]); if (pts.length > 1500) pts.shift();
      F.grafico(cv, { serie: [{ x: curva.st[0], y: curva.st[1], col: '#5eead4', larg: 2.5, etich: [t('stabile', 'stable'), 'stable'] }, { x: curva.in[0], y: curva.in[1], col: '#ff8a80', larg: 2, tratt: true, etich: [t('instabile', 'unstable'), 'unstable'] }, { x: pts.map(function (p) { return p[0]; }), y: pts.map(function (p) { return p[1]; }), col: 'rgba(255,210,74,.55)', larg: 1.5, etich: [t('traiettoria', 'trajectory'), 'trajectory'] }],
        punti: bif.map(function (b) { return { x: b.S / S0, y: b.T, col: '#c9b9ff', r: 5 }; }).concat([{ x: S, y: T, col: '#ffd24a', r: 6 }]), xmin: 0.7, xmax: 1.7, ymin: 180, ymax: 330, xl: ['S / 1361 W/m²', 'S / 1361 W/m²'], yl: ['T (K)', 'T (K)'], descr: ['diagramma di biforcazione del modello ghiaccio–albedo con isteresi', 'bifurcation diagram of the ice–albedo model with hysteresis'], legenda: [{ col: '#5eead4', etich: ['equilibri stabili', 'stable equilibria'] }, { col: '#ff8a80', etich: ['equilibri instabili', 'unstable equilibria'] }, { col: '#ffd24a', etich: ['clima che evolve', 'evolving climate'] }] });
      var xs = [], ya = []; for (var Tk = 200; Tk <= 320; Tk += 1) { xs.push(Tk); ya.push(albedo(Tk)); }
      F.grafico(ca, { serie: [{ x: xs, y: ya, col: '#e6fffb', larg: 2, etich: 'α(T)' }], punti: [{ x: Math.max(200, Math.min(320, T)), y: albedo(T), col: '#ffd24a', r: 5 }], xmin: 200, xmax: 320, ymin: 0.2, ymax: 0.8, xl: ['T (K)', 'T (K)'], yl: [t('albedo', 'albedo'), 'albedo'], descr: ['albedo in funzione della temperatura', 'albedo as a function of temperature'] });
      var eq = equilibri(S * S0);
      info.innerHTML = 'S = <b class="bsiFX-num">' + (S * S0).toFixed(0) + ' W/m²</b> (' + S.toFixed(3) + ' S₀) · T = <b class="bsiFX-num">' + T.toFixed(1) + ' K</b> · ' + t('equilibri: ', 'equilibria: ') + eq.map(function (e) { return e.T.toFixed(0) + ' K' + (e.stabile ? '' : '*'); }).join(', ') + ' (* ' + t('instabile', 'unstable') + ')<br>' +
        t('biforcazioni (nodo-sella): ', 'saddle-node bifurcations: ') + bif.map(function (b) { return 'S = ' + (b.S / S0).toFixed(3) + ' S₀, T = ' + b.T.toFixed(1) + ' K'; }).join(' · ') + '<br>' +
        t('C dT/dt = (S/4)(1 − α(T)) − εσT⁴, con α che passa da 0,7 (ghiaccio) a 0,3 (oceano) attorno a 265 K ed ε = 0,61 (che dà 287 K con S₀). Per S intermedie esistono due climi stabili, uno caldo e uno glaciale, separati da uno instabile. Se il Sole si indebolisce oltre il primo nodo-sella il clima caldo sparisce e la Terra precipita nella palla di neve; per uscirne non basta tornare a S₀: serve una S molto più alta (il secondo nodo-sella), perché il ghiaccio riflette la luce che lo scioglierebbe. È l’isteresi. Nella storia della Terra l’uscita dalle glaciazioni neoproterozoiche (≈ 700 milioni di anni fa) è attribuita all’accumulo di CO₂ vulcanica, non al Sole. Modello a zero dimensioni, puramente illustrativo.',
          'C dT/dt = (S/4)(1 − α(T)) − εσT⁴, with α going from 0.7 (ice) to 0.3 (ocean) around 265 K and ε = 0.61 (which gives 287 K at S₀). For intermediate S there are two stable climates, a warm one and a glacial one, separated by an unstable one. If the Sun weakens past the first saddle-node the warm climate disappears and the Earth plunges into a snowball; to leave it, going back to S₀ is not enough: a much higher S is needed (the second saddle-node), because ice reflects the light that would melt it. This is hysteresis. In Earth history the exit from the Neoproterozoic glaciations (≈ 700 million years ago) is attributed to the build-up of volcanic CO₂, not to the Sun. Zero-dimensional model, purely illustrative.');
    }, { ricomincia: azzera });
  }

  /* ═══ 4. Coriolis ═══════════════════════════════════════════════════════ */
  function schedaCoriolis(div) {
    var G = griglia(div), st = { Om: 1, v: 0.6, ang: 0, lat: 45 }, info = nota(G.pan), tt = 0, r0 = [-0.9, 0];
    F.cursore(G.pan, ['rotazione della piattaforma Ω (rad/s, + antioraria)', 'turntable rotation Ω (rad/s, + anticlockwise)'], -2, 2, 0.05, st.Om, function (v) { st.Om = v; azzera(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['velocità di lancio (raggi/s)', 'launch speed (radii/s)'], 0.2, 2, 0.05, st.v, function (v) { st.v = v; azzera(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['direzione di lancio (°)', 'launch direction (°)'], -60, 60, 1, st.ang, function (v) { st.ang = v; azzera(); });
    F.cursore(G.pan, ['latitudine per le oscillazioni inerziali (°)', 'latitude for inertial oscillations (°)'], -90, 90, 1, st.lat, function (v) { st.lat = v; disegnaIn(); }, function (v) { return (v >= 0 ? v + '° N' : -v + '° S'); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.55), ci = F.tela(G.dx, 0.55);
    function vrel() { var a = st.ang * Math.PI / 180; return [st.v * Math.cos(a), st.v * Math.sin(a)]; }
    function azzera() { tt = 0; testo(); if (ctl) ctl.sveglia(); }
    function testo() {
      info.innerHTML = t('Nel riferimento inerziale (a sinistra) nessuna forza agisce sul disco: va dritto, con la velocità di lancio più quella di trascinamento Ω × r₀ del punto di partenza. Sulla piattaforma (a destra) la stessa retta, ruotata di −Ωt, diventa una curva: chi sta sopra la spiega con la forza di Coriolis −2m Ω × v e la centrifuga mΩ²r. Con rotazione antioraria (come l’emisfero nord visto dall’alto del polo) la deviazione è verso destra, con rotazione oraria (emisfero sud) verso sinistra.', 'In the inertial frame (left) no force acts on the puck: it goes straight, with the launch velocity plus the drag velocity Ω × r₀ of the starting point. On the turntable (right) the same line, rotated by −Ωt, becomes a curve: an observer on it explains it with the Coriolis force −2m Ω × v and the centrifugal force mΩ²r. With anticlockwise rotation (like the northern hemisphere seen from above the pole) the deflection is to the right, with clockwise rotation (southern hemisphere) to the left.') + '<br>' +
        t('Sulla Terra conta la componente verticale della rotazione, f = 2Ω sin φ: una massa d’aria o d’acqua lanciata e poi lasciata libera descrive cerchi inerziali di raggio v/f e periodo 2π/f, mezzo giorno pendolare (17 h a 45°); all’equatore f = 0 e la deviazione orizzontale sparisce.', 'On the Earth what counts is the vertical component of the rotation, f = 2Ω sin φ: a mass of air or water set moving and then left free draws inertial circles of radius v/f and period 2π/f, half a pendulum day (17 h at 45°); at the equator f = 0 and the horizontal deflection vanishes.');
    }
    function disegnaIn() {
      var f = fCoriolis(st.lat), u0 = 10, P = F.pennello(ci), q = P.q, W = P.W, H = P.H, Tp = Math.abs(f) > 1e-9 ? 2 * Math.PI / Math.abs(f) : 0, durata = 36 * 3600, pts = [], i;
      for (i = 0; i <= 600; i++) pts.push(cerchioInerziale(st.lat, u0, durata * i / 600));
      var mx = 1; pts.forEach(function (p) { mx = Math.max(mx, Math.abs(p[0]), Math.abs(p[1])); });
      var sc = Math.min(W, H) * 0.42 / mx, cx = W / 2, cy = H / 2;
      q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(0, cy); q.lineTo(W, cy); q.moveTo(cx, 0); q.lineTo(cx, H); q.stroke();
      q.strokeStyle = st.lat >= 0 ? '#5eead4' : '#ffc45a'; q.lineWidth = 2; q.beginPath(); pts.forEach(function (p, k) { var X = cx + p[0] * sc, Y = cy - p[1] * sc; if (k) q.lineTo(X, Y); else q.moveTo(X, Y); }); q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx, cy, 5, 0, 2 * Math.PI); q.fill();
      q.strokeStyle = '#ffd24a'; q.beginPath(); q.moveTo(cx, cy); q.lineTo(cx + 30, cy); q.stroke(); q.beginPath(); q.moveTo(cx + 34, cy); q.lineTo(cx + 26, cy - 4); q.lineTo(cx + 26, cy + 4); q.fillStyle = '#ffd24a'; q.fill();
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.textAlign = 'left';
      q.fillText((st.lat >= 0 ? st.lat + '° N' : -st.lat + '° S') + ' · f = ' + f.toExponential(2) + ' s⁻¹', 8, 16);
      q.fillText(Tp ? t('raggio ', 'radius ') + fmt(u0 / Math.abs(f) / 1000) + ' km · ' + t('periodo ', 'period ') + fmt(Tp / 3600) + ' h · ' + (st.lat > 0 ? t('gira in senso orario', 'turns clockwise') : t('gira in senso antiorario', 'turns anticlockwise')) : t('equatore: nessuna deviazione', 'equator: no deflection'), 8, 32);
      q.fillStyle = '#8494a8'; q.fillText(t('10 m/s verso est, 36 h, scala ', '10 m/s eastwards, 36 h, scale ') + fmt(2 * mx / 1000) + ' km', 8, H - 8);
      ci.setAttribute('aria-label', t('oscillazione inerziale sul piano f', 'inertial oscillation on the f-plane'));
    }
    var ctl = null; azzera(); disegnaIn(); F.alRidimensiona(disegnaIn);
    ctl = F.anima(cv, function (dt) {
      tt += dt;
      var v = vrel(), Tfine = 0, p, P = F.pennello(cv), q = P.q, W = P.W, H = P.H, R = Math.min(W / 4, H / 2) * 0.86, cs = [W * 0.25, H / 2], cr = [W * 0.75, H / 2];
      /* il disco esce dalla piattaforma: tempo di fine dal raggio 1 */
      while (Tfine < 30) { p = inerziale(r0, v, st.Om, Tfine); if (Tfine > 0.05 && p[0] * p[0] + p[1] * p[1] > 1) break; Tfine += 0.01; }
      var tc = Math.min(tt, Tfine);
      [[cs, 0, t('da fuori (inerziale)', 'from outside (inertial)')], [cr, 1, t('da dentro (rotante)', 'from inside (rotating)')]].forEach(function (c) {
        var o = c[0], rot = c[1] ? 0 : st.Om * tc;
        q.fillStyle = '#0d2238'; q.beginPath(); q.arc(o[0], o[1], R, 0, 2 * Math.PI); q.fill(); q.strokeStyle = '#2a4a6e'; q.stroke();
        for (var k = 0; k < 4; k++) { var a = rot + k * Math.PI / 4; q.strokeStyle = 'rgba(107,207,255,.25)'; q.beginPath(); q.moveTo(o[0] - R * Math.cos(a), o[1] + R * Math.sin(a)); q.lineTo(o[0] + R * Math.cos(a), o[1] - R * Math.sin(a)); q.stroke(); }
        q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.beginPath();
        for (var s = 0; s <= tc + 1e-9; s += Math.max(0.01, tc / 200)) { var pp = c[1] ? rotante(r0, v, st.Om, s) : inerziale(r0, v, st.Om, s); if (s === 0) q.moveTo(o[0] + pp[0] * R, o[1] - pp[1] * R); else q.lineTo(o[0] + pp[0] * R, o[1] - pp[1] * R); }
        q.stroke(); q.lineWidth = 1;
        var pe = c[1] ? rotante(r0, v, st.Om, tc) : inerziale(r0, v, st.Om, tc);
        q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(o[0] + pe[0] * R, o[1] - pe[1] * R, 6, 0, 2 * Math.PI); q.fill();
        var lo = c[1] ? r0 : ruota(r0, st.Om * tc); q.fillStyle = '#5eead4'; q.beginPath(); q.arc(o[0] + lo[0] * R, o[1] - lo[1] * R, 4, 0, 2 * Math.PI); q.fill();
        q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.textAlign = 'center'; q.fillText(c[2], o[0], H - 4);
      });
      q.fillStyle = '#c9d3df'; q.textAlign = 'left'; q.fillText((st.Om >= 0 ? '↺ ' : '↻ ') + 'Ω = ' + st.Om.toFixed(2) + ' rad/s', 6, 14);
      cv.setAttribute('aria-label', t('disco su una piattaforma rotante visto da fuori e da dentro', 'puck on a turntable seen from outside and inside'));
      if (tt > Tfine + 1.5) return false;
    }, { ricomincia: azzera });
  }

  F.sezione('sfisclima', {
    titolo: ['🌍 Fisica del clima', '🌍 Climate physics'],
    sotto: ['Il bilancio radiativo e l’effetto serra con modelli a strati, la forzante della CO₂ e la sensibilità climatica, la retroazione ghiaccio–albedo con l’isteresi della Terra a palla di neve, la forza di Coriolis in un riferimento rotante.', 'Radiative balance and the greenhouse effect with layer models, CO₂ forcing and climate sensitivity, the ice–albedo feedback with snowball-Earth hysteresis, the Coriolis force in a rotating frame.'],
    schede: [
      { nome: ['☀️ Bilancio radiativo', '☀️ Radiative balance'], costruisci: schedaBilancio },
      { nome: ['🏭 CO₂ e sensibilità', '🏭 CO₂ and sensitivity'], costruisci: schedaCO2 },
      { nome: ['❄️ Ghiaccio e isteresi', '❄️ Ice and hysteresis'], costruisci: schedaIsteresi },
      { nome: ['🌀 Coriolis', '🌀 Coriolis'], costruisci: schedaCoriolis }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
