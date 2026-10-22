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
  F.calcolo.dinamica = { sistema: sistema, passo: passo, misure: misure, rdf: rdf, forze: forze };

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

  F.sezione('sdinmol', {
    titolo: ['🎱 Dinamica molecolare', '🎱 Molecular dynamics'],
    sotto: ['Un fluido di Lennard-Jones in due dimensioni simulato dal vivo (velocity Verlet, confini periodici): temperatura, pressione dal viriale, distribuzione di Maxwell-Boltzmann, funzione di distribuzione radiale, gas, liquido e cristallo.',
            'A two-dimensional Lennard-Jones fluid simulated live (velocity Verlet, periodic boundaries): temperature, virial pressure, Maxwell-Boltzmann distribution, radial distribution function, gas, liquid and crystal.'],
    schede: [{ nome: ['Simulatore', 'Simulator'], costruisci: schedaSimulatore }]
  });
})(typeof window !== 'undefined' ? window : globalThis);
