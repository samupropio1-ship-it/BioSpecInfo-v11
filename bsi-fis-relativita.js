/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-relativita.js — ⏱️ relativita' ristretta
   BioSpecInfo · © Samuele Pio Provenzano

   · DIAGRAMMA DI MINKOWSKI: il piano (x, ct) con il cono di luce; gli assi
     di un osservatore in moto a velocita' β si chiudono verso la diagonale;
     due eventi simultanei per uno non lo sono per l'altro (relativita' della
     simultaneita'); le coordinate trasformate con Lorentz e l'intervallo
     s² = (cΔt)² − Δx² che resta lo stesso per tutti;
   · I GEMELLI: un viaggio di andata e ritorno a velocita' β fino a una
     stella a distanza d; il tempo proprio del viaggiatore γ volte piu' breve,
     i segnali luminosi annuali che ciascuno vede arrivare dall'altro (Doppler
     relativistico): l'asimmetria sta nell'inversione del viaggiatore;
   · DINAMICA: energia cinetica e quantita' di moto relativistiche contro
     quelle classiche, la composizione delle velocita', l'effetto Doppler
     relativistico, E = mc² per particelle note;
   · CONO DI LUCE 3D (v238): lo spazio-tempo (x, y, ct) con le linee di
     universo, gli eventi e la trasformazione di Lorentz animata con β.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, c = 299792458;
  function griglia(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  function gamma(b) { return 1 / Math.sqrt(1 - b * b); }
  /* trasformazione di Lorentz di (x, ct) verso un osservatore con velocita' β */
  function lorentz(x, ct, b) { var g = gamma(b); return [g * (x - b * ct), g * (ct - b * x)]; }
  function intervallo(dx, dct) { return dct * dct - dx * dx; }
  function somma(u, v) { return (u + v) / (1 + u * v); }
  function doppler(b) { return Math.sqrt((1 + b) / (1 - b)); } /* sorgente che si avvicina: frequenza × questo */
  /* gemelli: d in anni luce, β; tempi in anni */
  function gemelli(d, b) {
    var T = 2 * d / b, tau = T / gamma(b), k = doppler(b);
    /* segnali annuali del viaggiatore ricevuti dalla Terra: in andata arrivano ogni k anni, in ritorno ogni 1/k;
       la Terra vede l'inversione solo quando la luce torna: a T/2 + d */
    var tVedeInversione = d / b + d, ricevutiDalViaggiatore = tau, ricevutiDallaTerra = T;
    return { T: T, tau: tau, k: k, tInv: tVedeInversione, ricevutiDalViaggiatore: ricevutiDalViaggiatore, ricevutiDallaTerra: ricevutiDallaTerra, differenza: T - tau };
  }
  var PARTICELLE = [['elettrone', 'electron', 0.51099895], ['muone', 'muon', 105.6583755], ['protone', 'proton', 938.27208816], ['particella α', 'α particle', 3727.3794066]];
  /* v238 — eventi nello spazio-tempo con due dimensioni di spazio: [x, y, ct]. La spinta lungo x
     non tocca y; l'intervallo s² = (cΔt)² − Δx² − Δy² e' lo stesso per tutti gli osservatori */
  function lorentz3(ev, b) { var p = lorentz(ev[0], ev[2], b); return [p[0], ev[1], p[1]]; }
  function intervallo3(a, e) { var dx = e[0] - a[0], dy = e[1] - a[1], dct = e[2] - a[2]; return dct * dct - dx * dx - dy * dy; }
  /* il piano di simultaneita' dell'osservatore β al suo tempo τ (ct' = τ), visto da chi sta fermo:
     ct = βx + τ/γ */
  function simultaneita(x, b, tau) { return b * x + tau / gamma(b); }
  F.calcolo.relativita = { gamma: gamma, lorentz: lorentz, intervallo: intervallo, somma: somma, doppler: doppler, gemelli: gemelli, lorentz3: lorentz3, intervallo3: intervallo3, simultaneita: simultaneita };

  /* ═══ 1. Minkowski ══════════════════════════════════════════════════════ */
  function schedaMinkowski(div) {
    var G = griglia(div), st = { b: 0.5, A: [1, 2], B: [3, 2] }, info = nota(G.pan);
    F.cursore(G.pan, ['velocità dell’osservatore β = v/c', 'observer speed β = v/c'], -0.95, 0.95, 0.01, st.b, function (v) { st.b = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['evento B: x', 'event B: x'], -4, 4, 0.1, st.B[0], function (v) { st.B[0] = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['evento B: ct', 'event B: ct'], 0, 5, 0.1, st.B[1], function (v) { st.B[1] = v; disegna(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.85);
    function disegna() {
      var b = st.b, L = 5;
      var o = F.grafico(cv, { serie: [{ x: [-L, L], y: [L, L], col: 'rgba(0,0,0,0)', nascondiMirino: true }], xmin: -L, xmax: L, ymin: -0.5, ymax: L, xl: ['x', 'x'], yl: ['ct', 'ct'], descr: ['diagramma di Minkowski', 'Minkowski diagram'] }), q = o.q;
      /* cono di luce */
      q.fillStyle = 'rgba(255,210,74,.07)'; q.beginPath(); q.moveTo(o.X(0), o.Y(0)); q.lineTo(o.X(-L), o.Y(L)); q.lineTo(o.X(L), o.Y(L)); q.closePath(); q.fill();
      q.strokeStyle = '#ffd24a'; q.setLineDash([5, 4]); [1, -1].forEach(function (s) { q.beginPath(); q.moveTo(o.X(0), o.Y(0)); q.lineTo(o.X(s * L), o.Y(L)); q.stroke(); }); q.setLineDash([]);
      /* assi dell'osservatore in moto: ct' (x = β ct) e x' (ct = β x); griglia dei suoi tempi */
      q.strokeStyle = '#ff8a80'; q.lineWidth = 2; q.beginPath(); q.moveTo(o.X(0), o.Y(0)); q.lineTo(o.X(b * L), o.Y(L)); q.stroke(); q.beginPath(); q.moveTo(o.X(-L), o.Y(-b * L)); q.lineTo(o.X(L), o.Y(b * L)); q.stroke(); q.lineWidth = 1;
      q.strokeStyle = 'rgba(255,138,128,.22)';
      var g = gamma(b);
      for (var k = 1; k <= 6; k++) { /* linee di simultaneita' ct' = k: ct = βx + k/γ */ q.beginPath(); q.moveTo(o.X(-L), o.Y(-b * L + k / g)); q.lineTo(o.X(L), o.Y(b * L + k / g)); q.stroke(); }
      q.fillStyle = '#ff8a80'; q.font = '12px system-ui'; q.fillText("ct′", o.X(b * L) + 4, o.Y(L) + 14); q.fillText("x′", o.X(L) - 16, o.Y(b * L) - 6);
      /* eventi */
      [[st.A, '#5eead4', 'A'], [st.B, '#6bcfff', 'B']].forEach(function (E) { q.fillStyle = E[1]; q.beginPath(); q.arc(o.X(E[0][0]), o.Y(E[0][1]), 6, 0, Math.PI * 2); q.fill(); q.fillText(E[2], o.X(E[0][0]) + 8, o.Y(E[0][1]) - 6); });
      var Ap = lorentz(st.A[0], st.A[1], b), Bp = lorentz(st.B[0], st.B[1], b), s2 = intervallo(st.B[0] - st.A[0], st.B[1] - st.A[1]), s2p = intervallo(Bp[0] - Ap[0], Bp[1] - Ap[1]);
      /* linea di simultaneita' di A nel sistema in moto */
      q.strokeStyle = 'rgba(94,234,212,.6)'; q.setLineDash([2, 3]); q.beginPath(); q.moveTo(o.X(-L), o.Y(st.A[1] + b * (-L - st.A[0]))); q.lineTo(o.X(L), o.Y(st.A[1] + b * (L - st.A[0]))); q.stroke(); q.setLineDash([]);
      var tipo = s2 > 1e-9 ? t('di tipo tempo: A può influenzare B, l’ordine temporale è lo stesso per tutti', 'timelike: A can influence B, the time order is the same for everyone') : s2 < -1e-9 ? t('di tipo spazio: nessun segnale li collega; l’ordine temporale dipende dall’osservatore', 'spacelike: no signal connects them; the time order depends on the observer') : t('di tipo luce: un raggio di luce li collega', 'lightlike: a light ray connects them');
      info.innerHTML = 'γ = 1/√(1 − β²) = <b class="bsiFX-num">' + fmt(g) + '</b><br>' + t('Nel sistema in moto: ', 'In the moving frame: ') + "A′ = (" + fmt(Ap[0]) + ', ' + fmt(Ap[1]) + "), B′ = (" + fmt(Bp[0]) + ', ' + fmt(Bp[1]) + ')<br>Δct = ' + fmt(st.B[1] - st.A[1]) + " → Δct′ = <b>" + fmt(Bp[1] - Ap[1]) + '</b>' + (Math.abs(st.B[1] - st.A[1]) < 1e-9 && Math.abs(b) > 0.005 ? t(' — simultanei per chi sta fermo, non per chi si muove', ' — simultaneous at rest, not for the moving observer') : '') + '<br>' + t('Intervallo ', 'Interval ') + 's² = (cΔt)² − Δx² = <b>' + fmt(s2) + '</b> = ' + fmt(s2p) + t(' (invariante): ', ' (invariant): ') + tipo;
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. gemelli ════════════════════════════════════════════════════════ */
  function schedaGemelli(div) {
    var G = griglia(div), st = { d: 4.24, b: 0.8 }, info = nota(G.pan), tA = 0, R;
    F.cursore(G.pan, ['distanza della stella (anni luce)', 'distance to the star (light years)'], 1, 20, 0.01, st.d, function (v) { st.d = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['velocità β', 'speed β'], 0.1, 0.995, 0.005, st.b, function (v) { st.b = v; calcola(); }, function (v) { return v.toFixed(3); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.62);
    function calcola() {
      R = gemelli(st.d, st.b); tA = 0;
      info.innerHTML = t('Per chi resta sulla Terra il viaggio dura ', 'For the one staying on Earth the trip lasts ') + '2d/v = <b class="bsiFX-num">' + fmt(R.T) + t(' anni', ' years') + '</b>; ' + t('per chi viaggia ', 'for the traveller ') + 'T/γ = <b class="bsiFX-num">' + fmt(R.tau) + t(' anni', ' years') + '</b>: ' + t('torna più giovane di ', 'comes back younger by ') + '<b>' + fmt(R.differenza) + t(' anni', ' years') + '</b>.<br>' + t('Ognuno manda un segnale luminoso ogni anno. In allontanamento i segnali arrivano ogni ', 'Each sends a light signal every year. While receding the signals arrive every ') + '√((1+β)/(1−β)) = ' + fmt(R.k) + t(' anni, in avvicinamento ogni ', ' years, while approaching every ') + fmt(1 / R.k) + '.<br>' + t('Il viaggiatore vede il cambio di frequenza a metà del SUO viaggio (quando inverte); la Terra lo vede solo quando le arriva la luce dell’inversione, a ', 'The traveller sees the frequency change halfway through HIS trip (when he turns); the Earth sees it only when the light of the turnaround arrives, at ') + fmt(R.tInv) + t(' anni: per questo le due storie non sono simmetriche.', ' years: that is why the two stories are not symmetric.');
    }
    calcola();
    F.anima(cv, function (dt) {
      tA = Math.min(R.T + 0.5, tA + dt * Math.max(1, R.T / 8));
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, mx = 40, my = 16, X = function (x) { return mx + x / st.d * (W - 2 * mx) * 0.5 + (W - 2 * mx) * 0.25; }, Y = function (ct) { return H - my - ct / (R.T + 0.5) * (H - 2 * my); };
      /* linee di universo */
      q.strokeStyle = '#5eead4'; q.lineWidth = 3; q.beginPath(); q.moveTo(X(0), Y(0)); q.lineTo(X(0), Y(Math.min(tA, R.T + 0.5))); q.stroke();
      q.strokeStyle = '#ff8a80'; q.beginPath(); q.moveTo(X(0), Y(0)); var ct1 = Math.min(tA, R.T / 2); q.lineTo(X(st.b * ct1), Y(ct1)); if (tA > R.T / 2) { var ct2 = Math.min(tA, R.T); q.lineTo(X(st.d - st.b * (ct2 - R.T / 2)), Y(ct2)); } q.stroke(); q.lineWidth = 1;
      q.strokeStyle = 'rgba(132,148,168,.4)'; q.setLineDash([3, 4]); q.beginPath(); q.moveTo(X(st.d), Y(0)); q.lineTo(X(st.d), Y(R.T + 0.5)); q.stroke(); q.setLineDash([]);
      /* segnali annuali della Terra verso il viaggiatore (raggi a 45°) */
      q.strokeStyle = 'rgba(255,210,74,.55)';
      for (var n = 1; n < Math.min(tA, R.T); n++) {
        /* il segnale parte dalla Terra (x = 0) a ct = n e viaggia lungo x = ct − n.
           andata: il viaggiatore e' in x = β ct  → ct = n/(1 − β), se ≤ T/2;
           ritorno: e' in x = 2d − β ct          → ct = (2d + n)/(1 + β) */
        var tc = n / (1 - st.b); if (tc > R.T / 2) tc = (2 * st.d + n) / (1 + st.b);
        var xT = tc - n, fineCt = Math.min(tc, tA);
        q.beginPath(); q.moveTo(X(0), Y(n)); q.lineTo(X(fineCt - n), Y(fineCt)); q.stroke();
      }
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui';
      var tauOra = tA <= R.T ? Math.min(tA, R.T) / gamma(st.b) : R.tau;
      q.fillText(t('Terra: ', 'Earth: ') + Math.min(tA, R.T).toFixed(2) + t(' anni', ' yr'), 10, 16); q.fillStyle = '#ff8a80'; q.fillText(t('viaggiatore: ', 'traveller: ') + tauOra.toFixed(2) + t(' anni', ' yr'), 10, 32);
      q.fillStyle = '#9fb1c6'; q.fillText(t('stella', 'star'), X(st.d) - 12, H - 4);
      cv.setAttribute('aria-label', t('linee di universo dei due gemelli', 'world lines of the twins'));
      if (tA >= R.T + 0.5) return false;
    }, { ricomincia: function () { tA = 0; } });
  }

  /* ═══ 3. dinamica ═══════════════════════════════════════════════════════ */
  function schedaDinamica(div) {
    var G = griglia(div), st = { p: 0, u: 0.6, v: 0.6 }, info = nota(G.pan);
    F.scelta(G.pan, ['Particella', 'Particle'], PARTICELLE.map(function (p, i) { return [String(i), F.tt([p[0], p[1]])]; }), '0', function (v) { st.p = +v; disegna(); });
    F.cursore(G.pan, ['u (velocità del razzo, c)', 'u (rocket speed, c)'], 0, 0.99, 0.01, st.u, function (v) { st.u = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['v (proiettile rispetto al razzo, c)', 'v (projectile relative to rocket, c)'], 0, 0.99, 0.01, st.v, function (v) { st.v = v; disegna(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.55);
    function disegna() {
      var mc2 = PARTICELLE[st.p][2], xs = [], kr = [], kc = [];
      for (var i = 0; i <= 300; i++) { var b = 0.99 * i / 300; xs.push(b); kr.push((gamma(b) - 1) * mc2); kc.push(0.5 * b * b * mc2); }
      F.grafico(cv, { serie: [{ x: xs, y: kr, col: '#5eead4', larg: 2.5, etich: ['K relativistica', 'relativistic K'] }, { x: xs, y: kc, col: '#ff8a80', tratt: true, etich: ['½mv² classica', 'classical ½mv²'] }], xl: ['β = v/c', 'β = v/c'], yl: ['K (MeV)', 'K (MeV)'], ymin: 0, ymax: 4 * mc2, legenda: [{ col: '#5eead4', etich: ['K = (γ − 1)mc²', 'K = (γ − 1)mc²'] }, { col: '#ff8a80', etich: ['K = ½mv²', 'K = ½mv²'] }] });
      var w = somma(st.u, st.v), g = gamma(st.u);
      info.innerHTML = 'mc² = <b>' + fmt(mc2) + ' MeV</b> · ' + t('a β = 0,9: ', 'at β = 0.9: ') + 'K = ' + fmt((gamma(0.9) - 1) * mc2) + ' MeV, ' + t('classica ', 'classical ') + fmt(0.405 * mc2) + ' MeV<br>' + t('Composizione delle velocità: ', 'Velocity addition: ') + '(u + v)/(1 + uv) = <b class="bsiFX-num">' + fmt(w) + ' c</b> (' + t('Galileo darebbe ', 'Galileo would give ') + fmt(st.u + st.v) + ' c)<br>' + t('Doppler: una sorgente che si avvicina a β = ', 'Doppler: a source approaching at β = ') + fmt(st.u) + t(' si vede con frequenza × ', ' is seen at frequency × ') + fmt(doppler(st.u)) + t(' (blu), che si allontana × ', ' (blue), receding × ') + fmt(1 / doppler(st.u)) + ' (' + t('rosso', 'red') + ')<br>' + t('A β = ', 'At β = ') + fmt(st.u) + ': γ = ' + fmt(g) + ', p = γmv = ' + fmt(g * st.u * mc2) + ' MeV/c, E = γmc² = ' + fmt(g * mc2) + ' MeV, E² − (pc)² = (mc²)² ✓<br>' + t('I muoni dei raggi cosmici (vita 2,2 μs) arrivano al suolo perché per noi la loro vita dura γ volte di più.', 'Cosmic-ray muons (lifetime 2.2 μs) reach the ground because for us their life lasts γ times longer.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ la scheda 3D (v238) ═══════════════════════════════════════════════
     Il pannello compare subito; la scena quando three.js e' pronto, costruita in un
     compito separato, cosi' il clic sulla scheda resta leggero. Nella barra della vista
     un tasto ferma e riavvia il moto; con «riduci movimento» la scena parte ferma. */
  function scheda3D(costruisci) {
    return function (div) {
      var g3 = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g3.appendChild(pan); g3.appendChild(destra); div.appendChild(g3);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        attesa.remove();
        var S = new L3.Scena(destra, 0.66);
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.etichetta)); S.ren.domElement.setAttribute('aria-label', F.tt(ctx.etichetta));
        tastoPausa(S);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function tastoPausa(S) {
    var MENO = false; try { MENO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
    S.fermo = MENO;
    var barra = S.box.querySelector('.bsi3d-barra'); if (!barra) return;
    var b = F.el('button', { type: 'button' });
    function aggiorna() { b.textContent = S.fermo ? '▶' : '❚❚'; var n = S.fermo ? t('Avvia il moto', 'Play the motion') : t('Ferma il moto', 'Pause the motion'); b.title = n; b.setAttribute('aria-label', n); b.setAttribute('aria-pressed', String(S.fermo)); }
    b.addEventListener('click', function (e) { e.stopPropagation(); S.fermo = !S.fermo; aggiorna(); if (!S.fermo) S.avvia(); });
    aggiorna(); barra.insertBefore(b, barra.firstChild);
  }
  function svuota(gr) {
    while (gr.children.length) { var o = gr.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); }
  }
  function puntaFreccia(T, fr, p, d) {
    var L = Math.hypot(d[0], d[1], d[2]); fr.visible = L > 0.03; if (!fr.visible) return;
    fr.position.set(p[0], p[1], p[2]); fr.setDirection(new T.Vector3(d[0] / L, d[1] / L, d[2] / L));
    var h = Math.min(0.25, L * 0.4); fr.setLength(L, h, h * 0.6);
  }

  /* ═══ 4. il cono di luce in 3D (v238) ══════════════════════════════════
     Lo spazio-tempo (x, y, ct) con il cono di luce dell'evento O. Le linee di universo (chi sta
     fermo, chi si muove a β, una particella in orbita circolare, un lampo di luce) e tre eventi
     si trasformano con Lorentz quando si passa al sistema dell'osservatore in moto: la scena
     scivola da un riferimento all'altro, il cono resta identico. */
  var EVENTI3 = [['A', [1, 1, 3], '#5eead4', 0x5eead4], ['B', [3, -1, 1], '#6bcfff', 0x6bcfff], ['C', [2, 0, 2], '#ffd24a', 0xffd24a]];
  var R_ORB = 1.2, V_ORB = 0.6;
  function schedaCono(pan) {
    var st = { b: 0.6, vista: 'quiete' }, cb = {};
    F.cursore(pan, ['velocità dell’osservatore O′: β = v/c', 'speed of observer O′: β = v/c'], -0.9, 0.9, 0.01, st.b, function (v) { st.b = v; testo(); if (cb.nuovo) cb.nuovo(); }, function (v) { return v.toFixed(2); });
    F.scelta(pan, ['Riferimento della vista', 'Frame of the view'], [['quiete', t('O, che sta fermo', 'O, at rest')], ['moto', t('O′, che si muove a β', 'O′, moving at β')]], st.vista, function (v) { st.vista = v; testo(); if (cb.nuovo) cb.nuovo(); });
    var info = nota(pan), spiega = nota(pan);
    spiega.innerHTML = t('Tempo in verticale (ct), due dimensioni di spazio. Il cono giallo contiene tutto ciò che la luce partita da O può raggiungere (futuro) o che può aver raggiunto O (passato). Linee di universo: O fermo (verde acqua), O′ a velocità β (rossa), una particella in orbita circolare a 0,6 c (elica viola), un lampo di luce (gialla, sul cono). I pallini sulle linee segnano un’unità di tempo PROPRIO: sulla rossa e sulla viola sono più distanziati (dilatazione dei tempi), sulla luce non ce ne sono. Cambiando riferimento tutto scivola lungo iperboli invarianti, tranne il cono: c è la stessa per tutti. Il piano orizzontale che sale è il «presente» del riferimento della vista.',
      'Time is vertical (ct), with two space dimensions. The yellow cone holds everything light leaving O can reach (future) or that could have reached O (past). World lines: O at rest (teal), O′ at speed β (red), a particle in circular orbit at 0.6 c (purple helix), a light flash (yellow, on the cone). Dots on the lines mark one unit of PROPER time: on the red and purple lines they are further apart (time dilation), on light there are none. When the frame changes everything slides along invariant hyperbolas, except the cone: c is the same for everyone. The rising horizontal plane is the «present» of the viewing frame.');
    function testo() {
      var b = st.b, g = gamma(b), righe = EVENTI3.map(function (e) {
        var p = lorentz3(e[1], b), s2 = intervallo3([0, 0, 0], e[1]), tipo = s2 > 1e-9 ? t('tempo', 'time') : s2 < -1e-9 ? t('spazio', 'space') : t('luce', 'light');
        return '<tr><td style="color:' + e[2] + '">' + e[0] + '</td><td>(' + e[1].join(', ') + ')</td><td>(' + fmt(p[0]) + ', ' + fmt(p[1]) + ', ' + fmt(p[2]) + ')</td><td>' + fmt(s2) + ' · ' + tipo + '</td></tr>';
      }).join('');
      var A = lorentz3(EVENTI3[0][1], b), B = lorentz3(EVENTI3[1][1], b);
      info.innerHTML = 'γ = <b class="bsiFX-num">' + fmt(g) + '</b> · ' + t('tempo proprio di O′ fra due pallini: ', 'proper time of O′ between two dots: ') + '1 → ct = γ = ' + fmt(g) +
        '<table class="bsiFX-tab"><tr><th>' + t('evento', 'event') + '</th><th>(x, y, ct)</th><th>' + t('per O′', 'for O′') + '</th><th>s² · ' + t('tipo', 'type') + '</th></tr>' + righe + '</table>' +
        t('Fra A e B: Δct = ', 'Between A and B: Δct = ') + fmt(EVENTI3[1][1][2] - EVENTI3[0][1][2]) + t(' per O, ', ' for O, ') + '<b>' + fmt(B[2] - A[2]) + '</b>' + t(' per O′. B è di tipo spazio rispetto a O: per β ≥ 1/3 accade PRIMA di O (ct′ < 0). A è nel cono futuro: il suo ct′ resta positivo per ogni β.', ' for O′. B is spacelike from O: for β ≥ 1/3 it happens BEFORE O (ct′ < 0). A is in the future cone: its ct′ stays positive for every β.');
    }
    testo();
    return {
      etichetta: ['Cono di luce 3D nello spazio-tempo (x, y, ct) con linee di universo e trasformazione di Lorentz', '3D light cone in spacetime (x, y, ct) with world lines and Lorentz transformation'],
      tre: function (S, T, L3) {
        var Lb = 4.2, bVis = st.vista === 'moto' ? st.b : 0, tau = -3.5;
        /* il cono: invariante, non si tocca mai */
        var mc = new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false });
        var fut = new T.Mesh(new T.ConeGeometry(Lb, Lb, 64, 1, true), mc); fut.rotation.x = -Math.PI / 2; fut.position.z = Lb / 2; S.aggiungi(fut);
        var pas = new T.Mesh(new T.ConeGeometry(Lb, Lb, 64, 1, true), mc.clone()); pas.rotation.x = Math.PI / 2; pas.position.z = -Lb / 2; S.aggiungi(pas);
        for (var k = 0; k < 16; k++) { var a = 2 * Math.PI * k / 16; S.aggiungi(L3.linea(T, [[-Lb * Math.cos(a), -Lb * Math.sin(a), -Lb], [Lb * Math.cos(a), Lb * Math.sin(a), Lb]], 0xffd24a, 0.25)); }
        S.aggiungi(L3.assi(T, 4.6, ['x', 'y', 'ct'], 0.36));
        var etF = L3.testo3d(T, t('futuro', 'future'), '#ffd24a', 0.3); etF.position.set(-3.4, 0, 3.9); S.aggiungi(etF);
        var etP = L3.testo3d(T, t('passato', 'past'), '#ffd24a', 0.3); etP.position.set(-3.4, 0, -3.9); S.aggiungi(etP);
        /* le iperboli invarianti degli eventi: dove ciascuno puo' trovarsi cambiando β */
        EVENTI3.forEach(function (e) { var pts = []; for (var q = -95; q <= 95; q++) { var p = lorentz3(e[1], q / 100); if (Math.abs(p[0]) < 5 && Math.abs(p[2]) < 5) pts.push(p); } S.aggiungi(L3.linea(T, pts, e[3], 0.3)); });
        /* le linee di universo nel riferimento di O: x(ct), y(ct) */
        var LINEE = [
          { col: 0x5eead4, f: function (c) { return [0, 0, c]; }, tic: function (n) { return [0, 0, n]; }, nome: 'O' },
          { col: 0xff8a80, f: function (c) { return [st.b * c, 0, c]; }, tic: function (n) { var g = gamma(st.b); return [st.b * g * n, 0, g * n]; }, nome: 'O′' },
          { col: 0xc49bff, f: function (c) { return [R_ORB * Math.cos(V_ORB * c / R_ORB), R_ORB * Math.sin(V_ORB * c / R_ORB), c]; }, tic: function (n) { var c = gamma(V_ORB) * n; return [R_ORB * Math.cos(V_ORB * c / R_ORB), R_ORB * Math.sin(V_ORB * c / R_ORB), c]; }, nome: t('orbita', 'orbit') },
          { col: 0xffd24a, f: function (c) { return [-2 + c, -2, c]; }, tic: null, nome: t('luce', 'light') }
        ];
        var gr = new T.Group(); S.aggiungi(gr);
        var piano = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.08, side: T.DoubleSide, depthWrite: false })); S.aggiungi(piano);
        var simul = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xff8a80, transparent: true, opacity: 0.1, side: T.DoubleSide, depthWrite: false })); S.aggiungi(simul);
        var punti = LINEE.map(function (L) { var m = L3.sfera(T, 0.1, L.col, 0, 0, 0, true); S.aggiungi(m); return m; });
        var tratti = [];
        function dentro(p) { return Math.abs(p[0]) < 4.6 && Math.abs(p[1]) < 4.6 && Math.abs(p[2]) < 4.4; }
        function ricostruisci() {
          svuota(gr); tratti = [];
          LINEE.forEach(function (L) {
            var pts = []; for (var i = 0; i <= 400; i++) { var p = lorentz3(L.f(-9 + 18 * i / 400), bVis); if (dentro(p)) pts.push(p); }
            tratti.push(pts); if (pts.length > 1) gr.add(L3.linea(T, pts, L.col, 0.95));
            if (L.tic) { var tp = []; for (var n = -12; n <= 12; n++) { var q = lorentz3(L.tic(n), bVis); if (dentro(q)) tp.push(q[0], q[1], q[2]); } var gt = new T.BufferGeometry(); gt.setAttribute('position', new T.Float32BufferAttribute(tp, 3)); gr.add(new T.Points(gt, new T.PointsMaterial({ color: L.col, size: 0.16 }))); }
            var ult = pts[pts.length - 1]; if (ult) { var e = L3.testo3d(T, L.nome, '#' + L.col.toString(16).padStart(6, '0'), 0.3); e.position.set(ult[0] + 0.25, ult[1], Math.min(4.3, ult[2]) + 0.15); gr.add(e); }
          });
          EVENTI3.forEach(function (e) { var p = lorentz3(e[1], bVis); gr.add(L3.sfera(T, 0.13, e[3], p[0], p[1], p[2], true)); var et = L3.testo3d(T, e[0], e[2], 0.36); et.position.set(p[0] + 0.25, p[1], p[2] + 0.3); gr.add(et); });
          /* il piano di simultaneita' di O′ (ct′ = τ) portato nel riferimento della vista */
          var ang = [[-4.5, -4.5], [4.5, -4.5], [4.5, 4.5], [-4.5, 4.5]].map(function (c) { var r = lorentz3([c[0], c[1], tau], -st.b); return lorentz3(r, bVis); }), gp = simul.geometry, pa = gp.attributes.position;
          pa.setXYZ(0, ang[3][0], ang[3][1], ang[3][2]); pa.setXYZ(1, ang[2][0], ang[2][1], ang[2][2]); pa.setXYZ(2, ang[0][0], ang[0][1], ang[0][2]); pa.setXYZ(3, ang[1][0], ang[1][1], ang[1][2]); pa.needsUpdate = true; gp.computeBoundingSphere();
        }
        function presente() {
          piano.position.z = tau;
          tratti.forEach(function (pts, k) {
            var m = punti[k]; m.visible = false;
            for (var i = 1; i < pts.length; i++) if ((pts[i - 1][2] - tau) * (pts[i][2] - tau) <= 0) { var u = (tau - pts[i - 1][2]) / ((pts[i][2] - pts[i - 1][2]) || 1); m.position.set(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u, tau); m.visible = true; break; }
          });
          var ang = [[-4.5, -4.5], [4.5, -4.5], [4.5, 4.5], [-4.5, 4.5]].map(function (c) { return lorentz3(lorentz3([c[0], c[1], tau], -st.b), bVis); }), pa = simul.geometry.attributes.position;
          pa.setXYZ(0, ang[3][0], ang[3][1], ang[3][2]); pa.setXYZ(1, ang[2][0], ang[2][1], ang[2][2]); pa.setXYZ(2, ang[0][0], ang[0][1], ang[0][2]); pa.setXYZ(3, ang[1][0], ang[1][1], ang[1][2]); pa.needsUpdate = true; simul.geometry.computeBoundingSphere();
          S.didascalia.textContent = (st.vista === 'moto' ? t('vista da O′', 'seen from O′') : t('vista da O', 'seen from O')) + ' · β = ' + bVis.toFixed(2) + ' · ' + t('presente ', 'present ') + 'ct = ' + tau.toFixed(1);
        }
        cb.nuovo = function () { ricostruisci(); presente(); S.sporca = true; S.avvia(); };
        cb.nuovo();
        S.ogniFotogramma(function (dt) {
          var meta = st.vista === 'moto' ? st.b : 0;
          /* la trasformazione si vede: β della vista insegue quello scelto (anche se il moto e' fermo) */
          if (Math.abs(bVis - meta) > 1e-4) { bVis += (meta - bVis) * Math.min(1, dt * 2.5); if (Math.abs(bVis - meta) < 0.002) bVis = meta; ricostruisci(); presente(); if (S.fermo) return true; }
          if (S.fermo) return false;
          tau += dt * 1.0; if (tau > 4) tau = -4; presente();
          return true;
        });
        S.inquadra(16, -1.0, 1.25);
      }
    };
  }

  F.sezione('sfisrel', {
    titolo: ['⏱️ Relatività ristretta', '⏱️ Special relativity'],
    sotto: ['Il diagramma di Minkowski con la relatività della simultaneità e l’intervallo invariante, il paradosso dei gemelli con i segnali luminosi, la dinamica relativistica, la composizione delle velocità e l’effetto Doppler.', 'The Minkowski diagram with the relativity of simultaneity and the invariant interval, the twin paradox with light signals, relativistic dynamics, velocity addition and the Doppler effect.'],
    schede: [
      { nome: ['📐 Minkowski', '📐 Minkowski'], costruisci: schedaMinkowski },
      { nome: ['👯 Gemelli', '👯 Twins'], costruisci: schedaGemelli },
      { nome: ['⚡ Dinamica', '⚡ Dynamics'], costruisci: schedaDinamica },
      { nome: ['🔦 Cono di luce 3D', '🔦 3D light cone'], costruisci: scheda3D(schedaCono) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
