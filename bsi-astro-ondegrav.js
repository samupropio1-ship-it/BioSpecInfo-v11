/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-ondegrav.js — 〰️ onde gravitazionali
   BioSpecInfo · © Samuele Pio Provenzano

   Le onde gravitazionali sono increspature della metrica che viaggiano alla
   velocita' della luce; le sorgenti che oggi si osservano sono coppie di
   buchi neri e di stelle di neutroni che si avvicinano a spirale. Qui:

   · LA SPIRALE IN 3D: due masse che orbitano e si avvicinano perdendo
     energia secondo la formula del quadrupolo (da/dt = −(64/5) G³m₁m₂M/(c⁵a³));
     il «telo» dello spaziotempo incavato dalle due masse e increspato dall'onda
     che si allontana a spirale, e il fronte d'onda come superficie 3D che
     mostra le due polarizzazioni: h₊ ∝ (1 + cos²θ)/2, h× ∝ cos θ;
   · IL CINGUETTIO (chirp): frequenza e ampiezza contro il tempo dal
     quadrupolo newtoniano, f ∝ (t_c − t)^(−3/8), h ∝ f^(2/3)/d, governati dalla
     sola massa di chirp ℳ = (m₁m₂)^(3/5)/(m₁ + m₂)^(1/5); l'evento GW150914
     (36 + 29 M☉ a ~410 Mpc), GW170817 (due stelle di neutroni); lo
     spettrogramma teorico e il suono del segnale con Web Audio, spostato
     nella banda udibile;
   · IL RIVELATORE: un interferometro di Michelson come LIGO, con i bracci che
     si allungano e si accorciano (esagerati di 10²⁰ volte) al passaggio
     dell'onda +, l'anello di masse di prova che si deforma, e la risposta
     direzionale F₊² + F×² come superficie 3D;
   · LA PULSAR DI HULSE E TAYLOR: l'orbita eccentrica di PSR B1913+16 in 3D e
     lo spostamento cumulativo del periastro, una parabola, dalla formula di
     Peters e Mathews per Ṗ_b (−2,40·10⁻¹²): la prima prova (1974-1982) che le
     onde gravitazionali esistono.

   I calcoli stanno in F.calcolo.ondegrav (SI), separati dal disegno.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  var G = 6.67430e-11, c = 299792458, MSOLE = 1.98847e30, MPC = 3.0856775814913673e22, ANNO = 3.15576e7, GIORNO = 86400;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function massaChirp(m1, m2) { return Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2); }
  function tempoChirp(Mc) { return G * Mc / (c * c * c); } /* G ℳ / c³ in secondi */
  /* frequenza dell'onda (2 × orbitale) a un tempo τ = t_c − t dalla coalescenza */
  function frequenza(Mc, tau) { return Math.pow(5 / (256 * tau), 3 / 8) * Math.pow(tempoChirp(Mc), -5 / 8) / Math.PI; }
  function tempoDaFrequenza(Mc, f) { return 5 / 256 * Math.pow(tempoChirp(Mc), -5 / 3) * Math.pow(Math.PI * f, -8 / 3); }
  /* fase dell'onda: Φ(τ) = −2 (τ / (5 Gℳ/c³))^(5/8), dΦ/dt = 2πf */
  function fase(Mc, tau) { return -2 * Math.pow(tau / (5 * tempoChirp(Mc)), 5 / 8); }
  /* ampiezza per una sorgente vista di faccia: h = (4/d)(Gℳ/c²)^(5/3)(πf/c)^(2/3) */
  function ampiezza(Mc, f, d) { return 4 / d * Math.pow(G * Mc / (c * c), 5 / 3) * Math.pow(Math.PI * f / c, 2 / 3); }
  /* ḟ = (96/5) π^(8/3) (Gℳ/c³)^(5/3) f^(11/3), e la massa di chirp ricavata da f e ḟ */
  function fpunto(Mc, f) { return 96 / 5 * Math.pow(Math.PI, 8 / 3) * Math.pow(tempoChirp(Mc), 5 / 3) * Math.pow(f, 11 / 3); }
  function chirpDaFFpunto(f, fp) { return c * c * c / G * Math.pow(5 / 96 * Math.pow(Math.PI, -8 / 3) * Math.pow(f, -11 / 3) * fp, 3 / 5); }
  /* orbita circolare: separazione per una frequenza dell'onda (Keplero, f_orb = f/2) */
  function separazione(M, f) { var w = Math.PI * f; return Math.cbrt(G * M / (w * w)); }
  /* tempo di coalescenza da una separazione iniziale (Peters 1964, orbita circolare) */
  function tempoCoalescenza(m1, m2, a) { return 5 / 256 * Math.pow(c, 5) * Math.pow(a, 4) / (G * G * G * m1 * m2 * (m1 + m2)); }
  function dadt(m1, m2, a) { return -64 / 5 * G * G * G * m1 * m2 * (m1 + m2) / (Math.pow(c, 5) * a * a * a); }
  /* secondo metodo: integrazione numerica di da/dt fino a a → 0 (in log a) */
  function tempoCoalescenzaNumerico(m1, m2, a0) {
    var N = 20000, tt = 0, la0 = Math.log(a0), la1 = Math.log(a0 * 1e-4);
    for (var i = 0; i < N; i++) { var la = la0 + (la1 - la0) * (i + 0.5) / N, a = Math.exp(la), dla = (la1 - la0) / N; tt += a * dla / dadt(m1, m2, a); }
    return tt; /* la coda sotto 10⁻⁴ a₀ vale 10⁻¹⁶ del totale */
  }
  /* potenza irradiata (quadrupolo) ed energia orbitale */
  function potenza(m1, m2, a) { return 32 / 5 * Math.pow(G, 4) * m1 * m1 * m2 * m2 * (m1 + m2) / (Math.pow(c, 5) * Math.pow(a, 5)); }
  function energiaOrbitale(m1, m2, a) { return -G * m1 * m2 / (2 * a); }
  /* frequenza dell'onda all'ISCO della massa totale: f = c³/(6^(3/2) π G M) */
  function fISCO(M) { return c * c * c / (Math.pow(6, 1.5) * Math.PI * G * M); }
  /* oscillazione del buco nero finale (modo l = m = 2), interpolazioni di Berti, Cardoso e Will 2006 */
  function ringdown(Mf, a) { var w = 1.5251 - 1.1568 * Math.pow(1 - a, 0.1292), Q = 0.7 + 1.4187 * Math.pow(1 - a, -0.499), f = w * c * c * c / (2 * Math.PI * G * Mf); return { f: f, tau: Q / (Math.PI * f), Q: Q }; }
  /* il segnale completo: spirale newtoniana fino a f_picco = 0,55 f_ring, poi oscillazione smorzata (fenomenologica) */
  function segnale(m1s, m2s, dMpc, fmin, campion, opz) {
    opz = opz || {};
    var m1 = m1s * MSOLE, m2 = m2s * MSOLE, M = m1 + m2, Mc = massaChirp(m1, m2), d = dMpc * MPC;
    var rd = ringdown(0.95 * M, opz.spin == null ? 0.67 : opz.spin), fp = opz.fPicco || Math.min(0.55 * rd.f, 4 * fISCO(M));
    /* campionamento adattivo: «campion» punti per ciclo dell'onda (default 12), cosi' anche le stelle di neutroni, migliaia di cicli, restano leggere */
    var tau0 = tempoDaFrequenza(Mc, fmin), tauP = tempoDaFrequenza(Mc, fp), ppc = campion || 12;
    var tt = [], h = [], ff = [], inv = [], Phi0 = fase(Mc, tauP), hp = ampiezza(Mc, fp, d), tau = tau0;
    /* gli ultimi 120 cicli risolti punto per punto; prima solo l'inviluppo, a passi logaritmici */
    var tauF = tauP; while (Math.abs(fase(Mc, tauF) - Phi0) < 2 * Math.PI * 120 && tauF < tau0) tauF *= 1.05;
    while (tau >= tauP) {
      var f = frequenza(Mc, tau), A = ampiezza(Mc, f, d), fine = tau <= tauF;
      tt.push(-(tau - tauP)); ff.push(f); inv.push(A); h.push(fine ? A * Math.cos(fase(Mc, tau) - Phi0) : NaN);
      tau -= fine ? 1 / (ppc * f) : Math.max(1 / (ppc * f), (tau - tauP) / 300);
    }
    var dt = 1 / (2 * ppc * rd.f), nr = Math.ceil(6 * rd.tau / dt);
    for (var i = 1; i <= nr; i++) { var s = i * dt, mix = Math.exp(-s / (0.15 * rd.tau)), fr = fp * mix + rd.f * (1 - mix); tt.push(s); ff.push(fr); inv.push(hp * Math.exp(-s / rd.tau)); h.push(hp * Math.exp(-s / rd.tau) * Math.cos(2 * Math.PI * (fp * s * mix + rd.f * s * (1 - mix)))); }
    return { t: tt, h: h, f: ff, inviluppo: inv, Mc: Mc, fPicco: fp, hPicco: hp, ring: rd, durata: tau0 - tauP, M: M };
  }
  /* risposta del rivelatore (bracci lungo x e y), sorgente in direzione (θ, φ), angolo di polarizzazione ψ */
  function antenna(th, ph, psi) {
    var a = 0.5 * (1 + Math.cos(th) * Math.cos(th)) * Math.cos(2 * ph), b = Math.cos(th) * Math.sin(2 * ph);
    return { piu: a * Math.cos(2 * psi) - b * Math.sin(2 * psi), croce: a * Math.sin(2 * psi) + b * Math.cos(2 * psi) };
  }
  function antenna2(th, ph) { var a = 0.5 * (1 + Math.cos(th) * Math.cos(th)) * Math.cos(2 * ph), b = Math.cos(th) * Math.sin(2 * ph); return a * a + b * b; }
  /* Peters e Mathews 1963: Ṗ_b per un'orbita eccentrica */
  function fEcc(e) { return (1 + 73 / 24 * e * e + 37 / 96 * Math.pow(e, 4)) / Math.pow(1 - e * e, 3.5); }
  function pbDot(Pb, e, mp, mc) { return -192 * Math.PI * Math.pow(G, 5 / 3) / (5 * Math.pow(c, 5)) * Math.pow(Pb / (2 * Math.PI), -5 / 3) * fEcc(e) * mp * mc * Math.pow(mp + mc, -1 / 3); }
  var HT = { Pb: 0.322997448918 * GIORNO, e: 0.6171340, mp: 1.438 * MSOLE, mc: 1.390 * MSOLE, x: 2.341776, osservato: -2.423e-12 };
  /* spostamento cumulativo del periastro dopo un tempo T: ΔT = ½ (Ṗ_b/P_b) T² */
  function spostamento(T, Pb, Pd) { return 0.5 * Pd / Pb * T * T; }
  /* secondo metodo: somma orbita per orbita dei ritardi accumulati */
  function spostamentoSomma(n, Pb, Pd) { var P = Pb, tt = 0; for (var k = 0; k < n; k++) { tt += P; P += Pd * P; } return tt - n * Pb; } /* dopo n orbite */
  /* semiasse dalla terza legge di Keplero */
  function semiasse(Pb, M) { return Math.cbrt(G * M * Pb * Pb / (4 * Math.PI * Math.PI)); }
  /* equazione di Keplero */
  function keplero(Mm, e) { var E = e < 0.8 ? Mm : Math.PI; for (var i = 0; i < 50; i++) { var d = (E - e * Math.sin(E) - Mm) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-14) break; } return E; }
  /* avanzamento relativistico del periastro: ω̇ = 3 (Pb/2π)^(−5/3) (GM/c³)^(2/3) / (1 − e²) */
  function omegaPunto(Pb, e, M) { return 3 * Math.pow(Pb / (2 * Math.PI), -5 / 3) * Math.pow(G * M / (c * c * c), 2 / 3) / (1 - e * e); }

  F.calcolo.ondegrav = {
    G: G, c: c, MSOLE: MSOLE, MPC: MPC, ANNO: ANNO, HT: HT,
    massaChirp: massaChirp, tempoChirp: tempoChirp, frequenza: frequenza, tempoDaFrequenza: tempoDaFrequenza, fase: fase, ampiezza: ampiezza,
    fpunto: fpunto, chirpDaFFpunto: chirpDaFFpunto, separazione: separazione, tempoCoalescenza: tempoCoalescenza, tempoCoalescenzaNumerico: tempoCoalescenzaNumerico,
    dadt: dadt, potenza: potenza, energiaOrbitale: energiaOrbitale, fISCO: fISCO, ringdown: ringdown, segnale: segnale, antenna: antenna, antenna2: antenna2,
    fEcc: fEcc, pbDot: pbDot, spostamento: spostamento, spostamentoSomma: spostamentoSomma, semiasse: semiasse, keplero: keplero, omegaPunto: omegaPunto
  };

  /* ═══ pezzi comuni del disegno ══════════════════════════════════════════ */
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function eq(pan, testo) { var e = F.el('div', { 'class': 'bsiFX-eq', testo: testo }); pan.appendChild(e); return e; }
  function casella(pan, et, val, cambia) {
    var x = F.el('input', { type: 'checkbox' }); x.checked = !!val;
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [x, F.el('span', { testo: F.tt(et) })]));
    x.addEventListener('change', function () { cambia(x.checked); }); return x;
  }
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
        var S = new L3.Scena(destra, 0.62);
        destra.insertBefore(S.box, destra.firstChild);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function cieloStellato(T, n, R, seme) {
    var rnd = mulberry32(seme || 11), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var z = 2 * rnd() - 1, a = 2 * Math.PI * rnd(), s = Math.sqrt(1 - z * z), k = 0.35 + 0.65 * Math.pow(rnd(), 3);
      pos[3 * i] = R * s * Math.cos(a); pos[3 * i + 1] = R * s * Math.sin(a); pos[3 * i + 2] = R * z; col[3 * i] = k * 0.85; col[3 * i + 1] = k * 0.9; col[3 * i + 2] = k;
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Points(g, new T.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending }));
  }
  function bagliore(T, col, r) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 64; var q = cv.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 64, 64);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), color: col, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); sp.scale.set(r, r, 1); return sp;
  }
  function telo(destra, rapp) { var cv = F.tela(destra, rapp || 0.5); cv.style.marginTop = '10px'; return cv; }
  /* colore divergente per il segno di h */
  function divergente(v) { v = Math.max(-1, Math.min(1, v)); return v >= 0 ? [0.12 + 0.88 * v, 0.35 + 0.35 * v, 0.55 - 0.3 * v] : [0.12 - 0.05 * v, 0.35 - 0.25 * v, 0.55 - 0.45 * v]; }

  /* ═══ 1. La spirale in 3D ════════════════════════════════════════════════ */
  function schedaSpirale(pan, destra) {
    var st = { q: 0.8, pol: 'piu', vel: 1, guscio: true };
    eq(pan, 'da/dt = −(64/5) G³m₁m₂(m₁+m₂)/(c⁵a³)');
    nota(pan, t('Due masse in orbita hanno un momento di quadrupolo che ruota: la metrica lontana oscilla al <b>doppio</b> della frequenza orbitale e porta via la potenza P = (32/5)G⁴m₁²m₂²M/(c⁵a⁵). L’energia orbitale E = −Gm₁m₂/2a diminuisce, la separazione si riduce, la frequenza sale: la spirale accelera fino alla fusione, poi il buco nero finale «suona» come una campana smorzata. Nel telo si vedono il pozzo delle due masse e l’onda che esce a spirale (h ∝ 1/r, in ritardo di r/c); il guscio mostra in ogni direzione l’ampiezza della polarizzazione scelta.',
      'Two orbiting masses have a rotating quadrupole moment: the far metric oscillates at <b>twice</b> the orbital frequency and carries away power P = (32/5)G⁴m₁²m₂²M/(c⁵a⁵). The orbital energy E = −Gm₁m₂/2a decreases, the separation shrinks, the frequency rises: the spiral speeds up until the merger, then the final black hole “rings” like a damped bell. The sheet shows the well of the two masses and the wave leaving as a spiral (h ∝ 1/r, delayed by r/c); the shell shows the amplitude of the chosen polarisation in every direction.'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info = nota(pan);
    nota(pan, t('<b>Polarizzazioni.</b> Per un osservatore in direzione θ dall’asse dell’orbita h₊ ∝ (1 + cos²θ)/2 · cos 2Φ e h× ∝ cos θ · sin 2Φ: lungo l’asse le due hanno la stessa ampiezza (onda circolare), nel piano dell’orbita resta solo h₊ (onda lineare, metà ampiezza). Il tempo dell’animazione è enormemente accelerato e la scala delle deformazioni esagerata.',
      '<b>Polarisations.</b> For an observer at angle θ from the orbital axis h₊ ∝ (1 + cos²θ)/2 · cos 2Φ and h× ∝ cos θ · sin 2Φ: along the axis both have the same amplitude (circular wave), in the orbital plane only h₊ remains (linear wave, half amplitude). Animation time is enormously sped up and the deformations exaggerated.'));
    var cv = null;
    function testoFisico() {
      var m1 = 36 * MSOLE, m2 = 36 * st.q * MSOLE, M = m1 + m2, Mc = massaChirp(m1, m2), a = separazione(M, 30);
      info.innerHTML = t('Con m₁ = 36 M☉, m₂ = ', 'With m₁ = 36 M☉, m₂ = ') + (36 * st.q).toFixed(1) + ' M☉: ℳ = <b class="bsiFX-num">' + (Mc / MSOLE).toFixed(2) + ' M☉</b>' +
        '<br>' + t('a 30 Hz (onda): a = ', 'at 30 Hz (wave): a = ') + (a / 1e3).toFixed(0) + ' km, ' + t('mancano ', 'time left ') + '<b class="bsiFX-num">' + tempoCoalescenza(m1, m2, a).toFixed(3) + ' s</b>' +
        '<br>P = ' + potenza(m1, m2, a).toExponential(2) + ' W  (L☉ = 3,8·10²⁶ W)' + '<br>f_ISCO = ' + fISCO(M).toFixed(1) + ' Hz';
    }
    function grafico(storia) {
      if (!cv) return;
      F.grafico(cv, { serie: [{ x: storia.t, y: storia.h, col: '#5eead4', larg: 1.5 }], xl: ['t (s, animazione)', 't (s, animation)'], yl: ['h₊ (unità arbitrarie)', 'h₊ (arbitrary units)'], descr: ['Forma d’onda h₊ registrata da un osservatore lungo l’asse', 'Waveform h₊ recorded by an observer on the axis'] });
    }
    return {
      tre: function (S, T, L3) {
        S.aggiungi(cieloStellato(T, 2200, 60, 4));
        /* il telo: griglia polare */
        var NR = 70, NF = 128, RM = 7, nv = (NR + 1) * NF, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = [], rr = new Float32Array(nv), ff = new Float32Array(nv);
        for (var i = 0; i <= NR; i++) for (var j = 0; j < NF; j++) { var k = i * NF + j, r = 0.15 + (RM - 0.15) * Math.pow(i / NR, 1.25), a = 2 * Math.PI * j / NF; rr[k] = r; ff[k] = a; pos[3 * k] = r * Math.cos(a); pos[3 * k + 1] = r * Math.sin(a); }
        for (i = 0; i < NR; i++) for (j = 0; j < NF; j++) { var A = i * NF + j, B = i * NF + (j + 1) % NF, C2 = (i + 1) * NF + j, D2 = (i + 1) * NF + (j + 1) % NF; idx.push(A, C2, D2, A, D2, B); }
        var gT = new T.BufferGeometry(); gT.setAttribute('position', new T.BufferAttribute(pos, 3)); gT.setAttribute('color', new T.BufferAttribute(col, 3)); gT.setIndex(idx);
        var telo3 = new T.Mesh(gT, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, transparent: true, opacity: 0.85 })); S.aggiungi(telo3);
        var rete = new T.Mesh(gT, new T.MeshBasicMaterial({ color: 0x5eead4, wireframe: true, transparent: true, opacity: 0.1, depthWrite: false })); S.aggiungi(rete);
        /* le due masse */
        var corpi = [0, 1].map(function (q) { var g = new T.Group(); g.add(new T.Mesh(new T.SphereGeometry(1, 32, 20), new T.MeshBasicMaterial({ color: 0x000000 }))); g.add(bagliore(T, q ? 0x9fd8ff : 0xffc27a, 1.5)); S.aggiungi(g); return g; });
        /* il guscio del fronte d'onda */
        var gs = new T.SphereGeometry(1, 72, 48), base = gs.attributes.position.array.slice(), nG = base.length / 3, colG = new Float32Array(nG * 3);
        gs.setAttribute('color', new T.BufferAttribute(colG, 3));
        var guscio = new T.Mesh(gs, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })); S.aggiungi(guscio);
        var guscioRete = new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(1, 24, 16)), new T.LineBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.06 })); S.aggiungi(guscioRete);
        /* la simulazione (unita' visive, tempo accelerato) */
        var sim = { tempo: 0, a: 5, fase: 0, fuso: false, tFuso: 0 }, A0 = 5, AF = 0.9, K = Math.pow(A0, 4) / (4 * 24), V = 4, W = 12, NH = 4096;
        var storia = { t: new Float64Array(NH), fi: new Float64Array(NH), am: new Float64Array(NH), n: 0 }, oss = { t: [], h: [] };
        function m1v() { return 1 / (1 + st.q); } function m2v() { return st.q / (1 + st.q); }
        function registra() { var k = storia.n % NH; storia.t[k] = sim.tempo; storia.fi[k] = sim.fase; storia.am[k] = sim.fuso ? Math.exp(-(sim.tempo - sim.tFuso) / 0.5) * ampFusione : Math.pow(W * Math.pow(sim.a, -1.5), 2 / 3) * 0.25; storia.n++; }
        var ampFusione = Math.pow(W * Math.pow(AF, -1.5), 2 / 3) * 0.25;
        /* fase e ampiezza al tempo ritardato (ricerca binaria nella storia) */
        function ritardata(tr) {
          var n = Math.min(storia.n, NH), primo = storia.n - n;
          if (n === 0 || tr < storia.t[primo % NH]) return null;
          var lo = primo, hi = storia.n - 1;
          if (tr >= storia.t[hi % NH]) return [storia.fi[hi % NH], storia.am[hi % NH]];
          while (hi - lo > 1) { var m = (lo + hi) >> 1; if (storia.t[m % NH] <= tr) lo = m; else hi = m; }
          var a = lo % NH, b = hi % NH, u = (tr - storia.t[a]) / Math.max(1e-9, storia.t[b] - storia.t[a]);
          return [storia.fi[a] + (storia.fi[b] - storia.fi[a]) * u, storia.am[a] + (storia.am[b] - storia.am[a]) * u];
        }
        function riparti() { sim.tempo = 0; sim.a = A0; sim.fase = 0; sim.fuso = false; storia.n = 0; oss.t = []; oss.h = []; corpi[1].visible = true; }
        function passo(dt) {
          sim.tempo += dt;
          if (!sim.fuso) {
            var a4 = Math.pow(sim.a, 4) - 4 * K * dt * (st.q / Math.pow(1 + st.q, 2)) * 4;
            if (a4 <= Math.pow(AF, 4)) { sim.fuso = true; sim.tFuso = sim.tempo; sim.a = AF; }
            else sim.a = Math.pow(a4, 0.25);
            sim.fase += W * Math.pow(sim.a, -1.5) * dt;
          } else sim.fase += W * Math.pow(AF, -1.5) * 1.3 * dt;
          registra();
          if (sim.fuso && sim.tempo - sim.tFuso > 5) riparti();
        }
        function aggiorna() {
          var m1 = m1v(), m2 = m2v(), x1, y1, x2, y2;
          if (!sim.fuso) { x1 = -m2 * sim.a * Math.cos(sim.fase); y1 = -m2 * sim.a * Math.sin(sim.fase); x2 = m1 * sim.a * Math.cos(sim.fase); y2 = m1 * sim.a * Math.sin(sim.fase); }
          else { x1 = y1 = x2 = y2 = 0; }
          var s1 = 0.28 * Math.cbrt(m1 * 2), s2 = 0.28 * Math.cbrt(m2 * 2);
          if (sim.fuso) { s1 = 0.28 * Math.cbrt(1.9); corpi[1].visible = false; }
          corpi[0].position.set(x1, y1, 0); corpi[0].children[0].scale.setScalar(s1); corpi[1].position.set(x2, y2, 0); corpi[1].children[0].scale.setScalar(s2);
          var P = gT.attributes.position.array, Cc = gT.attributes.color.array;
          for (var k = 0; k < nv; k++) {
            var px = P[3 * k], py = P[3 * k + 1], r = rr[k], d1 = (px - x1) * (px - x1) + (py - y1) * (py - y1), d2 = (px - x2) * (px - x2) + (py - y2) * (py - y2);
            var pozzo = sim.fuso ? -1.1 / Math.sqrt(px * px + py * py + 0.25) : -0.55 * (m1 * 2) / Math.sqrt(d1 + 0.25) - 0.55 * (m2 * 2) / Math.sqrt(d2 + 0.25);
            var R = ritardata(sim.tempo - r / V), onda = 0;
            if (R && r > 0.8) onda = R[1] * 0.5 * Math.cos(2 * (ff[k] - R[0])) * 2.2 / (1 + 0.45 * r) * Math.min(1, (r - 0.8) * 2);
            P[3 * k + 2] = pozzo * 0.9 + onda;
            var cc = divergente(onda * 3); Cc[3 * k] = cc[0] * 0.75; Cc[3 * k + 1] = cc[1] * 0.75 + 0.05; Cc[3 * k + 2] = cc[2] * 0.85 + 0.08 + Math.min(0.3, -pozzo * 0.12);
          }
          gT.attributes.position.needsUpdate = true; gT.attributes.color.needsUpdate = true;
          /* guscio: raggio modulato dalla polarizzazione scelta, al tempo ritardato del suo raggio */
          guscio.visible = guscioRete.visible = st.guscio;
          if (st.guscio) {
            var RG = 3.0, Rr = ritardata(sim.tempo - RG / V), Pg = gs.attributes.position.array;
            for (k = 0; k < nG; k++) {
              var bx = base[3 * k], by = base[3 * k + 1], bz = base[3 * k + 2], th = Math.acos(Math.max(-1, Math.min(1, bz))), ph = Math.atan2(by, bx), h = 0;
              /* il raggio segue l'inviluppo (la figura di radiazione), il colore il valore istantaneo */
              var inv = 0;
              if (Rr) { var Ap = 0.5 * (1 + bz * bz), Ax = Math.abs(bz), hp = Ap * Math.cos(2 * (ph - Rr[0])), hx = bz * Math.sin(2 * (ph - Rr[0])); inv = st.pol === 'piu' ? Ap : st.pol === 'croce' ? Ax : Math.sqrt(Ap * Ap + Ax * Ax); h = Rr[1] * (st.pol === 'piu' ? hp : st.pol === 'croce' ? hx : Math.sqrt(hp * hp + hx * hx)); inv *= Rr[1]; }
              var rad = RG * (0.35 + 2.2 * inv); Pg[3 * k] = bx * rad; Pg[3 * k + 1] = by * rad; Pg[3 * k + 2] = bz * rad;
              var cg = divergente(h * 2.5); colG[3 * k] = cg[0]; colG[3 * k + 1] = cg[1]; colG[3 * k + 2] = cg[2];
            }
            gs.attributes.position.needsUpdate = true; gs.attributes.color.needsUpdate = true; guscioRete.scale.setScalar(RG);
          }
          /* osservatore sull'asse a distanza 6: h₊ ritardato */
          var Ro = ritardata(sim.tempo - 6 / V);
          oss.t.push(sim.tempo); oss.h.push(Ro ? Ro[1] * Math.cos(2 * Ro[0]) : 0);
          if (oss.t.length > 900) { oss.t.shift(); oss.h.shift(); }
        }
        var cont = 0;
        /* qualche secondo di storia gia' pronto, cosi' l'onda e' gia' in viaggio */
        for (var s0 = 0; s0 < 400; s0++) passo(0.02);
        S.ogniFotogramma(function (dt) { for (var s = 0; s < 4; s++) passo(st.vel * dt / 4); aggiorna(); if (++cont % 5 === 0) grafico(oss); return true; });
        F.scelta(ctl, ['Guscio: polarizzazione', 'Shell: polarisation'], [['piu', 'h₊'], ['croce', 'h×'], ['tot', '√(h₊² + h×²)']], st.pol, function (v) { st.pol = v; });
        casella(ctl, ['Mostra il fronte d’onda (guscio)', 'Show the wavefront (shell)'], st.guscio, function (v) { st.guscio = v; S.sporca = true; });
        F.cursore(ctl, ['Rapporto delle masse q = m₂/m₁', 'Mass ratio q = m₂/m₁'], 0.2, 1, 0.05, st.q, function (v) { st.q = v; testoFisico(); riparti(); });
        F.cursore(ctl, ['Velocità', 'Speed'], 0.25, 3, 0.25, st.vel, function (v) { st.vel = v; });
        F.bottone(ctl, ['↺ Ricomincia la spirale', '↺ Restart the inspiral'], function () { riparti(); });
        testoFisico();
        S.didascalia.textContent = t('Due buchi neri in spirale: il telo dello spaziotempo e l’onda gravitazionale che si allontana', 'Two black holes spiralling in: the spacetime sheet and the outgoing gravitational wave');
        S.inquadra(15, -1.0, 1.05);
        aggiorna();
        cv = telo(destra, 0.32);
        grafico(oss); F.alRidimensiona(function () { grafico(oss); });
      }
    };
  }

  /* ═══ 2. Il chirp ════════════════════════════════════════════════════════ */
  var EVENTI = {
    gw150914: { nome: 'GW150914', m1: 36, m2: 29, d: 410, fmin: 30 },
    gw170817: { nome: 'GW170817', m1: 1.46, m2: 1.27, d: 40, fmin: 30 },
    gw190521: { nome: 'GW190521', m1: 85, m2: 66, d: 5300, fmin: 20 }
  };
  function schedaChirp(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' });
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var st = { m1: 36, m2: 29, d: 410, fmin: 30, ev: 'gw150914' };
    eq(pan, 'f(τ) = (1/π)(5/256τ)^(3/8)(Gℳ/c³)^(−5/8)   ℳ = (m₁m₂)^(3/5)/(m₁+m₂)^(1/5)');
    nota(pan, t('Nell’approssimazione del quadrupolo newtoniano tutta la spirale dipende da una sola combinazione delle masse, la <b>massa di chirp</b> ℳ: la frequenza cresce come (t_c − t)^(−3/8) e l’ampiezza come f^(2/3)/d. Misurando f e la sua derivata ḟ = (96/5)π^(8/3)(Gℳ/c³)^(5/3) f^(11/3) si ricava ℳ; dall’ampiezza la distanza: le coppie di oggetti compatti sono «sirene standard». Il segnale vero si discosta vicino alla fusione; qui dopo il picco segue un’oscillazione smorzata con la frequenza e il tempo di smorzamento del buco nero finale (modo quasi-normale l = m = 2).',
      'In the Newtonian quadrupole approximation the whole inspiral depends on a single combination of the masses, the <b>chirp mass</b> ℳ: the frequency grows as (t_c − t)^(−3/8) and the amplitude as f^(2/3)/d. Measuring f and its derivative ḟ = (96/5)π^(8/3)(Gℳ/c³)^(5/3) f^(11/3) gives ℳ; the amplitude then gives the distance: compact binaries are “standard sirens”. The true signal departs from this near merger; here the peak is followed by a damped oscillation with the frequency and damping time of the final black hole (quasi-normal mode l = m = 2).'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info = nota(pan);
    var c1 = F.tela(dx, 0.36), c2 = F.tela(dx, 0.36), c3 = F.tela(dx, 0.36); c2.style.marginTop = c3.style.marginTop = '10px';
    var sig = null, audio = null;
    function calcola() {
      sig = segnale(st.m1, st.m2, st.d, st.fmin, 24);
      var Mc = sig.Mc;
      info.innerHTML = 'ℳ = <b class="bsiFX-num">' + (Mc / MSOLE).toFixed(2) + ' M☉</b> · M = ' + (st.m1 + st.m2).toFixed(1) + ' M☉' +
        '<br>' + t('da ', 'from ') + st.fmin + ' Hz ' + t('al picco: ', 'to the peak: ') + '<b class="bsiFX-num">' + (sig.durata < 1 ? (sig.durata * 1000).toFixed(0) + ' ms' : sig.durata.toFixed(1) + ' s') + '</b>, ' + Math.round(sig.durata * 0.5 * (st.fmin + sig.fPicco) / 2) + t(' cicli circa', ' cycles roughly') +
        '<br>f_ISCO = ' + fISCO(sig.M).toFixed(0) + ' Hz · f_' + t('picco', 'peak') + ' ≈ <b class="bsiFX-num">' + sig.fPicco.toFixed(0) + ' Hz</b>' +
        '<br>' + t('buco nero finale: f_ring = ', 'final black hole: f_ring = ') + sig.ring.f.toFixed(0) + ' Hz, τ = ' + (sig.ring.tau * 1000).toFixed(1) + ' ms' +
        '<br>h_' + t('picco', 'peak') + ' (' + t('di faccia', 'face-on') + ') ≈ <b class="bsiFX-num">' + sig.hPicco.toExponential(2) + '</b> → ΔL = h·L/2 = ' + (sig.hPicco * 4000 / 2).toExponential(1) + ' m ' + t('su un braccio di 4 km', 'on a 4 km arm');
      disegna();
    }
    function disegna() {
      if (!sig) return;
      /* forma d'onda: gli ultimi cicli (fino a 0,3 s per le masse grandi) */
      var Tw = Math.min(sig.durata, Math.max(0.12, 60 / sig.fPicco)), xs = [], ys = [], fx = [], fy = [];
      for (var i = 0; i < sig.t.length; i++) { if (sig.t[i] >= -Tw) { xs.push(sig.t[i] * 1000); ys.push(sig.h[i] * 1e21); } }
      F.grafico(c1, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 1.4 }], xl: ['t − t_picco (ms)', 't − t_peak (ms)'], yl: ['h × 10²¹', 'h × 10²¹'], descr: ['Forma d’onda h(t) attorno alla fusione', 'Waveform h(t) around the merger'] });
      var passo = Math.max(1, Math.floor(sig.t.length / 1500));
      for (i = 0; i < sig.t.length; i += passo) { fx.push(sig.t[i]); fy.push(sig.f[i]); }
      F.grafico(c2, { serie: [{ x: fx, y: fy, col: '#ffd24a', larg: 2 }], linee: [{ y: fISCO(sig.M), col: '#ff8a80', etich: 'f_ISCO' }], xl: ['t − t_picco (s)', 't − t_peak (s)'], yl: ['f (Hz)', 'f (Hz)'], descr: ['Frequenza dell’onda in funzione del tempo: f ∝ (t_c − t)^(−3/8)', 'Wave frequency versus time: f ∝ (t_c − t)^(−3/8)'] });
      /* spettrogramma teorico: energia attorno alla traccia f(t), asse delle frequenze logaritmico */
      var P = F.pennello(c3), q = P.q, W = P.W, H = P.H, m = { s: 54, d: 14, a: 14, b: 40 }, w = W - m.s - m.d, h = H - m.a - m.b;
      var t0 = sig.t[0], t1 = sig.t[sig.t.length - 1], lf0 = Math.log(15), lf1 = Math.log(Math.max(600, sig.ring.f * 1.5));
      var img = q.createImageData(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))), D = img.data, iw = img.width, ih = img.height, amax = 0;
      for (i = 0; i < sig.t.length; i++) amax = Math.max(amax, sig.inviluppo[i]);
      for (var x = 0; x < iw; x++) {
        var tt = t0 + (t1 - t0) * x / (iw - 1), lo = 0, hi = sig.t.length - 1;
        while (hi - lo > 1) { var mm = (lo + hi) >> 1; if (sig.t[mm] < tt) lo = mm; else hi = mm; }
        var kk = hi, f0 = sig.f[kk], A = sig.inviluppo[kk] / amax;
        for (var y = 0; y < ih; y++) {
          var lf = lf1 - (lf1 - lf0) * y / (ih - 1), dd = (lf - Math.log(f0)) / 0.09, v = Math.sqrt(A) * Math.exp(-dd * dd / 2), o = 4 * (y * iw + x);
          D[o] = Math.round(255 * Math.min(1, 1.6 * v * v + 0.03)); D[o + 1] = Math.round(255 * Math.min(1, 0.15 + 0.9 * v) * (0.3 + 0.7 * v)); D[o + 2] = Math.round(255 * Math.min(1, 0.25 + 0.5 * v)); D[o + 3] = 255;
        }
      }
      q.putImageData(img, m.s * (c3.width / W), m.a * (c3.width / W));
      q.strokeStyle = '#34465f'; q.strokeRect(m.s, m.a, w, h);
      q.fillStyle = '#8494a8'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'right';
      [20, 50, 100, 200, 500, 1000].forEach(function (f) { var lf = Math.log(f); if (lf < lf0 || lf > lf1) return; var yy = m.a + (lf1 - lf) / (lf1 - lf0) * h; q.fillText(String(f), m.s - 5, yy + 4); q.fillRect(m.s - 3, yy, 3, 1); });
      q.textAlign = 'center'; q.fillText(t('t − t_picco: ', 't − t_peak: ') + fmt(t0) + ' … ' + fmt(t1) + ' s', m.s + w / 2, H - 22); q.fillStyle = '#aebccd'; q.fillText(t('spettrogramma teorico (Hz, scala log)', 'theoretical spectrogram (Hz, log scale)'), m.s + w / 2, H - 8);
      c3.setAttribute('aria-label', t('Spettrogramma teorico del segnale: la traccia sale in frequenza fino alla fusione', 'Theoretical spectrogram of the signal: the track rises in frequency up to the merger'));
    }
    F.scelta(ctl, ['Evento', 'Event'], [['gw150914', 'GW150914 (36 + 29 M☉, 410 Mpc)'], ['gw170817', t('GW170817 (stelle di neutroni)', 'GW170817 (neutron stars)')], ['gw190521', 'GW190521 (85 + 66 M☉)']], st.ev, function (v) {
      var e = EVENTI[v]; st.m1 = e.m1; st.m2 = e.m2; st.d = e.d; st.fmin = e.fmin;
      [[s1, e.m1], [s2, e.m2], [s3, e.d]].forEach(function (p) { p[0].value = p[1]; p[0].dispatchEvent(new Event('input')); });
      calcola();
    });
    var pend = null; function presto() { clearTimeout(pend); pend = setTimeout(calcola, 60); }
    var s1 = F.cursore(ctl, ['m₁ (M☉)', 'm₁ (M☉)'], 1, 100, 0.01, st.m1, function (v) { st.m1 = v; presto(); }, function (v) { return v.toFixed(2); });
    var s2 = F.cursore(ctl, ['m₂ (M☉)', 'm₂ (M☉)'], 1, 100, 0.01, st.m2, function (v) { st.m2 = v; presto(); }, function (v) { return v.toFixed(2); });
    var s3 = F.cursore(ctl, ['distanza (Mpc)', 'distance (Mpc)'], 10, 6000, 10, st.d, function (v) { st.d = v; presto(); });
    var bA = F.bottone(ctl, ['🔊 Ascolta il chirp', '🔊 Listen to the chirp'], function () { suona(); });
    nota(ctl, t('Il suono è il segnale con la frequenza moltiplicata per 4 e il tempo dilatato perché la salita duri circa 2 s; il volume segue l’ampiezza.', 'The sound is the signal with frequency multiplied by 4 and time stretched so that the rise lasts about 2 s; the volume follows the amplitude.'));
    function suona() {
      var AC = globale.AudioContext || globale.webkitAudioContext; if (!AC || !sig) return;
      try {
        if (!audio) audio = new AC();
        var sr = audio.sampleRate, D = 2.6, Mc = sig.Mc, tau0 = tempoDaFrequenza(Mc, Math.max(st.fmin, 20)), tauP = tempoDaFrequenza(Mc, sig.fPicco), dil = 2 / (tau0 - tauP), K = 4;
        var n = Math.round(sr * D), buf = audio.createBuffer(1, n, sr), x = buf.getChannelData(0), ph = 0, aP = Math.pow(sig.fPicco, 2 / 3), rd = sig.ring;
        for (var i = 0; i < n; i++) {
          var ta = i / sr, f, A;
          if (ta < 2) { var tau = tau0 - ta / dil; f = frequenza(Mc, tau); A = Math.pow(f, 2 / 3) / aP; }
          else { var s = (ta - 2) / dil; f = rd.f; A = Math.exp(-s / rd.tau); }
          ph += 2 * Math.PI * K * f / sr; x[i] = 0.5 * A * Math.sin(ph) * Math.min(1, i / 400) * Math.min(1, (n - i) / 400);
        }
        var src = audio.createBufferSource(); src.buffer = buf; src.connect(audio.destination); src.start();
      } catch (e) { bA.textContent = t('audio non disponibile', 'audio not available'); }
    }
    /* il calcolo del segnale in un compito separato: aprire la scheda non aspetta */
    setTimeout(calcola, 0);
    F.alRidimensiona(disegna);
  }

  /* ═══ 3. Il rivelatore ═══════════════════════════════════════════════════ */
  function schedaRivelatore(pan, destra) {
    var st = { pol: 'piu', amp: 0.18, freq: 0.6, vista: 'tutto', th: 0, ph: 0 };
    eq(pan, 'δL/L = h/2 · (F₊h₊ + F×h×)/h    F₊² + F×² = ¼(1+cos²θ)²cos²2φ + cos²θ sin²2φ');
    nota(pan, t('Un’onda + che arriva dall’alto allunga un braccio e accorcia l’altro, poi viceversa: la differenza dei cammini cambia l’interferenza al fotorivelatore. Con h ~ 10⁻²¹ e bracci di 4 km la variazione è 4·10⁻¹⁸ m, un millesimo del raggio del protone; LIGO la vede perché la luce rimbalza ~300 volte nelle cavità Fabry-Pérot e la potenza circolante è di centinaia di kW. Un’onda × fa la stessa cosa sulle diagonali: per il rivelatore a L la sua risposta è nulla quando arriva dall’alto. Il rivelatore è quasi omnidirezionale: è cieco solo in quattro direzioni nel suo piano, a 45° dai bracci.',
      'A + wave arriving from above stretches one arm and squeezes the other, then vice versa: the path difference changes the interference at the photodetector. With h ~ 10⁻²¹ and 4 km arms the change is 4·10⁻¹⁸ m, a thousandth of a proton radius; LIGO sees it because light bounces ~300 times in the Fabry–Pérot cavities and the circulating power is hundreds of kW. A × wave does the same on the diagonals: an L-shaped detector does not respond to it from overhead. The detector is almost omnidirectional: it is blind only in four directions in its plane, at 45° from the arms.'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info = nota(pan);
    var cv = null, segn = { t: [], y: [] };
    function testo() {
      var r = antenna(st.th * Math.PI / 180, st.ph * Math.PI / 180, 0), a2 = antenna2(st.th * Math.PI / 180, st.ph * Math.PI / 180);
      info.innerHTML = t('Sorgente a θ = ', 'Source at θ = ') + st.th + '°, φ = ' + st.ph + '° (ψ = 0): F₊ = <b class="bsiFX-num">' + r.piu.toFixed(3) + '</b>, F× = <b class="bsiFX-num">' + r.croce.toFixed(3) + '</b>, F₊² + F×² = <b class="bsiFX-num">' + a2.toFixed(3) + '</b>' +
        '<br>' + t('media su tutto il cielo: ⟨F₊² + F×²⟩ = 2/5', 'all-sky average: ⟨F₊² + F×²⟩ = 2/5');
    }
    return {
      tre: function (S, T, L3) {
        S.aggiungi(cieloStellato(T, 1500, 60, 8));
        var gRiv = new T.Group(), gAnt = new T.Group(); S.aggiungi(gRiv); S.aggiungi(gAnt);
        var Lb = 3.2, metallo = new T.MeshStandardMaterial({ color: 0x9fb1c6, metalness: 0.6, roughness: 0.35 });
        /* il laser, il divisore, i due tubi, gli specchi terminali, il fotorivelatore */
        var laser = new T.Mesh(new T.BoxGeometry(0.5, 0.25, 0.25), new T.MeshStandardMaterial({ color: 0xc0392b, emissive: 0x401010 })); laser.position.set(-1.0, 0, 0); gRiv.add(laser);
        var bs = new T.Mesh(new T.BoxGeometry(0.28, 0.03, 0.28), new T.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6, metalness: 0.2 })); bs.rotation.z = -Math.PI / 4; gRiv.add(bs);
        var foto = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.12, 24), new T.MeshStandardMaterial({ color: 0x222222, emissive: 0x000000 })); foto.position.set(0, -0.8, 0); gRiv.add(foto);
        var tubi = [], specchi = [], raggi = [];
        [0, 1].forEach(function (k) {
          var tubo = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1, 20, 1, true), new T.MeshStandardMaterial({ color: 0x3a4a5e, metalness: 0.5, roughness: 0.5, transparent: true, opacity: 0.45, side: T.DoubleSide }));
          if (k === 0) tubo.rotation.z = Math.PI / 2; gRiv.add(tubo); tubi.push(tubo);
          var sp = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.08, 28), metallo); if (k === 0) sp.rotation.z = Math.PI / 2; gRiv.add(sp); specchi.push(sp);
          var bg = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]);
          var rg = new T.Line(bg, new T.LineBasicMaterial({ color: 0xff5050, transparent: true, opacity: 0.95, blending: T.AdditiveBlending })); gRiv.add(rg); raggi.push(rg);
        });
        var rIn = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-0.75, 0, 0), new T.Vector3(0, 0, 0)]), new T.LineBasicMaterial({ color: 0xff5050 })); gRiv.add(rIn);
        var rOut = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(0, -0.74, 0)]), new T.LineBasicMaterial({ color: 0xff5050, transparent: true, opacity: 0.5 })); gRiv.add(rOut);
        var lampo = new T.Mesh(new T.SphereGeometry(0.16, 16, 12), new T.MeshBasicMaterial({ color: 0xff7070, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false })); lampo.position.copy(foto.position); gRiv.add(lampo);
        /* l'anello di masse di prova, sopra il divisore */
        var NA = 48, anello = new T.InstancedMesh(new T.SphereGeometry(0.05, 10, 8), new T.MeshStandardMaterial({ color: 0xffd24a, emissive: 0x443300 }), NA), mtx = new T.Matrix4(); gRiv.add(anello);
        var et1 = L3.testo3d(T, 'x', '#ff6b6b', 0.25), et2 = L3.testo3d(T, 'y', '#5eead4', 0.25); gRiv.add(et1); gRiv.add(et2);
        var piatto = new T.Mesh(new T.PlaneGeometry(Lb * 1.6, Lb * 1.6), new T.MeshStandardMaterial({ color: 0x14243a, roughness: 0.95 })); piatto.position.set(Lb * 0.45, Lb * 0.45, -0.25); gRiv.add(piatto);
        /* superficie della risposta direzionale r(θ, φ) = F₊² + F×² */
        var NT = 60, NP = 96, posA = [], colA = [], idA = [];
        for (var i = 0; i <= NT; i++) for (var j = 0; j <= NP; j++) {
          var th = Math.PI * i / NT, ph = 2 * Math.PI * j / NP, r = antenna2(th, ph) * 1.6;
          posA.push(r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th));
          var v = antenna2(th, ph); colA.push(0.2 + 0.8 * v, 0.3 + 0.6 * v * v, 0.85 - 0.5 * v);
        }
        for (i = 0; i < NT; i++) for (j = 0; j < NP; j++) { var A = i * (NP + 1) + j, B = A + NP + 1; idA.push(A, B, B + 1, A, B + 1, A + 1); }
        var gA = new T.BufferGeometry(); gA.setAttribute('position', new T.Float32BufferAttribute(posA, 3)); gA.setAttribute('color', new T.Float32BufferAttribute(colA, 3)); gA.setIndex(idA); gA.computeVertexNormals();
        gAnt.add(new T.Mesh(gA, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: T.DoubleSide })));
        gAnt.add(new T.LineSegments(new T.WireframeGeometry(gA), new T.LineBasicMaterial({ color: 0x081522, transparent: true, opacity: 0.25 })));
        gAnt.add(L3.assi(T, 2.1, ['x', 'y', 'z'], 0.22));
        var freccia = new T.ArrowHelper(new T.Vector3(0, 0, -1), new T.Vector3(0, 0, 2.6), 0.9, 0xffd24a, 0.25, 0.14); gAnt.add(freccia);
        function disponi() {
          gRiv.visible = st.vista !== 'antenna'; gAnt.visible = st.vista !== 'rivelatore';
          if (st.vista === 'tutto') { gRiv.position.set(-3.6, -1.6, 0); gAnt.position.set(3.2, 0, 0.3); S.inquadra(13, -1.35, 0.95); }
          else if (st.vista === 'rivelatore') { gRiv.position.set(-1.5, -1.5, 0); S.inquadra(8.5, -1.3, 0.85); }
          else { gAnt.position.set(0, 0, 0); S.inquadra(6.5, -1.0, 1.05); }
          var th = st.th * Math.PI / 180, ph = st.ph * Math.PI / 180, d = new T.Vector3(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th));
          freccia.position.copy(d.clone().multiplyScalar(2.9)); freccia.setDirection(d.clone().multiplyScalar(-1));
          S.sporca = true; S.avvia();
        }
        var tempo = 0;
        function fotogramma(dt) {
          tempo += dt;
          /* h esagerato: la sorgente in direzione (θ, φ) proietta h₊ o h× sul rivelatore con F₊, F× */
          var th = st.th * Math.PI / 180, ph = st.ph * Math.PI / 180, F2 = antenna(th, ph, 0), h0 = st.amp * Math.sin(2 * Math.PI * st.freq * tempo);
          var risp = st.pol === 'piu' ? F2.piu * h0 : F2.croce * h0;
          var Lx = Lb * (1 + risp / 2), Ly = Lb * (1 - risp / 2);
          tubi[0].scale.y = Lx; tubi[0].position.set(Lx / 2, 0, 0); tubi[1].scale.y = Ly; tubi[1].position.set(0, Ly / 2, 0);
          specchi[0].position.set(Lx, 0, 0); specchi[1].position.set(0, Ly, 0);
          raggi[0].geometry.attributes.position.setXYZ(1, Lx, 0, 0); raggi[0].geometry.attributes.position.needsUpdate = true;
          raggi[1].geometry.attributes.position.setXYZ(1, 0, Ly, 0); raggi[1].geometry.attributes.position.needsUpdate = true;
          et1.position.set(Lx + 0.4, 0, 0.3); et2.position.set(0, Ly + 0.4, 0.3);
          /* frangia scura a riposo: l'intensita' in uscita cresce con la differenza di cammino (esagerata) */
          var I = Math.pow(Math.sin(2 * Math.PI * (Lx - Ly) * 1.2), 2);
          lampo.material.opacity = 0.05 + 0.9 * I; lampo.scale.setScalar(0.6 + 1.6 * I); rOut.material.opacity = 0.1 + 0.9 * I;
          /* anello di masse di prova: δx = ½(h₊ x + h× y), δy = ½(h× x − h₊ y) per un'onda lungo z */
          var hp = st.pol === 'piu' ? h0 * 2 : 0, hx = st.pol === 'croce' ? h0 * 2 : 0;
          for (var k = 0; k < NA; k++) { var a = 2 * Math.PI * k / NA, x = 0.75 * Math.cos(a), y = 0.75 * Math.sin(a); mtx.makeTranslation(1.6 + x + 0.5 * (hp * x + hx * y), 1.6 + y + 0.5 * (hx * x - hp * y), 0.6); anello.setMatrixAt(k, mtx); }
          anello.instanceMatrix.needsUpdate = true;
          segn.t.push(tempo); segn.y.push(risp); if (segn.t.length > 400) { segn.t.shift(); segn.y.shift(); }
          return true;
        }
        var cont = 0;
        S.ogniFotogramma(function (dt) { fotogramma(dt); if (++cont % 6 === 0) grafico(); return true; });
        F.scelta(ctl, ['Vista', 'View'], [['tutto', t('rivelatore e risposta direzionale', 'detector and antenna pattern')], ['rivelatore', t('solo l’interferometro', 'interferometer only')], ['antenna', t('solo la risposta direzionale', 'antenna pattern only')]], st.vista, function (v) { st.vista = v; disponi(); });
        F.scelta(ctl, ['Polarizzazione dell’onda', 'Wave polarisation'], [['piu', '+'], ['croce', '×']], st.pol, function (v) { st.pol = v; });
        F.cursore(ctl, ['θ della sorgente (°)', 'Source θ (°)'], 0, 180, 1, st.th, function (v) { st.th = v; testo(); disponi(); });
        F.cursore(ctl, ['φ della sorgente (°)', 'Source φ (°)'], 0, 360, 1, st.ph, function (v) { st.ph = v; testo(); disponi(); });
        F.cursore(ctl, ['Ampiezza (esagerata ×10²⁰)', 'Amplitude (exaggerated ×10²⁰)'], 0.02, 0.4, 0.02, st.amp, function (v) { st.amp = v; });
        F.cursore(ctl, ['Frequenza (rallentata, Hz)', 'Frequency (slowed down, Hz)'], 0.1, 2, 0.1, st.freq, function (v) { st.freq = v; });
        testo();
        S.didascalia.textContent = t('Interferometro di Michelson a L con i bracci deformati dall’onda, e la superficie F₊² + F×²', 'L-shaped Michelson interferometer with arms deformed by the wave, and the F₊² + F×² surface');
        disponi(); fotogramma(0.2);
        cv = telo(destra, 0.3);
        function grafico() { F.grafico(cv, { serie: [{ x: segn.t, y: segn.y.map(function (v) { return v * 1e-20 / 1e-21; }), col: '#ff8a80', larg: 2 }], ymin: -0.45 * 10, ymax: 0.45 * 10, xl: ['t (s)', 't (s)'], yl: ['δL/L (× 10⁻²¹)', 'δL/L (× 10⁻²¹)'], descr: ['Segnale del rivelatore: allungamento relativo dei bracci', 'Detector signal: relative arm stretch'] }); }
        grafico();
      }
    };
  }

  /* ═══ 4. La pulsar di Hulse e Taylor ═════════════════════════════════════ */
  function schedaPulsar(pan, destra) {
    var Pd = pbDot(HT.Pb, HT.e, HT.mp, HT.mc), M = HT.mp + HT.mc, a = semiasse(HT.Pb, M), wd = omegaPunto(HT.Pb, HT.e, M) * ANNO * 180 / Math.PI;
    var st = { anni: 40 };
    eq(pan, 'Ṗ_b = −(192πG^(5/3)/5c⁵)(P_b/2π)^(−5/3) f(e) m_p m_c (m_p+m_c)^(−1/3)');
    nota(pan, t('PSR B1913+16 è una pulsar (un orologio che batte 17 volte al secondo) in orbita stretta ed eccentrica attorno a un’altra stella di neutroni: P_b = 7,75 h, e = 0,617. Dai tempi di arrivo degli impulsi si misurano l’avanzamento del periastro e il ritardo gravitazionale, che danno le due masse (1,438 e 1,390 M☉). Allora la relatività generale <b>predice senza parametri liberi</b> quanto deve accorciarsi l’orbita per l’emissione di onde gravitazionali, con il fattore di eccentricità f(e) = (1 + 73e²/24 + 37e⁴/96)/(1 − e²)^(7/2) di Peters e Mathews.',
      'PSR B1913+16 is a pulsar (a clock ticking 17 times a second) in a tight eccentric orbit around another neutron star: P_b = 7.75 h, e = 0.617. Pulse arrival times give the periastron advance and the gravitational delay, hence the two masses (1.438 and 1.390 M☉). General relativity then <b>predicts with no free parameters</b> how fast the orbit must shrink through gravitational-wave emission, with the Peters–Mathews eccentricity factor f(e) = (1 + 73e²/24 + 37e⁴/96)/(1 − e²)^(7/2).'));
    var info = nota(pan, 'f(e) = <b class="bsiFX-num">' + fEcc(HT.e).toFixed(3) + '</b>' +
      '<br>Ṗ_b (' + t('RG', 'GR') + ') = <b class="bsiFX-num">' + Pd.toExponential(3) + '</b> s/s' +
      '<br>' + t('osservato (corretto per l’accelerazione galattica): ', 'observed (corrected for galactic acceleration): ') + HT.osservato.toExponential(3) + ' — ' + t('rapporto ', 'ratio ') + (HT.osservato / Pd).toFixed(3) +
      '<br>' + t('semiasse ', 'semi-major axis ') + (a / 1e3).toExponential(3) + ' km (' + (a / 6.957e8).toFixed(2) + ' R☉)' +
      '<br>' + t('avanzamento del periastro (RG): ', 'periastron advance (GR): ') + '<b class="bsiFX-num">' + wd.toFixed(3) + '°/' + t('anno', 'yr') + '</b> (' + t('misurato 4,2266°/anno', 'measured 4.2266°/yr') + ')' +
      '<br>' + t('tempo alla coalescenza: ~3·10⁸ anni', 'time to coalescence: ~3·10⁸ years'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info2 = nota(pan);
    nota(pan, t('La parabola: se il periodo diminuisce di Ṗ_b ogni secondo, dopo un tempo T il periastro arriva in anticipo di ½(Ṗ_b/P_b)T² rispetto a un orologio con periodo costante. I punti misurati da Weisberg e Taylor seguono la curva entro lo 0,2 % (Nobel 1993).', 'The parabola: if the period decreases by Ṗ_b every second, after a time T periastron arrives early by ½(Ṗ_b/P_b)T² compared with a constant-period clock. The points measured by Weisberg and Taylor follow the curve to within 0.2 % (Nobel 1993).'));
    var cv = null;
    function grafico() {
      if (!cv) return;
      var xs = [], ys = [];
      for (var i = 0; i <= 200; i++) { var anni = 1975 + st.anni * i / 200; xs.push(anni); ys.push(spostamento((anni - 1975) * ANNO, HT.Pb, Pd)); }
      F.grafico(cv, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2.5 }], linee: [{ y: 0, col: '#34465f', etich: t('nessuna emissione', 'no emission') }], xl: [t('anno', 'year'), 'year'], yl: ['ΔT_periastro (s)', 'ΔT_periastron (s)'], descr: ['Spostamento cumulativo del periastro di PSR B1913+16 previsto dalla relatività generale', 'Cumulative periastron shift of PSR B1913+16 predicted by general relativity'] });
      info2.innerHTML = t('Dopo ', 'After ') + st.anni + t(' anni: ', ' years: ') + '<b class="bsiFX-num">' + spostamento(st.anni * ANNO, HT.Pb, Pd).toFixed(1) + ' s</b>';
    }
    return {
      tre: function (S, T, L3) {
        S.aggiungi(cieloStellato(T, 2000, 60, 12));
        var q = HT.mc / M, e = HT.e, A = 2.4, b = A * Math.sqrt(1 - e * e);
        /* le due ellissi (attorno al centro di massa), con il periastro marcato */
        function ellisse(sc, col) { var pts = []; for (var i = 0; i <= 256; i++) { var E = 2 * Math.PI * i / 256; pts.push(new T.Vector3(sc * A * (Math.cos(E) - e), sc * b * Math.sin(E), 0)); } return new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.7 })); }
        var orb = new T.Group(); S.aggiungi(orb);
        orb.add(ellisse(q, 0x6bcfff)); var e2 = ellisse(1 - q, 0xffb86b); e2.rotation.z = Math.PI; orb.add(e2);
        var pulsar = new T.Mesh(new T.SphereGeometry(0.12, 24, 16), new T.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x335577 })); orb.add(pulsar);
        var comp = new T.Mesh(new T.SphereGeometry(0.12, 24, 16), new T.MeshStandardMaterial({ color: 0xffd0a0, emissive: 0x553311 })); orb.add(comp);
        pulsar.add(bagliore(T, 0x88ccff, 0.8)); comp.add(bagliore(T, 0xffc080, 0.6));
        /* i due fasci della pulsar: coni additivi che ruotano */
        var fasci = new T.Group(); pulsar.add(fasci);
        [1, -1].forEach(function (s) { var co = new T.Mesh(new T.ConeGeometry(0.22, 1.6, 24, 1, true), new T.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); co.position.y = s * 0.8; co.rotation.z = s > 0 ? Math.PI : 0; fasci.add(co); });
        fasci.rotation.x = 0.5;
        var peri = L3.testo3d(T, t('periastro', 'periastron'), '#ffd24a', 0.22); peri.position.set(A * q * (1 - e) + 0.3, 0, 0.3); orb.add(peri);
        /* il piano dell'orbita: increspature dell'onda in uscita */
        var NR = 40, NF = 96, pos = new Float32Array((NR + 1) * NF * 3), rr = [], ff = [];
        for (var i = 0; i <= NR; i++) for (var j = 0; j < NF; j++) { var k = i * NF + j, r = 1.2 + 4.5 * i / NR, a2 = 2 * Math.PI * j / NF; rr.push(r); ff.push(a2); pos[3 * k] = r * Math.cos(a2); pos[3 * k + 1] = r * Math.sin(a2); }
        var gP = new T.BufferGeometry(); gP.setAttribute('position', new T.BufferAttribute(pos, 3));
        var punti = new T.Points(gP, new T.PointsMaterial({ color: 0x5eead4, size: 0.035, transparent: true, opacity: 0.6, depthWrite: false })); S.aggiungi(punti);
        var tempo = 0, P = 6;
        S.ogniFotogramma(function (dt) {
          tempo += dt;
          var Mm = 2 * Math.PI * tempo / P, E = keplero(Mm % (2 * Math.PI), e), x = A * (Math.cos(E) - e), y = b * Math.sin(E);
          pulsar.position.set(q * x, q * y, 0); comp.position.set(-(1 - q) * x, -(1 - q) * y, 0);
          fasci.rotation.z += dt * 9;
          /* fase dell'onda ~ due volte l'anomalia vera (in ritardo con la distanza) */
          var Pa = gP.attributes.position.array, nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
          for (var k = 0; k < rr.length; k++) Pa[3 * k + 2] = 0.12 * Math.cos(2 * (ff[k] - nu) + 2 * rr[k]) / Math.sqrt(rr[k]);
          gP.attributes.position.needsUpdate = true;
          orb.rotation.z = 0.004 * tempo; /* avanzamento del periastro, esagerato */
          return true;
        });
        S.didascalia.textContent = t('La pulsar binaria PSR B1913+16: due stelle di neutroni su orbite eccentriche e i fasci della pulsar', 'The binary pulsar PSR B1913+16: two neutron stars on eccentric orbits and the pulsar beams');
        S.inquadra(8, -1.2, 0.9);
        F.cursore(ctl, ['Anni di osservazione dal 1975', 'Years of observation since 1975'], 5, 60, 1, st.anni, function (v) { st.anni = v; grafico(); });
        cv = telo(destra, 0.45);
        grafico(); F.alRidimensiona(grafico);
      }
    };
  }

  F.sezione('sastrogw', {
    titolo: ['〰️ Onde gravitazionali', '〰️ Gravitational waves'],
    sotto: ['Dalla formula del quadrupolo ai segnali di LIGO: due buchi neri in spirale nel telo dello spaziotempo, il cinguettio del segnale (anche da ascoltare), l’interferometro che lo misura e la pulsar binaria che per prima ne ha dimostrato l’esistenza.', 'From the quadrupole formula to LIGO signals: two black holes spiralling in the spacetime sheet, the chirp of the signal (which you can also hear), the interferometer that measures it and the binary pulsar that first proved its existence.'],
    schede: [
      { nome: ['🌀 Spirale in 3D', '🌀 Inspiral in 3D'], costruisci: scheda3D(schedaSpirale) },
      { nome: ['🎵 Il chirp', '🎵 The chirp'], costruisci: schedaChirp },
      { nome: ['📡 Il rivelatore', '📡 The detector'], costruisci: scheda3D(schedaRivelatore) },
      { nome: ['⏱️ Pulsar di Hulse-Taylor', '⏱️ Hulse–Taylor pulsar'], costruisci: scheda3D(schedaPulsar) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
