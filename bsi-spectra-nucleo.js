/* ═══════════════════════════════════════════════════════════════════════
   bsi-spectra-nucleo.js — Spectra come NUCLEO OLOGRAFICO (v259)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Richiesta dell'autore: al posto della figura umanoide incappucciata, un
   nucleo olografico sferico, sobrio e realistico, nei colori dell'app; niente
   download del corpo, niente gesti «cartoon», niente luci che saturano.
   Strati, tutti procedurali (nessun .glb):
   1. guscio a celle esagonali: il DUALE di un'icosfera (ogni vertice → la sua
      cella, dai baricentri delle facce vicine), wireframe sottile che ruota;
   2. sfera interna di tessere triangolari (icosfera) con i contorni; quando
      Spectra pensa, alcune tessere si riempiono e si spengono (max 6, 400 ms);
   3. nucleo: nebbia tenue e un gomitolo di filamenti Catmull-Rom che si
      gonfiano appena, e con l'energia della voce quando parla;
   4. anelli HUD inclinati: archi segmentati, tacche, cursori triangolari che
      scorrono, micro-etichette; un anello piatto davanti e un'orbita esterna;
   5. satelliti esagonali e rettangolari; in «cerca» escono su fili e rientrano.
   L'HUD (didascalia parola per parola, stato, schede di dati, avviso) è DOM
   sopra la tela: testo nitido e accessibile (aria-live sulla didascalia).

   STATI (transizioni di 0,6–0,9 s, easeInOutSine, mai salti né rimbalzi):
   online · ascolto · pensa · parla · cerca · lavoro · avviso.
   «Riduci movimento»: anelli fermi, solo l'opacità cambia.

   API: la stessa del controllore del corpo (BSISpectraFigura.Spectra):
     new BSISpectraNucleo.Nucleo(T, scena, renderer, opz)
     .carica() → Promise(true) · .presente() · .passo(dt) · .stato(nome)
     .dici(testo) · .taci() · .fai(azione, bersaglio, durata) · .emozione(e)
     .scheda({ titolo, valore, righe, barre, durata }) · .avviso(testo) · .dispose()
   .corpo rispecchia { gesto, emo, testo } per chi leggeva il corpo.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var D = g.document;
  function t(it, en) { return (g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() !== 'it') ? en : it; }
  /* LA PALETTE, in un punto solo (anche come variabili CSS) */
  var PAL = { fondo1: '#050a16', fondo2: '#0a1b2e', teal: 0x00c9b7, azzurro: 0x6bcfff, blu: 0x2f6bff, chiaro: 0xd7f7f3, ambra: 0xffb547, hud: '#9fd0ff', valore: '#5eead4', tealCss: '#00c9b7', ambraCss: '#ffb547' };
  var NOMI = {
    online: ['IN LINEA', 'ONLINE'], ascolto: ['IN ASCOLTO', 'LISTENING'], pensa: ['STO PENSANDO', 'THINKING'], parla: ['PARLO', 'SPEAKING'],
    cerca: ['CERCO', 'SEARCHING'], lavoro: ['AL LAVORO', 'WORKING'], avviso: ['ATTENZIONE', 'WARNING']
  };
  var ALIAS = { idle: 'online', listening: 'ascolto', thinking: 'pensa', speaking: 'parla', searching: 'cerca', working: 'lavoro', warning: 'avviso', attesa: 'online', ascolta: 'ascolto', strumenti: 'lavoro', scrive: 'pensa' };
  /* i parametri di ogni stato: l'animazione li insegue con una costante di tempo, non salta */
  var OBIETTIVI = {
    online: { vel: 1, mic: 0, tessere: 0, voce: 0, fuori: 0, ambra: 0, luce: 0.55 },
    ascolto: { vel: 0.45, mic: 1, tessere: 0, voce: 0, fuori: 0, ambra: 0, luce: 0.6 },
    pensa: { vel: 0.8, mic: 0, tessere: 1, voce: 0, fuori: 0, ambra: 0, luce: 0.62 },
    parla: { vel: 1, mic: 0, tessere: 0.2, voce: 1, fuori: 0, ambra: 0, luce: 0.66 },
    cerca: { vel: 2.6, mic: 0, tessere: 0.3, voce: 0, fuori: 1, ambra: 0, luce: 0.62 },
    lavoro: { vel: 1.6, mic: 0, tessere: 0.6, voce: 0, fuori: 0.4, ambra: 0, luce: 0.62 },
    avviso: { vel: 1, mic: 0, tessere: 0, voce: 0, fuori: 0, ambra: 1, luce: 0.6 }
  };
  function sin01(x) { return 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x))); }   /* easeInOutSine */
  var calmo = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── le geometrie ── */
  function chiave(v) { return Math.round(v.x * 1e4) + ',' + Math.round(v.y * 1e4) + ',' + Math.round(v.z * 1e4); }
  /** il guscio a celle esagonali: duale dell'icosfera (12 pentagoni, il resto esagoni) */
  function guscioEsagonale(T, r, dettaglio) {
    var geo = new T.IcosahedronGeometry(1, dettaglio), p = geo.attributes.position, idx = {}, vert = [], facce = [];
    for (var i = 0; i < p.count; i += 3) {
      var f = [];
      for (var k = 0; k < 3; k++) { var v = new T.Vector3(p.getX(i + k), p.getY(i + k), p.getZ(i + k)), c = chiave(v); if (idx[c] == null) { idx[c] = vert.length; vert.push(v); } f.push(idx[c]); }
      facce.push(f);
    }
    var vicini = vert.map(function () { return []; }), cen = facce.map(function (f) { return vert[f[0]].clone().add(vert[f[1]]).add(vert[f[2]]).normalize().multiplyScalar(r); });
    facce.forEach(function (f, j) { f.forEach(function (vi) { vicini[vi].push(j); }); });
    var seg = [], visto = {};
    vert.forEach(function (v, vi) {
      var n = v.clone().normalize(), a = new T.Vector3(1, 0, 0); if (Math.abs(n.x) > 0.9) a.set(0, 1, 0); var u = a.clone().cross(n).normalize(), w = n.clone().cross(u);
      var cs = vicini[vi].slice().sort(function (x, y) { var px = cen[x], py = cen[y]; return Math.atan2(px.dot(w), px.dot(u)) - Math.atan2(py.dot(w), py.dot(u)); });
      for (var q = 0; q < cs.length; q++) { var A = cs[q], B = cs[(q + 1) % cs.length], k2 = A < B ? A + '-' + B : B + '-' + A; if (visto[k2]) continue; visto[k2] = 1; seg.push(cen[A].x, cen[A].y, cen[A].z, cen[B].x, cen[B].y, cen[B].z); }
    });
    geo.dispose();
    var out = new T.BufferGeometry(); out.setAttribute('position', new T.Float32BufferAttribute(seg, 3)); out.userData.celle = vert.length; return out;
  }
  function lineMat(T, col, op) { return new T.LineBasicMaterial({ color: col, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }); }
  function baseMat(T, col, op) { return new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }); }
  function etichettaTex(T, testo) { var c = D.createElement('canvas'); c.width = 256; c.height = 40; var q = c.getContext('2d'); q.font = '600 22px ui-monospace,Menlo,monospace'; q.fillStyle = '#9fd0ff'; q.fillText(testo, 4, 28); var tx = new T.CanvasTexture(c); tx.minFilter = T.LinearFilter; return tx; }
  function nebbiaTex(T) { var c = D.createElement('canvas'); c.width = c.height = 128; var q = c.getContext('2d'), gr = q.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(107,207,255,0.55)'); gr.addColorStop(0.4, 'rgba(47,107,255,0.22)'); gr.addColorStop(1, 'rgba(47,107,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); }

  /* ═══ IL NUCLEO ═══════════════════════════════════════════════════════ */
  function Nucleo(T, sc, ren, opz) {
    opz = opz || {}; var self = this;
    this.T = T; this.sc = sc; this.ren = ren; this.opz = opz; this.t = 0; this.nome = 'online'; this.par = {}; this.cambioT = 1;
    var o0 = OBIETTIVI.online; for (var k in o0) this.par[k] = o0[k];
    this.da = {}; for (k in o0) this.da[k] = o0[k];
    /* compatibilità con chi usava il corpo (sezioni, studio): stessi campi e stessi metodi, tradotti per il nucleo */
    this.corpo = { gesto: null, emo: null, testo: false, ossa: {},
      emozione: function (e) { self.emozione(e); }, fai: function (g2, b, d) { self.fai(g2, b, d); }, dici: function (x) { self.dici(x); }, taci: function () { self.taci(); },
      audio: function (b) { self.energiaVoce = b && (b.energia != null ? b.energia : b.livello != null ? b.livello : 0.6); }, guarda: function () { }, passo: function () { },
      cammina: function (p) { self.meta = p && p.clone ? p.clone() : null; } };
    this.rig = null; this.volto = null; this.caricato = true;
    var R0 = this.radice = new T.Group(); R0.name = 'SpectraNucleo'; if (opz.posizione) R0.position.copy(opz.posizione); sc.add(R0);
    var R = this.interno = new T.Group(); R.position.y = opz.quota || 0; R.scale.setScalar(opz.scala || 1); R0.add(R);   /* (v259) la quota: chi posa la radice a terra (lo studio) trova il nucleo all'altezza giusta */
    this.meta = null;
    /* 1. guscio esagonale */
    this.guscio = new T.LineSegments(guscioEsagonale(T, 1.08, 3), lineMat(T, PAL.teal, 0.16)); R.add(this.guscio);
    /* fresnel: dal teal al bordo al blu al centro */
    this.vetro = new T.Mesh(new T.SphereGeometry(1.06, 64, 48), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { a: { value: new T.Color(PAL.teal) }, b: { value: new T.Color(PAL.blu) }, k: { value: 0.32 }, ambra: { value: new T.Color(PAL.ambra) }, w: { value: 0 } },
      vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); v = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 a; uniform vec3 b; uniform vec3 ambra; uniform float k; uniform float w; varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0-abs(dot(n,v)),2.4); vec3 c = mix(b, mix(a, ambra, w), f); gl_FragColor = vec4(c*0.8, k*(0.12+0.88*f)); }' }));
    R.add(this.vetro);
    /* 2. tessere interne */
    var ico = new T.IcosahedronGeometry(0.8, 2); this.nTessere = ico.attributes.position.count / 3;
    R.add(this.reteTessere = new T.LineSegments(new T.EdgesGeometry(ico), lineMat(T, PAL.azzurro, 0.1)));
    var acc = new Float32Array(ico.attributes.position.count); ico.setAttribute('acceso', new T.BufferAttribute(acc, 1));
    this.tessere = new T.Mesh(ico, new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { c: { value: new T.Color(PAL.azzurro) } },
      vertexShader: 'attribute float acceso; varying float q; void main(){ q = acceso; gl_Position = projectionMatrix*modelViewMatrix*vec4(position*0.995,1.0); }',
      fragmentShader: 'uniform vec3 c; varying float q; void main(){ if (q < 0.01) discard; gl_FragColor = vec4(c*0.75, 0.42*q); }' }));
    R.add(this.tessere); this.accese = [];
    /* 3. IL CUORE COME UNA PARTICELLA (v259, richiesta dell'autore: «che simuli quasi la forma di una particella»)
       · nucleo: 24 nucleoni (12 protoni teal, 12 neutroni blu) impacchettati con una breve repulsione dentro una sfera, con
         un'ombreggiatura finta nello shader (niente luci dirette) e una vibrazione minima;
       · tubi di flusso tenui fra nucleoni vicini (l'interazione forte, suggerita);
       · la nuvola elettronica: 6000 punti campionati da |ψ|² degli orbitali dell'idrogeno 1s, 2s, 2p, 3d_z²; ogni punto ha
         una posizione per ogni orbitale e la nuvola si trasforma dall'uno all'altro con lo stato (easeInOutSine);
       · tre elettroni su orbite ellittiche inclinate, con la scia che sfuma. */
    var s = 17; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var neb = new T.Sprite(new T.SpriteMaterial({ map: nebbiaTex(T), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.2 })); neb.scale.setScalar(0.9); R.add(this.nebbia = neb);
    this.cuore = new T.Group(); R.add(this.cuore);
    var NN = 24, pn = [], rN = 0.064;
    for (var i = 0; i < NN; i++) { var u0 = rnd() * 2 - 1, a0 = rnd() * 6.283, s0 = Math.sqrt(1 - u0 * u0), r0 = 0.12 * Math.cbrt(rnd()); pn.push(new T.Vector3(r0 * s0 * Math.cos(a0), r0 * s0 * Math.sin(a0), r0 * u0)); }
    for (var it = 0; it < 220; it++) {   /* impacchettamento: repulsione fra sfere sovrapposte + richiamo verso il centro */
      for (var a = 0; a < NN; a++) { var f = pn[a].clone().multiplyScalar(-0.04); for (var b = 0; b < NN; b++) { if (a === b) continue; var d = pn[a].clone().sub(pn[b]), l = d.length() || 1e-6; if (l < 2 * rN * 0.94) f.add(d.multiplyScalar((2 * rN * 0.94 - l) / l * 0.5)); } pn[a].add(f); }
    }
    var shNuc = { vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); v = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 c; uniform float k; varying vec3 n; varying vec3 v; void main(){ vec3 L = normalize(vec3(-0.4,0.6,0.7)); float d = max(dot(n,L),0.0); float sp = pow(max(dot(reflect(-L,n),v),0.0),24.0); float f = pow(1.0-max(dot(n,v),0.0),2.0); vec3 col = c*(0.18+0.55*d) + vec3(0.84,0.97,0.95)*0.28*sp + c*0.35*f; gl_FragColor = vec4(min(col, vec3(0.8))*k, 1.0); }' };
    var geoN = new T.SphereGeometry(rN, 24, 18); this.nucleoni = [];
    pn.forEach(function (p0, k) { var m = new T.Mesh(geoN, new T.ShaderMaterial({ uniforms: { c: { value: new T.Color(k % 2 ? PAL.blu : PAL.teal) }, k: { value: 1 } }, vertexShader: shNuc.vertexShader, fragmentShader: shNuc.fragmentShader })); m.position.copy(p0); m.userData.p0 = p0.clone(); m.userData.f = rnd() * 6.28; self.cuore.add(m); self.nucleoni.push(m); });
    var fl = []; for (var a1 = 0; a1 < NN; a1++) for (var b1 = a1 + 1; b1 < NN; b1++) if (pn[a1].distanceTo(pn[b1]) < 2 * rN * 1.12) fl.push(pn[a1].x, pn[a1].y, pn[a1].z, pn[b1].x, pn[b1].y, pn[b1].z);
    var fg0 = new T.BufferGeometry(); fg0.setAttribute('position', new T.Float32BufferAttribute(fl, 3));
    /* (v261) l'interazione forte suggerita: ogni tubo porta un «colore» (rosso, verde, blu, attenuati) che si scambia lungo il tubo */
    var nF = fl.length / 3, ph0 = new Float32Array(nF), uu = new Float32Array(nF); for (var q5 = 0; q5 < nF; q5 += 2) { var pf = rnd() * 3; ph0[q5] = ph0[q5 + 1] = pf; uu[q5] = 0; uu[q5 + 1] = 1; }
    fg0.setAttribute('fase', new T.BufferAttribute(ph0, 1)); fg0.setAttribute('u', new T.BufferAttribute(uu, 1));
    this.flusso = new T.LineSegments(fg0, new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { t: { value: 0 }, op: { value: 0.12 } },
      vertexShader: 'attribute float fase; attribute float u; varying float vF; varying float vU; void main(){ vF = fase; vU = u; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform float t; uniform float op; varying float vF; varying float vU; void main(){ float k = mod(vF + t*0.35 + vU*1.5, 3.0); vec3 c = k < 1.0 ? mix(vec3(1.,0.35,0.35), vec3(0.35,1.,0.45), k) : k < 2.0 ? mix(vec3(0.35,1.,0.45), vec3(0.4,0.55,1.), k - 1.0) : mix(vec3(0.4,0.55,1.), vec3(1.,0.35,0.35), k - 2.0); c = mix(c, vec3(0.84,0.97,0.95), 0.45); gl_FragColor = vec4(c*0.8, op); }' }));
    this.cuore.add(this.flusso);
    /* la nuvola: quattro forme per ogni punto */
    var NP = 6000, ORB = ['1s', '2s', '2p', '3d'], forme = {}, gamma = function (k, th) { var x = 0; for (var q = 0; q < k; q++) x -= Math.log(rnd() + 1e-12); return x * th; };
    function campiona(nome) {
      var out = new Float32Array(NP * 3), n = 0, guardia = 0;
      while (n < NP && guardia++ < NP * 60) {
        var r, cz = rnd() * 2 - 1, ph = rnd() * 6.283, ok = true;
        if (nome === '1s') r = gamma(3, 0.5);                                                   /* r² e^(−2r) */
        else if (nome === '2s') { r = gamma(3, 1); ok = rnd() * 36 < Math.pow(2 - r, 2); }   /* (2 − r)² r² e^(−r): Gamma(3) e accettazione (2 − r)²/36, esatta per r < 8 */
        else if (nome === '2p') { r = gamma(5, 1); ok = rnd() < cz * cz; }                    /* r⁴ e^(−r) cos²θ */
        else { r = gamma(7, 1.5); ok = rnd() < Math.pow(3 * cz * cz - 1, 2) / 4; }             /* r⁶ e^(−2r/3) (3cos²θ − 1)² */
        if (!ok) continue;
        var sc0 = { '1s': 0.24, '2s': 0.085, '2p': 0.08, '3d': 0.055 }[nome], rr = Math.min(0.78, r * sc0), sn = Math.sqrt(1 - cz * cz);
        out[3 * n] = rr * sn * Math.cos(ph); out[3 * n + 1] = rr * sn * Math.sin(ph); out[3 * n + 2] = rr * cz; n++;
      }
      return out;
    }
    ORB.forEach(function (o) { forme[o] = campiona(o); }); this.forme = forme;
    var gN = new T.BufferGeometry(), posN = new Float32Array(NP * 3), colN = new Float32Array(NP * 3); posN.set(forme['1s']);
    for (var c3 = 0; c3 < NP; c3++) { var f1 = forme['1s'], rq = Math.hypot(f1[3 * c3], f1[3 * c3 + 1], f1[3 * c3 + 2]), lum = 0.35 + 0.65 * Math.exp(-rq / 0.28); colN[3 * c3] = 0.26 * lum; colN[3 * c3 + 1] = 0.7 * lum; colN[3 * c3 + 2] = 0.95 * lum; }   /* più luminosa vicino al nucleo */
    gN.setAttribute('position', new T.BufferAttribute(posN, 3)); gN.setAttribute('color', new T.BufferAttribute(colN, 3));
    /* (v261) la nuvola come particelle morbide: ogni punto ha una sua fase e «sfarfalla» (la densità di probabilità si
       legge come luce che va e viene), grandezza in prospettiva, bordo sfumato; luminanza sempre sotto 0,8 */
    var faseN = new Float32Array(NP); for (var c4 = 0; c4 < NP; c4++) faseN[c4] = rnd() * 6.283; gN.setAttribute('fase', new T.BufferAttribute(faseN, 1));
    var pr0 = ren && ren.getPixelRatio ? ren.getPixelRatio() : 1;
    this.nuvola = new T.Points(gN, new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { t: { value: 0 }, op: { value: 0.42 }, mis: { value: 7.5 * pr0 }, voce: { value: 0 }, calmo: { value: calmo ? 1 : 0 } },
      vertexShader: 'attribute vec3 color; attribute float fase; uniform float t; uniform float mis; uniform float voce; uniform float calmo; varying vec3 vC; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); float sf = calmo > 0.5 ? 1.0 : 0.55 + 0.45*sin(t*(1.3 + fract(fase*7.0)*2.2) + fase); vC = color; vA = sf; gl_PointSize = mis*(0.8 + 0.5*sf + 0.6*voce)/max(0.3, -mv.z); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform float op; varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d)*4.0; if (r > 1.0) discard; float a = exp(-r*3.2); gl_FragColor = vec4(min(vC*1.15, vec3(0.8)), a*op*(0.45 + 0.55*vA)); }' }));
    R.add(this.nuvola);
    this.orbitale = { da: '1s', a: '1s', s: 1 };
    /* gli elettroni con la scia */
    this.elettroni = [];
    [[0.92, 0.55, 0.3, 1.0], [0.98, 0.42, -0.9, 1.3], [0.88, 0.62, 1.7, 0.85]].forEach(function (e0, k) {
      var gr = new T.Group(); gr.rotation.set(e0[2], e0[2] * 0.6, k * 0.8); R.add(gr);
      var el = new T.Mesh(new T.SphereGeometry(0.022, 12, 10), baseMat(T, PAL.chiaro, 0.6)); gr.add(el);
      var NS = 40, gs = new T.BufferGeometry(), ps = new Float32Array(NS * 3), cs = new Float32Array(NS * 3); gs.setAttribute('position', new T.BufferAttribute(ps, 3)); gs.setAttribute('color', new T.BufferAttribute(cs, 3));
      for (var q2 = 0; q2 < NS; q2++) { var w1 = 1 - q2 / NS; cs[3 * q2] = 0.42 * w1; cs[3 * q2 + 1] = 0.81 * w1; cs[3 * q2 + 2] = 1 * w1; }
      var scia = new T.Line(gs, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); gr.add(scia);
      self.elettroni.push({ el: el, scia: scia, a: e0[0], ecc: e0[1] * 0.35, v: e0[3], fase: k * 2.1, NS: NS });
    });
    this.filamenti = this.cuore;   /* compatibilità */
    /* 4. anelli HUD */
    this.anelli = [];
    var spec = [[1.3, 0.35, 0.2, 1], [1.42, -0.55, 0.9, -1], [1.55, 1.1, -0.4, 1], [1.24, -1.25, 0.15, -1]];
    spec.forEach(function (d, ia) {
      var gr = new T.Group(); gr.rotation.set(d[1], d[2], 0); R.add(gr);
      var th = 0; for (var q = 0; q < 9; q++) { var lung = 0.15 + rnd() * 0.55, spess = 0.012 + rnd() * 0.02; if (rnd() < 0.75) { var arc = new T.Mesh(new T.RingGeometry(d[0], d[0] + spess, 48, 1, th, lung), baseMat(T, rnd() < 0.3 ? PAL.chiaro : (ia % 2 ? PAL.azzurro : PAL.teal), rnd() < 0.3 ? 0.35 : 0.5)); gr.add(arc); } th += lung + 0.08 + rnd() * 0.3; if (th > 6.1) break; }
      var tacche = []; for (var tq = 0; tq < 72; tq++) { var aa = tq / 72 * 6.283, r1 = d[0] + 0.045, r2 = r1 + (tq % 6 ? 0.018 : 0.04); tacche.push(r1 * Math.cos(aa), r1 * Math.sin(aa), 0, r2 * Math.cos(aa), r2 * Math.sin(aa), 0); }
      var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(tacche, 3)); gr.add(new T.LineSegments(tg, lineMat(T, PAL.chiaro, 0.25)));
      var tri = new T.Mesh(new T.CircleGeometry(0.035, 3), baseMat(T, PAL.chiaro, 0.6)); gr.add(tri);
      var arcoMic = new T.Mesh(new T.RingGeometry(d[0] - 0.02, d[0] + 0.035, 64, 1, 0, 1.2), baseMat(T, PAL.azzurro, 0)); gr.add(arcoMic);
      var et = new T.Sprite(new T.SpriteMaterial({ map: etichettaTex(T, ['SYNC 0815', 'CORE 3.2', 'MEM 5L', 'NET 7A'][ia]), transparent: true, opacity: 0.55, depthWrite: false })); et.scale.set(0.42, 0.066, 1); et.position.set(d[0] + 0.25, 0.08, 0); gr.add(et);
      self.anelli.push({ gr: gr, verso: d[3], v: 0.02 + 0.012 * ia, tri: tri, r: d[0] + 0.07, arcoMic: arcoMic });
    });
    var fronte = new T.Mesh(new T.RingGeometry(1.7, 1.73, 128), baseMat(T, PAL.teal, 0.3)); fronte.rotation.x = 1.32; R.add(fronte);
    var fronte2 = new T.Mesh(new T.RingGeometry(1.76, 1.79, 128, 1, 0.4, 2.2), baseMat(T, PAL.azzurro, 0.42)); fronte2.rotation.x = 1.32; R.add(fronte2);
    var orbita = new T.Mesh(new T.RingGeometry(2.05, 2.06, 160), baseMat(T, PAL.chiaro, 0.16)); orbita.rotation.set(1.2, 0.3, 0); R.add(orbita);
    this.fronte = fronte;
    /* 5. satelliti */
    this.satelliti = [];
    for (var sI = 0; sI < 10; sI++) {
      var forma = sI % 3 === 0 ? new T.PlaneGeometry(0.07, 0.035) : new T.CircleGeometry(0.035, 6), m = new T.Mesh(forma, baseMat(T, sI % 2 ? PAL.teal : PAL.azzurro, 0.6)); R.add(m);
      var fg = new T.BufferGeometry(); fg.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)); var filo = new T.Line(fg, lineMat(T, PAL.chiaro, 0)); R.add(filo);
      this.satelliti.push({ m: m, filo: filo, a: sI / 10 * 6.283, inc: (rnd() - 0.5) * 1.2, r: 1.2 + rnd() * 0.15, v: 0.15 + rnd() * 0.15, uscita: 1.75 + rnd() * 0.35 });
    }
    this.indica = null;
    /* (v261) LE ONDE DELLA VOCE: gusci di luce che partono dal nucleo a ogni sillaba, si allargano e svaniscono (al massimo 5) */
    this.onde = []; var geoOnda = new T.SphereGeometry(1, 40, 28);
    for (var o5 = 0; o5 < 5; o5++) { var mo = new T.Mesh(geoOnda, new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.FrontSide, uniforms: { a: { value: 0 }, c: { value: new T.Color(PAL.azzurro) } },
      vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); v = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform float a; uniform vec3 c; varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0 - abs(dot(n, v)), 3.0); gl_FragColor = vec4(c*0.7, a*f); }' }));
      mo.visible = false; R.add(mo); this.onde.push({ m: mo, t: 9 }); }
    this.prossimaOnda = 0;
    /* (v261) I FOTONI: cambiando stato l'elettrone salta di orbitale ed emette un fotone del colore giusto della serie di Balmer
       (3→2 656 nm rosso, 4→2 486 nm azzurro, 5→2 434 nm viola): un lampo che parte dal nucleo e se ne va */
    this.fotoni = [];
    for (var f5 = 0; f5 < 3; f5++) { var gf = new T.BufferGeometry(); gf.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)); var lf = new T.Line(gf, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); R.add(lf);
      var tf = new T.Sprite(new T.SpriteMaterial({ map: nebbiaTex(T), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); tf.scale.setScalar(0.22); R.add(tf); this.fotoni.push({ linea: lf, testa: tf, t: 9, dir: new T.Vector3(1, 0, 0) }); }
    /* (v261) PARALLASSE: il nucleo si inclina appena verso il dito o il mouse (al massimo 0,12 rad) */
    this.punta = { x: 0, y: 0 }; this.incl = { x: 0, y: 0 };
    if (D && !calmo) { var self2 = this; this._muovi = function (e) { var p0 = e.touches ? e.touches[0] : e; if (!p0) return; var w = g.innerWidth || 1, h = g.innerHeight || 1; self2.punta.x = (p0.clientX / w - 0.5) * 2; self2.punta.y = (p0.clientY / h - 0.5) * 2; }; g.addEventListener('pointermove', this._muovi, { passive: true }); }
    /* l'HUD in DOM */
    if (opz.hudPadre) this.hud = creaHud(opz.hudPadre);
    this.stato('online');
  }
  Nucleo.prototype.cambiato = function () { if (this.opz.cambiato) try { this.opz.cambiato(this); } catch (e) { } };
  Nucleo.prototype.carica = function () { this.caricato = true; this.cambiato(); return Promise.resolve(true); };   /* niente da scaricare */
  Nucleo.prototype.presente = function () { return true; };
  Nucleo.prototype.daBuffer = function () { return Promise.resolve(false); };   /* nessun corpo da caricare: un blocco qualunque è rifiutato */
  Nucleo.prototype.usaScena = function () { return false; };
  Nucleo.prototype.stato = function (nome) {
    nome = ALIAS[nome] || nome; if (!OBIETTIVI[nome]) return this.nome;
    if (nome !== this.nome) { for (var k in this.par) this.da[k] = this.par[k]; this.cambioT = 0; this.nome = nome; }
    if (this.hud) this.hud.stato(t(NOMI[nome][0], NOMI[nome][1]) + (nome === 'lavoro' ? ' 100%' : ''), nome);
    return nome;
  };
  Nucleo.prototype.emozione = function (e) { this.corpo.emo = e; if (e === 'concentrata') this.stato('pensa'); };
  Nucleo.prototype.dici = function (testo) {
    var s = String(testo || '').trim(); if (!s) return; this.corpo.testo = s; this.stato('parla');
    var parole = s.split(/\s+/); this.parole = parole; this.parolaT = 0; this.durataVoce = Math.max(1.6, parole.length * 0.32);
    if (this.hud) this.hud.didascalia(parole, 0);
  };
  Nucleo.prototype.taci = function () { this.corpo.testo = false; this.parole = null; if (this.nome === 'parla') this.stato('online'); if (this.hud) this.hud.didascalia(null); };
  Nucleo.prototype.fai = function (g2, bersaglio, durata) {
    this.corpo.gesto = g2;
    if (g2 === 'pensa') this.stato('pensa');
    else if (g2 === 'cerca') this.stato('cerca');
    else if (g2 === 'indica' && bersaglio && this.radice) { var T = this.T, loc = this.interno.worldToLocal(bersaglio.clone ? bersaglio.clone() : new T.Vector3(bersaglio.x, bersaglio.y, bersaglio.z)); this.indica = { p: loc, t: 0, durata: durata || 2.5 }; }
  };
  Nucleo.prototype.scheda = function (d) { if (this.hud) return this.hud.scheda(d); };
  Nucleo.prototype.avviso = function (testo, sec) { var self = this; this.stato('avviso'); if (this.hud) this.hud.avviso(testo); clearTimeout(this._av); this._av = setTimeout(function () { if (self.nome === 'avviso') self.stato('online'); if (self.hud) self.hud.avviso(null); }, (sec || 2.4) * 1000); };
  /** il fotogramma: i parametri inseguono l'obiettivo dello stato in 0,75 s (easeInOutSine) */
  Nucleo.prototype.passo = function (dt) {
    var T = this.T, P = this.par, O = OBIETTIVI[this.nome], self = this; this.t += dt; this.cambioT = Math.min(1, this.cambioT + dt / 0.75); var e = sin01(this.cambioT);
    for (var k in P) P[k] = this.da[k] + (O[k] - this.da[k]) * e;
    var mv = calmo ? 0 : 1, tt = this.t;
    /* respiro del nucleo ±2 % in 6 s; con la voce i filamenti si gonfiano secondo l'inviluppo delle parole */
    var resp = 1 + 0.02 * Math.sin(tt * 2 * Math.PI / 6) * mv, voce = 0;
    if (this.meta) { this.radice.position.lerp(this.meta, Math.min(1, dt * 1.6)); if (this.radice.position.distanceTo(this.meta) < 0.002) this.meta = null; }   /* «cammina»: il nucleo scivola, senza scatti */
    if (this.parole) { this.parolaT += dt; var iw = Math.min(this.parole.length - 1, Math.floor(this.parolaT / 0.32)); voce = (0.5 + 0.5 * Math.abs(Math.sin(this.parolaT * 9.5))) * P.voce; if (this.hud && iw !== this.ultimaParola) { this.ultimaParola = iw; this.hud.didascalia(this.parole, iw); } if (this.parolaT > this.durataVoce + 1.2) this.taci(); }
    /* i nucleoni: respiro collettivo ±2 % e vibrazione minima di ognuno; con la voce un fremito appena più ampio */
    this.nucleoni.forEach(function (m) { var f = m.userData.f, j = (0.004 + 0.01 * voce) * mv; m.position.set(m.userData.p0.x * resp + j * Math.sin(tt * 3.1 + f), m.userData.p0.y * resp + j * Math.sin(tt * 2.7 + f * 1.3), m.userData.p0.z * resp + j * Math.sin(tt * 3.4 + f * 0.7)); });
    this.cuore.rotation.y += dt * 0.05 * mv; this.cuore.rotation.x += dt * 0.017 * mv; this.flusso.material.uniforms.op.value = 0.1 + 0.07 * (0.5 + 0.5 * Math.sin(tt * 1.7)) * (calmo ? 0 : 1) + 0.08 * voce; this.flusso.material.uniforms.t.value = calmo ? 0 : tt;
    this.nebbia.material.opacity = 0.14 + 0.06 * P.luce + 0.06 * voce;
    /* la nuvola: forma dell'orbitale dello stato, trasformata con easeInOutSine in 0,9 s; con la voce il 2s pulsa */
    var vuoi = { pensa: '2p', parla: '2s', cerca: '3d', lavoro: '3d' }[this.nome] || '1s', O2 = this.orbitale;
    if (vuoi !== O2.a) { O2.da = O2.a; O2.a = vuoi; O2.s = 0; O2.prima = this.nuvola.geometry.attributes.position.array.slice(); }
    if (O2.s < 1) { O2.s = Math.min(1, O2.s + dt / 0.9); var es = sin01(O2.s), A0 = O2.prima, B0 = this.forme[O2.a], pp = this.nuvola.geometry.attributes.position.array; for (var q3 = 0; q3 < pp.length; q3++) pp[q3] = A0[q3] + (B0[q3] - A0[q3]) * es; this.nuvola.geometry.attributes.position.needsUpdate = true; }
    var gonfia = 1 + 0.06 * voce; this.nuvola.scale.setScalar(gonfia * resp); this.nuvola.rotation.y += dt * 0.06 * mv; this.nuvola.material.uniforms.op.value = 0.3 + 0.12 * P.luce; this.nuvola.material.uniforms.t.value = tt; this.nuvola.material.uniforms.voce.value = voce;
    /* gli elettroni: orbite ellittiche (anomalia eccentrica), più rapide in «cerca»; la scia segue le ultime posizioni */
    this.elettroni.forEach(function (E) {
      E.fase += dt * E.v * (0.7 + 0.3 * P.vel) * mv; var Ea = E.fase, x = E.a * (Math.cos(Ea) - E.ecc), y = E.a * Math.sqrt(1 - E.ecc * E.ecc) * Math.sin(Ea); E.el.position.set(x, y, 0);
      var ps = E.scia.geometry.attributes.position.array; for (var q4 = E.NS - 1; q4 > 0; q4--) { var Eb = Ea - q4 * 0.05; ps[3 * q4] = E.a * (Math.cos(Eb) - E.ecc); ps[3 * q4 + 1] = E.a * Math.sqrt(1 - E.ecc * E.ecc) * Math.sin(Eb); ps[3 * q4 + 2] = 0; } ps[0] = x; ps[1] = y; ps[2] = 0; E.scia.geometry.attributes.position.needsUpdate = true;
    });
    this.guscio.rotation.y += dt * 0.03 * P.vel * mv; this.guscio.rotation.x += dt * 0.008 * P.vel * mv;
    this.reteTessere.rotation.y -= dt * 0.02 * P.vel * mv; this.tessere.rotation.copy(this.reteTessere.rotation);
    /* anelli: rotazione lenta a versi alternati (max 0,2 rad/s); l'arco del microfono in ascolto */
    this.anelli.forEach(function (A, i) { var w = Math.min(0.2, A.v * P.vel) * A.verso * mv; A.gr.rotation.z += w * dt; var ph = tt * 0.4 * A.verso + i; A.tri.position.set(A.r * Math.cos(ph), A.r * Math.sin(ph), 0); A.tri.rotation.z = ph + Math.PI / 2; A.arcoMic.material.opacity = (i === 0 ? 0.5 : 0.25) * P.mic * (0.6 + 0.4 * Math.sin(tt * 2.1 + i)); });
    this.fronte.rotation.z += dt * 0.015 * P.vel * mv;
    /* tessere: in «pensa» se ne accendono al massimo 6, con dissolvenza di 400 ms */
    var at = this.tessere.geometry.attributes.acceso, arr = at.array;
    if (P.tessere > 0.05 && this.accese.length < Math.round(6 * P.tessere) && Math.random() < dt * 3) this.accese.push({ f: Math.floor(Math.random() * this.nTessere), t: 0, vita: 1.2 + Math.random() * 1.4 });
    arr.fill(0); this.accese = this.accese.filter(function (q) { q.t += dt; if (q.t > q.vita) return false; var a = Math.min(1, q.t / 0.4, (q.vita - q.t) / 0.4); arr[3 * q.f] = arr[3 * q.f + 1] = arr[3 * q.f + 2] = a; return true; }); at.needsUpdate = true;
    /* satelliti: in «cerca» escono su un filo e rientrano */
    this.satelliti.forEach(function (S2, i) {
      S2.a += dt * S2.v * mv * (0.6 + 0.4 * P.vel); var fuori = P.fuori * (0.5 + 0.5 * Math.sin(tt * 0.9 + i * 0.7)), r = S2.r + (S2.uscita - S2.r) * fuori;
      var x = r * Math.cos(S2.a), y = r * Math.sin(S2.a) * Math.cos(S2.inc), z = r * Math.sin(S2.a) * Math.sin(S2.inc); S2.m.position.set(x, y, z); S2.m.lookAt(0, 0, 0);
      var fp = S2.filo.geometry.attributes.position.array; fp[3] = x; fp[4] = y; fp[5] = z; S2.filo.geometry.attributes.position.needsUpdate = true; S2.filo.material.opacity = 0.35 * fuori;
    });
    /* «indica»: un satellite vola verso il bersaglio e lo collega con un filo */
    if (this.indica) { var I = this.indica, s0 = this.satelliti[0]; I.t += dt; var f = sin01(Math.min(1, I.t / 0.9)) * (I.t > I.durata ? Math.max(0, 1 - (I.t - I.durata) / 0.9) : 1); s0.m.position.lerp(I.p, f); var fp2 = s0.filo.geometry.attributes.position.array; fp2[3] = s0.m.position.x; fp2[4] = s0.m.position.y; fp2[5] = s0.m.position.z; s0.filo.geometry.attributes.position.needsUpdate = true; s0.filo.material.opacity = 0.45 * f; if (I.t > I.durata + 0.9) this.indica = null; }
    /* (v261) l'energia della voce vera (audio) quando c'è, altrimenti l'inviluppo delle parole */
    var ev = this.energiaVoce != null && this.nome === 'parla' ? this.energiaVoce : voce; this.energiaVoce = this.energiaVoce != null ? this.energiaVoce * Math.pow(0.02, dt) : null;
    /* onde della voce */
    this.prossimaOnda -= dt;
    if (this.nome === 'parla' && ev > 0.35 && this.prossimaOnda <= 0 && !calmo) { var lib = this.onde.filter(function (o) { return o.t > 1.4; })[0]; if (lib) { lib.t = 0; lib.forza = Math.min(1, ev); } this.prossimaOnda = 0.32; }
    this.onde.forEach(function (o) { o.t += dt; var u = o.t / 1.4; if (u >= 1) { o.m.visible = false; return; } o.m.visible = true; var rr = 0.35 + 1.35 * sin01(u); o.m.scale.setScalar(rr); o.m.material.uniforms.a.value = 0.62 * (o.forza || 0.6) * (1 - u) * (1 - u); });
    /* fotoni a ogni cambio di stato */
    if (this.nome !== this._ultimoStato) { var prima = this._ultimoStato; this._ultimoStato = this.nome; if (prima && !calmo) { var colF = { pensa: 0x8fe8ff, cerca: 0xb48cff, parla: 0x6bcfff, avviso: 0xffb547 }[this.nome] || 0xff7a6a, lb = this.fotoni.filter(function (q) { return q.t > 1.2; })[0]; if (lb) { lb.t = 0; lb.dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); lb.linea.material.color.setHex(colF); lb.testa.material.color.setHex(colF); } } }
    this.fotoni.forEach(function (q) { q.t += dt; var u = q.t / 1.1; if (u >= 1) { q.linea.material.opacity = 0; q.testa.material.opacity = 0; return; } var r1 = 0.15 + 1.9 * u, r0 = Math.max(0.12, r1 - 0.7), ap = q.linea.geometry.attributes.position.array; ap[0] = q.dir.x * r0; ap[1] = q.dir.y * r0; ap[2] = q.dir.z * r0; ap[3] = q.dir.x * r1; ap[4] = q.dir.y * r1; ap[5] = q.dir.z * r1; q.linea.geometry.attributes.position.needsUpdate = true; var a2 = Math.min(1, u * 6) * (1 - u); q.linea.material.opacity = 0.75 * a2; q.testa.position.set(q.dir.x * r1, q.dir.y * r1, q.dir.z * r1); q.testa.material.opacity = 0.8 * a2; });
    /* parallasse dolce */
    if (!calmo) { this.incl.x += ((this.punta.y * 0.12) - this.incl.x) * Math.min(1, dt * 2.5); this.incl.y += ((this.punta.x * 0.12) - this.incl.y) * Math.min(1, dt * 2.5); this.interno.rotation.x = this.incl.x; this.interno.rotation.y = this.incl.y; }
    this.vetro.material.uniforms.w.value = P.ambra; this.nucleoni.forEach(function (m) { m.material.uniforms.k.value = 0.85 + 0.15 * P.luce; });
    if (this.hud) this.hud.ambra(P.ambra);
  };
  Nucleo.prototype.dispose = function () {
    if (this._muovi) g.removeEventListener('pointermove', this._muovi);
    this.radice.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    if (this.radice.parent) this.radice.parent.remove(this.radice); if (this.hud) this.hud.togli();
  };

  /* ═══ L'HUD in DOM ═══════════════════════════════════════════════════ */
  var CSS = ':root{--bsiN-fondo1:#050a16;--bsiN-fondo2:#0a1b2e;--bsiN-teal:#00c9b7;--bsiN-azzurro:#6bcfff;--bsiN-blu:#2f6bff;--bsiN-chiaro:rgba(215,247,243,.6);--bsiN-hud:#9fd0ff;--bsiN-valore:#5eead4;--bsiN-ambra:#ffb547}' +
    '.bsiN-hud{position:absolute;inset:0;pointer-events:none;font-family:ui-monospace,"JetBrains Mono",Menlo,monospace;color:var(--bsiN-hud)}' +
    '.bsiN-dida{position:absolute;left:12px;right:12px;top:10px;max-width:560px;margin:0 auto;background:rgba(5,10,22,.82);border:1px solid rgba(107,207,255,.28);border-bottom:2px solid var(--bsiN-teal);border-radius:4px;padding:6px 10px 7px;opacity:0;transform:translateY(-6px);transition:opacity .4s ease,transform .4s ease}' +
    '.bsiN-dida.on{opacity:1;transform:none}.bsiN-dida small{display:block;font-size:9px;letter-spacing:.18em;color:var(--bsiN-valore)}.bsiN-dida p{margin:2px 0 0;font-size:11.5px;line-height:1.35;letter-spacing:.06em;text-transform:uppercase;color:#d7f7f3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.bsiN-stato{position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:10px;letter-spacing:.3em;color:var(--bsiN-hud);transition:color .6s}.bsiN-stato i{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--bsiN-teal);margin-right:8px;vertical-align:1px}' +
    '.bsiN-card{position:absolute;min-width:150px;max-width:44%;background:rgba(5,12,26,.74);border:1px solid rgba(107,207,255,.3);border-radius:4px;box-shadow:0 6px 24px rgba(0,0,0,.45);padding:7px 10px;font-size:10px;letter-spacing:.08em;opacity:0;transform:translateY(8px);transition:opacity .25s ease,transform .25s ease}' +
    '.bsiN-card.on{opacity:1;transform:none}.bsiN-card b{display:block;font-size:9px;letter-spacing:.18em;color:var(--bsiN-valore)}.bsiN-card .v{float:right;font-size:18px;color:#d7f7f3;margin-left:10px}.bsiN-card .r{clear:both;color:#bcd7f0;margin-top:3px}.bsiN-card .barra{height:3px;background:rgba(107,207,255,.18);margin-top:3px}.bsiN-card .barra i{display:block;height:3px;background:var(--bsiN-azzurro)}' +
    '.bsiN-avviso{position:absolute;left:0;right:0;top:46%;background:rgba(255,181,71,.14);border-top:1px solid var(--bsiN-ambra);border-bottom:1px solid var(--bsiN-ambra);color:var(--bsiN-ambra);text-align:center;font-size:11px;letter-spacing:.2em;padding:6px;opacity:0;transition:opacity .4s}.bsiN-avviso.on{opacity:1}' +
    '.bsiN-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
    '@media (prefers-reduced-motion: reduce){.bsiN-dida,.bsiN-card{transform:none!important}}';
  function stile() { if (!D || D.getElementById('bsiN-stile')) return; var s = D.createElement('style'); s.id = 'bsiN-stile'; s.textContent = CSS; D.head.appendChild(s); }
  function creaHud(padre) {
    stile();
    var h = D.createElement('div'); h.className = 'bsiN-hud';
    var dida = D.createElement('div'); dida.className = 'bsiN-dida'; dida.innerHTML = '<small>◇ SPECTRA · ' + t('PARLO', 'SPEAKING') + '</small><p></p>'; h.appendChild(dida);
    var sr = D.createElement('div'); sr.className = 'bsiN-sr'; sr.setAttribute('aria-live', 'polite'); h.appendChild(sr);
    var st = D.createElement('div'); st.className = 'bsiN-stato'; st.setAttribute('role', 'status'); h.appendChild(st);
    var av = D.createElement('div'); av.className = 'bsiN-avviso'; h.appendChild(av);
    padre.appendChild(h);
    var ultimoSr = '';
    return {
      el: h,
      stato: function (testo, nome) { st.innerHTML = '<i></i>' + testo; st.dataset.stato = nome; },
      didascalia: function (parole, i) {
        if (!parole) { dida.classList.remove('on'); return; }
        dida.classList.add('on'); var da = Math.max(0, i - 16); dida.querySelector('p').textContent = (da ? '… ' : '') + parole.slice(da, i + 1).join(' ');   /* scorre alla parola corrente */
        var tutto = parole.join(' '); if (tutto !== ultimoSr) { ultimoSr = tutto; sr.textContent = tutto; }
      },
      scheda: function (d) {
        var c = D.createElement('div'); c.className = 'bsiN-card'; var pos = d.posizione || { left: '8px', top: '26%' }; for (var k in pos) c.style[k] = pos[k];
        var html = '<b>' + (d.titolo || '') + '</b>' + (d.valore != null ? '<span class="v">' + d.valore + '</span>' : '') + (d.sotto ? '<div>' + d.sotto + '</div>' : '');
        (d.righe || []).slice(0, 5).forEach(function (r) { html += '<div class="r">' + r + '</div>'; });
        (d.barre || []).slice(0, 5).forEach(function (b) { html += '<div class="r">' + b[0] + '</div><div class="barra"><i style="width:' + Math.max(0, Math.min(100, b[1])) + '%"></i></div>'; });
        c.innerHTML = html; h.appendChild(c); requestAnimationFrame(function () { c.classList.add('on'); }); setTimeout(function () { c.classList.add('on'); }, 30);
        setTimeout(function () { c.classList.remove('on'); setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 300); }, (d.durata || 8) * 1000);
        return c;
      },
      avviso: function (testo) { if (testo) { av.textContent = '⚠ ' + testo; av.classList.add('on'); } else av.classList.remove('on'); },
      ambra: function (w) { dida.style.borderBottomColor = w > 0.5 ? 'var(--bsiN-ambra)' : 'var(--bsiN-teal)'; st.style.color = w > 0.5 ? 'var(--bsiN-ambra)' : ''; },
      togli: function () { if (h.parentNode) h.parentNode.removeChild(h); }
    };
  }

  /* ═══ FALLBACK 2D (senza WebGL): cerchi, archi che girano, esagoni, stessi stati ═══ */
  function Nucleo2D(tela, opz) {
    opz = opz || {}; var q = tela.getContext('2d'), self = this; this.nome = 'online'; this.t = 0; this.corpo = { gesto: null, emo: null, testo: false }; this.caricato = true;
    if (opz.hudPadre) this.hud = creaHud(opz.hudPadre);
    this.disegna = function (dt) {
      self.t += dt; var W = tela.clientWidth || 300, H = tela.clientHeight || 300, dpr = (g.BSIRisoluzione ? g.BSIRisoluzione.dpr() : Math.min(2, g.devicePixelRatio || 1)); if (tela.width !== Math.round(W * dpr)) { tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr); }
      q.setTransform(dpr, 0, 0, dpr, 0, 0); q.fillStyle = PAL.fondo1; q.fillRect(0, 0, W, H); var cx = W / 2, cy = H * 0.5, R = Math.min(W, H) * 0.33, v = calmo ? 0 : (self.nome === 'cerca' ? 0.2 : 0.05);
      /* (v259) la particella in 2D: nuvola sfumata, nucleo di nucleoni, elettroni su orbite ellittiche, archi HUD */
      var gr = q.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9); gr.addColorStop(0, 'rgba(107,207,255,.28)'); gr.addColorStop(1, 'rgba(47,107,255,0)'); q.fillStyle = gr; q.beginPath(); q.arc(cx, cy, R * 0.9, 0, 6.283); q.fill();
      q.strokeStyle = 'rgba(0,201,183,.3)'; for (var i = 0; i < 3; i++) { q.beginPath(); q.arc(cx, cy, R * (1.05 + i * 0.14), self.t * v * (i % 2 ? -1 : 1), self.t * v * (i % 2 ? -1 : 1) + 3.6); q.stroke(); }
      for (i = 0; i < 3; i++) { var inc = i * 1.05 + 0.3, fa = self.t * (calmo ? 0 : 0.8 + 0.3 * i) + i * 2; q.save(); q.translate(cx, cy); q.rotate(inc); q.strokeStyle = 'rgba(107,207,255,.35)'; q.beginPath(); q.ellipse(0, 0, R * 0.95, R * 0.34, 0, 0, 6.283); q.stroke(); q.fillStyle = 'rgba(215,247,243,.75)'; q.beginPath(); q.arc(R * 0.95 * Math.cos(fa), R * 0.34 * Math.sin(fa), 3, 0, 6.283); q.fill(); q.restore(); }
      var resp = 1 + (calmo ? 0 : 0.02 * Math.sin(self.t * 1.05));
      [[0, 0, 0], [1, 0.2, 1], [-0.9, 0.5, 1], [0.3, -1, 0], [-0.4, -0.9, 1], [0.9, 0.9, 0], [-1, -0.3, 0], [0.1, 1.05, 1]].forEach(function (n) { var x = cx + n[0] * R * 0.09 * resp, y = cy + n[1] * R * 0.09 * resp, g2 = q.createRadialGradient(x - 2, y - 2, 0, x, y, R * 0.08); g2.addColorStop(0, n[2] ? '#8fb3ff' : '#9ff5ea'); g2.addColorStop(1, n[2] ? '#1d3fa8' : '#00796e'); q.fillStyle = g2; q.beginPath(); q.arc(x, y, R * 0.075, 0, 6.283); q.fill(); });
    };
  }
  ['stato', 'dici', 'taci', 'fai', 'emozione', 'scheda', 'avviso', 'carica', 'presente'].forEach(function (k) { Nucleo2D.prototype[k] = function (a, b, c) { return Nucleo.prototype[k].call(this, a, b, c); }; });
  Nucleo2D.prototype.passo = function (dt) { this.disegna(dt); if (this.parole) { this.parolaT += dt; var iw = Math.min(this.parole.length - 1, Math.floor(this.parolaT / 0.32)); if (this.hud) this.hud.didascalia(this.parole, iw); if (this.parolaT > this.durataVoce + 1.2) this.taci(); } };
  Nucleo2D.prototype.cambiato = function () { };
  Nucleo2D.prototype.dispose = function () { if (this.hud) this.hud.togli(); };

  g.BSISpectraNucleo = { Nucleo: Nucleo, Nucleo2D: Nucleo2D, PAL: PAL, NOMI: NOMI, OBIETTIVI: OBIETTIVI, guscioEsagonale: guscioEsagonale, sin01: sin01 };
})(typeof window !== 'undefined' ? window : globalThis);
