/* ════════════════════════════════════════════════════════════════════════
   BioSpecInfo · bsi-spectra-figura.js  (v240)
   © Samuele Pio Provenzano

   SPECTRA COL CORPO, IN UN MODULO SOLO.
   Lo studio (spectra-studio.html) e le sezioni dell'AI (Spectra AI e le tre aree
   con l'assistente: Chimica, Fisica, Matematica) mostrano lo stesso Spectra: lo
   stesso corpo, lo stesso viso «Noir» con le espressioni, lo stesso cappuccio, la
   stessa definizione. Per questo la logica sta qui e non e' copiata due volte.

   1. IL CORPO (Spectra): in una scena three.js gia' esistente.
      Ordine: il corpo caricato dall'utente dal suo dispositivo (IndexedDB
      «bsi-spectra-modelli»: il modello dell'autore e' di CGTrader con licenza
      Royalty Free, che non permette di renderlo scaricabile, quindi non sta sul
      server) → models/spectra-corpo.glb (solo in sviluppo, escluso da git) →
      models/spectra-cyberpunk.glb (un modello completo, col suo viso) → NIENTE:
      Spectra e' solo quel corpo (richiesta dell'autore), senza sostituti; chi usa il
      controllore mostra l'invito a caricarlo. Il manichino riggato esiste solo
      per il banco del driver (opz.manichino === true). Il corpo senza scheletro passa dal rig automatico
      (bsi-spectra-rig.js); sopra il collo va il viso «Noir»
      (bsi-spectra-androide.js), allineato misurando il mento.
   2. LA FIGURA (monta): un riquadro con la sua scena (il laboratorio della
      lezione: griglia al neon, pannelli olografici, pedana), Spectra in piedi,
      intero; i pulsanti Corpo, Parla con me, 🧠 Spiega (la spiegazione esaustiva
      della finestra di Spectra, bsi-spectra-spiega.js), Studio. Ascolta l'app:
      · «bsi-spectra-stato» (pensa / strumenti / scrive) → si concentra, mano al mento;
      · «bsi-spectra-risposta» (la risposta del modello) → spiega con le mani, il
        viso legge il testo (labiale), l'emozione segue il contenuto;
      · «bsi-spectra-dice» (Spectra Live che parla, l'assistente che risolve) → idem.
      Si disegna solo quando e' visibile e la pagina e' in primo piano.
   3. LE SEZIONI DELL'AI (sezioni): una figura sola, spostata nella sezione AI
      aperta (un contesto WebGL solo, anche su telefono); la scheda «🧠 Spiega»
      della finestra di Spectra ha la precedenza, perche' e' Spectra che spiega.

   API: BSISpectraFigura.Spectra(T, scena, renderer, opz) → controllore del corpo
        BSISpectraFigura.monta(contenitore, opz) → figura
        BSISpectraFigura.sezioni(['sai', 'sareachim', …]) → figura condivisa
        BSISpectraFigura.dbCorpo('leggi' | 'metti' | 'togli', buffer)
   ════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var D = globale.document;
  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() !== 'it') ? en : it; }

  /* ── il corpo conservato sul dispositivo ── */
  var DB = { nome: 'bsi-spectra-modelli', archivio: 'file', chiave: 'corpo' }, LIMITE = 60 * 1024 * 1024;
  function dbCorpo(modo, valore) {
    return new Promise(function (ok) {
      try {
        var rq = indexedDB.open(DB.nome, 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore(DB.archivio); };
        rq.onerror = function () { ok(null); };
        rq.onsuccess = function () {
          var db = rq.result, tx = db.transaction(DB.archivio, modo === 'leggi' ? 'readonly' : 'readwrite'), st = tx.objectStore(DB.archivio);
          var op = modo === 'leggi' ? st.get(DB.chiave) : modo === 'togli' ? st.delete(DB.chiave) : st.put(valore, DB.chiave);
          op.onsuccess = function () { ok(modo === 'leggi' ? op.result || null : true); db.close(); };
          op.onerror = function () { ok(null); db.close(); };
        };
      } catch (e) { ok(null); }
    });
  }

  /* i parametri del corpo dell'autore: cappuccio allargato, apertura del viso, definizione (vedi bsi-spectra-rig.js) */
  var RIG = { altezza: 1.8, togliTesta: true, cappuccio: true, gonfia: 1.22, viso: { y: 1.6, ax: 0.09, ay: 0.09 }, suddividi: 1 };

  /* ═══ 1. IL CONTROLLORE DEL CORPO ═══════════════════════════════════════ */
  function Spectra(T, sc, ren, opz) {
    opz = opz || {}; var self = this;
    this.T = T; this.sc = sc; this.ren = ren; this.opz = opz;
    this.pos = opz.posizione ? opz.posizione.clone() : new T.Vector3(); this.rotY = opz.rotY || 0;
    /* (v240) Spectra e' SOLO il corpo scelto dall'autore: senza quel corpo non c'e' un sostituto (niente manichino,
       salvo che lo si chieda con opz.manichino === true, come fa il banco del driver). Finche' il corpo non c'e', la radice
       e' un gruppo vuoto e il corpo e' nullo: chi usa il controllore mostra l'invito a caricarlo. */
    if (opz.manichino === true) { this.radice = globale.BSISpectraCorpo.manichino({ neon: 0x2f6bff }); this.corpo = globale.BSISpectraCorpo.crea(this.radice, {}); }
    else { this.radice = new T.Group(); this.radice.name = 'SpectraVuoto'; this.corpo = null; }
    this.radice.position.copy(this.pos); this.radice.rotation.y = this.rotY; sc.add(this.radice);
    this.volto = null; this.rig = null; this.allinea = 0; this.supportoVolto = null; this.modelloVero = null; this.modelloRiggato = null; this.corpoLocale = false; this.viso = null;
    this.contenitore = opz.contenitore || D.body;
    if (opz.volto !== false && this.corpo) this.creaVolto();
  }
  Spectra.prototype.cambiato = function () { if (this.opz.cambiato) try { this.opz.cambiato(this); } catch (e) {} };
  Spectra.prototype.sostituisci = function (m) {
    var prima = this.radice; m.position.copy(prima.position); m.rotation.y = prima.rotation.y;
    this.sc.remove(prima); this.sc.add(m); this.radice = m;
  };
  /* un corpo senza scheletro (gltf.scene) → rig, viso «Noir» */
  Spectra.prototype.usa = function (g) {
    var T = this.T, o = {}; Object.keys(RIG).forEach(function (k) { o[k] = RIG[k]; }); o.T = T; o.anisotropia = this.ren.capabilities.getMaxAnisotropy();
    if (this.opz.suddividi != null) o.suddividi = this.opz.suddividi;
    var R = globale.BSISpectraRig.rigga(g.scene, o); if (!R) return false;
    this.sostituisci(R.radice);
    this.corpo = globale.BSISpectraCorpo.crea(R.radice, { scalaOssa: 1 }); this.rig = R; R.viso = 0.065; this.modelloRiggato = this.corpo.rapporto();
    /* se prima c'era un modello completo (con il suo viso) il volto «Noir» era stato tolto: lo si ricrea */
    this.modelloVero = null; this.viso = null;
    if (this.volto) this.attaccaVolto(this.volto); else if (this.opz.volto !== false) this.creaVolto();
    this.cambiato(); return true;
  };
  Spectra.prototype.daBuffer = function (buf) {
    var self = this, T = this.T;
    return new Promise(function (ok) {
      if (!T.GLTFLoader || !globale.BSISpectraRig) return ok(false);
      try { new T.GLTFLoader().parse(buf, './', function (g) { ok(self.usa(g)); }, function () { ok(false); }); } catch (e) { ok(false); }
    });
  };
  /* un file scelto dall'utente: si prova e, se va, si conserva sul dispositivo */
  Spectra.prototype.daFile = function (f) {
    var self = this;
    if (!f) return Promise.resolve({ ok: false, motivo: 'nessuno' });
    if (f.size > LIMITE) return Promise.resolve({ ok: false, motivo: 'grande' });
    return f.arrayBuffer().then(function (buf) {
      return self.daBuffer(buf).then(function (ok) {
        if (!ok) return { ok: false, motivo: 'forma' };
        self.corpoLocale = true;
        return dbCorpo('metti', buf).then(function () { try { D.dispatchEvent(new CustomEvent('bsi-spectra-corpo', { detail: { nuovo: true } })); } catch (e) {} return { ok: true }; });
      });
    });
  };
  Spectra.prototype.carica = function () {
    var self = this, T = this.T;
    return dbCorpo('leggi').then(function (buf) {
      if (buf) return self.daBuffer(buf).then(function (f) { if (f) self.corpoLocale = true; return f; });
      if (self.opz.soloDispositivo) return false;
      return fetch('./models/spectra-corpo.glb', { method: 'HEAD' }).then(function (r) {
        if (!r.ok) return false;
        return fetch('./models/spectra-corpo.glb').then(function (x) { return x.arrayBuffer(); }).then(function (b) { return self.daBuffer(b); });
      });
    }).catch(function () { return false; }).then(function (fatto) {
      if (fatto || self.opz.soloDispositivo) return fatto;
      /* un modello completo (con il suo viso), se c'e' */
      return fetch('./models/spectra-cyberpunk.glb', { method: 'HEAD' }).then(function (r) {
        if (!r.ok || !T.GLTFLoader) return false;
        return new Promise(function (ok) {
          new T.GLTFLoader().load('./models/spectra-cyberpunk.glb', function (g) {
            var m = g.scene, bb = new T.Box3().setFromObject(m), alto = bb.max.y - bb.min.y || 1;
            m.scale.setScalar(1.8 / alto); self.sostituisci(m); m.position.y = self.pos.y - bb.min.y * 1.8 / alto; self.allinea = 0;
            self.corpo = globale.BSISpectraCorpo.crea(m, { animazioni: g.animations, scalaOssa: 1 });
            if (!self.corpo.rapporto().blendshape || self.corpo.rapporto().blendshape.indexOf('0/') === 0) self.viso = self.corpo.visoProcedurale();
            self.modelloVero = self.corpo.rapporto();
            if (self.volto && self.volto.radice.parent) self.volto.radice.parent.remove(self.volto.radice);   /* il modello vero ha il suo viso */
            self.cambiato(); ok(true);
          }, undefined, function () { ok(false); });
        });
      }).catch(function () { return false; });
    });
  };
  Spectra.prototype.creaVolto = function () {
    var self = this, A0 = globale.BSISpectraAndroide;
    if (!A0 || !A0.disponibile()) return Promise.resolve(null);
    return A0.crea(this.contenitore, { scena: this.sc, renderer: this.ren, senzaBusto: true }).then(function (A) {
      /* il modello vero ha il suo viso: il volto «Noir» non serve e non deve restare nella scena */
      if (self.modelloVero) { if (A.radice.parent) A.radice.parent.remove(A.radice); return null; }
      if (!self.attaccaVolto(A)) return null;
      self.volto = A; A.stato('attesa'); self.cambiato();
      try { globale.dispatchEvent(new Event('spectra-volto')); } catch (e) {}
      return A;
    }).catch(function () { return null; });
  };
  /* il volto sulla testa del corpo attuale (manichino o corpo riggato) */
  Spectra.prototype.attaccaVolto = function (A) {
    var T = this.T, testa = this.corpo && this.corpo.ossa.testa; if (!testa) { if (A.radice.parent) A.radice.parent.remove(A.radice); return false; }
    this.radice.traverse(function (o) { if (o.isMesh && /Spectra_Head|Hair/.test(o.name)) o.visible = false; if (o.isBone && /Eye$/.test(o.name)) o.visible = false; });
    /* un supporto fra l'osso e il volto: il volto muove da se' la sua radice, quindi l'allineamento sposta il supporto */
    if (this.supportoVolto && this.supportoVolto.parent) this.supportoVolto.parent.remove(this.supportoVolto);
    var sup = this.supportoVolto = new T.Group(); sup.name = 'SupportoVolto'; testa.add(sup);
    var R = this.rig, k = R ? 0.96 * (R.scalaTesta || 1) : 0.82;   /* sul corpo riggato il viso riempie l'apertura del cappuccio */
    /* sul corpo riggato il cappuccio fa da testa: del volto «Noir» resta solo il viso (maschera, occhi, dettagli); i
       movimenti della testa li fa il corpo (volto «solidale») */
    A.solidale = !!R;
    if (A.parti) Object.keys(A.parti).forEach(function (q) { if (A.parti[q] && A.parti[q].isMesh && q !== 'Object_6') A.parti[q].visible = R ? /^Object_[234]$/.test(q) : true; });
    sup.add(A.radice); A.radice.scale.setScalar(k); A.radice.position.set(0, 0, 0); A.radice.rotation.set(0, 0, 0);
    A.riposo = -0.18;
    this.allinea = 40;   /* l'allineamento si fa nei primi fotogrammi (vedi passo) */
    return true;
  };
  /* il fotogramma: corpo, viso, allineamento del mento */
  Spectra.prototype.presente = function () { return !!(this.corpo && (this.rig || this.modelloVero || this.opz.manichino === true)); };
  Spectra.prototype.passo = function (dt, guardaQui) {
    var T = this.T, C = this.corpo; if (!C) return;
    if (guardaQui) C.guarda(guardaQui);
    C.passo(dt); if (this.volto && !this.modelloVero) this.volto.passo(dt);
    /* ALLINEAMENTO DEL VOLTO, misurato: il mento va 1 cm sopra l'osso della testa (manichino) o 4,5 cm sopra l'osso del
       collo (corpo riggato, dove il rig ha tagliato la testa). Si corregge finche' lo scarto e' sotto il millimetro. */
    if (this.allinea > 0 && this.volto && this.volto.parti && this.volto.parti.Object_2) {
      this.allinea--; this.radice.updateMatrixWorld(true);
      var bbv = new T.Box3().setFromObject(this.volto.parti.Object_2), tb = C.ossa.testa, tp = tb.getWorldPosition(new T.Vector3());
      var fw = new T.Vector3(0, 0, 1).applyQuaternion(this.radice.quaternion), R = this.rig;
      var vuoi = R && C.ossa.collo ? C.ossa.collo.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.045 * (R.scalaTesta || 1), 0)).addScaledVector(fw, R.viso || 0.035) : tp.clone().add(new T.Vector3(0, 0.01, 0)).addScaledVector(fw, 0.03);
      var mento = new T.Vector3((bbv.min.x + bbv.max.x) / 2, bbv.min.y, (bbv.min.z + bbv.max.z) / 2);
      var d = vuoi.sub(mento); if (d.length() < 0.001) this.allinea = 0;
      d.applyQuaternion(tb.getWorldQuaternion(new T.Quaternion()).invert()); (this.supportoVolto || this.volto.radice).position.add(d);
    }
  };
  /* parlare, emozioni, gesti: corpo e viso insieme */
  Spectra.prototype.emozione = function (e, s) { if (this.corpo) this.corpo.emozione(e, s || 5); if (this.volto) this.volto.espressione(e, s || 5); };
  Spectra.prototype.dici = function (testo) { if (this.corpo) this.corpo.dici(testo); if (this.volto) this.volto.dici(testo); };
  Spectra.prototype.taci = function () { if (this.corpo) this.corpo.taci(); if (this.volto) this.volto.taci(); };
  Spectra.prototype.fai = function (g, b, s) { if (this.corpo) this.corpo.fai(g, b, s); };
  /* un corpo gia' in memoria (gltf.scene o una scena qualunque con la figura): per le prove e per chi lo ha gia' caricato */
  Spectra.prototype.usaScena = function (scena) { return this.usa({ scene: scena }); };

  /* l'emozione di una risposta, dal testo (poche regole, prudenti) */
  function emozioneDi(s) {
    s = String(s || '').toLowerCase();
    if (/errore|non riesco|non e' possibile|non è possibile|mi dispiace|sorry|cannot|can't/.test(s)) return 'dubbio';
    if (/attenzione|pericol|tossic|warning|danger/.test(s)) return 'concentrata';
    if (/sorprendente|incredibile|curios|amazing|surprising/.test(s)) return 'sorpresa';
    if (/!|ottimo|perfetto|esatto|bravo|great|well done|correct/.test(s)) return 'gioia';
    return 'sorrisoCaldo';
  }
  function perIlViso(s) { return String(s || '').replace(/```[\s\S]*?```/g, ' ').replace(/[`*_#>|$\\{}]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 420); }

  /* ═══ 2. LA FIGURA: un riquadro con Spectra in piedi ═══════════════════ */
  var CSS = '.bsiSF{position:relative;border:1px solid rgba(107,207,255,.28);border-radius:16px;overflow:hidden;margin:0 0 14px;background:radial-gradient(120% 90% at 30% 100%,#0d1d3a 0%,#060b18 55%,#040814 100%);min-height:300px;height:clamp(300px,46vh,440px)}' +
    '.bsiSF canvas{display:block;width:100%!important;height:100%!important;touch-action:pan-y}' +
    '.bsiSF-hud{position:absolute;left:12px;top:10px;right:12px;display:flex;align-items:center;gap:8px;pointer-events:none;font:800 11px/1.2 ui-monospace,monospace;letter-spacing:.18em;color:#6bcfff;text-transform:uppercase}' +
    '.bsiSF-hud b{color:#e9f3ff}.bsiSF-led{width:8px;height:8px;border-radius:50%;background:#00c9b7;box-shadow:0 0 10px #00c9b7}' +
    '.bsiSF-az{position:absolute;right:10px;bottom:10px;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}' +
    /* sul telefono i pulsanti flottanti dell\'app stanno a destra: i pulsanti della figura vanno a sinistra, in colonna */
    '@media (max-width:640px){.bsiSF-az{right:auto;left:10px;flex-direction:column;align-items:flex-start}}' +
    '.bsiSF-az button,.bsiSF-az a{background:rgba(13,21,34,.86);border:1px solid rgba(107,207,255,.35);color:#cfe2ff;border-radius:999px;padding:7px 11px;font:700 12px system-ui;cursor:pointer;text-decoration:none;min-height:34px}' +
    '.bsiSF-az button:focus-visible,.bsiSF-az a:focus-visible{outline:2px solid #00c9b7;outline-offset:2px}' +
    '.bsiSF-nota{position:absolute;left:12px;bottom:12px;max-width:52%;font:600 12px/1.35 system-ui;color:#9fb6dd;pointer-events:none}' +
    '.bsiSF-invito{position:absolute;left:12px;right:12px;top:42px;max-width:380px;background:rgba(8,14,30,.88);border:1px solid rgba(107,207,255,.35);border-radius:14px;padding:12px 14px;color:#cfe2ff;font:500 13.5px/1.45 system-ui}' +
    '.bsiSF-invito[hidden]{display:none}.bsiSF-invito button{margin-top:8px;background:linear-gradient(135deg,#2f6bff,#00c9b7);color:#fff;border:0;border-radius:10px;padding:8px 12px;font:700 13px system-ui;cursor:pointer;min-height:36px}' +
    '#bsi-pane-spiega .bsiSF{flex:0 0 auto;height:clamp(220px,30vh,320px);min-height:220px;margin:10px 14px 0}#bsi-pane-spiega #bsiSP{flex:1;min-height:0}' +
    /* nella scheda Spiega i pulsanti stanno in riga, in basso a destra, e «🧠 Spiega» non serve (ci siamo gia') */
    '#bsi-pane-spiega .bsiSF-az{flex-direction:row;left:auto;right:10px;align-items:center}#bsi-pane-spiega .bsiSF-lez{display:none}' +
    '@media (max-width:520px){.bsiSF-nota{display:none}}';
  function stile() { if (D.getElementById('bsiSF-stile')) return; var s = D.createElement('style'); s.id = 'bsiSF-stile'; s.textContent = CSS; D.head.appendChild(s); }

  function webgl() { try { var c = D.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

  function monta(contenitore, opz) {
    opz = opz || {}; var T = globale.THREE;
    if (!T || !globale.BSISpectraCorpo || !webgl()) return null;
    stile();
    var box = D.createElement('div'); box.className = 'bsiSF'; box.setAttribute('role', 'img');
    box.setAttribute('aria-label', t('Spectra, l\'assistente, in piedi: gesticola e cambia espressione mentre risponde', 'Spectra, the assistant, standing: gestures and changes expression while answering'));
    var ren = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    /* alta definizione: fino a 2,5 pixel per punto in un riquadro (sugli schermi 4K e sui telefoni recenti resta nitido) */
    ren.setPixelRatio(Math.min(2.5, globale.devicePixelRatio || 1)); ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping;
    ren.domElement.setAttribute('aria-hidden', 'true'); box.appendChild(ren.domElement);
    var hud = D.createElement('div'); hud.className = 'bsiSF-hud'; hud.innerHTML = '<span class="bsiSF-led"></span>SPECTRA · <b>' + t('IN ASCOLTO', 'LISTENING') + '</b>'; box.appendChild(hud);
    var nota = D.createElement('div'); nota.className = 'bsiSF-nota'; box.appendChild(nota);
    var az = D.createElement('div'); az.className = 'bsiSF-az'; box.appendChild(az);
    contenitore.insertBefore(box, contenitore.firstChild);

    var sc = new T.Scene(); sc.background = new T.Color(0x050a16); sc.fog = new T.FogExp2(0x050a16, 0.12);
    var amb = new T.Scene(); amb.add(new T.Mesh(new T.BoxGeometry(20, 10, 20), new T.MeshBasicMaterial({ color: 0x070b16, side: T.BackSide })));
    [[0, 4.8, 0, 10, .2, 4, 0xffffff, 2.2], [-9.5, 1.5, 0, .2, 3, 8, 0x2f6bff, 2.4], [9.5, 1.5, 0, .2, 3, 8, 0x00c9b7, 1.2], [0, 1, -9.5, 8, 2, .2, 0x6bcfff, 1.2]].forEach(function (p) { var m = new T.Mesh(new T.BoxGeometry(p[3], p[4], p[5]), new T.MeshBasicMaterial({ color: new T.Color(p[6]).multiplyScalar(p[7]) })); m.position.set(p[0], p[1], p[2]); amb.add(m); });
    var pm = new T.PMREMGenerator(ren); sc.environment = pm.fromScene(amb, 0.04).texture; pm.dispose();
    sc.add(new T.HemisphereLight(0xb8c8e8, 0x05070c, 0.5));
    var key = new T.DirectionalLight(0xfff1e2, 1.25); key.position.set(-1.5, 4, 3); sc.add(key);
    var rimB = new T.PointLight(0x2f6bff, 3, 6); rimB.position.set(-1.6, 2.2, -1.4); sc.add(rimB);
    var rimM = new T.PointLight(0x00c9b7, 1.4, 6); rimM.position.set(1.8, 2, -1); sc.add(rimM);
    /* il laboratorio della lezione: pavimento a griglia al neon e pannelli olografici sul fondo */
    var pav = new T.Mesh(new T.CircleGeometry(7, 64), new T.MeshStandardMaterial({ color: 0x0a1020, metalness: 0.7, roughness: 0.35 })); pav.rotation.x = -Math.PI / 2; pav.position.y = -0.002; sc.add(pav);
    var gr = new T.GridHelper(14, 28, 0x2f6bff, 0x13244a); gr.material.transparent = true; gr.material.opacity = 0.5; sc.add(gr);
    for (var ip = -2; ip <= 2; ip++) { var pn = new T.Mesh(new T.PlaneGeometry(0.9, 1.6), new T.MeshBasicMaterial({ color: ip % 2 ? 0x2f6bff : 0x6bcfff, transparent: true, opacity: 0.07, side: T.DoubleSide })); pn.position.set(ip * 1.1, 1.3, -2.2 + Math.abs(ip) * 0.25); pn.rotation.y = -ip * 0.14; sc.add(pn); var bo = new T.LineSegments(new T.EdgesGeometry(pn.geometry), new T.LineBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.35 })); bo.position.copy(pn.position); bo.rotation.copy(pn.rotation); sc.add(bo); }
    /* la pedana olografica */
    var ped = new T.Mesh(new T.CircleGeometry(0.7, 64), new T.MeshStandardMaterial({ color: 0x0b1428, metalness: 0.8, roughness: 0.3 })); ped.rotation.x = -Math.PI / 2; sc.add(ped);
    var anello = new T.Mesh(new T.TorusGeometry(0.7, 0.008, 8, 96), new T.MeshBasicMaterial({ color: 0x6bcfff, toneMapped: false })); anello.rotation.x = Math.PI / 2; anello.position.y = 0.006; sc.add(anello);
    var alone = new T.Mesh(new T.CylinderGeometry(0.7, 0.72, 2.2, 48, 1, true), new T.MeshBasicMaterial({ color: 0x2f6bff, transparent: true, opacity: 0.045, side: T.DoubleSide, depthWrite: false })); alone.position.y = 1.1; sc.add(alone);
    var cam = new T.PerspectiveCamera(26, 1, 0.05, 40), bers = new T.Vector3(0, 0.98, 0), az0 = 0.25;
    function posCam(r) { cam.position.set(bers.x + r * Math.sin(az0), bers.y + 0.18, bers.z + r * Math.cos(az0)); cam.lookAt(bers); }

    var F = { box: box, ren: ren, sc: sc, cam: cam, attiva: true, ultimo: null };
    var S = F.spectra = new Spectra(T, sc, ren, { manichino: opz.manichino, posizione: new T.Vector3(0, 0, 0), rotY: az0 * 0.6, contenitore: box, soloDispositivo: opz.soloDispositivo, suddividi: opz.suddividi, cambiato: function () { aggiornaNota(); } });
    /* finche' il corpo non c'e' (la prima volta su un dispositivo): l'invito a caricarlo, non un sostituto */
    var inv = D.createElement('div'); inv.className = 'bsiSF-invito'; inv.setAttribute('role', 'note');
    inv.innerHTML = '<b>' + t('Spectra non è ancora su questo dispositivo.', 'Spectra is not on this device yet.') + '</b><br>' + t('Carica una volta il suo corpo (.glb): resta salvato solo qui.', 'Load its body (.glb) once: it stays saved here only.');
    var invB = D.createElement('button'); invB.type = 'button'; invB.textContent = t('🧍 Carica il corpo', '🧍 Load the body'); inv.appendChild(D.createElement('br')); inv.appendChild(invB); box.appendChild(inv);
    S.carica().then(aggiornaNota);
    function aggiornaNota() { var c = S.presente(); inv.hidden = c; nota.textContent = c ? t('Il tuo Spectra, salvato su questo dispositivo.', 'Your Spectra, saved on this device.') : ''; }
    aggiornaNota();
    function statoHud(s) { hud.innerHTML = '<span class="bsiSF-led"></span>SPECTRA · <b>' + s + '</b>'; }

    /* i pulsanti: corpo dal dispositivo, conversazione dal vivo, studio */
    var file = D.createElement('input'); file.type = 'file'; file.accept = '.glb,model/gltf-binary'; file.hidden = true; box.appendChild(file);
    function bottone(testo, titolo, fn) { var b = D.createElement('button'); b.type = 'button'; b.textContent = testo; b.title = titolo; b.setAttribute('aria-label', titolo); b.onclick = fn; az.appendChild(b); return b; }
    var bCorpo = bottone(t('🧍 Corpo', '🧍 Body'), t('Carica dal tuo dispositivo un modello .glb per il corpo di Spectra: resta solo su questo dispositivo', 'Load a .glb model for Spectra\'s body from your device: it stays on this device only'), function () { file.click(); });
    invB.onclick = function () { file.click(); };
    file.onchange = function () {
      var f = file.files && file.files[0]; if (!f) return; bCorpo.disabled = true; statoHud(t('CARICO IL CORPO…', 'LOADING THE BODY…'));
      S.daFile(f).then(function (r) { bCorpo.disabled = false; aggiornaNota(); file.value = ''; statoHud(r.ok ? t('NUOVO CORPO', 'NEW BODY') : r.motivo === 'grande' ? t('FILE TROPPO GRANDE (MAX 60 MB)', 'FILE TOO LARGE (MAX 60 MB)') : t('FILE NON UTILIZZABILE', 'FILE NOT USABLE')); if (r.ok) { S.emozione('gioia', 4); S.fai('spiega', null, 3); } });
    };
    if (globale.BSISpectraLive && globale.BSISpectraLive.apri) bottone(t('🎙️ Parla con me', '🎙️ Talk to me'), t('Apri la conversazione dal vivo con Spectra', 'Open the live conversation with Spectra'), function () { globale.BSISpectraLive.apri(); });
    /* «🧠 Spiega» nella finestra di Spectra */
    if (globale.bsiOpenAIHub) bottone(t('🧠 Spiega', '🧠 Explain'), t('Spectra spiega tutto, anche ciò che hai sullo schermo: spettri, grafici, scene 3D', 'Spectra explains everything, including what is on screen: spectra, graphs, 3D scenes'), function () { globale.bsiOpenAIHub('spiega'); }).className = 'bsiSF-lez';
    var a = D.createElement('a'); a.href = './spectra-studio.html'; a.textContent = t('🎓 Studio', '🎓 Studio'); a.title = t('Le lezioni immersive di Spectra', 'Spectra\'s immersive lessons'); az.appendChild(a);

    /* un altro riquadro (o lo studio) ha caricato un corpo nuovo: lo si riprende */
    D.addEventListener('bsi-spectra-corpo', function () { if (!S.corpoLocale) S.carica(); });

    /* la misura del riquadro e l'inquadratura: Spectra intero, dai piedi alla testa */
    function adatta() {
      var w = box.clientWidth || 300, h = box.clientHeight || 300; ren.setSize(w, h, false); cam.aspect = w / h;
      /* in un riquadro largo Spectra sta a sinistra (lascia spazio ai pulsanti), in uno stretto al centro */
      if (w > h * 1.25) cam.setViewOffset(w, h, w * 0.18, 0, w, h); else cam.clearViewOffset();
      var serve = 2.15 / (2 * Math.tan(cam.fov * Math.PI / 360)); posCam(Math.max(serve, serve / Math.min(1, cam.aspect * 1.25)));
      cam.updateProjectionMatrix();
    }
    F.adatta = adatta; adatta();
    if (globale.ResizeObserver) new ResizeObserver(adatta).observe(box); else globale.addEventListener('resize', adatta);

    /* ascoltare l'app */
    var occhi = new T.Vector3(), quando = 0;
    function reagisci(testo, emo) {
      var s = perIlViso(testo); if (!s) return;
      if (s === F.ultimo && quando < 3) return;   /* la stessa frase annunciata due volte (risposta e voce): una reazione sola */
      F.ultimo = s; statoHud(t('PARLA', 'SPEAKING'));
      S.emozione(emo || emozioneDi(s), 6); S.fai('spiega', null, Math.min(9, 2 + s.length / 40)); S.dici(s); quando = 0;
    }
    F.reagisci = reagisci;
    function suStato(e) { var s = e.detail && e.detail.stato; if (s === 'pensa' || s === 'strumenti' || s === 'scrive') { S.emozione('concentrata', 8); S.fai('pensa', null, 8); statoHud(t('PENSA', 'THINKING')); } }
    function suRisposta(e) { var d = e.detail || {}; if (d.errore) { S.emozione('dubbio', 4); statoHud(t('NON HO POTUTO RISPONDERE', 'COULD NOT ANSWER')); return; } reagisci(d.testo, d.emo); }
    D.addEventListener('bsi-spectra-stato', suStato); D.addEventListener('bsi-spectra-risposta', suRisposta); D.addEventListener('bsi-spectra-dice', suRisposta);

    /* il disegno: solo quando il riquadro si vede e la pagina e' in primo piano */
    var visibile = true, prec = 0, idleT = 0;
    if (globale.IntersectionObserver) new IntersectionObserver(function (v) { visibile = v[0] && v[0].isIntersecting; }).observe(box);
    function giro(ora) {
      if (!F.attiva) return;
      requestAnimationFrame(giro);
      if (!visibile || D.hidden || !box.isConnected || !box.offsetParent) { prec = 0; return; }
      var dt = prec ? Math.min(0.1, (ora - prec) / 1000) : 0.016; prec = ora; quando += dt; idleT += dt;
      /* lo sguardo: verso chi guarda; ogni tanto un'occhiata altrove (vivo, non fisso) */
      occhi.copy(cam.position); if (idleT % 9 > 7.6) occhi.x += 1.2 * Math.sin(idleT * 0.7);
      S.passo(dt, occhi);
      if (quando > 6 && !(S.corpo && S.corpo.testo)) statoHud(t('IN ASCOLTO', 'LISTENING'));
      anello.material.color.setHSL(0.55 + (S.corpo && S.corpo.testo ? 0.08 : 0), 1, 0.55 + 0.1 * Math.sin(ora / 600));
      ren.render(sc, cam);
    }
    requestAnimationFrame(giro);
    F.distruggi = function () { F.attiva = false; D.removeEventListener('bsi-spectra-stato', suStato); D.removeEventListener('bsi-spectra-risposta', suRisposta); D.removeEventListener('bsi-spectra-dice', suRisposta); try { ren.dispose(); ren.forceContextLoss(); } catch (e) {} if (box.parentNode) box.parentNode.removeChild(box); };
    return F;
  }

  /* i file 3D si caricano solo quando serve (la prima volta che si apre una sezione dell'AI): l'avvio dell'app non rallenta */
  function script(src, c) {
    return new Promise(function (ok, ko) {
      if (c()) return ok();
      var s = D.createElement('script'); s.src = src; s.onload = function () { ok(); }; s.onerror = function () { ko(new Error(src)); }; D.head.appendChild(s);
    });
  }
  var pronto = null;
  function prepara() {
    if (pronto) return pronto;
    var three = globale.THREE ? Promise.resolve() : (globale.BSILab3D && globale.BSILab3D.caricaThree ? globale.BSILab3D.caricaThree() : script('./three.min.js', function () { return !!globale.THREE; }));
    pronto = three.then(function () { return script('./gltf_loader.js', function () { return !!(globale.THREE && globale.THREE.GLTFLoader); }); })
      .then(function () { return script('./bsi-spectra-corpo.js', function () { return !!globale.BSISpectraCorpo; }); })
      .then(function () { return script('./bsi-spectra-rig.js', function () { return !!globale.BSISpectraRig; }); })
      .catch(function (e) { pronto = null; throw e; });
    return pronto;
  }

  /* ═══ 3. LE SEZIONI DELL'AI: una figura sola, spostata nella sezione aperta ═══ */
  var condivisa = null, inCorso = false;
  function sezioni(ids) {
    /* la scheda «🧠 Spiega» della finestra di Spectra ha la precedenza: e' Spectra che sta spiegando */
    ids = ids || ['bsi-pane-spiega', 'sai', 'sareachim', 'sareafis', 'sareamat'];
    function bersaglio() {
      for (var i = 0; i < ids.length; i++) {
        var s = D.getElementById(ids[i]); if (!s || !s.offsetParent) continue;
        /* dentro la sezione: prima del suo contenuto principale (dopo il titolo, se c'e') */
        return s;
      }
      return null;
    }
    function controlla() {
      var s = bersaglio(); if (!s) return;
      if (!condivisa) {
        if (inCorso || !webgl()) return; inCorso = true;
        prepara().then(function () { inCorso = false; if (!condivisa) { condivisa = monta(s, {}); globale.BSISpectraFigura.figura = condivisa; controlla(); } }).catch(function () { inCorso = false; });
        return;
      }
      var q0 = s.querySelector('.bsiFX') || s, d0 = null;
      ['.bsiFX-sotto', '.bsiLZ-avvia', '.section-title'].some(function (sel) { var e = q0.querySelector(':scope > ' + sel); if (e) { d0 = e; return true; } return false; });
      if (s.id === 'bsi-pane-spiega' ? condivisa.box.parentNode !== s : (!s.contains(condivisa.box) || condivisa.box.parentNode !== q0 || (d0 && condivisa.box.previousElementSibling !== d0))) {
        /* dopo il titolo, la «Lezione guidata» e la descrizione, prima delle schede e del contenuto */
        var q = s.querySelector('.bsiFX') || s, dopo = null;
        if (s.id === 'bsi-pane-spiega') { s.insertBefore(condivisa.box, s.firstChild); condivisa.adatta(); return; }
        ['.bsiFX-sotto', '.bsiLZ-avvia', '.section-title'].some(function (sel) { var e = q.querySelector(':scope > ' + sel); if (e) { dopo = e; return true; } return false; });
        if (dopo) q.insertBefore(condivisa.box, dopo.nextSibling); else q.insertBefore(condivisa.box, q.firstChild);
        condivisa.adatta();
      }
    }
    controlla(); setInterval(controlla, 800);
    D.addEventListener('click', function () { setTimeout(controlla, 60); }, true);
    return { controlla: controlla, figura: function () { return condivisa; } };
  }

  globale.BSISpectraFigura = { Spectra: Spectra, monta: monta, sezioni: sezioni, prepara: prepara, dbCorpo: dbCorpo, emozioneDi: emozioneDi, LIMITE: LIMITE, RIG: RIG, figura: null };
  /* nell'app (non nello studio, che usa il controllore direttamente) le sezioni dell'AI ricevono la figura */
  if (D && !/spectra-studio\.html/.test(globale.location && globale.location.pathname || '')) {
    var via = function () { if (D.querySelector('[data-s="sai"],[data-s="sareachim"]')) sezioni(); };
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', via); else via();
  }
})(typeof window !== 'undefined' ? window : this);
