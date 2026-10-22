/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-cristalli.js — cristallografia e raggi X
   BioSpecInfo · © Samuele Pio Provenzano

   · I 14 RETICOLI DI BRAVAIS disegnati in prospettiva dai loro parametri
     (a, b, c, α, β, γ) e dal tipo di centratura (P, I, F, C, R), da girare
     col dito o col mouse.
   · GLI INDICI DI MILLER: il piano (hkl) dentro la cella cubica e la distanza
     interplanare d per i sistemi cubico, tetragonale, ortorombico, esagonale.
   · IL DIFFRATTOGRAMMA DI POLVERE: per ogni (hkl) la legge di Bragg
     λ = 2d sinθ da' la posizione; il FATTORE DI STRUTTURA
     F(hkl) = Σ f_j e^(2πi(hx_j + ky_j + lz_j)) l'intensita' — e con lui le
     ESTINZIONI SISTEMATICHE (fcc: h, k, l non tutti pari o tutti dispari
     mancano; bcc: h+k+l dispari manca; diamante: in piu' le h+k+l = 4n+2) —,
     moltiplicata per la molteplicita' e per il fattore di Lorentz-
     polarizzazione (1 + cos²2θ)/(sin²θ cosθ). I fattori di forma atomici
     sono approssimati (Z con un decadimento gaussiano in sinθ/λ): le
     POSIZIONI dei picchi sono esatte, le intensita' sono indicative.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var RAD = Math.PI / 180;

  var BRAVAIS = [
    { s: ['Cubico', 'Cubic'], c: 'P', a: 1, b: 1, c2: 1, al: 90, be: 90, ga: 90 },
    { s: ['Cubico', 'Cubic'], c: 'I', a: 1, b: 1, c2: 1, al: 90, be: 90, ga: 90 },
    { s: ['Cubico', 'Cubic'], c: 'F', a: 1, b: 1, c2: 1, al: 90, be: 90, ga: 90 },
    { s: ['Tetragonale', 'Tetragonal'], c: 'P', a: 1, b: 1, c2: 1.5, al: 90, be: 90, ga: 90 },
    { s: ['Tetragonale', 'Tetragonal'], c: 'I', a: 1, b: 1, c2: 1.5, al: 90, be: 90, ga: 90 },
    { s: ['Ortorombico', 'Orthorhombic'], c: 'P', a: 1, b: 1.3, c2: 1.7, al: 90, be: 90, ga: 90 },
    { s: ['Ortorombico', 'Orthorhombic'], c: 'C', a: 1, b: 1.3, c2: 1.7, al: 90, be: 90, ga: 90 },
    { s: ['Ortorombico', 'Orthorhombic'], c: 'I', a: 1, b: 1.3, c2: 1.7, al: 90, be: 90, ga: 90 },
    { s: ['Ortorombico', 'Orthorhombic'], c: 'F', a: 1, b: 1.3, c2: 1.7, al: 90, be: 90, ga: 90 },
    { s: ['Esagonale', 'Hexagonal'], c: 'P', a: 1, b: 1, c2: 1.6, al: 90, be: 90, ga: 120 },
    { s: ['Romboedrico', 'Rhombohedral'], c: 'R', a: 1, b: 1, c2: 1, al: 70, be: 70, ga: 70 },
    { s: ['Monoclino', 'Monoclinic'], c: 'P', a: 1, b: 1.3, c2: 1.6, al: 90, be: 110, ga: 90 },
    { s: ['Monoclino', 'Monoclinic'], c: 'C', a: 1, b: 1.3, c2: 1.6, al: 90, be: 110, ga: 90 },
    { s: ['Triclino', 'Triclinic'], c: 'P', a: 1, b: 1.2, c2: 1.5, al: 75, be: 82, ga: 105 }
  ];
  var CENTRI = { P: [], I: [[0.5, 0.5, 0.5]], F: [[0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]], C: [[0.5, 0.5, 0]], R: [] };
  function vettori(L) {
    var a = L.a, b = L.b, c = L.c2, al = L.al * RAD, be = L.be * RAD, ga = L.ga * RAD;
    var cx = c * Math.cos(be), cy = c * (Math.cos(al) - Math.cos(be) * Math.cos(ga)) / Math.sin(ga), cz = Math.sqrt(Math.max(0, c * c - cx * cx - cy * cy));
    return [[a, 0, 0], [b * Math.cos(ga), b * Math.sin(ga), 0], [cx, cy, cz]];
  }

  /* fcc, bcc, cubico semplice: le traslazioni del reticolo */
  var TR = { F: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]], I: [[0, 0, 0], [0.5, 0.5, 0.5]], P: [[0, 0, 0]] };
  /* le strutture: costante di cella a (Å, temperatura ambiente) e la base */
  var STRUTTURE = {
    NaCl: { nome: 'NaCl (salgemma)', a: 5.6402, ret: 'F', base: [['Na', 11, [0, 0, 0]], ['Cl', 17, [0.5, 0, 0]]] },
    KCl:  { nome: 'KCl (silvite)', a: 6.2917, ret: 'F', base: [['K', 19, [0, 0, 0]], ['Cl', 17, [0.5, 0, 0]]] },
    MgO:  { nome: 'MgO (periclasio)', a: 4.2112, ret: 'F', base: [['Mg', 12, [0, 0, 0]], ['O', 8, [0.5, 0, 0]]] },
    CsCl: { nome: 'CsCl', a: 4.123, ret: 'P', base: [['Cs', 55, [0, 0, 0]], ['Cl', 17, [0.5, 0.5, 0.5]]] },
    Cu:   { nome: 'Cu (fcc)', a: 3.6149, ret: 'F', base: [['Cu', 29, [0, 0, 0]]] },
    Al:   { nome: 'Al (fcc)', a: 4.0495, ret: 'F', base: [['Al', 13, [0, 0, 0]]] },
    Fe:   { nome: 'α-Fe (bcc)', a: 2.8665, ret: 'I', base: [['Fe', 26, [0, 0, 0]]] },
    W:    { nome: 'W (bcc)', a: 3.1652, ret: 'I', base: [['W', 74, [0, 0, 0]]] },
    C:    { nome: 'C (diamante)', a: 3.5668, ret: 'F', base: [['C', 6, [0, 0, 0]], ['C', 6, [0.25, 0.25, 0.25]]] },
    Si:   { nome: 'Si (diamante)', a: 5.4309, ret: 'F', base: [['Si', 14, [0, 0, 0]], ['Si', 14, [0.25, 0.25, 0.25]]] },
    ZnS:  { nome: 'ZnS (blenda)', a: 5.4093, ret: 'F', base: [['Zn', 30, [0, 0, 0]], ['S', 16, [0.25, 0.25, 0.25]]] }
  };
  var LAMBDA = { 'Cu Kα': 1.5406, 'Co Kα': 1.78897, 'Mo Kα': 0.71073 };
  /* fattore di forma approssimato: Z con un decadimento gaussiano */
  function fForma(Z, s) { return Z * (0.55 * Math.exp(-12 * s * s) + 0.45 * Math.exp(-1.2 * s * s)); }
  function fattoreStruttura(S, h, k, l, s) {
    var re = 0, im = 0;
    TR[S.ret].forEach(function (tr) {
      S.base.forEach(function (at) {
        var x = at[2][0] + tr[0], y = at[2][1] + tr[1], z = at[2][2] + tr[2], ph = 2 * Math.PI * (h * x + k * y + l * z), f = fForma(at[1], s);
        re += f * Math.cos(ph); im += f * Math.sin(ph);
      });
    });
    return { re: re, im: im, I: re * re + im * im };
  }
  function diffrattogramma(S, lam, ttMax) {
    var picchi = {}, hmax = Math.ceil(2 * S.a / lam) + 1;
    for (var h = -hmax; h <= hmax; h++) for (var k = -hmax; k <= hmax; k++) for (var l = -hmax; l <= hmax; l++) {
      if (!h && !k && !l) continue;
      var d = S.a / Math.sqrt(h * h + k * k + l * l), sn = lam / (2 * d);
      if (sn >= 1) continue;
      var tt = 2 * Math.asin(sn) / RAD; if (tt > ttMax) continue;
      var Fs = fattoreStruttura(S, h, k, l, sn / lam);
      var chiave = [Math.abs(h), Math.abs(k), Math.abs(l)].sort(function (x, y) { return y - x; }).join('');
      if (!picchi[chiave]) picchi[chiave] = { hkl: chiave, d: d, tt: tt, m: 0, F2: Fs.I };
      picchi[chiave].m++;
    }
    var out = Object.keys(picchi).map(function (k2) { return picchi[k2]; });
    out.forEach(function (p) { var th = p.tt / 2 * RAD; p.LP = (1 + Math.pow(Math.cos(2 * th), 2)) / (Math.sin(th) * Math.sin(th) * Math.cos(th)); p.I = p.F2 * p.m * p.LP; });
    var mx = Math.max.apply(null, out.map(function (p) { return p.I; }));
    out.forEach(function (p) { p.Irel = 100 * p.I / mx; });
    return out.sort(function (a, b) { return a.tt - b.tt; });
  }
  function dSpaziatura(sistema, p, h, k, l) {
    if (sistema === 'cubico') return p.a / Math.sqrt(h * h + k * k + l * l);
    if (sistema === 'tetragonale') return 1 / Math.sqrt((h * h + k * k) / (p.a * p.a) + l * l / (p.c * p.c));
    if (sistema === 'ortorombico') return 1 / Math.sqrt(h * h / (p.a * p.a) + k * k / (p.b * p.b) + l * l / (p.c * p.c));
    return 1 / Math.sqrt(4 / 3 * (h * h + h * k + k * k) / (p.a * p.a) + l * l / (p.c * p.c));
  }
  F.calcolo.cristalli = { STRUTTURE: STRUTTURE, LAMBDA: LAMBDA, diffrattogramma: diffrattogramma, fattoreStruttura: fattoreStruttura, dSpaziatura: dSpaziatura, BRAVAIS: BRAVAIS };

  /* ── la proiezione 3D, con la rotazione ─────────────────────────────────── */
  function proiettore(c, rot) {
    var W = Math.max(260, c.clientWidth || 500), H = Math.round(W * c._rapporto);
    return function (p) {
      var ca = Math.cos(rot.y), sa = Math.sin(rot.y), cb = Math.cos(rot.x), sb = Math.sin(rot.x);
      var x = p[0] * ca + p[1] * sa, y = -p[0] * sa + p[1] * ca, z = p[2];
      var y2 = y * cb - z * sb, z2 = y * sb + z * cb;
      var s = Math.min(W, H) * 0.26 * rot.zoom, pers = 1 / (1 + y2 * 0.12);
      return [W / 2 + x * s * pers, H / 2 - z2 * s * pers, y2];
    };
  }
  function trascinabile(c, rot, ridisegna) {
    var su = null;
    c.addEventListener('pointerdown', function (e) { su = [e.clientX, e.clientY]; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', function (e) { if (!su) return; rot.y += (e.clientX - su[0]) * 0.01; rot.x += (e.clientY - su[1]) * 0.01; su = [e.clientX, e.clientY]; ridisegna(); });
    c.addEventListener('pointerup', function () { su = null; });
    c.style.touchAction = 'none';
  }
  function preparaTela(c) {
    var dpr = Math.min(2, globale.devicePixelRatio || 1), W = Math.max(260, c.clientWidth || 500), H = Math.round(W * c._rapporto), q = c.getContext('2d');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); q.setTransform(dpr, 0, 0, dpr, 0, 0);
    q.fillStyle = '#081522'; q.fillRect(0, 0, W, H);
    return q;
  }

  function schedaBravais(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var sel = 2, rot = { x: 0.35, y: 0.6, zoom: 1 };
    F.scelta(pan, ['Reticolo', 'Lattice'], BRAVAIS.map(function (L, i) { return [String(i), t(L.s[0], L.s[1]) + ' ' + L.c]; }), '2', function (v) { sel = +v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.75);
    trascinabile(c, rot, disegna);
    function disegna() {
      var L = BRAVAIS[sel], V = vettori(L), q = preparaTela(c), P = proiettore(c, rot);
      var o = [-(V[0][0] + V[1][0] + V[2][0]) / 2, -(V[0][1] + V[1][1] + V[2][1]) / 2, -(V[0][2] + V[1][2] + V[2][2]) / 2];
      var pt = function (f) { return [o[0] + f[0] * V[0][0] + f[1] * V[1][0] + f[2] * V[2][0], o[1] + f[0] * V[0][1] + f[1] * V[1][1] + f[2] * V[2][1], o[2] + f[0] * V[0][2] + f[1] * V[1][2] + f[2] * V[2][2]]; };
      var vert = []; for (var i = 0; i < 8; i++) vert.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
      q.strokeStyle = '#5eead4'; q.lineWidth = 1.6;
      for (i = 0; i < 8; i++) for (var j = i + 1; j < 8; j++) {
        var d = Math.abs(vert[i][0] - vert[j][0]) + Math.abs(vert[i][1] - vert[j][1]) + Math.abs(vert[i][2] - vert[j][2]);
        if (d !== 1) continue;
        var a = P(pt(vert[i])), b = P(pt(vert[j])); q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke();
      }
      var punti = vert.map(function (v) { return { p: P(pt(v)), c: '#ffd24a' }; });
      CENTRI[L.c].forEach(function (cf) {
        var tutti = [cf];
        if (L.c === 'F') tutti = [[0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]];
        if (L.c === 'C') tutti = [[0.5, 0.5, 0], [0.5, 0.5, 1]];
        tutti.forEach(function (f) { punti.push({ p: P(pt(f)), c: '#ff8a80' }); });
      });
      punti.sort(function (x, y) { return y.p[2] - x.p[2]; }).forEach(function (u) { q.fillStyle = u.c; q.beginPath(); q.arc(u.p[0], u.p[1], 5 / (1 + u.p[2] * 0.12), 0, 6.3); q.fill(); });
      c.setAttribute('aria-label', t('la cella del reticolo', 'the lattice cell'));
      var nZ = { P: 1, I: 2, F: 4, C: 2, R: 1 }[L.c];
      info.innerHTML = '<b>' + t(L.s[0], L.s[1]) + ' ' + L.c + '</b><br>a : b : c = ' + L.a + ' : ' + L.b + ' : ' + L.c2 + '<br>α = ' + L.al + '°, β = ' + L.be + '°, γ = ' + L.ga + '°<br>' +
        t('Punti reticolari per cella', 'Lattice points per cell') + ': <b>' + nZ + '</b><br><br>' + t('Trascina per ruotare. In giallo i vertici, in rosa i punti di centratura (I corpo centrato, F facce centrate, C basi centrate).', 'Drag to rotate. Yellow: corners; pink: centring points (I body-centred, F face-centred, C base-centred).');
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaMiller(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var h = 1, k = 1, l = 1, rot = { x: 0.35, y: 0.6, zoom: 1 }, sis = 'cubico', par = { a: 5.64, b: 5.64, c: 5.64 };
    F.cursore(pan, 'h', -3, 3, 1, h, function (v) { h = v; disegna(); });
    F.cursore(pan, 'k', -3, 3, 1, k, function (v) { k = v; disegna(); });
    F.cursore(pan, 'l', -3, 3, 1, l, function (v) { l = v; disegna(); });
    F.scelta(pan, ['Sistema cristallino', 'Crystal system'], [['cubico', ['cubico', 'cubic']], ['tetragonale', ['tetragonale', 'tetragonal']], ['ortorombico', ['ortorombico', 'orthorhombic']], ['esagonale', ['esagonale', 'hexagonal']]], sis, function (v) { sis = v; disegna(); });
    ['a', 'b', 'c'].forEach(function (n) { F.cursore(pan, n + ' (Å)', 2, 12, 0.01, par[n], function (v) { par[n] = v; disegna(); }); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.75);
    trascinabile(c, rot, disegna);
    function disegna() {
      var q = preparaTela(c), P = proiettore(c, rot), o = -0.5;
      var pt = function (f) { return [f[0] + o, f[1] + o, f[2] + o]; };
      q.strokeStyle = '#5eead4'; q.lineWidth = 1.4;
      var vert = []; for (var i = 0; i < 8; i++) vert.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
      for (i = 0; i < 8; i++) for (var j = i + 1; j < 8; j++) {
        if (Math.abs(vert[i][0] - vert[j][0]) + Math.abs(vert[i][1] - vert[j][1]) + Math.abs(vert[i][2] - vert[j][2]) !== 1) continue;
        var a = P(pt(vert[i])), b = P(pt(vert[j])); q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke();
      }
      if (h || k || l) {
        /* tutti i piani della famiglia che tagliano la cella: h x + k y + l z = n */
        var mn = Math.min(0, h) + Math.min(0, k) + Math.min(0, l), mxv = Math.max(0, h) + Math.max(0, k) + Math.max(0, l);
        for (var n = Math.ceil(mn); n <= Math.floor(mxv); n++) {
          if ((n === mn || n === mxv) && (h * h + k * k + l * l) > 1 && n === mn) continue;
          var pts = [];
          for (i = 0; i < 8; i++) for (j = i + 1; j < 8; j++) {
            if (Math.abs(vert[i][0] - vert[j][0]) + Math.abs(vert[i][1] - vert[j][1]) + Math.abs(vert[i][2] - vert[j][2]) !== 1) continue;
            var fi = h * vert[i][0] + k * vert[i][1] + l * vert[i][2] - n, fj = h * vert[j][0] + k * vert[j][1] + l * vert[j][2] - n;
            if (fi * fj < 0 || (fi === 0 && fj !== 0)) { var s = fi / (fi - fj); pts.push([vert[i][0] + s * (vert[j][0] - vert[i][0]), vert[i][1] + s * (vert[j][1] - vert[i][1]), vert[i][2] + s * (vert[j][2] - vert[i][2])]); }
          }
          if (pts.length < 3) continue;
          var cx = pts.reduce(function (s2, p) { return [s2[0] + p[0] / pts.length, s2[1] + p[1] / pts.length, s2[2] + p[2] / pts.length]; }, [0, 0, 0]);
          var nn = [h, k, l], u = Math.abs(h) < 0.9 ? [1, 0, 0] : [0, 1, 0];
          var e1 = [nn[1] * u[2] - nn[2] * u[1], nn[2] * u[0] - nn[0] * u[2], nn[0] * u[1] - nn[1] * u[0]], e2 = [nn[1] * e1[2] - nn[2] * e1[1], nn[2] * e1[0] - nn[0] * e1[2], nn[0] * e1[1] - nn[1] * e1[0]];
          pts.sort(function (A, B) { var da = [A[0] - cx[0], A[1] - cx[1], A[2] - cx[2]], db = [B[0] - cx[0], B[1] - cx[1], B[2] - cx[2]];
            return Math.atan2(da[0] * e2[0] + da[1] * e2[1] + da[2] * e2[2], da[0] * e1[0] + da[1] * e1[1] + da[2] * e1[2]) - Math.atan2(db[0] * e2[0] + db[1] * e2[1] + db[2] * e2[2], db[0] * e1[0] + db[1] * e1[1] + db[2] * e1[2]); });
          q.fillStyle = 'rgba(124,111,255,.35)'; q.strokeStyle = '#b388ff'; q.beginPath();
          pts.forEach(function (p, m) { var pp = P(pt(p)); if (m) q.lineTo(pp[0], pp[1]); else q.moveTo(pp[0], pp[1]); });
          q.closePath(); q.fill(); q.stroke();
        }
      }
      c.setAttribute('aria-label', t('il piano di Miller nella cella', 'the Miller plane in the cell'));
      var d = (h || k || l) ? dSpaziatura(sis, par, h, k, l) : NaN;
      info.innerHTML = '(' + h + ' ' + k + ' ' + l + ')<br>d = <b class="bsiFX-num">' + (isFinite(d) ? d.toFixed(4) + ' Å' : '—') + '</b><br>' +
        (isFinite(d) ? '2θ (Cu Kα) = <b class="bsiFX-num">' + (d > 1.5406 / 2 ? (2 * Math.asin(1.5406 / (2 * d)) / RAD).toFixed(2) + '°' : t('fuori portata', 'out of range')) + '</b><br>' : '') +
        '<br>' + t('I piani della stessa famiglia sono paralleli ed equidistanti: d è la loro distanza. Indici più alti, piani più fitti, d più piccola, angolo di Bragg più grande.', 'Planes of a family are parallel and equidistant: d is their spacing. Higher indices mean denser planes, smaller d, larger Bragg angle.');
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaXRD(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var st = 'NaCl', lam = 'Cu Kα';
    F.scelta(pan, ['Cristallo', 'Crystal'], Object.keys(STRUTTURE).map(function (k) { return [k, STRUTTURE[k].nome]; }), st, function (v) { st = v; disegna(); });
    F.scelta(pan, ['Radiazione', 'Radiation'], Object.keys(LAMBDA).map(function (k) { return [k, k + ' (' + LAMBDA[k] + ' Å)']; }), lam, function (v) { lam = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.5), tab = F.el('div'); destra.appendChild(tab);
    function disegna() {
      var S = STRUTTURE[st], L = LAMBDA[lam], pk = diffrattogramma(S, L, 120);
      var xs = [], ys = [];
      for (var x = 10; x <= 120; x += 0.05) { var y = 0; pk.forEach(function (p) { var d = (x - p.tt) / 0.12; y += p.Irel * Math.exp(-d * d / 2); }); xs.push(x); ys.push(y); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 1.3 }], xmin: 10, xmax: 120, ymin: 0, ymax: 105, xl: '2θ (°)', yl: ['intensità relativa', 'relative intensity'] });
      var visti = pk.filter(function (p) { return p.Irel > 0.05; }), spenti = pk.filter(function (p) { return p.Irel <= 0.05; });
      var h = '<table class="bsiFX-tab"><tr><th>(hkl)</th><th>d (Å)</th><th>2θ (°)</th><th>' + t('molteplicità', 'multiplicity') + '</th><th>I rel.</th></tr>';
      visti.slice(0, 14).forEach(function (p) { h += '<tr><td>(' + p.hkl.split('').join(' ') + ')</td><td class="bsiFX-num">' + p.d.toFixed(4) + '</td><td class="bsiFX-num">' + p.tt.toFixed(2) + '</td><td>' + p.m + '</td><td class="bsiFX-num">' + p.Irel.toFixed(1) + '</td></tr>'; });
      tab.innerHTML = h + '</table>';
      info.innerHTML = '<b>' + S.nome + '</b> · a = ' + S.a + ' Å · ' + t('reticolo', 'lattice') + ' ' + S.ret + '<br><br>' +
        t('Riflessi estinti dalla simmetria', 'Reflections extinguished by symmetry') + ': ' + (spenti.slice(0, 8).map(function (p) { return '(' + p.hkl.split('').join('') + ')'; }).join(' ') || '—') + '<br><br>' +
        (st === 'KCl' ? t('K⁺ e Cl⁻ hanno lo stesso numero di elettroni: i riflessi con indici tutti dispari, che in NaCl sono deboli, qui quasi spariscono — KCl a raggi X sembra un cubico semplice di lato a/2.', 'K⁺ and Cl⁻ have the same number of electrons: the all-odd reflections, weak in NaCl, almost vanish here — to X-rays KCl looks like a simple cubic of side a/2.') :
                        t('Le posizioni seguono da Bragg e sono esatte; le intensità usano fattori di forma atomici approssimati.', 'Positions follow from Bragg and are exact; intensities use approximate atomic form factors.'));
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  F.sezione('scristalli', {
    titolo: ['💎 Cristallografia e raggi X', '💎 Crystallography and X-rays'],
    sotto: ['I 14 reticoli di Bravais, gli indici di Miller e le distanze interplanari, il diffrattogramma di polvere dalla legge di Bragg e dal fattore di struttura, con le estinzioni sistematiche.',
            'The 14 Bravais lattices, Miller indices and interplanar spacings, the powder pattern from Bragg’s law and the structure factor, with systematic absences.'],
    schede: [
      { nome: ['Reticoli di Bravais', 'Bravais lattices'], costruisci: schedaBravais },
      { nome: ['Indici di Miller', 'Miller indices'], costruisci: schedaMiller },
      { nome: ['Diffrattogramma XRD', 'XRD pattern'], costruisci: schedaXRD }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
