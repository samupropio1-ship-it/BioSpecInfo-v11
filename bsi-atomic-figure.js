/* ═══════════════════════════════════════════════════════════════════════════
   bsi-atomic-figure.js — le figure di ATOMIC PROTOCOL
   BioSpecInfo · © Samuele Pio Provenzano

   IL PROTAGONISTA, I RESIDUI, I DIECI GUARDIANI — QUALITA' PS2

   Il riferimento e' la generazione PlayStation 2 nei suoi titoli piu'
   curati — Metal Gear Solid 2, Final Fantasy X, Resident Evil 4 — e quello
   che la separava dalla precedente si puo' dire in poche voci, ognuna fatta
   qui:

     · figure con migliaia di poligoni e SUPERFICI LISCE, non segmenti;
     · gli OCCHI MODELLATI — bulbo, iride, palpebra — invece che dipinti, e il
       viso dipinto con sfumature morbide, senza contorni (i contorni sono
       quello che fa sembrare un volto un cartone animato);
     · le MANI CON LE DITA, i vestiti con colletti, revers, tasche e bottoni
       veri;
     · texture ad alta risoluzione con MAPPE DI RILIEVO: le pieghe del camice
       e le giunture dei pannelli si vedono con la luce, non sono disegnate;
     · il BAGLIORE attorno a luci, schermi e nuclei: sprite additivi, lo
       stesso trucco di quegli anni, che costa quasi niente anche su un
       telefono.

   I guardiani non sono mostri: sono le MACCHINE dell'istituto andate fuori
   controllo — una pompa con i bracci idraulici, un estrusore, un banco
   laser, un robot sequenziatore, una cella elettrolitica, un criostato, il
   robot della farmacia, una cella calda, un chiarificatore, il reattore.
   Seri, credibili, e minacciosi come lo e' un macchinario industriale che
   non risponde piu' ai comandi.

   Il modulo non crea niente da solo: `bsi-atomic-grafica.js` lo chiama e gli
   passa i suoi strumenti, e lui aggiunge `chimico`, `residuo`, `guardiano`
   e `alone`. In stile PS1 (a scelta) le stesse figure si costruiscono con
   meno segmenti e texture piccole senza filtro.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function installa(api, T, c) {
    var PS1 = c.PS1, ALTA = c.ALTA, M = c.M;
    var mat = c.mat, hash = c.hash, rumore = c.rumore, fbm = c.fbm, tonda = c.tonda;
    var cache = {};
    /* quanti segmenti: pieni in alta, meno in media, pochi in PS1 */
    function sg(n) { return PS1 ? Math.max(4, Math.round(n / 2.6)) : (ALTA ? n : Math.max(6, Math.round(n * 0.65))); }
    var SCALA = ALTA ? 4 : 2;                    /* risoluzione delle texture */

    /* ═════════════════════════════════════════════════════════════════════
       STRUMENTI: texture dipinte, mappe di rilievo, geometrie
       ═════════════════════════════════════════════════════════════════════ */
    function cl(v) { return v < 0 ? 0 : (v > 255 ? 255 : v); }
    function nuovaTela(w, h) {
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      return cv;
    }
    function texDa(cv, colore) {
      var t = new T.CanvasTexture(cv);
      if (colore) t.encoding = T.sRGBEncoding;
      t.wrapS = t.wrapT = T.RepeatWrapping;
      if (PS1) { t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; }
      else t.anisotropy = 8;
      return t;
    }

    /* una texture si descrive con: il colore di ogni pixel (u, v in 0..1),
       i tratti a pennello, e — se c'e' — l'altezza, da cui esce la mappa di
       rilievo. La risoluzione e' logica (w×h) moltiplicata per SCALA: la
       stessa descrizione da' 128 px in PS1 e 512 in alta */
    function pittura(nome, w, h, pixel, pennello, altezza, forza) {
      if (cache[nome]) return cache[nome];
      var W = PS1 ? Math.min(128, w) : Math.round(w * SCALA);
      var H = Math.round(h * W / w);
      var cv = nuovaTela(W, H), q = cv.getContext('2d');
      var img = q.createImageData(W, H), alt = (altezza && !PS1) ? new Float32Array(W * H) : null;
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var u = x / W, v = y / H;
          var p = pixel(u, v, x, y, W, H);
          var k = (y * W + x) * 4;
          img.data[k] = cl(p[0]); img.data[k + 1] = cl(p[1]); img.data[k + 2] = cl(p[2]);
          img.data[k + 3] = p[3] == null ? 255 : p[3];
          if (alt) alt[y * W + x] = altezza(u, v, x, y);
        }
      }
      q.putImageData(img, 0, 0);
      if (pennello) { q.save(); q.scale(W / w, H / h); pennello(q, w, h); q.restore(); }
      var out = { map: texDa(cv, true), W: W, H: H };
      if (alt) out.normalMap = texDa(normali(alt, W, H, forza || 2), false);
      cache[nome] = out;
      return out;
    }
    function normali(alt, W, H, forza) {
      var cv = nuovaTela(W, H), q = cv.getContext('2d'), img = q.createImageData(W, H);
      function h(x, y) { return alt[((y + H) % H) * W + ((x + W) % W)]; }
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1)) - (h(x - 1, y - 1) + 2 * h(x - 1, y) + h(x - 1, y + 1));
          var dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1)) - (h(x - 1, y - 1) + 2 * h(x, y - 1) + h(x + 1, y - 1));
          var nx = -dx * forza, ny = -dy * forza, l = Math.sqrt(nx * nx + ny * ny + 1), k = (y * W + x) * 4;
          img.data[k] = (nx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (ny / l * 0.5 + 0.5) * 255;
          img.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
        }
      }
      q.putImageData(img, 0, 0);
      return cv;
    }
    function materiale(t, p) {
      p = p || {};
      p.map = t.map;
      if (t.normalMap) p.normalMap = t.normalMap;
      var mm = mat(p);
      if (t.normalMap && mm.normalScale && p.rilievo) mm.normalScale.set(p.rilievo, p.rilievo);
      return mm;
    }

    /* normali lisce su una geometria qualunque (anche a facce separate) */
    function lisce(geo) {
      if (geo.index) geo = geo.toNonIndexed();
      geo.computeVertexNormals();
      var p = geo.attributes.position, n = geo.attributes.normal, somma = {}, i, ch;
      for (i = 0; i < p.count; i++) {
        ch = Math.round(p.getX(i) * 1e4) + '|' + Math.round(p.getY(i) * 1e4) + '|' + Math.round(p.getZ(i) * 1e4);
        var s = somma[ch] || (somma[ch] = [0, 0, 0]);
        s[0] += n.getX(i); s[1] += n.getY(i); s[2] += n.getZ(i);
      }
      for (i = 0; i < p.count; i++) {
        ch = Math.round(p.getX(i) * 1e4) + '|' + Math.round(p.getY(i) * 1e4) + '|' + Math.round(p.getZ(i) * 1e4);
        var v = somma[ch], l = Math.hypot(v[0], v[1], v[2]) || 1;
        n.setXYZ(i, v[0] / l, v[1] / l, v[2] / l);
      }
      n.needsUpdate = true;
      return geo;
    }

    function m(geo, materiale2, x, y, z, ombre) {
      var o = new T.Mesh(geo, materiale2);
      o.position.set(x || 0, y || 0, z || 0);
      if (ombre !== false && !PS1) { o.castShadow = true; o.receiveShadow = true; }
      return o;
    }
    /* come m(), ma ruotata: per i pezzi che vanno messi di traverso */
    function mr(geo, materiale2, x, y, z, rx, ry, rz) {
      var o = m(geo, materiale2, x, y, z);
      o.rotation.set(rx || 0, ry || 0, rz || 0);
      return o;
    }
    function V2(a) { return a.map(function (q) { return new T.Vector2(q[0], q[1]); }); }
    function lathe(prof, seg, a0, a1) { return new T.LatheGeometry(V2(prof), sg(seg), a0 || 0, a1 || Math.PI * 2); }
    function cil(r1, r2, h, seg, aperto) { return new T.CylinderGeometry(r1, r2, h, sg(seg), 1, !!aperto); }
    function sfera(r, a, b) { return new T.SphereGeometry(r, sg(a || 24), sg(b || 16)); }
    function capsula(r, l) { return api.capsula(r, l, sg(16)); }
    function V3(q) { return new T.Vector3(q[0], q[1], q[2]); }

    /* il bagliore: uno sprite additivo con un gradiente radiale. Si mette
       davanti a ogni cosa che emette luce. E' il «bloom» della PS2 */
    function alone(colore, dim, intensita) {
      var t = cache.alone;
      if (!t) {
        var cv = nuovaTela(64, 64), q = cv.getContext('2d');
        var g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.22, 'rgba(255,255,255,.55)');
        g.addColorStop(0.55, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        q.fillStyle = g; q.fillRect(0, 0, 64, 64);
        t = cache.alone = new T.CanvasTexture(cv);
      }
      var sp = new T.Sprite(new T.SpriteMaterial({ map: t, color: colore, transparent: true, depthWrite: false,
        blending: T.AdditiveBlending, opacity: intensita == null ? 0.8 : intensita, toneMapped: false }));
      sp.scale.set(dim, dim, dim);
      sp.renderOrder = 5;
      sp.userData.alone = true;
      return sp;
    }

    /* l'ombra a contatto: un disco scuro sfumato sotto i piedi, che tiene la
       figura sul pavimento anche dove l'ombra vera non arriva */
    function ombraContatto(r) {
      var t = cache.ombra;
      if (!t) {
        var cv = nuovaTela(64, 64), q = cv.getContext('2d');
        var g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(0.6, 'rgba(0,0,0,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        q.fillStyle = g; q.fillRect(0, 0, 64, 64);
        t = cache.ombra = new T.CanvasTexture(cv);
      }
      var o = new T.Mesh(new T.CircleGeometry(r, 24), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false,
        opacity: ALTA ? 0.5 : 0.85 }));
      o.rotation.x = -Math.PI / 2;
      o.position.y = 0.012;
      o.renderOrder = 1;
      return o;
    }

    /* ═════════════════════════════════════════════════════════════════════
       IL PROTAGONISTA

       Un metro e settantotto con le proporzioni di un adulto: bacino a 95
       cm, spalle a 1,43 m, testa un ottavo dell'altezza. La testa e' una
       sfera fitta deformata a mano — cranio, fronte, arcate, zigomi, naso
       con le ali, labbra, mento, mandibola — con gli occhi veri dentro le
       orbite e le palpebre sopra. Il viso e' dipinto a sfumature: pelle,
       rossore su guance e naso, ombra delle orbite, sopracciglia fatte di
       peli, la barba appena rasata. Nessun contorno.
       ═════════════════════════════════════════════════════════════════════ */
    var PELLE = [214, 168, 138];

    function texViso() {
      /* due proiezioni piane: la meta' sinistra e' la faccia vista di fronte,
         la destra la nuca. Qui c'e' solo la pelle: occhi, capelli e orecchie
         sono geometria */
      return pittura('visoPS2', 256, 128, function (u, v, x, y) {
        var fronte = u < 0.5;
        var X = fronte ? (u / 0.5) * 2 - 1 : -((u - 0.5) / 0.5 * 2 - 1);
        var Y = 1 - v * 2;
        var gr = (fbm(u * 60, v * 30, 3, 5) - 0.5) * 10 + (hash(x, y, 6) - 0.5) * 4;
        var r = PELLE[0] + gr, g = PELLE[1] + gr * 0.9, b = PELLE[2] + gr * 0.85;
        if (fronte) {
          var guance = Math.max(0, 1 - Math.hypot(Math.abs(X) - 0.42, Y + 0.15) / 0.3);
          var naso = Math.max(0, 1 - Math.hypot(X, Y + 0.24) / 0.14);
          var labbra = Math.max(0, 1 - Math.hypot(X / 0.19, (Y + 0.52) / 0.055));
          var fessura = Math.max(0, 1 - Math.hypot(X / 0.2, (Y + 0.505) / 0.02));
          r += guance * 5 + naso * 4 + labbra * 6; g -= guance * 2 + naso * 2 + labbra * 18; b -= labbra * 12;
          /* il modellato dipinto: ombra delle orbite, sotto gli zigomi, ai
             lati del naso, sotto il labbro e sotto la mandibola; luce sulla
             fronte, sul dorso del naso, sul mento */
          var orb = Math.max(0, 1 - Math.hypot(Math.abs(X) - 0.36, (Y - 0.1) * 1.5) / 0.27);
          var sottoZig = Math.max(0, 1 - Math.hypot(Math.abs(X) - 0.56, (Y + 0.34) * 1.6) / 0.16);
          var latoNaso = Math.max(0, 1 - Math.hypot(Math.abs(X) - 0.13, (Y + 0.2) * 1.3) / 0.07);
          var sottoLab = Math.max(0, 1 - Math.hypot(X / 0.18, (Y + 0.62) / 0.04));
          var luce = Math.max(0, 1 - Math.hypot(X / 0.5, (Y - 0.45) / 0.3)) * 0.06 +
                     Math.max(0, 1 - Math.hypot(X / 0.05, (Y + 0.1) / 0.25)) * 0.05 +
                     Math.max(0, 1 - Math.hypot(X / 0.15, (Y + 0.78) / 0.08)) * 0.04;
          var sottoNaso = Math.max(0, 1 - Math.hypot(X / 0.12, (Y + 0.37) / 0.035));
          var k = 1 - orb * 0.24 - sottoZig * 0.06 - latoNaso * 0.06 - sottoNaso * 0.18 - sottoLab * 0.14 - fessura * 0.55 -
                  Math.max(0, -0.66 - Y) * 0.7 - Math.max(0, Math.abs(X) - 0.55) * 0.42 + luce * 1.6;
          r *= k; g *= k; b *= k;
          /* la barba appena rasata: un velo che sfuma, senza bordo */
          var barba = Math.min(1, Math.max(0, (-0.3 - Y) / 0.12)) * Math.min(1, Math.max(0, (0.8 - Math.abs(X)) / 0.15)) *
                      (1 - Math.min(1, labbra * 3));
          if (barba > 0) { var bb = 1 - barba * (0.03 + hash(x, y, 7) * 0.03); r *= bb; g *= bb * 0.995; b *= bb * 1.005; }
        } else if (Y < -0.6) { r *= 0.93; g *= 0.93; b *= 0.93; }
        return [r, g, b];
      }, function (q) {
        /* le sopracciglia: tanti peli corti, non una linea */
        function F(X, Y) { return [(X * 0.5 + 0.5) * 128, (0.5 - Y * 0.5) * 128]; }
        [-1, 1].forEach(function (l) {
          for (var i = 0; i < 150; i++) {
            var t = hash(i, l + 2, 11);
            var X = l * (0.14 + t * 0.4), Y = 0.27 + Math.sin(t * 2.6) * 0.04 - t * 0.02;
            var a = F(X, Y + (hash(i, 3, 12) - 0.5) * 0.045 * (1 - t * 0.5));
            q.strokeStyle = 'rgba(46,32,24,' + (0.45 + hash(i, 4, 13) * 0.4) + ')';
            q.lineWidth = 0.85;
            q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(a[0] + l * 2.3, a[1] - 0.6); q.stroke();
          }
        });
      });
    }
    function texCapelli() {
      return pittura('capelliPS2', 128, 64, function (u, v, x, y) {
        /* le ciocche corrono dalla fronte verso la nuca, morbide */
        var ciocca = fbm(u * 70, v * 5, 3, 21), fine = fbm(u * 220, v * 12, 2, 22);
        var cc = 38 + ciocca * 24 + fine * 12;
        return [cc * 1.08, cc * 0.84, cc * 0.68];
      }, null, function (u, v) { return fbm(u * 70, v * 5, 3, 21) * 0.7 + fbm(u * 220, v * 12, 2, 22) * 0.3; }, 1.5);
    }
    function texOcchio() {
      return pittura('occhioPS2', 128, 64, function (u, v) {
        var dx = (u - 0.5) * 4, dy = (v - 0.5) * 2, d = Math.hypot(dx, dy);
        var a = Math.atan2(dy, dx);
        if (d < 0.13) return [10, 8, 7];
        if (d < 0.34) {
          var raggi = 0.75 + 0.25 * Math.sin(a * 36 + fbm(u * 10, v * 10, 2, 31) * 6);
          return [92 * raggi + (0.34 - d) * 90, 64 * raggi + (0.34 - d) * 50, 40 * raggi];
        }
        if (d < 0.38) return [48, 38, 32];
        var vena = Math.abs(fbm(u * 8, v * 8, 2, 32) - 0.5) < 0.01 ? 30 : 0;
        return [236 - vena * 0.3, 228 - vena, 220 - vena];
      });
    }

    /* la testa: una sfera fitta, deformata a mano, con le proiezioni piane */
    function testaGeo(R) {
      var geo = new T.SphereGeometry(R, sg(48), sg(36)).toNonIndexed();
      var p = geo.attributes.position, uv = geo.attributes.uv, orig = p.array.slice(0);
      function campana(d) { return d > 1 ? 0 : 0.5 + 0.5 * Math.cos(d * Math.PI); }
      for (var i = 0; i < p.count; i++) {
        var x = orig[i * 3] / R, y = orig[i * 3 + 1] / R, z = orig[i * 3 + 2] / R;
        var fz = Math.max(0, z);
        var nx = x * 0.82, ny = y * 1.2, nz = z * 0.97;
        if (y < -0.2) nx *= 1 - Math.pow((-y - 0.2) / 0.8, 1.4) * 0.26;
        nz += campana(Math.hypot(x / 0.35, (y + 0.82) / 0.2)) * 0.06 * fz;
        nz += campana(Math.hypot(x / 0.7, (y - 0.22) / 0.1)) * 0.04 * fz;
        [-1, 1].forEach(function (l) {
          nz -= campana(Math.hypot((x - l * 0.37) / 0.2, (y - 0.08) / 0.13)) * 0.09 * fz;
          var zg = campana(Math.hypot((x - l * 0.55) / 0.22, (y + 0.06) / 0.16)) * fz;
          nx += l * zg * 0.03; nz += zg * 0.025;
          nz += campana(Math.hypot((x - l * 0.1) / 0.07, (y + 0.33) / 0.06)) * 0.035 * fz;
        });
        var dorso = campana(Math.abs(x) / 0.09) * (y < 0.08 && y > -0.36 ? (0.08 - y) / 0.44 : 0);
        nz += dorso * 0.19 * fz;
        nz += campana(Math.hypot(x / 0.12, (y + 0.3) / 0.09)) * 0.06 * fz;
        nz += campana(Math.hypot(x / 0.22, (y + 0.5) / 0.05)) * 0.035 * fz;
        nz += campana(Math.hypot(x / 0.2, (y + 0.56) / 0.04)) * 0.025 * fz;
        nz -= campana(Math.hypot(x / 0.22, (y + 0.66) / 0.05)) * 0.02 * fz;
        if (z < -0.1 && y > -0.2) nz *= 1.07;
        p.setXYZ(i, nx * R, ny * R, nz * R);
      }
      for (var t = 0; t < p.count; t += 3) {
        var zc = (orig[t * 3 + 2] + orig[t * 3 + 5] + orig[t * 3 + 8]) / 3;
        for (var j = 0; j < 3; j++) {
          var X = orig[(t + j) * 3] / R, Y = orig[(t + j) * 3 + 1] / R;
          uv.setXY(t + j, zc >= 0 ? 0.25 + X * 0.25 : 0.75 - X * 0.25, 0.5 + Y * 0.5);
        }
      }
      return lisce(geo);
    }

    /* i capelli: una calotta che segue il cranio; davanti l'attaccatura e'
       alta, sulle tempie e dietro scende */
    function capelliGeo(R) {
      var geo = new T.SphereGeometry(R, sg(40), sg(20), 0, Math.PI * 2, 0, Math.PI * 0.62);
      var p = geo.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        var phi = Math.atan2(x, z);
        var th = Math.acos(Math.max(-1, Math.min(1, y / R)));
        var avanti = Math.max(0, Math.cos(phi));
        var limite = Math.PI * (0.6 - avanti * 0.3);
        var tt = th / (Math.PI * 0.62);
        var th2 = tt * limite;
        var r = R * (1.04 + 0.025 * (1 - tt));
        var sx = Math.sin(th2);
        var nz2 = Math.cos(phi) * sx * r * 0.98;
        if (Math.cos(phi) < 0) nz2 *= 1.08;
        p.setXYZ(i, Math.sin(phi) * sx * r * 0.84, Math.cos(th2) * r * 1.2, nz2);
      }
      return lisce(geo);
    }

    function texCamice(nome, w, h, dettagli) {
      return pittura(nome, w, h, function (u, v, x, y) {
        var gr = (fbm(u * 80, v * 80, 2, 41) - 0.5) * 6 + (hash(x, y, 42) - 0.5) * 3;
        var pg = fbm(u * 7 + Math.sin(v * 6) * 0.15, v * 1.4, 3, 43);
        var piega = Math.pow(Math.abs(pg - 0.5) * 2, 2) * 16;
        var basso = Math.max(0, v - 0.86) * 36;
        return [232 + gr - piega - basso, 234 + gr - piega - basso, 231 + gr - piega - basso];
      }, dettagli, function (u, v) {
        var pg = fbm(u * 7 + Math.sin(v * 6) * 0.15, v * 1.4, 3, 43);
        return Math.pow(Math.abs(pg - 0.5) * 2, 2) * 0.9 + fbm(u * 80, v * 80, 2, 41) * 0.06;
      }, 4);
    }
    function texPantaloni() {
      return pittura('pantaloniPS2', 128, 128, function (u, v, x, y) {
        var tw = ((x + y) % 4 < 2) ? -3 : 3;
        var gr = (fbm(u * 30, v * 30, 2, 61) - 0.5) * 8;
        var piega = Math.exp(-Math.pow((((u * 2) % 1) - 0.5) / 0.02, 2)) * -12;
        return [60 + gr + tw + piega, 64 + gr + tw + piega, 72 + gr + tw + piega];
      }, null, function (u, v, x, y) {
        return ((x + y) % 4 < 2 ? 0.08 : 0) + Math.exp(-Math.pow((((u * 2) % 1) - 0.5) / 0.02, 2)) * 0.5 +
               fbm(u * 6, v * 2, 3, 62) * 0.5;
      }, 2);
    }
    function texPelle(nome, base, seme, liscia) {
      return pittura(nome, 64, 64, function (u, v) {
        var gr = (fbm(u * 20, v * 20, 3, seme) - 0.5) * 10;
        return [base[0] + gr, base[1] + gr, base[2] + gr];
      }, null, function (u, v) { return fbm(u * 30, v * 30, 3, seme) * (liscia ? 0.25 : 1); }, 1.2);
    }

    function chimico() {
      var MV = {
        viso: materiale(texViso(), { roughness: 0.52 }),
        pelle: mat({ color: 0xd0a68e, roughness: 0.52 }),
        capelli: materiale(texCapelli(), { roughness: 0.65, rilievo: 0.8 }),
        occhio: mat({ map: texOcchio().map, roughness: 0.06, env: 1.2 }),
        busto: materiale(texCamice('camiceBustoPS2', 128, 128), { roughness: 0.82, rilievo: 0.6 }),
        falda: materiale(texCamice('camiceFaldaPS2', 128, 64), { roughness: 0.82, rilievo: 0.6, side: T.DoubleSide }),
        manica: materiale(texCamice('manicaPS2', 64, 64), { roughness: 0.82, rilievo: 0.6 }),
        pantaloni: materiale(texPantaloni(), { roughness: 0.88, rilievo: 0.5 }),
        guanti: materiale(texPelle('nitrile', [76, 130, 198], 81, true), { roughness: 0.36 }),
        scarpe: materiale(texPelle('cuoio', [38, 34, 32], 82), { roughness: 0.55, metalness: 0.0 }),
        suola: mat({ color: 0x2e2c2a, roughness: 0.8 }),
        camicia: mat({ color: 0xb0c6da, roughness: 0.72 }),
        cravatta: mat({ color: 0x2a3550, roughness: 0.5 }),
        bottone: mat({ color: 0xf2f0ea, roughness: 0.3 }),
        cintura: mat({ color: 0x26201c, roughness: 0.45 }),
        fibbia: mat({ color: 0xb0b4b8, roughness: 0.22, metalness: 0.9 }),
        montatura: mat({ color: 0x29323a, roughness: 0.35 }),
        lente: mat({ vetro: true, color: 0xe0f2ff }),
        badge: mat({ color: 0xf0eeea, roughness: 0.3 }),
        penna: mat({ color: 0x1e3c8a, roughness: 0.25 }),
        metallo: mat({ color: 0xc0c4c8, roughness: 0.2, metalness: 1 })
      };
      var g = new T.Group();
      var bacino = new T.Group();
      bacino.position.y = 0.95;
      g.add(bacino);

      /* il bacino nei pantaloni, la cintura con la fibbia */
      var fianchi = m(lisce(lathe([[0, -0.15], [0.12, -0.15], [0.15, -0.09], [0.158, 0.0], [0.153, 0.06], [0, 0.07]], 28)), MV.pantaloni);
      fianchi.scale.set(1, 1, 0.68);
      bacino.add(fianchi);
      var cint = m(cil(0.161, 0.161, 0.038, 32, true), MV.cintura, 0, 0.035, 0);
      cint.scale.z = 0.7;
      bacino.add(cint);
      bacino.add(m(tonda(0.05, 0.034, 0.012, 0.004), MV.fibbia, 0, 0.035, 0.113));

      /* le falde del camice: due pannelli appesi ai fianchi, aperti davanti,
         ognuno con la sua tasca */
      var falde = {};
      [-1, 1].forEach(function (l) {
        var pv = new T.Group();
        pv.position.y = 0.045;
        var prof = [];
        for (var i = 0; i <= 10; i++) {
          var t = i / 10;
          prof.push([0.17 + t * 0.075 + Math.sin(t * 3) * 0.006, -t * 0.52]);
        }
        prof.reverse();
        var start = l < 0 ? Math.PI : 0.3, len = Math.PI - 0.3;
        var falda = m(lisce(lathe(prof, 20, start, len)), MV.falda);
        falda.scale.z = 0.72;
        pv.add(falda);
        var tasca = mr(tonda(0.13, 0.14, 0.012, 0.004), MV.falda, l * 0.17, -0.15, 0.1, 0.06, l * 0.62, 0);
        pv.add(tasca);
        bacino.add(pv);
        falde[l < 0 ? 'sx' : 'dx'] = pv;
      });

      /* il busto: un torace a sezione ellittica, con il camice chiuso */
      var busto = new T.Group();
      busto.position.y = 0.045;
      bacino.add(busto);
      var torace = m(lisce(lathe([[0.156, 0.0], [0.16, 0.1], [0.172, 0.2], [0.188, 0.3], [0.193, 0.37], [0.182, 0.43],
                                  [0.13, 0.475], [0.065, 0.495], [0.05, 0.5]], 36, Math.PI, Math.PI * 2)), MV.busto);
      torace.scale.z = 0.64;
      busto.add(torace);
      /* lo scollo: camicia, colletto e cravatta; i revers modellati */
      var scollo = m(lisce(lathe([[0.0, 0.33], [0.05, 0.36], [0.07, 0.44], [0.066, 0.5]], 16, -0.5, 1.0)), MV.camicia, 0, 0, 0.012);
      scollo.scale.z = 1.6;
      busto.add(scollo);
      var cravatta = m(lisce(lathe([[0, 0.31], [0.022, 0.33], [0.018, 0.45], [0.012, 0.48], [0, 0.49]], 8)), MV.cravatta, 0, 0, 0.1);
      cravatta.scale.z = 0.3;
      busto.add(cravatta);
      [-1, 1].forEach(function (l) {
        var forma = new T.Shape();
        forma.moveTo(0, 0); forma.lineTo(0.075, 0.03); forma.lineTo(0.06, 0.2); forma.lineTo(0.0, 0.17); forma.lineTo(0, 0);
        var rev = new T.Mesh(new T.ExtrudeGeometry(forma, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003,
                                                            bevelSize: 0.003, bevelSegments: 2, curveSegments: 4 }), MV.busto);
        rev.position.set(l * 0.012, 0.29, 0.118);
        rev.scale.x = l;
        rev.rotation.set(-0.18, l * 0.32, 0);
        if (!PS1) rev.castShadow = true;
        busto.add(rev);
      });
      var coll = m(new T.CylinderGeometry(0.07, 0.085, 0.045, sg(24), 1, true, Math.PI * 0.6, Math.PI * 0.8), MV.busto, 0, 0.49, -0.012);
      coll.material = MV.falda;
      busto.add(coll);
      /* i bottoni, il taschino con la penna, il cartellino */
      [0.06, 0.15, 0.24].forEach(function (y) {
        busto.add(mr(cil(0.009, 0.009, 0.005, 12), MV.bottone, 0.005, y, 0.152 - y * 0.03, Math.PI / 2, 0, 0));
      });
      busto.add(mr(tonda(0.075, 0.08, 0.008, 0.003), MV.busto, 0.085, 0.32, 0.118, 0, 0.32, 0));
      busto.add(m(cil(0.0045, 0.0045, 0.12, 8), MV.penna, 0.07, 0.36, 0.122));
      busto.add(m(tonda(0.004, 0.035, 0.004, 0.001), MV.metallo, 0.07, 0.385, 0.127));
      var badge = new T.Group();
      badge.position.set(-0.085, 0.31, 0.123); badge.rotation.y = -0.32;
      var cvB = nuovaTela(64, 96), qB = cvB.getContext('2d');
      qB.fillStyle = '#f2f0ea'; qB.fillRect(0, 0, 64, 96);
      qB.fillStyle = '#0f3d5c'; qB.fillRect(0, 0, 64, 18);
      qB.fillStyle = '#fff'; qB.font = 'bold 10px sans-serif'; qB.fillText('ISTITUTO', 8, 13);
      qB.fillStyle = '#9a8a7c'; qB.fillRect(14, 24, 36, 40);
      qB.fillStyle = '#6a5a4c'; qB.beginPath(); qB.arc(32, 38, 9, 0, 6.28); qB.fill(); qB.fillRect(18, 50, 28, 14);
      qB.fillStyle = '#222'; qB.font = 'bold 9px sans-serif'; qB.fillText('DIRETTORE', 7, 78);
      qB.fillStyle = '#b22'; qB.fillRect(0, 86, 64, 10);
      var tB = new T.CanvasTexture(cvB); tB.encoding = T.sRGBEncoding;
      badge.add(m(tonda(0.05, 0.075, 0.004, 0.002), MV.badge));
      var faccia = new T.Mesh(new T.PlaneGeometry(0.048, 0.072), mat({ map: tB, roughness: 0.3 }));
      faccia.position.z = 0.0035;
      badge.add(faccia);
      busto.add(badge);
      var distintivo = mr(cil(0.012, 0.012, 0.006, 12), mat({ color: 0xd8b437, roughness: 0.4 }), 0.115, 0.41, 0.105, Math.PI / 2, 0, 0);
      busto.add(distintivo);

      /* il collo e la testa */
      var collo = new T.Group();
      collo.position.y = 0.49;
      busto.add(collo);
      collo.add(m(lisce(lathe([[0.058, -0.01], [0.055, 0.04], [0.052, 0.09], [0, 0.1]], 16)), MV.pelle, 0, 0, 0.004));
      var capo = new T.Group();
      capo.position.set(0, 0.155, 0.014);
      collo.add(capo);
      var R = 0.11;
      capo.add(m(testaGeo(R), MV.viso));
      capo.add(m(capelliGeo(R), MV.capelli));
      /* gli occhi: il bulbo con l'iride, e la palpebra superiore che lo
         copre in parte — e' la palpebra che toglie lo sguardo fisso */
      var occhi = [];
      [-1, 1].forEach(function (l) {
        var oc = new T.Group();
        oc.position.set(l * 0.0334, 0.0106, 0.0855);
        var bulbo = m(sfera(0.0118, 24, 16), MV.occhio, 0, 0, 0, false);
        bulbo.rotation.y = -Math.PI / 2;
        oc.add(bulbo);
        var palp = m(new T.SphereGeometry(0.0127, sg(20), sg(10), 0, Math.PI * 2, 0, Math.PI * 0.3), MV.viso, 0, 0, 0, false);
        palp.rotation.x = 0.22;
        oc.add(palp);
        capo.add(oc);
        occhi.push(oc);
      });
      /* le orecchie: una conchiglia con il bordo */
      [-1, 1].forEach(function (l) {
        var orecchio = new T.Group();
        orecchio.position.set(l * 0.09, 0.0, -0.01);
        orecchio.rotation.y = l * 0.25;
        var con = m(lisce(new T.SphereGeometry(0.026, sg(14), sg(10))), MV.pelle);
        con.scale.set(0.38, 1, 0.68);
        orecchio.add(con);
        var bordo = m(new T.TorusGeometry(0.019, 0.0045, sg(6), sg(14), Math.PI * 1.3), MV.pelle, l * 0.004, 0.002, 0);
        bordo.rotation.set(0, l * Math.PI / 2, Math.PI * 0.35);
        bordo.scale.set(1, 1.3, 1);
        orecchio.add(bordo);
        capo.add(orecchio);
      });
      /* le braccia, con le mani a cinque dita in guanti di nitrile */
      function dito(lung, r, curva) {
        var d = new T.Group(), giunti = [];
        var pez = [lung * 0.45, lung * 0.32, lung * 0.23], cur = d;
        pez.forEach(function (l2, i) {
          var gg = new T.Group();
          if (i) gg.position.y = -pez[i - 1];
          gg.rotation.x = curva * (i ? 1 : 0.6);
          gg.add(m(capsula(r * (1 - i * 0.12), l2), MV.guanti, 0, -l2 / 2, 0));
          cur.add(gg); giunti.push(gg); cur = gg;
        });
        return { gruppo: d, giunti: giunti };
      }
      function braccio(lato) {
        var spalla = new T.Group();
        spalla.position.set(lato * 0.222, 0.425, -0.005);
        busto.add(spalla);
        spalla.add(m(lisce(lathe([[0.0, 0.01], [0.05, 0.0], [0.058, -0.05], [0.052, -0.18], [0.045, -0.29], [0, -0.3]], 20)), MV.manica));
        var gomito = new T.Group();
        gomito.position.y = -0.29;
        spalla.add(gomito);
        gomito.add(m(lisce(sfera(0.046, 16, 12)), MV.manica));
        gomito.add(m(lisce(lathe([[0.047, 0.0], [0.048, -0.08], [0.051, -0.19], [0.053, -0.215], [0, -0.22]], 20)), MV.manica));
        gomito.add(m(cil(0.036, 0.034, 0.06, 16, true), MV.guanti, 0, -0.225, 0));
        var polso = new T.Group();
        polso.position.y = -0.25;
        gomito.add(polso);
        var palmo = m(lisce(lathe([[0.0, 0.0], [0.03, -0.01], [0.038, -0.045], [0.036, -0.08], [0.0, -0.088]], 16)), MV.guanti);
        palmo.scale.set(1, 1, 0.5);
        polso.add(palmo);
        var mano = { dita: [] };
        [-0.024, -0.008, 0.008, 0.024].forEach(function (dx, i) {
          var d = dito([0.072, 0.082, 0.078, 0.062][i], 0.0085, 0.28 + i * 0.04);
          d.gruppo.position.set(dx * lato, -0.084, 0.004);
          polso.add(d.gruppo);
          mano.dita.push(d);
        });
        var pol = dito(0.06, 0.0095, 0.25);
        pol.gruppo.position.set(-lato * 0.03, -0.03, 0.014);
        pol.gruppo.rotation.set(-0.3, 0, -lato * 0.7);
        polso.add(pol.gruppo);
        mano.pollice = pol;
        return { spalla: spalla, gomito: gomito, polso: polso, mano: mano };
      }
      /* le gambe e le scarpe da laboratorio: un profilo vero, estruso */
      function scarpa() {
        var f = new T.Shape();
        f.moveTo(-0.06, 0); f.lineTo(0.17, 0); f.quadraticCurveTo(0.2, 0.0, 0.2, 0.03);
        f.quadraticCurveTo(0.19, 0.07, 0.12, 0.075); f.lineTo(0.03, 0.1); f.lineTo(-0.04, 0.105);
        f.quadraticCurveTo(-0.07, 0.1, -0.065, 0.05); f.lineTo(-0.06, 0);
        var geo = new T.ExtrudeGeometry(f, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.012,
                                             bevelSegments: sg(4), curveSegments: sg(10) });
        geo.translate(0, 0, -0.035);
        geo.rotateY(-Math.PI / 2);
        var s = new T.Group();
        s.add(m(geo, MV.scarpe));
        var suola = m(cil(0.05, 0.05, 0.018, 16), MV.suola, 0, -0.004, 0.07);
        suola.scale.set(1.2, 1, 2.9);
        s.add(suola);
        return s;
      }
      function gamba(lato) {
        var anca = new T.Group();
        anca.position.set(lato * 0.088, -0.06, 0);
        bacino.add(anca);
        anca.add(m(lisce(lathe([[0.079, 0.02], [0.08, -0.05], [0.072, -0.22], [0.06, -0.42], [0, -0.43]], 24)), MV.pantaloni));
        var ginocchio = new T.Group();
        ginocchio.position.y = -0.42;
        anca.add(ginocchio);
        ginocchio.add(m(lisce(sfera(0.058, 16, 12)), MV.pantaloni));
        ginocchio.add(m(lisce(lathe([[0.058, 0.0], [0.056, -0.12], [0.048, -0.32], [0.046, -0.4], [0, -0.41]], 24)), MV.pantaloni));
        var caviglia = new T.Group();
        caviglia.position.y = -0.42;
        ginocchio.add(caviglia);
        var sc = scarpa();
        sc.position.set(0, -0.036, 0);
        caviglia.add(sc);
        return { anca: anca, ginocchio: ginocchio, caviglia: caviglia };
      }

      var rig = {
        nodo: g, bacino: bacino, busto: busto, collo: collo, testa: capo, distintivo: distintivo,
        falde: falde, occhi: occhi,
        bSx: braccio(-1), bDx: braccio(1), gSx: gamba(-1), gDx: gamba(1)
      };
      g.add(ombraContatto(0.36));
      return rig;
    }

    /* ═════════════════════════════════════════════════════════════════════
       I MATERIALI DELLE MACCHINE
       Vernice industriale consumata sugli spigoli, acciaio, gomma, rame,
       vetro; i pannelli hanno le giunture e i rivetti nella mappa di
       rilievo, non solo nel colore.
       ═════════════════════════════════════════════════════════════════════ */
    function texVernice(nome, base, seme) {
      function pann(u, v) { return (((u * 2) % 1) < 0.008 || ((v * 2) % 1) < 0.008); }
      function riv(u, v) { return Math.abs(((u * 2) % 1) - 0.04) < 0.008 && Math.abs(((v * 8) % 1) - 0.5) < 0.06; }
      return pittura(nome, 128, 128, function (u, v, x, y) {
        var n = fbm(u * 6, v * 6, 4, seme), gr = (hash(x, y, seme + 1) - 0.5) * 5;
        var usura = fbm(u * 14, v * 14, 3, seme + 2);
        var colata = Math.pow(fbm(u * 40, v * 2, 2, seme + 3), 4) * 30;
        var r = base[0], g = base[1], b = base[2];
        if (usura > 0.68) { var k = Math.min(1, (usura - 0.68) * 3); r = r * (1 - k) + 128 * k; g = g * (1 - k) + 130 * k; b = b * (1 - k) + 134 * k; }
        var s = 1 - (n - 0.5) * 0.14, pz = pann(u, v) ? -36 : 0, rz = riv(u, v) ? 26 : 0;
        return [r * s + gr + pz + rz - colata, g * s + gr + pz + rz - colata, b * s + gr + pz + rz - colata * 0.8];
      }, null, function (u, v) {
        return (pann(u, v) ? 0 : 0.5) + (riv(u, v) ? 0.9 : 0) + fbm(u * 14, v * 14, 3, seme + 2) * 0.12;
      }, 3);
    }
    function texRuggine() {
      return pittura('rugginePS2', 128, 128, function (u, v) {
        var n = fbm(u * 8, v * 8, 5, 101), m2 = fbm(u * 30, v * 30, 3, 102);
        var cola = Math.pow(fbm(u * 36, v * 1.8, 2, 103), 2) * 1.2;
        return [118 + n * 58 - cola * 28 + (m2 - 0.5) * 18, 72 + n * 30 - cola * 16 + (m2 - 0.5) * 10, 46 + n * 14 - cola * 8];
      }, null, function (u, v) { return fbm(u * 8, v * 8, 5, 101) * 0.7 + fbm(u * 30, v * 30, 3, 102) * 0.3; }, 4);
    }
    function texSchermo(titolo, colore, righe) {
      var chiave = 'sch2|' + titolo;
      if (cache[chiave]) return cache[chiave];
      var cv = nuovaTela(256, 160), q = cv.getContext('2d');
      q.fillStyle = '#031216'; q.fillRect(0, 0, 256, 160);
      q.fillStyle = colore; q.font = 'bold 18px monospace'; q.fillText(titolo, 12, 26);
      q.globalAlpha = 0.8; q.font = '12px monospace';
      (righe || []).forEach(function (r, i) { q.fillText(r, 12, 52 + i * 18); });
      q.globalAlpha = 1; q.strokeStyle = colore; q.strokeRect(160, 46, 84, 60);
      q.beginPath();
      for (var x = 0; x < 84; x++) {
        var y = 76 + Math.sin(x / 5) * 18 * Math.exp(-Math.pow((x - 42) / 24, 2));
        if (x) q.lineTo(160 + x, y); else q.moveTo(160 + x, y);
      }
      q.stroke();
      var t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding;
      cache[chiave] = t;
      return t;
    }

    var X_ = null;
    function MX() {
      if (X_) return X_;
      X_ = {
        giallo: materiale(texVernice('verniceGialla', [214, 168, 40], 301), { roughness: 0.46, metalness: 0.15, rilievo: 0.7 }),
        grigio: materiale(texVernice('verniceGrigia', [120, 130, 138], 311), { roughness: 0.44, metalness: 0.25, rilievo: 0.7 }),
        bianco: materiale(texVernice('verniceBianca', [212, 216, 218], 321), { roughness: 0.4, metalness: 0.1, rilievo: 0.6 }),
        blu: materiale(texVernice('verniceBlu', [44, 92, 140], 331), { roughness: 0.44, metalness: 0.2, rilievo: 0.6 }),
        verde: materiale(texVernice('verniceVerde', [64, 110, 84], 341), { roughness: 0.48, metalness: 0.2, rilievo: 0.6 }),
        ruggine: materiale(texRuggine(), { roughness: 0.92, metalness: 0.35, rilievo: 1.2 }),
        acciaio: M.acciaio, acciaioScuro: M.acciaioScuro, gomma: M.gomma, vetro: M.vetro, strisce: M.strisce,
        rosso: M.verniceRossa,
        cromo: mat({ color: 0xd8dde2, roughness: 0.12, metalness: 1, env: 1.4 }),
        rame: mat({ color: 0xc87850, roughness: 0.3, metalness: 1, env: 1.2 }),
        piombo: mat({ color: 0x7c8288, roughness: 0.5, metalness: 0.8 }),
        cemento: materiale(pittura('cemento', 128, 128, function (u, v, x, y) {
          var n = fbm(u * 10, v * 10, 4, 351), gr = (hash(x, y, 352) - 0.5) * 12;
          var cc = 150 + n * 30 + gr; return [cc, cc * 0.98, cc * 0.95];
        }, null, function (u, v) { return fbm(u * 10, v * 10, 4, 351); }, 2), { roughness: 0.95 }),
        resina: mat({ color: 0xd08a20, roughness: 0.1, transparent: !PS1, opacity: PS1 ? 1 : 0.9,
                      emissive: 0x6a3008, emissiveIntensity: 0.6 }),
        liquidoBlu: mat({ color: 0x3a7ab0, roughness: 0.05, transparent: !PS1, opacity: PS1 ? 1 : 0.75,
                          emissive: 0x0a2a48, emissiveIntensity: 0.5 }),
        fango: materiale(pittura('fangoPS2', 128, 128, function (u, v, x, y) {
          var n = fbm(u * 7, v * 7, 4, 361), gr = (hash(x, y, 362) - 0.5) * 6;
          return [72 + n * 34 + gr, 58 + n * 26 + gr, 38 + n * 16 + gr];
        }, null, function (u, v) { return fbm(u * 7, v * 7, 4, 361); }, 3), { roughness: 0.12 }),
        brina: materiale(pittura('brina', 128, 128, function (u, v, x, y) {
          var n = fbm(u * 12, v * 12, 4, 371), sp = hash(x, y, 372) > 0.97 ? 30 : 0;
          return [196 + n * 40 + sp, 214 + n * 30 + sp, 228 + n * 20 + sp];
        }, null, function (u, v) { return fbm(u * 12, v * 12, 4, 371); }, 3), { roughness: 0.55, metalness: 0.2 }),
        led: function (col, k) { return mat({ color: 0x111111, emissive: col, emissiveIntensity: k || 2, roughness: 0.3 }); }
      };
      return X_;
    }
    function schermoMesh(titolo, colore, righe, l, a) {
      return new T.Mesh(new T.PlaneGeometry(l, a), new T.MeshBasicMaterial({ map: texSchermo(titolo, colore, righe), toneMapped: false }));
    }

    /* un braccio robotico industriale: torretta, due segmenti con il
       pistone idraulico, polso e pinza. Restituisce i giunti da muovere */
    function braccioRobot(lung1, lung2, vernice, scala) {
      var X = MX(), s = scala || 1;
      var g = new T.Group();
      g.add(m(cil(0.22 * s, 0.26 * s, 0.18 * s, 28), X.acciaioScuro, 0, 0.09 * s, 0));
      var torretta = new T.Group();
      torretta.position.y = 0.18 * s;
      g.add(torretta);
      torretta.add(m(cil(0.18 * s, 0.2 * s, 0.22 * s, 28), vernice, 0, 0.11 * s, 0));
      var spalla = new T.Group();
      spalla.position.y = 0.25 * s;
      torretta.add(spalla);
      spalla.add(mr(cil(0.09 * s, 0.09 * s, 0.34 * s, 24), X.acciaio, 0, 0, 0, 0, 0, Math.PI / 2));
      spalla.add(m(tonda(0.16 * s, lung1, 0.15 * s, 0.035 * s), vernice, 0, lung1 / 2, 0));
      spalla.add(m(cil(0.03 * s, 0.03 * s, lung1 * 0.55, 16), X.acciaioScuro, 0, lung1 * 0.35, 0.12 * s));
      spalla.add(m(cil(0.016 * s, 0.016 * s, lung1 * 0.4, 12), X.cromo, 0, lung1 * 0.7, 0.12 * s));
      var gomito = new T.Group();
      gomito.position.y = lung1;
      spalla.add(gomito);
      gomito.add(mr(cil(0.07 * s, 0.07 * s, 0.24 * s, 24), X.acciaio, 0, 0, 0, 0, 0, Math.PI / 2));
      gomito.add(m(tonda(0.12 * s, lung2, 0.12 * s, 0.03 * s), vernice, 0, lung2 / 2, 0));
      var polso = new T.Group();
      polso.position.y = lung2;
      gomito.add(polso);
      polso.add(m(cil(0.07 * s, 0.06 * s, 0.1 * s, 20), X.acciaioScuro, 0, 0.05 * s, 0));
      var dita = [];
      [-1, 1].forEach(function (l) {
        var d = new T.Group();
        d.position.set(l * 0.04 * s, 0.1 * s, 0);
        d.add(m(tonda(0.025 * s, 0.14 * s, 0.05 * s, 0.008 * s), X.acciaio, 0, 0.07 * s, 0));
        d.rotation.z = -l * 0.25;
        polso.add(d);
        dita.push(d);
      });
      g.add(c.tubo([[0.12 * s, 0.2 * s, -0.1 * s], [0.1 * s, 0.5 * s, -0.12 * s]], 0.015 * s, X.gomma));
      return { gruppo: g, torretta: torretta, spalla: spalla, gomito: gomito, polso: polso, dita: dita };
    }
    function parti() { return { ruota: [], oscilla: [], pulsa: [], occhi: [], tremola: [], scorre: [], saliscendi: [], vapore: [] }; }
    function faro(P, x, y, z, colore) {
      var X = MX(), gr = new T.Group();
      gr.position.set(x, y, z);
      gr.add(m(cil(0.07, 0.08, 0.05, 16), X.acciaioScuro, 0, 0, 0));
      gr.add(m(new T.SphereGeometry(0.065, sg(16), sg(8), 0, Math.PI * 2, 0, Math.PI / 2),
               mat({ color: colore, transparent: true, opacity: 0.75, emissive: colore, emissiveIntensity: 0.8 }), 0, 0.025, 0, false));
      var rot = new T.Group(); rot.position.y = 0.05;
      var a = alone(colore, 0.55, 0.9); a.position.set(0.05, 0, 0);
      rot.add(a);
      gr.add(rot);
      P.ruota.push({ o: rot, asse: 'y', v: 0.12 });
      return gr;
    }
    function quadro(P, x, y, z, ruota, titolo, colore, righe) {
      var X = MX(), g = new T.Group();
      g.position.set(x, y, z); g.rotation.y = ruota || 0;
      g.add(m(tonda(0.7, 1.4, 0.35, 0.03), X.grigio, 0, 0.7, 0));
      var sch = schermoMesh(titolo, colore, righe, 0.5, 0.32);
      sch.position.set(0, 1.05, 0.178);
      g.add(sch);
      var a = alone(new T.Color(colore), 0.9, 0.22); a.position.set(0, 1.05, 0.25);
      g.add(a);
      for (var i = 0; i < 4; i++) {
        var led = m(new T.SphereGeometry(0.014, 8, 8), X.led(i % 2 ? 0x30ff70 : 0xff4030, 2.5), -0.2 + i * 0.13, 0.75, 0.18, false);
        g.add(led);
        P.tremola.push(led);
      }
      return g;
    }
    function occhio(P, gruppo, col, x, y, z, r) {
      var X = MX();
      var o = m(new T.SphereGeometry(r || 0.06, sg(16), sg(12)), X.led(col, 2.2), x, y, z, false);
      gruppo.add(o);
      var a = alone(col, (r || 0.06) * 9, 0.7); a.position.set(x, y, z + 0.02);
      gruppo.add(a);
      P.occhi.push(o);
      return o;
    }

    /* ═════════════════════════════════════════════════════════════════════
       I DIECI GUARDIANI — le macchine dell'istituto
       ═════════════════════════════════════════════════════════════════════ */

    /* POMPA 7 — la pompa centrifuga del circuito di raffreddamento, con i
       due bracci idraulici della manutenzione automatica che non si fermano
       piu'. In fase 1 la coprono le piastre di corrosione */
    function pompa() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(tonda(3.0, 0.25, 2.2, 0.05), X.grigio, 0, 0.125, 0));
      corpo.add(m(tonda(3.04, 0.06, 2.24, 0.02), X.strisce, 0, 0.27, 0));
      corpo.add(mr(lisce(cil(0.85, 0.85, 0.7, 40)), X.blu, 0, 1.2, 0.2, Math.PI / 2, 0, 0));
      [-1, 1].forEach(function (l) {
        corpo.add(mr(cil(0.9, 0.9, 0.06, 40), X.acciaioScuro, 0, 1.2, 0.2 + l * 0.36, Math.PI / 2, 0, 0));
        for (var b = 0; b < 16; b++) {
          var a = b / 16 * Math.PI * 2;
          corpo.add(mr(cil(0.025, 0.025, 0.06, 6), X.cromo, Math.cos(a) * 0.82, 1.2 + Math.sin(a) * 0.82, 0.2 + l * 0.4, Math.PI / 2, 0, 0));
        }
      });
      /* l'oblo d'ispezione con la girante che gira dietro il vetro */
      var girante = new T.Group();
      girante.position.set(0, 1.2, 0.5);
      for (var i = 0; i < 7; i++) {
        var pala = m(tonda(0.05, 0.42, 0.12, 0.015), X.acciaio, 0, 0, 0);
        pala.position.set(Math.cos(i / 7 * 6.283) * 0.2, Math.sin(i / 7 * 6.283) * 0.2, 0);
        pala.rotation.z = i / 7 * 6.283 + 0.5;
        girante.add(pala);
      }
      corpo.add(girante);
      P.ruota.push({ o: girante, asse: 'z', v: 0.25 });
      corpo.add(m(new T.CircleGeometry(0.48, sg(32)), X.vetro, 0, 1.2, 0.58, false));
      corpo.add(m(new T.TorusGeometry(0.5, 0.04, sg(10), sg(40)), X.cromo, 0, 1.2, 0.58));
      /* il motore con le alette e il coprigiunto */
      corpo.add(mr(lisce(cil(0.55, 0.55, 1.1, 36)), X.verde, 0, 1.2, -1.0, Math.PI / 2, 0, 0));
      for (var a2 = 0; a2 < 14; a2++) {
        var an = a2 / 14 * 6.283;
        corpo.add(mr(tonda(0.03, 0.12, 1.0, 0.01), X.verde, Math.cos(an) * 0.58, 1.2 + Math.sin(an) * 0.58, -1.0, 0, 0, an));
      }
      corpo.add(m(tonda(0.7, 0.7, 0.4, 0.06), X.giallo, 0, 1.2, -0.38));
      corpo.add(c.tubo([[0, 2.0, 0.2], [0, 2.6, 0.2], [0.4, 3.0, 0.2], [1.6, 3.0, 0.2]], 0.16, X.acciaio));
      corpo.add(c.tubo([[0.85, 1.2, 0.2], [1.4, 1.2, 0.2], [1.6, 0.6, 0.4], [1.6, 0.0, 0.4]], 0.17, X.acciaio));
      var vol = new T.Group();
      vol.position.set(0, 2.5, 0.45);
      vol.add(m(new T.TorusGeometry(0.3, 0.035, sg(10), sg(32)), X.rosso));
      for (var r2 = 0; r2 < 3; r2++) vol.add(mr(cil(0.015, 0.015, 0.6, 8), X.rosso, 0, 0, 0, 0, 0, r2 * Math.PI / 3));
      corpo.add(vol);
      P.ruota.push({ o: vol, asse: 'z', v: -0.03 });
      /* la corrosione: piastre di ruggine sopra la vernice (fase 1) */
      var ruggine = new T.Group();
      [[0.0, 1.85, 0.42, 0.5, 0.35, 0.2], [-0.7, 0.85, 0.5, 0.4, 0.6, -0.6], [0.72, 1.5, 0.44, 0.4, 0.45, 0.7],
       [0.0, 1.2, -0.62, 1.0, 0.9, 0], [-0.62, 1.9, -0.9, 0.5, 0.4, 0.3]].forEach(function (p2, k) {
        ruggine.add(mr(tonda(p2[3], p2[4], 0.04, 0.015), X.ruggine, p2[0], p2[1], p2[2], 0.1 * k, p2[5], 0.15 * k));
      });
      corpo.add(ruggine);
      /* i bracci idraulici della manutenzione */
      [-1, 1].forEach(function (l) {
        var b = braccioRobot(0.9, 0.75, X.giallo, 1.1);
        b.gruppo.position.set(l * 1.05, 0.27, 0.55);
        b.spalla.rotation.x = 0.7; b.gomito.rotation.x = 1.1;
        corpo.add(b.gruppo);
        P.oscilla.push({ o: b.torretta, asse: 'y', amp: 0.6, f: 0.5 + l * 0.08 });
        P.oscilla.push({ o: b.spalla, asse: 'x', amp: 0.25, f: 0.7 });
        P.oscilla.push({ o: b.gomito, asse: 'x', amp: 0.3, f: 0.9 });
        b.dita.forEach(function (d, i) { P.oscilla.push({ o: d, asse: 'z', amp: 0.2, f: 1.6 + i }); });
      });
      [-1, 1].forEach(function (l) {
        corpo.add(mr(cil(0.11, 0.11, 0.06, 28), X.cromo, l * 0.4, 2.1, 0.5, Math.PI / 2, 0, 0));
        occhio(P, corpo, 0xff3a20, l * 0.4, 2.1, 0.535, 0.04);
      });
      corpo.add(faro(P, 0.9, 0.3, -0.95, 0xff8a10));
      corpo.add(quadro(P, -1.2, 0.27, -0.6, 0.9, 'POMPA 7', '#ff6a40', ['> portata: 0 m3/h', '> pressione: ALLARME', '> manutenzione AUTO', '> blocco: NEGATO']));
      P.ruggine = ruggine; P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* IL POLIMERO — l'estrusore del reparto polimeri: il reattore verticale
       con l'oblo da cui si vede la resina, il cilindro con le fasce
       riscaldanti incandescenti, la testa da cui cola il polimero */
    function polimero() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(tonda(3.2, 0.2, 1.6, 0.05), X.grigio, 0, 0.1, 0));
      corpo.add(m(lisce(lathe([[0, 0], [0.6, 0], [0.7, 0.15], [0.7, 1.9], [0.55, 2.3], [0.15, 2.45], [0, 2.45]], 40)), X.cromo, -0.8, 0.2, 0));
      var oblo = m(new T.CircleGeometry(0.22, sg(24)), X.resina, -0.8, 1.3, 0.705, false);
      corpo.add(oblo);
      corpo.add(m(new T.TorusGeometry(0.23, 0.03, sg(8), sg(28)), X.acciaioScuro, -0.8, 1.3, 0.705));
      occhio(P, corpo, 0xff9a30, -0.8, 1.3, 0.73, 0.03);
      corpo.add(mr(cil(0.22, 0.22, 2.0, 32), X.acciaio, 0.6, 1.2, 0, 0, 0, Math.PI / 2));
      for (var i = 0; i < 5; i++) {
        var fascia = mr(cil(0.27, 0.27, 0.16, 32), X.led(0xff5a10, 0.9), -0.2 + i * 0.38, 1.2, 0, 0, 0, Math.PI / 2);
        corpo.add(fascia);
        P.pulsa.push(fascia);
        var al2 = alone(0xff6a20, 0.8, 0.35); al2.position.set(-0.2 + i * 0.38, 1.2, 0.3);
        corpo.add(al2);
      }
      corpo.add(m(lisce(lathe([[0.06, 0], [0.4, 0.5], [0.42, 0.7], [0.0, 0.7]], 24)), X.bianco, -0.2, 1.4, 0));
      corpo.add(m(cil(0.32, 0.26, 0.3, 28), X.acciaioScuro, 1.75, 1.2, 0));
      var colata = new T.Group();
      colata.position.set(1.8, 1.05, 0);
      [0, 0.12, -0.12].forEach(function (dz, k) {
        var pts = [[0, 0, dz], [0.05, -0.3, dz], [0.1, -0.7, dz + 0.05], [0.12, -0.95, dz]].map(V3);
        colata.add(m(new T.TubeGeometry(new T.CatmullRomCurve3(pts), sg(24), 0.04 - k * 0.006, sg(10), false), X.resina, 0, 0, 0, false));
      });
      var pozza = m(lisce(new T.CylinderGeometry(0.5, 0.55, 0.04, sg(32))), X.resina, 1.9, 0.12, 0, false);
      pozza.scale.z = 0.8;
      corpo.add(pozza);
      corpo.add(colata);
      P.oscilla.push({ o: colata, asse: 'z', amp: 0.06, f: 0.7 });
      var b = braccioRobot(0.8, 0.6, X.bianco, 1.0);
      b.gruppo.position.set(0.9, 0.2, 0.75);
      b.spalla.rotation.x = 0.5; b.gomito.rotation.x = 1.0;
      corpo.add(b.gruppo);
      P.oscilla.push({ o: b.torretta, asse: 'y', amp: 0.8, f: 0.4 });
      P.oscilla.push({ o: b.gomito, asse: 'x', amp: 0.35, f: 0.8 });
      corpo.add(c.tubo([[-0.8, 2.65, 0], [-0.8, 3.1, 0], [0, 3.2, 0], [1.4, 3.2, 0], [1.6, 2.2, 0]], 0.08, X.acciaio));
      corpo.add(faro(P, -1.5, 0.2, -0.6, 0xff8a10));
      corpo.add(quadro(P, 1.5, 0.2, -0.65, -0.5, 'ESTRUSORE', '#ffb040', ['> T cilindro: 312 C', '> viscosita: ALTA', '> reticolazione', '> arresto: NEGATO']));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* LO SPETTRO — il banco laser della spettroscopia: il tavolo ottico in
       granito, la torretta con tre emettitori che ruota e spazza la stanza,
       i prismi, gli specchi sui supporti */
    function spettro() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) {
        corpo.add(m(cil(0.09, 0.11, 0.8, 20), X.grigio, q[0] * 1.1, 0.4, q[1] * 0.6));
      });
      corpo.add(m(tonda(2.6, 0.22, 1.5, 0.03), X.cemento, 0, 0.9, 0));
      corpo.add(m(tonda(1.1, 0.7, 0.8, 0.06), X.bianco, -0.5, 1.36, 0));
      corpo.add(m(tonda(0.6, 0.45, 0.6, 0.05), X.blu, 0.6, 1.24, -0.2));
      [[0.5, 0.25], [0.95, -0.4], [-0.2, 0.55]].forEach(function (p2, k) {
        corpo.add(mr(new T.CylinderGeometry(0.09, 0.09, 0.14, 3), X.vetro, p2[0], 1.08, p2[1], 0, k, 0));
      });
      [[1.0, 0.5], [-1.1, -0.5]].forEach(function (p2) {
        var sp = new T.Group(); sp.position.set(p2[0], 1.01, p2[1]);
        sp.add(m(cil(0.015, 0.015, 0.2, 8), X.acciaio, 0, 0.1, 0));
        sp.add(mr(cil(0.07, 0.07, 0.015, 24), X.cromo, 0, 0.22, 0, Math.PI / 2, 0, 0));
        corpo.add(sp);
        P.oscilla.push({ o: sp, asse: 'y', amp: 0.5, f: 0.6 });
      });
      var torretta = new T.Group();
      torretta.position.set(-0.5, 1.72, 0);
      torretta.add(m(cil(0.3, 0.35, 0.18, 32), X.acciaioScuro, 0, 0.09, 0));
      var testa = new T.Group(); testa.position.y = 0.3;
      testa.add(m(lisce(sfera(0.28, 32, 24)), X.bianco));
      for (var e = 0; e < 3; e++) {
        var em = new T.Group();
        em.rotation.y = e / 3 * Math.PI * 2;
        em.add(mr(cil(0.06, 0.07, 0.35, 20), X.acciaioScuro, 0, 0, 0.32, Math.PI / 2, 0, 0));
        var col = [0xff3030, 0x30ff70, 0x4080ff][e];
        var fascio = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 6, 8, 1, true),
          new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
        fascio.rotation.x = Math.PI / 2; fascio.position.z = 3.5;
        em.add(fascio);
        var ap = alone(col, 0.5, 0.9); ap.position.z = 0.52;
        em.add(ap);
        var lente = m(new T.SphereGeometry(0.04, 12, 10), X.led(col, 2.5), 0, 0, 0.5, false);
        em.add(lente);
        P.occhi.push(lente);
        testa.add(em);
      }
      torretta.add(testa);
      corpo.add(torretta);
      P.ruota.push({ o: testa, asse: 'y', v: 0.012 });
      corpo.add(c.tubo([[-1.0, 1.4, -0.4], [-1.4, 1.2, -0.6], [-1.6, 0.0, -0.7]], 0.04, X.gomma));
      corpo.add(faro(P, 1.2, 1.01, -0.6, 0xffc030));
      corpo.add(quadro(P, 1.9, 0, 0.3, -1.2, 'SPETTRO', '#60c0ff', ['> laser 1/2/3: ON', '> potenza: 140%', '> radicali: rilevati', '> interblocco: OFF']));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* ELICA — il robot sequenziatore: un portale con il carrello delle
       pipette che corre avanti e indietro, e al centro la camera di vetro
       con il modello della doppia elica che ruota */
    function elica() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(tonda(2.8, 0.3, 2.0, 0.05), X.bianco, 0, 0.15, 0));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) {
        corpo.add(m(tonda(0.14, 2.9, 0.14, 0.03), X.grigio, q[0] * 1.3, 1.75, q[1] * 0.9));
      });
      [-1, 1].forEach(function (l) { corpo.add(m(tonda(2.74, 0.16, 0.16, 0.03), X.grigio, 0, 3.2, l * 0.9)); });
      var camera = new T.Group(); camera.position.y = 0.3;
      camera.add(m(cil(0.62, 0.62, 2.2, 40, true), X.vetro, 0, 1.1, 0, false));
      camera.add(m(cil(0.68, 0.68, 0.12, 40), X.acciaioScuro, 0, 0.06, 0));
      camera.add(m(cil(0.68, 0.68, 0.12, 40), X.acciaioScuro, 0, 2.2, 0));
      var el = new T.Group(); el.position.y = 0.2;
      var basi = [0xd04040, 0x4070d0, 0x40b060, 0xd0a030];
      var Y = new T.Vector3(0, 1, 0);
      for (var b = 0; b < 26; b++) {
        var y = b * 0.072, an = b * 0.45;
        var p1 = new T.Vector3(Math.cos(an) * 0.33, y, Math.sin(an) * 0.33);
        var p2 = new T.Vector3(Math.cos(an + Math.PI) * 0.33, y, Math.sin(an + Math.PI) * 0.33);
        el.add(m(new T.SphereGeometry(0.035, sg(14), sg(10)), X.cromo, p1.x, p1.y, p1.z, false));
        el.add(m(new T.SphereGeometry(0.035, sg(14), sg(10)), X.cromo, p2.x, p2.y, p2.z, false));
        var mid = p1.clone().add(p2).multiplyScalar(0.5);
        var cop = m(new T.CylinderGeometry(0.014, 0.014, 0.62, sg(10)),
                    mat({ color: basi[b % 4], roughness: 0.3, emissive: basi[b % 4], emissiveIntensity: 0.35 }), mid.x, mid.y, mid.z, false);
        cop.quaternion.setFromUnitVectors(Y, p2.clone().sub(p1).normalize());
        el.add(cop);
      }
      [0, Math.PI].forEach(function (off) {
        var pts = [];
        for (var q = 0; q <= 26; q++) pts.push(new T.Vector3(Math.cos(q * 0.45 + off) * 0.33, q * 0.072, Math.sin(q * 0.45 + off) * 0.33));
        el.add(m(new T.TubeGeometry(new T.CatmullRomCurve3(pts), sg(120), 0.016, sg(8), false), X.cromo, 0, 0, 0, false));
      });
      camera.add(el);
      var luce = alone(0x80c0ff, 2.2, 0.25); luce.position.y = 1.1;
      camera.add(luce);
      corpo.add(camera);
      P.ruota.push({ o: el, asse: 'y', v: 0.01 });
      P.elica = el;
      var carr = new T.Group(); carr.position.set(0, 3.0, 0);
      carr.add(m(tonda(0.5, 0.3, 1.9, 0.04), X.blu, 0, 0, 0));
      for (var pp = 0; pp < 8; pp++) carr.add(m(cil(0.02, 0.008, 0.45, 10), X.bianco, 0, -0.35, -0.7 + pp * 0.2));
      corpo.add(carr);
      P.scorre.push({ o: carr, asse: 'x', amp: 1.0, f: 0.35 });
      occhio(P, corpo, 0x40a0ff, 0, 0.42, 0.7, 0.05);
      corpo.add(faro(P, 1.3, 3.3, 0.9, 0x40a0ff));
      corpo.add(quadro(P, -1.9, 0, 0.2, 1.2, 'SEQUENZIATORE', '#70e0a0', ['> lettura: 5-ATGC..', '> ciclo 9999/9999', '> blocco su sequenza', '> appaiamento: ERR']));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* LA CELLA — l'impianto di elettrolisi: due vasche con gli elettrodi di
       rame, i dendriti di rame cresciuti fuori dal liquido, le sbarre, il
       raddrizzatore con lo schermo, le scintille */
    function cella() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      [-0.75, 0.75].forEach(function (x) {
        corpo.add(m(tonda(1.2, 1.0, 1.4, 0.05), X.grigio, x, 0.5, 0));
        var liq = m(tonda(1.08, 0.04, 1.28, 0.01), X.liquidoBlu, x, 1.0, 0, false);
        corpo.add(liq);
        for (var e = 0; e < 3; e++) corpo.add(m(tonda(0.04, 1.3, 1.0, 0.01), X.rame, x - 0.35 + e * 0.35, 1.25, 0));
      });
      function ramo(base, dir, lung, liv, seme) {
        var fine = [base[0] + dir[0] * lung, base[1] + dir[1] * lung, base[2] + dir[2] * lung];
        var pts = [base, [(base[0] + fine[0]) / 2 + (hash(seme, 1, 803) - 0.5) * 0.08, (base[1] + fine[1]) / 2, (base[2] + fine[2]) / 2], fine].map(V3);
        corpo.add(m(new T.TubeGeometry(new T.CatmullRomCurve3(pts), sg(10), 0.025 * (1 - liv * 0.22), sg(6), false), X.rame));
        if (liv < 3) [-1, 1].forEach(function (l) {
          var nd = [dir[0] + l * 0.55, dir[1] * 0.85, dir[2] + (hash(seme, l + 3, 804) - 0.5) * 0.9];
          var nn = Math.hypot(nd[0], nd[1], nd[2]);
          ramo(fine, [nd[0] / nn, nd[1] / nn, nd[2] / nn], lung * 0.62, liv + 1, seme * 3 + l + 7);
        });
      }
      ramo([-0.75, 1.9, 0], [-0.2, 1, 0.1], 0.6, 0, 805);
      ramo([0.75, 1.9, 0], [0.2, 1, -0.1], 0.6, 0, 806);
      corpo.add(m(tonda(2.4, 0.08, 0.14, 0.02), X.rame, 0, 1.95, 0.55));
      corpo.add(m(tonda(2.4, 0.08, 0.14, 0.02), X.rame, 0, 1.95, -0.55));
      corpo.add(quadro(P, 0, 0, -1.2, 0, 'RADDRIZZATORE', '#40c0ff', ['> I = 12 000 A', '> V = 4.1 V', '> deposito Cu: max', '> inversione: NEGATA']));
      [-1, 1].forEach(function (l) {
        var sc = m(new T.OctahedronGeometry(0.06, 0), X.led(0x80d0ff, 3), l * 0.75, 1.98, 0.55, false);
        corpo.add(sc); P.tremola.push(sc);
        var a = alone(0x80d0ff, 0.6, 0.8); a.position.set(l * 0.75, 1.98, 0.6);
        corpo.add(a); P.tremola.push(a);
      });
      occhio(P, corpo, 0x40c0ff, 0, 1.2, 0.72, 0.06);
      corpo.add(c.tubo([[-1.2, 1.9, 0.55], [-1.7, 1.6, 0.6], [-1.9, 0.0, 0.6]], 0.05, X.gomma));
      corpo.add(c.tubo([[1.2, 1.9, -0.55], [1.7, 1.6, -0.6], [1.9, 0.0, -0.6]], 0.05, X.gomma));
      corpo.add(faro(P, 1.3, 1.0, 0.7, 0x40c0ff));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    function texVapore() {
      if (cache.vapore) return cache.vapore;
      var cv = nuovaTela(64, 64), q = cv.getContext('2d');
      var gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      q.fillStyle = gr; q.fillRect(0, 0, 64, 64);
      return (cache.vapore = new T.CanvasTexture(cv));
    }

    /* IL GELO — il criostato del deposito campioni: tre Dewar d'acciaio con
       la brina alla base, gli sfiati che buttano vapore d'azoto, il braccio
       che carica le provette */
    function gelo() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(tonda(3.0, 0.15, 2.2, 0.04), X.grigio, 0, 0.075, 0));
      [[-0.8, 0, 0.7], [0.75, 0.2, 0.62], [0, -0.6, 0.55]].forEach(function (d, k) {
        var dw = new T.Group(); dw.position.set(d[0], 0.15, d[1]);
        var h = 1.6 + k * 0.3;
        dw.add(m(lisce(lathe([[0, 0], [d[2], 0], [d[2] + 0.02, 0.1], [d[2] + 0.02, h], [d[2] - 0.1, h + 0.2], [0.18, h + 0.3], [0, h + 0.3]], 40)), X.acciaio));
        dw.add(m(lisce(lathe([[0, 0], [d[2] + 0.06, 0], [d[2] + 0.08, 0.35], [0, 0.42]], 32)), X.brina));
        dw.add(m(cil(0.12, 0.12, 0.2, 20), X.acciaioScuro, 0, h + 0.4, 0));
        for (var s = 0; s < 4; s++) {
          var sp = new T.Sprite(new T.SpriteMaterial({ map: texVapore(), transparent: true, depthWrite: false, opacity: 0.5 }));
          sp.scale.set(0.6, 0.6, 0.6);
          dw.add(sp);
          P.vapore.push({ o: sp, base: h + 0.5, fase: s / 4, x: (hash(k, s, 901) - 0.5) * 0.2 });
        }
        corpo.add(dw);
      });
      corpo.add(c.tubo([[-0.8, 2.1, 0], [-0.8, 2.6, 0], [0.75, 2.6, 0.2], [0.75, 2.4, 0.2]], 0.05, X.acciaio));
      var b = braccioRobot(0.8, 0.7, X.bianco, 1.0);
      b.gruppo.position.set(1.2, 0.15, -0.6);
      b.spalla.rotation.x = 0.4; b.gomito.rotation.x = 1.2;
      corpo.add(b.gruppo);
      P.oscilla.push({ o: b.torretta, asse: 'y', amp: 0.9, f: 0.35 });
      P.oscilla.push({ o: b.spalla, asse: 'x', amp: 0.2, f: 0.6 });
      occhio(P, corpo, 0x60c8ff, -0.8, 1.2, 0.6, 0.05);
      occhio(P, corpo, 0x60c8ff, 0.75, 1.3, 0.85, 0.05);
      corpo.add(faro(P, -1.3, 0.15, 0.9, 0x60c8ff));
      corpo.add(quadro(P, -1.6, 0.15, -0.6, 1.0, 'CRIOSTATO', '#80d8ff', ['> T = 77 K', '> LN2: perdita', '> sfiato: aperto', '> chiusura: NEGATA']));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* LA DOSE — il robot della farmacia automatica: la parete dei
       cassetti, il prelevatore sul binario, il nastro con i flaconi, la
       tramoggia di vetro piena di capsule */
    function dose() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(tonda(3.2, 2.8, 0.7, 0.05), X.bianco, 0, 1.4, -0.75));
      for (var r = 0; r < 6; r++) for (var cc = 0; cc < 7; cc++) {
        corpo.add(m(tonda(0.38, 0.36, 0.06, 0.02), cc % 3 ? X.grigio : X.blu, -1.35 + cc * 0.45, 0.4 + r * 0.42, -0.38));
        corpo.add(m(tonda(0.12, 0.03, 0.03, 0.01), X.cromo, -1.35 + cc * 0.45, 0.48 + r * 0.42, -0.34));
      }
      corpo.add(m(tonda(3.2, 0.12, 0.14, 0.03), X.acciaio, 0, 2.95, -0.2));
      var carr = new T.Group(); carr.position.set(0, 2.95, -0.2);
      carr.add(m(tonda(0.4, 0.3, 0.3, 0.05), X.blu, 0, -0.1, 0.05));
      var b = braccioRobot(0.6, 0.55, X.bianco, 0.8);
      b.gruppo.rotation.x = Math.PI;
      b.spalla.rotation.x = 0.6; b.gomito.rotation.x = 0.9;
      carr.add(b.gruppo);
      corpo.add(carr);
      P.scorre.push({ o: carr, asse: 'x', amp: 1.1, f: 0.4 });
      P.oscilla.push({ o: b.gomito, asse: 'x', amp: 0.3, f: 1.0 });
      corpo.add(m(tonda(3.0, 0.08, 0.5, 0.03), X.gomma, 0, 0.75, 0.35));
      corpo.add(m(tonda(3.0, 0.7, 0.45, 0.03), X.grigio, 0, 0.36, 0.35));
      var nastro = new T.Group(); nastro.position.set(0, 0.79, 0.35);
      for (var f = 0; f < 9; f++) {
        var fl = new T.Group(); fl.position.x = -1.3 + f * 0.32;
        fl.add(m(cil(0.06, 0.06, 0.16, 16), mat({ color: [0xd8a030, 0xf0f0f0, 0x6a4a2a][f % 3], roughness: 0.3,
                                                     transparent: f % 3 === 0, opacity: 0.85 }), 0, 0.08, 0));
        fl.add(m(cil(0.05, 0.05, 0.04, 16), mat({ color: 0xffffff, roughness: 0.4 }), 0, 0.18, 0));
        nastro.add(fl);
      }
      corpo.add(nastro);
      P.scorre.push({ o: nastro, asse: 'x', amp: 0.16, f: 0.9 });
      var tram = new T.Group(); tram.position.set(1.15, 1.3, 0.2);
      tram.add(m(lisce(lathe([[0.05, 0], [0.4, 0.45], [0.4, 0.9], [0, 0.9]], 32)), X.vetro, 0, 0, 0, false));
      for (var k = 0; k < (PS1 ? 20 : 46); k++) {
        var cap = new T.Group();
        var an = hash(k, 1, 1003) * 6.28, rr = Math.sqrt(hash(k, 2, 1003)) * 0.33;
        cap.position.set(Math.cos(an) * rr, 0.2 + hash(k, 3, 1003) * 0.55 * (0.4 + rr), Math.sin(an) * rr);
        cap.rotation.set(hash(k, 4, 1003) * 3, hash(k, 5, 1003) * 3, 0);
        var cc2 = [[0xc8402c, 0xf0ebe0], [0x2c5ac8, 0xe8d040], [0x30a050, 0xf0ebe0]][k % 3];
        cap.add(m(capsula(0.022, 0.04), mat({ color: cc2[0], roughness: 0.25 }), 0, 0.012, 0, false));
        cap.add(m(capsula(0.0222, 0.035), mat({ color: cc2[1], roughness: 0.25 }), 0, -0.016, 0, false));
        tram.add(cap);
      }
      corpo.add(tram);
      occhio(P, corpo, 0xff3030, -1.3, 2.75, -0.38, 0.05);
      corpo.add(faro(P, 1.4, 2.82, -0.4, 0xff4020));
      corpo.add(quadro(P, -1.95, 0, 0.4, 1.1, 'FARMACIA AUTO', '#ff8080', ['> lotto P12-SED', '> dosaggio: x40', '> esteri: stabili', '> stop: NEGATO']));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* IL DECADIMENTO — la cella calda per le scorie: la parete di schermo
       con la finestra al piombo, i manipolatori a pinza, la piscina con la
       luce blu di Cerenkov, i fusti */
    function decadimento() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(tonda(3.2, 2.6, 0.6, 0.06), X.cemento, 0, 1.3, -0.6));
      corpo.add(m(tonda(1.4, 0.9, 0.1, 0.03), mat({ color: 0x6a90a8, roughness: 0.05, transparent: true, opacity: 0.55 }), 0, 1.6, -0.28, false));
      corpo.add(m(tonda(1.55, 1.05, 0.06, 0.03), X.piombo, 0, 1.6, -0.32));
      corpo.add(m(cil(0.9, 0.95, 0.6, 40), X.cemento, 0, 0.3, 0.6));
      var acqua = mr(new T.CircleGeometry(0.82, sg(40)), mat({ color: 0x1a4aff, emissive: 0x2a6aff, emissiveIntensity: 1.6, roughness: 0.05 }),
                     0, 0.612, 0.6, -Math.PI / 2, 0, 0);
      corpo.add(acqua);
      var al = alone(0x3a7aff, 3.2, 0.55); al.position.set(0, 0.9, 0.6);
      corpo.add(al);
      P.occhi.push(acqua); P.pulsa.push(al);
      for (var e = 0; e < 7; e++) {
        var an = e / 7 * 6.28;
        corpo.add(m(tonda(0.12, 0.6, 0.12, 0.02), X.acciaio, Math.cos(an) * 0.45, 0.35, 0.6 + Math.sin(an) * 0.45));
      }
      [-1, 1].forEach(function (l) {
        var man = new T.Group(); man.position.set(l * 0.55, 2.0, -0.3);
        man.add(mr(cil(0.07, 0.07, 1.1, 20), X.acciaio, 0, 0, 0.55, Math.PI / 2, 0, 0));
        var gom = new T.Group(); gom.position.z = 1.1;
        gom.add(m(cil(0.05, 0.05, 0.9, 16), X.acciaio, 0, -0.45, 0));
        var pinza = new T.Group(); pinza.position.y = -0.9;
        [-1, 1].forEach(function (k) { pinza.add(mr(tonda(0.03, 0.18, 0.05, 0.01), X.cromo, k * 0.03, -0.08, 0, 0, 0, k * 0.3)); });
        gom.add(pinza);
        man.add(gom);
        corpo.add(man);
        P.oscilla.push({ o: gom, asse: 'x', amp: 0.35, f: 0.5 + l * 0.1 });
        P.oscilla.push({ o: man, asse: 'y', amp: 0.25, f: 0.4 });
      });
      var tF = pittura('fustoRadio', 128, 64, function (u, v, x, y) {
        var n = fbm(u * 10, v * 10, 3, 1160), gr = (hash(x, y, 1161) - 0.5) * 8;
        return [210 + n * 20 + gr, 170 + n * 20 + gr, 40 + gr];
      }, function (q) {
        q.fillStyle = '#151510';
        for (var i = 0; i < 3; i++) { q.beginPath(); q.moveTo(64, 32); q.arc(64, 32, 18, i * 2.094 - 0.52, i * 2.094 + 0.52); q.closePath(); q.fill(); }
        q.fillStyle = '#d4aa28'; q.beginPath(); q.arc(64, 32, 6, 0, 6.28); q.fill();
        q.fillStyle = '#151510'; q.beginPath(); q.arc(64, 32, 4, 0, 6.28); q.fill();
      });
      var mFusto = mat({ map: tF.map, roughness: 0.45, metalness: 0.3 });
      [[1.3, 0.5], [1.55, -0.1], [-1.4, 0.4]].forEach(function (p2) {
        var f = new T.Group(); f.position.set(p2[0], 0, p2[1]);
        f.add(m(lisce(lathe([[0, 0], [0.29, 0], [0.3, 0.05], [0.3, 0.86], [0.29, 0.9], [0, 0.9]], 32)), mFusto));
        [0.3, 0.6].forEach(function (y) { f.add(mr(new T.TorusGeometry(0.302, 0.012, 6, sg(32)), mFusto, 0, y, 0, Math.PI / 2, 0, 0)); });
        corpo.add(f);
      });
      corpo.add(faro(P, -1.3, 2.62, -0.5, 0xffb020));
      corpo.add(faro(P, 1.3, 2.62, -0.5, 0xffb020));
      corpo.add(quadro(P, 2.0, 0, 0.5, -1.2, 'CELLA CALDA', '#ffd040', ['> dose: 820 mSv/h', '> manipolatori: AUTO', '> schermo Pb: 30%', '> chiusura: NEGATA']));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* LA MELMA — il chiarificatore del depuratore: la vasca circolare, il
       fango lucido, il ponte raschiatore che gira, la pompa dei fanghi */
    function melma() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(lisce(lathe([[1.7, 0], [1.75, 0], [1.75, 0.85], [1.65, 0.9], [1.6, 0.1], [0, 0.1]], 48)), X.cemento));
      var fango = mr(new T.CircleGeometry(1.62, sg(48)), X.fango, 0, 0.72, 0, -Math.PI / 2, 0, 0);
      corpo.add(fango);
      for (var b = 0; b < 9; b++) {
        var bol = m(new T.SphereGeometry(0.05 + hash(b, 1, 1230) * 0.07, sg(16), sg(10), 0, Math.PI * 2, 0, Math.PI / 2), X.fango,
                    (hash(b, 2, 1230) - 0.5) * 2.4, 0.72, (hash(b, 3, 1230) - 0.5) * 2.4, false);
        corpo.add(bol); P.pulsa.push(bol);
      }
      var ponte = new T.Group(); ponte.position.y = 0.95;
      ponte.add(m(cil(0.18, 0.22, 0.5, 24), X.acciaioScuro, 0, 0.1, 0));
      ponte.add(m(tonda(3.5, 0.18, 0.4, 0.03), X.giallo, 0, 0.38, 0));
      ponte.add(m(tonda(3.5, 0.06, 0.06, 0.02), X.acciaio, 0, 0.75, 0.18));
      for (var p2 = 0; p2 < 6; p2++) {
        ponte.add(m(cil(0.015, 0.015, 0.38, 8), X.acciaio, -1.6 + p2 * 0.64, 0.57, 0.18));
        ponte.add(mr(tonda(0.4, 0.2, 0.03, 0.01), X.gomma, -1.5 + p2 * 0.6, -0.1, 0, 0, 0.6, 0));
      }
      corpo.add(ponte);
      P.ruota.push({ o: ponte, asse: 'y', v: 0.01 });
      var pmp = new T.Group(); pmp.position.set(-2.2, 0, 0.6);
      pmp.add(mr(lisce(cil(0.3, 0.3, 0.5, 28)), X.verde, 0, 0.4, 0, Math.PI / 2, 0, 0));
      pmp.add(mr(lisce(cil(0.25, 0.25, 0.6, 28)), X.grigio, 0, 0.4, -0.55, Math.PI / 2, 0, 0));
      corpo.add(pmp);
      corpo.add(c.tubo([[-2.2, 0.75, 0.6], [-2.0, 1.2, 0.6], [-1.6, 1.2, 0.4], [-1.2, 0.9, 0.3]], 0.12, X.acciaio));
      occhio(P, corpo, 0x9aff40, 0, 1.6, 0.25, 0.05);
      corpo.add(faro(P, 1.75, 0.9, 0, 0xffa020));
      corpo.add(quadro(P, 2.3, 0, -0.6, -1.3, 'CHIARIFICATORE', '#c0ff70', ['> torbidita: 9999', '> pH: 5.2', '> ponte: velocita max', '> arresto: NEGATO']));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* PROTOCOLLO 12 — il reattore: il recipiente in pressione con la
       calotta imbullonata, gli oblo da cui si vede il nucleo, i meccanismi
       delle barre di controllo, gli anelli magnetici che girano */
    function protocollo() {
      var X = MX(), P = parti(), g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(cil(1.6, 1.7, 0.3, 48), X.cemento, 0, 0.15, 0));
      corpo.add(m(lisce(lathe([[0, 0], [1.0, 0], [1.1, 0.2], [1.1, 2.4], [1.05, 2.6], [0, 2.6]], 48)), X.grigio, 0, 0.3, 0));
      corpo.add(m(cil(1.16, 1.16, 0.14, 48), X.acciaioScuro, 0, 2.75, 0));
      for (var b = 0; b < 24; b++) {
        var a = b / 24 * Math.PI * 2;
        corpo.add(m(cil(0.03, 0.03, 0.2, 8), X.cromo, Math.cos(a) * 1.1, 2.82, Math.sin(a) * 1.1));
      }
      corpo.add(m(lisce(new T.SphereGeometry(1.05, sg(48), sg(16), 0, Math.PI * 2, 0, Math.PI / 2)), X.grigio, 0, 2.82, 0));
      var nucleo = m(sfera(0.65, 40, 30), mat({ color: 0xffd090, emissive: 0xffa040, emissiveIntensity: 1.8, roughness: 0.4 }), 0, 1.5, 0, false);
      corpo.add(nucleo);
      P.nucleo = nucleo; P.occhi.push(nucleo); P.pulsa.push(nucleo);
      [0, 1, 2].forEach(function (k) {
        var an = k / 3 * Math.PI * 2 + Math.PI / 2;
        var fin = new T.Group(); fin.position.set(Math.cos(an) * 1.105, 1.5, Math.sin(an) * 1.105); fin.rotation.y = -an + Math.PI / 2;
        fin.add(m(new T.TorusGeometry(0.28, 0.05, sg(10), sg(32)), X.cromo));
        fin.add(m(new T.CircleGeometry(0.27, sg(28)), mat({ color: 0xffc070, emissive: 0xff9030, emissiveIntensity: 1.6, roughness: 0.1 }), 0, 0, 0.01, false));
        var a2 = alone(0xffa040, 1.6, 0.6); a2.position.z = 0.15;
        fin.add(a2);
        P.pulsa.push(a2);
        corpo.add(fin);
      });
      var barre = new T.Group(); barre.position.y = 3.1;
      for (var r = 0; r < 5; r++) {
        var an2 = r / 5 * Math.PI * 2;
        var bar = new T.Group(); bar.position.set(Math.cos(an2) * 0.45, 0, Math.sin(an2) * 0.45);
        bar.add(m(cil(0.07, 0.07, 0.8, 16), X.acciaioScuro, 0, 0.4, 0));
        bar.add(m(cil(0.09, 0.09, 0.12, 16), X.giallo, 0, 0.82, 0));
        barre.add(bar);
        P.saliscendi.push({ o: bar, amp: 0.12, f: 0.6 + r * 0.15 });
      }
      corpo.add(barre);
      [0, 1].forEach(function (i) {
        var an3 = new T.Group(); an3.position.y = 1.5;
        an3.rotation.x = i ? 0.35 : -0.35;
        an3.add(mr(new T.TorusGeometry(1.6 + i * 0.25, 0.08, sg(14), sg(64)), X.cromo, 0, 0, 0, Math.PI / 2, 0, 0));
        for (var s = 0; s < 6; s++) {
          var an4 = s / 6 * Math.PI * 2;
          an3.add(m(tonda(0.24, 0.24, 0.24, 0.05), X.rame, Math.cos(an4) * (1.6 + i * 0.25), 0, Math.sin(an4) * (1.6 + i * 0.25)));
        }
        corpo.add(an3);
        P.ruota.push({ o: an3, asse: 'y', v: 0.008 * (i ? -1 : 1) });
      });
      corpo.add(c.tubo([[1.1, 0.8, 0], [1.6, 0.8, 0], [2.1, 0.5, 0.3], [2.3, 0.0, 0.5]], 0.15, X.acciaio));
      corpo.add(c.tubo([[-1.1, 2.0, 0], [-1.7, 2.2, 0], [-2.1, 1.0, -0.4], [-2.2, 0.0, -0.5]], 0.15, X.acciaio));
      corpo.add(faro(P, 1.4, 0.3, 1.1, 0xff3020));
      corpo.add(faro(P, -1.4, 0.3, -1.1, 0xff3020));
      corpo.add(quadro(P, 2.2, 0, -1.2, -0.9, 'PROTOCOLLO 12', '#ff7050', ['> reattivita: +4.2', '> autocatalisi: SI', '> barre: bloccate', '> SCRAM: NEGATO']));
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    function guardiano(tipo) {
      var f = { pompa: pompa, polimero: polimero, spettro: spettro, elica: elica, protocollo: protocollo,
                cella: cella, gelo: gelo, dose: dose, decadimento: decadimento, melma: melma }[tipo] || pompa;
      var r = f();
      r.gruppo.add(ombraContatto(2.0));
      return r;
    }

    /* ═════════════════════════════════════════════════════════════════════
       I RESIDUI — chiazze di solvente che si muovono

       Una pozza lucida e irregolare che scivola sul pavimento, con le bolle
       che si gonfiano e i vapori che salgono. Una sostanza, non una
       creatura: e' per questo che un ossidante la degrada.
       ═════════════════════════════════════════════════════════════════════ */
    function residuo(colore) {
      var tinta = new T.Color(colore || 0x5fbf2a);
      var mt = mat({ color: tinta.clone().multiplyScalar(0.55), roughness: 0.04, metalness: 0.1, env: 1.6,
                     transparent: !PS1, opacity: PS1 ? 1 : 0.9, emissive: tinta, emissiveIntensity: 0.12 });
      var g = new T.Group();
      var corpo = new T.Group();
      g.add(corpo);
      var geo = new T.CylinderGeometry(0.55, 0.62, 0.06, sg(48), 2);
      var p = geo.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), z = p.getZ(i), y = p.getY(i);
        var a = Math.atan2(z, x), d = 1 + (fbm(Math.cos(a) * 2 + 3, Math.sin(a) * 2 + 3, 3, 1301) - 0.5) * 0.7;
        p.setXYZ(i, x * d, y + (y > 0 ? Math.max(0, 1 - Math.hypot(x, z) / 0.6) * 0.04 : 0), z * d * 1.15);
      }
      var pozza = m(lisce(geo), mt, 0, -0.31, 0, false);
      corpo.add(pozza);
      var bolle = [];
      for (var b = 0; b < 6; b++) {
        var bol = m(new T.SphereGeometry(0.04 + hash(b, 1, 1310) * 0.05, sg(16), sg(10), 0, Math.PI * 2, 0, Math.PI / 2), mt,
                    (hash(b, 2, 1310) - 0.5) * 0.7, -0.28, (hash(b, 3, 1310) - 0.5) * 0.8, false);
        corpo.add(bol); bolle.push(bol);
      }
      var vapori = [];
      for (var v = 0; v < 4; v++) {
        var sp = new T.Sprite(new T.SpriteMaterial({ map: texVapore(), color: tinta.clone().lerp(new T.Color(0xffffff), 0.6),
                                                      transparent: true, depthWrite: false, opacity: 0.35 }));
        sp.scale.set(0.5, 0.5, 0.5);
        corpo.add(sp); vapori.push(sp);
      }
      var al = alone(tinta, 1.0, 0.18); al.position.y = -0.25;
      corpo.add(al);
      function deforma(t) {
        pozza.scale.set(1 + Math.sin(t * 2.1) * 0.05, 1, 1 + Math.cos(t * 1.7) * 0.05);
        pozza.rotation.y = Math.sin(t * 0.3) * 0.3;
        bolle.forEach(function (bo, i) {
          var k = (t * 0.6 + i / bolle.length) % 1;
          bo.scale.setScalar(0.2 + k * 1.1);
          bo.visible = k < 0.92;
        });
        vapori.forEach(function (s, i) {
          var k = (t * 0.25 + i / vapori.length) % 1;
          s.position.set(Math.sin(i * 2.1 + t * 0.4) * 0.2, -0.25 + k * 1.1, Math.cos(i * 1.3) * 0.2);
          s.material.opacity = 0.35 * (1 - k);
          s.scale.setScalar(0.3 + k * 0.6);
        });
      }
      return { gruppo: g, corpo: corpo, deforma: deforma };
    }

    /* ═════════════════════════════════════════════════════════════════════
       LA PRIMA PERSONA — le braccia e lo strumento

       In prima persona quello che si vede di se' sono le braccia, e le si
       guarda per tutta la partita: devono essere la cosa piu' curata del
       gioco. Maniche del camice con il polsino e le pieghe nella mappa di
       rilievo, il bordo del guanto che esce, mani in nitrile con le tre
       falangi per dito e le nocche, e nella destra il DISPENSATORE: lo
       strumento con cui si usa la chimica — corpo in polimero bianco con gli
       anelli cromati, la fiala di vetro con il composto scelto, lo schermo
       con la formula, l'ugello con il LED del colore del composto.

       Le coordinate sono quelle della telecamera delle braccia: x a destra,
       y in alto, -z davanti. Il polso e' l'origine di ogni mano.
       ═════════════════════════════════════════════════════════════════════ */
    function braccia() {
      var MB = {
        manica: materiale(texCamice('manicaFP', 128, 128), { roughness: 0.8, rilievo: 0.9 }),
        guanto: materiale(pittura('nitrileFP', 128, 128, function (u, v) {
          var gr = (fbm(u * 40, v * 40, 3, 901) - 0.5) * 8;
          var grinza = Math.pow(Math.abs(Math.sin(v * 60 + fbm(u * 6, v * 6, 2, 902) * 8)), 12) * 14;
          return [78 + gr - grinza, 132 + gr - grinza, 200 + gr - grinza * 0.6];
        }, null, function (u, v) {
          return fbm(u * 40, v * 40, 3, 901) * 0.3 + Math.pow(Math.abs(Math.sin(v * 60 + fbm(u * 6, v * 6, 2, 902) * 8)), 12) * 0.6;
        }, 1.4), { roughness: 0.32, rilievo: 0.7 }),
        polimero: mat({ color: 0xc9cdd1, roughness: 0.42, metalness: 0.05 }),
        grigio: mat({ color: 0x3a4048, roughness: 0.5, metalness: 0.3 }),
        gomma: mat({ color: 0x1e2226, roughness: 0.75 }),
        cromo: mat({ color: 0xdfe4e8, roughness: 0.1, metalness: 1, env: 1.5 }),
        vetro: mat({ vetro: true, color: 0xeaf6ff })
      };
      function rad(geo) { return geo.rotateX(-Math.PI / 2); }      /* asse y → asse -z */
      /* una falange lungo -z, con la nocca */
      function falange(r, l) {
        var gg = new T.Group();
        /* le falangi si sovrappongono un poco: un dito e' un tubo che si
           piega, non una fila di perline */
        var geo = rad(capsula(r, l * 1.15));
        geo.translate(0, 0, -l / 2);
        gg.add(m(geo, MB.guanto, 0, 0, 0, false));
        return gg;
      }
      /* un dito: tre falangi che si piegano attorno all'asse dato */
      function dito(lung, r, curve, asse) {
        var radice = new T.Group(), giunti = [], cur = radice;
        var pez = [lung * 0.46, lung * 0.31, lung * 0.23];
        pez.forEach(function (l2, i) {
          var f = falange(r * (1 - i * 0.1), l2);
          if (i) f.position.z = -pez[i - 1];
          f.rotation[asse] = curve[i];
          cur.add(f); giunti.push(f); cur = f;
        });
        return { gruppo: radice, giunti: giunti };
      }
      /* la manica: dal polso verso il gomito (+z), un po' in basso */
      function manica(lato) {
        var g = new T.Group();
        /* un tubo aperto: dal polsino esce il guanto, come in una manica vera */
        var prof = [[0.047, 0.03], [0.05, -0.012], [0.054, 0.0], [0.054, 0.03], [0.05, 0.04], [0.052, 0.12],
                    [0.058, 0.3], [0.062, 0.55]];
        var geo = lathe(prof, 36);
        geo.rotateX(Math.PI / 2);
        var tubo2 = m(lisce(geo), MB.manica, 0, 0, 0, false);
        tubo2.material = MB.manica.clone(); tubo2.material.side = T.DoubleSide;
        g.add(tubo2);
        /* l'interno, in ombra */
        var dentro = new T.Mesh(new T.CircleGeometry(0.046, sg(28)), mat({ color: 0x2a2c30, roughness: 1 }));
        dentro.position.z = 0.03;
        g.add(dentro);
        /* la cucitura del polsino */
        var cuc = new T.Mesh(new T.TorusGeometry(0.0545, 0.0025, 6, sg(40)), MB.manica);
        cuc.position.z = 0.032;
        g.add(cuc);
        /* il bordo del guanto che esce dal polsino */
        var bordo = new T.Mesh(new T.CylinderGeometry(0.043, 0.04, 0.05, sg(28), 1, true), MB.guanto);
        bordo.rotation.x = Math.PI / 2; bordo.position.z = -0.005;
        g.add(bordo);
        g.add(m(new T.TorusGeometry(0.043, 0.004, 6, sg(28)), MB.guanto, 0, 0, -0.03, false));
        return g;
      }
      /* il palmo: un ellissoide schiacciato, piu' largo verso le nocche */
      function palmo(largo, alto, spesso) {
        var geo = lisce(lathe([[0, 0], [0.6, 0.06], [0.9, 0.3], [1.0, 0.65], [0.85, 0.95], [0, 1]], 24));
        geo.scale(largo, 0.092, spesso);
        geo.rotateX(-Math.PI / 2);
        return m(geo, MB.guanto, 0, 0, 0, false);
      }

      /* ── la mano destra, che impugna il dispensatore ── */
      var dx = new T.Group();
      dx.add(manica(1));
      var mD = new T.Group();
      mD.rotation.x = -0.34;                  /* il polso alza la mano rispetto all'avambraccio */
      dx.add(mD);
      var pD = palmo(0.045, 0.092, 0.02);
      pD.rotation.z = Math.PI / 2;            /* palmo verso sinistra: impugnatura */
      mD.add(pD);
      var ditaD = [];
      [[0.028, 0.085, 0.0098], [0.006, 0.092, 0.0102], [-0.016, 0.087, 0.0097], [-0.036, 0.072, 0.0086]].forEach(function (d, i) {
        var dd = dito(d[1], d[2] * 0.9, [0.95 + i * 0.05, 1.2, 0.85], 'y');
        dd.gruppo.position.set(-0.006, d[0], -0.088);
        dd.gruppo.rotation.y = 0.15;
        mD.add(dd.gruppo);
        ditaD.push(dd);
      });
      /* il pollice, che si appoggia sul fianco del dispensatore */
      var polD = dito(0.07, 0.0108, [0.25, 0.2, 0.15], 'y');
      polD.gruppo.position.set(-0.022, 0.038, -0.035);
      polD.gruppo.rotation.set(0.35, 0.55, 0.3);
      mD.add(polD.gruppo);

      /* il dispensatore */
      var disp = new T.Group();
      disp.position.set(-0.03, 0.06, -0.06);
      mD.add(disp);
      /* l'impugnatura, dentro le dita */
      var imp = m(tonda(0.03, 0.12, 0.045, 0.012), MB.gomma, 0, -0.045, -0.035, false);
      imp.rotation.x = 0.28;
      disp.add(imp);
      /* il corpo, con gli anelli cromati */
      var corpoD = m(rad(lisce(lathe([[0, -0.03], [0.03, -0.03], [0.034, -0.022], [0.034, 0.12], [0.026, 0.15], [0, 0.152]], 32))),
                     MB.polimero, 0, 0.02, 0, false);
      disp.add(corpoD);
      [-0.01, 0.04, 0.1].forEach(function (z) {
        disp.add(m(new T.TorusGeometry(0.0345, 0.003, 8, sg(32)), MB.cromo, 0, 0.02, -z, false));
      });
      disp.add(m(rad(cil(0.0345, 0.0345, 0.03, 32)), MB.grigio, 0, 0.02, -0.07, false));
      /* il fondo piatto, scuro, con lo schermo */
      disp.add(m(rad(cil(0.0345, 0.0345, 0.012, 32)), MB.grigio, 0, 0.02, 0.026, false));
      /* l'ugello */
      var ugello = m(rad(lisce(lathe([[0.016, 0], [0.012, 0.03], [0.006, 0.05], [0, 0.052]], 20))), MB.cromo, 0, 0.02, -0.15, false);
      disp.add(ugello);
      var ledMat = mat({ color: 0x111111, emissive: 0x5ef0c4, emissiveIntensity: 2.2, roughness: 0.3 });
      var led = m(new T.TorusGeometry(0.018, 0.003, 8, sg(24)), ledMat, 0, 0.02, -0.152, false);
      disp.add(led);
      var aloneLed = alone(0x5ef0c4, 0.07, 0.8); aloneLed.position.set(0, 0.02, -0.16);
      disp.add(aloneLed);
      /* la fiala di vetro sopra, con il liquido del composto */
      var supp = m(tonda(0.03, 0.012, 0.09, 0.004), MB.grigio, 0, 0.055, -0.03, false);
      disp.add(supp);
      var fiala = m(rad(cil(0.0135, 0.0135, 0.085, 24, true)), MB.vetro, 0, 0.076, -0.03, false);
      disp.add(fiala);
      var liqMat = mat({ color: 0x5ef0c4, emissive: 0x5ef0c4, emissiveIntensity: 0.35, roughness: 0.1, transparent: true, opacity: 0.85 });
      var liquido = m(rad(cil(0.0115, 0.0115, 0.07, 20)), liqMat, 0, 0.076, -0.03, false);
      disp.add(liquido);
      [-0.065, 0.005].forEach(function (z) { disp.add(m(rad(cil(0.016, 0.016, 0.008, 20)), MB.cromo, 0, 0.076, z, false)); });
      /* lo schermo sul retro, rivolto a chi impugna */
      var cvS = nuovaTela(128, 64);
      var tS = new T.CanvasTexture(cvS); tS.encoding = T.sRGBEncoding;
      var schermo = new T.Mesh(new T.PlaneGeometry(0.046, 0.023), new T.MeshBasicMaterial({ map: tS, toneMapped: false }));
      schermo.position.set(0, 0.02, 0.0335);
      schermo.rotation.x = 0;

      disp.add(schermo);
      function aggiorna(testo, sotto, colore) {
        var q = cvS.getContext('2d');
        var col = '#' + new T.Color(colore).getHexString();
        q.fillStyle = '#04120f'; q.fillRect(0, 0, 128, 64);
        q.fillStyle = col; q.font = 'bold 26px monospace'; q.textAlign = 'center';
        q.fillText(testo || '—', 64, 34);
        q.font = '13px monospace'; q.fillStyle = '#9fe8d0';
        q.fillText(sotto || '', 64, 54);
        tS.needsUpdate = true;
        liqMat.color.setHex(colore); liqMat.emissive.setHex(colore);
        ledMat.emissive.setHex(colore);
        aloneLed.material.color.setHex(colore);
        liquido.visible = !!testo;
      }
      aggiorna('', '', 0x5ef0c4);

      /* ── la mano sinistra, libera: si allunga per prendere e toccare ── */
      var sx = new T.Group();
      sx.add(manica(-1));
      var mS = new T.Group();
      sx.add(mS);
      var pS = palmo(0.046, 0.092, 0.02);
      mS.add(pS);
      [[-0.028, 0.08], [-0.008, 0.088], [0.012, 0.084], [0.03, 0.07]].forEach(function (d, i) {
        var dd = dito(d[1], 0.0095, [0.18 + i * 0.03, 0.22, 0.16], 'x');
        dd.gruppo.position.set(d[0], 0, -0.088);
        dd.gruppo.rotation.y = (d[0]) * 1.5;
        dd.gruppo.rotation.x = 0;
        dd.giunti.forEach(function (gg) { gg.rotation.x = -gg.rotation.x; });
        mS.add(dd.gruppo);
      });
      var polS = dito(0.068, 0.0105, [0.2, 0.15, 0.1], 'y');
      polS.gruppo.position.set(0.04, -0.008, -0.03);
      polS.gruppo.rotation.set(-0.2, -0.7, -0.4);
      mS.add(polS.gruppo);

      var g = new T.Group();
      g.add(dx); g.add(sx);
      return { gruppo: g, dx: dx, sx: sx, manoDx: mD, manoSx: mS, ditaDx: ditaD,
               dispensatore: { gruppo: disp, ugello: ugello, aggiorna: aggiorna, led: led } };
    }

    api.braccia = braccia;
    api.chimico = chimico;
    api.residuo = residuo;
    api.guardiano = guardiano;
    api.alone = alone;
    api.GUARDIANI_MODELLI = ['pompa', 'polimero', 'spettro', 'elica', 'cella', 'gelo', 'dose', 'decadimento', 'melma', 'protocollo'];
    return api;
  }

  globale.BSIAtomicFigure = { installa: installa, versione: '2.0' };

})(typeof window !== 'undefined' ? window : globalThis);
