/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-statistica.js — 🎲 meccanica statistica
   BioSpecInfo · © Samuele Pio Provenzano

   La termodinamica statistica delle molecole (funzioni di partizione,
   entropie delle tavole) sta in bsi-fis-termostat.js; il modello di Ising
   in bsi-fis-ising.js. Qui ci sono i quattro risultati che ogni corso di
   meccanica statistica costruisce partendo da e^(−E/kT):

   · BOLTZMANN A DUE E PIU' LIVELLI: Z = Σ gᵢ e^(−Eᵢ/kT), popolazioni,
     energia, entropia e capacita' termica come varianza dell'energia,
     C = (⟨E²⟩ − ⟨E⟩²)/kT². Per due livelli C/k = x² eˣ/(1 + eˣ)²,
     x = Δ/kT: l'anomalia di Schottky, con il massimo a kT = 0,4168 Δ
     (C = 0,4392 k), trovato qui per sezione aurea. Livelli dell'oscillatore
     armonico e del rotore rigido per confronto;
   · MAXWELL–BOLTZMANN: f(v) = 4π (m/2πkT)^{3/2} v² e^(−mv²/2kT), con
     v_p = √(2kT/m), ⟨v⟩ = √(8kT/πm), v_rms = √(3kT/m) (N₂ a 300 K:
     517 m/s). In 3D una scatola di sfere dure che partono TUTTE con la
     stessa velocita': gli urti elastici (a passi, con le celle per trovare
     i vicini) redistribuiscono l'energia e l'istogramma converge alla
     distribuzione di Maxwell; il rapporto ⟨v⁴⟩/⟨v²⟩² va da 1 a 5/3;
   · FERMI–DIRAC E BOSE–EINSTEIN: 1/(e^((E−μ)/kT) ± 1). Il gas di
     elettroni dei metalli, E_F = ħ²(3π²n)^(2/3)/2m (rame 7,0 eV), con μ(T)
     ricavato numericamente dalla conservazione del numero di particelle e
     confrontato con Sommerfeld; il condensato di Bose–Einstein,
     T_c = (2πħ²/mk)(n/ζ(3/2))^(2/3), frazione 1 − (T/T_c)^(3/2). In 3D lo
     spazio dei momenti: la sfera di Fermi che si sfuma, o i bosoni che
     cadono nello stato k = 0;
   · CAPACITA' TERMICA DEI SOLIDI: Einstein (oscillatori indipendenti) e
     Debye (fononi fino a ω_D), Dulong–Petit ad alta temperatura e la legge
     T³ di Debye, C = (12π⁴/5) R (T/Θ_D)³; rame Θ_D ≈ 343 K. In 3D un
     reticolo che vibra con l'ampiezza quantistica giusta: a bassa T
     sopravvivono solo le onde lunghe.

   I calcoli (F.calcolo.statistica) sono funzioni pure; il banco li prova
   in node contro le forme chiuse e contro integrali numerici indipendenti.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI;
  var kB = 1.380649e-23, hbar = 1.054571817e-34, me = 9.1093837015e-31, uma = 1.66053906660e-27, R = 8.314462618, eV = 1.602176634e-19, NA = 6.02214076e23;

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rnd) { return Math.sqrt(-2 * Math.log(rnd() + 1e-300)) * Math.cos(2 * PI * rnd()); }
  /* Simpson composto su n intervalli (n pari) */
  function simpson(f, a, b, n) { n = n || 2000; if (n % 2) n++; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
  function sezioneAurea(f, a, b) { var g = (Math.sqrt(5) - 1) / 2; for (var k = 0; k < 200; k++) { var x1 = b - g * (b - a), x2 = a + g * (b - a); if (f(x1) > f(x2)) b = x2; else a = x1; } return (a + b) / 2; }

  /* ═══ 1. Boltzmann a livelli ═════════════════════════════════════════════ */
  /* livelli in unita' di Δ (il primo intervallo); g = degenerazioni */
  function livelli(tipo, n) {
    var E = [], g = [], i;
    n = n || 2;
    if (tipo === 'due') { E = [0, 1]; g = [1, 1]; }
    else if (tipo === 'duedeg') { E = [0, 1]; g = [1, 3]; }
    else if (tipo === 'tre') { E = [0, 1, 2]; g = [1, 1, 1]; }
    else if (tipo === 'armonico') { for (i = 0; i < n; i++) { E.push(i); g.push(1); } }
    else if (tipo === 'rotore') { for (i = 0; i < n; i++) { E.push(i * (i + 1) / 2); g.push(2 * i + 1); } }
    return { E: E, g: g };
  }
  /* tutto da Z: popolazioni, U, C (varianza), S, F, in unita' Δ e k; tau = kT/Δ */
  function termo(L, tau) {
    var E = L.E, g = L.g, E0 = Math.min.apply(null, E), Z = 0, U = 0, U2 = 0, p = [];
    for (var i = 0; i < E.length; i++) { var w = g[i] * Math.exp(-(E[i] - E0) / tau); p.push(w); Z += w; U += w * E[i]; U2 += w * E[i] * E[i]; }
    U /= Z; U2 /= Z;
    var Fl = E0 - tau * Math.log(Z);
    return { Z: Z, p: p.map(function (w) { return w / Z; }), U: U, C: (U2 - U * U) / (tau * tau), S: (U - Fl) / tau, F: Fl };
  }
  function schottky(x) { if (x > 700) return 0; var e = Math.exp(x); return x * x * e / ((1 + e) * (1 + e)); }
  function schottkyPicco() { var tau = sezioneAurea(function (tau) { return schottky(1 / tau); }, 0.05, 3); return { tau: tau, C: schottky(1 / tau) }; }

  /* ═══ 2. Maxwell–Boltzmann ═══════════════════════════════════════════════ */
  function mb(v, m, T) { var a = m / (2 * kB * T); return 4 * PI * Math.pow(a / PI, 1.5) * v * v * Math.exp(-a * v * v); }
  function velocita(m, T) { return { p: Math.sqrt(2 * kB * T / m), media: Math.sqrt(8 * kB * T / (PI * m)), rms: Math.sqrt(3 * kB * T / m) }; }
  var GAS = { H2: ['H₂', 2.01588], He: ['He', 4.002602], N2: ['N₂', 28.0134], O2: ['O₂', 31.9988], CO2: ['CO₂', 44.0095], Xe: ['Xe', 131.293] };
  /* gas di sfere dure in una scatola [0, L]³: urti elastici fra masse uguali, pareti riflettenti */
  function duroCrea(N, L, r, v0, seme) {
    var rnd = mulberry32(seme || 1), x = new Float64Array(3 * N), v = new Float64Array(3 * N), lato = Math.ceil(Math.cbrt(N)), passo = L / lato, k = 0;
    for (var i = 0; i < lato && k < N; i++) for (var j = 0; j < lato && k < N; j++) for (var l = 0; l < lato && k < N; l++) {
      x[3 * k] = (i + 0.5) * passo + (rnd() - 0.5) * 0.2 * passo; x[3 * k + 1] = (j + 0.5) * passo + (rnd() - 0.5) * 0.2 * passo; x[3 * k + 2] = (l + 0.5) * passo + (rnd() - 0.5) * 0.2 * passo;
      var z = 2 * rnd() - 1, f = 2 * PI * rnd(), s = Math.sqrt(1 - z * z); v[3 * k] = v0 * s * Math.cos(f); v[3 * k + 1] = v0 * s * Math.sin(f); v[3 * k + 2] = v0 * z; k++;
    }
    var nc = Math.max(1, Math.floor(L / (2 * r)));
    return { N: N, L: L, r: r, x: x, v: v, nc: nc, testa: new Int32Array(nc * nc * nc), succ: new Int32Array(N), urti: 0, t: 0 };
  }
  function duroPasso(G, dt) {
    var N = G.N, L = G.L, r = G.r, x = G.x, v = G.v, nc = G.nc, i, d;
    for (i = 0; i < 3 * N; i++) {
      x[i] += v[i] * dt;
      if (x[i] < r) { x[i] = 2 * r - x[i]; v[i] = Math.abs(v[i]); } else if (x[i] > L - r) { x[i] = 2 * (L - r) - x[i]; v[i] = -Math.abs(v[i]); }
    }
    var testa = G.testa, succ = G.succ, cs = L / nc; testa.fill(-1);
    function cella(c) { return Math.min(nc - 1, Math.max(0, Math.floor(c / cs))); }
    for (i = 0; i < N; i++) { var ci = (cella(x[3 * i]) * nc + cella(x[3 * i + 1])) * nc + cella(x[3 * i + 2]); succ[i] = testa[ci]; testa[ci] = i; }
    var d2 = 4 * r * r;
    for (i = 0; i < N; i++) {
      var a = cella(x[3 * i]), b = cella(x[3 * i + 1]), c = cella(x[3 * i + 2]);
      for (var da = -1; da <= 1; da++) for (var db = -1; db <= 1; db++) for (var dc = -1; dc <= 1; dc++) {
        var A = a + da, B = b + db, Cc = c + dc; if (A < 0 || B < 0 || Cc < 0 || A >= nc || B >= nc || Cc >= nc) continue;
        for (var j = testa[(A * nc + B) * nc + Cc]; j >= 0; j = succ[j]) {
          if (j <= i) continue;
          var dx = x[3 * i] - x[3 * j], dy = x[3 * i + 1] - x[3 * j + 1], dz = x[3 * i + 2] - x[3 * j + 2], q = dx * dx + dy * dy + dz * dz;
          if (q >= d2 || q === 0) continue;
          var dvx = v[3 * i] - v[3 * j], dvy = v[3 * i + 1] - v[3 * j + 1], dvz = v[3 * i + 2] - v[3 * j + 2], pr = dvx * dx + dvy * dy + dvz * dz;
          if (pr >= 0) continue; /* si stanno gia' allontanando */
          d = pr / q;
          v[3 * i] -= d * dx; v[3 * i + 1] -= d * dy; v[3 * i + 2] -= d * dz; v[3 * j] += d * dx; v[3 * j + 1] += d * dy; v[3 * j + 2] += d * dz;
          G.urti++;
        }
      }
    }
    G.t += dt;
  }
  function duroMomenti(G) { var s2 = 0, s4 = 0, E = 0; for (var i = 0; i < G.N; i++) { var w = G.v[3 * i] * G.v[3 * i] + G.v[3 * i + 1] * G.v[3 * i + 1] + G.v[3 * i + 2] * G.v[3 * i + 2]; s2 += w; s4 += w * w; } s2 /= G.N; s4 /= G.N; return { v2: s2, v4: s4, kurt: s4 / (s2 * s2), E: 0.5 * s2 * G.N }; }
  function duroScala(G, f) { for (var i = 0; i < 3 * G.N; i++) G.v[i] *= f; }

  /* ═══ 3. Fermi–Dirac e Bose–Einstein ═════════════════════════════════════ */
  function fd(E, mu, kT) { var y = (E - mu) / kT; return y > 700 ? 0 : 1 / (Math.exp(y) + 1); }
  function be(E, mu, kT) { var y = (E - mu) / kT; return y > 700 ? 0 : 1 / (Math.exp(y) - 1); }
  function energiaFermi(n, m) { return hbar * hbar / (2 * (m || me)) * Math.pow(3 * PI * PI * n, 2 / 3); }
  /* μ(T) di un gas di Fermi 3D (g(E) ∝ √E), unita' E_F = 1: ∫ √E f dE = 2/3 */
  function fermiN(mu, tau) { var a = 0, b = Math.max(mu, 0) + 40 * tau; return simpson(function (u) { var E = u * u; return 2 * u * u * fd(E, mu, tau); }, 0, Math.sqrt(b), 1200); }
  function fermiMu(tau) {
    if (tau <= 0) return 1;
    var lo = -50 * tau - 5, hi = 1 + 5 * tau;
    for (var k = 0; k < 56; k++) { var m = (lo + hi) / 2; if (fermiN(m, tau) > 2 / 3) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  function sommerfeld(tau) { return 1 - PI * PI / 12 * tau * tau; }
  /* ζ(s) per s > 1 (Euler–Maclaurin), g_s(z) = Σ z^k/k^s */
  function zeta(s) { var N = 40, S = 0; for (var k = 1; k < N; k++) S += Math.pow(k, -s); return S + Math.pow(N, 1 - s) / (s - 1) + 0.5 * Math.pow(N, -s) + s * Math.pow(N, -s - 1) / 12 - s * (s + 1) * (s + 2) * Math.pow(N, -s - 3) / 720; }
  function polilog(s, z) { if (z >= 1) return zeta(s); var S = 0, zk = 1; for (var k = 1; k < 100000; k++) { zk *= z; var d = zk / Math.pow(k, s); S += d; if (d < 1e-15 * S) break; } return S; }
  /* Bose ideale, unita' T_c = 1: frazione nel condensato e fugacita' */
  function bose(tau) {
    if (tau <= 1) return { n0: 1 - Math.pow(tau, 1.5), z: 1, mu: 0 };
    var obiettivo = zeta(1.5) / Math.pow(tau, 1.5), lo = 0, hi = 1;
    for (var k = 0; k < 80; k++) { var m = (lo + hi) / 2; if (polilog(1.5, m) > obiettivo) hi = m; else lo = m; }
    var z = (lo + hi) / 2; return { n0: 0, z: z, mu: tau * Math.log(z) };
  }
  function tempCritica(n, m) { return 2 * PI * hbar * hbar / (m * kB) * Math.pow(n / zeta(1.5), 2 / 3); }
  /* l'integrale di Bose ∫₀^∞ √x/(eˣ − 1) dx = Γ(3/2) ζ(3/2), con x = u² */
  function integraleBose() { return simpson(function (u) { return u === 0 ? 2 : 2 * u * u / Math.expm1(u * u); }, 0, 8, 8000); }
  var METALLI = { Cu: ['Cu', 8.47e28], Ag: ['Ag', 5.86e28], Au: ['Au', 5.90e28], Na: ['Na', 2.65e28], Al: ['Al', 18.1e28] };

  /* ═══ 4. Einstein e Debye ════════════════════════════════════════════════ */
  function einsteinC(T, th) { if (T <= 0) return 0; var x = th / T; if (x > 700) return 0; var e = Math.exp(x); return 3 * R * x * x * e / ((e - 1) * (e - 1)); }
  function einsteinU(T, th) { return T <= 0 ? 0 : 3 * R * th / Math.expm1(th / T); }
  function debyeC(T, th) {
    if (T <= 0) return 0;
    var xD = th / T, xm = Math.min(xD, 60);
    var I = simpson(function (x) { if (x < 1e-6) return x * x; var e = Math.exp(x); return x * x * x * x * e / ((e - 1) * (e - 1)); }, 0, xm, 2000);
    return 9 * R * Math.pow(T / th, 3) * I;
  }
  function debyeU(T, th) { if (T <= 0) return 0; var xD = th / T, xm = Math.min(xD, 60); return 9 * R * T * Math.pow(T / th, 3) * simpson(function (x) { return x < 1e-9 ? x * x : x * x * x / Math.expm1(x); }, 0, xm, 2000); }
  function debyeT3(T, th) { return 12 * Math.pow(PI, 4) / 5 * R * Math.pow(T / th, 3); }
  var SOLIDI = { Cu: ['Cu', 343], Al: ['Al', 428], Ag: ['Ag', 225], Pb: ['Pb', 105], Fe: ['Fe', 470], C: [['diamante', 'diamond'], 2230] };
  /* l'occupazione di Bose di un modo: ⟨n⟩ + ½ (con il punto zero) */
  function occupazione(x) { return x > 700 ? 0.5 : 0.5 + 1 / Math.expm1(x); }

  F.calcolo.statistica = {
    mulberry32: mulberry32, simpson: simpson, livelli: livelli, termo: termo, schottky: schottky, schottkyPicco: schottkyPicco,
    mb: mb, velocita: velocita, GAS: GAS, duroCrea: duroCrea, duroPasso: duroPasso, duroMomenti: duroMomenti, duroScala: duroScala,
    fd: fd, be: be, energiaFermi: energiaFermi, fermiN: fermiN, fermiMu: fermiMu, sommerfeld: sommerfeld, zeta: zeta, polilog: polilog, bose: bose, tempCritica: tempCritica, integraleBose: integraleBose, METALLI: METALLI,
    einsteinC: einsteinC, einsteinU: einsteinU, debyeC: debyeC, debyeU: debyeU, debyeT3: debyeT3, occupazione: occupazione,
    costanti: { kB: kB, hbar: hbar, me: me, uma: uma, R: R, eV: eV, NA: NA }
  };

  /* ═══ interfaccia ═══════════════════════════════════════════════════════ */
  if (!globale.document || !globale.document.createElement) return;
  var D = globale.document;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
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
        var S = new L3.Scena(destra, 0.62);
        /* nelle schede nascoste la scena non si ridimensiona (riallocare il framebuffer costa) */
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function bagliore(T, col, dim) {
    var c = D.createElement('canvas'); c.width = c.height = 64; var q = c.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 64, 64);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), color: col, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.scale.set(dim, dim, 1); return sp;
  }
  /* scala di colori fredda → calda */
  function caldo(f) { f = Math.max(0, Math.min(1, f)); var st = [[0.15, 0.35, 0.95], [0.2, 0.8, 0.95], [0.35, 0.92, 0.55], [1, 0.85, 0.25], [1, 0.35, 0.2]], x = f * 4, i = Math.min(3, Math.floor(x)), u = x - i, a = st[i], b = st[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }

  /* ─── 1. Livelli e Schottky ────────────────────────────────────────────── */
  function schedaLivelli(div) {
    var G = griglia(div), pan = G.pan, st = { tipo: 'due', n: 12, tau: 0.42 };
    eq(pan, 'C/k = x² eˣ/(1 + eˣ)²,  x = Δ/kT');
    F.scelta(pan, ['Sistema', 'System'], [['due', t('due livelli (0, Δ)', 'two levels (0, Δ)')], ['duedeg', t('due livelli, il superiore triplo', 'two levels, upper one triple')], ['tre', t('tre livelli equidistanti', 'three equally spaced levels')], ['armonico', t('oscillatore armonico (n livelli)', 'harmonic oscillator (n levels)')], ['rotore', t('rotore rigido J(J+1)Δ/2, g = 2J+1', 'rigid rotor J(J+1)Δ/2, g = 2J+1')]], st.tipo, function (v) { st.tipo = v; disegna(); });
    F.cursore(pan, ['Livelli per oscillatore e rotore', 'Levels for oscillator and rotor'], 2, 40, 1, st.n, function (v) { st.n = v; disegna(); });
    F.cursore(pan, ['kT/Δ', 'kT/Δ'], 0.05, 5, 0.01, st.tau, function (v) { st.tau = v; disegna(); });
    var info = nota(pan);
    nota(pan, t('La capacità termica misura quanto fluttua l’energia: a bassa T tutti stanno nel fondamentale (C → 0), ad alta T i livelli sono ugualmente popolati e non si può assorbire altra energia (di nuovo C → 0 per un sistema con un numero finito di livelli). In mezzo il picco di Schottky, che si osserva nei sali paramagnetici e nei solidi con impurezze a due livelli. L’oscillatore con molti livelli tende invece a C = k (equipartizione).',
      'Heat capacity measures how much the energy fluctuates: at low T everything is in the ground state (C → 0), at high T the levels are equally populated and no more energy can be absorbed (again C → 0 for a system with finitely many levels). In between is the Schottky peak, seen in paramagnetic salts and in solids with two-level impurities. The oscillator with many levels tends instead to C = k (equipartition).'));
    var tela = F.tela(G.dx, 0.5), tela2 = F.tela(G.dx, 0.42);
    function disegna() {
      var L = livelli(st.tipo, st.n), r = termo(L, st.tau), xs = [], yc = [], yu = [], ys = [];
      for (var i = 1; i <= 300; i++) { var tau = 0.02 * i; xs.push(tau); var q = termo(L, tau); yc.push(q.C); yu.push(q.U); ys.push(q.S); }
      var pk = schottkyPicco(), punti = [{ x: st.tau, y: r.C, col: '#ff8a80', r: 5 }];
      if (st.tipo === 'due') punti.push({ x: pk.tau, y: pk.C, col: '#ffd24a', r: 4 });
      F.grafico(tela, { serie: [{ x: xs, y: yc, col: '#5eead4', etich: 'C/k' }, { x: xs, y: yu, col: '#6bcfff', tratt: true, etich: 'U/Δ' }, { x: xs, y: ys, col: '#c49bff', tratt: true, etich: 'S/k' }], punti: punti, xmin: 0, xmax: 6, xl: ['kT/Δ', 'kT/Δ'], yl: ['C/k, U/Δ, S/k', 'C/k, U/Δ, S/k'], legenda: [{ col: '#5eead4', etich: ['C/k (varianza)', 'C/k (variance)'] }, { col: '#6bcfff', etich: ['U/Δ', 'U/Δ'] }, { col: '#c49bff', etich: ['S/k', 'S/k'] }], descr: ['Capacità termica, energia ed entropia in funzione di kT/Δ', 'Heat capacity, energy and entropy versus kT/Δ'] });
      /* popolazioni: barre orizzontali ai livelli di energia */
      var P = F.pennello(tela2), q = P.q, W = P.W, H = P.H, nL = Math.min(L.E.length, 14), Emax = L.E[nL - 1] || 1, m = 30;
      q.font = '11px system-ui,sans-serif';
      for (i = 0; i < nL; i++) {
        var y = H - m - (H - 2 * m) * L.E[i] / Emax, w = (W - 150) * r.p[i] / Math.max.apply(null, r.p);
        q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(60, y); q.lineTo(W - 10, y); q.stroke();
        q.fillStyle = '#5eead4'; q.globalAlpha = 0.85; q.fillRect(64, y - 5, Math.max(1, w), 10); q.globalAlpha = 1;
        q.fillStyle = '#9fb1c6'; q.textAlign = 'right'; q.fillText(fmt(L.E[i]) + ' Δ', 56, y + 4);
        q.textAlign = 'left'; q.fillStyle = '#e6fffb'; q.fillText((100 * r.p[i]).toFixed(1) + ' %' + (L.g[i] > 1 ? '  (g = ' + L.g[i] + ')' : ''), 70 + Math.max(1, w), y + 4);
      }
      q.fillStyle = '#aebccd'; q.textAlign = 'left'; q.fillText(t('popolazioni pᵢ = gᵢ e^(−Eᵢ/kT)/Z a kT = ', 'populations pᵢ = gᵢ e^(−Eᵢ/kT)/Z at kT = ') + fmt(st.tau) + ' Δ', 8, 14);
      tela2.setAttribute('aria-label', t('Popolazioni dei livelli di energia', 'Energy level populations'));
      info.innerHTML = 'Z = <b>' + fmt(r.Z) + '</b> · U = <b>' + fmt(r.U) + ' Δ</b><br>C = <b>' + fmt(r.C) + ' k</b> · S = <b>' + fmt(r.S) + ' k</b><br>' +
        (st.tipo === 'due' ? t('Picco di Schottky (sezione aurea): kT = ', 'Schottky peak (golden section): kT = ') + '<b>' + pk.tau.toFixed(4) + ' Δ</b>, C = <b>' + pk.C.toFixed(4) + ' k</b>' : t('Limite ad alta T: S → k ln Σg = ', 'High-T limit: S → k ln Σg = ') + fmt(Math.log(L.g.reduce(function (a, b) { return a + b; }, 0))) + ' k');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ─── 2. Maxwell–Boltzmann e le sfere dure ─────────────────────────────── */
  function schedaMB(pan, destra) {
    var st = { gas: 'N2', T: 300, N: 500, scala: 400, sim: null, seme: 1 };
    eq(pan, 'f(v) = 4π (m/2πkT)^(3/2) v² e^(−mv²/2kT)');
    F.scelta(pan, ['Gas', 'Gas'], Object.keys(GAS).map(function (k) { return [k, GAS[k][0] + ' (' + GAS[k][1] + ' g/mol)']; }), st.gas, function (v) { st.gas = v; reimposta(); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 50, 1500, 10, st.T, function (v) { var f = Math.sqrt(v / st.T); st.T = v; if (st.sim) duroScala(st.sim, f); testo(); });
    F.cursore(pan, ['Sfere', 'Spheres'], 100, 1000, 50, st.N, function (v) { st.N = v; reimposta(); });
    F.bottone(pan, ['Ricomincia: tutte alla stessa velocità', 'Restart: all at the same speed'], function () { st.seme++; reimposta(); });
    var info = nota(pan);
    nota(pan, t('All’inizio ogni sfera ha la stessa velocità (in modulo) e direzione casuale: l’istogramma è un picco solo. Gli urti elastici conservano energia e quantità di moto ma rimescolano le velocità; dopo pochi urti per particella compare la distribuzione di Maxwell, la più probabile con energia totale fissata. Il colore delle sfere va dal blu (lente) al rosso (veloci); una sfera lascia la scia del suo cammino casuale.',
      'At the start every sphere has the same speed and a random direction: the histogram is a single spike. Elastic collisions conserve energy and momentum but shuffle velocities; after a few collisions per particle the Maxwell distribution appears, the most probable one at fixed total energy. Sphere colour goes from blue (slow) to red (fast); one sphere leaves the trail of its random walk.'));
    var tela = F.tela(destra, 0.45), cb = {}, ist = null, nIst = 0;
    function m() { return GAS[st.gas][1] * uma; }
    function reimposta() {
      var vr = velocita(m(), st.T).rms;
      st.sim = duroCrea(st.N, 10, 0.22, vr / st.scala, st.seme); ist = null; nIst = 0;
      if (cb.nuovo) cb.nuovo(); testo(); grafico();
    }
    function testo() {
      var V = velocita(m(), st.T), M = duroMomenti(st.sim);
      info.innerHTML = 'v<sub>p</sub> = <b>' + V.p.toFixed(1) + '</b> · ⟨v⟩ = <b>' + V.media.toFixed(1) + '</b> · v<sub>rms</sub> = <b>' + V.rms.toFixed(1) + ' m/s</b><br>' +
        t('Simulazione: ', 'Simulation: ') + 'v<sub>rms</sub> = ' + (Math.sqrt(M.v2) * st.scala).toFixed(1) + ' m/s · ⟨v⁴⟩/⟨v²⟩² = <b>' + M.kurt.toFixed(3) + '</b> (Maxwell: 5/3 = 1,667)<br>' +
        t('Urti: ', 'Collisions: ') + st.sim.urti + ' (' + (2 * st.sim.urti / st.sim.N).toFixed(1) + t(' per sfera', ' per sphere') + ')';
    }
    function grafico() {
      var G = st.sim, V = velocita(m(), st.T), vmax = V.rms * 2.6, NB = 36, bw = vmax / NB;
      if (!ist) ist = new Float64Array(NB);
      var h = new Float64Array(NB); for (var i = 0; i < G.N; i++) { var s = Math.hypot(G.v[3 * i], G.v[3 * i + 1], G.v[3 * i + 2]) * st.scala, b = Math.floor(s / bw); if (b >= 0 && b < NB) h[b]++; }
      /* media mobile esponenziale per un istogramma meno rumoroso */
      var a = nIst < 1 ? 1 : 0.25; for (i = 0; i < NB; i++) ist[i] = (1 - a) * ist[i] + a * h[i]; nIst++;
      var barre = [], xs = [], ys = [];
      for (i = 0; i < NB; i++) barre.push({ x: (i + 0.5) * bw, y: ist[i] / (G.N * bw), col: '#2f7f95', larg: Math.max(3, 300 / NB) });
      for (i = 0; i <= 200; i++) { var v = vmax * i / 200; xs.push(v); ys.push(mb(v, m(), st.T)); }
      var P = F.grafico(tela, { serie: [{ x: xs, y: ys, col: '#ffd24a', etich: 'Maxwell' }], barre: barre, xmin: 0, xmax: vmax, ymin: 0, ymax: 1.4 * mb(V.p, m(), st.T), xl: ['velocità v (m/s)', 'speed v (m/s)'], yl: ['f(v) (s/m)', 'f(v) (s/m)'], legenda: [{ col: '#ffd24a', etich: ['Maxwell–Boltzmann', 'Maxwell–Boltzmann'] }, { col: '#2f7f95', etich: ['simulazione', 'simulation'] }], descr: ['Istogramma delle velocità contro la distribuzione di Maxwell', 'Speed histogram versus the Maxwell distribution'] });
      var q = P.q; [['v_p', V.p], ['⟨v⟩', V.media], ['v_rms', V.rms]].forEach(function (c, k) { var x = P.X(c[1]); q.strokeStyle = '#ff8a80'; q.setLineDash([3, 3]); q.beginPath(); q.moveTo(x, 18); q.lineTo(x, P.H - 40); q.stroke(); q.setLineDash([]); q.fillStyle = '#ff8a80'; q.font = '10px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(c[0], x, 26 + 11 * k); });
    }
    reimposta();
    F.alRidimensiona(grafico);
    return {
      tre: function (S, T, L3) {
        var L = 10, off = -L / 2, mesh = null, scia = null, sPos = null, nS = 0, NS = 600;
        S.aggiungi(new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(L, L, L)), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.5 })));
        var pav = new T.Mesh(new T.PlaneGeometry(L, L), new T.MeshStandardMaterial({ color: 0x0d2238, transparent: true, opacity: 0.6, side: T.DoubleSide })); pav.position.z = -L / 2; S.aggiungi(pav);
        var luce = new T.PointLight(0xffffff, 0.6, 40); luce.position.set(6, -8, 10); S.aggiungi(luce);
        var M4 = new T.Matrix4(), col = new T.Color();
        cb.nuovo = function () {
          if (mesh) { S.radice.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
          if (scia) { S.radice.remove(scia); scia.geometry.dispose(); scia.material.dispose(); }
          var G = st.sim;
          mesh = new T.InstancedMesh(new T.SphereGeometry(G.r, 14, 10), new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 }), G.N);
          mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
          for (var i = 0; i < G.N; i++) mesh.setColorAt(i, col.setRGB(1, 1, 1));
          S.aggiungi(mesh);
          sPos = new Float32Array(NS * 3); nS = 0; var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(sPos, 3)); g.setDrawRange(0, 0);
          scia = new T.Line(g, new T.LineBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.8 })); S.aggiungi(scia);
          aggiorna();
        };
        function aggiorna() {
          var G = st.sim, vr = Math.sqrt(duroMomenti(G).v2);
          for (var i = 0; i < G.N; i++) {
            M4.makeTranslation(G.x[3 * i] + off, G.x[3 * i + 1] + off, G.x[3 * i + 2] + off); mesh.setMatrixAt(i, M4);
            var c = caldo(Math.hypot(G.v[3 * i], G.v[3 * i + 1], G.v[3 * i + 2]) / (2 * vr)); mesh.setColorAt(i, col.setRGB(c[0], c[1], c[2]));
          }
          mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
          if (nS >= NS) { sPos.copyWithin(0, 3); nS = NS - 1; }
          sPos[3 * nS] = G.x[0] + off; sPos[3 * nS + 1] = G.x[1] + off; sPos[3 * nS + 2] = G.x[2] + off; nS++;
          scia.geometry.attributes.position.needsUpdate = true; scia.geometry.setDrawRange(0, nS);
        }
        cb.nuovo();
        var tG = 0;
        S.ogniFotogramma(function (dt) {
          var G = st.sim, vmax = 0; for (var i = 0; i < 3 * G.N; i++) vmax = Math.max(vmax, Math.abs(G.v[i]));
          var tempo = dt * 3, n = Math.max(1, Math.min(Math.ceil(5000 / G.N), Math.ceil(tempo * vmax / (0.5 * G.r)))), h = tempo / n;
          for (i = 0; i < n; i++) duroPasso(G, h);
          aggiorna();
          tG += dt; if (tG > 0.2) { tG = 0; grafico(); testo(); }
          S.didascalia.textContent = t('Gas di ', 'Gas of ') + G.N + t(' sfere dure, ', ' hard spheres, ') + GAS[st.gas][0] + t(' a ', ' at ') + st.T + ' K · t = ' + G.t.toFixed(1);
          return true;
        });
        S.inquadra(24, -0.6, 1.15);
      }
    };
  }

  /* ─── 3. Fermi–Dirac e Bose–Einstein ───────────────────────────────────── */
  function schedaQuantistici(pan, destra) {
    var st = { tipo: 'fd', tau: 0.1, met: 'Cu' };
    eq(pan, '⟨n⟩ = 1/(e^((E−μ)/kT) ± 1)');
    var cont = F.el('div');
    F.scelta(pan, ['Statistica', 'Statistics'], [['fd', t('Fermi–Dirac (elettroni in un metallo)', 'Fermi–Dirac (electrons in a metal)')], ['be', t('Bose–Einstein (gas ideale, condensato)', 'Bose–Einstein (ideal gas, condensate)')]], st.tipo, function (v) { st.tipo = v; st.tau = v === 'fd' ? 0.1 : 0.6; comandi(); calcola(); });
    pan.appendChild(cont);
    var info = nota(pan);
    nota(pan, t('Fermioni: al più uno per stato (Pauli). A T = 0 riempiono la sfera di Fermi fino a k_F; scaldando, solo una buccia di spessore ~kT intorno a E_F si sfuma: per questo il contributo elettronico alla capacità termica dei metalli è piccolo, C = (π²/2) Nk (T/T_F). Bosoni: sotto T_c una frazione macroscopica cade nello stato fondamentale k = 0 (la sfera luminosa al centro): il condensato di Bose–Einstein, ottenuto con atomi di rubidio nel 1995.',
      'Fermions: at most one per state (Pauli). At T = 0 they fill the Fermi sphere up to k_F; when heated only a shell of thickness ~kT around E_F blurs: that is why the electronic contribution to metal heat capacity is small, C = (π²/2) Nk (T/T_F). Bosons: below T_c a macroscopic fraction falls into the ground state k = 0 (the bright sphere in the centre): the Bose–Einstein condensate, obtained with rubidium atoms in 1995.'));
    var tela = F.tela(destra, 0.42), tela2 = F.tela(destra, 0.36), cb = {}, mu = 1, bz = null, curve = {};
    function comandi() {
      cont.innerHTML = '';
      if (st.tipo === 'fd') {
        F.scelta(cont, ['Metallo', 'Metal'], Object.keys(METALLI).map(function (k) { return [k, METALLI[k][0] + ' (n = ' + (METALLI[k][1] / 1e28).toFixed(2) + '·10²⁸ m⁻³)']; }), st.met, function (v) { st.met = v; calcola(); });
        F.cursore(cont, ['kT/E_F', 'kT/E_F'], 0.005, 1, 0.005, st.tau, function (v) { st.tau = v; calcola(); });
      } else F.cursore(cont, ['T/T_c', 'T/T_c'], 0.02, 2, 0.02, st.tau, function (v) { st.tau = v; calcola(); });
    }
    comandi();
    function calcola() {
      if (st.tipo === 'fd') { mu = fermiMu(st.tau); bz = null; } else { bz = bose(st.tau); }
      disegna(); if (cb.aggiorna) cb.aggiorna();
    }
    function disegna() {
      var xs = [], ys = [], y0 = [], i;
      if (st.tipo === 'fd') {
        for (i = 0; i <= 300; i++) { var E = 2 * i / 300; xs.push(E); ys.push(fd(E, mu, st.tau)); y0.push(E < 1 ? 1 : 0); }
        F.grafico(tela, { serie: [{ x: xs, y: y0, col: '#34465f', tratt: true, etich: 'T = 0' }, { x: xs, y: ys, col: '#5eead4', etich: 'f(E)' }], xmin: 0, xmax: 2, ymin: 0, ymax: 1.05, xl: ['E/E_F', 'E/E_F'], yl: ['occupazione f(E)', 'occupation f(E)'], descr: ['Distribuzione di Fermi–Dirac', 'Fermi–Dirac distribution'] });
        /* la curva μ(T) numerica costa (bisezione su integrali): si calcola a lotti, fuori dal ridisegno */
        if (!curve.fd) { curve.fd = { x: [], mu: [], s: [], pronta: false }; (function lotto(i0) { for (var i = i0; i < i0 + 3 && i <= 40; i++) curve.fd.mu.push(fermiMu(i / 40)); if (i <= 40) setTimeout(function () { lotto(i); }, 0); else { curve.fd.pronta = true; if (st.tipo === 'fd') disegna(); } })(1); }
        var xt = [], ym = [], ys2 = [];
        for (i = 1; i <= 40; i++) { xt.push(i / 40); ys2.push(sommerfeld(i / 40)); ym.push(curve.fd.pronta ? curve.fd.mu[i - 1] : NaN); }
        F.grafico(tela2, { serie: [{ x: xt, y: ym, col: '#ffd24a', etich: t('numerico', 'numerical') }, { x: xt, y: ys2, col: '#ff8a80', tratt: true, etich: 'Sommerfeld' }], punti: [{ x: st.tau, y: mu, col: '#5eead4', r: 5 }], xmin: 0, xmax: 1, xl: ['kT/E_F', 'kT/E_F'], yl: ['μ/E_F', 'μ/E_F'], legenda: [{ col: '#ffd24a', etich: ['μ(T) numerico', 'μ(T) numerical'] }, { col: '#ff8a80', etich: ['1 − π²/12 (kT/E_F)²', '1 − π²/12 (kT/E_F)²'] }], descr: ['Potenziale chimico del gas di Fermi in funzione della temperatura', 'Fermi gas chemical potential versus temperature'] });
        var n = METALLI[st.met][1], EF = energiaFermi(n), TF = EF / kB, vF = Math.sqrt(2 * EF / me);
        info.innerHTML = 'E<sub>F</sub> = <b>' + (EF / eV).toFixed(2) + ' eV</b> · T<sub>F</sub> = <b>' + fmt(TF) + ' K</b> · v<sub>F</sub> = ' + fmt(vF / 1e6) + '·10⁶ m/s<br>' +
          'kT = ' + fmt(st.tau) + ' E<sub>F</sub> = ' + fmt(st.tau * TF) + ' K · μ = <b>' + mu.toFixed(5) + ' E<sub>F</sub></b> (Sommerfeld ' + sommerfeld(st.tau).toFixed(5) + ')<br>' +
          t('A temperatura ambiente kT/E_F = ', 'At room temperature kT/E_F = ') + fmt(300 / TF) + ': ' + t('il gas di elettroni è profondamente degenere.', 'the electron gas is deeply degenerate.');
      } else {
        for (i = 1; i <= 300; i++) { var E2 = 3 * i / 300; xs.push(E2); ys.push(Math.min(10, be(E2, bz.mu, st.tau))); y0.push(Math.min(10, Math.exp(-(E2 - bz.mu) / st.tau))); }
        F.grafico(tela, { serie: [{ x: xs, y: ys, col: '#c49bff', etich: 'BE' }, { x: xs, y: y0, col: '#34465f', tratt: true, etich: 'MB' }], xmin: 0, xmax: 3, ymin: 0, ymax: 3, xl: ['E/kT_c', 'E/kT_c'], yl: ['occupazione ⟨n⟩', 'occupation ⟨n⟩'], legenda: [{ col: '#c49bff', etich: ['Bose–Einstein', 'Bose–Einstein'] }, { col: '#34465f', etich: ['Boltzmann, stesso μ', 'Boltzmann, same μ'] }], descr: ['Distribuzione di Bose–Einstein', 'Bose–Einstein distribution'] });
        if (!curve.be) { curve.be = { x: [], y: [] }; for (i = 0; i <= 100; i++) { var tt = 2 * i / 100; curve.be.x.push(tt); curve.be.y.push(tt <= 1 ? 1 - Math.pow(tt, 1.5) : 0); } }
        var xt2 = curve.be.x, yf = curve.be.y;
        F.grafico(tela2, { serie: [{ x: xt2, y: yf, col: '#c49bff', etich: 'N₀/N' }], punti: [{ x: st.tau, y: bz.n0, col: '#ffd24a', r: 5 }], xmin: 0, xmax: 2, ymin: 0, ymax: 1.05, xl: ['T/T_c', 'T/T_c'], yl: ['N₀/N', 'N₀/N'], descr: ['Frazione condensata 1 − (T/T_c)^(3/2)', 'Condensate fraction 1 − (T/T_c)^(3/2)'] });
        var mHe = 4.002602 * uma, nHe = 145 / mHe;
        info.innerHTML = 'N₀/N = <b>' + bz.n0.toFixed(4) + '</b> · z = ' + bz.z.toFixed(5) + ' · μ = ' + fmt(bz.mu) + ' kT<sub>c</sub><br>' +
          'ζ(3/2) = ' + zeta(1.5).toFixed(6) + '<br>' + t('Elio-4 liquido come gas ideale (ρ = 0,145 g/cm³): T_c = ', 'Liquid helium-4 as an ideal gas (ρ = 0.145 g/cm³): T_c = ') + '<b>' + tempCritica(nHe, mHe).toFixed(2) + ' K</b>' + t(' (la transizione λ vera è a 2,17 K: le interazioni contano)', ' (the real λ transition is at 2.17 K: interactions matter)');
      }
    }
    calcola();
    F.alRidimensiona(disegna);
    return {
      tre: function (S, T, L3) {
        /* lo spazio dei momenti: una griglia di stati k, luminosi se occupati */
        var M = 15, pts = [], k2 = [], rj = mulberry32(5);
        for (var i = -M; i <= M; i++) for (var j = -M; j <= M; j++) for (var l = -M; l <= M; l++) { var q = (i * i + j * j + l * l) / (M * M) * 2.4; if (q > 2.4) continue; var jx = (rj() - 0.5) * 0.3, jy = (rj() - 0.5) * 0.3, jz = (rj() - 0.5) * 0.3; pts.push((i + jx) / M * 3.2, (j + jy) / M * 3.2, (l + jz) / M * 3.2); k2.push(((i + jx) * (i + jx) + (j + jy) * (j + jy) + (l + jz) * (l + jz)) / (M * M) * 2.4); }
        var n = k2.length, colori = new Float32Array(3 * n), g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new T.BufferAttribute(colori, 3));
        S.aggiungi(new T.Points(g, new T.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })));
        var sfF = new T.Mesh(new T.SphereGeometry(3.2 / Math.sqrt(2.4), 48, 32), new T.MeshBasicMaterial({ color: 0x5eead4, wireframe: true, transparent: true, opacity: 0.12 })); S.aggiungi(sfF);
        var cond = bagliore(T, 0xc49bff, 1); S.aggiungi(cond);
        var nucleo = new T.Mesh(new T.SphereGeometry(1, 32, 24), new T.MeshStandardMaterial({ color: 0xd8c2ff, emissive: 0x7a4fd0, emissiveIntensity: 0.8 })); S.aggiungi(nucleo);
        S.aggiungi(L3.assi(T, 4, ['kₓ', 'k_y', 'k_z'], 0.3));
        cb.aggiorna = function () {
          var fdm = st.tipo === 'fd';
          for (var i = 0; i < n; i++) {
            var E = k2[i], o, c;
            if (fdm) { o = fd(E, mu, st.tau); c = E < 1 ? [0.37, 0.92, 0.83] : [1, 0.82, 0.29]; }
            else { o = E === 0 ? 0 : Math.min(1, 0.35 * be(E * 1.2, bz.mu, st.tau)); c = [0.77, 0.6, 1]; }
            colori[3 * i] = c[0] * o; colori[3 * i + 1] = c[1] * o; colori[3 * i + 2] = c[2] * o;
          }
          g.attributes.color.needsUpdate = true;
          sfF.visible = fdm;
          var f0 = fdm ? 0 : bz.n0, r = 0.12 + 0.9 * Math.cbrt(f0);
          nucleo.visible = cond.visible = !fdm && f0 > 0; nucleo.scale.setScalar(r * 0.6); cond.scale.setScalar(r * 3);
          S.didascalia.textContent = fdm ? t('Sfera di Fermi nello spazio dei k a kT = ', 'Fermi sphere in k-space at kT = ') + fmt(st.tau) + ' E_F' : t('Bosoni nello spazio dei k a T = ', 'Bosons in k-space at T = ') + fmt(st.tau) + ' T_c · N₀/N = ' + bz.n0.toFixed(2);
          S.sporca = true; S.avvia();
        };
        cb.aggiorna();
        S.inquadra(11, 0.6, 1.1);
      }
    };
  }

  /* ─── 4. Einstein e Debye ──────────────────────────────────────────────── */
  function schedaSolidi(pan, destra) {
    var st = { sol: 'Cu', th: 343, rapE: Math.sqrt(3 / 5), T: 100, modello: 'debye', log: false };
    eq(pan, 'C_D = 9R (T/Θ)³ ∫₀^(Θ/T) x⁴eˣ/(eˣ−1)² dx');
    F.scelta(pan, ['Solido', 'Solid'], Object.keys(SOLIDI).map(function (k) { return [k, F.tt(SOLIDI[k][0]) + ' (Θ_D = ' + SOLIDI[k][1] + ' K)']; }), st.sol, function (v) { st.sol = v; st.th = SOLIDI[v][1]; disegna(); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 2, 1200, 2, st.T, function (v) { st.T = v; disegna(); });
    F.scelta(pan, ['Reticolo 3D', '3D lattice'], [['debye', t('Debye: fononi (onde)', 'Debye: phonons (waves)')], ['einstein', t('Einstein: oscillatori indipendenti', 'Einstein: independent oscillators')]], st.modello, function (v) { st.modello = v; disegna(); });
    F.scelta(pan, ['Assi del grafico', 'Chart axes'], [['lin', t('lineari', 'linear')], ['log', t('logaritmici (legge T³)', 'logarithmic (T³ law)')]], 'lin', function (v) { st.log = v === 'log'; disegna(); });
    var info = nota(pan);
    nota(pan, t('Dulong e Petit (1819): ogni solido ha C ≈ 3R = 24,9 J/(mol K). Ma a bassa temperatura C crolla: i modi di vibrazione sono quantizzati e quelli con ħω ≫ kT sono «congelati». Einstein (1907) usa una sola frequenza: C cala in modo esponenziale, troppo in fretta. Debye (1912) usa le onde sonore fino a una frequenza massima ω_D: a bassa T restano attive solo le onde lunghe, il loro numero cresce come T³ e così C. Θ_E = √(3/5) Θ_D dà ai due modelli la stessa frequenza quadratica media.',
      'Dulong and Petit (1819): every solid has C ≈ 3R = 24.9 J/(mol K). But at low temperature C collapses: vibration modes are quantised and those with ħω ≫ kT are «frozen». Einstein (1907) uses a single frequency: C drops exponentially, too fast. Debye (1912) uses sound waves up to a maximum frequency ω_D: at low T only long waves remain active, their number grows as T³ and so does C. Θ_E = √(3/5) Θ_D gives the two models the same mean-square frequency.'));
    var tela = F.tela(destra, 0.5), cb = {};
    function disegna() {
      var th = st.th, thE = th * st.rapE, xs = [], yd = [], ye = [], y3 = [], i;
      for (i = 1; i <= 240; i++) {
        var T = st.log ? th * Math.pow(10, -2.3 + 2.6 * i / 240) : 1.5 * th * i / 240;
        var cd = debyeC(T, th) / (3 * R), ce = einsteinC(T, thE) / (3 * R), c3 = debyeT3(T, th) / (3 * R);
        if (st.log) { xs.push(Math.log10(T)); yd.push(Math.log10(cd)); ye.push(ce > 1e-12 ? Math.log10(ce) : NaN); y3.push(Math.log10(c3)); }
        else { xs.push(T); yd.push(cd); ye.push(ce); y3.push(c3 < 1.2 ? c3 : NaN); }
      }
      var cT = debyeC(st.T, th), punti = [{ x: st.log ? Math.log10(st.T) : st.T, y: st.log ? Math.log10(cT / (3 * R)) : cT / (3 * R), col: '#ff8a80', r: 5 }];
      if (st.sol === 'Cu' && !st.log) punti.push({ x: 298.15, y: 24.44 / (3 * R), col: '#ffffff', r: 4 });
      F.grafico(tela, { serie: [{ x: xs, y: yd, col: '#5eead4', etich: 'Debye' }, { x: xs, y: ye, col: '#c49bff', etich: 'Einstein' }, { x: xs, y: y3, col: '#ffd24a', tratt: true, etich: 'T³' }], punti: punti, linee: st.log ? [] : [{ y: 1, col: '#34465f', etich: 'Dulong–Petit 3R' }], ymin: st.log ? -6 : 0, ymax: st.log ? 0.3 : 1.1, xl: st.log ? ['log₁₀ T (K)', 'log₁₀ T (K)'] : ['T (K)', 'T (K)'], yl: st.log ? ['log₁₀ C/3R', 'log₁₀ C/3R'] : ['C/3R', 'C/3R'], legenda: [{ col: '#5eead4', etich: ['Debye', 'Debye'] }, { col: '#c49bff', etich: ['Einstein, Θ_E = √(3/5) Θ_D', 'Einstein, Θ_E = √(3/5) Θ_D'] }, { col: '#ffd24a', etich: ['(12π⁴/5) R (T/Θ_D)³', '(12π⁴/5) R (T/Θ_D)³'] }], descr: ['Capacità termica molare dei solidi: Einstein e Debye', 'Molar heat capacity of solids: Einstein and Debye'] });
      info.innerHTML = 'T = ' + st.T + ' K, Θ<sub>D</sub> = ' + th + ' K<br>C<sub>Debye</sub> = <b>' + cT.toFixed(3) + ' J/(mol K)</b> = ' + (cT / (3 * R)).toFixed(4) + ' · 3R<br>' +
        'C<sub>Einstein</sub> = <b>' + einsteinC(st.T, thE).toFixed(3) + '</b> · ' + t('legge T³: ', 'T³ law: ') + debyeT3(st.T, th).toFixed(3) + ' J/(mol K)' +
        (st.sol === 'Cu' ? '<br>' + t('Rame, misurato a 298,15 K: C_p = 24,44 J/(mol K) (punto bianco; C_p − C_V ≈ 0,6)', 'Copper, measured at 298.15 K: C_p = 24.44 J/(mol K) (white point; C_p − C_V ≈ 0.6)') : '');
      if (cb.aggiorna) cb.aggiorna();
    }
    disegna(); F.alRidimensiona(disegna);
    return {
      tre: function (S, T, L3) {
        var n = 9, N = n * n * n, a = 0.9, base = new Float32Array(3 * N), k = 0, i, j, l;
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) for (l = 0; l < n; l++) { base[3 * k] = (i - (n - 1) / 2) * a; base[3 * k + 1] = (j - (n - 1) / 2) * a; base[3 * k + 2] = (l - (n - 1) / 2) * a; k++; }
        var mesh = new T.InstancedMesh(new T.SphereGeometry(0.16, 16, 12), new T.MeshStandardMaterial({ color: 0xd9895b, metalness: 0.6, roughness: 0.3 }), N);
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); S.aggiungi(mesh);
        /* i legami fra primi vicini */
        var coppie = []; for (i = 0; i < N; i++) { var I = Math.floor(i / (n * n)), J = Math.floor(i / n) % n, Lz = i % n; if (I < n - 1) coppie.push(i, i + n * n); if (J < n - 1) coppie.push(i, i + n); if (Lz < n - 1) coppie.push(i, i + 1); }
        var lp = new Float32Array(coppie.length * 3), lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(lp, 3));
        S.aggiungi(new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.3 })));
        var luce = new T.PointLight(0xffe0c0, 0.7, 50); luce.position.set(8, -6, 9); S.aggiungi(luce);
        /* i modi: per Debye onde piane con |k| ≤ k_D, ω ∝ |k|; per Einstein ogni atomo con la sua fase */
        var rnd = mulberry32(17), modi = [], fasi = new Float32Array(3 * N), dirs = [];
        for (i = 0; i < 48; i++) {
          var z = 2 * rnd() - 1, f = 2 * PI * rnd(), s = Math.sqrt(1 - z * z), kk = Math.cbrt(rnd()), dir = [s * Math.cos(f), s * Math.sin(f), z];
          var z2 = 2 * rnd() - 1, f2 = 2 * PI * rnd(), s2 = Math.sqrt(1 - z2 * z2), pol = [s2 * Math.cos(f2), s2 * Math.sin(f2), z2];
          if (i % 3 === 0) pol = dir.slice(); /* un modo su tre longitudinale */
          modi.push({ k: kk, dir: dir, pol: pol, fase: 2 * PI * rnd(), amp: 0 });
        }
        for (i = 0; i < 3 * N; i++) fasi[i] = 2 * PI * rnd();
        var M4 = new T.Matrix4(), tempo = 0, pos = new Float32Array(3 * N);
        cb.aggiorna = function () {
          var x = st.th / Math.max(1e-3, st.T);
          /* ampiezza² ∝ (⟨n⟩ + ½)/ω; normalizzata a quella classica a T = Θ_D per il modo piu' alto */
          modi.forEach(function (m) { var xm = x * m.k; m.amp = 0.025 * Math.sqrt(occupazione(xm) / m.k / occupazione(1)); });
          cb.ampE = 0.11 * Math.sqrt(occupazione(x * st.rapE) / occupazione(1));
          S.didascalia.textContent = (st.modello === 'debye' ? t('Reticolo di Debye: ', 'Debye lattice: ') : t('Reticolo di Einstein: ', 'Einstein lattice: ')) + F.tt(SOLIDI[st.sol][0]) + t(' a T = ', ' at T = ') + st.T + ' K (T/Θ_D = ' + fmt(st.T / st.th) + ')';
          S.avvia();
        };
        cb.aggiorna();
        S.ogniFotogramma(function (dt) {
          tempo += dt; var deb = st.modello === 'debye', w0 = 7;
          for (var i = 0; i < N; i++) {
            var x = base[3 * i], y = base[3 * i + 1], z = base[3 * i + 2], ux = 0, uy = 0, uz = 0;
            if (deb) for (var q = 0; q < modi.length; q++) { var m = modi[q], kx = m.k * PI / a, ar = kx * (m.dir[0] * x + m.dir[1] * y + m.dir[2] * z) - w0 * m.k * tempo + m.fase, c = m.amp * Math.cos(ar); ux += c * m.pol[0]; uy += c * m.pol[1]; uz += c * m.pol[2]; }
            else { var A = cb.ampE, wE = w0 * st.rapE; ux = A * Math.cos(wE * tempo + fasi[3 * i]); uy = A * Math.cos(wE * tempo * 1.07 + fasi[3 * i + 1]); uz = A * Math.cos(wE * tempo * 0.94 + fasi[3 * i + 2]); }
            pos[3 * i] = x + ux; pos[3 * i + 1] = y + uy; pos[3 * i + 2] = z + uz;
            M4.makeTranslation(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]); mesh.setMatrixAt(i, M4);
          }
          mesh.instanceMatrix.needsUpdate = true;
          for (i = 0; i < coppie.length; i++) { var p = coppie[i]; lp[3 * i] = pos[3 * p]; lp[3 * i + 1] = pos[3 * p + 1]; lp[3 * i + 2] = pos[3 * p + 2]; }
          lg.attributes.position.needsUpdate = true;
          return true;
        });
        S.inquadra(15, 0.7, 1.1);
      }
    };
  }

  F.sezione('sfisstat', {
    titolo: ['🎲 Meccanica statistica', '🎲 Statistical mechanics'],
    sotto: ['Dal fattore di Boltzmann alle distribuzioni che descrivono gas, elettroni nei metalli, condensati di Bose e vibrazioni dei solidi: livelli e anomalia di Schottky, Maxwell–Boltzmann con un gas di sfere dure in 3D, Fermi–Dirac e Bose–Einstein nello spazio dei momenti, capacità termiche di Einstein e Debye.', 'From the Boltzmann factor to the distributions describing gases, electrons in metals, Bose condensates and vibrations of solids: levels and the Schottky anomaly, Maxwell–Boltzmann with a 3D hard-sphere gas, Fermi–Dirac and Bose–Einstein in momentum space, Einstein and Debye heat capacities.'],
    schede: [
      { nome: ['📶 Livelli e Schottky', '📶 Levels and Schottky'], costruisci: schedaLivelli },
      { nome: ['🫧 Maxwell–Boltzmann', '🫧 Maxwell–Boltzmann'], costruisci: scheda3D(schedaMB) },
      { nome: ['🌐 Fermi e Bose', '🌐 Fermi and Bose'], costruisci: scheda3D(schedaQuantistici) },
      { nome: ['🧊 Solidi: Einstein e Debye', '🧊 Solids: Einstein and Debye'], costruisci: scheda3D(schedaSolidi) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
