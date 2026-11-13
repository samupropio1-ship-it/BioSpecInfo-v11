/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-wormhole.js — 🌀 Spaziotempo curvo e wormhole: che cosa dice
   davvero la relatività generale
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v253)
   Richiesta dell'autore: «la teoria della curvatura dello spaziotempo, dei
   wormhole e cose così, però scientificamente accurate». La sezione dei buchi
   neri (bsi-astro-buchineri.js) mostra già Schwarzschild, le geodetiche, il
   paraboloide di Flamm, i GPS e Hawking. Qui ciò che mancava, con un'etichetta
   su ogni affermazione: MISURATO, TEORIA (conseguenza consolidata della
   relatività generale), IPOTESI (proposta seria ma non verificata),
   SPECULAZIONE.

   · LA CURVATURA: perché la gravità è geometria, le equazioni di campo di
     Einstein, e quanto è curvo lo spaziotempo vicino a corpi veri. Per
     Schwarzschild lo scalare di Kretschmann vale K = 12·r_s²/r⁶: K^(−1/4) è la
     lunghezza su cui la curvatura si fa sentire. La forza di marea su un
     corpo lungo L: Δa = 2GM·L/r³ (allungamento radiale).
   · IL WORMHOLE DI MORRIS E THORNE (Am. J. Phys. 56 (1988) 395):
       ds² = −e^(2Φ)c²dt² + dr²/(1 − b(r)/r) + r²dΩ²,   b(r₀) = r₀ (gola).
     Con Φ = 0 e la famiglia b(r) = b₀·(b₀/r)ⁿ (n = 1 è il wormhole di Ellis):
       ρc² = c⁴·b′/(8πG r²)    p_r = −c⁴·b/(8πG r³)    p_t = c⁴·(b − b′r)/(16πG r³)
     alla gola ρc² + p_r = −(1+n)·c⁴/(8πG b₀²) < 0: la condizione di energia
     nulla è violata per OGNI n. Serve «materia esotica». Il diagramma di
     immersione z(r) = ∫ dr/√(r/b − 1) si calcola numericamente (per Ellis
     z = b₀·arccosh(r/b₀)) e si confronta con il paraboloide di Flamm,
     z = 2√(r_s(r − r_s)), il ponte di Einstein–Rosen.
   · L'ENERGIA NEGATIVA CHE ESISTE: l'effetto Casimir, ρ = −π²ħc/(720 a⁴),
     misurato (Lamoreaux 1997). Confrontato con ciò che servirebbe alla gola:
     decine di ordini di grandezza.
   · TEMPO: dilatazione gravitazionale dτ/dt = √(1 − r_s/r) per un
     osservatore fermo, e che cosa dicono i lavori sulle macchine del tempo
     (Morris, Thorne, Yurtsever 1988) e la congettura di protezione della
     cronologia (Hawking 1992).

   ONESTA'
   · Nessun wormhole è mai stato osservato. Le soluzioni esistono nelle
     equazioni; la materia che servirebbe no, almeno nelle quantità richieste.
   · Gli integrali della «massa esotica» sono stime con il volume coordinato:
     Visser, Kar e Dadhich (PRL 90 (2003) 201102) hanno mostrato che con
     forme opportune la quantità può essere resa piccola a piacere. Lo si dice.
   · L'esperimento del 2022 sul processore quantistico Sycamore (Jafferis et
     al., Nature 612 (2022) 51) ha simulato la dinamica di un modello
     olografico: non ha creato un wormhole nello spazio.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, G = 6.67430e-11, C = 299792458, MSOLE = 1.98847e30, HBAR = 1.054571817e-34, ANNO_LUCE = 9.4607304725808e15, GIOVE = 1.89813e27;
  function griglia(div) { var Gr = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); Gr.appendChild(pan); Gr.appendChild(dx); div.appendChild(Gr); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function sci(x, c) { if (!isFinite(x)) return '∞'; if (x === 0) return '0'; var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); if (Math.abs(e) < 3) return x.toPrecision(c || 3).replace('.', ','); return m.toFixed((c || 3) - 1).replace('.', ',') + '×10' + String(e).replace('-', '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }); }
  var STATI = { misurato: ['MISURATO', '#5eead4'], teoria: ['TEORIA', '#6bb7ff'], ipotesi: ['IPOTESI', '#ffd24a'], speculazione: ['SPECULAZIONE', '#ff8fab'] };
  function stato(k) { var s = STATI[k]; return '<span style="display:inline-block;font:800 10px/1 system-ui,sans-serif;letter-spacing:.06em;color:#04121c;background:' + s[1] + ';border-radius:5px;padding:3px 6px;margin-right:6px;vertical-align:1px">' + s[0] + '</span>'; }
  function blocco(div, k, titolo, testo) { div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: stato(k) + '<b>' + titolo + '</b><br>' + testo, style: 'margin:8px 0' })); }

  /* ═══ 1. IL CALCOLO ════════════════════════════════════════════════════ */
  function raggioSchwarzschild(M) { return 2 * G * M / (C * C); }
  /** Lunghezza di curvatura K^(−1/4) a distanza r da una massa M (Schwarzschild, fuori dalla massa). */
  function lunghezzaCurvatura(M, r) { var rs = raggioSchwarzschild(M); return Math.pow(12 * rs * rs / Math.pow(r, 6), -0.25); }
  /** Accelerazione di marea radiale fra gli estremi di un corpo lungo L (limite newtoniano, esatto per osservatori in caduta radiale in Schwarzschild). */
  function marea(M, r, L) { return 2 * G * M * L / Math.pow(r, 3); }
  /** Rapporto fra il tempo proprio di un orologio fermo a r e quello all'infinito. */
  function dilatazione(M, r) { var rs = raggioSchwarzschild(M); return r <= rs ? 0 : Math.sqrt(1 - rs / r); }
  var CORPI = [
    { k: 'terra', nome: 'Terra', M: 5.9722e24, R: 6.371e6 },
    { k: 'sole', nome: 'Sole', M: MSOLE, R: 6.957e8 },
    { k: 'sirio', nome: 'Sirio B (nana bianca)', M: 1.018 * MSOLE, R: 5.8e6 },
    { k: 'ns', nome: 'Stella di neutroni (1,4 M☉, 12 km)', M: 1.4 * MSOLE, R: 1.2e4 },
    { k: 'bh10', nome: 'Buco nero stellare (10 M☉), all\'orizzonte', M: 10 * MSOLE, R: null },
    { k: 'sgra', nome: 'Sgr A* (4,3 milioni di M☉), all\'orizzonte', M: 4.297e6 * MSOLE, R: null },
    { k: 'm87', nome: 'M87* (6,5 miliardi di M☉), all\'orizzonte', M: 6.5e9 * MSOLE, R: null }
  ];
  function corpo(k) { var c = CORPI.filter(function (x) { return x.k === k; })[0] || CORPI[3]; return { nome: c.nome, M: c.M, R: c.R || raggioSchwarzschild(c.M), buco: !c.R }; }

  /** Funzione di forma b(r) = b₀·(b₀/r)ⁿ e la sua derivata. */
  function forma(b0, n) { return { b: function (r) { return b0 * Math.pow(b0 / r, n); }, db: function (r) { return -n * b0 * Math.pow(b0 / r, n) / r; } }; }
  /** Densità di energia e pressioni (Pa = J/m³) a distanza r per Φ = 0. */
  function materia(b0, n, r) {
    var f = forma(b0, n), b = f.b(r), db = f.db(r), k = Math.pow(C, 4) / (8 * Math.PI * G);
    var rho = k * db / (r * r), pr = -k * b / Math.pow(r, 3), pt = k * (b - db * r) / (2 * Math.pow(r, 3));
    return { rho: rho, pr: pr, pt: pt, nec: rho + pr };
  }
  /** Profilo di immersione z(r) per r da b₀ a rMax (trapezi con la sostituzione r = b₀ + s², che toglie la singolarità alla gola). */
  function immersione(b0, n, rMax, passi) {
    passi = passi || 400; var f = forma(b0, n), sMax = Math.sqrt(rMax - b0), out = [{ r: b0, z: 0 }], z = 0, prev = null;
    function integrando(s) { var r = b0 + s * s, den = r / f.b(r) - 1; return den <= 0 ? (n + 1 > 0 ? 2 / Math.sqrt((1 + n) / b0) : 0) : 2 * s / Math.sqrt(den); }
    for (var i = 1; i <= passi; i++) { var s0 = sMax * (i - 1) / passi, s1 = sMax * i / passi; z += (integrando(s0) + integrando(s1)) / 2 * (s1 - s0); out.push({ r: b0 + s1 * s1, z: z }); }
    return out;
  }
  /** Flamm: z = 2√(r_s(r − r_s)). */
  function flamm(rs, r) { return r < rs ? 0 : 2 * Math.sqrt(rs * (r - rs)); }
  /** «Massa esotica» stimata con l'integrale di ρ sul volume coordinato, fino a rMax (kg). Solo un ordine di grandezza: vedi le note. */
  function massaEsotica(b0, n, rMax) {
    var N = 4000, s = 0, a = Math.log(b0), bb = Math.log(rMax);
    for (var i = 0; i < N; i++) { var u = a + (bb - a) * (i + 0.5) / N, r = Math.exp(u); s += materia(b0, n, r).rho * 4 * Math.PI * r * r * r; }
    return s * (bb - a) / N / (C * C);
  }
  function casimir(a) { return -Math.PI * Math.PI * HBAR * C / (720 * Math.pow(a, 4)); }

  /* ═══ 2. IL DISEGNO DELLA SUPERFICIE ═══════════════════════════════════ */
  function tela(dx, rapporto, etichetta) {
    var c = F.el('canvas', { role: 'img', 'aria-label': etichetta, style: 'width:100%;display:block;border-radius:12px;background:#04101b;touch-action:none;cursor:grab' });
    c._r = rapporto; dx.appendChild(c); return c;
  }
  function prepara(c) {
    var W = Math.max(220, c.parentNode.clientWidth || 300), H = Math.round(W * c._r), dpr = Math.min(2, globale.devicePixelRatio || 1);
    c.style.height = H + 'px'; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H); return { q: q, W: W, H: H };
  }
  /** Superficie di rivoluzione z(r), specchiata (le due «bocche»), in filo di ferro. */
  function superficie(c, profilo, vista, colore, etich) {
    var V = prepara(c), q = V.q, rMax = profilo[profilo.length - 1].r, zMax = profilo[profilo.length - 1].z, sc = Math.min(V.W / (2.3 * rMax), V.H / (2.4 * Math.max(zMax, rMax * 0.3)));
    var cy = Math.cos(vista.yaw), sy = Math.sin(vista.yaw), cp = Math.cos(vista.pitch), sp = Math.sin(vista.pitch);
    function P(x, y, z) { var x1 = cy * x - sy * y, y1 = sy * x + cy * y, y2 = cp * y1 - sp * z, z2 = sp * y1 + cp * z; return { x: V.W / 2 + x1 * sc, y: V.H / 2 - z2 * sc, d: y2 }; }
    var NANG = 36, passo = Math.max(1, Math.floor(profilo.length / 22));
    [1, -1].forEach(function (lato) {
      for (var a = 0; a < NANG; a++) {                                  /* meridiani */
        var th = a / NANG * 2 * Math.PI; q.beginPath();
        profilo.forEach(function (p, i) { var s = P(p.r * Math.cos(th), p.r * Math.sin(th), lato * p.z); if (i) q.lineTo(s.x, s.y); else q.moveTo(s.x, s.y); });
        q.strokeStyle = colore + '55'; q.lineWidth = 0.8; q.stroke();
      }
      for (var i = 0; i < profilo.length; i += passo) {                 /* paralleli */
        var p = profilo[i]; q.beginPath();
        for (var b = 0; b <= 64; b++) { var th2 = b / 64 * 2 * Math.PI, s = P(p.r * Math.cos(th2), p.r * Math.sin(th2), lato * p.z); if (b) q.lineTo(s.x, s.y); else q.moveTo(s.x, s.y); }
        q.strokeStyle = i === 0 ? '#ffd24a' : colore + 'aa'; q.lineWidth = i === 0 ? 2.2 : 1; q.stroke();
      }
    });
    q.fillStyle = '#9fb3c8'; q.font = '12px system-ui,sans-serif'; q.fillText(etich, 10, 18);
    q.fillStyle = '#ffd24a'; q.fillText(t('in giallo: la gola', 'in yellow: the throat'), 10, V.H - 10);
  }
  function trascinabile(c, vista, ridisegna) {
    var tocco = null;
    c.addEventListener('pointerdown', function (e) { tocco = { x: e.clientX, y: e.clientY }; try { c.setPointerCapture(e.pointerId); } catch (x) {} });
    c.addEventListener('pointermove', function (e) { if (!tocco) return; vista.yaw += (e.clientX - tocco.x) * 0.01; vista.pitch = Math.max(-1.45, Math.min(1.45, vista.pitch + (e.clientY - tocco.y) * 0.01)); tocco = { x: e.clientX, y: e.clientY }; ridisegna(); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { c.addEventListener(ev, function () { tocco = null; }); });
  }

  /* ═══ 3. LE SCHEDE ═════════════════════════════════════════════════════ */
  function schedaCurvatura(div) {
    var g = griglia(div), k = 'ns', L = 2;
    F.scelta(g.pan, ['Corpo', 'Body'], CORPI.map(function (x) { return [x.k, x.nome]; }), k, function (v) { k = v; disegna(); });
    F.cursore(g.pan, ['Lunghezza del corpo che cade (m)', 'Length of the falling body (m)'], 0.1, 10, 0.1, L, function (v) { L = v; disegna(); }, function (v) { return v.toFixed(1).replace('.', ',') + ' m'; });
    var info = nota(g.pan), c = F.tela(g.dx, 0.58), sotto = F.el('div'); g.dx.appendChild(sotto);
    blocco(sotto, 'teoria', t('La gravità è geometria', 'Gravity is geometry'), t('Nella relatività generale un corpo in caduta libera non subisce forze: segue una geodetica, la linea «più dritta possibile» di uno spaziotempo curvo. Ciò che chiamiamo gravità è la curvatura, e la curvatura la decide la materia: G_μν + Λg_μν = (8πG/c⁴)·T_μν. A sinistra la geometria (il tensore di Einstein, fatto con le derivate seconde della metrica), a destra energia, impulso e pressioni. Il fattore 8πG/c⁴ ≈ 2,1×10⁻⁴³ s²/(kg·m) dice perché serve moltissima massa per curvare in modo apprezzabile.', 'In general relativity a freely falling body feels no force: it follows a geodesic, the «straightest possible» line of a curved spacetime. What we call gravity is curvature, and matter decides the curvature: G_μν + Λg_μν = (8πG/c⁴)·T_μν. On the left the geometry (the Einstein tensor, built from second derivatives of the metric), on the right energy, momentum and pressures. The factor 8πG/c⁴ ≈ 2.1×10⁻⁴³ s²/(kg·m) says why enormous masses are needed to curve noticeably.'));
    blocco(sotto, 'misurato', t('Le prove', 'The evidence'), t('Il perielio di Mercurio avanza di 43″ al secolo oltre quanto previsto da Newton; la luce di una stella radente al Sole si piega di 1,75″ (Eddington 1919, oggi verificato al decimillesimo con il VLBI); gli orologi dei satelliti GPS vanno avanti di circa 38 μs al giorno rispetto a terra; le onde gravitazionali di GW150914 (2015); l\'ombra di M87* (2019) e di Sgr A* (2022) ripresa dall\'Event Horizon Telescope.', 'Mercury\'s perihelion advances 43″ per century beyond Newton; starlight grazing the Sun bends by 1.75″ (Eddington 1919, now checked to one part in ten thousand with VLBI); GPS satellite clocks run ahead by about 38 μs per day relative to the ground; the gravitational waves of GW150914 (2015); the shadows of M87* (2019) and Sgr A* (2022) imaged by the Event Horizon Telescope.'));
    function disegna() {
      var B = corpo(k), rs = raggioSchwarzschild(B.M), lc = lunghezzaCurvatura(B.M, B.R), a = marea(B.M, B.R, L), d = dilatazione(B.M, B.R), xs = [], ys = [];
      for (var f = 1.02; f <= 12; f *= 1.04) { xs.push(f); ys.push(Math.log10(marea(B.M, B.R * f, L))); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#ff8fab', larg: 2 }], xl: ['distanza (in unità di ' + (B.buco ? 'r_s' : 'raggio') + ')', 'distance (in units of ' + (B.buco ? 'r_s' : 'radius') + ')'], yl: ['log₁₀ marea (m/s²)', 'log₁₀ tide (m/s²)'] });
      info.innerHTML = '<div class="bsiFX-eq">K = 12·r_s²/r⁶ &nbsp; Δa = 2GM·L/r³</div>' +
        t('Raggio di Schwarzschild ', 'Schwarzschild radius ') + '<b class="bsiFX-num">r_s = ' + sci(rs) + ' m</b>' + (B.buco ? '' : ' (' + t('è ', 'it is ') + sci(rs / B.R) + t(' del raggio', ' of the radius') + ')') + '<br>' +
        t('Lunghezza di curvatura alla superficie ', 'Curvature length at the surface ') + (B.buco ? t('(qui: all\'orizzonte)', '(here: at the horizon)') : '') + ': <b class="bsiFX-num">' + sci(lc) + ' m</b><br>' +
        t('Marea su ', 'Tide over ') + L.toFixed(1).replace('.', ',') + ' m: <b class="bsiFX-num">' + sci(a) + ' m/s²</b> (' + sci(a / 9.80665) + ' g)' + '<br>' +
        (B.buco ? t('All\'orizzonte un orologio fermo si fermerebbe del tutto: nessun osservatore può restare fermo lì.', 'At the horizon a static clock would stop completely: no observer can stay still there.') : t('Un orologio alla superficie perde ', 'A clock at the surface loses ') + '<b class="bsiFX-num">' + sci((1 - d) * 86400) + ' s ' + t('al giorno', 'per day') + '</b> ' + t('rispetto a uno lontanissimo', 'compared with a very distant one')) + '<br><small>' +
        (B.buco ? (a > 100 ? t('Una persona sarebbe stirata fino a rompersi («spaghettificazione») prima ancora di arrivare all\'orizzonte.', 'A person would be stretched to breaking («spaghettification») before even reaching the horizon.') : t('Qui la marea all\'orizzonte è minima: si attraverserebbe l\'orizzonte senza accorgersene. Più grande il buco nero, più dolce l\'orizzonte (Δa ∝ 1/M²).', 'Here the tide at the horizon is tiny: you would cross the horizon without noticing. The bigger the black hole, the gentler the horizon (Δa ∝ 1/M²).')) : t('La curvatura vera alla superficie è minuscola rispetto alla scala del corpo, tranne per le stelle di neutroni.', 'The real curvature at the surface is tiny compared with the size of the body, except for neutron stars.')) + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  function schedaWormhole(div) {
    var g = griglia(div), lb0 = 0, n = 1, vista = { yaw: 0.6, pitch: 0.42 }, confronto = false;
    F.cursore(g.pan, ['Raggio della gola b₀ (log₁₀ m)', 'Throat radius b₀ (log₁₀ m)'], -2, 16, 0.1, lb0, function (v) { lb0 = v; disegna(); }, function (v) { return sci(Math.pow(10, v)) + ' m'; });
    F.cursore(g.pan, ['Forma: esponente n di b(r) = b₀(b₀/r)ⁿ', 'Shape: exponent n of b(r) = b₀(b₀/r)ⁿ'], 0, 3, 0.1, n, function (v) { n = v; disegna(); }, function (v) { return v.toFixed(1).replace('.', ',') + (Math.abs(v - 1) < 1e-9 ? ' (Ellis)' : ''); });
    F.scelta(g.pan, ['Disegno', 'Drawing'], [['w', 'Il wormhole di Morris–Thorne'], ['f', 'Il ponte di Einstein–Rosen (Schwarzschild)']], 'w', function (v) { confronto = v === 'f'; disegna(); });
    var info = nota(g.pan), c = tela(g.dx, 0.8, t('Diagramma di immersione: la geometria dello spazio attorno alla gola, trascina per ruotare', 'Embedding diagram: the geometry of space around the throat, drag to rotate'));
    var sotto = F.el('div'); g.dx.appendChild(sotto);
    blocco(sotto, 'teoria', t('Che cos\'è il disegno', 'What the drawing is'), t('È un diagramma di immersione: si prende una «fetta» dello spazio al tempo t costante, nel piano equatoriale, e la si disegna come superficie in tre dimensioni in modo che le distanze lungo la superficie siano quelle vere. La terza dimensione non esiste: serve solo a vedere la geometria. Le due bocche sono due regioni dello spazio, lontane quanto si vuole, unite dalla gola.', 'It is an embedding diagram: take a «slice» of space at constant t, in the equatorial plane, and draw it as a surface in three dimensions so that distances along the surface are the true ones. The third dimension does not exist: it only helps to see the geometry. The two mouths are two regions of space, as far apart as you like, joined by the throat.'));
    blocco(sotto, 'teoria', t('Einstein–Rosen non si attraversa', 'Einstein–Rosen cannot be crossed'), t('La soluzione di Schwarzschild completa contiene già un «ponte» (Einstein e Rosen, 1935), ma è dinamico: la gola si apre e si richiude più in fretta di quanto la luce possa passare (Fuller e Wheeler, 1962). E ha un orizzonte: chi entra non esce.', 'The complete Schwarzschild solution already contains a «bridge» (Einstein and Rosen, 1935), but it is dynamic: the throat opens and pinches off faster than light can cross it (Fuller and Wheeler, 1962). And it has a horizon: whoever enters does not come out.'));
    blocco(sotto, 'ipotesi', t('Il wormhole attraversabile', 'The traversable wormhole'), t('Morris e Thorne (1988) hanno chiesto il contrario: quale geometria permetterebbe di passare? La risposta è la metrica di questa scheda, senza orizzonte, con forze di marea sopportabili. Il prezzo: alla gola la somma di densità d\'energia e pressione radiale deve essere negativa. Nessuna materia ordinaria lo fa.', 'Morris and Thorne (1988) asked the opposite: what geometry would let you through? The answer is this tab\'s metric, with no horizon and bearable tides. The price: at the throat the sum of energy density and radial pressure must be negative. No ordinary matter does that.'));
    trascinabile(c, vista, function () { disegna(true); });
    var ultimo = null;
    function disegna(solo) {
      var b0 = Math.pow(10, lb0), rMax = 6 * b0;
      if (confronto) superficie(c, Array.from({ length: 160 }, function (_, i) { var r = b0 + (rMax - b0) * Math.pow(i / 159, 2); return { r: r, z: flamm(b0, r) }; }), vista, '#9d8cff', t('Paraboloide di Flamm, r_s = b₀', 'Flamm paraboloid, r_s = b₀'));
      else superficie(c, (ultimo = immersione(b0, n, rMax, 160)), vista, '#5eead4', 'b(r) = b₀(b₀/r)^' + n.toFixed(1).replace('.', ','));
      if (solo) return;
      var m = materia(b0, n, b0), mm = massaEsotica(b0, n, 1000 * b0);
      info.innerHTML = '<div class="bsiFX-eq">ds² = −c²dt² + dr²/(1 − b(r)/r) + r²dΩ²</div>' +
        t('Alla gola (r = b₀ = ', 'At the throat (r = b₀ = ') + sci(b0) + ' m):<br>' +
        t('tensione radiale ', 'radial tension ') + '<b class="bsiFX-num">' + sci(-m.pr) + ' Pa</b>' + t(' (la pressione al centro della Terra è 3,6×10¹¹ Pa)', ' (the pressure at the Earth\'s centre is 3.6×10¹¹ Pa)') + '<br>' +
        t('densità di energia ', 'energy density ') + '<b class="bsiFX-num">' + sci(m.rho) + ' J/m³</b>' + (m.rho < 0 ? t(' — negativa', ' — negative') : '') + '<br>' +
        'ρc² + p_r = <b class="bsiFX-num" style="color:#ff8fab">' + sci(m.nec) + ' J/m³ &lt; 0</b>: ' + t('condizione di energia nulla violata', 'null energy condition violated') + '<br>' +
        (n > 0.05 ? t('«Massa» esotica entro 1000 b₀ (stima con il volume coordinato): ', 'Exotic «mass» within 1000 b₀ (estimate): ') + '<b class="bsiFX-num">' + sci(mm) + ' kg</b> (' + sci(mm / GIOVE) + t(' masse di Giove', ' Jupiter masses') + ')<br>' : '') +
        '<small>' + t('Si scala come 1/b₀²: più grande la gola, meno estrema la materia, ma sempre esotica. Con n = 0 la densità è nulla e basta la tensione; con n > 1 c\'è anche energia negativa distribuita attorno.', 'It scales as 1/b₀²: the larger the throat, the less extreme the matter, but always exotic. With n = 0 the density vanishes and the tension alone is enough; with n > 1 there is also negative energy spread around.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  function schedaEnergia(div) {
    var g = griglia(div), la = -6, lb0 = 3;
    F.cursore(g.pan, ['Distanza fra le lastre di Casimir (log₁₀ m)', 'Casimir plate separation (log₁₀ m)'], -9, -4, 0.05, la, function (v) { la = v; disegna(); }, function (v) { return sci(Math.pow(10, v)) + ' m'; });
    F.cursore(g.pan, ['Gola del wormhole b₀ (log₁₀ m)', 'Wormhole throat b₀ (log₁₀ m)'], -2, 16, 0.1, lb0, function (v) { lb0 = v; disegna(); }, function (v) { return sci(Math.pow(10, v)) + ' m'; });
    var info = nota(g.pan), c = F.tela(g.dx, 0.55), sotto = F.el('div'); g.dx.appendChild(sotto);
    blocco(sotto, 'misurato', t('L\'energia negativa esiste', 'Negative energy exists'), t('Fra due lastre conduttrici molto vicine il vuoto quantistico ha meno modi permessi che fuori: la densità di energia fra le lastre è più bassa di quella del vuoto, cioè negativa, ρ = −π²ħc/(720a⁴), e le lastre si attraggono. L\'attrazione è stata misurata (Lamoreaux 1997; Mohideen e Roy 1998; Bressi e colleghi, Padova 2002, con lastre parallele).', 'Between two very close conducting plates the quantum vacuum has fewer allowed modes than outside: the energy density between the plates is lower than that of the vacuum, that is negative, ρ = −π²ħc/(720a⁴), and the plates attract. The attraction has been measured (Lamoreaux 1997; Mohideen and Roy 1998; Bressi and colleagues, Padua 2002, with parallel plates).'));
    blocco(sotto, 'teoria', t('Ma la natura la limita', 'But nature limits it'), t('Le disuguaglianze quantistiche (Ford e Roman, 1995–1996) dicono che l\'energia negativa non si può accumulare a piacere: più è intensa, meno dura o meno spazio occupa. Applicate a un wormhole, impongono che la materia esotica stia in uno strato sottilissimo attorno alla gola, molte volte più piccolo della gola stessa.', 'Quantum inequalities (Ford and Roman, 1995–1996) say negative energy cannot be piled up at will: the stronger it is, the shorter it lasts or the smaller the space it fills. Applied to a wormhole, they require the exotic matter to sit in an extremely thin layer around the throat, many times smaller than the throat itself.'));
    blocco(sotto, 'speculazione', t('Wormhole e informazione quantistica', 'Wormholes and quantum information'), t('In gravità quantistica si studia l\'idea che entanglement e geometria siano la stessa cosa («ER = EPR», Maldacena e Susskind, 2013), e si sono costruiti wormhole attraversabili in modelli teorici con effetti quantistici (Gao, Jafferis, Wall 2017; Maldacena e Qi 2018). L\'esperimento su Sycamore del 2022 ha simulato un modello di questo tipo su 9 qubit: è una simulazione, non un buco nello spazio.', 'Quantum gravity studies the idea that entanglement and geometry are the same thing («ER = EPR», Maldacena and Susskind, 2013), and traversable wormholes have been built in theoretical models with quantum effects (Gao, Jafferis, Wall 2017; Maldacena and Qi 2018). The 2022 Sycamore experiment simulated such a model on 9 qubits: a simulation, not a hole in space.'));
    function disegna() {
      var a = Math.pow(10, la), b0 = Math.pow(10, lb0), rc = casimir(a), serve = materia(b0, 0, b0).pr, xs = [], ys = [];
      for (var e = -9; e <= -4; e += 0.05) { xs.push(e); ys.push(Math.log10(-casimir(Math.pow(10, e)))); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2 }], punti: [{ x: la, y: Math.log10(-rc), col: '#ffd24a', r: 5 }], xl: ['log₁₀ distanza fra le lastre (m)', 'log₁₀ plate separation (m)'], yl: ['log₁₀ |ρ| (J/m³)', 'log₁₀ |ρ| (J/m³)'] });
      var ordini = Math.log10(Math.abs(serve) / Math.abs(rc));
      info.innerHTML = '<div class="bsiFX-eq">ρ_Casimir = −π²ħc/(720·a⁴)</div>' +
        t('Lastre a ', 'Plates at ') + sci(a) + ' m: <b class="bsiFX-num">' + sci(rc) + ' J/m³</b>, ' + t('pressione ', 'pressure ') + sci(Math.PI * Math.PI * HBAR * C / (240 * Math.pow(a, 4))) + ' Pa<br>' +
        t('Un wormhole con la gola di ', 'A wormhole with a throat of ') + sci(b0) + ' m ' + t('chiede una tensione di ', 'needs a tension of ') + '<b class="bsiFX-num">' + sci(-serve) + ' Pa</b><br>' +
        t('Differenza: ', 'Gap: ') + '<b class="bsiFX-num">' + (ordini > 0 ? Math.round(ordini) + t(' ordini di grandezza', ' orders of magnitude') : t('l\'effetto Casimir basterebbe in intensità — ma su uno spessore di ', 'the Casimir effect would suffice in strength — but over a thickness of ') + sci(a) + ' m') + '</b><br><small>' +
        t('Per avvicinarsi servirebbero lastre a distanze subnucleari, dove il calcolo stesso non vale più. Per questo un wormhole attraversabile resta una soluzione delle equazioni, non un oggetto costruibile.', 'Getting close would need plates at subnuclear separations, where the calculation itself no longer holds. That is why a traversable wormhole remains a solution of the equations, not a buildable object.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  function schedaTempo(div) {
    var g = griglia(div), k = 'bh10', fr = 1.5;
    F.scelta(g.pan, ['Buco nero', 'Black hole'], CORPI.filter(function (x) { return !x.R; }).map(function (x) { return [x.k, x.nome.replace(/, all'orizzonte/, '')]; }), k, function (v) { k = v; disegna(); });
    F.cursore(g.pan, ['Distanza dell\'orologio fermo (in r_s)', 'Distance of the static clock (in r_s)'], 1.01, 10, 0.01, fr, function (v) { fr = v; disegna(); }, function (v) { return v.toFixed(2).replace('.', ',') + ' r_s'; });
    var info = nota(g.pan), c = F.tela(g.dx, 0.55), sotto = F.el('div'); g.dx.appendChild(sotto);
    blocco(sotto, 'misurato', t('Il tempo scorre diverso', 'Time runs differently'), t('Più in basso in un campo gravitazionale, più lento l\'orologio rispetto a uno in alto: misurato con gli orologi atomici in aereo (Hafele e Keating, 1971), con i raggi gamma in una torre di 22,5 m (Pound e Rebka, 1959) e, nel 2010, con orologi ottici sollevati di appena 33 cm (Chou e colleghi, NIST).', 'The lower in a gravitational field, the slower the clock compared with one higher up: measured with atomic clocks on aircraft (Hafele and Keating, 1971), with gamma rays in a 22.5 m tower (Pound and Rebka, 1959) and, in 2010, with optical clocks raised by just 33 cm (Chou and colleagues, NIST).'));
    blocco(sotto, 'teoria', t('Il pianeta di Miller in «Interstellar»', 'Miller\'s planet in «Interstellar»'), t('Un\'ora sul pianeta pari a sette anni fuori vuol dire un fattore di circa 61 000. Attorno a un buco nero che non ruota non si ottiene con un\'orbita: sotto 3 r_s (l\'orbita circolare stabile più interna) non ci sono orbite stabili. Kip Thorne lo ha ottenuto con un buco nero che ruota quasi alla velocità massima permessa, dove l\'orbita stabile più interna scende vicino all\'orizzonte.', 'One hour on the planet for seven years outside means a factor of about 61 000. Around a non-rotating black hole no orbit gives it: below 3 r_s (the innermost stable circular orbit) there are no stable orbits. Kip Thorne obtained it with a black hole spinning close to the maximum allowed rate, where the innermost stable orbit comes down near the horizon.'));
    blocco(sotto, 'ipotesi', t('Wormhole e macchine del tempo', 'Wormholes and time machines'), t('Se una bocca di un wormhole attraversabile viene accelerata e riportata indietro, fra le bocche si crea uno sfasamento di tempo: il wormhole diventa una macchina del tempo verso il passato (Morris, Thorne e Yurtsever, 1988). Hawking (1992) ha proposto la congettura di protezione della cronologia: le fluttuazioni quantistiche diverrebbero infinite proprio quando la macchina sta per formarsi. Non è dimostrata, ma nessun calcolo l\'ha mai smentita.', 'If one mouth of a traversable wormhole is accelerated and brought back, a time offset appears between the mouths: the wormhole becomes a time machine to the past (Morris, Thorne and Yurtsever, 1988). Hawking (1992) proposed the chronology protection conjecture: quantum fluctuations would blow up just as the machine is about to form. It is not proven, but no calculation has ever disproved it.'));
    function disegna() {
      var B = corpo(k), rs = raggioSchwarzschild(B.M), r = fr * rs, d = dilatazione(B.M, r), xs = [], ys = [];
      for (var f = 1.005; f <= 10; f += 0.01) { xs.push(f); ys.push(Math.sqrt(1 - 1 / f)); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#ffd24a', larg: 2 }], punti: [{ x: fr, y: d, col: '#ffffff', r: 5 }], ymin: 0, ymax: 1, xl: ['r / r_s', 'r / r_s'], yl: ['dτ/dt', 'dτ/dt'] });
      info.innerHTML = '<div class="bsiFX-eq">dτ/dt = √(1 − r_s/r)</div>' +
        t('A ', 'At ') + fr.toFixed(2).replace('.', ',') + ' r_s (' + sci(r) + ' m) ' + t('un\'ora dell\'orologio fermo vale ', 'one hour of the static clock is ') + '<b class="bsiFX-num">' + (1 / d).toFixed(3).replace('.', ',') + t(' ore', ' hours') + '</b> ' + t('lontano', 'far away') + '.<br>' +
        (fr < 1.5 ? t('Sotto 1,5 r_s (la sfera dei fotoni) restare fermi richiede un razzo con una spinta enorme; chi orbita liberamente non scende sotto 3 r_s su un\'orbita stabile.', 'Below 1.5 r_s (the photon sphere) staying still needs a rocket with an enormous thrust; free orbits cannot stay stable below 3 r_s.') : t('A 3 r_s c\'è l\'orbita circolare stabile più interna, a 1,5 r_s la sfera dei fotoni.', 'At 3 r_s lies the innermost stable circular orbit, at 1.5 r_s the photon sphere.')) + '<br>' +
        '<small>' + t('Il fattore non dipende dalla massa del buco nero, solo dal rapporto r/r_s: per Sgr A* r_s vale ', 'The factor does not depend on the black hole\'s mass, only on r/r_s: for Sgr A* r_s is ') + sci(raggioSchwarzschild(4.297e6 * MSOLE) / 1e9) + t(' milioni di km', ' million km') + '.</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.calcolo.wormhole = { G: G, C: C, MSOLE: MSOLE, ANNO_LUCE: ANNO_LUCE, CORPI: CORPI, raggioSchwarzschild: raggioSchwarzschild, lunghezzaCurvatura: lunghezzaCurvatura, marea: marea, dilatazione: dilatazione, forma: forma, materia: materia, immersione: immersione, flamm: flamm, massaEsotica: massaEsotica, casimir: casimir };
  F.sezione('sastrowh', {
    titolo: ['🌀 Spaziotempo curvo e wormhole', '🌀 Curved spacetime and wormholes'],
    sotto: ['La gravità come curvatura e le equazioni di Einstein; quanto è curvo lo spaziotempo vicino a pianeti, stelle di neutroni e buchi neri; il wormhole di Morris e Thorne con il suo diagramma, la materia esotica che chiederebbe, l\'energia negativa che esiste davvero e il tempo che rallenta. Ogni affermazione dice se è misurata, teoria, ipotesi o speculazione.',
            'Gravity as curvature and Einstein\'s equations; how curved spacetime is near planets, neutron stars and black holes; the Morris–Thorne wormhole with its diagram, the exotic matter it would need, the negative energy that really exists and time slowing down. Every statement says whether it is measured, theory, hypothesis or speculation.'],
    schede: [
      { nome: ['Curvatura e maree', 'Curvature and tides'], costruisci: schedaCurvatura },
      { nome: ['Il wormhole', 'The wormhole'], costruisci: schedaWormhole },
      { nome: ['Energia negativa', 'Negative energy'], costruisci: schedaEnergia },
      { nome: ['Il tempo', 'Time'], costruisci: schedaTempo }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
