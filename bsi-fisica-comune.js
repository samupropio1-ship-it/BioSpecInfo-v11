/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fisica-comune.js — la casa comune delle sezioni di FISICA
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA FA

   Le otto sezioni della categoria «⚛️ Fisica» (Schrödinger, Hartree-Fock,
   rotovibrazionale, termodinamica statistica, dinamica molecolare,
   matematica per la chimica, cristallografia, radiochimica) si appoggiano
   qui per le cose che hanno in comune: l'intestazione, le schede, i
   cursori, i grafici su tela, la lingua. Ogni sezione si REGISTRA con
   `BSIFisica.sezione(id, descrizione)` e si costruisce la prima volta che
   la si apre (`BSIFisica.apri(id)`, chiamata dal navigatore).

   I CALCOLI NON STANNO QUI: ognuno sta nel suo modulo ed e' esposto in
   `BSIFisica.calcolo.<nome>`, cosi' il banco (tools/banchi/test_fisica.js)
   li prova contro i valori di riferimento senza disegnare niente.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  var sezioni = {};
  var calcolo = {};

  function en() {
    try { return !!(globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en'); }
    catch (e) { return false; }
  }
  function t(it, inglese) { return en() && inglese != null ? inglese : it; }
  function tt(coppia) { return Array.isArray(coppia) ? t(coppia[0], coppia[1]) : coppia; }

  function el(tag, attr, figli) {
    var e = document.createElement(tag);
    if (attr) Object.keys(attr).forEach(function (k) {
      if (k === 'style') e.style.cssText = attr[k];
      else if (k === 'html') e.innerHTML = attr[k];
      else if (k === 'testo') e.textContent = attr[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attr[k]);
      else e.setAttribute(k, attr[k]);
    });
    (figli || []).forEach(function (f) { if (f) e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f); });
    return e;
  }

  var STILE = [
    '.bsiFX{color:#dbe6f2;font-family:var(--font,system-ui);max-width:1100px;margin:0 auto}',
    '.bsiFX-tit{font-size:1.35rem;font-weight:800;color:#e6fffb;margin:4px 0 2px}',
    '.bsiFX-sotto{font-size:.88rem;color:#9fb1c6;line-height:1.55;margin-bottom:12px}',
    '.bsiFX-schede{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px}',
    '.bsiFX-schede button{border:1px solid #1a3050;background:#0a1628;color:#c9d3df;border-radius:16px;padding:6px 12px;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit;min-height:34px}',
    '.bsiFX-schede button.on{border-color:#5eead4;color:#5eead4;background:rgba(94,234,212,.10)}',
    '.bsiFX-griglia{display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:14px;align-items:start}',
    '@media (max-width:760px){.bsiFX-griglia{grid-template-columns:minmax(0,1fr)}}',
    '.bsiFX-pannello{background:#0a1628;border:1px solid #1a3050;border-radius:10px;padding:12px;min-width:0}',
    '.bsiFX-cursore{margin:8px 0}.bsiFX-cursore label{display:flex;justify-content:space-between;gap:8px;font-size:.82rem;color:#aebccd}',
    '.bsiFX-cursore label b{color:#5eead4;font-variant-numeric:tabular-nums}',
    '.bsiFX-cursore input{width:100%;accent-color:#5eead4}',
    '.bsiFX select,.bsiFX input[type=number],.bsiFX input[type=text]{width:100%;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px 8px;font-size:.85rem;font-family:inherit;box-sizing:border-box}',
    '.bsiFX-bott{border:1px solid #5eead4;background:rgba(94,234,212,.12);color:#5eead4;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.82rem;font-family:inherit;margin:4px 4px 4px 0;min-height:34px}',
    '.bsiFX-tela{width:100%;height:auto;display:block;background:#081522;border:1px solid #1a3050;border-radius:10px;touch-action:pan-y}',
    '.bsiFX-tela.bsiFX-entra{animation:bsiFX-entra .7s cubic-bezier(.2,.7,.2,1) both}',
    '@keyframes bsiFX-entra{from{clip-path:inset(0 100% 0 0);opacity:.35}to{clip-path:inset(0 0 0 0);opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.bsiFX-tela.bsiFX-entra{animation:none}}',
    '.bsiFX-anim{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:4px 0 8px}',
    '.bsiFX-anim button{background:#0a1628;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;min-width:34px;min-height:30px;padding:0 8px;font-size:.82rem;cursor:pointer;font-family:inherit}',
    '.bsiFX-anim button[aria-pressed="true"]{border-color:#5eead4;color:#5eead4;background:rgba(94,234,212,.1)}',
    '.bsiFX-anim span{font-size:.76rem;color:#8494a8;margin-left:4px;font-variant-numeric:tabular-nums}',
    '.bsiFX-num{font-variant-numeric:tabular-nums;color:#e6fffb}',
    '.bsiFX-tab{width:100%;border-collapse:collapse;font-size:.82rem;margin-top:8px}',
    '.bsiFX-tab td,.bsiFX-tab th{border-bottom:1px solid #16263d;padding:4px 6px;text-align:right}',
    '.bsiFX-tab th{color:#9fb1c6;font-weight:700}.bsiFX-tab td:first-child,.bsiFX-tab th:first-child{text-align:left}',
    '.bsiFX-nota{font-size:.8rem;color:#9fb1c6;line-height:1.55;margin-top:8px}',
    '.bsiFX-eq{background:#081522;border:1px solid #1a3050;border-radius:8px;padding:8px 12px;margin:8px 0;font-family:"Cambria Math",Georgia,serif;color:#e6fffb;overflow-x:auto;font-size:.95rem}',
    '.bsiFX-ok{color:#5eead4}.bsiFX-ko{color:#ff8a80}'
  ].join('\n');
  function stile() {
    if (document.getElementById('bsiFX-stile')) return;
    var s = document.createElement('style'); s.id = 'bsiFX-stile'; s.textContent = STILE;
    document.head.appendChild(s);
  }

  /* ── i controlli ──────────────────────────────────────────────────────── */
  function cursore(padre, etichetta, min, max, passo, valore, cambia, formato) {
    var b = el('b', { testo: '' });
    var inp = el('input', { type: 'range', min: min, max: max, step: passo, value: valore, 'aria-label': tt(etichetta) });
    function aggiorna() { b.textContent = formato ? formato(+inp.value) : (+inp.value).toString(); }
    inp.addEventListener('input', function () { aggiorna(); cambia(+inp.value); });
    aggiorna();
    var d = el('div', { 'class': 'bsiFX-cursore' }, [el('label', null, [el('span', { testo: tt(etichetta) }), b]), inp]);
    padre.appendChild(d);
    return inp;
  }
  function scelta(padre, etichetta, voci, valore, cambia) {
    var s = el('select', { 'aria-label': tt(etichetta) });
    voci.forEach(function (v) { var o = el('option', { value: v[0], testo: tt(v[1]) }); if (v[0] === valore) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', function () { cambia(s.value); });
    padre.appendChild(el('div', { 'class': 'bsiFX-cursore' }, [el('label', null, [el('span', { testo: tt(etichetta) })]), s]));
    return s;
  }
  function bottone(padre, testo, azione) {
    var b = el('button', { 'class': 'bsiFX-bott', type: 'button', testo: tt(testo), onclick: azione });
    padre.appendChild(b); return b;
  }

  /* ── la tela e il grafico ─────────────────────────────────────────────────
     Una tela che segue la larghezza del contenitore e la densita' dei
     pixel; il grafico ha assi con tacche «belle» (1, 2, 5 × 10^n), le serie
     come linee, le barre verticali per gli spettri, i punti per i dati */
  function tela(padre, rapporto) {
    var c = el('canvas', { 'class': 'bsiFX-tela', role: 'img' });
    c._rapporto = rapporto || 0.55;
    padre.appendChild(c);
    return c;
  }
  function prepara(c) {
    var dpr = Math.min(2, globale.devicePixelRatio || 1);
    var w = Math.max(280, c.clientWidth || (c.parentNode && c.parentNode.clientWidth) || 600);
    var h = Math.round(w * c._rapporto);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0);
    q.clearRect(0, 0, w, h);
    return { q: q, w: w, h: h };
  }
  function tacche(a, b, n) {
    var span = b - a; if (!(span > 0)) return [a];
    var grezzo = span / (n || 6), mag = Math.pow(10, Math.floor(Math.log10(grezzo))), r = grezzo / mag;
    var passo = (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * mag;
    var out = [], x = Math.ceil(a / passo) * passo;
    for (; x <= b + passo * 1e-9; x += passo) out.push(Math.abs(x) < passo * 1e-9 ? 0 : x);
    return out;
  }
  function fmt(v) {
    var a = Math.abs(v);
    if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(1);
    return (+v.toPrecision(4)).toString();
  }
  /* opz: { serie:[{x,y,col,larg,tratt,etich}], barre:[{x,y,col}], punti:[{x,y,col}],
           xmin,xmax,ymin,ymax, xl, yl, invertiX, linee:[{y,col,etich}], legenda } */
  function disegna(c, opz) {
    var P = prepara(c), q = P.q, W = P.w, H = P.h;
    var m = { s: 54, d: 14, a: 14, b: 40 };
    var xs = [], ys = [];
    (opz.serie || []).forEach(function (s) { s.x.forEach(function (v) { xs.push(v); }); s.y.forEach(function (v) { if (isFinite(v)) ys.push(v); }); });
    (opz.barre || []).forEach(function (b) { xs.push(b.x); ys.push(b.y, 0); });
    (opz.punti || []).forEach(function (p) { xs.push(p.x); ys.push(p.y); });
    var xmin = opz.xmin != null ? opz.xmin : Math.min.apply(null, xs), xmax = opz.xmax != null ? opz.xmax : Math.max.apply(null, xs);
    var ymin = opz.ymin != null ? opz.ymin : Math.min.apply(null, ys), ymax = opz.ymax != null ? opz.ymax : Math.max.apply(null, ys);
    if (!(xmax > xmin)) { xmax = xmin + 1; }
    if (!(ymax > ymin)) { ymax = ymin + 1; }
    if (opz.ymin == null || opz.ymax == null) { var pad = (ymax - ymin) * 0.06; if (opz.ymin == null) ymin -= pad; if (opz.ymax == null) ymax += pad; }
    var X = function (v) { var f = (v - xmin) / (xmax - xmin); if (opz.invertiX) f = 1 - f; return m.s + f * (W - m.s - m.d); };
    var Y = function (v) { return H - m.b - (v - ymin) / (ymax - ymin) * (H - m.a - m.b); };
    q.font = '11px system-ui,sans-serif'; q.fillStyle = '#8494a8'; q.strokeStyle = '#1d2f49'; q.lineWidth = 1;
    tacche(xmin, xmax, Math.max(3, Math.round(W / 110))).forEach(function (v) {
      var x = X(v); q.beginPath(); q.moveTo(x, m.a); q.lineTo(x, H - m.b); q.stroke();
      q.textAlign = 'center'; q.fillText(fmt(v), x, H - m.b + 14);
    });
    tacche(ymin, ymax, 5).forEach(function (v) {
      var y = Y(v); q.beginPath(); q.moveTo(m.s, y); q.lineTo(W - m.d, y); q.stroke();
      q.textAlign = 'right'; q.fillText(fmt(v), m.s - 5, y + 4);
    });
    q.strokeStyle = '#34465f'; q.strokeRect(m.s, m.a, W - m.s - m.d, H - m.a - m.b);
    q.fillStyle = '#aebccd'; q.textAlign = 'center';
    if (opz.xl) q.fillText(tt(opz.xl), m.s + (W - m.s - m.d) / 2, H - 8);
    if (opz.yl) { q.save(); q.translate(12, m.a + (H - m.a - m.b) / 2); q.rotate(-Math.PI / 2); q.fillText(tt(opz.yl), 0, 0); q.restore(); }
    q.save(); q.beginPath(); q.rect(m.s, m.a, W - m.s - m.d, H - m.a - m.b); q.clip();
    (opz.linee || []).forEach(function (L) {
      q.strokeStyle = L.col || '#34465f'; q.setLineDash([4, 4]); q.beginPath(); q.moveTo(m.s, Y(L.y)); q.lineTo(W - m.d, Y(L.y)); q.stroke(); q.setLineDash([]);
      if (L.etich) { q.fillStyle = L.col || '#8494a8'; q.textAlign = 'left'; q.fillText(L.etich, m.s + 4, Y(L.y) - 3); }
    });
    (opz.barre || []).forEach(function (b) {
      q.strokeStyle = b.col || '#5eead4'; q.lineWidth = b.larg || 1.5; q.beginPath(); q.moveTo(X(b.x), Y(Math.max(ymin, 0))); q.lineTo(X(b.x), Y(b.y)); q.stroke();
    });
    (opz.serie || []).forEach(function (s) {
      q.strokeStyle = s.col || '#5eead4'; q.lineWidth = s.larg || 2; q.setLineDash(s.tratt ? [5, 4] : []);
      q.beginPath(); var su = false;
      for (var i = 0; i < s.x.length; i++) {
        if (!isFinite(s.y[i])) { su = false; continue; }
        var px = X(s.x[i]), py = Y(s.y[i]);
        if (!su) { q.moveTo(px, py); su = true; } else q.lineTo(px, py);
      }
      q.stroke(); q.setLineDash([]);
      if (s.riempi) { q.lineTo(X(s.x[s.x.length - 1]), Y(Math.max(ymin, 0))); q.lineTo(X(s.x[0]), Y(Math.max(ymin, 0))); q.closePath(); q.fillStyle = s.riempi; q.fill(); }
    });
    (opz.punti || []).forEach(function (p) { q.fillStyle = p.col || '#ffd24a'; q.beginPath(); q.arc(X(p.x), Y(p.y), p.r || 3, 0, Math.PI * 2); q.fill(); });
    q.restore();
    if (opz.legenda) {
      var ly = m.a + 14, lx = W - m.d - 8; q.textAlign = 'right';
      opz.legenda.forEach(function (L) { q.fillStyle = L.col; q.fillRect(lx - 10, ly - 8, 10, 3); q.fillStyle = '#c9d3df'; q.fillText(tt(L.etich), lx - 14, ly - 3); ly += 15; });
    }
    c.setAttribute('aria-label', tt(opz.descr || opz.yl || ['grafico', 'chart']));
    return { X: X, Y: Y, q: q, W: W, H: H, m: m, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
  }

  /* ── il grafico che si muove ──────────────────────────────────────────────
     Tre cose, per tutti i grafici delle sezioni insieme:
     · la prima volta il grafico ENTRA da sinistra (una maschera CSS: i pixel
       sono gia' tutti disegnati, si scopre solo la vista);
     · quando i dati cambiano (un pulsante, un menu, un passo del cursore) le
       curve e gli assi SCIVOLANO dai valori vecchi ai nuovi in 0,3 s, invece
       di saltare. Se le chiamate arrivano a raffica (un cursore trascinato,
       una simulazione) si disegna subito, senza inseguire: un grafico che
       insegue in ritardo mostrerebbe valori che non sono piu' quelli;
     · passando con il mouse o con il dito compare un MIRINO con il valore di
       ogni curva in quel punto.
     Molti moduli, dopo F.grafico, disegnano altro sopra con il contesto che
     ricevono (punti critici, frecce, etichette). Per non perderlo durante
     l'animazione il contesto restituito e' un registratore: le istruzioni
     date subito dopo la chiamata vengono ripetute a ogni fotogramma.
     Chi ha chiesto meno movimento nel sistema operativo non vede animazioni. */
  var MENO_MOTO = false;
  try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  var RAF = globale.requestAnimationFrame ? function (f) { return globale.requestAnimationFrame(f); } : function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
  var NO_RAF = globale.cancelAnimationFrame ? function (h) { globale.cancelAnimationFrame(h); } : clearTimeout;
  var DURATA = 300;
  function adesso() { return globale.performance && performance.now ? performance.now() : Date.now(); }
  function registratore(q, ops) {
    if (typeof Proxy === 'undefined') return q;
    return new Proxy(q, {
      get: function (o, n) { var v = o[n]; if (typeof v !== 'function') return v; return function () { var a = [].slice.call(arguments); if (ops.attivo) ops.push([0, n, a]); return v.apply(o, a); }; },
      set: function (o, n, v) { if (ops.attivo) ops.push([1, n, v]); o[n] = v; return true; }
    });
  }
  function ripeti(q, ops) { for (var i = 0; i < ops.length; i++) { var x = ops[i]; if (x[0]) q[x[1]] = x[2]; else q[x[1]].apply(q, x[2]); } }
  function forma(opz) { return (opz.serie || []).map(function (s) { return s.y.length; }).join(',') + '|' + (opz.barre || []).length + '|' + (opz.punti || []).length; }
  function mescola(a, b, f) { return isFinite(a) && isFinite(b) ? a + (b - a) * f : b; }
  function intermedio(da, a, f) {
    var o = {}; for (var k in a) o[k] = a[k];
    o.serie = (a.serie || []).map(function (s, i) { var p = da.opz.serie[i], n = {}; for (var k in s) n[k] = s[k]; n.y = s.y.map(function (v, j) { return mescola(p.y[j], v, f); }); n.x = s.x.map(function (v, j) { return mescola(p.x[j], v, f); }); return n; });
    o.barre = (a.barre || []).map(function (b, i) { var p = da.opz.barre[i], n = {}; for (var k in b) n[k] = b[k]; n.x = mescola(p.x, b.x, f); n.y = mescola(p.y, b.y, f); return n; });
    o.punti = (a.punti || []).map(function (b, i) { var p = da.opz.punti[i], n = {}; for (var k in b) n[k] = b[k]; n.x = mescola(p.x, b.x, f); n.y = mescola(p.y, b.y, f); return n; });
    o.xmin = mescola(da.P.xmin, a._P.xmin, f); o.xmax = mescola(da.P.xmax, a._P.xmax, f); o.ymin = mescola(da.P.ymin, a._P.ymin, f); o.ymax = mescola(da.P.ymax, a._P.ymax, f);
    return o;
  }
  function copiaDati(opz) {
    return { serie: (opz.serie || []).map(function (s) { return { x: s.x.slice(), y: s.y.slice() }; }), barre: (opz.barre || []).map(function (b) { return { x: b.x, y: b.y }; }), punti: (opz.punti || []).map(function (b) { return { x: b.x, y: b.y }; }) };
  }
  function grafico(c, opz) {
    var st = c._bsiG || (c._bsiG = { ultimo: null, ops: [], t: 0, rapido: 0 });
    if (st.anim) { NO_RAF(st.anim); st.anim = null; }
    var t0 = adesso(), raffica = t0 - st.t < 160; st.t = t0;
    st.rapido = raffica ? st.rapido + 1 : 0;
    var prima = st.ultimo;
    var P = disegna(c, opz);
    st.snap = null;
    var ops = []; ops.attivo = true; st.ops = ops;
    var proxy = registratore(P.q, ops);
    var finale = { opz: copiaDati(opz), P: { xmin: P.xmin, xmax: P.xmax, ymin: P.ymin, ymax: P.ymax }, forma: forma(opz) };
    st.ultimo = finale; st.opz = opz; st.P = P;
    attivaMirino(c, st);
    /* la prima volta: entra */
    if (!prima && !MENO_MOTO && !c._bsiEntrato) { c._bsiEntrato = true; c.classList.add('bsiFX-entra'); }
    /* le volte dopo: scivola, se la forma dei dati e' la stessa e qualcosa e' cambiato */
    var muovi = prima && !MENO_MOTO && !raffica && st.rapido === 0 && prima.forma === finale.forma && (opz.serie || []).length + (opz.barre || []).length + (opz.punti || []).length > 0 &&
      JSON.stringify(prima.opz) !== JSON.stringify(finale.opz) && c.offsetParent !== null;
    var chiudi = function () { ops.attivo = false; };
    if (!muovi) { (globale.queueMicrotask || function (f) { Promise.resolve().then(f); })(chiudi); return { X: P.X, Y: P.Y, q: proxy, W: P.W, H: P.H }; }
    var opzA = {}; for (var k in opz) opzA[k] = opz[k]; opzA._P = finale.P;
    function fotogramma(f) {
      try { disegna(c, f >= 1 ? opz : intermedio(prima, opzA, f)); ripeti(c.getContext('2d'), ops); }
      catch (e) { st.anim = null; disegna(c, opz); try { ripeti(c.getContext('2d'), ops); } catch (e2) { } return false; }
      return true;
    }
    (globale.queueMicrotask || function (f) { Promise.resolve().then(f); })(function () {
      chiudi();
      if (st.ops !== ops) return;
      if (!fotogramma(0)) return;
      var inizio = adesso();
      (function passo() {
        st.anim = RAF(function () {
          if (st.ops !== ops) return;
          var f = Math.min(1, (adesso() - inizio) / DURATA), e = 1 - Math.pow(1 - f, 3);
          if (!fotogramma(f >= 1 ? 1 : e)) return;
          if (f < 1) passo(); else { st.anim = null; st.snap = null; }
        });
      })();
    });
    return { X: P.X, Y: P.Y, q: proxy, W: P.W, H: P.H };
  }

  /* il mirino: si salva l'immagine del grafico finito e ci si disegna sopra */
  function attivaMirino(c, st) {
    if (c._bsiMirino || !c.addEventListener) return;
    c._bsiMirino = true;
    function ripristina() { if (st.snap) { try { c.getContext('2d').putImageData(st.snap, 0, 0); } catch (e) { } } }
    function muovi(ev) {
      if (st.anim || !st.P || !st.opz) return;
      var opz = st.opz, P = st.P, serie = (opz.serie || []).filter(function (s) { return s.x.length > 1 && !s.nascondiMirino; });
      if (!serie.length && !(opz.barre || []).length) return;
      var r = c.getBoundingClientRect(); if (!r.width) return;
      var px = (ev.clientX - r.left) * (P.W / r.width), m = P.m;
      if (px < m.s || px > P.W - m.d) { ripristina(); return; }
      var q = c.getContext('2d'), dpr = c.width / P.W;
      if (!st.snap) { try { q.setTransform(1, 0, 0, 1, 0, 0); st.snap = q.getImageData(0, 0, c.width, c.height); } catch (e) { return; } }
      q.setTransform(1, 0, 0, 1, 0, 0); q.putImageData(st.snap, 0, 0); q.setTransform(dpr, 0, 0, dpr, 0, 0);
      var fr = (px - m.s) / (P.W - m.s - m.d); if (opz.invertiX) fr = 1 - fr;
      var xv = P.xmin + fr * (P.xmax - P.xmin), righe = [], H = P.H;
      q.save(); q.strokeStyle = 'rgba(230,255,251,.45)'; q.setLineDash([3, 3]); q.lineWidth = 1;
      q.beginPath(); q.moveTo(px, m.a); q.lineTo(px, H - m.b); q.stroke(); q.setLineDash([]);
      serie.forEach(function (s, k) {
        var mi = -1, md = Infinity;
        for (var i = 0; i < s.x.length; i++) { var d = Math.abs(s.x[i] - xv); if (d < md && isFinite(s.y[i])) { md = d; mi = i; } }
        if (mi < 0) return;
        var yv = s.y[mi], X = P.X(s.x[mi]), Y = P.Y(yv);
        if (Y < m.a - 2 || Y > H - m.b + 2) return;
        q.fillStyle = s.col || '#5eead4'; q.beginPath(); q.arc(X, Y, 4, 0, Math.PI * 2); q.fill(); q.strokeStyle = '#081522'; q.lineWidth = 1.5; q.stroke();
        var nome = s.etich ? tt(s.etich) : (opz.legenda && opz.legenda[k] ? tt(opz.legenda[k].etich) : (serie.length > 1 ? '#' + (k + 1) : (opz.yl ? tt(opz.yl).split(' ')[0] : 'y')));
        righe.push([s.col || '#5eead4', nome + ' = ' + fmt(yv)]);
      });
      if (!serie.length) {
        var mb = null, mdb = Infinity; (opz.barre || []).forEach(function (b) { var d = Math.abs(P.X(b.x) - px); if (d < mdb) { mdb = d; mb = b; } });
        if (mb && mdb < 12) { righe.push([mb.col || '#5eead4', fmt(mb.x) + ' → ' + fmt(mb.y)]); xv = mb.x; }
      }
      var testa = (opz.xl ? tt(opz.xl).split(' (')[0].split(' ')[0] : 'x') + ' = ' + fmt(xv);
      righe.unshift(['#e6fffb', testa]);
      q.font = '11px system-ui,sans-serif';
      var w = 0; righe.forEach(function (r) { w = Math.max(w, q.measureText(r[1]).width); }); w += 18;
      var h = righe.length * 15 + 8, bx = px + 10 + w > P.W - m.d ? px - 10 - w : px + 10, by = m.a + 6;
      q.fillStyle = 'rgba(8,21,34,.92)'; q.strokeStyle = '#2a4a6e'; q.lineWidth = 1; q.beginPath(); q.rect(bx, by, w, h); q.fill(); q.stroke();
      q.textAlign = 'left';
      righe.forEach(function (r, i) { q.fillStyle = r[0]; if (i) q.fillRect(bx + 6, by + 11 + i * 15 - 4, 6, 3); q.fillStyle = i ? '#e6fffb' : '#9fb1c6'; q.fillText(r[1], bx + (i ? 15 : 6), by + 14 + i * 15); });
      q.restore();
    }
    c.addEventListener('pointermove', muovi);
    c.addEventListener('pointerdown', muovi);
    c.addEventListener('pointerleave', ripristina);
  }

  /* ── la sezione: intestazione e schede ─────────────────────────────────── */
  function costruisci(id) {
    var d = sezioni[id], sec = document.getElementById(id);
    if (!d || !sec) return false;
    if (sec.dataset.bsiFx === '1') { (d.ridisegna || []).forEach(function (f) { try { f(); } catch (e) {} }); return true; }
    stile();
    sec.innerHTML = '';
    var radice = el('div', { 'class': 'bsiFX' });
    radice.appendChild(el('div', { 'class': 'section-title bsiFX-tit', testo: tt(d.titolo) }));
    if (d.sotto) radice.appendChild(el('div', { 'class': 'bsiFX-sotto', testo: tt(d.sotto) }));
    var barra = el('div', { 'class': 'bsiFX-schede', role: 'tablist' }), corpo = el('div');
    radice.appendChild(barra); radice.appendChild(corpo);
    var costruite = {};
    d.ridisegna = [];
    function mostra(k) {
      [].forEach.call(barra.children, function (b, i) { b.classList.toggle('on', i === k); b.setAttribute('aria-selected', i === k ? 'true' : 'false'); });
      Object.keys(costruite).forEach(function (j) { costruite[j].style.display = +j === k ? '' : 'none'; });
      if (!costruite[k]) {
        var div = el('div', { role: 'tabpanel' }); corpo.appendChild(div); costruite[k] = div;
        try { d.schede[k].costruisci(div, function (f) { d.ridisegna.push(f); }); }
        catch (e) { div.textContent = '⚠ ' + (e && e.message || e); if (globale.console) console.error(e); }
      }
      (costruite[k]._ridisegna || []).forEach(function (f) { f(); });
      setTimeout(function () { globale.dispatchEvent(new Event('resize')); }, 30);
    }
    d.schede.forEach(function (s, k) {
      barra.appendChild(el('button', { type: 'button', role: 'tab', testo: tt(s.nome), onclick: function () { mostra(k); } }));
    });
    sec.appendChild(radice);
    sec.dataset.bsiFx = '1';
    mostra(0);
    return true;
  }
  /* i grafici si ridisegnano quando cambia la larghezza */
  var ridis = [];
  function alRidimensiona(f) { ridis.push(f); }
  var tR = null;
  globale.addEventListener('resize', function () {
    clearTimeout(tR); tR = setTimeout(function () { ridis.forEach(function (f) { try { f(); } catch (e) {} }); }, 80);
  });

  /* ── il motore delle animazioni ───────────────────────────────────────────
     Tutte le simulazioni passano di qui, cosi' si comportano allo stesso modo:
     · una barra sotto la tela: ⏸/▶ pausa, ↺ ricomincia (se il modulo sa
       ricominciare), velocita' ×¼ … ×4, e il tempo trascorso;
     · il passo riceve dt in secondi gia' moltiplicato per la velocita', e mai
       piu' di 1/20 s: se il telefono perde fotogrammi la fisica non salta;
     · si ferma quando la tela esce dallo schermo, quando la scheda o la
       finestra non sono visibili, quando la tela viene tolta dalla pagina; e
       riparte da sola quando torna visibile. Prima, molti cicli giravano anche
       nascosti, consumando batteria;
     · con «riduci movimento» attivo nel sistema parte in pausa (il primo
       fotogramma e' comunque disegnato) e si avvia con ▶;
     · il passo puo' restituire false per dire «ho finito»: la barra mostra ▶
       e un clic ricomincia.
     WCAG 2.2.2: ogni contenuto che si muove per piu' di 5 s si puo' fermare. */
  var animazioni = [];
  function anima(c, passo, opz) {
    opz = opz || {};
    var A = { inPausa: false, finita: false, velocita: 1, tempo: 0, visibile: true, giro: null, prec: 0 };
    var barra = null, bP = null, eT = null;
    if (opz.controlli !== false && c && c.parentNode) {
      barra = el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': tt(['Controlli dell’animazione', 'Animation controls']) });
      bP = el('button', { type: 'button', onclick: function () { if (A.finita) { if (opz.ricomincia) opz.ricomincia(); A.finita = false; A.tempo = 0; A.inPausa = false; } else A.inPausa = !A.inPausa; aggiorna(); avvia(); } });
      barra.appendChild(bP);
      if (opz.ricomincia) barra.appendChild(el('button', { type: 'button', testo: '↺', title: tt(['Ricomincia', 'Restart']), 'aria-label': tt(['Ricomincia', 'Restart']), onclick: function () { opz.ricomincia(); A.finita = false; A.tempo = 0; A.inPausa = false; aggiorna(); avvia(); } }));
      var vel = [];
      [0.25, 0.5, 1, 2, 4].forEach(function (v) { var b = el('button', { type: 'button', testo: '×' + (v === 0.25 ? '¼' : v === 0.5 ? '½' : v), title: tt(['Velocità ', 'Speed ']) + v, 'aria-label': tt(['Velocità ', 'Speed ']) + v, onclick: function () { A.velocita = v; vel.forEach(function (x) { x[1].setAttribute('aria-pressed', String(x[0] === v)); }); } }); b.setAttribute('aria-pressed', String(v === 1)); vel.push([v, b]); barra.appendChild(b); });
      eT = el('span'); barra.appendChild(eT);
      c.parentNode.insertBefore(barra, c.nextSibling);
    }
    function aggiorna() {
      if (!bP) return;
      var gira = !A.inPausa && !A.finita;
      bP.textContent = gira ? '❚❚' : '▶';
      var nome = tt(gira ? ['Pausa', 'Pause'] : A.finita ? ['Ricomincia', 'Restart'] : ['Avvia', 'Play']);
      bP.title = nome; bP.setAttribute('aria-label', nome);
    }
    function puoGirare() { return !A.inPausa && !A.finita && A.visibile && c.isConnected && c.offsetParent !== null && !(document.hidden); }
    function giro(ora) {
      A.giro = null;
      if (!puoGirare()) { A.prec = 0; primo(); return; }
      var dt = A.prec ? Math.min(0.05, (ora - A.prec) / 1000) : 1 / 60; A.prec = ora;
      var d = dt * A.velocita; A.tempo += d;
      var r;
      A.disegnato = true;
      try { r = passo(d, A.tempo); } catch (e) { A.finita = true; aggiorna(); if (globale.console) console.error(e); return; }
      if (eT) eT.textContent = 't = ' + A.tempo.toFixed(1) + ' s';
      if (r === false) { A.finita = true; aggiorna(); return; }
      A.giro = globale.requestAnimationFrame(giro);
    }
    function avvia() { if (A.giro || !puoGirare()) return; A.prec = 0; A.giro = globale.requestAnimationFrame(giro); }
    if (globale.IntersectionObserver && c) { new IntersectionObserver(function (v) { A.visibile = v[0].isIntersecting; if (A.visibile) avvia(); }).observe(c); }
    var MENO = false; try { MENO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
    if (MENO && opz.rispettaMovimento !== false) { A.inPausa = true; A.disegnato = true; try { passo(0, 0); } catch (e) { } }
    aggiorna();
    avvia();
    /* se parte fuori schermo (o nascosta) il primo fotogramma si disegna comunque: chi scorre fino a li' non trova una tela vuota */
    function primo() { if (A.disegnato || !c.isConnected) return; A.disegnato = true; try { if (passo(0, 0) === false) { A.finita = true; aggiorna(); } } catch (e) { } }
    if (!A.giro) primo();
    var ctl = { pausa: function () { A.inPausa = true; aggiorna(); }, riprendi: function () { A.inPausa = false; A.finita = false; aggiorna(); avvia(); }, ferma: function () { A.finita = true; aggiorna(); }, sveglia: function () { if (A.finita) { A.finita = false; A.tempo = 0; } aggiorna(); avvia(); }, stato: function () { return { pausa: A.inPausa, finita: A.finita, velocita: A.velocita, tempo: A.tempo, gira: !!A.giro }; }, barra: barra };
    animazioni.push(ctl);
    return ctl;
  }
  /* quando la pagina torna visibile, le animazioni ferme per visibilita' ripartono */
  if (globale.document && document.addEventListener) document.addEventListener('visibilitychange', function () { if (!document.hidden) animazioni.forEach(function (a) { var s = a.stato(); if (!s.pausa && !s.finita) a.riprendi(); }); });
  /* il pennello: una tela pulita della dimensione giusta, per chi disegna da se' */
  function pennello(c) {
    var dpr = Math.min(2, globale.devicePixelRatio || 1), w = Math.max(280, c.clientWidth || (c.parentNode && c.parentNode.clientWidth) || 600), h = Math.round(w * c._rapporto);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.fillStyle = '#081522'; q.fillRect(0, 0, w, h);
    return { q: q, W: w, H: h };
  }

  globale.BSIFisica = {
    sezione: function (id, d) { sezioni[id] = d; },
    apri: function (id) { return sezioni[id] ? costruisci(id) : false; },
    sezioni: function () { return Object.keys(sezioni); },
    calcolo: calcolo,
    t: t, tt: tt, el: el, cursore: cursore, scelta: scelta, bottone: bottone,
    tela: tela, grafico: grafico, fmt: fmt, alRidimensiona: alRidimensiona, anima: anima, pennello: pennello, animazioni: function () { return animazioni.length; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
