/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-motore.js — 🔧 Il motore in spaccato (fase 5 del progetto, §5.2)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v254)
   Lo standard della fisica del progetto è la tavola tecnica sezionata: il
   sistema in spaccato con ogni parte etichettata da una linea guida, i flussi
   con spessore proporzionale all'intensità e la grandezza scritta accanto, il
   bilancio che regge la figura e si aggiorna con i cursori, una vista di
   dettaglio. Questo è l'esempio che il progetto stesso cita: il motore
   termico con pistone e serbatoi. Diventa una scheda di
   «🔥 Termodinamica in movimento».

   IL MODELLO (ciclo Otto ad aria standard, un cilindro)
   · Manovellismo: x(θ) = r(1 − cos θ) + l − √(l² − r² sin² θ),
     V(θ) = V_c + A·x(θ), con corsa 2r, biella l = 3,2 r, V_c = V_d/(ρ − 1).
   · θ da 0 a π: compressione adiabatica dal punto morto inferiore al
     superiore, p V^γ costante; al punto morto superiore il calore della
     combustione entra a volume costante; da π a 2π espansione adiabatica; al
     punto morto inferiore il calore esce a volume costante (al posto di
     scarico e aspirazione: semplificazione dichiarata).
   · n = p₁ V₁ / (R T₁); Q_in = n c_v (T₃ − T₂); Q_out = n c_v (T₄ − T₁);
     L = Q_in − Q_out; η = 1 − ρ^(1−γ). Potenza: un ciclo ogni due giri.
   · Il colore del gas è convenzionale (scala delle temperature), dichiarato.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, R = 8.314462618, PI = Math.PI;
  function num(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); }

  /* ═══ 1. IL CALCOLO ════════════════════════════════════════════════════ */
  /** p: { Vd (m³), rho, T1 (K), p1 (Pa), T3 (K), gamma, giri (rpm) } */
  function motore(p) {
    var g = p.gamma, cv = R / (g - 1), Vc = p.Vd / (p.rho - 1), V1 = Vc + p.Vd, V2 = Vc, n = p.p1 * V1 / (R * p.T1);
    var T2 = p.T1 * Math.pow(p.rho, g - 1), p2 = p.p1 * Math.pow(p.rho, g), T3 = Math.max(p.T3, T2), p3 = p2 * T3 / T2, T4 = T3 * Math.pow(1 / p.rho, g - 1), p4 = p3 * Math.pow(1 / p.rho, g);
    var Qin = n * cv * (T3 - T2), Qout = n * cv * (T4 - p.T1), L = Qin - Qout;
    /* lavoro come integrale di p dV sul ciclo, indipendente dal bilancio: lo controlla il banco */
    var Lint = (p3 * V2 - p4 * V1) / (g - 1) - (p2 * V2 - p.p1 * V1) / (g - 1);
    return { n: n, Vc: Vc, V1: V1, V2: V2, T2: T2, T3: T3, T4: T4, p2: p2, p3: p3, p4: p4, Qin: Qin, Qout: Qout, L: L, Lint: Lint, eta: L / Qin, etaTeorico: 1 - Math.pow(p.rho, 1 - g), potenza: L * p.giri / 120, carnot: 1 - p.T1 / T3, pme: L / p.Vd };
  }
  /** Posizione del pistone dal punto morto superiore (m) all'angolo θ (0 = punto morto inferiore). */
  function corsa(theta, rM, l) { var a = theta + PI; return rM * (1 - Math.cos(a)) + l - Math.sqrt(l * l - rM * rM * Math.sin(a) * Math.sin(a)); }
  /** Stato del gas all'angolo θ ∈ [0, 2π): fase, V, p, T. */
  function statoAngolo(theta, p, M) {
    var Ac = PI * Math.pow(p.alesaggio / 2, 2), rM = p.Vd / Ac / 2, l = 3.2 * rM, x = corsa(theta, rM, l), V = M.Vc + Ac * x, g = p.gamma, th = ((theta % (2 * PI)) + 2 * PI) % (2 * PI);
    var fase = th < PI ? 'compressione' : 'espansione', pr = th < PI ? p.p1 * Math.pow(M.V1 / V, g) : M.p3 * Math.pow(M.V2 / V, g);
    return { fase: fase, V: V, p: pr, T: pr * V / (M.n * R), x: x, rM: rM, l: l, Ac: Ac };
  }
  F.calcolo.motore = { motore: motore, corsa: corsa, statoAngolo: statoAngolo };

  /* ═══ 2. IL DISEGNO ════════════════════════════════════════════════════ */
  function coloreT(T) { var f = Math.max(0, Math.min(1, (T - 280) / 2400)), r = Math.round(40 + 215 * Math.min(1, f * 1.6)), g = Math.round(70 + 150 * Math.max(0, f - 0.35) / 0.65), b = Math.round(160 * (1 - f)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  function freccia(q, x0, y0, x1, y1, w, col) {
    var a = Math.atan2(y1 - y0, x1 - x0), h = Math.max(10, w * 1.6);
    q.strokeStyle = col; q.fillStyle = col; q.lineWidth = w; q.lineCap = 'butt';
    q.beginPath(); q.moveTo(x0, y0); q.lineTo(x1 - Math.cos(a) * h * 0.8, y1 - Math.sin(a) * h * 0.8); q.stroke();
    q.beginPath(); q.moveTo(x1, y1); q.lineTo(x1 - Math.cos(a - 0.45) * h, y1 - Math.sin(a - 0.45) * h); q.lineTo(x1 - Math.cos(a + 0.45) * h, y1 - Math.sin(a + 0.45) * h); q.closePath(); q.fill();
  }
  function etichetta(q, testo, xp, yp, xt, yt) {
    q.strokeStyle = '#9fb3c8'; q.lineWidth = 1; q.beginPath(); q.moveTo(xp, yp); q.lineTo(xt, yt); q.stroke();
    q.fillStyle = '#9fb3c8'; q.beginPath(); q.arc(xp, yp, 2.2, 0, 2 * PI); q.fill();
    q.fillStyle = '#dbe8f5'; q.font = '12px system-ui,sans-serif'; q.textBaseline = 'middle'; q.textAlign = xt < xp ? 'right' : 'left'; q.fillText(testo, xt + (xt < xp ? -4 : 4), yt); q.textAlign = 'left';
  }
  function tratteggio(q, x, y, w, h) { q.save(); q.beginPath(); q.rect(x, y, w, h); q.clip(); q.fillStyle = '#2a3b4d'; q.fillRect(x, y, w, h); q.strokeStyle = '#4a6078'; q.lineWidth = 1; for (var k = -h; k < w; k += 6) { q.beginPath(); q.moveTo(x + k, y + h); q.lineTo(x + k + h, y); q.stroke(); } q.restore(); }

  function schedaMotore(div) {
    var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G);
    var p = { Vd: 0.5e-3, alesaggio: 0.084, rho: 10, T1: 300, p1: 1e5, T3: 2400, gamma: 1.4, giri: 3000 }, theta = 0.3, corre = true;
    var ferma = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches; if (ferma) corre = false;
    F.cursore(pan, ['Rapporto di compressione ρ', 'Compression ratio ρ'], 4, 14, 0.5, p.rho, function (v) { p.rho = v; M = motore(p); disegna(); }, function (v) { return num(v, 1); });
    F.cursore(pan, ['Temperatura dopo la combustione T₃ (K)', 'Temperature after combustion T₃ (K)'], 1200, 3000, 50, p.T3, function (v) { p.T3 = v; M = motore(p); disegna(); }, function (v) { return v + ' K'; });
    F.cursore(pan, ['Giri al minuto', 'Revolutions per minute'], 800, 7000, 100, p.giri, function (v) { p.giri = v; M = motore(p); disegna(); }, function (v) { return v; });
    var cang = F.cursore(pan, ['Angolo di manovella θ (gradi)', 'Crank angle θ (degrees)'], 0, 359, 1, Math.round(theta * 180 / PI), function (v) { theta = v * PI / 180; corre = false; bp.textContent = '▶ ' + t('Gira', 'Run'); disegna(); }, function (v) { return v + '°'; });
    var bp = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: corre ? '⏸ ' + t('Ferma', 'Stop') : '▶ ' + t('Gira', 'Run') }); bp.addEventListener('click', function () { corre = !corre; bp.textContent = corre ? '⏸ ' + t('Ferma', 'Stop') : '▶ ' + t('Gira', 'Run'); if (corre) giro(); }); pan.appendChild(bp);
    var bil = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(bil);
    var tela = F.el('canvas', { role: 'img', 'aria-label': t('Spaccato del motore: cilindro, pistone, biella e manovella, con i flussi di calore e lavoro', 'Engine cutaway: cylinder, piston, connecting rod and crank, with heat and work flows'), style: 'width:100%;display:block;border-radius:12px;background:#06111d' });
    dx.appendChild(tela);
    var M = motore(p);
    function disegna() {
      var W = Math.max(300, dx.clientWidth || 600), H = Math.round(Math.min(560, Math.max(380, W * 0.78))), dpr = Math.min(2, globale.devicePixelRatio || 1);
      tela.style.height = H + 'px'; if (tela.width !== W * dpr || tela.height !== H * dpr) { tela.width = W * dpr; tela.height = H * dpr; }
      var q = tela.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H);
      var S = statoAngolo(theta, p, M), piccolo = W < 520;
      /* geometria in pixel: il cilindro al centro, scala dalla corsa */
      var cx = W * (piccolo ? 0.34 : 0.46), alto = 44, corsaPx = H * 0.26, k = corsaPx / (2 * S.rM), bore = Math.min(W * 0.3, p.alesaggio * k * 1.0), testa = alto + 14, VcPx = M.Vc / S.Ac * k;
      var yPist = testa + VcPx + S.x * k, hPist = bore * 0.55, rPx = S.rM * k, a = theta + PI, yCrank = testa + VcPx + hPist * 0.65 + S.l * k + rPx;
      /* la biella ha lunghezza costante: perno del pistone e perno di manovella stanno sempre a l·k */
      var xPin = cx + rPx * Math.sin(a), yPin = yCrank - rPx * Math.cos(a);
      /* pareti del cilindro e testata, in sezione (tratteggio) */
      var spess = 14, fondoCil = testa + VcPx + 2 * S.rM * k + hPist + 10;
      tratteggio(q, cx - bore / 2 - spess, testa - 14, bore + 2 * spess, 14);
      tratteggio(q, cx - bore / 2 - spess, testa, spess, fondoCil - testa);
      tratteggio(q, cx + bore / 2, testa, spess, fondoCil - testa);
      /* il gas */
      q.fillStyle = coloreT(S.T); q.globalAlpha = 0.85; q.fillRect(cx - bore / 2, testa, bore, yPist - testa); q.globalAlpha = 1;
      /* candela */
      q.fillStyle = '#c9d6e3'; q.fillRect(cx - 4, testa - 26, 8, 14); q.fillRect(cx - 1.5, testa - 12, 3, 8);
      var vicinoPMS = Math.abs(((theta % (2 * PI)) + 2 * PI) % (2 * PI) - PI) < 0.18;
      if (vicinoPMS) { q.fillStyle = 'rgba(255,220,120,.9)'; q.beginPath(); q.arc(cx, testa + 4, 9, 0, 2 * PI); q.fill(); }
      /* pistone con le fasce */
      q.fillStyle = '#8a9bb0'; q.fillRect(cx - bore / 2 + 1, yPist, bore - 2, hPist);
      q.strokeStyle = '#2a3b4d'; q.lineWidth = 2; [0.18, 0.32, 0.46].forEach(function (f) { q.beginPath(); q.moveTo(cx - bore / 2 + 1, yPist + hPist * f); q.lineTo(cx + bore / 2 - 1, yPist + hPist * f); q.stroke(); });
      var yPerno = yPist + hPist * 0.65; q.fillStyle = '#3b4d63'; q.beginPath(); q.arc(cx, yPerno, 5, 0, 2 * PI); q.fill();
      /* manovella e volano */
      q.strokeStyle = '#3a5470'; q.lineWidth = 2; q.beginPath(); q.arc(cx, yCrank, rPx + 16, 0, 2 * PI); q.stroke();
      q.fillStyle = '#1b2a3b'; q.beginPath(); q.arc(cx, yCrank, rPx + 14, 0, 2 * PI); q.fill();
      q.strokeStyle = '#6b8cae'; q.lineWidth = 7; q.beginPath(); q.moveTo(cx, yCrank); q.lineTo(xPin, yPin); q.stroke();
      q.fillStyle = '#c9d6e3'; q.beginPath(); q.arc(cx, yCrank, 5, 0, 2 * PI); q.fill();
      /* biella */
      q.strokeStyle = '#b5c4d4'; q.lineWidth = 6; q.beginPath(); q.moveTo(cx, yPerno); q.lineTo(xPin, yPin); q.stroke();
      q.fillStyle = '#e6eef6'; q.beginPath(); q.arc(xPin, yPin, 4, 0, 2 * PI); q.fill();
      /* i flussi: spessore proporzionale al calore per ciclo */
      var Qmax = Math.max(M.Qin, 1), sc = (piccolo ? 18 : 26) / Qmax, sx = piccolo ? 4 : W * 0.06, dxF = piccolo ? W * 0.9 : W * 0.86;
      var wIn = Math.max(2, M.Qin * sc), wOut = Math.max(2, M.Qout * sc), wL = Math.max(2, M.L * sc);
      freccia(q, sx, testa + 10, cx - bore / 2 - spess - 6, testa + 10, wIn, 'rgba(255,140,60,.9)');
      freccia(q, cx + bore / 2 + spess + 6, testa + VcPx + 2 * S.rM * k * 0.9, dxF, testa + VcPx + 2 * S.rM * k * 0.9, wOut, 'rgba(94,170,255,.9)');
      freccia(q, cx + rPx + 20, yCrank, dxF, yCrank, wL, 'rgba(94,234,212,.95)');
      q.font = '700 12px system-ui,sans-serif'; q.textBaseline = 'alphabetic';
      q.fillStyle = '#ffb27a'; q.fillText('Q_in = ' + num(M.Qin, 0) + ' J', sx, testa + 10 - wIn / 2 - 6);
      q.fillStyle = '#8cc8ff'; q.textAlign = 'right'; q.fillText('Q_out = ' + num(M.Qout, 0) + ' J', dxF, testa + VcPx + 2 * S.rM * k * 0.9 - wOut / 2 - 6);
      q.fillStyle = '#5eead4'; q.fillText('L = ' + num(M.L, 0) + ' J', dxF, yCrank - wL / 2 - 6); q.textAlign = 'left';
      /* le etichette con le linee guida */
      var lx = cx - bore / 2 - spess - (piccolo ? 18 : 60);
      if (!piccolo) {
        etichetta(q, t('candela', 'spark plug'), cx - 4, testa - 20, lx, testa - 30);
        etichetta(q, t('camera di combustione', 'combustion chamber'), cx - bore / 4, testa + Math.min(12, (yPist - testa) / 2), lx, testa + 34);
        etichetta(q, t('pistone con le fasce', 'piston with rings'), cx - bore / 2 + 6, yPist + hPist * 0.3, lx, yPist + hPist * 0.3);
        etichetta(q, t('parete del cilindro', 'cylinder wall'), cx - bore / 2 - spess / 2, fondoCil - 30, lx, fondoCil - 10);
        etichetta(q, t('biella', 'connecting rod'), (cx + xPin) / 2, (yPerno + yPin) / 2, lx, (yPerno + yPin) / 2 + 10);
        etichetta(q, t('manovella e volano', 'crank and flywheel'), cx - (rPx + 10) * 0.7, yCrank + (rPx + 10) * 0.7, lx, yCrank + rPx + 18);
      }
      /* la vista di dettaglio: il ciclo p–V con lo stato attuale */
      var iw = piccolo ? W * 0.33 : W * 0.26, ih = iw * 0.72, ix = W - iw - 8, iy = 34;
      q.fillStyle = 'rgba(10,22,40,.94)'; q.strokeStyle = '#1a3050'; q.lineWidth = 1; q.fillRect(ix, iy, iw, ih); q.strokeRect(ix, iy, iw, ih);
      var pmx = M.p3 * 1.05, vx = function (V) { return ix + 8 + (V - M.V2 * 0.9) / (M.V1 * 1.05 - M.V2 * 0.9) * (iw - 16); }, py = function (pp) { return iy + ih - 14 - pp / pmx * (ih - 24); };
      q.strokeStyle = '#ffd24a'; q.lineWidth = 1.5; q.beginPath();
      for (var i = 0; i <= 120; i++) { var V = M.V1 + (M.V2 - M.V1) * i / 120, pp = p.p1 * Math.pow(M.V1 / V, p.gamma); if (!i) q.moveTo(vx(V), py(pp)); else q.lineTo(vx(V), py(pp)); }
      for (var j = 0; j <= 120; j++) { var V2 = M.V2 + (M.V1 - M.V2) * j / 120, p2 = M.p3 * Math.pow(M.V2 / V2, p.gamma); q.lineTo(vx(V2), py(p2)); }
      q.closePath(); q.stroke();
      q.fillStyle = '#fff'; q.beginPath(); q.arc(vx(S.V), py(S.p), 4, 0, 2 * PI); q.fill();
      q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; q.fillText(t('dettaglio: ciclo p–V', 'detail: p–V cycle'), ix + 6, iy + 11); q.fillText('V', ix + iw - 12, iy + ih - 3); q.fillText('p', ix + 2, iy + 22);
      /* la didascalia dello stato */
      q.fillStyle = '#dbe8f5'; q.font = '12px system-ui,sans-serif'; q.textBaseline = 'top';
      q.fillText((S.fase === 'compressione' ? t('compressione', 'compression') : t('espansione', 'expansion')) + ' · θ = ' + Math.round(((theta % (2 * PI)) + 2 * PI) % (2 * PI) * 180 / PI) + '° · p = ' + num(S.p / 1e5, 1) + ' bar · T = ' + num(S.T, 0) + ' K', 8, 6);
      q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; q.fillText(piccolo ? t('colore = temperatura (convenzionale)', 'colour = temperature (conventional)') : t('colore del gas: temperatura, scala convenzionale · corsa e alesaggio in scala', 'gas colour: temperature, conventional scale · stroke and bore to scale'), 8, 22);
      /* il bilancio */
      bil.innerHTML = '<div class="bsiFX-eq">Q_in = L + Q_out</div>' +
        '<b class="bsiFX-num">' + num(M.Qin, 0) + ' J</b> = <b class="bsiFX-num">' + num(M.L, 0) + ' J</b> + <b class="bsiFX-num">' + num(M.Qout, 0) + ' J</b> ' + t('per ciclo', 'per cycle') + '<br>' +
        t('Rendimento ', 'Efficiency ') + '<b class="bsiFX-num">η = ' + num(M.eta * 100, 1) + ' %</b> = 1 − ρ^(1−γ); ' + t('Carnot fra ', 'Carnot between ') + num(p.T1, 0) + ' ' + t('e', 'and') + ' ' + num(M.T3, 0) + ' K: ' + num(M.carnot * 100, 0) + ' %<br>' +
        t('Potenza ', 'Power ') + '<b class="bsiFX-num">' + num(M.potenza / 1000, 1) + ' kW</b> ' + t('a ', 'at ') + p.giri + t(' giri/min (un ciclo ogni due giri), pressione media effettiva ', ' rpm (one cycle every two turns), mean effective pressure ') + num(M.pme / 1e5, 1) + ' bar<br>' +
        t('Cilindrata 500 cm³, alesaggio 84 mm; fine compressione ', 'Displacement 500 cm³, bore 84 mm; end of compression ') + num(M.T2, 0) + ' K, ' + num(M.p2 / 1e5, 1) + ' bar' +
        '<br><small>' + t('Ciclo ad aria standard (γ = 1,4, gas ideale, combustione istantanea, niente attriti né perdite alle pareti): un motore vero rende circa la metà.', 'Air-standard cycle (γ = 1.4, ideal gas, instantaneous combustion, no friction or wall losses): a real engine achieves about half.') + '</small>';
      cang.value = Math.round(((theta % (2 * PI)) + 2 * PI) % (2 * PI) * 180 / PI);
    }
    var prec = 0;
    function giro(ora) {
      if (!corre) { prec = 0; return; }
      if (!tela.isConnected || tela.offsetParent === null) { prec = 0; setTimeout(function () { if (corre && tela.isConnected) globale.requestAnimationFrame(giro); }, 500); return; }
      if (ora && prec) theta += Math.min(0.05, (ora - prec) / 1000) * 2 * PI * 0.6;   /* 0,6 giri al secondo: rallentato di circa 80 volte a 3000 giri/min */
      prec = ora || 0; disegna(); globale.requestAnimationFrame(giro);
    }
    disegna(); F.alRidimensiona(disegna); if (corre) globale.requestAnimationFrame(giro);
  }
  F.schedeExtra = F.schedeExtra || {};
  F.schedeExtra.motore = schedaMotore;
})(typeof window !== 'undefined' ? window : globalThis);
