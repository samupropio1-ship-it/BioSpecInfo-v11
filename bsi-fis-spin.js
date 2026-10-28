/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-spin.js — 🌀 spin, qubit ed entanglement
   BioSpecInfo · © Samuele Pio Provenzano

   La meccanica quantistica dello spin ½ e' il «sistema a due livelli» per
   eccellenza: e' il qubit dei computer quantistici, il fotone polarizzato
   della crittografia, la coppia di particelle di Bell. Qui lo si fa
   accadere, una particella alla volta:

   · STERN–GERLACH: un forno spara atomi d'argento (spin ½ non polarizzato)
     attraverso fino a tre magneti orientati nel piano trasverso, angolo θ
     dall'asse z. Ogni magnete divide il fascio in due; si tiene un canale e
     si blocca l'altro. Dopo una misura lungo n, la probabilita' di uscire
     «su» lungo n' e' (1 + n·n')/2 = cos²(Δθ/2): la sequenza z → x → z
     ridà il 50 % di «giu'» che la prima misura aveva eliminato. In 3D,
     con gli atomi uno per uno (generatore riproducibile mulberry32) e i
     contatori che convergono ai valori attesi;
   · LA SFERA DI BLOCH: lo stato |ψ⟩ = α|0⟩ + β|1⟩ e' un punto della sfera,
     (x, y, z) = (2Re ᾱβ, 2Im ᾱβ, |α|² − |β|²). Ogni porta a un qubit e'
     una rotazione: dalla matrice U si ricavano asse e angolo
     (U = e^{iγ}(cos(φ/2) I − i sin(φ/2) n·σ)) e il vettore ruota davvero,
     con la scia. Porte X, Y, Z, H, S, S†, T, T†, Rx, Ry, Rz e la misura
     (collasso con la regola di Born);
   · BELL E CHSH: coppie nello stato di singoletto, E(a, b) = −cos(a − b).
     S = E(a,b) − E(a,b') + E(a',b) + E(a',b') arriva a 2√2 (limite di
     Tsirelson), mentre ogni modello a variabili nascoste locali sta entro
     |S| ≤ 2. Le due cose simulate coppia per coppia, fianco a fianco;
   · BB84: Alice manda fotoni in basi casuali (+ o ×), Bob misura in basi
     casuali, si tengono i bit con la stessa base (circa meta'). Una spia
     che intercetta e rispedisce introduce un tasso d'errore QBER = 25 %
     sui bit intercettati: la si scopre. Sotto l'11 % la chiave si salva
     con correzione d'errore e amplificazione della privatezza
     (r = 1 − 2h(Q), Shor–Preskill).

   I calcoli (F.calcolo.spin) sono funzioni pure: numeri complessi come
   coppie [re, im], matrici 2×2 di complessi; il banco li verifica in node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI;

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* numeri complessi [re, im] */
  function cx(re, im) { return [re, im || 0]; }
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  function cadd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function csub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function cconj(a) { return [a[0], -a[1]]; }
  function cabs2(a) { return a[0] * a[0] + a[1] * a[1]; }
  function cdiv(a, b) { var d = cabs2(b); return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function csqrt(a) { var r = Math.sqrt(Math.hypot(a[0], a[1])), f = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(f), r * Math.sin(f)]; }
  function cexp(f) { return [Math.cos(f), Math.sin(f)]; }
  /* matrici 2×2 */
  function mm(A, B) {
    return [[cadd(cmul(A[0][0], B[0][0]), cmul(A[0][1], B[1][0])), cadd(cmul(A[0][0], B[0][1]), cmul(A[0][1], B[1][1]))],
      [cadd(cmul(A[1][0], B[0][0]), cmul(A[1][1], B[1][0])), cadd(cmul(A[1][0], B[0][1]), cmul(A[1][1], B[1][1]))]];
  }
  function dag(A) { return [[cconj(A[0][0]), cconj(A[1][0])], [cconj(A[0][1]), cconj(A[1][1])]]; }
  function applica(U, p) { return [cadd(cmul(U[0][0], p[0]), cmul(U[0][1], p[1])), cadd(cmul(U[1][0], p[0]), cmul(U[1][1], p[1]))]; }
  var R2 = Math.SQRT1_2, O = cx(0), U1 = cx(1), I1 = cx(0, 1);
  var PORTE = {
    I: [[U1, O], [O, U1]],
    X: [[O, U1], [U1, O]],
    Y: [[O, cx(0, -1)], [I1, O]],
    Z: [[U1, O], [O, cx(-1)]],
    H: [[cx(R2), cx(R2)], [cx(R2), cx(-R2)]],
    S: [[U1, O], [O, I1]],
    Sd: [[U1, O], [O, cx(0, -1)]],
    T: [[U1, O], [O, cexp(PI / 4)]],
    Td: [[U1, O], [O, cexp(-PI / 4)]]
  };
  function Rx(f) { var c = Math.cos(f / 2), s = Math.sin(f / 2); return [[cx(c), cx(0, -s)], [cx(0, -s), cx(c)]]; }
  function Ry(f) { var c = Math.cos(f / 2), s = Math.sin(f / 2); return [[cx(c), cx(-s)], [cx(s), cx(c)]]; }
  function Rz(f) { return [[cexp(-f / 2), O], [O, cexp(f / 2)]]; }
  /* uguaglianza di due matrici, esatta o a meno di una fase globale */
  function distanza(A, B, fase) {
    var k = U1;
    if (fase) { /* la fase dall'elemento piu' grande di B */
      var mi = 0, mj = 0, mx = -1; for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) if (cabs2(B[i][j]) > mx) { mx = cabs2(B[i][j]); mi = i; mj = j; }
      k = cdiv(A[mi][mj], B[mi][mj]);
    }
    var d = 0; for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) d = Math.max(d, Math.sqrt(cabs2(csub(A[i][j], cmul(k, B[i][j])))));
    return d;
  }
  function bloch(p) { var ab = cmul(cconj(p[0]), p[1]); return [2 * ab[0], 2 * ab[1], cabs2(p[0]) - cabs2(p[1])]; }
  function normalizza(p) { var n = Math.sqrt(cabs2(p[0]) + cabs2(p[1])); return [[p[0][0] / n, p[0][1] / n], [p[1][0] / n, p[1][1] / n]]; }
  /* stato dal punto della sfera: cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ */
  function statoDa(th, ph) { return [cx(Math.cos(th / 2)), [Math.sin(th / 2) * Math.cos(ph), Math.sin(th / 2) * Math.sin(ph)]]; }
  /* asse e angolo della rotazione di Bloch di una porta U (tolta la fase globale) */
  function asseAngolo(U) {
    var det = csub(cmul(U[0][0], U[1][1]), cmul(U[0][1], U[1][0])), q = csqrt(det);
    var V = [[cdiv(U[0][0], q), cdiv(U[0][1], q)], [cdiv(U[1][0], q), cdiv(U[1][1], q)]];
    var c = (V[0][0][0] + V[1][1][0]) / 2, sx = -(V[0][1][1] + V[1][0][1]) / 2, sy = (V[1][0][0] - V[0][1][0]) / 2, sz = -(V[0][0][1] - V[1][1][1]) / 2;
    if (c < 0) { c = -c; sx = -sx; sy = -sy; sz = -sz; }
    var s = Math.sqrt(sx * sx + sy * sy + sz * sz);
    return { n: s > 1e-12 ? [sx / s, sy / s, sz / s] : [0, 0, 1], angolo: 2 * Math.atan2(s, c) };
  }
  /* rotazione di Rodrigues del vettore v intorno all'asse unitario n */
  function ruota(v, n, a) {
    var c = Math.cos(a), s = Math.sin(a), d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2];
    var cr = [n[1] * v[2] - n[2] * v[1], n[2] * v[0] - n[0] * v[2], n[0] * v[1] - n[1] * v[0]];
    return [v[0] * c + cr[0] * s + n[0] * d * (1 - c), v[1] * c + cr[1] * s + n[1] * d * (1 - c), v[2] * c + cr[2] * s + n[2] * d * (1 - c)];
  }
  /* la misura nella base computazionale: esito e stato dopo il collasso */
  function misura(p, rnd) { var p0 = cabs2(p[0]); return rnd() < p0 ? { esito: 0, stato: [U1, O] } : { esito: 1, stato: [O, U1] }; }

  /* Stern–Gerlach: magneti nel piano xz, angolo θ dall'asse z; tieni = +1 o −1 */
  function sgDir(gradi) { var a = gradi * PI / 180; return [Math.sin(a), 0, Math.cos(a)]; }
  function sgProb(s, n) { return (1 + s[0] * n[0] + s[1] * n[1] + s[2] * n[2]) / 2; }
  function sgAtomo(magneti, rnd) {
    var s = null, esiti = [];
    for (var k = 0; k < magneti.length; k++) {
      var n = sgDir(magneti[k].th), p = s ? sgProb(s, n) : 0.5, e = rnd() < p ? 1 : -1;
      esiti.push(e); s = [e * n[0], e * n[1], e * n[2]];
      if (k < magneti.length - 1 && e !== magneti[k].tieni) return { esiti: esiti, fermato: k };
    }
    return { esiti: esiti, fermato: -1 };
  }
  function sgAttesi(magneti) {
    var out = [], pin = 1, s = null;
    for (var k = 0; k < magneti.length; k++) {
      var n = sgDir(magneti[k].th), pp = s ? sgProb(s, n) : 0.5;
      out.push({ entra: pin, piu: pin * pp, meno: pin * (1 - pp) });
      var tk = magneti[k].tieni; pin = tk === 1 ? pin * pp : pin * (1 - pp); s = [tk * n[0], tk * n[1], tk * n[2]];
    }
    return out;
  }
  function sgSimula(magneti, N, seme) {
    var rnd = mulberry32(seme || 1), c = magneti.map(function () { return { piu: 0, meno: 0 }; });
    for (var i = 0; i < N; i++) { var a = sgAtomo(magneti, rnd); a.esiti.forEach(function (e, k) { if (e > 0) c[k].piu++; else c[k].meno++; }); }
    return c;
  }

  /* Bell / CHSH: singoletto, E(a,b) = −cos(a−b); modello locale: A = sgn cos(a−λ), B = −sgn cos(b−λ) */
  function Equant(a, b) { return -Math.cos(a - b); }
  function Elocale(a, b) { var d = Math.abs((((a - b) % (2 * PI)) + 3 * PI) % (2 * PI) - PI); return -1 + 2 * d / PI; }
  function chsh(E, a, a2, b, b2) { return E(a, b) - E(a, b2) + E(a2, b) + E(a2, b2); }
  function sgn(x) { return x >= 0 ? 1 : -1; }
  /* N coppie: per ogni coppia una delle 4 combinazioni a caso; restituisce le 4 correlazioni e S, per i due modelli */
  function chshSimula(ang, N, seme, conteggi) {
    var rnd = mulberry32(seme || 3), A = [ang[0], ang[1]], B = [ang[2], ang[3]];
    var c = conteggi || { q: [[0, 0], [0, 0], [0, 0], [0, 0]], l: [[0, 0], [0, 0], [0, 0], [0, 0]] };
    for (var i = 0; i < N; i++) {
      var ia = rnd() < 0.5 ? 0 : 1, ib = rnd() < 0.5 ? 0 : 1, k = ia * 2 + ib, d = A[ia] - B[ib];
      /* quantistico: A a caso, B = −A con probabilita' cos²(Δ/2) */
      var x = rnd() < 0.5 ? 1 : -1, y = rnd() < Math.pow(Math.cos(d / 2), 2) ? -x : x;
      c.q[k][0] += x * y; c.q[k][1]++;
      /* variabile nascosta λ uniforme */
      var lam = 2 * PI * rnd();
      c.l[k][0] += sgn(Math.cos(A[ia] - lam)) * -sgn(Math.cos(B[ib] - lam)); c.l[k][1]++;
    }
    return c;
  }
  function chshDa(c) { var E = c.map(function (v) { return v[1] ? v[0] / v[1] : 0; }); return { E: E, S: E[0] - E[1] + E[2] + E[3] }; }
  /* il massimo di |S| sulle 16 strategie deterministiche locali (A, A', B, B' = ±1) */
  function chshDeterministico() { var m = 0; for (var k = 0; k < 16; k++) { var a = k & 1 ? 1 : -1, a2 = k & 2 ? 1 : -1, b = k & 4 ? 1 : -1, b2 = k & 8 ? 1 : -1; m = Math.max(m, Math.abs(a * b - a * b2 + a2 * b + a2 * b2)); } return m; }

  /* BB84 con spia che intercetta e rispedisce (frazione pEve) e rumore del canale */
  function bb84(N, pEve, rumore, seme) {
    var rnd = mulberry32(seme || 5), tenuti = 0, errori = 0, intercettati = 0, primi = [];
    for (var i = 0; i < N; i++) {
      var a = rnd() < 0.5 ? 0 : 1, ba = rnd() < 0.5 ? 0 : 1, fb = ba, fbit = a, be = -1, eb = -1;
      if (rnd() < pEve) { intercettati++; be = rnd() < 0.5 ? 0 : 1; eb = be === fb ? fbit : (rnd() < 0.5 ? 0 : 1); fb = be; fbit = eb; }
      var bb = rnd() < 0.5 ? 0 : 1, b = bb === fb ? fbit : (rnd() < 0.5 ? 0 : 1);
      if (rnd() < rumore) b = 1 - b;
      var tiene = bb === ba, err = tiene && b !== a;
      if (tiene) { tenuti++; if (err) errori++; }
      if (primi.length < 40) primi.push({ a: a, ba: ba, be: be, eb: eb, bb: bb, b: b, tiene: tiene, err: err });
    }
    return { N: N, tenuti: tenuti, errori: errori, frazione: tenuti / N, qber: tenuti ? errori / tenuti : 0, intercettati: intercettati, primi: primi };
  }
  function qberAtteso(pEve, rumore) { var q = pEve / 4; return q * (1 - rumore) + (1 - q) * rumore; }
  function h2(p) { return p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); }
  function tassoSegreto(Q) { return Math.max(0, 1 - 2 * h2(Q)); }

  F.calcolo.spin = {
    mulberry32: mulberry32, cmul: cmul, mm: mm, dag: dag, applica: applica, PORTE: PORTE, Rx: Rx, Ry: Ry, Rz: Rz, distanza: distanza,
    bloch: bloch, statoDa: statoDa, normalizza: normalizza, asseAngolo: asseAngolo, ruota: ruota, misura: misura,
    sgDir: sgDir, sgProb: sgProb, sgAtomo: sgAtomo, sgAttesi: sgAttesi, sgSimula: sgSimula,
    Equant: Equant, Elocale: Elocale, chsh: chsh, chshSimula: chshSimula, chshDa: chshDa, chshDeterministico: chshDeterministico,
    bb84: bb84, qberAtteso: qberAtteso, h2: h2, tassoSegreto: tassoSegreto
  };

  /* ═══ interfaccia ═══════════════════════════════════════════════════════ */
  if (!globale.document || !globale.document.createElement) return;
  var D = globale.document;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function eq(pan, testo) { var e = F.el('div', { 'class': 'bsiFX-eq', testo: testo }); pan.appendChild(e); return e; }
  /* la scheda 3D: pannello subito, scena quando three.js e' pronto; la costruzione della scena in un compito separato */
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
        var S = new L3.Scena(destra, 0.66);
        /* una scena in una scheda nascosta non si ridimensiona (larghezza 0 → 600 px e ritorno: due
           riallocazioni del framebuffer a ogni evento resize, centinaia di ms senza GPU) */
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  /* un'etichetta 3D che si puo' riscrivere (contatori) */
  function etichettaViva(T, alt, col) {
    var c = D.createElement('canvas'); c.width = 256; c.height = 64;
    var q = c.getContext('2d'), tx = new T.CanvasTexture(c); tx.minFilter = T.LinearFilter;
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true })); sp.scale.set(alt * 4, alt, 1); sp.renderOrder = 12;
    var ult = null;
    sp.scrivi = function (s) { if (s === ult) return; ult = s; q.clearRect(0, 0, 256, 64); q.fillStyle = 'rgba(8,21,34,.75)'; q.fillRect(0, 8, 256, 48); q.font = 'bold 34px system-ui,sans-serif'; q.fillStyle = col || '#e6fffb'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(s, 128, 33); tx.needsUpdate = true; };
    return sp;
  }
  function bagliore(T, col, dim) {
    var c = D.createElement('canvas'); c.width = c.height = 64; var q = c.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 64, 64);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), color: col, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.scale.set(dim, dim, 1); return sp;
  }

  /* ─── 1. Stern–Gerlach ─────────────────────────────────────────────────── */
  function schedaSG(pan, destra) {
    var st = { n: 3, mag: [{ th: 0, tieni: 1 }, { th: 90, tieni: 1 }, { th: 0, tieni: 1 }], rate: 25, seme: 1 };
    var PRESET = {
      zxz: [[0, 1], [90, 1], [0, 1]], zz: [[0, 1], [0, 1], [0, 1]], z60: [[0, 1], [60, 1], [120, 1]], zmz: [[0, 1], [0, -1]], zx: [[0, 1], [90, 1]], zt: [[0, 1], [45, 1], [90, 1]]
    };
    var cont = F.el('div'), info;
    eq(pan, 'P(+n′ | +n) = (1 + n·n′)/2 = cos²(Δθ/2)');
    F.scelta(pan, ['Esperimento', 'Experiment'], [['zxz', t('z → x → z (la memoria si cancella)', 'z → x → z (memory is erased)')], ['zz', t('z → z → z (misure ripetute)', 'z → z → z (repeated measurements)')], ['zx', t('z → x', 'z → x')], ['zt', t('z → 45° → 90°', 'z → 45° → 90°')], ['z60', t('z → 60° → 120°', 'z → 60° → 120°')], ['zmz', t('z, tieni giù → z', 'z, keep down → z')]], 'zxz', function (v) {
      st.mag = PRESET[v].map(function (p) { return { th: p[0], tieni: p[1] }; }); st.n = st.mag.length; comandi(); ricomincia();
    });
    pan.appendChild(cont);
    F.cursore(pan, ['Atomi al secondo', 'Atoms per second'], 2, 200, 1, st.rate, function (v) { st.rate = v; });
    F.bottone(pan, ['Azzera i contatori', 'Reset counters'], function () { st.seme++; ricomincia(); });
    info = nota(pan);
    nota(pan, t('Il forno emette atomi d’argento con spin ½ non polarizzato: al primo magnete metà va su, metà giù, e nessuna regola dice quale. Il canale scartato finisce su un bersaglio (contatore rosso). Una misura lungo x dopo una lungo z «dimentica» z: il terzo magnete ritrova il 50 % di giù. I contatori seguono le frequenze, che convergono alle probabilità cos²(Δθ/2) come 1/√N.',
      'The oven emits silver atoms with unpolarised spin ½: at the first magnet half go up, half down, and no rule says which. The rejected channel ends on a beam stop (red counter). A measurement along x after one along z «forgets» z: the third magnet finds 50 % down again. Counters follow frequencies, which converge to the probabilities cos²(Δθ/2) as 1/√N.'));
    var tela = F.tela(destra, 0.42);
    var cb = { cambia: null };
    function comandi() {
      cont.innerHTML = '';
      st.mag.forEach(function (m, k) {
        F.cursore(cont, [t('Magnete ', 'Magnet ') + (k + 1) + ': θ (°)', t('Magnete ', 'Magnet ') + (k + 1) + ': θ (°)'], 0, 180, 15, m.th, function (v) { m.th = v; ricomincia(); });
        if (k < st.mag.length - 1) F.scelta(cont, [t('Magnete ', 'Magnet ') + (k + 1) + t(': canale tenuto', ': channel kept'), t('Magnete ', 'Magnet ') + (k + 1) + t(': canale tenuto', ': channel kept')], [['1', t('+ (su lungo n)', '+ (up along n)')], ['-1', t('− (giù lungo n)', '− (down along n)')]], String(m.tieni), function (v) { m.tieni = +v; ricomincia(); });
      });
    }
    comandi();
    var conta = null;
    function ricomincia() { conta = { emessi: 0, stadi: st.mag.map(function () { return { piu: 0, meno: 0 }; }) }; if (cb.cambia) cb.cambia(); grafico(); }
    function grafico() {
      var P = F.pennello(tela), q = P.q, W = P.W, H = P.H, att = sgAttesi(st.mag), n = Math.max(1, conta.emessi);
      var voci = [];
      st.mag.forEach(function (m, k) {
        var ult = k === st.mag.length - 1;
        voci.push({ et: (k + 1) + '+', v: conta.stadi[k].piu / n, a: att[k].piu, col: ult || m.tieni === 1 ? '#5eead4' : '#ff8a80' });
        voci.push({ et: (k + 1) + '−', v: conta.stadi[k].meno / n, a: att[k].meno, col: ult || m.tieni === -1 ? '#6bcfff' : '#ff8a80' });
      });
      var m0 = 44, bw = (W - m0 - 12) / voci.length, y0 = H - 30, hh = H - 58;
      q.font = '11px system-ui,sans-serif'; q.strokeStyle = '#1d2f49'; q.fillStyle = '#8494a8'; q.textAlign = 'right';
      [0, 0.25, 0.5].forEach(function (v) { var y = y0 - v / 0.5 * hh; q.beginPath(); q.moveTo(m0, y); q.lineTo(W - 8, y); q.stroke(); q.fillText(Math.round(v * 100) + ' %', m0 - 4, y + 4); });
      voci.forEach(function (b, i) {
        var x = m0 + i * bw + bw * 0.18, w = bw * 0.64, hv = Math.min(1, b.v / 0.5) * hh, ha = Math.min(1, b.a / 0.5) * hh;
        q.fillStyle = b.col; q.globalAlpha = 0.8; q.fillRect(x, y0 - hv, w, hv); q.globalAlpha = 1;
        q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.beginPath(); q.moveTo(x - 3, y0 - ha); q.lineTo(x + w + 3, y0 - ha); q.stroke(); q.lineWidth = 1;
        q.fillStyle = '#cfe3f7'; q.textAlign = 'center'; q.fillText(b.et, x + w / 2, y0 + 14);
      });
      q.fillStyle = '#aebccd'; q.textAlign = 'left';
      q.fillText(t('frazione degli atomi emessi (N = ', 'fraction of emitted atoms (N = ') + conta.emessi + ')   ', m0, 14);
      q.fillStyle = '#ffd24a'; q.fillText(t('— atteso', '— expected'), W - 80, 14);
      tela.setAttribute('aria-label', t('Conteggi Stern–Gerlach per canale contro le probabilità attese', 'Stern–Gerlach counts per channel against expected probabilities'));
      var ult = st.mag.length - 1, nIn = conta.stadi[ult].piu + conta.stadi[ult].meno;
      info.innerHTML = t('Emessi: ', 'Emitted: ') + '<b>' + conta.emessi + '</b> · ' + t('all’ultimo magnete: ', 'at the last magnet: ') + '<b>' + nIn + '</b> (' + t('atteso ', 'expected ') + fmt(att[ult].entra * 100) + ' %)<br>' +
        t('Ultimo magnete: su ', 'Last magnet: up ') + '<b>' + (nIn ? fmt(100 * conta.stadi[ult].piu / nIn) : '—') + ' %</b> ' + t('contro ', 'vs ') + fmt(100 * att[ult].piu / Math.max(1e-12, att[ult].entra)) + ' % ' + t('previsto', 'predicted');
    }
    ricomincia();
    return {
      tre: function (S, T, L3) {
        var rnd = mulberry32(1000 + st.seme), gruppo = new T.Group(); S.aggiungi(gruppo);
        var MAX = 160, atomi = [], pool = new T.InstancedMesh(new T.SphereGeometry(0.075, 12, 8), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x335577, roughness: 0.3, metalness: 0.4 }), MAX);
        pool.instanceMatrix.setUsage(T.DynamicDrawUsage); S.aggiungi(pool);
        var M4 = new T.Matrix4(), ZERO = new T.Matrix4().makeScale(0, 0, 0), colA = new T.Color();
        for (var i = 0; i < MAX; i++) { pool.setMatrixAt(i, ZERO); pool.setColorAt(i, colA.set(0xc9d3df)); }
        var SP = 4000, spPos = new Float32Array(SP * 3), spCol = new Float32Array(SP * 3), spG = new T.BufferGeometry(), nSp = 0;
        spG.setAttribute('position', new T.BufferAttribute(spPos, 3)); spG.setAttribute('color', new T.BufferAttribute(spCol, 3)); spG.setDrawRange(0, 0);
        S.aggiungi(new T.Points(spG, new T.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })));
        var geo = null, etich = [], accumulo = 0;
        function y0(k) { return -5 + 4.2 * k; }
        function costruisciApparato() {
          S.radice.remove(gruppo); gruppo.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material && x.material.dispose) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } });
          gruppo = new T.Group(); S.aggiungi(gruppo); etich = [];
          var centri = [], c = [0, 0], nm = st.mag.length;
          /* il forno */
          var forno = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 1.2, 32), new T.MeshStandardMaterial({ color: 0x8a6a4a, metalness: 0.6, roughness: 0.4 })); forno.position.set(0, -7.6, 0); gruppo.add(forno);
          var bocca = bagliore(T, 0xffa040, 1.1); bocca.position.set(0, -6.95, 0); gruppo.add(bocca);
          var tf = L3.testo3d(T, t('forno Ag', 'Ag oven'), '#ffcf99', 0.32); tf.position.set(0, -7.6, 0.95); gruppo.add(tf);
          var MatN = new T.MeshStandardMaterial({ color: 0xd94a4a, metalness: 0.55, roughness: 0.35 }), MatS = new T.MeshStandardMaterial({ color: 0x3f7fd9, metalness: 0.55, roughness: 0.35 }), MatG = new T.MeshStandardMaterial({ color: 0x55606e, metalness: 0.7, roughness: 0.45 });
          var percorsi = [];
          for (var k = 0; k < nm; k++) {
            var m = st.mag[k], a = m.th * PI / 180, n = [Math.sin(a), Math.cos(a)];
            centri.push(c.slice());
            var g = new T.Group(); g.position.set(c[0], y0(k), c[1]); g.rotation.y = a;
            var nord = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 1.6, 3, 1, false, PI), MatN); nord.position.z = 0.62; g.add(nord);
            var sud1 = new T.Mesh(new T.BoxGeometry(0.34, 1.6, 0.42), MatS); sud1.position.set(-0.3, 0, -0.62); g.add(sud1);
            var sud2 = sud1.clone(); sud2.position.x = 0.3; g.add(sud2);
            var giogo = new T.Mesh(new T.BoxGeometry(0.3, 1.6, 2.2), MatG); giogo.position.set(-1.02, 0, 0); g.add(giogo);
            var b1 = new T.Mesh(new T.BoxGeometry(0.75, 1.6, 0.25), MatG); b1.position.set(-0.7, 0, 0.98); g.add(b1);
            var b2 = b1.clone(); b2.position.z = -0.98; g.add(b2);
            var fr = L3.freccia(T, [0, 0, 0.0], [0, 0, 0.95], 0xffd24a, 0.22); fr.position.set(0.55, 0.85, -0.45); g.add(fr);
            gruppo.add(g);
            var te = L3.testo3d(T, 'θ = ' + m.th + '°', '#ffd24a', 0.3); te.position.set(c[0] + 1.4 * Math.cos(a), y0(k), c[1] - 1.4 * Math.sin(a) + 1.2); gruppo.add(te);
            /* i due canali: deviazione D lungo ±n al piano d'arresto */
            var D = 0.9, yS = y0(k) + 2.4, ult = k === nm - 1, yF = ult ? y0(k) + 2.6 : yS;
            [1, -1].forEach(function (s) {
              var fine = [c[0] + s * D * n[0], c[1] + s * D * n[1]];
              percorsi.push([[c[0], y0(k) - 0.8, c[1]], [c[0] + s * 0.18 * n[0], y0(k) + 0.8, c[1] + s * 0.18 * n[1]], [fine[0], yF, fine[1]]]);
              if (!ult && s !== m.tieni) {
                var stop = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.08, 24), new T.MeshStandardMaterial({ color: 0x40202a, emissive: 0x401018, roughness: 0.8 })); stop.position.set(fine[0], yS, fine[1]); gruppo.add(stop);
                var e = etichettaViva(T, 0.34, '#ff8a80'); e.position.set(fine[0] + s * 0.55 * n[0], yS, fine[1] + s * 0.55 * n[1] + 0.35); gruppo.add(e); etich.push({ sp: e, k: k, s: s });
              }
            });
            if (!ult) c = [c[0] + m.tieni * D * n[0], c[1] + m.tieni * D * n[1]];
            else {
              var ys = y0(k) + 2.6, schermo = new T.Mesh(new T.PlaneGeometry(4.6, 4.6), new T.MeshStandardMaterial({ color: 0x14243a, side: T.DoubleSide, roughness: 0.9, transparent: true, opacity: 0.85 }));
              schermo.rotation.x = PI / 2; schermo.position.set(c[0], ys + 0.02, c[1]); gruppo.add(schermo);
              [1, -1].forEach(function (s) { var e = etichettaViva(T, 0.38, s > 0 ? '#5eead4' : '#6bcfff'); e.position.set(c[0] + s * 1.6 * n[0], ys + 0.3, c[1] + s * 1.6 * n[1] + 0.45); gruppo.add(e); etich.push({ sp: e, k: k, s: s }); });
            }
          }
          /* le tracce dei canali possibili, tenui */
          var lp = []; percorsi.forEach(function (p) { lp.push(p[0][0], p[0][1], p[0][2], p[1][0], p[1][1], p[1][2], p[1][0], p[1][1], p[1][2], p[2][0], p[2][1], p[2][2]); });
          lp.push(0, -6.9, 0, 0, y0(0) - 0.8, 0);
          var gl = new T.BufferGeometry(); gl.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
          gruppo.add(new T.LineSegments(gl, new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.18 })));
          geo = { centri: centri, ultimoY: y0(nm - 1) + 2.6 };
          S.didascalia.textContent = t('Stern–Gerlach: ', 'Stern–Gerlach: ') + st.mag.map(function (m) { return m.th + '°'; }).join(' → ') + t(' · atomi uno per uno', ' · atoms one by one');
        }
        function percorso(a) {
          /* punti di passaggio di un atomo: forno, poi ogni magnete (entrata, uscita, piano d'arresto) */
          var pts = [[0, -6.9, 0]], c = [0, 0], nm = st.mag.length;
          for (var k = 0; k < a.esiti.length; k++) {
            var m = st.mag[k], an = m.th * PI / 180, n = [Math.sin(an), Math.cos(an)], s = a.esiti[k], ult = k === nm - 1;
            pts.push([c[0], y0(k) - 0.8, c[1]]);
            for (var j = 1; j <= 4; j++) { var u = j / 4; pts.push([c[0] + s * 0.18 * n[0] * u * u, y0(k) - 0.8 + 1.6 * u, c[1] + s * 0.18 * n[1] * u * u]); }
            var yF = ult ? y0(k) + 2.6 : y0(k) + 2.4, f = [c[0] + s * 0.9 * n[0], c[1] + s * 0.9 * n[1]];
            pts.push([f[0], yF, f[1]]);
            c = f;
          }
          return pts;
        }
        function emetti() {
          var a = sgAtomo(st.mag, rnd); conta.emessi++;
          a.esiti.forEach(function (e, k) { if (e > 0) conta.stadi[k].piu++; else conta.stadi[k].meno++; });
          var pts = percorso(a), lun = [0];
          for (var i = 1; i < pts.length; i++) lun.push(lun[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
          var libero = -1; for (i = 0; i < MAX; i++) if (!atomi[i]) { libero = i; break; }
          if (libero < 0) { arriva(a, pts); return; }
          atomi[libero] = { pts: pts, lun: lun, d: 0, a: a, seg: 0 };
        }
        function arriva(a, pts) {
          if (a.fermato < 0 && nSp < SP) {
            var p = pts[pts.length - 1], s = a.esiti[a.esiti.length - 1], g1 = Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * PI * rnd()), g2 = Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * PI * rnd());
            spPos[3 * nSp] = p[0] + 0.09 * g1; spPos[3 * nSp + 1] = p[1]; spPos[3 * nSp + 2] = p[2] + 0.09 * g2;
            if (s > 0) { spCol[3 * nSp] = 0.37; spCol[3 * nSp + 1] = 0.92; spCol[3 * nSp + 2] = 0.83; } else { spCol[3 * nSp] = 0.42; spCol[3 * nSp + 1] = 0.81; spCol[3 * nSp + 2] = 1; }
            nSp++; spG.attributes.position.needsUpdate = true; spG.attributes.color.needsUpdate = true; spG.setDrawRange(0, nSp);
          }
        }
        function scriviEtichette() {
          etich.forEach(function (e) { var c = conta.stadi[e.k]; e.sp.scrivi((e.s > 0 ? '+ ' : '− ') + (e.s > 0 ? c.piu : c.meno)); });
        }
        cb.cambia = function () {
          for (var i = 0; i < MAX; i++) { atomi[i] = null; pool.setMatrixAt(i, ZERO); }
          pool.instanceMatrix.needsUpdate = true; nSp = 0; spG.setDrawRange(0, 0); rnd = mulberry32(1000 + st.seme);
          costruisciApparato(); scriviEtichette();
        };
        cb.cambia();
        var tGraf = 0, V = 7;
        S.ogniFotogramma(function (dt) {
          accumulo += dt * st.rate;
          var nuovi = 0; while (accumulo >= 1 && nuovi < 20) { accumulo -= 1; emetti(); nuovi++; }
          if (accumulo > 5) accumulo = 0;
          for (var i = 0; i < MAX; i++) {
            var A = atomi[i]; if (!A) continue;
            A.d += V * dt;
            var L = A.lun[A.lun.length - 1];
            if (A.d >= L) { atomi[i] = null; pool.setMatrixAt(i, ZERO); arriva(A.a, A.pts); continue; }
            while (A.lun[A.seg + 1] < A.d) A.seg++;
            var p = A.pts[A.seg], q = A.pts[A.seg + 1], u = (A.d - A.lun[A.seg]) / Math.max(1e-9, A.lun[A.seg + 1] - A.lun[A.seg]);
            M4.makeTranslation(p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u); pool.setMatrixAt(i, M4);
            /* il colore dice l'ultimo esito misurato */
            var k = -1; for (var j = 0; j < A.a.esiti.length; j++) if (p[1] >= y0(j) + 0.8 - 1e-6) k = j;
            pool.setColorAt(i, colA.set(k < 0 ? 0xc9d3df : A.a.esiti[k] > 0 ? 0x5eead4 : 0x6bcfff));
          }
          pool.instanceMatrix.needsUpdate = true; if (pool.instanceColor) pool.instanceColor.needsUpdate = true;
          tGraf += dt; if (tGraf > 0.25) { tGraf = 0; scriviEtichette(); grafico(); }
          return true;
        });
        S.aggiungi(L3.assi(T, 1.2, ['x', 'y', 'z'], 0.25)).position.set(-3.2, -7.5, -1.6);
        S.inquadra(17, -0.35, 1.2);
      }
    };
  }

  /* ─── 2. La sfera di Bloch ─────────────────────────────────────────────── */
  var NOMI_PORTE = { X: 'X', Y: 'Y', Z: 'Z', H: 'H', S: 'S', Sd: 'S†', T: 'T', Td: 'T†' };
  function schedaBloch(pan, destra) {
    var st = { psi: [U1, O], coda: [], storia: [], ang: 90, seme: 7, colpi: 1000 };
    var rnd = mulberry32(st.seme);
    eq(pan, '|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩');
    var riga = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:2px' }); pan.appendChild(riga);
    Object.keys(NOMI_PORTE).forEach(function (k) { F.bottone(riga, [NOMI_PORTE[k], NOMI_PORTE[k]], function () { metti(PORTE[k], NOMI_PORTE[k]); }); });
    F.cursore(pan, ['Angolo delle rotazioni (°)', 'Rotation angle (°)'], 0, 360, 15, st.ang, function (v) { st.ang = v; });
    var riga2 = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:2px' }); pan.appendChild(riga2);
    ['x', 'y', 'z'].forEach(function (a) { F.bottone(riga2, ['R' + a + '(θ)', 'R' + a + '(θ)'], function () { var f = st.ang * PI / 180; metti(a === 'x' ? Rx(f) : a === 'y' ? Ry(f) : Rz(f), 'R' + a + '(' + st.ang + '°)'); }); });
    F.scelta(pan, ['Stato iniziale', 'Initial state'], [['0', '|0⟩'], ['1', '|1⟩'], ['p', '|+⟩'], ['m', '|−⟩'], ['i', '|+i⟩'], ['g', t('generico (θ = 60°, φ = 30°)', 'generic (θ = 60°, φ = 30°)')]], '0', function (v) {
      var S0 = { '0': [0, 0], '1': [PI, 0], p: [PI / 2, 0], m: [PI / 2, PI], i: [PI / 2, PI / 2], g: [PI / 3, PI / 6] }[v];
      st.coda = []; st.storia = []; st.psi = statoDa(S0[0], S0[1]); if (cb.reimposta) cb.reimposta(); testo();
    });
    var riga3 = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:2px' }); pan.appendChild(riga3);
    F.bottone(riga3, ['Misura (z)', 'Measure (z)'], function () { if (st.coda.length) return; var m = misura(st.psi, rnd); st.storia.push('M→' + m.esito); st.psi = m.stato; if (cb.reimposta) cb.reimposta(); testo(); });
    F.bottone(riga3, ['Sequenza H·T·H', 'Sequence H·T·H'], function () { metti(PORTE.H, 'H'); metti(PORTE.T, 'T'); metti(PORTE.H, 'H'); });
    var info = nota(pan);
    nota(pan, t('Ogni porta a un qubit è una rotazione della sfera: X, Y, Z sono mezzi giri intorno agli assi, H è mezzo giro intorno a (x + z)/√2, S e T sono quarti e ottavi di giro intorno a z. La fase globale non si vede sulla sfera (e non si misura). La misura lungo z dà 0 con probabilità |α|² = cos²(θ/2) e porta lo stato al polo.',
      'Every one-qubit gate is a rotation of the sphere: X, Y, Z are half turns about the axes, H is a half turn about (x + z)/√2, S and T are quarter and eighth turns about z. The global phase does not show on the sphere (and cannot be measured). Measuring along z gives 0 with probability |α|² = cos²(θ/2) and sends the state to the pole.'));
    var tela = F.tela(destra, 0.36);
    var cb = {};
    function metti(U, nome) { st.coda.push({ U: U, nome: nome }); if (cb.sveglia) cb.sveglia(); }
    function testo() {
      var p = st.psi, b = bloch(p), th = Math.acos(Math.max(-1, Math.min(1, b[2]))), ph = Math.atan2(b[1], b[0]);
      function c2s(z) { return fmt(+z[0].toFixed(4)) + (z[1] >= 0 ? ' + ' : ' − ') + fmt(Math.abs(+z[1].toFixed(4))) + 'i'; }
      info.innerHTML = 'α = <b>' + c2s(p[0]) + '</b><br>β = <b>' + c2s(p[1]) + '</b><br>' +
        'θ = ' + fmt(th * 180 / PI) + '°, φ = ' + fmt(ph * 180 / PI) + '° · |r| = ' + Math.hypot(b[0], b[1], b[2]).toFixed(6) + '<br>' +
        'P(0) = <b>' + fmt(cabs2(p[0])) + '</b>, P(1) = <b>' + fmt(cabs2(p[1])) + '</b><br>' + t('Circuito: ', 'Circuit: ') + (st.storia.length ? st.storia.slice(-12).join(' · ') : '—');
      /* istogramma di N misure simulate */
      var r2 = mulberry32(99 + st.storia.length), n0 = 0; for (var i = 0; i < st.colpi; i++) if (r2() < cabs2(p[0])) n0++;
      F.grafico(tela, { barre: [{ x: 0, y: n0 / st.colpi, col: '#5eead4', larg: 26 }, { x: 1, y: 1 - n0 / st.colpi, col: '#6bcfff', larg: 26 }], linee: [{ y: cabs2(p[0]), col: '#ffd24a', etich: 'P(0) = |α|²' }], xmin: -0.6, xmax: 1.6, ymin: 0, ymax: 1, xl: ['esito della misura in z (0 o 1)', 'z-measurement outcome (0 or 1)'], yl: ['frequenza su 1000', 'frequency over 1000'], descr: ['Istogramma di 1000 misure simulate del qubit', 'Histogram of 1000 simulated qubit measurements'] });
    }
    testo();
    return {
      tre: function (S, T, L3) {
        /* la sfera: vetro, meridiani e paralleli, equatore, assi con gli stati notevoli */
        S.aggiungi(new T.Mesh(new T.SphereGeometry(2, 64, 48), new T.MeshPhongMaterial({ color: 0x2a6fb0, transparent: true, opacity: 0.13, shininess: 80, depthWrite: false, side: T.DoubleSide })));
        var lp = [], i, j;
        for (i = 1; i < 6; i++) { var z = 2 * Math.cos(i * PI / 6), r = 2 * Math.sin(i * PI / 6); for (j = 0; j < 96; j++) { var a = 2 * PI * j / 96, b = 2 * PI * (j + 1) / 96; lp.push(r * Math.cos(a), r * Math.sin(a), z, r * Math.cos(b), r * Math.sin(b), z); } }
        for (i = 0; i < 12; i++) { var f = PI * i / 12; for (j = 0; j < 64; j++) { var u = PI * j / 64, v = PI * (j + 1) / 64; lp.push(2 * Math.sin(u) * Math.cos(f), 2 * Math.sin(u) * Math.sin(f), 2 * Math.cos(u), 2 * Math.sin(v) * Math.cos(f), 2 * Math.sin(v) * Math.sin(f), 2 * Math.cos(v)); } }
        var gr = new T.BufferGeometry(); gr.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
        S.aggiungi(new T.LineSegments(gr, new T.LineBasicMaterial({ color: 0x5f87b0, transparent: true, opacity: 0.22 })));
        S.aggiungi(new T.Mesh(new T.TorusGeometry(2, 0.012, 8, 160), new T.MeshBasicMaterial({ color: 0x9fd8ff })));
        S.aggiungi(L3.assi(T, 2.5, ['x', 'y', 'z'], 0.26));
        [['|0⟩', 0, 0, 2.35, '#e6fffb'], ['|1⟩', 0, 0, -2.35, '#e6fffb'], ['|+⟩', 2.35, 0, 0.2, '#ffb3b3'], ['|−⟩', -2.35, 0, 0.2, '#ffb3b3'], ['|+i⟩', 0, 2.35, 0.2, '#9ff5e8'], ['|−i⟩', 0, -2.35, 0.2, '#9ff5e8']].forEach(function (e) { var s = L3.testo3d(T, e[0], e[4], 0.34); s.position.set(e[1], e[2], e[3]); S.aggiungi(s); });
        /* il vettore di stato */
        var freccia = new T.Group(), mat = new T.MeshStandardMaterial({ color: 0xffd24a, emissive: 0x7a5a00, metalness: 0.3, roughness: 0.3 });
        var asta = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1.72, 16), mat); asta.position.y = 0.86; freccia.add(asta);
        var punta = new T.Mesh(new T.ConeGeometry(0.11, 0.28, 24), mat); punta.position.y = 1.86; freccia.add(punta);
        var luce = bagliore(T, 0xffd24a, 0.7); luce.position.y = 2; freccia.add(luce);
        S.aggiungi(freccia);
        /* proiezioni sul piano e sull'asse z */
        var proie = new T.LineSegments(new T.BufferGeometry(), new T.LineDashedMaterial({ color: 0xffd24a, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0.6 }));
        proie.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(12), 3)); S.aggiungi(proie);
        /* la scia */
        var NS = 3000, sPos = new Float32Array(NS * 3), sG = new T.BufferGeometry(), nS = 0; sG.setAttribute('position', new T.BufferAttribute(sPos, 3)); sG.setDrawRange(0, 0);
        S.aggiungi(new T.Line(sG, new T.LineBasicMaterial({ color: 0xff9f43, transparent: true, opacity: 0.85 })));
        /* l'asse della rotazione in corso */
        var asse = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xff6bd5 })); asse.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3)); asse.visible = false; S.aggiungi(asse);
        var etAsse = L3.testo3d(T, '', '#ff9be6', 0.3); etAsse.visible = false; S.aggiungi(etAsse);
        var Y = new T.Vector3(0, 1, 0), vv = new T.Vector3();
        function poni(b) {
          vv.set(b[0], b[1], b[2]); var L = vv.length() || 1; vv.divideScalar(L);
          freccia.quaternion.setFromUnitVectors(Y, vv);
          var P = proie.geometry.attributes.position.array, x = 2 * b[0], y = 2 * b[1], zz = 2 * b[2];
          P.set([x, y, zz, x, y, 0, x, y, zz, 0, 0, zz]); proie.geometry.attributes.position.needsUpdate = true; proie.computeLineDistances();
        }
        function scia(b) { if (nS >= NS) { sPos.copyWithin(0, 3, NS * 3); nS = NS - 1; } sPos[3 * nS] = 2 * b[0]; sPos[3 * nS + 1] = 2 * b[1]; sPos[3 * nS + 2] = 2 * b[2]; nS++; sG.attributes.position.needsUpdate = true; sG.setDrawRange(0, nS); }
        var corrente = null;
        cb.reimposta = function () { corrente = null; asse.visible = false; etAsse.visible = false; nS = 0; sG.setDrawRange(0, 0); var b = bloch(st.psi); poni(b); scia(b); testo(); S.sporca = true; S.avvia(); aggDida(); };
        function aggDida() { var b = bloch(st.psi); S.didascalia.textContent = t('Sfera di Bloch: vettore (', 'Bloch sphere: vector (') + b.map(function (x) { return x.toFixed(2); }).join(', ') + ')' + (corrente ? t(' · porta ', ' · gate ') + corrente.nome : ''); }
        cb.sveglia = function () { S.avvia(); };
        S.ogniFotogramma(function (dt) {
          if (!corrente) {
            if (!st.coda.length) return false;
            var g = st.coda.shift(), aa = asseAngolo(g.U);
            corrente = { U: g.U, nome: g.nome, n: aa.n, ang: aa.angolo, f: 0, b0: bloch(st.psi), durata: 0.4 + 0.6 * aa.angolo / PI };
            var P = asse.geometry.attributes.position.array; P.set([-2.6 * aa.n[0], -2.6 * aa.n[1], -2.6 * aa.n[2], 2.6 * aa.n[0], 2.6 * aa.n[1], 2.6 * aa.n[2]]); asse.geometry.attributes.position.needsUpdate = true; asse.visible = aa.angolo > 1e-9;
            S.radice.remove(etAsse); etAsse.material.map.dispose(); etAsse.material.dispose(); etAsse = L3.testo3d(T, g.nome + '  ' + Math.round(aa.angolo * 180 / PI) + '°', '#ff9be6', 0.3); etAsse.position.set(2.8 * aa.n[0], 2.8 * aa.n[1], 2.8 * aa.n[2]); S.aggiungi(etAsse);
            aggDida();
          }
          corrente.f = Math.min(1, corrente.f + dt / corrente.durata);
          var e = corrente.f < 1 ? 0.5 - 0.5 * Math.cos(PI * corrente.f) : 1, b = ruota(corrente.b0, corrente.n, corrente.ang * e);
          poni(b); scia(b);
          if (corrente.f >= 1) { st.psi = normalizza(applica(corrente.U, st.psi)); st.storia.push(corrente.nome); corrente = null; asse.visible = false; etAsse.visible = false; poni(bloch(st.psi)); testo(); aggDida(); }
          return true;
        });
        cb.reimposta();
        S.inquadra(8.2, 0.55, 1.15);
      }
    };
  }

  /* ─── 3. Bell e CHSH ───────────────────────────────────────────────────── */
  function schedaCHSH(div) {
    var G = griglia(div), pan = G.pan, st = { a: 0, a2: 90, b: 45, b2: 135, N: 20000, seme: 3 };
    eq(pan, 'S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′)');
    var ricomincia = function () { };
    [['a', 'a (°)'], ['a2', 'a′ (°)'], ['b', 'b (°)'], ['b2', 'b′ (°)']].forEach(function (c) { F.cursore(pan, [c[1], c[1]], 0, 180, 5, st[c[0]], function (v) { st[c[0]] = v; ricomincia(); }); });
    F.cursore(pan, ['Coppie da misurare', 'Pairs to measure'], 1000, 100000, 1000, st.N, function (v) { st.N = v; ricomincia(); });
    F.bottone(pan, ['Angoli di Tsirelson', 'Tsirelson angles'], function () { st.a = 0; st.a2 = 90; st.b = 45; st.b2 = 135; [].forEach.call(pan.querySelectorAll('input[type=range]'), function (r, i) { if (i < 4) { r.value = [0, 90, 45, 135][i]; r.dispatchEvent(new Event('input')); } }); ricomincia(); });
    var info = nota(pan);
    nota(pan, t('La sorgente emette coppie di spin nello stato di singoletto (|↑↓⟩ − |↓↑⟩)/√2. Alice misura lungo a o a′, Bob lungo b o b′, scelti a caso coppia per coppia. La meccanica quantistica dà E = −cos(a − b) e, agli angoli 0°, 90°, 45°, 135°, |S| = 2√2 ≈ 2,828. Il modello locale (ogni coppia porta un angolo nascosto λ e ciascuno risponde sgn cos(angolo − λ)) riproduce le correlazioni perfette ma dà una E lineare nell’angolo e non supera mai 2: lo dimostra il teorema di Bell (CHSH, 1969), lo confermano gli esperimenti di Aspect (1982) e quelli senza scappatoie del 2015.',
      'The source emits spin pairs in the singlet state (|↑↓⟩ − |↓↑⟩)/√2. Alice measures along a or a′, Bob along b or b′, chosen at random for each pair. Quantum mechanics gives E = −cos(a − b) and, at angles 0°, 90°, 45°, 135°, |S| = 2√2 ≈ 2.828. The local model (each pair carries a hidden angle λ and each side answers sgn cos(angle − λ)) reproduces the perfect correlations but gives an E linear in the angle and never exceeds 2: that is Bell’s theorem (CHSH, 1969), confirmed by Aspect’s experiments (1982) and the loophole-free ones of 2015.'));
    var tela = F.tela(G.dx, 0.6), tela2 = F.tela(G.dx, 0.42), c = null, an;
    function angoli() { return [st.a, st.a2, st.b, st.b2].map(function (x) { return x * PI / 180; }); }
    ricomincia = function () { c = null; st.seme++; if (an) an.sveglia(); };
    var storiaQ = [], storiaL = [];
    function disegna() {
      var A = angoli(), xs = [], yq = [], yl = [];
      for (var i = 0; i <= 180; i++) { var d = i * PI / 180; xs.push(i); yq.push(Equant(d, 0)); yl.push(Elocale(d, 0)); }
      var punti = [], rq = c ? chshDa(c.q) : null, rl = c ? chshDa(c.l) : null, coppie = [[0, 2], [0, 3], [1, 2], [1, 3]];
      coppie.forEach(function (p, k) {
        var dd = Math.abs((A[p[0]] - A[p[1]]) * 180 / PI); if (dd > 180) dd = 360 - dd;
        if (rq) { punti.push({ x: dd, y: rq.E[k], col: '#ffd24a', r: 4 }); punti.push({ x: dd, y: rl.E[k], col: '#ff8a80', r: 4 }); }
      });
      F.grafico(tela, { serie: [{ x: xs, y: yq, col: '#ffd24a', etich: t('quantistica −cos Δ', 'quantum −cos Δ') }, { x: xs, y: yl, col: '#ff8a80', tratt: true, etich: t('locale −1 + 2Δ/π', 'local −1 + 2Δ/π') }], punti: punti, xmin: 0, xmax: 180, ymin: -1.05, ymax: 1.05, xl: ['angolo fra gli analizzatori Δ (°)', 'angle between analysers Δ (°)'], yl: ['correlazione E', 'correlation E'], legenda: [{ col: '#ffd24a', etich: ['quantistica', 'quantum'] }, { col: '#ff8a80', etich: ['variabili nascoste locali', 'local hidden variables'] }], descr: ['Correlazioni del singoletto: quantistica contro modello locale', 'Singlet correlations: quantum versus local model'] });
      var n = c ? c.q.reduce(function (s, v) { return s + v[1]; }, 0) : 0;
      F.grafico(tela2, { serie: [{ x: storiaQ.map(function (p) { return p[0]; }), y: storiaQ.map(function (p) { return p[1]; }), col: '#ffd24a', etich: 'S quant.' }, { x: storiaL.map(function (p) { return p[0]; }), y: storiaL.map(function (p) { return p[1]; }), col: '#ff8a80', etich: 'S loc.' }], linee: [{ y: 2, col: '#5eead4', etich: t('limite locale |S| = 2', 'local bound |S| = 2') }, { y: 2 * Math.SQRT2, col: '#ffd24a', etich: '2√2' }], xmin: 0, xmax: st.N, ymin: 0, ymax: 3.1, xl: ['coppie misurate', 'pairs measured'], yl: ['|S|', '|S|'], descr: ['|S| che converge al crescere delle coppie', '|S| converging as pairs accumulate'] });
      var Sq = chsh(Equant, A[0], A[1], A[2], A[3]), Sl = chsh(Elocale, A[0], A[1], A[2], A[3]);
      info.innerHTML = t('Teoria: ', 'Theory: ') + 'S<sub>Q</sub> = <b>' + fmt(Sq) + '</b>, S<sub>LHV</sub> = <b>' + fmt(Sl) + '</b><br>' + t('Simulazione (', 'Simulation (') + n + t(' coppie): ', ' pairs): ') + 'S<sub>Q</sub> = <b>' + (rq ? rq.S.toFixed(3) : '—') + '</b>, S<sub>LHV</sub> = <b>' + (rl ? rl.S.toFixed(3) : '—') + '</b><br>' +
        t('Errore statistico ≈ ', 'Statistical error ≈ ') + (n ? fmt(4 / Math.sqrt(n)) : '—') + ' · ' + (Math.abs(Sq) > 2 ? t('violazione di Bell: ', 'Bell violation: ') + fmt(Math.abs(Sq) - 2) + t(' sopra il limite locale', ' above the local bound') : t('nessuna violazione con questi angoli', 'no violation with these angles'));
    }
    an = F.anima(tela, function (dt, tempo) {
      if (!c) { c = null; storiaQ = []; storiaL = []; c = chshSimula(angoli(), 0, st.seme); c.seme = st.seme; c.rnd = 0; }
      var n = c.q.reduce(function (s, v) { return s + v[1]; }, 0);
      if (n < st.N) {
        var lotto = Math.min(st.N - n, Math.max(200, Math.round(st.N / 120)));
        chshSimula(angoli(), lotto, st.seme * 7919 + n, c);
        n += lotto; storiaQ.push([n, Math.abs(chshDa(c.q).S)]); storiaL.push([n, Math.abs(chshDa(c.l).S)]);
      }
      disegna();
      if (n >= st.N) return false;
    }, { ricomincia: function () { c = null; st.seme++; } });
    F.alRidimensiona(disegna);
  }

  /* ─── 4. BB84 ──────────────────────────────────────────────────────────── */
  function schedaBB84(div) {
    var G = griglia(div), pan = G.pan, st = { N: 4000, eve: 0, rumore: 0, seme: 5 };
    eq(pan, 'QBER = (p/4)(1 − ε) + (1 − p/4)ε');
    var R = null;
    F.cursore(pan, ['Fotoni inviati', 'Photons sent'], 200, 40000, 200, st.N, function (v) { st.N = v; calcola(); });
    F.cursore(pan, ['Frazione intercettata da Eve p', 'Fraction intercepted by Eve p'], 0, 1, 0.05, st.eve, function (v) { st.eve = v; calcola(); }, function (v) { return Math.round(v * 100) + ' %'; });
    F.cursore(pan, ['Rumore del canale ε', 'Channel noise ε'], 0, 0.15, 0.005, st.rumore, function (v) { st.rumore = v; calcola(); }, function (v) { return (v * 100).toFixed(1) + ' %'; });
    F.bottone(pan, ['Nuova trasmissione', 'New transmission'], function () { st.seme++; calcola(); });
    var info = nota(pan);
    nota(pan, t('Alice codifica ogni bit in una di due basi: + (0 = →, 1 = ↑) o × (0 = ↗, 1 = ↖). Bob sceglie la base a caso: se coincide legge il bit giusto, altrimenti ottiene 0 o 1 a caso. Poi i due confrontano in pubblico SOLO le basi e tengono i bit con base uguale (setacciatura, circa ½). Eve non conosce la base: se sbaglia (metà delle volte) rispedisce il fotone nella base sbagliata e Bob ha il 50 % di errore, quindi 25 % sui bit intercettati. Teorema di non clonazione: non può copiare il fotone e misurarlo dopo.',
      'Alice encodes each bit in one of two bases: + (0 = →, 1 = ↑) or × (0 = ↗, 1 = ↖). Bob picks the basis at random: if it matches he reads the right bit, otherwise he gets 0 or 1 at random. Then they compare ONLY the bases in public and keep the bits with matching basis (sifting, about ½). Eve does not know the basis: when wrong (half the time) she resends the photon in the wrong basis and Bob has 50 % error, hence 25 % on intercepted bits. No-cloning theorem: she cannot copy the photon and measure later.'));
    var tela = F.tela(G.dx, 0.4), tela2 = F.tela(G.dx, 0.42);
    var SIMB = [['→', '↑'], ['↗', '↖']];
    function calcola() { R = bb84(st.N, st.eve, st.rumore, st.seme); grafico(); testo(); }
    function testo() {
      var Qa = qberAtteso(st.eve, st.rumore), r = tassoSegreto(R.qber);
      info.innerHTML = t('Setacciati: ', 'Sifted: ') + '<b>' + R.tenuti + '</b> / ' + R.N + ' = <b>' + fmt(100 * R.frazione) + ' %</b> (' + t('atteso 50 %', 'expected 50 %') + ')<br>' +
        'QBER = <b>' + (100 * R.qber).toFixed(2) + ' %</b> ' + t('(atteso ', '(expected ') + (100 * Qa).toFixed(2) + ' % ± ' + (100 * Math.sqrt(Qa * (1 - Qa) / Math.max(1, R.tenuti))).toFixed(2) + ')<br>' +
        t('Chiave segreta distillabile: ', 'Distillable secret key: ') + '<b>' + (R.qber < 0.11 ? Math.floor(r * R.tenuti) + ' bit (r = ' + fmt(r) + ')' : t('nessuna: QBER sopra l’11 %, si butta tutto', 'none: QBER above 11 %, everything is discarded')) + '</b>';
    }
    function grafico() {
      var xs = [], ys = [], yn = [];
      for (var i = 0; i <= 50; i++) { var p = i / 50; xs.push(p * 100); ys.push(100 * qberAtteso(p, st.rumore)); yn.push(100 * qberAtteso(p, 0)); }
      F.grafico(tela2, { serie: [{ x: xs, y: ys, col: '#ffd24a', etich: 'QBER' }, { x: xs, y: yn, col: '#34465f', tratt: true, etich: 'ε = 0' }], punti: R ? [{ x: st.eve * 100, y: 100 * R.qber, col: '#ff8a80', r: 5 }] : [], linee: [{ y: 11, col: '#ff8a80', etich: t('11 %: limite per la chiave', '11 %: key threshold') }, { y: 25, col: '#5eead4', etich: '25 %' }], xmin: 0, xmax: 100, ymin: 0, ymax: 40, xl: ['fotoni intercettati da Eve (%)', 'photons intercepted by Eve (%)'], yl: ['QBER (%)', 'QBER (%)'], descr: ['Tasso di errore quantistico in funzione della spia', 'Quantum bit error rate versus eavesdropping'] });
    }
    calcola();
    var fase = 0;
    F.anima(tela, function (dt) {
      fase += dt * 0.6;
      tela._rapporto = Math.max(0.36, 245 / Math.max(280, tela.clientWidth || 600));
      var P = F.pennello(tela), q = P.q, W = P.W, H = P.H, righe = R.primi, n = Math.min(righe.length, Math.max(8, Math.floor((W - 90) / 22)));
      var yS = 44, xA = 34, xB = W - 34, xE = W / 2;
      q.font = 'bold 12px system-ui,sans-serif'; q.textAlign = 'center';
      [[xA, 'Alice', '#5eead4'], [xB, 'Bob', '#6bcfff']].forEach(function (s) { q.fillStyle = s[2]; q.beginPath(); q.arc(s[0], yS, 14, 0, 2 * PI); q.fill(); q.fillStyle = '#081522'; q.fillText(s[1][0], s[0], yS + 4); q.fillStyle = s[2]; q.fillText(s[1], s[0], yS + 30); });
      q.strokeStyle = '#1d2f49'; q.beginPath(); q.moveTo(xA + 16, yS); q.lineTo(xB - 16, yS); q.stroke();
      if (st.eve > 0) { q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(xE, yS, 12, 0, 2 * PI); q.fill(); q.fillStyle = '#081522'; q.fillText('E', xE, yS + 4); q.fillStyle = '#ff8a80'; q.fillText('Eve ' + Math.round(st.eve * 100) + ' %', xE, yS + 28); }
      /* tre fotoni in volo, ciascuno con il suo simbolo di polarizzazione */
      for (var k = 0; k < 3; k++) {
        var f = (fase + k / 3) % 1, idx = (Math.floor(fase + k / 3) * 3 + k) % righe.length, r = righe[idx], x = xA + 18 + (xB - xA - 36) * f;
        var sim = SIMB[r.ba][r.a]; if (r.be >= 0 && f > 0.5) sim = SIMB[r.be][r.eb];
        q.fillStyle = 'rgba(255,210,74,.25)'; q.beginPath(); q.arc(x, yS, 10, 0, 2 * PI); q.fill();
        q.fillStyle = '#ffd24a'; q.font = 'bold 15px system-ui,sans-serif'; q.fillText(sim, x, yS + 5);
      }
      /* la tabella dei primi fotoni */
      var x0 = 82, cw = (W - x0 - 8) / n, y0 = 100, rh = 19;
      var etR = [t('bit di Alice', 'Alice bit'), t('base Alice', 'Alice basis'), t('fotone', 'photon'), t('base Eve', 'Eve basis'), t('base Bob', 'Bob basis'), t('bit di Bob', 'Bob bit'), t('tenuto?', 'kept?')];
      q.font = '11px system-ui,sans-serif'; q.textAlign = 'left'; q.fillStyle = '#9fb1c6';
      etR.forEach(function (e, i) { q.fillText(e, 4, y0 + i * rh + 13); });
      q.textAlign = 'center';
      for (var j = 0; j < n; j++) {
        var rr = righe[j], cx0 = x0 + j * cw + cw / 2;
        var val = [String(rr.a), rr.ba ? '×' : '+', SIMB[rr.ba][rr.a], rr.be < 0 ? '·' : (rr.be ? '×' : '+'), rr.bb ? '×' : '+', String(rr.b), rr.tiene ? (rr.err ? '✗' : '✓') : '–'];
        if (rr.tiene) { q.fillStyle = rr.err ? 'rgba(255,138,128,.18)' : 'rgba(94,234,212,.10)'; q.fillRect(x0 + j * cw + 1, y0, cw - 2, rh * 7); }
        val.forEach(function (v, i) { q.fillStyle = i === 6 ? (rr.tiene ? (rr.err ? '#ff8a80' : '#5eead4') : '#5b6b80') : i === 3 ? '#ff8a80' : '#e6fffb'; q.font = (i === 2 ? 'bold 14px ' : '12px ') + 'system-ui,sans-serif'; q.fillText(v, cx0, y0 + i * rh + 14); });
      }
      tela.setAttribute('aria-label', t('BB84: fotoni da Alice a Bob e tabella della setacciatura', 'BB84: photons from Alice to Bob and sifting table'));
      return true;
    });
    F.alRidimensiona(grafico);
  }

  F.sezione('sfisspin', {
    titolo: ['🌀 Spin, qubit ed entanglement', '🌀 Spin, qubits and entanglement'],
    sotto: ['Lo spin ½ misurato atomo per atomo, il qubit sulla sfera di Bloch con le porte quantistiche, la violazione delle disuguaglianze di Bell e la distribuzione quantistica delle chiavi BB84.', 'Spin ½ measured atom by atom, the qubit on the Bloch sphere with quantum gates, the violation of Bell inequalities and BB84 quantum key distribution.'],
    schede: [
      { nome: ['🧲 Stern–Gerlach', '🧲 Stern–Gerlach'], costruisci: scheda3D(schedaSG) },
      { nome: ['🔮 Sfera di Bloch', '🔮 Bloch sphere'], costruisci: scheda3D(schedaBloch) },
      { nome: ['🔗 Bell e CHSH', '🔗 Bell and CHSH'], costruisci: schedaCHSH },
      { nome: ['🔐 BB84', '🔐 BB84'], costruisci: schedaBB84 }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
