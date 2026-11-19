/* ═══════════════════════════════════════════════════════════════════════
   bsi-quantum-studio-motori2.js — i motori 8–16 del Quantum Studio (v265)
   BioSpecInfo · © Samuele Pio Provenzano

   CRISPR, paracetamolo (nomogramma), HPLC/Van Deemter, superficie di
   energia potenziale, Hodgkin–Huxley, qubit (sfera di Bloch e Rabi),
   n-cubi, Calabi–Yau (sezione di Hanson), Gibbs. Stessa interfaccia dei
   primi sette: vista, passo(dt) → telemetria, grafico(q, W, H).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var S = g.BSIQuantumStudio, F = g.BSIFisica;
  if (!S || !F) return;
  var M = S.MOTORI, U = S.util, PI = Math.PI, t = F.t, fmt = U.fmt, cl = U.cl, assi = U.assi, linea = U.linea, punto = U.punto, testo = U.testo;
  function Q() { return g.BSIQuantumDati; }

  /* ── 8 · CRISPR–Cas9 ── */
  M.crispr = function (K, p) {
    var T = K.T, N = 22, passo = 0.6, bp = [], cas = K.sfera(1, '#748ffc', [2.4, 0, 0.2], { op: 0.15, ei: 0.2 }); cas.scale.set(4.6, 2.2, 2.2);
    K.et('Cas9', '#c5d0ff', 0.4, [2.4, 0, 2.6]);
    for (var i = 0; i < N; i++) { var x = -6 + i * passo, a = i * 0.6, pam = i >= 19, seed = i >= 9 && i < 19;
      var s1 = K.sfera(0.14, pam ? '#ffd43b' : '#adb5bd', null, { ei: 0.3 }), s2 = K.sfera(0.14, pam ? '#ffd43b' : '#adb5bd', null, { ei: 0.3 }), r1 = K.cil(pam ? '#ffe066' : '#74c0fc'), r2 = K.cil('#74c0fc'), rna = K.sfera(0.13, '#ff922b', null, { ei: 0.4 });
      bp.push({ x: x, a: a, s1: s1, s2: s2, r1: r1, r2: r2, rna: rna, pam: pam, seed: seed }); }
    var taglio = K.et('✂', '#ff6b6b', 0.7, [0, 0, 1.6]); K.et('PAM 5′-NGG-3′', '#ffe066', 0.3, [-6 + 20 * passo, 0, -1.6]);
    function efficienza() { if (p.pam < 0.5) return 0; var m = Math.round(p.mismatch); return Math.exp(-m * (m <= 2 ? 1.2 : 0.6)); }
    return { vista: [12, -1.45, 1.2, 0],
      passo: function (dt) {
        var apertura = cl(p.helicase / 100, 0, 1) * efficienza(), taglia = apertura > 0.6;
        bp.forEach(function (b) { var ap = b.pam ? 0 : apertura * cl((b.x + 6) / 11, 0, 1); var y1 = 1.7 * Math.cos(b.a) * (1 - ap), z1 = 1.7 * Math.sin(b.a); var y2 = -1.7 * Math.cos(b.a) * (1 - ap * 0.2), z2 = -1.7 * Math.sin(b.a);
          b.s1.position.set(b.x, y1 + ap * 1.3, z1); b.s2.position.set(b.x, y2 - ap * 0.3, z2); K.tra(b.r1, [b.x, 0, 0], [b.x, y1 + ap * 1.3, z1], 0.05); K.tra(b.r2, [b.x, 0, 0], [b.x, y2 - ap * 0.3, z2], 0.05);
          b.rna.visible = ap > 0.1 && !b.pam; b.rna.position.set(b.x, y1 + ap * 1.3 + 0.3, z1); b.rna.material.color.set(b.seed ? '#ff922b' : '#ffd8a8'); });
        taglio.visible = taglia; taglio.position.set(-6 + 18.5 * passo, 0, 1.4 + 0.2 * Math.sin(Date.now() / 150));
        return [[t('apertura R-loop', 'R-loop opening'), Math.round(apertura * 100) + ' %'], ['PAM', p.pam > 0.5 ? t('presente', 'present') : t('assente', 'absent')], [t('errori seed', 'seed mismatches'), Math.round(p.mismatch)], [t('taglio', 'cut'), taglia ? t('sì (HNH + RuvC)', 'yes (HNH + RuvC)') : t('no', 'no')]];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (mm) { return x0 + mm / 5 * (x1 - x0); }, Yv = function (e) { return y1 - e * (y1 - y0); };
        assi(q, x0, y0, x1, y1, t('errori nel seed →', 'seed mismatches →'), t('efficienza di taglio', 'cut efficiency'));
        if (p.pam < 0.5) { testo(q, t('Senza PAM: nessun taglio, a qualunque appaiamento.', 'Without a PAM: no cut, at any pairing.'), x0 + 10, (y0 + y1) / 2, '#ff8787', '600 10px system-ui,sans-serif'); return; }
        linea(q, function (mm) { var m = mm; return Math.exp(-m * (m <= 2 ? 1.2 : 0.6)); }, 0, 5, X, Yv, '#38bdf8', 2.4, false, 60);
        punto(q, X(Math.round(p.mismatch)), Yv(Math.exp(-Math.round(p.mismatch) * (Math.round(p.mismatch) <= 2 ? 1.2 : 0.6))));
        testo(q, t('INDICATIVO · gli errori vicini alla PAM pesano di più', 'INDICATIVE · mismatches near the PAM weigh more'), x0 + 4, y1 - 4, 'rgba(255,192,120,.9)', '500 8px system-ui,sans-serif');
      } };
  };

  /* ── 9 · paracetamolo (nomogramma di Rumack–Matthew) ── */
  M.paracetamolo = function (K, p) {
    var T = K.T, rnd = K.seme(9), fegato = K.sfera(1, '#b04858', [0, 0, 0], { op: 0.3, ei: 0.15 }); fegato.scale.set(2.6, 1.8, 1.6); K.et(t('epatocita', 'hepatocyte'), '#ffd0d8', 0.34, [0, 0, 2.1]);
    var gsh = []; for (var i = 0; i < 40; i++) { var m = K.sfera(0.16, '#51cf66', null, { ei: 0.4 }); m.userData = { x: (rnd() - 0.5) * 3.4, y: (rnd() - 0.5) * 2.4, z: (rnd() - 0.5) * 2, f: rnd() * 9 }; gsh.push(m); }
    var napqi = []; for (i = 0; i < 24; i++) { var mn = new T.Mesh(new T.TetrahedronGeometry(0.22), K.mat('#ff6b6b', { ei: 0.5 })); K.G.add(mn); mn.userData = { x: (rnd() - 0.5) * 3.4, y: (rnd() - 0.5) * 2.4, z: (rnd() - 0.5) * 2, f: rnd() * 9 }; napqi.push(mn); }
    var nac = K.et('', '#8ce99a', 0.38, [0, -2.3, 0]);
    return { vista: [10, 0.9, 1.15, 0],
      passo: function (dt) {
        var r = Q().paracetamolo(p.conc4, p.emivita, p.ore), rischio = cl((r.c - r.linea) / r.linea + 0.5, 0, 1), gshFr = 1 - rischio * 0.8;
        gsh.forEach(function (m, i) { m.visible = i < Math.round(gshFr * gsh.length); var u = m.userData; m.position.set(u.x + 0.25 * Math.sin(Date.now() / 700 + u.f), u.y, u.z); });
        napqi.forEach(function (m, i) { m.visible = i < Math.round(rischio * napqi.length); var u = m.userData; m.position.set(u.x, u.y + 0.2 * Math.cos(Date.now() / 600 + u.f), u.z); m.rotation.x += dt; });
        fegato.material.emissive.set(r.sopra ? '#ff3b4d' : '#b04858'); fegato.material.emissiveIntensity = 0.15 + rischio * 0.4;
        K.testi.cambia(nac, r.sopra ? t('→ N-acetilcisteina', '→ N-acetylcysteine') : t('sotto la linea: osservazione', 'below the line: observe'), r.sopra ? '#ff9a9a' : '#8ce99a');
        return [[t('concentrazione', 'concentration'), fmt(r.c, 0) + ' mg/L'], [t('linea a ' + Math.round(p.ore) + ' h', 'line at ' + Math.round(p.ore) + ' h'), fmt(r.linea, 0) + ' mg/L'], [t('rischio epatico', 'liver risk'), r.sopra ? t('ALTO', 'HIGH') : t('basso', 'low')], [t('glutatione residuo', 'glutathione left'), Math.round(gshFr * 100) + ' %']];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (h) { return x0 + (h - 4) / 20 * (x1 - x0); }, Yv = function (c) { return y1 - Math.log(c / 5) / Math.log(400 / 5) * (y1 - y0); };
        assi(q, x0, y0, x1, y1, t('ore dall\'ingestione →', 'hours since ingestion →'), t('[mg/L], log', '[mg/L], log'));
        linea(q, function (h) { return Q().lineaTrattamento(h); }, 4, 24, X, Yv, '#ff6b6b', 2.2);
        testo(q, t('linea di trattamento', 'treatment line'), X(14), Yv(Q().lineaTrattamento(14)) - 5, '#ff8787', '600 8.5px system-ui,sans-serif');
        linea(q, function (h) { return p.conc4 * Math.pow(2, -(h - 4) / p.emivita); }, 4, 24, X, Yv, '#38bdf8', 2.4);
        var r = Q().paracetamolo(p.conc4, p.emivita, p.ore); punto(q, X(p.ore), Yv(r.c), r.sopra ? '#ff6b6b' : '#38bdf8');
        testo(q, t('nomogramma di Rumack–Matthew', 'Rumack–Matthew nomogram'), x0 + 4, y1 - 4, 'rgba(160,200,255,.9)', '500 8px system-ui,sans-serif');
      } };
  };

  /* ── 10 · HPLC / Van Deemter ── */
  M.hplc = function (K, p) {
    var T = K.T, colonna = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 9, 32, 1, true), K.mat('#334155', { op: 0.25, doppio: true })); colonna.rotation.z = PI / 2; K.G.add(colonna);
    var fase = []; for (var i = 0; i < 120; i++) { var m = K.sfera(0.12, '#475569', [(Math.random() - 0.5) * 8.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6], { ei: 0.05 }); fase.push(m); }
    var bande = Q().ANALITI.map(function (a) { var g0 = new T.Group(); K.G.add(g0); var punti = []; for (var k = 0; k < 40; k++) { var s = K.sfera(0.13, a.col, null, { ei: 0.5, padre: g0 }); punti.push(s); } return { a: a, g: g0, punti: punti }; });
    K.et(t('iniezione', 'injection'), '#cbd5e1', 0.3, [-4.6, 0, -1.6]); K.et(t('rivelatore', 'detector'), '#cbd5e1', 0.3, [4.6, 0, -1.6]);
    var tempo = 0, R0 = null, chiave = '';
    function calc() { var k = p.flowRate + '|' + p.organicPct; if (k === chiave) return; chiave = k; R0 = Q().hplc(p.flowRate, p.organicPct / 100); }
    return { vista: [12, -1.5, 1.2, 0],
      passo: function (dt) {
        calc(); tempo += dt * 8; var tmax = Math.max.apply(null, R0.picchi.map(function (x) { return x.tR; })) * 1.2;
        bande.forEach(function (b, bi) { var pk = R0.picchi[bi], frac = cl(tempo / tmax, 0, 1.3), xpos = -4.3 + frac * (pk.tR / tmax) / (R0.picchi[bi].tR / tmax) * 0; var centro = -4.3 + (tempo / pk.tR) * 8.6, sigmaX = pk.sigma / pk.tR * 8.6;
          b.punti.forEach(function (s, k) { var gaus = (k / 40 - 0.5) * 3; s.position.set(centro + gaus * sigmaX, (Math.random() - 0.5) * 1.3, (Math.random() - 0.5) * 1.3); s.visible = centro > -4.6 && centro < 5; }); });
        return [['u', fmt(R0.u, 2) + ' mm/s'], ['N', Math.round(R0.N) + ' ' + t('piatti', 'plates')], ['H', fmt(R0.H * 1000, 1) + ' µm'], ['Rs ' + t('(1,2)', '(1,2)'), R0.Rs.map(function (x) { return fmt(x, 1); }).join(' · ')]];
      },
      grafico: function (q, W, H) {
        calc(); var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, split = (y0 + y1) / 2;
        testo(q, t('cromatogramma', 'chromatogram'), x0, y0 - 4, '#9fe7ff'); var tmax = Math.max.apply(null, R0.picchi.map(function (x) { return x.tR; })) * 1.15, X = function (tt) { return x0 + tt / tmax * (x1 - x0); }, YvC = function (v) { return split - 4 - v * (split - y0 - 6); };
        q.strokeStyle = 'rgba(140,160,190,.35)'; q.beginPath(); q.moveTo(x0, split - 4); q.lineTo(x1, split - 4); q.stroke();
        R0.picchi.forEach(function (pk) { linea(q, function (tt) { var z = (tt - pk.tR) / pk.sigma; return Math.exp(-z * z / 2); }, 0, tmax, X, YvC, pk.col, 2, false, 120); testo(q, pk.nome, X(pk.tR) - 10, YvC(1) - 2, pk.col, '600 8px system-ui,sans-serif'); });
        var Xd = function (u) { return x0 + u / 3 * (x1 - x0); }, YvH = function (h) { return y1 - h / 0.08 * (y1 - split - 4); };
        testo(q, t('Van Deemter: H(u)', 'Van Deemter: H(u)'), x0, split + 8, '#9fe7ff'); assi(q, x0, split + 12, x1, y1, 'u (mm/s) →', '');
        linea(q, function (u) { return R0.H_di(u); }, 0.05, 3, Xd, YvH, '#ffd43b', 2.2);
        q.strokeStyle = '#ffa94d'; q.setLineDash([2, 3]); q.beginPath(); q.moveTo(Xd(R0.uOtt), y1); q.lineTo(Xd(R0.uOtt), YvH(R0.H_di(R0.uOtt))); q.stroke(); q.setLineDash([]); testo(q, 'u ' + t('ott.', 'opt.'), Xd(R0.uOtt) + 2, y1 - 3, '#ffa94d', '500 8px system-ui,sans-serif');
        punto(q, Xd(cl(R0.u, 0.05, 3)), YvH(R0.H_di(cl(R0.u, 0.05, 3))), '#ffd43b');
      } };
  };

  /* ── 11 · superficie di energia potenziale ── */
  M.pes = function (K, p) {
    var T = K.T, Nx = 48, Ny = 48, geo = new T.PlaneGeometry(6, 6, Nx - 1, Ny - 1), pos = geo.attributes.position, scalaZ = 0.016;
    for (var i = 0; i < pos.count; i++) { var x = pos.getX(i) / 2.2, y = pos.getY(i) / 2.2, z = Q().pes(x, y); pos.setZ(i, cl(z * scalaZ, -2, 4)); }
    geo.computeVertexNormals(); var surf = new T.Mesh(geo, K.mat('#1e3a5f', { op: 0.9, ei: 0.08, r: 0.6, doppio: true })); surf.rotation.x = -PI / 2; K.G.add(surf);
    var wire = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.18 })); wire.rotation.x = -PI / 2; K.G.add(wire);
    var pal = K.sfera(0.18, '#ffffff', [0, 0, 0], { ei: 0.7 }), pts = Q().pesPunti();
    [['R', pts.reagente, '#51cf66'], ['‡', pts.sella, '#ff6b6b'], ['P', pts.prodotto, '#4dabf7']].forEach(function (e) { K.et(e[0], e[2], 0.4, [e[1][0] * 2.2, cl(e[1][1] * scalaZ, -2, 4) + 0.4, 0]); });
    return { vista: [11, 0.9, 0.95, 0],
      passo: function (dt) {
        K.G.rotation.z += dt * 0.08; var s = p.progress / 100, c = Q().pesCammino(s); pal.position.set(c[0] * 2.2, cl(c[2] * scalaZ, -2, 4) + 0.15, c[1] * 2.2);
        var k = Q().eyring(p.tempK, pts.Ea);
        return [[t('cammino', 'path'), Math.round(p.progress) + ' %'], ['Eₐ', fmt(pts.Ea, 1) + ' kJ/mol'], ['ΔE', fmt(pts.dE, 1) + ' kJ/mol'], ['T', Math.round(p.tempK) + ' K'], ['k (Eyring)', U.fmt ? sciNum(k) : k.toExponential(1)]];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (s) { return x0 + s * (x1 - x0); }, lo = -20, hi = 65, Yv = function (e) { return y1 - (e - lo) / (hi - lo) * (y1 - y0); };
        assi(q, x0, y0, x1, y1, t('cammino di reazione →', 'reaction path →'), 'E (kJ/mol)');
        linea(q, function (s) { return Q().pesCammino(s)[2]; }, 0, 1, X, Yv, '#38bdf8', 2.4);
        var s = p.progress / 100; punto(q, X(s), Yv(Q().pesCammino(s)[2]));
        testo(q, t('stato di transizione = sella (max sul cammino)', 'transition state = saddle (max on path)'), x0 + 4, y0 + 4, '#9fe7ff', '500 8px system-ui,sans-serif');
      } };
    function sciNum(x) { var e = Math.floor(Math.log10(Math.abs(x) || 1)); return fmt(x / Math.pow(10, e), 1) + 'e' + e + ' s⁻¹'; }
  };

  /* ── 12 · Hodgkin–Huxley ── */
  M.hh = function (K, p) {
    var T = K.T, mem = new T.Mesh(new T.BoxGeometry(8, 0.6, 3.4), K.mat('#f0b46a', { op: 0.3 })); K.G.add(mem);
    var canali = []; for (var k = 0; k < 4; k++) { var x = -2.7 + k * 1.8, tipoNa = k % 2 === 0, g0 = new T.Group(); g0.position.set(x, 0, 0); K.G.add(g0); for (var j = 0; j < 4; j++) { var a = j * PI / 2, c = K.cil(tipoNa ? '#4dabf7' : '#ffd43b', { padre: g0 }); c.scale.set(0.12, 1.1, 0.12); c.position.set(0.3 * Math.cos(a), 0, 0.3 * Math.sin(a)); } canali.push({ g: g0, na: tipoNa, eliche: g0.children }); K.et(tipoNa ? 'Na⁺' : 'K⁺', tipoNa ? '#9fd3ff' : '#ffe9a8', 0.3, [x, 1.1, 0]); }
    var ioni = []; var rnd = K.seme(4); for (var i = 0; i < 40; i++) { var naI = i < 20, m = K.sfera(0.13, naI ? '#4dabf7' : '#ffd43b', null, { ei: 0.4 }); m.userData = { na: naI, x: (rnd() - 0.5) * 7, z: (rnd() - 0.5) * 3, up: rnd() > 0.5, f: rnd() * 9 }; ioni.push(m); }
    var stato = Q().hhNuovo(p.kOut, p.naCond / 100), storia = [], chiave = '';
    function reset() { var k = p.kOut + '|' + p.naCond; if (k === chiave) return; chiave = k; stato = Q().hhNuovo(p.kOut, p.naCond / 100); storia = []; }
    return { vista: [11, -1.5, 1.2, 0],
      passo: function (dt) {
        reset(); var sub = Math.min(0.08, dt) * 20, pm = Math.max(1, Math.ceil(sub / 0.01)); for (var i = 0; i < pm; i++) { Q().hhPasso(stato, sub / pm, Q().stimolo(stato.t)); } storia.push([stato.t, stato.V]); while (storia.length && storia[0][0] < stato.t - 60) storia.shift();
        var apNa = cl((stato.V + 60) / 80, 0, 1) * (stato.m), apK = stato.n;
        canali.forEach(function (c) { var ap = c.na ? apNa : apK; c.eliche.forEach(function (e, j) { var a = j * PI / 2; e.position.set((0.3 + ap * 0.35) * Math.cos(a), 0, (0.3 + ap * 0.35) * Math.sin(a)); e.material.emissiveIntensity = 0.12 + ap * 0.5; }); });
        ioni.forEach(function (m) { var u = m.userData, ap = u.na ? apNa : apK, y = u.up ? 1.2 : -1.2; m.position.set(u.x + 0.2 * Math.sin(Date.now() / 500 + u.f), (u.na ? (apNa > 0.3 ? -1 : 1) : (apK > 0.4 ? 1 : -1)) * (0.6 + 0.6 * Math.abs(Math.sin(Date.now() / 700 + u.f))), u.z); });
        return [['V', fmt(stato.V, 0) + ' mV'], ['E_K', fmt(stato.EK, 0) + ' mV'], ['m³h · n⁴', fmt(stato.m * stato.m * stato.m * stato.h, 2) + ' · ' + fmt(Math.pow(stato.n, 4), 2)], [t('potenziali', 'spikes'), stato.spari]];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (tt) { return x0 + (tt - (stato.t - 60)) / 60 * (x1 - x0); }, Yv = function (v) { return y1 - (v + 90) / 140 * (y1 - y0); };
        assi(q, x0, y0, x1, y1, t('tempo (ms) →', 'time (ms) →'), 'V (mV)');
        [[-55, 'rgba(255,212,59,.4)', t('soglia', 'threshold')], [stato.EK, 'rgba(255,170,100,.4)', 'E_K'], [0, 'rgba(120,150,200,.3)', '']].forEach(function (l) { q.strokeStyle = l[1]; q.setLineDash([2, 4]); q.beginPath(); q.moveTo(x0, Yv(l[0])); q.lineTo(x1, Yv(l[0])); q.stroke(); q.setLineDash([]); if (l[2]) testo(q, l[2], x0 + 2, Yv(l[0]) - 2, l[1], '500 8px system-ui,sans-serif'); });
        q.strokeStyle = '#4dd4ff'; q.lineWidth = 2; q.beginPath(); storia.forEach(function (s, i) { var px = X(s[0]), py = Yv(s[1]); if (i) q.lineTo(px, py); else q.moveTo(px, py); }); q.stroke(); q.lineWidth = 1;
        if (p.naCond < 1) testo(q, t('g_Na = 0: nessun potenziale (come la tetrodotossina)', 'g_Na = 0: no spike (like tetrodotoxin)'), x0 + 4, y1 - 4, 'rgba(255,150,150,.9)', '500 8px system-ui,sans-serif');
      } };
  };

  /* ── 13 · qubit: sfera di Bloch e Rabi ── */
  M.qubit = function (K, p) {
    var T = K.T, sfera = new T.Mesh(new T.SphereGeometry(2, 32, 24), new T.MeshBasicMaterial({ color: 0x1e3a5f, wireframe: true, transparent: true, opacity: 0.2 })); K.G.add(sfera);
    [[0, 0, 1, '|0⟩', '#51cf66'], [0, 0, -1, '|1⟩', '#ff6b6b'], [1, 0, 0, 'x', '#64748b'], [0, 1, 0, 'y', '#64748b']].forEach(function (e) { K.et(e[3], e[4], 0.34, [e[0] * 2.4, e[1] * 2.4, e[2] * 2.4]); });
    var eq = new T.Mesh(new T.RingGeometry(1.98, 2.02, 48), new T.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, side: T.DoubleSide })); K.G.add(eq);
    var vett = K.freccia('#ffd43b'), punta = K.sfera(0.18, '#ffe066', [0, 0, 2], { ei: 0.8 }), traccia = [], tubi = [], tempo = 0;
    for (var i = 0; i < 60; i++) { var s = K.sfera(0.035, '#ffd43b', [0, 0, 2], { ei: 0.4 }); s.visible = false; tubi.push(s); }
    return { vista: [8.5, 0.9, 1.0, 0],
      passo: function (dt) {
        tempo += dt; var r = Q().rabi(p.rabi, p.detuning, tempo * 3), b = r.bloch;
        vett.imposta([0, 0, 0], [b[0] * 2, b[1] * 2, b[2] * 2], 0.07); punta.position.set(b[0] * 2, b[1] * 2, b[2] * 2);
        traccia.push([b[0] * 2, b[1] * 2, b[2] * 2]); if (traccia.length > tubi.length) traccia.shift(); tubi.forEach(function (s, i) { if (i < traccia.length) { s.visible = true; s.position.set(traccia[i][0], traccia[i][1], traccia[i][2]); s.material.opacity = 0.15 + 0.5 * i / tubi.length; } else s.visible = false; });
        return [['P(|1⟩)', fmt(r.P1, 3)], ['θ', fmt(Math.acos(cl(b[2], -1, 1)) * 180 / PI, 0) + '°'], ['Ω', fmt(p.rabi, 2) + '·2π'], ['Δ', fmt(p.detuning, 2) + '·2π'], ["Ω'", fmt(r.Wp, 2)]];
      },
      grafico: function (q, W, H) {
        var x0 = 30, x1 = W - 10, y0 = 18, y1 = H - 15, per = 6, X = function (tt) { return x0 + tt / per * (x1 - x0); }, Yv = function (v) { return y1 - v * (y1 - y0); };
        assi(q, x0, y0, x1, y1, 'Ω·t/2π →', 'P(|1⟩)'); q.setLineDash([2, 4]); q.strokeStyle = 'rgba(160,175,200,.4)'; q.beginPath(); q.moveTo(x0, Yv(1)); q.lineTo(x1, Yv(1)); q.stroke(); q.setLineDash([]);
        linea(q, function (tt) { return Q().rabi(p.rabi, p.detuning, tt * 2 * PI / p.rabi).P1; }, 0, per, X, Yv, '#ffd43b', 2.4, false, 300);
        var amp = p.rabi * p.rabi / (p.rabi * p.rabi + p.detuning * p.detuning); testo(q, t('ampiezza max = Ω²/Ω′² = ', 'max amplitude = Ω²/Ω′² = ') + fmt(amp, 2), x0 + 4, y0 + 4, '#9fe7ff', '500 8px system-ui,sans-serif');
        punto(q, X((tempo * 3) % (2 * PI) / (2 * PI) * p.rabi % per), Yv(Q().rabi(p.rabi, p.detuning, tempo * 3).P1));
      } };
  };

  /* ── 14 · n-cubi ── */
  M.ncubo = function (K, p) {
    var T = K.T, n = Math.round(p.dimN), c = Q().ncubo(n), geo = new T.BufferGeometry(), arr = new Float32Array(c.E.length * 6); geo.setAttribute('position', new T.BufferAttribute(arr, 3));
    var col = new T.Color(); var cols = new Float32Array(c.E.length * 6); geo.setAttribute('color', new T.BufferAttribute(cols, 3));
    var lines = new T.LineSegments(geo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })); K.G.add(lines);
    var vsfere = K.nuvola(c.V.map(function () { return [0, 0, 0]; }), '#38bdf8', 0.05, { ei: 0.4 }), dummy = new T.Object3D(), tempo = 0;
    return { vista: [9, 0.8, 1.1, 0],
      passo: function (dt) {
        tempo += dt * 0.5; var th = tempo, d = p.focalD, P = c.V.map(function (v) { return Q().proietta(v, th, d).map(function (x) { return x * 2.4; }); });
        c.E.forEach(function (e, i) { var a = P[e[0]], b = P[e[1]]; arr[i * 6] = a[0]; arr[i * 6 + 1] = a[1]; arr[i * 6 + 2] = a[2]; arr[i * 6 + 3] = b[0]; arr[i * 6 + 4] = b[1]; arr[i * 6 + 5] = b[2];
          var prof = (c.V[e[0]][n - 1] + c.V[e[1]][n - 1]) / 2; col.setHSL(0.55 - prof * 0.12, 0.8, 0.6); for (var j = 0; j < 6; j += 3) { cols[i * 6 + j] = col.r; cols[i * 6 + j + 1] = col.g; cols[i * 6 + j + 2] = col.b; } });
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
        P.forEach(function (p0, i) { dummy.position.set(p0[0], p0[1], p0[2]); dummy.updateMatrix(); vsfere.setMatrixAt(i, dummy.matrix); }); vsfere.instanceMatrix.needsUpdate = true;
        var th360 = Math.round(th * 180 / PI) % 360;
        return [['n', n + 'D'], [t('vertici 2ⁿ', 'vertices 2ⁿ'), c.V.length], [t('spigoli', 'edges'), c.E.length], [t('facce quadrate', 'square faces'), c.facce2], ['R_xw', th360 + '°']];
      },
      grafico: function (q, W, H) {
        var x0 = 14, y0 = 20, cx = x0 + 70, cy = (y0 + H) / 2, s = 26, tempo2 = (Date.now() / 1000 * 0.5) % (2 * PI), cc = Math.cos(tempo2), ss = Math.sin(tempo2);
        testo(q, t('matrice di rotazione nel piano x–w', 'rotation matrix in the x–w plane'), x0, y0 - 4, '#9fe7ff', '600 9px system-ui,sans-serif');
        var mtx = [['cos', '0', '0', '−sin'], ['0', '1', '0', '0'], ['0', '0', '1', '0'], ['sin', '0', '0', 'cos']], val = [[fmt(cc, 2), '0', '', fmt(-ss, 2)], ['0', '1', '', '0'], ['', '', '⋱', ''], [fmt(ss, 2), '0', '', fmt(cc, 2)]];
        q.strokeStyle = 'rgba(56,189,248,.6)'; q.beginPath(); q.moveTo(cx - 8, cy - 2 * s); q.lineTo(cx - 12, cy - 2 * s); q.lineTo(cx - 12, cy + 2 * s); q.lineTo(cx - 8, cy + 2 * s); q.moveTo(cx + 4.2 * s, cy - 2 * s); q.lineTo(cx + 4.2 * s + 4, cy - 2 * s); q.lineTo(cx + 4.2 * s + 4, cy + 2 * s); q.lineTo(cx + 4.2 * s, cy + 2 * s); q.stroke();
        for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var v = val[i][j]; if (!v) continue; testo(q, v, cx + j * s, cy + (i - 1.5) * s + 3, v === '1' || /[.,]/.test(v) ? '#e9ecef' : '#7dd3fc', '600 9px ui-monospace,Menlo,monospace'); }
        testo(q, t('ruota attorno al PIANO y–z (resta fermo)', 'rotates about the y–z PLANE (fixed)'), x0, H - 6, 'rgba(160,200,255,.9)', '500 8px system-ui,sans-serif');
      } };
  };

  /* ── 15 · Calabi–Yau (sezione di Hanson) ── */
  M.calabiyau = function (K, p) {
    var T = K.T, n = Math.round(p.n), K1 = 14, K2 = 9, geoms = [], mats = [], grp = new T.Group(); K.G.add(grp);
    function costruisci() { while (grp.children.length) { var o = grp.children.pop(); if (o.geometry) o.geometry.dispose(); } var al = p.alfa * PI / 180, ca = Math.cos(al), sa = Math.sin(al);
      for (var k1 = 0; k1 < n; k1++) for (var k2 = 0; k2 < n; k2++) { var geo = new T.PlaneGeometry(1, 1, K1, K2), pos = geo.attributes.position, idx = 0;
        for (var ia = 0; ia <= K1; ia++) for (var ib = 0; ib <= K2; ib++) { var a = -1 + 2 * ia / K1, b = (ib / K2) * PI / 2, P = Q().calabiYau(n, k1, k2, a, b); var x = P.z1[0], y = P.z2[0], z = P.z1[1] * ca + P.z2[1] * sa; pos.setXYZ(idx++, x * 2.2, y * 2.2, z * 2.2); }
        geo.computeVertexNormals(); var col = new T.Color().setHSL((k1 / n * 0.5 + k2 / n * 0.2) % 1, 0.7, 0.55), mesh = new T.Mesh(geo, K.mat('#' + col.getHexString(), { op: 0.72, ei: 0.2, doppio: true, r: 0.5 })); grp.add(mesh); } }
    costruisci(); var chiave = n + '|' + p.alfa;
    return { vista: [8.5, 0.9, 1.0, 0],
      passo: function (dt) { var k = Math.round(p.n) + '|' + Math.round(p.alfa / 5); if (k !== chiave) { chiave = k; n = Math.round(p.n); costruisci(); } grp.rotation.z += dt * 0.12; grp.rotation.x += dt * 0.05;
        var hodge = n === 5 ? { h11: 1, h21: 101, chi: -200 } : { h11: '—', h21: '—', chi: '—' };
        return [[t('grado', 'degree'), 'n = ' + n], [t('pezzi', 'patches'), n * n], ['h¹¹', hodge.h11], ['h²¹', hodge.h21], ['χ', hodge.chi]]; },
      grafico: function (q, W, H) {
        var x0 = 14, y0 = 22, lh = 15;
        testo(q, t('quintica di Fermat: z₁⁵ + z₂⁵ = 1', 'Fermat quintic: z₁⁵ + z₂⁵ = 1'), x0, y0, '#9fe7ff', '600 10px system-ui,sans-serif');
        [t('• 6 dimensioni in più, arrotolate (compattificate)', '• 6 extra dimensions, curled up (compactified)'), t('• tre dimensioni complesse: non si disegna', '• three complex dimensions: cannot be drawn'), t('• qui: la sezione 2D reale di Hanson', '• here: Hanson\'s real 2D cross-section'), t('• numeri di Hodge h¹¹ = 1, h²¹ = 101', '• Hodge numbers h¹¹ = 1, h²¹ = 101'), t('• χ = 2(h¹¹ − h²¹) = −200', '• χ = 2(h¹¹ − h²¹) = −200')].forEach(function (s, i) { testo(q, s, x0, y0 + 18 + i * lh, '#cfe3f7', '500 9.5px system-ui,sans-serif'); });
        testo(q, t('ogni punto soddisfa z₁ⁿ + z₂ⁿ = 1 (controllato dal banco)', 'every point satisfies z₁ⁿ + z₂ⁿ = 1 (bench-checked)'), x0, H - 6, 'rgba(160,200,255,.9)', '500 8px system-ui,sans-serif');
      } };
  };

  /* ── 16 · Gibbs ── */
  M.gibbs = function (K, p) {
    var T = K.T, rnd = K.seme(2), scatola = new T.Mesh(new T.BoxGeometry(5, 4, 4), new T.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.2 })); K.G.add(scatola);
    var mol = []; for (var i = 0; i < 60; i++) { var m = K.sfera(0.18, '#4dabf7', [(rnd() - 0.5) * 4.6, (rnd() - 0.5) * 3.6, (rnd() - 0.5) * 3.6], { ei: 0.4 }); m.userData = { B: false, vx: (rnd() - 0.5), vy: (rnd() - 0.5), vz: (rnd() - 0.5), f: rnd() * 9 }; mol.push(m); }
    K.et('A ⇌ B', '#e9ecef', 0.4, [0, 2.4, 0]);
    return { vista: [10, 0.8, 1.1, 0],
      passo: function (dt) {
        var r = Q().gibbs(p.tempK, p.deltaH, p.deltaS), fB = r.K / (1 + r.K), nB = Math.round(fB * mol.length);
        mol.forEach(function (m, i) { var vuoiB = i < nB; if (m.userData.B !== vuoiB) { m.userData.B = vuoiB; m.material.color.set(vuoiB ? '#ff922b' : '#4dabf7'); m.material.emissive.set(vuoiB ? '#ff922b' : '#4dabf7'); } var u = m.userData, v = 0.5 + p.tempK / 600; m.position.x += u.vx * dt * v; m.position.y += u.vy * dt * v; m.position.z += u.vz * dt * v; ['x', 'y', 'z'].forEach(function (ax, k) { var lim = [2.4, 1.9, 1.9][k]; if (Math.abs(m.position[ax]) > lim) { m.position[ax] = Math.sign(m.position[ax]) * lim; u[['vx', 'vy', 'vz'][k]] *= -1; } }); });
        return [['ΔG', fmt(r.dG, 1) + ' kJ/mol'], ['K', r.K > 1000 || r.K < 0.001 ? r.K.toExponential(1) : fmt(r.K, 2)], [t('spontanea?', 'spontaneous?'), r.dG < 0 ? t('sì', 'yes') : t('no', 'no')], ['T* = ΔH/ΔS', isFinite(r.Tstar) ? Math.round(r.Tstar) + ' K' : '—'], ['E° (n=2)', fmt(r.E, 3) + ' V']];
      },
      grafico: function (q, W, H) {
        var x0 = 34, x1 = W - 10, y0 = 18, y1 = H - 15, X = function (T0) { return x0 + (T0 - 200) / 800 * (x1 - x0); }, lo = -120, hi = 120, Yv = function (e) { return y1 - (e - lo) / (hi - lo) * (y1 - y0); };
        assi(q, x0, y0, x1, y1, 'T (K) →', 'ΔG (kJ/mol)'); q.setLineDash([2, 4]); q.strokeStyle = 'rgba(160,175,200,.4)'; q.beginPath(); q.moveTo(x0, Yv(0)); q.lineTo(x1, Yv(0)); q.stroke(); q.setLineDash([]);
        linea(q, function (T0) { return Q().gibbs(T0, p.deltaH, p.deltaS).dG; }, 200, 1000, X, Yv, '#38bdf8', 2.4);
        var r = Q().gibbs(p.tempK, p.deltaH, p.deltaS); if (isFinite(r.Tstar) && r.Tstar > 200 && r.Tstar < 1000) { q.strokeStyle = '#ffa94d'; q.setLineDash([2, 3]); q.beginPath(); q.moveTo(X(r.Tstar), y0); q.lineTo(X(r.Tstar), y1); q.stroke(); q.setLineDash([]); testo(q, 'T*', X(r.Tstar) + 2, y0 + 8, '#ffa94d'); }
        punto(q, X(p.tempK), Yv(cl(r.dG, lo, hi)));
        testo(q, t('sotto lo zero: spontanea', 'below zero: spontaneous'), x0 + 4, Yv(0) + 10, 'rgba(105,219,124,.8)', '500 8px system-ui,sans-serif');
      } };
  };
})(typeof window !== 'undefined' ? window : globalThis);
