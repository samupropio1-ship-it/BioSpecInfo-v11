/* ═══════════════════════════════════════════════════════════════════════════
   bsi-orbitali-cinema.js — 🌌 Onde di fase e correnti (scheda del laboratorio
   degli orbitali, v255)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Richiesta dell'autore, con quattro fotogrammi di riferimento: orbitali come
   superfici a reticolo, correnti di probabilità che girano in scie, l'onda di
   fase come un foglio che ondeggia, l'anello di de Broglie con m lunghezze
   d'onda, le formule in sovrimpressione. Qui c'è tutto, calcolato:

   · LA SUPERFICIE: per la forma complessa |ψ_nlm|² non dipende da φ, quindi
     l'isosuperficie è una superficie di rotazione. Si calcola il contorno di
     |ψ|² al livello che racchiude il 90 % nel semipiano meridiano (quadrati
     marcianti) e lo si fa ruotare: meridiani e paralleli sono curve vere della
     superficie, non un disegno.
   · LE SCIE: punti campionati da |ψ|² che si muovono con la velocità della
     corrente di probabilità (unità atomiche, ħ = mₑ = 1):
        J = Im(ψ*∇ψ) = (m/ρ)|ψ|² φ̂,   v = J/|ψ|² = m/ρ,   ρ = r sin θ.
     Moto circolare attorno all'asse z, più veloce vicino all'asse. Velocità
     esagerata per vederla (dichiarato sulla figura).
   · L'ONDA DI FASE: sul piano orizzontale dove la densità è massima il foglio
     ha altezza ∝ Re[ψ e^(−iEt/ħ)] e colore = fase. Per m ≠ 0 la figura ruota
     attorno a z con velocità angolare ω/m: un'onda che corre; per m = 0
     respira sul posto.
   · L'ANELLO DI DE BROGLIE: sul cerchio di raggio ρ* (dove la densità è
     massima in quel piano) stanno m lunghezze d'onda: p = mħ/ρ, λ = h/p =
     2πρ/m, ∮p·dl = 2πmħ. È l'immagine semiclassica di Bohr–Sommerfeld, non
     l'orbitale: lo dice la didascalia.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI;
  function O() { return F.calcolo.orbitali; }
  function num(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); }

  /* ═══ 1. IL CALCOLO ════════════════════════════════════════════════════ */
  /** Densità nel semipiano meridiano (R ≥ 0, z) per la forma complessa: non dipende da φ. */
  function densitaRZ(o, R, z) { var p = O().psi({ n: o.n, l: o.l, m: o.m, reale: false, Z: o.Z || 1 }, R, 0, z); return p.re * p.re + p.im * p.im; }
  /** Corrente di probabilità numerica J = Im(ψ*∇ψ) (differenze finite) e la formula (m/ρ)|ψ|² φ̂. */
  function corrente(o, x, y, z) {
    var q = { n: o.n, l: o.l, m: o.m, reale: false, Z: o.Z || 1 }, h = 1e-4, P = O().psi(q, x, y, z), J = [0, 0, 0], d = [[h, 0, 0], [0, h, 0], [0, 0, h]];
    for (var k = 0; k < 3; k++) { var a = O().psi(q, x + d[k][0], y + d[k][1], z + d[k][2]), b = O().psi(q, x - d[k][0], y - d[k][1], z - d[k][2]), gre = (a.re - b.re) / (2 * h), gim = (a.im - b.im) / (2 * h); J[k] = P.re * gim - P.im * gre; }
    var rho = Math.hypot(x, y), dens = P.re * P.re + P.im * P.im, phi = [-y / rho, x / rho, 0];
    return { numerica: J, formula: [phi[0] * o.m / rho * dens, phi[1] * o.m / rho * dens, 0], densita: dens };
  }
  /** Contorno di |ψ|² al livello c nel semipiano meridiano, quadrati marcianti: segmenti [[R,z],[R,z]]. */
  function contorno(o, L, NR, NZ, c) {
    var hR = L / NR, hZ = 2 * L / NZ, v = [], seg = [];
    for (var j = 0; j <= NZ; j++) { var riga = []; for (var i = 0; i <= NR; i++) riga.push(densitaRZ(o, i * hR, -L + j * hZ)); v.push(riga); }
    function p(i, j, i2, j2) { var a = v[j][i], b = v[j2][i2], s = (c - a) / (b - a); return [(i + s * (i2 - i)) * hR, -L + (j + s * (j2 - j)) * hZ]; }
    for (var jj = 0; jj < NZ; jj++) for (var ii = 0; ii < NR; ii++) {
      var k = (v[jj][ii] > c ? 1 : 0) | (v[jj][ii + 1] > c ? 2 : 0) | (v[jj + 1][ii + 1] > c ? 4 : 0) | (v[jj + 1][ii] > c ? 8 : 0);
      if (k === 0 || k === 15) continue;
      var E = { b: function () { return p(ii, jj, ii + 1, jj); }, r: function () { return p(ii + 1, jj, ii + 1, jj + 1); }, t: function () { return p(ii, jj + 1, ii + 1, jj + 1); }, l: function () { return p(ii, jj, ii, jj + 1); } };
      var TAB = { 1: ['l', 'b'], 2: ['b', 'r'], 3: ['l', 'r'], 4: ['r', 't'], 5: ['l', 't', 'b', 'r'], 6: ['b', 't'], 7: ['l', 't'], 8: ['t', 'l'], 9: ['t', 'b'], 10: ['b', 'l', 't', 'r'], 11: ['t', 'r'], 12: ['r', 'l'], 13: ['r', 'b'], 14: ['b', 'l'] }[k];
      for (var q = 0; q < TAB.length; q += 2) seg.push([E[TAB[q]](), E[TAB[q + 1]]()]);
    }
    return seg;
  }
  /** Il piano della densità massima: angolo polare θ* dove |P_l^m(cos θ)|²·sin… è massimo nell'emisfero nord, raggio più probabile. */
  function pianoMassimo(o) {
    var best = -1, th = PI / 2; for (var i = 1; i <= 180; i++) { var a = i / 360 * PI, A = O().angolare(o.l, o.m, false, a, 0), v = A.re * A.re + A.im * A.im; if (v > best + 1e-12) { best = v; th = a; } }
    var r = O().radialeInfo(o.n, o.l, o.Z || 1).rPiuProbabile;
    return { theta: th, r: r, z: r * Math.cos(th), rho: r * Math.sin(th) };
  }
  function energia(o) { return -0.5 * Math.pow(o.Z || 1, 2) / (o.n * o.n); }   /* hartree */
  F.calcolo.orbitaliCinema = { densitaRZ: densitaRZ, corrente: corrente, contorno: contorno, pianoMassimo: pianoMassimo };

  /** Gradiente di |ψ|² nel semipiano meridiano (per le normali della superficie: perpendicolari alla superficie di livello). */
  function gradienteRZ(o, R, z) { var h = 1e-3 * (o.n * o.n); return [(densitaRZ(o, R + h, z) - densitaRZ(o, Math.max(0, R - h), z)) / (R > h ? 2 * h : R + h), (densitaRZ(o, R, z + h) - densitaRZ(o, R, z - h)) / (2 * h)]; }
  F.calcolo.orbitaliCinema.gradienteRZ = gradienteRZ;
  /** Vetro con il bordo luminoso (Fresnel): opaco di fronte, brillante dove la superficie si vede di taglio. */
  function vetro(T, col, op) {
    return new T.ShaderMaterial({ uniforms: { colore: { value: new T.Color(col) }, opacita: { value: op } }, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vC; attribute vec3 color; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vC = color; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 colore; uniform float opacita; varying vec3 vN; varying vec3 vV; varying vec3 vC; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); vec3 c = mix(colore, vC, 0.85); gl_FragColor = vec4(c * (0.18 + 1.5 * f), opacita * (0.25 + f)); }' });
  }
  /** Punto di luce morbido (gaussiano) per le teste delle scie. */
  var SPRITE = null;
  function luce(T) { if (SPRITE) return SPRITE; var c = globale.document.createElement('canvas'); c.width = c.height = 64; var q = c.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 64, 64); SPRITE = new T.CanvasTexture(c); return SPRITE; }

  function qualitaAuto() { var n = globale.navigator || {}, piccolo = (globale.innerWidth || 1000) < 700; if (n.deviceMemory && n.deviceMemory <= 2) return 0; return !piccolo && (n.hardwareConcurrency || 4) >= 8 ? 2 : 1; }
  /* ═══ 2. LA SCHEDA ═════════════════════════════════════════════════════ */
  function hsl(h, s, l) { h = ((h % 1) + 1) % 1; var a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }
  function scheda(div) {
    var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G);
    var livello = qualitaAuto(), o = { n: 4, l: 3, m: 3, Z: 1 }, mostra = { superficie: true, scie: true, fase: true, anello: true }, S = null, T = null, stato = null, tempo = 0;
    var ferma = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var PRESET = [['4f3', '4f, m = 3 (anello, tre lunghezze d\'onda)', [4, 3, 3]], ['3d1', '3d, m = 1 (due lobi e un toro)', [3, 2, 1]], ['3d2', '3d, m = 2', [3, 2, 2]], ['2p1', '2p, m = 1 (una ciambella)', [2, 1, 1]], ['5g4', '5g, m = 4', [5, 4, 4]], ['3d0', '3dz², m = 0 (nessuna corrente)', [3, 2, 0]], ['4f1', '4f, m = 1', [4, 3, 1]]];
    F.scelta(pan, ['Orbitale', 'Orbital'], PRESET.map(function (p) { return [p[0], p[1]]; }), '4f3', function (v) { var p = PRESET.filter(function (x) { return x[0] === v; })[0][2]; o.n = p[0]; o.l = p[1]; o.m = p[2]; costruisci(); });
    var segno = F.scelta(pan, ['Verso della rotazione', 'Sense of rotation'], [['+', ['m positivo (antiorario visto da +z)', 'positive m (counter-clockwise from +z)']], ['-', ['m negativo (orario)', 'negative m (clockwise)']]], '+', function (v) { o.m = Math.abs(o.m) * (v === '-' ? -1 : 1); costruisci(); });
    F.scelta(pan, ['Qualità', 'Quality'], [['2', ['massima (più scie, superficie più fine)', 'maximum (more streaks, finer surface)']], ['1', ['normale', 'normal']], ['0', ['leggera (telefoni lenti)', 'light (slow phones)']]], String(livello), function (v) { livello = +v; costruisci(); });
    var sv = F.el('div', { style: 'display:grid;gap:2px;margin:8px 0' }); pan.appendChild(sv);
    [['superficie', ['Superficie a reticolo (90 %)', 'Wireframe surface (90 %)']], ['scie', ['Scie della corrente di probabilità', 'Probability-current streaks']], ['fase', ['Onda di fase sul piano', 'Phase wave on the plane']], ['anello', ['Anello di de Broglie (semiclassico)', 'de Broglie ring (semiclassical)']]].forEach(function (x) {
      var lab = F.el('label', { style: 'display:flex;align-items:center;justify-content:flex-start;gap:10px;min-height:36px;width:100%;text-align:left;cursor:pointer' }), c = F.el('input', { type: 'checkbox', style: 'width:20px;height:20px;flex:0 0 auto;margin:0' }); c.checked = mostra[x[0]];
      c.addEventListener('change', function () { mostra[x[0]] = c.checked; if (stato) Object.keys(stato.parti).forEach(function (k) { if (stato.parti[k]) stato.parti[k].visible = !!mostra[k]; }); if (S) { S.sporca = true; S.avvia(); } }); lab.appendChild(c); lab.appendChild(F.el('span', { testo: t(x[1][0], x[1][1]) })); sv.appendChild(lab);
    });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var formule = F.el('div', { 'class': 'bsiOC-formule', 'aria-hidden': 'true' });
    function testo() {
      var nm = O().nome({ n: o.n, l: o.l, m: o.m, reale: false }), PM = pianoMassimo(o), ac = Math.abs(o.m);
      formule.innerHTML = '<div class="bsiOC-titolo">' + (o.m ? t('L\'orbitale porta onde di fase che circolano.', 'The orbital carries circulating phase waves.') : t('Con m = 0 la fase non gira: l\'onda respira.', 'With m = 0 the phase does not wind: the wave breathes.')) + '</div>' +
        '<div>ψ<sub>nlm</sub>(r, t) = |ψ<sub>nlm</sub>| e<sup>i(mφ − E<sub>n</sub>t/ħ)</sup> &nbsp;&nbsp; <b>J</b> = (ħ/mₑ) Im(ψ*∇ψ) = ħm|ψ|²/(mₑ r sin θ) φ̂</div>' +
        (ac ? '<div>∮ <b>p</b>·d<b>l</b> = 2πmħ &nbsp; (m = ' + o.m + ', 2πρ = ' + ac + 'λ<sub>dB</sub>)</div>' : '');
      info.innerHTML = '<b>' + nm + '</b> · E = ' + num(energia(o) * 27.2114, 3) + ' eV<br>' +
        (ac ? t('Corrente attorno all\'asse z: v = ħ|m|/(mₑ ρ). Sul piano a z = ', 'Current around the z axis: v = ħ|m|/(mₑ ρ). On the plane at z = ') + num(PM.z, 1) + ' a₀, ' + t('a ρ = ', 'at ρ = ') + num(PM.rho, 1) + ' a₀: v = <b class="bsiFX-num">' + num(ac / PM.rho * 2.18769e6 / 1e3, 0) + ' km/s</b>, λ = 2πρ/|m| = <b class="bsiFX-num">' + num(2 * PI * PM.rho / ac, 1) + ' a₀</b>.'
          : t('Con m = 0 la funzione ha la stessa fase in ogni punto di un parallelo: J = 0, nessuna scia si muove. Il foglio sale e scende tutto insieme.', 'With m = 0 the function has the same phase along each parallel: J = 0, no streak moves. The sheet rises and falls all together.')) +
        '<br><small>' + t('Reticolo: isosuperficie vera (contorno al 90 % ruotato attorno a z); colori del reticolo: segno della parte polare P_l^m(cos θ). Scie: velocità esagerata, l\'animazione è rallentata di circa 10¹⁵ volte; la fase gira con ω ∝ |E_n| ∝ 1/n², nel rapporto vero fra i livelli. L\'anello di de Broglie è l\'immagine semiclassica di Bohr–Sommerfeld: nella meccanica quantistica l\'elettrone non sta su un cerchio.', 'Wireframe: true isosurface (90 % contour revolved around z); wireframe colours: sign of the polar part P_l^m(cos θ). Streaks: exaggerated speed, the animation is slowed about 10¹⁵ times. The de Broglie ring is the Bohr–Sommerfeld semiclassical picture: in quantum mechanics the electron is not on a circle.') + '</small>';
    }
    function costruisci() {
      testo(); if (!S) return;
      S.pulisci(); var gr = new T.Group(); S.aggiungi(gr); stato = { parti: {} };
      var L = (o.n * o.n * 3 + 10) * 0.85 / (o.Z || 1), Q = livello;
      /* livello al 90 % da una griglia 3D */
      var N = [30, 36, 48][Q], h = 2 * L / N, vals = new Float32Array((N + 1) * (N + 1) * (N + 1)), k = 0;
      for (var a = 0; a <= N; a++) for (var b = 0; b <= N; b++) for (var c = 0; c <= N; c++) vals[k++] = densitaRZ(o, Math.hypot(-L + c * h, -L + b * h), -L + a * h);
      var c90 = O().soglia(vals, h * h * h, 0.9);
      /* 1. la superficie a reticolo: contorno meridiano ruotato */
      var seg = contorno(o, L, [100, 170, 260][Q], [200, 340, 520][Q], c90), pos = [], col = [], NM = [20, 32, 48][Q];
      function colorePolare(R, z) { var th = Math.atan2(R, z), P = O().legendre(o.l, Math.abs(o.m), Math.cos(th)); return P >= 0 ? [0.36, 0.78, 1.0] : [1.0, 0.62, 0.22]; }
      for (var q = 0; q < NM; q++) { var f = 2 * PI * q / NM, cf = Math.cos(f), sf = Math.sin(f); seg.forEach(function (s) { var cc = colorePolare((s[0][0] + s[1][0]) / 2, (s[0][1] + s[1][1]) / 2); pos.push(s[0][0] * cf, s[0][0] * sf, s[0][1], s[1][0] * cf, s[1][0] * sf, s[1][1]); col.push.apply(col, cc.concat(cc)); }); }
      var NP = [14, 22, 34][Q], passo = Math.max(1, Math.floor(seg.length / NP));
      for (var si = 0; si < seg.length; si += passo) { var s0 = seg[si], R0 = (s0[0][0] + s0[1][0]) / 2, z0 = (s0[0][1] + s0[1][1]) / 2, cc2 = colorePolare(R0, z0); if (R0 < 0.05 * L) continue; for (var w = 0; w < 64; w++) { var f1 = 2 * PI * w / 64, f2 = 2 * PI * (w + 1) / 64; pos.push(R0 * Math.cos(f1), R0 * Math.sin(f1), z0, R0 * Math.cos(f2), R0 * Math.sin(f2), z0); col.push.apply(col, cc2.concat(cc2)); } }
      var gS = new T.BufferGeometry(); gS.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); gS.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      var sup = new T.LineSegments(gS, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
      sup.name = 'superficie'; sup.visible = mostra.superficie; gr.add(sup);
      /* la superficie di vetro: il contorno ruotato in 72 spicchi, normali dal gradiente vero di |ψ|² */
      var NV = [40, 72, 120][Q], vp = [], vn = [], vc = [];
      seg.forEach(function (sg) {
        var g0 = gradienteRZ(o, sg[0][0], sg[0][1]), g1 = gradienteRZ(o, sg[1][0], sg[1][1]), l0 = Math.hypot(g0[0], g0[1]) || 1, l1 = Math.hypot(g1[0], g1[1]) || 1, c0 = colorePolare(sg[0][0], sg[0][1]), c1 = colorePolare(sg[1][0], sg[1][1]);
        for (var w2 = 0; w2 < NV; w2++) {
          var fa = 2 * PI * w2 / NV, fb = 2 * PI * (w2 + 1) / NV, P = [[sg[0], fa, g0, l0, c0], [sg[1], fa, g1, l1, c1], [sg[1], fb, g1, l1, c1], [sg[0], fb, g0, l0, c0]];
          [0, 1, 2, 0, 2, 3].forEach(function (k3) { var q3 = P[k3], R3 = q3[0][0], z3 = q3[0][1], cf3 = Math.cos(q3[1]), sf3 = Math.sin(q3[1]); vp.push(R3 * cf3, R3 * sf3, z3); vn.push(-q3[2][0] / q3[3] * cf3, -q3[2][0] / q3[3] * sf3, -q3[2][1] / q3[3]); vc.push(q3[4][0], q3[4][1], q3[4][2]); });
        }
      });
      var gV = new T.BufferGeometry(); gV.setAttribute('position', new T.Float32BufferAttribute(vp, 3)); gV.setAttribute('normal', new T.Float32BufferAttribute(vn, 3)); gV.setAttribute('color', new T.Float32BufferAttribute(vc, 3));
      var vetroM = new T.Mesh(gV, vetro(T, 0x6fd6ff, 0.32)); vetroM.name = 'vetro'; sup.add(vetroM); stato.parti.superficie = sup;
      /* 2. le scie della corrente */
      var NS = [400, 1000, 2400][Q], pts = O().campiona({ n: o.n, l: o.l, m: o.m, reale: false, Z: o.Z || 1 }, NS, 17), LT = 16;
      var particelle = pts.map(function (p) { var R = Math.hypot(p[0], p[1]); return { R: Math.max(R, 0.08 * L), z: p[2], phi: Math.atan2(p[1], p[0]) }; });
      var sp = new Float32Array(NS * (LT - 1) * 6), sc = new Float32Array(NS * (LT - 1) * 6), gT = new T.BufferGeometry();
      gT.setAttribute('position', new T.BufferAttribute(sp, 3)); gT.setAttribute('color', new T.BufferAttribute(sc, 3));
      var tp = new Float32Array(NS * 3), gTe = new T.BufferGeometry(); gTe.setAttribute('position', new T.BufferAttribute(tp, 3));
      var teste = new T.Points(gTe, new T.PointsMaterial({ size: L * 0.05, map: luce(T), color: 0xbff4ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.9 }));
      var scie = new T.LineSegments(gT, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); scie.name = 'scie'; scie.add(teste); scie.visible = mostra.scie; gr.add(scie); stato.parti.scie = scie;
      var K = 6.0 * L / Math.max(1, Math.abs(o.m));                       /* esagerazione: scie lunghe una frazione di giro */
      function aggiornaScie() {
        var p = 0;
        particelle.forEach(function (s, ip) {
          tp[ip * 3] = s.R * Math.cos(s.phi); tp[ip * 3 + 1] = s.R * Math.sin(s.phi); tp[ip * 3 + 2] = s.z;
          var om = o.m / (s.R * s.R) * K, arco = Math.max(-2.2, Math.min(2.2, om * 0.7)), lungo = o.m ? arco : 0.02;
          for (var j = 0; j < LT - 1; j++) {
            var f1 = s.phi - lungo * j / (LT - 1), f2 = s.phi - lungo * (j + 1) / (LT - 1), a1 = 1 - j / (LT - 1), a2 = 1 - (j + 1) / (LT - 1);
            sp[p] = s.R * Math.cos(f1); sp[p + 1] = s.R * Math.sin(f1); sp[p + 2] = s.z; sp[p + 3] = s.R * Math.cos(f2); sp[p + 4] = s.R * Math.sin(f2); sp[p + 5] = s.z;
            sc[p] = 0.42 * a1; sc[p + 1] = 0.62 * a1; sc[p + 2] = 0.68 * a1; sc[p + 3] = 0.42 * a2; sc[p + 4] = 0.62 * a2; sc[p + 5] = 0.68 * a2; p += 6;
          }
        });
        gT.attributes.position.needsUpdate = true; gT.attributes.color.needsUpdate = true; gTe.attributes.position.needsUpdate = true;
      }
      aggiornaScie();
      /* 3. l'onda di fase sul piano della densità massima */
      var PM = pianoMassimo(o), NRf = [50, 80, 120][Q], NFf = [160, 240, 360][Q], Rmax = Math.min(L * 1.15, PM.rho * 2.4 + 2), ampiezza = L * 0.12, posF = new Float32Array((NRf + 1) * (NFf + 1) * 3), colF = new Float32Array((NRf + 1) * (NFf + 1) * 3), idx = [], base = [];
      var maxA = 0; for (var i2 = 0; i2 <= NRf; i2++) for (var j2 = 0; j2 <= NFf; j2++) { var Rr = Rmax * i2 / NRf, ff = 2 * PI * j2 / NFf, ps = O().psi({ n: o.n, l: o.l, m: o.m, reale: false, Z: o.Z || 1 }, Rr * Math.cos(ff), Rr * Math.sin(ff), PM.z); base.push(ps); maxA = Math.max(maxA, Math.hypot(ps.re, ps.im)); }
      for (var i3 = 0; i3 < NRf; i3++) for (var j3 = 0; j3 < NFf; j3++) { var a0 = i3 * (NFf + 1) + j3; idx.push(a0, a0 + NFf + 1, a0 + 1, a0 + 1, a0 + NFf + 1, a0 + NFf + 2); }
      var gF = new T.BufferGeometry(); gF.setAttribute('position', new T.BufferAttribute(posF, 3)); gF.setAttribute('color', new T.BufferAttribute(colF, 3)); gF.setIndex(idx);
      var fogli = new T.Group(), foglio = new T.Mesh(gF, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
      var li = []; for (var i5 = 0; i5 <= NRf; i5 += 8) for (var j5 = 0; j5 < NFf; j5++) { var a5 = i5 * (NFf + 1) + j5; li.push(a5, a5 + 1); }
      for (var j6 = 0; j6 < NFf; j6 += 12) for (var i6 = 0; i6 < NRf; i6++) { var a6 = i6 * (NFf + 1) + j6; li.push(a6, a6 + NFf + 1); }
      var gR = new T.BufferGeometry(); gR.setAttribute('position', gF.attributes.position); gR.setIndex(li);   /* stessi vertici del foglio: si muove con lui */
      var rete = new T.LineSegments(gR, new T.LineBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false }));
      fogli.add(foglio); fogli.add(rete); fogli.visible = mostra.fase; gr.add(fogli); stato.parti.fase = fogli;
      function aggiornaFoglio(fase) {
        var c0 = Math.cos(fase), s0 = Math.sin(fase);
        for (var q2 = 0; q2 < base.length; q2++) {
          var i4 = Math.floor(q2 / (NFf + 1)), j4 = q2 % (NFf + 1), Rr = Rmax * i4 / NRf, ff = 2 * PI * j4 / NFf, b2 = base[q2], re = b2.re * c0 + b2.im * s0, im = b2.im * c0 - b2.re * s0;   /* ψ·e^(−iEt/ħ), fase = Et/ħ */
          posF[q2 * 3] = Rr * Math.cos(ff); posF[q2 * 3 + 1] = Rr * Math.sin(ff); posF[q2 * 3 + 2] = PM.z + ampiezza * re / (maxA || 1);
          var cc3 = hsl(Math.atan2(im, re) / (2 * PI), 0.85, 0.55), mod = Math.min(1, 0.12 + 0.75 * Math.pow(Math.hypot(re, im) / (maxA || 1), 1.5));
          colF[q2 * 3] = cc3[0] * mod; colF[q2 * 3 + 1] = cc3[1] * mod; colF[q2 * 3 + 2] = cc3[2] * mod;
        }
        gF.attributes.position.needsUpdate = true; gF.attributes.color.needsUpdate = true;
      }
      aggiornaFoglio(0);
      /* 4. l'anello di de Broglie */
      var ac = Math.abs(o.m), anello = new T.Group(), NA = 360, pA = new Float32Array((NA + 1) * 3), gA = new T.BufferGeometry(); gA.setAttribute('position', new T.BufferAttribute(pA, 3));
      anello.add(new T.Line(gA, new T.LineBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.95 })));
      var cerchio = []; for (var u = 0; u <= 128; u++) cerchio.push(new T.Vector3(PM.rho * Math.cos(2 * PI * u / 128), PM.rho * Math.sin(2 * PI * u / 128), PM.z));
      anello.add(new T.Line(new T.BufferGeometry().setFromPoints(cerchio), new T.LineBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.3 })));
      if (ac) { var et = globale.BSILab3D.testo3d(T, '2πρ = ' + ac + 'λ', '#ffd24a', L * 0.07); et.position.set(PM.rho * 0.72, -PM.rho * 0.72, PM.z + L * 0.12); anello.add(et); }
      function aggiornaAnello(fase) { for (var u2 = 0; u2 <= NA; u2++) { var ff2 = 2 * PI * u2 / NA, rr = PM.rho + (ac ? L * 0.045 * Math.cos(o.m * ff2 - fase) : L * 0.045 * Math.cos(fase)); pA[u2 * 3] = rr * Math.cos(ff2); pA[u2 * 3 + 1] = rr * Math.sin(ff2); pA[u2 * 3 + 2] = PM.z; } gA.attributes.position.needsUpdate = true; }
      aggiornaAnello(0); anello.visible = mostra.anello && ac > 0; gr.add(anello); stato.parti.anello = anello;
      stato.aggiorna = function (dt) {
        tempo += dt; var fase = tempo * 1.6 * 4 / (o.n * o.n);   /* ω ∝ |E_n| ∝ 1/n²: il rapporto fra i livelli è quello vero */
        if (o.m) particelle.forEach(function (s) { s.phi += o.m / (s.R * s.R) * K * dt * 0.25; });
        aggiornaScie(); aggiornaFoglio(fase); aggiornaAnello(fase);
      };
      S.inquadra(L * 2.6, 0.6, 1.15); S.gira = !ferma;
      S.didascalia.textContent = O().nome({ n: o.n, l: o.l, m: o.m, reale: false }) + ' · ' + t('reticolo al 90 %, scie di J, onda di fase', '90 % wireframe, J streaks, phase wave') + ' · ' + t('velocità esagerata', 'exaggerated speed');
    }
    var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.appendChild(attesa);
    if (!globale.document.getElementById('bsiOC-stile')) { var st = globale.document.createElement('style'); st.id = 'bsiOC-stile'; st.textContent = '.bsiOC-formule{position:absolute;left:10px;right:44px;top:8px;pointer-events:none;font:13px/1.55 "Latin Modern Roman","Cambria Math",Georgia,serif;color:#e8eef6;text-shadow:0 1px 3px #000;z-index:2}.bsiOC-formule .bsiOC-titolo{font-size:15px;margin-bottom:3px}.bsiOC-formule b{font-weight:700}@media(max-width:600px){.bsiOC-formule{font-size:11px;right:8px;top:40px}.bsiOC-formule .bsiOC-titolo{font-size:12.5px}}'; globale.document.head.appendChild(st); }
    testo();
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
    L3.stile(); L3.caricaThree().then(function () {
      attesa.remove(); S = new L3.Scena(dx, 0.95); dx.insertBefore(S.box, dx.firstChild); T = globale.THREE; S.ren.setClearColor(0x03070d, 1); S.cinema({ forza: 0.55, soglia: 0.68 });
      if (getComputedStyle(S.box).position === 'static') S.box.style.position = 'relative';
      S.box.appendChild(formule);
      setTimeout(function () { costruisci(); S.ogniFotogramma(function (dt) { if (ferma || !stato || !stato.aggiorna) return false; stato.aggiorna(dt); return true; }); }, 0);
    }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
  }
  F.schedeExtra = F.schedeExtra || {};
  F.schedeExtra.orbitaliCinema = scheda;
})(typeof window !== 'undefined' ? window : globalThis);
