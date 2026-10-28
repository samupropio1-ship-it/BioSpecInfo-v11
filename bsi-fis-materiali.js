/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-materiali.js — 🧱 elasticita' e materiali
   BioSpecInfo · © Samuele Pio Provenzano

   La meccanica dei solidi deformabili come la incontra chi studia fisica,
   ingegneria o scienza dei materiali:

   · LA PROVA DI TRAZIONE: curve sforzo–deformazione nominali e vere di
     acciaio dolce (con il pianerottolo di snervamento), alluminio 6061-T6,
     rame ricotto e gomma (neo-hookeana, σ = μ(λ − λ⁻²)). Modulo di Young,
     snervamento, carico di rottura, strizione, energia assorbita (area
     sotto la curva). In 3D il provino che si allunga, si assottiglia
     (Poisson, poi volume costante) e fa il collo, colorato per sforzo;
   · LE TRAVI: mensola e trave appoggiata con carico concentrato o
     distribuito. Taglio V e momento M dall'equilibrio, la linea elastica
     integrando due volte EI y'' = M con le condizioni al contorno, confrontata
     con le formule chiuse (PL³/3EI, 5qL⁴/384EI…). Il momento d'inerzia di
     rettangolo (bh³/12), profilo a I e tubo, verificato con l'integrale a
     strisce. In 3D la trave deformata (spostamenti amplificati) colorata con
     σ = M y/I: trazione rossa, compressione blu;
   · L'INSTABILITA' DI EULERO: P_cr = π²EI/(KL)² per i quattro vincoli
     (incastro-libero K = 2, cerniere K = 1, incastro-cerniera K = 0,699,
     incastri K = 0,5): rapporti 0,25 : 1 : 2,046 : 4. I K sono ritrovati
     cercando lo zero del determinante 4×4 della soluzione generale
     y = A sin kx + B cos kx + Cx + D; in 3D quattro colonne caricate insieme
     che si inflettono ciascuna oltre il proprio carico critico;
   · IL SUONO NEI SOLIDI: onde longitudinali c_L = √(E(1−ν)/(ρ(1+ν)(1−2ν))),
     trasversali c_T = √(G/ρ), in una barra sottile √(E/ρ) (acciaio ≈ 5900 e
     3200 m/s). In 3D un blocco con un'onda P e un'onda S che corrono.

   I calcoli (F.calcolo.materiali) sono funzioni pure; il banco li confronta
   con le forme chiuse e con integrazioni numeriche indipendenti.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI;

  /* ═══ materiali ══════════════════════════════════════════════════════════ */
  /* E (GPa), ν, ρ (kg/m³), σ_y e σ_UTS (MPa), ε_u (deformazione al carico massimo), ε_f (rottura) */
  var MAT = {
    acciaio: { nome: ['Acciaio dolce (S235)', 'Mild steel (S235)'], E: 207, nu: 0.29, rho: 7850, sy: 250, uts: 400, eu: 0.18, ef: 0.28, plateau: 0.015, col: '#9fb1c6' },
    alluminio: { nome: ['Alluminio 6061-T6', 'Aluminium 6061-T6'], E: 69, nu: 0.33, rho: 2700, sy: 276, uts: 310, eu: 0.08, ef: 0.12, plateau: 0, col: '#cfe3f7' },
    rame: { nome: ['Rame ricotto', 'Annealed copper'], E: 117, nu: 0.34, rho: 8960, sy: 70, uts: 220, eu: 0.35, ef: 0.45, plateau: 0, col: '#d9895b' },
    gomma: { nome: ['Gomma naturale', 'Natural rubber'], E: 0.0015, nu: 0.4999, rho: 920, mu: 0.5, lambdaF: 6, col: '#ffd24a' }
  };
  /* curva nominale σ(ε) in MPa */
  function sforzo(m, eps) {
    if (eps <= 0) return 0;
    if (m.mu) { var l = 1 + eps; return l > m.lambdaF ? NaN : m.mu * (l - 1 / (l * l)); }
    var E = m.E * 1000, ey = m.sy / E;
    if (eps <= ey) return E * eps;
    if (eps > m.ef) return NaN;
    var ep = ey + m.plateau;
    if (eps <= ep) return m.sy;
    if (eps <= m.eu) {
      /* incrudimento: Voce σ = σ_y + (σ_UTS − σ_y)(1 − e^(−(ε−ε_p)/k)) / (1 − e^(−(ε_u−ε_p)/k)) */
      var k = (m.eu - ep) / 3; return m.sy + (m.uts - m.sy) * (1 - Math.exp(-(eps - ep) / k)) / (1 - Math.exp(-(m.eu - ep) / k));
    }
    /* strizione: la forza cala fino all'80 % del massimo alla rottura */
    var u = (eps - m.eu) / (m.ef - m.eu); return m.uts * (1 - 0.2 * u * u);
  }
  function deformazioneMax(m) { return m.mu ? m.lambdaF - 1 : m.ef; }
  /* vera: σ_v = σ(1 + ε), ε_v = ln(1 + ε) (volume costante, valida fino alla strizione) */
  function vera(m, eps) { return { s: sforzo(m, eps) * (1 + eps), e: Math.log(1 + eps) }; }
  function tenacita(m) { var a = deformazioneMax(m); return simpson(function (e) { var s = sforzo(m, e); return isFinite(s) ? s : 0; }, 0, a * 0.99999, 20000); } /* MJ/m³ */
  function resilienza(m) { return m.mu ? NaN : m.sy * m.sy / (2 * m.E * 1000); }
  function simpson(f, a, b, n) { n = n || 2000; if (n % 2) n++; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }

  /* ═══ sezioni ════════════════════════════════════════════════════════════ */
  /* dimensioni in mm; I in mm⁴, A in mm², c = distanza della fibra piu' lontana */
  function sezione(tipo, d) {
    if (tipo === 'rett') return { A: d.b * d.h, I: d.b * Math.pow(d.h, 3) / 12, c: d.h / 2, H: d.h, B: d.b };
    if (tipo === 'I') { var hw = d.H - 2 * d.tf; return { A: 2 * d.B * d.tf + hw * d.tw, I: (d.B * Math.pow(d.H, 3) - (d.B - d.tw) * Math.pow(hw, 3)) / 12, c: d.H / 2, H: d.H, B: d.B }; }
    return { A: PI / 4 * (d.D * d.D - d.d * d.d), I: PI / 64 * (Math.pow(d.D, 4) - Math.pow(d.d, 4)), c: d.D / 2, H: d.D, B: d.D };
  }
  /* larghezza della sezione all'altezza y (dal baricentro), per l'integrale a strisce */
  function larghezza(tipo, d, y) {
    var a = Math.abs(y);
    if (tipo === 'rett') return a <= d.h / 2 ? d.b : 0;
    if (tipo === 'I') return a > d.H / 2 ? 0 : a > d.H / 2 - d.tf ? d.B : d.tw;
    var R = d.D / 2, r = d.d / 2; if (a > R) return 0; return 2 * Math.sqrt(R * R - a * a) - (a < r ? 2 * Math.sqrt(r * r - a * a) : 0);
  }
  function inerziaStrisce(tipo, d, n) { var s = sezione(tipo, d), h = s.H / 2, N = n || 20000, dy = 2 * h / N, I = 0, A = 0; for (var i = 0; i < N; i++) { var y = -h + (i + 0.5) * dy, b = larghezza(tipo, d, y); I += b * y * y * dy; A += b * dy; } return { I: I, A: A }; }

  /* ═══ travi ══════════════════════════════════════════════════════════════ */
  /* vincolo: 'mensola' (incastro in x = 0) o 'appoggiata'; P (N) in x = a; q (N/m) uniforme; EI (N m²)
     taglio e momento integrando il carico a partire dalle reazioni, poi y'' = M/EI integrata due volte */
  function trave(vincolo, L, P, a, q, EI, N) {
    N = N || 2000; var h = L / N, x = [], V = [], M = [], th = [], y = [], i;
    var R0, M0;
    if (vincolo === 'mensola') { R0 = P + q * L; M0 = -(P * a + q * L * L / 2); }
    else { R0 = P * (L - a) / L + q * L / 2; M0 = 0; }
    for (i = 0; i <= N; i++) { var xi = i * h; x.push(xi); V.push(R0 - q * xi - (xi > a + 1e-12 ? P : 0)); }
    /* M' = V integrato esattamente su ogni intervallo (V e' lineare a tratti, con il salto P in a) */
    M.push(M0); for (i = 1; i <= N; i++) { var x0 = x[i - 1], x1 = x[i]; M.push(M[i - 1] + R0 * h - q * (x1 * x1 - x0 * x0) / 2 - P * Math.max(0, x1 - Math.max(a, x0))); }
    th.push(0); y.push(0);
    for (i = 1; i <= N; i++) { th.push(th[i - 1] + 0.5 * h * (M[i - 1] + M[i]) / EI); y.push(y[i - 1] + 0.5 * h * (th[i - 1] + th[i])); }
    if (vincolo === 'appoggiata') { var c = y[N] / L; for (i = 0; i <= N; i++) { y[i] -= c * x[i]; th[i] -= c; } }
    var ymin = 0, xm = 0, Mmax = 0; for (i = 0; i <= N; i++) { if (y[i] < ymin) { ymin = y[i]; xm = x[i]; } if (Math.abs(M[i]) > Math.abs(Mmax)) Mmax = M[i]; }
    return { x: x, V: V, M: M, y: y, freccia: -ymin, xFreccia: xm, Mmax: Mmax, R0: R0, M0: M0 };
  }
  function frecciaChiusa(vincolo, carico, L, P, q, EI) {
    if (vincolo === 'mensola') return carico === 'conc' ? P * L * L * L / (3 * EI) : q * Math.pow(L, 4) / (8 * EI);
    return carico === 'conc' ? P * L * L * L / (48 * EI) : 5 * q * Math.pow(L, 4) / (384 * EI);
  }

  /* ═══ Eulero ═════════════════════════════════════════════════════════════ */
  var VINCOLI = { ll: ['incastro–libero', 'fixed–free', 2], cc: ['cerniera–cerniera', 'pinned–pinned', 1], ic: ['incastro–cerniera', 'fixed–pinned', 0.6992], ii: ['incastro–incastro', 'fixed–fixed', 0.5] };
  function caricoCritico(E, I, L, K) { return PI * PI * E * I / Math.pow(K * L, 2); }
  /* le condizioni al contorno su y = A sin kx + B cos kx + Cx + D, con L = 1; ogni riga e' una condizione */
  function righe(tipo, k) {
    var s = Math.sin(k), c = Math.cos(k);
    var y0 = [0, 1, 0, 1], dy0 = [k, 0, 1, 0], d2y0 = [0, -k * k, 0, 0];
    var y1 = [s, c, 1, 1], dy1 = [k * c, -k * s, 1, 0], d2y1 = [-k * k * s, -k * k * c, 0, 0];
    /* estremo libero: y'' = 0 e y''' + k² y' = 0 (taglio nullo) */
    var tg1 = [-k * k * k * c + k * k * k * c, k * k * k * s - k * k * k * s, k * k, 0];
    if (tipo === 'cc') return [y0, d2y0, y1, d2y1];
    if (tipo === 'ii') return [y0, dy0, y1, dy1];
    if (tipo === 'ic') return [y0, dy0, y1, d2y1];
    return [y0, dy0, d2y1, tg1];
  }
  function det4(m) {
    var a = m.map(function (r) { return r.slice(); }), d = 1;
    for (var i = 0; i < 4; i++) {
      var p = i; for (var r = i + 1; r < 4; r++) if (Math.abs(a[r][i]) > Math.abs(a[p][i])) p = r;
      if (Math.abs(a[p][i]) < 1e-300) return 0;
      if (p !== i) { var tt = a[p]; a[p] = a[i]; a[i] = tt; d = -d; }
      d *= a[i][i];
      for (r = i + 1; r < 4; r++) { var f = a[r][i] / a[i][i]; for (var c = i; c < 4; c++) a[r][c] -= f * a[i][c]; }
    }
    return d;
  }
  /* primo k > 0 con det = 0: scansione per cambi di segno, poi bisezione; K = π/k */
  function kCritico(tipo) {
    var f = function (k) { return det4(righe(tipo, k)); }, pk = 0.05, pv = f(pk);
    for (var k = 0.05; k < 12; k += 0.005) {
      var v = f(k);
      if (pv * v < 0) { var lo = pk, hi = k; for (var j = 0; j < 100; j++) { var m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; }
      pk = k; pv = v;
    }
    return NaN;
  }
  /* la forma del modo: il vettore nullo (A, B, C, D) fissando una componente */
  function modo(tipo, n) {
    var k = kCritico(tipo), R = righe(tipo, k), best = null;
    for (var fisso = 0; fisso < 4 && !best; fisso++) {
      /* risolvi le prime tre righe indipendenti con la componente «fisso» = 1 */
      var idx = [0, 1, 2, 3].filter(function (i) { return i !== fisso; }), sistemi = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
      for (var s = 0; s < 4 && !best; s++) {
        var r = sistemi[s], M = r.map(function (ri) { return idx.map(function (ci) { return R[ri][ci]; }); }), b = r.map(function (ri) { return -R[ri][fisso]; });
        var D3 = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
        if (Math.abs(D3) < 1e-8) continue;
        var sol = [0, 1, 2].map(function (j) { var Mj = M.map(function (riga, ii) { var c = riga.slice(); c[j] = b[ii]; return c; }); return (Mj[0][0] * (Mj[1][1] * Mj[2][2] - Mj[1][2] * Mj[2][1]) - Mj[0][1] * (Mj[1][0] * Mj[2][2] - Mj[1][2] * Mj[2][0]) + Mj[0][2] * (Mj[1][0] * Mj[2][1] - Mj[1][1] * Mj[2][0])) / D3; });
        var v = [0, 0, 0, 0]; v[fisso] = 1; idx.forEach(function (ci, j) { v[ci] = sol[j]; }); best = v;
      }
    }
    var pts = [], mx = 0; n = n || 60;
    for (var i = 0; i <= n; i++) { var x = i / n, y = best[0] * Math.sin(k * x) + best[1] * Math.cos(k * x) + best[2] * x + best[3]; pts.push(y); mx = Math.max(mx, Math.abs(y)); }
    return { k: k, y: pts.map(function (y) { return y / mx; }) };
  }

  /* ═══ suono ══════════════════════════════════════════════════════════════ */
  function velocitaSuono(m) {
    var E = m.E * 1e9, nu = m.nu, r = m.rho, G = E / (2 * (1 + nu)), K = E / (3 * (1 - 2 * nu));
    return { L: Math.sqrt(E * (1 - nu) / (r * (1 + nu) * (1 - 2 * nu))), T: Math.sqrt(G / r), barra: Math.sqrt(E / r), G: G, K: K };
  }
  /* catena di masse e molle (una barra discretizzata): un impulso gaussiano e la sua velocita' misurata */
  function catenaVelocita(E, rho, a, N, passi) {
    var k = E * a, m = rho * a * a * a, x = new Float64Array(N), v = new Float64Array(N), dt = 0.2 * Math.sqrt(m / k), i, j;
    /* condizione iniziale: un'onda che viaggia verso destra (u(x − ct)), v = −c u' */
    var c0 = a * Math.sqrt(k / m), x0 = N * 0.2, w = 12;
    for (i = 0; i < N; i++) { var z = (i - x0) / w; x[i] = Math.exp(-z * z) * a; v[i] = c0 * 2 * z / w * Math.exp(-z * z); }
    function picco() { var b = 0, bi = 0; for (var q = 0; q < N; q++) if (x[q] > b) { b = x[q]; bi = q; } var y1 = x[bi - 1], y2 = x[bi], y3 = x[bi + 1]; return bi + 0.5 * (y1 - y3) / (y1 - 2 * y2 + y3); }
    var p0 = picco(), acc = new Float64Array(N);
    function forze() { for (var q = 0; q < N; q++) { var s = 0; if (q > 0) s += k * (x[q - 1] - x[q]); if (q < N - 1) s += k * (x[q + 1] - x[q]); acc[q] = s / m; } }
    forze();
    for (j = 0; j < passi; j++) { for (i = 0; i < N; i++) { v[i] += 0.5 * dt * acc[i]; x[i] += dt * v[i]; } forze(); for (i = 0; i < N; i++) v[i] += 0.5 * dt * acc[i]; }
    return { misurata: (picco() - p0) * a / (passi * dt), teorica: Math.sqrt(E / rho) };
  }

  F.calcolo.materiali = {
    MAT: MAT, sforzo: sforzo, vera: vera, tenacita: tenacita, resilienza: resilienza, deformazioneMax: deformazioneMax, simpson: simpson,
    sezione: sezione, larghezza: larghezza, inerziaStrisce: inerziaStrisce, trave: trave, frecciaChiusa: frecciaChiusa,
    VINCOLI: VINCOLI, caricoCritico: caricoCritico, kCritico: kCritico, modo: modo, det4: det4,
    velocitaSuono: velocitaSuono, catenaVelocita: catenaVelocita
  };

  /* ═══ interfaccia ═══════════════════════════════════════════════════════ */
  if (!globale.document || !globale.document.createElement) return;
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function eq(pan, testo) { var e = F.el('div', { 'class': 'bsiFX-eq', testo: testo }); pan.appendChild(e); return e; }
  function scheda3D(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        attesa.remove();
        var S = new L3.Scena(destra, 0.58);
        /* nelle schede nascoste la scena non si ridimensiona (riallocare il framebuffer costa) */
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  /* scala divergente: −1 blu, 0 grigio chiaro, +1 rosso */
  function divergente(f) { f = Math.max(-1, Math.min(1, f)); return f >= 0 ? [0.85 + 0.15 * f, 0.85 - 0.6 * f, 0.85 - 0.65 * f] : [0.85 + 0.65 * f, 0.85 + 0.35 * f, 0.85 - 0.1 * f]; }
  function caldo(f) { f = Math.max(0, Math.min(1, f)); var st = [[0.2, 0.35, 0.8], [0.2, 0.75, 0.85], [0.95, 0.85, 0.3], [1, 0.3, 0.2]], x = f * 3, i = Math.min(2, Math.floor(x)), u = x - i, a = st[i], b = st[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }

  /* ─── 1. Prova di trazione ─────────────────────────────────────────────── */
  function schedaTrazione(pan, destra) {
    var st = { m: 'acciaio', eps: 0.002, vera: false, gioca: true };
    eq(pan, 'σ = F/A₀,  ε = ΔL/L₀;  σ_v = σ(1+ε),  ε_v = ln(1+ε)');
    F.scelta(pan, ['Materiale', 'Material'], Object.keys(MAT).map(function (k) { return [k, F.tt(MAT[k].nome)]; }), st.m, function (v) { st.m = v; st.eps = 0; disegna(); });
    var cE = F.cursore(pan, ['Deformazione ε (% della rottura)', 'Strain ε (% of fracture)'], 0, 100, 0.5, 0, function (v) { st.eps = deformazioneMax(MAT[st.m]) * v / 100 * 0.999; st.gioca = false; disegna(); });
    F.scelta(pan, ['Curva', 'Curve'], [['nom', t('nominale (ingegneristica)', 'engineering')], ['vera', t('vera', 'true')]], 'nom', function (v) { st.vera = v === 'vera'; disegna(); });
    F.bottone(pan, ['▶ Tira il provino', '▶ Pull the specimen'], function () { st.eps = 0; st.gioca = true; if (cb.sveglia) cb.sveglia(); });
    var info = nota(pan);
    nota(pan, t('Nel tratto elastico la deformazione si recupera e σ = Eε (Hooke); il diametro cala di ν volte l’allungamento. Oltre lo snervamento le dislocazioni scorrono: la deformazione resta, il volume si conserva e il metallo si incrudisce. Al carico massimo inizia la strizione: la deformazione si concentra nel collo, la forza cala (curva nominale) ma lo sforzo vero continua a salire. La gomma è un altro mondo: modulo di 1–2 MPa, allungamenti del 500 %, elasticità entropica delle catene.',
      'In the elastic range the strain is recovered and σ = Eε (Hooke); the diameter shrinks by ν times the elongation. Beyond yield, dislocations glide: the strain stays, volume is conserved and the metal work-hardens. At maximum load necking begins: strain concentrates in the neck, the force drops (engineering curve) but the true stress keeps rising. Rubber is another world: a modulus of 1–2 MPa, 500 % elongations, entropic elasticity of the chains.'));
    var tela = F.tela(destra, 0.5), cb = {};
    function disegna() {
      var m = MAT[st.m], em = deformazioneMax(m), xs = [], ys = [], yv = [], xv = [], i;
      for (i = 0; i <= 600; i++) { var e = em * i / 600 * 0.9999, s = sforzo(m, e); xs.push(100 * e); ys.push(s); var v = vera(m, e); xv.push(100 * v.e); yv.push(v.s); }
      var s0 = sforzo(m, st.eps), p = st.vera ? vera(m, st.eps) : { e: st.eps, s: s0 };
      var serie = st.vera ? [{ x: xs, y: ys, col: '#34465f', tratt: true, etich: t('nominale', 'engineering') }, { x: xv, y: yv, col: m.col, etich: t('vera', 'true') }] : [{ x: xs, y: ys, col: m.col, etich: 'σ(ε)' }];
      F.grafico(tela, { serie: serie, punti: [{ x: 100 * p.e, y: p.s, col: '#ff8a80', r: 5 }], xmin: 0, ymin: 0, xl: ['deformazione ε (%)', 'strain ε (%)'], yl: ['sforzo σ (MPa)', 'stress σ (MPa)'], descr: ['Curva sforzo–deformazione', 'Stress–strain curve'] });
      var ten = tenacita(m);
      info.innerHTML = '<b>' + F.tt(m.nome) + '</b>: E = ' + (m.mu ? (3 * m.mu).toFixed(1) + ' MPa (3μ)' : m.E + ' GPa') + ', ν = ' + m.nu + (m.mu ? '' : ', σ<sub>y</sub> = ' + m.sy + ', σ<sub>UTS</sub> = ' + m.uts + ' MPa') + '<br>' +
        'ε = <b>' + fmt(100 * st.eps) + ' %</b>, σ = <b>' + fmt(s0) + ' MPa</b>' + (st.eps > 0 ? t(' · vera ', ' · true ') + fmt(vera(m, st.eps).s) + ' MPa' : '') + '<br>' +
        t('Tenacità (area sotto la curva): ', 'Toughness (area under the curve): ') + '<b>' + fmt(ten) + ' MJ/m³</b>' + (m.mu ? '' : ' · ' + t('resilienza σ_y²/2E = ', 'resilience σ_y²/2E = ') + fmt(resilienza(m) * 1000) + ' kJ/m³');
      if (cb.aggiorna) cb.aggiorna();
    }
    disegna(); F.alRidimensiona(disegna);
    return {
      tre: function (S, T, L3) {
        /* provino a osso di cane: profilo del raggio lungo l'asse, ruotato (LatheGeometry) */
        var NZ = 90, prof = [];
        function raggi() {
          var m = MAT[st.m], e = st.eps, em = deformazioneMax(m), out = [], L0 = 3, Lc = L0 * (1 + e);
          var nuEff = m.mu ? 0.5 : (e <= m.sy / (m.E * 1000) ? m.nu : 0.5);
          var r0 = 0.32, rc = m.mu ? r0 / Math.sqrt(1 + e) : r0 * (nuEff === 0.5 && e > 0 ? 1 / Math.sqrt(1 + e) : (1 - m.nu * e));
          var collo = (!m.mu && e > m.eu) ? (e - m.eu) / (m.ef - m.eu) : 0;
          for (var i = 0; i <= NZ; i++) {
            var u = i / NZ, z = -Lc / 2 - 1.1 + (Lc + 2.2) * u, zr = z / (Lc / 2), r;
            if (Math.abs(z) > Lc / 2 + 0.35) r = 0.55; else if (Math.abs(z) > Lc / 2) r = rc + (0.55 - rc) * Math.pow((Math.abs(z) - Lc / 2) / 0.35, 2);
            else r = rc * (1 - 0.45 * collo * Math.exp(-zr * zr / 0.03));
            out.push([r, z, Math.abs(z) <= Lc / 2 ? rc / Math.max(0.05, r) : 0]);
          }
          return out;
        }
        var mesh = null, mat = new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.45, roughness: 0.35 });
        var ganascia1 = new T.Mesh(new T.BoxGeometry(1.6, 1.6, 1), new T.MeshStandardMaterial({ color: 0x3a4656, metalness: 0.6, roughness: 0.5 })), ganascia2 = ganascia1.clone();
        S.aggiungi(ganascia1); S.aggiungi(ganascia2);
        var fr1 = L3.freccia(T, [0, 0, 0], [0, 0, 1], 0xff8a80, 0.3), fr2 = L3.freccia(T, [0, 0, 0], [0, 0, -1], 0xff8a80, 0.3); S.aggiungi(fr1); S.aggiungi(fr2);
        cb.aggiorna = function () {
          var m = MAT[st.m], R = raggi(), s = sforzo(m, st.eps), sv = vera(m, st.eps).s, smax = m.mu ? sforzo(m, deformazioneMax(m) * 0.999) * deformazioneMax(m) : m.uts * 1.4;
          var pts = R.map(function (p) { return new T.Vector2(p[0], p[1]); });
          var g = new T.LatheGeometry(pts, 48), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
          for (var i = 0; i < pos.count; i++) {
            /* LatheGeometry: y = coordinata assiale; si cerca il punto di profilo piu' vicino */
            var y = pos.getY(i), k = Math.round((y - R[0][1]) / (R[NZ][1] - R[0][1]) * NZ), f = R[Math.max(0, Math.min(NZ, k))][2], loc = (sv || 0) * f * f;
            var c = R[Math.max(0, Math.min(NZ, k))][2] === 0 ? [0.55, 0.6, 0.66] : caldo(loc / smax); col[3 * i] = c[0]; col[3 * i + 1] = c[1]; col[3 * i + 2] = c[2];
          }
          g.setAttribute('color', new T.BufferAttribute(col, 3)); g.rotateX(PI / 2);
          if (mesh) { S.radice.remove(mesh); mesh.geometry.dispose(); }
          mesh = new T.Mesh(g, mat); S.aggiungi(mesh);
          var zt = R[NZ][1]; ganascia1.position.z = zt + 0.2; ganascia2.position.z = -zt - 0.2;
          fr1.position.set(0, 0, zt + 0.75); fr2.position.set(0, 0, -zt - 0.75);
          var rotto = !isFinite(s) || st.eps >= deformazioneMax(m) * 0.995;
          S.didascalia.textContent = t('Provino in trazione: ', 'Tensile specimen: ') + F.tt(m.nome) + ' · ε = ' + fmt(100 * st.eps) + ' % · σ = ' + fmt(s || 0) + ' MPa' + (rotto ? t(' · rottura', ' · fracture') : '');
          S.sporca = true; S.avvia();
        };
        cb.aggiorna();
        var tAgg = 0;
        cb.sveglia = function () { S.avvia(); };
        S.ogniFotogramma(function (dt) {
          if (!st.gioca) return false;
          var m = MAT[st.m], em = deformazioneMax(m), ey = m.mu ? 0.05 : m.sy / (m.E * 1000);
          /* prima lento nell'elastico, poi piu' veloce */
          st.eps = Math.min(em * 0.999, st.eps + dt * (st.eps < 3 * ey ? ey * 0.8 : em / 6));
          tAgg += dt; if (tAgg > 0.08) { tAgg = 0; cE.value = 100 * st.eps / em; cE.dispatchEvent(new Event('input')); st.gioca = true; }
          if (st.eps >= em * 0.999) { st.gioca = false; disegna(); return false; }
          return true;
        });
        S.inquadra(12.5, -0.9, 1.3);
      }
    };
  }

  /* ─── 2. Travi ─────────────────────────────────────────────────────────── */
  var SEZ = { rett: { b: 100, h: 200 }, I: { B: 150, H: 300, tw: 7.1, tf: 10.7 }, tubo: { D: 200, d: 180 } };
  function schedaTravi(pan, destra) {
    var st = { v: 'mensola', c: 'conc', sez: 'I', L: 4, P: 20, q: 5, a: 1, scala: 50, mat: 'acciaio' };
    eq(pan, 'EI y″ = M(x);  I_rett = bh³/12');
    F.scelta(pan, ['Vincolo', 'Support'], [['mensola', t('mensola (incastro a sinistra)', 'cantilever (fixed at left)')], ['appoggiata', t('trave appoggiata', 'simply supported')]], st.v, function (v) { st.v = v; calcola(); });
    F.scelta(pan, ['Carico', 'Load'], [['conc', t('concentrato P', 'point load P')], ['distr', t('distribuito q', 'distributed q')]], st.c, function (v) { st.c = v; calcola(); });
    F.scelta(pan, ['Sezione', 'Section'], [['I', t('profilo a I tipo IPE 300 (senza raccordi)', 'I profile like IPE 300 (no fillets)')], ['rett', t('rettangolo 100 × 200 mm', 'rectangle 100 × 200 mm')], ['tubo', t('tubo Ø 200/180 mm', 'tube Ø 200/180 mm')]], st.sez, function (v) { st.sez = v; if (cb.sezione) cb.sezione(); calcola(); });
    F.scelta(pan, ['Materiale', 'Material'], [['acciaio', t('acciaio (E = 207 GPa)', 'steel (E = 207 GPa)')], ['alluminio', t('alluminio (E = 69 GPa)', 'aluminium (E = 69 GPa)')]], st.mat, function (v) { st.mat = v; calcola(); });
    F.cursore(pan, ['Luce L (m)', 'Span L (m)'], 1, 10, 0.5, st.L, function (v) { st.L = v; calcola(); });
    F.cursore(pan, ['P (kN)', 'P (kN)'], 0, 100, 1, st.P, function (v) { st.P = v; calcola(); });
    F.cursore(pan, ['q (kN/m)', 'q (kN/m)'], 0, 50, 0.5, st.q, function (v) { st.q = v; calcola(); });
    F.cursore(pan, ['Posizione di P (frazione di L)', 'Position of P (fraction of L)'], 0.05, 1, 0.05, st.a, function (v) { st.a = v; calcola(); });
    F.cursore(pan, ['Amplificazione 3D della freccia', '3D deflection magnification'], 1, 200, 1, st.scala, function (v) { st.scala = v; if (cb.aggiorna) cb.aggiorna(); });
    var info = nota(pan);
    nota(pan, t('Il momento flettente tende le fibre da una parte e comprime le altre: σ = M y/I cresce linearmente dall’asse neutro. Per questo le travi d’acciaio sono a I: il materiale sta lontano dall’asse, dove lavora, e I cresce come h³. La freccia è proporzionale a L³ (carico concentrato) o L⁴ (distribuito): raddoppiare la luce moltiplica la freccia per 8 o 16. Il calcolo integra numericamente M/EI due volte; le formule chiuse sono il confronto.',
      'The bending moment stretches the fibres on one side and compresses the others: σ = M y/I grows linearly from the neutral axis. That is why steel beams are I-shaped: material sits far from the axis, where it works, and I grows as h³. Deflection scales as L³ (point load) or L⁴ (distributed): doubling the span multiplies it by 8 or 16. The computation integrates M/EI twice numerically; closed forms are the comparison.'));
    var tela = F.tela(destra, 0.36), tela2 = F.tela(destra, 0.36), cb = {}, R = null;
    function dati() {
      var s = sezione(st.sez === 'I' ? 'I' : st.sez === 'rett' ? 'rett' : 'tubo', SEZ[st.sez]), E = MAT[st.mat].E * 1e9, I = s.I * 1e-12, P = st.c === 'conc' ? st.P * 1000 : 0, q = st.c === 'distr' ? st.q * 1000 : 0;
      var a = st.v === 'mensola' ? st.L * st.a : st.L * Math.min(0.95, st.a); a = Math.round(a / st.L * 2000) / 2000 * st.L;
      return { s: s, E: E, I: I, EI: E * I, P: P, q: q, a: a };
    }
    function calcola() {
      var d = dati(); R = trave(st.v, st.L, d.P, d.a, d.q, d.EI, 2000);
      var xs = R.x, Vk = R.V.map(function (v) { return v / 1000; }), Mk = R.M.map(function (v) { return v / 1000; }), sub = function (A) { return A.filter(function (_, i) { return i % 10 === 0; }); };
      var vmin = Math.min(0, Math.min.apply(null, Vk)), vmax = Math.max(0, Math.max.apply(null, Vk)), vpad = 0.1 * (vmax - vmin || 1);
      F.grafico(tela, { serie: [{ x: sub(xs), y: sub(Vk), col: '#6bcfff', etich: 'V' }], linee: [{ y: 0, col: '#34465f' }], xmin: 0, xmax: st.L, ymin: vmin - vpad, ymax: vmax + vpad, xl: ['x (m)', 'x (m)'], yl: ['taglio V (kN)', 'shear V (kN)'], descr: ['Diagramma del taglio', 'Shear force diagram'] });
      F.grafico(tela2, { serie: [{ x: sub(xs), y: sub(Mk), col: '#ffd24a', etich: 'M', riempi: 'rgba(255,210,74,.12)' }], linee: [{ y: 0, col: '#34465f' }], xmin: 0, xmax: st.L, xl: ['x (m)', 'x (m)'], yl: ['momento M (kN·m)', 'moment M (kN·m)'], descr: ['Diagramma del momento flettente', 'Bending moment diagram'] });
      var fc = (st.v === 'mensola' && st.a === 1) || (st.v === 'appoggiata' && Math.abs(st.a - 0.5) < 1e-9) || st.c === 'distr' ? frecciaChiusa(st.v, st.c, st.L, d.P, d.q * 1, d.EI) : NaN;
      var sm = Math.abs(R.Mmax) * d.s.c * 1e-3 / d.I / 1e6, sy = MAT[st.mat].sy;
      info.innerHTML = 'I = <b>' + fmt(d.s.I / 1e6) + '·10⁶ mm⁴</b>, A = ' + fmt(d.s.A) + ' mm², EI = ' + fmt(d.EI / 1e6) + ' MN·m²<br>' +
        t('Freccia massima: ', 'Max deflection: ') + '<b>' + fmt(R.freccia * 1000) + ' mm</b> ' + t('in x = ', 'at x = ') + fmt(R.xFreccia) + ' m' + (isFinite(fc) ? ' (' + t('formula chiusa ', 'closed form ') + fmt(fc * 1000) + ' mm)' : '') + '<br>' +
        '|M|<sub>max</sub> = ' + fmt(Math.abs(R.Mmax) / 1000) + ' kN·m → σ<sub>max</sub> = M c/I = <b>' + fmt(sm) + ' MPa</b> · ' + t('sicurezza allo snervamento ', 'safety factor to yield ') + (sm > 0 ? fmt(sy / sm) : '∞') + '<br>' +
        t('Rapporto freccia/luce: L/', 'Deflection/span: L/') + (R.freccia > 0 ? Math.round(st.L / R.freccia) : '∞') + t(' (in edilizia si chiede di solito ≥ L/250)', ' (building codes usually ask ≥ L/250)');
      if (cb.aggiorna) cb.aggiorna();
    }
    calcola(); F.alRidimensiona(calcola);
    return {
      tre: function (S, T, L3) {
        var mesh = null, geo = null, base = null, extra = new T.Group(); S.aggiungi(extra);
        var Lv = 8; /* lunghezza di disegno */
        function forma() {
          var d = SEZ[st.sez], k = 1 / 300 * 1.2, sh;
          if (st.sez === 'rett') { sh = new T.Shape(); sh.moveTo(-d.b / 2 * k, -d.h / 2 * k); sh.lineTo(d.b / 2 * k, -d.h / 2 * k); sh.lineTo(d.b / 2 * k, d.h / 2 * k); sh.lineTo(-d.b / 2 * k, d.h / 2 * k); sh.closePath(); }
          else if (st.sez === 'I') {
            var B = d.B / 2 * k, H = d.H / 2 * k, w = d.tw / 2 * k, f = d.tf * k; sh = new T.Shape();
            [[-B, -H], [B, -H], [B, -H + f], [w, -H + f], [w, H - f], [B, H - f], [B, H], [-B, H], [-B, H - f], [-w, H - f], [-w, -H + f], [-B, -H + f]].forEach(function (p, i) { if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); }); sh.closePath();
          } else { sh = new T.Shape(); sh.absarc(0, 0, d.D / 2 * k, 0, 2 * PI, false); var h = new T.Path(); h.absarc(0, 0, d.d / 2 * k, 0, 2 * PI, true); sh.holes.push(h); }
          return sh;
        }
        cb.sezione = function () {
          if (mesh) { S.radice.remove(mesh); geo.dispose(); }
          geo = new T.ExtrudeGeometry(forma(), { depth: Lv, steps: 120, bevelEnabled: false, curveSegments: 28 });
          base = geo.attributes.position.array.slice();
          geo.setAttribute('color', new T.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
          mesh = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.3, roughness: 0.45, side: T.DoubleSide }));
          S.aggiungi(mesh);
        };
        cb.sezione();
        cb.aggiorna = function () {
          if (!R) return;
          var d = dati(), pos = geo.attributes.position.array, col = geo.attributes.color.array, N = R.x.length - 1, smax = 0, i;
          for (i = 0; i <= N; i++) smax = Math.max(smax, Math.abs(R.M[i]));
          var k = 1 / 300 * 1.2, cmm = d.s.c * k;
          for (i = 0; i < pos.length; i += 3) {
            var sx = base[i], sy = base[i + 1], sz = base[i + 2], u = Math.max(0, Math.min(1, sz / Lv)), j = Math.round(u * N);
            var defl = R.y[j] / st.L * Lv * st.scala; /* spostamento in unita' di disegno */
            pos[i] = sz - Lv / 2; pos[i + 1] = sx; pos[i + 2] = sy + defl;
            var c = divergente(smax > 0 ? -R.M[j] / smax * sy / cmm : 0); /* M > 0 (sagging): fibre in basso tese */
            col[i] = c[0]; col[i + 1] = c[1]; col[i + 2] = c[2];
          }
          geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
          /* vincoli e carichi */
          while (extra.children.length) { var o = extra.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); }
          var grigio = new T.MeshStandardMaterial({ color: 0x55606e, metalness: 0.4, roughness: 0.6 });
          if (st.v === 'mensola') { var muro = new T.Mesh(new T.BoxGeometry(0.4, 2.6, 2.6), grigio); muro.position.set(-Lv / 2 - 0.2, 0, 0); extra.add(muro); }
          else [-Lv / 2, Lv / 2].forEach(function (x, q) { var cono = new T.Mesh(new T.ConeGeometry(0.3, 0.5, 3), grigio); cono.rotation.x = PI / 2; cono.position.set(x, 0, -0.75); extra.add(cono); if (q) { var rullo = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.6, 16), grigio); rullo.position.set(x, 0, -1.08); extra.add(rullo); } });
          function yA(xd) { var u = (xd + Lv / 2) / Lv, j = Math.round(Math.max(0, Math.min(1, u)) * N); return R.y[j] / st.L * Lv * st.scala; }
          var top = d.s.H / 2 * k;
          if (st.c === 'conc') { var xa = d.a / st.L * Lv - Lv / 2, z0 = yA(xa) + top; extra.add(L3.freccia(T, [xa, 0, z0 + 1.4], [xa, 0, z0 + 0.05], 0xff8a80, 0.3)); var e = L3.testo3d(T, 'P = ' + st.P + ' kN', '#ff8a80', 0.3); e.position.set(xa, 0, z0 + 1.7); extra.add(e); }
          else { for (i = 0; i <= 16; i++) { var xq = -Lv / 2 + Lv * i / 16, zq = yA(xq) + top; extra.add(L3.freccia(T, [xq, 0, zq + 0.8], [xq, 0, zq + 0.05], 0xffb070, 0.18)); } var e2 = L3.testo3d(T, 'q = ' + st.q + ' kN/m', '#ffb070', 0.3); e2.position.set(0, 0, top + 1.2); extra.add(e2); }
          S.didascalia.textContent = (st.v === 'mensola' ? t('Mensola', 'Cantilever') : t('Trave appoggiata', 'Simply supported beam')) + t(' deformata (×', ' deformed (×') + st.scala + t(') · rosso trazione, blu compressione', ') · red tension, blue compression');
          S.sporca = true; S.avvia();
        };
        cb.aggiorna();
        S.inquadra(13, -1.2, 1.2);
      }
    };
  }

  /* ─── 3. Eulero ────────────────────────────────────────────────────────── */
  function schedaEulero(pan, destra) {
    var st = { P: 0.6, L: 3, b: 40, h: 60, mat: 'acciaio' }, MODI = {};
    Object.keys(VINCOLI).forEach(function (k) { MODI[k] = modo(k, 60); });
    eq(pan, 'P_cr = π² E I / (K L)²');
    F.cursore(pan, ['Carico P / P_cr (cerniere)', 'Load P / P_cr (pinned)'], 0, 5, 0.02, st.P, function (v) { st.P = v; testo(); if (cb.aggiorna) cb.aggiorna(); });
    F.cursore(pan, ['Lunghezza L (m)', 'Length L (m)'], 0.5, 6, 0.1, st.L, function (v) { st.L = v; testo(); });
    F.cursore(pan, ['Sezione: lato minore b (mm)', 'Section: short side b (mm)'], 10, 100, 1, st.b, function (v) { st.b = v; testo(); });
    F.scelta(pan, ['Materiale', 'Material'], [['acciaio', t('acciaio', 'steel')], ['alluminio', t('alluminio', 'aluminium')]], st.mat, function (v) { st.mat = v; testo(); });
    var info = nota(pan);
    nota(pan, t('Una colonna snella compressa resta dritta finché P < P_cr, poi l’equilibrio rettilineo diventa instabile e si inflette di colpo. K L è la lunghezza libera di inflessione, la distanza fra due flessi della deformata: incastrare gli estremi la accorcia. Le quattro colonne hanno stesso materiale, sezione e lunghezza: con il cursore si sale col carico e si vede l’ordine in cui cedono. Se P_cr supera σ_y A la colonna snerva prima di inflettersi (colonne tozze).',
      'A slender column under compression stays straight while P < P_cr, then the straight equilibrium becomes unstable and it suddenly bends. K L is the effective length, the distance between two inflection points of the deflected shape: clamping the ends shortens it. The four columns share material, section and length: move the slider up the load and watch the order in which they give way. If P_cr exceeds σ_y A the column yields before buckling (stocky columns).'));
    var tela = F.tela(destra, 0.42), cb = {};
    function testo() {
      var E = MAT[st.mat].E * 1e9, I = st.h * Math.pow(st.b, 3) / 12 * 1e-12, A = st.b * st.h * 1e-6, sy = MAT[st.mat].sy * 1e6, P1 = caricoCritico(E, I, st.L, 1), righe = [], i;
      Object.keys(VINCOLI).forEach(function (k) { var v = VINCOLI[k], Pc = caricoCritico(E, I, st.L, v[2]); righe.push('<tr><td>' + F.tt([v[0], v[1]]) + ' (K = ' + v[2] + ')</td><td>' + fmt(Pc / 1000) + ' (×' + (Pc / P1).toFixed(3) + ')</td><td>' + (st.P * P1 >= Pc ? '<span class="bsiFX-ko">' + t('inflessa', 'buckled') + '</span>' : '<span class="bsiFX-ok">' + t('dritta', 'straight') + '</span>') + '</td></tr>'); });
      info.innerHTML = '<table class="bsiFX-tab" style="font-size:.74rem"><tr><th>' + t('vincoli', 'ends') + '</th><th>P<sub>cr</sub> (kN)</th><th></th></tr>' + righe.join('') + '</table>' +
        t('Carico applicato: ', 'Applied load: ') + '<b>' + fmt(st.P * P1 / 1000) + ' kN</b> · σ<sub>y</sub>A = ' + fmt(sy * A / 1000) + ' kN · ' + t('snellezza λ = KL/ρ = ', 'slenderness λ = KL/r = ') + fmt(st.L / Math.sqrt(I / A)) + ' (K = 1)';
      var xs = [], ser = [], cols = ['#ff8a80', '#5eead4', '#ffd24a', '#c49bff'];
      Object.keys(VINCOLI).forEach(function (k, j) { var y = []; for (i = 0; i <= 100; i++) { var L = 0.3 + 5.7 * i / 100; if (!j) xs.push(L); y.push(Math.min(caricoCritico(E, I, L, VINCOLI[k][2]), 1e12) / 1000); } ser.push({ x: xs, y: y, col: cols[j], etich: F.tt([VINCOLI[k][0], VINCOLI[k][1]]) }); });
      ser.push({ x: [0.3, 6], y: [sy * A / 1000, sy * A / 1000], col: '#9fb1c6', tratt: true, etich: 'σ_y A' });
      F.grafico(tela, { serie: ser, punti: [{ x: st.L, y: st.P * P1 / 1000, col: '#ffffff', r: 5 }], xmin: 0.3, xmax: 6, ymin: 0, ymax: Math.max(sy * A / 1000 * 1.3, st.P * P1 / 1000 * 1.2), xl: ['lunghezza L (m)', 'length L (m)'], yl: ['carico critico (kN)', 'critical load (kN)'], legenda: Object.keys(VINCOLI).map(function (k, j) { return { col: cols[j], etich: [VINCOLI[k][0], VINCOLI[k][1]] }; }), descr: ['Carico critico di Eulero in funzione della lunghezza', 'Euler critical load versus length'] });
    }
    testo(); F.alRidimensiona(testo);
    return {
      tre: function (S, T, L3) {
        var Hd = 5, NS = 60, colonne = [], chiavi = ['ll', 'cc', 'ic', 'ii'], grigio = new T.MeshStandardMaterial({ color: 0x55606e, metalness: 0.5, roughness: 0.5 });
        chiavi.forEach(function (k, j) {
          var x0 = (j - 1.5) * 2.4, g = new T.TubeGeometry(new T.LineCurve3(new T.Vector3(0, 0, 0), new T.Vector3(0, 0, Hd)), NS, 0.17, 14, false);
          g.setAttribute('color', new T.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
          var m = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.4, roughness: 0.4 })); m.position.set(x0, 0, -Hd / 2); S.aggiungi(m);
          var base = g.attributes.position.array.slice();
          /* vincoli: blocco = incastro, sfera = cerniera */
          var basso = new T.Mesh(k === 'cc' ? new T.SphereGeometry(0.22, 20, 14) : new T.BoxGeometry(0.9, 0.9, 0.3), grigio); basso.position.set(x0, 0, -Hd / 2 - (k === 'cc' ? 0.1 : 0.15)); S.aggiungi(basso);
          var alto = null; if (k !== 'll') { alto = new T.Mesh(k === 'ii' ? new T.BoxGeometry(0.9, 0.9, 0.3) : new T.SphereGeometry(0.22, 20, 14), grigio); S.aggiungi(alto); }
          var fr = L3.freccia(T, [0, 0, 0.9], [0, 0, 0.05], 0xff8a80, 0.25); S.aggiungi(fr);
          var et = L3.testo3d(T, 'K = ' + VINCOLI[k][2], '#cfe3f7', 0.3); et.position.set(x0, 0, -Hd / 2 - 0.7); S.aggiungi(et);
          colonne.push({ k: k, x0: x0, g: g, base: base, alto: alto, fr: fr, amp: 0 });
        });
        S.aggiungi(new T.Mesh(new T.PlaneGeometry(11, 3), new T.MeshStandardMaterial({ color: 0x0d1f33 }))).position.set(0, 0, -Hd / 2 - 0.32);
        cb.aggiorna = function () { S.avvia(); };
        var tt = 0;
        S.ogniFotogramma(function (dt) {
          tt += dt; var vivi = false;
          colonne.forEach(function (c) {
            var rap = st.P / Math.pow(VINCOLI[c.k][2], -2), obiettivo = rap > 1 ? Math.min(0.9, 0.55 * Math.sqrt(rap - 1)) : 0;
            c.amp += (obiettivo - c.amp) * Math.min(1, dt * 4); if (Math.abs(obiettivo - c.amp) > 1e-3) vivi = true;
            var pos = c.g.attributes.position.array, col = c.g.attributes.color.array, Y = MODI[c.k].y, n = Y.length - 1;
            for (var i = 0; i < pos.length; i += 3) {
              var z = c.base[i + 2], u = Math.max(0, Math.min(1, z / Hd)), j = Math.round(u * n), sh = c.amp * Y[j];
              pos[i] = c.base[i] + sh;
              var cc = rap > 1 ? caldo(0.75 + 0.25 * Math.abs(Y[j])) : caldo(0.2 + 0.5 * Math.min(1, rap)); col[i] = cc[0]; col[i + 1] = cc[1]; col[i + 2] = cc[2];
            }
            c.g.attributes.position.needsUpdate = true; c.g.attributes.color.needsUpdate = true; c.g.computeVertexNormals();
            var top = c.amp * Y[n];
            if (c.alto) c.alto.position.set(c.x0 + top, 0, Hd / 2 + (c.k === 'ii' ? 0.15 : 0.1));
            c.fr.position.set(c.x0 + top, 0, Hd / 2 + 0.3);
          });
          S.didascalia.textContent = t('Quattro colonne sotto lo stesso carico P = ', 'Four columns under the same load P = ') + st.P.toFixed(2) + ' P_cr(' + t('cerniere', 'pinned') + ')';
          return vivi || tt < 0.2;
        });
        S.inquadra(11.5, -1.57, 1.3);
      }
    };
  }

  /* ─── 4. Suono nei solidi ──────────────────────────────────────────────── */
  function schedaSuono(pan, destra) {
    var st = { m: 'acciaio', spessore: 50 };
    eq(pan, 'c_L = √(E(1−ν)/(ρ(1+ν)(1−2ν))),  c_T = √(G/ρ)');
    F.scelta(pan, ['Materiale', 'Material'], [['acciaio', t('acciaio', 'steel')], ['alluminio', t('alluminio', 'aluminium')], ['rame', t('rame', 'copper')]], st.m, function (v) { st.m = v; testo(); });
    F.cursore(pan, ['Spessore per l’ecografia (mm)', 'Thickness for the ultrasound test (mm)'], 5, 300, 5, st.spessore, function (v) { st.spessore = v; testo(); });
    var info = nota(pan);
    nota(pan, t('In un solido esteso viaggiano due onde: la longitudinale (P, compressione, come il suono nell’aria) e la trasversale (S, taglio), che i fluidi non trasmettono. La P è sempre più veloce: c_L/c_T = √(2(1−ν)/(1−2ν)), circa 1,9 per i metalli. In una barra sottile i lati sono liberi di gonfiarsi e la velocità scende a √(E/ρ). Così funzionano i controlli a ultrasuoni (eco dal fondo dopo 2d/c_L) e la sismologia: le onde S non attraversano il nucleo esterno liquido della Terra.',
      'Two waves travel in an extended solid: longitudinal (P, compression, like sound in air) and transverse (S, shear), which fluids do not carry. P is always faster: c_L/c_T = √(2(1−ν)/(1−2ν)), about 1.9 for metals. In a thin rod the sides are free to bulge and the speed drops to √(E/ρ). This is how ultrasonic testing works (back-wall echo after 2d/c_L) and seismology: S waves do not cross Earth’s liquid outer core.'));
    var tela = F.tela(destra, 0.4), cb = {};
    function testo() {
      var m = MAT[st.m], v = velocitaSuono(m), barre = [];
      ['acciaio', 'alluminio', 'rame'].forEach(function (k, i) { var w = velocitaSuono(MAT[k]); barre.push({ x: i * 4, y: w.L, col: '#ff8a80', larg: 14 }, { x: i * 4 + 1, y: w.barra, col: '#ffd24a', larg: 14 }, { x: i * 4 + 2, y: w.T, col: '#6bcfff', larg: 14 }); });
      F.grafico(tela, { barre: barre, xmin: -1, xmax: 11, ymin: 0, ymax: 7000, xl: ['acciaio · alluminio · rame', 'steel · aluminium · copper'], yl: ['velocità (m/s)', 'speed (m/s)'], legenda: [{ col: '#ff8a80', etich: ['longitudinale c_L', 'longitudinal c_L'] }, { col: '#ffd24a', etich: ['barra √(E/ρ)', 'rod √(E/ρ)'] }, { col: '#6bcfff', etich: ['trasversale c_T', 'transverse c_T'] }], descr: ['Velocità del suono nei metalli', 'Speed of sound in metals'] });
      info.innerHTML = '<b>' + F.tt(m.nome) + '</b>: E = ' + m.E + ' GPa, ν = ' + m.nu + ', ρ = ' + m.rho + ' kg/m³<br>c<sub>L</sub> = <b>' + v.L.toFixed(0) + ' m/s</b> · c<sub>T</sub> = <b>' + v.T.toFixed(0) + ' m/s</b> · ' + t('barra ', 'rod ') + v.barra.toFixed(0) + ' m/s<br>' +
        'G = ' + fmt(v.G / 1e9) + ' GPa, K = ' + fmt(v.K / 1e9) + ' GPa · c<sub>L</sub>/c<sub>T</sub> = ' + (v.L / v.T).toFixed(3) + '<br>' + t('Eco di fondo a ', 'Back-wall echo at ') + st.spessore + ' mm: <b>' + fmt(2 * st.spessore / 1000 / v.L * 1e6) + ' μs</b> (P), ' + fmt(2 * st.spessore / 1000 / v.T * 1e6) + ' μs (S)';
      if (cb.aggiorna) cb.aggiorna();
    }
    testo(); F.alRidimensiona(testo);
    return {
      tre: function (S, T, L3) {
        var nx = 48, ny = 5, nz = 5, n = nx * ny * nz, a = 0.2, blocchi = [];
        [['P', 1.7], ['S', -1.7]].forEach(function (b) {
          var mesh = new T.InstancedMesh(new T.SphereGeometry(0.06, 10, 8), new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2 }), n);
          mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); S.aggiungi(mesh);
          var e = L3.testo3d(T, b[0] === 'P' ? t('onda P (longitudinale)', 'P wave (longitudinal)') : t('onda S (trasversale)', 'S wave (transverse)'), b[0] === 'P' ? '#ff8a80' : '#6bcfff', 0.3); e.position.set(-nx * a / 2, b[1], 0.9); S.aggiungi(e);
          blocchi.push({ tipo: b[0], y0: b[1], mesh: mesh, fronte: 0 });
        });
        var M4 = new T.Matrix4(), col = new T.Color(), tempo = 0;
        cb.aggiorna = function () { S.avvia(); };
        S.ogniFotogramma(function (dt) {
          tempo += dt; var v = velocitaSuono(MAT[st.m]), Lb = nx * a;
          blocchi.forEach(function (B) {
            var c = (B.tipo === 'P' ? v.L : v.T) / 2500, periodo = (Lb + 3) / c, xf = (tempo % periodo) * c - 1.5 - Lb / 2, k = 0;
            for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) for (var l = 0; l < nz; l++) {
              var x = (i - (nx - 1) / 2) * a, y = B.y0 + (j - (ny - 1) / 2) * a, z = (l - (nz - 1) / 2) * a, s = (x - xf) / 0.45, u = 0.12 * Math.sin(3 * s) * Math.exp(-s * s / 2), du = Math.exp(-s * s / 2) * (3 * Math.cos(3 * s) - s * Math.sin(3 * s));
              if (B.tipo === 'P') x += u; else z += u * 1.4;
              M4.makeTranslation(x, y, z); B.mesh.setMatrixAt(k, M4);
              var cc = B.tipo === 'P' ? divergente(-0.45 * du) : divergente(Math.abs(du) * 0.45); B.mesh.setColorAt(k, col.setRGB(cc[0], cc[1], cc[2])); k++;
            }
            B.mesh.instanceMatrix.needsUpdate = true; if (B.mesh.instanceColor) B.mesh.instanceColor.needsUpdate = true;
          });
          S.didascalia.textContent = F.tt(MAT[st.m].nome) + ': c_L = ' + v.L.toFixed(0) + ' m/s, c_T = ' + v.T.toFixed(0) + t(' m/s (rallentate per il disegno, nello stesso rapporto)', ' m/s (slowed down for display, same ratio)');
          return true;
        });
        S.inquadra(13, -1.45, 0.75);
      }
    };
  }

  F.sezione('sfismateriali', {
    titolo: ['🧱 Elasticità e materiali', '🧱 Elasticity and materials'],
    sotto: ['Come si deformano e cedono i solidi: la prova di trazione di metalli e gomma, la flessione delle travi con taglio, momento e linea elastica, l’instabilità di Eulero delle colonne e la velocità del suono nei solidi, con le viste 3D delle deformazioni.', 'How solids deform and fail: the tensile test of metals and rubber, beam bending with shear, moment and deflection curve, Euler buckling of columns and the speed of sound in solids, with 3D views of the deformations.'],
    schede: [
      { nome: ['📈 Trazione', '📈 Tensile test'], costruisci: scheda3D(schedaTrazione) },
      { nome: ['🌉 Travi', '🌉 Beams'], costruisci: scheda3D(schedaTravi) },
      { nome: ['🏛️ Eulero', '🏛️ Euler buckling'], costruisci: scheda3D(schedaEulero) },
      { nome: ['🔊 Suono nei solidi', '🔊 Sound in solids'], costruisci: scheda3D(schedaSuono) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
