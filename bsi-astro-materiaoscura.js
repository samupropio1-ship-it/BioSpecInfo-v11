/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-materiaoscura.js — 🌑 Materia oscura e lenti gravitazionali (v255)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Richiesta dell'autore, con un video di riferimento («simulating dark matter
   through gravitational lensing using physics & machine learning»): nuvole di
   particelle di materia oscura in filamenti e ammassi viola, rosa e bianchi,
   la transizione verso le lenti gravitazionali con anelli e archi dinamici, la
   fisica e l'apprendimento automatico insieme. Quattro schede, il calcolo in
   bsi-astro-materiaoscura-fisica.js (provato dal banco):

   1. LA RETE COSMICA — campo gaussiano ΛCDM (Planck 2018, BBKS, σ₈ = 0,811)
      in una scatola di 200 Mpc/h, particelle mosse con l'approssimazione di
      Zel'dovich al crescere del tempo cosmico; il colore è la densità calcolata
      dal determinante della mappa (viola → rosa → bianco).
   2. LA LENTE — l'equazione della lente risolta per ogni pixel sulla GPU:
      massa puntiforme, SIS, SIE, NFW, con taglio esterno; la sorgente è una
      galassia a spirale lontana; curve critiche e caustiche calcolate; la
      mappa della convergenza κ (la massa, quasi tutta oscura) a richiesta.
   3. FISICA + APPRENDIMENTO AUTOMATICO — una rete neurale impara nel browser,
      da lenti simulate con lo stesso modello fisico, a leggere il raggio di
      Einstein e l'ellitticità da un'immagine; poi un fit fisico (simplesso di
      Nelder e Mead sul χ²) parte dalla risposta della rete e la rifinisce.
      È lo schema di Hezaveh, Perreault Levasseur e Marshall (Nature 548, 2017).
   4. LE CURVE DI ROTAZIONE — disco esponenziale (Freeman) più alone NFW:
      senza alone la velocità cala come Keplero, con l'alone resta piatta.
   5. LA REGIA — la sequenza del video: rete cosmica, crollo del nodo più
      denso in un alone NFW, l'anello di Einstein che nasce dietro l'alone, tre
      aloni-lente insieme, il ritorno alla rete.

   ONESTA'
   · Zel'dovich vale fino all'incrocio delle orbite: dopo, i veri ammassi si
     formano con simulazioni a N corpi; qui i filamenti sono giusti nella
     posizione, gli ammassi troppo gonfi. Lo dice la scheda.
   · La rete neurale è piccola e addestrata in pochi secondi: impara il modello
     SIE con cui è addestrata, non le lenti vere con tutte le loro complicazioni.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI, D = globale.document;
  function MO() { return globale.BSIMateriaOscura; }
  function num(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); }
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function qualitaAuto() { var n = globale.navigator || {}, piccolo = (globale.innerWidth || 1000) < 700; if (n.deviceMemory && n.deviceMemory <= 2) return 0; return !piccolo && (n.hardwareConcurrency || 4) >= 8 ? 2 : 1; }
  var STATI = { misurato: ['MISURATO', '#5eead4'], modello: ['MODELLO', '#6bb7ff'], ml: ['APPRENDIMENTO', '#ff8fd8'] };
  function stato(k) { var s = STATI[k]; return '<span style="display:inline-block;font:800 10px/1 system-ui,sans-serif;letter-spacing:.06em;color:#04121c;background:' + s[1] + ';border-radius:5px;padding:3px 6px;margin-right:6px;vertical-align:1px">' + s[0] + '</span>'; }
  var LUCE = null;
  function luce(T) { if (LUCE) return LUCE; var c = D.createElement('canvas'); c.width = c.height = 64; var q = c.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 64, 64); LUCE = new T.CanvasTexture(c); return LUCE; }
  function ferma() { return globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function scelta3D(dx, rapporto, pronto) {
    var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.appendChild(attesa);
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
    L3.stile(); L3.caricaThree().then(function () { attesa.remove(); var S = new L3.Scena(dx, rapporto); dx.insertBefore(S.box, dx.firstChild); S.ren.setClearColor(0x020108, 1); setTimeout(function () { pronto(S, globale.THREE, L3); }, 0); }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
  }

  /* ═══ 1. LA RETE COSMICA ═══════════════════════════════════════════════ */
  function schedaRete(div) {
    var g = griglia(div), o = { z: 0, livello: qualitaAuto(), seme: 7 }, S = null, T = null, dati = null, corsa = null;
    var cz = F.cursore(g.pan, ['Redshift z (tempo cosmico)', 'Redshift z (cosmic time)'], 0, 30, 0.1, o.z, function (v) { o.z = v; corsa = null; aggiorna(); }, function (v) { return num(v, 1); });
    var bp = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: '▶ ' + t('Dalla luce fossile a oggi', 'From the relic light to today') }); g.pan.appendChild(bp);
    bp.addEventListener('click', function () { if (ferma()) { o.z = o.z > 0.5 ? 0 : 20; aggiorna(); return; } corsa = { t: 0 }; if (S) { S.sporca = true; S.avvia(); } });
    F.scelta(g.pan, ['Qualità', 'Quality'], [['2', ['massima: 64³ = 262 144 particelle', 'maximum: 64³ = 262,144 particles']], ['1', ['normale: 64³, metà disegnate', 'normal: 64³, half drawn']], ['0', ['leggera: 32³ = 32 768 particelle', 'light: 32³ = 32,768 particles']]], String(o.livello), function (v) { o.livello = +v; costruisci(); });
    F.bottone ? null : null;
    var bs = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: '🎲 ' + t('Un altro universo (altro seme)', 'Another universe (other seed)') }); bs.addEventListener('click', function () { o.seme++; costruisci(); }); g.pan.appendChild(bs);
    var info = nota(g.pan);
    function testo() {
      if (!dati) return;
      var a = 1 / (1 + o.z), Dg = MO().crescita(a);
      info.innerHTML = stato('modello') + '<b>' + t('Approssimazione di Zel\'dovich troncata', 'Truncated Zel\'dovich approximation') + '</b>: x = q + D(a) ψ(q), ψ(k) = i k δ(k)/k²<br>' +
        'z = <b class="bsiFX-num">' + num(o.z, 1) + '</b>, a = ' + num(a, 3) + ', ' + t('fattore di crescita ', 'growth factor ') + 'D = <b class="bsiFX-num">' + num(Dg, 3) + '</b> · ' + t('età dell\'universo ≈ ', 'age of the universe ≈ ') + '<b class="bsiFX-num">' + num(eta(a), 2) + ' Gyr</b><br>' +
        t('Scatola di 200 Mpc/h (≈ 300 Mpc), ', 'Box of 200 Mpc/h (≈ 300 Mpc), ') + dati.N + '³ ' + t('particelle; spettro ΛCDM di Planck 2018, σ₈ = 0,811. Colore: densità ρ/ρ̄ = 1/|det(I + D∂ψ/∂q)| — viola vuoti e filamenti, rosa e bianco i nodi dove nascono gli ammassi.', 'particles; Planck 2018 ΛCDM spectrum, σ₈ = 0.811. Colour: density ρ/ρ̄ = 1/|det(I + D∂ψ/∂q)| — violet voids and filaments, pink and white the nodes where clusters are born.') +
        '<br><small>' + t('Zel\'dovich è esatta finché le orbite non si incrociano; dopo (z ≲ 1 nei nodi) gli ammassi veri si fanno con le simulazioni a N corpi: qui i filamenti sono al posto giusto, i nodi troppo gonfi.', 'Zel\'dovich is exact until orbits cross; after that (z ≲ 1 in the nodes) real clusters require N-body simulations: here filaments are in the right place, nodes too puffy.') + '</small>';
    }
    function eta(a) { var MOx = MO(), H0 = 100 * MOx.COSMO.h, s = 0, n = 400; for (var i = 1; i <= n; i++) { var x = a * (i - 0.5) / n; s += 1 / (x * MOx.E(1 / x - 1)) * a / n; } return s / H0 * 977.8; }
    function costruisci() {
      if (!S) return;
      var N = o.livello === 0 ? 32 : 64, L = 200, t0 = performance.now();
      var R = MO().reteCosmica(N, L, o.seme, 3.0), M = N * N * N, passo = o.livello === 1 ? 2 : 1, Mv = Math.ceil(M / passo);
      var tutte = new Float32Array(M * 3), dens = new Float32Array(M), pos = new Float32Array(Mv * 3), col = new Float32Array(Mv * 3);
      S.pulisci(); var gr = new T.Group(); S.aggiungi(gr);
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
      var pm = new T.Points(geo, new T.PointsMaterial({ size: (o.livello === 2 ? 1.25 : 1.6) * L / 200, map: luce(T), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      pm.position.set(-L / 2, -L / 2, -L / 2); gr.add(pm);
      var bx = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(L, L, L)), new T.LineBasicMaterial({ color: 0x3a2a66, transparent: true, opacity: 0.5 })); gr.add(bx);
      dati = { N: N, L: L, R: R, tutte: tutte, dens: dens, pos: pos, col: col, geo: geo, passo: passo, ms: performance.now() - t0 };
      S.inquadra(L * 1.9, 0.7, 1.15); S.gira = !ferma();
      aggiorna();
    }
    function aggiorna() {
      if (dati) {
        var a = 1 / (1 + o.z), Dg = MO().crescita(a); MO().evolvi(dati.R, Dg, dati.tutte, dati.dens);
        var j = 0;
        for (var i = 0; i < dati.dens.length; i += dati.passo, j++) {
          dati.pos[j * 3] = dati.tutte[i * 3]; dati.pos[j * 3 + 1] = dati.tutte[i * 3 + 1]; dati.pos[j * 3 + 2] = dati.tutte[i * 3 + 2];
          var l = Math.log10(dati.dens[i]), f = Math.max(0, Math.min(1, (l + 0.15) / 1.6)), r, gg, b;
          if (f < 0.5) { var u = f / 0.5; r = 0.16 + 0.74 * u; gg = 0.05 + 0.2 * u; b = 0.38 + 0.4 * u; } else { var w = (f - 0.5) / 0.5; r = 0.9 + 0.1 * w; gg = 0.25 + 0.7 * w; b = 0.78 + 0.2 * w; }
          var k = 0.04 + 0.96 * Math.pow(f, 1.35);   /* i vuoti quasi spenti, filamenti e nodi accesi */ dati.col[j * 3] = r * k; dati.col[j * 3 + 1] = gg * k; dati.col[j * 3 + 2] = b * k;
        }
        dati.geo.attributes.position.needsUpdate = true; dati.geo.attributes.color.needsUpdate = true;
        S.didascalia.textContent = t('Rete cosmica', 'Cosmic web') + ' · z = ' + num(o.z, 1) + ' · ' + dati.N + '³ ' + t('particelle', 'particles') + ' · 200 Mpc/h · Zel\'dovich';
        S.sporca = true; S.avvia();
      }
      if (globale.document.activeElement !== cz) cz.value = o.z;
      testo();
    }
    scelta3D(g.dx, 0.85, function (S0, T0) {
      S = S0; T = T0; costruisci();
      S.ogniFotogramma(function (dt) { if (!corsa) return false; corsa.t += dt; var u = Math.min(1, corsa.t / 14); o.z = Math.max(0, Math.pow(1 + 30, 1 - u) - 1); aggiorna(); if (u >= 1) corsa = null; return true; });
    });
  }

  /* ═══ 2. LA LENTE ══════════════════════════════════════════════════════ */
  var VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  var FRAG = [
    'precision highp float; varying vec2 vUv;',
    'uniform int tipo; uniform float te, q, ang, ks, rs, gam, phig, fov, tempo, kappaOn, luceOn, rSorg, ellS; uniform vec2 sorg;',
    'float atanh2(float x){ x = clamp(x, -0.999999, 0.999999); return 0.5*log((1.0+x)/(1.0-x)); }',
    'float hN(float x){ if (x < 1e-5) return 0.0; float Fv; if (x < 1.0) Fv = 2.0/sqrt(1.0-x*x)*atanh2(sqrt((1.0-x)/(1.0+x))); else if (x > 1.0) Fv = 2.0/sqrt(x*x-1.0)*atan(sqrt((x-1.0)/(x+1.0))); else Fv = 1.0; return log(x/2.0) + Fv; }',
    'float gN(float x){ if (x < 1.0) return (1.0 - 2.0/sqrt(1.0-x*x)*atanh2(sqrt((1.0-x)/(1.0+x))))/(x*x-1.0); if (x > 1.0) return (1.0 - 2.0/sqrt(x*x-1.0)*atan(sqrt((x-1.0)/(x+1.0))))/(x*x-1.0); return 1.0/3.0; }',
    'vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c*p.x + s*p.y, -s*p.x + c*p.y); }',
    'vec2 defl(vec2 th, out float kap){',
    '  vec2 u = rot(th, ang); float r = max(length(u), 1e-6); vec2 au = vec2(0.0); kap = 0.0;',
    '  if (tipo == 0) { au = te*te*u/(r*r); }',
    '  else if (tipo == 1) { au = te*u/r; kap = te/(2.0*r); }',
    '  else if (tipo == 2) { float qq = clamp(q, 0.2, 0.999); float e = sqrt(1.0-qq*qq); float ps = max(sqrt(qq*qq*u.x*u.x + u.y*u.y), 1e-6); float b = te*sqrt(qq); au = vec2(b/e*atan(e*u.x/ps), b/e*atanh2(e*u.y/ps)); kap = b/(2.0*ps); }',
    '  else { float X = r/rs; au = 4.0*ks*rs*hN(X)/X*u/r; kap = 2.0*ks*gN(X); }',
    '  vec2 a = rot(au, -ang);',
    '  float g1 = gam*cos(2.0*phig), g2 = gam*sin(2.0*phig); a += vec2(g1*th.x + g2*th.y, g2*th.x - g1*th.y);',
    '  return a; }',
    /* la galassia sorgente: spirale a due bracci con nodi di formazione stellare, azzurra */
    'vec3 sorgente(vec2 b){',
    '  vec2 d = rot(b - sorg, 0.6); d.y /= ellS; float r = length(d)/rSorg; float ph = atan(d.y, d.x);',
    '  float disco = exp(-r*2.2); float bracci = 0.5 + 0.5*cos(2.0*ph - 5.0*log(r + 0.05) - tempo*0.15);',
    '  float nucleo = exp(-r*r*40.0);',
    '  vec2 kn = d/rSorg; float nodi = 0.0; for (int k = 0; k < 7; k++) { float fk = float(k); vec2 c0 = vec2(cos(fk*2.39 + 0.4), sin(fk*2.39 + 0.4))*(0.2 + 0.09*fk); nodi += exp(-dot(kn - c0, kn - c0)*90.0); }',
    '  float I = disco*(0.45 + 1.1*bracci) + 1.8*nucleo + 0.9*nodi;',
    '  return I*vec3(0.55, 0.75, 1.0) + nucleo*vec3(1.0, 0.85, 0.6) + nodi*vec3(1.0, 0.45, 0.85);',
    '}',
    'float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }',
    'vec3 campoProfondo(vec2 b){ vec3 c = vec3(0.0); vec2 g = b*1.6; vec2 id = floor(g); for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) { vec2 cel = id + vec2(float(i), float(j)); float h = h21(cel); if (h < 0.55) continue; vec2 cen = cel + vec2(h21(cel + 7.1), h21(cel + 3.3)); vec2 d = rot(g - cen, h*6.28); d.y /= 0.35 + 0.6*h21(cel + 1.7); float r = length(d); float lum = (0.06 + 0.18*h21(cel + 9.2))*exp(-r*r*55.0); c += lum*mix(vec3(1.0, 0.7, 0.45), vec3(0.55, 0.7, 1.0), h21(cel + 4.4)); } return c; }',
    'void main(){',
    '  vec2 th = (vUv - 0.5)*fov; float kap; vec2 a = defl(th, kap); vec2 b = th - a;',
    /* sovracampionamento 2×2 per bordi definiti */
    '  vec3 c = vec3(0.0); float px = fov/900.0;',
    '  for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) { vec2 o = (vec2(float(i), float(j)) - 0.5)*px; float k2; vec2 t2 = th + o; vec2 bb = t2 - defl(t2, k2); c += sorgente(bb) + campoProfondo(bb); }',
    '  c *= 0.25;',
    '  float rl = length(rot(th, ang)*vec2(1.0, 1.0/max(q, 0.3)));',
    '  if (luceOn > 0.5) c += vec3(1.0, 0.72, 0.42)*0.55*exp(-7.67*(pow(rl/(0.5*te + 0.05), 0.25) - 1.0))*0.02;',
    '  if (kappaOn > 0.5) { float kk = clamp(kap, 0.0, 3.0); c += vec3(0.45, 0.12, 0.75)*0.35*kk + vec3(0.9, 0.3, 0.8)*0.12*smoothstep(0.9, 1.1, kk); }',
    '  c = vec3(1.0) - exp(-c*1.6);',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'].join('\n');

  function schedaLente(div) {
    var g = griglia(div), m = { tipo: 'sie', te: 1.2, q: 0.75, ang: 0.5, ks: 0.6, rs: 1.5, gamma: 0, phig: 0 }, src = { x: 0.08, y: 0.05, r: 0.28, ell: 0.7 }, mostra = { kappa: false, critiche: true, caustiche: true, luce: true }, corre = !ferma(), fase = 0;
    var FOV = 6;
    F.scelta(g.pan, ['Modello della lente', 'Lens model'], [['sie', ['SIE: alone isotermo ellittico', 'SIE: elliptical isothermal halo']], ['sis', ['SIS: alone isotermo sferico', 'SIS: spherical isothermal halo']], ['nfw', ['NFW: alone di materia oscura delle simulazioni', 'NFW: simulated dark-matter halo']], ['punto', ['Massa puntiforme (buco nero, stella)', 'Point mass (black hole, star)']]], m.tipo, function (v) { m.tipo = v; ridisegna(); });
    F.cursore(g.pan, ['Raggio di Einstein θ_E (″)', 'Einstein radius θ_E (″)'], 0.3, 2.2, 0.02, m.te, function (v) { m.te = v; ridisegna(); }, function (v) { return num(v, 2) + '″'; });
    F.cursore(g.pan, ['Rapporto degli assi q (SIE)', 'Axis ratio q (SIE)'], 0.3, 1, 0.01, m.q, function (v) { m.q = v; ridisegna(); }, function (v) { return num(v, 2); });
    F.cursore(g.pan, ['Taglio esterno γ (ammasso vicino)', 'External shear γ (nearby cluster)'], 0, 0.2, 0.005, 0, function (v) { m.gamma = v; ridisegna(); }, function (v) { return num(v, 3); });
    F.cursore(g.pan, ['NFW: convergenza κ_s', 'NFW: convergence κ_s'], 0.1, 1.5, 0.02, m.ks, function (v) { m.ks = v; ridisegna(); }, function (v) { return num(v, 2); });
    var bm = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: corre ? '⏸ ' + t('Ferma la sorgente', 'Stop the source') : '▶ ' + t('Muovi la sorgente', 'Move the source') }); bm.addEventListener('click', function () { corre = !corre; bm.textContent = corre ? '⏸ ' + t('Ferma la sorgente', 'Stop the source') : '▶ ' + t('Muovi la sorgente', 'Move the source'); if (corre) giro(); }); g.pan.appendChild(bm);
    var sv = F.el('div', { style: 'display:grid;gap:2px;margin:8px 0' }); g.pan.appendChild(sv);
    [['critiche', ['Curve critiche (piano della lente)', 'Critical curves (lens plane)']], ['caustiche', ['Caustiche (piano della sorgente)', 'Caustics (source plane)']], ['kappa', ['Massa κ: la materia oscura che non si vede', 'Mass κ: the dark matter you cannot see']], ['luce', ['Luce della galassia lente', 'Light of the lens galaxy']]].forEach(function (x) {
      var lab = F.el('label', { style: 'display:flex;align-items:center;gap:10px;min-height:36px;width:100%;cursor:pointer' }), c = F.el('input', { type: 'checkbox', style: 'width:20px;height:20px;margin:0;flex:0 0 auto' }); c.checked = mostra[x[0]]; c.addEventListener('change', function () { mostra[x[0]] = c.checked; ridisegna(); }); lab.appendChild(c); lab.appendChild(F.el('span', { testo: t(x[1][0], x[1][1]) })); sv.appendChild(lab);
    });
    var fis = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(fis);
    var info = nota(g.pan);
    var box = F.el('div', { style: 'position:relative;width:100%;max-width:640px;margin:0 auto;aspect-ratio:1/1;border-radius:14px;overflow:hidden;background:#000;touch-action:none' }); g.dx.appendChild(box);
    var sovra = F.el('canvas', { 'aria-hidden': 'true', style: 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none' });
    var didas = F.el('div', { 'class': 'bsiFX-nota', style: 'margin-top:6px' }); g.dx.appendChild(didas);
    var ren = null, mat = null, sc = null, cam = null, T = null, curve = null, chiaveCurve = '';
    function uniformi() { if (!mat) return; var U = mat.uniforms; U.tipo.value = { punto: 0, sis: 1, sie: 2, nfw: 3 }[m.tipo]; U.te.value = m.te; U.q.value = m.tipo === 'sie' ? m.q : 1; U.ang.value = m.ang; U.ks.value = m.ks; U.rs.value = m.rs; U.gam.value = m.gamma; U.phig.value = m.phig; U.sorg.value.set(src.x, src.y); U.kappaOn.value = mostra.kappa ? 1 : 0; U.luceOn.value = mostra.luce && m.tipo !== 'punto' ? 1 : 0; U.rSorg.value = src.r; U.ellS.value = src.ell; U.tempo.value = fase; }
    function modello() { return { tipo: m.tipo, te: m.te, q: m.tipo === 'sie' ? m.q : 1, ang: m.ang, ks: m.ks, rs: m.rs, gamma: m.gamma, phig: m.phig }; }
    function disegnaSovra() {
      var W = box.clientWidth || 400, dpr = Math.min(2, globale.devicePixelRatio || 1); sovra.width = W * dpr; sovra.height = W * dpr; var q2 = sovra.getContext('2d'); q2.setTransform(dpr, 0, 0, dpr, 0, 0); q2.clearRect(0, 0, W, W);
      var X = function (x) { return (x / FOV + 0.5) * W; }, Y = function (y) { return (0.5 - y / FOV) * W; };
      var ch = JSON.stringify(modello()); if (ch !== chiaveCurve) { curve = MO().curveCritiche(modello(), FOV / 2, (globale.innerWidth || 1000) < 700 ? 130 : 200); chiaveCurve = ch; }
      q2.lineWidth = 1.4;
      if (mostra.critiche) { q2.strokeStyle = 'rgba(255,255,255,.85)'; q2.beginPath(); curve.critiche.forEach(function (s) { q2.moveTo(X(s[0][0]), Y(s[0][1])); q2.lineTo(X(s[1][0]), Y(s[1][1])); }); q2.stroke(); }
      if (mostra.caustiche) { q2.strokeStyle = 'rgba(255,120,210,.95)'; q2.beginPath(); curve.caustiche.forEach(function (s) { if (Math.hypot(s[0][0] - s[1][0], s[0][1] - s[1][1]) > 0.3) return; q2.moveTo(X(s[0][0]), Y(s[0][1])); q2.lineTo(X(s[1][0]), Y(s[1][1])); }); q2.stroke(); }
      q2.fillStyle = 'rgba(140,220,255,.95)'; q2.beginPath(); q2.arc(X(src.x), Y(src.y), 3.5, 0, 2 * PI); q2.fill();
      var imm = MO().immagini(modello(), src.x, src.y, FOV / 2);
      q2.font = '11px system-ui,sans-serif'; q2.fillStyle = '#ffe9a8';
      imm.forEach(function (p) { q2.strokeStyle = 'rgba(255,233,168,.9)'; q2.beginPath(); q2.arc(X(p[0]), Y(p[1]), 6, 0, 2 * PI); q2.stroke(); q2.fillText('μ = ' + num(p[2], 1), X(p[0]) + 8, Y(p[1]) - 6); });
      /* scala: 1 secondo d'arco */
      q2.strokeStyle = '#cfe3f7'; q2.lineWidth = 2; q2.beginPath(); q2.moveTo(12, W - 14); q2.lineTo(12 + W / FOV, W - 14); q2.stroke(); q2.fillStyle = '#cfe3f7'; q2.fillText('1″', 14, W - 20);
      return imm;
    }
    function ridisegna() {
      uniformi(); if (ren) { var W = box.clientWidth || 400; ren.setSize(W, W, false); ren.domElement.style.width = '100%'; ren.domElement.style.height = '100%'; ren.render(sc, cam); }
      var imm = disegnaSovra();
      var MOx = MO(), sv = 200, zl = 0.5, zs = 2, teSIS = MOx.einsteinSIS(sv, zl, zs);
      fis.innerHTML = '<b>' + t('Scala vera', 'True scale') + '</b>: ' + t('una galassia con dispersione di velocità σ = 200 km/s a z = 0,5 davanti a una sorgente a z = 2 ha θ_E = ', 'a galaxy with velocity dispersion σ = 200 km/s at z = 0.5 in front of a source at z = 2 has θ_E = ') + '<b class="bsiFX-num">' + num(teSIS, 2) + '″</b>; ' + t('un ammasso con σ = 1000 km/s a z = 0,3: ', 'a cluster with σ = 1000 km/s at z = 0.3: ') + '<b class="bsiFX-num">' + num(MOx.einsteinSIS(1000, 0.3, 2), 0) + '″</b>. ' + t('θ_E = 4π(σ/c)² D_ls/D_s, distanze ΛCDM di Planck 2018.', 'θ_E = 4π(σ/c)² D_ls/D_s, Planck 2018 ΛCDM distances.');
      var tot = imm.reduce(function (s, p) { return s + Math.abs(p[2]); }, 0);
      info.innerHTML = stato('modello') + '<div class="bsiFX-eq">β = θ − α(θ),   μ = 1/det(∂β/∂θ)</div>' + t('Immagini della sorgente (centro): ', 'Images of the source (centre): ') + '<b class="bsiFX-num">' + imm.length + '</b>, ' + t('amplificazione totale ', 'total magnification ') + '<b class="bsiFX-num">' + num(tot, 1) + '×</b>. ' +
        t('Quando la sorgente attraversa la caustica (rosa) due immagini nascono o muoiono insieme sulla curva critica (bianca): per questo le lenti forti hanno 2 o 4 immagini (più una debolissima al centro).', 'When the source crosses the caustic (pink) two images are born or die together on the critical curve (white): this is why strong lenses have 2 or 4 images (plus a very faint central one).');
      didas.innerHTML = '<small>' + t('Ogni pixel risolve l\'equazione della lente sulla GPU, sovracampionato 2×2. Campo di 6″. Sorgente: galassia a spirale di sintesi (colori convenzionali). ', 'Every pixel solves the lens equation on the GPU, 2×2 supersampled. 6″ field. Source: synthetic spiral galaxy (conventional colours). ') + (mostra.kappa ? t('Viola: la convergenza κ, cioè la massa proiettata — nelle galassie e negli ammassi è in gran parte materia oscura.', 'Violet: the convergence κ, i.e. projected mass — in galaxies and clusters mostly dark matter.') : '') + '</small>';
    }
    function giro() {
      if (!corre || !box.isConnected) return;
      if (box.offsetParent === null) { setTimeout(function () { globale.requestAnimationFrame(giro); }, 400); return; }
      fase += 0.016; var r0 = 0.32 * m.te; src.x = r0 * Math.cos(fase * 0.35) + 0.04; src.y = r0 * 0.8 * Math.sin(fase * 0.35 * 1.3);
      ridisegna(); globale.requestAnimationFrame(giro);
    }
    /* trascinare la sorgente con il dito */
    box.addEventListener('pointerdown', function (e) { var r = box.getBoundingClientRect(), muovi = function (ev) { src.x = ((ev.clientX - r.left) / r.width - 0.5) * FOV; src.y = (0.5 - (ev.clientY - r.top) / r.height) * FOV; ridisegna(); }; corre = false; bm.textContent = '▶ ' + t('Muovi la sorgente', 'Move the source'); muovi(e); var su = function () { box.removeEventListener('pointermove', muovi); globale.removeEventListener('pointerup', su); }; box.addEventListener('pointermove', muovi); globale.addEventListener('pointerup', su); });
    var L3 = globale.BSILab3D;
    (L3 ? L3.caricaThree() : Promise.reject(new Error('three.js'))).then(function () {
      T = globale.THREE; ren = new T.WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true }); ren.setPixelRatio(Math.min(2, globale.devicePixelRatio || 1));
      ren.domElement.setAttribute('role', 'img'); ren.domElement.setAttribute('aria-label', t('Lente gravitazionale calcolata pixel per pixel', 'Gravitational lens computed pixel by pixel'));
      box.appendChild(ren.domElement); box.appendChild(sovra);
      sc = new T.Scene(); cam = new T.Camera();
      mat = new T.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { tipo: { value: 2 }, te: { value: 1 }, q: { value: 1 }, ang: { value: 0 }, ks: { value: 0.6 }, rs: { value: 1.5 }, gam: { value: 0 }, phig: { value: 0 }, fov: { value: FOV }, tempo: { value: 0 }, kappaOn: { value: 0 }, luceOn: { value: 1 }, rSorg: { value: 0.28 }, ellS: { value: 0.7 }, sorg: { value: new T.Vector2(0, 0) } } });
      sc.add(new T.Mesh(new T.PlaneGeometry(2, 2), mat));
      ridisegna(); F.alRidimensiona(ridisegna); if (corre) globale.requestAnimationFrame(giro);
    }).catch(function (e) { box.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: '⚠ ' + e.message })); ridisegna(); });
    ridisegna();
  }

  /* ═══ 3. FISICA + APPRENDIMENTO AUTOMATICO ═════════════════════════════ */
  var PIX = 24, CAMPO = 5;
  /** Immagine PIX×PIX di una lente SIE con una sorgente sérsic ellittica (n = 1), stesso modello della scheda 2. */
  function immagineLente(p, rumore, rnd) {
    var im = new Float32Array(PIX * PIX), m = { tipo: 'sie', te: p.te, q: p.q, ang: p.ang };
    for (var j = 0; j < PIX; j++) for (var i = 0; i < PIX; i++) {
      var x = ((i + 0.5) / PIX - 0.5) * CAMPO, y = ((j + 0.5) / PIX - 0.5) * CAMPO, b = MO().sorgente(m, x, y), dx = b[0] - p.bx, dy = b[1] - p.by, r = Math.hypot(dx, dy / 0.8);
      im[j * PIX + i] = Math.exp(-r / 0.18) + (rumore ? rumore * MO().gauss(rnd) : 0);
    }
    return im;
  }
  function parametriCasuali(rnd) { return { te: 0.6 + rnd(), q: 0.5 + 0.45 * rnd(), ang: rnd() * PI, bx: (rnd() - 0.5) * 0.4, by: (rnd() - 0.5) * 0.4 }; }
  function bersaglio(p) { return [p.te, (1 - p.q) * Math.cos(2 * p.ang) * 4, (1 - p.q) * Math.sin(2 * p.ang) * 4]; }   /* θ_E e i due componenti dell'ellitticità (senza salto d'angolo) */
  function daBersaglio(y) { var e = Math.hypot(y[1], y[2]) / 4; return { te: y[0], q: 1 - e, ang: (Math.atan2(y[2], y[1]) / 2 + PI) % PI }; }
  /** Rete densa con ReLU, ottimizzatore Adam. */
  function Rete(strati, seme) {
    var rnd = MO().mulberry(seme || 1), W = [], B = [];
    for (var l = 0; l + 1 < strati.length; l++) { var n = strati[l], m = strati[l + 1], w = new Float32Array(n * m), s = Math.sqrt(2 / n); for (var i = 0; i < w.length; i++) w[i] = MO().gauss(rnd) * s; W.push(w); B.push(new Float32Array(m)); }
    this.s = strati; this.W = W; this.B = B; this.mW = W.map(function (w) { return new Float32Array(w.length); }); this.vW = W.map(function (w) { return new Float32Array(w.length); }); this.mB = B.map(function (b) { return new Float32Array(b.length); }); this.vB = B.map(function (b) { return new Float32Array(b.length); }); this.passi = 0;
  }
  Rete.prototype.avanti = function (x) { var a = [x]; for (var l = 0; l < this.W.length; l++) { var n = this.s[l], m = this.s[l + 1], o = new Float32Array(m), w = this.W[l], b = this.B[l], ul = l === this.W.length - 1; for (var j = 0; j < m; j++) { var z = b[j]; for (var i = 0; i < n; i++) z += a[l][i] * w[i * m + j]; o[j] = ul ? z : (z > 0 ? z : 0); } a.push(o); } return a; };
  Rete.prototype.predici = function (x) { var a = this.avanti(x); return Array.from(a[a.length - 1]); };
  /** Un passo di Adam su un lotto; restituisce l'errore quadratico medio. */
  Rete.prototype.passo = function (X, Y, lr) {
    var gW = this.W.map(function (w) { return new Float32Array(w.length); }), gB = this.B.map(function (b) { return new Float32Array(b.length); }), err = 0, L = this.W.length, self = this;
    X.forEach(function (x, k) {
      var a = self.avanti(x), d = new Float32Array(self.s[L]); for (var j = 0; j < d.length; j++) { var e = a[L][j] - Y[k][j]; err += e * e; d[j] = 2 * e / X.length; }
      for (var l = L - 1; l >= 0; l--) { var n = self.s[l], m = self.s[l + 1], w = self.W[l], dn = new Float32Array(n); for (var i = 0; i < n; i++) { var ai = a[l][i], s = 0; for (var jj = 0; jj < m; jj++) { gW[l][i * m + jj] += ai * d[jj]; s += w[i * m + jj] * d[jj]; } dn[i] = l > 0 && a[l][i] <= 0 ? 0 : s; } for (var j2 = 0; j2 < m; j2++) gB[l][j2] += d[j2]; d = dn; }
    });
    this.passi++; var b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, this.passi), c2 = 1 - Math.pow(b2, this.passi);
    for (var l2 = 0; l2 < L; l2++) {
      [[this.W[l2], gW[l2], this.mW[l2], this.vW[l2]], [this.B[l2], gB[l2], this.mB[l2], this.vB[l2]]].forEach(function (z) { var p = z[0], g = z[1], mm = z[2], vv = z[3]; for (var i = 0; i < p.length; i++) { mm[i] = b1 * mm[i] + (1 - b1) * g[i]; vv[i] = b2 * vv[i] + (1 - b2) * g[i] * g[i]; p[i] -= lr * (mm[i] / c1) / (Math.sqrt(vv[i] / c2) + 1e-8); } });
    }
    return err / (X.length * this.s[L]);
  };
  function normalizza(im) { var mx = 1e-9; for (var i = 0; i < im.length; i++) mx = Math.max(mx, im[i]); var o = new Float32Array(im.length); for (var j = 0; j < im.length; j++) o[j] = im[j] / mx; return o; }
  /** Fit fisico: simplesso di Nelder e Mead sul χ² di (θ_E, q, angolo, βx, βy). */
  function fitFisico(osservata, partenza, sigma, iter) {
    function chi2(v) { var p = { te: v[0], q: Math.min(0.99, Math.max(0.3, v[1])), ang: v[2], bx: v[3], by: v[4] }; if (p.te <= 0.1) return 1e12; var m = immagineLente(p, 0), s = 0; for (var i = 0; i < m.length; i++) { var d = m[i] - osservata[i]; s += d * d; } return s / (sigma * sigma); }
    var n = 5, P = [[partenza.te, partenza.q, partenza.ang, partenza.bx || 0, partenza.by || 0]], passi = [0.15, 0.08, 0.3, 0.08, 0.08];
    for (var i = 0; i < n; i++) { var v = P[0].slice(); v[i] += passi[i]; P.push(v); }
    var f = P.map(chi2);
    for (var k = 0; k < (iter || 400); k++) {
      var ord = f.map(function (x, i) { return i; }).sort(function (a, b) { return f[a] - f[b]; }); P = ord.map(function (i) { return P[i]; }); f = ord.map(function (i) { return f[i]; });
      var c = new Array(n).fill(0); for (var a = 0; a < n; a++) for (var d = 0; d < n; d++) c[d] += P[a][d] / n;
      var r = c.map(function (x, d) { return x + (x - P[n][d]); }), fr = chi2(r);
      if (fr < f[0]) { var e = c.map(function (x, d) { return x + 2 * (x - P[n][d]); }), fe = chi2(e); if (fe < fr) { P[n] = e; f[n] = fe; } else { P[n] = r; f[n] = fr; } }
      else if (fr < f[n - 1]) { P[n] = r; f[n] = fr; }
      else { var co = c.map(function (x, d) { return x + 0.5 * (P[n][d] - x); }), fc = chi2(co); if (fc < f[n]) { P[n] = co; f[n] = fc; } else { for (var s2 = 1; s2 <= n; s2++) { P[s2] = P[s2].map(function (x, d) { return P[0][d] + 0.5 * (x - P[0][d]); }); f[s2] = chi2(P[s2]); } } }
    }
    var b = 0; for (var q = 1; q <= n; q++) if (f[q] < f[b]) b = q;
    return { te: P[b][0], q: Math.min(0.99, Math.max(0.3, P[b][1])), ang: ((P[b][2] % PI) + PI) % PI, bx: P[b][3], by: P[b][4], chi2: f[b], dof: PIX * PIX - 5 };
  }
  function dataset(n, seme, rumore) { var rnd = MO().mulberry(seme), X = [], Y = [], P = []; for (var i = 0; i < n; i++) { var p = parametriCasuali(rnd); X.push(normalizza(immagineLente(p, rumore, rnd))); Y.push(bersaglio(p)); P.push(p); } return { X: X, Y: Y, P: P }; }
  function diffAngolo(a, b) { var d = Math.abs(a - b) % PI; return Math.min(d, PI - d); }

  function schedaML(div) {
    var g = griglia(div), st = { rete: null, tr: null, va: null, epoca: 0, perdite: [], val: [], corre: false, ntr: 1600 };
    var bt = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: '🧠 ' + t('Addestra la rete (1 600 lenti simulate)', 'Train the network (1,600 simulated lenses)') }); g.pan.appendChild(bt);
    var bo = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: '🔭 ' + t('Una lente «osservata»: rete + fit fisico', 'An «observed» lens: network + physical fit') }); g.pan.appendChild(bo);
    var info = nota(g.pan);
    info.innerHTML = stato('ml') + t('La rete (576 → 64 → 32 → 3, ReLU, Adam) legge un\'immagine 24×24 e restituisce θ_E e i due componenti dell\'ellitticità. Si addestra qui, su lenti generate con lo stesso modello fisico (SIE più sorgente con rumore). Poi il fit fisico (χ², simplesso di Nelder e Mead) parte dalla sua risposta.', 'The network (576 → 64 → 32 → 3, ReLU, Adam) reads a 24×24 image and returns θ_E and the two ellipticity components. It trains here, on lenses generated with the same physical model (SIE plus a noisy source). Then the physical fit (χ², Nelder–Mead simplex) starts from its answer.') +
      '<br><small>' + t('Schema di Hezaveh, Perreault Levasseur e Marshall, Nature 548 (2017) 555: le reti stimano i parametri in millisecondi, il modello fisico li verifica.', 'Scheme of Hezaveh, Perreault Levasseur and Marshall, Nature 548 (2017) 555: networks estimate parameters in milliseconds, the physical model verifies them.') + '</small>';
    var c1 = F.tela(g.dx, 0.45), c2 = F.tela(g.dx, 0.5), res = F.el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;align-items:flex-start' }); g.dx.appendChild(res);
    function grafici() {
      var xs = st.perdite.map(function (_, i) { return i + 1; });
      F.grafico(c1, { serie: [{ x: xs, y: st.perdite.map(Math.log10), col: '#ff8fd8', larg: 2.5 }, { x: xs, y: st.val.map(Math.log10), col: '#5eead4', larg: 2.5 }], xl: ['epoca', 'epoch'], yl: ['log₁₀ errore quadratico medio', 'log₁₀ mean squared error'], legenda: [{ col: '#ff8fd8', etich: ['addestramento', 'training'] }, { col: '#5eead4', etich: ['validazione (lenti mai viste)', 'validation (unseen lenses)'] }] });
      if (st.rete && st.va) {
        var vx = [], vy = []; st.va.X.forEach(function (x, i) { vx.push(st.va.P[i].te); vy.push(st.rete.predici(x)[0]); });
        F.grafico(c2, { punti: vx.map(function (x, i) { return { x: x, y: vy[i], col: '#ff8fd8', r: 2.5 }; }), serie: [{ x: [0.5, 1.7], y: [0.5, 1.7], col: '#5eead4', tratt: true }], xl: ['θ_E vero (″)', 'true θ_E (″)'], yl: ['θ_E stimato dalla rete (″)', 'θ_E estimated by the network (″)'], xmin: 0.5, xmax: 1.7, ymin: 0.5, ymax: 1.7 });
      }
    }
    function epoca() {
      if (!st.corre) return;
      var lotto = 32, ordine = st.tr.X.map(function (_, i) { return i; }), rnd = MO().mulberry(100 + st.epoca); for (var i = ordine.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), k = ordine[i]; ordine[i] = ordine[j]; ordine[j] = k; }
      var s = 0, nb = 0; for (var b = 0; b < ordine.length; b += lotto) { var idx = ordine.slice(b, b + lotto); s += st.rete.passo(idx.map(function (i) { return st.tr.X[i]; }), idx.map(function (i) { return st.tr.Y[i]; }), 0.0015); nb++; }
      var v = 0; st.va.X.forEach(function (x, i) { var p = st.rete.predici(x); for (var k2 = 0; k2 < 3; k2++) v += Math.pow(p[k2] - st.va.Y[i][k2], 2); }); v /= st.va.X.length * 3;
      st.perdite.push(s / nb); st.val.push(v); st.epoca++;
      var rms = Math.sqrt(st.va.X.reduce(function (q, x, i) { return q + Math.pow(st.rete.predici(x)[0] - st.va.P[i].te, 2); }, 0) / st.va.X.length);
      bt.textContent = '🧠 ' + t('Epoca ', 'Epoch ') + st.epoca + ' / 25 · ' + t('errore su θ_E ', 'θ_E error ') + num(rms, 3) + '″';
      grafici();
      if (st.epoca < 25) setTimeout(epoca, 0); else { st.corre = false; st.rms = rms; bt.textContent = '✓ ' + t('Rete addestrata: errore su θ_E ', 'Network trained: θ_E error ') + num(rms, 3) + '″ ' + t('(rifai)', '(redo)'); }
    }
    bt.addEventListener('click', function () {
      if (st.corre) return; st.corre = true; st.epoca = 0; st.perdite = []; st.val = [];
      bt.textContent = '… ' + t('genero le lenti simulate', 'generating simulated lenses');
      setTimeout(function () { st.tr = dataset(st.ntr, 11, 0.04); st.va = dataset(200, 99, 0.04); st.rete = new Rete([PIX * PIX, 64, 32, 3], 5); epoca(); }, 30);
    });
    function disegnaImm(im, titolo) { var c = D.createElement('canvas'); c.width = PIX; c.height = PIX; c.style.cssText = 'width:150px;height:150px;image-rendering:pixelated;border-radius:8px;background:#000'; var q = c.getContext('2d'), d = q.createImageData(PIX, PIX), mx = 1e-9; for (var i = 0; i < im.length; i++) mx = Math.max(mx, im[i]); for (var j = 0; j < im.length; j++) { var v = Math.max(0, im[j] / mx); d.data[j * 4] = 255 * Math.min(1, v * 1.1); d.data[j * 4 + 1] = 255 * Math.pow(v, 1.4) * 0.6; d.data[j * 4 + 2] = 255 * Math.min(1, 0.4 + v); d.data[j * 4 + 3] = 255; } q.putImageData(d, 0, 0); var w = F.el('div', { style: 'text-align:center;font-size:.82em;color:#9fb3c8' }); w.appendChild(c); w.appendChild(F.el('div', { testo: titolo })); return w; }
    bo.addEventListener('click', function () {
      if (!st.rete) { info.insertAdjacentHTML('beforeend', '<br><b>' + t('Prima addestra la rete.', 'Train the network first.') + '</b>'); return; }
      var rnd = MO().mulberry(Date.now() % 100000), vero = parametriCasuali(rnd), oss = immagineLente(vero, 0.04, rnd), t0 = performance.now(), y = st.rete.predici(normalizza(oss)), tML = performance.now() - t0, pr = daBersaglio(y);
      var t1 = performance.now(), mx = 0; for (var i = 0; i < oss.length; i++) mx = Math.max(mx, oss[i]);
      var fit = fitFisico(oss, { te: pr.te, q: pr.q, ang: pr.ang, bx: 0, by: 0 }, 0.04, 500), tF = performance.now() - t1;
      res.innerHTML = ''; res.appendChild(disegnaImm(oss, t('osservata (con rumore)', 'observed (with noise)'))); res.appendChild(disegnaImm(immagineLente({ te: fit.te, q: fit.q, ang: fit.ang, bx: fit.bx, by: fit.by }, 0), t('modello del fit', 'fit model')));
      var tab = F.el('div', { 'class': 'bsiFX-nota', style: 'flex:1 1 240px' });
      tab.innerHTML = '<table style="width:100%;font-size:.9em"><tr><th></th><th>θ_E (″)</th><th>q</th><th>' + t('angolo', 'angle') + '</th></tr>' +
        '<tr><td>' + t('vero', 'true') + '</td><td>' + num(vero.te, 3) + '</td><td>' + num(vero.q, 3) + '</td><td>' + num(vero.ang * 180 / PI, 0) + '°</td></tr>' +
        '<tr><td>' + t('rete', 'network') + ' (' + num(tML, 1) + ' ms)</td><td>' + num(pr.te, 3) + '</td><td>' + num(pr.q, 3) + '</td><td>' + num(pr.ang * 180 / PI, 0) + '°</td></tr>' +
        '<tr><td>' + t('fit fisico', 'physical fit') + ' (' + num(tF, 0) + ' ms)</td><td>' + num(fit.te, 3) + '</td><td>' + num(fit.q, 3) + '</td><td>' + num(fit.ang * 180 / PI, 0) + '°</td></tr></table>' +
        'χ²/ν = <b class="bsiFX-num">' + num(fit.chi2 / fit.dof, 2) + '</b> ' + t('(≈ 1 vuol dire che il modello spiega l\'immagine fino al rumore)', '(≈ 1 means the model explains the image down to the noise)');
      res.appendChild(tab);
    });
    grafici();
  }

  /* ═══ 4. LE CURVE DI ROTAZIONE ═════════════════════════════════════════ */
  function schedaRotazione(div) {
    var g = griglia(div), o = { Md: 5e10, Rd: 2.6, M200: 1.0e12, c: 10, alone: true };
    F.cursore(g.pan, ['Massa del disco di stelle e gas (10¹⁰ M☉)', 'Mass of the stellar and gas disc (10¹⁰ M☉)'], 1, 15, 0.5, o.Md / 1e10, function (v) { o.Md = v * 1e10; disegna(); }, function (v) { return num(v, 1); });
    F.cursore(g.pan, ['Raggio di scala del disco R_d (kpc)', 'Disc scale radius R_d (kpc)'], 1, 6, 0.1, o.Rd, function (v) { o.Rd = v; disegna(); }, function (v) { return num(v, 1); });
    F.cursore(g.pan, ['Massa dell\'alone M₂₀₀ (10¹² M☉)', 'Halo mass M₂₀₀ (10¹² M☉)'], 0, 3, 0.05, o.M200 / 1e12, function (v) { o.M200 = v * 1e12; disegna(); }, function (v) { return num(v, 2); });
    F.cursore(g.pan, ['Concentrazione c', 'Concentration c'], 4, 20, 0.5, o.c, function (v) { o.c = v; disegna(); }, function (v) { return num(v, 1); });
    var info = nota(g.pan), c = F.tela(g.dx, 0.6);
    function r200(M) { var rhoc = 3 * Math.pow(100 * MO().COSMO.h, 2) / (8 * PI * MO().G_KPC) / 1e6; return Math.cbrt(3 * M / (4 * PI * 200 * rhoc)); }   /* H in km/s/Mpc → kpc */
    function disegna() {
      var R2 = o.M200 > 0 ? r200(o.M200) : 1, xs = [], vd = [], vh = [], vt = [];
      for (var R = 0.25; R <= 40; R += 0.25) { var a = MO().vDisco(R, o.Md, o.Rd), b = o.M200 > 0 ? MO().vAlone(R, o.M200, o.c, R2) : 0; xs.push(R); vd.push(a); vh.push(b); vt.push(Math.sqrt(a * a + b * b)); }
      var v8 = Math.sqrt(Math.pow(MO().vDisco(8.2, o.Md, o.Rd), 2) + Math.pow(o.M200 > 0 ? MO().vAlone(8.2, o.M200, o.c, R2) : 0, 2));
      F.grafico(c, { serie: [{ x: xs, y: vd, col: '#ffd24a', larg: 2, tratt: true }, { x: xs, y: vh, col: '#b48cff', larg: 2, tratt: true }, { x: xs, y: vt, col: '#ff8fd8', larg: 3 }], punti: [{ x: 8.2, y: 229, col: '#5eead4', r: 6 }], xl: ['raggio R (kpc)', 'radius R (kpc)'], yl: ['velocità di rotazione (km/s)', 'rotation speed (km/s)'], ymin: 0,
        legenda: [{ col: '#ffd24a', etich: ['solo stelle e gas (disco di Freeman)', 'stars and gas only (Freeman disc)'] }, { col: '#b48cff', etich: ['alone di materia oscura (NFW)', 'dark-matter halo (NFW)'] }, { col: '#ff8fd8', etich: ['totale', 'total'] }, { col: '#5eead4', etich: ['il Sole: 229 km/s a 8,2 kpc (misurato)', 'the Sun: 229 km/s at 8.2 kpc (measured)'] }] });
      info.innerHTML = '<div class="bsiFX-eq">v²(R) = v²_disco(R) + v²_alone(R)</div>' + t('A 8,2 kpc il modello dà ', 'At 8.2 kpc the model gives ') + '<b class="bsiFX-num">' + num(v8, 0) + ' km/s</b>; ' + stato('misurato') + t('la velocità circolare del Sole è 229 ± 7 km/s (Eilers et al. 2019). ', 'the Sun\'s circular speed is 229 ± 7 km/s (Eilers et al. 2019). ') +
        t('Senza alone la curva scende come Keplero (v ∝ 1/√R lontano dal disco); le galassie vere hanno curve piatte fino a decine di kpc (Rubin e Ford 1970; Bosma 1981): è la prima prova della materia oscura. r₂₀₀ = ', 'Without a halo the curve falls like Kepler (v ∝ 1/√R far from the disc); real galaxies have flat curves out to tens of kpc (Rubin and Ford 1970; Bosma 1981): the first evidence for dark matter. r₂₀₀ = ') + num(R2, 0) + ' kpc.';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 5. LA REGIA: DALLA MATERIA ALLA LENTE ═══════════════════════════ */
  /* La sequenza del video di riferimento, con la fisica delle altre schede:
     A (0–8 s) la rete cosmica di Zel'dovich troncata; B (8–14 s) le particelle del nodo più denso cadono in un alone NFW
     (raggi campionati dalla massa cumulativa M(<r) ∝ ln(1+x) − x/(1+x)), le altre si spengono; C (14–26 s) dietro l'alone
     compare la lente calcolata dallo stesso shader: l'anello di Einstein si forma mentre la sorgente si allinea, l'alone
     ruota; D (26–34 s) tre aloni-lente insieme, ognuno con il suo anello; E (34–40 s) si torna alla rete. */
  var VERT3D = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  function schedaCinema(div) {
    var g = griglia(div), S = null, T = null, st = null, tempo = 0, corre = !ferma();
    var bp = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: corre ? '⏸ ' + t('Ferma', 'Stop') : '▶ ' + t('Avvia la sequenza', 'Start the sequence') }); g.pan.appendChild(bp);
    bp.addEventListener('click', function () { corre = !corre; bp.textContent = corre ? '⏸ ' + t('Ferma', 'Stop') : '▶ ' + t('Avvia la sequenza', 'Start the sequence'); if (S) { S.sporca = true; S.avvia(); } });
    var cur = F.cursore(g.pan, ['Momento della sequenza (s)', 'Moment of the sequence (s)'], 0, 40, 0.1, 0, function (v) { tempo = v; corre = false; bp.textContent = '▶ ' + t('Avvia la sequenza', 'Start the sequence'); aggiorna(0); }, function (v) { return num(v, 1) + ' s'; });
    var info = nota(g.pan);
    var FASI = [[8, t('La rete cosmica: filamenti e nodi di materia oscura (Zel\'dovich troncata, ΛCDM).', 'The cosmic web: filaments and nodes of dark matter (truncated Zel\'dovich, ΛCDM).')], [14, t('Il nodo più denso collassa in un alone: profilo NFW, la forma che hanno gli aloni nelle simulazioni.', 'The densest node collapses into a halo: NFW profile, the shape haloes have in simulations.')], [26, t('Dietro l\'alone, una galassia lontana: la massa piega la luce e quando sorgente e alone si allineano nasce l\'anello di Einstein.', 'Behind the halo, a distant galaxy: the mass bends the light and when source and halo align the Einstein ring is born.')], [34, t('Tre aloni-lente insieme, ognuno con il suo anello: così si mappa la materia oscura nel cielo.', 'Three lens haloes together, each with its ring: this is how dark matter is mapped on the sky.')], [40, t('Si torna alla rete: ogni nodo è un alone, ogni alone una lente possibile.', 'Back to the web: every node is a halo, every halo a possible lens.')]];
    function costruisci() {
      S.pulisci(); var gr = new T.Group(); S.aggiungi(gr);
      var N = 32, L = 200, R = MO().reteCosmica(N, L, 13, 3.0), M = N * N * N, base = new Float32Array(M * 3), dens = new Float32Array(M); MO().evolvi(R, 1, base, dens);
      /* il nodo più denso */
      var imax = 0; for (var i = 1; i < M; i++) if (dens[i] > dens[imax]) imax = i;
      var cx = base[imax * 3], cy = base[imax * 3 + 1], cz = base[imax * 3 + 2];
      for (var j = 0; j < M; j++) { base[j * 3] -= cx; base[j * 3 + 1] -= cy; base[j * 3 + 2] -= cz; for (var c = 0; c < 3; c++) { var v = base[j * 3 + c]; if (v > L / 2) v -= L; if (v < -L / 2) v += L; base[j * 3 + c] = v; } }
      /* le destinazioni nell'alone: le 6000 particelle più vicine al nodo, raggi NFW (c = 8, r₂₀₀ = 18 unità) */
      var dist = []; for (var k = 0; k < M; k++) dist.push([Math.hypot(base[k * 3], base[k * 3 + 1], base[k * 3 + 2]), k]); dist.sort(function (a, b) { return a[0] - b[0]; });
      var nAl = 6000, dest = new Float32Array(M * 3), inAlone = new Uint8Array(M), rnd = MO().mulberry(3), cN = 8, r200 = 18, m = function (x) { return Math.log(1 + x) - x / (1 + x); };
      for (var q = 0; q < nAl; q++) { var id = dist[q][1], u = rnd() * m(cN), lo = 0, hi = cN; for (var it = 0; it < 40; it++) { var md = (lo + hi) / 2; if (m(md) < u) lo = md; else hi = md; } var rr = lo * r200 / cN, uu = 2 * rnd() - 1, ph = 2 * PI * rnd(), sq = Math.sqrt(1 - uu * uu); dest[id * 3] = rr * sq * Math.cos(ph); dest[id * 3 + 1] = rr * sq * Math.sin(ph); dest[id * 3 + 2] = rr * uu * 0.85; inAlone[id] = 1; }
      var pos = new Float32Array(M * 3), col = new Float32Array(M * 3), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
      var pts = new T.Points(geo, new T.PointsMaterial({ size: 1.5, map: luce(T), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); gr.add(pts);
      /* le lenti: lo stesso shader della scheda 2, su piani dietro gli aloni */
      function lente(x, y, z, scala, te, q, ang) {
        var mat = new T.ShaderMaterial({ vertexShader: VERT3D, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { tipo: { value: 2 }, te: { value: te }, q: { value: q }, ang: { value: ang }, ks: { value: 0.6 }, rs: { value: 1.5 }, gam: { value: 0 }, phig: { value: 0 }, fov: { value: 6 }, tempo: { value: 0 }, kappaOn: { value: 0 }, luceOn: { value: 1 }, rSorg: { value: 0.28 }, ellS: { value: 0.7 }, sorg: { value: new T.Vector2(1.5, 0) } } });
        var pl = new T.Mesh(new T.PlaneGeometry(scala, scala), mat); pl.position.set(x, y, z); gr.add(pl); return pl;
      }
      var L1 = lente(0, 0, 0, 70, 1.25, 0.8, 0.4), L2 = lente(-60, 25, -10, 45, 1.0, 0.65, 1.2), L3 = lente(55, -20, 5, 45, 1.1, 0.9, 2.0);
      st = { pos: pos, col: col, geo: geo, base: base, dest: dest, inAlone: inAlone, dens: dens, lenti: [L1, L2, L3] };
      S.inquadra(170, 0.6, 1.25); S.gira = false;
      aggiorna(0);
    }
    function liscio(a, b, x) { var u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); }
    function aggiorna(dt) {
      if (!st) return;
      var tt = tempo, crollo = liscio(8, 14, tt) * (1 - liscio(34, 39, tt)), spegni = liscio(9, 13, tt) * (1 - liscio(34, 38, tt)), M = st.dens.length;
      for (var i = 0; i < M; i++) {
        var a = st.inAlone[i] ? crollo : 0, j = i * 3;
        st.pos[j] = st.base[j] * (1 - a) + st.dest[j] * a; st.pos[j + 1] = st.base[j + 1] * (1 - a) + st.dest[j + 1] * a; st.pos[j + 2] = st.base[j + 2] * (1 - a) + st.dest[j + 2] * a;
        var l = Math.log10(st.dens[i]), f = Math.max(0, Math.min(1, (l + 0.15) / 1.6)), k = (0.04 + 0.96 * Math.pow(f, 1.35)) * (st.inAlone[i] ? 1 : 1 - 0.85 * spegni) + (st.inAlone[i] ? 0.5 * crollo : 0);
        st.col[j] = (0.35 + 0.65 * f) * k; st.col[j + 1] = (0.12 + 0.75 * f * f) * k; st.col[j + 2] = (0.75 + 0.25 * f) * k;
      }
      st.geo.attributes.position.needsUpdate = true; st.geo.attributes.color.needsUpdate = true;
      /* le lenti: la prima compare dopo il crollo, la sorgente si allinea e nasce l'anello; poi le altre due */
      var a1 = liscio(13, 16, tt) * (1 - liscio(35, 38, tt)), a23 = liscio(25, 28, tt) * (1 - liscio(34, 37, tt));
      st.lenti.forEach(function (pl, k) {
        var U = pl.material.uniforms, vis = k === 0 ? a1 : a23; pl.visible = vis > 0.01; pl.scale.setScalar(Math.max(0.01, vis));
        var al = k === 0 ? 1.6 * (1 - liscio(15, 22, tt)) : 0.15 + 0.1 * Math.sin(tt * 0.7 + k);
        U.sorg.value.set(al * Math.cos(tt * 0.4 + k) + 0.02, al * 0.6 * Math.sin(tt * 0.4 + k)); U.ang.value = 0.4 + tt * 0.25 * (k ? -1 : 1); U.tempo.value = tt;
        pl.quaternion.copy(S.cam.quaternion);                                   /* il piano guarda sempre la telecamera */
      });
      S.vista.th += dt * 0.12; S.vista.r = 170 - 95 * liscio(9, 16, tt) * (1 - liscio(26, 29, tt)) - 20 * liscio(26, 29, tt) * (1 - liscio(34, 38, tt)) + 0 * tt;
      var fase = FASI.filter(function (x) { return tt < x[0]; })[0] || FASI[FASI.length - 1];
      info.innerHTML = '<b>' + num(tt, 1) + ' s</b> · ' + fase[1] + '<br><small>' + t('Le particelle e gli anelli sono calcolati con la fisica delle altre schede; i tempi della sequenza sono una regia, non tempi cosmici.', 'Particles and rings are computed with the physics of the other tabs; the sequence timing is direction, not cosmic time.') + '</small>';
      if (globale.document.activeElement !== cur) cur.value = tt;
      S.didascalia.textContent = t('Dalla materia oscura alla lente', 'From dark matter to the lens') + ' · ' + num(tt, 1) + ' s';
      S.sporca = true; S.avvia();
    }
    var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); g.dx.appendChild(attesa);
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
    L3.stile(); L3.caricaThree().then(function () {
      attesa.remove(); T = globale.THREE; S = new L3.Scena(g.dx, 0.85); g.dx.insertBefore(S.box, g.dx.firstChild); S.ren.setClearColor(0x010104, 1);
      setTimeout(function () { costruisci(); S.ogniFotogramma(function (dt) { if (!corre) return false; tempo = (tempo + dt) % 40; aggiorna(dt); return true; }); }, 0);
    }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
  }

  F.calcolo.materiaoscura = { immagineLente: immagineLente, parametriCasuali: parametriCasuali, bersaglio: bersaglio, daBersaglio: daBersaglio, Rete: Rete, fitFisico: fitFisico, dataset: dataset, normalizza: normalizza, diffAngolo: diffAngolo, PIX: PIX, FRAG: FRAG };
  F.sezione('sastrooscura', {
    titolo: ['🌑 Materia oscura e lenti gravitazionali', '🌑 Dark matter and gravitational lensing'],
    sotto: ['La rete cosmica che cresce dal campo primordiale, la luce piegata dalla massa invisibile in anelli e archi, una rete neurale che impara a leggere le lenti e la fisica che la verifica, le curve di rotazione che hanno rivelato la materia oscura.',
            'The cosmic web growing from the primordial field, light bent by invisible mass into rings and arcs, a neural network learning to read lenses and the physics that checks it, the rotation curves that revealed dark matter.'],
    schede: [
      { nome: ['La rete cosmica', 'The cosmic web'], costruisci: schedaRete },
      { nome: ['La lente gravitazionale', 'The gravitational lens'], costruisci: schedaLente },
      { nome: ['Fisica + apprendimento automatico', 'Physics + machine learning'], costruisci: schedaML },
      { nome: ['Curve di rotazione', 'Rotation curves'], costruisci: schedaRotazione },
      { nome: ['🎬 Dalla materia alla lente', '🎬 From matter to the lens'], costruisci: schedaCinema }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
