/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-laser.js — 🔦 laser e ottica quantistica
   BioSpecInfo · © Samuele Pio Provenzano

   · EQUAZIONI DI BILANCIO: laser a quattro livelli in unita' ridotte,
     dn/dt = x − n − n s, ds/dt = r (n − 1) s + ε n (n = inversione/N_soglia,
     s = fotoni, x = pompa/pompa di soglia, r = τ/τ_c, tempo in τ); le
     oscillazioni di rilassamento ω_R ≈ √(r(x−1)), poi lo stato stazionario
     con l'inversione bloccata alla soglia; la potenza contro la pompa;
     tre livelli contro quattro: la soglia di pompa;
   · MODI DELLA CAVITA': i modi longitudinali distanti Δν = c/2L sotto la
     curva di guadagno gaussiana (allargamento Doppler); quali superano le
     perdite; l'intensita' nel tempo come somma dei modi: fasi bloccate (un
     treno di impulsi di periodo 2L/c e durata ≈ 2L/(cN)) o casuali;
   · ATOMO A DUE LIVELLI: le oscillazioni di Rabi
     P(t) = (Ω²/Ω_R²) sin²(Ω_R t/2), Ω_R = √(Ω² + Δ²), il vettore di Bloch
     che precede sulla sfera, con smorzamento (T₁, T₂) a scelta;
   · FOTONI SINGOLI NEL MACH–ZEHNDER: i fotoni arrivano uno alla volta
     (generatore con seme), i conteggi dei rivelatori costruiscono le frange
     cos²(φ/2); con l'informazione sul cammino le frange spariscono
     (V² + D² ≤ 1).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, C0 = 299792458;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

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
  /* laser a 4 livelli in unita' ridotte; y = [n, s] */
  function bilancio(x, r, eps) { return function (y) { return [x - y[0] - y[0] * y[1], r * (y[0] - 1) * y[1] + eps * y[0]]; }; }
  function evolviLaser(x, r, eps, T, h, ogni) {
    var f = bilancio(x, r, eps), y = [0, 0], out = [[0, 0, 0]], n = Math.round(T / h);
    for (var k = 1; k <= n; k++) { y = rk4(f, y, h); if (k % (ogni || 1) === 0) out.push([k * h, y[0], y[1]]); }
    return out;
  }
  /* stato stazionario esatto con l'emissione spontanea ε: da x − n − ns = 0 e r(n−1)s + εn = 0 */
  function stazionario(x, r, eps) {
    /* s = (x − n)/n → r(n−1)(x−n)/n + εn = 0 → r(n−1)(x−n) + εn² = 0 → (ε − r)n² + r(x+1)n − rx = 0 */
    var a = eps - r, b = r * (x + 1), c = -r * x, d = Math.sqrt(b * b - 4 * a * c), n = (-b + d) / (2 * a), n2 = (-b - d) / (2 * a);
    if (!(n > 0 && n <= Math.max(1, x) + 1e-9)) n = n2;
    if (x <= 0) return { n: 0, s: 0 };
    return { n: n, s: (x - n) / n };
  }
  /* oscillazioni di rilassamento (linearizzazione attorno allo stato stazionario, ε → 0) */
  function rilassamento(x, r) { var g = x / 2, w2 = r * (x - 1) - g * g; return { gamma: g, omega: w2 > 0 ? Math.sqrt(w2) : 0 }; }
  /* tre livelli e quattro livelli: popolazioni in unita' di N_soglia, N = N_tot/N_soglia, pompa W τ */
  function soglia3(N) { return (N + 1) / (N - 1); }
  function soglia4(N) { return 1 / (N - 1); }
  function uscita3(W, N) { /* fotoni stazionari (unita' N_soglia·τ_c/τ): W N₁ − N₂ con N₂ − N₁ = 1 */ var N2 = (N + 1) / 2, N1 = (N - 1) / 2; return Math.max(0, W * N1 - N2); }
  function uscita4(W, N) { return Math.max(0, W * (N - 1) - 1); }
  /* tre livelli con le equazioni dipendenti dal tempo (secondo metodo): y = [N₂, φ], N₁ = N − N₂, tempo in τ */
  function evolvi3(W, N, r, T, h) {
    var f = function (y) { var inv = 2 * y[0] - N; return [W * (N - y[0]) - y[0] - y[1] * inv, r * (inv - 1) * y[1] + 1e-6 * y[0]]; }, y = [0, 0];
    for (var k = 0; k < T / h; k++) y = rk4(f, y, h);
    return { N2: y[0], inv: 2 * y[0] - N, phi: y[1] };
  }
  /* modi della cavita' */
  function modi(L, nu0, larg, g0, perdita) {
    var dnu = C0 / (2 * L), q0 = Math.round(nu0 / dnu), out = [], k;
    var semi = larg / 2 * Math.sqrt(Math.log(Math.max(1, g0 / perdita)) / Math.LN2) + 3 * dnu, kmax = Math.min(2000, Math.ceil(Math.max(larg, semi) * 1.5 / dnu));
    for (k = -kmax; k <= kmax; k++) {
      var nu = (q0 + k) * dnu, d = nu - nu0, g = g0 * Math.exp(-4 * Math.LN2 * d * d / (larg * larg));
      out.push({ q: q0 + k, nu: nu, d: d, g: g, lasa: g > perdita });
    }
    return { dnu: dnu, modi: out };
  }
  /* intensita' |Σ A e^{i(2π k Δν t + φ)}|² in M punti su [0, periodi·T_ga] */
  function intensita(N, fasi, M, periodi) {
    var I = new Float64Array(M), i, k;
    for (i = 0; i < M; i++) {
      var x = 2 * Math.PI * periodi * i / M, re = 0, im = 0;
      for (k = 0; k < N; k++) { var a = (k - (N - 1) / 2) * x + fasi[k]; re += Math.cos(a); im += Math.sin(a); }
      I[i] = re * re + im * im;
    }
    return I;
  }
  function fasiNulle(N) { var f = []; for (var k = 0; k < N; k++) f.push(0); return f; }
  function fasiCasuali(N, seme) { var r = mulberry32(seme), f = []; for (var k = 0; k < N; k++) f.push(2 * Math.PI * r()); return f; }
  /* larghezza a meta' altezza (in frazioni di periodo) dell'impulso centrato in 0 */
  function fwhm(I, M, periodi) { var mx = I[0], i = 0; while (i < M / 2 && I[i] > mx / 2) i++; if (i === 0) return 0; var fr = (I[i - 1] - mx / 2) / (I[i - 1] - I[i]); return 2 * (i - 1 + fr) / M * periodi; }
  /* atomo a due livelli: la formula di Rabi */
  function rabi(Om, De, tt) { var OR = Math.sqrt(Om * Om + De * De); return OR > 0 ? Om * Om / (OR * OR) * Math.pow(Math.sin(OR * tt / 2), 2) : 0; }
  /* Schrödinger nel riferimento rotante: H/ħ = [[Δ/2, Ω/2], [Ω/2, −Δ/2]] su (g, e); y = [Re c_g, Im c_g, Re c_e, Im c_e] */
  function schrodinger(Om, De) {
    return function (y) {
      /* i ċ = H c → ċ = −i H c */
      var hg = [De / 2 * y[0] + Om / 2 * y[2], De / 2 * y[1] + Om / 2 * y[3]], he = [Om / 2 * y[0] - De / 2 * y[2], Om / 2 * y[1] - De / 2 * y[3]];
      return [hg[1], -hg[0], he[1], -he[0]];
    };
  }
  /* equazioni ottiche di Bloch: R = (u, v, w), precessione attorno a (Ω, 0, Δ); T₁ porta w a −1, T₂ smorza u e v */
  function bloch(Om, De, T1, T2) {
    var g1 = T1 > 0 ? 1 / T1 : 0, g2 = T2 > 0 ? 1 / T2 : 0;
    return function (R) { return [-De * R[1] - g2 * R[0], De * R[0] - Om * R[2] - g2 * R[1], Om * R[1] - g1 * (R[2] + 1)]; };
  }
  /* stato stazionario con smorzamento radiativo (T₂ = 2T₁, Γ = 1/T₁): ρ_ee = (Ω²/4)/(Δ² + Ω²/2 + Γ²/4) */
  function rhoStaz(Om, De, G) { return Om * Om / 4 / (De * De + Om * Om / 2 + G * G / 4); }
  /* Mach–Zehnder: probabilita' al rivelatore 1 con distinguibilita' D: P₁ = ½[1 + √(1−D²) cos φ] */
  function pMZ(phi, D) { return 0.5 * (1 + Math.sqrt(Math.max(0, 1 - D * D)) * Math.cos(phi)); }
  function fotoni(seme) {
    var r = mulberry32(seme || 1);
    return function (phi, D) { var p = pMZ(phi, D); return r() < p ? 1 : 2; };
  }
  /* visibilita' dai conteggi: minimi quadrati di N(φ) = a + b cos φ + c sin φ → V = √(b²+c²)/a */
  function visibilita(fi, cnt) {
    var S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0];
    fi.forEach(function (p, i) { var x = [1, Math.cos(p), Math.sin(p)]; for (var a = 0; a < 3; a++) { v[a] += x[a] * cnt[i]; for (var b = 0; b < 3; b++) S[a][b] += x[a] * x[b]; } });
    /* Cramer 3×3 */
    var det = function (M) { return M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]); };
    var D = det(S); if (Math.abs(D) < 1e-12) return { a: 0, V: 0 };
    var sol = [0, 1, 2].map(function (k) { var M = S.map(function (r, i) { return r.map(function (x, j) { return j === k ? v[i] : x; }); }); return det(M) / D; });
    return { a: sol[0], b: sol[1], c: sol[2], V: sol[0] > 0 ? Math.sqrt(sol[1] * sol[1] + sol[2] * sol[2]) / sol[0] : 0 };
  }
  F.calcolo.laser = { rk4: rk4, bilancio: bilancio, evolviLaser: evolviLaser, stazionario: stazionario, rilassamento: rilassamento, soglia3: soglia3, soglia4: soglia4, uscita3: uscita3, uscita4: uscita4, evolvi3: evolvi3, modi: modi, intensita: intensita, fasiCasuali: fasiCasuali, fasiNulle: fasiNulle, fwhm: fwhm, rabi: rabi, schrodinger: schrodinger, bloch: bloch, rhoStaz: rhoStaz, pMZ: pMZ, fotoni: fotoni, visibilita: visibilita, c: C0 };

  /* ═══ 1. equazioni di bilancio ══════════════════════════════════════════ */
  function schedaBilancio(div) {
    var G = griglia(div), st = { x: 2, r: 1000, N: 20 }, info = nota(G.pan), y, tt, storia, EPS = 1e-6;
    F.cursore(G.pan, ['pompa x = R/R_soglia', 'pump x = R/R_threshold'], 0, 5, 0.05, st.x, function (v) { st.x = v; azzera(); disegnaP(); }, function (v) { return v.toFixed(2); });
    F.scelta(G.pan, ['τ/τ_c (vita del livello / vita del fotone)', 'τ/τ_c (level lifetime / photon lifetime)'], [['100', '100'], ['1000', '1000'], ['10000', '10⁴']], '1000', function (v) { st.r = +v; azzera(); });
    F.cursore(G.pan, ['atomi attivi N_tot/N_soglia (3 vs 4 livelli)', 'active atoms N_tot/N_thr (3 vs 4 levels)'], 2, 200, 1, st.N, function (v) { st.N = v; disegna34(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.32), cf = F.tela(G.dx, 0.36), cp = F.tela(G.dx, 0.36), c34 = F.tela(G.dx, 0.38);
    function azzera() { y = [0, 0]; tt = 0; storia = [[0, 0, 0]]; testo(); if (ctl) ctl.sveglia(); }
    function testo() {
      var ss = stazionario(st.x, st.r, EPS), rl = rilassamento(st.x, st.r);
      info.innerHTML = t('Stato stazionario: inversione ', 'Steady state: inversion ') + 'n = <b class="bsiFX-num">' + ss.n.toFixed(4) + '</b> · ' + t('fotoni ', 'photons ') + 's = <b class="bsiFX-num">' + fmt(ss.s) + '</b>' + (st.x > 1 ? ' (x − 1 = ' + fmt(st.x - 1) + ')' : '') + '<br>' +
        (st.x > 1 && rl.omega > 0 ? t('oscillazioni di rilassamento ', 'relaxation oscillations ') + 'ω_R = √(r(x−1) − x²/4) = ' + fmt(rl.omega) + '/τ · ' + t('smorzamento ', 'damping ') + 'x/2τ = ' + fmt(rl.gamma) + '/τ<br>' : '') +
        t('Equazioni di bilancio (unità ridotte, tempo in τ): ', 'Rate equations (reduced units, time in τ): ') + 'dn/dt = x − n − n s, ds/dt = r(n − 1)s + εn. ' +
        t('Sotto soglia (x < 1) l’inversione cresce con la pompa e c’è solo emissione spontanea. Sopra soglia il guadagno non può superare le perdite in modo stabile: l’inversione resta bloccata a n = 1 e ogni atomo pompato in più diventa un fotone, quindi l’uscita cresce linearmente, s = x − 1. All’accensione l’inversione supera la soglia, i fotoni esplodono in un picco, l’inversione crolla: spike e oscillazioni smorzate, come nei laser a stato solido (Nd:YAG ha τ = 230 μs e τ_c ~ 10 ns). Nel laser a tre livelli (rubino) il livello inferiore è il fondamentale: bisogna svuotarne più di metà prima di avere inversione, e la soglia di pompa sale di un fattore ≈ N_tot/N_soglia.',
          'Below threshold (x < 1) the inversion grows with pumping and there is only spontaneous emission. Above threshold gain cannot stably exceed losses: the inversion stays clamped at n = 1 and every extra pumped atom becomes a photon, so the output grows linearly, s = x − 1. At switch-on the inversion overshoots, photons explode in a spike, the inversion collapses: spikes and damped oscillations, as in solid-state lasers (Nd:YAG has τ = 230 μs and τ_c ~ 10 ns). In a three-level laser (ruby) the lower level is the ground state: more than half of it must be emptied before inversion, and the pump threshold rises by a factor ≈ N_tot/N_thr.');
    }
    var ctl = null; azzera();
    ctl = F.anima(cv, function (dt) {
      var f = bilancio(st.x, st.r, EPS), h = 0.05 / st.r, n = Math.round(dt * 0.6 / h);
      for (var k = 0; k < n && tt < 12; k++) { y = rk4(f, y, h); tt += h; if (k % Math.max(1, Math.round(n / 40)) === 0) storia.push([tt, y[0], y[1]]); }
      var xs = storia.map(function (p) { return p[0]; });
      F.grafico(cv, { serie: [{ x: xs, y: storia.map(function (p) { return p[1]; }), col: '#ffc45a', larg: 2, etich: 'n' }], linee: [{ y: 1, col: '#8494a8', etich: t('soglia n = 1', 'threshold n = 1') }], xmin: 0, xmax: 12, ymin: 0, ymax: Math.max(1.6, st.x * 1.05), xl: ['t / τ', 't / τ'], yl: [t('inversione n', 'inversion n'), 'inversion n'], descr: ['inversione di popolazione nel tempo', 'population inversion over time'] });
      F.grafico(cf, { serie: [{ x: xs, y: storia.map(function (p) { return p[2]; }), col: '#ff8a80', larg: 1.5, etich: 's' }], linee: st.x > 1 ? [{ y: st.x - 1, col: '#8494a8', etich: 's = x − 1' }] : [], xmin: 0, xmax: 12, ymin: 0, xl: ['t / τ', 't / τ'], yl: [t('fotoni s', 'photons s'), 'photons s'], descr: ['numero di fotoni nel tempo: spike e oscillazioni di rilassamento', 'photon number over time: spikes and relaxation oscillations'] });
      if (tt >= 12) return false;
    }, { ricomincia: azzera });
    function disegnaP() {
      var xs = [], ys = []; for (var x = 0; x <= 5.0001; x += 0.05) { xs.push(x); ys.push(stazionario(x, st.r, EPS).s); }
      F.grafico(cp, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2.5, etich: 's' }], punti: [{ x: st.x, y: stazionario(st.x, st.r, EPS).s, col: '#ffd24a', r: 5 }], xmin: 0, xmax: 5, ymin: 0, xl: ['x = R/R_soglia', 'x = R/R_thr'], yl: [t('uscita s', 'output s'), 'output s'], descr: ['potenza in uscita contro pompa: soglia e pendenza', 'output power versus pump: threshold and slope'] });
    }
    function disegna34() {
      var xs = [], y3 = [], y4 = [], N = st.N, W3 = soglia3(N), W4 = soglia4(N);
      for (var lw = -3; lw <= 1.5001; lw += 0.01) { var W = Math.pow(10, lw); xs.push(lw); y3.push(uscita3(W, N)); y4.push(uscita4(W, N)); }
      var ymax = uscita4(Math.pow(10, 1.5), N) * 0.15;
      F.grafico(c34, { serie: [{ x: xs, y: y4, col: '#5eead4', larg: 2.5, etich: [t('4 livelli', '4 levels'), '4 levels'] }, { x: xs, y: y3, col: '#c9b9ff', larg: 2.5, etich: [t('3 livelli', '3 levels'), '3 levels'] }], punti: [{ x: Math.log10(W4), y: 0, col: '#5eead4', r: 5 }, { x: Math.log10(W3), y: 0, col: '#c9b9ff', r: 5 }], xmin: -3, xmax: 1.5, ymin: 0, ymax: ymax, xl: ['log₁₀ (W_p τ)', 'log₁₀ (W_p τ)'], yl: [t('uscita (u. arb.)', 'output (arb. u.)'), 'output (arb. u.)'], descr: ['tre contro quattro livelli: soglie', 'three versus four levels: thresholds'], legenda: [{ col: '#5eead4', etich: ['4 livelli: W τ = 1/(N−1) = ' + fmt(W4), '4 levels: W τ = 1/(N−1) = ' + fmt(W4)] }, { col: '#c9b9ff', etich: ['3 livelli: W τ = (N+1)/(N−1) = ' + fmt(W3), '3 levels: W τ = (N+1)/(N−1) = ' + fmt(W3)] }] });
    }
    disegnaP(); disegna34(); F.alRidimensiona(function () { disegnaP(); disegna34(); });
  }

  /* ═══ 2. modi della cavita' ═════════════════════════════════════════════ */
  function schedaModi(div) {
    var G = griglia(div), st = { L: 30, larg: 1.5, g0: 2, fasi: 'bloccate', seme: 7 }, info = nota(G.pan), NU0 = 473.612e12;
    F.cursore(G.pan, ['lunghezza della cavità L (cm)', 'cavity length L (cm)'], 5, 200, 1, st.L, function (v) { st.L = v; disegna(); });
    F.cursore(G.pan, ['larghezza Doppler (GHz, FWHM)', 'Doppler width (GHz, FWHM)'], 0.3, 10, 0.1, st.larg, function (v) { st.larg = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['guadagno di picco / perdite', 'peak gain / losses'], 0.5, 5, 0.05, st.g0, function (v) { st.g0 = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.scelta(G.pan, ['Fasi dei modi', 'Mode phases'], [['bloccate', ['bloccate (mode locking)', 'locked (mode locking)']], ['casuali', ['casuali', 'random']]], st.fasi, function (v) { st.fasi = v; disegna(); });
    F.bottone(G.pan, ['Nuove fasi casuali', 'New random phases'], function () { st.seme = (Math.random() * 1e9) | 0; disegna(); });
    G.pan.appendChild(info);
    var cg = F.tela(G.dx, 0.45), ci = F.tela(G.dx, 0.42);
    function disegna() {
      var L = st.L / 100, M = modi(L, NU0, st.larg * 1e9, st.g0, 1), xs = [], ys = [], i;
      for (i = -400; i <= 400; i++) { var d = i / 400 * 1.6 * st.larg; xs.push(d); ys.push(st.g0 * Math.exp(-4 * Math.LN2 * d * d / (st.larg * st.larg))); }
      var lim = 1.6 * st.larg, vis = M.modi.filter(function (m) { return Math.abs(m.d / 1e9) <= lim; }), lasano = M.modi.filter(function (m) { return m.lasa; }), N = lasano.length;
      F.grafico(cg, { serie: [{ x: xs, y: ys, col: '#ffc45a', larg: 2, etich: [t('guadagno', 'gain'), 'gain'] }], barre: vis.length <= 400 ? vis.map(function (m) { return { x: m.d / 1e9, y: m.g, col: m.lasa ? '#5eead4' : '#34465f', larg: m.lasa ? 2.5 : 1.5 }; }) : [], linee: [{ y: 1, col: '#ff8a80', etich: t('perdite', 'losses') }], xmin: -lim, xmax: lim, ymin: 0, ymax: Math.max(1.2, st.g0 * 1.1), xl: ['ν − ν₀ (GHz)', 'ν − ν₀ (GHz)'], yl: [t('guadagno / perdite', 'gain / losses'), 'gain / losses'], descr: ['modi longitudinali sotto la curva di guadagno', 'longitudinal modes under the gain curve'] });
      var Nu = Math.min(N, 400), I = null, Mm = 900, per = 2;
      if (Nu > 0) { var f = st.fasi === 'bloccate' ? fasiNulle(Nu) : fasiCasuali(Nu, st.seme); I = intensita(Nu, f, Mm, per); }
      var Trt = 2 * L / C0, tx = [], ty = [], media = Nu; for (i = 0; i < Mm; i++) { tx.push(i / Mm * per * Trt * 1e9); ty.push(I ? I[i] / Math.max(1, media) : 0); }
      F.grafico(ci, { serie: [{ x: tx, y: ty, col: st.fasi === 'bloccate' ? '#5eead4' : '#c9b9ff', larg: 1.5, etich: 'I/⟨I⟩' }], linee: [{ y: 1, col: '#8494a8', etich: t('media', 'mean') }], xmin: 0, xmax: per * Trt * 1e9, ymin: 0, xl: ['t (ns)', 't (ns)'], yl: ['I / ⟨I⟩', 'I / ⟨I⟩'], descr: ['intensità nel tempo, somma dei modi', 'intensity versus time, sum of modes'] });
      var w = I && st.fasi === 'bloccate' ? fwhm(I, Mm, per) * Trt : 0, picco = 0; if (I) for (i = 0; i < Mm; i++) picco = Math.max(picco, I[i]);
      info.innerHTML = 'Δν = c/2L = <b class="bsiFX-num">' + fmt(M.dnu / 1e6) + ' MHz</b> · ' + t('modi che superano le perdite ', 'modes above losses ') + 'N = <b class="bsiFX-num">' + N + '</b>' + (N > 400 ? t(' (sommati i primi 400)', ' (first 400 summed)') : '') + '<br>' + t('periodo di andata e ritorno ', 'round-trip time ') + '2L/c = ' + fmt(Trt * 1e9) + ' ns · ' + t('picco ', 'peak ') + 'I/⟨I⟩ = ' + fmt(picco / Math.max(1, Nu)) + (w ? ' · ' + t('impulso ', 'pulse ') + 'FWHM ≈ ' + fmt(w * 1e12) + ' ps (≈ 0,886·2L/(cN) = ' + fmt(0.886 * Trt / Nu * 1e12) + ' ps)' : '') + '<br>' +
        t('Le onde stazionarie della cavità hanno frequenze ν_q = q c/2L. Il mezzo attivo (qui un laser a gas He–Ne a 632,8 nm, ν₀ = 473,6 THz) amplifica solo in una banda allargata per effetto Doppler, una gaussiana; lasano i modi il cui guadagno supera le perdite. Con fasi casuali l’intensità fluttua come un rumore attorno al valore medio N; con le fasi bloccate i modi interferiscono costruttivamente una volta per giro: impulsi di altezza N² volte quella di un modo e durata ≈ 2L/(cN). Più larga la banda, più corti gli impulsi: Ti:zaffiro con 100 THz di banda arriva a pochi femtosecondi.', 'The cavity standing waves have frequencies ν_q = q c/2L. The active medium (here a He–Ne gas laser at 632.8 nm, ν₀ = 473.6 THz) amplifies only within a Doppler-broadened band, a Gaussian; the modes whose gain exceeds losses lase. With random phases the intensity fluctuates like noise around the mean N; with locked phases the modes interfere constructively once per round trip: pulses N² times as high as a single mode and ≈ 2L/(cN) long. The wider the band, the shorter the pulses: Ti:sapphire with 100 THz of bandwidth reaches a few femtoseconds.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. atomo a due livelli ════════════════════════════════════════════ */
  function proietta(R, az, el) { var ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el), x = R[0] * ca - R[1] * sa, y = R[0] * sa + R[1] * ca; return [x, R[2] * ce - y * se, R[2] * se + y * ce]; }
  function schedaRabi(div) {
    var G = griglia(div), st = { Om: 1, De: 0, T1: 0, az: 0.6 }, info = nota(G.pan), R, tt, scia, punti;
    F.cursore(G.pan, ['frequenza di Rabi Ω (unità arbitrarie)', 'Rabi frequency Ω (arbitrary units)'], 0.1, 3, 0.05, st.Om, function (v) { st.Om = v; azzera(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['disaccordo Δ = ω − ω₀', 'detuning Δ = ω − ω₀'], -3, 3, 0.05, st.De, function (v) { st.De = v; azzera(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['smorzamento Γ = 1/T₁ (T₂ = 2T₁)', 'damping Γ = 1/T₁ (T₂ = 2T₁)'], 0, 1, 0.01, st.T1, function (v) { st.T1 = v; azzera(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cs = F.tela(G.dx, 0.75), cp = F.tela(G.dx, 0.4);
    cs.addEventListener('pointermove', function (e) { if (e.buttons) { st.az += e.movementX * 0.01; } });
    function azzera() { R = [0, 0, -1]; tt = 0; scia = []; punti = [[0, 0]]; testo(); if (ctl) ctl.sveglia(); }
    function testo() {
      var OR = Math.sqrt(st.Om * st.Om + st.De * st.De);
      info.innerHTML = 'Ω_R = √(Ω² + Δ²) = <b class="bsiFX-num">' + fmt(OR) + '</b> · ' + t('massimo ', 'maximum ') + 'Ω²/Ω_R² = <b class="bsiFX-num">' + fmt(st.Om * st.Om / (OR * OR)) + '</b>' + (st.T1 > 0 ? ' · ' + t('stazionario ', 'steady state ') + 'ρ_ee = ' + fmt(rhoStaz(st.Om, st.De, st.T1)) : '') + '<br>' +
        'P_e(t) = (Ω²/Ω_R²) sin²(Ω_R t/2) · ' + t('impulso π: ', 'π pulse: ') + 't = π/Ω = ' + fmt(Math.PI / st.Om) + '<br>' +
        t('Un atomo a due livelli in un campo quasi risonante oscilla coerentemente fra fondamentale ed eccitato: a risonanza l’inversione è completa, con disaccordo l’oscillazione è più rapida ma parziale. Sulla sfera di Bloch lo stato (u, v, w) precede attorno al vettore (Ω, 0, Δ), come uno spin in un campo magnetico (NMR: è la stessa matematica). Con l’emissione spontanea (T₁) e la perdita di coerenza (T₂) il vettore si accorcia e spiraleggia verso uno stato stazionario dentro la sfera: anche con campo fortissimo ρ_ee non supera ½, per questo un sistema a due livelli non può fare da laser. Linea gialla: formula; punti: Schrödinger integrata con RK4 (senza smorzamento) o equazioni di Bloch (con smorzamento). Trascina la sfera per ruotarla.',
          'A two-level atom in a near-resonant field oscillates coherently between ground and excited states: at resonance the inversion is complete, with detuning the oscillation is faster but partial. On the Bloch sphere the state (u, v, w) precesses around the vector (Ω, 0, Δ), like a spin in a magnetic field (NMR: the same mathematics). With spontaneous emission (T₁) and dephasing (T₂) the vector shrinks and spirals towards a steady state inside the sphere: even with a very strong field ρ_ee never exceeds ½, which is why a two-level system cannot lase. Yellow line: formula; points: Schrödinger equation integrated with RK4 (no damping) or Bloch equations (with damping). Drag the sphere to rotate it.');
    }
    var ctl = null; azzera();
    ctl = F.anima(cs, function (dt) {
      var T1 = st.T1 > 0 ? 1 / st.T1 : 0, f = bloch(st.Om, st.De, T1, 2 * T1), n = Math.max(1, Math.ceil(dt * 2 / 0.005));
      for (var k = 0; k < n && tt < 40; k++) { R = rk4(f, R, dt * 2 / n); tt += dt * 2 / n; }
      scia.push(R.slice()); if (scia.length > 500) scia.shift(); punti.push([tt, (R[2] + 1) / 2]);
      var P = F.pennello(cs), q = P.q, W = P.W, H = P.H, cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.4, el = 0.35;
      var pr = function (v) { var p = proietta(v, st.az, el); return [cx + r * p[0], cy - r * p[1], p[2]]; };
      q.strokeStyle = '#34465f'; q.beginPath(); q.arc(cx, cy, r, 0, 2 * Math.PI); q.stroke();
      [[function (a) { return [Math.cos(a), Math.sin(a), 0]; }, '#2a4a6e'], [function (a) { return [Math.cos(a), 0, Math.sin(a)]; }, '#1f3550'], [function (a) { return [0, Math.cos(a), Math.sin(a)]; }, '#1f3550']].forEach(function (c) { q.strokeStyle = c[1]; q.beginPath(); for (var i = 0; i <= 120; i++) { var p = pr(c[0](2 * Math.PI * i / 120)); if (i) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); } q.stroke(); });
      [[[1.2, 0, 0], 'u'], [[0, 1.2, 0], 'v'], [[0, 0, 1.2], '|e⟩'], [[0, 0, -1.25], '|g⟩']].forEach(function (a) { var p = pr(a[0]), o = pr([0, 0, 0]); q.strokeStyle = '#4a5f7a'; q.beginPath(); q.moveTo(o[0], o[1]); q.lineTo(p[0], p[1]); q.stroke(); q.fillStyle = '#9fb1c6'; q.font = '12px system-ui'; q.textAlign = 'center'; q.fillText(a[1], p[0], p[1] - 4); });
      var OR = Math.sqrt(st.Om * st.Om + st.De * st.De), ax = pr([st.Om / OR, 0, st.De / OR]), o0 = pr([0, 0, 0]);
      q.strokeStyle = '#ff8a80'; q.setLineDash([4, 3]); q.beginPath(); q.moveTo(o0[0], o0[1]); q.lineTo(ax[0], ax[1]); q.stroke(); q.setLineDash([]);
      q.strokeStyle = 'rgba(255,196,90,.6)'; q.beginPath(); scia.forEach(function (v, i) { var p = pr(v); if (i) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); }); q.stroke();
      var pv = pr(R); q.strokeStyle = '#ffd24a'; q.lineWidth = 3; q.beginPath(); q.moveTo(o0[0], o0[1]); q.lineTo(pv[0], pv[1]); q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(pv[0], pv[1], 5, 0, 2 * Math.PI); q.fill();
      q.fillStyle = '#c9d3df'; q.textAlign = 'left'; q.font = '11px system-ui'; q.fillText('|R| = ' + Math.sqrt(R[0] * R[0] + R[1] * R[1] + R[2] * R[2]).toFixed(3), 8, 16);
      cs.setAttribute('aria-label', t('sfera di Bloch con il vettore di stato che precede', 'Bloch sphere with the precessing state vector'));
      var xs = [], ys = []; for (var s = 0; s <= 40; s += 0.05) { xs.push(s); ys.push(rabi(st.Om, st.De, s)); }
      var pts = punti.filter(function (p, i) { return i % 6 === 0; }).map(function (p) { return { x: p[0], y: p[1], col: '#5eead4', r: 2.5 }; });
      F.grafico(cp, { serie: st.T1 > 0 ? [] : [{ x: xs, y: ys, col: '#ffd24a', larg: 1.5, etich: 'Rabi' }], punti: pts, xmin: 0, xmax: 40, ymin: 0, ymax: 1.05, xl: ['t', 't'], yl: ['P_e', 'P_e'], descr: ['probabilità di eccitazione nel tempo', 'excitation probability over time'], linee: st.T1 > 0 ? [{ y: rhoStaz(st.Om, st.De, st.T1), col: '#ff8a80', etich: t('stazionario', 'steady state') }] : [] });
      if (tt >= 40) return false;
    }, { ricomincia: azzera });
  }

  /* ═══ 4. Mach–Zehnder a fotoni singoli ══════════════════════════════════ */
  function schedaMZ(div) {
    var G = griglia(div), st = { D: 0, vel: 20, seme: 11 }, info = nota(G.pan), NB = 48, PER = 120, gen, c1, c2, bin, nel, ultimo, ph = [];
    for (var i = 0; i < NB; i++) ph.push(4 * Math.PI * (i + 0.5) / NB);
    F.cursore(G.pan, ['informazione sul cammino D', 'which-path information D'], 0, 1, 0.01, st.D, function (v) { st.D = v; azzera(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['fotoni per fotogramma', 'photons per frame'], 1, 200, 1, st.vel, function (v) { st.vel = v; });
    F.bottone(G.pan, ['Cammino noto (D = 1)', 'Path known (D = 1)'], function () { st.D = 1; azzera(); });
    F.bottone(G.pan, ['Nuovo seme', 'New seed'], function () { st.seme = (Math.random() * 1e9) | 0; azzera(); });
    G.pan.appendChild(info);
    var cs = F.tela(G.dx, 0.45), ch = F.tela(G.dx, 0.42);
    function azzera() { gen = fotoni(st.seme); c1 = new Float64Array(NB); c2 = new Float64Array(NB); bin = 0; nel = 0; ultimo = null; if (ctl) ctl.sveglia(); }
    var ctl = null; azzera();
    ctl = F.anima(cs, function (dt) {
      if (dt > 0) for (var k = 0; k < st.vel && bin < NB; k++) { var d = gen(ph[bin], st.D); if (d === 1) c1[bin]++; else c2[bin]++; ultimo = d; nel++; if (nel >= PER) { nel = 0; bin++; } }
      var phi = ph[Math.min(bin, NB - 1)];
      /* lo schema: sorgente, divisore, specchi, sfasatore, divisore, due rivelatori */
      var P = F.pennello(cs), q = P.q, W = P.W, H = P.H, x0 = W * 0.12, x1 = W * 0.7, y0 = H * 0.72, y1 = H * 0.22;
      q.strokeStyle = 'rgba(255,138,128,.55)'; q.lineWidth = 2; q.beginPath(); q.moveTo(16, y0); q.lineTo(x0, y0); q.lineTo(x1, y0); q.lineTo(x1, y1 - 30); q.moveTo(x0, y0); q.lineTo(x0, y1); q.lineTo(W - 30, y1); q.stroke(); q.lineWidth = 1;
      var bs = function (x, y) { q.strokeStyle = '#6bcfff'; q.lineWidth = 3; q.beginPath(); q.moveTo(x - 12, y + 12); q.lineTo(x + 12, y - 12); q.stroke(); q.lineWidth = 1; };
      bs(x0, y0); bs(x1, y1);
      q.strokeStyle = '#c9d3df'; q.lineWidth = 4; q.beginPath(); q.moveTo(x0 - 12, y1 + 12); q.lineTo(x0 + 12, y1 - 12); q.moveTo(x1 - 12, y0 + 12); q.lineTo(x1 + 12, y0 - 12); q.stroke(); q.lineWidth = 1;
      q.fillStyle = 'rgba(201,185,255,.5)'; q.fillRect((x0 + x1) / 2 - 10, y1 - 12, 20, 24);
      q.fillStyle = '#c9b9ff'; q.font = '11px system-ui'; q.textAlign = 'center'; q.fillText('φ = ' + (phi / Math.PI).toFixed(2) + 'π', (x0 + x1) / 2, y1 - 18);
      var det = function (x, y, n, on) { q.fillStyle = on ? '#ffd24a' : '#34465f'; q.beginPath(); q.arc(x, y, 11, 0, 2 * Math.PI); q.fill(); q.fillStyle = '#c9d3df'; q.fillText('D' + n, x, y + 26); };
      det(W - 22, y1, 1, ultimo === 1); det(x1, y1 - 40, 2, ultimo === 2);
      if (st.D > 0) { q.fillStyle = 'rgba(255,138,128,' + (0.25 + 0.6 * st.D) + ')'; q.beginPath(); q.arc(x0, (y0 + y1) / 2, 7, 0, 2 * Math.PI); q.fill(); q.fillStyle = '#ff8a80'; q.textAlign = 'left'; q.fillText(t('marcatore di cammino', 'path marker'), x0 + 10, (y0 + y1) / 2 + 4); }
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(20, y0, 5, 0, 2 * Math.PI); q.fill();
      q.fillStyle = '#9fb1c6'; q.textAlign = 'left'; q.fillText(t('sorgente a fotone singolo', 'single-photon source'), 8, H - 8);
      cs.setAttribute('aria-label', t('interferometro di Mach–Zehnder con fotoni singoli', 'Mach–Zehnder interferometer with single photons'));
      var xs = [], v1 = [], v2 = [], xt = [], yt = [], used = Math.min(bin, NB);
      for (i = 0; i < used; i++) { xs.push(ph[i] / Math.PI); v1.push(c1[i]); v2.push(c2[i]); }
      for (var p = 0; p <= 4 * Math.PI + 1e-9; p += Math.PI / 50) { xt.push(p / Math.PI); yt.push(PER * pMZ(p, st.D)); }
      var vis = used >= 8 ? visibilita(ph.slice(0, used), Array.prototype.slice.call(c1, 0, used)) : null;
      F.grafico(ch, { serie: [{ x: xt, y: yt, col: '#8494a8', larg: 1, tratt: true, etich: [t('atteso', 'expected'), 'expected'] }], punti: xs.map(function (x, j) { return { x: x, y: v1[j], col: '#ffd24a', r: 3.5 }; }).concat(xs.map(function (x, j) { return { x: x, y: v2[j], col: '#6bcfff', r: 3.5 }; })), xmin: 0, xmax: 4, ymin: 0, ymax: PER * 1.05, xl: ['φ / π', 'φ / π'], yl: [t('conteggi', 'counts'), 'counts'], descr: ['conteggi dei due rivelatori contro la fase', 'counts of the two detectors versus phase'], legenda: [{ col: '#ffd24a', etich: ['D1', 'D1'] }, { col: '#6bcfff', etich: ['D2', 'D2'] }] });
      info.innerHTML = t('Fotoni ', 'Photons ') + '<b class="bsiFX-num">' + (used * PER + nel) + '</b> · ' + t('visibilità misurata ', 'measured visibility ') + 'V = <b class="bsiFX-num">' + (vis ? vis.V.toFixed(3) : '…') + '</b> · ' + t('attesa ', 'expected ') + '√(1 − D²) = ' + Math.sqrt(1 - st.D * st.D).toFixed(3) + '<br>' +
        'P(D1) = ½[1 + V cos φ], P(D2) = ½[1 − V cos φ]<br>' +
        t('Ogni fotone arriva da solo e fa scattare un solo rivelatore: un evento puntiforme, casuale. Ma la statistica di molti fotoni ricostruisce le frange cos²(φ/2): ciascun fotone «interferisce con se stesso» perché le ampiezze dei due cammini si sommano. Se un marcatore (per esempio la polarizzazione) rivela da che parte è passato, le ampiezze non interferiscono più e ogni rivelatore conta metà dei fotoni a ogni fase. Con informazione parziale D vale la relazione di Englert V² + D² ≤ 1: tanta conoscenza del cammino, tanta perdita di frange. Il generatore casuale ha un seme fisso, quindi la sequenza è riproducibile.', 'Each photon arrives alone and fires a single detector: a point-like random event. But the statistics of many photons rebuild the cos²(φ/2) fringes: each photon “interferes with itself” because the amplitudes of the two paths add. If a marker (for instance polarisation) reveals which way it went, the amplitudes no longer interfere and each detector counts half of the photons at every phase. With partial information D Englert’s relation V² + D² ≤ 1 holds: as much path knowledge, as much fringe loss. The random generator has a fixed seed, so the sequence is reproducible.');
      if (bin >= NB) return false;
    }, { ricomincia: azzera });
  }

  F.sezione('sfislaser', {
    titolo: ['🔦 Laser e ottica quantistica', '🔦 Lasers and quantum optics'],
    sotto: ['Le equazioni di bilancio di un laser con soglia e oscillazioni di rilassamento, i modi della cavità e il mode locking, le oscillazioni di Rabi sulla sfera di Bloch, i fotoni singoli in un interferometro di Mach–Zehnder.', 'Laser rate equations with threshold and relaxation oscillations, cavity modes and mode locking, Rabi oscillations on the Bloch sphere, single photons in a Mach–Zehnder interferometer.'],
    schede: [
      { nome: ['⚡ Bilancio e soglia', '⚡ Rate equations'], costruisci: schedaBilancio },
      { nome: ['🎼 Modi della cavità', '🎼 Cavity modes'], costruisci: schedaModi },
      { nome: ['🌐 Rabi e Bloch', '🌐 Rabi and Bloch'], costruisci: schedaRabi },
      { nome: ['🔀 Mach–Zehnder', '🔀 Mach–Zehnder'], costruisci: schedaMZ }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
