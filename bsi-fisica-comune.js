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
  function grafico(c, opz) {
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
    return { X: X, Y: Y, q: q, W: W, H: H };
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

  globale.BSIFisica = {
    sezione: function (id, d) { sezioni[id] = d; },
    apri: function (id) { return sezioni[id] ? costruisci(id) : false; },
    sezioni: function () { return Object.keys(sezioni); },
    calcolo: calcolo,
    t: t, tt: tt, el: el, cursore: cursore, scelta: scelta, bottone: bottone,
    tela: tela, grafico: grafico, fmt: fmt, alRidimensiona: alRidimensiona
  };
})(typeof window !== 'undefined' ? window : globalThis);
