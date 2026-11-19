/* ═══════════════════════════════════════════════════════════════════════
   bsi-chim-meccanismi3d.js — 🧪 Meccanismi di reazione in 3D (v262)
   BioSpecInfo · © Samuele Pio Provenzano

   Otto meccanismi della chimica organica come film 3D che si possono
   fermare, scorrere e ruotare: gli atomi si muovono lungo la coordinata di
   reazione, i legami si formano e si rompono (tratteggiati quando sono a
   metà), le frecce curve mostrano dove vanno gli elettroni, le cariche
   compaiono e scompaiono, e dentro il palco il profilo energetico ha un
   punto che segue la reazione: reagenti, stato di transizione (‡),
   intermedi, prodotti.

   Ogni meccanismo è una funzione geom(x) della coordinata x (0…N) che
   restituisce le posizioni (Å), gli ordini di legame e le cariche: il banco
   test_meccanismi3d verifica che la carica totale resti costante, che le
   lunghezze di legame agli estremi siano quelle tipiche e che nessuna
   freccia punti a un atomo che non c'è.

   ONESTA': le geometrie sono SEMPLIFICATE (lunghezze e angoli tipici, i
   gruppi metile come un'unica sfera «CH₃»); le energie sono INDICATIVE
   (ordini di grandezza da letteratura), tranne dove c'è la fonte: la
   Diels–Alder butadiene + etene (Rowley e Steiner 1951) e le entalpie di
   legame della clorurazione radicalica.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;
  var t = F.t, PI = Math.PI, DEG = PI / 180;
  var MENO_MOTO = false; try { MENO_MOTO = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }

  /* ═══ geometria: piccoli strumenti ═══════════════════════════════════════ */
  function cl(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ss(u) { u = cl(u, 0, 1); return u * u * (3 - 2 * u); }
  /** valore interpolato fra i nodi [[x0, v0], [x1, v1], …] (dolce, con pendenza nulla ai nodi) */
  function N(x, nodi) {
    if (x <= nodi[0][0]) return nodi[0][1];
    for (var i = 1; i < nodi.length; i++) if (x <= nodi[i][0]) { var a = nodi[i - 1], b = nodi[i], u = ss((x - a[0]) / (b[0] - a[0])); return Array.isArray(a[1]) ? a[1].map(function (v, k) { return v + (b[1][k] - v) * u; }) : a[1] + (b[1] - a[1]) * u; }
    return nodi[nodi.length - 1][1];
  }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function nrm(a) { var l = len(a) || 1; return mul(a, 1 / l); }
  function lerp(a, b, u) { return add(a, mul(sub(b, a), u)); }
  /** base ortonormale perpendicolare a un asse */
  function base(asse) { var a = nrm(asse), r = Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], e1 = nrm(crs(a, r)), e2 = crs(a, e1); return [a, e1, e2]; }
  /** n direzioni a angolo polare th dall'asse, distanziate di 360°/n, sfasate di fase */
  function ombrello(asse, th, n, fase) { var B = base(asse), out = []; for (var k = 0; k < n; k++) { var f = (fase || 0) + k * 2 * PI / n; out.push(add(mul(B[0], Math.cos(th)), add(mul(B[1], Math.sin(th) * Math.cos(f)), mul(B[2], Math.sin(th) * Math.sin(f))))); } return out; }
  /** ruota v attorno all'asse k (Rodrigues) */
  function ruota(v, k, a) { k = nrm(k); var c = Math.cos(a), s = Math.sin(a); return add(add(mul(v, c), mul(crs(k, v), s)), mul(k, dot(k, v) * (1 - c))); }

  /* ═══ gli otto meccanismi ════════════════════════════════════════════════ */
  var M = [];
  function reg(m) { M.push(m); }

  /* 1 · SN2: OH⁻ + CH₃Br → CH₃OH + Br⁻ (inversione di Walden) */
  reg({
    id: 'sn2', titolo: ['SN2: sostituzione in un passo solo', 'SN2: substitution in a single step'], eq: 'HO⁻ + CH₃–Br → HO–CH₃ + Br⁻', N: 2,
    atomi: { C: 'C', Br: 'Br', O: 'O', Ho: 'H', H1: 'H', H2: 'H', H3: 'H' },
    legami: [['C', 'O'], ['C', 'Br'], ['O', 'Ho'], ['C', 'H1'], ['C', 'H2'], ['C', 'H3']],
    geom: function (x) {
      var dO = N(x, [[0, 3.3], [1, 1.95], [2, 1.43]]), dB = N(x, [[0, 1.94], [1, 2.3], [2, 3.7]]), ph = N(x, [[0, 109.5], [1, 90], [2, 70.5]]) * DEG;
      var H = ombrello([1, 0, 0], ph, 3, 0.3), O = [-dO, 0, 0];
      return { pos: { C: [0, 0, 0], Br: [dB, 0, 0], O: O, Ho: add(O, mul(nrm([-0.33, 0.94, 0]), 0.96)), H1: mul(H[0], 1.09), H2: mul(H[1], 1.09), H3: mul(H[2], 1.09) },
        ord: { 'C-O': N(x, [[0, 0], [1, 0.5], [2, 1]]), 'C-Br': N(x, [[0, 1], [1, 0.5], [2, 0]]), 'O-Ho': 1, 'C-H1': 1, 'C-H2': 1, 'C-H3': 1 },
        car: { O: N(x, [[0, -1], [1, -0.5], [2, 0]]), Br: N(x, [[0, 0], [1, -0.5], [2, -1]]) } };
    },
    frecce: [{ da: 'O', a: ['C', 'O'], x: [0.15, 1.05] }, { da: ['C', 'Br'], a: 'Br', x: [0.25, 1.15] }],
    energia: [[0, 0, 'reagenti'], [1, 96, 'ET‡'], [2, -75, 'prodotti']],
    stadi: [[0, 1, ['Lo ione idrossido attacca il carbonio dal lato opposto al bromo («attacco da dietro»): è l\'unica direzione in cui c\'è posto per l\'orbitale vuoto σ* del legame C–Br.', 'The hydroxide ion attacks carbon from the side opposite bromine («backside attack»): the only direction where the empty σ* orbital of the C–Br bond is accessible.']],
      [1, 1.15, ['Stato di transizione: carbonio pentacoordinato, i tre idrogeni in un piano, O e Br a metà legame. Non è un intermedio: dura quanto una vibrazione (~10⁻¹³ s).', 'Transition state: pentacoordinate carbon, the three hydrogens in a plane, O and Br half-bonded. It is not an intermediate: it lasts one vibration (~10⁻¹³ s).']],
      [1.15, 2, ['I tre idrogeni si rovesciano come un ombrello nel vento: inversione di Walden. Un unico passo, velocità = k[CH₃Br][OH⁻] (secondo ordine).', 'The three hydrogens flip like an umbrella in the wind: Walden inversion. A single step, rate = k[CH₃Br][OH⁻] (second order).']]],
    fonti: ['Clayden', 'Anslyn']
  });

  /* 2 · SN1: (CH₃)₃C–Br → carbocatione → + H₂O → ione ossonio → alcol (i metili come CH₃) */
  reg({
    id: 'sn1', titolo: ['SN1: prima se ne va il gruppo uscente', 'SN1: the leaving group goes first'], eq: '(CH₃)₃C–Br + H₂O → (CH₃)₃C–OH + HBr', N: 3,
    atomi: { C: 'C', Br: 'Br', Me1: 'Me', Me2: 'Me', Me3: 'Me', O: 'O', Ha: 'H', Hb: 'H' },
    legami: [['C', 'Br'], ['C', 'Me1'], ['C', 'Me2'], ['C', 'Me3'], ['C', 'O'], ['O', 'Ha'], ['O', 'Hb']],
    geom: function (x) {
      var dB = N(x, [[0, 1.97], [1, 3.9], [3, 4.4]]), ph = N(x, [[0, 109.5], [1, 90], [1.25, 90], [2, 70.5]]) * DEG, dO = N(x, [[0, 4.6], [1, 4.2], [2, 1.5], [3, 1.43]]);
      var Me = ombrello([1, 0, 0], ph, 3, 0.4), O = [-dO, 0, 0], dHb = N(x, [[0, 0.97], [2, 0.97], [3, 3.2]]);
      return { pos: { C: [0, 0, 0], Br: [dB, 0, 0], Me1: mul(Me[0], 1.53), Me2: mul(Me[1], 1.53), Me3: mul(Me[2], 1.53), O: O, Ha: add(O, mul(nrm([-0.4, 0.9, 0.2]), 0.97)), Hb: add(O, mul(nrm([-0.4, -0.7, -0.6]), dHb)) },
        ord: { 'C-Br': N(x, [[0, 1], [0.8, 0.25], [1, 0]]), 'C-O': N(x, [[0, 0], [1.2, 0], [1.6, 0.5], [2, 1]]), 'O-Ha': 1, 'O-Hb': N(x, [[0, 1], [2.1, 1], [2.6, 0.4], [3, 0]]), 'C-Me1': 1, 'C-Me2': 1, 'C-Me3': 1 },
        car: { C: N(x, [[0, 0], [1, 1], [1.2, 1], [2, 0]]), Br: N(x, [[0, 0], [1, -1]]), O: N(x, [[0, 0], [1.2, 0], [2, 1], [2.1, 1], [3, 0]]), Hb: N(x, [[0, 0], [2.1, 0], [3, 1]]) } };
    },
    frecce: [{ da: ['C', 'Br'], a: 'Br', x: [0.1, 0.9] }, { da: 'O', a: ['C', 'O'], x: [1.25, 1.95] }, { da: ['O', 'Hb'], a: 'O', x: [2.15, 2.9] }],
    energia: [[0, 0, 'reagenti'], [0.85, 95, 'ET₁‡'], [1, 80, 'carbocatione'], [1.55, 88, 'ET₂‡'], [2, 15, 'ione ossonio'], [2.5, 28, 'ET₃‡'], [3, -10, 'prodotti']],
    stadi: [[0, 1, ['Il legame C–Br si rompe da solo, senza aiuto: il bromo se ne va con entrambi gli elettroni. È lo stadio lento: velocità = k[(CH₃)₃CBr], primo ordine.', 'The C–Br bond breaks on its own: bromine leaves with both electrons. This is the slow step: rate = k[(CH₃)₃CBr], first order.']],
      [1, 1.25, ['Il carbocatione terziario è piatto (sp²) e stabilizzato dai tre metili che gli cedono elettroni (iperconiugazione).', 'The tertiary carbocation is flat (sp²) and stabilised by the three methyls donating electrons (hyperconjugation).']],
      [1.25, 2, ['L\'acqua può attaccare da sopra o da sotto il piano: un carbonio chirale darebbe una miscela di enantiomeri (racemizzazione).', 'Water can attack from above or below the plane: a chiral carbon would give a mixture of enantiomers (racemisation).']],
      [2, 3, ['Un\'altra molecola d\'acqua toglie il protone allo ione ossonio: rimane l\'alcol.', 'Another water molecule removes the proton from the oxonium ion: the alcohol remains.']]],
    fonti: ['Clayden', 'Anslyn']
  });

  /* 3 · E2: HO⁻ + CH₃CH₂Br → CH₂=CH₂ + H₂O + Br⁻ (antiperiplanare) */
  reg({
    id: 'e2', titolo: ['E2: eliminazione antiperiplanare', 'E2: antiperiplanar elimination'], eq: 'HO⁻ + CH₃–CH₂–Br → CH₂=CH₂ + H₂O + Br⁻', N: 2,
    atomi: { Ca: 'C', Cb: 'C', Br: 'Br', Hx: 'H', H1: 'H', H2: 'H', H3: 'H', H4: 'H', O: 'O', Ho: 'H' },
    legami: [['Ca', 'Cb'], ['Ca', 'Br'], ['Cb', 'Hx'], ['Ca', 'H1'], ['Ca', 'H2'], ['Cb', 'H3'], ['Cb', 'H4'], ['O', 'Hx'], ['O', 'Ho']],
    geom: function (x) {
      var dCC = N(x, [[0, 1.54], [2, 1.34]]), Cb = [dCC, 0, 0], u = N(x, [[0, 0], [1, 0.55], [2, 1]]);
      var dA = function (s) { return nrm(lerp(nrm([-0.33, 0.47, s * 0.82]), [-0.5, 0, s * 0.866], u)); }, dB2 = function (s) { return nrm(lerp(nrm([0.33, -0.47, s * 0.82]), [0.5, 0, s * 0.866], u)); };
      var Hx0 = add(Cb, mul(nrm([0.33, 0.94, 0]), 1.09)), O0 = add(Hx0, [0.15, 2.5, 0]), O1 = add(Cb, [0.6, 3.0, 0]);
      var O = N(x, [[0, O0], [1, add(Cb, [0.5, 2.6, 0])], [2, O1]]), Hx = N(x, [[0, Hx0], [1, add(Cb, [0.42, 1.6, 0])], [2, add(O1, mul(nrm([-0.3, -0.95, 0]), 0.96))]]);
      return { pos: { Ca: [0, 0, 0], Cb: Cb, Br: [0, -N(x, [[0, 1.97], [1, 2.4], [2, 3.8]]), 0], Hx: Hx, H1: mul(dA(1), 1.09), H2: mul(dA(-1), 1.09), H3: add(Cb, mul(dB2(1), 1.09)), H4: add(Cb, mul(dB2(-1), 1.09)), O: O, Ho: add(O, mul(nrm([0.6, 0.8, 0]), 0.96)) },
        ord: { 'Ca-Cb': N(x, [[0, 1], [1, 1.5], [2, 2]]), 'Ca-Br': N(x, [[0, 1], [1, 0.5], [2, 0]]), 'Cb-Hx': N(x, [[0, 1], [1, 0.5], [2, 0]]), 'O-Hx': N(x, [[0, 0], [1, 0.5], [2, 1]]), 'O-Ho': 1, 'Ca-H1': 1, 'Ca-H2': 1, 'Cb-H3': 1, 'Cb-H4': 1 },
        car: { O: N(x, [[0, -1], [1, -0.5], [2, 0]]), Br: N(x, [[0, 0], [1, -0.5], [2, -1]]) } };
    },
    frecce: [{ da: 'O', a: ['O', 'Hx'], x: [0.1, 1.05] }, { da: ['Cb', 'Hx'], a: ['Ca', 'Cb'], x: [0.2, 1.1] }, { da: ['Ca', 'Br'], a: 'Br', x: [0.3, 1.15] }],
    energia: [[0, 0, 'reagenti'], [1, 90, 'ET‡'], [2, -40, 'prodotti']],
    stadi: [[0, 1, ['La base strappa un idrogeno sul carbonio vicino a quello del bromo. Il legame C–H che si rompe e il C–Br devono essere antiperiplanari (180°): così gli orbitali si allineano per formare il doppio legame.', 'The base pulls off a hydrogen on the carbon next to the bromine one. The breaking C–H and C–Br bonds must be antiperiplanar (180°): this lines up the orbitals to form the double bond.']],
      [1, 2, ['Tutto avviene insieme: H⁺ alla base, doppio legame C=C, Br⁻ via. Un passo solo, velocità = k[base][alogenuro].', 'Everything happens together: H⁺ to the base, C=C double bond, Br⁻ away. A single step, rate = k[base][halide].']]],
    fonti: ['Clayden', 'Anslyn']
  });

  /* 4 · Addizione elettrofila di HBr al propene (Markovnikov) */
  reg({
    id: 'markovnikov', titolo: ['Addizione di HBr: regola di Markovnikov', 'HBr addition: Markovnikov\'s rule'], eq: 'CH₂=CH–CH₃ + HBr → CH₃–CHBr–CH₃', N: 2,
    atomi: { C1: 'C', C2: 'C', Me: 'Me', H1a: 'H', H1b: 'H', H2: 'H', Hn: 'H', Br: 'Br' },
    legami: [['C1', 'C2'], ['C2', 'Me'], ['C1', 'H1a'], ['C1', 'H1b'], ['C2', 'H2'], ['C1', 'Hn'], ['Hn', 'Br'], ['C2', 'Br']],
    geom: function (x) {
      var dCC = N(x, [[0, 1.34], [1, 1.48], [2, 1.53]]), C2 = [dCC, 0, 0];
      var p1 = N(x, [[0, 0], [1, 1]]), p2 = N(x, [[1, 0], [2, 1]]);
      var d1 = function (s) { return nrm(lerp([-0.5, 0, s * 0.866], [-0.45, -0.38, s * 0.8], p1)); };
      var d2 = function (v) { return nrm(lerp(v, add(v, [0, -0.38, 0]), p2)); };
      var Hn = N(x, [[0, [0.15, 2.3, 0]], [0.6, [0.05, 1.45, 0]], [1, [0, 1.09, 0]]]), Br = N(x, [[0, [0.25, 3.7, 0]], [1, [dCC + 0.6, 3.4, 0.2]], [2, add(C2, [0.05, 1.95, 0])]]);
      return { pos: { C1: [0, 0, 0], C2: C2, Me: add(C2, mul(d2(nrm([0.5, 0, 0.866])), 1.5)), H2: add(C2, mul(d2(nrm([0.5, 0, -0.866])), 1.09)), H1a: mul(d1(1), 1.09), H1b: mul(d1(-1), 1.09), Hn: Hn, Br: Br },
        ord: { 'C1-C2': N(x, [[0, 2], [1, 1]]), 'C2-Me': 1, 'C1-H1a': 1, 'C1-H1b': 1, 'C2-H2': 1, 'C1-Hn': N(x, [[0, 0], [0.6, 0.5], [1, 1]]), 'Hn-Br': N(x, [[0, 1], [0.6, 0.5], [1, 0]]), 'C2-Br': N(x, [[1, 0], [1.4, 0.5], [2, 1]]) },
        car: { C2: N(x, [[0, 0], [1, 1], [1.1, 1], [2, 0]]), Br: N(x, [[0, 0], [1, -1], [1.1, -1], [2, 0]]) } };
    },
    frecce: [{ da: ['C1', 'C2'], a: ['C1', 'Hn'], x: [0.1, 0.95] }, { da: ['Hn', 'Br'], a: 'Br', x: [0.2, 1.0] }, { da: 'Br', a: ['C2', 'Br'], x: [1.15, 1.9] }],
    energia: [[0, 0, 'reagenti'], [0.6, 85, 'ET₁‡'], [1, 60, 'carbocatione 2°'], [1.4, 66, 'ET₂‡'], [2, -65, 'prodotto']],
    stadi: [[0, 1, ['Gli elettroni del doppio legame (π) prendono il protone di HBr. Il protone va sul carbonio con PIÙ idrogeni: così il carbocatione si forma sul carbonio più sostituito (secondario), più stabile di un primario.', 'The double bond\'s π electrons take the proton of HBr. The proton goes to the carbon with MORE hydrogens: so the carbocation forms on the more substituted (secondary) carbon, more stable than a primary one.']],
      [1, 2, ['Lo ione bromuro chiude il carbocatione: 2-bromopropano, il prodotto di Markovnikov. Con i perossidi (meccanismo radicalico) il bromo andrebbe sull\'altro carbonio.', 'The bromide ion closes the carbocation: 2-bromopropane, the Markovnikov product. With peroxides (radical mechanism) bromine would go to the other carbon.']]],
    fonti: ['Clayden', 'Markovnikov1870']
  });

  /* 5 · Diels–Alder: buta-1,3-diene + etene → cicloesene (energie misurate)
     Inizio: diene s-cis piano (C=C 1,34 Å, C–C 1,46 Å) e etene 2,4 Å sotto, paralleli; fine: anello di 1,45 Å di raggio
     con un leggero mezza-sedia. Gli idrogeni seguono: nel piano della molecola all'inizio, fuori dall'anello alla fine. */
  (function () {
    var CEN = [0, 0, 1.255], R = 1.45, ang = { C1: 180, C2: 240, C3: 300, C4: 0, C5: 60, C6: 120 };
    var Yf = { C1: -0.12, C2: 0.12, C3: 0.12, C4: -0.12, C5: -0.42, C6: -0.42 };
    var INI = { C1: [-1.40, 0, 1.16], C2: [-0.725, 0, 0], C3: [0.725, 0, 0], C4: [1.40, 0, 1.16], C5: [0.67, -2.4, 2.51], C6: [-0.67, -2.4, 2.51] };
    var VIC0 = { C1: ['C2'], C2: ['C1', 'C3'], C3: ['C2', 'C4'], C4: ['C3'], C5: ['C6'], C6: ['C5'] };
    function fine(c) { var a = ang[c] * DEG; return add(CEN, [R * Math.cos(a), Yf[c], R * Math.sin(a)]); }
    var atomi = { C1: 'C', C2: 'C', C3: 'C', C4: 'C', C5: 'C', C6: 'C' }, Hdi = { C1: 2, C2: 1, C3: 1, C4: 2, C5: 2, C6: 2 }, legami = [['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C5', 'C6'], ['C1', 'C6'], ['C4', 'C5']];
    Object.keys(Hdi).forEach(function (c) { for (var k = 0; k < Hdi[c]; k++) { var h = 'H' + c.slice(1) + (k ? 'b' : 'a'); atomi[h] = 'H'; legami.push([c, h]); } });
    function dirIniziali(c) {
      var v = VIC0[c].map(function (n) { return nrm(sub(INI[n], INI[c])); });
      if (v.length === 2) return [nrm(mul(add(v[0], v[1]), -1))];
      return [ruota(v[0], [0, 1, 0], 120 * DEG), ruota(v[0], [0, 1, 0], -120 * DEG)];
    }
    var ANELLO = { C1: ['C2', 'C6'], C2: ['C1', 'C3'], C3: ['C2', 'C4'], C4: ['C3', 'C5'], C5: ['C4', 'C6'], C6: ['C5', 'C1'] };
    function dirFinali(c) {
      var p = fine(c), b = nrm(mul(add(nrm(sub(fine(ANELLO[c][0]), p)), nrm(sub(fine(ANELLO[c][1]), p))), -1));
      if (Hdi[c] === 1) return [b];
      return [nrm(add(mul(b, 0.55), [0, 0.83, 0])), nrm(add(mul(b, 0.55), [0, -0.83, 0]))];
    }
    reg({
      id: 'dielsalder', titolo: ['Diels–Alder: sei elettroni in cerchio', 'Diels–Alder: six electrons in a circle'], eq: 'CH₂=CH–CH=CH₂ + CH₂=CH₂ → cicloesene', N: 1,
      atomi: atomi, legami: legami,
      geom: function (x) {
        var u = N(x, [[0, 0], [1, 1]]), pos = {};
        Object.keys(INI).forEach(function (c) { pos[c] = lerp(INI[c], fine(c), u); });
        Object.keys(Hdi).forEach(function (c) {
          var d0 = dirIniziali(c), d1 = dirFinali(c);
          if (c === 'C1' || c === 'C4') { /* l'H che punta verso l'esterno dell'anello resta sopra, l'altro va sotto */ if (d0[0][2] < d0[1][2]) d0 = [d0[1], d0[0]]; }
          for (var k = 0; k < Hdi[c]; k++) pos['H' + c.slice(1) + (k ? 'b' : 'a')] = add(pos[c], mul(nrm(lerp(d0[k], d1[k], u)), 1.09));
        });
        var o = { 'C1-C2': N(x, [[0, 2], [1, 1]]), 'C2-C3': N(x, [[0, 1], [1, 2]]), 'C3-C4': N(x, [[0, 2], [1, 1]]), 'C5-C6': N(x, [[0, 2], [1, 1]]), 'C1-C6': N(x, [[0, 0], [0.5, 0.45], [1, 1]]), 'C4-C5': N(x, [[0, 0], [0.5, 0.45], [1, 1]]) };
        legami.forEach(function (l) { if (o[l[0] + '-' + l[1]] == null) o[l[0] + '-' + l[1]] = 1; });
        return { pos: pos, ord: o, car: {} };
      },
      frecce: [{ da: ['C1', 'C2'], a: ['C1', 'C6'], x: [0.05, 0.75] }, { da: ['C3', 'C4'], a: ['C2', 'C3'], x: [0.05, 0.75] }, { da: ['C5', 'C6'], a: ['C4', 'C5'], x: [0.05, 0.75] }],
      energia: [[0, 0, 'reagenti'], [0.5, 115, 'ET‡ aromatico'], [1, -166, 'cicloesene']], energiaMisurata: true,
      stadi: [[0, 0.5, ['Il diene (in conformazione s-cis) e il dienofilo si avvicinano faccia a faccia. Sei elettroni π si muovono insieme in un anello: lo stato di transizione è «aromatico» (4n + 2 = 6), per questo la reazione è permessa termicamente.', 'The diene (s-cis) and the dienophile approach face to face. Six π electrons move together around a ring: the transition state is «aromatic» (4n + 2 = 6), which is why the reaction is thermally allowed.']],
        [0.5, 1, ['Due nuovi legami σ al posto di due π: si forma il cicloesene. Ea ≈ 115 kJ/mol, ΔH ≈ −166 kJ/mol (misurate per butadiene + etene). La geometria dell\'anello è semplificata.', 'Two new σ bonds replace two π bonds: cyclohexene forms. Ea ≈ 115 kJ/mol, ΔH ≈ −166 kJ/mol (measured for butadiene + ethene). The ring geometry is simplified.']]],
      fonti: ['RowleySteiner51', 'WoodwardHoffmann', 'Clayden']
    });
  })();

  /* 6 · Sostituzione elettrofila aromatica: nitrazione del benzene */
  (function () {
    var atomi = { N: 'N', Oa: 'O', Ob: 'O' }, legami = [['N', 'Oa'], ['N', 'Ob'], ['C1', 'N']];
    for (var k = 1; k <= 6; k++) { atomi['C' + k] = 'C'; atomi['H' + k] = 'H'; legami.push(['C' + k, 'C' + (k % 6 + 1)]); legami.push(['C' + k, 'H' + k]); }
    function cc(k) { var a = (k - 1) * 60 * DEG; return [1.39 * Math.cos(a), 0, 1.39 * Math.sin(a)]; }
    reg({
      id: 'nitrazione', titolo: ['Nitrazione del benzene: l\'anello aromatico resiste', 'Nitration of benzene: the aromatic ring holds on'], eq: 'C₆H₆ + NO₂⁺ → C₆H₅NO₂ + H⁺', N: 2,
      atomi: atomi, legami: legami,
      geom: function (x) {
        var pos = {}, C1 = cc(1);
        for (var k = 1; k <= 6; k++) { pos['C' + k] = cc(k); if (k > 1) pos['H' + k] = mul(nrm(cc(k)), 1.39 + 1.08); }
        var aH = N(x, [[0, 0], [1, 52], [2, 52]]) * DEG, uscita = N(x, [[1, 0], [2, 2.6]]);
        pos.H1 = add(C1, mul(nrm(add(mul([1, 0, 0], Math.cos(aH)), [0, -Math.sin(aH), 0])), 1.08 + uscita));
        var aN = N(x, [[0, 90], [1, 52], [1.2, 52], [2, 0]]) * DEG, dN = N(x, [[0, 3.4], [1, 1.5], [2, 1.47]]), dirN = nrm(add(mul([1, 0, 0], Math.cos(aN)), [0, Math.sin(aN), 0]));
        var Np = add(C1, mul(dirN, dN)), ang = N(x, [[0, 180], [1, 125], [2, 124]]) * DEG / 2, perp = nrm(crs(dirN, [0, 0, 1]));
        pos.N = Np; pos.Oa = add(Np, mul(nrm(add(mul(dirN, Math.cos(ang)), mul([0, 0, 1], Math.sin(ang)))), 1.22)); pos.Ob = add(Np, mul(nrm(add(mul(dirN, Math.cos(ang)), mul([0, 0, -1], Math.sin(ang)))), 1.22));
        var arom = N(x, [[0, 1.5], [1, 1.33], [2, 1.5]]), o = {};
        for (k = 1; k <= 6; k++) { var a = 'C' + k, b = 'C' + (k % 6 + 1); o[a + '-' + b] = (k === 1 || k === 6) ? N(x, [[0, 1.5], [1, 1], [2, 1.5]]) : arom; o[a + '-H' + k] = 1; }
        o['C1-H1'] = N(x, [[0, 1], [1, 1], [1.5, 0.5], [2, 0]]); o['C1-N'] = N(x, [[0, 0], [0.7, 0.5], [1, 1]]); o['N-Oa'] = N(x, [[0, 2], [1, 1.5]]); o['N-Ob'] = N(x, [[0, 2], [1, 1.5]]);
        var sigma = N(x, [[0, 0], [1, 1], [1.2, 1], [2, 0]]);
        return { pos: pos, ord: o, car: { N: N(x, [[0, 1], [1, 1], [2, 1]]), Oa: N(x, [[0, 0], [1, -0.5]]), Ob: N(x, [[0, 0], [1, -0.5]]), C2: sigma / 3, C4: sigma / 3, C6: sigma / 3, H1: N(x, [[0, 0], [1.2, 0], [2, 1]]) } };
      },
      frecce: [{ da: ['C1', 'C2'], a: ['C1', 'N'], x: [0.1, 0.95] }, { da: ['N', 'Oa'], a: 'Oa', x: [0.2, 1.0] }, { da: ['C1', 'H1'], a: ['C1', 'C2'], x: [1.15, 1.9] }],
      energia: [[0, 0, 'reagenti'], [0.75, 75, 'ET₁‡'], [1, 55, 'complesso σ'], [1.3, 62, 'ET₂‡'], [2, -110, 'prodotti']],
      stadi: [[0, 1, ['Lo ione nitronio NO₂⁺ (da HNO₃ + H₂SO₄) è un elettrofilo fortissimo: due elettroni π dell\'anello lo attaccano. L\'aromaticità si perde: è lo stadio lento.', 'The nitronium ion NO₂⁺ (from HNO₃ + H₂SO₄) is a very strong electrophile: two π electrons of the ring attack it. Aromaticity is lost: this is the slow step.']],
        [1, 1.2, ['Complesso σ (ione arenio): la carica positiva è distribuita su tre carboni, in orto e in para rispetto al nuovo legame.', 'σ complex (arenium ion): the positive charge is spread over three carbons, ortho and para to the new bond.']],
        [1.2, 2, ['Il carbonio sp³ perde il suo H⁺ e l\'anello torna aromatico: per questo il benzene sostituisce invece di addizionare.', 'The sp³ carbon loses its H⁺ and the ring becomes aromatic again: this is why benzene substitutes instead of adding.']]],
      fonti: ['Clayden', 'Olah']
    });
  })();

  /* 7 · Sostituzione nucleofila acilica: idrolisi basica dell'acetato di metile */
  reg({
    id: 'acilica', titolo: ['Saponificazione di un estere: l\'intermedio tetraedrico', 'Ester saponification: the tetrahedral intermediate'], eq: 'CH₃COOCH₃ + HO⁻ → CH₃COO⁻ + CH₃OH', N: 3,
    atomi: { C: 'C', Oc: 'O', MeA: 'Me', Oe: 'O', MeE: 'Me', On: 'O', Hn: 'H' },
    legami: [['C', 'Oc'], ['C', 'MeA'], ['C', 'Oe'], ['Oe', 'MeE'], ['C', 'On'], ['On', 'Hn'], ['Oe', 'Hn']],
    geom: function (x) {
      var p1 = N(x, [[0, 0], [1, 1]]), w = nrm([0.656, 0, 0.755]);
      var dOc0 = [0, 1, 0], dMe0 = nrm([-0.87, -0.5, 0]), dOe0 = nrm([0.87, -0.5, 0]), dOn = nrm([0.15, 0.1, 1]);
      var tilt = function (d, k) { return nrm(add(d, mul([0, 0, -1], 0.33 * k))); };
      var dOc = tilt(dOc0, p1), dMe = tilt(dMe0, p1), dOe = tilt(dOe0, p1);
      var p2 = N(x, [[1, 0], [2, 1]]);
      var fOc = [0, 1, 0], fOn = nrm(add([0, -0.5, 0], mul(w, 0.866))), fMe = nrm(add([0, -0.5, 0], mul(w, -0.866)));
      dOc = nrm(lerp(dOc, fOc, p2)); dMe = nrm(lerp(dMe, fMe, p2)); dOn = nrm(lerp(dOn, fOn, p2));
      var dCO = N(x, [[0, 1.23], [1, 1.36], [2, 1.26]]), dCOn = N(x, [[0, 3.2], [1, 1.43], [2, 1.30]]), dCOe = N(x, [[0, 1.34], [1, 1.43], [2, 3.1]]);
      var Oe = mul(dOe, dCOe), On = mul(dOn, dCOn), MeE = add(Oe, mul(nrm([0.8, -0.2, -0.4]), 1.43));
      var hdir = nrm(lerp(nrm([0.2, 0.6, 0.8]), nrm(sub(Oe, On)), N(x, [[0, 0], [2, 1]]))), HnO = add(On, mul(hdir, 0.97)), HnE = add(Oe, mul(nrm(sub(On, Oe)), 0.96));
      var Hn = x <= 2 ? HnO : lerp(HnO, HnE, ss(x - 2));
      return { pos: { C: [0, 0, 0], Oc: mul(dOc, dCO), MeA: mul(dMe, 1.5), Oe: Oe, MeE: MeE, On: On, Hn: Hn },
        ord: { 'C-Oc': N(x, [[0, 2], [1, 1], [2, 1.5], [3, 1.5]]), 'C-MeA': 1, 'C-Oe': N(x, [[0, 1], [1, 1], [1.6, 0.4], [2, 0]]), 'Oe-MeE': 1, 'C-On': N(x, [[0, 0], [0.6, 0.5], [1, 1], [2, 1], [3, 1.5]]), 'On-Hn': N(x, [[0, 1], [2.1, 1], [2.5, 0.5], [3, 0]]), 'Oe-Hn': N(x, [[0, 0], [2.1, 0], [2.5, 0.5], [3, 1]]) },
        car: { On: N(x, [[0, -1], [1, 0], [2, 0], [3, -0.5]]), Oc: N(x, [[0, 0], [1, -1], [2, 0], [3, -0.5]]), Oe: N(x, [[1, 0], [2, -1], [3, 0]]) } };
    },
    frecce: [{ da: 'On', a: ['C', 'On'], x: [0.1, 0.95] }, { da: ['C', 'Oc'], a: 'Oc', x: [0.2, 1.0] }, { da: 'Oc', a: ['C', 'Oc'], x: [1.15, 1.95] }, { da: ['C', 'Oe'], a: 'Oe', x: [1.25, 2.0] }, { da: 'Oe', a: ['Oe', 'Hn'], x: [2.1, 2.9] }],
    energia: [[0, 0, 'reagenti'], [0.6, 60, 'ET₁‡'], [1, 25, 'intermedio tetraedrico'], [1.45, 48, 'ET₂‡'], [2, 8, 'acido + CH₃O⁻'], [2.4, 14, 'ET₃‡'], [3, -60, 'prodotti']],
    stadi: [[0, 1, ['L\'idrossido attacca il carbonio del carbonile (C=O polarizzato, δ+ sul carbonio) arrivando con un angolo di circa 107° (Bürgi–Dunitz). Il carbonio diventa tetraedrico, la carica negativa va sull\'ossigeno.', 'Hydroxide attacks the carbonyl carbon (polarised C=O, δ+ on carbon) at an angle of about 107° (Bürgi–Dunitz). The carbon becomes tetrahedral, the negative charge goes onto oxygen.']],
      [1, 2, ['Il doppio legame C=O si riforma e caccia il gruppo uscente, lo ione metossido CH₃O⁻.', 'The C=O double bond reforms and kicks out the leaving group, the methoxide ion CH₃O⁻.']],
      [2, 3, ['Il metossido, base forte, prende il protone dell\'acido carbossilico: si forma il carbossilato, stabilizzato per risonanza. È questo passo, quasi irreversibile, a spingere la saponificazione fino in fondo.', 'Methoxide, a strong base, takes the carboxylic acid\'s proton: the carboxylate forms, stabilised by resonance. This almost irreversible step drives saponification to completion.']]],
    fonti: ['Clayden', 'BurgiDunitz']
  });

  /* 8 · Clorurazione radicalica del metano (entalpie di legame vere) */
  reg({
    id: 'radicalica', titolo: ['Clorurazione radicalica: la reazione a catena', 'Radical chlorination: the chain reaction'], eq: 'CH₄ + Cl₂ —hν→ CH₃Cl + HCl', N: 3,
    atomi: { C: 'C', H1: 'H', H2: 'H', H3: 'H', H4: 'H', ClA: 'Cl', ClB: 'Cl', ClC: 'Cl', ClD: 'Cl' },
    legami: [['ClA', 'ClB'], ['C', 'H1'], ['C', 'H2'], ['C', 'H3'], ['C', 'H4'], ['H1', 'ClA'], ['ClC', 'ClD'], ['C', 'ClC']],
    geom: function (x) {
      var ph = N(x, [[0, 109.5], [1, 109.5], [2, 90], [2.2, 90], [3, 70.5]]) * DEG, H = ombrello([1, 0, 0], ph, 3, 0.5);
      var dCH1 = N(x, [[0, 1.09], [1, 1.09], [1.5, 1.42], [2, 3.0]]), H1 = [dCH1, 0, 0];
      var ClA = N(x, [[0, [2.6, 2.6, 0]], [1, [3.0, 1.2, 0]], [1.5, [2.85, 0, 0]], [2, [3.0 + 1.27, 0, 0]]]);
      var ClB = N(x, [[0, add([2.6, 2.6, 0], [0, 1.99, 0])], [1, [2.8, 5.2, 0]], [3, [2.6, 6.0, 0]]]);
      var ClC = N(x, [[0, [-4.2, 1.5, 0]], [2, [-3.0, 0.6, 0]], [2.5, [-2.05, 0, 0]], [3, [-1.78, 0, 0]]]);
      var ClD = add(ClC, mul([-1, 0, 0], N(x, [[0, 1.99], [2, 1.99], [2.5, 2.3], [3, 4.2]])));
      return { pos: { C: [0, 0, 0], H1: add(H1, [0, 0, 0]), H2: mul(H[0], 1.09), H3: mul(H[1], 1.09), H4: mul(H[2], 1.09), ClA: ClA, ClB: ClB, ClC: ClC, ClD: ClD },
        ord: { 'ClA-ClB': N(x, [[0, 1], [0.8, 0]]), 'C-H1': N(x, [[0, 1], [1, 1], [1.5, 0.5], [2, 0]]), 'H1-ClA': N(x, [[0, 0], [1, 0], [1.5, 0.5], [2, 1]]), 'C-H2': 1, 'C-H3': 1, 'C-H4': 1, 'ClC-ClD': N(x, [[0, 1], [2, 1], [2.5, 0.5], [3, 0]]), 'C-ClC': N(x, [[0, 0], [2, 0], [2.5, 0.5], [3, 1]]) },
        car: {}, rad: { ClA: N(x, [[0, 0], [0.8, 1], [1, 1], [2, 0]]), ClB: N(x, [[0, 0], [0.8, 1]]), C: N(x, [[1, 0], [2, 1], [2.1, 1], [3, 0]]), ClD: N(x, [[2, 0], [3, 1]]) } };
    },
    frecce: [{ da: ['ClA', 'ClB'], a: 'ClA', x: [0.05, 0.85], mezza: true }, { da: ['ClA', 'ClB'], a: 'ClB', x: [0.05, 0.85], mezza: true }, { da: 'ClA', a: ['H1', 'ClA'], x: [1.05, 1.9], mezza: true }, { da: ['C', 'H1'], a: ['H1', 'ClA'], x: [1.05, 1.9], mezza: true }, { da: ['C', 'H1'], a: 'C', x: [1.05, 1.9], mezza: true },
      { da: 'C', a: ['C', 'ClC'], x: [2.05, 2.9], mezza: true }, { da: ['ClC', 'ClD'], a: ['C', 'ClC'], x: [2.05, 2.9], mezza: true }, { da: ['ClC', 'ClD'], a: 'ClD', x: [2.05, 2.9], mezza: true }],
    energia: [[0, 0, 'CH₄ + Cl₂'], [1, 243, '2 Cl·'], [1.5, 259, 'ET₁‡'], [2, 250, 'CH₃· + HCl'], [2.5, 254, 'ET₂‡'], [3, 141, 'CH₃Cl + Cl·']], energiaMisurata: true,
    stadi: [[0, 1, ['Inizio: la luce (hν) spezza Cl₂ in due atomi con un elettrone spaiato, i radicali Cl· (243 kJ/mol, l\'energia del legame Cl–Cl). Le frecce a mezza punta muovono UN elettrone.', 'Initiation: light (hν) splits Cl₂ into two atoms with an unpaired electron, Cl· radicals (243 kJ/mol, the Cl–Cl bond energy). Half-headed arrows move ONE electron.']],
      [1, 2, ['Propagazione 1: Cl· strappa un idrogeno al metano. ΔH ≈ +7 kJ/mol (439 per C–H rotto, 432 per H–Cl formato). Il radicale metile CH₃· è quasi piatto.', 'Propagation 1: Cl· pulls a hydrogen off methane. ΔH ≈ +7 kJ/mol (439 for the broken C–H, 432 for the H–Cl formed). The methyl radical CH₃· is almost flat.']],
      [2, 3, ['Propagazione 2: CH₃· prende un cloro da un\'altra molecola di Cl₂ e libera un nuovo Cl·, che ricomincia il ciclo: una reazione a catena. ΔH ≈ −109 kJ/mol (243 rotto, 352 formato per C–Cl).', 'Propagation 2: CH₃· takes a chlorine from another Cl₂ molecule and frees a new Cl·, which starts the cycle again: a chain reaction. ΔH ≈ −109 kJ/mol (243 broken, 352 formed for C–Cl).']]],
    fonti: ['Luo07', 'Clayden']
  });

  var FONTI = {
    Clayden: 'Clayden J., Greeves N., Warren S., Organic Chemistry, 2ª ed., Oxford University Press 2012',
    Anslyn: 'Anslyn E. V., Dougherty D. A., Modern Physical Organic Chemistry, University Science Books 2006',
    Markovnikov1870: 'Markovnikov V. V. (1870), Annalen der Chemie und Pharmacie 153, 228',
    RowleySteiner51: 'Rowley D., Steiner H. (1951), Discuss. Faraday Soc. 10, 198 — butadiene + etene: Ea ≈ 27,5 kcal/mol (115 kJ/mol)',
    WoodwardHoffmann: 'Woodward R. B., Hoffmann R. (1965), J. Am. Chem. Soc. 87, 395 — conservazione della simmetria orbitale',
    Olah: 'Olah G. A. (1971), Acc. Chem. Res. 4, 240 — gli ioni arenio',
    BurgiDunitz: 'Bürgi H. B., Dunitz J. D., Lehn J. M., Wipff G. (1974), Tetrahedron 30, 1563 — la traiettoria di attacco al carbonile',
    Luo07: 'Luo Y.-R., Comprehensive Handbook of Chemical Bond Energies, CRC Press 2007 — Cl–Cl 243, CH₃–H 439, H–Cl 432, CH₃–Cl 352 kJ/mol'
  };

  /* ═══ calcoli per il banco e per la pagina ═══════════════════════════════ */
  function idLegame(l) { return l[0] + '-' + l[1]; }
  function caricaTotale(m, x) { var G = m.geom(x), s = 0; Object.keys(G.car || {}).forEach(function (k) { s += G.car[k]; }); return s; }
  function distanza(m, x, a, b) { var G = m.geom(x); return len(sub(G.pos[a], G.pos[b])); }
  /** energia alla coordinata x: interpolazione a coseno fra i punti stazionari (massimi e minimi esatti ai nodi) */
  function energia(m, x) { var E = m.energia; if (x <= E[0][0]) return E[0][1]; for (var i = 1; i < E.length; i++) if (x <= E[i][0]) { var a = E[i - 1], b = E[i], u = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * (1 - Math.cos(PI * u)) / 2; } return E[E.length - 1][1]; }
  function stadio(m, x) { for (var i = 0; i < m.stadi.length; i++) if (x <= m.stadi[i][1] + 1e-9) return i; return m.stadi.length - 1; }

  /** il volume occupato durante TUTTA la reazione: centro della scatola e raggio della sfera che la contiene (per inquadrare) */
  function ingombro(m) {
    var lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], P = [];
    for (var x = 0; x <= m.N + 1e-9; x += 0.1) { var G = m.geom(x); Object.keys(G.pos).forEach(function (k) { var p = G.pos[k]; P.push(p); for (var i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); } }); }
    var c = mul(add(lo, hi), 0.5), r = 0; P.forEach(function (p) { r = Math.max(r, len(sub(p, c))); });
    return { centro: c, raggio: r + 0.6 };
  }

  /* ═══ il disegno ═════════════════════════════════════════════════════════ */
  var CPK = { H: ['#f2f6fa', 0.26], C: ['#4a5466', 0.38], O: ['#ff4d4d', 0.36], N: ['#4d7bff', 0.36], Br: ['#b04030', 0.5], Cl: ['#3fd06b', 0.45], Me: ['#7d8ea8', 0.46] };
  var ETICH = { O: 'O', N: 'N', Br: 'Br', Cl: 'Cl', Me: 'CH₃' };
  function testoTex(T, s, col, px) {
    var c = D.createElement('canvas'), q = c.getContext('2d'); px = px || 44; q.font = '700 ' + px + 'px system-ui,sans-serif'; var w = Math.ceil(q.measureText(s).width) + 14; c.width = w; c.height = px + 14;
    q.font = '700 ' + px + 'px system-ui,sans-serif'; q.textBaseline = 'middle'; q.lineWidth = 6; q.strokeStyle = 'rgba(3,6,14,.85)'; q.strokeText(s, 7, c.height / 2); q.fillStyle = col || '#fff'; q.fillText(s, 7, c.height / 2);
    var tx = new T.CanvasTexture(c); tx.minFilter = T.LinearFilter; return { tx: tx, r: w / c.height };
  }
  function sprite(T, s, col, h) { var o = testoTex(T, s, col), sp = new T.Sprite(new T.SpriteMaterial({ map: o.tx, transparent: true, depthTest: false, depthWrite: false })); sp.scale.set(h * o.r, h, 1); sp.renderOrder = 20; return sp; }

  function motore(S, T, m, opz) {
    opz = opz || {};
    var radice = new T.Group(), G0 = m.geom(0); S.aggiungi(radice);
    var atomi = {}, geoS = new T.SphereGeometry(1, 28, 20);
    Object.keys(m.atomi).forEach(function (id) {
      var el = m.atomi[id], c = CPK[el] || CPK.C, mesh = new T.Mesh(geoS, new T.MeshStandardMaterial({ color: c[0], roughness: 0.35, metalness: 0.08, emissive: c[0], emissiveIntensity: 0.12, transparent: true }));
      mesh.scale.setScalar(c[1]); radice.add(mesh);
      var et = ETICH[el] ? sprite(T, ETICH[el], '#ffffff', 0.34) : null; if (et) radice.add(et);
      var car = sprite(T, '+', '#ffd24a', 0.42); car.visible = false; radice.add(car);
      atomi[id] = { el: el, mesh: mesh, et: et, car: car, segno: 0 };
    });
    var geoC = new T.CylinderGeometry(1, 1, 1, 14, 1), legami = [], Y = new T.Vector3(0, 1, 0);
    m.legami.forEach(function (l) {
      var mat = function (op) { return new T.MeshStandardMaterial({ color: '#c9d3df', roughness: 0.5, metalness: 0.05, transparent: true, opacity: op }); };
      var a = new T.Mesh(geoC, mat(1)), b = new T.Mesh(geoC, mat(1)), tr = [];
      for (var k = 0; k < 4; k++) { var s0 = new T.Mesh(geoC, new T.MeshBasicMaterial({ color: '#9fe7ff', transparent: true, opacity: 0.9 })); radice.add(s0); tr.push(s0); }
      radice.add(a); radice.add(b); legami.push({ id: idLegame(l), a: l[0], b: l[1], m1: a, m2: b, tr: tr });
    });
    /* le frecce curve degli elettroni */
    var frecce = m.frecce.map(function (f) { var g0 = new T.Group(); radice.add(g0); var punta = new T.Mesh(new T.ConeGeometry(0.11, 0.3, 14), new T.MeshBasicMaterial({ color: '#ff5f7a', transparent: true })); g0.add(punta); return { f: f, g: g0, punta: punta, tubo: null, chiave: '' }; });
    var asseCam = new T.Vector3(), tmp = new T.Vector3(), tmp2 = new T.Vector3();
    function punto(G, rif) { if (Array.isArray(rif)) return lerp(G.pos[rif[0]], G.pos[rif[1]], 0.5); return G.pos[rif]; }
    function aggiornaFreccia(F0, G, x) {
      var f = F0.f, a0 = f.x[0], a1 = f.x[1], p = cl((x - a0) / ((a1 - a0) * 0.45), 0, 1), fine = cl((a1 - x) / ((a1 - a0) * 0.2), 0, 1), vis = x >= a0 && x <= a1 && opz.frecce !== false;
      F0.g.visible = vis; if (!vis) return;
      var P0 = punto(G, f.da), P2 = punto(G, f.a), d = sub(P2, P0), L = len(d) || 1;
      S.cam.getWorldDirection(asseCam); var vc = [asseCam.x, asseCam.y, asseCam.z], lato = nrm(crs(d, vc)); if (!isFinite(lato[0]) || len(crs(d, vc)) < 1e-4) lato = [0, 1, 0];
      if (f.da === f.a || (!Array.isArray(f.da) && !Array.isArray(f.a) && f.da === f.a)) lato = [0, 1, 0];
      var C1 = add(lerp(P0, P2, 0.5), mul(lato, Math.max(0.55, L * 0.45) * (f.lato || 1))), Q0 = add(P0, mul(nrm(sub(C1, P0)), 0.32)), Q2 = add(P2, mul(nrm(sub(C1, P2)), 0.36));
      var curva = new T.QuadraticBezierCurve3(new T.Vector3(Q0[0], Q0[1], Q0[2]), new T.Vector3(C1[0], C1[1], C1[2]), new T.Vector3(Q2[0], Q2[1], Q2[2]));
      if (F0.tubo) { F0.g.remove(F0.tubo); F0.tubo.geometry.dispose(); }
      var tubo = new T.Mesh(new T.TubeGeometry(curva, 28, 0.035, 8, false), new T.MeshBasicMaterial({ color: f.mezza ? '#ffb547' : '#ff5f7a', transparent: true, opacity: 0.95 * fine })); F0.g.add(tubo); F0.tubo = tubo;
      var nIdx = tubo.geometry.index.count; tubo.geometry.setDrawRange(0, Math.floor(nIdx * p / 6) * 6);
      var cp = curva.getPoint(Math.max(0.02, p)), tg = curva.getTangent(Math.max(0.02, p)); F0.punta.position.copy(cp); F0.punta.quaternion.setFromUnitVectors(Y, tg.normalize()); F0.punta.material.color.set(f.mezza ? '#ffb547' : '#ff5f7a'); F0.punta.material.opacity = 0.95 * fine; F0.punta.visible = p > 0.05;
      if (f.mezza) F0.punta.scale.set(0.8, 1, 0.35); else F0.punta.scale.set(1, 1, 1);
    }
    var risultato = { G: null };
    function imposta(x) {
      var G = m.geom(x); risultato.G = G; risultato.x = x;
      Object.keys(atomi).forEach(function (id) {
        var A = atomi[id], p = G.pos[id]; A.mesh.position.set(p[0], p[1], p[2]);
        if (A.et) { A.et.position.set(p[0], p[1], p[2]); A.et.visible = opz.etichette !== false; }
        var q = (G.car && G.car[id]) || 0, r = (G.rad && G.rad[id]) || 0, segno = r > 0.15 ? 'r' : q > 0.12 ? '+' : q < -0.12 ? '−' : '';
        if (segno !== A.segno) { A.segno = segno; if (segno) { var nuovo = sprite(T, segno === 'r' ? '•' : (Math.abs(q) < 0.9 && segno !== 'r' ? 'δ' : '') + segno, segno === '+' ? '#ffd24a' : segno === 'r' ? '#ffb547' : '#6bcfff', 0.44); radice.remove(A.car); A.car.material.map.dispose(); A.car.material.dispose(); A.car = nuovo; radice.add(nuovo); } }
        A.car.visible = !!segno; if (segno) { var k = Math.min(1, Math.abs(segno === 'r' ? r : q)); A.car.material.opacity = 0.35 + 0.65 * k; A.car.position.set(p[0] + 0.32, p[1] + 0.42, p[2]); }
      });
      S.cam.getWorldDirection(asseCam);
      legami.forEach(function (Lg) {
        var o = (G.ord && G.ord[Lg.id]) != null ? G.ord[Lg.id] : 1, pa = G.pos[Lg.a], pb = G.pos[Lg.b], d = sub(pb, pa), L = len(d) || 1e-6, dir = mul(d, 1 / L);
        tmp.set(dir[0], dir[1], dir[2]);
        function cil(mesh, p0, p1, r, op) { var dd = sub(p1, p0), l = len(dd); mesh.visible = op > 0.02 && l > 1e-4; if (!mesh.visible) return; mesh.position.set((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2); mesh.scale.set(r, l, r); tmp2.set(dd[0] / l, dd[1] / l, dd[2] / l); mesh.quaternion.setFromUnitVectors(Y, tmp2); mesh.material.opacity = op; }
        var solido = cl((o - 0.75) / 0.25, 0, 1), parz = o > 0.04 && o < 0.98 ? 1 : 0;
        var lat = nrm(crs(dir, [asseCam.x, asseCam.y, asseCam.z])); if (!isFinite(lat[0])) lat = [0, 1, 0];
        var off = o > 1.04 ? 0.11 : 0;
        cil(Lg.m1, add(pa, mul(lat, off)), add(pb, mul(lat, off)), 0.085, solido);
        cil(Lg.m2, add(pa, mul(lat, -off)), add(pb, mul(lat, -off)), 0.065, o > 1.04 ? cl(o - 1, 0, 1) : 0);
        for (var k = 0; k < Lg.tr.length; k++) { var u0 = (k + 0.25) / Lg.tr.length, u1 = (k + 0.7) / Lg.tr.length; cil(Lg.tr[k], lerp(pa, pb, u0), lerp(pa, pb, u1), 0.05, parz ? 0.35 + 0.6 * Math.min(1, o * 1.6) * (1 - solido) : 0); }
      });
      frecce.forEach(function (F0) { aggiornaFreccia(F0, G, x); });
      return G;
    }
    var ing = ingombro(m), cc = ing.centro; radice.position.set(-cc[0], -cc[1], -cc[2]);
    return { imposta: imposta, risultato: risultato, raggio: ing.raggio, distruggi: function () { radice.traverse(function (o) { if (o.geometry && o.geometry !== geoS && o.geometry !== geoC) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); geoS.dispose(); geoC.dispose(); S.radice.remove(radice); } };
  }

  /* ═══ la pagina ═════════════════════════════════════════════════════════ */
  function stile() {
    if (D.getElementById('bsiM3-stile')) return; var s = D.createElement('style'); s.id = 'bsiM3-stile';
    s.textContent = '.bsiM3-palco{position:relative;margin:0 auto;border-radius:12px;overflow:hidden;background:#04070f}.bsiM3-palco .bsi3d-box{margin:0;border-radius:12px;background:#04070f}' +
      '.bsiM3-tit{position:absolute;left:10px;right:10px;top:10px;pointer-events:none;color:#fff;font:800 clamp(15px,4.2vw,20px)/1.2 system-ui,sans-serif;text-shadow:0 1px 4px #000}.bsiM3-tit small{display:block;margin-top:3px;font:600 12px ui-monospace,Menlo,monospace;color:#9fe7ff}' +
      '.bsiM3-vivo{position:absolute;left:8px;right:8px;bottom:8px;pointer-events:none}' +
      '.bsiM3-passo{min-height:84px;margin:8px 0;padding:10px 12px;border-radius:10px;background:#0a1628;border:1px solid #1a3050;color:#dfe8f2;font:500 .92rem/1.5 system-ui,sans-serif}.bsiM3-passo b{color:#5fe3d6}' +
      '.bsiM3-com{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}.bsiM3-com button{min-height:40px;min-width:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;font:600 .85rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}.bsiM3-com button[aria-pressed="true"]{border-color:#00c9b7;color:#00c9b7}.bsiM3-com label{display:flex;align-items:center;gap:6px;font:500 .82rem system-ui,sans-serif;color:#cfe3f7}' +
      '.bsiM3-tempo{width:100%;accent-color:#ff5f7a}.bsiM3-scelte{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.bsiM3-scelte button{min-height:36px;border-radius:18px;border:1px solid #2a4a6e;background:#0a1b2e;color:#cfe3f7;font:600 .8rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}.bsiM3-scelte button[aria-pressed="true"]{border-color:#ff5f7a;color:#ff8fa3}' +
      '.bsiM3-leg{display:flex;flex-wrap:wrap;gap:10px;font:500 .78rem system-ui,sans-serif;color:#9fb3c8;margin:4px 0}.bsiM3-leg i{display:inline-block;width:18px;height:4px;border-radius:2px;vertical-align:middle;margin-right:4px}';
    D.head.appendChild(s);
  }
  function crea(cont, id, opz) {
    opz = opz || {}; stile();
    var m = M.filter(function (x) { return x.id === id; })[0] || M[0];
    if (cont._m3) cont._m3.distruggi(); cont.textContent = '';
    var palco = F.el('div', { 'class': 'bsiM3-palco' }), barra = F.el('input', { type: 'range', 'class': 'bsiM3-tempo', min: '0', max: String(m.N), step: '0.001', value: '0', 'aria-label': t('Coordinata di reazione', 'Reaction coordinate') });
    var com = F.el('div', { 'class': 'bsiM3-com', role: 'toolbar', 'aria-label': t('Comandi del meccanismo', 'Mechanism controls') }), passo = F.el('div', { 'class': 'bsiM3-passo', 'aria-live': 'polite' });
    var leg = F.el('div', { 'class': 'bsiM3-leg', html: '<span><i style="background:#ff5f7a"></i>' + t('freccia: si sposta una coppia di elettroni', 'arrow: an electron pair moves') + '</span><span><i style="background:#ffb547"></i>' + t('mezza freccia: un elettrone solo', 'half arrow: a single electron') + '</span><span><i style="background:repeating-linear-gradient(90deg,#9fe7ff 0 5px,transparent 5px 8px)"></i>' + t('legame che si forma o si rompe', 'bond forming or breaking') + '</span>' });
    cont.appendChild(palco); cont.appendChild(barra); cont.appendChild(com); cont.appendChild(passo); cont.appendChild(leg);
    var fo = F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Fonti', 'Sources') + '</b> · ' + m.fonti.map(function (k) { return FONTI[k]; }).join(' · ') + '<br>' + (m.energiaMisurata ? t('Energie dalle fonti citate.', 'Energies from the cited sources.') : t('Energie INDICATIVE (ordini di grandezza, in soluzione).', 'Energies INDICATIVE (orders of magnitude, in solution).')) + ' ' + t('Geometrie SEMPLIFICATE: lunghezze e angoli tipici, i metili come una sfera «CH₃».', 'Geometries SIMPLIFIED: typical lengths and angles, methyls as one «CH₃» sphere.') });
    cont.appendChild(fo);
    var api = { id: m.id, pronto: false, meccanismo: m }, vivo = true, M3 = null; api.distruggi = function () { vivo = false; if (M3) M3.distruggi(); }; cont._m3 = api;
    var L3 = g.BSILab3D; if (!L3) { palco.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return api; }
    L3.stile();
    L3.caricaThree().then(function () {
      if (!vivo) return; var T = g.THREE, largo = (g.innerWidth || 400) > 900;
      var S = new L3.Scena(palco, largo ? 0.6 : 1.25); palco.insertBefore(S.box, palco.firstChild); S.adatta(); S.ren.setClearColor(0x04070f, 1);
      if (S.cinema) try { S.cinema({ forza: 0.4, soglia: 0.7, vignetta: 0.3, esposizione: 1.0 }); } catch (e) { }
      var tit = F.el('div', { 'class': 'bsiM3-tit' }); tit.innerHTML = F.tt(m.titolo) + '<small>' + m.eq + '</small>'; S.box.appendChild(tit);
      var cv = D.createElement('canvas'); cv.className = 'bsiM3-vivo'; cv.setAttribute('role', 'img'); S.box.appendChild(cv); var q = cv.getContext('2d'), Wc = 0, Hc = 0;
      M3 = motore(S, T, m, opz);
      /* la distanza della camera dal raggio dell'ingombro e dal campo visivo più stretto (su un telefono è l'orizzontale) */
      var asp = S.cam.aspect || 0.8, fv = S.cam.fov * DEG, fmin = Math.min(fv, 2 * Math.atan(Math.tan(fv / 2) * asp)), dist = M3.raggio / Math.sin(fmin / 2) * 0.88;
      S.inquadra(dist, 1.2, 1.15); S.vista.bersaglio.set(0, 0, -M3.raggio * 0.32);
      var x = Math.max(0, Math.min(m.N, opz.x || 0)), gioca = !MENO_MOTO && opz.gioca !== false, vel = 1, ultimoS = -1, ultimoUI = -1;
      function bott(tx, f, aria) { var b = F.el('button', { type: 'button', testo: tx, 'aria-label': aria || tx, onclick: function () { f(b); } }); com.appendChild(b); return b; }
      var bP = bott('⏸', function () { if (x >= m.N - 1e-3) x = 0; gioca = !gioca; segna(); S.avvia(); }, t('Riproduci o metti in pausa', 'Play or pause'));
      bott('↺', function () { x = 0; gioca = !MENO_MOTO; segna(); S.avvia(); }, t('Ricomincia', 'Restart'));
      bott('⏮', function () { var i = stadio(m, x); x = i ? m.stadi[i - 1][0] : 0; gioca = false; segna(); S.avvia(); }, t('Passo precedente', 'Previous step'));
      bott('⏭', function () { var i = stadio(m, x); x = Math.min(m.N, m.stadi[i][1] + (x >= m.stadi[i][1] - 0.01 && i + 1 < m.stadi.length ? m.stadi[i + 1][1] - m.stadi[i][1] : 0)); gioca = false; segna(); S.avvia(); }, t('Passo successivo', 'Next step'));
      var selV = F.el('select', { 'aria-label': t('Velocità', 'Speed') }); [0.5, 1, 2].forEach(function (v) { var o = F.el('option', { value: String(v), testo: v + '×' }); if (v === 1) o.selected = true; selV.appendChild(o); }); selV.addEventListener('change', function () { vel = +selV.value; }); com.appendChild(F.el('label', {}, [F.el('span', { testo: t('Velocità', 'Speed') }), selV]));
      var cF = F.el('input', { type: 'checkbox' }); cF.checked = opz.frecce !== false; cF.addEventListener('change', function () { opz.frecce = cF.checked; S.avvia(); }); com.appendChild(F.el('label', {}, [cF, F.el('span', { testo: t('Frecce degli elettroni', 'Electron arrows') })]));
      function segna() { bP.textContent = gioca ? '⏸' : '▶'; bP.setAttribute('aria-pressed', String(gioca)); }
      segna();
      barra.addEventListener('input', function () { x = +barra.value; gioca = false; segna(); S.avvia(); });
      function misura() { var dpr = Math.min(2, g.devicePixelRatio || 1), w = S.box.clientWidth - 16, h = Math.round(Math.min(150, S.ren.domElement.clientHeight * 0.26)); if (w === Wc && h === Hc) return; Wc = w; Hc = h; cv.style.height = h + 'px'; cv.width = w * dpr; cv.height = h * dpr; q.setTransform(dpr, 0, 0, dpr, 0, 0); }
      function profilo() {
        misura(); var W = Wc, H = Hc; q.clearRect(0, 0, W, H);
        q.fillStyle = 'rgba(4,8,18,.66)'; q.strokeStyle = 'rgba(120,150,200,.22)'; q.beginPath(); if (q.roundRect) q.roundRect(0.5, 0.5, W - 1, H - 1, 10); else q.rect(0.5, 0.5, W - 1, H - 1); q.fill(); q.stroke();
        var Es = m.energia.map(function (p) { return p[1]; }), lo = Math.min.apply(null, Es), hi = Math.max.apply(null, Es), pad = (hi - lo) * 0.18 + 5, x0 = 34, x1 = W - 10, y0 = 20, y1 = H - 14;
        var X = function (v) { return x0 + v / m.N * (x1 - x0); }, Yv = function (e) { return y1 - (e - (lo - pad)) / (hi - lo + 2 * pad) * (y1 - y0); };
        q.font = '500 8.5px ui-monospace,Menlo,monospace'; q.fillStyle = 'rgba(200,214,232,.9)'; q.fillText(t('energia (kJ/mol)', 'energy (kJ/mol)'), 6, 12); q.textAlign = 'right'; q.fillText(t('coordinata di reazione →', 'reaction coordinate →'), x1, H - 3); q.textAlign = 'left';
        q.strokeStyle = 'rgba(140,160,190,.3)'; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0, y1); q.lineTo(x1, y1); q.stroke();
        q.setLineDash([2, 4]); q.beginPath(); q.moveTo(x0, Yv(0)); q.lineTo(x1, Yv(0)); q.stroke(); q.setLineDash([]);
        var gr = q.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#6bcfff'); gr.addColorStop(0.5, '#ff8fa3'); gr.addColorStop(1, '#5fe3d6');
        q.strokeStyle = gr; q.lineWidth = 2.4; q.shadowColor = '#ff8fa3'; q.shadowBlur = 8; q.beginPath(); for (var k = 0; k <= 200; k++) { var xx = k / 200 * m.N, px = X(xx), py = Yv(energia(m, xx)); if (k) q.lineTo(px, py); else q.moveTo(px, py); } q.stroke(); q.shadowBlur = 0; q.lineWidth = 1;
        m.energia.forEach(function (p, i) { var px = X(p[0]), py = Yv(p[1]), max = (i > 0 && i < m.energia.length - 1 && p[1] > m.energia[i - 1][1] && p[1] > m.energia[i + 1][1]); q.fillStyle = max ? '#ff8fa3' : '#9fe7ff'; q.font = '600 8.5px system-ui,sans-serif'; q.textAlign = 'center'; var et = p[2] + ' ' + (p[1] > 0 ? '+' : '') + Math.round(p[1]); q.fillText(et, Math.max(x0 + 20, Math.min(x1 - 20, px)), max ? py - 5 : py + 11); });
        q.textAlign = 'left';
        var mx = X(x), my = Yv(energia(m, x)), rg = q.createRadialGradient(mx, my, 0, mx, my, 13); rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(0.3, 'rgba(255,200,210,.7)'); rg.addColorStop(1, 'rgba(255,140,160,0)'); q.fillStyle = rg; q.beginPath(); q.arc(mx, my, 13, 0, 2 * PI); q.fill(); q.fillStyle = '#fff'; q.beginPath(); q.arc(mx, my, 2.6, 0, 2 * PI); q.fill();
        cv.setAttribute('aria-label', t('Profilo energetico: ', 'Energy profile: ') + Math.round(energia(m, x)) + ' kJ/mol');
      }
      S.ogniFotogramma(function (dt) {
        if (!vivo) return false; if (D.hidden) return true;
        if (gioca) { x += dt * vel / 4; if (x >= m.N) { x = m.N; gioca = false; segna(); } }
        M3.imposta(x);
        var k = Math.round(x * 60); if (k !== ultimoUI) { ultimoUI = k; barra.value = String(x); profilo(); var i = stadio(m, x); if (i !== ultimoS) { ultimoS = i; passo.innerHTML = '<b>' + t('Passo ', 'Step ') + (i + 1) + '/' + m.stadi.length + '</b> · ' + F.tt(m.stadi[i][2]); } api.ultimo = { x: x, stadio: i, energia: energia(m, x) }; }
        if (!MENO_MOTO && gioca) { S.vista.th += dt * 0.08; }
        return true;
      });
      F.alRidimensiona(function () { S.adatta(); Wc = 0; });
      api.pronto = true; api.S = S; api.vai = function (v) { x = v; S.avvia(); }; api.gioca = function (v) { gioca = v; segna(); S.avvia(); }; api.motore = function () { return M3; };
      M3.imposta(x); profilo(); S.avvia();
    }).catch(function (e) { palco.textContent = '⚠ ' + e.message; });
    return api;
  }
  function schedaSezione(div) {
    stile();
    var scelte = F.el('div', { 'class': 'bsiM3-scelte', role: 'group', 'aria-label': t('Meccanismi', 'Mechanisms') }), palco = F.el('div'), tasti = {};
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Ogni meccanismo è un film 3D: ▶ lo fa scorrere, la barra lo ferma dove vuoi, ⏮ ⏭ saltano da un passo all\'altro, il dito ruota la scena. Sotto, il profilo energetico: il punto bianco è la reazione, adesso.', 'Every mechanism is a 3D film: ▶ plays it, the bar stops it where you like, ⏮ ⏭ jump between steps, your finger rotates the scene. Below, the energy profile: the white dot is the reaction, right now.') }));
    div.appendChild(scelte); div.appendChild(palco);
    function apri(id) { Object.keys(tasti).forEach(function (k) { tasti[k].setAttribute('aria-pressed', String(k === id)); }); div._m3 = crea(palco, id); return div._m3; }
    M.forEach(function (m) { var b = F.el('button', { type: 'button', 'aria-pressed': 'false', testo: F.tt(m.titolo).split(':')[0] }); b.addEventListener('click', function () { apri(m.id); }); tasti[m.id] = b; scelte.appendChild(b); });
    div._apri = apri; apri('sn2');
  }
  F.sezione('smecc3d', {
    titolo: ['🧪 Meccanismi 3D', '🧪 3D mechanisms'],
    sotto: ['Le reazioni della chimica organica come film tridimensionali: atomi che si muovono, legami che si formano e si rompono, frecce degli elettroni, cariche, e il profilo energetico che segue la reazione: SN2, SN1, E2, Markovnikov, Diels–Alder, nitrazione del benzene, saponificazione, clorurazione radicalica.', 'Organic chemistry reactions as three-dimensional films: moving atoms, bonds forming and breaking, electron arrows, charges, and the energy profile following the reaction: SN2, SN1, E2, Markovnikov, Diels–Alder, benzene nitration, saponification, radical chlorination.'],
    schede: [{ nome: ['🧪 I meccanismi', '🧪 The mechanisms'], costruisci: schedaSezione }]
  });
  g.BSIMeccanismi3D = { M: M, FONTI: FONTI, crea: crea, energia: energia, caricaTotale: caricaTotale, distanza: distanza, stadio: stadio, idLegame: idLegame, N: N, apri: function (id) { if (typeof g.goSection === 'function') g.goSection('smecc3d'); setTimeout(function () { var d = D.querySelector('#smecc3d .bsiM3-scelte'); d = d && d.parentNode; if (d && d._apri) d._apri(id); }, 400); } };
})(typeof window !== 'undefined' ? window : globalThis);
