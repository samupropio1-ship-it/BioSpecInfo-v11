/* ═══════════════════════════════════════════════════════════════════════════
   bsi-lab3d.js — 🧊 Laboratorio 3D
   BioSpecInfo · © Samuele Pio Provenzano

   Le cose che sulla carta sono tridimensionali e che un disegno piatto
   tradisce, viste davvero in tre dimensioni, ruotabili con il dito o con
   il mouse:

   · SUPERFICI z = f(x, y) colorate per quota, con le curve di livello
     proiettate sul piano e i punti critici (massimi, minimi, selle) trovati
     dal motore simbolico;
   · ORBITALI ATOMICI dell'atomo idrogenoide: la nuvola |ψ|² campionata
     esattamente (parte radiale con i polinomi di Laguerre, parte angolare con
     le armoniche sferiche reali), colorata per segno della funzione d'onda,
     con il taglio a metà per vedere i nodi radiali;
   · MOTI NELLO SPAZIO: l'elica di una carica in un campo magnetico,
     l'orbita di Keplero inclinata percorsa con la legge delle aree,
     l'attrattore di Lorenz con due traiettorie che partono vicine e si
     separano (il caos), una curva parametrica scritta dall'utente;
   · STRUTTURE CRISTALLINE reali (NaCl, CsCl, diamante, blenda, fluorite,
     perovskite, metalli cubici ed esagonale compatto) con la cella, il
     contenuto della cella, il numero di coordinazione, la frazione di
     impacchettamento e un piano di Miller (h k l) qualsiasi;
   · CAMPI: le linee del campo elettrico di cariche puntiformi e del campo
     magnetico di una spira, integrate passo per passo.

   Il motore (Scena) e' comune a tutte le schede: three.js caricato al
   primo uso, rotazione e zoom con mouse, rotellina, un dito o due dita,
   rotazione automatica, foto PNG, schermo intero; la scena si ferma quando
   non e' visibile, cosi' non consuma batteria.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, D = globale.document;

  /* ── three.js al primo uso ─────────────────────────────────────────────── */
  var attesaThree = null;
  function caricaThree() {
    if (globale.THREE) return Promise.resolve(globale.THREE);
    if (attesaThree) return attesaThree;
    attesaThree = new Promise(function (ok, ko) {
      var s = D.createElement('script'); s.src = './three.min.js';
      s.onload = function () { globale.THREE ? ok(globale.THREE) : ko(new Error('three.js')); };
      s.onerror = function () { attesaThree = null; ko(new Error(t('three.js non caricato', 'three.js not loaded'))); };
      D.head.appendChild(s);
    });
    return attesaThree;
  }

  /* ── la scena ──────────────────────────────────────────────────────────── */
  var scene = [];
  function Scena(padre, rapporto) {
    var self = this, T = globale.THREE;
    this.T = T;
    var box = F.el('div', { 'class': 'bsi3d-box' }); padre.appendChild(box); this.box = box;
    var ren = new T.WebGLRenderer({ antialias: true, alpha: false });
    ren.setPixelRatio(Math.min(2, globale.devicePixelRatio || 1));
    ren.setClearColor(0x081522, 1);
    box.appendChild(ren.domElement);
    ren.domElement.className = 'bsi3d-tela';
    ren.domElement.setAttribute('role', 'img');
    this.ren = ren; this.rapporto = rapporto || 0.66;
    var sc = new T.Scene(); this.sc = sc;
    sc.add(new T.HemisphereLight(0xdfefff, 0x1a2233, 0.75));
    var d1 = new T.DirectionalLight(0xffffff, 0.75); d1.position.set(4, 6, 8); sc.add(d1);
    var d2 = new T.DirectionalLight(0x88aaff, 0.3); d2.position.set(-6, -3, -4); sc.add(d2);
    this.radice = new T.Group(); sc.add(this.radice);
    this.cam = new T.PerspectiveCamera(42, 1.5, 0.01, 2000);
    this.vista = { r: 10, th: 0.8, ph: 1.05, bersaglio: new T.Vector3(0, 0, 0) };
    this.vistaIniziale = null;
    this.gira = false; this.fotogrammi = []; this.sporca = true; this.attiva = false;
    /* comandi */
    var barra = F.el('div', { 'class': 'bsi3d-barra', role: 'toolbar', 'aria-label': t('Comandi della vista 3D', '3D view controls') });
    function tasto(ic, nome, f) { var b = F.el('button', { type: 'button', testo: ic, title: nome, 'aria-label': nome, onclick: function (e) { e.stopPropagation(); f(b); } }); barra.appendChild(b); return b; }
    var bg = tasto('⟳', t('Rotazione automatica', 'Auto-rotate'), function (b) { self.gira = !self.gira; b.setAttribute('aria-pressed', String(self.gira)); self.avvia(); });
    bg.setAttribute('aria-pressed', 'false');
    tasto('⌖', t('Vista iniziale', 'Reset view'), function () { if (self.vistaIniziale) { var v = self.vistaIniziale; self.vista.r = v.r; self.vista.th = v.th; self.vista.ph = v.ph; } self.sporca = true; self.avvia(); });
    tasto('📷', t('Salva immagine PNG', 'Save PNG image'), function () { self.disegna(); var a = D.createElement('a'); a.href = ren.domElement.toDataURL('image/png'); a.download = 'laboratorio-3d.png'; D.body.appendChild(a); a.click(); a.remove(); });
    tasto('⛶', t('Schermo intero', 'Full screen'), function () { var fs = D.fullscreenElement || D.webkitFullscreenElement; try { if (fs) (D.exitFullscreen || D.webkitExitFullscreen).call(D); else (box.requestFullscreen || box.webkitRequestFullscreen).call(box); } catch (e) { } setTimeout(function () { self.adatta(); }, 250); });
    box.appendChild(barra);
    this.didascalia = F.el('div', { 'class': 'bsi3d-dida' }); box.appendChild(this.didascalia);
    /* rotazione e zoom: mouse, rotellina, un dito, due dita */
    var punti = {}, el = ren.domElement;
    el.addEventListener('pointerdown', function (e) { punti[e.pointerId] = { x: e.clientX, y: e.clientY }; try { el.setPointerCapture(e.pointerId); } catch (er) { } self.avvia(); });
    el.addEventListener('pointermove', function (e) {
      var p = punti[e.pointerId]; if (!p) return;
      var ids = Object.keys(punti);
      if (ids.length === 1) { self.vista.th -= (e.clientX - p.x) * 0.008; self.vista.ph = Math.max(0.05, Math.min(Math.PI - 0.05, self.vista.ph - (e.clientY - p.y) * 0.008)); }
      else if (ids.length === 2) { var o = punti[ids[0] == e.pointerId ? ids[1] : ids[0]], d0 = Math.hypot(p.x - o.x, p.y - o.y), d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y); if (d0 > 0 && d1 > 0) self.vista.r = Math.max(0.5, Math.min(500, self.vista.r * d0 / d1)); }
      p.x = e.clientX; p.y = e.clientY; self.sporca = true; self.avvia();
    });
    function fine(e) { delete punti[e.pointerId]; }
    el.addEventListener('pointerup', fine); el.addEventListener('pointercancel', fine);
    el.addEventListener('wheel', function (e) { e.preventDefault(); self.vista.r = Math.max(0.5, Math.min(500, self.vista.r * Math.exp(e.deltaY * 0.0012))); self.sporca = true; self.avvia(); }, { passive: false });
    this.adatta();
    F.alRidimensiona(function () { self.adatta(); });
    if (globale.IntersectionObserver) { new IntersectionObserver(function (v) { self.visibile = v[0].isIntersecting; if (self.visibile) { self.sporca = true; self.avvia(); } }).observe(box); }
    else this.visibile = true;
    scene.push(this);
  }
  Scena.prototype.adatta = function () {
    var fs = D.fullscreenElement === this.box;
    var w = Math.max(260, this.box.clientWidth || 600), h = fs ? (globale.innerHeight || 700) : Math.round(Math.min(w * this.rapporto, (globale.innerHeight || 900) * 0.7));
    this.ren.setSize(w, h, true); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.sporca = true; this.avvia();
  };
  Scena.prototype.inquadra = function (r, th, ph) { this.vista.r = r; if (th != null) this.vista.th = th; if (ph != null) this.vista.ph = ph; this.vistaIniziale = { r: this.vista.r, th: this.vista.th, ph: this.vista.ph }; this.sporca = true; this.avvia(); };
  Scena.prototype.pulisci = function () {
    var R = this.radice;
    while (R.children.length) { var o = R.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) { (Array.isArray(x.material) ? x.material : [x.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); } }); }
    this.fotogrammi = []; this.sporca = true;
  };
  Scena.prototype.aggiungi = function (o) { this.radice.add(o); this.sporca = true; this.avvia(); return o; };
  Scena.prototype.ogniFotogramma = function (f) { this.fotogrammi.push(f); this.avvia(); };
  Scena.prototype.disegna = function () {
    var v = this.vista, c = this.cam;
    c.position.set(v.bersaglio.x + v.r * Math.sin(v.ph) * Math.cos(v.th), v.bersaglio.y + v.r * Math.sin(v.ph) * Math.sin(v.th), v.bersaglio.z + v.r * Math.cos(v.ph));
    c.up.set(0, 0, 1); c.lookAt(v.bersaglio);
    this.ren.render(this.sc, c); this.sporca = false;
    var et = this.didascalia.textContent || t('Vista 3D interattiva', 'Interactive 3D view');
    if (this._et !== et) { this._et = et; this.ren.domElement.setAttribute('aria-label', et); }
  };
  Scena.prototype.avvia = function () {
    if (this.attiva) return;
    var self = this; this.attiva = true;
    var prec = 0;
    (function giro(ora) {
      if (!self.box.isConnected || self.box.offsetParent === null || self.visibile === false) { self.attiva = false; return; }
      var dt = prec ? Math.min(0.05, (ora - prec) / 1000) : 0.016; prec = ora;
      if (self.gira) { self.vista.th += dt * 0.5; self.sporca = true; }
      var vivi = 0;
      for (var i = 0; i < self.fotogrammi.length; i++) { if (self.fotogrammi[i](dt) !== false) { self.sporca = true; vivi++; } }
      if (self.sporca) self.disegna();
      /* niente da muovere: il ciclo si ferma e ripartira' al primo gesto */
      if (!self.gira && !vivi) { self.attiva = false; return; }
      globale.requestAnimationFrame(giro);
    })(0);
  };
  /* per i banchi: quanti pixel non sono sfondo, letti subito dopo il disegno */
  Scena.prototype.campiona = function () {
    this.disegna();
    var g = this.ren.getContext(), w = g.drawingBufferWidth, h = g.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, px);
    var n = 0; for (var i = 0; i < px.length; i += 4 * 7) if (Math.abs(px[i] - 8) + Math.abs(px[i + 1] - 21) + Math.abs(px[i + 2] - 34) > 30) n++;
    return n;
  };

  /* ── pezzi comuni ──────────────────────────────────────────────────────── */
  function testo3d(T, s, col, alt) {
    var c = D.createElement('canvas'), q = c.getContext('2d'), px = 48;
    q.font = 'bold ' + px + 'px system-ui,sans-serif'; var w = Math.ceil(q.measureText(s).width) + 16;
    c.width = w; c.height = px + 16; q.font = 'bold ' + px + 'px system-ui,sans-serif'; q.fillStyle = col || '#cfe3f7'; q.textBaseline = 'middle'; q.fillText(s, 8, c.height / 2);
    var tx = new T.CanvasTexture(c); tx.minFilter = T.LinearFilter;
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true }));
    var h = alt || 0.4; sp.scale.set(h * w / c.height, h, 1); sp.renderOrder = 10;
    return sp;
  }
  function assi(T, L, nomi, alt) {
    var g = new T.Group(), cols = [0xff6b6b, 0x5eead4, 0x6bcfff];
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (d, i) {
      var geo = new T.BufferGeometry().setFromPoints([new T.Vector3(-d[0] * L, -d[1] * L, -d[2] * L), new T.Vector3(d[0] * L, d[1] * L, d[2] * L)]);
      g.add(new T.Line(geo, new T.LineBasicMaterial({ color: cols[i], transparent: true, opacity: 0.55 })));
      var et = testo3d(T, (nomi || ['x', 'y', 'z'])[i], '#' + cols[i].toString(16).padStart(6, '0'), alt);
      et.position.set(d[0] * L * 1.08, d[1] * L * 1.08, d[2] * L * 1.08); g.add(et);
    });
    return g;
  }
  function linea(T, pts, col, opac) {
    var geo = new T.BufferGeometry().setFromPoints(pts.map(function (p) { return p.isVector3 ? p : new T.Vector3(p[0], p[1], p[2]); }));
    return new T.Line(geo, new T.LineBasicMaterial({ color: col, transparent: opac != null, opacity: opac == null ? 1 : opac }));
  }
  function sfera(T, r, col, x, y, z, emiss) {
    var m = new T.Mesh(new T.SphereGeometry(r, 28, 18), new T.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.1, emissive: emiss ? col : 0x000000, emissiveIntensity: emiss ? 0.35 : 0 }));
    m.position.set(x || 0, y || 0, z || 0); return m;
  }
  function freccia(T, da, a, col, testa) {
    var dir = new T.Vector3(a[0] - da[0], a[1] - da[1], a[2] - da[2]), L = dir.length();
    return new T.ArrowHelper(dir.normalize(), new T.Vector3(da[0], da[1], da[2]), L, col, (testa || 0.18) * Math.min(1, L * 3), (testa || 0.18) * 0.6 * Math.min(1, L * 3));
  }
  /* una scala di colori percettiva (simile a viridis) */
  var VIRIDIS = [[0.267, 0.005, 0.329], [0.283, 0.141, 0.458], [0.254, 0.265, 0.530], [0.207, 0.372, 0.553], [0.164, 0.471, 0.558], [0.128, 0.567, 0.551], [0.135, 0.659, 0.518], [0.267, 0.749, 0.441], [0.478, 0.821, 0.318], [0.741, 0.873, 0.150], [0.993, 0.906, 0.144]];
  function scala(f) { f = Math.max(0, Math.min(1, f)) * (VIRIDIS.length - 1); var i = Math.min(VIRIDIS.length - 2, Math.floor(f)), u = f - i, a = VIRIDIS[i], b = VIRIDIS[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  function fmt(v) { return F.fmt(v); }

  /* la scheda: pannello dei comandi a sinistra, scena a destra; three.js arriva dopo */
  function scheda(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); destra.appendChild(attesa);
      stile();
      caricaThree().then(function () {
        attesa.remove();
        var S = new Scena(destra);
        costruisci(pan, S, destra);
        div._scena = S;
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function stile() {
    if (D.getElementById('bsi3d-stile')) return;
    var s = D.createElement('style'); s.id = 'bsi3d-stile';
    s.textContent = '.bsi3d-box{position:relative;border:1px solid #1a3050;border-radius:10px;overflow:hidden;background:#081522}' +
      '.bsi3d-tela{display:block;width:100%;touch-action:none;cursor:grab}.bsi3d-tela:active{cursor:grabbing}' +
      '.bsi3d-box:fullscreen{border-radius:0}.bsi3d-box:fullscreen .bsi3d-tela{height:100vh!important}' +
      '.bsi3d-barra{position:absolute;top:6px;right:6px;display:flex;gap:3px}' +
      '.bsi3d-barra button{background:rgba(8,21,34,.88);color:#e6fffb;border:1px solid #2a4a6e;border-radius:7px;min-width:30px;height:28px;font-size:14px;cursor:pointer}' +
      '.bsi3d-barra button[aria-pressed="true"]{border-color:#5eead4;color:#5eead4}' +
      '.bsi3d-dida{position:absolute;left:8px;bottom:6px;right:8px;color:#cfe3f7;font-size:.78rem;text-shadow:0 1px 2px #000;pointer-events:none}' +
      '.bsi3d-leg{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 8px;vertical-align:middle}';
    D.head.appendChild(s);
  }
  function campoTesto(pan, etichetta, valore, cambia) {
    var inp = F.el('input', { type: 'text', value: valore, 'aria-label': F.tt(etichetta), spellcheck: 'false', autocomplete: 'off' });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: F.tt(etichetta) })]), inp]));
    inp.addEventListener('change', function () { cambia(inp.value); });
    return inp;
  }
  function casella(pan, etichetta, valore, cambia) {
    var c = F.el('input', { type: 'checkbox' }); c.checked = !!valore;
    var l = F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.86rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(etichetta) })]);
    c.addEventListener('change', function () { cambia(c.checked); }); pan.appendChild(l); return c;
  }

  /* ═══ 1. Superfici ═══════════════════════════════════════════════════════ */
  var C = globale.BSIMatCAS;
  var SUPERFICI = [['x^2 - y^2', ['sella', 'saddle']], ['x^2 + y^2', ['paraboloide', 'paraboloid']], ['sin(x)*cos(y)', ['onde', 'waves']], ['x*e^(-x^2-y^2)', ['massimo e minimo', 'max and min']], ['x^3 - 3*x*y^2', ['sella di scimmia', 'monkey saddle']], ['(x^2+3*y^2)*e^(1-x^2-y^2)', ['vulcano', 'volcano']], ['sin(sqrt(x^2+y^2))', ['onde circolari', 'ripples']], ['x^4 + y^4 - 4*x*y', ['due minimi e una sella', 'two minima and a saddle']]];
  function curveLivello(Z, N, a, b, livelli) {
    /* quadrati in marcia: per ogni cella e ogni livello i tratti di curva */
    var seg = [];
    function p(i, j) { return [a + (b - a) * i / N, a + (b - a) * j / N]; }
    livelli.forEach(function (L) {
      for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
        var v = [Z[i][j], Z[i + 1][j], Z[i + 1][j + 1], Z[i][j + 1]]; if (v.some(function (x) { return !isFinite(x); })) continue;
        var c = [p(i, j), p(i + 1, j), p(i + 1, j + 1), p(i, j + 1)], tagli = [];
        for (var k = 0; k < 4; k++) { var u = v[k], w = v[(k + 1) % 4]; if ((u - L) * (w - L) < 0) { var f = (L - u) / (w - u), A = c[k], B = c[(k + 1) % 4]; tagli.push([A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]); } }
        if (tagli.length === 2) seg.push(tagli[0], tagli[1]);
        else if (tagli.length === 4) { seg.push(tagli[0], tagli[1], tagli[2], tagli[3]); }
      }
    });
    return seg;
  }
  function superficie(testo, R, N) {
    var e = C.leggi(testo), vs = C.simboli(e).filter(function (v) { return v !== 'x' && v !== 'y'; });
    if (vs.length) throw new Error(t('usa solo x e y (trovato: ', 'use only x and y (found: ') + vs.join(', ') + ')');
    var f = C.compila(e), Z = [], tutti = [];
    for (var i = 0; i <= N; i++) { Z.push([]); for (var j = 0; j <= N; j++) { var x = -R + 2 * R * i / N, y = -R + 2 * R * j / N, z = f({ x: x, y: y }); Z[i].push(isFinite(z) ? z : NaN); if (isFinite(z)) tutti.push(z); } }
    if (!tutti.length) throw new Error(t('la funzione non è definita nel riquadro', 'the function is undefined in the box'));
    tutti.sort(function (a, b) { return a - b; });
    var lo = tutti[Math.floor(tutti.length * 0.01)], hi = tutti[Math.ceil(tutti.length * 0.99) - 1];
    if (!(hi > lo)) { lo -= 1; hi += 1; }
    return { e: e, Z: Z, lo: lo, hi: hi, f: f };
  }
  F.calcolo.lab3d = { superficie: superficie, curveLivello: curveLivello };
  function schedaSuperfici(pan, S) {
    var T = S.T, stato = { testo: 'x^4 + y^4 - 4*x*y', R: 1.5, rete: true, livello: true, critici: true };
    var info = F.el('div', { 'class': 'bsiFX-nota' });
    var inp = campoTesto(pan, ['z = f(x, y)', 'z = f(x, y)'], stato.testo, function (v) { stato.testo = v; disegna(); });
    F.scelta(pan, ['Esempi', 'Examples'], SUPERFICI.map(function (s) { return [s[0], F.tt(s[1]) + ': ' + s[0]]; }), stato.testo, function (v) { stato.testo = v; inp.value = v; disegna(); });
    F.cursore(pan, ['Riquadro ±', 'Box ±'], 0.5, 6, 0.5, stato.R, function (v) { stato.R = v; disegna(); });
    casella(pan, ['Reticolo', 'Wireframe'], stato.rete, function (v) { stato.rete = v; disegna(); });
    casella(pan, ['Curve di livello sul piano', 'Contour lines on the floor'], stato.livello, function (v) { stato.livello = v; disegna(); });
    casella(pan, ['Punti critici', 'Critical points'], stato.critici, function (v) { stato.critici = v; disegna(); });
    pan.appendChild(info);
    function disegna() {
      S.pulisci();
      var N = 72, R = stato.R, s;
      try { s = superficie(stato.testo, R, N); } catch (e) { info.innerHTML = '⚠ ' + e.message; S.campiona(); return; }
      var L = 3, k = 2 * L * 0.55 / (s.hi - s.lo), z0 = (s.hi + s.lo) / 2, sc = L / R;
      var Zs = function (z) { return Math.max(-L * 0.62, Math.min(L * 0.62, (z - z0) * k)); };
      var pos = [], col = [], idx = [];
      for (var i = 0; i <= N; i++) for (var j = 0; j <= N; j++) {
        var x = -L + 2 * L * i / N, y = -L + 2 * L * j / N, z = s.Z[i][j], zz = isFinite(z) ? Zs(z) : 0;
        pos.push(x, y, zz); var c = scala(isFinite(z) ? (z - s.lo) / (s.hi - s.lo) : 0); col.push(c[0], c[1], c[2]);
      }
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
        var a = i * (N + 1) + j, b = (i + 1) * (N + 1) + j;
        if ([s.Z[i][j], s.Z[i + 1][j], s.Z[i + 1][j + 1], s.Z[i][j + 1]].every(isFinite)) idx.push(a, b, b + 1, a, b + 1, a + 1);
      }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      S.aggiungi(new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.55, metalness: 0.05 })));
      if (stato.rete) S.aggiungi(new T.LineSegments(new T.WireframeGeometry(geo), new T.LineBasicMaterial({ color: 0x0b1a2a, transparent: true, opacity: 0.35 })));
      var piano = -L * 0.75;
      if (stato.livello) {
        var livelli = []; for (var q = 1; q < 12; q++) livelli.push(s.lo + (s.hi - s.lo) * q / 12);
        var sg = curveLivello(s.Z, N, -R, R, livelli), pts = [];
        for (q = 0; q < sg.length; q++) pts.push(new T.Vector3(sg[q][0] * sc, sg[q][1] * sc, piano));
        S.aggiungi(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.7 })));
        var cornice = [[-L, -L], [L, -L], [L, L], [-L, L], [-L, -L]].map(function (p) { return [p[0], p[1], piano]; });
        S.aggiungi(linea(T, cornice, 0x34465f));
      }
      var testoInfo = 'z ∈ [' + fmt(s.lo) + ', ' + fmt(s.hi) + ']' + t(' (1°–99° percentile; i valori fuori sono tagliati)', ' (1st–99th percentile; values outside are clipped)');
      if (stato.critici && F.calcolo.multi) {
        try {
          var A = F.calcolo.multi.analizza(stato.testo, [-R, R, -R, R]), COL = { minimo: 0x6bcfff, massimo: 0xff8a80, sella: 0xffd24a, indeciso: 0xc9d3df };
          A.critici.forEach(function (p) { if (!isFinite(p.z)) return; S.aggiungi(sfera(T, 0.09, COL[p.tipo], p.x * sc, p.y * sc, Zs(p.z), true)); S.aggiungi(linea(T, [[p.x * sc, p.y * sc, Zs(p.z)], [p.x * sc, p.y * sc, piano]], COL[p.tipo], 0.5)); });
          testoInfo += '<br>' + (A.critici.length ? A.critici.map(function (p) { return '<span class="bsi3d-leg" style="background:#' + COL[p.tipo].toString(16) + '"></span>' + ({ minimo: t('minimo', 'minimum'), massimo: t('massimo', 'maximum'), sella: t('sella', 'saddle'), indeciso: t('indeciso', 'undecided') })[p.tipo] + ' (' + fmt(p.x) + ', ' + fmt(p.y) + ') z = ' + fmt(p.z); }).join('<br>') : t('nessun punto critico nel riquadro', 'no critical point in the box'));
        } catch (e) { }
      }
      S.aggiungi(assi(T, L * 1.1, ['x', 'y', 'z'], 0.32));
      info.innerHTML = testoInfo;
      S.didascalia.textContent = 'z = ' + C.stampa(s.e);
      if (!S.vistaIniziale) S.inquadra(11, -0.9, 1.05);
    }
    disegna();
  }

  /* ═══ 2. Orbitali ════════════════════════════════════════════════════════ */
  function laguerre(k, a, x) { /* L_k^(a)(x), ricorrenza */ if (k === 0) return 1; var L0 = 1, L1 = 1 + a - x; for (var i = 1; i < k; i++) { var L2 = ((2 * i + 1 + a - x) * L1 - (i + a) * L0) / (i + 1); L0 = L1; L1 = L2; } return L1; }
  function legendre(l, m, x) { /* P_l^m(x), m >= 0, senza fase di Condon-Shortley (il segno globale non conta per la forma) */
    var pmm = 1, s = Math.sqrt(Math.max(0, 1 - x * x)); for (var i = 1; i <= m; i++) pmm *= (2 * i - 1) * s;
    if (l === m) return pmm; var p1 = x * (2 * m + 1) * pmm; if (l === m + 1) return p1;
    var pll = 0; for (var ll = m + 2; ll <= l; ll++) { pll = (x * (2 * ll - 1) * p1 - (ll + m - 1) * pmm) / (ll - m); pmm = p1; p1 = pll; } return pll;
  }
  function psi(n, l, m, Z, x, y, z) {
    var r = Math.sqrt(x * x + y * y + z * z), rho = 2 * Z * r / n, ct = r > 0 ? z / r : 1, ph = Math.atan2(y, x), am = Math.abs(m);
    var R = Math.exp(-rho / 2) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho);
    var Y = legendre(l, am, ct) * (m > 0 ? Math.cos(m * ph) : m < 0 ? Math.sin(am * ph) : 1);
    return R * Y;
  }
  var NOMI_ORB = { '0,0': 's', '1,1': 'p_x', '1,-1': 'p_y', '1,0': 'p_z', '2,0': 'd_z²', '2,1': 'd_xz', '2,-1': 'd_yz', '2,2': 'd_x²−y²', '2,-2': 'd_xy', '3,0': 'f_z³', '3,1': 'f_xz²', '3,-1': 'f_yz²', '3,2': 'f_z(x²−y²)', '3,-2': 'f_xyz', '3,3': 'f_x(x²−3y²)', '3,-3': 'f_y(3x²−y²)' };
  /* campionamento esatto di |ψ|²: r dalla distribuzione radiale r²R² (funzione cumulativa invertita),
     la direzione per rigetto su |Y|²; il generatore e' riproducibile */
  function campiona(n, l, m, Z, N, seme) {
    /* mulberry32: interi a 32 bit con Math.imul. Un generatore congruenziale fatto con i
       numeri in virgola mobile perde le cifre basse e da' estrazioni correlate: con quello
       il 3d_z² usciva con meta' dei punti positivi invece del 61,5 % */
    var s = (seme || 12345) >>> 0;
    function rnd() { s = (s + 0x6D2B79F5) >>> 0; var q = Math.imul(s ^ (s >>> 15), 1 | s); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }
    var rmax = (n * n * 2.5 + 10 * n) / Z, G = 2000, cdf = [0], am = Math.abs(m);
    for (var i = 1; i <= G; i++) { var r = rmax * i / G, rho = 2 * Z * r / n, R = Math.exp(-rho / 2) * Math.pow(rho, l) * laguerre(n - l - 1, 2 * l + 1, rho); cdf.push(cdf[i - 1] + r * r * R * R); }
    var tot = cdf[G];
    var Ymax = 0; for (i = 0; i <= 200; i++) for (var j = 0; j <= 100; j++) { var ct = -1 + 2 * j / 100, ph = 2 * Math.PI * i / 200, Y = legendre(l, am, ct) * (m > 0 ? Math.cos(m * ph) : m < 0 ? Math.sin(am * ph) : 1); Ymax = Math.max(Ymax, Y * Y); }
    Ymax *= 1.05;
    var out = new Float32Array(N * 3), segno = new Int8Array(N), k = 0, tent = 0;
    while (k < N && tent < N * 400) {
      tent++;
      var u = rnd() * tot, lo = 0, hi = G; while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid; else hi = mid; }
      var rr = rmax * (lo + (u - cdf[lo]) / Math.max(1e-300, cdf[hi] - cdf[lo])) / G;
      var c2 = -1 + 2 * rnd(), p2 = 2 * Math.PI * rnd(), Y2 = legendre(l, am, c2) * (m > 0 ? Math.cos(m * p2) : m < 0 ? Math.sin(am * p2) : 1);
      if (rnd() * Ymax > Y2 * Y2) continue;
      var st = Math.sqrt(1 - c2 * c2), x = rr * st * Math.cos(p2), y = rr * st * Math.sin(p2), z = rr * c2;
      out[3 * k] = x; out[3 * k + 1] = y; out[3 * k + 2] = z; segno[k] = psi(n, l, m, Z, x, y, z) >= 0 ? 1 : -1; k++;
    }
    return { p: out, segno: segno, n: k, rmax: rmax };
  }
  F.calcolo.lab3d.psi = psi; F.calcolo.lab3d.campionaOrbitale = campiona; F.calcolo.lab3d.laguerre = laguerre; F.calcolo.lab3d.legendre = legendre;
  function schedaOrbitali(pan, S) {
    var T = S.T, st = { n: 3, l: 2, m: 0, Z: 1, N: 30000, taglio: false };
    var info = F.el('div', { 'class': 'bsiFX-nota' });
    var selN = F.scelta(pan, ['n (principale)', 'n (principal)'], [1, 2, 3, 4].map(function (v) { return [String(v), String(v)]; }), String(st.n), function (v) { st.n = +v; if (st.l > st.n - 1) st.l = st.n - 1; if (Math.abs(st.m) > st.l) st.m = 0; opzioni(); disegna(); });
    var contL = F.el('div'), contM = F.el('div'); pan.appendChild(contL); pan.appendChild(contM);
    F.cursore(pan, ['Z (carica nucleare)', 'Z (nuclear charge)'], 1, 6, 1, st.Z, function (v) { st.Z = v; disegna(); });
    F.cursore(pan, ['Punti', 'Points'], 5000, 60000, 5000, st.N, function (v) { st.N = v; disegna(); });
    casella(pan, ['Taglia a metà (mostra i nodi)', 'Cut in half (shows the nodes)'], st.taglio, function (v) { st.taglio = v; disegna(); });
    pan.appendChild(info);
    function opzioni() {
      contL.innerHTML = ''; contM.innerHTML = '';
      var ls = []; for (var l = 0; l < st.n; l++) ls.push([String(l), l + ' (' + 'spdf'[l] + ')']);
      F.scelta(contL, ['l (angolare)', 'l (angular)'], ls, String(st.l), function (v) { st.l = +v; if (Math.abs(st.m) > st.l) st.m = 0; opzioni(); disegna(); });
      var ms = []; for (var m = -st.l; m <= st.l; m++) ms.push([String(m), st.n + (NOMI_ORB[st.l + ',' + m] || 'spdf'[st.l] + m)]);
      F.scelta(contM, ['orbitale', 'orbital'], ms, String(st.m), function (v) { st.m = +v; disegna(); });
    }
    opzioni();
    function disegna() {
      S.pulisci();
      var c = campiona(st.n, st.l, st.m, st.Z, st.N), pos = [], col = [];
      /* la scala: il 97 % dei punti sta dentro il riquadro di lato 7 */
      var rr = []; for (var q = 0; q < c.n; q++) rr.push(Math.hypot(c.p[3 * q], c.p[3 * q + 1], c.p[3 * q + 2])); rr.sort(function (a, b) { return a - b; });
      var r97 = rr[Math.floor(rr.length * 0.97)] || 1, sc = 3.5 / r97; c.rvis = r97;
      for (var i = 0; i < c.n; i++) {
        var x = c.p[3 * i], y = c.p[3 * i + 1], z = c.p[3 * i + 2];
        if (st.taglio && y > 0) continue;
        pos.push(x * sc, y * sc, z * sc);
        if (c.segno[i] > 0) col.push(0.25, 0.62, 1); else col.push(1, 0.45, 0.2);
      }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      S.aggiungi(new T.Points(g, new T.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false })));
      S.aggiungi(sfera(T, 0.07, 0xffffff, 0, 0, 0, true));
      S.aggiungi(assi(T, 4.4, ['x', 'y', 'z'], 0.3));
      var nome = st.n + (NOMI_ORB[st.l + ',' + st.m] || ''), radiali = st.n - st.l - 1, E = -13.605693 * st.Z * st.Z / (st.n * st.n);
      S.didascalia.innerHTML = '<b>' + nome + '</b> · Z = ' + st.Z + ' · <span class="bsi3d-leg" style="background:#5eb8ff"></span>ψ > 0<span class="bsi3d-leg" style="background:#ff8c52"></span>ψ < 0';
      info.innerHTML = t('Energia: ', 'Energy: ') + '<b>' + fmt(E) + ' eV</b> (−13,6·Z²/n²)<br>' + t('Nodi radiali: ', 'Radial nodes: ') + radiali + ' (n − l − 1) · ' + t('nodi angolari: ', 'angular nodes: ') + st.l + ' (l) · ' + t('totali: ', 'total: ') + (st.n - 1) + '<br>' +
        t('Ogni punto è una posizione possibile dell’elettrone estratta da |ψ|²: dove i punti sono fitti è più probabile trovarlo. Il colore è il segno di ψ, che conta per i legami (sovrapposizione in fase o in opposizione).', 'Each point is a possible electron position drawn from |ψ|²: where points are dense it is more likely to be found. Colour is the sign of ψ, which matters for bonding (in-phase or out-of-phase overlap).') +
        '<br>' + t('Il 97 % della probabilità sta entro ', '97 % of the probability lies within ') + 'r = <b>' + fmt(c.rvis * 0.529177 / 1) + ' Å</b> (' + fmt(c.rvis) + ' a₀)';
      if (!S.vistaIniziale) S.inquadra(12, 0.7, 1.15);
    }
    disegna();
  }

  /* ═══ 3. Moti nello spazio ═══════════════════════════════════════════════ */
  function lorenz(s, r, b, x0, n, h) {
    var p = [x0.slice()], x = x0.slice();
    function f(v) { return [s * (v[1] - v[0]), v[0] * (r - v[2]) - v[1], v[0] * v[1] - b * v[2]]; }
    for (var i = 0; i < n; i++) {
      var k1 = f(x), k2 = f(x.map(function (v, j) { return v + h / 2 * k1[j]; })), k3 = f(x.map(function (v, j) { return v + h / 2 * k2[j]; })), k4 = f(x.map(function (v, j) { return v + h * k3[j]; }));
      x = x.map(function (v, j) { return v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); }); p.push(x);
    }
    return p;
  }
  function kepleroE(M, e) { var E = e < 0.8 ? M : Math.PI; for (var i = 0; i < 50; i++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-13) break; } return E; }
  F.calcolo.lab3d.lorenz = lorenz; F.calcolo.lab3d.kepleroE = kepleroE;
  function schedaMoti(pan, S) {
    var T = S.T, st = { tipo: 'elica', vpar: 1, vperp: 2, B: 0.01, part: 'e', e: 0.5, inc: 30, sigma: 10, rho: 28, beta: 8 / 3, x: 'cos(3*t)*(2+cos(7*t))', y: 'sin(3*t)*(2+cos(7*t))', z: 'sin(7*t)' };
    var info = F.el('div', { 'class': 'bsiFX-nota' }), comandi = F.el('div');
    F.scelta(pan, ['Moto', 'Motion'], [['elica', t('Carica in un campo magnetico (elica)', 'Charge in a magnetic field (helix)')], ['keplero', t('Orbita di Keplero', 'Kepler orbit')], ['lorenz', t('Attrattore di Lorenz (caos)', 'Lorenz attractor (chaos)')], ['param', t('Curva parametrica', 'Parametric curve')]], st.tipo, function (v) { st.tipo = v; pannello(); disegna(); });
    pan.appendChild(comandi); pan.appendChild(info);
    function pannello() {
      comandi.innerHTML = '';
      if (st.tipo === 'elica') {
        F.scelta(comandi, ['Particella', 'Particle'], [['e', t('elettrone', 'electron')], ['p', t('protone', 'proton')], ['a', t('particella α', 'α particle')]], st.part, function (v) { st.part = v; disegna(); });
        F.cursore(comandi, ['v∥ (10⁶ m/s, lungo B)', 'v∥ (10⁶ m/s, along B)'], 0, 4, 0.1, st.vpar, function (v) { st.vpar = v; disegna(); });
        F.cursore(comandi, ['v⊥ (10⁶ m/s)', 'v⊥ (10⁶ m/s)'], 0.1, 4, 0.1, st.vperp, function (v) { st.vperp = v; disegna(); });
        F.cursore(comandi, ['B (mT)', 'B (mT)'], 1, 50, 1, st.B * 1000, function (v) { st.B = v / 1000; disegna(); });
      } else if (st.tipo === 'keplero') {
        F.cursore(comandi, ['eccentricità e', 'eccentricity e'], 0, 0.9, 0.05, st.e, function (v) { st.e = v; disegna(); });
        F.cursore(comandi, ['inclinazione (°)', 'inclination (°)'], 0, 90, 5, st.inc, function (v) { st.inc = v; disegna(); });
      } else if (st.tipo === 'lorenz') {
        F.cursore(comandi, ['σ', 'σ'], 1, 20, 0.5, st.sigma, function (v) { st.sigma = v; disegna(); });
        F.cursore(comandi, ['ρ', 'ρ'], 0.5, 50, 0.5, st.rho, function (v) { st.rho = v; disegna(); });
      } else {
        campoTesto(comandi, ['x(t)', 'x(t)'], st.x, function (v) { st.x = v; disegna(); });
        campoTesto(comandi, ['y(t)', 'y(t)'], st.y, function (v) { st.y = v; disegna(); });
        campoTesto(comandi, ['z(t)', 'z(t)'], st.z, function (v) { st.z = v; disegna(); });
      }
    }
    function scia(pts, col, velocita, mobile) {
      /* la traiettoria si disegna mentre il corpo la percorre */
      var geo = new T.BufferGeometry().setFromPoints(pts), l = new T.Line(geo, new T.LineBasicMaterial({ color: col }));
      geo.setDrawRange(0, 1); S.aggiungi(l);
      var k = 0;
      S.ogniFotogramma(function (dt) { k = Math.min(pts.length, k + velocita * dt * 60); var n = Math.max(2, Math.floor(k)); geo.setDrawRange(0, n); if (mobile) mobile.position.copy(pts[Math.min(pts.length - 1, n - 1)]); if (k >= pts.length) { k = pts.length; return false; } });
    }
    function disegna() {
      S.pulisci();
      if (st.tipo === 'elica') {
        var P = { e: [1.602176634e-19, 9.1093837e-31, t('elettrone', 'electron')], p: [1.602176634e-19, 1.67262192e-27, t('protone', 'proton')], a: [3.204353268e-19, 6.6446573e-27, 'α'] }[st.part];
        var q = P[0], m = P[1], vp = st.vpar * 1e6, vo = st.vperp * 1e6, w = q * st.B / m, r = vo / w, passo = 2 * Math.PI * vp / w, Tc = 2 * Math.PI / w;
        var sc = 1.6 / r, giri = passo > 0 ? Math.max(2, Math.min(8, Math.floor(8 / (passo * sc)))) : 1, pts = [], z0 = -giri * passo * sc / 2;
        for (var i = 0; i <= 900; i++) { var tt = Tc * giri * i / 900, segno = st.part === 'e' ? 1 : -1; pts.push(new T.Vector3(r * sc * Math.cos(segno * w * tt), r * sc * Math.sin(segno * w * tt), z0 + vp * tt * sc)); }
        var zL = Math.max(3, Math.abs(z0) + 0.8);
        for (var a = -2; a <= 2; a += 2) for (var b = -2; b <= 2; b += 2) if (a || b) S.aggiungi(freccia(T, [a * 1.4, b * 1.4, -zL], [a * 1.4, b * 1.4, zL], 0x34465f, 0.35));
        var corpo = sfera(T, 0.12, st.part === 'e' ? 0x6bcfff : 0xff8a80, pts[0].x, pts[0].y, pts[0].z, true); S.aggiungi(corpo);
        scia(pts, st.part === 'e' ? 0x6bcfff : 0xff8a80, 2.5, corpo);
        S.didascalia.textContent = 'B ∥ z · ' + P[2];
        info.innerHTML = t('Raggio di Larmor ', 'Larmor radius ') + 'r = mv⊥/(|q|B) = <b>' + fmt(r) + ' m</b><br>' + t('Passo dell’elica ', 'Helix pitch ') + 'p = 2πm v∥/(|q|B) = <b>' + fmt(passo) + ' m</b><br>' + t('Periodo di ciclotrone ', 'Cyclotron period ') + 'T = 2πm/(|q|B) = <b>' + fmt(Tc) + ' s</b> (' + t('non dipende dalla velocità', 'independent of speed') + ')<br>' + t('La componente lungo B non risente della forza di Lorentz: il moto è un cerchio che trasla, un’elica. Elettrone e protone girano in versi opposti.', 'The component along B feels no Lorentz force: the motion is a translating circle, a helix. Electron and proton turn in opposite senses.');
        S.inquadra(Math.max(9, 2.4 * Math.max(3.2, giri * passo * sc)), 0.6, 1.3);
      } else if (st.tipo === 'keplero') {
        var e = st.e, A = 3, Bm = A * Math.sqrt(1 - e * e), inc = st.inc * Math.PI / 180, ruota = function (x, y) { return new T.Vector3(x, y * Math.cos(inc), y * Math.sin(inc)); };
        var orb = []; for (i = 0; i <= 400; i++) { var E = 2 * Math.PI * i / 400; orb.push(ruota(A * (Math.cos(E) - e), Bm * Math.sin(E))); }
        S.aggiungi(linea(T, orb, 0x5eead4));
        S.aggiungi(sfera(T, 0.3, 0xffd24a, 0, 0, 0, true));
        var piano = new T.Mesh(new T.CircleGeometry(4.5, 64), new T.MeshBasicMaterial({ color: 0x1a3050, transparent: true, opacity: 0.25, side: T.DoubleSide })); S.aggiungi(piano);
        var nodi = linea(T, [[-4.5, 0, 0], [4.5, 0, 0]], 0x8494a8, 0.6); S.aggiungi(nodi);
        var pianeta = sfera(T, 0.14, 0x6bcfff, 0, 0, 0, true); S.aggiungi(pianeta);
        var raggio = linea(T, [[0, 0, 0], [1, 0, 0]], 0xffd24a, 0.6); S.aggiungi(raggio);
        var area = []; var Mt = 0;
        S.ogniFotogramma(function (dt) {
          Mt += dt * 0.9; var E = kepleroE(Mt % (2 * Math.PI), e), p = ruota(A * (Math.cos(E) - e), Bm * Math.sin(E));
          pianeta.position.copy(p); raggio.geometry.setFromPoints([new T.Vector3(0, 0, 0), p]);
        });
        S.didascalia.textContent = t('Il Sole è in un fuoco; il raggio vettore spazza aree uguali in tempi uguali', 'The Sun is at a focus; the radius vector sweeps equal areas in equal times');
        info.innerHTML = t('Perielio ', 'Perihelion ') + 'a(1 − e) = <b>' + fmt(1 - e) + ' a</b> · ' + t('afelio ', 'aphelion ') + 'a(1 + e) = <b>' + fmt(1 + e) + ' a</b><br>' + t('Rapporto delle velocità perielio/afelio ', 'Perihelion/aphelion speed ratio ') + '(1 + e)/(1 − e) = <b>' + fmt((1 + e) / (1 - e)) + '</b><br>' + t('La posizione nel tempo viene dall’equazione di Keplero M = E − e sin E, risolta con Newton a ogni fotogramma: il pianeta accelera vicino al Sole.', 'The position in time comes from Kepler’s equation M = E − e sin E, solved by Newton every frame: the planet speeds up near the Sun.');
        if (!S.vistaIniziale) S.inquadra(11, -0.6, 1.0);
      } else if (st.tipo === 'lorenz') {
        var h = 0.005, n = 7000, a1 = lorenz(st.sigma, st.rho, st.beta, [1, 1, 1], n, h), a2 = lorenz(st.sigma, st.rho, st.beta, [1.001, 1, 1], n, h);
        var cz = st.rho - 1, sc2 = 0.11, map = function (p) { return new T.Vector3(p[0] * sc2, p[1] * sc2, (p[2] - cz) * sc2); };
        var c1 = sfera(T, 0.08, 0x5eead4, 0, 0, 0, true), c2 = sfera(T, 0.08, 0xff8a80, 0, 0, 0, true); S.aggiungi(c1); S.aggiungi(c2);
        scia(a1.map(map), 0x5eead4, 6, c1); scia(a2.map(map), 0xff8a80, 6, c2);
        var sep = -1; for (i = 0; i < a1.length; i++) if (Math.hypot(a1[i][0] - a2[i][0], a1[i][1] - a2[i][1], a1[i][2] - a2[i][2]) > 1) { sep = i * h; break; }
        S.didascalia.textContent = 'x′ = σ(y − x) · y′ = x(ρ − z) − y · z′ = xy − βz';
        info.innerHTML = t('Due traiettorie partono a distanza 0,001 l’una dall’altra. ', 'Two trajectories start 0.001 apart. ') + (sep > 0 ? t('Si separano di più di 1 dopo t ≈ ', 'They separate by more than 1 after t ≈ ') + '<b>' + fmt(sep) + '</b>' : t('Restano vicine: con questi parametri il moto non è caotico.', 'They stay close: with these parameters the motion is not chaotic.')) + '<br>' + t('Con σ = 10, β = 8/3 il caos compare per ρ > 24,74: sotto, le traiettorie cadono in uno dei due punti fissi (±√(β(ρ−1)), ±√(β(ρ−1)), ρ − 1). Integrazione con Runge-Kutta 4, passo 0,005.', 'With σ = 10, β = 8/3 chaos appears for ρ > 24.74: below, trajectories fall into one of the two fixed points (±√(β(ρ−1)), ±√(β(ρ−1)), ρ − 1). Runge-Kutta 4 integration, step 0.005.');
        if (!S.vistaIniziale) S.inquadra(11, 0.5, 1.2);
      } else {
        try {
          var fx = C.compila(C.leggi(st.x)), fy = C.compila(C.leggi(st.y)), fz = C.compila(C.leggi(st.z)), raw = [], M = 0;
          for (i = 0; i <= 2000; i++) { var tp = 2 * Math.PI * i / 2000, v = [fx({ t: tp }), fy({ t: tp }), fz({ t: tp })]; if (v.every(isFinite)) { raw.push(v); M = Math.max(M, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])); } }
          if (!raw.length) throw new Error(t('la curva non è definita per t ∈ [0, 2π]', 'the curve is undefined for t ∈ [0, 2π]'));
          var k = 3 / (M || 1), pts2 = raw.map(function (v) { return new T.Vector3(v[0] * k, v[1] * k, v[2] * k); });
          var cc = sfera(T, 0.09, 0xffd24a, 0, 0, 0, true); S.aggiungi(cc); scia(pts2, 0x5eead4, 8, cc);
          S.aggiungi(assi(T, 3.4, ['x', 'y', 'z'], 0.3));
          var Lc = 0; for (i = 1; i < raw.length; i++) Lc += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1], raw[i][2] - raw[i - 1][2]);
          S.didascalia.textContent = 'r(t) = (' + st.x + ', ' + st.y + ', ' + st.z + '), t ∈ [0, 2π]';
          info.innerHTML = t('Lunghezza della curva ', 'Curve length ') + '∫|r′(t)| dt ≈ <b>' + fmt(Lc) + '</b>';
        } catch (er) { info.textContent = '⚠ ' + er.message; }
        if (!S.vistaIniziale) S.inquadra(10, 0.7, 1.1);
      }
    }
    pannello(); disegna();
  }

  /* ═══ 4. Strutture cristalline ═══════════════════════════════════════════ */
  /* base in coordinate frazionarie; raggi in Å solo per le proporzioni */
  var STRUTTURE = {
    sc: { nome: ['Cubica semplice (Po)', 'Simple cubic (Po)'], a: 3.35, atomi: [['Po', 0, 0, 0]], el: { Po: [0xc9a0ff, 1.67] }, cn: '6', pf: Math.PI / 6 },
    bcc: { nome: ['Cubica a corpo centrato (Fe α)', 'Body-centred cubic (α-Fe)'], a: 2.87, atomi: [['Fe', 0, 0, 0], ['Fe', 0.5, 0.5, 0.5]], el: { Fe: [0xe0a070, 1.24] }, cn: '8', pf: Math.PI * Math.sqrt(3) / 8 },
    fcc: { nome: ['Cubica a facce centrate (Cu)', 'Face-centred cubic (Cu)'], a: 3.61, atomi: [['Cu', 0, 0, 0], ['Cu', 0.5, 0.5, 0], ['Cu', 0.5, 0, 0.5], ['Cu', 0, 0.5, 0.5]], el: { Cu: [0xd9895b, 1.28] }, cn: '12', pf: Math.PI / (3 * Math.sqrt(2)) },
    hcp: { nome: ['Esagonale compatta (Mg)', 'Hexagonal close-packed (Mg)'], esa: true, a: 3.21, c: 5.21, atomi: [['Mg', 1 / 3, 2 / 3, 0.25], ['Mg', 2 / 3, 1 / 3, 0.75]], el: { Mg: [0xa8e07a, 1.6] }, cn: '12', pf: Math.PI / (3 * Math.sqrt(2)) },
    nacl: { nome: ['Salgemma NaCl', 'Rock salt NaCl'], a: 5.64, atomi: [['Na', 0, 0, 0], ['Na', 0.5, 0.5, 0], ['Na', 0.5, 0, 0.5], ['Na', 0, 0.5, 0.5], ['Cl', 0.5, 0, 0], ['Cl', 0, 0.5, 0], ['Cl', 0, 0, 0.5], ['Cl', 0.5, 0.5, 0.5]], el: { Na: [0xb47cff, 1.02], Cl: [0x5fe36b, 1.81] }, cn: '6 : 6', formula: 'NaCl', Z: 4 },
    cscl: { nome: ['Cloruro di cesio CsCl', 'Caesium chloride CsCl'], a: 4.12, atomi: [['Cl', 0, 0, 0], ['Cs', 0.5, 0.5, 0.5]], el: { Cs: [0x8a6dff, 1.74], Cl: [0x5fe36b, 1.81] }, cn: '8 : 8', formula: 'CsCl', Z: 1 },
    diamante: { nome: ['Diamante (C)', 'Diamond (C)'], a: 3.567, atomi: [['C', 0, 0, 0], ['C', 0.5, 0.5, 0], ['C', 0.5, 0, 0.5], ['C', 0, 0.5, 0.5], ['C', 0.25, 0.25, 0.25], ['C', 0.75, 0.75, 0.25], ['C', 0.75, 0.25, 0.75], ['C', 0.25, 0.75, 0.75]], el: { C: [0x9aa6b2, 0.77] }, cn: '4', pf: Math.PI * Math.sqrt(3) / 16, legami: 1.545 },
    blenda: { nome: ['Blenda ZnS', 'Zinc blende ZnS'], a: 5.41, atomi: [['S', 0, 0, 0], ['S', 0.5, 0.5, 0], ['S', 0.5, 0, 0.5], ['S', 0, 0.5, 0.5], ['Zn', 0.25, 0.25, 0.25], ['Zn', 0.75, 0.75, 0.25], ['Zn', 0.75, 0.25, 0.75], ['Zn', 0.25, 0.75, 0.75]], el: { Zn: [0x8f9bd6, 0.74], S: [0xffd24a, 1.84] }, cn: '4 : 4', formula: 'ZnS', Z: 4, legami: 2.35 },
    fluorite: { nome: ['Fluorite CaF₂', 'Fluorite CaF₂'], a: 5.46, atomi: [['Ca', 0, 0, 0], ['Ca', 0.5, 0.5, 0], ['Ca', 0.5, 0, 0.5], ['Ca', 0, 0.5, 0.5]].concat([0.25, 0.75].reduce(function (o, x) { [0.25, 0.75].forEach(function (y) { [0.25, 0.75].forEach(function (z) { o.push(['F', x, y, z]); }); }); return o; }, [])), el: { Ca: [0x5eead4, 1.12], F: [0xa0e8ff, 1.31] }, cn: '8 : 4', formula: 'CaF₂', Z: 4 },
    perovskite: { nome: ['Perovskite SrTiO₃', 'Perovskite SrTiO₃'], a: 3.905, atomi: [['Sr', 0, 0, 0], ['Ti', 0.5, 0.5, 0.5], ['O', 0.5, 0.5, 0], ['O', 0.5, 0, 0.5], ['O', 0, 0.5, 0.5]], el: { Sr: [0x7ee081, 1.44], Ti: [0xb8bcc6, 0.61], O: [0xff5a4f, 1.4] }, cn: 'Ti 6, Sr 12', formula: 'SrTiO₃', Z: 1 }
  };
  /* il piano (h k l) dentro il cubo unitario: poligono dei tagli sugli spigoli */
  function pianoMiller(h, k, l) {
    if (!h && !k && !l) return [];
    /* si sceglie la traslazione del piano che passa dentro la cella: h x + k y + l z = d, d = valore medio fra gli estremi */
    var vals = []; [0, 1].forEach(function (x) { [0, 1].forEach(function (y) { [0, 1].forEach(function (z) { vals.push(h * x + k * y + l * z); }); }); });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), d = lo < 1 && hi > 1 ? 1 : (lo + hi) / 2;
    var V = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]], pts = [];
    for (var i = 0; i < 8; i++) for (var j = i + 1; j < 8; j++) {
      var A = V[i], B = V[j], diff = Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]) + Math.abs(A[2] - B[2]); if (diff !== 1) continue;
      var fa = h * A[0] + k * A[1] + l * A[2] - d, fb = h * B[0] + k * B[1] + l * B[2] - d;
      if (fa === 0) pts.push(A.slice()); if (fa * fb < 0) { var u = fa / (fa - fb); pts.push([A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u]); }
    }
    if (!pts.length) return [];
    /* niente doppioni, ordinati per angolo attorno al baricentro nel piano */
    pts = pts.filter(function (p, i) { return !pts.slice(0, i).some(function (q) { return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-9; }); });
    var c = [0, 0, 0]; pts.forEach(function (p) { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; c[2] += p[2] / pts.length; });
    var nrm = [h, k, l], u0 = Math.abs(h) < 0.9 * Math.hypot(h, k, l) ? [1, 0, 0] : [0, 1, 0];
    var cr = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var e1 = cr(nrm, u0), e2 = cr(nrm, e1);
    pts.sort(function (p, q) { var a = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], b = [q[0] - c[0], q[1] - c[1], q[2] - c[2]]; return Math.atan2(a[0] * e2[0] + a[1] * e2[1] + a[2] * e2[2], a[0] * e1[0] + a[1] * e1[1] + a[2] * e1[2]) - Math.atan2(b[0] * e2[0] + b[1] * e2[1] + b[2] * e2[2], b[0] * e1[0] + b[1] * e1[1] + b[2] * e1[2]); });
    return pts;
  }
  /* quanti atomi appartengono alla cella. La base elenca un rappresentante per
     ogni atomo intero: un vertice (1/8 × 8 vertici), un centro di faccia
     (1/2 × 2 facce opposte) o di spigolo (1/4 × 4 spigoli) valgono uno ciascuno,
     quindi il contenuto e' il conteggio della base */
  function contenuto(S) {
    var conta = {};
    S.atomi.forEach(function (A) { conta[A[0]] = (conta[A[0]] || 0) + 1; });
    return conta;
  }
  F.calcolo.lab3d.STRUTTURE = STRUTTURE; F.calcolo.lab3d.pianoMiller = pianoMiller; F.calcolo.lab3d.contenuto = contenuto;
  function schedaCristalli(pan, S) {
    var T = S.T, st = { s: 'nacl', rep: 1, piano: false, h: 1, k: 1, l: 1, scala: 0.55 };
    var info = F.el('div', { 'class': 'bsiFX-nota' }), miller = F.el('div');
    F.scelta(pan, ['Struttura', 'Structure'], Object.keys(STRUTTURE).map(function (k) { return [k, F.tt(STRUTTURE[k].nome)]; }), st.s, function (v) { st.s = v; disegna(); });
    F.scelta(pan, ['Celle', 'Cells'], [['1', '1 × 1 × 1'], ['2', '2 × 2 × 2']], '1', function (v) { st.rep = +v; disegna(); });
    F.cursore(pan, ['Raggio degli atomi (× ionico)', 'Atom radius (× ionic)'], 0.2, 1, 0.05, st.scala, function (v) { st.scala = v; disegna(); }, function (v) { return v === 1 ? t('1 (a contatto)', '1 (touching)') : String(v); });
    casella(pan, ['Piano di Miller (h k l)', 'Miller plane (h k l)'], st.piano, function (v) { st.piano = v; disegna(); });
    pan.appendChild(miller);
    ['h', 'k', 'l'].forEach(function (q) { F.cursore(miller, [q, q], -3, 3, 1, st[q], function (v) { st[q] = v; if (st.piano) disegna(); }); });
    pan.appendChild(info);
    function disegna() {
      S.pulisci();
      var D0 = STRUTTURE[st.s], a = D0.a, c = D0.c || a, L = 3 / Math.max(a, c) / Math.max(1, st.rep * 0.8);
      var base = D0.esa ? [[a, 0, 0], [-a / 2, a * Math.sqrt(3) / 2, 0], [0, 0, c]] : [[a, 0, 0], [0, a, 0], [0, 0, a]];
      var cart = function (f) { return [(f[0] * base[0][0] + f[1] * base[1][0] + f[2] * base[2][0]) * L, (f[0] * base[0][1] + f[1] * base[1][1] + f[2] * base[2][1]) * L, (f[0] * base[0][2] + f[1] * base[1][2] + f[2] * base[2][2]) * L]; };
      var n = st.rep, centro = cart([n / 2, n / 2, n / 2]), sposta = function (p) { return [p[0] - centro[0], p[1] - centro[1], p[2] - centro[2]]; };
      /* gli atomi: la base ripetuta, piu' le immagini sui bordi (x = n) */
      var visti = {}, pos = [];
      for (var i = -1; i <= n; i++) for (var j = -1; j <= n; j++) for (var k = -1; k <= n; k++) D0.atomi.forEach(function (A) {
        var f = [A[1] + i, A[2] + j, A[3] + k];
        if (f.some(function (v) { return v < -1e-9 || v > n + 1e-9; })) return;
        var key = f.map(function (v) { return Math.round(v * 1000); }).join(','); if (visti[key]) return; visti[key] = 1;
        pos.push({ el: A[0], p: sposta(cart(f)) });
      });
      var geoS = {};
      pos.forEach(function (o) { var E = D0.el[o.el], r = E[1] * L * st.scala; var m = new T.Mesh(geoS[o.el] || (geoS[o.el] = new T.SphereGeometry(r, 32, 20)), new T.MeshStandardMaterial({ color: E[0], roughness: 0.3, metalness: 0.15 })); m.position.set(o.p[0], o.p[1], o.p[2]); S.aggiungi(m); });
      /* i legami (diamante, blenda): coppie a distanza di legame */
      if (D0.legami) {
        var seg = [];
        for (i = 0; i < pos.length; i++) for (j = i + 1; j < pos.length; j++) { var d = Math.hypot(pos[i].p[0] - pos[j].p[0], pos[i].p[1] - pos[j].p[1], pos[i].p[2] - pos[j].p[2]) / L; if (Math.abs(d - D0.legami) < 0.05) seg.push(new T.Vector3(pos[i].p[0], pos[i].p[1], pos[i].p[2]), new T.Vector3(pos[j].p[0], pos[j].p[1], pos[j].p[2])); }
        S.aggiungi(new T.LineSegments(new T.BufferGeometry().setFromPoints(seg), new T.LineBasicMaterial({ color: 0xdfe8f2 })));
      }
      /* gli spigoli delle celle */
      var sp = [];
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) for (k = 0; k < n; k++) {
        var V = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]].map(function (v) { return sposta(cart([v[0] + i, v[1] + j, v[2] + k])); });
        [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { sp.push(new T.Vector3().fromArray(V[e[0]]), new T.Vector3().fromArray(V[e[1]])); });
      }
      S.aggiungi(new T.LineSegments(new T.BufferGeometry().setFromPoints(sp), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.8 })));
      /* il piano di Miller nella prima cella */
      var testoPiano = '';
      if (st.piano && !D0.esa) {
        var poly = pianoMiller(st.h, st.k, st.l);
        if (poly.length >= 3) {
          var vv = []; for (i = 1; i < poly.length - 1; i++) [poly[0], poly[i], poly[i + 1]].forEach(function (p) { var q = sposta(cart(p)); vv.push(q[0], q[1], q[2]); });
          var gp = new T.BufferGeometry(); gp.setAttribute('position', new T.Float32BufferAttribute(vv, 3)); gp.computeVertexNormals();
          S.aggiungi(new T.Mesh(gp, new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false })));
          S.aggiungi(linea(T, poly.concat([poly[0]]).map(function (p) { return sposta(cart(p)); }), 0xffd24a));
          var dhkl = a / Math.sqrt(st.h * st.h + st.k * st.k + st.l * st.l);
          testoPiano = '<br>' + t('Piano ', 'Plane ') + '(' + st.h + ' ' + st.k + ' ' + st.l + '): ' + t('distanza fra piani ', 'interplanar spacing ') + 'd = a/√(h² + k² + l²) = <b>' + fmt(dhkl) + ' Å</b> · Bragg (Cu Kα, 1,5406 Å): 2θ = <b>' + (1.5406 / (2 * dhkl) <= 1 ? fmt(2 * Math.asin(1.5406 / (2 * dhkl)) * 180 / Math.PI) + '°' : t('nessuna riflessione', 'no reflection')) + '</b>';
        }
      } else if (st.piano) testoPiano = '<br>' + t('Il piano di Miller è disegnato per le celle cubiche.', 'The Miller plane is drawn for cubic cells.');
      var cont = contenuto(D0), voci = Object.keys(cont).map(function (e) { return '<span class="bsi3d-leg" style="background:#' + D0.el[e][0].toString(16).padStart(6, '0') + '"></span>' + e + ' ' + fmt(cont[e]); }).join(' ');
      var vol = D0.esa ? a * a * Math.sqrt(3) / 2 * c : a * a * a;
      info.innerHTML = t('Contenuto della cella: ', 'Cell content: ') + voci + (D0.formula ? ' → Z = ' + D0.Z + ' ' + D0.formula : '') + '<br>' + t('Coordinazione: ', 'Coordination: ') + '<b>' + D0.cn + '</b>' + (D0.pf ? ' · ' + t('frazione di impacchettamento ', 'packing fraction ') + '<b>' + fmt(D0.pf * 100) + ' %</b>' : '') + '<br>a = ' + a + ' Å' + (D0.esa ? ', c = ' + c + ' Å (c/a = ' + fmt(c / a) + ')' : '') + ' · V = ' + fmt(vol) + ' Å³' + testoPiano;
      S.didascalia.textContent = F.tt(D0.nome);
      if (!S.vistaIniziale) S.inquadra(10, 0.55, 1.15);
    }
    disegna();
  }

  /* ═══ 5. Campi ═══════════════════════════════════════════════════════════ */
  var CARICHE = {
    dipolo: [[1, -1, 0, 0], [-1, 1, 0, 0]],
    uguali: [[1, -1, 0, 0], [1, 1, 0, 0]],
    quadrupolo: [[1, -1, -1, 0], [-1, 1, -1, 0], [1, 1, 1, 0], [-1, -1, 1, 0]],
    tre: [[2, 0, 0, 0], [-1, 1.5, 0, 0], [-1, -1.5, 0, 0]]
  };
  function campoE(Q, x, y, z) { var E = [0, 0, 0]; Q.forEach(function (q) { var dx = x - q[1], dy = y - q[2], dz = z - q[3], r2 = dx * dx + dy * dy + dz * dz, r3 = Math.pow(r2, 1.5) || 1e-12; E[0] += q[0] * dx / r3; E[1] += q[0] * dy / r3; E[2] += q[0] * dz / r3; }); return E; }
  function campoSpira(R, x, y, z) { /* Biot-Savart su 96 tratti della spira nel piano xy */ var B = [0, 0, 0], N = 96; for (var i = 0; i < N; i++) { var a = 2 * Math.PI * i / N, b = 2 * Math.PI * (i + 1) / N, px = R * Math.cos((a + b) / 2), py = R * Math.sin((a + b) / 2), dl = [R * (Math.cos(b) - Math.cos(a)), R * (Math.sin(b) - Math.sin(a)), 0], r = [x - px, y - py, z], r3 = Math.pow(r[0] * r[0] + r[1] * r[1] + r[2] * r[2], 1.5) || 1e-12; B[0] += (dl[1] * r[2] - dl[2] * r[1]) / r3; B[1] += (dl[2] * r[0] - dl[0] * r[2]) / r3; B[2] += (dl[0] * r[1] - dl[1] * r[0]) / r3; } return B; }
  function lineaCampo(f, p0, verso, stop, maxPassi) {
    var p = p0.slice(), pts = [p.slice()], h = 0.03;
    for (var i = 0; i < (maxPassi || 900); i++) {
      var E = f(p[0], p[1], p[2]), m = Math.hypot(E[0], E[1], E[2]); if (!(m > 0) || !isFinite(m)) break;
      var d = [verso * E[0] / m, verso * E[1] / m, verso * E[2] / m], mid = [p[0] + d[0] * h / 2, p[1] + d[1] * h / 2, p[2] + d[2] * h / 2], E2 = f(mid[0], mid[1], mid[2]), m2 = Math.hypot(E2[0], E2[1], E2[2]); if (!(m2 > 0)) break;
      p = [p[0] + verso * E2[0] / m2 * h, p[1] + verso * E2[1] / m2 * h, p[2] + verso * E2[2] / m2 * h]; pts.push(p.slice());
      if (stop(p)) break;
    }
    return pts;
  }
  F.calcolo.lab3d.campoE = campoE; F.calcolo.lab3d.campoSpira = campoSpira; F.calcolo.lab3d.lineaCampo = lineaCampo;
  function schedaCampi(pan, S) {
    var T = S.T, st = { tipo: 'dipolo', linee: 16, piano: false };
    var info = F.el('div', { 'class': 'bsiFX-nota' });
    F.scelta(pan, ['Sorgente', 'Source'], [['dipolo', t('Dipolo elettrico', 'Electric dipole')], ['uguali', t('Due cariche uguali', 'Two equal charges')], ['quadrupolo', t('Quadrupolo', 'Quadrupole')], ['tre', t('+2 e due −1', '+2 and two −1')], ['spira', t('Spira di corrente (campo magnetico)', 'Current loop (magnetic field)')]], st.tipo, function (v) { st.tipo = v; disegna(); });
    F.cursore(pan, ['Linee per carica', 'Lines per charge'], 6, 40, 2, st.linee, function (v) { st.linee = v; disegna(); });
    casella(pan, ['Solo nel piano xy', 'Only in the xy plane'], st.piano, function (v) { st.piano = v; disegna(); });
    pan.appendChild(info);
    function semi(n, piano) {
      var out = [];
      if (piano) { for (var i = 0; i < n; i++) { var a = 2 * Math.PI * (i + 0.5) / n; out.push([Math.cos(a), Math.sin(a), 0]); } return out; }
      var g = Math.PI * (3 - Math.sqrt(5)); for (i = 0; i < n; i++) { var z = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - z * z); out.push([r * Math.cos(g * i), r * Math.sin(g * i), z]); } return out;
    }
    function disegna() {
      S.pulisci();
      var tutte = [], R0 = 6;
      if (st.tipo === 'spira') {
        var Rs = 1.5, anello = []; for (var i = 0; i <= 96; i++) { var a = 2 * Math.PI * i / 96; anello.push([Rs * Math.cos(a), Rs * Math.sin(a), 0]); }
        S.aggiungi(new T.Mesh(new T.TorusGeometry(Rs, 0.05, 12, 96), new T.MeshStandardMaterial({ color: 0xd9895b, metalness: 0.6, roughness: 0.3 })));
        var f = function (x, y, z) { return campoSpira(Rs, x, y, z); };
        var nPhi = st.piano ? 2 : 6;
        for (var p = 0; p < nPhi; p++) { var phi = Math.PI * p / nPhi; for (var s = 1; s <= Math.round(st.linee / 4); s++) { var rr = Rs * s / (Math.round(st.linee / 4) + 1); [1, -1].forEach(function (sg) { var p0 = [sg * rr * Math.cos(phi), sg * rr * Math.sin(phi), 0]; var l1 = lineaCampo(f, p0, 1, function (q) { return Math.hypot(q[0], q[1], q[2]) > R0; }, 700), l2 = lineaCampo(f, p0, -1, function (q) { return Math.hypot(q[0], q[1], q[2]) > R0; }, 700); tutte.push(l2.reverse().concat(l1)); }); } }
        info.innerHTML = t('Linee di B di una spira (Biot-Savart su 96 tratti). Al centro B = μ₀I/(2R) lungo l’asse; lontano il campo è quello di un dipolo magnetico, con la stessa forma del dipolo elettrico: confrontalo con la sorgente «Dipolo elettrico». Le linee di B si chiudono su se stesse: non ci sono cariche magnetiche.', 'B lines of a loop (Biot-Savart over 96 segments). At the centre B = μ₀I/(2R) along the axis; far away the field is a magnetic dipole, the same shape as the electric dipole: compare with the «Electric dipole» source. B lines close on themselves: there are no magnetic charges.');
        S.didascalia.textContent = t('Spira di corrente nel piano xy', 'Current loop in the xy plane');
      } else {
        var Q = CARICHE[st.tipo], fE = function (x, y, z) { return campoE(Q, x, y, z); };
        Q.forEach(function (q) { S.aggiungi(sfera(T, 0.16 + 0.05 * Math.abs(q[0]), q[0] > 0 ? 0xff6b6b : 0x6bcfff, q[1], q[2], q[3], true)); });
        var pos = Q.filter(function (q) { return q[0] > 0; }), neg = Q.filter(function (q) { return q[0] < 0; });
        var stop = function (p) { return Math.hypot(p[0], p[1], p[2]) > R0 || Q.some(function (q) { return Math.hypot(p[0] - q[1], p[1] - q[2], p[2] - q[3]) < 0.12; }); };
        pos.forEach(function (q) { semi(Math.round(st.linee * q[0]), st.piano).forEach(function (d) { tutte.push(lineaCampo(fE, [q[1] + 0.15 * d[0], q[2] + 0.15 * d[1], q[3] + 0.15 * d[2]], 1, stop)); }); });
        if (!pos.length || neg.reduce(function (s, q) { return s - q[0]; }, 0) > pos.reduce(function (s, q) { return s + q[0]; }, 0)) neg.forEach(function (q) { semi(Math.round(st.linee * -q[0]), st.piano).forEach(function (d) { tutte.push(lineaCampo(fE, [q[1] + 0.15 * d[0], q[2] + 0.15 * d[1], q[3] + 0.15 * d[2]], -1, stop)); }); });
        var netta = Q.reduce(function (s, q) { return s + q[0]; }, 0);
        info.innerHTML = t('Le linee escono dalle cariche positive (rosse) ed entrano nelle negative (azzurre); il numero di linee è proporzionale alla carica (legge di Gauss). Carica netta: ', 'Lines leave positive charges (red) and enter negative ones (blue); their number is proportional to the charge (Gauss’s law). Net charge: ') + '<b>' + netta + '</b>' + (netta ? t(' — lontano il campo è quello di una carica puntiforme.', ' — far away the field is that of a point charge.') : t(' — lontano il campo decade più in fretta (dipolo 1/r³, quadrupolo 1/r⁴).', ' — far away the field falls off faster (dipole 1/r³, quadrupole 1/r⁴).')) + '<br>' + t('Integrazione con il metodo del punto medio, passo 0,03.', 'Midpoint-method integration, step 0.03.');
        S.didascalia.textContent = t('Linee del campo elettrico', 'Electric field lines');
      }
      var pts = [], cols = [];
      tutte.forEach(function (L) { for (var i = 1; i < L.length; i++) { pts.push(L[i - 1][0], L[i - 1][1], L[i - 1][2], L[i][0], L[i][1], L[i][2]); var u = i / L.length, c = scala(0.25 + 0.7 * (1 - u)); cols.push(c[0], c[1], c[2], c[0], c[1], c[2]); } });
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
      S.aggiungi(new T.LineSegments(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })));
      /* frecce lungo le linee, ogni tanto */
      tutte.forEach(function (L, k) { if (L.length < 40 || k % 2) return; var i = Math.floor(L.length * 0.35), a = L[i], b = L[i + 3]; S.aggiungi(freccia(T, a, b, 0xe6fffb, 0.18)); });
      if (!S.vistaIniziale) S.inquadra(11, -0.7, 1.1);
    }
    disegna();
  }

  F.sezione('slab3d', {
    titolo: ['🧊 Laboratorio 3D', '🧊 3D Laboratory'],
    sotto: ['Superfici, orbitali atomici, moti nello spazio, strutture cristalline e linee di campo in tre dimensioni: si ruota con il dito o il mouse, si ingrandisce con due dita o con la rotellina.', 'Surfaces, atomic orbitals, motion in space, crystal structures and field lines in three dimensions: rotate with a finger or the mouse, zoom with two fingers or the wheel.'],
    schede: [
      { nome: ['🗻 Superfici', '🗻 Surfaces'], costruisci: scheda(schedaSuperfici) },
      { nome: ['⚛️ Orbitali', '⚛️ Orbitals'], costruisci: scheda(schedaOrbitali) },
      { nome: ['🌀 Moti nello spazio', '🌀 Motion in space'], costruisci: scheda(schedaMoti) },
      { nome: ['💎 Cristalli', '💎 Crystals'], costruisci: scheda(schedaCristalli) },
      { nome: ['🧲 Campi', '🧲 Fields'], costruisci: scheda(schedaCampi) }
    ]
  });
  /* il motore e i pezzi comuni, per le altre sezioni che vogliono una vista 3D (geometria analitica) */
  globale.BSILab3D = { scene: function () { return scene; }, caricaThree: caricaThree, Scena: Scena, stile: stile, assi: assi, linea: linea, sfera: sfera, freccia: freccia, testo3d: testo3d };
})(typeof window !== 'undefined' ? window : globalThis);
