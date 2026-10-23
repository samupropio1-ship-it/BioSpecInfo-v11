/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-suono.js — 🔊 suono e acustica
   BioSpecInfo · © Samuele Pio Provenzano

   Si vede e SI ASCOLTA (Web Audio, solo dopo un tocco dell'utente):
   · ARMONICHE: corda fissa, canna aperta, canna chiusa; i modi che vibrano,
     f_n = n v/(2L) oppure, nella canna chiusa, solo le dispari (2n − 1)v/(4L);
   · TIMBRO: la stessa nota con armoniche di ampiezza diversa (flauto,
     clarinetto con le sole dispari, violino a dente di sega, onda quadra);
     la forma d'onda e lo spettro;
   · BATTIMENTI E DOPPLER: due toni vicini si ascoltano pulsare a |f₁ − f₂|;
     una sorgente in moto con i fronti d'onda che si addensano davanti, la
     frequenza percepita f v/(v ∓ v_s) e, oltre la velocita' del suono, il
     cono di Mach con sin θ = v/v_s;
   · DECIBEL: L = 10 log(I/I₀), la somma di sorgenti incoerenti (due sorgenti
     uguali danno +3 dB, non il doppio) e la legge dell'inverso del quadrato
     (−6 dB a distanza doppia).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function armoniche(tipo, L, v, n) { var out = []; for (var k = 1; k <= n; k++) out.push(tipo === 'chiusa' ? (2 * k - 1) * v / (4 * L) : k * v / (2 * L)); return out; }
  function velocitaCorda(T, mu) { return Math.sqrt(T / mu); }
  function velocitaAria(Tc) { return 331.3 * Math.sqrt(1 + Tc / 273.15); }
  function doppler(f, v, vs, vo) { return f * (v + (vo || 0)) / (v - vs); } /* sorgente che si avvicina con vs > 0, osservatore che si avvicina con vo > 0 */
  function dB(I) { return 10 * Math.log10(I / 1e-12); }
  function sommaDB(lista) { return 10 * Math.log10(lista.reduce(function (s, L) { return s + Math.pow(10, L / 10); }, 0)); }
  var TIMBRI = {
    sinusoide: [['sinusoide pura (diapason)', 'pure sine (tuning fork)'], [1]],
    flauto: [['flauto (poche armoniche)', 'flute (few harmonics)'], [1, 0.4, 0.15, 0.05, 0.02]],
    clarinetto: [['clarinetto (solo dispari)', 'clarinet (odd only)'], [1, 0, 0.36, 0, 0.18, 0, 0.1, 0, 0.06]],
    violino: [['violino (dente di sega, 1/n)', 'violin (sawtooth, 1/n)'], [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8, 1 / 9, 1 / 10]],
    quadra: [['onda quadra (dispari, 1/n)', 'square wave (odd, 1/n)'], [1, 0, 1 / 3, 0, 1 / 5, 0, 1 / 7, 0, 1 / 9, 0, 1 / 11]]
  };
  F.calcolo.suono = { armoniche: armoniche, velocitaCorda: velocitaCorda, velocitaAria: velocitaAria, doppler: doppler, dB: dB, sommaDB: sommaDB, TIMBRI: TIMBRI };

  /* ── l'audio: un contesto solo, creato al primo tocco ─────────────────── */
  var AC = null, suonoAttivo = null;
  function audio() { if (!AC) { var C = globale.AudioContext || globale.webkitAudioContext; if (!C) return null; AC = new C(); } if (AC.state === 'suspended') AC.resume(); return AC; }
  function ferma() { if (suonoAttivo) { try { suonoAttivo.forEach(function (n) { n.stop(); }); } catch (e) { } suonoAttivo = null; } }
  /* suona per «durata» secondi una somma di sinusoidi [freq, ampiezza] */
  function suona(parziali, durata) {
    var ac = audio(); if (!ac) return false; ferma();
    var g = ac.createGain(), tot = parziali.reduce(function (s, p) { return s + Math.abs(p[1]); }, 0) || 1, ora = ac.currentTime;
    g.gain.setValueAtTime(0, ora); g.gain.linearRampToValueAtTime(0.25 / Math.max(1, tot), ora + 0.03); g.gain.setValueAtTime(0.25 / Math.max(1, tot), ora + durata - 0.08); g.gain.linearRampToValueAtTime(0, ora + durata);
    g.connect(ac.destination);
    suonoAttivo = parziali.filter(function (p) { return p[1] && p[0] > 15 && p[0] < 18000; }).map(function (p) { var o = ac.createOscillator(), a = ac.createGain(); o.frequency.value = p[0]; a.gain.value = p[1]; o.connect(a); a.connect(g); o.start(ora); o.stop(ora + durata); return o; });
    return true;
  }
  function bottoneAscolta(pan, azione) { var b = F.bottone(pan, ['🔊 Ascolta', '🔊 Listen'], function () { if (!azione()) b.textContent = t('🔇 audio non disponibile', '🔇 audio unavailable'); }); return b; }

  /* ═══ 1. armoniche ══════════════════════════════════════════════════════ */
  function schedaArmoniche(div) {
    var G = griglia(div), st = { tipo: 'corda', L: 0.65, T: 70, mu: 0.0006, n: 1, Tc: 20 }, info = nota(G.pan), tt = 0;
    F.scelta(G.pan, ['Strumento', 'Instrument'], [['corda', t('corda fissa ai due estremi', 'string fixed at both ends')], ['aperta', t('canna aperta (flauto)', 'open pipe (flute)')], ['chiusa', t('canna chiusa a un estremo (clarinetto)', 'pipe closed at one end (clarinet)')]], st.tipo, function (v) { st.tipo = v; testo(); });
    F.cursore(G.pan, ['lunghezza L (m)', 'length L (m)'], 0.1, 2, 0.01, st.L, function (v) { st.L = v; testo(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['tensione della corda (N)', 'string tension (N)'], 10, 200, 1, st.T, function (v) { st.T = v; testo(); });
    F.cursore(G.pan, ['armonica n', 'harmonic n'], 1, 8, 1, st.n, function (v) { st.n = v; testo(); });
    bottoneAscolta(G.pan, function () { return suona([[freq(), 1]], 1.2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.5);
    function v() { return st.tipo === 'corda' ? velocitaCorda(st.T, st.mu) : velocitaAria(st.Tc); }
    function freq() { return armoniche(st.tipo, st.L, v(), st.n)[st.n - 1]; }
    function testo() {
      var A = armoniche(st.tipo, st.L, v(), 6);
      info.innerHTML = 'v = ' + (st.tipo === 'corda' ? '√(T/μ)' : t('331,3 √(1 + T/273,15) (aria a 20 °C)', '331.3 √(1 + T/273.15) (air at 20 °C)')) + ' = ' + fmt(v()) + ' m/s<br>' + t('Armonica scelta: ', 'Chosen harmonic: ') + '<b class="bsiFX-num">' + fmt(freq()) + ' Hz</b><br>' + t('Serie: ', 'Series: ') + A.map(function (f) { return fmt(f); }).join(', ') + ' Hz' + '<br>' + (st.tipo === 'chiusa' ? t('Canna chiusa: un nodo all’estremo chiuso e un ventre a quello aperto, quindi solo armoniche dispari e fondamentale un’ottava più bassa della canna aperta.', 'Closed pipe: a node at the closed end and an antinode at the open one, so only odd harmonics and a fundamental an octave below the open pipe.') : t('Tutte le armoniche intere: ', 'All integer harmonics: ') + 'f_n = n v/(2L).');
    }
    testo();
    F.anima(cv, function (dt) {
      tt += dt; var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, x0 = 30, L = W - 60, cy = H / 2, A = H * 0.32, n = st.n, k = st.tipo === 'chiusa' ? (2 * n - 1) * Math.PI / 2 : n * Math.PI, om = 2 * Math.PI * 1.2;
      if (st.tipo !== 'corda') { q.strokeStyle = '#6bcfff'; q.lineWidth = 3; q.strokeRect(x0, cy - A - 10, L, 2 * A + 20); if (st.tipo === 'chiusa') { q.fillStyle = '#6bcfff'; q.fillRect(x0 - 4, cy - A - 10, 8, 2 * A + 20); } q.lineWidth = 1; }
      q.strokeStyle = '#5eead4'; q.lineWidth = 2.5; q.beginPath();
      for (var i = 0; i <= 300; i++) { var u = i / 300, amp = st.tipo === 'corda' ? Math.sin(k * u) : st.tipo === 'aperta' ? Math.cos(k * u) : Math.sin(k * u), y = cy - A * amp * Math.cos(om * tt); if (i) q.lineTo(x0 + u * L, y); else q.moveTo(x0, y); }
      q.stroke(); q.strokeStyle = 'rgba(94,234,212,.25)'; q.beginPath(); for (i = 0; i <= 300; i++) { u = i / 300; amp = st.tipo === 'corda' ? Math.sin(k * u) : st.tipo === 'aperta' ? Math.cos(k * u) : Math.sin(k * u); y = cy + A * amp; if (i) q.lineTo(x0 + u * L, y); else q.moveTo(x0, y); } q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.fillText(st.tipo === 'corda' ? t('spostamento della corda', 'string displacement') : t('spostamento dell’aria (nodi agli estremi chiusi)', 'air displacement (nodes at closed ends)'), x0, 14);
      cv.setAttribute('aria-label', t('modo di vibrazione', 'vibration mode'));
    });
  }

  /* ═══ 2. timbro ═════════════════════════════════════════════════════════ */
  function schedaTimbro(div) {
    var G = griglia(div), st = { tim: 'clarinetto', f0: 220 }, info = nota(G.pan);
    F.scelta(G.pan, ['Timbro', 'Timbre'], Object.keys(TIMBRI).map(function (k) { return [k, F.tt(TIMBRI[k][0])]; }), st.tim, function (v) { st.tim = v; disegna(); });
    F.cursore(G.pan, ['nota fondamentale (Hz)', 'fundamental (Hz)'], 110, 880, 1, st.f0, function (v) { st.f0 = v; disegna(); });
    bottoneAscolta(G.pan, function () { return suona(TIMBRI[st.tim][1].map(function (a, i) { return [st.f0 * (i + 1), a]; }), 1.5); });
    G.pan.appendChild(info);
    var co = F.tela(G.dx, 0.42), cs = F.tela(G.dx, 0.36);
    function disegna() {
      var amp = TIMBRI[st.tim][1], xs = [], ys = [];
      for (var i = 0; i <= 600; i++) { var tt = 3 * i / 600 / st.f0, y = 0; amp.forEach(function (a, k) { y += a * Math.sin(2 * Math.PI * (k + 1) * st.f0 * tt); }); xs.push(tt * 1000); ys.push(y); }
      F.grafico(co, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2, etich: ['pressione', 'pressure'] }], xl: ['t (ms)', 't (ms)'], yl: ['forma d’onda', 'waveform'] });
      F.grafico(cs, { barre: amp.map(function (a, k) { return { x: st.f0 * (k + 1), y: a, col: '#ffd24a', larg: 6 }; }), xmin: 0, xmax: st.f0 * (amp.length + 1), ymin: 0, ymax: 1.1, xl: ['frequenza (Hz)', 'frequency (Hz)'], yl: ['ampiezza', 'amplitude'], descr: ['spettro', 'spectrum'] });
      info.innerHTML = t('Stessa nota (', 'Same note (') + st.f0 + ' Hz), ' + t('timbro diverso: cambia solo quanto pesano le armoniche. L’orecchio sente l’altezza della fondamentale e il «colore» dalle armoniche.', 'different timbre: only the weight of the harmonics changes. The ear hears the pitch of the fundamental and the «colour» from the harmonics.') + '<br>' + t('È la stessa analisi di Fourier che separa le righe di uno spettro: un segnale periodico è una somma di sinusoidi a frequenze multiple della fondamentale.', 'It is the same Fourier analysis that separates the lines of a spectrum: a periodic signal is a sum of sinusoids at multiples of the fundamental.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. battimenti e Doppler ═══════════════════════════════════════════ */
  function schedaDoppler(div) {
    var G = griglia(div), st = { f1: 440, f2: 444, vs: 0.6 }, info = nota(G.pan), info2 = F.el('div', { 'class': 'bsiFX-nota' }), fronti = [], xs = 0, tt = 0, tEm = 0;
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Battimenti', 'Beats') + '</b>' }));
    F.cursore(G.pan, ['f₁ (Hz)', 'f₁ (Hz)'], 400, 480, 0.5, st.f1, function (v) { st.f1 = v; testo(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['f₂ (Hz)', 'f₂ (Hz)'], 400, 480, 0.5, st.f2, function (v) { st.f2 = v; testo(); }, function (v) { return v.toFixed(1); });
    bottoneAscolta(G.pan, function () { return suona([[st.f1, 1], [st.f2, 1]], 3); });
    G.pan.appendChild(info);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>Doppler</b>' }));
    F.cursore(G.pan, ['velocità della sorgente / velocità del suono', 'source speed / speed of sound'], 0, 1.8, 0.05, st.vs, function (v) { st.vs = v; fronti = []; xs = 0; testo(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info2);
    var cv = F.tela(G.dx, 0.6);
    function testo() {
      info.innerHTML = t('Si sentono ', 'You hear ') + '<b>' + fmt(Math.abs(st.f1 - st.f2)) + t(' battimenti al secondo', ' beats per second') + '</b> ' + t('su una nota di ', 'on a note of ') + fmt((st.f1 + st.f2) / 2) + ' Hz.';
      var v = 343, M = st.vs;
      info2.innerHTML = M < 1 ? t('Davanti alla sorgente: ', 'In front of the source: ') + '<b>' + fmt(doppler(440, v, M * v)) + ' Hz</b>, ' + t('dietro: ', 'behind: ') + '<b>' + fmt(doppler(440, v, -M * v)) + ' Hz</b> ' + t('(emessa 440 Hz). I fronti si addensano davanti e si diradano dietro.', '(emitted 440 Hz). Fronts crowd in front and spread behind.') : M === 1 ? t('Alla velocità del suono i fronti si accumulano in un muro: il «muro del suono».', 'At the speed of sound the fronts pile up into a wall: the «sound barrier».') : t('Supersonico (Mach ', 'Supersonic (Mach ') + fmt(M) + t('): i fronti formano un cono di semiapertura θ con sin θ = 1/M = ', '): the fronts form a cone of half-angle θ with sin θ = 1/M = ') + fmt(1 / M) + ' → θ = <b>' + fmt(Math.asin(1 / M) * 180 / Math.PI) + '°</b>' + t('; il cono è il bang sonico.', '; the cone is the sonic boom.');
    }
    testo();
    F.anima(cv, function (dt) {
      tt += dt; var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, c = W * 0.18; /* velocita' del suono in px/s */
      xs += st.vs * c * dt; if (xs > W * 0.75) { xs = 0; fronti = []; }
      if (tt - tEm > 0.25) { tEm = tt; fronti.push({ x: W * 0.15 + xs, t0: tt }); }
      q.lineWidth = 1.5;
      fronti.forEach(function (f) { var r = (tt - f.t0) * c; if (r > W * 1.2) return; q.strokeStyle = 'rgba(94,234,212,' + Math.max(0.15, 1 - r / (W * 0.9)) + ')'; q.beginPath(); q.arc(f.x, H / 2, r, 0, Math.PI * 2); q.stroke(); });
      q.lineWidth = 1;
      var sx = W * 0.15 + xs; q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(sx, H / 2, 7, 0, Math.PI * 2); q.fill();
      /* la direzione del moto e l'osservatore, visibili anche nel primo fotogramma */
      q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(10, H / 2); q.lineTo(W - 10, H / 2); q.stroke();
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.fillText(t('sorgente →', 'source →'), sx - 30, H / 2 - 14); q.fillText('👂 ' + t('davanti', 'in front'), W - 90, H / 2 - 8); q.fillText('👂 ' + t('dietro', 'behind'), 12, H / 2 - 8);
      if (st.vs > 1) { var th = Math.asin(1 / st.vs), L = W; q.strokeStyle = '#ff8a80'; q.lineWidth = 2; q.beginPath(); q.moveTo(sx - L * Math.cos(th), H / 2 - L * Math.sin(th)); q.lineTo(sx, H / 2); q.lineTo(sx - L * Math.cos(th), H / 2 + L * Math.sin(th)); q.stroke(); q.lineWidth = 1; }
      cv.setAttribute('aria-label', t('fronti d’onda di una sorgente in moto', 'wavefronts of a moving source'));
    });
  }

  /* ═══ 4. decibel ════════════════════════════════════════════════════════ */
  function schedaDecibel(div) {
    var G = griglia(div), st = { L1: 80, n: 2, r: 1 }, info = nota(G.pan);
    F.cursore(G.pan, ['livello di una sorgente a 1 m (dB)', 'level of one source at 1 m (dB)'], 20, 120, 1, st.L1, function (v) { st.L1 = v; disegna(); });
    F.cursore(G.pan, ['sorgenti uguali', 'equal sources'], 1, 10, 1, st.n, function (v) { st.n = v; disegna(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.5);
    function disegna() {
      var xs = [], ys = [], ys1 = [];
      for (var i = 0; i <= 200; i++) { var r = 0.5 + 31.5 * i / 200, L = st.L1 - 20 * Math.log10(r); xs.push(r); ys1.push(L); ys.push(sommaDB(new Array(st.n).fill(L))); }
      F.grafico(cv, { serie: [{ x: xs, y: ys1, col: '#8494a8', tratt: true, etich: ['una sorgente', 'one source'] }, { x: xs, y: ys, col: '#5eead4', larg: 2, etich: ['tutte insieme', 'all together'] }], linee: [{ y: 85, col: '#ff8a80', etich: t('85 dB: rischio per l’udito su 8 h', '85 dB: hearing risk over 8 h') }], xl: ['distanza (m)', 'distance (m)'], yl: ['L (dB)', 'L (dB)'] });
      info.innerHTML = 'L = 10 log₁₀(I/I₀), I₀ = 10⁻¹² W/m²<br>' + st.n + t(' sorgenti uguali: ', ' equal sources: ') + '<b class="bsiFX-num">+' + fmt(10 * Math.log10(st.n)) + ' dB</b> (' + t('non ', 'not ') + st.n + t(' volte i dB', ' times the dB') + ')<br>' + t('A distanza doppia ', 'At double distance ') + '−20 log 2 = <b>−6,02 dB</b> (' + t('inverso del quadrato: l’intensità diventa 1/4', 'inverse square: intensity becomes 1/4') + ')<br>' + t('La scala logaritmica segue l’orecchio: +10 dB sembra «il doppio del volume», ma è dieci volte l’intensità.', 'The logarithmic scale follows the ear: +10 dB sounds «twice as loud», but it is ten times the intensity.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('sfissuono', {
    titolo: ['🔊 Suono e acustica', '🔊 Sound and acoustics'],
    sotto: ['Armoniche di corde e canne, il timbro come somma di armoniche, battimenti, effetto Doppler e cono di Mach, la scala dei decibel: da vedere e da ascoltare.', 'Harmonics of strings and pipes, timbre as a sum of harmonics, beats, the Doppler effect and the Mach cone, the decibel scale: to see and to hear.'],
    schede: [
      { nome: ['🎻 Armoniche', '🎻 Harmonics'], costruisci: schedaArmoniche },
      { nome: ['🎷 Timbro', '🎷 Timbre'], costruisci: schedaTimbro },
      { nome: ['🚑 Battimenti e Doppler', '🚑 Beats and Doppler'], costruisci: schedaDoppler },
      { nome: ['📢 Decibel', '📢 Decibels'], costruisci: schedaDecibel }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
