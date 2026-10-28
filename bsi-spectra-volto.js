/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-volto.js — il volto di Spectra
   BioSpecInfo · © Samuele Pio Provenzano

   Spectra ha un volto: uno scienziato sulla quarantina, occhiali, tempie
   brizzolate, barba corta, camice. E' un ritratto vettoriale (SVG), quindi
   nitido a qualunque dimensione e leggero, ed e' vivo:

   · sbatte le palpebre a intervalli irregolari, come una persona;
   · segue con lo sguardo il puntatore o il dito;
   · respira (un'oscillazione minima della testa);
   · cambia espressione con lo stato: ATTENTO quando ascolta (sopracciglia
     alzate, occhi aperti), PENSIEROSO quando elabora (sguardo in alto, un
     sopracciglio sollevato, un riflesso che passa sugli occhiali), un
     leggero SORRISO quando aspetta;
   · PARLA: la bocca segue il testo che la voce sta pronunciando, lettera
     per lettera (le vocali aprono, m, b e p chiudono), e si riallinea a ogni
     parola con gli eventi della sintesi vocale.

   Nessun file esterno, nessuna libreria. Con «riduci movimento» le
   animazioni si fermano e resta il ritratto.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', contatore = 0;
  var MENO_MOTO = function () { return globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  /* apertura della bocca per lettera: le vocali aprono, le bilabiali chiudono */
  var APERTURA = { a: 1, à: 1, e: 0.65, è: 0.7, é: 0.6, i: 0.35, ì: 0.35, o: 0.8, ò: 0.85, u: 0.45, ù: 0.45, m: 0, b: 0, p: 0, f: 0.15, v: 0.15, ' ': 0.08 };
  var LARGHEZZA = { e: 0.25, i: 0.4, a: 0.1, o: -0.35, u: -0.45 };
  function apertura(c) { c = (c || '').toLowerCase(); return APERTURA[c] != null ? APERTURA[c] : /[a-z]/.test(c) ? 0.28 : 0.06; }

  function svg(tag, attr, padre) {
    var e = document.createElementNS(NS, tag);
    for (var k in attr) e.setAttribute(k, attr[k]);
    if (padre) padre.appendChild(e);
    return e;
  }

  /* il ritratto: pezzi separati, perche' alcuni si muovono */
  function ritratto(id) {
    var s = svg('svg', { viewBox: '0 0 200 240', role: 'img', 'aria-label': 'Spectra', 'class': 'bsiVO' });
    var d = svg('defs', {}, s);
    var g1 = svg('radialGradient', { id: id + 'pelle', cx: '45%', cy: '40%', r: '65%' }, d);
    svg('stop', { offset: '0%', 'stop-color': '#f3cba8' }, g1); svg('stop', { offset: '70%', 'stop-color': '#e2ad88' }, g1); svg('stop', { offset: '100%', 'stop-color': '#c98e6a' }, g1);
    var g2 = svg('linearGradient', { id: id + 'camice', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
    svg('stop', { offset: '0%', 'stop-color': '#f7fafc' }, g2); svg('stop', { offset: '100%', 'stop-color': '#c9d6e2' }, g2);
    var g3 = svg('linearGradient', { id: id + 'capelli', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
    svg('stop', { offset: '0%', 'stop-color': '#4a372b' }, g3); svg('stop', { offset: '100%', 'stop-color': '#2b1e16' }, g3);
    var g4 = svg('linearGradient', { id: id + 'lente', x1: '0', y1: '0', x2: '1', y2: '1' }, d);
    svg('stop', { offset: '0%', 'stop-color': 'rgba(190,230,255,0.22)' }, g4); svg('stop', { offset: '100%', 'stop-color': 'rgba(120,180,230,0.06)' }, g4);
    var cp = svg('clipPath', { id: id + 'bocca' }, d); var clipBocca = svg('path', { d: '' }, cp);

    var corpo = svg('g', {}, s);
    /* spalle: camice, camicia, cravatta */
    svg('path', { d: 'M6 240 C8 212 30 199 62 191 L84 185 L100 214 L116 185 L138 191 C170 199 192 212 194 240 Z', fill: 'url(#' + id + 'camice)', stroke: '#aebdcb', 'stroke-width': '1.2' }, corpo);
    svg('path', { d: 'M84 185 L100 214 L116 185 L112 176 L100 186 L88 176 Z', fill: '#b9d3ec' }, corpo);
    svg('path', { d: 'M96.5 188 L103.5 188 L106 197 L101.5 228 L98.5 228 L94 197 Z', fill: '#16656e' }, corpo);
    svg('path', { d: 'M97 188 L103 188 L102 193 L98 193 Z', fill: '#0f4d54' }, corpo);
    svg('path', { d: 'M84 185 L74 232 M116 185 L126 232', stroke: '#aebdcb', 'stroke-width': '2', fill: 'none' }, corpo);
    svg('path', { d: 'M150 214 l14 -2 l1 7 l-14 2 Z', fill: '#2e7d86' }, corpo);           /* penna nel taschino */
    svg('rect', { x: '138', y: '216', width: '30', height: '5', rx: '1.5', fill: '#9fb0c0', opacity: '0.6' }, corpo);

    var testa = svg('g', { 'class': 'bsiVO-testa' }, s);
    svg('path', { d: 'M86 160 L86 186 Q100 197 114 186 L114 160 Z', fill: '#d49c79' }, testa);  /* collo */
    svg('ellipse', { cx: '53', cy: '112', rx: '8', ry: '14', fill: '#e1a985' }, testa);
    svg('ellipse', { cx: '147', cy: '112', rx: '8', ry: '14', fill: '#e1a985' }, testa);
    svg('path', { d: 'M100 40 C134 40 150 64 150 100 C150 136 138 160 118 172 C110 177 90 177 82 172 C62 160 50 136 50 100 C50 64 66 40 100 40 Z', fill: 'url(#' + id + 'pelle)' }, testa);
    /* barba corta e baffi */
    svg('path', { d: 'M57 124 C59 150 76 172 100 177 C124 172 141 150 143 124 C139 144 129 158 117 165 C111 157 105 155 100 155 C95 155 89 157 83 165 C71 158 61 144 57 124 Z', fill: '#4b3a2f', opacity: '0.88' }, testa);
    svg('path', { d: 'M57 124 C59 150 76 172 100 177 C124 172 141 150 143 124', fill: 'none', stroke: '#3a2c23', 'stroke-width': '0.8', opacity: '0.5' }, testa);
    svg('path', { d: 'M84 139 C91 133 99 136 100 136.5 C101 136 109 133 116 139 C110 141.5 104 140.5 100 139.5 C96 140.5 90 141.5 84 139 Z', fill: '#47362b' }, testa);
    /* la bocca, ricalcolata a ogni fotogramma */
    var bocca = svg('g', {}, testa);
    var interno = svg('path', { d: '', fill: '#4a1f22' }, bocca);
    var denti = svg('rect', { x: '88', y: '143.5', width: '24', height: '3.2', rx: '1', fill: '#f4efe6', 'clip-path': 'url(#' + id + 'bocca)' }, bocca);
    var labbro = svg('path', { d: '', fill: 'none', stroke: '#9b5a50', 'stroke-width': '1.6', 'stroke-linecap': 'round' }, bocca);
    /* naso */
    svg('path', { d: 'M100 99 C98.5 110 95 120 95.5 125 C97 129.5 103 129.5 104.5 125', fill: 'none', stroke: '#b4775a', 'stroke-width': '1.8', 'stroke-linecap': 'round' }, testa);
    svg('path', { d: 'M95 125.5 q2 2 4 0.5 M101 126 q2 1.5 4 -0.5', fill: 'none', stroke: '#a0644a', 'stroke-width': '1.1' }, testa);
    /* guance */
    svg('ellipse', { cx: '72', cy: '120', rx: '10', ry: '6', fill: '#e8968a', opacity: '0.18' }, testa);
    svg('ellipse', { cx: '128', cy: '120', rx: '10', ry: '6', fill: '#e8968a', opacity: '0.18' }, testa);
    /* occhi: bianco, iride che segue lo sguardo, palpebra per il battito */
    var occhi = [];
    [78, 122].forEach(function (cx) {
      var g = svg('g', {}, testa);
      svg('ellipse', { cx: cx, cy: '97', rx: '9', ry: '6.2', fill: '#fbfbf8' }, g);
      var iride = svg('g', {}, g);
      svg('circle', { cx: cx, cy: '97', r: '4.3', fill: '#3b6d8d' }, iride);
      svg('circle', { cx: cx, cy: '97', r: '2.1', fill: '#101418' }, iride);
      svg('circle', { cx: cx + 1.4, cy: '95.6', r: '1.05', fill: '#ffffff' }, iride);
      var palpebra = svg('path', { d: '', fill: '#e4b08d' }, g);
      svg('path', { d: 'M' + (cx - 9.5) + ' 96 Q' + cx + ' 89 ' + (cx + 9.5) + ' 96', fill: 'none', stroke: '#6b4a3a', 'stroke-width': '1.2', 'class': 'bsiVO-piega' }, g);
      occhi.push({ cx: cx, iride: iride, palpebra: palpebra });
    });
    /* sopracciglia */
    var ciglioS = svg('path', { d: 'M65 83 Q77 76 90 80', fill: 'none', stroke: '#33241b', 'stroke-width': '4.2', 'stroke-linecap': 'round' }, testa);
    var ciglioD = svg('path', { d: 'M110 80 Q123 76 135 83', fill: 'none', stroke: '#33241b', 'stroke-width': '4.2', 'stroke-linecap': 'round' }, testa);
    /* capelli e tempie brizzolate */
    svg('path', { d: 'M50 98 C45 60 66 33 100 31 C137 31 157 56 150 99 C147 80 141 67 129 60 C113 51 86 53 72 60 C60 66 54 80 52 98 Z', fill: 'url(#' + id + 'capelli)' }, testa);
    svg('path', { d: 'M50 98 C49 84 52 73 59 66 L61 92 Z', fill: '#9b9b9b', opacity: '0.85' }, testa);
    svg('path', { d: 'M150 99 C151 84 148 73 141 66 L139 92 Z', fill: '#9b9b9b', opacity: '0.85' }, testa);
    svg('path', { d: 'M78 42 C92 38 112 38 128 46', fill: 'none', stroke: '#6a5243', 'stroke-width': '1.4', opacity: '0.6' }, testa);
    svg('path', { d: 'M70 50 C84 44 104 44 120 50', fill: 'none', stroke: '#8a8a8a', 'stroke-width': '1', opacity: '0.45' }, testa);
    /* occhiali */
    var occh = svg('g', {}, testa);
    svg('rect', { x: '63', y: '86', width: '31', height: '22', rx: '7', fill: 'url(#' + id + 'lente)', stroke: '#1f2328', 'stroke-width': '2.5' }, occh);
    svg('rect', { x: '106', y: '86', width: '31', height: '22', rx: '7', fill: 'url(#' + id + 'lente)', stroke: '#1f2328', 'stroke-width': '2.5' }, occh);
    svg('path', { d: 'M94 95 Q100 90.5 106 95 M63 93 L53 97 M137 93 L147 97', fill: 'none', stroke: '#1f2328', 'stroke-width': '2.3', 'stroke-linecap': 'round' }, occh);
    var riflesso = svg('path', { d: 'M68 104 L80 89 L84 89 L72 104 Z M111 104 L123 89 L127 89 L115 104 Z', fill: '#ffffff', opacity: '0.28' }, occh);
    return { s: s, testa: testa, occhi: occhi, ciglioS: ciglioS, ciglioD: ciglioD, interno: interno, labbro: labbro, denti: denti, clipBocca: clipBocca, riflesso: riflesso };
  }

  function Volto(padre, opz) {
    opz = opz || {};
    this.id = 'bsiVO' + (++contatore);
    this.p = ritratto(this.id);
    if (opz.classe) this.p.s.setAttribute('class', 'bsiVO ' + opz.classe);
    padre.appendChild(this.p.s);
    this.st = 'attesa';
    this.sguardo = { x: 0, y: 0, tx: 0, ty: 0 };
    this.palp = 0; this.prossimoBattito = 1.5;
    this.boc = 0; this.bocT = 0; this.larg = 0; this.largT = 0;
    this.testo = ''; this.pos = 0; this.vel = 13;    /* lettere al secondo */
    this.t = 0; this.raf = 0;
    var self = this;
    this._muovi = function (e) {
      var r = self.p.s.getBoundingClientRect(); if (!r.width) return;
      var dx = (e.clientX - (r.left + r.width / 2)) / Math.max(200, r.width * 2), dy = (e.clientY - (r.top + r.height * 0.4)) / Math.max(200, r.height * 2);
      self.sguardo.tx = Math.max(-1, Math.min(1, dx)); self.sguardo.ty = Math.max(-1, Math.min(1, dy));
    };
    document.addEventListener('pointermove', this._muovi, { passive: true });
    this.disegna(0);
    this.avvia();
  }
  Volto.prototype.stato = function (s) { this.st = s || 'attesa'; if (s !== 'parla') { this.testo = ''; } this.avvia(); };
  /* inizia a dire una frase: la bocca la segue */
  Volto.prototype.dici = function (frase) { this.testo = String(frase || ''); this.pos = 0; this.st = 'parla'; this.avvia(); };
  /* la sintesi vocale ha raggiunto il carattere i: ci si riallinea */
  Volto.prototype.allinea = function (i) { if (this.testo) this.pos = Math.max(this.pos, i); };
  Volto.prototype.taci = function () { this.testo = ''; if (this.st === 'parla') this.st = 'attesa'; };
  Volto.prototype.avvia = function () {
    if (this.raf) return;
    var self = this, prec = 0;
    (function giro(ora) {
      if (!self.p.s.isConnected) { self.raf = 0; document.removeEventListener('pointermove', self._muovi); return; }
      var dt = prec ? Math.min(0.05, (ora - prec) / 1000) : 0.016; prec = ora;
      if (self.p.s.getBoundingClientRect().width > 0) self.disegna(dt);
      if (MENO_MOTO() && self.st !== 'parla') { self.raf = 0; return; }
      self.raf = globale.requestAnimationFrame(giro);
    })(0);
  };
  Volto.prototype.disegna = function (dt) {
    var P = this.p, st = this.st, lento = MENO_MOTO();
    this.t += dt;
    /* battito delle palpebre */
    this.prossimoBattito -= dt;
    if (this.prossimoBattito <= 0 && !lento) { this.palp = 1; this.prossimoBattito = 2 + Math.random() * 4.5; }
    var chiusura = this.palp > 0 ? Math.sin(this.palp * Math.PI) : 0; this.palp = Math.max(0, this.palp - dt / 0.16);
    if (st === 'pensa') chiusura = Math.max(chiusura, 0.18);
    /* sguardo: il puntatore, oppure in alto a destra quando pensa */
    var gx = this.sguardo.tx, gy = this.sguardo.ty;
    if (st === 'pensa') { gx = 0.7 + 0.2 * Math.sin(this.t * 0.8); gy = -0.8; }
    this.sguardo.x += (gx - this.sguardo.x) * Math.min(1, dt * 6); this.sguardo.y += (gy - this.sguardo.y) * Math.min(1, dt * 6);
    var ox = this.sguardo.x * 3.2, oy = this.sguardo.y * 1.8;
    P.occhi.forEach(function (o) {
      o.iride.setAttribute('transform', 'translate(' + ox.toFixed(2) + ' ' + oy.toFixed(2) + ')');
      var top = 90.5, bot = 103.5, y = top + (bot - top) * chiusura;
      o.palpebra.setAttribute('d', 'M' + (o.cx - 10) + ' 89 L' + (o.cx + 10) + ' 89 L' + (o.cx + 10) + ' 96 Q' + o.cx + ' ' + (y + (chiusura > 0.5 ? 2 : -6 + 8 * chiusura)).toFixed(2) + ' ' + (o.cx - 10) + ' 96 Z');
    });
    /* sopracciglia: alzate quando ascolta, una sola quando pensa */
    var aS = st === 'ascolta' ? -3.5 : st === 'pensa' ? -1 : st === 'parla' ? -1.2 * Math.max(0, this.boc - 0.5) : 0;
    var aD = st === 'ascolta' ? -3.5 : st === 'pensa' ? -4.5 : aS;
    P.ciglioS.setAttribute('d', 'M65 ' + (83 + aS) + ' Q77 ' + (76 + aS * 1.4) + ' 90 ' + (80 + aS));
    P.ciglioD.setAttribute('d', 'M110 ' + (80 + aD) + ' Q123 ' + (76 + aD * 1.4) + ' 135 ' + (83 + aD));
    /* la bocca: segue il testo pronunciato */
    if (st === 'parla' && this.testo) {
      this.pos += dt * this.vel;
      var i = Math.floor(this.pos), c = this.testo.charAt(i);
      if (i >= this.testo.length) { this.bocT = 0.05; } else { this.bocT = apertura(c); this.largT = LARGHEZZA[c.toLowerCase()] || 0; }
    } else { this.bocT = st === 'ascolta' ? 0.08 : 0; this.largT = st === 'attesa' ? 0.35 : st === 'pensa' ? -0.15 : 0.15; }
    this.boc += (this.bocT - this.boc) * Math.min(1, dt * 22); this.larg += (this.largT - this.larg) * Math.min(1, dt * 12);
    var w = 14 + 3 * this.larg, sor = (st === 'attesa' ? 2.2 : 0.6) + this.larg, o = 9 * this.boc, cy = 145;
    var su = 'M' + (100 - w) + ' ' + (cy - sor * 0.4) + ' Q100 ' + (cy - 2 - o * 0.25) + ' ' + (100 + w) + ' ' + (cy - sor * 0.4);
    var giu = ' Q100 ' + (cy + 1.5 + o) + ' ' + (100 - w) + ' ' + (cy - sor * 0.4);
    P.interno.setAttribute('d', su + giu + ' Z'); P.clipBocca.setAttribute('d', su + giu + ' Z');
    P.labbro.setAttribute('d', su + ' M' + (100 - w * 0.75) + ' ' + (cy + 1.2 + o * 0.9) + ' Q100 ' + (cy + 3 + o) + ' ' + (100 + w * 0.75) + ' ' + (cy + 1.2 + o * 0.9));
    P.denti.setAttribute('opacity', o > 2.5 ? '1' : '0');
    /* testa: respiro, e un'inclinazione che accompagna le parole */
    var rot = lento ? 0 : 1.2 * Math.sin(this.t * 0.6) + (st === 'ascolta' ? 3 : 0) + (st === 'parla' ? 1.2 * Math.sin(this.t * 2.3) : 0), dy = lento ? 0 : 0.8 * Math.sin(this.t * 1.1);
    P.testa.setAttribute('transform', 'rotate(' + rot.toFixed(2) + ' 100 170) translate(0 ' + dy.toFixed(2) + ')');
    /* il riflesso sugli occhiali passa quando pensa */
    P.riflesso.setAttribute('opacity', (0.18 + (st === 'pensa' ? 0.35 * (0.5 + 0.5 * Math.sin(this.t * 3)) : 0.1)).toFixed(2));
  };

  /* un'icona statica del volto, per i pulsanti */
  function icona(px) {
    var box = document.createElement('div'), v = ritratto('bsiVOi' + (++contatore));
    v.s.setAttribute('width', px); v.s.setAttribute('height', Math.round(px * 1.2));
    v.s.setAttribute('viewBox', '30 26 140 160');
    /* bocca a riposo e palpebre aperte */
    v.interno.setAttribute('d', 'M86 144 Q100 141 114 144 Q100 147.5 86 144 Z');
    v.labbro.setAttribute('d', 'M86 144 Q100 141 114 144');
    v.denti.setAttribute('opacity', '0');
    v.occhi.forEach(function (o) { o.palpebra.setAttribute('d', 'M' + (o.cx - 10) + ' 89 L' + (o.cx + 10) + ' 89 L' + (o.cx + 10) + ' 96 Q' + o.cx + ' 84 ' + (o.cx - 10) + ' 96 Z'); });
    v.s.setAttribute('aria-hidden', 'true'); v.s.removeAttribute('role');
    box.appendChild(v.s);
    return box.innerHTML;
  }

  globale.BSISpectraVolto = { Volto: Volto, crea: function (padre, opz) { return new Volto(padre, opz); }, icona: icona, apertura: apertura, versione: '1.0' };
})(typeof window !== 'undefined' ? window : globalThis);
