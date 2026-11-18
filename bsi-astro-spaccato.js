/* ═══════════════════════════════════════════════════════════════════════
   bsi-astro-spaccato.js — 🌟 Spaccati stellari (v260)
   BioSpecInfo · © Samuele Pio Provenzano

   Un motore riutilizzabile: un corpo celeste tagliato a spicchio mentre la
   sua composizione cambia per reazioni nucleari o processi fisici, con il
   grafico ad anello della composizione, l'orologio del tempo trascorso, le
   reazioni in sovraimpressione e un evento finale (collasso ed esplosione,
   nebulosa planetaria, esplosione senza residuo). Gli scenari sono DATI
   (bsi-astro-spaccato-scenari.js): supernova a collasso del nucleo, il Sole,
   stella massiccia → buco nero, supernova Ia, kilonova, nucleosintesi del
   Big Bang, la Terra che si differenzia, Giove, l'arricchimento galattico.

   API  BSISpaccato.crea(contenitore, scenario | id, opz) → { imposta, stato, scenario, distruggi }
        BSISpaccato.motore(S, T, box, scenario, opz)   (il solo disegno 3D, per BSICosmo)

   Tutto è funzione del tempo dell'animazione τ: trascinare la barra del
   tempo rimette la scena esattamente dove deve essere. Il ciclo si ferma
   quando la scena non è visibile (BSILab3D); «riduci movimento» toglie
   l'agitazione dei nuclei, la camera che si muove da sola e la partenza
   automatica. Nessuna apertura automatica: la sezione si apre solo da un
   gesto dell'utente (o da Spectra, quando l'utente glielo chiede).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;
  var t = F.t, PI = Math.PI;
  function DATI() { return g.BSISpaccatoDati; }
  var MENO_MOTO = false; try { MENO_MOTO = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }

  /* ═══ calcoli puri: la linea del tempo ═════════════════════════════════ */
  function easeIO(x) { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function liscio(a, b, x) { var u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); }
  function linea(sc) {
    var inizi = [], fisici = [], a = 0, f = 0;
    sc.stadi.forEach(function (s) { inizi.push(a); fisici.push(f); a += s.anim; f += s.dur; });
    return { inizi: inizi, fisici: fisici, fineStadi: a, fineFis: f, totale: a + ((sc.finale && sc.finale.anim) || 0) };
  }
  /** dove siamo al tempo d'animazione τ */
  function stato(sc, L, tau) {
    tau = Math.max(0, Math.min(L.totale, tau));
    if (tau >= L.fineStadi) return { i: sc.stadi.length - 1, u: 1, fin: true, uf: tau - L.fineStadi, tFis: L.fineFis, tau: tau };
    var i = 0; while (i < sc.stadi.length - 1 && L.inizi[i + 1] <= tau) i++;
    var u = (tau - L.inizi[i]) / sc.stadi[i].anim;
    return { i: i, u: u, fin: false, uf: 0, tFis: L.fisici[i] + u * sc.stadi[i].dur, tau: tau };
  }
  function mescolaComp(a, b, f) { var o = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { o[k] = (a[k] || 0) + ((b[k] || 0) - (a[k] || 0)) * f; }); return o; }
  /** composizione al tempo: calcolata (Ia dopo l'esplosione, BBN, galassia) o interpolata fra la fine di uno stadio e la fine del successivo */
  function composizione(sc, L, s) {
    var Dd = DATI(), st = sc.stadi[s.i];
    if (sc.id === 'ia' && st.dopo) { var tEsp = L.fisici[2] + sc.stadi[2].dur; return Dd.compIa(Math.max(0, s.tFis - tEsp)); }
    if (sc.id === 'bigbang') return Dd.compBBN(Math.max(1, s.tFis));
    if (sc.id === 'galassia') return Dd.compGal(s.tFis / (1e9 * Dd.ANNO));
    var prima = s.i ? sc.stadi[s.i - 1].comp : sc.comp0;
    return mescolaComp(prima, st.comp, easeIO(s.u));
  }

  /* ═══ formattazione ═════════════════════════════════════════════════════ */
  function loc() { return t('it-IT', 'en-US'); }
  function num(x, d) { return x.toLocaleString(loc(), { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  var APICI = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function sci(x) {
    if (!x) return '0'; var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e);
    if (e >= -2 && e <= 4) return num(x, x < 10 ? 1 : 0);
    var mm = Math.round(m * 10) / 10, me = String(e).split('').map(function (c) { return c === '-' ? '⁻' : APICI[+c]; }).join('');
    return (mm === 1 ? '' : num(mm, mm % 1 ? 1 : 0) + '·') + '10' + me;
  }
  var ANNO = 3.15576e7;
  function durata(s) {
    var a = Math.abs(s), seg = s < 0 ? '−' : '';
    if (a < 120) return seg + num(a, a < 10 ? 1 : 0) + ' s';
    if (a < 7200) return seg + num(a / 60, a < 600 ? 1 : 0) + ' min';
    if (a < 2 * 86400) return seg + num(a / 3600, 1) + t(' ore', ' h');
    if (a < 90 * 86400) return seg + num(a / 86400, a < 864000 ? 1 : 0) + t(' giorni', ' days');
    if (a < 2 * ANNO) return seg + num(a / (ANNO / 12), 1) + t(' mesi', ' months');
    var y = a / ANNO;
    if (y < 1e4) return seg + num(y, y < 10 ? 1 : 0) + t(' anni', ' yr');
    if (y < 1e9) return seg + num(y / 1e6, y < 1e7 ? 2 : 1) + t(' milioni di anni', ' million yr');
    return seg + num(y / 1e9, 2) + t(' miliardi di anni', ' billion yr');
  }
  function orologio(sc, L, s) {
    var tF = s.tFis;
    if (sc.orologio === 'anni') return '≈ ' + num(Math.round(tF / ANNO)) + t(' anni', ' yr');
    if (sc.orologio === 'secondi') return 't = ' + durata(tF);
    var z = sc.id === 'kilonova' ? L.fisici[1] : sc.id === 'ia' ? L.fisici[2] : 0, r = tF - z;
    return (r < 0 ? '' : '+') + durata(r) + (sc.id === 'kilonova' ? t(' dalla fusione', ' from merger') : t(' dall\'esplosione', ' from explosion'));
  }

  /* ═══ stile ═════════════════════════════════════════════════════════════ */
  function stile() {
    if (D.getElementById('bsiSP-stile')) return;
    var s = D.createElement('style'); s.id = 'bsiSP-stile';
    s.textContent =
      '.bsiSP{max-width:100%}.bsiSP-palco{position:relative;margin:0 auto;border-radius:12px;overflow:hidden;background:#05070d}' +
      '.bsiSP-palco .bsi3d-box{margin:0;border-radius:12px;background:#05070d}' +
      '.bsiSP-tit{position:absolute;left:0;right:0;top:12px;text-align:center;pointer-events:none;color:#fff;font:800 clamp(17px,4.6vw,24px)/1.15 system-ui,"Segoe UI",sans-serif;text-shadow:0 1px 4px #000}' +
      '.bsiSP-tit small{display:block;margin-top:4px;font:500 clamp(11px,3vw,13px)/1.3 system-ui,sans-serif;color:#c7d2e0}' +
      '.bsiSP-reaz{position:absolute;left:10px;top:64px;max-width:60%;pointer-events:none;font:500 10.5px/1.45 ui-monospace,Menlo,Consolas,monospace;color:#d7f7f3;text-shadow:0 1px 2px #000;opacity:.92}.bsiSP-reaz i{color:#9fb3c8;font-style:normal}' +
      '.bsiSP-hud{position:absolute;right:10px;top:64px;max-width:40%;text-align:right;pointer-events:none;font:500 10.5px/1.45 ui-monospace,Menlo,monospace;color:#ffd9a8;text-shadow:0 1px 2px #000}.bsiSP-hud b{display:block;color:#fff;font:700 11.5px/1.3 system-ui,sans-serif}' +
      '.bsiSP-dati{position:absolute;left:8px;right:8px;bottom:8px;display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(5,9,18,.72);border:1px solid rgba(120,150,190,.18);transition:opacity .5s}' +
      '.bsiSP-dati.via{opacity:0}.bsiSP-ciambella{flex:0 0 auto;width:clamp(96px,30vw,132px);height:auto}' +
      '.bsiSP-ciambella text{font:700 8px system-ui,sans-serif;fill:#05070d;pointer-events:none}' +
      '.bsiSP-dx{flex:1;min-width:0;color:#e6f2ff}.bsiSP-dx .et{font:600 9px system-ui,sans-serif;letter-spacing:.14em;color:#9fb3c8;text-transform:uppercase}' +
      '.bsiSP-dx .oro{font:800 clamp(15px,4.4vw,20px)/1.2 system-ui,sans-serif;color:#fff;font-variant-numeric:tabular-nums}.bsiSP-dx .sub{font:500 10px system-ui,sans-serif;color:#9fb3c8;margin-bottom:4px}' +
      '.bsiSP-leg{display:grid;grid-template-columns:auto 1fr auto;gap:1px 6px;font:500 11px/1.35 system-ui,sans-serif;align-items:center}.bsiSP-leg span.p{width:8px;height:8px;border-radius:50%}.bsiSP-leg em{font-style:normal;color:#9fb3c8;font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bsiSP-leg b{font-variant-numeric:tabular-nums;text-align:right}' +
      '.bsiSP-svg{position:absolute;inset:0;pointer-events:none;width:100%;height:100%}.bsiSP-svg text{font:700 10px ui-monospace,Menlo,monospace;letter-spacing:.12em;fill:#e6f2ff}' +
      '.bsiSP-com{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}.bsiSP-com button{min-height:40px;min-width:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;font:600 .85rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}' +
      '.bsiSP-com button[aria-pressed="true"]{border-color:#00c9b7;color:#00c9b7}.bsiSP-com label{display:flex;align-items:center;gap:6px;font:500 .82rem system-ui,sans-serif;color:#cfe3f7}' +
      '.bsiSP-com select{min-height:36px;border-radius:8px;background:#0a1b2e;color:#e6f2ff;border:1px solid #2a4a6e}' +
      '.bsiSP-tempo{width:100%;margin:2px 0 6px;accent-color:#00c9b7}' +
      '.bsiSP-scelte{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.bsiSP-scelte button{min-height:36px;border-radius:18px;border:1px solid #2a4a6e;background:#0a1b2e;color:#cfe3f7;font:600 .8rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}.bsiSP-scelte button[aria-pressed="true"]{border-color:#ffb547;color:#ffb547}' +
      '.bsiSP-fonti{font:500 .74rem/1.5 system-ui,sans-serif;color:#9fb3c8;margin:6px 0 0;padding-left:18px}' +
      '@media (prefers-reduced-motion: reduce){.bsiSP-dati{transition:none}}';
    D.head.appendChild(s);
  }

  /* ═══ shader ════════════════════════════════════════════════════════════ */
  var RUMORE = [
    'vec3 h33(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p)*43758.5453); }',
    'float h31(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719)))*43758.5453); }',
    'float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);',
    '  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y), mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }',
    'float fbm(vec3 x){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a*vn(x); x = x*2.03 + 1.7; a *= 0.5; } return s; }',
    'vec2 voronoi(vec3 x, float t){ vec3 p = floor(x), f = fract(x); float d1 = 8., d2 = 8.;',
    '  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec3 b = vec3(float(i), float(j), float(k)); vec3 o = h33(p + b); o = 0.5 + 0.45*sin(t + 6.2831*o); vec3 r = b + o - f; float d = dot(r, r);',
    '    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }',
    '  return vec2(sqrt(d1), sqrt(d2)); }'
  ].join('\n');
  function matSuperficie(T) {
    return new T.ShaderMaterial({
      uniforms: { uCol: { value: new T.Color(1, 0.7, 0.3) }, uCol2: { value: new T.Color(0.35, 0.06, 0.06) }, uTempo: { value: 0 }, uScala: { value: 9 }, uModo: { value: 0 }, uCaldo: { value: 0 }, uOpac: { value: 1 } },
      vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: ['uniform vec3 uCol; uniform vec3 uCol2; uniform float uTempo; uniform float uScala; uniform float uModo; uniform float uCaldo; uniform float uOpac; varying vec3 vP; varying vec3 vN; varying vec3 vV;', RUMORE,
        'void main(){ vec3 q = normalize(vP); float mu = clamp(dot(normalize(vN), normalize(vV)), 0., 1.); vec3 col; float a = uOpac;',
        '  if (uModo < 0.5) { vec2 v = voronoi(q*uScala, uTempo*0.5); float bordo = smoothstep(0.0, 0.2, v.y - v.x); vec2 v2 = voronoi(q*uScala*3.1 + 7., uTempo*0.8); float fine = smoothstep(0.0, 0.25, v2.y - v2.x);',
        '    float gr = clamp(0.3 + 0.7*bordo*(0.8 + 0.2*fine) - 0.2*v.x, 0., 1.); col = mix(uCol2, uCol, gr); col *= 1. - 0.6*(1. - mu); col = mix(col, uCol2*0.6, pow(1. - mu, 3.)*0.5); }',
        '  else if (uModo < 1.5) { col = uCol*(0.82 + 0.18*fbm(q*6. + uTempo*0.05)); col *= 1. - 0.35*(1. - mu); }',
        '  else if (uModo < 2.5) { float n = fbm(q*3.5 + vec3(0., 0., uTempo*0.02)); col = mix(uCol2, uCol, smoothstep(0.35, 0.65, n)); float cr = 1. - smoothstep(0.0, 0.035, abs(n - 0.5)); col = col*(0.35 + 0.65*mu) + vec3(1., 0.45, 0.12)*cr*uCaldo*0.85; }',
        '  else if (uModo < 3.5) { float b = sin(q.y*16. + 2.6*fbm(q*vec3(2., 6., 2.) + vec3(uTempo*0.04, 0., 0.))); col = mix(uCol2, uCol, 0.5 + 0.5*b); col *= 0.4 + 0.6*mu; }',
        '  else { float n = fbm(q*2.6 + vec3(uTempo*0.03)); col = uCol*(0.45 + 0.8*n); a = uOpac*(0.25 + 0.6*n)*(0.45 + 0.55*(1. - mu)); }',
        '  gl_FragColor = vec4(min(col, vec3(0.93)), a); }'].join('\n'),
      side: 2, transparent: true
    });
  }
  function matPareti(T) {
    var R = [], C = []; for (var i = 0; i < 8; i++) { R.push(0); C.push(new T.Color(1, 1, 1)); }
    return new T.ShaderMaterial({
      uniforms: { uR: { value: R }, uC: { value: C }, uN: { value: 0 }, uNuc: { value: 0.2 }, uTempo: { value: 0 }, uStrati: { value: 1 }, uScuro: { value: 0 }, uRame: { value: new T.Color(0.95, 0.5, 0.22) }, uOpac: { value: 1 } },
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: ['uniform float uR[8]; uniform vec3 uC[8]; uniform float uN; uniform float uNuc; uniform float uTempo; uniform float uStrati; uniform float uScuro; uniform vec3 uRame; uniform float uOpac; varying vec2 vQ;',
        'void main(){ float r = length(vQ); vec3 base = mix(uRame*1.12, uRame*0.55, r); vec3 col = base;',
        '  if (uStrati > 0.5) { vec3 lc = uC[0]; for (int i = 0; i < 8; i++) { if (float(i) < uN && r < uR[i]) lc = uC[i]; } lc = mix(lc, uRame, 0.3); col = mix(base, lc*(0.75 + 0.4*(1. - r)), 0.42);',
        '    for (int i = 1; i < 8; i++) { if (float(i) < uN && uR[i] > 0.001) col += vec3(1., 0.86, 0.62)*0.42*exp(-abs(r - uR[i])*260.); } }',
        '  else { for (int i = 1; i < 8; i++) { if (float(i) < uN && uR[i] > 0.001) col += vec3(1., 0.8, 0.55)*0.14*exp(-abs(r - uR[i])*300.); } }',
        '  col *= 1. + 0.035*sin(r*70. - uTempo*1.2);',
        '  float nuc = 1. - smoothstep(uNuc*0.86, uNuc, r); vec3 cav = mix(vec3(0.22, 0.10, 0.17), vec3(0.04, 0.02, 0.04), uScuro);',
        '  col = mix(col, cav, nuc); col += vec3(1., 0.72, 0.5)*0.22*exp(-abs(r - uNuc)*110.)*(1. - 0.7*uScuro);',
        '  col *= 1. - 0.25*smoothstep(0.97, 1., r); gl_FragColor = vec4(min(col, vec3(0.92)), uOpac); }'].join('\n'),
      side: 2, transparent: true
    });
  }
  function matPunti(T, colore) {
    return new T.ShaderMaterial({
      uniforms: { uR: { value: 1 }, uT: { value: 0 }, uAg: { value: 1 }, uMis: { value: 26 }, uOpac: { value: 1 } },
      vertexShader: 'attribute vec3 aB; attribute vec3 aC; attribute float aF; uniform float uR; uniform float uT; uniform float uAg; uniform float uMis; varying vec3 vC;' +
        'void main(){ vec3 j = vec3(sin(uT*7.0 + aF*13.0), sin(uT*6.1 + aF*29.0), sin(uT*8.3 + aF*7.0))*0.07*uAg; vec4 mv = modelViewMatrix*vec4(aB*uR + j*uR, 1.); vC = aC; gl_PointSize = uMis*(1.0/max(0.2, -mv.z)); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform float uOpac; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = smoothstep(0.5, 0.2, r); gl_FragColor = vec4(vC*(0.75 + 0.35*(0.5 - r)), a*uOpac); }',
      transparent: true, depthWrite: false
    });
  }
  /** il guscio espulso: punti su una superficie frastagliata che si allarga e si raffredda */
  function matGuscio(T) {
    return new T.ShaderMaterial({
      uniforms: { uR: { value: 0 }, uCaldo: { value: 1 }, uOpac: { value: 0 }, uMis: { value: 240 }, uC1: { value: new T.Color(1, 0.85, 0.45) }, uC2: { value: new T.Color(0.95, 0.38, 0.12) }, uC3: { value: new T.Color(0.62, 0.12, 0.07) }, uSchiaccia: { value: 1 }, uDens: { value: 1 } },
      vertexShader: 'attribute vec3 aD; attribute float aK; attribute float aS; uniform float uR; uniform float uMis; uniform float uSchiaccia; varying float vK;' +
        'void main(){ vec3 p = aD*uR*aK; p.z *= uSchiaccia; vec4 mv = modelViewMatrix*vec4(p, 1.); vK = aK; gl_PointSize = uMis*aS*(1.0/max(0.2, -mv.z)); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform float uCaldo; uniform float uOpac; uniform float uDens; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; varying float vK; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = pow(smoothstep(0.5, 0.0, r), 1.6);' +
        ' vec3 c = mix(uC3, uC2, smoothstep(0.0, 0.5, uCaldo)); c = mix(c, uC1, smoothstep(0.5, 1.0, uCaldo)*(1.2 - vK*0.5)); gl_FragColor = vec4(c*0.8, a*uOpac*0.16*uDens); }',
      transparent: true, depthWrite: false, blending: T.AdditiveBlending
    });
  }

  /* ═══ pezzi di disegno ═════════════════════════════════════════════════ */
  function rnd32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function sprite(T, disegna, colore, add) {
    var cv = D.createElement('canvas'); cv.width = cv.height = 128; disegna(cv.getContext('2d'), 128);
    var tx = new T.CanvasTexture(cv); tx.minFilter = T.LinearFilter;
    return new T.Sprite(new T.SpriteMaterial({ map: tx, color: colore || 0xffffff, transparent: true, depthWrite: false, depthTest: !add ? false : true, blending: add ? T.AdditiveBlending : T.NormalBlending }));
  }
  function alone(q, n) { var gr = q.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.45)'); gr.addColorStop(0.6, 'rgba(255,255,255,.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, n, n); }
  function raggi(q, n) { alone(q, n); q.strokeStyle = 'rgba(255,255,255,.75)'; q.lineWidth = 1.6; for (var k = 0; k < 4; k++) { var a = k * PI / 2 + PI / 4; q.beginPath(); q.moveTo(n / 2, n / 2); q.lineTo(n / 2 + Math.cos(a) * n * 0.48, n / 2 + Math.sin(a) * n * 0.48); q.stroke(); } }
  function anello(q, n) { var c = n / 2; for (var i = 0; i < 360; i += 2) { var a = i * PI / 180, k = 0.55 + 0.45 * Math.max(0, Math.cos(a - 0.3)); q.strokeStyle = 'rgba(255,' + Math.round(170 + 60 * k) + ',' + Math.round(110 + 60 * k) + ',' + (0.25 + 0.7 * k).toFixed(2) + ')'; q.lineWidth = 3.5; q.beginPath(); q.arc(c, c, n * 0.33, a, a + 0.04); q.stroke(); } }
  var CACHE_ET = {};
  function etichetta(T, sim) {
    var Cm = DATI().COMP[sim] || { c: '#ccc' };
    if (!CACHE_ET[sim]) {
      var cv = D.createElement('canvas'); cv.width = cv.height = 128; var q = cv.getContext('2d');
      q.fillStyle = 'rgba(18,12,28,.88)'; q.strokeStyle = Cm.c; q.lineWidth = 6; if (q.roundRect) { q.beginPath(); q.roundRect(8, 8, 112, 112, 14); q.fill(); q.stroke(); } else { q.fillRect(8, 8, 112, 112); q.strokeRect(8, 8, 112, 112); }
      q.fillStyle = '#fff'; q.font = 'bold ' + (sim.length > 2 ? 40 : 58) + 'px system-ui,sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(sim, 64, 70);
      if (Cm.Z != null) { q.font = '600 20px system-ui,sans-serif'; q.fillStyle = '#c9b8e8'; q.textAlign = 'left'; q.fillText(String(Cm.Z), 20, 30); }
      var tx = new T.CanvasTexture(cv); tx.minFilter = T.LinearFilter; CACHE_ET[sim] = tx;
    }
    var sp = new T.Sprite(new T.SpriteMaterial({ map: CACHE_ET[sim], transparent: true, depthTest: false, depthWrite: false })); sp.renderOrder = 20; return sp;
  }
  function colore(T, sim) { var c = (DATI().COMP[sim] || { c: '#888888' }).c; return new T.Color(c); }

  /* ═══ il motore 3D ═════════════════════════════════════════════════════ */
  function motore(S, T, box, sc, opz) {
    opz = opz || {};
    var Dd = DATI(), L = linea(sc), rnd = rnd32(7), radice = new T.Group(); S.aggiungi(radice);
    S.ren.setClearColor(0x05070d, 1);
    var tipo = sc.corpo.tipo;
    /* cielo */
    (function () { var n = 1600, p = new Float32Array(n * 3), r2 = rnd32(3); for (var i = 0; i < n; i++) { var z = 2 * r2() - 1, a = 2 * PI * r2(), s = Math.sqrt(1 - z * z), R = 60; p[3 * i] = R * s * Math.cos(a); p[3 * i + 1] = R * s * Math.sin(a); p[3 * i + 2] = R * z; }
      var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(p, 3)); radice.add(new T.Points(gg, new T.PointsMaterial({ color: 0x8090a8, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false }))); })();
    /* il corpo tagliato: superficie con uno spicchio tolto (x < 0, z < 0 locali) e le due pareti a mezzo disco */
    var corpo = new T.Group(); corpo.rotation.x = PI / 2; radice.add(corpo);
    var mSup = matSuperficie(T), sup = new T.Mesh(new T.SphereGeometry(1, 96, 64, 0, PI * 1.5), mSup); corpo.add(sup);
    var mPar = matPareti(T), p1 = new T.Mesh(new T.CircleGeometry(1, 96, PI / 2, PI), mPar), p2 = new T.Mesh(new T.CircleGeometry(1, 96, PI / 2, PI), mPar); p2.rotation.y = -PI / 2; corpo.add(p1); corpo.add(p2);
    var MODI = { stella: 0, nana: 1, pianeta: 2, gigante: 3, universo: 4, nube: 4, binaria: 4 };
    mSup.uniforms.uModo.value = MODI[tipo] || 0; mSup.uniforms.uScala.value = tipo === 'stella' ? 20 : 9;
    var cb = new T.Color(sc.corpo.colore || '#ffb347'); mSup.uniforms.uCol.value.copy(cb);
    mSup.uniforms.uCol2.value.copy(tipo === 'stella' ? new T.Color(0.42, 0.08, 0.07) : tipo === 'pianeta' ? new T.Color(0.12, 0.07, 0.05) : tipo === 'gigante' ? new T.Color(0.55, 0.36, 0.24) : cb.clone().multiplyScalar(0.5));
    if (tipo === 'universo') mSup.uniforms.uOpac.value = 0.9;
    if (tipo === 'pianeta') mPar.uniforms.uRame.value.setRGB(0.75, 0.45, 0.28);
    if (tipo === 'gigante') mPar.uniforms.uRame.value.setRGB(0.72, 0.6, 0.48);
    if (tipo === 'universo' || tipo === 'nube' || tipo === 'binaria') mPar.uniforms.uRame.value.setRGB(0.55, 0.62, 0.8);
    var bagl = sprite(T, alone, cb.getHex(), true); bagl.material.opacity = tipo === 'stella' ? 0.32 : 0.2; radice.add(bagl);
    /* gli strati a cipolla */
    var strati = sc.strati.slice(), mostraStrati = opz.strati !== false;
    strati.forEach(function (s, i) { if (i < 8) mPar.uniforms.uC.value[i].copy(colore(T, s.el)); });
    mPar.uniforms.uN.value = Math.min(8, strati.length);
    /* i nuclei nel nucleo: punti istanziati con colore campionato dalla composizione */
    var NP = 520, bP = new Float32Array(NP * 3), cP = new Float32Array(NP * 3), fP = new Float32Array(NP), uP = [];
    for (var i = 0; i < NP; i++) { var x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1); bP[3 * i] = -Math.abs(x) * 0.9; bP[3 * i + 1] = y * 0.9; bP[3 * i + 2] = -Math.abs(z) * 0.9; fP[i] = rnd(); uP.push(rnd()); }
    var gP = new T.BufferGeometry(); gP.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3)); gP.setAttribute('aB', new T.BufferAttribute(bP, 3)); gP.setAttribute('aC', new T.BufferAttribute(cP, 3)); gP.setAttribute('aF', new T.BufferAttribute(fP, 1));
    var mP = matPunti(T); mP.uniforms.uMis.value *= (S.ren.getPixelRatio ? S.ren.getPixelRatio() : 1); var punti = new T.Points(gP, mP); punti.frustumCulled = false; corpo.add(punti); if (sc.id === 'giove') punti.visible = false;
    if (MENO_MOTO) mP.uniforms.uAg.value = 0.15;
    /* le etichette dei nuclei appena formati */
    var etichette = [];
    /* la pioggia (ferro nella Terra, elio in Giove) */
    var NG = 160, gG = new T.BufferGeometry(), pG = new Float32Array(NG * 3), sG = []; for (i = 0; i < NG; i++) { var a = PI / 2 + rnd() * PI, b = rnd(); sG.push([Math.cos(a), Math.sin(a), b, rnd()]); }
    gG.setAttribute('position', new T.BufferAttribute(pG, 3)); var pioggia = new T.Points(gG, new T.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.9, depthWrite: false })); pioggia.visible = false; corpo.add(pioggia);
    /* collasso: linee tratteggiate radiali nei piani del taglio */
    var tratti = new T.Group(); corpo.add(tratti); tratti.visible = false;
    for (i = 0; i < 12; i++) { var an = PI / 2 + (i % 6 + 0.5) * PI / 6, d = i < 6 ? [Math.cos(an), Math.sin(an), 0] : [0, Math.sin(an), Math.cos(an) > 0 ? -Math.cos(an) : Math.cos(an)]; var gl = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(d[0], d[1], d[2])]); var ln = new T.Line(gl, new T.LineDashedMaterial({ color: 0xffffff, dashSize: 0.05, gapSize: 0.04, transparent: true, opacity: 0.8 })); ln.computeLineDistances(); tratti.add(ln); }
    /* esplosione: lampo, guscio, residuo */
    var lampo = sprite(T, alone, 0xcfe6ff, true); lampo.visible = false; radice.add(lampo);
    var NS_ = 16000, gS = new T.BufferGeometry(), dS = new Float32Array(NS_ * 3), kS = new Float32Array(NS_), mS_ = new Float32Array(NS_);
    for (i = 0; i < NS_; i++) { var zz = 2 * rnd() - 1, aa = 2 * PI * rnd(), ss = Math.sqrt(1 - zz * zz), dx = ss * Math.cos(aa), dy = ss * Math.sin(aa); dS[3 * i] = dx; dS[3 * i + 1] = dy; dS[3 * i + 2] = zz;
      var fr = 0.5 * Math.sin(3 * dx + 2 * dy) * Math.cos(4 * zz + dx) + 0.3 * Math.sin(7 * dy - 5 * zz) + 0.2 * Math.sin(11 * dx + 9 * zz); kS[i] = 0.82 + 0.16 * fr + 0.14 * (rnd() - 0.5) * (1 + rnd()); mS_[i] = 0.35 + 0.8 * rnd() * rnd(); }
    gS.setAttribute('position', new T.BufferAttribute(new Float32Array(NS_ * 3), 3)); gS.setAttribute('aD', new T.BufferAttribute(dS, 3)); gS.setAttribute('aK', new T.BufferAttribute(kS, 1)); gS.setAttribute('aS', new T.BufferAttribute(mS_, 1));
    var pr = S.ren.getPixelRatio ? S.ren.getPixelRatio() : 1, mG = matGuscio(T), guscio = new T.Points(gS, mG); guscio.frustumCulled = false; mG.uniforms.uMis.value *= pr; guscio.visible = false; radice.add(guscio);
    if (tipo === 'stella' && sc.id === 'sole') { mG.uniforms.uC1.value.setRGB(0.55, 1, 0.92); mG.uniforms.uC2.value.setRGB(0.3, 0.85, 0.85); mG.uniforms.uC3.value.setRGB(0.95, 0.3, 0.35); }
    if (sc.id === 'kilonova') { mG.uniforms.uC1.value.setRGB(0.6, 0.85, 1); mG.uniforms.uC2.value.setRGB(0.9, 0.45, 0.25); mG.uniforms.uC3.value.setRGB(0.55, 0.1, 0.08); }
    var stellaN = sprite(T, raggi, 0xd8ecff, true); stellaN.visible = false; radice.add(stellaN);
    var buco = new T.Mesh(new T.SphereGeometry(0.16, 32, 24), new T.MeshBasicMaterial({ color: 0x000000 })); buco.visible = false; radice.add(buco);
    var anelloBH = sprite(T, anello, 0xffffff, true); anelloBH.visible = false; radice.add(anelloBH);
    var nanaB = new T.Mesh(new T.SphereGeometry(0.06, 24, 16), new T.MeshBasicMaterial({ color: 0xe8f4ff })); nanaB.visible = false; radice.add(nanaB);
    var espulsi = [];
    /* compagna (Ia) e flusso di gas */
    var compagna = null, flusso = null, disco = null, pF = null, NF = 260;
    if (sc.corpo.compagna) {
      var mC = matSuperficie(T); mC.uniforms.uCol.value.setRGB(1, 0.62, 0.3); mC.uniforms.uCol2.value.setRGB(0.4, 0.08, 0.05); mC.uniforms.uScala.value = 6;
      compagna = new T.Mesh(new T.SphereGeometry(0.85, 48, 32), mC); compagna.position.set(-1.75, -0.95, 0.3); radice.add(compagna);
      pF = new Float32Array(NF * 3); var gF = new T.BufferGeometry(); gF.setAttribute('position', new T.BufferAttribute(pF, 3));
      flusso = new T.Points(gF, new T.PointsMaterial({ color: 0xffb070, size: 0.05, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending })); radice.add(flusso);
      disco = new T.Mesh(new T.RingGeometry(0.26, 0.68, 96), new T.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0.18, side: 2, depthWrite: false, blending: T.AdditiveBlending })); radice.add(disco);
    }
    /* binaria di stelle di neutroni (kilonova) e onde gravitazionali */
    var ns1 = null, ns2 = null, onde = [];
    if (tipo === 'binaria') {
      ns1 = new T.Mesh(new T.SphereGeometry(0.11, 24, 16), new T.MeshBasicMaterial({ color: 0xdbeaff })); ns2 = ns1.clone(); radice.add(ns1); radice.add(ns2);
      [ns1, ns2].forEach(function (n) { var a = sprite(T, alone, 0x9fc8ff, true); a.scale.set(0.6, 0.6, 1); a.material.opacity = 0.5; n.add(a); });
      for (i = 0; i < 5; i++) { var pts = []; for (var k = 0; k <= 96; k++) pts.push(new T.Vector3(Math.cos(k / 96 * 2 * PI), Math.sin(k / 96 * 2 * PI), 0)); var lo = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.3 })); radice.add(lo); onde.push(lo); }
    }
    /* stelle che nascono e muoiono nella nube (galassia) */
    var lucciole = [];
    if (tipo === 'nube') for (i = 0; i < 40; i++) { var sp = sprite(T, alone, 0xfff0d0, true); sp.position.set(-Math.abs(rnd() * 0.8), (rnd() - 0.5) * 1.4, -Math.abs(rnd() * 0.8)); sp.userData = { f: rnd(), g: Math.floor(rnd() * 9) + 1 }; sp.scale.set(0.12, 0.12, 1); corpo.add(sp); lucciole.push(sp); }

    var tempo = 0, ultimoI = -1, comp = sc.comp0, s = stato(sc, L, 0), esplosoI = -1;
    sc.stadi.forEach(function (st, j) { if (st.esplode && esplosoI < 0) esplosoI = j; });
    function raggioVis(st) { return st && st.raggio ? 1 + 0.32 * Math.log10(st.raggio) : 1; }
    function aggiornaColori(c) {
      var ch = Object.keys(c).filter(function (k) { return c[k] > 0.05; }), tot = ch.reduce(function (a, k) { return a + c[k]; }, 0) || 1, col = gP.attributes.aC.array;
      var cum = [], acc = 0; ch.forEach(function (k) { acc += c[k] / tot; cum.push([acc, colore(T, k)]); });
      for (var j = 0; j < NP; j++) { var u = uP[j], cc = cum[cum.length - 1][1]; for (var m = 0; m < cum.length; m++) if (u <= cum[m][0]) { cc = cum[m][1]; break; } col[3 * j] = Math.min(1, cc.r * 1.1 + 0.08); col[3 * j + 1] = Math.min(1, cc.g * 1.05 + 0.06); col[3 * j + 2] = Math.min(1, cc.b * 1.05 + 0.08); }
      gP.attributes.aC.needsUpdate = true;
    }
    function etichetteStadio(i0, u0) {
      var voglio = (sc.stadi[i0].nuovi || []).slice(0, 5), vita = Math.min(1.8, sc.stadi[i0].anim * 0.9), tt0 = u0 * sc.stadi[i0].anim;
      while (etichette.length < voglio.length) { etichette.push(null); }
      etichette.forEach(function (e, j) {
        var simb = voglio[j];
        if (!simb) { if (e) e.visible = false; return; }
        if (!e || e.userData.s !== simb) { if (e) { corpo.remove(e); e.material.dispose(); } e = etichetta(T, simb); e.userData.s = simb; var q = (j * 97) % NP; e.userData.q = q; corpo.add(e); etichette[j] = e; }
        var q2 = e.userData.q, x0 = bP[3 * q2], y0 = bP[3 * q2 + 1], z0 = bP[3 * q2 + 2], rr = mP.uniforms.uR.value;
        e.position.set(x0 * rr * 1.05 - 0.04, y0 * rr * 1.05, z0 * rr * 1.05 - 0.04);
        var dt0 = tt0 - j * 0.18, op = dt0 < 0 ? 0 : dt0 < 0.3 ? dt0 / 0.3 : dt0 < vita ? 1 : Math.max(0, 1 - (dt0 - vita) / 0.5);
        e.material.opacity = op; e.visible = op > 0.01; var sz = 0.11 * Math.max(0.6, Math.min(1.4, rr * 3)); e.scale.set(sz, sz, 1);
      });
    }
    function nascondiEtichette() { etichette.forEach(function (e) { if (e) e.visible = false; }); }

    var risultato = { hud: '', reazioni: [], nota: '', fase: '', residuo: null };
    function imposta(tau, dt) {
      dt = dt || 0; tempo += dt;
      s = stato(sc, L, tau); var st = sc.stadi[s.i], prec = s.i ? sc.stadi[s.i - 1] : null, u = s.fin ? 1 : s.u;
      comp = composizione(sc, L, s); aggiornaColori(comp);
      mSup.uniforms.uTempo.value = tempo; mPar.uniforms.uTempo.value = tempo; mP.uniforms.uT.value = MENO_MOTO ? 0 : tempo;
      /* raggio del corpo (il Sole si gonfia), colore */
      var rv = (prec ? raggioVis(prec) : 1) + (raggioVis(st) - (prec ? raggioVis(prec) : 1)) * easeIO(u), sc0 = rv;
      if (st.colore) mSup.uniforms.uCol.value.set(st.colore);
      if (tipo === 'pianeta') mSup.uniforms.uCaldo.value = Math.max(0, Math.min(1, ((prec ? prec.Tsup : 1500) + ((st.Tsup || 300) - (prec ? prec.Tsup : 1500)) * u - 600) / 1800));
      if (tipo === 'universo') { var Tk = Dd.Tbbn(Math.max(1, s.tFis)), f = Math.max(0, Math.min(1, Math.log10(Tk / 1e8) / 2.1)); mSup.uniforms.uCol.value.setRGB(0.6 + 0.35 * f, 0.3 + 0.55 * f, 0.18 + 0.6 * f); sc0 = 0.7 + 0.35 * Math.log10(Math.max(1, s.tFis)) / 3.1; }
      /* gli strati crescono durante lo stadio in cui nascono */
      strati.forEach(function (sl, j) {
        if (j >= 8) return; var cresce = sl.da > s.i ? 0 : sl.da < s.i ? 1 : easeIO(u * 1.4);
        mPar.uniforms.uR.value[j] = sl.da === 0 && j === 0 ? sl.r : sl.r * cresce;
      });
      mPar.uniforms.uStrati.value = mostraStrati ? 1 : 0;
      var rNuc = (prec ? (prec.rNuc || 0.3) : (st.rNuc || 0.3)) + ((st.rNuc || 0.3) - (prec ? (prec.rNuc || 0.3) : (st.rNuc || 0.3))) * easeIO(u);
      mPar.uniforms.uNuc.value = (tipo === 'pianeta' || tipo === 'gigante' || tipo === 'universo' || tipo === 'nube' || sc.id === 'ia' || tipo === 'binaria') ? 0 : rNuc;
      mPar.uniforms.uScuro.value = Math.max(0, Math.min(1, ((comp.Fe || 0) - 30) / 60));
      mP.uniforms.uR.value = rNuc; mP.uniforms.uMis.value = ((tipo === 'universo' || tipo === 'nube') ? 30 : 24) * (S.ren.getPixelRatio ? S.ren.getPixelRatio() : 1);
      /* etichette all'inizio di ogni stadio */
      if (!s.fin) etichetteStadio(s.i, s.u); else nascondiEtichette();
      /* pioggia */
      var pg = st.pioggia || (sc.id === 'terra' && s.i === 1 ? { el: 'Fe', da: 0.97, a: 0.56 } : sc.id === 'giove' && s.i === 3 ? { el: 'He', da: 0.82, a: 0.45 } : null);
      pioggia.visible = !!pg && !s.fin;
      if (pg) { pioggia.material.color.copy(colore(T, pg.el)); var arr = gG.attributes.position.array; for (var j = 0; j < NG; j++) { var q = sG[j], fr = ((MENO_MOTO ? 0 : tempo) * 0.35 + q[3]) % 1, r = pg.da - (pg.da - pg.a) * fr, zr = q[2] < 0.5 ? 0 : 1; if (zr) { arr[3 * j] = 0; arr[3 * j + 1] = q[1] * r; arr[3 * j + 2] = -Math.abs(q[0]) * r; } else { arr[3 * j] = q[0] * r; arr[3 * j + 1] = q[1] * r; arr[3 * j + 2] = 0.002; } } gG.attributes.position.needsUpdate = true; }
      /* compagna e flusso (Ia, prima dell'esplosione) */
      var esploso = esplosoI >= 0 && s.i >= esplosoI;
      if (compagna) {
        compagna.visible = !esploso || s.u < 0.1 && s.i === esplosoI; flusso.visible = disco.visible = s.i === 0; mC_t(tempo);
        if (s.i === 0) { var P0 = compagna.position, dl = Math.hypot(P0.x, P0.y, P0.z), A1 = [P0.x * (1 - 0.85 / dl), P0.y * (1 - 0.85 / dl), P0.z * (1 - 0.85 / dl)], Q1 = [-P0.y / dl * 0.6, P0.x / dl * 0.6, 0], C1 = [(A1[0] + Q1[0]) / 2 + Q1[0] * 0.5, (A1[1] + Q1[1]) / 2 + Q1[1] * 0.5, 0.12];
          for (var k = 0; k < NF; k++) { var w = ((MENO_MOTO ? 0.5 : tempo * 0.3) + k / NF) % 1, a0 = (1 - w) * (1 - w), a1 = 2 * w * (1 - w), a2 = w * w, jit = (k % 7 - 3) * 0.006; pF[3 * k] = a0 * A1[0] + a1 * C1[0] + a2 * Q1[0] + jit; pF[3 * k + 1] = a0 * A1[1] + a1 * C1[1] + a2 * Q1[1] - jit; pF[3 * k + 2] = a0 * A1[2] + a1 * C1[2] + a2 * Q1[2]; }
          flusso.geometry.attributes.position.needsUpdate = true; disco.rotation.z = tempo * 0.4; }
      }
      /* binaria che spiraleggia */
      if (ns1) {
        var spir = s.i === 0 && !s.fin; ns1.visible = ns2.visible = spir; onde.forEach(function (o) { o.visible = spir; });
        if (spir) { var tc = 1 - s.u, sep = Math.max(0.12, 1.5 * Math.pow(tc + 0.0005, 0.25)), fase = (1 - Math.pow(tc + 0.0005, 0.625)) * 90; ns1.position.set(sep / 2 * Math.cos(fase), sep / 2 * Math.sin(fase), 0); ns2.position.set(-ns1.position.x, -ns1.position.y, 0);
          var per = 0.25 + 1.2 * Math.pow(tc, 0.375); onde.forEach(function (o, j) { var ph = ((tempo / per) + j / onde.length) % 1, R = 0.3 + ph * 5; o.scale.set(R, R, 1); o.material.opacity = 0.35 * (1 - ph); }); }
      }
      /* il corpo: visibile prima dell'esplosione; nel caso di Ia e kilonova diventa la nube dei prodotti, stratificata */
      var corpoVis = true, scala = sc0 * (tipo === 'nana' && !esploso ? 0.42 : 1);
      if (tipo === 'binaria') corpoVis = s.i >= 1;
      if (esploso && esplosoI >= 0) { var eta = s.tau - L.inizi[esplosoI]; scala = 0.35 + 1.0 * (1 - Math.exp(-eta / 1.2)) + 0.05 * eta; mSup.uniforms.uModo.value = 4; mSup.uniforms.uOpac.value = Math.max(0.25, 0.75 - eta * 0.05); }
      else { mSup.uniforms.uModo.value = MODI[tipo] || 0; if (tipo !== 'universo') mSup.uniforms.uOpac.value = 1; }
      /* l'evento finale */
      var fin = sc.finale || { tipo: 'nessuno' }, uf = s.uf; tratti.visible = false; lampo.visible = false; stellaN.visible = buco.visible = anelloBH.visible = nanaB.visible = false; guscio.visible = false;
      risultato.fase = s.fin ? fin.tipo : 'stadio'; risultato.residuo = null;
      if (s.fin && fin.tipo === 'collasso') {
        var cc = Math.min(1, uf / 1.0); scala = 1 - 0.5 * easeIO(cc); mPar.uniforms.uNuc.value = 0.08 * (1 - 0.6 * cc); mPar.uniforms.uScuro.value = 1;
        tratti.visible = uf < 1.35; tratti.children.forEach(function (l, j) { var fz = ((uf * 1.4) + j * 0.07) % 1; l.scale.setScalar(0.15 + 0.85 * fz); l.material.opacity = 0.85 * (1 - fz) * (uf < 1.2 ? 1 : (1.35 - uf) / 0.15); });
        corpoVis = uf < 1.35;
        if (uf > 1.15 && uf < 1.9) { lampo.visible = true; var fl = uf < 1.3 ? (uf - 1.15) / 0.15 : 1 - (uf - 1.3) / 0.6; lampo.material.opacity = (MENO_MOTO ? 0.4 : 0.8) * Math.max(0, fl); var ls = 0.8 + 3.5 * (uf - 1.15); lampo.scale.set(ls, ls, 1); }
        if (uf > 1.3) { var e2 = uf - 1.3; guscio.visible = true; mG.uniforms.uR.value = 0.4 + 2.6 * (1 - Math.exp(-e2 / 1.3)) + 0.12 * e2; mG.uniforms.uCaldo.value = Math.max(0.12, 1 - e2 / 5.2); mG.uniforms.uOpac.value = Math.min(1, e2 / 0.3); mG.uniforms.uDens.value = Math.min(1, Math.pow(mG.uniforms.uR.value / 2.2, 2)); }
        if (uf > 1.6) { var bh = fin.residuo === 'bh'; risultato.residuo = bh ? 'bh' : 'ns'; if (bh) { buco.visible = anelloBH.visible = true; anelloBH.scale.set(0.75, 0.75, 1); anelloBH.material.opacity = Math.min(1, (uf - 1.6) / 0.5); } else { stellaN.visible = true; var pul = 0.32 + (MENO_MOTO ? 0 : 0.03 * Math.sin(tempo * 9)); stellaN.scale.set(pul, pul, 1); stellaN.material.opacity = Math.min(1, (uf - 1.6) / 0.4); } }
        espulsiAggiorna(uf - 1.5, fin.espulsi || [], mG.uniforms.uR.value);
      } else if (s.fin && fin.tipo === 'nebulosa') {
        var e3 = uf; scala = Math.max(0.05, 1 - easeIO(e3 / 2)); corpoVis = e3 < 2;
        guscio.visible = true; mG.uniforms.uR.value = 1.0 + 1.5 * easeIO(Math.min(1, e3 / 5)); mG.uniforms.uCaldo.value = 0.9 - 0.5 * easeIO(Math.min(1, e3 / 5)); mG.uniforms.uOpac.value = Math.min(0.9, e3 / 1.2); mG.uniforms.uSchiaccia.value = 0.6; mG.uniforms.uDens.value = 0.3;
        nanaB.visible = e3 > 1.2; risultato.residuo = e3 > 1.2 ? 'wd' : null; espulsiAggiorna(-1, [], 0);
      } else if (esploso && (sc.id === 'ia' || sc.id === 'kilonova')) {
        var e4 = s.tau - L.inizi[esplosoI]; guscio.visible = true; mG.uniforms.uSchiaccia.value = sc.id === 'kilonova' ? 0.7 : 1;
        mG.uniforms.uR.value = 0.5 + 2.2 * (1 - Math.exp(-e4 / 1.4)) + 0.08 * e4; mG.uniforms.uCaldo.value = Math.max(0, 1 - e4 / 6); mG.uniforms.uOpac.value = Math.min(1, e4 / 0.25) * Math.max(0.35, 1 - e4 / 12); mG.uniforms.uDens.value = Math.min(1, Math.pow(mG.uniforms.uR.value / 2.2, 2));
        if (e4 < 0.6) { lampo.visible = true; lampo.material.opacity = (MENO_MOTO ? 0.35 : 0.7) * (1 - e4 / 0.6); var l2 = 0.8 + 3 * e4; lampo.scale.set(l2, l2, 1); }
        if (sc.id === 'kilonova' && e4 > 0.5) { buco.visible = anelloBH.visible = true; anelloBH.scale.set(0.6, 0.6, 1); anelloBH.material.opacity = 0.8; risultato.residuo = 'bh?'; }
        espulsiAggiorna(e4, sc.stadi[esplosoI].nuovi, mG.uniforms.uR.value);
      } else espulsiAggiorna(-1, [], 0);
      corpo.visible = corpoVis; corpo.scale.setScalar(scala); bagl.visible = corpoVis && !esploso; var bs = scala * (tipo === 'stella' ? 3.4 : 2.6); bagl.scale.set(bs, bs, 1);
      if (tipo === 'nube') lucciole.forEach(function (l) { var gen = st.generazioni || 1, att = l.userData.g <= gen, fz = ((MENO_MOTO ? 0 : tempo) * 0.3 + l.userData.f) % 1; l.visible = att; l.material.opacity = att ? (fz > 0.92 ? 1 : 0.55) : 0; var z2 = fz > 0.92 ? 0.3 : 0.1; l.scale.set(z2, z2, 1); });
      /* testi per il pannello */
      var rea = s.fin && fin.tipo === 'collasso' ? (uf < 1.3 ? fin.collasso.reazioni : fin.reazioniEsp || []) : st.reazioni;
      risultato.reazioni = rea.map(function (r) { return Dd.reazione(r).testo; }); risultato.nota = s.fin && fin.tipo === 'collasso' ? (uf < 1.3 ? t('neutronizzazione e fotodisintegrazione del ferro', 'neutronisation and photodisintegration of iron') : t('nucleosintesi esplosiva; processo r debole', 'explosive nucleosynthesis; weak r-process')) : (st.nota ? F.tt(st.nota) : '');
      ultimoI = s.i; return s;
    }
    function mC_t(tt) { if (compagna) compagna.material.uniforms.uTempo.value = tt; }
    function espulsiAggiorna(eta, lista, R) {
      while (espulsi.length < lista.length) espulsi.push(null);
      espulsi.forEach(function (e, j) {
        var simb = lista[j]; if (!simb || eta < 0.3 + j * 0.35) { if (e) e.visible = false; return; }
        if (!e || e.userData.s !== simb) { if (e) { radice.remove(e); e.material.dispose(); } e = etichetta(T, simb); e.userData.s = simb; radice.add(e); espulsi[j] = e; }
        var a = j * 2.4 + 0.7, b = (j % 3 - 1) * 0.5; e.position.set(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, b * R * 0.4); e.visible = true; e.material.opacity = Math.min(1, (eta - 0.3 - j * 0.35) / 0.4); e.scale.set(0.3, 0.3, 1);
      });
    }
    return {
      linea: L, _guscio: guscio, imposta: imposta, risultato: risultato, composizione: function () { return comp; }, stato: function () { return s; }, corpo: corpo,
      strati: function (v) { mostraStrati = v; }, proietta: function (v3) { var v = S.vista, c = S.cam; c.position.set(v.bersaglio.x + v.r * Math.sin(v.ph) * Math.cos(v.th), v.bersaglio.y + v.r * Math.sin(v.ph) * Math.sin(v.th), v.bersaglio.z + v.r * Math.cos(v.ph)); c.up.set(0, 0, 1); c.lookAt(v.bersaglio); c.updateMatrixWorld(); var p = v3.clone().project(c); return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 }; },
      distruggi: function () { radice.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map && !Object.keys(CACHE_ET).some(function (k) { return CACHE_ET[k] === x.material.map; })) x.material.map.dispose(); x.material.dispose(); } }); S.radice.remove(radice); }
    };
  }

  /* ═══ il pannello dati: ciambella SVG, orologio, legenda ═════════════════ */
  function arco(cx, cy, r0, r1, a0, a1) {
    var g2 = a1 - a0 > PI ? 1 : 0, p = function (r, a) { return (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); };
    if (a1 - a0 >= 2 * PI - 1e-4) a1 = a0 + 2 * PI - 1e-4;
    return 'M' + p(r1, a0) + 'A' + r1 + ' ' + r1 + ' 0 ' + g2 + ' 1 ' + p(r1, a1) + 'L' + p(r0, a1) + 'A' + r0 + ' ' + r0 + ' 0 ' + g2 + ' 0 ' + p(r0, a0) + 'Z';
  }
  function pannello(box, sc) {
    var NS = 'http://www.w3.org/2000/svg', dati = F.el('div', { 'class': 'bsiSP-dati' }), svg = D.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'bsiSP-ciambella'); svg.setAttribute('role', 'img');
    var dx = F.el('div', { 'class': 'bsiSP-dx' }), et1 = F.el('div', { 'class': 'et', testo: t('Tempo trascorso', 'Elapsed time') }), oro = F.el('div', { 'class': 'oro', 'aria-live': 'off' }), sub = F.el('div', { 'class': 'sub' });
    var et2 = F.el('div', { 'class': 'et', testo: sc.id === 'terra' ? t('Composizione al centro', 'Composition at the centre') : sc.id === 'giove' ? t('Composizione dell\'atmosfera', 'Atmosphere composition') : sc.id === 'galassia' ? t('Gas interstellare', 'Interstellar gas') : sc.id === 'bigbang' ? t('Composizione dell\'universo', 'Composition of the universe') : sc.id === 'ia' || sc.id === 'kilonova' ? t('Composizione della materia', 'Composition of the matter') : t('Composizione del nucleo', 'Core composition') }), leg = F.el('div', { 'class': 'bsiSP-leg' });
    dx.appendChild(et1); dx.appendChild(oro); dx.appendChild(sub); dx.appendChild(et2); dx.appendChild(leg);
    dati.appendChild(svg); dati.appendChild(dx); box.appendChild(dati);
    var ultimo = '', dec = sc.decimali || 0;
    function aggiorna(comp, testoOro, testoSub) {
      oro.textContent = testoOro; sub.textContent = testoSub;
      var Dd = DATI(), r = Dd.arrotonda(comp, dec), chiavi = Object.keys(r).filter(function (k) { return r[k] > 0; }).sort(function (a, b) { return r[b] - r[a]; });
      var firma = chiavi.map(function (k) { return k + r[k]; }).join(',');
      if (firma === ultimo) return; ultimo = firma;
      var h = '', a = -PI / 2, et = '';
      chiavi.forEach(function (k) { var f = r[k] / 100, a1 = a + f * 2 * PI, Cm = Dd.COMP[k] || { c: '#888' }; h += '<path d="' + arco(50, 50, 27, 47, a, a1) + '" fill="' + Cm.c + '" stroke="#05070d" stroke-width=".8"/>'; if (f >= 0.07) { var m = (a + a1) / 2; et += '<text x="' + (50 + 37 * Math.cos(m)).toFixed(1) + '" y="' + (50 + 37 * Math.sin(m) + 3).toFixed(1) + '" text-anchor="middle">' + (k.length > 2 ? '' : k) + '</text>'; } a = a1; });
      svg.innerHTML = h + et;
      svg.setAttribute('aria-label', t('Composizione: ', 'Composition: ') + chiavi.map(function (k) { return k + ' ' + num(r[k], dec) + ' %'; }).join(', '));
      leg.innerHTML = chiavi.slice(0, 7).map(function (k) { var Cm = Dd.COMP[k] || { c: '#888', n: [k, k] }; return '<span class="p" style="background:' + Cm.c + '"></span><span>' + (k.length > 2 ? '' : '<b style="text-align:left">' + k + '</b> ') + '<em>' + F.tt(Cm.n) + '</em></span><b>' + num(r[k], dec) + ' %</b>'; }).join('');
    }
    return { el: dati, aggiorna: aggiorna, nascondi: function (v) { dati.classList.toggle('via', !!v); } };
  }

  /* ═══ la pagina: palco 9:16, comandi, spiegazione, grafico, fonti ═══════ */
  function crea(cont, scen, opz) {
    opz = opz || {}; stile();
    var Dd = DATI(); if (!Dd) { cont.textContent = t('Dati degli scenari non disponibili.', 'Scenario data not available.'); return null; }
    var sc = typeof scen === 'string' ? Dd.perId(scen, opz.massa) : scen; if (!sc) return null;
    if (cont._spaccato) cont._spaccato.distruggi();
    cont.textContent = '';
    var radice = F.el('div', { 'class': 'bsiSP' }); cont.appendChild(radice);
    var palco = F.el('div', { 'class': 'bsiSP-palco' }), com = F.el('div', { 'class': 'bsiSP-com', role: 'toolbar', 'aria-label': t('Comandi dello spaccato', 'Cut-away controls') });
    var barra = F.el('input', { type: 'range', 'class': 'bsiSP-tempo', min: '0', max: '1', step: '0.001', value: '0', 'aria-label': t('Tempo della simulazione', 'Simulation time') });
    var spieg = F.el('div', { 'class': 'bsiFX-nota' }); spieg.textContent = F.tt(sc.spiegazione);
    radice.appendChild(palco); radice.appendChild(barra); radice.appendChild(com); radice.appendChild(spieg);
    var api = { scenario: sc, pronto: false, distruggi: function () { vivo = false; if (M) M.distruggi(); } }, vivo = true, M = null;
    cont._spaccato = api;
    var L3 = g.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); palco.appendChild(attesa);
    var largo = (g.innerWidth || 400) > 900 && !opz.formato || opz.formato === '16:9';
    function larghezza() { var w = cont.clientWidth || 360, h = (g.innerHeight || 800) * 0.82; return largo ? w : Math.min(w, h * 9 / 16); }
    /* il grafico sotto (B/A per le supernove, curve di luce, calore, BBN) */
    var cvG = null, infoG = F.el('div', { 'class': 'bsiFX-nota' });
    var tipoG = sc.grafico || (sc.id === 'supernova' || sc.id === 'buconero' ? 'legame' : sc.id === 'galassia' ? 'metalli' : null);
    if (tipoG && F.tela) { cvG = F.tela(radice, 0.5); cvG.style.marginTop = '8px'; radice.appendChild(infoG); }
    var fo = F.el('ol', { 'class': 'bsiSP-fonti' }); (sc.fonti || []).forEach(function (k) { if (Dd.FONTI[k]) fo.appendChild(F.el('li', { testo: Dd.FONTI[k] })); });
    radice.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Fonti', 'Sources') + '</b> · ' + t('MISURATO dove citato; i raggi degli strati NON sono in scala; le composizioni a fine stadio delle stelle massicce sono INDICATIVE (lette dai profili pubblicati).', 'MEASURED where cited; layer radii are NOT to scale; end-of-stage compositions of massive stars are INDICATIVE (read from published profiles).') }));
    radice.appendChild(fo);
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return api; }
    L3.stile();
    L3.caricaThree().then(function () {
      if (!vivo) return; attesa.remove();
      var T = g.THREE; palco.style.width = larghezza() + 'px';
      var S = new L3.Scena(palco, largo ? 9 / 16 : 16 / 9); palco.insertBefore(S.box, palco.firstChild); S.adatta();
      if (S.cinema) try { S.cinema({ forza: 0.55, soglia: 0.62, vignetta: 0.3, esposizione: 0.95 }); } catch (e) { }
      var box = S.box;
      var tit = F.el('div', { 'class': 'bsiSP-tit' }); tit.innerHTML = F.tt(sc.titolo) + '<small>' + sc.sottotitolo + '</small>'; box.appendChild(tit);
      var rea = F.el('div', { 'class': 'bsiSP-reaz', 'aria-live': 'off' }), hud = F.el('div', { 'class': 'bsiSP-hud' }); box.appendChild(rea); box.appendChild(hud);
      var NSs = 'http://www.w3.org/2000/svg', svg = D.createElementNS(NSs, 'svg'); svg.setAttribute('class', 'bsiSP-svg'); svg.setAttribute('aria-hidden', 'true'); box.appendChild(svg);
      var pan = pannello(box, sc);
      M = motore(S, T, box, sc, { strati: opz.strati });
      var L = M.linea, tau = Math.max(0, Math.min(L.totale, opz.tau || 0)), gioca = !MENO_MOTO && opz.gioca !== false, vel = opz.vel || 1, cinema = !MENO_MOTO, ultimoUI = -1;
      barra.max = String(L.totale);
      /* comandi */
      function bott(tx, f, aria) { var b = F.el('button', { type: 'button', testo: tx, 'aria-label': aria || tx, onclick: function () { f(b); } }); com.appendChild(b); return b; }
      var bPlay = bott(gioca ? '⏸' : '▶', function () { if (tau >= L.totale - 1e-3) tau = 0; gioca = !gioca; segna(); S.avvia(); }, t('Riproduci o metti in pausa', 'Play or pause'));
      bott('↺', function () { tau = 0; gioca = !MENO_MOTO || gioca; segna(); S.avvia(); }, t('Ricomincia', 'Restart'));
      var bCin = bott('🎬 ' + t('Cinematico', 'Cinematic'), function () { cinema = !cinema; segna(); S.avvia(); });
      var selV = F.el('select', { 'aria-label': t('Velocità', 'Speed') }); [0.5, 1, 2].forEach(function (v) { var o = F.el('option', { value: String(v), testo: v + '×' }); if (v === vel) o.selected = true; selV.appendChild(o); });
      selV.addEventListener('change', function () { vel = +selV.value; }); com.appendChild(F.el('label', {}, [F.el('span', { testo: t('Velocità', 'Speed') }), selV]));
      var cS = F.el('input', { type: 'checkbox' }); cS.checked = opz.strati !== false; cS.addEventListener('change', function () { M.strati(cS.checked); S.avvia(); });
      com.appendChild(F.el('label', {}, [cS, F.el('span', { testo: t('Strati a cipolla', 'Onion layers') })]));
      if (sc.massa) {
        var cm = F.el('input', { type: 'range', min: String(sc.massa.min), max: String(sc.massa.max), step: '1', value: String(sc.massa.val), 'aria-label': t('Massa iniziale (M☉)', 'Initial mass (M☉)') }), vm = F.el('b', { testo: sc.massa.val + ' M☉' });
        cm.addEventListener('input', function () { vm.textContent = cm.value + ' M☉ → ' + (Dd.residuo(+cm.value) === 'bh' ? t('buco nero', 'black hole') : t('stella di neutroni', 'neutron star')); });
        cm.addEventListener('change', function () { var f = tau / L.totale; crea(cont, Dd.supernova(+cm.value), { tau: f * L.totale, gioca: gioca, strati: cS.checked, vel: vel, formato: opz.formato }); });
        com.appendChild(F.el('label', {}, [F.el('span', { testo: t('Massa', 'Mass') }), cm, vm]));
      }
      bott(largo ? '9:16' : '16:9', function () { crea(cont, sc, { tau: tau, gioca: gioca, strati: cS.checked, vel: vel, formato: largo ? '9:16' : '16:9' }); }, t('Formato', 'Format'));
      var bLink = null;
      function link(id, testo) { if (bLink) return; bLink = bott(testo, function () { if (typeof g.goSection === 'function') g.goSection(id); }); }
      if (sc.collega) link(sc.collega, '🌊 ' + t('Onde gravitazionali', 'Gravitational waves'));
      function segna() { bPlay.textContent = gioca ? '⏸' : '▶'; bPlay.setAttribute('aria-pressed', String(gioca)); bCin.setAttribute('aria-pressed', String(cinema)); }
      segna();
      barra.addEventListener('input', function () { tau = +barra.value; gioca = false; segna(); S.avvia(); });
      S.ren.domElement.addEventListener('pointerdown', function () { if (cinema) { cinema = false; segna(); } });
      /* camera */
      S.cam.fov = 40; S.cam.updateProjectionMatrix();
      var base = { r: largo ? 4.3 : 5.6, th: 2.36, ph: 1.12 }; S.inquadra(base.r, base.th, base.ph); S.vista.bersaglio.set(0, 0, largo ? -0.15 : -0.55);
      if (sc.corpo.compagna) { base.r += 1.6; S.inquadra(base.r, 2.0, 1.12); }
      function camera(st) {
        if (!cinema) return; var v = S.vista, fin = st.fin, k = 1;
        if (fin && sc.finale.tipo === 'collasso') k = st.uf < 1.2 ? 1 - 0.18 * easeIO(st.uf) : 0.82 + 1.5 * easeIO((st.uf - 1.2) / 3.5);
        else if (fin && sc.finale.tipo === 'nebulosa') k = 1 + 1.4 * easeIO(st.uf / 3);
        else if (sc.stadi[st.i].esplode || sc.stadi[st.i].dopo) k = 1.35 + 0.8 * easeIO((st.tau - M.linea.inizi[sc.stadi.findIndex(function (x) { return x.esplode; })]) / 3);
        v.r = base.r * k; v.th = (sc.corpo.compagna && !(sc.stadi[st.i].esplode || sc.stadi[st.i].dopo) ? 2.0 : base.th) + 0.12 * Math.sin(st.tau * 0.25); v.ph = base.ph - 0.05 * Math.sin(st.tau * 0.17);
      }
      /* il ciclo */
      S.ogniFotogramma(function (dt) {
        if (!vivo) return false; if (D.hidden) return true;
        if (gioca) { tau += dt * vel; if (tau >= L.totale) { tau = L.totale; gioca = false; segna(); } }
        var st = M.imposta(tau, MENO_MOTO ? 0 : dt); camera(st);
        var ora = Math.round(tau * 15); if (ora !== ultimoUI) { ultimoUI = ora; ui(st); }
        return gioca || !MENO_MOTO;
      });
      function ui(st) {
        barra.value = String(tau);
        var r = M.risultato, stg = sc.stadi[st.i], fin = st.fin ? sc.finale : null;
        rea.innerHTML = r.reazioni.map(function (x) { return x.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }).join('<br>') + (r.nota ? '<br><i>' + r.nota + '</i>' : '');
        var h = '<b>' + (fin && fin.tipo === 'collasso' ? (st.uf < 1.3 ? t('Collasso del nucleo', 'Core collapse') : t('Esplosione', 'Explosion')) : fin && fin.tipo === 'nebulosa' ? t('Nebulosa planetaria', 'Planetary nebula') : F.tt(stg.nome)) + '</b>';
        if (fin && fin.tipo === 'collasso' && st.uf < 1.3) h += 'T ~ ' + sci(fin.collasso.T) + ' K<br>ρ ~ ' + sci(fin.collasso.rho) + ' g/cm³<br>M_Ch = 5,83 Y_e² M☉ ≈ 1,4 M☉<br>' + t('ν: ~99 % di ~3·10⁵³ erg', 'ν: ~99 % of ~3·10⁵³ erg');
        else if (fin && fin.tipo === 'collasso') h += t('energia cinetica ~10⁵¹ erg (~1 %)', 'kinetic energy ~10⁵¹ erg (~1 %)') + '<br>' + t('luce ~10⁴⁹ erg (~0,01 %)', 'light ~10⁴⁹ erg (~0.01 %)') + '<br>v ~ 10⁴ km/s<br>' + (fin.residuo === 'bh' ? t('residuo: buco nero', 'remnant: black hole') : t('residuo: ~1,4 M☉ in ~12 km', 'remnant: ~1.4 M☉ in ~12 km'));
        else if (fin && fin.tipo === 'nebulosa') h += t('nana bianca ', 'white dwarf ') + num(fin.massaWD, 2) + ' M☉<br>' + t('raggio ~ quello della Terra', 'radius ~ Earth\'s');
        else { if (stg.T) h += 'T ≈ ' + sci(sc.id === 'bigbang' ? Dd.Tbbn(Math.max(1, st.tFis)) : stg.T) + ' K<br>'; if (stg.rho) h += 'ρ ≈ ' + sci(stg.rho) + ' g/cm³<br>'; if (stg.raggio) h += 'R ≈ ' + num(stg.raggio, stg.raggio < 10 ? 1 : 0) + ' R☉<br>'; if (sc.massa) h += 'M = ' + sc.massa.val + ' M☉'; if (sc.id === 'bigbang') h += 'n/(n+p) = ' + num(Dd.Xn(Math.min(st.tFis, Dd.BBN.tNuc)), 3); }
        hud.innerHTML = h;
        pan.aggiorna(M.composizione(), orologio(sc, L, st), fin ? t('evento finale', 'final event') : t('questo stadio: ', 'this stage: ') + durata(stg.dur));
        pan.nascondi(fin && fin.tipo === 'collasso' && st.uf > 0.2);
        /* etichette con linea guida: nucleo collassato, stella di neutroni, buco nero, nana bianca */
        var lab = '', w = box.clientWidth, hh = S.ren.domElement.clientHeight;
        if (fin && fin.tipo === 'collasso' && st.uf > 0.15 && st.uf < 1.3) { var c0 = M.proietta(new T.Vector3(0, 0, 0)); lab = guida(c0.x * w, c0.y * hh, w * 0.62, hh * 0.3, t('NUCLEO COLLASSATO', 'COLLAPSED CORE')); }
        if (r.residuo) { var c1 = M.proietta(new T.Vector3(0, 0, 0)); lab = guida(c1.x * w, c1.y * hh, Math.max(10, c1.x * w - w * 0.38), c1.y * hh + hh * 0.2, r.residuo === 'bh' ? t('BUCO NERO', 'BLACK HOLE') : r.residuo === 'bh?' ? t('RESIDUO: PROBABILE BUCO NERO', 'REMNANT: LIKELY BLACK HOLE') : r.residuo === 'wd' ? t('NANA BIANCA', 'WHITE DWARF') : t('STELLA DI NEUTRONI', 'NEUTRON STAR')); if (r.residuo === 'bh') link('sastrobh', '🕳️ ' + t('Buchi neri', 'Black holes')); }
        svg.innerHTML = lab;
        if (cvG) grafico(st);
        api.ultimo = { stadio: st.i, fin: st.fin, uf: st.uf, comp: M.composizione(), orologio: orologio(sc, L, st), residuo: r.residuo };
      }
      function guida(x0, y0, x1, y1, testo) { return '<line x1="' + x0.toFixed(0) + '" y1="' + y0.toFixed(0) + '" x2="' + x1.toFixed(0) + '" y2="' + y1.toFixed(0) + '" stroke="#e6f2ff" stroke-width="1" opacity=".8"/><circle cx="' + x0.toFixed(0) + '" cy="' + y0.toFixed(0) + '" r="3" fill="#e6f2ff"/><text x="' + (x1 + 4).toFixed(0) + '" y="' + (y1 + 4).toFixed(0) + '">' + testo + '</text>'; }
      var gUlt = -1;
      function grafico(st) {
        var chiave = Math.round(st.tau * 4); if (chiave === gUlt) return; gUlt = chiave;
        var Gx = [], Gy = [], punti = [], o = {};
        if (tipoG === 'legame') {
          Dd.LEGAME.forEach(function (p) { Gx.push(p[0]); Gy.push(p[1]); });
          var sem = g.BSIFisica.calcolo && g.BSIFisica.calcolo.stelle && g.BSIFisica.calcolo.stelle.legameValle, sx = [], sy = [];
          for (var A = 4; A <= 240; A += 2) { var v = sem ? sem(A) : null; if (v && isFinite(v.BA || v)) { sx.push(A); sy.push(v.BA || v); } }
          o = { serie: (sx.length ? [{ x: sx, y: sy, col: '#6b7f99', larg: 1.5 }] : []).concat([{ x: Gx, y: Gy, col: '#ffb547', larg: 2 }]), punti: Dd.LEGAME.map(function (p) { return { x: p[0], y: p[1], col: p[0] === 56 || p[0] === 62 ? '#f2e6c9' : '#ffb547', r: p[0] === 56 ? 5 : 3 }; }), xmin: 0, xmax: 240, ymin: 0, ymax: 9.5, xl: ['A (numero di massa)', 'A (mass number)'], yl: ['B/A (MeV per nucleone)', 'B/A (MeV per nucleon)'], descr: ['Energia di legame per nucleone (AME2020): il massimo è a ⁵⁶Fe–⁶²Ni', 'Binding energy per nucleon (AME2020): the maximum is at ⁵⁶Fe–⁶²Ni'] };
          infoG.innerHTML = t('<b>Perché il ferro è il capolinea</b>: fondere nuclei fino al gruppo del ferro libera energia perché B/A cresce; oltre (⁶²Ni 8,795 MeV, ⁵⁶Fe 8,790 MeV) fondere costa energia. Tocca il grafico per leggere i valori.', '<b>Why iron is the end of the line</b>: fusing nuclei up to the iron group releases energy because B/A rises; beyond it (⁶²Ni 8.795 MeV, ⁵⁶Fe 8.790 MeV) fusion costs energy. Touch the chart to read the values.');
        } else if (tipoG === 'luceIa' || tipoG === 'luceKN') {
          var ia = tipoG === 'luceIa', T0 = ia ? M.linea.fisici[2] + sc.stadi[2].dur : M.linea.fisici[1], fn = ia ? Dd.luceIa : Dd.luceKN, gm = ia ? 365 : 14;
          for (var d = ia ? 0 : 0.1; d <= gm; d += gm / 200) { Gx.push(d); Gy.push(Math.log10(fn(d * 86400))); }
          var ora = (st.tFis - T0) / 86400; if (ora >= 0) punti.push({ x: Math.min(gm, ora), y: Math.log10(fn(Math.max(ia ? 0 : 0.1, ora) * 86400)), col: '#fff', r: 5 });
          o = { serie: [{ x: Gx, y: Gy, col: ia ? '#ffc64a' : '#e8a05a', larg: 2 }], punti: punti, xmin: 0, xmax: gm, ymin: ia ? 40.5 : 39.5, ymax: ia ? 44 : 43, xl: [t('giorni', 'days'), t('giorni', 'days')], yl: ['log₁₀ L (erg/s)', 'log₁₀ L (erg/s)'], descr: ia ? ['Luminosità dei decadimenti ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe (0,6 M☉ di nichel)', 'Luminosity from ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe decays (0.6 M☉ of nickel)'] : ['Riscaldamento radioattivo del processo r, ∝ t^−1,3 (0,065 M☉ espulsi)', 'r-process radioactive heating, ∝ t^−1.3 (0.065 M☉ ejected)'] };
          infoG.innerHTML = ia ? t('L(t) = M_Ni[(ε_Ni − ε_Co)e^(−t/τ_Ni) + ε_Co e^(−t/τ_Co)], ε_Ni = 3,9·10¹⁰ e ε_Co = 6,78·10⁹ erg g⁻¹ s⁻¹ (Nadyozhin 1994). Il picco calcolato, ~10⁴³ erg/s, è quello osservato nelle Ia; la coda segue i 77 giorni del ⁵⁶Co.', 'L(t) = M_Ni[(ε_Ni − ε_Co)e^(−t/τ_Ni) + ε_Co e^(−t/τ_Co)], ε_Ni = 3.9·10¹⁰ and ε_Co = 6.78·10⁹ erg g⁻¹ s⁻¹ (Nadyozhin 1994). The computed peak, ~10⁴³ erg/s, is the one observed in Type Ia; the tail follows the 77 days of ⁵⁶Co.') : t('Un giorno dopo la fusione il riscaldamento vale ~10⁴² erg/s, l\'ordine di grandezza osservato per AT2017gfo. Il residuo della fusione di GW170817 è probabilmente un buco nero.', 'One day after the merger the heating is ~10⁴² erg/s, the order of magnitude observed for AT2017gfo. The remnant of GW170817 is probably a black hole.');
        } else if (tipoG === 'bbn') {
          for (var x = 0; x <= 3.1; x += 0.02) { var tt = Math.pow(10, x); Gx.push(x); Gy.push(tt < Dd.BBN.tNuc ? Dd.Xn(tt) : 0); }
          var yy = []; Gx.forEach(function (x2) { yy.push(Math.pow(10, x2) < Dd.BBN.tNuc ? 0 : Dd.Ymod()); });
          punti.push({ x: Math.log10(Math.max(1, st.tFis)), y: st.tFis < Dd.BBN.tNuc ? Dd.Xn(st.tFis) : Dd.Ymod(), col: '#fff', r: 5 });
          o = { serie: [{ x: Gx, y: Gy, col: '#9aa6b8', larg: 2 }, { x: Gx, y: yy, col: '#b9a2ff', larg: 2 }, { x: [0, 3.1], y: [Dd.BBN.Yoss, Dd.BBN.Yoss], col: '#00c9b7', larg: 1 }], punti: punti, xmin: 0, xmax: 3.1, ymin: 0, ymax: 0.3, xl: ['log₁₀ t (s)', 'log₁₀ t (s)'], yl: [t('frazione in massa', 'mass fraction'), t('frazione in massa', 'mass fraction')], legenda: [{ col: '#9aa6b8', etich: ['neutroni liberi X_n', 'free neutrons X_n'] }, { col: '#b9a2ff', etich: ['elio Y = 2X_n (modello)', 'helium Y = 2X_n (model)'] }, { col: '#00c9b7', etich: ['Y misurato 0,245', 'measured Y 0.245'] }], descr: ['Neutroni liberi ed elio nei primi 20 minuti', 'Free neutrons and helium in the first 20 minutes'] };
          infoG.innerHTML = t('Modello semplice: congelamento a kT = 0,75 MeV (n/p = e^(−1,293/0,75)), decadimento con τ_n = 878,4 s fino a ~200 s, poi tutti i neutroni nell\'elio: Y = ' + num(Dd.Ymod(), 3) + ' contro 0,245 misurato. Tracce: D/H = 2,53·10⁻⁵ (misurato), ³He/H ≈ 1·10⁻⁵, ⁷Li/H previsto 4,7·10⁻¹⁰ ma osservato 1,6·10⁻¹⁰: il «problema del litio» è aperto.', 'Simple model: freeze-out at kT = 0.75 MeV (n/p = e^(−1.293/0.75)), decay with τ_n = 878.4 s until ~200 s, then all neutrons into helium: Y = ' + num(Dd.Ymod(), 3) + ' versus 0.245 measured. Traces: D/H = 2.53·10⁻⁵ (measured), ³He/H ≈ 1·10⁻⁵, ⁷Li/H predicted 4.7·10⁻¹⁰ but observed 1.6·10⁻¹⁰: the «lithium problem» is open.');
        } else if (tipoG === 'calore') {
          for (var my = 0; my <= 10; my += 0.05) { Gx.push(my); Gy.push(Math.log10(Dd.caloreTerra(my * 1e6))); }
          var oraM = st.tFis / (1e6 * ANNO); if (oraM <= 10) punti.push({ x: oraM, y: Math.log10(Dd.caloreTerra(oraM * 1e6)), col: '#fff', r: 5 });
          o = { serie: [{ x: Gx, y: Gy, col: '#ff8a50', larg: 2 }], punti: punti, xmin: 0, xmax: 10, ymin: -12, ymax: -6, xl: [t('milioni di anni', 'million years'), t('milioni di anni', 'million years')], yl: ['log₁₀ W/kg', 'log₁₀ W/kg'], descr: ['Calore radioattivo da ²⁶Al e ⁶⁰Fe nella Terra che si forma', 'Radioactive heat from ²⁶Al and ⁶⁰Fe in the forming Earth'] };
          infoG.innerHTML = t('P = Σ N λ E e^(−λt): con (²⁶Al/²⁷Al)₀ = 5,23·10⁻⁵ e l\'1,6 % di alluminio, all\'inizio ' + sci(Dd.caloreTerra(0)) + ' W/kg (la Terra oggi: ~7·10⁻¹² W/kg da U, Th, K). Bastano poche centinaia di migliaia di anni per fondere un corpo di decine di km.', 'P = Σ N λ E e^(−λt): with (²⁶Al/²⁷Al)₀ = 5.23·10⁻⁵ and 1.6 % aluminium, initially ' + sci(Dd.caloreTerra(0)) + ' W/kg (Earth today: ~7·10⁻¹² W/kg from U, Th, K). A few hundred thousand years are enough to melt a body tens of km across.');
        } else if (tipoG === 'metalli') {
          for (var gy = 0; gy <= 13.8; gy += 0.1) { Gx.push(gy); Gy.push(Dd.compGal(gy).Z / 100); }
          punti.push({ x: 9.2, y: 0.0134, col: '#ffd24a', r: 5 }); punti.push({ x: Math.min(13.8, st.tFis / (1e9 * ANNO)), y: Dd.compGal(st.tFis / (1e9 * ANNO)).Z / 100, col: '#fff', r: 4 });
          o = { serie: [{ x: Gx, y: Gy, col: '#5fe3d6', larg: 2 }], punti: punti, xmin: 0, xmax: 13.8, ymin: 0, ymax: 0.025, xl: [t('miliardi di anni dal Big Bang', 'billion years since the Big Bang'), t('miliardi di anni dal Big Bang', 'billion years since the Big Bang')], yl: ['Z', 'Z'], descr: ['Metallicità del gas nel modello a scatola chiusa; il punto giallo è il Sole', 'Gas metallicity in the closed-box model; the yellow dot is the Sun'] };
          infoG.innerHTML = t('Z = p·ln(1/μ) con resa p = 0,01 e gas consumato con tempo scala 6,6 miliardi di anni (MODELLO); il Sole (punto giallo, Z☉ = 0,0134, Asplund 2009) cade sulla curva. Y = 0,245 + 2Z.', 'Z = p·ln(1/μ) with yield p = 0.01 and gas consumed on a 6.6-billion-year timescale (MODEL); the Sun (yellow dot, Z☉ = 0.0134, Asplund 2009) falls on the curve. Y = 0.245 + 2Z.');
        }
        F.grafico(cvG, o);
      }
      F.alRidimensiona(function () { palco.style.width = larghezza() + 'px'; S.adatta(); });
      api.pronto = true; api.S = S; api.M = M; api.vai = function (x) { tau = x; S.avvia(); }; api.gioca = function (v) { gioca = v; segna(); S.avvia(); }; api.totale = L.totale; api.cinematico = function (v) { cinema = v; segna(); };
      M.imposta(tau, 0); ui(M.stato()); S.avvia();
      if (opz.alPronto) opz.alPronto(api);
    }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    return api;
  }

  /* ═══ la sezione: scelta dello scenario, un palco solo ═══════════════════ */
  var ELENCO = [['supernova', '💥'], ['sole', '☀️'], ['buconero', '🕳️'], ['ia', '⚪'], ['kilonova', '✨'], ['bigbang', '🌌'], ['terra', '🌍'], ['giove', '🪐'], ['galassia', '🌀']];
  function schedaSezione(div) {
    stile(); var Dd = DATI(); if (!Dd) return;
    var scelte = F.el('div', { 'class': 'bsiSP-scelte', role: 'group', 'aria-label': t('Scenari', 'Scenarios') }), palco = F.el('div');
    div.appendChild(scelte); div.appendChild(palco);
    var tasti = {};
    function apri(id) { Object.keys(tasti).forEach(function (k) { tasti[k].setAttribute('aria-pressed', String(k === id)); }); div._sp = crea(palco, id); return div._sp; }
    ELENCO.forEach(function (e) { var sc = Dd.perId(e[0]); var b = F.el('button', { type: 'button', 'aria-pressed': 'false', testo: e[1] + ' ' + F.tt(sc.titolo) }); b.addEventListener('click', function () { apri(e[0]); }); tasti[e[0]] = b; scelte.appendChild(b); });
    div._apri = apri; apri('supernova');
  }
  F.sezione('sastrospaccato', {
    titolo: ['🌟 Spaccati stellari', '🌟 Stellar cutaways'],
    sotto: ['Un corpo celeste tagliato a spicchio mentre la sua composizione cambia: la supernova con gli strati a cipolla e il collasso del ferro, il Sole fino alla nana bianca, il buco nero, la supernova Ia, la kilonova, i primi 20 minuti dell\'universo, la Terra che forma il nucleo, Giove e la pioggia di elio, la Galassia che si arricchisce di metalli.', 'A celestial body cut open while its composition changes: the supernova with its onion layers and the iron collapse, the Sun down to a white dwarf, the black hole, the Type Ia supernova, the kilonova, the first 20 minutes of the universe, Earth forming its core, Jupiter and helium rain, the Galaxy getting enriched with metals.'],
    schede: [{ nome: ['🌟 Gli scenari', '🌟 The scenarios'], costruisci: schedaSezione }]
  });

  /* ═══ la scheda nelle «Simulazioni cosmiche» ════════════════════════════ */
  if (g.BSICosmo) g.BSICosmo.registra('spaccato', {
    n: 10, etichetta: t('Supernova', 'Supernova'), bagliore: 0.55, ciclo: false,
    titolo: ['Una stella muore: lo spaccato', 'A star dies: the cutaway'],
    init: function (ctx) {
      var sc = DATI().supernova(20), m = motore(ctx.S, ctx.T, ctx.S.box, sc, {}), pan = pannello(ctx.S.box, sc);
      ctx.S.inquadra(5.6, 2.36, 1.12); ctx.S.vista.bersaglio.set(0, 0, -0.55);
      var ultimo = -1;
      return {
        durata: m.linea.totale, timeline: [],
        passo: function (dt, tt) { var st = m.imposta(tt, dt), k = Math.round(tt * 12); if (k === ultimo) return; ultimo = k; ctx.hud.textContent = (m.risultato.reazioni[0] || '') + (m.risultato.nota ? ' · ' + m.risultato.nota : ''); pan.aggiorna(m.composizione(), orologio(sc, m.linea, st), F.tt(sc.stadi[st.i].nome)); pan.nascondi(st.fin && st.uf > 0.2); },
        conti: function () { return { totale: m.linea.totale, stadi: sc.stadi.length }; }
      };
    }
  });

  g.BSISpaccato = { crea: crea, motore: motore, linea: linea, stato: stato, composizione: composizione, durata: durata, orologio: orologio, sci: sci, ELENCO: ELENCO, apri: function (id) { if (typeof g.goSection === 'function') g.goSection('sastrospaccato'); setTimeout(function () { var d = D.querySelector('#sastrospaccato .bsiSP-scelte'); d = d && d.parentNode; if (d && d._apri) d._apri(id); }, 400); } };

  /* ═══ lo strumento per Spectra: apre uno scenario solo quando l'utente lo chiede ═══ */
  var STRUMENTO = { name: 'spaccato_stellare',
    description: 'Apre lo «Spaccato stellare» di BioSpecInfo: un corpo celeste tagliato che cambia composizione. Scenari: supernova (come muore una stella massiccia), sole, buconero, ia (supernova di tipo Ia), kilonova (stelle di neutroni, oro), bigbang (primi 20 minuti), terra (nucleo di ferro), giove (idrogeno metallico), galassia (arricchimento di metalli). Usalo SOLO quando l\'utente chiede di vedere uno di questi processi.',
    parameters: { type: 'object', properties: { scenario: { type: 'string', enum: ELENCO.map(function (e) { return e[0]; }) } }, required: ['scenario'] },
    execute: function (a) { var id = a && a.scenario; if (!ELENCO.some(function (e) { return e[0] === id; })) return Promise.resolve({ ok: false, error: 'scenario sconosciuto' }); g.BSISpaccato.apri(id); var sc = DATI().perId(id); return Promise.resolve({ ok: true, aperto: F.tt(sc.titolo), spiegazione: F.tt(sc.spiegazione) }); } };
  function registra() { var Ts = g.BSI_AI_TOOLS; if (!Ts || !Ts.push) return false; if (!Ts.some(function (x) { return x.name === STRUMENTO.name; })) Ts.push(STRUMENTO); return true; }
  if (!registra()) { var k = 0, ti = setInterval(function () { if (registra() || ++k > 40) clearInterval(ti); }, 500); }
})(typeof window !== 'undefined' ? window : globalThis);
