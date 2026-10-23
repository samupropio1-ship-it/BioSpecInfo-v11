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
     relativistico, E = mc² per particelle note.
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
  F.calcolo.relativita = { gamma: gamma, lorentz: lorentz, intervallo: intervallo, somma: somma, doppler: doppler, gemelli: gemelli };

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

  F.sezione('sfisrel', {
    titolo: ['⏱️ Relatività ristretta', '⏱️ Special relativity'],
    sotto: ['Il diagramma di Minkowski con la relatività della simultaneità e l’intervallo invariante, il paradosso dei gemelli con i segnali luminosi, la dinamica relativistica, la composizione delle velocità e l’effetto Doppler.', 'The Minkowski diagram with the relativity of simultaneity and the invariant interval, the twin paradox with light signals, relativistic dynamics, velocity addition and the Doppler effect.'],
    schede: [
      { nome: ['📐 Minkowski', '📐 Minkowski'], costruisci: schedaMinkowski },
      { nome: ['👯 Gemelli', '👯 Twins'], costruisci: schedaGemelli },
      { nome: ['⚡ Dinamica', '⚡ Dynamics'], costruisci: schedaDinamica }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
