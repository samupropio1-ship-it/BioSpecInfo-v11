/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mol3d.js — la molecola che si forma, e gli angoli che scegli tu
   BioSpecInfo · © Samuele Pio Provenzano

   1 · LA NASCITA

   La molecola non compare: si condensa. Una nube di polvere ruota nel vuoto;
   ogni granello è assegnato a un atomo e gli spirala dentro finché viene
   assorbito. Gli atomi non arrivano tutti insieme — prima lo SCHELETRO
   pesante, poi gli idrogeni — perché è così che si guarda una struttura: si
   vede prima la catena e poi di che cosa è vestita. Ogni atomo che si posa
   manda un anello d'urto; ogni legame, quando i suoi due atomi sono arrivati,
   si chiude con una scintilla che lo percorre da un capo all'altro.

   L'arrivo ha un rimbalzo elastico: un punto che si ferma di colpo sembra
   disegnato, uno che oltrepassa di poco e torna sembra arrivato.

   2 · GLI ANGOLI LI SCEGLIE CHI GUARDA

   Un carosello che mostra gli angoli a turno risponde alla domanda sbagliata:
   chi studia vuole sapere quanto vale QUELL'angolo, non scorrerli tutti. Si
   clicca sugli atomi:

     1 atomo    → tutti gli angoli che insistono su di lui, insieme
     2 atomi    → la lunghezza del legame che li unisce
     3 atomi    → l'angolo A–B–C, con il vertice nel secondo cliccato
     4 atomi    → l'angolo diedro A–B–C–D, che è ciò che distingue una
                  conformazione da un'altra

   Il carosello resta, come comando a parte, per chi vuole solo guardare.

   DA DOVE VENGONO I NUMERI

   Angoli, lunghezze e diedri si calcolano dalle coordinate 3D della struttura
   caricata — prodotto scalare per gli angoli, prodotto vettoriale per i
   diedri. Se la struttura è piatta il modulo lo DICE invece di mostrare numeri
   che somigliano a misure: su coordinate con z = 0 un angolo di legame non è
   un angolo di legame.

   Questo file sostituisce `window.render3DOnCanvas` mantenendone il contratto:
   stessa firma, stesso oggetto restituito (con `stop`). L'originale resta
   raggiungibile come `window.bsiRender3DOriginale`.
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
     §1 · Geometria: angoli, lunghezze, diedri
     ═════════════════════════════════════════════════════════════════════════ */

  function vicinanze(mol) {
    var v = mol.atoms.map(function () { return []; });
    mol.bonds.forEach(function (b) {
      if (v[b.a] && v[b.b]) { v[b.a].push(b.b); v[b.b].push(b.a); }
    });
    return v;
  }

  function vett(A, B) { return [B.x - A.x, B.y - A.y, (B.z || 0) - (A.z || 0)]; }
  function norma(u) { return Math.sqrt(u[0]*u[0] + u[1]*u[1] + u[2]*u[2]); }
  function scal(u, w) { return u[0]*w[0] + u[1]*w[1] + u[2]*w[2]; }
  function vettoriale(u, w) {
    return [u[1]*w[2] - u[2]*w[1], u[2]*w[0] - u[0]*w[2], u[0]*w[1] - u[1]*w[0]];
  }

  function angoloFra(A, B, C) {
    /* angolo nel vertice B */
    var u = vett(B, A), w = vett(B, C);
    var nu = norma(u), nw = norma(w);
    if (!nu || !nw) return null;
    var c = Math.max(-1, Math.min(1, scal(u, w) / (nu * nw)));
    return Math.acos(c) * 180 / Math.PI;
  }

  function lunghezza(A, B) { return norma(vett(A, B)); }

  /* Il diedro A–B–C–D: l'angolo fra il piano ABC e il piano BCD. È il numero
     che distingue anti da gauche, e nessuna formula piana lo contiene. */
  function diedro(A, B, C, D) {
    var b1 = vett(A, B), b2 = vett(B, C), b3 = vett(C, D);
    var n1 = vettoriale(b1, b2), n2 = vettoriale(b2, b3);
    var m = vettoriale(n1, b2.map(function (x) { return x / (norma(b2) || 1); }));
    var x = scal(n1, n2), y = scal(m, n2);
    if (!norma(n1) || !norma(n2)) return null;
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  function angoliDi(mol) {
    var vic = vicinanze(mol);
    var fuori = [];
    for (var c = 0; c < mol.atoms.length; c++) {
      var v = vic[c];
      if (v.length < 2) continue;
      for (var i = 0; i < v.length; i++) {
        for (var j = i + 1; j < v.length; j++) {
          var g = angoloFra(mol.atoms[v[i]], mol.atoms[c], mol.atoms[v[j]]);
          if (g == null) continue;
          fuori.push({ a: v[i], c: c, b: v[j], gradi: g, legami: v.length });
        }
      }
    }
    return { angoli: fuori, vicini: vic };
  }

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
    return '—';
  }

  function ideale(nLegami) {
    return nLegami === 2 ? 180 : nLegami === 3 ? 120 : nLegami === 4 ? 109.5 : null;
  }

  /* Il nome della conformazione che il diedro descrive. */
  function conformazione(gradi) {
    var g = Math.abs(gradi);
    if (g < 30) return t('sin-periplanare (eclissata)', 'syn-periplanar (eclipsed)');
    if (g < 90) return t('sin-clinale (gauche)', 'syn-clinal (gauche)');
    if (g < 150) return t('anti-clinale', 'anti-clinal');
    return t('anti-periplanare (sfalsata)', 'anti-periplanar (staggered)');
  }

  function piatta(mol) {
    var z = mol.atoms.map(function (a) { return a.z || 0; });
    return (Math.max.apply(null, z) - Math.min.apply(null, z)) < 1e-6;
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

    var rotX = 0.3, rotY = 0, drag = false, mosso = 0, lx = 0, ly = 0, raf = null;
    var scala = 1, minS = 0.5, maxS = 4;

    var n = mol.atoms.length;
    var cx = 0, cy = 0, cz = 0;
    mol.atoms.forEach(function (a) { cx += a.x; cy += a.y; cz += (a.z || 0); });
    cx /= n; cy /= n; cz /= n;
    var maxD = 0;
    mol.atoms.forEach(function (a) {
      var d = Math.sqrt((a.x-cx)*(a.x-cx) + (a.y-cy)*(a.y-cy) + ((a.z||0)-cz)*((a.z||0)-cz));
      if (d > maxD) maxD = d;
    });
    var scalaBase = maxD > 0 ? Math.min(W, H) * 0.35 / maxD : 1;

    var info = angoliDi(mol);
    var vicini = info.vicini;
    var molPiatta = piatta(mol);

    /* ── §2.1 · L'ordine d'arrivo: prima lo scheletro, poi gli idrogeni ──
       Non è un vezzo: è l'ordine con cui si legge una struttura. */
    var ordine = mol.atoms.map(function (a, i) {
      var leggero = (a.el === 'H' || a.el === 'D') ? 1 : 0;
      var d = Math.sqrt((a.x-cx)*(a.x-cx) + (a.y-cy)*(a.y-cy) + ((a.z||0)-cz)*((a.z||0)-cz));
      return { i: i, leggero: leggero, d: d, legami: (vicini[i] || []).length };
    }).sort(function (p, q) {
      if (p.leggero !== q.leggero) return p.leggero - q.leggero;   /* pesanti prima */
      if (q.legami !== p.legami) return q.legami - p.legami;       /* più connessi prima */
      return p.d - q.d;                                            /* dal centro in fuori */
    });
    var ritardo = new Array(n);
    ordine.forEach(function (o, k) { ritardo[o.i] = (k / Math.max(1, n - 1)) * 0.42; });

    /* ── §2.2 · La polvere ──────────────────────────────────────────────
       Seme deterministico: la stessa molecola nasce sempre allo stesso modo, e
       il banco può misurarla. */
    function caso(i, k) {
      var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return x - Math.floor(x);
    }
    function suSfera(seme, raggio) {
      var th = caso(seme, 1) * Math.PI * 2, ph = Math.acos(2 * caso(seme, 2) - 1);
      return { x: cx + raggio * Math.sin(ph) * Math.cos(th),
               y: cy + raggio * Math.sin(ph) * Math.sin(th),
               z: cz + raggio * Math.cos(ph) };
    }
    var partenze = mol.atoms.map(function (a, i) {
      return suSfera(i, maxD * (2.3 + caso(i, 3) * 1.7) + 1);
    });
    var POLVERE = Math.min(220, 60 + n * 7);
    var polvere = [];
    for (var p = 0; p < POLVERE; p++) {
      var bersaglio = (p % (n + 2) < n) ? (p % (n + 2)) : -1;   /* alcuni granelli restano liberi */
      var s = suSfera(p + 977, maxD * (1.4 + caso(p + 977, 3) * 2.6) + 0.6);
      polvere.push({ x: s.x, y: s.y, z: s.z, bersaglio: bersaglio,
                     f: 0.35 + caso(p + 977, 4) * 0.65,
                     giro: (caso(p + 977, 5) - 0.5) * 5.0,
                     ritardo: bersaglio >= 0 ? ritardo[bersaglio] : caso(p + 977, 6) * 0.3 });
    }

    var DURATA = 2100;
    var t0 = ora();
    var nascita = 0;
    var arrivato = new Array(n).fill(0);     /* istante d'arrivo, per l'anello d'urto */
    var legameNato = mol.bonds.map(function () { return 0; });

    /* carosello e selezione */
    var carosello = false, indiceAngolo = 0, tAngolo = 0;
    var angoli = info.angoli.slice().sort(function (a, b) {
      if (b.legami !== a.legami) return b.legami - a.legami;
      return b.gradi - a.gradi;
    });
    var scelti = [];                          /* indici degli atomi cliccati, in ordine */
    var proiettati = [];                      /* ultime posizioni sullo schermo */

    function ora() {
      return (globale.performance && performance.now) ? performance.now() : Date.now();
    }
    function facile(x) { return 1 - Math.pow(1 - x, 3); }
    /* elastica dolce: un piccolo oltrepassamento e il ritorno */
    function elastica(x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return 1 - Math.pow(2, -9 * x) * Math.cos(x * Math.PI * 2.6);
    }

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
    function colore(a) { return a.color || CPK[a.el] || '#aaaaaa'; }

    /* ── §2.3 · Comandi: trascinare ruota, cliccare sceglie ─────────────
       Si distingue il clic dal trascinamento contando i pixel percorsi: sotto
       i cinque è un clic, sopra è una rotazione. Senza questa distinzione ogni
       rotazione finirebbe per selezionare un atomo. */
    function giu(x, y) { drag = true; mosso = 0; lx = x; ly = y; }
    function muovi(x, y) {
      if (!drag) return;
      var dx = x - lx, dy = y - ly;
      mosso += Math.abs(dx) + Math.abs(dy);
      rotY += dx * 0.012; rotX += dy * 0.012;
      lx = x; ly = y;
    }
    function su(x, y, rect) {
      var eraClic = drag && mosso < 5;
      drag = false;
      if (!eraClic) return;
      var px = x - rect.left, py = y - rect.top;
      var vicinoA = -1, dmin = 1e9;
      proiettati.forEach(function (pt, i) {
        var d = Math.hypot(pt.sx - px, pt.sy - py);
        if (d < dmin) { dmin = d; vicinoA = i; }
      });
      if (vicinoA < 0 || dmin > 22) { scelti = []; aggiornaBarra(); return; }
      var k = scelti.indexOf(vicinoA);
      if (k >= 0) scelti.splice(k, 1);
      else { if (scelti.length >= 4) scelti = []; scelti.push(vicinoA); }
      carosello = false;
      aggiornaBarra();
    }

    canvas.addEventListener('mousedown', function (e) { giu(e.clientX, e.clientY); });
    canvas.addEventListener('mousemove', function (e) { muovi(e.clientX, e.clientY); });
    canvas.addEventListener('mouseup', function (e) {
      su(e.clientX, e.clientY, canvas.getBoundingClientRect());
    });
    canvas.addEventListener('mouseleave', function () { drag = false; });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      scala = Math.max(minS, Math.min(maxS, scala * (e.deltaY < 0 ? 1.12 : 0.9)));
    }, { passive: false });
    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault(); giu(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault(); muovi(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) {
      var tt = e.changedTouches && e.changedTouches[0];
      if (tt) su(tt.clientX, tt.clientY, canvas.getBoundingClientRect());
      else drag = false;
    });
    canvas.style.cursor = 'crosshair';

    /* ── §2.4 · Che cosa dice la selezione ──────────────────────────────── */
    function misura() {
      var A = mol.atoms;
      if (scelti.length === 2) {
        var l = lunghezza(A[scelti[0]], A[scelti[1]]);
        var legati = (vicini[scelti[0]] || []).indexOf(scelti[1]) >= 0;
        return { tipo: 'lunghezza', valore: l, legati: legati,
                 titolo: (A[scelti[0]].el || '?') + '–' + (A[scelti[1]].el || '?') + '  ' +
                         l.toFixed(3) + ' Å',
                 sotto: legati ? t('legame', 'bond')
                               : t('distanza, non legame', 'distance, not a bond') };
      }
      if (scelti.length === 3) {
        var B = scelti[1];
        var legA = (vicini[B] || []).indexOf(scelti[0]) >= 0;
        var legC = (vicini[B] || []).indexOf(scelti[2]) >= 0;
        var g = angoloFra(A[scelti[0]], A[B], A[scelti[2]]);
        if (g == null) return null;
        var nl = (vicini[B] || []).length;
        var id = ideale(nl);
        return { tipo: 'angolo', valore: g, vertice: B, dilegame: legA && legC,
                 titolo: (A[scelti[0]].el||'?') + '–' + (A[B].el||'?') + '–' +
                         (A[scelti[2]].el||'?') + '  ' + g.toFixed(1) + '°',
                 sotto: (legA && legC)
                   ? geometria(nl, g) + (id ? '  ·  ' + t('ideale','ideal') + ' ' + id + '°' : '')
                   : t('angolo fra atomi non tutti legati al vertice',
                       'angle between atoms not all bonded to the vertex') };
      }
      if (scelti.length === 4) {
        var d = diedro(A[scelti[0]], A[scelti[1]], A[scelti[2]], A[scelti[3]]);
        if (d == null) return null;
        return { tipo: 'diedro', valore: d,
                 titolo: (A[scelti[0]].el||'?') + '–' + (A[scelti[1]].el||'?') + '–' +
                         (A[scelti[2]].el||'?') + '–' + (A[scelti[3]].el||'?') + '  ' +
                         d.toFixed(1) + '°',
                 sotto: t('angolo diedro · ', 'dihedral angle · ') + conformazione(d) };
      }
      if (scelti.length === 1) {
        var c = scelti[0], v = vicini[c] || [];
        if (v.length < 2) {
          return { tipo: 'atomo', titolo: (A[c].el || '?'),
                   sotto: v.length === 1
                     ? t('un solo legame: non c’è un angolo da misurare qui',
                         'a single bond: there is no angle to measure here')
                     : t('nessun legame', 'no bonds') };
        }
        var ang = info.angoli.filter(function (x) { return x.c === c; });
        var med = ang.reduce(function (s2, x) { return s2 + x.gradi; }, 0) / ang.length;
        return { tipo: 'ventaglio', centro: c, angoli: ang,
                 titolo: (A[c].el || '?') + '  ·  ' + ang.length + ' ' +
                         t('angoli', 'angles'),
                 sotto: geometria(v.length, med) +
                        '  ·  ' + t('media', 'mean') + ' ' + med.toFixed(1) + '°' +
                        (ideale(v.length) ? '  ·  ' + t('ideale','ideal') + ' ' +
                          ideale(v.length) + '°' : '') };
      }
      return null;
    }

    /* ── §2.5 · Il disegno ──────────────────────────────────────────────── */
    /* Due grandezze, non una. L'AVANZAMENTO è monotòno e dice quanto un atomo
       è avanti nel suo viaggio: regola la dimensione, l'istante d'arrivo e la
       chiusura dei legami. Il FATTORE elastico, che per un tratto supera 1, è
       solo l'interpolazione della posizione: è lui a fare il rimbalzo.

       La prima stesura usava il fattore elastico anche come avanzamento e lo
       tagliava a 1 al primo superamento: così il rimbalzo spariva, e — peggio —
       un atomo partito prima poteva risultare «meno arrivato» di uno partito
       dopo, perché la curva elastica oscilla. Il banco l'ha preso chiedendo che
       a metà strada lo scheletro fosse davanti agli idrogeni. */
    function posizione(i) {
      var a = mol.atoms[i];
      var q = Math.max(0, Math.min(1, (nascita - ritardo[i]) / 0.5));
      if (q >= 1) return { x: a.x, y: a.y, z: a.z || 0, q: 1 };
      var e = elastica(q);
      var s = partenze[i];
      return { x: s.x + (a.x - s.x) * e, y: s.y + (a.y - s.y) * e,
               z: s.z + ((a.z || 0) - s.z) * e, q: q };
    }

    function frame() {
      if (!canvas.isConnected) {
        cancelAnimationFrame(raf); raf = null; if (barra) barra.remove(); return;
      }
      var adesso = ora();
      nascita = Math.min(1, (adesso - t0) / DURATA);
      if (!drag && nascita >= 1 && !scelti.length) rotY += 0.005;

      etichetteFrame = []; codaEtichette = [];
      ctx.clearRect(0, 0, W, H);
      var bg = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, Math.max(W, H) * 0.8);
      bg.addColorStop(0, '#0d1b2e'); bg.addColorStop(1, '#060d1a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      var pts = mol.atoms.map(function (a, i) {
        var q = posizione(i);
        if (q.q >= 1 && !arrivato[i]) arrivato[i] = adesso;
        return { p: proj(q.x, q.y, q.z), a: a, i: i, q: q.q };
      });
      proiettati = pts.map(function (x) { return x.p; });

      /* polvere: spirala dentro l'atomo a cui è assegnata, e viene assorbita */
      if (nascita < 1) {
        polvere.forEach(function (d, k) {
          var qd = Math.max(0, Math.min(1, (nascita - d.ritardo) / 0.55));
          if (d.bersaglio >= 0) {
            if (qd >= 1) return;                       /* assorbito */
            var a = mol.atoms[d.bersaglio];
            var e = facile(qd);
            /* spirale: l'interpolazione lineare più una rotazione che si spegne */
            var ang = d.giro * (1 - e) * 2.2;
            var vx = d.x - a.x, vy = d.y - a.y, vz = d.z - (a.z || 0);
            var rx = vx * Math.cos(ang) - vz * Math.sin(ang);
            var rz = vx * Math.sin(ang) + vz * Math.cos(ang);
            var px2 = a.x + rx * (1 - e), py2 = a.y + vy * (1 - e), pz2 = (a.z || 0) + rz * (1 - e);
            var pp = proj(px2, py2, pz2);
            var rr = (0.9 + d.f * 1.5) * (1 - e * 0.5);
            ctx.beginPath(); ctx.arc(pp.sx, pp.sy, rr, 0, 2*Math.PI);
            ctx.fillStyle = 'rgba(170,215,255,' + (d.f * (1 - e * 0.65)).toFixed(3) + ')';
            ctx.fill();
          } else {
            var op = Math.max(0, 1 - nascita / 0.75) * d.f * 0.45;
            if (op <= 0.01) return;
            var sp = proj(d.x, d.y, d.z);
            ctx.beginPath(); ctx.arc(sp.sx, sp.sy, 0.9 + d.f, 0, 2*Math.PI);
            ctx.fillStyle = 'rgba(150,200,255,' + op.toFixed(3) + ')';
            ctx.fill();
          }
        });
      }

      var sel = misura();
      var evidenti = {};
      if (sel) {
        if (sel.tipo === 'ventaglio') {
          evidenti[sel.centro] = 1;
          (vicini[sel.centro] || []).forEach(function (j) { evidenti[j] = 1; });
        } else scelti.forEach(function (i) { evidenti[i] = 1; });
      } else if (carosello && angoli.length && nascita >= 1) {
        if (adesso - tAngolo > 2400) { tAngolo = adesso; indiceAngolo = (indiceAngolo+1) % angoli.length; }
        var ev = angoli[indiceAngolo];
        evidenti[ev.a] = 1; evidenti[ev.c] = 1; evidenti[ev.b] = 1;
      }
      var qualcosaInEvidenza = Object.keys(evidenti).length > 0;

      /* legami: si chiudono quando entrambi gli atomi sono arrivati, con una
         scintilla che li percorre */
      mol.bonds.forEach(function (bd, bi) {
        var p1 = pts[bd.a], p2 = pts[bd.b];
        if (!p1 || !p2) return;
        var pronto = Math.min(p1.q, p2.q);
        if (pronto < 0.98) return;
        if (!legameNato[bi]) legameNato[bi] = adesso;
        var eta = (adesso - legameNato[bi]) / 420;
        var cresci = Math.max(0, Math.min(1, eta));
        var spento = qualcosaInEvidenza && !(evidenti[bd.a] && evidenti[bd.b]);
        var c1 = rgb(colore(p1.a)), c2 = rgb(colore(p2.a));
        var alfa = spento ? 0.13 : 0.85;
        var mx = (p1.p.sx + p2.p.sx)/2, my = (p1.p.sy + p2.p.sy)/2;
        var ax = p1.p.sx + (mx - p1.p.sx) * facile(cresci), ay = p1.p.sy + (my - p1.p.sy) * facile(cresci);
        var bx = p2.p.sx + (mx - p2.p.sx) * facile(cresci), by = p2.p.sy + (my - p2.p.sy) * facile(cresci);
        var grd = ctx.createLinearGradient(p1.p.sx, p1.p.sy, p2.p.sx, p2.p.sy);
        grd.addColorStop(0, 'rgba(' + c1[0] + ',' + c1[1] + ',' + c1[2] + ',' + alfa + ')');
        grd.addColorStop(1, 'rgba(' + c2[0] + ',' + c2[1] + ',' + c2[2] + ',' + alfa + ')');
        ctx.beginPath();
        ctx.moveTo(p1.p.sx, p1.p.sy); ctx.lineTo(ax, ay);
        ctx.moveTo(p2.p.sx, p2.p.sy); ctx.lineTo(bx, by);
        ctx.strokeStyle = grd;
        ctx.lineWidth = bd.t === 2 ? 3 : bd.t === 3 ? 4 : 2;
        ctx.stroke();
        if (bd.t === 2 && cresci > 0.6) {
          var dx = p2.p.sx - p1.p.sx, dy = p2.p.sy - p1.p.sy;
          var len = Math.hypot(dx, dy) || 1;
          var ox = (-dy/len)*3, oy = (dx/len)*3;
          ctx.beginPath();
          ctx.moveTo(p1.p.sx+ox, p1.p.sy+oy); ctx.lineTo(p2.p.sx+ox, p2.p.sy+oy);
          ctx.lineWidth = 1.5; ctx.stroke();
        }
        /* la scintilla percorre il legame appena nato */
        if (eta < 1) {
          var u = facile(eta);
          var sx = p1.p.sx + (p2.p.sx - p1.p.sx) * u, sy = p1.p.sy + (p2.p.sy - p1.p.sy) * u;
          var g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, 7);
          g2.addColorStop(0, 'rgba(190,255,240,' + (1-u).toFixed(3) + ')');
          g2.addColorStop(1, 'rgba(94,234,212,0)');
          ctx.beginPath(); ctx.arc(sx, sy, 7, 0, 2*Math.PI);
          ctx.fillStyle = g2; ctx.fill();
        }
      });

      /* archi: ventaglio, angolo singolo, diedro, o carosello */
      if (sel && sel.tipo === 'ventaglio') {
        sel.angoli.forEach(function (x, k) {
          disegnaArco(pts, x.a, x.c, x.b, x.gradi, 0.34 + k * 0.05, k === 0);
        });
      } else if (sel && sel.tipo === 'angolo') {
        disegnaArco(pts, scelti[0], scelti[1], scelti[2], sel.valore, 0.42, true);
      } else if (sel && sel.tipo === 'lunghezza') {
        disegnaMisura(pts, scelti[0], scelti[1], sel.valore.toFixed(3) + ' Å');
      } else if (sel && sel.tipo === 'diedro') {
        disegnaDiedro(pts, scelti, sel.valore);
      } else if (!sel && carosello && angoli.length && nascita >= 1) {
        var e2 = angoli[indiceAngolo];
        disegnaArco(pts, e2.a, e2.c, e2.b, e2.gradi, 0.42, true);
      }

      /* atomi */
      pts.slice().sort(function (x, y) { return x.p.z - y.p.z; }).forEach(function (pt) {
        var r = Math.max(5, Math.min(14, 10 * (350/Math.max(200, pt.p.depth)))) *
                (0.2 + 0.8 * Math.min(1, pt.q * 1.15));
        var spento = qualcosaInEvidenza && !evidenti[pt.i];
        var scelto = scelti.indexOf(pt.i) >= 0;
        var col = rgb(colore(pt.a));
        var chiaro = spento ? 0.3 : 1;
        var g = ctx.createRadialGradient(pt.p.sx - r*0.3, pt.p.sy - r*0.3, 1, pt.p.sx, pt.p.sy, r);
        g.addColorStop(0, 'rgba(' + Math.min(255,col[0]+80) + ',' + Math.min(255,col[1]+80) +
                          ',' + Math.min(255,col[2]+80) + ',' + chiaro + ')');
        g.addColorStop(1, 'rgba(' + Math.round(col[0]*0.25) + ',' + Math.round(col[1]*0.25) +
                          ',' + Math.round(col[2]*0.25) + ',' + chiaro + ')');
        ctx.beginPath(); ctx.arc(pt.p.sx, pt.p.sy, r, 0, 2*Math.PI);
        ctx.fillStyle = g; ctx.fill();

        /* l'anello d'urto dell'atomo che si posa */
        if (arrivato[pt.i]) {
          var dt = (adesso - arrivato[pt.i]) / 520;
          if (dt < 1) {
            ctx.beginPath();
            ctx.arc(pt.p.sx, pt.p.sy, r * (1 + dt * 2.4), 0, 2*Math.PI);
            ctx.strokeStyle = 'rgba(160,230,255,' + ((1-dt)*0.55).toFixed(3) + ')';
            ctx.lineWidth = 1.6; ctx.stroke();
          }
        }
        /* l'alone di chi sta ancora arrivando */
        if (pt.q < 1) {
          ctx.beginPath();
          ctx.arc(pt.p.sx, pt.p.sy, r * (1.7 + (1-pt.q) * 1.4), 0, 2*Math.PI);
          ctx.fillStyle = 'rgba(120,200,255,' + ((1-pt.q)*0.14).toFixed(3) + ')';
          ctx.fill();
        }
        /* l'anello di chi è stato scelto, con il numero d'ordine */
        if (scelto) {
          ctx.beginPath(); ctx.arc(pt.p.sx, pt.p.sy, r + 5, 0, 2*Math.PI);
          ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 2.2; ctx.stroke();
          ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#06141f';
          ctx.beginPath(); ctx.arc(pt.p.sx + r + 6, pt.p.sy - r - 4, 7, 0, 2*Math.PI);
          ctx.fillStyle = '#5eead4'; ctx.fill();
          ctx.fillStyle = '#06141f';
          ctx.fillText(String(scelti.indexOf(pt.i) + 1), pt.p.sx + r + 6, pt.p.sy - r - 4);
        }
        if (r >= 7 && pt.a.el !== 'H' && !spento) {
          ctx.font = 'bold ' + Math.round(r*0.9) + 'px Arial';
          ctx.fillStyle = 'rgba(255,255,255,.9)';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(pt.a.el, pt.p.sx, pt.p.sy);
        }
      });

      scriviEtichette();
      scriviLegenda(sel);
      raf = requestAnimationFrame(frame);
    }

    function disegnaArco(pts, ia, ic, ib, gradi, frazione, conEtichetta) {
      var A = pts[ia].p, B = pts[ic].p, C = pts[ib].p;
      var v1 = [A.sx-B.sx, A.sy-B.sy], v2 = [C.sx-B.sx, C.sy-B.sy];
      var n1 = Math.hypot(v1[0], v1[1]) || 1, n2 = Math.hypot(v2[0], v2[1]) || 1;
      var raggio = Math.min(n1, n2) * frazione;
      var a1 = Math.atan2(v1[1], v1[0]), a2 = Math.atan2(v2[1], v2[0]);
      var d = a2 - a1;
      while (d > Math.PI) d -= 2*Math.PI;
      while (d < -Math.PI) d += 2*Math.PI;
      ctx.beginPath(); ctx.arc(B.sx, B.sy, raggio, a1, a1 + d, d < 0);
      ctx.strokeStyle = conEtichetta ? 'rgba(94,234,212,.95)' : 'rgba(94,234,212,.5)';
      ctx.lineWidth = conEtichetta ? 2.5 : 1.6; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(B.sx, B.sy); ctx.lineTo(B.sx + v1[0]/n1*raggio*1.22, B.sy + v1[1]/n1*raggio*1.22);
      ctx.moveTo(B.sx, B.sy); ctx.lineTo(B.sx + v2[0]/n2*raggio*1.22, B.sy + v2[1]/n2*raggio*1.22);
      ctx.strokeStyle = 'rgba(94,234,212,.35)'; ctx.lineWidth = 1; ctx.stroke();
      var am = a1 + d/2;
      etichetta(B.sx + Math.cos(am)*(raggio+20), B.sy + Math.sin(am)*(raggio+20),
                gradi.toFixed(1) + '°', conEtichetta, Math.cos(am), Math.sin(am));
    }

    function disegnaMisura(pts, ia, ib, testo) {
      var A = pts[ia].p, B = pts[ib].p;
      ctx.save(); ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy);
      ctx.strokeStyle = 'rgba(94,234,212,.9)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      etichetta((A.sx+B.sx)/2, (A.sy+B.sy)/2 - 16, testo, true);
    }

    function disegnaDiedro(pts, s, gradi) {
      /* i due piani si suggeriscono con due triangoli trasparenti */
      function tri(i, j, k, col) {
        ctx.beginPath();
        ctx.moveTo(pts[i].p.sx, pts[i].p.sy);
        ctx.lineTo(pts[j].p.sx, pts[j].p.sy);
        ctx.lineTo(pts[k].p.sx, pts[k].p.sy);
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
      tri(s[0], s[1], s[2], 'rgba(94,234,212,.16)');
      tri(s[1], s[2], s[3], 'rgba(255,180,120,.16)');
      ctx.beginPath();
      ctx.moveTo(pts[s[1]].p.sx, pts[s[1]].p.sy);
      ctx.lineTo(pts[s[2]].p.sx, pts[s[2]].p.sy);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      var mx = (pts[s[1]].p.sx + pts[s[2]].p.sx)/2, my = (pts[s[1]].p.sy + pts[s[2]].p.sy)/2;
      etichetta(mx, my - 22, gradi.toFixed(1) + '°', true);
    }

    /* Le etichette non si devono pestare: su un carbonio tetraedrico i sei
       angoli hanno i vertici vicinissimi, e la prima stesura stampava
       «111.0° 107.0» uno sopra l'altro — numeri illeggibili che sembrano un
       errore di calcolo e invece sono un errore di impaginazione. Ogni
       etichetta tiene memoria del rettangolo che occupa; se il posto è preso
       si sposta lungo la propria direzione, e se dopo quattro tentativi non
       c'è spazio si rinuncia a scriverla: meglio un arco muto che due numeri
       illeggibili. L'etichetta «forte» — quella della misura scelta — ha la
       precedenza e non si rinuncia mai a lei. */
    var etichetteFrame = [], codaEtichette = [];
    function libero(x, y, w, h) {
      for (var i = 0; i < etichetteFrame.length; i++) {
        var r = etichetteFrame[i];
        if (Math.abs(x - r.x) * 2 < (w + r.w) && Math.abs(y - r.y) * 2 < (h + r.h)) return false;
      }
      return true;
    }
    /* Si mettono in coda e si stampano alla fine: gli atomi si disegnano dopo
       gli archi, e un'etichetta scritta prima finisce sotto una sfera. */
    function etichetta(x, y, testo, forte, dirX, dirY) {
      codaEtichette.push({ x: x, y: y, testo: testo, forte: forte,
                           dirX: dirX, dirY: dirY });
    }
    function scriviEtichette() {
      /* prima le forti: hanno la precedenza sul posto */
      codaEtichette.sort(function (p, q) { return (q.forte ? 1 : 0) - (p.forte ? 1 : 0); });
      codaEtichette.forEach(function (e) { stampaEtichetta(e); });
      codaEtichette = [];
    }
    function stampaEtichetta(e) {
      var x = e.x, y = e.y, testo = e.testo, forte = e.forte, dirX = e.dirX, dirY = e.dirY;
      ctx.font = 'bold ' + (forte ? 13 : 11) + 'px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w = ctx.measureText(testo).width + 12, h = 22;
      if (!forte) {
        var ux = (dirX == null ? 0 : dirX), uy = (dirY == null ? -1 : dirY);
        var tent = 0;
        while (!libero(x, y, w, h) && tent < 4) { x += ux * 16; y += uy * 16; tent++; }
        if (!libero(x, y, w, h)) return false;
      }
      etichetteFrame.push({ x: x, y: y, w: w, h: h });
      ctx.fillStyle = 'rgba(6,20,31,' + (forte ? '.9' : '.8') + ')';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x-w/2, y-11, w, h, 6); ctx.fill(); }
      else ctx.fillRect(x-w/2, y-11, w, h);
      ctx.fillStyle = forte ? '#5eead4' : 'rgba(94,234,212,.8)';
      ctx.fillText(testo, x, y);
      return true;
    }

    function scriviLegenda(sel) {
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (nascita < 1) {
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(150,200,255,.75)';
        ctx.fillText(t('la molecola si sta formando…', 'the molecule is forming…'), 8, H - 10);
        return;
      }
      if (sel) {
        ctx.font = 'bold 12.5px Arial'; ctx.fillStyle = '#5eead4';
        ctx.fillText(sel.titolo, 8, 18);
        ctx.font = '10.5px Arial'; ctx.fillStyle = 'rgba(190,220,240,.85)';
        ctx.fillText(sel.sotto, 8, 34);
      } else if (carosello && angoli.length) {
        var e = angoli[indiceAngolo];
        var A = mol.atoms;
        ctx.font = 'bold 12.5px Arial'; ctx.fillStyle = '#5eead4';
        ctx.fillText((A[e.a].el||'?') + '–' + (A[e.c].el||'?') + '–' + (A[e.b].el||'?') +
                     '  ' + e.gradi.toFixed(1) + '°', 8, 18);
        ctx.font = '10.5px Arial'; ctx.fillStyle = 'rgba(190,220,240,.85)';
        ctx.fillText(geometria(e.legami, e.gradi) + '  ·  ' +
                     (indiceAngolo+1) + '/' + angoli.length, 8, 34);
      } else {
        ctx.font = '10.5px Arial'; ctx.fillStyle = 'rgba(150,190,220,.65)';
        ctx.fillText(t('clicca un atomo per misurare',
                       'click an atom to measure'), 8, 18);
      }
      ctx.font = '9px Arial'; ctx.fillStyle = 'rgba(150,180,255,.4)';
      ctx.textAlign = 'right';
      ctx.fillText(t('trascina per ruotare · rotella per lo zoom',
                     'drag to rotate · scroll to zoom'), W - 6, H - 6);
      ctx.textAlign = 'left';
    }

    /* ── §2.6 · La barra ────────────────────────────────────────────────── */
    var barra = null, etSel = null, btnCar = null;
    function aggiornaBarra() {
      if (!etSel) return;
      var sel = misura();
      if (!scelti.length) {
        etSel.textContent = t('nessun atomo scelto — clicca sulla molecola',
                              'no atom selected — click on the molecule');
        etSel.style.color = '#7a96b0';
      } else {
        etSel.textContent = (sel ? sel.titolo + '  ·  ' + sel.sotto
                                 : scelti.length + ' ' + t('atomi', 'atoms'));
        etSel.style.color = '#7fd8c0';
      }
      if (btnCar) {
        btnCar.style.background = carosello ? '#1aa97a' : '#16293f';
        btnCar.style.color = carosello ? '#06141f' : '#bcd3e8';
        btnCar.setAttribute('aria-pressed', carosello ? 'true' : 'false');
      }
    }

    barra = costruisciBarra(canvas, {
      rinasci: function () {
        t0 = ora(); nascita = 0;
        arrivato = new Array(n).fill(0);
        legameNato = mol.bonds.map(function () { return 0; });
      },
      carosello: function (attivo) {
        carosello = attivo; indiceAngolo = 0; tAngolo = ora();
        if (attivo) scelti = [];
        aggiornaBarra();
      },
      pulisci: function () { scelti = []; carosello = false; aggiornaBarra(); },
      quanti: angoli.length, piatta: molPiatta,
      prendiEtichetta: function (el) { etSel = el; },
      prendiCarosello: function (b) { btnCar = b; }
    });
    aggiornaBarra();

    frame();

    return {
      stop: function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        if (barra) barra.remove();
      },
      /* porte per il banco: selezionare senza simulare il mouse */
      seleziona: function (lista) {
        scelti = (lista || []).slice(0, 4); carosello = false; aggiornaBarra();
        return misura();
      },
      selezione: function () { return scelti.slice(); },
      misura: misura,
      nascita: function () { return nascita; },
      /* l'avanzamento di ogni atomo, perché «prima lo scheletro, poi gli
         idrogeni» sia una proprietà misurabile e non un'intenzione */
      progressi: function () {
        return mol.atoms.map(function (a, i) {
          return { el: a.el, q: posizione(i).q, ritardo: ritardo[i] };
        });
      }
    };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · La barra dei comandi
     ═════════════════════════════════════════════════════════════════════════ */
  function costruisciBarra(canvas, opz) {
    if (!canvas.parentNode) return null;
    var vecchia = canvas.parentNode.querySelector('.bsi3d-barra[data-per="' + (canvas.id||'') + '"]');
    if (vecchia) vecchia.remove();
    var barra = document.createElement('div');
    barra.className = 'bsi3d-barra';
    barra.setAttribute('data-per', canvas.id || '');
    barra.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:8px 0 2px';

    function bottone(testo, etichetta) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = testo;
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
    var b2 = bottone(t('🎞️ Scorri gli angoli', '🎞️ Cycle the angles'),
                     t('Mostra gli angoli a turno, da solo',
                       'Show the angles in turn, by itself'));
    opz.prendiCarosello(b2);

    var b3 = bottone(t('✕ Pulisci', '✕ Clear'),
                     t('Togli la selezione di atomi', 'Clear the atom selection'));
    b3.onclick = function () { attivo = false; opz.pulisci(); };

    if (!opz.quanti || opz.piatta) {
      b2.disabled = true; b2.style.opacity = '.45'; b2.style.cursor = 'default';
      b2.title = opz.piatta
        ? t('la struttura caricata è piana (z = 0): gli angoli reali non si ' +
            'possono misurare su coordinate 2D',
            'the loaded structure is flat (z = 0): real angles cannot be measured ' +
            'on 2D coordinates')
        : t('questa struttura non ha atomi con due legami',
            'this structure has no atom with two bonds');
      if (opz.piatta) {
        var avv = document.createElement('span');
        avv.textContent = t('struttura piana: angoli non misurabili',
                            'flat structure: angles not measurable');
        avv.style.cssText = 'color:#f0d79a;font-size:11px';
        barra.appendChild(avv);
      }
    } else {
      b2.onclick = function () { attivo = !attivo; opz.carosello(attivo); };
      b2.setAttribute('aria-pressed', 'false');
    }

    /* la riga che dice che cosa si sta misurando */
    var et = document.createElement('div');
    et.style.cssText = 'flex:1 1 100%;font-size:11.5px;color:#7a96b0;' +
                       'font-weight:700;padding-top:2px';
    et.setAttribute('aria-live', 'polite');
    barra.appendChild(et);
    opz.prendiEtichetta(et);

    /* la spiegazione del gesto, scritta una volta e non in un suggerimento
       che chi usa il dito non vedrà mai */
    var aiuto = document.createElement('div');
    aiuto.style.cssText = 'flex:1 1 100%;font-size:10.5px;color:#5f7c96;line-height:1.5';
    aiuto.textContent = t('1 atomo → tutti i suoi angoli · 2 → la lunghezza del legame · ' +
                          '3 → l’angolo, con il vertice nel secondo · 4 → il diedro',
                          '1 atom → all its angles · 2 → the bond length · ' +
                          '3 → the angle, vertex at the second · 4 → the dihedral');
    barra.appendChild(aiuto);

    canvas.parentNode.insertBefore(barra, canvas.nextSibling);
    return barra;
  }

  /* ═════════════════════════════════════════════════════════════════════════ */

  globale.render3DOnCanvas = render;
  globale.BSIMol3D = { render: render, angoliDi: angoliDi, geometria: geometria,
                       ideale: ideale, piatta: piatta, angoloFra: angoloFra,
                       lunghezza: lunghezza, diedro: diedro,
                       conformazione: conformazione, versione: '2.0' };

})(typeof window !== 'undefined' ? window : globalThis);
