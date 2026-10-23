/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-vettoriale.js — ∇ calcolo vettoriale
   BioSpecInfo · © Samuele Pio Provenzano

   · CAMPI NEL PIANO: F = (P, Q) disegnato con le frecce e con particelle
     che il campo trascina; sotto, a colori, la divergenza (sorgenti e
     pozzi) o il rotore (vortici), calcolati in forma simbolica; se il
     rotore e' identicamente nullo il campo e' conservativo e si trova il
     potenziale;
   · LAVORO E FLUSSO: la circuitazione ∮F·dr e il flusso ∮F·n ds lungo una
     curva chiusa, calcolati sulla curva e confrontati con gli integrali
     doppi del rotore e della divergenza sulla regione interna: il teorema
     di Green nelle sue due forme, verificato numero contro numero;
   · GRADIENTE: le curve di livello di f(x, y) e il gradiente, sempre
     perpendicolare a esse e diretto dove f cresce; il laplaciano.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function campo(pan, et, val, cambia) { var i = F.el('input', { type: 'text', value: val, 'aria-label': F.tt(et), spellcheck: 'false', autocomplete: 'off' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: F.tt(et) })]), i])); i.addEventListener('change', function () { cambia(i.value); }); return i; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function analizzaCampo(Ptesto, Qtesto) {
    var P = C.leggi(Ptesto), Q = C.leggi(Qtesto), extra = C.simboli(P).concat(C.simboli(Q)).filter(function (v) { return v !== 'x' && v !== 'y'; });
    if (extra.length) throw new Error(t('usa solo x e y (trovato: ', 'use only x and y (found: ') + extra.join(', ') + ')');
    var div = C.semplifica(C.costruisci.add(C.deriva(P, 'x'), C.deriva(Q, 'y'))), rot = C.semplifica(C.costruisci.sub(C.deriva(Q, 'x'), C.deriva(P, 'y')));
    /* il semplificatore non sempre riduce a 0 un'espressione nulla (es. il vortice −y/r², x/r²):
       si controlla anche in punti di prova, e se e' nulla ovunque la si scrive 0 */
    var nulla = function (e) { var f = C.compila(e), n = 0; for (var i = 0; i < 40; i++) { var v = f({ x: Math.cos(i * 2.39996) * (0.3 + i * 0.07), y: Math.sin(i * 2.39996) * (0.3 + i * 0.07) }); if (!isFinite(v)) continue; if (Math.abs(v) > 1e-9) return false; n++; } return n > 10; };
    if (C.stampa(rot) !== '0' && nulla(rot)) rot = C.Q(0);
    if (C.stampa(div) !== '0' && nulla(div)) div = C.Q(0);
    var out = { P: P, Q: Q, div: div, rot: rot, fP: C.compila(P), fQ: C.compila(Q), fdiv: C.compila(div), frot: C.compila(rot), conservativo: C.stampa(rot) === '0' };
    if (out.conservativo) {
      /* potenziale: φ = ∫P dx + g(y), con g'(y) = Q − ∂/∂y ∫P dx */
      try { var I = C.integra(P, 'x'); if (I) { var resto = C.semplifica(C.costruisci.sub(Q, C.deriva(I, 'y'))); var gy = C.dipende(resto, 'x') ? null : C.integra(resto, 'y'); if (gy) out.potenziale = C.semplifica(C.costruisci.add(I, gy)); } } catch (e) { }
    }
    return out;
  }
  /* curve chiuse percorse in senso antiorario: r(s), r'(s) per s ∈ [0, 2π] e il test «dentro» */
  function curva(tipo, a, b, cx, cy) {
    if (tipo === 'ellisse') return { r: function (s) { return [cx + a * Math.cos(s), cy + b * Math.sin(s)]; }, d: function (s) { return [-a * Math.sin(s), b * Math.cos(s)]; }, dentro: function (x, y) { return Math.pow((x - cx) / a, 2) + Math.pow((y - cy) / b, 2) <= 1; }, box: [cx - a, cx + a, cy - b, cy + b], area: Math.PI * a * b };
    /* quadrato di lato 2a centrato: quattro lati di uguale parametro */
    return { r: function (s) { var u = s / (2 * Math.PI) * 4, k = Math.floor(u) % 4, f = u - Math.floor(u); return k === 0 ? [cx - a + 2 * a * f, cy - a] : k === 1 ? [cx + a, cy - a + 2 * a * f] : k === 2 ? [cx + a - 2 * a * f, cy + a] : [cx - a, cy + a - 2 * a * f]; }, d: function (s) { var k = Math.floor(s / (2 * Math.PI) * 4) % 4, v = 2 * a * 4 / (2 * Math.PI); return k === 0 ? [v, 0] : k === 1 ? [0, v] : k === 2 ? [-v, 0] : [0, -v]; }, dentro: function (x, y) { return Math.abs(x - cx) <= a && Math.abs(y - cy) <= a; }, box: [cx - a, cx + a, cy - a, cy + a], area: 4 * a * a };
  }
  function lungoCurva(A, K, n) {
    /* circuitazione ∮(P dx + Q dy) e flusso uscente ∮(P dy − Q dx), regola del punto medio */
    n = n || 4000; var circ = 0, flusso = 0, h = 2 * Math.PI / n;
    for (var i = 0; i < n; i++) { var s = (i + 0.5) * h, p = K.r(s), d = K.d(s), P = A.fP({ x: p[0], y: p[1] }), Q = A.fQ({ x: p[0], y: p[1] }); circ += (P * d[0] + Q * d[1]) * h; flusso += (P * d[1] - Q * d[0]) * h; }
    return { circ: circ, flusso: flusso };
  }
  function suRegione(f, K, n) {
    /* integrale doppio sulla regione interna: griglia sul rettangolo che la contiene, punti medi, bordo con 4×4 sotto-campioni */
    n = n || 400; var B = K.box, hx = (B[1] - B[0]) / n, hy = (B[3] - B[2]) / n, s = 0;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var x = B[0] + (i + 0.5) * hx, y = B[2] + (j + 0.5) * hy;
      if (K.dentro(x, y)) s += f({ x: x, y: y }) * hx * hy;
    }
    return s;
  }
  F.calcolo.vettoriale = { analizzaCampo: analizzaCampo, curva: curva, lungoCurva: lungoCurva, suRegione: suRegione };

  var CAMPI = [['-y', 'x', ['rotazione rigida (rotore 2)', 'rigid rotation (curl 2)']], ['x', 'y', ['sorgente (divergenza 2)', 'source (divergence 2)']], ['y', 'x', ['iperbolico, conservativo φ = xy', 'hyperbolic, conservative φ = xy']], ['-y/(x^2+y^2)', 'x/(x^2+y^2)', ['vortice puntiforme (rotore 0 ma non conservativo)', 'point vortex (zero curl but not conservative)']], ['x - y', 'x + y', ['spirale uscente', 'outward spiral']], ['sin(y)', 'sin(x)', ['celle di convezione', 'convection cells']], ['y', '-sin(x)', ['pendolo (spazio delle fasi)', 'pendulum (phase space)']]];
  /* colore opaco mescolato con lo sfondo: celle adiacenti non si sovrappongono e non lasciano righe */
  function colori(v, vmax) { var u = Math.max(-1, Math.min(1, v / (vmax || 1))), a = 0.4 * Math.abs(u), c = u >= 0 ? [255, 138, 128] : [107, 207, 255], b = [8, 21, 34]; return 'rgb(' + c.map(function (x, i) { return Math.round(b[i] + (x - b[i]) * a); }).join(',') + ')'; }

  /* ═══ 1. campi ══════════════════════════════════════════════════════════ */
  function schedaCampi(div) {
    var G = griglia(div), st = { P: '-y', Q: 'x', fondo: 'rot', L: 3 }, info = F.el('div', { 'class': 'bsiFX-nota' }), A, parti = [], iP, iQ;
    F.scelta(G.pan, ['Esempi', 'Examples'], CAMPI.map(function (c, i) { return [String(i), F.tt(c[2])]; }), '0', function (v) { var c = CAMPI[+v]; st.P = c[0]; st.Q = c[1]; iP.value = c[0]; iQ.value = c[1]; analizza(); });
    iP = campo(G.pan, ['P(x, y)', 'P(x, y)'], st.P, function (v) { st.P = v; analizza(); });
    iQ = campo(G.pan, ['Q(x, y)', 'Q(x, y)'], st.Q, function (v) { st.Q = v; analizza(); });
    F.scelta(G.pan, ['Sfondo', 'Background'], [['rot', t('rotore ∂Q/∂x − ∂P/∂y', 'curl ∂Q/∂x − ∂P/∂y')], ['div', t('divergenza ∂P/∂x + ∂Q/∂y', 'divergence ∂P/∂x + ∂Q/∂y')], ['no', t('nessuno', 'none')]], st.fondo, function (v) { st.fondo = v; });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.8), sfondo = null;
    function nuovePart() { parti = []; for (var i = 0; i < 260; i++) parti.push([(Math.random() * 2 - 1) * st.L, (Math.random() * 2 - 1) * st.L * 0.8, Math.random() * 3]); }
    function analizza() {
      try {
        A = analizzaCampo(st.P, st.Q); sfondo = null; nuovePart();
        info.innerHTML = 'div F = <b>' + C.html(A.div) + '</b> · rot F = <b>' + C.html(A.rot) + '</b><br>' + (A.conservativo ? t('Rotore identicamente nullo: ', 'Curl identically zero: ') + (A.potenziale ? t('il campo è il gradiente di ', 'the field is the gradient of ') + 'φ = <b>' + C.html(A.potenziale) + '</b>' : t('localmente conservativo; ', 'locally conservative; ')) + (/x\^2\+y\^2|x²/.test(st.P + st.Q) ? t(' — attenzione: se il campo non è definito in un punto (qui l’origine) il rotore nullo non basta, la circuitazione attorno al buco può essere diversa da 0 (prova nella scheda «Lavoro e flusso»).', ' — beware: if the field is undefined at a point (here the origin) zero curl is not enough, the circulation around the hole can differ from 0 (try it in the «Work and flux» tab).') : '') : t('Rotore non nullo: il campo NON è conservativo, il lavoro dipende dal percorso.', 'Non-zero curl: the field is NOT conservative, work depends on the path.')) + '<br>' + t('Rosso: valori positivi, azzurro: negativi. Le particelle seguono il campo (linee di flusso).', 'Red: positive values, blue: negative. Particles follow the field (streamlines).');
      } catch (e) { info.textContent = '⚠ ' + e.message; A = null; }
    }
    analizza();
    F.anima(cv, function (dt) {
      if (!A) return;
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, L = st.L, Ly = L * H / W, X = function (x) { return W / 2 + x / L * W / 2; }, Y = function (y) { return H / 2 - y / Ly * H / 2; };
      /* lo sfondo si calcola una volta e si ricopia */
      if (st.fondo !== 'no') {
        if (!sfondo || sfondo.k !== st.fondo + W + 'x' + H) {
          var f = st.fondo === 'rot' ? A.frot : A.fdiv, vals = [], n = 48, m = 0;
          for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) { var v = f({ x: -L + 2 * L * (i + 0.5) / n, y: -Ly + 2 * Ly * (j + 0.5) / n }); vals.push(v); if (isFinite(v)) m = Math.max(m, Math.abs(v)); }
          sfondo = { k: st.fondo + W + 'x' + H, vals: vals, n: n, m: m };
        }
        for (i = 0; i < sfondo.n; i++) for (j = 0; j < sfondo.n; j++) { var vv = sfondo.vals[i * sfondo.n + j]; if (!isFinite(vv)) continue; q.fillStyle = colori(vv, sfondo.m); var x0 = Math.floor(i * W / sfondo.n), x1 = Math.floor((i + 1) * W / sfondo.n), y1 = Math.ceil(H - j * H / sfondo.n), y0 = Math.ceil(H - (j + 1) * H / sfondo.n); q.fillRect(x0, y0, x1 - x0, y1 - y0); }
      }
      q.strokeStyle = 'rgba(52,70,95,.8)'; q.beginPath(); q.moveTo(0, Y(0)); q.lineTo(W, Y(0)); q.moveTo(X(0), 0); q.lineTo(X(0), H); q.stroke();
      /* frecce normalizzate */
      q.strokeStyle = 'rgba(230,255,251,.55)'; q.lineWidth = 1.2;
      for (var a = 0; a < 17; a++) for (var b = 0; b < 13; b++) {
        var x = -L + 2 * L * (a + 0.5) / 17, y = -Ly + 2 * Ly * (b + 0.5) / 13, Pv = A.fP({ x: x, y: y }), Qv = A.fQ({ x: x, y: y }), mod = Math.hypot(Pv, Qv); if (!(mod > 0) || !isFinite(mod)) continue;
        var lx = Pv / mod * W / 40, ly = -Qv / mod * W / 40, x0 = X(x), y0 = Y(y);
        var tx = x0 + lx / 2, ty = y0 + ly / 2; q.beginPath(); q.moveTo(x0 - lx / 2, y0 - ly / 2); q.lineTo(tx, ty); q.moveTo(tx - 0.4 * lx + 0.25 * ly, ty - 0.4 * ly - 0.25 * lx); q.lineTo(tx, ty); q.lineTo(tx - 0.4 * lx - 0.25 * ly, ty - 0.4 * ly + 0.25 * lx); q.stroke();
      }
      q.lineWidth = 1;
      /* particelle trascinate (punto medio), rinascono dopo qualche secondo o fuori dal riquadro */
      q.fillStyle = '#ffd24a';
      parti.forEach(function (p) {
        var k1x = A.fP({ x: p[0], y: p[1] }), k1y = A.fQ({ x: p[0], y: p[1] }), mx = p[0] + k1x * dt * 0.25, my = p[1] + k1y * dt * 0.25, k2x = A.fP({ x: mx, y: my }), k2y = A.fQ({ x: mx, y: my });
        var vx = k2x, vy = k2y, sp = Math.hypot(vx, vy), lim = 2.5; if (sp > lim) { vx *= lim / sp; vy *= lim / sp; }
        p[0] += vx * dt * 0.5; p[1] += vy * dt * 0.5; p[2] -= dt;
        if (!isFinite(p[0]) || Math.abs(p[0]) > L || Math.abs(p[1]) > Ly || p[2] < 0) { p[0] = (Math.random() * 2 - 1) * L; p[1] = (Math.random() * 2 - 1) * Ly; p[2] = 2 + Math.random() * 3; }
        q.beginPath(); q.arc(X(p[0]), Y(p[1]), 1.8, 0, Math.PI * 2); q.fill();
      });
      cv.setAttribute('aria-label', t('campo vettoriale con particelle', 'vector field with particles'));
    }, { ricomincia: function () { nuovePart(); } });
  }

  /* ═══ 2. lavoro e flusso (Green) ════════════════════════════════════════ */
  function schedaGreen(div) {
    var G = griglia(div), st = { P: '-y^3', Q: 'x^3', tipo: 'ellisse', a: 1.5, b: 1, cx: 0, cy: 0 }, info = F.el('div', { 'class': 'bsiFX-nota' }), A, K, R, s0 = 0, iP, iQ;
    F.scelta(G.pan, ['Campo', 'Field'], [['-y^3|x^3', 'F = (−y³, x³)'], ['-y|x', 'F = (−y, x)'], ['x|y', 'F = (x, y)'], ['-y/(x^2+y^2)|x/(x^2+y^2)', t('vortice (−y, x)/r²', 'vortex (−y, x)/r²')], ['y|x', 'F = (y, x) = ∇(xy)']], '-y^3|x^3', function (v) { var p = v.split('|'); st.P = p[0]; st.Q = p[1]; iP.value = p[0]; iQ.value = p[1]; calcola(); });
    iP = campo(G.pan, ['P(x, y)', 'P(x, y)'], st.P, function (v) { st.P = v; calcola(); });
    iQ = campo(G.pan, ['Q(x, y)', 'Q(x, y)'], st.Q, function (v) { st.Q = v; calcola(); });
    F.scelta(G.pan, ['Curva', 'Curve'], [['ellisse', t('ellisse', 'ellipse')], ['quadrato', t('quadrato', 'square')]], st.tipo, function (v) { st.tipo = v; calcola(); });
    F.cursore(G.pan, ['semiasse / mezzo lato a', 'semi-axis / half side a'], 0.3, 2.5, 0.1, st.a, function (v) { st.a = v; calcola(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['semiasse b (ellisse)', 'semi-axis b (ellipse)'], 0.3, 2.5, 0.1, st.b, function (v) { st.b = v; calcola(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['centro x', 'centre x'], -2, 2, 0.1, st.cx, function (v) { st.cx = v; calcola(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.75);
    function calcola() {
      try {
        A = analizzaCampo(st.P, st.Q); K = curva(st.tipo, st.a, st.b, st.cx, st.cy); var Lc = lungoCurva(A, K), rotI = suRegione(A.frot, K), divI = suRegione(A.fdiv, K);
        var buco = /x\^2\+y\^2/.test(st.P + st.Q) && K.dentro(0, 0);
        R = { circ: Lc.circ, rotI: rotI, flusso: Lc.flusso, divI: divI };
        info.innerHTML = t('Circuitazione ', 'Circulation ') + '∮F·dr = <b class="bsiFX-num">' + fmt(Lc.circ) + '</b> · ∬ rot F dA = <b class="bsiFX-num">' + fmt(rotI) + '</b><br>' + t('Flusso uscente ', 'Outward flux ') + '∮F·n ds = <b class="bsiFX-num">' + fmt(Lc.flusso) + '</b> · ∬ div F dA = <b class="bsiFX-num">' + fmt(divI) + '</b><br>' + (buco ? '⚠ ' + t('Il campo non è definito nell’origine, che sta dentro la curva: Green NON si applica. Il rotore è 0 ovunque altrove ma la circuitazione vale 2π = 6,2832: il «buco» conta.', 'The field is undefined at the origin, which lies inside the curve: Green does NOT apply. The curl is 0 everywhere else but the circulation is 2π = 6.2832: the «hole» matters.') : t('Teorema di Green: i due membri coincidono (a meno dell’errore della griglia del doppio integrale). Con il campo (−y, x) la circuitazione è il doppio dell’area: ', 'Green’s theorem: both sides agree (up to the grid error of the double integral). With the field (−y, x) the circulation is twice the area: ') + '2·' + fmt(K.area) + ' = ' + fmt(2 * K.area));
        s0 = 0;
      } catch (e) { info.textContent = '⚠ ' + e.message; A = null; }
    }
    calcola();
    F.anima(cv, function (dt) {
      if (!A) return;
      s0 = Math.min(2 * Math.PI, s0 + dt * 0.8);
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, L = 3, Ly = L * H / W, X = function (x) { return W / 2 + x / L * W / 2; }, Y = function (y) { return H / 2 - y / Ly * H / 2; };
      q.fillStyle = 'rgba(94,234,212,.08)'; q.beginPath(); for (var i = 0; i <= 200; i++) { var p = K.r(2 * Math.PI * i / 200); if (i) q.lineTo(X(p[0]), Y(p[1])); else q.moveTo(X(p[0]), Y(p[1])); } q.closePath(); q.fill(); q.strokeStyle = '#5eead4'; q.lineWidth = 2; q.stroke(); q.lineWidth = 1;
      q.strokeStyle = 'rgba(52,70,95,.8)'; q.beginPath(); q.moveTo(0, Y(0)); q.lineTo(W, Y(0)); q.moveTo(X(0), 0); q.lineTo(X(0), H); q.stroke();
      q.strokeStyle = 'rgba(230,255,251,.4)';
      for (var a = 0; a < 15; a++) for (var b = 0; b < 11; b++) { var x = -L + 2 * L * (a + 0.5) / 15, y = -Ly + 2 * Ly * (b + 0.5) / 11, Pv = A.fP({ x: x, y: y }), Qv = A.fQ({ x: x, y: y }), m = Math.hypot(Pv, Qv); if (!(m > 0) || !isFinite(m)) continue; var lx = Pv / m * W / 44, ly = -Qv / m * W / 44; q.beginPath(); q.moveTo(X(x) - lx / 2, Y(y) - ly / 2); q.lineTo(X(x) + lx / 2, Y(y) + ly / 2); q.stroke(); }
      /* il punto che percorre la curva e il lavoro accumulato fin qui */
      var n = 400, lav = 0, h = s0 / n; for (i = 0; i < n; i++) { var s = (i + 0.5) * h, pp = K.r(s), d = K.d(s); lav += (A.fP({ x: pp[0], y: pp[1] }) * d[0] + A.fQ({ x: pp[0], y: pp[1] }) * d[1]) * h; }
      var pc = K.r(s0); q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(X(pc[0]), Y(pc[1]), 6, 0, Math.PI * 2); q.fill();
      q.fillStyle = '#e6fffb'; q.font = '13px system-ui'; q.fillText(t('lavoro accumulato ∫F·dr = ', 'accumulated work ∫F·dr = ') + fmt(lav), 10, 18);
      cv.setAttribute('aria-label', t('curva chiusa nel campo con il lavoro accumulato', 'closed curve in the field with accumulated work'));
      if (s0 >= 2 * Math.PI) return false;
    }, { ricomincia: function () { s0 = 0; } });
  }

  /* ═══ 3. gradiente ══════════════════════════════════════════════════════ */
  function schedaGradiente(div) {
    var G = griglia(div), st = { f: 'x^2 + 3*y^2' }, info = F.el('div', { 'class': 'bsiFX-nota' }), inp;
    F.scelta(G.pan, ['Esempi', 'Examples'], [['x^2 + 3*y^2', 'x² + 3y²'], ['x*y', 'xy'], ['sin(x)*cos(y)', 'sin x cos y'], ['x*e^(-x^2-y^2)', 'x e^(−x²−y²)'], ['ln(x^2+y^2)', 'ln(x² + y²)']], st.f, function (v) { st.f = v; inp.value = v; disegna(); });
    inp = campo(G.pan, ['f(x, y)', 'f(x, y)'], st.f, function (v) { st.f = v; disegna(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.8);
    function disegna() {
      try {
        var e = C.leggi(st.f), fx = C.deriva(e, 'x'), fy = C.deriva(e, 'y'), lap = C.semplifica(C.costruisci.add(C.deriva(fx, 'x'), C.deriva(fy, 'y'))), f = C.compila(e), gx = C.compila(fx), gy = C.compila(fy);
        var L = 3, P = F.pennello(cv), q = P.q, W = P.W, H = P.H, Ly = L * H / W, X = function (x) { return W / 2 + x / L * W / 2; }, Y = function (y) { return H / 2 - y / Ly * H / 2; }, N = 120, Z = [], tutti = [];
        for (var i = 0; i <= N; i++) { Z.push([]); for (var j = 0; j <= N; j++) { var v = f({ x: -L + 2 * L * i / N, y: -Ly + 2 * Ly * j / N }); Z[i].push(v); if (isFinite(v)) tutti.push(v); } }
        tutti.sort(function (a, b) { return a - b; }); var lo = tutti[Math.floor(tutti.length * 0.02)], hi = tutti[Math.floor(tutti.length * 0.98)];
        /* curve di livello per quadrati in marcia */
        for (var k = 1; k < 14; k++) {
          var lv = lo + (hi - lo) * k / 14, u = k / 14; q.strokeStyle = 'rgb(' + Math.round(80 + 175 * u) + ',' + Math.round(180 - 60 * u) + ',' + Math.round(255 - 180 * u) + ')'; q.lineWidth = 1.4; q.beginPath();
          for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
            var vs = [Z[i][j], Z[i + 1][j], Z[i + 1][j + 1], Z[i][j + 1]]; if (!vs.every(isFinite)) continue; var cs = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], tg = [];
            for (var s = 0; s < 4; s++) { var a = vs[s], b = vs[(s + 1) % 4]; if ((a - lv) * (b - lv) < 0) { var w = (lv - a) / (b - a), A = cs[s], B = cs[(s + 1) % 4]; tg.push([A[0] + (B[0] - A[0]) * w, A[1] + (B[1] - A[1]) * w]); } }
            if (tg.length >= 2) { q.moveTo(X(-L + 2 * L * tg[0][0] / N), Y(-Ly + 2 * Ly * tg[0][1] / N)); q.lineTo(X(-L + 2 * L * tg[1][0] / N), Y(-Ly + 2 * Ly * tg[1][1] / N)); }
          }
          q.stroke();
        }
        q.lineWidth = 1;
        /* il gradiente */
        q.strokeStyle = '#ffd24a';
        for (var a2 = 0; a2 < 13; a2++) for (var b2 = 0; b2 < 10; b2++) { var x = -L + 2 * L * (a2 + 0.5) / 13, y = -Ly + 2 * Ly * (b2 + 0.5) / 10, Gx = gx({ x: x, y: y }), Gy = gy({ x: x, y: y }), m = Math.hypot(Gx, Gy); if (!(m > 1e-9) || !isFinite(m)) continue; var lx = Gx / m * W / 34, ly = -Gy / m * W / 34, x0 = X(x), y0 = Y(y); q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0 + lx, y0 + ly); q.lineTo(x0 + 0.7 * lx + 0.22 * ly, y0 + 0.7 * ly - 0.22 * lx); q.moveTo(x0 + lx, y0 + ly); q.lineTo(x0 + 0.7 * lx - 0.22 * ly, y0 + 0.7 * ly + 0.22 * lx); q.stroke(); }
        cv.setAttribute('aria-label', t('curve di livello e gradiente', 'level curves and gradient'));
        info.innerHTML = '∇f = (<b>' + C.html(fx) + '</b>, <b>' + C.html(fy) + '</b>)<br>' + t('laplaciano ', 'Laplacian ') + 'Δf = ' + C.html(lap) + (C.stampa(lap) === '0' ? t(' → f è armonica', ' → f is harmonic') : '') + '<br>' + t('Le frecce gialle (gradiente) sono sempre perpendicolari alle curve di livello e puntano dove f cresce più in fretta: è la direzione che segue un metodo di discesa (cambiata di segno) e la forza −∇U in un potenziale.', 'The yellow arrows (gradient) are always perpendicular to the level curves and point where f grows fastest: it is the direction a descent method follows (with the sign flipped) and the force −∇U in a potential.');
      } catch (e) { info.textContent = '⚠ ' + e.message; }
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('smatvett', {
    titolo: ['∇ Calcolo vettoriale', '∇ Vector calculus'],
    sotto: ['Campi vettoriali nel piano con particelle trascinate, divergenza e rotore, campi conservativi e potenziale; circuitazione e flusso con il teorema di Green verificato; gradiente, curve di livello e laplaciano.', 'Planar vector fields with advected particles, divergence and curl, conservative fields and potential; circulation and flux with Green’s theorem verified; gradient, level curves and Laplacian.'],
    schede: [
      { nome: ['🌬️ Campi', '🌬️ Fields'], costruisci: schedaCampi },
      { nome: ['🔁 Lavoro e flusso (Green)', '🔁 Work and flux (Green)'], costruisci: schedaGreen },
      { nome: ['⛰️ Gradiente', '⛰️ Gradient'], costruisci: schedaGradiente }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
