/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-astro.js — 🔭 astrofisica
   BioSpecInfo · © Samuele Pio Provenzano

   · DIAGRAMMA H-R: stelle vere (Sole, Sirio A e B, Vega, Betelgeuse,
     Rigel, Proxima…) nel piano temperatura-luminosita', con le rette a
     raggio costante (L = 4πR²σT⁴); una stella di sequenza principale di
     massa scelta, con luminosita', raggio, temperatura, classe spettrale e
     durata della vita (t ≈ 10 miliardi di anni × M/L);
   · CORPO NERO: la legge di Planck per due temperature, lo spettro visibile
     sotto la curva, il picco di Wien, il flusso σT⁴, il colore che l'occhio
     vede e l'indice di colore B − V (formula di Ballesteros);
   · SISTEMA SOLARE: gli otto pianeti sulle loro ellissi vere (a, e,
     longitudine del perielio) mossi con l'equazione di Keplero; la terza
     legge verificata sui dati (pendenza 3/2 in scala log-log); il
     trasferimento di Hohmann Terra-Marte con i Δv e la finestra di lancio;
   · ESOPIANETI: il transito davanti a una stella con oscuramento al bordo
     (la curva di luce calcolata sovrapponendo i dischi), la profondita'
     (R_p/R*)², la durata, la velocita' radiale indotta, la zona abitabile
     e la temperatura di equilibrio;
   · COSMOLOGIA: l'equazione di Friedmann per un universo con radiazione,
     materia, curvatura e costante cosmologica; a(t), l'eta' dell'universo,
     il tempo di ritorno, le distanze in funzione del redshift; le galassie
     che si allontanano tutte da tutte.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  var G = 6.6743e-11, c = 299792458, h = 6.62607015e-34, kB = 1.380649e-23, sigma = 5.670374419e-8, Msun = 1.98892e30, Rsun = 6.957e8, Lsun = 3.828e26, Tsun = 5772, AU = 1.495978707e11, ANNO = 3.15576e7;
  function griglia(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* stella di sequenza principale (relazioni empiriche, unita' solari) */
  function sequenzaPrincipale(M) {
    var L = M < 0.43 ? 0.23 * Math.pow(M, 2.3) : M < 2 ? Math.pow(M, 4) : M < 55 ? 1.4 * Math.pow(M, 3.5) : 32000 * M;
    var R = M < 1 ? Math.pow(M, 0.8) : Math.pow(M, 0.57);
    var T = Tsun * Math.pow(L / (R * R), 0.25);
    return { M: M, L: L, R: R, T: T, vita: 1e10 * M / L, classe: classe(T) };
  }
  function classe(T) { return T >= 30000 ? 'O' : T >= 10000 ? 'B' : T >= 7500 ? 'A' : T >= 6000 ? 'F' : T >= 5200 ? 'G' : T >= 3700 ? 'K' : 'M'; }
  function raggioDa(L, T) { return Math.sqrt(L) * Math.pow(Tsun / T, 2); }
  /* stelle vere: luminosita' (L☉) e temperatura efficace (K) */
  var STELLE = [['Sole', 'Sun', 1, 5772], ['Sirio A', 'Sirius A', 25.4, 9940], ['Sirio B', 'Sirius B', 0.056, 25000], ['Vega', 'Vega', 40.1, 9602], ['Betelgeuse', 'Betelgeuse', 1.26e5, 3600], ['Rigel', 'Rigel', 1.2e5, 12100], ['Proxima Centauri', 'Proxima Centauri', 0.00155, 3042], ['Aldebaran', 'Aldebaran', 439, 3910], ['Arturo', 'Arcturus', 170, 4286], ['Antares', 'Antares', 7.5e4, 3660], ['Polare', 'Polaris', 1260, 6015], ['Deneb', 'Deneb', 1.96e5, 8525], ['Stella di Barnard', 'Barnard’s Star', 0.0035, 3134], ['Spica', 'Spica', 20500, 25300], ['Procione B', 'Procyon B', 0.00049, 7740], ['α Centauri A', 'α Centauri A', 1.519, 5790]];
  /* Planck: radianza spettrale per unita' di lunghezza d'onda (W m⁻² sr⁻¹ m⁻¹) */
  function planck(lam, T) { var x = h * c / (lam * kB * T); return x > 700 ? 0 : 2 * h * c * c / Math.pow(lam, 5) / (Math.exp(x) - 1); }
  function wien(T) { return 2.897771955e-3 / T; }
  /* colore apparente di un corpo nero (approssimazione di T. Helland, 1000–40000 K) */
  function coloreT(T) {
    var x = T / 100, r, g, b;
    r = x <= 66 ? 255 : 329.698727446 * Math.pow(x - 60, -0.1332047592);
    g = x <= 66 ? 99.4708025861 * Math.log(x) - 161.1195681661 : 288.1221695283 * Math.pow(x - 60, -0.0755148492);
    b = x >= 66 ? 255 : x <= 19 ? 0 : 138.5177312231 * Math.log(x - 10) - 305.0447927307;
    return [r, g, b].map(function (v) { return Math.max(0, Math.min(255, Math.round(v))); });
  }
  /* B − V dalla temperatura: si inverte la formula di Ballesteros (2012) */
  function ballesteros(bv) { return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)); }
  function bmenoV(T) { var a = -0.4, b = 2.5; for (var i = 0; i < 80; i++) { var m = (a + b) / 2; if (ballesteros(m) > T) a = m; else b = m; } return (a + b) / 2; }
  /* pianeti: a (UA), e, P (anni), longitudine del perielio (°), raggio (km), colore */
  var PIANETI = [['Mercurio', 'Mercury', 0.3871, 0.2056, 0.2408, 77.46, 2440, '#b8b0a8'], ['Venere', 'Venus', 0.7233, 0.0068, 0.6152, 131.6, 6052, '#e8c98a'], ['Terra', 'Earth', 1.0000, 0.0167, 1.0000, 102.9, 6371, '#6bcfff'], ['Marte', 'Mars', 1.5237, 0.0934, 1.8809, 336.1, 3390, '#ff8a6a'], ['Giove', 'Jupiter', 5.2029, 0.0484, 11.862, 14.73, 69911, '#e0b98a'], ['Saturno', 'Saturn', 9.537, 0.0539, 29.457, 92.6, 58232, '#f0d9a0'], ['Urano', 'Uranus', 19.19, 0.0473, 84.01, 170.9, 25362, '#a8e8f0'], ['Nettuno', 'Neptune', 30.07, 0.0086, 164.8, 44.97, 24622, '#6b8cff']];
  function kepleroE(M, e) { var E = e < 0.8 ? M : Math.PI; for (var i = 0; i < 40; i++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-13) break; } return E; }
  function posizione(a, e, P, varpi, tAnni, fase) {
    var M = 2 * Math.PI * tAnni / P + (fase || 0), E = kepleroE(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), e), x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E), w = varpi * Math.PI / 180;
    return [x * Math.cos(w) - y * Math.sin(w), x * Math.sin(w) + y * Math.cos(w)];
  }
  function hohmann(r1, r2) {
    var GM = 4 * Math.PI * Math.PI, at = (r1 + r2) / 2, v1 = Math.sqrt(GM / r1), v2 = Math.sqrt(GM / r2), vp = Math.sqrt(GM * (2 / r1 - 1 / at)), va = Math.sqrt(GM * (2 / r2 - 1 / at));
    var unit = AU / ANNO / 1000; /* UA/anno → km/s */
    var tempo = 0.5 * Math.pow(at, 1.5), fase = 180 - 360 * tempo / Math.pow(r2, 1.5);
    return { at: at, giorni: tempo * 365.25, dv1: (vp - v1) * unit, dv2: (v2 - va) * unit, fase: fase };
  }
  /* transito: frazione di luce bloccata da un disco di raggio p (in R*) a distanza d dal centro, oscuramento al bordo lineare u */
  function bloccata(p, d, u) {
    if (d >= 1 + p) return 0;
    var N = 48, s = 0, tot = Math.PI * (1 - u / 3);
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
      var x = d + p * (2 * (i + 0.5) / N - 1), y = p * (2 * (j + 0.5) / N - 1);
      if ((x - d) * (x - d) + y * y > p * p) continue;
      var r2 = x * x + y * y; if (r2 >= 1) continue;
      s += (1 - u * (1 - Math.sqrt(1 - r2))) * Math.pow(2 * p / N, 2);
    }
    return s / tot;
  }
  function transito(o) {
    /* o: Ms (M☉), Rs (R☉), Ls (L☉), Rp (R⊕), Mp (M⊕), P (giorni), b (parametro d'impatto), u */
    var P = o.P * 86400, a = Math.cbrt(G * o.Ms * Msun * P * P / (4 * Math.PI * Math.PI)), Rs = o.Rs * Rsun, Rp = o.Rp * 6.371e6, p = Rp / Rs;
    var dur = P / Math.PI * Math.asin(Math.min(1, Math.sqrt(Math.max(0, Math.pow(1 + p, 2) - o.b * o.b)) * Rs / a));
    var K = Math.pow(2 * Math.PI * G / P, 1 / 3) * o.Mp * 5.9722e24 / Math.pow(o.Ms * Msun + o.Mp * 5.9722e24, 2 / 3);
    var Teq = (Tsun * Math.pow(o.Ls / (o.Rs * o.Rs), 0.25)) * Math.sqrt(Rs / (2 * a)) * Math.pow(1 - (o.A || 0.3), 0.25);
    return { a: a, aUA: a / AU, p: p, profondita: p * p, durata: dur, K: K, Teq: Teq, zona: [Math.sqrt(o.Ls / 1.1), Math.sqrt(o.Ls / 0.53)] };
  }
  /* Friedmann: H(a) = H0 √(Ωr a⁻⁴ + Ωm a⁻³ + Ωk a⁻² + ΩΛ) */
  function cosmo(H0, Om, OL, Or) {
    Or = Or === undefined ? 9e-5 : Or; var Ok = 1 - Om - OL - Or, H = H0 * 1000 / 3.0857e22; /* s⁻¹ */
    var E = function (a) { return Math.sqrt(Or / Math.pow(a, 4) + Om / Math.pow(a, 3) + Ok / (a * a) + OL); };
    function tempo(a1) { /* ∫₀^a1 da / (a H) in sostituzione a = s² per l'integrabilita' in 0 */ var n = 4000, s = 0, S = Math.sqrt(a1); for (var i = 0; i < n; i++) { var u = (i + 0.5) / n * S, a = u * u; s += 2 * u / (a * E(a)) * (S / n); } return s / H; }
    function distanzaComovente(z) { var n = 2000, s = 0; for (var i = 0; i < n; i++) { var zz = (i + 0.5) / n * z; s += 1 / E(1 / (1 + zz)) * z / n; } return c / H * s; }
    var eta = tempo(1);
    return { Ok: Ok, E: E, tempo: tempo, eta: eta, etaGa: eta / ANNO / 1e9, q0: Or + Om / 2 - OL, dc: distanzaComovente, H: H };
  }
  F.calcolo.astro = { sequenzaPrincipale: sequenzaPrincipale, classe: classe, raggioDa: raggioDa, STELLE: STELLE, planck: planck, wien: wien, coloreT: coloreT, bmenoV: bmenoV, PIANETI: PIANETI, posizione: posizione, hohmann: hohmann, bloccata: bloccata, transito: transito, cosmo: cosmo, kepleroE: kepleroE };

  /* ═══ 1. diagramma H-R ══════════════════════════════════════════════════ */
  function schedaHR(div) {
    var Gr = griglia(div), st = { M: 1, scelta: '0' }, info = F.el('div', { 'class': 'bsiFX-nota' }), info2 = F.el('div', { 'class': 'bsiFX-nota' });
    F.cursore(Gr.pan, ['massa della stella (M☉, sequenza principale)', 'star mass (M☉, main sequence)'], -1.1, 1.75, 0.01, 0, function (v) { st.M = Math.pow(10, v); disegna(); }, function (v) { return fmt(Math.pow(10, v)); });
    Gr.pan.appendChild(info);
    F.scelta(Gr.pan, ['Stella vera', 'Real star'], STELLE.map(function (s, i) { return [String(i), F.tt([s[0], s[1]])]; }), '0', function (v) { st.scelta = v; disegna(); });
    Gr.pan.appendChild(info2);
    var cv = F.tela(Gr.dx, 0.72);
    var X = null;
    function disegna() {
      var S = sequenzaPrincipale(st.M), Tmin = 2300, Tmax = 45000, Lmin = 1e-5, Lmax = 3e6;
      var o = F.grafico(cv, { serie: [], xmin: Math.log10(Tmin), xmax: Math.log10(Tmax), ymin: Math.log10(Lmin), ymax: Math.log10(Lmax), invertiX: true, xl: ['log₁₀ T (K) — più caldo a sinistra', 'log₁₀ T (K) — hotter on the left'], yl: ['log₁₀ L/L☉', 'log₁₀ L/L☉'], descr: ['diagramma di Hertzsprung-Russell', 'Hertzsprung-Russell diagram'] }), q = o.q;
      /* rette a raggio costante */
      q.save(); q.font = '10px system-ui'; q.setLineDash([3, 4]); q.strokeStyle = 'rgba(132,148,168,.35)'; q.fillStyle = 'rgba(159,177,198,.7)';
      [0.001, 0.01, 0.1, 1, 10, 100, 1000].forEach(function (R) { q.beginPath(); var primo = true, ult = null; for (var lt = Math.log10(Tmin); lt <= Math.log10(Tmax); lt += 0.02) { var L = R * R * Math.pow(Math.pow(10, lt) / Tsun, 4); var y = o.Y(Math.log10(L)); if (y < 0 || y > o.H) { primo = true; continue; } if (primo) { q.moveTo(o.X(lt), y); primo = false; } else q.lineTo(o.X(lt), y); ult = [o.X(lt), y]; } q.stroke(); if (ult) q.fillText(R + ' R☉', ult[0] + 2, Math.max(12, ult[1])); });
      q.setLineDash([]);
      /* la sequenza principale */
      q.strokeStyle = 'rgba(94,234,212,.35)'; q.lineWidth = 9; q.lineCap = 'round'; q.beginPath();
      for (var lm = -1.1; lm <= 1.8; lm += 0.02) { var s2 = sequenzaPrincipale(Math.pow(10, lm)); var xx = o.X(Math.log10(s2.T)), yy = o.Y(Math.log10(s2.L)); if (lm === -1.1) q.moveTo(xx, yy); else q.lineTo(xx, yy); }
      q.stroke(); q.lineWidth = 1;
      q.fillStyle = 'rgba(94,234,212,.8)'; q.fillText(t('sequenza principale', 'main sequence'), o.X(Math.log10(9000)), o.Y(Math.log10(3)));
      q.fillStyle = 'rgba(255,138,128,.8)'; q.fillText(t('giganti e supergiganti', 'giants and supergiants'), o.X(Math.log10(5600)), o.Y(3.6));
      q.fillStyle = 'rgba(200,210,230,.8)'; q.fillText(t('nane bianche', 'white dwarfs'), o.X(Math.log10(22000)), o.Y(-3.4));
      /* stelle vere */
      STELLE.forEach(function (s, i) { var col = coloreT(s[3]), R = raggioDa(s[2], s[3]), r = Math.max(2.5, Math.min(11, 4 + 1.6 * Math.log10(R))); q.fillStyle = 'rgb(' + col.join(',') + ')'; q.beginPath(); q.arc(o.X(Math.log10(s[3])), o.Y(Math.log10(s[2])), r, 0, Math.PI * 2); q.fill(); if (String(i) === st.scelta) { q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.stroke(); q.lineWidth = 1; } q.fillStyle = '#c9d3df'; q.fillText(F.tt([s[0], s[1]]), o.X(Math.log10(s[3])) + r + 2, o.Y(Math.log10(s[2])) + 3); });
      /* la stella scelta con la massa */
      var cs = coloreT(S.T); q.fillStyle = 'rgb(' + cs.join(',') + ')'; q.strokeStyle = '#fff'; q.lineWidth = 2; q.beginPath(); q.arc(o.X(Math.log10(S.T)), o.Y(Math.log10(S.L)), 9, 0, Math.PI * 2); q.fill(); q.stroke(); q.restore();
      info.innerHTML = 'M = ' + fmt(S.M) + ' M☉ → L ≈ <b class="bsiFX-num">' + fmt(S.L) + ' L☉</b>, R ≈ ' + fmt(S.R) + ' R☉, T ≈ <b class="bsiFX-num">' + fmt(Math.round(S.T)) + ' K</b> (' + t('classe ', 'class ') + '<b>' + S.classe + '</b>)<br>' + t('Vita sulla sequenza principale ', 'Main-sequence lifetime ') + '≈ 10¹⁰ anni × M/L = <b>' + (S.vita > 1e9 ? fmt(S.vita / 1e9) + t(' miliardi di anni', ' billion years') : fmt(S.vita / 1e6) + t(' milioni di anni', ' million years')) + '</b>' + (S.vita > 1.38e10 ? t(' — più dell’età dell’universo: nessuna stella così è ancora morta', ' — longer than the age of the universe: no such star has died yet') : '') + '<br>' + t('Relazioni empiriche massa-luminosità (L ∝ M⁴ circa) e massa-raggio: valori indicativi.', 'Empirical mass-luminosity (L ∝ M⁴ roughly) and mass-radius relations: indicative values.');
      var V = STELLE[+st.scelta], RV = raggioDa(V[2], V[3]);
      info2.innerHTML = '<b>' + F.tt([V[0], V[1]]) + '</b>: L = ' + fmt(V[2]) + ' L☉, T = ' + V[3] + ' K, ' + t('classe ', 'class ') + classe(V[3]) + '<br>' + t('raggio da L = 4πR²σT⁴: ', 'radius from L = 4πR²σT⁴: ') + '<b>' + fmt(RV) + ' R☉</b> (' + fmt(RV * Rsun / 1000) + ' km)' + (RV > 100 ? t(' — al posto del Sole arriverebbe oltre l’orbita di ', ' — in place of the Sun it would reach beyond the orbit of ') + (RV * Rsun / AU > 1.52 ? t('Marte', 'Mars') : RV * Rsun / AU > 1 ? t('della Terra', 'the Earth') : t('Mercurio', 'Mercury')) : RV < 0.02 ? t(' — grande come la Terra: una nana bianca', ' — the size of the Earth: a white dwarf') : '');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. corpo nero ═════════════════════════════════════════════════════ */
  function schedaCorpoNero(div) {
    var Gr = griglia(div), st = { T1: 5772, T2: 3500 }, info = F.el('div', { 'class': 'bsiFX-nota' });
    F.cursore(Gr.pan, ['T₁ (K)', 'T₁ (K)'], 1000, 30000, 50, st.T1, function (v) { st.T1 = v; disegna(); });
    F.cursore(Gr.pan, ['T₂ (K)', 'T₂ (K)'], 1000, 30000, 50, st.T2, function (v) { st.T2 = v; disegna(); });
    var tinte = F.el('div', { style: 'display:flex;gap:10px;margin:8px 0' }); Gr.pan.appendChild(tinte);
    Gr.pan.appendChild(info);
    var cv = F.tela(Gr.dx, 0.6);
    function disegna() {
      var lam = [], y1 = [], y2 = [], lmax = 3000;
      for (var i = 1; i <= 600; i++) { var l = 50 + (lmax - 50) * i / 600; lam.push(l); y1.push(planck(l * 1e-9, st.T1) * 1e-9 / 1e13); y2.push(planck(l * 1e-9, st.T2) * 1e-9 / 1e13); }
      var o = F.grafico(cv, { serie: [{ x: lam, y: y1, col: '#ffd24a', larg: 2.5, etich: 'T₁' }, { x: lam, y: y2, col: '#ff8a80', larg: 2.5, etich: 'T₂' }], xmin: 50, xmax: lmax, ymin: 0, xl: ['λ (nm)', 'λ (nm)'], yl: ['B_λ (10¹³ W m⁻² sr⁻¹ nm⁻¹)', 'B_λ (10¹³ W m⁻² sr⁻¹ nm⁻¹)'], legenda: [{ col: '#ffd24a', etich: 'T₁ = ' + st.T1 + ' K' }, { col: '#ff8a80', etich: 'T₂ = ' + st.T2 + ' K' }] }), q = o.q;
      /* lo spettro visibile come banda sotto l'asse */
      for (var l2 = 380; l2 <= 750; l2 += 2) { var cc = F.calcolo.onde ? F.calcolo.onde.coloreLambda(l2) : [1, 1, 1]; q.fillStyle = 'rgba(' + cc.map(function (v) { return Math.round(v * 255); }).join(',') + ',.55)'; q.fillRect(o.X(l2), o.Y(0) - 8, Math.max(1, o.X(l2 + 2) - o.X(l2)), 8); }
      [st.T1, st.T2].forEach(function (T, k) { var lp = wien(T) * 1e9; if (lp < lmax) { q.strokeStyle = k ? '#ff8a80' : '#ffd24a'; q.setLineDash([3, 3]); q.beginPath(); q.moveTo(o.X(lp), o.Y(0)); q.lineTo(o.X(lp), 16); q.stroke(); q.setLineDash([]); } });
      tinte.innerHTML = '';
      [st.T1, st.T2].forEach(function (T, k) { var col = coloreT(T); tinte.appendChild(F.el('div', { style: 'flex:1;text-align:center;font-size:.78rem;color:#c9d3df' }, [F.el('div', { style: 'height:46px;border-radius:50%;width:46px;margin:0 auto 4px;background:radial-gradient(circle at 40% 35%,#fff,rgb(' + col.join(',') + ') 55%,rgba(' + col.join(',') + ',.6))' }), F.el('span', { testo: (k ? 'T₂' : 'T₁') + ' · ' + classe(T) })])); });
      var r = Math.pow(st.T1 / st.T2, 4);
      info.innerHTML = t('Picco di Wien λ_max = b/T: ', 'Wien peak λ_max = b/T: ') + '<b>' + fmt(wien(st.T1) * 1e9) + ' nm</b> e <b>' + fmt(wien(st.T2) * 1e9) + ' nm</b><br>' + t('Flusso σT⁴: ', 'Flux σT⁴: ') + fmt(sigma * Math.pow(st.T1, 4)) + ' e ' + fmt(sigma * Math.pow(st.T2, 4)) + ' W/m² · ' + t('rapporto ', 'ratio ') + '(T₁/T₂)⁴ = <b>' + fmt(r) + '</b><br>' + t('Indice di colore B − V (Ballesteros): ', 'Colour index B − V (Ballesteros): ') + fmt(bmenoV(st.T1)) + ' e ' + fmt(bmenoV(st.T2)) + '<br>' + t('Il Sole (5772 K) ha il picco nel verde (502 nm) ma appare bianco: emette su tutto il visibile. Le stelle fredde sono rosse, le calde azzurre; nessuna stella è verde.', 'The Sun (5772 K) peaks in the green (502 nm) but looks white: it emits across the whole visible range. Cool stars are red, hot ones blue; no star is green.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. sistema solare ═════════════════════════════════════════════════ */
  function schedaSistemaSolare(div) {
    var Gr = griglia(div), st = { vista: 'interni', velo: 0.5, hohmann: false }, info = F.el('div', { 'class': 'bsiFX-nota' }), tAnni = 0;
    F.scelta(Gr.pan, ['Vista', 'View'], [['interni', t('pianeti interni (fino a Marte)', 'inner planets (up to Mars)')], ['tutti', t('tutti i pianeti (scala logaritmica)', 'all planets (log scale)')], ['esterni', t('pianeti esterni', 'outer planets')]], st.vista, function (v) { st.vista = v; });
    F.cursore(Gr.pan, ['anni al secondo', 'years per second'], 0.05, 20, 0.05, st.velo, function (v) { st.velo = v; }, function (v) { return v.toFixed(2); });
    var cas = F.el('input', { type: 'checkbox' }); Gr.pan.appendChild(F.el('label', { style: 'display:flex;gap:6px;align-items:center;font-size:.86rem;color:#cfe3f7;margin:6px 0' }, [cas, F.el('span', { testo: t('Trasferimento di Hohmann Terra → Marte', 'Hohmann transfer Earth → Mars') })]));
    cas.addEventListener('change', function () { st.hohmann = cas.checked; });
    Gr.pan.appendChild(info);
    var cv = F.tela(Gr.dx, 0.8), ck = F.tela(Gr.dx, 0.42);
    /* terza legge: log T contro log a */
    var la = PIANETI.map(function (p) { return Math.log10(p[2]); }), lp = PIANETI.map(function (p) { return Math.log10(p[4]); }), n = la.length, ma = la.reduce(function (s, v) { return s + v / n; }, 0), mp = lp.reduce(function (s, v) { return s + v / n; }, 0), num = 0, den = 0;
    la.forEach(function (v, i) { num += (v - ma) * (lp[i] - mp); den += (v - ma) * (v - ma); }); var pend = num / den;
    F.grafico(ck, { punti: PIANETI.map(function (p, i) { return { x: la[i], y: lp[i], col: p[7], r: 5 }; }), serie: [{ x: [-0.5, 1.6], y: [1.5 * -0.5, 1.5 * 1.6], col: '#8494a8', tratt: true, etich: 'T ∝ a^(3/2)' }], xl: ['log₁₀ a (UA)', 'log₁₀ a (AU)'], yl: ['log₁₀ T (anni)', 'log₁₀ T (years)'] });
    var H = hohmann(1, 1.5237);
    info.innerHTML = t('Terza legge di Keplero sui dati dei pianeti: pendenza di log T contro log a = ', 'Kepler’s third law on planet data: slope of log T vs log a = ') + '<b>' + fmt(pend) + '</b> (' + t('teoria 3/2', 'theory 3/2') + ')<br>' + t('Hohmann Terra → Marte: ', 'Hohmann Earth → Mars: ') + t('viaggio ', 'trip ') + '<b>' + fmt(H.giorni) + t(' giorni</b>', ' days</b>') + ', Δv₁ = ' + fmt(H.dv1) + ' km/s, Δv₂ = ' + fmt(H.dv2) + ' km/s; ' + t('alla partenza Marte deve precedere la Terra di ', 'at departure Mars must lead the Earth by ') + fmt(H.fase) + '° (' + t('finestra ogni 26 mesi', 'window every 26 months') + ')<br>' + t('Le posizioni vengono dall’equazione di Keplero: i pianeti accelerano al perielio (Mercurio si vede bene). Le fasi iniziali sono indicative.', 'Positions come from Kepler’s equation: planets speed up at perihelion (Mercury shows it well). Initial phases are indicative.');
    var fasi = [4.4, 3.2, 1.75, 6.2, 0.6, 0.87, 5.48, 5.3];
    F.anima(cv, function (dt) {
      tAnni += dt * st.velo;
      var P = F.pennello(cv), q = P.q, W = P.W, Hh = P.H, cx = W / 2, cy = Hh / 2, raggio = Math.min(W, Hh) / 2 - 14;
      var sel = st.vista === 'interni' ? PIANETI.slice(0, 4) : st.vista === 'esterni' ? PIANETI.slice(4) : PIANETI, amax = Math.max.apply(null, sel.map(function (p) { return p[2] * (1 + p[3]); }));
      var scala = st.vista === 'tutti' ? function (r) { return raggio * Math.log10(1 + 9 * r / 31) / Math.log10(10); } : function (r) { return raggio * r / amax; };
      function xy(p) { var r = Math.hypot(p[0], p[1]), s = r ? scala(r) / r : 0; return [cx + p[0] * s, cy - p[1] * s]; }
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx, cy, 7, 0, Math.PI * 2); q.fill();
      sel.forEach(function (p, k) {
        var idx = PIANETI.indexOf(p);
        q.strokeStyle = 'rgba(132,148,168,.35)'; q.beginPath(); for (var i = 0; i <= 180; i++) { var e = p[3], E = 2 * Math.PI * i / 180, w = p[5] * Math.PI / 180, x = p[2] * (Math.cos(E) - e), y = p[2] * Math.sqrt(1 - e * e) * Math.sin(E), pt = xy([x * Math.cos(w) - y * Math.sin(w), x * Math.sin(w) + y * Math.cos(w)]); if (i) q.lineTo(pt[0], pt[1]); else q.moveTo(pt[0], pt[1]); } q.stroke();
        var pos = xy(posizione(p[2], p[3], p[4], p[5], tAnni, fasi[idx])), rr = Math.max(2.5, Math.min(7, 1.2 * Math.log10(p[6])));
        q.fillStyle = p[7]; q.beginPath(); q.arc(pos[0], pos[1], rr, 0, Math.PI * 2); q.fill();
        q.fillStyle = '#c9d3df'; q.font = '10px system-ui'; q.fillText(F.tt([p[0], p[1]]), pos[0] + rr + 2, pos[1] - 2);
      });
      if (st.hohmann && st.vista !== 'esterni') {
        /* ellisse di trasferimento: perielio alla Terra (asse +x), afelio a Marte */
        var at = H.at, et = (1.5237 - 1) / (1.5237 + 1); q.strokeStyle = '#5eead4'; q.setLineDash([5, 4]); q.beginPath();
        for (var i2 = 0; i2 <= 90; i2++) { var E2 = Math.PI * i2 / 90, pt2 = xy([at * (Math.cos(E2) - et) * -1 * -1, at * Math.sqrt(1 - et * et) * Math.sin(E2)]); if (i2) q.lineTo(pt2[0], pt2[1]); else q.moveTo(pt2[0], pt2[1]); }
        q.stroke(); q.setLineDash([]);
      }
      q.fillStyle = '#9fb1c6'; q.font = '12px system-ui'; q.fillText(t('anno ', 'year ') + tAnni.toFixed(2), 10, Hh - 10);
      cv.setAttribute('aria-label', t('sistema solare in movimento', 'moving solar system'));
    }, { ricomincia: function () { tAnni = 0; } });
  }

  /* ═══ 4. esopianeti ═════════════════════════════════════════════════════ */
  var SISTEMI = {
    terra: [['La Terra vista da lontano', 'The Earth seen from afar'], { Ms: 1, Rs: 1, Ls: 1, Rp: 1, Mp: 1, P: 365.25, b: 0.2 }],
    hd: [['HD 209458 b (gioviano caldo)', 'HD 209458 b (hot Jupiter)'], { Ms: 1.15, Rs: 1.2, Ls: 1.77, Rp: 15.5, Mp: 219, P: 3.5247, b: 0.5 }],
    trappist: [['TRAPPIST-1 e', 'TRAPPIST-1 e'], { Ms: 0.0898, Rs: 0.1192, Ls: 0.000553, Rp: 0.92, Mp: 0.69, P: 6.0996, b: 0.2 }]
  };
  function schedaEsopianeti(div) {
    var Gr = griglia(div), st = { s: 'hd' }, o = JSON.parse(JSON.stringify(SISTEMI.hd[1])), info = F.el('div', { 'class': 'bsiFX-nota' }), cursori = F.el('div'), fase = 0;
    F.scelta(Gr.pan, ['Sistema', 'System'], Object.keys(SISTEMI).map(function (k) { return [k, F.tt(SISTEMI[k][0])]; }), st.s, function (v) { st.s = v; o = JSON.parse(JSON.stringify(SISTEMI[v][1])); costruisci(); calcola(); });
    Gr.pan.appendChild(cursori); Gr.pan.appendChild(info);
    function costruisci() {
      cursori.innerHTML = '';
      F.cursore(cursori, ['raggio del pianeta (R⊕)', 'planet radius (R⊕)'], 0.5, 25, 0.1, o.Rp, function (v) { o.Rp = v; calcola(); }, function (v) { return v.toFixed(1); });
      F.cursore(cursori, ['parametro d’impatto b', 'impact parameter b'], 0, 1.1, 0.05, o.b, function (v) { o.b = v; calcola(); }, function (v) { return v.toFixed(2); });
      F.cursore(cursori, ['periodo (giorni)', 'period (days)'], 0.5, 400, 0.5, o.P, function (v) { o.P = v; calcola(); }, function (v) { return v.toFixed(1); });
    }
    var cs = F.tela(Gr.dx, 0.42), cl = F.tela(Gr.dx, 0.42), R, curva;
    function calcola() {
      R = transito(o);
      /* curva di luce lungo la corda del transito, in unita' di durata */
      curva = { x: [], y: [] }; var span = 1 + R.p;
      for (var i = 0; i <= 240; i++) { var u = -1.3 + 2.6 * i / 240, d = Math.hypot(u * span, o.b); curva.x.push(u * R.durata / 2 / 3600); curva.y.push((1 - bloccata(R.p, d, 0.6)) * 1e6 - 1e6); }
      info.innerHTML = t('Profondità ', 'Depth ') + '(R_p/R*)² = <b class="bsiFX-num">' + (R.profondita > 1e-3 ? fmt(R.profondita * 100) + ' %' : fmt(R.profondita * 1e6) + ' ppm') + '</b> · ' + t('durata ', 'duration ') + '<b>' + fmt(R.durata / 3600) + ' h</b><br>' + t('Orbita ', 'Orbit ') + 'a = ' + fmt(R.aUA) + ' UA (' + t('terza legge di Keplero', 'Kepler’s third law') + ') · ' + t('velocità radiale della stella ', 'stellar radial velocity ') + 'K = <b>' + fmt(R.K) + ' m/s</b><br>' + t('Temperatura di equilibrio (albedo 0,3) ', 'Equilibrium temperature (albedo 0.3) ') + '<b>' + fmt(R.Teq) + ' K</b> · ' + t('zona abitabile ', 'habitable zone ') + fmt(R.zona[0]) + '–' + fmt(R.zona[1]) + ' UA' + (R.aUA >= R.zona[0] && R.aUA <= R.zona[1] ? ' → <b>' + t('dentro', 'inside') + '</b>' : ' → ' + t('fuori', 'outside')) + '<br>' + t('La curva ha il fondo arrotondato per l’oscuramento al bordo (u = 0,6): la stella è più scura ai margini. Con b > 1 − R_p/R* il transito è radente; oltre 1 + R_p/R* non c’è.', 'The curve has a rounded bottom because of limb darkening (u = 0.6): the star is darker at the edge. With b > 1 − R_p/R* the transit is grazing; beyond 1 + R_p/R* there is none.');
      F.grafico(cl, { serie: [{ x: curva.x, y: curva.y, col: '#5eead4', larg: 2, etich: ['flusso', 'flux'] }], xl: ['tempo dal centro del transito (h)', 'time from mid-transit (h)'], yl: ['flusso relativo − 1 (ppm)', 'relative flux − 1 (ppm)'] });
    }
    costruisci(); calcola();
    F.anima(cs, function (dt) {
      fase = (fase + dt * 0.25) % 1;
      var P = F.pennello(cs), q = P.q, W = P.W, H = P.H, Rst = H * 0.36, cx = W / 2, cy = H / 2, col = coloreT(Tsun * Math.pow(o.Ls / (o.Rs * o.Rs), 0.25));
      /* disco stellare con oscuramento al bordo */
      var g = q.createRadialGradient(cx, cy, 0, cx, cy, Rst); g.addColorStop(0, 'rgb(' + col.join(',') + ')'); g.addColorStop(0.8, 'rgba(' + col.map(function (v) { return Math.round(v * 0.8); }).join(',') + ',1)'); g.addColorStop(1, 'rgba(' + col.map(function (v) { return Math.round(v * 0.45); }).join(',') + ',1)');
      q.fillStyle = g; q.beginPath(); q.arc(cx, cy, Rst, 0, Math.PI * 2); q.fill();
      var span = (1 + R.p) * 1.3, u = -1 + 2 * fase, px = cx + u * span * Rst, py = cy + o.b * Rst, pr = Math.max(1.5, R.p * Rst);
      q.fillStyle = '#05090f'; q.beginPath(); q.arc(px, py, pr, 0, Math.PI * 2); q.fill();
      q.strokeStyle = 'rgba(159,177,198,.35)'; q.setLineDash([3, 4]); q.beginPath(); q.moveTo(0, py); q.lineTo(W, py); q.stroke(); q.setLineDash([]);
      var d = Math.hypot(u * span, o.b), fl = 1 - bloccata(R.p, d, 0.6);
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.fillText(t('flusso ', 'flux ') + (fl * 100).toFixed(R.profondita < 1e-3 ? 4 : 2) + ' %', 10, H - 10);
      cs.setAttribute('aria-label', t('pianeta che transita davanti alla stella', 'planet transiting its star'));
    }, { ricomincia: function () { fase = 0; } });
  }

  /* ═══ 5. cosmologia ═════════════════════════════════════════════════════ */
  var MODELLI = { lcdm: [['ΛCDM (Planck 2018)', 'ΛCDM (Planck 2018)'], 67.7, 0.31, 0.69], eds: [['Einstein–de Sitter', 'Einstein–de Sitter'], 67.7, 1, 0], aperto: [['aperto, solo materia', 'open, matter only'], 67.7, 0.3, 0], chiuso: [['chiuso (Ω = 2)', 'closed (Ω = 2)'], 67.7, 2, 0], desitter: [['de Sitter (Λ)', 'de Sitter (Λ)'], 67.7, 0.0001, 0.9999] };
  function schedaCosmologia(div) {
    var Gr = griglia(div), st = { H0: 67.7, Om: 0.31, OL: 0.69 }, info = F.el('div', { 'class': 'bsiFX-nota' }), cur = F.el('div'), C0, tab = { a: [1], t: [13.8] };
    F.scelta(Gr.pan, ['Modello', 'Model'], Object.keys(MODELLI).map(function (k) { return [k, F.tt(MODELLI[k][0])]; }), 'lcdm', function (v) { var m = MODELLI[v]; st.H0 = m[1]; st.Om = m[2]; st.OL = m[3]; costruisci(); calcola(); });
    Gr.pan.appendChild(cur); Gr.pan.appendChild(info);
    function costruisci() {
      cur.innerHTML = '';
      F.cursore(cur, ['H₀ (km/s/Mpc)', 'H₀ (km/s/Mpc)'], 50, 90, 0.1, st.H0, function (v) { st.H0 = v; calcola(); }, function (v) { return v.toFixed(1); });
      F.cursore(cur, ['Ω materia', 'Ω matter'], 0, 2, 0.01, st.Om, function (v) { st.Om = v; calcola(); }, function (v) { return v.toFixed(2); });
      F.cursore(cur, ['Ω Λ (energia oscura)', 'Ω Λ (dark energy)'], 0, 1.2, 0.01, st.OL, function (v) { st.OL = v; calcola(); }, function (v) { return v.toFixed(2); });
    }
    var ca = F.tela(Gr.dx, 0.45), cg = F.tela(Gr.dx, 0.5), cd = F.tela(Gr.dx, 0.4);
    function calcola() {
      C0 = cosmo(st.H0, st.Om, st.OL);
      /* a(t): si tabula t(a) e la si legge al contrario; per il futuro si integra con passi in a finche' E(a) > 0 */
      var as = [], ts = [];
      for (var i = 1; i <= 140; i++) { var a = Math.pow(10, -2 + 2.6 * i / 140); if (a > 1 && !(C0.E(a) > 0)) break; as.push(a); ts.push(C0.tempo(a) / ANNO / 1e9); }
      tab = { a: as, t: ts };
      F.grafico(ca, { serie: [{ x: ts, y: as, col: '#5eead4', larg: 2.5, etich: 'a(t)' }], punti: [{ x: C0.etaGa, y: 1, col: '#ffd24a', r: 5 }], linee: [{ y: 1, col: '#34465f', etich: t('oggi', 'today') }], xmin: 0, xmax: Math.min(60, Math.max(30, ts[ts.length - 1] || 30)), ymin: 0, ymax: 3, xl: ['tempo dal Big Bang (miliardi di anni)', 'time since the Big Bang (Gyr)'], yl: ['fattore di scala a', 'scale factor a'], descr: ['espansione dell’universo', 'expansion of the universe'] });
      var zs = [], dl = [], dc = [], lb = [];
      for (var k = 1; k <= 60; k++) { var z = 10 * k / 60, D = C0.dc(z) / 3.0857e25; zs.push(z); dc.push(D); dl.push(D * (1 + z)); lb.push(C0.etaGa - C0.tempo(1 / (1 + z)) / ANNO / 1e9); }
      F.grafico(cd, { serie: [{ x: zs, y: dc, col: '#5eead4', larg: 2, etich: ['distanza comovente', 'comoving distance'] }, { x: zs, y: lb, col: '#ffd24a', larg: 2, etich: ['tempo di ritorno', 'lookback time'] }], xl: ['z', 'z'], yl: ['Gpc · Ga', 'Gpc · Gyr'], ymin: 0, legenda: [{ col: '#5eead4', etich: ['distanza comovente (Gpc)', 'comoving distance (Gpc)'] }, { col: '#ffd24a', etich: ['tempo di ritorno (miliardi di anni)', 'lookback time (Gyr)'] }] });
      info.innerHTML = t('Età dell’universo ', 'Age of the universe ') + 't₀ = ∫₀¹ da/(a H) = <b class="bsiFX-num">' + fmt(C0.etaGa) + t(' miliardi di anni', ' billion years') + '</b> · 1/H₀ = ' + fmt(977.8 / st.H0) + ' Ga<br>Ω_k = 1 − Ω_m − Ω_Λ − Ω_r = ' + fmt(C0.Ok) + ' (' + (Math.abs(C0.Ok) < 0.005 ? t('piatto', 'flat') : C0.Ok > 0 ? t('aperto', 'open') : t('chiuso', 'closed')) + ') · q₀ = Ω_m/2 + Ω_r − Ω_Λ = <b>' + fmt(C0.q0) + '</b> (' + (C0.q0 < 0 ? t('l’espansione accelera', 'expansion is accelerating') : t('l’espansione rallenta', 'expansion is slowing down')) + ')<br>' + t('A z = 1 la luce è partita ', 'At z = 1 the light left ') + fmt(C0.etaGa - C0.tempo(0.5) / ANNO / 1e9) + t(' miliardi di anni fa; il fondo cosmico (z ≈ 1100) era a ', ' billion years ago; the cosmic background (z ≈ 1100) was at ') + fmt(2.7255 * 1101) + ' K ' + t('e oggi è a 2,7255 K: T ∝ 1 + z.', 'and is 2.7255 K today: T ∝ 1 + z.');
    }
    costruisci(); calcola();
    /* galassie su una griglia comovente: le distanze crescono con a(t), da ognuna tutte le altre si allontanano */
    var gal = []; for (var i = -4; i <= 4; i++) for (var j = -3; j <= 3; j++) gal.push([i + 0.3 * Math.sin(7 * i + j), j + 0.3 * Math.cos(5 * j - i)]);
    var tg = 0;
    F.anima(cg, function (dt) {
      tg = (tg + dt * 0.12) % 1;
      /* a(t) letto dalla tabella calcolata una volta (interpolazione lineare): niente integrali nel ciclo */
      var tGa = 1 + tg * Math.max(1, Math.min(tab.t[tab.t.length - 1], C0.etaGa * 1.6) - 1), a = tab.a[0];
      for (var k = 1; k < tab.t.length; k++) if (tab.t[k] >= tGa) { var f = (tGa - tab.t[k - 1]) / (tab.t[k] - tab.t[k - 1]); a = tab.a[k - 1] + f * (tab.a[k] - tab.a[k - 1]); break; } else a = tab.a[k];
      var P = F.pennello(cg), q = P.q, W = P.W, H = P.H, s = Math.min(W, H) / 9 * a;
      gal.forEach(function (p, k) { var x = W / 2 + p[0] * s, y = H / 2 + p[1] * s; if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return; q.fillStyle = k === 31 ? '#ffd24a' : 'rgba(201,211,223,.85)'; q.beginPath(); q.ellipse(x, y, 4, 2.5, k, 0, Math.PI * 2); q.fill(); });
      var o = gal[31], ox = W / 2 + o[0] * s, oy = H / 2 + o[1] * s; q.strokeStyle = 'rgba(255,210,74,.35)';
      gal.forEach(function (p, k) { if (k === 31 || k % 3) return; var x = W / 2 + p[0] * s, y = H / 2 + p[1] * s, L = Math.hypot(x - ox, y - oy); if (L < 1) return; q.beginPath(); q.moveTo(x, y); q.lineTo(x + (x - ox) / L * L * 0.08, y + (y - oy) / L * L * 0.08); q.stroke(); });
      q.fillStyle = '#9fb1c6'; q.font = '12px system-ui'; q.fillText('t = ' + tGa.toFixed(1) + t(' miliardi di anni · a = ', ' Gyr · a = ') + a.toFixed(2), 10, H - 10);
      q.fillText(t('Le frecce: velocità di allontanamento viste dalla galassia gialla, proporzionali alla distanza (legge di Hubble)', 'Arrows: recession velocities seen from the yellow galaxy, proportional to distance (Hubble’s law)'), 10, 16);
      cg.setAttribute('aria-label', t('galassie in un universo che si espande', 'galaxies in an expanding universe'));
    }, { ricomincia: function () { tg = 0; } });
  }

  F.sezione('sfisastro', {
    titolo: ['🔭 Astrofisica', '🔭 Astrophysics'],
    sotto: ['Il diagramma H-R con stelle vere, il corpo nero e il colore delle stelle, il sistema solare in movimento con Keplero e Hohmann, i transiti degli esopianeti, la cosmologia di Friedmann con l’età dell’universo.', 'The H-R diagram with real stars, the black body and the colour of stars, the moving solar system with Kepler and Hohmann, exoplanet transits, Friedmann cosmology with the age of the universe.'],
    schede: [
      { nome: ['⭐ Diagramma H-R', '⭐ H-R diagram'], costruisci: schedaHR },
      { nome: ['🌡️ Corpo nero e colori', '🌡️ Black body and colours'], costruisci: schedaCorpoNero },
      { nome: ['🪐 Sistema solare', '🪐 Solar system'], costruisci: schedaSistemaSolare },
      { nome: ['🌑 Esopianeti', '🌑 Exoplanets'], costruisci: schedaEsopianeti },
      { nome: ['🌌 Cosmologia', '🌌 Cosmology'], costruisci: schedaCosmologia }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
