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
     Sole si': la sonda guadagna energia a spese del pianeta;
   · POZZO DI POTENZIALE 3D (v238): il telo −GM/r con un'orbita di prova
     (E e L conservati, conica di Keplero prevista) e il potenziale efficace
     rotante con L1…L5 e un troiano attorno a L4 (costante di Jacobi).
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
  /* v238 — il problema ristretto dei tre corpi nel sistema rotante (ω = 1, separazione 1, G(m₁+m₂) = 1).
     U = potEff; la particella di prova sente −∇U e la forza di Coriolis:
     ẍ = −∂U/∂x + 2ẏ,  ÿ = −∂U/∂y − 2ẋ.  Si conserva la costante di Jacobi C = −2U − v². */
  function gradEff(x, y, mu) {
    var a = x + mu, b = x - 1 + mu, r1 = Math.sqrt(a * a + y * y), r2 = Math.sqrt(b * b + y * y), q1 = (1 - mu) / (r1 * r1 * r1), q2 = mu / (r2 * r2 * r2);
    return [q1 * a + q2 * b - x, q1 * y + q2 * y - y];
  }
  function passoR3C(s, mu, dt) {
    function f(u) { var g = gradEff(u[0], u[1], mu); return [u[2], u[3], -g[0] + 2 * u[3], -g[1] - 2 * u[2]]; }
    var k1 = f(s), k2 = f(s.map(function (x, j) { return x + dt / 2 * k1[j]; })), k3 = f(s.map(function (x, j) { return x + dt / 2 * k2[j]; })), k4 = f(s.map(function (x, j) { return x + dt * k3[j]; }));
    return s.map(function (x, j) { return x + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); });
  }
  function jacobi(s, mu) { return -2 * potEff(s[0], s[1], mu) - (s[2] * s[2] + s[3] * s[3]); }
  /* l'orbita di Keplero (GM = 1) di chi parte a distanza r₀ con velocita' v₀ perpendicolare al raggio:
     energia E, momento angolare L, semiasse a, eccentricita' e, semilato retto p = L²;
     con e «col segno» r(θ) = p/(1 + e cos θ) passa per la partenza in θ = 0 */
  function kepler(r0, v0) {
    var E = v0 * v0 / 2 - 1 / r0, L = r0 * v0, p = L * L, es = p / r0 - 1;
    return { E: E, L: L, p: p, e: Math.abs(es), eSegno: es, a: E < 0 ? -1 / (2 * E) : Infinity, T: E < 0 ? 2 * Math.PI * Math.pow(-1 / (2 * E), 1.5) : Infinity, vc: 1 / Math.sqrt(r0), vfuga: Math.sqrt(2 / r0) };
  }
  F.calcolo.gravita = { accelerazioni: accelerazioni, passoVerlet: passoVerlet, energia: energia, momentoAngolare: momentoAngolare, SISTEMI: SISTEMI, potEff: potEff, lagrange: lagrange, fionda: fionda, gradEff: gradEff, passoR3C: passoR3C, jacobi: jacobi, kepler: kepler };

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

  /* ═══ la scheda 3D (v238) ═══════════════════════════════════════════════
     Il pannello compare subito; la scena quando three.js e' pronto, costruita in un
     compito separato, cosi' il clic sulla scheda resta leggero. Nella barra della vista
     un tasto ferma e riavvia il moto; con «riduci movimento» la scena parte ferma. */
  function scheda3D(costruisci) {
    return function (div) {
      var g3 = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g3.appendChild(pan); g3.appendChild(destra); div.appendChild(g3);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        attesa.remove();
        var S = new L3.Scena(destra, 0.66);
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.etichetta)); S.ren.domElement.setAttribute('aria-label', F.tt(ctx.etichetta));
        tastoPausa(S);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function tastoPausa(S) {
    var MENO = false; try { MENO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
    S.fermo = MENO;
    var barra = S.box.querySelector('.bsi3d-barra'); if (!barra) return;
    var b = F.el('button', { type: 'button' });
    function aggiorna() { b.textContent = S.fermo ? '▶' : '❚❚'; var n = S.fermo ? t('Avvia il moto', 'Play the motion') : t('Ferma il moto', 'Pause the motion'); b.title = n; b.setAttribute('aria-label', n); b.setAttribute('aria-pressed', String(S.fermo)); }
    b.addEventListener('click', function (e) { e.stopPropagation(); S.fermo = !S.fermo; aggiorna(); if (!S.fermo) S.avvia(); });
    aggiorna(); barra.insertBefore(b, barra.firstChild);
  }
  function svuota(gr) {
    while (gr.children.length) { var o = gr.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); }
  }
  function puntaFreccia(T, fr, p, d) {
    var L = Math.hypot(d[0], d[1], d[2]); fr.visible = L > 0.03; if (!fr.visible) return;
    fr.position.set(p[0], p[1], p[2]); fr.setDirection(new T.Vector3(d[0] / L, d[1] / L, d[2] / L));
    var h = Math.min(0.25, L * 0.4); fr.setLength(L, h, h * 0.6);
  }

  /* ═══ 4. il pozzo di potenziale in 3D (v238) ═══════════════════════════
     Il «telo elastico»: la quota del telo e' il potenziale (per unita' di massa della particella
     di prova). Due modi: il pozzo −GM/r di una stella con un'orbita di prova integrata con Verlet,
     e il potenziale efficace del sistema rotante di due masse con i punti di Lagrange. */
  function schedaPozzo(pan) {
    var st = { modo: 'stella', r0: 1.5, f: 0.8, c: 'sg', sp: 0.01 }, cb = {};
    F.scelta(pan, ['Che cosa', 'What'], [['stella', t('pozzo di una stella: orbita di prova', 'well of a star: test orbit')], ['lagrange', t('due masse nel sistema rotante: punti di Lagrange', 'two masses in the rotating frame: Lagrange points')]], st.modo, function (v) { st.modo = v; gS.style.display = v === 'stella' ? '' : 'none'; gL.style.display = v === 'stella' ? 'none' : ''; nuovo(); });
    var gS = F.el('div'), gL = F.el('div', { style: 'display:none' }); pan.appendChild(gS); pan.appendChild(gL);
    F.cursore(gS, ['distanza di partenza r₀', 'starting distance r₀'], 0.8, 2.5, 0.05, st.r0, function (v) { st.r0 = v; nuovo(); }, function (v) { return v.toFixed(2); });
    F.cursore(gS, ['velocità di lancio v₀ / v_circolare', 'launch speed v₀ / v_circular'], 0.3, 1.6, 0.01, st.f, function (v) { st.f = v; nuovo(); }, function (v) { return v.toFixed(2); });
    F.scelta(gL, ['Coppia', 'Pair'], Object.keys(COPPIE).map(function (k) { return [k, F.tt(COPPIE[k][0])]; }), st.c, function (v) { st.c = v; nuovo(); });
    F.cursore(gL, ['spostamento della particella da L4', 'test particle offset from L4'], 0, 0.2, 0.005, st.sp, function (v) { st.sp = v; nuovo(); }, function (v) { return v.toFixed(3); });
    var info = nota(pan), vivo = nota(pan), spiega = nota(pan);
    function testoSpiega() {
      spiega.innerHTML = st.modo === 'stella' ? t('Il telo è il potenziale Φ = −GM/r: più si scende, più l’energia di legame è grande. La pallina gialla è una particella di prova lanciata perpendicolarmente al raggio; la sua orbita è integrata con Verlet a velocità (lo stesso motore della scheda N corpi), la linea tratteggiata è la conica di Keplero prevista con a, e e T. Energia E = ½v² − GM/r e momento angolare L = r × v restano costanti: per questo la pallina accelera scendendo nel pozzo e rallenta risalendo (legge delle aree). Sopra v_fuga = √2 v_c l’orbita si apre.',
        'The sheet is the potential Φ = −GM/r: the lower, the more tightly bound. The yellow ball is a test particle launched perpendicular to the radius; its orbit is integrated with velocity Verlet (the same engine as the N-body tab), the dashed line is the Kepler conic predicted from a, e and T. Energy E = ½v² − GM/r and angular momentum L = r × v stay constant: that is why the ball speeds up going down into the well and slows down climbing out (law of areas). Above v_esc = √2 v_c the orbit opens up.') :
        t('Nel sistema che ruota con le due masse il telo è il potenziale efficace, gravità più centrifuga. L1, L2, L3 sono selle; L4 e L5 sono CIME, eppure per μ < 0,0385 vi si resta: la forza di Coriolis trasforma la caduta in un’orbita a girino attorno al punto (gli asteroidi troiani di Giove); spostando di più la particella il girino si allunga in un ferro di cavallo che abbraccia L3, L4 e L5. La particella è integrata con Runge-Kutta 4 e si conserva la costante di Jacobi C = −2U − v².',
        'In the frame rotating with the two masses the sheet is the effective potential, gravity plus centrifugal. L1, L2, L3 are saddles; L4 and L5 are HILLTOPS, yet for μ < 0.0385 one stays there: the Coriolis force turns the fall into a tadpole orbit around the point (Jupiter’s Trojan asteroids); with a larger offset the tadpole stretches into a horseshoe embracing L3, L4 and L5. The particle is integrated with fourth-order Runge-Kutta and the Jacobi constant C = −2U − v² is conserved.');
    }
    var K, Lg;
    function nuovo() {
      testoSpiega();
      if (st.modo === 'stella') {
        K = kepler(st.r0, st.f / Math.sqrt(st.r0));
        info.innerHTML = 'v_c = √(GM/r₀) = ' + fmt(K.vc) + ' · v_fuga = √2 v_c = ' + fmt(K.vfuga) + ' · v₀ = <b class="bsiFX-num">' + fmt(st.f * K.vc) + '</b><br>E = ½v₀² − GM/r₀ = <b class="bsiFX-num">' + fmt(K.E) + '</b> · L = r₀v₀ = <b class="bsiFX-num">' + fmt(K.L) + '</b><br>' +
          (K.E < 0 ? t('Ellisse: ', 'Ellipse: ') + 'a = −GM/2E = <b>' + fmt(K.a) + '</b>, e = <b>' + fmt(K.e) + '</b>, T = 2π√(a³/GM) = <b>' + fmt(K.T) + '</b>' + (Math.abs(st.f - 1) < 0.005 ? t(' (circolare)', ' (circular)') : st.f < 1 ? t(' — parte dall’afelio', ' — starts at aphelion') : t(' — parte dal perielio', ' — starts at perihelion')) : t('Energia ≥ 0: l’orbita è ', 'Energy ≥ 0: the orbit is ') + (K.e > 1.0001 ? t('un’iperbole', 'a hyperbola') : t('una parabola', 'a parabola')) + ' (e = ' + fmt(K.e) + t('), la particella sfugge.', '), the particle escapes.'));
      } else {
        var mu = COPPIE[st.c][1]; Lg = lagrange(mu);
        info.innerHTML = 'μ = ' + mu + ' · L1 = ' + fmt(Lg.L1[0]) + ' · L2 = ' + fmt(Lg.L2[0]) + ' · L3 = ' + fmt(Lg.L3[0]) + '<br>U(L1) = ' + fmt(potEff(Lg.L1[0], 0, mu)) + ' · U(L4) = ' + fmt(potEff(Lg.L4[0], Lg.L4[1], mu)) + '<br>' + (Lg.stabiliL45 ? t('μ < 0,0385: L4 e L5 stabili (verdi).', 'μ < 0.0385: L4 and L5 stable (green).') : t('μ > 0,0385: anche L4 e L5 sono instabili, la particella scappa.', 'μ > 0.0385: L4 and L5 are unstable too, the particle escapes.'));
      }
      if (cb.nuovo) cb.nuovo();
    }
    nuovo();
    return {
      etichetta: ['Pozzo di potenziale gravitazionale in 3D con orbite di prova e punti di Lagrange', '3D gravitational potential well with test orbits and Lagrange points'],
      tre: function (S, T, L3) {
        var NG = 100, telo = null, rete = null, gr = new T.Group(); S.aggiungi(gr);
        var palla = L3.sfera(T, 0.07, 0xffd24a, 0, 0, 0, true); S.aggiungi(palla);
        var NS = 3000, sp = new Float32Array(NS * 3), ns = 0, gs = new T.BufferGeometry(); gs.setAttribute('position', new T.BufferAttribute(sp, 3)); gs.setDrawRange(0, 0);
        var scia = new T.Line(gs, new T.LineBasicMaterial({ color: 0xffe08a })); S.aggiungi(scia);
        var C, s3, mu, tt, tV = 0, E0, L0, J0, LATO, quota, modoVisto = null;
        function colore(u) { u = Math.max(0, Math.min(1, u)); var a = [[0.10, 0.12, 0.35], [0.12, 0.45, 0.62], [0.30, 0.78, 0.62], [0.95, 0.88, 0.35]], x = u * 3, i = Math.min(2, Math.floor(x)), f = x - i; return [a[i][0] + (a[i + 1][0] - a[i][0]) * f, a[i][1] + (a[i + 1][1] - a[i][1]) * f, a[i][2] + (a[i + 1][2] - a[i][2]) * f]; }
        function superficie(n, conColore) {
          var geo = new T.PlaneGeometry(LATO, LATO, n, n), pos = geo.attributes.position, c = new Float32Array(pos.count * 3), zmin = Infinity, zmax = -Infinity, i;
          for (i = 0; i < pos.count; i++) { var z = quota(pos.getX(i), pos.getY(i)); pos.setZ(i, z); zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); }
          if (conColore) { for (i = 0; i < pos.count; i++) { var u = (pos.getZ(i) - zmin) / (zmax - zmin || 1), k = colore(st.modo === 'stella' ? Math.pow(u, 4) : u); c[3 * i] = k[0]; c[3 * i + 1] = k[1]; c[3 * i + 2] = k[2]; } geo.setAttribute('color', new T.BufferAttribute(c, 3)); }
          geo.computeVertexNormals(); return geo;
        }
        cb.nuovo = function () {
          svuota(gr); ns = 0; gs.setDrawRange(0, 0); tt = 0;
          if (st.modo === 'stella') {
            LATO = 6.4; quota = function (x, y) { return 0.6 * Math.max(-1 / Math.hypot(x, y), -3.2); };
            C = [{ m: 1, x: 0, y: 0, vx: 0, vy: 0 }, { m: 1e-12, x: st.r0, y: 0, vx: 0, vy: st.f / Math.sqrt(st.r0) }];
            E0 = energia(C, 0) / C[1].m; L0 = momentoAngolare(C) / C[1].m;
            gr.add(L3.sfera(T, 0.16, 0xffc45a, 0, 0, quota(0, 0.06) + 0.05, true));
            /* la conica prevista, sul telo */
            var pts = []; for (var k = 0; k <= 720; k++) { var th = 2 * Math.PI * k / 720, den = 1 + K.eSegno * Math.cos(th), r = den > 1e-3 ? K.p / den : Infinity; if (r < LATO / 2 * 1.4 && r > 0.05) pts.push([r * Math.cos(th), r * Math.sin(th), quota(r * Math.cos(th), r * Math.sin(th)) + 0.02]); else if (pts.length > 1) { gr.add(L3.linea(T, pts, 0xff8a80, 0.55)); pts = []; } }
            if (pts.length > 1) gr.add(L3.linea(T, pts, 0xff8a80, 0.55));
          } else {
            mu = COPPIE[st.c][1]; LATO = 3.1;
            quota = function (x, y) { return 1.7 * (Math.max(potEff(x, y, mu), -2.6) + 1.5); };
            var L4 = Lg.L4; s3 = [L4[0] + st.sp * 0.7, L4[1] - st.sp * 0.7, 0, 0]; J0 = jacobi(s3, mu);
            gr.add(L3.sfera(T, 0.11, 0xffc45a, -mu, 0, quota(-mu + 0.04, 0) + 0.05, true));
            gr.add(L3.sfera(T, 0.05 + 0.08 * Math.cbrt(mu / 0.3), 0x6bcfff, 1 - mu, 0, quota(1 - mu + 0.04, 0) + 0.05, true));
            ['L1', 'L2', 'L3', 'L4', 'L5'].forEach(function (nm) {
              var p = Lg[nm], stab = (nm === 'L4' || nm === 'L5') && Lg.stabiliL45, z = quota(p[0], p[1]);
              gr.add(L3.sfera(T, 0.045, stab ? 0x5eead4 : 0xff6b6b, p[0], p[1], z + 0.02, true));
              var e = L3.testo3d(T, nm, stab ? '#5eead4' : '#ff8a80', 0.17); e.position.set(p[0], p[1], z + 0.22); gr.add(e);
            });
          }
          if (telo) { S.radice.remove(telo); telo.geometry.dispose(); telo.material.dispose(); }
          if (rete) { S.radice.remove(rete); rete.geometry.dispose(); rete.material.dispose(); }
          telo = new T.Mesh(superficie(NG, true), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05, side: T.DoubleSide, transparent: true, opacity: 0.92 })); S.aggiungi(telo);
          rete = new T.LineSegments(new T.WireframeGeometry(superficie(32, false)), new T.LineBasicMaterial({ color: 0xcfe3f7, transparent: true, opacity: 0.16 })); S.aggiungi(rete);
          posa();
          if (modoVisto !== st.modo) { modoVisto = st.modo; S.inquadra(st.modo === 'stella' ? 9.5 : 6.2, -1.2, 0.9); }
        };
        function posa() {
          var x, y; if (st.modo === 'stella') { x = C[1].x - C[0].x; y = C[1].y - C[0].y; } else { x = s3[0]; y = s3[1]; }
          var z = quota(x, y) + 0.06; palla.position.set(x, y, z); palla.visible = Math.abs(x) < LATO / 2 && Math.abs(y) < LATO / 2;
          if (palla.visible) { if (ns >= NS) { sp.copyWithin(0, 3); ns = NS - 1; } sp[3 * ns] = x; sp[3 * ns + 1] = y; sp[3 * ns + 2] = z - 0.03; ns++; gs.attributes.position.needsUpdate = true; gs.setDrawRange(0, ns); }
        }
        cb.nuovo();
        S.ogniFotogramma(function (dt) {
          if (S.fermo) return false;
          var testo;
          if (st.modo === 'stella') {
            var h = 0.002, n = Math.max(1, Math.round(dt * 2.5 / h)); for (var i = 0; i < n; i++) passoVerlet(C, h, 0); tt += n * h;
            var E = energia(C, 0) / C[1].m, L = momentoAngolare(C) / C[1].m, r = Math.hypot(C[1].x, C[1].y);
            if (r > 9 || r < 0.03) cb.nuovo();
            testo = 'E = <b class="bsiFX-num">' + E.toFixed(6) + '</b> (' + t('scarto ', 'drift ') + Math.abs((E - E0) / E0).toExponential(1) + ') · L = <b class="bsiFX-num">' + L.toFixed(6) + '</b> (' + t('scarto ', 'drift ') + Math.abs((L - L0) / L0).toExponential(1) + ')<br>r = ' + r.toFixed(3) + ', |v| = ' + Math.hypot(C[1].vx, C[1].vy).toFixed(3);
            S.didascalia.textContent = 't = ' + tt.toFixed(1) + (isFinite(K.T) ? ' · T = ' + K.T.toFixed(2) : '') + ' · r = ' + r.toFixed(2);
          } else {
            var h2 = 0.002, n2 = Math.max(1, Math.round(dt * 3 / h2)); for (var j = 0; j < n2; j++) s3 = passoR3C(s3, mu, h2); tt += n2 * h2;
            var J = jacobi(s3, mu), dL4 = Math.hypot(s3[0] - Lg.L4[0], s3[1] - Lg.L4[1]);
            if (Math.hypot(s3[0], s3[1]) > 2.5 || tt > 400) cb.nuovo();
            testo = t('Costante di Jacobi ', 'Jacobi constant ') + 'C = <b class="bsiFX-num">' + J.toFixed(8) + '</b> (' + t('scarto ', 'drift ') + Math.abs((J - J0) / J0).toExponential(1) + ')<br>' + t('distanza da L4: ', 'distance from L4: ') + dL4.toFixed(3);
            S.didascalia.textContent = t('sistema rotante · t = ', 'rotating frame · t = ') + tt.toFixed(1) + ' · ' + t('da L4: ', 'from L4: ') + dL4.toFixed(3);
          }
          posa();
          tV += dt; if (tV > 0.3) { tV = 0; vivo.innerHTML = testo; }
          return true;
        });
      }
    };
  }

  F.sezione('sfisgrav', {
    titolo: ['🪐 Gravitazione', '🪐 Gravitation'],
    sotto: ['Il problema degli N corpi con Verlet (figura a otto, stella doppia, problema pitagorico, sistema planetario), i punti di Lagrange nel potenziale efficace, la fionda gravitazionale.', 'The N-body problem with Verlet (figure-eight, binary star, Pythagorean problem, planetary system), Lagrange points in the effective potential, the gravity assist.'],
    schede: [
      { nome: ['🌌 N corpi', '🌌 N bodies'], costruisci: schedaNCorpi },
      { nome: ['⚖️ Punti di Lagrange', '⚖️ Lagrange points'], costruisci: schedaLagrange },
      { nome: ['🚀 Fionda gravitazionale', '🚀 Gravity assist'], costruisci: schedaFionda },
      { nome: ['🕳️ Pozzo di potenziale 3D', '🕳️ 3D potential well'], costruisci: scheda3D(schedaPozzo) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
