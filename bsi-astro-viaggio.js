/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-viaggio.js — 🌌 Dal Sole alla Galassia (scheda dell'eliosfera, v255)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Richiesta dell'autore, con un fotogramma di riferimento: il sistema solare,
   l'eliosfera con il muro di idrogeno e l'onda di prua, il disco della Via
   Lattea e le bolle di Fermi e di eROSITA in una sola animazione. Lo standard
   del progetto (§5.4) chiede una regia: transizioni di scala continue invece
   di salti fra immagini. Qui uno zoom logaritmico continuo da 2 UA a 9×10⁹ UA
   (44 kpc), con ogni oggetto alla sua posizione vera:

   · Il riferimento è l'eclittica (UA). La Galassia si mette con la matrice
     galattico → equatoriale (J2000) e la rotazione dell'eclittica (ε =
     23,4393°): il piano galattico risulta inclinato di circa 60° sull'eclittica,
     come in cielo. Il centro galattico sta a 8,18 kpc (GRAVITY 2019) in
     direzione (l, b) = (0°, 0°).
   · Eliosfera: shock, eliopausa (semicorpo di Rankine, R₀ = 112 UA), muro di
     idrogeno (MODELLO, guscio a 1,35 R₀) e onda di prua (DIBATTUTA, 1,9 R₀).
     Le particelle seguono le linee di flusso dello stesso modello: corrente
     uniforme di gas interstellare più la sorgente del vento solare,
       v = −U n̂ + U R₀² r̂ / r²,
     la cui superficie di separazione è proprio l'eliopausa disegnata.
   · Nube di Oort: 2 000–100 000 UA, IPOTESI (dedotta dalle comete di lungo
     periodo, mai osservata). Alfa Centauri A+B a 4,37 anni luce nella sua
     direzione vera (AR 14h 39,6m, Dec −60,8°).
   · Via Lattea: disco schematico a quattro bracci logaritmici (passo 12°),
     raggio 15 kpc, barra centrale. Bolle di Fermi (raggi gamma, Su, Slatyer e
     Finkbeiner 2010): circa 8 kpc sopra e sotto il centro. Bolle di eROSITA
     (raggi X, Predehl et al. 2020): circa 14 kpc. Che nascano dal centro è
     l'interpretazione più seguita, non l'unica.

   ONESTA'
   · Le particelle del flusso sono rallentate o accelerate per vederle; le
     stelle della Galassia sono un disegno statistico, non un catalogo.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI, RAD = PI / 180, EPS = 23.4393 * RAD;
  var KPC = 2.0626481e8, AL = 63241.077, LMIN = 2, LMAX = 9e9;
  /* equatoriale → galattico (J2000); la trasposta va al contrario */
  var A = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
  function galEq(g) { return [A[0][0] * g[0] + A[1][0] * g[1] + A[2][0] * g[2], A[0][1] * g[0] + A[1][1] * g[1] + A[2][1] * g[2], A[0][2] * g[0] + A[1][2] * g[1] + A[2][2] * g[2]]; }
  function eqEcl(e) { return [e[0], e[1] * Math.cos(EPS) + e[2] * Math.sin(EPS), -e[1] * Math.sin(EPS) + e[2] * Math.cos(EPS)]; }
  function galEcl(g) { return eqEcl(galEq(g)); }
  function radec(ra, dec) { return eqEcl([Math.cos(dec * RAD) * Math.cos(ra * RAD), Math.cos(dec * RAD) * Math.sin(ra * RAD), Math.sin(dec * RAD)]); }
  var RGC = 8.178 * KPC, GC = galEcl([RGC, 0, 0]), NGP = galEcl([0, 0, 1]);
  /** Inclinazione del piano galattico sull'eclittica (gradi). */
  function inclinazione() { return Math.acos(Math.abs(NGP[2])) / RAD; }
  function campoFlusso(p, n, R0, U) { var r2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2], r = Math.sqrt(r2), k = U * R0 * R0 / (r2 * r); return [-U * n[0] + k * p[0], -U * n[1] + k * p[1], -U * n[2] + k * p[2]]; }
  F.calcolo.viaggio = { galEcl: galEcl, radec: radec, GC: GC, NGP: NGP, inclinazione: inclinazione, campoFlusso: campoFlusso, KPC: KPC, AL: AL };

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function distanzaTesto(L) { return L < 2e4 ? Math.round(L).toLocaleString('it-IT') + ' UA' : L < 3e7 ? (L / AL).toFixed(L < 2e5 ? 2 : 1).replace('.', ',') + t(' anni luce', ' light years') : (L / KPC).toFixed(1).replace('.', ',') + ' kpc'; }
  var TAPPE = [
    [40, ['I pianeti: Nettuno a 30 UA. Le orbite sono nel piano dell\'eclittica.', 'The planets: Neptune at 30 AU. The orbits lie in the ecliptic plane.']],
    [180, ['Lo shock di terminazione (Voyager 1 a 94 UA) e l\'eliopausa (121,6 UA): la bolla del vento solare.', 'The termination shock (Voyager 1 at 94 AU) and the heliopause (121.6 AU): the bubble of the solar wind.']],
    [900, ['Muro di idrogeno (modello) e onda di prua (dibattuta): il gas interstellare arriva a 26 km/s e gira attorno all\'eliopausa.', 'Hydrogen wall (model) and bow wave (debated): the interstellar gas arrives at 26 km/s and flows around the heliopause.']],
    [1.5e5, ['La nube di Oort, 2 000–100 000 UA: un\'ipotesi, dedotta dalle orbite delle comete di lungo periodo.', 'The Oort cloud, 2,000–100,000 AU: a hypothesis, inferred from the orbits of long-period comets.']],
    [3e6, ['Alfa Centauri, la stella più vicina dopo il Sole: 4,37 anni luce.', 'Alpha Centauri, the nearest star after the Sun: 4.37 light years.']],
    [4e8, ['Il disco della Via Lattea: il Sole a 8,2 kpc (26 700 anni luce) dal centro, nel braccio di Orione. Il disco è inclinato di 60° sull\'eclittica.', 'The Milky Way disc: the Sun 8.2 kpc (26,700 light years) from the centre, in the Orion arm. The disc is tilted 60° to the ecliptic.']],
    [Infinity, ['Sopra e sotto il centro: le bolle di Fermi (raggi gamma, ~8 kpc) e le bolle di eROSITA (raggi X, ~14 kpc).', 'Above and below the centre: the Fermi bubbles (gamma rays, ~8 kpc) and the eROSITA bubbles (X-rays, ~14 kpc).']]
  ];

  function scheda(div) {
    var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G);
    var vistaBase = null, inScala = false, ferma = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches, L = 60, viaggio = null, S = null, T = null, L3 = globale.BSILab3D, oggetti = [], radice = null, flusso = null;
    var cur = F.cursore(pan, ['Scala: lato inquadrato (log₁₀ UA)', 'Scale: framed size (log₁₀ AU)'], Math.log10(LMIN), Math.log10(LMAX), 0.01, Math.log10(L), function (v) { L = Math.pow(10, v); viaggio = null; aggiorna(); }, function (v) { return distanzaTesto(Math.pow(10, v)); });
    var bv = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: '▶ ' + t('Viaggio dal Sole alla Galassia', 'Journey from the Sun to the Galaxy') });
    bv.addEventListener('click', function () { if (ferma) { L = L > 1e7 ? 60 : 3e9; aggiorna(); return; } viaggio = { t0: null, da: Math.log10(L < 1e8 ? LMIN * 2 : L), a: Math.log10(L < 1e8 ? 6e9 : LMIN * 2) }; if (S) { S.sporca = true; S.avvia(); } });
    pan.appendChild(bv);
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    info.innerHTML = '<b>' + t('Ogni oggetto alla sua posizione vera', 'Every object at its true position') + '</b>: ' + t('eclittica come riferimento; Galassia messa con la matrice galattico → equatoriale (J2000): il suo piano risulta inclinato di ', 'ecliptic as reference; Galaxy placed with the galactic → equatorial matrix (J2000): its plane comes out tilted by ') + '<b class="bsiFX-num">' + inclinazione().toFixed(1).replace('.', ',') + '°</b>. ' +
      t('Le particelle seguono il flusso del modello di Rankine: gialle dal Sole, viola dal mezzo interstellare. Nube di Oort: ipotesi. Bracci della Galassia: schema. Bolle di Fermi ed eROSITA: misurate; l\'origine dal centro è l\'interpretazione più seguita.', 'Particles follow the Rankine model flow: yellow from the Sun, violet from the interstellar medium. Oort cloud: hypothesis. Galactic arms: schematic. Fermi and eROSITA bubbles: measured; the origin at the centre is the most followed interpretation.');
    var cap = F.el('div', { 'class': 'bsiVG-cap', 'aria-live': 'polite' });
    function stile() { if (globale.document.getElementById('bsiVG-stile')) return; var st = globale.document.createElement('style'); st.id = 'bsiVG-stile'; st.textContent = '.bsiVG-cap{position:absolute;left:10px;right:44px;top:8px;pointer-events:none;font:13px/1.5 system-ui,sans-serif;color:#e8eef6;text-shadow:0 1px 3px #000;z-index:2}.bsiVG-cap b{color:#ffd24a}@media(max-width:600px){.bsiVG-cap{font-size:11.5px;right:8px;top:40px}}'; globale.document.head.appendChild(st); }
    function aggiungi(o, taglia, fadeDentro) { o.userData.taglia = taglia; o.userData.dentro = fadeDentro || 0.004; oggetti.push(o); radice.add(o); return o; }
    function etichetta(testo, col, pos, taglia, alto) { var e = L3.testo3d(T, testo, col, taglia * (alto || 0.07)); e.position.set(pos[0], pos[1], pos[2]); return aggiungi(e, taglia, 0.02); }
    function anello(R, col, n) { var p = []; for (var i = 0; i <= (n || 128); i++) { var f = 2 * PI * i / (n || 128); p.push(new T.Vector3(R * Math.cos(f), R * Math.sin(f), 0)); } return new T.Line(new T.BufferGeometry().setFromPoints(p), new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.6 })); }
    function guscio(fr, amax, n, col, op) {
      var e1 = n, tmp = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], e2 = norm(vx(tmp, e1)), e3 = vx(e1, e2), NA = 40, NB = 40, pos = [], idx = [];
      for (var i = 0; i <= NA; i++) { var al = amax * i / NA, r = fr(al), ca = Math.cos(al * RAD), sa = Math.sin(al * RAD); for (var j = 0; j <= NB; j++) { var b = 2 * PI * j / NB; pos.push(r * (e1[0] * ca + (e2[0] * Math.cos(b) + e3[0] * Math.sin(b)) * sa), r * (e1[1] * ca + (e2[1] * Math.cos(b) + e3[1] * Math.sin(b)) * sa), r * (e1[2] * ca + (e2[2] * Math.cos(b) + e3[2] * Math.sin(b)) * sa)); } }
      for (var a2 = 0; a2 < NA; a2++) for (var b2 = 0; b2 < NB; b2++) { var p0 = a2 * (NB + 1) + b2, p1 = p0 + NB + 1; idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return new T.Mesh(g, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
    }
    function lobo(centro, asse, alto, largo, col, op) {
      var g = new T.SphereGeometry(1, 48, 32), m = new T.Mesh(g, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
      m.scale.set(largo, largo, alto / 2); var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(asse[0], asse[1], asse[2])); m.quaternion.copy(q);
      m.position.set(centro[0] + asse[0] * alto / 2, centro[1] + asse[1] * alto / 2, centro[2] + asse[2] * alto / 2); return m;
    }
    function punti(arr, col, size) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr.pos, 3)); if (arr.col) g.setAttribute('color', new T.Float32BufferAttribute(arr.col, 3)); return new T.Points(g, new T.PointsMaterial({ size: size, color: arr.col ? 0xffffff : col, vertexColors: !!arr.col, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: false })); }
    function costruisci() {
      var E = F.calcolo.eliosfera, rnd = mulberry(42), n = E.versore(E.NASO.lon, E.NASO.lat), R0 = 112;
      S.pulisci(); oggetti = []; radice = new T.Group(); S.aggiungi(radice);
      /* il Sole */
      var sole = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshBasicMaterial({ color: 0xffd27a })); radice.add(sole); radice.userData.sole = sole;
      /* pianeti e fascia di Kuiper */
      [[1, 'Terra', 'Earth'], [5.2, 'Giove', 'Jupiter'], [9.58, 'Saturno', 'Saturn'], [19.2, 'Urano', 'Uranus'], [30.07, 'Nettuno', 'Neptune']].forEach(function (p, i) { aggiungi(anello(p[0], 0x7fa6c9), p[0] * 2.2, 0.01); var f = 0.6 + i * 1.3, pos = [p[0] * Math.cos(f), p[0] * Math.sin(f), 0]; var m = new T.Mesh(new T.SphereGeometry(p[0] * 0.03 + 0.05, 12, 8), new T.MeshBasicMaterial({ color: [0x7fb2ff, 0xe0b080, 0xe8d090, 0x9fe0e8, 0x6f8fff][i] })); m.position.set(pos[0], pos[1], pos[2]); aggiungi(m, p[0] * 2.2, 0.01); etichetta(t(p[1], p[2]), '#cfe3f7', [pos[0], pos[1], pos[2] + p[0] * 0.06], p[0] * 2.2, 0.05); });
      var kb = { pos: [] }; for (var i = 0; i < 2500; i++) { var r = 30 + 20 * rnd(), f = 2 * PI * rnd(); kb.pos.push(r * Math.cos(f), r * Math.sin(f), (rnd() - 0.5) * 6); } aggiungi(punti(kb, 0x9fb3c8, 1.5), 100, 0.01);
      /* eliosfera */
      aggiungi(guscio(function (al) { return E.formaShock(al, 85); }, 180, n, 0xff9a3c, 0.16), 300, 0.02);
      aggiungi(guscio(function (al) { return E.eliopausa(al, R0); }, 150, n, 0x4aa8ff, 0.16), 400, 0.02);
      aggiungi(guscio(function (al) { return E.eliopausa(al, R0 * 1.35); }, 140, n, 0xd46cff, 0.06), 500, 0.02);
      aggiungi(guscio(function (al) { return E.eliopausa(al, R0 * 1.9); }, 120, n, 0x7affc8, 0.045), 700, 0.02);
      function lungoNaso(k, al) { var d = E.versore(E.NASO.lon + al, E.NASO.lat + 25); return [d[0] * k, d[1] * k, d[2] * k]; }
      etichetta(t('shock di terminazione', 'termination shock'), '#ffb070', lungoNaso(90, 40), 400, 0.09);
      etichetta(t('eliopausa', 'heliopause'), '#8cc8ff', lungoNaso(130, -30), 400, 0.09);
      etichetta(t('muro di idrogeno (modello)', 'hydrogen wall (model)'), '#e2a8ff', lungoNaso(165, 20), 600, 0.08);
      etichetta(t('onda di prua (dibattuta)', 'bow wave (debated)'), '#9fffd8', lungoNaso(250, 70), 800, 0.08);
      ['v1', 'v2'].forEach(function (k) { var sd = E.SONDE[k], d = E.versore(sd.lon, sd.lat), Rr = E.distanza(k, 2026.9); aggiungi(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(d[0] * Rr, d[1] * Rr, d[2] * Rr)]), new T.LineBasicMaterial({ color: parseInt(sd.col.slice(1), 16) })), 400, 0.02); etichetta(sd.nome, sd.col, [d[0] * Rr, d[1] * Rr, d[2] * Rr + 8], 400, 0.045); });
      /* il flusso */
      var NF = (globale.innerWidth || 1000) < 700 ? 1000 : 1800, fp = new Float32Array(NF * 3), fc = new Float32Array(NF * 3), st = [];
      function nasce(i, sole) {
        if (sole) { var u = 2 * rnd() - 1, ph = 2 * PI * rnd(), s = Math.sqrt(1 - u * u), r = 3 + rnd() * 4; st[i] = { p: [r * s * Math.cos(ph), r * s * Math.sin(ph), r * u], sole: true }; }
        else { var e2 = norm(vx(Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], n)), e3 = vx(n, e2), rr = 520 * Math.sqrt(rnd()), b = 2 * PI * rnd(), d0 = 650; st[i] = { p: [n[0] * d0 + (e2[0] * Math.cos(b) + e3[0] * Math.sin(b)) * rr, n[1] * d0 + (e2[1] * Math.cos(b) + e3[1] * Math.sin(b)) * rr, n[2] * d0 + (e2[2] * Math.cos(b) + e3[2] * Math.sin(b)) * rr], sole: false }; }
        var c = st[i].sole ? [1.0, 0.78, 0.35] : [0.7, 0.5, 1.0]; fc[i * 3] = c[0]; fc[i * 3 + 1] = c[1]; fc[i * 3 + 2] = c[2];
      }
      for (var q = 0; q < NF; q++) { nasce(q, q < NF * 0.4); var pas = Math.floor(rnd() * 300); for (var z = 0; z < pas; z++) muovi(q, 2); }
      function muovi(i, dt) { var s = st[i], v = E ? campoFlusso(s.p, n, R0, 26) : [0, 0, 0], vv = Math.hypot(v[0], v[1], v[2]), h = Math.min(dt, 6 / Math.max(vv, 1e-6)) * 1; s.p[0] += v[0] * h; s.p[1] += v[1] * h; s.p[2] += v[2] * h; var r = Math.hypot(s.p[0], s.p[1], s.p[2]); if (r > 900 || (s.p[0] * n[0] + s.p[1] * n[1] + s.p[2] * n[2]) < -800) nasce(i, s.sole); }
      flusso = { muovi: function (dt) { for (var i = 0; i < NF; i++) { muovi(i, dt * 8); fp[i * 3] = st[i].p[0]; fp[i * 3 + 1] = st[i].p[1]; fp[i * 3 + 2] = st[i].p[2]; } gF.attributes.position.needsUpdate = true; } };
      var gF = new T.BufferGeometry(); gF.setAttribute('position', new T.BufferAttribute(fp, 3)); gF.setAttribute('color', new T.BufferAttribute(fc, 3));
      aggiungi(new T.Points(gF, new T.PointsMaterial({ size: 1.6, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: false })), 800, 0.02);
      flusso.muovi(0);
      /* nube di Oort */
      var oo = { pos: [] }; for (var k2 = 0; k2 < 5000; k2++) { var rO = 2000 * Math.pow(50, rnd()), u2 = 2 * rnd() - 1, f2 = 2 * PI * rnd(), sq = Math.sqrt(1 - u2 * u2), piatto = rO < 2e4 ? 0.35 : 1; oo.pos.push(rO * sq * Math.cos(f2), rO * sq * Math.sin(f2), rO * u2 * piatto); }
      aggiungi(punti(oo, 0x8fb8d8, 1.4), 2e5, 0.02); etichetta(t('nube di Oort (ipotesi)', 'Oort cloud (hypothesis)'), '#a8cbe6', [0, -6e4, 3e4], 2e5, 0.05);
      /* Alfa Centauri */
      var ac = radec(219.90, -60.83), Dac = 4.37 * AL; var sa = new T.Mesh(new T.SphereGeometry(Dac * 0.006, 12, 8), new T.MeshBasicMaterial({ color: 0xfff1c0 })); sa.position.set(ac[0] * Dac, ac[1] * Dac, ac[2] * Dac); aggiungi(sa, Dac * 2.4, 0.02);
      etichetta(t('Alfa Centauri · 4,37 anni luce', 'Alpha Centauri · 4.37 light years'), '#fff1c0', [ac[0] * Dac, ac[1] * Dac, ac[2] * Dac + Dac * 0.08], Dac * 2.4, 0.045);
      /* Via Lattea */
      var gx = { pos: [], col: [] }, NG = (globale.innerWidth || 1000) < 700 ? 14000 : 26000, kpitch = Math.tan(12 * RAD);
      for (var g = 0; g < NG; g++) {
        var tipo = rnd(), rg, th, zg;
        if (tipo < 0.15) { rg = Math.abs(gauss(rnd) * 1.2); th = 2 * PI * rnd(); zg = gauss(rnd) * 0.5; }      /* rigonfiamento */
        else if (tipo < 0.75) { var braccio = Math.floor(rnd() * 4), s0 = rnd(); rg = 3 + 12 * Math.pow(s0, 0.9); th = braccio * PI / 2 + Math.log(rg / 3) / kpitch + gauss(rnd) * 0.18; zg = gauss(rnd) * 0.12; }
        else { rg = 15 * Math.sqrt(rnd()); th = 2 * PI * rnd(); zg = gauss(rnd) * 0.25; }
        /* la Galassia ruota in senso orario vista dal polo nord galattico: bracci che si avvolgono all'indietro */
        var xg = RGC - rg * KPC * Math.cos(th), yg = -rg * KPC * Math.sin(th), p3 = galEcl([xg, yg, zg * KPC]);
        gx.pos.push(p3[0], p3[1], p3[2]); var caldo = rg < 3 ? 1 : 0; gx.col.push(caldo ? 1 : 0.75, caldo ? 0.85 : 0.85, caldo ? 0.6 : 1);
      }
      aggiungi(punti(gx, 0xffffff, 1.6), 4e9, 0.05);
      etichetta(t('centro galattico · Sgr A*', 'galactic centre · Sgr A*'), '#ffd27a', [GC[0], GC[1], GC[2] + 0.6 * KPC], 4e9, 0.035);
      etichetta(t('il Sole · braccio di Orione', 'the Sun · Orion arm'), '#9fe0ff', [0, 0, 0.5 * KPC], 4e9, 0.03);
      /* bolle */
      var up = NGP, dn = [-up[0], -up[1], -up[2]];
      [up, dn].forEach(function (a) { aggiungi(lobo(GC, a, 8 * KPC, 3.2 * KPC, 0xd94a4a, 0.16), 6e9, 0.05); aggiungi(lobo(GC, a, 14 * KPC, 6.2 * KPC, 0x2fae7a, 0.11), 9e9, 0.05); });
      etichetta(t('bolla di Fermi (γ, ~8 kpc)', 'Fermi bubble (γ, ~8 kpc)'), '#ff9a9a', [GC[0] + up[0] * 8.5 * KPC, GC[1] + up[1] * 8.5 * KPC, GC[2] + up[2] * 8.5 * KPC], 6e9, 0.04);
      etichetta(t('bolla di eROSITA (raggi X, ~14 kpc)', 'eROSITA bubble (X-rays, ~14 kpc)'), '#8fffc8', [GC[0] + up[0] * 14.6 * KPC, GC[1] + up[1] * 14.6 * KPC, GC[2] + up[2] * 14.6 * KPC], 9e9, 0.04);
      S.inquadra(3.2, -1.0, 1.05); aggiorna();
    }
    function gauss(r) { var u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }
    function vx(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
    /* la regia: tutto si scala con 1/L; il bersaglio scivola dal Sole al centro galattico */
    function aggiorna() {
      var lg = Math.log10(L), w = Math.max(0, Math.min(1, (lg - 7.8) / 1.4)); w = w * w * (3 - 2 * w);
      var tap = TAPPE.filter(function (x) { return L < x[0]; })[0];
      cap.innerHTML = '<b>' + distanzaTesto(L) + '</b> · ' + t(tap[1][0], tap[1][1]);
      cur.value = lg.toFixed(2);
      if (!radice) return;
      radice.scale.setScalar(1 / L);
      radice.userData.sole.scale.setScalar(L * 0.012);
      /* alla scala galattica la scena ruota (fino a w = 1) finché il nord galattico va in alto: il disco orizzontale, visto di sbieco */
      if (!vistaBase) vistaBase = { th: S.vista.th, ph: S.vista.ph };
      var qg = new T.Quaternion().setFromUnitVectors(new T.Vector3(NGP[0], NGP[1], NGP[2]), new T.Vector3(0, 0, 1)), q = new T.Quaternion().slerp(qg, w);
      radice.quaternion.copy(q);
      var gcv = new T.Vector3(GC[0], GC[1], GC[2]).applyQuaternion(q);
      radice.position.set(-gcv.x * w / L, -gcv.y * w / L, -gcv.z * w / L);
      if (w > 0) S.vista.ph = vistaBase.ph + (1.18 - vistaBase.ph) * w; else if (inScala) S.vista.ph = vistaBase.ph;
      inScala = w > 0;
      oggetti.forEach(function (o) { var q = Math.log10(o.userData.taglia / L), a = Math.max(0, Math.min(1, (q - Math.log10(o.userData.dentro)) / 0.5)) * Math.max(0, Math.min(1, (1.7 - q) / 0.5)); o.visible = a > 0.01; o.traverse(function (x) { if (x.material) { if (x.userData.op == null) x.userData.op = x.material.opacity == null ? 1 : x.material.opacity; x.material.opacity = x.userData.op * a; x.material.transparent = true; } }); });
      S.didascalia.textContent = t('Dal Sole alla Galassia', 'From the Sun to the Galaxy') + ' · ' + t('lato ', 'side ') + distanzaTesto(L) + ' · ' + t('scala logaritmica continua, posizioni vere', 'continuous logarithmic scale, true positions');
      S.sporca = true; S.avvia();
    }
    stile();
    var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.appendChild(attesa);
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
    L3.stile(); L3.caricaThree().then(function () {
      attesa.remove(); S = new L3.Scena(dx, 0.85); dx.insertBefore(S.box, dx.firstChild); T = globale.THREE; S.ren.setClearColor(0x02050a, 1);
      if (getComputedStyle(S.box).position === 'static') S.box.style.position = 'relative'; S.box.appendChild(cap);
      setTimeout(function () {
        costruisci();
        S.ogniFotogramma(function (dt) {
          var vivo = false;
          if (viaggio) { if (viaggio.t0 == null) viaggio.t0 = 0; viaggio.t0 += dt; var u = Math.min(1, viaggio.t0 / 26), e = u * u * (3 - 2 * u); L = Math.pow(10, viaggio.da + (viaggio.a - viaggio.da) * e); aggiorna(); if (u >= 1) viaggio = null; vivo = true; }
          if (!ferma && flusso && L < 3000) { flusso.muovi(dt); vivo = true; }
          return vivo;
        });
      }, 0);
    }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
  }
  F.schedeExtra = F.schedeExtra || {};
  F.schedeExtra.viaggioGalassia = scheda;
})(typeof window !== 'undefined' ? window : globalThis);
