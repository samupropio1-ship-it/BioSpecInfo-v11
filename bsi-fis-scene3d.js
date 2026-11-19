/* ═══════════════════════════════════════════════════════════════════════
   bsi-fis-scene3d.js — 🎬 Scene fisiche 3D (v257)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Le scene dei video di riferimento che l'app non aveva ancora, calcolate e
   non disegnate a mano (le altre — eliosfera, materia oscura, spaziotempo,
   buchi neri, scala cosmica — hanno già le loro sezioni). Sono anche le scene
   che Spectra Prime apre con biospec_3d_load (morse_h2, magnetosfera,
   reticolo) attraverso bsi-spectra-ponte.js.

   1. IL LEGAME H₂ E LA CURVA DI MORSE
      V(r) = D_e (1 − e^(−a(r − r_e)))² − D_e, con i dati spettroscopici
      misurati di H₂ (Huber e Herzberg 1979): r_e = 0,74144 Å,
      ω_e = 4401,21 cm⁻¹, D_e = 4,7472 eV; a = 2πcω_e √(μ/2D_e) = 1,944 Å⁻¹.
      Livelli E_v = ħω(v + ½) − (ħω)²(v + ½)²/(4D_e): D₀ = D_e − E₀ esce
      4,478 eV (misurato 4,4781). Moto classico ESATTO nel potenziale di
      Morse: e^(a(r − r_e)) = (1 − ε cos Ωt)/(1 − ε²), ε = √(E/D_e),
      Ω = ω√(1 − ε²). La nuvola elettronica è campionata esattamente da
      |ψ|² dell'orbitale σg LCAO di Coulson (ζ = 1,197).
   2. MAGNETOSFERA E AURORE
      Campo = dipolo terrestre (B₀ = 31 000 nT, inclinato di 11°) + campo
      interplanetario uniforme B_z: il modello a sovrapposizione di Dungey
      (1961), linee integrate con Runge–Kutta. La magnetopausa è il modello
      empirico di Shue et al. (1998): r = r₀ (2/(1 + cos θ))^α,
      r₀ = (10,22 + 1,29 tanh(0,184 (B_z + 8,14))) P_d^(−1/6,6),
      α = (0,58 − 0,007 B_z)(1 + 0,024 ln P_d), P_d = 1,6726·10⁻⁶ n v² nPa.
      L'ovale aurorale è il confine fra linee aperte e chiuse calcolato dal
      modello per ogni ora magnetica locale. L'onda d'urto è la magnetopausa
      allargata di 1,2 volte (approssimazione dichiarata).
   3. IL RETICOLO DEFORMABILE
      Soluzione di Kelvin (1848) per una forza puntuale F in un solido
      elastico infinito e isotropo:
        u = F/(8πμ(1−ν)r) · [(3 − 4ν) ê_F + (ê_F·r̂) r̂],
        ∇·u = −(1 − 2ν)(F·r)/(4πμ(1−ν) r³);
      il nucleo è regolarizzato (r → √(r² + c²), c dichiarato), lo
      spostamento è amplificato per vederlo (fattore scritto). Il colore è la
      dilatazione volumica: blu compresso, rosso dilatato.
   ═══════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI, D = globale.document;
  function num(x, d) { return x.toFixed(d == null ? 2 : d).replace('.', ',').replace('-', '−'); }

  /* ═══ 1. MORSE ════════════════════════════════════════════════════════ */
  var CM_EV = 1.239841984e-4, U = 1.66053906660e-27, C0 = 299792458, EV = 1.602176634e-19;
  var H2 = { re: 0.74144, we: 4401.21, wexe: 121.34, De: 4.7472, mu: 0.503912, D0mis: 4.4781 };
  function morse(p) {
    p = p || H2;
    var hw = p.we * CM_EV, w = 2 * PI * C0 * p.we * 100, mu = p.mu * U, a = w * Math.sqrt(mu / (2 * p.De * EV)) * 1e-10;   /* Å⁻¹ */
    var x = hw * hw / (4 * p.De), vmax = Math.floor(p.De / hw * 2 - 0.5 + 1e-9);   /* E_v cresce finché v + ½ < D_e/ħω·2 */
    function E(v) { return hw * (v + 0.5) - x * (v + 0.5) * (v + 0.5); }
    var livelli = []; for (var v = 0; v <= vmax && E(v) < p.De; v++) livelli.push(E(v));
    return {
      a: a, hw: hw, omega: w, x: x, livelli: livelli, D0: p.De - E(0), periodo: 2 * PI / w, re: p.re, De: p.De,
      V: function (r) { var q = 1 - Math.exp(-a * (r - p.re)); return p.De * q * q - p.De; },                 /* eV, zero agli atomi separati */
      Varm: function (r) { return 0.5 * 2 * p.De * a * a * (r - p.re) * (r - p.re) - p.De; },                 /* stessa curvatura in r_e */
      inversione: function (Ev) { var e = Math.sqrt(Math.min(0.999999, Ev / p.De)); return [p.re - Math.log(1 + e) / a, p.re - Math.log(1 - e) / a]; },
      /* moto classico esatto: r(t) con t in secondi, energia Ev sopra il fondo */
      r: function (Ev, tt) { var e = Math.sqrt(Math.min(0.999999, Ev / p.De)), W = w * Math.sqrt(1 - e * e); return p.re + Math.log((1 - e * Math.cos(W * tt)) / (1 - e * e)) / a; },
      periodoDi: function (Ev) { var e = Math.sqrt(Math.min(0.999999, Ev / p.De)); return 2 * PI / (w * Math.sqrt(1 - e * e)); }
    };
  }
  /** campionamento ESATTO di |ψ|² con ψ = e^(−ζ r_A) + e^(−ζ r_B) (unità di bohr): miscela di due 1s e accettazione (a+b)²/(2(a²+b²)) ≤ 1 */
  var BOHR = 0.529177210903;
  function nuvolaH2(Rang, n, zeta, rnd) {
    zeta = zeta || 1.197; rnd = rnd || Math.random; var R = Rang / BOHR, out = new Float32Array(n * 3), k = 0, prove = 0;
    while (k < n && prove < n * 20) {
      prove++;
      /* r ~ Gamma(3, 1/(2ζ)) per la densità 1s ∝ r² e^(−2ζr) */
      var rr = -(Math.log(rnd() + 1e-300) + Math.log(rnd() + 1e-300) + Math.log(rnd() + 1e-300)) / (2 * zeta), cz = 2 * rnd() - 1, ph = 2 * PI * rnd(), s = Math.sqrt(1 - cz * cz);
      var cx = rnd() < 0.5 ? -R / 2 : R / 2, x = cx + rr * s * Math.cos(ph), y = rr * s * Math.sin(ph), z = rr * cz;
      var a = Math.exp(-zeta * Math.hypot(x + R / 2, y, z)), b = Math.exp(-zeta * Math.hypot(x - R / 2, y, z));
      if (rnd() * 2 * (a * a + b * b) > (a + b) * (a + b)) continue;
      out[3 * k] = x * BOHR; out[3 * k + 1] = y * BOHR; out[3 * k + 2] = z * BOHR; k++;
    }
    return out.subarray(0, 3 * k);
  }

  /* ═══ 2. MAGNETOSFERA ═══════════════════════════════════════════════════ */
  var B0 = 31000, TILT = 11 * PI / 180;
  function pressione(n, v) { return 1.6726e-6 * n * v * v; }                    /* nPa, n in cm⁻³, v in km/s */
  function shue(Bz, Pd) { return { r0: (10.22 + 1.29 * Math.tanh(0.184 * (Bz + 8.14))) * Math.pow(Pd, -1 / 6.6), alfa: (0.58 - 0.007 * Bz) * (1 + 0.024 * Math.log(Pd)) }; }
  function rShue(S, cosT) { return S.r0 * Math.pow(2 / (1 + cosT), S.alfa); }
  function chapmanFerraro(n, v) { var mu0 = 4e-7 * PI, rho = n * 1e6 * 1.6726e-27, B = B0 * 1e-9; return Math.pow(4 * B * B / (2 * mu0 * rho * v * v * 1e6), 1 / 6); }   /* f = 2 */
  /** il campo in nT a (x, y, z) in raggi terrestri: dipolo inclinato nel piano x–z + campo interplanetario uniforme */
  function campo(x, y, z, Bz) {
    var mx = -Math.sin(TILT), mz = -Math.cos(TILT);                              /* momento verso sud, inclinato verso il Sole d'estate */
    var r2 = x * x + y * y + z * z, r = Math.sqrt(r2), r5 = r2 * r2 * r, md = mx * x + mz * z;
    return [B0 * (3 * md * x / r5 - mx / (r2 * r)), B0 * (3 * md * y / r5), B0 * (3 * md * z / r5 - mz / (r2 * r)) + Bz];
  }
  /** traccia una linea di campo da p0; verso +1 lungo B, −1 contro. Si ferma sulla Terra (chiusa), oltre rMax o fuori dalla magnetopausa (aperta). */
  function traccia(p0, verso, Bz, S, rMax, passi) {
    var p = p0.slice(), punti = [p.slice()], esito = 'aperta';
    function dir(q) { var b = campo(q[0], q[1], q[2], Bz), m = Math.hypot(b[0], b[1], b[2]) || 1; return [verso * b[0] / m, verso * b[1] / m, verso * b[2] / m]; }
    for (var i = 0; i < (passi || 3000); i++) {
      var r = Math.hypot(p[0], p[1], p[2]), h = Math.min(0.5, 0.02 + 0.03 * r);
      var k1 = dir(p), q2 = [p[0] + k1[0] * h / 2, p[1] + k1[1] * h / 2, p[2] + k1[2] * h / 2], k2 = dir(q2), q3 = [p[0] + k2[0] * h / 2, p[1] + k2[1] * h / 2, p[2] + k2[2] * h / 2], k3 = dir(q3), q4 = [p[0] + k3[0] * h, p[1] + k3[1] * h, p[2] + k3[2] * h], k4 = dir(q4);
      for (var j = 0; j < 3; j++) p[j] += h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
      punti.push(p.slice()); r = Math.hypot(p[0], p[1], p[2]);
      if (r < 1) { esito = 'chiusa'; break; }
      if (r > rMax) break;
      if (S && i > 5 && r > rShue(S, p[0] / r) * 1.001) { esito = 'fuori'; break; }
    }
    return { punti: punti, esito: esito };
  }
  /** da dove parte la linea alla latitudine magnetica λ e all'ora locale magnetica mlt (0 = mezzanotte, 12 = mezzogiorno), emisfero nord */
  function piede(lat, mlt, nord) {
    var ph = (mlt / 24) * 2 * PI + PI, cl = Math.cos(lat), x0 = 1.01 * cl * Math.cos(ph), y0 = 1.01 * cl * Math.sin(ph), z0 = 1.01 * Math.sin(lat) * (nord ? 1 : -1);
    /* coordinate magnetiche → GSM: rotazione dell'inclinazione attorno a y */
    return [x0 * Math.cos(TILT) + z0 * Math.sin(TILT), y0, -x0 * Math.sin(TILT) + z0 * Math.cos(TILT)];
  }
  /** il confine fra calotta polare (linee aperte) e linee chiuse, per bisezione: la latitudine dove la linea smette di tornare sulla Terra */
  function confineCalotta(mlt, Bz, nord) {
    var lo = 45 * PI / 180, hi = 89.5 * PI / 180;
    function chiusa(lat) { var p = piede(lat, mlt, nord); return traccia(p, nord ? -1 : 1, Bz, null, 80, 6000).esito === 'chiusa'; }   /* sopra il polo nord il campo entra nella Terra: per salire si va contro B */
    if (!chiusa(lo)) return lo; if (chiusa(hi)) return hi;
    for (var i = 0; i < 22; i++) { var m = (lo + hi) / 2; if (chiusa(m)) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  /* ═══ 3. KELVIN ═════════════════════════════════════════════════════════ */
  /** spostamento (con μ = 1 e F = |F|) nel punto r, forza lungo e (versore); c = nucleo */
  function kelvin(x, y, z, e, nu, c) {
    var r = Math.sqrt(x * x + y * y + z * z + c * c), er = (e[0] * x + e[1] * y + e[2] * z) / r, k = 1 / (8 * PI * (1 - nu) * r);
    return [k * ((3 - 4 * nu) * e[0] + er * x / r), k * ((3 - 4 * nu) * e[1] + er * y / r), k * ((3 - 4 * nu) * e[2] + er * z / r)];
  }
  function dilatazione(x, y, z, e, nu, c) { var r = Math.sqrt(x * x + y * y + z * z + c * c); return -(1 - 2 * nu) * (e[0] * x + e[1] * y + e[2] * z) / (4 * PI * (1 - nu) * r * r * r); }

  /* ═══ 4. LE SCHEDE ═══════════════════════════════════════════════════════ */
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function scena3D(dx, pronto) {
    var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.appendChild(attesa);
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return; }
    L3.stile(); L3.caricaThree().then(function () { attesa.remove(); var S = new L3.Scena(dx, 0.72); dx.insertBefore(S.box, dx.firstChild); pronto(S, globale.THREE, L3); }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
  }
  function casella(pan, et, val, f) { var c = F.el('input', { type: 'checkbox', 'aria-label': F.tt(et) }); c.checked = !!val; var l = F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.86rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(et) })]); c.addEventListener('change', function () { f(c.checked); }); pan.appendChild(l); return c; }
  var calmo = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 4.1 Morse ── */
  function schedaMorse(div) {
    var g0 = griglia(div), M = morse(), st = { v: 0, rall: 1e14, armonica: true, nuvola: true }, tempo = 0;
    F.cursore(g0.pan, ['Livello vibrazionale v', 'Vibrational level v'], 0, M.livelli.length - 1, 1, 0, function (v) { st.v = v; ricostruisci(); }, function (v) { return 'v = ' + v; });
    casella(g0.pan, ['Curva armonica di confronto', 'Harmonic comparison curve'], true, function (c) { st.armonica = c; curva(); });
    casella(g0.pan, ['Nuvola elettronica σg', 'σg electron cloud'], true, function (c) { st.nuvola = c; if (nuv) nuv.visible = c; if (S) S.avvia(); });
    var tela = F.el('canvas', { role: 'img', 'aria-label': t('Curva di Morse di H₂ con i livelli vibrazionali', 'Morse curve of H₂ with the vibrational levels'), style: 'width:100%;height:230px;display:block;margin-top:8px;border-radius:10px;background:#06111d' });
    g0.pan.appendChild(tela);
    var info = F.el('div', { 'class': 'bsiFX-nota', 'aria-live': 'polite' }); g0.pan.appendChild(info);
    var S = null, T = null, nA = null, nB = null, leg = null, nuv = null, rOra = M.re;
    function curva() {
      var W = tela.clientWidth || 300, H = 230, dpr = (globale.BSIRisoluzione ? globale.BSIRisoluzione.dpr() : Math.min(2, globale.devicePixelRatio || 1)); tela.width = W * dpr; tela.height = H * dpr; var q = tela.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H);
      var r0 = 0.35, r1 = 3.2, e0 = -M.De - 0.2, e1 = 0.6, X = function (r) { return 34 + (r - r0) / (r1 - r0) * (W - 44); }, Y = function (e) { return 10 + (e1 - e) / (e1 - e0) * (H - 34); };
      q.strokeStyle = '#2a3b4d'; q.lineWidth = 1; q.beginPath(); q.moveTo(X(r0), Y(0)); q.lineTo(X(r1), Y(0)); q.stroke();
      if (st.armonica) { q.strokeStyle = 'rgba(159,179,200,.6)'; q.setLineDash([4, 3]); q.beginPath(); for (var i = 0; i <= 200; i++) { var r = r0 + (r1 - r0) * i / 200, e = M.Varm(r); if (e > e1) { q.moveTo(X(r), Y(Math.min(e1, e))); continue; } q.lineTo(X(r), Y(e)); } q.stroke(); q.setLineDash([]); }
      q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.beginPath(); var primo = true; for (var j = 0; j <= 300; j++) { var rr = r0 + (r1 - r0) * j / 300, ee = M.V(rr); if (ee > e1) { primo = true; continue; } if (primo) { q.moveTo(X(rr), Y(ee)); primo = false; } else q.lineTo(X(rr), Y(ee)); } q.stroke();
      M.livelli.forEach(function (Ev, v) { var tp = M.inversione(Ev), y = Y(Ev - M.De); q.strokeStyle = v === st.v ? '#5eead4' : 'rgba(94,234,212,.28)'; q.lineWidth = v === st.v ? 2 : 1; q.beginPath(); q.moveTo(X(tp[0]), y); q.lineTo(X(Math.min(r1, tp[1])), y); q.stroke(); });
      var Ev0 = M.livelli[st.v]; q.fillStyle = '#fff'; q.beginPath(); q.arc(X(rOra), Y(Ev0 - M.De), 4, 0, 2 * PI); q.fill();
      q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; q.fillText('V (eV)', 2, 12); q.fillText('r (Å)', W - 34, H - 6);
      [0.5, 1, 1.5, 2, 2.5, 3].forEach(function (r) { q.fillText(num(r, 1), X(r) - 6, H - 6); }); [-4, -2, 0].forEach(function (e) { q.fillText(String(e).replace('-', '−'), 6, Y(e) + 3); });
    }
    function ricostruisci() {
      var Ev = M.livelli[st.v], tp = M.inversione(Ev);
      info.innerHTML = '<div class="bsiFX-eq">V(r) = D_e(1 − e^(−a(r − r_e)))² − D_e</div>' +
        'a = <b class="bsiFX-num">' + num(M.a, 3) + ' Å⁻¹</b> · r_e = ' + num(M.re, 4) + ' Å · D_e = ' + num(M.De, 4) + ' eV<br>' +
        'v = ' + st.v + ': E = <b class="bsiFX-num">' + num(Ev - M.De, 3) + ' eV</b> · ' + t('fra ', 'between ') + num(tp[0], 3) + t(' e ', ' and ') + num(tp[1], 3) + ' Å · ' + t('periodo ', 'period ') + num(M.periodoDi(Ev) * 1e15, 2) + ' fs<br>' +
        t('Energia di dissociazione ', 'Dissociation energy ') + 'D₀ = D_e − E₀ = <b class="bsiFX-num">' + num(M.D0, 3) + ' eV</b> (' + t('misurata ', 'measured ') + num(H2.D0mis, 4) + ' eV) · ' + M.livelli.length + t(' livelli legati nel modello (H₂ reale: 15)', ' bound levels in the model (real H₂: 15)') +
        '<br><small>' + t('Dati spettroscopici di Huber e Herzberg. Il moto è quello classico esatto nel potenziale di Morse all\'energia del livello, rallentato di 10¹⁴ volte; la nuvola è |ψ|² dell\'orbitale σg di Coulson (ζ = 1,197) alla distanza del momento.', 'Spectroscopic data from Huber and Herzberg. The motion is the exact classical one in the Morse potential at the level energy, slowed 10¹⁴ times; the cloud is |ψ|² of the Coulson σg orbital (ζ = 1.197) at the current distance.') + '</small>';
      curva(); if (S) S.avvia();
    }
    ricostruisci();
    scena3D(g0.dx, function (S0, T0) {
      S = S0; T = T0; S.ren.setClearColor(0x03060c, 1);
      if (S.cinema) try { S.cinema({ forza: 0.5, soglia: 0.6 }); } catch (e) { }
      var sf = new T.SphereGeometry(0.11, 24, 16), mat = new T.MeshStandardMaterial({ color: 0xf2f2f2, emissive: 0x334455, roughness: 0.3 });
      nA = new T.Mesh(sf, mat); nB = new T.Mesh(sf, mat); nA.name = 'protone'; nB.name = 'protone'; S.aggiungi(nA); S.aggiungi(nB);
      leg = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1, 10), new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.5 })); leg.rotation.z = PI / 2; leg.name = 'legame'; S.aggiungi(leg);
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(6000 * 3), 3));
      nuv = new T.Points(geo, new T.PointsMaterial({ color: 0x5aa8ff, size: 0.022, transparent: true, opacity: 0.4, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true })); nuv.name = 'nuvola-elettronica'; nuv.visible = st.nuvola; S.aggiungi(nuv);
      var cont = 0;
      function pose(r) {
        rOra = r; nA.position.set(-r / 2, 0, 0); nB.position.set(r / 2, 0, 0); leg.scale.set(1, r, 1);
        if (nuv.visible && (cont++ % 3 === 0 || calmo)) { var p = nuvolaH2(r, 6000); geo.attributes.position.array.set(p); geo.setDrawRange(0, p.length / 3); geo.attributes.position.needsUpdate = true; }
        S.didascalia.textContent = 'H₂ · v = ' + st.v + ' · r = ' + num(r, 3) + ' Å · ' + t('MISURATO (costanti) + MODELLO (Morse, LCAO)', 'MEASURED (constants) + MODEL (Morse, LCAO)');
      }
      pose(M.re); S.inquadra(4.2, -1.2, 1.2);
      if (!calmo) S.ogniFotogramma(function (dt) { tempo += dt / st.rall; pose(M.r(M.livelli[st.v], tempo)); if (cont % 4 === 0) curva(); return true; });
      div._scena = S;
    });
    div._scena3d = { morse: M, stato: st };
  }

  /* ── 4.2 Magnetosfera ── */
  function schedaMagnetosfera(div) {
    var g0 = griglia(div), st = { n: 5, v: 400, Bz: -5, linee: true, mp: true, urto: true, vento: true, aurore: true };
    var info = F.el('div', { 'class': 'bsiFX-nota', 'aria-live': 'polite' });
    F.cursore(g0.pan, ['Densità del vento solare n (cm⁻³)', 'Solar wind density n (cm⁻³)'], 1, 30, 0.5, st.n, function (v) { st.n = v; costruisci(); }, function (v) { return num(v, 1); });
    F.cursore(g0.pan, ['Velocità del vento solare v (km/s)', 'Solar wind speed v (km/s)'], 250, 900, 10, st.v, function (v) { st.v = v; costruisci(); }, function (v) { return v + ' km/s'; });
    F.cursore(g0.pan, ['Campo interplanetario B_z (nT)', 'Interplanetary field B_z (nT)'], -15, 10, 0.5, st.Bz, function (v) { st.Bz = v; costruisci(); }, function (v) { return num(v, 1) + ' nT'; });
    casella(g0.pan, ['Linee di campo', 'Field lines'], true, function (c) { st.linee = c; vis(); });
    casella(g0.pan, ['Magnetopausa', 'Magnetopause'], true, function (c) { st.mp = c; vis(); });
    casella(g0.pan, ['Onda d\'urto', 'Bow shock'], true, function (c) { st.urto = c; vis(); });
    casella(g0.pan, ['Vento solare', 'Solar wind'], true, function (c) { st.vento = c; vis(); });
    casella(g0.pan, ['Ovali aurorali', 'Auroral ovals'], true, function (c) { st.aurore = c; vis(); });
    g0.pan.appendChild(info);
    var S = null, T = null, L3 = null, gr = {}, sw = null, swP = null, swV = null, Sh = null, conti = null;
    function vis() { if (!S) return; ['linee', 'mp', 'urto', 'vento', 'aurore'].forEach(function (k) { if (gr[k]) gr[k].visible = st[k]; }); S.avvia(); }
    function calcola() {
      var Pd = pressione(st.n, st.v); Sh = shue(st.Bz, Pd);
      var mez = confineCalotta(0, st.Bz, true), gio = confineCalotta(12, st.Bz, true);
      conti = { Pd: Pd, r0: Sh.r0, alfa: Sh.alfa, cf: chapmanFerraro(st.n, st.v), mezzanotte: mez * 180 / PI, mezzogiorno: gio * 180 / PI };
      info.innerHTML = '<div class="bsiFX-eq">r = r₀ (2/(1 + cos θ))^α</div>' +
        'P_d = 1,6726·10⁻⁶ n v² = <b class="bsiFX-num">' + num(Pd, 2) + ' nPa</b> · r₀ (Shue) = <b class="bsiFX-num">' + num(Sh.r0, 2) + ' R_T</b> · α = ' + num(Sh.alfa, 3) + '<br>' +
        t('Equilibrio di Chapman e Ferraro (f = 2): ', 'Chapman–Ferraro balance (f = 2): ') + '<b class="bsiFX-num">' + num(conti.cf, 2) + ' R_T</b><br>' +
        t('Confine della calotta polare (linee aperte) dal modello: ', 'Polar cap boundary (open lines) from the model: ') + '<b class="bsiFX-num">' + num(conti.mezzanotte, 1) + '°</b> ' + t('a mezzanotte, ', 'at midnight, ') + '<b class="bsiFX-num">' + num(conti.mezzogiorno, 1) + '°</b> ' + t('a mezzogiorno (latitudine magnetica)', 'at noon (magnetic latitude)') + '<br>' +
        '<small>' + (st.Bz < 0 ? t('B_z verso sud: il campo interplanetario si riconnette con quello terrestre sul lato diurno, la calotta si allarga e l\'ovale scende di latitudine (tempeste, aurore più a sud).', 'Southward B_z: the interplanetary field reconnects with Earth\'s on the dayside, the cap widens and the oval moves to lower latitudes (storms, aurorae further south).') : t('B_z verso nord: poca riconnessione sul lato diurno, calotta piccola, ovale alto.', 'Northward B_z: little dayside reconnection, small cap, high oval.')) +
        ' ' + t('Modello a sovrapposizione di Dungey (nel vuoto, senza correnti di coda); magnetopausa empirica di Shue et al. 1998; onda d\'urto = magnetopausa × 1,2 (approssimazione).', 'Dungey superposition model (vacuum, no tail currents); empirical Shue et al. 1998 magnetopause; bow shock = magnetopause × 1.2 (approximation).') + '</small>';
    }
    function superficie(fattore, col, opac) {
      var th = 64, fi = 48, pos = [], ind = [];
      for (var i = 0; i <= th; i++) { var a = (i / th) * 0.66 * PI, r = rShue(Sh, Math.cos(a)) * fattore; for (var j = 0; j <= fi; j++) { var b = (j / fi) * 2 * PI; pos.push(r * Math.cos(a), r * Math.sin(a) * Math.cos(b), r * Math.sin(a) * Math.sin(b)); } }
      for (i = 0; i < th; i++) for (var j2 = 0; j2 < fi; j2++) { var p = i * (fi + 1) + j2; ind.push(p, p + fi + 1, p + 1, p + 1, p + fi + 1, p + fi + 2); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(ind); g.computeVertexNormals();
      var m = new T.Mesh(g, new T.MeshStandardMaterial({ color: col, transparent: true, opacity: opac, side: T.DoubleSide, depthWrite: false, roughness: 0.6, emissive: col, emissiveIntensity: 0.15 }));
      var w = new T.LineSegments(new T.WireframeGeometry(g), new T.LineBasicMaterial({ color: col, transparent: true, opacity: opac * 0.6 })); var grp = new T.Group(); grp.add(m); grp.add(w); return grp;
    }
    function costruisci() {
      calcola(); if (!S) return;
      S.pulisci(); gr = {};
      /* la Terra con la sua tessitura, l'asse magnetico */
      var terra = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshStandardMaterial({ color: 0x4f7fb0, roughness: 0.8 })); terra.name = 'Terra'; terra.rotation.x = PI / 2;
      try { new T.TextureLoader().load('./textures/earth_day.jpg', function (tx) { terra.material.map = tx; terra.material.color.set(0xffffff); terra.material.needsUpdate = true; S.avvia(); }); } catch (e) { }
      S.aggiungi(terra);
      var asse = new T.Group(); asse.add(L3.linea(T, [[0, 0, -1.8], [0, 0, 1.8]], 0xffd24a, 0.8)); asse.rotation.y = TILT; S.aggiungi(asse);
      /* le linee di campo: piedi fra 45° e 85° di latitudine magnetica, otto meridiani, due emisferi */
      gr.linee = new T.Group(); gr.linee.name = 'linee-di-campo';
      [0, 3, 6, 9, 12, 15, 18, 21].forEach(function (mlt) {
        [50, 58, 64, 68, 72, 76, 81, 86].forEach(function (lat) {
          [true, false].forEach(function (nord) {
            var tr = traccia(piede(lat * PI / 180, mlt, nord), nord ? -1 : 1, st.Bz, Sh, 40, 2500);
            if (tr.esito === 'chiusa' && !nord) return;                       /* le chiuse si disegnano una volta sola */
            if (tr.esito !== 'chiusa' && mlt % 6 !== 0) return;                /* le aperte su quattro meridiani soli: la scena resta leggibile */
            var col = tr.esito === 'chiusa' ? 0x5eead4 : 0xff9f43;
            gr.linee.add(L3.linea(T, tr.punti, col, tr.esito === 'chiusa' ? 0.75 : 0.55));
          });
        });
      });
      S.aggiungi(gr.linee);
      gr.mp = superficie(1, 0x6fa8ff, 0.12); gr.mp.name = 'magnetopausa'; S.aggiungi(gr.mp);
      gr.urto = superficie(1.2, 0xff8a5c, 0.07); gr.urto.name = 'onda-d-urto'; S.aggiungi(gr.urto);
      /* gli ovali aurorali: una fascia appena sotto il confine calcolato, verde 557,7 nm in basso e rosso 630 nm in alto */
      gr.aurore = new T.Group(); gr.aurore.name = 'ovali-aurorali';
      [true, false].forEach(function (nord) {
        var pos = [], col = [], ind = [], N = 48;
        for (var i = 0; i <= N; i++) {
          var mlt = 24 * i / N, lat = confineCalotta(mlt, st.Bz, nord);
          [[lat - 4 * PI / 180, 1.012, [0.25, 1, 0.45]], [lat - 0.5 * PI / 180, 1.012, [0.35, 1, 0.55]], [lat - 0.5 * PI / 180, 1.06, [1, 0.25, 0.3]]].forEach(function (c) { var p = piede(c[0], mlt, nord), s = c[1] / 1.01; pos.push(p[0] * s, p[1] * s, p[2] * s); col.push(c[2][0], c[2][1], c[2][2]); });
        }
        for (i = 0; i < N; i++) { var a = 3 * i, b = 3 * (i + 1); ind.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(ind);
        gr.aurore.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })));
      });
      S.aggiungi(gr.aurore);
      /* il vento solare: particelle che arrivano dal Sole (+x) e scivolano lungo l'onda d'urto */
      var N = 1400; swP = new Float32Array(N * 3); swV = new Float32Array(N);
      for (var k = 0; k < N; k++) { swP[3 * k] = 30 + Math.random() * 40 - 40; swP[3 * k + 1] = (Math.random() - 0.5) * 60; swP[3 * k + 2] = (Math.random() - 0.5) * 60; swV[k] = 0.7 + Math.random() * 0.6; }
      var gs = new T.BufferGeometry(); gs.setAttribute('position', new T.BufferAttribute(swP, 3));
      sw = new T.Points(gs, new T.PointsMaterial({ color: 0xffd28a, size: 0.18, transparent: true, opacity: 0.7, depthWrite: false })); gr.vento = sw; sw.name = 'vento-solare'; S.aggiungi(sw);
      var sole = L3.freccia(T, [34, 0, 0], [26, 0, 0], 0xffd24a); S.aggiungi(sole);
      var et = L3.testo3d(T, t('verso il Sole', 'to the Sun'), '#ffd24a', 1.2); et.position.set(30, 0, 3); S.aggiungi(et);
      vis();
      S.didascalia.textContent = t('Magnetosfera · r₀ = ', 'Magnetosphere · r₀ = ') + num(Sh.r0, 1) + ' R_T · B_z = ' + num(st.Bz, 1) + ' nT · ' + t('MODELLO (Dungey + Shue)', 'MODEL (Dungey + Shue)');
      if (!S.vistaIniziale) S.inquadra(64, -2.3, 1.15);
      S.avvia();
    }
    calcola();
    scena3D(g0.dx, function (S0, T0, L30) {
      S = S0; T = T0; L3 = L30; S.ren.setClearColor(0x020509, 1); if (S.cinema) try { S.cinema({ forza: 0.45, soglia: 0.6 }); } catch (e) { }
      costruisci();
      if (!calmo) S.ogniFotogramma(function (dt) {
        if (!sw || !sw.visible) return true;
        var vel = st.v / 400 * 18 * dt;
        for (var k = 0; k < swV.length; k++) {
          var x = swP[3 * k] - vel * swV[k], y = swP[3 * k + 1], z = swP[3 * k + 2], r = Math.sqrt(x * x + y * y + z * z), rb = rShue(Sh, x / (r || 1)) * 1.2;
          if (r < rb) { var s = rb / r; x *= s; y *= s; z *= s; var rr = Math.hypot(y, z) || 1; y += y / rr * vel * 0.6; z += z / rr * vel * 0.6; }
          if (x < -45 || Math.abs(y) > 35 || Math.abs(z) > 35) { x = 30 + Math.random() * 6; y = (Math.random() - 0.5) * 60; z = (Math.random() - 0.5) * 60; }
          swP[3 * k] = x; swP[3 * k + 1] = y; swP[3 * k + 2] = z;
        }
        sw.geometry.attributes.position.needsUpdate = true; return true;
      });
      div._scena = S;
    });
    div._scena3d = { stato: st, conti: function () { return conti; } };
  }

  /* ── 4.3 Reticolo di Kelvin ── */
  function schedaReticolo(div) {
    var g0 = griglia(div), st = { nu: 0.3, amp: 12, n: 11, asse: 'z', colore: true }, fase = 0;
    var info = F.el('div', { 'class': 'bsiFX-nota', 'aria-live': 'polite' });
    F.cursore(g0.pan, ['Coefficiente di Poisson ν', 'Poisson ratio ν'], 0, 0.49, 0.01, st.nu, function (v) { st.nu = v; costruisci(); }, function (v) { return num(v, 2); });
    F.cursore(g0.pan, ['Amplificazione dello spostamento', 'Displacement amplification'], 1, 40, 1, st.amp, function (v) { st.amp = v; costruisci(); }, function (v) { return '× ' + v; });
    F.cursore(g0.pan, ['Nodi per lato', 'Nodes per side'], 7, 15, 2, st.n, function (v) { st.n = v; costruisci(); }, function (v) { return v; });
    F.scelta(g0.pan, ['Direzione della forza', 'Force direction'], [['z', ['verticale (z)', 'vertical (z)']], ['x', ['orizzontale (x)', 'horizontal (x)']]], 'z', function (v) { st.asse = v; costruisci(); });
    casella(g0.pan, ['Colore = dilatazione volumica', 'Colour = volumetric strain'], true, function (c) { st.colore = c; costruisci(); });
    g0.pan.appendChild(info);
    var S = null, T = null, L3 = null, linee = null, base = null, spost = null, col0 = null, NUCLEO = 0.18;
    function e() { return st.asse === 'z' ? [0, 0, -1] : [1, 0, 0]; }
    function costruisci() {
      var mu = 79.3e9, nu = st.nu, Fn = 1e5, Lm = 1;     /* acciaio, 100 kN, cubo di 2 m */
      var u02 = kelvin(0, 0, -0.2, [0, 0, -1], nu, 0)[2] * Fn / (mu * Lm);
      info.innerHTML = '<div class="bsiFX-eq">u = F/(8πμ(1−ν)r) · [(3 − 4ν) ê + (ê·r̂) r̂]</div>' + t('Forza puntuale nel centro di un solido elastico infinito (Kelvin 1848). ', 'Point force at the centre of an infinite elastic solid (Kelvin 1848). ') +
        t('Per acciaio (μ = 79,3 GPa) e F = 100 kN, a 20 cm sotto la forza: ', 'For steel (μ = 79.3 GPa) and F = 100 kN, 20 cm below the force: ') + '<b class="bsiFX-num">u = ' + num(Math.abs(u02) * 1e6, 2) + ' µm</b>' + t(' — per questo lo spostamento è amplificato.', ' — that is why the displacement is amplified.') + '<br>' +
        '∇·u = −(1 − 2ν)(F·r)/(4πμ(1−ν)r³): ' + t('compressione davanti alla forza, dilatazione dietro; con ν = 0,5 il materiale è incomprimibile e la dilatazione si annulla.', 'compression ahead of the force, dilatation behind; at ν = 0.5 the material is incompressible and the dilatation vanishes.') +
        '<br><small>' + t('Nucleo regolarizzato di raggio ' + num(NUCLEO, 2) + ' (la soluzione vera diverge nel punto di applicazione); spostamento × ' + st.amp + ' e normalizzato, la forza pulsa per mostrare il carico.', 'Core regularised with radius ' + num(NUCLEO, 2) + ' (the true solution diverges at the load point); displacement × ' + st.amp + ' and normalised, the force pulses to show the loading.') + '</small>';
      if (!S) return;
      S.pulisci();
      var n = st.n, pos = [], idx = [], k = 0, ee = e(), sc = st.amp * 0.08 / kelvin(0, 0, 0.5, ee, nu, NUCLEO).reduce(function (a, b) { return Math.max(a, Math.abs(b)); }, 0) * 0.5;
      base = []; spost = []; var dil = [];
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) for (var l = 0; l < n; l++) { var x = -1 + 2 * i / (n - 1), y = -1 + 2 * j / (n - 1), z = -1 + 2 * l / (n - 1); base.push(x, y, z); var u = kelvin(x, y, z, ee, nu, NUCLEO); spost.push(u[0] * sc, u[1] * sc, u[2] * sc); dil.push(dilatazione(x, y, z, ee, nu, NUCLEO)); }
      function id(i, j, l) { return (i * n + j) * n + l; }
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) for (l = 0; l < n; l++) { if (i < n - 1) idx.push(id(i, j, l), id(i + 1, j, l)); if (j < n - 1) idx.push(id(i, j, l), id(i, j + 1, l)); if (l < n - 1) idx.push(id(i, j, l), id(i, j, l + 1)); }
      var dmax = dil.reduce(function (a, b) { return Math.max(a, Math.abs(b)); }, 0) || 1, cols = [];
      dil.forEach(function (d) { var f = Math.max(-1, Math.min(1, d / dmax * 3)); if (!st.colore) cols.push(0.55, 0.75, 0.95); else if (f >= 0) cols.push(0.5 + 0.5 * f, 0.55 - 0.35 * f, 0.6 - 0.45 * f); else cols.push(0.5 + 0.3 * f, 0.6 + 0.1 * f, 0.7 - 0.25 * f); });
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(base.slice(), 3)); g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); g.setIndex(idx);
      linee = new T.LineSegments(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 })); linee.name = 'reticolo'; S.aggiungi(linee);
      var fr = L3.freccia(T, [-ee[0] * 0.9, -ee[1] * 0.9, -ee[2] * 0.9], [0, 0, 0], 0xffd24a); fr.name = 'forza'; S.aggiungi(fr);
      aggiornaPos(1);
      S.didascalia.textContent = t('Reticolo elastico · forza puntuale (Kelvin) · ν = ', 'Elastic lattice · point force (Kelvin) · ν = ') + num(nu, 2) + ' · ' + t('spostamento ×', 'displacement ×') + st.amp + t(' · blu compresso, rosso dilatato', ' · blue compressed, red dilated');
      if (!S.vistaIniziale) S.inquadra(5.2, -0.8, 1.15);
      S.avvia();
    }
    function aggiornaPos(f) { if (!linee) return; var a = linee.geometry.attributes.position.array; for (var i = 0; i < a.length; i++) a[i] = base[i] + spost[i] * f; linee.geometry.attributes.position.needsUpdate = true; }
    costruisci();
    scena3D(g0.dx, function (S0, T0, L30) {
      S = S0; T = T0; L3 = L30; S.ren.setClearColor(0x05080f, 1); costruisci();
      if (!calmo) S.ogniFotogramma(function (dt) { fase += dt; aggiornaPos(0.5 - 0.5 * Math.cos(fase * 1.4)); return true; });
      div._scena = S;
    });
    div._scena3d = { stato: st };
  }

  F.sezione('sfisscene', {
    titolo: ['🎬 Scene fisiche 3D', '🎬 3D physics scenes'],
    sotto: ['Il legame di H₂ che vibra nella curva di Morse, la magnetosfera terrestre con le aurore, un reticolo elastico che si deforma: tutto calcolato dalle equazioni e dai dati misurati, con il pulsante AR per portarlo sul tavolo.',
            'The H₂ bond vibrating in the Morse curve, Earth\'s magnetosphere with the aurorae, an elastic lattice that deforms: all computed from the equations and measured data, with the AR button to bring it onto the table.'],
    schede: [
      { nome: ['⚛️ H₂ e la curva di Morse', '⚛️ H₂ and the Morse curve'], costruisci: schedaMorse },
      { nome: ['🧲 Magnetosfera e aurore', '🧲 Magnetosphere and aurorae'], costruisci: schedaMagnetosfera },
      { nome: ['🕸️ Il reticolo deformabile', '🕸️ The deformable lattice'], costruisci: schedaReticolo }
    ]
  });
  F.calcolo = F.calcolo || {};
  F.calcolo.scene3d = { morse: morse, H2: H2, nuvolaH2: nuvolaH2, pressione: pressione, shue: shue, rShue: rShue, chapmanFerraro: chapmanFerraro, campo: campo, traccia: traccia, piede: piede, confineCalotta: confineCalotta, kelvin: kelvin, dilatazione: dilatazione };
})(typeof window !== 'undefined' ? window : globalThis);
