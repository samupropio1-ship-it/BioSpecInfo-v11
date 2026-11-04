/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-corpo.js — il corpo di Spectra: driver per qualunque avatar umanoide
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Spectra deve avere un corpo che respira, guarda, gesticola, cammina e si
   siede, e un viso che parla con il labiale e mostra le emozioni. Il modello
   scelto dall'autore (un personaggio cyberpunk da Sketchfab) non e' ancora
   arrivato: questo driver e' GENERICO. Si collega a qualunque GLB umanoide e
   scopre da solo che cosa il modello sa fare.

   CHE COSA CERCA NEL MODELLO
   · OSSA, per nome, in tutte le convenzioni comuni (Mixamo «mixamorig:Hips»,
     Ready Player Me, VRM, Unreal «pelvis/spine_01», nomi generici): anche,
     tre segmenti di colonna, collo, testa, occhi, mandibola, clavicole,
     braccia, avambracci, mani, cosce, gambe, piedi;
   · BLENDSHAPE del viso: i 52 di ARKit (jawOpen, mouthSmileLeft,
     eyeBlinkLeft, browInnerUp…) o i visemi Oculus (viseme_aa…);
   · CAPELLI: mesh o materiali con «hair», «capell», «bangs», «fringe»;
   · CLIP di animazione (walk, idle, sit…), se il file le ha.
   Il rapporto (rapporto()) dice che cosa c'e' e che cosa manca: e' il
   controllo dei requisiti del documento docs/spectra/01.

   COME MUOVE IL CORPO SENZA CONOSCERE GLI ASSI DEL MODELLO
   Ogni rig ha i suoi assi locali: ruotare «il braccio di 30° attorno a x»
   significa cose diverse in modelli diversi. Qui ogni posa e' una DIREZIONE
   NEL MONDO: «il braccio punta in basso e un po' in fuori», «l'avambraccio
   punta verso l'oggetto». orienta(osso, direzione) calcola la rotazione che
   porta la direzione osso → figlio sulla direzione voluta e la riporta nel
   sistema locale dell'osso: una cinematica inversa minima che vale per ogni
   rig. Le pose si fondono con pesi e molle, come le espressioni del viso.

   IL COMPORTAMENTO
   · respiro (torace e spalle), spostamento del peso, micro-oscillazioni;
   · sguardo (occhi, poi collo e testa, con limiti) verso un punto;
   · emozioni: le 17 di Spectra tradotte in pesi di blendshape ARKit;
   · labiale: dal testo (visemi) o dall'audio (energia e centroide);
   · battito delle palpebre naturale, piu' raro quando e' concentrato;
   · gesti: indica, spiega (mani aperte), pensa (mano al mento), attende
     (braccia conserte), conclude;
   · passo verso un punto (clip «walk» se c'e', altrimenti ciclo procedurale)
     e seduta (clip «sit» se c'e', altrimenti postura procedurale).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  /* ── i nomi delle ossa nelle convenzioni comuni (regex sul nome normalizzato) ── */
  var OSSA = {
    anche: /^(hips|pelvis|root_?pelvis|hip|root_?x)$/,
    colonna: /^(spine|spine_?0?1|abdomen|spine_?01_?x)$/, petto: /^(spine_?1|spine_?0?2|chest)$/, torace: /^(spine_?2|spine_?0?3|upperchest|upper_?chest)$/,
    collo: /^(neck|neck_?0?1|neck_?x)$/, testa: /^(head|head_?x)$/, mandibola: /^(jaw|lowerjaw|jaw_?bone)$/,
    occhioS: /^(lefteye|eye_?l|l_?eye|eyeleft)$/, occhioD: /^(righteye|eye_?r|r_?eye|eyeright)$/,
    claviS: /^(leftshoulder|clavicle_?l|l_?clavicle|shoulder_?l)$/, claviD: /^(rightshoulder|clavicle_?r|r_?clavicle|shoulder_?r)$/,
    braccioS: /^(leftarm|upperarm_?l|l_?upperarm|leftupperarm|arm_?l|arm_stretch_?l)$/, braccioD: /^(rightarm|upperarm_?r|r_?upperarm|rightupperarm|arm_?r|arm_stretch_?r)$/,
    avambS: /^(leftforearm|lowerarm_?l|l_?forearm|leftlowerarm|forearm_?l|forearm_stretch_?l)$/, avambD: /^(rightforearm|lowerarm_?r|r_?forearm|rightlowerarm|forearm_?r|forearm_stretch_?r)$/,
    manoS: /^(lefthand|hand_?l|l_?hand)$/, manoD: /^(righthand|hand_?r|r_?hand)$/,
    cosciaS: /^(leftupleg|thigh_?l|l_?thigh|leftupperleg|upperleg_?l|thigh_stretch_?l)$/, cosciaD: /^(rightupleg|thigh_?r|r_?thigh|rightupperleg|upperleg_?r|thigh_stretch_?r)$/,
    gambaS: /^(leftleg|calf_?l|l_?calf|leftlowerleg|lowerleg_?l|shin_?l|leg_stretch_?l)$/, gambaD: /^(rightleg|calf_?r|r_?calf|rightlowerleg|lowerleg_?r|shin_?r|leg_stretch_?r)$/,
    piedeS: /^(leftfoot|foot_?l|l_?foot)$/, piedeD: /^(rightfoot|foot_?r|r_?foot)$/
  };
  /* (v239) anche la convenzione di Auto-Rig Pro: root.x, spine_01.x, neck.x, head.x, arm_stretch.l, forearm_stretch.l,
     thigh_stretch.l, leg_stretch.l — con o senza il punto, che three.js toglie dai nomi */
  /* il prefisso si toglie solo se seguito da un separatore: «rig_» si', ma non il «rig» di «RightArm» */
  function normaNome(n) { return String(n || '').toLowerCase().replace(/^.*[:|]/, '').replace(/^(mixamorig|bip0?1|def|cc_base|rig)[_ ]/, '').replace(/[\s.-]/g, '_').replace(/_+/g, '_'); }

  /* ── le emozioni di Spectra in pesi ARKit ── */
  var EMO = {
    neutro: {}, serena: { mouthSmileLeft: 0.18, mouthSmileRight: 0.18 },
    gioia: { mouthSmileLeft: 0.85, mouthSmileRight: 0.85, cheekSquintLeft: 0.55, cheekSquintRight: 0.55, eyeSquintLeft: 0.35, eyeSquintRight: 0.35, browInnerUp: 0.15 },
    sorrisoCaldo: { mouthSmileLeft: 0.5, mouthSmileRight: 0.5, cheekSquintLeft: 0.3, cheekSquintRight: 0.3 },
    divertita: { mouthSmileLeft: 0.75, mouthSmileRight: 0.25, browOuterUpLeft: 0.35, cheekSquintLeft: 0.4 },
    sorpresa: { browInnerUp: 0.9, browOuterUpLeft: 0.85, browOuterUpRight: 0.85, eyeWideLeft: 0.8, eyeWideRight: 0.8, jawOpen: 0.3, mouthFunnel: 0.25 },
    stupore: { browInnerUp: 1, browOuterUpLeft: 1, browOuterUpRight: 1, eyeWideLeft: 1, eyeWideRight: 1, jawOpen: 0.55 },
    curiosa: { browOuterUpLeft: 0.7, browInnerUp: 0.3, mouthSmileLeft: 0.15, mouthSmileRight: 0.15, eyeWideLeft: 0.2 },
    dubbio: { browOuterUpLeft: 0.8, browDownRight: 0.3, mouthPressLeft: 0.35, mouthPressRight: 0.35, mouthSmileLeft: 0.12 },
    scettica: { noseSneerLeft: 0.6, noseSneerRight: 0.5, browDownLeft: 0.4, browDownRight: 0.4, eyeSquintLeft: 0.4, eyeSquintRight: 0.4 },
    riflessione: { browDownLeft: 0.35, browDownRight: 0.35, mouthPressLeft: 0.3, mouthPressRight: 0.3, eyeSquintLeft: 0.15, eyeSquintRight: 0.15 },
    concentrata: { browDownLeft: 0.7, browDownRight: 0.7, mouthPressLeft: 0.55, mouthPressRight: 0.55, eyeSquintLeft: 0.35, eyeSquintRight: 0.35 },
    preoccupata: { browInnerUp: 0.7, mouthFrownLeft: 0.4, mouthFrownRight: 0.4, mouthPressLeft: 0.25, mouthPressRight: 0.25 },
    empatica: { browInnerUp: 0.65, mouthFrownLeft: 0.25, mouthFrownRight: 0.25, mouthSmileLeft: 0.1, mouthSmileRight: 0.1, eyeSquintLeft: 0.15, eyeSquintRight: 0.15 },
    determinata: { browDownLeft: 0.5, browDownRight: 0.5, mouthPressLeft: 0.7, mouthPressRight: 0.7, jawForward: 0.2 },
    fiera: { mouthSmileLeft: 0.35, mouthSmileRight: 0.35, browInnerUp: 0.1 },
    attenta: { browInnerUp: 0.35, browOuterUpLeft: 0.25, browOuterUpRight: 0.25, eyeWideLeft: 0.25, eyeWideRight: 0.25 }
  };
  /* i visemi (lettera → apertura, arrotondamento, larghezza) come in bsi-spectra-androide.js */
  var VIS = { a: [1, 0, 0.1], e: [0.6, 0, 0.55], i: [0.32, 0, 0.9], o: [0.7, 0.85, 0], u: [0.4, 1, 0], m: [0, 0.1, 0], b: [0, 0.1, 0], p: [0, 0.1, 0], f: [0.12, 0, 0.3], v: [0.12, 0, 0.3], s: [0.18, 0, 0.6], z: [0.2, 0, 0.5], l: [0.35, 0, 0.3], r: [0.3, 0.1, 0.2], t: [0.22, 0, 0.35], d: [0.25, 0, 0.3], n: [0.22, 0, 0.3], ' ': [0.05, 0, 0] };
  function visema(c) { c = (c || '').toLowerCase().normalize ? (c || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : (c || '').toLowerCase(); return VIS[c] || (/[a-z]/.test(c) ? [0.28, 0, 0.2] : [0.04, 0, 0]); }
  function molla(m, b, K, dt) { var z = 0.65, w = Math.sqrt(K), n = Math.max(1, Math.ceil(dt / 0.012)), h = dt / n; for (var i = 0; i < n; i++) { m.v += ((b - m.x) * K - 2 * z * w * m.v) * h; m.x += m.v * h; } return m.x; }

  function Corpo(radice, opz) {
    var T = globale.THREE; opz = opz || {};
    this.T = T; this.radice = radice; this.opz = opz;
    this.ossa = {}; this.morph = {}; this.capelli = []; this.clip = {}; this.t = 0;
    var self = this;
    radice.updateMatrixWorld(true);
    radice.traverse(function (o) {
      if (o.isBone || o.type === 'Bone' || (o.isObject3D && o.userData && o.userData.osso)) {
        var n = normaNome(o.name);
        Object.keys(OSSA).forEach(function (k) { if (!self.ossa[k] && OSSA[k].test(n)) self.ossa[k] = o; });
      }
      if (o.isMesh && o.morphTargetDictionary) {
        Object.keys(o.morphTargetDictionary).forEach(function (nome) {
          var k = nome.replace(/^.*\./, ''), i = o.morphTargetDictionary[nome];
          (self.morph[k] = self.morph[k] || []).push({ mesh: o, i: i });
          var kl = k.toLowerCase(); if (!self.morph[kl]) self.morph[kl] = self.morph[k];
        });
      }
      if (o.isMesh && /hair|capell|bangs|fringe|hairstyle|ponytail/i.test(o.name + ' ' + (o.material && o.material.name || ''))) self.capelli.push(o);
    });
    if (opz.animazioni && opz.animazioni.length) {
      this.mixer = new T.AnimationMixer(radice);
      opz.animazioni.forEach(function (c) { var n = c.name.toLowerCase(); ['idle', 'walk', 'sit', 'stand', 'wave', 'point', 'talk'].forEach(function (k) { if (n.indexOf(k) >= 0 && !self.clip[k]) self.clip[k] = self.mixer.clipAction(c); }); });
      if (this.clip.idle) this.clip.idle.play();
    }
    /* le pose di riposo, per tornarci e per misurare le lunghezze */
    this.riposo = {}; Object.keys(this.ossa).forEach(function (k) { self.riposo[k] = self.ossa[k].quaternion.clone(); });
    this.molle = {}; this.pesi = {}; this.emo = 'serena'; this.emoK = 1; this.emoFino = 0;
    this.sguardo = new T.Vector3(0, 1.6, 3); this.gesto = null; this.gestoT = 0; this.meta = null; this.seduto = 0; this.sedutoT = 0;
    this.bocca = { apertura: 0, rotondo: 0, largo: 0 }; this.testo = ''; this.pos = 0; this.vel = 13; this.palp = 0; this.prossimo = 2;
    this.v1 = new T.Vector3(); this.v2 = new T.Vector3(); this.v3 = new T.Vector3(); this.q1 = new T.Quaternion(); this.q2 = new T.Quaternion();
    if (opz.capelliNeri !== false) this.capelliNeri();
  }

  /* ── il rapporto: che cosa il modello sa fare ── */
  Corpo.prototype.rapporto = function () {
    var ARK = ['jawOpen', 'mouthSmileLeft', 'mouthSmileRight', 'eyeBlinkLeft', 'eyeBlinkRight', 'browInnerUp', 'browDownLeft', 'browDownRight', 'mouthFrownLeft', 'mouthFrownRight', 'eyeWideLeft', 'eyeWideRight', 'mouthFunnel', 'mouthPucker'];
    var self = this, ossa = Object.keys(OSSA), trovate = ossa.filter(function (k) { return self.ossa[k]; });
    var bs = ARK.filter(function (k) { return self.morph[k] || self.morph[k.toLowerCase()]; });
    return {
      ossa: trovate.length + '/' + ossa.length, mancanti: ossa.filter(function (k) { return !self.ossa[k]; }),
      blendshape: bs.length + '/' + ARK.length, capelli: this.capelli.length, clip: Object.keys(this.clip),
      locomozione: !!(this.ossa.cosciaS && this.ossa.gambaS && this.ossa.cosciaD && this.ossa.gambaD), viso: bs.length >= 8 ? 'blendshape' : this.ossa.mandibola ? 'ossa' : 'assente'
    };
  };

  /* ── i capelli neri: colore, lucentezza e, se la texture e' colorata, desaturazione nello shader ── */
  Corpo.prototype.capelliNeri = function (colore) {
    var T = this.T, col = new T.Color(colore != null ? colore : 0x0a0a0c);
    this.capelli.forEach(function (m) {
      (Array.isArray(m.material) ? m.material : [m.material]).forEach(function (mat) {
        if (!mat) return;
        if (mat.color) mat.color.copy(col);
        if ('roughness' in mat) mat.roughness = 0.5; if ('metalness' in mat) mat.metalness = 0.0; if ('envMapIntensity' in mat) mat.envMapIntensity = 0.9;
        if (mat.map) {
          /* la texture dipinta (rossa, magari) diventa nera: si tiene solo la sua luminanza, molto abbassata */
          mat.onBeforeCompile = function (s) { s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  { float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = vec3(0.04 + 0.08 * lum) * vec3(0.95, 0.97, 1.05); }'); };
          mat.customProgramCacheKey = function () { return 'bsi-capelli-neri'; };
        }
        mat.needsUpdate = true;
      });
    });
  };

  /* ── l'IK minimo: porta la direzione osso → figlio su una direzione del mondo ── */
  Corpo.prototype.orienta = function (osso, dir, peso) {
    if (!osso || !osso.children.length || !(peso > 0)) return;
    /* il figlio che da' la direzione dell'osso: il piu' lontano (nei rig con ossa di torsione a meta' segmento,
       come Auto-Rig Pro, il primo figlio puo' essere la torsione, quasi sovrapposta) */
    var T = this.T, figli = osso.children.filter(function (c) { return c.isBone || c.type === 'Bone' || (c.userData && c.userData.osso); });
    osso.updateMatrixWorld(true);
    var po = new T.Vector3().setFromMatrixPosition(osso.matrixWorld), figlio = figli[0] || osso.children[0], dmax = -1;
    figli.forEach(function (c) { var d = new T.Vector3().setFromMatrixPosition(c.matrixWorld).distanceTo(po); if (d > dmax) { dmax = d; figlio = c; } });
    var a = this.v1.setFromMatrixPosition(osso.matrixWorld), b = this.v2.setFromMatrixPosition(figlio.matrixWorld);
    var cur = b.sub(a); if (cur.lengthSq() < 1e-10) return; cur.normalize();
    var delta = this.q1.setFromUnitVectors(cur, this.v3.copy(dir).normalize());
    var wq = osso.getWorldQuaternion(new T.Quaternion()), nuova = delta.multiply(wq);
    var pq = osso.parent ? osso.parent.getWorldQuaternion(new T.Quaternion()).invert() : new T.Quaternion();
    var locale = pq.multiply(nuova);
    osso.quaternion.slerp(locale, Math.min(1, peso));
    osso.updateMatrixWorld(true);
  };
  function avanti(radice, T) { return new T.Vector3(0, 0, 1).applyQuaternion(radice.getWorldQuaternion(new T.Quaternion())).setY(0).normalize(); }
  /* la destra del personaggio: avanti × su (un modello rivolto verso +z ha la destra verso −x) */
  function destra(radice, T) { var f = avanti(radice, T); return new T.Vector3(-f.z, 0, f.x); }

  /* ── API ── */
  Corpo.prototype.emozione = function (nome, secondi, k) { if (!EMO[nome]) return false; this.emo = nome; this.emoK = k == null ? 1 : k; this.emoFino = this.t + (secondi || 4); return true; };
  Corpo.prototype.dici = function (testo) { this.testo = String(testo || ''); this.pos = 0; this.daAudio = false; };
  Corpo.prototype.audio = function (b) { this.daAudio = true; this.bocca.apertura = b.apertura || 0; this.bocca.rotondo = b.rotondo || 0; this.bocca.largo = b.largo || 0; if (this.testo && b.frazione != null) this.pos = b.frazione * this.testo.length; if (b.frazione >= 1) { this.testo = ''; this.daAudio = false; } };
  Corpo.prototype.taci = function () { this.testo = ''; this.daAudio = false; this.bocca.apertura = 0; };
  Corpo.prototype.guarda = function (p) { this.sguardo.copy(p); };
  Corpo.prototype.fai = function (gesto, bersaglio, secondi) { this.gesto = gesto; this.gestoBers = bersaglio ? bersaglio.clone() : null; this.gestoFino = this.t + (secondi || 3); };
  Corpo.prototype.cammina = function (p) { this.meta = p.clone(); if (this.clip.walk) { this.clip.walk.reset().play(); this.clip.walk.weight = 1; } };
  Corpo.prototype.siedi = function (s) { this.sedutoT = s === false ? 0 : 1; if (this.clip.sit) { if (s === false) this.clip.sit.stop(); else this.clip.sit.reset().play(); } };
  Corpo.prototype.peso = function (nome) { var m = this.morph[nome] || this.morph[nome.toLowerCase()]; return m ? m[0].mesh.morphTargetInfluences[m[0].i] : null; };
  Corpo.prototype.imposta = function (nome, v) { var m = this.morph[nome] || this.morph[nome.toLowerCase()]; if (!m) return false; m.forEach(function (x) { x.mesh.morphTargetInfluences[x.i] = v; }); return true; };

  /* ── il fotogramma ── */
  Corpo.prototype.passo = function (dt) {
    var T = this.T, O = this.ossa, self = this, t = this.t += dt, lento = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.mixer) this.mixer.update(dt);
    /* si riparte dalla posa di riposo: ogni fotogramma la postura si ricostruisce, cosi' i gesti non si accumulano */
    if (!this.mixer || !this.clip.idle) Object.keys(this.riposo).forEach(function (k) { O[k].quaternion.copy(self.riposo[k]); });
    this.radice.updateMatrixWorld(true);
    var F = avanti(this.radice, T), R = destra(this.radice, T), SU = new T.Vector3(0, 1, 0);
    /* ── passo verso la meta ── */
    var camm = 0;
    if (this.meta) {
      var d = this.v1.copy(this.meta).sub(this.radice.position).setY(0), L = d.length();
      if (L < 0.05) { this.meta = null; if (this.clip.walk) this.clip.walk.stop(); }
      else {
        var verso = d.normalize(), ang = Math.atan2(verso.x, verso.z), cur = this.radice.rotation.y, dif = Math.atan2(Math.sin(ang - cur), Math.cos(ang - cur));
        this.radice.rotation.y = cur + dif * Math.min(1, dt * 5);
        if (Math.abs(dif) < 0.6) { this.radice.position.addScaledVector(verso, Math.min(L, dt * (this.opz.velocita || 0.9))); camm = 1; }
        this.radice.updateMatrixWorld(true); F = avanti(this.radice, T); R = destra(this.radice, T);
      }
    }
    this.fase = (this.fase || 0) + dt * (camm ? 7.2 : 0);
    var seduto = molla(this.molle.sed || (this.molle.sed = { x: 0, v: 0 }), this.sedutoT, 12, dt); this.seduto = seduto;
    /* ── le braccia a riposo: in basso e un po' in fuori (corregge la posa a T dei modelli) ── */
    var respiro = lento ? 0 : Math.sin(t * 1.6) * (1 + 0.4 * (this.testo ? 1 : 0));
    var giuS = new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(R, -0.18).addScaledVector(F, 0.04);
    var giuD = new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(R, 0.18).addScaledVector(F, 0.04);
    if (!this.clip.idle) {
      this.orienta(O.braccioS, giuS, 1); this.orienta(O.braccioD, giuD, 1);
      this.orienta(O.avambS, new T.Vector3().copy(giuS).addScaledVector(F, 0.25), 1); this.orienta(O.avambD, new T.Vector3().copy(giuD).addScaledVector(F, 0.25), 1);
    }
    /* ── il passo procedurale (se il file non ha la clip): cosce e gambe in controfase, braccia in opposizione ── */
    if (camm && !this.clip.walk) {
      var s = Math.sin(this.fase), c = Math.cos(this.fase);
      this.orienta(O.cosciaS, new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(F, 0.45 * s), 1);
      this.orienta(O.cosciaD, new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(F, -0.45 * s), 1);
      this.orienta(O.gambaS, new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(F, 0.45 * s - 0.5 * Math.max(0, -c)), 1);
      this.orienta(O.gambaD, new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(F, -0.45 * s - 0.5 * Math.max(0, c)), 1);
      this.orienta(O.braccioS, new T.Vector3().copy(giuS).addScaledVector(F, -0.35 * s), 1);
      this.orienta(O.braccioD, new T.Vector3().copy(giuD).addScaledVector(F, 0.35 * s), 1);
      if (O.anche) O.anche.position.y = (this.riposoAnche == null ? (this.riposoAnche = O.anche.position.y) : this.riposoAnche) + Math.abs(c) * 0.025;
    } else if (O.anche && this.riposoAnche != null && seduto < 0.01) O.anche.position.y = this.riposoAnche;
    /* ── seduta procedurale: cosce in avanti, gambe in giu', bacino abbassato ── */
    if (seduto > 0.01 && !this.clip.sit) {
      if (this.riposoAnche == null && O.anche) this.riposoAnche = O.anche.position.y;
      this.orienta(O.cosciaS, new T.Vector3().copy(SU).multiplyScalar(-1).lerp(F, seduto * 0.95), 1);
      this.orienta(O.cosciaD, new T.Vector3().copy(SU).multiplyScalar(-1).lerp(F, seduto * 0.95), 1);
      this.orienta(O.gambaS, new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(F, 0.1 * seduto), 1);
      this.orienta(O.gambaD, new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(F, 0.1 * seduto), 1);
      if (O.anche) O.anche.position.y = this.riposoAnche - seduto * (this.opz.abbassaSeduto || 0.42) * (this.opz.scalaOssa || 1);
    }
    /* ── i gesti ── */
    var g = this.gesto && t < this.gestoFino ? this.gesto : null, gk = molla(this.molle.gesto || (this.molle.gesto = { x: 0, v: 0 }), g ? 1 : 0, 30, dt);
    if (g || gk > 0.02) {
      var gg = g || this.ultimoGesto; this.ultimoGesto = gg;
      var testa = O.testa ? O.testa.getWorldPosition(new T.Vector3()) : this.radice.position.clone().add(new T.Vector3(0, 1.6, 0));
      if (gg === 'indica' && this.gestoBers && O.braccioD) {
        var spalla = O.braccioD.getWorldPosition(new T.Vector3()), verso2 = this.gestoBers.clone().sub(spalla).normalize();
        this.orienta(O.braccioD, verso2, gk); this.orienta(O.avambD, verso2, gk);
      } else if (gg === 'spiega') {
        this.orienta(O.braccioS, new T.Vector3().copy(giuS).addScaledVector(F, 0.7).addScaledVector(R, -0.25), gk); this.orienta(O.avambS, new T.Vector3().copy(F).addScaledVector(R, -0.4).addScaledVector(SU, 0.2), gk);
        this.orienta(O.braccioD, new T.Vector3().copy(giuD).addScaledVector(F, 0.7).addScaledVector(R, 0.25), gk); this.orienta(O.avambD, new T.Vector3().copy(F).addScaledVector(R, 0.4).addScaledVector(SU, 0.2 + 0.1 * Math.sin(t * 3)), gk);
      } else if (gg === 'pensa' && O.avambD) {
        this.orienta(O.braccioD, new T.Vector3().copy(SU).multiplyScalar(-1).addScaledVector(F, 0.6).addScaledVector(R, 0.1), gk);
        var mento = testa.clone().addScaledVector(SU, -0.12).addScaledVector(F, 0.1), gomito = O.avambD.getWorldPosition(new T.Vector3());
        this.orienta(O.avambD, mento.sub(gomito), gk);
      } else if (gg === 'attende') {
        this.orienta(O.braccioS, new T.Vector3().copy(giuS).addScaledVector(F, 0.5), gk); this.orienta(O.avambS, new T.Vector3().copy(R).addScaledVector(F, 0.35), gk);
        this.orienta(O.braccioD, new T.Vector3().copy(giuD).addScaledVector(F, 0.5), gk); this.orienta(O.avambD, new T.Vector3().copy(R).multiplyScalar(-1).addScaledVector(F, 0.35), gk);
      } else if (gg === 'conclude' && O.avambD) {
        this.orienta(O.braccioD, new T.Vector3().copy(giuD).addScaledVector(F, 0.8), gk); this.orienta(O.avambD, new T.Vector3().copy(SU).addScaledVector(F, 0.6), gk);
      }
    }
    /* ── il respiro: torace e spalle ── */
    if (!lento) {
      if (O.torace || O.petto) { var to = O.torace || O.petto; to.rotateX(-0.012 * respiro); }
      if (O.claviS) O.claviS.rotateZ(0.012 * respiro); if (O.claviD) O.claviD.rotateZ(-0.012 * respiro);
      if (O.anche && !camm && seduto < 0.1) O.anche.rotateZ(0.012 * Math.sin(t * 0.37));   /* il peso che si sposta */
    }
    /* ── lo sguardo: collo e testa verso il punto, con limiti ── */
    if (O.testa) {
      var tp = O.testa.getWorldPosition(new T.Vector3()), dirG = this.sguardo.clone().sub(tp);
      var yaw = Math.atan2(dirG.dot(R), dirG.dot(F)), pitch = Math.atan2(dirG.y, Math.hypot(dirG.dot(R), dirG.dot(F)));
      yaw = Math.max(-0.9, Math.min(0.9, yaw)); pitch = Math.max(-0.45, Math.min(0.45, pitch));
      var sy = molla(this.molle.sy || (this.molle.sy = { x: 0, v: 0 }), yaw, 20, dt), sp = molla(this.molle.sp || (this.molle.sp = { x: 0, v: 0 }), pitch, 20, dt);
      var assiSu = SU, asseDx = R;
      [[O.collo, 0.35], [O.testa, 0.65]].forEach(function (x) {
        if (!x[0]) return; var o = x[0], wq = o.getWorldQuaternion(new T.Quaternion());
        /* imbardata positiva = verso destra = rotazione negativa attorno all'alto; beccheggio positivo = in su = rotazione positiva attorno alla destra */
        var rot = new T.Quaternion().setFromAxisAngle(assiSu, -sy * x[1]).multiply(new T.Quaternion().setFromAxisAngle(asseDx, sp * x[1]));
        var pq = o.parent.getWorldQuaternion(new T.Quaternion()).invert(); o.quaternion.copy(pq.multiply(rot.multiply(wq))); o.updateMatrixWorld(true);
      });
    }
    /* ── il viso: emozione + labiale + battito ── */
    var emo = t < this.emoFino ? this.emo : 'serena', P = EMO[emo] || {}, k = t < this.emoFino ? this.emoK : 1;
    if (this.testo && !this.daAudio) {
      this.pos += dt * this.vel; var i = Math.floor(this.pos); if (i >= this.testo.length) { this.testo = ''; this.bocca = { apertura: 0, rotondo: 0, largo: 0 }; }
      else { var vv = visema(this.testo.charAt(i)); this.bocca.apertura = vv[0]; this.bocca.rotondo = vv[1]; this.bocca.largo = vv[2]; }
    }
    this.prossimo -= dt; if (this.prossimo <= 0 && !lento) { this.palp = 1; this.prossimo = Math.random() < 0.15 ? 0.3 : 2 + Math.random() * 4; }
    var chiuso = this.palp > 0 ? Math.sin(this.palp * Math.PI) : 0; this.palp = Math.max(0, this.palp - dt / 0.13);
    var bersagli = {};
    Object.keys(P).forEach(function (n) { bersagli[n] = P[n] * k; });
    bersagli.jawOpen = Math.max(bersagli.jawOpen || 0, this.bocca.apertura * 0.75);
    bersagli.mouthFunnel = Math.max(bersagli.mouthFunnel || 0, this.bocca.rotondo * 0.6); bersagli.mouthPucker = Math.max(bersagli.mouthPucker || 0, this.bocca.rotondo * 0.45);
    bersagli.mouthStretchLeft = this.bocca.largo * 0.4; bersagli.mouthStretchRight = this.bocca.largo * 0.4;
    bersagli.eyeBlinkLeft = Math.max(chiuso, (bersagli.eyeSquintLeft || 0) * 0.3); bersagli.eyeBlinkRight = Math.max(chiuso, (bersagli.eyeSquintRight || 0) * 0.3);
    var nomi = Object.keys(bersagli).concat(Object.keys(this.pesi));
    nomi.forEach(function (n) {
      if (!(self.morph[n] || self.morph[n.toLowerCase()])) return;
      var b = bersagli[n] || 0, veloce = /blink|jaw|mouthfunnel|mouthpucker|mouthstretch/i.test(n);   /* palpebre e bocca seguono subito (senza la /i un battito non si chiudeva mai) */
      var m = self.molle['m_' + n] || (self.molle['m_' + n] = { x: 0, v: 0 }), v = veloce ? b : molla(m, b, /brow/.test(n) ? 140 : 60, dt);
      self.pesi[n] = v; self.imposta(n, Math.max(0, Math.min(1, v)));
    });
    if (this.vp) this.passoViso(dt);
    /* senza blendshape: la mandibola e gli occhi con le ossa */
    if (!this.vp && !this.morph.jawOpen && !this.morph.jawopen && O.mandibola) { O.mandibola.rotateX(0.35 * this.bocca.apertura); }
    this.radice.updateMatrixWorld(true);
  };

  /* ═══ IL VISO PROCEDURALE (v239): per i modelli senza blendshape ════════════════
     Molti modelli (il robot «I-HOMO 08» scelto dall'autore, per esempio) hanno il viso
     scolpito ma nessuna espressione registrata. Qui il viso si anima come quello di «Noir»,
     ma i punti di riferimento non sono scritti a mano: si MISURANO sulla geometria.
     · occhi: i centri delle mesh degli occhi (nome con «eye»); da qui la distanza
       interoculare d, l'unita' di misura di tutto il resto;
     · punta del naso: il vertice piu' avanzato vicino alla linea mediana, sotto gli occhi;
     · linea della bocca: lungo la linea mediana, sotto il naso, il profilo del viso ha due
       sporgenze (labbro superiore e inferiore) e un incavo fra le due: e' quello;
     · mandibola: ruota attorno a un perno dietro la bocca, verso le orecchie.
     Poi gli stessi campi espressivi di «Noir» (sorriso, sopracciglia, tristezza, labbra
     strette, naso, guance, bocca arrotondata o larga), scalati con d, fusi sulla CPU in un
     attributo solo; gli occhi si schiacciano e si allargano (palpebre) e cambiano tinta.
     Le posizioni possono essere quantizzate (interi normalizzati): si leggono e si scrivono
     tenendone conto. */
  function lettore(a) { var k = !a.normalized ? 1 : a.array instanceof Int16Array ? 1 / 32767 : a.array instanceof Uint16Array ? 1 / 65535 : a.array instanceof Int8Array ? 1 / 127 : a.array instanceof Uint8Array ? 1 / 255 : 1; return { k: k, x: function (i) { return a.array[i * a.itemSize] * k; }, y: function (i) { return a.array[i * a.itemSize + 1] * k; }, z: function (i) { return a.array[i * a.itemSize + 2] * k; } }; }
  function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function gs(dx, dy, r) { return Math.exp(-(dx * dx + dy * dy) / (2 * r * r)); }
  var CAMPI_V = ['sorriso', 'rotondo', 'largo', 'sopra', 'accigliato', 'triste', 'sopraUno', 'mezzo', 'stretto', 'naso', 'guance'];
  /* le emozioni sui campi (come in bsi-spectra-androide.js) e gli occhi: [apertura, asimmetria, tinta] */
  var EMO_V = { neutro: {}, serena: { sorriso: 0.3, guance: 0.12 }, gioia: { sorriso: 0.95, guance: 0.75, sopra: 0.25 }, sorrisoCaldo: { sorriso: 0.6, guance: 0.4, sopra: 0.12 },
    divertita: { mezzo: 0.85, sorriso: 0.3, sopraUno: 0.35, guance: 0.35 }, sorpresa: { sopra: 1, bocca: 0.38, rotondo: 0.35 }, stupore: { sopra: 1, bocca: 0.62, rotondo: 0.15 },
    curiosa: { sopraUno: 0.7, sopra: 0.3, sorriso: 0.15 }, dubbio: { sopraUno: 0.9, accigliato: 0.25, stretto: 0.45, mezzo: 0.15 }, scettica: { naso: 0.75, accigliato: 0.45, stretto: 0.3, sopraUno: 0.4 },
    riflessione: { accigliato: 0.5, stretto: 0.35, sopraUno: 0.2 }, concentrata: { accigliato: 0.85, stretto: 0.6, guance: 0.25 }, preoccupata: { triste: 0.6, sopra: 0.3, accigliato: 0.2, stretto: 0.3 },
    empatica: { triste: 0.75, sorriso: 0.12 }, determinata: { accigliato: 0.55, stretto: 0.75, sorriso: 0.1 }, fiera: { sorriso: 0.4, guance: 0.2 }, attenta: { sopra: 0.45, sorriso: 0.12 } };
  var OCCHI_V = { neutro: [1, 0, 0x1a3050], serena: [1, 0, 0x1a3050], gioia: [0.66, 0, 0x2f6fd0], sorrisoCaldo: [0.8, 0, 0x2a5ab8], divertita: [0.72, 0.14, 0x2f64c4], sorpresa: [1.38, 0, 0x3f86f0], stupore: [1.52, 0, 0x4a92ff], curiosa: [1.12, -0.16, 0x2a5cc0], dubbio: [0.8, 0.24, 0x22407a], scettica: [0.6, 0.12, 0x1c3566], riflessione: [0.86, 0, 0x233f88], concentrata: [0.7, 0, 0x2f6be8], preoccupata: [1.12, 0, 0x1a2c58], empatica: [0.84, 0, 0x3a4ca8], determinata: [0.74, 0, 0x2c62e0], fiera: [0.88, 0, 0x2a58c0], attenta: [1.1, 0, 0x2654b0] };

  Corpo.prototype.visoProcedurale = function () {
    var T = this.T, self = this, testa = this.ossa.testa; if (!testa) return null;
    this.radice.updateMatrixWorld(true);
    /* le mesh del viso e degli occhi: discendenti della testa */
    var occhi = [], viso = null, nv = 0;
    testa.traverse(function (o) { if (!o.isMesh) return; var n = (o.name + ' ' + (o.parent && o.parent.name) + ' ' + (o.material && o.material.name)).toLowerCase(); if (/eye|occh/.test(n)) occhi.push(o); else if (o.geometry.attributes.position.count > nv) { nv = o.geometry.attributes.position.count; viso = o; } });
    if (!viso || occhi.length < 2) return null;
    /* i centri degli occhi (mondo), per lato */
    var cO = {}; occhi.forEach(function (o) { var c = new T.Box3().setFromObject(o).getCenter(new T.Vector3()); var k = c.x.toFixed(3); (cO[k] = cO[k] || []).push(o); });
    var ch = Object.keys(cO).map(Number).sort(function (a, b) { return a - b; }); if (ch.length < 2) return null;
    var occhiS = cO[ch[ch.length - 1].toFixed(3)], occhiD = cO[ch[0].toFixed(3)];
    var EL = new T.Box3().setFromObject(occhiS[0]).getCenter(new T.Vector3()), ER = new T.Box3().setFromObject(occhiD[0]).getCenter(new T.Vector3());
    var F = avanti(this.radice, T), R = destra(this.radice, T), U = new T.Vector3(0, 1, 0), Mo = EL.clone().add(ER).multiplyScalar(0.5), d = EL.distanceTo(ER);
    /* i vertici del viso nel sistema (laterale u, verticale v, avanti w) centrato fra gli occhi */
    var pos = viso.geometry.attributes.position, L = lettore(pos), n = pos.count, M = viso.matrixWorld, inv = new T.Matrix4().copy(M).invert(), p = new T.Vector3();
    var uu = new Float32Array(n), vv = new Float32Array(n), ww = new Float32Array(n), WX = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { p.set(L.x(i), L.y(i), L.z(i)).applyMatrix4(M); WX[3 * i] = p.x; WX[3 * i + 1] = p.y; WX[3 * i + 2] = p.z; var q = p.clone().sub(Mo); uu[i] = q.dot(R); vv[i] = q.dot(U); ww[i] = q.dot(F); }
    /* la punta del naso */
    var nasoV = -0.6 * d, nasoW = -1e9;
    for (i = 0; i < n; i++) if (Math.abs(uu[i]) < 0.15 * d && vv[i] < -0.2 * d && vv[i] > -1.3 * d && ww[i] > nasoW) { nasoW = ww[i]; nasoV = vv[i]; }
    /* la linea della bocca: l'incavo fra le due labbra lungo la linea mediana */
    var B = 40, prof = [], vlo = nasoV - 1.0 * d, vhi = nasoV - 0.15 * d;
    for (var b = 0; b < B; b++) prof.push(-1e9);
    for (i = 0; i < n; i++) if (Math.abs(uu[i]) < 0.07 * d && vv[i] > vlo && vv[i] < vhi) { var bi = Math.floor((vv[i] - vlo) / (vhi - vlo) * B); if (ww[i] > prof[bi]) prof[bi] = ww[i]; }
    var boccaV = nasoV - 0.48 * d, migl = 1e9;
    for (b = 2; b < B - 2; b++) { if (prof[b] < -1e8) continue; var sopra = Math.max(prof[b + 1], prof[b + 2]), sotto = Math.max(prof[b - 1], prof[b - 2]); if (prof[b] < sopra && prof[b] < sotto && prof[b] < migl) { migl = prof[b]; boccaV = vlo + (b + 0.5) / B * (vhi - vlo); } }
    var boccaW = migl < 1e8 ? migl : nasoW - 0.3 * d;
    /* i campi, nel mondo (metri), scalati con d (i numeri di «Noir» valgono per d = 0,072 m) */
    var s = d / 0.072, perno = { v: boccaV + 0.28 * d, w: boccaW - 1.05 * d }, ang = 0.24, larga = 0.47 * d, lat = 0.86 * d;
    var buf = {}; CAMPI_V.forEach(function (k) { buf[k] = new Float32Array(n * 3); });
    var bocca = new Float32Array(n * 3), banda = new Float32Array(n), mossi = [], tmp = new T.Vector3(), loc0 = new T.Vector3();
    var ca = Math.cos(ang), sa = Math.sin(ang);
    for (i = 0; i < n; i++) {
      var u = uu[i], v = vv[i], w = ww[i], ax = Math.abs(u), sg = u < 0 ? -1 : 1, by = v - boccaV, davanti = sm(boccaW - 0.55 * d, boccaW - 0.2 * d, w);
      if (w < boccaW - 0.9 * d) davanti = 0;
      var c = {}, any = false;
      var angB = gs(ax - 0.6 * d, by, 0.19 * d) * davanti, gu = gs(ax - 0.69 * d, v + 0.74 * d, 0.25 * d) * davanti;
      c.sorriso = [sg * 0.0035 * s * angB, 0.0055 * s * angB + 0.0022 * s * gu, -0.0018 * s * angB + 0.0008 * s * gu];
      var lab = (1 - sm(0.17 * d, 0.28 * d, Math.abs(by))) * (1 - sm(0.55 * d, 0.76 * d, ax)) * davanti;
      c.rotondo = [-u * 0.32 * lab, 0, 0.0045 * s * lab * Math.max(0, 1 - ax / (0.76 * d))];
      c.largo = [sg * 0.0032 * s * angB, 0.0008 * s * angB, -0.001 * s * angB];
      var arc = sm(0.07 * d, 0.21 * d, v) * (1 - sm(0.54 * d, 0.95 * d, v)) * (1 - sm(0.92 * d, 1.11 * d, ax)) * davanti;
      c.sopra = [0, 0.0075 * s * arc, 0.001 * s * arc];
      var interna = arc * (1 - sm(0.17 * d, 0.56 * d, ax)), esterna = arc * sm(0.42 * d, 0.83 * d, ax);
      c.accigliato = [-sg * 0.003 * s * interna, -0.0055 * s * interna, 0.0016 * s * interna];
      c.triste = [-sg * 0.0008 * s * angB, -0.0045 * s * angB + 0.0042 * s * interna - 0.0022 * s * esterna, 0.0006 * s * interna];
      var latoS = u > 0 ? 1 : 0.12; c.sopraUno = [0, 0.0085 * s * arc * latoS, 0.0012 * s * arc * latoS];
      c.mezzo = u > 0 ? [0.004 * s * angB, 0.0058 * s * angB + 0.002 * s * gu, -0.002 * s * angB] : [0, 0, 0];
      var dl = (1 - sm(0.08 * d, 0.22 * d, Math.abs(by))) * (1 - sm(0.49 * d, 0.7 * d, ax)) * davanti;
      c.stretto = [-u * 0.1 * dl, -(by > 0 ? 1 : -1) * 0.0018 * s * dl, -0.0014 * s * dl];
      var ali = gs(ax - 0.24 * d, v - (nasoV + 0.1 * d), 0.15 * d) * davanti, lsu = by > 0 ? gs(ax - 0.17 * d, by - 0.11 * d, 0.14 * d) * davanti : 0;
      c.naso = [sg * 0.0008 * s * ali, 0.0032 * s * ali + 0.0022 * s * lsu, 0.0006 * s * ali];
      var pg = gs(ax - 0.5 * d, v + 0.24 * d, 0.15 * d) * davanti; c.guance = [0, 0.0042 * s * gu + 0.0026 * s * pg, 0.0012 * s * gu];
      /* la mandibola: sotto la linea della bocca, al centro, ruota attorno al perno */
      var latM = 1 - sm(larga, lat, ax), giu = 1 - sm(boccaV - 0.07 * d, boccaV, v), su = v > boccaV ? (1 - sm(boccaV, boccaV + 0.19 * d, v)) * sm(boccaV - 0.01 * d, boccaV + 0.04 * d, v) : 0;
      var dm = [0, 0, 0];
      if (latM > 0 && w > boccaW - 0.55 * d) {
        if (giu * latM > 0) { var dy = v - perno.v, dz = w - perno.w, ny = perno.v + dy * ca - dz * sa, nz = perno.w + dy * sa + dz * ca; dm = [0, (ny - v) * giu * latM, (nz - w) * giu * latM]; }
        else if (su > 0) dm = [0, 0.006 * s * su * latM, 0.0012 * s * su * latM];
        banda[i] = latM * sm(boccaV - 0.03 * d, boccaV - 0.005 * d, v) * (1 - sm(boccaV + 0.005 * d, boccaV + 0.05 * d, v));
      }
      /* dal sistema (u, v, w) al mondo, poi al locale della mesh (posizioni denormalizzate) */
      loc0.set(WX[3 * i], WX[3 * i + 1], WX[3 * i + 2]).applyMatrix4(inv);
      var conv = function (dd, out) { if (!dd[0] && !dd[1] && !dd[2]) return false; tmp.set(WX[3 * i], WX[3 * i + 1], WX[3 * i + 2]).addScaledVector(R, dd[0]).addScaledVector(U, dd[1]).addScaledVector(F, dd[2]).applyMatrix4(inv); out[3 * i] = tmp.x - loc0.x; out[3 * i + 1] = tmp.y - loc0.y; out[3 * i + 2] = tmp.z - loc0.z; return true; };
      CAMPI_V.forEach(function (k) { if (conv(c[k], buf[k])) any = true; });
      if (conv(dm, bocca)) any = true;
      if (any) mossi.push(i);
    }
    var g = viso.geometry, unito = new T.BufferAttribute(new Float32Array(n * 3), 3); if (unito.setUsage) unito.setUsage(T.DynamicDrawUsage);
    g.setAttribute('aEspr', unito); g.setAttribute('aBocca', new T.BufferAttribute(bocca, 3)); g.setAttribute('aBanda', new T.BufferAttribute(banda, 1));
    var uB = { value: 0 }, mat = viso.material;
    (Array.isArray(mat) ? mat : [mat]).forEach(function (m) {
      m.onBeforeCompile = function (sh) {
        sh.uniforms.uBocca = uB;
        sh.vertexShader = 'attribute vec3 aEspr;\nattribute vec3 aBocca;\nattribute float aBanda;\nuniform float uBocca;\nvarying float vBanda;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += aEspr + aBocca * uBocca;\n  vBanda = aBanda;');
        sh.fragmentShader = 'uniform float uBocca;\nvarying float vBanda;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= 1.0 - 0.94 * clamp(vBanda * uBocca * 1.6, 0.0, 1.0);');
      };
      m.customProgramCacheKey = function () { return 'bsi-viso-procedurale'; }; m.needsUpdate = true;
    });
    /* gli occhi: posizioni a riposo nel mondo e centro, per schiacciarli (palpebre) e spostarli (sguardo) */
    var datiOcchi = occhi.map(function (o) {
      var a = o.geometry.attributes.position, Lo = lettore(a), N = a.count, Mw = o.matrixWorld, iw = new T.Matrix4().copy(Mw).invert(), Wp = new Float32Array(N * 3), cen = new T.Box3().setFromObject(o).getCenter(new T.Vector3()), hh = 0;
      for (var j = 0; j < N; j++) { p.set(Lo.x(j), Lo.y(j), Lo.z(j)).applyMatrix4(Mw); Wp[3 * j] = p.x; Wp[3 * j + 1] = p.y; Wp[3 * j + 2] = p.z; hh = Math.max(hh, Math.abs(p.y - cen.y)); }
      if (a.setUsage) a.setUsage(T.DynamicDrawUsage);
      return { o: o, W: Wp, inv: iw, c: cen, h: hh || 0.005, k: Lo.k, sinistro: cen.dot(R) - Mo.dot(R) < 0,   /* a sinistra del personaggio = dalla parte opposta alla sua destra */ ultimo: '' };
    });
    /* il materiale luminoso degli occhi: la tinta del tema */
    var glow = []; occhi.forEach(function (o) { var m = o.material; if (m && m.emissive) { m.emissive.setHex(0x1a3050); glow.push(m); } });
    this.vp = { viso: viso, buf: buf, mossi: new Uint32Array(mossi), uB: uB, pesi: {}, occhi: datiOcchi, glow: glow, R: R, U: U, F: F, d: d, landmarks: { naso: nasoV / d, bocca: boccaV / d, boccaW: boccaW / d, toccati: mossi.length } };
    this.vpVal = {}; this.vpMolle = {}; var vv0 = this.vpVal; CAMPI_V.concat(['bocca', 'ap0', 'ap1']).forEach(function (k) { vv0[k] = k.indexOf('ap') === 0 ? 1 : 0; self.vpMolle[k] = { x: vv0[k], v: 0 }; });
    this.tinta = new T.Color(0x1a3050);
    return this.vp.landmarks;
  };
  Corpo.prototype.passoViso = function (dt) {
    var V = this.vp; if (!V) return;
    var T = this.T, self = this, t = this.t, lento = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var emo = t < this.emoFino ? this.emo : 'serena', P = EMO_V[emo] || {}, k = t < this.emoFino ? this.emoK : 1, O = OCCHI_V[emo] || OCCHI_V.serena;
    var K = { sopra: 140, sopraUno: 140, accigliato: 110, triste: 60, sorriso: 55, mezzo: 60, guance: 45, stretto: 80, naso: 70, rotondo: 90, largo: 90, bocca: 70, ap0: 260, ap1: 260 };
    CAMPI_V.forEach(function (c) {
      var b = (P[c] || 0) * k; if (c === 'rotondo') b = Math.max(b, self.bocca.rotondo * 0.9); if (c === 'largo') b = self.bocca.largo * 0.9;
      self.vpVal[c] = lento ? b : molla(self.vpMolle[c], b, K[c], dt);
    });
    var apr = Math.max(this.bocca.apertura, (P.bocca || 0) * k); this.vpVal.bocca = /* la mandibola segue subito */ apr;
    /* fusione dei campi nell'attributo unico (solo se i pesi sono cambiati) */
    var cambiato = false; CAMPI_V.forEach(function (c) { if (Math.abs(self.vpVal[c] - (V.pesi[c] || 0)) > 0.004) cambiato = true; });
    if (cambiato) {
      CAMPI_V.forEach(function (c) { V.pesi[c] = self.vpVal[c]; });
      var att = CAMPI_V.filter(function (c) { return Math.abs(V.pesi[c]) > 0.002; }), Bf = att.map(function (c) { return V.buf[c]; }), Wf = att.map(function (c) { return V.pesi[c] * (c === 'rotondo' || c === 'largo' ? 1 : 1.8); });
      var a = V.viso.geometry.attributes.aEspr, out = a.array, idx = V.mossi;
      for (var j = 0; j < idx.length; j++) { var i3 = idx[j] * 3, x = 0, y = 0, z = 0; for (var h = 0; h < att.length; h++) { var bb = Bf[h], ww = Wf[h]; x += bb[i3] * ww; y += bb[i3 + 1] * ww; z += bb[i3 + 2] * ww; } out[i3] = x; out[i3 + 1] = y; out[i3 + 2] = z; }
      a.needsUpdate = true;
    }
    V.uB.value = this.vpVal.bocca;
    /* gli occhi: apertura (emozione × battito), asimmetria, tinta */
    var chiuso = this.palp > 0 ? Math.sin(this.palp * Math.PI) : 0;
    var ap0 = molla(this.vpMolle.ap0, O[0] * (1 + O[1]), K.ap0, dt), ap1 = molla(this.vpMolle.ap1, O[0] * (1 - O[1]), K.ap1, dt);
    ap0 = Math.max(0.05, ap0 * (1 - 0.95 * chiuso)); ap1 = Math.max(0.05, ap1 * (1 - 0.95 * chiuso)); this.apVis = [ap0, ap1];
    V.occhi.forEach(function (E) {
      var A = E.sinistro ? ap0 : ap1, chiave = A.toFixed(3); if (chiave === E.ultimo) return; E.ultimo = chiave;
      var a = E.o.geometry.attributes.position, arr = a.array, e = E.inv.elements, U2 = V.U, inv = 1 / E.k;
      for (var j = 0; j < arr.length / 3; j++) {
        var x = E.W[3 * j], y = E.W[3 * j + 1], z = E.W[3 * j + 2], cy = E.c.y - (A < 1 ? (1 - A) * E.h * 0.35 : 0);
        y = cy + (y - E.c.y) * A;
        var lx = e[0] * x + e[4] * y + e[8] * z + e[12], ly = e[1] * x + e[5] * y + e[9] * z + e[13], lz = e[2] * x + e[6] * y + e[10] * z + e[14];
        arr[3 * j] = Math.round(lx * inv); arr[3 * j + 1] = Math.round(ly * inv); arr[3 * j + 2] = Math.round(lz * inv);
      }
      a.needsUpdate = true;
    });
    this.tinta.lerp(new T.Color(O[2]), Math.min(1, dt * 3));
    var parla = this.bocca.apertura > 0.05 ? 0.4 * this.bocca.apertura : 0;
    V.glow.forEach(function (m) { m.emissive.copy(self.tinta); m.emissiveIntensity = (1.6 + parla) * (1 - 0.6 * chiuso); });
    this.coloreOcchi = '#' + this.tinta.getHexString();
  };

  /* ═══ IL MANICHINO: un umanoide riggato costruito nel codice ═════════════════
     Serve a provare il driver prima che arrivi il modello vero: ossa con i nomi
     di Mixamo, posa a T (come i file scaricati), una testa con 24 blendshape
     ARKit e una calotta di capelli ROSSA (deve diventare nera), occhi separati.
     Lo stile e' quello di un androide cyberpunk: metallo scuro e linee al neon. */
  function manichino(T, opz) {
    opz = opz || {};
    var radice = new T.Group(); radice.name = 'SpectraManichino';
    var mat = new T.MeshStandardMaterial({ color: 0x2a2f37, metalness: 0.8, roughness: 0.35 });
    var neon = new T.MeshBasicMaterial({ color: opz.neon || 0x2f6bff, toneMapped: false });
    function osso(nome, padre, x, y, z) { var b = new T.Bone(); b.name = 'mixamorig:' + nome; b.position.set(x, y, z); if (padre) padre.add(b); return b; }
    function pezzo(b, geo, m, x, y, z, rx) { var me = new T.Mesh(geo, m || mat); me.position.set(x || 0, y || 0, z || 0); if (rx) me.rotation.x = rx; b.add(me); return me; }
    function capsula(r, l) { var g = new T.CylinderGeometry(r, r * 0.88, l, 14); g.translate(0, -l / 2, 0); return g; }
    var anche = osso('Hips', null, 0, 0.98, 0); radice.add(anche);
    var col = osso('Spine', anche, 0, 0.1, 0), pet = osso('Spine1', col, 0, 0.13, 0), tor = osso('Spine2', pet, 0, 0.14, 0), collo = osso('Neck', tor, 0, 0.15, 0), testa = osso('Head', collo, 0, 0.09, 0);
    var fine = osso('HeadTop_End', testa, 0, 0.24, 0);
    pezzo(anche, new T.BoxGeometry(0.32, 0.16, 0.2), mat, 0, 0.02, 0); pezzo(col, new T.BoxGeometry(0.3, 0.14, 0.19), mat, 0, 0.07, 0); pezzo(pet, new T.BoxGeometry(0.34, 0.16, 0.21), mat, 0, 0.08, 0);
    pezzo(tor, new T.BoxGeometry(0.42, 0.2, 0.24), mat, 0, 0.06, 0); pezzo(tor, new T.BoxGeometry(0.3, 0.012, 0.012), neon, 0, 0.1, 0.125);
    pezzo(collo, new T.CylinderGeometry(0.055, 0.065, 0.12, 12), mat, 0, 0.05, 0);
    /* la testa con i blendshape ARKit (spostamenti dei vertici di una sfera allungata) */
    var gT = new T.SphereGeometry(0.105, 48, 36); gT.scale(0.92, 1.18, 1); gT.translate(0, 0.11, 0.01);
    var NOMI = ['jawOpen', 'mouthSmileLeft', 'mouthSmileRight', 'eyeBlinkLeft', 'eyeBlinkRight', 'browInnerUp', 'browDownLeft', 'browDownRight', 'browOuterUpLeft', 'browOuterUpRight', 'mouthFrownLeft', 'mouthFrownRight', 'eyeWideLeft', 'eyeWideRight', 'mouthFunnel', 'mouthPucker', 'mouthPressLeft', 'mouthPressRight', 'cheekSquintLeft', 'cheekSquintRight', 'noseSneerLeft', 'noseSneerRight', 'eyeSquintLeft', 'eyeSquintRight', 'mouthStretchLeft', 'mouthStretchRight'];
    var pos = gT.attributes.position, morph = [];
    NOMI.forEach(function (n) {
      var arr = new Float32Array(pos.count * 3), sx = /Left/.test(n) ? 1 : /Right/.test(n) ? -1 : 0;
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), dx = 0, dy = 0, dz = 0, fr = z > 0.05 ? 1 : 0, lato = sx ? (x * sx > 0 ? 1 : 0) : 1;
        var bocca = Math.exp(-((y - 0.045) * (y - 0.045)) / 0.0006) * Math.exp(-(x * x) / 0.0018) * fr;
        var occhio = Math.exp(-((y - 0.13) * (y - 0.13)) / 0.0004) * Math.exp(-((Math.abs(x) - 0.04) * (Math.abs(x) - 0.04)) / 0.0005) * fr;
        var ciglio = Math.exp(-((y - 0.165) * (y - 0.165)) / 0.0003) * Math.exp(-((Math.abs(x) - 0.04) * (Math.abs(x) - 0.04)) / 0.0012) * fr;
        if (n === 'jawOpen' && y < 0.045 && fr) dy = -0.03 * Math.exp(-(x * x) / 0.004) * Math.min(1, (0.045 - y) / 0.03);
        if (/mouthSmile/.test(n)) { dy = 0.012 * bocca * lato * (Math.abs(x) / 0.03); dx = 0.006 * bocca * lato * Math.sign(x); }
        if (/mouthFrown/.test(n)) dy = -0.01 * bocca * lato * (Math.abs(x) / 0.03);
        if (/mouthStretch/.test(n)) dx = 0.008 * bocca * lato * Math.sign(x);
        if (/mouthPress/.test(n)) dy = -(y - 0.045) * 0.5 * bocca * lato;
        if (n === 'mouthFunnel' || n === 'mouthPucker') { dz = 0.012 * bocca; dx = -x * 0.35 * bocca; }
        if (/eyeBlink/.test(n)) dy = -(y - 0.125) * 0.9 * occhio * lato;
        if (/eyeSquint/.test(n)) dy = -(y - 0.125) * 0.4 * occhio * lato;
        if (/eyeWide/.test(n)) dy = (y - 0.13) * 0.5 * occhio * lato;
        if (n === 'browInnerUp') dy = 0.012 * ciglio * Math.exp(-(x * x) / 0.0008) * 2;
        if (/browOuterUp/.test(n)) dy = 0.012 * ciglio * lato * (Math.abs(x) > 0.03 ? 1 : 0.3);
        if (/browDown/.test(n)) dy = -0.01 * ciglio * lato;
        if (/cheekSquint/.test(n)) dy = 0.008 * Math.exp(-((y - 0.085) * (y - 0.085)) / 0.0006) * Math.exp(-((Math.abs(x) - 0.05) * (Math.abs(x) - 0.05)) / 0.0008) * fr * lato;
        if (/noseSneer/.test(n)) dy = 0.006 * Math.exp(-((y - 0.08) * (y - 0.08)) / 0.0003) * Math.exp(-((Math.abs(x) - 0.015) * (Math.abs(x) - 0.015)) / 0.0003) * fr * lato;
        arr[3 * i] = dx; arr[3 * i + 1] = dy; arr[3 * i + 2] = dz;
      }
      var a = new T.Float32BufferAttribute(arr, 3); a.name = n; morph.push(a);
    });
    gT.morphAttributes.position = morph; gT.morphTargetsRelative = true;
    var mt = new T.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.75, roughness: 0.38, morphTargets: true });
    var viso = new T.Mesh(gT, mt); viso.name = 'Spectra_Head'; testa.add(viso); viso.updateMorphTargets();
    /* occhi (ossa separate) e capelli: calotta ROSSA che il driver deve rendere nera */
    var oS = osso('LeftEye', testa, 0.04, 0.135, 0.095), oD = osso('RightEye', testa, -0.04, 0.135, 0.095);
    [oS, oD].forEach(function (o) { pezzo(o, new T.SphereGeometry(0.014, 16, 12), new T.MeshBasicMaterial({ color: 0x1a3050, toneMapped: false })); });
    var gC = new T.SphereGeometry(0.118, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.55); gC.scale(0.95, 1.12, 1.05); gC.translate(0, 0.13, -0.012);
    var cap = new T.Mesh(gC, new T.MeshStandardMaterial({ color: 0xc0281e, roughness: 0.6, name: 'Hair_mat' })); cap.name = 'Hair'; testa.add(cap);
    /* braccia (posa a T) e gambe */
    ['Left', 'Right'].forEach(function (lato) {
      var s = lato === 'Left' ? 1 : -1;
      var clav = osso(lato + 'Shoulder', tor, 0.06 * s, 0.12, 0), br = osso(lato + 'Arm', clav, 0.12 * s, 0, 0), av = osso(lato + 'ForeArm', br, 0.28 * s, 0, 0), ma = osso(lato + 'Hand', av, 0.25 * s, 0, 0); osso(lato + 'HandIndex1', ma, 0.08 * s, 0, 0);
      [[br, 0.28, 0.048], [av, 0.25, 0.04]].forEach(function (x) { var g = capsula(x[2], x[1]); g.rotateZ(s * Math.PI / 2); pezzo(x[0], g); });
      var gl = new T.BoxGeometry(0.09, 0.03, 0.06); gl.translate(0.045 * s, 0, 0); pezzo(ma, gl);
      var co = osso(lato + 'UpLeg', anche, 0.1 * s, -0.04, 0), ga = osso(lato + 'Leg', co, 0, -0.44, 0), pi = osso(lato + 'Foot', ga, 0, -0.42, 0); osso(lato + 'ToeBase', pi, 0, -0.05, 0.12);
      pezzo(co, capsula(0.07, 0.44)); pezzo(ga, capsula(0.055, 0.42)); pezzo(ga, new T.BoxGeometry(0.012, 0.3, 0.012), neon, 0.0, -0.2, 0.058);
      var gp = new T.BoxGeometry(0.1, 0.06, 0.24); gp.translate(0, -0.03, 0.06); pezzo(pi, gp);
    });
    radice.updateMatrixWorld(true);
    return radice;
  }

  globale.BSISpectraCorpo = {
    crea: function (radice, opz) { return new Corpo(radice, opz); },
    manichino: function (opz) { return manichino(globale.THREE, opz); },
    EMOZIONI: EMO, OSSA: OSSA, normaNome: normaNome, versione: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
