/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-elettronica.js — 🔌 elettronica
   BioSpecInfo · © Samuele Pio Provenzano

   I circuiti lineari (RC, RLC, filtri) stanno in bsi-fis-circuiti.js; la
   fisica della giunzione p-n in bsi-fis-solido.js. Qui i componenti non
   lineari e attivi, come si usano davvero:

   · RADDRIZZATORI: a una semionda e a ponte, con il condensatore di
     livellamento e il carico; simulazione nel tempo con diodi a caduta
     fissa e resistenza serie: le punte di corrente brevi e intense nei
     diodi, l'angolo di conduzione, l'ondulazione ΔV ≈ I/(fC) (I/(2fC) a
     doppia semionda) confrontata con quella simulata;
   · DIODI E ZENER: il punto di lavoro di un diodo di Shockley,
     I = I_S(e^(V/nV_T) − 1), sulla retta di carico, risolto con Newton
     (passi limitati) e confrontato con la forma chiusa di Lambert;
     lo stabilizzatore Zener con la sua regolazione di linea e di carico;
   · AMPLIFICATORE A EMETTITORE COMUNE: polarizzazione con partitore e
     resistenza di emettitore (Newton sul transistor di Ebers–Moll
     semplificato), punto Q sulla retta di carico, guadagno −g_m R_C
     (g_m = I_C/V_T) misurato sulla simulazione a piccolo segnale; con
     segnali grandi la distorsione, la saturazione, l'interdizione. In 3D
     la superficie I_C(V_CE, I_B) con la retta di carico e il punto di
     lavoro che oscilla;
   · AMPLIFICATORI OPERAZIONALI: invertente, non invertente, integratore,
     trigger di Schmitt, con un operazionale vero (guadagno A₀ = 10⁵, un
     polo, prodotto guadagno-banda 1 MHz, saturazione ±V_sat) integrato
     nel tempo; soglie del trigger ±V_sat R₁/(R₁ + R₂);
   · DIGITALE: il convertitore ad approssimazioni successive (SAR) bit per
     bit, il DAC a scala R-2R risolto con l'analisi nodale, un contatore a
     4 bit (asincrono, con i ritardi che producono stati spuri, o
     sincrono) con il diagramma temporale.

   I calcoli (F.calcolo.elettronica) sono funzioni pure verificate in node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI, VT = 0.025852; /* kT/q a 300 K */

  /* ═══ 1. raddrizzatori ═══════════════════════════════════════════════════ */
  /* p = { Vp, f, C, R (carico, Ω) oppure I (corrente costante, A), Vd, Rs, ponte } */
  function raddrizzatore(p, periodi, passiPerPeriodo) {
    var T = 1 / p.f, n = Math.round((periodi || 10) * (passiPerPeriodo || 4000)), dt = (periodi || 10) * T / n, nd = p.ponte ? 2 : 1;
    var v = 0, out = { t: [], vs: [], vc: [], id: [] }, ogni = Math.max(1, Math.floor(n / 2400));
    var ultimo = { min: Infinity, max: -Infinity, somma: 0, cont: 0, idMax: 0, conduce: 0 }, inizioUltimo = n - Math.round(n / (periodi || 10));
    for (var i = 0; i <= n; i++) {
      var tt = i * dt, vs = p.Vp * Math.sin(2 * PI * p.f * tt), sorg = p.ponte ? Math.abs(vs) : vs;
      /* passo implicito sul condensatore (stabile anche con Rs piccola): C dv/dt = id − iload */
      var id = 0, vNuovo;
      var gL = p.I != null ? 0 : 1 / p.R, iL = p.I != null ? p.I : 0;
      vNuovo = (v * p.C / dt - iL) / (p.C / dt + gL);
      var cond = (sorg - nd * p.Vd - vNuovo) / p.Rs;
      if (cond > 0) { vNuovo = (v * p.C / dt - iL + (sorg - nd * p.Vd) / p.Rs) / (p.C / dt + gL + 1 / p.Rs); id = (sorg - nd * p.Vd - vNuovo) / p.Rs; }
      v = Math.max(vNuovo, p.I != null ? -1e9 : 0);
      if (i % ogni === 0) { out.t.push(tt); out.vs.push(vs); out.vc.push(v); out.id.push(id); }
      if (i >= inizioUltimo) { ultimo.min = Math.min(ultimo.min, v); ultimo.max = Math.max(ultimo.max, v); ultimo.somma += v; ultimo.cont++; ultimo.idMax = Math.max(ultimo.idMax, id); if (id > 0) ultimo.conduce++; }
    }
    out.ripple = ultimo.max - ultimo.min; out.Vdc = ultimo.somma / ultimo.cont; out.idMax = ultimo.idMax;
    out.angolo = 360 * ultimo.conduce / ultimo.cont * (p.ponte ? 0.5 : 1); /* gradi per semionda condotta */
    return out;
  }
  function rippleStima(I, f, C, ponte) { return I / ((ponte ? 2 : 1) * f * C); }

  /* ═══ 2. diodi: Newton, Lambert ══════════════════════════════════════════ */
  /* diodo: I = Is(e^(V/(n VT)) − 1); circuito Vin – R – diodo */
  function diodoNewton(Vin, R, Is, n) {
    var nV = n * VT, V = Math.min(Vin, 0.6), it = 0;
    for (; it < 200; it++) {
      var e = Math.exp(V / nV), f = (Vin - V) / R - Is * (e - 1), df = -1 / R - Is * e / nV, d = -f / df;
      /* passo limitato: l'esponenziale non perdona i passi lunghi */
      if (d > 2 * nV) d = 2 * nV; if (d < -0.5) d = -0.5;
      V += d; if (Math.abs(d) < 1e-15 * Math.max(1, Math.abs(V))) break;
    }
    var I = Is * (Math.exp(V / nV) - 1);
    return { V: V, I: I, iter: it, residuo: Vin - R * I - V };
  }
  /* W di Lambert (ramo principale) per Halley */
  function lambertW(x) {
    var w = x <= 10 ? Math.log(1 + x) : Math.log(x) - Math.log(Math.log(x));
    for (var i = 0; i < 100; i++) { var ew = Math.exp(w), f = w * ew - x, d = f / (ew * (w + 1) - (w + 2) * f / (2 * w + 2)); w -= d; if (Math.abs(d) < 1e-15 * (1 + Math.abs(w))) break; }
    return w;
  }
  /* I = (nV_T/R) W((Is R/nV_T) e^((Vin + Is R)/nV_T)) − Is; in logaritmo per non traboccare */
  function diodoLambert(Vin, R, Is, n) {
    var nV = n * VT, lx = Math.log(Is * R / nV) + (Vin + Is * R) / nV, w;
    if (lx < 600) w = lambertW(Math.exp(lx));
    else { w = lx - Math.log(lx); for (var i = 0; i < 60; i++) { var d = (w + Math.log(w) - lx) / (1 + 1 / w); w -= d; if (Math.abs(d) < 1e-15 * w) break; } }
    var I = nV / R * w - Is; return { I: I, V: Vin - R * I };
  }
  /* Zener: corrente inversa di breakdown I_ZT e^((V − V_ZT)/(n V_T)); regolatore Vin – Rs – (Zener ∥ RL) */
  function zener(Vin, Rs, RL, Vz, Izt, n) {
    var nV = n * VT, V = Math.min(Vin * RL / (Rs + RL), Vz - 0.3), it = 0, Iz;
    function iz(v) { return Izt * Math.exp((v - Vz) / nV); }
    for (; it < 300; it++) {
      var f = (Vin - V) / Rs - V / RL - iz(V), df = -1 / Rs - 1 / RL - iz(V) / nV, d = -f / df;
      if (d > 2 * nV) d = 2 * nV; if (d < -2) d = -2;
      V += d; if (Math.abs(d) < 1e-14) break;
    }
    Iz = iz(V);
    return { V: V, Iz: Iz, Is: (Vin - V) / Rs, IL: V / RL, residuo: (Vin - V) / Rs - V / RL - Iz, rz: nV / Iz, iter: it };
  }
  function bisezione(f, a, b) { var fa = f(a); for (var i = 0; i < 200; i++) { var m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; }

  /* ═══ 3. BJT a emettitore comune ═════════════════════════════════════════ */
  /* p = { Vcc, R1, R2, RC, RE, beta, Is } */
  function polarizza(p) {
    var Vth = p.Vcc * p.R2 / (p.R1 + p.R2), Rth = p.R1 * p.R2 / (p.R1 + p.R2), Vbe = 0.65, it = 0;
    /* incognita V_BE: I_C = Is e^(Vbe/VT), I_B = I_C/β; KVL di base: Vth − I_B Rth − Vbe − (I_C + I_B) RE = 0 */
    for (; it < 200; it++) {
      var Ic = p.Is * Math.exp(Vbe / VT), f = Vth - Ic / p.beta * Rth - Vbe - Ic * (1 + 1 / p.beta) * p.RE, df = -Ic / VT * (Rth / p.beta + (1 + 1 / p.beta) * p.RE) - 1, d = -f / df;
      if (d > 0.05) d = 0.05; if (d < -0.05) d = -0.05;
      Vbe += d; if (Math.abs(d) < 1e-15) break;
    }
    Ic = p.Is * Math.exp(Vbe / VT);
    var Ib = Ic / p.beta, Vce = p.Vcc - Ic * p.RC - (Ic + Ib) * p.RE;
    return { Vbe: Vbe, Ic: Ic, Ib: Ib, Vce: Vce, gm: Ic / VT, rpi: p.beta * VT / Ic, residuo: Vth - Ib * Rth - Vbe - (Ic + Ib) * p.RE, Vth: Vth, Rth: Rth, sat: Vce < 0.2 };
  }
  /* risposta nel tempo: emettitore a massa per il segnale (condensatore di bypass), base pilotata da Vbe_Q + v_in;
     I_C limitato dalla saturazione (V_CE ≥ 0,1 V); RL in parallelo a RC per il segnale (accoppiamento capacitivo) */
  function ceUscita(p, Q, vin, RL) {
    var Ic = p.Is * Math.exp((Q.Vbe + vin) / VT), Rac = RL ? p.RC * RL / (p.RC + RL) : p.RC, ve = (Q.Ic + Q.Ib) * p.RE;
    var vout = -(Ic - Q.Ic) * Rac, VceMin = 0.1 - (Q.Vce);
    /* saturazione: V_CE = V_CE,Q + vout non scende sotto 0,1 V */
    if (vout < VceMin) vout = VceMin;
    return vout;
  }
  function guadagnoCE(p, RL) { var Q = polarizza(p), Rac = RL ? p.RC * RL / (p.RC + RL) : p.RC; return -Q.gm * Rac; }
  /* caratteristiche di uscita: I_C = β I_B (1 − e^(−V_CE/0,1)) (1 + V_CE/V_A) */
  function caratteristica(Ib, Vce, beta, VA) { return beta * Ib * (1 - Math.exp(-Vce / 0.1)) * (1 + Vce / (VA || 1e9)); }

  /* ═══ 4. operazionali ════════════════════════════════════════════════════ */
  /* operazionale a un polo: dv_o/dt = ω_p (A₀(v₊ − v₋) − v_o), saturazione ±Vsat. tipo: inv, noninv, integ, schmitt */
  function opamp(tipo, p, vin, durata, dt) {
    var A0 = p.A0 || 1e5, wp = 2 * PI * (p.GBW || 1e6) / A0, Vs = p.Vsat || 13, vo = 0, vc = 0, out = { t: [], vin: [], vo: [] }, n = Math.round(durata / dt), ogni = Math.max(1, Math.floor(n / 2000));
    if (tipo === 'schmitt') vo = Vs;
    for (var i = 0; i <= n; i++) {
      var tt = i * dt, x = vin(tt), h = dt * wp, b;
      /* il polo e la retroazione negativa insieme, impliciti (il ciclo chiuso ha costante di tempo 1/(2π GBW β) ≪ dt) */
      if (tipo === 'inv') { b = p.Rin / (p.Rin + p.Rf); vo = (vo - h * A0 * (p.Rf / (p.Rin + p.Rf)) * x) / (1 + h + h * A0 * b); }
      else if (tipo === 'noninv') { b = p.R1 / (p.R1 + p.Rf); vo = (vo + h * A0 * x) / (1 + h + h * A0 * b); }
      else if (tipo === 'integ') {
        /* il condensatore fra v₋ e l'uscita: v₋ = v_o + v_C; la corrente in R, (x − v₋)/R, carica C */
        vo = (vo - h * A0 * vc) / (1 + h + h * A0);
        vc += dt * (x - (vo + vc)) / (p.R * p.C);
      } else {
        /* retroazione positiva: esplicita, l'uscita scatta verso il limite */
        b = p.R1 / (p.R1 + p.R2); vo = (vo + h * A0 * (b * vo - x)) / (1 + h);
      }
      if (vo > Vs) vo = Vs; if (vo < -Vs) vo = -Vs;
      if (i % ogni === 0) { out.t.push(tt); out.vin.push(x); out.vo.push(vo); }
    }
    return out;
  }
  function guadagnoIdeale(tipo, p) { return tipo === 'inv' ? -p.Rf / p.Rin : 1 + p.Rf / p.R1; }
  function guadagnoReale(tipo, p) { var A = p.A0 || 1e5, b = tipo === 'inv' ? p.Rin / (p.Rin + p.Rf) : p.R1 / (p.R1 + p.Rf), G = guadagnoIdeale(tipo, p); return G / (1 + 1 / (A * b)); }
  function soglieSchmitt(Vsat, R1, R2) { var v = Vsat * R1 / (R1 + R2); return [-v, v]; }

  /* ═══ 5. digitale ════════════════════════════════════════════════════════ */
  function sar(Vin, Vref, N) {
    var codice = 0, passi = [];
    for (var b = N - 1; b >= 0; b--) {
      var prova = codice | (1 << b), Vdac = Vref * prova / Math.pow(2, N), tiene = Vin >= Vdac;
      passi.push({ bit: b, prova: prova, Vdac: Vdac, tiene: tiene });
      if (tiene) codice = prova;
    }
    return { codice: codice, passi: passi };
  }
  /* scala R-2R a N bit: nodi 0..N−1 lungo la scala (N−1 = uscita, MSB); ogni nodo ha 2R verso il suo bit;
     il nodo 0 ha anche 2R verso massa (terminazione); fra nodi consecutivi R. Analisi nodale, Gauss */
  function r2r(codice, N, Vref) {
    var G = [], b = [], i, j, R = 1;
    for (i = 0; i < N; i++) { G.push(new Array(N).fill(0)); b.push(0); }
    for (i = 0; i < N; i++) {
      var vb = (codice >> i) & 1 ? Vref : 0;
      G[i][i] += 1 / (2 * R); b[i] += vb / (2 * R);
      if (i === 0) G[i][i] += 1 / (2 * R);
      if (i > 0) { G[i][i] += 1 / R; G[i][i - 1] -= 1 / R; }
      if (i < N - 1) { G[i][i] += 1 / R; G[i][i + 1] -= 1 / R; }
    }
    /* eliminazione di Gauss */
    for (i = 0; i < N; i++) { var p = G[i][i]; for (j = i + 1; j < N; j++) { var f = G[j][i] / p; if (!f) continue; for (var k = i; k < N; k++) G[j][k] -= f * G[i][k]; b[j] -= f * b[i]; } }
    var v = new Array(N); for (i = N - 1; i >= 0; i--) { var s = b[i]; for (j = i + 1; j < N; j++) s -= G[i][j] * v[j]; v[i] = s / G[i][i]; }
    return v[N - 1];
  }
  /* contatore a 4 bit: eventi in unita' di tempo; ritardo tp per flip-flop; asincrono: ogni stadio commuta sul fronte di discesa del precedente */
  function contatore(nClock, Tclk, tp, sincrono) {
    var ev = [], q = [0, 0, 0, 0], tracce = [[], [], [], []], clk = [], stati = [], tt;
    for (var k = 0; k < nClock; k++) {
      var tSal = k * Tclk, tDis = tSal + Tclk / 2; clk.push([tSal, 1], [tDis, 0]);
      /* conta sul fronte di salita */
      if (sincrono) {
        var nuovo = ((q[0] | q[1] << 1 | q[2] << 2 | q[3] << 3) + 1) & 15;
        for (var b = 0; b < 4; b++) { var nb = (nuovo >> b) & 1; if (nb !== q[b]) { q[b] = nb; tracce[b].push([tSal + tp, nb]); } }
        stati.push([tSal + tp, nuovo]);
      } else {
        tt = tSal; var b2 = 0;
        while (b2 < 4) { tt += tp; q[b2] ^= 1; tracce[b2].push([tt, q[b2]]); stati.push([tt, q[0] | q[1] << 1 | q[2] << 2 | q[3] << 3]); if (q[b2] === 1) break; b2++; }
      }
    }
    return { clk: clk, tracce: tracce, stati: stati };
  }

  F.calcolo.elettronica = {
    VT: VT, raddrizzatore: raddrizzatore, rippleStima: rippleStima, diodoNewton: diodoNewton, diodoLambert: diodoLambert, lambertW: lambertW, zener: zener, bisezione: bisezione,
    polarizza: polarizza, ceUscita: ceUscita, guadagnoCE: guadagnoCE, caratteristica: caratteristica,
    opamp: opamp, guadagnoIdeale: guadagnoIdeale, guadagnoReale: guadagnoReale, soglieSchmitt: soglieSchmitt,
    sar: sar, r2r: r2r, contatore: contatore
  };

  /* ═══ interfaccia ═══════════════════════════════════════════════════════ */
  if (!globale.document || !globale.document.createElement) return;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function eq(pan, testo) { var e = F.el('div', { 'class': 'bsiFX-eq', testo: testo }); pan.appendChild(e); return e; }
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
        attesa.remove();
        var S = new L3.Scena(destra, 0.58);
        /* nelle schede nascoste la scena non si ridimensiona (riallocare il framebuffer costa) */
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }

  /* ─── 1. Raddrizzatori ─────────────────────────────────────────────────── */
  function schedaRaddrizzatore(div) {
    var G = griglia(div), pan = G.pan, st = { ponte: true, Vp: 17, f: 50, C: 1000, R: 100, Vd: 0.7 };
    eq(pan, 'ΔV ≈ I/(f C)  (semionda),  I/(2 f C)  (ponte)');
    F.scelta(pan, ['Circuito', 'Circuit'], [['ponte', t('ponte di Graetz (doppia semionda)', 'bridge (full wave)')], ['semi', t('una semionda', 'half wave')]], 'ponte', function (v) { st.ponte = v === 'ponte'; calcola(); });
    F.cursore(pan, ['Tensione di picco V_p (V)', 'Peak voltage V_p (V)'], 3, 40, 0.5, st.Vp, function (v) { st.Vp = v; calcola(); });
    F.cursore(pan, ['Condensatore C (μF)', 'Capacitor C (μF)'], 10, 10000, 10, st.C, function (v) { st.C = v; calcola(); });
    F.cursore(pan, ['Carico R (Ω)', 'Load R (Ω)'], 10, 2000, 10, st.R, function (v) { st.R = v; calcola(); });
    F.scelta(pan, ['Frequenza di rete', 'Mains frequency'], [['50', '50 Hz'], ['60', '60 Hz']], '50', function (v) { st.f = +v; calcola(); });
    var info = nota(pan);
    nota(pan, t('Il condensatore si ricarica solo vicino al picco della sinusoide, per una piccola frazione del periodo: in quell’istante la corrente nei diodi è molte volte quella del carico (le punte rosse). Nel resto del tempo il condensatore alimenta il carico da solo e la tensione scende di ΔV ≈ I·Δt/C con Δt ≈ T (o T/2 con il ponte). Il ponte perde due cadute di diodo invece di una ma dimezza l’ondulazione. Resistenza serie della sorgente: 0,5 Ω.',
      'The capacitor recharges only near the sine peak, for a small fraction of the period: at that moment the diode current is many times the load current (the red spikes). The rest of the time the capacitor feeds the load alone and the voltage drops by ΔV ≈ I·Δt/C with Δt ≈ T (or T/2 with the bridge). The bridge loses two diode drops instead of one but halves the ripple. Source series resistance: 0.5 Ω.'));
    var tela = F.tela(G.dx, 0.5), tela2 = F.tela(G.dx, 0.32), R = null;
    function calcola() {
      R = raddrizzatore({ Vp: st.Vp, f: st.f, C: st.C * 1e-6, R: st.R, Vd: st.Vd, Rs: 0.5, ponte: st.ponte }, 8, 3000);
      var I = R.Vdc / st.R, stima = rippleStima(I, st.f, st.C * 1e-6, st.ponte);
      info.innerHTML = 'V<sub>dc</sub> = <b>' + R.Vdc.toFixed(2) + ' V</b>, I = ' + fmt(I * 1000) + ' mA<br>' + t('Ondulazione simulata ', 'Simulated ripple ') + '<b>' + fmt(R.ripple) + ' V</b> · ' + t('stima I/(', 'estimate I/(') + (st.ponte ? '2' : '') + 'fC) = <b>' + fmt(stima) + ' V</b><br>' +
        t('Picco di corrente nei diodi: ', 'Diode peak current: ') + '<b>' + fmt(R.idMax) + ' A</b> (' + fmt(R.idMax / I) + ' × I)<br>' + t('Angolo di conduzione ≈ ', 'Conduction angle ≈ ') + fmt(R.angolo) + '° ' + t('per semionda', 'per half cycle');
      var k0 = Math.floor(R.t.length * 5 / 8), xs = R.t.slice(k0).map(function (x) { return x * 1000; });
      F.grafico(tela, { serie: [{ x: xs, y: R.vs.slice(k0), col: '#34465f', etich: 'v_s' }, { x: xs, y: R.vs.slice(k0).map(function (v) { return st.ponte ? Math.abs(v) : v; }), col: '#6bcfff', tratt: true, etich: st.ponte ? '|v_s|' : 'v_s' }, { x: xs, y: R.vc.slice(k0), col: '#5eead4', larg: 2.5, etich: 'v_C' }], xl: ['tempo (ms)', 'time (ms)'], yl: ['tensione (V)', 'voltage (V)'], legenda: [{ col: '#6bcfff', etich: ['sorgente', 'source'] }, { col: '#5eead4', etich: ['uscita sul condensatore', 'capacitor output'] }], descr: ['Tensione raddrizzata e livellata', 'Rectified and smoothed voltage'] });
      F.grafico(tela2, { serie: [{ x: xs, y: R.id.slice(k0), col: '#ff8a80', etich: 'i_D' }], linee: [{ y: I, col: '#ffd24a', etich: t('corrente del carico', 'load current') }], ymin: 0, xl: ['tempo (ms)', 'time (ms)'], yl: ['corrente nei diodi (A)', 'diode current (A)'], descr: ['Corrente impulsiva nei diodi', 'Pulsed diode current'] });
    }
    calcola(); F.alRidimensiona(calcola);
  }

  /* ─── 2. Diodi e Zener ─────────────────────────────────────────────────── */
  var DIODI = { si: ['1N4148 (Si)', 2.52e-9, 1.752], led: [t('LED rosso', 'red LED'), 1e-18, 2.0], sch: ['Schottky', 1e-6, 1.05] };
  function schedaDiodi(div) {
    var G = griglia(div), pan = G.pan, st = { modo: 'diodo', d: 'si', Vin: 5, R: 1000, Vz: 5.1, Rs: 220, RL: 1000, Vinz: 12 };
    eq(pan, 'I = I_S (e^(V/nV_T) − 1),  (V_in − V)/R = I');
    var cont = F.el('div');
    F.scelta(pan, ['Circuito', 'Circuit'], [['diodo', t('diodo + resistenza (retta di carico)', 'diode + resistor (load line)')], ['zener', t('stabilizzatore Zener', 'Zener regulator')]], st.modo, function (v) { st.modo = v; comandi(); calcola(); });
    pan.appendChild(cont);
    var info = nota(pan);
    nota(pan, t('Il punto di lavoro è l’intersezione fra la caratteristica del diodo e la retta di carico della resistenza. L’equazione è trascendente: Newton converge in pochi passi se si limita il passo (l’esponenziale esplode se si sbaglia di qualche decimo di volt); il risultato coincide con la forma chiusa con la W di Lambert. Lo Zener lavora in breakdown: la sua caratteristica quasi verticale tiene la tensione ferma mentre la corrente cambia; la resistenza dinamica r_z = nV_T/I_Z misura quanto bene.',
      'The operating point is where the diode characteristic meets the resistor load line. The equation is transcendental: Newton converges in a few steps if the step is limited (the exponential blows up if you are off by a few tenths of a volt); the result matches the closed form with Lambert’s W. The Zener works in breakdown: its nearly vertical characteristic holds the voltage while the current changes; the dynamic resistance r_z = nV_T/I_Z measures how well.'));
    var tela = F.tela(G.dx, 0.55), tela2 = F.tela(G.dx, 0.36);
    function comandi() {
      cont.innerHTML = '';
      if (st.modo === 'diodo') {
        F.scelta(cont, ['Diodo', 'Diode'], Object.keys(DIODI).map(function (k) { return [k, DIODI[k][0]]; }), st.d, function (v) { st.d = v; calcola(); });
        F.cursore(cont, ['V_in (V)', 'V_in (V)'], 0.5, 12, 0.1, st.Vin, function (v) { st.Vin = v; calcola(); });
        F.cursore(cont, ['R (Ω)', 'R (Ω)'], 10, 10000, 10, st.R, function (v) { st.R = v; calcola(); });
      } else {
        F.cursore(cont, ['V_in (V)', 'V_in (V)'], 4, 24, 0.1, st.Vinz, function (v) { st.Vinz = v; calcola(); });
        F.cursore(cont, ['R serie (Ω)', 'Series R (Ω)'], 20, 2000, 10, st.Rs, function (v) { st.Rs = v; calcola(); });
        F.cursore(cont, ['Carico R_L (Ω)', 'Load R_L (Ω)'], 50, 10000, 10, st.RL, function (v) { st.RL = v; calcola(); });
      }
    }
    comandi();
    function calcola() {
      var xs = [], ys = [], yl = [], i;
      if (st.modo === 'diodo') {
        var d = DIODI[st.d], r = diodoNewton(st.Vin, st.R, d[1], d[2]), L = diodoLambert(st.Vin, st.R, d[1], d[2]), Vmax = Math.min(st.Vin, d[2] * 0.6 + 0.4) + 0.3;
        for (i = 0; i <= 300; i++) { var V = Vmax * i / 300; xs.push(V); ys.push(1000 * d[1] * (Math.exp(V / (d[2] * VT)) - 1)); yl.push(1000 * (st.Vin - V) / st.R); }
        var Imax = 1000 * st.Vin / st.R * 1.15;
        F.grafico(tela, { serie: [{ x: xs, y: ys, col: '#5eead4', etich: 'I_D(V)' }, { x: xs, y: yl, col: '#ffd24a', etich: t('retta di carico', 'load line') }], punti: [{ x: r.V, y: r.I * 1000, col: '#ff8a80', r: 5 }], xmin: 0, xmax: Vmax, ymin: 0, ymax: Imax, xl: ['V diodo (V)', 'diode V (V)'], yl: ['I (mA)', 'I (mA)'], legenda: [{ col: '#5eead4', etich: ['diodo di Shockley', 'Shockley diode'] }, { col: '#ffd24a', etich: ['(V_in − V)/R', '(V_in − V)/R'] }], descr: ['Punto di lavoro del diodo sulla retta di carico', 'Diode operating point on the load line'] });
        var xi = [], yi = []; for (i = 0; i <= 120; i++) { var vin = 12 * i / 120; xi.push(vin); yi.push(diodoNewton(vin, st.R, d[1], d[2]).V); }
        F.grafico(tela2, { serie: [{ x: xi, y: yi, col: '#c49bff', etich: 'V_D' }], xmin: 0, xmax: 12, ymin: 0, xl: ['V_in (V)', 'V_in (V)'], yl: ['V diodo (V)', 'diode V (V)'], descr: ['Tensione del diodo in funzione della tensione di ingresso', 'Diode voltage versus input voltage'] });
        info.innerHTML = '<b>' + d[0] + '</b>: I<sub>S</sub> = ' + d[1].toExponential(2) + ' A, n = ' + d[2] + '<br>Newton: V = <b>' + r.V.toFixed(6) + ' V</b>, I = <b>' + fmt(r.I * 1000) + ' mA</b> (' + r.iter + t(' iterazioni', ' iterations') + ')<br>Lambert W: V = ' + L.V.toFixed(6) + ' V · ' + t('residuo KVL ', 'KVL residual ') + r.residuo.toExponential(1) + ' V<br>' + t('Potenza nel diodo: ', 'Diode power: ') + fmt(r.V * r.I * 1000) + ' mW';
      } else {
        var z = zener(st.Vinz, st.Rs, st.RL, st.Vz, 5e-3, 1.5);
        for (i = 0; i <= 160; i++) { var vi = 4 + 20 * i / 160; xs.push(vi); ys.push(zener(vi, st.Rs, st.RL, st.Vz, 5e-3, 1.5).V); yl.push(vi * st.RL / (st.Rs + st.RL)); }
        F.grafico(tela, { serie: [{ x: xs, y: yl, col: '#34465f', tratt: true, etich: t('senza Zener', 'no Zener') }, { x: xs, y: ys, col: '#5eead4', etich: 'V_out' }], punti: [{ x: st.Vinz, y: z.V, col: '#ff8a80', r: 5 }], xmin: 4, xmax: 24, ymin: 0, xl: ['V_in (V)', 'V_in (V)'], yl: ['V_out (V)', 'V_out (V)'], descr: ['Regolazione di linea dello stabilizzatore Zener', 'Line regulation of the Zener regulator'] });
        var xr = [], yr = []; for (i = 0; i <= 160; i++) { var rl = 50 * Math.pow(200, i / 160); xr.push(Math.log10(rl)); yr.push(zener(st.Vinz, st.Rs, rl, st.Vz, 5e-3, 1.5).V); }
        F.grafico(tela2, { serie: [{ x: xr, y: yr, col: '#c49bff', etich: 'V_out' }], xl: ['log₁₀ R_L (Ω)', 'log₁₀ R_L (Ω)'], yl: ['V_out (V)', 'V_out (V)'], ymin: 0, descr: ['Regolazione di carico', 'Load regulation'] });
        var dV = zener(st.Vinz + 0.5, st.Rs, st.RL, st.Vz, 5e-3, 1.5).V - zener(st.Vinz - 0.5, st.Rs, st.RL, st.Vz, 5e-3, 1.5).V;
        info.innerHTML = 'V<sub>Z</sub> = ' + st.Vz + ' V a 5 mA, n = 1,5<br>V<sub>out</sub> = <b>' + z.V.toFixed(4) + ' V</b>, I<sub>Z</sub> = <b>' + fmt(z.Iz * 1000) + ' mA</b>, I<sub>L</sub> = ' + fmt(z.IL * 1000) + ' mA<br>' +
          'r<sub>z</sub> = ' + fmt(z.rz) + ' Ω · ' + t('regolazione di linea ΔV_out/ΔV_in = ', 'line regulation ΔV_out/ΔV_in = ') + fmt(dV) + ' (≈ r_z/(R_s + r_z) = ' + fmt(z.rz / (st.Rs + z.rz)) + ')<br>' + t('Potenza nello Zener: ', 'Zener power: ') + fmt(z.V * z.Iz * 1000) + ' mW · ' + t('residuo KVL ', 'KVL residual ') + z.residuo.toExponential(1) + ' A' + (z.Iz < 1e-4 ? '<br>' + t('Zener spento: la corrente non basta, V_out segue il partitore.', 'Zener off: not enough current, V_out follows the divider.') : '');
      }
    }
    calcola(); F.alRidimensiona(calcola);
  }

  /* ─── 3. Amplificatore a emettitore comune ─────────────────────────────── */
  function schedaCE(pan, destra) {
    var p = { Vcc: 12, R1: 47000, R2: 10000, RC: 4700, RE: 1000, beta: 150, Is: 1e-14 }, st = { amp: 10, RL: 100000, f: 1000 };
    eq(pan, 'A_v = −g_m (R_C ∥ R_L),  g_m = I_C/V_T');
    F.cursore(pan, ['R₂ (kΩ, partitore di base)', 'R₂ (kΩ, base divider)'], 2, 30, 0.5, p.R2 / 1000, function (v) { p.R2 = v * 1000; calcola(); });
    F.cursore(pan, ['R_C (kΩ)', 'R_C (kΩ)'], 0.5, 15, 0.1, p.RC / 1000, function (v) { p.RC = v * 1000; calcola(); });
    F.cursore(pan, ['β', 'β'], 50, 400, 10, p.beta, function (v) { p.beta = v; calcola(); });
    F.cursore(pan, ['Ampiezza del segnale (mV)', 'Signal amplitude (mV)'], 0.5, 60, 0.5, st.amp, function (v) { st.amp = v; calcola(); });
    F.cursore(pan, ['Carico R_L (kΩ)', 'Load R_L (kΩ)'], 1, 100, 1, st.RL / 1000, function (v) { st.RL = v * 1000; calcola(); });
    var info = nota(pan);
    nota(pan, t('Il partitore R₁–R₂ e la resistenza di emettitore fissano il punto di riposo Q in modo quasi indipendente da β (retroazione in continua); il condensatore di bypass mette l’emettitore a massa per il segnale, così il guadagno è quello pieno, −g_m R_C. Ma I_C = I_S e^(V_BE/V_T) è esponenziale: con pochi millivolt l’uscita è una sinusoide amplificata, con decine di millivolt le semionde diventano diverse (distorsione), poi l’uscita si schiaccia contro la saturazione (V_CE ≈ 0,1 V) o l’interdizione (I_C → 0).',
      'The R₁–R₂ divider and the emitter resistor set the quiescent point Q almost independently of β (DC feedback); the bypass capacitor grounds the emitter for the signal, so the gain is the full −g_m R_C. But I_C = I_S e^(V_BE/V_T) is exponential: with a few millivolts the output is an amplified sine, with tens of millivolts the half-cycles differ (distortion), then the output flattens against saturation (V_CE ≈ 0.1 V) or cutoff (I_C → 0).'));
    var tela = F.tela(destra, 0.42), tela2 = F.tela(destra, 0.42), cb = {}, Q = null;
    function calcola() {
      p.R1 = 47000; Q = polarizza(p);
      var Av = guadagnoCE(p, st.RL), xs = [], yi = [], yo = [], i;
      for (i = 0; i <= 400; i++) { var tt = 2 * i / 400 / st.f, vin = st.amp / 1000 * Math.sin(2 * PI * st.f * tt); xs.push(tt * 1000); yi.push(vin * 1000); yo.push(Math.max(-Q.Vce + 0.1, Math.min(p.Vcc - Q.Vce - (Q.Ic + Q.Ib) * p.RE, ceUscita(p, Q, vin, st.RL)))); }
      var mxo = Math.max.apply(null, yo), mno = Math.min.apply(null, yo);
      F.grafico(tela, { serie: [{ x: xs, y: yo, col: '#5eead4', etich: 'v_out (V)' }, { x: xs, y: yi.map(function (v) { return v * Math.abs(Av) / 1000; }), col: '#34465f', tratt: true, etich: '|A_v|·v_in' }], xl: ['tempo (ms)', 'time (ms)'], yl: ['v_out (V)', 'v_out (V)'], legenda: [{ col: '#5eead4', etich: ['uscita (grande segnale)', 'output (large signal)'] }, { col: '#34465f', etich: ['ingresso × |A_v|, invertito', 'input × |A_v|, inverted'] }], descr: ['Uscita dell’amplificatore a emettitore comune', 'Common-emitter amplifier output'] });
      var vce = [], cur = [], ser = [], cols = ['#34465f', '#4a6385', '#6b88b0', '#8fb0d8', '#b6d4f5'];
      for (var k = 1; k <= 5; k++) { var Ib = Q.Ib * k / 3, yy = []; vce = []; for (i = 0; i <= 120; i++) { var v = p.Vcc * i / 120; vce.push(v); yy.push(1000 * caratteristica(Ib, v, p.beta, 100)); } ser.push({ x: vce, y: yy, col: cols[k - 1], etich: 'I_B = ' + fmt(Ib * 1e6) + ' μA' }); }
      ser.push({ x: [0, p.Vcc], y: [1000 * p.Vcc / (p.RC + p.RE), 0], col: '#ffd24a', etich: t('retta di carico DC', 'DC load line') });
      F.grafico(tela2, { serie: ser, punti: [{ x: Q.Vce, y: Q.Ic * 1000, col: '#ff8a80', r: 6 }], xmin: 0, xmax: p.Vcc, ymin: 0, xl: ['V_CE (V)', 'V_CE (V)'], yl: ['I_C (mA)', 'I_C (mA)'], descr: ['Caratteristiche di uscita, retta di carico e punto Q', 'Output characteristics, load line and Q point'] });
      info.innerHTML = 'R₁ = 47 kΩ, R<sub>E</sub> = 1 kΩ, V<sub>CC</sub> = 12 V<br>Q: I<sub>C</sub> = <b>' + fmt(Q.Ic * 1000) + ' mA</b>, V<sub>CE</sub> = <b>' + fmt(Q.Vce) + ' V</b>, V<sub>BE</sub> = ' + Q.Vbe.toFixed(4) + ' V' + (Q.sat ? ' <span class="bsiFX-ko">' + t('saturato', 'saturated') + '</span>' : '') + '<br>' +
        'g<sub>m</sub> = ' + fmt(Q.gm * 1000) + ' mS, r<sub>π</sub> = ' + fmt(Q.rpi / 1000) + ' kΩ · A<sub>v</sub> = <b>' + fmt(Av) + '</b> (' + fmt(20 * Math.log10(Math.abs(Av))) + ' dB)<br>' +
        t('Uscita: da ', 'Output: from ') + fmt(mno) + t(' a +', ' to +') + fmt(mxo) + ' V · ' + t('asimmetria ', 'asymmetry ') + fmt(Math.abs(mxo + mno) / Math.max(1e-9, mxo - mno) * 100) + ' %';
      if (cb.aggiorna) cb.aggiorna();
    }
    calcola(); F.alRidimensiona(calcola);
    return {
      tre: function (S, T, L3) {
        /* superficie I_C(V_CE, I_B): x = V_CE, y = I_B, z = I_C */
        var NX = 60, NY = 40, mesh = null, pos, col, geo, puntino, scia, sPos, nS = 0, linea = null, fase = 0;
        function scale() { return { sx: 8 / p.Vcc, sy: 6 / (Q.Ib * 2.2), sz: 4 / Math.max(1e-9, p.beta * Q.Ib * 2.2) }; }
        function costruisci() {
          if (mesh) { S.radice.remove(mesh); geo.dispose(); }
          var s = scale(); geo = new T.PlaneGeometry(1, 1, NX, NY); pos = geo.attributes.position; col = new Float32Array(pos.count * 3);
          for (var i = 0; i < pos.count; i++) {
            var u = i % (NX + 1) / NX, w = Math.floor(i / (NX + 1)) / NY, Vce = p.Vcc * u, Ib = Q.Ib * 2.2 * w, Ic = caratteristica(Ib, Vce, p.beta, 100);
            pos.setXYZ(i, Vce * s.sx - 4, Ib * s.sy - 3, Ic * s.sz); var f = Math.min(1, Ic * s.sz / 4); col[3 * i] = 0.15 + 0.5 * f; col[3 * i + 1] = 0.35 + 0.5 * f; col[3 * i + 2] = 0.75 - 0.2 * f;
          }
          geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
          mesh = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.6, transparent: true, opacity: 0.88 }));
          S.aggiungi(mesh);
          if (linea) { S.radice.remove(linea); linea.geometry.dispose(); }
          /* la retta di carico DC sulla superficie: per ogni V_CE l'I_C della retta e l'I_B che la produce */
          var pts = []; for (i = 0; i <= 80; i++) { var Vc = p.Vcc * i / 80, Icl = (p.Vcc - Vc) / (p.RC + p.RE), den = p.beta * (1 - Math.exp(-Vc / 0.1)) * (1 + Vc / 100), Ibl = den > 0 ? Icl / den : 1; if (Ibl > Q.Ib * 2.2) continue; pts.push([Vc * s.sx - 4, Ibl * s.sy - 3, Icl * s.sz + 0.02]); }
          linea = L3.linea(T, pts, 0xffd24a); S.aggiungi(linea);
        }
        var bordo = new T.Group(); S.aggiungi(bordo);
        var ex = L3.testo3d(T, 'V_CE', '#ff6b6b', 0.35); ex.position.set(4.6, -3.3, 0); S.aggiungi(ex);
        var ey = L3.testo3d(T, 'I_B', '#5eead4', 0.35); ey.position.set(-4.4, 3.4, 0); S.aggiungi(ey);
        var ez = L3.testo3d(T, 'I_C', '#6bcfff', 0.35); ez.position.set(-4.3, -3.3, 4.5); S.aggiungi(ez);
        S.aggiungi(L3.linea(T, [[-4, -3, 0], [4.2, -3, 0]], 0xff6b6b)); S.aggiungi(L3.linea(T, [[-4, -3, 0], [-4, 3.2, 0]], 0x5eead4)); S.aggiungi(L3.linea(T, [[-4, -3, 0], [-4, -3, 4.3]], 0x6bcfff));
        puntino = L3.sfera(T, 0.13, 0xff8a80, 0, 0, 0, true); S.aggiungi(puntino);
        sPos = new Float32Array(600 * 3); var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sPos, 3)); sg.setDrawRange(0, 0);
        scia = new T.Line(sg, new T.LineBasicMaterial({ color: 0xff8a80 })); S.aggiungi(scia);
        cb.aggiorna = function () { costruisci(); nS = 0; S.avvia(); };
        costruisci();
        S.ogniFotogramma(function (dt) {
          fase += dt * 1.2; var s = scale(), vin = st.amp / 1000 * Math.sin(2 * PI * fase * 0.5);
          var vo = ceUscita(p, Q, vin, null), Vc = Math.max(0.1, Q.Vce + vo), Icn = (Q.Ic - vo / p.RC), Ib = Icn / p.beta;
          var x = Vc * s.sx - 4, y = Math.min(3.6, Ib * s.sy - 3), z = Math.max(0, Icn) * s.sz;
          puntino.position.set(x, y, z + 0.05);
          if (nS < 600) { sPos[3 * nS] = x; sPos[3 * nS + 1] = y; sPos[3 * nS + 2] = z + 0.04; nS++; } else { sPos.copyWithin(0, 3); sPos[3 * 599] = x; sPos[3 * 599 + 1] = y; sPos[3 * 599 + 2] = z + 0.04; }
          scia.geometry.attributes.position.needsUpdate = true; scia.geometry.setDrawRange(0, nS);
          S.didascalia.textContent = t('Superficie I_C(V_CE, I_B) con la retta di carico; il punto di lavoro oscilla col segnale di ', 'Surface I_C(V_CE, I_B) with the load line; the operating point swings with a signal of ') + st.amp + ' mV';
          return true;
        });
        S.inquadra(15, -1.1, 1.0);
      }
    };
  }

  /* ─── 4. Operazionali ──────────────────────────────────────────────────── */
  function schedaOpamp(div) {
    var G = griglia(div), pan = G.pan, st = { tipo: 'inv', Rf: 100, Rin: 10, amp: 0.5, f: 1000, R1: 10, R2: 30 };
    eq(pan, 'invertente −R_f/R_in · non invertente 1 + R_f/R₁ · integratore −1/(RC)∫v dt');
    F.scelta(pan, ['Configurazione', 'Configuration'], [['inv', t('invertente', 'inverting')], ['noninv', t('non invertente', 'non-inverting')], ['integ', t('integratore (onda quadra in ingresso)', 'integrator (square-wave input)')], ['schmitt', t('trigger di Schmitt (onda triangolare)', 'Schmitt trigger (triangle input)')]], st.tipo, function (v) { st.tipo = v; calcola(); });
    F.cursore(pan, ['R_f (kΩ) · nel trigger R₂', 'R_f (kΩ) · in the trigger R₂'], 1, 200, 1, st.Rf, function (v) { st.Rf = v; st.R2 = v; calcola(); });
    F.cursore(pan, ['R_in = R₁ (kΩ)', 'R_in = R₁ (kΩ)'], 1, 100, 1, st.Rin, function (v) { st.Rin = v; st.R1 = v; calcola(); });
    F.cursore(pan, ['Ampiezza in ingresso (V)', 'Input amplitude (V)'], 0.05, 10, 0.05, st.amp, function (v) { st.amp = v; calcola(); });
    F.cursore(pan, ['Frequenza (kHz)', 'Frequency (kHz)'], 0.1, 200, 0.1, st.f / 1000, function (v) { st.f = v * 1000; calcola(); });
    var info = nota(pan);
    nota(pan, t('L’operazionale qui non è ideale: guadagno ad anello aperto 10⁵, un polo (prodotto guadagno-banda 1 MHz), uscita limitata a ±13 V. Con la retroazione negativa il guadagno diventa quello dei resistori finché A₀β ≫ 1; alzando la frequenza oltre GBW/|G| il guadagno cala e compare uno sfasamento; alzando l’ampiezza l’uscita satura. Il trigger di Schmitt usa la retroazione POSITIVA: due soglie diverse in salita e in discesa (isteresi) rendono la commutazione pulita anche con un ingresso rumoroso.',
      'The op-amp here is not ideal: open-loop gain 10⁵, one pole (1 MHz gain-bandwidth product), output limited to ±13 V. With negative feedback the gain becomes that of the resistors as long as A₀β ≫ 1; raising the frequency above GBW/|G| the gain drops and a phase lag appears; raising the amplitude the output saturates. The Schmitt trigger uses POSITIVE feedback: two different thresholds on the way up and down (hysteresis) make switching clean even with a noisy input.'));
    var tela = F.tela(G.dx, 0.5), tela2 = F.tela(G.dx, 0.42), timer = null;
    function calcola() { clearTimeout(timer); timer = setTimeout(simula, 30); }
    function simula() {
      var p = { Rf: st.Rf * 1e3, Rin: st.Rin * 1e3, R1: st.R1 * 1e3, R2: st.R2 * 1e3, R: st.Rin * 1e3, C: 10e-9, A0: 1e5, GBW: 1e6, Vsat: 13 }, T = 1 / st.f, vin, durata = 3 * T, dt = Math.min(T / 2000, 2e-8 * 50);
      if (st.tipo === 'integ') vin = function (tt) { return ((tt / T) % 1) < 0.5 ? st.amp : -st.amp; };
      else if (st.tipo === 'schmitt') vin = function (tt) { var u = (tt / T + 0.25) % 1; return st.amp * 2 * (u < 0.5 ? 4 * u - 1 : 3 - 4 * u) / 2; };
      else vin = function (tt) { return st.amp * Math.sin(2 * PI * tt / T); };
      var R = opamp(st.tipo, p, vin, durata, dt), xs = R.t.map(function (x) { return x * 1000; });
      F.grafico(tela, { serie: [{ x: xs, y: R.vin, col: '#6bcfff', etich: 'v_in' }, { x: xs, y: R.vo, col: '#5eead4', larg: 2.5, etich: 'v_out' }], ymin: -14, ymax: 14, linee: [{ y: 13, col: '#ff8a80', etich: '+V_sat' }, { y: -13, col: '#ff8a80', etich: '−V_sat' }], xl: ['tempo (ms)', 'time (ms)'], yl: ['tensione (V)', 'voltage (V)'], legenda: [{ col: '#6bcfff', etich: ['ingresso', 'input'] }, { col: '#5eead4', etich: ['uscita', 'output'] }], descr: ['Ingresso e uscita dell’operazionale', 'Op-amp input and output'] });
      var testo;
      if (st.tipo === 'schmitt') {
        var s = soglieSchmitt(13, p.R1, p.R2), k0 = Math.floor(R.t.length / 3);
        F.grafico(tela2, { serie: [{ x: R.vin.slice(k0), y: R.vo.slice(k0), col: '#ffd24a', etich: 'v_out(v_in)' }], xmin: -Math.max(st.amp, 0.1) * 1.1, xmax: Math.max(st.amp, 0.1) * 1.1, ymin: -14, ymax: 14, xl: ['v_in (V)', 'v_in (V)'], yl: ['v_out (V)', 'v_out (V)'], descr: ['Ciclo di isteresi del trigger di Schmitt', 'Schmitt trigger hysteresis loop'] });
        testo = t('Soglie: ', 'Thresholds: ') + '<b>±' + fmt(s[1]) + ' V</b> = ±V<sub>sat</sub> R₁/(R₁ + R₂) · ' + t('isteresi ', 'hysteresis ') + fmt(2 * s[1]) + ' V' + (st.amp < s[1] ? '<br>' + t('L’ingresso non raggiunge le soglie: l’uscita non commuta.', 'The input does not reach the thresholds: the output never switches.') : '');
      } else if (st.tipo === 'integ') {
        var slope = st.amp / (p.R * p.C);
        F.grafico(tela2, { serie: [{ x: [0, 1], y: [0, 0], col: '#34465f' }], xmin: 0, xmax: 1, ymin: -1, ymax: 1, xl: ['—', '—'], yl: ['—', '—'], descr: ['Nessun grafico secondario per l’integratore', 'No secondary chart for the integrator'] });
        testo = 'RC = ' + fmt(p.R * p.C * 1e6) + ' μs · ' + t('pendenza della rampa ', 'ramp slope ') + '<b>∓' + fmt(slope / 1000) + ' V/ms</b> (V<sub>in</sub>/RC)<br>' + t('Escursione per semiperiodo: ', 'Swing per half period: ') + fmt(slope * T / 2) + ' V' + (slope * T / 2 > 26 ? t(' (oltre la saturazione)', ' (beyond saturation)') : '') + '<br>' + t('Senza una resistenza in parallelo a C un integratore reale deriva fino alla saturazione per ogni piccolo offset.', 'Without a resistor across C a real integrator drifts into saturation from any small offset.');
      } else {
        var Gi = guadagnoIdeale(st.tipo, p), Gr = guadagnoReale(st.tipo, p), fT = 1e6 / Math.abs(st.tipo === 'inv' ? 1 - Gi : Gi), freq = [], mod = [];
        for (var i = 0; i <= 120; i++) { var lf = 1 + 6 * i / 120, ff = Math.pow(10, lf), w = 2 * PI * ff , b = st.tipo === 'inv' ? p.Rin / (p.Rin + p.Rf) : p.R1 / (p.R1 + p.Rf); freq.push(lf); var Ac = { re: 1e5 / (1 + Math.pow(w / (2 * PI * 10), 2)), im: -1e5 * (w / (2 * PI * 10)) / (1 + Math.pow(w / (2 * PI * 10), 2)) }, den = { re: 1 + b * Ac.re, im: b * Ac.im }, G = Math.hypot(Ac.re, Ac.im) / Math.hypot(den.re, den.im) * (st.tipo === 'inv' ? (1 - b) : 1); mod.push(20 * Math.log10(G)); }
        F.grafico(tela2, { serie: [{ x: freq, y: mod, col: '#ffd24a', etich: '|G| (dB)' }], xl: ['log₁₀ f (Hz)', 'log₁₀ f (Hz)'], yl: ['|G| (dB)', '|G| (dB)'], descr: ['Risposta in frequenza ad anello chiuso', 'Closed-loop frequency response'] });
        var mx = Math.max.apply(null, R.vo.slice(Math.floor(R.vo.length / 2))), mi = Math.min.apply(null, R.vo.slice(Math.floor(R.vo.length / 2)));
        testo = t('Guadagno ideale ', 'Ideal gain ') + '<b>' + fmt(Gi) + '</b> · ' + t('con A₀ = 10⁵: ', 'with A₀ = 10⁵: ') + Gr.toFixed(5) + '<br>' + t('Banda a −3 dB ≈ GBW/(1/β) = ', '−3 dB bandwidth ≈ GBW/(1/β) = ') + fmt(fT / 1000) + ' kHz<br>' + t('Uscita simulata: ', 'Simulated output: ') + fmt(mi) + ' … ' + fmt(mx) + ' V' + (Math.abs(Gi * st.amp) > 13 ? ' <span class="bsiFX-ko">' + t('satura', 'saturates') + '</span>' : '');
      }
      info.innerHTML = testo;
    }
    simula(); F.alRidimensiona(simula);
  }

  /* ─── 5. ADC, DAC, contatore ───────────────────────────────────────────── */
  function schedaDigitale(div) {
    var G = griglia(div), pan = G.pan, st = { Vin: 3.3, N: 8, Vref: 5, sincrono: false, tp: 0.08 };
    eq(pan, 'codice = ⌊V_in 2ᴺ/V_ref⌋,  V_DAC = V_ref·codice/2ᴺ');
    F.cursore(pan, ['V_in (V)', 'V_in (V)'], 0, 5, 0.01, st.Vin, function (v) { st.Vin = v; disegna(); });
    F.cursore(pan, ['Bit N', 'Bits N'], 3, 12, 1, st.N, function (v) { st.N = v; disegna(); });
    F.scelta(pan, ['Contatore', 'Counter'], [['asin', t('asincrono (a ondulazione)', 'asynchronous (ripple)')], ['sin', t('sincrono', 'synchronous')]], 'asin', function (v) { st.sincrono = v === 'sin'; disegna(); });
    F.cursore(pan, ['Ritardo del flip-flop (frazione del periodo)', 'Flip-flop delay (fraction of period)'], 0.01, 0.2, 0.01, st.tp, function (v) { st.tp = v; disegna(); });
    var info = nota(pan);
    nota(pan, t('Il SAR prova i bit dal più significativo: accende il bit, confronta la tensione del DAC con l’ingresso, lo tiene se V_DAC ≤ V_in. N confronti bastano per N bit (ricerca binaria). Il DAC a scala R-2R usa solo due valori di resistenza: ogni nodo vede verso destra 2R, così ogni bit pesa la metà del precedente. Il contatore asincrono propaga il cambiamento da un flip-flop al successivo: durante la propagazione passa per stati sbagliati (in rosso, per esempio 7 → 6 → 4 → 0 → 8), che una logica a valle potrebbe leggere; il sincrono commuta tutti i bit insieme.',
      'The SAR tries bits from the most significant: it sets the bit, compares the DAC voltage with the input, keeps it if V_DAC ≤ V_in. N comparisons suffice for N bits (binary search). The R-2R ladder DAC uses only two resistor values: each node sees 2R to its right, so each bit weighs half the previous one. The asynchronous counter propagates the change from one flip-flop to the next: during propagation it passes through wrong states (in red, e.g. 7 → 6 → 4 → 0 → 8), which downstream logic might read; the synchronous one switches all bits together.'));
    var tela = F.tela(G.dx, 0.45), tela2 = F.tela(G.dx, 0.5);
    function disegna() {
      var r = sar(st.Vin, st.Vref, st.N), xs = [], ys = [], i, lsb = st.Vref / Math.pow(2, st.N);
      r.passi.forEach(function (p, k) { xs.push(k, k + 1); ys.push(p.Vdac, p.Vdac); });
      var punti = r.passi.map(function (p, k) { return { x: k + 0.5, y: p.Vdac, col: p.tiene ? '#5eead4' : '#ff8a80', r: 5 }; });
      F.grafico(tela, { serie: [{ x: xs, y: ys, col: '#ffd24a', etich: 'V_DAC' }, { x: [0, st.N], y: [st.Vin, st.Vin], col: '#6bcfff', tratt: true, etich: 'V_in' }], punti: punti, xmin: 0, xmax: st.N, ymin: 0, ymax: st.Vref, xl: ['passo della conversione (dal MSB)', 'conversion step (from MSB)'], yl: ['tensione (V)', 'voltage (V)'], legenda: [{ col: '#ffd24a', etich: ['tentativo del DAC', 'DAC trial'] }, { col: '#6bcfff', etich: ['ingresso', 'input'] }], descr: ['Approssimazioni successive bit per bit', 'Successive approximation bit by bit'] });
      var bin = r.codice.toString(2); while (bin.length < st.N) bin = '0' + bin;
      info.innerHTML = t('Codice: ', 'Code: ') + '<b>' + r.codice + '</b> = <b>' + bin + '</b>₂ · LSB = ' + fmt(lsb * 1000) + ' mV<br>' + t('DAC R-2R (analisi nodale): ', 'R-2R DAC (nodal analysis): ') + '<b>' + r2r(r.codice, st.N, st.Vref).toFixed(6) + ' V</b> · ' + t('errore di quantizzazione ', 'quantisation error ') + fmt((st.Vin - r.codice * lsb) * 1000) + ' mV<br>' +
        r.passi.map(function (p) { return 'b' + p.bit + (p.tiene ? '✓' : '✗'); }).join(' ');
      /* diagramma temporale del contatore */
      var P = F.pennello(tela2), q = P.q, W = P.W, H = P.H, nC = 18, C = contatore(nC, 1, st.tp, st.sincrono), x0 = 44, X = function (tt) { return x0 + (W - x0 - 8) * tt / nC; }, righe = ['CLK', 'Q0', 'Q1', 'Q2', 'Q3'], rh = (H - 54) / 5;
      q.font = '11px system-ui,sans-serif';
      righe.forEach(function (nome, k) {
        var y0 = 14 + k * rh, alto = y0 + 4, basso = y0 + rh * 0.62, tr = k === 0 ? C.clk : C.tracce[k - 1], liv = 0;
        q.fillStyle = '#9fb1c6'; q.textAlign = 'left'; q.fillText(nome, 4, (alto + basso) / 2 + 4);
        q.strokeStyle = k === 0 ? '#ffd24a' : '#5eead4'; q.lineWidth = 1.6; q.beginPath(); q.moveTo(X(0), basso);
        tr.forEach(function (e) { q.lineTo(X(e[0]), liv ? alto : basso); liv = e[1]; q.lineTo(X(e[0]), liv ? alto : basso); });
        q.lineTo(X(nC), liv ? alto : basso); q.stroke(); q.lineWidth = 1;
      });
      /* il valore contato; gli stati spuri in rosso */
      var yv = 14 + 5 * rh + 4, prec = 0;
      C.stati.forEach(function (s, k) {
        var buono = st.sincrono || k === C.stati.length - 1 || Math.floor(C.stati[k + 1][0]) !== Math.floor(s[0]) || C.stati[k + 1][0] - s[0] > 0.5;
        if (!buono) { q.fillStyle = '#ff8a80'; q.fillRect(X(s[0]), yv - 2, Math.max(1.5, X(C.stati[k + 1][0]) - X(s[0])), 4); }
        else if (s[0] - prec > 0.3 || k === 0) { q.fillStyle = '#e6fffb'; q.textAlign = 'center'; q.fillText(String(s[1]), X(s[0] + 0.45), yv + 14); prec = s[0]; }
      });
      q.fillStyle = '#9fb1c6'; q.textAlign = 'left'; q.fillText(t('valore', 'value'), 4, yv + 14);
      tela2.setAttribute('aria-label', t('Diagramma temporale del contatore a 4 bit', '4-bit counter timing diagram'));
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('sfiselettronica', {
    titolo: ['🔌 Elettronica', '🔌 Electronics'],
    sotto: ['I componenti non lineari e attivi al lavoro: raddrizzatori con condensatore, diodi e Zener sulla retta di carico, l’amplificatore a emettitore comune con la sua superficie 3D, gli amplificatori operazionali reali, il convertitore SAR, il DAC R-2R e i contatori.', 'Nonlinear and active components at work: rectifiers with a capacitor, diodes and Zeners on the load line, the common-emitter amplifier with its 3D surface, real operational amplifiers, the SAR converter, the R-2R DAC and counters.'],
    schede: [
      { nome: ['〰️ Raddrizzatori', '〰️ Rectifiers'], costruisci: schedaRaddrizzatore },
      { nome: ['🔻 Diodi e Zener', '🔻 Diodes and Zener'], costruisci: schedaDiodi },
      { nome: ['📶 Emettitore comune', '📶 Common emitter'], costruisci: scheda3D(schedaCE) },
      { nome: ['🔺 Operazionali', '🔺 Op-amps'], costruisci: schedaOpamp },
      { nome: ['🔢 ADC, DAC, contatori', '🔢 ADC, DAC, counters'], costruisci: schedaDigitale }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
