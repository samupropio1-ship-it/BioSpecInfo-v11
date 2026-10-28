/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-stelle.js — ⭐ vita delle stelle in 3D
   BioSpecInfo · © Samuele Pio Provenzano

   Il diagramma H-R e il corpo nero (bsi-fis-astro.js) mostrano le stelle
   dall'esterno; qui le si apre e le si segue nel tempo:

   · LA STELLA TAGLIATA: una sfera con uno spicchio tolto; il nucleo dove
     avviene la fusione (dimensionato dal politropo n = 3, con la produzione
     di energia ε ∝ ρT^ν: il raggio entro cui nasce il 90 % della luminosita'),
     la zona radiativa, la zona convettiva con le celle che ruotano, la
     superficie granulata (shader a celle di Voronoi animate) con
     l'oscuramento al bordo I(μ) = 1 − u(1 − μ), e il cammino dell'energia:
     un fotone che fa la passeggiata casuale nella zona radiativa, poi la
     convezione, poi la fuga dalla fotosfera;
   · LA STRUTTURA: l'equazione di Lane-Emden θ'' + (2/ξ)θ' + θⁿ = 0 risolta
     con Runge-Kutta per n da 0 a 5: il primo zero ξ₁ (√6, π, 3,6538, 6,8969,
     ∞), il rapporto ρ_c/ρ̄, la pressione centrale, la relazione massa-raggio
     R ∝ M^((1−n)/(3−n)) e la massa di Chandrasekhar dal politropo n = 3;
     la densita' come nuvola di punti in 3D;
   · L'EVOLUZIONE: le tracce nel diagramma H-R per 1, 5 e 15 M☉ (schematiche,
     tempo sulla sequenza principale ∝ M^(−2,5)) con una stella 3D che cambia
     raggio e colore: gigante rossa, nebulosa planetaria che si espande come
     guscio di particelle, nana bianca; supernova come esplosione di
     particelle, stella di neutroni;
   · LA NUCLEOSINTESI: la catena pp e il ciclo CNO animati con i nuclei fatti
     di protoni e neutroni, l'energia di ogni reazione dalle masse atomiche
     (26,73 MeV per ogni ⁴He), ε_pp e ε_CNO contro la temperatura (sorpasso
     verso 17-18 milioni di K), l'energia di legame per nucleone che spiega
     perche' la fusione si ferma al ferro.

   I calcoli (F.calcolo.stelle) sono funzioni pure, separate dal disegno.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  var G = 6.67430e-11, c = 299792458, HBAR = 1.054571817e-34, MU = 1.66053906660e-27, MSOLE = 1.98847e30, RSOLE = 6.957e8, LSOLE = 3.828e26, TSOLE = 5772,
    ANNO = 3.15576e7, MEV_U = 931.49410242, WIEN = 2.897771955e-3, HPLANCK = 6.62607015e-34, KB = 1.380649e-23;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* Lane-Emden: y = [θ, θ'], partenza dalla serie θ ≈ 1 − ξ²/6 + nξ⁴/120 */
  function laneEmden(n, opz) {
    opz = opz || {};
    var h = opz.h || 1e-3, xmax = opz.xmax || 400, x = 1e-3, th = 1 - x * x / 6 + n * Math.pow(x, 4) / 120, dth = -x / 3 + n * Math.pow(x, 3) / 30;
    var X = [0], TH = [1], DTH = [0], pw = function (v) { return v > 0 ? Math.pow(v, n) : (n === 0 ? 1 : 0); };
    function d(xx, a, b) { return [b, -pw(a) - 2 * b / xx]; }
    var zero = null, dzero = null, salva = opz.salva || 1, k = 0;
    while (x < xmax) {
      var k1 = d(x, th, dth), k2 = d(x + h / 2, th + h / 2 * k1[0], dth + h / 2 * k1[1]), k3 = d(x + h / 2, th + h / 2 * k2[0], dth + h / 2 * k2[1]), k4 = d(x + h, th + h * k3[0], dth + h * k3[1]);
      var thn = th + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), dthn = dth + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (thn <= 0) {
        /* lo zero con un'interpolazione cubica di Hermite tra i due passi */
        var lo = 0, hi = 1;
        var herm = function (s) { var s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * th + (s3 - 2 * s2 + s) * h * dth + (-2 * s3 + 3 * s2) * thn + (s3 - s2) * h * dthn; };
        for (var it = 0; it < 80; it++) { var m = 0.5 * (lo + hi); if (herm(m) > 0) lo = m; else hi = m; }
        zero = x + h * 0.5 * (lo + hi); dzero = dth + (dthn - dth) * 0.5 * (lo + hi);
        X.push(zero); TH.push(0); DTH.push(dzero);
        break;
      }
      x += h; th = thn; dth = dthn; k++;
      if (k % salva === 0) { X.push(x); TH.push(th); DTH.push(dth); }
    }
    var out = { n: n, xi: X, theta: TH, dtheta: DTH, xi1: zero === null ? Infinity : zero, dtheta1: dzero };
    if (zero !== null) {
      out.omega = -zero * zero * dzero;            /* M = 4πρ_c α³ ω_n */
      out.rhoRapporto = -zero / (3 * dzero);       /* ρ_c / ρ̄ */
      out.Wn = 1 / (4 * Math.PI * (n + 1) * dzero * dzero); /* P_c = W_n G M² / R⁴ */
    }
    return out;
  }
  /* soluzioni esatte per n = 0, 1, 5 */
  function laneEmdenEsatta(n, x) { if (n === 0) return 1 - x * x / 6; if (n === 1) return x === 0 ? 1 : Math.sin(x) / x; if (n === 5) return 1 / Math.sqrt(1 + x * x / 3); return NaN; }
  /* esponente della relazione massa-raggio di un politropo a K fissato: R ∝ M^((1−n)/(3−n)) */
  function esponenteMR(n) { return (1 - n) / (3 - n); }
  /* massa di Chandrasekhar: (√(3π)/2) ω₃ (ħc/G)^(3/2) / (μ_e m_u)² */
  function chandrasekhar(mue, omega3) { return Math.sqrt(3 * Math.PI) / 2 * omega3 * Math.pow(HBAR * c / G, 1.5) / Math.pow(mue * MU, 2); }
  function pressioneCentrale(Wn, M, R) { return Wn * G * M * M / Math.pow(R, 4); }
  /* frazione della luminosita' generata entro ξ in un politropo con ε ∝ ρ T^ν ∝ θ^(n + ν) (gas ideale, μ costante) */
  function raggioNucleo(n, nu, frazione) {
    var L = laneEmden(n, { h: 2e-3 }), tot = 0, cum = [0];
    for (var i = 1; i < L.xi.length; i++) { var a = L.xi[i - 1], b = L.xi[i], fa = Math.pow(Math.max(0, L.theta[i - 1]), n + nu) * a * a, fb = Math.pow(Math.max(0, L.theta[i]), n + nu) * b * b; tot += 0.5 * (fa + fb) * (b - a); cum.push(tot); }
    for (i = 1; i < cum.length; i++) if (cum[i] >= (frazione || 0.9) * tot) return L.xi[i] / L.xi1;
    return 1;
  }
  /* sequenza principale (relazioni empiriche, unita' solari) e durata ∝ M^(−2,5) */
  function sequenza(M) {
    var L = M < 0.43 ? 0.23 * Math.pow(M, 2.3) : M < 2 ? Math.pow(M, 4) : M < 55 ? 1.4 * Math.pow(M, 3.5) : 32000 * M;
    var R = M < 1 ? Math.pow(M, 0.8) : Math.pow(M, 0.57), T = TSOLE * Math.pow(L / (R * R), 0.25);
    return { M: M, L: L, R: R, T: T, tMS: 1e10 * Math.pow(M, -2.5) };
  }
  /* secondo metodo per il Sole: si brucia il 10 % dell'idrogeno con efficienza 0,007 */
  function vitaCombustibile(M, L) { return 0.1 * 0.007 * M * MSOLE * c * c / (L * LSOLE) / ANNO; }
  function raggioDa(L, T) { return Math.sqrt(L) * Math.pow(TSOLE / T, 2); }
  /* zone (modello semplice): nana tutta convettiva, Sole con inviluppo convettivo da 0,713 R, stelle massicce con nucleo convettivo */
  function zone(M) {
    var nucleo = raggioNucleo(3, M > 1.3 ? 17 : 4, 0.9);
    if (M < 0.35) return { nucleo: nucleo, tipo: 'convettiva', baseConv: 0, nucleoConv: 0 };
    if (M <= 1.3) { var b = M < 1 ? 0.35 + (0.713 - 0.35) * (M - 0.35) / 0.65 : 0.713 + (0.97 - 0.713) * (M - 1) / 0.3; return { nucleo: nucleo, tipo: 'sole', baseConv: b, nucleoConv: 0 }; }
    return { nucleo: nucleo, tipo: 'massiccia', baseConv: 1, nucleoConv: Math.min(0.45, 0.18 + 0.06 * Math.log(M)) };
  }
  /* Wien e Planck */
  function wien(T) { return WIEN / T; }
  function planck(l, T) { return 2 * HPLANCK * c * c / Math.pow(l, 5) / (Math.exp(HPLANCK * c / (l * KB * T)) - 1); }
  function piccoPlanck(T) { var a = 1e-8, b = 1e-4, g = (Math.sqrt(5) - 1) / 2; for (var i = 0; i < 200; i++) { var x1 = b - g * (b - a), x2 = a + g * (b - a); if (planck(x1, T) > planck(x2, T)) b = x2; else a = x1; } return 0.5 * (a + b); }
  function classe(T) { return T >= 30000 ? 'O' : T >= 10000 ? 'B' : T >= 7500 ? 'A' : T >= 6000 ? 'F' : T >= 5200 ? 'G' : T >= 3700 ? 'K' : 'M'; }
  /* colore di un corpo nero (Helland), 0-1 */
  function coloreT(T) {
    T = Math.max(1000, Math.min(40000, T)) / 100; var r, g, b;
    if (T <= 66) { r = 1; g = Math.max(0, Math.min(1, 0.39008158 * Math.log(T) - 0.63184144)); } else { r = Math.max(0, Math.min(1, 1.29293619 * Math.pow(T - 60, -0.13320476))); g = Math.max(0, Math.min(1, 1.12989086 * Math.pow(T - 60, -0.07551485))); }
    b = T >= 66 ? 1 : T <= 19 ? 0 : Math.max(0, Math.min(1, 0.54320679 * Math.log(T - 10) - 1.19625409));
    return [r, g, b];
  }

  /* ── nucleare ── masse atomiche (u, AME2020) */
  var MASSE = { H1: 1.00782503207, H2: 2.01410177812, He3: 3.0160293201, He4: 4.00260325413, C12: 12, C13: 13.00335483507, N13: 13.00573861, N14: 14.00307400443, N15: 15.00010889888, O15: 15.0030656, O16: 15.99491461957, Fe56: 55.93493633, Ni62: 61.92834537, U238: 238.0507884, n: 1.00866491595 };
  /* Q delle reazioni con le masse atomiche (l'annichilazione del positrone e' gia' inclusa) */
  var PP = [['p + p → ²H + e⁺ + νₑ', ['H1', 'H1'], ['H2'], 0.265], ['²H + p → ³He + γ', ['H2', 'H1'], ['He3'], 0], ['³He + ³He → ⁴He + 2p', ['He3', 'He3'], ['He4', 'H1', 'H1'], 0]];
  var CNO = [['¹²C + p → ¹³N + γ', ['C12', 'H1'], ['N13'], 0], ['¹³N → ¹³C + e⁺ + νₑ', ['N13'], ['C13'], 0.707], ['¹³C + p → ¹⁴N + γ', ['C13', 'H1'], ['N14'], 0], ['¹⁴N + p → ¹⁵O + γ', ['N14', 'H1'], ['O15'], 0], ['¹⁵O → ¹⁵N + e⁺ + νₑ', ['O15'], ['N15'], 0.997], ['¹⁵N + p → ¹²C + ⁴He', ['N15', 'H1'], ['C12', 'He4'], 0]];
  function Q(r) { var a = 0, b = 0; r[1].forEach(function (k) { a += MASSE[k]; }); r[2].forEach(function (k) { b += MASSE[k]; }); return (a - b) * MEV_U; }
  function energiaElio() { return (4 * MASSE.H1 - MASSE.He4) * MEV_U; }
  function energiaPP() { return 2 * Q(PP[0]) + 2 * Q(PP[1]) + Q(PP[2]); }
  function energiaCNO() { return CNO.reduce(function (s, r) { return s + Q(r); }, 0); }
  /* energia di legame per nucleone: dalle masse e dalla formula semiempirica (Bethe-Weizsäcker) */
  function legameMasse(Z, A, m) { return ((Z * MASSE.H1 + (A - Z) * MASSE.n) - m) * MEV_U / A; }
  function legameSEMF(Z, A) {
    var N = A - Z, d = 0, B = 15.75 * A - 17.8 * Math.pow(A, 2 / 3) - 0.711 * Z * (Z - 1) / Math.cbrt(A) - 23.7 * Math.pow(N - Z, 2) / A;
    if (Z % 2 === 0 && N % 2 === 0) d = 11.18 / Math.sqrt(A); else if (Z % 2 === 1 && N % 2 === 1) d = -11.18 / Math.sqrt(A);
    return (B + d) / A;
  }
  /* Z della valle di stabilita' per un A dato */
  function zStabile(A) { return A / (1.98 + 0.0155 * Math.pow(A, 2 / 3)); }
  function legameValle(A) { var Z = zStabile(A), N = A - Z; return (15.75 * A - 17.8 * Math.pow(A, 2 / 3) - 0.711 * Z * (Z - 1) / Math.cbrt(A) - 23.7 * (N - Z) * (N - Z) / A) / A; }
  /* tassi di produzione (W/kg), formule standard con ρ in kg/m³ (Kippenhahn-Weigert, Clayton) */
  function epsPP(T, rho, X) { var T9 = T / 1e9, g11 = 1 + 3.82 * T9 + 1.51 * T9 * T9 + 0.144 * Math.pow(T9, 3) - 0.0114 * Math.pow(T9, 4); return 2.57e4 * g11 * (rho / 1000) * X * X * Math.pow(T9, -2 / 3) * Math.exp(-3.381 / Math.cbrt(T9)) * 1e-4; }
  function epsCNO(T, rho, X, Xcno) { var T9 = T / 1e9, g14 = 1 - 2.00 * T9 + 3.41 * T9 * T9 - 2.43 * Math.pow(T9, 3); return 8.24e25 * g14 * X * Xcno * (rho / 1000) * Math.pow(T9, -2 / 3) * Math.exp(-15.231 * Math.pow(T9, -1 / 3) - Math.pow(T9 / 0.8, 2)) * 1e-4; }
  /* esponente locale ν = d ln ε / d ln T, numerico e dalla forma di Gamow (τ/3 − 2/3) */
  function nuNumerico(f, T) { var h = 1e-4; return (Math.log(f(T * (1 + h))) - Math.log(f(T * (1 - h)))) / (Math.log(1 + h) - Math.log(1 - h)); }
  function nuGamow(coeff, T) { var tau = coeff / Math.cbrt(T / 1e9); return tau / 3 - 2 / 3; }
  function sorpasso(rho, X, Xcno) { var lo = 10e6, hi = 30e6; for (var i = 0; i < 100; i++) { var m = 0.5 * (lo + hi); if (epsPP(m, rho, X) > epsCNO(m, rho, X, Xcno)) lo = m; else hi = m; } return 0.5 * (lo + hi); }

  /* ── tracce evolutive (schematiche): [log T, log L, fase, durata in frazioni di t_MS] ── */
  var TRACCE = {
    1: [[3.751, -0.15, 'ms', 0], [3.762, 0.32, 'ms', 1], [3.72, 0.42, 'sub', 0.12], [3.66, 0.6, 'rgb', 0.05], [3.6, 1.6, 'rgb', 0.04], [3.53, 3.35, 'rgb', 0.01], [3.70, 1.7, 'hb', 0.001], [3.69, 1.75, 'hb', 0.012], [3.6, 2.7, 'agb', 0.002], [3.5, 3.6, 'agb', 0.0005], [4.3, 3.65, 'pn', 0.00002], [5.0, 3.3, 'pn', 0.00002], [5.05, 2.0, 'wd', 0.00005], [4.6, 0, 'wd', 0.05], [4.0, -2.8, 'wd', 1]],
    5: [[4.24, 2.75, 'ms', 0], [4.18, 3.0, 'ms', 1], [4.22, 3.05, 'ms', 0.01], [3.9, 2.95, 'sub', 0.004], [3.65, 2.9, 'rgb', 0.003], [3.6, 3.1, 'rgb', 0.01], [4.05, 3.18, 'loop', 0.06], [3.63, 3.25, 'loop', 0.06], [3.55, 3.7, 'agb', 0.01], [3.5, 4.1, 'agb', 0.002], [4.4, 4.15, 'pn', 0.00001], [5.1, 3.9, 'pn', 0.00001], [5.15, 2.5, 'wd', 0.00005], [4.7, 0, 'wd', 0.5], [4.2, -2.0, 'wd', 5]],
    15: [[4.49, 4.3, 'ms', 0], [4.44, 4.6, 'ms', 1], [4.46, 4.65, 'ms', 0.005], [4.1, 4.75, 'sub', 0.004], [3.7, 4.85, 'rsg', 0.01], [3.55, 4.95, 'rsg', 0.08], [3.54, 5.0, 'rsg', 0.01], [3.54, 5.0, 'sn', 0.000001], [5.6, -1.0, 'ns', 0.0001]]
  };
  F.calcolo.stelle = {
    G: G, MSOLE: MSOLE, RSOLE: RSOLE, MASSE: MASSE, PP: PP, CNO: CNO, TRACCE: TRACCE,
    laneEmden: laneEmden, laneEmdenEsatta: laneEmdenEsatta, esponenteMR: esponenteMR, chandrasekhar: chandrasekhar, pressioneCentrale: pressioneCentrale,
    raggioNucleo: raggioNucleo, sequenza: sequenza, vitaCombustibile: vitaCombustibile, raggioDa: raggioDa, zone: zone, wien: wien, planck: planck, piccoPlanck: piccoPlanck,
    classe: classe, coloreT: coloreT, Q: Q, energiaElio: energiaElio, energiaPP: energiaPP, energiaCNO: energiaCNO, legameMasse: legameMasse, legameSEMF: legameSEMF,
    legameValle: legameValle, epsPP: epsPP, epsCNO: epsCNO, nuNumerico: nuNumerico, nuGamow: nuGamow, sorpasso: sorpasso
  };

  /* ═══ pezzi comuni del disegno ══════════════════════════════════════════ */
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function eq(pan, testo) { var e = F.el('div', { 'class': 'bsiFX-eq', testo: testo }); pan.appendChild(e); return e; }
  function casella(pan, et, val, cambia) {
    var x = F.el('input', { type: 'checkbox' }); x.checked = !!val;
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [x, F.el('span', { testo: F.tt(et) })]));
    x.addEventListener('change', function () { cambia(x.checked); }); return x;
  }
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
        destra.insertBefore(S.box, destra.firstChild);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function cieloStellato(T, n, R, seme) {
    var rnd = mulberry32(seme || 11), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { var z = 2 * rnd() - 1, a = 2 * Math.PI * rnd(), s = Math.sqrt(1 - z * z), k = 0.3 + 0.7 * Math.pow(rnd(), 3); pos[3 * i] = R * s * Math.cos(a); pos[3 * i + 1] = R * s * Math.sin(a); pos[3 * i + 2] = R * z; col[3 * i] = k * 0.9; col[3 * i + 1] = k * 0.9; col[3 * i + 2] = k; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Points(g, new T.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending }));
  }
  function bagliore(T, col, r) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128; var q = cv.getContext('2d'), g = q.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 128, 128);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), color: col, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); sp.scale.set(r, r, 1); return sp;
  }
  function telo(destra, rapp) { var cv = F.tela(destra, rapp || 0.5); cv.style.marginTop = '10px'; return cv; }
  function hex(rgb) { return '#' + rgb.map(function (v) { return ('0' + Math.round(255 * Math.max(0, Math.min(1, v))).toString(16)).slice(-2); }).join(''); }

  /* superficie granulata: celle di Voronoi in 3D che si muovono, oscuramento al bordo */
  var NOISE = [
    'vec3 h33(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p)*43758.5453); }',
    'vec2 voronoi(vec3 x, float t){ vec3 p = floor(x), f = fract(x); float d1 = 8., d2 = 8.;',
    '  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec3 b = vec3(float(i), float(j), float(k)); vec3 o = h33(p + b); o = 0.5 + 0.45*sin(t + 6.2831*o); vec3 r = b + o - f; float d = dot(r, r);',
    '    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }',
    '  return vec2(sqrt(d1), sqrt(d2)); }'
  ].join('\n');
  function materialeSuperficie(T) {
    return new T.ShaderMaterial({
      uniforms: { uCol: { value: new T.Color(1, 0.85, 0.6) }, uTempo: { value: 0 }, uScala: { value: 9 }, uU: { value: 0.6 } },
      vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: ['uniform vec3 uCol; uniform float uTempo; uniform float uScala; uniform float uU; varying vec3 vP; varying vec3 vN; varying vec3 vV;', NOISE,
        'void main(){ vec3 q = normalize(vP)*uScala; vec2 v = voronoi(q, uTempo*0.6); float bordo = smoothstep(0.0, 0.18, v.y - v.x);',
        '  vec2 v2 = voronoi(q*3.1 + 7., uTempo*0.9); float fine = smoothstep(0.0, 0.25, v2.y - v2.x);',
        '  float gran = 0.62 + 0.38*bordo*(0.75 + 0.25*fine) - 0.12*v.x;',
        '  float mu = clamp(dot(normalize(vN), normalize(vV)), 0., 1.); float ld = 1. - uU*(1. - mu);',
        '  vec3 col = uCol*gran*ld*1.25; col = mix(col, col*vec3(1.05, 0.8, 0.6), 1. - mu);',
        '  gl_FragColor = vec4(col, 1.); }'].join('\n'),
      side: 2
    });
  }
  /* le pareti del taglio: zone colorate per raggio, celle convettive che ruotano */
  function materialeTaglio(T) {
    return new T.ShaderMaterial({
      uniforms: { uNucleo: { value: 0.25 }, uBase: { value: 0.71 }, uNucConv: { value: 0 }, uTempo: { value: 0 }, uCol: { value: new T.Color(1, 0.85, 0.6) }, uVerso: { value: 1 } },
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: ['uniform float uNucleo; uniform float uBase; uniform float uNucConv; uniform float uTempo; uniform vec3 uCol; uniform float uVerso; varying vec2 vQ;',
        'void main(){ float r = length(vQ); float a = atan(vQ.y, vQ.x)*uVerso; vec3 col;',
        '  vec3 caldo = vec3(1., 0.97, 0.85), medio = vec3(1., 0.62, 0.25), freddo = uCol*vec3(0.85, 0.55, 0.35);',
        '  col = mix(caldo, medio, smoothstep(0., uBase, r));',
        '  col *= 0.92 + 0.08*sin(r*90. - uTempo*2.);',
        '  if (r < uNucleo) col = mix(vec3(1.,1.,1.), caldo, r/uNucleo) * (1.1 + 0.08*sin(uTempo*3. + r*40.));',
        '  if (r > uBase) {',
        '    float s = (r - uBase)/max(1. - uBase, 1e-3); float nc = max(4., floor(6.2832*(uBase + 1.)/2./max(1. - uBase, 0.05)));',
        '    float cella = floor(a/6.2832*nc*2.); float verso = mod(cella, 2.) < 1. ? 1. : -1.; float u = fract(a/6.2832*nc*2.);',
        '    float rot = sin(3.14159*u)*sin(3.14159*s); float flusso = sin(6.2832*(u*0.5 + s*0.5) + verso*uTempo*1.5);',
        '    col = mix(freddo, medio, 0.5 + 0.5*flusso*rot) * (0.8 + 0.25*rot);',
        '    col *= 0.85 + 0.15*smoothstep(0.02, 0.08, min(u, 1. - u)); }',
        '  if (uNucConv > 0. && r < uNucConv) { float u2 = fract(a/6.2832*6.); float s2 = r/uNucConv; float f2 = sin(6.2832*(u2*0.5 + s2*0.5) + uTempo*2.); col = mix(col, vec3(1., 0.95, 0.75), 0.35 + 0.25*f2); }',
        '  col *= 1. - 0.25*smoothstep(0.96, 1., r);',
        '  gl_FragColor = vec4(col, 1.); }'].join('\n'),
      side: 2
    });
  }

  /* ═══ 1. La stella tagliata ══════════════════════════════════════════════ */
  function schedaTaglio(pan, destra) {
    var st = { M: 1, percorso: true };
    eq(pan, 'dT/dr = −3κρL/(16πacr²T³)   I(μ) = I₀[1 − u(1 − μ)]');
    nota(pan, t('Nel <b>nucleo</b> (bianco) la fusione libera energia; la potenza è così sensibile alla temperatura (ε ∝ ρT⁴ per la catena pp, ∝ ρT¹⁷ per il ciclo CNO) che nasce quasi tutta in un piccolo volume centrale: qui il suo raggio è quello entro cui un politropo n = 3 produce il 90 % della luminosità. Nella <b>zona radiativa</b> i fotoni avanzano con una passeggiata casuale: nel Sole impiegano ~10⁵ anni. Dove il gradiente di temperatura supera quello adiabatico (criterio di Schwarzschild) il gas si rimescola: <b>zona convettiva</b>, le cui celle in superficie sono i granuli (~1000 km, vita ~10 min). Il bordo del disco è più scuro perché lì si vedono strati più alti e più freddi.',
      'In the <b>core</b> (white) fusion releases energy; the power is so sensitive to temperature (ε ∝ ρT⁴ for the pp chain, ∝ ρT¹⁷ for the CNO cycle) that almost all of it is produced in a small central volume: here its radius is the one within which an n = 3 polytrope produces 90 % of the luminosity. In the <b>radiative zone</b> photons advance by a random walk: in the Sun they take ~10⁵ years. Where the temperature gradient exceeds the adiabatic one (Schwarzschild criterion) the gas overturns: <b>convective zone</b>, whose cells at the surface are the granules (~1000 km, lifetime ~10 min). The limb is darker because there we see higher, cooler layers.'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info = nota(pan);
    var cv = null, S = null, T = null, gruppo = null, sup = null, pareti = [], percorso = null, fotone = null, pts = [], kf = 0, alone = null;
    function grafico(s, z) {
      if (!cv) return;
      /* profili del politropo n = 3: densita', temperatura, luminosita' cumulativa */
      var L = laneEmden(3, { h: 0.01 }), xs = [], rho = [], tem = [], lum = [], tot = 0, nu = s.M > 1.3 ? 17 : 4, cum = [0];
      for (var i = 1; i < L.xi.length; i++) { var a = L.xi[i - 1], b = L.xi[i]; tot += 0.5 * (Math.pow(Math.max(0, L.theta[i - 1]), 3 + nu) * a * a + Math.pow(Math.max(0, L.theta[i]), 3 + nu) * b * b) * (b - a); cum.push(tot); }
      for (i = 0; i < L.xi.length; i += 4) { xs.push(L.xi[i] / L.xi1); rho.push(Math.pow(Math.max(0, L.theta[i]), 3)); tem.push(Math.max(0, L.theta[i])); lum.push(cum[i] / tot); }
      F.grafico(cv, { serie: [{ x: xs, y: rho, col: '#6bcfff', larg: 2 }, { x: xs, y: tem, col: '#ff8a80', larg: 2 }, { x: xs, y: lum, col: '#ffd24a', larg: 2 }], punti: [{ x: z.nucleo, y: 0.9, col: '#ffffff', r: 4 }], xmin: 0, xmax: 1, ymin: 0, ymax: 1.05,
        xl: ['r / R', 'r / R'], yl: ['frazione del valore centrale', 'fraction of central value'], legenda: [{ col: '#6bcfff', etich: ['ρ/ρ_c = θ³', 'ρ/ρ_c = θ³'] }, { col: '#ff8a80', etich: ['T/T_c = θ', 'T/T_c = θ'] }, { col: '#ffd24a', etich: ['L(r)/L', 'L(r)/L'] }],
        descr: ['Profili di densità, temperatura e luminosità di un politropo n = 3', 'Density, temperature and luminosity profiles of an n = 3 polytrope'] });
    }
    function aggiorna() {
      var s = sequenza(st.M), z = zone(st.M), col = coloreT(s.T);
      info.innerHTML = 'L = <b class="bsiFX-num">' + fmt(s.L) + ' L☉</b> · R = <b class="bsiFX-num">' + fmt(s.R) + ' R☉</b> · T_eff = <b class="bsiFX-num">' + Math.round(s.T) + ' K</b> (' + classe(s.T) + ')' +
        '<br>' + t('picco di Wien ', 'Wien peak ') + '<b class="bsiFX-num">' + (wien(s.T) * 1e9).toFixed(0) + ' nm</b> · ' + t('colore ', 'colour ') + '<span class="bsi3d-leg" style="background:' + hex(col) + '"></span>' +
        '<br>' + t('nucleo (90 % di L): r < ', 'core (90 % of L): r < ') + z.nucleo.toFixed(2) + ' R (ν = ' + (st.M > 1.3 ? 17 : 4) + ')' +
        '<br>' + (z.tipo === 'convettiva' ? t('tutta convettiva (M < 0,35 M☉)', 'fully convective (M < 0.35 M☉)') : z.tipo === 'sole' ? t('inviluppo convettivo da r = ', 'convective envelope from r = ') + z.baseConv.toFixed(2) + ' R' : t('nucleo convettivo fino a ', 'convective core up to ') + z.nucleoConv.toFixed(2) + ' R, ' + t('inviluppo radiativo', 'radiative envelope')) +
        '<br>' + t('vita sulla sequenza principale ≈ ', 'main-sequence lifetime ≈ ') + '<b class="bsiFX-num">' + fmt(s.tMS / 1e9) + t(' miliardi di anni', ' billion years') + '</b>';
      grafico(s, z);
      if (!S) return;
      sup.material.uniforms.uCol.value.setRGB(col[0], col[1], col[2]);
      sup.material.uniforms.uScala.value = 7 + 3 * Math.log(1 + st.M);
      alone.material.color.setRGB(col[0], col[1], col[2]);
      pareti.forEach(function (p) { var U = p.material.uniforms; U.uNucleo.value = z.nucleo; U.uBase.value = z.tipo === 'convettiva' ? 0.0001 : z.baseConv; U.uNucConv.value = z.nucleoConv; U.uCol.value.setRGB(col[0], col[1], col[2]); });
      /* il cammino dell'energia: passeggiata casuale (radiativa), anelli (convettiva), raggio uscente */
      var rnd = mulberry32(5), base = z.tipo === 'convettiva' ? z.nucleo : z.tipo === 'sole' ? z.baseConv : 0.97, p = [z.nucleo * 0.5, 0], dir = -2.36; pts = [];
      /* lo spicchio aperto e' tra φ = π e φ = 3π/2 nel piano della parete; il cammino resta nel piano y = 0 del gruppo, sulla parete */
      var ang = Math.PI * 1.25;
      var P = function (r, a) { return new T.Vector3(r * Math.cos(a), r * Math.sin(a), 0); };
      var r = z.nucleo * 0.5, a = ang;
      pts.push(P(r, a));
      while (r < base - 0.01 && pts.length < 600) { var st2 = 0.035, th = 2 * Math.PI * rnd(), x = r * Math.cos(a) + st2 * Math.cos(th), y = r * Math.sin(a) + st2 * Math.sin(th), rn = Math.hypot(x, y), an = Math.atan2(y, x); if (an < 0) an += 2 * Math.PI; if (an < Math.PI * 1.05 || an > Math.PI * 1.45) continue; r = Math.max(z.nucleo * 0.3, rn); a = an; pts.push(P(r, a)); }
      if (base < 0.97) { for (var k = 0; k <= 60; k++) { var u = k / 60, rr = base + (0.97 - base) * (0.5 - 0.5 * Math.cos(Math.PI * u)), aa = a + 0.15 * Math.sin(2 * Math.PI * u); pts.push(P(rr, aa)); } }
      for (k = 1; k <= 30; k++) pts.push(P(0.97 + k * 0.03, a));
      if (percorso) { gruppo.remove(percorso); percorso.geometry.dispose(); }
      percorso = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 0.85 }));
      percorso.position.z = -0.004; percorso.visible = st.percorso; fotone.visible = st.percorso; gruppo.add(percorso);
      S.didascalia.textContent = t('Stella di ', 'Star of ') + st.M + t(' M☉ tagliata: nucleo, zona radiativa, zona convettiva e superficie granulata', ' M☉ cut open: core, radiative zone, convective zone and granulated surface');
      S.sporca = true; S.avvia();
    }
    F.cursore(ctl, ['Massa (M☉)', 'Mass (M☉)'], 0.2, 20, 0.1, st.M, function (v) { st.M = v; aggiorna(); });
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:2px' }); ctl.appendChild(es);
    [[t('nana rossa 0,3', 'red dwarf 0.3'), 0.3], [t('Sole', 'Sun'), 1], ['Sirio A 2,1', 2.1], ['Rigel 18', 18]].forEach(function (p) { F.bottone(es, [p[0], p[0]], function () { st.M = p[1]; var inp = ctl.querySelector('input[type=range]'); inp.value = p[1]; inp.dispatchEvent(new Event('input')); }); });
    casella(ctl, ['Cammino dell’energia', 'Energy path'], st.percorso, function (v) { st.percorso = v; aggiorna(); });
    return {
      tre: function (S0, T0) {
        S = S0; T = T0;
        S.aggiungi(cieloStellato(T, 2000, 60, 2));
        gruppo = new T.Group(); gruppo.rotation.x = Math.PI / 2; S.aggiungi(gruppo);
        /* superficie con uno spicchio tolto (φ tra 3π/2 e 2π nelle coordinate di three) */
        sup = new T.Mesh(new T.SphereGeometry(2, 96, 64, 0, Math.PI * 1.5), materialeSuperficie(T)); gruppo.add(sup);
        /* due pareti a mezzo disco: nel piano xy (x < 0) e nel piano yz (z < 0) */
        var p1 = new T.Mesh(new T.CircleGeometry(2, 96, Math.PI / 2, Math.PI), materialeTaglio(T)); gruppo.add(p1);
        var p2 = new T.Mesh(new T.CircleGeometry(2, 96, Math.PI / 2, Math.PI), materialeTaglio(T)); p2.rotation.y = -Math.PI / 2; p2.material.uniforms.uVerso.value = -1; gruppo.add(p2);
        pareti = [p1, p2];
        /* il cammino sta sulla parete p1, in coordinate del suo piano scalate di 2 */
        var piano = new T.Group(); piano.scale.setScalar(2); gruppo.add(piano); gruppo = piano;
        fotone = new T.Mesh(new T.SphereGeometry(0.025, 12, 8), new T.MeshBasicMaterial({ color: 0xffffff })); fotone.add(bagliore(T, 0x9ff0ff, 0.25)); piano.add(fotone);
        alone = bagliore(T, 0xffd9a0, 6.5); S.aggiungi(alone);
        var tempo = 0;
        S.ogniFotogramma(function (dt) {
          tempo += dt;
          sup.material.uniforms.uTempo.value = tempo; pareti.forEach(function (p) { p.material.uniforms.uTempo.value = tempo; });
          if (pts.length > 1) { kf = (kf + dt * 40) % (pts.length - 1); var i = Math.floor(kf), u = kf - i; fotone.position.lerpVectors(pts[i], pts[i + 1], u); fotone.position.z = -0.006; }
          return true;
        });
        S.inquadra(7.5, 2.5, 1.05);
        cv = telo(destra, 0.45);
        aggiorna();
        F.alRidimensiona(aggiorna);
      }
    };
  }

  /* ═══ 2. La struttura: Lane-Emden ════════════════════════════════════════ */
  var N_LISTA = [0, 1, 1.5, 2, 3, 4, 4.5, 5];
  function schedaStruttura(pan, destra) {
    var st = { n: 3 };
    eq(pan, '(1/ξ²) d/dξ (ξ² dθ/dξ) = −θⁿ    P = Kρ^(1+1/n), ρ = ρ_c θⁿ');
    nota(pan, t('Una stella in equilibrio idrostatico con un’equazione di stato <b>politropica</b> P = Kρ^(1+1/n) obbedisce all’equazione di Lane-Emden. Il primo zero ξ₁ è la superficie. Si risolve con Runge-Kutta partendo dalla serie θ ≈ 1 − ξ²/6 + nξ⁴/120; per n = 0, 1, 5 ci sono soluzioni esatte (1 − ξ²/6, sin ξ/ξ, (1 + ξ²/3)^(−1/2)) che servono da controllo. n = 1,5 descrive una nana bianca non relativistica e le stelle convettive; n = 3 il modello standard di Eddington per il Sole e una nana bianca ultrarelativistica: per questa la massa non dipende dal raggio, ed è la <b>massa di Chandrasekhar</b>.',
      'A star in hydrostatic equilibrium with a <b>polytropic</b> equation of state P = Kρ^(1+1/n) obeys the Lane–Emden equation. The first zero ξ₁ is the surface. It is solved with Runge–Kutta starting from the series θ ≈ 1 − ξ²/6 + nξ⁴/120; for n = 0, 1, 5 there are exact solutions (1 − ξ²/6, sin ξ/ξ, (1 + ξ²/3)^(−1/2)) that serve as checks. n = 1.5 describes a non-relativistic white dwarf and convective stars; n = 3 Eddington’s standard model for the Sun and an ultra-relativistic white dwarf: for it the mass does not depend on the radius, and it is the <b>Chandrasekhar mass</b>.'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var tab = F.el('div'); pan.appendChild(tab);
    var info = nota(pan);
    var cv1 = null, cv2 = null, S = null, T = null, nuvola = null, soluzioni = {};
    function soluzione(n) { if (!soluzioni[n]) soluzioni[n] = laneEmden(n, { h: n === 5 ? 5e-3 : 1e-3, xmax: n === 5 ? 20 : 400, salva: n === 5 ? 4 : 10 }); return soluzioni[n]; }
    function tabella() {
      var righe = '<tr><th>n</th><th>ξ₁</th><th>ω_n</th><th>ρ_c/ρ̄</th><th>R ∝ M^…</th></tr>';
      N_LISTA.forEach(function (n) { var L = soluzione(n); righe += '<tr><td>' + n + '</td><td>' + (isFinite(L.xi1) ? L.xi1.toFixed(4) : '∞') + '</td><td>' + (L.omega ? L.omega.toFixed(4) : '—') + '</td><td>' + (L.rhoRapporto ? fmt(L.rhoRapporto) : '∞') + '</td><td>' + (n === 3 ? '—' : n === 5 ? '—' : fmt(esponenteMR(n))) + '</td></tr>'; });
      tab.innerHTML = '<table class="bsiFX-tab">' + righe + '</table>';
      var L3s = soluzione(3), Mch = chandrasekhar(2, L3s.omega) / MSOLE, Pc = pressioneCentrale(L3s.Wn, MSOLE, RSOLE);
      info.innerHTML = t('Massa di Chandrasekhar (n = 3, μ_e = 2): ', 'Chandrasekhar mass (n = 3, μ_e = 2): ') + '<b class="bsiFX-num">' + Mch.toFixed(3) + ' M☉</b>' +
        '<br>' + t('Sole come politropo n = 3: P_c = ', 'Sun as an n = 3 polytrope: P_c = ') + '<b class="bsiFX-num">' + Pc.toExponential(2) + ' Pa</b> (W₃ = ' + L3s.Wn.toFixed(2) + t('; il modello solare standard dà 2,5·10¹⁶ Pa), ρ_c = ', '; the standard solar model gives 2.5·10¹⁶ Pa), ρ_c = ') + (L3s.rhoRapporto * 1408).toFixed(0) + ' kg/m³';
    }
    function grafici() {
      if (!cv1) return;
      var cols = ['#e6fffb', '#6bcfff', '#5eead4', '#a3e635', '#ffd24a', '#ffb86b', '#ff8a80', '#c792ea'], serie = [], leg = [];
      N_LISTA.forEach(function (n, i) { var L = soluzioni[n], xs = [], ys = []; if (!L) return; for (var k = 0; k < L.xi.length; k += 2) { if (L.xi[k] > 16) break; xs.push(L.xi[k]); ys.push(L.theta[k]); } serie.push({ x: xs, y: ys, col: cols[i], larg: n === st.n ? 3 : 1.4 }); leg.push({ col: cols[i], etich: ['n = ' + n, 'n = ' + n] }); });
      F.grafico(cv1, { serie: serie, xmin: 0, xmax: 16, ymin: -0.05, ymax: 1.02, linee: [{ y: 0, col: '#34465f' }], xl: ['ξ', 'ξ'], yl: ['θ(ξ)', 'θ(ξ)'], legenda: leg, descr: ['Soluzioni dell’equazione di Lane-Emden per n da 0 a 5', 'Solutions of the Lane–Emden equation for n from 0 to 5'] });
      /* massa-raggio di nane bianche: n = 1,5 (R ∝ M^(−1/3)) e il limite di Chandrasekhar */
      var Mch = chandrasekhar(2, soluzione(3).omega) / MSOLE, xs2 = [], y1 = [], y2 = [];
      for (var i = 1; i <= 140; i++) { var m = 0.1 + 1.5 * i / 140; xs2.push(m); y1.push(0.0126 * Math.pow(m / 0.6, -1 / 3) * 109); var x = Math.pow(m / Mch, 2 / 3); y2.push(m < Mch ? 0.0126 * Math.pow(m / 0.6, -1 / 3) * 109 * Math.sqrt(Math.max(0, 1 - Math.pow(m / Mch, 4 / 3))) / Math.sqrt(Math.max(1e-9, 1 - Math.pow(0.6 / Mch, 4 / 3))) : NaN); }
      var P = F.grafico(cv2, { serie: [{ x: xs2, y: y1, col: '#6bcfff', larg: 2, tratt: true }, { x: xs2, y: y2, col: '#ffd24a', larg: 2.5 }], xmin: 0.1, xmax: 1.6, ymin: 0, xl: ['M / M☉', 'M / M☉'], yl: ['R (R⊕)', 'R (R⊕)'],
        legenda: [{ col: '#6bcfff', etich: ['n = 1,5: R ∝ M^(−1/3)', 'n = 1.5: R ∝ M^(−1/3)'] }, { col: '#ffd24a', etich: ['con la relatività (approssimata)', 'with relativity (approximate)'] }],
        descr: ['Relazione massa-raggio delle nane bianche e limite di Chandrasekhar', 'White dwarf mass-radius relation and the Chandrasekhar limit'] });
      var q = P.q, xx = P.X(Mch); q.save(); q.strokeStyle = '#ff8a80'; q.setLineDash([4, 4]); q.beginPath(); q.moveTo(xx, 14); q.lineTo(xx, P.H - 40); q.stroke(); q.fillStyle = '#ff8a80'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'right'; q.fillText('M_Ch = ' + Mch.toFixed(2) + ' M☉', xx - 4, 28); q.restore();
    }
    function nuvola3D() {
      if (!S) return;
      if (nuvola) { S.radice.remove(nuvola); nuvola.geometry.dispose(); nuvola.material.dispose(); }
      /* punti distribuiti come la massa: r estratto dalla cumulativa di ξ²θⁿ */
      var L = soluzione(st.n), xmax = isFinite(L.xi1) ? L.xi1 : 12, cum = [0], xs = [0];
      for (var i = 1; i < L.xi.length && L.xi[i] <= xmax; i++) { var a = L.xi[i - 1], b = L.xi[i]; cum.push(cum[cum.length - 1] + 0.5 * (Math.pow(Math.max(0, L.theta[i - 1]), st.n) * a * a + Math.pow(Math.max(0, L.theta[i]), st.n) * b * b) * (b - a)); xs.push(b); }
      var N = 24000, rnd = mulberry32(17), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), tot = cum[cum.length - 1];
      for (i = 0; i < N; i++) {
        var u = rnd() * tot, lo = 0, hi = cum.length - 1; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (cum[m] < u) lo = m; else hi = m; }
        var r = xs[lo] + (xs[hi] - xs[lo]) * (u - cum[lo]) / Math.max(1e-30, cum[hi] - cum[lo]), z = 2 * rnd() - 1, ph = 2 * Math.PI * rnd(), s = Math.sqrt(1 - z * z), R = 3 * r / xmax;
        if (ph > Math.PI * 1.5) { i--; continue; }
        pos[3 * i] = R * s * Math.cos(ph); pos[3 * i + 1] = R * s * Math.sin(ph); pos[3 * i + 2] = R * z;
        var th = 1 - r / xmax, cc = coloreT(3000 + 9000 * th * th); col[3 * i] = cc[0]; col[3 * i + 1] = cc[1]; col[3 * i + 2] = cc[2];
      }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
      nuvola = new T.Points(g, new T.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false, blending: T.AdditiveBlending }));
      S.radice.add(nuvola);
      S.didascalia.textContent = t('Distribuzione della massa in un politropo n = ', 'Mass distribution in a polytrope n = ') + st.n + t(' (24 000 punti, spicchio tolto)', ' (24,000 points, wedge removed)');
      S.sporca = true; S.avvia();
    }
    F.scelta(ctl, ['Indice politropico n', 'Polytropic index n'], N_LISTA.map(function (n) { return [String(n), 'n = ' + n + (n === 1.5 ? t(' (nana bianca, stella convettiva)', ' (white dwarf, convective star)') : n === 3 ? t(' (Eddington, Chandrasekhar)', ' (Eddington, Chandrasekhar)') : n === 5 ? t(' (raggio infinito)', ' (infinite radius)') : '')]; }), String(st.n), function (v) { st.n = +v; grafici(); nuvola3D(); });
    /* le soluzioni a lotti, una per compito: la scheda si apre senza attese */
    var daFare = N_LISTA.slice();
    (function lotto() { if (!daFare.length) { tabella(); grafici(); return; } soluzione(daFare.shift()); setTimeout(lotto, 0); })();
    return {
      tre: function (S0, T0, L3) {
        S = S0; T = T0;
        S.aggiungi(cieloStellato(T, 1500, 60, 31));
        S.aggiungi(L3.assi(T, 3.4, ['x', 'y', 'z'], 0.25));
        S.inquadra(9, 2.2, 1.1);
        cv1 = telo(destra, 0.45); cv2 = telo(destra, 0.4);
        /* i grafici subito con le soluzioni gia' pronte; il lotto li ridisegna quando ha finito */
        grafici();
        setTimeout(nuvola3D, 0);
        F.alRidimensiona(grafici);
      }
    };
  }

  /* ═══ 3. Evoluzione ══════════════════════════════════════════════════════ */
  var NOMI_FASE = { ms: ['sequenza principale (H → He nel nucleo)', 'main sequence (core H → He)'], sub: ['subgigante (H in un guscio)', 'subgiant (shell H burning)'], rgb: ['ramo delle giganti rosse', 'red giant branch'], hb: ['ramo orizzontale (He → C, O nel nucleo)', 'horizontal branch (core He → C, O)'], agb: ['ramo asintotico delle giganti', 'asymptotic giant branch'], pn: ['nebulosa planetaria', 'planetary nebula'], wd: ['nana bianca che si raffredda', 'cooling white dwarf'], loop: ['anello blu (He nel nucleo)', 'blue loop (core He)'], rsg: ['supergigante rossa (He, C, Ne, O, Si…)', 'red supergiant (He, C, Ne, O, Si…)'], sn: ['supernova a collasso del nucleo', 'core-collapse supernova'], ns: ['stella di neutroni', 'neutron star'] };
  function schedaEvoluzione(pan, destra) {
    var st = { M: 1, s: 0, vel: 1, gira: true };
    eq(pan, 't_MS ≈ 10 Gyr · (M/M☉)^(−2,5)    L = 4πR²σT⁴');
    nota(pan, t('Le tracce sono <b>schematiche</b> (la forma dei modelli evolutivi, non un calcolo): una stella passa quasi tutta la vita sulla sequenza principale, poi il nucleo di elio si contrae e l’inviluppo si gonfia (gigante rossa, centinaia di R☉). Sotto ~8 M☉ il nucleo di carbonio-ossigeno non si accende: l’inviluppo viene espulso come nebulosa planetaria e resta una nana bianca, della massa di ~0,6 M☉ e del raggio della Terra. Sopra, la stella brucia fino al ferro, il nucleo supera la massa di Chandrasekhar e collassa: supernova, e resta una stella di neutroni (o un buco nero). Il tempo dell’animazione non è proporzionale all’età: le fasi brevi sono rallentate.',
      'The tracks are <b>schematic</b> (the shape of evolutionary models, not a calculation): a star spends almost all its life on the main sequence, then the helium core contracts and the envelope swells (red giant, hundreds of R☉). Below ~8 M☉ the carbon–oxygen core does not ignite: the envelope is ejected as a planetary nebula and a white dwarf remains, of ~0.6 M☉ and Earth’s size. Above, the star burns up to iron, the core exceeds the Chandrasekhar mass and collapses: supernova, leaving a neutron star (or a black hole). Animation time is not proportional to age: short phases are slowed down.'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info = nota(pan);
    var cv = null, S = null, T = null, stella = null, alone = null, guscio = null, vGuscio = null, resto = null, fasci = null, sup = null, NG = 4000, tGuscio = -1, faseVista = '';
    function traccia() { return TRACCE[st.M]; }
    /* posizione lungo la traccia per s ∈ [0, 1]: ogni segmento ha lo stesso tempo di animazione */
    function punto(s) {
      var P = traccia(), nseg = P.length - 1, f = Math.min(nseg - 1e-9, s * nseg), i = Math.floor(f), u = f - i, a = P[i], b = P[i + 1];
      var tMS = 1e10 * Math.pow(st.M, -2.5), eta = 0; for (var k = 1; k <= i; k++) eta += P[k][3] * tMS; eta += u * b[3] * tMS;
      return { lT: a[0] + (b[0] - a[0]) * u, lL: a[1] + (b[1] - a[1]) * u, fase: b[2], eta: eta, i: i, u: u };
    }
    function grafico() {
      if (!cv) return;
      var serie = [], cols = { 1: '#ffd24a', 5: '#6bcfff', 15: '#ff8a80' };
      [1, 5, 15].forEach(function (m) { var P = TRACCE[m].filter(function (p) { return p[2] !== 'ns'; }); serie.push({ x: P.map(function (p) { return p[0]; }), y: P.map(function (p) { return p[1]; }), col: cols[m], larg: m === st.M ? 2.6 : 1.1, tratt: m !== st.M }); });
      /* sequenza principale e rette a raggio costante */
      var xs = [], ys = []; for (var m = 0.2; m <= 40; m *= 1.15) { var q = sequenza(m); xs.push(Math.log10(q.T)); ys.push(Math.log10(q.L)); }
      serie.push({ x: xs, y: ys, col: '#34465f', larg: 6 });
      [0.01, 1, 100, 1000].forEach(function (R) { var a = [], b = []; for (var lt = 3.4; lt <= 5.3; lt += 0.05) { a.push(lt); b.push(Math.log10(R * R * Math.pow(Math.pow(10, lt) / TSOLE, 4))); } serie.push({ x: a, y: b, col: '#1d3550', larg: 1, tratt: true }); });
      var p = punto(st.s);
      F.grafico(cv, { serie: serie, punti: [{ x: p.lT, y: p.lL, col: '#ffffff', r: 6 }], xmin: 3.4, xmax: 5.3, ymin: -3, ymax: 6, invertiX: true, xl: ['log₁₀ T_eff (K)', 'log₁₀ T_eff (K)'], yl: ['log₁₀ L/L☉', 'log₁₀ L/L☉'],
        legenda: [{ col: '#ffd24a', etich: ['1 M☉', '1 M☉'] }, { col: '#6bcfff', etich: ['5 M☉', '5 M☉'] }, { col: '#ff8a80', etich: ['15 M☉', '15 M☉'] }],
        descr: ['Diagramma H-R con le tracce evolutive di stelle da 1, 5 e 15 masse solari', 'H-R diagram with evolutionary tracks of 1, 5 and 15 solar-mass stars'] });
    }
    function aggiornaStella() {
      var p = punto(st.s), Tk = Math.pow(10, p.lT), L = Math.pow(10, p.lL), R = raggioDa(L, Tk), col = coloreT(Tk);
      var finito = p.fase === 'ns';
      info.innerHTML = t('Fase: ', 'Phase: ') + '<b>' + F.tt(NOMI_FASE[p.fase]) + '</b>' + '<br>' + t('età ≈ ', 'age ≈ ') + '<b class="bsiFX-num">' + (p.eta >= 1e9 ? (p.eta / 1e9).toFixed(2) + t(' miliardi di anni', ' billion years') : (p.eta / 1e6).toFixed(1) + t(' milioni di anni', ' million years')) + '</b>' +
        (finito ? '' : '<br>T_eff = ' + Math.round(Tk) + ' K · L = ' + fmt(L) + ' L☉ · R = <b class="bsiFX-num">' + fmt(R) + ' R☉</b>') + '<br>' + t('sequenza principale: ', 'main sequence: ') + fmt(1e10 * Math.pow(st.M, -2.5) / 1e9) + t(' miliardi di anni', ' billion years');
      if (!S) return;
      /* raggio visivo su scala logaritmica (da 0,01 a 1000 R☉) */
      var rv = Math.max(0.06, 0.35 + 0.55 * Math.log10(Math.max(R, 0.005)) + 0.2);
      var visibile = p.fase !== 'sn' && p.fase !== 'ns';
      stella.visible = visibile; stella.scale.setScalar(rv); sup.material.uniforms.uCol.value.setRGB(col[0], col[1], col[2]); sup.material.uniforms.uScala.value = R > 20 ? 3.5 : 8;
      alone.visible = visibile; alone.scale.set(rv * 3.6, rv * 3.6, 1); alone.material.color.setRGB(col[0], col[1], col[2]);
      if ((p.fase === 'pn' || p.fase === 'sn') && faseVista !== p.fase) { lanciaGuscio(p.fase === 'sn'); }
      if (p.fase === 'ms' && st.s < 0.02) { tGuscio = -1; guscio.visible = false; }
      resto.visible = p.fase === 'ns'; fasci.visible = p.fase === 'ns';
      faseVista = p.fase;
      S.didascalia.textContent = t('Stella di ', 'Star of ') + st.M + ' M☉: ' + F.tt(NOMI_FASE[p.fase]);
    }
    function lanciaGuscio(sn) {
      var P = guscio.geometry.attributes.position.array, C = guscio.geometry.attributes.color.array, rnd = mulberry32(sn ? 99 : 7);
      for (var i = 0; i < NG; i++) {
        var z = 2 * rnd() - 1, a = 2 * Math.PI * rnd(), s = Math.sqrt(1 - z * z), v = sn ? 2 + 4 * rnd() : 0.6 + 0.25 * rnd() * (1 + 0.6 * Math.abs(z));
        P[3 * i] = 0.3 * s * Math.cos(a); P[3 * i + 1] = 0.3 * s * Math.sin(a); P[3 * i + 2] = 0.3 * z; vGuscio[3 * i] = v * s * Math.cos(a); vGuscio[3 * i + 1] = v * s * Math.sin(a); vGuscio[3 * i + 2] = v * z;
        var cc = sn ? (rnd() < 0.5 ? [1, 0.85, 0.5] : [0.6, 0.75, 1]) : (rnd() < 0.5 ? [0.3, 1, 0.8] : [1, 0.35, 0.45]); C[3 * i] = cc[0]; C[3 * i + 1] = cc[1]; C[3 * i + 2] = cc[2];
      }
      guscio.geometry.attributes.position.needsUpdate = true; guscio.geometry.attributes.color.needsUpdate = true; guscio.material.size = sn ? 0.07 : 0.05; guscio.visible = true; tGuscio = 0;
    }
    var sS;
    F.scelta(ctl, ['Massa iniziale', 'Initial mass'], [['1', '1 M☉ (' + t('come il Sole', 'like the Sun') + ')'], ['5', '5 M☉'], ['15', '15 M☉']], '1', function (v) { st.M = +v; st.s = 0; sS.value = 0; faseVista = ''; if (guscio) guscio.visible = false; grafico(); aggiornaStella(); });
    sS = F.cursore(ctl, ['Avanzamento lungo la traccia', 'Progress along the track'], 0, 1, 0.001, st.s, function (v) { st.s = v; grafico(); aggiornaStella(); }, function (v) { return Math.round(v * 100) + ' %'; });
    casella(ctl, ['Animazione', 'Animation'], st.gira, function (v) { st.gira = v; if (S) S.avvia(); });
    F.cursore(ctl, ['Velocità', 'Speed'], 0.25, 4, 0.25, st.vel, function (v) { st.vel = v; });
    return {
      tre: function (S0, T0) {
        S = S0; T = T0;
        S.aggiungi(cieloStellato(T, 2200, 70, 14));
        stella = new T.Group(); sup = new T.Mesh(new T.SphereGeometry(1, 72, 48), materialeSuperficie(T)); stella.add(sup); S.aggiungi(stella);
        alone = new T.Sprite(new T.SpriteMaterial({ map: bagliore(T, 0xffffff, 1).material.map, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0.55 })); S.aggiungi(alone);
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(NG * 3), 3)); g.setAttribute('color', new T.BufferAttribute(new Float32Array(NG * 3), 3)); vGuscio = new Float32Array(NG * 3);
        guscio = new T.Points(g, new T.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending })); guscio.visible = false; guscio.frustumCulled = false; S.aggiungi(guscio);
        resto = new T.Mesh(new T.SphereGeometry(0.08, 24, 16), new T.MeshBasicMaterial({ color: 0xd8ecff })); resto.add(bagliore(T, 0x9fc8ff, 0.9)); S.aggiungi(resto);
        fasci = new T.Group(); [1, -1].forEach(function (s) { var co = new T.Mesh(new T.ConeGeometry(0.25, 2.4, 24, 1, true), new T.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.2, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); co.position.y = s * 1.2; co.rotation.z = s > 0 ? Math.PI : 0; fasci.add(co); }); fasci.rotation.x = 0.4; resto.add(fasci);
        var tempo = 0, nf = 0;
        S.ogniFotogramma(function (dt) {
          tempo += dt; sup.material.uniforms.uTempo.value = tempo;
          if (st.gira) { st.s += dt * st.vel * 0.006 * (st.M === 15 ? 1.6 : 1); if (st.s > 1) { st.s = 0; faseVista = ''; guscio.visible = false; } sS.value = st.s; if (++nf % 6 === 0) sS.dispatchEvent(new Event('input')); else aggiornaStella(); }
          if (tGuscio >= 0) {
            tGuscio += dt; var P = guscio.geometry.attributes.position.array;
            for (var i = 0; i < NG * 3; i++) P[i] += vGuscio[i] * dt * 0.5;
            guscio.geometry.attributes.position.needsUpdate = true; guscio.material.opacity = Math.max(0, 0.95 - tGuscio * 0.08);
            if (tGuscio > 12) { tGuscio = -1; guscio.visible = false; }
          }
          fasci.rotation.z += dt * 6;
          return true;
        });
        S.inquadra(8, -1.0, 1.2);
        cv = telo(destra, 0.62);
        grafico(); aggiornaStella(); F.alRidimensiona(grafico);
      }
    };
  }

  /* ═══ 4. Nucleosintesi ═══════════════════════════════════════════════════ */
  /* composizione dei nuclei (Z, N) per il disegno */
  var NUCLEI = { H1: [1, 0, 'p'], H2: [1, 1, '²H'], He3: [2, 1, '³He'], He4: [2, 2, '⁴He'], C12: [6, 6, '¹²C'], N13: [7, 6, '¹³N'], C13: [6, 7, '¹³C'], N14: [7, 7, '¹⁴N'], O15: [8, 7, '¹⁵O'], N15: [7, 8, '¹⁵N'] };
  function schedaNucleo(pan, destra) {
    var st = { ciclo: 'pp', passo: 0, rho: 1.5e5, X: 0.7, Xcno: 0.014 };
    eq(pan, '4 ¹H → ⁴He + 2e⁺ + 2νₑ   Q = (4m_H − m_He)c² = 26,73 MeV');
    nota(pan, t('Quattro protoni diventano un nucleo di elio per due strade. La <b>catena pp</b> comincia con la reazione debole p + p → ²H, lentissima (~10¹⁰ anni per protone nel Sole): domina sotto ~17 milioni di K. Il <b>ciclo CNO</b> usa carbonio, azoto e ossigeno come catalizzatori, che alla fine del giro tornano uguali; la barriera coulombiana del ¹⁴N (Z = 7) lo rende enormemente più sensibile alla temperatura e domina nelle stelle più massicce del Sole. Parte dell’energia (0,5-1,7 MeV per elio) se ne va con i neutrini.',
      'Four protons become a helium nucleus by two routes. The <b>pp chain</b> starts with the weak reaction p + p → ²H, extremely slow (~10¹⁰ years per proton in the Sun): it dominates below ~17 million K. The <b>CNO cycle</b> uses carbon, nitrogen and oxygen as catalysts, which return unchanged at the end of the loop; the Coulomb barrier of ¹⁴N (Z = 7) makes it far more sensitive to temperature and it dominates in stars more massive than the Sun. Part of the energy (0.5–1.7 MeV per helium) leaves with the neutrinos.'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var tab = F.el('div'); pan.appendChild(tab);
    var info = nota(pan);
    nota(pan, t('<b>Perché il ferro.</b> L’energia di legame per nucleone cresce fino a A ≈ 56-62 (⁵⁶Fe 8,79 MeV, ⁶²Ni 8,79 MeV) e poi scende per la repulsione coulombiana: unire nuclei più pesanti del ferro costa energia invece di liberarla. Il nucleo di una stella massiccia arrivato al ferro non ha più combustibile e collassa.', '<b>Why iron.</b> The binding energy per nucleon rises up to A ≈ 56–62 (⁵⁶Fe 8.79 MeV, ⁶²Ni 8.79 MeV) and then falls because of Coulomb repulsion: fusing nuclei heavier than iron costs energy instead of releasing it. A massive star’s core that has reached iron has no fuel left and collapses.'));
    var cv1 = null, cv2 = null, S = null, T = null, L3 = null, gruppo = null, mobili = [], etichetta = null;
    function tabella() {
      var R = st.ciclo === 'pp' ? PP : CNO, righe = '<tr><th>' + t('reazione', 'reaction') + '</th><th>Q (MeV)</th></tr>';
      R.forEach(function (r, i) { righe += '<tr' + (i === st.passo ? ' style="color:#5eead4"' : '') + '><td>' + (st.ciclo === 'pp' && i < 2 ? '2 × ' : '') + r[0] + '</td><td>' + Q(r).toFixed(3) + '</td></tr>'; });
      var tot = st.ciclo === 'pp' ? energiaPP() : energiaCNO();
      tab.innerHTML = '<table class="bsiFX-tab">' + righe + '<tr><td><b>' + t('totale per ⁴He', 'total per ⁴He') + '</b></td><td><b>' + tot.toFixed(3) + '</b></td></tr></table>';
      var Tx = sorpasso(st.rho, st.X, st.Xcno);
      info.innerHTML = t('Dalle masse: 4 m(¹H) − m(⁴He) = ', 'From the masses: 4 m(¹H) − m(⁴He) = ') + '<b class="bsiFX-num">' + energiaElio().toFixed(3) + ' MeV</b>' +
        '<br>' + t('Sorpasso pp ↔ CNO a ', 'pp ↔ CNO crossover at ') + '<b class="bsiFX-num">' + (Tx / 1e6).toFixed(1) + ' MK</b> (ρ = ' + (st.rho / 1000) + ' g/cm³, X = 0,7, X_CNO = 0,014)' +
        '<br>' + t('a 15 MK: ν_pp = ', 'at 15 MK: ν_pp = ') + nuNumerico(function (T) { return epsPP(T, st.rho, st.X); }, 15e6).toFixed(2) + ', ν_CNO = ' + nuNumerico(function (T) { return epsCNO(T, st.rho, st.X, st.Xcno); }, 15e6).toFixed(1) + ' (ε ∝ T^ν)';
    }
    function grafici() {
      if (!cv1) return;
      var xs = [], a = [], b = [];
      for (var lt = 6.7; lt <= 7.7; lt += 0.005) { var T9 = Math.pow(10, lt); xs.push(T9 / 1e6); a.push(Math.log10(epsPP(T9, st.rho, st.X))); b.push(Math.log10(epsCNO(T9, st.rho, st.X, st.Xcno))); }
      var Tx = sorpasso(st.rho, st.X, st.Xcno);
      F.grafico(cv1, { serie: [{ x: xs, y: a, col: '#ffd24a', larg: 2.5 }, { x: xs, y: b, col: '#6bcfff', larg: 2.5 }], punti: [{ x: Tx / 1e6, y: Math.log10(epsPP(Tx, st.rho, st.X)), col: '#ffffff', r: 5 }, { x: 15.7, y: Math.log10(epsPP(15.7e6, st.rho, st.X)), col: '#ff8a80', r: 4 }],
        ymin: -5, xl: ['T (milioni di K)', 'T (million K)'], yl: ['log₁₀ ε (W/kg)', 'log₁₀ ε (W/kg)'], legenda: [{ col: '#ffd24a', etich: ['catena pp (~T⁴)', 'pp chain (~T⁴)'] }, { col: '#6bcfff', etich: ['ciclo CNO (~T¹⁷)', 'CNO cycle (~T¹⁷)'] }, { col: '#ff8a80', etich: ['centro del Sole', 'solar centre'] }],
        descr: ['Potenza prodotta per unità di massa dalla catena pp e dal ciclo CNO in funzione della temperatura', 'Power per unit mass from the pp chain and the CNO cycle versus temperature'] });
      var A = [], B = [];
      for (var k = 4; k <= 250; k++) { A.push(k); B.push(legameValle(k)); }
      var reali = [['H2', 1, 2], ['He4', 2, 4], ['C12', 6, 12], ['O16', 8, 16], ['Fe56', 26, 56], ['Ni62', 28, 62], ['U238', 92, 238]].map(function (r) { return { x: r[2], y: legameMasse(r[1], r[2], MASSE[r[0]]), col: r[0] === 'Fe56' || r[0] === 'Ni62' ? '#ff8a80' : '#ffd24a', r: 4 }; });
      F.grafico(cv2, { serie: [{ x: A, y: B, col: '#5eead4', larg: 2 }], punti: reali, xmin: 0, xmax: 250, ymin: 0, ymax: 9.5, xl: [t('numero di massa A', 'mass number A'), 'mass number A'], yl: ['B/A (MeV)', 'B/A (MeV)'],
        legenda: [{ col: '#5eead4', etich: ['formula semiempirica (valle di stabilità)', 'semi-empirical formula (stability valley)'] }, { col: '#ffd24a', etich: ['dalle masse atomiche', 'from atomic masses'] }],
        descr: ['Energia di legame per nucleone: massimo vicino al ferro', 'Binding energy per nucleon: maximum near iron'] });
    }
    /* un nucleo come grappolo di protoni (rossi) e neutroni (grigi) */
    var geoN = null, matP = null, matN = null;
    function nucleo(chiave) {
      var z = NUCLEI[chiave], g = new T.Group(), n = z[0] + z[1], rnd = mulberry32(n * 31 + z[0]), r0 = 0.13 * Math.cbrt(n);
      for (var i = 0; i < n; i++) {
        var p = i < z[0], m = new T.Mesh(geoN, p ? matP : matN), gi = Math.PI * (3 - Math.sqrt(5)) * i, y = n === 1 ? 0 : 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - y * y), rad = n === 1 ? 0 : r0 * (0.55 + 0.45 * rnd());
        m.position.set(rad * rr * Math.cos(gi), rad * y, rad * rr * Math.sin(gi)); g.add(m);
      }
      var e = L3.testo3d(T, z[2], '#e6fffb', 0.22); e.position.set(0, 0, r0 + 0.25); g.add(e);
      return g;
    }
    function lampo(col, dim) { var cv = document.createElement('canvas'); cv.width = cv.height = 64; var q = cv.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 64, 64); var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), color: col, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); sp.scale.set(dim, dim, 1); return sp; }
    function scena3D() {
      if (!S) return;
      if (gruppo) { S.radice.remove(gruppo); gruppo.traverse(function (o) { if (o.material && o.material !== matP && o.material !== matN) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } if (o.geometry && o.geometry !== geoN) o.geometry.dispose(); }); }
      gruppo = new T.Group(); S.radice.add(gruppo); mobili = [];
      if (st.ciclo === 'pp') {
        /* tre stadi in fila: per ognuno due reagenti che si scontrano e i prodotti che escono */
        var stadi = [[['H1', 'H1'], ['H2'], 0xff8af0, 'e⁺ ν'], [['H2', 'H1'], ['He3'], 0xfff3a0, 'γ'], [['He3', 'He3'], ['He4', 'H1', 'H1'], 0xfff3a0, '']];
        stadi.forEach(function (sd, k) {
          var cx = (k - 1) * 3.2, a = nucleo(sd[0][0]), b = nucleo(sd[0][1]); gruppo.add(a); gruppo.add(b);
          var prod = sd[1].map(function (q) { var o = nucleo(q); gruppo.add(o); return o; }), fl = lampo(sd[2], 1.2); gruppo.add(fl);
          var et = L3.testo3d(T, PP[k][0], k === st.passo ? '#5eead4' : '#9fb1c6', 0.2); et.position.set(cx, 0, -1.2); gruppo.add(et);
          mobili.push({ tipo: 'urto', a: a, b: b, prod: prod, fl: fl, cx: cx, fase: k * 0.33, extra: sd[3] });
        });
        S.didascalia.textContent = t('Catena protone-protone: tre reazioni, quattro protoni diventano un nucleo di elio', 'Proton–proton chain: three reactions, four protons become a helium nucleus');
        S.inquadra(10, -1.57, 1.25);
      } else {
        /* il ciclo CNO: sei nuclei su un anello; un protone entra, un positrone esce, alla fine un ⁴He */
        var chiavi = ['C12', 'N13', 'C13', 'N14', 'O15', 'N15'], Rr = 2.6;
        chiavi.forEach(function (ch, i) { var o = nucleo(ch), a = Math.PI / 2 - 2 * Math.PI * i / 6; o.position.set(Rr * Math.cos(a), Rr * Math.sin(a), 0); gruppo.add(o); mobili.push({ tipo: 'fermo', o: o, i: i }); });
        var anello = []; for (var k = 0; k <= 120; k++) { var aa = 2 * Math.PI * k / 120; anello.push(new T.Vector3(Rr * Math.cos(aa), Rr * Math.sin(aa), 0)); }
        gruppo.add(new T.Line(new T.BufferGeometry().setFromPoints(anello), new T.LineBasicMaterial({ color: 0x2a4a6e })));
        var pr = nucleo('H1'), fl = lampo(0xfff3a0, 1), el = nucleo('He4'); gruppo.add(pr); gruppo.add(fl); gruppo.add(el);
        mobili.push({ tipo: 'cno', p: pr, fl: fl, he: el, R: Rr });
        var c1 = L3.testo3d(T, t('catalizzatori: C, N, O', 'catalysts: C, N, O'), '#9fb1c6', 0.22); gruppo.add(c1);
        S.didascalia.textContent = t('Ciclo CNO: sei reazioni attorno all’anello, il carbonio torna alla fine', 'CNO cycle: six reactions around the ring, carbon comes back at the end');
        S.inquadra(9, -1.57, 0.55);
      }
      S.sporca = true; S.avvia();
    }
    function anima(tempo) {
      mobili.forEach(function (m) {
        if (m.tipo === 'urto') {
          var f = (tempo * 0.25 + m.fase) % 1;
          if (f < 0.45) { var d = 1.4 * (1 - f / 0.45); m.a.visible = m.b.visible = true; m.a.position.set(m.cx - d, 0, 0.6 * Math.sin(f * 7)); m.b.position.set(m.cx + d, 0, -0.6 * Math.sin(f * 7)); m.prod.forEach(function (p) { p.visible = false; }); m.fl.visible = false; }
          else { m.a.visible = m.b.visible = false; var g2 = (f - 0.45) / 0.55; m.fl.visible = g2 < 0.3; m.fl.material.opacity = 1 - g2 / 0.3; m.fl.position.set(m.cx, 0, 0);
            m.prod.forEach(function (p, j) { p.visible = true; var ang = Math.PI / 2 + (j - (m.prod.length - 1) / 2) * 1.2 + (j ? 0 : 0); p.position.set(m.cx + (j ? 1.4 * g2 * Math.cos(ang) : 0), 0, j ? 1.4 * g2 * Math.sin(ang) : -0.2 * g2); p.rotation.z = tempo; }); }
        } else if (m.tipo === 'cno') {
          var u = (tempo * 0.12) % 1, i6 = Math.floor(u * 6), v = u * 6 - i6, a0 = Math.PI / 2 - 2 * Math.PI * i6 / 6, cattura = [0, 2, 3, 5].indexOf(i6) >= 0;
          m.p.visible = cattura && v < 0.5; m.p.position.set((m.R + 2.4 * (1 - v / 0.5)) * Math.cos(a0 - 0.3), (m.R + 2.4 * (1 - v / 0.5)) * Math.sin(a0 - 0.3), 0.3);
          m.fl.visible = v > 0.45 && v < 0.65; m.fl.position.set(m.R * Math.cos(a0), m.R * Math.sin(a0), 0); m.fl.material.color.setHex(cattura ? 0xfff3a0 : 0xff8af0);
          m.he.visible = i6 === 5 && v > 0.5; m.he.position.set((m.R + 2.4 * (v - 0.5) * 2) * Math.cos(a0 - 0.4), (m.R + 2.4 * (v - 0.5) * 2) * Math.sin(a0 - 0.4), 0.3);
        } else if (m.tipo === 'fermo') { m.o.rotation.z = tempo * 0.4; }
      });
    }
    F.scelta(ctl, ['Ciclo', 'Cycle'], [['pp', t('catena pp (Sole)', 'pp chain (Sun)')], ['cno', t('ciclo CNO (stelle massicce)', 'CNO cycle (massive stars)')]], st.ciclo, function (v) { st.ciclo = v; st.passo = 0; tabella(); scena3D(); });
    F.cursore(ctl, ['Densità centrale (g/cm³)', 'Central density (g/cm³)'], 10, 300, 10, st.rho / 1000, function (v) { st.rho = v * 1000; tabella(); grafici(); });
    tabella();
    return {
      tre: function (S0, T0, L30) {
        S = S0; T = T0; L3 = L30;
        geoN = new T.SphereGeometry(0.11, 18, 12); matP = new T.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.4, emissive: 0x330808 }); matN = new T.MeshStandardMaterial({ color: 0xb8c4d0, roughness: 0.45 });
        S.aggiungi(cieloStellato(T, 1500, 60, 23));
        var tempo = 0;
        S.ogniFotogramma(function (dt) { tempo += dt; anima(tempo); return true; });
        scena3D(); anima(0.5);
        cv1 = telo(destra, 0.45); cv2 = telo(destra, 0.42);
        grafici(); F.alRidimensiona(grafici);
      }
    };
  }

  F.sezione('sastrostelle', {
    titolo: ['⭐ Vita delle stelle 3D', '⭐ Life of stars 3D'],
    sotto: ['Dentro una stella e lungo tutta la sua vita: la struttura a strati vista in sezione, l’equazione di Lane-Emden e la massa di Chandrasekhar, le tracce nel diagramma H-R fino a nane bianche e supernove, le reazioni nucleari che la fanno brillare.', 'Inside a star and across its whole life: the layered structure seen in cross-section, the Lane–Emden equation and the Chandrasekhar mass, the tracks in the H-R diagram down to white dwarfs and supernovae, the nuclear reactions that make it shine.'],
    schede: [
      { nome: ['☀️ Stella in sezione', '☀️ Star cut-away'], costruisci: scheda3D(schedaTaglio) },
      { nome: ['📐 Struttura (Lane-Emden)', '📐 Structure (Lane–Emden)'], costruisci: scheda3D(schedaStruttura) },
      { nome: ['🔄 Evoluzione', '🔄 Evolution'], costruisci: scheda3D(schedaEvoluzione) },
      { nome: ['⚛️ Nucleosintesi', '⚛️ Nucleosynthesis'], costruisci: scheda3D(schedaNucleo) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
