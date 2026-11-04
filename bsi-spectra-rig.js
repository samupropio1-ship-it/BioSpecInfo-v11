/* ════════════════════════════════════════════════════════════════════════
   BioSpecInfo · bsi-spectra-rig.js  (v239)
   © Samuele Pio Provenzano

   IL RIG AUTOMATICO: da una statua a un corpo che si muove.
   Molti modelli umanoidi (il «Bounty Hunter» scelto dall'autore per il corpo di
   Spectra, per esempio) arrivano come una mesh sola, senza scheletro: belli ma
   immobili. Questo modulo li rende pilotabili dal driver del corpo
   (bsi-spectra-corpo.js) senza Blender, direttamente nel browser:

   1. MISURA la figura, che deve stare in piedi (posa a T o ad A), rivolta verso +z:
      altezza, asse del corpo, profondita' del busto, centri delle gambe a varie
      altezze, posizione delle mani (i vertici piu' esterni, sopra le anche) e delle
      spalle; i punti che non si possono misurare (vertebre, collo) seguono le
      proporzioni del canone umano (anche al 41 % dell'altezza, collo all'81 %…).
   2. COSTRUISCE uno scheletro con i nomi Mixamo (Hips, Spine…, LeftArm, LeftForeArm,
      LeftHand, LeftUpLeg, LeftLeg, LeftFoot…), che il driver riconosce da solo.
   3. CALCOLA I PESI della pelle: per ogni vertice la distanza da ogni segmento osseo,
      con un cancello per regione (una coscia non muove l'altra; sotto le anche
      contano solo le ossa di quella gamba), peso ∝ 1/d⁴, i quattro maggiori; poi
      tre passate di levigatura sui vicini della mesh, perche' le pieghe (gomiti,
      ginocchia, ascelle) si deformino morbide e non a gradino.
   4. LA TESTA DIVENTA UN CAPPUCCIO col solo viso: con { cappuccio, gonfia, viso } il
      cappuccio del modello si allarga quanto basta ad avvolgere il volto «Noir»
      (in modo graduale dal colletto: nessun gradino), diventa rigido con l'osso
      della testa e si apre davanti con un'ellisse fatta NELLO SHADER, al pixel
      (bordo liscio, che segue la testa in ogni movimento). L'interno del casco
      resta come fodera in ombra; con { visiera: false } anche il casco sotto il
      cappuccio (la visiera nera lucida) diventa ombra opaca: della testa si vede
      solo il viso, che emerge dall'ombra del cappuccio. Senza viso,
      { togliTesta } toglie i triangoli sopra il collo.
   5. RICOLORA la texture in BLU NOTTE (richiesta dell'autore): ombre quasi nere
      #03050c, mezzitoni #0d162e–#162448, luci #2a3c6c, i bianchi appena azzurri;
      i dettagli turchesi del modello diventano luce propria verde acqua #00c9b7.
      Il disegno della texture (cuciture, piastre, pieghe) resta tutto.
   I pesi del braccio passano tre filtri: la normale (la pelle sta davanti all'osso),
   la distanza geodetica dalla mano (il braccio e' un tubo: il fianco del busto,
   vicino in linea d'aria, e' lontano camminando sulla pelle) e l'asse della testa
   (cappuccio e colletto non seguono mai il braccio); la mano non prende peso dal
   bacino. Cosi' alzare un braccio non strappa il busto.

   API: BSISpectraRig.rigga(scena, { T, altezza: 1.8, togliTesta: true,
          cappuccio: true, gonfia: 1.22, viso: { y, ax, ay }, ricolora: true })
        → { radice, mesh, ossa, punti, tolti }
        BSISpectraRig.ricolora(mappa, T) → { mappa, emissiva }
        BSISpectraRig.misura(pos, n, Y0, H) → punti dello scheletro
   ════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* le proporzioni del canone (frazione dell'altezza, dal suolo) per i punti non misurabili */
  var U = { anche: 0.41, colonna: 0.52, petto: 0.60, torace: 0.69, collo: 0.81, testa: 0.855, spalla: 0.765, clavi: 0.775, ginocchio: 0.23, caviglia: 0.055 };

  /* ── la misura: i punti dello scheletro, nelle coordinate della mesh ── */
  function misura(P, n, info) {
    var Y0 = info.y0, H = info.h, cx = info.cx;
    function X(i) { return P[i * 3]; } function Y(i) { return P[i * 3 + 1]; } function Z(i) { return P[i * 3 + 2]; }
    function u(i) { return (Y(i) - Y0) / H; }
    /* il mezzo di una fascia: media di x, mezzo dell'intervallo di z (lo zaino o il seno non spostano l'asse) */
    function fascia(u0, u1, filtro) {
      var sx = 0, k = 0, zl = 1e9, zh = -1e9;
      for (var i = 0; i < n; i++) { var uu = u(i); if (uu < u0 || uu >= u1 || !filtro(i)) continue; sx += X(i); k++; zl = Math.min(zl, Z(i)); zh = Math.max(zh, Z(i)); }
      return k ? { x: sx / k, z: (zl + zh) / 2, zmin: zl, zmax: zh, k: k } : null;
    }
    var asse = fascia(0.38, 0.46, function (i) { return Math.abs(X(i) - cx) < 0.05 * H; }) || { z: 0 };
    var cz = asse.z, testaZ = (fascia(0.86, 0.96, function (i) { return Math.abs(X(i) - cx) < 0.05 * H; }) || asse).z;
    function V(x, uu, z) { return [x, Y0 + uu * H, z]; }
    var p = {
      Hips: V(cx, U.anche + 0.03, cz), Spine: V(cx, U.colonna, cz), Spine1: V(cx, U.petto, cz), Spine2: V(cx, U.torace, cz),
      Neck: V(cx, U.collo, (cz + testaZ) / 2), Head: V(cx, U.testa, testaZ), HeadTop_End: V(cx, 1, testaZ)
    };
    /* la larghezza delle spalle: il mezzo busto all'altezza delle spalle, un po' rientrato (l'articolazione e' dentro) */
    var mezzo = 0; for (var i = 0; i < n; i++) { var uu = u(i); if (uu > U.spalla + 0.01 && uu < U.spalla + 0.045) mezzo = Math.max(mezzo, Math.abs(X(i) - cx)); }
    [['Left', 1], ['Right', -1]].forEach(function (lato) {
      var L = lato[0], s = lato[1];
      /* le gambe: i centri della sezione a varie altezze */
      function gamba(u0, u1) { return fascia(u0, u1, function (i) { var d = s * (X(i) - cx); return d > 0.008 * H && d < 0.2 * H; }); }
      var ga = gamba(U.anche - 0.03, U.anche + 0.01) || { x: cx + s * 0.08 * H, z: cz };
      var gi = gamba(U.ginocchio - 0.015, U.ginocchio + 0.015) || ga, gc = gamba(U.caviglia - 0.01, U.caviglia + 0.02) || gi, pd = gamba(0, 0.03) || gc;
      p[L + 'UpLeg'] = V(ga.x, U.anche, cz); p[L + 'Leg'] = V(gi.x, U.ginocchio, gi.z); p[L + 'Foot'] = V(gc.x, U.caviglia, gc.z);
      p[L + 'ToeBase'] = V(pd.x, 0.012, pd.zmax - 0.035 * H); p[L + 'Toe_End'] = V(pd.x, 0.01, pd.zmax);
      /* la mano: i vertici piu' esterni di quel lato, sopra le anche (in posa ad A pendono di fianco alle cosce) */
      var mx = 0, i2; for (i2 = 0; i2 < n; i2++) { if (u(i2) > 0.3 && u(i2) < 0.85) mx = Math.max(mx, s * (X(i2) - cx)); }
      var hx = 0, hy = 0, hz = 0, hk = 0;
      for (i2 = 0; i2 < n; i2++) { var d2 = s * (X(i2) - cx); if (u(i2) > 0.3 && u(i2) < 0.85 && d2 > 0.82 * mx) { hx += X(i2); hy += Y(i2); hz += Z(i2); hk++; } }
      var mano = hk ? [hx / hk, hy / hk, hz / hk] : [cx + s * 0.4 * H, Y0 + 0.765 * H, cz];
      var spalla = V(cx + s * mezzo * 0.88, U.spalla, cz - 0.01 * H);
      var dir = [mano[0] - spalla[0], mano[1] - spalla[1], mano[2] - spalla[2]], ld = Math.hypot(dir[0], dir[1], dir[2]) || 1; dir = dir.map(function (v) { return v / ld; });
      var polso = mano.map(function (v, k) { return v - dir[k] * 0.035 * H; });
      var gomito = spalla.map(function (v, k) { return v + 0.54 * (polso[k] - v); }); gomito[2] -= 0.008 * H;   /* il gomito un filo indietro: il braccio a riposo e' appena piegato */
      p[L + 'Shoulder'] = V(cx + s * 0.035 * H, U.clavi, cz); p[L + 'Arm'] = spalla; p[L + 'ForeArm'] = gomito; p[L + 'Hand'] = polso;
      p[L + 'Hand_End'] = mano.map(function (v, k) { return v + dir[k] * 0.045 * H; });
    });
    p._cz = cz; p._mezzo = mezzo;
    return p;
  }

  /* la gerarchia (nome → genitore) */
  var GERARCHIA = [['Hips', null], ['Spine', 'Hips'], ['Spine1', 'Spine'], ['Spine2', 'Spine1'], ['Neck', 'Spine2'], ['Head', 'Neck'], ['HeadTop_End', 'Head']];
  ['Left', 'Right'].forEach(function (L) {
    GERARCHIA.push([L + 'Shoulder', 'Spine2'], [L + 'Arm', L + 'Shoulder'], [L + 'ForeArm', L + 'Arm'], [L + 'Hand', L + 'ForeArm'], [L + 'Hand_End', L + 'Hand'],
      [L + 'UpLeg', 'Hips'], [L + 'Leg', L + 'UpLeg'], [L + 'Foot', L + 'Leg'], [L + 'ToeBase', L + 'Foot'], [L + 'Toe_End', L + 'ToeBase']);
  });
  /* le ossa che pesano (le punte «_End» servono solo a dare la direzione) */
  function pesa(nome) { return !/_End$/.test(nome); }

  /* ── la distanza geodetica (camminando sulla pelle) da un vertice a tutti gli altri: Dijkstra con un mucchio binario ── */
  function geodetica(P, n, adiac, da) {
    var D = new Float64Array(n).fill(Infinity), H = [], fatto = new Uint8Array(n);
    function su(i) { while (i > 0) { var p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; var t = H[p]; H[p] = H[i]; H[i] = t; i = p; } }
    function giu(i) { for (;;) { var l = 2 * i + 1, r = l + 1, m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; var t = H[m]; H[m] = H[i]; H[i] = t; i = m; } }
    D[da] = 0; H.push([0, da]);
    while (H.length) {
      var top = H[0], ult = H.pop(); if (H.length) { H[0] = ult; giu(0); }
      var v = top[1]; if (fatto[v]) continue; fatto[v] = 1; var vic = adiac[v];
      for (var q = 0; q < vic.length; q++) { var w = vic[q], d = D[v] + Math.hypot(P[v * 3] - P[w * 3], P[v * 3 + 1] - P[w * 3 + 1], P[v * 3 + 2] - P[w * 3 + 2]); if (d < D[w]) { D[w] = d; H.push([d, w]); su(H.length - 1); } }
    }
    return D;
  }

  /* ── i pesi della pelle ── */
  function pesi(P, n, adiac, punti, nomi, info, NR, rapG) {
    var H = info.h, Y0 = info.y0, cx = info.cx, uAnche = U.anche;
    /* i segmenti: dall'osso al suo figlio piu' lontano */
    var seg = nomi.map(function (nome) {
      var figli = GERARCHIA.filter(function (g) { return g[1] === nome; }).map(function (g) { return punti[g[0]]; });
      var a = punti[nome], b = a, dm = -1;
      figli.forEach(function (f) { var d = Math.hypot(f[0] - a[0], f[1] - a[1], f[2] - a[2]); if (d > dm) { dm = d; b = f; } });
      if (nome === 'Hips') b = [a[0], a[1] - 0.04 * H, a[2]];   /* il bacino: un segmento corto verso il basso */
      var lato = /^Left/.test(nome) ? 1 : /^Right/.test(nome) ? -1 : 0, gamba = /UpLeg|Leg$|Foot|Toe/.test(nome), braccio = /Arm|Hand/.test(nome);
      return { a: a, b: b, lato: lato, gamba: gamba, braccio: braccio };
    });
    var m = seg.length, W = new Float32Array(n * m);
    function manoVic(i, x, y, z) {
      var lato = x >= 0 ? 1 : -1, mano = punti[(lato > 0 ? 'Left' : 'Right') + 'Hand_End'], polso = punti[(lato > 0 ? 'Left' : 'Right') + 'Hand'];
      var cxm = (mano[0] + polso[0]) / 2, cym = (mano[1] + polso[1]) / 2, czm = (mano[2] + polso[2]) / 2;
      return Math.hypot(x - cxm, y - cym, z - czm) < 0.06 * H && braccioOk[lato][rapG ? rapG[i] : i];
    }
    /* IL BRACCIO E' UN TUBO: dalla mano si arriva alla pelle del braccio quasi in linea retta, mentre per arrivare al
       fianco del busto (vicinissimo in linea d'aria, in posa ad A) bisogna risalire fino all'ascella e ridiscendere.
       Un vertice appartiene al braccio se la strada sulla pelle dalla mano e' al piu' il 30 % piu' lunga della linea d'aria.
       I pezzi staccati (una placca cucita a parte: dalla mano non ci si arriva) restano ai criteri di distanza e normale. */
    var braccioOk = {};
    [['Left', 1], ['Right', -1]].forEach(function (lato) {
      var mano = punti[lato[0] + 'Hand'], best = -1, bd = 1e9;
      for (var i0 = 0; i0 < n; i0++) { if (!adiac[i0].length) continue; var dd = Math.hypot(P[i0 * 3] - mano[0], P[i0 * 3 + 1] - mano[1], P[i0 * 3 + 2] - mano[2]); if (dd < bd) { bd = dd; best = i0; } }
      var G = geodetica(P, n, adiac, best), ok = new Uint8Array(n);
      for (i0 = 0; i0 < n; i0++) { var eu = Math.hypot(P[i0 * 3] - P[best * 3], P[i0 * 3 + 1] - P[best * 3 + 1], P[i0 * 3 + 2] - P[best * 3 + 2]); var sp = punti[lato[0] + 'Arm'], ds = Math.hypot(P[i0 * 3] - sp[0], P[i0 * 3 + 1] - sp[1], P[i0 * 3 + 2] - sp[2]);
        /* eccezione: la spallina (spesso un pezzo a se', cucito male) attorno all'articolazione segue il braccio */
        ok[i0] = !isFinite(G[i0]) || G[i0] <= 1.3 * eu + 0.04 * H || (ds < 0.065 * H && lato[1] * P[i0 * 3] > Math.abs(sp[0]) * 0.75) ? 1 : 0; }
      braccioOk[lato[1]] = ok;
    });
    for (var i = 0; i < n; i++) {
      var x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], uu = (y - Y0) / H, s = x - cx;
      for (var j = 0; j < m; j++) {
        var S = seg[j];
        /* i cancelli: una gamba non tocca l'altra ne' le braccia; sotto le anche contano solo le gambe */
        if (S.lato && S.lato * s < -0.01 * H) continue;
        if (uu < uAnche - 0.025 && Math.abs(s) > 0.012 * H && !S.gamba && j !== 0) continue;
        if (S.gamba && uu > uAnche + 0.06) continue;
        if (S.braccio && !braccioOk[S.lato][rapG ? rapG[i] : i]) continue;
        /* la mano appartiene solo al braccio: le dita che pendono accanto all'anca non prendono peso dal bacino o dalle gambe */
        if (!S.braccio && manoVic(i, x, y, z)) continue;
        /* il cappuccio e il colletto (vicini all'asse della testa) non seguono mai il braccio */
        if (S.braccio && Math.abs(s) < 0.6 * info.xSpalla) continue;
        /* accanto alla mano pendente (posa ad A) ci sono le cosce e le fondine: l'avambraccio e la mano tirano solo la pelle piu' in fuori */
        if (S.braccio && /ForeArm|Hand/.test(nomi[j]) && uu < info.uMano + 0.06 && Math.abs(s) < 0.8 * info.xMano) continue;
        var ab = [S.b[0] - S.a[0], S.b[1] - S.a[1], S.b[2] - S.a[2]], ap = [x - S.a[0], y - S.a[1], z - S.a[2]];
        var l2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2], t = l2 > 0 ? Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / l2)) : 0;
        var dx = ap[0] - t * ab[0], dy = ap[1] - t * ab[1], dz = ap[2] - t * ab[2], d = Math.hypot(dx, dy, dz) + 0.012 * H;
        var w0 = 1 / (d * d * d * d);
        /* la «visibilita'» dell'osso: la pelle sta davanti all'osso se la sua normale guarda via dall'osso. Il fianco
           del busto, vicino al braccio, ha la normale verso il braccio: quel braccio non lo deve tirare */
        if (NR) { var dn = (dx * NR[i * 3] + dy * NR[i * 3 + 1] + dz * NR[i * 3 + 2]) / (d || 1); if (dn < -0.05) w0 *= 0.002; }
        W[i * m + j] = w0;
      }
      var tot = 0; for (j = 0; j < m; j++) tot += W[i * m + j]; if (tot > 0) for (j = 0; j < m; j++) W[i * m + j] /= tot;
    }
    /* la levigatura: ogni vertice prende un po' dei vicini (i gradini nelle pieghe spariscono) */
    var W0 = new Float32Array(W);
    for (var it = 0; it < 3; it++) {
      var N = new Float32Array(W);
      for (i = 0; i < n; i++) {
        var vic = adiac[i]; if (!vic || !vic.length) continue;
        for (j = 0; j < m; j++) { var sm = 0; for (var q = 0; q < vic.length; q++) sm += W[vic[q] * m + j]; N[i * m + j] = 0.5 * W[i * m + j] + 0.5 * sm / vic.length; }
      }
      W = N;
    }
    /* la levigatura ammorbidisce fra ossa gia' presenti, ma non deve portare un osso dove prima non tirava affatto
       (il braccio sul petto): i pesi nati solo dalla levigatura si tolgono */
    for (i = 0; i < n; i++) for (j = 0; j < m; j++) if (W0[i * m + j] < 0.01 && seg[j].braccio) W[i * m + j] = 0;
    /* i quattro maggiori, normalizzati */
    var idx = new Uint16Array(n * 4), wt = new Float32Array(n * 4);
    for (i = 0; i < n; i++) {
      var best = [];
      for (j = 0; j < m; j++) { var w = W[i * m + j]; if (w > 1e-4) best.push([w, j]); }
      best.sort(function (a, b) { return b[0] - a[0]; }); best = best.slice(0, 4);
      var sw = best.reduce(function (a, b) { return a + b[0]; }, 0) || 1;
      for (var k = 0; k < 4; k++) { idx[i * 4 + k] = best[k] ? best[k][1] : 0; wt[i * 4 + k] = best[k] ? best[k][0] / sw : (k === 0 && !best.length ? 1 : 0); }
    }
    return { idx: idx, wt: wt };
  }

  /* ── la ricolorazione con la tavolozza dell'app ── */
  var SCALA = [[0, [3, 5, 12]], [0.12, [7, 12, 26]], [0.3, [13, 22, 46]], [0.5, [22, 36, 72]], [0.7, [42, 60, 108]], [0.88, [92, 110, 158]], [1, [170, 184, 214]]];   /* blu notte */
  function tinta(l) {
    for (var i = 1; i < SCALA.length; i++) if (l <= SCALA[i][0]) { var a = SCALA[i - 1], b = SCALA[i], f = (l - a[0]) / (b[0] - a[0]); return [a[1][0] + f * (b[1][0] - a[1][0]), a[1][1] + f * (b[1][1] - a[1][1]), a[1][2] + f * (b[1][2] - a[1][2])]; }
    return SCALA[SCALA.length - 1][1];
  }
  function ricolora(mappa, T, opz2) {
    opz2 = opz2 || {};
    var im = mappa && mappa.image; if (!im || !im.width || typeof document === 'undefined') return null;
    var w = im.width, h = im.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'); g.drawImage(im, 0, 0); var D = g.getImageData(0, 0, w, h), d = D.data;
    /* il rilievo: la luminanza originale (prima della ricolorazione) fa da mappa d'altezza, cosi' cuciture, bordi delle
       piastre e pieghe della stoffa prendono luce e ombra vere a ogni angolo, non solo dipinte */
    var cb = document.createElement('canvas'); cb.width = w; cb.height = h; var gb = cb.getContext('2d'), B = gb.createImageData(w, h), bb = B.data;
    for (var ib = 0; ib < d.length; ib += 4) { var lb = 0.299 * d[ib] + 0.587 * d[ib + 1] + 0.114 * d[ib + 2]; bb[ib] = bb[ib + 1] = bb[ib + 2] = lb; bb[ib + 3] = 255; }
    gb.putImageData(B, 0, 0);
    /* una sfumatura leggera: la trama fitta della stoffa non deve diventare squame; restano bordi, cuciture e pieghe */
    try { var cb2 = document.createElement('canvas'); cb2.width = w; cb2.height = h; var g2b = cb2.getContext('2d'); g2b.filter = 'blur(' + Math.max(1, w / 1400) + 'px)'; g2b.drawImage(cb, 0, 0); if (g2b.filter !== 'none') cb = cb2; } catch (e) {}
    var ce = document.createElement('canvas'); ce.width = w; ce.height = h; var ge = ce.getContext('2d'), E = ge.createImageData(w, h), e = E.data;
    var tab = []; for (var k = 0; k < 256; k++) tab.push(tinta(Math.pow(k / 255, 0.8)));
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], gg = d[i + 1], b = d[i + 2], l = Math.round(0.299 * r + 0.587 * gg + 0.114 * b), t = tab[l];
      /* i dettagli turchesi/azzurri del modello: diventano luce verde acqua */
      var accento = b - r > 40 && gg - r > 20;
      d[i] = t[0]; d[i + 1] = t[1]; d[i + 2] = t[2];
      if (accento) { var k2 = Math.min(1, (b - r) / 120); e[i] = 0; e[i + 1] = 201 * k2; e[i + 2] = 183 * k2; d[i] = 0; d[i + 1] = 150; d[i + 2] = 140; }
      e[i + 3] = 255;
    }
    g.putImageData(D, 0, 0); ge.putImageData(E, 0, 0);
    function tex(cv) { var t2 = new T.CanvasTexture(cv); t2.flipY = mappa.flipY; t2.encoding = T.sRGBEncoding; t2.wrapS = mappa.wrapS; t2.wrapT = mappa.wrapT; t2.anisotropy = opz2.anisotropia || 8; return t2; }
    var rilievo = tex(cb); rilievo.encoding = T.LinearEncoding;
    return { mappa: tex(c), emissiva: tex(ce), rilievo: rilievo };
  }

  /* ── LA DEFINIZIONE: tassellazione di Phong (Boubekeur e Alexa, 2008) ──
     Ogni triangolo diventa quattro; il nuovo vertice a meta' di un lato non sta sulla corda ma sulla superficie curva
     che le normali dei due estremi descrivono (la media delle proiezioni del punto medio sui due piani tangenti, peso
     α = 0,75). Le dita, le spalle e i contorni si arrotondano invece di restare a spigoli. Le posizioni e le normali
     usate sono quelle SALDATE (cuciture della texture comprese): due copie dello stesso lato, separate da una
     cucitura, danno lo stesso punto, quindi la pelle resta chiusa. */
  function phong(P, NW, UVa, IND, chiaveDi) {
    var n = P.length / 3, nuoviP = Array.from(P), nuoviN = Array.from(NW), nuoviUV = UVa ? Array.from(UVa) : null, lati = {}, out = [], A = 0.75;
    function medio(a, b) {
      var k = a < b ? a + '_' + b : b + '_' + a; if (lati[k] !== undefined) return lati[k];
      var q = [0, 0, 0], r = [0, 0, 0], ia = chiaveDi(a), ib = chiaveDi(b);
      for (var c = 0; c < 3; c++) q[c] = (P[ia * 3 + c] + P[ib * 3 + c]) / 2;
      [ia, ib].forEach(function (v) {
        var d = (q[0] - P[v * 3]) * NW[v * 3] + (q[1] - P[v * 3 + 1]) * NW[v * 3 + 1] + (q[2] - P[v * 3 + 2]) * NW[v * 3 + 2];
        for (var c2 = 0; c2 < 3; c2++) r[c2] += (q[c2] - d * NW[v * 3 + c2]) / 2;
      });
      var id = nuoviP.length / 3;
      for (c = 0; c < 3; c++) nuoviP.push((1 - A) * q[c] + A * r[c]);
      var nn = [NW[ia * 3] + NW[ib * 3], NW[ia * 3 + 1] + NW[ib * 3 + 1], NW[ia * 3 + 2] + NW[ib * 3 + 2]], l = Math.hypot(nn[0], nn[1], nn[2]) || 1;
      nuoviN.push(nn[0] / l, nn[1] / l, nn[2] / l);
      if (nuoviUV) nuoviUV.push((UVa[a * 2] + UVa[b * 2]) / 2, (UVa[a * 2 + 1] + UVa[b * 2 + 1]) / 2);
      lati[k] = id; return id;
    }
    for (var t = 0; t < IND.length; t += 3) {
      var a = IND[t], b = IND[t + 1], c = IND[t + 2], ab = medio(a, b), bc = medio(b, c), ca = medio(c, a);
      out.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    return { P: new Float32Array(nuoviP), N: new Float32Array(nuoviN), UV: nuoviUV ? new Float32Array(nuoviUV) : null, IND: new Uint32Array(out), n0: n };
  }

  /* ── il rig ── */
  function rigga(scena, opz) {
    opz = opz || {}; var T = opz.T || globale.THREE;
    var sorgente = null; scena.updateMatrixWorld(true);
    scena.traverse(function (o) { if (o.isMesh && !o.isSkinnedMesh && (!sorgente || o.geometry.attributes.position.count > sorgente.geometry.attributes.position.count)) sorgente = o; });
    if (!sorgente) return null;
    var g0 = sorgente.geometry, pa = g0.attributes.position, n = pa.count;
    /* la geometria nel mondo, scalata all'altezza voluta, con i piedi a terra e l'asse in x = 0, z = 0 */
    var P = new Float32Array(n * 3), v = new T.Vector3(), i;
    for (i = 0; i < n; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(sorgente.matrixWorld); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
    var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (i = 0; i < n; i++) for (var a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i * 3 + a]); mx[a] = Math.max(mx[a], P[i * 3 + a]); }
    var alto = opz.altezza || 1.8, k = alto / ((mx[1] - mn[1]) || 1), cx0 = (mn[0] + mx[0]) / 2, cz0 = (mn[2] + mx[2]) / 2;
    for (i = 0; i < n; i++) { P[i * 3] = (P[i * 3] - cx0) * k; P[i * 3 + 1] = (P[i * 3 + 1] - mn[1]) * k; P[i * 3 + 2] = (P[i * 3 + 2] - cz0) * k; }
    var info = { y0: 0, h: alto, cx: 0 };
    var punti = misura(P, n, info);
    /* la definizione (opz.suddividi = livelli di tassellazione di Phong) */
    var IND0 = null, UV0 = null, NR0 = null;
    if (opz.suddividi > 0 && g0.attributes.normal) {
      IND0 = g0.index ? Array.from(g0.index.array) : Array.from({ length: n }, function (_, q) { return q; });
      UV0 = g0.attributes.uv ? new Float32Array(n * 2) : null; if (UV0) for (i = 0; i < n; i++) { UV0[i * 2] = g0.attributes.uv.getX(i); UV0[i * 2 + 1] = g0.attributes.uv.getY(i); }
      var nmS = new T.Matrix3().getNormalMatrix(sorgente.matrixWorld); NR0 = new Float32Array(n * 3);
      for (i = 0; i < n; i++) { v.fromBufferAttribute(g0.attributes.normal, i).applyMatrix3(nmS).normalize(); NR0[i * 3] = v.x; NR0[i * 3 + 1] = v.y; NR0[i * 3 + 2] = v.z; }
      for (var liv = 0; liv < Math.min(2, opz.suddividi); liv++) {
        /* saldatura per posizione: normali medie e un rappresentante per punto */
        var ch0 = {}, rp0 = new Int32Array(n), NW = new Float32Array(n * 3);
        for (i = 0; i < n; i++) { var kk = Math.round(P[i * 3] * 2e3) + ',' + Math.round(P[i * 3 + 1] * 2e3) + ',' + Math.round(P[i * 3 + 2] * 2e3); if (ch0[kk] === undefined) ch0[kk] = i; rp0[i] = ch0[kk]; }
        for (i = 0; i < n; i++) for (var c0 = 0; c0 < 3; c0++) NW[rp0[i] * 3 + c0] += NR0[i * 3 + c0];
        for (i = 0; i < n; i++) { var r0b = rp0[i], l0 = Math.hypot(NW[r0b * 3], NW[r0b * 3 + 1], NW[r0b * 3 + 2]) || 1; if (r0b === i) { NW[i * 3] /= l0; NW[i * 3 + 1] /= l0; NW[i * 3 + 2] /= l0; } }
        for (i = 0; i < n; i++) if (rp0[i] !== i) { NW[i * 3] = NW[rp0[i] * 3]; NW[i * 3 + 1] = NW[rp0[i] * 3 + 1]; NW[i * 3 + 2] = NW[rp0[i] * 3 + 2]; }
        var PH = phong(P, NW, UV0, IND0, function (q) { return rp0[q]; });
        P = PH.P; NR0 = PH.N; UV0 = PH.UV; IND0 = PH.IND; n = P.length / 3;
      }
    }
    /* i vicini (saldando i vertici coincidenti: le cuciture della texture non devono separare la pelle) */
    var ind = IND0 || (g0.index ? g0.index.array : null), chiave = {}, rap = new Int32Array(n);
    for (i = 0; i < n; i++) { var ch = Math.round(P[i * 3] * 2e3) + ',' + Math.round(P[i * 3 + 1] * 2e3) + ',' + Math.round(P[i * 3 + 2] * 2e3); if (chiave[ch] === undefined) chiave[ch] = i; rap[i] = chiave[ch]; }
    var adiac = []; for (i = 0; i < n; i++) adiac.push([]);
    var ntri = ind ? ind.length / 3 : n / 3;
    function vi(t, c) { return ind ? ind[t * 3 + c] : t * 3 + c; }
    for (var t = 0; t < ntri; t++) for (var c = 0; c < 3; c++) { var A = rap[vi(t, c)], B = rap[vi(t, (c + 1) % 3)]; if (adiac[A].indexOf(B) < 0) adiac[A].push(B); if (adiac[B].indexOf(A) < 0) adiac[B].push(A); }
    for (i = 0; i < n; i++) if (rap[i] !== i) adiac[i] = adiac[rap[i]];
    var nomi = GERARCHIA.map(function (g) { return g[0]; }).filter(pesa);
    info.uMano = punti.LeftHand[1] / alto; info.xMano = Math.abs(punti.LeftHand[0]); info.xSpalla = Math.abs(punti.LeftArm[0]);
    var NR = NR0, gn = NR0 ? null : g0.attributes.normal;
    if (gn) { NR = new Float32Array(n * 3); var nm3 = new T.Matrix3().getNormalMatrix(sorgente.matrixWorld); for (i = 0; i < n; i++) { v.fromBufferAttribute(gn, i).applyMatrix3(nm3).normalize(); NR[i * 3] = v.x; NR[i * 3 + 1] = v.y; NR[i * 3 + 2] = v.z; } }
    var SW = pesi(P, n, adiac, punti, nomi, info, NR, rap);
    /* il cappuccio (sopra il collo) e' un pezzo rigido con la testa: il foro del viso segue il volto in ogni rotazione */
    if (opz.cappuccio) { var iTesta = nomi.indexOf('Head'); for (i = 0; i < n; i++) if (P[i * 3 + 1] / alto > U.collo + 0.025) { SW.idx[i * 4] = iTesta; SW.wt[i * 4] = 1; for (c = 1; c < 4; c++) { SW.idx[i * 4 + c] = 0; SW.wt[i * 4 + c] = 0; } } }
    /* i vertici saldati hanno gli stessi pesi */
    for (i = 0; i < n; i++) if (rap[i] !== i) for (c = 0; c < 4; c++) { SW.idx[i * 4 + c] = SW.idx[rap[i] * 4 + c]; SW.wt[i * 4 + c] = SW.wt[rap[i] * 4 + c]; }
    /* la testa via: i triangoli sopra il collo (col cappuccio si tiene la parte dietro, che fa da cornice al volto) */
    /* il cappuccio si allarga (in modo graduale dal colletto in su: nessun gradino) quanto basta ad avvolgere il volto
       che va al suo posto; davanti resta un'apertura che lascia vedere solo il viso */
    var hz = punti.Head[2], gonfia = opz.cappuccio && opz.gonfia ? opz.gonfia : 1;
    if (gonfia !== 1) {
      var u0 = U.collo - 0.01, u1 = U.collo + 0.05, hy = punti.Head[1];
      for (i = 0; i < n; i++) {
        var uu2 = P[i * 3 + 1] / alto; if (uu2 <= u0) continue;
        var f = Math.min(1, (uu2 - u0) / (u1 - u0)); f = f * f * (3 - 2 * f); var g = 1 + (gonfia - 1) * f;
        P[i * 3] *= g; P[i * 3 + 2] = hz + (P[i * 3 + 2] - hz) * g;
        if (P[i * 3 + 1] > hy) P[i * 3 + 1] = hy + (P[i * 3 + 1] - hy) * (1 + (g - 1) * 0.25);   /* in altezza poco: la cupola resta bassa sulla fronte */
      }
    }
    /* LA TESTA PIU' GRANDE (opz.testa = fattore): cappuccio e colletto alto si ingrandiscono attorno al collo, con la
       stessa transizione morbida dal colletto (le spalle non cambiano); l'apertura del viso si ingrandisce con loro */
    var st = opz.cappuccio && opz.testa ? opz.testa : 1, perno = { y: (U.collo - 0.01) * alto };
    if (st !== 1) {
      var v0 = U.collo - 0.02, v1 = U.collo + 0.03;
      for (i = 0; i < n; i++) {
        var uu3 = P[i * 3 + 1] / alto; if (uu3 <= v0) continue;
        var f3 = Math.min(1, (uu3 - v0) / (v1 - v0)); f3 = f3 * f3 * (3 - 2 * f3); var g3 = 1 + (st - 1) * f3;
        P[i * 3] *= g3; P[i * 3 + 1] = perno.y + (P[i * 3 + 1] - perno.y) * g3; P[i * 3 + 2] = hz + (P[i * 3 + 2] - hz) * g3;
      }
      if (opz.viso) opz.viso = { y: perno.y + (opz.viso.y - perno.y) * st, ax: opz.viso.ax * st, ay: opz.viso.ay * st };
    }
    /* NIENTE VISIERA NERA (opz.visiera === false): il casco sotto il cappuccio e' un pezzo di texture a se' (un'«isola»
       UV: triangoli collegati dagli indici, senza saldare le cuciture). Si riconosce perche' sta tutto sopra il collo e
       davanti all'asse della testa; il tessuto del cappuccio invece scende sulle spalle e gira dietro. Non si toglie
       (resterebbero buchi e bordi a scalini): diventa OMBRA, opaca e senza riflessi, come l'interno di un cappuccio. */
    var visiera = null;
    if (opz.visiera === false && ind) {
      var pi = Int32Array.from({ length: n }, function (_, k) { return k; });
      var fi = function (x) { while (pi[x] !== x) { pi[x] = pi[pi[x]]; x = pi[x]; } return x; };
      for (t = 0; t < ntri; t++) for (c = 1; c < 3; c++) { var ra = fi(ind[t * 3]), rb = fi(ind[t * 3 + c]); if (ra !== rb) pi[ra] = rb; }
      var isole = {};
      for (i = 0; i < n; i++) { var r0 = fi(i), o0 = isole[r0] || (isole[r0] = { n: 0, sopra: 0, z: 0 }); o0.n++; if (P[i * 3 + 1] > (U.collo - 0.03) * alto) o0.sopra++; o0.z += P[i * 3 + 2]; }
      visiera = {}; Object.keys(isole).forEach(function (k) { var o = isole[k]; if (o.n > 50 && o.sopra / o.n > 0.9 && o.z / o.n > punti.Head[2]) visiera[k] = 1; });
      var vfi = fi; visiera.di = function (k) { return visiera[vfi(k)]; };
    }
    var nuovoInd = [], tolti = 0, taglio = (U.collo + 0.012) * alto, apertura = (opz.apertura || 75) * Math.PI / 180;
    for (t = 0; t < ntri; t++) {
      var a0 = vi(t, 0), a1 = vi(t, 1), a2 = vi(t, 2);
      /* il vertice piu' alto, non il baricentro: niente triangoli a punta che sporgono dal colletto */
      var cy = Math.max(P[a0 * 3 + 1], P[a1 * 3 + 1], P[a2 * 3 + 1]);
      var cxt = (P[a0 * 3] + P[a1 * 3] + P[a2 * 3]) / 3, czt = (P[a0 * 3 + 2] + P[a1 * 3 + 2] + P[a2 * 3 + 2]) / 3;
      /* col cappuccio si toglie solo il davanti (il casco, la visiera): fianchi, nuca e sommita' restano e incorniciano il volto */
      var davanti = Math.abs(Math.atan2(cxt, czt - (hz - 0.01 * alto))) < apertura;
      /* con la sagoma del viso (opz.viso = { y, ax, ay }, in metri) non si toglie nessun triangolo: si apre un'ellisse
         davanti, poco piu' piccola del viso che ci va. Il bordo del cappuccio si sovrappone al contorno del viso (nessuna
         fessura) e l'interno del casco, rimasto dietro, fa da fodera scura: della testa si vede solo il viso */
      if (opz.viso) davanti = false;   /* il foro si fa nello shader, al pixel (vedi sotto): un'ellisse liscia, non a scalini di triangoli */
      if (opz.togliTesta !== false && (opz.viso ? davanti : cy > taglio && (!opz.cappuccio || davanti))) { tolti++; continue; }
      nuovoInd.push(a0, a1, a2);
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3));
    if (UV0) geo.setAttribute('uv', new T.BufferAttribute(UV0, 2)); else if (g0.attributes.uv) geo.setAttribute('uv', g0.attributes.uv.clone());
    geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(SW.idx, 4));
    geo.setAttribute('skinWeight', new T.Float32BufferAttribute(SW.wt, 4));
    if (visiera) { var om = new Float32Array(n); for (i = 0; i < n; i++) om[i] = visiera.di(i) ? 1 : 0; geo.setAttribute('aOmbra', new T.BufferAttribute(om, 1)); }
    geo.setIndex(nuovoInd); geo.computeVertexNormals();
    /* le normali calcolate si saldano: niente spigoli finti lungo le cuciture della texture */
    var no = geo.attributes.normal, acc = {};
    for (i = 0; i < n; i++) { var r = rap[i], s0 = acc[r] || (acc[r] = [0, 0, 0]); s0[0] += no.getX(i); s0[1] += no.getY(i); s0[2] += no.getZ(i); }
    for (i = 0; i < n; i++) { var s1 = acc[rap[i]], ln = Math.hypot(s1[0], s1[1], s1[2]) || 1; no.setXYZ(i, s1[0] / ln, s1[1] / ln, s1[2] / ln); }
    /* lo scheletro */
    var ossa = {}, lista = [], radice = new T.Group(); radice.name = 'SpectraCorpo';
    GERARCHIA.forEach(function (gg) {
      var o = new T.Bone(); o.name = gg[0]; ossa[gg[0]] = o; var p = punti[gg[0]], q = gg[1] ? punti[gg[1]] : [0, 0, 0];
      o.position.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
      (gg[1] ? ossa[gg[1]] : radice).add(o);
    });
    nomi.forEach(function (nm) { lista.push(ossa[nm]); });
    /* le punte vanno nello scheletro (senza peso) dopo le ossa che pesano: gli indici dei pesi restano validi */
    GERARCHIA.forEach(function (gg) { if (!pesa(gg[0])) lista.push(ossa[gg[0]]); });
    var mat0 = Array.isArray(sorgente.material) ? sorgente.material[0] : sorgente.material, mappa = mat0 && mat0.map;
    var mat = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.45, roughness: 0.5, envMapIntensity: 0.55, skinning: true });
    var col = opz.ricolora !== false && mappa ? ricolora(mappa, T, { anisotropia: opz.anisotropia }) : null;
    if (col) { mat.map = col.mappa; mat.emissiveMap = col.emissiva; mat.emissive = new T.Color(0xffffff); mat.emissiveIntensity = 1.1; if (col.rilievo) { mat.bumpMap = col.rilievo; mat.bumpScale = opz.rilievo != null ? opz.rilievo : 0.016; } }
    else if (mappa) mat.map = mappa; else mat.color.set(0x1a3050);
    if (opz.viso) {
      /* IL FORO PER IL VISO, al pixel: lo shader conosce la posizione di ogni punto della pelle PRIMA dello scheletro
         (cioe' nella posa di riposo), quindi l'ellisse segue la testa in ogni movimento e il bordo e' liscio */
      var V = opz.viso; mat.side = T.DoubleSide;   /* dal foro si vede l'interno del casco, non il vuoto */
      mat.onBeforeCompile = function (sh) {
        sh.uniforms.uViso = { value: new T.Vector4(V.y, V.ax, V.ay, hz) };
        var conOmbra = !!geo.attributes.aOmbra;
        sh.vertexShader = 'varying vec3 vRig;\n' + (conOmbra ? 'attribute float aOmbra;\nvarying float vOmbra;\n' : '') + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRig = position;' + (conOmbra ? ' vOmbra = aOmbra;' : ''));
        sh.fragmentShader = 'uniform vec4 uViso;\nvarying vec3 vRig;\n' + (conOmbra ? 'varying float vOmbra;\n' : '') + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  { vec2 e = vec2(vRig.x / uViso.y, (vRig.y - uViso.x) / uViso.z); if (vRig.z > uViso.w && dot(e, e) < 1.0) discard; }').replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  if (!gl_FrontFacing) gl_FragColor.rgb *= 0.06;' + (conOmbra ? '\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.2 + vec3(0.006, 0.010, 0.022), vOmbra);' : ''));   /* l\'interno del casco: ombra, senza riflessi */
      };
      mat.customProgramCacheKey = function () { return 'bsi-rig-viso-' + [V.y, V.ax, V.ay, hz, !!geo.attributes.aOmbra].join('|'); };
    }
    var mesh = new T.SkinnedMesh(geo, mat); mesh.name = 'SpectraCorpo_Pelle'; mesh.frustumCulled = false;
    radice.add(mesh); radice.updateMatrixWorld(true);
    mesh.bind(new T.Skeleton(lista), mesh.matrixWorld);
    return { radice: radice, mesh: mesh, ossa: ossa, punti: punti, tolti: tolti, ricolorata: !!col, vertici: n };
  }

  globale.BSISpectraRig = { rigga: rigga, misura: misura, ricolora: ricolora, GERARCHIA: GERARCHIA, CANONE: U };
})(typeof window !== 'undefined' ? window : this);
