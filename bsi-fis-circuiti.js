/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-circuiti.js — 🔌 circuiti
   BioSpecInfo · © Samuele Pio Provenzano

   · TRANSITORI: la risposta a un gradino di tensione di RC, RL e RLC serie.
     Nel RLC i tre regimi dipendono da ζ = (R/2)√(C/L): sottosmorzato
     (oscilla a ω_d = ω₀√(1 − ζ²)), critico (ζ = 1, il piu' rapido senza
     sovraelongazione), sovrasmorzato. Soluzioni in forma chiusa.
   · CORRENTE ALTERNATA: RLC serie alimentato a frequenza f; impedenza
     Z = R + j(ωL − 1/(ωC)), fase, i fasori che ruotano, la curva di
     risonanza con f₀ = 1/(2π√(LC)), il fattore di merito Q = ω₀L/R e la
     banda Δf = f₀/Q.
   · FILTRI: passa-basso e passa-alto RC, passa-banda RLC; il diagramma di
     Bode (modulo in dB e fase in funzione di log f) con la frequenza di
     taglio a −3 dB.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function pennello(c) {
    var dpr = Math.min(2, globale.devicePixelRatio || 1), w = Math.max(280, c.clientWidth || (c.parentNode && c.parentNode.clientWidth) || 600), h = Math.round(w * c._rapporto);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.fillStyle = '#081522'; q.fillRect(0, 0, w, h);
    return { q: q, W: w, H: h };
  }
  function anima(c, passo) {
    var vivo = true, prec = 0;
    function giro(ora) { if (!vivo || !c.isConnected) return; if (c.offsetParent !== null) { var dt = prec ? Math.min(0.05, (ora - prec) / 1000) : 0.016; prec = ora; if (passo(dt) === false) return; } else prec = 0; globale.requestAnimationFrame(giro); }
    globale.requestAnimationFrame(giro); return { ferma: function () { vivo = false; } };
  }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  /* potenze di dieci per i cursori logaritmici */
  function log10f(v) { return Math.pow(10, v); }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* RLC serie, gradino E all'istante 0, condensatore scarico, corrente nulla: v_C(t) e i(t) */
  function rlcGradino(R, L, C, E) {
    var w0 = 1 / Math.sqrt(L * C), z = R / 2 * Math.sqrt(C / L), a = z * w0, out = { w0: w0, zeta: z, alfa: a };
    if (z < 1 - 1e-9) { var wd = w0 * Math.sqrt(1 - z * z); out.regime = 'sotto'; out.wd = wd; out.vC = function (tt) { return E * (1 - Math.exp(-a * tt) * (Math.cos(wd * tt) + a / wd * Math.sin(wd * tt))); }; out.i = function (tt) { return E / (L * wd) * Math.exp(-a * tt) * Math.sin(wd * tt); }; out.sovra = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)); }
    else if (z > 1 + 1e-9) { var s = w0 * Math.sqrt(z * z - 1), s1 = -a + s, s2 = -a - s; out.regime = 'sovra'; out.vC = function (tt) { return E * (1 - (s2 * Math.exp(s1 * tt) - s1 * Math.exp(s2 * tt)) / (s2 - s1)); }; out.i = function (tt) { return E / (L * (s1 - s2)) * (Math.exp(s1 * tt) - Math.exp(s2 * tt)); }; out.sovra = 0; }
    else { out.regime = 'critico'; out.vC = function (tt) { return E * (1 - (1 + w0 * tt) * Math.exp(-w0 * tt)); }; out.i = function (tt) { return E / L * tt * Math.exp(-w0 * tt); }; out.sovra = 0; }
    return out;
  }
  function rcGradino(R, C, E) { var tau = R * C; return { tau: tau, vC: function (tt) { return E * (1 - Math.exp(-tt / tau)); }, i: function (tt) { return E / R * Math.exp(-tt / tau); } }; }
  function rlGradino(R, L, E) { var tau = L / R; return { tau: tau, i: function (tt) { return E / R * (1 - Math.exp(-tt / tau)); }, vL: function (tt) { return E * Math.exp(-tt / tau); } }; }
  /* impedenza di un RLC serie (C = 0 o L = 0 per toglierli) */
  function impedenza(R, L, C, f) { var w = 2 * Math.PI * f, X = (L ? w * L : 0) - (C ? 1 / (w * C) : 0); return { re: R, im: X, mod: Math.hypot(R, X), fase: Math.atan2(X, R) }; }
  /* risposta in frequenza dei filtri: guadagno complesso H(jω) */
  function filtro(tipo, R, L, C, f) {
    var w = 2 * Math.PI * f, re, im;
    if (tipo === 'pb') { var d = 1 + Math.pow(w * R * C, 2); re = 1 / d; im = -w * R * C / d; }
    else if (tipo === 'pa') { var d2 = 1 + Math.pow(w * R * C, 2), x = w * R * C; re = x * x / d2; im = x / d2; }
    else { /* passa-banda: uscita sulla resistenza di un RLC serie */ var X = w * L - 1 / (w * C), dd = R * R + X * X; re = R * R / dd; im = -R * X / dd; }
    var m = Math.hypot(re, im); return { mod: m, dB: 20 * Math.log10(m), fase: Math.atan2(im, re) * 180 / Math.PI };
  }
  F.calcolo.circuiti = { rlcGradino: rlcGradino, rcGradino: rcGradino, rlGradino: rlGradino, impedenza: impedenza, filtro: filtro };

  /* ═══ 1. transitori ═════════════════════════════════════════════════════ */
  function schedaTransitori(div) {
    var G = griglia(div), st = { tipo: 'rlc', R: 20, L: 10, C: 10, E: 10 }, info;
    /* unita': R in Ω, L in mH, C in μF */
    F.scelta(G.pan, ['Circuito', 'Circuit'], [['rc', 'RC'], ['rl', 'RL'], ['rlc', t('RLC serie', 'series RLC')]], st.tipo, function (v) { st.tipo = v; disegna(); });
    F.cursore(G.pan, ['R (Ω)', 'R (Ω)'], 1, 500, 1, st.R, function (v) { st.R = v; disegna(); });
    F.cursore(G.pan, ['L (mH)', 'L (mH)'], 1, 100, 1, st.L, function (v) { st.L = v; disegna(); });
    F.cursore(G.pan, ['C (μF)', 'C (μF)'], 1, 100, 1, st.C, function (v) { st.C = v; disegna(); });
    F.cursore(G.pan, ['E (V)', 'E (V)'], 1, 24, 1, st.E, function (v) { st.E = v; disegna(); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.58);
    function disegna() {
      var R = st.R, L = st.L * 1e-3, C = st.C * 1e-6, E = st.E, xs = [], a = [], b = [], Tm, et, testo;
      if (st.tipo === 'rc') { var S = rcGradino(R, C, E); Tm = 5 * S.tau; for (var i = 0; i <= 600; i++) { var u = Tm * i / 600; xs.push(u * 1000); a.push(S.vC(u)); b.push(S.i(u) * R); } et = [['v_C (V)', 'v_C (V)'], ['R·i (V)', 'R·i (V)']]; testo = 'τ = RC = <b>' + fmt(S.tau * 1000) + ' ms</b>; ' + t('dopo τ il condensatore è al 63,2 %, dopo 5τ al 99,3 %. Energia finale ½CE² = ', 'after τ the capacitor is at 63.2 %, after 5τ at 99.3 %. Final energy ½CE² = ') + fmt(0.5 * C * E * E * 1000) + ' mJ; ' + t('altrettanta se ne dissipa nella resistenza, qualunque sia R.', 'as much is dissipated in the resistor, whatever R.'); }
      else if (st.tipo === 'rl') { var S2 = rlGradino(R, L, E); Tm = 5 * S2.tau; for (i = 0; i <= 600; i++) { u = Tm * i / 600; xs.push(u * 1000); a.push(S2.i(u) * R); b.push(S2.vL(u)); } et = [['R·i (V)', 'R·i (V)'], ['v_L (V)', 'v_L (V)']]; testo = 'τ = L/R = <b>' + fmt(S2.tau * 1000) + ' ms</b>; ' + t('la corrente sale a E/R = ', 'the current rises to E/R = ') + fmt(E / R * 1000) + ' mA; ' + t('l’induttanza si oppone alle variazioni di corrente (v_L = L di/dt).', 'the inductor opposes changes of current (v_L = L di/dt).'); }
      else {
        var S3 = rlcGradino(R, L, C, E); Tm = Math.min(12 / (S3.alfa || S3.w0), 40 * 2 * Math.PI / S3.w0); for (i = 0; i <= 900; i++) { u = Tm * i / 900; xs.push(u * 1000); a.push(S3.vC(u)); b.push(S3.i(u) * R); } et = [['v_C (V)', 'v_C (V)'], ['R·i (V)', 'R·i (V)']];
        var reg = { sotto: t('sottosmorzato: oscilla', 'underdamped: oscillates'), critico: t('smorzamento critico', 'critically damped'), sovra: t('sovrasmorzato', 'overdamped') }[S3.regime];
        testo = 'ω₀ = 1/√(LC) = ' + fmt(S3.w0) + ' rad/s (f₀ = ' + fmt(S3.w0 / 2 / Math.PI) + ' Hz) · ζ = (R/2)√(C/L) = <b>' + fmt(S3.zeta) + '</b> → <b>' + reg + '</b>' + (S3.regime === 'sotto' ? '<br>ω_d = ω₀√(1 − ζ²) = ' + fmt(S3.wd) + ' rad/s · ' + t('sovraelongazione ', 'overshoot ') + 'e^(−πζ/√(1−ζ²)) = <b>' + fmt(S3.sovra * 100) + ' %</b>' : '') + '<br>' + t('Resistenza critica ', 'Critical resistance ') + 'R_c = 2√(L/C) = ' + fmt(2 * Math.sqrt(L / C)) + ' Ω. ' + t('È lo stesso oscillatore smorzato della meccanica: L ↔ massa, R ↔ attrito, 1/C ↔ costante elastica.', 'It is the same damped oscillator as in mechanics: L ↔ mass, R ↔ friction, 1/C ↔ spring constant.');
      }
      F.grafico(c, { serie: [{ x: xs, y: a, col: '#5eead4', larg: 2.2, etich: et[0] }, { x: xs, y: b, col: '#ff8a80', etich: et[1] }], linee: [{ y: E, col: '#34465f', etich: 'E' }], xl: ['t (ms)', 't (ms)'], yl: ['V', 'V'], legenda: [{ col: '#5eead4', etich: et[0] }, { col: '#ff8a80', etich: et[1] }] });
      info.innerHTML = testo;
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. corrente alternata ═════════════════════════════════════════════ */
  function schedaAlternata(div) {
    var G = griglia(div), st = { R: 50, L: 100, C: 10, f: 159, V: 10 }, info, tt = 0;
    F.cursore(G.pan, ['R (Ω)', 'R (Ω)'], 5, 500, 5, st.R, function (v) { st.R = v; aggiorna(); });
    F.cursore(G.pan, ['L (mH)', 'L (mH)'], 10, 500, 10, st.L, function (v) { st.L = v; aggiorna(); });
    F.cursore(G.pan, ['C (μF)', 'C (μF)'], 1, 100, 1, st.C, function (v) { st.C = v; aggiorna(); });
    F.cursore(G.pan, ['f (Hz)', 'f (Hz)'], 10, 1000, 1, st.f, function (v) { st.f = v; aggiorna(); });
    info = nota(G.pan);
    var cf = F.tela(G.dx, 0.42), cr = F.tela(G.dx, 0.42);
    function aggiorna() {
      var R = st.R, L = st.L * 1e-3, C = st.C * 1e-6, Z = impedenza(R, L, C, st.f), f0 = 1 / (2 * Math.PI * Math.sqrt(L * C)), Q = 2 * Math.PI * f0 * L / R, I = st.V / Z.mod;
      info.innerHTML = 'Z = R + j(ωL − 1/ωC) = ' + fmt(R) + (Z.im >= 0 ? ' + j' : ' − j') + fmt(Math.abs(Z.im)) + ' Ω · |Z| = <b class="bsiFX-num">' + fmt(Z.mod) + ' Ω</b><br>' + t('fase ', 'phase ') + 'φ = <b>' + fmt(Z.fase * 180 / Math.PI) + '°</b> (' + (Z.im > 0 ? t('induttivo: la corrente è in ritardo', 'inductive: current lags') : Z.im < 0 ? t('capacitivo: la corrente è in anticipo', 'capacitive: current leads') : t('resistivo', 'resistive')) + ') · I = V/|Z| = ' + fmt(I * 1000) + ' mA (V = ' + st.V + ' V)<br>' +
        t('Risonanza ', 'Resonance ') + 'f₀ = 1/(2π√(LC)) = <b>' + fmt(f0) + ' Hz</b> · Q = ω₀L/R = <b>' + fmt(Q) + '</b> · ' + t('banda ', 'bandwidth ') + 'Δf = f₀/Q = ' + fmt(f0 / Q) + ' Hz<br>' + t('Potenza media ', 'Average power ') + 'P = ½ I² R = ' + fmt(0.5 * I * I * R * 1000) + ' mW · ' + t('fattore di potenza cos φ = ', 'power factor cos φ = ') + fmt(Math.cos(Z.fase));
      /* curva di risonanza */
      var xs = [], ys = [], fm = Math.max(st.f, f0) * 3; for (var i = 1; i <= 600; i++) { var f = fm * i / 600; xs.push(f); ys.push(st.V / impedenza(R, L, C, f).mod * 1000); }
      F.grafico(cr, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2, etich: 'I' }], punti: [{ x: st.f, y: I * 1000, col: '#ffd24a', r: 5 }], xl: ['f (Hz)', 'f (Hz)'], yl: ['I (mA)', 'I (mA)'], ymin: 0 });
    }
    aggiorna();
    anima(cf, function (dt) {
      tt += dt;
      var R = st.R, L = st.L * 1e-3, C = st.C * 1e-6, Z = impedenza(R, L, C, st.f), I = st.V / Z.mod, w = 2 * Math.PI * 0.5; /* i fasori ruotano lentamente: 0,5 giri al secondo, solo per vederli */
      var P = pennello(cf), q = P.q, W = P.W, H = P.H, cx = H * 0.5 + 10, cy = H / 2, sc = H * 0.4 / Math.max(st.V, I * R, I * 2 * Math.PI * st.f * L, I / (2 * Math.PI * st.f * C)), ang = w * tt;
      q.strokeStyle = '#1d2f49'; q.beginPath(); q.arc(cx, cy, H * 0.42, 0, Math.PI * 2); q.stroke();
      function fasore(mod, fase, col, nome) { var a = ang + fase, x = cx + mod * sc * Math.cos(a), y = cy - mod * sc * Math.sin(a); q.strokeStyle = col; q.fillStyle = col; q.lineWidth = 2.5; q.beginPath(); q.moveTo(cx, cy); q.lineTo(x, y); q.stroke(); q.beginPath(); q.arc(x, y, 3.5, 0, Math.PI * 2); q.fill(); q.font = '11px system-ui'; q.fillText(nome, x + 5, y - 4); return [x, y]; }
      fasore(st.V, 0, '#ffd24a', 'V');
      fasore(I * R, -Z.fase, '#5eead4', 'V_R');
      fasore(I * 2 * Math.PI * st.f * L, -Z.fase + Math.PI / 2, '#ff8a80', 'V_L');
      fasore(I / (2 * Math.PI * st.f * C), -Z.fase - Math.PI / 2, '#6bcfff', 'V_C');
      /* a destra i segnali nel tempo */
      var x0 = 2 * cx + 10, Wd = W - x0 - 10;
      q.strokeStyle = '#1d2f49'; q.beginPath(); q.moveTo(x0, cy); q.lineTo(W - 10, cy); q.stroke();
      [[st.V, 0, '#ffd24a'], [I * R, -Z.fase, '#5eead4']].forEach(function (s) { q.strokeStyle = s[2]; q.lineWidth = 1.8; q.beginPath(); for (var i = 0; i <= 200; i++) { var u = i / 200 * 2 * Math.PI * 2, y = cy - s[0] * sc * Math.sin(ang - u + s[1]); if (i) q.lineTo(x0 + Wd * i / 200, y); else q.moveTo(x0, y); } q.stroke(); });
      cf.setAttribute('aria-label', t('fasori del circuito RLC', 'RLC circuit phasors'));
    });
  }

  /* ═══ 3. filtri ═════════════════════════════════════════════════════════ */
  function schedaFiltri(div) {
    var G = griglia(div), st = { tipo: 'pb', R: 1000, C: 0.1, L: 10 }, info;
    F.scelta(G.pan, ['Filtro', 'Filter'], [['pb', t('Passa-basso RC (uscita su C)', 'RC low-pass (output on C)')], ['pa', t('Passa-alto RC (uscita su R)', 'RC high-pass (output on R)')], ['bp', t('Passa-banda RLC (uscita su R)', 'RLC band-pass (output on R)')]], st.tipo, function (v) { st.tipo = v; disegna(); });
    F.cursore(G.pan, ['R (Ω)', 'R (Ω)'], 10, 10000, 10, st.R, function (v) { st.R = v; disegna(); });
    F.cursore(G.pan, ['C (μF)', 'C (μF)'], 0.01, 10, 0.01, st.C, function (v) { st.C = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['L (mH, solo passa-banda)', 'L (mH, band-pass only)'], 1, 1000, 1, st.L, function (v) { st.L = v; disegna(); });
    info = nota(G.pan);
    var cm = F.tela(G.dx, 0.42), cp = F.tela(G.dx, 0.32);
    function disegna() {
      var R = st.R, C = st.C * 1e-6, L = st.L * 1e-3, fc = st.tipo === 'bp' ? 1 / (2 * Math.PI * Math.sqrt(L * C)) : 1 / (2 * Math.PI * R * C), xs = [], db = [], ph = [];
      for (var i = 0; i <= 600; i++) { var lf = Math.log10(fc) - 3 + 6 * i / 600, r = filtro(st.tipo, R, L, C, Math.pow(10, lf)); xs.push(lf); db.push(Math.max(-80, r.dB)); ph.push(r.fase); }
      F.grafico(cm, { serie: [{ x: xs, y: db, col: '#5eead4', larg: 2, etich: '|H|' }], linee: [{ y: -3, col: '#ffd24a', etich: '−3 dB' }], xl: ['log₁₀ f (Hz)', 'log₁₀ f (Hz)'], yl: ['|H| (dB)', '|H| (dB)'], ymax: 3, ymin: -80 });
      F.grafico(cp, { serie: [{ x: xs, y: ph, col: '#ff8a80', larg: 2, etich: 'φ' }], xl: ['log₁₀ f (Hz)', 'log₁₀ f (Hz)'], yl: ['φ (°)', 'φ (°)'], ymin: -95, ymax: 95 });
      var r3 = filtro(st.tipo, R, L, C, fc);
      if (st.tipo === 'bp') { var Q = 2 * Math.PI * fc * L / R; info.innerHTML = t('Centro banda ', 'Centre frequency ') + 'f₀ = 1/(2π√(LC)) = <b class="bsiFX-num">' + fmt(fc) + ' Hz</b> · Q = ω₀L/R = <b>' + fmt(Q) + '</b> · ' + t('banda a −3 dB ', '−3 dB bandwidth ') + 'Δf = f₀/Q = ' + fmt(fc / Q) + ' Hz<br>' + t('A f₀ le reattanze si annullano e il guadagno è 1 (0 dB); lontano dalla banda scende di 20 dB per decade da ciascun lato.', 'At f₀ the reactances cancel and the gain is 1 (0 dB); far from the band it falls by 20 dB per decade on each side.'); }
      else info.innerHTML = t('Frequenza di taglio ', 'Cut-off frequency ') + 'f_c = 1/(2πRC) = <b class="bsiFX-num">' + fmt(fc) + ' Hz</b><br>' + t('A f_c: ', 'At f_c: ') + '|H| = 1/√2 = <b>' + fmt(r3.dB) + ' dB</b>, φ = <b>' + fmt(r3.fase) + '°</b><br>' + (st.tipo === 'pb' ? t('Sopra f_c il guadagno cade di 20 dB per decade: un segnale 10 volte più veloce esce 10 volte più piccolo. Si usa per togliere il rumore ad alta frequenza da un segnale strumentale.', 'Above f_c the gain falls 20 dB per decade: a signal 10 times faster comes out 10 times smaller. It is used to remove high-frequency noise from an instrument signal.') : t('Sotto f_c il guadagno cade di 20 dB per decade: si toglie la componente continua e le derive lente.', 'Below f_c the gain falls 20 dB per decade: it removes the DC component and slow drifts.'));
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('sfiscirc', {
    titolo: ['🔌 Circuiti', '🔌 Circuits'],
    sotto: ['I transitori di RC, RL e RLC con i tre regimi, la corrente alternata con i fasori e la risonanza, i filtri con il diagramma di Bode.', 'RC, RL and RLC transients with the three regimes, alternating current with phasors and resonance, filters with the Bode plot.'],
    schede: [
      { nome: ['⚡ Transitori', '⚡ Transients'], costruisci: schedaTransitori },
      { nome: ['🔄 Corrente alternata', '🔄 Alternating current'], costruisci: schedaAlternata },
      { nome: ['🎚️ Filtri e Bode', '🎚️ Filters and Bode'], costruisci: schedaFiltri }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
