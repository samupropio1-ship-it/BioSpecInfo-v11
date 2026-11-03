/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chi-equilibrio.js — ⚖️ equilibrio chimico e Le Chatelier
   BioSpecInfo · © Samuele Pio Provenzano

   L'equilibrio non e' una cosa ferma: e' il punto in cui due velocita' si
   uguagliano. Qui la reazione aA + bB ⇌ cC + dD procede secondo la legge
   d'azione di massa (v→ = k[A]^a[B]^b, v← = k/K [C]^c[D]^d), le
   concentrazioni si muovono nel tempo e si fermano dove Q = K. Poi si
   disturba il sistema, come nel laboratorio:

   · si aggiunge o si toglie una specie;
   · si cambia il volume (gas): le concentrazioni scalano tutte, e lo
     spostamento dipende da Δn gassoso;
   · si cambia la temperatura: K segue van 't Hoff, ln(K₂/K₁) = −ΔH°/R
     (1/T₂ − 1/T₁).

   Il sistema risponde da solo, e si vede da che parte (Le Chatelier) e di
   quanto. La seconda scheda e' K in funzione di T: ΔG° = ΔH° − TΔS°, la
   temperatura in cui K = 1 e il diagramma di van 't Hoff.

   v238: la terza scheda guarda l'equilibrio da vicino, molecola per
   molecola. In una scatola 3D le molecole si muovono e reagiscono una alla
   volta con l'algoritmo di Gillespie (cinetica stocastica esatta, legge di
   azione di massa sui numeri di molecole): i numeri non si fermano mai, ma
   la loro media soddisfa K. K misurata dalle medie contro K teorica.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, R = 8.314462618;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* le reazioni: specie, coefficienti (negativi i reagenti), stato, K a 298 K, ΔH° e ΔS° */
  var REAZIONI = {
    haber: { nome: 'N₂ + 3 H₂ ⇌ 2 NH₃', sp: ['N₂', 'H₂', 'NH₃'], nu: [-1, -3, 2], gas: true, dH: -92.2, dS: -198.7, c0: [1, 3, 0], T: 700 },
    hi: { nome: 'H₂ + I₂ ⇌ 2 HI', sp: ['H₂', 'I₂', 'HI'], nu: [-1, -1, 2], gas: true, dH: -9.4, dS: 21.8, c0: [1, 1, 0], T: 700 },
    n2o4: { nome: 'N₂O₄ ⇌ 2 NO₂', sp: ['N₂O₄', 'NO₂'], nu: [-1, 2], gas: true, dH: 57.2, dS: 175.8, c0: [1, 0], T: 350 },
    ester: { nome: 'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O', sp: ['AcOH', 'EtOH', 'AcOEt', 'H₂O'], nu: [-1, -1, 1, 1], gas: false, K298: 4, dH: -4, dS: -2.0, c0: [1, 1, 0, 0], T: 298 },
    co: { nome: 'CO + H₂O ⇌ CO₂ + H₂', sp: ['CO', 'H₂O', 'CO₂', 'H₂'], nu: [-1, -1, 1, 1], gas: true, dH: -41.2, dS: -42.1, c0: [1, 1, 0, 0], T: 900 }
  };
  /* K in concentrazioni (mol/L): Kc = Kp (RT/p°)^(−Δn), Kp = exp(−ΔG°/RT) */
  function costante(Rx, T) {
    var dG = Rx.dH * 1000 - T * Rx.dS, Kp = Math.exp(-dG / (R * T)), dn = Rx.nu.reduce(function (s, v) { return s + v; }, 0);
    if (!Rx.gas) return { K: Rx.K298 !== undefined ? Rx.K298 * Math.exp(-Rx.dH * 1000 / R * (1 / T - 1 / 298.15)) : Kp, dG: dG, dn: 0 };
    return { K: Kp * Math.pow(0.0831446 * T, -dn), Kp: Kp, dG: dG, dn: dn };
  }
  function quoziente(Rx, c) { var Q = 1; Rx.nu.forEach(function (v, i) { Q *= Math.pow(Math.max(c[i], 1e-300), v); }); return Q; }
  /* l'equilibrio esatto: avanzamento ξ con Q(ξ) = K, per bisezione su ln Q (monotona in ξ) */
  function equilibrio(Rx, c0, K) {
    var lo = -Infinity, hi = Infinity;
    Rx.nu.forEach(function (v, i) { var lim = -c0[i] / v; if (v < 0) hi = Math.min(hi, lim); else lo = Math.max(lo, lim); });
    var f = function (x) { return Rx.nu.reduce(function (s, v, i) { return s + v * Math.log(Math.max(c0[i] + v * x, 1e-300)); }, 0) - Math.log(K); };
    var a = lo + 1e-15 * (1 + Math.abs(lo)), b = hi - 1e-15 * (1 + Math.abs(hi));
    for (var i = 0; i < 200; i++) { var m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; }
    var x = (a + b) / 2; return { xi: x, c: c0.map(function (c, i) { return Math.max(0, c + Rx.nu[i] * x); }) };
  }
  /* un passo di cinetica: velocita' netta = k(Π reagenti − Π prodotti / K) */
  function passo(Rx, c, K, k, dt) {
    function v(cc) { var a = 1, b = 1; Rx.nu.forEach(function (n, i) { if (n < 0) a *= Math.pow(Math.max(cc[i], 0), -n); else b *= Math.pow(Math.max(cc[i], 0), n); }); return k * (a - b / K); }
    /* Runge-Kutta 4 sull'avanzamento */
    var k1 = v(c), c2 = c.map(function (x, i) { return x + Rx.nu[i] * k1 * dt / 2; }), k2 = v(c2), c3 = c.map(function (x, i) { return x + Rx.nu[i] * k2 * dt / 2; }), k3 = v(c3), c4 = c.map(function (x, i) { return x + Rx.nu[i] * k3 * dt; }), k4 = v(c4);
    var dx = dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    return c.map(function (x, i) { return Math.max(0, x + Rx.nu[i] * dx); });
  }

  /* ── v238: l'equilibrio molecola per molecola (Gillespie) ────────────────
     Nella scatola ci sono Nᵢ molecole; Ω e' il numero di molecole per 1 M
     (cᵢ = Nᵢ/Ω). Le propensioni seguono l'azione di massa sui numeri:
     a→ = k Ω Π (Nᵢ)_νᵢ/Ω^νᵢ sui reagenti, a← = (k/K) Ω Π (Nⱼ)_νⱼ/Ω^νⱼ sui
     prodotti, con (N)_ν = N(N−1)…(N−ν+1). Il tempo al prossimo evento e'
     esponenziale di parametro a→ + a←, il verso si sceglie in proporzione
     (Gillespie 1977). Per A ⇌ B la distribuzione stazionaria e' binomiale e
     ⟨N_B⟩/⟨N_A⟩ = K esattamente; con piu' molecole che si incontrano la
     media rispetta K a meno di correzioni dell'ordine di 1/N. */
  var ISOMERO = { nome: 'A ⇌ B', sp: ['A', 'B'], nu: [-1, 1], gas: false, K298: 3, dH: 8, dS: 0, c0: [1, 0], T: 298 };
  function fattDec(N, v) { var p = 1; for (var i = 0; i < v; i++) p *= Math.max(0, N - i); return p; }
  function propensioni(Rx, N, Om, k, K) {
    var af = k * Om, ab = k / K * Om;
    Rx.nu.forEach(function (v, i) { if (v < 0) af *= fattDec(N[i], -v) / Math.pow(Om, -v); else ab *= fattDec(N[i], v) / Math.pow(Om, v); });
    return [af, ab];
  }
  function gillespie(Rx, N0, Om, k, K, seme) {
    var q = (seme || 1) >>> 0, rnd = function () { q = (q + 0x6D2B79F5) >>> 0; var z = Math.imul(q ^ (q >>> 15), 1 | q); z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z; return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };
    return { Rx: Rx, N: N0.slice(), Om: Om, k: k, K: K, t: 0, eventi: [], rnd: rnd, somme: null };
  }
  /* avanza fino a t + dt; registra gli eventi (+1 avanti, −1 indietro) e, se richiesto, le medie temporali dei Nᵢ */
  function avanzaSSA(G, dt) {
    var fine = G.t + dt;
    for (var it = 0; it < 100000; it++) {
      var a = propensioni(G.Rx, G.N, G.Om, G.k, G.K), a0 = a[0] + a[1];
      var tau = a0 > 0 ? -Math.log(1 - G.rnd()) / a0 : Infinity;
      if (G.t + tau > fine) { media(G, fine - G.t); G.t = fine; break; }
      media(G, tau); G.t += tau;
      var verso = G.rnd() * a0 < a[0] ? 1 : -1;
      G.Rx.nu.forEach(function (v, i) { G.N[i] += verso * v; });
      G.eventi.push(verso); G.contati = (G.contati || 0) + 1;
    }
  }
  function media(G, w) { if (!G.somme) return; G.somme.w += w; for (var i = 0; i < G.N.length; i++) G.somme.s[i] += w * G.N[i]; }
  function iniziaMedia(G) { G.somme = { w: 0, s: G.N.map(function () { return 0; }) }; }
  function concMedie(G) { return G.somme && G.somme.w > 0 ? G.somme.s.map(function (x) { return x / G.somme.w / G.Om; }) : null; }
  F.calcolo.equilibrio = { REAZIONI: REAZIONI, costante: costante, quoziente: quoziente, equilibrio: equilibrio, passo: passo, ISOMERO: ISOMERO, propensioni: propensioni, gillespie: gillespie, avanzaSSA: avanzaSSA, iniziaMedia: iniziaMedia, concMedie: concMedie };

  var COLORI = ['#5eead4', '#ff8a80', '#ffd24a', '#6bcfff'];
  function schedaSimulatore(div) {
    var G = griglia(div), st = { r: 'haber' }, Rx, T, K, c, storia, tt, eventi, info, stato = F.el('div', { 'class': 'bsiFX-nota' }), bott = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' });
    F.scelta(G.pan, ['Reazione', 'Reaction'], Object.keys(REAZIONI).map(function (k) { return [k, REAZIONI[k].nome]; }), st.r, function (v) { st.r = v; nuova(); });
    G.pan.appendChild(bott); info = nota(G.pan); G.pan.appendChild(stato);
    var c1 = F.tela(G.dx, 0.55);
    var ctl = null;
    function evento(nome) { eventi.push([tt, nome]); if (ctl) ctl.sveglia(); }
    function nuova() {
      Rx = REAZIONI[st.r]; T = Rx.T; K = costante(Rx, T).K; c = Rx.c0.slice(); storia = [[0].concat(c)]; tt = 0; eventi = [[0, t('inizio', 'start')]];
      bott.innerHTML = '';
      Rx.sp.forEach(function (s, i) {
        F.bottone(bott, ['+ ' + s, '+ ' + s], function () { c[i] += 0.5; evento('+' + s); });
        F.bottone(bott, ['− ' + s, '− ' + s], function () { c[i] = c[i] * 0.4; evento('−' + s); });
      });
      if (Rx.gas) { F.bottone(bott, ['Volume ÷ 2 (p × 2)', 'Volume ÷ 2 (p × 2)'], function () { c = c.map(function (x) { return 2 * x; }); evento('V/2'); }); F.bottone(bott, ['Volume × 2', 'Volume × 2'], function () { c = c.map(function (x) { return x / 2; }); evento('2V'); }); }
      F.bottone(bott, ['T + 50 K', 'T + 50 K'], function () { T += 50; K = costante(Rx, T).K; evento('T+50'); });
      F.bottone(bott, ['T − 50 K', 'T − 50 K'], function () { T = Math.max(200, T - 50); K = costante(Rx, T).K; evento('T−50'); });
      var k0 = costante(Rx, Rx.T);
      info.innerHTML = '<b>' + Rx.nome + '</b> · ΔH° = ' + Rx.dH + ' kJ/mol · ΔS° = ' + Rx.dS + ' J/(mol·K)' + (Rx.gas ? ' · Δn(gas) = ' + k0.dn : '') + '<br>' + t('Premi i pulsanti per disturbare l’equilibrio e guarda come il sistema reagisce.', 'Press the buttons to disturb the equilibrium and watch how the system responds.');
      if (ctl) ctl.sveglia();
    }
    function ciclo(dt) {
      /* scala dei tempi: k tale che il rilassamento duri qualche secondo */
      var kk = 0.6 / Math.max(1e-6, Math.pow(Math.max.apply(null, c), Math.max(1, -Rx.nu.filter(function (v) { return v < 0; }).reduce(function (s, v) { return s + v; }, 0)) - 1));
      /* 6 passi di 0,01 per fotogramma alla velocita' ×1 */
      var np = Math.round(dt * 60 * 6); for (var i = 0; i < np; i++) { c = passo(Rx, c, K, kk, 0.01); tt += 0.01; }
      storia.push([tt].concat(c)); if (storia.length > 2400) storia.splice(1, 1);
      var Q = quoziente(Rx, c), lr = Math.log10(Q / K);
      var o = F.grafico(c1, { serie: Rx.sp.map(function (s, j) { return { x: storia.map(function (r) { return r[0]; }), y: storia.map(function (r) { return r[j + 1]; }), col: COLORI[j], larg: 2.2, etich: s }; }), ymin: 0, xl: ['t', 't'], yl: [t('concentrazione (M)', 'concentration (M)'), t('concentrazione (M)', 'concentration (M)')], legenda: Rx.sp.map(function (s, j) { return { col: COLORI[j], etich: s }; }) });
      eventi.forEach(function (e) { var x = o.X(e[0]); o.q.strokeStyle = 'rgba(201,211,223,.35)'; o.q.setLineDash([3, 3]); o.q.beginPath(); o.q.moveTo(x, 14); o.q.lineTo(x, o.H - 40); o.q.stroke(); o.q.setLineDash([]); o.q.fillStyle = '#c9d3df'; o.q.font = '10px system-ui'; o.q.textAlign = 'left'; o.q.fillText(e[1], x + 3, 24); });
      var verso = Math.abs(lr) < 0.002 ? t('<b>all’equilibrio</b> (Q = K): le due velocità sono uguali', '<b>at equilibrium</b> (Q = K): the two rates are equal') : lr < 0 ? t('Q < K: la reazione procede <b>verso destra →</b>', 'Q < K: the reaction proceeds <b>to the right →</b>') : t('Q > K: la reazione procede <b>verso sinistra ←</b>', 'Q > K: the reaction proceeds <b>to the left ←</b>');
      stato.innerHTML = 'T = ' + T + ' K · K = <b class="bsiFX-num">' + (K < 1e-3 || K > 1e4 ? K.toExponential(3) : fmt(K)) + '</b> · Q = ' + (Q < 1e-3 || Q > 1e4 ? Q.toExponential(3) : fmt(Q)) + '<br>' + verso + '<br>' + Rx.sp.map(function (s, j) { return s + ' ' + fmt(c[j]) + ' M'; }).join(' · ') +
        '<br>' + t('Le Chatelier: aggiungendo un reagente l’equilibrio si sposta verso i prodotti; comprimendo un gas verso il lato con meno moli gassose; scaldando nel verso endotermico (K cresce se ΔH° > 0).', 'Le Chatelier: adding a reactant shifts the equilibrium towards products; compressing a gas towards the side with fewer gas moles; heating in the endothermic direction (K grows if ΔH° > 0).');
      /* raggiunto l'equilibrio si ferma: la barra mostra ▶ e il prossimo disturbo la risveglia */
      if (Math.abs(lr) < 1e-4 && tt - eventi[eventi.length - 1][0] > 0.5) return false;
    }
    nuova();
    ctl = F.anima(c1, ciclo, { ricomincia: function () { var c0 = ctl; ctl = null; nuova(); ctl = c0; } });
  }

  function schedaTemperatura(div) {
    var G = griglia(div), st = { r: 'haber' }, info = F.el('div', { 'class': 'bsiFX-nota' });
    F.scelta(G.pan, ['Reazione', 'Reaction'], Object.keys(REAZIONI).map(function (k) { return [k, REAZIONI[k].nome]; }), st.r, function (v) { st.r = v; disegna(); });
    G.pan.appendChild(info);
    var c = F.tela(G.dx, 0.45), c2 = F.tela(G.dx, 0.45);
    function disegna() {
      var Rx = REAZIONI[st.r], xs = [], lk = [], dg = [], inv = [], lnk = [];
      for (var T = 200; T <= 1500; T += 10) { var k = costante(Rx, T); xs.push(T); lk.push(Math.log10(Rx.gas ? k.Kp : k.K)); dg.push(k.dG / 1000); inv.push(1000 / T); lnk.push(Math.log(Rx.gas ? k.Kp : k.K)); }
      F.grafico(c, { serie: [{ x: xs, y: dg, col: '#ffd24a', larg: 2, etich: 'ΔG°' }], linee: [{ y: 0, col: '#8494a8', etich: 'ΔG° = 0 (K = 1)' }], xl: ['T (K)', 'T (K)'], yl: ['ΔG° (kJ/mol)', 'ΔG° (kJ/mol)'] });
      F.grafico(c2, { serie: [{ x: inv, y: lnk, col: '#5eead4', larg: 2, etich: 'ln K' }], xl: ['1000/T (K⁻¹)', '1000/T (K⁻¹)'], yl: ['ln K', 'ln K'] });
      var Tx = Rx.dH * 1000 / Rx.dS;
      info.innerHTML = '<b>' + Rx.nome + '</b><br>ΔG° = ΔH° − TΔS° = ' + Rx.dH + ' kJ/mol − T·(' + Rx.dS + ' J/(mol·K))<br>' + (Tx > 0 && isFinite(Tx) ? t('K = 1 a ', 'K = 1 at ') + 'T = ΔH°/ΔS° = <b>' + fmt(Tx) + ' K</b> (' + fmt(Tx - 273.15) + ' °C); ' + (Rx.dH < 0 ? t('sotto è favorita la formazione dei prodotti', 'below, products are favoured') : t('sopra è favorita la formazione dei prodotti', 'above, products are favoured')) : t('ΔH° e ΔS° hanno segni che non danno un incrocio: il segno di ΔG° non cambia con T.', 'ΔH° and ΔS° have signs that give no crossing: the sign of ΔG° does not change with T.')) +
        '<br>' + t('Qui ΔH° e ΔS° sono presi costanti con T (approssimazione di Ellingham, dai valori tabulati a 298 K): lontano da 298 K la K calcolata è indicativa (per HI a 700 K dà ', 'Here ΔH° and ΔS° are taken as constant with T (Ellingham approximation, from tabulated 298 K values): far from 298 K the computed K is indicative (for HI at 700 K it gives ') + fmt(costante(REAZIONI.hi, 700).K) + t(', la misura è circa 54).', ', the measured value is about 54).') +
        '<br>' + t('Diagramma di van ’t Hoff: ln K contro 1/T è una retta di pendenza −ΔH°/R = ', 'Van ’t Hoff plot: ln K against 1/T is a straight line with slope −ΔH°/R = ') + fmt(-Rx.dH * 1000 / R / 1000) + ' (×1000 K)' + (st.r === 'haber' ? '<br>' + t('Haber-Bosch: a bassa T K è grande ma la reazione è lentissima; a 700 K è veloce ma K è piccola: per questo si lavora a 150–300 bar (Δn = −2, la pressione spinge verso NH₃) con un catalizzatore al ferro.', 'Haber-Bosch: at low T K is large but the reaction is very slow; at 700 K it is fast but K is small: that is why it runs at 150–300 bar (Δn = −2, pressure pushes towards NH₃) with an iron catalyst.') : '');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ── v238: la scatola 3D ─────────────────────────────────────────────── */
  var MENO_MOTO = false; try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  /* il pannello subito, la scena dopo (three.js al primo uso, il contesto WebGL e il contenuto in compiti separati) */
  function scheda3D(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new L3.Scena(destra, 0.8);
          var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
          destra.insertBefore(S.box, destra.firstChild);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.nome));
          div._scena = S;
          setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
        }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  var MAXP = 1400;
  function schedaScatola3D(pan) {
    var st = { r: 'isomero', pausa: MENO_MOTO }, Rx, T, K, G, Om0, k, ultimo = 0, cb = {}, part = null, info, bott = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' }), seme = 1;
    var tutte = { isomero: ISOMERO }; Object.keys(REAZIONI).forEach(function (q) { tutte[q] = REAZIONI[q]; });
    F.scelta(pan, ['Reazione', 'Reaction'], Object.keys(tutte).map(function (q) { return [q, tutte[q].nome]; }), st.r, function (v) { st.r = v; nuova(); });
    pan.appendChild(bott);
    var bp = F.bottone(pan, st.pausa ? ['▶ Avvia', '▶ Play'] : ['⏸ Pausa', '⏸ Pause'], function () { st.pausa = !st.pausa; bp.textContent = F.tt(st.pausa ? ['▶ Avvia', '▶ Play'] : ['⏸ Pausa', '⏸ Pause']); if (cb.sveglia) cb.sveglia(); });
    info = nota(pan); var spiega = nota(pan);
    spiega.innerHTML = t('Ogni sfera è una molecola (i colori come nel grafico della prima scheda). Le reazioni avvengono una alla volta con l’algoritmo di Gillespie: in ogni istante la probabilità di una reazione diretta o inversa è proporzionale ai prodotti dei numeri di molecole (legge di azione di massa), e il rapporto fra le due costanti di velocità è la K teorica alla temperatura scelta. All’equilibrio le reazioni non si fermano: in avanti e all’indietro succedono con la stessa frequenza, e i numeri oscillano attorno al valore medio. La K misurata viene dalle concentrazioni medie nel tempo; le fluttuazioni relative calano come 1/√N. Disturba il sistema e guarda come si riassesta (Le Chatelier).',
      'Each sphere is a molecule (colours as in the first tab’s chart). Reactions happen one at a time with the Gillespie algorithm: at every instant the probability of a forward or reverse reaction is proportional to the products of molecule numbers (mass action), and the ratio of the two rate constants is the theoretical K at the chosen temperature. At equilibrium reactions do not stop: forward and backward happen equally often, and the numbers fluctuate around the mean. The measured K comes from time-averaged concentrations; relative fluctuations shrink as 1/√N. Disturb the system and watch it settle again (Le Chatelier).');
    function disturbo() { G.somme = null; ultimo = G.t; testo(); }
    function nuova() {
      Rx = tutte[st.r]; T = Rx.T; K = costante(Rx, T).K;
      var tot = Rx.c0.reduce(function (a, b) { return a + b; }, 0); Om0 = 240 / tot;
      var cmax = Math.max.apply(null, Rx.c0), ordine = -Rx.nu.filter(function (v) { return v < 0; }).reduce(function (a, b) { return a + b; }, 0);
      k = 0.6 / Math.pow(cmax, ordine - 1);
      G = gillespie(Rx, Rx.c0.map(function (c) { return Math.round(c * Om0); }), Om0, k, K, seme++);
      ultimo = 0;
      bott.innerHTML = '';
      Rx.sp.forEach(function (s, i) { F.bottone(bott, ['+ ' + s, '+ ' + s], function () { aggiungi(i, Math.round(0.25 * G.Om)); disturbo(); }); });
      if (Rx.gas) { F.bottone(bott, ['Volume ÷ 2', 'Volume ÷ 2'], function () { G.Om /= 2; if (cb.volume) cb.volume(); disturbo(); }); F.bottone(bott, ['Volume × 2', 'Volume × 2'], function () { G.Om *= 2; if (cb.volume) cb.volume(); disturbo(); }); }
      F.bottone(bott, ['T + 50 K', 'T + 50 K'], function () { T += 50; K = G.K = costante(Rx, T).K; disturbo(); });
      F.bottone(bott, ['T − 50 K', 'T − 50 K'], function () { T = Math.max(200, T - 50); K = G.K = costante(Rx, T).K; disturbo(); });
      if (cb.nuova) cb.nuova(); testo();
    }
    function aggiungi(i, n) { var tot = G.N.reduce(function (a, b) { return a + b; }, 0); n = Math.min(n, MAXP - tot); if (n <= 0) return; G.N[i] += n; if (cb.aggiungi) cb.aggiungi(i, n); }
    function testo() {
      var c = G.N.map(function (x) { return x / G.Om; }), Qi = quoziente(Rx, c), cm = concMedie(G), eq = equilibrio(Rx, c, K).c, f = function (v) { return v < 1e-3 || v > 1e4 ? v.toExponential(3) : fmt(v); };
      info.innerHTML = '<b>' + Rx.nome + '</b> · T = ' + T + ' K · Ω = ' + fmt(G.Om) + t(' molecole per 1 M', ' molecules per 1 M') + '<br>' +
        'K ' + t('teorica', 'theoretical') + ' = <b class="bsiFX-num">' + f(K) + '</b> · Q ' + t('istantaneo', 'instantaneous') + ' = ' + f(Qi) + '<br>' +
        (cm ? 'K ' + t('misurata dalle medie', 'measured from the means') + ' (' + (G.t - ultimo - 4).toFixed(1) + ' s) = <b class="bsiFX-num">' + f(quoziente(Rx, cm)) + '</b> (' + ((quoziente(Rx, cm) / K - 1) * 100).toFixed(1) + ' %)<br>' : t('Rilassamento dopo il disturbo: la media parte fra poco…', 'Relaxing after the disturbance: averaging starts shortly…') + '<br>') +
        Rx.sp.map(function (s, i) { return '<span style="color:' + COLORI[i] + '">●</span> ' + s + ' ' + G.N[i] + (cm ? ' (' + t('media ', 'mean ') + fmt(cm[i]) + ' M' : ' (' + fmt(c[i]) + ' M') + '; ' + t('equilibrio deterministico ', 'deterministic equilibrium ') + fmt(eq[i]) + ' M)'; }).join('<br>') +
        '<br>' + t('Reazioni avvenute: ', 'Reactions so far: ') + (G.contati || 0);
    }
    nuova();
    return {
      nome: ['Equilibrio molecola per molecola in una scatola 3D', 'Equilibrium molecule by molecule in a 3D box'],
      tre: function (S, T3, L3) {
        var TH = T3, mesh = null, M4 = new TH.Matrix4(), col = new TH.Color(), x = new Float32Array(3 * MAXP), v = new Float32Array(3 * MAXP), sp = new Int8Array(MAXP), n = 0, Lw = 6.4, scatola = null;
        var q = 99 >>> 0, rnd = function () { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
        var CC = COLORI.map(function (h) { return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]; });
        function nasce(s, p) { if (n >= MAXP) return; for (var c = 0; c < 3; c++) { x[3 * n + c] = p ? p[c] + (rnd() - 0.5) * 0.3 : (rnd() - 0.5) * Lw; v[3 * n + c] = (rnd() - 0.5) * 2.4; } sp[n] = s; n++; }
        function muore(s) { var cand = []; for (var i = 0; i < n; i++) if (sp[i] === s) cand.push(i); if (!cand.length) return null; var i2 = cand[Math.floor(rnd() * cand.length)], p = [x[3 * i2], x[3 * i2 + 1], x[3 * i2 + 2]]; n--; for (var c = 0; c < 3; c++) { x[3 * i2 + c] = x[3 * n + c]; v[3 * i2 + c] = v[3 * n + c]; } sp[i2] = sp[n]; return p; }
        cb.sveglia = function () { S.avvia(); };
        cb.nuova = function () {
          n = 0; Lw = 6.4; G.N.forEach(function (N, s) { for (var i = 0; i < N; i++) nasce(s); }); cb.volume(); G.eventi = [];
          if (!mesh) { mesh = new TH.InstancedMesh(new TH.SphereGeometry(0.13, 12, 8), new TH.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }), MAXP); mesh.instanceMatrix.setUsage(TH.DynamicDrawUsage); for (var i = 0; i < MAXP; i++) mesh.setColorAt(i, col.setRGB(1, 1, 1)); /* il colore per istanza prima del primo disegno */ S.aggiungi(mesh); }
          disegna();
        };
        cb.aggiungi = function (s, m) { for (var i = 0; i < m; i++) nasce(s); };
        cb.volume = function () {
          var Ln = 6.4 * Math.pow(G.Om / Om0, 1 / 3), f = Ln / Lw; for (var i = 0; i < 3 * n; i++) x[i] *= f; Lw = Ln;
          if (scatola) { S.radice.remove(scatola); scatola.geometry.dispose(); scatola.material.dispose(); }
          scatola = new TH.LineSegments(new TH.EdgesGeometry(new TH.BoxGeometry(Lw, Lw, Lw)), new TH.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.5 })); S.aggiungi(scatola);
        };
        /* un evento di Gillespie diventa un incontro visibile: i reagenti spariscono, i prodotti nascono nel loro baricentro */
        function reagisci(verso) {
          var via = [], nuovi = [];
          Rx.nu.forEach(function (vv, i) { var m = vv * verso; if (m < 0) for (var j = 0; j < -m; j++) via.push(i); else for (j = 0; j < m; j++) nuovi.push(i); });
          var cen = [0, 0, 0], k2 = 0; via.forEach(function (s) { var p = muore(s); if (p) { cen[0] += p[0]; cen[1] += p[1]; cen[2] += p[2]; k2++; } });
          if (k2) cen = cen.map(function (c) { return c / k2; }); else cen = null;
          nuovi.forEach(function (s) { nasce(s, cen); });
        }
        function disegna() {
          for (var i = 0; i < n; i++) { M4.makeTranslation(x[3 * i], x[3 * i + 1], x[3 * i + 2]); mesh.setMatrixAt(i, M4); var c = CC[sp[i]]; mesh.setColorAt(i, col.setRGB(c[0], c[1], c[2])); }
          mesh.count = n; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
        cb.nuova();
        var tt = 0;
        S.ogniFotogramma(function (dt) {
          if (st.pausa) return false;
          avanzaSSA(G, dt);
          if (!G.somme && G.t - ultimo > 4) iniziaMedia(G);
          while (G.eventi.length) reagisci(G.eventi.shift());
          var h = Lw / 2 - 0.13;
          for (var i = 0; i < 3 * n; i++) { x[i] += v[i] * dt; if (x[i] > h) { x[i] = 2 * h - x[i]; v[i] = -v[i]; } else if (x[i] < -h) { x[i] = -2 * h - x[i]; v[i] = -v[i]; } }
          disegna();
          tt += dt; if (tt > 0.25) { tt = 0; testo(); }
          S.didascalia.textContent = Rx.nome + ' · ' + Rx.sp.map(function (s, j) { return s + ' ' + G.N[j]; }).join(' · ');
          return true;
        });
        S.inquadra(14, 0.6, 1.15);
      }
    };
  }

  F.sezione('schiequil', {
    titolo: ['⚖️ Equilibrio e Le Chatelier', '⚖️ Equilibrium and Le Chatelier'],
    sotto: ['Una reazione che raggiunge l’equilibrio sotto i tuoi occhi, e risponde quando aggiungi una specie, cambi il volume o la temperatura; K in funzione di T con ΔG° e il diagramma di van ’t Hoff.', 'A reaction reaching equilibrium before your eyes, responding when you add a species or change volume or temperature; K as a function of T with ΔG° and the van ’t Hoff plot.'],
    schede: [
      { nome: ['⚖️ Simulatore', '⚖️ Simulator'], costruisci: schedaSimulatore },
      { nome: ['🌡️ K e temperatura', '🌡️ K and temperature'], costruisci: schedaTemperatura },
      { nome: ['🧊 Scatola 3D', '🧊 3D box'], costruisci: scheda3D(schedaScatola3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
