/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-fluidi.js — 🌊 fluidi
   BioSpecInfo · © Samuele Pio Provenzano

   · VENTURI: un tubo che si stringe; continuita' A₁v₁ = A₂v₂ e Bernoulli
     p + ½ρv² = cost.; le particelle accelerano nella strozzatura e i
     manometri scendono; la portata misurata dal dislivello;
   · VISCOSITA': il profilo parabolico di Poiseuille v(r) = Δp(R² − r²)/(4ηL)
     con la portata Q = πR⁴Δp/(8ηL) (R⁴: dimezzare il raggio riduce la
     portata di 16 volte); il numero di Reynolds e il regime; la
     sedimentazione di Stokes v = 2r²(ρ_p − ρ_f)g/(9η), anche in centrifuga
     (g → ω²r, RCF);
   · CAPILLARITA': la legge di Jurin h = 2γ cos θ/(ρ g r) per acqua,
     mercurio, etanolo; la sovrapressione di Laplace in una goccia;
   · FLUSSO ATTORNO A UN OSTACOLO 3D (v238): il flusso potenziale attorno a
     una sfera o a un cilindro con circolazione, particelle traccianti e
     pressione di Bernoulli a colori, portanza di Kutta-Žukovskij.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, g = 9.80665;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  function venturi(r1, r2, v1, rho, p1) { var A1 = Math.PI * r1 * r1, A2 = Math.PI * r2 * r2, v2 = v1 * A1 / A2, p2 = p1 + 0.5 * rho * (v1 * v1 - v2 * v2); return { A1: A1, A2: A2, v2: v2, p2: p2, Q: A1 * v1, dp: p1 - p2, dh: (p1 - p2) / (rho * g) }; }
  function poiseuille(R, L, dp, eta) { return { Q: Math.PI * Math.pow(R, 4) * dp / (8 * eta * L), vmax: dp * R * R / (4 * eta * L), vmedia: dp * R * R / (8 * eta * L) }; }
  function reynolds(rho, v, D, eta) { return rho * v * D / eta; }
  function stokes(r, rhop, rhof, eta, acc) { return 2 * r * r * (rhop - rhof) * (acc || g) / (9 * eta); }
  function jurin(gamma, theta, rho, r) { return 2 * gamma * Math.cos(theta * Math.PI / 180) / (rho * g * r); }
  var LIQUIDI = { acqua: [['acqua (vetro pulito)', 'water (clean glass)'], 0.0728, 0, 998], mercurio: [['mercurio', 'mercury'], 0.485, 140, 13534], etanolo: [['etanolo', 'ethanol'], 0.0223, 0, 789], glicerina: [['glicerina', 'glycerol'], 0.0634, 20, 1261] };
  /* v238 — il flusso potenziale (fluido ideale: incomprimibile, senza viscosita', irrotazionale)
     attorno a un ostacolo di raggio a, con la corrente U lungo x lontano.
     · sfera: φ = U x (1 + a³/2r³)  →  v = U[(1 + a³/2r³) x̂ − (3a³x/2r⁵) r];
     · cilindro con l'asse lungo z e circolazione Γ (positiva in senso antiorario):
       potenziale complesso w = U(ζ + a²/ζ) − iΓ ln ζ/(2π), v_x − i v_y = dw/dζ, ζ = x + iy.
     La pressione viene da Bernoulli: p − p∞ = ½ρ(U² − |v|²), il coefficiente C_p = 1 − |v|²/U². */
  function flussoPotenziale(tipo, a, U, G) {
    G = G || 0;
    function v(x, y, z) {
      if (tipo === 'sfera') { var r2 = x * x + y * y + z * z, r = Math.sqrt(r2), a3 = a * a * a, k = 1 + a3 / (2 * r2 * r), q = 3 * a3 * x / (2 * r2 * r2 * r); return [U * (k - q * x), -U * q * y, -U * q * z]; }
      var d = x * x + y * y, re = 1 - a * a * (x * x - y * y) / (d * d), im = a * a * 2 * x * y / (d * d);
      /* dw/dζ = U(1 − a²/ζ²) − iΓ/(2πζ);  1/ζ² = (x² − y² − 2ixy)/d²,  1/ζ = (x − iy)/d */
      var wr = U * re - G / (2 * Math.PI) * y / d, wi = U * im - G / (2 * Math.PI) * x / d;
      return [wr, -wi, 0];
    }
    function cp(x, y, z) { var w = v(x, y, z); return 1 - (w[0] * w[0] + w[1] * w[1] + w[2] * w[2]) / (U * U); }
    function dentro(x, y, z) { return tipo === 'sfera' ? x * x + y * y + z * z < a * a : x * x + y * y < a * a; }
    return { v: v, cp: cp, dentro: dentro, tipo: tipo, a: a, U: U, G: G };
  }
  /* pressione con Bernoulli fra due punti della stessa linea di corrente */
  function bernoulli(p1, rho, v1, v2) { return p1 + 0.5 * rho * (v1 * v1 - v2 * v2); }
  F.calcolo.fluidi = { venturi: venturi, poiseuille: poiseuille, reynolds: reynolds, stokes: stokes, jurin: jurin, LIQUIDI: LIQUIDI, flussoPotenziale: flussoPotenziale, bernoulli: bernoulli };

  /* ═══ 1. Venturi ════════════════════════════════════════════════════════ */
  function schedaVenturi(div) {
    var G = griglia(div), st = { r1: 2, r2: 1, v1: 1 }, info = nota(G.pan), parti = [];
    F.cursore(G.pan, ['raggio del tubo (cm)', 'pipe radius (cm)'], 1, 4, 0.1, st.r1, function (v) { st.r1 = v; if (st.r2 > v) st.r2 = v; calcola(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['raggio della strozzatura (cm)', 'throat radius (cm)'], 0.3, 4, 0.1, st.r2, function (v) { st.r2 = Math.min(v, st.r1); calcola(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['velocità d’ingresso (m/s)', 'inlet speed (m/s)'], 0.2, 3, 0.1, st.v1, function (v) { st.v1 = v; calcola(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.5), R;
    function calcola() {
      R = venturi(st.r1 / 100, st.r2 / 100, st.v1, 998, 120000);
      info.innerHTML = t('Continuità ', 'Continuity ') + 'A₁v₁ = A₂v₂ → v₂ = v₁(r₁/r₂)² = <b class="bsiFX-num">' + fmt(R.v2) + ' m/s</b><br>Bernoulli: p₁ − p₂ = ½ρ(v₂² − v₁²) = <b class="bsiFX-num">' + fmt(R.dp) + ' Pa</b> → ' + t('dislivello nei manometri ', 'manometer difference ') + fmt(R.dh * 100) + ' cm<br>' + t('Portata ', 'Flow rate ') + 'Q = ' + fmt(R.Q * 1000) + ' L/s · Re = ' + fmt(reynolds(998, R.v2, 2 * st.r2 / 100, 1.0e-3)) + t(' nella strozzatura (acqua)', ' in the throat (water)') + '<br>' + t('Dove il fluido accelera la pressione cala: è il principio della trompa ad acqua che fa il vuoto nella filtrazione su Büchner, e del nebulizzatore.', 'Where the fluid speeds up, pressure drops: the principle of the water aspirator that makes the vacuum for Büchner filtration, and of the nebuliser.') + (R.p2 < 2339 ? '<br>⚠ ' + t('La pressione nella strozzatura scenderebbe sotto la tensione di vapore dell’acqua: cavitazione.', 'Pressure in the throat would fall below the vapour pressure of water: cavitation.') : '');
    }
    calcola();
    for (var i = 0; i < 90; i++) parti.push([Math.random(), Math.random() * 2 - 1]);
    F.anima(cv, function (dt) {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cy = H * 0.55, sc = H * 0.32 / 4;
      function raggio(x) { /* sezione: tubo, raccordo, strozzatura, raccordo, tubo */ var u = x / W; var f = u < 0.3 ? 0 : u < 0.42 ? (u - 0.3) / 0.12 : u < 0.58 ? 1 : u < 0.7 ? 1 - (u - 0.58) / 0.12 : 0; f = f * f * (3 - 2 * f); return (st.r1 + (st.r2 - st.r1) * f) * sc; }
      q.fillStyle = 'rgba(107,207,255,.12)'; q.beginPath(); q.moveTo(0, cy - raggio(0)); for (var x = 0; x <= W; x += 4) q.lineTo(x, cy - raggio(x)); for (x = W; x >= 0; x -= 4) q.lineTo(x, cy + raggio(x)); q.closePath(); q.fill();
      q.strokeStyle = '#6bcfff'; q.lineWidth = 2; [-1, 1].forEach(function (s) { q.beginPath(); for (var x = 0; x <= W; x += 4) { if (x) q.lineTo(x, cy + s * raggio(x)); else q.moveTo(x, cy + s * raggio(x)); } q.stroke(); }); q.lineWidth = 1;
      /* particelle: velocita' locale ∝ 1/r² */
      parti.forEach(function (p) { var x = p[0] * W, r = raggio(x), v = st.v1 * Math.pow(st.r1 * sc / r, 2); p[0] += v * dt * 0.12; if (p[0] > 1) { p[0] -= 1; p[1] = Math.random() * 2 - 1; } var xx = p[0] * W, rr = raggio(xx); q.fillStyle = '#5eead4'; q.beginPath(); q.arc(xx, cy + p[1] * rr * 0.85, 2.4, 0, Math.PI * 2); q.fill(); });
      /* manometri */
      [[0.15, 120000], [0.5, R.p2], [0.85, 120000]].forEach(function (m) { var x = m[0] * W, top = cy - raggio(x), hcol = Math.max(4, (m[1] - 100000) / 20000 * H * 0.5); q.strokeStyle = '#8494a8'; q.strokeRect(x - 6, top - H * 0.5, 12, H * 0.5); q.fillStyle = 'rgba(107,207,255,.7)'; q.fillRect(x - 5, top - Math.min(H * 0.5, hcol), 10, Math.min(H * 0.5, hcol)); });
      cv.setAttribute('aria-label', t('tubo di Venturi con le particelle del fluido', 'Venturi tube with fluid particles'));
    });
  }

  /* ═══ 2. viscosita' ═════════════════════════════════════════════════════ */
  function schedaViscosita(div) {
    var G = griglia(div), st = { R: 0.5, dp: 100, eta: 1, r: 2, rho: 1050, rcf: 1 }, info = nota(G.pan), info2 = F.el('div', { 'class': 'bsiFX-nota' }), fase = 0;
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>Poiseuille</b>' }));
    F.cursore(G.pan, ['raggio del capillare (mm)', 'capillary radius (mm)'], 0.1, 2, 0.05, st.R, function (v) { st.R = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['Δp (Pa) su 10 cm', 'Δp (Pa) over 10 cm'], 10, 1000, 10, st.dp, function (v) { st.dp = v; calcola(); });
    F.cursore(G.pan, ['viscosità η (mPa·s; acqua 1, glicerina 1412)', 'viscosity η (mPa·s; water 1, glycerol 1412)'], 0.3, 1500, 0.1, st.eta, function (v) { st.eta = v; calcola(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Sedimentazione di Stokes', 'Stokes sedimentation') + '</b>' }));
    F.cursore(G.pan, ['raggio della particella (μm)', 'particle radius (μm)'], 0.1, 50, 0.1, st.r, function (v) { st.r = v; calcola(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['densità della particella (kg/m³)', 'particle density (kg/m³)'], 1010, 3000, 10, st.rho, function (v) { st.rho = v; calcola(); });
    F.cursore(G.pan, ['centrifuga: RCF (× g)', 'centrifuge: RCF (× g)'], 1, 20000, 1, st.rcf, function (v) { st.rcf = v; calcola(); });
    G.pan.appendChild(info2);
    var cv = F.tela(G.dx, 0.6), Pz;
    function calcola() {
      var R = st.R / 1000, eta = st.eta / 1000; Pz = poiseuille(R, 0.1, st.dp, eta);
      var Re = reynolds(998, Pz.vmedia, 2 * R, eta);
      info.innerHTML = 'Q = πR⁴Δp/(8ηL) = <b class="bsiFX-num">' + fmt(Pz.Q * 1e9) + ' μL/s</b> · v_max = ' + fmt(Pz.vmax * 1000) + ' mm/s (' + t('al centro, doppia della media', 'at the centre, twice the mean') + ')<br>Re = ρvD/η = <b>' + fmt(Re) + '</b> → ' + (Re < 2000 ? t('laminare', 'laminar') : Re < 4000 ? t('di transizione', 'transitional') : t('turbolento: Poiseuille non vale più', 'turbulent: Poiseuille no longer holds')) + '<br>' + t('Dimezzando il raggio la portata cala di 16 volte (R⁴): è per questo che una pipetta con la punta stretta o un vaso sanguigno ristretto cambiano tanto il flusso.', 'Halving the radius cuts the flow 16 times (R⁴): that is why a narrow pipette tip or a narrowed blood vessel change the flow so much.');
      var vs = stokes(st.r * 1e-6, st.rho, 998, 1.0e-3, g * st.rcf), Rep = reynolds(998, vs, 2 * st.r * 1e-6, 1e-3);
      info2.innerHTML = 'v = 2r²(ρ_p − ρ_f)·a/(9η) = <b class="bsiFX-num">' + (vs > 1e-3 ? fmt(vs * 1000) + ' mm/s' : fmt(vs * 1e6) + ' μm/s') + '</b> (a = ' + st.rcf + ' g)<br>' + t('per scendere di 1 cm: ', 'to fall 1 cm: ') + '<b>' + (0.01 / vs > 3600 ? fmt(0.01 / vs / 3600) + ' h' : fmt(0.01 / vs) + ' s') + '</b>' + (Rep > 1 ? ' · ⚠ Re = ' + fmt(Rep) + t(': fuori dal regime di Stokes (serve Re < 1)', ': outside the Stokes regime (Re < 1 needed)') : '') + '<br>' + t('Per questo i globuli rossi (r ≈ 4 μm) sedimentano in ore a 1 g e in minuti in centrifuga, e le proteine solo in ultracentrifuga (> 100 000 g).', 'That is why red cells (r ≈ 4 μm) settle in hours at 1 g and minutes in a centrifuge, and proteins only in an ultracentrifuge (> 100,000 g).');
    }
    calcola();
    F.anima(cv, function (dt) {
      fase += dt;
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cy = H / 2, Rp = H * 0.38, x0 = 30;
      q.strokeStyle = '#6bcfff'; q.lineWidth = 2; q.beginPath(); q.moveTo(x0, cy - Rp); q.lineTo(W - 10, cy - Rp); q.moveTo(x0, cy + Rp); q.lineTo(W - 10, cy + Rp); q.stroke(); q.lineWidth = 1;
      /* il profilo parabolico, disegnato come fronte che avanza e si ricompone */
      var vmax = W * 0.35, avanz = (fase * 0.6) % 1;
      q.strokeStyle = '#5eead4'; q.lineWidth = 2.2; q.beginPath();
      for (var i = -40; i <= 40; i++) { var r = i / 40, x = x0 + 20 + vmax * (1 - r * r) * avanz * 1.8, y = cy + r * Rp; if (i === -40) q.moveTo(x, y); else q.lineTo(x, y); } q.stroke(); q.lineWidth = 1;
      q.strokeStyle = 'rgba(255,210,74,.7)'; for (i = -8; i <= 8; i++) { var rr = i / 8, len = vmax * 0.45 * (1 - rr * rr), y2 = cy + rr * Rp * 0.95; if (len < 3) continue; q.beginPath(); q.moveTo(x0 + 20, y2); q.lineTo(x0 + 20 + len, y2); q.lineTo(x0 + 14 + len, y2 - 3); q.moveTo(x0 + 20 + len, y2); q.lineTo(x0 + 14 + len, y2 + 3); q.stroke(); }
      q.fillStyle = '#9fb1c6'; q.font = '12px system-ui'; q.fillText('v(r) = Δp(R² − r²)/(4ηL)', W - 190, 16);
      cv.setAttribute('aria-label', t('profilo di velocità parabolico di Poiseuille', 'Poiseuille parabolic velocity profile'));
    });
  }

  /* ═══ 3. capillarita' ═══════════════════════════════════════════════════ */
  function schedaCapillarita(div) {
    var G = griglia(div), st = { l: 'acqua', r: 0.5 }, info = nota(G.pan);
    F.scelta(G.pan, ['Liquido', 'Liquid'], Object.keys(LIQUIDI).map(function (k) { return [k, F.tt(LIQUIDI[k][0])]; }), st.l, function (v) { st.l = v; disegna(); });
    F.cursore(G.pan, ['raggio del capillare (mm)', 'capillary radius (mm)'], 0.05, 3, 0.05, st.r, function (v) { st.r = v; disegna(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6);
    function disegna() {
      var L = LIQUIDI[st.l], hh = jurin(L[1], L[2], L[3], st.r / 1000);
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, lv = H * 0.65, sc = H * 0.5 / 0.06; /* 6 cm a meta' altezza */
      q.fillStyle = st.l === 'mercurio' ? 'rgba(200,205,215,.8)' : 'rgba(107,207,255,.35)'; q.fillRect(20, lv, W - 40, H - lv - 10);
      [0.25, 0.5, 1, 2].forEach(function (rmm, k) {
        var x = 60 + k * (W - 120) / 3, hcol = jurin(L[1], L[2], L[3], rmm / 1000), w = Math.max(3, rmm * 10);
        q.strokeStyle = '#c9d3df'; q.strokeRect(x - w / 2, 10, w, H - 20 - 10);
        var top = lv - Math.max(-lv + 12, Math.min(lv - 12, hcol * sc));
        q.fillStyle = st.l === 'mercurio' ? 'rgba(200,205,215,.9)' : 'rgba(107,207,255,.75)'; q.fillRect(x - w / 2 + 1, Math.min(top, lv), w - 2, H - 10 - Math.min(top, lv));
        q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.textAlign = 'center'; q.fillText(rmm + ' mm', x, H - 2); q.fillText((hcol * 1000).toFixed(1) + ' mm', x, Math.min(top, lv) - 4);
      });
      q.textAlign = 'left';
      cv.setAttribute('aria-label', t('risalita capillare in tubi di raggio diverso', 'capillary rise in tubes of different radius'));
      info.innerHTML = t('Legge di Jurin ', 'Jurin’s law ') + 'h = 2γ cos θ/(ρ g r) = <b class="bsiFX-num">' + fmt(hh * 1000) + ' mm</b> (γ = ' + L[1] * 1000 + ' mN/m, θ = ' + L[2] + '°)<br>' + (hh < 0 ? t('Il mercurio non bagna il vetro (θ > 90°): nel capillare SCENDE e il menisco è convesso.', 'Mercury does not wet glass (θ > 90°): in the capillary it goes DOWN and the meniscus is convex.') : t('Più il tubo è stretto più il liquido sale (h ∝ 1/r): è così che la fase mobile risale la lastrina della TLC e la carta da filtro si imbeve.', 'The narrower the tube the higher the liquid rises (h ∝ 1/r): this is how the mobile phase climbs a TLC plate and filter paper soaks up.')) + '<br>' + t('Sovrapressione in una goccia di raggio r (Laplace) ', 'Excess pressure in a drop of radius r (Laplace) ') + 'Δp = 2γ/r = ' + fmt(2 * L[1] / (st.r / 1000)) + ' Pa';
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

  /* ═══ 4. flusso attorno a un ostacolo in 3D (v238) ═════════════════════ */
  var FLUIDI3 = { acqua: [['acqua (20 °C)', 'water (20 °C)'], 998, 1.0e-3], aria: [['aria (20 °C)', 'air (20 °C)'], 1.204, 1.81e-5] };
  function cpColore(cp, cpMin) {
    /* rosso dove la pressione cala (veloce), grigio chiaro a p∞, blu dove sale (ristagno);
       la radice quadrata allarga le differenze piccole, che sono la maggior parte del campo */
    if (cp < 0) { var u = Math.sqrt(Math.min(1, cp / cpMin)); return [0.78 + 0.22 * u, 0.8 - 0.55 * u, 0.82 - 0.62 * u]; }
    var w = Math.sqrt(Math.min(1, cp)); return [0.78 - 0.66 * w, 0.8 - 0.35 * w, 0.82 + 0.18 * w];
  }
  function schedaFlusso3D(pan) {
    var st = { tipo: 'sfera', U: 2, a: 5, fl: 'acqua', k: 0 }, cb = {};
    F.scelta(pan, ['Ostacolo', 'Obstacle'], [['sfera', t('sfera', 'sphere')], ['cilindro', t('cilindro (con circolazione Γ)', 'cylinder (with circulation Γ)')]], st.tipo, function (v) { st.tipo = v; nuovo(); });
    F.scelta(pan, ['Fluido', 'Fluid'], Object.keys(FLUIDI3).map(function (k) { return [k, FLUIDI3[k][0]]; }), st.fl, function (v) { st.fl = v; nuovo(); });
    F.cursore(pan, ['velocità della corrente U (m/s)', 'stream speed U (m/s)'], 0.1, 10, 0.1, st.U, function (v) { st.U = v; nuovo(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['raggio dell’ostacolo a (cm)', 'obstacle radius a (cm)'], 0.5, 50, 0.5, st.a, function (v) { st.a = v; nuovo(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['circolazione Γ/(4πUa) (solo cilindro)', 'circulation Γ/(4πUa) (cylinder only)'], 0, 1.5, 0.05, st.k, function (v) { st.k = v; nuovo(); }, function (v) { return v.toFixed(2); });
    var info = nota(pan), spiega = nota(pan);
    spiega.innerHTML = t('Flusso potenziale: il fluido ideale (senza viscosità, incomprimibile) aggira l’ostacolo. Le particelle traccianti seguono la velocità locale e sono colorate con la pressione data da Bernoulli, p − p∞ = ½ρ(U² − v²): blu dove il fluido rallenta (punto di ristagno davanti, p massima), rosso dove accelera ai fianchi (p minima). Lo stesso colore sull’ostacolo. Le linee bianche sono linee di corrente integrate con Runge-Kutta 4. Con la circolazione Γ il cilindro è come una palla con l’effetto: la velocità diventa diversa sopra e sotto, i punti di ristagno si spostano e nasce la portanza di Kutta-Žukovskij ρUΓ per metro (freccia rosa, effetto Magnus).',
      'Potential flow: the ideal fluid (inviscid, incompressible) goes round the obstacle. Tracer particles follow the local velocity and are coloured by the pressure from Bernoulli, p − p∞ = ½ρ(U² − v²): blue where the fluid slows down (stagnation point in front, highest p), red where it speeds up on the sides (lowest p). The obstacle has the same colours. White lines are streamlines integrated with fourth-order Runge-Kutta. With circulation Γ the cylinder is like a spinning ball: the speed differs above and below, the stagnation points move and the Kutta-Joukowski lift ρUΓ per metre appears (pink arrow, Magnus effect).');
    function nuovo() {
      var f = FLUIDI3[st.fl], a = st.a / 100, rho = f[1], q = 0.5 * rho * st.U * st.U, Re = reynolds(rho, st.U, 2 * a, f[2]), sfera = st.tipo === 'sfera';
      var vmax = sfera ? 1.5 : 2 + 2 * st.k, cpmin = 1 - vmax * vmax, G = st.k * 4 * Math.PI * st.U * a;
      info.innerHTML = t('Pressione dinamica ', 'Dynamic pressure ') + '½ρU² = <b class="bsiFX-num">' + fmt(q) + ' Pa</b> · Re = ρU(2a)/η = <b class="bsiFX-num">' + fmt(Re) + '</b><br>' +
        t('Velocità massima sulla superficie ', 'Maximum speed on the surface ') + '<b>' + fmt(vmax) + ' U</b> = ' + fmt(vmax * st.U) + ' m/s · C_p,min = <b>' + fmt(cpmin) + '</b> → p − p∞ = ' + fmt(cpmin * q) + ' Pa<br>' +
        (sfera ? t('Sfera: ristagno davanti e dietro (C_p = 1, p − p∞ = ', 'Sphere: stagnation front and back (C_p = 1, p − p∞ = ') + fmt(q) + ' Pa); ' + t('sull’equatore v = 3U/2.', 'on the equator v = 3U/2.') :
          'Γ = ' + fmt(G) + ' m²/s · ' + t('portanza ', 'lift ') + 'ρUΓ = <b class="bsiFX-num">' + fmt(rho * st.U * G) + ' N/m</b><br>' + (st.k <= 1 ? t('Punti di ristagno sulla superficie a sin θ = Γ/(4πUa) = ', 'Stagnation points on the surface at sin θ = Γ/(4πUa) = ') + fmt(st.k) + ' (θ = ' + fmt(Math.asin(st.k) * 180 / Math.PI) + '° ' + t('e', 'and') + ' ' + fmt(180 - Math.asin(st.k) * 180 / Math.PI) + '°)' : t('Con Γ > 4πUa il punto di ristagno si stacca dalla superficie e il fluido vicino al cilindro gira tutto attorno.', 'With Γ > 4πUa the stagnation point leaves the surface and the fluid near the cylinder circulates all round.'))) +
        '<br>' + t('Paradosso di d’Alembert: nel fluido ideale la resistenza è zero. Il fluido vero con Re = ', 'D’Alembert’s paradox: in the ideal fluid the drag is zero. The real fluid at Re = ') + fmt(Re) + (Re > (sfera ? 20 : 5) ? t(' stacca lo strato limite dietro l’ostacolo e forma una scia: il flusso potenziale vale davanti e ai fianchi.', ' separates the boundary layer behind the obstacle and forms a wake: potential flow holds in front and at the sides.') : t(' è dominato dalla viscosità (flusso di Stokes): il flusso potenziale qui è solo un limite ideale.', ' is dominated by viscosity (Stokes flow): potential flow here is only an ideal limit.'));
      if (cb.nuovo) cb.nuovo();
    }
    nuovo();
    return {
      etichetta: ['Flusso potenziale 3D attorno a una sfera o a un cilindro, con particelle traccianti colorate dalla pressione', '3D potential flow around a sphere or a cylinder, with tracer particles coloured by pressure'],
      tre: function (S, T, L3) {
        var NP = 900, px = new Float32Array(NP * 3), pc = new Float32Array(NP * 3), eta = new Float32Array(NP), gp = new T.BufferGeometry();
        gp.setAttribute('position', new T.BufferAttribute(px, 3)); gp.setAttribute('color', new T.BufferAttribute(pc, 3));
        var nube = new T.Points(gp, new T.PointsMaterial({ size: 0.12, vertexColors: true })); S.aggiungi(nube);
        var gr = new T.Group(); S.aggiungi(gr);
        S.aggiungi(new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(10, 6, 4)), new T.LineBasicMaterial({ color: 0x34465f })));
        var M, cpMin;
        function nasce(i, ovunque) {
          for (var k = 0; k < 20; k++) { var x = ovunque ? -5 + 10 * Math.random() : -5, y = -2.9 + 5.8 * Math.random(), z = -1.9 + 3.8 * Math.random(); if (!M.dentro(x, y, z) && (M.tipo === 'sfera' || x * x + y * y > 1.1)) { px[3 * i] = x; px[3 * i + 1] = y; px[3 * i + 2] = z; eta[i] = 0; return; } }
        }
        function colora(i) { var c = cpColore(M.cp(px[3 * i], px[3 * i + 1], px[3 * i + 2]), cpMin); pc[3 * i] = c[0]; pc[3 * i + 1] = c[1]; pc[3 * i + 2] = c[2]; }
        function rk4(p, h) {
          var f = function (q) { return M.v(q[0], q[1], q[2]); }, k1 = f(p), k2 = f([p[0] + h / 2 * k1[0], p[1] + h / 2 * k1[1], p[2] + h / 2 * k1[2]]), k3 = f([p[0] + h / 2 * k2[0], p[1] + h / 2 * k2[1], p[2] + h / 2 * k2[2]]), k4 = f([p[0] + h * k3[0], p[1] + h * k3[1], p[2] + h * k3[2]]);
          return [p[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), p[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), p[2] + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
        }
        cb.nuovo = function () {
          var sfera = st.tipo === 'sfera';
          M = flussoPotenziale(sfera ? 'sfera' : 'cilindro', 1, 1, sfera ? 0 : st.k * 4 * Math.PI); cpMin = sfera ? -1.25 : 1 - Math.pow(2 + 2 * st.k, 2);
          svuota(gr);
          var geo = sfera ? new T.SphereGeometry(1, 72, 48) : new T.CylinderGeometry(1, 1, 4, 96, 8, true), pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
          for (var i = 0; i < pos.count; i++) { var x = pos.getX(i), y = sfera ? pos.getY(i) : -pos.getZ(i), z = sfera ? pos.getZ(i) : 0, c = cpColore(M.cp(x * 1.0005 + 1e-9, y * 1.0005, z * 1.0005), cpMin); col[3 * i] = c[0]; col[3 * i + 1] = c[1]; col[3 * i + 2] = c[2]; }
          geo.setAttribute('color', new T.BufferAttribute(col, 3));
          var ost = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.05, side: T.DoubleSide })); if (!sfera) ost.rotation.x = Math.PI / 2; gr.add(ost);
          /* linee di corrente */
          var semi = [];
          if (sfera) [0.2, 0.55, 0.95, 1.5].forEach(function (r, j) { for (var k = 0; k < 6; k++) { var f = Math.PI * k / 3 + j * 0.4; semi.push([-5, r * Math.cos(f), r * Math.sin(f)]); } });
          else for (var y0 = -2.6; y0 <= 2.61; y0 += 0.4) [-1.2, 1.2].forEach(function (z0) { semi.push([-5, y0, z0]); });
          semi.forEach(function (p0) { var p = p0, pts = [p]; for (var k = 0; k < 900 && p[0] < 5 && Math.abs(p[1]) < 3.2; k++) { p = rk4(p, 0.03); pts.push(p); } if (pts.length > 2) gr.add(L3.linea(T, pts, 0xe6fffb, 0.35)); });
          if (!sfera && st.k > 0) {
            var arco = []; for (var k = 0; k <= 40; k++) { var f = 0.3 + 1.6 * Math.PI * k / 40; arco.push([1.35 * Math.cos(f), 1.35 * Math.sin(f), 2.15]); } gr.add(L3.linea(T, arco, 0xffd24a));
            gr.add(L3.freccia(T, arco[38], arco[40], 0xffd24a, 0.25)); var eg = L3.testo3d(T, 'Γ', '#ffd24a', 0.45); eg.position.set(1.6, 1.0, 2.4); gr.add(eg);
            var Lp = 0.6 + 1.6 * Math.min(1.5, st.k); gr.add(L3.freccia(T, [0, 0, 2.6], [0, -Lp, 2.6], 0xff8ad8, 0.3)); var el = L3.testo3d(T, t('portanza', 'lift'), '#ff8ad8', 0.32); el.position.set(0.3, -Lp - 0.3, 2.9); gr.add(el);
          }
          var eu = L3.testo3d(T, 'U →', '#9fdcff', 0.4); eu.position.set(-4.6, 0, 2.4); gr.add(eu);
          for (i = 0; i < NP; i++) { nasce(i, true); colora(i); }
          gp.attributes.position.needsUpdate = true; gp.attributes.color.needsUpdate = true;
          S.didascalia.textContent = (sfera ? t('Sfera', 'Sphere') : t('Cilindro', 'Cylinder') + ' · Γ/(4πUa) = ' + st.k.toFixed(2)) + ' · ' + t('blu: pressione alta · rosso: bassa', 'blue: high pressure · red: low');
          S.sporca = true; S.avvia();
        };
        cb.nuovo();
        S.ogniFotogramma(function (dt) {
          if (S.fermo) return false;
          var h = Math.min(0.05, dt) * 1.6;
          for (var i = 0; i < NP; i++) {
            var x = px[3 * i], y = px[3 * i + 1], z = px[3 * i + 2], w = M.v(x, y, z), xm = x + w[0] * h / 2, ym = y + w[1] * h / 2, zm = z + w[2] * h / 2, w2 = M.v(xm, ym, zm);
            x += w2[0] * h; y += w2[1] * h; z += w2[2] * h; eta[i] += dt;
            if (M.dentro(x, y, z)) { var r = M.tipo === 'sfera' ? Math.sqrt(x * x + y * y + z * z) : Math.sqrt(x * x + y * y), f = 1.002 / r; x *= f; y *= f; if (M.tipo === 'sfera') z *= f; }
            px[3 * i] = x; px[3 * i + 1] = y; px[3 * i + 2] = z;
            if (x > 5 || Math.abs(y) > 3.2 || eta[i] > 14 || !isFinite(x)) nasce(i, false);
            colora(i);
          }
          gp.attributes.position.needsUpdate = true; gp.attributes.color.needsUpdate = true;
          return true;
        });
        S.inquadra(14, -1.95, 1.08);
      }
    };
  }

  F.sezione('sfisfluidi', {
    titolo: ['🌊 Fluidi', '🌊 Fluids'],
    sotto: ['Continuità e Bernoulli nel tubo di Venturi, la viscosità con Poiseuille, Reynolds e la sedimentazione di Stokes anche in centrifuga, la capillarità con la legge di Jurin.', 'Continuity and Bernoulli in the Venturi tube, viscosity with Poiseuille, Reynolds and Stokes sedimentation including centrifuges, capillarity with Jurin’s law.'],
    schede: [
      { nome: ['🚿 Venturi e Bernoulli', '🚿 Venturi and Bernoulli'], costruisci: schedaVenturi },
      { nome: ['🍯 Viscosità', '🍯 Viscosity'], costruisci: schedaViscosita },
      { nome: ['🧪 Capillarità', '🧪 Capillarity'], costruisci: schedaCapillarita },
      { nome: ['🌀 Flusso attorno a un ostacolo 3D', '🌀 3D flow past an obstacle'], costruisci: scheda3D(schedaFlusso3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
