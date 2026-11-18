/* ═══════════════════════════════════════════════════════════════════════
   bsi-fis-spaccati.js — gli spaccati tecnici di fisica (v257, §5.2)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Lo standard della fisica del progetto (§5.2) è la tavola tecnica
   sezionata: lo spaccato con ogni parte etichettata da una linea guida, i
   flussi con spessore proporzionale e la grandezza scritta accanto, i campi
   calcolati, il bilancio che regge la figura e si aggiorna con i cursori,
   la vista di dettaglio. Dopo il motore (bsi-fis-motore.js) qui arrivano i
   tre esempi che il progetto stesso cita, ognuno come scheda della sua
   sezione:

   1. CIRCUITO A DUE MAGLIE («🔌 Circuiti») — due generatori e tre
      resistori risolti con Kirchhoff (teorema di Millman per il nodo):
        V_A = (E₁/R₁ + E₂/R₂)/(1/R₁ + 1/R₂ + 1/R₃), I₁ = (E₁ − V_A)/R₁, …
      Bilancio: I₁ + I₂ = I₃ al nodo, ΣE·I = ΣR·I². Dettaglio: la deriva
      degli elettroni nel rame, v_d = I/(n e A), n = 8,49·10²⁸ m⁻³.
   2. LASER Nd:YAG POMPATO A DIODO («🔦 Laser») — quattro livelli, pompa a
      808 nm, emissione a 1064 nm. Modello di soglia lineare (dichiarato):
        P_th = (T + L_i)/κ,  P_stim = η_ass·η_q·(P_p − P_th) sopra soglia,
        P_out = P_stim·T/(T + L_i),  η_q = 808/1064.
      Sopra soglia l'inversione resta ferma al valore di soglia (gain
      clamping). Bilancio: P_p = P_out + P_perdite + P_fluor+calore + P_non ass.
   3. GIUNZIONE p–n DI SILICIO («💡 Semiconduttori») — approssimazione di
      svuotamento (Sze, Physics of Semiconductor Devices):
        V_bi = (kT/q) ln(N_A N_D/n_i²),  W = √(2ε(V_bi − V)/q · (1/N_A + 1/N_D)),
        x_p N_A = x_n N_D,  E_max = q N_A x_p/ε,
        I = I₀ (e^(V/V_T) − 1),  J₀ = q n_i² (D_p/(L_p N_D) + D_n/(L_n N_A)).
      Il campo si ottiene INTEGRANDO l'equazione di Poisson sulla carica
      fissa, e il banco controlla che coincida con la formula chiusa.
   ═══════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI, D = globale.document;
  function num(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); }
  function sci(x, d) { if (x === 0) return '0'; var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); return num(m, d == null ? 2 : d) + '·10' + String(e).split('').map(function (c) { return c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }).join(''); }

  /* ═══ 0. GLI ATTREZZI DEL DISEGNO TECNICO ════════════════════════════════ */
  function freccia(q, x0, y0, x1, y1, w, col) {
    var a = Math.atan2(y1 - y0, x1 - x0), h = Math.max(9, w * 1.6);
    q.strokeStyle = col; q.fillStyle = col; q.lineWidth = w; q.lineCap = 'butt';
    q.beginPath(); q.moveTo(x0, y0); q.lineTo(x1 - Math.cos(a) * h * 0.8, y1 - Math.sin(a) * h * 0.8); q.stroke();
    q.beginPath(); q.moveTo(x1, y1); q.lineTo(x1 - Math.cos(a - 0.45) * h, y1 - Math.sin(a - 0.45) * h); q.lineTo(x1 - Math.cos(a + 0.45) * h, y1 - Math.sin(a + 0.45) * h); q.closePath(); q.fill();
  }
  function etichetta(q, testo, xp, yp, xt, yt) {
    q.strokeStyle = '#9fb3c8'; q.lineWidth = 1; q.beginPath(); q.moveTo(xp, yp); q.lineTo(xt, yt); q.stroke();
    q.fillStyle = '#9fb3c8'; q.beginPath(); q.arc(xp, yp, 2.2, 0, 2 * PI); q.fill();
    q.fillStyle = '#dbe8f5'; q.font = '12px system-ui,sans-serif'; q.textBaseline = 'middle'; var aSin = xt < xp; q.textAlign = aSin ? 'right' : 'left'; if (aSin && q.measureText(testo).width + 8 > xt) aSin = false, q.textAlign = 'left';   /* se a sinistra non ci sta, si scrive a destra */
    q.fillText(testo, xt + (aSin ? -4 : 4), yt); q.textAlign = 'left';
  }
  function riquadro(q, x, y, w, h, titolo) {
    q.fillStyle = 'rgba(10,22,40,.95)'; q.strokeStyle = '#1a3050'; q.lineWidth = 1; q.fillRect(x, y, w, h); q.strokeRect(x, y, w, h);
    q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; q.textBaseline = 'alphabetic'; q.fillText(titolo, x + 6, y + 12);
  }
  /** la tela, il pannello e il ciclo d'animazione comuni (fermo con «riduci movimento» e quando la scheda non si vede) */
  function impianto(div, aria) {
    var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G);
    var tela = F.el('canvas', { role: 'img', 'aria-label': aria, style: 'width:100%;display:block;border-radius:12px;background:#06111d' }); dx.appendChild(tela);
    var calmo = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      pan: pan, dx: dx, tela: tela, calmo: calmo,
      prepara: function (rapp) {
        var W = Math.max(300, dx.clientWidth || 600), H = Math.round(Math.min(560, Math.max(360, W * rapp))), dpr = Math.min(2, globale.devicePixelRatio || 1);
        tela.style.height = H + 'px'; if (tela.width !== W * dpr || tela.height !== H * dpr) { tela.width = W * dpr; tela.height = H * dpr; }
        var q = tela.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H); return { q: q, W: W, H: H };
      },
      anima: function (disegna) {
        var prec = 0, self = this;
        function giro(ora) {
          if (!tela.isConnected) return;
          if (tela.offsetParent === null) { prec = 0; setTimeout(function () { globale.requestAnimationFrame(giro); }, 500); return; }
          var dt = prec ? Math.min(0.05, (ora - prec) / 1000) : 0; prec = ora; disegna(dt); globale.requestAnimationFrame(giro);
        }
        disegna(0); F.alRidimensiona(function () { disegna(0); });
        if (!self.calmo) globale.requestAnimationFrame(giro);
      }
    };
  }

  /* ═══ 1. IL CIRCUITO A DUE MAGLIE ═══════════════════════════════════════ */
  var Q_E = 1.602176634e-19, N_CU = 8.49e28;
  /** p: { E1, E2, R1, R2, R3 } → correnti (verso convenzionale: I₁ e I₂ salgono verso il nodo A, I₃ scende in R₃) */
  function circuito(p) {
    var VA = (p.E1 / p.R1 + p.E2 / p.R2) / (1 / p.R1 + 1 / p.R2 + 1 / p.R3), I1 = (p.E1 - VA) / p.R1, I2 = (p.E2 - VA) / p.R2, I3 = VA / p.R3;
    var Pgen = p.E1 * I1 + p.E2 * I2, Pdis = I1 * I1 * p.R1 + I2 * I2 * p.R2 + I3 * I3 * p.R3;
    return { VA: VA, I1: I1, I2: I2, I3: I3, Pgen: Pgen, Pdis: Pdis, P1: p.E1 * I1, P2: p.E2 * I2, nodo: I1 + I2 - I3, maglia1: p.E1 - I1 * p.R1 - I3 * p.R3, maglia2: p.E2 - I2 * p.R2 - I3 * p.R3 };
  }
  /** velocità di deriva in un filo di rame di sezione A (m²) */
  function deriva(I, A) { return I / (N_CU * Q_E * A); }
  /** le fasce del codice colori (due cifre e moltiplicatore) per un valore in ohm */
  var COLORI_R = ['#111', '#7a4a1e', '#d22', '#f08a24', '#f3d21b', '#2fa84f', '#2f6fd8', '#8a45c9', '#888', '#eee'];
  function fasce(R) { var e = Math.floor(Math.log10(R)) - 1, m = Math.round(R / Math.pow(10, e)); if (m >= 100) { m = Math.round(m / 10); e++; } return [Math.floor(m / 10), m % 10, Math.max(0, e)]; }

  function schedaCircuito(div) {
    var I = impianto(div, t('Spaccato del circuito a due maglie: due generatori, tre resistori, le correnti nei rami e il nodo', 'Cutaway of the two-loop circuit: two sources, three resistors, the branch currents and the node'));
    var p = { E1: 12, E2: 6, R1: 2, R2: 4, R3: 10 }, M = circuito(p), fase = [0, 0, 0], fdet = 0, elettroni = [];
    for (var k = 0; k < 26; k++) elettroni.push([Math.random(), Math.random()]);
    F.cursore(I.pan, ['Generatore E₁ (V)', 'Source E₁ (V)'], 0, 24, 0.5, p.E1, function (v) { p.E1 = v; M = circuito(p); disegna(0); }, function (v) { return num(v, 1) + ' V'; });
    F.cursore(I.pan, ['Generatore E₂ (V)', 'Source E₂ (V)'], 0, 24, 0.5, p.E2, function (v) { p.E2 = v; M = circuito(p); disegna(0); }, function (v) { return num(v, 1) + ' V'; });
    F.cursore(I.pan, ['R₁ (Ω)', 'R₁ (Ω)'], 1, 47, 1, p.R1, function (v) { p.R1 = v; M = circuito(p); disegna(0); }, function (v) { return v + ' Ω'; });
    F.cursore(I.pan, ['R₂ (Ω)', 'R₂ (Ω)'], 1, 47, 1, p.R2, function (v) { p.R2 = v; M = circuito(p); disegna(0); }, function (v) { return v + ' Ω'; });
    F.cursore(I.pan, ['R₃, il carico (Ω)', 'R₃, the load (Ω)'], 1, 100, 1, p.R3, function (v) { p.R3 = v; M = circuito(p); disegna(0); }, function (v) { return v + ' Ω'; });
    var bil = F.el('div', { 'class': 'bsiFX-nota', 'aria-live': 'polite' }); I.pan.appendChild(bil);
    function resistore(q, x, y, vert, R, nome) {
      var L = 46, s = 14; q.save(); q.translate(x, y); if (vert) q.rotate(PI / 2);
      q.fillStyle = '#d9c7a0'; q.strokeStyle = '#8c7a55'; q.lineWidth = 1; q.beginPath(); q.moveTo(-L / 2 + 6, -s / 2); q.lineTo(L / 2 - 6, -s / 2); q.quadraticCurveTo(L / 2, -s / 2, L / 2, 0); q.quadraticCurveTo(L / 2, s / 2, L / 2 - 6, s / 2); q.lineTo(-L / 2 + 6, s / 2); q.quadraticCurveTo(-L / 2, s / 2, -L / 2, 0); q.quadraticCurveTo(-L / 2, -s / 2, -L / 2 + 6, -s / 2); q.fill(); q.stroke();
      var f = fasce(R); [f[0], f[1], f[2]].forEach(function (c, i) { q.fillStyle = COLORI_R[c]; q.fillRect(-14 + i * 8, -s / 2, 4, s); }); q.fillStyle = '#c9a227'; q.fillRect(12, -s / 2, 3, s);
      q.restore();
      q.fillStyle = '#dbe8f5'; q.font = '700 12px system-ui,sans-serif'; q.textBaseline = 'middle'; var aDx = x > q.canvas.clientWidth * 0.7 && q.canvas.clientWidth < 520; q.textAlign = aDx ? 'right' : 'left'; q.fillText(nome + ' = ' + R + ' Ω', aDx ? x - 14 : x + (vert ? 14 : -22), y + (vert ? 0 : -16)); q.textAlign = 'left';   /* il ramo destro scrive a sinistra: sul telefono non esce dalla tela */
    }
    function pila(q, x, y, E, nome) {
      /* in spaccato: il bicchiere, la colonna catodica e la pasta; sopra il simbolo con le due piastre */
      q.fillStyle = '#1e2c3c'; q.fillRect(x - 15, y - 26, 30, 52); q.fillStyle = '#3d5a78'; q.fillRect(x - 12, y - 23, 24, 46); q.fillStyle = '#4b4b4b'; q.fillRect(x - 3, y - 20, 6, 40);
      q.fillStyle = '#c9d6e3'; q.fillRect(x - 6, y - 31, 12, 5);
      q.fillStyle = '#ffb27a'; q.font = '700 13px system-ui,sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('+', x + 22, y - 22); q.fillText('−', x + 22, y + 22); q.textAlign = 'left';
      q.fillStyle = '#dbe8f5'; q.font = '700 12px system-ui,sans-serif'; var aDx2 = x > q.canvas.clientWidth * 0.7 && q.canvas.clientWidth < 520; q.textAlign = aDx2 ? 'right' : 'left'; q.fillText(nome + ' = ' + num(E, 1) + ' V', aDx2 ? x - 22 : x + 30, y); q.textAlign = 'left';
    }
    function scorri(q, pts, I, ph, col) {
      /* cariche (verso convenzionale) che corrono lungo il ramo: velocità e densità proporzionali a |I| */
      if (Math.abs(I) < 1e-4) return; var Lt = 0, seg = []; for (var i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); Lt += l; }
      var passo = 22, n = Math.floor(Lt / passo); q.fillStyle = col;
      for (var k2 = 0; k2 < n; k2++) { var s = ((k2 * passo + (I > 0 ? ph : -ph)) % Lt + Lt) % Lt, j = 0; while (j < seg.length - 1 && s > seg[j]) { s -= seg[j]; j++; } var u = s / seg[j], x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u; q.beginPath(); q.arc(x, y, 2.6, 0, 2 * PI); q.fill(); }
    }
    function disegna(dt) {
      var c = I.prepara(0.74), q = c.q, W = c.W, H = c.H, piccolo = W < 520;
      var x1 = W * (piccolo ? 0.12 : 0.16), x2 = W * (piccolo ? 0.5 : 0.48), x3 = W * (piccolo ? 0.86 : 0.8), yT = H * 0.2, yB = H * 0.84;
      fase[0] += dt * 60 * M.I1; fase[1] += dt * 60 * M.I2; fase[2] += dt * 60 * M.I3;
      /* i fili */
      q.strokeStyle = '#b87333'; q.lineWidth = 4; q.lineJoin = 'round';
      q.beginPath(); q.moveTo(x1, yB); q.lineTo(x1, yT); q.lineTo(x3, yT); q.lineTo(x3, yB); q.lineTo(x1, yB); q.moveTo(x2, yT); q.lineTo(x2, yB); q.stroke();
      /* i nodi */
      q.fillStyle = '#ffd24a'; [[x2, yT], [x2, yB]].forEach(function (n) { q.beginPath(); q.arc(n[0], n[1], 5, 0, 2 * PI); q.fill(); });
      q.fillStyle = '#ffd24a'; q.font = '700 12px system-ui,sans-serif'; q.textAlign = 'center'; q.textBaseline = 'alphabetic'; q.fillText('A', x2, yT - 9); q.fillText('B', x2, yB + 17); q.textAlign = 'left';
      /* le cariche in moto: ramo 1 sale a sinistra e va verso A, ramo 2 sale a destra e va verso A, ramo 3 scende da A a B */
      scorri(q, [[x1, yB], [x1, yT], [x2, yT]], M.I1, fase[0], 'rgba(255,214,120,.95)');
      scorri(q, [[x3, yB], [x3, yT], [x2, yT]], M.I2, fase[1], 'rgba(255,214,120,.95)');
      scorri(q, [[x2, yT], [x2, yB]], M.I3, fase[2], 'rgba(255,214,120,.95)');
      scorri(q, [[x2, yB], [x1, yB]], M.I1, fase[0], 'rgba(255,214,120,.95)');
      scorri(q, [[x2, yB], [x3, yB]], M.I2, fase[1], 'rgba(255,214,120,.95)');
      /* i componenti */
      pila(q, x1, H * 0.62, p.E1, 'E₁'); pila(q, x3, H * 0.62, p.E2, 'E₂');
      resistore(q, x1, H * 0.36, true, p.R1, 'R₁'); resistore(q, x3, H * 0.36, true, p.R2, 'R₂'); resistore(q, x2, H * 0.52, true, p.R3, 'R₃');
      /* le frecce della corrente: spessore proporzionale a |I| */
      var Imax = Math.max(Math.abs(M.I1), Math.abs(M.I2), Math.abs(M.I3), 0.05), sc = (piccolo ? 9 : 13) / Imax;
      function fr(I0, xa, ya, xb, yb, nome, xt, yt) { if (Math.abs(I0) < 5e-4) return; var w = Math.max(2, Math.abs(I0) * sc); if (I0 > 0) freccia(q, xa, ya, xb, yb, w, 'rgba(94,234,212,.9)'); else freccia(q, xb, yb, xa, ya, w, 'rgba(255,120,120,.9)'); q.fillStyle = '#5eead4'; q.font = '700 12px system-ui,sans-serif'; q.textBaseline = 'middle'; q.fillText(nome + ' = ' + num(Math.abs(I0), 2) + ' A', xt, yt); }
      fr(M.I1, x1 + (x2 - x1) * 0.25, yT - 18, x1 + (x2 - x1) * 0.6, yT - 18, 'I₁', x1 + 4, yT - 34);
      fr(M.I2, x3 - (x3 - x2) * 0.25, yT - 18, x3 - (x3 - x2) * 0.6, yT - 18, 'I₂', x3 - (x3 - x2) * 0.62, yT - 34);
      fr(M.I3, x2 - 20, H * 0.64, x2 - 20, H * 0.76, 'I₃', x2 + 10, H * 0.7);
      /* le etichette */
      if (!piccolo) {
        etichetta(q, t('pila in sezione', 'cell in section'), x1 - 12, H * 0.62 + 18, x1 + 34, H * 0.76);
        etichetta(q, t('resistore a strato, codice colori', 'film resistor, colour code'), x2 + 5, H * 0.52 - 18, x2 + 40, H * 0.44);
        etichetta(q, t('filo di rame', 'copper wire'), x1 + (x2 - x1) * 0.55, yB, x1 + (x2 - x1) * 0.62, yB - 20);
      }
      /* la vista di dettaglio: la deriva degli elettroni in un filo da 1 mm² */
      var ix = x2 + 90, iw = x3 - 40 - ix, iy = H * 0.6, ih = Math.min(96, yB - 22 - iy), vd = deriva(Math.abs(M.I3), 1e-6);
      if (!piccolo) { riquadro(q, ix, iy, iw, ih, t('dettaglio: il filo di R₃, 1 mm² di rame', 'detail: the R₃ wire, 1 mm² of copper'));
        q.fillStyle = '#5a3a1e'; q.fillRect(ix + 8, iy + 18, iw - 16, ih - 46);
        fdet += dt; elettroni.forEach(function (e) { e[0] = (e[0] - dt * 0.05 * Math.sign(M.I3 || 0) + 1) % 1; var x = ix + 10 + e[0] * (iw - 20), y = iy + 21 + e[1] * (ih - 52) + Math.sin(fdet * 9 + e[1] * 40) * 2; q.fillStyle = '#7fd0ff'; q.beginPath(); q.arc(x, y, 2, 0, 2 * PI); q.fill(); });
        q.fillStyle = '#dbe8f5'; q.font = '10px system-ui,sans-serif'; q.fillText('v_d = I/(n e A) = ' + num(vd * 1000, 3) + ' mm/s', ix + 6, iy + ih - 17); q.fillText(t('elettroni: verso opposto a I', 'electrons: opposite to I'), ix + 6, iy + ih - 5); }
      q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; q.textBaseline = 'top'; q.fillText(t('punti gialli: verso convenzionale della corrente, velocità ∝ |I| (rallentata, non in scala)', 'yellow dots: conventional current direction, speed ∝ |I| (slowed, not to scale)'), 8, 6);
      /* il bilancio */
      bil.innerHTML = '<div class="bsiFX-eq">' + t('nodo A', 'node A') + ': I₁ + I₂ = I₃</div><b class="bsiFX-num">' + num(M.I1, 3) + ' + ' + num(M.I2, 3) + ' = ' + num(M.I3, 3) + ' A</b><br>' +
        t('Maglia sinistra', 'Left loop') + ': E₁ − R₁I₁ − R₃I₃ = <b class="bsiFX-num">' + num(Math.abs(M.maglia1) < 5e-10 ? 0 : M.maglia1, 3) + ' V</b> · ' + t('destra', 'right') + ': E₂ − R₂I₂ − R₃I₃ = <b class="bsiFX-num">' + num(Math.abs(M.maglia2) < 5e-10 ? 0 : M.maglia2, 3) + ' V</b><br>' +
        t('Potenza erogata ', 'Power delivered ') + 'E₁I₁ + E₂I₂ = <b class="bsiFX-num">' + num(M.Pgen, 2) + ' W</b> = ' + t('dissipata ', 'dissipated ') + 'ΣRI² = <b class="bsiFX-num">' + num(M.Pdis, 2) + ' W</b><br>' +
        'V_A − V_B = <b class="bsiFX-num">' + num(M.VA, 2) + ' V</b>' + (M.P1 < 0 ? ' · ' + t('E₁ assorbe ' + num(-M.P1, 2) + ' W: si sta ricaricando', 'E₁ absorbs ' + num(-M.P1, 2) + ' W: it is being charged') : '') + (M.P2 < 0 ? ' · ' + t('E₂ assorbe ' + num(-M.P2, 2) + ' W: si sta ricaricando', 'E₂ absorbs ' + num(-M.P2, 2) + ' W: it is being charged') : '') +
        '<br><small>' + t('Generatori ideali (resistenza interna nella R del ramo), fili senza resistenza. Deriva con n = 8,49·10²⁸ elettroni/m³: pochi centesimi di millimetro al secondo, mentre il segnale viaggia quasi alla velocità della luce.', 'Ideal sources (internal resistance inside the branch R), resistance-free wires. Drift with n = 8.49·10²⁸ electrons/m³: a few hundredths of a millimetre per second, while the signal travels at nearly the speed of light.') + '</small>';
    }
    I.anima(disegna);
    div._spaccato = { calcolo: function () { return circuito(p); }, p: p };
  }

  /* ═══ 2. IL LASER Nd:YAG POMPATO A DIODO ════════════════════════════════ */
  var LASER = { etaAss: 0.9, lp: 808, ll: 1064, kappa: 0.025 };
  /** p: { Pp (W), T (frazione), Li (frazione) } */
  function laser(p) {
    var etaQ = LASER.lp / LASER.ll, Pth = (p.T + p.Li) / LASER.kappa, sopra = Math.max(0, p.Pp - Pth), Pass = LASER.etaAss * p.Pp;
    var Pstim = LASER.etaAss * etaQ * sopra, Pout = Pstim * p.T / (p.T + p.Li), Pint = Pstim * p.Li / (p.T + p.Li), Pcal = Pass - Pstim, Pnon = p.Pp - Pass;
    return { etaQ: etaQ, Pth: Pth, Pout: Pout, Pint: Pint, Pcal: Pcal, Pnon: Pnon, Pass: Pass, Pcirc: p.T > 0 ? Pout / p.T : 0, pendenza: LASER.etaAss * etaQ * p.T / (p.T + p.Li), inversione: Math.min(1, p.Pp / Pth), somma: Pout + Pint + Pcal + Pnon };
  }
  function schedaLaser(div) {
    var I = impianto(div, t('Spaccato di un laser Nd:YAG pompato a diodo: specchi, barretta, diodi di pompa, fascio nella cavità e in uscita', 'Cutaway of a diode-pumped Nd:YAG laser: mirrors, rod, pump diodes, beam in the cavity and at the output'));
    var p = { Pp: 10, T: 0.05, Li: 0.02 }, M = laser(p), ph = 0, ioni = [];
    for (var k = 0; k < 90; k++) ioni.push([Math.random(), Math.random(), Math.random()]);
    F.cursore(I.pan, ['Potenza di pompa P_p (W)', 'Pump power P_p (W)'], 0, 20, 0.25, p.Pp, function (v) { p.Pp = v; M = laser(p); disegna(0); }, function (v) { return num(v, 2) + ' W'; });
    F.cursore(I.pan, ['Trasmissione dello specchio d\'uscita T (%)', 'Output coupler transmission T (%)'], 1, 20, 0.5, p.T * 100, function (v) { p.T = v / 100; M = laser(p); disegna(0); }, function (v) { return num(v, 1) + ' %'; });
    F.cursore(I.pan, ['Perdite interne per giro L_i (%)', 'Internal round-trip loss L_i (%)'], 0.5, 10, 0.5, p.Li * 100, function (v) { p.Li = v / 100; M = laser(p); disegna(0); }, function (v) { return num(v, 1) + ' %'; });
    var bil = F.el('div', { 'class': 'bsiFX-nota', 'aria-live': 'polite' }); I.pan.appendChild(bil);
    function disegna(dt) {
      var c = I.prepara(0.66), q = c.q, W = c.W, H = c.H, piccolo = W < 520; ph += dt;
      var xA = W * 0.1, xB = W * (piccolo ? 0.82 : 0.7), yC = H * 0.42, rodL = (xB - xA) * 0.46, rodH = Math.max(26, H * 0.08), xr = (xA + xB) / 2 - rodL / 2;
      /* il banco ottico */
      q.fillStyle = '#152435'; q.fillRect(xA - 20, yC + rodH * 1.9, xB - xA + 40, 10);
      /* il fascio nella cavità: spessore ∝ potenza circolante (scala log), onda stazionaria */
      var wC = M.Pcirc > 0 ? Math.min(rodH * 0.8, 3 + 5 * Math.log10(1 + M.Pcirc)) : 0;
      if (wC > 0) { var g = q.createLinearGradient(0, yC - wC, 0, yC + wC); g.addColorStop(0, 'rgba(255,60,60,0)'); g.addColorStop(0.5, 'rgba(255,70,70,.75)'); g.addColorStop(1, 'rgba(255,60,60,0)'); q.fillStyle = g; q.fillRect(xA, yC - wC, xB - xA, 2 * wC);
        q.strokeStyle = 'rgba(255,190,190,.55)'; q.lineWidth = 1; q.beginPath(); for (var x = xA; x <= xB; x += 2) { var y = yC + Math.sin((x - xA) * 0.35) * wC * 0.55 * Math.cos(ph * 6); if (x === xA) q.moveTo(x, y); else q.lineTo(x, y); } q.stroke(); }
      /* la barretta di Nd:YAG in sezione, con gli ioni: eccitati (chiari) e a terra (scuri); sopra soglia l'inversione resta ferma */
      q.fillStyle = 'rgba(190,120,200,.35)'; q.strokeStyle = '#c9a0d6'; q.lineWidth = 1.2; q.fillRect(xr, yC - rodH / 2, rodL, rodH); q.strokeRect(xr, yC - rodH / 2, rodL, rodH);
      ioni.forEach(function (o) { var ecc = o[2] < M.inversione * 0.62; q.fillStyle = ecc ? '#ffe28a' : '#6b4f78'; q.beginPath(); q.arc(xr + 4 + o[0] * (rodL - 8), yC - rodH / 2 + 3 + o[1] * (rodH - 6), ecc ? 1.9 : 1.4, 0, 2 * PI); q.fill(); });
      /* gli specchi: alto riflettente a sinistra (curvo), d'uscita a destra */
      q.strokeStyle = '#c9d6e3'; q.lineWidth = 5; q.beginPath(); q.arc(xA + 30, yC, 34, PI * 0.82, PI * 1.18); q.stroke();
      q.fillStyle = '#7f95ad'; q.fillRect(xA - 14, yC - 34, 8, 68);
      q.strokeStyle = 'rgba(200,225,255,.85)'; q.lineWidth = 4; q.beginPath(); q.moveTo(xB, yC - 30); q.lineTo(xB, yC + 30); q.stroke(); q.fillStyle = '#7f95ad'; q.fillRect(xB + 4, yC - 34, 8, 12); q.fillRect(xB + 4, yC + 22, 8, 12);
      /* i diodi di pompa sotto la barretta: frecce a 808 nm, spessore ∝ P_p */
      var wP = Math.max(1.5, p.Pp * (piccolo ? 0.6 : 0.9)), nD = 3;
      for (var d = 0; d < nD; d++) { var xd = xr + rodL * (d + 0.5) / nD; q.fillStyle = '#2b3d52'; q.fillRect(xd - 14, yC + rodH * 1.3, 28, 12); q.fillStyle = '#ffcf5a'; q.fillRect(xd - 10, yC + rodH * 1.3 - 2, 20, 3); if (p.Pp > 0) freccia(q, xd, yC + rodH * 1.3 - 4, xd, yC + rodH / 2 + 3, wP / 2, 'rgba(200,40,40,.85)'); }
      /* il fascio d'uscita e il calore */
      var wO = M.Pout > 0 ? Math.max(2, M.Pout * (piccolo ? 1.8 : 2.6)) : 0;
      if (wO) { freccia(q, xB + 14, yC, W - 10, yC, wO, 'rgba(255,80,80,.9)'); q.fillStyle = '#ff9c9c'; q.font = '700 12px system-ui,sans-serif'; q.textBaseline = 'alphabetic'; q.textAlign = 'right'; q.fillText('P_out = ' + num(M.Pout, 2) + ' W · 1064 nm', W - 10, piccolo ? yC + wO / 2 + 40 : yC - wO / 2 - 8); q.textAlign = 'left'; }
      if (M.Pcal > 0) { var wH = Math.max(1.5, M.Pcal * (piccolo ? 0.7 : 1)); freccia(q, xr + rodL * 0.5, yC - rodH / 2 - 4, xr + rodL * 0.5, yC - rodH / 2 - 44, wH, 'rgba(255,150,60,.85)'); q.fillStyle = '#ffb27a'; q.font = '700 12px system-ui,sans-serif'; q.fillText(t('calore + fluorescenza ', 'heat + fluorescence ') + num(M.Pcal, 2) + ' W', xr + rodL * 0.5 + 10, yC - rodH / 2 - 34); }
      q.fillStyle = '#ff8a8a'; q.font = '700 12px system-ui,sans-serif'; q.fillText('P_p = ' + num(p.Pp, 2) + ' W · 808 nm', xr, yC + rodH * 1.3 + 30);
      /* le etichette */
      if (!piccolo) {
        etichetta(q, t('specchio alto riflettente (R ≈ 99,9 %)', 'high reflector (R ≈ 99.9 %)'), xA - 10, yC - 30, xA + 10, H * 0.12);
        etichetta(q, t('specchio d\'uscita (T = ', 'output coupler (T = ') + num(p.T * 100, 1) + ' %)', xB, yC - 26, xB - 30, H * 0.12);
        etichetta(q, t('barretta di Nd:YAG, ioni eccitati in giallo', 'Nd:YAG rod, excited ions in yellow'), xr + rodL * 0.12, yC + rodH / 2 - 2, xr + rodL * 0.12 - 20, H * 0.86);
        etichetta(q, t('diodi laser di pompa', 'pump laser diodes'), xr + rodL * 0.83 + 14, yC + rodH * 1.3 + 6, xr + rodL + 30, H * 0.78);
      }
      /* la vista di dettaglio: i quattro livelli del neodimio */
      var iw = piccolo ? W * 0.5 : W * 0.24, ih = piccolo ? 110 : 150, ix = piccolo ? 8 : W - iw - 8, iy = piccolo ? H - ih - 6 : H * 0.6;   /* sul telefono a sinistra: a destra ci sono i pulsanti flottanti */
      riquadro(q, ix, iy, iw, ih, t('dettaglio: i quattro livelli di Nd³⁺', 'detail: the four levels of Nd³⁺'));
      var lv = [[0.88, '⁴I₉/₂'], [0.66, '⁴I₁₁/₂'], [0.3, '⁴F₃/₂'], [0.2, '⁴F₅/₂']], lx0 = ix + 14, lx1 = ix + iw * 0.6;
      q.strokeStyle = '#c9d6e3'; q.lineWidth = 2; q.font = '10px system-ui,sans-serif'; q.textBaseline = 'middle';
      lv.forEach(function (l) { var y = iy + ih * l[0]; q.beginPath(); q.moveTo(lx0, y); q.lineTo(lx1, y); q.stroke(); q.fillStyle = '#9fb3c8'; q.fillText(l[1], lx1 + 4, y); });
      var yG = iy + ih * 0.88, yU = iy + ih * 0.3, yL = iy + ih * 0.66, yP = iy + ih * 0.2;
      freccia(q, lx0 + 10, yG - 2, lx0 + 10, yP + 2, 2, 'rgba(200,40,40,.9)');
      q.setLineDash([3, 3]); freccia(q, lx0 + 22, yP + 2, lx0 + 22, yU - 2, 1.2, '#9fb3c8'); freccia(q, lx0 + 46, yL + 2, lx0 + 46, yG - 2, 1.2, '#9fb3c8'); q.setLineDash([]);
      if (M.Pout > 0) freccia(q, lx0 + 34, yU + 2, lx0 + 34, yL - 2, 2.4, 'rgba(255,80,80,.95)');
      /* popolazione del livello alto: cresce con la pompa fino alla soglia, poi resta ferma */
      q.fillStyle = 'rgba(255,226,138,.85)'; q.fillRect(lx0 + 54, yU - 4, (lx1 - lx0 - 58) * M.inversione, 4);
      q.fillStyle = '#9fb3c8'; q.font = '9px system-ui,sans-serif'; q.textBaseline = 'alphabetic'; q.fillText('808', lx0 + 1, iy + ih * 0.55); q.fillText('1064', lx0 + 26, iy + ih * 0.5);
      q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; q.textBaseline = 'top'; q.fillText(t('larghezza dei fasci ∝ potenza (in cavità: scala logaritmica) · MODELLO a soglia lineare', 'beam widths ∝ power (in the cavity: log scale) · linear threshold MODEL'), 8, 6);
      /* il bilancio */
      bil.innerHTML = '<div class="bsiFX-eq">P_p = P_out + P_perdite + P_calore + P_non ass.</div><b class="bsiFX-num">' + num(p.Pp, 2) + ' W = ' + num(M.Pout, 2) + ' + ' + num(M.Pint, 2) + ' + ' + num(M.Pcal, 2) + ' + ' + num(M.Pnon, 2) + ' W</b><br>' +
        t('Soglia ', 'Threshold ') + '<b class="bsiFX-num">P_th = (T + L_i)/κ = ' + num(M.Pth, 2) + ' W</b>' + (p.Pp < M.Pth ? ' · ' + t('sotto soglia: niente fascio, solo fluorescenza', 'below threshold: no beam, only fluorescence') : '') + '<br>' +
        t('Efficienza differenziale ', 'Slope efficiency ') + '<b class="bsiFX-num">η_s = ' + num(M.pendenza * 100, 1) + ' %</b> = η_ass·η_q·T/(T + L_i), ' + t('con il difetto quantico ', 'with quantum defect ') + 'η_q = 808/1064 = ' + num(M.etaQ, 3) + '<br>' +
        t('Potenza che circola nella cavità ', 'Power circulating in the cavity ') + '<b class="bsiFX-num">' + num(M.Pcirc, 1) + ' W</b> = P_out/T' +
        '<br><small>' + t('Modello a soglia lineare (fascio e pompa uniformi, η_ass = 0,90, κ = 0,025 W⁻¹ tipico di un Nd:YAG pompato in testa): un laser vero si scosta per lente termica e sovrapposizione dei modi.', 'Linear threshold model (uniform beam and pump, η_abs = 0.90, κ = 0.025 W⁻¹ typical of an end-pumped Nd:YAG): a real laser deviates through thermal lensing and mode overlap.') + '</small>';
    }
    I.anima(disegna);
    div._spaccato = { calcolo: function () { return laser(p); }, p: p };
  }

  /* ═══ 3. LA GIUNZIONE p–n DI SILICIO ═════════════════════════════════════ */
  var KT_Q = 0.025852, EPS_SI = 11.7 * 8.8541878128e-12, NI = 1.0e16, SI = { Dn: 36e-4, Dp: 12e-4, tau: 1e-6 };   /* n_i = 1,0·10¹⁰ cm⁻³ a 300 K; SI */
  /** Na, Nd in m⁻³, V in volt, area A in m² */
  function giunzione(Na, Nd, V, A) {
    var Vbi = KT_Q * Math.log(Na * Nd / (NI * NI)), Vv = Math.min(V, Vbi - 0.05), W = Math.sqrt(2 * EPS_SI * (Vbi - Vv) / Q_E * (1 / Na + 1 / Nd)), xp = W * Nd / (Na + Nd), xn = W * Na / (Na + Nd);
    var Emax = Q_E * Na * xp / EPS_SI, Ln = Math.sqrt(SI.Dn * SI.tau), Lp = Math.sqrt(SI.Dp * SI.tau), J0 = Q_E * NI * NI * (SI.Dp / (Lp * Nd) + SI.Dn / (Ln * Na)), I0 = J0 * (A || 1e-6), Icorr = I0 * (Math.exp(V / KT_Q) - 1);
    return { Vbi: Vbi, V: Vv, W: W, xp: xp, xn: xn, Emax: Emax, I0: I0, I: Icorr, limitata: V > Vbi - 0.05 };
  }
  /** il campo E(x) integrando Poisson dE/dx = ρ/ε sulla carica fissa (−qNa in [−xp,0], +qNd in [0,xn]); restituisce i campioni e il potenziale */
  function campoPoisson(G, Na, Nd, n) {
    /* due griglie, una per lato, che si toccano esattamente in x = 0: con una griglia sola la zona p di una giunzione
       molto asimmetrica cadeva in pochi passi e l'integrale sbagliava dell'1 % */
    n = n || 400; var m = n / 2, E = [0], V = [0], X = [-G.xp];
    [[-G.xp, 0, -Q_E * Na], [0, G.xn, Q_E * Nd]].forEach(function (lato) {
      var h = (lato[1] - lato[0]) / m;
      for (var i = 1; i <= m; i++) { var k = E.length; E.push(E[k - 1] + lato[2] / EPS_SI * h); X.push(lato[0] + i * h); V.push(V[k - 1] - (E[k - 1] + E[k]) / 2 * h); }
    });
    n = E.length - 1; var Emin = Math.min.apply(null, E);
    return { X: X, E: E, V: V, Emax: -Emin, dV: V[n] - V[0] };
  }
  function schedaGiunzione(div) {
    var I = impianto(div, t('Spaccato di un diodo a giunzione p–n di silicio: zona p, zona di svuotamento con le cariche fisse e il campo, zona n, contatti', 'Cutaway of a silicon p–n junction diode: p region, depletion region with fixed charges and field, n region, contacts'));
    var p = { lNa: 16, lNd: 16.5, V: 0 }, ph = 0, port = [];
    for (var k = 0; k < 70; k++) port.push([Math.random(), Math.random(), k % 2]);
    function G() { return giunzione(Math.pow(10, p.lNa) * 1e6, Math.pow(10, p.lNd) * 1e6, p.V, 1e-6); }
    F.cursore(I.pan, ['Drogaggio p: log₁₀ N_A (cm⁻³)', 'p doping: log₁₀ N_A (cm⁻³)'], 14, 18, 0.1, p.lNa, function (v) { p.lNa = v; disegna(0); }, function (v) { return num(v, 1); });
    F.cursore(I.pan, ['Drogaggio n: log₁₀ N_D (cm⁻³)', 'n doping: log₁₀ N_D (cm⁻³)'], 14, 18, 0.1, p.lNd, function (v) { p.lNd = v; disegna(0); }, function (v) { return num(v, 1); });
    F.cursore(I.pan, ['Tensione applicata V (V)', 'Applied voltage V (V)'], -5, 0.75, 0.01, p.V, function (v) { p.V = v; disegna(0); }, function (v) { return num(v, 2) + ' V'; });
    var bil = F.el('div', { 'class': 'bsiFX-nota', 'aria-live': 'polite' }); I.pan.appendChild(bil);
    function disegna(dt) {
      var c = I.prepara((I.dx.clientWidth || 600) < 520 ? 1.1 : 0.7), q = c.q, W = c.W, H = c.H, piccolo = W < 520, g = G(), Na = Math.pow(10, p.lNa) * 1e6, Nd = Math.pow(10, p.lNd) * 1e6, P = campoPoisson(g, Na, Nd, 300);
      ph += dt;
      /* scala: la barra rappresenta max(4W, 1 µm), con la barra di scala */
      var x0 = W * 0.08, x1 = W * 0.92, yT = H * 0.3, yB = H * 0.62, span = Math.max(4 * g.W, 1e-6), kx = (x1 - x0) / span, xj = (x0 + x1) / 2 + (g.xn - g.xp) / 2 * kx * 0, xL = xj - g.xp * kx, xR = xj + g.xn * kx;
      q.fillStyle = 'rgba(255,120,150,.28)'; q.fillRect(x0, yT, xL - x0, yB - yT);
      q.fillStyle = 'rgba(110,160,255,.28)'; q.fillRect(xR, yT, x1 - xR, yB - yT);
      q.fillStyle = 'rgba(200,210,230,.10)'; q.fillRect(xL, yT, xR - xL, yB - yT);
      q.strokeStyle = '#4a6078'; q.lineWidth = 1; q.strokeRect(x0, yT, x1 - x0, yB - yT); q.setLineDash([4, 3]); q.beginPath(); q.moveTo(xL, yT); q.lineTo(xL, yB); q.moveTo(xR, yT); q.lineTo(xR, yB); q.stroke(); q.setLineDash([]);
      /* contatti metallici */
      q.fillStyle = '#9aa8b8'; q.fillRect(x0 - 12, yT - 6, 12, yB - yT + 12); q.fillRect(x1, yT - 6, 12, yB - yT + 12);
      /* cariche fisse nella zona di svuotamento: accettori ionizzati (−) a sinistra, donori (+) a destra */
      q.font = '700 11px system-ui,sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle';
      var righe = 4; for (var r = 0; r < righe; r++) { var y = yT + (yB - yT) * (r + 0.5) / righe; for (var xx = xL + 7; xx < xj - 3; xx += 14) { q.fillStyle = '#ff8aa0'; q.fillText('⊖', xx, y); } for (xx = xj + 7; xx < xR - 3; xx += 14) { q.fillStyle = '#8fb0ff'; q.fillText('⊕', xx, y); } }
      /* portatori mobili: lacune nella zona p, elettroni nella zona n; con la polarizzazione diretta attraversano la giunzione */
      var fl = Math.max(-1, Math.min(1, Math.sign(g.I) * Math.log10(1 + Math.abs(g.I) / 1e-12) / 10));
      port.forEach(function (o) {
        var lac = o[2] === 0, dentro = lac ? (x0 + 4 + o[0] * (xL - x0 - 8)) : (xR + 4 + o[0] * (x1 - xR - 8));
        if (!I.calmo && fl > 0.05) { o[0] = (o[0] + dt * 0.25 * fl) % 1; }
        var x = dentro, y = yT + 6 + o[1] * (yB - yT - 12) + Math.sin(ph * 5 + o[1] * 30) * 1.5;
        q.fillStyle = lac ? '#ffc0cc' : '#bcd0ff'; q.beginPath(); q.arc(x, y, 3.4, 0, 2 * PI); q.fill(); q.fillStyle = '#06111d'; q.fillText(lac ? '+' : '−', x, y + 0.5);
      });
      q.textAlign = 'left';
      /* il campo: frecce da n a p (verso −x) con lunghezza ∝ |E(x)| CALCOLATO integrando Poisson */
      var nA = Math.max(3, Math.min(9, Math.floor((xR - xL) / 14))), ym = yB + 26;
      for (var a = 0; a < nA; a++) { var xi = (a + 0.5) / nA, idx = Math.round(xi * (P.E.length - 1)), mod = Math.abs(P.E[idx]) / P.Emax, xm = xL + xi * (xR - xL), L = 8 + 26 * mod; if (mod > 0.02) freccia(q, xm + L / 2, ym, xm - L / 2, ym, 1.5 + 2.5 * mod, 'rgba(255,214,90,.9)'); }
      q.fillStyle = '#ffd24a'; q.font = '700 12px system-ui,sans-serif'; q.textBaseline = 'alphabetic'; q.fillText('E_max = ' + sci(g.Emax / 100, 2) + ' V/cm', piccolo ? x0 + 70 : Math.min(xR + 6, W - 150), piccolo ? ym + 26 : ym + 4);
      /* la corrente nel circuito esterno: spessore ∝ log|I| */
      var wI = Math.max(1.5, Math.min(16, 2 + Math.log10(1 + Math.abs(g.I) / 1e-15) * 1.1)), yI = yT - 34;
      q.strokeStyle = '#b87333'; q.lineWidth = 3; q.beginPath(); q.moveTo(x0 - 6, yT - 6); q.lineTo(x0 - 6, yI); q.lineTo(x1 + 6, yI); q.lineTo(x1 + 6, yT - 6); q.stroke();
      if (Math.abs(g.I) > 1e-16) { if (g.I > 0) freccia(q, (x0 + x1) / 2 + 60, yI, (x0 + x1) / 2 - 60, yI, wI, 'rgba(94,234,212,.9)'); else freccia(q, (x0 + x1) / 2 - 60, yI, (x0 + x1) / 2 + 60, yI, wI, 'rgba(255,120,120,.9)'); }
      q.fillStyle = '#5eead4'; q.font = '700 12px system-ui,sans-serif'; q.fillText('I = ' + (Math.abs(g.I) < 1e-3 ? sci(g.I * 1e6, 2) + ' µA' : num(g.I * 1000, 2) + ' mA') + '  (V = ' + num(g.V, 2) + ' V)', x0, yI - wI / 2 - 6);
      /* barra di scala */
      var um = 1e-6 * Math.pow(10, Math.floor(Math.log10(span / 1e-6 / 2))), bx = um * kx;
      q.strokeStyle = '#9fb3c8'; q.lineWidth = 2; q.beginPath(); q.moveTo(x0, yB + 54); q.lineTo(x0 + bx, yB + 54); q.stroke(); q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; q.fillText(num(um * 1e6, um < 1e-6 ? 2 : 0) + ' µm', x0 + bx + 6, yB + 58);
      /* le etichette */
      q.fillStyle = '#ffb3c1'; q.font = '700 13px system-ui,sans-serif'; q.fillText('p', x0 + 8, yT + 16); q.fillStyle = '#b3c8ff'; q.fillText('n', x1 - 18, yT + 16);
      if (!piccolo) {
        etichetta(q, t('contatto metallico (anodo)', 'metal contact (anode)'), x0 - 6, yB + 4, x0 + 20, H * 0.92);
        etichetta(q, t('zona di svuotamento W = ', 'depletion region W = ') + num(g.W * 1e6, 3) + ' µm', (xL + xR) / 2, yT, (xL + xR) / 2 + 40, yT - 58 + 0);
        etichetta(q, t('lacune (+) maggioritarie', 'majority holes (+)'), x0 + (xL - x0) * 0.6, yB - 8, x0 + (xL - x0) * 0.4, H * 0.86);
        etichetta(q, t('elettroni (−) maggioritari', 'majority electrons (−)'), xR + (x1 - xR) * 0.4, yB - 8, xR + (x1 - xR) * 0.25, H * 0.86);
      }
      /* la vista di dettaglio: ρ(x), E(x), V(x) nella zona di svuotamento */
      var iw = piccolo ? W * 0.55 : W * 0.3, ih = piccolo ? 84 : 96, ix = piccolo ? 8 : W - iw - 8, iy = piccolo ? yB + 70 : H - ih - 24;
      riquadro(q, ix, iy, iw, ih, t('dettaglio: E(x) e V(x) da Poisson', 'detail: E(x) and V(x) from Poisson'));
      var gx = function (xv) { return ix + 8 + (xv + g.xp) / (g.W) * (iw - 16); };
      q.strokeStyle = '#ffd24a'; q.lineWidth = 1.6; q.beginPath(); P.X.forEach(function (xv, i) { var yy = iy + 20 + (-P.E[i] / P.Emax) * (ih - 30); if (!i) q.moveTo(gx(xv), yy); else q.lineTo(gx(xv), yy); }); q.stroke();
      q.strokeStyle = '#5eead4'; q.beginPath(); P.X.forEach(function (xv, i) { var yy = iy + ih - 8 - (P.V[i] / (P.dV || 1)) * (ih - 30); if (!i) q.moveTo(gx(xv), yy); else q.lineTo(gx(xv), yy); }); q.stroke();
      q.fillStyle = '#ffd24a'; q.font = '9px system-ui,sans-serif'; q.fillText('|E|', ix + iw - 22, iy + 24); q.fillStyle = '#5eead4'; q.fillText('V', ix + iw - 14, iy + ih - 10);
      q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; q.textBaseline = 'top'; q.fillText(t('silicio a 300 K · larghezze in scala (barra) · frecce del campo ∝ |E(x)| integrato', 'silicon at 300 K · widths to scale (bar) · field arrows ∝ integrated |E(x)|'), 8, H - 16);
      /* il bilancio */
      bil.innerHTML = '<div class="bsiFX-eq">N_A·x_p = N_D·x_n</div><b class="bsiFX-num">' + sci(Na * g.xp * 1e-4, 3) + ' = ' + sci(Nd * g.xn * 1e-4, 3) + ' cm⁻²</b> ' + t('(neutralità della carica)', '(charge neutrality)') + '<br>' +
        'V_bi = (kT/q) ln(N_A N_D/n_i²) = <b class="bsiFX-num">' + num(g.Vbi, 3) + ' V</b> · ' + t('salto integrato da Poisson ', 'step integrated from Poisson ') + '<b class="bsiFX-num">' + num(P.dV, 3) + ' V</b> = V_bi − V<br>' +
        'W = <b class="bsiFX-num">' + num(g.W * 1e6, 3) + ' µm</b> (x_p ' + num(g.xp * 1e9, 0) + ' nm, x_n ' + num(g.xn * 1e9, 0) + ' nm) · E_max ' + t('formula', 'formula') + ' <b class="bsiFX-num">' + sci(g.Emax / 100, 3) + '</b>, Poisson <b class="bsiFX-num">' + sci(P.Emax / 100, 3) + ' V/cm</b><br>' +
        'I = I₀(e^(V/V_T) − 1), I₀ = <b class="bsiFX-num">' + sci(g.I0, 2) + ' A</b> ' + t('su 1 mm²', 'over 1 mm²') + (g.limitata ? ' · ' + t('V limitata a V_bi − 0,05 V per l\'approssimazione di svuotamento', 'V limited to V_bi − 0.05 V for the depletion approximation') : '') +
        '<br><small>' + t('Approssimazione di svuotamento, giunzione brusca, n_i = 1,0·10¹⁰ cm⁻³, D_n = 36 e D_p = 12 cm²/s, τ = 1 µs; niente ricombinazione nella zona di svuotamento né alta iniezione.', 'Depletion approximation, abrupt junction, n_i = 1.0·10¹⁰ cm⁻³, D_n = 36 and D_p = 12 cm²/s, τ = 1 µs; no recombination in the depletion region nor high injection.') + '</small>';
    }
    I.anima(disegna);
    div._spaccato = { calcolo: function () { var g = G(); return { g: g, P: campoPoisson(g, Math.pow(10, p.lNa) * 1e6, Math.pow(10, p.lNd) * 1e6, 400) }; }, p: p };
  }

  F.schedeExtra = F.schedeExtra || {};
  F.schedeExtra.spaccatoCircuito = schedaCircuito;
  F.schedeExtra.spaccatoLaser = schedaLaser;
  F.schedeExtra.spaccatoGiunzione = schedaGiunzione;
  F.calcolo = F.calcolo || {};
  F.calcolo.spaccati = { circuito: circuito, deriva: deriva, fasce: fasce, laser: laser, LASER: LASER, giunzione: giunzione, campoPoisson: campoPoisson };
})(typeof window !== 'undefined' ? window : globalThis);
