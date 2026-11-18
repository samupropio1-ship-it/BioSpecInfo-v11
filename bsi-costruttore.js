/* ═══════════════════════════════════════════════════════════════════════
   bsi-costruttore.js — 🧪 Costruttore molecolare 3D e AR (v257)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Il progetto (§ AR unificata) chiede di COSTRUIRE una molecola, non solo di
   guardarla: si sceglie un elemento, lo si lega a un atomo toccandolo, si
   completa con gli idrogeni, e la geometria si sistema da sola. La scena è una
   Scena del Laboratorio 3D, quindi ha il pulsante «AR» come tutte le altre:
   la molecola costruita si posa sul tavolo (WebXR su Android, Quick Look su
   iPhone), con le stesse esportazioni GLB/USDZ verificate di bsi-ar.js.

   IL MODELLO (dichiarato, non un calcolo quantistico)
   · Lunghezze di legame: somma dei raggi covalenti di Cordero et al., Dalton
     Trans. 2008, 2832 (C sp³ 0,76 Å, sp² 0,73, sp 0,69), accorciata per i
     legami multipli con i rapporti misurati C=C/C–C = 1,34/1,53 e
     C≡C/C–C = 1,20/1,53.
   · Angoli: VSEPR. Numero sterico = vicini + coppie solitarie, con le coppie
     dagli elettroni di valenza, la carica formale e gli ordini di legame.
     Angoli di riferimento: 180°, 120°, 109,47°; con coppie solitarie 107°
     (NH₃) e 104,5° (H₂O), misurati; per 5 e 6 domini il più vicino fra
     90°, 120°, 180°.
   · Planarità dei centri sp² e dei loro sostituenti (doppi legami, anelli
     aromatici), repulsione morbida fra atomi non legati.
   · Minimizzazione: discesa del gradiente analitico con passo adattivo.
   Errori tipici rispetto alle strutture sperimentali: qualche centesimo di
   ångström e pochi gradi. Va bene per vedere la forma e misurarla a scuola;
   non per energie, conformazioni fini o stati di transizione.
   ═══════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, D = globale.document;
  function num(x, d) { return x.toFixed(d == null ? 2 : d).replace('.', ',').replace('-', '−'); }

  /* ═══ 1. GLI ELEMENTI ═════════════════════════════════════════════════
     massa: pesi atomici standard IUPAC (valori convenzionali abbreviati);
     rc: raggio covalente (Cordero 2008, Å); ve: elettroni di valenza;
     val: valenze ammesse in ordine; col: colori CPK di Jmol. */
  var EL = {
    H: { z: 1, nome: ['idrogeno', 'hydrogen'], massa: 1.008, rc: 0.31, ve: 1, val: [1], col: 0xf2f2f2 },
    C: { z: 6, nome: ['carbonio', 'carbon'], massa: 12.011, rc: 0.76, ve: 4, val: [4], col: 0x5c5c5c },
    N: { z: 7, nome: ['azoto', 'nitrogen'], massa: 14.007, rc: 0.71, ve: 5, val: [3], col: 0x3050f8 },
    O: { z: 8, nome: ['ossigeno', 'oxygen'], massa: 15.999, rc: 0.66, ve: 6, val: [2], col: 0xff0d0d },
    F: { z: 9, nome: ['fluoro', 'fluorine'], massa: 18.998, rc: 0.57, ve: 7, val: [1], col: 0x90e050 },
    P: { z: 15, nome: ['fosforo', 'phosphorus'], massa: 30.974, rc: 1.07, ve: 5, val: [3, 5], col: 0xff8000 },
    S: { z: 16, nome: ['zolfo', 'sulfur'], massa: 32.06, rc: 1.05, ve: 6, val: [2, 4, 6], col: 0xffff30 },
    Cl: { z: 17, nome: ['cloro', 'chlorine'], massa: 35.45, rc: 1.02, ve: 7, val: [1], col: 0x1ff01f },
    Br: { z: 35, nome: ['bromo', 'bromine'], massa: 79.904, rc: 1.20, ve: 7, val: [1], col: 0xa62929 },
    I: { z: 53, nome: ['iodio', 'iodine'], massa: 126.904, rc: 1.39, ve: 7, val: [1], col: 0x940094 }
  };
  var ORDINE_EL = ['H', 'C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'I'];
  var RAPPORTO_ORDINE = [1, 1, 1.34 / 1.53, 1.20 / 1.53], RAPPORTO_AROMATICO = 1.39 / 1.53;   /* benzene: sei legami uguali, 1,39 Å */

  /* ═══ 2. LA MOLECOLA ═══════════════════════════════════════════════════ */
  function Molecola() { this.atomi = []; this.legami = []; }
  Molecola.prototype.copia = function () { var m = new Molecola(); m.atomi = this.atomi.map(function (a) { return { el: a.el, x: a.x, y: a.y, z: a.z, q: a.q || 0 }; }); m.legami = this.legami.map(function (l) { return { a: l.a, b: l.b, o: l.o, ar: l.ar }; }); return m; };
  Molecola.prototype.vicini = function (i) { var v = []; this.legami.forEach(function (l) { if (l.a === i) v.push(l.b); else if (l.b === i) v.push(l.a); }); return v; };
  Molecola.prototype.legame = function (i, j) { for (var k = 0; k < this.legami.length; k++) { var l = this.legami[k]; if ((l.a === i && l.b === j) || (l.a === j && l.b === i)) return l; } return null; };
  Molecola.prototype.usata = function (i) { var s = 0; this.legami.forEach(function (l) { if (l.a === i || l.b === i) s += l.o; }); return s; };
  /** valenza dell'atomo con la carica: gruppi 15–17 guadagnano un legame per carica +, lo perdono per −; il carbonio ne perde uno in entrambi i casi */
  Molecola.prototype.valenza = function (i) {
    var a = this.atomi[i], e = EL[a.el], u = this.usata(i), q = a.q || 0;
    var lista = e.val.map(function (v) { return a.el === 'C' ? v - Math.abs(q) : (a.el === 'H' ? v : v + q); });
    for (var k = 0; k < lista.length; k++) if (lista[k] >= u) return lista[k];
    return lista[lista.length - 1];
  };
  Molecola.prototype.libera = function (i) { return this.valenza(i) - this.usata(i); };
  /** quanti legami l'atomo può ancora reggere alla valenza più alta (P fino a 5, S fino a 6: SF₆, PCl₅, H₂SO₄) */
  Molecola.prototype.capienza = function (i) { var a = this.atomi[i], e = EL[a.el], q = a.q || 0, v = e.val[e.val.length - 1]; v = a.el === 'C' ? v - Math.abs(q) : (a.el === 'H' ? v : v + q); return v - this.usata(i); };
  Molecola.prototype.coppie = function (i) { var a = this.atomi[i], e = EL[a.el]; return Math.max(0, Math.round((e.ve - (a.q || 0) - this.usata(i)) / 2)); };
  Molecola.prototype.sterico = function (i) { return this.vicini(i).length + this.coppie(i); };
  Molecola.prototype.aggiungiAtomo = function (el, x, y, z) { this.atomi.push({ el: el, x: x || 0, y: y || 0, z: z || 0, q: 0 }); return this.atomi.length - 1; };
  Molecola.prototype.lega = function (i, j, o) { var l = this.legame(i, j); if (l) l.o = o; else this.legami.push({ a: i, b: j, o: o }); };
  Molecola.prototype.togli = function (i) {
    this.atomi.splice(i, 1);
    this.legami = this.legami.filter(function (l) { return l.a !== i && l.b !== i; }).map(function (l) { return { a: l.a > i ? l.a - 1 : l.a, b: l.b > i ? l.b - 1 : l.b, o: l.o, ar: l.ar }; });
  };
  /** lunghezza di riferimento del legame i–j */
  Molecola.prototype.r0 = function (i, j, o) {
    var a = this.atomi[i], b = this.atomi[j], ra = EL[a.el].rc, rb = EL[b.el].rc, l = this.legame(i, j);
    return (ra + rb) * (l && l.ar ? RAPPORTO_AROMATICO : RAPPORTO_ORDINE[o || 1]);
  };
  /** angolo di riferimento (radianti) attorno all'atomo i, vicino all'angolo attuale c (coseno) */
  Molecola.prototype.angolo0 = function (i, c) {
    var n = this.vicini(i).length, lp = this.coppie(i), sn = n + lp, gr = Math.PI / 180;
    if (sn <= 2) return Math.PI;
    if (sn === 3) return (lp === 1 ? 117 : 120) * gr;
    if (sn === 4) return (lp === 0 ? 109.47 : lp === 1 ? 107.0 : 104.5) * gr;
    var amm = sn === 5 ? [90, 120, 180] : [90, 180], th = Math.acos(Math.max(-1, Math.min(1, c))) / gr, m = amm[0];
    amm.forEach(function (x) { if (Math.abs(x - th) < Math.abs(m - th)) m = x; });
    return m * gr;
  };

  /** anelli aromatici a sei: sei centri sp² con legami alternati 1/2 (Kekulé) → sei legami «aromatici» uguali */
  function aromatici(M) {
    M.legami.forEach(function (l) { l.ar = false; });
    var n = M.atomi.length, vic = []; for (var i = 0; i < n; i++) vic.push(M.vicini(i));
    function sp2(i) { return M.atomi[i].el !== 'H' && M.sterico(i) === 3; }
    for (var s0 = 0; s0 < n; s0++) {
      if (!sp2(s0)) continue;
      (function cerca(cammino) {
        var u = cammino[cammino.length - 1];
        if (cammino.length === 6) {
          if (vic[u].indexOf(cammino[0]) < 0) return;
          var ord = []; for (var k = 0; k < 6; k++) ord.push(M.legame(cammino[k], cammino[(k + 1) % 6]).o);
          var alt = ord.every(function (o, k) { return o === ord[k % 2]; }) && ord[0] !== ord[1] && ord[0] + ord[1] === 3;
          if (alt) for (k = 0; k < 6; k++) M.legame(cammino[k], cammino[(k + 1) % 6]).ar = true;
          return;
        }
        vic[u].forEach(function (w) { if (w > s0 && sp2(w) && cammino.indexOf(w) < 0) cerca(cammino.concat([w])); });
      })([s0]);
    }
  }

  /* ═══ 3. LA GEOMETRIA: campo di forze e discesa del gradiente ══════════ */
  var KB = 60, KA = 9, KL = 6, KU = 20, KP = 12, KR = 4;
  function energiaGradiente(M, G) {
    var A = M.atomi, n = A.length, E = 0, i, j;
    for (i = 0; i < 3 * n; i++) G[i] = 0;
    /* legami */
    M.legami.forEach(function (l) {
      var a = A[l.a], b = A[l.b], dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, r0 = M.r0(l.a, l.b, l.o), s = d - r0;
      E += KB * s * s; var f = 2 * KB * s / d;
      G[3 * l.a] += f * dx; G[3 * l.a + 1] += f * dy; G[3 * l.a + 2] += f * dz; G[3 * l.b] -= f * dx; G[3 * l.b + 1] -= f * dy; G[3 * l.b + 2] -= f * dz;
    });
    /* angoli: (cos θ − cos θ0)² */
    var vic = []; for (i = 0; i < n; i++) vic.push(M.vicini(i));
    for (i = 0; i < n; i++) {
      var v = vic[i]; if (v.length < 2) continue;
      /* (bipiramide trigonale, 5 vicini senza coppie) la coppia più vicina a 180° è assiale: assiale–assiale 180°,
         assiale–equatoriale 90°, equatoriale–equatoriale 120°. Col solo «angolo permesso più vicino» la piramide
         quadrata era anch'essa un minimo e PCl₅ ci restava. */
      var ax = null;
      if (v.length === 5 && M.coppie(i) === 0) {
        var mc = 2; for (var p0 = 0; p0 < 5; p0++) for (var q0 = p0 + 1; q0 < 5; q0++) { var P = A[v[p0]], Q = A[v[q0]], o0 = A[i]; var cc = ((P.x - o0.x) * (Q.x - o0.x) + (P.y - o0.y) * (Q.y - o0.y) + (P.z - o0.z) * (Q.z - o0.z)) / (Math.sqrt((P.x - o0.x) * (P.x - o0.x) + (P.y - o0.y) * (P.y - o0.y) + (P.z - o0.z) * (P.z - o0.z)) * Math.sqrt((Q.x - o0.x) * (Q.x - o0.x) + (Q.y - o0.y) * (Q.y - o0.y) + (Q.z - o0.z) * (Q.z - o0.z)) || 1); if (cc < mc) { mc = cc; ax = [p0, q0]; } }
      }
      for (var p = 0; p < v.length; p++) for (var q = p + 1; q < v.length; q++) {
        var a2 = A[v[p]], c2 = A[v[q]], o = A[i];
        var ux = a2.x - o.x, uy = a2.y - o.y, uz = a2.z - o.z, wx = c2.x - o.x, wy = c2.y - o.y, wz = c2.z - o.z;
        var lu = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1e-6, lw = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1e-6;
        var c = (ux * wx + uy * wy + uz * wz) / (lu * lw), c0 = ax ? Math.cos((((ax.indexOf(p) >= 0) + (ax.indexOf(q) >= 0)) === 2 ? 180 : ((ax.indexOf(p) >= 0) + (ax.indexOf(q) >= 0)) === 1 ? 90 : 120) * Math.PI / 180) : Math.cos(M.angolo0(i, c)), s2 = c - c0;
        /* Urey–Bradley: la distanza 1-3 dal teorema del coseno con l'angolo di riferimento. Il termine in cos θ da solo
           ha gradiente nullo a 180° (−sin θ → 0): le molecole lineari restavano a 177°. Questo spinge fino a 180°. */
        var r1 = M.r0(i, v[p], M.legame(i, v[p]).o), r2 = M.r0(i, v[q], M.legame(i, v[q]).o), d13 = Math.sqrt(r1 * r1 + r2 * r2 - 2 * r1 * r2 * c0);
        var tx = a2.x - c2.x, ty = a2.y - c2.y, tz = a2.z - c2.z, dt = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1e-6, su = dt - d13, fu = 2 * KU * su / dt;
        E += KU * su * su;
        G[3 * v[p]] += fu * tx; G[3 * v[p] + 1] += fu * ty; G[3 * v[p] + 2] += fu * tz; G[3 * v[q]] -= fu * tx; G[3 * v[q] + 1] -= fu * ty; G[3 * v[q] + 2] -= fu * tz;
        /* a 180° (numero sterico 2) l'energia è K·(1 + cos θ) ≈ K·Δθ²/2: il gradiente non svanisce e la molecola diventa lineare */
        var k; if (c0 < -0.9999) { E += KL * (1 + c); k = KL; } else { E += KA * s2 * s2; k = 2 * KA * s2; }
        /* dc/du = w/(|u||w|) − c·u/|u|² */
        var gux = wx / (lu * lw) - c * ux / (lu * lu), guy = wy / (lu * lw) - c * uy / (lu * lu), guz = wz / (lu * lw) - c * uz / (lu * lu);
        var gwx = ux / (lu * lw) - c * wx / (lw * lw), gwy = uy / (lu * lw) - c * wy / (lw * lw), gwz = uz / (lu * lw) - c * wz / (lw * lw);
        G[3 * v[p]] += k * gux; G[3 * v[p] + 1] += k * guy; G[3 * v[p] + 2] += k * guz;
        G[3 * v[q]] += k * gwx; G[3 * v[q] + 1] += k * gwy; G[3 * v[q] + 2] += k * gwz;
        G[3 * i] -= k * (gux + gwx); G[3 * i + 1] -= k * (guy + gwy); G[3 * i + 2] -= k * (guz + gwz);
      }
    }
    /* planarità dei centri sp²: i vicini e, per i legami multipli, i vicini dell'altro atomo stanno nel piano (normale congelata nel passo) */
    for (i = 0; i < n; i++) {
      if (vic[i].length !== 3 || M.sterico(i) !== 3) continue;
      var o2 = A[i], P0 = A[vic[i][0]], P1 = A[vic[i][1]], P2 = A[vic[i][2]];
      var e1 = [P1.x - P0.x, P1.y - P0.y, P1.z - P0.z], e2 = [P2.x - P0.x, P2.y - P0.y, P2.z - P0.z];
      var nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], ln = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (ln < 1e-6) continue; nx /= ln; ny /= ln; nz /= ln;
      var membri = vic[i].slice();
      vic[i].forEach(function (j2) { if (M.sterico(j2) === 3 && vic[j2].length >= 2) vic[j2].forEach(function (k2) { if (k2 !== i && membri.indexOf(k2) < 0) membri.push(k2); }); });
      membri.forEach(function (j2) {
        var b = A[j2], h = (b.x - o2.x) * nx + (b.y - o2.y) * ny + (b.z - o2.z) * nz;
        E += KP * h * h; var g2 = 2 * KP * h;
        G[3 * j2] += g2 * nx; G[3 * j2 + 1] += g2 * ny; G[3 * j2 + 2] += g2 * nz; G[3 * i] -= g2 * nx; G[3 * i + 1] -= g2 * ny; G[3 * i + 2] -= g2 * nz;
      });
    }
    /* repulsione fra atomi non legati e non 1-3 */
    var vicino = {}; M.legami.forEach(function (l) { vicino[l.a + ',' + l.b] = vicino[l.b + ',' + l.a] = 1; });
    for (i = 0; i < n; i++) vic[i].forEach(function (a3) { vic[i].forEach(function (b3) { if (a3 !== b3) vicino[a3 + ',' + b3] = 1; }); });
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      if (vicino[i + ',' + j]) continue;
      var hi = A[i].el === 'H', hj = A[j].el === 'H', dmin = hi && hj ? 2.0 : (hi || hj ? 2.4 : 2.9);
      var ex = A[i].x - A[j].x, ey = A[i].y - A[j].y, ez = A[i].z - A[j].z, dd = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1e-6;
      if (dd >= dmin) continue;
      var s3 = dmin - dd; E += KR * s3 * s3; var f3 = -2 * KR * s3 / dd;
      G[3 * i] += f3 * ex; G[3 * i + 1] += f3 * ey; G[3 * i + 2] += f3 * ez; G[3 * j] -= f3 * ex; G[3 * j + 1] -= f3 * ey; G[3 * j + 2] -= f3 * ez;
    }
    return E;
  }
  /** minimizza la geometria; restituisce { energia, passi, forza } */
  function ottimizza(M, passiMax) {
    aromatici(M);
    var n = M.atomi.length; if (n < 2) return { energia: 0, passi: 0, forza: 0 };
    var G = new Float64Array(3 * n), passo = 0.01, E = energiaGradiente(M, G), k, fmax = 0;
    for (k = 0; k < (passiMax || 1500); k++) {
      fmax = 0; for (var i = 0; i < 3 * n; i++) fmax = Math.max(fmax, Math.abs(G[i]));
      if (fmax < 1e-4) break;
      var vecchie = M.atomi.map(function (a) { return [a.x, a.y, a.z]; }), lim = 0.15 / Math.max(1e-9, fmax * passo);
      var s = Math.min(1, lim);
      M.atomi.forEach(function (a, j) { a.x -= s * passo * G[3 * j]; a.y -= s * passo * G[3 * j + 1]; a.z -= s * passo * G[3 * j + 2]; });
      var G2 = new Float64Array(3 * n), E2 = energiaGradiente(M, G2);
      if (E2 <= E) { E = E2; G = G2; passo = Math.min(0.05, passo * 1.15); }
      else { M.atomi.forEach(function (a, j) { a.x = vecchie[j][0]; a.y = vecchie[j][1]; a.z = vecchie[j][2]; }); passo *= 0.5; if (passo < 1e-7) break; }
    }
    centra(M);
    return { energia: E, passi: k, forza: fmax };
  }
  function centra(M) {
    var n = M.atomi.length; if (!n) return; var c = [0, 0, 0];
    M.atomi.forEach(function (a) { c[0] += a.x; c[1] += a.y; c[2] += a.z; });
    M.atomi.forEach(function (a) { a.x -= c[0] / n; a.y -= c[1] / n; a.z -= c[2] / n; });
  }
  /* 64 direzioni quasi uniformi (spirale di Fibonacci) */
  var DIREZIONI = (function () { var v = [], g = Math.PI * (3 - Math.sqrt(5)); for (var i = 0; i < 64; i++) { var y = 1 - 2 * (i + 0.5) / 64, r = Math.sqrt(1 - y * y); v.push([Math.cos(g * i) * r, y, Math.sin(g * i) * r]); } return v; })();
  /** la direzione più lontana dai legami esistenti dell'atomo i */
  function direzioneLibera(M, i) {
    var a = M.atomi[i], v = M.vicini(i).map(function (j) { var b = M.atomi[j], dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1; return [dx / d, dy / d, dz / d]; });
    if (!v.length) return [1, 0, 0];
    var meglio = DIREZIONI[0], mv = -2;
    DIREZIONI.forEach(function (d) { var m = 2; v.forEach(function (u) { m = Math.min(m, 1 - (d[0] * u[0] + d[1] * u[1] + d[2] * u[2])); }); if (m > mv) { mv = m; meglio = d; } });
    return meglio;
  }
  /** lega un nuovo atomo di elemento el all'atomo i; restituisce l'indice o −1 se la valenza non basta */
  function attacca(M, i, el, o) {
    o = o || 1;
    if (M.capienza(i) < o) return -1;
    var d = direzioneLibera(M, i), a = M.atomi[i], j = M.aggiungiAtomo(el, 0, 0, 0), r = M.r0(i, j, o);
    M.atomi[j].x = a.x + d[0] * r; M.atomi[j].y = a.y + d[1] * r; M.atomi[j].z = a.z + d[2] * r;
    M.lega(i, j, o);
    return j;
  }
  /** completa con idrogeni ogni valenza libera */
  function completaH(M) {
    var n = M.atomi.length, aggiunti = 0;
    for (var i = 0; i < n; i++) { if (M.atomi[i].el === 'H') continue; var f = M.libera(i); while (f-- > 0) { attacca(M, i, 'H', 1); aggiunti++; } }
    return aggiunti;
  }

  /* ═══ 4. LE PROPRIETÀ ═══════════════════════════════════════════════════ */
  var PEDICI = '₀₁₂₃₄₅₆₇₈₉';
  function pedice(n) { return n === 1 ? '' : String(n).split('').map(function (c) { return PEDICI[+c]; }).join(''); }
  /** formula in ordine di Hill: C, poi H, poi gli altri in ordine alfabetico (senza C: tutti in ordine alfabetico) */
  function formula(M) {
    var c = {}; M.atomi.forEach(function (a) { c[a.el] = (c[a.el] || 0) + 1; });
    var k = Object.keys(c).sort(), o = [];
    if (c.C) { o.push('C'); if (c.H) o.push('H'); k.forEach(function (x) { if (x !== 'C' && x !== 'H') o.push(x); }); } else o = k;
    var q = M.atomi.reduce(function (s, a) { return s + (a.q || 0); }, 0);
    return o.map(function (x) { return x + pedice(c[x]); }).join('') + (q ? (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '⁺' : '⁻') : '');
  }
  function massa(M) { return M.atomi.reduce(function (s, a) { return s + EL[a.el].massa; }, 0); }
  /** gradi di insaturazione: (2C + 2 + N + P − H − X)/2 */
  function insaturazioni(M) {
    /* la formula vale per le valenze «normali»: con P a 5 legami o S a 4–6 (SF₆, H₂SO₄) non ha senso */
    for (var i = 0; i < M.atomi.length; i++) { var e = M.atomi[i].el; if ((e === 'P' && M.usata(i) > 3) || (e === 'S' && M.usata(i) > 2)) return null; }
    var c = { C: 0, H: 0, N: 0, P: 0, X: 0 }; M.atomi.forEach(function (a) { if (a.el === 'C') c.C++; else if (a.el === 'H') c.H++; else if (a.el === 'N') c.N++; else if (a.el === 'P') c.P++; else if (/^(F|Cl|Br|I)$/.test(a.el)) c.X++; });
    return (2 * c.C + 2 + c.N + c.P - c.H - c.X) / 2;
  }
  var GEOM = {
    '2,0': ['lineare', 'linear'], '3,0': ['trigonale planare', 'trigonal planar'], '3,1': ['angolata', 'bent'], '4,0': ['tetraedrica', 'tetrahedral'],
    '4,1': ['piramidale trigonale', 'trigonal pyramidal'], '4,2': ['angolata', 'bent'], '5,0': ['bipiramidale trigonale', 'trigonal bipyramidal'],
    '5,1': ['a altalena', 'seesaw'], '5,2': ['a T', 'T-shaped'], '5,3': ['lineare', 'linear'], '6,0': ['ottaedrica', 'octahedral'], '6,1': ['piramidale quadrata', 'square pyramidal'], '6,2': ['planare quadrata', 'square planar']
  };
  var IBRIDO = { 2: 'sp', 3: 'sp²', 4: 'sp³', 5: 'sp³d', 6: 'sp³d²' };
  function distanza(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z)); }
  function angolo(o, a, b) { var ux = a.x - o.x, uy = a.y - o.y, uz = a.z - o.z, wx = b.x - o.x, wy = b.y - o.y, wz = b.z - o.z; return Math.acos(Math.max(-1, Math.min(1, (ux * wx + uy * wy + uz * wz) / (Math.sqrt(ux * ux + uy * uy + uz * uz) * Math.sqrt(wx * wx + wy * wy + wz * wz))))) * 180 / Math.PI; }
  function descriviAtomo(M, i) {
    var a = M.atomi[i], v = M.vicini(i), lp = M.coppie(i), sn = v.length + lp;
    var o = { el: a.el, vicini: v.length, coppie: lp, sterico: sn, ibrido: v.length >= 2 || lp ? IBRIDO[sn] || '' : '', geometria: GEOM[v.length + lp + ',' + lp] || null, libera: M.libera(i), legami: [], angoli: [] };
    v.forEach(function (j) { var l = M.legame(i, j); o.legami.push({ con: M.atomi[j].el, ordine: l.o, d: distanza(a, M.atomi[j]) }); });
    for (var p = 0; p < v.length; p++) for (var q = p + 1; q < v.length; q++) o.angoli.push(angolo(a, M.atomi[v[p]], M.atomi[v[q]]));
    return o;
  }
  /** file MOL V2000 (MDL), leggibile da Avogadro, ChemDraw, PubChem Sketcher */
  function mol(M, titolo) {
    function f(x, w, d) { var s = x.toFixed(d); while (s.length < w) s = ' ' + s; return s; }
    function i3(x) { var s = String(x); while (s.length < 3) s = ' ' + s; return s; }
    var Q = { '3': 1, '2': 2, '1': 3, '0': 0, '-1': 5, '-2': 6, '-3': 7 };
    var r = [(titolo || 'BioSpecInfo'), '  BioSpecInfo3D', '', i3(M.atomi.length) + i3(M.legami.length) + '  0  0  0  0  0  0  0  0999 V2000'];
    M.atomi.forEach(function (a) { var el = (a.el + '   ').slice(0, 3); r.push(f(a.x, 10, 4) + f(a.y, 10, 4) + f(a.z, 10, 4) + ' ' + el + ' 0' + i3(Q[String(a.q || 0)] || 0) + '  0  0  0  0  0  0  0  0  0  0'); });
    M.legami.forEach(function (l) { r.push(i3(l.a + 1) + i3(l.b + 1) + i3(l.o) + '  0  0  0  0'); });
    r.push('M  END'); return r.join('\n') + '\n';
  }
  function xyz(M, titolo) { return M.atomi.length + '\n' + (titolo || 'BioSpecInfo') + '\n' + M.atomi.map(function (a) { return a.el + ' ' + a.x.toFixed(5) + ' ' + a.y.toFixed(5) + ' ' + a.z.toFixed(5); }).join('\n') + '\n'; }

  /* ═══ 5. I MODELLI PRONTI ═══════════════════════════════════════════════
     Ogni modello è costruito con gli stessi passi della mano (scheletro
     pesante + completaH + ottimizza): nessuna coordinata scritta a mano. */
  function catena(M, els, ordini) { var p = -1; els.forEach(function (e, k) { var j; if (p < 0) j = M.aggiungiAtomo(e); else j = attacca(M, p, e, ordini ? ordini[k - 1] || 1 : 1); p = j; }); return M; }
  function anello(M, n, el, alterna) {
    var r = 1.39 / (2 * Math.sin(Math.PI / n)), base = M.atomi.length;
    for (var k = 0; k < n; k++) M.aggiungiAtomo(el, r * Math.cos(2 * Math.PI * k / n), r * Math.sin(2 * Math.PI * k / n), 0);
    for (k = 0; k < n; k++) M.lega(base + k, base + (k + 1) % n, alterna && k % 2 === 0 ? 2 : 1);
    return base;
  }
  var MODELLI = {
    metano: { nome: ['Metano CH₄', 'Methane CH₄'], f: function (M) { M.aggiungiAtomo('C'); } },
    etano: { nome: ['Etano C₂H₆', 'Ethane C₂H₆'], f: function (M) { catena(M, ['C', 'C']); } },
    etilene: { nome: ['Etilene C₂H₄', 'Ethylene C₂H₄'], f: function (M) { catena(M, ['C', 'C'], [2]); } },
    acetilene: { nome: ['Acetilene C₂H₂', 'Acetylene C₂H₂'], f: function (M) { catena(M, ['C', 'C'], [3]); } },
    acqua: { nome: ['Acqua H₂O', 'Water H₂O'], f: function (M) { M.aggiungiAtomo('O'); } },
    ammoniaca: { nome: ['Ammoniaca NH₃', 'Ammonia NH₃'], f: function (M) { M.aggiungiAtomo('N'); } },
    co2: { nome: ['Anidride carbonica CO₂', 'Carbon dioxide CO₂'], f: function (M) { var c = M.aggiungiAtomo('C'); attacca(M, c, 'O', 2); attacca(M, c, 'O', 2); } },
    formaldeide: { nome: ['Formaldeide CH₂O', 'Formaldehyde CH₂O'], f: function (M) { catena(M, ['C', 'O'], [2]); } },
    etanolo: { nome: ['Etanolo C₂H₆O', 'Ethanol C₂H₆O'], f: function (M) { catena(M, ['C', 'C', 'O']); } },
    acetico: { nome: ['Acido acetico C₂H₄O₂', 'Acetic acid C₂H₄O₂'], f: function (M) { var c1 = M.aggiungiAtomo('C'), c2 = attacca(M, c1, 'C', 1); attacca(M, c2, 'O', 2); attacca(M, c2, 'O', 1); } },
    glicina: { nome: ['Glicina C₂H₅NO₂', 'Glycine C₂H₅NO₂'], f: function (M) { var n = M.aggiungiAtomo('N'), c1 = attacca(M, n, 'C', 1), c2 = attacca(M, c1, 'C', 1); attacca(M, c2, 'O', 2); attacca(M, c2, 'O', 1); } },
    benzene: { nome: ['Benzene C₆H₆', 'Benzene C₆H₆'], f: function (M) { anello(M, 6, 'C', true); } },
    cicloesano: { nome: ['Cicloesano C₆H₁₂ (sedia)', 'Cyclohexane C₆H₁₂ (chair)'], f: function (M) { var b = anello(M, 6, 'C', false); for (var k = 0; k < 6; k++) M.atomi[b + k].z = (k % 2 ? 0.25 : -0.25); } },
    sf6: { nome: ['Esafluoruro di zolfo SF₆', 'Sulfur hexafluoride SF₆'], f: function (M) { var s = M.aggiungiAtomo('S'); for (var k = 0; k < 6; k++) attacca(M, s, 'F', 1); } },
    pcl5: { nome: ['Pentacloruro di fosforo PCl₅', 'Phosphorus pentachloride PCl₅'], f: function (M) { var p = M.aggiungiAtomo('P'); for (var k = 0; k < 5; k++) attacca(M, p, 'Cl', 1); } },
    solforico: { nome: ['Acido solforico H₂SO₄', 'Sulfuric acid H₂SO₄'], f: function (M) { var s = M.aggiungiAtomo('S'); attacca(M, s, 'O', 2); attacca(M, s, 'O', 2); attacca(M, s, 'O', 1); attacca(M, s, 'O', 1); } }
  };
  function modello(chiave) { var M = new Molecola(); MODELLI[chiave].f(M); completaH(M); ottimizza(M, 3000); return M; }

  /* ═══ 6. LA SCHEDA ══════════════════════════════════════════════════════ */
  function stile() {
    if (D.getElementById('bsiCM-stile')) return;
    var s = D.createElement('style'); s.id = 'bsiCM-stile';
    s.textContent = '.bsiCM-el{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}.bsiCM-el button{min-width:40px;min-height:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0b1d2e;color:#e6fffb;font:700 15px system-ui,sans-serif;cursor:pointer}' +
      '.bsiCM-el button[aria-pressed="true"]{border-color:#5eead4;box-shadow:0 0 0 2px rgba(94,234,212,.35) inset}.bsiCM-az{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}.bsiCM-az button{min-height:38px;border-radius:9px;border:1px solid #2a4a6e;background:#0b1d2e;color:#e6fffb;font:600 13px system-ui,sans-serif;padding:4px 10px;cursor:pointer}' +
      '.bsiCM-az button:focus-visible,.bsiCM-el button:focus-visible{outline:2px solid #5eead4;outline-offset:2px}.bsiCM-info{font-size:.86rem;line-height:1.5;color:#cfe3f7}.bsiCM-info b{color:#e6fffb}.bsiCM-avv{color:#ffb86b}';
    D.head.appendChild(s);
  }
  function scarica(nome, testo, tipo) { try { var b = new Blob([testo], { type: tipo || 'text/plain' }), a = D.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; D.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); } catch (e) { } }

  function schedaCostruttore(div) {
    stile();
    var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' });
    G.appendChild(pan); G.appendChild(dx); div.appendChild(G);
    var stato = { M: modello('metano'), scelto: 0, prec: -1, el: 'C', ordine: 1, modo: 'aggiungi', titolo: 'Metano CH₄' };
    var api = div._costruttore = { stato: stato, Molecola: Molecola, attacca: attacca, completaH: completaH, ottimizza: ottimizza, formula: formula, massa: massa, insaturazioni: insaturazioni, descrivi: descriviAtomo, mol: mol, xyz: xyz, modello: modello };

    /* comandi */
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Tocca un atomo nella scena: con «Lega» gli si attacca l\'elemento scelto, con «Scegli» lo si seleziona per misurarlo o cambiarlo. Il pulsante AR posa la molecola sul tavolo.', 'Tap an atom in the scene: with «Bond» the chosen element is attached to it, with «Select» it is selected to measure or change it. The AR button places the molecule on the table.') }));
    var selM = F.el('select', { 'aria-label': t('Modello pronto', 'Ready model') });
    selM.appendChild(F.el('option', { value: '', testo: t('— parti da un modello —', '— start from a model —') }));
    Object.keys(MODELLI).forEach(function (k) { selM.appendChild(F.el('option', { value: k, testo: F.tt(MODELLI[k].nome) })); });
    selM.addEventListener('change', function () { if (!selM.value) return; stato.M = modello(selM.value); stato.scelto = 0; stato.prec = -1; stato.titolo = F.tt(MODELLI[selM.value].nome); selM.value = ''; aggiorna(true); });
    pan.appendChild(selM);
    pan.appendChild(F.el('div', { style: 'margin-top:8px;font-size:.84rem;color:#9fb3c8', testo: t('Elemento', 'Element') }));
    var rigaEl = F.el('div', { 'class': 'bsiCM-el', role: 'group', 'aria-label': t('Elemento da aggiungere', 'Element to add') }), tastiEl = {};
    ORDINE_EL.forEach(function (e) { var b = F.el('button', { type: 'button', testo: e, title: F.tt(EL[e].nome), 'aria-pressed': String(e === stato.el), onclick: function () { stato.el = e; Object.keys(tastiEl).forEach(function (k) { tastiEl[k].setAttribute('aria-pressed', String(k === e)); }); } }); b.style.color = '#' + ('00000' + EL[e].col.toString(16)).slice(-6); if (e === 'C') b.style.color = '#c8c8c8'; if (e === 'N') b.style.color = '#8fa8ff'; if (e === 'I') b.style.color = '#d27bd2'; if (e === 'Br') b.style.color = '#e07a6e'; tastiEl[e] = b; rigaEl.appendChild(b); });
    pan.appendChild(rigaEl);
    var rigaO = F.el('div', { 'class': 'bsiCM-el', role: 'group', 'aria-label': t('Ordine di legame', 'Bond order') }), tastiO = [];
    [['—', 1, t('singolo', 'single')], ['=', 2, t('doppio', 'double')], ['≡', 3, t('triplo', 'triple')]].forEach(function (o) { var b = F.el('button', { type: 'button', testo: o[0], title: o[2], 'aria-label': t('Legame ', 'Bond ') + o[2], 'aria-pressed': String(o[1] === 1), onclick: function () { stato.ordine = o[1]; tastiO.forEach(function (x, k) { x.setAttribute('aria-pressed', String(k + 1 === o[1])); }); } }); tastiO.push(b); rigaO.appendChild(b); });
    var tModo = F.el('button', { type: 'button', testo: t('Tocco: Lega', 'Tap: Bond'), 'aria-pressed': 'true', onclick: function () { stato.modo = stato.modo === 'aggiungi' ? 'scegli' : 'aggiungi'; tModo.textContent = stato.modo === 'aggiungi' ? t('Tocco: Lega', 'Tap: Bond') : t('Tocco: Scegli', 'Tap: Select'); tModo.setAttribute('aria-pressed', String(stato.modo === 'aggiungi')); } });
    tModo.style.minWidth = '110px'; rigaO.appendChild(tModo);
    pan.appendChild(rigaO);
    var az = F.el('div', { 'class': 'bsiCM-az' });
    function tasto(testo, f) { var b = F.el('button', { type: 'button', testo: testo, onclick: f }); az.appendChild(b); return b; }
    var avviso = F.el('div', { 'class': 'bsiCM-avv', role: 'status', 'aria-live': 'polite' });
    tasto(t('➕ Lega all\'atomo scelto', '➕ Bond to selected'), function () { aggiungiA(stato.scelto); });
    tasto(t('H Completa con idrogeni', 'H Fill with hydrogens'), function () { var n = completaH(stato.M); ottimizza(stato.M, 3000); avviso.textContent = n ? t('Aggiunti ' + n + ' idrogeni.', 'Added ' + n + ' hydrogens.') : t('Nessuna valenza libera.', 'No free valence.'); aggiorna(); });
    tasto(t('🔁 Cambia in elemento scelto', '🔁 Change to chosen element'), function () { var a = stato.M.atomi[stato.scelto]; if (!a) return; var prima = a.el; a.el = stato.el; if (stato.M.libera(stato.scelto) < 0) { a.el = prima; avviso.textContent = t('Valenza superata: ' + stato.el + ' non regge ' + stato.M.usata(stato.scelto) + ' legami.', 'Valence exceeded: ' + stato.el + ' cannot carry ' + stato.M.usata(stato.scelto) + ' bonds.'); return; } ottimizza(stato.M, 3000); aggiorna(); });
    tasto(t('🔗 Chiudi anello (scelto ↔ precedente)', '🔗 Close ring (selected ↔ previous)'), function () { chiudi(stato.prec, stato.scelto); });
    tasto(t('± Carica', '± Charge'), function () { var a = stato.M.atomi[stato.scelto]; if (!a) return; a.q = a.q === 0 ? 1 : a.q === 1 ? -1 : 0; if (stato.M.libera(stato.scelto) < 0) a.q = 0; ottimizza(stato.M, 3000); aggiorna(); });
    tasto(t('🗑 Elimina atomo', '🗑 Delete atom'), function () { if (stato.M.atomi.length <= 1) return; var i = stato.scelto, hs = stato.M.vicini(i).filter(function (j) { return stato.M.atomi[j].el === 'H' && stato.M.vicini(j).length === 1; }).sort(function (a, b) { return b - a; }); hs.forEach(function (j) { stato.M.togli(j); if (j < i) i--; }); stato.M.togli(i); /* restano frammenti staccati? si tiene il più grande */ tieniConnesso(); stato.scelto = 0; ottimizza(stato.M, 3000); aggiorna(); });
    tasto(t('⚙️ Ottimizza', '⚙️ Optimise'), function () { var r = ottimizza(stato.M, 4000); avviso.textContent = t('Geometria ottimizzata in ' + r.passi + ' passi.', 'Geometry optimised in ' + r.passi + ' steps.'); aggiorna(); });
    tasto(t('↺ Nuova', '↺ New'), function () { stato.M = new Molecola(); stato.M.aggiungiAtomo(stato.el === 'H' ? 'C' : stato.el); stato.scelto = 0; stato.titolo = t('Molecola costruita', 'Built molecule'); aggiorna(true); });
    tasto('⬇ .mol', function () { scarica('molecola.mol', mol(stato.M, stato.titolo), 'chemical/x-mdl-molfile'); });
    tasto('⬇ .xyz', function () { scarica('molecola.xyz', xyz(stato.M, stato.titolo), 'chemical/x-xyz'); });
    pan.appendChild(az); pan.appendChild(avviso);
    var info = F.el('div', { 'class': 'bsiCM-info', 'aria-live': 'polite' }); pan.appendChild(info);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('MODELLO — geometria da un campo di forze semplificato: lunghezze dai raggi covalenti (Cordero et al. 2008), angoli dalla VSEPR, planarità dei centri sp², repulsione fra atomi non legati. Non è un calcolo quantistico: errori tipici di qualche centesimo di Å e pochi gradi.', 'MODEL — geometry from a simplified force field: lengths from covalent radii (Cordero et al. 2008), angles from VSEPR, planarity of sp² centres, repulsion between non-bonded atoms. Not a quantum calculation: typical errors of a few hundredths of Å and a few degrees.') }));

    function tieniConnesso() {
      var M = stato.M, n = M.atomi.length; if (!n) return; var comp = new Array(n).fill(-1), c = 0, dim = [];
      for (var s = 0; s < n; s++) { if (comp[s] >= 0) continue; var pila = [s], k = 0; comp[s] = c; while (pila.length) { var x = pila.pop(); k++; M.vicini(x).forEach(function (y) { if (comp[y] < 0) { comp[y] = c; pila.push(y); } }); } dim.push(k); c++; }
      if (c < 2) return; var big = dim.indexOf(Math.max.apply(null, dim));
      for (var i = n - 1; i >= 0; i--) if (comp[i] !== big) M.togli(i);
    }
    function scegli(i) { if (i !== stato.scelto) stato.prec = stato.scelto; stato.scelto = i; }
    /** lega due atomi già presenti (chiusura di un anello), togliendo gli idrogeni che servono */
    function chiudi(i, j) {
      var M = stato.M, o = stato.ordine;
      if (i < 0 || j < 0 || i === j || !M.atomi[i] || !M.atomi[j]) { avviso.textContent = t('Scegli due atomi: tocca il primo, poi il secondo (modo «Scegli»).', 'Choose two atoms: tap the first, then the second («Select» mode).'); return; }
      if (M.legame(i, j)) { avviso.textContent = t('Questi due atomi sono già legati.', 'These two atoms are already bonded.'); return; }
      if (M.atomi[i].el === 'H' || M.atomi[j].el === 'H') { avviso.textContent = t('Un anello si chiude fra atomi pesanti, non sugli idrogeni.', 'A ring closes between heavy atoms, not on hydrogens.'); return; }
      var ab = [i, j];
      for (var q = 0; q < 2; q++) {
        while (M.capienza(ab[q]) < o) {
          var h = M.vicini(ab[q]).filter(function (x) { return M.atomi[x].el === 'H'; }).pop(); if (h == null) break;
          M.togli(h); ab = ab.map(function (x) { return x > h ? x - 1 : x; });
        }
        if (M.capienza(ab[q]) < o) { avviso.textContent = t('Valenza piena: ' + M.atomi[ab[q]].el + ' non può fare un altro legame.', 'Full valence: ' + M.atomi[ab[q]].el + ' cannot form another bond.'); completaH(M); ottimizza(M, 3000); aggiorna(); return; }
      }
      M.lega(ab[0], ab[1], o); completaH(M); ottimizza(M, 4000);
      stato.scelto = ab[1]; stato.prec = ab[0]; avviso.textContent = t('Anello chiuso.', 'Ring closed.'); stato.titolo = t('Molecola costruita', 'Built molecule'); aggiorna();
    }
    function aggiungiA(i) {
      var M = stato.M; if (!M.atomi[i]) return;
      if (M.atomi[i].el === 'H' && M.vicini(i).length) { avviso.textContent = t('L\'idrogeno ha già il suo legame: scegli un altro atomo.', 'The hydrogen already has its bond: choose another atom.'); return; }
      /* se servono, si fa posto togliendo idrogeni dell'atomo scelto */
      var nuovo = { el: stato.el }, serve = stato.ordine, hs = M.vicini(i).filter(function (j) { return M.atomi[j].el === 'H'; });
      var vNuovo = EL[stato.el].val[EL[stato.el].val.length - 1];
      if (vNuovo < serve) { avviso.textContent = t(stato.el + ' non forma legami ' + (serve === 2 ? 'doppi' : 'tripli') + '.', stato.el + ' does not form ' + (serve === 2 ? 'double' : 'triple') + ' bonds.'); return; }
      while (M.libera(i) < serve && hs.length) { var h = hs.pop(); M.togli(h); if (h < i) i--; hs = hs.map(function (x) { return x > h ? x - 1 : x; }); }
      if (M.libera(i) < serve) { avviso.textContent = t('Valenza piena: ' + M.atomi[i].el + ' ha già ' + M.usata(i) + ' legami.', 'Full valence: ' + M.atomi[i].el + ' already has ' + M.usata(i) + ' bonds.'); return; }
      var j = attacca(M, i, nuovo.el, serve);
      completaH(M); ottimizza(M, 3000);
      stato.prec = i; stato.scelto = j; avviso.textContent = '';
      stato.titolo = t('Molecola costruita', 'Built molecule');
      aggiorna();
    }

    /* scena */
    var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.appendChild(attesa);
    var S = null, T = null, gruppo = null, mesh = [];
    function aggiorna(nuova) {
      var M = stato.M;
      if (stato.scelto >= M.atomi.length) stato.scelto = 0;
      var d = M.atomi.length ? descriviAtomo(M, stato.scelto) : null, libere = 0;
      M.atomi.forEach(function (a, i) { libere += Math.max(0, M.libera(i)); });
      info.textContent = '';
      function riga(et, val) { var r = F.el('div'); r.appendChild(F.el('b', { testo: et + ': ' })); r.appendChild(D.createTextNode(val)); info.appendChild(r); }
      riga(t('Formula', 'Formula'), formula(M));
      riga(t('Massa molare', 'Molar mass'), num(massa(M), 2) + ' g/mol');
      riga(t('Atomi e legami', 'Atoms and bonds'), M.atomi.length + ' · ' + M.legami.length);
      var dbe = insaturazioni(M); riga(t('Insaturazioni (DBE)', 'Degrees of unsaturation (DBE)'), dbe == null ? t('— (valenza espansa)', '— (expanded valence)') : num(dbe, 1));
      if (libere) { var w = F.el('div', { 'class': 'bsiCM-avv', testo: t('Valenze libere: ' + libere + ' (radicale o molecola incompleta: «Completa con idrogeni»)', 'Free valences: ' + libere + ' (radical or incomplete molecule: «Fill with hydrogens»)') }); info.appendChild(w); }
      if (d) {
        riga(t('Atomo scelto', 'Selected atom'), d.el + ' (' + F.tt(EL[d.el].nome) + ')' + (M.atomi[stato.scelto].q ? (M.atomi[stato.scelto].q > 0 ? ' ⁺' : ' ⁻') : ''));
        if (d.geometria) riga('VSEPR', 'AX' + pedice(d.vicini) + (d.coppie ? 'E' + pedice(d.coppie) : '') + ' · ' + F.tt(d.geometria) + (d.ibrido ? ' · ' + d.ibrido : ''));
        if (d.legami.length) riga(t('Legami', 'Bonds'), d.legami.map(function (l) { return d.el + ['', '–', '=', '≡'][l.ordine] + l.con + ' ' + num(l.d, 3) + ' Å'; }).join(' · '));
        if (d.angoli.length) { var mn = Math.min.apply(null, d.angoli), mx = Math.max.apply(null, d.angoli); riga(t('Angoli', 'Angles'), mn.toFixed(1).replace('.', ',') + '°' + (mx - mn > 0.15 ? ' … ' + mx.toFixed(1).replace('.', ',') + '°' : '')); }
      }
      disegna(nuova);
    }
    function disegna(nuova) {
      if (!S) return;
      S.pulisci(); mesh = [];
      var M = stato.M; gruppo = new T.Group(); gruppo.name = 'molecola';
      var sfG = new T.SphereGeometry(1, 28, 20), ciG = new T.CylinderGeometry(1, 1, 1, 14, 1);
      M.atomi.forEach(function (a, i) {
        var e = EL[a.el], r = 0.18 + 0.26 * e.rc, m = new T.MeshStandardMaterial({ color: e.col, roughness: 0.38, metalness: 0.08, emissive: i === stato.scelto ? 0x1e6f63 : 0x000000 });
        var s = new T.Mesh(sfG, m); s.scale.setScalar(r); s.position.set(a.x, a.y, a.z); s.userData.atomo = i; s.name = 'atomo-' + a.el; gruppo.add(s); mesh.push(s);
      });
      var matL = new T.MeshStandardMaterial({ color: 0xb8c4d0, roughness: 0.5, metalness: 0.1 });
      M.legami.forEach(function (l) {
        var a = M.atomi[l.a], b = M.atomi[l.b], A = new T.Vector3(a.x, a.y, a.z), B = new T.Vector3(b.x, b.y, b.z), dir = B.clone().sub(A), L = dir.length();
        /* direzione di spostamento dei legami multipli: nel piano dei vicini, perpendicolare al legame */
        var perp = new T.Vector3(0, 0, 1);
        var altro = M.vicini(l.a).filter(function (k) { return k !== l.b; })[0]; if (altro == null) altro = M.vicini(l.b).filter(function (k) { return k !== l.a; })[0];
        if (altro != null) { var c = M.atomi[altro]; perp = new T.Vector3(c.x - a.x, c.y - a.y, c.z - a.z); }
        var u = dir.clone().normalize(); perp.sub(u.clone().multiplyScalar(perp.dot(u))); if (perp.lengthSq() < 1e-6) perp = new T.Vector3(1, 0, 0).cross(u); if (perp.lengthSq() < 1e-6) perp = new T.Vector3(0, 1, 0).cross(u); perp.normalize();
        var off = l.o === 1 ? [0] : l.o === 2 ? [-0.075, 0.075] : [-0.12, 0, 0.12], rr = l.o === 1 ? 0.075 : 0.048;
        off.forEach(function (o) {
          var c2 = new T.Mesh(ciG, matL); c2.scale.set(rr, L, rr); c2.position.copy(A.clone().add(B).multiplyScalar(0.5).add(perp.clone().multiplyScalar(o)));
          c2.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), u); c2.name = 'legame'; gruppo.add(c2);
        });
      });
      S.aggiungi(gruppo);
      var R = 1; M.atomi.forEach(function (a) { R = Math.max(R, Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)); });
      if (nuova || !S.vistaIniziale) S.inquadra(Math.max(5, R * 3.4), 0.6, 1.15);
      S.didascalia.textContent = stato.titolo + ' · ' + formula(M) + ' · ' + t('MODELLO: campo di forze semplificato', 'MODEL: simplified force field');
      S.avvia();
    }
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); aggiorna(); return; }
    L3.stile();
    L3.caricaThree().then(function () {
      attesa.remove(); T = globale.THREE; S = new L3.Scena(dx, 0.78); dx.insertBefore(S.box, dx.firstChild); api.scena = S;
      if (S.cinema) try { S.cinema({ forza: 0.22, soglia: 0.86, vignetta: 0.35 }); } catch (e) { }   /* la stessa resa delle altre scene: bagliore solo sulle luci, vignettatura */
      var giu = null, ray = new T.Raycaster(), el = S.ren.domElement;
      el.addEventListener('pointerdown', function (e) { giu = { x: e.clientX, y: e.clientY }; });
      el.addEventListener('pointerup', function (e) {
        if (!giu || Math.hypot(e.clientX - giu.x, e.clientY - giu.y) > 6) { giu = null; return; } giu = null;
        var r = el.getBoundingClientRect(), p = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        S.disegna(); ray.setFromCamera(p, S.cam); var x = ray.intersectObjects(mesh, false)[0]; if (!x) return;
        var i = x.object.userData.atomo; if (stato.modo === 'aggiungi') aggiungiA(i); else { scegli(i); aggiorna(); }
      });
      api.tocca = function (i) { if (stato.modo === 'aggiungi') aggiungiA(i); else { scegli(i); aggiorna(); } };
      aggiorna(true);
    }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    api.aggiorna = aggiorna; api.aggiungiA = function (i) { aggiungiA(i); }; api.chiudi = function (i, j) { chiudi(i, j); }; api.scegli = function (i) { scegli(i); aggiorna(); };
    aggiorna();
  }

  /* ═══ 7. LA SEZIONE ═════════════════════════════════════════════════════ */
  F.sezione('scostruttore', {
    titolo: ['🧪 Costruttore molecolare 3D e AR', '🧪 3D and AR molecule builder'],
    sotto: ['Costruisci una molecola atomo per atomo: scegli l\'elemento e l\'ordine di legame, tocca l\'atomo a cui legarlo, completa con gli idrogeni. La geometria si sistema da sola (VSEPR e raggi covalenti) e il pulsante AR la posa sul tavolo.',
            'Build a molecule atom by atom: choose the element and the bond order, tap the atom to bond it to, fill with hydrogens. The geometry arranges itself (VSEPR and covalent radii) and the AR button places it on the table.'],
    schede: [{ nome: ['🧪 Costruisci', '🧪 Build'], costruisci: schedaCostruttore }]
  });
  F.calcolo = F.calcolo || {};
  F.calcolo.costruttore = { EL: EL, Molecola: Molecola, attacca: attacca, completaH: completaH, ottimizza: ottimizza, formula: formula, massa: massa, insaturazioni: insaturazioni, descrivi: descriviAtomo, mol: mol, xyz: xyz, modello: modello, MODELLI: MODELLI };
})(typeof window !== 'undefined' ? window : globalThis);
