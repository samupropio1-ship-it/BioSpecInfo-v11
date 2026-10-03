/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mol3d.js — la molecola che si forma, e gli angoli fra i suoi legami
   BioSpecInfo · © Samuele Pio Provenzano

   DUE COSE CHE MANCAVANO

   1. LA NASCITA. Quando si sceglie una molecola, questa compariva già fatta.
      Ora arriva: gli atomi partono sparpagliati, come polvere sospesa, e
      convergono al loro posto; i legami si chiudono dopo, quando i due atomi
      che li reggono sono arrivati. Non è decorazione — è la differenza fra
      «ecco un disegno» e «ecco come sta insieme».

   2. GLI ANGOLI. Una formula piana non dice quanto vale l'angolo H–O–H, e
      nemmeno che esista. Qui gli angoli si MISURANO sulle coordinate vere
      della struttura e si mostrano uno per uno, con l'arco disegnato fra i
      due legami, il valore in gradi e il nome della geometria locale.

   DA DOVE VENGONO I NUMERI

   Gli angoli non sono tabulati: si calcolano dalle coordinate 3D della
   struttura caricata, con il prodotto scalare fra i due vettori di legame.
   Se la struttura è piatta — una molecola senza coordinate z — il modulo lo
   DICE invece di mostrare angoli inventati, perché su coordinate 2D un
   angolo di legame non è un angolo di legame.

   Questo file sostituisce `window.render3DOnCanvas` mantenendone il
   contratto: stessa firma, stesso oggetto `{stop}` restituito. L'originale
   resta raggiungibile come `window.bsiRender3DOriginale`.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  var CPK = { C:'#aaaaaa', H:'#ffffff', O:'#ff4444', N:'#4444ff', S:'#dddd00',
              P:'#ff8800', F:'#00cc00', Cl:'#00aa00', Br:'#884400', I:'#660066' };

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Gli angoli, misurati sulle coordinate
     ═════════════════════════════════════════════════════════════════════════ */

  function angoliDi(mol) {
    var vicini = mol.atoms.map(function () { return []; });
    mol.bonds.forEach(function (b) {
      if (vicini[b.a] && vicini[b.b]) { vicini[b.a].push(b.b); vicini[b.b].push(b.a); }
    });
    var fuori = [];
    for (var c = 0; c < mol.atoms.length; c++) {
      var v = vicini[c];
      if (v.length < 2) continue;
      for (var i = 0; i < v.length; i++) {
        for (var j = i + 1; j < v.length; j++) {
          var A = mol.atoms[v[i]], B = mol.atoms[c], C = mol.atoms[v[j]];
          var u = [A.x - B.x, A.y - B.y, A.z - B.z];
          var w = [C.x - B.x, C.y - B.y, C.z - B.z];
          var nu = Math.sqrt(u[0]*u[0] + u[1]*u[1] + u[2]*u[2]);
          var nw = Math.sqrt(w[0]*w[0] + w[1]*w[1] + w[2]*w[2]);
          if (!nu || !nw) continue;
          var cos = (u[0]*w[0] + u[1]*w[1] + u[2]*w[2]) / (nu * nw);
          cos = Math.max(-1, Math.min(1, cos));
          fuori.push({ a: v[i], c: c, b: v[j],
                       gradi: Math.acos(cos) * 180 / Math.PI,
                       legami: v.length });
        }
      }
    }
    return { angoli: fuori, vicini: vicini };
  }

  /* Il nome della geometria locale: si decide dal numero di legami e
     dall'angolo misurato, non da una tabella di elementi — l'azoto in NH₃ è
     piramidale e in un'ammide è quasi planare, e la differenza si vede nelle
     coordinate, non nel simbolo. */
  function geometria(nLegami, gradi) {
    if (nLegami === 2) {
      if (gradi > 155) return t('lineare', 'linear');
      if (gradi > 115) return t('angolata (sp²)', 'bent (sp²)');
      return t('angolata (sp³)', 'bent (sp³)');
    }
    if (nLegami === 3) {
      if (gradi > 117) return t('trigonale planare', 'trigonal planar');
      return t('piramidale trigonale', 'trigonal pyramidal');
    }
    if (nLegami === 4) return t('tetraedrica', 'tetrahedral');
    if (nLegami === 5) return t('bipiramidale trigonale', 'trigonal bipyramidal');
    if (nLegami === 6) return t('ottaedrica', 'octahedral');
    return t('—', '—');
  }

  /* L'angolo ideale del modello VSEPR, per confronto. Si mostra accanto a
     quello misurato: la differenza fra 109,5 e 104,5 nell'acqua è il punto
     della teoria, non un errore di misura. */
  function ideale(nLegami) {
    return nLegami === 2 ? 180 : nLegami === 3 ? 120 : nLegami === 4 ? 109.5 : null;
  }

  function piatta(mol) {
    var z = mol.atoms.map(function (a) { return a.z || 0; });
    var min = Math.min.apply(null, z), max = Math.max.apply(null, z);
    return (max - min) < 1e-6;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Il renderer
     ═════════════════════════════════════════════════════════════════════════ */

  var originale = globale.render3DOnCanvas;
  globale.bsiRender3DOriginale = originale;

  function render(canvas, mol) {
    if (!canvas || !mol || !mol.atoms || !mol.atoms.length) return null;
    var W = canvas.width || canvas.offsetWidth || 460;
    var H = canvas.height || canvas.offsetHeight || 320;
    canvas.width = W; canvas.height = H;
    var ctx = (typeof globale.bsiNitido === 'function')
      ? globale.bsiNitido(canvas) : canvas.getContext('2d');
    if (!ctx) return null;

    var rotX = 0.3, rotY = 0, drag = false, lx = 0, ly = 0, raf = null;
    var scala = 1, minS = 0.5, maxS = 4;

    /* centro e raggio */
    var cx = 0, cy = 0, cz = 0, n = mol.atoms.length || 1;
    mol.atoms.forEach(function (a) { cx += a.x; cy += a.y; cz += (a.z || 0); });
    cx /= n; cy /= n; cz /= n;
    var maxD = 0;
    mol.atoms.forEach(function (a) {
      var d = Math.sqrt((a.x-cx)*(a.x-cx) + (a.y-cy)*(a.y-cy) + ((a.z||0)-cz)*((a.z||0)-cz));
      if (d > maxD) maxD = d;
    });
    var scalaBase = maxD > 0 ? Math.min(W, H) * 0.35 / maxD : 1;

    /* ── la polvere: posizioni di partenza e particelle ──────────────────
       Ogni atomo parte da un punto casuale su una sfera larga tre volte la
       molecola; il seme è deterministico (l'indice dell'atomo), così la
       stessa molecola nasce sempre allo stesso modo e il banco può misurarla. */
    function caso(i, k) {
      var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return x - Math.floor(x);
    }
    var partenze = mol.atoms.map(function (a, i) {
      var th = caso(i, 1) * Math.PI * 2, ph = Math.acos(2 * caso(i, 2) - 1);
      var r = maxD * (2.2 + caso(i, 3) * 1.6) + 1;
      return { x: cx + r * Math.sin(ph) * Math.cos(th),
               y: cy + r * Math.sin(ph) * Math.sin(th),
               z: cz + r * Math.cos(ph) };
    });
    var POLVERE = Math.min(150, 40 + mol.atoms.length * 4);
    var polvere = [];
    for (var p = 0; p < POLVERE; p++) {
      var th2 = caso(p + 500, 1) * Math.PI * 2, ph2 = Math.acos(2 * caso(p + 500, 2) - 1);
      var r2 = maxD * (1.2 + caso(p + 500, 3) * 2.4) + 0.5;
      polvere.push({ x: cx + r2 * Math.sin(ph2) * Math.cos(th2),
                     y: cy + r2 * Math.sin(ph2) * Math.sin(th2),
                     z: cz + r2 * Math.cos(ph2),
                     f: 0.4 + caso(p + 500, 4) * 0.6 });
    }

    var DURATA = 1600;
    var t0 = (globale.performance && performance.now) ? performance.now() : Date.now();
    var nascita = 0;              /* 0 → 1 */
    var modoAngoli = false, indiceAngolo = 0, tAngolo = 0;

    var info = angoliDi(mol);
    var angoli = info.angoli.slice().sort(function (a, b) {
      /* prima gli atomi più connessi, poi gli angoli più larghi: si vedono
         meglio e raccontano la geometria principale */
      if (b.legami !== a.legami) return b.legami - a.legami;
      return b.gradi - a.gradi;
    });
    var molPiatta = piatta(mol);

    function ora() {
      return (globale.performance && performance.now) ? performance.now() : Date.now();
    }
    function facile(x) { return 1 - Math.pow(1 - x, 3); }     /* ease-out cubica */

    function proj(x, y, z) {
      var x0 = x - cx, y0 = y - cy, z0 = z - cz;
      var x1 = x0 * Math.cos(rotY) - z0 * Math.sin(rotY);
      var z1 = x0 * Math.sin(rotY) + z0 * Math.cos(rotY);
      var y2 = y0 * Math.cos(rotX) - z1 * Math.sin(rotX);
      var z2 = y0 * Math.sin(rotX) + z1 * Math.cos(rotX);
      var f = 350, dz = f + z2 * scalaBase * scala;
      return { sx: W/2 + x1 * scalaBase * scala * (f/dz),
               sy: H/2 - y2 * scalaBase * scala * (f/dz), z: z2, depth: dz };
    }
    function rgb(h) {
      return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    }

    /* ── comandi ──────────────────────────────────────────────────────── */
    canvas.addEventListener('mousedown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; });
    canvas.addEventListener('mousemove', function (e) {
      if (!drag) return;
      rotY += (e.clientX - lx) * 0.012; rotX += (e.clientY - ly) * 0.012;
      lx = e.clientX; ly = e.clientY;
    });
    canvas.addEventListener('mouseup', function () { drag = false; });
    canvas.addEventListener('mouseleave', function () { drag = false; });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      scala = Math.max(minS, Math.min(maxS, scala * (e.deltaY < 0 ? 1.12 : 0.9)));
    }, { passive: false });
    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault(); drag = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY;
    }, { passive: false });
    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault(); if (!drag) return;
      rotY += (e.touches[0].clientX - lx) * 0.012;
      rotX += (e.touches[0].clientY - ly) * 0.012;
      lx = e.touches[0].clientX; ly = e.touches[0].clientY;
    }, { passive: false });
    canvas.addEventListener('touchend', function () { drag = false; });

    /* la barra: pulsanti VERI, con il loro nome accessibile */
    var barra = costruisciBarra(canvas, {
      rinasci: function () { t0 = ora(); nascita = 0; },
      angoli: function (attivo) { modoAngoli = attivo; indiceAngolo = 0; tAngolo = ora(); },
      quanti: angoli.length, piatta: molPiatta
    });

    /* ── il disegno ───────────────────────────────────────────────────── */
    function posizione(i) {
      var a = mol.atoms[i];
      if (nascita >= 1) return { x: a.x, y: a.y, z: a.z || 0 };
      var q = facile(Math.max(0, Math.min(1, (nascita - 0.12) / 0.78)));
      var s = partenze[i];
      return { x: s.x + (a.x - s.x) * q,
               y: s.y + (a.y - s.y) * q,
               z: s.z + ((a.z || 0) - s.z) * q };
    }

    function frame() {
      if (!canvas.isConnected) { cancelAnimationFrame(raf); raf = null; if (barra) barra.remove(); return; }
      var adesso = ora();
      nascita = Math.min(1, (adesso - t0) / DURATA);
      if (!drag && nascita >= 1) rotY += 0.006;

      ctx.clearRect(0, 0, W, H);
      var bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
      bg.addColorStop(0, '#0d1b2e'); bg.addColorStop(1, '#060d1a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      /* polvere: c'è all'inizio e svanisce quando la molecola si chiude */
      if (nascita < 0.95) {
        var op = Math.max(0, 1 - nascita / 0.9);
        polvere.forEach(function (d, i) {
          var g = 1 - facile(Math.max(0, Math.min(1, (nascita - 0.1) / 0.85)));
          var pp = proj(cx + (d.x - cx) * g, cy + (d.y - cy) * g, cz + (d.z - cz) * g);
          var rr = 1.1 + d.f * 1.4;
          ctx.beginPath();
          ctx.arc(pp.sx, pp.sy, rr, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(150,200,255,' + (op * d.f * 0.5).toFixed(3) + ')';
          ctx.fill();
        });
      }

      var pts = mol.atoms.map(function (a, i) {
        var q = posizione(i);
        return { p: proj(q.x, q.y, q.z), a: a, i: i };
      });
      var ordinati = pts.slice().sort(function (x, y) { return x.p.z - y.p.z; });

      /* l'angolo in evidenza, se il modo è acceso */
      var ev = null;
      if (modoAngoli && angoli.length && nascita >= 1) {
        if (adesso - tAngolo > 2400) { tAngolo = adesso; indiceAngolo = (indiceAngolo + 1) % angoli.length; }
        ev = angoli[indiceAngolo];
      }
      function inEvidenza(i) {
        return ev && (i === ev.a || i === ev.b || i === ev.c);
      }

      /* legami: si chiudono dopo che gli atomi sono arrivati */
      var apLeg = Math.max(0, Math.min(1, (nascita - 0.45) / 0.5));
      mol.bonds.forEach(function (bd) {
        var p1 = pts[bd.a], p2 = pts[bd.b];
        if (!p1 || !p2) return;
        var spento = ev && !(inEvidenza(bd.a) && inEvidenza(bd.b));
        var c1 = rgb(p1.a.color || CPK[p1.a.el] || '#aaaaaa');
        var c2 = rgb(p2.a.color || CPK[p2.a.el] || '#aaaaaa');
        /* il legame cresce dai due capi verso il centro */
        var mx = (p1.p.sx + p2.p.sx) / 2, my = (p1.p.sy + p2.p.sy) / 2;
        var ax = p1.p.sx + (mx - p1.p.sx) * apLeg, ay = p1.p.sy + (my - p1.p.sy) * apLeg;
        var bx = p2.p.sx + (mx - p2.p.sx) * apLeg, by = p2.p.sy + (my - p2.p.sy) * apLeg;
        var alfa = (spento ? 0.14 : 0.85) * (apLeg > 0 ? 1 : 0);
        if (alfa <= 0) return;
        var grd = ctx.createLinearGradient(p1.p.sx, p1.p.sy, p2.p.sx, p2.p.sy);
        grd.addColorStop(0, 'rgba(' + c1[0] + ',' + c1[1] + ',' + c1[2] + ',' + alfa + ')');
        grd.addColorStop(1, 'rgba(' + c2[0] + ',' + c2[1] + ',' + c2[2] + ',' + alfa + ')');
        ctx.beginPath(); ctx.moveTo(p1.p.sx, p1.p.sy); ctx.lineTo(ax, ay);
        ctx.moveTo(p2.p.sx, p2.p.sy); ctx.lineTo(bx, by);
        ctx.strokeStyle = grd;
        ctx.lineWidth = bd.t === 2 ? 3 : bd.t === 3 ? 4 : 2;
        ctx.stroke();
        if (bd.t === 2 && apLeg > 0.6) {
          var dx = p2.p.sx - p1.p.sx, dy = p2.p.sy - p1.p.sy;
          var len = Math.sqrt(dx*dx + dy*dy) || 1;
          var ox = (-dy/len) * 3, oy = (dx/len) * 3;
          ctx.beginPath();
          ctx.moveTo(p1.p.sx + ox, p1.p.sy + oy); ctx.lineTo(p2.p.sx + ox, p2.p.sy + oy);
          ctx.lineWidth = 1.5; ctx.stroke();
        }
      });

      /* l'arco dell'angolo, fra i due legami */
      if (ev) disegnaAngolo(ctx, pts, ev);

      /* atomi */
      ordinati.forEach(function (pt) {
        var cresci = Math.max(0, Math.min(1, (nascita - 0.05) / 0.5));
        var r = Math.max(5, Math.min(14, 10 * (350 / Math.max(200, pt.p.depth)))) *
                (0.25 + 0.75 * facile(cresci));
        var spento = ev && !inEvidenza(pt.i);
        var col = rgb(pt.a.color || CPK[pt.a.el] || '#aaaaaa');
        var g = ctx.createRadialGradient(pt.p.sx - r*0.3, pt.p.sy - r*0.3, 1, pt.p.sx, pt.p.sy, r);
        var chiaro = spento ? 0.35 : 1;
        g.addColorStop(0, 'rgba(' + Math.min(255, col[0]+80) + ',' + Math.min(255, col[1]+80) +
                          ',' + Math.min(255, col[2]+80) + ',' + chiaro + ')');
        g.addColorStop(1, 'rgba(' + Math.round(col[0]*0.25) + ',' + Math.round(col[1]*0.25) +
                          ',' + Math.round(col[2]*0.25) + ',' + chiaro + ')');
        ctx.beginPath(); ctx.arc(pt.p.sx, pt.p.sy, r, 0, 2*Math.PI);
        ctx.fillStyle = g; ctx.fill();
        /* mentre arriva, un alone: si vede che si sta posando */
        if (nascita < 1) {
          ctx.beginPath(); ctx.arc(pt.p.sx, pt.p.sy, r * (1.6 + (1-nascita)), 0, 2*Math.PI);
          ctx.fillStyle = 'rgba(120,200,255,' + ((1 - nascita) * 0.12).toFixed(3) + ')';
          ctx.fill();
        }
        if (r >= 7 && pt.a.el !== 'H' && !spento) {
          ctx.font = 'bold ' + Math.round(r*0.9) + 'px Arial';
          ctx.fillStyle = 'rgba(255,255,255,.9)';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(pt.a.el, pt.p.sx, pt.p.sy);
        }
      });

      scriviLegenda(ctx, ev);
      raf = requestAnimationFrame(frame);
    }

    function disegnaAngolo(ctx2, pts, ev) {
      var A = pts[ev.a].p, B = pts[ev.c].p, C = pts[ev.b].p;
      var v1 = [A.sx - B.sx, A.sy - B.sy], v2 = [C.sx - B.sx, C.sy - B.sy];
      var n1 = Math.hypot(v1[0], v1[1]) || 1, n2 = Math.hypot(v2[0], v2[1]) || 1;
      var raggio = Math.min(n1, n2) * 0.42;
      var a1 = Math.atan2(v1[1], v1[0]), a2 = Math.atan2(v2[1], v2[0]);
      var d = a2 - a1;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      ctx2.beginPath();
      ctx2.arc(B.sx, B.sy, raggio, a1, a1 + d, d < 0);
      ctx2.strokeStyle = 'rgba(94,234,212,.95)'; ctx2.lineWidth = 2.5; ctx2.stroke();
      /* i due raggi, perché si veda fra CHE cosa è l'angolo */
      ctx2.beginPath();
      ctx2.moveTo(B.sx, B.sy); ctx2.lineTo(B.sx + v1[0]/n1*raggio*1.25, B.sy + v1[1]/n1*raggio*1.25);
      ctx2.moveTo(B.sx, B.sy); ctx2.lineTo(B.sx + v2[0]/n2*raggio*1.25, B.sy + v2[1]/n2*raggio*1.25);
      ctx2.strokeStyle = 'rgba(94,234,212,.45)'; ctx2.lineWidth = 1; ctx2.stroke();
      /* l'etichetta, fuori dall'arco */
      var am = a1 + d/2;
      var ex = B.sx + Math.cos(am) * (raggio + 22), ey = B.sy + Math.sin(am) * (raggio + 22);
      var testo = ev.gradi.toFixed(1) + '°';
      ctx2.font = 'bold 13px Arial'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
      var w = ctx2.measureText(testo).width + 12;
      ctx2.fillStyle = 'rgba(6,20,31,.88)';
      ctx2.beginPath();
      if (ctx2.roundRect) { ctx2.roundRect(ex - w/2, ey - 11, w, 22, 6); ctx2.fill(); }
      else ctx2.fillRect(ex - w/2, ey - 11, w, 22);
      ctx2.fillStyle = '#5eead4'; ctx2.fillText(testo, ex, ey);
    }

    function scriviLegenda(ctx2, ev) {
      ctx2.textAlign = 'left'; ctx2.textBaseline = 'alphabetic';
      if (nascita < 1) {
        ctx2.font = '10px Arial';
        ctx2.fillStyle = 'rgba(150,200,255,' + (0.75 * (1 - nascita * 0.5)).toFixed(2) + ')';
        ctx2.fillText(t('la molecola si sta formando…', 'the molecule is forming…'), 8, H - 10);
        return;
      }
      if (ev) {
        var A = mol.atoms[ev.a], B = mol.atoms[ev.c], C = mol.atoms[ev.b];
        var nome = (A.el || '?') + '–' + (B.el || '?') + '–' + (C.el || '?');
        var geo = geometria(ev.legami, ev.gradi);
        var id = ideale(ev.legami);
        ctx2.font = 'bold 12px Arial'; ctx2.fillStyle = '#5eead4';
        ctx2.fillText(nome + '  ' + ev.gradi.toFixed(1) + '°', 8, 18);
        ctx2.font = '10.5px Arial'; ctx2.fillStyle = 'rgba(190,220,240,.85)';
        ctx2.fillText(geo + (id ? '  ·  ' + t('ideale', 'ideal') + ' ' + id + '°' : ''), 8, 34);
        ctx2.font = '9.5px Arial'; ctx2.fillStyle = 'rgba(150,180,210,.7)';
        ctx2.fillText((indiceAngolo + 1) + '/' + angoli.length, 8, 48);
      }
      ctx2.font = '9px Arial'; ctx2.fillStyle = 'rgba(150,180,255,.4)';
      ctx2.textAlign = 'right';
      ctx2.fillText(t('trascina · rotella per lo zoom', 'drag · scroll to zoom'), W - 6, H - 6);
      ctx2.textAlign = 'left';
    }

    frame();
    return { stop: function () {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (barra) barra.remove();
    } };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · La barra dei comandi — pulsanti veri, non rettangoli disegnati
     ═════════════════════════════════════════════════════════════════════════ */
  function costruisciBarra(canvas, opz) {
    if (!canvas.parentNode) return null;
    var vecchia = canvas.parentNode.querySelector('.bsi3d-barra[data-per="' + (canvas.id || '') + '"]');
    if (vecchia) vecchia.remove();
    var barra = document.createElement('div');
    barra.className = 'bsi3d-barra';
    barra.setAttribute('data-per', canvas.id || '');
    barra.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 2px';

    function bottone(testo, etichetta) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = testo;
      b.setAttribute('aria-label', etichetta);
      b.style.cssText = 'background:#16293f;border:1px solid #1e3a52;border-radius:8px;' +
        'color:#bcd3e8;font-size:11.5px;font-weight:700;padding:6px 12px;cursor:pointer';
      barra.appendChild(b);
      return b;
    }

    var b1 = bottone(t('↻ Rivedi la formazione', '↻ Replay the formation'),
                     t('Rivedi l’animazione di formazione della molecola',
                       'Replay the molecule formation animation'));
    b1.onclick = function () { opz.rinasci(); };

    var attivo = false;
    var b2 = bottone(t('📐 Angoli di legame', '📐 Bond angles'),
                     t('Mostra gli angoli fra i legami, uno per volta',
                       'Show the angles between bonds, one at a time'));
    if (!opz.quanti) {
      b2.disabled = true; b2.style.opacity = '.45'; b2.style.cursor = 'default';
      b2.title = t('questa struttura non ha atomi con due legami',
                   'this structure has no atom with two bonds');
    } else if (opz.piatta) {
      /* Su coordinate piatte un angolo di legame non è un angolo di legame:
         lo si dice invece di mostrare numeri che sembrano misure. */
      b2.disabled = true; b2.style.opacity = '.45'; b2.style.cursor = 'default';
      b2.title = t('la struttura caricata è piana (z = 0): gli angoli reali ' +
                   'non si possono misurare su coordinate 2D',
                   'the loaded structure is flat (z = 0): real angles cannot be ' +
                   'measured on 2D coordinates');
      var avviso = document.createElement('span');
      avviso.textContent = t('struttura piana: angoli non misurabili',
                             'flat structure: angles not measurable');
      avviso.style.cssText = 'color:#f0d79a;font-size:11px;align-self:center';
      barra.appendChild(avviso);
    } else {
      b2.onclick = function () {
        attivo = !attivo;
        opz.angoli(attivo);
        b2.style.background = attivo ? '#1aa97a' : '#16293f';
        b2.style.color = attivo ? '#06141f' : '#bcd3e8';
        b2.setAttribute('aria-pressed', attivo ? 'true' : 'false');
      };
      b2.setAttribute('aria-pressed', 'false');
      var conta = document.createElement('span');
      conta.textContent = opz.quanti + ' ' + t('angoli misurati', 'measured angles');
      conta.style.cssText = 'color:#7fd8c0;font-size:11px;align-self:center';
      barra.appendChild(conta);
    }

    canvas.parentNode.insertBefore(barra, canvas.nextSibling);
    return barra;
  }

  /* ═════════════════════════════════════════════════════════════════════════ */

  globale.render3DOnCanvas = render;
  globale.bsiAngoliDi = angoliDi;
  globale.bsiGeometria = geometria;
  globale.BSIMol3D = { render: render, angoliDi: angoliDi, geometria: geometria,
                       ideale: ideale, piatta: piatta, versione: '1.0' };

})(typeof window !== 'undefined' ? window : globalThis);
