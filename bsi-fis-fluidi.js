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
     mercurio, etanolo; la sovrapressione di Laplace in una goccia.
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
  F.calcolo.fluidi = { venturi: venturi, poiseuille: poiseuille, reynolds: reynolds, stokes: stokes, jurin: jurin, LIQUIDI: LIQUIDI };

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

  F.sezione('sfisfluidi', {
    titolo: ['🌊 Fluidi', '🌊 Fluids'],
    sotto: ['Continuità e Bernoulli nel tubo di Venturi, la viscosità con Poiseuille, Reynolds e la sedimentazione di Stokes anche in centrifuga, la capillarità con la legge di Jurin.', 'Continuity and Bernoulli in the Venturi tube, viscosity with Poiseuille, Reynolds and Stokes sedimentation including centrifuges, capillarity with Jurin’s law.'],
    schede: [
      { nome: ['🚿 Venturi e Bernoulli', '🚿 Venturi and Bernoulli'], costruisci: schedaVenturi },
      { nome: ['🍯 Viscosità', '🍯 Viscosity'], costruisci: schedaViscosita },
      { nome: ['🧪 Capillarità', '🧪 Capillarity'], costruisci: schedaCapillarita }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
