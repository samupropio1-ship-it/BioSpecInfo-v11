/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-termo.js — 🔥 termodinamica in movimento
   BioSpecInfo · © Samuele Pio Provenzano

   · CICLI: Carnot, Otto, Diesel e Stirling per una mole di gas ideale nel
     piano p-V e nel piano T-S; il punto di stato percorre il ciclo, l'area
     racchiusa e' il lavoro; per ogni trasformazione Q, L e ΔU calcolati
     dalle leggi del gas ideale, e il rendimento confrontato con la sua
     formula (1 − T_f/T_c; 1 − r^(1−γ); Diesel con il rapporto di
     combustione; Stirling con rigeneratore ideale = Carnot);
   · GAS DI PARTICELLE: dischi che si urtano elasticamente in una scatola;
     l'istogramma delle velocita' converge alla distribuzione di Maxwell-
     Boltzmann in due dimensioni f(v) = (m v/kT) e^(−mv²/2kT), qualunque sia
     la distribuzione di partenza; la pressione misurata dagli urti sulle
     pareti confrontata con p A = N k T;
   · MOTO BROWNIANO: cammini casuali; lo spostamento quadratico medio
     cresce linearmente nel tempo, ⟨r²⟩ = 4 D t (Einstein);
   · SUPERFICIE p-V-T 3D (v238): pV = RT con i cicli percorsi da un punto,
     e la superficie di van der Waals con la cupola di Maxwell e il punto critico.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, R = 8.314462618;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  /* il motore comune delle animazioni (pausa, velocita', ricomincia) e la tela pulita */
  var anima = F.anima, pennello = F.pennello;
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ cicli ═════════════════════════════════════════════════════════════ */
  /* ogni trasformazione: { nome, tipo, da:[p,V,T], a:[p,V,T], Q, L, dU, dS, punti:[[V,p,T,S]] } per n = 1 mol */
  function trasf(nome, tipo, A, B, cv, S0) {
    var n = 1, cp = cv + R, pts = [], Q, L, dU = n * cv * (B[2] - A[2]), dS;
    if (tipo === 'isoterma') { L = n * R * A[2] * Math.log(B[1] / A[1]); Q = L; dS = n * R * Math.log(B[1] / A[1]); }
    else if (tipo === 'adiabatica') { L = -dU; Q = 0; dS = 0; }
    else if (tipo === 'isocora') { L = 0; Q = dU; dS = n * cv * Math.log(B[2] / A[2]); }
    else { L = A[0] * (B[1] - A[1]); Q = n * cp * (B[2] - A[2]); dS = n * cp * Math.log(B[2] / A[2]); }
    var g = cp / cv;
    for (var i = 0; i <= 60; i++) {
      var u = i / 60, V, p, T;
      if (tipo === 'isoterma') { V = A[1] * Math.pow(B[1] / A[1], u); T = A[2]; p = n * R * T / V; }
      else if (tipo === 'adiabatica') { V = A[1] * Math.pow(B[1] / A[1], u); p = A[0] * Math.pow(A[1] / V, g); T = p * V / (n * R); }
      else if (tipo === 'isocora') { V = A[1]; T = A[2] + (B[2] - A[2]) * u; p = n * R * T / V; }
      else { p = A[0]; V = A[1] + (B[1] - A[1]) * u; T = p * V / (n * R); }
      var S = S0 + n * cv * Math.log(T / A[2]) + n * R * Math.log(V / A[1]);
      pts.push([V, p, T, S]);
    }
    return { nome: nome, tipo: tipo, Q: Q, L: L, dU: dU, dS: dS, punti: pts, S1: pts[pts.length - 1][3] };
  }
  function stato(p, V) { return [p, V, p * V / R]; }
  function ciclo(tipo, P) {
    var cv = P.gamma === 1.4 ? 2.5 * R : 1.5 * R, g = (cv + R) / cv, T, out = [];
    if (tipo === 'carnot') {
      var Tc = P.Tc, Tf = P.Tf, V1 = 0.01, V2 = V1 * P.r, A = [R * Tc / V1, V1, Tc], B = [R * Tc / V2, V2, Tc], V3 = V2 * Math.pow(Tc / Tf, 1 / (g - 1)), Cc = [R * Tf / V3, V3, Tf], V4 = V1 * Math.pow(Tc / Tf, 1 / (g - 1)), D = [R * Tf / V4, V4, Tf];
      var s = 0, a1 = trasf(t('espansione isoterma a T_c', 'isothermal expansion at T_h'), 'isoterma', A, B, cv, s); s = a1.S1;
      var a2 = trasf(t('espansione adiabatica', 'adiabatic expansion'), 'adiabatica', B, Cc, cv, s); s = a2.S1;
      var a3 = trasf(t('compressione isoterma a T_f', 'isothermal compression at T_c'), 'isoterma', Cc, D, cv, s); s = a3.S1;
      var a4 = trasf(t('compressione adiabatica', 'adiabatic compression'), 'adiabatica', D, A, cv, s);
      out = [a1, a2, a3, a4]; out.teorico = 1 - Tf / Tc; out.formula = '1 − T_f/T_c';
    } else if (tipo === 'otto') {
      var V1o = 0.024, V2o = V1o / P.r, A1 = stato(1e5, V1o), B1 = [A1[0] * Math.pow(P.r, g), V2o, 0]; B1[2] = B1[0] * V2o / R;
      /* la combustione scalda: la temperatura massima non puo' stare sotto quella di fine compressione */
      var Tmax = Math.max(P.Tc, B1[2] * 1.2); out.avviso = Tmax > P.Tc ? Tmax : 0;
      var C1 = [0, V2o, Tmax]; C1[0] = R * Tmax / V2o; var D1 = [C1[0] * Math.pow(1 / P.r, g), V1o, 0]; D1[2] = D1[0] * V1o / R;
      var s2 = 0, b1 = trasf(t('compressione adiabatica', 'adiabatic compression'), 'adiabatica', A1, B1, cv, s2); s2 = b1.S1;
      var b2 = trasf(t('combustione a volume costante', 'combustion at constant volume'), 'isocora', B1, C1, cv, s2); s2 = b2.S1;
      var b3 = trasf(t('espansione adiabatica', 'adiabatic expansion'), 'adiabatica', C1, D1, cv, s2); s2 = b3.S1;
      var b4 = trasf(t('scarico a volume costante', 'exhaust at constant volume'), 'isocora', D1, A1, cv, s2);
      var avv = out.avviso; out = [b1, b2, b3, b4]; out.avviso = avv; out.teorico = 1 - Math.pow(P.r, 1 - g); out.formula = '1 − r^(1−γ)';
    } else if (tipo === 'diesel') {
      var V1d = 0.024, V2d = V1d / P.r, Ad = stato(1e5, V1d), Bd = [Ad[0] * Math.pow(P.r, g), V2d, 0]; Bd[2] = Bd[0] * V2d / R;
      var rc = P.rc, Cd = [Bd[0], V2d * rc, 0]; Cd[2] = Cd[0] * Cd[1] / R; var Dd = [Cd[0] * Math.pow(Cd[1] / V1d, g), V1d, 0]; Dd[2] = Dd[0] * V1d / R;
      var s3 = 0, c1 = trasf(t('compressione adiabatica', 'adiabatic compression'), 'adiabatica', Ad, Bd, cv, s3); s3 = c1.S1;
      var c2 = trasf(t('combustione a pressione costante', 'combustion at constant pressure'), 'isobara', Bd, Cd, cv, s3); s3 = c2.S1;
      var c3 = trasf(t('espansione adiabatica', 'adiabatic expansion'), 'adiabatica', Cd, Dd, cv, s3); s3 = c3.S1;
      var c4 = trasf(t('scarico a volume costante', 'exhaust at constant volume'), 'isocora', Dd, Ad, cv, s3);
      out = [c1, c2, c3, c4]; out.teorico = 1 - Math.pow(P.r, 1 - g) * (Math.pow(rc, g) - 1) / (g * (rc - 1)); out.formula = '1 − r^(1−γ)(r_c^γ − 1)/(γ(r_c − 1))';
    } else {
      /* Stirling: due isoterme e due isocore; con rigeneratore ideale il calore delle isocore si scambia internamente */
      var Vs1 = 0.01, Vs2 = Vs1 * P.r, As = [R * P.Tc / Vs1, Vs1, P.Tc], Bs = [R * P.Tc / Vs2, Vs2, P.Tc], Cs = [R * P.Tf / Vs2, Vs2, P.Tf], Ds = [R * P.Tf / Vs1, Vs1, P.Tf];
      var s4 = 0, d1 = trasf(t('espansione isoterma a T_c', 'isothermal expansion at T_h'), 'isoterma', As, Bs, cv, s4); s4 = d1.S1;
      var d2 = trasf(t('raffreddamento isocoro (nel rigeneratore)', 'isochoric cooling (in the regenerator)'), 'isocora', Bs, Cs, cv, s4); s4 = d2.S1;
      var d3 = trasf(t('compressione isoterma a T_f', 'isothermal compression at T_c'), 'isoterma', Cs, Ds, cv, s4); s4 = d3.S1;
      var d4 = trasf(t('riscaldamento isocoro (dal rigeneratore)', 'isochoric heating (from the regenerator)'), 'isocora', Ds, As, cv, s4);
      out = [d1, d2, d3, d4]; out.rigenera = true; out.teorico = 1 - P.Tf / P.Tc; out.formula = '1 − T_f/T_c ' + t('(con rigeneratore)', '(with regenerator)');
    }
    var Lt = 0, Qass = 0; out.forEach(function (x, i) { Lt += x.L; if (x.Q > 0 && !(out.rigenera && x.tipo === 'isocora')) Qass += x.Q; });
    out.lavoro = Lt; out.Qass = Qass; out.eta = Lt / Qass; out.gamma = g;
    return out;
  }
  /* ═══ gas di dischi ═════════════════════════════════════════════════════ */
  function gasNuovo(N, Lx, r, v0, seme) {
    var s = (seme || 7) >>> 0; function rnd() { s = (s + 0x6D2B79F5) >>> 0; var q = Math.imul(s ^ (s >>> 15), 1 | s); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }
    var P = [], lato = Math.ceil(Math.sqrt(N)), passo = Lx / lato;
    for (var i = 0; i < N; i++) { var a = rnd() * 2 * Math.PI; P.push({ x: passo * (i % lato + 0.5), y: passo * (Math.floor(i / lato) + 0.5), vx: v0 * Math.cos(a), vy: v0 * Math.sin(a) }); }
    return { P: P, L: Lx, r: r, impulso: 0, tempo: 0 };
  }
  /* un passo: moto libero, urti con le pareti (si somma l'impulso), urti elastici fra dischi uguali */
  function gasPasso(G, dt) {
    var P = G.P, L = G.L, r = G.r, n = P.length, i, j;
    for (i = 0; i < n; i++) { var p = P[i]; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < r) { p.x = 2 * r - p.x; G.impulso += 2 * Math.abs(p.vx); p.vx = Math.abs(p.vx); } if (p.x > L - r) { p.x = 2 * (L - r) - p.x; G.impulso += 2 * Math.abs(p.vx); p.vx = -Math.abs(p.vx); }
      if (p.y < r) { p.y = 2 * r - p.y; G.impulso += 2 * Math.abs(p.vy); p.vy = Math.abs(p.vy); } if (p.y > L - r) { p.y = 2 * (L - r) - p.y; G.impulso += 2 * Math.abs(p.vy); p.vy = -Math.abs(p.vy); } }
    /* celle per trovare le coppie vicine */
    var cs = 2 * r, nc = Math.max(1, Math.floor(L / cs)), celle = {};
    for (i = 0; i < n; i++) { var k = Math.min(nc - 1, Math.floor(P[i].x / cs)) + nc * Math.min(nc - 1, Math.floor(P[i].y / cs)); (celle[k] = celle[k] || []).push(i); }
    for (var ck in celle) { var cx = ck % nc, cy = Math.floor(ck / nc);
      for (var dx = 0; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { if (dx === 0 && dy < 0) continue; var x2 = cx + dx, y2 = cy + dy; if (x2 >= nc || y2 < 0 || y2 >= nc) continue; var lst = celle[x2 + nc * y2]; if (!lst) continue;
        celle[ck].forEach(function (a) { lst.forEach(function (b) { if ((dx || dy) ? false : b <= a) return; var A = P[a], B = P[b], ddx = B.x - A.x, ddy = B.y - A.y, d2 = ddx * ddx + ddy * ddy; if (d2 >= 4 * r * r || d2 === 0) return; var dvx = B.vx - A.vx, dvy = B.vy - A.vy, pr = dvx * ddx + dvy * ddy; if (pr >= 0) return; var f = pr / d2; A.vx += f * ddx; A.vy += f * ddy; B.vx -= f * ddx; B.vy -= f * ddy; }); });
      } }
    G.tempo += dt;
  }
  function energiaCinetica(G) { var e = 0; G.P.forEach(function (p) { e += 0.5 * (p.vx * p.vx + p.vy * p.vy); }); return e; }
  /* Maxwell-Boltzmann in 2D per massa 1: f(v) = (v/kT) e^(−v²/2kT), con kT = ⟨½v²⟩ (due gradi di liberta') */
  function maxwell2D(v, kT) { return v / kT * Math.exp(-v * v / (2 * kT)); }
  /* v238 — van der Waals in variabili ridotte (p/p_c, V/V_c, T/T_c): p = 8T/(3V − 1) − 3/V².
     Sotto T_c l'isoterma ha un'ansa; l'equilibrio liquido-vapore e' la retta p_sat che taglia
     aree uguali (costruzione di Maxwell): ∫(p_vdW − p_sat) dV = 0 fra V_l e V_g.
     Primitiva: ∫ p dV = (8T/3) ln(3V − 1) + 3/V. */
  function vdw(V, T) { return 8 * T / (3 * V - 1) - 3 / (V * V); }
  function primitivaVdw(V, T) { return 8 * T / 3 * Math.log(3 * V - 1) + 3 / V; }
  function bisezione(f, a, b, n) { var fa = f(a); for (var i = 0; i < (n || 64); i++) { var m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; }
  function maxwellVdw(T) {
    if (!(T < 1) || !(T > 0.3)) return null;
    /* l'ansa: dp/dV = 0 dove 4T V³ = (3V − 1)² (spinodali), una a sinistra e una a destra di V = 1 */
    var sp = function (V) { return 4 * T * V * V * V - (3 * V - 1) * (3 * V - 1); }, Vs1 = bisezione(sp, 1 / 3 + 1e-9, 1), Vs2 = bisezione(sp, 1, 50);
    /* per una p fra i due estremi le radici esterne della cubica 3pV³ − (p + 8T)V² + 9V − 3 = 0 */
    function radici(p) { var f = function (V) { return vdw(V, T) - p; }; return [bisezione(f, 1 / 3 + 1e-12, Vs1), bisezione(f, Vs2, 1e4)]; }
    function aree(p) { var r = radici(p); return primitivaVdw(r[1], T) - primitivaVdw(r[0], T) - p * (r[1] - r[0]); }
    var psat = bisezione(aree, Math.max(1e-9, vdw(Vs1, T)) + 1e-12, vdw(Vs2, T) - 1e-12), r = radici(psat);
    return { p: psat, Vl: r[0], Vg: r[1], Vs1: Vs1, Vs2: Vs2 };
  }
  /* l'isoterma d'equilibrio: l'ansa sostituita dal tratto orizzontale di coesistenza */
  function pEquilibrio(V, T, M) { if (M && V > M.Vl && V < M.Vg) return M.p; return vdw(V, T); }
  F.calcolo.termo = { ciclo: ciclo, gasNuovo: gasNuovo, gasPasso: gasPasso, energiaCinetica: energiaCinetica, maxwell2D: maxwell2D, vdw: vdw, maxwellVdw: maxwellVdw, pEquilibrio: pEquilibrio, R: R };

  /* ═══ 1. cicli ══════════════════════════════════════════════════════════ */
  function schedaCicli(div) {
    var G = griglia(div), st = { tipo: 'carnot', Tc: 1500, Tf: 300, r: 8, rc: 2, gamma: 1.4 }, info, tab, fr = 0, C;
    F.scelta(G.pan, ['Ciclo', 'Cycle'], [['carnot', 'Carnot'], ['otto', t('Otto (benzina)', 'Otto (petrol)')], ['diesel', 'Diesel'], ['stirling', 'Stirling']], st.tipo, function (v) { st.tipo = v; calcola(); });
    F.scelta(G.pan, ['Gas', 'Gas'], [['1.4', t('biatomico (γ = 1,4)', 'diatomic (γ = 1.4)')], ['1.667', t('monoatomico (γ = 5/3)', 'monatomic (γ = 5/3)')]], '1.4', function (v) { st.gamma = +v; calcola(); });
    F.cursore(G.pan, ['T calda (K)', 'T hot (K)'], 400, 2500, 50, st.Tc, function (v) { st.Tc = v; calcola(); });
    F.cursore(G.pan, ['T fredda (K, Carnot e Stirling)', 'T cold (K, Carnot and Stirling)'], 200, 400, 10, st.Tf, function (v) { st.Tf = v; calcola(); });
    F.cursore(G.pan, ['rapporto di compressione r', 'compression ratio r'], 2, 22, 0.5, st.r, function (v) { st.r = v; calcola(); });
    F.cursore(G.pan, ['rapporto di combustione r_c (Diesel)', 'cut-off ratio r_c (Diesel)'], 1.2, 4, 0.1, st.rc, function (v) { st.rc = v; calcola(); }, function (v) { return v.toFixed(1); });
    info = nota(G.pan);
    var cpv = F.tela(G.dx, 0.5), cts = F.tela(G.dx, 0.36); tab = F.el('div'); G.dx.appendChild(tab);
    function calcola() {
      C = ciclo(st.tipo, st);
      var righe = C.map(function (x, i) { return '<tr><td>' + (i + 1) + '. ' + x.nome + '</td><td class="bsiFX-num">' + fmt(x.Q) + '</td><td class="bsiFX-num">' + fmt(x.L) + '</td><td class="bsiFX-num">' + fmt(x.dU) + '</td><td class="bsiFX-num">' + fmt(x.dS) + '</td></tr>'; }).join('');
      var somma = C.reduce(function (s, x) { return [s[0] + x.Q, s[1] + x.L, s[2] + x.dU, s[3] + x.dS]; }, [0, 0, 0, 0]);
      tab.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('trasformazione (1 mol)', 'process (1 mol)') + '</th><th>Q (J)</th><th>L (J)</th><th>ΔU (J)</th><th>ΔS (J/K)</th></tr>' + righe + '<tr><td><b>' + t('ciclo', 'cycle') + '</b></td><td class="bsiFX-num">' + fmt(somma[0]) + '</td><td class="bsiFX-num"><b>' + fmt(somma[1]) + '</b></td><td class="bsiFX-num">' + fmt(Math.abs(somma[2]) < 1e-6 ? 0 : somma[2]) + '</td><td class="bsiFX-num">' + fmt(Math.abs(somma[3]) < 1e-9 ? 0 : somma[3]) + '</td></tr></table>';
      var Tmax = Math.max.apply(null, C.map(function (x) { return Math.max.apply(null, x.punti.map(function (p) { return p[2]; })); })), Tmin = Math.min.apply(null, C.map(function (x) { return Math.min.apply(null, x.punti.map(function (p) { return p[2]; })); }));
      info.innerHTML = t('Rendimento dal bilancio ', 'Efficiency from the balance ') + 'η = L/Q_ass = <b class="bsiFX-num">' + fmt(C.eta * 100) + ' %</b><br>' + t('Formula: ', 'Formula: ') + C.formula + ' = ' + fmt(C.teorico * 100) + ' %<br>' + t('Carnot fra le stesse temperature estreme (', 'Carnot between the same extreme temperatures (') + fmt(Tmin) + '–' + fmt(Tmax) + ' K): ' + fmt((1 - Tmin / Tmax) * 100) + ' %: ' + t('nessun ciclo fra quelle temperature fa meglio.', 'no cycle between those temperatures does better.') + '<br>' + t('In un ciclo ΔU = 0 e ΔS = 0 (funzioni di stato): lo verifica l’ultima riga.', 'Around a cycle ΔU = 0 and ΔS = 0 (state functions): the last row checks it.') + (C.avviso ? '<br>⚠ ' + t('Con questo rapporto di compressione l’aria esce dalla compressione già a ', 'With this compression ratio the air leaves compression already at ') + fmt(C.avviso / 1.2) + ' K: ' + t('la combustione la porta a ', 'combustion takes it to ') + fmt(C.avviso) + ' K.' : '');
      fr = 0;
    }
    calcola();
    anima(cpv, function (dt) {
      if (!dt) dt = 0;
      fr = (fr + dt * 0.25) % 1;
      var tutti = [].concat.apply([], C.map(function (x) { return x.punti; })), k = Math.floor(fr * tutti.length), p = tutti[k];
      var o = F.grafico(cpv, { serie: C.map(function (x, i) { return { x: x.punti.map(function (p) { return p[0] * 1000; }), y: x.punti.map(function (p) { return p[1] / 1e5; }), col: ['#ff8a80', '#ffd24a', '#6bcfff', '#5eead4'][i], larg: 2.2, nascondiMirino: true }; }), xl: ['V (L)', 'V (L)'], yl: ['p (bar)', 'p (bar)'], ymin: 0 });
      o.q.fillStyle = '#fff'; o.q.beginPath(); o.q.arc(o.X(p[0] * 1000), o.Y(p[1] / 1e5), 5, 0, Math.PI * 2); o.q.fill();
      var o2 = F.grafico(cts, { serie: C.map(function (x, i) { return { x: x.punti.map(function (p) { return p[3]; }), y: x.punti.map(function (p) { return p[2]; }), col: ['#ff8a80', '#ffd24a', '#6bcfff', '#5eead4'][i], larg: 2.2, nascondiMirino: true }; }), xl: ['S − S₀ (J/K)', 'S − S₀ (J/K)'], yl: ['T (K)', 'T (K)'] });
      o2.q.fillStyle = '#fff'; o2.q.beginPath(); o2.q.arc(o2.X(p[3]), o2.Y(p[2]), 5, 0, Math.PI * 2); o2.q.fill();
    });
  }

  /* ═══ 2. gas di particelle ══════════════════════════════════════════════ */
  function schedaGas(div) {
    var G = griglia(div), st = { N: 160, v0: 1 }, info, gas, conteggi;
    F.cursore(G.pan, ['particelle N', 'particles N'], 40, 400, 20, st.N, function (v) { st.N = v; nuovo(); });
    F.cursore(G.pan, [t('velocità iniziale (tutte uguali)', 'initial speed (all equal)'), t('velocità iniziale (tutte uguali)', 'initial speed (all equal)')], 0.5, 3, 0.1, st.v0, function (v) { st.v0 = v; nuovo(); }, function (v) { return v.toFixed(1); });
    F.bottone(G.pan, ['Riscalda (× 1,2 le velocità)', 'Heat (× 1.2 speeds)'], function () { gas.P.forEach(function (p) { p.vx *= 1.2; p.vy *= 1.2; }); azzera(); });
    F.bottone(G.pan, ['Raffredda', 'Cool'], function () { gas.P.forEach(function (p) { p.vx /= 1.2; p.vy /= 1.2; }); azzera(); });
    info = nota(G.pan);
    var cb = F.tela(G.dx, 0.6), ch = F.tela(G.dx, 0.4);
    function azzera() { conteggi = null; gas.impulso = 0; gas.tempo = 0; }
    function nuovo() { gas = gasNuovo(st.N, 100, 1.2, st.v0 * 20); azzera(); }
    nuovo();
    var fot = 0;
    anima(cb, function (dt) {
      /* 4 passi di 0,025 per fotogramma a ×1: con la velocita' cambia il numero di passi, non la loro lunghezza (gli urti restano esatti) */
      var np = Math.max(0, Math.round(dt * 60 * 4)); for (var i = 0; i < np; i++) gasPasso(gas, 0.025);
      var E = energiaCinetica(gas), kT = E / gas.P.length; /* due gradi di liberta': ⟨½v²⟩ = kT */
      var P = pennello(cb), q = P.q, W = P.W, H = P.H, lato = Math.min(W, H) - 20, ox = (W - lato) / 2, s = lato / gas.L, vmax = 3 * Math.sqrt(kT);
      q.strokeStyle = '#34465f'; q.strokeRect(ox, 10, lato, lato);
      gas.P.forEach(function (p) { var v = Math.hypot(p.vx, p.vy), u = Math.min(1, v / vmax); q.fillStyle = 'rgb(' + Math.round(80 + 175 * u) + ',' + Math.round(200 - 80 * u) + ',' + Math.round(255 - 200 * u) + ')'; q.beginPath(); q.arc(ox + p.x * s, 10 + p.y * s, Math.max(1.5, gas.r * s), 0, Math.PI * 2); q.fill(); });
      cb.setAttribute('aria-label', t('gas di particelle in una scatola', 'gas of particles in a box'));
      /* istogramma accumulato */
      var nb = 30, vM = 4 * Math.sqrt(kT); if (!conteggi) conteggi = new Array(nb).fill(0);
      gas.P.forEach(function (p) { var b = Math.floor(Math.hypot(p.vx, p.vy) / vM * nb); if (b < nb) conteggi[b]++; });
      if (++fot % 6 && fot > 1) return; /* l'istogramma si aggiorna ogni 6 fotogrammi, e subito al primo */
      var tot = conteggi.reduce(function (a, b) { return a + b; }, 0) || 1, xs = [], ys = [], xm = [], ym = [];
      for (var b = 0; b < nb; b++) { xs.push((b + 0.5) * vM / nb); ys.push(conteggi[b] / tot / (vM / nb)); }
      for (b = 0; b <= 200; b++) { var v = vM * b / 200; xm.push(v); ym.push(maxwell2D(v, kT)); }
      F.grafico(ch, { barre: xs.map(function (x, i) { return { x: x, y: ys[i], col: '#5eead4', larg: Math.max(2, (ch.clientWidth || 400) / nb * 0.7) }; }), serie: [{ x: xm, y: ym, col: '#ffd24a', larg: 2, etich: 'Maxwell-Boltzmann 2D' }], xmin: 0, xmax: vM, ymin: 0, xl: ['v', 'v'], yl: ['f(v)', 'f(v)'], legenda: [{ col: '#ffd24a', etich: 'Maxwell-Boltzmann 2D' }] });
      /* pressione: impulso per unita' di tempo e di perimetro (in 2D la «pressione» e' forza per lunghezza) */
      var pMis = gas.tempo > 0 ? gas.impulso / gas.tempo / (4 * gas.L) : 0, pId = gas.P.length * kT / (gas.L * gas.L), eta = gas.P.length * Math.PI * gas.r * gas.r / (gas.L * gas.L), pDD = pId * (1 + 2 * eta + 2.7826 * eta * eta);
      info.innerHTML = 'kT = ⟨½ m v²⟩ = ' + fmt(kT) + ' · ' + t('pressione misurata dagli urti sulle pareti ', 'pressure measured from wall hits ') + '<b class="bsiFX-num">' + fmt(pMis) + '</b> · ' + t('gas ideale ', 'ideal gas ') + 'N kT / A = <b class="bsiFX-num">' + fmt(pId) + '</b> (' + t('differenza ', 'difference ') + fmt(pId ? (pMis / pId - 1) * 100 : 0) + ' %)<br>' + t('Correzione dei dischi duri (sviluppo del viriale) ', 'Hard-disc correction (virial expansion) ') + 'N kT/A·(1 + 2η + 2,78η²) = <b class="bsiFX-num">' + fmt(pDD) + '</b>, η = ' + fmt(eta) + '<br>' +
        t('Tutte le particelle partono con la stessa velocità: gli urti la ridistribuiscono finché l’istogramma diventa la curva di Maxwell-Boltzmann, la distribuzione di massima entropia a energia fissata. Lo scarto di pressione rispetto al gas ideale viene dalla superficie occupata dai dischi stessi (gas reale, come il termine b di van der Waals): la correzione del viriale lo spiega.', 'All particles start at the same speed: collisions redistribute it until the histogram becomes the Maxwell-Boltzmann curve, the maximum-entropy distribution at fixed energy. The pressure excess over the ideal gas comes from the area taken by the discs themselves (real gas, like the van der Waals b term): the virial correction accounts for it.');
    }, { ricomincia: function () { nuovo(); } });
  }

  /* ═══ 3. moto browniano ═════════════════════════════════════════════════ */
  function schedaBrowniano(div) {
    var G = griglia(div), st = { N: 200, passo: 1 }, info, cam, tt;
    F.cursore(G.pan, ['camminatori', 'walkers'], 20, 1000, 20, st.N, function (v) { st.N = v; nuovo(); });
    F.cursore(G.pan, ['lunghezza del passo', 'step length'], 0.5, 3, 0.1, st.passo, function (v) { st.passo = v; nuovo(); }, function (v) { return v.toFixed(1); });
    info = nota(G.pan);
    var cw = F.tela(G.dx, 0.55), cg = F.tela(G.dx, 0.38), storia;
    var ultimo = -1;
    function nuovo() { cam = []; for (var i = 0; i < st.N; i++) cam.push({ x: 0, y: 0, tr: [[0, 0]] }); tt = 0; storia = [[0, 0]]; ultimo = -1; if (ctlB) ctlB.sveglia(); }
    var ctlB = null;
    nuovo();
    var semeB = 99; function rnd() { semeB = (semeB + 0x6D2B79F5) >>> 0; var q = Math.imul(semeB ^ (semeB >>> 15), 1 | semeB); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }
    ctlB = anima(cw, function (dt) {
      if (tt >= 600) return false;
      var np = Math.max(0, Math.round(dt * 60 * 2));
      for (var k = 0; k < np; k++) { tt++; cam.forEach(function (c, i) { var a = rnd() * 2 * Math.PI; c.x += st.passo * Math.cos(a); c.y += st.passo * Math.sin(a); if (i < 6) c.tr.push([c.x, c.y]); }); var r2 = 0; cam.forEach(function (c) { r2 += c.x * c.x + c.y * c.y; }); storia.push([tt, r2 / cam.length]); }
      var P = pennello(cw), q = P.q, W = P.W, H = P.H, sc = Math.min(W, H) / (8 * st.passo * Math.sqrt(Math.max(30, tt))), cx = W / 2, cy = H / 2;
      q.fillStyle = 'rgba(94,234,212,.55)'; cam.forEach(function (c) { q.fillRect(cx + c.x * sc - 1, cy + c.y * sc - 1, 2.2, 2.2); });
      ['#ffd24a', '#ff8a80', '#6bcfff', '#c49bff', '#a8e07a', '#ffffff'].forEach(function (col, i) { var c = cam[i]; if (!c) return; q.strokeStyle = col; q.lineWidth = 1; q.beginPath(); c.tr.forEach(function (p, j) { if (j) q.lineTo(cx + p[0] * sc, cy + p[1] * sc); else q.moveTo(cx + p[0] * sc, cy + p[1] * sc); }); q.stroke(); });
      var rr = Math.sqrt(storia[storia.length - 1][1]); q.strokeStyle = 'rgba(255,210,74,.6)'; q.setLineDash([4, 4]); q.beginPath(); q.arc(cx, cy, rr * sc, 0, Math.PI * 2); q.stroke(); q.setLineDash([]);
      cw.setAttribute('aria-label', t('cammini casuali', 'random walks'));
      if (Math.floor(tt / 10) === ultimo && tt < 600) return; ultimo = Math.floor(tt / 10);
      var D = st.passo * st.passo / 4;
      F.grafico(cg, { serie: [{ x: storia.map(function (p) { return p[0]; }), y: storia.map(function (p) { return p[1]; }), col: '#5eead4', larg: 2, etich: t('misurato', 'measured') }, { x: [0, tt], y: [0, 4 * D * tt], col: '#ffd24a', tratt: true, etich: '4Dt' }], xmin: 0, ymin: 0, xl: [t('passi', 'steps'), t('passi', 'steps')], yl: ['⟨r²⟩', '⟨r²⟩'], legenda: [{ col: '#5eead4', etich: ['misurato', 'measured'] }, { col: '#ffd24a', etich: '⟨r²⟩ = 4Dt' }] });
      info.innerHTML = t('Ogni camminatore fa passi di lunghezza ', 'Each walker takes steps of length ') + st.passo + t(' in direzione casuale. Dopo ', ' in a random direction. After ') + tt + t(' passi ', ' steps ') + '⟨r²⟩ = <b class="bsiFX-num">' + fmt(storia[storia.length - 1][1]) + '</b>, ' + t('teoria ', 'theory ') + '4Dt = <b class="bsiFX-num">' + fmt(4 * D * tt) + '</b> ' + t('con D = ℓ²/4 per passo.', 'with D = ℓ²/4 per step.') + '<br>' + t('La distanza tipica cresce come √t, non come t: è per questo che la diffusione è rapida su un micrometro e lentissima su un centimetro. Einstein (1905) ne ricavò il numero di Avogadro: D = RT/(6πηaN_A).', 'The typical distance grows like √t, not t: that is why diffusion is fast over a micrometre and very slow over a centimetre. Einstein (1905) obtained Avogadro’s number from it: D = RT/(6πηaN_A).');
    }, { ricomincia: function () { var c0 = ctlB; ctlB = null; nuovo(); ctlB = c0; } });
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

  /* ═══ 4. la superficie p-V-T in 3D (v238) ══════════════════════════════
     Gli stati di equilibrio di un gas stanno su una superficie nello spazio (V, T, p). Per il gas
     ideale e' pV = nRT (assi logaritmici per V e p) e i cicli della prima scheda vi stanno sopra;
     per il gas di van der Waals la superficie ha la piega liquido-vapore con la cupola di coesistenza. */
  var COLCICLO = [0xff8a80, 0xffd24a, 0x6bcfff, 0x5eead4];
  function colT(u) { u = Math.max(0, Math.min(1, u)); var a = [[0.2, 0.35, 0.85], [0.25, 0.75, 0.85], [0.95, 0.85, 0.35], [0.95, 0.4, 0.3]], x = u * 3, i = Math.min(2, Math.floor(x)), f = x - i; return [a[i][0] + (a[i + 1][0] - a[i][0]) * f, a[i][1] + (a[i + 1][1] - a[i][1]) * f, a[i][2] + (a[i + 1][2] - a[i][2]) * f]; }
  function schedaPVT(pan) {
    var st = { modo: 'ideale', tipo: 'carnot', Tc: 900, Tf: 300, r: 6, rc: 2, gamma: 1.4, Tr: 0.9, anse: false }, cb = {};
    F.scelta(pan, ['Gas', 'Gas'], [['ideale', t('ideale, con un ciclo', 'ideal, with a cycle')], ['vdw', t('van der Waals (variabili ridotte)', 'van der Waals (reduced variables)')]], st.modo, function (v) { st.modo = v; gI.style.display = v === 'ideale' ? '' : 'none'; gV.style.display = v === 'ideale' ? 'none' : ''; nuovo(); });
    var gI = F.el('div'), gV = F.el('div', { style: 'display:none' }); pan.appendChild(gI); pan.appendChild(gV);
    F.scelta(gI, ['Ciclo', 'Cycle'], [['carnot', 'Carnot'], ['otto', t('Otto (benzina)', 'Otto (petrol)')], ['diesel', 'Diesel'], ['stirling', 'Stirling']], st.tipo, function (v) { st.tipo = v; nuovo(); });
    F.cursore(gI, ['T calda (K)', 'T hot (K)'], 400, 2500, 50, st.Tc, function (v) { st.Tc = v; nuovo(); });
    F.cursore(gI, ['T fredda (K, Carnot e Stirling)', 'T cold (K, Carnot and Stirling)'], 200, 400, 10, st.Tf, function (v) { st.Tf = v; nuovo(); });
    F.cursore(gI, ['rapporto di compressione r', 'compression ratio r'], 2, 22, 0.5, st.r, function (v) { st.r = v; nuovo(); });
    F.cursore(gV, ['temperatura ridotta T/T_c dell’isoterma', 'reduced temperature T/T_c of the isotherm'], 0.8, 1.25, 0.01, st.Tr, function (v) { st.Tr = v; nuovo(); }, function (v) { return v.toFixed(2); });
    var ca = F.el('input', { type: 'checkbox' }); ca.addEventListener('change', function () { st.anse = ca.checked; nuovo(); });
    gV.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.86rem;color:#cfe3f7;cursor:pointer' }, [ca, F.el('span', { testo: t('mostra le anse di van der Waals (stati metastabili e instabili)', 'show the van der Waals loops (metastable and unstable states)') })]));
    var info = nota(pan), spiega = nota(pan), C, M;
    function nuovo() {
      if (st.modo === 'ideale') {
        C = ciclo(st.tipo, st);
        info.innerHTML = t('Un mole di gas biatomico: ogni stato di equilibrio sta sulla superficie pV = RT. Il punto bianco percorre il ciclo: ', 'One mole of diatomic gas: every equilibrium state lies on the surface pV = RT. The white dot travels the cycle: ') + C.map(function (x, i) { return '<span class="bsi3d-leg" style="background:#' + COLCICLO[i].toString(16) + '"></span>' + x.nome; }).join(', ') + '.<br>' + t('Rendimento ', 'Efficiency ') + 'η = L/Q_ass = <b class="bsiFX-num">' + fmt(C.eta * 100) + ' %</b> · ' + C.formula + ' = ' + fmt(C.teorico * 100) + ' % · L = ' + fmt(C.lavoro) + ' J';
        spiega.innerHTML = t('Assi: V e p in scala logaritmica, T lineare. Le isoterme sono le curve a T costante sulla superficie; le adiabatiche la attraversano scendendo di temperatura (pV^γ = costante); isocore e isobare sono i tagli a V o a p costanti. La proiezione del ciclo sulla parete di fondo è il diagramma p-V della prima scheda, la cui area è il lavoro.', 'Axes: V and p on a log scale, T linear. Isotherms are the constant-T curves on the surface; adiabats cross it falling in temperature (pV^γ = constant); isochores and isobars are the cuts at constant V or p. The projection of the cycle on the back wall is the p-V diagram of the first tab, whose area is the work.');
      } else {
        M = maxwellVdw(st.Tr);
        info.innerHTML = 'p = 8T/(3V − 1) − 3/V² ' + t('(ridotte: p/p_c, V/V_c, T/T_c)', '(reduced: p/p_c, V/V_c, T/T_c)') + '<br>' + (M ? t('Coesistenza a T = ', 'Coexistence at T = ') + fmt(st.Tr) + ' T_c: p_sat = <b class="bsiFX-num">' + M.p.toFixed(4) + '</b> p_c, V_liquido = <b class="bsiFX-num">' + M.Vl.toFixed(4) + '</b>, V_vapore = <b class="bsiFX-num">' + M.Vg.toFixed(4) + '</b> V_c ' + t('(aree uguali di Maxwell); spinodali a V = ', '(Maxwell equal areas); spinodals at V = ') + M.Vs1.toFixed(3) + t(' e ', ' and ') + M.Vs2.toFixed(3) : t('Sopra T_c non c’è transizione: liquido e vapore non si distinguono (fluido supercritico).', 'Above T_c there is no transition: liquid and vapour cannot be told apart (supercritical fluid).'));
        spiega.innerHTML = t('La superficie di van der Waals con la piega: sotto la cupola (bianca) liquido e vapore coesistono alla pressione di saturazione, le isoterme diventano orizzontali e il gas compresso condensa senza che la pressione salga; la frazione di liquido segue la regola della leva. Al punto critico C (1, 1, 1) la piega sparisce: ∂p/∂V = ∂²p/∂V² = 0. Il punto bianco comprime e poi espande il gas lungo l’isoterma scelta.', 'The van der Waals surface with its fold: under the dome (white) liquid and vapour coexist at the saturation pressure, isotherms become horizontal and compressed gas condenses without the pressure rising; the liquid fraction follows the lever rule. At the critical point C (1, 1, 1) the fold disappears: ∂p/∂V = ∂²p/∂V² = 0. The white dot compresses and then expands the gas along the chosen isotherm.');
      }
      if (cb.nuovo) cb.nuovo();
    }
    nuovo();
    return {
      etichetta: ['Superficie p-V-T in 3D del gas ideale e di van der Waals con le trasformazioni', '3D p-V-T surface of the ideal and van der Waals gas with the processes'],
      tre: function (S, T, L3) {
        var gr = new T.Group(); S.aggiungi(gr);
        var punto = L3.sfera(T, 0.11, 0xffffff, 0, 0, 0, true); S.aggiungi(punto);
        var cammino = [], fr = 0, mappa;
        function tubo(pts, col, r) { if (pts.length < 2) return; var cu = new T.CatmullRomCurve3(pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })); gr.add(new T.Mesh(new T.TubeGeometry(cu, Math.min(400, pts.length * 3), r || 0.045, 8, false), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35 }))); }
        function etichetta(s2, col, x, y, z, h) { var e = L3.testo3d(T, s2, col, h || 0.3); e.position.set(x, y, z); gr.add(e); }
        function superficie(fz, nx, ny, colore) {
          var pos = [], col = [], idx = [];
          for (var i = 0; i <= nx; i++) for (var j = 0; j <= ny; j++) { var u = i / nx, w = j / ny, P = fz(u, w); pos.push(P[0], P[1], P[2]); var c = colore(u, w); col.push(c[0], c[1], c[2]); }
          for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) { var a = i * (ny + 1) + j, b = (i + 1) * (ny + 1) + j; idx.push(a, b, b + 1, a, b + 1, a + 1); }
          var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
          gr.add(new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.6, transparent: true, opacity: 0.85 })));
          gr.add(new T.LineSegments(new T.WireframeGeometry(g), new T.LineBasicMaterial({ color: 0x081522, transparent: true, opacity: 0.18 })));
        }
        function cornice(nomi) {
          var sc = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(6, 6, 4)), new T.LineBasicMaterial({ color: 0x34465f })); sc.position.set(0, 0, 2); gr.add(sc);
          etichetta(nomi[0], '#ff8a80', 3.6, -3.3, 0); etichetta(nomi[1] + ' →', '#5eead4', 3.7, 0.2, 0); etichetta(nomi[2], '#6bcfff', -3.4, -3.4, 4.3);
        }
        cb.nuovo = function () {
          svuota(gr); cammino = []; fr = 0;
          if (st.modo === 'ideale') {
            var tutti = [].concat.apply([], C.map(function (x) { return x.punti; })), Vs = tutti.map(function (p) { return p[0]; }), Ts = tutti.map(function (p) { return p[2]; });
            var lv0 = Math.log10(Math.min.apply(null, Vs) / 1.6), lv1 = Math.log10(Math.max.apply(null, Vs) * 1.6), T0 = Math.min.apply(null, Ts) * 0.6, T1 = Math.max.apply(null, Ts) * 1.1;
            var lp0 = Math.log10(R * T0 / Math.pow(10, lv1)), lp1 = Math.log10(R * T1 / Math.pow(10, lv0));
            mappa = function (V, Tk, p) { return [-3 + 6 * (Math.log10(V) - lv0) / (lv1 - lv0), -3 + 6 * (Tk - T0) / (T1 - T0), 4 * (Math.log10(p) - lp0) / (lp1 - lp0)]; };
            superficie(function (u, w) { var V = Math.pow(10, lv0 + (lv1 - lv0) * u), Tk = T0 + (T1 - T0) * w; return mappa(V, Tk, R * Tk / V); }, 56, 40, function (u, w) { return colT(w); });
            [T0 + 0.25 * (T1 - T0), T0 + 0.5 * (T1 - T0), T0 + 0.75 * (T1 - T0)].forEach(function (Tk) { var pts = []; for (var i = 0; i <= 60; i++) { var V = Math.pow(10, lv0 + (lv1 - lv0) * i / 60); pts.push(mappa(V, Tk, R * Tk / V)); pts[i][2] += 0.01; } gr.add(L3.linea(T, pts, 0xe6fffb, 0.45)); });
            C.forEach(function (x, i) {
              var pts = x.punti.map(function (q) { var m = mappa(q[0], q[2], q[1]); m[2] += 0.04; return m; }); tubo(pts, COLCICLO[i]);
              gr.add(L3.linea(T, x.punti.map(function (q) { var m = mappa(q[0], q[2], q[1]); return [m[0], 3, m[2]]; }), COLCICLO[i], 0.6));
              cammino = cammino.concat(pts);
            });
            /* tacche: decadi di V (m³) e di p (bar) */
            for (var d = Math.ceil(lv0); d <= lv1; d++) etichetta(fmt(Math.pow(10, d)) + ' m³', '#9fb1c6', -3 + 6 * (d - lv0) / (lv1 - lv0), -3.45, -0.15, 0.28);
            for (d = Math.ceil(lp0 - 5); d <= lp1 - 5; d++) etichetta(fmt(Math.pow(10, d)) + ' bar', '#9fb1c6', -3.6, 3.2, 4 * (d + 5 - lp0) / (lp1 - lp0), 0.28);
            etichetta(fmt(T0) + ' K', '#9fb1c6', 3.6, -3, -0.15, 0.28); etichetta(fmt(T1) + ' K', '#9fb1c6', 3.6, 3, -0.15, 0.28);
            cornice(['V', 'T', 'p']);
          } else {
            var Va = 0.42, Vb = 8, Ta = 0.8, Tb = 1.25, pmax = 2;
            mappa = function (V, Tr, p) { return [-3 + 6 * Math.log(V / Va) / Math.log(Vb / Va), -3 + 6 * (Tr - Ta) / (Tb - Ta), 4 * Math.max(0, Math.min(pmax * 1.05, p)) / pmax]; };
            var cache = {}; function Mx(Tr) { var k = Tr.toFixed(4); if (!(k in cache)) cache[k] = maxwellVdw(Tr); return cache[k]; }
            superficie(function (u, w) { var V = Va * Math.pow(Vb / Va, u), Tr = Ta + (Tb - Ta) * w; return mappa(V, Tr, st.anse ? vdw(V, Tr) : pEquilibrio(V, Tr, Mx(Tr))); }, 90, 45, function (u, w) { var V = Va * Math.pow(Vb / Va, u), Tr = Ta + (Tb - Ta) * w, m = Mx(Tr); return m && V > m.Vl && V < m.Vg ? [0.85, 0.88, 0.95] : colT(w); });
            /* la cupola di coesistenza */
            var sx = [], dx = [];
            for (var k = 0; k <= 60; k++) { var Tr = Ta + (0.9999 - Ta) * k / 60, m = maxwellVdw(Tr); if (!m) continue; var a = mappa(m.Vl, Tr, m.p), b = mappa(m.Vg, Tr, m.p); a[2] += 0.03; b[2] += 0.03; sx.push(a); dx.push(b); }
            tubo(sx.concat(dx.reverse()), 0xffffff, 0.035);
            gr.add(L3.sfera(T, 0.1, 0xff6b6b, mappa(1, 1, 1)[0], mappa(1, 1, 1)[1], mappa(1, 1, 1)[2] + 0.05, true)); etichetta('C', '#ff8a80', mappa(1, 1, 1)[0], mappa(1, 1, 1)[1] + 0.25, mappa(1, 1, 1)[2] + 0.4, 0.35);
            /* l'isoterma scelta, percorsa dal punto */
            var M2 = maxwellVdw(st.Tr), pts = [];
            for (var i = 0; i <= 240; i++) { var V = Vb * Math.pow(Va * 1.08 / Vb, i / 240), q = mappa(V, st.Tr, pEquilibrio(V, st.Tr, M2)); q[2] += 0.05; pts.push(q); }
            tubo(pts, 0xffd24a, 0.04); cammino = pts.concat(pts.slice().reverse());
            if (M2) { var an = []; for (i = 0; i <= 120; i++) { var V2 = M2.Vl + (M2.Vg - M2.Vl) * i / 120, q2 = mappa(V2, st.Tr, vdw(V2, st.Tr)); q2[2] += 0.05; an.push(q2); } gr.add(L3.linea(T, an, 0xffd24a, 0.6)); }
            [1, 2, 4].forEach(function (V) { etichetta(String(V), '#9fb1c6', mappa(V, Ta, 0)[0], -3.45, -0.15, 0.24); });
            [0.5, 1, 1.5, 2].forEach(function (p) { etichetta(String(p), '#9fb1c6', -3.45, 3.2, mappa(1, 1, p)[2], 0.24); });
            cornice(['V/V_c', 'T/T_c', 'p/p_c']);
          }
          S.didascalia.textContent = st.modo === 'ideale' ? t('Gas ideale: pV = RT · ', 'Ideal gas: pV = RT · ') + st.tipo : 'van der Waals · T = ' + st.Tr.toFixed(2) + ' T_c';
          posa(); S.sporca = true; S.avvia();
        };
        function posa() {
          if (!cammino.length) return;
          var k = Math.min(cammino.length - 1, Math.floor(fr * cammino.length)), p = cammino[k]; punto.position.set(p[0], p[1], p[2] + 0.04);
          if (st.modo === 'vdw' && M && cammino.length) {
            var Vb = 8, Va = 0.42, i = k < 241 ? k : 481 - k, V = Vb * Math.pow(Va * 1.08 / Vb, i / 240);
            S.didascalia.textContent = 'T = ' + st.Tr.toFixed(2) + ' T_c · V = ' + V.toFixed(3) + ' V_c · ' + (V > M.Vg ? t('vapore', 'vapour') : V < M.Vl ? t('liquido', 'liquid') : t('liquido ', 'liquid ') + Math.round(100 * (M.Vg - V) / (M.Vg - M.Vl)) + ' % (' + t('regola della leva', 'lever rule') + ')');
          }
        }
        cb.nuovo();
        S.ogniFotogramma(function (dt) { if (S.fermo) return false; fr = (fr + dt * (st.modo === 'ideale' ? 0.12 : 0.08)) % 1; posa(); return true; });
        S.vista.bersaglio.set(0, 0, 1.6); S.inquadra(15, -1.2, 1.1);
      }
    };
  }

  F.sezione('sfistermo', {
    titolo: ['🔥 Termodinamica in movimento', '🔥 Thermodynamics in motion'],
    sotto: ['I cicli di Carnot, Otto, Diesel e Stirling nei piani p-V e T-S con i bilanci di calore e lavoro, un gas di particelle che trova da solo la distribuzione di Maxwell-Boltzmann, il moto browniano e la legge di Einstein.', 'Carnot, Otto, Diesel and Stirling cycles in the p-V and T-S planes with heat and work balances, a gas of particles finding the Maxwell-Boltzmann distribution by itself, Brownian motion and Einstein’s law.'],
    schede: [
      { nome: ['♻️ Cicli termodinamici', '♻️ Thermodynamic cycles'], costruisci: schedaCicli },
      { nome: ['🫧 Gas di particelle', '🫧 Gas of particles'], costruisci: schedaGas },
      { nome: ['🚶 Moto browniano', '🚶 Brownian motion'], costruisci: schedaBrowniano },
      { nome: ['🗻 Superficie p-V-T 3D', '🗻 3D p-V-T surface'], costruisci: scheda3D(schedaPVT) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
