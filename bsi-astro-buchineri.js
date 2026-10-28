/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-buchineri.js — 🕳️ buchi neri e relativita' generale
   BioSpecInfo · © Samuele Pio Provenzano

   La relativita' ristretta (bsi-fis-relativita.js) e la gravita' di Newton
   (bsi-fis-gravita.js) hanno gia' le loro sezioni; qui si entra nello spazio-
   tempo curvo di Schwarzschild, e lo si GUARDA in tre dimensioni:

   · IL BUCO NERO VISTO DA VICINO: un vero tracciamento dei raggi nello
     shader. Per ogni pixel il fotone viene seguito all'indietro lungo la sua
     geodetica nulla: nel piano dell'orbita del fotone vale l'equazione di
     Binet u'' + u = 3Mu² (u = 1/r), integrata con Runge-Kutta 4 e un numero
     fisso di passi. Il raggio finisce nell'orizzonte (nero), attraversa il
     disco di accrescimento sottile (che brilla con l'effetto Doppler e il
     redshift gravitazionale, g = √(1−3M/r)/(1−Ωλ)) oppure fugge e prende il
     colore del cielo stellato. Ne escono l'anello di Einstein, l'ombra di
     raggio √27 M e l'immagine secondaria del disco che passa sopra e sotto
     il buco. La camera della Scena (r, θ, φ) arriva allo shader come uniformi;
     sui telefoni la risoluzione e i passi si riducono;
   · GEODETICHE DI PARTICELLE: il potenziale efficace
     V(r) = (1 − 2M/r)(1 + L²/r²), l'orbita circolare stabile piu' interna
     (ISCO, 6M), l'orbita marginalmente legata (4M), la sfera dei fotoni (3M);
     le orbite che precedono (rosette), quelle «zoom-whirl», i tuffi
     nell'orizzonte, disegnate come scie in 3D; la precessione del perielio di
     Mercurio, 43″ al secolo, dalla formula 6πGM/(c²a(1−e²));
   · LA CURVATURA: il paraboloide di Flamm (la geometria spaziale del piano
     equatoriale immersa in 3D) con i raggi di luce che lo percorrono; la
     deflessione 4GM/(c²b), 1,75″ al bordo del Sole; il ritardo di Shapiro;
     gli orologi dei satelliti GPS (+45,7 μs/giorno per la gravita',
     −7,2 μs/giorno per la velocita');
   · HAWKING: temperatura, entropia, potenza ed evaporazione di un buco nero
     dal milione di masse solari fino ai buchi neri primordiali.

   I calcoli (F.calcolo.buchineri) sono funzioni pure in unita' geometriche
   G = c = M = 1 quando non e' detto altrimenti, separati dal disegno: il
   banco li prova in node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;

  /* costanti SI (CODATA 2018) */
  var G = 6.67430e-11, c = 299792458, HBAR = 1.054571817e-34, KB = 1.380649e-23, MSOLE = 1.98847e30, RSOLE = 6.957e8,
    UA = 1.495978707e11, ANNO = 3.15576e7, GM_TERRA = 3.986004418e14, R_TERRA = 6.371e6, ARCSEC = 180 * 3600 / Math.PI;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* potenziale efficace di una particella massiva (M = 1, per unita' di massa):
     (dr/dτ)² = E² − V(r),  V(r) = (1 − 2/r)(1 + L²/r²) */
  function veff(r, L) { return (1 - 2 / r) * (1 + L * L / (r * r)); }
  function dveff(r, L) { return 2 / (r * r) - 2 * L * L / (r * r * r) + 6 * L * L / (r * r * r * r); }
  /* per i fotoni: (dr/dλ)² = E² − L² W(r), W = (1 − 2/r)/r² */
  function veffFotone(r) { return (1 - 2 / r) / (r * r); }
  /* orbite circolari per un dato L: dV/dr = 0 → r² − L² r + 3L² = 0 */
  function orbiteCircolari(L) {
    var D = 1 - 12 / (L * L);
    if (D < 0) return null;
    return { stabile: L * L / 2 * (1 + Math.sqrt(D)), instabile: L * L / 2 * (1 - Math.sqrt(D)) };
  }
  function Lcircolare(r) { return Math.sqrt(r * r / (r - 3)); }
  function Ecircolare(r) { return (r - 2) / Math.sqrt(r * (r - 3)); }
  /* estremi del potenziale trovati numericamente (senza la formula chiusa): cambi di segno di dV/dr */
  function estremiNumerici(L, rmin, rmax) {
    var out = [], N = 4000, a = rmin || 2.05, b = rmax || 200, prec = dveff(a, L), xp = a;
    for (var i = 1; i <= N; i++) {
      var x = a * Math.pow(b / a, i / N), d = dveff(x, L);
      if (prec * d < 0) {
        var lo = xp, hi = x; for (var k = 0; k < 100; k++) { var m = 0.5 * (lo + hi); if (dveff(lo, L) * dveff(m, L) <= 0) hi = m; else lo = m; }
        out.push({ r: 0.5 * (lo + hi), tipo: prec > 0 ? 'massimo' : 'minimo' });
      }
      prec = d; xp = x;
    }
    return out;
  }
  /* ISCO: il piu' piccolo L per cui il potenziale ha ancora un minimo (bisezione sull'esistenza) */
  function iscoNumerico() {
    var lo = 3, hi = 4;
    for (var k = 0; k < 60; k++) { var m = 0.5 * (lo + hi); if (estremiNumerici(m, 2.05, 400).some(function (e) { return e.tipo === 'minimo'; })) hi = m; else lo = m; }
    var e = estremiNumerici(hi, 2.05, 400);
    return { L: hi, r: e.length ? e.reduce(function (s, x) { return s + x.r; }, 0) / e.length : NaN };
  }
  /* massimo del potenziale dei fotoni (sezione aurea) */
  function sferaFotoniNumerica() {
    var a = 2.1, b = 10, g = (Math.sqrt(5) - 1) / 2;
    for (var k = 0; k < 200; k++) { var x1 = b - g * (b - a), x2 = a + g * (b - a); if (veffFotone(x1) > veffFotone(x2)) b = x2; else a = x1; }
    return 0.5 * (a + b);
  }
  /* orbita circolare instabile con E = 1 (marginalmente legata): Ecircolare(r) = 1 tra 3 e 6 */
  function marginaleNumerica() {
    var lo = 3.0001, hi = 6; for (var k = 0; k < 200; k++) { var m = 0.5 * (lo + hi); if (Ecircolare(m) > 1) lo = m; else hi = m; }
    return 0.5 * (lo + hi);
  }
  /* L di un'orbita legata da pericentro p e apocentro a (V(p) = V(a) = E²: lineare in L²) */
  function orbitaDaPA(p, a) {
    var L2 = 2 * (1 / p - 1 / a) / ((1 - 2 / p) / (p * p) - (1 - 2 / a) / (a * a));
    var L = Math.sqrt(L2), E = Math.sqrt(veff(a, L));
    return { L: L, E: E };
  }
  /* punti di inversione: radici in u = 1/r di 2L²u³ − L²u² + 2u + (E² − 1) = 0 */
  function inversioni(L, E) {
    var f = function (u) { return 2 * L * L * u * u * u - L * L * u * u + 2 * u + (E * E - 1); };
    var out = [], N = 3000, a = 1e-6, b = 0.5, pv = f(a), pu = a;
    for (var i = 1; i <= N; i++) {
      var u = a + (b - a) * i / N, v = f(u);
      if (pv * v <= 0 && pv !== v) { var lo = pu, hi = u; for (var k = 0; k < 80; k++) { var m = 0.5 * (lo + hi); if (f(lo) * f(m) <= 0) hi = m; else lo = m; } out.push(1 / (0.5 * (lo + hi))); }
      pv = v; pu = u;
    }
    return out.sort(function (x, y) { return y - x; }); /* raggi decrescenti */
  }
  /* che tipo di moto: legato (con apocentro e pericentro), tuffo, diffusione */
  function classifica(L, E) {
    var rr = inversioni(L, E), E2 = E * E, oc = orbiteCircolari(L), Vmax = oc ? veff(oc.instabile, L) : -1;
    if (E < 1) {
      if (rr.length >= 2 && (!oc || rr[1] > oc.instabile)) return { tipo: 'legata', apo: rr[0], peri: rr[1], Vmax: Vmax };
      return { tipo: 'tuffo', apo: rr[0], Vmax: Vmax };
    }
    if (oc && E2 < Vmax) return { tipo: 'diffusione', peri: rr[0], Vmax: Vmax };
    return { tipo: 'tuffoLibero', Vmax: Vmax };
  }
  /* un passo RK4 delle geodetiche di tipo tempo nel piano: y = [r, dr/dτ, φ, t] */
  function derivata(y, L, E) {
    var r = y[0];
    return [y[1], -1 / (r * r) + L * L / (r * r * r) - 3 * L * L / (r * r * r * r), L / (r * r), E / (1 - 2 / r)];
  }
  function passoGeodetica(y, h, L, E) {
    var k1 = derivata(y, L, E), y2 = [], y3 = [], y4 = [], i;
    for (i = 0; i < 4; i++) y2[i] = y[i] + 0.5 * h * k1[i];
    var k2 = derivata(y2, L, E); for (i = 0; i < 4; i++) y3[i] = y[i] + 0.5 * h * k2[i];
    var k3 = derivata(y3, L, E); for (i = 0; i < 4; i++) y4[i] = y[i] + h * k3[i];
    var k4 = derivata(y4, L, E), out = [];
    for (i = 0; i < 4; i++) out[i] = y[i] + h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6;
    return out;
  }
  function passoAdatto(r) { return Math.min(2, 0.02 * Math.pow(r, 1.5)); }
  /* angolo percorso in un periodo radiale (da apocentro ad apocentro) per integrazione nel tempo proprio */
  function precessioneIntegrata(L, E, apo) {
    var y = [apo, 0, 0, 0], passato = false, prev = y;
    for (var i = 0; i < 2000000; i++) {
      var n = passoGeodetica(y, passoAdatto(y[0]) * 0.25, L, E);
      if (n[1] < 0) passato = true;
      if (passato && y[1] > 0 && n[1] <= 0) { var f = y[1] / (y[1] - n[1]); return y[2] + f * (n[2] - y[2]); }
      prev = y; y = n;
      if (y[0] < 2.01) return NaN;
    }
    return NaN;
  }
  /* lo stesso angolo come integrale ellittico: (du/dφ)² = 2(u − ua)(up − u)(u3 − u),
     u3 = 1/2 − ua − up; con u = ū + δ sin θ l'integrando non ha piu' singolarita' */
  function precessioneIntegrale(peri, apo) {
    var ua = 1 / apo, up = 1 / peri, u3 = 0.5 - ua - up, um = 0.5 * (ua + up), d = 0.5 * (up - ua), N = 2000, s = 0;
    for (var i = 0; i <= N; i++) {
      var th = -Math.PI / 2 + Math.PI * i / N, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
      s += w / Math.sqrt(2 * (u3 - (um + d * Math.sin(th))));
    }
    return 2 * s * (Math.PI / N) / 3;
  }
  /* precessione del perielio, campo debole: Δφ = 6πGM/(c²a(1−e²)) per orbita */
  function precessioneDebole(GM, a, e) { return 6 * Math.PI * GM / (c * c * a * (1 - e * e)); }
  function mercurio() {
    var a = 5.7909050e10, e = 0.205630, P = 87.9691, GM = G * MSOLE;
    var dphi = precessioneDebole(GM, a, e), orbite = 36525 / P;
    return { perOrbita: dphi, arcsecSecolo: dphi * orbite * ARCSEC, orbite: orbite };
  }

  /* ── fotoni ──
     u'' + u = 3u², primo integrale u'² + u² − 2u³ = 1/b². Passo in φ adattivo ma con lo stesso numero
     massimo di passi dello shader: dφ = min(0,09, 0,08·u/|u'|). La stessa funzione qui e nello shader */
  function acc(u) { return -u + 3 * u * u; }
  function rk4Fotone(u, v, h) {
    var k1u = v, k1v = acc(u), u2 = u + 0.5 * h * k1u, v2 = v + 0.5 * h * k1v, k2u = v2, k2v = acc(u2),
      u3 = u + 0.5 * h * k2u, v3 = v + 0.5 * h * k2v, k3u = v3, k3v = acc(u3), u4 = u + h * k3u, v4 = v + h * k3v, k4u = v4, k4v = acc(u4);
    return [u + h * (k1u + 2 * k2u + 2 * k3u + k4u) / 6, v + h * (k1v + 2 * k2v + 2 * k3v + k4v) / 6];
  }
  function passoFotone(u, v) { return Math.min(0.09, 0.08 * u / Math.max(Math.abs(v), 1e-9)); }
  /* traccia nel piano: parte dal punto (px, py) con direzione (dx, dy); restituisce i punti e l'esito */
  function tracciaFotone(px, py, dx, dy, opz) {
    opz = opz || {};
    var r0 = Math.hypot(px, py), e1 = [px / r0, py / r0], dn = Math.hypot(dx, dy); dx /= dn; dy /= dn;
    var a = dx * e1[0] + dy * e1[1], pxp = dx - a * e1[0], pyp = dy - a * e1[1], cc = Math.hypot(pxp, pyp);
    if (cc < 1e-12) return { punti: [[px, py]], esito: a < 0 ? 'cattura' : 'fuga', b: 0 };
    var e2 = [pxp / cc, pyp / cc], s2 = opz.statico ? Math.sqrt(1 - 2 / r0) : 1;
    var u = 1 / r0, v = -u * a * s2 / cc;
    /* con opz.b il parametro d'impatto e' imposto esattamente dal primo integrale (il punto di partenza e' a distanza finita) */
    if (opz.b) v = (a < 0 ? 1 : -1) * Math.sqrt(Math.max(0, 1 / (opz.b * opz.b) - u * u + 2 * u * u * u));
    var ph = 0, uFuga = 1 / (opz.rFuga || Math.max(2 * r0, 80)), N = opz.passi || 4000, pts = [[px, py]], esito = 'aperto', inv = [];
    var b = 1 / Math.sqrt(v * v + u * u - 2 * u * u * u);
    for (var i = 0; i < N; i++) {
      var h = passoFotone(u, v), n = rk4Fotone(u, v, h);
      u = n[0]; v = n[1]; ph += h;
      if (opz.invariante) inv.push(v * v + u * u - 2 * u * u * u);
      if (u > 0) { var r = 1 / u, cp = Math.cos(ph), sp = Math.sin(ph); pts.push([r * (cp * e1[0] + sp * e2[0]), r * (cp * e1[1] + sp * e2[1])]); }
      if (u > 0.5) { esito = 'cattura'; break; }
      if (u < uFuga && v < 0) { esito = 'fuga'; break; }
    }
    /* direzione finale: dP/dφ ∝ −u' ê_r + u ê_φ */
    var er = [Math.cos(ph) * e1[0] + Math.sin(ph) * e2[0], Math.cos(ph) * e1[1] + Math.sin(ph) * e2[1]], ef = [-Math.sin(ph) * e1[0] + Math.cos(ph) * e2[0], -Math.sin(ph) * e1[1] + Math.cos(ph) * e2[1]];
    var dir = [-v * er[0] + u * ef[0], -v * er[1] + u * ef[1]], dl = Math.hypot(dir[0], dir[1]);
    return { punti: pts, esito: esito, b: b, dir: [dir[0] / dl, dir[1] / dl], passi: i, invariante: inv, phi: ph };
  }
  var B_CRITICO = 3 * Math.sqrt(3);
  /* deflessione esatta: α(b) = 2∫₀^{u_m} du/√(1/b² − u² + 2u³) − π, con u = u_m(1 − s²) */
  function deflessione(b) {
    if (b <= B_CRITICO) return Infinity;
    var P = function (u) { return 1 / (b * b) - u * u + 2 * u * u * u; };
    var lo = 0, hi = 1 / 3; for (var k = 0; k < 200; k++) { var m = 0.5 * (lo + hi); if (P(m) > 0) lo = m; else hi = m; }
    var um = 0.5 * (lo + hi), dP = -2 * um + 6 * um * um, N = 4000, s = 0;
    for (var i = 0; i <= N; i++) {
      var x = i / N, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2), f;
      if (i === 0) f = 2 * um / Math.sqrt(-dP * um); else { var uu = um * (1 - x * x), p = P(uu); f = p > 0 ? 2 * um * x / Math.sqrt(p) : 2 * um / Math.sqrt(-dP * um); }
      s += w * f;
    }
    return 2 * s / (3 * N) - Math.PI;
  }
  /* sviluppo per b grandi: 4M/b + (15π/4)(M/b)² + (128/3)(M/b)³ */
  function deflessioneSerie(b) { var x = 1 / b; return 4 * x + 15 * Math.PI / 4 * x * x + 128 / 3 * x * x * x; }
  function deflessioneSI(M, b) { return 4 * G * M / (c * c * b); }
  /* ritardo di Shapiro (andata e ritorno, campo debole): Δt = (4GM/c³) ln(4 r₁ r₂ / b²) */
  function shapiro(M, r1, r2, b) { return 4 * G * M / (c * c * c) * Math.log(4 * r1 * r2 / (b * b)); }
  /* orologi in orbita circolare attorno alla Terra rispetto a un orologio al suolo (rotazione terrestre trascurata), μs/giorno */
  function gps(r) {
    var grav = GM_TERRA / (c * c) * (1 / R_TERRA - 1 / r), cin = -GM_TERRA / (2 * r * c * c);
    return { grav: grav * 86400e6, cin: cin * 86400e6, netto: (grav + cin) * 86400e6, v: Math.sqrt(GM_TERRA / r) };
  }
  var R_GPS = 26561.75e3;
  /* fattore di dilatazione per un osservatore statico: dτ/dt = √(1 − r_s/r) */
  function dilatazione(r) { return Math.sqrt(1 - 2 / r); }
  /* Flamm: z(r) = 2√(2M(r − 2M)); la distanza radiale propria ∫dr/√(1−2M/r) */
  function flamm(r) { return 2 * Math.sqrt(2 * (r - 2)); }
  function distanzaPropria(r1, r2) { /* forma chiusa con M = 1 */ var F1 = function (r) { return Math.sqrt(r * (r - 2)) + 2 * Math.log(Math.sqrt(r) + Math.sqrt(r - 2)); }; return F1(r2) - F1(r1); }

  /* ── Hawking (SI) ── */
  function raggioSchwarzschild(M) { return 2 * G * M / (c * c); }
  function hawkingT(M) { return HBAR * c * c * c / (8 * Math.PI * G * M * KB); }
  function entropia(M) { return 4 * Math.PI * G * M * M / (HBAR * c); } /* S/k_B = A/(4 l_P²) */
  function potenza(M) { return HBAR * Math.pow(c, 6) / (15360 * Math.PI * G * G * M * M); }
  function evaporazione(M) { return 5120 * Math.PI * G * G * M * M * M / (HBAR * Math.pow(c, 4)); }
  function massaPerVita(tvita) { return Math.cbrt(tvita * HBAR * Math.pow(c, 4) / (5120 * Math.PI * G * G)); }
  function massaPerT(T) { return HBAR * c * c * c / (8 * Math.PI * G * KB * T); }
  /* secondo metodo per l'evaporazione: dM/dt = −P/c², integrato a passi logaritmici */
  function evaporazioneNumerica(M0) {
    var N = 20000, tt = 0;
    for (var i = 0; i < N; i++) { var m1 = M0 * (1 - i / N), m2 = M0 * (1 - (i + 1) / N), mm = 0.5 * (m1 + m2); tt += (m1 - m2) * c * c / potenza(mm); }
    return tt;
  }

  F.calcolo.buchineri = {
    G: G, c: c, HBAR: HBAR, KB: KB, MSOLE: MSOLE, RSOLE: RSOLE, UA: UA, ARCSEC: ARCSEC, R_GPS: R_GPS, R_TERRA: R_TERRA, B_CRITICO: B_CRITICO,
    veff: veff, dveff: dveff, veffFotone: veffFotone, orbiteCircolari: orbiteCircolari, Lcircolare: Lcircolare, Ecircolare: Ecircolare,
    estremiNumerici: estremiNumerici, iscoNumerico: iscoNumerico, sferaFotoniNumerica: sferaFotoniNumerica, marginaleNumerica: marginaleNumerica,
    orbitaDaPA: orbitaDaPA, inversioni: inversioni, classifica: classifica, passoGeodetica: passoGeodetica, passoAdatto: passoAdatto,
    precessioneIntegrata: precessioneIntegrata, precessioneIntegrale: precessioneIntegrale, precessioneDebole: precessioneDebole, mercurio: mercurio,
    rk4Fotone: rk4Fotone, passoFotone: passoFotone, tracciaFotone: tracciaFotone, deflessione: deflessione, deflessioneSerie: deflessioneSerie,
    deflessioneSI: deflessioneSI, shapiro: shapiro, gps: gps, dilatazione: dilatazione, flamm: flamm, distanzaPropria: distanzaPropria,
    raggioSchwarzschild: raggioSchwarzschild, hawkingT: hawkingT, entropia: entropia, potenza: potenza, evaporazione: evaporazione,
    evaporazioneNumerica: evaporazioneNumerica, massaPerVita: massaPerVita, massaPerT: massaPerT
  };

  /* ═══ pezzi comuni del disegno ══════════════════════════════════════════ */
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function eq(pan, testo) { var e = F.el('div', { 'class': 'bsiFX-eq', testo: testo }); pan.appendChild(e); return e; }
  function casella(pan, et, val, cambia) {
    var x = F.el('input', { type: 'checkbox' }); x.checked = !!val;
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [x, F.el('span', { testo: F.tt(et) })]));
    x.addEventListener('change', function () { cambia(x.checked); }); return x;
  }
  /* la scheda 3D: pannello a sinistra (scritto subito), scena a destra quando three.js e' pronto */
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
        /* la creazione del contesto WebGL e la costruzione della scena in due compiti separati: la pagina respira in mezzo */
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  /* cielo stellato di sfondo (punti additivi su una sfera grande) */
  function cieloStellato(T, n, R, seme) {
    var rnd = mulberry32(seme || 11), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var z = 2 * rnd() - 1, a = 2 * Math.PI * rnd(), s = Math.sqrt(1 - z * z), k = 0.35 + 0.65 * Math.pow(rnd(), 3), tinta = rnd();
      pos[3 * i] = R * s * Math.cos(a); pos[3 * i + 1] = R * s * Math.sin(a); pos[3 * i + 2] = R * z;
      col[3 * i] = k * (tinta > 0.7 ? 1 : 0.8); col[3 * i + 1] = k * 0.88; col[3 * i + 2] = k * (tinta < 0.3 ? 1 : 0.85);
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Points(g, new T.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }));
  }
  function anello(T, r, col, opac, tratteggio) {
    var pts = []; for (var i = 0; i <= 160; i++) { var a = 2 * Math.PI * i / 160; pts.push(new T.Vector3(r * Math.cos(a), r * Math.sin(a), 0)); }
    var g = new T.BufferGeometry().setFromPoints(pts), L;
    if (tratteggio) { L = new T.Line(g, new T.LineDashedMaterial({ color: col, dashSize: r * 0.08, gapSize: r * 0.06, transparent: true, opacity: opac })); L.computeLineDistances(); }
    else L = new T.Line(g, new T.LineBasicMaterial({ color: col, transparent: true, opacity: opac }));
    return L;
  }
  /* un buco nero «da modello» (orizzonte nero, alone della sfera dei fotoni) per le schede 2-4 */
  function bucoNero(T, rs) {
    var g = new T.Group();
    g.add(new T.Mesh(new T.SphereGeometry(rs, 48, 32), new T.MeshBasicMaterial({ color: 0x000000 })));
    var alone = new T.ShaderMaterial({
      uniforms: { uCol: { value: new T.Color(0xffb86b) } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.BackSide,
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 uCol; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.-abs(dot(vN,vV)); gl_FragColor = vec4(uCol*pow(f,3.)*1.2, 1.); }'
    });
    g.add(new T.Mesh(new T.SphereGeometry(rs * 1.55, 48, 32), alone));
    return g;
  }
  function esadecimale(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function telo(destra, rapp) { var cv = F.tela(destra, rapp || 0.5); cv.style.marginTop = '10px'; return cv; }

  /* ═══ 1. Il buco nero visto da vicino (tracciamento dei raggi) ═════════════ */
  var VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  var FRAG = [
    'uniform vec3 uPos; uniform vec3 uAvanti; uniform vec3 uDestra; uniform vec3 uSu;',
    'uniform float uTan; uniform float uAsp; uniform float uTempo; uniform float uRin; uniform float uRout;',
    'uniform float uDoppler; uniform float uRosso; uniform float uDisco; uniform float uGriglia; uniform float uTnorm; uniform float uTdisco;',
    'varying vec2 vUv;',
    'float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
    'float rumore(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);',
    '  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }',
    'float fbm(vec2 p){ return 0.55*rumore(p) + 0.3*rumore(p*2.03+7.1) + 0.15*rumore(p*4.07+3.3); }',
    /* colore di un corpo nero (approssimazione di Helland), T in kelvin */
    'vec3 corpoNero(float T){ T = clamp(T, 1000., 40000.)/100.; float r, g, b;',
    '  if (T <= 66.) { r = 1.; g = clamp(0.39008158*log(T) - 0.63184144, 0., 1.); }',
    '  else { r = clamp(1.29293619*pow(T-60., -0.13320476), 0., 1.); g = clamp(1.12989086*pow(T-60., -0.07551485), 0., 1.); }',
    '  if (T >= 66.) b = 1.; else if (T <= 19.) b = 0.; else b = clamp(0.54320679*log(T-10.) - 1.19625409, 0., 1.);',
    '  return vec3(r, g, b); }',
    'vec3 cielo(vec3 d){',
    '  float lon = atan(d.y, d.x), lat = asin(clamp(d.z, -1., 1.));',
    '  vec3 col = vec3(0.004, 0.006, 0.014);',
    '  float banda = dot(d, normalize(vec3(0.25, -0.45, 0.86)));',
    '  col += vec3(0.20, 0.16, 0.26)*exp(-banda*banda/0.05)*(0.35 + 0.65*fbm(vec2(lon*5., lat*5.)));',
    '  for (int k = 0; k < 2; k++) {',
    '    float sc = k == 0 ? 55. : 130.;',
    '    vec2 g = vec2((lon + 3.14159265)*sc/3.14159265, (lat + 1.5707963)*sc/3.14159265);',
    '    vec2 id = floor(g), f = fract(g);',
    '    float h = h21(id + float(k)*31.7);',
    '    if (h > 0.8) {',
    '      vec2 c0 = vec2(h21(id + 5.1), h21(id + 9.3))*0.6 + 0.2; vec2 dd = f - c0; dd.x *= max(cos(lat), 0.05);',
    '      float br = exp(-dot(dd, dd)*(k == 0 ? 180. : 300.))*pow((h - 0.8)/0.2, 3.)*(k == 0 ? 2.5 : 1.4);',
    '      col += corpoNero(3000. + 12000.*h21(id + 2.7))*br; }',
    '  }',
    '  if (uGriglia > 0.5) {',
    '    float a = abs(fract(lon/0.2617994 + 0.5) - 0.5), b = abs(fract(lat/0.2617994 + 0.5) - 0.5);',
    '    col += vec3(0.05, 0.5, 0.42)*(1. - smoothstep(0.02, 0.06, a)) + vec3(0.5, 0.42, 0.05)*(1. - smoothstep(0.02, 0.06, b)); }',
    '  return col; }',
    'void main(){',
    '  vec2 q = vUv*2. - 1.;',
    '  vec3 d = normalize(uAvanti + q.x*uTan*uAsp*uDestra + q.y*uTan*uSu);',
    '  float rc = length(uPos); vec3 e1 = uPos/rc;',
    '  float a = dot(d, e1); vec3 dp = d - a*e1; float cc = length(dp);',
    '  if (cc < 1e-6) { gl_FragColor = vec4(a < 0. ? vec3(0.) : cielo(d), 1.); return; }',
    '  vec3 e2 = dp/cc;',
    '  float s2 = sqrt(1. - 2./rc);',
    '  float u = 1./rc, v = -u*a*s2/cc, ph = 0.;',
    '  float uFuga = 1./max(2.*rc, 80.);',
    /* λ = L_z/E del fotone vero (che va verso la camera: momento −d) */
    '  float lam = -cross(uPos, d).z/s2;',
    '  float zPrec = uPos.z;',
    '  vec3 col = vec3(0.); float tr = 1.; int esito = 0;',
    '  for (int i = 0; i < PASSI; i++) {',
    '    float h = min(0.09, 0.08*u/max(abs(v), 1e-9));',
    '    float k1u = v, k1v = -u + 3.*u*u;',
    '    float u2 = u + 0.5*h*k1u, v2 = v + 0.5*h*k1v; float k2u = v2, k2v = -u2 + 3.*u2*u2;',
    '    float u3 = u + 0.5*h*k2u, v3 = v + 0.5*h*k2v; float k3u = v3, k3v = -u3 + 3.*u3*u3;',
    '    float u4 = u + h*k3u, v4 = v + h*k3v; float k4u = v4, k4v = -u4 + 3.*u4*u4;',
    '    float un = u + h*(k1u + 2.*k2u + 2.*k3u + k4u)/6.; float vn = v + h*(k1v + 2.*k2v + 2.*k3v + k4v)/6.;',
    '    float phn = ph + h;',
    '    if (uDisco > 0.5 && un > 0.) {',
    '      float zn = (cos(phn)*e1.z + sin(phn)*e2.z)/un;',
    '      if (zn*zPrec < 0.) {',
    '        float f = zPrec/(zPrec - zn); float uc = mix(u, un, f); float rr = 1./uc; float phc = mix(ph, phn, f);',
    '        if (rr > uRin && rr < uRout) {',
    '          vec3 P = rr*(cos(phc)*e1 + sin(phc)*e2);',
    '          float Om = pow(rr, -1.5);',
    '          float gG = uRosso > 0.5 ? sqrt(1. - 2./rr)/s2 : 1.;',
    '          float gD = uDoppler > 0.5 ? sqrt(1. - 3./rr)/sqrt(1. - 2./rr)/(1. - Om*lam) : 1.;',
    '          float g = gG*gD;',
    '          float Te = pow(rr, -0.75)*pow(max(1. - sqrt(6./rr), 0.), 0.25)/uTnorm;',
    '          float ang = atan(P.y, P.x) - Om*uTempo;',
    '          float tex = fbm(vec2(cos(ang), sin(ang))*(1.5 + rr*0.55) + vec2(rr*0.9, 0.));',
    '          float alfa = clamp(0.25 + 1.1*tex, 0., 1.)*smoothstep(uRin, uRin + 0.6, rr)*(1. - smoothstep(uRout - 4., uRout, rr));',
    '          vec3 em = corpoNero(uTdisco*Te*g)*pow(Te*g, 4.)*(0.5 + 0.9*tex)*0.75;',
    '          col += tr*alfa*em; tr *= 1. - alfa*0.92;',
    '        }',
    '      }',
    '      zPrec = zn;',
    '    }',
    '    u = un; v = vn; ph = phn;',
    '    if (u > 0.5) { esito = 1; break; }',
    '    if (u < uFuga && v < 0.) { esito = 2; break; }',
    '    if (tr < 0.03) break;',
    '  }',
    '  if (esito == 2 && tr > 0.03) {',
    '    vec3 er = cos(ph)*e1 + sin(ph)*e2, ef = -sin(ph)*e1 + cos(ph)*e2;',
    '    col += tr*cielo(normalize(-v*er + u*ef));',
    '  }',
    '  col = vec3(1.) - exp(-col*1.3);',
    '  gl_FragColor = vec4(col, 1.);',
    '}'
  ].join('\n');
  var QUALITA = { bassa: { passi: 90, px: 0.5 }, media: { passi: 170, px: 0.75 }, alta: { passi: 300, px: 1 } };
  function qualitaIniziale(ren) {
    var lento = false;
    try { var gl = ren.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); if (ext && /swiftshader|llvmpipe|software/i.test(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))) lento = true; } catch (e) { }
    var tel = false; try { tel = (globale.innerWidth || 1000) < 700 || !!(globale.matchMedia && globale.matchMedia('(pointer: coarse)').matches); } catch (e) { }
    return { q: lento || tel ? 'bassa' : 'media', lento: lento };
  }
  /* il massimo di r^(−3/4)(1 − √(6/r))^(1/4) (a r = 49/6), per normalizzare la temperatura del disco */
  var TNORM = Math.pow(49 / 6, -0.75) * Math.pow(1 - Math.sqrt(36 / 49), 0.25);

  function schedaRaggi(pan, destra) {
    var st = { q: 'media', disco: true, doppler: true, rosso: true, griglia: false, rout: 20, gira: true, Td: 4000 };
    eq(pan, 'd²u/dφ² + u = 3Mu²   (u = 1/r)');
    nota(pan, t('Ogni pixel è un fotone seguito <b>all’indietro</b> lungo la sua geodetica nulla nello spaziotempo di Schwarzschild. Il moto avviene in un piano (quello che contiene la camera, il centro e la direzione del pixel), dove vale l’equazione di Binet qui sopra, integrata nello shader con Runge-Kutta 4 e un numero fisso di passi. Il raggio può cadere nell’orizzonte (r = 2M: nero), attraversare il disco (sottile, nel piano equatoriale, da r = 6M, l’ISCO, in su) oppure fuggire: allora prende il colore delle stelle nella direzione finale.',
      'Each pixel is a photon traced <b>backwards</b> along its null geodesic in Schwarzschild spacetime. The motion lies in a plane (the one containing the camera, the centre and the pixel direction), where the Binet equation above holds; the shader integrates it with fourth-order Runge-Kutta and a fixed number of steps. The ray may fall into the horizon (r = 2M: black), cross the disk (thin, in the equatorial plane, from r = 6M, the ISCO, outwards) or escape: then it takes the colour of the stars in its final direction.'));
    var info = nota(pan);
    var ctl = F.el('div'); pan.appendChild(ctl);
    nota(pan, t('<b>Cosa guardare.</b> L’ombra ha raggio angolare corrispondente a b = 3√3 M ≈ 5,2M, più grande dell’orizzonte: è la sfera dei fotoni vista da lontano. La parte del disco dietro il buco appare <i>sopra e sotto</i> l’ombra (la luce che passa sopra il polo); l’anello sottile attaccato all’ombra è l’immagine secondaria. Il lato che viene verso di noi è più brillante e più azzurro (Doppler: intensità ∝ g⁴), quello che si allontana è fioco e rosso; vicino all’orizzonte il redshift gravitazionale √(1 − 2M/r) arrossa tutto. Con la griglia sul cielo si vedono le linee piegate e l’anello di Einstein.',
      '<b>What to look at.</b> The shadow corresponds to impact parameter b = 3√3 M ≈ 5.2M, larger than the horizon: it is the photon sphere seen from afar. The part of the disk behind the hole appears <i>above and below</i> the shadow (light passing over the pole); the thin ring hugging the shadow is the secondary image. The approaching side is brighter and bluer (Doppler: intensity ∝ g⁴), the receding side faint and red; near the horizon the gravitational redshift √(1 − 2M/r) reddens everything. With the sky grid you see the bent lines and the Einstein ring.'));
    var cv = null, ventaglio = null;
    function disegnaVentaglio() {
      if (!cv) return;
      var serie = [], R = 24;
      for (var k = 0; k < 15; k++) {
        var b = 1.2 + k * 0.72; if (k === 6) b = B_CRITICO * 1.0005;
        var tr = tracciaFotone(-R, b, 1, 0, { rFuga: 30, passi: 900, b: b }), xs = [], ys = [];
        tr.punti.forEach(function (p) { if (Math.abs(p[0]) < 26 && Math.abs(p[1]) < 18) { xs.push(p[0]); ys.push(p[1]); } else { xs.push(NaN); ys.push(NaN); } });
        serie.push({ x: xs, y: ys.map(function (y) { return y; }), col: k === 6 ? '#ffd24a' : tr.esito === 'cattura' ? '#ff8a80' : '#5eead4', larg: k === 6 ? 2.4 : 1.4 });
      }
      [2, 3].forEach(function (rr, j) { var xs = [], ys = []; for (var i = 0; i <= 96; i++) { var a = 2 * Math.PI * i / 96; xs.push(rr * Math.cos(a)); ys.push(rr * Math.sin(a)); } serie.push({ x: xs, y: ys, col: j ? '#ffb86b' : '#e6fffb', larg: j ? 1 : 2, tratt: !!j }); });
      var W = cv.clientWidth || 600, H = W * 0.56, sx = 52 / Math.max(1, W - 68), ySpan = sx * (H - 54) / 2;
      F.grafico(cv, { serie: serie, xmin: -26, xmax: 26, ymin: -ySpan, ymax: ySpan, xl: ['x / M', 'x / M'], yl: ['y / M', 'y / M'],
        legenda: [{ col: '#ff8a80', etich: ['catturati (b < 3√3 M)', 'captured (b < 3√3 M)'] }, { col: '#ffd24a', etich: ['b critico', 'critical b'] }, { col: '#5eead4', etich: ['deviati', 'deflected'] }],
        descr: ['Fotoni con parametri d’impatto diversi attorno a un buco nero: catturati sotto b = 3√3 M, deviati sopra', 'Photons with different impact parameters around a black hole: captured below b = 3√3 M, deflected above'] });
    }
    return {
      tre: function (S, T) {
        var qi = qualitaIniziale(S.ren); st.q = qi.q;
        /* con un rasterizzatore software ogni fotogramma costa centinaia di ms: il disco parte fermo */
        if (qi.lento) st.gira = false;
        /* niente lettura sincrona dello stato di compilazione: lo shader si compila senza fermare la pagina */
        S.ren.debug.checkShaderErrors = false;
        var mat = new T.ShaderMaterial({
          vertexShader: VERT, fragmentShader: FRAG, defines: { PASSI: QUALITA[st.q].passi }, depthTest: false, depthWrite: false,
          uniforms: { uPos: { value: new T.Vector3() }, uAvanti: { value: new T.Vector3() }, uDestra: { value: new T.Vector3() }, uSu: { value: new T.Vector3() },
            uTan: { value: Math.tan(21 * Math.PI / 180) }, uAsp: { value: 1.5 }, uTempo: { value: 0 }, uRin: { value: 6 }, uRout: { value: st.rout },
            uDoppler: { value: 1 }, uRosso: { value: 1 }, uDisco: { value: 1 }, uGriglia: { value: 0 }, uTnorm: { value: TNORM }, uTdisco: { value: st.Td } }
        });
        var quad = new T.Mesh(new T.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
        S.aggiungi(quad);
        var U = mat.uniforms, tempo = 0;
        function uniformi() {
          var v = S.vista; v.r = Math.max(4, Math.min(300, v.r));
          var p = new T.Vector3(v.r * Math.sin(v.ph) * Math.cos(v.th), v.r * Math.sin(v.ph) * Math.sin(v.th), v.r * Math.cos(v.ph));
          var av = p.clone().multiplyScalar(-1).normalize(), su0 = new T.Vector3(0, 0, 1), de = new T.Vector3().crossVectors(av, su0).normalize(), su = new T.Vector3().crossVectors(de, av);
          U.uPos.value.copy(p); U.uAvanti.value.copy(av); U.uDestra.value.copy(de); U.uSu.value.copy(su); U.uAsp.value = S.cam.aspect; U.uTempo.value = tempo;
          info.innerHTML = t('Camera a r = ', 'Camera at r = ') + '<b class="bsiFX-num">' + fmt(v.r) + ' M</b>, ' + t('inclinazione ', 'inclination ') + '<b class="bsiFX-num">' + fmt(v.ph * 180 / Math.PI) + '°</b>' +
            '<br>' + t('Ombra: raggio angolare ', 'Shadow: angular radius ') + '<b class="bsiFX-num">' + fmt(Math.asin(Math.min(1, B_CRITICO * Math.sqrt(1 - 2 / v.r) / v.r)) * 180 / Math.PI) + '°</b> (sin α = 3√3 M √(1−2M/r)/r)' +
            '<br>' + t('Passi RK4 per pixel ≤ ', 'RK4 steps per pixel ≤ ') + QUALITA[st.q].passi;
        }
        var dis = S.disegna; S.disegna = function () { uniformi(); dis.call(S); };
        function risoluzione() { S.ren.setPixelRatio(Math.min(2, globale.devicePixelRatio || 1) * QUALITA[st.q].px); S.adatta(); }
        risoluzione();
        S.ogniFotogramma(function (dt) { if (!st.gira) return false; tempo += dt * 6; return true; });
        S.didascalia.textContent = t('Buco nero di Schwarzschild con disco di accrescimento, calcolato fotone per fotone', 'Schwarzschild black hole with accretion disk, computed photon by photon');
        S.inquadra(30, 0.4, 1.47);
        function aggiorna() { U.uDisco.value = st.disco ? 1 : 0; U.uDoppler.value = st.doppler ? 1 : 0; U.uRosso.value = st.rosso ? 1 : 0; U.uGriglia.value = st.griglia ? 1 : 0; U.uRout.value = st.rout; U.uTdisco.value = st.Td; S.sporca = true; S.avvia(); }
        F.scelta(ctl, ['Qualità', 'Quality'], [['bassa', t('bassa (telefono)', 'low (phone)')], ['media', t('media', 'medium')], ['alta', t('alta', 'high')]], st.q, function (v) { st.q = v; mat.defines.PASSI = QUALITA[v].passi; mat.needsUpdate = true; risoluzione(); });
        F.scelta(ctl, ['Punto di vista', 'Viewpoint'], [['taglio', t('quasi di taglio (83°)', 'nearly edge-on (83°)')], ['30', t('dall’alto (30°)', 'from above (30°)')], ['polo', t('dal polo', 'from the pole')], ['vicino', t('vicino, r = 10M', 'close, r = 10M')]], 'taglio', function (v) {
          if (v === 'taglio') S.inquadra(30, S.vista.th, 1.47); else if (v === '30') S.inquadra(30, S.vista.th, 0.52); else if (v === 'polo') S.inquadra(30, S.vista.th, 0.06); else S.inquadra(10, S.vista.th, 1.4);
        });
        casella(ctl, ['Disco di accrescimento', 'Accretion disk'], st.disco, function (v) { st.disco = v; aggiorna(); });
        casella(ctl, ['Effetto Doppler (g = 1/(1 − Ωλ))', 'Doppler effect (g = 1/(1 − Ωλ))'], st.doppler, function (v) { st.doppler = v; aggiorna(); });
        casella(ctl, ['Redshift gravitazionale', 'Gravitational redshift'], st.rosso, function (v) { st.rosso = v; aggiorna(); });
        casella(ctl, ['Griglia sul cielo (lenti)', 'Sky grid (lensing)'], st.griglia, function (v) { st.griglia = v; aggiorna(); });
        casella(ctl, ['Il disco ruota (Ω = √(M/r³))', 'Disk rotates (Ω = √(M/r³))'], st.gira, function (v) { st.gira = v; S.avvia(); });
        F.cursore(ctl, ['Raggio esterno del disco (M)', 'Disk outer radius (M)'], 10, 40, 1, st.rout, function (v) { st.rout = v; aggiorna(); });
        F.cursore(ctl, ['Temperatura di picco del disco (K)', 'Disk peak temperature (K)'], 3000, 20000, 500, st.Td, function (v) { st.Td = v; aggiorna(); });
        aggiorna();
        cv = telo(destra, 0.56);
        disegnaVentaglio(); F.alRidimensiona(disegnaVentaglio);
        nota(destra, t('Sotto: gli stessi raggi nel loro piano, calcolati in JavaScript con lo stesso integratore dello shader. Sotto b = 3√3 M ≈ 5,196 M (giallo) il fotone cade; appena sopra gira attorno alla sfera dei fotoni (r = 3M, tratteggiata) prima di ripartire.',
          'Below: the same rays in their plane, computed in JavaScript with the same integrator as the shader. Below b = 3√3 M ≈ 5.196 M (yellow) the photon falls in; just above it circles the photon sphere (r = 3M, dashed) before leaving.'));
      }
    };
  }

  /* ═══ 2. Geodetiche delle particelle ══════════════════════════════════════ */
  var PRESET = {
    rosetta: function () { var o = orbitaDaPA(10, 30); return [o.L, o.E]; },
    whirl: function () { var L = 3.85, r = orbiteCircolari(L).instabile; return [L, Math.sqrt(veff(r, L)) - 2e-5]; },
    isco: function () { return [Math.sqrt(12), Math.sqrt(8 / 9) + 1e-5]; },
    marginale: function () { return [4.002, 1]; },
    tuffo: function () { return [3.6, 0.97]; },
    diffusione: function () { return [4.6, 1.02]; }
  };
  function schedaGeodetiche(pan, destra) {
    var st = { L: 4, E: 0.97, inc: 25, vel: 1 };
    var p0 = PRESET.rosetta(); st.L = p0[0]; st.E = p0[1];
    eq(pan, '(dr/dτ)² = E² − (1 − 2M/r)(1 + L²/r²)');
    nota(pan, t('Una particella di prova in caduta libera conserva l’energia E e il momento angolare L per unità di massa. Il moto radiale è quello di una pallina nel <b>potenziale efficace</b> V(r): rispetto a Newton c’è il termine −2ML²/r³, che vince a piccoli r e scava il pozzo che inghiotte le orbite. I massimi e minimi di V sono le orbite circolari: r = (L²/2M)(1 ± √(1 − 12M²/L²)). Per L² < 12M² non ce ne sono più: l’ultima orbita stabile (ISCO) è a <b>6M</b>; l’orbita circolare con E = 1 (marginalmente legata) è a <b>4M</b>; la sfera dei fotoni (L → ∞) a <b>3M</b>.',
      'A free-falling test particle conserves its energy E and angular momentum L per unit mass. Radial motion is that of a ball in the <b>effective potential</b> V(r): compared with Newton there is the extra term −2ML²/r³, which wins at small r and digs the well that swallows orbits. Maxima and minima of V are circular orbits: r = (L²/2M)(1 ± √(1 − 12M²/L²)). For L² < 12M² there are none left: the innermost stable circular orbit (ISCO) is at <b>6M</b>; the circular orbit with E = 1 (marginally bound) is at <b>4M</b>; the photon sphere (L → ∞) at <b>3M</b>.'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info = nota(pan);
    var m = mercurio();
    nota(pan, t('<b>Mercurio.</b> Nel campo debole un’orbita ellittica ruota di Δφ = 6πGM/(c²a(1 − e²)) a ogni giro: per Mercurio (a = 0,3871 UA, e = 0,2056, P = 87,97 giorni) sono ', '<b>Mercury.</b> In the weak field an elliptic orbit turns by Δφ = 6πGM/(c²a(1 − e²)) per revolution: for Mercury (a = 0.3871 AU, e = 0.2056, P = 87.97 days) that is ') +
      '<b class="bsiFX-num">' + (m.perOrbita * ARCSEC).toFixed(4) + '″</b>' + t(' per orbita × ', ' per orbit × ') + m.orbite.toFixed(1) + t(' orbite al secolo = ', ' orbits per century = ') + '<b class="bsiFX-num">' + m.arcsecSecolo.toFixed(2) + '″/' + t('secolo', 'century') + '</b>' +
      t(': esattamente lo scarto che la meccanica di Newton (con le perturbazioni degli altri pianeti, 532″) non spiegava. Fu la prima conferma della relatività generale (Einstein, 1915).', ': exactly the residual that Newtonian mechanics (with the perturbations of the other planets, 532″) could not explain. It was the first confirmation of general relativity (Einstein, 1915).'));
    var cv = null, S = null, T = null, sc = 0.1, scia = null, NS = 6000, nS = 0, pallina = null, piano = null, y = null, attesa = 0, cl = null, cont = 0;
    function grafico() {
      if (!cv) return;
      var xs = [], ys = [], E2 = st.E * st.E;
      for (var i = 0; i <= 400; i++) { var r = 2.05 * Math.pow(40 / 2.05, i / 400); xs.push(r); ys.push(veff(r, st.L)); }
      var oc = orbiteCircolari(st.L), punti = [];
      if (oc) { punti.push({ x: oc.stabile, y: veff(oc.stabile, st.L), col: '#5eead4', r: 4 }); punti.push({ x: oc.instabile, y: veff(oc.instabile, st.L), col: '#ff8a80', r: 4 }); }
      if (y) punti.push({ x: y[0], y: E2, col: '#ffd24a', r: 5 });
      var lo = Math.min(0.8, E2 - 0.05), hi = Math.max(1.08, E2 + 0.04);
      var P = F.grafico(cv, { serie: [{ x: xs, y: ys, col: '#6bcfff', larg: 2 }], punti: punti, linee: [{ y: E2, col: '#ffd24a', etich: 'E² = ' + E2.toFixed(4) }, { y: 1, col: '#34465f' }],
        xmin: 2, xmax: 40, ymin: lo, ymax: hi, xl: ['r / M', 'r / M'], yl: ['V(r)', 'V(r)'], descr: ['Potenziale efficace di Schwarzschild con il livello di energia della particella', 'Schwarzschild effective potential with the particle energy level'] });
      var q = P.q; q.save(); q.setLineDash([3, 4]); q.font = '10px system-ui,sans-serif';
      [[3, '#ffb86b', '3M'], [4, '#c792ea', '4M'], [6, '#5eead4', 'ISCO 6M']].forEach(function (z) { var x = P.X(z[0]); q.strokeStyle = z[1]; q.beginPath(); q.moveTo(x, 14); q.lineTo(x, P.H - 40); q.stroke(); q.fillStyle = z[1]; q.textAlign = 'left'; q.fillText(z[2], x + 3, 26); });
      q.restore();
    }
    function avanza(tau) {
      var fatto = 0, P = scia.geometry.attributes.position;
      while (fatto < tau) {
        var h = Math.min(passoAdatto(y[0]) * 0.5, tau - fatto); y = passoGeodetica(y, h, st.L, st.E); fatto += h;
        if (nS >= NS) { P.array.copyWithin(0, 3 * 1000); nS -= 1000; }
        var r = y[0] * sc; P.array[3 * nS] = r * Math.cos(y[2]); P.array[3 * nS + 1] = r * Math.sin(y[2]); P.array[3 * nS + 2] = 0; nS++;
        if (y[0] < 2.02) { attesa = 1.2; break; }
        if (y[0] > 70 && y[1] > 0) { attesa = 0.6; break; }
      }
    }
    function riparti() {
      cl = classifica(st.L, st.E);
      var r0;
      if (cl.tipo === 'legata' || cl.tipo === 'tuffo') r0 = cl.apo; else r0 = 60;
      if (!isFinite(r0) || r0 > 200) r0 = 60;
      var v2 = st.E * st.E - veff(r0, st.L);
      y = [r0, -Math.sqrt(Math.max(0, v2)), 0, 0];
      nS = 0; attesa = 0;
      if (scia) scia.geometry.setDrawRange(0, 0);
      if (piano) piano.rotation.x = st.inc * Math.PI / 180;
      /* un'orbita legata parte gia' con qualche giro disegnato: la rosetta si vede subito */
      if (scia && cl.tipo === 'legata') { var giri = 0; while (nS < 2600 && giri++ < 4000 && !attesa) avanza(2); }
      var nomi = { legata: t('orbita legata che precede (rosetta)', 'bound precessing orbit (rosette)'), tuffo: t('tuffo nell’orizzonte', 'plunge into the horizon'), diffusione: t('diffusione: arriva da lontano e riparte', 'scattering: comes in from far and leaves'), tuffoLibero: t('arriva da lontano e cade dentro', 'comes in from far and falls in') };
      var txt = t('Tipo di moto: ', 'Type of motion: ') + '<b>' + nomi[cl.tipo] + '</b>';
      if (cl.tipo === 'legata') {
        var dphi = precessioneIntegrale(cl.peri, cl.apo), pl = 2 / (1 / cl.peri + 1 / cl.apo);
        txt += '<br>' + t('pericentro ', 'periapsis ') + fmt(cl.peri) + ' M, ' + t('apocentro ', 'apoapsis ') + fmt(cl.apo) + ' M' +
          '<br>' + t('avanzamento per giro radiale: ', 'advance per radial period: ') + '<b class="bsiFX-num">' + fmt((dphi - 2 * Math.PI) * 180 / Math.PI) + '°</b> (' + t('campo debole 6πM/p: ', 'weak field 6πM/p: ') + fmt(6 * Math.PI / pl * 180 / Math.PI) + '°)';
      }
      var oc = orbiteCircolari(st.L);
      txt += '<br>' + (oc ? t('orbite circolari: stabile ', 'circular orbits: stable ') + fmt(oc.stabile) + ' M, ' + t('instabile ', 'unstable ') + fmt(oc.instabile) + ' M' : t('L² < 12M²: nessuna orbita circolare', 'L² < 12M²: no circular orbit'));
      info.innerHTML = txt;
      grafico();
    }
    return {
      tre: function (S0, T0, L3) {
        S = S0; T = T0;
        S.aggiungi(cieloStellato(T, 2500, 60, 7));
        S.aggiungi(bucoNero(T, 2 * sc));
        piano = new T.Group(); S.aggiungi(piano);
        piano.add(anello(T, 3 * sc, 0xffb86b, 0.9, true)); piano.add(anello(T, 4 * sc, 0xc792ea, 0.7, true)); piano.add(anello(T, 6 * sc, 0x5eead4, 0.95, false));
        for (var k = 10; k <= 40; k += 10) piano.add(anello(T, k * sc, 0x1d3550, 0.6, false));
        [['3M', 3, '#ffb86b'], ['4M', 4, '#c792ea'], ['ISCO', 6, '#5eead4']].forEach(function (z, i) { var e = L3.testo3d(T, z[0], z[2], 0.16); e.position.set(z[1] * sc * Math.cos(0.5 + i * 0.5), z[1] * sc * Math.sin(0.5 + i * 0.5), 0.12); piano.add(e); });
        var pos = new Float32Array(NS * 3), col = new Float32Array(NS * 3), g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setDrawRange(0, 0);
        scia = new T.Line(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false })); scia.frustumCulled = false; piano.add(scia);
        pallina = new T.Mesh(new T.SphereGeometry(0.07, 20, 14), new T.MeshBasicMaterial({ color: 0xffe08a })); piano.add(pallina);
        var bag = new T.Mesh(new T.SphereGeometry(0.16, 20, 14), new T.MeshBasicMaterial({ color: 0xffb86b, transparent: true, opacity: 0.25, blending: T.AdditiveBlending, depthWrite: false })); pallina.add(bag);
        S.didascalia.textContent = t('Orbite di una particella attorno a un buco nero di Schwarzschild, con ISCO (6M), orbita marginale (4M) e sfera dei fotoni (3M)', 'Particle orbits around a Schwarzschild black hole, with ISCO (6M), marginal orbit (4M) and photon sphere (3M)');
        S.inquadra(7.2, -0.8, 1.0);
        var sL, sE;
        F.scelta(ctl, ['Esempio', 'Example'], [['rosetta', t('rosetta (p = 10M, a = 30M)', 'rosette (p = 10M, a = 30M)')], ['whirl', 'zoom-whirl'], ['isco', t('circolare all’ISCO (6M)', 'circular at the ISCO (6M)')], ['marginale', t('E = 1, L = 4M: gira attorno a 4M', 'E = 1, L = 4M: whirls at 4M')], ['tuffo', t('tuffo (L = 3,6M)', 'plunge (L = 3.6M)')], ['diffusione', t('diffusione (E > 1)', 'scattering (E > 1)')]], 'rosetta', function (v) {
          var p = PRESET[v](); st.L = p[0]; st.E = p[1]; sL.value = st.L; sE.value = st.E; sL.dispatchEvent(new Event('input')); sE.dispatchEvent(new Event('input'));
        });
        sL = F.cursore(ctl, ['L (momento angolare, M)', 'L (angular momentum, M)'], 3, 6, 0.0005, st.L, function (v) { st.L = v; riparti(); }, function (v) { return v.toFixed(3); });
        sE = F.cursore(ctl, ['E (energia per unità di massa)', 'E (energy per unit mass)'], 0.9, 1.06, 0.00001, st.E, function (v) { st.E = v; riparti(); }, function (v) { return v.toFixed(5); });
        F.cursore(ctl, ['Inclinazione del piano (°)', 'Orbital plane inclination (°)'], 0, 80, 1, st.inc, function (v) { st.inc = v; if (piano) piano.rotation.x = v * Math.PI / 180; S.sporca = true; S.avvia(); });
        F.cursore(ctl, ['Velocità', 'Speed'], 0.25, 6, 0.25, st.vel, function (v) { st.vel = v; S.avvia(); });
        cv = telo(destra, 0.5);
        nota(destra, t('Il tempo è quello <b>proprio</b> della particella: attraversa l’orizzonte in un tempo finito. Un osservatore lontano invece la vedrebbe rallentare e arrossarsi senza mai vederla entrare (dt/dτ = E/(1 − 2M/r) → ∞).', 'Time is the particle’s <b>proper</b> time: it crosses the horizon in a finite time. A distant observer would instead see it slow down and redden without ever seeing it enter (dt/dτ = E/(1 − 2M/r) → ∞).'));
        F.alRidimensiona(grafico);
        riparti();
        S.ogniFotogramma(function (dt) {
          if (!y) return false;
          if (attesa > 0) { attesa -= dt; if (attesa <= 0) riparti(); return true; }
          avanza(st.vel * dt * 60);
          var C = scia.geometry.attributes.color;
          for (var i = 0; i < nS; i++) { var f = Math.pow(i / Math.max(1, nS - 1), 1.4), cc = y[0] < 6 ? [1, 0.55, 0.3] : [0.35, 0.9, 1]; C.array[3 * i] = cc[0] * (0.1 + 0.9 * f); C.array[3 * i + 1] = cc[1] * (0.1 + 0.9 * f); C.array[3 * i + 2] = cc[2] * (0.1 + 0.9 * f); }
          scia.geometry.attributes.position.needsUpdate = true; C.needsUpdate = true; scia.geometry.setDrawRange(0, nS);
          var rr = Math.max(2, y[0]) * sc; pallina.position.set(rr * Math.cos(y[2]), rr * Math.sin(y[2]), 0);
          if (++cont % 6 === 0) grafico();
          return true;
        });
      }
    };
  }

  /* ═══ 3. Curvatura: Flamm, deflessione, Shapiro, GPS ═════════════════════ */
  function schedaCurvatura(pan, destra) {
    var st = { vista: 'flamm', bSole: 1 };
    eq(pan, 'z(r) = 2√(2M(r − 2M))    α ≈ 4GM/(c²b)');
    nota(pan, t('La metrica di Schwarzschild nel piano equatoriale a t fissato è dl² = dr²/(1 − 2M/r) + r²dφ²: la stessa geometria di una superficie di rotazione nello spazio euclideo, il <b>paraboloide di Flamm</b>. I cerchi hanno ancora circonferenza 2πr, ma la distanza radiale tra due cerchi è maggiore di Δr (tra r = 3M e 6M è 4,14M invece di 3M). I fotoni seguono le geodetiche dello spaziotempo, non della superficie, ma il disegno mostra dove la curvatura è forte. Il colore è il ritmo di un orologio fermo: √(1 − 2M/r).',
      'The Schwarzschild metric in the equatorial plane at fixed t is dl² = dr²/(1 − 2M/r) + r²dφ²: the same geometry as a surface of revolution in Euclidean space, <b>Flamm’s paraboloid</b>. Circles still have circumference 2πr, but the radial distance between two circles exceeds Δr (between r = 3M and 6M it is 4.14M instead of 3M). Photons follow geodesics of spacetime, not of the surface, but the picture shows where curvature is strong. The colour is the rate of a static clock: √(1 − 2M/r).'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info = nota(pan);
    var gp = gps(R_GPS);
    nota(pan, t('<b>GPS.</b> I satelliti orbitano a r = 26 562 km. La gravità più debole fa correre i loro orologi più in fretta di ', '<b>GPS.</b> The satellites orbit at r = 26 562 km. The weaker gravity makes their clocks run faster by ') + '<b class="bsiFX-num">+' + gp.grav.toFixed(1) + ' μs/' + t('giorno', 'day') + '</b> (GM/c² · (1/R⊕ − 1/r))' +
      t('; la velocità (', '; their speed (') + (gp.v / 1000).toFixed(2) + ' km/s) ' + t('li rallenta di ', 'slows them by ') + '<b class="bsiFX-num">' + gp.cin.toFixed(1) + ' μs/' + t('giorno', 'day') + '</b> (v²/2c²)' + t('. Netto: ', '. Net: ') + '<b class="bsiFX-num">+' + gp.netto.toFixed(1) + ' μs/' + t('giorno', 'day') + '</b>' +
      t(', cioè circa 11 km di errore di posizione al giorno se non lo si correggesse. Per questo gli orologi dei satelliti sono regolati a terra a 10,229 999 995 43 MHz invece di 10,23 MHz.', ', i.e. about 11 km of position error per day if uncorrected. That is why the satellite clocks are set on the ground to 10.229 999 995 43 MHz instead of 10.23 MHz.'));
    var cv = null, S = null, T = null, L3 = null, gruppo = null, fotoni = [];
    function testoDeflessione() {
      var b = st.bSole * RSOLE, al = deflessioneSI(MSOLE, b) * ARCSEC;
      var dv = shapiro(MSOLE, UA, 0.723 * UA, b) * 1e6, dm = shapiro(MSOLE, UA, 1.524 * UA, b) * 1e6;
      info.innerHTML = t('Raggio che passa a b = ', 'Ray passing at b = ') + st.bSole.toFixed(1) + ' R☉ ' + t('dal Sole', 'from the Sun') + ':<br>' + t('deflessione ', 'deflection ') + '<b class="bsiFX-num">' + al.toFixed(3) + '″</b>' + (st.bSole === 1 ? t(' (Eddington, eclisse del 1919)', ' (Eddington, 1919 eclipse)') : '') +
        '<br>' + t('ritardo di Shapiro (andata e ritorno, congiunzione superiore): Venere ', 'Shapiro delay (round trip, superior conjunction): Venus ') + '<b class="bsiFX-num">' + dv.toFixed(0) + ' μs</b>, ' + t('Marte ', 'Mars ') + '<b class="bsiFX-num">' + dm.toFixed(0) + ' μs</b>' +
        '<br>' + t('Newton (luce come proiettile) darebbe metà: ', 'Newton (light as a projectile) would give half: ') + (al / 2).toFixed(3) + '″.';
    }
    function grafico() {
      if (!cv) return;
      if (st.vista === 'gps') {
        var xs = [], g1 = [], g2 = [], g3 = [];
        for (var i = 0; i <= 200; i++) { var h = 200e3 + i * 200e3, G1 = gps(R_TERRA + h); xs.push(h / 1e3); g1.push(G1.grav); g2.push(G1.cin); g3.push(G1.netto); }
        F.grafico(cv, { serie: [{ x: xs, y: g1, col: '#5eead4' }, { x: xs, y: g2, col: '#ff8a80' }, { x: xs, y: g3, col: '#ffd24a', larg: 2.5 }], punti: [{ x: (R_GPS - R_TERRA) / 1e3, y: gp.netto, col: '#ffd24a', r: 5 }, { x: R_TERRA * 0.5 / 1e3, y: 0, col: '#e6fffb', r: 4 }],
          linee: [{ y: 0, col: '#34465f' }], xl: ['quota (km)', 'altitude (km)'], yl: ['μs/giorno', 'μs/day'], legenda: [{ col: '#5eead4', etich: ['gravitazionale', 'gravitational'] }, { col: '#ff8a80', etich: ['cinematico', 'kinematic'] }, { col: '#ffd24a', etich: ['netto', 'net'] }],
          descr: ['Anticipo degli orologi in orbita circolare rispetto al suolo in funzione della quota', 'Gain of clocks in circular orbit relative to the ground versus altitude'] });
      } else {
        var bx = [], ex = [], dx = [], ser = [];
        for (i = 0; i <= 160; i++) { var lb = Math.log10(B_CRITICO * 1.02) + (3 - Math.log10(B_CRITICO * 1.02)) * i / 160, b = Math.pow(10, lb); bx.push(lb); ex.push(Math.log10(deflessione(b))); dx.push(Math.log10(4 / b)); ser.push(Math.log10(deflessioneSerie(b))); }
        F.grafico(cv, { serie: [{ x: bx, y: ex, col: '#5eead4', larg: 2.5 }, { x: bx, y: dx, col: '#ff8a80', tratt: true }, { x: bx, y: ser, col: '#ffd24a', larg: 1 }], xl: ['log₁₀(b/M)', 'log₁₀(b/M)'], yl: ['log₁₀ α (rad)', 'log₁₀ α (rad)'],
          legenda: [{ col: '#5eead4', etich: ['esatta (integrale)', 'exact (integral)'] }, { col: '#ff8a80', etich: ['4M/b', '4M/b'] }, { col: '#ffd24a', etich: ['+ 15πM²/4b² + …', '+ 15πM²/4b² + …'] }],
          descr: ['Angolo di deflessione della luce in funzione del parametro d’impatto: esatto e approssimazione di campo debole', 'Light deflection angle versus impact parameter: exact and weak-field approximation'] });
      }
    }
    function costruisciFlamm() {
      var sc = 0.15, NR = 64, NF = 120, rmax = 26, pos = [], col = [], idx = [], zf = function (r) { return -1.6 + 0.5 * flamm(r) * sc * 1.0; };
      for (var i = 0; i <= NR; i++) { var r = 2 + (rmax - 2) * Math.pow(i / NR, 1.6); for (var j = 0; j <= NF; j++) { var a = 2 * Math.PI * j / NF; pos.push(r * sc * Math.cos(a), r * sc * Math.sin(a), zf(r)); var d = dilatazione(Math.max(2.0001, r)); col.push(0.04 + 0.22 * d * d, 0.08 + 0.42 * d * d, 0.22 + 0.4 * d); } }
      for (i = 0; i < NR; i++) for (j = 0; j < NF; j++) { var A = i * (NF + 1) + j, B = A + NF + 1; idx.push(A, B, B + 1, A, B + 1, A + 1); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      gruppo.add(new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.75, metalness: 0.05, transparent: true, opacity: 0.92 })));
      /* reticolo: cerchi e raggi */
      var seg = [];
      [2.2, 3, 4, 6, 8, 10, 13, 16, 20, 26].forEach(function (r) { for (var j = 0; j < 120; j++) { var a = 2 * Math.PI * j / 120, b = 2 * Math.PI * (j + 1) / 120; seg.push(r * sc * Math.cos(a), r * sc * Math.sin(a), zf(r) + 0.004, r * sc * Math.cos(b), r * sc * Math.sin(b), zf(r) + 0.004); } });
      for (j = 0; j < 24; j++) { var a = 2 * Math.PI * j / 24; for (i = 0; i < 40; i++) { var r1 = 2 + 24 * Math.pow(i / 40, 1.6), r2 = 2 + 24 * Math.pow((i + 1) / 40, 1.6); seg.push(r1 * sc * Math.cos(a), r1 * sc * Math.sin(a), zf(r1) + 0.004, r2 * sc * Math.cos(a), r2 * sc * Math.sin(a), zf(r2) + 0.004); } }
      var gs = new T.BufferGeometry(); gs.setAttribute('position', new T.Float32BufferAttribute(seg, 3));
      gruppo.add(new T.LineSegments(gs, new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.22 })));
      gruppo.add(anello(T, 3 * sc, 0xffb86b, 0.9, true)); gruppo.children[gruppo.children.length - 1].position.z = zf(3) + 0.01;
      gruppo.add(anello(T, 6 * sc, 0x5eead4, 0.9, false)); gruppo.children[gruppo.children.length - 1].position.z = zf(6) + 0.01;
      /* gola dell'orizzonte */
      var gola = new T.Mesh(new T.CylinderGeometry(2 * sc, 2 * sc, 0.6, 48, 1, true), new T.MeshBasicMaterial({ color: 0x000000, side: T.DoubleSide }));
      gola.rotation.x = Math.PI / 2; gola.position.z = zf(2) - 0.3; gruppo.add(gola);
      /* raggi di luce sulla superficie */
      fotoni = [];
      for (var k = 0; k < 11; k++) {
        var b = 2.5 + k * 1.6, tr = tracciaFotone(-25, b, 1, 0, { rFuga: 26.5, passi: 1500, b: b }), pts = [];
        tr.punti.forEach(function (p) { var r = Math.hypot(p[0], p[1]); if (r <= 26.5) pts.push(new T.Vector3(p[0] * sc, p[1] * sc, zf(Math.max(2, r)) + 0.03)); });
        if (pts.length < 2) continue;
        var colr = tr.esito === 'cattura' ? 0xff8a80 : Math.abs(b - B_CRITICO) < 0.8 ? 0xffd24a : 0xfff3c4;
        gruppo.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: colr, transparent: true, opacity: 0.95 })));
        var s = new T.Mesh(new T.SphereGeometry(0.045, 12, 8), new T.MeshBasicMaterial({ color: colr })); gruppo.add(s);
        fotoni.push({ m: s, pts: pts, k: (k * 37) % pts.length });
      }
      var et = L3.testo3d(T, t('orizzonte r = 2M', 'horizon r = 2M'), '#e6fffb', 0.16); et.position.set(0, 0, zf(2) + 0.25); gruppo.add(et);
      var e2 = L3.testo3d(T, 'ISCO 6M', '#5eead4', 0.14); e2.position.set(6 * sc, 0, zf(6) + 0.18); gruppo.add(e2);
      S.didascalia.textContent = t('Paraboloide di Flamm: la geometria spaziale attorno a un buco nero, con raggi di luce', 'Flamm’s paraboloid: the spatial geometry around a black hole, with light rays');
    }
    var sat = [];
    function costruisciGPS() {
      var cvT = document.createElement('canvas'); cvT.width = 512; cvT.height = 256; var q = cvT.getContext('2d'), rnd = mulberry32(5);
      q.fillStyle = '#123d6b'; q.fillRect(0, 0, 512, 256);
      for (var i = 0; i < 70; i++) { var x = rnd() * 512, y = 40 + rnd() * 176, rr = 8 + rnd() * 30; q.fillStyle = rnd() < 0.5 ? '#3f7a3a' : '#7a6a3a'; q.beginPath(); q.ellipse(x, y, rr * 1.6, rr, rnd() * 3, 0, 2 * Math.PI); q.fill(); }
      q.fillStyle = '#e8f1f6'; q.fillRect(0, 0, 512, 18); q.fillRect(0, 238, 512, 18);
      var tex = new T.CanvasTexture(cvT);
      var terra = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshStandardMaterial({ map: tex, roughness: 0.8 })); terra.rotation.x = Math.PI / 2; gruppo.add(terra);
      var atm = new T.Mesh(new T.SphereGeometry(1.06, 48, 32), new T.MeshBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false })); gruppo.add(atm);
      var R = R_GPS / R_TERRA; sat = [];
      for (var p = 0; p < 6; p++) {
        var orb = new T.Group(); orb.rotation.z = p * Math.PI / 3; var inc = new T.Group(); inc.rotation.x = 55 * Math.PI / 180; orb.add(inc); gruppo.add(orb);
        inc.add(anello(T, R, 0x2a4a6e, 0.8, false));
        for (var s = 0; s < 4; s++) { var m = new T.Mesh(new T.BoxGeometry(0.12, 0.05, 0.05), new T.MeshStandardMaterial({ color: 0xffd24a, emissive: 0x665500 })); var pa = new T.Mesh(new T.BoxGeometry(0.02, 0.32, 0.08), new T.MeshStandardMaterial({ color: 0x3060c0, emissive: 0x102040 })); m.add(pa); inc.add(m); sat.push({ m: m, a: 2 * Math.PI * s / 4 + p * 0.5, R: R }); }
      }
      var e = L3.testo3d(T, t('+38,5 μs/giorno', '+38.5 μs/day'), '#ffd24a', 0.3); e.position.set(0, 0, R + 0.6); gruppo.add(e);
      S.didascalia.textContent = t('Costellazione GPS: 24 satelliti su 6 piani a 55°, a 20 200 km di quota', 'GPS constellation: 24 satellites in 6 planes at 55°, 20 200 km altitude');
    }
    function costruisciVista() {
      if (!S) return;
      S.pulisci(); S.aggiungi(cieloStellato(T, 2500, 60, 3)); gruppo = new T.Group(); S.aggiungi(gruppo); fotoni = []; sat = [];
      if (st.vista === 'gps') { costruisciGPS(); S.inquadra(14, -0.6, 1.1); } else { costruisciFlamm(); S.inquadra(8.5, -1.2, 0.95); }
      grafico();
      S.ogniFotogramma(function (dt) {
        fotoni.forEach(function (f) { f.k = (f.k + dt * 60) % f.pts.length; var p = f.pts[Math.floor(f.k)]; f.m.position.copy(p); });
        sat.forEach(function (s) { s.a += dt * 0.25; s.m.position.set(s.R * Math.cos(s.a), s.R * Math.sin(s.a), 0); s.m.rotation.z = s.a; });
        return true;
      });
    }
    return {
      tre: function (S0, T0, L30) {
        S = S0; T = T0; L3 = L30;
        F.scelta(ctl, ['Vista 3D', '3D view'], [['flamm', t('paraboloide di Flamm e raggi di luce', 'Flamm paraboloid and light rays')], ['gps', t('orologi dei satelliti GPS', 'GPS satellite clocks')]], st.vista, function (v) { st.vista = v; costruisciVista(); });
        F.cursore(ctl, ['Parametro d’impatto al Sole (R☉)', 'Impact parameter at the Sun (R☉)'], 1, 20, 0.5, st.bSole, function (v) { st.bSole = v; testoDeflessione(); });
        testoDeflessione();
        cv = telo(destra, 0.5);
        F.alRidimensiona(grafico);
        costruisciVista();
      }
    };
  }

  /* ═══ 4. Hawking ═════════════════════════════════════════════════════════ */
  var TCMB = 2.7255, ETA = 13.8e9 * ANNO;
  function schedaHawking(pan, destra) {
    var st = { lm: Math.log10(MSOLE) };
    eq(pan, 'T_H = ħc³/(8πGMk_B)    S = k_B A/(4ℓ_P²)    t_ev = 5120πG²M³/(ħc⁴)');
    nota(pan, t('Vicino all’orizzonte il vuoto quantistico non è vuoto per chi sta fuori: il buco nero emette come un corpo nero alla <b>temperatura di Hawking</b>, inversamente proporzionale alla massa. Un buco nero di una massa solare è a 62 nK, molto più freddo del fondo cosmico (2,725 K): oggi assorbe più di quanto emette. Uno piccolo è caldissimo, perde massa sempre più in fretta (P ∝ 1/M²) ed evapora in t ∝ M³. L’entropia di Bekenstein-Hawking è un quarto dell’area dell’orizzonte in unità di Planck: per il Sole sarebbe ~10⁷⁷ k_B, 10²⁰ volte quella del Sole vero.',
      'Near the horizon the quantum vacuum is not empty for an outside observer: the black hole radiates as a black body at the <b>Hawking temperature</b>, inversely proportional to its mass. A one-solar-mass hole is at 62 nK, far colder than the cosmic background (2.725 K): today it absorbs more than it emits. A small one is very hot, loses mass ever faster (P ∝ 1/M²) and evaporates in t ∝ M³. The Bekenstein–Hawking entropy is a quarter of the horizon area in Planck units: for the Sun it would be ~10⁷⁷ k_B, 10²⁰ times that of the actual Sun.'));
    var ctl = F.el('div'); pan.appendChild(ctl);
    var info = nota(pan);
    var Mcmb = massaPerT(TCMB), Meta = massaPerVita(ETA);
    nota(pan, t('Massa con T_H = T_CMB: ', 'Mass with T_H = T_CMB: ') + '<b class="bsiFX-num">' + Mcmb.toExponential(2) + ' kg</b>' + t(' (circa la Luna ×0,6). Massa che evapora proprio nell’età dell’universo (solo fotoni): ', ' (about 0.6 Moon masses). Mass that evaporates exactly in the age of the universe (photons only): ') + '<b class="bsiFX-num">' + Meta.toExponential(2) + ' kg</b>' +
      t(' — un buco nero primordiale di questa massa starebbe esplodendo adesso in raggi γ; contando tutte le particelle emesse il valore sale a ~5·10¹¹ kg. Nessuno è stato visto.', ' — a primordial black hole of this mass would be exploding right now in γ-rays; counting all emitted species the value rises to ~5·10¹¹ kg. None has been seen.'));
    var cv1 = null, cv2 = null, S = null, T = null, quanti = null, vel = null, orizz = null, alone = null, NQ = 1500, rnd = mulberry32(9);
    function stato() { var M = Math.pow(10, st.lm); return { M: M, T: hawkingT(M), S: entropia(M), P: potenza(M), tev: evaporazione(M), rs: raggioSchwarzschild(M) }; }
    function testo() {
      var s = stato(), anni = s.tev / ANNO;
      info.innerHTML = 'M = <b class="bsiFX-num">' + s.M.toExponential(3) + ' kg</b> = ' + (s.M / MSOLE).toExponential(3) + ' M☉' +
        '<br>r_s = 2GM/c² = <b class="bsiFX-num">' + (s.rs >= 1 ? fmt(s.rs) + ' m' : s.rs.toExponential(2) + ' m') + '</b>' +
        '<br>T_H = <b class="bsiFX-num">' + s.T.toExponential(3) + ' K</b> ' + (s.T < TCMB ? t('(più freddo del fondo cosmico: cresce)', '(colder than the CMB: it grows)') : t('(più caldo del fondo cosmico: evapora)', '(hotter than the CMB: it evaporates)')) +
        '<br>' + t('picco di Wien ', 'Wien peak ') + 'λ = ' + (2.897771955e-3 / s.T).toExponential(2) + ' m' +
        '<br>S/k_B = <b class="bsiFX-num">' + s.S.toExponential(3) + '</b>' +
        '<br>P = <b class="bsiFX-num">' + s.P.toExponential(3) + ' W</b>' +
        '<br>t_ev = <b class="bsiFX-num">' + anni.toExponential(3) + t(' anni', ' years') + '</b>' + (anni < 13.8e9 ? t(' (meno dell’età dell’universo)', ' (less than the age of the universe)') : '');
    }
    function grafici() {
      if (!cv1) return;
      var xs = [], yT = [], yt = [], s = stato();
      for (var i = 0; i <= 200; i++) { var lm = 6 + 34 * i / 200, M = Math.pow(10, lm); xs.push(lm); yT.push(Math.log10(hawkingT(M))); yt.push(Math.log10(evaporazione(M) / ANNO)); }
      F.grafico(cv1, { serie: [{ x: xs, y: yT, col: '#ff8a80', larg: 2.5 }], punti: [{ x: st.lm, y: Math.log10(s.T), col: '#ffd24a', r: 5 }], linee: [{ y: Math.log10(TCMB), col: '#6bcfff', etich: 'T_CMB = 2,725 K' }],
        xmin: 6, xmax: 40, xl: ['log₁₀(M / kg)', 'log₁₀(M / kg)'], yl: ['log₁₀(T_H / K)', 'log₁₀(T_H / K)'], descr: ['Temperatura di Hawking in funzione della massa, scala logaritmica', 'Hawking temperature versus mass, log scale'] });
      F.grafico(cv2, { serie: [{ x: xs, y: yt, col: '#5eead4', larg: 2.5 }], punti: [{ x: st.lm, y: Math.log10(s.tev / ANNO), col: '#ffd24a', r: 5 }], linee: [{ y: Math.log10(13.8e9), col: '#ffd24a', etich: t('età dell’universo', 'age of the universe') }],
        xmin: 6, xmax: 40, xl: ['log₁₀(M / kg)', 'log₁₀(M / kg)'], yl: ['log₁₀(t_ev / anni)', 'log₁₀(t_ev / yr)'], descr: ['Tempo di evaporazione in funzione della massa: retta di pendenza 3 in scala logaritmica', 'Evaporation time versus mass: a slope-3 line in log scale'] });
    }
    function coloreT(Tk) {
      /* dalla radio (rosso scuro) ai raggi γ (viola-bianco) su scala logaritmica */
      var x = Math.max(0, Math.min(1, (Math.log10(Tk) + 8) / 20));
      var C = [[0.5, 0.05, 0.05], [1, 0.35, 0.1], [1, 0.9, 0.5], [0.7, 0.85, 1], [0.75, 0.55, 1], [1, 1, 1]], f = x * (C.length - 1), i = Math.min(C.length - 2, Math.floor(f)), u = f - i;
      return [C[i][0] + (C[i + 1][0] - C[i][0]) * u, C[i][1] + (C[i + 1][1] - C[i][1]) * u, C[i][2] + (C[i + 1][2] - C[i][2]) * u];
    }
    function rv() { return 0.35 + 0.08 * (st.lm - 6); } /* raggio visivo (logaritmico) dell'orizzonte */
    function nuovoQuanto(i, ovunque) {
      var s = stato(), z = 2 * rnd() - 1, a = 2 * Math.PI * rnd(), q = Math.sqrt(1 - z * z), R = rv(), dentro = s.T < TCMB;
      var r = ovunque ? R + rnd() * 5 : (dentro ? R + 5 : R * 1.02);
      var P = quanti.geometry.attributes.position.array; P[3 * i] = r * q * Math.cos(a); P[3 * i + 1] = r * q * Math.sin(a); P[3 * i + 2] = r * z;
      vel[i] = (dentro ? -1 : 1) * (0.6 + 1.4 * rnd());
      var C = quanti.geometry.attributes.color.array, cc = dentro ? [0.35, 0.6, 1] : coloreT(s.T), k = 0.5 + 0.5 * rnd();
      C[3 * i] = cc[0] * k; C[3 * i + 1] = cc[1] * k; C[3 * i + 2] = cc[2] * k;
    }
    function aggiorna3D() {
      if (!S) return;
      var R = rv(); orizz.scale.setScalar(R); alone.scale.setScalar(R);
      for (var i = 0; i < NQ; i++) nuovoQuanto(i, true);
      quanti.geometry.attributes.position.needsUpdate = true; quanti.geometry.attributes.color.needsUpdate = true;
      S.didascalia.textContent = t('Buco nero di ', 'Black hole of ') + Math.pow(10, st.lm).toExponential(1) + ' kg: ' + t('quanti di Hawking a ', 'Hawking quanta at ') + stato().T.toExponential(1) + ' K';
      S.sporca = true; S.avvia();
    }
    F.cursore(ctl, ['log₁₀(massa / kg)', 'log₁₀(mass / kg)'], 8, 40, 0.1, st.lm, function (v) { st.lm = v; testo(); grafici(); aggiorna3D(); }, function (v) { return v.toFixed(1); });
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:2px' }); ctl.appendChild(es);
    [[t('Sgr A*', 'Sgr A*'), Math.log10(4.3e6 * MSOLE)], [t('10 M☉', '10 M☉'), Math.log10(10 * MSOLE)], ['1 M☉', Math.log10(MSOLE)], [t('Luna', 'Moon'), Math.log10(7.35e22)], [t('primordiale', 'primordial'), Math.log10(Meta)]].forEach(function (p) {
      F.bottone(es, [p[0], p[0]], function () { st.lm = p[1]; var inp = ctl.querySelector('input[type=range]'); inp.value = p[1]; inp.dispatchEvent(new Event('input')); });
    });
    testo();
    return {
      tre: function (S0, T0) {
        S = S0; T = T0;
        S.aggiungi(cieloStellato(T, 2000, 60, 21));
        orizz = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshBasicMaterial({ color: 0x000000 })); S.aggiungi(orizz);
        alone = bucoNero(T, 1).children[1]; S.aggiungi(alone);
        var pos = new Float32Array(NQ * 3), col = new Float32Array(NQ * 3), g = new T.BufferGeometry(); vel = new Float32Array(NQ);
        g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
        quanti = new T.Points(g, new T.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false })); quanti.frustumCulled = false; S.aggiungi(quanti);
        S.inquadra(11, -0.7, 1.15);
        aggiorna3D();
        S.ogniFotogramma(function (dt) {
          var P = quanti.geometry.attributes.position.array, R = rv(), s = stato(), v0 = Math.max(0.3, Math.min(3, 0.4 + 0.1 * (Math.log10(s.T) + 8)));
          for (var i = 0; i < NQ; i++) {
            var x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2], r = Math.sqrt(x * x + y * y + z * z), k = 1 + vel[i] * v0 * dt / r;
            P[3 * i] = x * k; P[3 * i + 1] = y * k; P[3 * i + 2] = z * k;
            if (r > R + 5.5 || r < R) nuovoQuanto(i, false);
          }
          quanti.geometry.attributes.position.needsUpdate = true; quanti.geometry.attributes.color.needsUpdate = true;
          return true;
        });
        cv1 = telo(destra, 0.45); cv2 = telo(destra, 0.45);
        grafici(); F.alRidimensiona(grafici);
      }
    };
  }

  F.sezione('sastrobh', {
    titolo: ['🕳️ Buchi neri e relatività generale', '🕳️ Black holes and general relativity'],
    sotto: ['Lo spaziotempo di Schwarzschild in 3D: un buco nero calcolato fotone per fotone, le orbite attorno all’orizzonte, la curvatura e i suoi effetti misurabili (Mercurio, la luce deviata dal Sole, il GPS), la radiazione di Hawking.', 'Schwarzschild spacetime in 3D: a black hole computed photon by photon, orbits around the horizon, curvature and its measurable effects (Mercury, starlight bent by the Sun, GPS), Hawking radiation.'],
    schede: [
      { nome: ['🕳️ Buco nero (ray tracing)', '🕳️ Black hole (ray tracing)'], costruisci: scheda3D(schedaRaggi) },
      { nome: ['🌀 Geodetiche e orbite', '🌀 Geodesics and orbits'], costruisci: scheda3D(schedaGeodetiche) },
      { nome: ['🕸️ Curvatura, luce e GPS', '🕸️ Curvature, light and GPS'], costruisci: scheda3D(schedaCurvatura) },
      { nome: ['🔥 Radiazione di Hawking', '🔥 Hawking radiation'], costruisci: scheda3D(schedaHawking) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
