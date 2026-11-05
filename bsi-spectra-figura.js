/* ════════════════════════════════════════════════════════════════════════
   BioSpecInfo · bsi-spectra-figura.js  (v240)
   © Samuele Pio Provenzano

   SPECTRA COL CORPO, IN UN MODULO SOLO.
   Lo studio (spectra-studio.html) e le sezioni dell'AI (Spectra AI e le tre aree
   con l'assistente: Chimica, Fisica, Matematica) mostrano lo stesso Spectra: lo
   stesso corpo, lo stesso viso «Noir» con le espressioni, lo stesso cappuccio, la
   stessa definizione. Per questo la logica sta qui e non e' copiata due volte.

   1. IL CORPO (Spectra): in una scena three.js gia' esistente.
      Il corpo e' SEMPRE presente, per tutti (richiesta dell'autore): e' incorporato
      nell'app in forma impacchettata (models/spectra-corpo.bsi, da
      tools/impacchetta-corpo.js). Il modello e' gratuito su CGTrader con licenza
      Royalty Free: si usa dentro il prodotto e non si offre come file .glb a se'.
      Nello studio, in sviluppo, se il blocco manca si prova
      models/spectra-corpo.glb. Il corpo, senza scheletro, passa dal rig automatico
      (bsi-spectra-rig.js); sopra il collo va il viso «Noir»
      (bsi-spectra-androide.js), allineato misurando il mento.
   2. LA FIGURA (monta): un riquadro con la sua scena (il laboratorio della
      lezione: griglia al neon, pannelli olografici, pedana), Spectra in piedi,
      intero; i pulsanti Parla con me, 🧠 Spiega (la spiegazione esaustiva
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
  /* IL CORPO INCORPORATO (v240, richiesta dell'autore: «sempre presente, senza doverlo mettere»): models/spectra-corpo.bsi,
     il modello impacchettato da tools/impacchetta-corpo.js (non e' un .glb: solo questo codice lo riapre). Licenza Royalty
     Free di CGTrader: il modello si usa dentro l'app e non si offre come file a se'. Nello studio, in sviluppo, se il
     blocco manca si prova models/spectra-corpo.glb (escluso da git). */
  var SEME = 0x5bd1e995 ^ 0x53504543;
  function apri(ab) {
    var u = new Uint8Array(ab); if (u.length < 9 || String.fromCharCode(u[0], u[1], u[2], u[3]) !== 'BSIC') return null;
    var n = u[5] | (u[6] << 8) | (u[7] << 16) | (u[8] << 24), out = new Uint8Array(n), x = SEME >>> 0 || 1;
    for (var i = 0; i < n; i++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[i] = u[9 + i] ^ (x & 0xff); }
    return out.buffer;
  }
  Spectra.prototype.carica = function () {
    var self = this;
    /* il vecchio corpo «dal dispositivo» (v239) non serve piu': si libera lo spazio */
    dbCorpo('leggi').then(function (b) { if (b) dbCorpo('togli'); });
    return fetch('./models/spectra-corpo.bsi').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(function (ab) { var g = apri(ab); if (!g) throw new Error('blocco non valido'); return self.daBuffer(g); })
      .catch(function () {
        if (self.opz.soloDispositivo) return false;
        return fetch('./models/spectra-corpo.glb', { method: 'HEAD' }).then(function (r) {
          if (!r.ok) return false;
          return fetch('./models/spectra-corpo.glb').then(function (x) { return x.arrayBuffer(); }).then(function (b) { return self.daBuffer(b); });
        }).catch(function () { return false; });
      })
      .then(function (fatto) { self.caricato = !!fatto; self.cambiato(); return fatto; });
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

  /* ═══ L'OLOGRAMMA: alla destra di Spectra (destra di chi guarda), le animazioni delle sezioni ═══
     Richiesta dell'autore: «alla mia destra di Spectra appaiano le immagini dei grafici e dei movimenti
     delle sezioni con animazioni 3D o 2D, ad esempio pianeti che orbitano». Uno schermo olografico con
     scene vive calcolate davvero (non filmati):
     · pianeti — quattro pianeti su ellissi di Keplero: l'equazione M = E − e sin E si risolve a ogni
       fotogramma (Newton), il periodo segue la terza legge (T ∝ a^1,5): piu' veloci al perielio;
     · molecola — il benzene a sfere e bastoncini, con la nube π sopra e sotto l'anello;
     · spettro — uno spettro IR che si traccia (bande gaussiane a 3400, 2925, 1715, 1405, 1130 cm⁻¹);
     · superficie — z = sin(r − t)/r, la superficie che si propaga (funzioni di piu' variabili);
     · orbitale — l'orbitale 3d_z² (lobi e anello, fasi in due colori) che ruota;
     · onda — un pacchetto d'onda gaussiano che si muove e si allarga (dispersione, Schrödinger libero);
     · schermo — la sezione aperta dietro la finestra di Spectra, dal vivo (la sua tela ridisegnata).
     Ogni scena porta alla sua sezione dell'app (un tocco sull'etichetta). */
  var SCENE_OLO = {
    pianeti: { nome: ['🪐 Orbite di Keplero', '🪐 Kepler orbits'], sez: 'sastrosole', parole: /pianet|orbit|keplero|gravit|sole|astro|satellit|planet/ },
    molecola: { nome: ['⌬ Benzene, sfere e bastoncini', '⌬ Benzene, ball and stick'], sez: 'sstruct', parole: /molecol|legam|benzen|aromatic|struttur|composto|reazion|molecule|bond/ },
    spettro: { nome: ['📈 Spettro IR', '📈 IR spectrum'], sez: 'sirvis', parole: /spettr|nmr|ir\b|infrarosso|uv|massa|picc|banda|spectr/ },
    superficie: { nome: ['🗻 z = sin(r − t)/r', '🗻 z = sin(r − t)/r'], sez: 'smatmulti', parole: /funzion|superfic|integral|derivat|gradient|limite|serie|matemat|function|surface/ },
    orbitale: { nome: ['🔵 Orbitale 3d_z²', '🔵 3d_z² orbital'], sez: 'smo', parole: /orbital|elettron|atomo|quantistic|spin|electron/ },
    onda: { nome: ['〰️ Pacchetto d\'onda', '〰️ Wave packet'], sez: 'sschrod', parole: /onda|schr|ondulat|pacchett|interfer|luce|ottic|wave/ }
  };
  var GIRO_OLO = ['pianeti', 'molecola', 'spettro', 'superficie', 'orbitale', 'onda'];
  function Ologramma(T, sc) {
    var self = this; this.T = T; this.grp = new T.Group(); this.grp.position.set(1.05, 1.05, -0.1); this.grp.rotation.y = -0.32; sc.add(this.grp);
    var ciano = 0x6bcfff, verde = 0x00c9b7, blu = 0x2f6bff;
    function mat(c, o) { return new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o == null ? 0.85 : o, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }); }
    function lin(c, o) { return new T.LineBasicMaterial({ color: c, transparent: true, opacity: o == null ? 0.9 : o, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }); }
    this.mat = mat; this.lin = lin;
    /* la cornice: un pannello di vetro con i bordi accesi e una base proiettore */
    var W = 1.1, H = 1.25;
    var vetro = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ color: 0x0b2a55, transparent: true, opacity: 0.16, depthWrite: false, side: T.DoubleSide })); this.grp.add(vetro);
    var bordo = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(W, H)), lin(ciano, 0.75)); this.grp.add(bordo);
    var base = new T.Mesh(new T.CylinderGeometry(0.16, 0.2, 0.05, 32), new T.MeshStandardMaterial({ color: 0x141c2c, metalness: 0.8, roughness: 0.3 })); base.position.set(1.05, 0.025, -0.1); sc.add(base);
    var fascio = new T.Mesh(new T.CylinderGeometry(0.02, 0.16, 0.4, 24, 1, true), mat(blu, 0.12)); fascio.position.set(1.05, 0.25, -0.1); sc.add(fascio);
    this.cornice = { vetro: vetro, bordo: bordo }; this.W = W; this.H = H;
    this.scene = {}; this.attuale = null; this.t = 0; this.cambioT = 0; this.auto = true;
    /* la tela dello schermo vivo */
    this.tela = D.createElement('canvas'); this.tela.width = 512; this.tela.height = 384; this.tex = new T.CanvasTexture(this.tela); this.tex.encoding = T.sRGBEncoding;
  }
  Ologramma.prototype.costruisci = function (nome) {
    var T = this.T, g = new T.Group(), mat = this.mat, lin = this.lin, U = {}, blu = 0x2f6bff;
    if (nome === 'pianeti') {
      var sole = new T.Mesh(new T.SphereGeometry(0.05, 24, 16), mat(0xffd27a, 0.95)); g.add(sole);
      var alone = new T.Mesh(new T.SphereGeometry(0.085, 24, 16), mat(0xffb347, 0.18)); g.add(alone);
      U.p = [[0.16, 0.05, 0x9fe7ff], [0.25, 0.2, 0x00c9b7], [0.34, 0.09, 0x6b8cff], [0.45, 0.32, 0xff9fd2]].map(function (d, i) {
        var a = d[0], e = d[1], b = a * Math.sqrt(1 - e * e), pts = [];
        for (var k = 0; k <= 96; k++) { var E = k / 96 * Math.PI * 2; pts.push(new T.Vector3(a * (Math.cos(E) - e), 0, b * Math.sin(E))); }
        g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), lin(d[2], 0.45)));
        var pl = new T.Mesh(new T.SphereGeometry(0.018 + 0.006 * (i % 2), 16, 12), mat(d[2], 0.95)); g.add(pl);
        return { a: a, e: e, b: b, pl: pl, T: Math.pow(a / 0.16, 1.5) * 2.2, M0: i * 1.7 };
      });
      g.rotation.x = 0.55;
      U.passo = function (t) { U.p.forEach(function (q) { var M = q.M0 + 2 * Math.PI * t / q.T, E = M; for (var k = 0; k < 6; k++) E -= (E - q.e * Math.sin(E) - M) / (1 - q.e * Math.cos(E)); q.pl.position.set(q.a * (Math.cos(E) - q.e), 0, q.b * Math.sin(E)); }); g.rotation.y = t * 0.05; };
    } else if (nome === 'molecola') {
      var C = [], R = 0.2;
      for (var k = 0; k < 6; k++) { var a2 = k * Math.PI / 3, c = new T.Vector3(R * Math.cos(a2), R * Math.sin(a2), 0); C.push(c); var at = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), mat(0x9fb6dd, 0.95)); at.position.copy(c); g.add(at);
        var h = new T.Mesh(new T.SphereGeometry(0.022, 12, 10), mat(0xffffff, 0.9)); h.position.copy(c.clone().multiplyScalar(1.55)); g.add(h);
        g.add(new T.Line(new T.BufferGeometry().setFromPoints([c, c.clone().multiplyScalar(1.55)]), lin(0xcfe2ff, 0.7))); }
      for (k = 0; k < 6; k++) { var A = C[k], B = C[(k + 1) % 6]; g.add(new T.Line(new T.BufferGeometry().setFromPoints([A, B]), lin(0x00c9b7, 0.95)));
        if (k % 2 === 0) { var off = A.clone().add(B).multiplyScalar(0.5).multiplyScalar(-0.12); g.add(new T.Line(new T.BufferGeometry().setFromPoints([A.clone().add(off), B.clone().add(off)]), lin(0x00c9b7, 0.6))); } }
      [-1, 1].forEach(function (sg) { var tor = new T.Mesh(new T.TorusGeometry(R, 0.03, 10, 48), mat(blu, 0.22)); tor.position.z = 0.05 * sg; g.add(tor); });
      U.passo = function (t) { g.rotation.set(0.9 + 0.25 * Math.sin(t * 0.4), t * 0.5, 0); };
    } else if (nome === 'spettro') {
      var assi = [new T.Vector3(-0.45, -0.3, 0), new T.Vector3(0.45, -0.3, 0), new T.Vector3(-0.45, -0.3, 0), new T.Vector3(-0.45, 0.32, 0)];
      g.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(assi), lin(0x9fb6dd, 0.6)));
      for (var gx = 0; gx <= 8; gx++) g.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-0.45 + gx * 0.1125, -0.3, 0), new T.Vector3(-0.45 + gx * 0.1125, 0.32, 0)]), lin(0x2f6bff, 0.15)));
      var bande = [[3400, 0.95, 120], [2925, 0.55, 40], [1715, 0.9, 25], [1405, 0.4, 20], [1130, 0.8, 35]], N = 400, pos = new Float32Array(N * 3);
      for (var i = 0; i < N; i++) { var nu = 4000 - i / (N - 1) * 3600, y = 0; bande.forEach(function (bd) { y += bd[1] * Math.exp(-Math.pow((nu - bd[0]) / bd[2], 2)); }); pos[i * 3] = -0.45 + i / (N - 1) * 0.9; pos[i * 3 + 1] = -0.3 + Math.min(1, y) * 0.58; }
      var gs = new T.BufferGeometry(); gs.setAttribute('position', new T.BufferAttribute(pos, 3)); var curva = new T.Line(gs, lin(0x00c9b7, 1)); g.add(curva);
      var cursore = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, -0.3, 0), new T.Vector3(0, 0.32, 0)]), lin(0xffd27a, 0.8)); g.add(cursore);
      U.passo = function (t) { var f = (t % 6) / 4.5, n = Math.max(2, Math.min(N, Math.floor(f * N))); gs.setDrawRange(0, n); cursore.position.x = -0.45 + Math.min(1, f) * 0.9; cursore.visible = f < 1; g.rotation.y = 0.18 * Math.sin(t * 0.3); };
    } else if (nome === 'superficie') {
      var n2 = 34, gp = new T.PlaneGeometry(0.9, 0.9, n2, n2), wire = new T.LineSegments(new T.WireframeGeometry(gp), lin(0x6bcfff, 0.55)), P = gp.attributes.position;
      var wpos = wire.geometry.attributes.position; g.add(wire); g.rotation.x = -1.0;
      U.passo = function (t) { for (var k = 0; k < wpos.count; k++) { var x = wpos.getX(k), y = wpos.getY(k), r = Math.hypot(x, y) * 22 + 1e-6; wpos.setZ(k, 0.16 * Math.sin(r - t * 3) / (r * 0.35 + 1)); } wpos.needsUpdate = true; g.rotation.z = t * 0.15; };
    } else if (nome === 'orbitale') {
      var lobo = new T.SphereGeometry(0.12, 32, 24); lobo.scale(1, 1.75, 1);
      var su = new T.Mesh(lobo, mat(0x00c9b7, 0.55)); su.position.y = 0.2; g.add(su); var giu = new T.Mesh(lobo, mat(0x00c9b7, 0.55)); giu.position.y = -0.2; g.add(giu);
      var anello = new T.Mesh(new T.TorusGeometry(0.15, 0.055, 16, 48), mat(0x6b8cff, 0.55)); anello.rotation.x = Math.PI / 2; g.add(anello);
      var nucleo = new T.Mesh(new T.SphereGeometry(0.018, 12, 10), mat(0xffffff, 1)); g.add(nucleo);
      U.passo = function (t) { g.rotation.set(0.35 + 0.2 * Math.sin(t * 0.5), t * 0.6, 0.15); };
    } else if (nome === 'onda') {
      var M2 = 300, op = new Float32Array(M2 * 3), og = new T.BufferGeometry(); og.setAttribute('position', new T.BufferAttribute(op, 3)); g.add(new T.Line(og, lin(0x00c9b7, 1)));
      var ip = new Float32Array(M2 * 3), ig = new T.BufferGeometry(); ig.setAttribute('position', new T.BufferAttribute(ip, 3)); g.add(new T.Line(ig, lin(0x6b8cff, 0.8)));
      var dp = new Float32Array(M2 * 3), dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(dp, 3)); g.add(new T.Line(dg, lin(0xffd27a, 0.9)));
      U.passo = function (t) {
        var tt = t % 8, s0 = 0.06, k0 = 60, v = 0.12, sig = s0 * Math.sqrt(1 + Math.pow(tt * 0.9, 2)), x0 = -0.35 + v * tt;
        for (var k = 0; k < M2; k++) { var x = -0.45 + k / (M2 - 1) * 0.9, env = Math.sqrt(s0 / sig) * Math.exp(-Math.pow(x - x0, 2) / (2 * sig * sig)), fase = k0 * (x - x0 / 2);
          op[k * 3] = x; op[k * 3 + 1] = 0.25 * env * Math.cos(fase); ip[k * 3] = x; ip[k * 3 + 1] = 0.25 * env * Math.sin(fase); ip[k * 3 + 2] = 0.04; dp[k * 3] = x; dp[k * 3 + 1] = -0.32 + 0.3 * env * env; }
        og.attributes.position.needsUpdate = true; ig.attributes.position.needsUpdate = true; dg.attributes.position.needsUpdate = true; g.rotation.y = 0.25 * Math.sin(t * 0.3);
      };
    } else if (nome === 'schermo') {
      var pl2 = new T.Mesh(new T.PlaneGeometry(this.W * 0.94, this.H * 0.7), new T.MeshBasicMaterial({ map: this.tex, transparent: true, opacity: 0.95, toneMapped: false })); g.add(pl2);
      U.passo = function () {};
    }
    g.userData.U = U; g.visible = false; this.grp.add(g); this.scene[nome] = g; return g;
  };
  Ologramma.prototype.mostra = function (nome) {
    if (!nome || nome === this.attuale) return;
    if (!this.scene[nome]) this.costruisci(nome);
    var self = this; Object.keys(this.scene).forEach(function (k) { self.scene[k].visible = k === nome; });
    this.attuale = nome; this.t0 = this.t; this.comparsa = 0;
    if (this.suCambio) this.suCambio(nome);
  };
  Ologramma.prototype.passo = function (dt) {
    this.t += dt; var g = this.attuale && this.scene[this.attuale]; if (!g) return;
    /* la comparsa: l'ologramma «si accende» in mezzo secondo */
    this.comparsa = Math.min(1, (this.comparsa || 0) + dt * 2); g.scale.setScalar(0.6 + 0.4 * this.comparsa);
    this.cornice.bordo.material.opacity = 0.55 + 0.2 * Math.sin(this.t * 2.2);
    if (g.userData.U.passo) g.userData.U.passo(this.t);
    /* a riposo le scene si alternano da sole */
    if (this.auto && this.attuale !== 'schermo') { this.cambioT += dt; if (this.cambioT > 14) { this.cambioT = 0; this.mostra(GIRO_OLO[(GIRO_OLO.indexOf(this.attuale) + 1) % GIRO_OLO.length]); } }
  };
  /* la scena adatta a un testo (domanda o risposta): la prima che vi si riconosce */
  function sceneDi(testo) { var s = String(testo || '').toLowerCase(); for (var k = 0; k < GIRO_OLO.length; k++) if (SCENE_OLO[GIRO_OLO[k]].parole.test(s)) return GIRO_OLO[k]; return null; }

  /* ═══ 2. LA FIGURA: un riquadro con Spectra in piedi ═══════════════════ */
  var CSS = '.bsiSF{display:flex;flex-direction:column;position:relative;border:1px solid rgba(107,207,255,.28);border-radius:16px;overflow:hidden;margin:0 0 14px;background:radial-gradient(120% 90% at 30% 100%,#0d1d3a 0%,#060b18 55%,#040814 100%);min-height:340px;height:clamp(340px,54vh,520px)}' +
    '.bsiSF canvas{display:block;width:100%!important;flex:1 1 auto;min-height:0;touch-action:pan-y}' +
    '.bsiSF-hud{position:absolute;left:12px;top:10px;right:12px;display:flex;align-items:center;gap:8px;pointer-events:none;font:800 11px/1.2 ui-monospace,monospace;letter-spacing:.18em;color:#6bcfff;text-transform:uppercase}' +
    '.bsiSF-hud b{color:#e9f3ff}.bsiSF-led{width:8px;height:8px;border-radius:50%;background:#00c9b7;box-shadow:0 0 10px #00c9b7}' +
    /* i pulsanti in una barra sotto la scena: non coprono Spectra ne' l'ologramma */
    '.bsiSF-az{position:relative;flex:0 0 auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-start;padding:8px 10px;background:rgba(5,10,22,.88);border-top:1px solid rgba(107,207,255,.2)}' +
    '.bsiSF-az button,.bsiSF-az a{background:rgba(13,21,34,.86);border:1px solid rgba(107,207,255,.35);color:#cfe2ff;border-radius:999px;padding:7px 11px;font:700 12px system-ui;cursor:pointer;text-decoration:none;min-height:34px}' +
    '.bsiSF-az button:focus-visible,.bsiSF-az a:focus-visible{outline:2px solid #00c9b7;outline-offset:2px}' +
    '.bsiSF-olo{position:absolute;right:12px;top:8px;max-width:58%;background:rgba(8,14,30,.78);border:1px solid rgba(107,207,255,.4);color:#9fe7ff;border-radius:999px;padding:5px 11px;font:700 11.5px system-ui;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:30px}' +
    /* sul telefono i pulsanti flottanti dell\'app stanno sul bordo destro: la barra lascia loro spazio */
    '@media (max-width:640px){.bsiSF .bsiSF-az{padding-right:74px}#bsi-pane-spiega .bsiSF .bsiSF-az{padding-right:10px}}' +
    '.bsiSF-oi{position:absolute;right:12px;top:44px;background:linear-gradient(135deg,#1d4ed8,#0e7490);border:0;color:#fff;border-radius:999px;padding:6px 12px;font:800 12px system-ui;cursor:pointer;min-height:32px;box-shadow:0 0 14px rgba(0,201,183,.35)}' +
    '.bsiSF-nota{position:absolute;left:12px;bottom:58px;max-width:52%;font:600 12px/1.35 system-ui;color:#9fb6dd;pointer-events:none}' +
    '.bsiSF-invito{position:absolute;left:12px;right:12px;top:42px;max-width:380px;background:rgba(8,14,30,.88);border:1px solid rgba(107,207,255,.35);border-radius:14px;padding:12px 14px;color:#cfe2ff;font:500 13.5px/1.45 system-ui}' +
    '.bsiSF-invito[hidden]{display:none}.bsiSF-invito button{margin-top:8px;background:linear-gradient(135deg,#1d4ed8,#0e7490);color:#fff;border:0;border-radius:10px;padding:8px 12px;font:700 13px system-ui;cursor:pointer;min-height:36px}' +
    '#bsi-pane-spiega .bsiSF{flex:0 0 auto;height:clamp(290px,40vh,400px);min-height:290px;margin:10px 14px 0}#bsi-pane-spiega #bsiSP{flex:1;min-height:0}' +
    /* nella scheda Spiega i pulsanti stanno in riga, in basso a destra, e «🧠 Spiega» non serve (ci siamo gia') */
    '#bsi-pane-spiega .bsiSF-lez{display:none}' +
    /* nella console Spectra Live: la figura prende il posto del busto, fra la telemetria e il dialogo */
    '#bsiJV.con-figura #bsiJV-volto{display:none!important}#bsiJV-figura{position:absolute;left:10px;right:10px;top:21%;height:34%;z-index:3}' +
    '#bsiJV-figura .bsiSF{height:100%;min-height:0;margin:0}#bsiJV-figura .bsiSF-az{display:none}' +
    '@media (min-width:900px){#bsiJV-figura{left:auto;right:3%;width:46%;top:14%;height:58%}}' +
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
    var ped = new T.Mesh(new T.CircleGeometry(0.62, 64), new T.MeshStandardMaterial({ color: 0x0b1428, metalness: 0.8, roughness: 0.3 })); ped.rotation.x = -Math.PI / 2; ped.position.set(-0.32, 0, 0.05); sc.add(ped);
    var anello = new T.Mesh(new T.TorusGeometry(0.62, 0.008, 8, 96), new T.MeshBasicMaterial({ color: 0x6bcfff, toneMapped: false })); anello.rotation.x = Math.PI / 2; anello.position.set(-0.32, 0.006, 0.05); sc.add(anello);
    var alone = new T.Mesh(new T.CylinderGeometry(0.62, 0.64, 2.2, 48, 1, true), new T.MeshBasicMaterial({ color: 0x2f6bff, transparent: true, opacity: 0.045, side: T.DoubleSide, depthWrite: false })); alone.position.set(-0.32, 1.1, 0.05); sc.add(alone);
    var cam = new T.PerspectiveCamera(26, 1, 0.05, 40), bers = new T.Vector3(0.38, 0.98, 0), az0 = 0.12;
    function posCam(r) { cam.position.set(bers.x + r * Math.sin(az0), bers.y + 0.18, bers.z + r * Math.cos(az0)); cam.lookAt(bers); }

    var F = { box: box, ren: ren, sc: sc, cam: cam, attiva: true, ultimo: null };
    var S = F.spectra = new Spectra(T, sc, ren, { manichino: opz.manichino, posizione: new T.Vector3(-0.32, 0, 0.05), rotY: 0.32, contenitore: box, soloDispositivo: opz.soloDispositivo !== false,   /* nell'app solo il corpo incorporato: i file di sviluppo non si cercano (niente 404) */ suddividi: opz.suddividi, cambiato: function () { aggiornaNota(); } });
    /* mentre il corpo incorporato arriva: «Spectra sta arrivando…»; se non arriva (rete assente al primo avvio): riprova */
    var inv = D.createElement('div'); inv.className = 'bsiSF-invito'; inv.setAttribute('role', 'status');
    inv.innerHTML = '<b>' + t('Spectra sta arrivando…', 'Spectra is on the way…') + '</b>';
    var invB = D.createElement('button'); invB.type = 'button'; invB.textContent = t('↻ Riprova', '↻ Retry'); invB.hidden = true; inv.appendChild(D.createElement('br')); inv.appendChild(invB); box.appendChild(inv);
    invB.onclick = function () { invB.hidden = true; inv.querySelector('b').textContent = t('Spectra sta arrivando…', 'Spectra is on the way…'); S.carica().then(aggiornaNota); };
    S.carica().then(aggiornaNota);
    /* L'OLOGRAMMA alla destra di Spectra */
    var OL = F.olo = new Ologramma(T, sc), etO = D.createElement('button'); etO.type = 'button'; etO.className = 'bsiSF-olo'; box.appendChild(etO);
    OL.suCambio = function (nome) { var d = SCENE_OLO[nome]; etO.textContent = nome === 'schermo' ? t('📺 La tua sezione, dal vivo', '📺 Your section, live') : (d.nome[t(0, 1)] + ' · ' + t('apri', 'open') + ' ›'); etO.title = nome === 'schermo' ? '' : t('Apri la sezione dell\'app', 'Open the app section'); };
    /* un tocco sull'etichetta: la sezione si apre DIETRO la finestra «🧠 Spiega», cosi' Spectra resta davanti, con la sezione
       dal vivo nell'ologramma (la figura non sparisce mai); senza la finestra, si apre la sezione e basta */
    etO.onclick = function () {
      var d = SCENE_OLO[OL.attuale]; if (!d) return;
      if (globale.BSISpiega && globale.BSISpiega.mostraSezione && globale.bsiOpenAIHub) {
        var ov = D.getElementById('bsi-hub-ov'); if (!(ov && ov.classList.contains('open'))) globale.bsiOpenAIHub('spiega');
        globale.BSISpiega.mostraSezione(d.sez); return;
      }
      var b = D.querySelector('[data-s="' + d.sez + '"]'); if (b) b.click();
    };
    OL.mostra('pianeti');
    /* «⛶ Interagisci»: l'ologramma interattivo (bsi-spectra-olointerattivo.js), nella modalita' di cio' che l'ologramma mostra */
    var oiB = D.createElement('button'); oiB.type = 'button'; oiB.className = 'bsiSF-oi'; oiB.textContent = '⛶ ' + t('Interagisci', 'Interact');
    oiB.title = t('Apri l\'ologramma: scrivi dati e tracce, cambia lo spettro, scegli un pianeta, e Spectra spiega ogni passaggio', 'Open the hologram: write data and traces, change the spectrum, pick a planet, and Spectra explains every step');
    oiB.onclick = function () {
      var I = globale.BSIOloInterattivo; if (!I) return;
      var m = { pianeti: 'universo', spettro: 'spettri', molecola: 'spettri', superficie: 'matematica', orbitale: 'matematica', onda: 'fisica' }[OL.attuale];
      if (!m) { var sc0 = globale.BSISpectraLive && globale.BSISpectraLive.schermo ? globale.BSISpectraLive.schermo() : null, mat = sc0 && sc0.materia; m = /spet|sirvis|sspec|sms|snoe|suvvis|scentrospettri/.test(sc0 && sc0.sezione || '') ? 'spettri' : mat === 'fisica' ? 'fisica' : mat === 'matematica' ? 'matematica' : 'spettri'; }
      var ov = D.getElementById('bsi-hub-ov'); if (ov && ov.classList.contains('open')) { var ch = D.getElementById('bsi-hub-close'); if (ch) ch.click(); }
      I.apri(m);
    };
    box.appendChild(oiB);
    var vivoT = 0;
    function vivo() {
      /* lo schermo vivo: la sezione aperta (la sua tela, ridisegnata) copiata nell'ologramma, 5 volte al secondo */
      var L = globale.BSISpectraLive, c = L && L.cattura ? (function () { try { return L.cattura(); } catch (e) { return null; } })() : null;
      var q = OL.tela.getContext('2d');
      if (!c) {
        /* una sezione senza grafici (testo, tabelle, controlli) si proietta come scheda: ogni sezione e' mostrabile */
        var sc2 = L && L.schermo ? L.schermo() : null; if (!sc2 || !sc2.sezione) { OL.auto = true; OL.mostra('pianeti'); return; }
        if (vivo.ultima === sc2.sezione + '|' + (sc2.scheda || '') + '|' + (sc2.controlli || []).map(function (x) { return x.valore; }).join(',')) return;
        vivo.ultima = sc2.sezione + '|' + (sc2.scheda || '') + '|' + (sc2.controlli || []).map(function (x) { return x.valore; }).join(',');
        schedaOlo(q, OL.tela.width, OL.tela.height, sc2); OL.tex.needsUpdate = true; return;
      }
      vivo.ultima = null;
      var k = Math.min(OL.tela.width / c.width, OL.tela.height / c.height);
      q.fillStyle = '#04101e'; q.fillRect(0, 0, OL.tela.width, OL.tela.height);
      q.drawImage(c, (OL.tela.width - c.width * k) / 2, (OL.tela.height - c.height * k) / 2, c.width * k, c.height * k); OL.tex.needsUpdate = true;
    }
    function schedaOlo(q, W, H, sc2) {
      q.fillStyle = '#04101e'; q.fillRect(0, 0, W, H); q.strokeStyle = 'rgba(107,207,255,.6)'; q.lineWidth = 2; q.strokeRect(6, 6, W - 12, H - 12);
      var y = 34; function riga(txt, font, col, max) { q.font = font; q.fillStyle = col; var parole = String(txt || '').split(' '), r = ''; for (var i = 0; i < parole.length; i++) { var p2 = r ? r + ' ' + parole[i] : parole[i]; if (q.measureText(p2).width > W - 40 && r) { q.fillText(r, 20, y); y += max; r = parole[i]; if (y > H - 16) return; } else r = p2; } if (r && y <= H - 16) { q.fillText(r, 20, y); y += max; } }
      riga(sc2.titolo || sc2.sezione, '800 24px system-ui', '#5eead4', 30);
      if (sc2.scheda) riga('▸ ' + sc2.scheda, '700 16px system-ui', '#9fe7ff', 22);
      (sc2.controlli || []).slice(0, 6).forEach(function (x) { riga(x.etichetta + ' = ' + x.valore, '600 15px ui-monospace,monospace', '#ffd27a', 20); });
      y += 4; riga((sc2.testo || '').slice(0, 520), '400 15px system-ui', '#cfe2ff', 20);
    }
    function tema(testo, conSchermo) {
      var Lv = globale.BSISpectraLive, aperta = Lv && Lv.schermo ? Lv.schermo() : null;
      if (conSchermo && aperta && aperta.sezione) { OL.auto = false; vivo.ultima = null; OL.mostra('schermo'); vivo(); return; }
      var n = sceneDi(testo); if (n) { OL.auto = false; OL.mostra(n); clearTimeout(tema._t); tema._t = setTimeout(function () { OL.auto = true; }, 60000); }
    }
    F.tema = tema;
    function suTema(e) { var d = e.detail || {}; tema(d.testo, d.schermo); }
    D.addEventListener('bsi-spectra-tema', suTema);
    function aggiornaNota() { var c = S.presente(); inv.hidden = c; nota.textContent = ''; if (!c && S.caricato === false) { inv.querySelector('b').textContent = t('Spectra non è arrivato: serve la rete la prima volta.', 'Spectra did not arrive: the network is needed the first time.'); invB.hidden = false; } }
    aggiornaNota();
    function statoHud(s) { hud.innerHTML = '<span class="bsiSF-led"></span>SPECTRA · <b>' + s + '</b>'; }

    /* i pulsanti: corpo dal dispositivo, conversazione dal vivo, studio */
    function bottone(testo, titolo, fn) { var b = D.createElement('button'); b.type = 'button'; b.textContent = testo; b.title = titolo; b.setAttribute('aria-label', titolo); b.onclick = fn; az.appendChild(b); return b; }
    if (globale.BSISpectraLive && globale.BSISpectraLive.apri) bottone(t('🎙️ Parla con me', '🎙️ Talk to me'), t('Apri la conversazione dal vivo con Spectra', 'Open the live conversation with Spectra'), function () { globale.BSISpectraLive.apri(); });
    /* «🧠 Spiega» nella finestra di Spectra */
    if (globale.bsiOpenAIHub) bottone(t('🧠 Spiega', '🧠 Explain'), t('Spectra spiega tutto, anche ciò che hai sullo schermo: spettri, grafici, scene 3D', 'Spectra explains everything, including what is on screen: spectra, graphs, 3D scenes'), function () { globale.bsiOpenAIHub('spiega'); }).className = 'bsiSF-lez';
    var a = D.createElement('a'); a.href = './spectra-studio.html'; a.textContent = t('🎓 Studio', '🎓 Studio'); a.title = t('Le lezioni immersive di Spectra', 'Spectra\'s immersive lessons'); az.appendChild(a);


    /* la misura del riquadro e l'inquadratura: Spectra intero, dai piedi alla testa */
    function adatta() {
      var w = box.clientWidth || 300, h = Math.max(160, (box.clientHeight || 300) - (az.offsetHeight || 0)); ren.setSize(w, h, false); cam.aspect = w / h;
      /* in un riquadro largo Spectra sta a sinistra (lascia spazio ai pulsanti), in uno stretto al centro */
      /* l'inquadratura contiene Spectra intero (a sinistra) e l'ologramma (a destra): 2,5 m di larghezza, 2,15 di altezza */
      cam.clearViewOffset(); var tg = Math.tan(cam.fov * Math.PI / 360);
      posCam(Math.max(2.2 / (2 * tg), 2.55 / (2 * tg * cam.aspect)));
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
      if (OL.attuale !== 'schermo') { var n2 = sceneDi(s); if (n2 && OL.auto) OL.mostra(n2); }
      S.emozione(emo || emozioneDi(s), 6); S.dici(s); quando = 0;
      /* spiegando, Spectra indica l'ologramma, poi accompagna con le mani */
      S.fai('indica', OL.grp.getWorldPosition(new T.Vector3()), 2.5); clearTimeout(F._g); F._g = setTimeout(function () { S.fai('spiega', null, Math.min(8, 1 + s.length / 45)); }, 2600);
    }
    F.reagisci = reagisci;
    function suStato(e) { var s = e.detail && e.detail.stato; if (s === 'pensa' || s === 'strumenti' || s === 'scrive') { clearTimeout(F._g); S.emozione('concentrata', 8); S.fai('pensa', null, 8); statoHud(t('PENSA', 'THINKING')); } else if (s === 'ascolta') { S.emozione('curiosa', 6); statoHud(t('TI ASCOLTA', 'LISTENING TO YOU')); } }
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
      OL.passo(dt); if (OL.attuale === 'schermo') { vivoT += dt; if (vivoT > 0.2) { vivoT = 0; vivo(); } }
      if (quando > 6 && !(S.corpo && S.corpo.testo)) statoHud(t('IN ASCOLTO', 'LISTENING'));
      anello.material.color.setHSL(0.55 + (S.corpo && S.corpo.testo ? 0.08 : 0), 1, 0.55 + 0.1 * Math.sin(ora / 600));
      ren.render(sc, cam);
    }
    requestAnimationFrame(giro);
    F.distruggi = function () { F.attiva = false; D.removeEventListener('bsi-spectra-stato', suStato); D.removeEventListener('bsi-spectra-risposta', suRisposta); D.removeEventListener('bsi-spectra-dice', suRisposta); D.removeEventListener('bsi-spectra-tema', suTema); try { ren.dispose(); ren.forceContextLoss(); } catch (e) {} if (box.parentNode) box.parentNode.removeChild(box); };
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
    ids = ids || ['bsi-pane-spiega', 'sai', 'sareachim', 'sareafis', 'sareamat', 'sesplchim', 'sesplfis', 'sesplmat'];
    function bersaglio() {
      /* LA CONSOLE SPECTRA LIVE, aperta, ha la precedenza su tutto: al posto del busto, Spectra col corpo e l'ologramma */
      /* l'OLOGRAMMA INTERATTIVO aperto: Spectra va li', a spiegare */
      var oi = D.getElementById('bsi-olo-ov');
      if (oi && oi.classList.contains('aperto')) { var po = D.getElementById('bsiOI-figura'); if (po) return po; }
      var hud = D.getElementById('bsiJV');
      if (hud && hud.classList.contains('aperto')) {
        var posto = D.getElementById('bsiJV-figura'); if (!posto) { posto = D.createElement('div'); posto.id = 'bsiJV-figura'; hud.appendChild(posto); }
        stile(); hud.classList.add('con-figura'); spazioConsole(hud, posto); return posto;   /* lo stile subito: il posto si crea prima che la figura sia pronta */
      }
      for (var i = 0; i < ids.length; i++) {
        var s = D.getElementById(ids[i]); if (!s || !s.offsetParent) continue;
        /* dentro la sezione: prima del suo contenuto principale (dopo il titolo, se c'e') */
        return s;
      }
      return null;
    }
    /* (v242) nella console la figura prende lo spazio del busto: sotto la testata e la telemetria, sopra lo stato,
       misurati sul posto (sul telefono le percentuali fisse finivano sotto la telemetria) */
    function spazioConsole(hud, posto) {
      var h = hud.getBoundingClientRect(), su = 0, giu = h.bottom;
      ['bsiJV-top', 'bsiJV-tel'].forEach(function (id) { var e = D.getElementById(id); if (e && e.offsetParent) { var r = e.getBoundingClientRect(); if (r.height) su = Math.max(su, r.bottom); } });
      var st = D.getElementById('bsiJV-stato'); if (st && st.offsetParent) { var r2 = st.getBoundingClientRect(); if (r2.height) giu = r2.top; }
      var t = Math.round(su - h.top + 6), a = Math.round(giu - su - 12);
      if (a < 120) return;   /* spazio troppo piccolo: restano le regole del foglio di stile */
      var top = t + 'px', alt = a + 'px';
      if (posto.style.top !== top || posto.style.height !== alt) { posto.style.top = top; posto.style.height = alt; if (condivisa) condivisa.adatta(); }
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
      if (s.id === 'bsi-pane-spiega' || s.id === 'bsiJV-figura' || s.id === 'bsiOI-figura' ? condivisa.box.parentNode !== s : (!s.contains(condivisa.box) || condivisa.box.parentNode !== q0 || (d0 && condivisa.box.previousElementSibling !== d0))) {
        /* dopo il titolo, la «Lezione guidata» e la descrizione, prima delle schede e del contenuto */
        var q = s.querySelector('.bsiFX') || s, dopo = null;
        if (s.id === 'bsi-pane-spiega' || s.id === 'bsiJV-figura' || s.id === 'bsiOI-figura') { s.insertBefore(condivisa.box, s.firstChild); condivisa.adatta(); return; }
        ['.bsiFX-sotto', '.bsiLZ-avvia', '.section-title'].some(function (sel) { var e = q.querySelector(':scope > ' + sel); if (e) { dopo = e; return true; } return false; });
        if (dopo) q.insertBefore(condivisa.box, dopo.nextSibling); else q.insertBefore(condivisa.box, q.firstChild);
        condivisa.box.classList.toggle('bsiEX-palco', /^sespl/.test(s.id));   /* nelle sezioni «Esplora» Spectra resta in scena mentre si scorre */
        condivisa.adatta();
      }
    }
    controlla(); setInterval(controlla, 800);
    D.addEventListener('click', function () { setTimeout(controlla, 60); }, true);
    return { controlla: controlla, figura: function () { return condivisa; } };
  }

  globale.BSISpectraFigura = { Spectra: Spectra, Ologramma: Ologramma, SCENE_OLO: SCENE_OLO, sceneDi: sceneDi, monta: monta, sezioni: sezioni, prepara: prepara, dbCorpo: dbCorpo, emozioneDi: emozioneDi, LIMITE: LIMITE, RIG: RIG, figura: null };
  /* nell'app (non nello studio, che usa il controllore direttamente) le sezioni dell'AI ricevono la figura */
  if (D && !/spectra-studio\.html/.test(globale.location && globale.location.pathname || '')) {
    var via = function () { if (D.querySelector('[data-s="sai"],[data-s="sareachim"]')) sezioni(); };
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', via); else via();
  }
})(typeof window !== 'undefined' ? window : this);
