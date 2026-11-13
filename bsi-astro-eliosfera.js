/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-eliosfera.js — 🌞 L'eliosfera (fase 4 del progetto, §5.4 e §7.3)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v254)
   Lo standard dell'astronomia del progetto chiede le strutture fisiche come
   superfici calcolate e nominate sulla figura, le misure vere con la fonte, le
   scale dichiarate e la regia (dal Sole all'eliopausa senza salti). L'eliosfera
   è la bolla che il vento solare scava nel mezzo interstellare: qui c'è tutta,
   con le due sonde che l'hanno attraversata.

   LA FISICA
   · Vento solare radiale a velocità v; il Sole ruota (periodo siderale
     25,38 giorni, Ω = 2,865×10⁻⁶ rad/s), il campo magnetico congelato nel
     plasma si avvolge nella spirale di Parker (1958):
       φ(r) = φ₀ − Ω (r − r₀)/v,    tan ψ = Ω r cos(latitudine)/v,
       B_r = B₀ (r₀/r)²,  B_φ = −B_r tan ψ.
     A 1 UA con v = 400 km/s: ψ = 47°.
   · Shock di terminazione: dove la pressione dinamica del vento ρv², che cala
     come 1/r², scende al livello della pressione dell'eliosfera esterna:
       r_TS ≈ r₁ √(ρ₁ v² / P).   Stima di ordine di grandezza, dichiarata.
   · Eliopausa: superficie di separazione fra il vento solare e il gas
     interstellare. La forma è quella del semicorpo di Rankine (sorgente in
     una corrente uniforme, il modello idrodinamico più semplice, Parker 1961):
       r(α) = R₀ / cos(α/2),  α = angolo dal naso; la coda tende a un cilindro
     di raggio 2R₀.

   LE MISURE (fonti: NASA/JPL, Stone et al. Science 2005, Nature 2008,
   Science 2013; Nature Astronomy 2019; McComas et al. IBEX, Science 2009;
   ApJS 2015)
   · Voyager 1: shock di terminazione il 16 dicembre 2004 a 94,0 UA; eliopausa
     il 25 agosto 2012 a 121,6 UA. Voyager 2: shock il 30 agosto 2007 a 83,7 UA
     (più volte, 84 UA circa); eliopausa il 5 novembre 2018 a 119,0 UA.
   · Il gas interstellare arriva da longitudine eclittica 255,7°, latitudine
     5,1°, a circa 26 km/s (IBEX e Ulysses). Il «nastro» di IBEX: un cerchio di
     neutri energetici centrato a circa (221°, 39°) e di raggio circa 74°.
   · Direzioni delle sonde (≈, ±2°): Voyager 1 longitudine 256°, latitudine
     +35°; Voyager 2 longitudine 290°, latitudine −38°.

   ONESTA'
   · La forma 3D delle superfici è un modello: le Voyager le hanno toccate in
     due punti. L'eliosfera vera è asimmetrica (Voyager 2 ha trovato i confini
     più vicini, per il campo magnetico interstellare) e la coda non è mai stata
     misurata: alcuni modelli la vogliono lunga, altri tozza.
   · Se davanti all'eliosfera ci sia un bow shock o solo un'onda di prua è
     dibattuto (IBEX 2012: velocità interstellare troppo bassa per uno shock).
   · Le distanze delle sonde fra le date note sono interpolate linearmente; dopo
     l'ultima data a velocità costante (17,0 e 15,4 km/s).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI, RAD = PI / 180;
  var UA = 1.495978707e11, OMEGA = 2 * PI / (25.38 * 86400), MP = 1.67262192e-27, ANNO = 365.25 * 86400, EPS = 23.4393 * RAD;

  /* ═══ 1. IL CALCOLO ════════════════════════════════════════════════════ */
  /** Angolo della spirale di Parker (gradi) a distanza r (UA), velocità v (km/s), latitudine eliografica (gradi). */
  function angoloParker(r, v, lat) { return Math.atan(OMEGA * r * UA * Math.cos((lat || 0) * RAD) / (v * 1e3)) / RAD; }
  /** Avvolgimento della spirale: radianti di rotazione per UA percorsa. */
  function avvolgimento(v) { return OMEGA * UA / (v * 1e3); }
  /** Campo di Parker a r (UA): componenti in nT, con B_r(1 UA) = B1r. */
  function campo(r, v, B1r) { var Br = B1r / (r * r), Bp = -Br * Math.tan(angoloParker(r, v) * RAD); return { Br: Br, Bphi: Bp, B: Math.hypot(Br, Bp) }; }
  /** Pressione dinamica del vento a r (UA): n1 in cm⁻³ a 1 UA, v in km/s → pascal. */
  function pressioneVento(r, n1, v) { return n1 * 1e6 * MP * Math.pow(v * 1e3, 2) / (r * r); }
  /** Distanza dello shock di terminazione (UA) per la pressione esterna P (Pa). */
  function shock(n1, v, P) { return Math.sqrt(pressioneVento(1, n1, v) / P); }
  /** Pressione esterna che mette lo shock a r (UA). */
  function pressionePer(r, n1, v) { return pressioneVento(r, n1, v); }
  /** Eliopausa del semicorpo di Rankine: distanza a un angolo α (gradi) dal naso. */
  function eliopausa(alfa, R0) { var c = Math.cos(alfa * RAD / 2); return c > 1e-6 ? R0 / c : Infinity; }
  /** Raggio della coda (distanza dall'asse) a un angolo α. */
  function raggioCoda(alfa, R0) { return eliopausa(alfa, R0) * Math.sin(alfa * RAD); }
  /** Forma indicativa dello shock (non misurata fuori dai due punti delle Voyager). */
  function formaShock(alfa, R) { return R * (1 + 0.45 * (1 - Math.cos(alfa * RAD))); }
  function versore(lon, lat) { return [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)]; }
  function angolo(a, b) { return Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) / RAD; }
  /** Da coordinate equatoriali (gradi) a eclittiche (gradi). */
  function eclittiche(ra, dec) {
    var a = ra * RAD, d = dec * RAD, sb = Math.sin(d) * Math.cos(EPS) - Math.cos(d) * Math.sin(EPS) * Math.sin(a);
    var l = Math.atan2(Math.sin(a) * Math.cos(EPS) + Math.tan(d) * Math.sin(EPS), Math.cos(a));
    return { lon: ((l / RAD) % 360 + 360) % 360, lat: Math.asin(sb) / RAD };
  }
  var NASO = { lon: 255.7, lat: 5.1, v: 26 }, NASTRO = { lon: 221, lat: 39, raggio: 74 };
  var SONDE = {
    v1: { nome: 'Voyager 1', col: '#ffd24a', lon: 256, lat: 35, kms: 17.0,
      tappe: [[1977.68, 1.0, 'lancio'], [1979.17, 5.2, 'Giove'], [1980.87, 9.5, 'Saturno'], [2004.96, 94.0, 'shock di terminazione'], [2012.65, 121.6, 'eliopausa']] },
    v2: { nome: 'Voyager 2', col: '#5eead4', lon: 290, lat: -38, kms: 15.4,
      tappe: [[1977.64, 1.0, 'lancio'], [1979.52, 5.2, 'Giove'], [1981.65, 9.6, 'Saturno'], [1986.07, 19.1, 'Urano'], [1989.65, 30.1, 'Nettuno'], [2007.66, 83.7, 'shock di terminazione'], [2018.85, 119.0, 'eliopausa']] }
  };
  /** Distanza della sonda (UA) all'anno decimale a. */
  function distanza(s, a) {
    var T = SONDE[s].tappe; if (a <= T[0][0]) return T[0][1];
    for (var i = 1; i < T.length; i++) if (a <= T[i][0]) { var u = (a - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[i - 1][1] + u * (T[i][1] - T[i - 1][1]); }
    var L = T[T.length - 1]; return L[1] + SONDE[s].kms * 1e3 * ANNO / UA * (a - L[0]);
  }
  function oggiAnno() { var d = new Date(); return d.getFullYear() + (d - new Date(d.getFullYear(), 0, 1)) / (365.25 * 864e5); }
  /** Tempo di viaggio della luce (ore) per r UA. */
  function luceOre(r) { return r * UA / 299792458 / 3600; }

  F.calcolo.eliosfera = { angoloParker: angoloParker, avvolgimento: avvolgimento, campo: campo, pressioneVento: pressioneVento, shock: shock, pressionePer: pressionePer, eliopausa: eliopausa, raggioCoda: raggioCoda, formaShock: formaShock, versore: versore, angolo: angolo, eclittiche: eclittiche, distanza: distanza, luceOre: luceOre, NASO: NASO, NASTRO: NASTRO, SONDE: SONDE, OMEGA: OMEGA };

  /* ═══ 2. LE ETICHETTE DI STATO ══════════════════════════════════════════ */
  var STATI = { misurato: ['MISURATO', '#5eead4'], modello: ['MODELLO', '#6bb7ff'], dibattuto: ['DIBATTUTO', '#ffd24a'] };
  function stato(k) { var s = STATI[k]; return '<span style="display:inline-block;font:800 10px/1 system-ui,sans-serif;letter-spacing:.06em;color:#04121c;background:' + s[1] + ';border-radius:5px;padding:3px 6px;margin-right:6px;vertical-align:1px">' + s[0] + '</span>'; }
  function blocco(div, k, titolo, testo) { div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: stato(k) + '<b>' + titolo + '</b><br>' + testo, style: 'margin:8px 0' })); }
  function num(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); }
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }

  /* ═══ 3. LA SCENA 3D ═══════════════════════════════════════════════════ */
  function schedaTre(div) {
    var g = griglia(div), o = { scala: 'log', R0: 112, RTS: 85, v: 400, nastro: true }, S = null, T = null, L3 = null;
    F.scelta(g.pan, ['Scala delle distanze', 'Distance scale'], [['log', ['Logaritmica (dal Sole all\'eliopausa)', 'Logarithmic (Sun to heliopause)']], ['lin', ['Lineare (vera)', 'Linear (true)']]], o.scala, function (v) { o.scala = v; costruisci(); });
    F.cursore(g.pan, ['Eliopausa al naso R₀ (UA)', 'Heliopause at the nose R₀ (AU)'], 100, 130, 1, o.R0, function (v) { o.R0 = v; costruisci(); }, function (v) { return v + ' UA'; });
    F.cursore(g.pan, ['Shock di terminazione al naso (UA)', 'Termination shock at the nose (AU)'], 70, 100, 1, o.RTS, function (v) { o.RTS = v; costruisci(); }, function (v) { return v + ' UA'; });
    F.cursore(g.pan, ['Velocità del vento solare (km/s)', 'Solar wind speed (km/s)'], 300, 800, 10, o.v, function (v) { o.v = v; costruisci(); }, function (v) { return v + ' km/s'; });
    var lab = F.el('label', { style: 'display:flex;align-items:center;gap:10px;min-height:36px;width:100%' }), cb = F.el('input', { type: 'checkbox', style: 'width:20px;height:20px;margin:0' }); cb.checked = true;
    cb.addEventListener('change', function () { o.nastro = cb.checked; costruisci(); }); lab.appendChild(cb); lab.appendChild(F.el('span', { testo: t('Nastro di IBEX (proiettato)', 'IBEX ribbon (projected)') })); g.pan.appendChild(lab);
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info);
    function s(r) { return o.scala === 'log' ? 3.2 * Math.log10(1 + r) : r / 12; }
    function punto(dir, r) { var k = s(r); return [dir[0] * k, dir[1] * k, dir[2] * k]; }
    function costruisci() {
      var n = versore(NASO.lon, NASO.lat), v1 = versore(SONDE.v1.lon, SONDE.v1.lat), v2 = versore(SONDE.v2.lon, SONDE.v2.lat), a1 = angolo(n, v1), a2 = angolo(n, v2);
      info.innerHTML = stato('modello') + t('Superfici: eliopausa come semicorpo di Rankine r = R₀/cos(α/2), shock di forma indicativa. ', 'Surfaces: heliopause as a Rankine half-body r = R₀/cos(α/2), shock of indicative shape. ') +
        t('Nella direzione di Voyager 1 (', 'Along Voyager 1 (') + num(a1, 0) + t('° dal naso) il modello dà l\'eliopausa a ', '° from the nose) the model puts the heliopause at ') + '<b class="bsiFX-num">' + num(eliopausa(a1, o.R0)) + ' UA</b>' + t(', misurata a 121,6; per Voyager 2 (', ', measured at 121.6; for Voyager 2 (') + num(a2, 0) + '°) <b class="bsiFX-num">' + num(eliopausa(a2, o.R0)) + ' UA</b>' + t(', misurata a 119,0. Un modello simmetrico non riproduce l\'asimmetria vera.', ', measured at 119.0. A symmetric model cannot reproduce the real asymmetry.') +
        '<br>' + stato('misurato') + t('I punti gialli e verdi sulle traiettorie sono gli attraversamenti misurati.', 'The yellow and green dots on the trajectories are the measured crossings.') +
        (o.scala === 'log' ? '<br><small>' + t('Scala logaritmica: distanza disegnata ∝ log(1 + r/UA). Il Sole non è in scala. Colori convenzionali.', 'Logarithmic scale: drawn distance ∝ log(1 + r/AU). The Sun is not to scale. Conventional colours.') + '</small>' : '<br><small>' + t('Scala lineare: la Terra sta a 1 UA, quasi nel Sole a questa scala. Colori convenzionali.', 'Linear scale: the Earth is at 1 AU, almost inside the Sun at this scale. Conventional colours.') + '</small>');
      if (!S) return;
      S.pulisci(); var gr = new T.Group(); S.aggiungi(gr);
      /* base ortonormale con il naso lungo e1 */
      var e1 = n, tmp = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], e2 = norma(vett(tmp, e1)), e3 = vett(e1, e2);
      function dirAlfa(al, be) { var ca = Math.cos(al * RAD), sa = Math.sin(al * RAD), cb = Math.cos(be), sb = Math.sin(be); return [e1[0] * ca + (e2[0] * cb + e3[0] * sb) * sa, e1[1] * ca + (e2[1] * cb + e3[1] * sb) * sa, e1[2] * ca + (e2[2] * cb + e3[2] * sb) * sa]; }
      function superficie(fr, amax, col, op, nome) {
        var NA = 60, NB = 48, pos = [], idx = [];
        for (var i = 0; i <= NA; i++) { var al = amax * i / NA; for (var j = 0; j <= NB; j++) { var d = dirAlfa(al, 2 * PI * j / NB), p = punto(d, fr(al)); pos.push(p[0], p[1], p[2]); } }
        for (var a = 0; a < NA; a++) for (var b = 0; b < NB; b++) { var p0 = a * (NB + 1) + b, p1 = p0 + NB + 1; idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1); }
        var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        var m = new T.Mesh(geo, new T.MeshPhongMaterial({ color: col, transparent: true, opacity: op, side: T.DoubleSide, depthWrite: false, shininess: 40 })); m.name = nome; gr.add(m);
        var bordi = []; for (var a2 = 0; a2 <= NA; a2 += 10) { var anello = []; for (var b2 = 0; b2 <= NB; b2++) { var k2 = (a2 * (NB + 1) + b2) * 3; anello.push([pos[k2], pos[k2 + 1], pos[k2 + 2]]); } gr.add(L3.linea(T, anello, col, Math.min(0.5, op * 2.2))); }
      }
      superficie(function (al) { return formaShock(al, o.RTS); }, 180, 0xff9a3c, 0.16, 'shock di terminazione');
      superficie(function (al) { return eliopausa(al, o.R0); }, 150, 0x4aa8ff, 0.13, 'eliopausa');
      /* il Sole e le orbite dei pianeti */
      gr.add(L3.sfera(T, o.scala === 'log' ? 0.25 : 0.35, 0xffd27a, 0, 0, 0, true));
      [[1, 'Terra'], [5.2, 'Giove'], [9.58, 'Saturno'], [19.2, 'Urano'], [30.07, 'Nettuno']].forEach(function (p) {
        var pts = []; for (var k = 0; k <= 96; k++) { var f = 2 * PI * k / 96; pts.push(punto([Math.cos(f), Math.sin(f), 0], p[0])); }
        gr.add(L3.linea(T, pts, 0x7fa6c9, 0.45));
        if (o.scala === 'log' || p[0] > 15) { var et = L3.testo3d(T, t(p[1], { Terra: 'Earth', Giove: 'Jupiter', Saturno: 'Saturn', Urano: 'Uranus', Nettuno: 'Neptune' }[p[1]]), '#9fb3c8', 0.28); var q = punto([0.71, -0.71, 0], p[0]); et.position.set(q[0], q[1], q[2] + 0.15); gr.add(et); }
      });
      /* la spirale di Parker nel piano dell'eclittica, fino allo shock */
      var w = avvolgimento(o.v);
      for (var b = 0; b < 2; b++) {
        var pts = [], f0 = b * PI;
        for (var r = 0.02; ; r *= 1.004) { var f = f0 - w * r, d = [Math.cos(f), Math.sin(f), 0], al = angolo(n, d); if (r > formaShock(al, o.RTS)) break; pts.push(punto(d, r)); if (pts.length > 4000) break; }
        gr.add(L3.linea(T, pts, 0xffe08a, 0.42));
      }
      /* le sonde */
      var oggi = oggiAnno();
      ['v1', 'v2'].forEach(function (k) {
        var sd = SONDE[k], d = versore(sd.lon, sd.lat), R = distanza(k, oggi), col = parseInt(sd.col.slice(1), 16), pts = [];
        for (var i = 0; i <= 200; i++) pts.push(punto(d, R * i / 200));
        gr.add(L3.linea(T, pts, col, 0.95));
        sd.tappe.slice(-2).forEach(function (tp) { var p = punto(d, tp[1]), m = L3.sfera(T, 0.12, col, p[0], p[1], p[2], true); gr.add(m); });
        var p = punto(d, R), et = L3.testo3d(T, sd.nome + ' · ' + num(R, 0) + ' UA', sd.col, 0.36); et.position.set(p[0], p[1], p[2] + 0.35); gr.add(et);
      });
      /* il vento interstellare: frecce che arrivano dal naso */
      for (var i2 = -1; i2 <= 1; i2++) for (var j2 = -1; j2 <= 1; j2++) {
        var off = [e2[0] * i2 * 2.2 + e3[0] * j2 * 2.2, e2[1] * i2 * 2.2 + e3[1] * j2 * 2.2, e2[2] * i2 * 2.2 + e3[2] * j2 * 2.2], k0 = s(o.R0) * 1.75, k1 = s(o.R0) * 1.3;
        gr.add(L3.freccia(T, [n[0] * k0 + off[0], n[1] * k0 + off[1], n[2] * k0 + off[2]], [n[0] * k1 + off[0], n[1] * k1 + off[1], n[2] * k1 + off[2]], 0xb48cff, 0.3));
      }
      var pv = punto(n, o.R0 * (o.scala === 'log' ? 2.4 : 1.9)), ev = L3.testo3d(T, t('gas interstellare · 26 km/s', 'interstellar gas · 26 km/s'), '#c9b3ff', 0.36); ev.position.set(pv[0], pv[1], pv[2] + s(o.R0) * 0.45); gr.add(ev);
      /* i nomi sulle superfici */
      [[t('shock di terminazione', 'termination shock'), function () { return formaShock(75, o.RTS); }, 75, '#ffb070', -PI / 2], [t('eliosheath', 'heliosheath'), function () { return (formaShock(120, o.RTS) + eliopausa(120, o.R0)) / 2; }, 120, '#e6c7ff', -PI / 2], [t('eliopausa', 'heliopause'), function () { return eliopausa(55, o.R0); }, 55, '#8cc8ff', PI / 2], [t('naso', 'nose'), function () { return eliopausa(0, o.R0); }, 0, '#8cc8ff', 0]].forEach(function (x) {
        var d = dirAlfa(x[2], x[4]), p = punto(d, x[1]()), et = L3.testo3d(T, x[0], x[3], 0.38); et.position.set(p[0], p[1], p[2]); gr.add(et);
      });
      /* il nastro di IBEX, proiettato sull'eliopausa */
      if (o.nastro) {
        var c = versore(NASTRO.lon, NASTRO.lat), u1 = norma(vett(Math.abs(c[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], c)), u2 = vett(c, u1), pn = [];
        for (var q = 0; q <= 180; q++) { var be = 2 * PI * q / 180, ra = NASTRO.raggio * RAD, d2 = [c[0] * Math.cos(ra) + (u1[0] * Math.cos(be) + u2[0] * Math.sin(be)) * Math.sin(ra), c[1] * Math.cos(ra) + (u1[1] * Math.cos(be) + u2[1] * Math.sin(be)) * Math.sin(ra), c[2] * Math.cos(ra) + (u1[2] * Math.cos(be) + u2[2] * Math.sin(be)) * Math.sin(ra)]; pn.push(punto(d2, Math.min(eliopausa(angolo(n, d2), o.R0), 400) * 1.02)); }
        gr.add(L3.linea(T, pn, 0xff7ad9, 0.95));
        var pc = pn[45], en = L3.testo3d(T, t('nastro IBEX', 'IBEX ribbon'), '#ff9ae6', 0.32); en.position.set(pc[0], pc[1], pc[2] + 0.3); gr.add(en);
      }
      S.inquadra(s(o.R0) * 3.3, (NASO.lon - 90) * RAD, 1.25);   /* di profilo: il naso a destra, la coda a sinistra */
      S.didascalia.textContent = t('Eliosfera', 'Heliosphere') + ' · ' + (o.scala === 'log' ? t('scala logaritmica', 'logarithmic scale') : t('scala lineare', 'linear scale')) + ' · ' + t('eclittica: x verso il punto vernale, z a nord', 'ecliptic: x to the vernal point, z north');
    }
    var L3g = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); g.dx.appendChild(attesa);
    costruisci();
    if (!L3g) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
    L3g.stile(); L3g.caricaThree().then(function () { attesa.remove(); S = new L3g.Scena(g.dx, 0.75); g.dx.insertBefore(S.box, g.dx.firstChild); T = globale.THREE; L3 = L3g; setTimeout(costruisci, 0); }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
  }
  function vett(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norma(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  /* ═══ 4. LA SPIRALE DI PARKER ═══════════════════════════════════════════ */
  function schedaParker(div) {
    var g = griglia(div), o = { v: 400, rmax: 5, r: 1, B1: 3.5 };
    F.cursore(g.pan, ['Velocità del vento (km/s)', 'Wind speed (km/s)'], 250, 900, 10, o.v, function (v) { o.v = v; disegna(); }, function (v) { return v + ' km/s'; });
    F.cursore(g.pan, ['Distanza per il calcolo r (UA)', 'Distance for the calculation r (AU)'], 0.3, 100, 0.1, o.r, function (v) { o.r = v; disegna(); }, function (v) { return num(v, 1) + ' UA'; });
    F.scelta(g.pan, ['Finestra del disegno', 'Drawing window'], [['2', '2 UA'], ['5', ['5 UA (fino a Giove)', '5 AU (to Jupiter)']], ['30', ['30 UA (fino a Nettuno)', '30 AU (to Neptune)']]], '5', function (v) { o.rmax = +v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info);
    var c1 = F.tela(g.dx, 1), c2 = F.tela(g.dx, 0.45);
    function disegna() {
      var w = avvolgimento(o.v), serie = [];
      for (var b = 0; b < 4; b++) { var xs = [], ys = []; for (var i = 0; i <= 700; i++) { var r = o.rmax * 1.05 * i / 700, f = b * PI / 2 - w * r; xs.push(r * Math.cos(f)); ys.push(r * Math.sin(f)); } serie.push({ x: xs, y: ys, col: '#ffd24a', larg: 1.8 }); }
      [1, 5.2, 9.58, 19.2, 30.07].filter(function (R) { return R <= o.rmax * 1.05; }).forEach(function (R) { var xs = [], ys = []; for (var i = 0; i <= 120; i++) { xs.push(R * Math.cos(2 * PI * i / 120)); ys.push(R * Math.sin(2 * PI * i / 120)); } serie.push({ x: xs, y: ys, col: '#3a5470', tratt: true }); });
      var M = o.rmax * 1.08;
      F.grafico(c1, { serie: serie, xl: ['x (UA)', 'x (AU)'], yl: ['y (UA)', 'y (AU)'], xmin: -M, xmax: M, ymin: -M, ymax: M, punti: [{ x: 0, y: 0, col: '#ffb347', r: 7 }], legenda: [{ col: '#ffd24a', etich: ['linee del campo di Parker (eclittica, vista da nord)', 'Parker field lines (ecliptic, seen from north)'] }, { col: '#3a5470', etich: ['orbite dei pianeti', 'planetary orbits'] }] });
      var rs = [], ps = [], bs = []; for (var j = 1; j <= 200; j++) { var rr = 0.2 * Math.pow(500, j / 200); rs.push(rr); ps.push(angoloParker(rr, o.v)); }
      F.grafico(c2, { serie: [{ x: rs.map(Math.log10), y: ps, col: '#5eead4', larg: 2.5 }], xl: ['log₁₀ r (UA)', 'log₁₀ r (AU)'], yl: ['ψ (gradi)', 'ψ (degrees)'], ymin: 0, ymax: 90, punti: [{ x: Math.log10(o.r), y: angoloParker(o.r, o.v), col: '#ffd24a', r: 5 }] });
      var B = campo(o.r, o.v, o.B1), B1 = campo(1, o.v, o.B1);
      info.innerHTML = '<div class="bsiFX-eq">tan ψ = Ω r / v,  Ω = 2π/25,38 d = 2,865×10⁻⁶ rad/s</div>' +
        t('A r = ', 'At r = ') + num(o.r, 1) + ' UA: <b class="bsiFX-num">ψ = ' + num(angoloParker(o.r, o.v), 1) + '°</b>; ' + t('a 1 UA ', 'at 1 AU ') + '<b class="bsiFX-num">' + num(angoloParker(1, o.v), 1) + '°</b>. ' +
        t('La spirale fa un giro ogni ', 'The spiral makes one turn every ') + '<b class="bsiFX-num">' + num(2 * PI / w, 2) + ' UA</b>.<br>' +
        t('Campo (B_r = 3,5 nT a 1 UA, come misurato in media): a 1 UA |B| = ', 'Field (B_r = 3.5 nT at 1 AU, the measured average): at 1 AU |B| = ') + '<b class="bsiFX-num">' + num(B1.B, 2) + ' nT</b>; ' + t('a ', 'at ') + num(o.r, 1) + ' UA <b class="bsiFX-num">' + (B.B < 0.1 ? B.B.toExponential(2).replace('.', ',') : num(B.B, 3)) + ' nT</b>' + t(' (lontano dal Sole quasi tutto azimutale, cala come 1/r).', ' (far from the Sun almost all azimuthal, falling as 1/r).') +
        '<br><small>' + stato('modello') + t('Vento radiale e costante, Sole che ruota rigidamente: Parker 1958. Il vento vero ha flussi lenti e veloci che si scontrano (regioni di interazione corotanti).', 'Radial, steady wind and a rigidly rotating Sun: Parker 1958. The real wind has slow and fast streams that collide (corotating interaction regions).') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 5. DOVE SI FERMA IL VENTO ═════════════════════════════════════════ */
  function schedaPressione(div) {
    var g = griglia(div), o = { n1: 5, v: 400, P: 150 };
    F.cursore(g.pan, ['Densità del vento a 1 UA (protoni/cm³)', 'Wind density at 1 AU (protons/cm³)'], 2, 12, 0.5, o.n1, function (v) { o.n1 = v; disegna(); }, function (v) { return num(v, 1); });
    F.cursore(g.pan, ['Velocità del vento (km/s)', 'Wind speed (km/s)'], 300, 800, 10, o.v, function (v) { o.v = v; disegna(); }, function (v) { return v + ' km/s'; });
    F.cursore(g.pan, ['Pressione esterna P (fPa = 10⁻¹⁵ Pa)', 'Outer pressure P (fPa = 10⁻¹⁵ Pa)'], 50, 400, 5, o.P, function (v) { o.P = v; disegna(); }, function (v) { return v + ' fPa'; });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info);
    var c = F.tela(g.dx, 0.55);
    function disegna() {
      var P = o.P * 1e-15, rts = shock(o.n1, o.v, P), xs = [], ys = [];
      for (var i = 0; i <= 300; i++) { var r = 10 + 190 * i / 300; xs.push(r); ys.push(pressioneVento(r, o.n1, o.v) * 1e15); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#ffd24a', larg: 2.5 }, { x: [10, 200], y: [o.P, o.P], col: '#b48cff', tratt: true }], xl: ['r (UA)', 'r (AU)'], yl: ['pressione (fPa)', 'pressure (fPa)'], ymin: 0, ymax: Math.min(3000, ys[0]),
        punti: [{ x: rts, y: o.P, col: '#ff9a3c', r: 6 }, { x: 94.0, y: pressioneVento(94, o.n1, o.v) * 1e15, col: '#ffd24a', r: 4 }, { x: 83.7, y: pressioneVento(83.7, o.n1, o.v) * 1e15, col: '#5eead4', r: 4 }],
        legenda: [{ col: '#ffd24a', etich: ['pressione dinamica del vento ρv² ∝ 1/r²', 'wind dynamic pressure ρv² ∝ 1/r²'] }, { col: '#b48cff', etich: ['pressione esterna', 'outer pressure'] }] });
      info.innerHTML = '<div class="bsiFX-eq">ρv²(r) = ρ₁v² (1 UA / r)²  =  P   ⇒   r_TS = 1 UA · √(ρ₁v²/P)</div>' +
        t('A 1 UA il vento preme con ', 'At 1 AU the wind pushes with ') + '<b class="bsiFX-num">' + num(pressioneVento(1, o.n1, o.v) * 1e9, 2) + ' nPa</b>. ' + t('Lo shock cade a ', 'The shock falls at ') + '<b class="bsiFX-num">r_TS = ' + num(rts, 0) + ' UA</b>.<br>' +
        t('Per avere lo shock dove l\'ha trovato Voyager 1 (94 UA) servono ', 'To have the shock where Voyager 1 found it (94 AU) you need ') + '<b class="bsiFX-num">' + num(pressionePer(94, o.n1, o.v) * 1e15, 0) + ' fPa</b>; ' + t('dove l\'ha trovato Voyager 2 (84 UA) ', 'where Voyager 2 found it (84 AU) ') + '<b class="bsiFX-num">' + num(pressionePer(83.7, o.n1, o.v) * 1e15, 0) + ' fPa</b>. ' +
        t('Il vento al minimo e al massimo del ciclo solare cambia di decine di per cento: lo shock si muove di alcune UA, e Voyager 2 l\'ha attraversato più volte in pochi giorni.', 'The wind changes by tens of percent over the solar cycle: the shock moves by several AU, and Voyager 2 crossed it several times within a few days.') +
        '<br><small>' + stato('modello') + t('Stima di ordine di grandezza: ignora il salto di pressione allo shock, gli ioni raccolti dal gas neutro (che rallentano il vento) e il campo magnetico.', 'Order-of-magnitude estimate: it ignores the pressure jump at the shock, the pickup ions from neutral gas (which slow the wind) and the magnetic field.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 6. LE VOYAGER E CIO' CHE SI SA ═════════════════════════════════════ */
  function schedaVoyager(div) {
    var g = griglia(div), c = F.tela(g.dx, 0.55), oggi = oggiAnno();
    function disegna() {
      var serie = [], punti = [];
      ['v1', 'v2'].forEach(function (k) { var xs = [], ys = []; for (var a = 1977.6; a <= oggi; a += 0.1) { xs.push(a); ys.push(distanza(k, a)); } serie.push({ x: xs, y: ys, col: SONDE[k].col, larg: 2.5 }); SONDE[k].tappe.slice(-2).forEach(function (tp) { punti.push({ x: tp[0], y: tp[1], col: SONDE[k].col, r: 6 }); }); });
      F.grafico(c, { serie: serie, punti: punti, xl: ['anno', 'year'], yl: ['distanza dal Sole (UA)', 'distance from the Sun (AU)'], ymin: 0, legenda: [{ col: SONDE.v1.col, etich: ['Voyager 1', 'Voyager 1'] }, { col: SONDE.v2.col, etich: ['Voyager 2', 'Voyager 2'] }] });
    }
    disegna(); F.alRidimensiona(disegna);
    var r1 = distanza('v1', oggi), r2 = distanza('v2', oggi);
    g.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Oggi (stima)', 'Today (estimate)') + '</b><br>Voyager 1: <b class="bsiFX-num">' + num(r1, 0) + ' UA</b> · ' + t('la luce impiega ', 'light takes ') + num(luceOre(r1), 1) + t(' ore', ' hours') + '<br>Voyager 2: <b class="bsiFX-num">' + num(r2, 0) + ' UA</b> · ' + num(luceOre(r2), 1) + t(' ore', ' hours') + '<br><small>' + t('Interpolazione fra le date note, poi velocità costante (17,0 e 15,4 km/s).', 'Interpolation between known dates, then constant speed (17.0 and 15.4 km/s).') + '</small>' }));
    var tab = '<table style="width:100%;border-collapse:collapse;font-size:.88em"><tr><th style="text-align:left">' + t('Evento', 'Event') + '</th><th>V1</th><th>V2</th></tr>' +
      '<tr><td>' + t('Shock di terminazione', 'Termination shock') + '</td><td class="bsiFX-num">16/12/2004<br>94,0 UA</td><td class="bsiFX-num">30/08/2007<br>83,7 UA</td></tr>' +
      '<tr><td>' + t('Eliopausa', 'Heliopause') + '</td><td class="bsiFX-num">25/08/2012<br>121,6 UA</td><td class="bsiFX-num">05/11/2018<br>119,0 UA</td></tr>' +
      '<tr><td>' + t('Spessore dell\'eliosheath', 'Heliosheath thickness') + '</td><td class="bsiFX-num">27,6 UA</td><td class="bsiFX-num">35,3 UA</td></tr></table>';
    var dx = g.pan; dx.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: stato('misurato') + '<b>' + t('Gli attraversamenti', 'The crossings') + '</b>' + tab + '<small>' + t('Fonti: Stone et al., Science 309 (2005), Nature 454 (2008), Science 341 (2013); Nature Astronomy 3 (2019).', 'Sources: Stone et al., Science 309 (2005), Nature 454 (2008), Science 341 (2013); Nature Astronomy 3 (2019).') + '</small>' }));
    var sotto = F.el('div', { style: 'min-width:0' }); g.dx.appendChild(sotto);
    blocco(sotto, 'misurato', t('Che cosa hanno visto passando l\'eliopausa', 'What they saw crossing the heliopause'), t('I raggi cosmici galattici sono saliti di colpo e le particelle del vento solare sono quasi sparite; la densità del plasma è salita di circa 40 volte (misurata dalle oscillazioni del plasma). Il campo magnetico, sorprendentemente, ha quasi conservato la direzione di quello solare.', 'Galactic cosmic rays jumped and the solar-wind particles almost vanished; the plasma density rose about 40 times (measured from plasma oscillations). The magnetic field, surprisingly, almost kept the direction of the solar one.'));
    blocco(sotto, 'misurato', t('Il gas interstellare e il nastro di IBEX', 'The interstellar gas and the IBEX ribbon'), t('Gli atomi neutri interstellari attraversano l\'eliosfera: da loro si misura che il mezzo interstellare arriva da longitudine eclittica 255,7° e latitudine 5,1° a circa 26 km/s. IBEX (dal 2008) ha scoperto un «nastro» di atomi neutri energetici, un cerchio di circa 74° di raggio centrato a (221°, 39°), allineato con il campo magnetico interstellare.', 'Interstellar neutral atoms cross the heliosphere: from them the interstellar medium is measured to arrive from ecliptic longitude 255.7° and latitude 5.1° at about 26 km/s. IBEX (since 2008) discovered a «ribbon» of energetic neutral atoms, a circle about 74° in radius centred at (221°, 39°), aligned with the interstellar magnetic field.'));
    blocco(sotto, 'dibattuto', t('Bow shock o onda di prua?', 'Bow shock or bow wave?'), t('Davanti all\'eliosfera il gas interstellare rallenta. Se lo fa con uno shock dipende dalla sua velocità rispetto alla velocità magnetosonica: con 23–26 km/s e il campo misurato è probabilmente sotto, e ci sarebbe solo un\'onda di prua (McComas et al., Science 2012). La questione è aperta.', 'In front of the heliosphere the interstellar gas slows down. Whether through a shock depends on its speed relative to the magnetosonic speed: with 23–26 km/s and the measured field it is probably below, and there would be only a bow wave (McComas et al., Science 2012). The question is open.'));
    blocco(sotto, 'dibattuto', t('La coda', 'The tail'), t('Nessuna sonda è andata nella coda. Alcuni modelli la vogliono lunga centinaia o migliaia di UA, come quella di una cometa; altri, guidati dai dati di IBEX e Cassini, la vogliono corta e divisa in due lobi («a croissant»).', 'No spacecraft has gone into the tail. Some models want it hundreds or thousands of AU long, like a comet\'s; others, guided by IBEX and Cassini data, want it short and split into two lobes («croissant»).'));
  }

  F.sezione('sastroelio', {
    titolo: ['🌞 L\'eliosfera', '🌞 The heliosphere'],
    sotto: ['La bolla che il vento solare scava nel gas fra le stelle: spirale di Parker, shock di terminazione, eliosheath, eliopausa, il vento interstellare e il nastro di IBEX, con le traiettorie e le misure vere delle due Voyager. Ogni affermazione dice se è misurata, un modello o dibattuta.',
            'The bubble the solar wind carves in the gas between the stars: Parker spiral, termination shock, heliosheath, heliopause, the interstellar wind and the IBEX ribbon, with the real trajectories and measurements of the two Voyagers. Every claim says whether it is measured, a model or debated.'],
    schede: [
      { nome: ['L\'eliosfera in 3D', 'The heliosphere in 3D'], costruisci: schedaTre },
      { nome: ['🌌 Dal Sole alla Galassia', '🌌 From the Sun to the Galaxy'], costruisci: function (div) { if (F.schedeExtra && F.schedeExtra.viaggioGalassia) F.schedeExtra.viaggioGalassia(div); else div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Il modulo non è caricato.', 'The module is not loaded.') })); } },
      { nome: ['Spirale di Parker', 'Parker spiral'], costruisci: schedaParker },
      { nome: ['Dove si ferma il vento', 'Where the wind stops'], costruisci: schedaPressione },
      { nome: ['Le Voyager', 'The Voyagers'], costruisci: schedaVoyager }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
