/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-esopianeti.js — 🌍 Esopianeti 3D
   BioSpecInfo · © Samuele Pio Provenzano

   I pianeti di altre stelle e i quattro modi in cui li troviamo, in 3D:

   · IL SISTEMA E LA ZONA ABITABILE: una stella di sequenza principale di
     massa scelta (luminosita' dalla relazione massa-luminosita', raggio,
     temperatura efficace e colore di corpo nero), la zona abitabile come
     anello verde traslucido tra i flussi 1,1 S⊕ (effetto serra
     galoppante) e 0,36 S⊕ (massimo effetto serra), d = √(L/S); il pianeta
     sulla sua ellisse di Keplero, la temperatura di equilibrio
     T_eq = 278,6 K · L^¼ (1 − A)^¼ / √d.
   · IL TRANSITO: la stella con l'oscuramento al bordo quadratico
     I(μ) = 1 − u₁(1 − μ) − u₂(1 − μ)² disegnato nello shader, la linea di
     vista dell'osservatore e la curva di luce calcolata integrando sugli
     anelli del disco l'arco coperto dal pianeta; profondita' ≈ (R_p/R_s)²,
     durata T₁₄ = (P/π) arcsin[(R_s/a)√((1+k)² − b²)/sin i].
   · LA VELOCITA' RADIALE: la stella che oscilla attorno al baricentro, la
     curva v_r = K[cos(ν + ω) + e cos ω] con
     K = (2πG/P)^⅓ m_p sin i /(M_s + m_p)^⅔ /√(1 − e²): 12,5 m/s per Giove
     attorno al Sole, 0,09 m/s per la Terra.
   · IMMAGINE DIRETTA E ASTROMETRIA: il contrasto in luce riflessa
     A_g(R_p/a)², l'oscillazione astrometrica (m_p/M_s)·a/d sovrapposta alla
     parallasse e al moto proprio (la traccia che misura Gaia), e un
     diagramma massa-periodo di una popolazione illustrativa.

   I calcoli (F.calcolo.esopianeti) sono funzioni pure: il banco li prova
   in node contro forme chiuse e integrazioni numeriche indipendenti.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;

  var G = 6.67430e-11, MSOLE = 1.98847e30, RSOLE = 6.957e8, UA = 1.495978707e11, MGIOVE = 1.89813e27, RGIOVE = 7.1492e7, MTERRA = 5.9722e24, RTERRA = 6.3781e6, GIORNO = 86400, ANNO = 365.25 * 86400, PC = 3.0856775814913673e16, TSOLE = 5772;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rnd) { var u = rnd() || 1e-12, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ═══ la stella ═══════════════════════════════════════════════════════ */
  /* relazioni empiriche di sequenza principale (unita' solari) */
  function stella(M) {
    var L = M < 0.43 ? 0.23 * Math.pow(M, 2.3) : M < 2 ? Math.pow(M, 4) : M < 55 ? 1.4 * Math.pow(M, 3.5) : 32000 * M;
    var R = M < 1 ? Math.pow(M, 0.8) : Math.pow(M, 0.57), T = TSOLE * Math.pow(L / (R * R), 0.25);
    var cl = T > 30000 ? 'O' : T > 10000 ? 'B' : T > 7500 ? 'A' : T > 6000 ? 'F' : T > 5200 ? 'G' : T > 3700 ? 'K' : 'M';
    return { M: M, L: L, R: R, T: T, classe: cl };
  }
  /* zona abitabile da due flussi limite (in unita' del flusso che riceve la Terra) */
  function zonaAbitabile(L, Sin, Sout) { return { interno: Math.sqrt(L / (Sin || 1.1)), esterno: Math.sqrt(L / (Sout || 0.36)) }; }
  function flusso(L, d) { return L / (d * d); }
  function tEquilibrio(L, d, A) { return 278.6 * Math.pow(L, 0.25) * Math.pow(1 - (A || 0), 0.25) / Math.sqrt(d); }
  function periodo(aUA, Msole, mpKg) { return Math.sqrt(aUA * aUA * aUA / (Msole + (mpKg || 0) / MSOLE)); } /* anni */

  /* ═══ Keplero ═════════════════════════════════════════════════════════ */
  function kepler(M, e) { var E = e < 0.8 ? M : Math.PI; for (var k = 0; k < 50; k++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-14) break; } return E; }
  function anomaliaVera(M, e) { var E = kepler(M, e); return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)); }
  /* posizione relativa nel piano dell'orbita (unita' di a) al tempo t (frazione di periodo dal pericentro) */
  function posizioneOrbita(fase, e) { var M = 2 * Math.PI * fase, E = kepler(M, e); return [Math.cos(E) - e, Math.sqrt(1 - e * e) * Math.sin(E)]; }

  /* ═══ transito ════════════════════════════════════════════════════════ */
  function intensita(mu, u1, u2) { var x = 1 - mu; return 1 - u1 * x - u2 * x * x; }
  /* flusso normalizzato con il pianeta (raggio p in unita' di R_s) a distanza proiettata z dal centro:
     si integra sugli anelli r del disco l'arco 2α(r) coperto dal pianeta */
  function flussoTransito(z, p, u1, u2, n) {
    u1 = u1 || 0; u2 = u2 || 0; n = n || 800;
    if (z >= 1 + p) return 1;
    var tot = Math.PI * (1 - u1 / 3 - u2 / 6), a = Math.max(0, z - p), b = Math.min(1, z + p), h = (b - a) / n, bloc = 0;
    for (var i = 0; i < n; i++) {
      var r = a + (i + 0.5) * h, mu = Math.sqrt(Math.max(0, 1 - r * r)), al;
      if (r <= p - z) al = Math.PI;
      else { var c = (r * r + z * z - p * p) / (2 * r * z); al = c >= 1 ? 0 : c <= -1 ? Math.PI : Math.acos(c); }
      bloc += intensita(mu, u1, u2) * 2 * r * al * h;
    }
    return 1 - bloc / tot;
  }
  /* area di sovrapposizione di due cerchi (raggi 1 e p, distanza z): forma chiusa della «lente» */
  function areaSovrapposizione(z, p) {
    if (z >= 1 + p) return 0;
    if (z <= Math.abs(1 - p)) return Math.PI * Math.min(1, p) * Math.min(1, p);
    var k0 = Math.acos((p * p + z * z - 1) / (2 * p * z)), k1 = Math.acos((1 - p * p + z * z) / (2 * z));
    return p * p * k0 + k1 - 0.5 * Math.sqrt(Math.max(0, 4 * z * z - Math.pow(1 + z * z - p * p, 2)));
  }
  /* durata totale (primo-quarto contatto) di un'orbita circolare, Seager & Mallen-Ornelas / Winn */
  function durataT14(P, aRs, k, iGradi) {
    var i = iGradi * Math.PI / 180, b = aRs * Math.cos(i), arg = Math.sqrt(Math.max(0, (1 + k) * (1 + k) - b * b)) / (aRs * Math.sin(i));
    return arg > 0 ? P / Math.PI * Math.asin(Math.min(1, arg)) : 0;
  }
  function durataT23(P, aRs, k, iGradi) {
    var i = iGradi * Math.PI / 180, b = aRs * Math.cos(i), q = (1 - k) * (1 - k) - b * b;
    return q > 0 ? P / Math.PI * Math.asin(Math.min(1, Math.sqrt(q) / (aRs * Math.sin(i)))) : 0;
  }
  function parametroImpatto(aRs, iGradi) { return aRs * Math.cos(iGradi * Math.PI / 180); }
  /* separazione proiettata (unita' di R_s) alla fase φ (0 = congiunzione), orbita circolare */
  function separazione(phi, aRs, iGradi) { var i = iGradi * Math.PI / 180; return aRs * Math.sqrt(Math.pow(Math.sin(phi), 2) + Math.pow(Math.cos(i) * Math.cos(phi), 2)); }
  /* T14 numerica: la fase in cui il pianeta tocca il bordo, trovata per bisezione sulla corda */
  function durataNumerica(P, aRs, k, iGradi) {
    if (separazione(0, aRs, iGradi) >= 1 + k) return 0;
    var a = 0, b = Math.PI / 2; for (var j = 0; j < 100; j++) { var m = 0.5 * (a + b); if (separazione(m, aRs, iGradi) < 1 + k) a = m; else b = m; }
    return 2 * 0.5 * (a + b) / (2 * Math.PI) * P;
  }
  function curvaLuce(P, aRs, k, iGradi, u1, u2, n) {
    var T14 = durataT14(P, aRs, k, iGradi) || P * 0.05, xs = [], ys = [], N = n || 240, span = Math.max(T14 * 1.6, P * 0.01);
    for (var j = 0; j <= N; j++) { var tt = -span / 2 + span * j / N, phi = 2 * Math.PI * tt / P, z = separazione(phi, aRs, iGradi); xs.push(tt); ys.push(Math.cos(phi) > 0 ? flussoTransito(z, k, u1, u2, 300) : 1); }
    return { t: xs, f: ys, T14: T14 };
  }

  /* ═══ velocita' radiale ═══════════════════════════════════════════════ */
  /* semiampiezza K (m/s): P in giorni, masse in kg */
  function semiampiezzaK(Pgiorni, mp, Ms, e, iGradi) {
    var P = Pgiorni * GIORNO, si = Math.sin((iGradi == null ? 90 : iGradi) * Math.PI / 180);
    return Math.pow(2 * Math.PI * G / P, 1 / 3) * mp * si / Math.pow(Ms + mp, 2 / 3) / Math.sqrt(1 - (e || 0) * (e || 0));
  }
  function velocitaRadiale(fase, K, e, wGradi) { var nu = anomaliaVera(2 * Math.PI * fase, e), w = wGradi * Math.PI / 180; return K * (Math.cos(nu + w) + e * Math.cos(w)); }
  /* secondo metodo: posizione della stella lungo la linea di vista dall'orbita di Keplero e derivata numerica */
  function vrNumerica(fase, Pgiorni, mp, Ms, e, wGradi, iGradi) {
    var P = Pgiorni * GIORNO, a = Math.cbrt(G * (Ms + mp) * P * P / (4 * Math.PI * Math.PI)), w = wGradi * Math.PI / 180, si = Math.sin(iGradi * Math.PI / 180);
    function z(f) { var p = posizioneOrbita(f, e), r = a * Math.hypot(p[0], p[1]), nu = Math.atan2(p[1], p[0]); return -mp / (Ms + mp) * r * Math.sin(nu + w) * si; }
    var h = 1e-6; return -(z(fase + h) - z(fase - h)) / (2 * h * P);
  }

  /* ═══ astrometria e immagine diretta ═══════════════════════════════════ */
  function oscillazioneAstrometrica(mp, Ms, aUA, dpc) { return mp / Ms * aUA / dpc; } /* secondi d'arco */
  function contrasto(Ag, Rp, aUA) { return Ag * Math.pow(Rp / (aUA * UA), 2); }
  function separazioneAngolare(aUA, dpc) { return aUA / dpc; } /* secondi d'arco */
  /* traccia sul cielo (mas): moto proprio + parallasse (stella all'eclittica, semplificata) + oscillazione del pianeta */
  function tracciaCielo(anni, n, dpc, mu, mp, Ms, aUA, PAnni, conPianeta) {
    var out = { x: [], y: [] }, par = 1000 / dpc, wob = conPianeta ? oscillazioneAstrometrica(mp, Ms, aUA, dpc) * 1000 : 0;
    for (var j = 0; j <= n; j++) {
      var tt = anni * j / n, ph = 2 * Math.PI * tt, q = 2 * Math.PI * tt / PAnni;
      out.x.push(mu[0] * tt + par * Math.cos(ph) + wob * Math.cos(q)); out.y.push(mu[1] * tt + 0.45 * par * Math.sin(ph) + wob * Math.sin(q) * 0.6);
    }
    return out;
  }
  /* popolazione illustrativa (non un catalogo): gruppi riconoscibili del diagramma massa-periodo */
  function popolazione(seme) {
    var rnd = mulberry32(seme || 2024), out = [];
    function agg(n, f) { for (var i = 0; i < n; i++) out.push(f()); }
    agg(110, function () { return { P: Math.pow(10, Math.log10(3.5) + 0.15 * gauss(rnd)), M: 317.8 * Math.pow(10, 0.35 * gauss(rnd)), met: 'transito' }; });
    agg(180, function () { return { P: Math.pow(10, 1.3 + 2.5 * rnd()), M: 317.8 * Math.pow(10, 0.2 + 0.45 * gauss(rnd)), met: 'vr' }; });
    agg(420, function () { return { P: Math.pow(10, 1.1 + 0.45 * gauss(rnd)), M: Math.pow(10, 0.8 + 0.35 * gauss(rnd)), met: 'transito' }; });
    agg(70, function () { return { P: Math.pow(10, 0.9 + 0.5 * gauss(rnd)), M: Math.pow(10, 1.1 + 0.3 * gauss(rnd)), met: 'vr' }; });
    agg(22, function () { var a = Math.pow(10, 1 + 1.2 * rnd()); return { P: Math.pow(a, 1.5) / Math.sqrt(1.5) * 365.25, M: 317.8 * (2 + 11 * rnd()), met: 'immagine' }; });
    agg(55, function () { var a = 1 + 5 * rnd(); return { P: Math.pow(a, 1.5) / Math.sqrt(0.4) * 365.25, M: 317.8 * Math.pow(10, -2 + 2.7 * rnd()), met: 'microlente' }; });
    return out;
  }
  var SISTEMA_SOLARE = [['Mercurio', 'Mercury', 87.97, 0.0553], ['Venere', 'Venus', 224.70, 0.815], ['Terra', 'Earth', 365.256, 1], ['Marte', 'Mars', 686.98, 0.107], ['Giove', 'Jupiter', 4332.6, 317.8], ['Saturno', 'Saturn', 10759, 95.2], ['Urano', 'Uranus', 30687, 14.5], ['Nettuno', 'Neptune', 60190, 17.1]];

  F.calcolo.esopianeti = {
    costanti: { G: G, MSOLE: MSOLE, RSOLE: RSOLE, UA: UA, MGIOVE: MGIOVE, RGIOVE: RGIOVE, MTERRA: MTERRA, RTERRA: RTERRA },
    stella: stella, zonaAbitabile: zonaAbitabile, flusso: flusso, tEquilibrio: tEquilibrio, periodo: periodo, kepler: kepler, anomaliaVera: anomaliaVera, posizioneOrbita: posizioneOrbita,
    intensita: intensita, flussoTransito: flussoTransito, areaSovrapposizione: areaSovrapposizione, durataT14: durataT14, durataT23: durataT23, durataNumerica: durataNumerica, parametroImpatto: parametroImpatto, separazione: separazione, curvaLuce: curvaLuce,
    semiampiezzaK: semiampiezzaK, velocitaRadiale: velocitaRadiale, vrNumerica: vrNumerica,
    oscillazioneAstrometrica: oscillazioneAstrometrica, contrasto: contrasto, separazioneAngolare: separazioneAngolare, tracciaCielo: tracciaCielo, popolazione: popolazione, SISTEMA_SOLARE: SISTEMA_SOLARE
  };

  /* ═══ grafica ══════════════════════════════════════════════════════════ */
  function L3() { return globale.BSILab3D; }
  function scheda(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var lab = L3();
      if (!lab) { pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serve il Laboratorio 3D (bsi-lab3d.js).', 'The 3D Laboratory (bsi-lab3d.js) is required.') })); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); destra.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () {
        attesa.remove();
        var S = new lab.Scena(destra, 0.62);
        S.cam.far = 4000; S.cam.updateProjectionMatrix();
        S.ren.setClearColor(0x02050b, 1);
        S.sc.children.forEach(function (o) { if (o.isHemisphereLight) o.intensity = 0.12; else if (o.isDirectionalLight) o.intensity = 0.05; });
        div._scena = S;
        costruisci(pan, S, destra);
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function casella(pan, etichetta, valore, cambia) {
    var c = F.el('input', { type: 'checkbox' }); c.checked = !!valore;
    var l = F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(etichetta) })]);
    c.addEventListener('change', function () { cambia(c.checked); }); pan.appendChild(l); return c;
  }
  function controlliTempo(pan, st) {
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli del tempo', 'Time controls') });
    var bp = F.el('button', { type: 'button' });
    function agg() { bp.textContent = st.pausa ? '▶' : '❚❚'; var n = st.pausa ? t('Avvia', 'Play') : t('Pausa', 'Pause'); bp.title = n; bp.setAttribute('aria-label', n); }
    bp.addEventListener('click', function () { st.pausa = !st.pausa; agg(); if (st.sveglia) st.sveglia(); });
    riga.appendChild(bp); agg();
    var vel = [];
    [0.25, 0.5, 1, 2, 4].forEach(function (v) {
      var b = F.el('button', { type: 'button', testo: '×' + (v === 0.25 ? '¼' : v === 0.5 ? '½' : v), title: t('Velocità ', 'Speed ') + v, 'aria-label': t('Velocità ', 'Speed ') + v, onclick: function () { st.vel = v; vel.forEach(function (x) { x[1].setAttribute('aria-pressed', String(x[0] === v)); }); } });
      b.setAttribute('aria-pressed', String(v === (st.vel || 1))); vel.push([v, b]); riga.appendChild(b);
    });
    pan.appendChild(riga);
  }
  var bagliore = null;
  function texBagliore(T) {
    if (bagliore) return bagliore;
    var c = globale.document.createElement('canvas'); c.width = c.height = 64;
    var q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.5)'); gr.addColorStop(0.6, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = gr; q.fillRect(0, 0, 64, 64);
    bagliore = new T.CanvasTexture(c); return bagliore;
  }
  /* colore di corpo nero (Tanner Helland) */
  function coloreT(T) {
    var x = Math.max(1000, Math.min(40000, T)) / 100, r, g, b;
    r = x <= 66 ? 255 : 329.7 * Math.pow(x - 60, -0.1332);
    g = x <= 66 ? 99.47 * Math.log(x) - 161.1 : 288.1 * Math.pow(x - 60, -0.0755);
    b = x >= 66 ? 255 : x <= 19 ? 0 : 138.5 * Math.log(x - 10) - 305.0;
    return [Math.max(0, Math.min(255, r)) / 255, Math.max(0, Math.min(255, g)) / 255, Math.max(0, Math.min(255, b)) / 255];
  }
  /* la stella: oscuramento al bordo e granulazione nello shader (μ = cos dell'angolo tra normale e vista) */
  function stella3D(T, raggio, Teff, u1, u2) {
    var c = coloreT(Teff), g = new T.Group();
    var mat = new T.ShaderMaterial({
      uniforms: { uCol: { value: new T.Color(c[0], c[1], c[2]) }, uU1: { value: u1 == null ? 0.45 : u1 }, uU2: { value: u2 == null ? 0.2 : u2 }, uT: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: [
        'uniform vec3 uCol; uniform float uU1; uniform float uU2; uniform float uT; varying vec3 vN; varying vec3 vV; varying vec3 vP;',
        'float h(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
        'float n3(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f); return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y), mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }',
        'void main(){ float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); float x = 1.0 - mu; float I = 1.0 - uU1*x - uU2*x*x;',
        ' vec3 p = normalize(vP)*9.0; float gr = 0.7*n3(p + vec3(uT*0.3)) + 0.3*n3(p*2.3 - vec3(uT*0.2));',
        ' gl_FragColor = vec4(uCol * I * (0.88 + 0.24*gr) * 1.1, 1.0); }'].join('\n')
    });
    var sf = new T.Mesh(new T.SphereGeometry(raggio, 64, 48), mat); g.add(sf);
    var al = new T.Sprite(new T.SpriteMaterial({ map: texBagliore(T), color: new T.Color(c[0], c[1], c[2]), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.55 })); al.scale.set(raggio * 5, raggio * 5, 1); g.add(al);
    var luce = new T.PointLight(new T.Color(c[0], c[1], c[2]), 1.6, 0, 1); g.add(luce);
    g.userData = { mat: mat, alone: al, luce: luce };
    return g;
  }
  /* tessiture dei pianeti disegnate su tela */
  function tessituraPianeta(tipo, seme) {
    var c = globale.document.createElement('canvas'); c.width = 256; c.height = 128; var q = c.getContext('2d'), rnd = mulberry32(seme || 3);
    if (tipo === 'gas' || tipo === 'caldo') {
      var base = tipo === 'caldo' ? [[120, 50, 40], [180, 90, 60], [90, 35, 30]] : [[214, 186, 150], [180, 140, 100], [235, 220, 195]];
      for (var y = 0; y < 128; y++) { var b = base[Math.floor((Math.sin(y * 0.21 + Math.sin(y * 0.05) * 2) + 1) * 1.49)], k = 0.85 + 0.15 * rnd(); q.fillStyle = 'rgb(' + Math.round(b[0] * k) + ',' + Math.round(b[1] * k) + ',' + Math.round(b[2] * k) + ')'; q.fillRect(0, y, 256, 1); }
      q.fillStyle = tipo === 'caldo' ? 'rgba(255,140,60,.5)' : 'rgba(190,90,60,.7)'; q.beginPath(); q.ellipse(170, 78, 18, 9, 0, 0, 7); q.fill();
    } else if (tipo === 'ghiaccio') {
      var gr = q.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#bfe9f2'); gr.addColorStop(0.5, '#7fc4d8'); gr.addColorStop(1, '#bfe9f2'); q.fillStyle = gr; q.fillRect(0, 0, 256, 128);
      for (var i = 0; i < 40; i++) { q.fillStyle = 'rgba(255,255,255,' + (0.05 + 0.1 * rnd()) + ')'; q.fillRect(0, rnd() * 128, 256, 1 + 3 * rnd()); }
    } else {
      var acqua = tipo === 'oceano';
      q.fillStyle = acqua ? '#1d4f8a' : tipo === 'lava' ? '#3a1d14' : '#8a6a4a'; q.fillRect(0, 0, 256, 128);
      for (i = 0; i < 26; i++) { q.fillStyle = acqua ? 'rgba(70,130,60,.85)' : tipo === 'lava' ? 'rgba(255,120,30,.55)' : 'rgba(120,90,60,.7)'; q.beginPath(); q.ellipse(rnd() * 256, 20 + rnd() * 88, 8 + 26 * rnd(), 5 + 14 * rnd(), rnd() * 3, 0, 7); q.fill(); }
      if (acqua) { q.fillStyle = 'rgba(255,255,255,.9)'; q.fillRect(0, 0, 256, 9); q.fillRect(0, 119, 256, 9); for (i = 0; i < 30; i++) { q.fillStyle = 'rgba(255,255,255,' + (0.2 + 0.3 * rnd()) + ')'; q.beginPath(); q.ellipse(rnd() * 256, rnd() * 128, 10 + 20 * rnd(), 2 + 3 * rnd(), 0, 0, 7); q.fill(); } }
      if (tipo === 'ghiacciato') { q.fillStyle = 'rgba(240,248,255,.75)'; q.fillRect(0, 0, 256, 128); }
    }
    return c;
  }
  function tipoPianeta(RpTerra, Teq) {
    if (RpTerra > 6) return Teq > 1000 ? 'caldo' : 'gas';
    if (RpTerra > 2.5) return 'ghiaccio';
    if (Teq > 700) return 'lava';
    if (Teq > 200 && Teq < 330) return 'oceano';
    if (Teq <= 200) return 'ghiacciato';
    return 'roccia';
  }
  function pianeta3D(T, r, tipo, seme) {
    var tex = new T.CanvasTexture(tessituraPianeta(tipo, seme));
    var m = new T.Mesh(new T.SphereGeometry(r, 40, 28), new T.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0, emissive: tipo === 'lava' || tipo === 'caldo' ? 0x401000 : 0x000000 }));
    m.rotation.x = Math.PI / 2; return m;
  }
  function anello(T, r0, r1, col, opac) {
    var m = new T.Mesh(new T.RingGeometry(r0, r1, 128, 1), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: opac, side: T.DoubleSide, depthWrite: false }));
    return m;
  }
  function ellisse(T, a, e, col, opac, n) { var pts = []; n = n || 160; for (var i = 0; i <= n; i++) { var E = 2 * Math.PI * i / n; pts.push([a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E), 0]); } return L3().linea(T, pts, col, opac); }
  function fondoStelle(T, n, R, seme) {
    var rnd = mulberry32(seme || 9), pos = new Float32Array(3 * n), col = new Float32Array(3 * n);
    for (var i = 0; i < n; i++) { var z = 2 * rnd() - 1, f = 2 * Math.PI * rnd(), s = Math.sqrt(1 - z * z), l = 0.25 + 0.6 * Math.pow(rnd(), 3), c = coloreT(3000 + 9000 * rnd()); pos[3 * i] = R * s * Math.cos(f); pos[3 * i + 1] = R * s * Math.sin(f); pos[3 * i + 2] = R * z; col[3 * i] = c[0] * l; col[3 * i + 1] = c[1] * l; col[3 * i + 2] = c[2] * l; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Points(g, new T.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  }
  var TIPI_STELLA = [[0.15, 'M5 V'], [0.5, 'M0 V'], [0.7, 'K5 V'], [0.85, 'K0 V'], [1.0, t('G2 V (il Sole)', 'G2 V (the Sun)')], [1.3, 'F5 V'], [1.8, 'A5 V'], [2.5, 'A0 V']];

  /* ─── scheda 1: il sistema e la zona abitabile ────────────────────────── */
  function schedaSistema(pan, S, destra) {
    var T = S.T, st = { M: 1, a: 1, e: 0.0167, Rp: 1, A: 0.3, pausa: false, vel: 1, fase: 0.1, rif: true };
    var info = nota(pan);
    var cM;
    F.scelta(pan, ['Tipo di stella', 'Star type'], TIPI_STELLA.map(function (x) { return [String(x[0]), x[1]]; }), '1', function (v) { st.M = +v; cM.value = st.M; cM.dispatchEvent(new Event('input')); costruisci(); });
    cM = F.cursore(pan, ['Massa della stella (M☉)', 'Star mass (M☉)'], 0.1, 3, 0.01, st.M, function (v) { st.M = v; costruisci(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Semiasse maggiore a (UA)', 'Semi-major axis a (AU)'], 0.02, 5, 0.01, st.a, function (v) { st.a = v; costruisci(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Eccentricità e', 'Eccentricity e'], 0, 0.9, 0.01, st.e, function (v) { st.e = v; costruisci(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Raggio del pianeta (R⊕)', 'Planet radius (R⊕)'], 0.3, 15, 0.1, st.Rp, function (v) { st.Rp = v; costruisci(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Albedo di Bond A', 'Bond albedo A'], 0, 0.9, 0.01, st.A, function (v) { st.A = v; costruisci(); }, function (v) { return v.toFixed(2); });
    casella(pan, ['Orbite di Venere, Terra e Marte (scalate)', 'Orbits of Venus, Earth, Mars (scaled)'], st.rif, function (v) { st.rif = v; costruisci(); });
    controlliTempo(pan, st);
    nota(pan, t('La <b>zona abitabile</b> è l’intervallo di distanze in cui un pianeta roccioso con atmosfera di CO₂-H₂O potrebbe avere acqua liquida in superficie. Qui il bordo interno è il flusso 1,1 S⊕ (oltre, l’effetto serra «galoppante» fa evaporare gli oceani) e quello esterno 0,36 S⊕ (massimo effetto serra: più lontano neanche tanta CO₂ basta), con S = L/d² in unità del flusso che riceve la Terra: d = √(L/S). Per il Sole: 0,95–1,67 UA. Kopparapu et al. (2013) fanno dipendere i flussi limite anche da T_eff, perché le stelle rosse emettono nel vicino infrarosso, assorbito meglio. La stella segue le relazioni di sequenza principale L ∝ M⁴ (M ∝ M^2,3 sotto 0,43 M☉, M^3,5 sopra 2 M☉), R ∝ M^0,8 o M^0,57, T_eff = 5772 K·(L/R²)^¼. La temperatura di equilibrio T_eq = 278,6 K·L^¼(1 − A)^¼/√d è senza effetto serra: la Terra ha T_eq ≈ 255 K ma in superficie 288 K. Attorno alle nane M la zona abitabile è così vicina che il pianeta è quasi certamente in rotazione sincrona e immerso nei brillamenti.', 'The <b>habitable zone</b> is the range of distances at which a rocky planet with a CO₂-H₂O atmosphere could have liquid surface water. Here the inner edge is the flux 1.1 S⊕ (beyond it a runaway greenhouse boils the oceans) and the outer edge 0.36 S⊕ (maximum greenhouse: farther away even lots of CO₂ is not enough), with S = L/d² in units of the flux received by Earth: d = √(L/S). For the Sun: 0.95–1.67 AU. Kopparapu et al. (2013) also make the limiting fluxes depend on T_eff, since red stars emit in the near infrared, which is absorbed better. The star follows the main-sequence relations L ∝ M⁴ (M^2.3 below 0.43 M☉, M^3.5 above 2 M☉), R ∝ M^0.8 or M^0.57, T_eff = 5772 K·(L/R²)^¼. The equilibrium temperature T_eq = 278.6 K·L^¼(1 − A)^¼/√d ignores the greenhouse effect: Earth has T_eq ≈ 255 K but 288 K at the surface. Around M dwarfs the habitable zone is so close that the planet is almost surely tidally locked and bathed in flares.'));
    var cv = F.tela(destra, 0.42);
    S.sc.add(fondoStelle(T, 2000, 900, 4));
    var stl = null, pl = null, K = 1, sc = 1, s0 = null, zaGr = null;
    function costruisci() {
      S.pulisci();
      s0 = stella(st.M); var za = zonaAbitabile(s0.L), P = periodo(st.a, st.M);
      sc = 9 / Math.max(za.esterno * 1.15, st.a * (1 + st.e) * 1.1);
      var rS = Math.max(0.35, Math.min(1.2, s0.R * 0.55));
      stl = stella3D(T, rS, s0.T); S.aggiungi(stl);
      zaGr = new T.Group();
      zaGr.add(anello(T, za.interno * sc, za.esterno * sc, 0x3ddc84, 0.16));
      zaGr.add(ellisse(T, za.interno * sc, 0, 0x3ddc84, 0.55)); zaGr.add(ellisse(T, za.esterno * sc, 0, 0x3ddc84, 0.55));
      S.aggiungi(zaGr);
      var et = L3().testo3d(T, t('zona abitabile', 'habitable zone'), '#3ddc84', 0.45); et.position.set(0, -(za.interno + za.esterno) / 2 * sc, 0.35); S.aggiungi(et);
      if (st.rif) [[0.723, 0.0068, t('Venere', 'Venus')], [1, 0.0167, t('Terra', 'Earth')], [1.524, 0.0934, t('Marte', 'Mars')]].forEach(function (o) { var d = o[0] * Math.sqrt(s0.L); if (d * sc > 11) return; var L = ellisse(T, d, o[1], 0x8494a8, 0.35); L.scale.set(sc, sc, sc); S.aggiungi(L); var e2 = L3().testo3d(T, o[2] + ' ×√L', '#8494a8', 0.3); e2.position.set(d * sc * 0.72, d * sc * 0.72, 0.2); S.aggiungi(e2); });
      var orb = ellisse(T, st.a * sc, st.e, 0xffd24a, 0.7); S.aggiungi(orb);
      var Teq = tEquilibrio(s0.L, st.a, st.A), tipo = tipoPianeta(st.Rp, Teq);
      pl = pianeta3D(T, Math.max(0.12, Math.min(0.55, 0.11 * Math.sqrt(st.Rp))), tipo, 7); S.aggiungi(pl);
      var Fp = flusso(s0.L, st.a), Fper = flusso(s0.L, st.a * (1 - st.e)), Fapo = flusso(s0.L, st.a * (1 + st.e)), dentro = st.a >= za.interno && st.a <= za.esterno;
      info.innerHTML = t('Stella ', 'Star ') + '<b>' + s0.classe + '</b>: L = ' + fmt(s0.L) + ' L☉, R = ' + fmt(s0.R) + ' R☉, T_eff = ' + Math.round(s0.T) + ' K<br>' + t('Zona abitabile: ', 'Habitable zone: ') + '<b>' + za.interno.toFixed(3) + '–' + za.esterno.toFixed(3) + ' UA</b><br>' + t('Pianeta: P = ', 'Planet: P = ') + (P < 0.1 ? (P * 365.25).toFixed(2) + t(' giorni', ' days') : P.toFixed(3) + t(' anni', ' yr')) + ', S = ' + fmt(Fp) + ' S⊕ (' + fmt(Fper) + '–' + fmt(Fapo) + '), T_eq = <b>' + Math.round(Teq) + ' K</b> → ' + ({ caldo: t('gioviano caldo', 'hot Jupiter'), gas: t('gigante gassoso', 'gas giant'), ghiaccio: t('sub-nettuniano', 'sub-Neptune'), lava: t('mondo di lava', 'lava world'), oceano: t('mondo temperato (acqua possibile)', 'temperate world (water possible)'), ghiacciato: t('mondo ghiacciato', 'frozen world'), roccia: t('roccioso caldo', 'hot rocky world') })[tipo] + (dentro ? t(' — nella zona abitabile', ' — inside the habitable zone') : '');
      S.didascalia.textContent = t('Sistema planetario attorno a una stella ', 'Planetary system around a ') + s0.classe + t(' con la zona abitabile', ' star with the habitable zone');
      K = P; grafico(za);
      posa();
    }
    function posa() { var p = posizioneOrbita(st.fase, st.e); if (pl) pl.position.set(p[0] * st.a * sc, p[1] * st.a * sc, 0); }
    function grafico(za) {
      /* T_eq lungo l'orbita e i limiti della zona abitabile in funzione della massa stellare */
      var ms = [], zi = [], ze = [], ap = [];
      for (var m = 0.1; m <= 3.001; m += 0.02) { var s = stella(m), z = zonaAbitabile(s.L); ms.push(m); zi.push(Math.log10(z.interno)); ze.push(Math.log10(z.esterno)); ap.push(NaN); }
      F.grafico(cv, { serie: [{ x: ms, y: zi, col: '#3ddc84', etich: ['bordo interno', 'inner edge'] }, { x: ms, y: ze, col: '#2a9d5c', etich: ['bordo esterno', 'outer edge'] }], punti: [{ x: st.M, y: Math.log10(st.a), col: '#ffd24a', r: 5 }, { x: 1, y: 0, col: '#6bcfff', r: 4 }], xmin: 0.1, xmax: 3, ymin: -2, ymax: 1, xl: ['massa della stella (M☉)', 'star mass (M☉)'], yl: ['log₁₀ d (UA)', 'log₁₀ d (AU)'], legenda: [{ col: '#3ddc84', etich: ['bordo interno (1,1 S⊕)', 'inner edge (1.1 S⊕)'] }, { col: '#2a9d5c', etich: ['bordo esterno (0,36 S⊕)', 'outer edge (0.36 S⊕)'] }, { col: '#ffd24a', etich: ['il pianeta', 'the planet'] }, { col: '#6bcfff', etich: ['la Terra', 'Earth'] }], descr: ['Zona abitabile in funzione della massa della stella', 'Habitable zone versus stellar mass'] });
    }
    F.alRidimensiona(function () { if (s0) grafico(); });
    costruisci();
    st.sveglia = function () { S.avvia(); };
    S.ogniFotogramma(function (dt) {
      if (stl) stl.userData.mat.uniforms.uT.value += dt;
      if (st.pausa) return true;
      st.fase = (st.fase + dt * 0.08 * st.vel) % 1; posa(); if (pl) pl.rotation.y += dt * 0.5;
      return true;
    });
    S.inquadra(17, -1.3, 0.85);
  }

  /* ─── scheda 2: il transito ───────────────────────────────────────────── */
  function schedaTransito(pan, S, destra) {
    var T = S.T, st = { k: 0.1, aRs: 10, inc: 89, u1: 0.45, u2: 0.2, P: 3.5, pausa: false, vel: 1, fase: -0.06 };
    var info = nota(pan);
    F.cursore(pan, ['R_p/R_s = k', 'R_p/R_s = k'], 0.01, 0.3, 0.005, st.k, function (v) { st.k = v; costruisci(); }, function (v) { return v.toFixed(3); });
    F.cursore(pan, ['a/R_s', 'a/R_s'], 3, 40, 0.5, st.aRs, function (v) { st.aRs = v; costruisci(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Inclinazione i (°)', 'Inclination i (°)'], 80, 90, 0.05, st.inc, function (v) { st.inc = v; costruisci(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Oscuramento u₁', 'Limb darkening u₁'], 0, 1, 0.01, st.u1, function (v) { st.u1 = v; costruisci(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Oscuramento u₂', 'Limb darkening u₂'], -0.3, 0.6, 0.01, st.u2, function (v) { st.u2 = v; costruisci(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Periodo P (giorni)', 'Period P (days)'], 0.5, 50, 0.1, st.P, function (v) { st.P = v; costruisci(); }, function (v) { return v.toFixed(1); });
    var vista = F.el('div'); pan.appendChild(vista);
    F.bottone(vista, ['Vista dell’osservatore', 'Observer’s view'], function () { S.inquadra(st.aRs * 0.9 + 8, -Math.PI / 2, Math.PI / 2); });
    F.bottone(vista, ['Vista dall’alto', 'Top view'], function () { S.inquadra(st.aRs * 1.6 + 6, -0.6, 0.35); });
    controlliTempo(pan, st);
    nota(pan, t('Quando l’orbita è vista quasi di taglio il pianeta passa davanti alla stella e ne blocca una frazione di luce. Con l’<b>oscuramento al bordo</b> la stella è più brillante al centro: I(μ) = 1 − u₁(1 − μ) − u₂(1 − μ)², μ = cos θ (per il Sole nel visibile u₁ ≈ 0,45, u₂ ≈ 0,2), così il fondo della curva è arrotondato e la profondità al centro supera un po’ k² = (R_p/R_s)². La curva è calcolata esattamente: per ogni anello di raggio r del disco si somma la luce I(r) dell’arco 2α(r) nascosto dal pianeta, cos α = (r² + z² − k²)/(2rz). Parametro d’impatto b = (a/R_s) cos i; durata totale T₁₄ = (P/π) arcsin[(R_s/a)√((1+k)² − b²)/sin i] e piatta T₂₃ con (1 − k)²; se b > 1 − k il transito è radente («a V»). La probabilità geometrica di vedere un transito è ≈ R_s/a. Dalla curva si ricavano k, b, a/R_s e quindi la densità della stella (ρ_s ∝ (a/R_s)³/P²): è il metodo di Kepler e di TESS.', 'When the orbit is seen nearly edge-on the planet crosses the star and blocks a fraction of its light. With <b>limb darkening</b> the star is brighter at the centre: I(μ) = 1 − u₁(1 − μ) − u₂(1 − μ)², μ = cos θ (for the Sun in the visible u₁ ≈ 0.45, u₂ ≈ 0.2), so the bottom of the curve is rounded and the central depth slightly exceeds k² = (R_p/R_s)². The curve is computed exactly: for every ring of radius r on the disc we add up the light I(r) of the arc 2α(r) hidden by the planet, cos α = (r² + z² − k²)/(2rz). Impact parameter b = (a/R_s) cos i; total duration T₁₄ = (P/π) arcsin[(R_s/a)√((1+k)² − b²)/sin i] and flat T₂₃ with (1 − k)²; if b > 1 − k the transit is grazing («V-shaped»). The geometric probability of seeing a transit is ≈ R_s/a. From the curve one gets k, b, a/R_s and hence the stellar density (ρ_s ∝ (a/R_s)³/P²): this is the method of Kepler and TESS.'));
    var cv = F.tela(destra, 0.45);
    S.sc.add(fondoStelle(T, 2000, 900, 6));
    var stl = null, pl = null, cl = null, occhio = null;
    function costruisci() {
      S.pulisci();
      stl = stella3D(T, 1, 5800, st.u1, st.u2); S.aggiungi(stl);
      var i = st.inc * Math.PI / 180;
      var orb = new T.Group(); orb.rotation.x = Math.PI / 2 - i; S.aggiungi(orb);
      var L = ellisse(T, st.aRs, 0, 0xffd24a, 0.6); orb.add(L);
      pl = pianeta3D(T, st.k, st.k > 0.06 ? 'gas' : 'roccia', 5); orb.add(pl);
      /* l'osservatore sta lungo −y (lontano): la linea di vista */
      var Lv = L3().linea(T, [[0, -st.aRs * 2.2 - 6, 0], [0, 0, 0]], 0x5eead4, 0.5); S.aggiungi(Lv);
      occhio = L3().testo3d(T, '👁 ' + t('osservatore', 'observer'), '#5eead4', 0.6); occhio.position.set(0, -st.aRs * 2.2 - 6.5, 0.6); S.aggiungi(occhio);
      S.aggiungi(L3().freccia(T, [0, -st.aRs * 1.2 - 2, 0], [0, -st.aRs * 2.2 - 6, 0], 0x5eead4, 0.5));
      cl = curvaLuce(st.P, st.aRs, st.k, st.inc, st.u1, st.u2, 240);
      var b = parametroImpatto(st.aRs, st.inc), T14 = durataT14(st.P, st.aRs, st.k, st.inc), T14n = durataNumerica(st.P, st.aRs, st.k, st.inc), T23 = durataT23(st.P, st.aRs, st.k, st.inc), f0 = flussoTransito(b, st.k, st.u1, st.u2, 2000);
      info.innerHTML = 'k² = (R_p/R_s)² = <b>' + (st.k * st.k * 1e6).toFixed(0) + ' ppm</b>; ' + t('profondità al centro della corda ', 'depth at mid-transit ') + ((1 - f0) * 1e6).toFixed(0) + ' ppm<br>b = ' + b.toFixed(3) + (b > 1 + st.k ? t(' — nessun transito', ' — no transit') : b > 1 - st.k ? t(' — radente', ' — grazing') : '') + '<br>T₁₄ = <b>' + (T14 * 24).toFixed(3) + ' h</b> (' + t('formula', 'formula') + '), ' + (T14n * 24).toFixed(3) + ' h (' + t('corda numerica', 'numerical chord') + '); T₂₃ = ' + (T23 * 24).toFixed(3) + ' h<br>' + t('probabilità di transito ≈ R_s/a = ', 'transit probability ≈ R_s/a = ') + (100 / st.aRs).toFixed(1) + ' %';
      S.didascalia.textContent = t('Transito: pianeta davanti alla stella con oscuramento al bordo, b = ', 'Transit: planet in front of a limb-darkened star, b = ') + b.toFixed(2);
      grafico();
    }
    function grafico() {
      var tt = st.fase * st.P, phi = 2 * Math.PI * st.fase, z = separazione(phi, st.aRs, st.inc), fo = Math.cos(phi) > 0 ? flussoTransito(z, st.k, st.u1, st.u2, 300) : 1;
      var span = cl.t[cl.t.length - 1];
      F.grafico(cv, { serie: [{ x: cl.t.map(function (x) { return x * 24; }), y: cl.f.map(function (f) { return (f - 1) * 1e6; }), col: '#ffd24a', etich: ['flusso', 'flux'] }], punti: Math.abs(tt) <= span ? [{ x: tt * 24, y: (fo - 1) * 1e6, col: '#ff6b6b', r: 5 }] : [], linee: [{ y: -st.k * st.k * 1e6, col: '#6bcfff', etich: 'k²' }], xl: ['tempo dal centro del transito (ore)', 'time from mid-transit (hours)'], yl: ['ΔF/F (ppm)', 'ΔF/F (ppm)'], descr: ['Curva di luce del transito con oscuramento al bordo', 'Transit light curve with limb darkening'] });
    }
    F.alRidimensiona(function () { if (cl) grafico(); });
    costruisci();
    st.sveglia = function () { S.avvia(); };
    var acc = 0;
    S.ogniFotogramma(function (dt) {
      if (stl) stl.userData.mat.uniforms.uT.value += dt;
      if (st.pausa) return true;
      /* lento vicino al transito, veloce altrove */
      var near = Math.abs(((st.fase + 0.5) % 1) - 0.5) < 0.12;
      st.fase = (st.fase + dt * (near ? 0.012 : 0.06) * st.vel) % 1;
      var ph = 2 * Math.PI * st.fase; if (pl) pl.position.set(st.aRs * Math.sin(ph), -st.aRs * Math.cos(ph), 0);
      acc += dt; if (acc > 0.12) { acc = 0; grafico(); }
      return true;
    });
    S.inquadra(st.aRs * 0.9 + 8, -Math.PI / 2 + 0.5, Math.PI / 2 - 0.15);
  }

  /* ─── scheda 3: la velocita' radiale ──────────────────────────────────── */
  var PRESET_VR = { giove: { mp: 1, unita: 'MJ', P: 4332.6, e: 0.0489, w: 274, Ms: 1, nome: ['Giove attorno al Sole', 'Jupiter around the Sun'] }, terra: { mp: 1 / 317.83, unita: 'MJ', P: 365.256, e: 0.0167, w: 103, Ms: 1, nome: ['Terra attorno al Sole', 'Earth around the Sun'] }, peg: { mp: 0.46, unita: 'MJ', P: 4.2308, e: 0.01, w: 0, Ms: 1.07, nome: ['51 Pegasi b (1995)', '51 Pegasi b (1995)'] }, eccentrico: { mp: 3, unita: 'MJ', P: 300, e: 0.6, w: 60, Ms: 1, nome: ['gigante eccentrico', 'eccentric giant'] } };
  function schedaVR(pan, S, destra) {
    var T = S.T, st = { mp: 1, P: 4332.6, e: 0.0489, w: 274, inc: 90, Ms: 1, pausa: false, vel: 1, fase: 0, esag: 1 }, cur = {};
    var info = nota(pan);
    F.scelta(pan, ['Esempio', 'Example'], Object.keys(PRESET_VR).map(function (k) { return [k, PRESET_VR[k].nome]; }), 'giove', function (v) { var p = PRESET_VR[v]; st.mp = p.mp; st.P = p.P; st.e = p.e; st.w = p.w; st.Ms = p.Ms; cur.mp.value = Math.log10(st.mp); cur.P.value = Math.log10(st.P); cur.e.value = st.e; cur.w.value = st.w; cur.Ms.value = st.Ms; ['mp', 'P', 'e', 'w', 'Ms'].forEach(function (k) { cur[k].dispatchEvent(new Event('input')); }); costruisci(); });
    cur.mp = F.cursore(pan, ['log₁₀ massa del pianeta (M_J)', 'log₁₀ planet mass (M_J)'], -3, 1.2, 0.01, Math.log10(st.mp), function (v) { st.mp = Math.pow(10, v); costruisci(); }, function (v) { var m = Math.pow(10, v); return m < 0.1 ? (m * 317.83).toFixed(2) + ' M⊕' : m.toFixed(2) + ' M_J'; });
    cur.P = F.cursore(pan, ['log₁₀ periodo (giorni)', 'log₁₀ period (days)'], 0, 4.5, 0.01, Math.log10(st.P), function (v) { st.P = Math.pow(10, v); costruisci(); }, function (v) { return fmt(Math.pow(10, v)) + ' d'; });
    cur.e = F.cursore(pan, ['Eccentricità e', 'Eccentricity e'], 0, 0.9, 0.01, st.e, function (v) { st.e = v; costruisci(); }, function (v) { return v.toFixed(2); });
    cur.w = F.cursore(pan, ['Argomento del periastro ω (°)', 'Argument of periastron ω (°)'], 0, 360, 1, st.w, function (v) { st.w = v; costruisci(); });
    cur.i = F.cursore(pan, ['Inclinazione i (°)', 'Inclination i (°)'], 5, 90, 1, st.inc, function (v) { st.inc = v; costruisci(); });
    cur.Ms = F.cursore(pan, ['Massa della stella (M☉)', 'Star mass (M☉)'], 0.1, 3, 0.01, st.Ms, function (v) { st.Ms = v; costruisci(); }, function (v) { return v.toFixed(2); });
    controlliTempo(pan, st);
    nota(pan, t('Stella e pianeta orbitano attorno al baricentro comune: la stella descrive un’ellisse più piccola di un fattore m_p/M_s (per il Sole e Giove ~742 000 km, poco più del raggio solare). La sua velocità lungo la linea di vista sposta le righe spettrali per effetto Doppler, Δλ/λ = v_r/c: v_r = K[cos(ν + ω) + e cos ω], con ν l’anomalia vera (dall’equazione di Keplero) e semiampiezza K = (2πG/P)^⅓ m_p sin i/(M_s + m_p)^⅔/√(1 − e²) ≈ 28,4 m/s·(m_p sin i/M_J)(P/1 anno)^(−⅓)(M_s/M☉)^(−⅔). Giove dà al Sole 12,5 m/s in 11,9 anni, la Terra 9 cm/s in un anno: gli spettrografi migliori (ESPRESSO) arrivano a ~10 cm/s, ma l’attività della stella disturba già a ~1 m/s. Il metodo misura solo m_p sin i. Una curva non sinusoidale rivela l’eccentricità. Nella vista 3D lo spostamento della stella è ingrandito; il colore della freccia segue il Doppler (blu se si avvicina).', 'Star and planet orbit the common barycentre: the star traces an ellipse smaller by m_p/M_s (for the Sun and Jupiter ~742,000 km, just over a solar radius). Its velocity along the line of sight shifts spectral lines by the Doppler effect, Δλ/λ = v_r/c: v_r = K[cos(ν + ω) + e cos ω], with ν the true anomaly (from Kepler’s equation) and semi-amplitude K = (2πG/P)^⅓ m_p sin i/(M_s + m_p)^⅔/√(1 − e²) ≈ 28.4 m/s·(m_p sin i/M_J)(P/1 yr)^(−⅓)(M_s/M☉)^(−⅔). Jupiter gives the Sun 12.5 m/s over 11.9 years, Earth 9 cm/s over a year: the best spectrographs (ESPRESSO) reach ~10 cm/s, but stellar activity already interferes at ~1 m/s. The method only measures m_p sin i. A non-sinusoidal curve reveals eccentricity. In the 3D view the star’s displacement is magnified; the arrow colour follows the Doppler shift (blue when approaching).'));
    var cv = F.tela(destra, 0.42);
    S.sc.add(fondoStelle(T, 2000, 900, 8));
    var stl = null, pl = null, frecc = null, K = 0, a = 1, aS = 1, sc = 1, orbS = null, rot = null;
    function costruisci() {
      S.pulisci(); frecc = null;
      var mp = st.mp * MGIOVE, Ms = st.Ms * MSOLE;
      K = semiampiezzaK(st.P, mp, Ms, st.e, st.inc);
      a = Math.cbrt(st.P * st.P / 133407.4 * (st.Ms + mp / MSOLE)); /* UA: P² [anni²] = a³/M */
      sc = 8 / (a * (1 + st.e));
      var q = mp / (Ms + mp); st.esag = Math.min(2.2 / Math.max(1e-12, a * q * sc * (1 + st.e)), 2e5); if (a * q * sc * st.esag < 0.4) st.esag = 0.4 / (a * q * sc);
      rot = new T.Group(); rot.rotation.x = -(90 - st.inc) * Math.PI / 180; rot.rotation.z = st.w * Math.PI / 180; S.aggiungi(rot);
      stl = stella3D(T, 0.55, stella(st.Ms).T); rot.add(stl);
      var orbP = ellisse(T, a * sc * (1 - q), st.e, 0xffd24a, 0.6); rot.add(orbP);
      orbS = ellisse(T, -a * sc * q * st.esag, st.e, 0xff8a80, 0.8); rot.add(orbS);
      var rP = st.mp > 0.3 ? 0.32 : 0.18; pl = pianeta3D(T, rP, st.mp > 0.1 ? 'gas' : 'oceano', 2); rot.add(pl);
      var bc = new T.Mesh(new T.SphereGeometry(0.07, 12, 8), new T.MeshBasicMaterial({ color: 0x5eead4 })); rot.add(bc);
      S.aggiungi(L3().linea(T, [[0, -14, 0], [0, -4, 0]], 0x5eead4, 0.5));
      var oc = L3().testo3d(T, '👁 ' + t('osservatore', 'observer'), '#5eead4', 0.55); oc.position.set(0, -14.5, 0.5); S.aggiungi(oc);
      var eb = L3().testo3d(T, t('baricentro', 'barycentre'), '#5eead4', 0.32); eb.position.set(0, 0, -0.5); rot.add(eb);
      info.innerHTML = 'K = <b>' + (K >= 1 ? K.toFixed(2) + ' m/s' : (K * 100).toFixed(2) + ' cm/s') + '</b>, m_p sin i = ' + fmt(st.mp * Math.sin(st.inc * Math.PI / 180)) + ' M_J (' + fmt(st.mp * 317.83 * Math.sin(st.inc * Math.PI / 180)) + ' M⊕)<br>a = ' + a.toFixed(3) + t(' UA; la stella orbita a ', ' AU; the star orbits at ') + fmt(a * q * UA / 1000) + ' km ' + t('dal baricentro', 'from the barycentre') + ' (' + fmt(a * q * UA / RSOLE) + ' R☉)<br>' + t('Vista 3D: moto della stella ingrandito ×', '3D view: star motion magnified ×') + fmt(st.esag);
      S.didascalia.textContent = t('Velocità radiale: la stella oscilla attorno al baricentro, K = ', 'Radial velocity: the star wobbles around the barycentre, K = ') + fmt(K) + ' m/s';
      grafico(); posa();
    }
    function posa() {
      var p = posizioneOrbita(st.fase, st.e), q = st.mp * MGIOVE / (st.Ms * MSOLE + st.mp * MGIOVE);
      if (pl) pl.position.set(p[0] * a * sc * (1 - q), p[1] * a * sc * (1 - q), 0);
      if (stl) stl.position.set(-p[0] * a * sc * q * st.esag, -p[1] * a * sc * q * st.esag, 0);
      var v = velocitaRadiale(st.fase, K, st.e, st.w), col = v > 0 ? 0xff6b6b : 0x6bcfff;
      /* una sola freccia, aggiornata (niente geometrie nuove a ogni fotogramma) */
      var sp = stl.getWorldPosition(new T.Vector3()), L = 2.5 * v / Math.max(K, 1e-12);
      if (!frecc || !frecc.parent) { frecc = new T.ArrowHelper(new T.Vector3(0, -1, 0), new T.Vector3(), 1, col, 0.4, 0.24); S.aggiungi(frecc); }
      frecc.position.set(sp.x, sp.y, sp.z + 0.9); frecc.setDirection(new T.Vector3(0, L >= 0 ? -1 : 1, 0)); frecc.setLength(Math.max(0.05, Math.abs(L)), 0.4 * Math.min(1, Math.abs(L) + 0.2), 0.24); frecc.setColor(new T.Color(col));
    }
    function grafico() {
      var xs = [], ys = []; for (var j = 0; j <= 300; j++) { var f = j / 300 * 2; xs.push(f * st.P); ys.push(velocitaRadiale(f % 1, K, st.e, st.w)); }
      var u = K < 1 ? 100 : 1, nome = K < 1 ? 'cm/s' : 'm/s';
      F.grafico(cv, { serie: [{ x: xs, y: ys.map(function (y) { return y * u; }), col: '#ff8a80', etich: ['v_r', 'v_r'] }], punti: [{ x: st.fase * st.P, y: velocitaRadiale(st.fase, K, st.e, st.w) * u, col: '#ffd24a', r: 5 }], linee: [{ y: K * u, col: '#34465f', etich: '+K' }, { y: -K * u, col: '#34465f', etich: '−K' }], xl: ['t (giorni)', 't (days)'], yl: ['v_r (' + nome + ')', 'v_r (' + nome + ')'], descr: ['Curva di velocità radiale della stella', 'Radial velocity curve of the star'] });
    }
    F.alRidimensiona(function () { if (K) grafico(); });
    costruisci();
    st.sveglia = function () { S.avvia(); };
    var acc = 0;
    S.ogniFotogramma(function (dt) {
      if (stl) stl.userData.mat.uniforms.uT.value += dt;
      if (st.pausa) return true;
      st.fase = (st.fase + dt * 0.07 * st.vel) % 1; posa();
      acc += dt; if (acc > 0.15) { acc = 0; grafico(); }
      return true;
    });
    S.inquadra(22, -1.1, 0.95);
  }

  /* ─── scheda 4: immagine diretta, astrometria, popolazione ────────────── */
  function schedaImmagine(pan, S, destra) {
    var T = S.T, st = { d: 10, mp: 1, a: 5.2, Ms: 1, Rp: 1, Ag: 0.5, coron: true, pausa: false, vel: 1, fase: 0 };
    var info = nota(pan);
    F.cursore(pan, ['Distanza del sistema (pc)', 'System distance (pc)'], 1.3, 100, 0.1, st.d, function (v) { st.d = v; aggiorna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['log₁₀ massa del pianeta (M_J)', 'log₁₀ planet mass (M_J)'], -3, 1.2, 0.01, Math.log10(st.mp), function (v) { st.mp = Math.pow(10, v); aggiorna(); }, function (v) { var m = Math.pow(10, v); return m < 0.1 ? (m * 317.83).toFixed(2) + ' M⊕' : m.toFixed(2) + ' M_J'; });
    F.cursore(pan, ['Semiasse a (UA)', 'Semi-major axis a (AU)'], 0.5, 60, 0.1, st.a, function (v) { st.a = v; aggiorna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Albedo geometrica A_g', 'Geometric albedo A_g'], 0.05, 0.9, 0.01, st.Ag, function (v) { st.Ag = v; aggiorna(); }, function (v) { return v.toFixed(2); });
    casella(pan, ['Coronografo (copre la stella)', 'Coronagraph (masks the star)'], st.coron, function (v) { st.coron = v; aggiorna(); });
    controlliTempo(pan, st);
    nota(pan, t('<b>Immagine diretta</b>: in luce riflessa il pianeta è più debole della stella di un fattore C = A_g (R_p/a)²·Φ(α): ~10⁻⁹ per Giove, ~10⁻¹⁰ per la Terra; la separazione angolare è a/d (1″ a 1 UA da 1 pc). Si vedono quindi soprattutto giganti giovani e caldi (che brillano di luce propria nell’infrarosso) lontani dalla stella, come HR 8799 o β Pictoris b, con un coronografo che spegne la stella. <b>Astrometria</b>: la stella descrive attorno al baricentro un’ellisse di semiasse angolare α = (m_p/M_s)(a/d) — 0,5 mas per un Giove a 10 pc — che si somma al moto proprio (rettilineo) e alla parallasse annua (un’ellisse di semiasse 1/d″): è la traccia ondulata che misura Gaia. <b>Popolazione</b>: il diagramma massa-periodo qui sotto mostra una popolazione illustrativa (non un catalogo) con i gruppi noti: gioviani caldi a pochi giorni (transiti), giganti freddi (velocità radiale), super-Terre e sub-nettuniani (Kepler), giganti larghi (immagine), pianeti attorno a nane M a qualche UA (microlente); le rette tratteggiate sono le soglie K = 1 e 10 m/s per una stella come il Sole. I pianeti del Sistema solare sono a posto vero.', '<b>Direct imaging</b>: in reflected light the planet is fainter than the star by C = A_g (R_p/a)²·Φ(α): ~10⁻⁹ for Jupiter, ~10⁻¹⁰ for Earth; the angular separation is a/d (1″ at 1 AU from 1 pc). So mostly young hot giants (glowing on their own in the infrared) far from their star are seen, like HR 8799 or β Pictoris b, with a coronagraph blocking the star. <b>Astrometry</b>: the star traces around the barycentre an ellipse of angular semi-axis α = (m_p/M_s)(a/d) — 0.5 mas for a Jupiter at 10 pc — added to the (straight) proper motion and the annual parallax (an ellipse of semi-axis 1/d″): this is the wavy track Gaia measures. <b>Population</b>: the mass-period diagram below shows an illustrative population (not a catalogue) with the known groups: hot Jupiters at a few days (transits), cold giants (radial velocity), super-Earths and sub-Neptunes (Kepler), wide giants (imaging), planets around M dwarfs at a few AU (microlensing); dashed lines are the K = 1 and 10 m/s thresholds for a Sun-like star. Solar System planets are at their true places.'));
    var cvT = F.tela(destra, 0.42), cvP = F.tela(destra, 0.55);
    S.sc.add(fondoStelle(T, 2000, 900, 12));
    var stl = null, pl = null, mask = null, sc = 1, popolo = popolazione(2024);
    function aggiorna() {
      S.pulisci();
      sc = 9 / st.a;
      stl = stella3D(T, 0.5, 5800); S.aggiungi(stl);
      S.aggiungi(ellisse(T, st.a * sc, 0, 0xffd24a, 0.5));
      pl = pianeta3D(T, 0.35, st.mp > 0.1 ? 'gas' : 'oceano', 4); S.aggiungi(pl);
      /* il coronografo: un disco scuro davanti alla stella, verso l'osservatore (+z) */
      if (st.coron) { mask = new T.Mesh(new T.CircleGeometry(1.4, 48), new T.MeshBasicMaterial({ color: 0x050a12, transparent: true, opacity: 0.92, side: T.DoubleSide })); mask.position.set(0, 0, 2.5); S.aggiungi(mask); S.aggiungi(new T.Mesh(new T.RingGeometry(1.4, 1.5, 48), new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.6, side: T.DoubleSide }))).position.set(0, 0, 2.5); }
      var lo = L3().testo3d(T, '👁 ' + t('telescopio (dall’alto)', 'telescope (from above)'), '#5eead4', 0.55); lo.position.set(0, 0, 9); S.aggiungi(lo);
      S.aggiungi(L3().linea(T, [[0, 0, 3], [0, 0, 8.5]], 0x5eead4, 0.5));
      var mp = st.mp * MGIOVE, Rp = (st.mp > 0.1 ? 1 : Math.cbrt(st.mp * 317.83) * RTERRA / RGIOVE) * RGIOVE, C = contrasto(st.Ag, Rp, st.a), alpha = oscillazioneAstrometrica(mp, MSOLE * st.Ms, st.a, st.d), sep = separazioneAngolare(st.a, st.d), P = periodo(st.a, st.Ms);
      info.innerHTML = t('Separazione angolare ', 'Angular separation ') + '<b>' + (sep >= 1 ? sep.toFixed(2) + '″' : (sep * 1000).toFixed(0) + ' mas') + '</b>; ' + t('contrasto in luce riflessa ', 'reflected-light contrast ') + '<b>' + C.toExponential(1) + '</b><br>' + t('Oscillazione astrometrica ', 'Astrometric wobble ') + '<b>' + (alpha * 1e6 >= 1000 ? (alpha * 1000).toFixed(2) + ' mas' : (alpha * 1e6).toFixed(1) + ' μas') + '</b>, ' + t('parallasse ', 'parallax ') + (1000 / st.d).toFixed(1) + ' mas, P = ' + P.toFixed(1) + t(' anni', ' yr') + '<br>' + (sep > 0.1 && C > 1e-10 ? t('Alla portata di un coronografo spaziale (Roman, HWO).', 'Within reach of a space coronagraph (Roman, HWO).') : t('Troppo vicino alla stella o troppo debole per l’immagine diretta in luce riflessa.', 'Too close to the star or too faint for reflected-light imaging.'));
      S.didascalia.textContent = t('Immagine diretta: pianeta a ', 'Direct imaging: planet at ') + st.a.toFixed(1) + t(' UA, separazione ', ' AU, separation ') + (sep * 1000).toFixed(0) + ' mas';
      grafici();
    }
    function grafici() {
      var mp = st.mp * MGIOVE, P = periodo(st.a, st.Ms), anni = Math.min(Math.max(5, P * 1.2), 30), mu = [40, 25];
      var con = tracciaCielo(anni, 600, st.d, mu, mp, st.Ms * MSOLE, st.a, P, true), senza = tracciaCielo(anni, 600, st.d, mu, mp, st.Ms * MSOLE, st.a, P, false);
      var dx = con.x.map(function (x, i) { return x - senza.x[i]; }), dy = con.y.map(function (y, i) { return y - senza.y[i]; });
      var tt = con.x.map(function (x, i) { return anni * i / 600; });
      F.grafico(cvT, { serie: [{ x: tt, y: dx.map(function (v) { return v * 1000; }), col: '#ffd24a', etich: ['Δα*', 'Δα*'] }, { x: tt, y: dy.map(function (v) { return v * 1000; }), col: '#6bcfff', etich: ['Δδ', 'Δδ'] }], xl: ['t (anni)', 't (years)'], yl: ['oscillazione (μas)', 'wobble (μas)'], legenda: [{ col: '#ffd24a', etich: ['Δα cos δ (traccia − moto proprio − parallasse)', 'Δα cos δ (track − proper motion − parallax)'] }, { col: '#6bcfff', etich: ['Δδ', 'Δδ'] }], descr: ['Oscillazione astrometrica della stella', 'Astrometric wobble of the star'] });
      var col = { transito: '#ffd24a', vr: '#ff8a80', immagine: '#b28dff', microlente: '#5eead4' };
      var punti = popolo.map(function (p) { return { x: Math.log10(p.P), y: Math.log10(p.M), col: col[p.met], r: 2 }; });
      SISTEMA_SOLARE.forEach(function (p) { punti.push({ x: Math.log10(p[2]), y: Math.log10(p[3]), col: '#e6fffb', r: 4 }); });
      punti.push({ x: Math.log10(P * 365.25), y: Math.log10(st.mp * 317.83), col: '#ff6b6b', r: 6 });
      var xs = [], k1 = [], k10 = []; for (var lp = -0.5; lp <= 6; lp += 0.1) { xs.push(lp); var Pa = Math.pow(10, lp) / 365.25; k1.push(Math.log10(1 / 28.4329 * Math.cbrt(Pa) * 317.83)); k10.push(Math.log10(10 / 28.4329 * Math.cbrt(Pa) * 317.83)); }
      var G2 = F.grafico(cvP, { serie: [{ x: xs, y: k1, col: '#8494a8', tratt: true, larg: 1, etich: ['K = 1 m/s', 'K = 1 m/s'] }, { x: xs, y: k10, col: '#c9d3df', tratt: true, larg: 1, etich: ['K = 10 m/s', 'K = 10 m/s'] }], punti: punti, xmin: -0.5, xmax: 6, ymin: -1.5, ymax: 4.2, xl: ['log₁₀ P (giorni)', 'log₁₀ P (days)'], yl: ['log₁₀ M (M⊕)', 'log₁₀ M (M⊕)'], legenda: [{ col: '#ffd24a', etich: ['transito', 'transit'] }, { col: '#ff8a80', etich: ['velocità radiale', 'radial velocity'] }, { col: '#b28dff', etich: ['immagine diretta', 'direct imaging'] }, { col: '#5eead4', etich: ['microlente', 'microlensing'] }, { col: '#e6fffb', etich: ['Sistema solare', 'Solar System'] }, { col: '#ff6b6b', etich: ['il pianeta scelto', 'the chosen planet'] }], descr: ['Diagramma massa-periodo di una popolazione illustrativa di esopianeti', 'Mass-period diagram of an illustrative exoplanet population'] });
      G2.q.fillStyle = '#e6fffb'; G2.q.font = '10px system-ui,sans-serif'; G2.q.textAlign = 'left';
      SISTEMA_SOLARE.forEach(function (p) { G2.q.fillText(F.tt([p[0], p[1]]).slice(0, 3), G2.X(Math.log10(p[2])) + 5, G2.Y(Math.log10(p[3])) + 3); });
    }
    F.alRidimensiona(function () { if (stl) grafici(); });
    aggiorna();
    st.sveglia = function () { S.avvia(); };
    S.ogniFotogramma(function (dt) {
      if (stl) stl.userData.mat.uniforms.uT.value += dt;
      if (st.pausa) return true;
      st.fase = (st.fase + dt * 0.05 * st.vel) % 1; if (pl) pl.position.set(st.a * sc * Math.cos(2 * Math.PI * st.fase), st.a * sc * Math.sin(2 * Math.PI * st.fase), 0);
      return true;
    });
    S.inquadra(24, -1.2, 0.55);
  }

  F.sezione('sastroeso', {
    titolo: ['🌍 Esopianeti 3D', '🌍 Exoplanets 3D'],
    sotto: ['I pianeti di altre stelle in tre dimensioni: la zona abitabile attorno a stelle di ogni tipo, il transito con l’oscuramento al bordo e la curva di luce, l’oscillazione della stella e la velocità radiale, l’immagine diretta, l’astrometria e il diagramma massa-periodo.', 'Planets of other stars in three dimensions: the habitable zone around stars of every type, the transit with limb darkening and its light curve, the star’s wobble and radial velocity, direct imaging, astrometry and the mass-period diagram.'],
    schede: [
      { nome: ['🪐 Sistema e zona abitabile', '🪐 System and habitable zone'], costruisci: scheda(schedaSistema) },
      { nome: ['🌑 Transito', '🌑 Transit'], costruisci: scheda(schedaTransito) },
      { nome: ['〰️ Velocità radiale', '〰️ Radial velocity'], costruisci: scheda(schedaVR) },
      { nome: ['🔭 Immagine e popolazione', '🔭 Imaging and population'], costruisci: scheda(schedaImmagine) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
