/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-solido.js — 💡 semiconduttori
   BioSpecInfo · © Samuele Pio Provenzano

   · BANDE E PORTATORI: la distribuzione di Fermi-Dirac a varie temperature;
     la concentrazione intrinseca n_i = √(N_c N_v) e^(−E_g/2kT) per Si, Ge e
     GaAs, con N_c, N_v ∝ T^(3/2) e la banda proibita E_g(T) di Varshni;
   · DROGAGGIO: donatori o accettori; i portatori maggioritari e
     minoritari (n p = n_i²), il livello di Fermi E_F − E_i = kT ln(n/n_i),
     la conducibilita' σ = q(nμ_n + pμ_p);
   · GIUNZIONE P-N E LED: il potenziale di contatto
     V_bi = (kT/q) ln(N_a N_d / n_i²), la zona di svuotamento, la
     caratteristica di Shockley I = I₀(e^(V/V_T) − 1); in polarizzazione
     diretta elettroni e lacune si ricombinano emettendo fotoni di energia
     ≈ E_g: il colore dei LED, λ = hc/E_g.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, k = 8.617333262e-5, q = 1.602176634e-19, eps0 = 8.8541878128e-14; /* F/cm */
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* materiali: Varshni (E_g0, α, β), N_c e N_v a 300 K (cm⁻³), mobilita' (cm²/Vs), εr */
  var MATERIALI = {
    Si: { nome: ['silicio', 'silicon'], Eg0: 1.166, a: 4.73e-4, b: 636, Nc: 2.86e19, Nv: 2.66e19, mn: 1400, mp: 450, er: 11.7 },
    Ge: { nome: ['germanio', 'germanium'], Eg0: 0.7437, a: 4.774e-4, b: 235, Nc: 1.04e19, Nv: 6.0e18, mn: 3900, mp: 1900, er: 16 },
    GaAs: { nome: ['arseniuro di gallio', 'gallium arsenide'], Eg0: 1.519, a: 5.405e-4, b: 204, Nc: 4.7e17, Nv: 9.0e18, mn: 8500, mp: 400, er: 12.9 }
  };
  function Eg(m, T) { return m.Eg0 - m.a * T * T / (T + m.b); }
  function ni(m, T) { var r = Math.pow(T / 300, 1.5); return Math.sqrt(m.Nc * r * m.Nv * r) * Math.exp(-Eg(m, T) / (2 * k * T)); }
  function fermiDirac(E, EF, T) { return 1 / (1 + Math.exp((E - EF) / (k * T))); }
  function drogaggio(m, T, Nd, Na) {
    var n_i = ni(m, T), N = Nd - Na, n = N / 2 + Math.sqrt(N * N / 4 + n_i * n_i), p = n_i * n_i / n;
    return { ni: n_i, n: n, p: p, EF: k * T * Math.log(n / n_i), sigma: q * (n * m.mn + p * m.mp), rho: 1 / (q * (n * m.mn + p * m.mp)) };
  }
  function giunzione(m, T, Na, Nd) {
    var n_i = ni(m, T), VT = k * T, Vbi = VT * Math.log(Na * Nd / (n_i * n_i)), W = Math.sqrt(2 * m.er * eps0 * Vbi * (Na + Nd) / (q * Na * Nd));
    return { Vbi: Vbi, W: W, VT: VT };
  }
  function shockley(V, I0, VT, nid) { return I0 * (Math.exp(V / ((nid || 1) * VT)) - 1); }
  var LED = [['GaAs (infrarosso, telecomandi)', 'GaAs (infrared, remote controls)', 1.42], ['AlGaInP (rosso)', 'AlGaInP (red)', 1.9], ['GaAsP (arancione)', 'GaAsP (orange)', 2.0], ['GaP (verde)', 'GaP (green)', 2.26], ['InGaN (blu)', 'InGaN (blue)', 2.75], ['GaN (ultravioletto)', 'GaN (ultraviolet)', 3.4]];
  F.calcolo.solido = { MATERIALI: MATERIALI, Eg: Eg, ni: ni, fermiDirac: fermiDirac, drogaggio: drogaggio, giunzione: giunzione, shockley: shockley, LED: LED };

  /* ═══ 1. bande e portatori ══════════════════════════════════════════════ */
  function schedaBande(div) {
    var G = griglia(div), st = { m: 'Si', T: 300 }, info = nota(G.pan);
    F.scelta(G.pan, ['Materiale', 'Material'], Object.keys(MATERIALI).map(function (k2) { return [k2, k2 + ' — ' + F.tt(MATERIALI[k2].nome)]; }), st.m, function (v) { st.m = v; disegna(); });
    F.cursore(G.pan, ['temperatura (K)', 'temperature (K)'], 100, 600, 5, st.T, function (v) { st.T = v; disegna(); });
    G.pan.appendChild(info);
    var cf = F.tela(G.dx, 0.42), cn = F.tela(G.dx, 0.42);
    function disegna() {
      var m = MATERIALI[st.m], Egv = Eg(m, st.T), xs = [], ys = [], ys2 = [], ys3 = [];
      for (var i = 0; i <= 300; i++) { var E = -0.3 + 0.6 * i / 300; xs.push(E); ys.push(fermiDirac(E, 0, st.T)); ys2.push(fermiDirac(E, 0, 77)); ys3.push(fermiDirac(E, 0, 1000)); }
      F.grafico(cf, { serie: [{ x: xs, y: ys2, col: '#6bcfff', etich: '77 K' }, { x: xs, y: ys, col: '#5eead4', larg: 2.5, etich: st.T + ' K' }, { x: xs, y: ys3, col: '#ff8a80', etich: '1000 K' }], xl: ['E − E_F (eV)', 'E − E_F (eV)'], yl: ['f(E)', 'f(E)'], ymin: 0, ymax: 1.05, legenda: [{ col: '#6bcfff', etich: '77 K' }, { col: '#5eead4', etich: st.T + ' K' }, { col: '#ff8a80', etich: '1000 K' }] });
      var X = [], Ys = []; Object.keys(MATERIALI).forEach(function () { }); var serie = [];
      Object.keys(MATERIALI).forEach(function (k2, j) { var mm = MATERIALI[k2], xx = [], yy = []; for (var T = 150; T <= 700; T += 5) { xx.push(1000 / T); yy.push(Math.log10(ni(mm, T))); } serie.push({ x: xx, y: yy, col: ['#5eead4', '#ffd24a', '#ff8a80'][j], larg: k2 === st.m ? 3 : 1.5, etich: k2 }); });
      F.grafico(cn, { serie: serie, punti: [{ x: 1000 / st.T, y: Math.log10(ni(m, st.T)), col: '#fff', r: 5 }], xl: ['1000/T (K⁻¹)', '1000/T (K⁻¹)'], yl: ['log₁₀ n_i (cm⁻³)', 'log₁₀ n_i (cm⁻³)'], legenda: serie.map(function (s) { return { col: s.col, etich: s.etich }; }) });
      info.innerHTML = 'E_g(' + st.T + ' K) = <b class="bsiFX-num">' + fmt(Egv) + ' eV</b> (Varshni) · n_i = <b class="bsiFX-num">' + ni(m, st.T).toExponential(2) + ' cm⁻³</b><br>' + t('Nel silicio a 300 K un elettrone ogni ', 'In silicon at 300 K one electron in ') + fmt(5e22 / ni(MATERIALI.Si, 300) / 1e12) + t(' mila miliardi di atomi è in banda di conduzione: per questo il silicio puro conduce poco e si droga.', ' trillion atoms is in the conduction band: that is why pure silicon conducts little and is doped.') + '<br>' + t('La retta log n_i contro 1/T ha pendenza −E_g/(2k ln 10): dalla misura di n_i(T) si ricava la banda proibita, come Arrhenius per l’energia di attivazione.', 'The line log n_i vs 1/T has slope −E_g/(2k ln 10): measuring n_i(T) gives the band gap, like Arrhenius for the activation energy.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. drogaggio ══════════════════════════════════════════════════════ */
  function schedaDrogaggio(div) {
    var G = griglia(div), st = { m: 'Si', T: 300, tipo: 'n', N: 16 }, info = nota(G.pan);
    F.scelta(G.pan, ['Materiale', 'Material'], Object.keys(MATERIALI).map(function (k2) { return [k2, k2]; }), st.m, function (v) { st.m = v; disegna(); });
    F.scelta(G.pan, ['Drogante', 'Dopant'], [['n', t('donatore (P, As): tipo n', 'donor (P, As): n-type')], ['p', t('accettore (B, Ga): tipo p', 'acceptor (B, Ga): p-type')]], st.tipo, function (v) { st.tipo = v; disegna(); });
    F.cursore(G.pan, ['log₁₀ concentrazione del drogante (cm⁻³)', 'log₁₀ dopant concentration (cm⁻³)'], 12, 19, 0.1, st.N, function (v) { st.N = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['temperatura (K)', 'temperature (K)'], 200, 600, 5, st.T, function (v) { st.T = v; disegna(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6);
    function disegna() {
      var m = MATERIALI[st.m], N = Math.pow(10, st.N), D = drogaggio(m, st.T, st.tipo === 'n' ? N : 0, st.tipo === 'p' ? N : 0), Egv = Eg(m, st.T);
      var P = F.pennello(cv), qq = P.q, W = P.W, H = P.H, Ec = H * 0.25, Ev = H * 0.75, Ei = (Ec + Ev) / 2, EF = Ei - D.EF / (Egv) * (Ev - Ec) * -1;
      qq.fillStyle = 'rgba(107,207,255,.2)'; qq.fillRect(20, 10, W - 40, Ec - 10); qq.fillStyle = 'rgba(255,138,128,.2)'; qq.fillRect(20, Ev, W - 40, H - Ev - 10);
      qq.strokeStyle = '#6bcfff'; qq.lineWidth = 2; qq.beginPath(); qq.moveTo(20, Ec); qq.lineTo(W - 20, Ec); qq.stroke(); qq.strokeStyle = '#ff8a80'; qq.beginPath(); qq.moveTo(20, Ev); qq.lineTo(W - 20, Ev); qq.stroke(); qq.lineWidth = 1;
      qq.strokeStyle = 'rgba(201,211,223,.5)'; qq.setLineDash([3, 4]); qq.beginPath(); qq.moveTo(20, Ei); qq.lineTo(W - 20, Ei); qq.stroke(); qq.setLineDash([]);
      var yF = Ei - D.EF / Egv * (Ev - Ec); qq.strokeStyle = '#ffd24a'; qq.lineWidth = 2; qq.beginPath(); qq.moveTo(20, yF); qq.lineTo(W - 20, yF); qq.stroke(); qq.lineWidth = 1;
      qq.fillStyle = '#c9d3df'; qq.font = '12px system-ui'; qq.fillText('E_c', W - 46, Ec - 4); qq.fillText('E_v', W - 46, Ev + 14); qq.fillText('E_i', 24, Ei - 4); qq.fillStyle = '#ffd24a'; qq.fillText('E_F', 24, yF - 4);
      /* portatori disegnati in proporzione logaritmica */
      var ne = Math.max(0, Math.min(60, Math.round(6 * Math.log10(D.n / 1e8)))), nh = Math.max(0, Math.min(60, Math.round(6 * Math.log10(D.p / 1e8))));
      for (var i = 0; i < ne; i++) { qq.fillStyle = '#6bcfff'; qq.beginPath(); qq.arc(40 + (i * 37 % (W - 80)), Ec - 10 - (i * 13 % Math.max(10, Ec - 30)), 3, 0, Math.PI * 2); qq.fill(); }
      for (i = 0; i < nh; i++) { qq.strokeStyle = '#ff8a80'; qq.beginPath(); qq.arc(40 + (i * 41 % (W - 80)), Ev + 10 + (i * 11 % Math.max(10, H - Ev - 30)), 3, 0, Math.PI * 2); qq.stroke(); }
      cv.setAttribute('aria-label', t('diagramma a bande con il livello di Fermi', 'band diagram with the Fermi level'));
      info.innerHTML = 'n = <b class="bsiFX-num">' + D.n.toExponential(2) + '</b> cm⁻³ · p = <b class="bsiFX-num">' + D.p.toExponential(2) + '</b> cm⁻³ · n·p = n_i² = ' + (D.ni * D.ni).toExponential(2) + '<br>E_F − E_i = kT ln(n/n_i) = <b>' + fmt(D.EF) + ' eV</b> (' + (D.EF > 0 ? t('verso la banda di conduzione', 'towards the conduction band') : t('verso la banda di valenza', 'towards the valence band')) + ')<br>σ = q(nμ_n + pμ_p) = ' + fmt(D.sigma) + ' S/cm · ρ = <b>' + fmt(D.rho) + ' Ω·cm</b><br>' + t('Un atomo di drogante ogni milione di atomi di silicio (5·10¹⁶ cm⁻³) abbassa la resistività di centomila volte. I maggioritari sono fissati dal drogaggio, i minoritari da n_i²: è la legge di azione di massa, come [H⁺][OH⁻] = K_w.', 'One dopant atom per million silicon atoms (5·10¹⁶ cm⁻³) lowers resistivity a hundred-thousand-fold. Majority carriers are set by doping, minority carriers by n_i²: it is the law of mass action, like [H⁺][OH⁻] = K_w.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. giunzione p-n e LED ════════════════════════════════════════════ */
  function schedaGiunzione(div) {
    var G = griglia(div), st = { V: 0.65, led: 3, Na: 16, Nd: 16 }, info = nota(G.pan), parti = [];
    F.cursore(G.pan, ['tensione applicata V (V)', 'applied voltage V (V)'], -1, 0.8, 0.01, st.V, function (v) { st.V = v; testo(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['log₁₀ N_a = log₁₀ N_d (cm⁻³)', 'log₁₀ N_a = log₁₀ N_d (cm⁻³)'], 14, 18, 0.1, st.Na, function (v) { st.Na = st.Nd = v; testo(); }, function (v) { return v.toFixed(1); });
    F.scelta(G.pan, ['LED', 'LED'], LED.map(function (l, i) { return [String(i), F.tt([l[0], l[1]])]; }), String(st.led), function (v) { st.led = +v; testo(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.5), ci = F.tela(G.dx, 0.4);
    function testo() {
      var m = MATERIALI.Si, J = giunzione(m, 300, Math.pow(10, st.Na), Math.pow(10, st.Nd)), I0 = 1e-12, I = shockley(st.V, I0, J.VT), xs = [], ys = [];
      for (var i = 0; i <= 200; i++) { var v = -0.4 + 1.2 * i / 200; xs.push(v); ys.push(Math.max(-1e-9, shockley(v, I0, J.VT)) * 1000); }
      F.grafico(ci, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2, etich: 'I(V)' }], punti: [{ x: st.V, y: Math.max(-1e-9, I) * 1000, col: '#ffd24a', r: 5 }], xl: ['V (V)', 'V (V)'], yl: ['I (mA)', 'I (mA)'], ymin: -1, ymax: 25 });
      var l = LED[st.led], lam = 1239.84 / l[2];
      info.innerHTML = t('Silicio: ', 'Silicon: ') + 'V_bi = (kT/q) ln(N_aN_d/n_i²) = <b class="bsiFX-num">' + fmt(J.Vbi) + ' V</b> · ' + t('zona di svuotamento ', 'depletion width ') + 'W = <b>' + fmt(J.W * 1e4) + ' μm</b><br>Shockley: I = I₀(e^(V/V_T) − 1), V_T = kT/q = ' + fmt(J.VT * 1000) + ' mV · I = ' + (Math.abs(I) < 1e-6 ? I.toExponential(2) + ' A' : fmt(I * 1000) + ' mA') + '<br>' + t('In diretta la corrente cresce di un fattore 10 ogni ', 'In forward bias current grows by a factor 10 every ') + fmt(J.VT * Math.LN10 * 1000) + ' mV; ' + t('in inversa resta −I₀: il diodo raddrizza.', 'in reverse it stays at −I₀: the diode rectifies.') + '<br>LED ' + F.tt([l[0], l[1]]) + ': E_g ≈ ' + l[2] + ' eV → λ = hc/E_g = <b>' + fmt(lam) + ' nm</b>';
    }
    testo();
    F.anima(cv, function (dt) {
      var P = F.pennello(cv), qq = P.q, W = P.W, H = P.H, mid = W / 2, l = LED[st.led], lam = 1239.84 / l[2], col = F.calcolo.onde ? F.calcolo.onde.coloreLambda(Math.min(750, Math.max(380, lam))) : [1, 1, 1], cs = 'rgb(' + col.map(function (v) { return Math.round(v * 255); }).join(',') + ')';
      qq.fillStyle = 'rgba(255,138,128,.12)'; qq.fillRect(10, 20, mid - 10, H - 40); qq.fillStyle = 'rgba(107,207,255,.12)'; qq.fillRect(mid, 20, mid - 10, H - 40);
      var Wd = Math.max(8, 60 * Math.sqrt(Math.max(0.05, 0.75 - st.V) / 0.75)); qq.fillStyle = 'rgba(201,211,223,.08)'; qq.fillRect(mid - Wd / 2, 20, Wd, H - 40);
      qq.fillStyle = '#9fb1c6'; qq.font = '12px system-ui'; qq.fillText('p', 20, 16); qq.fillText('n', W - 26, 16);
      /* in diretta elettroni (n → sinistra) e lacune (p → destra) attraversano e si ricombinano al centro emettendo luce */
      var flusso = st.V > 0 ? Math.min(6, Math.exp((st.V - 0.55) / 0.04)) : 0;
      for (var k2 = 0; k2 < Math.round(flusso * dt * 60) && parti.length < 160; k2++) { parti.push({ x: W - 20, y: 30 + Math.random() * (H - 60), e: true, v: -60 - 40 * Math.random() }); parti.push({ x: 20, y: 30 + Math.random() * (H - 60), e: false, v: 60 + 40 * Math.random() }); }
      parti = parti.filter(function (p) { p.x += p.v * dt; if (p.lampo) { p.lampo -= dt; return p.lampo > 0; } if (Math.abs(p.x - mid) < Wd / 2 && Math.random() < 0.08) { p.lampo = 0.35; return true; } return p.x > 0 && p.x < W; });
      parti.forEach(function (p) { if (p.lampo) { qq.fillStyle = cs; qq.globalAlpha = Math.min(1, p.lampo * 3); qq.beginPath(); qq.arc(p.x, p.y, 8 * (1 - p.lampo), 0, Math.PI * 2); qq.fill(); qq.globalAlpha = 1; return; } if (p.e) { qq.fillStyle = '#6bcfff'; qq.beginPath(); qq.arc(p.x, p.y, 3, 0, Math.PI * 2); qq.fill(); } else { qq.strokeStyle = '#ff8a80'; qq.beginPath(); qq.arc(p.x, p.y, 3, 0, Math.PI * 2); qq.stroke(); } });
      qq.fillStyle = '#c9d3df'; qq.fillText(st.V > 0.5 ? t('polarizzazione diretta: ricombinazione e luce', 'forward bias: recombination and light') : st.V < 0 ? t('inversa: la zona di svuotamento si allarga, niente corrente', 'reverse: the depletion zone widens, no current') : t('sotto la soglia: quasi nessuna corrente', 'below threshold: almost no current'), 20, H - 6);
      cv.setAttribute('aria-label', t('giunzione p-n con portatori che si ricombinano', 'p-n junction with recombining carriers'));
    });
  }

  F.sezione('sfissolido', {
    titolo: ['💡 Semiconduttori', '💡 Semiconductors'],
    sotto: ['La distribuzione di Fermi-Dirac e i portatori intrinseci di Si, Ge e GaAs; il drogaggio, il livello di Fermi e la conducibilità; la giunzione p-n, la caratteristica di Shockley e il colore dei LED.', 'The Fermi-Dirac distribution and intrinsic carriers of Si, Ge and GaAs; doping, the Fermi level and conductivity; the p-n junction, the Shockley characteristic and the colour of LEDs.'],
    schede: [
      { nome: ['📶 Bande e portatori', '📶 Bands and carriers'], costruisci: schedaBande },
      { nome: ['🧂 Drogaggio', '🧂 Doping'], costruisci: schedaDrogaggio },
      { nome: ['💡 Giunzione p-n e LED', '💡 p-n junction and LEDs'], costruisci: schedaGiunzione }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
