/* ═══════════════════════════════════════════════════════════════════════════
   bsi-atomic-degrado.js — l'istituto abbandonato di ATOMIC PROTOCOL
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA FA

   Le stanze costruite da bsi-atomic-grafica.js sono art déco e in ordine:
   pulite come il giorno dell'inaugurazione. Ma nella storia l'istituto e'
   stato evacuato in fretta e qualcosa ci vive dentro. Questo modulo mette
   sopra ogni stanza quello che resta dopo: fogli sparsi a terra, sedie
   rovesciate, scatoloni sfondati, cavi strappati che pendono dal soffitto,
   calcinacci, pozzanghere lucide, sporco e muffa sui muri, e il sangue —
   pozze, strisciate, schizzi, impronte di mani, colature.

   COME

   Tutto e' disegnato qui, senza scaricare niente: le macchie sono texture
   generate su una tela (gocce, bordi irregolari, strisce), gli oggetti sono
   poche forme smussate. Ogni stanza ha il suo seme: lo stesso livello e'
   devastato sempre allo stesso modo, e due stanze non si somigliano. La
   quantita' cresce con il livello (l'istituto peggiora man mano che si
   scende). I materiali sono condivisi: il gioco poi fonde per materiale la
   geometria ferma, e cento fogli diventano una chiamata di disegno.

   Le macchie non toccano le porte (si vede dove si passa) e lasciano
   liberi gli oggetti del livello (banchi, terminali, elementi).

   Si installa sopra la grafica come le figure: BSIAtomicDegrado.installa.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function installa(api, T, A) {
    var M = A.M, mat = A.mat, mesh = A.mesh, tonda = A.tonda, tubo = A.tubo, PS1 = A.PS1, ALTA = A.ALTA;
    var cacheTex = {}, cacheMat = {}, cacheGeo = {};

    /* un generatore pseudocasuale col suo seme: la stessa stanza viene
       sempre uguale */
    function casuale(seme) {
      var s = (seme >>> 0) || 1;
      return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }
    function tela(n) { var c = document.createElement('canvas'); c.width = c.height = n; return c; }

    /* ── le texture delle macchie ──────────────────────────────────────── */
    /* il sangue: rosso scurissimo, quasi nero dove e' spesso, con un bordo
       piu' chiaro dove si e' asciugato, e un'ombra di lucido */
    function goccia(q, x, y, r, a) {
      var g = q.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(40,0,0,' + a + ')');
      g.addColorStop(0.6, 'rgba(70,4,4,' + a * 0.95 + ')');
      g.addColorStop(0.85, 'rgba(110,10,8,' + a * 0.7 + ')');
      g.addColorStop(1, 'rgba(110,10,8,0)');
      q.fillStyle = g; q.beginPath(); q.arc(x, y, r, 0, Math.PI * 2); q.fill();
    }
    function texMacchia(tipo) {
      if (cacheTex[tipo]) return cacheTex[tipo];
      var N = ALTA ? 512 : 256, c = tela(N), q = c.getContext('2d'), R = casuale(tipo.length * 7919 + 13), k = N / 256;
      if (tipo === 'pozza') {
        /* una pozza: molti dischi sovrapposti fanno un bordo irregolare */
        for (var i = 0; i < 46; i++) {
          var a = R() * Math.PI * 2, d = Math.pow(R(), 0.7) * 70 * k;
          goccia(q, N / 2 + Math.cos(a) * d, N / 2 + Math.sin(a) * d * 0.8, (18 + R() * 40) * k, 0.9);
        }
        for (var j = 0; j < 30; j++) { var a2 = R() * Math.PI * 2, d2 = (90 + R() * 30) * k; goccia(q, N / 2 + Math.cos(a2) * d2, N / 2 + Math.sin(a2) * d2 * 0.8, (2 + R() * 6) * k, 0.9); }
      } else if (tipo === 'schizzo') {
        /* lo schizzo: il centro, le gocce che partono a raggiera e le
           strisce dove il sangue ha corso */
        goccia(q, N / 2, N / 2, 34 * k, 0.95);
        for (var s = 0; s < 22; s++) {
          var as = R() * Math.PI * 2, ls = (40 + R() * 80) * k;
          q.strokeStyle = 'rgba(70,4,4,' + (0.5 + R() * 0.4) + ')'; q.lineWidth = (1 + R() * 4) * k; q.lineCap = 'round';
          q.beginPath(); q.moveTo(N / 2 + Math.cos(as) * 20 * k, N / 2 + Math.sin(as) * 20 * k);
          q.lineTo(N / 2 + Math.cos(as) * ls, N / 2 + Math.sin(as) * ls); q.stroke();
          goccia(q, N / 2 + Math.cos(as) * ls, N / 2 + Math.sin(as) * ls, (3 + R() * 8) * k, 0.95);
        }
        for (var t = 0; t < 70; t++) { var at = R() * Math.PI * 2, dt = (30 + R() * 95) * k; goccia(q, N / 2 + Math.cos(at) * dt, N / 2 + Math.sin(at) * dt, (1 + R() * 4) * k, 0.9); }
      } else if (tipo === 'striscia') {
        /* trascinato: una scia lunga che si assottiglia, con le righe */
        for (var w = 0; w < 60; w++) {
          var u = w / 60, x = (20 + u * 216) * k, y = N / 2 + Math.sin(u * 5) * 8 * k;
          goccia(q, x, y, (30 - u * 18 + R() * 6) * k, 0.55 + (1 - u) * 0.35);
        }
        q.globalCompositeOperation = 'destination-out';
        for (var r2 = 0; r2 < 14; r2++) { q.strokeStyle = 'rgba(0,0,0,' + (0.25 + R() * 0.3) + ')'; q.lineWidth = (1 + R() * 2.5) * k; var yy = N / 2 + (R() - 0.5) * 40 * k; q.beginPath(); q.moveTo(10 * k, yy); q.lineTo(250 * k, yy + (R() - 0.5) * 10 * k); q.stroke(); }
        q.globalCompositeOperation = 'source-over';
      } else if (tipo === 'mano') {
        /* due impronte di mani, una piu' strisciata */
        [[90, 120, 0.2], [170, 140, -0.3]].forEach(function (m, n) {
          q.save(); q.translate(m[0] * k, m[1] * k); q.rotate(m[2]); q.scale(k, k * (n ? 1.25 : 1));
          q.fillStyle = 'rgba(80,6,5,0.9)';
          q.beginPath(); q.ellipse(0, 18, 24, 28, 0, 0, Math.PI * 2); q.fill();
          [-18, -6, 6, 17].forEach(function (fx, f) { q.beginPath(); q.ellipse(fx, -22 - (f === 1 || f === 2 ? 10 : 2), 6, 17 - (f === 3 ? 4 : 0), fx * 0.01, 0, Math.PI * 2); q.fill(); });
          q.beginPath(); q.ellipse(-30, 14, 6, 13, -0.8, 0, Math.PI * 2); q.fill();
          q.restore();
        });
      } else if (tipo === 'colatura') {
        /* colature sul muro: la macchia in alto e i rivoli che scendono */
        for (var cc = 0; cc < 18; cc++) goccia(q, (60 + R() * 136) * k, (40 + R() * 30) * k, (8 + R() * 18) * k, 0.85);
        for (var rv = 0; rv < 12; rv++) {
          var rx = (60 + R() * 136) * k, lun = (60 + R() * 150) * k, larg = (2 + R() * 5) * k;
          q.fillStyle = 'rgba(60,3,3,0.85)'; q.fillRect(rx - larg / 2, 50 * k, larg, lun);
          goccia(q, rx, 50 * k + lun, larg * 1.3, 0.9);
        }
      } else if (tipo === 'sporco') {
        /* sporco e fuliggine: chiazze morbide, piu' dense al centro */
        for (var sp = 0; sp < 140; sp++) {
          var sx = N / 2 + (R() - 0.5) * 200 * k, sy = N / 2 + (R() - 0.5) * 200 * k, sr = (8 + R() * 40) * k;
          var g2 = q.createRadialGradient(sx, sy, 0, sx, sy, sr);
          var dd = Math.hypot(sx - N / 2, sy - N / 2) / (120 * k), al = Math.max(0, 0.16 * (1 - dd));
          g2.addColorStop(0, 'rgba(18,14,10,' + al + ')'); g2.addColorStop(1, 'rgba(18,14,10,0)');
          q.fillStyle = g2; q.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
        }
      } else if (tipo === 'muffa') {
        /* muffa e umidita' che salgono dal basso del muro */
        for (var mf = 0; mf < 260; mf++) {
          var mx = R() * N, my = N - Math.pow(R(), 1.8) * N, mr = (3 + R() * 18) * k;
          var g3 = q.createRadialGradient(mx, my, 0, mx, my, mr), am = 0.22 * (my / N);
          g3.addColorStop(0, 'rgba(22,30,16,' + am + ')'); g3.addColorStop(1, 'rgba(22,30,16,0)');
          q.fillStyle = g3; q.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
        }
      } else if (tipo === 'acqua') {
        for (var aq = 0; aq < 40; aq++) {
          var aa = R() * Math.PI * 2, ad = Math.pow(R(), 0.6) * 80 * k, ar = (20 + R() * 40) * k, ax = N / 2 + Math.cos(aa) * ad, ay = N / 2 + Math.sin(aa) * ad * 0.7;
          var g4 = q.createRadialGradient(ax, ay, 0, ax, ay, ar);
          g4.addColorStop(0, 'rgba(255,255,255,0.95)'); g4.addColorStop(0.8, 'rgba(255,255,255,0.9)'); g4.addColorStop(1, 'rgba(255,255,255,0)');
          q.fillStyle = g4; q.beginPath(); q.arc(ax, ay, ar, 0, Math.PI * 2); q.fill();
        }
      } else if (tipo === 'foglio') {
        /* un foglio battuto a macchina, ingiallito, con una macchia */
        q.fillStyle = '#d9cfb4'; q.fillRect(0, 0, N, N);
        for (var ri = 0; ri < 26; ri++) { q.fillStyle = 'rgba(40,36,30,' + (0.35 + R() * 0.3) + ')'; q.fillRect(28 * k, (30 + ri * 8) * k, (120 + R() * 80) * k, 2.2 * k); }
        q.fillStyle = 'rgba(40,36,30,0.7)'; q.fillRect(28 * k, 14 * k, 90 * k, 6 * k);
        if (R() < 0.7) goccia(q, (60 + R() * 140) * k, (60 + R() * 140) * k, (10 + R() * 30) * k, 0.5);
        var gb = q.createRadialGradient(N / 2, N / 2, N * 0.2, N / 2, N / 2, N * 0.75);
        gb.addColorStop(0, 'rgba(120,90,40,0)'); gb.addColorStop(1, 'rgba(120,90,40,0.35)'); q.fillStyle = gb; q.fillRect(0, 0, N, N);
      } else if (tipo === 'vetri') {
        for (var v = 0; v < 26; v++) {
          var vx = N / 2 + (R() - 0.5) * 180 * k, vy = N / 2 + (R() - 0.5) * 180 * k, vs = (4 + R() * 14) * k;
          q.fillStyle = 'rgba(220,235,240,' + (0.35 + R() * 0.4) + ')';
          q.beginPath(); q.moveTo(vx, vy - vs); q.lineTo(vx + vs * (0.4 + R()), vy + vs * R()); q.lineTo(vx - vs * R(), vy + vs * 0.6); q.closePath(); q.fill();
        }
      }
      var tx = new T.CanvasTexture(c);
      tx.encoding = tipo === 'acqua' ? T.LinearEncoding : T.sRGBEncoding;
      tx.anisotropy = 4;
      return (cacheTex[tipo] = tx);
    }

    /* i materiali delle macchie: trasparenti, non scrivono la profondita',
       spinti appena verso la telecamera per non sfarfallare col pavimento.
       Il sangue fresco e' lucido, lo sporco no */
    function matMacchia(tipo) {
      if (cacheMat[tipo]) return cacheMat[tipo];
      var p = { map: texMacchia(tipo), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
      var m;
      if (tipo === 'acqua') {
        m = new T.MeshStandardMaterial({ color: 0x0c1418, alphaMap: texMacchia('acqua'), transparent: true, depthWrite: false, roughness: 0.04, metalness: 0.4,
                                         polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, envMapIntensity: 1.8, opacity: 0.85 });
      } else if (tipo === 'foglio') {
        m = new T.MeshStandardMaterial({ map: texMacchia('foglio'), roughness: 0.92, side: T.DoubleSide });
      } else {
        var sangue = ['pozza', 'schizzo', 'striscia', 'mano', 'colatura'].indexOf(tipo) >= 0;
        p.roughness = sangue ? 0.22 : 0.95; p.metalness = 0; if (sangue) p.envMapIntensity = 1.2;
        m = new T.MeshStandardMaterial(p);
      }
      m.userData.macchia = tipo;
      return (cacheMat[tipo] = m);
    }
    function geoPiano() { return cacheGeo.piano || (cacheGeo.piano = new T.PlaneGeometry(1, 1)); }
    /* una macchia: a terra (sdraiata) o su un muro (verso l'interno) */
    function macchia(tipo, w, h) {
      var m = new T.Mesh(geoPiano(), matMacchia(tipo));
      m.scale.set(w, h || w, 1);
      m.renderOrder = 1;
      m.receiveShadow = !PS1;
      return m;
    }

    /* ── gli oggetti ───────────────────────────────────────────────────── */
    var matCartone = null, matCalce = null, matLegno = null;
    function materialiOggetti() {
      if (matCartone) return;
      matCartone = mat({ color: 0x7a5a36, roughness: 0.95 });
      matCalce = mat({ color: 0xb8b2a6, roughness: 1 });
      matLegno = M.pannello || mat({ color: 0x4a2a18, roughness: 0.6 });
    }
    function sedia() {
      var g = new T.Group();
      g.add(mesh(tonda(0.44, 0.04, 0.42, 0.01), matLegno, 0, 0.46, 0));
      [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(function (p) { g.add(mesh(new T.CylinderGeometry(0.018, 0.016, 0.46, 8), matLegno, p[0], 0.23, p[1])); });
      g.add(mesh(tonda(0.44, 0.4, 0.03, 0.01), matLegno, 0, 0.72, -0.2));
      [-0.19, 0.19].forEach(function (x) { g.add(mesh(new T.CylinderGeometry(0.016, 0.016, 0.5, 8), matLegno, x, 0.7, -0.2)); });
      return g;
    }
    function scatolone(R) {
      var g = new T.Group(), sch = 0.55 + R() * 0.45;
      var b = mesh(tonda(0.5, 0.36 * sch, 0.4, 0.01), matCartone, 0, 0.18 * sch, 0);
      g.add(b);
      /* i lembi aperti */
      if (R() < 0.6) [-1, 1].forEach(function (l) { var f = mesh(new T.BoxGeometry(0.5, 0.004, 0.2), matCartone, 0, 0.36 * sch, l * 0.27); f.rotation.x = l * (0.6 + R() * 0.9); g.add(f); });
      return g;
    }
    function calcinaccio(R) {
      var geo = cacheGeo['calce' + (R() * 3 | 0)] || (cacheGeo['calce' + (R() * 3 | 0)] = new T.DodecahedronGeometry(0.1, 0));
      var o = mesh(geo, matCalce, 0, 0.04, 0);
      o.scale.set(0.5 + R(), 0.3 + R() * 0.5, 0.5 + R());
      o.rotation.set(R() * 3, R() * 3, R() * 3);
      return o;
    }
    /* un cavo strappato: pende dal soffitto in una curva, con l'estremita'
       sfilacciata un po' sopra il pavimento */
    function cavo(R, H) {
      var x0 = 0, z0 = 0, lun = 1.2 + R() * 1.6, dx = (R() - 0.5) * 0.8, dz = (R() - 0.5) * 0.8;
      var punti = [[x0, H - 0.02, z0], [x0 + dx * 0.3, H - lun * 0.4, z0 + dz * 0.3], [x0 + dx * 0.8, H - lun * 0.8, z0 + dz * 0.8], [x0 + dx, H - lun, z0 + dz]];
      return tubo(punti, 0.012 + R() * 0.01, M.gomma || mat({ color: 0x111111, roughness: 0.6 }));
    }

    /* ── la stanza devastata ───────────────────────────────────────────── */
    /* st: la stanza (larg, prof, alt, oggetti); vaniPer: le porte per lato;
       seme e intensita' (0..1, cresce col livello) */
    function degrado(st, vaniPer, seme, intensita) {
      if (PS1) return null;
      materialiOggetti();
      var g = new T.Group(), R = casuale(seme * 2654435761 + 97);
      var sangue = !st.senzaSangue;
      var L = st.larg, P = st.prof, H = st.alt || 3.2, I = Math.max(0.2, Math.min(1, intensita == null ? 0.6 : intensita));
      /* dove non mettere niente: le porte, con un corridoio libero verso
         il centro, e gli oggetti del livello */
      var porte = [];
      ['nord', 'sud', 'est', 'ovest'].forEach(function (lato) {
        (vaniPer(lato) || []).forEach(function (c) {
          if (lato === 'nord') porte.push([c, -P / 2]); else if (lato === 'sud') porte.push([-c, P / 2]);
          else if (lato === 'est') porte.push([L / 2, c]); else porte.push([-L / 2, -c]);
        });
      });
      var occupati = (st.oggetti || []).map(function (o) { return [o.x || 0, o.z || 0, o.tipo === 'banco' ? 1.8 : o.tipo === 'nemico' ? 0.5 : 1.0]; });
      function libero(x, z, r) {
        if (Math.abs(x) > L / 2 - r - 0.15 || Math.abs(z) > P / 2 - r - 0.15) return false;
        for (var i = 0; i < porte.length; i++) if (Math.hypot(x - porte[i][0], z - porte[i][1]) < 1.7 + r) return false;
        for (var j = 0; j < occupati.length; j++) if (Math.hypot(x - occupati[j][0], z - occupati[j][1]) < occupati[j][2] + r) return false;
        return true;
      }
      function posto(r, vicinoAlMuro) {
        for (var t = 0; t < 14; t++) {
          var x, z;
          if (vicinoAlMuro) {
            var lato = R() * 4 | 0, u = (R() - 0.5);
            x = lato < 2 ? u * (L - 1) : (lato === 2 ? 1 : -1) * (L / 2 - r - 0.25);
            z = lato < 2 ? (lato === 0 ? -1 : 1) * (P / 2 - r - 0.25) : u * (P - 1);
          } else { x = (R() - 0.5) * (L - 1); z = (R() - 0.5) * (P - 1); }
          if (libero(x, z, r)) return [x, z];
        }
        return null;
      }
      var y0 = 0.006;
      function aTerra(tipo, w, h, x, z, rot) {
        var m = macchia(tipo, w, h); m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, y0 += 0.0006, z); g.add(m); return m;
      }
      /* sui muri: si sceglie un lato e un punto lontano dalle porte */
      function sulMuro(tipo, w, h, quota) {
        for (var t = 0; t < 10; t++) {
          var lato = R() * 4 | 0, u = (R() - 0.5) * 0.8, x, z, ry;
          if (lato === 0) { x = u * L; z = -P / 2 + 0.13; ry = 0; }
          else if (lato === 1) { x = u * L; z = P / 2 - 0.13; ry = Math.PI; }
          else if (lato === 2) { x = L / 2 - 0.13; z = u * P; ry = -Math.PI / 2; }
          else { x = -L / 2 + 0.13; z = u * P; ry = Math.PI / 2; }
          var vicino = porte.some(function (p) { return Math.hypot(x - p[0], z - p[1]) < 1.6 + w / 2; });
          if (vicino) continue;
          var m = macchia(tipo, w, h); m.position.set(x, quota, z); m.rotation.set(0, ry, (R() - 0.5) * 0.3); g.add(m); return m;
        }
        return null;
      }
      var pz;
      /* lo sporco a terra, ovunque, sotto tutto il resto */
      for (var s = 0; s < 2 + I * 5; s++) { pz = posto(0.8, false); if (pz) aTerra('sporco', 1.6 + R() * 2.2, null, pz[0], pz[1], R() * 6); }
      /* la muffa che sale dal basso dei muri */
      for (var mf = 0; mf < 1 + I * 3; mf++) sulMuro('muffa', 1.6 + R() * 2, 1.4 + R() * 0.6, 0.85);
      /* il sangue: pozze, una strisciata che porta da qualche parte,
         schizzi e mani sui muri, colature */
      var nS = sangue ? Math.round(I * (2 + R() * 3)) : 0;
      for (var b = 0; b < nS; b++) { pz = posto(0.7, R() < 0.5); if (pz) aTerra('pozza', 0.9 + R() * 1.1, null, pz[0], pz[1], R() * 6); }
      if (sangue && R() < 0.35 + I * 0.5) { pz = posto(1.4, false); if (pz) aTerra('striscia', 2.4 + R() * 1.4, 0.8, pz[0], pz[1], R() * 6); }
      for (var w = 0; w < (sangue ? Math.round(I * (1 + R() * 3)) : 0); w++) sulMuro(R() < 0.6 ? 'schizzo' : 'mano', 0.9 + R() * 0.8, null, 1.0 + R() * 0.9);
      if (sangue && R() < I * 0.8) sulMuro('colatura', 1.2 + R() * 0.6, 1.6, H - 1.2);
      /* l'acqua che cola dal soffitto e i vetri rotti */
      if (R() < 0.3 + I * 0.4) { pz = posto(0.8, false); if (pz) aTerra('acqua', 1.4 + R() * 1.6, (1 + R() * 1.2), pz[0], pz[1], R() * 6); }
      if (R() < 0.5) { pz = posto(0.5, true); if (pz) aTerra('vetri', 0.9 + R() * 0.6, null, pz[0], pz[1], R() * 6); }
      /* i fogli: a mucchi, come caduti da un archivio rovesciato */
      var mucchi = 1 + Math.round(I * (1 + R() * 2));
      for (var mu = 0; mu < mucchi; mu++) {
        pz = posto(0.6, R() < 0.6); if (!pz) continue;
        var nf = 5 + (R() * 10 | 0);
        for (var f = 0; f < nf; f++) {
          var fo = new T.Mesh(cacheGeo.foglio || (cacheGeo.foglio = new T.PlaneGeometry(0.21, 0.297)), matMacchia('foglio'));
          fo.rotation.set(-Math.PI / 2 + (R() - 0.5) * 0.12, 0, R() * 6.28);
          fo.position.set(pz[0] + (R() - 0.5) * 1.6, 0.008 + f * 0.0015, pz[1] + (R() - 0.5) * 1.2);
          if (libero(fo.position.x, fo.position.z, 0.1)) { fo.receiveShadow = true; g.add(fo); }
        }
      }
      /* le sedie rovesciate e gli scatoloni sfondati */
      for (var se = 0; se < Math.round(I * (1 + R() * 2)); se++) {
        pz = posto(0.6, R() < 0.5); if (!pz) continue;
        var sd = sedia(); sd.position.set(pz[0], 0, pz[1]);
        if (R() < 0.6) { sd.rotation.set(0, R() * 6, Math.PI / 2); sd.position.y = 0.22; } else { sd.rotation.set(-Math.PI / 2, R() * 6, 0); sd.rotation.order = 'YXZ'; sd.position.y = 0.2; }
        g.add(sd);
      }
      for (var sc = 0; sc < Math.round(I * (1 + R() * 3)); sc++) {
        pz = posto(0.45, true); if (!pz) continue;
        var bx = scatolone(R); bx.position.set(pz[0], 0, pz[1]); bx.rotation.y = R() * 6; g.add(bx);
      }
      /* i calcinacci e i cavi strappati dal soffitto */
      if (R() < 0.3 + I * 0.5) {
        pz = posto(0.6, false);
        if (pz) {
          for (var ca = 0; ca < 8 + R() * 10; ca++) { var cc = calcinaccio(R); cc.position.set(pz[0] + (R() - 0.5) * 1.2, 0.03, pz[1] + (R() - 0.5) * 1.2); g.add(cc); }
          aTerra('sporco', 1.8, null, pz[0], pz[1], 0);
          for (var cv = 0; cv < 2 + R() * 3; cv++) { var cvo = cavo(R, H); cvo.position.set(pz[0] + (R() - 0.5) * 0.5, 0, pz[1] + (R() - 0.5) * 0.5); g.add(cvo); }
        }
      }
      g.userData.degrado = true;
      return g;
    }

    api.degrado = degrado;
    api.macchia = macchia;
    api.matMacchia = matMacchia;
  }

  globale.BSIAtomicDegrado = { installa: installa, versione: '1.0' };

})(typeof window !== 'undefined' ? window : globalThis);
