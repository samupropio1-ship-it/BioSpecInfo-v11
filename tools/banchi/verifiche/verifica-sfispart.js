/* verifica di bsi-fis-particelle.js (F.calcolo.particelle) */
var C = require('./carica.js')(['bsi-fis-particelle.js']), P = C.particelle;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

/* 1. invarianza del quadrivettore sotto spinte qualsiasi (200 casi), e composizione inversa */
var rnd = mulberry32(5), maxd = 0, maxr = 0;
for (var i = 0; i < 200; i++) {
  var m = 0.1 + 100 * rnd(), p = [(rnd() - .5) * 200, (rnd() - .5) * 200, (rnd() - .5) * 200], E = Math.sqrt(m * m + p[0] * p[0] + p[1] * p[1] + p[2] * p[2]), v = [E, p[0], p[1], p[2]];
  var b = [(rnd() - .5), (rnd() - .5), (rnd() - .5)], bb = Math.hypot(b[0], b[1], b[2]), s = 0.99 * rnd() / bb; b = b.map(function (x) { return x * s; });
  var w = P.spinta(v, b[0], b[1], b[2]); maxd = Math.max(maxd, Math.abs(P.massa(w) - m) / m);
  var back = P.spinta(w, -b[0], -b[1], -b[2]); maxr = Math.max(maxr, Math.abs(back[0] - E) / E);
}
ok('invarianza di m sotto spinte (max errore relativo)', maxd.toExponential(2), maxd < 1e-9);
ok('spinta(β) poi spinta(−β) = identità', maxr.toExponential(2), maxr < 1e-9);
/* spinta lungo z: E' = γ(E + βpz) confronto con formula a mano */
var w1 = P.spinta([10, 1, 2, 3], 0, 0, 0.6), g = 1.25;
ok('spinta lungo z: E′ = γ(E + βp_z) = 14.75', w1[0].toFixed(6), Math.abs(w1[0] - g * (10 + 0.6 * 3)) < 1e-12 && Math.abs(w1[3] - g * (3 + 0.6 * 10)) < 1e-12);

/* 2. decadimento a due corpi */
var pi = P.dueCorpi(139.57039, 105.6583755, 0);
ok('π⁺ → μ⁺ν: p* = 29,79 MeV/c', pi.p.toFixed(3), Math.abs(pi.p - 29.79) < 0.005);
ok('π⁺ → μ⁺ν: T_μ = 4,12 MeV', pi.T1.toFixed(3), Math.abs(pi.T1 - 4.12) < 0.01);
var k = P.dueCorpi(493.677, 105.6583755, 0); ok('K⁺ → μ⁺ν: p* = 235,5 MeV/c', k.p.toFixed(2), Math.abs(k.p - 235.53) < 0.05);
var l = P.dueCorpi(1115.683, 938.27208816, 139.57039); ok('Λ → pπ⁻: p* = 101 MeV/c (PDG 101)', l.p.toFixed(2), Math.abs(l.p - 101) < 0.5);
ok('E₁ + E₂ = M (Λ)', (l.E1 + l.E2).toFixed(6), Math.abs(l.E1 + l.E2 - 1115.683) < 1e-9);

/* 3. soglia di p + p → p + p + π⁰ su bersaglio fisso e controllo con √s */
var mp = 938.27208816, mpi = 134.9768, T = P.soglia(mp, mp, 2 * mp + mpi);
ok('soglia pp → ppπ⁰: T = 279,7 MeV', T.toFixed(2), Math.abs(T - 279.7) < 0.1);
ok('√s alla soglia = 2m_p + m_π⁰', (P.radiceS(mp, mp, T) - 2 * mp - mpi).toExponential(2), Math.abs(P.radiceS(mp, mp, T) - 2 * mp - mpi) < 1e-9);
var Tas = P.soglia(139.57039, mp, 497.611 + 1115.683);
/* secondo metodo: dall'invariante s = m₁² + m₂² + 2 m₂ E₁ risolto per E₁ alla soglia √s = m_K + m_Λ */
var sth = Math.pow(497.611 + 1115.683, 2), E1 = (sth - 139.57039 * 139.57039 - mp * mp) / (2 * mp);
ok('soglia π⁻p → K⁰Λ = (s_soglia − m₁² − m₂²)/2m₂ − m₁ (≈ 768 MeV, p_π ≈ 0,897 GeV/c)', Tas.toFixed(2) + ' MeV, p = ' + Math.sqrt(Math.pow(Tas + 139.57039, 2) - 139.57039 * 139.57039).toFixed(1), Math.abs(Tas - (E1 - 139.57039)) < 1e-9 && Math.abs(Math.sqrt(E1 * E1 - 139.57039 * 139.57039) - 896.7) < 0.5);

/* 4. il controllore delle conservazioni sull'elenco */
var atteso = { beta: true, pdec: false, mudec: true, pimu: true, pi0gg: true, kpipi: true, lam: true, pppi0: true, npe: false, betanu: false, meg: false, pnbeta: false, assoc: true, gee: false, ppbar: true };
var tutti = true, righe = [];
P.REAZIONI.forEach(function (r) {
  var o = P.controlla(r, r.id === 'assoc' ? 900 : 400);
  righe.push(P.nomeReazione(r) + ': ' + (o.permessa ? 'permessa' : 'proibita') + ' [' + o.interazione + '] Q=' + o.Qval.toFixed(3) + (o.motivi.length ? ' — ' + o.motivi.map(function (m) { return m[0]; }).join('; ') : ''));
  if (o.permessa !== atteso[r.id]) tutti = false;
});
console.log('    ' + righe.join('\n    '));
ok('controllore: 15 reazioni classificate come atteso', tutti, tutti);
var b = P.controlla(P.REAZIONI[0]); ok('n → p e⁻ ν̄ₑ: Q = 0,782 MeV', b.Qval.toFixed(4), Math.abs(b.Qval - 0.7823) < 0.0005);
var pd = P.controlla(P.REAZIONI[1]); ok('p → e⁺γ viola B e Lₑ (2 motivi), carica ok', pd.motivi.length + ' motivi', pd.motivi.length === 2 && pd.grandezze.Q[0] === pd.grandezze.Q[1]);
var np = P.controlla(P.REAZIONI[8]); ok('n → p e⁻ viola Lₑ e momento angolare', np.motivi.length, np.motivi.length === 2);
var pp1 = P.controlla(P.REAZIONI[7], 270), pp2 = P.controlla(P.REAZIONI[7], 290);
ok('pp → ppπ⁰ proibita a 270 MeV, permessa a 290 MeV', pp1.permessa + '/' + pp2.permessa, !pp1.permessa && pp2.permessa);
ok('K⁺ → π⁺π⁰: Q = 219,1 MeV, debole', P.controlla(P.REAZIONI[5]).Qval.toFixed(2), Math.abs(P.controlla(P.REAZIONI[5]).Qval - 219.13) < 0.01 && P.controlla(P.REAZIONI[5]).interazione === 'debole');

/* 5. picco della Z ritrovato dal fit */
function prova(seme, f, res, N) { var gen = P.generatore(seme, f, res), h = P.istogramma(); for (var i = 0; i < N; i++) P.riempi(h, gen().m); return P.adatta(h); }
var fz = prova(2024, 0.25, 0, 20000), hh = P.istogramma(), gg = P.generatore(1, 0.25, 0); for (var j = 0; j < 20000; j++) P.riempi(hh, gg().m); var t0 = Date.now(); P.adatta(hh); var dtf = Date.now() - t0;
ok('fit Z (20000 ev., 25 % fondo): M = 91,19 ± 0,1 GeV', fz.M.toFixed(3), Math.abs(fz.M - 91.188) < 0.1);
ok('fit Z: Γ = 2,50 ± 10 %', fz.G.toFixed(3), Math.abs(fz.G - 2.4955) / 2.4955 < 0.1);
ok('fit Z: frazione di fondo ritrovata (in 60–120 GeV)', (fz.Nb / (fz.Ns + fz.Nb)).toFixed(3), Math.abs(fz.Nb / (fz.Ns + fz.Nb) - 0.25) < 0.05);
var fz2 = prova(77, 0.5, 0, 20000); ok('fit Z con altro seme e 50 % fondo: M', fz2.M.toFixed(3) + ' Γ ' + fz2.G.toFixed(3), Math.abs(fz2.M - 91.188) < 0.15 && Math.abs(fz2.G - 2.4955) < 0.35);
var fz3 = prova(9, 0.25, 0.02, 20000); ok('con risoluzione 2 %: Γ efficace > Γ vero, M ancora giusta', fz3.M.toFixed(3) + ' Γ ' + fz3.G.toFixed(3), fz3.G > 2.6 && Math.abs(fz3.M - 91.188) < 0.2);
ok('tempo di un fit < 100 ms', dtf + ' ms', dtf < 100);
/* massa ricostruita = massa generata senza risoluzione */
var gen = P.generatore(3, 0, 0), md = 0; for (i = 0; i < 1000; i++) { var e = gen(); md = Math.max(md, Math.abs(e.m - e.vero)); }
ok('massa invariante dai due muoni = massa generata', md.toExponential(2), md < 1e-9);

/* 6. muoni cosmici */
var mu = P.muoni(4000, 15000);
ok('E = 4 GeV: γ = 37,86, βγcτ = 24,9 km', mu.gamma.toFixed(2) + ', ' + (mu.L / 1000).toFixed(2), Math.abs(mu.gamma - 37.858) < 0.01 && Math.abs(mu.L / 1000 - 24.93) < 0.05);
ok('sopravvivenza con dilatazione = e^(−h/βγcτ)', mu.conDil.toFixed(4), Math.abs(mu.conDil - Math.exp(-15000 / mu.L)) < 1e-6);
ok('senza dilatazione ≈ 1,2·10⁻¹⁰', mu.senzaDil.toExponential(2), mu.senzaDil < 1e-9 && mu.senzaDil > 1e-11);
ok('rapporto dei logaritmi = γ', (Math.log(mu.senzaDil) / Math.log(mu.conDil)).toFixed(4), Math.abs(Math.log(mu.senzaDil) / Math.log(mu.conDil) - mu.gamma) < 1e-6);

console.log('\n' + (n - ko) + '/' + n + ' controlli superati');
process.exit(ko ? 1 : 0);
