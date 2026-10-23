/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-gravita.js — 🪐 gravitazione
   BioSpecInfo · © Samuele Pio Provenzano

   · N CORPI: integrazione con Verlet a velocita' (simplettico: l'energia
     oscilla ma non deriva); stella doppia, la figura a otto di Chenciner e
     Montgomery (tre masse uguali sulla stessa curva, periodo 6,3259), il
     problema pitagorico 3-4-5 (caos ed espulsione), un sistema planetario;
     l'energia e il momento angolare totali tenuti sotto controllo;
   · PUNTI DI LAGRANGE: il potenziale efficace nel sistema rotante di due
     masse, con L1…L5 calcolati per il rapporto di massa scelto (Terra-Luna,
     Sole-Terra, Sole-Giove); L4 e L5 stabili se μ < 0,0385 (troiani);
   · FIONDA GRAVITAZIONALE: una sonda passa vicino a un pianeta in moto; nel
     sistema del pianeta la velocita' all'infinito non cambia, in quello del
     Sole si': la sonda guadagna energia a spese del pianeta.
   Unita' con G = 1.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function accelerazioni(C, eps) { var n = C.length, a = []; for (var i = 0; i < n; i++) a.push([0, 0]); for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) { var dx = C[j].x - C[i].x, dy = C[j].y - C[i].y, r2 = dx * dx + dy * dy + eps * eps, r3 = r2 * Math.sqrt(r2); a[i][0] += C[j].m * dx / r3; a[i][1] += C[j].m * dy / r3; a[j][0] -= C[i].m * dx / r3; a[j][1] -= C[i].m * dy / r3; } return a; }
  function passoVerlet(C, dt, eps) {
    var a = accelerazioni(C, eps);
    C.forEach(function (c, i) { c.vx += 0.5 * dt * a[i][0]; c.vy += 0.5 * dt * a[i][1]; c.x += dt * c.vx; c.y += dt * c.vy; });
    var a2 = accelerazioni(C, eps); C.forEach(function (c, i) { c.vx += 0.5 * dt * a2[i][0]; c.vy += 0.5 * dt * a2[i][1]; });
  }
  function energia(C, eps) { var K = 0, U = 0; C.forEach(function (c) { K += 0.5 * c.m * (c.vx * c.vx + c.vy * c.vy); }); for (var i = 0; i < C.length; i++) for (var j = i + 1; j < C.length; j++) U -= C[i].m * C[j].m / Math.sqrt(Math.pow(C[j].x - C[i].x, 2) + Math.pow(C[j].y - C[i].y, 2) + eps * eps); return K + U; }
  function momentoAngolare(C) { return C.reduce(function (s, c) { return s + c.m * (c.x * c.vy - c.y * c.vx); }, 0); }
  var SISTEMI = {
    otto: { nome: ['figura a otto (Chenciner-Montgomery)', 'figure-eight (Chenciner-Montgomery)'], eps: 0, dt: 0.002, crea: function () { var x = 0.97000436, y = -0.24308753, vx = -0.93240737, vy = -0.86473146; return [{ m: 1, x: x, y: y, vx: -vx / 2, vy: -vy / 2 }, { m: 1, x: -x, y: -y, vx: -vx / 2, vy: -vy / 2 }, { m: 1, x: 0, y: 0, vx: vx, vy: vy }]; }, scala: 1.4 },
    doppia: { nome: ['stella doppia (orbite ellittiche)', 'binary star (elliptic orbits)'], eps: 0, dt: 0.002, crea: function () { return [{ m: 1, x: -0.5, y: 0, vx: 0, vy: -0.45 }, { m: 0.6, x: 0.5, y: 0, vx: 0, vy: 0.75 }]; }, scala: 1.5 },
    pitagora: { nome: ['problema pitagorico 3-4-5 (caos)', 'Pythagorean 3-4-5 problem (chaos)'], eps: 0.002, dt: 0.0005, crea: function () { return [{ m: 3, x: 1, y: 3, vx: 0, vy: 0 }, { m: 4, x: -2, y: -1, vx: 0, vy: 0 }, { m: 5, x: 1, y: -1, vx: 0, vy: 0 }]; }, scala: 6 },
    pianeti: { nome: ['stella con tre pianeti', 'star with three planets'], eps: 0, dt: 0.002, crea: function () { var C = [{ m: 1, x: 0, y: 0, vx: 0, vy: 0 }]; [[0.4, 0.001], [0.7, 0.003], [1.1, 0.002]].forEach(function (p, i) { var v = Math.sqrt(1 / p[0]), a = i * 2.1; C.push({ m: p[1], x: p[0] * Math.cos(a), y: p[0] * Math.sin(a), vx: -v * Math.sin(a), vy: v * Math.cos(a) }); }); var px = 0, py = 0; C.forEach(function (c) { px += c.m * c.vx; py += c.m * c.vy; }); C[0].vx = -px; C[0].vy = -py; return C; }, scala: 1.3 }
  };
  /* punti di Lagrange per due masse 1 − μ (in −μ) e μ (in 1 − μ), separazione 1, sistema rotante con ω = 1 */
  function potEff(x, y, mu) { var r1 = Math.hypot(x + mu, y), r2 = Math.hypot(x - 1 + mu, y); return -(1 - mu) / r1 - mu / r2 - 0.5 * (x * x + y * y); }
  function lagrange(mu) {
    function dx(x) { var r1 = Math.abs(x + mu), r2 = Math.abs(x - 1 + mu); return x - (1 - mu) * (x + mu) / Math.pow(r1, 3) - mu * (x - 1 + mu) / Math.pow(r2, 3); }
    function radice(a, b) { var fa = dx(a); for (var i = 0; i < 200; i++) { var m = (a + b) / 2, fm = dx(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; }
    return { L1: [radice(-mu + 1e-9, 1 - mu - 1e-9), 0], L2: [radice(1 - mu + 1e-9, 3), 0], L3: [radice(-3, -mu - 1e-9), 0], L4: [0.5 - mu, Math.sqrt(3) / 2], L5: [0.5 - mu, -Math.sqrt(3) / 2], stabiliL45: mu < 0.0385 };
  }
  /* fionda: pianeta di massa M in moto uniforme U lungo x, sonda che arriva da sotto; solo la gravita' del pianeta */
  function fionda(M, U, b, vin) {
    /* la sonda parte lontana (8 unita') lungo la sua direzione, spostata di b di lato: passera' a distanza ~b dal pianeta */
    var vv = Math.hypot(vin[0], vin[1]), ux = vin[0] / vv, uy = vin[1] / vv;
    var p = { x: -8 * ux - b * uy, y: -8 * uy + b * ux, vx: vin[0], vy: vin[1] }, dt = 0.0005, cam = [], tt = 0;
    for (var i = 0; i < 400000; i++) {
      var Px = U * tt, dxp = Px - p.x, dyp = -p.y, r3 = Math.pow(dxp * dxp + dyp * dyp, 1.5);
      p.vx += M * dxp / r3 * dt; p.vy += M * dyp / r3 * dt; p.x += p.vx * dt; p.y += p.vy * dt; tt += dt;
      if (i % 160 === 0) cam.push([p.x, p.y, Px, Math.hypot(p.vx, p.vy)]);
      if (Math.hypot(p.x - Px, p.y) > 30 && tt > 1) break;
    }
    /* velocita' relative «all'infinito»: v∞² = v² − 2M/r, all'inizio e alla fine (conservate nel sistema del pianeta) */
    var rF = Math.hypot(p.x - U * tt, p.y), vrF = Math.hypot(p.vx - U, p.vy), vinfOut = Math.sqrt(Math.max(0, vrF * vrF - 2 * M / rF)), r0 = 8 * Math.hypot(1, b / 8), vinfIn = Math.sqrt(Math.max(0, (vin[0] - U) * (vin[0] - U) + vin[1] * vin[1] - 2 * M / r0));
    /* direzione asintotica d'uscita = direzione della velocita' relativa finale (a grande distanza quasi rettilinea) */
    var ox = (p.vx - U) / vrF, oy = p.vy / vrF, vSoleOut = Math.hypot(U + vinfOut * ox, vinfOut * oy), vSoleIn = Math.hypot(U + vinfIn * (vin[0] - U) / Math.hypot(vin[0] - U, vin[1]), vinfIn * vin[1] / Math.hypot(vin[0] - U, vin[1]));
    return { cam: cam, vfin: vSoleOut, vin: vSoleIn, vinfIn: vinfIn, vinfOut: vinfOut, vxfin: p.vx, vyfin: p.vy };
  }
  F.calcolo.gravita = { accelerazioni: accelerazioni, passoVerlet: passoVerlet, energia: energia, momentoAngolare: momentoAngolare, SISTEMI: SISTEMI, potEff: potEff, lagrange: lagrange, fionda: fionda };

  /* ═══ 1. N corpi ════════════════════════════════════════════════════════ */
  function schedaNCorpi(div) {
    var G = griglia(div), st = { s: 'otto' }, info = nota(G.pan), C, scie, E0, L0, tt;
    F.scelta(G.pan, ['Sistema', 'System'], Object.keys(SISTEMI).map(function (k) { return [k, F.tt(SISTEMI[k].nome)]; }), st.s, function (v) { st.s = v; azzera(); ctl.sveglia(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.75), ctl, COL = ['#5eead4', '#ffd24a', '#ff8a80', '#6bcfff', '#c49bff'];
    function azzera() { var S = SISTEMI[st.s]; C = S.crea(); scie = C.map(function () { return []; }); E0 = energia(C, S.eps); L0 = momentoAngolare(C); tt = 0; }
    azzera();
    ctl = F.anima(cv, function (dt) {
      var S = SISTEMI[st.s], n = Math.max(1, Math.round(dt * 0.6 / S.dt));
      for (var k = 0; k < n; k++) passoVerlet(C, S.dt, S.eps); tt += n * S.dt;
      C.forEach(function (c, i) { scie[i].push([c.x, c.y]); if (scie[i].length > 1500) scie[i].shift(); });
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, sc = Math.min(W, H) / (2 * S.scala), X = function (x) { return W / 2 + x * sc; }, Y = function (y) { return H / 2 - y * sc; };
      scie.forEach(function (sc2, i) { q.strokeStyle = COL[i % 5]; q.globalAlpha = 0.55; q.beginPath(); sc2.forEach(function (p, j) { if (j) q.lineTo(X(p[0]), Y(p[1])); else q.moveTo(X(p[0]), Y(p[1])); }); q.stroke(); q.globalAlpha = 1; });
      C.forEach(function (c, i) { q.fillStyle = COL[i % 5]; q.beginPath(); q.arc(X(c.x), Y(c.y), Math.max(3, 5 * Math.cbrt(c.m / (st.s === 'pianeti' && i ? 0.001 : 1)) * (st.s === 'pianeti' && i ? 0.5 : 1)), 0, Math.PI * 2); q.fill(); });
      cv.setAttribute('aria-label', t('corpi che si attraggono', 'bodies attracting each other'));
      var E = energia(C, S.eps), L = momentoAngolare(C);
      if (Math.floor(tt * 4) !== Math.floor((tt - n * S.dt) * 4)) info.innerHTML = 't = ' + fmt(tt) + ' · ' + t('energia ', 'energy ') + fmt(E) + ' (' + t('scarto ', 'drift ') + fmt(Math.abs((E - E0) / E0)) + ') · ' + t('momento angolare ', 'angular momentum ') + fmt(L) + '<br>' + (st.s === 'otto' ? t('Tre masse uguali si inseguono sulla stessa curva a otto: soluzione periodica trovata numericamente nel 1993 e dimostrata nel 2000, periodo T = 6,3259. ', 'Three equal masses chase each other on the same figure-eight: a periodic solution found numerically in 1993 and proved in 2000, period T = 6.3259. ') : st.s === 'pitagora' ? t('Tre masse ferme ai vertici di un triangolo 3-4-5: dopo una danza caotica due formano una coppia stretta e la terza viene espulsa (Burrau 1913, risolto al calcolatore nel 1967). ', 'Three masses at rest at the vertices of a 3-4-5 triangle: after a chaotic dance two form a tight pair and the third is ejected (Burrau 1913, solved by computer in 1967). ') : '') + t('Verlet a velocità è simplettico: l’energia oscilla di poco ma non deriva nel tempo, a differenza di Eulero o Runge-Kutta.', 'Velocity Verlet is symplectic: energy oscillates slightly but does not drift over time, unlike Euler or Runge-Kutta.');
    }, { ricomincia: azzera });
  }

  /* ═══ 2. punti di Lagrange ══════════════════════════════════════════════ */
  var COPPIE = { tl: [['Terra-Luna', 'Earth-Moon'], 0.012150], st: [['Sole-Terra', 'Sun-Earth'], 3.003e-6], sg: [['Sole-Giove', 'Sun-Jupiter'], 9.537e-4], ug: [['masse uguali (instabili L4/L5)', 'equal masses (unstable L4/L5)'], 0.3] };
  function schedaLagrange(div) {
    var G = griglia(div), st = { c: 'tl' }, info = nota(G.pan);
    F.scelta(G.pan, ['Coppia', 'Pair'], Object.keys(COPPIE).map(function (k) { return [k, F.tt(COPPIE[k][0])]; }), st.c, function (v) { st.c = v; disegna(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.8);
    function disegna() {
      var mu = COPPIE[st.c][1], L = lagrange(mu), P = F.pennello(cv), q = P.q, W = P.W, H = P.H, Lx = 1.6, Ly = Lx * H / W, X = function (x) { return (x + Lx) / (2 * Lx) * W; }, Y = function (y) { return (Ly - y) / (2 * Ly) * H; };
      /* curve di livello del potenziale efficace */
      var N = 160, M = Math.round(N * H / W), Z = [];
      for (var i = 0; i <= N; i++) { Z.push([]); for (var j = 0; j <= M; j++) Z[i].push(Math.max(-3, potEff(-Lx + 2 * Lx * i / N, -Ly + 2 * Ly * j / M, mu))); }
      var livelli = []; ['L1', 'L2', 'L3', 'L4'].forEach(function (k) { livelli.push(potEff(L[k][0], L[k][1], mu)); }); for (var s = -2.2; s < -1.5; s += 0.05) livelli.push(s);
      livelli.forEach(function (lv, k2) {
        q.strokeStyle = k2 < 4 ? 'rgba(255,210,74,.75)' : 'rgba(107,207,255,.3)'; q.beginPath();
        for (i = 0; i < N; i++) for (j = 0; j < M; j++) { var v = [Z[i][j], Z[i + 1][j], Z[i + 1][j + 1], Z[i][j + 1]], c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], tg = []; for (var e = 0; e < 4; e++) { var a = v[e], b = v[(e + 1) % 4]; if ((a - lv) * (b - lv) < 0) { var f = (lv - a) / (b - a), A = c[e], B = c[(e + 1) % 4]; tg.push([A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]); } } if (tg.length >= 2) { q.moveTo(tg[0][0] / N * W, H - tg[0][1] / M * H); q.lineTo(tg[1][0] / N * W, H - tg[1][1] / M * H); } }
        q.stroke();
      });
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(X(-mu), Y(0), 10, 0, Math.PI * 2); q.fill(); q.fillStyle = '#6bcfff'; q.beginPath(); q.arc(X(1 - mu), Y(0), 5, 0, Math.PI * 2); q.fill();
      ['L1', 'L2', 'L3', 'L4', 'L5'].forEach(function (k) { var p = L[k]; q.fillStyle = (k === 'L4' || k === 'L5') && L.stabiliL45 ? '#5eead4' : '#ff8a80'; q.beginPath(); q.arc(X(p[0]), Y(p[1]), 4.5, 0, Math.PI * 2); q.fill(); q.fillStyle = '#e6fffb'; q.font = 'bold 12px system-ui'; q.fillText(k, X(p[0]) + 6, Y(p[1]) - 6); });
      cv.setAttribute('aria-label', t('potenziale efficace e punti di Lagrange', 'effective potential and Lagrange points'));
      var sep = st.c === 'tl' ? 384400 : st.c === 'st' ? 149.6e6 : st.c === 'sg' ? 778.5e6 : 1;
      info.innerHTML = 'μ = m₂/(m₁ + m₂) = ' + mu + '<br>L1 = ' + fmt(L.L1[0]) + ' · L2 = ' + fmt(L.L2[0]) + ' · L3 = ' + fmt(L.L3[0]) + t(' (in unità della separazione, dal baricentro)', ' (in units of the separation, from the barycentre)') + (sep > 1 ? '<br>' + t('L1 dista dal corpo minore ', 'L1 is at a distance from the smaller body of ') + '<b>' + fmt((1 - mu - L.L1[0]) * sep) + ' km</b>, L2 ' + fmt((L.L2[0] - 1 + mu) * sep) + ' km' + (st.c === 'st' ? t(' (qui stanno i telescopi JWST e Gaia)', ' (where the JWST and Gaia telescopes sit)') : '') : '') + '<br>' + (L.stabiliL45 ? t('L4 e L5 (verdi) sono stabili perché μ < 0,0385: vi si raccolgono gli asteroidi troiani di Giove.', 'L4 and L5 (green) are stable because μ < 0.0385: Jupiter’s Trojan asteroids gather there.') : t('Con μ > 0,0385 anche L4 e L5 diventano instabili.', 'With μ > 0.0385 L4 and L5 also become unstable.')) + ' ' + t('L1, L2, L3 sono punti di sella (rossi): instabili, servono correzioni continue.', 'L1, L2, L3 are saddle points (red): unstable, continuous corrections are needed.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. fionda gravitazionale ══════════════════════════════════════════ */
  function schedaFionda(div) {
    var G = griglia(div), st = { U: 1, b: 0.8, v: 1 }, info = nota(G.pan), R, k = 0;
    F.cursore(G.pan, ['velocità del pianeta U', 'planet speed U'], 0, 2, 0.05, st.U, function (v) { st.U = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['parametro d’impatto b', 'impact parameter b'], 0.2, 3, 0.05, st.b, function (v) { st.b = v; calcola(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.7), ctl;
    function calcola() {
      R = fionda(1, st.U, st.b, [0, st.v]); k = 0; if (ctl) ctl.sveglia();
      var relIn = R.vinfIn, relOut = R.vinfOut;
      info.innerHTML = t('Velocità asintotica della sonda nel sistema del Sole: ', 'Asymptotic probe speed in the Sun’s frame: ') + fmt(R.vin) + ' → <b class="bsiFX-num">' + fmt(R.vfin) + '</b> (' + (R.vfin > R.vin ? '+' : '') + fmt((R.vfin / R.vin - 1) * 100) + ' %)<br>' + t('Nel sistema del pianeta: ', 'In the planet’s frame: ') + fmt(relIn) + ' → ' + fmt(relOut) + t(' (uguali: lì l’urto è elastico)', ' (equal: there the encounter is elastic)') + '<br>' + t('La sonda che passa DIETRO al pianeta in moto viene trascinata in avanti e guadagna velocità; il pianeta ne perde una quantità impercettibile. Così Voyager e Cassini sono arrivati ai pianeti esterni.', 'A probe passing BEHIND the moving planet is dragged forward and gains speed; the planet loses an imperceptible amount. That is how Voyager and Cassini reached the outer planets.');
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      k = Math.min(R.cam.length - 1, k + dt * 120);
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, sc = Math.min(W, H) / 16, X = function (x) { return W / 2 + x * sc; }, Y = function (y) { return H / 2 - y * sc; }, p = R.cam[Math.floor(k)];
      q.strokeStyle = 'rgba(94,234,212,.8)'; q.lineWidth = 2; q.beginPath(); R.cam.slice(0, Math.floor(k) + 1).forEach(function (c, i) { if (i) q.lineTo(X(c[0] - p[2]), Y(c[1])); else q.moveTo(X(c[0] - p[2]), Y(c[1])); }); q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#e0b98a'; q.beginPath(); q.arc(X(0), Y(0), 10, 0, Math.PI * 2); q.fill();
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(X(p[0] - p[2]), Y(p[1]), 4, 0, Math.PI * 2); q.fill();
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.fillText(t('vista dal pianeta (che va verso destra a U) · |v| = ', 'seen from the planet (moving right at U) · |v| = ') + p[3].toFixed(2), 10, 16);
      cv.setAttribute('aria-label', t('fionda gravitazionale', 'gravity assist'));
      if (k >= R.cam.length - 1) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  F.sezione('sfisgrav', {
    titolo: ['🪐 Gravitazione', '🪐 Gravitation'],
    sotto: ['Il problema degli N corpi con Verlet (figura a otto, stella doppia, problema pitagorico, sistema planetario), i punti di Lagrange nel potenziale efficace, la fionda gravitazionale.', 'The N-body problem with Verlet (figure-eight, binary star, Pythagorean problem, planetary system), Lagrange points in the effective potential, the gravity assist.'],
    schede: [
      { nome: ['🌌 N corpi', '🌌 N bodies'], costruisci: schedaNCorpi },
      { nome: ['⚖️ Punti di Lagrange', '⚖️ Lagrange points'], costruisci: schedaLagrange },
      { nome: ['🚀 Fionda gravitazionale', '🚀 Gravity assist'], costruisci: schedaFionda }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
