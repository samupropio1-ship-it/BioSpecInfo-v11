/* ═══════════════════════════════════════════════════════════════════════
   bsi-inorganica-quantum-dati.js — ⚗️ Inorganica quantistica: i solutori (v268)
   BioSpecInfo · © Samuele Pio Provenzano

   Quattro motori di calcolo della chimica inorganica avanzata, tutti
   verificabili dal banco test_inorganica senza browser:

   1. SLATER — le regole di Slater (standard, Slater 1930): costante di
      schermo σ, carica nucleare efficace ζ = Z − σ, numero quantico
      efficace n*, raggio più probabile e raggio medio idrogenoidi, e la
      forma angolare |Y_lm|² con l'angolo del massimo. Dove un esame usa
      numeri non standard, qui si tiene la regola corretta e la si dichiara.
   2. HÜCKEL — il metodo variazionale / determinante secolare: autovalori e
      autovettori NORMALIZZati della matrice di Hückel (diagonalizzazione di
      Jacobi), riempimento con la regola di Hund, energia π totale ed
      energia di delocalizzazione, per sistemi omo- ed eteronucleari.
   3. SALC — combinazioni adattate alla simmetria con SOGLIA energetica:
      confronta le energie degli orbitali ns/np/nd dell'atomo centrale e dei
      leganti, filtra le interazioni σ e π sotto ΔE_cut e conta orbitali
      leganti, antileganti e di non legame.
   4. COMPLESSI — la tripla teoria VBT + CFT + LFT: ibridazione, EAN,
      splitting Δo/Δt/Δsp, alto/basso spin, CFSE, Jahn–Teller, μ di spin,
      carattere σ/π-donatore o π-accettore.

   ONESTA': le energie orbitali in eV sono valori di letteratura
   (ordini di grandezza, stile VSIP/Hartree–Fock); i raggi vengono dalle
   formule idrogenoidi con ζ e n* di Slater; i numeri marcati INDICATIVO
   sono tali. I metodi sono quelli dei testi (Slater, Hückel, Ballhausen),
   non calcoli ab initio.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var A0_PM = 52.917721;   /* raggio di Bohr in pm */

  /* ═══ tabella delle energie orbitali di valenza (eV) e configurazioni ═══ */
  var EO = {
    H:  { n: 1, Z: 1,  ns: -13.6, np: null,  nd: null, vE: 1, conf: '1s¹' },
    Li: { n: 2, Z: 3,  ns: -5.4,  np: -3.5,  nd: null, vE: 1, conf: '[He] 2s¹' },
    Be: { n: 2, Z: 4,  ns: -9.3,  np: -6.0,  nd: null, vE: 2, conf: '[He] 2s²' },
    B:  { n: 2, Z: 5,  ns: -14.0, np: -8.3,  nd: null, vE: 3, conf: '[He] 2s² 2p¹' },
    C:  { n: 2, Z: 6,  ns: -19.4, np: -10.7, nd: null, vE: 4, conf: '[He] 2s² 2p²' },
    N:  { n: 2, Z: 7,  ns: -25.6, np: -13.2, nd: null, vE: 5, conf: '[He] 2s² 2p³' },
    O:  { n: 2, Z: 8,  ns: -32.4, np: -15.9, nd: null, vE: 6, conf: '[He] 2s² 2p⁴' },
    F:  { n: 2, Z: 9,  ns: -40.2, np: -18.7, nd: null, vE: 7, conf: '[He] 2s² 2p⁵' },
    Na: { n: 3, Z: 11, ns: -5.1,  np: -3.0,  nd: null, vE: 1, conf: '[Ne] 3s¹' },
    Si: { n: 3, Z: 14, ns: -17.3, np: -9.2,  nd: -1.4, vE: 4, conf: '[Ne] 3s² 3p²' },
    P:  { n: 3, Z: 15, ns: -18.7, np: -14.0, nd: -1.4, vE: 5, conf: '[Ne] 3s² 3p³' },
    S:  { n: 3, Z: 16, ns: -20.7, np: -11.6, nd: -1.4, vE: 6, conf: '[Ne] 3s² 3p⁴' },
    Cl: { n: 3, Z: 17, ns: -25.3, np: -13.7, nd: -1.5, vE: 7, conf: '[Ne] 3s² 3p⁵' },
    Se: { n: 4, Z: 34, ns: -20.8, np: -10.8, nd: -1.7, vE: 6, conf: '[Ar] 3d¹⁰ 4s² 4p⁴' },
    Br: { n: 4, Z: 35, ns: -24.1, np: -12.5, nd: -1.4, vE: 7, conf: '[Ar] 3d¹⁰ 4s² 4p⁵' },
    I:  { n: 5, Z: 53, ns: -20.6, np: -11.0, nd: -1.4, vE: 7, conf: '[Kr] 4d¹⁰ 5s² 5p⁵' },
    Xe: { n: 5, Z: 54, ns: -23.4, np: -12.1, nd: -2.0, vE: 8, conf: '[Kr] 4d¹⁰ 5s² 5p⁶' }
  };

  /* ═══ 1 · SLATER (regole standard) ═══════════════════════════════════════
     Gruppi: [1s] [2s,2p] [3s,3p] [3d] [4s,4p] [4d] [4f] [5s,5p] [5d] [5f] …
     Per un elettrone s o p: stesso gruppo 0,35 (0,30 per 1s); (n−1) → 0,85;
     ≤ n−2 → 1,00. Per un elettrone d o f: stesso gruppo 0,35; tutti gli
     interni → 1,00. n*: 1,2,3 → 1,2,3; 4 → 3,7; 5 → 4,0; 6 → 4,2; 7 → 4,3. */
  var GRUPPI = [['1s', 1, 2], ['2s2p', 2, 8], ['3s3p', 3, 8], ['3d', 3, 10], ['4s4p', 4, 8], ['4d', 4, 10], ['4f', 4, 14], ['5s5p', 5, 8], ['5d', 5, 10], ['5f', 5, 14], ['6s6p', 6, 8]];
  var NSTAR = { 1: 1, 2: 2, 3: 3, 4: 3.7, 5: 4.0, 6: 4.2, 7: 4.3 };
  /* le sottolivello (n, l, capienza) in ordine di riempimento di Madelung (n+l, poi n):
     così il 4f resta VUOTO per I e Xe, e gli elettroni vanno su 5s5p come nella realtà */
  var MADELUNG = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2], [6, 1], [7, 0], [5, 3], [6, 2]];
  var CAP = [2, 6, 10, 14];
  function etichetta(n, l) { return n + 'spdf'.charAt(l); }
  function gruppoDi(n, l) { if (n === 1) return '1s'; if (l <= 1) return n + 's' + n + 'p'; return etichetta(n, l); }
  /** l'occupazione raggruppata alla Slater, costruita dal riempimento reale (Madelung) */
  function occupazione(Z) {
    var rem = Z, sub = {};
    for (var i = 0; i < MADELUNG.length && rem > 0; i++) { var n = MADELUNG[i][0], l = MADELUNG[i][1], e = Math.min(rem, CAP[l]); rem -= e; var k = gruppoDi(n, l); sub[k] = sub[k] || { et: k, n: n, e: 0, d: l >= 2 }; sub[k].e += e; }
    return Object.keys(sub).map(function (k) { return sub[k]; }).sort(function (a, b) { return a.n - b.n || (a.d ? 1 : 0) - (b.d ? 1 : 0); });
  }
  /** σ di Slater per l'elettrone di valenza (l'ultimo gruppo riempito) o per un gruppo scelto */
  function slater(Z, quale) {
    var occ = occupazione(Z), idx = quale == null ? occ.length - 1 : quale; if (idx < 0 || idx >= occ.length) idx = occ.length - 1;
    var g0 = occ[idx], sigma = 0, è1s = g0.et === '1s';
    for (var i = 0; i < occ.length; i++) { var s = occ[i];
      if (i === idx) sigma += (s.e - 1) * (è1s ? 0.30 : 0.35);
      else if (i > idx) continue;                                   /* i gruppi più esterni non schermano */
      else if (g0.d) sigma += s.e * 1.00;                           /* per d/f: tutti gli interni 1,00 */
      else if (s.n === g0.n) sigma += s.e * 0.35;                   /* stesso n (altro s/p nello stesso gruppo non c'è, ma per sicurezza) */
      else if (s.n === g0.n - 1) sigma += s.e * 0.85;
      else sigma += s.e * 1.00;
    }
    var nst = NSTAR[g0.n] || g0.n, zeta = Math.max(0.05, Z - sigma);
    return { Z: Z, gruppo: g0.et, n: g0.n, nStar: nst, sigma: arr(sigma, 2), zeta: arr(zeta, 2) };
  }
  /** raggi idrogenoidi (a0) per lo stato (n*, l) con carica efficace ζ:
      r_mp (massimo di r²R²) e <r> = (n*²/ζ)·(1 + ½(1 − l(l+1)/n*²)) */
  function raggi(nStar, zeta, l) {
    l = l || 0; var rmedio = (nStar * nStar / zeta) * (1 + 0.5 * (1 - l * (l + 1) / (nStar * nStar)));
    /* per l = n−1 (orbitale «senza nodi radiali») r_mp = n*²/ζ esatto; altrimenti approssimazione idrogenoide */
    var rmp = (nStar * nStar) / zeta;
    return { rmp_a0: arr(rmp, 3), rmp_pm: arr(rmp * A0_PM, 1), rmedio_a0: arr(rmedio, 3), rmedio_pm: arr(rmedio * A0_PM, 1) };
  }
  /** l'elemento completo: σ, ζ, raggi dell'orbitale di valenza (l dedotto: s→0, p→1) */
  function elemento(sym, l) {
    var e = EO[sym]; if (!e) return null; var sl = slater(e.Z); if (l == null) l = (/p/.test(sl.gruppo) && e.np != null && e.vE > (sl.n === e.n ? 2 : 0)) ? 1 : 0;
    var R = raggi(sl.nStar, sl.zeta, l);
    return { sym: sym, Z: e.Z, conf: e.conf, gruppo: sl.gruppo, l: l, sigma: sl.sigma, zeta: sl.zeta, nStar: sl.nStar, rmp_a0: R.rmp_a0, rmp_pm: R.rmp_pm, rmedio_a0: R.rmedio_a0, rmedio_pm: R.rmedio_pm };
  }
  /* la parte angolare |Y_lm|² (non normalizzata, forma reale) e l'angolo polare del massimo */
  var ANGOLARI = {
    s:      { f: function () { return 1; }, max: 0, nodi: [] },
    pz:     { f: function (th) { var c = Math.cos(th); return c * c; }, max: 0, nodi: [90] },
    px:     { f: function (th) { var s = Math.sin(th); return s * s; }, max: 90, nodi: [0] },
    dz2:    { f: function (th) { var c = Math.cos(th), x = 3 * c * c - 1; return x * x; }, max: 0, nodi: [54.7356, 125.2644] },
    'dx2y2':{ f: function (th) { var s = Math.sin(th); return s * s * s * s; }, max: 90, nodi: [0] },
    dxz:    { f: function (th) { var s = Math.sin(th), c = Math.cos(th); return s * s * c * c; }, max: 45, nodi: [0, 90] }
  };
  function angolo(orb) { var A = ANGOLARI[orb]; if (!A) return null; var best = 0, bv = -1; for (var th = 0; th <= 180; th += 0.01) { var v = A.f(th * Math.PI / 180); if (v > bv) { bv = v; best = th; } } return { orbitale: orb, thetaMax: arr(best, 2), nodi: A.nodi, cos2: arr(Math.pow(Math.cos(best * Math.PI / 180), 2), 4) }; }

  /* ═══ 2 · HÜCKEL / variazionale ══════════════════════════════════════════ */
  function jacobi(A) {
    var n = A.length, a = A.map(function (r) { return r.slice(); }), V = []; for (var i = 0; i < n; i++) { V.push([]); for (var j = 0; j < n; j++) V[i].push(i === j ? 1 : 0); }
    for (var it = 0; it < 100; it++) { var p = 0, q = 1, mx = 0; for (var r = 0; r < n; r++) for (var c = r + 1; c < n; c++) if (Math.abs(a[r][c]) > mx) { mx = Math.abs(a[r][c]); p = r; q = c; }
      if (mx < 1e-12) break; var th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]), cs = Math.cos(th), sn = Math.sin(th);
      for (var k = 0; k < n; k++) { if (k !== p && k !== q) { var akp = a[k][p], akq = a[k][q]; a[k][p] = a[p][k] = cs * akp - sn * akq; a[k][q] = a[q][k] = sn * akp + cs * akq; } }
      var pp = a[p][p], qq = a[q][q], pq = a[p][q]; a[p][p] = cs * cs * pp - 2 * sn * cs * pq + sn * sn * qq; a[q][q] = sn * sn * pp + 2 * sn * cs * pq + cs * cs * qq; a[p][q] = a[q][p] = 0;
      for (k = 0; k < n; k++) { var vp = V[k][p], vq = V[k][q]; V[k][p] = cs * vp - sn * vq; V[k][q] = sn * vp + cs * vq; }
    }
    return { val: a.map(function (r, i) { return r[i]; }), vec: V };
  }
  /** la matrice di Hückel: diagonale α (in unità di β: 0 omonucleare, h_i eteronucleare), fuori diagonale 1 sui legami */
  function matrice(n, legami, alfa) { var H = []; for (var i = 0; i < n; i++) { H.push([]); for (var j = 0; j < n; j++) H[i].push(i === j ? (alfa ? alfa[i] : 0) : 0); } legami.forEach(function (l) { H[l[0]][l[1]] = H[l[1]][l[0]] = l[2] != null ? l[2] : 1; }); return H; }
  /** risolve un sistema π: ritorna orbitali (coeff β dell'energia, autovettori normalizzati, occupazione), energia totale, delocalizzazione */
  function huckel(sistema) {
    var H = matrice(sistema.n, sistema.legami, sistema.alfa), E = jacobi(H), n = sistema.n;
    var orb = E.val.map(function (v, i) { var vettore = E.vec.map(function (r) { return r[i]; }), norma = Math.sqrt(vettore.reduce(function (s, x) { return s + x * x; }, 0)) || 1;
      return { x: arr(v, 4), coeff: vettore.map(function (c) { return arr(c / norma, 4); }) }; }).sort(function (a, b) { return b.x - a.x; });   /* energia bassa = x grande (E = α + xβ, β<0) */
    var rem = sistema.elettroni, totX = 0; orb.forEach(function (o) { var occ = Math.min(2, rem); o.occ = occ; totX += occ * o.x; rem -= Math.max(0, occ); });
    var ref = sistema.rifLocalizzato;   /* energia π del riferimento localizzato, in unità di β (coeff) */
    return { nome: sistema.nome, n: n, elettroni: sistema.elettroni, orbitali: orb, Epi_coeffBeta: arr(totX, 4), rifLoc_coeffBeta: ref != null ? ref : null, deloc_coeffBeta: ref != null ? arr(totX - ref, 4) : null, note: sistema.note };
  }
  var HUCKEL = {
    allile:        { nome: 'Allile / O₃ / NO₂ (3 centri)', n: 3, elettroni: 4, legami: [[0, 1], [1, 2]], rifLocalizzato: 2 * Math.SQRT2, note: ['E = α + √2β, α, α − √2β', 'anione allilico / O₃: 4 elettroni π'] },
    ciclopropenile:{ nome: 'Ciclopropenile⁺ / CO₃²⁻ (anello 3)', n: 3, elettroni: 2, legami: [[0, 1], [1, 2], [2, 0]], rifLocalizzato: 2, note: ['E = α + 2β, α − β (×2)', 'catione aromatico (2 e⁻ π), E_deloc = 2β'] },
    butadiene:     { nome: '1,3-butadiene (catena 4)', n: 4, elettroni: 4, legami: [[0, 1], [1, 2], [2, 3]], rifLocalizzato: 4.0, note: ['E = α ± 1,618β, α ± 0,618β', 'E_deloc = 0,472β'] },
    ciclobutadiene:{ nome: 'Ciclobutadiene (anello 4)', n: 4, elettroni: 4, legami: [[0, 1], [1, 2], [2, 3], [3, 0]], rifLocalizzato: 4.0, note: ['E = α + 2β, α, α, α − 2β', 'E_deloc = 0: diradicale, antiaromatico'] },
    benzene:       { nome: 'Benzene (anello 6)', n: 6, elettroni: 6, legami: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]], rifLocalizzato: 6.0, note: ['E = α ± 2β, α ± β (×2)', 'E_deloc = 2β: aromatico'] },
    LiH:           { nome: 'LiH (eteronucleare, 2 centri)', n: 2, elettroni: 2, legami: [[0, 1, 1]], alfa: [-1.0, 1.0], note: ['α_Li ≠ α_H: diagonale h_i diversa', 'il legante più elettronegativo (H) ha α più basso'] }
  };

  /* ═══ 3 · SALC con soglia energetica ═════════════════════════════════════ */
  var MOLECOLE = {
    XeOF4: { formula: 'XeOF₄', centrale: 'Xe', leganti: [{ el: 'O', n: 1 }, { el: 'F', n: 4 }], vsepr: ['Piramide a base quadrata (C₄ᵥ)', 'Square pyramidal (C₄ᵥ)'], sterico: 6, ibr: 'sp³d²', solitari: 1, cutS: 20, cutP: 20, eVal: 42 },
    IOF5:  { formula: 'IOF₅', centrale: 'I', leganti: [{ el: 'O', n: 1 }, { el: 'F', n: 5 }], vsepr: ['Ottaedrica distorta (C₄ᵥ)', 'Distorted octahedral (C₄ᵥ)'], sterico: 6, ibr: 'sp³d²', solitari: 0, cutS: 20, cutP: 20, eVal: 48 },
    XeF4:  { formula: 'XeF₄', centrale: 'Xe', leganti: [{ el: 'F', n: 4 }], vsepr: ['Planare quadrata (D₄ₕ)', 'Square planar (D₄ₕ)'], sterico: 6, ibr: 'sp³d²', solitari: 2, cutS: 24, cutP: 24, eVal: 36 },
    SF4:   { formula: 'SF₄', centrale: 'S', leganti: [{ el: 'F', n: 4 }], vsepr: ['Altalena (C₂ᵥ)', 'Seesaw (C₂ᵥ)'], sterico: 5, ibr: 'sp³d', solitari: 1, cutS: 24, cutP: 24, eVal: 34 },
    BrF3:  { formula: 'BrF₃', centrale: 'Br', leganti: [{ el: 'F', n: 3 }], vsepr: ['A T (C₂ᵥ)', 'T-shaped (C₂ᵥ)'], sterico: 5, ibr: 'sp³d', solitari: 2, cutS: 24, cutP: 24, eVal: 28 },
    SO2:   { formula: 'SO₂', centrale: 'S', leganti: [{ el: 'O', n: 2 }], vsepr: ['Angolata (C₂ᵥ)', 'Bent (C₂ᵥ)'], sterico: 3, ibr: 'sp²', solitari: 1, cutS: 20, cutP: 20, eVal: 18 },
    SO3:   { formula: 'SO₃', centrale: 'S', leganti: [{ el: 'O', n: 3 }], vsepr: ['Trigonale planare (D₃ₕ)', 'Trigonal planar (D₃ₕ)'], sterico: 3, ibr: 'sp²', solitari: 0, cutS: 20, cutP: 20, eVal: 24 },
    I3:    { formula: 'I₃⁻', centrale: 'I', leganti: [{ el: 'I', n: 2 }], vsepr: ['Lineare (D∞ₕ)', 'Linear (D∞ₕ)'], sterico: 5, ibr: 'sp³d', solitari: 3, cutS: 25, cutP: 25, eVal: 22 }
  };
  /** analisi SALC: interazioni centrale↔legante filtrate per ΔE ≤ soglia (σ e π), conteggio OA → OM */
  function salc(key, cutS, cutP) {
    var m = MOLECOLE[key] || MOLECOLE.XeOF4, c = EO[m.centrale], eS = cutS != null ? cutS : m.cutS, eP = cutP != null ? cutP : m.cutP, inter = [];
    ['ns', 'np', 'nd'].forEach(function (cs) { if (c[cs] == null) return; m.leganti.forEach(function (lig) { var L = EO[lig.el]; ['ns', 'np'].forEach(function (ls) { if (L[ls] == null) return; var dE = Math.abs(c[cs] - L[ls]), pi = cs === 'nd' || (cs === 'np' && ls === 'np');
      inter.push({ coppia: c.n + cs.slice(1) + '(' + m.centrale + ')↔' + L.n + ls.slice(1) + '(' + lig.el + ')', dE: arr(dE, 1), sigma: dE <= eS, pi: pi && dE <= eP }); }); }); });
    var attiveS = inter.filter(function (x) { return x.sigma; }).length, attiveP = inter.filter(function (x) { return x.pi; }).length;
    var oaCentrale = 9, oaLeganti = m.leganti.reduce(function (s, l) { return s + l.n * 4; }, 0), oaTot = oaCentrale + oaLeganti;
    /* conteggio didattico: ogni interazione attiva fa una coppia legante/antilegante; il resto è non-legame */
    var coppie = inter.filter(function (x) { return x.sigma || x.pi; }).length, OL = coppie, AL = coppie, NL = oaTot - 2 * coppie;
    return { formula: m.formula, centrale: m.centrale, vsepr: m.vsepr, sterico: m.sterico, ibr: m.ibr, solitari: m.solitari, cutS: eS, cutP: eP, eVal: m.eVal, interazioni: inter, attiveSigma: attiveS, attivePi: attiveP, oaTot: oaTot, omTot: oaTot, OL: OL, AL: AL, NL: NL };
  }

  /* ═══ 4 · COMPLESSI: VBT + CFT + LFT ═════════════════════════════════════ */
  /** CFSE (in Δ), occupazione ed elettroni spaiati per dⁿ in Oh/Td/D4h, alto o basso spin */
  function riempi(dn, geom, bassoSpin) {
    if (geom === 'Td') { /* e (×2, −0,6Δt) poi t2 (×3, +0,4Δt); Td è quasi sempre alto spin */
      var occ = riempiLivelli(dn, [2, 3], bassoSpin), ne = occ[0], nt2 = occ[1];
      return { cfse: arr(ne * -0.6 + nt2 * 0.4, 2), spaiati: spaiatiDa([{ cap: 2, n: ne }, { cap: 3, n: nt2 }]), occ: 'e' + ne + ' t₂' + nt2, nt2g: ne, neg: nt2 };
    }
    if (geom === 'D4h') { /* planare quadrata: 5 orbitali, dx²-y² il più alto; con d⁸ campo forte è diamagnetica */
      var spaiati = bassoSpin ? (dn % 2) : (dn <= 5 ? dn : 10 - dn);
      return { cfse: null, spaiati: spaiati, occ: dn === 8 ? 'd⁸ (dx²₋y² vuoto)' : 'd' + dn, nt2g: 0, neg: dn >= 8 ? dn - 8 : 0 };
    }
    /* Oh: t2g (×3, −0,4Δo) poi eg (×2, +0,6Δo) */
    var r = riempiLivelli(dn, [3, 2], bassoSpin), nt2g = r[0], neg = r[1];
    return { cfse: arr(nt2g * -0.4 + neg * 0.6, 2), spaiati: spaiatiDa([{ cap: 3, n: nt2g }, { cap: 2, n: neg }]), occ: 't₂g' + nt2g + ' eg' + neg, nt2g: nt2g, neg: neg };
  }
  /** riempie livelli con capacità date; se bassoSpin riempie del tutto il primo prima di salire */
  function riempiLivelli(n, caps, basso) {
    var out = caps.map(function () { return 0; });
    if (basso) { for (var i = 0; i < caps.length; i++) { var cc = caps[i] * 2, p = Math.min(n, cc); out[i] = p; n -= p; } return out; }
    /* alto spin: prima un elettrone per orbitale su tutti, poi il secondo */
    var orbT = caps.reduce(function (s, c) { return s + c; }, 0), singoli = Math.min(n, orbT), doppi = n - singoli, j, resto;
    resto = singoli; for (j = 0; j < caps.length; j++) { var s1 = Math.min(caps[j], resto); out[j] += s1; resto -= s1; }
    resto = doppi; for (j = 0; j < caps.length; j++) { var s2 = Math.min(caps[j], resto); out[j] += s2; resto -= s2; }
    return out;
  }
  function spaiatiDa(livelli, basso) { var sp = 0; livelli.forEach(function (lv) { var orb = lv.cap, el = lv.n; sp += el <= orb ? el : (2 * orb - el); }); return sp; }
  var COMPLESSI = {
    'FeCl4-':  { formula: '[FeCl₄]⁻', metallo: 'Fe³⁺', Zmet: 26, carica: 3, leg: 'Cl⁻', nLeg: 4, dn: 5, geom: 'Td', bassoSpin: false, pi: 'π-donatore debole', ibr: 'sp³ (esterna)', omTot: 21, note: ['Td: Δt ≈ 4/9 Δo ≪ P → sempre alto spin', 'CFSE(d⁵ Td) = 0'] },
    'MnF6-4':  { formula: '[MnF₆]⁴⁻', metallo: 'Mn²⁺', Zmet: 25, carica: 2, leg: 'F⁻', nLeg: 6, dn: 5, geom: 'Oh', bassoSpin: false, pi: 'π-donatore', ibr: 'sp³d² (esterna)', omTot: 15, note: ['F⁻ campo debole → alto spin', 'd⁵ alto spin: CFSE = 0, μ = 5,92'] },
    'IrCl6-2': { formula: '[IrCl₆]²⁻', metallo: 'Ir⁴⁺', Zmet: 77, carica: 4, leg: 'Cl⁻', nLeg: 6, dn: 5, geom: 'Oh', bassoSpin: true, pi: 'π-donatore', ibr: 'd²sp³ (interna)', omTot: 27, note: ['5d + carica +4 → Δo ≫ P → basso spin', 't₂g⁵: 1 e⁻ spaiato, μ ≈ 1,73'] },
    'Ni(NH3)6-2': { formula: '[Ni(NH₃)₆]²⁺', metallo: 'Ni²⁺', Zmet: 28, carica: 2, leg: 'NH₃', nLeg: 6, dn: 8, geom: 'Oh', bassoSpin: false, pi: 'solo σ-donatore', ibr: 'sp³d² (esterna)', omTot: 15, note: ['d⁸ Oh: t₂g⁶ eg², 2 spaiati, μ = 2,83', 'NH₃ senza π: t₂g di non legame'] },
    'Ni(CN)4-2': { formula: '[Ni(CN)₄]²⁻', metallo: 'Ni²⁺', Zmet: 28, carica: 2, leg: 'CN⁻', nLeg: 4, dn: 8, geom: 'D4h', bassoSpin: true, pi: 'π-accettore (retrodonazione)', ibr: 'dsp² (interna)', omTot: 17, note: ['campo forte + planare quadrata → diamagnetico', 'retrodonazione dai d pieni ai π* del CN⁻'] },
    'Pd(CN)4-2': { formula: '[Pd(CN)₄]²⁻', metallo: 'Pd²⁺', Zmet: 46, carica: 2, leg: 'CN⁻', nLeg: 4, dn: 8, geom: 'D4h', bassoSpin: true, pi: 'π-accettore forte', ibr: 'dsp² (interna)', omTot: 17, note: ['4d⁸ planare quadrata, diamagnetico', 'grande gap HOMO-LUMO per retrodonazione'] },
    'Ni(CO)4': { formula: '[Ni(CO)₄]', metallo: 'Ni⁰', Zmet: 28, carica: 0, leg: 'CO', nLeg: 4, dn: 10, geom: 'Td', bassoSpin: false, pi: 'π-accettore forte', ibr: 'sp³', omTot: 16, note: ['d¹⁰, 18 elettroni (EAN), diamagnetico', 'retrodonazione Ni→π*(CO)'] },
    'Ag(CN)2-': { formula: '[Ag(CN)₂]⁻', metallo: 'Ag⁺', Zmet: 47, carica: 1, leg: 'CN⁻', nLeg: 2, dn: 10, geom: 'Dinfh', bassoSpin: false, pi: 'π-accettore assiale', ibr: 'sp', omTot: 11, note: ['4d¹⁰ lineare, diamagnetico', 'EAN = 50'] }
  };
  /** EAN (regola dei 18/effettivo): Z_met − carica + 2·n_leganti (donatori a 2 e⁻) */
  function ean(c) { return c.Zmet - c.carica + 2 * c.nLeg; }
  function complesso(key) {
    var c = COMPLESSI[key] || COMPLESSI['IrCl6-2'], geom = c.geom === 'Td' ? 'Td' : c.geom === 'D4h' ? 'D4h' : 'Oh';
    var r = riempi(c.dn, geom, c.bassoSpin), mu = arr(Math.sqrt(r.spaiati * (r.spaiati + 2)), 2);
    var jt = (c.geom === 'Oh') ? jahnTeller(r.nt2g, r.neg) : 'no';
    return { formula: c.formula, metallo: c.metallo, dn: 'd' + c.dn, geom: c.geom, leg: c.leg, nLeg: c.nLeg, pi: c.pi, ibr: c.ibr, bassoSpin: c.bassoSpin, EAN: ean(c), occ: r.occ, cfse_Delta: r.cfse, spaiati: r.spaiati, mu_BM: mu, jahnTeller: jt, omTot: c.omTot, note: c.note };
  }
  /** Jahn–Teller dall'occupazione reale: eg asimmetrico (1 o 3) → forte; t₂g asimmetrico (1,2,4,5) → debole */
  function jahnTeller(nt2g, neg) { if (neg === 1 || neg === 3) return 'forte (eg asimmetrico)'; if (nt2g === 1 || nt2g === 2 || nt2g === 4 || nt2g === 5) return 'debole (t₂g asimmetrico)'; return 'no'; }

  function arr(x, n) { var p = Math.pow(10, n); return Math.round(x * p) / p; }

  g.BSIInorganicaDati = {
    EO: EO, A0_PM: A0_PM, GRUPPI: GRUPPI, NSTAR: NSTAR,
    occupazione: occupazione, slater: slater, raggi: raggi, elemento: elemento, angolo: angolo, ANGOLARI: ANGOLARI,
    jacobi: jacobi, matrice: matrice, huckel: huckel, HUCKEL: HUCKEL,
    MOLECOLE: MOLECOLE, salc: salc, COMPLESSI: COMPLESSI, complesso: complesso, ean: ean, riempi: riempi, jahnTeller: jahnTeller,
    FONTI: ['J. C. Slater, Atomic Shielding Constants, Physical Review 36 (1930) 57', 'E. Hückel, Zur Quantentheorie der Doppelbindung, Zeitschrift für Physik 70 (1931) 204', 'C. J. Ballhausen, Introduction to Ligand Field Theory, McGraw-Hill 1962', 'F. A. Cotton, G. Wilkinson, Advanced Inorganic Chemistry, 6ª ed., Wiley 1999'] };
})(typeof window !== 'undefined' ? window : globalThis);
