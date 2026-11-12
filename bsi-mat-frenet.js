/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-frenet.js — 🌀 Curve nello spazio: curvatura, torsione, triedro di
   Frenet
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v252)
   Richiesta dell'autore: potenziare al massimo la matematica. L'app aveva il
   calcolo vettoriale e la geometria del piano; mancava la geometria
   differenziale delle curve: quanto una curva si piega (curvatura κ) e quanto
   esce dal suo piano (torsione τ), e il triedro mobile T, N, B che la
   accompagna.

   LE FORMULE (per una parametrizzazione qualunque r(t))
       κ = |r′ × r″| / |r′|³          τ = (r′ × r″)·r‴ / |r′ × r″|²
       T = r′/|r′|    B = (r′ × r″)/|r′ × r″|    N = B × T
       s = ∫ |r′| dt  (Simpson)
   Frenet–Serret:  dT/ds = κN,  dN/ds = −κT + τB,  dB/ds = −τN.
   Le derivate si fanno con differenze centrate a cinque punti (errore h⁴):
   per le curve del catalogo i valori esatti noti (elica: κ = a/(a²+b²),
   τ = b/(a²+b²); cubica gobba in t = 0: κ = 2, τ = 3) tornano alla sesta
   cifra, e la sezione lo mostra.

   ONESTA'
   · Dove r′ × r″ = 0 (un tratto rettilineo, un punto di flesso) N, B e τ non
     sono definiti: la sezione lo dice invece di disegnare frecce a caso.
   · Una curva scritta dall'utente si valuta con un piccolo interprete di
     espressioni (solo funzioni matematiche: niente codice).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ 1. I VETTORI ═════════════════════════════════════════════════════ */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function sc(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norma(a) { return Math.sqrt(dot(a, a)); }
  function unit(a) { var n = norma(a); return n > 0 ? sc(a, 1 / n) : [0, 0, 0]; }

  /* ═══ 2. IL CATALOGO ═══════════════════════════════════════════════════ */
  var CURVE = {
    elica: { nome: ['Elica circolare (a = 1, b = 0,5)', 'Circular helix (a = 1, b = 0.5)'], r: function (u) { return [Math.cos(u), Math.sin(u), 0.5 * u]; }, da: 0, a: 4 * PI, esatto: function () { return { k: 1 / 1.25, tau: 0.5 / 1.25 }; } },
    cubica: { nome: ['Cubica gobba (t, t², t³)', 'Twisted cubic (t, t², t³)'], r: function (u) { return [u, u * u, u * u * u]; }, da: -1.2, a: 1.2, esatto: function (u) { var d = 1 + 4 * u * u + 9 * Math.pow(u, 4); return { k: 2 * Math.sqrt(9 * Math.pow(u, 4) + 9 * u * u + 1) / Math.pow(d, 1.5), tau: 3 / (9 * Math.pow(u, 4) + 9 * u * u + 1) }; } },
    trifoglio: { nome: ['Nodo trifoglio', 'Trefoil knot'], r: function (u) { var q = 2 + Math.cos(3 * u); return [q * Math.cos(2 * u), q * Math.sin(2 * u), Math.sin(3 * u)]; }, da: 0, a: 2 * PI },
    viviani: { nome: ['Curva di Viviani (sfera ∩ cilindro)', 'Viviani’s curve (sphere ∩ cylinder)'], r: function (u) { return [1 + Math.cos(u), Math.sin(u), 2 * Math.sin(u / 2)]; }, da: 0, a: 4 * PI },
    conica: { nome: ['Spirale conica (t cos t, t sin t, t)', 'Conical spiral (t cos t, t sin t, t)'], r: function (u) { return [u * Math.cos(u), u * Math.sin(u), u]; }, da: 0, a: 6 * PI },
    cerchio: { nome: ['Cerchio di raggio 2 (curva piana)', 'Circle of radius 2 (plane curve)'], r: function (u) { return [2 * Math.cos(u), 2 * Math.sin(u), 0]; }, da: 0, a: 2 * PI, esatto: function () { return { k: 0.5, tau: 0 }; } }
  };

  /** Un piccolo interprete per «cos(t)», «t^2», «2*sin(t/2)»: solo numeri, t, + − * / ^, parentesi e funzioni matematiche. */
  var FUNZ = { sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, log: Math.log, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, atan: Math.atan, asin: Math.asin, acos: Math.acos };
  function compila(testo) {
    var s = String(testo || '').replace(/\s+/g, '').replace(/π/g, 'pi').replace(/·/g, '*').replace(/−/g, '-').toLowerCase(), i = 0;
    if (!s) throw new Error('espressione vuota');
    function vedi() { return s[i]; }
    function prendi(c) { if (s[i] === c) { i++; return true; } return false; }
    function somma() { var n = prodotto(); for (;;) { if (prendi('+')) { var a = n, b = prodotto(); n = (function (a, b) { return function (u) { return a(u) + b(u); }; })(a, b); } else if (prendi('-')) { var a2 = n, b2 = prodotto(); n = (function (a, b) { return function (u) { return a(u) - b(u); }; })(a2, b2); } else return n; } }
    function prodotto() { var n = potenza(); for (;;) { if (prendi('*')) { var a = n, b = potenza(); n = (function (a, b) { return function (u) { return a(u) * b(u); }; })(a, b); } else if (prendi('/')) { var a2 = n, b2 = potenza(); n = (function (a, b) { return function (u) { return a(u) / b(u); }; })(a2, b2); } else if (/[0-9a-z(.]/.test(vedi() || '')) { var a3 = n, b3 = potenza(); n = (function (a, b) { return function (u) { return a(u) * b(u); }; })(a3, b3); } else return n; } }
    function potenza() { var b = unario(); if (prendi('^')) { var e = potenza(); return function (u) { return Math.pow(b(u), e(u)); }; } return b; }
    function unario() { if (prendi('-')) { var x = unario(); return function (u) { return -x(u); }; } if (prendi('+')) return unario(); return atomo(); }
    function atomo() {
      var m;
      if (prendi('(')) { var e = somma(); if (!prendi(')')) throw new Error('manca una parentesi chiusa'); return e; }
      if ((m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i)))) { i += m[0].length; var v = +m[0]; return function () { return v; }; }
      if ((m = /^[a-z]+/.exec(s.slice(i)))) {
        var w = m[0]; i += w.length;
        if (w === 't') return function (u) { return u; };
        if (w === 'pi') return function () { return PI; };
        if (w === 'e') return function () { return Math.E; };
        if (FUNZ[w]) { if (!prendi('(')) throw new Error('dopo ' + w + ' serve una parentesi'); var arg = somma(); if (!prendi(')')) throw new Error('manca una parentesi chiusa'); var f = FUNZ[w]; return function (u) { return f(arg(u)); }; }
        throw new Error('non conosco «' + w + '»');
      }
      throw new Error('carattere inatteso «' + (vedi() || 'fine') + '»');
    }
    var out = somma(); if (i < s.length) throw new Error('carattere inatteso «' + s[i] + '»');
    return out;
  }
  function curvaScritta(ex, ey, ez) { var X = compila(ex), Y = compila(ey), Z = compila(ez); return function (u) { return [X(u), Y(u), Z(u)]; }; }

  /* ═══ 3. LA GEOMETRIA ══════════════════════════════════════════════════ */
  /** Derivate prima, seconda e terza con differenze centrate a cinque punti. */
  function derivate(r, u, h) {
    h = h || 1e-3;
    var p2 = r(u + 2 * h), p1 = r(u + h), p0 = r(u), m1 = r(u - h), m2 = r(u - 2 * h), d1 = [], d2 = [], d3 = [], h3 = 1e-2, q = [r(u + 3 * h3), r(u + 2 * h3), r(u + h3), r(u - h3), r(u - 2 * h3), r(u - 3 * h3)];
    for (var k = 0; k < 3; k++) {
      d1.push((-p2[k] + 8 * p1[k] - 8 * m1[k] + m2[k]) / (12 * h));
      d2.push((-p2[k] + 16 * p1[k] - 30 * p0[k] + 16 * m1[k] - m2[k]) / (12 * h * h));
      d3.push((-q[0][k] + 8 * q[1][k] - 13 * q[2][k] + 13 * q[3][k] - 8 * q[4][k] + q[5][k]) / (8 * h3 * h3 * h3));
    }
    return [d1, d2, d3];
  }
  /** Tutto ciò che si sa della curva in un punto. */
  function geometria(r, u) {
    var D = derivate(r, u), v = D[0], a = D[1], j = D[2], c = cross(v, a), nv = norma(v), nc = norma(c);
    var piatta = nc < 1e-9 * Math.max(1, nv * nv);
    var T = unit(v), B = piatta ? null : unit(c), N = piatta ? null : cross(B, T);
    return { p: r(u), v: v, T: T, N: N, B: B, k: piatta ? 0 : nc / Math.pow(nv, 3), tau: piatta ? null : dot(c, j) / (nc * nc), velocita: nv, definito: !piatta };
  }
  /** Lunghezza d'arco fra due valori del parametro (Simpson, n pari). */
  function lunghezza(r, da, a, n) {
    n = n || 2000; if (n % 2) n++;
    var h = (a - da) / n, s = 0;
    for (var i = 0; i <= n; i++) { var w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * norma(derivate(r, da + i * h)[0]); }
    return s * h / 3;
  }
  /** Verifica numerica di Frenet–Serret: dT/ds confrontata con κN. Restituisce l'errore relativo. */
  function verificaFrenet(r, u) {
    var h = 1e-4, g0 = geometria(r, u), gp = geometria(r, u + h), gm = geometria(r, u - h);
    if (!g0.definito) return null;
    var dTds = sc(sub(gp.T, gm.T), 1 / (2 * h * g0.velocita)), kN = sc(g0.N, g0.k);
    var dBds = sc(sub(gp.B, gm.B), 1 / (2 * h * g0.velocita)), mtN = sc(g0.N, -g0.tau);
    return { T: norma(sub(dTds, kN)) / Math.max(1e-9, norma(kN)), B: norma(sub(dBds, mtN)) / Math.max(1e-6, Math.abs(g0.tau) || 1) };
  }

  /* ═══ 4. IL DISEGNO IN 3D ══════════════════════════════════════════════ */
  function vista(c, stato) {
    var W = Math.max(220, c.parentNode.clientWidth || 300), H = Math.round(W * 0.78), dpr = Math.min(2, globale.devicePixelRatio || 1);
    c.style.height = H + 'px'; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H);
    return { q: q, W: W, H: H };
  }
  function proiettore(stato, W, H, scala, centro) {
    var cy = Math.cos(stato.yaw), sy = Math.sin(stato.yaw), cp = Math.cos(stato.pitch), sp = Math.sin(stato.pitch);
    return function (P) {
      var x = P[0] - centro[0], y = P[1] - centro[1], z = P[2] - centro[2];
      var x1 = cy * x - sy * y, y1 = sy * x + cy * y;               /* giro attorno a z */
      var y2 = cp * y1 - sp * z, z2 = sp * y1 + cp * z;              /* inclinazione */
      var f = 4 / (4 + y2 / scala * 0.6);                            /* un poco di prospettiva */
      return { x: W / 2 + x1 * scala * f, y: H / 2 - z2 * scala * f, d: y2 };
    };
  }
  function freccia(q, A, B, col, etich) {
    q.strokeStyle = col; q.fillStyle = col; q.lineWidth = 2.4; q.beginPath(); q.moveTo(A.x, A.y); q.lineTo(B.x, B.y); q.stroke();
    var an = Math.atan2(B.y - A.y, B.x - A.x); q.beginPath(); q.moveTo(B.x, B.y); q.lineTo(B.x - 9 * Math.cos(an - 0.4), B.y - 9 * Math.sin(an - 0.4)); q.lineTo(B.x - 9 * Math.cos(an + 0.4), B.y - 9 * Math.sin(an + 0.4)); q.closePath(); q.fill();
    q.font = '700 13px system-ui,sans-serif'; q.fillText(etich, B.x + 5 * Math.cos(an) + 2, B.y + 5 * Math.sin(an) + 4);
  }

  /* ═══ 5. LE SCHEDE ═════════════════════════════════════════════════════ */
  function sceltaCurva(pan, st, cambia) {
    F.scelta(pan, ['Curva', 'Curve'], Object.keys(CURVE).map(function (k) { return [k, CURVE[k].nome]; }).concat([['scritta', ['Scrivila tu…', 'Write your own…']]]), st.chiave, function (v) { st.chiave = v; box.style.display = v === 'scritta' ? '' : 'none'; cambia(); });
    var box = F.el('div', { style: 'display:none' }), campi = ['cos(t)', 'sin(t)', 't/3'].map(function (v, i) { var c = F.el('input', { type: 'text', value: v, 'aria-label': ['x(t)', 'y(t)', 'z(t)'][i], style: 'width:100%;box-sizing:border-box;margin:3px 0;background:#071321;color:#e5eef7;border:1px solid #234;border-radius:7px;padding:6px 8px;font:13px ui-monospace,monospace' }); box.appendChild(F.el('label', { testo: ['x(t) =', 'y(t) =', 'z(t) ='][i], style: 'font-size:.8rem;color:#9fb3c8' })); box.appendChild(c); return c; });
    var err = F.el('div', { style: 'color:#ffb86b;font-size:.82rem;min-height:1em' }); box.appendChild(err);
    var da = F.el('input', { type: 'text', value: '0', 'aria-label': 't da' }), a = F.el('input', { type: 'text', value: '6*pi', 'aria-label': 't fino a' });
    [da, a].forEach(function (x) { x.style.cssText = 'width:46%;margin:3px 2% 3px 0;background:#071321;color:#e5eef7;border:1px solid #234;border-radius:7px;padding:6px 8px;font:13px ui-monospace,monospace'; box.appendChild(x); });
    campi.concat([da, a]).forEach(function (c) { c.addEventListener('change', cambia); });
    pan.appendChild(box);
    st.leggi = function () {
      if (st.chiave !== 'scritta') { var C = CURVE[st.chiave]; return { r: C.r, da: C.da, a: C.a, esatto: C.esatto }; }
      try { var r = curvaScritta(campi[0].value, campi[1].value, campi[2].value), d0 = compila(da.value)(0), d1 = compila(a.value)(0); if (!(d1 > d0)) throw new Error('l’intervallo di t va dal più piccolo al più grande'); err.textContent = ''; return { r: r, da: d0, a: d1 }; }
      catch (e) { err.textContent = e.message; var C2 = CURVE.elica; return { r: C2.r, da: C2.da, a: C2.a }; }
    };
  }
  function schedaTriedro(div) {
    var g = griglia(div), st = { chiave: 'elica', yaw: 0.7, pitch: 0.45 }, frazione = 0.3;
    sceltaCurva(g.pan, st, disegna);
    F.cursore(g.pan, ['Punto sulla curva', 'Point on the curve'], 0, 1, 0.002, frazione, function (v) { frazione = v; disegna(); }, function (v) { return Math.round(v * 100) + ' %'; });
    var info = nota(g.pan);
    var c = F.el('canvas', { role: 'img', 'aria-label': t('La curva nello spazio con il triedro di Frenet; trascina per ruotarla', 'The space curve with the Frenet frame; drag to rotate it'), style: 'width:100%;display:block;border-radius:12px;background:#06111d;touch-action:none;cursor:grab' });
    g.dx.appendChild(c); g.dx.appendChild(F.el('div', { style: 'font-size:.78rem;color:#9fb3c8;margin-top:4px', testo: t('Trascina con il dito o il mouse per ruotare. T tangente, N normale (verso il centro di curvatura), B binormale; il cerchio è il cerchio osculatore.', 'Drag with a finger or the mouse to rotate. T tangent, N normal (towards the centre of curvature), B binormal; the circle is the osculating circle.') }));
    var tocco = null;
    c.addEventListener('pointerdown', function (e) { tocco = { x: e.clientX, y: e.clientY }; try { c.setPointerCapture(e.pointerId); } catch (x) {} });
    c.addEventListener('pointermove', function (e) { if (!tocco) return; st.yaw += (e.clientX - tocco.x) * 0.01; st.pitch = Math.max(-1.4, Math.min(1.4, st.pitch + (e.clientY - tocco.y) * 0.01)); tocco = { x: e.clientX, y: e.clientY }; disegna(); });
    c.addEventListener('pointerup', function () { tocco = null; }); c.addEventListener('pointercancel', function () { tocco = null; });
    function disegna() {
      var C = st.leggi(), V = vista(c, st), q = V.q, n = 400, pts = [], mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      for (var i = 0; i <= n; i++) { var P = C.r(C.da + (C.a - C.da) * i / n); if (!P.every(isFinite)) continue; pts.push(P); for (var k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[k]); mx[k] = Math.max(mx[k], P[k]); } }
      var centro = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], ext = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) || 1, scala = Math.min(V.W, V.H) * 0.62 / ext;
      var pr = proiettore(st, V.W, V.H, scala, centro), PP = pts.map(pr), dmin = Math.min.apply(null, PP.map(function (p) { return p.d; })), dmax = Math.max.apply(null, PP.map(function (p) { return p.d; })) || 1;
      for (var j = 1; j < PP.length; j++) { var f = 1 - (PP[j].d - dmin) / ((dmax - dmin) || 1); q.strokeStyle = 'hsla(' + (195 - 60 * f) + ',85%,' + (40 + 25 * f) + '%,' + (0.45 + 0.55 * f) + ')'; q.lineWidth = 1.2 + 2 * f; q.beginPath(); q.moveTo(PP[j - 1].x, PP[j - 1].y); q.lineTo(PP[j].x, PP[j].y); q.stroke(); }
      var u = C.da + (C.a - C.da) * frazione, G = geometria(C.r, u), O = pr(G.p), L = ext * 0.22;
      if (G.definito && G.k > 1e-6 && 1 / G.k < ext * 3) {          /* il cerchio osculatore */
        var Rc = 1 / G.k, cc = [G.p[0] + G.N[0] * Rc, G.p[1] + G.N[1] * Rc, G.p[2] + G.N[2] * Rc]; q.strokeStyle = 'rgba(255,210,74,.55)'; q.lineWidth = 1.2; q.setLineDash([4, 4]); q.beginPath();
        for (var a = 0; a <= 64; a++) { var th = a / 64 * 2 * PI, P2 = [cc[0] - Rc * (Math.cos(th) * G.N[0] - Math.sin(th) * G.T[0]), cc[1] - Rc * (Math.cos(th) * G.N[1] - Math.sin(th) * G.T[1]), cc[2] - Rc * (Math.cos(th) * G.N[2] - Math.sin(th) * G.T[2])], s2 = pr(P2); if (a) q.lineTo(s2.x, s2.y); else q.moveTo(s2.x, s2.y); }
        q.stroke(); q.setLineDash([]);
      }
      freccia(q, O, pr([G.p[0] + G.T[0] * L, G.p[1] + G.T[1] * L, G.p[2] + G.T[2] * L]), '#ff6b6b', 'T');
      if (G.definito) { freccia(q, O, pr([G.p[0] + G.N[0] * L, G.p[1] + G.N[1] * L, G.p[2] + G.N[2] * L]), '#6dffb0', 'N'); freccia(q, O, pr([G.p[0] + G.B[0] * L, G.p[1] + G.B[1] * L, G.p[2] + G.B[2] * L]), '#6bb7ff', 'B'); }
      q.fillStyle = '#ffffff'; q.beginPath(); q.arc(O.x, O.y, 4.5, 0, 2 * PI); q.fill();
      var Ltot = lunghezza(C.r, C.da, C.a, 600), Ls = lunghezza(C.r, C.da, u, 300), E = C.esatto ? C.esatto(u) : null;
      info.innerHTML = '<div class="bsiFX-eq">κ = |r′×r″|/|r′|³ &nbsp; τ = (r′×r″)·r‴/|r′×r″|²</div>' +
        't = <b class="bsiFX-num">' + u.toFixed(3) + '</b>, s = <b class="bsiFX-num">' + Ls.toFixed(3) + '</b> ' + t('di', 'of') + ' ' + Ltot.toFixed(3) + '<br>' +
        (G.definito ? 'κ = <b class="bsiFX-num">' + G.k.toFixed(5) + '</b> (' + t('raggio', 'radius') + ' ' + (1 / G.k).toFixed(3) + '), τ = <b class="bsiFX-num">' + G.tau.toFixed(5) + '</b>' : '<b>' + t('Qui r′ × r″ = 0: la curva è localmente dritta, N, B e τ non sono definiti.', 'Here r′ × r″ = 0: the curve is locally straight, N, B and τ are not defined.') + '</b>') +
        (E ? '<br><small>' + t('Valori esatti', 'Exact values') + ': κ = ' + E.k.toFixed(5) + ', τ = ' + E.tau.toFixed(5) + '</small>' : '') +
        '<br><small>' + (G.definito && Math.abs(G.tau) < 1e-6 ? t('τ = 0: la curva resta in un piano (B è sempre lo stesso).', 'τ = 0: the curve stays in a plane (B never changes).') : t('τ ≠ 0: la curva esce dal piano osculatore, e B ruota.', 'τ ≠ 0: the curve leaves the osculating plane, and B turns.')) + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaGrafici(div) {
    var g = griglia(div), st = { chiave: 'trifoglio' };
    sceltaCurva(g.pan, st, disegna);
    var info = nota(g.pan), c = F.tela(g.dx, 0.6);
    function disegna() {
      var C = st.leggi(), xs = [], k = [], ta = [];
      for (var i = 0; i <= 300; i++) { var u = C.da + (C.a - C.da) * i / 300, G = geometria(C.r, u); xs.push(u); k.push(G.k); ta.push(G.tau == null ? 0 : Math.max(-20, Math.min(20, G.tau))); }
      F.grafico(c, { serie: [{ x: xs, y: k, col: '#ffd24a', larg: 2 }, { x: xs, y: ta, col: '#6bb7ff', larg: 2 }], xl: ['t', 't'], yl: ['κ, τ', 'κ, τ'], legenda: [{ col: '#ffd24a', etich: ['curvatura κ', 'curvature κ'] }, { col: '#6bb7ff', etich: ['torsione τ', 'torsion τ'] }] });
      var km = Math.max.apply(null, k), i0 = k.indexOf(km);
      info.innerHTML = t('Curvatura massima ', 'Maximum curvature ') + '<b class="bsiFX-num">' + km.toFixed(4) + '</b> ' + t('a t = ', 'at t = ') + xs[i0].toFixed(3) + '.<br>' + t('Lunghezza totale ', 'Total length ') + '<b class="bsiFX-num">' + lunghezza(C.r, C.da, C.a, 1000).toFixed(4) + '</b>.<br><small>' +
        t('Il teorema fondamentale delle curve: κ(s) e τ(s) determinano la curva a meno di una rotazione e di una traslazione. Due funzioni bastano a descriverne la forma.', 'The fundamental theorem of curves: κ(s) and τ(s) determine the curve up to a rotation and a translation. Two functions are enough to describe its shape.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaVerifica(div) {
    var g = griglia(div), info = nota(g.pan), box = F.el('div', { style: 'overflow-x:auto' }); g.dx.appendChild(box);
    info.innerHTML = '<div class="bsiFX-eq">dT/ds = κN &nbsp; dN/ds = −κT + τB &nbsp; dB/ds = −τN</div>' + t('Il calcolo numerico confrontato con i valori esatti noti, e le formule di Frenet–Serret verificate derivando il triedro. Un errore di 10⁻⁶ vuol dire sei cifre giuste.', 'The numerical computation compared with known exact values, and the Frenet–Serret formulas checked by differentiating the frame. An error of 10⁻⁶ means six correct digits.');
    var righe = [['elica', 1.3], ['cubica', 0], ['cubica', 1], ['cerchio', 0.4]].map(function (x) {
      var C = CURVE[x[0]], G = geometria(C.r, x[1]), E = C.esatto(x[1]), V = verificaFrenet(C.r, x[1]);
      return '<tr><td>' + t(C.nome[0], C.nome[1]) + '</td><td>' + x[1] + '</td><td>' + G.k.toFixed(6) + '</td><td>' + E.k.toFixed(6) + '</td><td>' + (G.tau == null ? '—' : G.tau.toFixed(6)) + '</td><td>' + E.tau.toFixed(6) + '</td><td>' + (V ? V.T.toExponential(1) : '—') + '</td></tr>';
    });
    box.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('Curva', 'Curve') + '</th><th>t</th><th>κ ' + t('calcolata', 'computed') + '</th><th>κ ' + t('esatta', 'exact') + '</th><th>τ ' + t('calcolata', 'computed') + '</th><th>τ ' + t('esatta', 'exact') + '</th><th>|dT/ds − κN|</th></tr>' + righe.join('') + '</table>' +
      '<p style="font-size:.85rem;color:#9fb3c8">' + t('Lunghezza di un giro d’elica (a = 1, b = 0,5): ', 'Length of one helix turn (a = 1, b = 0.5): ') + lunghezza(CURVE.elica.r, 0, 2 * PI, 2000).toFixed(6) + ' — ' + t('esatta', 'exact') + ' 2π√1,25 = ' + (2 * PI * Math.sqrt(1.25)).toFixed(6) + '</p>';
  }

  F.calcolo.frenet = { CURVE: CURVE, compila: compila, curvaScritta: curvaScritta, derivate: derivate, geometria: geometria, lunghezza: lunghezza, verificaFrenet: verificaFrenet };
  F.sezione('smatfrenet', {
    titolo: ['🌀 Curve nello spazio: curvatura, torsione, Frenet', '🌀 Space curves: curvature, torsion, Frenet'],
    sotto: ['Quanto una curva si piega e quanto esce dal suo piano: κ e τ in ogni punto, il triedro T, N, B e il cerchio osculatore su una curva che si ruota con il dito. Elica, cubica gobba, nodo trifoglio, Viviani, o la curva che scrivi tu.',
            'How much a curve bends and how much it leaves its plane: κ and τ at every point, the T, N, B frame and the osculating circle on a curve you rotate with a finger. Helix, twisted cubic, trefoil knot, Viviani, or the curve you write.'],
    schede: [
      { nome: ['La curva e il triedro', 'The curve and the frame'], costruisci: schedaTriedro },
      { nome: ['Curvatura e torsione', 'Curvature and torsion'], costruisci: schedaGrafici },
      { nome: ['Verifica', 'Check'], costruisci: schedaVerifica }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
