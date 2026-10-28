/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-robot.js — il volto di Spectra: un androide in 3D
   BioSpecInfo · © Samuele Pio Provenzano

   Spectra ha il volto di un androide, reso in tempo reale con three.js:
   calotta in ceramica bianca, maschera facciale in grafite metallica, una
   visiera di vetro scuro dietro cui brillano gli occhi (dischi luminosi con
   anelli segmentati che ruotano), giunture tra i pannelli, sensori laterali
   ad anello, una griglia di luci al posto della bocca, collo con cavi.
   I riflessi vengono da un ambiente di luce costruito qui (PMREM), non da
   immagini esterne.

   E' vivo:
   · la testa segue il puntatore o il dito, con un'inerzia, e respira;
   · gli occhi «sbattono» (la luce si chiude in un lampo) a intervalli
     irregolari, e cambiano colore con lo stato: CIANO quando ascolta,
     AMBRA quando elabora (gli anelli girano piu' in fretta), VERDE ACQUA
     quando parla;
   · la griglia della bocca fa da equalizzatore: segue il testo che la voce
     pronuncia, lettera per lettera, e si riallinea a ogni parola.

   Stessa interfaccia del volto in SVG (stato, dici, allinea, taci): la
   console usa questo quando c'e' WebGL, l'altro come ripiego e per le icone.
   Con «riduci movimento» la testa resta ferma e gli occhi non sbattono.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var MENO_MOTO = function () { return globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var COLORI = { attesa: 0x2ee6ff, ascolta: 0x00e5ff, pensa: 0xffb547, parla: 0x5affd2 };

  function caricaThree() {
    if (globale.THREE) return Promise.resolve(globale.THREE);
    if (globale.BSILab3D && globale.BSILab3D.caricaThree) return globale.BSILab3D.caricaThree();
    return new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = './three.min.js'; s.onload = function () { ok(globale.THREE); }; s.onerror = ko; document.head.appendChild(s); });
  }
  function webgl() { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } }

  /* un ambiente di luce: una stanza scura con pannelli luminosi, filtrata in
     PMREM. Da' ai metalli e al vetro riflessi credibili. */
  function ambiente(T, ren) {
    var sc = new T.Scene(), stanza = new T.Mesh(new T.BoxGeometry(20, 12, 20), new T.MeshBasicMaterial({ color: 0x0a1220, side: T.BackSide }));
    sc.add(stanza);
    [[0, 5.5, 0, 12, 0.3, 6, 0xffffff, 3], [-9.5, 1, 2, 0.3, 6, 4, 0x9fdcff, 2.2], [9.5, 2, -1, 0.3, 5, 6, 0x5fe9ff, 2.6], [0, 0, -9.5, 8, 4, 0.3, 0x335577, 1.2], [3, -5.5, 3, 6, 0.3, 4, 0x223344, 1]].forEach(function (p) {
      var m = new T.Mesh(new T.BoxGeometry(p[3], p[4], p[5]), new T.MeshBasicMaterial({ color: new T.Color(p[6]).multiplyScalar(p[7]) }));
      m.position.set(p[0], p[1], p[2]); sc.add(m);
    });
    var pm = new T.PMREMGenerator(ren), env = pm.fromScene(sc, 0.04).texture;
    pm.dispose(); return env;
  }
  /* un bagliore morbido per occhi e sensori */
  function bagliore(T) {
    var c = document.createElement('canvas'); c.width = c.height = 128; var q = c.getContext('2d');
    var g = q.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = g; q.fillRect(0, 0, 128, 128);
    var tx = new T.CanvasTexture(c); return tx;
  }
  /* una trama per la ceramica: microgiunture e una leggera variazione */
  function tramaCeramica(T) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256; var q = c.getContext('2d');
    q.fillStyle = '#eef2f6'; q.fillRect(0, 0, 512, 256);
    for (var i = 0; i < 2600; i++) { q.fillStyle = 'rgba(120,135,150,' + (Math.random() * 0.035).toFixed(3) + ')'; q.fillRect(Math.random() * 512, Math.random() * 256, 2, 2); }
    q.strokeStyle = 'rgba(70,85,100,0.55)'; q.lineWidth = 1.2;
    [[60, 0, 60, 256], [196, 0, 196, 256], [316, 0, 316, 256], [452, 0, 452, 256], [0, 70, 512, 70]].forEach(function (l) { q.beginPath(); q.moveTo(l[0], l[1]); q.lineTo(l[2], l[3]); q.stroke(); });
    q.fillStyle = 'rgba(70,85,100,0.5)';
    for (var k = 0; k < 18; k++) { q.beginPath(); q.arc(30 + k * 28, 78, 1.6, 0, 7); q.fill(); }
    var tx = new T.CanvasTexture(c); tx.wrapS = T.RepeatWrapping; return tx;
  }

  function Robot(padre, opz) {
    opz = opz || {};
    var T = globale.THREE, self = this;
    this.T = T; this.padre = padre;
    var ren = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opz.foto });
    ren.setPixelRatio(Math.min(2, globale.devicePixelRatio || 1));
    ren.setClearColor(0x000000, 0);
    ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.05;
    ren.domElement.style.width = '100%'; ren.domElement.style.height = '100%'; ren.domElement.style.display = 'block';
    ren.domElement.setAttribute('aria-hidden', 'true');
    padre.appendChild(ren.domElement);
    this.ren = ren;
    var sc = new T.Scene(); this.sc = sc;
    sc.environment = ambiente(T, ren);
    var cam = new T.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0.05, 4.7); cam.lookAt(0, -0.08, 0); this.cam = cam;
    sc.add(new T.HemisphereLight(0xcfe8ff, 0x0a1018, 0.35));
    var key = new T.DirectionalLight(0xfff4e8, 1.25); key.position.set(-3, 3, 5); sc.add(key);
    var rim = new T.DirectionalLight(0x5fe9ff, 1.6); rim.position.set(4, 2, -4); sc.add(rim);
    var rim2 = new T.DirectionalLight(0x6f8bff, 0.7); rim2.position.set(-4, -1, -3); sc.add(rim2);
    this.luceOcchi = new T.PointLight(0x2ee6ff, 0.8, 4); this.luceOcchi.position.set(0, 0.15, 1.3); sc.add(this.luceOcchi);

    var ceramica = new T.MeshPhysicalMaterial({ color: 0xffffff, map: tramaCeramica(T), metalness: 0.15, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.1 });
    var grafite = new T.MeshStandardMaterial({ color: 0x1b222b, metalness: 0.85, roughness: 0.32, envMapIntensity: 1.3 });
    var acciaio = new T.MeshStandardMaterial({ color: 0x8a96a3, metalness: 1, roughness: 0.25, envMapIntensity: 1.4 });
    var vetro = new T.MeshPhysicalMaterial({ color: 0x03070c, metalness: 0.2, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.74, envMapIntensity: 2, depthWrite: false });
    this.matLuce = new T.MeshBasicMaterial({ color: COLORI.attesa, toneMapped: false });
    var sprite = bagliore(T);

    var testa = new T.Group(); this.testa = testa; sc.add(testa);
    /* calotta */
    var cal = new T.Mesh(new T.SphereGeometry(1, 96, 64), ceramica); cal.scale.set(0.8, 1.04, 0.97); testa.add(cal);
    /* maschera facciale: la parte frontale inferiore della sfera, un poco piu' grande */
    /* theta si misura dall'alto: da 98° (sotto gli occhi) a 150° (il mento) */
    var masc = new T.Mesh(new T.SphereGeometry(1.012, 96, 48, Math.PI / 2 - 0.95, 1.9, 1.71, 0.92), grafite); masc.scale.copy(cal.scale); testa.add(masc);
    /* mento e mascella */
    /* visiera: una fascia curva di vetro scuro */
    var vis = new T.Mesh(new T.CylinderGeometry(0.885, 0.87, 0.34, 96, 1, true, -1.15, 2.3), vetro);
    vis.position.set(0, 0.16, 0.02); vis.scale.set(1, 1, 1.12); vis.renderOrder = 8; testa.add(vis);
    var cornice = new T.Mesh(new T.TorusGeometry(0.89, 0.012, 8, 120, 2.3), acciaio); cornice.rotation.set(Math.PI / 2, 0, Math.PI / 2 - 1.15); cornice.position.set(0, 0.33, 0.02); cornice.scale.set(1, 1.12, 1); testa.add(cornice);
    var cornice2 = cornice.clone(); cornice2.position.y = -0.01; testa.add(cornice2);
    /* una cresta sopra la visiera e due prese d'aria sulle guance: il profilo di una macchina */
    var cresta = new T.Mesh(new T.TorusGeometry(0.9, 0.022, 10, 120, 2.0), grafite);
    cresta.rotation.set(Math.PI / 2, 0, Math.PI / 2 - 1.0); cresta.position.set(0, 0.42, 0.02); cresta.scale.set(0.93, 1.1, 1); testa.add(cresta);
    [-1, 1].forEach(function (s) {
      for (var k = 0; k < 4; k++) {
        var p = new T.Mesh(new T.BoxGeometry(0.16, 0.014, 0.03), new T.MeshStandardMaterial({ color: 0x06090c, metalness: 0.5, roughness: 0.6 }));
        var y = -0.18 - k * 0.055, z = 0.97 * Math.sqrt(Math.max(0, 1 - Math.pow(y / 1.04, 2) - 0.36)) + 0.025;
        p.position.set(s * 0.48, y, z); p.rotation.y = s * 0.62; testa.add(p);
      }
    });
    /* occhi: disco, anello segmentato che ruota, bagliore */
    this.occhi = [];
    [-0.3, 0.3].forEach(function (x) {
      var g = new T.Group(); g.position.set(x, 0.16, 0.9); g.renderOrder = 5;
      var disco = new T.Mesh(new T.CircleGeometry(0.055, 40), self.matLuce); g.add(disco);
      var anello = new T.Group();
      for (var k = 0; k < 6; k++) { var seg = new T.Mesh(new T.RingGeometry(0.085, 0.108, 24, 1, k * Math.PI / 3, Math.PI / 4.2), self.matLuce); anello.add(seg); }
      g.add(anello);
      var esterno = new T.Mesh(new T.RingGeometry(0.125, 0.131, 64), new T.MeshBasicMaterial({ color: 0x2ee6ff, transparent: true, opacity: 0.45, toneMapped: false })); g.add(esterno);
      var gl = new T.Sprite(new T.SpriteMaterial({ map: sprite, color: COLORI.attesa, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false, depthTest: false })); gl.scale.set(0.3, 0.3, 1); gl.renderOrder = 10; g.add(gl);
      g.lookAt(x * 2.2, 0.16, 6);
      testa.add(g);
      self.occhi.push({ g: g, anello: anello, gl: gl, esterno: esterno, disco: disco });
    });
    /* bocca: griglia di luci, un equalizzatore */
    this.barre = [];
    for (var b = 0; b < 11; b++) {
      var bar = new T.Mesh(new T.BoxGeometry(0.035, 0.05, 0.02), this.matLuce);
      var ang = (b - 5) * 0.055; bar.position.set(Math.sin(ang) * 0.93, -0.45, Math.cos(ang) * 0.93 * 0.94 + 0.02); bar.rotation.y = ang;
      testa.add(bar); this.barre.push(bar);
    }
    var fessura = new T.Mesh(new T.BoxGeometry(0.5, 0.12, 0.03), new T.MeshStandardMaterial({ color: 0x05080b, metalness: 0.4, roughness: 0.6 })); fessura.position.set(0, -0.45, 0.865); testa.add(fessura);
    /* giunture tra i pannelli */
    [[0, 0, 0], [0, 0.55, 0], [0, -0.55, 0]].forEach(function (r) {
      var s = new T.Mesh(new T.TorusGeometry(1.0, 0.006, 6, 160), new T.MeshStandardMaterial({ color: 0x3a4652, metalness: 0.6, roughness: 0.4 }));
      s.scale.set(0.845, 1.025, 0.945); s.rotation.set(0, r[1] + Math.PI / 2, 0); testa.add(s);
    });
    var seamH = new T.Mesh(new T.TorusGeometry(1.0, 0.006, 6, 160, Math.PI * 1.2), new T.MeshStandardMaterial({ color: 0x3a4652, metalness: 0.6, roughness: 0.4 }));
    seamH.rotation.x = Math.PI / 2; seamH.rotation.z = -Math.PI * 0.1 + Math.PI; seamH.position.y = 0.52; seamH.scale.set(0.79, 0.88, 1); testa.add(seamH);
    /* linee di luce lungo le giunture: archi sottili sui lati della calotta e sulla nuca */
    this.linee = [];
    [[-0.62, 0.9], [0.62, 0.9], [-0.95, 0.55], [0.95, 0.55]].forEach(function (p) {
      var arco = new T.Mesh(new T.TorusGeometry(1.0, 0.007, 6, 80, p[1]), self.matLuce);
      arco.scale.set(0.805, 1.045, 0.975); arco.rotation.set(0, Math.PI / 2 + p[0], Math.PI / 2 - p[1] / 2 + 0.55); testa.add(arco); self.linee.push(arco);
    });
    var linea = new T.Mesh(new T.TorusGeometry(1.0, 0.006, 6, 120, 1.4), self.matLuce);
    linea.rotation.set(Math.PI / 2, 0, -Math.PI / 2 - 0.7); linea.position.y = -0.62; linea.scale.set(0.66, 0.78, 1); testa.add(linea);
    /* sensori laterali: disco d'acciaio con anello luminoso */
    this.orecchie = [];
    [-1, 1].forEach(function (s) {
      var g = new T.Group(); g.position.set(s * 0.82, 0.05, 0); g.rotation.z = Math.PI / 2;
      g.add(new T.Mesh(new T.CylinderGeometry(0.24, 0.26, 0.14, 64), grafite));
      var piatto = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.15, 64), acciaio); g.add(piatto);
      var an = new T.Group();
      for (var k = 0; k < 8; k++) { var a = new T.Mesh(new T.TorusGeometry(0.205, 0.012, 6, 16, Math.PI / 6), self.matLuce); a.rotation.z = k * Math.PI / 4; an.add(a); }
      an.rotation.x = Math.PI / 2; an.position.y = s * 0.075; g.add(an);
      testa.add(g); self.orecchie.push(an);
    });
    /* sensore frontale */
    var sens = new T.Mesh(new T.CircleGeometry(0.03, 24), this.matLuce); sens.position.set(0, 0.72, 0.68); sens.lookAt(0, 1.6, 3); testa.add(sens);
    var sensG = new T.Sprite(new T.SpriteMaterial({ map: sprite, color: COLORI.attesa, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false })); sensG.position.copy(sens.position); sensG.scale.set(0.22, 0.22, 1); testa.add(sensG);
    this.sensG = sensG;
    /* collo, cavi, collare, spalle */
    var collo = new T.Group(); sc.add(collo); this.collo = collo;
    var cil = new T.Mesh(new T.CylinderGeometry(0.3, 0.36, 0.75, 48), grafite); cil.position.y = -1.25; collo.add(cil);
    for (var r = 0; r < 4; r++) { var an2 = new T.Mesh(new T.TorusGeometry(0.33 + r * 0.008, 0.018, 8, 48), acciaio); an2.rotation.x = Math.PI / 2; an2.position.y = -1.05 - r * 0.13; collo.add(an2); }
    [[-0.22, 0.25], [0.22, 0.25], [-0.12, 0.32], [0.12, 0.32]].forEach(function (c) {
      var curva = new T.CatmullRomCurve3([new T.Vector3(c[0] * 1.4, -0.85, c[1] * 0.8), new T.Vector3(c[0] * 1.1, -1.15, c[1] + 0.08), new T.Vector3(c[0] * 1.6, -1.55, c[1] + 0.05)]);
      collo.add(new T.Mesh(new T.TubeGeometry(curva, 24, 0.022, 8), new T.MeshStandardMaterial({ color: 0x0e1318, metalness: 0.3, roughness: 0.5 })));
    });
    var spalle = new T.Mesh(new T.SphereGeometry(1, 64, 32), ceramica); spalle.scale.set(1.75, 0.42, 0.85); spalle.position.y = -1.85; collo.add(spalle);
    var petto = new T.Mesh(new T.CircleGeometry(0.06, 32), this.matLuce); petto.position.set(0, -1.62, 0.78); collo.add(petto);

    this.st = 'attesa'; this.t = 0; this.palp = 0; this.prossimo = 1.8;
    this.mira = { x: 0, y: 0, tx: 0, ty: 0 };
    this.testo = ''; this.pos = 0; this.boc = 0; this.vel = 13;
    this.colore = new T.Color(COLORI.attesa); this.coloreT = new T.Color(COLORI.attesa);
    this._muovi = function (e) {
      var r = padre.getBoundingClientRect(); if (!r.width) return;
      self.mira.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.5)));
      self.mira.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.5)));
    };
    document.addEventListener('pointermove', this._muovi, { passive: true });
    this.adatta(); this.avvia();
  }
  Robot.prototype.adatta = function () {
    var w = this.padre.clientWidth || 300, h = this.padre.clientHeight || w;
    if (this._w === w && this._h === h) return; this._w = w; this._h = h;
    this.ren.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  };
  Robot.prototype.stato = function (s) { this.st = s || 'attesa'; if (s !== 'parla') this.testo = ''; this.coloreT.setHex(COLORI[this.st] || COLORI.attesa); this.avvia(); };
  Robot.prototype.dici = function (f) { this.testo = String(f || ''); this.pos = 0; this.st = 'parla'; this.coloreT.setHex(COLORI.parla); this.avvia(); };
  Robot.prototype.allinea = function (i) { if (this.testo) this.pos = Math.max(this.pos, i); };
  Robot.prototype.taci = function () { this.testo = ''; if (this.st === 'parla') this.stato('attesa'); };
  Robot.prototype.avvia = function () {
    if (this.raf) return;
    var self = this, prec = 0;
    (function giro(ora) {
      if (!self.ren.domElement.isConnected) { self.raf = 0; self.libera(); return; }
      var dt = prec ? Math.min(0.05, (ora - prec) / 1000) : 0.016; prec = ora;
      if (self.padre.offsetParent !== null) { self.adatta(); self.passo(dt); self.ren.render(self.sc, self.cam); }
      self.raf = globale.requestAnimationFrame(giro);
    })(0);
  };
  Robot.prototype.ferma = function () { if (this.raf) globale.cancelAnimationFrame(this.raf); this.raf = 0; };
  Robot.prototype.libera = function () {
    document.removeEventListener('pointermove', this._muovi);
    this.sc.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); } });
    try { this.ren.dispose(); } catch (e) {}
  };
  Robot.prototype.passo = function (dt) {
    var lento = MENO_MOTO(), st = this.st; this.t += dt;
    /* colore degli occhi verso lo stato */
    this.colore.lerp(this.coloreT, Math.min(1, dt * 5));
    this.matLuce.color.copy(this.colore); this.luceOcchi.color.copy(this.colore); this.sensG.material.color.copy(this.colore);
    /* la testa segue lo sguardo; quando pensa guarda in alto di lato */
    var tx = this.mira.tx, ty = this.mira.ty;
    if (st === 'pensa') { tx = 0.55 + 0.15 * Math.sin(this.t * 0.7); ty = -0.6; }
    this.mira.x += (tx - this.mira.x) * Math.min(1, dt * 3); this.mira.y += (ty - this.mira.y) * Math.min(1, dt * 3);
    var resp = lento ? 0 : Math.sin(this.t * 1.1);
    this.testa.rotation.y = lento ? 0 : this.mira.x * 0.45;
    this.testa.rotation.x = lento ? 0 : this.mira.y * 0.28 + 0.015 * resp;
    this.testa.rotation.z = lento ? 0 : (st === 'ascolta' ? 0.06 : 0) + 0.01 * Math.sin(this.t * 0.6);
    this.testa.position.y = lento ? 0 : 0.012 * resp;
    /* palpebre di luce */
    this.prossimo -= dt;
    if (this.prossimo <= 0 && !lento) { this.palp = 1; this.prossimo = 2.2 + Math.random() * 4.5; }
    var chiuso = this.palp > 0 ? Math.sin(this.palp * Math.PI) : 0; this.palp = Math.max(0, this.palp - dt / 0.14);
    var vel = st === 'pensa' ? 4 : st === 'ascolta' ? 1.6 : 0.6, self = this;
    this.occhi.forEach(function (o, k) {
      o.g.scale.y = 1 - 0.92 * chiuso;
      if (!lento) o.anello.rotation.z += dt * vel * (k ? -1 : 1);
      var pulsa = st === 'ascolta' ? 0.15 * Math.sin(self.t * 6) : st === 'pensa' ? 0.2 * Math.sin(self.t * 9) : 0;
      o.gl.material.opacity = (0.5 + pulsa) * (1 - chiuso); o.gl.material.color.copy(self.colore);
      o.esterno.material.color.copy(self.colore);
    });
    this.luceOcchi.intensity = 0.8 * (1 - chiuso) + (st === 'parla' ? 0.4 * this.boc : 0);
    this.orecchie.forEach(function (a, k) { if (!lento) a.rotation.y += dt * (st === 'pensa' ? 2.5 : 0.5) * (k ? 1 : -1); });
    /* bocca: equalizzatore sul testo pronunciato */
    var target = 0;
    if (st === 'parla' && this.testo) {
      this.pos += dt * this.vel;
      var c = this.testo.charAt(Math.floor(this.pos)) || ' ';
      target = globale.BSISpectraVolto ? globale.BSISpectraVolto.apertura(c) : (/[aeiou]/i.test(c) ? 0.8 : 0.3);
      if (this.pos >= this.testo.length) target = 0.05;
    } else if (st === 'ascolta') target = 0.12;
    this.boc += (target - this.boc) * Math.min(1, dt * 20);
    var n = this.barre.length, t = this.t;
    this.barre.forEach(function (b, i) {
      var centro = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
      var h = 0.25 + (st === 'parla' ? self.boc * (0.5 + 0.9 * centro) * (0.75 + 0.25 * Math.sin(t * 23 + i * 1.7)) * 4 : st === 'pensa' ? 0.4 + 0.35 * Math.sin(t * 6 - i * 0.6) : st === 'ascolta' ? 0.35 + 0.25 * centro : 0.25);
      b.scale.y = Math.max(0.2, h);
    });
  };
  /* un ritratto fermo, per le icone: si disegna una volta e si legge come PNG */
  function foto(px) {
    return caricaThree().then(function () {
      var box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + px + 'px;height:' + px + 'px';
      document.body.appendChild(box);
      var r = new Robot(box, { foto: true }); r.ferma(); r.adatta(); r.passo(0.016); r.ren.render(r.sc, r.cam);
      var url = r.ren.domElement.toDataURL('image/png'); r.libera(); box.remove();
      return url;
    });
  }

  globale.BSISpectraRobot = {
    disponibile: function () { return webgl(); },
    crea: function (padre) { return caricaThree().then(function () { return new Robot(padre); }); },
    foto: foto, versione: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
