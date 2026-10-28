/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-androide.js — il volto di Spectra: l'androide «Noir»
   BioSpecInfo · © Samuele Pio Provenzano

   IL MODELLO
   «Noir» di Skyfox13 (https://sketchfab.com/podderkuntal25), da Sketchfab,
   licenza CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/): il
   modello e' stato modificato — texture ricompresse, tangenti tolte, viso
   reso in metallo grigio, bocca e testa animate — e l'attribuzione compare
   nella console di Spectra e nei documenti. File: models/spectra-noir.glb.

   COME SI ANIMA UN MODELLO CHE NON HA OSSA
   Il busto arriva fermo: niente scheletro, niente forme per la bocca. Quindi:
   · la TESTA si stacca dal collo (le parti del casco e del viso passano in un
     gruppo con il perno alla base del collo) e puo' ruotare: segue lo
     sguardo, respira, si inclina quando ascolta;
   · la BOCCA nasce dal profilo del viso. Lungo la linea mediana si cerca,
     sotto la punta del naso, l'incavo fra labbro superiore e inferiore: e'
     la linea della bocca. A ogni vertice sotto quella linea, nella zona
     centrale del viso, si calcola una volta sola lo spostamento che avrebbe
     se la mandibola ruotasse del suo angolo massimo attorno a un perno
     all'altezza delle orecchie; il labbro superiore si alza di poco. Lo
     shader somma quello spostamento moltiplicato per l'apertura del momento
     (un uniforme): la bocca si apre e si chiude sul testo pronunciato;
   · gli OCCHI diventano luci: si spengono in un lampo per il battito delle
     palpebre e cambiano colore con lo stato (ciano, ambra, verde acqua);
   · il VISO bianco diventa METALLO GRIGIO, conservando i rilievi del modello
     (normal map e occlusione); la calotta trasparente diventa un vetro
     sottile, cosi' il viso si vede.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var URL_MODELLO = './models/spectra-noir.glb';
  var COLORI = { attesa: 0x35e0ff, ascolta: 0x00e5ff, pensa: 0xffb547, parla: 0x5affd2 };
  var MENO_MOTO = function () { return globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  /* la linea della bocca e la mandibola, in coordinate del modello (metri) */
  var BOCCA = { y: 0.1845, sopra: 0.198, sotto: 0.179, perno: [0, 0.205, 0.035], angolo: 0.24, larga: 0.034, laterale: 0.062 };

  function carica(src, controlla) {
    return new Promise(function (ok, ko) {
      if (controlla()) return ok();
      var s = document.createElement('script'); s.src = src; s.onload = function () { ok(); }; s.onerror = function () { ko(new Error(src)); }; document.head.appendChild(s);
    });
  }
  function caricaTutto() {
    var three = globale.THREE ? Promise.resolve() : (globale.BSILab3D && globale.BSILab3D.caricaThree ? globale.BSILab3D.caricaThree() : carica('./three.min.js', function () { return !!globale.THREE; }));
    return three.then(function () { return carica('./gltf_loader.js', function () { return !!(globale.THREE && globale.THREE.GLTFLoader); }); });
  }
  var modelloInCache = null;
  function scaricaModello() {
    if (modelloInCache) return modelloInCache;
    modelloInCache = new Promise(function (ok, ko) { new globale.THREE.GLTFLoader().load(URL_MODELLO, ok, undefined, function (e) { modelloInCache = null; ko(e); }); });
    return modelloInCache;
  }
  function ambiente(T, ren) {
    var sc = new T.Scene(); sc.add(new T.Mesh(new T.BoxGeometry(20, 12, 20), new T.MeshBasicMaterial({ color: 0x0a1220, side: T.BackSide })));
    [[0, 5.5, 0, 12, 0.3, 6, 0xffffff, 3], [-9.5, 1, 2, 0.3, 6, 4, 0x9fdcff, 2.2], [9.5, 2, -1, 0.3, 5, 6, 0x5fe9ff, 2.6], [0, 0, 9.5, 8, 4, 0.3, 0xddeeff, 1.4], [3, -5.5, 3, 6, 0.3, 4, 0x223344, 1]].forEach(function (p) {
      var m = new T.Mesh(new T.BoxGeometry(p[3], p[4], p[5]), new T.MeshBasicMaterial({ color: new T.Color(p[6]).multiplyScalar(p[7]) })); m.position.set(p[0], p[1], p[2]); sc.add(m);
    });
    var pm = new T.PMREMGenerator(ren), env = pm.fromScene(sc, 0.04).texture; pm.dispose(); return env;
  }
  /* i punti del viso misurati sul modello (metri): angoli della bocca, sopracciglia, guance */
  var VISO = { angoloX: 0.043, sopraY0: 0.284, sopraY1: 0.318, guanciaY: 0.226, guanciaX: 0.05 };
  function gauss(dx, dy, r) { return Math.exp(-(dx * dx + dy * dy) / (2 * r * r)); }
  /* le espressioni: per ogni vertice lo spostamento (in metri, nel mondo del modello) a intensita' 1 */
  function campi(v) {
    var ax = Math.abs(v.x), sg = v.x < 0 ? -1 : 1, by = v.y - BOCCA.y, out = {};
    var davanti = smooth(0.06, 0.085, v.z);
    /* SORRISO: gli angoli salgono, si allargano e arretrano; le guance si sollevano */
    var ang = gauss(ax - VISO.angoloX, by, 0.014) * davanti, gu = gauss(ax - VISO.guanciaX, v.y - VISO.guanciaY, 0.018) * davanti;
    out.sorriso = [sg * 0.0035 * ang, 0.0055 * ang + 0.0022 * gu, -0.0018 * ang + 0.0008 * gu];
    /* LABBRA ARROTONDATE (o, u): gli angoli verso il centro, le labbra in avanti */
    var lab = (1 - smooth(0.012, 0.02, Math.abs(by))) * (1 - smooth(0.04, 0.055, ax)) * davanti;
    out.rotondo = [-v.x * 0.32 * lab, 0, 0.0045 * lab * (1 - ax / 0.055)];
    /* BOCCA LARGA (i, e): gli angoli verso l'esterno */
    out.largo = [sg * 0.0032 * ang, 0.0008 * ang, -0.001 * ang];
    /* SOPRACCIGLIA ALZATE: l'arcata sopra gli occhi sale, la fronte con lei */
    var arc = smooth(VISO.sopraY0 - 0.004, VISO.sopraY0 + 0.006, v.y) * (1 - smooth(VISO.sopraY1, VISO.sopraY1 + 0.03, v.y)) * (1 - smooth(0.066, 0.08, ax)) * davanti;
    out.sopra = [0, 0.0075 * arc, 0.001 * arc];
    /* SOPRACCIGLIA AGGROTTATE: la parte interna scende e si avvicina */
    var interna = arc * (1 - smooth(0.012, 0.04, ax));
    out.accigliato = [-sg * 0.003 * interna, -0.0055 * interna, 0.0016 * interna];
    return out;
  }

  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  /* lo spostamento della mandibola aperta, per ogni vertice del viso, in coordinate locali della mesh */
  function preparaBocca(T, mesh) {
    var g = mesh.geometry, pos = g.attributes.position, n = pos.count, sp = new Float32Array(n * 3), banda = new Float32Array(n);
    var M = mesh.matrixWorld, inv = new T.Matrix4().copy(M).invert ? new T.Matrix4().copy(M).invert() : new T.Matrix4().getInverse(M);
    var v = new T.Vector3(), w = new T.Vector3(), l = new T.Vector3(), P = BOCCA.perno, ca = Math.cos(BOCCA.angolo), sa = Math.sin(BOCCA.angolo), toccati = 0;
    for (var i = 0; i < n; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(M);
      var lat = 1 - smooth(BOCCA.larga, BOCCA.laterale, Math.abs(v.x));
      if (lat <= 0 || v.z < 0.07) continue;
      var giu = 1 - smooth(BOCCA.sotto, BOCCA.y, v.y), su = v.y > BOCCA.y ? (1 - smooth(BOCCA.y, BOCCA.sopra, v.y)) * smooth(BOCCA.y - 0.001, BOCCA.y + 0.003, v.y) : 0;
      var peso = giu * lat;
      /* la fascia fra le labbra: si scurisce quando la bocca si apre, ed e' l'interno della bocca */
      banda[i] = lat * smooth(BOCCA.sotto - 0.002, BOCCA.y - 0.0005, v.y) * (1 - smooth(BOCCA.y + 0.0005, BOCCA.y + 0.004, v.y));
      if (peso > 0) {
        /* rotazione attorno all'asse x passante per il perno (il mento scende e arretra) */
        var dy = v.y - P[1], dz = v.z - P[2];
        w.set(v.x, P[1] + dy * ca - dz * sa, P[2] + dy * sa + dz * ca);
        w.sub(v).multiplyScalar(peso).add(v);
      } else if (su > 0) {
        w.set(v.x, v.y + 0.006 * su * lat, v.z + 0.0012 * su * lat);
      } else continue;
      l.copy(w).applyMatrix4(inv); v.fromBufferAttribute(pos, i);
      sp[3 * i] = l.x - v.x; sp[3 * i + 1] = l.y - v.y; sp[3 * i + 2] = l.z - v.z; toccati++;
    }
    g.setAttribute('aBocca', new T.BufferAttribute(sp, 3));
    /* gli altri campi espressivi, con la stessa conversione mondo → locale */
    var NOMI = ['sorriso', 'rotondo', 'largo', 'sopra', 'accigliato'], buf = {};
    NOMI.forEach(function (k) { buf[k] = new Float32Array(n * 3); });
    for (var j = 0; j < n; j++) {
      v.fromBufferAttribute(pos, j).applyMatrix4(M);
      var c = campi(v), loc = new T.Vector3().fromBufferAttribute(pos, j);
      NOMI.forEach(function (k) {
        var d = c[k]; if (!d[0] && !d[1] && !d[2]) return;
        l.set(v.x + d[0], v.y + d[1], v.z + d[2]).applyMatrix4(inv);
        buf[k][3 * j] = l.x - loc.x; buf[k][3 * j + 1] = l.y - loc.y; buf[k][3 * j + 2] = l.z - loc.z;
      });
    }
    NOMI.forEach(function (k) { g.setAttribute('aE_' + k, new T.BufferAttribute(buf[k], 3)); });
    g.setAttribute('aBanda', new T.BufferAttribute(banda, 1));
    return toccati;
  }

  function Androide(padre, gltf) {
    var T = globale.THREE, self = this;
    this.T = T; this.padre = padre;
    var ren = new T.WebGLRenderer({ antialias: true, alpha: true });
    ren.setPixelRatio(Math.min(2, globale.devicePixelRatio || 1)); ren.setClearColor(0, 0);
    ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.1;
    ren.domElement.style.cssText = 'width:100%;height:100%;display:block'; ren.domElement.setAttribute('aria-hidden', 'true');
    padre.appendChild(ren.domElement); this.ren = ren;
    var sc = new T.Scene(); this.sc = sc; sc.environment = ambiente(T, ren);
    sc.add(new T.HemisphereLight(0xcfe8ff, 0x0a1018, 0.45));
    var key = new T.DirectionalLight(0xfff4e8, 1.6); key.position.set(-0.6, 0.8, 1.2); sc.add(key);
    var rim = new T.DirectionalLight(0x5fe9ff, 2.0); rim.position.set(0.9, 0.5, -0.8); sc.add(rim);
    var rim2 = new T.DirectionalLight(0x8a7bff, 0.8); rim2.position.set(-0.9, -0.2, -0.6); sc.add(rim2);

    /* il modello: una copia per questa scena (il file si scarica una volta sola) */
    var m = gltf.scene.clone(true); m.updateMatrixWorld(true);
    var parti = {}; m.traverse(function (o) { if (o.isMesh) { parti[o.name] = o; o.material = o.material.clone(); o.geometry = o.geometry.clone(); } });
    this.radice = new T.Group(); sc.add(this.radice); this.radice.add(m); m.updateMatrixWorld(true);
    /* il viso: metallo grigio con i rilievi originali */
    var faccia = parti.Object_2;
    if (faccia) {
      var o = faccia.material;
      faccia.material = new T.MeshStandardMaterial({ color: 0x9aa4ae, metalness: 0.92, roughness: 0.3, normalMap: o.normalMap || null, normalScale: new T.Vector2(1.2, 1.2), aoMap: o.aoMap || null, aoMapIntensity: 0.8, envMapIntensity: 1.35 });
      this.toccati = preparaBocca(T, faccia);
      this.uBocca = { value: 0 };
      this.uE = { sorriso: { value: 0 }, rotondo: { value: 0 }, largo: { value: 0 }, sopra: { value: 0 }, accigliato: { value: 0 } };
      var uB = this.uBocca, uE = this.uE;
      faccia.material.onBeforeCompile = function (s) {
        s.uniforms.uBocca = uB;
        Object.keys(uE).forEach(function (k) { s.uniforms['uE_' + k] = uE[k]; });
        var dich = Object.keys(uE).map(function (k) { return 'attribute vec3 aE_' + k + ';\nuniform float uE_' + k + ';'; }).join('\n') + '\n';
        var somma = Object.keys(uE).map(function (k) { return '  transformed += aE_' + k + ' * uE_' + k + ';'; }).join('\n');
        s.vertexShader = dich + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + somma);
        s.vertexShader = 'attribute vec3 aBocca;\nattribute float aBanda;\nuniform float uBocca;\nvarying float vBanda;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += aBocca * uBocca;\n  vBanda = aBanda;');
        s.fragmentShader = 'uniform float uBocca;\nvarying float vBanda;\n' + s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= 1.0 - 0.94 * clamp(vBanda * uBocca * 1.6, 0.0, 1.0);').replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 1.0, clamp(vBanda * uBocca * 1.6, 0.0, 1.0));');
      };
    }
    ['Object_4'].forEach(function (k) { var x = parti[k]; if (x) { x.material.color = new T.Color(0x8d969f); x.material.metalness = 0.9; x.material.roughness = 0.35; } });
    /* la calotta trasparente: un vetro sottile */
    var vis = parti.Object_5;
    if (vis) vis.material = new T.MeshPhysicalMaterial({ color: 0xcfe8ff, metalness: 0.1, roughness: 0.06, clearcoat: 1, transparent: true, opacity: 0.14, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.6 });
    /* gli occhi: luci */
    this.matOcchi = new T.MeshBasicMaterial({ color: COLORI.attesa, toneMapped: false });
    var occhi = parti.Object_3; if (occhi) occhi.material = this.matOcchi;
    /* la testa si stacca dal collo: tutto tranne collo e spalle, con il perno alla base del collo */
    var perno = new T.Group(); perno.position.set(0, 0.165, -0.02); this.radice.add(perno); this.radice.updateMatrixWorld(true);
    Object.keys(parti).forEach(function (k) { if (k !== 'Object_6') perno.attach(parti[k]); });
    this.perno = perno;
    /* il busto e' modellato con la testa china: la si raddrizza */
    this.riposo = -0.42; perno.rotation.x = this.riposo;
    /* luce che esce dagli occhi, e bagliori */
    this.luceOcchi = new T.PointLight(COLORI.attesa, 0.35, 0.4); this.luceOcchi.position.set(0, 0.29, 0.12); perno.add(this.luceOcchi);
    /* inquadratura: la testa al centro del medaglione */
    var cam = new T.PerspectiveCamera(26, 1, 0.01, 10); this.cam = cam;
    this.radice.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(perno), c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
    this.centro = c; cam.position.set(c.x, c.y + s.y * 0.06, c.z + Math.max(s.x, s.y) * 1.75); cam.lookAt(c.x, c.y + s.y * 0.02, c.z);
    this.st = 'attesa'; this.t = 0; this.palp = 0; this.prossimo = 1.6; this.mira = { x: 0, y: 0, tx: 0, ty: 0 };
    this.testo = ''; this.pos = 0; this.boc = 0; this.vel = 13;
    this.colore = new T.Color(COLORI.attesa); this.coloreT = new T.Color(COLORI.attesa);
    this._muovi = function (e) { var r = padre.getBoundingClientRect(); if (!r.width) return; self.mira.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.5))); self.mira.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.5))); };
    document.addEventListener('pointermove', this._muovi, { passive: true });
    this.adatta(); this.avvia();
  }
  Androide.prototype.adatta = function () { var w = this.padre.clientWidth || 300, h = this.padre.clientHeight || w; if (this._w === w && this._h === h) return; this._w = w; this._h = h; this.ren.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); };
  Androide.prototype.stato = function (s) { this.st = s || 'attesa'; if (s !== 'parla') this.testo = ''; this.coloreT.setHex(COLORI[this.st] || COLORI.attesa); this.avvia(); };
  Androide.prototype.dici = function (f) { this.testo = String(f || ''); this.pos = 0; this.st = 'parla'; this.coloreT.setHex(COLORI.parla); this.avvia(); };
  Androide.prototype.allinea = function (i) { if (this.testo) this.pos = Math.max(this.pos, i); };
  Androide.prototype.taci = function () { this.testo = ''; if (this.st === 'parla') this.stato('attesa'); };
  Androide.prototype.avvia = function () {
    if (this.raf) return; var self = this, prec = 0;
    (function giro(ora) {
      if (!self.ren.domElement.isConnected) { self.raf = 0; self.libera(); return; }
      var dt = prec ? Math.min(0.05, (ora - prec) / 1000) : 0.016; prec = ora;
      if (self.padre.offsetParent !== null) { self.adatta(); self.passo(dt); self.ren.render(self.sc, self.cam); }
      self.raf = globale.requestAnimationFrame(giro);
    })(0);
  };
  Androide.prototype.ferma = function () { if (this.raf) globale.cancelAnimationFrame(this.raf); this.raf = 0; };
  Androide.prototype.libera = function () {
    document.removeEventListener('pointermove', this._muovi);
    this.sc.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); }); });
    try { this.ren.dispose(); } catch (e) {}
  };
  /* IL COMPORTAMENTO. Ogni fotogramma si decide dove guarda, che espressione ha, come
     muove la bocca. Niente e' registrato in anticipo: tutto nasce dallo stato (ascolta,
     pensa, parla, attesa), dal testo che sta dicendo, dalla voce dell'utente e dallo
     stato interno della mente di Spectra. */
  var VISEMI = { a: [1, 0, 0.1], à: [1, 0, 0.1], e: [0.6, 0, 0.55], è: [0.7, 0, 0.45], é: [0.55, 0, 0.6], i: [0.32, 0, 0.9], ì: [0.32, 0, 0.9], o: [0.7, 0.85, 0], ò: [0.8, 0.8, 0], u: [0.4, 1, 0], ù: [0.4, 1, 0],
    m: [0, 0.1, 0], b: [0, 0.1, 0], p: [0, 0.1, 0], f: [0.12, 0, 0.3], v: [0.12, 0, 0.3], s: [0.18, 0, 0.6], z: [0.2, 0, 0.5], c: [0.25, 0, 0.4], g: [0.3, 0, 0.2], l: [0.35, 0, 0.3], r: [0.3, 0.1, 0.2], t: [0.22, 0, 0.35], d: [0.25, 0, 0.3], n: [0.22, 0, 0.3], q: [0.35, 0.6, 0], ' ': [0.05, 0, 0] };
  function visema(c) { c = (c || '').toLowerCase(); return VISEMI[c] || (/[a-z]/.test(c) ? [0.28, 0, 0.2] : [0.04, 0, 0]); }
  function avvicina(x, y, k) { return x + (y - x) * Math.min(1, k); }
  Androide.prototype.ascolto = function (energia) { this.energiaUtente = Math.max(this.energiaUtente || 0, energia || 0); };
  Androide.prototype.parola = function () { this.cenno = 1; };
  Androide.prototype.passo = function (dt) {
    var lento = MENO_MOTO(), st = this.st, self = this, T = this.t += dt;
    var mente = globale.BSISpectraMente ? globale.BSISpectraMente.stato() : { curiosita: 0.5, attenzione: 0.5, premura: 0.2 };
    this.colore.lerp(this.coloreT, Math.min(1, dt * 5));
    /* ── palpebre di luce: a volte doppie, piu' rade quando ascolta con attenzione ── */
    this.prossimo -= dt;
    if (this.prossimo <= 0 && !lento) { this.palp = 1; this.prossimo = Math.random() < 0.18 ? 0.28 : (st === 'ascolta' ? 3.5 : 2) + Math.random() * 4; }
    var chiuso = this.palp > 0 ? Math.sin(this.palp * Math.PI) : 0; this.palp = Math.max(0, this.palp - dt / 0.12);
    var pulsa = st === 'pensa' ? 0.22 * Math.sin(T * 7.5) : st === 'ascolta' ? 0.12 * Math.sin(T * 4.5) : 0.04 * Math.sin(T * 1.3);
    this.matOcchi.color.copy(this.colore).multiplyScalar((1.2 + pulsa + 0.25 * mente.attenzione) * (1 - 0.92 * chiuso));
    this.luceOcchi.color.copy(this.colore); this.luceOcchi.intensity = (0.32 + 0.2 * pulsa) * (1 - chiuso);
    /* ── lo sguardo: il puntatore, piu' micro-movimenti rapidi e qualche occhiata altrove ── */
    this.saccade = this.saccade || { x: 0, y: 0, t: 0.8, altrove: 9 };
    this.saccade.t -= dt; this.saccade.altrove -= dt;
    if (this.saccade.t <= 0) { this.saccade.x = (Math.random() - 0.5) * 0.12; this.saccade.y = (Math.random() - 0.5) * 0.08; this.saccade.t = 0.6 + Math.random() * 1.8; }
    if (this.saccade.altrove <= 0 && st === 'attesa') { this.saccade.x = (Math.random() < 0.5 ? -1 : 1) * (0.45 + Math.random() * 0.3); this.saccade.y = (Math.random() - 0.4) * 0.3; this.saccade.t = 1.2 + Math.random(); this.saccade.altrove = 8 + Math.random() * 10; }
    var tx = this.mira.tx + this.saccade.x, ty = this.mira.ty + this.saccade.y;
    if (st === 'pensa') { tx = 0.45 + 0.15 * Math.sin(T * 0.6); ty = -0.5 + 0.05 * Math.sin(T * 1.7); }
    if (st === 'parla') { tx = this.mira.tx * 0.6 + this.saccade.x * 0.5; ty = this.mira.ty * 0.5; }
    this.mira.x += (tx - this.mira.x) * Math.min(1, dt * (Math.abs(tx - this.mira.x) > 0.2 ? 6 : 3)); this.mira.y += (ty - this.mira.y) * Math.min(1, dt * 4);
    /* ── la bocca: il visema della lettera che la voce sta dicendo ── */
    var vis = [0, 0, 0], domanda = false;
    if (st === 'parla' && this.testo) {
      this.pos += dt * this.vel;
      var i = Math.floor(this.pos), c = this.testo.charAt(i) || ' ';
      vis = i >= this.testo.length ? [0, 0, 0] : visema(c);
      domanda = /\?/.test(this.testo);
      /* una parola nuova: piccolo cenno del capo (la prosodia) */
      if (c === ' ' && this._ultimoSpazio !== i) { this._ultimoSpazio = i; if (Math.random() < 0.45) this.cenno = 0.6 + Math.random() * 0.5; }
    }
    this.boc = avvicina(this.boc, vis[0], dt * 18);
    this.rot = avvicina(this.rot || 0, vis[1], dt * 14);
    this.lar = avvicina(this.lar || 0, vis[2], dt * 14);
    /* ── le espressioni: lo stato del momento e lo stato della mente ── */
    var sorrisoT = st === 'attesa' ? 0.25 + 0.3 * mente.premura : st === 'ascolta' ? 0.22 : st === 'parla' ? 0.18 + 0.15 * mente.curiosita : 0.02;
    var sopraT = st === 'ascolta' ? 0.45 + 0.4 * mente.curiosita : st === 'parla' ? (domanda ? 0.75 : 0.18) + 0.5 * (this.cenno || 0) : st === 'pensa' ? 0.15 : 0.1 + 0.2 * mente.curiosita;
    var accT = st === 'pensa' ? 0.75 : st === 'ascolta' ? 0.05 : 0;
    /* l'ascolto attivo: annuisce quando l'utente parla */
    this.energiaUtente = (this.energiaUtente || 0) * Math.pow(0.05, dt);
    if (st === 'ascolta' && this.energiaUtente > 0.35 && !this._annuendo) { this._annuendo = true; this.cenno = 1; setTimeout(function () { self._annuendo = false; }, 900 + Math.random() * 900); }
    var E = this.uE;
    if (E) {
      E.sorriso.value = avvicina(E.sorriso.value, sorrisoT, dt * 2.5);
      E.sopra.value = avvicina(E.sopra.value, sopraT, dt * 5);
      E.accigliato.value = avvicina(E.accigliato.value, accT, dt * 3);
      E.rotondo.value = this.rot; E.largo.value = this.lar;
    }
    if (this.uBocca) this.uBocca.value = this.boc;
    /* ── la testa: sguardo, cenni, respiro, inclinazioni ── */
    this.cenno = Math.max(0, (this.cenno || 0) - dt * 2.4);
    var cennoAng = Math.sin((1 - this.cenno) * Math.PI) * this.cenno * 0.09;
    var resp = lento ? 0 : Math.sin(T * 1.05);
    this.perno.rotation.y = lento ? 0 : this.mira.x * 0.42;
    this.perno.rotation.x = this.riposo + (lento ? 0 : this.mira.y * 0.24 + 0.012 * resp + cennoAng + 0.015 * this.boc);
    this.perno.rotation.z = lento ? 0 : (st === 'ascolta' ? 0.075 : st === 'pensa' ? -0.04 : 0) + 0.012 * Math.sin(T * 0.6) + this.mira.x * 0.04;
    this.radice.position.y = lento ? 0 : 0.0016 * resp;
    this.radice.scale.y = lento ? 1 : 1 + 0.0035 * resp;
  };

  globale.BSISpectraAndroide = {
    URL: URL_MODELLO, BOCCA: BOCCA,
    disponibile: function () { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } },
    crea: function (padre) { return caricaTutto().then(scaricaModello).then(function (g) { return new Androide(padre, g); }); },
    /* una foto del volto per le icone: si disegna una volta e si legge come PNG */
    foto: function (px) {
      return caricaTutto().then(scaricaModello).then(function (g) {
        var box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + px + 'px;height:' + px + 'px';
        document.body.appendChild(box);
        var a = new Androide(box, g); a.ferma(); a.adatta(); a.passo(0.016);
        /* per l'icona si inquadra solo il viso */
        a.cam.fov = 17; a.cam.position.y += 0.012; a.cam.updateProjectionMatrix(); a.ren.render(a.sc, a.cam);
        var url = a.ren.domElement.toDataURL('image/png'); a.libera(); box.remove(); return url;
      });
    },
    versione: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
