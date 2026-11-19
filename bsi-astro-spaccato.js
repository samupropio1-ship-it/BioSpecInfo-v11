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
    if (sc.compT) return sc.compT(s.tFis, s);
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
    var iz = sc.zero != null ? sc.zero : sc.id === 'kilonova' ? 1 : sc.id === 'ia' ? 2 : 0, z = L.fisici[iz] || 0, r = tF - z;
    var et = sc.zeroEt ? F.tt(sc.zeroEt) : sc.id === 'kilonova' ? t('dalla fusione', 'from merger') : t('dall\'esplosione', 'from explosion');
    return (r < 0 ? '' : '+') + durata(r) + ' ' + et;
  }

  /* ═══ (v261) percorsi nel diagramma H-R: [log T, log L] all'inizio, alla fine di ogni stadio, poi nel finale.
     SCHEMATICI (forma da Sackmann et al. 1993 per il Sole, da modelli tipici per le altre) e dichiarati come tali ═══ */
  var TRACCE_HR = {
    sole: [[3.746, -0.13], [3.761, 0], [3.755, 0.33], [3.48, 3.41], [3.69, 1.7], [3.45, 3.6], [4.9, 3.6], [4.95, 1.5], [4.5, -1.3]],
    supernova: [[4.55, 4.7], [4.45, 5.0], [3.56, 5.15], [3.55, 5.18], [3.55, 5.2], [3.55, 5.2], [3.55, 5.2]],
    buconero: [[4.65, 5.3], [4.5, 5.55], [4.25, 5.65], [4.2, 5.66], [4.2, 5.67], [4.2, 5.67], [4.2, 5.67]],
    nanarossa: [[3.46, -2.95], [3.46, -2.95], [3.55, -2.4], [3.78, -2.0], [4.0, -3.4]],
    protostella: [[3.45, 1.6], [3.45, 1.6], [3.5, 1.3], [3.58, 0.6], [3.62, 0.2], [3.746, -0.13]],
    grb: [[4.9, 5.6], [4.95, 5.65], [4.95, 5.65], [4.95, 5.65], [4.95, 5.65]],
    nova: [[4.6, -1.2], [4.6, -1.2], [5.15, 4.5], [3.95, 4.7], [4.6, -1.2]],
    pisn: [[4.85, 6.3], [4.85, 6.3], [4.7, 6.4], [4.7, 6.4], [4.7, 6.4]],
    cefeide: [[3.77, 3.3], [3.77, 3.3], [3.77, 3.3], [3.77, 3.3]]
  };
  var SPIEGA_VIVO = {
    hr: ['<b>Il grafico nel palco è il diagramma H-R</b>: temperatura della superficie in orizzontale (le stelle calde a sinistra), luce emessa in verticale. Il punto luminoso è la stella di questa simulazione e si muove mentre cambia: lungo la fascia verde finché brucia idrogeno, poi verso le giganti o le nane bianche. I puntini sono stelle vere (Sole, Sirio, Betelgeuse…). Il percorso è schematico.', '<b>The chart in the frame is the H-R diagram</b>: surface temperature horizontally (hot stars on the left), emitted light vertically. The bright dot is this simulation\'s star and moves as it changes: along the green band while it burns hydrogen, then towards the giants or the white dwarfs. The small dots are real stars (Sun, Sirius, Betelgeuse…). The path is schematic.'],
    legame: ['<b>Il grafico nel palco è l\'energia di legame per nucleone</b> (AME2020): il punto luminoso è il nucleo che la stella sta fabbricando. Sale finché si arriva al ferro: ogni fusione libera energia. Al ferro la curva ha il massimo e la fusione smette di rendere: è per questo che il nucleo collassa.', '<b>The chart in the frame is the binding energy per nucleon</b> (AME2020): the bright dot is the nucleus the star is making. It rises up to iron: every fusion releases energy. At iron the curve peaks and fusion stops paying: that is why the core collapses.'],
    luceIa: ['<b>Il grafico nel palco è la curva di luce</b> calcolata dai decadimenti del nichel e del cobalto (Nadyozhin 1994): il punto è l\'istante della simulazione.', '<b>The chart in the frame is the light curve</b> computed from nickel and cobalt decays (Nadyozhin 1994): the dot is the simulation\'s instant.'],
    luceKN: ['<b>Il grafico nel palco è il calore radioattivo della kilonova</b>, ∝ t^−1,3: il punto è l\'istante della simulazione.', '<b>The chart in the frame is the kilonova\'s radioactive heating</b>, ∝ t^−1.3: the dot is the simulation\'s instant.'],
    bbn: ['<b>Il grafico nel palco segue i neutroni liberi</b>, che decadono finché non vengono chiusi nell\'elio: il punto è l\'istante della simulazione; la riga verde è l\'elio misurato.', '<b>The chart in the frame follows the free neutrons</b>, which decay until they are locked into helium: the dot is the simulation\'s instant; the green line is the measured helium.'],
    calore: ['<b>Il grafico nel palco è il calore radioattivo</b> che fonde la Terra giovane: il punto è l\'istante della simulazione.', '<b>The chart in the frame is the radioactive heat</b> that melts the young Earth: the dot is the simulation\'s instant.'],
    metalli: ['<b>Il grafico nel palco è la metallicità del gas</b>: il punto è l\'istante della simulazione, quello giallo è il Sole.', '<b>The chart in the frame is the gas metallicity</b>: the dot is the simulation\'s instant, the yellow one is the Sun.'],
    leavitt: ['<b>Il grafico nel palco è la luminosità della Cefeide</b> mentre pulsa: il punto segue la stella. Il periodo dà la luminosità (legge di Leavitt), e da lì la distanza.', '<b>The chart in the frame is the Cepheid\'s brightness</b> as it pulsates: the dot follows the star. The period gives the luminosity (Leavitt law), and from that the distance.'],
    ppdot: ['<b>Il grafico nel palco è il diagramma P–Ṗ</b> delle pulsar: periodo e rallentamento di pulsar vere; il punto è la stella di neutroni della simulazione che invecchia.', '<b>The chart in the frame is the P–Ṗ diagram</b> of pulsars: period and slowdown of real pulsars; the dot is the simulation\'s neutron star ageing.'],
    tde: ['<b>Il grafico nel palco è il gas che ricade</b> sul buco nero, ∝ t^−5/3: per mesi supera il limite di Eddington.', '<b>The chart in the frame is the gas falling back</b> onto the black hole, ∝ t^−5/3: for months it exceeds the Eddington limit.'],
    chirp: ['<b>Il grafico nel palco è l\'onda gravitazionale</b>: sempre più veloce e più forte fino alla fusione (chirp), poi lo smorzamento. La riga verticale è l\'istante della simulazione.', '<b>The chart in the frame is the gravitational wave</b>: faster and stronger up to the merger (chirp), then the ringdown. The vertical line is the simulation\'s instant.'],
    quasar: ['<b>Il grafico nel palco è la massa del buco nero</b> che cresce al limite di Eddington; il punto azzurro è un quasar osservato.', '<b>The chart in the frame is the black hole\'s mass</b> growing at the Eddington limit; the blue dot is an observed quasar.'],
    saha: ['<b>Il grafico nel palco è la frazione di idrogeno ionizzato</b> secondo Saha: il punto scende mentre l\'universo si raffredda.', '<b>The chart in the frame is the ionised hydrogen fraction</b> according to Saha: the dot drops as the universe cools.'],
    teff: ['<b>Il grafico nel palco è la temperatura della nana bruna</b> che si raffredda attraverso le classi M, L, T e Y.', '<b>The chart in the frame is the brown dwarf\'s temperature</b> as it cools through classes M, L, T and Y.'],
    burst: ['<b>Il grafico nel palco è la luce X del lampo</b>: salita in un secondo, coda di decine di secondi (forma tipica).', '<b>The chart in the frame is the burst\'s X-ray light</b>: a one-second rise, a tail of tens of seconds (typical shape).']
  };

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
      '.bsiSP-vivo{position:absolute;pointer-events:none}' +
      '.bsiSP-svg{position:absolute;inset:0;pointer-events:none;width:100%;height:100%}.bsiSP-svg text{font:700 10px ui-monospace,Menlo,monospace;letter-spacing:.12em;fill:#e6f2ff}' +
      '.bsiSP-com{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}.bsiSP-com button{min-height:40px;min-width:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;font:600 .85rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}' +
      '.bsiSP-com button[aria-pressed="true"]{border-color:#00c9b7;color:#00c9b7}.bsiSP-com label{display:flex;align-items:center;gap:6px;font:500 .82rem system-ui,sans-serif;color:#cfe3f7}' +
      '.bsiSP-com select{min-height:36px;border-radius:8px;background:#0a1b2e;color:#e6f2ff;border:1px solid #2a4a6e}' +
      '.bsiSP-tempo{width:100%;margin:2px 0 6px;accent-color:#00c9b7}' +
      '.bsiSP-scelte{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.bsiSP-scelte button{min-height:36px;border-radius:18px;border:1px solid #2a4a6e;background:#0a1b2e;color:#cfe3f7;font:600 .8rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}.bsiSP-scelte button[aria-pressed="true"]{border-color:#ffb547;color:#ffb547}' +
      '.bsiSP-cat{font:700 .72rem system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9fb3c8;margin:8px 0 2px;width:100%}' +
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
      uniforms: { uCol: { value: new T.Color(1, 0.7, 0.3) }, uCol2: { value: new T.Color(0.35, 0.06, 0.06) }, uTempo: { value: 0 }, uScala: { value: 9 }, uModo: { value: 0 }, uCaldo: { value: 0 }, uOpac: { value: 1 }, uMacchie: { value: 0 }, uLampo: { value: 0 }, uFronte: { value: 0 }, uColL: { value: new T.Color(0.85, 0.92, 1) } },
      vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: ['uniform vec3 uCol; uniform vec3 uCol2; uniform float uTempo; uniform float uScala; uniform float uModo; uniform float uCaldo; uniform float uOpac; uniform float uMacchie; uniform float uLampo; uniform float uFronte; uniform vec3 uColL; varying vec3 vP; varying vec3 vN; varying vec3 vV;', RUMORE,
        'void main(){ vec3 q = normalize(vP); float mu = clamp(dot(normalize(vN), normalize(vV)), 0., 1.); vec3 col; float a = uOpac;',
        '  if (uModo < 0.5) { vec2 v = voronoi(q*uScala, uTempo*0.5); float bordo = smoothstep(0.0, 0.2, v.y - v.x); vec2 v2 = voronoi(q*uScala*3.1 + 7., uTempo*0.8); float fine = smoothstep(0.0, 0.25, v2.y - v2.x);',
        '    float gr = clamp(0.3 + 0.7*bordo*(0.8 + 0.2*fine) - 0.2*v.x, 0., 1.); col = mix(uCol2, uCol, gr);',
        '    float sp = fbm(q*2.1 + vec3(uTempo*0.004, 1.3, 0.)); float umbra = smoothstep(0.69, 0.72, sp)*uMacchie; float pen = (smoothstep(0.63, 0.69, sp)*uMacchie) - umbra; col *= 1. - 0.78*umbra - 0.38*pen;',
        '    float fac = smoothstep(0.55, 0.78, fbm(q*7. + 3.))*pow(1. - mu, 1.6); col += uCol*fac*0.32;',
        '    col *= 1. - 0.6*(1. - mu); col = mix(col, uCol2*0.6, pow(1. - mu, 3.)*0.5); }',
        '  else if (uModo < 1.5) { col = uCol*(0.82 + 0.18*fbm(q*6. + uTempo*0.05)); col *= 1. - 0.35*(1. - mu); }',
        '  else if (uModo < 2.5) { float n = fbm(q*3.5 + vec3(0., 0., uTempo*0.02)); col = mix(uCol2, uCol, smoothstep(0.35, 0.65, n)); float cr = 1. - smoothstep(0.0, 0.035, abs(n - 0.5)); col = col*(0.35 + 0.65*mu) + vec3(1., 0.45, 0.12)*cr*uCaldo*0.85; }',
        '  else if (uModo < 3.5) { float b = sin(q.y*16. + 2.6*fbm(q*vec3(2., 6., 2.) + vec3(uTempo*0.04, 0., 0.))); col = mix(uCol2, uCol, 0.5 + 0.5*b); col *= 0.4 + 0.6*mu; }',
        '  else { float n = fbm(q*2.6 + vec3(uTempo*0.03)); col = uCol*(0.45 + 0.8*n); a = uOpac*(0.25 + 0.6*n)*(0.45 + 0.55*(1. - mu)); }',
        '  if (uLampo > 0.) { float an = acos(clamp(dot(q, normalize(vec3(0.3, 0.55, 0.78))), -1., 1.)); float fr = smoothstep(uFronte, uFronte - 0.35, an); float bordoF = exp(-pow((an - uFronte)*9., 2.)); col = mix(col, uColL, clamp(fr*uLampo*0.85 + bordoF*uLampo*0.6, 0., 1.)); }',
        '  gl_FragColor = vec4(min(col, vec3(0.93)), a); }'].join('\n'),
      side: 2, transparent: true
    });
  }
  function matPareti(T) {
    var R = [], C = []; for (var i = 0; i < 8; i++) { R.push(0); C.push(new T.Color(1, 1, 1)); }
    return new T.ShaderMaterial({
      uniforms: { uR: { value: R }, uC: { value: C }, uN: { value: 0 }, uNuc: { value: 0.2 }, uTempo: { value: 0 }, uStrati: { value: 1 }, uScuro: { value: 0 }, uRame: { value: new T.Color(0.95, 0.5, 0.22) }, uOpac: { value: 1 }, uCrist: { value: 0 }, uPulsa: { value: 0 } },
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: ['uniform float uR[8]; uniform vec3 uC[8]; uniform float uN; uniform float uNuc; uniform float uTempo; uniform float uStrati; uniform float uScuro; uniform vec3 uRame; uniform float uOpac; uniform float uCrist; uniform float uPulsa; varying vec2 vQ;',
        'float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5); } float vn2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3. - 2.*f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }',
        'void main(){ float r = length(vQ); vec3 base = mix(uRame*1.12, uRame*0.55, r); vec3 col = base;',
        '  if (uStrati > 0.5) { vec3 lc = uC[0]; for (int i = 0; i < 8; i++) { if (float(i) < uN && r < uR[i]) lc = uC[i]; } lc = mix(lc, uRame, 0.3); col = mix(base, lc*(0.75 + 0.4*(1. - r)), 0.42);',
        '    for (int i = 1; i < 8; i++) { if (float(i) < uN && uR[i] > 0.001) col += vec3(1., 0.86, 0.62)*0.42*exp(-abs(r - uR[i])*260.); } }',
        '  else { for (int i = 1; i < 8; i++) { if (float(i) < uN && uR[i] > 0.001) col += vec3(1., 0.8, 0.55)*0.14*exp(-abs(r - uR[i])*300.); } }',
        '  col *= 1. + 0.035*sin(r*70. - uTempo*1.2); float turb = vn2(vQ*9. + vec2(uTempo*0.05, 0.)) + 0.5*vn2(vQ*23. - vec2(0., uTempo*0.08)); col *= 0.9 + 0.14*turb;',
        '  if (uPulsa > 0. && uN > 1.) { col += vec3(1., 0.55, 0.85)*uPulsa*0.5*exp(-abs(r - uR[1])*60.); }',
        '  if (uCrist > 0. && r < uCrist) { vec2 g = vQ*42.; vec2 a2 = mod(g, vec2(1., 1.732)) - vec2(0.5, 0.866); vec2 b2 = mod(g + vec2(0.5, 0.866), vec2(1., 1.732)) - vec2(0.5, 0.866); float d = min(dot(a2, a2), dot(b2, b2)); float nodo = smoothstep(0.05, 0.0, d); col = mix(col, vec3(0.78, 0.88, 1.), 0.55) + vec3(0.9, 0.95, 1.)*nodo*0.6; col += vec3(0.6, 0.8, 1.)*0.5*exp(-abs(r - uCrist)*80.); }',
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

  /** (v261) il guscio espulso come VOLUME: si attraversa a passi un guscio di gas turbolento (rumore frattale + filamenti),
      emissione per temperatura e assorbimento; i passi calano da soli se il telefono rallenta */
  function matVolume(T) {
    return new T.ShaderMaterial({
      uniforms: { uR: { value: 1 }, uSp: { value: 0.3 }, uRout: { value: 2 }, uCaldo: { value: 1 }, uOpac: { value: 0 }, uTempo: { value: 0 }, uSeme: { value: new T.Vector3(1.3, 2.1, 0.7) }, uPassi: { value: 30 }, uSchiaccia: { value: 1 }, uC1: { value: new T.Color(1, 0.86, 0.5) }, uC2: { value: new T.Color(1, 0.42, 0.12) }, uC3: { value: new T.Color(0.6, 0.1, 0.06) } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: ['uniform float uR; uniform float uSp; uniform float uRout; uniform float uCaldo; uniform float uOpac; uniform float uTempo; uniform vec3 uSeme; uniform float uPassi; uniform float uSchiaccia; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; varying vec3 vW;', RUMORE,
        'void main(){ vec3 k = vec3(1., 1., 1./uSchiaccia); vec3 o = cameraPosition*k; vec3 d = normalize((vW - cameraPosition)*k);',
        '  float b = dot(o, d), c = dot(o, o) - uRout*uRout, h = b*b - c; if (h < 0.) discard; h = sqrt(h); float t0 = max(-b - h, 0.), t1 = -b + h; if (t1 <= t0) discard;',
        '  float dt = (t1 - t0)/uPassi; vec3 acc = vec3(0.); float tr = 1.;',
        '  for (int i = 0; i < 48; i++) { if (float(i) >= uPassi) break; float t = t0 + (float(i) + 0.5)*dt; vec3 p = o + d*t; float r = length(p);',
        '    float sh = exp(-pow((r - uR)/uSp, 2.)); if (sh < 0.02) continue;',
        '    vec3 q = p/max(uR, 0.2); float n = fbm(q*2.3 + uSeme + vec3(0., 0., uTempo*0.04)); float fil = 1. - abs(2.*vn(q*5.5 + uSeme*1.7) - 1.);',
        '    float dens = sh*smoothstep(0.35, 0.85, n*0.7 + fil*0.45)*uOpac*2.2;',
        '    float kk = clamp((r - uR)/uSp*0.5 + 0.5, 0., 1.); vec3 col = mix(uC1, uC2, kk); col = mix(uC3, col, uCaldo);',
        '    float a = 1. - exp(-dens*dt*1.1); acc += tr*a*col*(0.6 + 0.9*n)*0.75; tr *= 1. - a*0.55; if (tr < 0.03) break; }',
        '  gl_FragColor = vec4(min(acc, vec3(0.92)), 1. - tr); }'].join('\n'),
      side: 1, transparent: true, depthWrite: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor
    });
  }
  /** corona con i getti radiali e le protuberanze ad arco sul bordo: un piano sempre rivolto alla camera */
  function matCorona(T) {
    return new T.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uCol: { value: new T.Color(1, 0.8, 0.55) }, uOp: { value: 1 }, uProm: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
      fragmentShader: ['uniform float uT; uniform vec3 uCol; uniform float uOp; uniform float uProm; varying vec2 vUv;',
        'void main(){ vec2 p = (vUv - 0.5)*4.; float r = length(p); if (r < 1.0) discard; float a = atan(p.y, p.x);',
        '  float st = 0.5 + 0.5*sin(a*7. + 2.*sin(a*3. + uT*0.08)); st = pow(st, 3.)*0.7 + 0.3*(0.5 + 0.5*sin(a*19. - uT*0.05));',
        '  float cor = exp(-(r - 1.)*3.2)*(0.3 + 0.7*st)*0.5;',
        '  float pr = 0.; for (int k = 0; k < 3; k++) { float ak = float(k)*2.1 + 0.55; float w = 0.12 + 0.03*float(k); float dx = mod(a - ak + 3.14159, 6.28318) - 3.14159; float x = dx/w;',
        '    if (abs(x) < 1.) { float hg = (0.07 + 0.03*float(k))*sqrt(1. - x*x)*(0.85 + 0.15*sin(uT*0.3 + float(k))); float dd = abs((r - 1.) - hg); pr += exp(-dd*dd/0.0003)*(0.7 + 0.3*sin(x*9. + uT*0.7 + float(k)*2.)); } }',
        '  vec3 c = uCol*cor + vec3(1., 0.32, 0.18)*pr*uProm*0.8; gl_FragColor = vec4(c*uOp, 1.); }'].join('\n'),
      transparent: true, depthWrite: false, blending: T.AdditiveBlending
    });
  }
  /** disco di accrescimento: T ∝ r^(−3/4), rotazione kepleriana (ω ∝ r^(−3/2)), lato che si avvicina più luminoso */
  function matDisco(T) {
    return new T.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uOp: { value: 0 }, uRin: { value: 0.2 }, uRout: { value: 1.5 }, uCam: { value: new T.Vector2(0, 1) }, uCaldo: { value: 1 } },
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
      fragmentShader: ['uniform float uT; uniform float uOp; uniform float uRin; uniform float uRout; uniform vec2 uCam; uniform float uCaldo; varying vec2 vQ;',
        'float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5); } float vn2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3. - 2.*f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }',
        'void main(){ float r = length(vQ); if (r < uRin || r > uRout) discard; float a = atan(vQ.y, vQ.x); float x = (r - uRin)/(uRout - uRin);',
        '  float Tn = pow(uRin/r, 0.75)*uCaldo; vec3 hot = vec3(0.86, 0.92, 1.), warm = vec3(1., 0.72, 0.38), cool = vec3(0.75, 0.22, 0.1);',
        '  vec3 c = mix(cool, warm, smoothstep(0.25, 0.6, Tn)); c = mix(c, hot, smoothstep(0.62, 1., Tn));',
        '  float om = pow(r/uRin, -1.5); float aa = a + uT*om*0.9; float n = vn2(vec2(aa*4., r*14.)) *0.6 + vn2(vec2(aa*11., r*35.))*0.4;',
        '  float dop = 1. + 0.5*dot(vec2(-sin(a), cos(a)), uCam);',
        '  float bordo = smoothstep(0., 0.06, x)*(1. - smoothstep(0.7, 1., x));',
        '  gl_FragColor = vec4(min(c*(0.5 + 0.7*n)*dop*(0.4 + 0.9*Tn), vec3(0.95)), bordo*uOp*(0.55 + 0.45*n)); }'].join('\n'),
      side: 2, transparent: true, depthWrite: false, blending: T.AdditiveBlending
    });
  }
  /** getto: cono con nodi che scorrono verso l'esterno */
  function matGetto(T, col) {
    return new T.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uOp: { value: 0 }, uCol: { value: new T.Color(col || '#bfe0ff') } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
      fragmentShader: ['uniform float uT; uniform float uOp; uniform vec3 uCol; varying vec2 vUv;',
        'float h(float x){ return fract(sin(x*91.7)*43758.5); } float n1(float x){ float i = floor(x), f = fract(x); return mix(h(i), h(i + 1.), f*f*(3. - 2.*f)); }',
        'void main(){ float y = vUv.y; float bordo = sin(3.14159*vUv.x); float nodi = 0.55 + 0.45*n1(y*14. - uT*5.) ; float a = pow(bordo, 3.)*(1. - y)*nodi*uOp; gl_FragColor = vec4(uCol*a*1.2, a); }'].join('\n'),
      transparent: true, depthWrite: false, side: 2, blending: T.AdditiveBlending
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
    /* (v261) cielo: stelle con il loro colore e la fascia della Via Lattea, più fitta verso il centro galattico */
    (function () { var n = 2400, nv = 9000, N = n + nv, p = new Float32Array(N * 3), cl = new Float32Array(N * 3), r2 = rnd32(3), R = 60, inc = 0.9;
      for (var i = 0; i < N; i++) { var x, y, z, k;
        if (i < n) { z = 2 * r2() - 1; var a = 2 * PI * r2(), s0 = Math.sqrt(1 - z * z); x = s0 * Math.cos(a); y = s0 * Math.sin(a); k = 0.35 + 0.65 * Math.pow(r2(), 4); }
        else { var lo = 2 * PI * r2(), g1 = r2() + r2() + r2() - 1.5, la = g1 * (0.09 + 0.12 * Math.exp(-Math.pow((lo - 3.4) / 0.6, 2))); x = Math.cos(la) * Math.cos(lo); y = Math.cos(la) * Math.sin(lo); z = Math.sin(la); var yy = y * Math.cos(inc) - z * Math.sin(inc); z = y * Math.sin(inc) + z * Math.cos(inc); y = yy; k = 0.12 + 0.28 * r2() * (1 + 1.5 * Math.exp(-Math.pow((lo - 3.4) / 0.5, 2))); }
        p[3 * i] = R * x; p[3 * i + 1] = R * y; p[3 * i + 2] = R * z;
        var tc = r2(), cc = tc < 0.25 ? [0.75, 0.82, 1] : tc < 0.7 ? [1, 0.96, 0.9] : [1, 0.82, 0.62]; cl[3 * i] = cc[0] * k; cl[3 * i + 1] = cc[1] * k; cl[3 * i + 2] = cc[2] * k; }
      var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(p, 3)); gg.setAttribute('color', new T.BufferAttribute(cl, 3));
      radice.add(new T.Points(gg, new T.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }))); })();
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
    mSup.uniforms.uMacchie.value = sc.id === 'sole' || sc.id === 'nanarossa' ? 1 : tipo === 'stella' ? 0.45 : 0;
    var mCor = matCorona(T), corona = new T.Mesh(new T.PlaneGeometry(1, 1), mCor); corona.visible = tipo === 'stella'; corona.renderOrder = 3; radice.add(corona);
    mCor.uniforms.uCol.value.copy(cb).lerp(new T.Color(1, 1, 1), 0.3); mCor.uniforms.uProm.value = sc.id === 'sole' || sc.id === 'nanarossa' || sc.id === 'supernova' ? 1 : 0.5;
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
    var NS_ = 6000, gS = new T.BufferGeometry(), dS = new Float32Array(NS_ * 3), kS = new Float32Array(NS_), mS_ = new Float32Array(NS_);
    for (i = 0; i < NS_; i++) { var zz = 2 * rnd() - 1, aa = 2 * PI * rnd(), ss = Math.sqrt(1 - zz * zz), dx = ss * Math.cos(aa), dy = ss * Math.sin(aa); dS[3 * i] = dx; dS[3 * i + 1] = dy; dS[3 * i + 2] = zz;
      var fr = 0.5 * Math.sin(3 * dx + 2 * dy) * Math.cos(4 * zz + dx) + 0.3 * Math.sin(7 * dy - 5 * zz) + 0.2 * Math.sin(11 * dx + 9 * zz); kS[i] = 0.82 + 0.16 * fr + 0.14 * (rnd() - 0.5) * (1 + rnd()); mS_[i] = 0.35 + 0.8 * rnd() * rnd(); }
    gS.setAttribute('position', new T.BufferAttribute(new Float32Array(NS_ * 3), 3)); gS.setAttribute('aD', new T.BufferAttribute(dS, 3)); gS.setAttribute('aK', new T.BufferAttribute(kS, 1)); gS.setAttribute('aS', new T.BufferAttribute(mS_, 1));
    var pr = S.ren.getPixelRatio ? S.ren.getPixelRatio() : 1, mG = matGuscio(T), guscio = new T.Points(gS, mG); guscio.frustumCulled = false; mG.uniforms.uMis.value *= pr; guscio.visible = false; radice.add(guscio);
    if (tipo === 'stella' && sc.id === 'sole') { mG.uniforms.uC1.value.setRGB(0.55, 1, 0.92); mG.uniforms.uC2.value.setRGB(0.3, 0.85, 0.85); mG.uniforms.uC3.value.setRGB(0.95, 0.3, 0.35); }
    if (sc.id === 'kilonova') { mG.uniforms.uC1.value.setRGB(0.6, 0.85, 1); mG.uniforms.uC2.value.setRGB(0.9, 0.45, 0.25); mG.uniforms.uC3.value.setRGB(0.55, 0.1, 0.08); }
    var mVol = matVolume(T), vol = new T.Mesh(new T.SphereGeometry(1, 32, 24), mVol); vol.visible = false; vol.renderOrder = 4; vol.frustumCulled = false; radice.add(vol);
    function colVol(a, b, c) { mVol.uniforms.uC1.value.copy(a); mVol.uniforms.uC2.value.copy(b); mVol.uniforms.uC3.value.copy(c); }
    colVol(mG.uniforms.uC1.value, mG.uniforms.uC2.value, mG.uniforms.uC3.value);
    var tFot = [], passiVol = 30;
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
    if (tipo === 'binaria' && sc.id !== 'quasar') {
      var bhC = !!sc.corpo.bh;
      ns1 = new T.Mesh(new T.SphereGeometry(bhC ? 0.13 : 0.11, 24, 16), new T.MeshBasicMaterial({ color: bhC ? 0x000000 : 0xdbeaff })); ns2 = ns1.clone(); if (bhC) ns2.scale.setScalar(0.9); radice.add(ns1); radice.add(ns2);
      [ns1, ns2].forEach(function (n) { var a = sprite(T, bhC ? anello : alone, bhC ? 0xffffff : 0x9fc8ff, true); a.scale.set(bhC ? 0.62 : 0.6, bhC ? 0.62 : 0.6, 1); a.material.opacity = bhC ? 0.95 : 0.5; a.material.depthTest = true; n.add(a); if (bhC) { var om = new T.Mesh(new T.CircleGeometry(0.15, 40), new T.MeshBasicMaterial({ color: 0x000000 })); om.renderOrder = 6; n.userData.ombra = om; n.add(om); } });
      if (sc.id === 'quasar') { ns1.visible = ns2.visible = false; }
      if (bhC) { var lente = sprite(T, alone, 0x6bcfff, true); lente.scale.set(2.2, 2.2, 1); lente.material.opacity = 0.18; ns1.add(lente); }
      for (i = 0; i < 5; i++) { var pts = []; for (var k = 0; k <= 96; k++) pts.push(new T.Vector3(Math.cos(k / 96 * 2 * PI), Math.sin(k / 96 * 2 * PI), 0)); var lo = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.3 })); radice.add(lo); onde.push(lo); }
    }
    /* stelle che nascono e muoiono nella nube (galassia) */
    var lucciole = [];
    if (tipo === 'nube') for (i = 0; i < 40; i++) { var sp = sprite(T, alone, 0xfff0d0, true); sp.position.set(-Math.abs(rnd() * 0.8), (rnd() - 0.5) * 1.4, -Math.abs(rnd() * 0.8)); sp.userData = { f: rnd(), g: Math.floor(rnd() * 9) + 1 }; sp.scale.set(0.12, 0.12, 1); corpo.add(sp); lucciole.push(sp); }

    /* ── (v261) gli effetti accesi dagli stadi (st.fx) ── */
    var asse = new T.Group(); asse.rotation.x = sc.id === 'quasar' || sc.id === 'tde' ? 1.25 : 1.35; asse.rotation.y = 0.25; radice.add(asse);
    var Dsc = sc.disco || (sc.id === 'quasar' ? { rin: 0.22, rout: 2.4 } : sc.id === 'tde' ? { rin: 0.2, rout: 1.1 } : sc.id === 'grb' ? { rin: 0.05, rout: 0.35 } : sc.id === 'protostella' ? { rin: 0.35, rout: 2.6 } : sc.id === 'lampox' ? { rin: 0.32, rout: 1.25 } : { rin: 0.5, rout: 1.3 });
    var mDis = matDisco(T), disco2 = new T.Mesh(new T.RingGeometry(Dsc.rin, Dsc.rout, 160, 6), mDis); mDis.uniforms.uRin.value = Dsc.rin; mDis.uniforms.uRout.value = Dsc.rout; disco2.visible = false; asse.add(disco2);
    if (sc.id === 'protostella') mDis.uniforms.uCaldo.value = 0.45;
    var getti = new T.Group(); getti.visible = false; asse.add(getti);
    [1, -1].forEach(function (v) { var lG = sc.id === 'quasar' ? 6 : sc.id === 'protostella' ? 3.4 : 4, gm = new T.CylinderGeometry(sc.id === 'grb' ? 0.015 : 0.03, sc.id === 'grb' ? 0.12 : 0.22, lG, 32, 1, true); gm.translate(0, lG / 2, 0); gm.rotateX(v > 0 ? PI / 2 : -PI / 2); var m = new T.Mesh(gm, matGetto(T, sc.id === 'protostella' ? '#ffb0d0' : '#bfe0ff')); m.renderOrder = 5; getti.add(m); });
    var bucoX = new T.Group(); bucoX.visible = false; radice.add(bucoX);
    var rBH = sc.id === 'quasar' ? 0.2 : sc.id === 'grb' ? 0.04 : 0.16;
    bucoX.add(new T.Mesh(new T.SphereGeometry(rBH, 32, 24), new T.MeshBasicMaterial({ color: 0x000000 })));
    var anelloX = sprite(T, anello, 0xffffff, true); anelloX.scale.set(rBH * 4.6, rBH * 4.6, 1); bucoX.add(anelloX);
    var fasci = new T.Group(); fasci.visible = false; radice.add(fasci);
    var magn = new T.Group(); magn.rotation.x = 0.45; fasci.add(magn);
    [1, -1].forEach(function (v) { var gm = new T.CylinderGeometry(0.02, 0.32, 4.5, 24, 1, true); gm.translate(0, 2.25 + 0.3, 0); if (v < 0) gm.rotateX(PI); var m = new T.Mesh(gm, matGetto(T, '#9fd8ff')); m.renderOrder = 5; magn.add(m); });
    var campo = new T.Group(); magn.add(campo);
    [1.4, 2.1, 3.0].forEach(function (Lc) { for (var az = 0; az < 6; az++) { var pts = []; for (var th = 0.12; th <= PI - 0.12; th += 0.04) { var rr = Lc * Math.sin(th) * Math.sin(th); if (rr < 0.36) continue; pts.push(new T.Vector3(rr * Math.sin(th) * Math.cos(az * PI / 3), rr * Math.cos(th), rr * Math.sin(th) * Math.sin(az * PI / 3))); } if (pts.length > 2) campo.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x5fe3d6, transparent: true, opacity: 0.32 }))); } });
    var NM = 2600, gM = new T.BufferGeometry(), pM = new Float32Array(NM * 3), eM = []; for (var im = 0; im < NM; im++) eM.push([rnd() * 2 - 1, rnd(), rnd()]);
    gM.setAttribute('position', new T.BufferAttribute(pM, 3)); var flussoM = new T.Points(gM, new T.PointsMaterial({ color: 0xffd8a0, size: 0.03, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending })); flussoM.visible = false; flussoM.frustumCulled = false; radice.add(flussoM);
    var lampiSup = []; for (var il = 0; il < 3; il++) { var ls0 = sprite(T, alone, 0xffe8c0, true); ls0.visible = false; ls0.userData = { f: rnd(), a: rnd() * 2 * PI }; radice.add(ls0); lampiSup.push(ls0); }
    var bolle = []; if (sc.id === 'ricombinazione') for (var ib = 0; ib < 26; ib++) { var gb = new T.Group(), cen = sprite(T, alone, 0xfff4d8, true), bo = sprite(T, alone, 0x5fd8ff, true); cen.scale.set(0.08, 0.08, 1); bo.material.opacity = 0.35; gb.add(bo); gb.add(cen); gb.position.set(-Math.abs(rnd() * 0.75) - 0.05, (rnd() - 0.5) * 1.5, -Math.abs(rnd() * 0.75) - 0.05); gb.userData = { bo: bo, s: 0.25 + rnd() * 0.5, f: rnd() }; corpo.add(gb); bolle.push(gb); }
    function fxDi(st) { return (st && st.fx) || {}; }
    function fxVal(nome, s0) { var st = sc.stadi[s0.i], pr = s0.i ? sc.stadi[s0.i - 1] : null, b = fxDi(st)[nome] || 0, a = pr ? (fxDi(pr)[nome] || 0) : b, u0 = s0.fin ? 1 : Math.min(1, s0.u * 2.5); return a + (b - a) * easeIO(u0); }
    function valStadio(nome, s0, def) { var st = sc.stadi[s0.i], pr = s0.i ? sc.stadi[s0.i - 1] : null, b = st[nome] != null ? st[nome] : def, a = pr ? (pr[nome] != null ? pr[nome] : def) : b; return a + (b - a) * easeIO(s0.fin ? 1 : s0.u); }
    if (sc.corpo.bh && tipo === 'binaria') { /* la coppia di buchi neri al posto delle stelle di neutroni (sotto) */ }

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
      var senzaP = sc.senzaPareti && sc.senzaPareti.indexOf(s.i) >= 0 && !s.fin; p1.visible = p2.visible = !senzaP; punti.visible = sc.id !== 'giove' && !senzaP;
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
        if (sc.id === 'ia') { compagna.visible = !esploso || s.u < 0.1 && s.i === esplosoI; flusso.visible = disco.visible = s.i === 0; }
        else { compagna.visible = true; disco.visible = false; flusso.visible = fxVal('compagna', s) > 0.5 && fxVal('lampo', s) < 0.5; }
        mC_t(tempo);
        if (flusso.visible) { var P0 = compagna.position, dl = Math.hypot(P0.x, P0.y, P0.z), A1 = [P0.x * (1 - 0.85 / dl), P0.y * (1 - 0.85 / dl), P0.z * (1 - 0.85 / dl)], Q1 = [-P0.y / dl * 0.6, P0.x / dl * 0.6, 0], C1 = [(A1[0] + Q1[0]) / 2 + Q1[0] * 0.5, (A1[1] + Q1[1]) / 2 + Q1[1] * 0.5, 0.12];
          for (var k = 0; k < NF; k++) { var w = ((MENO_MOTO ? 0.5 : tempo * 0.3) + k / NF) % 1, a0 = (1 - w) * (1 - w), a1 = 2 * w * (1 - w), a2 = w * w, jit = (k % 7 - 3) * 0.006; pF[3 * k] = a0 * A1[0] + a1 * C1[0] + a2 * Q1[0] + jit; pF[3 * k + 1] = a0 * A1[1] + a1 * C1[1] + a2 * Q1[1] - jit; pF[3 * k + 2] = a0 * A1[2] + a1 * C1[2] + a2 * Q1[2]; }
          flusso.geometry.attributes.position.needsUpdate = true; disco.rotation.z = tempo * 0.4; }
      }
      /* binaria che spiraleggia */
      if (ns1) {
        var spir = s.i === 0 && !s.fin && sc.id !== 'quasar'; ns1.visible = ns2.visible = spir; onde.forEach(function (o) { o.visible = spir; });
        if (spir) { var tc = 1 - s.u, sep = Math.max(0.12, 1.5 * Math.pow(tc + 0.0005, 0.25)), fase = (1 - Math.pow(tc + 0.0005, 0.625)) * 90; ns1.position.set(sep / 2 * Math.cos(fase), sep / 2 * Math.sin(fase), 0); ns2.position.set(-ns1.position.x, -ns1.position.y, 0); [ns1, ns2].forEach(function (n) { if (n.userData.ombra) n.userData.ombra.quaternion.copy(S.cam.quaternion); });
          var per = 0.25 + 1.2 * Math.pow(tc, 0.375); onde.forEach(function (o, j) { var ph = ((tempo / per) + j / onde.length) % 1, R = 0.3 + ph * 5; o.scale.set(R, R, 1); o.material.opacity = 0.35 * (1 - ph); }); }
      }
      /* il corpo: visibile prima dell'esplosione; nel caso di Ia e kilonova diventa la nube dei prodotti, stratificata */
      var corpoVis = true, scala = sc0 * (tipo === 'nana' && !esploso ? 0.42 : 1);
      if (tipo === 'binaria') corpoVis = s.i >= 1;
      if (esploso && esplosoI >= 0 && !sc.residuoCorpo) { var eta = s.tau - L.inizi[esplosoI]; scala = 0.35 + 1.0 * (1 - Math.exp(-eta / 1.2)) + 0.05 * eta; mSup.uniforms.uModo.value = 4; mSup.uniforms.uOpac.value = Math.max(0.25, 0.75 - eta * 0.05); }
      else { var md = sc.stadi[s.i].modo || tipo; mSup.uniforms.uModo.value = MODI[md] != null ? MODI[md] : 0; if (tipo !== 'universo') mSup.uniforms.uOpac.value = md === 'nube' ? 0.85 : 1; if (md === 'stella') mSup.uniforms.uScala.value = 20; }
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
      } else if (esploso) {
        var e4 = s.tau - L.inizi[esplosoI], kR = sc.residuoCorpo ? 0.5 : 1; guscio.visible = true; mG.uniforms.uSchiaccia.value = sc.id === 'kilonova' ? 0.7 : sc.id === 'grb' ? 0.8 : 1;
        mG.uniforms.uR.value = (0.5 + 2.2 * (1 - Math.exp(-e4 / 1.4)) + 0.08 * e4) * kR + (sc.residuoCorpo ? 0.35 : 0); mG.uniforms.uCaldo.value = Math.max(0, 1 - e4 / 6); mG.uniforms.uOpac.value = Math.min(1, e4 / 0.25) * Math.max(0.35, 1 - e4 / 12); mG.uniforms.uDens.value = Math.min(1, Math.pow(mG.uniforms.uR.value / 2.2, 2));
        if (e4 < 0.6) { lampo.visible = true; lampo.material.opacity = (MENO_MOTO ? 0.35 : 0.7) * (1 - e4 / 0.6); var l2 = 0.8 + 3 * e4; lampo.scale.set(l2, l2, 1); }
        if (sc.id === 'kilonova' && e4 > 0.5) { buco.visible = anelloBH.visible = true; anelloBH.scale.set(0.6, 0.6, 1); anelloBH.material.opacity = 0.8; risultato.residuo = 'bh?'; }
        espulsiAggiorna(e4, sc.stadi[esplosoI].nuovi, mG.uniforms.uR.value);
      } else espulsiAggiorna(-1, [], 0);
      /* ── (v261) effetti ── */
      scala *= valStadio('scala', s, 1);
      var nasc = valStadio('nascondiCorpo', s, 0); if (nasc > 0.99) corpoVis = false; scala *= 1 - 0.55 * nasc;
      var fP = fxVal('pulsa', s); mPar.uniforms.uPulsa.value = 0;
      if (fP > 0) { var ph = Math.sin(2 * PI * (s.fin ? 0 : s.u)); scala *= 1 + 0.08 * ph * fP; mSup.uniforms.uCol.value.lerp(new T.Color(1, 1, 1), Math.max(0, -ph) * 0.18); mPar.uniforms.uPulsa.value = 0.5 + 0.5 * ph; }
      mPar.uniforms.uCrist.value = valStadio('cristallo', s, 0);
      if (sc.id === 'ricombinazione') { var nb = fxVal('nebbia', s), bl = fxVal('bolle', s); mSup.uniforms.uOpac.value = 0.08 + 0.85 * nb; mSup.uniforms.uCol.value.setRGB(0.4 + 0.6 * nb, 0.25 + 0.45 * nb, 0.2 + 0.15 * nb); mPar.uniforms.uRame.value.setRGB(0.18 + 0.8 * nb, 0.2 + 0.35 * nb, 0.36 - 0.1 * nb); mPar.uniforms.uStrati.value = 0;
        bolle.forEach(function (b) { var on = s.i >= 3 || s.fin; b.visible = on; var rr = b.userData.s * bl * (0.6 + 0.4 * Math.sin((MENO_MOTO ? 0 : tempo) * 0.5 + b.userData.f * 6)); b.userData.bo.scale.set(rr, rr, 1); b.userData.bo.material.opacity = 0.3 * Math.min(1, bl * 2); }); }
      var fL = fxVal('lampo', s); mSup.uniforms.uLampo.value = fL;
      if (fL > 0) { var stL = sc.stadi[s.i], prL = s.i ? sc.stadi[s.i - 1] : null, nuovoL = (fxDi(stL).lampo || 0) > (prL ? (fxDi(prL).lampo || 0) : 0); mSup.uniforms.uFronte.value = nuovoL && !s.fin ? Math.min(PI + 0.4, s.u * 3.5 * PI) : PI + 0.4; mSup.uniforms.uColL.value.set(sc.id === 'nova' ? '#fff2b0' : sc.id === 'pulsar' ? '#e6d4ff' : '#d8ecff'); }
      var fD = fxVal('disco', s); disco2.visible = fD > 0.01; mDis.uniforms.uOp.value = fD; mDis.uniforms.uT.value = MENO_MOTO ? 0 : tempo;
      if (disco2.visible) { var cl = disco2.worldToLocal(S.cam.position.clone()); var v2 = new T.Vector2(cl.x, cl.y); if (v2.length() > 1e-6) v2.normalize(); mDis.uniforms.uCam.value.copy(v2); }
      var fGt = fxVal('getti', s); getti.visible = fGt > 0.01; getti.children.forEach(function (m) { m.material.uniforms.uOp.value = fGt; m.material.uniforms.uT.value = MENO_MOTO ? 0 : tempo; }); getti.scale.set(1, 1, 0.2 + 0.8 * fGt);
      var fB = fxVal('buco', s); bucoX.visible = fB > 0.01; anelloX.material.opacity = fB;
      if (sc.id === 'bhbh' && s.i === 1 && !s.fin) { var rg = 1 + 0.25 * Math.exp(-s.u * 4) * Math.sin(s.u * 50); bucoX.scale.setScalar(rg); } else bucoX.scale.setScalar(1);
      var fF = fxVal('fasci', s), fC = fxVal('campo', s); fasci.visible = fF > 0.01 || fC > 0.01;
      if (fasci.visible) { magn.children.forEach(function (m) { if (m.material && m.material.uniforms) { m.material.uniforms.uOp.value = fF; m.material.uniforms.uT.value = MENO_MOTO ? 0 : tempo; } }); campo.children.forEach(function (l) { l.material.opacity = 0.32 * fC; }); fasci.scale.setScalar(Math.max(0.3, scala)); if (!MENO_MOTO) fasci.rotation.z += dt * 6 * valStadio('spin', s, 1); }
      /* distruzione mareale: l'orbita parabolica della stella, poi il filamento (metà legata, metà in fuga) */
      var fM = fxVal('marea', s);
      if (sc.id === 'tde') {
        var rp = 0.75, nu0 = -2.3 + 2.25 * easeIO(s.i === 0 && !s.fin ? s.u : 1), rr0 = 2 * rp / (1 + Math.cos(nu0));
        corpo.position.set(rr0 * Math.cos(nu0), rr0 * Math.sin(nu0) * 0.85, rr0 * Math.sin(nu0) * 0.3);
        flussoM.visible = fM > 0.01;
        if (flussoM.visible) { var ts = s.i === 1 ? s.u * sc.stadi[1].anim : s.tau - L.inizi[1]; ts = Math.max(0, ts);
          for (var k = 0; k < NM; k++) { var e = eM[k][0], nuK = nu0 + e * 0.55 * Math.pow(ts + 0.01, 0.8), rK = 2 * rp / (1 + Math.cos(Math.max(-2.6, Math.min(2.6, nuK)))) * (1 + 0.45 * e * ts), x, y, z;
            if (e < 0 && ts > 1.2) { var g2 = Math.min(1, (ts - 1.2) / 2.5), ang = nuK + tempo * 1.5 / Math.pow(0.25 + eM[k][1] * 0.8, 1.5), rc = Dsc.rin + eM[k][1] * (Dsc.rout - Dsc.rin); var xd = rc * Math.cos(ang), yd = rc * Math.sin(ang); var pd = asse.localToWorld(new T.Vector3(xd, yd, 0)); x = rK * Math.cos(nuK) * (1 - g2) + pd.x * g2; y = rK * Math.sin(nuK) * 0.85 * (1 - g2) + pd.y * g2; z = rK * Math.sin(nuK) * 0.3 * (1 - g2) + pd.z * g2; }
            else { x = rK * Math.cos(nuK); y = rK * Math.sin(nuK) * 0.85; z = rK * Math.sin(nuK) * 0.3; }
            var sp2 = 0.04 * (eM[k][1] - 0.5) * (1 + ts * 0.3); pM[3 * k] = x + sp2; pM[3 * k + 1] = y - sp2; pM[3 * k + 2] = z + 0.04 * (eM[k][2] - 0.5); }
          gM.attributes.position.needsUpdate = true; flussoM.material.opacity = 0.85 * fM; }
      }
      /* brillamenti sul bordo (nana rossa) */
      var fBr = fxVal('brillamenti', s);
      lampiSup.forEach(function (l) { if (fBr < 0.01 || !corpoVis || MENO_MOTO) { l.visible = false; return; } var fz = ((tempo * 0.28) + l.userData.f) % 1; if (fz < 0.9) { l.visible = false; return; } var d0 = new T.Vector3().subVectors(S.cam.position, corpo.position).normalize(), rgt = new T.Vector3().crossVectors(d0, new T.Vector3(0, 0, 1)).normalize(), upv = new T.Vector3().crossVectors(rgt, d0); var a0 = l.userData.a; l.position.copy(corpo.position).addScaledVector(rgt, Math.cos(a0) * scala * 1.02).addScaledVector(upv, Math.sin(a0) * scala * 1.02); var k2 = Math.sin((fz - 0.9) / 0.1 * PI) * fBr; l.visible = true; l.material.opacity = k2; l.scale.set(0.35 * scala * k2 + 0.05, 0.35 * scala * k2 + 0.05, 1); if (fz > 0.995) l.userData.a = Math.random() * 2 * PI; });
      /* il guscio come volume, insieme alle scintille */
      vol.visible = guscio.visible;
      if (vol.visible) { var Ru = mG.uniforms.uR.value; mVol.uniforms.uR.value = Ru; mVol.uniforms.uSp.value = 0.08 * Ru + 0.045; mVol.uniforms.uRout.value = Ru * 1.55 + 0.35; vol.scale.setScalar(mVol.uniforms.uRout.value); mVol.uniforms.uCaldo.value = mG.uniforms.uCaldo.value; mVol.uniforms.uOpac.value = mG.uniforms.uOpac.value * Math.min(1, mG.uniforms.uDens.value * 1.1) * 0.7; mVol.uniforms.uSchiaccia.value = mG.uniforms.uSchiaccia.value; mVol.uniforms.uTempo.value = MENO_MOTO ? 0 : tempo;
        if (dt > 0) { tFot.push(dt); if (tFot.length >= 30) { var med = tFot.reduce(function (a, b) { return a + b; }, 0) / tFot.length; tFot = []; if (med > 0.04) passiVol = Math.max(12, passiVol - 6); else if (med < 0.022) passiVol = Math.min(40, passiVol + 2); mVol.uniforms.uPassi.value = passiVol; } } }
      /* corona e protuberanze sulle stelle */
      var mdNow = sc.stadi[s.i].modo || tipo;
      corona.visible = corpoVis && !esploso && mdNow === 'stella' && !(s.fin && sc.finale.tipo !== 'nessuno');
      if (corona.visible) { corona.position.copy(corpo.position); corona.quaternion.copy(S.cam.quaternion); corona.scale.setScalar(4 * scala); mCor.uniforms.uT.value = MENO_MOTO ? 0 : tempo; mCor.uniforms.uCol.value.copy(mSup.uniforms.uCol.value).lerp(new T.Color(1, 1, 1), 0.3); }
      bagl.position.copy(corpo.position);
      corpo.visible = corpoVis; corpo.scale.setScalar(scala); bagl.visible = corpoVis && !esploso; var bs = scala * (tipo === 'stella' ? 3.4 : 2.6); bagl.scale.set(bs, bs, 1);
      if (tipo === 'nube') lucciole.forEach(function (l) { var gen = st.generazioni || 1, att = l.userData.g <= gen, fz = ((MENO_MOTO ? 0 : tempo) * 0.3 + l.userData.f) % 1; l.visible = att; l.material.opacity = att ? (fz > 0.92 ? 1 : 0.55) : 0; var z2 = fz > 0.92 ? 0.3 : 0.1; l.scale.set(z2, z2, 1); });
      /* testi per il pannello */
      var rea = s.fin && fin.tipo === 'collasso' ? (uf < 1.3 ? fin.collasso.reazioni : fin.reazioniEsp || []) : st.reazioni;
      risultato.reazioni = rea.map(function (r) { return Dd.reazione(r).testo; }).concat(!s.fin || sc.finale.tipo === 'nessuno' ? (st.chimica || []) : []); risultato.nota = s.fin && fin.tipo === 'collasso' ? (uf < 1.3 ? t('neutronizzazione e fotodisintegrazione del ferro', 'neutronisation and photodisintegration of iron') : t('nucleosintesi esplosiva; processo r debole', 'explosive nucleosynthesis; weak r-process')) : (st.nota ? F.tt(st.nota) : '');
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
    var et2 = F.el('div', { 'class': 'et', testo: sc.etDonut ? F.tt(sc.etDonut) : sc.id === 'terra' ? t('Composizione al centro', 'Composition at the centre') : sc.id === 'giove' ? t('Composizione dell\'atmosfera', 'Atmosphere composition') : sc.id === 'galassia' ? t('Gas interstellare', 'Interstellar gas') : sc.id === 'bigbang' ? t('Composizione dell\'universo', 'Composition of the universe') : sc.id === 'ia' || sc.id === 'kilonova' ? t('Composizione della materia', 'Composition of the matter') : t('Composizione del nucleo', 'Core composition') }), leg = F.el('div', { 'class': 'bsiSP-leg' });
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
    var infoG = F.el('div', { 'class': 'bsiFX-nota' });
    var tipoG = sc.grafico === 'protostella' ? 'hr' : sc.grafico || ({ supernova: 'legame', buconero: 'hr', galassia: 'metalli', sole: 'hr', nanarossa: 'hr', grb: 'hr', nanabianca: 'hr', nova: 'hr', pisn: 'hr', nanabruna: 'teff', lampox: 'burst' })[sc.id] || null;
    if (tipoG) { infoG.innerHTML = SPIEGA_VIVO[tipoG] ? F.tt(SPIEGA_VIVO[tipoG]) : ''; radice.appendChild(infoG); }
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
      function sottoTitolo() { var hT = tit.offsetHeight || 40; rea.style.top = (12 + hT + 8) + 'px'; hud.style.top = (12 + hT + 8) + 'px'; }
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
      var base = { r: largo ? 4.6 : (tipoG ? 6.6 : 5.6), th: 2.36, ph: 1.12 }; S.inquadra(base.r, base.th, base.ph); S.vista.bersaglio.set(0, 0, largo ? -0.2 : (tipoG ? -1.15 : -0.55));
      if (sc.id === 'quasar' || sc.id === 'tde') { base.r += 1.2; S.inquadra(base.r, 2.2, 1.0); }
      if (sc.corpo.compagna) { base.r += 1.6; S.inquadra(base.r, 2.0, 1.12); }
      function camera(st) {
        if (!cinema) return; var v = S.vista, fin = st.fin, k = 1;
        if (fin && sc.finale.tipo === 'collasso') k = st.uf < 1.2 ? 1 - 0.18 * easeIO(st.uf) : 0.82 + (largo ? 1.5 : 2.6) * easeIO((st.uf - 1.2) / 3.5);
        else if (fin && sc.finale.tipo === 'nebulosa') k = 1 + 1.4 * easeIO(st.uf / 3);
        else if (sc.stadi[st.i].esplode || sc.stadi[st.i].dopo) k = 1.35 + (largo ? 0.8 : 1.6) * easeIO((st.tau - M.linea.inizi[sc.stadi.findIndex(function (x) { return x.esplode; })]) / 3);
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
        if (sc.hud) { var hx = sc.hud(st, stg); if (hx) h += F.tt(hx); }
        hud.innerHTML = h;
        pan.aggiorna(M.composizione(), orologio(sc, L, st), fin ? t('evento finale', 'final event') : t('questo stadio: ', 'this stage: ') + durata(stg.dur));
        pan.nascondi(fin && fin.tipo === 'collasso' && st.uf > 0.2);
        /* etichette con linea guida: nucleo collassato, stella di neutroni, buco nero, nana bianca */
        var lab = '', w = box.clientWidth, hh = S.ren.domElement.clientHeight;
        if (fin && fin.tipo === 'collasso' && st.uf > 0.15 && st.uf < 1.3) { var c0 = M.proietta(new T.Vector3(0, 0, 0)); lab = guida(c0.x * w, c0.y * hh, w * 0.62, hh * 0.3, t('NUCLEO COLLASSATO', 'COLLAPSED CORE')); }
        if (r.residuo) { var c1 = M.proietta(new T.Vector3(0, 0, 0)); lab = guida(c1.x * w, c1.y * hh, Math.max(10, c1.x * w - w * 0.38), Math.max(90, c1.y * hh - hh * 0.16), r.residuo === 'bh' ? t('BUCO NERO', 'BLACK HOLE') : r.residuo === 'bh?' ? t('RESIDUO: PROBABILE BUCO NERO', 'REMNANT: LIKELY BLACK HOLE') : r.residuo === 'wd' ? t('NANA BIANCA', 'WHITE DWARF') : t('STELLA DI NEUTRONI', 'NEUTRON STAR')); if (r.residuo === 'bh') link('sastrobh', '🕳️ ' + t('Buchi neri', 'Black holes')); }
        svg.innerHTML = lab;
        disegnaVivo(st);
        api.ultimo = { stadio: st.i, fin: st.fin, uf: st.uf, comp: M.composizione(), orologio: orologio(sc, L, st), residuo: r.residuo };
      }
      function guida(x0, y0, x1, y1, testo) { return '<line x1="' + x0.toFixed(0) + '" y1="' + y0.toFixed(0) + '" x2="' + x1.toFixed(0) + '" y2="' + y1.toFixed(0) + '" stroke="#e6f2ff" stroke-width="1" opacity=".8"/><circle cx="' + x0.toFixed(0) + '" cy="' + y0.toFixed(0) + '" r="3" fill="#e6f2ff"/><text x="' + (x1 + 4).toFixed(0) + '" y="' + (y1 + 4).toFixed(0) + '">' + testo + '</text>'; }
      /* ═══ (v261) IL GRAFICO VIVO, dentro il palco: legenda in alto, curve che brillano, il punto che segue la simulazione ═══ */
      var cvV = D.createElement('canvas'); cvV.className = 'bsiSP-vivo'; cvV.setAttribute('role', 'img'); box.appendChild(cvV);
      var qV = cvV.getContext('2d'), Wv = 0, Hv = 0;
      function misuraVivo() { var dpr = (g.BSIRisoluzione ? g.BSIRisoluzione.dpr() : Math.min(2, g.devicePixelRatio || 1)), w = box.clientWidth, hb = S.ren.domElement.clientHeight, hp = pan.el.offsetHeight || 120, w2 = w - 16, h2 = Math.round(Math.min(hb * 0.24, 190)); cvV.style.top = Math.max(60, hb - hp - 14 - h2) + 'px'; if (w2 === Wv && h2 === Hv) return; Wv = w2; Hv = h2; cvV.style.left = '8px'; cvV.style.width = Wv + 'px'; cvV.style.height = Hv + 'px'; cvV.width = Wv * dpr; cvV.height = Hv * dpr; qV.setTransform(dpr, 0, 0, dpr, 0, 0); }
      var tipoV = tipoG;
      cvV.style.display = tipoV ? '' : 'none';
      var gUlt = -1;
      function traccia(id) { if (id === 'nanabianca') return sc.stadi.map(function (x) { return lumWD(x.Teff); }).concat([lumWD(sc.stadi[sc.stadi.length - 1].Teff)]); return TRACCE_HR[id] || null; }
      function lumWD(Te) { return [Math.log10(Math.max(Te, 1500)), Math.log10(0.0125 * 0.0125 * Math.pow(Math.max(Te, 1500) / 5772, 4))]; }
      function suTraccia(A, st) { var n = sc.stadi.length; if (!st.fin) { var a = A[Math.min(st.i, A.length - 1)], b = A[Math.min(st.i + 1, A.length - 1)], u = easeIO(st.u); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; } var fin = A.slice(n + 1); if (!fin.length) return A[Math.min(n, A.length - 1)]; var tf = st.uf / (sc.finale.anim || 1) * fin.length, j = Math.min(fin.length - 1, Math.floor(tf)), pa = j ? fin[j - 1] : A[n], pb = fin[j], uu = easeIO(tf - j); return [pa[0] + (pb[0] - pa[0]) * uu, pa[1] + (pb[1] - pa[1]) * uu]; }
      function datiVivo(st) {
        var o = { serie: [], punti: [], leg: [], marc: null }, Ef = Dd.eventi || {};
        if (tipoV === 'hr') {
          var A = traccia(sc.id) || [[3.76, 0]], AS = g.BSIFisica.calcolo.astro;
          o.xmin = 5.2; o.xmax = 3.35; o.ymin = -5; o.ymax = 7; o.xl = 'log T (K) ← ' + t('più caldo', 'hotter'); o.yl = 'log L/L☉';
          if (AS) { var mx = [], my = []; for (var lm = -1; lm <= 1.8; lm += 0.05) { var q0 = AS.sequenzaPrincipale(Math.pow(10, lm)); mx.push(Math.log10(q0.T)); my.push(Math.log10(q0.L)); } o.serie.push({ x: mx, y: my, col: 'rgba(94,234,212,.35)', larg: 7 }); AS.STELLE.forEach(function (z) { o.punti.push({ x: Math.log10(z[3]), y: Math.log10(z[2]), col: 'rgba(220,230,245,.55)', r: 1.6 }); }); }
          var tx = [], ty = []; A.forEach(function (p) { tx.push(p[0]); ty.push(p[1]); }); o.serie.push({ x: tx, y: ty, col: '#ffb547', larg: 1.4, trat: [3, 3] });
          var m = suTraccia(A, st); if (m) { m = [Math.max(3.36, Math.min(5.19, m[0])), Math.max(-4.9, Math.min(6.9, m[1]))]; } if (m) o.marc = { x: m[0], y: m[1], col: '#fff3c8', et: 'L ≈ ' + sci(Math.pow(10, m[1])) + ' L☉ · T ≈ ' + num(Math.round(Math.pow(10, m[0]) / 10) * 10) + ' K' };
          o.leg = [['rgba(94,234,212,.8)', t('sequenza principale', 'main sequence')], ['#ffb547', t('percorso (schematico)', 'path (schematic)')], ['rgba(220,230,245,.9)', t('• stelle vere', '• real stars')]];
          o.nota = t('Diagramma H-R: il punto è la stella di questa simulazione, adesso.', 'H-R diagram: the dot is this simulation\'s star, right now.');
        } else if (tipoV === 'legame') {
          var bx = [], by = []; Dd.LEGAME.forEach(function (p) { bx.push(p[0]); by.push(p[1]); }); o.xmin = 0; o.xmax = 240; o.ymin = 0; o.ymax = 9.6; o.xl = t('A (nucleoni)', 'A (nucleons)'); o.yl = 'B/A (MeV)';
          o.serie.push({ x: bx, y: by, col: '#ffb547', larg: 2.2, glow: 1, grad: ['#7cc4ff', '#ffc64a', '#f2e6c9', '#ff8a6a'] }); Dd.LEGAME.forEach(function (p) { o.punti.push({ x: p[0], y: p[1], col: '#fff', r: 1.8 }); });
          var Ast = [4, 12, 20, 16, 28, 56], ia = st.fin ? 5 : Math.min(st.i, 5), Aa = ia ? Ast[ia - 1] : 1, Ab = Ast[ia], Ac = st.fin ? 56 : Aa + (Ab - Aa) * easeIO(st.u), Bc = interpB(Ac);
          o.marc = { x: Ac, y: Bc, col: '#fff3c8', et: (st.fin ? '⁵⁶Fe: ' : t('si forma A ≈ ', 'forming A ≈ ') + Math.round(Ac) + ': ') + num(Bc, 2) + ' MeV' };
          o.leg = [['#ffb547', t('energia di legame per nucleone (AME2020)', 'binding energy per nucleon (AME2020)')], ['#fff', t('◉ il nucleo che la stella sta facendo', '◉ the nucleus the star is making')]];
          o.linee = [{ y: 8.79, col: 'rgba(242,230,201,.5)', et: t('massimo: ferro e nichel', 'maximum: iron and nickel') }];
        } else if (tipoV === 'luceIa' || tipoV === 'luceKN') {
          var ia2 = tipoV === 'luceIa', T0 = ia2 ? L.fisici[2] + sc.stadi[2].dur : L.fisici[1], fn = ia2 ? Dd.luceIa : Dd.luceKN, gm = ia2 ? 365 : 14, lx = [], ly = [];
          for (var d0 = ia2 ? 0 : 0.1; d0 <= gm; d0 += gm / 160) { lx.push(d0); ly.push(Math.log10(fn(d0 * 86400))); }
          o.xmin = 0; o.xmax = gm; o.ymin = ia2 ? 40.5 : 39.5; o.ymax = ia2 ? 44 : 43; o.xl = t('giorni', 'days'); o.yl = 'log L (erg/s)';
          o.serie.push({ x: lx, y: ly, col: ia2 ? '#ffc64a' : '#e8a05a', larg: 2.2, glow: 1 }); var ora = (st.tFis - T0) / 86400; if (ora >= 0) o.marc = { x: Math.min(gm, ora), y: Math.log10(fn(Math.max(ia2 ? 0 : 0.1, Math.min(gm, ora)) * 86400)), col: '#fff3c8', et: 'L ≈ ' + sci(fn(Math.max(0.1, ora) * 86400)) + ' erg/s' };
          o.leg = [[ia2 ? '#ffc64a' : '#e8a05a', ia2 ? t('luce di ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe', 'light from ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe') : t('riscaldamento del processo r', 'r-process heating')]];
        } else if (tipoV === 'bbn') {
          var xx = [], yn = [], yh = []; for (var lt = 0; lt <= 3.1; lt += 0.02) { var tt2 = Math.pow(10, lt); xx.push(lt); yn.push(tt2 < Dd.BBN.tNuc ? Dd.Xn(tt2) : 0); yh.push(tt2 < Dd.BBN.tNuc ? 0 : Dd.Ymod()); }
          o.xmin = 0; o.xmax = 3.1; o.ymin = 0; o.ymax = 0.3; o.xl = 'log t (s)'; o.yl = t('frazione', 'fraction');
          o.serie.push({ x: xx, y: yn, col: '#9aa6b8', larg: 2 }, { x: xx, y: yh, col: '#b9a2ff', larg: 2.4, glow: 1 }); o.linee = [{ y: Dd.BBN.Yoss, col: 'rgba(0,201,183,.7)', et: t('Y misurato 0,245', 'measured Y 0.245') }];
          var tb = Math.max(1, st.tFis); o.marc = { x: Math.log10(tb), y: tb < Dd.BBN.tNuc ? Dd.Xn(tb) : Dd.Ymod(), col: '#fff3c8', et: tb < Dd.BBN.tNuc ? 'X_n = ' + num(Dd.Xn(tb), 3) : 'Y = ' + num(Dd.Ymod(), 3) };
          o.leg = [['#9aa6b8', t('neutroni liberi', 'free neutrons')], ['#b9a2ff', t('elio (modello)', 'helium (model)')], ['#00c9b7', t('elio misurato', 'measured helium')]];
        } else if (tipoV === 'calore') {
          var cx2 = [], cy2 = []; for (var my2 = 0; my2 <= 10; my2 += 0.05) { cx2.push(my2); cy2.push(Math.log10(Dd.caloreTerra(my2 * 1e6))); }
          o.xmin = 0; o.xmax = 10; o.ymin = -12; o.ymax = -6; o.xl = t('milioni di anni', 'million years'); o.yl = 'log W/kg';
          o.serie.push({ x: cx2, y: cy2, col: '#ff8a50', larg: 2.2, glow: 1 }); var oM = st.tFis / (1e6 * ANNO); if (oM <= 10) o.marc = { x: oM, y: Math.log10(Dd.caloreTerra(oM * 1e6)), col: '#fff3c8', et: sci(Dd.caloreTerra(oM * 1e6)) + ' W/kg' };
          o.leg = [['#ff8a50', t('calore da ²⁶Al e ⁶⁰Fe', 'heat from ²⁶Al and ⁶⁰Fe')]];
        } else if (tipoV === 'metalli') {
          var gx2 = [], gy2 = []; for (var gy = 0; gy <= 13.8; gy += 0.1) { gx2.push(gy); gy2.push(Dd.compGal(gy).Z / 100); }
          o.xmin = 0; o.xmax = 13.8; o.ymin = 0; o.ymax = 0.025; o.xl = t('miliardi di anni', 'billion years'); o.yl = 'Z';
          o.serie.push({ x: gx2, y: gy2, col: '#5fe3d6', larg: 2.2, glow: 1 }); o.punti.push({ x: 9.2, y: 0.0134, col: '#ffd24a', r: 4, et: t('Sole', 'Sun') }); var tg = Math.min(13.8, st.tFis / (1e9 * ANNO)); o.marc = { x: tg, y: Dd.compGal(tg).Z / 100, col: '#fff3c8', et: 'Z = ' + num(Dd.compGal(tg).Z / 100, 4) };
          o.leg = [['#5fe3d6', t('metallicità del gas (scatola chiusa)', 'gas metallicity (closed box)')], ['#ffd24a', t('● il Sole', '● the Sun')]];
        } else if (tipoV === 'leavitt') {
          var fx2 = [], fy2 = [], nC = sc.stadi.length; for (var ph = 0; ph <= nC; ph += 0.01) { fx2.push(ph); fy2.push(magCef(ph % 1)); }
          o.xmin = 0; o.xmax = nC; o.ymin = 4.5; o.ymax = 3.35; o.xl = t('cicli (5,37 giorni ciascuno)', 'cycles (5.37 days each)'); o.yl = 'V (mag)';
          o.serie.push({ x: fx2, y: fy2, col: '#ffe08a', larg: 2.2, glow: 1 }); var phN = st.fin ? nC : st.i + st.u; o.marc = { x: phN, y: magCef(phN % 1), col: '#fff3c8', et: 'V = ' + num(magCef(phN % 1), 2) };
          o.leg = [['#ffe08a', t('luminosità di δ Cephei (forma tipica, 3,48–4,37 mag)', 'δ Cephei brightness (typical shape, 3.48–4.37 mag)')]];
        } else if (tipoV === 'ppdot') {
          o.xmin = -2.6; o.xmax = 1.2; o.ymin = -20.5; o.ymax = -9.5; o.xl = 'log P (s)'; o.yl = 'log Ṗ';
          [1e8, 1e10, 1e12, 1e14].forEach(function (B) { o.serie.push({ x: [-2.6, 1.2], y: [-2.6, 1.2].map(function (lp) { return 2 * Math.log10(B / 3.2e19) - lp; }), col: 'rgba(160,180,210,.35)', larg: 1, trat: [2, 4], et: 'B = ' + sci(B) + ' G' }); });
          (Ef.PULSAR || []).forEach(function (z) { o.punti.push({ x: Math.log10(z[1]), y: Math.log10(z[2]), col: /SGR/.test(z[0]) ? '#d8a8ff' : '#9fd8ff', r: 3, et: z[0] }); });
          var cam = [[Math.log10(0.019), Math.log10(1e-12)], [Math.log10(0.0337), Math.log10(4.2e-13)], [Math.log10(3.245), Math.log10(1.43e-11)], [Math.log10(1.3373), Math.log10(1.35e-15)], [Math.log10(1.3373), Math.log10(1.35e-15)]], mq = suTraccia(cam, st); o.marc = { x: mq[0], y: mq[1], col: '#fff3c8', et: 'P = ' + num(Math.pow(10, mq[0]), Math.pow(10, mq[0]) < 0.1 ? 3 : 2) + ' s' };
          o.leg = [['#9fd8ff', t('● pulsar vere (ATNF)', '● real pulsars (ATNF)')], ['#d8a8ff', t('● magnetar', '● magnetars')], ['rgba(160,180,210,.8)', t('campo costante', 'constant field')]];
        } else if (tipoV === 'tde') {
          var MT2 = Ef.marea(1e6, 1, 1), rx = [], ry = []; for (var dd = 41; dd <= 1100; dd += 6) { rx.push(dd); ry.push(Math.log10(Ef.ricaduta(dd * 86400, MT2.tfb, 1) * ANNO)); }
          var Medd = Ef.eddington(1e6) / (0.1 * 2.998e10 * 2.998e10) / 1.989e33 * ANNO;
          o.xmin = 0; o.xmax = 1100; o.ymin = -3.2; o.ymax = 1; o.xl = t('giorni dalla distruzione', 'days since disruption'); o.yl = 'log Ṁ (M☉/' + t('anno', 'yr') + ')';
          o.serie.push({ x: rx, y: ry, col: '#ffb547', larg: 2.2, glow: 1 }); o.linee = [{ y: Math.log10(Medd), col: 'rgba(107,207,255,.7)', et: t('limite di Eddington', 'Eddington limit') }];
          var od = (st.tFis - L.fisici[1]) / 86400; if (od > 41) o.marc = { x: Math.min(1100, od), y: Math.log10(Ef.ricaduta(Math.min(1100, od) * 86400, MT2.tfb, 1) * ANNO), col: '#fff3c8', et: 'Ṁ ∝ t^−5/3' };
          o.leg = [['#ffb547', t('gas che ricade', 'falling-back gas')], ['#6bcfff', t('Eddington (10⁶ M☉)', 'Eddington (10⁶ M☉)')]];
        } else if (tipoV === 'chirp') {
          var Mc = Ef.MCH150914, wx = [], wy = [], fase = 0, tPrec = -0.2; for (var tt3 = -0.2; tt3 <= -0.003; tt3 += 0.0004) { var f0 = Ef.chirp(-tt3, Mc); fase += 2 * PI * f0 * (tt3 - tPrec); tPrec = tt3; wx.push(tt3 * 1000); wy.push(Math.pow(f0 / 35, 2 / 3) * Math.cos(fase)); }
          for (var tr2 = 0; tr2 <= 30; tr2 += 0.3) { wx.push(tr2); wy.push(wy[wy.length - 1] === undefined ? 0 : 4.2 * Math.exp(-tr2 / 4) * Math.cos(2 * PI * 0.25 * tr2)); }
          o.xmin = -200; o.xmax = 30; o.ymin = -5; o.ymax = 5; o.xl = t('ms dalla fusione', 'ms from merger'); o.yl = 'h';
          o.serie.push({ x: wx, y: wy, col: '#6bcfff', larg: 1.6, glow: 1 }); var tm = st.i === 0 && !st.fin ? (-0.2 + 0.197 * st.u) * 1000 : Math.min(30, (st.tFis - L.fisici[1]) * 1000); o.marc = { x: tm, y: 0, col: '#fff3c8', et: tm < 0 ? 'f ≈ ' + Math.round(Ef.chirp(-tm / 1000, Mc)) + ' Hz' : 'ringdown', verticale: true };
          o.leg = [['#6bcfff', t('forma dell\'onda (newtoniana) di GW150914', 'GW150914 waveform shape (Newtonian)')]];
        } else if (tipoV === 'quasar') {
          var qx = [], qy = []; for (var my3 = 0; my3 <= 800; my3 += 5) { qx.push(my3); qy.push(Math.log10(1e5) + (my3 - 100 > 0 ? (my3 - 100) / Ef.tS * 1e6 / Math.LN10 : 0)); }
          o.xmin = 0; o.xmax = 800; o.ymin = 4.5; o.ymax = 10; o.xl = t('milioni di anni dal Big Bang', 'million years since the Big Bang'); o.yl = 'log M (M☉)';
          o.serie.push({ x: qx, y: qy, col: '#ffb547', larg: 2.2, glow: 1 }); o.punti.push({ x: 690, y: Math.log10(8e8), col: '#6bcfff', r: 4, et: 'J1342+0928' });
          var tq = 100 + Math.min(700, st.tFis / (1e6 * ANNO)); o.marc = { x: tq, y: Math.min(10, Math.log10(1e5) + Math.max(0, tq - 100) / Ef.tS * 1e6 / Math.LN10), col: '#fff3c8', et: '' };
          o.leg = [['#ffb547', t('crescita al limite di Eddington', 'growth at the Eddington limit')], ['#6bcfff', t('● quasar osservato', '● observed quasar')]];
        } else if (tipoV === 'saha') {
          var sx = [], sy = []; for (var Tk = 2500; Tk <= 6000; Tk += 25) { sx.push(Tk); sy.push(Ef.saha(Tk)); }
          o.xmin = 6000; o.xmax = 2500; o.ymin = 0; o.ymax = 1.05; o.xl = 'T (K) ← ' + t('il tempo scorre', 'time flows') + ' →'; o.yl = 'x_e';
          o.serie.push({ x: sx, y: sy, col: '#ff7a9a', larg: 2.2, glow: 1 }); o.punti.push({ x: Ef.T50(), y: 0.5, col: '#fff', r: 3, et: num(Ef.T50()) + ' K' });
          var stR = sc.stadi[st.i], TR = st.fin ? 2600 : Math.max(2500, Math.min(6000, stR.T > 1000 ? (st.i ? sc.stadi[st.i - 1].T : 6000) + (stR.T - (st.i ? sc.stadi[st.i - 1].T : 6000)) * easeIO(st.u) : 2500)); o.marc = { x: TR, y: Ef.saha(TR), col: '#fff3c8', et: 'x_e = ' + (Ef.saha(TR) > 0.99 ? '1' : sci(Ef.saha(TR))) };
          o.leg = [['#ff7a9a', t('idrogeno ionizzato (equazione di Saha)', 'ionised hydrogen (Saha equation)')]];
        } else if (tipoV === 'teff') {
          var ex = [], ey = []; sc.stadi.forEach(function (z, k) { ex.push(Math.log10((L.fisici[k] + z.dur) / ANNO)); ey.push(z.Teff); });
          o.xmin = 6.5; o.xmax = 10.3; o.ymin = 200; o.ymax = 3000; o.xl = t('log età (anni)', 'log age (yr)'); o.yl = 'T (K)';
          o.serie.push({ x: ex, y: ey, col: '#ff8a7a', larg: 2.2, glow: 1 }); o.linee = [{ y: 2200, col: 'rgba(255,160,120,.5)', et: 'M | L' }, { y: 1300, col: 'rgba(200,120,170,.5)', et: 'L | T' }, { y: 500, col: 'rgba(140,110,200,.5)', et: 'T | Y' }];
          var tE = Math.log10(Math.max(3e6, st.tFis / ANNO)), TE = st.fin ? sc.stadi[sc.stadi.length - 1].Teff : (st.i ? sc.stadi[st.i - 1].Teff : 2800) + (sc.stadi[st.i].Teff - (st.i ? sc.stadi[st.i - 1].Teff : 2800)) * easeIO(st.u); o.marc = { x: Math.min(10.3, tE), y: TE, col: '#fff3c8', et: num(Math.round(TE / 10) * 10) + ' K' };
          o.leg = [['#ff8a7a', t('temperatura superficiale', 'surface temperature')]];
        } else if (tipoV === 'burst') {
          var ux = [], uy = []; for (var ts2 = 0; ts2 <= 60; ts2 += 0.2) { ux.push(ts2); uy.push(burst(ts2)); }
          o.xmin = 0; o.xmax = 60; o.ymin = 0; o.ymax = 1.1; o.xl = t('secondi dall\'accensione', 'seconds from ignition'); o.yl = 'L/L_Edd';
          o.serie.push({ x: ux, y: uy, col: '#9fd8ff', larg: 2.2, glow: 1 }); var tb2 = st.tFis - L.fisici[1]; if (tb2 >= 0) o.marc = { x: Math.min(60, tb2), y: burst(Math.min(60, tb2)), col: '#fff3c8', et: '' };
          o.leg = [['#9fd8ff', t('luce X del lampo (forma tipica)', 'burst X-ray light (typical shape)')]];
        }
        return o;
      }
      function interpB(A) { var P = Dd.LEGAME; for (var k = 1; k < P.length; k++) if (A <= P[k][0]) { var u = (A - P[k - 1][0]) / (P[k][0] - P[k - 1][0]); return P[k - 1][1] + (P[k][1] - P[k - 1][1]) * u; } return P[P.length - 1][1]; }
      function magCef(f) { return 3.95 + 0.42 * (-Math.cos(2 * PI * f) - 0.35 * Math.sin(2 * PI * f) + 0.12 * Math.cos(4 * PI * f)) / 1.05; }
      function burst(tb) { return tb < 1 ? tb : Math.exp(-(tb - 1) / 14); }
      function disegnaVivo(st) {
        if (!tipoV) return; var o = datiVivo(st), q = qV; misuraVivo(); var W = Wv, H = Hv;
        q.clearRect(0, 0, W, H);
        q.fillStyle = 'rgba(5,9,18,.62)'; q.strokeStyle = 'rgba(120,150,200,.22)'; q.beginPath(); if (q.roundRect) q.roundRect(0.5, 0.5, W - 1, H - 1, 10); else q.rect(0.5, 0.5, W - 1, H - 1); q.fill(); q.stroke();
        var x0 = 34, x1 = W - 10, y0 = 24, y1 = H - 18, X = function (v) { return x0 + (v - o.xmin) / (o.xmax - o.xmin) * (x1 - x0); }, Y = function (v) { return y1 - (v - o.ymin) / (o.ymax - o.ymin) * (y1 - y0); };
        q.font = '500 8.5px ui-monospace,Menlo,monospace'; q.textAlign = 'left'; q.textBaseline = 'alphabetic';
        var lx = 8; (o.leg || []).forEach(function (l) { q.fillStyle = l[0]; q.fillRect(lx, 10, 9, 2); q.fillStyle = 'rgba(200,214,232,.9)'; q.fillText(l[1], lx + 12, 14); lx += q.measureText(l[1]).width + 24; });
        q.strokeStyle = 'rgba(140,160,190,.28)'; q.lineWidth = 1; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0, y1); q.lineTo(x1, y1); q.stroke();
        q.fillStyle = 'rgba(160,180,206,.75)'; q.fillText(o.yl || '', 4, y0 + 2); q.textAlign = 'right'; q.fillText(o.xl || '', x1, H - 5); q.textAlign = 'left';
        [o.ymin, (o.ymin + o.ymax) / 2, o.ymax].forEach(function (v) { q.fillText(num(v, Math.abs(o.ymax - o.ymin) < 2 ? 2 : 0), 4, Y(v) + 3); });
        q.textAlign = 'center'; [o.xmin, (o.xmin + o.xmax) / 2, o.xmax].forEach(function (v) { q.fillText(num(v, Math.abs(o.xmax - o.xmin) < 10 ? 1 : 0), X(v), y1 + 10); }); q.textAlign = 'left';
        q.save(); q.beginPath(); q.rect(x0, y0 - 4, x1 - x0, y1 - y0 + 6); q.clip();
        (o.linee || []).forEach(function (Ln) { q.strokeStyle = Ln.col; q.setLineDash([2, 4]); q.beginPath(); q.moveTo(x0, Y(Ln.y)); q.lineTo(x1, Y(Ln.y)); q.stroke(); q.setLineDash([]); q.fillStyle = Ln.col; q.fillText(Ln.et || '', x0 + 4, Y(Ln.y) - 3); });
        o.serie.forEach(function (Sr) {
          var n = Sr.x.length; if (n < 2) return; q.lineWidth = Sr.larg || 2; q.setLineDash(Sr.trat || []); q.lineCap = 'round'; q.lineJoin = 'round';
          if (Sr.grad) { var gr = q.createLinearGradient(X(Sr.x[0]), 0, X(Sr.x[n - 1]), 0); Sr.grad.forEach(function (c0, k) { gr.addColorStop(k / (Sr.grad.length - 1), c0); }); q.strokeStyle = gr; } else q.strokeStyle = Sr.col;
          if (Sr.glow) { q.shadowColor = Sr.col; q.shadowBlur = 8; }
          q.beginPath(); for (var k = 0; k < n; k++) { var px = X(Sr.x[k]), py = Y(Sr.y[k]); if (!isFinite(py)) continue; if (k) q.lineTo(px, py); else q.moveTo(px, py); } q.stroke(); q.shadowBlur = 0; q.setLineDash([]);
          if (Sr.et) { q.fillStyle = 'rgba(160,180,210,.7)'; var kk = Math.floor(n * 0.15); q.fillText(Sr.et, X(Sr.x[kk]) + 3, Y(Sr.y[kk]) - 3); }
        });
        o.punti.forEach(function (p) { q.fillStyle = p.col; q.beginPath(); q.arc(X(p.x), Y(p.y), p.r || 2, 0, 2 * PI); q.fill(); if (p.et) { q.fillStyle = 'rgba(210,222,238,.85)'; q.fillText(p.et, X(p.x) + 5, Y(p.y) - 4); } });
        if (o.marc && isFinite(o.marc.x) && isFinite(o.marc.y)) {
          var mx2 = X(o.marc.x), my4 = Y(o.marc.y);
          if (o.marc.verticale) { q.strokeStyle = 'rgba(255,243,200,.8)'; q.beginPath(); q.moveTo(mx2, y0); q.lineTo(mx2, y1); q.stroke(); }
          else { var rg = q.createRadialGradient(mx2, my4, 0, mx2, my4, 14); rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(0.25, 'rgba(255,240,200,.7)'); rg.addColorStop(1, 'rgba(255,220,160,0)'); q.fillStyle = rg; q.beginPath(); q.arc(mx2, my4, 14, 0, 2 * PI); q.fill(); q.fillStyle = '#fff'; q.beginPath(); q.arc(mx2, my4, 2.6, 0, 2 * PI); q.fill(); }
          if (o.marc.et) { q.font = '600 9.5px ui-monospace,Menlo,monospace'; var tw = q.measureText(o.marc.et).width, ex2 = mx2 + 10 + tw > x1 ? mx2 - 10 - tw : mx2 + 10, ey3 = Math.max(y0 + 8, Math.min(y1 - 4, my4 - 8)); q.fillStyle = 'rgba(5,9,18,.75)'; q.fillRect(ex2 - 3, ey3 - 9, tw + 6, 12); q.fillStyle = '#fff3c8'; q.fillText(o.marc.et, ex2, ey3); }
        }
        q.restore();
        cvV.setAttribute('aria-label', (o.leg || []).map(function (l) { return l[1]; }).join(', ') + (o.marc && o.marc.et ? ': ' + o.marc.et : ''));
        if (o.nota && infoG && !infoG._vivo) { infoG._vivo = 1; }
      }

      F.alRidimensiona(function () { palco.style.width = larghezza() + 'px'; S.adatta(); misuraVivo(); gUlt = -1; });
      api.pronto = true; api.S = S; api.M = M; api.vai = function (x) { tau = x; S.avvia(); }; api.gioca = function (v) { gioca = v; segna(); S.avvia(); }; api.totale = L.totale; api.cinematico = function (v) { cinema = v; segna(); };
      sottoTitolo(); M.imposta(tau, 0); ui(M.stato()); S.avvia();
      if (opz.alPronto) opz.alPronto(api);
    }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    return api;
  }

  /* ═══ la sezione: scelta dello scenario, un palco solo ═══════════════════ */
  function elenco() { var Dd = DATI(); return Dd ? Dd.scenari().map(function (x) { return [x.id, x.emoji || '•', x.cat || 'universo']; }) : []; }
  var ELENCO = elenco();
  function schedaSezione(div) {
    stile(); var Dd = DATI(); if (!Dd) return;
    var scelte = F.el('div', { 'class': 'bsiSP-scelte', role: 'group', 'aria-label': t('Scenari', 'Scenarios') }), palco = F.el('div');
    div.appendChild(scelte); div.appendChild(palco);
    var tasti = {}, cats = Dd.CAT || { tutti: ['Scenari', 'Scenarios'] };
    function apri(id) { Object.keys(tasti).forEach(function (k) { tasti[k].setAttribute('aria-pressed', String(k === id)); }); div._sp = crea(palco, id); return div._sp; }
    Object.keys(cats).forEach(function (c) {
      var voci = elenco().filter(function (e) { return (e[2] || 'tutti') === c || !Dd.CAT; }); if (!voci.length) return;
      scelte.appendChild(F.el('div', { 'class': 'bsiSP-cat', testo: F.tt(cats[c]) }));
      voci.forEach(function (e) { var sc = Dd.perId(e[0]); var b = F.el('button', { type: 'button', 'aria-pressed': 'false', testo: e[1] + ' ' + F.tt(sc.titolo) }); b.addEventListener('click', function () { apri(e[0]); palco.scrollIntoView({ block: 'start', behavior: 'smooth' }); }); tasti[e[0]] = b; scelte.appendChild(b); });
    });
    div._apri = function (id) { return apri(id); }; apri('supernova');
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
    description: 'Apre lo «Spaccato stellare» di BioSpecInfo: un corpo celeste tagliato che cambia composizione. Scenari: supernova (come muore una stella massiccia), sole, buconero, ia (supernova di tipo Ia), kilonova (stelle di neutroni, oro), bigbang (primi 20 minuti), terra (nucleo di ferro), giove (idrogeno metallico), galassia (arricchimento di metalli), protostella (nasce una stella), nanabruna, nanarossa, cefeide, nova, lampox (lampo X), pulsar (magnetar), tde (stella fatta a pezzi da un buco nero), grb (lampo gamma), pisn (instabilità di coppia), bhbh (due buchi neri, GW150914), quasar, nanabianca (cristallizzazione), ricombinazione (fondo cosmico e reionizzazione). Usalo SOLO quando l\'utente chiede di vedere uno di questi processi.',
    parameters: { type: 'object', properties: { scenario: { type: 'string', enum: elenco().map(function (e) { return e[0]; }) } }, required: ['scenario'] },
    execute: function (a) { var id = a && a.scenario; if (!elenco().some(function (e) { return e[0] === id; })) return Promise.resolve({ ok: false, error: 'scenario sconosciuto' }); g.BSISpaccato.apri(id); var sc = DATI().perId(id); return Promise.resolve({ ok: true, aperto: F.tt(sc.titolo), spiegazione: F.tt(sc.spiegazione) }); } };
  function registra() { var Ts = g.BSI_AI_TOOLS; if (!Ts || !Ts.push) return false; if (!Ts.some(function (x) { return x.name === STRUMENTO.name; })) Ts.push(STRUMENTO); return true; }
  if (!registra()) { var k = 0, ti = setInterval(function () { if (registra() || ++k > 40) clearInterval(ti); }, 500); }
})(typeof window !== 'undefined' ? window : globalThis);
