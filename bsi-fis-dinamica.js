/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-dinamica.js — la dinamica molecolare
   BioSpecInfo · © Samuele Pio Provenzano

   Un fluido di Lennard-Jones in due dimensioni, dal vivo: si scaldano o si
   comprimono le particelle e si vede il gas diventare liquido e il liquido
   cristallo (esagonale, in 2D).

     V(r) = 4ε [ (σ/r)¹² − (σ/r)⁶ ]          taglio a 2,5σ, potenziale spostato
     integrazione: VELOCITY VERLET, Δt = 0,005 (unita' ridotte: σ = ε = m = 1)
     termostato:   riscalamento delle velocita' verso T* (facoltativo: senza,
                   l'energia totale si conserva e il banco lo misura)
     confini:      periodici, convenzione dell'immagine minima, liste di celle

   Si misurano: la temperatura (equipartizione in 2D: ⟨E_cin⟩ = N k T), la
   pressione dal viriale P = ρT + (1/2A) Σ r·f, la distribuzione delle
   velocita' contro quella di Maxwell-Boltzmann in 2D, P(v) = (v/T) e^(−v²/2T),
   e la funzione di distribuzione radiale g(r).

   v238: la stessa fisica in TRE dimensioni, in una scatola 3D: reticolo
   cubico a facce centrate di partenza, liste di celle, T dall'equipartizione
   (3N − 3 gradi di liberta'), P dal viriale (1/3V) Σ r·f.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var RC = 2.5, RC2 = RC * RC, VSH = 4 * (Math.pow(RC, -12) - Math.pow(RC, -6));

  function sistema(N, rho, T, seme) {
    var L = Math.sqrt(N / rho), n = Math.ceil(Math.sqrt(N)), a = L / n, x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N);
    var s = seme || 12345, rnd = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (var i = 0; i < N; i++) { x[i] = (i % n + 0.5 + (Math.floor(i / n) % 2) * 0.5) * a; y[i] = (Math.floor(i / n) + 0.5) * a; }
    var gx = 0, gy = 0;
    for (i = 0; i < N; i++) {
      var u1 = Math.max(1e-12, rnd()), u2 = rnd(), r = Math.sqrt(-2 * Math.log(u1));
      vx[i] = r * Math.cos(2 * Math.PI * u2); vy[i] = r * Math.sin(2 * Math.PI * u2); gx += vx[i]; gy += vy[i];
    }
    var S = { N: N, L: L, x: x, y: y, vx: vx, vy: vy, fx: new Float64Array(N), fy: new Float64Array(N), Ep: 0, vir: 0, passi: 0 };
    var ke = 0; for (i = 0; i < N; i++) { vx[i] -= gx / N; vy[i] -= gy / N; ke += 0.5 * (vx[i] * vx[i] + vy[i] * vy[i]); }
    var f = Math.sqrt(N * T / ke); for (i = 0; i < N; i++) { vx[i] *= f; vy[i] *= f; }
    forze(S);
    return S;
  }
  function forze(S) {
    var N = S.N, L = S.L, x = S.x, y = S.y, fx = S.fx, fy = S.fy, Ep = 0, vir = 0;
    fx.fill(0); fy.fill(0);
    var nc = Math.max(1, Math.floor(L / RC)), lc = L / nc, testa = new Int32Array(nc * nc).fill(-1), dopo = new Int32Array(N);
    for (var i = 0; i < N; i++) { var cx = Math.min(nc - 1, Math.floor(x[i] / lc)), cy = Math.min(nc - 1, Math.floor(y[i] / lc)), c = cy * nc + cx; dopo[i] = testa[c]; testa[c] = i; }
    for (var cy2 = 0; cy2 < nc; cy2++) for (var cx2 = 0; cx2 < nc; cx2++) {
      for (var i2 = testa[cy2 * nc + cx2]; i2 >= 0; i2 = dopo[i2]) {
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          if (nc < 3 && (dx !== 0 || dy !== 0) && false) continue;
          var ox = (cx2 + dx + nc) % nc, oy = (cy2 + dy + nc) % nc;
          for (var j = testa[oy * nc + ox]; j >= 0; j = dopo[j]) {
            if (j <= i2) continue;
            var rx = x[i2] - x[j], ry = y[i2] - y[j];
            rx -= L * Math.round(rx / L); ry -= L * Math.round(ry / L);
            var r2 = rx * rx + ry * ry;
            if (r2 >= RC2) continue;
            var ir2 = 1 / r2, ir6 = ir2 * ir2 * ir2, ff = 48 * ir2 * ir6 * (ir6 - 0.5);
            fx[i2] += ff * rx; fy[i2] += ff * ry; fx[j] -= ff * rx; fy[j] -= ff * ry;
            Ep += 4 * ir6 * (ir6 - 1) - VSH; vir += ff * r2;
          }
        }
      }
    }
    /* con meno di tre celle per lato le celle vicine si ripetono: in quel caso si conta a coppie dirette */
    if (nc < 3) {
      fx.fill(0); fy.fill(0); Ep = 0; vir = 0;
      for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
        var ax = x[i] - x[j], ay = y[i] - y[j]; ax -= L * Math.round(ax / L); ay -= L * Math.round(ay / L);
        var q2 = ax * ax + ay * ay; if (q2 >= RC2) continue;
        var jr2 = 1 / q2, jr6 = jr2 * jr2 * jr2, gg = 48 * jr2 * jr6 * (jr6 - 0.5);
        fx[i] += gg * ax; fy[i] += gg * ay; fx[j] -= gg * ax; fy[j] -= gg * ay; Ep += 4 * jr6 * (jr6 - 1) - VSH; vir += gg * q2;
      }
    }
    S.Ep = Ep; S.vir = vir;
  }
  function passo(S, dt, Tbagno) {
    var N = S.N, L = S.L, h = dt / 2;
    for (var i = 0; i < N; i++) {
      S.vx[i] += h * S.fx[i]; S.vy[i] += h * S.fy[i];
      S.x[i] += dt * S.vx[i]; S.y[i] += dt * S.vy[i];
      S.x[i] -= L * Math.floor(S.x[i] / L); S.y[i] -= L * Math.floor(S.y[i] / L);
    }
    forze(S);
    var ke = 0;
    for (i = 0; i < N; i++) { S.vx[i] += h * S.fx[i]; S.vy[i] += h * S.fy[i]; ke += 0.5 * (S.vx[i] * S.vx[i] + S.vy[i] * S.vy[i]); }
    if (Tbagno) { var f = Math.sqrt(1 + 0.05 * (N * Tbagno / ke - 1)); for (i = 0; i < N; i++) { S.vx[i] *= f; S.vy[i] *= f; } ke *= f * f; }
    S.Ek = ke; S.passi++;
    return S;
  }
  function misure(S) {
    var N = S.N, A = S.L * S.L, ke = 0;
    for (var i = 0; i < N; i++) ke += 0.5 * (S.vx[i] * S.vx[i] + S.vy[i] * S.vy[i]);
    var T = ke / N;   /* 2D: (N−1) gradi per la quantita' di moto fissata, trascurabile qui */
    return { T: T, Ek: ke / N, Ep: S.Ep / N, E: (ke + S.Ep) / N, P: N * T / A + S.vir / (2 * A), rho: N / A };
  }
  function rdf(S, nb, rmax) {
    var N = S.N, L = S.L, g = new Float64Array(nb), dr = rmax / nb;
    for (var i = 0; i < N; i++) for (var j = i + 1; j < N; j++) {
      var rx = S.x[i] - S.x[j], ry = S.y[i] - S.y[j]; rx -= L * Math.round(rx / L); ry -= L * Math.round(ry / L);
      var r = Math.sqrt(rx * rx + ry * ry); if (r < rmax) g[Math.floor(r / dr)] += 2;
    }
    var rho = N / (L * L), out = [];
    for (var k = 0; k < nb; k++) { var r1 = k * dr, r2 = r1 + dr; out.push({ r: r1 + dr / 2, g: g[k] / (N * rho * Math.PI * (r2 * r2 - r1 * r1)) }); }
    return out;
  }

  /* ── v238: lo stesso fluido in tre dimensioni ─────────────────────────────
     Partenza da un reticolo cubico a facce centrate (4 n³ particelle), stesse
     unita' ridotte e stesso taglio a 2,5σ. Si misurano la temperatura
     dall'equipartizione in 3D, ⟨E_cin⟩ = (3N − 3)/2 kT (la quantita' di moto
     totale e' fissata a zero), e la pressione dal viriale
     P = ρT + (1/3V) Σ r·f. */
  function sistema3D(n, rho, T, seme) {
    var N = 4 * n * n * n, L = Math.pow(N / rho, 1 / 3), a = L / n, x = new Float64Array(3 * N), v = new Float64Array(3 * N);
    var s = (seme || 12345) >>> 0, rnd = function () { s = (s + 0x6D2B79F5) >>> 0; var q = Math.imul(s ^ (s >>> 15), 1 | s); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; };
    var B = [[0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75]], k = 0;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) for (var l = 0; l < n; l++) B.forEach(function (b) { x[3 * k] = (i + b[0]) * a; x[3 * k + 1] = (j + b[1]) * a; x[3 * k + 2] = (l + b[2]) * a; k++; });
    var g = [0, 0, 0];
    for (k = 0; k < 3 * N; k++) { var u1 = Math.max(1e-12, rnd()), u2 = rnd(); v[k] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); g[k % 3] += v[k]; }
    for (k = 0; k < 3 * N; k++) v[k] -= g[k % 3] / N;
    var S = { N: N, L: L, x: x, v: v, f: new Float64Array(3 * N), Ep: 0, vir: 0, passi: 0, t: 0 };
    scalaT3D(S, T); forze3D(S);
    return S;
  }
  function cinetica3D(S) { var ke = 0; for (var k = 0; k < 3 * S.N; k++) ke += 0.5 * S.v[k] * S.v[k]; return ke; }
  function scalaT3D(S, T) { var ke = cinetica3D(S), f = Math.sqrt(T * (3 * S.N - 3) / 2 / ke); for (var k = 0; k < 3 * S.N; k++) S.v[k] *= f; }
  function forze3D(S) {
    var N = S.N, L = S.L, hL = L / 2, x = S.x, f = S.f, Ep = 0, vir = 0; f.fill(0);
    function coppia(i, j) {
      var dx = x[3 * i] - x[3 * j], dy = x[3 * i + 1] - x[3 * j + 1], dz = x[3 * i + 2] - x[3 * j + 2];
      /* immagine minima: le posizioni stanno in [0, L), le differenze in (−L, L) */
      if (dx > hL) dx -= L; else if (dx < -hL) dx += L;
      if (dy > hL) dy -= L; else if (dy < -hL) dy += L;
      if (dz > hL) dz -= L; else if (dz < -hL) dz += L;
      var r2 = dx * dx + dy * dy + dz * dz; if (r2 >= RC2) return;
      var ir2 = 1 / r2, ir6 = ir2 * ir2 * ir2, ff = 48 * ir2 * ir6 * (ir6 - 0.5);
      f[3 * i] += ff * dx; f[3 * i + 1] += ff * dy; f[3 * i + 2] += ff * dz; f[3 * j] -= ff * dx; f[3 * j + 1] -= ff * dy; f[3 * j + 2] -= ff * dz;
      Ep += 4 * ir6 * (ir6 - 1) - VSH; vir += ff * r2;
    }
    var nc = Math.floor(L / RC);
    if (nc < 3) { for (var i = 0; i < N; i++) for (var j = i + 1; j < N; j++) coppia(i, j); }
    else {
      /* liste di celle: ogni coppia di celle vicine una volta sola (13 delle 26 vicine) */
      var lc = L / nc, testa = new Int32Array(nc * nc * nc).fill(-1), dopo = new Int32Array(N), cel = function (q) { return Math.min(nc - 1, Math.floor(q / lc)); };
      for (i = 0; i < N; i++) { var c = (cel(x[3 * i]) * nc + cel(x[3 * i + 1])) * nc + cel(x[3 * i + 2]); dopo[i] = testa[c]; testa[c] = i; }
      var vic = []; for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) for (var d = -1; d <= 1; d++) if (a > 0 || (a === 0 && (b > 0 || (b === 0 && d > 0)))) vic.push([a, b, d]);
      for (var cx = 0; cx < nc; cx++) for (var cy = 0; cy < nc; cy++) for (var cz = 0; cz < nc; cz++) {
        var c0 = (cx * nc + cy) * nc + cz;
        for (i = testa[c0]; i >= 0; i = dopo[i]) for (j = dopo[i]; j >= 0; j = dopo[j]) coppia(i, j);
        for (var q = 0; q < 13; q++) { var c1 = (((cx + vic[q][0] + nc) % nc) * nc + (cy + vic[q][1] + nc) % nc) * nc + (cz + vic[q][2] + nc) % nc; for (i = testa[c0]; i >= 0; i = dopo[i]) for (j = testa[c1]; j >= 0; j = dopo[j]) coppia(i, j); }
      }
    }
    S.Ep = Ep; S.vir = vir;
  }
  function passo3D(S, dt, Tbagno) {
    var N3 = 3 * S.N, L = S.L, h = dt / 2, x = S.x, v = S.v, f = S.f;
    for (var k = 0; k < N3; k++) { v[k] += h * f[k]; x[k] += dt * v[k]; x[k] -= L * Math.floor(x[k] / L); }
    forze3D(S);
    for (k = 0; k < N3; k++) v[k] += h * f[k];
    if (Tbagno) { var ke = cinetica3D(S), T = 2 * ke / (3 * S.N - 3), g = Math.sqrt(1 + 0.05 * (Tbagno / T - 1)); for (k = 0; k < N3; k++) v[k] *= g; }
    S.passi++; S.t += dt;
    return S;
  }
  function misure3D(S) {
    var V = S.L * S.L * S.L, ke = cinetica3D(S), T = 2 * ke / (3 * S.N - 3), p = [0, 0, 0];
    for (var k = 0; k < 3 * S.N; k++) p[k % 3] += S.v[k];
    return { T: T, Ek: ke / S.N, Ep: S.Ep / S.N, E: (ke + S.Ep) / S.N, P: S.N * T / V + S.vir / (3 * V), rho: S.N / V, p: Math.hypot(p[0], p[1], p[2]) };
  }
  F.calcolo.dinamica = { sistema: sistema, passo: passo, misure: misure, rdf: rdf, forze: forze, sistema3D: sistema3D, forze3D: forze3D, passo3D: passo3D, misure3D: misure3D, scalaT3D: scalaT3D };

  function schedaSimulatore(div, alRid) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var N = 196, rho = 0.7, T = 1.0, termo = true, S = null, anim = null, mT = [], mE = [];
    var stato = F.el('div', { 'class': 'bsiFX-nota' });
    F.scelta(pan, ['Situazione di partenza', 'Starting state'], [['gas', ['gas (ρ* 0,2, T* 1,5)', 'gas (ρ* 0.2, T* 1.5)']], ['liq', ['liquido (ρ* 0,7, T* 1,0)', 'liquid (ρ* 0.7, T* 1.0)']], ['sol', ['solido (ρ* 0,9, T* 0,3)', 'solid (ρ* 0.9, T* 0.3)']]], 'liq', function (v) {
      if (v === 'gas') { rho = 0.2; T = 1.5; } else if (v === 'liq') { rho = 0.7; T = 1.0; } else { rho = 0.9; T = 0.3; }
      cT.value = T; cT.dispatchEvent(new Event('input')); riparti();
    });
    var cT = F.cursore(pan, ['Temperatura T* del termostato', 'Thermostat temperature T*'], 0.1, 3, 0.05, T, function (v) { T = v; });
    F.cursore(pan, ['Densità ρ* (riparte)', 'Density ρ* (restarts)'], 0.05, 0.95, 0.05, rho, function (v) { rho = v; riparti(); });
    var lab = F.el('label', { style: 'display:flex;gap:6px;font-size:.82rem;color:#aebccd;margin:6px 0' }), cb = F.el('input', { type: 'checkbox' });
    cb.checked = true; cb.addEventListener('change', function () { termo = cb.checked; });
    lab.appendChild(cb); lab.appendChild(document.createTextNode(t('termostato acceso (spento: energia costante)', 'thermostat on (off: constant energy)'))); pan.appendChild(lab);
    pan.appendChild(stato);
    F.bottone(pan, ['⏯ Pausa / riprendi', '⏯ Pause / resume'], function () { if (anim) { cancelAnimationFrame(anim); anim = null; } else giro(); });
    var cs = F.tela(destra, 1), c1 = F.tela(destra, 0.42), c2 = F.tela(destra, 0.42);
    cs._rapporto = 1;
    function riparti() { S = sistema(N, rho, T, Date.now() & 0xffff); mT = []; mE = []; if (!anim) giro(); }
    function giro() {
      /* a sezione chiusa la simulazione si ferma (niente cicli che consumano
         batteria di nascosto) e riparte quando la si riapre */
      if (!document.body.contains(cs) || cs.offsetParent === null) { anim = null; return; }
      for (var k = 0; k < 8; k++) passo(S, 0.005, termo ? T : 0);
      disegna();
      anim = requestAnimationFrame(giro);
    }
    function disegna() {
      var dpr = Math.min(2, globale.devicePixelRatio || 1), W = Math.max(260, cs.clientWidth || 500), q = cs.getContext('2d');
      cs.width = Math.round(W * dpr); cs.height = Math.round(W * dpr); q.setTransform(dpr, 0, 0, dpr, 0, 0);
      q.fillStyle = '#081522'; q.fillRect(0, 0, W, W);
      var sc = W / S.L, rr = Math.max(2, 0.42 * sc);
      for (var i = 0; i < S.N; i++) {
        var v2 = S.vx[i] * S.vx[i] + S.vy[i] * S.vy[i], k = Math.min(1, v2 / (4 * Math.max(0.1, T)));
        q.fillStyle = 'rgb(' + Math.round(94 + 161 * k) + ',' + Math.round(234 - 120 * k) + ',' + Math.round(212 - 150 * k) + ')';
        q.beginPath(); q.arc(S.x[i] * sc, W - S.y[i] * sc, rr, 0, 6.2832); q.fill();
      }
      cs.setAttribute('aria-label', t('le particelle della simulazione', 'the simulated particles'));
      var m = misure(S); mT.push(m.T); mE.push(m.E); if (mT.length > 400) { mT.shift(); mE.shift(); }
      stato.innerHTML = t('Passi', 'Steps') + ': ' + S.passi + '<br>T* = <b class="bsiFX-num">' + m.T.toFixed(3) + '</b> · P* = <b class="bsiFX-num">' + m.P.toFixed(3) + '</b><br>' +
        t('E per particella', 'E per particle') + ' = <b class="bsiFX-num">' + m.E.toFixed(4) + '</b> (' + t('cinetica', 'kinetic') + ' ' + m.Ek.toFixed(3) + ', ' + t('potenziale', 'potential') + ' ' + m.Ep.toFixed(3) + ')<br>ρ* = ' + m.rho.toFixed(3) + '<br><br>' +
        t('Colore: blu-verde lente, arancio veloci. A ρ* 0,9 e T* basse le particelle si ordinano in un reticolo esagonale; scaldando, il cristallo fonde.', 'Colour: teal slow, orange fast. At ρ* 0.9 and low T* the particles order into a hexagonal lattice; heating melts the crystal.');
      if (S.passi % 40 === 0) {
        var bins = 30, vmax = 4 * Math.sqrt(Math.max(0.1, m.T)), h = new Float64Array(bins), dv = vmax / bins;
        for (i = 0; i < S.N; i++) { var v = Math.sqrt(S.vx[i] * S.vx[i] + S.vy[i] * S.vy[i]); if (v < vmax) h[Math.floor(v / dv)]++; }
        var xs = [], ys = [], th = [];
        for (var b = 0; b < bins; b++) { var vc = (b + 0.5) * dv; xs.push(vc); ys.push(h[b] / (S.N * dv)); th.push(vc / m.T * Math.exp(-vc * vc / (2 * m.T))); }
        F.grafico(c1, { barre: xs.map(function (x, i2) { return { x: x, y: ys[i2], col: '#5eead4', larg: Math.max(2, 0.6 * (c1.clientWidth || 400) / bins) }; }), serie: [{ x: xs, y: th, col: '#ffd24a' }],
                        xmin: 0, xmax: vmax, ymin: 0, xl: ['velocità v*', 'speed v*'], yl: ['P(v)', 'P(v)'], legenda: [{ col: '#ffd24a', etich: ['Maxwell-Boltzmann 2D', '2D Maxwell-Boltzmann'] }] });
        var g2 = rdf(S, 60, Math.min(4, S.L / 2));
        F.grafico(c2, { serie: [{ x: g2.map(function (p) { return p.r; }), y: g2.map(function (p) { return p.g; }), col: '#7c6fff' }], linee: [{ y: 1, col: '#34465f' }], xmin: 0, ymin: 0, xl: ['r / σ', 'r / σ'], yl: ['g(r)', 'g(r)'] });
      }
    }
    riparti();
    if (alRid) alRid(function () { if (!anim && S) giro(); });
  }

  /* ── v238: la scatola 3D ─────────────────────────────────────────────── */
  var MENO_MOTO = false; try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  /* il pannello subito, la scena dopo (three.js al primo uso, il contesto WebGL e il contenuto in compiti separati) */
  function scheda3D(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new L3.Scena(destra, 0.8);
          var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
          destra.insertBefore(S.box, destra.firstChild);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.nome));
          div._scena = S;
          setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
        }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function schedaScatola3D(pan) {
    var st = { n: 4, rho: 0.8, T: 1.0, termo: true, pausa: MENO_MOTO }, Sx = null, cb = {}, medie = null, cT = null;
    F.scelta(pan, ['Situazione di partenza', 'Starting state'], [['gas', ['gas (ρ* 0,1, T* 2,0)', 'gas (ρ* 0.1, T* 2.0)']], ['liq', ['liquido (ρ* 0,8, T* 1,0)', 'liquid (ρ* 0.8, T* 1.0)']], ['sol', ['solido CFC (ρ* 1,05, T* 0,4)', 'FCC solid (ρ* 1.05, T* 0.4)']]], 'liq', function (v) {
      var P = { gas: [0.1, 2.0], liq: [0.8, 1.0], sol: [1.05, 0.4] }[v]; st.rho = P[0]; st.T = P[1]; cT.value = st.T; cT.dispatchEvent(new Event('input')); cR.value = st.rho; cR.dispatchEvent(new Event('input'));
    });
    F.scelta(pan, ['Particelle', 'Particles'], [['3', '108'], ['4', '256'], ['5', '500']], '4', function (v) { st.n = +v; riparti(); });
    cT = F.cursore(pan, ['temperatura T* del termostato', 'thermostat temperature T*'], 0.1, 3, 0.05, st.T, function (v) { st.T = v; });
    var cR = F.cursore(pan, ['densità ρ* (riparte)', 'density ρ* (restarts)'], 0.05, 1.2, 0.05, st.rho, function (v) { st.rho = v; riparti(); });
    var cb1 = F.el('input', { type: 'checkbox' }); cb1.checked = true; cb1.addEventListener('change', function () { st.termo = cb1.checked; medie = null; });
    pan.appendChild(F.el('label', { style: 'display:flex;gap:6px;align-items:center;font-size:.82rem;color:#aebccd;margin:6px 0' }, [cb1, F.el('span', { testo: t('termostato acceso (spento: energia costante, NVE)', 'thermostat on (off: constant energy, NVE)') })]));
    var bp = F.bottone(pan, st.pausa ? ['▶ Avvia', '▶ Play'] : ['⏸ Pausa', '⏸ Pause'], function () { st.pausa = !st.pausa; bp.textContent = F.tt(st.pausa ? ['▶ Avvia', '▶ Play'] : ['⏸ Pausa', '⏸ Pause']); if (cb.sveglia) cb.sveglia(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }), spiega = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info); pan.appendChild(spiega);
    spiega.innerHTML = t('Ogni sfera è un atomo di Lennard-Jones (diametro σ), mosso con velocity Verlet (Δt* = 0,004) in una scatola con confini periodici: chi esce da una faccia rientra dall’opposta. Il colore va dal blu (lento) al rosso (veloce). La temperatura viene dall’energia cinetica (equipartizione, 3N − 3 gradi di libertà), la pressione dal viriale di Clausius: P = ρT + (1/3V) Σ r·f. Sotto ρ* ≈ 0,9 e T* ≈ 0,7 il reticolo cubico a facce centrate di partenza fonde; a bassa densità P si avvicina al gas ideale ρT. Spegnendo il termostato l’energia totale resta costante: è il controllo dell’integratore.',
      'Each sphere is a Lennard-Jones atom (diameter σ), moved with velocity Verlet (Δt* = 0.004) in a box with periodic boundaries: whoever leaves through a face comes back through the opposite one. Colour goes from blue (slow) to red (fast). Temperature comes from kinetic energy (equipartition, 3N − 3 degrees of freedom), pressure from the Clausius virial: P = ρT + (1/3V) Σ r·f. Below ρ* ≈ 0.9 and T* ≈ 0.7 the starting face-centred cubic lattice melts; at low density P approaches the ideal gas ρT. With the thermostat off the total energy stays constant: that is the check on the integrator.');
    function riparti() { Sx = sistema3D(st.n, st.rho, st.T, 7 + st.n); medie = null; testo(); if (cb.nuova) cb.nuova(); }
    function testo() {
      var m = misure3D(Sx);
      if (!medie) medie = { n: 0, T: 0, P: 0, E0: m.E };
      medie.n++; var a = 1 / Math.min(medie.n, 150); medie.T += a * (m.T - medie.T); medie.P += a * (m.P - medie.P);
      info.innerHTML = 'N = ' + Sx.N + ' · ρ* = ' + m.rho.toFixed(3) + ' · L = ' + Sx.L.toFixed(2) + ' σ · ' + t('passi ', 'steps ') + Sx.passi + ' (t* = ' + Sx.t.toFixed(1) + ')<br>' +
        'T* = <b class="bsiFX-num">' + m.T.toFixed(3) + '</b> (' + t('media ', 'mean ') + medie.T.toFixed(3) + ') · P* = <b class="bsiFX-num">' + m.P.toFixed(3) + '</b> (' + t('media ', 'mean ') + medie.P.toFixed(3) + ')<br>' +
        t('Gas ideale ρT = ', 'Ideal gas ρT = ') + (m.rho * medie.T).toFixed(3) + ' → Z = P/ρT = <b class="bsiFX-num">' + (medie.P / (m.rho * medie.T)).toFixed(3) + '</b><br>' +
        t('Energia per particella ', 'Energy per particle ') + '<b class="bsiFX-num">' + m.E.toFixed(4) + '</b> (' + t('cinetica ', 'kinetic ') + m.Ek.toFixed(3) + ', ' + t('potenziale ', 'potential ') + m.Ep.toFixed(3) + ')' +
        (st.termo ? '' : '<br>' + t('NVE: deriva dell’energia ', 'NVE: energy drift ') + ((m.E - medie.E0)).toExponential(1)) + ' · |Σp| = ' + m.p.toExponential(0);
    }
    riparti();
    return {
      nome: ['Fluido di Lennard-Jones in una scatola 3D', 'Lennard-Jones fluid in a 3D box'],
      tre: function (S, T, L3) {
        var mesh = null, scatola = null, M4 = new T.Matrix4(), col = new T.Color(), k = 1;
        function caldo(f) { f = Math.max(0, Math.min(1, f)); var c = [[0.15, 0.35, 0.95], [0.2, 0.8, 0.95], [0.35, 0.92, 0.55], [1, 0.85, 0.25], [1, 0.35, 0.2]], x = f * 4, i = Math.min(3, Math.floor(x)), u = x - i; return [c[i][0] + (c[i + 1][0] - c[i][0]) * u, c[i][1] + (c[i + 1][1] - c[i][1]) * u, c[i][2] + (c[i + 1][2] - c[i][2]) * u]; }
        cb.sveglia = function () { S.avvia(); };
        cb.nuova = function () {
          if (mesh) { S.radice.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
          if (scatola) { S.radice.remove(scatola); scatola.geometry.dispose(); scatola.material.dispose(); }
          k = 6.4 / Sx.L;
          mesh = new T.InstancedMesh(new T.SphereGeometry(0.42 * k, 12, 8), new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }), Sx.N);
          mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
          for (var i = 0; i < Sx.N; i++) mesh.setColorAt(i, col.setRGB(1, 1, 1));
          S.aggiungi(mesh);
          scatola = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(6.4, 6.4, 6.4)), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.55 })); S.aggiungi(scatola);
          aggiorna();
        };
        function aggiorna() {
          var m = 0; for (var i = 0; i < 3 * Sx.N; i++) m += Sx.v[i] * Sx.v[i]; var vr = Math.sqrt(m / Sx.N), off = -3.2;
          for (i = 0; i < Sx.N; i++) {
            M4.makeTranslation(Sx.x[3 * i] * k + off, Sx.x[3 * i + 1] * k + off, Sx.x[3 * i + 2] * k + off); mesh.setMatrixAt(i, M4);
            var c = caldo(Math.hypot(Sx.v[3 * i], Sx.v[3 * i + 1], Sx.v[3 * i + 2]) / (2 * vr)); mesh.setColorAt(i, col.setRGB(c[0], c[1], c[2]));
          }
          mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
        cb.nuova();
        var tt = 0;
        S.ogniFotogramma(function (dt) {
          if (st.pausa) return false;
          var np = Sx.N > 300 ? 3 : 5;
          for (var i = 0; i < np; i++) passo3D(Sx, 0.004, st.termo ? st.T : 0);
          aggiorna();
          tt += dt; if (tt > 0.25) { tt = 0; testo(); }
          S.didascalia.textContent = Sx.N + t(' atomi di Lennard-Jones', ' Lennard-Jones atoms') + ' · T* = ' + st.T.toFixed(2) + (st.termo ? '' : ' (NVE)') + ' · ρ* = ' + st.rho.toFixed(2);
          return true;
        });
        S.inquadra(15, 0.6, 1.15);
      }
    };
  }

  F.sezione('sdinmol', {
    titolo: ['🎱 Dinamica molecolare', '🎱 Molecular dynamics'],
    sotto: ['Un fluido di Lennard-Jones in due dimensioni simulato dal vivo (velocity Verlet, confini periodici): temperatura, pressione dal viriale, distribuzione di Maxwell-Boltzmann, funzione di distribuzione radiale, gas, liquido e cristallo.',
            'A two-dimensional Lennard-Jones fluid simulated live (velocity Verlet, periodic boundaries): temperature, virial pressure, Maxwell-Boltzmann distribution, radial distribution function, gas, liquid and crystal.'],
    schede: [{ nome: ['Simulatore', 'Simulator'], costruisci: schedaSimulatore },
             { nome: ['🧊 Scatola 3D', '🧊 3D box'], costruisci: scheda3D(schedaScatola3D) }]
  });
})(typeof window !== 'undefined' ? window : globalThis);
