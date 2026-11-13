/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-mappa.js — 🧭 Mappa dei prerequisiti di matematica (fase 9, §7.4)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v254)
   Il progetto chiede la matematica di ogni livello con i prerequisiti
   espliciti e i collegamenti verso la fisica e la chimica che la usano.
   «🧭 Dalle superiori al dottorato» dice che cosa sapere a ogni livello;
   qui c'è il grafo: 41 argomenti, ognuno con i suoi prerequisiti diretti, le
   sezioni dell'app che lo insegnano e quelle che lo usano. Scelto un
   obiettivo, il percorso è l'ordinamento topologico dei suoi antenati: si
   impara ogni argomento solo dopo quelli da cui dipende.

   IL GRAFO
   Aciclico (il banco lo verifica), quattro livelli: 0 superiori, 1 laurea
   triennale, 2 magistrale, 3 avanzato. Un prerequisito sta sempre a un
   livello uguale o più basso. Le sezioni citate esistono (il banco le cerca
   nella barra).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, D = globale.document;
  var LIVELLI = [['Superiori', 'High school'], ['Triennale', 'Bachelor'], ['Magistrale', 'Master'], ['Avanzato', 'Advanced']];
  var COL = ['#5eead4', '#6bb7ff', '#b48cff', '#ff8fab'];
  /* [id, livello, nome it, nome en, prerequisiti, sezioni che insegnano, sezioni che lo usano] */
  var A = [
    ['aritm', 0, 'Numeri, frazioni e potenze', 'Numbers, fractions and powers', [], ['smatbasi'], ['slabcalc']],
    ['logica', 0, 'Logica e insiemi', 'Logic and sets', ['aritm'], ['smatlogica'], []],
    ['algebra', 0, 'Algebra ed equazioni', 'Algebra and equations', ['aritm'], ['smatbasi'], ['slabcalc']],
    ['funzioni', 0, 'Funzioni e grafici', 'Functions and graphs', ['algebra'], ['smatfunz'], ['sfismecc']],
    ['explog', 0, 'Esponenziali e logaritmi', 'Exponentials and logarithms', ['funzioni'], ['smatbasi'], ['spka', 'snucleare']],
    ['trig', 0, 'Trigonometria', 'Trigonometry', ['funzioni'], ['smatbasi', 'smatgeo'], ['sfisonde']],
    ['geoanal', 0, 'Geometria analitica', 'Analytic geometry', ['algebra', 'trig'], ['smatgeo'], []],
    ['vettori', 0, 'Vettori nel piano e nello spazio', 'Vectors in the plane and in space', ['geoanal'], ['smatgeo'], ['sfismecc']],
    ['probbase', 0, 'Probabilità di base', 'Basic probability', ['aritm'], ['smatprob'], []],
    ['limiti', 1, 'Limiti e continuità', 'Limits and continuity', ['funzioni', 'logica'], ['smatfunz', 'smatcalc'], []],
    ['derivate', 1, 'Derivate', 'Derivatives', ['limiti'], ['smatcalc'], ['sfismecc']],
    ['studiofunz', 1, 'Studio di funzione', 'Curve sketching', ['derivate', 'explog', 'trig'], ['smatfunz'], []],
    ['integrali', 1, 'Integrali', 'Integrals', ['derivate'], ['smatcalc'], ['sfistermo']],
    ['succserie', 1, 'Successioni e serie', 'Sequences and series', ['limiti'], ['smatserie', 'smatcalc'], []],
    ['taylor', 1, 'Sviluppi di Taylor', 'Taylor expansions', ['derivate', 'succserie'], ['smatcalc', 'smatserie'], ['sfisanalitica']],
    ['ode1', 1, 'Equazioni differenziali del primo e secondo ordine', 'First- and second-order differential equations', ['integrali', 'explog'], ['smatode'], ['snucleare', 'sfiscirc']],
    ['matrici', 1, 'Matrici e sistemi lineari', 'Matrices and linear systems', ['algebra', 'vettori'], ['smatlin'], ['sfiscirc']],
    ['autoval', 1, 'Autovalori e diagonalizzazione', 'Eigenvalues and diagonalisation', ['matrici'], ['smatlin'], ['smo', 'shf']],
    ['multivar', 1, 'Funzioni di più variabili', 'Functions of several variables', ['derivate', 'vettori'], ['smatmulti'], ['sfistermo']],
    ['intmulti', 1, 'Integrali doppi e tripli', 'Double and triple integrals', ['integrali', 'multivar'], ['smatmulti'], ['sorbitali']],
    ['complessi', 1, 'Numeri complessi', 'Complex numbers', ['trig', 'explog'], ['smatcompl'], ['sfiscirc']],
    ['statlab', 1, 'Statistica di laboratorio e incertezze', 'Laboratory statistics and uncertainties', ['probbase', 'derivate'], ['smatstat'], ['slabcalc']],
    ['numerici', 1, 'Metodi numerici', 'Numerical methods', ['derivate', 'matrici'], ['smatnum'], ['sdinmol']],
    ['numcritto', 1, 'Numeri primi, congruenze e crittografia', 'Primes, congruences and cryptography', ['aritm', 'logica'], ['smatnumeri'], []],
    ['grafi', 1, 'Grafi e ottimizzazione', 'Graphs and optimisation', ['logica', 'matrici'], ['smatgrafi'], []],
    ['calcvett', 2, 'Calcolo vettoriale: gradiente, divergenza, rotore', 'Vector calculus: gradient, divergence, curl', ['multivar', 'intmulti'], ['smatvett'], ['sfisem']],
    ['odesist', 2, 'Sistemi di equazioni differenziali e stabilità', 'Systems of differential equations and stability', ['ode1', 'autoval'], ['smatode'], ['sfismecc', 'sfisanalitica']],
    ['fourier', 2, 'Serie e trasformata di Fourier', 'Fourier series and transform', ['complessi', 'integrali', 'succserie'], ['smatcompl'], ['sfisonde', 'sfissuono']],
    ['inferenza', 2, 'Statistica inferenziale', 'Inferential statistics', ['statlab', 'integrali'], ['smatinfer'], ['sdatasci']],
    ['markov', 2, 'Catene di Markov e processi stocastici', 'Markov chains and stochastic processes', ['probbase', 'autoval'], ['smatmarkov'], ['sfisising', 'sfisstat']],
    ['svd', 2, 'SVD e algebra lineare applicata', 'SVD and applied linear algebra', ['autoval'], ['smatsvd'], ['sdatasci']],
    ['curve', 2, 'Curve nello spazio (Frenet)', 'Space curves (Frenet)', ['vettori', 'derivate'], ['smatfrenet'], ['sastroorbite']],
    ['variaz', 2, 'Calcolo delle variazioni', 'Calculus of variations', ['integrali', 'multivar'], ['smatvariaz'], ['sfisanalitica']],
    ['algstrut', 2, 'Gruppi, anelli e campi', 'Groups, rings and fields', ['logica', 'matrici'], ['smatalgebra'], ['scristalli']],
    ['giochi', 2, 'Teoria dei giochi', 'Game theory', ['probbase', 'matrici'], ['smatgiochi'], []],
    ['edp', 3, 'Equazioni alle derivate parziali', 'Partial differential equations', ['odesist', 'calcvett', 'fourier'], ['smatedp'], ['sschrod', 'sfiscalore']],
    ['analcomp', 3, 'Analisi complessa e residui', 'Complex analysis and residues', ['complessi', 'integrali', 'succserie'], ['smatanalcomp'], []],
    ['topologia', 3, 'Topologia e superfici', 'Topology and surfaces', ['multivar', 'logica'], ['smattopo'], []],
    ['noneucl', 3, 'Geometrie non euclidee e curvatura', 'Non-Euclidean geometries and curvature', ['geoanal', 'curve'], ['smatnoneucl'], ['sastrobh', 'sastrowh']],
    ['codici', 3, 'Codici e curve ellittiche', 'Codes and elliptic curves', ['algstrut', 'numcritto'], ['smatcodici'], []],
    ['quantistica', 3, 'Matematica della meccanica quantistica', 'Mathematics of quantum mechanics', ['edp', 'autoval', 'complessi', 'intmulti'], ['smatedp', 'smatlin'], ['sschrod', 'sorbitali', 'sfisspin']]
  ];
  var N = {}; A.forEach(function (a) { N[a[0]] = { id: a[0], liv: a[1], nome: [a[2], a[3]], pre: a[4], sez: a[5], usi: a[6] }; });

  /* ═══ IL GRAFO ═════════════════════════════════════════════════════════ */
  /** Tutti gli antenati di x (prerequisiti diretti e indiretti), senza x. */
  function antenati(x) { var vis = {}, st = N[x].pre.slice(); while (st.length) { var y = st.pop(); if (!vis[y]) { vis[y] = 1; st.push.apply(st, N[y].pre); } } return Object.keys(vis); }
  /** Tutto ciò che x sblocca (discendenti). */
  function sblocca(x) { var out = {}, cambia = true; while (cambia) { cambia = false; A.forEach(function (a) { if (out[a[0]] || a[0] === x) return; if (a[4].some(function (p) { return p === x || out[p]; })) { out[a[0]] = 1; cambia = true; } }); } return Object.keys(out); }
  /** Percorso: ordinamento topologico degli antenati più x, a parità per livello e ordine di definizione. Esclude quelli già noti. */
  function percorso(x, noti) {
    noti = noti || {}; var insieme = antenati(x).concat([x]).filter(function (y) { return !noti[y]; }), ord = [], fatto = {}, ordine = {};
    A.forEach(function (a, i) { ordine[a[0]] = i; });
    Object.keys(noti).forEach(function (k) { fatto[k] = 1; });
    while (ord.length < insieme.length) {
      var pronti = insieme.filter(function (y) { return !fatto[y] && N[y].pre.every(function (p) { return fatto[p]; }); });
      if (!pronti.length) return null;                                     /* un ciclo: non deve succedere */
      pronti.sort(function (a, b) { return N[a].liv - N[b].liv || ordine[a] - ordine[b]; });
      ord.push(pronti[0]); fatto[pronti[0]] = 1;
    }
    return ord;
  }
  /** Controlli di coerenza: aciclico, prerequisiti esistenti, livelli non crescenti. */
  function verifica() {
    var err = [];
    A.forEach(function (a) { a[4].forEach(function (p) { if (!N[p]) err.push(a[0] + ': prerequisito ignoto ' + p); else if (N[p].liv > a[1]) err.push(a[0] + ': prerequisito di livello più alto ' + p); }); });
    var colore = {}; function dfs(x) { colore[x] = 1; for (var i = 0; i < N[x].pre.length; i++) { var p = N[x].pre[i]; if (colore[p] === 1) return true; if (!colore[p] && dfs(p)) return true; } colore[x] = 2; return false; }
    A.forEach(function (a) { if (!colore[a[0]] && dfs(a[0])) err.push('ciclo che passa per ' + a[0]); });
    return err;
  }
  F.calcolo.matmappa = { ARGOMENTI: A, nodo: function (x) { return N[x]; }, antenati: antenati, sblocca: sblocca, percorso: percorso, verifica: verifica };

  /* ═══ LA PAGINA ════════════════════════════════════════════════════════ */
  function nomeSezione(id) { var b = D.querySelector('.nav-btn[data-s="' + id + '"]'); return b ? b.textContent.trim() : id; }
  function apri(id) {
    var b = D.querySelector('.nav-btn[data-s="' + id + '"]');
    if (b) { var pan = b.closest('.nav-group-panel'); if (pan && typeof globale.switchNavGroup === 'function') { var idx = [].indexOf.call(D.querySelectorAll('.nav-group-panel'), pan); if (idx >= 0) globale.switchNavGroup(idx); } b.click(); }
    else if (typeof globale.goSection === 'function') globale.goSection(id);
  }
  function chiave() { return 'bsi-mat-mappa-noti'; }
  function leggiNoti() { try { return JSON.parse(globale.localStorage.getItem(chiave()) || '{}') || {}; } catch (e) { return {}; } }
  function scriviNoti(n) { try { globale.localStorage.setItem(chiave(), JSON.stringify(n)); } catch (e) {} }

  function schedaMappa(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var stato = { obiettivo: 'edp', noti: leggiNoti() };
    var voci = A.slice().sort(function (a, b) { return a[1] - b[1]; }).map(function (a) { return [a[0], t(LIVELLI[a[1]][0], LIVELLI[a[1]][1]) + ' · ' + t(a[2], a[3])]; });
    var sel = F.scelta(pan, ['Il mio obiettivo', 'My goal'], voci, stato.obiettivo, function (v) { stato.obiettivo = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var tela = F.el('canvas', { role: 'img', 'aria-label': t('Grafo dei prerequisiti: colonne per livello, frecce dai prerequisiti agli argomenti', 'Prerequisite graph: columns by level, arrows from prerequisites to topics'), style: 'width:100%;display:block;border-radius:12px;background:#06111d;cursor:pointer;touch-action:manipulation' });
    dx.appendChild(tela);
    var lista = F.el('div', { style: 'margin-top:10px' }); dx.appendChild(lista);
    var posizioni = {};
    function disegna() {
      var x = stato.obiettivo, per = percorso(x, stato.noti) || [], ant = antenati(x), sb = sblocca(x);
      /* il grafo */
      var W = Math.max(280, dx.clientWidth || 600), righe = [0, 0, 0, 0]; A.forEach(function (a) { righe[a[1]]++; });
      var piccolo = W < 560, hR = piccolo ? 22 : 26, H = 34 + Math.max.apply(null, righe) * hR + 10, dpr = Math.min(2, globale.devicePixelRatio || 1);
      tela.style.height = H + 'px'; tela.width = W * dpr; tela.height = H * dpr; var q = tela.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H);
      var cw = W / 4, k = [0, 0, 0, 0]; posizioni = {};
      A.forEach(function (a) { var l = a[1]; posizioni[a[0]] = { x: cw * l + 6, y: 34 + k[l] * hR, w: cw - 12, h: hR - 5 }; k[l]++; });
      q.font = '700 ' + (piccolo ? 10 : 12) + 'px system-ui,sans-serif'; q.textBaseline = 'middle';
      LIVELLI.forEach(function (L, i) { q.fillStyle = COL[i]; q.fillText(t(L[0], L[1]), cw * i + 8, 16); });
      var inPer = {}; per.forEach(function (y) { inPer[y] = 1; });
      A.forEach(function (a) { a[4].forEach(function (p) { var P = posizioni[p], Q = posizioni[a[0]], evid = (inPer[a[0]] || a[0] === x) && (inPer[p] || stato.noti[p] || ant.indexOf(p) >= 0); q.strokeStyle = evid ? 'rgba(255,210,74,.75)' : 'rgba(80,110,140,.22)'; q.lineWidth = evid ? 1.6 : 1; q.beginPath(); var x0 = P.x + P.w, y0 = P.y + P.h / 2, x1 = Q.x, y1 = Q.y + Q.h / 2; if (x1 <= x0) { x0 = P.x + P.w / 2; x1 = Q.x + Q.w / 2; } q.moveTo(x0, y0); q.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1); q.stroke(); }); });
      q.font = (piccolo ? 9 : 11) + 'px system-ui,sans-serif';
      A.forEach(function (a) {
        var P = posizioni[a[0]], noto = stato.noti[a[0]], ob = a[0] === x, sbl = sb.indexOf(a[0]) >= 0;
        q.fillStyle = ob ? '#ffd24a' : inPer[a[0]] ? 'rgba(255,210,74,.22)' : noto ? 'rgba(94,234,212,.25)' : sbl ? 'rgba(180,140,255,.16)' : 'rgba(20,40,60,.9)';
        q.strokeStyle = ob ? '#ffd24a' : COL[a[1]]; q.lineWidth = ob ? 2 : 1;
        var r = 5; q.beginPath(); q.moveTo(P.x + r, P.y); q.arcTo(P.x + P.w, P.y, P.x + P.w, P.y + P.h, r); q.arcTo(P.x + P.w, P.y + P.h, P.x, P.y + P.h, r); q.arcTo(P.x, P.y + P.h, P.x, P.y, r); q.arcTo(P.x, P.y, P.x + P.w, P.y, r); q.closePath(); q.fill(); q.stroke();
        q.fillStyle = ob ? '#04121c' : '#dbe8f5'; var s = (noto ? '✓ ' : '') + t(a[2], a[3]); while (q.measureText(s).width > P.w - 8 && s.length > 4) s = s.slice(0, -2) + '…';
        q.fillText(s, P.x + 4, P.y + P.h / 2);
      });
      /* il percorso a parole */
      var n = N[x];
      info.innerHTML = '<b style="font-size:1.05em">' + t(n.nome[0], n.nome[1]) + '</b> · ' + t(LIVELLI[n.liv][0], LIVELLI[n.liv][1]) + '<br>' +
        t('Prerequisiti diretti: ', 'Direct prerequisites: ') + (n.pre.map(function (p) { return t(N[p].nome[0], N[p].nome[1]); }).join(', ') || '—') + '<br>' +
        t('Argomenti da studiare prima, in tutto: ', 'Topics to study first, in all: ') + '<b class="bsiFX-num">' + ant.length + '</b>' + (Object.keys(stato.noti).length ? t(' (già noti ', ' (already known ') + ant.filter(function (y) { return stato.noti[y]; }).length + ')' : '') + '<br>' +
        t('Sblocca: ', 'Unlocks: ') + '<b class="bsiFX-num">' + sb.length + '</b> ' + t('argomenti', 'topics') +
        '<br><small>' + t('Tocca un riquadro del grafo per sceglierlo come obiettivo. Spunta ciò che sai già: il percorso si accorcia (resta su questo dispositivo).', 'Tap a box in the graph to make it the goal. Tick what you already know: the path gets shorter (stays on this device).') + '</small>';
      lista.innerHTML = '';
      lista.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Il percorso', 'The path') + '</b> — ' + per.length + t(' tappe, nell\'ordine in cui studiarle', ' steps, in the order to study them') }));
      per.forEach(function (y, i) {
        var m = N[y], riga = F.el('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 10px;margin:6px 0;border:1px solid #1a3050;border-left:4px solid ' + COL[m.liv] + ';border-radius:10px;background:' + (y === x ? 'rgba(255,210,74,.08)' : '#0a1628') });
        var cb = F.el('input', { type: 'checkbox', title: t('Lo so già', 'I already know it'), 'aria-label': t('Lo so già: ', 'I already know it: ') + t(m.nome[0], m.nome[1]), style: 'width:20px;height:20px;margin:0;flex:0 0 auto' });
        cb.addEventListener('change', function () { if (cb.checked) stato.noti[y] = 1; else delete stato.noti[y]; scriviNoti(stato.noti); disegna(); });
        riga.appendChild(cb);
        riga.appendChild(F.el('span', { html: '<b class="bsiFX-num">' + (i + 1) + '.</b> ' + t(m.nome[0], m.nome[1]) + ' <small style="color:' + COL[m.liv] + '">' + t(LIVELLI[m.liv][0], LIVELLI[m.liv][1]) + '</small>', style: 'flex:1 1 180px;min-width:0' }));
        m.sez.forEach(function (s) { var b = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: '📖 ' + nomeSezione(s), style: 'min-height:36px' }); b.addEventListener('click', function () { apri(s); }); riga.appendChild(b); });
        if (m.usi.length) riga.appendChild(F.el('div', { style: 'flex:1 1 100%;font-size:.82em;color:#9fb3c8', html: t('Serve in: ', 'Used in: ') + m.usi.map(function (u) { return '<a href="#" data-s="' + u + '" style="color:#8cc8ff">' + nomeSezione(u).replace(/[<>&]/g, '') + '</a>'; }).join(' · ') }));
        riga.querySelectorAll('a[data-s]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); apri(a.getAttribute('data-s')); }); });
        lista.appendChild(riga);
      });
      if (Object.keys(stato.noti).length) { var az = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: t('Azzera ciò che so già', 'Reset what I already know') }); az.addEventListener('click', function () { stato.noti = {}; scriviNoti({}); disegna(); }); lista.appendChild(az); }
    }
    tela.addEventListener('click', function (e) {
      var r = tela.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      Object.keys(posizioni).forEach(function (k) { var P = posizioni[k]; if (px >= P.x && px <= P.x + P.w && py >= P.y && py <= P.y + P.h) { stato.obiettivo = k; sel.value = k; disegna(); } });
    });
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('smatmappa', {
    titolo: ['🧭 Mappa dei prerequisiti di matematica', '🧭 Mathematics prerequisite map'],
    sotto: ['Quarantuno argomenti dalle superiori all\'avanzato, ognuno con i prerequisiti, le sezioni che lo insegnano e quelle di fisica e chimica che lo usano. Scegli un obiettivo: il percorso è l\'elenco ordinato di ciò che serve prima.',
            'Forty-one topics from high school to advanced, each with its prerequisites, the sections that teach it and the physics and chemistry sections that use it. Pick a goal: the path is the ordered list of what you need first.'],
    schede: [{ nome: ['Il percorso', 'The path'], costruisci: schedaMappa }]
  });
})(typeof window !== 'undefined' ? window : globalThis);
