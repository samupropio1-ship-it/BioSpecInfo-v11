/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-h2.js — 🎞️ 9 · «Due atomi. Una distanza perfetta: 74 picometri.» (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   LA FISICA
   · Potenziale di Morse per H₂, V(R) = D_e[1 − e^(−a(R − R_e))]² − D_e, con le
     costanti spettroscopiche misurate (CONST, fonti accanto). a = 2πcω_e √(μ/2D_e).
   · Moto classico ESATTO nel Morse: e^(a(R − R_e)) = (1 − ε cos φ)/(1 − ε²),
     ε = √(E/D_e), dφ/dt = ω √(1 − ε²): l'energia si conserva per costruzione.
     Rallentato di 2,5·10¹⁴ volte (un periodo vero di 7,6 fs dura 1,9 s).
   · La nuvola elettronica è |ψ|² del modello LCAO semplice ψ = 1s_A + 1s_B
     (ζ = 1, unità di bohr), campionata ESATTAMENTE: miscela di due 1s e
     accettazione (a + b)²/(2(a² + b²)) ≤ 1. Ogni punto ha i suoi numeri casuali
     fissi, così la nuvola si deforma con continuità al variare di R. Il ciano
     chiaro è la densità condivisa in più: la frazione 2ab/(a² + b²) del termine
     di interferenza. A R grande l'interferenza sparisce e restano due 1s sferiche.
   · «Tirare» e «avvicinare» sono guidati a mano (dichiarato); il ritorno
     all'equilibrio è accelerato. Se l'energia immessa supera D₀ = 4,48 eV il
     legame si rompe.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo, D = g.document;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var CONST = {
    De: 4.7472,          /* eV, profondità della buca (Huber e Herzberg 1979: D₀ 4,4781 eV + energia di punto zero) */
    Re: 0.74144,         /* Å, distanza di equilibrio (Huber e Herzberg 1979) */
    we: 4401.21,         /* cm⁻¹, numero d'onda armonico ω_e (Huber e Herzberg 1979) */
    mu: 0.503912,        /* u, massa ridotta di H₂ = m_H/2 (CODATA 2018) */
    D0mis: 4.4781,       /* eV, energia di dissociazione misurata */
    c: 299792458, u: 1.66053906660e-27, eV: 1.602176634e-19, bohr: 0.529177210903, kJmol: 96.4853, /* CODATA 2018 */
    rallenta: 2.5e14, zeta: 1.0
  };
  var w = 2 * PI * CONST.c * CONST.we * 100, A = w * Math.sqrt(CONST.mu * CONST.u / (2 * CONST.De * CONST.eV)) * 1e-10, HW = CONST.we * 1.239841984e-4;
  var E0 = HW / 2 - HW * HW / (4 * CONST.De) / 4, D0 = CONST.De - E0, NU = CONST.c * CONST.we * 100;
  function V(R) { var q = 1 - Math.exp(-A * (R - CONST.Re)); return CONST.De * q * q - CONST.De; }
  function Rdi(E, fi) { var e = Math.sqrt(Math.max(0, Math.min(0.999999, E / CONST.De))); return CONST.Re + Math.log((1 - e * Math.cos(fi)) / (1 - e * e)) / A; }
  function Omega(E) { var e = Math.sqrt(Math.max(0, Math.min(0.999999, E / CONST.De))); return w * Math.sqrt(1 - e * e); }

  /* la nuvola: numeri casuali fissi per punto */
  var N = 40000, SEME = null;
  function semi() {
    if (SEME) return SEME; var s = 12345; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var lato = new Int8Array(N), rr = new Float32Array(N), dir = new Float32Array(3 * N), acc = new Float32Array(N);
    for (var i = 0; i < N; i++) { lato[i] = r() < 0.5 ? -1 : 1; rr[i] = -(Math.log(r() + 1e-12) + Math.log(r() + 1e-12) + Math.log(r() + 1e-12)) / (2 * CONST.zeta); var cz = 2 * r() - 1, ph = 2 * PI * r(), sn = Math.sqrt(1 - cz * cz); dir[3 * i] = sn * Math.cos(ph); dir[3 * i + 1] = sn * Math.sin(ph); dir[3 * i + 2] = cz; acc[i] = r(); }
    return (SEME = { lato: lato, rr: rr, dir: dir, acc: acc });
  }
  /** riempie posizioni (Å) e colori per la distanza R (Å); restituisce quanti punti sono accettati */
  function nuvola(R, pos, col) {
    var S = semi(), Rb = R / CONST.bohr, z = CONST.zeta, k = 0;
    for (var i = 0; i < N; i++) {
      var cx = S.lato[i] * Rb / 2, x = cx + S.rr[i] * S.dir[3 * i], y = S.rr[i] * S.dir[3 * i + 1], zz = S.rr[i] * S.dir[3 * i + 2];
      var a = Math.exp(-z * Math.sqrt((x + Rb / 2) * (x + Rb / 2) + y * y + zz * zz)), b = Math.exp(-z * Math.sqrt((x - Rb / 2) * (x - Rb / 2) + y * y + zz * zz));
      if (S.acc[i] * 2 * (a * a + b * b) > (a + b) * (a + b)) continue;
      var q = 2 * a * b / (a * a + b * b + 1e-30);                     /* quota di interferenza: ciano chiaro dove è alta */
      pos[3 * k] = x * CONST.bohr; pos[3 * k + 1] = y * CONST.bohr; pos[3 * k + 2] = zz * CONST.bohr;
      col[3 * k] = 0.16 + 0.5 * q * q; col[3 * k + 1] = 0.45 + 0.5 * q; col[3 * k + 2] = 0.95; k++;
    }
    return k;
  }
  function num(x, d) { return x.toFixed(d == null ? 2 : d).replace('.', ',').replace('-', '−'); }

  C.registra('h2', {
    n: 9, etichetta: 'H₂', bagliore: 0.9,
    titolo: ['Due atomi. Una distanza perfetta: 74 picometri.', 'Two atoms. One perfect distance: 74 picometres.'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 10; if (ctx.didaEl) ctx.didaEl.style.top = '47%';
      var geo = new T.BufferGeometry(), pos = new Float32Array(3 * N), col = new Float32Array(3 * N);
      geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
      var punti = new T.Points(geo, new T.PointsMaterial({ size: 0.014, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending })); punti.name = 'nuvola-LCAO'; S.aggiungi(punti);
      var nucleo = new T.SphereGeometry(0.03, 16, 12), mat = new T.MeshBasicMaterial({ color: 0xffffff });
      var hA = new T.Mesh(nucleo, mat), hB = new T.Mesh(nucleo, mat); hA.name = hB.name = 'nucleo-H'; S.aggiungi(hA); S.aggiungi(hB);
      var eA = ctx.L3.testo3d(T, 'H', '#ffffff', 0.22), eB = ctx.L3.testo3d(T, 'H', '#ffffff', 0.22); S.aggiungi(eA); S.aggiungi(eB);
      /* lo stato del legame */
      var st = { fase: 'legato', E: E0, fi: 0, R: CONST.Re, rotto: false, v: 0, immessa: 0, mano: false };
      function reset() { st.fase = 'legato'; st.E = E0; st.fi = 0; st.R = CONST.Re; st.rotto = false; st.v = 0; st.immessa = 0; }
      /* trascinare un nucleo con il dito */
      var el = S.ren.domElement, giu = null;
      function aR(e) { var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * 2 - 1; var v0 = new T.Vector3(0, 0, 0).project(S.cam), v1 = new T.Vector3(1, 0, 0).project(S.cam); return Math.max(0.35, Math.min(4.0, 2 * Math.abs(px - v0.x) / Math.abs(v1.x - v0.x))); }
      el.addEventListener('pointerdown', function (e) { var r = el.getBoundingClientRect(), pA = hB.position.clone().project(S.cam), x = r.left + (pA.x + 1) / 2 * r.width, y = r.top + (1 - pA.y) / 2 * r.height; var pAa = hA.position.clone().project(S.cam), xa = r.left + (pAa.x + 1) / 2 * r.width; if (Math.min(Math.hypot(e.clientX - x, e.clientY - y), Math.abs(e.clientX - xa)) < 40) { giu = true; st.mano = true; e.stopImmediatePropagation(); } }, true);
      el.addEventListener('pointermove', function (e) { if (!giu) return; e.stopImmediatePropagation(); st.R = aR(e); st.fase = 'tirato'; var Ein = V(st.R) - (-CONST.De + E0); st.immessa = Math.max(0, Ein); if (st.immessa > D0) { st.rotto = true; st.fase = 'rotto'; } }, true);
      el.addEventListener('pointerup', function () { if (!giu) return; giu = false; st.mano = false; if (!st.rotto) { st.E = V(st.R) + CONST.De; st.fi = st.R >= CONST.Re ? PI : 0; st.fase = 'insieme'; } });
      function grafico() {
        var o = ctx.overlay(), q = o.q, W = o.w, H = o.h; q.clearRect(0, 0, W, H);
        /* il righello sotto la nuvola */
        var pA = hA.position.clone().project(S.cam), pB = hB.position.clone().project(S.cam), xa = (pA.x + 1) / 2 * W, xb = (pB.x + 1) / 2 * W, yr = (1 - pA.y) / 2 * H + H * 0.1;
        q.strokeStyle = 'rgba(169,191,214,.8)'; q.lineWidth = 1; q.beginPath(); q.moveTo(xa, yr); q.lineTo(xb, yr); q.moveTo(xa, yr - 5); q.lineTo(xa, yr + 5); q.moveTo(xb, yr - 5); q.lineTo(xb, yr + 5); q.stroke();
        q.fillStyle = '#e6f2ff'; q.font = '500 10px ui-monospace,Menlo,monospace'; q.textAlign = 'center'; q.fillText(Math.round(st.R * 100) + ' pm', (xa + xb) / 2, yr + 16);
        q.fillStyle = 'rgba(169,191,214,.75)'; q.font = '500 8px ui-monospace,Menlo,monospace';
        [t('NUVOLA DI LEGAME · MODELLO LCAO SEMPLICE (1s + 1s) · CIANO = DENSITÀ CONDIVISA IN PIÙ', 'BONDING CLOUD · SIMPLE LCAO MODEL (1s + 1s) · CYAN = EXTRA SHARED DENSITY'), t('VIBRAZIONE RALLENTATA 2,5 × 10¹⁴ VOLTE, DISEGNATA CLASSICAMENTE · ASSESTAMENTO ACCELERATO', 'VIBRATION SLOWED 2.5 × 10¹⁴ TIMES, DRAWN CLASSICALLY · SETTLING SPED UP'), t('TIRARE E AVVICINARE GUIDATI A MANO', 'PULL AND APPROACH STEERED BY HAND')].forEach(function (s, i) { q.font = '500 8px ui-monospace,Menlo,monospace'; var lw = q.measureText(s).width, fz = Math.min(8, 8 * W * 0.92 / lw); q.font = '500 ' + fz.toFixed(1) + 'px ui-monospace,Menlo,monospace'; q.fillText(s, W * 0.5, yr + 30 + i * 10); });   /* le note si restringono per stare nella larghezza */
        /* la curva di Morse in un pannello */
        var gx = W * 0.07, gw = W * 0.75, gy = H * 0.6, gh = H * 0.23, R0 = 0.5, R1 = 3.0, Emin = -5, Emax = 0.4;
        function X(R) { return gx + 28 + (R - R0) / (R1 - R0) * (gw - 36); } function Y(E) { return gy + 10 + (Emax - E) / (Emax - Emin) * (gh - 28); }
        q.fillStyle = 'rgba(8,14,30,.72)'; q.strokeStyle = 'rgba(120,150,200,.35)'; q.beginPath(); if (q.roundRect) q.roundRect(gx, gy, gw, gh, 12); else q.rect(gx, gy, gw, gh); q.fill(); q.stroke();
        q.setLineDash([3, 3]); q.strokeStyle = 'rgba(200,210,230,.5)'; q.beginPath(); q.moveTo(X(R0), Y(0)); q.lineTo(X(R1), Y(0)); q.moveTo(X(R0), Y(-D0)); q.lineTo(X(R1), Y(-D0)); q.stroke(); q.setLineDash([]);
        for (var i = 0; i < 200; i++) { var r1 = R0 + (R1 - R0) * i / 200, r2 = R0 + (R1 - R0) * (i + 1) / 200, e1 = V(r1), e2 = V(r2); if (e1 > Emax || e2 > Emax) continue; var f = i / 200; q.strokeStyle = 'hsl(' + (f < 0.12 ? 350 : f < 0.3 ? 280 : f < 0.55 ? 150 : 32) + ',85%,62%)'; q.lineWidth = 2; q.beginPath(); q.moveTo(X(r1), Y(e1)); q.lineTo(X(r2), Y(e2)); q.stroke(); }
        q.strokeStyle = '#5fe3d6'; q.beginPath(); q.moveTo(X(CONST.Re), Y(-CONST.De) - 4); q.lineTo(X(CONST.Re), Y(-CONST.De) + 10); q.stroke();
        var xr = X(Math.min(R1, st.R)), yv = Y(Math.min(Emax, V(st.R))), gl = q.createRadialGradient(xr, yv, 0, xr, yv, 12); gl.addColorStop(0, 'rgba(255,255,255,1)'); gl.addColorStop(1, 'rgba(95,227,214,0)'); q.fillStyle = gl; q.beginPath(); q.arc(xr, yv, 12, 0, 2 * PI); q.fill();
        q.fillStyle = 'rgba(169,191,214,.85)'; q.font = '500 8px ui-monospace,Menlo,monospace'; q.textAlign = 'left';
        q.fillText(t('ENERGIA (eV)', 'ENERGY (eV)'), gx + 6, gy + 10); q.fillText(t('0 eV · DUE ATOMI H LIBERI', '0 eV · TWO FREE H ATOMS'), X(1.25), Y(0) + 10); q.fillText(t('LIVELLO PIÙ BASSO −4,48 eV', 'LOWEST LEVEL −4.48 eV'), X(1.6), Y(-D0) - 4);
        q.fillText(t('DISTANZA FRA I NUCLEI (pm)', 'DISTANCE BETWEEN NUCLEI (pm)'), gx + gw * 0.38, gy + gh - 4); q.fillStyle = '#5fe3d6'; q.fillText('74 pm', X(CONST.Re) + 4, Y(-CONST.De) + 10);
        q.fillStyle = 'rgba(169,191,214,.6)'; q.textAlign = 'right'; q.fillText(t('CURVA: MORSE SUI DATI DI H₂', 'CURVE: MORSE FIT TO H₂ DATA'), gx + gw - 8, gy + 10); q.textAlign = 'left';
        [50, 100, 150, 200, 250, 300].forEach(function (p) { q.fillText(String(p), X(p / 100) - 6, gy + gh - 14); });
        q.strokeStyle = '#ffb44a'; q.beginPath(); q.moveTo(X(2.2), Y(-D0)); q.lineTo(X(2.2), Y(0)); q.stroke(); q.fillStyle = '#ffb44a'; q.fillText(t('4,48 eV PER ROMPERE', '4.48 eV TO BREAK'), X(2.2) + 4, Y(-D0 / 2));
      }
      function hud() {
        var Ecur = V(st.R);
        ctx.hud.innerHTML = 'H + H → H₂ · ' + t('CURVA DELL\'ENERGIA', 'ENERGY CURVE') + '<br><span class="gr">R = ' + num(st.R * 100, 1) + ' pm</span><br>' +
          t('ENERGIA ', 'ENERGY ') + num(Ecur, 2) + ' eV<br>' + t('MINIMO A ', 'LOWEST AT ') + num(CONST.Re * 100, 1) + ' pm, ' + num(-CONST.De, 2) + ' eV<br>' +
          t('PER ROMPERE ', 'TO BREAK ') + num(D0, 2) + ' eV (' + Math.round(D0 * CONST.kJmol) + ' kJ/mol)<br>' + t('VIBRA ', 'VIBRATES ') + num(NU / 1e14, 1) + ' × 10¹⁴ ' + t('volte al secondo', 'per second');
        var nomi = { legato: [t('Legato', 'Bonded'), t('VIBRA · RALLENTATO 2,5 × 10¹⁴×', 'VIBRATING · SLOWED 2.5 × 10¹⁴×')], tirato: [t('Tirati via', 'Pulled apart'), t('ENERGIA IMMESSA ', 'ENERGY PUT IN ') + num(st.immessa, 2) + ' eV'], insieme: [t('Si riavvicinano', 'Coming together'), t('ENERGIA IMMESSA ', 'ENERGY PUT IN ') + num(st.immessa, 2) + ' eV'], rotto: [t('Legame rotto', 'Bond broken'), t('DUE ATOMI H LIBERI · ↺ PER RICOMINCIARE', 'TWO FREE H ATOMS · ↺ TO RESTART')] }[st.fase];
        ctx.stato.innerHTML = nomi[0] + '<small>' + nomi[1] + '</small>';
      }
      var ultimoR = -1;
      function disegna() {
        hA.position.set(-st.R / 2, 0, 0); hB.position.set(st.R / 2, 0, 0); eA.position.set(-st.R / 2, -0.05, 0.22); eB.position.set(st.R / 2, -0.05, 0.22);
        if (Math.abs(st.R - ultimoR) > 1e-4) { var k = nuvola(st.R, pos, col); geo.setDrawRange(0, k); geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; ultimoR = st.R; }
        hud(); grafico();
      }
      var ultimaFase = '';
      function passo(dt, tt, stato, cinem) {
        if (st.rotto) { st.R = Math.min(6, st.R + dt * 0.8); disegna(); return; }
        if (st.mano) { disegna(); return; }
        if (cinem) {
          /* il ciclo cinematico: legato (0–3,5 s) → tirato a 103 pm (3,5–6) → si riavvicinano (6–8) → legato, assestamento accelerato (8–10) */
          var f = tt < 3.5 ? 'legato' : tt < 6 ? 'tirato' : tt < 8 ? 'insieme' : 'assesta';
          if (f !== ultimaFase) { if (f === 'legato') { st.E = E0; st.immessa = 0; } if (f === 'insieme') { st.E = V(st.R) + CONST.De; st.fi = PI; } ultimaFase = f; }
          if (f === 'tirato') { var s = Math.min(1, (tt - 3.5) / 2), Rp = 1.03; st.R = st.R + (Rp - st.R) * Math.min(1, dt * 3) * (0.3 + s); st.fase = 'tirato'; st.immessa = Math.max(0, V(st.R) + CONST.De - E0); disegna(); return; }
          if (f === 'assesta') { st.E = E0 + (st.E - E0) * Math.exp(-dt * 2.2); st.fase = 'legato'; st.immessa = Math.max(0, st.E - E0); }
          else st.fase = f === 'insieme' ? 'insieme' : 'legato';
        }
        st.fi += Omega(st.E) / CONST.rallenta * dt; st.R = Rdi(st.E, st.fi); disegna();
      }
      S.inquadra(3.2, -PI / 2, PI / 2);
      reset(); disegna();
      return {
        durata: dur, passo: passo, reset: function () { reset(); ultimaFase = ''; disegna(); },
        timeline: [
          { t: 0, cam: { pos: [0, -9.5, 0.6], target: [0, 0, -1.55], fov: 40 }, didascalia: t('Due atomi. Una distanza perfetta: <em>74 picometri.</em>', 'Two atoms. One perfect distance: <em>74 picometres.</em>') },
          { t: 3.5, cam: { pos: [1.4, -9.2, 1.4], target: [0, 0, -1.55], fov: 40 }, didascalia: t('Per questo l\'idrogeno gassoso è H₂.', 'This is why hydrogen gas is H₂.') },
          { t: 6, cam: { pos: [0.8, -9.6, 0.9], target: [0, 0, -1.55], fov: 40 }, didascalia: t('Tira più forte e a 4,5 eV si rompe.', 'Pull harder and it breaks at 4.5 eV.') },
          { t: 10, cam: { pos: [0, -9.5, 0.6], target: [0, 0, -1.55], fov: 40 }, didascalia: '' }
        ],
        conti: function () { return { a: A, E0: E0, D0: D0, nu: NU, R: st.R, V: V(st.R), fase: st.fase, rotto: st.rotto }; },
        nuvola: nuvola, V: V, Rdi: Rdi, Omega: Omega
      };
    },
    fallback2d: function (cv) { var q = cv.getContext('2d'); cv.width = cv.clientWidth; cv.height = cv.clientHeight; q.fillStyle = '#fff'; q.font = 'italic 20px Georgia,serif'; q.fillText(t('Senza WebGL: la curva di Morse di H₂', 'Without WebGL: the Morse curve of H₂'), 16, 40); q.strokeStyle = '#5fe3d6'; q.beginPath(); for (var i = 0; i < 200; i++) { var R = 0.5 + 2.5 * i / 200, E = V(R); var x = 20 + i / 200 * (cv.width - 40), y = 80 + (0.4 - E) / 5.4 * (cv.height - 120); if (!i) q.moveTo(x, y); else q.lineTo(x, y); } q.stroke(); }
  });
  C.h2 = { CONST: CONST, V: V, Rdi: Rdi, Omega: Omega, E0: E0, D0: D0, A: A, NU: NU, nuvola: nuvola, N: N };
})(typeof window !== 'undefined' ? window : globalThis);
