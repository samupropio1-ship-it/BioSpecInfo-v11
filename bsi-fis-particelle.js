/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-particelle.js — ⚛️ fisica delle particelle
   BioSpecInfo · © Samuele Pio Provenzano

   · MODELLO STANDARD: quark, leptoni, bosoni di gauge e Higgs come schede da
     toccare, con massa (valori PDG), carica, spin, interazioni; le masse su
     una scala logaritmica che copre dodici ordini di grandezza;
   · LEGGI DI CONSERVAZIONE: una reazione o un decadimento proposti vengono
     controllati per carica, numero barionico, numeri leptonici di ogni
     famiglia, momento angolare (parita' del numero di fermioni) ed energia
     (Q del decadimento o soglia su bersaglio fisso);
   · MASSA INVARIANTE: eventi simulati Z → μ⁺μ⁻ piu' un fondo che cade; la
     massa ricostruita dai quadrivettori dei due muoni riempie l'istogramma,
     e un fit di Breit–Wigner + esponenziale ritrova M_Z e Γ_Z;
   · VITE MEDIE RELATIVISTICHE: i muoni dei raggi cosmici nati a 15 km che
     arrivano al livello del mare, con e senza dilatazione dei tempi; il
     calcolatore del decadimento a due corpi (π⁺ → μ⁺ν: p = 29,79 MeV/c);
   · RIVELATORE 3D (v238): Z → μμ, Z → ee, H → γγ in un rivelatore come CMS,
     eliche nel campo, colpi, ricostruzione di p_T e della massa invariante.
   Unita': MeV, MeV/c, MeV/c² (c = 1) salvo dove indicato in GeV.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  var C_TAU_MU = 658.638, M_MU = 105.6583755, TAU_MU = 2.1969811e-6, MZ = 91.1880, GZ = 2.4955;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rnd) { var u = Math.max(1e-12, rnd()), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  /* massa leggibile: eV, keV, MeV, GeV a seconda della grandezza (ingresso in MeV) */
  function unitaMassa(m) {
    if (m === 0) return '0';
    if (m < 1e-3) return fmt(m * 1e6) + ' eV';
    if (m < 1) return fmt(m * 1e3) + ' keV';
    if (m < 1000) return fmt(m) + ' MeV';
    return fmt(m / 1000) + ' GeV';
  }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* il Modello Standard (PDG 2024). m in MeV/c²; per i neutrini e' un limite superiore */
  var MODELLO = [
    { s: 'u', n: ['up', 'up'], m: 2.16, err: '+0,49 −0,26 MeV', q: '+2/3', spin: '1/2', g: 'quark', gen: 1, anno: '1968', int: ['forte, em, debole', 'strong, em, weak'] },
    { s: 'c', n: ['charm', 'charm'], m: 1273, err: '± 4,6 MeV', q: '+2/3', spin: '1/2', g: 'quark', gen: 2, anno: '1974', int: ['forte, em, debole', 'strong, em, weak'] },
    { s: 't', n: ['top', 'top'], m: 172570, err: '± 290 MeV', q: '+2/3', spin: '1/2', g: 'quark', gen: 3, anno: '1995', int: ['forte, em, debole', 'strong, em, weak'] },
    { s: 'g', n: ['gluone', 'gluon'], m: 0, err: '', q: '0', spin: '1', g: 'bosone', gen: 0, anno: '1979', int: ['forte (8 colori)', 'strong (8 colours)'] },
    { s: 'H', n: ['bosone di Higgs', 'Higgs boson'], m: 125200, err: '± 110 MeV', q: '0', spin: '0', g: 'higgs', gen: 0, anno: '2012', int: ['accoppiamento ∝ massa', 'coupling ∝ mass'] },
    { s: 'd', n: ['down', 'down'], m: 4.70, err: '+0,48 −0,17 MeV', q: '−1/3', spin: '1/2', g: 'quark', gen: 1, anno: '1968', int: ['forte, em, debole', 'strong, em, weak'] },
    { s: 's', n: ['strange', 'strange'], m: 93.5, err: '± 0,8 MeV', q: '−1/3', spin: '1/2', g: 'quark', gen: 2, anno: '1968', int: ['forte, em, debole', 'strong, em, weak'] },
    { s: 'b', n: ['bottom', 'bottom'], m: 4183, err: '± 7 MeV', q: '−1/3', spin: '1/2', g: 'quark', gen: 3, anno: '1977', int: ['forte, em, debole', 'strong, em, weak'] },
    { s: 'γ', n: ['fotone', 'photon'], m: 0, err: '', q: '0', spin: '1', g: 'bosone', gen: 0, anno: '1905', int: ['elettromagnetica', 'electromagnetic'] },
    { s: 'e', n: ['elettrone', 'electron'], m: 0.51099895, err: '± 1,5·10⁻¹⁰ MeV', q: '−1', spin: '1/2', g: 'leptone', gen: 1, anno: '1897', int: ['em, debole', 'em, weak'] },
    { s: 'μ', n: ['muone', 'muon'], m: 105.6583755, err: '± 2,3·10⁻⁶ MeV', q: '−1', spin: '1/2', g: 'leptone', gen: 2, anno: '1936', int: ['em, debole', 'em, weak'] },
    { s: 'τ', n: ['tau', 'tau'], m: 1776.93, err: '± 0,09 MeV', q: '−1', spin: '1/2', g: 'leptone', gen: 3, anno: '1975', int: ['em, debole', 'em, weak'] },
    { s: 'Z', n: ['bosone Z', 'Z boson'], m: 91188.0, err: '± 2,0 MeV', q: '0', spin: '1', g: 'bosone', gen: 0, anno: '1983', int: ['debole (corrente neutra)', 'weak (neutral current)'] },
    { s: 'νₑ', n: ['neutrino elettronico', 'electron neutrino'], m: 0.45e-6, err: '< 0,45 eV (KATRIN)', q: '0', spin: '1/2', g: 'neutrino', gen: 1, anno: '1956', int: ['solo debole', 'weak only'] },
    { s: 'ν_μ', n: ['neutrino muonico', 'muon neutrino'], m: 0.45e-6, err: '< 0,19 MeV diretto; Σm_ν ≲ 0,12 eV (cosmologia)', q: '0', spin: '1/2', g: 'neutrino', gen: 2, anno: '1962', int: ['solo debole', 'weak only'] },
    { s: 'ν_τ', n: ['neutrino tauonico', 'tau neutrino'], m: 0.45e-6, err: '< 18,2 MeV diretto; Σm_ν ≲ 0,12 eV (cosmologia)', q: '0', spin: '1/2', g: 'neutrino', gen: 3, anno: '2000', int: ['solo debole', 'weak only'] },
    { s: 'W', n: ['bosone W', 'W boson'], m: 80369.2, err: '± 13,3 MeV', q: '±1', spin: '1', g: 'bosone', gen: 0, anno: '1983', int: ['debole (corrente carica)', 'weak (charged current)'] }
  ];

  /* le particelle delle reazioni: m (MeV), Q, B, Le, Lμ, Lτ, S (stranezza), 2J (due volte lo spin) */
  var PART = {
    'p': { n: 'p', m: 938.27208816, Q: 1, B: 1, Le: 0, Lm: 0, Lt: 0, S: 0, J2: 1 },
    'pbar': { n: 'p̄', m: 938.27208816, Q: -1, B: -1, Le: 0, Lm: 0, Lt: 0, S: 0, J2: 1 },
    'n': { n: 'n', m: 939.56542052, Q: 0, B: 1, Le: 0, Lm: 0, Lt: 0, S: 0, J2: 1 },
    'e-': { n: 'e⁻', m: 0.51099895, Q: -1, B: 0, Le: 1, Lm: 0, Lt: 0, S: 0, J2: 1 },
    'e+': { n: 'e⁺', m: 0.51099895, Q: 1, B: 0, Le: -1, Lm: 0, Lt: 0, S: 0, J2: 1 },
    'mu-': { n: 'μ⁻', m: M_MU, Q: -1, B: 0, Le: 0, Lm: 1, Lt: 0, S: 0, J2: 1 },
    'mu+': { n: 'μ⁺', m: M_MU, Q: 1, B: 0, Le: 0, Lm: -1, Lt: 0, S: 0, J2: 1 },
    'nue': { n: 'νₑ', m: 0, Q: 0, B: 0, Le: 1, Lm: 0, Lt: 0, S: 0, J2: 1 },
    'nuebar': { n: 'ν̄ₑ', m: 0, Q: 0, B: 0, Le: -1, Lm: 0, Lt: 0, S: 0, J2: 1 },
    'numu': { n: 'ν_μ', m: 0, Q: 0, B: 0, Le: 0, Lm: 1, Lt: 0, S: 0, J2: 1 },
    'numubar': { n: 'ν̄_μ', m: 0, Q: 0, B: 0, Le: 0, Lm: -1, Lt: 0, S: 0, J2: 1 },
    'gamma': { n: 'γ', m: 0, Q: 0, B: 0, Le: 0, Lm: 0, Lt: 0, S: 0, J2: 2 },
    'pi+': { n: 'π⁺', m: 139.57039, Q: 1, B: 0, Le: 0, Lm: 0, Lt: 0, S: 0, J2: 0 },
    'pi-': { n: 'π⁻', m: 139.57039, Q: -1, B: 0, Le: 0, Lm: 0, Lt: 0, S: 0, J2: 0 },
    'pi0': { n: 'π⁰', m: 134.9768, Q: 0, B: 0, Le: 0, Lm: 0, Lt: 0, S: 0, J2: 0 },
    'K+': { n: 'K⁺', m: 493.677, Q: 1, B: 0, Le: 0, Lm: 0, Lt: 0, S: 1, J2: 0 },
    'K0': { n: 'K⁰', m: 497.611, Q: 0, B: 0, Le: 0, Lm: 0, Lt: 0, S: 1, J2: 0 },
    'Lambda': { n: 'Λ', m: 1115.683, Q: 0, B: 1, Le: 0, Lm: 0, Lt: 0, S: -1, J2: 1 }
  };
  var REAZIONI = [
    { id: 'beta', i: ['n'], f: ['p', 'e-', 'nuebar'] },
    { id: 'pdec', i: ['p'], f: ['e+', 'gamma'] },
    { id: 'mudec', i: ['mu-'], f: ['e-', 'nuebar', 'numu'] },
    { id: 'pimu', i: ['pi+'], f: ['mu+', 'numu'] },
    { id: 'pi0gg', i: ['pi0'], f: ['gamma', 'gamma'] },
    { id: 'kpipi', i: ['K+'], f: ['pi+', 'pi0'] },
    { id: 'lam', i: ['Lambda'], f: ['p', 'pi-'] },
    { id: 'pppi0', i: ['p', 'p'], f: ['p', 'p', 'pi0'] },
    { id: 'npe', i: ['n'], f: ['p', 'e-'] },
    { id: 'betanu', i: ['n'], f: ['p', 'e-', 'nue'] },
    { id: 'meg', i: ['mu-'], f: ['e-', 'gamma'] },
    { id: 'pnbeta', i: ['p'], f: ['n', 'e+', 'nue'] },
    { id: 'assoc', i: ['pi-', 'p'], f: ['K0', 'Lambda'] },
    { id: 'gee', i: ['gamma'], f: ['e+', 'e-'] },
    { id: 'ppbar', i: ['p', 'pbar'], f: ['pi+', 'pi-', 'pi0'] }
  ];
  function nomeReazione(r) {
    var n = function (l) { return l.map(function (k) { return PART[k].n; }).join(' + '); };
    return n(r.i) + (r.i.length === 1 ? ' → ' : ' → ') + n(r.f);
  }
  /* soglia su bersaglio fisso: T_soglia = [(Σm_f)² − (m₁ + m₂)²] / (2 m₂) */
  function soglia(m1, m2, sommaFin) { return Math.max(0, (sommaFin * sommaFin - (m1 + m2) * (m1 + m2)) / (2 * m2)); }
  /* √s per un fascio di energia cinetica T su un bersaglio fermo */
  function radiceS(m1, m2, T) { var E1 = T + m1; return Math.sqrt(m1 * m1 + m2 * m2 + 2 * m2 * E1); }
  /* il controllo: per ogni grandezza il totale iniziale e finale, poi energia e momento angolare */
  function controlla(r, Tfascio) {
    var somma = function (l, k) { return l.reduce(function (a, x) { return a + PART[x][k]; }, 0); };
    var out = { grandezze: {}, motivi: [], permessa: true };
    [['Q', ['carica elettrica Q', 'electric charge Q']], ['B', ['numero barionico B', 'baryon number B']], ['Le', ['numero leptonico Lₑ', 'lepton number Lₑ']], ['Lm', ['numero leptonico L_μ', 'lepton number L_μ']], ['Lt', ['numero leptonico L_τ', 'lepton number L_τ']]].forEach(function (g) {
      var a = somma(r.i, g[0]), b = somma(r.f, g[0]);
      out.grandezze[g[0]] = [a, b];
      if (a !== b) { out.permessa = false; out.motivi.push([g[1][0] + ' non conservato (' + a + ' → ' + b + ')', g[1][1] + ' not conserved (' + a + ' → ' + b + ')']); }
    });
    /* momento angolare: il numero di fermioni (2J dispari) deve conservare la parita' */
    var fi = r.i.filter(function (k) { return PART[k].J2 % 2; }).length, ff = r.f.filter(function (k) { return PART[k].J2 % 2; }).length;
    out.grandezze.J = [fi % 2 ? '½-int' : 'int', ff % 2 ? '½-int' : 'int'];
    if ((fi - ff) % 2) { out.permessa = false; out.motivi.push(['momento angolare: spin semintero → intero (numero dispari di fermioni cambiato)', 'angular momentum: half-integer → integer spin (odd change in fermion number)']); }
    var S0 = somma(r.i, 'S'), S1 = somma(r.f, 'S'); out.grandezze.S = [S0, S1];
    var mf = somma(r.f, 'm'); out.sommaFin = mf;
    if (r.i.length === 1) {
      var M = PART[r.i[0]].m; out.M = M; out.Qval = M - mf;
      if (out.Qval <= 0) { out.permessa = false; out.motivi.push([M === 0 ? 'energia-impulso: una particella senza massa non può decadere in particelle massive nel vuoto (serve un nucleo che assorba l’impulso)' : 'energia: la massa iniziale (' + fmt(M) + ' MeV) è minore della somma finale (' + fmt(mf) + ' MeV)', M === 0 ? 'energy-momentum: a massless particle cannot decay into massive ones in vacuum (a nucleus must absorb the momentum)' : 'energy: initial mass (' + fmt(M) + ' MeV) is below the final sum (' + fmt(mf) + ' MeV)']); }
    } else {
      var m1 = PART[r.i[0]].m, m2 = PART[r.i[1]].m, T = Tfascio || 0;
      out.soglia = soglia(m1, m2, mf); out.rs = radiceS(m1, m2, T); out.Qval = out.rs - mf; out.T = T;
      if (out.Qval < 0) { out.permessa = false; out.motivi.push(['energia: sotto soglia (T = ' + fmt(T) + ' MeV < T_soglia = ' + fmt(out.soglia) + ' MeV)', 'energy: below threshold (T = ' + fmt(T) + ' MeV < T_thr = ' + fmt(out.soglia) + ' MeV)']); }
    }
    /* quale interazione: neutrini o stranezza che cambia → debole; solo fotoni in piu' → em; altrimenti forte */
    var tutti = r.i.concat(r.f), nu = tutti.some(function (k) { return /^nu/.test(k); }), lept = tutti.some(function (k) { return /^(e|mu)/.test(k); }), fot = tutti.indexOf('gamma') >= 0;
    out.interazione = nu || S0 !== S1 ? 'debole' : (fot || lept) ? 'em' : 'forte';
    if (Math.abs(S0 - S1) > 1) { out.permessa = false; out.motivi.push(['stranezza: |ΔS| > 1 non avviene nemmeno con l’interazione debole', 'strangeness: |ΔS| > 1 does not occur even in weak interactions']); }
    return out;
  }

  /* quadrivettori [E, px, py, pz]: massa invariante e trasformazione di Lorentz con β qualsiasi */
  function massa(p) { var m2 = p[0] * p[0] - p[1] * p[1] - p[2] * p[2] - p[3] * p[3]; return m2 > 0 ? Math.sqrt(m2) : 0; }
  function somma4(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]]; }
  function spinta(p, bx, by, bz) {
    var b2 = bx * bx + by * by + bz * bz; if (b2 < 1e-30) return p.slice();
    var g = 1 / Math.sqrt(1 - b2), bp = bx * p[1] + by * p[2] + bz * p[3], k = (g - 1) * bp / b2 + g * p[0];
    return [g * (p[0] + bp), p[1] + k * bx, p[2] + k * by, p[3] + k * bz];
  }
  /* decadimento a due corpi nel riferimento di quiete: p* = √{[M² − (m₁+m₂)²][M² − (m₁−m₂)²]} / 2M */
  function dueCorpi(M, m1, m2) {
    var a = (M * M - (m1 + m2) * (m1 + m2)) * (M * M - (m1 - m2) * (m1 - m2));
    if (a < 0 || M <= m1 + m2) return null;
    var p = Math.sqrt(a) / (2 * M), E1 = (M * M + m1 * m1 - m2 * m2) / (2 * M), E2 = (M * M + m2 * m2 - m1 * m1) / (2 * M);
    return { p: p, E1: E1, E2: E2, T1: E1 - m1, T2: E2 - m2, b1: p / E1, b2: E2 > 0 ? p / E2 : 1 };
  }
  /* un evento: una particella di massa M (GeV) con pT e rapidita' casuali che decade isotropa in due muoni */
  var MMU_G = M_MU / 1000;
  function coppia(rnd, M, res) {
    var pT = Math.abs(gauss(rnd)) * 8, phi = 2 * Math.PI * rnd(), y = (rnd() - 0.5) * 4, mT = Math.sqrt(M * M + pT * pT);
    var P = [mT * Math.cosh(y), pT * Math.cos(phi), pT * Math.sin(phi), mT * Math.sinh(y)];
    var ps = Math.sqrt(Math.max(0, M * M / 4 - MMU_G * MMU_G)), ct = 2 * rnd() - 1, st = Math.sqrt(1 - ct * ct), ph = 2 * Math.PI * rnd();
    var d = [ps * st * Math.cos(ph), ps * st * Math.sin(ph), ps * ct], E = M / 2;
    var bx = P[1] / P[0], by = P[2] / P[0], bz = P[3] / P[0];
    var mu = [spinta([E, d[0], d[1], d[2]], bx, by, bz), spinta([E, -d[0], -d[1], -d[2]], bx, by, bz)];
    if (res > 0) mu = mu.map(function (q) { var f = 1 + res * gauss(rnd), px = q[1] * f, py = q[2] * f, pz = q[3] * f; return [Math.sqrt(MMU_G * MMU_G + px * px + py * py + pz * pz), px, py, pz]; });
    return mu;
  }
  /* il generatore di eventi: frazione fFondo di coppie con massa da un'esponenziale su [60, 120] GeV */
  function generatore(seme, fFondo, res) {
    var rnd = mulberry32(seme || 1), lam = 18;
    return function () {
      var M;
      if (rnd() < fFondo) { var u = rnd(); M = 60 - lam * Math.log(1 - u * (1 - Math.exp(-60 / lam))); }
      else { do { M = MZ + GZ / 2 * Math.tan(Math.PI * (rnd() - 0.5)); } while (M < 55 || M > 130); }
      var mu = coppia(rnd, M, res);
      return { mu: mu, m: massa(somma4(mu[0], mu[1])), vero: M };
    };
  }
  var HMIN = 60, HMAX = 120, NB = 120;
  function istogramma() { return new Float64Array(NB); }
  function riempi(h, m) { var k = Math.floor((m - HMIN) / (HMAX - HMIN) * NB); if (k >= 0 && k < NB) h[k]++; }
  /* modello per bin: segnale Breit–Wigner + fondo esponenziale; par = [Ns, M, Γ, Nb, λ] */
  function modello(par, m, w) { return par[0] * w * (par[2] / (2 * Math.PI)) / ((m - par[1]) * (m - par[1]) + par[2] * par[2] / 4) + par[3] * w * Math.exp(-(m - HMIN) / par[4]) / par[4]; }
  /* Nelder–Mead sulla verosimiglianza di Poisson (le grandezze positive in logaritmo) */
  function neldermead(f, x0, passi, iter) {
    var n = x0.length, S = [x0.slice()], i, j;
    for (i = 0; i < n; i++) { var v = x0.slice(); v[i] += passi[i]; S.push(v); }
    var fv = S.map(f);
    for (var it = 0; it < iter; it++) {
      var ord = fv.map(function (v, k) { return k; }).sort(function (a, b) { return fv[a] - fv[b]; });
      S = ord.map(function (k) { return S[k]; }); fv = ord.map(function (k) { return fv[k]; });
      var c = new Array(n); for (j = 0; j < n; j++) { c[j] = 0; for (i = 0; i < n; i++) c[j] += S[i][j] / n; }
      var pt = function (a) { var r = []; for (var j = 0; j < n; j++) r.push(c[j] + a * (S[n][j] - c[j])); return r; };
      var xr = pt(-1), fr = f(xr);
      if (fr < fv[0]) { var xe = pt(-2), fe = f(xe); if (fe < fr) { S[n] = xe; fv[n] = fe; } else { S[n] = xr; fv[n] = fr; } }
      else if (fr < fv[n - 1]) { S[n] = xr; fv[n] = fr; }
      else {
        var xc = pt(0.5), fc = f(xc);
        if (fc < fv[n]) { S[n] = xc; fv[n] = fc; }
        else for (i = 1; i <= n; i++) { for (j = 0; j < n; j++) S[i][j] = S[0][j] + 0.5 * (S[i][j] - S[0][j]); fv[i] = f(S[i]); }
      }
      if (Math.abs(fv[n] - fv[0]) < 1e-9 * (1 + Math.abs(fv[0]))) break;
    }
    return S[0];
  }
  function adatta(h) {
    var w = (HMAX - HMIN) / NB, tot = 0, kmax = 0, i;
    for (i = 0; i < NB; i++) { tot += h[i]; if (h[i] > h[kmax]) kmax = i; }
    if (tot < 30) return null;
    var dec = function (x) { return [Math.exp(x[0]), x[1], Math.exp(x[2]), Math.exp(x[3]), Math.exp(x[4])]; };
    var nll = function (x) {
      var p = dec(x), s = 0;
      if (p[4] > 500 || p[2] > 30) return 1e30;
      for (var i = 0; i < NB; i++) { var mu = Math.max(1e-12, modello(p, HMIN + (i + 0.5) * w, w)); s += mu - h[i] * Math.log(mu); }
      return s;
    };
    var x = [Math.log(tot * 0.8), HMIN + (kmax + 0.5) * w, Math.log(3), Math.log(tot * 0.2 + 1), Math.log(20)];
    x = neldermead(nll, x, [0.3, 1, 0.3, 0.5, 0.3], 1500);
    x = neldermead(nll, x, [0.1, 0.3, 0.1, 0.2, 0.1], 1500);
    var p = dec(x);
    return { Ns: p[0], M: p[1], G: p[2], Nb: p[3], lam: p[4], tot: tot };
  }
  /* muoni cosmici: sopravvivenza dopo h metri a energia totale E (MeV) */
  function muoni(E, h) {
    var g = E / M_MU; if (g < 1) g = 1;
    var bg = Math.sqrt(g * g - 1), b = bg / g;
    var tLab = h / (b * 299792458), tProprio = tLab / g;
    return { gamma: g, beta: b, L: bg * C_TAU_MU, tLab: tLab, tProprio: tProprio, conDil: Math.exp(-tProprio / TAU_MU), senzaDil: Math.exp(-tLab / TAU_MU) };
  }
  /* v238 — un rivelatore cilindrico come CMS (unita': metri, GeV, tesla). Dentro il solenoide
     (r < 3 m) B = 3,8 T lungo z; nel giogo di ferro (3 < r < 7 m) il campo di ritorno e' opposto,
     −1,8 T, e i muoni curvano dall'altra parte. Una particella di carica q e impulso p percorre
     un'elica: in ogni passo ds la direzione ruota attorno a z di −0,3 q B ds / p (raggio nel piano
     trasverso R = p_T/(0,3 B)). I punti misurati sono le intersezioni con gli strati del tracciatore. */
  var RIV = { B: 3.8, Bferro: -1.8, strati: [0.044, 0.073, 0.102, 0.255, 0.339, 0.418, 0.498, 0.608, 0.692, 0.780, 0.868, 0.965, 1.08], rEcal: 1.29, rHcal: 1.8, rSol: 3.0, rMu: [4.0, 5.0, 6.0, 7.0], zMax: 6.5 };
  function campoRiv(r) { return r < RIV.rSol ? RIV.B : r < 7.2 ? RIV.Bferro : 0; }
  /* tipo: 'mu' attraversa tutto, 'e' si ferma nel calorimetro elettromagnetico, 'pi' in quello adronico,
     'gamma' vola dritto fino all'ECAL (non ha carica) */
  function traccia(p4, q, tipo, ds) {
    ds = ds || 0.005;
    var P = Math.hypot(p4[1], p4[2], p4[3]), u = [p4[1] / P, p4[2] / P, p4[3] / P], x = [0, 0, 0], pts = [[0, 0, 0]], colpi = [], k = 0, rPrec = 0, fine = 'esce', impatto = null;
    var rStop = tipo === 'e' || tipo === 'gamma' ? RIV.rEcal : tipo === 'pi' ? RIV.rHcal + 0.6 : 7.3;
    for (var i = 0; i < 40000; i++) {
      var r = Math.hypot(x[0], x[1]);
      /* mezza rotazione, il passo, l'altra mezza: i vertici della spezzata stanno sull'elica */
      var a = q ? -0.15 * q * campoRiv(r) * ds / P : 0, c = Math.cos(a), sn = Math.sin(a), ux = u[0] * c - u[1] * sn; u[1] = u[0] * sn + u[1] * c; u[0] = ux;
      var xn = [x[0] + u[0] * ds, x[1] + u[1] * ds, x[2] + u[2] * ds], rn = Math.hypot(xn[0], xn[1]);
      ux = u[0] * c - u[1] * sn; u[1] = u[0] * sn + u[1] * c; u[0] = ux;
      for (k = 0; k < RIV.strati.length; k++) { var L = RIV.strati[k]; if (r < L && rn >= L) { var f = (L - r) / (rn - r); colpi.push([x[0] + (xn[0] - x[0]) * f, x[1] + (xn[1] - x[1]) * f, x[2] + (xn[2] - x[2]) * f, k]); } }
      x = xn; if (i % 4 === 3) pts.push(x.slice());
      if (rn >= rStop) { fine = tipo === 'mu' ? 'esce' : tipo === 'pi' ? 'hcal' : 'ecal'; impatto = x.slice(); break; }
      if (Math.abs(x[2]) > RIV.zMax) { fine = 'avanti'; break; }
      if (i * ds > (tipo === 'pi' ? 3.5 : 12)) { fine = 'spirale'; break; }
    }
    pts.push(x.slice());
    return { pts: pts, colpi: colpi, fine: fine, impatto: impatto };
  }
  /* la circonferenza per tre punti del piano trasverso */
  function cerchio3(a, b, c) {
    var d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])); if (Math.abs(d) < 1e-15) return null;
    var a2 = a[0] * a[0] + a[1] * a[1], b2 = b[0] * b[0] + b[1] * b[1], c2 = c[0] * c[0] + c[1] * c[1];
    var xc = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d, yc = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
    return { xc: xc, yc: yc, R: Math.hypot(a[0] - xc, a[1] - yc) };
  }
  /* la ricostruzione: cerchio per il vertice (0, 0), un punto a meta' e l'ultimo strato; p_T = 0,3 B R;
     la carica dal verso di rotazione; tan λ = z / arco trasverso; il quadrivettore con la massa m */
  function ricostruisci(colpi, m) {
    if (colpi.length < 3) return null;
    var A = colpi[Math.floor(colpi.length / 2)], Bp = colpi[colpi.length - 1], C = cerchio3([0, 0], A, Bp); if (!C) return null;
    var pT = 0.3 * RIV.B * C.R, t0 = [-C.yc, C.xc]; if (t0[0] * colpi[0][0] + t0[1] * colpi[0][1] < 0) t0 = [C.yc, -C.xc];
    var nt = Math.hypot(t0[0], t0[1]); t0 = [t0[0] / nt, t0[1] / nt];
    var q = t0[0] * Bp[1] - t0[1] * Bp[0] < 0 ? 1 : -1;
    var a0 = Math.atan2(-C.yc, -C.xc), a1 = Math.atan2(Bp[1] - C.yc, Bp[0] - C.xc), da = Math.abs(Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0))), tl = Bp[2] / (C.R * da);
    var px = pT * t0[0], py = pT * t0[1], pz = pT * tl;
    return { q: q, pT: pT, p4: [Math.sqrt(m * m + px * px + py * py + pz * pz), px, py, pz], R: C.R };
  }
  /* H → γγ: un Higgs con p_T e rapidita' casuali che decade isotropo in due fotoni */
  function eventoHgg(rnd) {
    var M = 125.2, pT = Math.abs(gauss(rnd)) * 15, phi = 2 * Math.PI * rnd(), y = (rnd() - 0.5) * 3, mT = Math.sqrt(M * M + pT * pT);
    var P = [mT * Math.cosh(y), pT * Math.cos(phi), pT * Math.sin(phi), mT * Math.sinh(y)], ct = 2 * rnd() - 1, st = Math.sqrt(1 - ct * ct), ph = 2 * Math.PI * rnd(), E = M / 2;
    var d = [E * st * Math.cos(ph), E * st * Math.sin(ph), E * ct], b = [P[1] / P[0], P[2] / P[0], P[3] / P[0]];
    return [spinta([E, d[0], d[1], d[2]], b[0], b[1], b[2]), spinta([E, -d[0], -d[1], -d[2]], b[0], b[1], b[2])];
  }
  F.calcolo.particelle = { MODELLO: MODELLO, PART: PART, REAZIONI: REAZIONI, controlla: controlla, soglia: soglia, radiceS: radiceS, massa: massa, somma4: somma4, spinta: spinta, dueCorpi: dueCorpi, generatore: generatore, istogramma: istogramma, riempi: riempi, adatta: adatta, modello: modello, muoni: muoni, nomeReazione: nomeReazione, MZ: MZ, GZ: GZ, HMIN: HMIN, HMAX: HMAX, NB: NB,
    RIV: RIV, campoRiv: campoRiv, traccia: traccia, cerchio3: cerchio3, ricostruisci: ricostruisci, eventoHgg: eventoHgg };

  /* ═══ 1. Modello Standard ═══════════════════════════════════════════════ */
  var COLORI = { quark: '#c9b9ff', leptone: '#5eead4', neutrino: '#6bcfff', bosone: '#ff8a80', higgs: '#ffd24a' };
  function schedaModello(div) {
    var G = griglia(div), info = nota(G.pan), sel = 0;
    var tab = F.el('div', { style: 'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-bottom:10px' });
    G.dx.appendChild(tab);
    var carte = MODELLO.map(function (p, k) {
      var c = F.el('button', { type: 'button', 'aria-label': F.tt(p.n), style: 'background:#0a1628;border:1px solid ' + COLORI[p.g] + '55;border-radius:8px;padding:5px 2px;color:#e6fffb;cursor:pointer;font-family:inherit;min-width:0;min-height:58px;text-align:center', onclick: function () { sel = k; aggiorna(); } }, [
        F.el('div', { style: 'font-size:1.15rem;font-weight:800;color:' + COLORI[p.g], testo: p.s }),
        F.el('div', { style: 'font-size:.62rem;color:#9fb1c6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', testo: p.g === 'neutrino' ? '< 0,45 eV' : unitaMassa(p.m) }),
        F.el('div', { style: 'font-size:.6rem;color:#8494a8', testo: p.q + ' · ' + p.spin })
      ]);
      tab.appendChild(c); return c;
    });
    var cv = F.tela(G.dx, 0.42);
    function disegna() {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, x0 = 30, x1 = W - 16, lo = -1, hi = 12;
      var X = function (lg) { return x0 + (lg - lo) / (hi - lo) * (x1 - x0); }, y0 = H - 30;
      q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x1, y0); q.stroke();
      q.font = '10px system-ui'; q.fillStyle = '#8494a8'; q.textAlign = 'center';
      [['eV', 0], ['keV', 3], ['MeV', 6], ['GeV', 9], ['TeV', 12]].forEach(function (u) { var x = X(u[1]); q.beginPath(); q.moveTo(x, y0); q.lineTo(x, y0 + 5); q.stroke(); q.fillText('1 ' + u[0], x, y0 + 16); });
      var righe = { quark: 0, leptone: 1, neutrino: 1, bosone: 2, higgs: 2 };
      MODELLO.forEach(function (p, k) {
        var lg = p.m > 0 ? Math.log10(p.m * 1e6) : lo + (p.s === 'g' ? 0.15 : 0.7), x = X(lg), y = 22 + righe[p.g] * ((y0 - 40) / 2.4);
        q.fillStyle = COLORI[p.g]; q.globalAlpha = k === sel ? 1 : 0.75;
        q.beginPath(); q.arc(x, y, k === sel ? 7 : 4.5, 0, 2 * Math.PI); q.fill(); q.globalAlpha = 1;
        if (p.g === 'neutrino') { q.strokeStyle = COLORI[p.g]; q.beginPath(); q.moveTo(x, y); q.lineTo(x - 14, y); q.stroke(); }
        q.fillStyle = k === sel ? '#ffffff' : '#c9d3df'; q.font = (k === sel ? 'bold 12px' : '11px') + ' system-ui';
        var alto = p.g === 'neutrino' ? (p.gen - 1) * 10 : p.s === 'W' ? 0 : p.s === 'Z' ? 11 : p.s === 'H' ? 22 : 0;
        q.fillText(p.s, x, y - 9 - alto);
      });
      q.fillStyle = '#8494a8'; q.textAlign = 'left'; q.font = '10px system-ui'; q.fillText(t('massa (scala logaritmica) · senza massa a sinistra', 'mass (log scale) · massless at the left'), x0, H - 2);
      cv.setAttribute('aria-label', t('masse delle particelle elementari su scala logaritmica', 'elementary particle masses on a log scale'));
    }
    function aggiorna() {
      var p = MODELLO[sel];
      carte.forEach(function (c, k) { c.style.borderColor = k === sel ? COLORI[MODELLO[k].g] : COLORI[MODELLO[k].g] + '55'; c.style.background = k === sel ? 'rgba(94,234,212,.10)' : '#0a1628'; });
      var GR = { quark: ['quark', 'quark'], leptone: ['leptone carico', 'charged lepton'], neutrino: ['neutrino', 'neutrino'], bosone: ['bosone di gauge', 'gauge boson'], higgs: ['bosone scalare', 'scalar boson'] };
      info.innerHTML = '<b style="color:' + COLORI[p.g] + ';font-size:1rem">' + p.s + ' · ' + F.tt(p.n) + '</b> (' + F.tt(GR[p.g]) + (p.gen ? ', ' + t('generazione ', 'generation ') + p.gen : '') + ')<br>' +
        t('massa ', 'mass ') + '<b class="bsiFX-num">' + (p.g === 'neutrino' ? '—' : unitaMassa(p.m)) + '</b> ' + p.err + '<br>' + t('carica ', 'charge ') + p.q + ' e · spin ' + p.spin + ' ħ · ' + t('interazioni: ', 'interactions: ') + F.tt(p.int) + ' · ' + t('scoperta ', 'discovered ') + p.anno + '<br><br>' +
        t('Dodici fermioni (spin ½) in tre generazioni identiche salvo la massa, quattro tipi di bosoni di gauge (spin 1) che mediano le interazioni, e il bosone di Higgs (spin 0) il cui campo dà massa a W, Z e ai fermioni. Le masse dei quark leggeri sono masse «correnti» MS̄ a 2 GeV: il protone (938 MeV) pesa circa cento volte i suoi tre quark, la sua massa viene quasi tutta dall’energia dei gluoni (E = mc²). Le oscillazioni dicono che i neutrini hanno massa, ma solo limiti superiori sono noti.',
          'Twelve fermions (spin ½) in three generations identical except for mass, four kinds of gauge bosons (spin 1) mediating the interactions, and the Higgs boson (spin 0) whose field gives mass to W, Z and the fermions. Light quark masses are MS̄ “current” masses at 2 GeV: the proton (938 MeV) weighs about a hundred times its three quarks, its mass comes almost entirely from gluon energy (E = mc²). Oscillations show neutrinos have mass, but only upper limits are known.');
      disegna();
    }
    aggiorna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. leggi di conservazione ═════════════════════════════════════════ */
  function schedaConservazione(div) {
    var G = griglia(div), st = { r: 0, T: 400 }, info = nota(G.pan);
    F.scelta(G.pan, ['Reazione o decadimento', 'Reaction or decay'], REAZIONI.map(function (r, k) { return [String(k), nomeReazione(r)]; }), '0', function (v) { st.r = +v; disegna(); });
    F.cursore(G.pan, ['energia cinetica del fascio T (MeV, solo urti)', 'beam kinetic energy T (MeV, collisions only)'], 0, 2000, 1, st.T, function (v) { st.T = v; disegna(); });
    var tab = F.el('table', { 'class': 'bsiFX-tab' }); G.pan.appendChild(tab);
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.55);
    function disegna() {
      var r = REAZIONI[st.r], o = controlla(r, st.T), righe = '<tr><th></th><th>' + t('prima', 'before') + '</th><th>' + t('dopo', 'after') + '</th><th></th></tr>';
      [['Q', 'Q'], ['B', 'B'], ['Le', 'Lₑ'], ['Lm', 'L_μ'], ['Lt', 'L_τ'], ['J', t('spin', 'spin')], ['S', t('stranezza', 'strangeness')]].forEach(function (g) {
        var v = o.grandezze[g[0]], ok = v[0] === v[1];
        righe += '<tr><td>' + g[1] + '</td><td>' + v[0] + '</td><td>' + v[1] + '</td><td class="' + (ok ? 'bsiFX-ok' : g[0] === 'S' ? '' : 'bsiFX-ko') + '">' + (ok ? '✓' : g[0] === 'S' ? (t('ΔS = ', 'ΔS = ') + (v[1] - v[0])) : '✗') + '</td></tr>';
      });
      tab.innerHTML = righe;
      var INT = { debole: ['debole', 'weak'], em: ['elettromagnetica', 'electromagnetic'], forte: ['forte', 'strong'] };
      info.innerHTML = '<b style="font-size:1rem">' + nomeReazione(r) + '</b><br>' + (o.permessa ? '<b class="bsiFX-ok">' + t('PERMESSA', 'ALLOWED') + '</b> · ' + t('interazione ', 'interaction ') + F.tt(INT[o.interazione]) : '<b class="bsiFX-ko">' + t('PROIBITA', 'FORBIDDEN') + '</b><br>' + o.motivi.map(function (m) { return '· ' + F.tt(m); }).join('<br>')) + '<br>' +
        (r.i.length === 1 ? 'Q = M − Σm = <b class="bsiFX-num">' + fmt(o.Qval) + ' MeV</b>' : '√s = <b class="bsiFX-num">' + fmt(o.rs) + ' MeV</b> · ' + t('soglia ', 'threshold ') + 'T = [(Σm_f)² − (m₁+m₂)²]/(2m₂) = <b class="bsiFX-num">' + fmt(o.soglia) + ' MeV</b>') + '<br>' +
        t('Carica, numero barionico e i tre numeri leptonici sono conservati in tutte le reazioni osservate (il decadimento del protone non è mai stato visto: τ_p > 10³⁴ anni; μ → eγ: BR < 3,1·10⁻¹³, MEG II). La stranezza si conserva nelle interazioni forte ed elettromagnetica, ma cambia di ±1 in quella debole. L’energia: un decadimento richiede M > Σm; un urto su bersaglio fisso ha bisogno di più energia cinetica della somma delle masse create, perché parte dell’energia resta come moto del centro di massa.',
          'Charge, baryon number and the three lepton numbers are conserved in all observed reactions (proton decay has never been seen: τ_p > 10³⁴ years; μ → eγ: BR < 3.1·10⁻¹³, MEG II). Strangeness is conserved by strong and electromagnetic interactions but changes by ±1 in weak ones. Energy: a decay needs M > Σm; a fixed-target collision needs more kinetic energy than the created masses, because part of it remains as centre-of-mass motion.');
      /* il bilancio energetico: a sinistra la massa iniziale (o √s), a destra le masse finali impilate */
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, Mi = r.i.length === 1 ? o.M : o.rs, top = Math.max(Mi, o.sommaFin) * 1.1 || 1, Y = function (v) { return H - 30 - v / top * (H - 60); }, bw = Math.min(110, W * 0.25);
      q.fillStyle = '#6bcfff'; q.globalAlpha = 0.5; q.fillRect(W * 0.2, Y(Mi), bw, Y(0) - Y(Mi)); q.globalAlpha = 1;
      q.font = '12px system-ui'; q.textAlign = 'center'; q.fillStyle = '#e6fffb';
      q.fillText((r.i.length === 1 ? 'M = ' : '√s = ') + fmt(Mi) + ' MeV', W * 0.2 + bw / 2, Y(Mi) - 6);
      var cum = 0, cols = ['#c9b9ff', '#5eead4', '#ffc45a', '#ff8a80'];
      r.f.forEach(function (k, j) { var m = PART[k].m; q.fillStyle = cols[j % 4]; q.globalAlpha = 0.6; q.fillRect(W * 0.6, Y(cum + m), bw, Math.max(1, Y(cum) - Y(cum + m))); q.globalAlpha = 1; if (Y(cum) - Y(cum + m) > 13) { q.fillStyle = '#081522'; q.fillText(PART[k].n, W * 0.6 + bw / 2, (Y(cum) + Y(cum + m)) / 2 + 4); } cum += m; });
      if (o.Qval > 0) { q.strokeStyle = '#ffd24a'; q.setLineDash([4, 3]); q.strokeRect(W * 0.6, Y(Mi), bw, Y(cum) - Y(Mi)); q.setLineDash([]); q.fillStyle = '#ffd24a'; q.fillText(t('cinetica ', 'kinetic ') + fmt(o.Qval) + ' MeV', W * 0.6 + bw / 2, Y(Mi) - 6); }
      else { q.fillStyle = '#ff8a80'; q.fillText(t('mancano ', 'missing ') + fmt(-o.Qval) + ' MeV', W * 0.6 + bw / 2, Y(cum) - 6); }
      q.fillStyle = '#9fb1c6'; q.fillText(t('prima', 'before'), W * 0.2 + bw / 2, H - 10); q.fillText(t('dopo: Σm = ', 'after: Σm = ') + fmt(o.sommaFin), W * 0.6 + bw / 2, H - 10);
      q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(20, Y(0)); q.lineTo(W - 10, Y(0)); q.stroke();
      cv.setAttribute('aria-label', t('bilancio energetico: massa iniziale contro masse finali', 'energy balance: initial mass versus final masses'));
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. massa invariante ═══════════════════════════════════════════════ */
  function schedaInvariante(div) {
    var G = griglia(div), st = { f: 0.25, res: 0, vel: 40, N: 20000, seme: 2024 }, info = nota(G.pan), gen, h, fit, ultimo, nfit = 0;
    F.cursore(G.pan, ['frazione di fondo', 'background fraction'], 0, 0.8, 0.05, st.f, function (v) { st.f = v; azzera(); }, function (v) { return Math.round(v * 100) + ' %'; });
    F.cursore(G.pan, ['risoluzione sull’impulso dei muoni', 'muon momentum resolution'], 0, 0.03, 0.002, st.res, function (v) { st.res = v; azzera(); }, function (v) { return (v * 100).toFixed(1) + ' %'; });
    F.cursore(G.pan, ['eventi per fotogramma', 'events per frame'], 5, 300, 5, st.vel, function (v) { st.vel = v; });
    F.bottone(G.pan, ['Nuovo seme', 'New seed'], function () { st.seme = (Math.random() * 1e9) | 0; azzera(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6);
    function azzera() { gen = generatore(st.seme, st.f, st.res); h = istogramma(); fit = null; ultimo = null; nfit = 0; if (ctl) ctl.sveglia(); }
    function testo(n) {
      info.innerHTML = t('Eventi ', 'Events ') + '<b class="bsiFX-num">' + n + '</b> / ' + st.N + (ultimo ? '<br>' + t('ultimo evento: ', 'last event: ') + 'μ⁺ (' + ultimo.mu[0].slice(1).map(function (v) { return v.toFixed(1); }).join(', ') + ') · μ⁻ (' + ultimo.mu[1].slice(1).map(function (v) { return v.toFixed(1); }).join(', ') + ') GeV → m = <b class="bsiFX-num">' + ultimo.m.toFixed(2) + ' GeV</b>' : '') +
        (fit ? '<br>' + t('fit: ', 'fit: ') + 'M = <b class="bsiFX-num">' + fit.M.toFixed(2) + ' GeV</b> · Γ = <b class="bsiFX-num">' + fit.G.toFixed(2) + ' GeV</b> (PDG: 91,188 · 2,4955)' : '') + '<br>' +
        t('Per ogni coppia di muoni si sommano i quadrivettori e m² = (E₁+E₂)² − |p₁+p₂|²: è lo stesso in ogni riferimento, quindi la massa della Z si legge anche se la Z si muove. Il segnale è una Breit–Wigner (Γ ≪ M, forma non relativistica) su un fondo Drell–Yan che cade; il fit (verosimiglianza di Poisson, simplesso di Nelder–Mead) dà posizione e larghezza. Con risoluzione finita la larghezza misurata è quella efficace, Breit–Wigner e gaussiana del rivelatore insieme: Γ esce più grande del vero.',
          'For each muon pair the four-vectors are added and m² = (E₁+E₂)² − |p₁+p₂|²: it is the same in every frame, so the Z mass can be read even though the Z moves. The signal is a Breit–Wigner (Γ ≪ M, non-relativistic form) on a falling Drell–Yan background; the fit (Poisson likelihood, Nelder–Mead simplex) gives position and width. With finite resolution the measured width is the effective one, Breit–Wigner and detector Gaussian combined: Γ comes out larger than the true value.');
    }
    var ctl = null; azzera();
    ctl = F.anima(cv, function (dt) {
      var n = 0, i; for (i = 0; i < NB; i++) n += h[i];
      if (dt > 0) for (i = 0; i < st.vel && n < st.N; i++, n++) { ultimo = gen(); riempi(h, ultimo.m); }
      if (n - nfit > 1500 || (n >= st.N && nfit < n)) { fit = adatta(h); nfit = n; }
      var w = (HMAX - HMIN) / NB, xs = [], ys = [], fx = [], fy = [];
      for (i = 0; i < NB; i++) { xs.push(HMIN + i * w, HMIN + (i + 1) * w); ys.push(h[i], h[i]); }
      var serie = [{ x: xs, y: ys, col: '#6bcfff', larg: 1.5, riempi: 'rgba(107,207,255,.25)', etich: [t('eventi', 'events'), 'events'] }];
      if (fit) { for (var m = HMIN; m <= HMAX; m += 0.25) { fx.push(m); fy.push(modello([fit.Ns, fit.M, fit.G, fit.Nb, fit.lam], m, w)); } serie.push({ x: fx, y: fy, col: '#ffc45a', larg: 2, etich: 'fit' }); }
      var ymax = 10; for (i = 0; i < NB; i++) ymax = Math.max(ymax, h[i] * 1.15);
      F.grafico(cv, { serie: serie, xmin: HMIN, xmax: HMAX, ymin: 0, ymax: ymax, xl: ['m(μ⁺μ⁻) (GeV)', 'm(μ⁺μ⁻) (GeV)'], yl: [t('eventi / 0,5 GeV', 'events / 0.5 GeV'), 'events / 0.5 GeV'], descr: ['istogramma della massa invariante dei due muoni', 'dimuon invariant mass histogram'], legenda: [{ col: '#6bcfff', etich: ['dati simulati', 'simulated data'] }, { col: '#ffc45a', etich: ['Breit–Wigner + fondo', 'Breit–Wigner + background'] }] });
      testo(n);
      if (n >= st.N && nfit >= n) return false;
    }, { ricomincia: azzera });
  }

  /* ═══ 4. vite medie relativistiche ══════════════════════════════════════ */
  var DUE = [
    ['pimu', 'π⁺ → μ⁺ ν_μ', 139.57039, M_MU, 0], ['kmu', 'K⁺ → μ⁺ ν_μ', 493.677, M_MU, 0], ['kpp', 'K⁺ → π⁺ π⁰', 493.677, 139.57039, 134.9768],
    ['lam', 'Λ → p π⁻', 1115.683, 938.27208816, 139.57039], ['pigg', 'π⁰ → γ γ', 134.9768, 0, 0], ['tau', 'τ⁻ → π⁻ ν_τ', 1776.93, 139.57039, 0],
    ['zmm', 'Z → μ⁺ μ⁻', 91188, M_MU, M_MU], ['hgg', 'H → γ γ', 125200, 0, 0]
  ];
  function schedaVite(div) {
    var G = griglia(div), st = { lgE: Math.log10(4000), h: 15, log: '1', d: 'pimu' }, info = nota(G.pan);
    F.cursore(G.pan, ['energia totale del muone', 'total muon energy'], Math.log10(150), 5, 0.01, st.lgE, function (v) { st.lgE = v; disegna(); }, function (v) { return unitaMassa(Math.pow(10, v)); });
    F.cursore(G.pan, ['quota di produzione (km)', 'production altitude (km)'], 5, 20, 0.5, st.h, function (v) { st.h = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.scelta(G.pan, ['Scala verticale', 'Vertical scale'], [['1', ['logaritmica', 'logarithmic']], ['0', ['lineare', 'linear']]], st.log, function (v) { st.log = v; disegna(); });
    F.scelta(G.pan, ['Decadimento a due corpi', 'Two-body decay'], DUE.map(function (d) { return [d[0], d[1]]; }), st.d, function (v) { st.d = v; disegna(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.55), cd = F.tela(G.dx, 0.32);
    function disegna() {
      var E = Math.pow(10, st.lgE), h = st.h * 1000, r = muoni(E, h), lg = st.log === '1', xs = [], y1 = [], y2 = [];
      for (var x = Math.log10(150); x <= 5.0001; x += 0.02) { var q = muoni(Math.pow(10, x), h); xs.push(x - 3); y1.push(lg ? Math.log10(Math.max(1e-300, q.conDil)) : q.conDil); y2.push(lg ? Math.log10(Math.max(1e-300, q.senzaDil)) : q.senzaDil); }
      F.grafico(cv, { serie: [{ x: xs, y: y1, col: '#5eead4', larg: 2.5, etich: [t('con dilatazione', 'with dilation'), 'with dilation'] }, { x: xs, y: y2, col: '#ff8a80', larg: 2, tratt: true, etich: [t('senza', 'without'), 'without'] }],
        punti: [{ x: st.lgE - 3, y: lg ? Math.log10(Math.max(1e-300, r.conDil)) : r.conDil, col: '#ffd24a', r: 5 }], xmin: Math.log10(0.15), xmax: 2, ymin: lg ? -12 : 0, ymax: lg ? 1.2 : 1.15,
        xl: ['log₁₀ E (GeV)', 'log₁₀ E (GeV)'], yl: [lg ? t('log₁₀ frazione sopravvissuta', 'log₁₀ surviving fraction') : t('frazione sopravvissuta', 'surviving fraction'), lg ? 'log₁₀ surviving fraction' : 'surviving fraction'], descr: ['sopravvivenza dei muoni cosmici al livello del mare', 'cosmic muon survival at sea level'],
        legenda: [{ col: '#5eead4', etich: ['con dilatazione dei tempi', 'with time dilation'] }, { col: '#ff8a80', etich: ['senza (fisica di Newton)', 'without (Newtonian)'] }] });
      var D = DUE.filter(function (d) { return d[0] === st.d; })[0], k = dueCorpi(D[2], D[3], D[4]);
      info.innerHTML = 'γ = E/mc² = <b class="bsiFX-num">' + fmt(r.gamma) + '</b> · β = ' + r.beta.toFixed(5) + ' · ' + t('cammino medio ', 'mean path ') + 'βγcτ = <b class="bsiFX-num">' + fmt(r.L / 1000) + ' km</b><br>' +
        t('tempo di volo nel laboratorio ', 'lab flight time ') + fmt(r.tLab * 1e6) + ' μs · ' + t('tempo proprio ', 'proper time ') + fmt(r.tProprio * 1e6) + ' μs<br>' + t('sopravvive con dilatazione ', 'survives with dilation ') + '<b class="bsiFX-num">' + fmt(r.conDil * 100) + ' %</b> · ' + t('senza ', 'without ') + fmt(r.senzaDil * 100) + ' %<br>' +
        t('Il muone (τ = 2,197 μs, m = 105,66 MeV) percorrerebbe in media solo cτ = 659 m: senza relatività quasi nessuno arriverebbe dai 15 km dove nasce. Nel suo riferimento il tempo scorre γ volte più lento (o, per lui, l’atmosfera è contratta di γ). Modello semplice: discesa verticale, nessuna perdita di energia per ionizzazione (~2 GeV in tutta l’atmosfera), nessuno spettro di produzione.', 'The muon (τ = 2.197 μs, m = 105.66 MeV) would travel on average only cτ = 659 m: without relativity almost none would arrive from the 15 km where it is born. In its frame time runs γ times slower (or, for it, the atmosphere is contracted by γ). Simple model: vertical descent, no ionisation energy loss (~2 GeV across the atmosphere), no production spectrum.') + '<br><br>' +
        '<b>' + D[1] + '</b>: p* = √{[M² − (m₁+m₂)²][M² − (m₁−m₂)²]}/2M = <b class="bsiFX-num">' + fmt(k.p) + ' MeV/c</b><br>E₁ = ' + fmt(k.E1) + ' MeV (T₁ = ' + fmt(k.T1) + ', β₁ = ' + k.b1.toFixed(4) + ') · E₂ = ' + fmt(k.E2) + ' MeV<br>' +
        t('Nel riferimento di quiete i due prodotti escono opposti con lo stesso impulso, fissato dalle sole masse: per questo nel decadimento β, a tre corpi, lo spettro dell’elettrone è continuo e Pauli dovette inventare il neutrino.', 'In the rest frame the two products fly apart back to back with the same momentum, fixed by the masses alone: this is why in three-body β decay the electron spectrum is continuous, and Pauli had to invent the neutrino.');
      var P = F.pennello(cd), q2 = P.q, W = P.W, H = P.H, cx = W / 2, cy = H / 2, L = Math.min(W * 0.4, 20 + 0.8 * W * 0.4 * Math.min(1, Math.log10(1 + k.p) / Math.log10(1 + 62600)) + 20);
      q2.fillStyle = '#ffd24a'; q2.beginPath(); q2.arc(cx, cy, 7, 0, 2 * Math.PI); q2.fill();
      [[1, '#5eead4', D[1].split('→')[1].trim().split(/\s+/)[0]], [-1, '#c9b9ff', D[1].split('→')[1].trim().split(/\s+/)[1]]].forEach(function (a) {
        var ex = cx + a[0] * L; q2.strokeStyle = a[1]; q2.lineWidth = 2.5; q2.beginPath(); q2.moveTo(cx + a[0] * 10, cy); q2.lineTo(ex, cy); q2.stroke();
        q2.fillStyle = a[1]; q2.beginPath(); q2.moveTo(ex + a[0] * 8, cy); q2.lineTo(ex, cy - 6); q2.lineTo(ex, cy + 6); q2.fill();
        q2.font = '13px system-ui'; q2.textAlign = 'center'; q2.fillText(a[2], ex, cy - 12);
      });
      q2.lineWidth = 1; q2.fillStyle = '#c9d3df'; q2.font = '12px system-ui'; q2.textAlign = 'center'; q2.fillText('p* = ' + fmt(k.p) + ' MeV/c', cx, H - 10);
      cd.setAttribute('aria-label', t('decadimento a due corpi nel riferimento di quiete', 'two-body decay in the rest frame'));
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ la scheda 3D (v238) ═══════════════════════════════════════════════
     Il pannello compare subito; la scena quando three.js e' pronto, costruita in un
     compito separato, cosi' il clic sulla scheda resta leggero. Nella barra della vista
     un tasto ferma e riavvia il moto; con «riduci movimento» la scena parte ferma. */
  function scheda3D(costruisci) {
    return function (div) {
      var g3 = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g3.appendChild(pan); g3.appendChild(destra); div.appendChild(g3);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        attesa.remove();
        var S = new L3.Scena(destra, 0.66);
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.etichetta)); S.ren.domElement.setAttribute('aria-label', F.tt(ctx.etichetta));
        tastoPausa(S);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function tastoPausa(S) {
    var MENO = false; try { MENO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
    S.fermo = MENO;
    var barra = S.box.querySelector('.bsi3d-barra'); if (!barra) return;
    var b = F.el('button', { type: 'button' });
    function aggiorna() { b.textContent = S.fermo ? '▶' : '❚❚'; var n = S.fermo ? t('Avvia il moto', 'Play the motion') : t('Ferma il moto', 'Pause the motion'); b.title = n; b.setAttribute('aria-label', n); b.setAttribute('aria-pressed', String(S.fermo)); }
    b.addEventListener('click', function (e) { e.stopPropagation(); S.fermo = !S.fermo; aggiorna(); if (!S.fermo) S.avvia(); });
    aggiorna(); barra.insertBefore(b, barra.firstChild);
  }
  function svuota(gr) {
    while (gr.children.length) { var o = gr.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); }
  }
  function puntaFreccia(T, fr, p, d) {
    var L = Math.hypot(d[0], d[1], d[2]); fr.visible = L > 0.03; if (!fr.visible) return;
    fr.position.set(p[0], p[1], p[2]); fr.setDirection(new T.Vector3(d[0] / L, d[1] / L, d[2] / L));
    var h = Math.min(0.25, L * 0.4); fr.setLength(L, h, h * 0.6);
  }

  /* ═══ 5. evento nel rivelatore 3D (v238) ══════════════════════════════ */
  var MMU = M_MU / 1000, ME = 0.51099895e-3;
  function schedaRivelatore(pan) {
    var st = { tipo: 'zmm', ris: 0, auto: true, seme: 238 }, cb = {}, ev = null, rnd = mulberry32(st.seme);
    F.scelta(pan, ['Evento', 'Event'], [['zmm', 'Z → μ⁺μ⁻'], ['zee', 'Z → e⁺e⁻'], ['hgg', 'H → γγ']], st.tipo, function (v) { st.tipo = v; nuovo(); });
    F.cursore(pan, ['risoluzione dei punti del tracciatore (μm)', 'tracker hit resolution (μm)'], 0, 300, 10, st.ris, function (v) { st.ris = v; nuovo(); });
    var ca = F.el('input', { type: 'checkbox' }); ca.checked = true; ca.addEventListener('change', function () { st.auto = ca.checked; });
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.86rem;color:#cfe3f7;cursor:pointer' }, [ca, F.el('span', { testo: t('un evento nuovo ogni 6 s', 'a new event every 6 s') })]));
    F.bottone(pan, ['Nuovo evento', 'New event'], function () { nuovo(); });
    var info = nota(pan), spiega = nota(pan);
    spiega.innerHTML = t('Un rivelatore cilindrico come CMS, in metri: il tracciatore al silicio (13 strati fino a 1,1 m), il calorimetro elettromagnetico (verde), quello adronico (arancio), il solenoide da 3,8 T e le camere per muoni nel ferro, dove il campo di ritorno è opposto e i muoni curvano dall’altra parte. Le particelle cariche percorrono eliche di raggio R = p_T/(0,3 B); i punti gialli sono i colpi sugli strati, da cui si ricostruisce il cerchio, quindi p_T e la carica, e dalla pendenza p_z. Elettroni e fotoni si fermano nel calorimetro elettromagnetico (torri di altezza ∝ energia), i pioni dell’evento sottostante nell’adronico; i più lenti si arrotolano nel tracciatore. Dai due quadrivettori ricostruiti la massa invariante: quella della Z o dell’Higgs.',
      'A cylindrical detector like CMS, in metres: the silicon tracker (13 layers up to 1.1 m), the electromagnetic calorimeter (green), the hadronic one (orange), the 3.8 T solenoid and the muon chambers in the iron, where the return field is reversed and muons bend the other way. Charged particles follow helices of radius R = p_T/(0.3 B); the yellow dots are the hits on the layers, from which the circle is rebuilt, giving p_T and the charge, and from the slope p_z. Electrons and photons stop in the electromagnetic calorimeter (towers of height ∝ energy), the pions of the underlying event in the hadronic one; the slowest curl up in the tracker. From the two reconstructed four-vectors, the invariant mass: that of the Z or the Higgs.');
    function gaussR() { return gauss(rnd); }
    function nuovo() {
      var prim = [], i;
      if (st.tipo === 'hgg') { var f = eventoHgg(rnd); prim = f.map(function (p) { return { p4: p, q: 0, tipo: 'gamma', m: 0 }; }); }
      else { var e; do { e = generatore((rnd() * 1e9) | 0, 0, 0)(); } while (Math.abs(e.m - MZ) > 6); var el = st.tipo === 'zee'; prim = e.mu.map(function (p, j) { var m = el ? ME : MMU, q4 = [Math.sqrt(m * m + p[1] * p[1] + p[2] * p[2] + p[3] * p[3]), p[1], p[2], p[3]]; return { p4: q4, q: j ? -1 : 1, tipo: el ? 'e' : 'mu', m: m }; }); }
      var vero = massa(somma4(prim[0].p4, prim[1].p4));
      /* l'evento sottostante: pioni carichi lenti */
      var sotto = []; for (i = 0; i < 14; i++) { var pT = 0.25 + 1.6 * rnd() * rnd(), ph = 2 * Math.PI * rnd(), eta = (rnd() - 0.5) * 3, pz = pT * Math.sinh(eta), m = 0.13957; sotto.push({ p4: [Math.sqrt(m * m + pT * pT + pz * pz), pT * Math.cos(ph), pT * Math.sin(ph), pz], q: rnd() < 0.5 ? 1 : -1, tipo: 'pi', m: m }); }
      var tutte = prim.concat(sotto);
      tutte.forEach(function (P) {
        P.tr = traccia(P.p4, P.q, P.tipo);
        if (st.ris > 0) P.tr.colpi = P.tr.colpi.map(function (c) { var r = Math.hypot(c[0], c[1]), d = st.ris * 1e-6 * gaussR(); return [c[0] - c[1] / r * d, c[1] + c[0] / r * d, c[2] + st.ris * 1e-6 * gaussR(), c[3]]; });
        P.rec = P.q ? ricostruisci(P.tr.colpi, P.m) : (P.tr.impatto ? (function () { var x = P.tr.impatto, d = Math.hypot(x[0], x[1], x[2]), E = P.p4[0]; return { q: 0, pT: E * Math.hypot(x[0], x[1]) / d, p4: [E, E * x[0] / d, E * x[1] / d, E * x[2] / d] }; })() : null);
      });
      var r0 = prim[0].rec, r1 = prim[1].rec, mrec = r0 && r1 ? massa(somma4(r0.p4, r1.p4)) : NaN;
      ev = { tutte: tutte, prim: prim, vero: vero, mrec: mrec };
      var nomi = st.tipo === 'hgg' ? ['γ', 'γ'] : st.tipo === 'zee' ? ['e⁺', 'e⁻'] : ['μ⁺', 'μ⁻'];
      info.innerHTML = prim.map(function (P, j) { var pTv = Math.hypot(P.p4[1], P.p4[2]), eta = Math.asinh(P.p4[3] / pTv); return '<b>' + nomi[j] + '</b>: p_T ' + t('vero ', 'true ') + fmt(pTv) + ' GeV, η = ' + eta.toFixed(2) + (P.rec ? ' · ' + t('ricostruito ', 'reconstructed ') + '<b class="bsiFX-num">' + fmt(P.rec.pT) + '</b> GeV' + (P.q ? ' (q = ' + (P.rec.q > 0 ? '+' : '−') + '1' + (P.rec.q === P.q ? ' ✓' : ' ✗') + ', R = ' + fmt(P.rec.R) + ' m)' : t(' (energia dal calorimetro)', ' (energy from the calorimeter)')) : t(' · fuori dall’accettanza', ' · outside acceptance')); }).join('<br>') +
        '<br>' + t('Massa invariante ricostruita ', 'Reconstructed invariant mass ') + '<b class="bsiFX-num">' + (isFinite(mrec) ? fmt(mrec) + ' GeV' : '—') + '</b> · ' + t('vera ', 'true ') + fmt(vero) + ' GeV' + (st.ris > 0 ? t(' (con ', ' (with ') + st.ris + t(' μm di risoluzione la misura si allarga)', ' μm resolution the measurement spreads)') : '');
      if (cb.nuovo) cb.nuovo();
    }
    nuovo();
    return {
      etichetta: ['Evento in un rivelatore di particelle 3D con tracce curve nel campo magnetico e calorimetri', 'Event in a 3D particle detector with tracks curving in the magnetic field and calorimeters'],
      tre: function (S, T, L3) {
        /* ogni strato: tre anelli (estremi e centro), tutti in un solo oggetto (pochi disegni per fotogramma);
           un velo appena visibile solo per calorimetri e solenoide, per non coprire le tracce */
        var anP = [], anC = [], cc = new T.Color();
        function cil(r, l, col, op, velo) {
          if (velo) { var m = new T.Mesh(new T.CylinderGeometry(r, r, l, 64, 1, true), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op * 0.35, side: T.DoubleSide, depthWrite: false })); m.rotation.x = Math.PI / 2; S.aggiungi(m); }
          cc.setHex(col).multiplyScalar(Math.min(1, 0.25 + op * 6));
          [-l / 2, 0, l / 2].forEach(function (z) { for (var k = 0; k < 64; k++) { var a = 2 * Math.PI * k / 64, b = 2 * Math.PI * (k + 1) / 64; anP.push(r * Math.cos(a), r * Math.sin(a), z, r * Math.cos(b), r * Math.sin(b), z); anC.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b); } });
        }
        RIV.strati.forEach(function (r) { cil(r, 5.4, 0x9fb1c6, 0.035); });
        cil(RIV.rEcal, 6, 0x5eead4, 0.07, true); cil(1.75, 6.4, 0x5eead4, 0.05); cil(RIV.rHcal, 8, 0xffb36b, 0.06, true); cil(2.95, 9, 0xffb36b, 0.04); cil(RIV.rSol, 12, 0xc9d3df, 0.08, true);
        RIV.rMu.forEach(function (r) { cil(r, 12, 0xff6b6b, 0.035); });
        var gA = new T.BufferGeometry(); gA.setAttribute('position', new T.Float32BufferAttribute(anP, 3)); gA.setAttribute('color', new T.Float32BufferAttribute(anC, 3));
        S.aggiungi(new T.LineSegments(gA, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 })));
        S.aggiungi(L3.linea(T, [[0, 0, -6.5], [0, 0, 6.5]], 0x6bcfff, 0.5));
        var eB = L3.testo3d(T, 'B = 3,8 T', '#6bcfff', 0.4); eB.position.set(0.3, 0, 6.3); S.aggiungi(eB);
        var gr = new T.Group(); S.aggiungi(gr);
        var linee = [], tP = 0, COL = { mu: 0xff6b6b, e: 0x5eead4, gamma: 0xffd24a, pi: 0x8494a8 };
        cb.nuovo = function () {
          svuota(gr); linee = []; tP = 0;
          ev.tutte.forEach(function (P, j) {
            var pts = P.tr.pts, g = new T.BufferGeometry(), arr = new Float32Array(pts.length * 3);
            pts.forEach(function (q, k) { arr[3 * k] = q[0]; arr[3 * k + 1] = q[1]; arr[3 * k + 2] = q[2]; });
            g.setAttribute('position', new T.BufferAttribute(arr, 3)); g.setDrawRange(0, 0);
            var mat = P.tipo === 'gamma' ? new T.LineDashedMaterial({ color: COL.gamma, dashSize: 0.15, gapSize: 0.08 }) : new T.LineBasicMaterial({ color: COL[P.tipo], transparent: P.tipo === 'pi', opacity: P.tipo === 'pi' ? 0.55 : 1 }), l, n = pts.length;
            if (j < 2) {
              /* le due particelle dell'evento: un tubo, che si rivela per tratti come la linea */
              var cu = new T.CatmullRomCurve3(pts.filter(function (q, k) { return k % 3 === 0 || k === pts.length - 1; }).map(function (q) { return new T.Vector3(q[0], q[1], q[2]); })), seg = Math.min(600, pts.length);
              var tg = new T.TubeGeometry(cu, seg, P.tipo === 'gamma' ? 0.015 : 0.03, 6, false); l = new T.Mesh(tg, new T.MeshBasicMaterial({ color: COL[P.tipo] })); n = tg.index.count; tg.setDrawRange(0, 0);
            } else l = new T.Line(g, mat);
            if (l.isLine && P.tipo === 'gamma') l.computeLineDistances(); gr.add(l); linee.push([l, n, P]);
            if (j < 2 && P.q) { var cp = []; P.tr.colpi.forEach(function (c) { cp.push(c[0], c[1], c[2]); }); var gc = new T.BufferGeometry(); gc.setAttribute('position', new T.Float32BufferAttribute(cp, 3)); var pc = new T.Points(gc, new T.PointsMaterial({ color: 0xffd24a, size: 0.07 })); pc.visible = false; gr.add(pc); linee[linee.length - 1].push(pc); }
            /* il deposito nel calorimetro: una torre radiale di altezza ∝ log E */
            if (P.tr.impatto && (P.tipo === 'e' || P.tipo === 'gamma' || P.tipo === 'pi')) {
              var x = P.tr.impatto, r = Math.hypot(x[0], x[1]), E = P.p4[0], h = Math.max(0.05, Math.min(1.2, 0.3 * Math.log(1 + E))), box = new T.Mesh(new T.BoxGeometry(0.12, 0.12, h), new T.MeshStandardMaterial({ color: P.tipo === 'pi' ? 0xffb36b : 0x5eead4, emissive: P.tipo === 'pi' ? 0xffb36b : 0x5eead4, emissiveIntensity: 0.5 }));
              box.position.set(x[0] + x[0] / r * h / 2, x[1] + x[1] / r * h / 2, x[2]); box.lookAt(x[0] * 3, x[1] * 3, x[2]); box.visible = false; gr.add(box); linee[linee.length - 1][4] = box;
            }
          });
          S.didascalia.textContent = (st.tipo === 'hgg' ? 'H → γγ' : st.tipo === 'zee' ? 'Z → e⁺e⁻' : 'Z → μ⁺μ⁻') + ' · m = ' + (isFinite(ev.mrec) ? ev.mrec.toFixed(2) : '—') + ' GeV';
          mostra(S.fermo ? 1 : 0); S.sporca = true; S.avvia();
        };
        function mostra(f) {
          linee.forEach(function (L) { var c = Math.round(L[1] * Math.min(1, f)); if (L[0].isMesh) c -= c % 3; L[0].geometry.setDrawRange(0, Math.max(0, c)); if (L[3]) L[3].visible = f >= 0.4; if (L[4]) L[4].visible = f >= 1; });
        }
        cb.nuovo();
        S.ogniFotogramma(function (dt) {
          if (S.fermo) return false;
          tP += dt; mostra(tP / 1.8);
          if (tP > 6 && st.auto) nuovo();
          return true;
        });
        S.inquadra(17, -0.8, 0.6);
      }
    };
  }

  F.sezione('sfispart', {
    titolo: ['⚛️ Fisica delle particelle', '⚛️ Particle physics'],
    sotto: ['Il Modello Standard con le masse PDG, le leggi di conservazione che permettono o proibiscono una reazione, la massa invariante che fa emergere il picco della Z da eventi simulati, la dilatazione dei tempi che porta i muoni cosmici fino al suolo.', 'The Standard Model with PDG masses, the conservation laws that allow or forbid a reaction, the invariant mass that brings out the Z peak from simulated events, the time dilation that brings cosmic muons down to the ground.'],
    schede: [
      { nome: ['🧩 Modello Standard', '🧩 Standard Model'], costruisci: schedaModello },
      { nome: ['⚖️ Conservazione', '⚖️ Conservation'], costruisci: schedaConservazione },
      { nome: ['📊 Massa invariante', '📊 Invariant mass'], costruisci: schedaInvariante },
      { nome: ['⏱️ Vite medie', '⏱️ Lifetimes'], costruisci: schedaVite },
      { nome: ['🔭 Rivelatore 3D', '🔭 3D detector'], costruisci: scheda3D(schedaRivelatore) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
