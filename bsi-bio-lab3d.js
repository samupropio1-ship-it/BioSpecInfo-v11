/* ═══════════════════════════════════════════════════════════════════════
   bsi-bio-lab3d.js — 🧬 Biochimica 3D Lab (v264)
   BioSpecInfo · © Samuele Pio Provenzano

   Il laboratorio di biochimica dell'esame, in quattro schede:

   ⚙️ ATP sintasi — il motore F₀F₁ in 3D (anello c₈ nella membrana interna,
      fusto γ, testa α₃β₃, braccio periferico), con i protoni che entrano
      dal semicanale della subunità a, fanno il giro sull'anello ed escono
      nella matrice; le tre β passano per L → T → O (Boyer) e liberano un
      ATP ogni 120°. Viste: montata, spaccato (un piano di taglio rivolto
      alla camera), esplosa. Il motore è pilotato da un OSSIGRAFO: la
      traccia dell'O₂ nella camera dell'elettrodo di Clark, dentro il
      palco, con ADP, oligomicina, disaccoppiante (DNP/UCP1) e cianuro —
      l'esperimento chiesto all'orale. I contatori (giri, H⁺, ATP) NON
      sono contati a parte: vengono dall'angolo del rotore (8 H⁺ e 3 ATP
      per giro), così il rapporto H⁺/ATP = c/3 è vero per costruzione.
   🧪 Enzimi — sei enzimi che si chiudono sul substrato (adattamento
      indotto), substrato, prodotto e inibitore come particelle; la
      frazione di enzimi occupati segue l'equilibrio rapido, quindi la
      velocità misurata contando i prodotti torna con Michaelis–Menten.
      Grafico nel palco: iperbole, Lineweaver–Burk o profilo ΔG‡.
   🗺️ Vie e carboni — otto vie passo per passo: le molecole a catena
      aperta si trasformano, ogni carbonio tiene il suo colore dall'inizio
      alla fine (i carboni del glucosio fino al piruvato, l'acetile e
      l'ossalacetato nel Krebs), la CO₂ esce davvero da un carbonio,
      ATP/NADH/FADH₂ entrano ed escono come gettoni; sotto, l'ispettore
      del passo (enzima, classe EC, cofattori, ΔG°′, regolazione).
   🎓 Teoria d'esame — i 12 capitoli della dispensa dell'autore: sintesi,
      perché, errori da non dire, domande del professore, la risposta da
      dare all'orale (Spectra la legge), i conti degli ATP e un quiz sugli
      enzimi regolati.

   Usa il motore 3D dell'app (three r128 locale, BSILab3D): niente moduli
   ES né CDN. I dati e i modelli sono in bsi-bio-lab3d-dati.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;
  var t = F.t, PI = Math.PI;
  function B() { return g.BSIBioDati; }
  var MENO_MOTO = false; try { MENO_MOTO = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  function cl(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ss(u) { u = cl(u, 0, 1); return u * u * (3 - 2 * u); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function lerp3(a, b, u) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
  function fmt(x, n) { return (+x).toFixed(n == null ? 2 : n).replace('.', t(',', '.')); }

  /* ═══ stile ════════════════════════════════════════════════════════════ */
  function stile() {
    if (D.getElementById('bsiBL-stile')) return; var s = D.createElement('style'); s.id = 'bsiBL-stile';
    s.textContent = '.bsiBL-palco{position:relative;margin:0 auto;border-radius:12px;overflow:hidden;background:#03060d}.bsiBL-palco .bsi3d-box{margin:0;border-radius:12px;background:#03060d}' +
      '.bsiBL-tit{position:absolute;left:10px;right:52px;top:10px;pointer-events:none;color:#fff;font:800 clamp(14px,4vw,19px)/1.2 system-ui,sans-serif;text-shadow:0 1px 4px #000}.bsiBL-tit small{display:block;margin-top:3px;font:600 11.5px ui-monospace,Menlo,monospace;color:#9fe7ff}' +
      '.bsiBL-vivo{position:absolute;left:8px;right:8px;bottom:8px;pointer-events:none}' +
      '.bsiBL-com{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}.bsiBL-com button,.bsiBL-btn{min-height:40px;min-width:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;font:600 .84rem system-ui,sans-serif;padding:4px 11px;cursor:pointer}' +
      '.bsiBL-com button[aria-pressed="true"],.bsiBL-btn[aria-pressed="true"]{border-color:#00c9b7;color:#00e0cc;background:#062a2a}.bsiBL-com label{display:flex;align-items:center;gap:6px;font:500 .82rem system-ui,sans-serif;color:#cfe3f7}.bsiBL-com select{min-height:36px;max-width:100%}' +
      '.bsiBL-cont{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:6px;margin:8px 0}.bsiBL-cont div{background:#0a1628;border:1px solid #1a3050;border-radius:10px;padding:6px 8px;color:#9fb3c8;font:500 .72rem system-ui,sans-serif}.bsiBL-cont b{display:block;color:#fff;font:800 1.15rem ui-monospace,Menlo,monospace}' +
      '.bsiBL-box{margin:8px 0;padding:10px 12px;border-radius:10px;background:#0a1628;border:1px solid #1a3050;color:#dfe8f2;font:500 .9rem/1.5 system-ui,sans-serif}.bsiBL-box b{color:#5fe3d6}.bsiBL-box h4{margin:0 0 6px;color:#fff;font:800 1rem system-ui,sans-serif}' +
      '.bsiBL-chip{display:inline-block;margin:2px 4px 2px 0;padding:2px 9px;border-radius:12px;border:1px solid #2a4a6e;background:#0b2036;color:#cfe3f7;font:600 .76rem system-ui,sans-serif}.bsiBL-chip.r{border-color:#ff6b6b;color:#ff9a9a}.bsiBL-chip.v{border-color:#40c057;color:#8ce99a}.bsiBL-chip.o{border-color:#f5c451;color:#ffe08a}' +
      '.bsiBL-tempo{width:100%;accent-color:#5fe3d6}.bsiBL-scelte{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.bsiBL-scelte button{min-height:36px;border-radius:18px;border:1px solid #2a4a6e;background:#0a1b2e;color:#cfe3f7;font:600 .8rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}.bsiBL-scelte button[aria-pressed="true"]{border-color:#5fe3d6;color:#5fe3d6}' +
      '.bsiBL-leg{display:flex;flex-wrap:wrap;gap:8px;font:500 .76rem system-ui,sans-serif;color:#9fb3c8;margin:4px 0}.bsiBL-leg i{display:inline-block;width:12px;height:12px;border-radius:50%;vertical-align:middle;margin-right:4px}' +
      '.bsiBL-perche{border-color:#7c5cff;background:#1a1438}.bsiBL-perche b{color:#c9b8ff}.bsiBL-no{border-color:#ff6b6b;background:#2a1018}.bsiBL-no b{color:#ff9a9a}.bsiBL-orale{border-color:#20c997;background:#0b2a24}.bsiBL-orale b{color:#63e6be}' +
      '.bsiBL-dom{margin:6px 0;border:1px solid #1a3050;border-radius:9px;overflow:hidden}.bsiBL-dom button{width:100%;text-align:left;min-height:42px;padding:8px 10px;background:#0b2036;border:0;color:#e6f2ff;font:600 .88rem system-ui,sans-serif;cursor:pointer}.bsiBL-dom div{padding:8px 10px;color:#cfe3f7;font:500 .88rem/1.5 system-ui,sans-serif}' +
      '.bsiBL-quiz button.ok{border-color:#40c057;color:#8ce99a}.bsiBL-quiz button.ko{border-color:#ff6b6b;color:#ff9a9a}.bsiBL-palco:fullscreen{width:100vw;height:100vh}';
    D.head.appendChild(s);
  }

  /* ═══ testi nel 3D ═════════════════════════════════════════════════════ */
  function creaTesti(T) {
    var cache = {};
    function tex(s, col, px, fondo) {
      var k = s + '|' + col + '|' + (fondo || ''); if (cache[k]) return cache[k];
      var c = D.createElement('canvas'), q = c.getContext('2d'); px = px || 44; q.font = '700 ' + px + 'px system-ui,sans-serif';
      var w = Math.ceil(q.measureText(s).width) + (fondo ? 34 : 14); c.width = w; c.height = px + (fondo ? 22 : 14);
      q.font = '700 ' + px + 'px system-ui,sans-serif'; q.textBaseline = 'middle';
      if (fondo) { q.fillStyle = fondo; q.strokeStyle = col; q.lineWidth = 4; var r = c.height / 2 - 3; q.beginPath(); q.moveTo(r + 3, 3); q.lineTo(w - r - 3, 3); q.arc(w - r - 3, c.height / 2, r, -PI / 2, PI / 2); q.lineTo(r + 3, c.height - 3); q.arc(r + 3, c.height / 2, r, PI / 2, 3 * PI / 2); q.closePath(); q.fill(); q.stroke(); q.fillStyle = col; q.fillText(s, 17, c.height / 2 + 1); }
      else { q.lineWidth = 6; q.strokeStyle = 'rgba(3,6,14,.85)'; q.strokeText(s, 7, c.height / 2); q.fillStyle = col || '#fff'; q.fillText(s, 7, c.height / 2); }
      var tx = new T.CanvasTexture(c); tx.minFilter = T.LinearFilter; cache[k] = { tx: tx, r: w / c.height }; return cache[k];
    }
    return {
      sprite: function (s, col, h, fondo) { var o = tex(s, col || '#fff', 44, fondo), sp = new T.Sprite(new T.SpriteMaterial({ map: o.tx, transparent: true, depthTest: false, depthWrite: false })); sp.scale.set(h * o.r, h, 1); sp.renderOrder = 30; sp.userData.r = o.r; sp.userData.h = h; return sp; },
      cambia: function (sp, s, col, fondo) { var o = tex(s, col || '#fff', 44, fondo); sp.material.map = o.tx; sp.material.needsUpdate = true; sp.scale.set(sp.userData.h * o.r, sp.userData.h, 1); },
      distruggi: function () { Object.keys(cache).forEach(function (k) { cache[k].tx.dispose(); }); cache = {}; }
    };
  }
  function cilindro(mesh, p0, p1, r, Y, tmp) {
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], l = Math.sqrt(dx * dx + dy * dy + dz * dz);
    mesh.visible = l > 1e-4; if (!mesh.visible) return;
    mesh.position.set((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2); mesh.scale.set(r, l, r); tmp.set(dx / l, dy / l, dz / l); mesh.quaternion.setFromUnitVectors(Y, tmp);
  }
  function tela(box) {
    var cv = D.createElement('canvas'); cv.className = 'bsiBL-vivo'; cv.setAttribute('role', 'img'); box.appendChild(cv);
    var q = cv.getContext('2d'), o = { cv: cv, q: q, W: 0, H: 0 };
    o.misura = function (ren, frazione, max) { var dpr = Math.min(2, g.devicePixelRatio || 1), w = box.clientWidth - 16, h = Math.round(Math.min(max || 150, ren.domElement.clientHeight * (frazione || 0.27))); if (w === o.W && h === o.H) return; o.W = w; o.H = h; cv.style.height = h + 'px'; cv.width = Math.max(1, w * dpr); cv.height = Math.max(1, h * dpr); q.setTransform(dpr, 0, 0, dpr, 0, 0); };
    o.fondo = function () { q.clearRect(0, 0, o.W, o.H); q.fillStyle = 'rgba(4,8,18,.7)'; q.strokeStyle = 'rgba(120,150,200,.25)'; q.beginPath(); if (q.roundRect) q.roundRect(0.5, 0.5, o.W - 1, o.H - 1, 10); else q.rect(0.5, 0.5, o.W - 1, o.H - 1); q.fill(); q.stroke(); };
    return o;
  }
  /** la scena comune: palco, titolo, luci sceniche */
  function scena(palco, L3, rapporto, titolo, sotto) {
    var largo = (g.innerWidth || 400) > 900, S = new L3.Scena(palco, largo ? rapporto[0] : rapporto[1]);
    palco.insertBefore(S.box, palco.firstChild); S.adatta(); S.ren.setClearColor(0x03060d, 1);
    if (S.cinema) try { S.cinema({ forza: 0.3, soglia: 0.82, vignetta: 0.3, esposizione: 0.95 }); } catch (e) { }
    var tit = F.el('div', { 'class': 'bsiBL-tit' }); tit.innerHTML = titolo + (sotto ? '<small>' + sotto + '</small>' : ''); S.box.appendChild(tit); S.titolo = tit;
    return S;
  }
  /** la distanza della camera perché una sfera di raggio r entri nel campo più stretto (sul telefono è l'orizzontale) */
  function distanza(S, r) { var asp = S.cam.aspect || 0.8, fv = S.cam.fov * PI / 180, fmin = Math.min(fv, 2 * Math.atan(Math.tan(fv / 2) * asp)); return r / Math.sin(fmin / 2); }

  /* ═══════════════════════════════════════════════════════════════════════
     ⚙️ 1 · ATP SINTASI + OSSIGRAFO
     ═══════════════════════════════════════════════════════════════════════ */
  var COL_BETA = { L: '#ffd43b', T: '#ff6b6b', O: '#51cf66' };
  function creaATP(cont, opz) {
    opz = opz || {}; stile();
    if (cont._bl) cont._bl.distruggi(); cont.textContent = '';
    var palco = F.el('div', { 'class': 'bsiBL-palco' }), conti = F.el('div', { 'class': 'bsiBL-cont', 'aria-live': 'polite' }), vista = F.el('div', { 'class': 'bsiBL-com', role: 'toolbar', 'aria-label': t('Vista dell\'ATP sintasi', 'ATP synthase view') });
    var com = F.el('div', { 'class': 'bsiBL-com', role: 'toolbar', 'aria-label': t('Aggiunte nella camera dell\'ossigrafo', 'Additions to the oxygraph chamber') }), regola = F.el('div', { 'class': 'bsiBL-com' }), spiega = F.el('div', { 'class': 'bsiBL-box', 'aria-live': 'polite' });
    var leg = F.el('div', { 'class': 'bsiBL-leg', html: '<span><i style="background:#ffd43b"></i>β in L: lega ADP + Pᵢ</span><span><i style="background:#ff6b6b"></i>β in T: forma ATP</span><span><i style="background:#51cf66"></i>β in O: rilascia ATP</span><span><i style="background:#ff4d8d"></i>H⁺</span><span><i style="background:#3fd0c0"></i>' + t('anello c (rotore)', 'c ring (rotor)') + '</span><span><i style="background:#ff9f43"></i>' + t('subunità a e braccio (statore)', 'a subunit and stalk (stator)') + '</span>' });
    [palco, conti, vista, com, regola, spiega, leg].forEach(function (e) { cont.appendChild(e); });
    cont.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Onestà', 'Honesty') + '</b> · ' + t('Struttura SCHEMATICA in scala approssimata (anello c₈ dei mammiferi, Watt 2010; ATP sintasi umana PDB 8H9T). La rotazione è RALLENTATA (quella vera arriva a ~100 giri/s) e continua (quella vera procede a scatti di 120°, divisi in 80° + 40°). L\'ossigrafo è un MODELLO qualitativo: i numeri sono INDICATIVI, il comportamento (stati 2, 3, 4, oligomicina, disaccoppiante, cianuro) è quello degli esperimenti. I contatori vengono dall\'angolo del rotore: 8 H⁺ e 3 ATP per giro.', 'SCHEMATIC structure at approximate scale (mammalian c₈ ring, Watt 2010; human ATP synthase PDB 8H9T). Rotation is SLOWED DOWN (the real one reaches ~100 turns/s) and continuous (the real one moves in 120° steps, split 80° + 40°). The oxygraph is a qualitative MODEL: numbers are INDICATIVE, the behaviour (states 2, 3, 4, oligomycin, uncoupler, cyanide) matches experiments. Counters come from the rotor angle: 8 H⁺ and 3 ATP per turn.') }));
    var api = { pronto: false }, vivo = true, S = null, testi = null; api.distruggi = function () { vivo = false; if (S) { S.pulisci(); } if (testi) testi.distruggi(); }; cont._bl = api;
    var L3 = g.BSILab3D; if (!L3 || !B()) { palco.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return api; }
    L3.stile();
    var s = B().nuovaCamera(); s.c = opz.c || 8; api.camera = s;
    if (opz.ADP !== false) B().aggiungi(s, 'ADP');
    L3.caricaThree().then(function () {
      if (!vivo) return; var T = g.THREE; testi = creaTesti(T);
      S = scena(palco, L3, [0.62, 1.22], t('ATP sintasi (F₀F₁) — il motore rotante', 'ATP synthase (F₀F₁) — the rotary motor'), t('mitocondrio umano · membrana interna · H⁺ dallo spazio intermembrana alla matrice', 'human mitochondrion · inner membrane · H⁺ from intermembrane space to matrix'));
      S.ren.localClippingEnabled = true;
      var taglio = new T.Plane(new T.Vector3(0, -1, 0), 0.02), piani = [taglio], tagliato = false, tagliabili = [], Y = new T.Vector3(0, 1, 0), tmp = new T.Vector3();
      function mat(col, o) { o = o || {}; var m = new T.MeshStandardMaterial({ color: col, roughness: o.r != null ? o.r : 0.45, metalness: 0.05, emissive: o.em || col, emissiveIntensity: o.ei != null ? o.ei : 0.12, transparent: o.op != null && o.op < 1, opacity: o.op != null ? o.op : 1, depthWrite: o.op == null || o.op >= 1 }); if (o.taglia) tagliabili.push(m); return m; }
      var rig = new T.Group(); S.aggiungi(rig);
      /* membrana interna: due foglietti di teste lipidiche e il nucleo idrofobico */
      var membrana = new T.Group(); rig.add(membrana);
      var teste = [], dummy = new T.Object3D();
      for (var gx = -5; gx <= 5; gx += 0.36) for (var gy = -5; gy <= 5; gy += 0.36) { var x0 = gx + (Math.round(gy / 0.36) % 2 ? 0.18 : 0), rr = Math.hypot(x0, gy), rs = Math.hypot(x0 - 1.35, gy); if (rr > 4.8 || rr < 1.18 || rs < 0.62) continue; teste.push([x0, gy]); }
      var matTeste = mat('#4f7391', { r: 0.7, ei: 0.04, taglia: true }), geoT = new T.SphereGeometry(0.14, 10, 8);
      [0.62, -0.62].forEach(function (z) { var im = new T.InstancedMesh(geoT, matTeste, teste.length); teste.forEach(function (p, i) { dummy.position.set(p[0], p[1], z); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }); im.instanceMatrix.needsUpdate = true; membrana.add(im); });
      var matNucleo = mat('#f0b46a', { op: 0.16, ei: 0.25, taglia: true }), nucleo = new T.Mesh(new T.CylinderGeometry(4.8, 4.8, 1.05, 64, 1, true), matNucleo); nucleo.rotation.x = PI / 2; membrana.add(nucleo);
      var nucleoTop = new T.Mesh(new T.RingGeometry(1.2, 4.8, 64), mat('#f0b46a', { op: 0.07, ei: 0.2, taglia: true })); nucleoTop.position.z = 0.5; membrana.add(nucleoTop);
      /* rotore: anello c + fusto γ/ε */
      var rotore = new T.Group(); rig.add(rotore); var anello = new T.Group(); rotore.add(anello); var siti = [], primoGiro = true;
      function costruisciAnello(c) {
        while (anello.children.length) { var o = anello.children.pop(); if (o.geometry) o.geometry.dispose(); }
        siti = []; primoGiro = true; var R = c <= 8 ? 0.72 : c <= 10 ? 0.86 : 1.18, rr = Math.min(0.24, R * Math.sin(PI / c) * 0.95);
        for (var j = 0; j < c; j++) {
          var a = j * 2 * PI / c, sub = new T.Mesh(new T.CylinderGeometry(rr, rr, 1.55, 14), mat(j % 2 ? '#2fb8aa' : '#3fd0c0', { r: 0.35, ei: 0.18 })); sub.rotation.x = PI / 2; sub.position.set(R * Math.cos(a), R * Math.sin(a), 0); anello.add(sub);
          var glu = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), mat('#ff922b', { ei: 0.4 })); glu.position.set((R + rr) * Math.cos(a), (R + rr) * Math.sin(a), 0); anello.add(glu);
          var hp = new T.Mesh(new T.SphereGeometry(0.11, 12, 10), new T.MeshBasicMaterial({ color: '#ff4d8d' })); hp.position.copy(glu.position); hp.position.multiplyScalar(1.09); hp.visible = false; anello.add(hp);
          siti.push({ a: a, hp: hp, carico: false });
        }
        api.R = R;
      }
      costruisciAnello(s.c);
      var gamma = new T.Group(); rotore.add(gamma);
      [0, PI].forEach(function (f0) { var pts = []; for (var k = 0; k <= 60; k++) { var z = 0.72 + k / 60 * 2.95, a = f0 + k / 60 * PI * 2.2; pts.push(new T.Vector3(0.13 * Math.cos(a), 0.13 * Math.sin(a), z)); } gamma.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 80, 0.11, 10, false), mat('#c77dff', { r: 0.3, ei: 0.25 }))); });
      var piede = new T.Mesh(new T.SphereGeometry(0.42, 18, 14), mat('#b366ff', { ei: 0.2 })); piede.scale.set(1.25, 0.8, 0.5); piede.position.set(0.18, 0, 0.98); gamma.add(piede);
      var eps = new T.Mesh(new T.SphereGeometry(0.22, 14, 12), mat('#e599f7', { ei: 0.2 })); eps.position.set(-0.32, 0.12, 0.92); gamma.add(eps);
      var camma = new T.Mesh(new T.SphereGeometry(0.2, 14, 12), mat('#c77dff', { ei: 0.3 })); camma.scale.set(1.6, 0.9, 1.2); camma.position.set(0.28, 0, 2.75); gamma.add(camma);
      /* statore: subunità a, semicanali, braccio periferico, OSCP */
      var statore = new T.Group(); rig.add(statore);
      var subA = new T.Mesh(new T.SphereGeometry(1, 22, 16), mat('#ff9f43', { r: 0.5, ei: 0.16, taglia: true })); subA.scale.set(0.38, 0.62, 0.8); subA.position.set(1.36, 0, 0); statore.add(subA);
      function pol(r, deg, z) { return [r * Math.cos(deg * PI / 180), r * Math.sin(deg * PI / 180), z]; }
      var CAN_IN = [pol(1.55, 30, -1.25), pol(1.3, 22, -0.55), pol(api.R + 0.3, 14, -0.05)], CAN_OUT = [pol(api.R + 0.3, -14, 0.05), pol(1.3, -22, 0.55), pol(1.55, -30, 1.3)];
      [CAN_IN, CAN_OUT].forEach(function (P) { statore.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(P.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })), 24, 0.09, 8, false), new T.MeshBasicMaterial({ color: '#ff8fb8', transparent: true, opacity: 0.35, depthWrite: false }))); });
      var braccio = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(1.5, 0, 0.55), new T.Vector3(1.85, 0, 1.8), new T.Vector3(1.9, 0, 3.4), new T.Vector3(1.55, 0, 4.4), new T.Vector3(0.75, 0, 4.75)]), 40, 0.13, 10, false), mat('#ff9f43', { r: 0.5, ei: 0.15 })); statore.add(braccio);
      var oscp = new T.Mesh(new T.SphereGeometry(0.36, 18, 14), mat('#ffa94d', { ei: 0.18 })); oscp.position.set(0.35, 0, 4.72); statore.add(oscp);
      /* testa F₁: α₃β₃ con i siti catalitici delle β */
      var testa = new T.Group(); rig.add(testa); var betas = [];
      for (var k = 0; k < 6; k++) {
        var a = k * PI / 3, isB = k % 2 === 1, m = new T.Mesh(new T.SphereGeometry(1, 24, 18), mat(isB ? COL_BETA.L : '#e8607a', { r: 0.42, ei: isB ? 0.22 : 0.12, taglia: true }));
        m.scale.set(0.56, 0.56, 1.0); m.position.set(0.98 * Math.cos(a), 0.98 * Math.sin(a), 3.15); m.rotation.z = a; testa.add(m);
        if (isB) {
          var adp = new T.Mesh(new T.SphereGeometry(0.13, 12, 10), new T.MeshBasicMaterial({ color: '#74c0fc' })), pi = new T.Mesh(new T.SphereGeometry(0.09, 10, 8), new T.MeshBasicMaterial({ color: '#ff922b' })), atp = new T.Mesh(new T.SphereGeometry(0.17, 14, 12), new T.MeshBasicMaterial({ color: '#ffe066' }));
          [adp, pi, atp].forEach(function (o) { o.position.set(0.5 * Math.cos(a), 0.5 * Math.sin(a), 3.0); testa.add(o); }); pi.position.z = 3.22; adp.position.z = 2.95;
          var et = testi.sprite('L', '#ffd43b', 0.42); et.position.set(1.2 * Math.cos(a), 1.2 * Math.sin(a), 4.35); testa.add(et);
          betas.push({ i: (k - 1) / 2, m: m, adp: adp, pi: pi, atp: atp, et: et, st: '' });
        }
      }
      var tappo = new T.Mesh(new T.SphereGeometry(0.42, 16, 12), mat('#e8607a', { ei: 0.1 })); tappo.position.set(0, 0, 4.25); tappo.scale.set(1, 1, 0.5); testa.add(tappo);
      /* etichette */
      var etich = new T.Group(); rig.add(etich);
      [[t('F₁ α₃β₃', 'F₁ α₃β₃'), '#ffe3e8', [-1.9, -0.8, 4.4]], [t('fusto γ', 'γ stalk'), '#e5b8ff', [-1.1, 0.6, 1.9]], [t('anello c', 'c ring'), '#9ff5ea', [-1.5, -0.8, -0.9]], [t('subunità a', 'a subunit'), '#ffd8a8', [1.9, -0.6, -1.1]], [t('braccio b', 'stalk b'), '#ffd8a8', [2.4, 0.3, 2.6]],
        [t('MATRICE', 'MATRIX'), '#c5f6fa', [-2.6, 2.4, 2.4]], [t('INTERMEMBRANA', 'INTERMEMBRANE'), '#ffc9de', [-2.4, 2.6, -2.4]], [t('membrana', 'membrane'), '#f6d6a8', [-3.4, 1.5, 0.95]]].forEach(function (e) { var sp = testi.sprite(e[0], e[1], 0.34); sp.position.set(e[2][0], e[2][1], e[2][2]); etich.add(sp); });
      /* protoni: nuvola nello spazio intermembrana (∝ Δp), quelli in transito, quelli della perdita */
      var geoH = new T.SphereGeometry(0.1, 10, 8), matH = new T.MeshBasicMaterial({ color: '#ff4d8d' }), matHl = new T.MeshBasicMaterial({ color: '#ff9fc4', transparent: true, opacity: 0.9 });
      var nuvola = []; for (var h = 0; h < 44; h++) { var mh = new T.Mesh(geoH, matH); var rr0 = 1.8 + Math.random() * 2.8, aa = Math.random() * 2 * PI; mh.userData = { x: rr0 * Math.cos(aa), y: rr0 * Math.sin(aa), z: -1.2 - Math.random() * 1.8, f: Math.random() * 10 }; mh.visible = false; rig.add(mh); nuvola.push(mh); }
      var inMatrice = []; for (var h2 = 0; h2 < 10; h2++) { var mm = new T.Mesh(geoH, matH); var r2 = 2 + Math.random() * 2.6, a2 = Math.random() * 2 * PI; mm.position.set(r2 * Math.cos(a2), r2 * Math.sin(a2), 1.3 + Math.random() * 1.6); rig.add(mm); inMatrice.push(mm); }
      var volanti = [];   /* {mesh, percorso [p0,p1,…], t, durata, poi} */
      function vola(percorso, durata, mesh, poi) { mesh = mesh || new T.Mesh(geoH, matHl.clone()); rig.add(mesh); volanti.push({ mesh: mesh, P: percorso, t: 0, d: durata, poi: poi }); return mesh; }
      function puntoSu(P, u) { var n = P.length - 1, x = cl(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)); return lerp3(P[i], P[i + 1], ss(x - i)); }
      var segnoOligo = testi.sprite('⛔ ' + t('oligomicina', 'oligomycin'), '#ff8787', 0.36); segnoOligo.position.set(1.15, -0.9, 0.2); segnoOligo.visible = false; rig.add(segnoOligo);
      var segnoDNP = testi.sprite('DNP / UCP1 ↑', '#ffc078', 0.36); segnoDNP.position.set(-3.6, -2.2, 0.0); segnoDNP.visible = false; rig.add(segnoDNP);
      var segnoCN = testi.sprite('CN⁻: ' + t('catena ferma, nessun H⁺ pompato', 'chain stopped, no H⁺ pumped'), '#adb5bd', 0.32); segnoCN.position.set(-1, 3.4, -2.6); segnoCN.visible = false; rig.add(segnoCN);
      /* inquadratura */
      S.inquadra(distanza(S, 5.4), 1.15, 1.2); S.vista.bersaglio.set(0, 0, 0.5);
      var vel = 4, vistaV = { taglio: 0, esplosa: 0 }, obiettivo = { taglio: 0, esplosa: 0 }, etichetteOn = true, ultimoATP = 0, ultimoUI = -1, accTraccia = 0, accPerdita = 0;
      /* comandi della vista */
      function tasto(barra, tx, f, aria) { var b = F.el('button', { type: 'button', testo: tx, 'aria-label': aria || tx, onclick: function () { f(b); S.avvia(); } }); barra.appendChild(b); return b; }
      var vb = {};
      function segnaVista(k) { Object.keys(vb).forEach(function (j) { vb[j].setAttribute('aria-pressed', String(j === k)); }); }
      vb.montata = tasto(vista, t('🧩 Montata', '🧩 Assembled'), function () { obiettivo.taglio = 0; obiettivo.esplosa = 0; segnaVista('montata'); });
      vb.taglio = tasto(vista, t('🔪 Spaccato', '🔪 Cutaway'), function () { obiettivo.taglio = 1; obiettivo.esplosa = 0; segnaVista('taglio'); });
      vb.esplosa = tasto(vista, t('💥 Esplosa', '💥 Exploded'), function () { obiettivo.taglio = 0; obiettivo.esplosa = 1; segnaVista('esplosa'); });
      segnaVista('montata');
      var bEt = tasto(vista, t('🏷 Etichette', '🏷 Labels'), function (b) { etichetteOn = !etichetteOn; b.setAttribute('aria-pressed', String(etichetteOn)); }); bEt.setAttribute('aria-pressed', 'true');
      var selC = F.el('select', { 'aria-label': t('Subunità nell\'anello c', 'Subunits in the c ring') });
      [[8, t('c₈ — uomo, bovino', 'c₈ — human, bovine')], [10, t('c₁₀ — lievito, E. coli', 'c₁₀ — yeast, E. coli')], [15, t('c₁₅ — cianobatteri', 'c₁₅ — cyanobacteria')]].forEach(function (o) { var op = F.el('option', { value: String(o[0]), testo: o[1] }); if (o[0] === s.c) op.selected = true; selC.appendChild(op); });
      selC.addEventListener('change', function () { s.c = +selC.value; costruisciAnello(s.c); S.avvia(); });
      vista.appendChild(F.el('label', {}, [F.el('span', { testo: t('Anello', 'Ring') }), selC]));
      /* aggiunte nella camera */
      var AGG = [['ADP', t('＋ ADP', '＋ ADP')], ['oligomicina', t('＋ oligomicina', '＋ oligomycin')], ['dnp', t('＋ DNP (disaccoppiante)', '＋ DNP (uncoupler)')], ['cianuro', t('＋ cianuro', '＋ cyanide')]];
      AGG.forEach(function (a) { tasto(com, a[1], function () { B().aggiungi(s, a[0]); }, a[1]); });
      tasto(com, t('↺ Nuova camera', '↺ New chamber'), function () { nuova(false); });
      var guida = null;
      tasto(com, t('▶ Esperimento guidato', '▶ Guided experiment'), function () { nuova(false); guida = [[8, 'ADP'], [55, 'oligomicina'], [95, 'dnp'], [140, 'cianuro']]; });
      function nuova(conADP) { var c = s.c; s = B().nuovaCamera(); s.c = c; api.camera = s; if (conADP) B().aggiungi(s, 'ADP'); ultimoATP = 0; guida = null; primoGiro = true; }
      var sub = F.el('input', { type: 'range', min: '0', max: '2', step: '0.05', value: '1', 'class': 'bsiBL-tempo', 'aria-label': t('Apporto di elettroni (substrato)', 'Electron supply (substrate)') }), subV = F.el('span', { testo: '100%' });
      sub.addEventListener('input', function () { s.substrato = +sub.value; subV.textContent = Math.round(+sub.value * 100) + '%'; });
      regola.appendChild(F.el('label', { style: 'flex:1;min-width:220px' }, [F.el('span', { testo: t('Forza protonmotrice: apporto di substrato', 'Proton-motive force: substrate supply') }), sub, subV]));
      var selV = F.el('select', { 'aria-label': t('Velocità', 'Speed') }); [[1, '1×'], [4, '4×'], [10, '10×']].forEach(function (v) { var o = F.el('option', { value: String(v[0]), testo: v[1] }); if (v[0] === 4) o.selected = true; selV.appendChild(o); }); selV.addEventListener('change', function () { vel = +selV.value; });
      var bP = tasto(regola, '⏸', function () { pausa = !pausa; bP.textContent = pausa ? '▶' : '⏸'; }, t('Pausa', 'Pause')), pausa = MENO_MOTO;
      bP.textContent = pausa ? '▶' : '⏸';
      regola.appendChild(F.el('label', {}, [F.el('span', { testo: t('Tempo', 'Time') }), selV]));
      /* l'ossigrafo nel palco */
      var TV = tela(S.box);
      function ossigrafo() {
        TV.misura(S.ren, 0.26, 140); var q = TV.q, W = TV.W, H = TV.H; TV.fondo();
        var x0 = 30, x1 = W - 98, y0 = 16, y1 = H - 14, T0 = Math.max(0, s.t - 200), X = function (tt) { return x0 + (tt - T0) / 200 * (x1 - x0); }, Yo = function (o) { return y1 - o / 240 * (y1 - y0); };
        q.font = '600 9px system-ui,sans-serif'; q.fillStyle = '#c5f6fa'; q.fillText(t('Ossigrafo: [O₂] nella camera (nmol/ml)', 'Oxygraph: [O₂] in the chamber (nmol/ml)'), 6, 11);
        q.strokeStyle = 'rgba(140,160,190,.3)'; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0, y1); q.lineTo(x1, y1); q.stroke();
        q.fillStyle = 'rgba(200,214,232,.7)'; q.font = '500 8px ui-monospace,Menlo,monospace'; [0, 100, 200].forEach(function (v) { q.fillText(String(v), 6, Yo(v) + 3); });
        s.eventi.forEach(function (e) { if (e[0] < T0) return; var px = X(e[0]); q.strokeStyle = 'rgba(255,212,59,.5)'; q.setLineDash([3, 3]); q.beginPath(); q.moveTo(px, y0); q.lineTo(px, y1); q.stroke(); q.setLineDash([]); q.fillStyle = '#ffe066'; q.save(); q.translate(px + 3, y0 + 2); q.font = '700 8.5px system-ui,sans-serif'; q.fillText({ ADP: '+ADP', oligomicina: '+oligo', dnp: '+DNP', cianuro: '+CN⁻' }[e[1]] || e[1], 0, 6); q.restore(); });
        q.strokeStyle = '#4dd4ff'; q.lineWidth = 2.2; q.shadowColor = '#4dd4ff'; q.shadowBlur = 6; q.beginPath(); var primo = true; s.traccia.forEach(function (p) { if (p[0] < T0) return; var px = X(p[0]), py = Yo(p[1]); if (primo) { q.moveTo(px, py); primo = false; } else q.lineTo(px, py); }); q.lineTo(X(s.t), Yo(s.O2)); q.stroke(); q.shadowBlur = 0; q.lineWidth = 1;
        /* Δp e flussi */
        var bx = W - 90; q.fillStyle = 'rgba(255,77,141,.18)'; q.fillRect(bx, y0, 12, y1 - y0); var hb = s.dp / 220 * (y1 - y0); q.fillStyle = '#ff4d8d'; q.fillRect(bx, y1 - hb, 12, hb);
        q.fillStyle = '#ffc9de'; q.font = '700 8.5px system-ui,sans-serif'; q.fillText('Δp', bx - 1, y0 - 3); q.font = '500 8px ui-monospace,Menlo,monospace'; q.fillText(Math.round(s.dp) + ' mV', bx + 15, y1 - hb + 4);
        q.fillStyle = '#c5f6fa'; q.fillText('O₂ ' + fmt(s.consumoO2 || 0, 2), bx + 15, y0 + 8); q.fillStyle = '#ffe066'; q.fillText('ATP ' + fmt(s.Jsyn || 0, 2), bx + 15, y0 + 20); q.fillStyle = '#ffc078'; q.fillText(t('perdita ', 'leak ') + fmt(s.Jleak || 0, 1), bx + 15, y0 + 32);
        TV.cv.setAttribute('aria-label', t('Ossigrafo: ossigeno ', 'Oxygraph: oxygen ') + Math.round(s.O2) + ' nmol/ml, Δp ' + Math.round(s.dp) + ' mV');
      }
      function testoStato() {
        var st, k = s.cn ? 'cn' : s.dnp ? 'dnp' : s.oligo ? 'oligo' : s.ADP > 1 ? 's3' : s.atp > 0 ? 's4' : 's2';
        st = { s2: [t('<b>Stato 2</b> · mitocondri + substrato, niente ADP: l\'ATP sintasi non ha nulla da fare, il gradiente sale al massimo e frena la catena: si consuma pochissimo O₂.', '<b>State 2</b> · mitochondria + substrate, no ADP: ATP synthase has nothing to do, the gradient rises to its maximum and brakes the chain: very little O₂ is used.')],
          s3: [t('<b>Stato 3</b> · c\'è ADP: gli H⁺ rientrano dall\'ATP sintasi, il rotore gira, le β fanno ATP; il gradiente scende un poco e la catena accelera: il consumo di O₂ sale. È il <b>controllo respiratorio</b>.', '<b>State 3</b> · ADP is present: H⁺ flow back through ATP synthase, the rotor turns, the βs make ATP; the gradient drops a little and the chain speeds up: O₂ use rises. This is <b>respiratory control</b>.')],
          s4: [t('<b>Stato 4</b> · l\'ADP è finito: il rotore si ferma, il gradiente torna massimo e il consumo di O₂ ricade. Aggiungi altro ADP e riparte.', '<b>State 4</b> · ADP is used up: the rotor stops, the gradient maxes out again and O₂ use falls. Add more ADP and it restarts.')],
          oligo: [t('<b>Oligomicina</b> · blocca il canale F₀ (fra subunità a e anello c): niente rotazione, niente ATP, e il consumo di O₂ ricade. Attenzione: blocca l\'ATP sintasi, la catena si ferma solo di conseguenza.', '<b>Oligomycin</b> · blocks the F₀ channel (between subunit a and the c ring): no rotation, no ATP, and O₂ use falls. Careful: it blocks ATP synthase; the chain stops only as a consequence.')],
          dnp: [t('<b>Disaccoppiante</b> (DNP, FCCP, o la UCP1 del grasso bruno) · gli H⁺ rientrano attraverso la membrana senza passare dal rotore: il gradiente crolla, la catena corre al massimo, l\'O₂ si consuma più di prima, ma niente ATP: l\'energia diventa calore.', '<b>Uncoupler</b> (DNP, FCCP, or brown-fat UCP1) · H⁺ leak back across the membrane bypassing the rotor: the gradient collapses, the chain runs flat out, O₂ is used faster than before, but no ATP: the energy becomes heat.')],
          cn: [t('<b>Cianuro</b> · blocca il complesso IV: gli elettroni non arrivano all\'O₂, nessun H⁺ viene pompato, il gradiente si scarica e si ferma tutto. Trasporto di elettroni e sintesi di ATP sono accoppiati dal gradiente protonico.', '<b>Cyanide</b> · blocks complex IV: electrons cannot reach O₂, no H⁺ is pumped, the gradient drains and everything stops. Electron transport and ATP synthesis are coupled by the proton gradient.')] }[k];
        return st[0];
      }
      var ultimoTesto = '';
      S.ogniFotogramma(function (dt) {
        if (!vivo) return false; if (D.hidden) return true;
        if (!pausa) {
          var dm = Math.min(0.1, dt) * vel, n = Math.max(1, Math.ceil(dm / 0.05));
          for (var i = 0; i < n; i++) { B().passoOssigrafo(s, dm / n); accTraccia += dm / n; if (accTraccia >= 0.5) { accTraccia = 0; s.traccia.push([s.t, s.O2]); if (s.traccia.length > 1200) s.traccia.shift(); } }
          if (guida) guida = guida.filter(function (e) { if (s.t >= e[0]) { B().aggiungi(s, e[1]); return false; } return true; });
        }
        var th = s.angolo; rotore.rotation.z = th;
        /* le tre β: L → T → O, e un ATP che esce a ogni 120° */
        betas.forEach(function (b) { var st = B().statoBeta(th, b.i); if (st !== b.st) { b.st = st; b.m.material.color.set(COL_BETA[st]); b.m.material.emissive.set(COL_BETA[st]); testi.cambia(b.et, st, COL_BETA[st]); } b.adp.visible = st === 'L'; b.pi.visible = st === 'L'; b.atp.visible = st === 'T'; });
        var R0 = B().rotore(th, s.c);
        if (R0.atp > ultimoATP) {
          for (var na = ultimoATP; na < R0.atp && na < ultimoATP + 3; na++) { var bo = betas.filter(function (b) { return b.st === 'O'; })[0] || betas[0], p0 = [bo.atp.position.x, bo.atp.position.y, bo.atp.position.z], dir = [p0[0] * 2.4, p0[1] * 2.4, 5.6];
            var spA = testi.sprite('ATP', '#ffe066', 0.3, 'rgba(40,30,0,.85)'); vola([p0, [p0[0] * 1.6, p0[1] * 1.6, 4.4], dir], 1.1, spA, 'svanisci'); }
          ultimoATP = R0.atp;
        }
        /* protoni sull'anello: entrano dal semicanale (a +15°), escono dopo quasi un giro (a −15°) */
        siti.forEach(function (x) {
          var ang = ((th + x.a) % (2 * PI) + 2 * PI) % (2 * PI), carico = ang > 15 * PI / 180 && ang < 345 * PI / 180;
          if (carico !== x.carico) {
            if (primoGiro) { /* al primo fotogramma i siti prendono lo stato senza far volare protoni */ }
            else if (carico) { vola(CAN_IN, 0.45 * 4 / vel, null, 'via'); }
            else { vola(CAN_OUT.concat([[CAN_OUT[2][0] + 0.8, CAN_OUT[2][1] - 0.6, 2.2]]), 0.9 * 4 / vel, null, 'svanisci'); }
            x.carico = carico;
          }
          x.hp.visible = carico;
        });
        primoGiro = false;
        /* nuvola nello spazio intermembrana: tanti H⁺ quanto il gradiente */
        var nv = Math.round(s.dp / 220 * nuvola.length), tt0 = s.t;
        nuvola.forEach(function (mh, i) { mh.visible = i < nv; if (!mh.visible) return; var u = mh.userData; mh.position.set(u.x + 0.25 * Math.sin(tt0 * 0.7 + u.f), u.y + 0.25 * Math.cos(tt0 * 0.6 + u.f * 1.3), u.z + 0.15 * Math.sin(tt0 + u.f)); });
        /* disaccoppiante: H⁺ che attraversano la membrana lontano dal rotore */
        if (s.dnp && !pausa) { accPerdita += dt * s.Jleak * 0.25 * vel / 4; while (accPerdita > 1) { accPerdita -= 1; var rl = 2.4 + Math.random() * 2.2, al = Math.random() * 2 * PI, px = rl * Math.cos(al), py = rl * Math.sin(al); vola([[px, py, -1.8], [px, py, 0], [px, py, 1.8]], 0.9, null, 'svanisci'); } }
        segnoOligo.visible = s.oligo; segnoDNP.visible = s.dnp; segnoCN.visible = s.cn;
        matNucleo.emissive.set(s.dnp ? '#ff6a00' : '#f0b46a'); matNucleo.emissiveIntensity = s.dnp ? 0.25 + 0.5 * Math.min(1, (s.Jleak || 0) / 20) : 0.25;
        /* chi vola */
        volanti = volanti.filter(function (v) {
          v.t += dt; var u = v.t / v.d, p = puntoSu(v.P, u); v.mesh.position.set(p[0], p[1], p[2]);
          if (v.poi === 'svanisci' && v.mesh.material) { v.mesh.material.opacity = cl(1.6 - u * 1.4, 0, 1); v.mesh.material.transparent = true; }
          if (u >= 1) { rig.remove(v.mesh); if (v.mesh.geometry !== geoH && v.mesh.geometry && !v.mesh.isSprite) v.mesh.geometry.dispose(); if (v.mesh.material) v.mesh.material.dispose(); return false; }
          return true;
        });
        /* viste: spaccato con un piano rivolto alla camera, esplosa con i gruppi che si allontanano */
        vistaV.taglio += (obiettivo.taglio - vistaV.taglio) * Math.min(1, dt * 5); vistaV.esplosa += (obiettivo.esplosa - vistaV.esplosa) * Math.min(1, dt * 4);
        var cx = Math.cos(S.vista.th), cy = Math.sin(S.vista.th); taglio.normal.set(-cx, -cy, 0); taglio.constant = 0.02 + (1 - vistaV.taglio) * 20;
        var conTaglio = vistaV.taglio > 0.01; if (conTaglio !== tagliato) { tagliato = conTaglio; tagliabili.forEach(function (m) { m.clippingPlanes = conTaglio ? piani : null; m.needsUpdate = true; }); }
        var e = ss(vistaV.esplosa); testa.position.z = 2.1 * e; statore.position.set(1.7 * e, 0, 0.5 * e); membrana.position.z = -0.9 * e; matTeste.opacity = 1 - 0.55 * e; matTeste.transparent = e > 0.01; anello.position.z = -0.35 * e;
        etich.visible = etichetteOn;
        var kUI = Math.round(s.t * 8); if (kUI !== ultimoUI) {
          ultimoUI = kUI; ossigrafo();
          conti.innerHTML = '<div>' + t('giri del rotore', 'rotor turns') + '<b>' + fmt(R0.giri, 2) + '</b></div><div>' + t('H⁺ passati (anello c)', 'H⁺ through (c ring)') + '<b>' + R0.protoni + '</b></div><div>' + t('ATP fatti', 'ATP made') + '<b>' + R0.atp + '</b></div><div>H⁺/ATP ' + t('rotore', 'rotor') + '<b>' + fmt(R0.hPerAtp, 2) + '</b></div><div>' + t('P/O NADH (con 1 H⁺ di trasporto)', 'P/O NADH (with 1 transport H⁺)') + '<b>' + fmt(R0.PO_NADH, 2) + '</b></div><div>' + t('ADP rimasto (nmol)', 'ADP left (nmol)') + '<b>' + Math.round(s.ADP) + '</b></div>';
          var tx = testoStato(); if (tx !== ultimoTesto) { ultimoTesto = tx; spiega.innerHTML = tx + '<br><span style="color:#9fb3c8;font-size:.82rem">' + t('Libro: P/O = 2,5 per il NADH e 1,5 per il FADH₂ (≈ 4 H⁺ per ATP). Con c₈: 8/3 + 1 = 3,67 H⁺ → P/O ≈ 2,7. Con c₁₀ (lievito) 4,33 → 2,3.', 'Textbook: P/O = 2.5 for NADH and 1.5 for FADH₂ (≈ 4 H⁺ per ATP). With c₈: 8/3 + 1 = 3.67 H⁺ → P/O ≈ 2.7. With c₁₀ (yeast) 4.33 → 2.3.') + '</span>'; }
          api.ultimo = { t: s.t, giri: R0.giri, protoni: R0.protoni, atp: R0.atp, O2: s.O2, dp: s.dp, consumoO2: s.consumoO2, Jsyn: s.Jsyn, stati: betas.map(function (b) { return b.st; }).join('') };
        }
        return true;
      });
      F.alRidimensiona(function () { S.adatta(); TV.W = 0; });
      api.pronto = true; api.S = S; api.aggiungi = function (c) { B().aggiungi(s, c); }; api.nuova = nuova; api.vista = function (k) { if (vb[k]) vb[k].click(); }; api.pausa = function (v) { pausa = v; bP.textContent = pausa ? '▶' : '⏸'; };
      api.avanza = function (sec) { var n = Math.round(sec / 0.05); for (var i = 0; i < n; i++) { B().passoOssigrafo(s, 0.05); accTraccia += 0.05; if (accTraccia >= 0.5) { accTraccia = 0; s.traccia.push([s.t, s.O2]); } } S.avvia(); };
      S.avvia();
    }).catch(function (e) { palco.textContent = '⚠ ' + e.message; });
    return api;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     🧪 2 · ENZIMI E CINETICA
     ═══════════════════════════════════════════════════════════════════════ */
  var TIPI = [['nessuno', ['nessun inibitore', 'no inhibitor']], ['competitivo', ['competitivo', 'competitive']], ['noncompetitivo', ['non competitivo puro', 'pure non-competitive']], ['misto', ['misto', 'mixed']], ['incompetitivo', ['incompetitivo', 'uncompetitive']]];
  var PERCHE_TIPO = {
    nessuno: ['Senza inibitore: iperbole. Con poco substrato la velocità sale quasi in linea retta (primo ordine), con tanto l\'enzima è saturo e V₀ → Vmax (ordine zero).', 'No inhibitor: a hyperbola. With little substrate the rate rises almost linearly (first order); with a lot the enzyme is saturated and V₀ → Vmax (zero order).'],
    competitivo: ['Competitivo: si lega solo al sito attivo di E (complesso EI, gli enzimi restano aperti). Km apparente ↑ di α = 1 + [I]/Ki, Vmax uguale: con tantissimo substrato l\'inibitore è spostato. LB: rette che si incrociano sull\'asse y. Es.: malonato sulla succinato DH.', 'Competitive: binds only the active site of E (EI complex, enzymes stay open). Apparent Km ↑ by α = 1 + [I]/Ki, Vmax unchanged: lots of substrate displaces it. LB: lines crossing on the y axis. E.g. malonate on succinate DH.'],
    noncompetitivo: ['Non competitivo puro: si lega altrove (sito allosterico, sfera rossa dietro), allo stesso modo su E ed ES. Toglie enzima funzionante: Vmax ↓, Km uguale. LB: rette che si incrociano sull\'asse x.', 'Pure non-competitive: binds elsewhere (allosteric site, red sphere behind), equally to E and ES. It removes working enzyme: Vmax ↓, Km unchanged. LB: lines crossing on the x axis.'],
    misto: ['Misto: si lega a E ed ES con affinità diverse (qui Ki = 1, Ki′ = 3). Vmax ↓; Km sale se preferisce E, scende se preferisce ES. LB: rette che si incrociano fuori dagli assi.', 'Mixed: binds E and ES with different affinities (here Ki = 1, Ki′ = 3). Vmax ↓; Km rises if it prefers E, falls if it prefers ES. LB: lines crossing off the axes.'],
    incompetitivo: ['Incompetitivo: si lega solo a ES e lo blocca in forma inattiva (ESI). Vmax e Km scendono dello stesso fattore. LB: rette parallele.', 'Uncompetitive: binds only ES and locks it inactive (ESI). Vmax and Km drop by the same factor. LB: parallel lines.'],
    allosterico: ['Allosterico: più subunità e cooperatività: la curva è una sigmoide e al posto di Km si usa K₀,₅. Gli attivatori stabilizzano lo stato R (verde) e spostano la curva a sinistra; gli inibitori stabilizzano T (blu) e la spostano a destra. È così all\'inizio delle vie (PFK-1).', 'Allosteric: several subunits and cooperativity: the curve is sigmoid and K₀.₅ replaces Km. Activators stabilise the R state (green) and shift the curve left; inhibitors stabilise T (blue) and shift it right. Typical at pathway entry points (PFK-1).']
  };
  function creaEnzimi(cont, opz) {
    opz = opz || {}; stile();
    if (cont._bl) cont._bl.distruggi(); cont.textContent = '';
    var palco = F.el('div', { 'class': 'bsiBL-palco' }), conti = F.el('div', { 'class': 'bsiBL-cont', 'aria-live': 'polite' }), c1 = F.el('div', { 'class': 'bsiBL-com' }), c2 = F.el('div', { 'class': 'bsiBL-com' }), c3 = F.el('div', { 'class': 'bsiBL-com', role: 'toolbar', 'aria-label': t('Grafico', 'Chart') }), spiega = F.el('div', { 'class': 'bsiBL-box', 'aria-live': 'polite' });
    var leg = F.el('div', { 'class': 'bsiBL-leg', html: '<span><i style="background:#ffd43b"></i>' + t('substrato S', 'substrate S') + '</span><span><i style="background:#51cf66"></i>' + t('prodotto P', 'product P') + '</span><span><i style="background:#ff6b6b"></i>' + t('inibitore I', 'inhibitor I') + '</span><span><i style="background:#748ffc"></i>' + t('enzima aperto', 'open enzyme') + '</span><span><i style="background:#22b8cf"></i>' + t('enzima chiuso sul substrato (adattamento indotto)', 'enzyme closed on substrate (induced fit)') + '</span>' });
    [palco, conti, c1, c2, c3, spiega, leg].forEach(function (e) { cont.appendChild(e); });
    cont.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Onestà', 'Honesty') + '</b> · ' + t('Enzimi SCHEMATICI (due lobi con una cerniera, come l\'esochinasi). La frazione di enzimi in E, ES, EI, ESI segue l\'equilibrio rapido (MODELLO), quindi la velocità misurata contando i prodotti torna con la formula: le due cifre sotto lo mostrano. Velocità di catalisi RALLENTATA per vederla.', 'SCHEMATIC enzymes (two hinged lobes, like hexokinase). The fraction of enzymes in E, ES, EI, ESI follows rapid equilibrium (MODEL), so the rate measured by counting products matches the formula: the two numbers below show it. Catalysis SLOWED DOWN to be visible.') }));
    var api = { pronto: false }, vivo = true, S = null, testi = null; api.distruggi = function () { vivo = false; if (S) S.pulisci(); if (testi) testi.distruggi(); }; cont._bl = api;
    var L3 = g.BSILab3D; if (!L3 || !B()) { palco.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return api; }
    L3.stile();
    var stato = { enz: B().ENZIMI[0], S: 1, tipo: 'nessuno', I: 0, eff: 'nessuno', grafico: 'mm' };
    if (opz.enzima) stato.enz = B().ENZIMI.filter(function (e) { return e.id === opz.enzima; })[0] || stato.enz;
    function par() { var e = stato.enz, al = e.tipo === 'allosterico'; return al ? { tipo: 'allosterico', K05: e.K05, n: e.n, Vmax: 1, effettore: stato.eff === 'attivatore' ? 0.4 : stato.eff === 'inibitore' ? 2.5 : 1 } : { tipo: stato.tipo, Km: e.Km, Vmax: 1, I: stato.I, Ki: 1, Ki2: stato.tipo === 'misto' ? 3 : 1 }; }
    api.parametri = par;
    L3.caricaThree().then(function () {
      if (!vivo) return; var T = g.THREE; testi = creaTesti(T);
      S = scena(palco, L3, [0.6, 1.15], t('Enzimi al lavoro', 'Enzymes at work'), 'E + S ⇄ ES → E + P');
      var radice = new T.Group(); S.aggiungi(radice);
      var geoL = new T.SphereGeometry(1, 22, 16), geoP = new T.SphereGeometry(0.24, 14, 10), geoI = new T.OctahedronGeometry(0.27, 0);
      var matS = new T.MeshStandardMaterial({ color: '#ffd43b', emissive: '#ffd43b', emissiveIntensity: 0.35, roughness: 0.4 }), matP = new T.MeshStandardMaterial({ color: '#51cf66', emissive: '#51cf66', emissiveIntensity: 0.35, roughness: 0.4, transparent: true }), matI = new T.MeshStandardMaterial({ color: '#ff6b6b', emissive: '#ff6b6b', emissiveIntensity: 0.4, roughness: 0.4 });
      var enzimi = [];
      for (var k = 0; k < 6; k++) {
        var a = k * PI / 3 + PI / 6, gE = new T.Group(); gE.position.set(2.7 * Math.cos(a), 2.7 * Math.sin(a), 0); gE.rotation.z = a + PI / 2; radice.add(gE);
        var mA = new T.MeshStandardMaterial({ color: '#748ffc', emissive: '#748ffc', emissiveIntensity: 0.05, roughness: 0.55 }), mB = mA.clone();
        var pA = new T.Group(), pB = new T.Group(); pA.position.set(0, 0, -0.7); pB.position.set(0, 0, -0.7); gE.add(pA); gE.add(pB);
        var lA = new T.Mesh(geoL, mA), lB = new T.Mesh(geoL, mB); lA.scale.set(0.52, 0.6, 0.85); lB.scale.set(0.52, 0.6, 0.85); lA.position.set(-0.5, 0, 0.75); lB.position.set(0.5, 0, 0.75); pA.add(lA); pB.add(lB);
        var cern = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.7, 12), new T.MeshStandardMaterial({ color: '#5c7cfa', roughness: 0.6 })); cern.rotation.x = PI / 2; cern.position.set(0, 0, -0.7); gE.add(cern);
        var allo = new T.Mesh(new T.SphereGeometry(0.2, 12, 10), new T.MeshStandardMaterial({ color: '#364fc7', roughness: 0.5 })); allo.position.set(0, -0.62, -0.25); gE.add(allo);
        var sito = new T.Mesh(geoP, matS), sitoI = new T.Mesh(geoI, matI), alloI = new T.Mesh(geoI, matI); sito.position.set(0, 0, 0.55); sitoI.position.set(0, 0, 0.55); alloI.position.set(0, -0.86, -0.25); sito.visible = sitoI.visible = alloI.visible = false; gE.add(sito); gE.add(sitoI); gE.add(alloI);
        enzimi.push({ g: gE, pA: pA, pB: pB, mA: mA, mB: mB, sito: sito, sitoI: sitoI, alloI: alloI, st: 'E', timer: Math.random() * 0.6, ap: 0.4 });
      }
      /* particelle libere */
      function nube(n, geo, matx) { var a = []; for (var i = 0; i < n; i++) { var m = new T.Mesh(geo, matx), r = 4 + Math.random() * 2.2, an = Math.random() * 2 * PI; m.userData = { x: r * Math.cos(an), y: r * Math.sin(an), z: (Math.random() - 0.5) * 3, f: Math.random() * 10 }; m.visible = false; radice.add(m); a.push(m); } return a; }
      var liberiS = nube(40, geoP, matS), liberiI = nube(24, geoI, matI), volanti = [];
      function vola(mesh, p0, p1, d, svanisci) { var m = mesh.clone(); if (svanisci) { m.material = m.material.clone(); } radice.add(m); volanti.push({ m: m, p0: p0, p1: p1, t: 0, d: d, sv: svanisci }); }
      var mondo = new T.Vector3();
      function posMondo(o) { o.getWorldPosition(mondo); return [mondo.x, mondo.y, mondo.z]; }
      S.inquadra(distanza(S, 4.6), 1.2, 0.9); S.vista.bersaglio.set(0, 0, -1.4);
      /* comandi */
      var selE = F.el('select', { 'aria-label': t('Enzima', 'Enzyme') }); B().ENZIMI.forEach(function (e) { var o = F.el('option', { value: e.id, testo: F.tt(e.nome) }); if (e === stato.enz) o.selected = true; selE.appendChild(o); });
      var selT = F.el('select', { 'aria-label': t('Tipo di inibitore', 'Inhibitor type') }); TIPI.forEach(function (x) { selT.appendChild(F.el('option', { value: x[0], testo: F.tt(x[1]) })); });
      var selEff = F.el('select', { 'aria-label': t('Effettore allosterico', 'Allosteric effector') }); [['nessuno', t('nessun effettore', 'no effector')], ['attivatore', t('attivatore (AMP, F-2,6-BP) → R', 'activator (AMP, F-2,6-BP) → R')], ['inibitore', t('inibitore (ATP, citrato) → T', 'inhibitor (ATP, citrate) → T')]].forEach(function (x) { selEff.appendChild(F.el('option', { value: x[0], testo: x[1] })); });
      var cS = F.el('input', { type: 'range', min: '-2', max: '2', step: '0.02', value: '0', 'class': 'bsiBL-tempo', 'aria-label': t('Concentrazione di substrato', 'Substrate concentration') }), vS = F.el('span');
      var cI = F.el('input', { type: 'range', min: '0', max: '10', step: '0.1', value: '0', 'class': 'bsiBL-tempo', 'aria-label': t('Concentrazione di inibitore', 'Inhibitor concentration') }), vI = F.el('span');
      var lT = F.el('label', {}, [F.el('span', { testo: t('Inibitore', 'Inhibitor') }), selT]), lEff = F.el('label', {}, [F.el('span', { testo: t('Effettore', 'Effector') }), selEff]);
      c1.appendChild(F.el('label', {}, [F.el('span', { testo: t('Enzima', 'Enzyme') }), selE])); c1.appendChild(lT); c1.appendChild(lEff);
      c2.appendChild(F.el('label', { style: 'flex:1;min-width:200px' }, [F.el('span', { testo: '[S]' }), cS, vS])); var lI = F.el('label', { style: 'flex:1;min-width:200px' }, [F.el('span', { testo: '[I]/Ki' }), cI, vI]); c2.appendChild(lI);
      var gb = {}; [['mm', t('📈 Michaelis–Menten', '📈 Michaelis–Menten')], ['lb', t('📉 Lineweaver–Burk', '📉 Lineweaver–Burk')], ['dg', t('⛰ Energia ΔG‡', '⛰ Energy ΔG‡')]].forEach(function (x) { var b = F.el('button', { type: 'button', testo: x[1], onclick: function () { stato.grafico = x[0]; Object.keys(gb).forEach(function (k) { gb[k].setAttribute('aria-pressed', String(k === x[0])); }); disegna(); } }); gb[x[0]] = b; c3.appendChild(b); }); gb.mm.setAttribute('aria-pressed', 'true');
      var prodotti = [], nProd = 0;
      function aggiorna() {
        var e = stato.enz, al = e.tipo === 'allosterico', Kref = al ? e.K05 : e.Km; stato.S = Kref * Math.pow(10, +cS.value); stato.I = +cI.value; stato.tipo = al ? 'allosterico' : selT.value; stato.eff = selEff.value;
        lT.style.display = al ? 'none' : ''; lI.style.display = al ? 'none' : ''; lEff.style.display = al ? '' : 'none';
        vS.textContent = fmt(stato.S, stato.S < 1 ? 3 : 2) + ' mM'; vI.textContent = fmt(stato.I, 1);
        spiega.innerHTML = '<b>' + F.tt(TIPI.filter(function (x) { return x[0] === stato.tipo; }).map(function (x) { return x[1]; })[0] || ['Allosterico', 'Allosteric']) + '</b> · ' + F.tt(PERCHE_TIPO[stato.tipo]);
        finestra = []; t0 = orologio; disegna(); S.avvia();
      }
      [selE, selT, selEff].forEach(function (x) { x.addEventListener('change', function () { if (x === selE) { stato.enz = B().ENZIMI.filter(function (e) { return e.id === selE.value; })[0]; cS.value = '0'; } aggiorna(); }); });
      [cS, cI].forEach(function (x) { x.addEventListener('input', aggiorna); });
      /* il grafico nel palco */
      var TV = tela(S.box);
      function disegna() {
        if (!S) return; TV.misura(S.ren, 0.3, 160); var q = TV.q, W = TV.W, H = TV.H; TV.fondo(); var o = par(), o0 = JSON.parse(JSON.stringify(o)); o0.I = 0; o0.effettore = 1;
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 16;
        q.strokeStyle = 'rgba(140,160,190,.35)'; q.beginPath(); q.font = '500 8.5px system-ui,sans-serif'; q.fillStyle = 'rgba(200,214,232,.9)';
        function curva(f, a, b, Xf, Yf, col, tratt) { q.strokeStyle = col; q.lineWidth = 2.2; q.setLineDash(tratt ? [4, 4] : []); q.beginPath(); for (var k = 0; k <= 160; k++) { var xx = a + (b - a) * k / 160, yy = f(xx); if (!isFinite(yy)) continue; var px = Xf(xx), py = Yf(yy); if (k) q.lineTo(px, py); else q.moveTo(px, py); } q.stroke(); q.setLineDash([]); q.lineWidth = 1; }
        if (stato.grafico === 'mm') {
          var Kr = stato.enz.tipo === 'allosterico' ? stato.enz.K05 : stato.enz.Km, Smax = Kr * 10, X = function (v) { return x0 + v / Smax * (x1 - x0); }, Y = function (v) { return y1 - v / 1.08 * (y1 - y0); };
          q.strokeStyle = 'rgba(140,160,190,.35)'; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0, y1); q.lineTo(x1, y1); q.stroke();
          q.setLineDash([2, 4]); q.beginPath(); q.moveTo(x0, Y(1)); q.lineTo(x1, Y(1)); q.stroke(); q.setLineDash([]); q.fillText('Vmax', x1 - 30, Y(1) - 3);
          q.fillText('V₀', 6, y0 + 4); q.textAlign = 'right'; q.fillText('[S] (mM) →', x1, H - 4); q.textAlign = 'left';
          if (o.tipo === 'allosterico') curva(function (s) { return s / (Kr + s); }, 0, Smax, X, Y, 'rgba(180,190,210,.6)', true);
          curva(function (s) { return B().velocita(s, o0); }, 0, Smax, X, Y, o.tipo === 'nessuno' || o.tipo === 'allosterico' && o.effettore === 1 ? '#4dabf7' : 'rgba(77,171,247,.55)', o.tipo !== 'nessuno' && !(o.tipo === 'allosterico' && o.effettore === 1));
          if (o.tipo !== 'nessuno' && !(o.tipo === 'allosterico' && o.effettore === 1)) curva(function (s) { return B().velocita(s, o); }, 0, Smax, X, Y, '#ff6b6b');
          var ap = o.tipo === 'allosterico' ? { Km: o.K05 * o.effettore, Vmax: 1 } : B().apparenti(o); q.strokeStyle = '#ffa94d'; q.setLineDash([2, 3]); q.beginPath(); q.moveTo(X(ap.Km), y1); q.lineTo(X(ap.Km), Y(ap.Vmax / 2)); q.lineTo(x0, Y(ap.Vmax / 2)); q.stroke(); q.setLineDash([]); q.fillStyle = '#ffa94d'; q.fillText((o.tipo === 'allosterico' ? 'K₀,₅' : 'Km') + (o.tipo !== 'nessuno' && o.tipo !== 'allosterico' ? ' app' : ''), X(ap.Km) + 3, y1 - 3);
          var v = B().velocita(Math.min(stato.S, Smax), o), px = X(Math.min(stato.S, Smax)), py = Y(v); q.fillStyle = '#fff'; q.beginPath(); q.arc(px, py, 4, 0, 2 * PI); q.fill(); q.strokeStyle = 'rgba(255,255,255,.5)'; q.beginPath(); q.arc(px, py, 8, 0, 2 * PI); q.stroke();
        } else if (stato.grafico === 'lb') {
          if (o.tipo === 'allosterico') { q.fillStyle = '#ffd8a8'; q.font = '600 10px system-ui,sans-serif'; q.fillText(t('Gli allosterici non danno una retta nei doppi reciproci: la LB vale per Michaelis–Menten.', 'Allosteric enzymes do not give a straight double-reciprocal line: LB holds for Michaelis–Menten.'), 10, H / 2); }
          else {
            var l0 = B().lb(o0), l1 = B().lb(o), Km = stato.enz.Km, xa = -2.2 / Km, xb = 4 / Km, ymax = Math.max(l0.intercettaY + l0.pendenza * xb, l1.intercettaY + l1.pendenza * xb) * 1.05, ymin = -ymax * 0.25;
            var Xl = function (v) { return x0 + (v - xa) / (xb - xa) * (x1 - x0); }, Yl = function (v) { return y1 - (v - ymin) / (ymax - ymin) * (y1 - y0); };
            q.strokeStyle = 'rgba(140,160,190,.45)'; q.beginPath(); q.moveTo(Xl(0), y0); q.lineTo(Xl(0), y1); q.moveTo(x0, Yl(0)); q.lineTo(x1, Yl(0)); q.stroke();
            q.fillText('1/V₀', Xl(0) + 3, y0 + 6); q.textAlign = 'right'; q.fillText('1/[S] →', x1, Yl(0) - 3); q.textAlign = 'left';
            [[l0, '#4dabf7'], [l1, '#ff6b6b']].forEach(function (z, i) { if (i && o.tipo === 'nessuno') return; var l = z[0]; curva(function (x) { return l.intercettaY + l.pendenza * x; }, Math.max(xa, l.intercettaX - 0.6 / Km), xb, Xl, Yl, z[1]); q.fillStyle = z[1]; q.beginPath(); q.arc(Xl(l.intercettaX), Yl(0), 3.2, 0, 2 * PI); q.fill(); q.beginPath(); q.arc(Xl(0), Yl(l.intercettaY), 3.2, 0, 2 * PI); q.fill(); });
            q.fillStyle = '#ffa94d'; q.fillText('−1/Km' + (o.tipo !== 'nessuno' ? ' app' : ''), Xl(l1.intercettaX) - 10, Yl(0) + 11); q.fillText('1/Vmax', Xl(0) + 4, Yl(l1.intercettaY) - 3);
          }
        } else {
          /* profilo energetico: senza enzima e con enzima, stesso ΔG°′ */
          var Xg = function (v) { return x0 + v * (x1 - x0); }, Yg = function (v) { return y1 - (v + 0.5) / 1.65 * (y1 - y0); };
          curva(function (x) { return x < 0.5 ? Math.sin(x * PI) * 1 : -0.35 + 1.35 * Math.sin(x * PI) ; }, 0, 1, Xg, Yg, '#adb5bd');
          curva(function (x) { var es = -0.25, ts = 0.42; if (x < 0.25) return es * Math.sin(x / 0.25 * PI / 2) - 0.0; if (x < 0.5) return es + (ts - es) * Math.sin((x - 0.25) / 0.25 * PI / 2); if (x < 0.75) return ts + (-0.55 - ts) * Math.sin((x - 0.5) / 0.25 * PI / 2); return -0.55 + 0.2 * Math.sin((x - 0.75) / 0.25 * PI / 2); }, 0, 1, Xg, Yg, '#ff6b6b');
          q.fillStyle = '#e9ecef'; q.font = '600 9px system-ui,sans-serif'; q.fillText('S', Xg(0) + 2, Yg(0) - 5); q.fillText('P', Xg(1) - 10, Yg(-0.35) - 5); q.fillText('‡', Xg(0.5) - 3, Yg(1) - 4); q.fillStyle = '#ff8787'; q.fillText('ES', Xg(0.25) - 6, Yg(-0.25) + 12); q.fillText('‡ ' + t('con enzima', 'with enzyme'), Xg(0.5) + 4, Yg(0.42) - 3); q.fillText('EP', Xg(0.75) - 6, Yg(-0.55) + 12);
          q.fillStyle = '#9fe7ff'; q.font = '500 8.5px system-ui,sans-serif'; q.fillText(t('ΔG°′ uguale: l\'enzima abbassa ΔG‡, non sposta l\'equilibrio', 'Same ΔG°′: the enzyme lowers ΔG‡, it does not shift equilibrium'), x0 + 4, y0 + 2);
          q.textAlign = 'right'; q.fillStyle = 'rgba(200,214,232,.9)'; q.fillText(t('coordinata di reazione →', 'reaction coordinate →'), x1, H - 4); q.textAlign = 'left';
        }
        TV.cv.setAttribute('aria-label', t('Grafico cinetico', 'Kinetics chart'));
      }
      var orologio = 0, ultimoUI = -1, finestra = [], t0 = 0;
      S.ogniFotogramma(function (dt) {
        if (!vivo) return false; if (D.hidden) return true; dt = Math.min(0.1, dt); orologio += dt;
        var o = par(), f;
        if (o.tipo === 'allosterico') { var fr = B().velocita(stato.S, o) / o.Vmax; f = { E: 1 - fr, ES: fr, EI: 0, ESI: 0 }; }
        else f = B().frazioni(stato.S, o);
        var KV = 1.6;   /* catalisi visibile: prodotti al secondo per enzima in ES */
        enzimi.forEach(function (z) {
          z.timer -= dt;
          if (z.timer <= 0) {
            z.timer = 0.45 + Math.random() * 0.5; var r = Math.random(), nuovo = r < f.E ? 'E' : r < f.E + f.ES ? 'ES' : r < f.E + f.ES + f.EI ? 'EI' : 'ESI';
            if (nuovo !== z.st) {
              var site = posMondo(z.sito), lontano = [site[0] * 2.1, site[1] * 2.1, site[2] + 1.2];
              if ((nuovo === 'ES' || nuovo === 'ESI') && !(z.st === 'ES' || z.st === 'ESI')) vola(z.sito, lontano, site, 0.3);
              if ((nuovo === 'EI') && z.st !== 'EI') vola(z.sitoI, lontano, site, 0.3);
              if ((nuovo === 'ESI') && z.st !== 'ESI') { var as = posMondo(z.alloI); vola(z.alloI, [as[0] * 2, as[1] * 2, as[2] - 1], as, 0.3); }
              z.st = nuovo;
            }
          }
          if (z.st === 'ES' && Math.random() < KV * dt) { nProd++; finestra.push(orologio); var s0 = posMondo(z.sito); vola(new T.Mesh(geoP, matP), s0, [s0[0] * 2.3, s0[1] * 2.3, s0[2] + 2.2], 1.1, true); /* il prodotto esce e un nuovo substrato entra: la frazione di ES resta quella dell'equilibrio */ }
          var chiuso = z.st === 'ES' || z.st === 'ESI', bersaglio = chiuso ? 0.03 : 0.38; z.ap += (bersaglio - z.ap) * Math.min(1, dt * 7);
          z.pA.rotation.y = -z.ap; z.pB.rotation.y = z.ap;
          var col = o.tipo === 'allosterico' ? (o.effettore < 1 ? '#40c057' : o.effettore > 1 ? '#4263eb' : chiuso ? '#22b8cf' : '#748ffc') : chiuso ? '#22b8cf' : '#748ffc'; z.mA.color.set(col); z.mB.color.set(col); z.mA.emissive.set(col); z.mB.emissive.set(col);
          z.sito.visible = chiuso; z.sitoI.visible = z.st === 'EI'; z.alloI.visible = z.st === 'ESI' || (z.st === 'EI' && (o.tipo === 'noncompetitivo' || o.tipo === 'misto'));
          if (z.st === 'EI' && (o.tipo === 'noncompetitivo' || o.tipo === 'misto')) z.sitoI.visible = false;
        });
        /* nuvole: quante particelle libere */
        var Kr = stato.enz.tipo === 'allosterico' ? stato.enz.K05 : stato.enz.Km, nS = Math.round(cl((Math.log10(stato.S / Kr) + 2) / 4, 0, 1) * liberiS.length), nI = o.tipo === 'allosterico' ? 0 : Math.round(cl(stato.I / 10, 0, 1) * liberiI.length);
        liberiS.forEach(function (m, i) { m.visible = i < nS; if (m.visible) { var u = m.userData; m.position.set(u.x + 0.4 * Math.sin(orologio * 0.8 + u.f), u.y + 0.4 * Math.cos(orologio * 0.7 + u.f), u.z + 0.3 * Math.sin(orologio * 1.1 + u.f)); } });
        liberiI.forEach(function (m, i) { m.visible = i < nI; if (m.visible) { var u = m.userData; m.position.set(u.x + 0.3 * Math.cos(orologio * 0.6 + u.f), u.y + 0.3 * Math.sin(orologio * 0.9 + u.f), u.z); m.rotation.x += dt; m.rotation.y += dt * 0.7; } });
        volanti = volanti.filter(function (v) { v.t += dt; var u = v.t / v.d, p = lerp3(v.p0, v.p1, ss(u)); v.m.position.set(p[0], p[1], p[2]); if (v.sv) v.m.material.opacity = cl(1.4 - u, 0, 1); if (u >= 1) { radice.remove(v.m); if (v.sv) v.m.material.dispose(); return false; } return true; });
        while (finestra.length && finestra[0] < orologio - 20) finestra.shift();
        var k = Math.round(orologio * 5); if (k !== ultimoUI) {
          ultimoUI = k; var vt = B().velocita(stato.S, o) / (o.Vmax || 1), mis = finestra.length / (Math.max(0.5, Math.min(20, orologio - t0)) * enzimi.length * KV), ap = o.tipo === 'allosterico' ? null : B().apparenti(o);
          conti.innerHTML = '<div>V₀/Vmax ' + t('(formula)', '(formula)') + '<b>' + fmt(vt, 2) + '</b></div><div>V₀/Vmax ' + t('(contati i P, 20 s)', '(P counted, 20 s)') + '<b>' + fmt(mis, 2) + '</b></div>' + (ap ? '<div>Km app (mM)<b>' + fmt(ap.Km, 2) + '</b></div><div>Vmax app<b>' + fmt(ap.Vmax, 2) + '</b></div>' : '<div>K₀,₅ (mM)<b>' + fmt(o.K05 * o.effettore, 2) + '</b></div><div>n (Hill)<b>' + fmt(o.n, 1) + '</b></div>') +
            '<div>E · ES · EI · ESI<b style="font-size:.82rem">' + [f.E, f.ES, f.EI, f.ESI].map(function (x) { return Math.round(x * 100); }).join(' · ') + ' %</b></div><div>kcat/Km (M⁻¹s⁻¹)<b>' + (stato.enz.kcat / (stato.enz.Km * 1e-3)).toExponential(1).replace('e+', '·10^') + '</b></div><div>' + t('prodotti', 'products') + '<b>' + nProd + '</b></div>';
          api.ultimo = { formula: vt, misurata: mis, frazioni: f, prodotti: nProd };
        }
        return true;
      });
      F.alRidimensiona(function () { S.adatta(); TV.W = 0; disegna(); });
      api.pronto = true; api.S = S; api.imposta = function (o) { if (o.enzima) { selE.value = o.enzima; stato.enz = B().ENZIMI.filter(function (e) { return e.id === o.enzima; })[0]; } if (o.tipo) selT.value = o.tipo; if (o.I != null) cI.value = String(o.I); if (o.logS != null) cS.value = String(o.logS); if (o.eff) selEff.value = o.eff; if (o.grafico) gb[o.grafico].click(); aggiorna(); };
      aggiorna();
    }).catch(function (e) { palco.textContent = '⚠ ' + e.message; });
    return api;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     🗺️ 3 · VIE METABOLICHE E CARBONI
     ═══════════════════════════════════════════════════════════════════════ */
  var COL_C = { g1: '#ff6b6b', g2: '#ffa94d', g3: '#ffd43b', g4: '#69db7c', g5: '#4dabf7', g6: '#b197fc', t1: '#c0eb75', t2: '#e599f7', t3: '#ff8cc6', a1: '#ff4040', a2: '#ff4040', o1: '#ff922b', o2: '#ff922b', o3: '#ff922b', o4: '#ff922b', x1: '#ced4da', m1: '#ced4da', p1: '#ff8787', p2: '#ff8787', a: '#ffd43b', b: '#4dabf7', c1: '#ff6b6b', cU: '#e9ecef' };
  var TAG_C = { g1: 'C1', g2: 'C2', g3: 'C3', g4: 'C4', g5: 'C5', g6: 'C6', t1: 'C3·C4', t2: 'C2·C5', t3: 'C1·C6', a1: 'acet.', a2: 'acet.', o1: 'OAA', o2: 'OAA', o3: 'OAA', o4: 'OAA', x1: 'CO₂', m1: 'CO₂', p1: 'innesco', p2: 'innesco', a: 'Cα', b: 'Cβ', c1: 'C1', cU: 'HCO₃⁻' };
  var COL_GET = { ATP: '#ffe066', ADP: '#ffec99', AMP: '#fff3bf', 'NAD⁺': '#b2f2bb', NADH: '#51cf66', 'FAD': '#ffd8a8', 'FADH₂': '#ff922b', 'CO₂': '#e9ecef', GTP: '#66d9e8', GDP: '#c5f6fa', 'H₂O': '#74c0fc', Pi: '#ffc078', PPi: '#ffc078', 'CoA-SH': '#d0bfff', 'HCO₃⁻': '#ced4da', 'NH₄⁺': '#91a7ff', NADPH: '#38d9a9', 'NADP⁺': '#96f2d7' };
  var COL_EL = { S: '#fcc419', N: '#4c6ef5', R: '#495057' };
  /** posizioni di un insieme di molecole: catena a zig-zag lungo x, rami in z, fosfati in −y */
  function disponi(lista) {
    var pos = {}, info = {}, x = 0, nomi = [], gap = 2.3, L = 1.42;
    lista.forEach(function (m, im) {
      var main = m.atomi.filter(function (a) { return !a.su; }), x0 = x;
      main.forEach(function (a, i) { pos[a.k] = [x + i * L, 0, i % 2 ? 0.42 : -0.42]; info[a.k] = { a: a, m: im }; });
      m.atomi.filter(function (a) { return a.su; }).forEach(function (a) { var p = pos[a.su] || [x, 0, 0], su = p[2] >= 0 ? 1 : -1; pos[a.k] = [p[0] + (info[a.su] && info[a.su].a.su ? 0.7 : 0), p[1], p[2] + su * 1.4]; info[a.k] = { a: a, m: im }; });
      var w = Math.max(0, main.length - 1) * L; nomi.push({ nome: m.nome, x: x0 + w / 2 }); x += w + gap + 0.6;
    });
    var W = Math.max(0, x - gap - 0.6), c = W / 2;
    Object.keys(pos).forEach(function (k) { pos[k][0] -= c; }); nomi.forEach(function (n) { n.x -= c; });
    return { pos: pos, info: info, W: W, nomi: nomi };
  }
  function legami(lista) { var L = {}; lista.forEach(function (m) { var main = m.atomi.filter(function (a) { return !a.su; }); for (var i = 1; i < main.length; i++) L[main[i - 1].k + '|' + main[i].k] = 1; m.atomi.forEach(function (a) { if (a.su) L[a.su + '|' + a.k] = 1; }); }); return L; }
  function creaVia(cont, idVia, opz) {
    opz = opz || {}; stile();
    if (cont._bl) cont._bl.distruggi(); cont.textContent = '';
    var via = B().perVia(idVia) || B().VIE[0], N = via.passi.length;
    var testa = F.el('div', { 'class': 'bsiBL-box' }), palco = F.el('div', { 'class': 'bsiBL-palco' }), barra = F.el('input', { type: 'range', 'class': 'bsiBL-tempo', min: '0', max: String(N), step: '0.001', value: '0', 'aria-label': t('Avanzamento della via', 'Pathway progress') });
    var com = F.el('div', { 'class': 'bsiBL-com', role: 'toolbar', 'aria-label': t('Comandi della via', 'Pathway controls') }), isp = F.el('div', { 'class': 'bsiBL-box', 'aria-live': 'polite' }), leg = F.el('div', { 'class': 'bsiBL-leg' });
    testa.innerHTML = '<h4>' + F.tt(via.nome) + '</h4><span class="bsiBL-chip">📍 ' + F.tt(via.dove) + '</span><span class="bsiBL-chip">' + t('capitolo ', 'chapter ') + via.cap + '</span><br><b>' + t('Bilancio', 'Balance') + ':</b> ' + F.tt(via.bilancio);
    [testa, palco, barra, com, isp, leg].forEach(function (e) { cont.appendChild(e); });
    var chiavi = {}; via.passi.forEach(function (p) { p.prima.concat(p.dopo).forEach(function (m) { m.atomi.forEach(function (a) { if (a.el === 'C' && COL_C[a.k]) chiavi[a.k] = 1; }); }); });
    var visti = {}; leg.innerHTML = Object.keys(chiavi).filter(function (k) { var tag = TAG_C[k] || k, gia = visti[tag]; visti[tag] = 1; return !gia; }).map(function (k) { return '<span><i style="background:' + COL_C[k] + '"></i>' + (TAG_C[k] || k) + '</span>'; }).join('') + '<span><i style="background:#ff922b;border-radius:2px"></i>' + t('fosfato', 'phosphate') + '</span><span><i style="background:#fcc419"></i>S</span><span><i style="background:#4c6ef5"></i>N</span><span><i style="background:#495057"></i>' + t('resto (CoA, TPP, ACP…)', 'rest (CoA, TPP, ACP…)') + '</span>';
    cont.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Onestà', 'Honesty') + '</b> · ' + t('Molecole in SCHEMA a catena aperta: si leggono i carboni, i gruppi e i fosfati, non la conformazione (gli zuccheri in soluzione sono ad anello). Ogni carbonio tiene il suo colore dall\'inizio alla fine; il banco controlla che in ogni passo nessun carbonio nasca o sparisca. ΔG°′ dalla dispensa (Lehninger).', 'Molecules as an open-chain SCHEME: you read carbons, groups and phosphates, not the conformation (sugars in solution are rings). Every carbon keeps its colour from start to end; the bench checks that no carbon appears or vanishes in any step. ΔG°′ from the course notes (Lehninger).') }));
    var api = { pronto: false, via: via }, vivo = true, S = null, testi = null; api.distruggi = function () { vivo = false; if (S) S.pulisci(); if (testi) testi.distruggi(); }; cont._bl = api;
    var L3 = g.BSILab3D; if (!L3 || !B()) { palco.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return api; }
    L3.stile();
    L3.caricaThree().then(function () {
      if (!vivo) return; var T = g.THREE; testi = creaTesti(T);
      S = scena(palco, L3, [0.56, 1.1], F.tt(via.nome), '');
      var radice = new T.Group(); S.aggiungi(radice);
      var geoA = new T.SphereGeometry(1, 22, 16), geoC = new T.CylinderGeometry(1, 1, 1, 12, 1), Y = new T.Vector3(0, 1, 0), tmp = new T.Vector3();
      var corrente = -1, att = null;
      function costruisciPasso(k) {
        if (att) { radice.remove(att.g); att.g.traverse(function (o) { if (o.material) { if (o.material.map && !o.isSprite) o.material.map.dispose(); o.material.dispose(); } }); }
        var p = via.passi[k], A = disponi(p.prima), Z = disponi(p.dopo), gg = new T.Group(); radice.add(gg);
        var chiaviU = {}; Object.keys(A.pos).concat(Object.keys(Z.pos)).forEach(function (c) { chiaviU[c] = 1; });
        var atomi = {};
        Object.keys(chiaviU).forEach(function (c) {
          var ia = A.info[c], iz = Z.info[c], a = (iz || ia).a, el = a.el, colore = el === 'C' ? (COL_C[c] || '#adb5bd') : COL_EL[el], r = el === 'R' ? 0.48 : el === 'C' ? 0.34 : 0.3;
          var mt = new T.MeshStandardMaterial({ color: colore, emissive: colore, emissiveIntensity: 0.08, roughness: 0.38, metalness: 0.05, transparent: true }), mesh = new T.Mesh(geoA, mt); mesh.scale.setScalar(r); gg.add(mesh);
          var gA = ia ? testi.sprite(ia.a.g, '#ffffff', 0.3) : null, gZ = iz ? testi.sprite(iz.a.g, '#ffffff', 0.3) : null; if (gA) gg.add(gA); if (gZ) gg.add(gZ);
          var tag = el === 'C' && TAG_C[c] ? testi.sprite(TAG_C[c], colore, 0.2) : null; if (tag) gg.add(tag);
          var fos = new T.Mesh(geoA, new T.MeshStandardMaterial({ color: '#ff922b', emissive: '#ff922b', emissiveIntensity: 0.3, roughness: 0.4, transparent: true })); fos.scale.setScalar(0.24); gg.add(fos); var fl = new T.Mesh(geoC, new T.MeshStandardMaterial({ color: '#ffc078', transparent: true })); gg.add(fl); var fP = testi.sprite('P', '#fff', 0.24); gg.add(fP);
          atomi[c] = { el: el, pa: ia ? A.pos[c] : null, pz: iz ? Z.pos[c] : null, aA: ia && ia.a, aZ: iz && iz.a, mesh: mesh, gA: gA, gZ: gZ, tag: tag, fos: fos, fl: fl, fP: fP, mod: p.mod.indexOf(c) >= 0 };
        });
        var LA = legami(p.prima), LZ = legami(p.dopo), Lu = {}; Object.keys(LA).concat(Object.keys(LZ)).forEach(function (l) { Lu[l] = 1; });
        var bonds = Object.keys(Lu).map(function (l) { var ab = l.split('|'), m = new T.Mesh(geoC, new T.MeshStandardMaterial({ color: '#c9d3df', roughness: 0.5, transparent: true })); gg.add(m); return { a: ab[0], b: ab[1], inA: !!LA[l], inZ: !!LZ[l], m: m }; });
        var nomiA = A.nomi.map(function (n) { var sp = testi.sprite(F.tt(n.nome), '#9fe7ff', 0.34); sp.position.set(n.x, 0, -1.75); gg.add(sp); return sp; }), nomiZ = Z.nomi.map(function (n) { var sp = testi.sprite(F.tt(n.nome), '#9fe7ff', 0.34); sp.position.set(n.x, 0, -1.75); gg.add(sp); return sp; });
        var Wm = Math.max(A.W, Z.W, 3), sx = -Wm / 2 - 1.6, dx = Wm / 2 + 1.6;
        var gIn = p.in.map(function (s0, i) { var tk = B().gettone(s0), sp = testi.sprite((tk.n > 1 ? tk.n + ' ' : '') + tk.s, COL_GET[tk.s] || '#fff', 0.36, 'rgba(6,12,24,.85)'); gg.add(sp); return { sp: sp, s: tk.s, da: [sx, 0, 2.0 + i * 0.62] }; });
        var gOut = p.out.map(function (s0, i) { var tk = B().gettone(s0), sp = testi.sprite((tk.n > 1 ? tk.n + ' ' : '') + tk.s, COL_GET[tk.s] || '#fff', 0.36, 'rgba(6,12,24,.85)'); gg.add(sp); return { sp: sp, s: tk.s, a: [dx, 0, 2.0 + i * 0.62] }; });
        var enz = testi.sprite('⟶ ' + F.tt(p.enz) + (p.volte > 1 ? '  ×' + p.volte : ''), '#ffe066', 0.36); enz.position.set(0, 0, 3.4 + Math.max(0, Math.max(p.in.length, p.out.length) - 3) * 0.5); gg.add(enz);
        /* da dove entra e dove va un carbonio che compare o scompare */
        var entraC = gIn.filter(function (x) { return x.s === 'HCO₃⁻' || x.s === 'CO₂'; }), esceC = gOut.filter(function (x) { return x.s === 'CO₂'; });
        att = { g: gg, atomi: atomi, bonds: bonds, nomiA: nomiA, nomiZ: nomiZ, gIn: gIn, gOut: gOut, W: Wm, entraC: entraC, esceC: esceC, p: p };
        var R = Math.max(3.6, Wm / 2 + 1.4), dd = distanza(S, R); if (!S.vistaIniziale) S.inquadra(dd, -PI / 2 + 0.25, 1.25); else { S.vista.r = dd; S.vistaIniziale.r = dd; } S.vista.bersaglio.set(0, 0, -0.4);
      }
      function imposta(x) {
        var k = Math.min(N - 1, Math.floor(x)), u = cl(x - k, 0, 1); if (x >= N) { k = N - 1; u = 1; }
        if (k !== corrente) { corrente = k; costruisciPasso(k); }
        var p = att.p, ua = ss(u / 0.3), ub = ss((u - 0.3) / 0.45), uc = ss((u - 0.75) / 0.25), w = ss((u - 0.45) / 0.15);
        Object.keys(att.atomi).forEach(function (c) {
          var A = att.atomi[c], P0 = A.pa, P1 = A.pz, pos, op = 1;
          if (P0 && P1) pos = lerp3(P0, P1, ub);
          else if (P0) { var dest = A.el === 'C' && att.esceC[0] ? att.esceC[0].a : [P0[0] + 4, P0[1] - 2, P0[2] + 3]; pos = lerp3(P0, dest, ub); op = A.el === 'C' ? 1 - ss((u - 0.7) / 0.1) : 1 - ub; }
          else { var orig = A.el === 'C' && att.entraC[0] ? att.entraC[0].da : [P1[0] - 4, P1[1] - 2, P1[2] + 3]; pos = lerp3(orig, P1, ub); op = A.el === 'C' && att.entraC[0] ? ss((u - 0.3) / 0.05) : ub; }
          A.pos = pos; A.mesh.position.set(pos[0], pos[1], pos[2]); A.mesh.material.opacity = op; A.mesh.visible = op > 0.02;
          var glow = A.mod ? 0.08 + 0.8 * Math.max(0, Math.sin(PI * cl((u - 0.25) / 0.6, 0, 1))) : 0.08; A.mesh.material.emissiveIntensity = glow;
          if (A.mod && u > 0.25 && u < 0.85) A.mesh.material.emissive.set('#ff922b'); else A.mesh.material.emissive.set(A.mesh.material.color);
          if (A.gA) { A.gA.position.set(pos[0], pos[1], pos[2] + 0.55); A.gA.material.opacity = op * (P1 ? 1 - w : 1); A.gA.visible = A.gA.material.opacity > 0.02; }
          if (A.gZ) { A.gZ.position.set(pos[0], pos[1], pos[2] + 0.55); A.gZ.material.opacity = op * (P0 ? w : 1); A.gZ.visible = A.gZ.material.opacity > 0.02; }
          if (A.tag) { A.tag.position.set(pos[0], pos[1], pos[2] - 0.55); A.tag.material.opacity = op * 0.9; A.tag.visible = op > 0.05; }
          var fA = A.aA && A.aA.P ? 1 : 0, fZ = A.aZ && A.aZ.P ? 1 : 0, fo = (P0 && P1 ? lerp(fA, fZ, w) : P0 ? fA : fZ) * op, pf = [pos[0], pos[1] - 0.95, pos[2] - 0.15];
          A.fos.visible = A.fl.visible = A.fP.visible = fo > 0.03; if (A.fos.visible) { A.fos.position.set(pf[0], pf[1], pf[2]); A.fos.material.opacity = fo; cilindro(A.fl, pos, pf, 0.05, Y, tmp); A.fl.material.opacity = fo; A.fP.position.set(pf[0], pf[1] - 0.05, pf[2] + 0.02); A.fP.material.opacity = fo; }
        });
        att.bonds.forEach(function (b) { var a = att.atomi[b.a], c = att.atomi[b.b]; if (!a || !c || !a.pos || !c.pos) { b.m.visible = false; return; } var o = (b.inA ? 1 - w : 0) + (b.inZ ? w : 0); o *= Math.min(a.mesh.material.opacity, c.mesh.material.opacity); cilindro(b.m, a.pos, c.pos, 0.075, Y, tmp); b.m.material.opacity = o; b.m.visible = b.m.visible && o > 0.03; });
        att.nomiA.forEach(function (sp) { sp.material.opacity = 1 - w; sp.visible = w < 0.98; }); att.nomiZ.forEach(function (sp) { sp.material.opacity = w; sp.visible = w > 0.02; });
        att.gIn.forEach(function (gt) { var pp = lerp3(gt.da, [0, 0, 0.6], ua); gt.sp.position.set(pp[0], pp[1], pp[2]); gt.sp.material.opacity = 1 - ss((u - 0.22) / 0.1); gt.sp.visible = gt.sp.material.opacity > 0.02; });
        att.gOut.forEach(function (gt) { var pp = lerp3([0, 0, 0.6], gt.a, uc); gt.sp.position.set(pp[0], pp[1], pp[2]); gt.sp.material.opacity = ss((u - 0.72) / 0.06); gt.sp.visible = gt.sp.material.opacity > 0.02; });
        return { k: k, u: u };
      }
      /* l'ispettore del passo */
      function ispettore(k, u) {
        var p = via.passi[k], ch = function (cls, s) { return '<span class="bsiBL-chip ' + cls + '">' + s + '</span>'; }, nomi = function (l) { return l.map(function (m) { return F.tt(m.nome); }).join(' + ') || '—'; };
        var eq = [nomi(p.prima)].concat(p.in).join(' + ') + ' ⟶ ' + [nomi(p.dopo)].concat(p.out).join(' + ');
        isp.innerHTML = '<h4>' + t('Passo ', 'Step ') + p.n + '/' + N + ' · ' + F.tt(p.enz) + '</h4>' + ch('', F.tt(B().CL[p.cl])) + ch('', t('cofattori: ', 'cofactors: ') + p.cof) + (p.dG != null ? ch(p.dG < -10 ? 'v' : p.dG > 10 ? 'r' : '', 'ΔG°′ ' + (p.dG > 0 ? '+' : '') + fmt(p.dG, 1) + ' kJ/mol') : '') + ch(p.rev ? '' : 'r', p.rev ? t('reversibile', 'reversible') : t('irreversibile', 'irreversible')) + (p.reg ? ch('o', '★ ' + t('regolata', 'regulated')) : '') + (p.volte > 1 ? ch('o', '×' + p.volte + t(' per glucosio', ' per glucose')) : '') +
          '<div style="margin:6px 0;font:600 .86rem ui-monospace,Menlo,monospace;color:#e6f2ff">' + eq + '</div><b>' + t('Carboni', 'Carbons') + ':</b> ' + F.tt(p.car) + '<br><b>' + t('Come funziona', 'How it works') + ':</b> ' + F.tt(p.come);
      }
      /* il grafico nel palco: scala dei ΔG°′ e conto di ATP, NADH, FADH₂… */
      var TV = tela(S.box);
      function grafico(k, u) {
        TV.misura(S.ren, 0.25, 128); var q = TV.q, W = TV.W, H = TV.H; TV.fondo();
        var conDG = via.passi.some(function (p) { return p.dG != null; }), meta = conDG ? W * 0.56 : 0, x0 = 30, y0 = 18, y1 = H - 14;
        if (conDG) {
          var cum = [0], lo = 0, hi = 0; via.passi.forEach(function (p) { var v = cum[cum.length - 1] + (p.dG || 0) * p.volte; cum.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); });
          var x1 = meta - 8, X = function (i) { return x0 + i / N * (x1 - x0); }, Yv = function (v) { return y1 - (v - lo) / ((hi - lo) || 1) * (y1 - y0); };
          q.font = '600 9px system-ui,sans-serif'; q.fillStyle = '#c5f6fa'; q.fillText(t('Σ ΔG°′ dei passi (kJ/mol)', 'Σ step ΔG°′ (kJ/mol)'), 6, 11);
          q.strokeStyle = 'rgba(140,160,190,.3)'; q.setLineDash([2, 4]); q.beginPath(); q.moveTo(x0, Yv(0)); q.lineTo(x1, Yv(0)); q.stroke(); q.setLineDash([]);
          for (var i = 0; i < N; i++) { var a = cum[i], b = cum[i + 1], cur = i === k; q.strokeStyle = cur ? '#fff' : i < k ? (via.passi[i].dG < 0 ? '#51cf66' : '#ff8787') : 'rgba(160,175,200,.45)'; q.lineWidth = cur ? 3 : 2; q.beginPath(); q.moveTo(X(i), Yv(a)); q.lineTo(X(i + 0.5), Yv(a)); q.lineTo(X(i + 0.5), Yv(b)); q.lineTo(X(i + 1), Yv(b)); q.stroke(); }
          q.lineWidth = 1; var xp = X(k + Math.min(1, u)); q.fillStyle = '#fff'; q.beginPath(); q.arc(xp, Yv(cum[k] + (cum[k + 1] - cum[k]) * ss((u - 0.3) / 0.45)), 3.5, 0, 2 * PI); q.fill();
          q.fillStyle = 'rgba(200,214,232,.85)'; q.font = '500 8px ui-monospace,Menlo,monospace'; q.fillText(fmt(cum[N], 0), x1 - 22, Yv(cum[N]) - 4);
        }
        /* il conto fino a qui (un passo conta quando i gettoni sono usciti) */
        var c = B().conto(via, u > 0.75 ? k : k - 1), voci = B().CONTA.filter(function (x) { return via.passi.some(function (p) { return p.in.concat(p.out).some(function (s0) { var tk = B().gettone(s0).s; return tk === x || (x === 'CO₂' && tk === 'HCO₃⁻'); }); }); });
        var bx0 = meta + 8, bw = (W - bx0 - 8) / Math.max(1, voci.length), mx = 4; voci.forEach(function (v) { mx = Math.max(mx, Math.abs(B().conto(via)[v]) + 1, Math.abs(c[v])); });
        q.font = '600 9px system-ui,sans-serif'; q.fillStyle = '#c5f6fa'; q.fillText(t('il conto fin qui', 'running tally'), bx0, 11);
        var ym = (y0 + y1) / 2 + 4; q.strokeStyle = 'rgba(140,160,190,.3)'; q.beginPath(); q.moveTo(bx0, ym); q.lineTo(W - 8, ym); q.stroke();
        voci.forEach(function (v, i) { var val = c[v], h = val / mx * (y1 - y0) / 2, x = bx0 + i * bw + bw * 0.2; q.fillStyle = COL_GET[v] || '#fff'; q.fillRect(x, val >= 0 ? ym - h : ym, bw * 0.6, Math.abs(h)); q.font = '700 9px ui-monospace,Menlo,monospace'; q.fillText((val > 0 ? '+' : '') + val, x, val >= 0 ? ym - h - 3 : ym + Math.abs(h) + 9); q.font = '600 8px system-ui,sans-serif'; q.fillStyle = 'rgba(220,230,245,.9)'; q.fillText(v, x - 2, H - 3); });
        TV.cv.setAttribute('aria-label', t('Conto della via: ', 'Pathway tally: ') + voci.map(function (v) { return v + ' ' + c[v]; }).join(', '));
        api.conto = c;
      }
      var x = Math.max(0, Math.min(N, opz.x || 0)), gioca = !MENO_MOTO && opz.gioca !== false, vel = 1, ultimoK = -1, ultimoUI = -1;
      function bott(tx, f, aria) { var b = F.el('button', { type: 'button', testo: tx, 'aria-label': aria || tx, onclick: function () { f(b); S.avvia(); } }); com.appendChild(b); return b; }
      var bP = bott('⏸', function () { if (x >= N - 1e-3) x = 0; gioca = !gioca; segna(); }, t('Riproduci o metti in pausa', 'Play or pause'));
      bott('↺', function () { x = 0; gioca = !MENO_MOTO; segna(); }, t('Ricomincia', 'Restart'));
      bott('⏮', function () { var k = Math.floor(Math.min(x, N - 1e-6)); x = x - k > 0.05 ? k : Math.max(0, k - 1); gioca = false; segna(); }, t('Passo precedente', 'Previous step'));
      bott('⏭', function () { x = Math.min(N, Math.floor(x + 1e-6) + 1); gioca = false; segna(); }, t('Passo successivo', 'Next step'));
      var selV = F.el('select', { 'aria-label': t('Velocità', 'Speed') }); [0.5, 1, 2].forEach(function (v) { var o = F.el('option', { value: String(v), testo: v + '×' }); if (v === 1) o.selected = true; selV.appendChild(o); }); selV.addEventListener('change', function () { vel = +selV.value; }); com.appendChild(F.el('label', {}, [F.el('span', { testo: t('Velocità', 'Speed') }), selV]));
      if (opz.alCapitolo) bott('🎓 ' + t('Teoria del capitolo ', 'Chapter theory ') + via.cap, function () { opz.alCapitolo(via.cap); });
      if (via.sezione && typeof g.goSection === 'function') bott('↗ ' + t('Sezione classica', 'Classic section'), function () { g.goSection(via.sezione); });
      function segna() { bP.textContent = gioca ? '⏸' : '▶'; bP.setAttribute('aria-pressed', String(gioca)); }
      segna();
      barra.addEventListener('input', function () { x = +barra.value; gioca = false; segna(); S.avvia(); });
      S.ogniFotogramma(function (dt) {
        if (!vivo) return false; if (D.hidden) return true;
        if (gioca) { x += Math.min(0.1, dt) * vel / 4.5; if (x >= N) { x = N; gioca = false; segna(); } }
        var r = imposta(x);
        var kU = Math.round(x * 50); if (kU !== ultimoUI) { ultimoUI = kU; barra.value = String(x); grafico(r.k, r.u); if (r.k !== ultimoK) { ultimoK = r.k; ispettore(r.k, r.u); } api.ultimo = { x: x, passo: r.k, u: r.u }; }
        return true;
      });
      F.alRidimensiona(function () { S.adatta(); TV.W = 0; });
      api.pronto = true; api.S = S; api.vai = function (v) { x = v; S.avvia(); }; api.gioca = function (v) { gioca = v; segna(); S.avvia(); }; api.attuale = function () { return att; };
      imposta(x); S.avvia();
    }).catch(function (e) { palco.textContent = '⚠ ' + e.message; });
    return api;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     🎓 4 · TEORIA D'ESAME
     ═══════════════════════════════════════════════════════════════════════ */
  function parla(testo) {
    try { if (g.BSISpectraVoce && g.BSISpectraVoce.parla) { g.BSISpectraVoce.parla(testo); return true; } } catch (e) { }
    try { if (g.speechSynthesis && g.SpeechSynthesisUtterance) { g.speechSynthesis.cancel(); var u = new g.SpeechSynthesisUtterance(testo); u.lang = t('it-IT', 'en-GB'); g.speechSynthesis.speak(u); return true; } } catch (e) { }
    return false;
  }
  function schedaTeoria(div, vai) {
    stile();
    var scelte = F.el('div', { 'class': 'bsiBL-scelte', role: 'group', 'aria-label': t('Capitoli', 'Chapters') }), corpo = F.el('div'), tasti = [];
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('I 12 capitoli della tua dispensa d\'esame. Per ogni capitolo: l\'idea in tre righe, i punti da sapere, i «perché», gli errori da non dire, le domande del professore (tocca per la risposta) e la risposta da dare all\'orale, che Spectra può leggerti ad alta voce.', 'The 12 chapters of your exam notes. For each chapter: the idea in three lines, the points to know, the «whys», the mistakes not to say, the professor\'s questions (tap for the answer) and the oral answer, which Spectra can read aloud.') }));
    div.appendChild(scelte); div.appendChild(corpo);
    function apri(n) {
      var C = B().CAPITOLI.filter(function (c) { return c.n === n; })[0] || B().CAPITOLI[0]; tasti.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i + 1 === C.n)); });
      corpo.textContent = '';
      var testa = F.el('div', { 'class': 'bsiBL-box', html: '<h4>' + C.n + ' · ' + F.tt(C.titolo) + (F.tt(C.badge) ? ' <span class="bsiBL-chip o">' + F.tt(C.badge) + '</span>' : '') + '</h4>' + F.tt(C.sintesi) });
      corpo.appendChild(testa);
      var az = F.el('div', { 'class': 'bsiBL-com' }); testa.appendChild(az);
      (C.lab || []).forEach(function (l) {
        var et = { enzimi: t('🧪 Prova nel laboratorio degli enzimi', '🧪 Try it in the enzyme lab'), atp: t('⚙️ Apri l\'ATP sintasi e l\'ossigrafo', '⚙️ Open ATP synthase and the oxygraph'), quiz: t('❓ Vai al quiz', '❓ Go to the quiz'), teoria: '' }[l];
        if (l !== 'vie' && et) az.appendChild(F.el('button', { type: 'button', 'class': 'bsiBL-btn', testo: et, onclick: function () { if (l === 'quiz') quizBox.scrollIntoView({ behavior: 'smooth', block: 'start' }); else vai(l); } }));
        if (B().perVia(l)) az.appendChild(F.el('button', { type: 'button', 'class': 'bsiBL-btn', testo: '🗺️ ' + t('Guarda la via in 3D: ', 'See the pathway in 3D: ') + F.tt(B().perVia(l).nome), onclick: function () { vai('vie', l); } }));
      });
      if (C.sezione && typeof g.goSection === 'function') az.appendChild(F.el('button', { type: 'button', 'class': 'bsiBL-btn', testo: '↗ ' + t('Sezione dell\'app', 'App section'), onclick: function () { g.goSection(C.sezione); } }));
      if (C.punti.length) corpo.appendChild(F.el('div', { 'class': 'bsiBL-box', html: '<b>' + t('Da sapere', 'Know this') + '</b><ul style="margin:4px 0 0;padding-left:18px">' + C.punti.map(function (p) { return '<li>' + F.tt(p) + '</li>'; }).join('') + '</ul>' }));
      C.perche.forEach(function (p) { corpo.appendChild(F.el('div', { 'class': 'bsiBL-box bsiBL-perche', html: '<b>' + t('PERCHÉ?', 'WHY?') + '</b><br>' + F.tt(p) })); });
      if (C.nonDire.length) corpo.appendChild(F.el('div', { 'class': 'bsiBL-box bsiBL-no', html: '<b>' + t('NON DIRE (errori già fatti davanti al professore)', 'DON\'T SAY (mistakes already made in front of the professor)') + '</b>' + C.nonDire.map(function (p) { return '<div>❌ ' + F.tt(p) + '</div>'; }).join('') }));
      if (C.domande.length) { var dd = F.el('div', { 'class': 'bsiBL-box', html: '<b>' + t('DOMANDE DEL PROFESSORE', 'THE PROFESSOR\'S QUESTIONS') + '</b>' }); C.domande.forEach(function (q) { var r = F.el('div', { testo: '→ ' + F.tt(q.a) }); r.hidden = true; var b = F.el('button', { type: 'button', 'aria-expanded': 'false', testo: '❓ ' + F.tt(q.q), onclick: function () { r.hidden = !r.hidden; b.setAttribute('aria-expanded', String(!r.hidden)); } }); dd.appendChild(F.el('div', { 'class': 'bsiBL-dom' }, [b, r])); }); corpo.appendChild(dd); }
      var or = F.el('div', { 'class': 'bsiBL-box bsiBL-orale', html: '<b>' + t('LA RISPOSTA DA DARE ALL\'ORALE', 'THE ANSWER TO GIVE AT THE ORAL') + '</b><div style="margin:4px 0">«' + F.tt(C.orale) + '»</div>' });
      or.appendChild(F.el('button', { type: 'button', 'class': 'bsiBL-btn', testo: t('🔊 Spectra la legge', '🔊 Spectra reads it'), onclick: function () { parla(F.tt(C.orale)); } }));
      corpo.appendChild(or);
      div._capitolo = C.n;
    }
    B().CAPITOLI.forEach(function (C) { var b = F.el('button', { type: 'button', 'aria-pressed': 'false', testo: C.n + ' · ' + F.tt(C.titolo).split(/[:(,]/)[0], onclick: function () { apri(C.n); } }); tasti.push(b); scelte.appendChild(b); });
    /* i conti degli ATP */
    var conti = F.el('div', { 'class': 'bsiBL-box' }); div.appendChild(conti);
    conti.innerHTML = '<h4>🧮 ' + t('I conti degli ATP', 'The ATP sums') + '</h4>';
    var nIn = F.el('input', { type: 'number', min: '4', max: '26', step: '2', value: '8', 'aria-label': t('Carboni dell\'acido grasso', 'Fatty acid carbons'), style: 'width:70px;min-height:36px' }), outAG = F.el('div', { 'aria-live': 'polite' });
    var selN = F.el('select', { 'aria-label': t('Navetta', 'Shuttle') }); [['ma', t('malato–aspartato (fegato, cuore)', 'malate–aspartate (liver, heart)')], ['g3p', t('glicerolo-3-P (muscolo, cervello)', 'glycerol 3-P (muscle, brain)')]].forEach(function (x) { selN.appendChild(F.el('option', { value: x[0], testo: x[1] })); }); var outG = F.el('div', { 'aria-live': 'polite' });
    function calcola() { var n = Math.max(4, Math.min(26, 2 * Math.round((+nIn.value || 8) / 2))), r = B().atpAcidoGrasso(n); outAG.innerHTML = 'C' + n + ': ' + r.giri + t(' giri, ', ' turns, ') + r.acetilCoA + ' acetil-CoA → ' + r.giri + ' × 4 = ' + r.daGiri + ' + ' + r.acetilCoA + ' × 10 = ' + r.daKrebs + ' − 2 = <b>' + r.totale + ' ATP</b>';
      var gl = B().atpGlucosio(selN.value); outG.innerHTML = t('glicolisi ', 'glycolysis ') + fmt(gl.glicolisi, 0) + ' + PDH ' + fmt(gl.pdh, 0) + ' + Krebs ' + fmt(gl.krebs, 0) + ' = <b>' + fmt(gl.totale, 0) + ' ATP</b>'; }
    nIn.addEventListener('input', calcola); selN.addEventListener('change', calcola);
    conti.appendChild(F.el('div', { 'class': 'bsiBL-com' }, [F.el('label', {}, [F.el('span', { testo: t('Acido grasso saturo pari: C', 'Even saturated fatty acid: C') }), nIn])])); conti.appendChild(outAG);
    conti.appendChild(F.el('div', { 'class': 'bsiBL-com' }, [F.el('label', {}, [F.el('span', { testo: t('Glucosio, navetta', 'Glucose, shuttle') }), selN])])); conti.appendChild(outG);
    calcola();
    /* il quiz sugli enzimi regolati (capitolo 12) */
    var quizBox = F.el('div', { 'class': 'bsiBL-box bsiBL-quiz' }), punti = { ok: 0, tot: 0 }; div.appendChild(quizBox);
    function domanda() {
      var R = B().REGOLATI, righe = R.filter(function (r) { return r[2] !== '—' || r[3] !== '—'; }), r = righe[Math.floor(Math.random() * righe.length)], chiedi = r[2] === '—' ? 3 : r[3] === '—' ? 2 : (Math.random() < 0.5 ? 2 : 3);
      var giusta = r[chiedi], altre = R.filter(function (x) { return x !== r && x[chiedi] !== '—' && x[chiedi] !== giusta; }).map(function (x) { return x[chiedi]; }), op = [giusta];
      while (op.length < 4 && altre.length) { var i = Math.floor(Math.random() * altre.length); if (op.indexOf(altre[i]) < 0) op.push(altre[i]); altre.splice(i, 1); }
      op.sort(function () { return Math.random() - 0.5; });
      quizBox.innerHTML = '<h4>❓ ' + t('Quiz: gli enzimi regolati', 'Quiz: the regulated enzymes') + ' <span class="bsiBL-chip">' + punti.ok + '/' + punti.tot + '</span></h4><div>' + r[0] + ' · <b>' + r[1] + '</b>: ' + (chiedi === 2 ? t('chi la ATTIVA?', 'what ACTIVATES it?') : t('chi la INIBISCE?', 'what INHIBITS it?')) + '</div>';
      var bx = F.el('div', { 'class': 'bsiBL-com' }); quizBox.appendChild(bx);
      op.forEach(function (o) { var b = F.el('button', { type: 'button', testo: o, onclick: function () { if (bx.dataset.fatto) return; bx.dataset.fatto = '1'; punti.tot++; if (o === giusta) { punti.ok++; b.classList.add('ok'); } else { b.classList.add('ko'); [].forEach.call(bx.children, function (c) { if (c.textContent === giusta) c.classList.add('ok'); }); } quizBox.querySelector('.bsiBL-chip').textContent = punti.ok + '/' + punti.tot; bx.appendChild(F.el('button', { type: 'button', 'class': 'bsiBL-btn', testo: t('Avanti →', 'Next →'), onclick: domanda })); } }); bx.appendChild(b); });
    }
    domanda();
    div._apri = apri; apri(1);
  }

  /* ═══ la sezione ═══════════════════════════════════════════════════════ */
  var SCHEDE = ['atp', 'enzimi', 'vie', 'teoria'];
  function vaiA(scheda, arg) {
    var sec = D.getElementById('sbiolab3d'); if (!sec) return;
    var k = SCHEDE.indexOf(scheda); if (k < 0) k = 0; var bar = sec.querySelector('.bsiFX-schede'); if (bar && bar.children[k]) bar.children[k].click();
    setTimeout(function () {
      var pan = sec.querySelectorAll('[role="tabpanel"]'), d = [].filter.call(pan, function (p) { return p.style.display !== 'none' && p._apri; })[0];
      if (d && arg != null) d._apri(arg); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }
  F.sezione('sbiolab3d', {
    titolo: ['🧬 Biochimica 3D Lab', '🧬 Biochemistry 3D Lab'],
    sotto: ['Il laboratorio dell\'esame di biochimica: l\'ATP sintasi che gira con l\'ossigrafo, gli enzimi che si chiudono sul substrato con Michaelis–Menten e gli inibitori, otto vie metaboliche con ogni carbonio seguito passo per passo, e i 12 capitoli della dispensa con le risposte da dare all\'orale.', 'The biochemistry exam lab: ATP synthase spinning with the oxygraph, enzymes closing on the substrate with Michaelis–Menten and inhibitors, eight metabolic pathways with every carbon followed step by step, and the 12 chapters of the notes with the answers to give at the oral.'],
    schede: [
      { nome: ['⚙️ ATP sintasi', '⚙️ ATP synthase'], costruisci: function (div) { div._bl = creaATP(div); div._apri = function () { }; } },
      { nome: ['🧪 Enzimi', '🧪 Enzymes'], costruisci: function (div) { var palco = F.el('div'); div.appendChild(palco); div._bl = creaEnzimi(palco); div._apri = function (id) { if (div._bl && div._bl.imposta) div._bl.imposta({ enzima: id }); }; } },
      { nome: ['🗺️ Vie e carboni', '🗺️ Pathways and carbons'], costruisci: function (div) {
        var scelte = F.el('div', { 'class': 'bsiBL-scelte', role: 'group', 'aria-label': t('Vie metaboliche', 'Metabolic pathways') }), palco = F.el('div'), tasti = {};
        div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Scegli una via: ▶ la fa scorrere, la barra la ferma dove vuoi, ⏮ ⏭ saltano da un passo all\'altro, il dito ruota la scena. Ogni carbonio ha il suo colore dall\'inizio alla fine: segui dove va.', 'Pick a pathway: ▶ plays it, the bar stops it anywhere, ⏮ ⏭ jump between steps, your finger rotates the scene. Every carbon keeps its colour from start to end: follow where it goes.') }));
        div.appendChild(scelte); div.appendChild(palco);
        function apri(id) { Object.keys(tasti).forEach(function (k) { tasti[k].setAttribute('aria-pressed', String(k === id)); }); div._bl = creaVia(palco, id, { alCapitolo: function (n) { vaiA('teoria', n); } }); return div._bl; }
        B().VIE.forEach(function (v) { var b = F.el('button', { type: 'button', 'aria-pressed': 'false', testo: F.tt(v.nome).split(' (')[0], onclick: function () { apri(v.id); } }); tasti[v.id] = b; scelte.appendChild(b); });
        div._apri = apri; apri('glicolisi');
      } },
      { nome: ['🎓 Teoria d\'esame', '🎓 Exam theory'], costruisci: function (div) { schedaTeoria(div, vaiA); } }
    ]
  });

  g.BSIBioLab3D = { creaATP: creaATP, creaEnzimi: creaEnzimi, creaVia: creaVia, disponi: disponi, legami: legami, SCHEDE: SCHEDE, COL_C: COL_C,
    apri: function (scheda, arg) { if (typeof g.goSection === 'function') g.goSection('sbiolab3d'); setTimeout(function () { vaiA(scheda, arg); }, 400); } };

  /* ═══ lo strumento per Spectra ═════════════════════════════════════════ */
  var STRUMENTO = { name: 'biochimica_3d',
    description: 'Apre il «Biochimica 3D Lab» di BioSpecInfo. Schede: atp (ATP sintasi che gira, con l\'ossigrafo: ADP, oligomicina, disaccoppiante, cianuro), enzimi (Michaelis–Menten, inibitori, allosteria, Lineweaver–Burk), vie (una via metabolica in 3D con i carboni seguiti passo per passo: glicolisi, pdh, krebs, beta, gluconeo, sintesiag, urea), teoria (i 12 capitoli della dispensa d\'esame con la risposta da dare all\'orale; capitolo 1–12). Usalo SOLO quando l\'utente chiede di vedere o ripassare uno di questi argomenti.',
    parameters: { type: 'object', properties: { scheda: { type: 'string', enum: SCHEDE }, via: { type: 'string', enum: ['glicolisi', 'pdh', 'krebs', 'beta', 'gluconeo', 'sintesiag', 'urea'] }, capitolo: { type: 'integer', minimum: 1, maximum: 12 } }, required: ['scheda'] },
    execute: function (a) {
      a = a || {}; if (SCHEDE.indexOf(a.scheda) < 0) return Promise.resolve({ ok: false, error: 'scheda sconosciuta' });
      var arg = a.scheda === 'vie' ? (B().perVia(a.via) ? a.via : 'glicolisi') : a.scheda === 'teoria' ? Math.max(1, Math.min(12, +a.capitolo || 1)) : null;
      g.BSIBioLab3D.apri(a.scheda, arg);
      var r = { ok: true, aperto: a.scheda };
      if (a.scheda === 'vie') { var v = B().perVia(arg); r.via = F.tt(v.nome); r.bilancio = F.tt(v.bilancio); }
      if (a.scheda === 'teoria') { var C = B().CAPITOLI[arg - 1]; r.capitolo = F.tt(C.titolo); r.rispostaOrale = F.tt(C.orale); }
      return Promise.resolve(r);
    } };
  function registra() { var Ts = g.BSI_AI_TOOLS; if (!Ts || !Ts.push) return false; if (!Ts.some(function (x) { return x.name === STRUMENTO.name; })) Ts.push(STRUMENTO); return true; }
  if (!registra()) { var k = 0, ti = setInterval(function () { if (registra() || ++k > 40) clearInterval(ti); }, 500); }
})(typeof window !== 'undefined' ? window : globalThis);
