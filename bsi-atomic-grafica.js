/* ═══════════════════════════════════════════════════════════════════════════
   bsi-atomic-grafica.js — la grafica di ATOMIC PROTOCOL
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA FA

   Costruisce tutto quello che si vede: il chimico, le stanze, gli arredi, i
   nemici, i guardiani, le luci. E' separato dalla logica del gioco
   (`bsi-atomic.js`) per una ragione pratica: il gioco chiede «una stanza
   larga 12 con una porta a nord», e non deve sapere come si disegna.

   COME SI OTTIENE UN'IMMAGINE CREDIBILE SENZA SCARICARE NIENTE

   Non ci sono modelli o fotografie da scaricare — il gioco deve funzionare
   offline, e un pacchetto di texture vere peserebbe piu' dell'applicazione
   intera. Tutto e' COSTRUITO qui:

     · MATERIALI FISICI (PBR): ogni superficie ha rugosita' e metallicita',
       e la luce ci rimbalza come su un oggetto vero. Il pavimento in resina
       riflette, l'acciaio spazzolato luccica, il camice no.
     · TEXTURE PROCEDURALI: piastrelle, pannelli, cemento, ruggine e metallo
       spazzolato si disegnano con un rumore frattale, e da ogni immagine di
       rilievo si ricava la sua NORMAL MAP (derivata di Sobel): le fughe delle
       piastrelle e i rivetti dei pannelli prendono la luce di sbieco.
     · RIFLESSI: una piccola stanza con pannelli luminosi viene «fotografata»
       una volta (PMREM) e diventa l'ambiente che si riflette sui metalli.
     · LUCI VERE CON OMBRE: una lampada con ombra morbida sopra la stanza in
       cui sei, e una manciata di luci puntiformi spostate di stanza in stanza
       (un numero FISSO, perche' cambiare il numero di luci ricompila tutti
       gli shader e il gioco si fermerebbe a ogni porta).
     · MAPPATURA TONALE ACES e spazio colore sRGB: le luci forti non bruciano
       in bianco piatto, e i colori sono quelli che ci si aspetta.
     · GEOMETRIA ARROTONDATA: niente cubi. Il chimico e' fatto di capsule e
       superfici di rivoluzione, gli arredi hanno spigoli smussati, le
       bottiglie sono profili ruotati, i tubi seguono curve.

   LO STILE PS1 RESTA, COME SCELTA

   Chi lo vuole lo trova nelle impostazioni: stessi modelli, ma luce sui
   vertici, poligoni piatti, vertici agganciati alla griglia e 320×240.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function crea(T, opz) {
    opz = opz || {};
    var Q = opz.qualita || 'alta';         /* alta · media · ps1 */
    var PS1 = (Q === 'ps1');
    var ALTA = (Q === 'alta');
    var cache = {};

    /* ═══════════════════════════════════════════════════════════════════
       IL RUMORE: la materia prima di ogni texture
       ═══════════════════════════════════════════════════════════════════ */
    function hash(x, y, s) {
      var h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
      h = (h ^ (h >>> 13)) * 1274126177 | 0;
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function liscio(t) { return t * t * (3 - 2 * t); }
    function rumore(x, y, s) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = x - xi, yf = y - yi;
      var a = hash(xi, yi, s), b = hash(xi + 1, yi, s);
      var c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
      var u = liscio(xf), v = liscio(yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    /* frattale: piu' ottave sovrapposte, come la grana di un materiale vero */
    function fbm(x, y, ott, s) {
      var v = 0, amp = 0.5, f = 1;
      for (var i = 0; i < (ott || 4); i++) {
        v += rumore(x * f, y * f, (s || 0) + i * 17) * amp;
        f *= 2; amp *= 0.5;
      }
      return v;
    }

    /* da un'immagine di rilievo (0..1) alla sua normal map, con Sobel */
    function normali(alt, n, forza) {
      var c = document.createElement('canvas');
      c.width = c.height = n;
      var q = c.getContext('2d');
      var img = q.createImageData(n, n);
      function h(x, y) { return alt[((y + n) % n) * n + ((x + n) % n)]; }
      for (var y = 0; y < n; y++) {
        for (var x = 0; x < n; x++) {
          var dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1)) -
                   (h(x - 1, y - 1) + 2 * h(x - 1, y) + h(x - 1, y + 1));
          var dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1)) -
                   (h(x - 1, y - 1) + 2 * h(x, y - 1) + h(x + 1, y - 1));
          var nx = -dx * forza, ny = -dy * forza, nz = 1;
          var l = Math.sqrt(nx * nx + ny * ny + nz * nz);
          var k = (y * n + x) * 4;
          img.data[k] = (nx / l * 0.5 + 0.5) * 255;
          img.data[k + 1] = (ny / l * 0.5 + 0.5) * 255;
          img.data[k + 2] = (nz / l * 0.5 + 0.5) * 255;
          img.data[k + 3] = 255;
        }
      }
      q.putImageData(img, 0, 0);
      return c;
    }

    function texDa(canvas, colore, ripeti) {
      var t = new T.CanvasTexture(canvas);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      if (ripeti) t.repeat.set(ripeti[0], ripeti[1]);
      if (colore) t.encoding = T.sRGBEncoding;
      if (PS1) {
        t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter;
        t.generateMipmaps = false;
      } else {
        t.anisotropy = opz.anisotropia || 4;
      }
      return t;
    }

    /* una texture si descrive con una funzione che, per ogni pixel, dice
       colore e altezza. Da qui escono la mappa di colore, quella di rilievo
       (normal map) e — se serve — quella di rugosita'. */
    function tessitura(nome, n, pixel, ripeti, forzaN) {
      if (cache[nome]) return cache[nome];
      if (PS1) n = Math.min(n, 64);
      var cc = document.createElement('canvas');
      cc.width = cc.height = n;
      var q = cc.getContext('2d');
      var img = q.createImageData(n, n);
      var alt = new Float32Array(n * n);
      var rug = null;
      var cr = null, qr = null, imgR = null;
      for (var y = 0; y < n; y++) {
        for (var x = 0; x < n; x++) {
          var p = pixel(x / n, y / n, x, y, n);
          var k = (y * n + x) * 4;
          img.data[k] = p[0]; img.data[k + 1] = p[1]; img.data[k + 2] = p[2];
          img.data[k + 3] = 255;
          alt[y * n + x] = p[3] == null ? 0.5 : p[3];
          if (p[4] != null) {
            if (!imgR) {
              cr = document.createElement('canvas'); cr.width = cr.height = n;
              qr = cr.getContext('2d'); imgR = qr.createImageData(n, n);
            }
            var r = Math.max(0, Math.min(255, p[4] * 255));
            imgR.data[k] = imgR.data[k + 1] = imgR.data[k + 2] = r;
            imgR.data[k + 3] = 255;
          }
        }
      }
      q.putImageData(img, 0, 0);
      var out = { map: texDa(cc, true, ripeti) };
      if (!PS1) {
        out.normalMap = texDa(normali(alt, n, forzaN || 2.2), false, ripeti);
        if (imgR) { qr.putImageData(imgR, 0, 0); out.roughnessMap = texDa(cr, false, ripeti); }
      }
      cache[nome] = out;
      return out;
    }

    /* ── i materiali di base del laboratorio ───────────────────────────── */
    function texPavimento() {
      /* resina epossidica in quadrotte da 60 cm, con la fuga e un leggero
         puntinato: il pavimento di un laboratorio vero */
      return tessitura('pavimento', 512, function (u, v) {
        var tu = (u * 4) % 1, tv = (v * 4) % 1;
        var fuga = (tu < 0.018 || tv < 0.018) ? 1 : 0;
        var n = fbm(u * 24, v * 24, 4, 3);
        var punti = hash(Math.floor(u * 512), Math.floor(v * 512), 9) > 0.985 ? 0.12 : 0;
        var tono = 0.44 + (hash(Math.floor(u * 4), Math.floor(v * 4), 5) - 0.5) * 0.05;
        var base = (tono + (n - 0.5) * 0.06 + punti) * 255;
        if (fuga) base *= 0.55;
        return [base * 0.93, base * 0.97, base, fuga ? 0.1 : 0.55 + n * 0.08,
                fuga ? 0.85 : 0.32 + n * 0.12];
      }, [3, 3], 3.2);
    }
    function texPannello() {
      /* pannelli metallici verniciati con giunti, rivetti e sporco in basso */
      return tessitura('pannello', 512, function (u, v) {
        var pu = (u * 2) % 1, pv = v;
        var giunto = (pu < 0.012 || pu > 0.988) ? 1 : 0;
        var dx = Math.min(Math.abs(pu - 0.06), Math.abs(pu - 0.94));
        var riv = (dx < 0.012 && (Math.abs(pv - 0.08) < 0.014 || Math.abs(pv - 0.92) < 0.014)) ? 1 : 0;
        var n = fbm(u * 18, v * 18, 4, 11);
        var sporco = Math.max(0, (v - 0.55) / 0.45) * 0.25 * fbm(u * 6, v * 3, 3, 4);
        var r = 66 + n * 16, g = 98 + n * 16, b = 110 + n * 14;
        var k = 1 - sporco - giunto * 0.4;
        return [r * k, g * k, b * k,
                giunto ? 0.15 : (riv ? 0.95 : 0.5 + n * 0.05),
                0.45 + n * 0.2 + sporco];
      }, [1, 1], 2.6);
    }
    function texIntonaco() {
      return tessitura('intonaco', 256, function (u, v) {
        /* grana fine e poca: l'intonaco di un laboratorio è liscio, e un
           rumore largo lo faceva sembrare un cielo nuvoloso */
        var n = fbm(u * 60, v * 60, 3, 21) * 0.6 + fbm(u * 6, v * 6, 2, 22) * 0.4;
        var c = 168 + (n - 0.5) * 9;
        return [c, c * 0.99, c * 0.97, n, 0.85 + n * 0.1];
      }, [2, 1], 0.35);
    }
    function texSoffitto() {
      return tessitura('soffitto', 256, function (u, v) {
        var tu = (u * 4) % 1, tv = (v * 4) % 1;
        var bordo = (tu < 0.03 || tv < 0.03) ? 1 : 0;
        var n = hash(Math.floor(u * 256), Math.floor(v * 256), 31);
        var c = bordo ? 95 : 146 + (n - 0.5) * 10;
        return [c, c, c * 1.01, bordo ? 0.2 : 0.6, 0.9];
      }, [2, 2], 1.2);
    }
    function texSpazzolato() {
      /* acciaio spazzolato: righe lunghe in una direzione sola */
      return tessitura('spazzolato', 256, function (u, v) {
        var n = fbm(u * 2, v * 120, 3, 41);
        var c = 170 + (n - 0.5) * 40;
        return [c, c * 1.01, c * 1.03, n, 0.25 + n * 0.25];
      }, [1, 1], 0.6);
    }
    function texRuggine() {
      return tessitura('ruggine', 256, function (u, v) {
        var n = fbm(u * 10, v * 10, 5, 51);
        var m = fbm(u * 30, v * 30, 3, 52);
        var rugg = Math.max(0, Math.min(1, (n - 0.35) * 2.2));
        var r = 120 + rugg * 70 + m * 20, g = 90 + rugg * 10 + m * 10, b = 80 - rugg * 30;
        return [r, g, b, n * 0.8 + m * 0.2, 0.55 + rugg * 0.4];
      }, [1, 1], 3.5);
    }
    function texStrisce() {
      return tessitura('strisce', 128, function (u, v) {
        var s = ((u + v) * 6) % 1 < 0.5;
        var n = fbm(u * 16, v * 16, 3, 61);
        var k = 0.85 + n * 0.15;
        return s ? [235 * k, 190 * k, 30 * k, 0.5, 0.5] : [28 * k, 28 * k, 30 * k, 0.5, 0.6];
      }, [1, 1], 0.5);
    }

    /* ═══════════════════════════════════════════════════════════════════
       I MATERIALI
       Una sola funzione decide se un materiale e' fisico (alta, media) o
       piatto in stile PS1: i modelli non lo sanno e non devono saperlo.
       ═══════════════════════════════════════════════════════════════════ */
    /* LA PLAYSTATION 1 IN DUE RIGHE DI SHADER.
       Nel vertex shader la posizione proiettata si arrotonda a una griglia:
       i vertici della PS1 erano numeri interi, ed e' quello — non la bassa
       risoluzione — a far tremare i poligoni. Nel fragment shader il colore
       scende a 15 bit (5 per canale, come la sua memoria video) con la
       retinatura ordinata di Bayer che la macchina applicava per nascondere
       le bande: il grano fine che si vede su ogni sfumatura di Resident Evil. */
    var vertexSnap = function (m) {
      m.onBeforeCompile = function (shader) {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <project_vertex>',
          '#include <project_vertex>\n' +
          '{ float g = 160.0; vec2 p = gl_Position.xy / gl_Position.w;' +
          '  p = floor(p * g + 0.5) / g; gl_Position.xy = p * gl_Position.w; }');
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          '#include <dithering_fragment>\n' +
          '{ vec2 a = floor(gl_FragCoord.xy);' +
          '  vec2 h = floor(a * 0.5);' +
          '  float b2a = fract(dot(mod(a, 2.0), vec2(0.5, mod(a.y, 2.0) * 0.75)));' +
          '  float b2h = fract(dot(mod(h, 2.0), vec2(0.5, mod(h.y, 2.0) * 0.75)));' +
          '  float bay = b2h * 0.25 + b2a;' +
          '  gl_FragColor.rgb = floor(gl_FragColor.rgb * 31.0 + bay) / 31.0; }');
      };
      m.userData.ps1 = true;
      return m;
    };

    function mat(p) {
      if (PS1) {
        /* luce sui vertici e sfumata fra un vertice e l'altro (Gouraud):
           e' quello che faceva la PS1, non le facce piatte */
        var m1 = new T.MeshLambertMaterial({
          color: p.color != null ? p.color : 0xffffff,
          map: p.map || null, emissive: p.emissive || 0x000000,
          emissiveMap: p.emissiveMap || null,
          emissiveIntensity: p.emissiveIntensity != null ? p.emissiveIntensity : 1,
          transparent: !!p.transparent, opacity: p.opacity != null ? p.opacity : 1,
          alphaTest: p.alphaTest || 0, side: p.side || T.FrontSide
        });
        return vertexSnap(m1);
      }
      if (p.vetro) {
        if (ALTA) {
          return new T.MeshPhysicalMaterial({
            color: p.color || 0xffffff, metalness: 0, roughness: p.roughness || 0.05,
            transmission: 0.92, transparent: true, opacity: 1,
            ior: 1.5, envMapIntensity: 1.2,
            side: T.DoubleSide
          });
        }
        return new T.MeshStandardMaterial({
          color: p.color || 0xcfe8ff, metalness: 0.1, roughness: 0.05,
          transparent: true, opacity: 0.32, side: T.DoubleSide
        });
      }
      var m = new T.MeshStandardMaterial({
        color: p.color != null ? p.color : 0xffffff,
        map: p.map || null, normalMap: p.normalMap || null,
        roughnessMap: p.roughnessMap || null,
        roughness: p.roughness != null ? p.roughness : 0.6,
        metalness: p.metalness != null ? p.metalness : 0,
        emissive: p.emissive || 0x000000, emissiveMap: p.emissiveMap || null,
        emissiveIntensity: p.emissiveIntensity != null ? p.emissiveIntensity : 1,
        transparent: !!p.transparent, opacity: p.opacity != null ? p.opacity : 1,
        alphaTest: p.alphaTest || 0,
        side: p.side || T.FrontSide,
        envMapIntensity: p.env != null ? p.env : 1
      });
      if (p.normalMap && p.normale) m.normalScale = new T.Vector2(p.normale, p.normale);
      return m;
    }

    var M = {};
    function materiali() {
      var tp = texPavimento(), tpa = texPannello(), ti = texIntonaco();
      var ts = texSoffitto(), tsp = texSpazzolato(), tr = texRuggine(), tst = texStrisce();
      M.pavimento = mat({ map: tp.map, normalMap: tp.normalMap, roughnessMap: tp.roughnessMap,
                          roughness: 1, metalness: 0.05, env: 0.9, normale: 0.6 });
      M.pannello = mat({ map: tpa.map, normalMap: tpa.normalMap, roughnessMap: tpa.roughnessMap,
                         roughness: 1, metalness: 0.35 });
      M.intonaco = mat({ map: ti.map, normalMap: ti.normalMap, roughness: 0.92 });
      M.soffitto = mat({ map: ts.map, normalMap: ts.normalMap, roughness: 0.95 });
      M.acciaio = mat({ map: tsp.map, normalMap: tsp.normalMap, roughnessMap: tsp.roughnessMap,
                        roughness: 1, metalness: 0.9, env: 1.2 });
      M.acciaioScuro = mat({ color: 0x4a5058, roughness: 0.45, metalness: 0.8 });
      M.ruggine = mat({ map: tr.map, normalMap: tr.normalMap, roughnessMap: tr.roughnessMap,
                        roughness: 1, metalness: 0.4, normale: 1.4 });
      M.strisce = mat({ map: tst.map, normalMap: tst.normalMap, roughness: 0.55, metalness: 0.2 });
      M.verniceBlu = mat({ color: 0x2f6f9a, roughness: 0.4, metalness: 0.25 });
      M.verniceVerde = mat({ color: 0x3e7a52, roughness: 0.45, metalness: 0.25 });
      M.verniceGialla = mat({ color: 0xd9a627, roughness: 0.45, metalness: 0.25 });
      M.verniceRossa = mat({ color: 0xa8332b, roughness: 0.45, metalness: 0.25 });
      M.plastica = mat({ color: 0xcfd4d8, roughness: 0.38, metalness: 0 });
      M.plasticaScura = mat({ color: 0x23282e, roughness: 0.4, metalness: 0 });
      M.resina = mat({ color: 0x1e2226, roughness: 0.18, metalness: 0.1, env: 1.1 });
      M.gomma = mat({ color: 0x1b1d20, roughness: 0.85 });
      M.vetro = mat({ vetro: true });
      M.vetroAmbra = mat({ vetro: true, color: 0xffc27a });
      M.cartone = mat({ color: 0xb48a5a, roughness: 0.95 });
      /* il personaggio */
      M.camice = mat({ color: 0xe9ecef, roughness: 0.8 });
      M.pelle = mat({ color: 0xe2b48c, roughness: 0.55 });
      M.capelli = mat({ color: 0x2b1e16, roughness: 0.7 });
      M.pantaloni = mat({ color: 0x1f2b3f, roughness: 0.88 });
      M.scarpe = mat({ color: 0x2a221d, roughness: 0.35, metalness: 0.05 });
      M.guanti = mat({ color: 0x4b9fd1, roughness: 0.45 });
      M.lenti = mat({ vetro: true, color: 0xd8f2ff, roughness: 0.02 });
      M.montatura = mat({ color: 0x1d2a33, roughness: 0.4 });
      M.occhio = mat({ color: 0x15181c, roughness: 0.2 });
      /* le luci e gli schermi */
      M.lampada = mat({ color: 0xffffff, emissive: 0xfff3e0, emissiveIntensity: 2.2,
                        roughness: 0.4 });
      M.emergenza = mat({ color: 0x400000, emissive: 0xff2a1a, emissiveIntensity: 2.5 });
      M.ledVerde = mat({ color: 0x002a10, emissive: 0x2aff7a, emissiveIntensity: 2.5 });
      M.ledRosso = mat({ color: 0x2a0000, emissive: 0xff3b3b, emissiveIntensity: 2.5 });
      return M;
    }

    /* ═══════════════════════════════════════════════════════════════════
       LA GEOMETRIA ARROTONDATA
       ═══════════════════════════════════════════════════════════════════ */
    var SEG = PS1 ? 6 : (ALTA ? 20 : 14);

    /* una capsula: due semisfere e un cilindro, come superficie di
       rivoluzione — Three r128 non ha ancora la CapsuleGeometry */
    function capsula(r, lung, seg) {
      var pts = [], n = 6;
      for (var i = 0; i <= n; i++) {
        var a = -Math.PI / 2 + (i / n) * Math.PI / 2;
        pts.push(new T.Vector2(Math.cos(a) * r, Math.sin(a) * r - lung / 2));
      }
      for (var j = 0; j <= n; j++) {
        var b = (j / n) * Math.PI / 2;
        pts.push(new T.Vector2(Math.cos(b) * r, Math.sin(b) * r + lung / 2));
      }
      return new T.LatheGeometry(pts, seg || SEG);
    }

    /* una scatola con gli spigoli smussati: un rettangolo arrotondato
       estruso, con lo smusso sul bordo. Costa pochi triangoli in piu' e
       toglie la cosa che piu' di tutte fa «videogioco vecchio»: lo spigolo
       vivo che taglia la luce di netto. */
    var cacheTonde = {};
    function tonda(l, a, p, r) {
      r = Math.min(r == null ? 0.03 : r, l / 2.2, a / 2.2, p / 2.2);
      var chiave = [l, a, p, r].map(function (v) { return v.toFixed(3); }).join('|');
      if (cacheTonde[chiave]) return cacheTonde[chiave];
      if (PS1) return (cacheTonde[chiave] = new T.BoxGeometry(l, a, p));
      var w = l - 2 * r, h = a - 2 * r;
      var s = new T.Shape();
      s.moveTo(-w / 2, -h / 2 - r);
      s.lineTo(w / 2, -h / 2 - r);
      s.quadraticCurveTo(w / 2 + r, -h / 2 - r, w / 2 + r, -h / 2);
      s.lineTo(w / 2 + r, h / 2);
      s.quadraticCurveTo(w / 2 + r, h / 2 + r, w / 2, h / 2 + r);
      s.lineTo(-w / 2, h / 2 + r);
      s.quadraticCurveTo(-w / 2 - r, h / 2 + r, -w / 2 - r, h / 2);
      s.lineTo(-w / 2 - r, -h / 2);
      s.quadraticCurveTo(-w / 2 - r, -h / 2 - r, -w / 2, -h / 2 - r);
      var g = new T.ExtrudeGeometry(s, {
        depth: Math.max(0.001, p - 2 * r), bevelEnabled: true, bevelThickness: r,
        bevelSize: r * 0.98, bevelSegments: ALTA ? 3 : 2, curveSegments: ALTA ? 4 : 3
      });
      g.translate(0, 0, -(p - 2 * r) / 2);
      g.computeVertexNormals();
      return (cacheTonde[chiave] = g);
    }

    function mesh(g, m, x, y, z, ombre) {
      var o = new T.Mesh(g, m);
      o.position.set(x || 0, y || 0, z || 0);
      if (ombre !== false && !PS1) { o.castShadow = true; o.receiveShadow = true; }
      return o;
    }

    /* il chimico, i residui e i guardiani stanno in bsi-atomic-figure.js:
       una casa per le figure, che il gioco installa sopra questi arredi */

    /* ═══════════════════════════════════════════════════════════════════
       GLI ARREDI
       ═══════════════════════════════════════════════════════════════════ */

    /* un fusto da 200 litri: profilo ruotato con le nervature, coperchio con
       il tappo, e l'etichetta di pericolo avvolta sul fianco */
    function etichetta(testo, sfondo, colore) {
      var chiave = 'et|' + testo + '|' + sfondo;
      if (cache[chiave]) return cache[chiave];
      var c = document.createElement('canvas');
      c.width = 256; c.height = 128;
      var q = c.getContext('2d');
      q.fillStyle = sfondo; q.fillRect(0, 0, 256, 128);
      /* il rombo di pericolo */
      q.save(); q.translate(56, 64); q.rotate(Math.PI / 4);
      q.fillStyle = '#ffffff'; q.fillRect(-30, -30, 60, 60);
      q.strokeStyle = '#c4161c'; q.lineWidth = 6; q.strokeRect(-27, -27, 54, 54);
      q.restore();
      q.fillStyle = '#111'; q.font = 'bold 30px sans-serif'; q.textAlign = 'center';
      q.fillText('!', 56, 76);
      q.fillStyle = colore || '#111'; q.font = 'bold 30px sans-serif'; q.textAlign = 'left';
      q.fillText(testo, 100, 60);
      q.font = '14px sans-serif'; q.fillText('UN 1789 · CORROSIVO', 100, 88);
      var t = new T.CanvasTexture(c);
      t.encoding = T.sRGBEncoding;
      cache[chiave] = t;
      return t;
    }

    function fusto(colore, testo) {
      var g = new T.Group();
      var pts = [];
      var h = 0.88, r = 0.29;
      pts.push(new T.Vector2(0, 0));
      pts.push(new T.Vector2(r - 0.01, 0));
      [0.02, 0.29, 0.59, 0.86].forEach(function (y) {
        pts.push(new T.Vector2(r, y - 0.015));
        pts.push(new T.Vector2(r + 0.012, y));
        pts.push(new T.Vector2(r, y + 0.015));
      });
      pts.push(new T.Vector2(r, h));
      pts.push(new T.Vector2(r - 0.02, h + 0.008));
      pts.push(new T.Vector2(0, h + 0.008));
      var m = mat({ color: colore || 0x2f6f9a, roughness: 0.42, metalness: 0.45 });
      g.add(mesh(new T.LatheGeometry(pts, SEG), m, 0, 0, 0));
      /* i due tappi sul coperchio */
      g.add(mesh(new T.CylinderGeometry(0.032, 0.032, 0.022, 10), M.acciaio, 0.14, h + 0.018, 0));
      g.add(mesh(new T.CylinderGeometry(0.022, 0.022, 0.02, 10), M.acciaio, -0.14, h + 0.016, 0.05));
      if (testo && !PS1) {
        var et = new T.Mesh(new T.CylinderGeometry(r + 0.004, r + 0.004, 0.22, SEG, 1, true,
                                                   -0.55, 1.1),
                            mat({ map: etichetta(testo, '#f1f1ec'), roughness: 0.6 }));
        et.position.y = 0.45;
        g.add(et);
      }
      return g;
    }

    /* una bottiglia di laboratorio: profilo ruotato, vetro, e il liquido
       dentro come secondo profilo colorato */
    function flacone(tipo, coloreLiquido, scala) {
      var g = new T.Group();
      var s = scala || 1;
      var est = [], liq = [];
      if (tipo === 'erlenmeyer') {
        est = [[0, 0], [0.06, 0], [0.065, 0.01], [0.022, 0.12], [0.02, 0.17], [0.024, 0.175]];
        liq = [[0, 0.004], [0.058, 0.004], [0.04, 0.06], [0, 0.06]];
      } else if (tipo === 'becher') {
        est = [[0, 0], [0.045, 0], [0.047, 0.005], [0.047, 0.12], [0.052, 0.125]];
        liq = [[0, 0.004], [0.043, 0.004], [0.043, 0.07], [0, 0.07]];
      } else if (tipo === 'pallone') {
        for (var i = 0; i <= 12; i++) {
          var a = -Math.PI / 2 + (i / 12) * Math.PI * 0.82;
          est.push([Math.cos(a) * 0.06, 0.06 + Math.sin(a) * 0.06]);
        }
        est.push([0.016, 0.14]); est.push([0.016, 0.2]); est.push([0.02, 0.205]);
        liq = [[0, 0.004], [0.045, 0.02], [0.058, 0.05], [0, 0.05]];
      } else {
        /* reagentario: bottiglia con il tappo */
        est = [[0, 0], [0.04, 0], [0.042, 0.01], [0.042, 0.11], [0.02, 0.14], [0.018, 0.16]];
        liq = [[0, 0.004], [0.038, 0.004], [0.038, 0.09], [0, 0.09]];
      }
      function vec(arr) { return arr.map(function (p) { return new T.Vector2(p[0] * s, p[1] * s); }); }
      var vetro = new T.Mesh(new T.LatheGeometry(vec(est), SEG), M.vetro);
      g.add(vetro);
      if (coloreLiquido != null) {
        var ml = mat({ color: coloreLiquido, roughness: 0.15, metalness: 0,
                       transparent: true, opacity: 0.82,
                       emissive: coloreLiquido, emissiveIntensity: 0.15 });
        g.add(new T.Mesh(new T.LatheGeometry(vec(liq), SEG), ml));
      }
      if (tipo === 'reagente') {
        g.add(mesh(new T.CylinderGeometry(0.02 * s, 0.022 * s, 0.03 * s, 10), M.plasticaScura,
                   0, 0.17 * s, 0));
      }
      return g;
    }

    function scaffale() {
      var g = new T.Group();
      var L = 1.5, P = 0.5, H = 2.0;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
        g.add(mesh(tonda(0.04, H, 0.04, 0.008), M.acciaioScuro, c[0] * (L / 2 - 0.02), H / 2,
                   c[1] * (P / 2 - 0.02)));
      });
      var colori = [0x3aa6ff, 0xffb347, 0x6bd968, 0xff6b84, 0xb88cff, 0xe8e8e8];
      for (var r = 0; r < 4; r++) {
        var y = 0.15 + r * 0.55;
        g.add(mesh(tonda(L, 0.025, P, 0.006), M.acciaio, 0, y, 0));
        if (r === 3) continue;
        /* sopra ogni ripiano: flaconi e scatole, mai uguali */
        var x = -L / 2 + 0.12;
        var k = 0;
        while (x < L / 2 - 0.12) {
          var sem = Math.sin((r + 1) * 12.9898 + k * 78.233) * 43758.5453;
          var rnd = sem - Math.floor(sem);
          if (rnd < 0.18) {
            var sc = mesh(tonda(0.24, 0.18 + rnd, 0.3, 0.01), M.cartone, x + 0.1,
                          y + 0.0125 + (0.18 + rnd) / 2, 0);
            g.add(sc); x += 0.28;
          } else {
            var tipo = rnd < 0.5 ? 'reagente' : (rnd < 0.7 ? 'erlenmeyer' :
                       (rnd < 0.85 ? 'becher' : 'pallone'));
            var f = flacone(tipo, colori[k % colori.length], 1.3);
            f.position.set(x + 0.05, y + 0.0125, (rnd - 0.5) * 0.18);
            g.add(f);
            x += 0.14;
          }
          k++;
        }
      }
      return g;
    }

    function bancoLab() {
      var g = new T.Group();
      var L = 3.0, P = 0.9;
      /* i mobili sotto: ante con la maniglia */
      g.add(mesh(tonda(L, 0.82, P - 0.06, 0.02), M.plastica, 0, 0.41, 0));
      for (var i = 0; i < 4; i++) {
        var x = -L / 2 + 0.375 + i * 0.75;
        g.add(mesh(tonda(0.7, 0.7, 0.02, 0.01), M.plastica, x, 0.43, P / 2 - 0.03));
        g.add(mesh(tonda(0.12, 0.018, 0.025, 0.008), M.acciaio, x, 0.7, P / 2 - 0.005));
      }
      g.add(mesh(tonda(L, 0.06, P - 0.04, 0.015), M.gomma, 0, 0.03, 0));
      /* il piano in resina nera, che riflette */
      g.add(mesh(tonda(L + 0.06, 0.04, P + 0.04, 0.012), M.resina, 0, 0.84, 0));
      /* l'alzata con le prese e la mensola */
      g.add(mesh(tonda(L, 0.5, 0.12, 0.015), M.plastica, 0, 1.11, -P / 2 + 0.06));
      g.add(mesh(tonda(L, 0.03, 0.28, 0.01), M.acciaio, 0, 1.38, -P / 2 + 0.12));
      for (var j = 0; j < 5; j++) {
        g.add(mesh(tonda(0.08, 0.06, 0.012, 0.006), M.plasticaScura,
                   -1.2 + j * 0.6, 1.0, -P / 2 + 0.125));
      }
      /* la vetreria sul piano, con i colori dei reagenti */
      var f1 = flacone('erlenmeyer', 0x3aa6ff, 1.6); f1.position.set(-0.9, 0.86, 0.05); g.add(f1);
      var f2 = flacone('becher', 0x6bd968, 1.6); f2.position.set(-0.55, 0.86, 0.12); g.add(f2);
      var f3 = flacone('pallone', 0xffb347, 1.5); f3.position.set(0.7, 0.86, -0.05); g.add(f3);
      /* il supporto del pallone: asta e pinza */
      g.add(mesh(new T.CylinderGeometry(0.008, 0.008, 0.6, 8), M.acciaio, 0.85, 1.16, -0.1));
      g.add(mesh(tonda(0.2, 0.012, 0.14, 0.004), M.acciaio, 0.85, 0.865, -0.1));
      /* il becco Bunsen */
      g.add(mesh(new T.CylinderGeometry(0.045, 0.055, 0.02, 14), M.acciaioScuro, 0.2, 0.87, 0.1));
      g.add(mesh(new T.CylinderGeometry(0.012, 0.012, 0.14, 10), M.acciaio, 0.2, 0.95, 0.1));
      /* lo schermo del banco di sintesi */
      var sch = mesh(tonda(0.7, 0.42, 0.04, 0.012), M.plasticaScura, 0, 1.62, -P / 2 + 0.16);
      g.add(sch);
      var vid = new T.Mesh(new T.PlaneGeometry(0.64, 0.36), schermoMat('SINTESI', '#2ee6a6'));
      vid.position.set(0, 1.62, -P / 2 + 0.182);
      g.add(vid);
      return g;
    }

    function schermoMat(titolo, colore) {
      var chiave = 'sch|' + titolo;
      if (cache[chiave]) return cache[chiave];
      var c = document.createElement('canvas');
      c.width = 256; c.height = 144;
      var q = c.getContext('2d');
      var gr = q.createLinearGradient(0, 0, 0, 144);
      gr.addColorStop(0, '#04161a'); gr.addColorStop(1, '#020a0c');
      q.fillStyle = gr; q.fillRect(0, 0, 256, 144);
      q.fillStyle = colore; q.font = 'bold 18px monospace';
      q.fillText(titolo, 12, 26);
      q.globalAlpha = 0.7; q.font = '11px monospace';
      ['> protocollo 12 sospeso', '> contenimento: ATTIVO', '> pressione 2.4 bar',
       '> temperatura 318 K', '> in attesa di input_'].forEach(function (r, i) {
        q.fillText(r, 12, 50 + i * 17);
      });
      q.globalAlpha = 1;
      q.strokeStyle = colore; q.strokeRect(160, 40, 84, 50);
      q.beginPath();
      for (var x = 0; x < 84; x++) {
        var y = 65 + Math.sin(x / 6) * 12 * Math.exp(-Math.pow((x - 40) / 22, 2));
        if (x) q.lineTo(160 + x, y); else q.moveTo(160 + x, y);
      }
      q.stroke();
      var t = new T.CanvasTexture(c);
      t.encoding = T.sRGBEncoding;
      var m = new T.MeshBasicMaterial({ map: t, toneMapped: false });
      cache[chiave] = m;
      return m;
    }

    function terminale(titolo) {
      var g = new T.Group();
      g.add(mesh(tonda(0.9, 1.15, 0.6, 0.03), M.verniceBlu, 0, 0.575, 0));
      g.add(mesh(tonda(0.94, 0.04, 0.64, 0.012), M.acciaio, 0, 1.17, 0));
      /* il monitor sul braccio */
      g.add(mesh(new T.CylinderGeometry(0.025, 0.03, 0.3, 10), M.acciaioScuro, 0, 1.33, -0.12));
      var mon = mesh(tonda(0.78, 0.5, 0.05, 0.02), M.plasticaScura, 0, 1.6, -0.06);
      mon.rotation.x = -0.12;
      g.add(mon);
      var vid = new T.Mesh(new T.PlaneGeometry(0.72, 0.44), schermoMat(titolo || 'TERMINALE', '#5ef0c4'));
      vid.position.set(0, 1.6, -0.03); vid.rotation.x = -0.12;
      g.add(vid);
      /* la tastiera inclinata */
      var tas = mesh(tonda(0.6, 0.025, 0.2, 0.008), M.plasticaScura, 0, 1.2, 0.17);
      tas.rotation.x = 0.12;
      g.add(tas);
      /* i LED di stato */
      g.add(mesh(new T.SphereGeometry(0.012, 8, 8), M.ledVerde, 0.32, 1.0, 0.301, false));
      g.add(mesh(new T.SphereGeometry(0.012, 8, 8), M.ledRosso, 0.36, 1.0, 0.301, false));
      return { gruppo: g, schermo: vid };
    }

    /* la paratia: telaio a strisce di pericolo, due ante scorrevoli e la
       spia verde o rossa. Le ante si aprono scorrendo, non spariscono. */
    function paratia() {
      var g = new T.Group();
      var W = 2.2, H = 2.5;
      g.add(mesh(tonda(0.22, H + 0.2, 0.36, 0.03), M.strisce, -W / 2 - 0.11, (H + 0.2) / 2, 0));
      g.add(mesh(tonda(0.22, H + 0.2, 0.36, 0.03), M.strisce, W / 2 + 0.11, (H + 0.2) / 2, 0));
      g.add(mesh(tonda(W + 0.44, 0.26, 0.36, 0.03), M.strisce, 0, H + 0.13, 0));
      var anta = function (l) {
        var a = new T.Group();
        a.add(mesh(tonda(W / 2, H, 0.12, 0.02), M.acciaio, 0, H / 2, 0));
        a.add(mesh(tonda(W / 2 - 0.2, 0.5, 0.04, 0.01), M.acciaioScuro, 0, H * 0.62, 0.07));
        a.add(mesh(tonda(0.06, 0.4, 0.05, 0.02), M.acciaioScuro, l * (W / 4 - 0.08), H * 0.45, 0.08));
        a.position.x = l * W / 4;
        g.add(a);
        return a;
      };
      var sx = anta(-1), dx = anta(1);
      var spia = mesh(new T.SphereGeometry(0.05, 12, 12), M.ledRosso, W / 2 + 0.11, H + 0.13, 0.2, false);
      g.add(spia);
      return { gruppo: g, sx: sx, dx: dx, spia: spia, larghezza: W };
    }

    function cappa() {
      var g = new T.Group();
      g.add(mesh(tonda(1.6, 0.9, 0.8, 0.02), M.plastica, 0, 0.45, 0));
      g.add(mesh(tonda(1.6, 1.3, 0.08, 0.02), M.plastica, 0, 1.55, -0.36));
      g.add(mesh(tonda(0.08, 1.3, 0.8, 0.02), M.plastica, -0.76, 1.55, 0));
      g.add(mesh(tonda(0.08, 1.3, 0.8, 0.02), M.plastica, 0.76, 1.55, 0));
      g.add(mesh(tonda(1.6, 0.35, 0.8, 0.02), M.plastica, 0, 2.38, 0));
      var vetro = new T.Mesh(new T.PlaneGeometry(1.44, 0.8), M.vetro);
      vetro.position.set(0, 1.55, 0.38);
      g.add(vetro);
      g.add(mesh(tonda(1.44, 0.05, 0.04, 0.01), M.acciaio, 0, 1.15, 0.39));
      var luce = mesh(tonda(1.3, 0.03, 0.15, 0.01), M.lampada, 0, 2.18, 0, false);
      g.add(luce);
      var f = flacone('erlenmeyer', 0xff6b84, 1.5); f.position.set(-0.3, 0.92, 0); g.add(f);
      var f2 = flacone('reagente', 0x3aa6ff, 1.4); f2.position.set(0.3, 0.92, -0.1); g.add(f2);
      return g;
    }

    /* un tubo che corre lungo il soffitto e scende nel muro: una curva, non
       un cilindro dritto, con le flange ai giunti */
    function tubo(punti, raggio, materiale) {
      var curva = new T.CatmullRomCurve3(punti.map(function (p) {
        return new T.Vector3(p[0], p[1], p[2]);
      }), false, 'catmullrom', 0.1);
      var g = new T.Group();
      g.add(mesh(new T.TubeGeometry(curva, PS1 ? 12 : 48, raggio, SEG, false),
                 materiale || M.acciaio, 0, 0, 0));
      for (var i = 1; i < punti.length - 1; i++) {
        var fl = mesh(new T.TorusGeometry(raggio * 1.15, raggio * 0.35, 8, SEG),
                      M.acciaioScuro, punti[i][0], punti[i][1], punti[i][2]);
        var tg = curva.getTangent(i / (punti.length - 1));
        fl.lookAt(fl.position.clone().add(tg));
        g.add(fl);
      }
      return g;
    }

    /* l'elemento da raccogliere: una fiala di vetro con il liquido che
       brilla e il simbolo che galleggia sopra */
    function ampolla(sim, colore) {
      var g = new T.Group();
      var pts = [[0, 0], [0.05, 0.01], [0.055, 0.04], [0.055, 0.18], [0.02, 0.22],
                 [0.016, 0.27], [0.02, 0.28]];
      g.add(new T.Mesh(new T.LatheGeometry(pts.map(function (p) {
        return new T.Vector2(p[0] * 1.6, p[1] * 1.6);
      }), SEG), M.vetro));
      /* il liquido brilla di suo: MeshBasic non sente le luci né il tone
         mapping, quindi resta del colore dell'elemento anche al buio */
      var liq = new T.MeshBasicMaterial({ color: colore, toneMapped: false });
      var core = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.22, SEG), liq);
      core.position.y = 0.19;
      g.add(core);
      /* l'alone: una sfera che si apre con la trasparenza additiva */
      var alone = new T.Mesh(new T.SphereGeometry(0.28, 16, 16),
        new T.MeshBasicMaterial({ color: colore, transparent: true, opacity: 0.1,
                                  blending: T.AdditiveBlending, depthWrite: false,
                                  toneMapped: false }));
      alone.position.y = 0.2;
      g.add(alone);
      /* il simbolo, sempre rivolto alla telecamera */
      var c = document.createElement('canvas');
      c.width = c.height = 128;
      var q = c.getContext('2d');
      q.fillStyle = 'rgba(4,16,22,.75)';
      q.beginPath(); q.arc(64, 64, 52, 0, 6.2832); q.fill();
      q.strokeStyle = '#' + new T.Color(colore).getHexString(); q.lineWidth = 6; q.stroke();
      q.fillStyle = '#ffffff'; q.font = 'bold 54px sans-serif';
      q.textAlign = 'center'; q.textBaseline = 'middle';
      q.fillText(sim, 64, 68);
      var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; tx.usaEGetta = true;
      var spr = new T.Sprite(new T.SpriteMaterial({ map: tx, depthWrite: false }));
      spr.scale.set(0.32, 0.32, 0.32);
      spr.position.y = 0.72;
      g.add(spr);
      return { gruppo: g, nucleo: core, alone: alone, etichetta: spr };
    }

    /* il foglio di appunti, appoggiato a terra o su un ripiano */
    function foglio() {
      var c = document.createElement('canvas');
      c.width = 128; c.height = 160;
      var q = c.getContext('2d');
      q.fillStyle = '#efe9d8'; q.fillRect(0, 0, 128, 160);
      q.strokeStyle = 'rgba(40,40,80,.55)'; q.lineWidth = 2;
      for (var i = 0; i < 9; i++) {
        q.beginPath(); q.moveTo(12, 24 + i * 14);
        q.lineTo(12 + 60 + Math.sin(i * 3.1) * 40, 24 + i * 14); q.stroke();
      }
      var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; tx.usaEGetta = true;
      var m = new T.Mesh(new T.PlaneGeometry(0.21, 0.29),
                         mat({ map: tx, roughness: 0.9, side: T.DoubleSide }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.005;
      if (!PS1) m.receiveShadow = true;
      return m;
    }

    /* ═══════════════════════════════════════════════════════════════════
       LA STANZA

       Pavimento in resina, muri in due fasce — pannelli metallici in basso,
       intonaco sopra — con il battiscopa e il corrimano, il controsoffitto a
       quadrotte con le plafoniere accese, e i vani delle porte con lo
       spessore del muro. Le luci vere non stanno qui: le dispone il gioco,
       perche' devono seguire il giocatore.
       ═══════════════════════════════════════════════════════════════════ */
    function stanza(st, vaniPer) {
      var g = new T.Group();
      var L = st.larg, P = st.prof, H = st.alt;
      /* in PS1 il pavimento e' suddiviso: con la luce sui vertici, un
         pavimento di quattro vertici e' buio dappertutto tranne gli angoli.
         I giochi dell'epoca facevano lo stesso */
      var pav = new T.Mesh(PS1 ? new T.PlaneGeometry(L, P, Math.ceil(L / 1.2), Math.ceil(P / 1.2))
                               : new T.PlaneGeometry(L, P), M.pavimento);
      pav.rotation.x = -Math.PI / 2;
      if (!PS1) pav.receiveShadow = true;
      /* le piastrelle restano grandi uguali, qualunque sia la stanza */
      if (M.pavimento.map) {
        pav.material = M.pavimento.clone();
        ['map', 'normalMap', 'roughnessMap'].forEach(function (k) {
          if (M.pavimento[k]) {
            pav.material[k] = M.pavimento[k].clone();
            pav.material[k].needsUpdate = true;
            pav.material[k].repeat.set(L / 2.4, P / 2.4);
          }
        });
      }
      g.add(pav);
      var sof = new T.Mesh(new T.PlaneGeometry(L, P), M.soffitto);
      sof.rotation.x = Math.PI / 2; sof.position.y = H;
      g.add(sof);

      function muro(lung, verso, vani) {
        var gr = new T.Group();
        var tagli = [-lung / 2];
        vani.forEach(function (c) { tagli.push(c - 1.25, c + 1.25); });
        tagli.push(lung / 2);
        for (var i = 0; i < tagli.length; i += 2) {
          var a1 = tagli[i], a2 = tagli[i + 1], w = a2 - a1;
          if (w < 0.05) continue;
          var cx = (a1 + a2) / 2;
          var basso = mesh(tonda(w, 1.3, 0.12, 0.02), M.pannello, cx, 0.65, 0);
          gr.add(basso);
          var alto = mesh(new T.BoxGeometry(w, H - 1.3, 0.1), M.intonaco, cx, 1.3 + (H - 1.3) / 2, -0.01);
          gr.add(alto);
          /* il corrimano paracolpi e il battiscopa */
          gr.add(mesh(tonda(w, 0.08, 0.06, 0.02), M.acciaioScuro, cx, 1.0, 0.09));
          gr.add(mesh(tonda(w, 0.1, 0.03, 0.008), M.gomma, cx, 0.05, 0.075));
          gr.add(mesh(tonda(w, 0.04, 0.05, 0.01), M.acciaio, cx, 1.31, 0.065));
        }
        vani.forEach(function (c) {
          /* l'architrave sopra il vano, e lo spessore ai lati */
          gr.add(mesh(new T.BoxGeometry(2.5, H - 2.7, 0.12), M.intonaco, c, 2.7 + (H - 2.7) / 2, 0));
        });
        return gr;
      }
      var nord = muro(L, 'nord', vaniPer('nord')); nord.position.set(0, 0, -P / 2); g.add(nord);
      var sud = muro(L, 'sud', vaniPer('sud')); sud.rotation.y = Math.PI; sud.position.set(0, 0, P / 2); g.add(sud);
      var est = muro(P, 'est', vaniPer('est')); est.rotation.y = -Math.PI / 2; est.position.set(L / 2, 0, 0); g.add(est);
      var ovest = muro(P, 'ovest', vaniPer('ovest')); ovest.rotation.y = Math.PI / 2; ovest.position.set(-L / 2, 0, 0); g.add(ovest);

      /* le plafoniere: pannelli accesi incassati nel controsoffitto */
      var luci = [];
      var nx = Math.max(1, Math.round(L / 6)), nz = Math.max(1, Math.round(P / 6));
      for (var ix = 0; ix < nx; ix++) {
        for (var iz = 0; iz < nz; iz++) {
          var lx = -L / 2 + (ix + 0.5) * (L / nx), lz = -P / 2 + (iz + 0.5) * (P / nz);
          var pl = mesh(tonda(1.2, 0.05, 0.6, 0.01), M.lampada, lx, H - 0.03, lz, false);
          g.add(pl);
          /* il bagliore della plafoniera: lo sprite additivo della PS2 */
          if (!PS1 && api.alone) {
            var bg = api.alone(0xfff0d8, 1.9, 0.32);
            bg.position.set(lx, H - 0.14, lz);
            g.add(bg);
          }
          luci.push({ x: lx, y: H - 0.3, z: lz });
        }
      }
      /* la luce di emergenza in un angolo */
      var em = mesh(new T.SphereGeometry(0.09, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
                    M.emergenza, L / 2 - 0.4, H - 0.05, -P / 2 + 0.4, false);
      em.rotation.x = Math.PI;
      g.add(em);
      /* IL CARTELLO DELLA STANZA E UN ESTINTORE. Sono le due cose che in un
         laboratorio vero ci sono sempre, e che fanno capire subito che non è
         una scatola grigia: il nome del locale con i pittogrammi di pericolo,
         e l'estintore rosso appeso al muro. */
      if (st.nome) {
        var c = document.createElement('canvas');
        c.width = 512; c.height = 160;
        var q = c.getContext('2d');
        q.fillStyle = '#e9edf0'; q.fillRect(0, 0, 512, 160);
        q.fillStyle = '#0f3d5c'; q.fillRect(0, 0, 512, 44);
        q.fillStyle = '#ffffff'; q.font = 'bold 26px sans-serif';
        q.fillText(String(st.ala || 'ISTITUTO').toUpperCase().slice(0, 30), 16, 31);
        q.fillStyle = '#10161c'; q.font = 'bold 40px sans-serif';
        q.fillText(String(st.nome).toUpperCase(), 16, 96);
        q.font = '18px sans-serif'; q.fillStyle = '#4a5560';
        q.fillText('accesso consentito al personale autorizzato', 16, 132);
        [['!', '#c4161c'], ['☠', '#c4161c']].forEach(function (p, i) {
          q.save(); q.translate(440 - i * 66, 100); q.rotate(Math.PI / 4);
          q.fillStyle = '#fff'; q.fillRect(-22, -22, 44, 44);
          q.strokeStyle = p[1]; q.lineWidth = 4; q.strokeRect(-20, -20, 40, 40);
          q.restore();
          q.fillStyle = '#111'; q.font = 'bold 24px sans-serif'; q.textAlign = 'center';
          q.fillText(p[0], 440 - i * 66, 109); q.textAlign = 'left';
        });
        var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
        tx.usaEGetta = true;
        var cart = new T.Mesh(new T.PlaneGeometry(1.4, 0.44), mat({ map: tx, roughness: 0.5 }));
        cart.position.set(-L / 2 + 1.4, 1.95, -P / 2 + 0.07);
        g.add(cart);
      }
      if (!PS1) {
        var est = new T.Group();
        var bombola = mesh(capsula(0.085, 0.36), M.verniceRossa, 0, 0.32, 0);
        est.add(bombola);
        est.add(mesh(new T.CylinderGeometry(0.03, 0.035, 0.08, 10), M.acciaioScuro, 0, 0.6, 0));
        est.add(mesh(tonda(0.12, 0.025, 0.04, 0.008), M.acciaioScuro, 0.04, 0.65, 0));
        est.add(tubo([[0.02, 0.62, 0.02], [0.1, 0.55, 0.09], [0.1, 0.3, 0.1]], 0.012, M.gomma));
        est.add(mesh(tonda(0.2, 0.06, 0.04, 0.01), M.acciaioScuro, 0, 0.52, -0.09));
        est.position.set(L / 2 - 0.22, 0.55, P / 2 - 1.2);
        est.rotation.y = -Math.PI / 2;
        g.add(est);
      }

      /* qualche tubo che corre sotto il soffitto, lungo un muro */
      if (!PS1 && L > 6) {
        g.add(tubo([[-L / 2 + 0.3, H - 0.35, -P / 2 + 0.35], [L / 2 - 0.3, H - 0.35, -P / 2 + 0.35]],
                   0.07, M.acciaio));
        g.add(tubo([[-L / 2 + 0.3, H - 0.55, -P / 2 + 0.35], [L / 2 - 0.3, H - 0.55, -P / 2 + 0.35]],
                   0.045, M.verniceGialla));
      }
      return { gruppo: g, luci: luci, emergenza: em };
    }

    /* ═══════════════════════════════════════════════════════════════════
       IL RENDERER E L'AMBIENTE
       ═══════════════════════════════════════════════════════════════════ */
    function configura(ren) {
      if (PS1) {
        ren.outputEncoding = T.LinearEncoding;
        ren.toneMapping = T.NoToneMapping;
        ren.shadowMap.enabled = false;
        return;
      }
      ren.outputEncoding = T.sRGBEncoding;
      ren.toneMapping = T.ACESFilmicToneMapping;
      ren.toneMappingExposure = 0.78;
      ren.shadowMap.enabled = ALTA;
      ren.shadowMap.type = T.PCFSoftShadowMap;
    }

    /* l'ambiente che si riflette: una stanza grigia con pannelli luminosi,
       fotografata una volta. E' quello che fa luccicare l'acciaio e il
       pavimento in resina invece di lasciarli opachi. */
    function ambiente(ren, scena) {
      if (PS1) return null;
      try {
        var pm = new T.PMREMGenerator(ren);
        var amb = new T.Scene();
        var stanzaAmb = new T.Mesh(new T.BoxGeometry(10, 5, 10),
          new T.MeshBasicMaterial({ color: 0x3a4048, side: T.BackSide }));
        stanzaAmb.position.y = 2;
        amb.add(stanzaAmb);
        [[0, 4.4, 0, 6, 0.1, 2], [-4.9, 2.5, 0, 0.1, 1.2, 6], [4.9, 2.5, 0, 0.1, 1.2, 6],
         [0, 2.5, -4.9, 6, 1.2, 0.1]].forEach(function (p) {
          var l = new T.Mesh(new T.BoxGeometry(p[3], p[4], p[5]),
                             new T.MeshBasicMaterial({ color: 0xfff6ea }));
          l.position.set(p[0], p[1], p[2]);
          amb.add(l);
        });
        var rt = pm.fromScene(amb, 0.04);
        scena.environment = rt.texture;
        pm.dispose();
        return rt.texture;
      } catch (e) { return null; }
    }

    materiali();

    var api = {
      qualita: Q, M: M, materiali: M,
      fusto: fusto, scaffale: scaffale, bancoLab: bancoLab,
      terminale: terminale, paratia: paratia, cappa: cappa, tubo: tubo,
      ampolla: ampolla, foglio: foglio,
      stanza: stanza, flacone: flacone, capsula: capsula, tonda: tonda,
      configura: configura, ambiente: ambiente, mat: mat
    };
    /* le figure: protagonista, residui e guardiani */
    if (globale.BSIAtomicFigure) {
      globale.BSIAtomicFigure.installa(api, T, {
        PS1: PS1, ALTA: ALTA, SEG: SEG, M: M, hash: hash, rumore: rumore, fbm: fbm,
        mat: mat, mesh: mesh, tonda: tonda, capsula: capsula, tubo: tubo
      });
    }
    return api;
  }

  globale.BSIAtomicGrafica = { crea: crea, versione: '1.0' };

})(typeof window !== 'undefined' ? window : globalThis);
