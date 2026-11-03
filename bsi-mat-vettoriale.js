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

  /* ═══ 4. campo nello spazio (v238) ══════════════════════════════════════
     F = (P, Q, R) di x, y, z: divergenza e rotore simbolici, frecce su una griglia 6×6×6, linee
     di flusso integrate con Runge-Kutta 4 e particelle che le percorrono; una sfera di centro e
     raggio a scelta, colorata con F·n, per il teorema della divergenza:
       ∯ F·n dS (sulla sfera)  =  ∭ div F dV (nella palla).
     Entrambi gli integrali con Gauss–Legendre nelle variabili polari (cos θ e raggio) e con la
     regola dei trapezi in φ, che per una funzione periodica converge esponenzialmente: per campi
     regolari i due membri coincidono fino a ~10⁻¹². */
  function analizzaCampo3(Pt, Qt, Rt) {
    var E = [C.leggi(Pt), C.leggi(Qt), C.leggi(Rt)], extra = [];
    E.forEach(function (e) { C.simboli(e).forEach(function (v) { if (v !== 'x' && v !== 'y' && v !== 'z' && extra.indexOf(v) < 0) extra.push(v); }); });
    if (extra.length) throw new Error(t('usa solo x, y e z (trovato: ', 'use only x, y and z (found: ') + extra.join(', ') + ')');
    var d = function (e, v) { return C.deriva(e, v); }, S = C.semplifica, cs = C.costruisci;
    var div = S(cs.add(cs.add(d(E[0], 'x'), d(E[1], 'y')), d(E[2], 'z')));
    var rot = [S(cs.sub(d(E[2], 'y'), d(E[1], 'z'))), S(cs.sub(d(E[0], 'z'), d(E[2], 'x'))), S(cs.sub(d(E[1], 'x'), d(E[0], 'y')))];
    /* il semplificatore non sempre riduce a 0 un'espressione nulla (la carica puntiforme): si prova in 40 punti */
    var nulla = function (e) { var f = C.compila(e), n = 0; for (var i = 0; i < 40; i++) { var r = 0.3 + i * 0.05, a = i * 2.39996, b = i * 0.7; var v = f({ x: r * Math.cos(a) * Math.sin(b + 0.3), y: r * Math.sin(a) * Math.sin(b + 0.3), z: r * Math.cos(b + 0.3) }); if (!isFinite(v)) continue; if (Math.abs(v) > 1e-9) return false; n++; } return n > 10; };
    if (C.stampa(div) !== '0' && nulla(div)) div = C.Q(0);
    rot = rot.map(function (e) { return C.stampa(e) !== '0' && nulla(e) ? C.Q(0) : e; });
    var f = E.map(C.compila), fr = rot.map(C.compila), fd = C.compila(div), amb = { x: 0, y: 0, z: 0 };
    return {
      E: E, div: div, rot: rot,
      F: function (x, y, z) { amb.x = x; amb.y = y; amb.z = z; return [f[0](amb), f[1](amb), f[2](amb)]; },
      divF: function (x, y, z) { amb.x = x; amb.y = y; amb.z = z; return fd(amb); },
      rotF: function (x, y, z) { amb.x = x; amb.y = y; amb.z = z; return [fr[0](amb), fr[1](amb), fr[2](amb)]; }
    };
  }
  /* nodi e pesi di Gauss–Legendre su [−1, 1] (Newton sul polinomio di Legendre) */
  var GL = {};
  function gaussLegendre(n) {
    if (GL[n]) return GL[n];
    var x = [], w = [];
    for (var i = 1; i <= n; i++) {
      var z = Math.cos(Math.PI * (i - 0.25) / (n + 0.5)), dp = 1;
      for (var it = 0; it < 100; it++) { var p0 = 1, p1 = z; for (var k = 2; k <= n; k++) { var p2 = ((2 * k - 1) * z * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; } dp = n * (z * p1 - p0) / (z * z - 1); var dz = p1 / dp; z -= dz; if (Math.abs(dz) < 1e-15) break; }
      x.push(z); w.push(2 / ((1 - z * z) * dp * dp));
    }
    return (GL[n] = { x: x, w: w });
  }
  /* flusso uscente dalla sfera |p − c| = r: n = (p − c)/r, dS = r² d(cos θ) dφ */
  function flussoSfera(A, c, r, n) {
    n = n || 24; var G = gaussLegendre(n), m = 2 * n, s = 0;
    for (var i = 0; i < n; i++) { var u = G.x[i], st = Math.sqrt(1 - u * u); for (var j = 0; j < m; j++) { var ph = 2 * Math.PI * (j + 0.5) / m, nx = st * Math.cos(ph), ny = st * Math.sin(ph), v = A.F(c[0] + r * nx, c[1] + r * ny, c[2] + r * u); s += G.w[i] * (v[0] * nx + v[1] * ny + v[2] * u); } }
    return s * r * r * 2 * Math.PI / m;
  }
  /* ∭ div F dV sulla palla: ρ ∈ [0, r] e cos θ con Gauss–Legendre, φ con i trapezi */
  function divergenzaPalla(A, c, r, n) {
    n = n || 16; var G = gaussLegendre(n), m = 2 * n, s = 0;
    for (var a = 0; a < n; a++) { var rho = r * (G.x[a] + 1) / 2, wr = G.w[a] * r / 2 * rho * rho;
      for (var i = 0; i < n; i++) { var u = G.x[i], st = Math.sqrt(1 - u * u); for (var j = 0; j < m; j++) { var ph = 2 * Math.PI * (j + 0.5) / m; s += wr * G.w[i] * A.divF(c[0] + rho * st * Math.cos(ph), c[1] + rho * st * Math.sin(ph), c[2] + rho * u); } } }
    return s * 2 * Math.PI / m;
  }
  /* linea di flusso: RK4 lungo la direzione del campo (velocita' unitaria), dentro il cubo |x|,|y|,|z| ≤ L */
  function lineaFlusso3(A, p0, verso, passi, h, L) {
    var p = p0.slice(), out = [p.slice()];
    function dir(q) { var v = A.F(q[0], q[1], q[2]), m = Math.hypot(v[0], v[1], v[2]); return m > 1e-12 && isFinite(m) ? [verso * v[0] / m, verso * v[1] / m, verso * v[2] / m] : null; }
    for (var i = 0; i < passi; i++) {
      var k1 = dir(p); if (!k1) break; var k2 = dir([p[0] + h / 2 * k1[0], p[1] + h / 2 * k1[1], p[2] + h / 2 * k1[2]]); if (!k2) break;
      var k3 = dir([p[0] + h / 2 * k2[0], p[1] + h / 2 * k2[1], p[2] + h / 2 * k2[2]]); if (!k3) break; var k4 = dir([p[0] + h * k3[0], p[1] + h * k3[1], p[2] + h * k3[2]]); if (!k4) break;
      p = [p[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), p[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), p[2] + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
      if (Math.abs(p[0]) > L || Math.abs(p[1]) > L || Math.abs(p[2]) > L) break;
      out.push(p.slice());
    }
    return out;
  }
  F.calcolo.vettoriale.analizzaCampo3 = analizzaCampo3; F.calcolo.vettoriale.gaussLegendre = gaussLegendre; F.calcolo.vettoriale.flussoSfera = flussoSfera; F.calcolo.vettoriale.divergenzaPalla = divergenzaPalla; F.calcolo.vettoriale.lineaFlusso3 = lineaFlusso3;

  /* la scheda 3D: il pannello si costruisce subito (testo e comandi), la scena dopo, fuori dal gestore del clic */
  function scheda3d(costruisci, etichetta, rapporto) {
    return function (div) {
      var G = griglia(div), posto = F.el('div'); G.dx.appendChild(posto);
      var vista = costruisci(G.pan, G.dx), lab = globale.BSILab3D;
      if (!lab) { posto.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serve il Laboratorio 3D (bsi-lab3d.js) per la vista tridimensionale.', 'The 3D Laboratory (bsi-lab3d.js) is needed for the three-dimensional view.') })); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); posto.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new lab.Scena(posto, rapporto || 0.72);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(etichetta));
          globale.requestAnimationFrame(function () { try { vista(S, lab, globale.THREE); } catch (e) { if (globale.console) console.error(e); } div._scena = S; });
        }, 0);
      }).catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  /* scala di colori per il modulo: blu → verde acqua → giallo → rosso */
  function scalaModulo(u) { u = Math.max(0, Math.min(1, u)); var P = [[0.32, 0.45, 1], [0.37, 0.92, 0.83], [1, 0.82, 0.29], [1, 0.42, 0.42]], k = Math.min(2, Math.floor(u * 3)), f = u * 3 - k, a = P[k], b = P[k + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  var CAMPI3 = [
    ['x', 'y', 'z', ['sorgente uniforme (div F = 3)', 'uniform source (div F = 3)']],
    ['-y', 'x', '0', ['rotazione rigida (rot F = 2 k)', 'rigid rotation (curl F = 2 k)']],
    ['-y', 'x', '0.3*z', ['vortice che si apre in altezza', 'vortex opening upwards']],
    ['x - y', 'x + y', '-2*z', ['spirale schiacciata (div F = 0)', 'squeezed spiral (div F = 0)']],
    ['y*z', 'x*z', 'x*y', ['conservativo, φ = xyz (rot F = 0)', 'conservative, φ = xyz (curl F = 0)']],
    ['sin(z) + cos(y)', 'sin(x) + cos(z)', 'sin(y) + cos(x)', ['flusso ABC di Beltrami (rot F = F)', 'ABC Beltrami flow (curl F = F)']],
    ['x/(x^2+y^2+z^2)^(3/2)', 'y/(x^2+y^2+z^2)^(3/2)', 'z/(x^2+y^2+z^2)^(3/2)', ['carica puntiforme (div F = 0 tranne nell’origine)', 'point charge (div F = 0 except at the origin)']]
  ];
  function schedaCampo3D(pan) {
    var st = { k: 0, P: CAMPI3[0][0], Q: CAMPI3[0][1], R: CAMPI3[0][2], c: [0.3, 0, 0], r: 1, linee: 18 }, A = null, S = null, T = null, lab = null, Lb = 2, sc = 1.4, oggetti = {}, ip, iq, ir, attesaConti = null;
    F.scelta(pan, ['Esempi', 'Examples'], CAMPI3.map(function (c, i) { return [String(i), F.tt(c[3])]; }), '0', function (v) { var c = CAMPI3[+v]; st.P = ip.value = c[0]; st.Q = iq.value = c[1]; st.R = ir.value = c[2]; analizza(); });
    ip = campo(pan, ['P(x, y, z)', 'P(x, y, z)'], st.P, function (v) { st.P = v; analizza(); });
    iq = campo(pan, ['Q(x, y, z)', 'Q(x, y, z)'], st.Q, function (v) { st.Q = v; analizza(); });
    ir = campo(pan, ['R(x, y, z)', 'R(x, y, z)'], st.R, function (v) { st.R = v; analizza(); });
    var f1 = function (v) { return v.toFixed(2); };
    F.cursore(pan, ['centro della sfera x', 'sphere centre x'], -1, 1, 0.05, st.c[0], function (v) { st.c[0] = v; sfera(); }, f1);
    F.cursore(pan, ['centro della sfera y', 'sphere centre y'], -1, 1, 0.05, st.c[1], function (v) { st.c[1] = v; sfera(); }, f1);
    F.cursore(pan, ['centro della sfera z', 'sphere centre z'], -1, 1, 0.05, st.c[2], function (v) { st.c[2] = v; sfera(); }, f1);
    F.cursore(pan, ['raggio della sfera r', 'sphere radius r'], 0.2, 1.6, 0.05, st.r, function (v) { st.r = v; sfera(); }, f1);
    F.cursore(pan, ['linee di flusso', 'streamlines'], 6, 40, 2, st.linee, function (v) { st.linee = v; flusso(); });
    var info = nota(pan), conti = nota(pan);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Le frecce danno direzione e verso di F (colore e lunghezza crescono con |F|); le linee di flusso sono le curve tangenti al campo, integrate con Runge-Kutta 4, e le particelle bianche le percorrono. La divergenza misura quanto «esce» da un volumetto: positiva in una sorgente, nulla in un fluido incomprimibile. Il rotore misura la rotazione locale: la freccia gialla al centro della sfera è rot F, il cui modulo è il doppio della velocità angolare di una rotellina immersa nel fluido. La sfera è colorata con F·n: rosso dove il campo esce, blu dove entra. Il teorema della divergenza (Gauss–Ostrogradskij) dice che il flusso uscente totale è l’integrale della divergenza sul volume interno: qui i due membri sono calcolati in modo indipendente, uno sulla superficie e uno nel volume. Con la carica puntiforme il teorema cade se l’origine è dentro la sfera: la divergenza è nulla ovunque tranne in un punto, ma il flusso vale 4π.',
      'Arrows give the direction and sense of F (colour and length grow with |F|); streamlines are the curves tangent to the field, integrated with Runge-Kutta 4, and the white particles travel along them. Divergence measures how much «leaves» a small volume: positive at a source, zero in an incompressible fluid. Curl measures local rotation: the yellow arrow at the centre of the sphere is curl F, whose magnitude is twice the angular velocity of a small paddle wheel in the fluid. The sphere is coloured by F·n: red where the field leaves, blue where it enters. The divergence theorem (Gauss–Ostrogradsky) says that the total outward flux equals the integral of the divergence over the volume inside: here the two sides are computed independently, one on the surface and one in the volume. With the point charge the theorem fails when the origin is inside the sphere: the divergence is zero everywhere except at one point, yet the flux is 4π.') }));
    function analizza() {
      try { A = analizzaCampo3(st.P, st.Q, st.R); }
      catch (e) { A = null; info.innerHTML = '<span class="bsiFX-ko">' + t('Espressione non valida: ', 'Invalid expression: ') + esc(e.message) + '</span>'; conti.innerHTML = ''; if (S) { S.pulisci(); S.aggiungi(lab.assi(T, Lb * sc * 1.1, ['x', 'y', 'z'], 0.3)); } return; }
      var r0 = A.rotF(0.37, -0.21, 0.53), F0 = A.F(0.37, -0.21, 0.53), beltrami = isFinite(r0[0]) && Math.hypot(r0[0] - F0[0], r0[1] - F0[1], r0[2] - F0[2]) < 1e-9 && Math.hypot(F0[0], F0[1], F0[2]) > 1e-6;
      info.innerHTML = 'div F = <b>' + C.html(A.div) + '</b><br>rot F = (<b>' + A.rot.map(C.html).join('</b>, <b>') + '</b>)' + (A.rot.every(function (e) { return C.stampa(e) === '0'; }) ? t(' → irrotazionale', ' → irrotational') : '') + (beltrami ? t(' → rot F = F (campo di Beltrami)', ' → curl F = F (Beltrami field)') : '');
      scena(); conta();
    }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    /* i due integrali: dopo il disegno, fuori dal gestore del cursore */
    function conta() {
      clearTimeout(attesaConti);
      attesaConti = setTimeout(function () {
        if (!A) return;
        var zero = function (v) { return Math.abs(v) < 1e-12 ? 0 : v; }, fl = zero(flussoSfera(A, st.c, st.r, 24)), dv = zero(divergenzaPalla(A, st.c, st.r, 16)), diff = Math.abs(fl - dv), ok = isFinite(fl) && isFinite(dv) && diff <= 1e-6 * Math.max(1, Math.abs(fl));
        conti.innerHTML = t('Flusso uscente ', 'Outward flux ') + '∯ F·n dS = <b class="bsiFX-num">' + C.fmtNum(fl) + '</b><br>∭ div F dV = <b class="bsiFX-num">' + (isFinite(dv) ? C.fmtNum(dv) : t('non definito', 'undefined')) + '</b> · ' + t('scarto ', 'gap ') + (isFinite(diff) ? diff.toExponential(1) : '—') + '<br>' +
          (ok ? '<span class="bsiFX-ok">' + t('Teorema della divergenza verificato: i due membri coincidono.', 'Divergence theorem verified: both sides agree.') + '</span>' : '<span class="bsiFX-ko">' + t('I due membri non coincidono: il campo ha una singolarità dentro la sfera (una carica puntiforme, 4π = 12,566) e il teorema non si applica. Sposta la sfera finché l’origine resta fuori.', 'The two sides disagree: the field has a singularity inside the sphere (a point charge, 4π = 12.566) and the theorem does not apply. Move the sphere until the origin is outside.') + '</span>');
      }, 30);
    }
    function vec(p) { return new T.Vector3(p[0] * sc, p[1] * sc, p[2] * sc); }
    function scena() {
      if (!S || !A) return;
      S.pulisci(); oggetti = {};
      /* le frecce: aste e punte come mesh istanziate (216 frecce in due chiamate di disegno) */
      var pts = [], vs = [], mods = [], n = 6;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) for (var k = 0; k < n; k++) { var p = [-1.75 + 3.5 * i / (n - 1), -1.75 + 3.5 * j / (n - 1), -1.75 + 3.5 * k / (n - 1)], v = A.F(p[0], p[1], p[2]), m = Math.hypot(v[0], v[1], v[2]); if (!(m > 1e-12) || !isFinite(m)) continue; pts.push(p); vs.push(v); mods.push(m); }
      var ord = mods.slice().sort(function (a, b) { return a - b; }), mmax = ord[Math.floor(ord.length * 0.95)] || 1;
      if (pts.length) {
        var asta = new T.InstancedMesh(new T.CylinderGeometry(0.022, 0.022, 1, 6), new T.MeshStandardMaterial({ roughness: 0.5 }), pts.length), punta = new T.InstancedMesh(new T.ConeGeometry(0.07, 0.18, 10), new T.MeshStandardMaterial({ roughness: 0.4 }), pts.length);
        var M4 = new T.Matrix4(), q = new T.Quaternion(), su = new T.Vector3(0, 1, 0), col = new T.Color();
        pts.forEach(function (p, i) {
          var u = Math.min(1, mods[i] / mmax), L = 0.2 + 0.38 * Math.sqrt(u), d = new T.Vector3(vs[i][0], vs[i][1], vs[i][2]).normalize(), c = vec(p), cc = scalaModulo(u);
          q.setFromUnitVectors(su, d); col.setRGB(cc[0], cc[1], cc[2]);
          M4.compose(c.clone().addScaledVector(d, -L / 2 + (L - 0.18) / 2 - 0.0), q, new T.Vector3(1, Math.max(0.02, L - 0.18), 1)); asta.setMatrixAt(i, M4); asta.setColorAt(i, col);
          M4.compose(c.clone().addScaledVector(d, L / 2 - 0.09), q, new T.Vector3(1, 1, 1)); punta.setMatrixAt(i, M4); punta.setColorAt(i, col);
        });
        S.aggiungi(asta); S.aggiungi(punta);
      }
      var L = Lb * sc, cubo = [[-L, -L, -L], [L, -L, -L], [L, L, -L], [-L, L, -L]];
      S.aggiungi(new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(2 * L, 2 * L, 2 * L)), new T.LineBasicMaterial({ color: 0x34465f, transparent: true, opacity: 0.6 }))); void cubo;
      S.aggiungi(lab.assi(T, L * 1.1, ['x', 'y', 'z'], 0.3));
      S.didascalia.textContent = 'F = (' + C.stampa(A.E[0]) + ', ' + C.stampa(A.E[1]) + ', ' + C.stampa(A.E[2]) + ')';
      flusso(); sfera();
      if (!S.vistaIniziale) S.inquadra(13, -0.8, 1.15);
    }
    /* le linee di flusso partono da una spirale di Fibonacci sulla sfera di raggio 1,2 attorno all'origine */
    function flusso() {
      if (!S || !A) return;
      if (oggetti.linee) { S.radice.remove(oggetti.linee); oggetti.linee.geometry.dispose(); S.radice.remove(oggetti.parti); oggetti.parti.geometry.dispose(); }
      var seg = [], cols = [], tracce = [], ga = Math.PI * (3 - Math.sqrt(5)), N = st.linee;
      for (var i = 0; i < N; i++) {
        var z = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - z * z), p0 = [1.2 * rr * Math.cos(ga * i), 1.2 * rr * Math.sin(ga * i), 1.2 * z];
        var avanti = lineaFlusso3(A, p0, 1, 160, 0.04, Lb), indietro = lineaFlusso3(A, p0, -1, 160, 0.04, Lb), tr = indietro.reverse().concat(avanti.slice(1));
        if (tr.length < 2) continue; tracce.push(tr);
        for (var k = 1; k < tr.length; k++) { seg.push(tr[k - 1][0] * sc, tr[k - 1][1] * sc, tr[k - 1][2] * sc, tr[k][0] * sc, tr[k][1] * sc, tr[k][2] * sc); var c = scalaModulo(0.15 + 0.7 * k / tr.length); cols.push(c[0], c[1], c[2], c[0], c[1], c[2]); }
      }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(seg, 3)); g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
      oggetti.linee = new T.LineSegments(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 })); S.aggiungi(oggetti.linee);
      /* le particelle: quattro per linea, sfasate, avanzano lungo la traccia */
      var np = tracce.length * 4, pp = new Float32Array(np * 3), fasi = []; for (i = 0; i < np; i++) fasi.push((i % 4) / 4 + 0.13 * Math.floor(i / 4));
      var gp = new T.BufferGeometry(); gp.setAttribute('position', new T.BufferAttribute(pp, 3));
      oggetti.parti = new T.Points(gp, new T.PointsMaterial({ color: 0xffffff, size: 0.11, transparent: true, opacity: 0.95, depthWrite: false })); S.aggiungi(oggetti.parti);
      var tempo = 0;
      S.fotogrammi = S.fotogrammi.filter(function (f) { return !f._flusso; });
      var passo = function (dt) {
        tempo += dt * 0.12;
        for (var i = 0; i < np; i++) { var tr = tracce[Math.floor(i / 4)], u = (tempo + fasi[i]) % 1, k = Math.min(tr.length - 1, Math.floor(u * (tr.length - 1))); pp[3 * i] = tr[k][0] * sc; pp[3 * i + 1] = tr[k][1] * sc; pp[3 * i + 2] = tr[k][2] * sc; }
        gp.attributes.position.needsUpdate = true;
      };
      passo._flusso = true; passo(0); S.ogniFotogramma(passo);
    }
    /* la sfera colorata con F·n e il rotore nel centro */
    function sfera() {
      if (!S || !A) return;
      if (oggetti.sfera) { [oggetti.sfera, oggetti.rete, oggetti.rot, oggetti.centro].forEach(function (o) { if (o) { S.radice.remove(o); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); }); } }); }
      var geo = new T.SphereGeometry(st.r * sc, 48, 32), pos = geo.attributes.position, col = [], fn = [], m = 0, i;
      for (i = 0; i < pos.count; i++) { var nx = pos.getX(i) / (st.r * sc), ny = pos.getY(i) / (st.r * sc), nz = pos.getZ(i) / (st.r * sc), v = A.F(st.c[0] + st.r * nx, st.c[1] + st.r * ny, st.c[2] + st.r * nz), d = v[0] * nx + v[1] * ny + v[2] * nz; fn.push(d); if (isFinite(d)) m = Math.max(m, Math.abs(d)); }
      fn.forEach(function (d) { var u = isFinite(d) && m > 0 ? d / m : 0, a = Math.abs(u); col.push(u > 0 ? 0.25 + 0.75 * a : 0.25 - 0.1 * a, 0.3 + 0.2 * (1 - a), u > 0 ? 0.3 - 0.1 * a : 0.35 + 0.65 * a); });
      geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      oggetti.sfera = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.55, roughness: 0.4, side: T.DoubleSide, depthWrite: false }));
      oggetti.sfera.position.copy(vec(st.c)); S.aggiungi(oggetti.sfera);
      oggetti.rete = new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(st.r * sc, 16, 10)), new T.LineBasicMaterial({ color: 0xe6fffb, transparent: true, opacity: 0.12 })); oggetti.rete.position.copy(vec(st.c)); S.aggiungi(oggetti.rete);
      var rc = A.rotF(st.c[0], st.c[1], st.c[2]), mr = Math.hypot(rc[0], rc[1], rc[2]);
      oggetti.centro = lab.sfera(T, 0.06, 0xffd24a, st.c[0] * sc, st.c[1] * sc, st.c[2] * sc, true); S.aggiungi(oggetti.centro);
      if (mr > 1e-9 && isFinite(mr)) { var lr = Math.min(2.2, 0.5 + 0.5 * mr); oggetti.rot = lab.freccia(T, [st.c[0] * sc, st.c[1] * sc, st.c[2] * sc], [st.c[0] * sc + rc[0] / mr * lr, st.c[1] * sc + rc[1] / mr * lr, st.c[2] * sc + rc[2] / mr * lr], 0xffd24a, 0.32); S.aggiungi(oggetti.rot); }
      conta();
    }
    analizza();
    return function (Sc, L3, Tr) { S = Sc; lab = L3; T = Tr; scena(); };
  }

  F.sezione('smatvett', {
    titolo: ['∇ Calcolo vettoriale', '∇ Vector calculus'],
    sotto: ['Campi vettoriali nel piano con particelle trascinate, divergenza e rotore, campi conservativi e potenziale; circuitazione e flusso con il teorema di Green verificato; gradiente, curve di livello e laplaciano.', 'Planar vector fields with advected particles, divergence and curl, conservative fields and potential; circulation and flux with Green’s theorem verified; gradient, level curves and Laplacian.'],
    schede: [
      { nome: ['🌬️ Campi', '🌬️ Fields'], costruisci: schedaCampi },
      { nome: ['🔁 Lavoro e flusso (Green)', '🔁 Work and flux (Green)'], costruisci: schedaGreen },
      { nome: ['⛰️ Gradiente', '⛰️ Gradient'], costruisci: schedaGradiente },
      { nome: ['🧊 Campo 3D e divergenza', '🧊 3D field and divergence'], costruisci: scheda3d(schedaCampo3D, ['Campo vettoriale 3D con linee di flusso e sfera per il teorema della divergenza', '3D vector field with streamlines and a sphere for the divergence theorem']) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
