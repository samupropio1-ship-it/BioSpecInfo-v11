/* ═══════════════════════════════════════════════════════════════════════════
   bsi-atomic-figure.js — le figure di ATOMIC PROTOCOL
   BioSpecInfo · © Samuele Pio Provenzano

   IL PROTAGONISTA, I RESIDUI, I DIECI GUARDIANI

   Il riferimento e' il realismo grezzo dei migliori titoli PlayStation 1 —
   Resident Evil 1 e 2, Silent Hill, Metal Gear Solid, Parasite Eve — e il
   loro trucco e' sempre lo stesso: POCHI POLIGONI E TEXTURE DIPINTE. Il viso
   di Chris Redfield sono una ventina di triangoli; quello che lo rende un
   uomo e' un'immagine di 64 pixel con gli occhi, le sopracciglia, l'ombra
   del naso e la barba di un giorno. Qui si fa lo stesso:

     · ogni figura e' fatta di poche centinaia di poligoni, con proporzioni
       umane (un metro e settantotto, la testa un ottavo dell'altezza);
     · le texture sono DIPINTE da codice, a bassa risoluzione, con il viso,
       le pieghe del camice, le macchie di reagente, la ruggine che cola, la
       carne con le vene — e niente filtro, in PS1: pixel netti;
     · le forme organiche sono superfici DEFORMATE dal rumore, mai sfere
       pulite; quelle industriali sono ammaccate, spezzate, incrostate.

   Niente anelli perfetti, cristalli puliti o melme simpatiche: i guardiani
   sono quello che resta di macchine e persone dopo un esperimento andato
   male.

   Il modulo non crea niente da solo: `bsi-atomic-grafica.js` lo chiama e gli
   passa i suoi strumenti (materiali, rumore, geometrie arrotondate), e lui
   aggiunge `chimico`, `residuo` e `guardiano`. Una casa per le figure.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function installa(api, T, c) {
    var PS1 = c.PS1, ALTA = c.ALTA, M = c.M;
    var mat = c.mat, hash = c.hash, rumore = c.rumore, fbm = c.fbm;
    var cache = {};
    var S2 = PS1 ? 1 : 2;              /* le texture raddoppiano fuori dal PS1 */

    /* ═════════════════════════════════════════════════════════════════════
       STRUMENTI
       ═════════════════════════════════════════════════════════════════════ */

    /* una texture dipinta: prima ogni pixel (rumore, grana, colature), poi
       i tratti a pennello (occhi, cuciture, etichette) */
    function pittura(nome, w, h, pixel, pennello) {
      if (cache[nome]) return cache[nome];
      var cv = document.createElement('canvas');
      cv.width = w * S2; cv.height = h * S2;
      var q = cv.getContext('2d');
      if (pixel) {
        var img = q.createImageData(cv.width, cv.height);
        for (var y = 0; y < cv.height; y++) {
          for (var x = 0; x < cv.width; x++) {
            var p = pixel(x / cv.width, y / cv.height, x / S2, y / S2);
            var k = (y * cv.width + x) * 4;
            img.data[k] = p[0]; img.data[k + 1] = p[1]; img.data[k + 2] = p[2];
            img.data[k + 3] = p[3] == null ? 255 : p[3];
          }
        }
        q.putImageData(img, 0, 0);
      }
      if (pennello) { q.save(); q.scale(S2, S2); pennello(q, w, h); q.restore(); }
      var t = new T.CanvasTexture(cv);
      t.encoding = T.sRGBEncoding;
      t.wrapS = t.wrapT = T.RepeatWrapping;
      if (PS1) { t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; }
      else t.anisotropy = 4;
      cache[nome] = t;
      return t;
    }
    function cl(v) { return v < 0 ? 0 : (v > 255 ? 255 : v); }

    /* rumore in tre dimensioni, abbastanza per deformare una superficie */
    function n3(x, y, z, s) {
      return (rumore(x + z * 0.37, y, s) + rumore(y + x * 0.21, z, s + 3) +
              rumore(z + y * 0.53, x, s + 7)) / 3;
    }

    /* normali «lisce» anche su una geometria a facce separate: si mediano le
       normali dei vertici che stanno nello stesso punto. E' la luce di
       Gouraud della PS1: sfumata fra un vertice e l'altro */
    function lisce(geo) {
      if (geo.index) geo = geo.toNonIndexed();
      geo.computeVertexNormals();
      var p = geo.attributes.position, n = geo.attributes.normal;
      var somma = {};
      var i, ch;
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

    /* un grumo: un icosaedro deformato dal rumore. Carne, incrostazione,
       fango, plastica fusa: tutto quello che non ha una forma sua */
    function grumo(r, det, amp, seme, sx, sy, sz) {
      var g = new T.IcosahedronGeometry(r, PS1 ? Math.max(1, det - 1) : det);
      var p = g.attributes.position;
      var f = 2.2 / r;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        var d = 1 + (n3(x * f, y * f, z * f, seme) - 0.5) * 2 * amp +
                    (n3(x * f * 2.7, y * f * 2.7, z * f * 2.7, seme + 11) - 0.5) * amp * 0.6;
        p.setXYZ(i, x * d * (sx || 1), y * d * (sy || 1), z * d * (sz || 1));
      }
      return lisce(g);
    }

    /* deformare qualunque geometria spingendo i vertici lungo la normale:
       ammaccature su un serbatoio, nodi su un tubo, pieghe su una manica */
    function ammacca(geo, amp, freq, seme) {
      if (!geo.attributes.normal) geo.computeVertexNormals();
      var p = geo.attributes.position, n = geo.attributes.normal;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        var d = (n3(x * freq, y * freq, z * freq, seme) - 0.5) * 2 * amp;
        p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
      }
      return lisce(geo);
    }

    /* un tubo irregolare lungo una curva: tendini, cavi, filamenti, radici */
    function filo(punti, r, materiale, irr, seme, rastrema) {
      var curva = new T.CatmullRomCurve3(punti.map(function (q) { return new T.Vector3(q[0], q[1], q[2]); }));
      var g = new T.TubeGeometry(curva, PS1 ? 10 : 24, r, PS1 ? 5 : 8, false);
      var p = g.attributes.position, nn = g.attributes.normal;
      var segs = (PS1 ? 10 : 24) + 1, rad = (PS1 ? 5 : 8) + 1;
      for (var i = 0; i < p.count; i++) {
        var lungo = Math.floor(i / rad) / (segs - 1);
        var k = rastrema ? (1 - lungo * rastrema) : 1;
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        var d = ((n3(x * 6, y * 6, z * 6, seme || 1) - 0.5) * 2 * (irr || 0.3) * r) - (1 - k) * r;
        p.setXYZ(i, x + nn.getX(i) * d, y + nn.getY(i) * d, z + nn.getZ(i) * d);
      }
      return new T.Mesh(lisce(g), materiale);
    }

    function m(geo, materiale, x, y, z, ombre) {
      var o = new T.Mesh(geo, materiale);
      o.position.set(x || 0, y || 0, z || 0);
      if (ombre !== false && !PS1) { o.castShadow = true; o.receiveShadow = true; }
      return o;
    }

    /* l'ombra a macchia: un disco scuro sfumato sotto i piedi. In PS1 le
       ombre vere non c'erano, e una figura senza ombra galleggia */
    function ombraBlob(r) {
      var t = pittura('blob', 32, 32, function (u, v) {
        var d = Math.hypot(u - 0.5, v - 0.5) * 2;
        return [0, 0, 0, cl(200 * Math.max(0, 1 - d * d))];
      });
      var o = new T.Mesh(new T.CircleGeometry(r, 16),
        new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: ALTA ? 0.35 : 0.8 }));
      o.rotation.x = -Math.PI / 2;
      o.position.y = 0.012;
      o.renderOrder = 1;
      return o;
    }

    /* ═════════════════════════════════════════════════════════════════════
       LE TEXTURE DEL PROTAGONISTA
       ═════════════════════════════════════════════════════════════════════ */
    var PELLE = [196, 158, 134];

    /* IL VISO. La testa ha due proiezioni piane: la meta' sinistra della
       texture e' la faccia vista di fronte, la destra la nuca vista da
       dietro. Una proiezione piana, a differenza di quella sferica, mette
       gli occhi dove devono stare e non li stira ai lati. */
    function texViso() {
      return pittura('viso', 256, 128, function (u, v, px, py) {
        var fronte = u < 0.5;
        var X = fronte ? (u / 0.5) * 2 - 1 : -((u - 0.5) / 0.5 * 2 - 1);
        var Y = 1 - v * 2;
        var gr = (fbm(px * 0.4, py * 0.4, 3, 5) - 0.5) * 18;
        var capelli;
        if (fronte) {
          var hl = Math.abs(X) < 0.74 ? 0.6 - 0.12 * X * X : 0.06;
          capelli = Y > hl + (hash(Math.floor(px), 3, 9) - 0.5) * 0.05;
        } else capelli = Y > -0.28;
        if (capelli) {
          var ciocca = fbm(px * 0.25, py * 1.4, 3, 8);
          var c = 40 + ciocca * 30 + gr * 0.5;
          return [cl(c * 1.05), cl(c * 0.82), cl(c * 0.66)];
        }
        var r = PELLE[0] + gr, g = PELLE[1] + gr * 0.9, b = PELLE[2] + gr * 0.8;
        if (fronte) {
          /* le guance in ombra ai lati, come una luce dall'alto: e' la luce
             «dipinta» dei volti PS1 */
          var lato = Math.max(0, Math.abs(X) - 0.45) * 0.55;
          var sotto = Y < -0.62 ? (-0.62 - Y) * 0.5 : 0;
          var k = 1 - lato - sotto;
          r *= k; g *= k; b *= k;
          /* la barba di un giorno */
          if ((Y < -0.3 && Math.abs(X) < 0.82) || (Y < -0.18 && Math.abs(X) > 0.55 && Math.abs(X) < 0.85)) {
            var bb = hash(Math.floor(px), Math.floor(py), 17) > 0.45 ? 0.82 : 0.93;
            r *= bb; g *= bb * 0.98; b *= bb * 0.98;
          }
          /* le guance un po' arrossate */
          var gu = Math.max(0, 1 - Math.hypot(Math.abs(X) - 0.45, Y + 0.12) / 0.22);
          r += gu * 10; g -= gu * 2;
        } else {
          var nuca = Y < -0.55 ? 0.85 : 0.95;
          r *= nuca; g *= nuca; b *= nuca;
        }
        return [cl(r), cl(g), cl(b)];
      }, function (q, w, h) {
        function F(X, Y) { return [(X * 0.5 + 0.5) * 128, (0.5 - Y * 0.5) * 128]; }
        function linea(pts, col, lw) {
          q.strokeStyle = col; q.lineWidth = lw; q.lineCap = 'round';
          q.beginPath();
          pts.forEach(function (pt, i) { var a = F(pt[0], pt[1]); if (i) q.lineTo(a[0], a[1]); else q.moveTo(a[0], a[1]); });
          q.stroke();
        }
        function ellisse(X, Y, rx, ry, col) {
          var a = F(X, Y);
          q.fillStyle = col; q.beginPath();
          q.ellipse(a[0], a[1], rx * 64, ry * 64, 0, 0, 6.2832); q.fill();
        }
        [-1, 1].forEach(function (l) {
          /* le orbite in ombra, le occhiaie di chi non dorme da due giorni */
          ellisse(l * 0.36, 0.11, 0.2, 0.1, 'rgba(70,40,30,0.28)');
          ellisse(l * 0.36, 0.02, 0.15, 0.05, 'rgba(80,45,40,0.25)');
          /* l'occhio: bianco sporco, iride scura, palpebra */
          ellisse(l * 0.36, 0.13, 0.12, 0.045, '#d9d0c4');
          ellisse(l * 0.34, 0.13, 0.05, 0.045, '#3a2a1e');
          ellisse(l * 0.34, 0.13, 0.022, 0.022, '#0d0806');
          linea([[l * 0.22, 0.15], [l * 0.36, 0.185], [l * 0.5, 0.15]], '#2a1a12', 1.6);
          linea([[l * 0.25, 0.09], [l * 0.47, 0.095]], 'rgba(90,50,40,.5)', 1);
          /* le sopracciglia, folte e un po' aggrottate */
          linea([[l * 0.13, 0.27], [l * 0.32, 0.33], [l * 0.56, 0.3]], '#2b1c13', 3.2);
          /* le pieghe naso-labiali */
          linea([[l * 0.17, -0.22], [l * 0.25, -0.38], [l * 0.27, -0.5]], 'rgba(90,50,40,.4)', 1.2);
        });
        /* il naso: l'ombra del dorso, la punta, le narici */
        linea([[0.1, 0.1], [0.13, -0.12], [0.15, -0.25]], 'rgba(100,60,45,.45)', 2.2);
        linea([[-0.1, 0.1], [-0.12, -0.12], [-0.14, -0.25]], 'rgba(120,75,55,.25)', 1.6);
        ellisse(0, -0.31, 0.15, 0.045, 'rgba(90,50,40,.45)');
        ellisse(-0.06, -0.3, 0.025, 0.018, '#3a2018');
        ellisse(0.06, -0.3, 0.025, 0.018, '#3a2018');
        ellisse(0, -0.2, 0.05, 0.05, 'rgba(230,180,150,.35)');
        /* la bocca: chiusa, seria */
        linea([[-0.2, -0.51], [-0.07, -0.495], [0.07, -0.495], [0.2, -0.515]], '#5a2c24', 2);
        ellisse(0, -0.56, 0.13, 0.03, 'rgba(160,90,80,.55)');
        ellisse(0, -0.75, 0.08, 0.04, 'rgba(90,60,50,.25)');
        /* una cicatrice sottile sul sopracciglio: un incidente di laboratorio */
        linea([[0.42, 0.37], [0.5, 0.25]], 'rgba(220,170,150,.7)', 1);
      });
    }

    var CAMICE = [206, 202, 190];
    function pixelCamice(seme, pieghe) {
      return function (u, v, px, py) {
        var gr = (fbm(px * 0.5, py * 0.5, 3, seme) - 0.5) * 14;
        /* le pieghe: ombre verticali ondulate, piu' marcate in basso */
        var pg = fbm(u * 9 + Math.sin(v * 7) * 0.2, v * 1.5, 3, seme + 1);
        var piega = Math.pow(Math.abs(pg - 0.5) * 2, 2.2) * (pieghe || 38);
        /* lo sporco: in fondo, ai lati, e qualche alone di reagente */
        var basso = Math.max(0, v - 0.75) * 70 * fbm(u * 12, v * 4, 2, seme + 2);
        var macchia = fbm(u * 5, v * 5, 3, seme + 3);
        var r = CAMICE[0] + gr - piega - basso, g = CAMICE[1] + gr - piega - basso, b = CAMICE[2] + gr - piega - basso * 1.1;
        if (macchia > 0.68) { var mm = (macchia - 0.68) * 3.2; r -= 20 * mm; g -= 34 * mm; b -= 70 * mm; }
        if (macchia < 0.26) { var mb = (0.26 - macchia) * 3.5; r -= 55 * mb; g -= 70 * mb; b -= 75 * mb; }
        return [cl(r), cl(g), cl(b)];
      };
    }

    /* il busto del camice: davanti ci sono il colletto aperto con la camicia
       e la cravatta, l'abbottonatura, il taschino con la penna e il
       dosimetro, il cartellino con la foto. Il davanti e' al centro (u=0,5) */
    function texCamiceBusto() {
      return pittura('camiceBusto', 128, 128, pixelCamice(31, 34), function (q) {
        /* l'apertura a V: camicia azzurrina e cravatta scura */
        q.fillStyle = '#9fb3c4';
        q.beginPath(); q.moveTo(48, 0); q.lineTo(64, 46); q.lineTo(80, 0); q.closePath(); q.fill();
        q.fillStyle = '#3a2f3a';
        q.beginPath(); q.moveTo(61, 4); q.lineTo(64, 40); q.lineTo(67, 4); q.closePath(); q.fill();
        /* i revers, con il bordo in ombra */
        q.strokeStyle = 'rgba(80,78,70,.8)'; q.lineWidth = 1.5;
        q.beginPath(); q.moveTo(44, 0); q.lineTo(64, 50); q.lineTo(84, 0); q.stroke();
        q.strokeStyle = 'rgba(120,118,110,.6)'; q.lineWidth = 1;
        q.beginPath(); q.moveTo(40, 0); q.lineTo(52, 30); q.moveTo(88, 0); q.lineTo(76, 30); q.stroke();
        /* l'abbottonatura e i bottoni */
        q.strokeStyle = 'rgba(110,108,100,.7)';
        q.beginPath(); q.moveTo(65, 50); q.lineTo(65, 128); q.stroke();
        q.fillStyle = '#e8e6df';
        [62, 82, 102, 122].forEach(function (y) { q.beginPath(); q.arc(63, y, 2, 0, 6.28); q.fill(); });
        /* il taschino (sul lato sinistro di chi lo indossa: a destra qui) */
        q.strokeStyle = 'rgba(100,98,90,.85)'; q.lineWidth = 1;
        q.strokeRect(78, 50, 17, 15);
        q.fillStyle = '#1f3f8a'; q.fillRect(82, 45, 2, 10);
        q.fillStyle = '#d8b437'; q.fillRect(89, 44, 4, 8);
        /* il cartellino: foto, nome, banda rossa */
        q.fillStyle = '#e9e7e0'; q.fillRect(36, 52, 14, 18);
        q.fillStyle = '#8a8076'; q.fillRect(38, 54, 6, 7);
        q.fillStyle = '#a82020'; q.fillRect(36, 66, 14, 3);
        q.fillStyle = '#333'; q.fillRect(45, 55, 4, 1); q.fillRect(45, 58, 3, 1);
        /* una bruciatura da acido, vicino alla tasca */
        q.fillStyle = 'rgba(120,90,40,.55)'; q.beginPath(); q.arc(96, 92, 5, 0, 6.28); q.fill();
        q.fillStyle = 'rgba(60,40,20,.6)'; q.beginPath(); q.arc(97, 93, 2, 0, 6.28); q.fill();
      });
    }
    function texCamiceFalda() { return pittura('camiceFalda', 128, 64, pixelCamice(41, 48)); }
    function texManica() {
      return pittura('manica', 64, 64, function (u, v, px, py) {
        var gr = (fbm(px * 0.6, py * 0.6, 3, 51) - 0.5) * 14;
        /* le grinze orizzontali al gomito (a meta' della manica) */
        var gomito = Math.max(0, 1 - Math.abs(v - 0.5) * 4) * Math.pow(Math.abs(Math.sin(v * 70 + u * 8)), 3) * 30;
        var r = CAMICE[0] + gr - gomito, g = CAMICE[1] + gr - gomito, b = CAMICE[2] + gr - gomito;
        if (v > 0.9) { r -= 30; g -= 32; b -= 30; }
        return [cl(r), cl(g), cl(b)];
      });
    }
    function texPantaloni() {
      return pittura('pantaloni', 64, 64, function (u, v, px, py) {
        var tw = ((px + py) % 3 === 0) ? -6 : 0;
        var gr = (fbm(px * 0.5, py * 0.5, 3, 61) - 0.5) * 12;
        var piega = Math.abs(((u * 2) % 1) - 0.5) < 0.03 ? -12 : 0;
        var ginocchio = Math.max(0, 1 - Math.abs(v - 0.5) * 6) * 10;
        var fango = Math.max(0, v - 0.85) * 120 * fbm(u * 10, v * 6, 2, 62);
        return [cl(48 + gr + tw + piega + ginocchio - fango * 0.3), cl(52 + gr + tw + piega + ginocchio - fango * 0.35),
                cl(60 + gr + tw + piega + ginocchio - fango * 0.5)];
      });
    }
    function texGomma(nome, base, seme) {
      return pittura(nome, 32, 32, function (u, v, px, py) {
        var gr = (fbm(px * 0.5, py * 0.5, 3, seme) - 0.5) * 22;
        var lucido = Math.pow(Math.max(0, Math.sin(u * 6.28 * 2)), 8) * 18;
        return [cl(base[0] + gr + lucido), cl(base[1] + gr + lucido), cl(base[2] + gr + lucido)];
      });
    }
    function texStivale() {
      return pittura('stivale', 32, 32, function (u, v, px, py) {
        var gr = (fbm(px * 0.6, py * 0.6, 3, 71) - 0.5) * 16;
        var suola = v > 0.78;
        var graffio = hash(Math.floor(px), Math.floor(py / 3), 72) > 0.93 ? 25 : 0;
        if (suola) return [cl(70 + gr), cl(66 + gr), cl(60 + gr)];
        return [cl(30 + gr + graffio), cl(28 + gr + graffio), cl(27 + gr + graffio)];
      });
    }

    /* ═════════════════════════════════════════════════════════════════════
       IL PROTAGONISTA

       Un metro e settantotto. Le misure vengono dalle proporzioni di un
       adulto vero: bacino a 95 cm, spalle a 1,43 m, la testa un ottavo
       dell'altezza. Il busto ha la sezione ellittica di un torace (largo e
       poco profondo), le braccia arrivano a meta' coscia, le mani hanno il
       pollice. Il camice e' in tre pezzi — busto, falde, maniche — e le
       falde sono due pannelli separati, cosi' si aprono e ondeggiano con le
       gambe. L'attrezzatura e' quella di chi lavora davvero con i reagenti:
       guanti di butile lunghi, semimaschera con i filtri al collo, occhiali
       sulla fronte, dosimetro, torcia, cintura con il marsupio.
       ═════════════════════════════════════════════════════════════════════ */
    function testa() {
      var R = 0.112;
      var geo = new T.SphereGeometry(R, PS1 ? 12 : 16, PS1 ? 10 : 12);
      geo = geo.toNonIndexed();
      var p = geo.attributes.position;
      var uv = geo.attributes.uv;
      var orig = p.array.slice(0);
      /* la forma: piu' alta che larga, la mandibola che si stringe, il
         mento, gli zigomi, l'arcata sopraccigliare, il naso, la nuca */
      for (var i = 0; i < p.count; i++) {
        var x = orig[i * 3] / R, y = orig[i * 3 + 1] / R, z = orig[i * 3 + 2] / R;
        var nx = x * 0.84, ny = y * 1.18, nz = z * 0.98;
        if (y < -0.25) nx *= 1 - (-y - 0.25) * 0.42;
        if (y < -0.55 && z > 0.2) nz += 0.08 * (z);
        if (z > 0.75 && Math.abs(x) < 0.22 && y > -0.42 && y < 0.05) nz += 0.2 * (1 - Math.abs(x) / 0.22) * (1 - Math.abs(y + 0.2) / 0.25);
        if (z > 0.6 && y > 0.12 && y < 0.36) nz += 0.05;
        if (z > 0.55 && Math.abs(Math.abs(x) - 0.38) < 0.15 && Math.abs(y - 0.08) < 0.12) nz -= 0.035;
        if (Math.abs(x) > 0.5 && y > -0.3 && y < 0.05 && z > 0.2) nx *= 1.04;
        if (z < -0.1 && y > -0.1) nz *= 1.08;
        if (y > 0.45 && (z < 0.55 || y > 0.65)) { nx *= 1.04; ny *= 1.02; nz *= 1.04; }
        p.setXYZ(i, nx * R, ny * R, nz * R);
      }
      /* la mappatura: ogni triangolo usa la faccia o la nuca a seconda di
         dove guarda, e la proiezione e' piana */
      for (var t = 0; t < p.count; t += 3) {
        var zc = (orig[t * 3 + 2] + orig[t * 3 + 5] + orig[t * 3 + 8]) / 3;
        for (var j = 0; j < 3; j++) {
          var X = orig[(t + j) * 3] / R, Y = orig[(t + j) * 3 + 1] / R;
          var u = zc >= 0 ? 0.25 + X * 0.25 : 0.75 - X * 0.25;
          uv.setXY(t + j, u, 0.5 + Y * 0.5);
        }
      }
      return lisce(geo);
    }

    function chimico() {
      var MV = {
        viso: mat({ map: texViso(), roughness: 0.62 }),
        pelle: mat({ color: 0xc49e86, roughness: 0.6 }),
        busto: mat({ map: texCamiceBusto(), roughness: 0.85 }),
        falda: mat({ map: texCamiceFalda(), roughness: 0.85, side: T.DoubleSide }),
        manica: mat({ map: texManica(), roughness: 0.85 }),
        pantaloni: mat({ map: texPantaloni(), roughness: 0.9 }),
        guanti: mat({ map: texGomma('butile', [38, 48, 40], 81), roughness: 0.4 }),
        stivali: mat({ map: texStivale(), roughness: 0.55 }),
        gomma: mat({ map: texGomma('gommaNera', [40, 40, 42], 82), roughness: 0.7 }),
        filtri: mat({ color: 0xa8305e, roughness: 0.5 }),
        cuoio: mat({ color: 0x3b2a1e, roughness: 0.7 }),
        tela: mat({ color: 0x5d5a44, roughness: 0.9 }),
        lente: mat({ color: 0x8fa69a, roughness: 0.15, transparent: true, opacity: 0.6 }),
        giallo: mat({ color: 0xc8a32e, roughness: 0.5 })
      };
      var g = new T.Group();
      var bacino = new T.Group();
      bacino.position.y = 0.95;
      g.add(bacino);

      /* il bacino nei pantaloni, con la cintura e il marsupio */
      var lomb = new T.LatheGeometry([[0, -0.14], [0.13, -0.14], [0.155, -0.08], [0.16, 0.0], [0.155, 0.06], [0, 0.06]]
        .map(function (q) { return new T.Vector2(q[0], q[1]); }), PS1 ? 8 : 12);
      var fianchi = m(lisce(lomb), MV.pantaloni);
      fianchi.scale.set(1, 1, 0.68);
      bacino.add(fianchi);
      var cint = m(new T.CylinderGeometry(0.163, 0.163, 0.04, PS1 ? 10 : 16, 1, true), MV.cuoio, 0, 0.035, 0);
      cint.scale.z = 0.7;
      bacino.add(cint);
      var marsupio = m(lisce(new T.CylinderGeometry(0.045, 0.05, 0.1, 6)), MV.tela, -0.15, -0.02, -0.05);
      marsupio.scale.set(1, 1, 0.55); marsupio.rotation.y = 0.9;
      bacino.add(marsupio);

      /* le falde del camice: due pannelli, appesi ai fianchi */
      var falde = {};
      [-1, 1].forEach(function (l) {
        var pv = new T.Group();
        pv.position.y = 0.04;
        var prof = [];
        for (var i = 0; i <= 6; i++) {
          var t = i / 6;
          prof.push(new T.Vector2(0.168 + t * 0.07 + Math.sin(t * 3) * 0.006, -t * 0.5));
        }
        prof.reverse();
        var start = l < 0 ? Math.PI : 0.32, len = Math.PI - 0.32;
        var geo = new T.LatheGeometry(prof, PS1 ? 6 : 10, start, len);
        var falda = m(lisce(geo), MV.falda);
        falda.scale.z = 0.72;
        pv.add(falda);
        bacino.add(pv);
        falde[l < 0 ? 'sx' : 'dx'] = pv;
      });

      /* il busto: un torace, non un cilindro */
      var busto = new T.Group();
      busto.position.y = 0.04;
      bacino.add(busto);
      var profBusto = [[0.155, 0.0], [0.16, 0.1], [0.172, 0.2], [0.19, 0.31], [0.195, 0.38], [0.18, 0.44],
                       [0.12, 0.485], [0.06, 0.5]];
      var torace = m(lisce(new T.LatheGeometry(profBusto.map(function (q) { return new T.Vector2(q[0], q[1]); }),
                                               PS1 ? 10 : 16, Math.PI, Math.PI * 2)), MV.busto);
      torace.scale.z = 0.64;
      busto.add(torace);
      /* il colletto rialzato dietro il collo */
      var colletto = m(new T.CylinderGeometry(0.07, 0.085, 0.05, PS1 ? 8 : 12, 1, true, Math.PI * 0.75, Math.PI * 1.5),
                       MV.busto, 0, 0.5, -0.005);
      busto.add(colletto);
      /* la semimaschera appesa al collo, con i due filtri rosa P100 */
      var maschera = new T.Group();
      maschera.position.set(0, 0.43, 0.115);
      maschera.rotation.x = 0.5;
      var corpoM = m(lisce(new T.SphereGeometry(0.05, PS1 ? 6 : 10, PS1 ? 5 : 8, 0, Math.PI * 2, 0, Math.PI / 2)), MV.gomma);
      corpoM.rotation.x = Math.PI / 2; corpoM.scale.set(1.1, 1, 0.8);
      maschera.add(corpoM);
      [-1, 1].forEach(function (l) {
        var f = m(new T.CylinderGeometry(0.032, 0.032, 0.025, PS1 ? 8 : 12), MV.filtri, l * 0.055, -0.01, 0.01);
        f.rotation.z = Math.PI / 2 + l * 0.4; f.rotation.y = l * 0.5;
        maschera.add(f);
      });
      busto.add(maschera);
      /* la torcia sulla spallina e il dosimetro */
      var torcia = m(new T.CylinderGeometry(0.016, 0.02, 0.11, 8), MV.gomma, -0.12, 0.33, 0.12);
      torcia.rotation.x = 0.2;
      busto.add(torcia);
      var distintivo = m(new T.CylinderGeometry(0.014, 0.014, 0.008, 8), MV.giallo, 0.09, 0.3, 0.125);
      distintivo.rotation.x = Math.PI / 2;
      busto.add(distintivo);

      /* il collo e la testa */
      var collo = new T.Group();
      collo.position.y = 0.49;
      busto.add(collo);
      collo.add(m(new T.CylinderGeometry(0.046, 0.054, 0.1, PS1 ? 7 : 10), MV.pelle, 0, 0.04, 0.005));
      var capo = new T.Group();
      capo.position.set(0, 0.17, 0.012);
      collo.add(capo);
      capo.add(m(testa(), MV.viso));
      [-1, 1].forEach(function (l) {
        var orecchio = m(lisce(new T.SphereGeometry(0.026, 6, 5)), MV.pelle, l * 0.093, -0.005, -0.008);
        orecchio.scale.set(0.42, 1, 0.75);
        capo.add(orecchio);
      });
      /* gli occhiali di protezione alzati sulla fronte */
      var fascia = m(new T.TorusGeometry(0.106, 0.009, 4, PS1 ? 12 : 20), MV.gomma, 0, 0.075, -0.004);
      fascia.rotation.x = Math.PI / 2 - 0.25; fascia.scale.set(0.9, 1.06, 1);
      capo.add(fascia);
      var occhiali = new T.Group();
      occhiali.position.set(0, 0.1, 0.085);
      occhiali.rotation.x = -0.55;
      /* la montatura e' un pezzo unico di gomma, con le due lenti incassate */
      var mont = m(lisce(new T.CylinderGeometry(0.03, 0.03, 0.15, PS1 ? 6 : 10)), MV.gomma, 0, 0, 0);
      mont.rotation.z = Math.PI / 2; mont.scale.set(1, 1, 0.75);
      occhiali.add(mont);
      [-1, 1].forEach(function (l) {
        var lente = m(new T.CircleGeometry(0.023, PS1 ? 7 : 12), MV.lente, l * 0.034, 0, 0.0235);
        occhiali.add(lente);
      });
      capo.add(occhiali);

      /* le braccia: spalla, manica, gomito, polsino, guanto lungo, mano */
      function braccio(lato) {
        var spalla = new T.Group();
        spalla.position.set(lato * 0.225, 0.43, -0.005);
        busto.add(spalla);
        var deltoide = m(lisce(new T.SphereGeometry(0.06, PS1 ? 6 : 10, PS1 ? 5 : 8)), MV.manica, 0, -0.01, 0);
        deltoide.scale.set(1, 0.9, 0.95);
        spalla.add(deltoide);
        spalla.add(m(lisce(new T.CylinderGeometry(0.054, 0.046, 0.29, PS1 ? 7 : 10, 3)), MV.manica, 0, -0.15, 0));
        var gomito = new T.Group();
        gomito.position.y = -0.29;
        spalla.add(gomito);
        gomito.add(m(lisce(new T.SphereGeometry(0.046, 6, 5)), MV.manica));
        gomito.add(m(lisce(new T.CylinderGeometry(0.046, 0.05, 0.18, PS1 ? 7 : 10, 2)), MV.manica, 0, -0.09, 0));
        /* il guanto di butile, lungo fin sotto la manica */
        gomito.add(m(new T.CylinderGeometry(0.044, 0.036, 0.11, PS1 ? 7 : 10), MV.guanti, 0, -0.21, 0));
        var polso = new T.Group();
        polso.position.y = -0.265;
        gomito.add(polso);
        var palmo = m(lisce(new T.CylinderGeometry(0.036, 0.032, 0.09, 6, 2)), MV.guanti, 0, -0.045, 0);
        palmo.scale.set(1, 1, 0.5);
        polso.add(palmo);
        var dita = m(lisce(new T.CylinderGeometry(0.031, 0.024, 0.075, 6, 2)), MV.guanti, 0, -0.12, 0.008);
        dita.scale.set(1, 1, 0.42); dita.rotation.x = -0.25;
        polso.add(dita);
        var pollice = m(lisce(new T.CylinderGeometry(0.012, 0.01, 0.06, 5)), MV.guanti, -lato * 0.0, -0.05, 0.03);
        pollice.position.x = -lato * 0.028;
        pollice.rotation.set(-0.5, 0, lato * 0.5);
        polso.add(pollice);
        return { spalla: spalla, gomito: gomito, polso: polso };
      }
      /* le gambe: coscia, ginocchio, stinco, stivale di sicurezza */
      function gamba(lato) {
        var anca = new T.Group();
        anca.position.set(lato * 0.09, -0.06, 0);
        bacino.add(anca);
        anca.add(m(lisce(new T.CylinderGeometry(0.078, 0.06, 0.44, PS1 ? 7 : 10, 3)), MV.pantaloni, 0, -0.2, 0));
        var ginocchio = new T.Group();
        ginocchio.position.y = -0.42;
        anca.add(ginocchio);
        ginocchio.add(m(lisce(new T.SphereGeometry(0.058, 6, 5)), MV.pantaloni));
        ginocchio.add(m(lisce(new T.CylinderGeometry(0.058, 0.046, 0.38, PS1 ? 7 : 10, 3)), MV.pantaloni, 0, -0.19, 0));
        var caviglia = new T.Group();
        caviglia.position.y = -0.42;
        ginocchio.add(caviglia);
        caviglia.add(m(new T.CylinderGeometry(0.055, 0.058, 0.14, PS1 ? 7 : 10), MV.stivali, 0, 0.03, 0));
        var piede = m(lisce(new T.CylinderGeometry(0.052, 0.06, 0.27, PS1 ? 7 : 10, 2)), MV.stivali, 0, -0.015, 0.055);
        piede.rotation.x = Math.PI / 2; piede.scale.set(1, 1, 0.62);
        caviglia.add(piede);
        var suola = m(new T.CylinderGeometry(0.058, 0.064, 0.28, PS1 ? 7 : 10), MV.gomma, 0, -0.04, 0.055);
        suola.rotation.x = Math.PI / 2; suola.scale.set(1, 1, 0.16);
        caviglia.add(suola);
        return { anca: anca, ginocchio: ginocchio, caviglia: caviglia };
      }

      var rig = {
        nodo: g, bacino: bacino, busto: busto, collo: collo, testa: capo, distintivo: distintivo,
        falde: falde, maschera: maschera,
        bSx: braccio(-1), bDx: braccio(1), gSx: gamba(-1), gDx: gamba(1)
      };
      if (!ALTA) g.add(ombraBlob(0.34));
      return rig;
    }

    /* ═════════════════════════════════════════════════════════════════════
       LE TEXTURE DEI GUARDIANI E DEI RESIDUI
       Sporche, irregolari, con le colature: la materia dopo l'incidente.
       ═════════════════════════════════════════════════════════════════════ */
    function texRuggineViva() {
      return pittura('ruggineViva', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 6, v * 6, 4, 101), mm = fbm(u * 22, v * 22, 3, 102);
        var cola = Math.pow(fbm(u * 30, v * 1.6, 2, 103), 2) * 1.6;
        var vernice = fbm(u * 3, v * 3, 3, 104) > 0.62 && n < 0.55;
        var bucato = hash(Math.floor(px), Math.floor(py), 105) > 0.975;
        var r, g, b;
        if (vernice) { r = 70 + mm * 18; g = 82 + mm * 18; b = 70 + mm * 12; }
        else { r = 88 + n * 52 - cola * 36; g = 56 + n * 28 - cola * 24; b = 38 + n * 14 - cola * 12; }
        if (bucato) { r *= 0.3; g *= 0.3; b *= 0.3; }
        return [cl(r + (mm - 0.5) * 20), cl(g + (mm - 0.5) * 12), cl(b)];
      });
    }
    function texCrosta() {
      return pittura('crosta', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 9, v * 9, 4, 111);
        var poro = hash(Math.floor(px / 2), Math.floor(py / 2), 112) > 0.9 ? -40 : 0;
        return [cl(104 + n * 46 + poro), cl(70 + n * 26 + poro), cl(44 + n * 14 + poro * 0.5)];
      });
    }
    function texCarne() {
      /* carne: rosa-grigia e bruna, con le vene sottili e i punti di pus.
         La grana e' fitta e ogni pixel e' un po' diverso: le chiazze larghe
         a tinta unita sono quello che fa sembrare «di plastica» una carne */
      return pittura('carne', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 9, v * 9, 4, 121), n2 = fbm(u * 28, v * 28, 2, 125);
        var gr = (hash(Math.floor(px), Math.floor(py), 126) - 0.5) * 16;
        var t = Math.min(1, Math.max(0, n * 1.3 - 0.15));
        var r = 70 + t * 62 + n2 * 14, g = 34 + t * 34 + n2 * 8, b = 36 + t * 28 + n2 * 8;
        if (Math.abs(fbm(u * 7, v * 7, 3, 122) - 0.5) < 0.012) { r = 58; g = 26; b = 46; }
        if (Math.abs(fbm(u * 15, v * 15, 2, 123) - 0.5) < 0.009) { r *= 0.7; g *= 0.6; b *= 0.85; }
        if (fbm(u * 40, v * 40, 2, 124) > 0.76) { r = 150; g = 128; b = 82; }
        return [cl(r + gr), cl(g + gr * 0.6), cl(b + gr * 0.6)];
      });
    }
    function texOssa() {
      return pittura('ossa', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 8, v * 8, 4, 131), cr = Math.abs(fbm(u * 14, v * 3, 2, 132) - 0.5) < 0.02;
        var r = 178 + n * 40, g = 160 + n * 36, b = 120 + n * 24;
        if (cr) { r *= 0.55; g *= 0.5; b *= 0.45; }
        return [cl(r), cl(g), cl(b)];
      });
    }
    function texPlasticaFusa() {
      /* polimero fuso: ocra sporca e grigio, colato in verticale, bruciato
         a macchie, con la grana fitta */
      return pittura('plasticaFusa', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 6, v * 10, 4, 141), str = fbm(u * 3, v * 26, 3, 142);
        var carb = fbm(u * 11, v * 11, 3, 143);
        var gr = (hash(Math.floor(px), Math.floor(py), 144) - 0.5) * 14;
        var r = 96 + n * 52 - str * 26, g = 82 + n * 40 - str * 24, b = 56 + n * 22 - str * 12;
        if (carb > 0.64) { var k = 1 - (carb - 0.64) * 2.4; r *= k; g *= k; b *= k; }
        return [cl(r + gr), cl(g + gr), cl(b + gr * 0.8)];
      });
    }
    function texBruciato() {
      return pittura('bruciato', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 7, v * 7, 4, 151);
        return [cl(28 + n * 40), cl(24 + n * 32), cl(22 + n * 28)];
      });
    }
    function texBrace() {
      return pittura('brace', 64, 64, function (u, v) {
        var c = Math.abs(fbm(u * 6, v * 6, 4, 151) - 0.5);
        var k = c < 0.03 ? 1 : (c < 0.06 ? 0.4 : 0);
        return [cl(255 * k), cl(110 * k), cl(30 * k)];
      });
    }
    function texMetalloScuro() {
      return pittura('metalloScuro', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 8, v * 8, 3, 161), gr = hash(Math.floor(px * 3), Math.floor(py / 4), 162) > 0.96 ? 30 : 0;
        var rivetto = ((px % 16) < 2 && (py % 16) < 2) ? 35 : 0;
        var cola = Math.pow(fbm(u * 24, v * 1.4, 2, 163), 3) * 90;
        return [cl(62 + n * 30 + gr + rivetto + cola * 0.6), cl(60 + n * 26 + gr + rivetto + cola * 0.25),
                cl(58 + n * 22 + gr + rivetto)];
      });
    }
    function texCrepe() {
      return pittura('crepe', 64, 64, function (u, v) {
        var c = Math.abs(fbm(u * 4, v * 4, 4, 171) - 0.5);
        var k = c < 0.01 ? 1 : (c < 0.02 ? 0.3 : 0);
        return [cl(255 * k), cl(140 * k), cl(40 * k)];
      });
    }
    /* il magma dei nuclei: crosta scura e crepe incandescenti, non un disco
       giallo. Serve due volte: come colore e come mappa di emissione */
    function texMagma() {
      return pittura('magma', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 7, v * 7, 4, 175), c = Math.abs(fbm(u * 5, v * 5, 3, 176) - 0.5);
        var caldo = Math.max(0, 1 - c * 9) * 0.9 + Math.max(0, n - 0.55) * 1.4;
        caldo = Math.min(1, caldo);
        return [cl(30 + caldo * 225), cl(14 + caldo * 120), cl(8 + caldo * 30)];
      });
    }
    function texFango(seme, tinta) {
      tinta = tinta || [1, 1, 1];
      return pittura('fango' + seme + tinta.join(','), 64, 64, function (u, v, px, py) {
        var n = fbm(u * 6, v * 6, 4, seme), d = fbm(u * 20, v * 20, 2, seme + 1);
        var detrito = hash(Math.floor(px / 3), Math.floor(py / 3), seme + 2) > 0.94;
        var r = (45 + n * 45) * tinta[0], g = (42 + n * 40) * tinta[1], b = (28 + n * 24) * tinta[2];
        if (detrito) { r = 110 + d * 40; g = 100 + d * 30; b = 80 + d * 20; }
        return [cl(r + (d - 0.5) * 20), cl(g + (d - 0.5) * 16), cl(b)];
      });
    }
    function texGhiaccio() {
      return pittura('ghiaccio', 64, 64, function (u, v) {
        var n = fbm(u * 6, v * 6, 4, 181), cr = Math.abs(fbm(u * 10, v * 10, 3, 182) - 0.5) < 0.02;
        var r = 150 + n * 70, g = 180 + n * 60, b = 200 + n * 50;
        if (cr) { r += 40; g += 40; b += 40; }
        return [cl(r), cl(g), cl(b)];
      });
    }
    function texRadio() {
      return pittura('radio', 128, 128, function (u, v) {
        var c = Math.abs(fbm(u * 9, v * 9, 4, 191) - 0.5), p = fbm(u * 40, v * 40, 2, 192);
        var k = (c < 0.008 ? 1 : (c < 0.016 ? 0.3 : 0)) + (p > 0.86 ? 0.5 : 0);
        return [cl(100 * k), cl(255 * k), cl(50 * k)];
      });
    }
    function texVerderame() {
      return pittura('verderame', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 10, v * 10, 4, 201), vr = fbm(u * 6, v * 6, 3, 202);
        var gr = (hash(Math.floor(px), Math.floor(py), 203) - 0.5) * 16;
        var t = Math.min(1, Math.max(0, (vr - 0.45) * 4));
        var r = (130 + n * 50) * (1 - t) + (72 + n * 30) * t;
        var g = (72 + n * 26) * (1 - t) + (128 + n * 40) * t;
        var b = (40 + n * 14) * (1 - t) + (110 + n * 30) * t;
        return [cl(r + gr), cl(g + gr), cl(b + gr)];
      });
    }

    var T_ = {};
    function MT() {
      if (T_.pronti) return T_;
      T_.ruggine = mat({ map: texRuggineViva(), roughness: 0.9, metalness: 0.3 });
      T_.crosta = mat({ map: texCrosta(), roughness: 1 });
      T_.carne = mat({ map: texCarne(), roughness: 0.45 });
      T_.ossa = mat({ map: texOssa(), roughness: 0.7 });
      T_.plastica = mat({ map: texPlasticaFusa(), roughness: 0.35 });
      T_.bruciato = mat({ map: texBruciato(), roughness: 0.95, emissive: 0xff6a20,
                          emissiveMap: texBrace(), emissiveIntensity: 1.6 });
      T_.metallo = mat({ map: texMetalloScuro(), roughness: 0.6, metalness: 0.5 });
      T_.metalloCrepe = mat({ map: texMetalloScuro(), roughness: 0.6, metalness: 0.5, emissive: 0xffa040,
                              emissiveMap: texCrepe(), emissiveIntensity: 2 });
      T_.ghiaccio = mat({ map: texGhiaccio(), roughness: 0.2, transparent: !PS1, opacity: PS1 ? 1 : 0.85 });
      T_.radio = mat({ map: texFango(211, [0.8, 1.1, 0.7]), roughness: 0.5, emissive: 0x6aff30,
                       emissiveMap: texRadio(), emissiveIntensity: 0.9 });
      T_.carneViva = mat({ map: texCarne(), roughness: 0.45, emissive: 0xff2a10,
                           emissiveMap: texCrepe(), emissiveIntensity: 1.3 });
      T_.verderame = mat({ map: texVerderame(), roughness: 0.6, metalness: 0.4 });
      T_.scorie = mat({ map: pittura('scorie', 64, 64, function (u, v, px, py) {
        var n = fbm(u * 8, v * 8, 4, 1160), sc = fbm(u * 5, v * 7, 3, 1161) > 0.6;
        var gr = (hash(Math.floor(px), Math.floor(py), 1162) - 0.5) * 14;
        var cola = Math.pow(fbm(u * 30, v * 1.5, 2, 1163), 3) * 60;
        if (sc) return [cl(100 + n * 50 + gr), cl(62 + n * 26 + gr), cl(38 + n * 12)];
        return [cl(70 + n * 24 + gr - cola * 0.2), cl(78 + n * 24 + gr - cola * 0.4), cl(46 + n * 14 + gr - cola * 0.5)];
      }, function (q) {
        q.fillStyle = 'rgba(20,20,10,.85)';
        for (var i = 0; i < 3; i++) { q.beginPath(); q.moveTo(32, 30); q.arc(32, 30, 9, i * 2.094 - 0.52, i * 2.094 + 0.52); q.closePath(); q.fill(); }
        q.beginPath(); q.arc(32, 30, 2, 0, 6.28); q.fill();
      }), roughness: 0.7, metalness: 0.3 });
      T_.fango = mat({ map: texFango(221), roughness: 0.4 });
      T_.gomma = mat({ map: texGomma('gommaB', [34, 34, 36], 231), roughness: 0.7 });
      var tm = texMagma();
      T_.magma = mat({ map: tm, emissive: 0xffffff, emissiveMap: tm, emissiveIntensity: 1.25, roughness: 0.8 });
      T_.brillaRosso = mat({ color: 0x400000, emissive: 0xff2010, emissiveIntensity: 1.6 });
      T_.brillaArancio = mat({ color: 0x402000, emissive: 0xff7a18, emissiveIntensity: 1.5 });
      T_.brillaVerde = mat({ color: 0x103000, emissive: 0x7aff30, emissiveIntensity: 1.3 });
      T_.brillaAzzurro = mat({ color: 0x001830, emissive: 0x40c0ff, emissiveIntensity: 1.4 });
      T_.vetroSporco = mat({ color: 0x8a9a7a, roughness: 0.2, transparent: true, opacity: PS1 ? 0.75 : 0.45 });
      T_.pronti = true;
      return T_;
    }

    /* colature: gocce allungate che pendono, perche' tutto qui perde */
    function colature(g, punti, materiale, seme) {
      punti.forEach(function (pt, i) {
        var l = 0.12 + hash(i, 3, seme) * 0.25;
        var goccia = m(new T.ConeGeometry(0.03, l, 5), materiale, pt[0], pt[1] - l / 2, pt[2]);
        goccia.rotation.x = Math.PI;
        g.add(goccia);
      });
    }

    /* ═════════════════════════════════════════════════════════════════════
       I RESIDUI

       Non melme simpatiche: quello che resta di qualcuno che era nella
       stanza quando il Protocollo e' ripartito. Una massa bassa che si
       trascina, con un torace che emerge a meta', due appendici che erano
       braccia e graffiano il pavimento, e una scia. Niente occhi.
       ═════════════════════════════════════════════════════════════════════ */
    function residuo(colore) {
      var X = MT();
      var tinta = new T.Color(colore || 0x5fbf2a);
      var tt = [0.75 + tinta.r * 0.5, 0.75 + tinta.g * 0.5, 0.75 + tinta.b * 0.5];
      var mf = mat({ map: texFango(241, tt), roughness: 0.35 });
      var g = new T.Group();
      var corpo = new T.Group();
      corpo.position.y = -0.17;
      g.add(corpo);
      corpo.add(m(grumo(0.42, 3, 0.35, 251, 1.1, 0.42, 1.25), mf, 0, 0.05, -0.05));
      /* il torace che emerge, curvo in avanti, con le costole che si vedono */
      var torace = m(grumo(0.2, 2, 0.3, 252, 1, 1.25, 0.8), X.carne, 0, 0.3, 0.12);
      torace.rotation.x = 0.7;
      corpo.add(torace);
      for (var k = 0; k < 4; k++) {
        var costa = m(new T.TorusGeometry(0.15 - k * 0.012, 0.012, 4, 8, Math.PI), X.ossa, 0, 0.36 - k * 0.05, 0.16 + k * 0.03);
        costa.rotation.set(0.7, 0, Math.PI);
        corpo.add(costa);
      }
      /* il cranio, mezzo sciolto dentro la massa */
      var cranio = m(grumo(0.11, 2, 0.25, 253, 0.9, 1, 1.1), X.ossa, 0.04, 0.47, 0.32);
      corpo.add(cranio);
      /* le appendici che erano braccia */
      var bracci = [];
      [-1, 1].forEach(function (l) {
        var b = new T.Group();
        b.position.set(l * 0.18, 0.3, 0.18);
        var f = filo([[0, 0, 0], [l * 0.15, 0.02, 0.2], [l * 0.22, -0.2, 0.42], [l * 0.2, -0.42, 0.58]],
                     0.045, X.carne, 0.45, 260 + l, 0.6);
        b.add(f);
        [-0.03, 0, 0.03].forEach(function (d, j) {
          var dito = m(new T.ConeGeometry(0.012, 0.09, 4), X.ossa, l * 0.2 + d, -0.44, 0.62);
          dito.rotation.x = Math.PI / 2 + 0.6;
          b.add(dito);
        });
        corpo.add(b);
        bracci.push(b);
      });
      /* la scia sul pavimento */
      var scia = m(grumo(0.5, 2, 0.4, 271, 0.9, 0.02, 1.8), mf, 0, -0.33, -0.55, false);
      g.add(scia);
      if (!ALTA) { var ob = ombraBlob(0.55); ob.position.y = -0.34; g.add(ob); }
      function deforma(t) {
        corpo.scale.set(1 + Math.sin(t * 3) * 0.04, 1 - Math.sin(t * 3) * 0.05, 1 + Math.sin(t * 3 + 1) * 0.03);
        bracci.forEach(function (b, i) {
          b.rotation.x = Math.sin(t * 2.4 + i * Math.PI) * 0.35 - 0.1;
          b.rotation.y = Math.sin(t * 1.3 + i) * 0.15;
        });
        torace.rotation.z = Math.sin(t * 1.7) * 0.08;
        cranio.rotation.y = Math.sin(t * 0.9) * 0.3;
      }
      return { gruppo: g, corpo: corpo, deforma: deforma };
    }

    /* ═════════════════════════════════════════════════════════════════════
       I DIECI GUARDIANI

       Ognuno restituisce le stesse parti, cosi' il gioco li anima tutti
       allo stesso modo: `ruota` (pezzi che girano), `oscilla` (pezzi che
       dondolano), `pulsa` (pezzi che si gonfiano), `occhi` (cio' che brilla
       quando attacca), e per POMPA 7 `ruggine`, la crosta che l'acido
       scioglie davvero.
       ═════════════════════════════════════════════════════════════════════ */
    function parti() { return { ruota: [], oscilla: [], pulsa: [], occhi: [], tremola: [] }; }

    /* POMPA 7 — una pompa centrifuga del 1970 che si e' fusa con il suo
       basamento e ha continuato a girare. Il corpo e' ammaccato e incrostato,
       la girante si vede da uno squarcio, i tubi sono spezzati e colano,
       e da sopra pende un braccio di gru con il gancio, che dondola. Due
       manometri rotti fanno da occhi. */
    function pompa() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(grumo(1.5, 2, 0.25, 301, 1.3, 0.04, 1.1), X.fango, 0, 0.02, 0.2, false));
      corpo.add(m(ammacca(new T.CylinderGeometry(1.25, 1.35, 0.3, PS1 ? 8 : 14, 2), 0.08, 2, 302), X.ruggine, 0, 0.15, 0));
      var voluta = m(ammacca(new T.CylinderGeometry(1.05, 1.1, 0.95, PS1 ? 10 : 18, 3, false), 0.1, 2.2, 303), X.ruggine, 0, 1.35, 0);
      voluta.rotation.x = Math.PI / 2;
      corpo.add(voluta);
      /* lo squarcio sul davanti e la girante dentro, che gira */
      var buio = m(new T.CircleGeometry(0.62, 12), mat({ color: 0x050403 }), 0, 1.35, 0.49, false);
      corpo.add(buio);
      var girante = new T.Group();
      girante.position.set(0, 1.35, 0.42);
      for (var i = 0; i < 7; i++) {
        var pala = m(ammacca(new T.CylinderGeometry(0.04, 0.07, 0.55, 5), 0.02, 6, 304 + i), X.metallo, 0, 0, 0);
        pala.position.set(Math.cos(i / 7 * 6.283) * 0.25, Math.sin(i / 7 * 6.283) * 0.25, 0);
        pala.rotation.z = i / 7 * 6.283 + 0.4;
        girante.add(pala);
      }
      var mozzo = m(new T.CylinderGeometry(0.12, 0.12, 0.2, 8), X.metallo, 0, 0, 0);
      mozzo.rotation.x = Math.PI / 2;
      girante.add(mozzo);
      corpo.add(girante);
      P.ruota.push({ o: girante, asse: 'z', v: 0.2 });
      /* i bordi strappati dello squarcio */
      for (var j = 0; j < 9; j++) {
        var a = j / 9 * 6.283;
        var dente = m(new T.ConeGeometry(0.07, 0.3 + hash(j, 1, 305) * 0.2, 4), X.ruggine,
                      Math.cos(a) * 0.62, 1.35 + Math.sin(a) * 0.62, 0.5);
        dente.rotation.z = a - Math.PI / 2;
        dente.rotation.x = 0.5;
        corpo.add(dente);
      }
      /* il motore dietro, verniciato di verde e scrostato */
      var motore = m(ammacca(new T.CylinderGeometry(0.55, 0.55, 1.1, PS1 ? 8 : 14, 3), 0.05, 3, 306), X.metallo, 0, 1.3, -1.05);
      motore.rotation.x = Math.PI / 2;
      corpo.add(motore);
      /* la crosta di ruggine: grumi attaccati al corpo, che l'acido scioglie */
      var ruggine = new T.Group();
      [[-0.9, 1.0, 0.3, 0.5], [0.95, 1.6, 0.2, 0.45], [-0.6, 2.2, 0.1, 0.4], [0.5, 0.7, 0.45, 0.4],
       [0.8, 2.1, -0.4, 0.38], [-1.0, 1.7, -0.5, 0.42], [0.1, 2.35, 0.3, 0.35]].forEach(function (c2, k) {
        ruggine.add(m(grumo(c2[3] * 0.75, 2, 0.5, 310 + k, 1, 0.5, 0.8), X.crosta, c2[0] * 1.05, c2[1], c2[2]));
      });
      corpo.add(ruggine);
      /* i tubi: uno sale e si spezza, uno scende nel pavimento, colano */
      corpo.add(filo([[0.7, 2.0, 0], [0.9, 2.8, 0], [1.4, 3.2, 0.1], [2.0, 3.1, 0.2]], 0.18, X.ruggine, 0.25, 321));
      corpo.add(filo([[-1.0, 1.0, 0.2], [-1.6, 0.8, 0.5], [-2.0, 0.2, 0.7], [-2.1, -0.2, 0.7]], 0.2, X.ruggine, 0.3, 322));
      colature(corpo, [[2.0, 2.95, 0.2], [1.95, 2.95, 0.25], [0.3, 0.88, 0.5], [-0.4, 0.85, 0.48]], X.fango, 323);
      /* il volantino della valvola, storto */
      var volantino = m(ammacca(new T.TorusGeometry(0.38, 0.05, 6, PS1 ? 10 : 18), 0.04, 4, 324), X.ruggine, 0, 2.6, 0.2);
      volantino.rotation.set(Math.PI / 2 - 0.3, 0.2, 0);
      corpo.add(volantino);
      P.ruota.push({ o: volantino, asse: 'z', v: -0.04 });
      /* il braccio di gru con il gancio, che dondola */
      var braccio = new T.Group();
      braccio.position.set(-0.3, 2.6, -0.4);
      braccio.add(filo([[0, 0, 0], [0.2, 0.7, 0.3], [0.6, 1.1, 0.9], [0.9, 0.9, 1.6]], 0.11, X.metallo, 0.2, 325));
      var catena = new T.Group();
      catena.position.set(0.9, 0.85, 1.6);
      for (var c3 = 0; c3 < 6; c3++) {
        var an = m(new T.TorusGeometry(0.05, 0.015, 4, 8), X.metallo, 0, -c3 * 0.09, 0);
        an.rotation.y = c3 % 2 ? Math.PI / 2 : 0;
        catena.add(an);
      }
      var gancio = m(new T.TorusGeometry(0.13, 0.035, 6, 10, Math.PI * 1.4), X.ruggine, 0, -0.66, 0);
      gancio.rotation.z = 0.8;
      catena.add(gancio);
      braccio.add(catena);
      corpo.add(braccio);
      P.oscilla.push({ o: braccio, asse: 'y', amp: 0.35, f: 0.9 });
      P.oscilla.push({ o: catena, asse: 'x', amp: 0.25, f: 1.6 });
      /* i manometri rotti che fanno da occhi */
      [-1, 1].forEach(function (l) {
        var man = m(new T.CylinderGeometry(0.11, 0.11, 0.07, 10), X.metallo, l * 0.42, 2.05, 0.62);
        man.rotation.x = Math.PI / 2;
        corpo.add(man);
        /* il quadrante sporco con la lancetta, illuminato da dietro */
        var tQ = pittura('quadrante', 32, 32, function (u, v, px, py) {
          var d = Math.hypot(u - 0.5, v - 0.5);
          var n = fbm(u * 8, v * 8, 2, 330);
          if (d > 0.46) return [40, 30, 25];
          return [cl(150 + n * 60), cl(60 + n * 30), cl(30 + n * 10)];
        }, function (q) {
          q.strokeStyle = '#1a0a05'; q.lineWidth = 1.5;
          for (var t2 = 0; t2 < 8; t2++) { var aa = -2.4 + t2 * 0.68;
            q.beginPath(); q.moveTo(16 + Math.cos(aa) * 10, 16 + Math.sin(aa) * 10); q.lineTo(16 + Math.cos(aa) * 13, 16 + Math.sin(aa) * 13); q.stroke(); }
          q.lineWidth = 2; q.beginPath(); q.moveTo(16, 16); q.lineTo(26, 9); q.stroke();
          q.strokeStyle = 'rgba(255,255,255,.5)'; q.lineWidth = 1; q.beginPath(); q.moveTo(6, 22); q.lineTo(14, 12); q.stroke();
        });
        var vetro = m(new T.CircleGeometry(0.095, 10),
                      mat({ map: tQ, emissive: 0xff3010, emissiveMap: tQ, emissiveIntensity: 1 }), l * 0.42, 2.05, 0.66, false);
        corpo.add(vetro);
        P.occhi.push(vetro);
      });
      P.ruggine = ruggine; P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* IL POLIMERO — plastica fusa e carne, colata in una colonna che sta in
       piedi da sola. In cima, una maschera antigas fusa nella massa: era di
       qualcuno. Dalle «spalle» pendono fili di polimero che toccano terra;
       dentro, in una cavita', brucia il nocciolo. Vetreria di laboratorio
       inglobata. */
    function polimero() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(grumo(1.6, 2, 0.35, 401, 1, 0.06, 1), X.plastica, 0, 0.03, 0, false));
      [[0, 0.5, 0, 0.95], [0.1, 1.25, -0.05, 0.8], [-0.05, 1.9, 0.05, 0.62], [0.05, 2.45, 0.1, 0.42]].forEach(function (c2, k) {
        corpo.add(m(grumo(c2[3], 3, 0.32, 402 + k, 1.05, 0.95, 0.9), k % 2 ? X.carne : X.plastica, c2[0], c2[1], c2[2]));
      });
      /* la testa: un grumo senza faccia, con la maschera antigas dentro */
      var testa2 = new T.Group();
      testa2.position.set(0.1, 2.85, 0.15);
      testa2.add(m(grumo(0.3, 2, 0.35, 410, 0.9, 1.1, 0.9), X.plastica));
      var masc = m(lisce(new T.SphereGeometry(0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)), X.gomma, 0, -0.05, 0.22);
      masc.rotation.x = Math.PI / 2 + 0.3;
      testa2.add(masc);
      [-1, 1].forEach(function (l) {
        var f = m(new T.CylinderGeometry(0.07, 0.07, 0.07, 8), mat({ color: 0x5a3040 }), l * 0.15, -0.12, 0.27);
        f.rotation.z = Math.PI / 2 + l * 0.5;
        testa2.add(f);
      });
      corpo.add(testa2);
      P.oscilla.push({ o: testa2, asse: 'z', amp: 0.12, f: 0.6 });
      /* la cavita' con il nocciolo che brucia */
      var nocciolo = m(grumo(0.26, 2, 0.4, 411, 1, 1.2, 1), X.magma, 0.05, 1.45, 0.62, false);
      corpo.add(nocciolo);
      P.pulsa.push(nocciolo); P.occhi.push(nocciolo);
      /* i fili di polimero che pendono e toccano terra */
      var fili = new T.Group();
      fili.position.y = 2.2;
      for (var f2 = 0; f2 < 7; f2++) {
        var a = f2 / 7 * 6.283 + 0.3, r = 0.55 + hash(f2, 2, 412) * 0.3;
        var fl = filo([[Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], [Math.cos(a) * r, -0.6, Math.sin(a) * r],
                       [Math.cos(a) * (r + 0.4), -1.4, Math.sin(a) * (r + 0.4)],
                       [Math.cos(a) * (r + 0.6), -2.15, Math.sin(a) * (r + 0.6)]],
                      0.06 + hash(f2, 3, 413) * 0.05, f2 % 3 ? X.plastica : X.carne, 0.5, 414 + f2, 0.5);
        fili.add(fl);
      }
      corpo.add(fili);
      P.ruota.push({ o: fili, asse: 'y', v: 0.003 });
      /* le due «braccia», pesanti, che arrivano a terra */
      [-1, 1].forEach(function (l) {
        var b = new T.Group();
        b.position.set(l * 0.55, 2.2, 0);
        b.add(filo([[0, 0, 0], [l * 0.4, -0.3, 0.3], [l * 0.6, -1.2, 0.6], [l * 0.5, -2.1, 0.9]], 0.16, X.carne, 0.5, 420 + l, 0.4));
        corpo.add(b);
        P.oscilla.push({ o: b, asse: 'x', amp: 0.2, f: 0.8 + l * 0.1 });
      });
      /* la vetreria inglobata: beute e bottiglie sporche, mezze affondate */
      [[0.7, 0.8, 0.5, 0.6], [-0.6, 1.3, 0.55, -0.9], [0.4, 2.0, 0.45, 1.2], [-0.7, 0.4, 0.7, 2]].forEach(function (c2, k) {
        var b2 = new T.Group();
        b2.position.set(c2[0], c2[1], c2[2]); b2.rotation.set(c2[3], k, c2[3] * 0.5);
        b2.add(m(new T.CylinderGeometry(0.05, 0.13, 0.26, 7), X.vetroSporco, 0, 0, 0, false));
        b2.add(m(new T.CylinderGeometry(0.035, 0.05, 0.12, 6), X.vetroSporco, 0, 0.19, 0, false));
        b2.add(m(new T.CylinderGeometry(0.1, 0.12, 0.1, 7), mat({ color: 0x4a4020 }), 0, -0.07, 0, false));
        corpo.add(b2);
      });
      colature(corpo, [[0.6, 2.0, 0.6], [-0.5, 1.6, 0.6], [0.2, 0.9, 0.8]], X.plastica, 430);
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* LO SPETTRO — una persona, bruciata. Galleggia: sotto la vita non ha
       gambe ma stracci che si consumano in fumo. Il corpo e' carbonizzato e
       ha le crepe che brillano come brace; il cranio ha la mandibola
       aperta e le orbite accese. Intorno girano le schegge di vetro dello
       spettrometro che le e' esploso davanti. */
    function spettro() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      corpo.position.y = 0.45;
      g.add(corpo);
      var tronco = m(lisce(new T.LatheGeometry([[0.0, 0.0], [0.12, 0.05], [0.16, 0.4], [0.2, 0.75], [0.24, 1.05],
                                               [0.2, 1.2], [0.08, 1.28], [0, 1.3]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 8)),
                     X.bruciato, 0, 0.6, 0);
      tronco.scale.z = 0.6;
      corpo.add(tronco);
      /* le costole che si vedono sul davanti */
      for (var k = 0; k < 5; k++) {
        var cs = m(new T.TorusGeometry(0.19 - k * 0.012, 0.016, 4, 8, Math.PI * 0.9), X.ossa, 0, 1.55 - k * 0.09, 0.03);
        cs.rotation.set(Math.PI / 2 - 0.2, 0, Math.PI * 1.05);
        cs.scale.z = 0.6;
        corpo.add(cs);
      }
      /* il cranio, allungato, con la mandibola aperta */
      var testa3 = new T.Group();
      testa3.position.set(0, 2.05, 0.04);
      var cranio = m(grumo(0.15, 2, 0.15, 501, 0.85, 1.15, 1), X.bruciato);
      testa3.add(cranio);
      var mand = m(grumo(0.09, 1, 0.2, 502, 1, 0.6, 1.2), X.ossa, 0, -0.17, 0.05);
      mand.rotation.x = 0.5;
      testa3.add(mand);
      [-1, 1].forEach(function (l) {
        var oc = m(new T.SphereGeometry(0.03, 6, 5), X.brillaArancio, l * 0.055, 0.02, 0.13, false);
        testa3.add(oc); P.occhi.push(oc);
      });
      corpo.add(testa3);
      P.oscilla.push({ o: testa3, asse: 'z', amp: 0.2, f: 0.5 });
      /* le braccia lunghe e magre, con le dita ad artiglio */
      [-1, 1].forEach(function (l) {
        var b = new T.Group();
        b.position.set(l * 0.26, 1.75, 0);
        b.add(filo([[0, 0, 0], [l * 0.25, -0.45, 0.15], [l * 0.35, -0.95, 0.35]], 0.04, X.bruciato, 0.35, 510 + l));
        for (var d = 0; d < 4; d++) {
          var dito = m(new T.ConeGeometry(0.012, 0.22, 4), X.ossa, l * 0.35 + (d - 1.5) * 0.025, -1.05, 0.4);
          dito.rotation.x = Math.PI + 0.4;
          b.add(dito);
        }
        corpo.add(b);
        P.oscilla.push({ o: b, asse: 'x', amp: 0.3, f: 0.7 + l * 0.15 });
      });
      /* gli stracci del camice: teli strappati con il bordo sfrangiato */
      var tStracci = pittura('stracci', 64, 64, function (u, v, px, py) {
        var bordo = fbm(u * 8, 1, 2, 520) * 0.4 + 0.55;
        var buco = fbm(u * 10, v * 10, 3, 521) > 0.7;
        var n = fbm(u * 6, v * 6, 3, 522);
        var a = (v < bordo && !buco) ? 255 : 0;
        return [cl(110 + n * 40 - v * 70), cl(105 + n * 36 - v * 70), cl(96 + n * 30 - v * 70), a];
      });
      var mStr = mat({ map: tStracci, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.95 });
      for (var s = 0; s < 6; s++) {
        var a2 = s / 6 * 6.283;
        var tel = new T.Group();
        tel.position.set(Math.cos(a2) * 0.18, 1.2, Math.sin(a2) * 0.12);
        tel.rotation.y = -a2 + Math.PI / 2;
        var pl = m(new T.PlaneGeometry(0.35, 1.3, 1, 4), mStr, 0, -0.65, 0, false);
        tel.add(pl);
        corpo.add(tel);
        P.oscilla.push({ o: tel, asse: 'x', amp: 0.18, f: 1.1 + s * 0.13 });
      }
      /* le schegge di vetro, irregolari, sporche */
      var schegge = new T.Group();
      schegge.position.y = 1.7;
      for (var h = 0; h < 9; h++) {
        var sc = m(grumo(0.09 + hash(h, 1, 530) * 0.08, 0, 0.6, 531 + h, 0.5, 1.8, 0.3), X.vetroSporco,
                   Math.cos(h / 9 * 6.283) * 1.2, (hash(h, 2, 532) - 0.5) * 0.8, Math.sin(h / 9 * 6.283) * 1.2, false);
        sc.rotation.set(h, h * 2, h * 0.5);
        schegge.add(sc);
      }
      corpo.add(schegge);
      P.ruota.push({ o: schegge, asse: 'y', v: 0.012 });
      var brace = m(new T.SphereGeometry(0.06, 6, 5), X.brillaArancio, 1.4, 1.7, 0, false);
      corpo.add(brace);
      P.orbita = { o: brace, r: 1.4, y: 1.7 };
      P.oscilla.push({ o: corpo, asse: 'y', amp: 0.1, f: 0.3 });
      P.galleggia = corpo;
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* ELICA — una colonna vertebrale che si e' avvolta su se stessa due
       volte, come una doppia elica, con le costole tese fra un filamento e
       l'altro al posto delle basi. La tiene insieme carne viva; in cima
       un bulbo con una fessura che si apre. Le radici affondano nel
       pavimento. */
    function elica() {
      var X = MT(), P = parti();
      var g = new T.Group();
      for (var r = 0; r < 7; r++) {
        var a = r / 7 * 6.283;
        g.add(filo([[0, 0.5, 0], [Math.cos(a) * 0.6, 0.15, Math.sin(a) * 0.6],
                    [Math.cos(a + 0.4) * 1.3, 0.02, Math.sin(a + 0.4) * 1.3],
                    [Math.cos(a + 0.6) * 1.8, -0.05, Math.sin(a + 0.6) * 1.8]], 0.09, X.carne, 0.5, 601 + r, 0.7));
      }
      var colonna = new T.Group();
      g.add(colonna);
      var N = PS1 ? 16 : 22;
      for (var b = 0; b < N; b++) {
        var y = 0.35 + b * 0.14, an = b * 0.5;
        [0, Math.PI].forEach(function (off, k) {
          var x = Math.cos(an + off) * 0.6, z = Math.sin(an + off) * 0.6;
          var vert = m(grumo(0.1, 1, 0.3, 610 + b * 2 + k, 1.3, 0.8, 1.1), X.ossa, x, y, z);
          vert.rotation.y = -(an + off);
          colonna.add(vert);
          if (b % 3 === 0) colonna.add(m(grumo(0.12, 2, 0.4, 650 + b + k, 1, 1, 1), X.carne, x * 1.1, y + 0.05, z * 1.1));
        });
        if (b % 2 === 0) {
          var p1 = [Math.cos(an) * 0.55, y, Math.sin(an) * 0.55], p2 = [Math.cos(an + Math.PI) * 0.55, y, Math.sin(an + Math.PI) * 0.55];
          colonna.add(filo([p1, [0, y - 0.08, 0], p2], 0.025, X.ossa, 0.3, 680 + b));
        }
      }
      /* i due fasci di carne che seguono le eliche: e' questo che la fa
         sembrare una cosa cresciuta, non perline su un filo */
      [0, Math.PI].forEach(function (off, k) {
        var pts = [];
        for (var q = 0; q <= N; q += 2) {
          var an2 = q * 0.5 + off;
          pts.push([Math.cos(an2) * 0.62, 0.35 + q * 0.14, Math.sin(an2) * 0.62]);
        }
        colonna.add(filo(pts, 0.085, X.carne, 0.6, 695 + k));
      });
      colonna.add(filo([[0, 0.2, 0], [0.05, 1.2, 0.02], [-0.04, 2.2, 0], [0, 0.35 + N * 0.14, 0]], 0.12, X.carne, 0.7, 699));
      /* il bulbo in cima, con la fessura che brilla */
      var bulbo = new T.Group();
      bulbo.position.y = 0.35 + N * 0.14 + 0.2;
      bulbo.add(m(grumo(0.38, 3, 0.3, 690, 1, 1.3, 1), X.carne));
      var fessura = m(grumo(0.08, 1, 0.3, 691, 0.5, 3, 0.5), X.carneViva, 0, 0, 0.33, false);
      bulbo.add(fessura);
      for (var sp = 0; sp < 6; sp++) {
        var a3 = sp / 6 * 6.283;
        var spina = m(new T.ConeGeometry(0.05, 0.5, 4), X.ossa, Math.cos(a3) * 0.3, 0.35, Math.sin(a3) * 0.3);
        spina.rotation.set(Math.sin(a3) * 0.6, 0, -Math.cos(a3) * 0.6);
        bulbo.add(spina);
      }
      colonna.add(bulbo);
      P.occhi.push(fessura); P.pulsa.push(bulbo);
      P.ruota.push({ o: colonna, asse: 'y', v: 0.008 });
      P.elica = colonna; P.corpo = g;
      return { gruppo: g, parti: P };
    }

    /* PROTOCOLLO 12 — il reattore. Un recipiente d'acciaio chiodato,
       ammaccato, con uno squarcio sul davanti da cui si vede il nucleo fuso;
       le crepe brillano. Sulla base sale una crescita di carne con le vene;
       dall'alto pendono cavi; gli anelli di raffreddamento sono spezzati e
       girano ancora, storti. */
    function protocollo() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      var serb = m(ammacca(new T.CylinderGeometry(1.1, 1.2, 2.6, PS1 ? 10 : 18, 4, true, 0.5, Math.PI * 2 - 1.0), 0.08, 1.6, 701),
                   X.metalloCrepe, 0, 1.4, 0);
      corpo.add(serb);
      corpo.add(m(ammacca(new T.SphereGeometry(1.1, PS1 ? 10 : 18, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0.07, 2, 702),
                  X.metallo, 0, 2.7, 0));
      corpo.add(m(ammacca(new T.CylinderGeometry(1.35, 1.45, 0.35, PS1 ? 10 : 18, 2), 0.06, 2, 703), X.ruggine, 0, 0.17, 0));
      /* l'interno buio e il nucleo fuso */
      corpo.add(m(new T.CylinderGeometry(1.02, 1.02, 2.4, 12, 1, true), mat({ color: 0x0a0605, side: T.BackSide }), 0, 1.4, 0, false));
      var nucleo = m(grumo(0.62, 3, 0.35, 704, 1, 1.15, 1), X.magma, 0, 1.5, 0.15, false);
      corpo.add(nucleo);
      P.pulsa.push(nucleo); P.occhi.push(nucleo); P.nucleo = nucleo;
      /* i lembi strappati attorno allo squarcio */
      for (var k = 0; k < 10; k++) {
        var yy = 0.4 + k * 0.24, l = k % 2 ? 1 : -1;
        var lembo = m(ammacca(new T.PlaneGeometry(0.3, 0.3, 2, 2), 0.05, 5, 705 + k),
                      mat({ map: texMetalloScuro(), side: T.DoubleSide, roughness: 0.6 }),
                      Math.sin(0.5 * l) * 1.12, yy, Math.cos(0.5) * 1.12);
        lembo.rotation.set(0.3 * l, 0.5 * l + l * 0.6, 0.2);
        corpo.add(lembo);
      }
      /* la carne che sale dalla base, con le vene */
      [[0.9, 0.5, 0.5, 0.45], [-0.8, 0.4, 0.7, 0.5], [0.6, 1.0, 0.9, 0.35], [-1.0, 0.9, -0.3, 0.4], [0.3, 0.3, 1.1, 0.4]].forEach(function (c2, i) {
        corpo.add(m(grumo(c2[3], 2, 0.4, 720 + i, 1, 1.2, 1), X.carne, c2[0], c2[1], c2[2]));
      });
      for (var v = 0; v < 5; v++) {
        var a = v * 1.3;
        corpo.add(filo([[Math.cos(a) * 1.15, 0.5, Math.sin(a) * 1.15], [Math.cos(a + 0.2) * 1.18, 1.3, Math.sin(a + 0.2) * 1.18],
                        [Math.cos(a + 0.1) * 1.16, 2.1, Math.sin(a + 0.1) * 1.16]], 0.04, X.carne, 0.5, 730 + v));
      }
      /* i cavi che pendono */
      for (var c3 = 0; c3 < 5; c3++) {
        var a4 = c3 * 1.25 + 0.4;
        corpo.add(filo([[Math.cos(a4) * 0.6, 3.6, Math.sin(a4) * 0.6], [Math.cos(a4) * 1.5, 2.6, Math.sin(a4) * 1.5],
                        [Math.cos(a4) * 1.9, 1.0, Math.sin(a4) * 1.9], [Math.cos(a4) * 2.0, 0.05, Math.sin(a4) * 2.0]],
                       0.035, X.gomma, 0.2, 740 + c3));
      }
      /* gli anelli di raffreddamento spezzati */
      [0, 1].forEach(function (i) {
        var an = m(ammacca(new T.TorusGeometry(1.55 + i * 0.3, 0.07, 6, PS1 ? 14 : 24, Math.PI * (1.4 + i * 0.3)), 0.05, 3, 750 + i),
                   X.ruggine, 0, 1.6 + i * 0.6, 0);
        an.rotation.set(Math.PI / 2 + 0.25 * (i ? -1 : 1), 0, i);
        corpo.add(an);
        P.ruota.push({ o: an, asse: 'z', v: 0.006 * (i ? -1 : 1) });
      });
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* LA CELLA — una vasca elettrolitica crepata, piena di elettrolita
       torbido, da cui e' cresciuta una massa di rame: dendriti ramificati,
       elettrodi coperti di verderame, cavi che fanno scintille. */
    function cella() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      var vasca = m(ammacca(new T.CylinderGeometry(1.3, 1.35, 1.2, 4, 3, true), 0.06, 2, 801), X.ruggine, 0, 0.6, 0, false);
      vasca.material = vasca.material.clone(); vasca.material.side = T.DoubleSide;
      vasca.rotation.y = Math.PI / 4;
      corpo.add(vasca);
      var liquido = m(new T.CylinderGeometry(1.24, 1.24, 1.05, 4), mat({ map: texFango(812, [0.6, 1.1, 0.95]), roughness: 0.2 }), 0, 0.52, 0, false);
      liquido.rotation.y = Math.PI / 4;
      corpo.add(liquido);
      [-0.55, 0.55].forEach(function (x, i) {
        var el = m(ammacca(new T.CylinderGeometry(0.4, 0.4, 2.2, 4, 3), 0.03, 4, 802 + i), X.verderame, x, 1.3, 0);
        el.rotation.y = Math.PI / 4; el.scale.set(1, 1, 0.12);
        corpo.add(el);
      });
      /* i dendriti: rami di rame che crescono verso l'alto e si dividono */
      function ramo(base, dir, lung, liv, seme) {
        var fine = [base[0] + dir[0] * lung, base[1] + dir[1] * lung, base[2] + dir[2] * lung];
        var mid = [(base[0] + fine[0]) / 2 + (hash(seme, 1, 803) - 0.5) * 0.2, (base[1] + fine[1]) / 2,
                   (base[2] + fine[2]) / 2 + (hash(seme, 2, 803) - 0.5) * 0.2];
        corpo.add(filo([base, mid, fine], 0.05 * (1 - liv * 0.25), X.verderame, 0.4, seme, 0.5));
        if (liv < 2) {
          [-1, 1].forEach(function (l) {
            var nd = [dir[0] + l * 0.5, dir[1] * 0.8, dir[2] + (hash(seme, l + 3, 804) - 0.5) * 0.8];
            var nn = Math.hypot(nd[0], nd[1], nd[2]);
            ramo(fine, [nd[0] / nn, nd[1] / nn, nd[2] / nn], lung * 0.6, liv + 1, seme * 3 + l + 7);
          });
        }
      }
      ramo([-0.55, 2.3, 0], [-0.3, 1, 0.2], 0.9, 0, 805);
      ramo([0.55, 2.3, 0], [0.3, 1, -0.2], 0.9, 0, 806);
      ramo([0, 1.1, 0.3], [0, 1, 0.5], 1.2, 0, 807);
      /* la massa che ha assorbito qualcosa di vivo, al centro */
      corpo.add(m(grumo(0.5, 3, 0.4, 808, 1, 1.4, 0.9), X.carne, 0, 1.5, 0.1));
      var occhio = m(grumo(0.1, 1, 0.35, 809, 1, 0.7, 1), X.brillaAzzurro, 0.05, 1.8, 0.48, false);
      corpo.add(occhio); P.occhi.push(occhio); P.pulsa.push(occhio);
      /* i cavi e le scintille */
      [-1, 1].forEach(function (l) {
        corpo.add(filo([[l * 0.55, 2.4, 0], [l * 1.2, 2.6, 0.4], [l * 1.8, 1.2, 0.8], [l * 2.0, 0.05, 1]], 0.05, X.gomma, 0.2, 810 + l));
        var sc = m(new T.OctahedronGeometry(0.08, 0), X.brillaAzzurro, l * 0.55, 2.45, 0, false);
        corpo.add(sc); P.tremola.push(sc);
      });
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* IL GELO — un vaso Dewar per azoto liquido, spaccato dal di dentro da
       qualcosa che era stato congelato e ha continuato a crescere. Ghiaccio
       a lastre irregolari, brina, un braccio che esce dal metallo. */
    function gelo() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(ammacca(new T.CylinderGeometry(0.95, 1.05, 2.2, PS1 ? 10 : 16, 3, true, 0.7, Math.PI * 2 - 1.4), 0.06, 2, 901),
                  X.metallo, 0, 1.1, 0));
      corpo.add(m(grumo(0.75, 3, 0.35, 902, 1, 1.3, 1), X.carne, 0, 1.6, 0.3));
      corpo.add(m(grumo(1.2, 2, 0.4, 903, 1.2, 0.25, 1.2), X.ghiaccio, 0, 0.1, 0));
      for (var k = 0; k < 11; k++) {
        var a = k / 11 * 6.283;
        var lastra = m(grumo(0.25 + hash(k, 1, 904) * 0.2, 0, 0.5, 905 + k, 0.4, 2.2, 0.35), X.ghiaccio,
                       Math.cos(a) * (0.7 + hash(k, 2, 906) * 0.5), 0.6 + hash(k, 3, 907) * 1.8, Math.sin(a) * (0.7 + hash(k, 4, 908) * 0.5));
        lastra.rotation.set(Math.sin(a) * 0.6, a, Math.cos(a) * 0.6);
        corpo.add(lastra);
      }
      /* il braccio congelato che esce dallo squarcio */
      var br = new T.Group();
      br.position.set(0.3, 1.9, 0.75);
      br.add(filo([[0, 0, 0], [0.3, 0.3, 0.4], [0.6, 0.1, 0.9], [0.8, -0.3, 1.2]], 0.07, X.carne, 0.3, 920));
      for (var d = 0; d < 4; d++) {
        var dt = m(new T.ConeGeometry(0.018, 0.2, 4), X.ossa, 0.8 + (d - 1.5) * 0.04, -0.38, 1.25);
        dt.rotation.x = Math.PI + 0.3;
        br.add(dt);
      }
      corpo.add(br);
      P.oscilla.push({ o: br, asse: 'x', amp: 0.15, f: 0.4 });
      var nucleoG = m(grumo(0.2, 1, 0.3, 921, 1, 1, 1), X.brillaAzzurro, 0, 1.7, 0.75, false);
      corpo.add(nucleoG); P.occhi.push(nucleoG); P.pulsa.push(nucleoG);
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* LA DOSE — un corpo gonfio, accasciato, fuso con i farmaci che lo
       hanno fatto: capsule e compresse incastrate nella carne, siringhe
       piantate, una sacca da flebo appesa a un'asta piegata. */
    function dose() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(grumo(1.2, 3, 0.35, 1001, 1.2, 0.7, 1), X.carne, 0, 0.75, 0));
      corpo.add(m(grumo(0.75, 3, 0.35, 1008, 1, 1.1, 0.9), X.carne, 0.1, 1.55, 0.1));
      [-1, 1].forEach(function (l) {
        var br2 = new T.Group();
        br2.position.set(l * 0.75, 1.75, 0.2);
        br2.add(filo([[0, 0, 0], [l * 0.5, -0.2, 0.4], [l * 0.8, -1.0, 0.8], [l * 0.9, -1.7, 1.0]], 0.2, X.carne, 0.5, 1009 + l, 0.4));
        corpo.add(br2);
        P.oscilla.push({ o: br2, asse: 'x', amp: 0.08, f: 0.4 + l * 0.05 });
      });
      var testa4 = m(grumo(0.36, 2, 0.35, 1002, 0.9, 1.15, 1), X.carne, 0.15, 2.45, 0.3);
      corpo.add(testa4);
      P.oscilla.push({ o: testa4, asse: 'z', amp: 0.15, f: 0.35 });
      var colori = [[0xc8402c, 0xe8e0d0], [0x2c5ac8, 0xe8d040], [0x30a050, 0xe8e0d0], [0xe8e0d0, 0xe8e0d0]];
      for (var k = 0; k < (PS1 ? 22 : 34); k++) {
        var th = hash(k, 1, 1003) * 6.283, ph = hash(k, 2, 1003) * 1.4 - 0.2;
        var r = 1.25;
        var x = Math.cos(th) * Math.cos(ph) * r * 1.15, y = 0.75 + Math.sin(ph) * r * 0.7, z = Math.sin(th) * Math.cos(ph) * r;
        var cc = colori[k % 4];
        var cap = new T.Group();
        cap.position.set(x, y, z);
        cap.rotation.set(hash(k, 3, 1003) * 3, hash(k, 4, 1003) * 3, 0);
        cap.add(m(api.capsula(0.07, 0.12), mat({ color: cc[0], roughness: 0.3 })));
        if (cc[0] !== cc[1]) cap.add(m(new T.CylinderGeometry(0.072, 0.072, 0.07, 8), mat({ color: cc[1], roughness: 0.3 }), 0, -0.05, 0));
        corpo.add(cap);
      }
      for (var s = 0; s < 5; s++) {
        var a = s * 1.3 + 0.2;
        var sir = new T.Group();
        sir.position.set(Math.cos(a) * 0.95, 1.15 + (s % 2) * 0.3, Math.sin(a) * 0.85);
        sir.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
        sir.add(m(new T.CylinderGeometry(0.04, 0.04, 0.35, 8), X.vetroSporco, 0, 0.2, 0, false));
        sir.add(m(new T.CylinderGeometry(0.008, 0.008, 0.18, 4), X.metallo, 0, -0.05, 0));
        sir.add(m(new T.CylinderGeometry(0.05, 0.05, 0.02, 8), X.gomma, 0, 0.39, 0));
        corpo.add(sir);
      }
      var asta = new T.Group();
      asta.position.set(-1.3, 0, -0.4);
      asta.add(filo([[0, 0, 0], [0.05, 1.5, 0], [0.3, 2.4, 0.1]], 0.025, X.metallo, 0.1, 1004));
      var sacca = m(grumo(0.18, 1, 0.2, 1005, 0.8, 1.3, 0.35), mat({ color: 0xc9c48a, transparent: true, opacity: 0.8 }), 0.3, 2.15, 0.1, false);
      asta.add(sacca);
      asta.add(filo([[0.3, 1.95, 0.1], [0.6, 1.4, 0.4], [1.0, 1.3, 0.5], [1.3, 1.5, 0.5]], 0.012, X.vetroSporco, 0.05, 1006));
      corpo.add(asta);
      P.oscilla.push({ o: sacca, asse: 'z', amp: 0.2, f: 0.9 });
      var cuore = m(grumo(0.3, 2, 0.4, 1007, 1, 1.2, 0.9), X.carneViva, 0.1, 1.15, 0.95, false);
      corpo.add(cuore); P.occhi.push(cuore); P.pulsa.push(cuore);
      P.pulsa.push(corpo);
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* IL DECADIMENTO — fusti di scorie schiacciati e fusi in una crescita
       che brilla di un verde malato; le lastre di piombo della schermatura
       si sono staccate come squame; un cartello col trifoglio, piegato. */
    function decadimento() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(grumo(1.0, 3, 0.45, 1101, 1.3, 1.5, 1.1), X.radio, 0, 1.2, 0));
      for (var k = 0; k < 5; k++) {
        var a = k / 5 * 6.283;
        /* fusti di scorie ammaccati: vernice oliva scrostata, ruggine sotto */
        var f = new T.Group();
        f.add(m(ammacca(new T.CylinderGeometry(0.45, 0.45, 1.25, PS1 ? 8 : 14, 4), 0.05, 3, 1150 + k), X.scorie, 0, 0.62, 0));
        f.add(m(new T.CylinderGeometry(0.47, 0.47, 0.04, PS1 ? 8 : 14), X.ruggine, 0, 0.42, 0));
        f.add(m(new T.CylinderGeometry(0.47, 0.47, 0.04, PS1 ? 8 : 14), X.ruggine, 0, 0.9, 0));
        f.scale.y = 0.9 + hash(k, 1, 1102) * 0.4;
        f.position.set(Math.cos(a) * 1.35, 0.05 + hash(k, 2, 1102) * 0.5, Math.sin(a) * 1.35);
        f.rotation.set(Math.sin(a) * 0.45, a, Math.cos(a) * 0.35);
        corpo.add(f);
      }
      for (var s = 0; s < 8; s++) {
        var a2 = s / 8 * 6.283;
        var sq = m(ammacca(new T.PlaneGeometry(0.34, 0.46, 2, 2), 0.06, 4, 1103 + s),
                   mat({ color: 0x6a6e72, roughness: 0.5, metalness: 0.6, side: T.DoubleSide }),
                   Math.cos(a2) * 1.1, 1.6 + (s % 3) * 0.4, Math.sin(a2) * 1.0);
        sq.rotation.set(0.4, -a2 + Math.PI / 2, 0.3);
        corpo.add(sq);
      }
      var tC = pittura('trifoglio', 32, 32, function () { return [210, 180, 30]; }, function (q) {
        q.fillStyle = '#111';
        for (var i = 0; i < 3; i++) {
          q.beginPath(); q.moveTo(16, 16); q.arc(16, 16, 13, i * 2.094 - 0.52, i * 2.094 + 0.52); q.closePath(); q.fill();
        }
        q.fillStyle = '#d2b41e'; q.beginPath(); q.arc(16, 16, 4, 0, 6.28); q.fill();
        q.fillStyle = '#111'; q.beginPath(); q.arc(16, 16, 2.5, 0, 6.28); q.fill();
      });
      var cart = m(ammacca(new T.PlaneGeometry(0.7, 0.7, 3, 3), 0.06, 2, 1110), mat({ map: tC, side: T.DoubleSide }), 0.9, 2.3, 0.7);
      cart.rotation.set(-0.3, 0.6, 0.4);
      corpo.add(cart);
      [[0.3, 2.4, 0.5], [-0.5, 1.6, 0.8], [0.6, 1.1, 0.75]].forEach(function (c2, i) {
        var o = m(grumo(0.16, 1, 0.3, 1120 + i, 1, 1, 1), X.brillaVerde, c2[0], c2[1], c2[2], false);
        corpo.add(o); P.occhi.push(o); P.pulsa.push(o);
      });
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    /* LA MELMA — il fango del depuratore, che si e' alzato. Un cumulo
       scuro pieno di detriti — una grata, ossa, un guanto — con le
       pseudobraccia che si allungano e le bolle che scoppiano. */
    function melma() {
      var X = MT(), P = parti();
      var g = new T.Group(), corpo = new T.Group();
      g.add(corpo);
      corpo.add(m(grumo(1.6, 3, 0.4, 1201, 1.3, 0.55, 1.2), X.fango, 0, 0.6, 0));
      corpo.add(m(grumo(0.9, 3, 0.4, 1202, 1, 1.2, 1), X.fango, 0.1, 1.6, 0));
      for (var k = 0; k < 4; k++) {
        var a = k / 4 * 6.283 + 0.4;
        var b = new T.Group();
        b.position.set(Math.cos(a) * 0.8, 1.4, Math.sin(a) * 0.7);
        b.add(filo([[0, 0, 0], [Math.cos(a) * 0.6, 0.5, Math.sin(a) * 0.6], [Math.cos(a) * 1.3, 0.2, Math.sin(a) * 1.3],
                    [Math.cos(a) * 1.7, -1.3, Math.sin(a) * 1.7]], 0.17, X.fango, 0.5, 1210 + k, 0.6));
        corpo.add(b);
        P.oscilla.push({ o: b, asse: 'z', amp: 0.18, f: 0.6 + k * 0.1 });
      }
      var grata = new T.Group();
      for (var i = 0; i < 5; i++) grata.add(m(new T.CylinderGeometry(0.02, 0.02, 0.8, 4), X.ruggine, (i - 2) * 0.15, 0, 0));
      grata.position.set(0.7, 1.0, 1.1); grata.rotation.set(0.5, 0.4, 1.2);
      corpo.add(grata);
      [[-0.6, 1.2, 1.1], [0.2, 2.0, 0.7], [-0.9, 0.7, -0.9]].forEach(function (c2, i) {
        var os = filo([[c2[0], c2[1], c2[2]], [c2[0] + 0.2, c2[1] + 0.05, c2[2] + 0.1], [c2[0] + 0.4, c2[1], c2[2] + 0.15]], 0.035, X.ossa, 0.2, 1220 + i);
        corpo.add(os);
      });
      for (var bb = 0; bb < 7; bb++) {
        var bol = m(lisce(new T.SphereGeometry(0.1 + hash(bb, 1, 1230) * 0.12, 8, 6)), X.fango,
                    (hash(bb, 2, 1230) - 0.5) * 1.6, 1.0 + hash(bb, 3, 1230) * 1.2, 0.8 + hash(bb, 4, 1230) * 0.4);
        corpo.add(bol); P.pulsa.push(bol);
      }
      var occhio = m(grumo(0.15, 1, 0.3, 1240, 1, 0.6, 1), X.brillaVerde, 0, 2.1, 0.75, false);
      corpo.add(occhio); P.occhi.push(occhio);
      P.corpo = corpo;
      return { gruppo: g, parti: P };
    }

    function guardiano(tipo) {
      var f = { pompa: pompa, polimero: polimero, spettro: spettro, elica: elica, protocollo: protocollo,
                cella: cella, gelo: gelo, dose: dose, decadimento: decadimento, melma: melma }[tipo] || pompa;
      var r = f();
      if (!ALTA) r.gruppo.add(ombraBlob(1.8));
      return r;
    }

    api.chimico = chimico;
    api.residuo = residuo;
    api.guardiano = guardiano;
    api.GUARDIANI_MODELLI = ['pompa', 'polimero', 'spettro', 'elica', 'cella', 'gelo', 'dose', 'decadimento', 'melma', 'protocollo'];
    return api;
  }

  globale.BSIAtomicFigure = { installa: installa, versione: '1.0' };

})(typeof window !== 'undefined' ? window : globalThis);
