/* ═══════════════════════════════════════════════════════════════════════
   bsi-quantum-studio-dati.js — 🌌 BioSpec Quantum Studio: catalogo e modelli (v265)
   BioSpecInfo · © Samuele Pio Provenzano

   Il catalogo delle 13 aree e i MODELLI CALCOLATI che muovono le scene e i
   grafici: niente curve decorative. Ogni grafico del Quantum Studio viene da
   una di queste funzioni, e il banco test_quantumstudio le controlla:

   · Morse dell'H₂ (De 458 kJ/mol, rₑ 74 pm, a 1,94 Å⁻¹) e carattere ionico
     di Pauling 1 − e^(−Δχ²/4);
   · NMR ¹H dell'etanolo: ν₀ = γB₀/2π (42,577 MHz/T), multipletti n + 1 con
     J in Hz indipendente da B₀ (quindi più stretto in ppm a campo alto);
   · dose–risposta con antagonista competitivo (Gaddum–Schild:
     EC₅₀′ = EC₅₀(1 + [B]/K_B));
   · PCA vera (matrice di covarianza e autovalori con il metodo di Jacobi)
     su dati 10-D generati con un seme fisso;
   · HPLC: modello lineare solvente-forza (log k = log k_w − Sφ), Van Deemter
     in unità ridotte (h = A + B/ν + Cν), piatti, larghezze, risoluzione;
   · superficie di energia potenziale a due minimi e un punto di sella,
     Eyring k = (k_BT/h)e^(−ΔG‡/RT);
   · Hodgkin–Huxley (assone di calamaro, 6,3 °C) con E_K dalla Nernst;
   · n-cubi (2ⁿ vertici, n·2ⁿ⁻¹ spigoli) con rotazione nel piano x–w e
     proiezione prospettica asse per asse;
   · la sezione di Hanson della quintica di Fermat (Calabi–Yau): ogni punto
     soddisfa z₁ⁿ + z₂ⁿ = 1;
   · il qubit: oscillazioni di Rabi P₁(t) = (Ω²/Ω′²)·sin²(Ω′t/2) e il vettore
     di Bloch che ruota attorno a (Ω, 0, Δ);
   · Gibbs: ΔG = ΔH − TΔS, K = e^(−ΔG/RT), T* = ΔH/ΔS, E = −ΔG/nF;
   · il nomogramma di Rumack–Matthew del paracetamolo e la SN2 con ΔΔG‡
     dai rapporti di velocità.

   ONESTA': i parametri marcati INDICATIVO sono ordini di grandezza da
   letteratura; i modelli sono quelli dei libri, non simulazioni ab initio.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var R = 8.314462618, F = 96485.33212, KB = 1.380649e-23, H = 6.62607015e-34, PI = Math.PI;

  /* ═══ modelli ══════════════════════════════════════════════════════════ */
  /** Morse dell'H₂ in kJ/mol, r in pm (zero = atomi separati) */
  function morse(r, o) { o = o || {}; var De = o.De || 458, re = o.re || 74.1, a = o.a || 0.0194; var e = Math.exp(-a * (r - re)); return De * (1 - e) * (1 - e) - De; }
  function carattereIonico(dchi) { return 1 - Math.exp(-dchi * dchi / 4); }

  /** ¹H NMR dell'etanolo in CDCl₃ a B₀ tesla con J Hz: le righe (ppm, intensità) */
  var GAMMA_H = 42.577478;   /* MHz/T */
  function larmor(B0) { return GAMMA_H * B0; }
  function pascal(n) { var r = [1]; for (var i = 0; i < n; i++) { var s = [1]; for (var k = 1; k < r.length; k++) s.push(r[k - 1] + r[k]); s.push(1); r = s; } return r; }
  var ETANOLO = [{ nome: 'CH₃', d: 1.22, nH: 3, vicini: 2 }, { nome: 'OH', d: 2.61, nH: 1, vicini: 0 }, { nome: 'CH₂', d: 3.69, nH: 2, vicini: 3 }];
  function nmr(B0, J) {
    var nu0 = larmor(B0), righe = [];
    ETANOLO.forEach(function (gr) { var c = pascal(gr.vicini), tot = c.reduce(function (s, x) { return s + x; }, 0); c.forEach(function (x, k) { var off = (k - gr.vicini / 2) * J; righe.push({ ppm: gr.d + off / nu0, hz: gr.d * nu0 + off, I: gr.nH * x / tot, gruppo: gr.nome }); }); });
    return { nu0: nu0, righe: righe, larghezzaPpm: function (gr) { return gr.vicini * J / nu0; } };
  }

  /** dose–risposta (Hill n) con antagonista competitivo: EC50' = EC50·(1 + B/KB) */
  function doseRisposta(logA, Bn, o) { o = o || {}; var EC50 = o.EC50 || 1e-8, KB = o.KB || 2e-9, n = o.n || 1, ec = EC50 * (1 + (Bn * 1e-9) / KB), A = Math.pow(10, logA); return { E: Math.pow(A, n) / (Math.pow(A, n) + Math.pow(ec, n)), EC50: ec, DR: ec / EC50, occupazione: A / (A + EC50) }; }

  /* ── PCA vera ── */
  function rng(seme) { var s = seme >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { var u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }
  /** tre gruppi in 10 dimensioni: separazione (0–1) e rumore (0–1) */
  function generaDati(sep, rumore, seme) {
    var r = rng(seme || 7), D = 10, centri = [0, 1, 2].map(function () { var c = []; for (var d = 0; d < D; d++) c.push(gauss(r)); return c; }), X = [], cl = [];
    for (var k = 0; k < 3; k++) for (var i = 0; i < 40; i++) { var x = []; for (var d = 0; d < D; d++) x.push(centri[k][d] * 4 * sep + gauss(r) * (0.25 + 2 * rumore)); X.push(x); cl.push(k); }
    return { X: X, classi: cl };
  }
  function jacobi(A) {
    var n = A.length, a = A.map(function (r) { return r.slice(); }), V = []; for (var i = 0; i < n; i++) { V.push([]); for (var j = 0; j < n; j++) V[i].push(i === j ? 1 : 0); }
    for (var sweep = 0; sweep < 60; sweep++) {
      var off = 0; for (var p = 0; p < n; p++) for (var q = p + 1; q < n; q++) off += a[p][q] * a[p][q]; if (off < 1e-20) break;
      for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-300) continue;
        var th = (a[q][q] - a[p][p]) / (2 * a[p][q]), tt = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(tt * tt + 1), s = tt * c;
        for (var k = 0; k < n; k++) { var akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
        for (k = 0; k < n; k++) { var apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
        for (k = 0; k < n; k++) { var vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    var ord = a.map(function (r, i) { return [r[i], i]; }).sort(function (x, y) { return y[0] - x[0]; });
    return { valori: ord.map(function (o) { return o[0]; }), vettori: ord.map(function (o) { return V.map(function (r) { return r[o[1]]; }); }) };
  }
  /** PCA con autoscaling: punteggi sulle prime 3 componenti, varianza spiegata */
  function pca(X) {
    var n = X.length, D = X[0].length, m = [], s = [];
    for (var d = 0; d < D; d++) { var mu = 0; X.forEach(function (x) { mu += x[d]; }); mu /= n; var v = 0; X.forEach(function (x) { v += (x[d] - mu) * (x[d] - mu); }); m.push(mu); s.push(Math.sqrt(v / (n - 1)) || 1); }
    var Z = X.map(function (x) { return x.map(function (v, d) { return (v - m[d]) / s[d]; }); }), C = [];
    for (var i = 0; i < D; i++) { C.push([]); for (var j = 0; j < D; j++) { var c = 0; Z.forEach(function (z) { c += z[i] * z[j]; }); C[i].push(c / (n - 1)); } }
    var E = jacobi(C), tot = E.valori.reduce(function (a, b) { return a + b; }, 0);
    return { autovalori: E.valori, spiegata: E.valori.map(function (l) { return l / tot; }), punteggi: Z.map(function (z) { return E.vettori.slice(0, 3).map(function (v) { return z.reduce(function (a, zz, k) { return a + zz * v[k]; }, 0); }); }), traccia: tot, vettori: E.vettori };
  }

  /* ── HPLC a fase inversa ── */
  var ANALITI = [{ nome: 'caffeina', logkw: 1.2, S: 3.0, col: '#4dabf7' }, { nome: 'fenolo', logkw: 1.9, S: 3.3, col: '#ffd43b' }, { nome: 'toluene', logkw: 3.4, S: 4.1, col: '#ff6b6b' }];
  /** F in mL/min, φ frazione di acetonitrile; colonna 150 × 4,6 mm, particelle 5 µm */
  function hplc(Fml, phi, o) {
    o = o || {}; var L = 150, dc = 4.6, dp = 5e-3, eps = 0.65, Dm = 1e-3;   /* mm, mm, mm, -, mm²/s (Dm = 10⁻⁹ m²/s) */
    var u = (Fml * 1000 / 60) / (eps * PI * dc * dc / 4), nu = u * dp / Dm, A = 1, B = 2, C = 0.1, h = A + B / nu + C * nu, Hmm = h * dp, N = L / Hmm, t0 = L / u;
    var picchi = ANALITI.map(function (a) { var k = Math.pow(10, a.logkw - a.S * phi), tR = t0 * (1 + k); return { nome: a.nome, col: a.col, k: k, tR: tR, sigma: tR / Math.sqrt(N), w: 4 * tR / Math.sqrt(N) }; });
    var Rs = []; for (var i = 1; i < picchi.length; i++) Rs.push(2 * (picchi[i].tR - picchi[i - 1].tR) / (picchi[i].w + picchi[i - 1].w));
    return { u: u, nu: nu, h: h, H: Hmm, N: N, t0: t0, picchi: picchi, Rs: Rs, uOtt: Math.sqrt(B / C) * Dm / dp, H_di: function (uu) { var n2 = uu * dp / Dm; return (A + B / n2 + C * n2) * dp; } };
  }

  /* ── superficie di energia potenziale ── */
  var EB = 60;   /* kJ/mol: barriera del modello */
  function pes(x, y) { return EB * ((x * x - 1) * (x * x - 1) - 0.25 * x + 2 * (y - 0.3 * x * x) * (y - 0.3 * x * x)); }
  function pesCammino(s) { var x = -1.2 + 2.4 * s; return [x, 0.3 * x * x, pes(x, 0.3 * x * x)]; }
  function pesPunti() {   /* minimi e sella lungo il fondovalle, cercati sul cammino */
    var best = { r: [0, 1e9], p: [0, 1e9], ts: [0, -1e9] };
    for (var s = 0; s <= 1; s += 1e-4) { var c = pesCammino(s), x = c[0]; if (x < 0 && c[2] < best.r[1]) best.r = [x, c[2]]; if (x > 0 && c[2] < best.p[1]) best.p = [x, c[2]]; if (Math.abs(x) < 0.5 && c[2] > best.ts[1]) best.ts = [x, c[2]]; }
    return { reagente: best.r, prodotto: best.p, sella: best.ts, Ea: best.ts[1] - best.r[1], dE: best.p[1] - best.r[1] };
  }
  function eyring(T, dG) { return KB * T / H * Math.exp(-dG * 1000 / (R * T)); }

  /* ── Hodgkin–Huxley ── */
  var HH = { C: 1, gNa: 120, gK: 36, gL: 0.3, ENa: 50, EL: -54.387, Kin: 98, T: 279.45 };
  function nernstK(Kout) { return R * HH.T / F * Math.log(Kout / HH.Kin) * 1000; }
  function hhNuovo(Kout, gNaFr) { return { V: -65, m: 0.0529, h: 0.5961, n: 0.3177, t: 0, EK: nernstK(Kout || 4), gNa: HH.gNa * (gNaFr == null ? 1 : gNaFr), spari: 0, sopra: false }; }
  function hhPasso(s, dt, I) {
    var V = s.V, an = 0.01 * (V + 55) / (1 - Math.exp(-(V + 55) / 10)), bn = 0.125 * Math.exp(-(V + 65) / 80), am = 0.1 * (V + 40) / (1 - Math.exp(-(V + 40) / 10)), bm = 4 * Math.exp(-(V + 65) / 18), ah = 0.07 * Math.exp(-(V + 65) / 20), bh = 1 / (1 + Math.exp(-(V + 35) / 10));
    if (!isFinite(an)) an = 0.1; if (!isFinite(am)) am = 1;
    var INa = s.gNa * s.m * s.m * s.m * s.h * (V - HH.ENa), IK = HH.gK * Math.pow(s.n, 4) * (V - s.EK), IL = HH.gL * (V - HH.EL);
    s.V += dt * (I - INa - IK - IL) / HH.C; s.m += dt * (am * (1 - s.m) - bm * s.m); s.h += dt * (ah * (1 - s.h) - bh * s.h); s.n += dt * (an * (1 - s.n) - bn * s.n); s.t += dt;
    s.INa = INa; s.IK = IK; if (s.V > 0 && !s.sopra) { s.spari++; s.sopra = true; } if (s.V < -30) s.sopra = false; return s;
  }
  /** lo stimolo: 10 µA/cm² per 1 ms ogni 25 ms */
  function stimolo(t) { return (t % 25) < 1 ? 10 : 0; }

  /* ── n-cubi ── */
  function ncubo(n) { var V = [], E = []; for (var i = 0; i < (1 << n); i++) { var v = []; for (var b = 0; b < n; b++) v.push((i >> b) & 1 ? 1 : -1); V.push(v); } for (i = 0; i < V.length; i++) for (var b2 = 0; b2 < n; b2++) { var j = i ^ (1 << b2); if (i < j) E.push([i, j]); } return { V: V, E: E, facce2: n * (n - 1) / 2 * (1 << (n - 2)) }; }
  /** rotazione nel piano (0, n−1) e (1, n−2), poi prospettiva asse per asse da n−1 fino a 3 */
  function proietta(v, th, d) {
    var n = v.length, t = v.slice(), c = Math.cos(th), s = Math.sin(th), a = n - 1;
    var x = t[0], w = t[a]; t[0] = x * c - w * s; t[a] = x * s + w * c;
    if (n > 4) { var c2 = Math.cos(th * 0.618), s2 = Math.sin(th * 0.618), y = t[1], z = t[n - 2]; t[1] = y * c2 - z * s2; t[n - 2] = y * s2 + z * c2; }
    for (var k = n - 1; k >= 3; k--) { var f = d / (d - t[k]); t[0] *= f; t[1] *= f; t[2] *= f; for (var q = 3; q < k; q++) t[q] *= f; }
    return [t[0], t[1], t[2]];
  }

  /* ── Calabi–Yau: la sezione di Hanson della quintica ── */
  function cpow(re, im, p) { var r = Math.hypot(re, im), a = Math.atan2(im, re), rp = Math.pow(r, p); return [rp * Math.cos(a * p), rp * Math.sin(a * p)]; }
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  /** il punto (k1, k2, a, b): z1 = e^(2πik1/n)·cosh(z)^(2/n), z2 = e^(2πik2/n)·(−i·sinh z)^(2/n), z = a + ib */
  function calabiYau(n, k1, k2, a, b) {
    var ch = [Math.cosh(a) * Math.cos(b), Math.sinh(a) * Math.sin(b)], sh = [Math.sinh(a) * Math.cos(b), Math.cosh(a) * Math.sin(b)], msh = [sh[1], -sh[0]];
    var z1 = cmul([Math.cos(2 * PI * k1 / n), Math.sin(2 * PI * k1 / n)], cpow(ch[0], ch[1], 2 / n)), z2 = cmul([Math.cos(2 * PI * k2 / n), Math.sin(2 * PI * k2 / n)], cpow(msh[0], msh[1], 2 / n));
    return { z1: z1, z2: z2 };
  }
  function residuoCY(p, n) { var a = cpow(p.z1[0], p.z1[1], n), b = cpow(p.z2[0], p.z2[1], n); return Math.hypot(a[0] + b[0] - 1, a[1] + b[1]); }

  /* ── qubit ── */
  function rabi(Om, De, t) { var W = Math.sqrt(Om * Om + De * De) || 1e-12, P1 = Om * Om / (W * W) * Math.pow(Math.sin(W * t / 2), 2);
    /* il vettore di Bloch parte da |0⟩ = (0, 0, 1) e ruota attorno a n = (Ω, 0, Δ)/Ω′ di un angolo Ω′t */
    var n = [Om / W, 0, De / W], v = [0, 0, 1], c = Math.cos(W * t), s = Math.sin(W * t), d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2], x = [n[1] * v[2] - n[2] * v[1], n[2] * v[0] - n[0] * v[2], n[0] * v[1] - n[1] * v[0]];
    var b = [0, 1, 2].map(function (i) { return v[i] * c + x[i] * s + n[i] * d * (1 - c); }); return { P1: P1, bloch: b, Wp: W }; }

  /* ── Gibbs ── */
  function gibbs(T, dH, dS) { var dG = dH - T * dS / 1000; return { dG: dG, K: Math.exp(-dG * 1000 / (R * T)), Tstar: dS !== 0 ? dH * 1000 / dS : Infinity, E: -dG * 1000 / (2 * F) }; }

  /* ── tossicologia: il paracetamolo e il nomogramma di Rumack–Matthew ── */
  /** linea di trattamento: 150 mg/L a 4 h, si dimezza ogni 4 h (fino a 24 h) */
  function lineaTrattamento(ore) { return 150 * Math.pow(2, -(ore - 4) / 4); }
  /** concentrazione del paziente con c4 mg/L a 4 h ed emivita t12 h; sopra la linea → N-acetilcisteina */
  function paracetamolo(c4, t12, ore) { var c = c4 * Math.pow(2, -(ore - 4) / t12); return { c: c, linea: lineaTrattamento(ore), sopra: c >= lineaTrattamento(ore) }; }
  /* ── SN2: ΔΔG‡ dai rapporti di velocità metile : 1° : 2° ≈ 30 : 1 : 0,02 (INDICATIVO) ── */
  var SN2_SUB = [{ nome: ['metile', 'methyl'], rel: 30 }, { nome: ['primario', 'primary'], rel: 1 }, { nome: ['secondario', 'secondary'], rel: 0.02 }, { nome: ['terziario', 'tertiary'], rel: 0 }];
  function sn2Barriera(i, T) { var s = SN2_SUB[i]; if (!s.rel) return Infinity; return 80 + R * (T || 298.15) * Math.log(30 / s.rel) / 1000; }

  /* ── ATP sintasi: Δp ridotto dal disaccoppiante (INDICATIVO) ── */
  function atpSintasi(drive, unc) { var dp = drive * (1 - 0.85 * unc), Jatp = Math.max(0, dp - 0.3) * 1.4, JO2 = 0.25 + 0.55 * Jatp + 1.6 * unc * drive; return { dp: dp, Jatp: Jatp, JO2: JO2 }; }

  /* ═══ il catalogo: 13 aree, 16 moduli ════════════════════════════════════ */
  function S(key, it, en, min, max, val, unit, passo) { return { key: key, label: [it, en], min: min, max: max, val: val, unit: unit || '', passo: passo || 1 }; }
  function Q(qi, ai, qe, ae) { return { q: [qi, qe], a: [ai, ae] }; }
  var AREE = [
    { id: 'biochimica', icona: '🧬', nome: ['Biochimica e metabolismo', 'Biochemistry and metabolism'], moduli: [
      { id: 'bio_atp', motore: 'atp', titolo: ['ATP sintasi mitocondriale — catalisi rotazionale', 'Mitochondrial ATP synthase — rotary catalysis'], eq: '3 ADP + 3 Pᵢ + 8 H⁺(IMS) → 3 ATP + 3 H₂O + 8 H⁺(matrice)  ·  per giro', badge: ['crio-EM · Boyer L → T → O', 'cryo-EM · Boyer L → T → O'], rappr: ['densita', 'schema'], sezione: 'sbiolab3d',
        sliders: [S('drive', 'Forza protonmotrice Δp', 'Proton-motive force Δp', 0, 200, 100, '%'), S('uncoupler', 'Disaccoppiante (DNP / UCP1)', 'Uncoupler (DNP / UCP1)', 0, 100, 0, '%')],
        teoria: { core: ['Il gradiente di H⁺ fa ruotare l\'anello c₈ (8 protoni per giro nell\'uomo) e il fusto asimmetrico γ dentro l\'esamero α₃β₃: ogni β passa per L (lega ADP + Pᵢ), T (forma ATP) e O (lo rilascia), 3 ATP per giro.', 'The H⁺ gradient turns the c₈ ring (8 protons per turn in humans) and the asymmetric γ stalk inside the α₃β₃ hexamer: each β goes through L (binds ADP + Pᵢ), T (makes ATP) and O (releases it), 3 ATP per turn.'],
          punti: [['8/3 ≈ 2,67 H⁺ per ATP al rotore + 1 H⁺ per il trasporto di Pᵢ e ADP ≈ 3,7–4 H⁺/ATP → NADH ≈ 2,5 ATP, FADH₂ ≈ 1,5 ATP.', '8/3 ≈ 2.67 H⁺ per ATP at the rotor + 1 H⁺ for Pᵢ and ADP transport ≈ 3.7–4 H⁺/ATP → NADH ≈ 2.5 ATP, FADH₂ ≈ 1.5 ATP.'], ['Oligomicina: blocca F₀, si fermano ATP e consumo di O₂. Disaccoppianti (DNP, UCP1): Δp dissipato in calore, O₂ consumato di più, niente ATP.', 'Oligomycin: blocks F₀, ATP and O₂ use stop. Uncouplers (DNP, UCP1): Δp lost as heat, more O₂ used, no ATP.']],
          esame: ['Non dire che i disaccoppianti riducono il consumo di ossigeno: la catena accelera al massimo nel tentativo di ripristinare il gradiente.', 'Never say uncouplers lower oxygen use: the chain runs flat out trying to restore the gradient.'],
          domande: [Q('Quanti H⁺ servono per un ATP nell\'uomo?', '8/3 al rotore (anello c₈, 3 ATP per giro) più 1 per portare dentro Pᵢ e ADP: circa 3,7, arrotondati a 4 nel conto P/O.', 'How many H⁺ per ATP in humans?', '8/3 at the rotor (c₈ ring, 3 ATP per turn) plus 1 to bring in Pᵢ and ADP: about 3.7, rounded to 4 in P/O sums.')] } },
      { id: 'bio_enzimi', motore: 'enzimi', titolo: ['Cinetica enzimatica: Michaelis–Menten e inibizione competitiva', 'Enzyme kinetics: Michaelis–Menten and competitive inhibition'], eq: 'V₀ = Vmax[S] / (αKm + [S]),  α = 1 + [I]/Ki', badge: ['metabolismo energetico', 'energy metabolism'], rappr: ['atomi'], sezione: 'sbiolab3d',
        sliders: [S('substrate', 'Concentrazione [S]', 'Concentration [S]', 0.1, 10, 1, 'mM', 0.1), S('inhibitor', 'Inibitore competitivo [I]/Ki', 'Competitive inhibitor [I]/Ki', 0, 10, 0, '', 0.1)],
        teoria: { core: ['Le tappe irreversibili della glicolisi sono esochinasi (1), PFK-1 (3, attivata da AMP e fruttosio-2,6-bisfosfato, inibita da ATP e citrato) e piruvato chinasi (10). Un inibitore competitivo occupa il sito attivo: la Km apparente sale di α, la Vmax resta uguale.', 'The irreversible glycolytic steps are hexokinase (1), PFK-1 (3, activated by AMP and fructose 2,6-bisphosphate, inhibited by ATP and citrate) and pyruvate kinase (10). A competitive inhibitor occupies the active site: apparent Km rises by α, Vmax is unchanged.'],
          punti: [['Bilancio aerobico del glucosio: 30–32 ATP (32 con la navetta malato–aspartato).', 'Aerobic glucose balance: 30–32 ATP (32 with the malate–aspartate shuttle).'], ['Krebs: 3 NADH, 1 FADH₂, 1 GTP ≈ 10 ATP per acetil-CoA; regolate citrato sintasi, isocitrato DH, α-KG DH.', 'Krebs: 3 NADH, 1 FADH₂, 1 GTP ≈ 10 ATP per acetyl-CoA; regulated citrate synthase, isocitrate DH, α-KG DH.']],
          esame: ['Il fruttosio-2,6-bisfosfato è il regolatore reciproco del fegato: attiva la PFK-1 (glicolisi) e inibisce la FBPasi-1 (gluconeogenesi).', 'Fructose 2,6-bisphosphate is the liver\'s reciprocal regulator: it activates PFK-1 (glycolysis) and inhibits FBPase-1 (gluconeogenesis).'],
          domande: [Q('Cosa cambia un inibitore competitivo nella Lineweaver–Burk?', 'La pendenza (Km/Vmax) aumenta di α; l\'intercetta sull\'asse y (1/Vmax) resta la stessa: le rette si incrociano sull\'asse y.', 'What does a competitive inhibitor change in Lineweaver–Burk?', 'The slope (Km/Vmax) rises by α; the y-intercept (1/Vmax) stays: lines cross on the y axis.')] } }
    ] },
    { id: 'chimica', icona: '⚛️', nome: ['Chimica e legame', 'Chemistry and bonding'], moduli: [
      { id: 'chem_orbitali', motore: 'orbitali', titolo: ['Orbitali ibridi sp³, sp², sp, VSEPR e la curva di Morse', 'sp³, sp², sp hybrid orbitals, VSEPR and the Morse curve'], eq: 'ψ(sp³) = ½(ψ₂s + ψ₂px + ψ₂py + ψ₂pz)  ·  V(r) = Dₑ(1 − e^(−a(r − rₑ)))² − Dₑ', badge: ['struttura elettronica 3D', '3D electronic structure'], rappr: ['orbitale', 'atomi'], sezione: 'sorbitali',
        sliders: [S('ibrid', 'Ibridazione (1 = sp, 2 = sp², 3 = sp³)', 'Hybridisation (1 = sp, 2 = sp², 3 = sp³)', 1, 3, 3, ''), S('bondDist', 'Distanza internucleare r (H₂)', 'Internuclear distance r (H₂)', 40, 250, 74, 'pm'), S('polarity', 'Differenza di elettronegatività Δχ', 'Electronegativity difference Δχ', 0, 3, 1.4, '', 0.1)],
        teoria: { core: ['Gli orbitali ibridi puntano le coppie di elettroni il più lontano possibile (VSEPR): sp³ tetraedrico (109,5°), sp² trigonale (120°) con un p puro, sp lineare (180°) con due p. Le coppie solitarie chiudono gli angoli: CH₄ 109,5°, NH₃ 107°, H₂O 104,5°.', 'Hybrid orbitals point electron pairs as far apart as possible (VSEPR): sp³ tetrahedral (109.5°), sp² trigonal (120°) with one pure p, sp linear (180°) with two p. Lone pairs close the angles: CH₄ 109.5°, NH₃ 107°, H₂O 104.5°.'],
          punti: [['Legame σ: sovrapposizione frontale, rotazione libera. Legame π: sovrapposizione laterale di p puri, rotazione impedita (isomeria cis/trans).', 'σ bond: head-on overlap, free rotation. π bond: side-on overlap of pure p, hindered rotation (cis/trans isomerism).'], ['Morse dell\'H₂: Dₑ ≈ 458 kJ/mol, rₑ = 74 pm. Carattere ionico di Pauling ≈ 1 − e^(−Δχ²/4).', 'H₂ Morse: Dₑ ≈ 458 kJ/mol, rₑ = 74 pm. Pauling ionic character ≈ 1 − e^(−Δχ²/4).']],
          esame: ['Distingui la geometria delle coppie elettroniche (tetraedrica nell\'acqua) dalla geometria molecolare (angolata).', 'Tell electron-pair geometry (tetrahedral in water) from molecular geometry (bent).'],
          domande: [Q('Perché il legame π impedisce la rotazione?', 'Perché la sovrapposizione laterale dei due p esiste solo se sono paralleli: ruotando si rompe il legame π.', 'Why does a π bond block rotation?', 'Because side-on overlap of the two p exists only when they are parallel: rotating breaks the π bond.')] } }
    ] },
    { id: 'organica', icona: '🧪', nome: ['Chimica organica', 'Organic chemistry'], moduli: [
      { id: 'org_sn2', motore: 'sn2', titolo: ['SN2: inversione di Walden e ingombro sterico', 'SN2: Walden inversion and steric hindrance'], eq: 'Nu⁻ + R₃C–X → [Nu···CR₃···X]‡ → Nu–CR₃ + X⁻  ·  v = k[Nu⁻][R–X]', badge: ['stereochimica e meccanismi', 'stereochemistry and mechanisms'], rappr: ['atomi', 'densita'], sezione: 'smecc3d',
        sliders: [S('progress', 'Coordinata di reazione ξ', 'Reaction coordinate ξ', 0, 100, 0, '%'), S('steric', 'Substrato (1 metile, 2 primario, 3 secondario, 4 terziario)', 'Substrate (1 methyl, 2 primary, 3 secondary, 4 tertiary)', 1, 4, 1, '')],
        teoria: { core: ['Il nucleofilo attacca dal lato opposto al gruppo uscente, nell\'orbitale σ*(C–X): legame che si forma e legame che si rompe insieme, e i tre sostituenti si rovesciano come un ombrello (inversione di Walden).', 'The nucleophile attacks opposite the leaving group, into the σ*(C–X) orbital: bond forming and bond breaking together, and the three substituents flip like an umbrella (Walden inversion).'],
          punti: [['Rapporti di velocità metile : primario : secondario ≈ 30 : 1 : 0,02 → ΔΔG‡ = RT·ln(rapporto): +8 e +18 kJ/mol; il terziario non fa SN2 (va in SN1/E1).', 'Rate ratios methyl : primary : secondary ≈ 30 : 1 : 0.02 → ΔΔG‡ = RT·ln(ratio): +8 and +18 kJ/mol; tertiary does no SN2 (goes SN1/E1).'], ['Solventi polari aprotici (DMSO, DMF, acetone) accelerano l\'SN2: non solvatano l\'anione nucleofilo.', 'Polar aprotic solvents (DMSO, DMF, acetone) speed up SN2: they do not solvate the anionic nucleophile.']],
          esame: ['L\'inversione di Walden rovescia la disposizione 3D, ma il descrittore R/S cambia solo se nucleofilo e uscente hanno lo stesso rango di priorità CIP.', 'Walden inversion flips the 3D arrangement, but the R/S label changes only if nucleophile and leaving group hold the same CIP priority rank.'],
          domande: [Q('Perché un substrato terziario non fa SN2?', 'I tre gruppi coprono il retro del carbonio: il nucleofilo non raggiunge σ*(C–X). Si forma invece il carbocatione (SN1/E1).', 'Why does a tertiary substrate not do SN2?', 'The three groups shield the back of the carbon: the nucleophile cannot reach σ*(C–X). The carbocation forms instead (SN1/E1).')] } }
    ] },
    { id: 'spettroscopia', icona: '📡', nome: ['Spettroscopia NMR e IR', 'NMR and IR spectroscopy'], moduli: [
      { id: 'spec_nmr', motore: 'nmr', titolo: ['¹H-NMR dell\'etanolo: precessione di Larmor, δ e accoppiamento J', '¹H NMR of ethanol: Larmor precession, δ and J coupling'], eq: 'ν₀ = γB₀/2π  (42,577 MHz/T)  ·  δ = (ν − ν_TMS)/ν₀ · 10⁶  ·  ν̃_IR = (1/2πc)·√(k/μ)', badge: ['analisi strutturale', 'structure analysis'], rappr: ['atomi'], sezione: 'snmrpred',
        sliders: [S('b0', 'Campo magnetico B₀', 'Magnetic field B₀', 1, 23.5, 9.4, 'T', 0.1), S('jCoupling', 'Accoppiamento J', 'Coupling J', 0, 18, 7, 'Hz', 0.5)],
        teoria: { core: ['In ¹H-NMR i protoni precedono attorno a B₀ alla frequenza di Larmor; gli elettroni attorno li schermano e spostano il segnale (δ, ppm). n protoni vicini equivalenti dividono il segnale in n + 1 righe con le intensità del triangolo di Tartaglia: CH₃ dell\'etanolo tripletto, CH₂ quartetto.', 'In ¹H NMR protons precess around B₀ at the Larmor frequency; surrounding electrons shield them and shift the signal (δ, ppm). n equivalent neighbouring protons split it into n + 1 lines with Pascal-triangle intensities: ethanol CH₃ triplet, CH₂ quartet.'],
          punti: [['Shift tipici: alifatici 0,8–1,5 ppm, aromatici 6,5–8,5, aldeidici 9–10, carbossilici 10–13.', 'Typical shifts: aliphatic 0.8–1.5 ppm, aromatic 6.5–8.5, aldehyde 9–10, carboxylic 10–13.'], ['IR: assorbono solo i modi con Δμ ≠ 0. O–H largo 3200–3600 cm⁻¹, C=O stretto e intenso 1680–1750 cm⁻¹.', 'IR: only modes with Δμ ≠ 0 absorb. O–H broad 3200–3600 cm⁻¹, C=O sharp and strong 1680–1750 cm⁻¹.']],
          esame: ['J (in Hz) non dipende da B₀; la distanza in Hz fra due shift sì. Per questo a campo alto i multipletti diventano più stretti in ppm e si separano meglio.', 'J (in Hz) does not depend on B₀; the Hz distance between two shifts does. So at high field multiplets get narrower in ppm and separate better.'],
          domande: [Q('Perché il CH₂ dell\'etanolo è un quartetto?', 'Ha 3 protoni vicini equivalenti (il CH₃): n + 1 = 4 righe, intensità 1 : 3 : 3 : 1. L\'OH di solito non accoppia perché scambia velocemente.', 'Why is ethanol CH₂ a quartet?', 'It has 3 equivalent neighbouring protons (the CH₃): n + 1 = 4 lines, 1 : 3 : 3 : 1. The OH usually does not couple because it exchanges fast.')] } }
    ] },
    { id: 'farmacologia', icona: '💊', nome: ['Farmacologia e docking', 'Pharmacology and docking'], moduli: [
      { id: 'pharm_dose', motore: 'recettore', titolo: ['Recettore, dose–risposta e antagonismo competitivo (Schild)', 'Receptor, dose–response and competitive antagonism (Schild)'], eq: 'E/Eₘₐₓ = [A]/(EC₅₀′ + [A]),  EC₅₀′ = EC₅₀(1 + [B]/K_B)  ·  t½ = 0,693·V_d/CL', badge: ['farmacodinamica e PK', 'pharmacodynamics and PK'], rappr: ['atomi'], sezione: null,
        sliders: [S('logDose', 'log[agonista] (M)', 'log[agonist] (M)', -11, -4, -8, '', 0.1), S('antagonist', 'Antagonista competitivo [B]', 'Competitive antagonist [B]', 0, 100, 0, 'nM')],
        teoria: { core: ['L\'agonista pieno stabilizza la conformazione attiva R* e arriva a Eₘₐₓ. L\'antagonista competitivo sposta la curva a destra (EC₅₀ sale di 1 + [B]/K_B, Eₘₐₓ uguale); quello non competitivo abbassa Eₘₐₓ.', 'A full agonist stabilises the active conformation R* and reaches Eₘₐₓ. A competitive antagonist shifts the curve right (EC₅₀ rises by 1 + [B]/K_B, Eₘₐₓ unchanged); a non-competitive one lowers Eₘₐₓ.'],
          punti: [['Qui EC₅₀ = 10 nM e K_B = 2 nM (valori di esempio): con [B] = 18 nM il rapporto di dose è 10.', 'Here EC₅₀ = 10 nM and K_B = 2 nM (example values): with [B] = 18 nM the dose ratio is 10.'], ['Stato stazionario dopo 4–5 emivite; dose di carico ∝ V_d, dose di mantenimento ∝ CL.', 'Steady state after 4–5 half-lives; loading dose ∝ V_d, maintenance dose ∝ CL.']],
          esame: ['Potenza (EC₅₀) ed efficacia (Eₘₐₓ) sono due cose diverse e indipendenti.', 'Potency (EC₅₀) and efficacy (Eₘₐₓ) are two different, independent things.'],
          domande: [Q('Cos\'è il grafico di Schild?', 'log(DR − 1) contro log[B]: una retta di pendenza 1 per un antagonista competitivo; l\'intercetta sull\'asse x è −log K_B = pA₂.', 'What is a Schild plot?', 'log(DR − 1) vs log[B]: a line of slope 1 for a competitive antagonist; the x-intercept is −log K_B = pA₂.')] } }
    ] },
    { id: 'datascience', icona: '📊', nome: ['Data science e chemiometria', 'Data science and chemometrics'], moduli: [
      { id: 'ds_pca', motore: 'pca', titolo: ['PCA: tre gruppi di campioni in 10 dimensioni', 'PCA: three sample groups in 10 dimensions'], eq: 'Z = autoscaling(X)  ·  C = ZᵀZ/(n − 1)  ·  C·vᵢ = λᵢ·vᵢ  ·  T = Z·P', badge: ['analisi multivariata', 'multivariate analytics'], rappr: ['atomi'], sezione: null,
        sliders: [S('separation', 'Separazione dei gruppi', 'Group separation', 0, 100, 65, '%'), S('noise', 'Rumore strumentale', 'Instrument noise', 0, 100, 10, '%')],
        teoria: { core: ['La PCA ruota i dati sulle direzioni di massima varianza: gli autovettori della matrice di covarianza (loadings) sono le nuove assi, gli autovalori λᵢ la varianza che ciascuna spiega. I punti nel 3D sono i punteggi veri sulle prime tre componenti, ricalcolati a ogni cambio.', 'PCA rotates the data onto the directions of maximum variance: eigenvectors of the covariance matrix (loadings) are the new axes, eigenvalues λᵢ the variance each explains. The 3D points are the true scores on the first three components, recomputed on every change.'],
          punti: [['Scores (T): coordinate dei campioni; loadings (P): peso delle variabili originali.', 'Scores (T): sample coordinates; loadings (P): weight of the original variables.'], ['La PCA non è supervisionata; la PLS-DA usa le classi.', 'PCA is unsupervised; PLS-DA uses the classes.']],
          esame: ['Con variabili in unità diverse l\'autoscaling (centrare e dividere per la deviazione standard) è obbligatorio, altrimenti vince la variabile con i numeri più grandi.', 'With variables in different units autoscaling (centre and divide by standard deviation) is mandatory, otherwise the variable with the biggest numbers wins.'],
          domande: [Q('Cosa dice lo scree plot?', 'Quanta varianza spiega ogni componente: si tengono quelle prima del «gomito».', 'What does the scree plot tell you?', 'How much variance each component explains: keep those before the «elbow».')] } }
    ] },
    { id: 'biomol', icona: '🧬', nome: ['Biologia molecolare e CRISPR', 'Molecular biology and CRISPR'], moduli: [
      { id: 'molbio_crispr', motore: 'crispr', titolo: ['CRISPR–Cas9: PAM, R-loop e taglio a doppio filamento', 'CRISPR–Cas9: PAM, R-loop and double-strand cut'], eq: 'Cas9 + sgRNA + dsDNA (5′-NGG-3′ PAM) → R-loop → taglio DSB (HNH + RuvC)', badge: ['editing genico', 'gene editing'], rappr: ['atomi'], sezione: null,
        sliders: [S('helicase', 'Apertura del R-loop', 'R-loop opening', 0, 100, 45, '%'), S('mismatch', 'Errori nella regione seed', 'Seed mismatches', 0, 5, 0, ''), S('pam', 'PAM presente (1 sì, 0 no)', 'PAM present (1 yes, 0 no)', 0, 1, 1, '')],
        teoria: { core: ['Cas9 legge prima la PAM (5′-NGG-3′ per SpCas9); solo allora apre il DNA e l\'sgRNA si appaia al filamento bersaglio, formando il R-loop. Se l\'appaiamento arriva in fondo, HNH taglia il filamento complementare e RuvC l\'altro: un taglio netto a 3 bp dalla PAM.', 'Cas9 first reads the PAM (5′-NGG-3′ for SpCas9); only then does it open the DNA and the sgRNA pairs with the target strand, forming the R-loop. If pairing reaches the end, HNH cuts the complementary strand and RuvC the other: a blunt cut 3 bp from the PAM.'],
          punti: [['NHEJ: riparazione veloce che sbaglia (inserzioni/delezioni → knock-out). HDR: riparazione su stampo (knock-in preciso).', 'NHEJ: fast, error-prone repair (indels → knock-out). HDR: template repair (precise knock-in).'], ['Gli errori nei 10–12 nucleotidi «seed» vicini alla PAM bloccano il R-loop molto più di quelli lontani. La curva di taglio qui è INDICATIVA.', 'Mismatches in the 10–12 «seed» nucleotides near the PAM block the R-loop far more than distant ones. The cut curve here is INDICATIVE.']],
          esame: ['Senza PAM Cas9 non taglia, anche con un appaiamento perfetto dell\'sgRNA.', 'Without a PAM Cas9 does not cut, even with perfect sgRNA pairing.'],
          domande: [Q('Quanti legami ad alta energia costa un amminoacido nel ribosoma?', 'Quattro: due per caricare il tRNA (ATP → AMP), uno per EF-Tu (GTP) e uno per la traslocazione con EF-G (GTP).', 'How many high-energy bonds per amino acid at the ribosome?', 'Four: two to charge the tRNA (ATP → AMP), one for EF-Tu (GTP) and one for translocation with EF-G (GTP).')] } }
    ] },
    { id: 'tossicologia', icona: '☣️', nome: ['Tossicologia e antidoti', 'Toxicology and antidotes'], moduli: [
      { id: 'tox_paracetamolo', motore: 'paracetamolo', titolo: ['Paracetamolo: NAPQI, glutatione e N-acetilcisteina', 'Paracetamol: NAPQI, glutathione and N-acetylcysteine'], eq: 'paracetamolo →(CYP2E1) NAPQI;  NAPQI + GSH → coniugato innocuo  ·  linea di trattamento: 150 mg/L a 4 h, dimezza ogni 4 h', badge: ['tossicologia clinica', 'clinical toxicology'], rappr: ['atomi'], sezione: null,
        sliders: [S('conc4', 'Concentrazione a 4 h', 'Concentration at 4 h', 20, 400, 120, 'mg/L'), S('emivita', 'Emivita', 'Half-life', 2, 8, 4, 'h', 0.5), S('ore', 'Ore dall\'ingestione', 'Hours since ingestion', 4, 24, 8, 'h', 0.5)],
        teoria: { core: ['Quasi tutto il paracetamolo si coniuga (glucuronide, solfato); una piccola parte è ossidata dal CYP2E1 a NAPQI, reattivo, che il glutatione (GSH) neutralizza. In sovradosaggio il GSH si esaurisce e il NAPQI si lega alle proteine degli epatociti: necrosi epatica. La N-acetilcisteina ricostituisce il GSH.', 'Almost all paracetamol is conjugated (glucuronide, sulfate); a small part is oxidised by CYP2E1 to reactive NAPQI, which glutathione (GSH) neutralises. In overdose GSH runs out and NAPQI binds hepatocyte proteins: liver necrosis. N-acetylcysteine rebuilds GSH.'],
          punti: [['Nomogramma di Rumack–Matthew: la concentrazione misurata dopo 4 h si confronta con la linea di trattamento (150 mg/L a 4 h; nel Regno Unito 100). Sopra la linea: N-acetilcisteina.', 'Rumack–Matthew nomogram: the level measured after 4 h is compared with the treatment line (150 mg/L at 4 h; 100 in the UK). Above the line: N-acetylcysteine.'], ['La N-acetilcisteina protegge quasi del tutto se data entro 8 h; l\'alcolismo cronico e il digiuno (CYP2E1 ↑, GSH ↓) aumentano il rischio.', 'N-acetylcysteine protects almost fully if given within 8 h; chronic alcohol use and fasting (CYP2E1 ↑, GSH ↓) raise the risk.']],
          esame: ['Il nomogramma vale per una singola ingestione con l\'ora nota, e non prima di 4 h: prima l\'assorbimento non è finito.', 'The nomogram applies to a single ingestion with a known time, and not before 4 h: absorption is not over before then.'],
          domande: [Q('Perché la N-acetilcisteina funziona?', 'È un precursore della cisteina: la cellula rifà il glutatione, che coniuga il NAPQI prima che danneggi le proteine.', 'Why does N-acetylcysteine work?', 'It is a cysteine precursor: the cell rebuilds glutathione, which conjugates NAPQI before it damages proteins.')] } }
    ] },
    { id: 'laboratorio', icona: '🧫', nome: ['Laboratorio e cromatografia', 'Laboratory and chromatography'], moduli: [
      { id: 'lab_hplc', motore: 'hplc', titolo: ['HPLC a fase inversa: Van Deemter, ritenzione e risoluzione', 'Reversed-phase HPLC: Van Deemter, retention and resolution'], eq: 'H = A + B/u + C·u  ·  log k = log k_w − S·φ  ·  Rₛ = 2(t_R2 − t_R1)/(w₁ + w₂)', badge: ['chimica analitica strumentale', 'instrumental analytical chemistry'], rappr: ['atomi'], sezione: null,
        sliders: [S('flowRate', 'Flusso F (colonna 150 × 4,6 mm, 5 µm)', 'Flow F (150 × 4.6 mm column, 5 µm)', 0.1, 3, 1, 'mL/min', 0.05), S('organicPct', 'Acetonitrile φ', 'Acetonitrile φ', 10, 90, 50, '%')],
        teoria: { core: ['In fase inversa (C18 apolare, fase mobile polare) gli analiti più polari escono prima. Più acetonitrile = fase mobile più forte = tempi più brevi (log k cala linearmente con φ). Van Deemter: il flusso ottimo minimizza l\'altezza del piatto H; troppo lento domina la diffusione (B/u), troppo veloce il trasferimento di massa (C·u).', 'In reversed phase (non-polar C18, polar mobile phase) the most polar analytes elute first. More acetonitrile = stronger mobile phase = shorter times (log k falls linearly with φ). Van Deemter: the optimum flow minimises plate height H; too slow and diffusion (B/u) dominates, too fast and mass transfer (C·u).'],
          punti: [['Rₛ ≥ 1,5: separazione completa alla linea di base.', 'Rₛ ≥ 1.5: baseline separation.'], ['SDS-PAGE: l\'SDS dà a ogni proteina una carica negativa proporzionale alla massa: si separa solo per peso molecolare.', 'SDS-PAGE: SDS gives every protein a negative charge proportional to mass: separation by molecular weight only.']],
          esame: ['Passando da fase diretta (silice) a fase inversa (C18) l\'ordine di eluizione si inverte.', 'Going from normal phase (silica) to reversed phase (C18) the elution order reverses.'],
          domande: [Q('Cosa succede alla risoluzione raddoppiando i piatti?', 'Rₛ cresce con √N: raddoppiare N la aumenta di circa 1,41 volte.', 'What happens to resolution if plates double?', 'Rₛ grows with √N: doubling N raises it about 1.41 times.')] } }
    ] },
    { id: 'insilico', icona: '💻', nome: ['In silico e superfici di energia', 'In silico and energy surfaces'], moduli: [
      { id: 'comp_pes', motore: 'pes', titolo: ['Superficie di energia potenziale: minimi, punto di sella, Eyring', 'Potential energy surface: minima, saddle point, Eyring'], eq: 'k = (k_B·T/h)·e^(−ΔG‡/RT)  ·  V_LJ = 4ε[(σ/r)¹² − (σ/r)⁶]', badge: ['chimica quantistica e dinamica', 'quantum chemistry and dynamics'], rappr: ['atomi'], sezione: null,
        sliders: [S('progress', 'Cammino di reazione (reagenti → prodotti)', 'Reaction path (reactants → products)', 0, 100, 0, '%'), S('tempK', 'Temperatura', 'Temperature', 200, 600, 298, 'K')],
        teoria: { core: ['Sulla superficie di energia potenziale reagenti e prodotti sono minimi (gradiente nullo, tutte le frequenze reali); lo stato di transizione è un punto di sella del primo ordine: massimo lungo il cammino, minimo in tutte le altre direzioni, una sola frequenza immaginaria.', 'On the potential energy surface reactants and products are minima (zero gradient, all real frequencies); the transition state is a first-order saddle point: maximum along the path, minimum in every other direction, one imaginary frequency.'],
          punti: [['La sfera bianca percorre il fondovalle della superficie MODELLO (due minimi, barriera ≈ 46 kJ/mol dal reagente, prodotti 30 kJ/mol più in basso); la costante di Eyring si ricalcola con la temperatura.', 'The white sphere follows the valley floor of the MODEL surface (two minima, barrier ≈ 46 kJ/mol from the reactant, products 30 kJ/mol lower); the Eyring constant is recomputed with temperature.'], ['Lennard-Jones 12-6: repulsione di Pauli (r⁻¹²) e attrazione di van der Waals (r⁻⁶). Passo tipico della dinamica molecolare: 1–2 fs.', 'Lennard-Jones 12-6: Pauli repulsion (r⁻¹²) and van der Waals attraction (r⁻⁶). Typical molecular dynamics step: 1–2 fs.']],
          esame: ['Lo stato di transizione non è un minimo: è un massimo lungo la coordinata di reazione e un minimo nelle direzioni ortogonali.', 'The transition state is not a minimum: it is a maximum along the reaction coordinate and a minimum in the orthogonal directions.'],
          domande: [Q('Di quanto accelera una reazione con Ea = 60 kJ/mol passando da 298 a 308 K?', 'Circa e^(Ea/R·(1/298 − 1/308)) ≈ 2,2 volte: la regola del «raddoppio ogni 10 °C».', 'How much faster is a reaction with Ea = 60 kJ/mol from 298 to 308 K?', 'About e^(Ea/R·(1/298 − 1/308)) ≈ 2.2 times: the «doubling every 10 °C» rule.')] } }
    ] },
    { id: 'biofisica', icona: '⚡', nome: ['Biofisica e canali ionici', 'Biophysics and ion channels'], moduli: [
      { id: 'biophys_hh', motore: 'hh', titolo: ['Il potenziale d\'azione: Hodgkin–Huxley e la Nernst del K⁺', 'The action potential: Hodgkin–Huxley and the K⁺ Nernst'], eq: 'C·dV/dt = I − g_Na·m³h(V − E_Na) − g_K·n⁴(V − E_K) − g_L(V − E_L)  ·  E_K = (RT/F)·ln([K⁺]ₑ/[K⁺]ᵢ)', badge: ['elettrofisiologia', 'electrophysiology'], rappr: ['atomi'], sezione: null,
        sliders: [S('kOut', '[K⁺] extracellulare', 'Extracellular [K⁺]', 2, 15, 4, 'mM', 0.5), S('naCond', 'Conduttanza g_Na', 'Conductance g_Na', 0, 100, 100, '%')],
        teoria: { core: ['Sopra soglia i canali Na⁺ voltaggio-dipendenti si aprono (m³) e il Na⁺ entra: feedback positivo, tutto-o-nulla. Poi si inattivano (h) e i canali K⁺ (n⁴) riportano giù il potenziale. Il grafico è il modello di Hodgkin–Huxley integrato in tempo reale, con E_K calcolato dalla Nernst.', 'Above threshold voltage-gated Na⁺ channels open (m³) and Na⁺ enters: positive feedback, all-or-none. Then they inactivate (h) and K⁺ channels (n⁴) bring the potential back down. The chart is the Hodgkin–Huxley model integrated in real time, with E_K from the Nernst equation.'],
          punti: [['La pompa Na⁺/K⁺-ATPasi (tipo P, elettrogenica) fa uscire 3 Na⁺ e entrare 2 K⁺ per ATP e mantiene i gradienti.', 'The Na⁺/K⁺-ATPase (P type, electrogenic) moves 3 Na⁺ out and 2 K⁺ in per ATP and keeps the gradients.'], ['Iperkaliemia: [K⁺]ₑ ↑ → E_K meno negativo → riposo depolarizzato; troppo e i canali Na⁺ restano inattivati (il cuore non riparte). Digossina: inibisce la pompa → Ca²⁺ ↑ via NCX.', 'Hyperkalaemia: [K⁺]ₑ ↑ → E_K less negative → depolarised rest; too much and Na⁺ channels stay inactivated (the heart fails to fire). Digoxin: inhibits the pump → Ca²⁺ ↑ via NCX.']],
          esame: ['Il potenziale d\'azione è tutto-o-nulla per il feedback positivo dell\'ingresso di Na⁺ sopra soglia (≈ −55 mV); la sua ampiezza non codifica l\'intensità dello stimolo, la frequenza sì.', 'The action potential is all-or-none because of the positive feedback of Na⁺ entry above threshold (≈ −55 mV); its amplitude does not encode stimulus strength, frequency does.'],
          domande: [Q('Cosa fa la tetrodotossina?', 'Blocca i canali Na⁺ voltaggio-dipendenti: niente fase di salita, niente potenziale d\'azione (prova: g_Na a 0 %).', 'What does tetrodotoxin do?', 'It blocks voltage-gated Na⁺ channels: no upstroke, no action potential (try g_Na at 0 %).')] } }
    ] },
    { id: 'quantistica', icona: '🌌', nome: ['Fisica quantistica, Hilbert, nD e stringhe', 'Quantum physics, Hilbert, nD and strings'], moduli: [
      { id: 'qm_qubit', motore: 'qubit', titolo: ['Il qubit nello spazio di Hilbert ℂ²: sfera di Bloch e oscillazioni di Rabi', 'The qubit in Hilbert space ℂ²: Bloch sphere and Rabi oscillations'], eq: '|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)·sin(θ/2)|1⟩  ·  P₁(t) = (Ω²/Ω′²)·sin²(Ω′t/2),  Ω′ = √(Ω² + Δ²)', badge: ['spazi di Hilbert', 'Hilbert spaces'], rappr: ['orbitale'], sezione: null,
        sliders: [S('rabi', 'Frequenza di Rabi Ω', 'Rabi frequency Ω', 0.1, 3, 1, '×2π MHz', 0.05), S('detuning', 'Disaccordo Δ', 'Detuning Δ', -3, 3, 0, '×2π MHz', 0.05)],
        teoria: { core: ['Lo stato di un qubit è un vettore unitario dello spazio di Hilbert ℂ², rappresentato da un punto della sfera di Bloch. Un campo risonante lo fa ruotare attorno all\'asse (Ω, 0, Δ): con Δ = 0 va da |0⟩ a |1⟩ e torna (oscillazioni di Rabi); fuori risonanza l\'ampiezza scende a Ω²/(Ω² + Δ²) e la frequenza sale.', 'A qubit state is a unit vector in the Hilbert space ℂ², shown as a point on the Bloch sphere. A resonant field rotates it about the axis (Ω, 0, Δ): with Δ = 0 it goes from |0⟩ to |1⟩ and back (Rabi oscillations); off resonance the amplitude drops to Ω²/(Ω² + Δ²) and the frequency rises.'],
          punti: [['Un impulso π (Ωt = π) inverte il qubit; un impulso π/2 crea la sovrapposizione (|0⟩ + |1⟩)/√2.', 'A π pulse (Ωt = π) flips the qubit; a π/2 pulse makes the superposition (|0⟩ + |1⟩)/√2.'], ['La misura dà |1⟩ con probabilità |⟨1|ψ⟩|² = sin²(θ/2) (regola di Born).', 'Measurement gives |1⟩ with probability |⟨1|ψ⟩|² = sin²(θ/2) (Born rule).']],
          esame: ['Due punti opposti sulla sfera di Bloch sono stati ortogonali in ℂ²: l\'angolo sulla sfera è il doppio di quello fra i vettori.', 'Two opposite points on the Bloch sphere are orthogonal states in ℂ²: the angle on the sphere is twice the angle between the vectors.'],
          domande: [Q('Perché θ/2 nella formula dello stato?', 'Perché ruotare di 2π sulla sfera cambia il segno del vettore di stato (spinore): serve 4π per tornare identici; la fase globale non si osserva.', 'Why θ/2 in the state formula?', 'Because a 2π turn on the sphere flips the sign of the state vector (spinor): 4π is needed to return identical; the global phase is unobservable.')] } },
      { id: 'hyper_ncubo', motore: 'ncubo', titolo: ['n-cubi: proiezione Rⁿ → R³ e matrice di rotazione dal vivo', 'n-cubes: projection Rⁿ → R³ and a live rotation matrix'], eq: 'V = {−1, +1}ⁿ, |V| = 2ⁿ, spigoli n·2ⁿ⁻¹  ·  fattore prospettico d/(d − xₖ)', badge: ['geometria iperdimensionale', 'hyperdimensional geometry'], rappr: ['proiezione'], sezione: null,
        sliders: [S('dimN', 'Dimensione n', 'Dimension n', 3, 8, 4, 'D'), S('focalD', 'Distanza prospettica d', 'Perspective distance d', 2, 6, 3.2, '', 0.1)],
        teoria: { core: ['Un n-cubo ha 2ⁿ vertici (tutti i segni ±1) e n·2ⁿ⁻¹ spigoli. Si ruota in un piano che contiene un asse in più (x–w) e si proietta in prospettiva un asse alla volta, dall\'ultimo al quarto, come un\'ombra in 3D.', 'An n-cube has 2ⁿ vertices (all ±1 signs) and n·2ⁿ⁻¹ edges. It is rotated in a plane containing an extra axis (x–w) and projected in perspective one axis at a time, from the last to the fourth, like a 3D shadow.'],
          punti: [['Tesseratto (4D): 16 vertici, 32 spigoli, 24 facce quadrate, 8 celle cubiche.', 'Tesseract (4D): 16 vertices, 32 edges, 24 square faces, 8 cubic cells.'], ['In 4D si ruota attorno a un PIANO, non a un asse: i punti del piano fermo restano dove sono.', 'In 4D you rotate about a PLANE, not an axis: points in the fixed plane stay put.']],
          esame: ['Il cubo «dentro il cubo» non è più piccolo davvero: è più lontano lungo w, e la prospettiva lo rimpicciolisce.', 'The cube «inside the cube» is not really smaller: it is further along w, and perspective shrinks it.'],
          domande: [Q('Quante facce quadrate ha un 5-cubo?', 'C(5,2)·2³ = 10·8 = 80.', 'How many square faces does a 5-cube have?', 'C(5,2)·2³ = 10·8 = 80.')] } },
      { id: 'string_cy', motore: 'calabiyau', titolo: ['Calabi–Yau: la sezione di Hanson della quintica di Fermat', 'Calabi–Yau: Hanson\'s cross-section of the Fermat quintic'], eq: 'z₁ⁿ + z₂ⁿ = 1,  z₁ = e^(2πik₁/n)·cosh(z)^(2/n),  z₂ = e^(2πik₂/n)·(−i·sinh z)^(2/n)', badge: ['teoria delle stringhe', 'string theory'], rappr: ['proiezione'], sezione: null,
        sliders: [S('n', 'Grado n (5 = quintica)', 'Degree n (5 = quintic)', 2, 6, 5, ''), S('alfa', 'Angolo di proiezione α', 'Projection angle α', 0, 180, 45, '°')],
        teoria: { core: ['Nella teoria delle superstringhe le 6 dimensioni in più sono arrotolate in una varietà di Calabi–Yau (tre dimensioni complesse). Non si può disegnare: questa è la classica sezione di Hanson, una curva complessa di ℂ² dove z₁ⁿ + z₂ⁿ = 1, fatta di n² pezzi, proiettata in 3D con l\'angolo α.', 'In superstring theory the 6 extra dimensions are curled up in a Calabi–Yau manifold (three complex dimensions). It cannot be drawn: this is the classic Hanson cross-section, a complex curve in ℂ² where z₁ⁿ + z₂ⁿ = 1, made of n² patches, projected to 3D with angle α.'],
          punti: [['La quintica di Fermat nel ℂP⁴ ha numeri di Hodge h¹¹ = 1, h²¹ = 101 e caratteristica di Eulero χ = 2(h¹¹ − h²¹) = −200.', 'The Fermat quintic in ℂP⁴ has Hodge numbers h¹¹ = 1, h²¹ = 101 and Euler characteristic χ = 2(h¹¹ − h²¹) = −200.'], ['Il banco controlla che ogni punto disegnato soddisfi davvero z₁ⁿ + z₂ⁿ = 1.', 'The bench checks every drawn point really satisfies z₁ⁿ + z₂ⁿ = 1.']],
          esame: ['Quella che vedi è una sezione 2D (reale) di una superficie, non la varietà 6D: è un\'immagine per capire la forma, non una misura.', 'What you see is a 2D (real) section of a surface, not the 6D manifold: a picture to grasp the shape, not a measurement.'],
          domande: [Q('Perché si dice che χ = −200 conta qualcosa di fisico?', 'Nei primi modelli di compattificazione |χ|/2 dava il numero di famiglie di particelle: 100 per la quintica, troppe; per questo si cercano Calabi–Yau con |χ| = 6.', 'Why is χ = −200 physically meaningful?', 'In early compactification models |χ|/2 gave the number of particle families: 100 for the quintic, too many; hence the search for Calabi–Yau with |χ| = 6.')] } }
    ] },
    { id: 'termodinamica', icona: '🔥', nome: ['Termodinamica ed elettrochimica', 'Thermodynamics and electrochemistry'], moduli: [
      { id: 'thermo_gibbs', motore: 'gibbs', titolo: ['Energia libera di Gibbs, equilibrio e cella elettrochimica', 'Gibbs free energy, equilibrium and the electrochemical cell'], eq: 'ΔG = ΔH − TΔS = −RT·ln K + RT·ln Q  ·  ΔG = −nFΔE', badge: ['termodinamica e redox', 'thermodynamics and redox'], rappr: ['atomi'], sezione: null,
        sliders: [S('tempK', 'Temperatura T', 'Temperature T', 200, 1000, 298, 'K'), S('deltaH', 'Entalpia ΔH°', 'Enthalpy ΔH°', -100, 100, -40, 'kJ/mol'), S('deltaS', 'Entropia ΔS°', 'Entropy ΔS°', -200, 200, -100, 'J/(mol·K)')],
        teoria: { core: ['A T e P costanti un processo è spontaneo se ΔG < 0. All\'equilibrio ΔG = 0 e ΔG° = −RT·ln K: nella scatola le molecole A (blu) e B (arancio) sono nella proporzione K. In una cella ΔE > 0 vuol dire ΔG < 0.', 'At constant T and P a process is spontaneous if ΔG < 0. At equilibrium ΔG = 0 and ΔG° = −RT·ln K: in the box A (blue) and B (orange) molecules sit in the ratio K. In a cell ΔE > 0 means ΔG < 0.'],
          punti: [['ΔH < 0 e ΔS > 0: sempre spontanea. ΔH > 0 e ΔS < 0: mai. Segni uguali: decide la temperatura, che cambia verso a T* = ΔH/ΔS.', 'ΔH < 0 and ΔS > 0: always spontaneous. ΔH > 0 and ΔS < 0: never. Same signs: temperature decides, switching at T* = ΔH/ΔS.'], ['Con n = 2 elettroni: E° = −ΔG°/(2F).', 'With n = 2 electrons: E° = −ΔG°/(2F).']],
          esame: ['Non confondere ΔG° (condizioni standard, 1 M, 1 bar) con ΔG reale, che dipende dal quoziente di reazione Q.', 'Do not mix ΔG° (standard conditions, 1 M, 1 bar) with the actual ΔG, which depends on the reaction quotient Q.'],
          domande: [Q('Una reazione con ΔH = −40 kJ/mol e ΔS = −100 J/(mol·K) a che temperatura smette di essere spontanea?', 'Sopra T* = ΔH/ΔS = 40 000/100 = 400 K.', 'At what temperature does a reaction with ΔH = −40 kJ/mol and ΔS = −100 J/(mol·K) stop being spontaneous?', 'Above T* = ΔH/ΔS = 40 000/100 = 400 K.')] } }
    ] }
  ];

  function perId(id) { var r = null; AREE.forEach(function (a) { a.moduli.forEach(function (m) { if (m.id === id) r = { area: a, modulo: m }; }); }); return r; }
  function moduli() { var r = []; AREE.forEach(function (a) { a.moduli.forEach(function (m) { r.push(m); }); }); return r; }

  g.BSIQuantumDati = { AREE: AREE, perId: perId, moduli: moduli,
    morse: morse, carattereIonico: carattereIonico, larmor: larmor, nmr: nmr, pascal: pascal, ETANOLO: ETANOLO, GAMMA_H: GAMMA_H,
    doseRisposta: doseRisposta, generaDati: generaDati, jacobi: jacobi, pca: pca, rng: rng,
    hplc: hplc, ANALITI: ANALITI, pes: pes, pesCammino: pesCammino, pesPunti: pesPunti, eyring: eyring, EB: EB,
    HH: HH, nernstK: nernstK, hhNuovo: hhNuovo, hhPasso: hhPasso, stimolo: stimolo,
    ncubo: ncubo, proietta: proietta, calabiYau: calabiYau, residuoCY: residuoCY, cpow: cpow,
    rabi: rabi, gibbs: gibbs, lineaTrattamento: lineaTrattamento, paracetamolo: paracetamolo, SN2_SUB: SN2_SUB, sn2Barriera: sn2Barriera, atpSintasi: atpSintasi,
    COSTANTI: { R: R, F: F, KB: KB, H: H } };
})(typeof window !== 'undefined' ? window : globalThis);
