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
     ≈ E_g: il colore dei LED, λ = hc/E_g;
   · ZONA DI BRILLOUIN 3D (v238): l'ottaedro troncato dell'fcc con le valli
     di conduzione (ellissoidi di massa efficace) e la nuvola termica; la N_c
     ricavata dalle masse delle valli contro la tabella dei materiali.
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
  /* v238 — le valli della banda di conduzione nella zona di Brillouin del reticolo cubico a facce
     centrate (diamante e blenda). Coordinate k in unita' di 2π/a. Masse efficaci in m₀: longitudinale
     m_l (lungo l'asse della valle) e trasversa m_t; M_c valli equivalenti; m_h lacuna pesante.
     · Si: sei valli lungo Δ, a 0,85 della distanza Γ-X (gap indiretto);
     · Ge: otto mezze valli nei punti L, cioe' quattro valli intere (gap indiretto);
     · GaAs: una valle sferica in Γ (gap diretto: emette luce). */
  var VALLI = {
    Si: { dove: 'Δ', ml: 0.98, mt: 0.19, Mc: 6, a: 5.431, mh: 0.49, centri: [[0.85, 0, 0], [-0.85, 0, 0], [0, 0.85, 0], [0, -0.85, 0], [0, 0, 0.85], [0, 0, -0.85]] },
    Ge: { dove: 'L', ml: 1.64, mt: 0.082, Mc: 4, a: 5.658, mh: 0.33, centri: [[0.5, 0.5, 0.5], [-0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, -0.5, -0.5]] },
    GaAs: { dove: 'Γ', ml: 0.067, mt: 0.067, Mc: 1, a: 5.653, mh: 0.45, centri: [[0, 0, 0]] }
  };
  var M0 = 9.1093837015e-31, KB = 1.380649e-23, HP = 6.62607015e-34, HB = HP / (2 * Math.PI);
  /* massa efficace di densita' degli stati: M_c^(2/3) (m_l m_t²)^(1/3) */
  function massaDensita(v) { return Math.pow(v.Mc * v.Mc * v.ml * v.mt * v.mt, 1 / 3); }
  /* densita' efficace degli stati N = 2 (2π m* kT / h²)^(3/2), in cm⁻³ */
  function densitaStati(mStar, T) { return 2 * Math.pow(2 * Math.PI * mStar * M0 * KB * T / (HP * HP), 1.5) / 1e6; }
  /* l'ampiezza termica della nuvola di elettroni nella valle lungo una direzione di massa m:
     σ_k = √(m kT)/ħ (distribuzione di Maxwell-Boltzmann in k), in unita' di 2π/a */
  function sigmaK(m, T, aAng) { return Math.sqrt(m * M0 * KB * T) / HB / (2 * Math.PI / (aAng * 1e-10)); }
  /* la prima zona di Brillouin dell'fcc (ottaedro troncato): |kx| + |ky| + |kz| ≤ 3/2 e |k_i| ≤ 1.
     Vertici: le permutazioni di (0, ±½, ±1) (punti W); spigoli lunghi √2/2 */
  function zonaBrillouin() {
    var V = [], E = [], i, j;
    [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].forEach(function (pr) { [-0.5, 0.5].forEach(function (b) { [-1, 1].forEach(function (c) { var v = [0, 0, 0]; v[pr[1]] = b; v[pr[2]] = c; v[pr[0]] = 0; V.push(v); }); }); });
    var uni = []; V.forEach(function (v) { if (!uni.some(function (u) { return u[0] === v[0] && u[1] === v[1] && u[2] === v[2]; })) uni.push(v); });
    for (i = 0; i < uni.length; i++) for (j = i + 1; j < uni.length; j++) if (Math.abs(Math.hypot(uni[i][0] - uni[j][0], uni[i][1] - uni[j][1], uni[i][2] - uni[j][2]) - Math.SQRT1_2) < 1e-9) E.push([i, j]);
    return { V: uni, E: E };
  }
  function nellaZona(k) { return Math.abs(k[0]) + Math.abs(k[1]) + Math.abs(k[2]) <= 1.5 + 1e-12 && Math.max(Math.abs(k[0]), Math.abs(k[1]), Math.abs(k[2])) <= 1 + 1e-12; }
  /* un passo di Ornstein-Uhlenbeck: gli urti con i fononi rimescolano k mantenendo la distribuzione
     di equilibrio N(0, σ²) — e' la nuvola che «respira» nell'animazione */
  function passoOU(k, sigma, dt, tau, gauss) { var f = Math.exp(-dt / tau), q = sigma * Math.sqrt(1 - f * f); return k * f + q * gauss(); }
  F.calcolo.solido = { MATERIALI: MATERIALI, Eg: Eg, ni: ni, fermiDirac: fermiDirac, drogaggio: drogaggio, giunzione: giunzione, shockley: shockley, LED: LED,
    VALLI: VALLI, massaDensita: massaDensita, densitaStati: densitaStati, sigmaK: sigmaK, zonaBrillouin: zonaBrillouin, nellaZona: nellaZona, passoOU: passoOU };

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

  /* ═══ 4. zona di Brillouin e valli (v238) ═════════════════════════════ */
  var INGR = 4; /* le nuvole termiche sono piccole rispetto alla zona: si disegnano ingrandite 4 volte */
  function schedaBrillouin(pan) {
    var st = { m: 'Si', T: 300 }, cb = {};
    F.scelta(pan, ['Materiale', 'Material'], Object.keys(VALLI).map(function (k2) { return [k2, k2 + ' — ' + F.tt(MATERIALI[k2].nome)]; }), st.m, function (v) { st.m = v; nuovo(); });
    F.cursore(pan, ['temperatura (K)', 'temperature (K)'], 50, 700, 10, st.T, function (v) { st.T = v; nuovo(); });
    var info = nota(pan), spiega = nota(pan);
    spiega.innerHTML = t('Lo spazio dei vettori d’onda k: il poliedro è la prima zona di Brillouin del reticolo cubico a facce centrate (silicio, germanio, arseniuro di gallio), con i punti di simmetria Γ (centro), X (facce quadrate), L (facce esagonali), K. Gli elettroni di conduzione (azzurri) stanno nelle valli, i minimi della banda: le nuvole hanno la forma degli ellissoidi di massa efficace (allungate dove la massa è grande) e la dimensione della distribuzione termica √(m kT)/ħ, ingrandita 4 volte. Le lacune (rosse) stanno in Γ, al massimo della banda di valenza. Se valle e lacune non sono nello stesso punto (Si, Ge) il gap è indiretto: per ricombinare serve un fonone, e il silicio non fa LED.',
      'The space of wave vectors k: the polyhedron is the first Brillouin zone of the face-centred cubic lattice (silicon, germanium, gallium arsenide), with the symmetry points Γ (centre), X (square faces), L (hexagonal faces), K. Conduction electrons (blue) sit in the valleys, the band minima: the clouds have the shape of the effective-mass ellipsoids (elongated where the mass is large) and the size of the thermal distribution √(m kT)/ħ, magnified 4 times. Holes (red) sit at Γ, at the top of the valence band. If valleys and holes are not at the same point (Si, Ge) the gap is indirect: recombination needs a phonon, and silicon makes no LEDs.');
    function nuovo() {
      var v = VALLI[st.m], m = MATERIALI[st.m], md = massaDensita(v), Nc = densitaStati(md, st.T), Nt = m.Nc * Math.pow(st.T / 300, 1.5);
      info.innerHTML = t('Valli: ', 'Valleys: ') + '<b>' + v.Mc + '</b> ' + t('in ', 'at ') + v.dove + (st.m === 'Ge' ? t(' (otto mezze valli)', ' (eight half valleys)') : '') + ' · m_l = ' + v.ml + ', m_t = ' + v.mt + ' m₀<br>' + t('Massa di densità degli stati ', 'Density-of-states mass ') + 'M_c^(2/3)(m_l m_t²)^(1/3) = <b class="bsiFX-num">' + fmt(md) + ' m₀</b><br>N_c = 2(2πm*kT/h²)^(3/2) = <b class="bsiFX-num">' + Nc.toExponential(2) + '</b> cm⁻³ · ' + t('tabella della sezione: ', 'section table: ') + Nt.toExponential(2) + ' (' + fmt((Nc / Nt - 1) * 100) + ' %)<br>E_g(' + st.T + ' K) = <b>' + fmt(Eg(m, st.T)) + ' eV</b> ' + (v.dove === 'Γ' ? t('diretto', 'direct') : t('indiretto', 'indirect')) + ' · n_i = <b>' + ni(m, st.T).toExponential(2) + '</b> cm⁻³';
      if (cb.nuovo) cb.nuovo();
    }
    nuovo();
    return {
      etichetta: ['Zona di Brillouin 3D del reticolo fcc con le valli di conduzione e la nuvola termica degli elettroni', '3D Brillouin zone of the fcc lattice with conduction valleys and the thermal electron cloud'],
      tre: function (S, T, L3) {
        var Z = zonaBrillouin(), sc = 2.6;
        var segs = []; Z.E.forEach(function (e) { var a = Z.V[e[0]], b = Z.V[e[1]]; segs.push(a[0] * sc, a[1] * sc, a[2] * sc, b[0] * sc, b[1] * sc, b[2] * sc); });
        var gz = new T.BufferGeometry(); gz.setAttribute('position', new T.Float32BufferAttribute(segs, 3)); S.aggiungi(new T.LineSegments(gz, new T.LineBasicMaterial({ color: 0x9fb1c6, transparent: true, opacity: 0.8 })));
        /* le facce, appena velate: esagoni in L e quadrati in X (vertici della faccia ordinati per angolo) */
        var facce = []; [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (n) { facce.push([n, 1]); });
        [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { [-1, 1].forEach(function (c) { facce.push([[a, b, c], 1.5]); }); }); });
        facce.forEach(function (f) {
          var n = f[0], vv = Z.V.filter(function (v) { return Math.abs(v[0] * n[0] + v[1] * n[1] + v[2] * n[2] - f[1]) < 1e-9; }), c = [0, 0, 0]; vv.forEach(function (v) { c[0] += v[0] / vv.length; c[1] += v[1] / vv.length; c[2] += v[2] / vv.length; });
          var u = new T.Vector3(vv[0][0] - c[0], vv[0][1] - c[1], vv[0][2] - c[2]).normalize(), nn = new T.Vector3(n[0], n[1], n[2]).normalize(), w = new T.Vector3().crossVectors(nn, u);
          vv.sort(function (p, q) { var dp = new T.Vector3(p[0] - c[0], p[1] - c[1], p[2] - c[2]), dq = new T.Vector3(q[0] - c[0], q[1] - c[1], q[2] - c[2]); return Math.atan2(dp.dot(w), dp.dot(u)) - Math.atan2(dq.dot(w), dq.dot(u)); });
          var pos = [], idx = []; vv.forEach(function (v) { pos.push(v[0] * sc, v[1] * sc, v[2] * sc); }); for (var i = 1; i < vv.length - 1; i++) idx.push(0, i, i + 1);
          var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
          S.aggiungi(new T.Mesh(g, new T.MeshBasicMaterial({ color: f[1] === 1 ? 0x6bcfff : 0x5eead4, transparent: true, opacity: 0.06, side: T.DoubleSide, depthWrite: false })));
        });
        [['Γ', [0, 0, 0]], ['X', [1, 0, 0]], ['L', [0.5, 0.5, 0.5]], ['K', [0.75, 0.75, 0]], ['W', [1, 0.5, 0]], ['X', [0, 0, 1]]].forEach(function (q) {
          S.aggiungi(L3.sfera(T, 0.035, 0xe6fffb, q[1][0] * sc, q[1][1] * sc, q[1][2] * sc)); var e = L3.testo3d(T, q[0], '#e6fffb', 0.28); e.position.set(q[1][0] * sc + 0.12, q[1][1] * sc + 0.12, q[1][2] * sc + 0.18); S.aggiungi(e);
        });
        S.aggiungi(L3.assi(T, 3.3, ['k_x', 'k_y', 'k_z'], 0.26));
        var gr = new T.Group(); S.aggiungi(gr);
        var NE = 900, NH = 300, pe = new Float32Array(NE * 3), ph = new Float32Array(NH * 3), ke = new Float32Array(NE * 3), kh = new Float32Array(NH * 3), valle = new Int16Array(NE);
        var ge = new T.BufferGeometry(); ge.setAttribute('position', new T.BufferAttribute(pe, 3)); S.aggiungi(new T.Points(ge, new T.PointsMaterial({ color: 0x6bcfff, size: 0.05 })));
        var gh = new T.BufferGeometry(); gh.setAttribute('position', new T.BufferAttribute(ph, 3)); S.aggiungi(new T.Points(gh, new T.PointsMaterial({ color: 0xff8a80, size: 0.05 })));
        var seme = 238; function rnd() { seme = (seme + 0x6D2B79F5) >>> 0; var q = Math.imul(seme ^ (seme >>> 15), 1 | seme); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }
        function gauss() { return Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd()); }
        var v, sl, stt, sh, assi;
        function piazza() {
          for (var i = 0; i < NE; i++) {
            var c = v.centri[valle[i]], ax = assi[valle[i]], kl = ke[3 * i], t1 = ke[3 * i + 1], t2 = ke[3 * i + 2];
            pe[3 * i] = (c[0] + INGR * (kl * ax[0][0] + t1 * ax[1][0] + t2 * ax[2][0])) * sc; pe[3 * i + 1] = (c[1] + INGR * (kl * ax[0][1] + t1 * ax[1][1] + t2 * ax[2][1])) * sc; pe[3 * i + 2] = (c[2] + INGR * (kl * ax[0][2] + t1 * ax[1][2] + t2 * ax[2][2])) * sc;
          }
          for (i = 0; i < NH * 3; i++) ph[i] = INGR * kh[i] * sc;
          ge.attributes.position.needsUpdate = true; gh.attributes.position.needsUpdate = true;
        }
        cb.nuovo = function () {
          v = VALLI[st.m]; sl = sigmaK(v.ml, st.T, v.a); stt = sigmaK(v.mt, st.T, v.a); sh = sigmaK(v.mh, st.T, v.a);
          /* per ogni valle una terna: l'asse lungo (dal centro della zona verso la valle) e due trasversi */
          assi = v.centri.map(function (c) { var L = Math.hypot(c[0], c[1], c[2]); if (!L) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; var a = new T.Vector3(c[0] / L, c[1] / L, c[2] / L), b = new T.Vector3(Math.abs(a.x) < 0.9 ? 1 : 0, Math.abs(a.x) < 0.9 ? 0 : 1, 0).cross(a).normalize(), d = new T.Vector3().crossVectors(a, b); return [[a.x, a.y, a.z], [b.x, b.y, b.z], [d.x, d.y, d.z]]; });
          for (var i = 0; i < NE; i++) { valle[i] = i % v.centri.length; ke[3 * i] = sl * gauss(); ke[3 * i + 1] = stt * gauss(); ke[3 * i + 2] = stt * gauss(); }
          for (i = 0; i < NH * 3; i++) kh[i] = sh * gauss();
          svuota(gr);
          /* l'ellissoide di energia costante (3/2)kT di ogni valle: semiassi √3 σ */
          v.centri.forEach(function (c, j) {
            var el = new T.Mesh(new T.SphereGeometry(1, 28, 18), new T.MeshStandardMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.18, depthWrite: false })), ax = assi[j];
            var M = new T.Matrix4().makeBasis(new T.Vector3(ax[0][0], ax[0][1], ax[0][2]), new T.Vector3(ax[1][0], ax[1][1], ax[1][2]), new T.Vector3(ax[2][0], ax[2][1], ax[2][2]));
            el.quaternion.setFromRotationMatrix(M); el.scale.set(INGR * Math.sqrt(3) * sl * sc, INGR * Math.sqrt(3) * stt * sc, INGR * Math.sqrt(3) * stt * sc); el.position.set(c[0] * sc, c[1] * sc, c[2] * sc); gr.add(el);
          });
          piazza();
          S.didascalia.textContent = st.m + ' · ' + st.T + ' K · ' + (v.dove === 'Γ' ? t('gap diretto in Γ', 'direct gap at Γ') : t('gap indiretto: valli in ', 'indirect gap: valleys at ') + v.dove) + ' · ' + t('nuvole ×4', 'clouds ×4');
          S.sporca = true; S.avvia();
        };
        cb.nuovo();
        S.ogniFotogramma(function (dt) {
          if (S.fermo) return false;
          var tau = 0.6;
          for (var i = 0; i < NE; i++) { ke[3 * i] = passoOU(ke[3 * i], sl, dt, tau, gauss); ke[3 * i + 1] = passoOU(ke[3 * i + 1], stt, dt, tau, gauss); ke[3 * i + 2] = passoOU(ke[3 * i + 2], stt, dt, tau, gauss); }
          for (i = 0; i < NH * 3; i++) kh[i] = passoOU(kh[i], sh, dt, tau, gauss);
          piazza(); return true;
        });
        S.inquadra(10, -0.7, 1.15);
      }
    };
  }

  F.sezione('sfissolido', {
    titolo: ['💡 Semiconduttori', '💡 Semiconductors'],
    sotto: ['La distribuzione di Fermi-Dirac e i portatori intrinseci di Si, Ge e GaAs; il drogaggio, il livello di Fermi e la conducibilità; la giunzione p-n, la caratteristica di Shockley e il colore dei LED.', 'The Fermi-Dirac distribution and intrinsic carriers of Si, Ge and GaAs; doping, the Fermi level and conductivity; the p-n junction, the Shockley characteristic and the colour of LEDs.'],
    schede: [
      { nome: ['📶 Bande e portatori', '📶 Bands and carriers'], costruisci: schedaBande },
      { nome: ['🧂 Drogaggio', '🧂 Doping'], costruisci: schedaDrogaggio },
      { nome: ['💡 Giunzione p-n e LED', '💡 p-n junction and LEDs'], costruisci: schedaGiunzione },
      { nome: ['🔷 Zona di Brillouin 3D', '🔷 3D Brillouin zone'], costruisci: scheda3D(schedaBrillouin) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
