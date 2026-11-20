/* ═══════════════════════════════════════════════════════════════════════
   bsi-inorganica-quantum.js — ⚗️ Inorganica quantistica: la pagina 3D (v268)
   BioSpecInfo · © Samuele Pio Provenzano

   Quattro schede, ognuna con il modello 3D a sinistra (motore locale
   BSILab3D, 8K) e il risultato calcolato — numeri e combinazioni — a
   destra, dai solutori di bsi-inorganica-quantum-dati.js:

   ⚛️ Slater — l'atomo con il guscio di valenza al raggio più probabile e la
      forma angolare dell'orbitale; σ, ζ, n*, r_mp, ⟨r⟩.
   🔷 Hückel — gli atomi del sistema π con i lobi 2p_z proporzionali ai
      coefficienti (fase + / −) dell'orbitale scelto; livelli energetici,
      energia di delocalizzazione.
   🧩 SALC — l'atomo centrale e i leganti nella geometria VSEPR; la tabella
      delle interazioni filtrate per soglia ΔE, con il cursore della soglia.
   🧲 Complessi — il metallo e i leganti nella geometria; VBT, CFT (con lo
      splitting e il riempimento), LFT, CFSE, μ, Jahn–Teller.

   Collegato a SPECTRA_3D_BRIDGE e all'assistente vocale con lo strumento
   inorganica_quantica. Niente moduli ES né CDN.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;
  var t = F.t, PI = Math.PI;
  function Q() { return g.BSIInorganicaDati; }
  var MENO_MOTO = false; try { MENO_MOTO = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  function cl(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function fmt(x, n) { if (x == null || !isFinite(x)) return '—'; return (+x).toFixed(n == null ? 2 : n).replace('.', t(',', '.')); }

  function stile() {
    if (D.getElementById('bsiIQ-stile')) return; var s = D.createElement('style'); s.id = 'bsiIQ-stile';
    s.textContent = '.bsiIQ{display:grid;gap:12px}@media (min-width:1000px){.bsiIQ{grid-template-columns:1.15fr 1fr;align-items:start}}' +
      '.bsiIQ-palco{position:relative;border-radius:12px;overflow:hidden;background:#03060d}.bsiIQ-palco .bsi3d-box{margin:0;border-radius:12px}' +
      '.bsiIQ-tit{position:absolute;left:10px;right:10px;top:46px;pointer-events:none;color:#fff;font:800 clamp(13px,3.6vw,16px)/1.25 system-ui,sans-serif;text-shadow:0 1px 4px #000}.bsiIQ-tit small{display:block;margin-top:3px;font:600 11px ui-monospace,Menlo,monospace;color:#9fe7ff}' +
      '.bsiIQ-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}.bsiIQ-chips button{min-height:36px;border-radius:18px;border:1px solid #2a4a6e;background:#0a1b2e;color:#cfe3f7;font:600 .78rem system-ui,sans-serif;padding:4px 11px;cursor:pointer}.bsiIQ-chips button[aria-pressed="true"]{border-color:#f5c451;color:#fff;background:#8a6d1f}' +
      '.bsiIQ-sl{display:grid;gap:8px;margin:6px 0}.bsiIQ-sl label{font:500 .82rem system-ui,sans-serif;color:#cfe3f7;display:block}.bsiIQ-sl label span{display:flex;justify-content:space-between}.bsiIQ-sl b{color:#f5c451}.bsiIQ-sl input{width:100%;accent-color:#f5c451}.bsiIQ-sl select{min-height:36px;background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:7px;padding:4px 8px}' +
      '.bsiIQ-rep{background:#0a1628;border:1px solid #1a3050;border-radius:12px;padding:12px 14px;color:#dfe8f2;font:500 .9rem/1.55 system-ui,sans-serif}.bsiIQ-rep h4{margin:0 0 6px;color:#fff;font:800 1rem system-ui,sans-serif}.bsiIQ-eq{font:600 .82rem/1.5 ui-monospace,Menlo,monospace;color:#9fe7ff;background:#050b16;border:1px solid #1a3050;border-radius:8px;padding:7px 9px;margin:7px 0;overflow-x:auto}' +
      '.bsiIQ-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:6px;margin:6px 0}.bsiIQ-grid div{background:#081326;border:1px solid #16304e;border-radius:9px;padding:5px 8px;color:#9fb3c8;font:500 .68rem system-ui,sans-serif}.bsiIQ-grid b{display:block;color:#fff;font:800 .98rem ui-monospace,Menlo,monospace}' +
      '.bsiIQ-tab{width:100%;border-collapse:collapse;font:500 .78rem system-ui,sans-serif;margin:6px 0}.bsiIQ-tab th,.bsiIQ-tab td{border:1px solid #1a3050;padding:3px 6px;text-align:left}.bsiIQ-tab th{background:#0b2036;color:#9fe7ff}.bsiIQ-tab .on{color:#8ce99a;font-weight:700}.bsiIQ-tab .off{color:#6b7a8d}' +
      '.bsiIQ-box{margin:7px 0;padding:8px 10px;border-radius:9px;font:500 .86rem/1.5 system-ui,sans-serif}.bsiIQ-vbt{background:#101a33;border:1px solid #2a3a6e;color:#bcd0ff}.bsiIQ-cft{background:#10261f;border:1px solid #1f5a3a;color:#9ae6b4}.bsiIQ-lft{background:#2a1430;border:1px solid #5a2a6e;color:#e6b8ff}.bsiIQ-box b{color:#fff}';
    D.head.appendChild(s);
  }

  /* ═══ testi 3D nitidi ═══════════════════════════════════════════════════ */
  function creaTesti(T) { var cache = {}; function tex(s, col) { var k = s + col; if (cache[k]) return cache[k]; var c = D.createElement('canvas'), q = c.getContext('2d'), px = 44, K = 2.5; q.font = '700 ' + px + 'px system-ui'; var w = Math.ceil(q.measureText(s).width) + 14, h = px + 14; c.width = Math.ceil(w * K); c.height = Math.ceil(h * K); q.setTransform(K, 0, 0, K, 0, 0); q.font = '700 ' + px + 'px system-ui'; q.textBaseline = 'middle'; q.lineWidth = 6; q.strokeStyle = 'rgba(3,6,14,.85)'; q.strokeText(s, 7, h / 2); q.fillStyle = col; q.fillText(s, 7, h / 2); var tx = new T.CanvasTexture(c); tx.minFilter = T.LinearFilter; cache[k] = { tx: tx, r: w / h }; return cache[k]; }
    return { sprite: function (s, col, h) { var o = tex(s, col || '#fff'), sp = new T.Sprite(new T.SpriteMaterial({ map: o.tx, transparent: true, depthTest: false })); sp.scale.set(h * o.r, h, 1); sp.renderOrder = 30; return sp; }, distruggi: function () { Object.keys(cache).forEach(function (k) { cache[k].tx.dispose(); }); } }; }
  function kit(T, G) { var geoS = new T.SphereGeometry(1, 24, 18), geoC = new T.CylinderGeometry(1, 1, 1, 14, 1), Y = new T.Vector3(0, 1, 0), tmp = new T.Vector3();
    return { geoS: geoS, geoC: geoC, mat: function (c, o) { o = o || {}; return new T.MeshStandardMaterial({ color: c, emissive: o.em || c, emissiveIntensity: o.ei != null ? o.ei : 0.15, roughness: o.r != null ? o.r : 0.4, metalness: o.me || 0.05, transparent: o.op != null, opacity: o.op != null ? o.op : 1, wireframe: !!o.wire, side: o.doppio ? T.DoubleSide : T.FrontSide }); },
      sfera: function (r, c, p, o) { var m = new T.Mesh(geoS, this.mat(c, o)); m.scale.setScalar(r); if (p) m.position.set(p[0], p[1], p[2]); G.add(m); return m; },
      bastone: function (a, b, r, c) { var m = new T.Mesh(geoC, this.mat(c || '#9fb3c8', { ei: 0.05 })), dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.scale.set(r, l, r); tmp.set(dx / l, dy / l, dz / l); m.quaternion.setFromUnitVectors(Y, tmp); G.add(m); return m; } };
  }
  /* una scena BSILab3D con intestazione */
  function scena(palco, L3, titolo, sotto, poi) {
    var largo = (g.innerWidth || 400) > 1000, S = new L3.Scena(palco, largo ? 0.66 : 1.05); palco.insertBefore(S.box, palco.firstChild); S.adatta(); S.ren.setClearColor(0x03060d, 1);
    if (S.cinema) try { S.cinema({ forza: 0.3, soglia: 0.82, vignetta: 0.3, esposizione: 0.98 }); } catch (e) { }
    var tit = F.el('div', { 'class': 'bsiIQ-tit' }); tit.innerHTML = titolo + (sotto ? '<small>' + sotto + '</small>' : ''); S.box.appendChild(tit);
    poi(S); return S;
  }
  function distanza(S, r) { var asp = S.cam.aspect || 0.8, fv = S.cam.fov * PI / 180, fmin = Math.min(fv, 2 * Math.atan(Math.tan(fv / 2) * asp)); return r / Math.sin(fmin / 2) * 0.72; }

  /* ═══ costruttore generico di scheda: scelte + palco 3D + report ════════ */
  function schedaBase(div, opz) {
    stile(); if (div._iq) { try { div._iq.distruggi(); } catch (e) { } }
    var scelte = F.el('div', { 'class': 'bsiIQ-chips', role: 'group', 'aria-label': opz.ariaScelte }), sinistra = F.el('div'), palco = F.el('div', { 'class': 'bsiIQ-palco' }), sliders = F.el('div', { 'class': 'bsiIQ-sl' }), rep = F.el('div', { 'class': 'bsiIQ-rep', 'aria-live': 'polite' });
    var wrap = F.el('div', { 'class': 'bsiIQ' }); sinistra.appendChild(palco); sinistra.appendChild(sliders); wrap.appendChild(sinistra); wrap.appendChild(rep);
    div.appendChild(scelte); div.appendChild(wrap);
    var api = { pronto: false, distruggi: function () { } }, vivo = true, S = null, testi = null, G = null, K = null;
    api.distruggi = function () { vivo = false; if (S) S.pulisci(); if (testi) testi.distruggi(); }; div._iq = api;
    var L3 = g.BSILab3D; if (!L3 || !Q()) { palco.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return api; }
    L3.stile();
    L3.caricaThree().then(function () {
      if (!vivo) return; var T = g.THREE; testi = creaTesti(T);
      S = scena(palco, L3, opz.titolo(), opz.sotto ? opz.sotto() : '', function () { });
      function ricostruisci() {
        if (G) { S.radice.remove(G); G.traverse(function (o) { if (o.geometry && o.geometry !== (K && K.geoS) && o.geometry !== (K && K.geoC)) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); } }); }
        G = new T.Group(); S.aggiungi(G); K = kit(T, G);
        var r = opz.render(T, G, K, testi, api.stato);
        if (r && r.vista) { S.inquadra(distanza(S, r.vista), r.th || 0.9, r.ph || 1.1); S.vista.bersaglio.set(0, 0, r.bz || 0); }
        if (S.titolo) { }
        var tit = palco.querySelector('.bsiIQ-tit'); if (tit) tit.innerHTML = opz.titolo() + (opz.sotto ? '<small>' + opz.sotto() + '</small>' : '');
        rep.innerHTML = opz.report(api.stato); S.avvia();
      }
      api.ricostruisci = ricostruisci; api.S = S;
      opz.controlli(scelte, sliders, api, ricostruisci);
      S.ogniFotogramma(function (dt) { if (!vivo) return false; if (D.hidden) return true; if (!MENO_MOTO && S.gira) S.vista.th += dt * 0.12; if (opz.anima) opz.anima(dt, G); return S.gira || !!opz.anima; });
      api.pronto = true; ricostruisci();
    }).catch(function (e) { palco.textContent = '⚠ ' + e.message; });
    return api;
  }
  function chip(cont, testo, attivo, onclick) { var b = F.el('button', { type: 'button', 'aria-pressed': String(!!attivo), testo: testo, onclick: function () { [].forEach.call(cont.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); onclick(); } }); cont.appendChild(b); return b; }

  /* ═══ 1 · SLATER ════════════════════════════════════════════════════════ */
  var ORB_ANG = { s: '2s', pz: '2p_z', px: '2p_x', dz2: '3d_z²', 'dx2y2': '3d_x²-y²', dxz: '3d_xz' };
  function schedaSlater(div) {
    return schedaBase(div, { ariaScelte: t('Elementi', 'Elements'),
      stato: { sym: 'B', orb: 'pz' },
      titolo: function () { var e = Q().elemento(this.stato ? this.stato.sym : 'B') || {}; return t('Slater: ', 'Slater: ') + (this.stato ? this.stato.sym : 'B') + ' (Z = ' + (e.Z || '') + ')'; },
      sotto: function () { return 'ζ = Z − σ · r_mp = n*²/ζ · |Y_lm(θ,φ)|²'; },
      controlli: function (scelte, sliders, api, ric) {
        api.stato = api.stato || { sym: 'B', orb: 'pz' };
        ['B', 'C', 'N', 'O', 'F', 'Na', 'Si', 'P', 'S', 'Cl', 'Se', 'Br', 'I', 'Xe'].forEach(function (s) { chip(scelte, s, s === api.stato.sym, function () { api.stato.sym = s; ric(); }); });
        var sel = F.el('select', { 'aria-label': t('Orbitale angolare', 'Angular orbital') }); Object.keys(ORB_ANG).forEach(function (o) { sel.appendChild(F.el('option', { value: o, testo: ORB_ANG[o].replace('_', '') })); }); sel.value = api.stato.orb; sel.addEventListener('change', function () { api.stato.orb = sel.value; ric(); });
        sliders.appendChild(F.el('label', {}, [F.el('span', { testo: t('Forma angolare |Y|²', 'Angular shape |Y|²') }), sel]));
      },
      render: function (T, G, K, testi, st) {
        var e = Q().elemento(st.sym); if (!e) return { vista: 5 };
        K.sfera(0.42, '#ef4444', [0, 0, 0], { ei: 0.4 });   /* nucleo */
        var rvis = cl(e.rmp_a0 * 0.9, 1.1, 4.2);
        K.sfera(rvis, '#38bdf8', [0, 0, 0], { wire: true, op: 0.3, doppio: true });   /* guscio al r_mp */
        /* lobo angolare |Y|² come superficie di rivoluzione */
        var A = Q().ANGOLARI[st.orb]; if (A) { var pts = []; for (var i = 0; i <= 40; i++) { var th = i / 40 * PI, rr = Math.sqrt(Math.max(0, A.f(th))) * rvis * 0.9; pts.push(new T.Vector2(Math.sin(th) * rr, Math.cos(th) * rr)); }
          var lathe = new T.Mesh(new T.LatheGeometry(pts, 48), K.mat('#f5c451', { op: 0.45, ei: 0.35, doppio: true })); G.add(lathe); }
        var et = testi.sprite(st.sym, '#ffffff', 0.6); et.position.set(0, 0, rvis + 0.6); G.add(et);
        return { vista: rvis + 1.5, th: 0.9, ph: 1.0 };
      },
      report: function (st) {
        var e = Q().elemento(st.sym), a = Q().angolo(st.orb) || {};
        return '<h4>' + st.sym + ' — ' + e.conf + '</h4><div class="bsiIQ-grid"><div>σ (schermo)<b>' + fmt(e.sigma, 2) + '</b></div><div>ζ = Z − σ<b>' + fmt(e.zeta, 2) + '</b></div><div>n*<b>' + fmt(e.nStar, 1) + '</b></div><div>r_mp<b>' + fmt(e.rmp_a0, 2) + ' a₀</b></div><div>r_mp<b>' + fmt(e.rmp_pm, 0) + ' pm</b></div><div>⟨r⟩<b>' + fmt(e.rmedio_a0, 2) + ' a₀</b></div></div>' +
          '<div class="bsiIQ-eq">gruppo di valenza ' + e.gruppo + ' · l = ' + e.l + '</div>' +
          '<div class="bsiIQ-box bsiIQ-cft"><b>' + ORB_ANG[st.orb] + '</b>: massimo di |Y|² a θ = ' + fmt(a.thetaMax, 1) + '° (cos²θ = ' + fmt(a.cos2, 3) + ')' + (a.nodi && a.nodi.length ? ', piani/coni nodali a ' + a.nodi.map(function (x) { return fmt(x, 1) + '°'; }).join(', ') : '') + '</div>' +
          '<div class="bsiFX-nota">' + t('Regole di Slater standard (1930). I raggi vengono dalle formule idrogenoidi con ζ e n*; sono INDICATIVI dove un esame usa convenzioni diverse.', 'Standard Slater rules (1930). Radii from hydrogenic formulas with ζ and n*; INDICATIVE where a course uses different conventions.') + '</div>';
      }
    });
  }

  /* ═══ 2 · HÜCKEL ════════════════════════════════════════════════════════ */
  function schedaHuckel(div) {
    return schedaBase(div, { ariaScelte: t('Sistemi π', 'π systems'),
      stato: { sys: 'butadiene', orb: 0 },
      titolo: function () { var s = Q().HUCKEL[this.stato ? this.stato.sys : 'butadiene']; return s.nome; },
      sotto: function () { return 'det|H_ij − E·δ_ij| = 0 · E = α + xβ'; },
      controlli: function (scelte, sliders, api, ric) {
        api.stato = api.stato || { sys: 'butadiene', orb: 0 };
        Object.keys(Q().HUCKEL).forEach(function (k) { chip(scelte, Q().HUCKEL[k].nome.split(/[ (/]/)[0], k === api.stato.sys, function () { api.stato.sys = k; api.stato.orb = 0; aggSel(); ric(); }); });
        var sel = F.el('select', { 'aria-label': t('Orbitale da disegnare', 'Orbital to draw') }); sliders.appendChild(F.el('label', {}, [F.el('span', { testo: t('Orbitale (lobi 2p_z)', 'Orbital (2p_z lobes)') }), sel]));
        function aggSel() { var r = Q().huckel(Q().HUCKEL[api.stato.sys]); sel.innerHTML = ''; r.orbitali.forEach(function (o, i) { sel.appendChild(F.el('option', { value: String(i), testo: 'ψ' + (i + 1) + '  (α ' + (o.x >= 0 ? '+ ' : '− ') + fmt(Math.abs(o.x), 3) + 'β, ' + o.occ + 'e⁻)' })); }); sel.value = String(api.stato.orb); }
        sel.addEventListener('change', function () { api.stato.orb = +sel.value; ric(); }); aggSel(); api._aggSel = aggSel;
      },
      render: function (T, G, K, testi, st) {
        var r = Q().huckel(Q().HUCKEL[st.sys]), n = r.n, orb = r.orbitali[st.orb] || r.orbitali[0], anello = Q().HUCKEL[st.sys].legami.length >= n;
        var pos = []; for (var i = 0; i < n; i++) { var ang = i * 2 * PI / n, rad = n <= 2 ? 1.4 : n === 3 ? 2.0 : 2.4; pos.push(n === 2 ? [i * 2.4 - 1.2, 0, 0] : [Math.cos(ang) * rad, 0, Math.sin(ang) * rad]); }
        Q().HUCKEL[st.sys].legami.forEach(function (l) { K.bastone(pos[l[0]], pos[l[1]], 0.07, '#64748b'); });
        pos.forEach(function (p, i) { K.sfera(0.33, '#94a3b8', p, { ei: 0.1 }); var c = orb.coeff[i] || 0, sz = cl(Math.abs(c) * 2.2, 0.35, 1.2);
          K.sfera(sz * 0.5, c >= 0 ? '#38bdf8' : '#a855f7', [p[0], sz * 0.7, p[2]], { op: 0.8, ei: 0.3 });
          K.sfera(sz * 0.5, c >= 0 ? '#a855f7' : '#38bdf8', [p[0], -sz * 0.7, p[2]], { op: 0.8, ei: 0.3 });
          var et = testi.sprite((c >= 0 ? '+' : '−') + fmt(Math.abs(c), 2), '#e6f2ff', 0.3); et.position.set(p[0], sz * 0.7 + 0.5, p[2]); G.add(et); });
        return { vista: (n <= 2 ? 2.2 : 2.6) + 2.2, th: -1.0, ph: 1.15 };
      },
      report: function (st) {
        var r = Q().huckel(Q().HUCKEL[st.sys]);
        var righe = r.orbitali.map(function (o, i) { return '<tr><td>ψ' + (i + 1) + '</td><td>α ' + (o.x >= 0 ? '+ ' : '− ') + fmt(Math.abs(o.x), 3) + 'β</td><td>' + o.occ + ' e⁻</td><td class="off">[' + o.coeff.join(', ') + ']</td></tr>'; }).join('');
        return '<h4>' + r.nome + '</h4><div class="bsiIQ-grid"><div>' + t('centri', 'centres') + '<b>' + r.n + '</b></div><div>' + t('elettroni π', 'π electrons') + '<b>' + r.elettroni + '</b></div><div>E_π<b>' + r.elettroni + 'α ' + (r.Epi_coeffBeta >= 0 ? '+ ' : '− ') + fmt(Math.abs(r.Epi_coeffBeta), 3) + 'β</b></div>' + (r.deloc_coeffBeta != null ? '<div>E_deloc<b>' + fmt(r.deloc_coeffBeta, 3) + 'β</b></div>' : '') + '</div>' +
          '<table class="bsiIQ-tab"><tr><th>MO</th><th>E</th><th>occ</th><th>' + t('coefficienti (∑c² = 1)', 'coefficients (∑c² = 1)') + '</th></tr>' + righe + '</table>' +
          (r.note || []).map(function (x) { return '<div class="bsiIQ-box bsiIQ-vbt">' + x + '</div>'; }).join('') +
          '<div class="bsiFX-nota">' + t('Metodo di Hückel: diagonalizzazione esatta (Jacobi) della matrice secolare, autovettori normalizzati.', 'Hückel method: exact (Jacobi) diagonalisation of the secular matrix, normalised eigenvectors.') + '</div>';
      }
    });
  }

  /* ═══ 3 · SALC ══════════════════════════════════════════════════════════ */
  function schedaSALC(div) {
    return schedaBase(div, { ariaScelte: t('Molecole', 'Molecules'),
      stato: { mol: 'XeOF4', cut: 20 },
      titolo: function () { var m = Q().MOLECOLE[this.stato ? this.stato.mol : 'XeOF4']; return m.formula; },
      sotto: function () { var m = Q().MOLECOLE[this.stato ? this.stato.mol : 'XeOF4']; return F.tt(m.vsepr) + ' · ' + m.ibr; },
      controlli: function (scelte, sliders, api, ric) {
        api.stato = api.stato || { mol: 'XeOF4', cut: 20 };
        Object.keys(Q().MOLECOLE).forEach(function (k) { chip(scelte, Q().MOLECOLE[k].formula, k === api.stato.mol, function () { api.stato.mol = k; api.stato.cut = Q().MOLECOLE[k].cutS; rng.value = String(api.stato.cut); val.textContent = api.stato.cut + ' eV'; ric(); }); });
        var rng = F.el('input', { type: 'range', min: '8', max: '40', step: '1', value: String(api.stato.cut), 'aria-label': t('Soglia energetica ΔE', 'Energy threshold ΔE') }), val = F.el('b', { testo: api.stato.cut + ' eV' });
        rng.addEventListener('input', function () { api.stato.cut = +rng.value; val.textContent = rng.value + ' eV'; ric(); });
        sliders.appendChild(F.el('label', {}, [F.el('span', {}, [F.el('span', { testo: t('Soglia ΔE (σ e π)', 'Threshold ΔE (σ and π)') }), val]), rng]));
      },
      render: function (T, G, K, testi, st) {
        var m = Q().MOLECOLE[st.mol]; K.sfera(0.7, '#8b5cf6', [0, 0, 0], { ei: 0.2 }); var et = testi.sprite(m.centrale, '#fff', 0.5); et.position.set(0, 0, 0.95); G.add(et);
        var dirs = geometriaSALC(m), i = 0;
        m.leganti.forEach(function (lig) { for (var k = 0; k < lig.n; k++) { var dconf = dirs[i++] || [0, 0, 2.6]; var p = [dconf[0], dconf[1], dconf[2]]; K.bastone([0, 0, 0], p, 0.06, '#334155'); K.sfera(0.46, lig.el === 'O' ? '#ef4444' : lig.el === 'F' ? '#22c55e' : '#a3e635', p, { ei: 0.2 }); } });
        if (m.solitari > 0) { var cone = new T.Mesh(new T.ConeGeometry(0.7, 2.0, 24), K.mat('#facc15', { op: 0.4, ei: 0.2 })); cone.position.set(0, -1.3, 0); cone.rotation.x = PI; G.add(cone); }
        return { vista: 4.4, th: 0.7, ph: 1.05 };
      },
      report: function (st) {
        var r = Q().salc(st.mol, st.cut, st.cut);
        var righe = r.interazioni.map(function (x) { return '<tr><td>' + x.coppia + '</td><td>' + fmt(x.dE, 1) + '</td><td class="' + (x.sigma ? 'on' : 'off') + '">' + (x.sigma ? 'σ ✓' : '—') + '</td><td class="' + (x.pi ? 'on' : 'off') + '">' + (x.pi ? 'π ✓' : '—') + '</td></tr>'; }).join('');
        return '<h4>' + r.formula + ' — ' + F.tt(r.vsepr) + '</h4><div class="bsiIQ-grid"><div>' + t('n. sterico', 'steric no.') + '<b>' + r.sterico + '</b></div><div>' + t('ibridazione', 'hybridisation') + '<b>' + r.ibr + '</b></div><div>' + t('doppietti sol.', 'lone pairs') + '<b>' + r.solitari + '</b></div><div>OA totali<b>' + r.oaTot + '</b></div><div>' + t('interazioni σ', 'σ interactions') + '<b>' + r.attiveSigma + '</b></div><div>' + t('interazioni π', 'π interactions') + '<b>' + r.attivePi + '</b></div></div>' +
          '<div class="bsiIQ-eq">soglia ΔE ≤ ' + r.cutS + ' eV → OL ≈ ' + r.OL + ', AL ≈ ' + r.AL + ', non-legame ≈ ' + r.NL + '</div>' +
          '<table class="bsiIQ-tab"><tr><th>' + t('coppia di orbitali', 'orbital pair') + '</th><th>ΔE (eV)</th><th>σ</th><th>π</th></tr>' + righe + '</table>' +
          '<div class="bsiFX-nota">' + t('Energie orbitali di valenza da letteratura (ordini di grandezza). Il conteggio OL/AL/non-legame è un MODELLO didattico: conta le interazioni sotto soglia; i numeri esatti di un testo possono differire.', 'Valence orbital energies from the literature (orders of magnitude). The bonding/antibonding/non-bonding count is a teaching MODEL: it counts interactions below the threshold; a textbook\'s exact figures may differ.') + '</div>';
      }
    });
  }
  function geometriaSALC(m) {
    if (m.formula === 'XeOF₄') return [[0, 2.8, 0], [2.6, 0, 0], [-2.6, 0, 0], [0, 0, 2.6], [0, 0, -2.6]];
    if (m.formula === 'IOF₅') return [[0, 2.8, 0], [0, -2.8, 0], [2.6, 0, 0], [-2.6, 0, 0], [0, 0, 2.6], [0, 0, -2.6]];
    if (m.formula === 'XeF₄') return [[2.6, 0, 0], [-2.6, 0, 0], [0, 0, 2.6], [0, 0, -2.6]];
    if (m.formula === 'SF₄') return [[0, 2.7, 0], [0, -2.7, 0], [2.3, 0.6, 0], [-2.3, 0.6, 0]];
    if (m.formula === 'BrF₃') return [[0, 2.7, 0], [0, -2.7, 0], [2.6, 0, 0]];
    if (m.formula === 'SO₂') return [[2.3, 1.4, 0], [-2.3, 1.4, 0]];
    if (m.formula === 'SO₃') return [[2.6, 0, 0], [-1.3, 0, 2.25], [-1.3, 0, -2.25]];
    if (m.formula === 'I₃⁻') return [[0, 2.8, 0], [0, -2.8, 0]];
    return [[2.6, 0, 0], [-2.6, 0, 0], [0, 0, 2.6], [0, 0, -2.6]];
  }

  /* ═══ 4 · COMPLESSI ═════════════════════════════════════════════════════ */
  function schedaComplessi(div) {
    return schedaBase(div, { ariaScelte: t('Complessi', 'Complexes'),
      stato: { key: 'IrCl6-2' },
      titolo: function () { var c = Q().complesso(this.stato ? this.stato.key : 'IrCl6-2'); return c.formula + ' (' + c.metallo + ', ' + c.dn + ')'; },
      sotto: function () { var c = Q().complesso(this.stato ? this.stato.key : 'IrCl6-2'); return c.geom + ' · ' + c.pi; },
      controlli: function (scelte, sliders, api, ric) {
        api.stato = api.stato || { key: 'IrCl6-2' };
        Object.keys(Q().COMPLESSI).forEach(function (k) { chip(scelte, Q().complesso(k).formula, k === api.stato.key, function () { api.stato.key = k; ric(); }); });
      },
      render: function (T, G, K, testi, st) {
        var c = Q().complesso(st.key); K.sfera(0.72, '#f59e0b', [0, 0, 0], { me: 0.5, ei: 0.25 }); var et = testi.sprite(c.metallo, '#fff', 0.5); et.position.set(0, 0, 1.0); G.add(et);
        var dirs = geometriaComplesso(c.geom);
        dirs.forEach(function (d) { var n = Math.hypot(d[0], d[1], d[2]) || 1, p = [d[0] / n * 2.8, d[1] / n * 2.8, d[2] / n * 2.8]; K.bastone([0, 0, 0], p, 0.07, '#334155'); K.sfera(0.46, '#38bdf8', p, { ei: 0.2 }); });
        return { vista: 4.4, th: 0.9, ph: 1.1 };
      },
      report: function (st) {
        var c = Q().complesso(st.key);
        return '<h4>' + c.formula + ' — ' + c.metallo + ' (' + c.dn + '), ' + c.geom + '</h4><div class="bsiIQ-grid"><div>' + t('spaiati', 'unpaired') + '<b>' + c.spaiati + '</b></div><div>μ (BM)<b>' + fmt(c.mu_BM, 2) + '</b></div><div>CFSE<b>' + (c.cfse_Delta == null ? '—' : fmt(c.cfse_Delta, 1) + 'Δ') + '</b></div><div>EAN<b>' + c.EAN + '</b></div><div>' + t('config.', 'config.') + '<b style="font-size:.8rem">' + c.occ + '</b></div><div>Jahn–Teller<b style="font-size:.78rem">' + c.jahnTeller + '</b></div></div>' +
          '<div class="bsiIQ-box bsiIQ-vbt"><b>VBT</b> · ' + t('ibridazione', 'hybridisation') + ' ' + c.ibr + '; EAN = ' + c.EAN + ' e⁻</div>' +
          '<div class="bsiIQ-box bsiIQ-cft"><b>CFT</b> · ' + (c.bassoSpin ? t('basso spin', 'low spin') : t('alto spin', 'high spin')) + ', ' + c.occ + ', ' + c.spaiati + ' e⁻ spaiati, μ = ' + fmt(c.mu_BM, 2) + ' BM, CFSE = ' + (c.cfse_Delta == null ? '—' : fmt(c.cfse_Delta, 1) + 'Δ') + '; Jahn–Teller ' + c.jahnTeller + '</div>' +
          '<div class="bsiIQ-box bsiIQ-lft"><b>LFT/MO</b> · ' + c.pi + '; ≈ ' + c.omTot + ' orbitali molecolari. ' + (c.note || []).join('. ') + '</div>' +
          '<div class="bsiFX-nota">' + t('μ è il momento di spin (√(n(n+2))). Splitting e spin dalle regole del campo dei leganti; valori INDICATIVI per il carattere π.', 'μ is the spin-only moment (√(n(n+2))). Splitting and spin from ligand-field rules; π character is INDICATIVE.') + '</div>';
      }
    });
  }
  function geometriaComplesso(geom) {
    if (/Oh/.test(geom)) return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    if (/D4h/.test(geom)) return [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
    if (/Dinfh/.test(geom)) return [[0, 1, 0], [0, -1, 0]];
    return [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];   /* Td */
  }

  /* ═══ la sezione ════════════════════════════════════════════════════════ */
  F.sezione('sinorganica', {
    titolo: ['⚗️ Inorganica quantistica', '⚗️ Quantum inorganic chemistry'],
    sotto: ['Il risolutore di chimica inorganica avanzata, con il modello 3D e il calcolo insieme: le regole di Slater e le funzioni d\'onda atomiche, il metodo variazionale di Hückel con il determinante secolare, le SALC con soglia energetica per le molecole ipervalenti e interalogeni, e i complessi di coordinazione nella tripla teoria VBT + CFT + LFT.', 'The advanced inorganic chemistry solver, with the 3D model and the computation together: Slater\'s rules and atomic wavefunctions, the Hückel variational method with the secular determinant, SALC with an energy threshold for hypervalent and interhalogen molecules, and coordination complexes in the triple theory VBT + CFT + LFT.'],
    schede: [
      { nome: ['⚛️ Slater', '⚛️ Slater'], costruisci: schedaSlater },
      { nome: ['🔷 Hückel', '🔷 Hückel'], costruisci: schedaHuckel },
      { nome: ['🧩 SALC', '🧩 SALC'], costruisci: schedaSALC },
      { nome: ['🧲 Complessi', '🧲 Complexes'], costruisci: schedaComplessi }
    ]
  });

  /* ═══ lo strumento per Spectra ══════════════════════════════════════════ */
  var SCHEDE = ['slater', 'huckel', 'salc', 'complessi'];
  function vai(scheda) { if (typeof g.goSection === 'function') g.goSection('sinorganica'); var k = SCHEDE.indexOf(scheda); if (k < 0) k = 0; setTimeout(function () { var bar = D.querySelector('#sinorganica .bsiFX-schede'); if (bar && bar.children[k]) bar.children[k].click(); }, 400); }
  var STRUMENTO = { name: 'inorganica_quantica',
    description: 'Apre il risolutore di «Inorganica quantistica» e calcola: slater (regole di Slater, σ, ζ, raggi, per un elemento), huckel (metodo variazionale su un sistema π: allile, ciclopropenile, butadiene, ciclobutadiene, benzene, LiH), salc (SALC con soglia ΔE per una molecola ipervalente: XeOF4, IOF5, XeF4, SF4, BrF3, SO2, SO3, I3), complessi (VBT+CFT+LFT per un complesso: FeCl4-, MnF6-4, IrCl6-2, Ni(NH3)6-2, Ni(CN)4-2, Pd(CN)4-2, Ni(CO)4, Ag(CN)2-). Usalo quando l\'utente chiede uno di questi calcoli o molecole.',
    parameters: { type: 'object', properties: { scheda: { type: 'string', enum: SCHEDE }, elemento: { type: 'string' }, sistema: { type: 'string' }, molecola: { type: 'string' }, complesso: { type: 'string' }, soglia: { type: 'number' } }, required: ['scheda'] },
    execute: function (a) {
      a = a || {}; if (SCHEDE.indexOf(a.scheda) < 0) return Promise.resolve({ ok: false, error: 'scheda sconosciuta' });
      vai(a.scheda); var I = Q(), r = { ok: true, scheda: a.scheda };
      try {
        if (a.scheda === 'slater' && a.elemento && I.EO[a.elemento]) { var e = I.elemento(a.elemento); r.risultato = { sigma: e.sigma, zeta: e.zeta, nStar: e.nStar, rmp_pm: e.rmp_pm, rmedio_a0: e.rmedio_a0 }; }
        if (a.scheda === 'huckel' && a.sistema && I.HUCKEL[a.sistema]) { var h = I.huckel(I.HUCKEL[a.sistema]); r.risultato = { Epi: h.Epi_coeffBeta, deloc: h.deloc_coeffBeta, livelli: h.orbitali.map(function (o) { return o.x; }) }; }
        if (a.scheda === 'salc' && a.molecola && I.MOLECOLE[a.molecola]) { var s = I.salc(a.molecola, a.soglia, a.soglia); r.risultato = { attiveSigma: s.attiveSigma, attivePi: s.attivePi, OL: s.OL, AL: s.AL, NL: s.NL }; }
        if (a.scheda === 'complessi' && a.complesso && I.COMPLESSI[a.complesso]) { var c = I.complesso(a.complesso); r.risultato = { spaiati: c.spaiati, mu: c.mu_BM, cfse: c.cfse_Delta, EAN: c.EAN, jahnTeller: c.jahnTeller }; }
      } catch (e) { }
      return Promise.resolve(r);
    } };
  function registra() { var Ts = g.BSI_AI_TOOLS; if (!Ts || !Ts.push) return false; if (!Ts.some(function (x) { return x.name === STRUMENTO.name; })) Ts.push(STRUMENTO); return true; }
  if (!registra()) { var kk = 0, ti = setInterval(function () { if (registra() || ++kk > 40) clearInterval(ti); }, 500); }

  g.BSIInorganica = { schedaSlater: schedaSlater, schedaHuckel: schedaHuckel, schedaSALC: schedaSALC, schedaComplessi: schedaComplessi, SCHEDE: SCHEDE, vai: vai,
    apri: function (scheda) { vai(scheda || 'slater'); } };
})(typeof window !== 'undefined' ? window : globalThis);
