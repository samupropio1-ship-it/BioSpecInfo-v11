/* ═══════════════════════════════════════════════════════════════════════
   bsi-spectra-cervello.js — la rete neurale di Spectra disegnata come un cervello (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   L'autore ha mostrato come vuole la rete neurale: regioni di un cervello
   viste di lato, nuvole di punti colorate per regione, etichette con la
   percentuale, sinapsi bianche che passano dall'area di associazione, un
   quadro in alto con i conteggi, «LIVE», lo stadio di sviluppo e le barre
   dei neuromodulatori. Qui c'è quella forma, con i DATI VERI di Spectra:
   · ogni neurone luminoso è un ricordo, una conversazione, un impegno, una
     sezione studiata, una procedura (gli stessi del grafo di sempre);
   · le sinapsi sono i collegamenti calcolati fra ricordi (parole in comune,
     livelli della memoria), e passano per l'area di associazione;
   · la percentuale di ogni regione è la quota dei neuroni che contiene;
   · le barre sono lo stato interno di Spectra (curiosità, attenzione,
     premura, umore, legame: bsi-spectra-mente.js), non neuromodulatori;
   · lo stadio dipende da quanti ricordi ha (nascente, giovane, adulta).
   I puntini tenui attorno ai neuroni sono decorativi e lo si dichiara: la
   loro densità cresce con i ricordi della regione. Le regioni sono un modo
   di disporre la memoria di Spectra, non un cervello: Spectra è un programma.

   API: BSISpectraCervello.anima(tela, grafoConStruttura, opz) → { ferma, scegli(x, y), neuroni(), regioni() }
   (la stessa forma di animaRete in bsi-spectra-risveglio.js, che lo usa quando c'è).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var D = g.document;
  if (!D) return;
  function t(it, en) { return (g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() === 'en') ? en : it; }
  function leggiJSON(k, d) { try { var x = JSON.parse(g.localStorage.getItem(k) || 'null'); return x == null ? d : x; } catch (e) { return d; } }

  /* le regioni: centro e semiassi in frazioni della tela (vista di lato, la fronte a sinistra), colore come nel riferimento */
  var REGIONI = [
    { id: 'controllo', nome: ['CONTROLLO', 'META CONTROL'], x: 0.47, y: 0.25, rx: 0.12, ry: 0.07, col: [236, 226, 255] },
    { id: 'lavoro', nome: ['MEMORIA DI LAVORO', 'WORKING MEMORY'], x: 0.27, y: 0.32, rx: 0.09, ry: 0.06, col: [214, 164, 255] },
    { id: 'previsione', nome: ['PREVISIONE', 'PREDICTIVE'], x: 0.17, y: 0.41, rx: 0.08, ry: 0.07, col: [196, 150, 255] },
    { id: 'azione', nome: ['AZIONE', 'MOTOR CORTEX'], x: 0.31, y: 0.45, rx: 0.08, ry: 0.06, col: [128, 226, 160] },
    { id: 'associazione', nome: ['ASSOCIAZIONE', 'ASSOCIATION'], x: 0.48, y: 0.47, rx: 0.12, ry: 0.12, col: [255, 255, 255] },
    { id: 'percezione', nome: ['PERCEZIONE', 'SENSORY CORTEX'], x: 0.73, y: 0.38, rx: 0.12, ry: 0.10, col: [96, 214, 210] },
    { id: 'caratteristiche', nome: ['CARATTERISTICHE', 'FEATURE LAYER'], x: 0.66, y: 0.53, rx: 0.09, ry: 0.07, col: [110, 224, 214] },
    { id: 'concetti', nome: ['CONCETTI', 'CONCEPT LAYER'], x: 0.44, y: 0.63, rx: 0.11, ry: 0.075, col: [206, 216, 236] },
    { id: 'cervelletto', nome: ['CERVELLETTO · PROCEDURE', 'CEREBELLUM'], x: 0.74, y: 0.71, rx: 0.12, ry: 0.08, col: [232, 214, 106] },
    { id: 'riflessi', nome: ['RIFLESSI', 'REFLEX ARC'], x: 0.40, y: 0.77, rx: 0.07, ry: 0.05, col: [255, 206, 120] },
    { id: 'tronco', nome: ['TRONCO · NUCLEO', 'BRAINSTEM'], x: 0.48, y: 0.85, rx: 0.035, ry: 0.11, col: [255, 120, 92] }
  ];
  var PER_ID = {}; REGIONI.forEach(function (r) { PER_ID[r.id] = r; });
  /* i nove neuroni di struttura (ordine di conStruttura) e i tipi di ricordo → regione */
  var STRUTTURA = ['tronco', 'lavoro', 'percezione', 'concetti', 'cervelletto', 'controllo', 'caratteristiche', 'caratteristiche', 'caratteristiche'];
  var TIPO = { conversazione: 'percezione', ricordo: 'concetti', impegno: 'previsione', sezione: 'caratteristiche', procedura: 'cervelletto', autobiografia: 'controllo' };
  /** la regione di ogni neurone: le sei conversazioni più recenti stanno nella memoria di lavoro */
  function assegna(N) {
    var conv = N.map(function (n, i) { return n.tipo === 'conversazione' ? i : -1; }).filter(function (i) { return i >= 0; }), recenti = {};
    conv.slice(-6).forEach(function (i) { recenti[i] = 1; });
    var k = 0;
    return N.map(function (n, i) { if (n.struttura) return STRUTTURA[k++] || 'associazione'; if (recenti[i]) return 'lavoro'; return TIPO[n.tipo] || 'associazione'; });
  }
  function stadio(n) { return n < 20 ? ['NASCENTE', 'NASCENT'] : n < 150 ? ['GIOVANE', 'JUVENILE'] : ['ADULTA', 'MATURE']; }
  function statoInterno() {
    var s = (leggiJSON('bsi-spectra-mente-v1', {}) || {}).stato || {};
    return [['CUR', s.curiosita], ['ATT', s.attenzione], ['PRE', s.premura], ['UMO', s.umore], ['LEG', s.legame]].map(function (x) { return [x[0], typeof x[1] === 'number' ? Math.max(0, Math.min(1, x[1])) : 0]; });
  }
  function vivo() { try { var L = g.BSISpectraLive; return !!(L && L.sentinella && L.sentinella.attiva && L.sentinella.attiva()); } catch (e) { return false; } }

  function anima(tela, G, opz) {
    opz = opz || {};
    var ctx = tela.getContext('2d'), N = G.neuroni, L = G.collegamenti, W = 0, H = 0, dpr = Math.min(2, g.devicePixelRatio || 1), raf = 0, fermo = false;
    var calmo = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var seme = 11; function rnd() { seme = (seme * 16807) % 2147483647; return seme / 2147483647; }
    function gauss() { var u = rnd() || 1e-9, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    var reg = assegna(N), conta = {}; REGIONI.forEach(function (r) { conta[r.id] = 0; }); reg.forEach(function (r) { conta[r]++; });
    /* posizioni dei neuroni dentro la loro regione (frazioni), deterministiche */
    N.forEach(function (n, i) { var r = PER_ID[reg[i]], a = rnd() * 2 * Math.PI, d = Math.sqrt(rnd()) * 0.85; n.u = r.x + Math.cos(a) * r.rx * d; n.v = r.y + Math.sin(a) * r.ry * d; n.regione = r.id; n.fase = rnd() * 6.28; });
    /* i puntini decorativi: densità ∝ (1 + neuroni della regione), con un tetto */
    var deco = []; REGIONI.forEach(function (r) { var q = Math.min(1600, 260 + conta[r.id] * 90); for (var k = 0; k < q; k++) deco.push([r.x + gauss() * r.rx * 0.55, r.y + gauss() * r.ry * 0.55, r]); });
    for (var k2 = 0; k2 < 260; k2++) deco.push([0.08 + rnd() * 0.84, 0.12 + rnd() * 0.84, null]);      /* polvere sparsa attorno */
    var fondo = null, scelto = -1, passo = 0, impulsi = [], scala = 1, pad = { x: 0, y: 0, w: 1, h: 1 };
    function misura() {
      var r = tela.getBoundingClientRect(); W = Math.max(50, r.width); H = Math.max(50, r.height);
      tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* il cervello occupa un riquadro con le proporzioni del riferimento (più alto che largo sul telefono) */
      var top = Math.min(118, H * 0.2), wB = Math.min(W - 8, (H - top) * 1.25), hB = Math.min(H - top - 4, W < 520 ? wB * 1.45 : wB / 0.9);   /* sul telefono il cervello si allunga in verticale e riempie la tela */
      pad = { x: (W - wB) / 2, y: top, w: wB, h: hB }; scala = Math.max(0.6, Math.min(1.2, wB / 600)); fondo = null;
    }
    function X(u) { return pad.x + u * pad.w; } function Y(v) { return pad.y + v * pad.h; }
    function preparaFondo() {
      var c = D.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0);
      var gr = q.createRadialGradient(W * 0.5, H * 0.55, 10, W * 0.5, H * 0.55, Math.max(W, H) * 0.7); gr.addColorStop(0, '#2c3b5e'); gr.addColorStop(1, '#1a2238'); q.fillStyle = gr; q.fillRect(0, 0, W, H);
      /* la sagoma del cervello, appena accennata */
      var al = q.createRadialGradient(X(0.48), Y(0.5), 0, X(0.48), Y(0.5), pad.w * 0.5); al.addColorStop(0, 'rgba(90,130,220,.16)'); al.addColorStop(1, 'rgba(90,130,220,0)'); q.fillStyle = al; q.fillRect(0, 0, W, H);   /* un alone, non un contorno */
      q.globalCompositeOperation = 'lighter';
      deco.forEach(function (p) { var c2 = p[2] ? p[2].col : [190, 205, 235], a = p[2] ? 0.35 : 0.22; q.fillStyle = 'rgba(' + c2[0] + ',' + c2[1] + ',' + c2[2] + ',' + (p[2] ? 0.42 : 0.22) + ')'; var s = (p[2] ? 1.9 : 1.3) * scala; q.fillRect(X(p[0]) - s / 2, Y(p[1]) - s / 2, s, s); });
      q.globalCompositeOperation = 'source-over';
      fondo = c;
    }
    function curva(q, a, b) {
      /* la sinapsi passa vicino all'area di associazione: controllo della quadratica fra il punto medio e il centro */
      var A2 = PER_ID.associazione, mx = (a.u + b.u) / 2, my = (a.v + b.v) / 2, cx = mx * 0.45 + A2.x * 0.55, cy = my * 0.45 + A2.y * 0.55;
      q.moveTo(X(a.u), Y(a.v)); q.quadraticCurveTo(X(cx), Y(cy), X(b.u), Y(b.v)); return [cx, cy];
    }
    function puntoCurva(a, b, c, s) { var m = 1 - s; return [m * m * a.u + 2 * m * s * c[0] + s * s * b.u, m * m * a.v + 2 * m * s * c[1] + s * s * b.v]; }
    function disegna() {
      if (!fondo) preparaFondo();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(fondo, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* sinapsi */
      ctx.globalCompositeOperation = 'lighter';
      L.forEach(function (l, i) {
        var a = N[l.a], b = N[l.b], acceso = scelto === l.a || scelto === l.b;
        ctx.strokeStyle = acceso ? 'rgba(255,255,255,.85)' : 'rgba(225,235,255,' + Math.min(0.32, 0.08 + 0.05 * l.f) + ')'; ctx.lineWidth = acceso ? 1.4 : 0.8;
        ctx.beginPath(); l._c = curva(ctx, a, b); ctx.stroke();
      });
      /* impulsi che corrono lungo le sinapsi */
      if (!calmo && !opz.sfondo && L.length) { if (passo % 6 === 0) impulsi.push({ l: L[Math.floor(rnd() * L.length)], s: 0, dir: rnd() < 0.5 }); }
      impulsi = impulsi.filter(function (p) { p.s += 0.018; if (p.s > 1) return false; var l = p.l, a = N[p.dir ? l.a : l.b], b = N[p.dir ? l.b : l.a], q2 = puntoCurva(a, b, l._c || [0.48, 0.47], p.s); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(X(q2[0]), Y(q2[1]), 1.8 * scala, 0, 6.2832); ctx.fill(); return true; });
      /* neuroni: i ricordi veri, più grandi e luminosi della polvere */
      N.forEach(function (n, i) {
        var r = PER_ID[n.regione], c = r.col, pul = calmo ? 1 : 0.75 + 0.25 * Math.sin(passo * 0.05 + n.fase), affollo = 1 / Math.sqrt(Math.max(1, conta[n.regione] / 8)), rr = ((n.struttura ? 3.6 : 2.4) + Math.min(3, (n.peso || 0) * 0.35)) * scala * (n.struttura ? 1 : affollo) + (i === scelto ? 3 : 0);   /* regioni affollate: neuroni più piccoli, niente macchia unica */
        var gr = ctx.createRadialGradient(X(n.u), Y(n.v), 0, X(n.u), Y(n.v), rr * 3.2); gr.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.95 * pul) + ')'); gr.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X(n.u), Y(n.v), rr * 3.2, 0, 6.2832); ctx.fill();
        ctx.fillStyle = i === scelto ? '#fff' : 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(X(n.u), Y(n.v), rr * 0.45, 0, 6.2832); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      if (opz.sfondo) return;
      /* etichette delle regioni con la percentuale */
      var tot = N.length || 1, fs = Math.max(8.5, Math.min(11, 10 * scala));
      ctx.font = '600 ' + fs + 'px ui-monospace,SFMono-Regular,Menlo,monospace'; ctx.textBaseline = 'middle';
      REGIONI.forEach(function (r) {
        var nome = t(r.nome[0], r.nome[1]), pc = (conta[r.id] / tot * 100).toFixed(1) + '%', w1 = ctx.measureText(nome + ' ').width, w2 = ctx.measureText(pc).width, w = w1 + w2 + 14, h = fs + 9;
        var x = Math.max(4, Math.min(W - w - 4, X(r.x) - w / 2)), y = Math.max(pad.y - 4, Math.min(H - h - 4, Y(r.y) - h / 2));
        ctx.fillStyle = 'rgba(14,20,34,.82)'; ctx.strokeStyle = 'rgba(160,180,220,.25)'; ctx.lineWidth = 1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e4ebf8'; ctx.fillText(nome, x + 7, y + h / 2 + 0.5); ctx.fillStyle = 'rgba(160,175,205,.75)'; ctx.fillText(pc, x + 7 + w1, y + h / 2 + 0.5);
      });
      /* il quadro in alto: conteggi veri, stadio, stato interno */
      var M = leggiJSON('bsi-spectra-mente-v1', {}) || {}, ricordi = N.filter(function (n) { return !n.struttura; }).length, x0 = 12, y0 = 18, lh = 17;
      ctx.font = '700 ' + Math.max(12, 14 * Math.min(1, scala)) + 'px ui-monospace,Menlo,monospace'; ctx.fillStyle = '#5aa8ff'; ctx.textBaseline = 'alphabetic'; ctx.fillText(t('SPECTRA · ATTIVITÀ NEURALE', 'SPECTRA · NEURAL ACTIVITY'), x0, y0);
      ctx.font = '500 11px ui-monospace,Menlo,monospace';
      [[t('Neuroni', 'Neurons'), N.length], [t('Sinapsi', 'Synapses'), L.length], [t('Turni', 'Sessions'), M.sessioni || 0], [t('Memoria', 'Memory'), ricordi + t(' voci', ' items')]].forEach(function (r, i) { ctx.fillStyle = 'rgba(160,175,205,.8)'; ctx.fillText(r[0] + ':', x0, y0 + lh * (i + 1)); ctx.fillStyle = '#e4ebf8'; ctx.fillText(String(r[1]), x0 + 72, y0 + lh * (i + 1)); });
      var st = stadio(ricordi), sw = ctx.measureText(t(st[0], st[1])).width + 22, sy = y0 + lh * 5 - 4;
      ctx.fillStyle = 'rgba(40,120,90,.55)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0, sy, sw, 18, 9); else ctx.rect(x0, sy, sw, 18); ctx.fill(); ctx.fillStyle = '#7ff0b8'; ctx.font = '700 11px ui-monospace,Menlo,monospace'; ctx.fillText(t(st[0], st[1]), x0 + 11, sy + 13);
      var si = statoInterno(), bx = x0 + sw + 18;
      si.forEach(function (b, i) { var x = bx + i * 30, hb = 34; ctx.fillStyle = 'rgba(160,175,205,.18)'; ctx.fillRect(x + 9, sy - 18, 4, hb); var col = ['#ffb44a', '#5ad1ff', '#ff5a6e', '#c79cff', '#7ff0b8'][i]; ctx.fillStyle = col; ctx.fillRect(x + 9, sy - 18 + hb * (1 - b[1]), 4, hb * b[1]); ctx.fillStyle = 'rgba(160,175,205,.8)'; ctx.font = '500 9px ui-monospace,Menlo,monospace'; ctx.fillText(b[0], x + 2, sy + 28); });
      var live = vivo(); ctx.font = '700 11px ui-monospace,Menlo,monospace'; var lw = ctx.measureText(live ? 'LIVE' : t('ATTESA', 'IDLE')).width + 32, lx = W - lw - 10, ly = 8;
      ctx.fillStyle = live ? 'rgba(40,120,90,.55)' : 'rgba(80,90,110,.5)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx, ly, lw, 22, 11); else ctx.rect(lx, ly, lw, 22); ctx.fill();
      ctx.fillStyle = live ? (Math.sin(passo * 0.12) > 0 || calmo ? '#4ade80' : '#1f6f45') : '#8b97ad'; ctx.beginPath(); ctx.arc(lx + 12, ly + 11, 3.5, 0, 6.2832); ctx.fill();
      ctx.fillStyle = live ? '#7ff0b8' : '#b8c2d6'; ctx.font = '700 11px ui-monospace,Menlo,monospace'; ctx.fillText(live ? 'LIVE' : t('ATTESA', 'IDLE'), lx + 22, ly + 15);
    }
    function ciclo() { if (fermo) return; passo++; disegna(); raf = g.requestAnimationFrame(ciclo); }
    misura(); if (calmo) disegna(); else ciclo();
    var suRidim = function () { misura(); disegna(); }; g.addEventListener('resize', suRidim);
    return {
      ferma: function () { fermo = true; if (raf) g.cancelAnimationFrame(raf); g.removeEventListener('resize', suRidim); },
      scegli: function (x, y) { var m = -1, md = 22 * 22; N.forEach(function (n, i) { var d = (X(n.u) - x) * (X(n.u) - x) + (Y(n.v) - y) * (Y(n.v) - y); if (d < md) { md = d; m = i; } }); scelto = m; disegna(); return m >= 0 ? N[m] : null; },
      neuroni: function () { return N.map(function (n) { var o = {}; for (var k in n) o[k] = n[k]; o.x = X(n.u); o.y = Y(n.v); return o; }); },
      regioni: function () { var tot = N.length || 1; return REGIONI.map(function (r) { return { id: r.id, nome: t(r.nome[0], r.nome[1]), neuroni: conta[r.id], quota: conta[r.id] / tot, x: X(r.x), y: Y(r.y), rx: r.rx * pad.w, ry: r.ry * pad.h }; }); },
      disegna: disegna
    };
  }
  g.BSISpectraCervello = { anima: anima, REGIONI: REGIONI, assegna: assegna, stadio: stadio };
})(typeof window !== 'undefined' ? window : globalThis);
