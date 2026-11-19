/* ═══════════════════════════════════════════════════════════════════════
   bsi-quantum-studio-motori.js — i 16 motori del Quantum Studio (v265)
   BioSpecInfo · © Samuele Pio Provenzano

   Ogni motore (M.<nome> = funzione(K, p, ctx)) costruisce la scena nel
   gruppo K.G e restituisce:
     vista: [distanza, θ, φ, bersaglio z]
     passo(dt) → telemetria [[etichetta, valore], …]
     grafico(q, W, H) → disegna nel palco, dagli stessi numeri del passo
   K è il «kit» (sfere, cilindri, frecce, nuvole, testi), p i parametri dei
   cursori, ctx.rappr la rappresentazione scelta. I numeri vengono tutti dai
   modelli di bsi-quantum-studio-dati.js: il banco test_quantumstudio li
   ricontrolla.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var S = g.BSIQuantumStudio, F = g.BSIFisica;
  if (!S || !F) return;
  var M = S.MOTORI, U = S.util, PI = Math.PI, t = F.t, fmt = U.fmt, cl = U.cl, assi = U.assi, linea = U.linea, punto = U.punto, testo = U.testo;
  function Q() { return g.BSIQuantumDati; }

  /* ── 1 · ATP sintasi ── */
  M.atp = function (K, p, ctx) {
    var T = K.T, densa = ctx.rappr !== 'schema', rnd = K.seme(11), stato = { ang: 0, t: 0, storia: [] }, COLB = { L: '#ffd43b', T: '#ff6b6b', O: '#51cf66' };
    function ell(c, ax, n) { var P = []; while (P.length < n) { var x = rnd() * 2 - 1, y = rnd() * 2 - 1, z = rnd() * 2 - 1; if (x * x + y * y + z * z <= 1) P.push([c[0] + x * ax[0], c[1] + y * ax[1], c[2] + z * ax[2]]); } return P; }
    var rotore = new T.Group(), testa = new T.Group(); K.G.add(rotore); K.G.add(testa);
    var mem = new T.Mesh(new T.CylinderGeometry(4.2, 4.2, 1.1, 64, 1, true), K.mat('#f0b46a', { op: 0.16, ei: 0.25 })); mem.rotation.x = PI / 2; K.G.add(mem);
    [0.55, -0.55].forEach(function (z) { var d = new T.Mesh(new T.RingGeometry(1.15, 4.2, 64), K.mat('#7aa2c8', { op: densa ? 0.32 : 0.5, doppio: true })); d.position.z = z; K.G.add(d); });
    var betas = [];
    for (var k = 0; k < 6; k++) { var a = k * PI / 3, c = [0.98 * Math.cos(a), 0.98 * Math.sin(a), 3.1], isB = k % 2 === 1;
      if (densa) { var im = K.nuvola(ell(c, [0.5, 0.5, 0.95], 240), isB ? COLB.L : '#e8607a', 0.075, { ei: 0.35, padre: testa }); if (isB) betas.push({ i: (k - 1) / 2, mat: im.material, st: '' }); }
      else { var m = K.sfera(1, isB ? COLB.L : '#e8607a', c, { padre: testa }); m.scale.set(0.55, 0.55, 1.0); if (isB) betas.push({ i: (k - 1) / 2, mat: m.material, st: '' }); } }
    for (var j = 0; j < 8; j++) { var aj = j * PI / 4, cc = [0.72 * Math.cos(aj), 0.72 * Math.sin(aj), 0]; if (densa) K.nuvola(ell(cc, [0.18, 0.18, 0.78], 64), '#3fd0c0', 0.06, { ei: 0.3, padre: rotore }); else { var cy = K.cil('#3fd0c0', { padre: rotore }); cy.scale.set(0.2, 1.55, 0.2); cy.rotation.x = PI / 2; cy.position.set(cc[0], cc[1], 0); } }
    if (densa) K.nuvola(ell([0.08, 0, 2.2], [0.2, 0.2, 1.5], 220), '#c77dff', 0.065, { ei: 0.35, padre: rotore }); else { var gm = K.cil('#c77dff', { padre: rotore }); gm.scale.set(0.2, 3, 0.2); gm.rotation.x = PI / 2; gm.position.set(0.08, 0, 2.2); }
    if (densa) { K.nuvola(ell([1.36, 0, 0], [0.36, 0.6, 0.8], 150), '#ff9f43', 0.065, { ei: 0.3 }); for (var b = 0; b < 26; b++) { var u = b / 25; K.nuvola(ell([1.55 + 0.35 * Math.sin(u * PI), 0, 0.6 + u * 4], [0.12, 0.12, 0.14], 6), '#ff9f43', 0.06, { ei: 0.3 }); } }
    else { var sa = K.sfera(1, '#ff9f43', [1.36, 0, 0]); sa.scale.set(0.38, 0.62, 0.8); var br = K.cil('#ff9f43'); K.tra(br, [1.6, 0, 0.6], [1.6, 0, 4.6], 0.12); }
    K.et(t('F₁ α₃β₃', 'F₁ α₃β₃'), '#ffe3e8', 0.34, [-1.9, -0.6, 4.3]); K.et(t('anello c₈', 'c₈ ring'), '#9ff5ea', 0.3, [-1.6, -0.6, -0.8]); K.et(t('matrice', 'matrix'), '#c5f6fa', 0.3, [-3, 1, 2]); K.et(t('intermembrana', 'intermembrane'), '#ffc9de', 0.3, [-3, 1, -1.8]);
    var protoni = []; for (var h = 0; h < 30; h++) { var mh = K.sfera(0.09, '#ff4d8d', [0, 0, -2], { ei: 0.8 }); mh.userData = { f: rnd() * 10, r: 1.8 + rnd() * 2, a: rnd() * 2 * PI }; protoni.push(mh); }
    return { vista: [12, 1.15, 1.2, 1.0],
      passo: function (dt) {
        var A = Q().atpSintasi(p.drive / 100, p.uncoupler / 100); stato.t += dt; stato.ang += dt * A.Jatp * 1.6; rotore.rotation.z = stato.ang;
        betas.forEach(function (bb) { var st = g.BSIBioDati ? g.BSIBioDati.statoBeta(stato.ang, bb.i) : 'L'; if (st !== bb.st) { bb.st = st; bb.mat.color.set(COLB[st]); bb.mat.emissive.set(COLB[st]); } });
        var nv = Math.round(cl(A.dp / 2, 0, 1) * protoni.length); protoni.forEach(function (m, i) { m.visible = i < nv; var u = m.userData; m.position.set(u.r * Math.cos(u.a + stato.t * 0.2), u.r * Math.sin(u.a + stato.t * 0.2), -1.4 - 0.6 * Math.abs(Math.sin(stato.t + u.f))); });
        mem.material.emissive.set(p.uncoupler > 5 ? '#ff6a00' : '#f0b46a'); mem.material.emissiveIntensity = 0.25 + 0.6 * p.uncoupler / 100;
        stato.storia.push([stato.t, A.Jatp, A.JO2]); while (stato.storia.length && stato.storia[0][0] < stato.t - 20) stato.storia.shift(); stato.A = A;
        var giri = stato.ang / (2 * PI);
        return [[t('giri', 'turns'), fmt(giri, 2)], ['H⁺', Math.floor(giri * 8 + 1e-9)], ['ATP', Math.floor(giri * 3 + 1e-9)], ['Δp', Math.round(A.dp * 100) + ' %'], [t('consumo O₂', 'O₂ use'), fmt(A.JO2, 2)], [t('stati β', 'β states'), betas.map(function (x) { return x.st; }).join('')]];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (v) { return x0 + (v - (stato.t - 20)) / 20 * (x1 - x0); }, Yv = function (v) { return y1 - v / 4 * (y1 - y0); };
        assi(q, x0, y0, x1, y1, t('tempo (ultimi 20 s) →', 'time (last 20 s) →'), t('velocità (rel.)', 'rate (rel.)'));
        [[1, '#ffe066'], [2, '#4dd4ff']].forEach(function (c) { q.strokeStyle = c[1]; q.lineWidth = 2.2; q.beginPath(); stato.storia.forEach(function (s, i) { var px = X(s[0]), py = Yv(s[c[0]]); if (i) q.lineTo(px, py); else q.moveTo(px, py); }); q.stroke(); });
        testo(q, '— ATP ' + fmt(stato.A ? stato.A.Jatp : 0, 2), x1 - 150, y0 + 4, '#ffe066'); testo(q, '— O₂ ' + fmt(stato.A ? stato.A.JO2 : 0, 2), x1 - 78, y0 + 4, '#4dd4ff');
        testo(q, t('INDICATIVO · il disaccoppiante alza l\'O₂ e spegne l\'ATP', 'INDICATIVE · the uncoupler raises O₂ and stops ATP'), x0 + 4, y1 - 4, 'rgba(255,192,120,.9)', '500 8px system-ui,sans-serif');
      } };
  };

  /* ── 2 · enzimi ── */
  M.enzimi = function (K, p) {
    var T = K.T, rnd = K.seme(5), Km = 1, enz = [], orologio = 0, prodotti = 0;
    for (var k = 0; k < 6; k++) { var a = k * PI / 3, gE = new T.Group(); gE.position.set(2.6 * Math.cos(a), 2.6 * Math.sin(a), 0); gE.rotation.z = a + PI / 2; K.G.add(gE);
      var lA = K.sfera(1, '#748ffc', [-0.45, 0, 0.3], { padre: gE }), lB = K.sfera(1, '#748ffc', [0.45, 0, 0.3], { padre: gE }); lA.scale.set(0.5, 0.6, 0.85); lB.scale.set(0.5, 0.6, 0.85);
      var s0 = K.sfera(0.24, '#ffd43b', [0, 0, 0.55], { padre: gE, ei: 0.4 }), i0 = new T.Mesh(new T.OctahedronGeometry(0.27), K.mat('#ff6b6b', { ei: 0.4 })); i0.position.set(0, 0, 0.55); gE.add(i0);
      enz.push({ lA: lA, lB: lB, S: s0, I: i0, st: 'E', timer: rnd() * 0.5, ap: 0.3 }); }
    var liberi = []; for (var i = 0; i < 36; i++) { var m = K.sfera(0.2, '#ffd43b', null, { ei: 0.35 }); m.userData = { r: 4.3 + rnd() * 1.6, a: rnd() * 2 * PI, z: (rnd() - 0.5) * 2.5, f: rnd() * 9 }; liberi.push(m); }
    var inib = []; for (i = 0; i < 20; i++) { var mi = new T.Mesh(new T.OctahedronGeometry(0.22), K.mat('#ff6b6b', { ei: 0.4 })); K.G.add(mi); mi.userData = { r: 4 + rnd() * 2, a: rnd() * 2 * PI, z: (rnd() - 0.5) * 2.5, f: rnd() * 9 }; inib.push(mi); }
    function fr() { var s = p.substrate / Km, i = p.inhibitor, tot = 1 + s + i; return { E: 1 / tot, ES: s / tot, EI: i / tot }; }
    return { vista: [11, 1.2, 0.9, -1],
      passo: function (dt) {
        orologio += dt; var f = fr();
        enz.forEach(function (z) { z.timer -= dt; if (z.timer <= 0) { z.timer = 0.4 + rnd() * 0.5; var r = rnd(); z.st = r < f.E ? 'E' : r < f.E + f.ES ? 'ES' : 'EI'; } if (z.st === 'ES' && rnd() < 1.5 * dt) prodotti++; var b = z.st === 'ES' ? 0.04 : 0.36; z.ap += (b - z.ap) * Math.min(1, dt * 7); z.lA.rotation.y = -z.ap; z.lB.rotation.y = z.ap; z.lA.position.x = -0.45 - z.ap * 0.4; z.lB.position.x = 0.45 + z.ap * 0.4; var col = z.st === 'ES' ? '#22b8cf' : '#748ffc'; z.lA.material.color.set(col); z.lB.material.color.set(col); z.S.visible = z.st === 'ES'; z.I.visible = z.st === 'EI'; });
        var nS = Math.round(cl(Math.log10(p.substrate * 10) / 2, 0, 1) * liberi.length), nI = Math.round(cl(p.inhibitor / 10, 0, 1) * inib.length);
        liberi.forEach(function (m, i) { m.visible = i < nS; var u = m.userData; m.position.set(u.r * Math.cos(u.a + orologio * 0.1) + 0.3 * Math.sin(orologio + u.f), u.r * Math.sin(u.a + orologio * 0.1), u.z + 0.3 * Math.cos(orologio * 1.3 + u.f)); });
        inib.forEach(function (m, i) { m.visible = i < nI; var u = m.userData; m.position.set(u.r * Math.cos(u.a - orologio * 0.08), u.r * Math.sin(u.a - orologio * 0.08), u.z); m.rotation.x += dt; });
        var a = 1 + p.inhibitor, v = p.substrate / (a * Km + p.substrate);
        return [['V₀/Vmax', fmt(v, 2)], ['Km app (mM)', fmt(a * Km, 2)], ['Vmax app', '1,00'], ['ES · EI', Math.round(f.ES * 100) + ' · ' + Math.round(f.EI * 100) + ' %'], [t('prodotti', 'products'), prodotti]];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, Smax = 10, X = function (s) { return x0 + s / Smax * (x1 - x0); }, Yv = function (v) { return y1 - v / 1.1 * (y1 - y0); }, a = 1 + p.inhibitor;
        assi(q, x0, y0, x1, y1, '[S] (mM) →', 'V₀/Vmax');
        q.setLineDash([2, 4]); q.strokeStyle = 'rgba(160,175,200,.5)'; q.beginPath(); q.moveTo(x0, Yv(1)); q.lineTo(x1, Yv(1)); q.stroke(); q.setLineDash([]);
        linea(q, function (s) { return s / (Km + s); }, 0, Smax, X, Yv, 'rgba(77,171,247,.7)', 2, p.inhibitor > 0);
        if (p.inhibitor > 0) linea(q, function (s) { return s / (a * Km + s); }, 0, Smax, X, Yv, '#ff6b6b', 2.4);
        q.strokeStyle = '#ffa94d'; q.setLineDash([2, 3]); q.beginPath(); q.moveTo(X(a * Km), y1); q.lineTo(X(a * Km), Yv(0.5)); q.lineTo(x0, Yv(0.5)); q.stroke(); q.setLineDash([]); testo(q, 'Km' + (p.inhibitor > 0 ? ' app' : ''), X(a * Km) + 3, y1 - 3, '#ffa94d');
        punto(q, X(Math.min(Smax, p.substrate)), Yv(p.substrate / (a * Km + p.substrate)));
      } };
  };

  /* ── 3 · orbitali ibridi e Morse ── */
  M.orbitali = function (K, p, ctx) {
    var T = K.T, gO = new T.Group(); K.G.add(gO); gO.position.x = -1.6; var dir = { 1: [[1, 0, 0], [-1, 0, 0]], 2: [[1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]], 3: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]] }, n = Math.round(p.ibrid), orb = ctx.rappr !== 'atomi';
    var D0 = dir[n].map(function (v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
    K.sfera(0.3, '#4a5466', [0, 0, 0], { padre: gO });
    var Y = new T.Vector3(0, 1, 0), tv = new T.Vector3();
    function lobo(u, col, lung, rag) { var m = new T.Mesh(K.geoS, K.mat(col, { op: 0.55, ei: 0.3 })); m.scale.set(rag, lung, rag); m.position.set(u[0] * lung * 0.9, u[1] * lung * 0.9, u[2] * lung * 0.9); tv.set(u[0], u[1], u[2]); m.quaternion.setFromUnitVectors(Y, tv); gO.add(m); return m; }
    D0.forEach(function (u) { if (orb) { lobo(u, '#4dabf7', 1.15, 0.5); lobo([-u[0], -u[1], -u[2]], '#ff6b6b', 0.32, 0.25); } else { K.sfera(0.22, '#f2f6fa', [u[0] * 1.6, u[1] * 1.6, u[2] * 1.6], { padre: gO }); var bo = K.cil('#c9d3df', { padre: gO }); K.tra(bo, [0, 0, 0], [u[0] * 1.6, u[1] * 1.6, u[2] * 1.6], 0.07); } });
    var nP = 3 - n; [[0, 0, 1], [0, 1, 0]].slice(0, nP).forEach(function (u) { lobo(u, '#b197fc', 0.9, 0.36); lobo([-u[0], -u[1], -u[2]], '#ffd43b', 0.9, 0.36); });
    var ang = { 1: 180, 2: 120, 3: 109.47 }[n];
    K.et(['sp', 'sp²', 'sp³'][n - 1] + ' · ' + fmt(ang, 1) + '°', '#e5dbff', 0.38, [0, 0, 2.3], gO);
    var gH = new T.Group(); K.G.add(gH); gH.position.set(3.2, 0, 0); var A1 = K.sfera(0.3, '#f2f6fa', [0, 0, 0], { padre: gH }), A2 = K.sfera(0.3, '#69db7c', [0, 0, 0], { padre: gH }), nube = K.sfera(1, '#4dabf7', [0, 0, 0], { padre: gH, op: 0.28, ei: 0.4 }), lb = K.et('', '#fff', 0.26, [0, 0, 1.3], gH);
    return { vista: [10.5, 1.3, 1.15, 0],
      passo: function (dt) {
        gO.rotation.z += dt * 0.3; var r = p.bondDist, s = r / 74 * 0.9, ion = Q().carattereIonico(p.polarity), E = Q().morse(r);
        A1.position.set(-s / 2, 0, 0); A2.position.set(s / 2, 0, 0); nube.position.set(s / 2 * ion, 0, 0); nube.scale.set(s / 2 + 0.55, 0.55, 0.55); nube.material.opacity = cl(0.35 * Math.exp(-(r - 74) / 90), 0.04, 0.35);
        K.testi.cambia(lb, 'r = ' + Math.round(r) + ' pm', '#cfe3f7');
        return [[t('ibridazione', 'hybridisation'), ['sp', 'sp²', 'sp³'][n - 1]], [t('angolo', 'angle'), fmt(ang, 1) + '°'], ['E(r) H₂', fmt(E, 0) + ' kJ/mol'], [t('carattere ionico', 'ionic character'), Math.round(ion * 100) + ' %']];
      },
      grafico: function (q, W, H) {
        var x0 = 34, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (r) { return x0 + (r - 40) / 210 * (x1 - x0); }, Yv = function (e) { return y1 - (e + 480) / 680 * (y1 - y0); };
        assi(q, x0, y0, x1, y1, 'r (pm) →', 'E (kJ/mol)'); q.setLineDash([2, 4]); q.strokeStyle = 'rgba(160,175,200,.4)'; q.beginPath(); q.moveTo(x0, Yv(0)); q.lineTo(x1, Yv(0)); q.stroke(); q.setLineDash([]);
        linea(q, function (r) { return Q().morse(r); }, 40, 250, X, function (e) { return Yv(Math.min(200, e)); }, '#4dabf7', 2.4);
        testo(q, 'Dₑ = 458 · rₑ = 74 pm', X(140), Yv(-420), '#9fe7ff'); punto(q, X(p.bondDist), Yv(Math.min(200, Q().morse(p.bondDist))));
      } };
  };

  /* ── 4 · SN2 (la geometria dei Meccanismi 3D) ── */
  M.sn2 = function (K, p, ctx) {
    var T = K.T, M3 = g.BSIMeccanismi3D, m = M3 && M3.M.filter(function (x) { return x.id === 'sn2'; })[0], CPK = { H: ['#f2f6fa', 0.26], C: ['#4a5466', 0.38], O: ['#ff4d4d', 0.36], Br: ['#b04030', 0.5] }, dens = ctx.rappr === 'densita', at = {}, lg = [], banner = K.et('', '#ff8787', 0.42, [0, 0, 3]);
    if (!m) { K.et(t('Meccanismi 3D non caricati', 'Mechanisms 3D not loaded'), '#fff', 0.4, [0, 0, 0]); return { vista: [10, 1, 1.2, 0], passo: function () { return []; }, grafico: function () { } }; }
    var sub = Math.round(p.steric) - 1, metili = Math.min(3, sub);
    Object.keys(m.atomi).forEach(function (id) { var el = m.atomi[id], isMe = el === 'H' && ['H1', 'H2', 'H3'].indexOf(id) >= 0 && ['H1', 'H2', 'H3'].indexOf(id) < metili, c = isMe ? ['#7d8ea8', 0.46] : CPK[el] || CPK.C; at[id] = K.sfera(dens ? c[1] * 1.4 : c[1], c[0], null, dens ? { op: 0.33, ei: 0.25 } : null); if (isMe) at[id].userData.me = true; });
    if (!dens) m.legami.forEach(function (l) { lg.push({ l: l, m: K.cil('#c9d3df') }); });
    var cc = null;
    return { vista: [9, -1.2, 1.2, 0],
      passo: function () {
        var x = cl(p.progress / 100, 0, 1) * m.N, G0 = m.geom(x); if (!cc) { var c0 = [0, 0, 0], n = 0; Object.keys(G0.pos).forEach(function (k) { c0[0] += G0.pos[k][0]; c0[1] += G0.pos[k][1]; c0[2] += G0.pos[k][2]; n++; }); cc = c0.map(function (v) { return v / n; }); }
        Object.keys(at).forEach(function (id) { var q0 = G0.pos[id], pC = G0.pos.C || [0, 0, 0], v = q0; if (at[id].userData.me) { var d = [q0[0] - pC[0], q0[1] - pC[1], q0[2] - pC[2]], l = Math.hypot(d[0], d[1], d[2]) || 1; v = [pC[0] + d[0] / l * 1.5, pC[1] + d[1] / l * 1.5, pC[2] + d[2] / l * 1.5]; } at[id].position.set(v[0] - cc[0], v[1] - cc[1], v[2] - cc[2]); });
        lg.forEach(function (b) { var o = G0.ord[b.l[0] + '-' + b.l[1]]; o = o == null ? 1 : o; var a = at[b.l[0]].position, c = at[b.l[1]].position; K.tra(b.m, [a.x, a.y, a.z], [c.x, c.y, c.z], 0.07); b.m.material.opacity = cl(o, 0.15, 1); b.m.material.transparent = o < 0.98; b.m.visible = b.m.visible && o > 0.05; });
        var Ea = Q().sn2Barriera(sub); K.testi.cambia(banner, sub === 3 ? t('✕ terziario: niente SN2 (→ SN1)', '✕ tertiary: no SN2 (→ SN1)') : '', '#ff8787');
        return [['ξ', Math.round(p.progress) + ' %'], [t('substrato', 'substrate'), F.tt(Q().SN2_SUB[sub].nome)], ['ΔG‡', isFinite(Ea) ? fmt(Ea, 0) + ' kJ/mol' : '—'], [t('velocità relativa', 'relative rate'), Q().SN2_SUB[sub].rel ? String(Q().SN2_SUB[sub].rel).replace('.', t(',', '.')) : '0']];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (s) { return x0 + s * (x1 - x0); }, Yv = function (e) { return y1 - (e + 50) / 160 * (y1 - y0); }, sub = Math.round(p.steric) - 1;
        assi(q, x0, y0, x1, y1, t('coordinata ξ →', 'coordinate ξ →'), 'G (kJ/mol)');
        function perfil(Ea, s) { return Ea * Math.pow(Math.sin(PI * s), 2) - 40 * (s * s * (3 - 2 * s)); }
        [0, 1, 2].forEach(function (i) { var Ea = Q().sn2Barriera(i); linea(q, function (s) { return perfil(Ea, s); }, 0, 1, X, Yv, i === sub ? '#ff8fa3' : 'rgba(160,175,200,.35)', i === sub ? 2.4 : 1.2); testo(q, F.tt(Q().SN2_SUB[i].nome).slice(0, 4), X(0.5) + 4, Yv(Ea) - 2, i === sub ? '#ff8fa3' : 'rgba(200,214,232,.6)', '600 8px system-ui,sans-serif'); });
        if (sub < 3) { var Ea = Q().sn2Barriera(sub), s = p.progress / 100; punto(q, X(s), Yv(perfil(Ea, s))); }
        testo(q, t('ΔΔG‡ = RT·ln(rapporto) · INDICATIVO', 'ΔΔG‡ = RT·ln(ratio) · INDICATIVE'), x0 + 4, y1 - 4, 'rgba(255,192,120,.9)', '500 8px system-ui,sans-serif');
      } };
  };

  /* ── 5 · NMR ── */
  M.nmr = function (K, p) {
    var T = K.T, gruppi = [['CH₃', '#4dabf7', 3, -2.4], ['OH', '#ff6b6b', 1, 0], ['CH₂', '#51cf66', 2, 2.4]], spin = [], ang = 0, B0f = K.freccia('#e9ecef');
    B0f.imposta([-4.2, 0, -1.8], [-4.2, 0, 2.6], 0.06); K.et('B₀', '#e9ecef', 0.4, [-4.2, 0, 3]);
    gruppi.forEach(function (gr) { for (var i = 0; i < gr[2]; i++) { var f = K.freccia(gr[1]), x = gr[3] + (i - (gr[2] - 1) / 2) * 0.75; spin.push({ f: f, x: x, fase: i * 1.1, g: gr[0] }); K.sfera(0.17, gr[1], [x, 0, -0.1], { ei: 0.4 }); } K.et(gr[0], gr[1], 0.38, [gr[3], 0, -1]); });
    return { vista: [10, -1.4, 1.15, 0.4],
      passo: function (dt) {
        var n = Q().nmr(p.b0, p.jCoupling); ang += dt * (0.6 + Math.log(1 + p.b0) * 0.9);
        spin.forEach(function (s) { var th = 0.45, a = ang * (s.g === 'CH₃' ? 1 : s.g === 'OH' ? 1.015 : 1.03) + s.fase; s.f.imposta([s.x, 0, 0], [s.x + Math.sin(th) * Math.cos(a), Math.sin(th) * Math.sin(a), Math.cos(th) * 1.3], 0.045); });
        return [['ν₀ (¹H)', fmt(n.nu0, 1) + ' MHz'], ['J', fmt(p.jCoupling, 1) + ' Hz'], ['J ' + t('in ppm', 'in ppm'), fmt(p.jCoupling / n.nu0, 4)], [t('quartetto CH₂', 'CH₂ quartet'), fmt(3 * p.jCoupling / n.nu0 * 1000, 1) + ' mppm']];
      },
      grafico: function (q, W, H) {
        var n = Q().nmr(p.b0, p.jCoupling), x0 = 12, x1 = W - 12, y0 = 20, y1 = H - 16, a = 4.4, b = 0.6, X = function (d) { return x0 + (a - d) / (a - b) * (x1 - x0); }, Yv = function (v) { return y1 - v * (y1 - y0); }, wid = Math.max(0.0035, 1.2 / n.nu0), MM = 0;
        function spettro(d) { var s = 0; n.righe.forEach(function (r) { var dx = (d - r.ppm) / wid; s += r.I / (1 + dx * dx); }); return s; }
        for (var d = b; d <= a; d += (a - b) / 900) MM = Math.max(MM, spettro(d));
        assi(q, x0, y0, x1, y1, 'δ (ppm) ←', ''); testo(q, t('¹H-NMR etanolo · ', '¹H NMR ethanol · ') + Math.round(n.nu0) + ' MHz', x0 + 4, y0 - 4, '#9fe7ff');
        linea(q, function (d) { return spettro(d) / MM; }, b, a, X, Yv, '#e9ecef', 1.6, false, 1600);
        [4, 3, 2, 1].forEach(function (d) { testo(q, String(d), X(d) - 3, y1 + 10, 'rgba(200,214,232,.8)', '500 8px system-ui,sans-serif'); });
        Q().ETANOLO.forEach(function (gr) { testo(q, gr.nome + ' ' + ['s', 'd', 't', 'q'][gr.vicini], X(gr.d) - 12, y0 + 10, '#7dd3fc', '600 8.5px system-ui,sans-serif'); });
      } };
  };

  /* ── 6 · recettore e dose–risposta ── */
  M.recettore = function (K, p) {
    var T = K.T, rnd = K.seme(3), rec = [], orologio = 0;
    new T.Mesh(new T.BoxGeometry(9, 4, 1), K.mat('#f0b46a', { op: 0.18 })).add; var mm = new T.Mesh(new T.BoxGeometry(9, 4, 1), K.mat('#f0b46a', { op: 0.16 })); K.G.add(mm);
    for (var k = 0; k < 4; k++) { var gR = new T.Group(); gR.position.set(-3.3 + k * 2.2, 0, 0); K.G.add(gR); var eliche = []; for (var j = 0; j < 7; j++) { var a = j * 2 * PI / 7, c = K.cil('#9775fa', { padre: gR }); c.scale.set(0.16, 1.5, 0.16); c.rotation.x = PI / 2; c.position.set(0.5 * Math.cos(a), 0.5 * Math.sin(a), 0); eliche.push(c); }
      var ag = K.sfera(0.26, '#51cf66', [0, 0, 0.9], { padre: gR, ei: 0.5 }), an = new T.Mesh(new T.OctahedronGeometry(0.3), K.mat('#ff6b6b', { ei: 0.4 })); an.position.set(0, 0, 0.9); gR.add(an); rec.push({ ag: ag, an: an, eliche: eliche, st: 'R', timer: rnd() }); }
    var liberiA = [], liberiB = []; for (var i = 0; i < 30; i++) { var m = K.sfera(0.15, '#51cf66', null, { ei: 0.4 }); m.userData = { x: (rnd() - 0.5) * 9, y: (rnd() - 0.5) * 3, z: 1.6 + rnd() * 2, f: rnd() * 9 }; liberiA.push(m); var mb = new T.Mesh(new T.OctahedronGeometry(0.18), K.mat('#ff6b6b', { ei: 0.4 })); K.G.add(mb); mb.userData = { x: (rnd() - 0.5) * 9, y: (rnd() - 0.5) * 3, z: 1.6 + rnd() * 2, f: rnd() * 9 }; liberiB.push(mb); }
    K.et(t('recettori a 7 eliche (GPCR)', '7-helix receptors (GPCR)'), '#e5dbff', 0.32, [0, 0, -1.4]);
    return { vista: [11, -1.3, 1.1, 0.6],
      passo: function (dt) {
        orologio += dt; var A = Math.pow(10, p.logDose), EC = 1e-8, KBv = 2e-9, B = p.antagonist * 1e-9, tot = 1 + A / EC + B / KBv, fA = A / EC / tot, fB = B / KBv / tot, R0 = Q().doseRisposta(p.logDose, p.antagonist);
        rec.forEach(function (r) { r.timer -= dt; if (r.timer <= 0) { r.timer = 0.4 + rnd() * 0.5; var x = rnd(); r.st = x < fA ? 'A' : x < fA + fB ? 'B' : 'R'; } r.ag.visible = r.st === 'A'; r.an.visible = r.st === 'B'; r.eliche.forEach(function (c, j) { var att = r.st === 'A'; c.material.color.set(att ? '#69db7c' : '#9775fa'); c.material.emissive.set(att ? '#69db7c' : '#9775fa'); c.material.emissiveIntensity = att ? 0.45 : 0.12; var a = j * 2 * PI / 7; c.position.set((att ? 0.62 : 0.5) * Math.cos(a), (att ? 0.62 : 0.5) * Math.sin(a), 0); }); });
        var nA = Math.round(cl((p.logDose + 11) / 7, 0, 1) * liberiA.length), nB = Math.round(cl(p.antagonist / 100, 0, 1) * liberiB.length);
        liberiA.forEach(function (m, i) { m.visible = i < nA; var u = m.userData; m.position.set(u.x + 0.3 * Math.sin(orologio + u.f), u.y, u.z + 0.2 * Math.cos(orologio * 1.2 + u.f)); }); liberiB.forEach(function (m, i) { m.visible = i < nB; var u = m.userData; m.position.set(u.x - 0.3 * Math.sin(orologio + u.f), u.y, u.z); m.rotation.y += dt; });
        return [['E/Eₘₐₓ', fmt(R0.E, 2)], ['EC₅₀′', fmt(R0.EC50 * 1e9, 1) + ' nM'], [t('rapporto di dose', 'dose ratio'), fmt(R0.DR, 1)], [t('occupazione', 'occupancy'), Math.round(fA * 100) + ' %']];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (l) { return x0 + (l + 11) / 7 * (x1 - x0); }, Yv = function (e) { return y1 - e / 1.08 * (y1 - y0); };
        assi(q, x0, y0, x1, y1, 'log[A] (M) →', 'E/Eₘₐₓ');
        linea(q, function (l) { return Q().doseRisposta(l, 0).E; }, -11, -4, X, Yv, 'rgba(105,219,124,.7)', 2, p.antagonist > 0);
        if (p.antagonist > 0) linea(q, function (l) { return Q().doseRisposta(l, p.antagonist).E; }, -11, -4, X, Yv, '#ff6b6b', 2.4);
        var R0 = Q().doseRisposta(p.logDose, p.antagonist); q.strokeStyle = '#ffa94d'; q.setLineDash([2, 3]); q.beginPath(); q.moveTo(X(Math.log10(R0.EC50)), y1); q.lineTo(X(Math.log10(R0.EC50)), Yv(0.5)); q.stroke(); q.setLineDash([]); testo(q, 'EC₅₀′', X(Math.log10(R0.EC50)) + 3, y1 - 3, '#ffa94d');
        punto(q, X(p.logDose), Yv(R0.E));
      } };
  };

  /* ── 7 · PCA ── */
  M.pca = function (K, p) {
    var T = K.T, COL = ['#4dabf7', '#ffd43b', '#ff6b6b'], sfere = [], chiave = '', R0 = null;
    for (var i = 0; i < 120; i++) sfere.push(K.sfera(0.11, COL[Math.floor(i / 40)], null, { ei: 0.4 }));
    [[1, 0, 0, 'PC1'], [0, 1, 0, 'PC2'], [0, 0, 1, 'PC3']].forEach(function (a) { var c = K.cil('#64748b'); K.tra(c, [-a[0] * 3.4, -a[1] * 3.4, -a[2] * 3.4], [a[0] * 3.4, a[1] * 3.4, a[2] * 3.4], 0.02); K.et(a[3], '#cbd5e1', 0.3, [a[0] * 3.7, a[1] * 3.7, a[2] * 3.7]); });
    function calcola() { var k = p.separation + '|' + p.noise; if (k === chiave) return; chiave = k; R0 = Q().pca(Q().generaDati(p.separation / 100, p.noise / 100, 7).X); var MM = 0; R0.punteggi.forEach(function (s) { MM = Math.max(MM, Math.abs(s[0]), Math.abs(s[1]), Math.abs(s[2])); }); R0.scala = 3 / (MM || 1); }
    return { vista: [10, 0.9, 1.1, 0],
      passo: function (dt) { calcola(); K.G.rotation.z += dt * 0.15; R0.punteggi.forEach(function (s, i) { var m = sfere[i], tx = s[0] * R0.scala, ty = s[1] * R0.scala, tz = s[2] * R0.scala; m.position.x += (tx - m.position.x) * Math.min(1, dt * 4); m.position.y += (ty - m.position.y) * Math.min(1, dt * 4); m.position.z += (tz - m.position.z) * Math.min(1, dt * 4); });
        return [['PC1', fmt(R0.spiegata[0] * 100, 1) + ' %'], ['PC2', fmt(R0.spiegata[1] * 100, 1) + ' %'], ['PC3', fmt(R0.spiegata[2] * 100, 1) + ' %'], ['Σλ', fmt(R0.traccia, 2)], [t('campioni × var.', 'samples × var.'), '120 × 10']]; },
      grafico: function (q, W, H) {
        calcola(); var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, n = 10, bw = (x1 - x0) / n, Yv = function (v) { return y1 - v * (y1 - y0); }, cum = 0;
        assi(q, x0, y0, x1, y1, t('componente →', 'component →'), t('varianza spiegata', 'explained variance'));
        R0.spiegata.forEach(function (v, i) { q.fillStyle = i < 3 ? '#38bdf8' : 'rgba(56,189,248,.35)'; q.fillRect(x0 + i * bw + bw * 0.18, Yv(v), bw * 0.64, y1 - Yv(v)); testo(q, String(i + 1), x0 + i * bw + bw * 0.42, y1 + 10, 'rgba(200,214,232,.8)', '500 8px system-ui,sans-serif'); });
        q.strokeStyle = '#ffd43b'; q.lineWidth = 1.8; q.beginPath(); R0.spiegata.forEach(function (v, i) { cum += v; var px = x0 + i * bw + bw / 2; if (i) q.lineTo(px, Yv(cum)); else q.moveTo(px, Yv(cum)); }); q.stroke(); q.lineWidth = 1; testo(q, t('— cumulata', '— cumulative'), x1 - 70, y0 + 4, '#ffd43b');
      } };
  };
})(typeof window !== 'undefined' ? window : globalThis);
