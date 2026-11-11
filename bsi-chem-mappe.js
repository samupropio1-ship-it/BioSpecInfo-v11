/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chem-mappe.js — 🗺️ mappa dello spazio chimico · 📈 deconvoluzione di picchi
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v250)
   Richiesta dell'autore: i potenziamenti maggiori per chemioinformatica, RDKit,
   data science e spettri. Fatto l'inventario di cio' che l'app ha gia'
   (similarita', raggruppamento di Butina, PCA, QSAR, foreste casuali; spettri
   previsti, letti, elucidati), mancavano due strumenti che in laboratorio si
   usano ogni giorno:

   · LA MAPPA DELLO SPAZIO CHIMICO con t-SNE (van der Maaten e Hinton, 2008).
     La PCA proietta lungo le direzioni di massima varianza e sulle impronte
     molecolari, che sono migliaia di bit quasi tutti spenti, schiaccia tutto in
     una nuvola. Il t-SNE conserva i VICINATI: molecole simili restano vicine.
     Qui e' il t-SNE esatto (niente approssimazione di Barnes–Hut: fino a
     qualche centinaio di molecole non serve), sulle distanze di Tanimoto fra
     impronte di Morgan calcolate da RDKit. Il seme del generatore e' fisso: la
     stessa mappa a ogni apertura. Accanto alla mappa, la misura che dice
     quanto fidarsene: la frazione dei k vicini conservati.

   · LA DECONVOLUZIONE DI PICCHI: separare bande sovrapposte (l'ammide I di una
     proteina, due carbonili vicini) in componenti gaussiane, lorentziane o
     pseudo-Voigt con i minimi quadrati non lineari di Levenberg–Marquardt.
     Per ogni componente: centro, larghezza a meta' altezza, altezza e AREA
     (forma chiusa), e la quota sul totale. Le stime iniziali vengono dai
     minimi della derivata seconda, dove le spalle nascoste si vedono.

   ONESTA'
   · Una mappa t-SNE non ha assi con un significato e le distanze FRA gruppi
     lontani non vogliono dire nulla: conta chi sta vicino a chi. La sezione lo
     dice, e mostra che cosa cambia con la perplessita'.
   · Una deconvoluzione non e' unica: con abbastanza componenti si riproduce
     qualunque banda. Il numero di componenti lo sceglie chi usa lo strumento,
     e va giustificato (derivata seconda, chimica del campione). R² alto non
     prova che le componenti siano vere.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var COL = ['#5eead4', '#ffd24a', '#7c6fff', '#ff8fab', '#6bcfff', '#b8f25a', '#ffa94d', '#d0a2ff', '#9fb6dd'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ 1. IL GENERATORE (seme fisso: risultati ripetibili) ══════════════ */
  function rng(seme) { var a = seme >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function normale(r) { var u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ═══ 2. t-SNE ESATTO ══════════════════════════════════════════════════
     D: matrice n×n delle distanze (simmetrica, diagonale nulla).
     Per ogni punto i si cerca la larghezza β_i della gaussiana per cui la
     distribuzione condizionata p_{j|i} ∝ exp(−β_i d_ij²) ha la perplessita'
     voluta (bisezione sull'entropia). P = (P_cond + P_condᵀ)/2n.
     Nel piano le somiglianze sono una t di Student a un grado di liberta':
     q_ij ∝ 1/(1 + |y_i − y_j|²). Si minimizza KL(P‖Q) con la discesa del
     gradiente con inerzia, guadagni adattivi e «esagerazione iniziale». */
  function probabilita(D, perpl) {
    var n = D.length, P = [], H0 = Math.log(perpl), i, j;
    for (i = 0; i < n; i++) {
      var beta = 1, bmin = -Infinity, bmax = Infinity, riga = new Float64Array(n), d2 = new Float64Array(n);
      for (j = 0; j < n; j++) d2[j] = D[i][j] * D[i][j];
      /* scala: le distanze di Tanimoto stanno fra 0 e 1, altre possono essere grandi */
      var med = 0; for (j = 0; j < n; j++) med += d2[j]; med /= Math.max(1, n - 1); if (med > 0) beta = 1 / med;
      for (var it = 0; it < 60; it++) {
        var somma = 0, sd = 0;
        for (j = 0; j < n; j++) { if (j === i) { riga[j] = 0; continue; } var p = Math.exp(-beta * d2[j]); riga[j] = p; somma += p; sd += p * d2[j]; }
        if (somma < 1e-300) somma = 1e-300;
        var H = Math.log(somma) + beta * sd / somma, diff = H - H0;
        if (Math.abs(diff) < 1e-5) break;
        if (diff > 0) { bmin = beta; beta = isFinite(bmax) ? (beta + bmax) / 2 : beta * 2; }
        else { bmax = beta; beta = isFinite(bmin) ? (beta + bmin) / 2 : beta / 2; }
      }
      var s2 = 0; for (j = 0; j < n; j++) s2 += riga[j]; if (s2 < 1e-300) s2 = 1e-300;
      for (j = 0; j < n; j++) riga[j] /= s2;
      P.push(riga);
    }
    var S = []; for (i = 0; i < n; i++) { S.push(new Float64Array(n)); }
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) S[i][j] = Math.max((P[i][j] + P[j][i]) / (2 * n), 1e-12);
    return S;
  }
  function tsne(D, opz) {
    opz = opz || {};
    var n = D.length; if (n < 3) return { Y: D.map(function (_, i) { return [i, 0]; }), kl: [], perplessita: 0 };
    var perpl = Math.max(2, Math.min(opz.perplessita || 15, (n - 1) / 3));
    var IT = opz.iterazioni || 500, eta = opz.eta || 100, r = rng(opz.seme == null ? 7 : opz.seme);
    var P = probabilita(D, perpl), Y = [], V = [], G = [], i, j, kl = [];
    for (i = 0; i < n; i++) { Y.push([normale(r) * 1e-4, normale(r) * 1e-4]); V.push([0, 0]); G.push([1, 1]); }
    var Q = []; for (i = 0; i < n; i++) Q.push(new Float64Array(n));
    for (var it = 0; it < IT; it++) {
      var esag = it < 100 ? 4 : 1, mom = it < 250 ? 0.5 : 0.8, somma = 0;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { var dx = Y[i][0] - Y[j][0], dy = Y[i][1] - Y[j][1], q = 1 / (1 + dx * dx + dy * dy); Q[i][j] = Q[j][i] = q; somma += 2 * q; }
      var costo = 0;
      for (i = 0; i < n; i++) {
        var gx = 0, gy = 0;
        for (j = 0; j < n; j++) {
          if (j === i) continue;
          var num = Q[i][j], qn = Math.max(num / somma, 1e-12), m = 4 * (esag * P[i][j] - qn) * num;
          gx += m * (Y[i][0] - Y[j][0]); gy += m * (Y[i][1] - Y[j][1]);
          if (j > i) costo += 2 * P[i][j] * Math.log(P[i][j] / qn);
        }
        var g = [gx, gy];
        for (var k = 0; k < 2; k++) {
          G[i][k] = (g[k] > 0) === (V[i][k] > 0) ? Math.max(G[i][k] * 0.8, 0.01) : G[i][k] + 0.2;
          V[i][k] = mom * V[i][k] - eta * G[i][k] * g[k];
        }
      }
      var mx = 0, my = 0;
      for (i = 0; i < n; i++) { Y[i][0] += V[i][0]; Y[i][1] += V[i][1]; mx += Y[i][0]; my += Y[i][1]; }
      mx /= n; my /= n; for (i = 0; i < n; i++) { Y[i][0] -= mx; Y[i][1] -= my; }
      if (it % 10 === 0 || it === IT - 1) kl.push(costo);
    }
    return { Y: Y, kl: kl, perplessita: perpl };
  }
  /* quanto la mappa conserva i vicinati: per ogni punto, la quota dei suoi k vicini (nelle distanze vere) che sono
     fra i k vicini anche nel piano; media su tutti i punti. 1 = vicinati identici; k/(n−1) = come a caso */
  function vicini(riga, i, k) { var idx = []; for (var j = 0; j < riga.length; j++) if (j !== i) idx.push(j); idx.sort(function (a, b) { return riga[a] - riga[b]; }); return idx.slice(0, k); }
  function conservazione(D, Y, k) {
    var n = D.length; k = Math.min(k || 5, n - 1); if (n < 3) return 1;
    var tot = 0;
    for (var i = 0; i < n; i++) {
      var d2 = []; for (var j = 0; j < n; j++) d2.push(Math.hypot(Y[i][0] - Y[j][0], Y[i][1] - Y[j][1]));
      var a = vicini(D[i], i, k), b = vicini(d2, i, k), c = 0;
      a.forEach(function (x) { if (b.indexOf(x) >= 0) c++; });
      tot += c / k;
    }
    return tot / n;
  }
  /* la quota dei punti il cui vicino piu' prossimo NEL PIANO appartiene alla stessa classe */
  function purezza(Y, classi) {
    var n = Y.length, ok = 0;
    for (var i = 0; i < n; i++) { var best = -1, dm = Infinity; for (var j = 0; j < n; j++) { if (j === i) continue; var d = Math.hypot(Y[i][0] - Y[j][0], Y[i][1] - Y[j][1]); if (d < dm) { dm = d; best = j; } } if (best >= 0 && classi[best] === classi[i]) ok++; }
    return ok / n;
  }
  /* distanze euclidee fra vettori (per l'esempio sintetico) */
  function distanze(X) { var n = X.length, D = []; for (var i = 0; i < n; i++) { D.push(new Float64Array(n)); } for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) { var s = 0; for (var k = 0; k < X[i].length; k++) { var d = X[i][k] - X[j][k]; s += d * d; } D[i][j] = D[j][i] = Math.sqrt(s); } return D; }
  /* gruppi gaussiani in molte dimensioni: l'esempio che non ha bisogno di RDKit */
  function gruppiSintetici(nGruppi, perGruppo, dim, distanza, seme) {
    var r = rng(seme == null ? 11 : seme), X = [], cl = [];
    for (var g = 0; g < nGruppi; g++) {
      var centro = []; for (var k = 0; k < dim; k++) centro.push(normale(r) * distanza);
      for (var i = 0; i < perGruppo; i++) { var p = []; for (k = 0; k < dim; k++) p.push(centro[k] + normale(r)); X.push(p); cl.push(g); }
    }
    return { X: X, classi: cl };
  }
  /* PCA classica su vettori (per il confronto nell'esempio sintetico): le prime due componenti con l'iterazione delle potenze */
  function pca2(X) {
    var n = X.length, d = X[0].length, m = new Float64Array(d), i, k;
    for (i = 0; i < n; i++) for (k = 0; k < d; k++) m[k] += X[i][k] / n;
    var Z = X.map(function (p) { return p.map(function (v, q) { return v - m[q]; }); });
    function per(v) { var o = new Float64Array(d); for (var a = 0; a < n; a++) { var s = 0; for (var q = 0; q < d; q++) s += Z[a][q] * v[q]; for (q = 0; q < d; q++) o[q] += Z[a][q] * s; } return o; }
    function norma(v) { var s = 0; for (var q = 0; q < d; q++) s += v[q] * v[q]; s = Math.sqrt(s) || 1; for (q = 0; q < d; q++) v[q] /= s; return v; }
    var assi = [], r = rng(3);
    for (var c = 0; c < 2; c++) {
      var v = new Float64Array(d); for (k = 0; k < d; k++) v[k] = r() - 0.5; norma(v);
      for (var it = 0; it < 200; it++) { v = per(v); assi.forEach(function (a) { var s = 0; for (var q = 0; q < d; q++) s += a[q] * v[q]; for (q = 0; q < d; q++) v[q] -= s * a[q]; }); norma(v); }
      assi.push(v);
    }
    return Z.map(function (p) { return assi.map(function (a) { var s = 0; for (var q = 0; q < d; q++) s += p[q] * a[q]; return s; }); });
  }

  /* ═══ 3. LE MOLECOLE D'ESEMPIO: sette famiglie ═════════════════════════ */
  var FAMIGLIE = [
    { nome: ['alcoli alifatici', 'aliphatic alcohols'], mol: [['etanolo', 'CCO'], ['1-propanolo', 'CCCO'], ['1-butanolo', 'CCCCO'], ['2-propanolo', 'CC(C)O'], ['1-pentanolo', 'CCCCCO'], ['isobutanolo', 'CC(C)CO'], ['glicole etilenico', 'OCCO'], ['1-esanolo', 'CCCCCCO']] },
    { nome: ['aromatici semplici', 'simple aromatics'], mol: [['benzene', 'c1ccccc1'], ['toluene', 'Cc1ccccc1'], ['fenolo', 'Oc1ccccc1'], ['anilina', 'Nc1ccccc1'], ['clorobenzene', 'Clc1ccccc1'], ['naftalene', 'c1ccc2ccccc2c1'], ['anisolo', 'COc1ccccc1'], ['benzaldeide', 'O=Cc1ccccc1']] },
    { nome: ['acidi ed esteri', 'acids and esters'], mol: [['acido acetico', 'CC(=O)O'], ['acido propionico', 'CCC(=O)O'], ['acido butirrico', 'CCCC(=O)O'], ['acetato di metile', 'CC(=O)OC'], ['acetato di etile', 'CC(=O)OCC'], ['propionato di metile', 'CCC(=O)OC'], ['acido malonico', 'OC(=O)CC(=O)O'], ['butirrato di etile', 'CCCC(=O)OCC']] },
    { nome: ['amminoacidi', 'amino acids'], mol: [['glicina', 'NCC(=O)O'], ['alanina', 'CC(N)C(=O)O'], ['valina', 'CC(C)C(N)C(=O)O'], ['serina', 'NC(CO)C(=O)O'], ['fenilalanina', 'NC(Cc1ccccc1)C(=O)O'], ['acido glutammico', 'NC(CCC(=O)O)C(=O)O'], ['cisteina', 'NC(CS)C(=O)O'], ['leucina', 'CC(C)CC(N)C(=O)O']] },
    { nome: ['steroidi', 'steroids'], mol: [['testosterone', 'CC12CCC3C(CCC4=CC(=O)CCC34C)C1CCC2O'], ['estradiolo', 'CC12CCC3c4ccc(O)cc4CCC3C1CCC2O'], ['progesterone', 'CC(=O)C1CCC2C3CCC4=CC(=O)CCC4(C)C3CCC12C'], ['colesterolo', 'CC(C)CCCC(C)C1CCC2C3CC=C4CC(O)CCC4(C)C3CCC12C'], ['cortisolo', 'OCC(=O)C1(O)CCC2C3CCC4=CC(=O)CCC4(C)C3C(O)CC21C'], ['estrone', 'CC12CCC3c4ccc(O)cc4CCC3C1CCC2=O'], ['androstenedione', 'CC12CCC3C(CCC4=CC(=O)CCC34C)C1CCC2=O']] },
    { nome: ['purine e xantine', 'purines and xanthines'], mol: [['caffeina', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C'], ['teobromina', 'Cn1cnc2c1c(=O)[nH]c(=O)n2C'], ['teofillina', 'Cn1c(=O)c2[nH]cnc2n(C)c1=O'], ['adenina', 'Nc1ncnc2[nH]cnc12'], ['guanina', 'Nc1nc2[nH]cnc2c(=O)[nH]1'], ['ipoxantina', 'O=c1[nH]cnc2[nH]cnc12'], ['xantina', 'O=c1[nH]c(=O)c2[nH]cnc2[nH]1'], ['acido urico', 'O=c1[nH]c(=O)c2[nH]c(=O)[nH]c2[nH]1']] },
    { nome: ['antinfiammatori', 'anti-inflammatories'], mol: [['ibuprofene', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O'], ['naprossene', 'COc1ccc2cc(ccc2c1)C(C)C(=O)O'], ['ketoprofene', 'CC(C(=O)O)c1cccc(c1)C(=O)c1ccccc1'], ['flurbiprofene', 'CC(C(=O)O)c1ccc(c(F)c1)-c1ccccc1'], ['aspirina', 'CC(=O)Oc1ccccc1C(=O)O'], ['acido salicilico', 'OC(=O)c1ccccc1O'], ['diclofenac', 'OC(=O)Cc1ccccc1Nc1c(Cl)cccc1Cl'], ['paracetamolo', 'CC(=O)Nc1ccc(O)cc1']] }
  ];
  function esempio() { var out = []; FAMIGLIE.forEach(function (f, g) { f.mol.forEach(function (m) { out.push({ nome: m[0], smiles: m[1], classe: g }); }); }); return out; }
  /* le impronte di Morgan con RDKit (bsi-cheminfo.js) e la matrice delle distanze di Tanimoto */
  function distanzeTanimoto(mol) {
    var B = globale.BSIChem, fps = [], buone = [];
    mol.forEach(function (m) { var fp = null; try { fp = B.fingerprint(m.smiles, 'morgan'); } catch (e) { fp = null; } if (fp) { fps.push(fp); buone.push(m); } });
    var n = fps.length, D = [];
    for (var i = 0; i < n; i++) D.push(new Float64Array(n));
    for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) D[i][j] = D[j][i] = 1 - B.tanimoto(fps[i], fps[j]);
    return { D: D, mol: buone, fps: fps, scartate: mol.length - n };
  }
  function conRDKit(fn, no) {
    var B = globale.BSIChem;
    if (B && B.pronto && B.pronto()) return fn();
    if (typeof globale.bsiLoadRDKit !== 'function') return no && no();
    globale.bsiLoadRDKit(function (R) { if (R && B && B.pronto && B.pronto()) fn(); else if (no) no(); });
  }

  /* il disegno di una mappa: punti colorati, tocco → la molecola piu' vicina */
  function disegnaMappa(c, Y, classi, nomiClassi, suTocco) {
    var xs = Y.map(function (p) { return p[0]; }), ys = Y.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), mx = (x1 - x0) * 0.08 || 1, my = (y1 - y0) * 0.08 || 1;
    var G = F.grafico(c, { punti: Y.map(function (p, i) { return { x: p[0], y: p[1], col: COL[classi[i] % COL.length], r: 5 }; }), xmin: x0 - mx, xmax: x1 + mx, ymin: y0 - my, ymax: y1 + my,
      xl: ['asse 1 (senza unità)', 'axis 1 (no units)'], yl: ['asse 2 (senza unità)', 'axis 2 (no units)'],
      legenda: (nomiClassi || []).map(function (nm, k) { return { col: COL[k % COL.length], etich: nm }; }) });
    c._bsiMappa = { G: G, Y: Y };
    if (suTocco && !c._bsiTocco) {
      c._bsiTocco = true; c.style.cursor = 'pointer';
      c.addEventListener('click', function (e) {
        var M = c._bsiMappa; if (!M) return; var r = c.getBoundingClientRect(), px = (e.clientX - r.left) * (M.G.W / r.width), py = (e.clientY - r.top) * (M.G.H / r.height), best = -1, dm = 1e9;
        M.Y.forEach(function (p, i) { var d = Math.hypot(M.G.X(p[0]) - px, M.G.Y(p[1]) - py); if (d < dm) { dm = d; best = i; } });
        if (best >= 0 && dm < 40) c._bsiSuTocco(best);
      });
    }
    c._bsiSuTocco = suTocco;
  }

  /* ── scheda 1: la mappa delle molecole ── */
  function schedaMappa(div) {
    var g = griglia(div), pan = g.pan, metodo = 'tsne', perpl = 8, stato = { dati: null };
    F.scelta(pan, ['Proiezione', 'Projection'], [['tsne', ['t-SNE (conserva i vicinati)', 't-SNE (keeps neighbourhoods)']], ['pca', ['PCA (massima varianza)', 'PCA (maximum variance)']]], metodo, function (v) { metodo = v; calcola(); });
    F.cursore(pan, ['Perplessità (quanti vicini contano)', 'Perplexity (how many neighbours count)'], 3, 16, 1, perpl, function (v) { perpl = v; if (metodo === 'tsne') calcola(); });
    var info = nota(pan), scheda = nota(pan), c = F.tela(g.dx, 0.8);
    function mostra() {
      var S = stato.dati; if (!S) return;
      disegnaMappa(c, S.Y, S.mol.map(function (m) { return m.classe; }), FAMIGLIE.map(function (f) { return t(f.nome[0], f.nome[1]); }), function (i) {
        var m = S.mol[i], vic = vicini(S.D[i], i, 3).map(function (j) { return S.mol[j].nome + ' (' + (1 - S.D[i][j]).toFixed(2) + ')'; });
        scheda.innerHTML = '<b>' + esc(m.nome) + '</b> · <code>' + esc(m.smiles) + '</code><br>' + t('Le tre più simili (Tanimoto): ', 'The three most similar (Tanimoto): ') + esc(vic.join(', '));
      });
    }
    function calcola() {
      info.textContent = t('Calcolo le impronte con RDKit…', 'Computing fingerprints with RDKit…');
      conRDKit(function () {
        var R = distanzeTanimoto(esempio()), Y, extra = '';
        if (metodo === 'tsne') { var T = tsne(R.D, { perplessita: perpl, seme: 7 }); Y = T.Y; extra = ' · KL = ' + T.kl[T.kl.length - 1].toFixed(3); }
        else {
          var bit = R.fps.map(function (fp) { var v = new Float64Array(256); for (var b = 0; b < 2048; b++) { if (fp.bit && fp.bit[b >> 5] !== undefined ? (fp.bit[b >> 5] >>> (b & 31)) & 1 : 0) v[b % 256] += 1; } return v; });
          var haBit = bit.some(function (v) { for (var q = 0; q < v.length; q++) if (v[q]) return true; return false; });
          Y = haBit ? pca2(bit) : mdsClassico(R.D);
        }
        stato.dati = { Y: Y, mol: R.mol, D: R.D };
        var cons = conservazione(R.D, Y, 5), pur = purezza(Y, R.mol.map(function (m) { return m.classe; }));
        info.innerHTML = R.mol.length + t(' molecole, 7 famiglie', ' molecules, 7 families') + extra + '<br>' +
          t('Vicinati conservati (5 vicini): ', 'Neighbourhoods kept (5 neighbours): ') + '<b class="bsiFX-num">' + (cons * 100).toFixed(0) + ' %</b>' +
          '<br>' + t('Vicino più prossimo della stessa famiglia: ', 'Nearest neighbour of the same family: ') + '<b class="bsiFX-num">' + (pur * 100).toFixed(0) + ' %</b>' +
          '<br><span style="opacity:.85">' + t('Tocca un punto per vedere la molecola. Gli assi non hanno un significato: conta chi sta vicino a chi.', 'Tap a point to see the molecule. The axes mean nothing: what matters is who is near whom.') + '</span>';
        scheda.textContent = ''; mostra();
      }, function () { info.textContent = t('RDKit non è disponibile qui (serve la rete la prima volta): apri la scheda «Capire il t-SNE», che non ne ha bisogno.', 'RDKit is not available here (the network is needed the first time): open the «Understanding t-SNE» tab, which does not need it.'); });
    }
    calcola(); F.alRidimensiona(mostra);
  }
  /* se le impronte non espongono i bit: scalamento multidimensionale classico dalle distanze (equivale alla PCA) */
  function mdsClassico(D) {
    var n = D.length, B = [], i, j, rm = new Float64Array(n), tot = 0;
    for (i = 0; i < n; i++) { B.push(new Float64Array(n)); for (j = 0; j < n; j++) { B[i][j] = -0.5 * D[i][j] * D[i][j]; rm[i] += B[i][j] / n; } tot += rm[i] / n; }
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) B[i][j] += tot - rm[i] - rm[j];
    var assi = [], lam = [], r = rng(5);
    for (var c = 0; c < 2; c++) {
      var v = new Float64Array(n), l = 0; for (i = 0; i < n; i++) v[i] = r() - 0.5;
      for (var it = 0; it < 300; it++) {
        var w = new Float64Array(n); for (i = 0; i < n; i++) { var s = 0; for (j = 0; j < n; j++) s += B[i][j] * v[j]; w[i] = s; }
        assi.forEach(function (a) { var p = 0; for (var q = 0; q < n; q++) p += a[q] * w[q]; for (q = 0; q < n; q++) w[q] -= p * a[q]; });
        l = 0; for (i = 0; i < n; i++) l += w[i] * w[i]; l = Math.sqrt(l) || 1; for (i = 0; i < n; i++) v[i] = w[i] / l;
      }
      assi.push(v); lam.push(l);
    }
    var Y = []; for (i = 0; i < n; i++) Y.push([assi[0][i] * Math.sqrt(lam[0]), assi[1][i] * Math.sqrt(lam[1])]);
    return Y;
  }

  /* ── scheda 2: capire il t-SNE su gruppi sintetici ── */
  function schedaCapire(div) {
    var g = griglia(div), pan = g.pan, perpl = 10, dist = 3, metodo = 'tsne';
    F.scelta(pan, ['Proiezione', 'Projection'], [['tsne', ['t-SNE', 't-SNE']], ['pca', ['PCA', 'PCA']]], metodo, function (v) { metodo = v; calcola(); });
    F.cursore(pan, ['Perplessità', 'Perplexity'], 2, 25, 1, perpl, function (v) { perpl = v; if (metodo === 'tsne') calcola(); });
    F.cursore(pan, ['Distanza fra i gruppi (in deviazioni standard)', 'Distance between groups (standard deviations)'], 0.5, 6, 0.5, dist, function (v) { dist = v; calcola(); });
    var info = nota(pan), c = F.tela(g.dx, 0.8), c2 = F.tela(g.dx, 0.35), ult = null;
    function mostra() {
      if (!ult) return;
      disegnaMappa(c, ult.Y, ult.classi, [1, 2, 3, 4].map(function (k) { return t('gruppo ', 'group ') + k; }));
      if (ult.kl && ult.kl.length) F.grafico(c2, { serie: [{ x: ult.kl.map(function (_, i) { return i * 10; }), y: ult.kl, col: '#ffd24a' }], xl: ['iterazione', 'iteration'], yl: ['KL(P‖Q)', 'KL(P‖Q)'], ymin: 0 });
      else F.grafico(c2, { serie: [], xl: ['', ''], yl: ['', ''] });
    }
    function calcola() {
      var S = gruppiSintetici(4, 25, 10, dist, 11), D = distanze(S.X), Y, kl = null;
      if (metodo === 'tsne') { var T = tsne(D, { perplessita: perpl, seme: 7 }); Y = T.Y; kl = T.kl; } else Y = pca2(S.X);
      ult = { Y: Y, classi: S.classi, kl: kl };
      info.innerHTML = t('100 punti in 10 dimensioni, quattro gruppi gaussiani.', '100 points in 10 dimensions, four Gaussian groups.') + '<br>' +
        t('Vicinati conservati: ', 'Neighbourhoods kept: ') + '<b class="bsiFX-num">' + (conservazione(D, Y, 5) * 100).toFixed(0) + ' %</b> · ' + t('stesso gruppo del vicino: ', 'same group as neighbour: ') + '<b class="bsiFX-num">' + (purezza(Y, S.classi) * 100).toFixed(0) + ' %</b><br>' +
        (metodo === 'tsne'
          ? t('Con una perplessità bassa ogni punto guarda pochi vicini e i gruppi si spezzano in grumi; alta, li guarda quasi tutti e la mappa somiglia alla PCA. La distanza FRA i gruppi nel piano non misura quanto sono lontani davvero: avvicinali col cursore e guarda che la mappa li tiene separati finché può.', 'With a low perplexity each point looks at few neighbours and the groups break into clumps; high, it looks at almost all of them and the map resembles PCA. The distance BETWEEN groups on the plane does not measure how far apart they really are: bring them closer with the slider and watch the map keep them apart as long as it can.')
          : t('La PCA è una rotazione: conserva le distanze grandi (quanto i gruppi sono lontani) ma in due sole direzioni, e i gruppi che si separano lungo le altre otto si sovrappongono.', 'PCA is a rotation: it keeps large distances (how far apart the groups are) but along two directions only, and groups that separate along the other eight overlap.'));
      mostra();
    }
    calcola(); F.alRidimensiona(mostra);
  }

  /* ── scheda 3: le molecole dell'utente ── */
  function schedaTue(div) {
    var pan = F.el('div', { 'class': 'bsiFX-pannello' }); div.appendChild(pan);
    var ta = F.el('textarea', { rows: 7, style: 'width:100%;box-sizing:border-box;background:#0d1b2e;color:#e9eef6;border:1px solid #1a3550;border-radius:8px;padding:8px;font:13px ui-monospace,monospace', 'aria-label': t('Le tue molecole: uno SMILES per riga, con il nome dopo uno spazio', 'Your molecules: one SMILES per line, with the name after a space') });
    ta.value = 'CCO etanolo\nCCCO propanolo\nCC(C)O isopropanolo\nc1ccccc1 benzene\nCc1ccccc1 toluene\nOc1ccccc1 fenolo\nCC(=O)O acido acetico\nCCC(=O)O acido propionico\nCC(=O)Oc1ccccc1C(=O)O aspirina\nOC(=O)c1ccccc1O acido salicilico\nCn1cnc2c1c(=O)n(C)c(=O)n2C caffeina\nCn1cnc2c1c(=O)[nH]c(=O)n2C teobromina';
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Uno SMILES per riga; dopo uno spazio, se vuoi, il nome. I colori sono i gruppi di Butina (somiglianza di Tanimoto ≥ 0,35).', 'One SMILES per line; after a space, optionally, the name. The colours are Butina clusters (Tanimoto similarity ≥ 0.35).') }));
    pan.appendChild(ta);
    var info = nota(pan), scheda = nota(pan), c = F.tela(div, 0.7), ult = null;
    F.bottone(pan, ['Disegna la mappa', 'Draw the map'], calcola);
    function mostra() { if (ult) disegnaMappa(c, ult.Y, ult.classi, null, function (i) { var m = ult.mol[i]; scheda.innerHTML = '<b>' + esc(m.nome) + '</b> · <code>' + esc(m.smiles) + '</code> · ' + t('gruppo ', 'cluster ') + (ult.classi[i] + 1); }); }
    function calcola() {
      var mol = ta.value.split(/\r?\n/).map(function (r) { r = r.trim(); if (!r) return null; var k = r.search(/\s/); return k < 0 ? { smiles: r, nome: r } : { smiles: r.slice(0, k), nome: r.slice(k + 1).trim() || r.slice(0, k) }; }).filter(Boolean).slice(0, 300);
      if (mol.length < 4) { info.textContent = t('Servono almeno quattro molecole.', 'At least four molecules are needed.'); return; }
      info.textContent = t('Calcolo…', 'Computing…');
      conRDKit(function () {
        var R = distanzeTanimoto(mol); if (R.mol.length < 4) { info.textContent = t('Meno di quattro SMILES validi.', 'Fewer than four valid SMILES.'); return; }
        var T = tsne(R.D, { perplessita: Math.min(10, Math.max(2, Math.floor(R.mol.length / 4))), seme: 7 }), classi = new Array(R.mol.length).fill(0);
        try { var B = globale.BSIChem.butina(R.fps, 0.35), gr = B.gruppi || B.cluster || B; if (Array.isArray(gr)) gr.forEach(function (membri, k) { (membri.membri || membri).forEach(function (i) { classi[i] = k; }); }); } catch (e) {}
        ult = { Y: T.Y, classi: classi, mol: R.mol };
        info.innerHTML = R.mol.length + t(' molecole', ' molecules') + (R.scartate ? ' (' + R.scartate + t(' SMILES non validi scartati)', ' invalid SMILES skipped)') : '') + ' · ' + (Math.max.apply(null, classi) + 1) + t(' gruppi', ' clusters') +
          '<br>' + t('Vicinati conservati: ', 'Neighbourhoods kept: ') + '<b class="bsiFX-num">' + (conservazione(R.D, T.Y, Math.min(5, R.mol.length - 1)) * 100).toFixed(0) + ' %</b>';
        scheda.textContent = ''; mostra();
      }, function () { info.textContent = t('RDKit non è disponibile qui.', 'RDKit is not available here.'); });
    }
    F.alRidimensiona(mostra);
  }

  /* ═══ 4. LA DECONVOLUZIONE ═════════════════════════════════════════════
     Un picco: altezza h, centro c, larghezza a meta' altezza w (FWHM).
       gaussiana   G = h·exp(−4 ln2 (x−c)²/w²)        area = h·w·√(π/(4 ln2))
       lorentziana L = h/(1 + 4 (x−c)²/w²)            area = h·w·π/2
       pseudo-Voigt  η·L + (1−η)·G                    area = η·A_L + (1−η)·A_G
     Parametri: [h, c, w] per picco, piu' la linea di base (costante) e, per la
     pseudo-Voigt, η comune a tutti i picchi. */
  var K_G = Math.sqrt(Math.PI / (4 * Math.LN2));
  function profilo(x, h, c, w, tipo, eta) {
    var u = (x - c) / w, g = h * Math.exp(-4 * Math.LN2 * u * u), l = h / (1 + 4 * u * u);
    return tipo === 'gauss' ? g : tipo === 'lorentz' ? l : eta * l + (1 - eta) * g;
  }
  function area(h, w, tipo, eta) { var ag = h * w * K_G, al = h * w * Math.PI / 2; return tipo === 'gauss' ? ag : tipo === 'lorentz' ? al : eta * al + (1 - eta) * ag; }
  function modello(x, p, n, tipo) { var eta = tipo === 'voigt' ? p[3 * n + 1] : 0, s = p[3 * n]; for (var k = 0; k < n; k++) s += profilo(x, p[3 * k], p[3 * k + 1], p[3 * k + 2], tipo, eta); return s; }
  /* i centri di partenza: i minimi piu' profondi della derivata seconda lisciata (li' stanno anche le spalle) */
  function stime(xs, ys, n) {
    var N = xs.length, m = Math.max(2, Math.round(N / 60)), sm = [], i;
    for (i = 0; i < N; i++) { var s = 0, c = 0; for (var j = Math.max(0, i - m); j <= Math.min(N - 1, i + m); j++) { s += ys[j]; c++; } sm.push(s / c); }
    var sm2 = []; for (i = 0; i < N; i++) { s = 0; c = 0; for (j = Math.max(0, i - m); j <= Math.min(N - 1, i + m); j++) { s += sm[j]; c++; } sm2.push(s / c); }
    var d2 = new Float64Array(N); for (i = 1; i < N - 1; i++) d2[i] = sm2[i + 1] - 2 * sm2[i] + sm2[i - 1];
    var base = Math.min.apply(null, ys), cand = [];
    for (i = 2; i < N - 2; i++) if (d2[i] < 0 && d2[i] <= d2[i - 1] && d2[i] <= d2[i + 1]) {
      var a = i, b = i; while (a > 0 && d2[a] < 0) a--; while (b < N - 1 && d2[b] < 0) b++;
      /* fra i due flessi di una gaussiana ci sono 2σ: FWHM = 2,355 σ */
      cand.push({ i: i, forza: -d2[i], w: Math.max(Math.abs(xs[b] - xs[a]) * 1.18, Math.abs(xs[1] - xs[0]) * 3) });
    }
    cand.sort(function (p, q) { return q.forza - p.forza; });
    var scelti = [], passo = Math.abs(xs[N - 1] - xs[0]) / (N - 1);
    cand.forEach(function (k) { if (scelti.length >= n) return; if (scelti.every(function (q) { return Math.abs(xs[q.i] - xs[k.i]) > Math.max(q.w, k.w) * 0.35 + 2 * passo; })) scelti.push(k); });
    /* se la derivata seconda ne vede meno del richiesto: gli altri si distribuiscono sull'intervallo */
    for (var q = scelti.length; q < n; q++) { var pos = Math.round((q + 0.5) / n * (N - 1)); scelti.push({ i: pos, w: Math.abs(xs[N - 1] - xs[0]) / (2 * n) }); }
    scelti.sort(function (p, r) { return xs[p.i] - xs[r.i]; });
    var p0 = []; scelti.forEach(function (k) { p0.push(Math.max(ys[k.i] - base, 1e-6), xs[k.i], k.w); });
    p0.push(base); return p0;
  }
  function risolviLineare(A, b) {
    var n = b.length, M = A.map(function (r, i) { return Array.prototype.slice.call(r).concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var piv = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-300) return null;
      var tmp = M[c]; M[c] = M[piv]; M[piv] = tmp;
      for (r = c + 1; r < n; r++) { var f = M[r][c] / M[c][c]; for (var k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    var x = new Array(n);
    for (c = n - 1; c >= 0; c--) { var s = M[c][n]; for (k = c + 1; k < n; k++) s -= M[c][k] * x[k]; x[c] = s / M[c][c]; }
    return x;
  }
  /* Levenberg–Marquardt con lo jacobiano alle differenze centrali; vincoli: h ≥ 0, w ≥ due passi, 0 ≤ η ≤ 1 */
  function deconvolvi(xs, ys, n, tipo, p0) {
    tipo = tipo || 'gauss'; n = Math.max(1, n | 0);
    var N = xs.length, passo = Math.abs(xs[N - 1] - xs[0]) / Math.max(1, N - 1), p = (p0 || stime(xs, ys, n)).slice();
    if (tipo === 'voigt' && p.length < 3 * n + 2) p.push(0.5);
    var np = p.length, lam = 1e-2, xa = Math.min(xs[0], xs[N - 1]), xb = Math.max(xs[0], xs[N - 1]);
    function vincola(q) { for (var k = 0; k < n; k++) { q[3 * k] = Math.max(q[3 * k], 0); q[3 * k + 1] = Math.min(xb, Math.max(xa, q[3 * k + 1])); q[3 * k + 2] = Math.min(xb - xa, Math.max(q[3 * k + 2], 2 * passo)); } if (tipo === 'voigt') q[np - 1] = Math.min(1, Math.max(0, q[np - 1])); return q; }
    function chi2(q) { var s = 0; for (var i = 0; i < N; i++) { var d = ys[i] - modello(xs[i], q, n, tipo); s += d * d; } return s; }
    vincola(p); var c0 = chi2(p), giri = 0;
    for (var it = 0; it < 200; it++) {
      giri = it + 1;
      var J = [], res = new Float64Array(N), i, a, b;
      for (i = 0; i < N; i++) res[i] = ys[i] - modello(xs[i], p, n, tipo);
      for (a = 0; a < np; a++) {
        var h = Math.max(1e-6, Math.abs(p[a]) * 1e-5), pp = p.slice(), pm = p.slice(); pp[a] += h; pm[a] -= h;
        var col = new Float64Array(N); for (i = 0; i < N; i++) col[i] = (modello(xs[i], pp, n, tipo) - modello(xs[i], pm, n, tipo)) / (2 * h);
        J.push(col);
      }
      var JTJ = [], JTr = new Float64Array(np);
      for (a = 0; a < np; a++) { JTJ.push(new Float64Array(np)); for (b = 0; b <= a; b++) { var s = 0; for (i = 0; i < N; i++) s += J[a][i] * J[b][i]; JTJ[a][b] = s; } s = 0; for (i = 0; i < N; i++) s += J[a][i] * res[i]; JTr[a] = s; }
      for (a = 0; a < np; a++) for (b = a + 1; b < np; b++) JTJ[a][b] = JTJ[b][a];
      var migliorato = false;
      for (var prova = 0; prova < 12; prova++) {
        var A = JTJ.map(function (r, k) { var o = Array.prototype.slice.call(r); o[k] += lam * (r[k] > 0 ? r[k] : 1e-12); return o; });
        var d = risolviLineare(A, JTr); if (!d) { lam *= 10; continue; }
        var q = vincola(p.map(function (v, k) { return v + d[k]; })), c1 = chi2(q);
        if (c1 < c0) { var rel = (c0 - c1) / Math.max(c0, 1e-300); p = q; c0 = c1; lam = Math.max(lam / 10, 1e-12); migliorato = true; if (rel < 1e-10) it = 1e9; break; }
        lam *= 10;
      }
      if (!migliorato) break;
    }
    var media = 0; for (var i2 = 0; i2 < N; i2++) media += ys[i2] / N; var tot = 0; for (i2 = 0; i2 < N; i2++) tot += (ys[i2] - media) * (ys[i2] - media);
    var eta = tipo === 'voigt' ? p[np - 1] : 0, picchi = [], atot = 0;
    for (var k = 0; k < n; k++) { var ar = area(p[3 * k], p[3 * k + 2], tipo, eta); picchi.push({ h: p[3 * k], c: p[3 * k + 1], w: p[3 * k + 2], area: ar }); atot += ar; }
    picchi.sort(function (u, v) { return u.c - v.c; }); picchi.forEach(function (q) { q.quota = atot > 0 ? q.area / atot : 0; });
    return { picchi: picchi, base: p[3 * n], eta: eta, tipo: tipo, R2: tot > 0 ? 1 - c0 / tot : 1, rmse: Math.sqrt(c0 / N), giri: giri, p: p };
  }
  /* uno spettro sintetico: la somma di picchi noti piu' rumore gaussiano (seme fisso) */
  function sintetico(picchi, x0, x1, N, tipo, rumore, seme, base, eta) {
    var r = rng(seme == null ? 5 : seme), xs = [], ys = [];
    for (var i = 0; i < N; i++) { var x = x0 + (x1 - x0) * i / (N - 1), y = base || 0; picchi.forEach(function (p) { y += profilo(x, p.h, p.c, p.w, tipo, eta == null ? 0.5 : eta); }); xs.push(x); ys.push(y + (rumore ? normale(r) * rumore : 0)); }
    return { x: xs, y: ys };
  }
  var ESEMPI = {
    ammide: { nome: ['Ammide I di una proteina (IR)', 'Amide I band of a protein (IR)'], tipo: 'gauss', n: 5, x: [1600, 1700], asse: ['numero d’onda (cm⁻¹)', 'wavenumber (cm⁻¹)'], inverti: true,
      picchi: [{ h: 0.30, c: 1618, w: 14 }, { h: 0.85, c: 1634, w: 18 }, { h: 1.00, c: 1655, w: 19 }, { h: 0.50, c: 1674, w: 16 }, { h: 0.22, c: 1689, w: 11 }], rumore: 0.004,
      nota: ['Le componenti dell’ammide I si attribuiscono alla struttura secondaria: ~1618 e ~1634 cm⁻¹ foglietti β, ~1655 α-elica, ~1674 ripiegamenti, ~1689 foglietti β antiparalleli. Le quote d’area stimano le frazioni di struttura (stima, non misura: i coefficienti di assorbimento delle strutture non sono uguali).', 'The amide I components are assigned to secondary structure: ~1618 and ~1634 cm⁻¹ β-sheets, ~1655 α-helix, ~1674 turns, ~1689 antiparallel β-sheets. The area shares estimate the structure fractions (an estimate, not a measurement: the absorption coefficients of the structures are not equal).'] },
    carbonili: { nome: ['Due carbonili vicini (IR)', 'Two close carbonyls (IR)'], tipo: 'lorentz', n: 2, x: [1660, 1790], asse: ['numero d’onda (cm⁻¹)', 'wavenumber (cm⁻¹)'], inverti: true,
      picchi: [{ h: 1.0, c: 1715, w: 16 }, { h: 0.7, c: 1738, w: 14 }], rumore: 0.006,
      nota: ['Un chetone (~1715 cm⁻¹) e un estere (~1738 cm⁻¹) nella stessa miscela: 23 cm⁻¹ di distanza, bande larghe 14–16. Le bande in soluzione sono vicine alla forma lorentziana.', 'A ketone (~1715 cm⁻¹) and an ester (~1738 cm⁻¹) in the same mixture: 23 cm⁻¹ apart, bands 14–16 wide. Bands in solution are close to the Lorentzian shape.'] },
    spalla: { nome: ['Un picco con una spalla nascosta', 'A peak with a hidden shoulder'], tipo: 'voigt', n: 2, x: [0, 100], asse: ['x (unità arbitrarie)', 'x (arbitrary units)'], inverti: false,
      picchi: [{ h: 1.0, c: 45, w: 14 }, { h: 0.35, c: 58, w: 12 }], rumore: 0.005, eta: 0.4,
      nota: ['La spalla a 58 non dà un massimo proprio: nel profilo si vede solo un’asimmetria. La derivata seconda la trova, e i minimi quadrati ne misurano l’area.', 'The shoulder at 58 gives no maximum of its own: the profile only shows an asymmetry. The second derivative finds it, and least squares measure its area.'] }
  };
  function datiEsempio(k) { var E = ESEMPI[k]; return sintetico(E.picchi, E.x[0], E.x[1], 400, E.tipo, E.rumore, 5, 0.02, E.eta); }
  function leggiXY(testo) {
    var xs = [], ys = [];
    String(testo || '').split(/\r?\n/).forEach(function (r) { var m = r.trim().replace(/,(?=\d)/g, '.').split(/[\s;\t]+/); if (m.length >= 2) { var x = parseFloat(m[0]), y = parseFloat(m[1]); if (isFinite(x) && isFinite(y)) { xs.push(x); ys.push(y); } } });
    var idx = xs.map(function (_, i) { return i; }).sort(function (a, b) { return xs[a] - xs[b]; });
    return { x: idx.map(function (i) { return xs[i]; }), y: idx.map(function (i) { return ys[i]; }) };
  }

  function schedaDeconv(div) {
    var g = griglia(div), pan = g.pan, quale = 'ammide', tipo = 'gauss', n = 5, dati = datiEsempio(quale), ris = null, inverti = true, asse = ESEMPI[quale].asse;
    F.scelta(pan, ['Spettro', 'Spectrum'], Object.keys(ESEMPI).map(function (k) { return [k, ESEMPI[k].nome]; }).concat([['mio', ['i miei dati (incollati qui sotto)', 'my data (pasted below)']]]), quale, function (v) {
      quale = v; if (v !== 'mio') { var E = ESEMPI[v]; dati = datiEsempio(v); tipo = E.tipo; n = E.n; inverti = E.inverti; asse = E.asse; selT.value = tipo; curN.value = n; curN.dispatchEvent(new Event('input')); } else leggi();
      calcola();
    });
    var selT = F.scelta(pan, ['Forma dei picchi', 'Peak shape'], [['gauss', ['gaussiana', 'Gaussian']], ['lorentz', ['lorentziana', 'Lorentzian']], ['voigt', ['pseudo-Voigt (miscela, η comune)', 'pseudo-Voigt (mixture, shared η)']]], tipo, function (v) { tipo = v; calcola(); });
    var curN = F.cursore(pan, ['Numero di componenti', 'Number of components'], 1, 8, 1, n, function (v) { n = v; calcola(); });
    var ta = F.el('textarea', { rows: 4, placeholder: '1600 0.02\n1601 0.03\n…', style: 'width:100%;box-sizing:border-box;background:#0d1b2e;color:#e9eef6;border:1px solid #1a3550;border-radius:8px;padding:8px;font:13px ui-monospace,monospace', 'aria-label': t('I tuoi dati: x e y per riga', 'Your data: x and y per line') });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('I tuoi dati: una coppia «x y» per riga (spazio, tabulazione o punto e virgola).', 'Your data: one «x y» pair per line (space, tab or semicolon).') }));
    pan.appendChild(ta);
    F.bottone(pan, ['Usa i miei dati', 'Use my data'], function () { quale = 'mio'; leggi(); calcola(); });
    var out = F.el('div'); pan.appendChild(out);
    var c = F.tela(g.dx, 0.62), c2 = F.tela(g.dx, 0.28);
    function leggi() { var L = leggiXY(ta.value); if (L.x.length >= 12) { dati = L; inverti = false; asse = ['x', 'x']; } }
    function mostra() {
      if (!ris) return;
      var xs = dati.x, serie = [{ x: xs, y: xs.map(function (x) { return modello(x, ris.p, ris.picchi.length, ris.tipo); }), col: '#ffffff', larg: 2 }];
      ris.picchi.forEach(function (p, k) { serie.push({ x: xs, y: xs.map(function (x) { return ris.base + profilo(x, p.h, p.c, p.w, ris.tipo, ris.eta); }), col: COL[k % COL.length], larg: 1.5, tratt: true }); });
      var passo = Math.max(1, Math.round(xs.length / 160));
      F.grafico(c, { serie: serie, punti: xs.filter(function (_, i) { return i % passo === 0; }).map(function (x, i) { return { x: x, y: dati.y[i * passo], col: '#9fb6dd', r: 1.8 }; }), xl: asse, yl: ['intensità', 'intensity'], invertiX: inverti,
        legenda: [{ col: '#9fb6dd', etich: ['dati', 'data'] }, { col: '#ffffff', etich: ['somma', 'sum'] }] });
      F.grafico(c2, { serie: [{ x: xs, y: xs.map(function (x, i) { return dati.y[i] - modello(x, ris.p, ris.picchi.length, ris.tipo); }), col: '#ff8fab', larg: 1.2 }, { x: [xs[0], xs[xs.length - 1]], y: [0, 0], col: '#34465f', tratt: true }], xl: asse, yl: ['residuo', 'residual'], invertiX: inverti });
    }
    function calcola() {
      if (!dati || dati.x.length < 12) { out.innerHTML = '<div class="bsiFX-nota">' + t('Servono almeno 12 punti.', 'At least 12 points are needed.') + '</div>'; return; }
      ris = deconvolvi(dati.x, dati.y, n, tipo);
      var h = '<table class="bsiFX-tab" style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px"><thead><tr>' + [t('#', '#'), t('centro', 'centre'), t('larghezza', 'width'), t('altezza', 'height'), t('area', 'area'), t('quota', 'share')].map(function (x) { return '<th style="text-align:right;padding:3px 6px;border-bottom:1px solid #1a3550;color:#9fb6dd">' + x + '</th>'; }).join('') + '</tr></thead><tbody>';
      ris.picchi.forEach(function (p, k) { h += '<tr>' + ['<span style="color:' + COL[k % COL.length] + '">●</span> ' + (k + 1), p.c.toFixed(1), p.w.toFixed(1), p.h.toFixed(3), p.area.toFixed(2), (p.quota * 100).toFixed(1) + ' %'].map(function (x) { return '<td style="text-align:right;padding:3px 6px;border-bottom:1px solid #12263c">' + x + '</td>'; }).join('') + '</tr>'; });
      h += '</tbody></table><div class="bsiFX-nota">R² = <b class="bsiFX-num">' + ris.R2.toFixed(5) + '</b> · ' + t('scarto quadratico medio', 'root mean square error') + ' = ' + ris.rmse.toExponential(2) + ' · ' + t('linea di base', 'baseline') + ' = ' + ris.base.toFixed(3) + (ris.tipo === 'voigt' ? ' · η = ' + ris.eta.toFixed(2) + t(' (0 gaussiana, 1 lorentziana)', ' (0 Gaussian, 1 Lorentzian)') : '') + ' · ' + ris.giri + t(' iterazioni', ' iterations') + '</div>';
      if (quale !== 'mio') h += '<div class="bsiFX-nota">' + t(ESEMPI[quale].nota[0], ESEMPI[quale].nota[1]) + '</div>';
      h += '<div class="bsiFX-nota" style="opacity:.9">' + t('Attenzione: una deconvoluzione non è unica. Aggiungendo componenti R² sale sempre; il numero giusto è quello che la derivata seconda e la chimica del campione giustificano. Guarda il residuo: se è solo rumore, non serve altro.', 'Warning: a deconvolution is not unique. Adding components always raises R²; the right number is the one justified by the second derivative and the chemistry of the sample. Look at the residual: if it is only noise, nothing more is needed.') + '</div>';
      out.innerHTML = h; mostra();
    }
    calcola(); F.alRidimensiona(mostra);
  }
  /* ── scheda: le tre forme a confronto ── */
  function schedaForme(div) {
    var g = griglia(div), pan = g.pan, w = 20, eta = 0.5;
    F.cursore(pan, ['Larghezza a metà altezza', 'Full width at half maximum'], 5, 40, 1, w, function (v) { w = v; disegna(); });
    F.cursore(pan, ['η della pseudo-Voigt (quota lorentziana)', 'Pseudo-Voigt η (Lorentzian share)'], 0, 1, 0.05, eta, function (v) { eta = v; disegna(); }, function (v) { return v.toFixed(2); });
    var info = nota(pan), c = F.tela(g.dx, 0.6);
    function disegna() {
      var xs = [], G = [], L = [], V = [];
      for (var i = 0; i <= 400; i++) { var x = -100 + i * 0.5; xs.push(x); G.push(profilo(x, 1, 0, w, 'gauss', 0)); L.push(profilo(x, 1, 0, w, 'lorentz', 0)); V.push(profilo(x, 1, 0, w, 'voigt', eta)); }
      F.grafico(c, { serie: [{ x: xs, y: G, col: COL[0] }, { x: xs, y: L, col: COL[1] }, { x: xs, y: V, col: COL[2], tratt: true }], xl: ['x − centro', 'x − centre'], yl: ['intensità (altezza 1)', 'intensity (height 1)'], ymin: 0,
        legenda: [{ col: COL[0], etich: ['gaussiana', 'Gaussian'] }, { col: COL[1], etich: ['lorentziana', 'Lorentzian'] }, { col: COL[2], etich: ['pseudo-Voigt', 'pseudo-Voigt'] }] });
      info.innerHTML = t('Stessa altezza e stessa larghezza, aree diverse:', 'Same height and same width, different areas:') + '<br>' +
        t('gaussiana', 'Gaussian') + ' = h·w·√(π/4 ln 2) = <b class="bsiFX-num">' + area(1, w, 'gauss').toFixed(2) + '</b><br>' +
        t('lorentziana', 'Lorentzian') + ' = h·w·π/2 = <b class="bsiFX-num">' + area(1, w, 'lorentz').toFixed(2) + '</b> (' + t('il ', '') + (area(1, w, 'lorentz') / area(1, w, 'gauss') * 100 - 100).toFixed(0) + t(' % in più: le code)', ' % more: the tails)') + '<br>' +
        'pseudo-Voigt = <b class="bsiFX-num">' + area(1, w, 'voigt', eta).toFixed(2) + '</b><br>' +
        t('La gaussiana viene da tante cause indipendenti che allargano la riga (ambienti diversi, strumento); la lorentziana dalla vita finita dello stato eccitato. Nelle righe vere agiscono entrambe: la forma di Voigt, qui approssimata dalla miscela.', 'The Gaussian comes from many independent causes that broaden the line (different environments, the instrument); the Lorentzian from the finite lifetime of the excited state. In real lines both act: the Voigt shape, approximated here by the mixture.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.calcolo.mappe = { tsne: tsne, probabilita: probabilita, conservazione: conservazione, purezza: purezza, distanze: distanze, gruppiSintetici: gruppiSintetici, pca2: pca2, mdsClassico: mdsClassico,
    esempio: esempio, FAMIGLIE: FAMIGLIE, distanzeTanimoto: distanzeTanimoto, rng: rng };
  F.calcolo.deconv = { profilo: profilo, area: area, modello: modello, stime: stime, deconvolvi: deconvolvi, sintetico: sintetico, ESEMPI: ESEMPI, datiEsempio: datiEsempio, leggiXY: leggiXY };

  F.sezione('sspaziochim', {
    titolo: ['🗺️ Mappa dello spazio chimico', '🗺️ Chemical space map'],
    sotto: ['Le molecole su un piano, vicine se si somigliano: il t-SNE sulle impronte di Morgan e le distanze di Tanimoto, a confronto con la PCA, con la misura di quanto la mappa conserva i vicinati.',
            'Molecules on a plane, close if they are alike: t-SNE on Morgan fingerprints and Tanimoto distances, compared with PCA, with the measure of how well the map keeps neighbourhoods.'],
    schede: [
      { nome: ['La mappa', 'The map'], costruisci: schedaMappa },
      { nome: ['Capire il t-SNE', 'Understanding t-SNE'], costruisci: schedaCapire },
      { nome: ['Le tue molecole', 'Your molecules'], costruisci: schedaTue }
    ]
  });
  F.sezione('sdeconv', {
    titolo: ['📈 Deconvoluzione di picchi', '📈 Peak deconvolution'],
    sotto: ['Bande sovrapposte separate in componenti gaussiane, lorentziane o pseudo-Voigt con i minimi quadrati di Levenberg–Marquardt: centro, larghezza, altezza e area di ogni componente, sui dati d’esempio o sui tuoi.',
            'Overlapping bands separated into Gaussian, Lorentzian or pseudo-Voigt components by Levenberg–Marquardt least squares: centre, width, height and area of each component, on example data or your own.'],
    schede: [
      { nome: ['Deconvoluzione', 'Deconvolution'], costruisci: schedaDeconv },
      { nome: ['Le forme di riga', 'Line shapes'], costruisci: schedaForme }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
