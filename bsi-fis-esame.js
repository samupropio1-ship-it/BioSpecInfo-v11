/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-esame.js — 🎓 l'esame di Fisica Generale I e II
   BioSpecInfo · © Samuele Pio Provenzano

   I due corsi di Fisica Generale del corso di laurea in Chimica
   dell'Universita' di Bari (meccanica, fluidi e termodinamica nel primo;
   fenomeni elettrici, correnti, magnetostatica, induzione, cenni di onde
   elettromagnetiche e ottica fisica nel secondo), con:

   · PROGRAMMA: per ogni argomento le leggi, il metodo e gli errori tipici;
   · RISOLUTORE: quasi cinquanta modelli di problema; si cambiano i dati e
     lo svolgimento si riscrive — legge usata, sostituzione dei numeri con
     le unita', risultato con quattro cifre significative;
   · PROBLEMI D'ESAME SVOLTI: tracce nello stile dello scritto, costruite
     sui programmi (non sono i testi ufficiali degli appelli).

   Costanti CODATA 2018: g = 9,81 m/s² (valore d'uso negli esercizi),
   G = 6,674·10⁻¹¹, k = 1/(4πε₀) = 8,988·10⁹, ε₀ = 8,854·10⁻¹², μ₀ = 4π·10⁻⁷
   (in ottima approssimazione), R = 8,314 J/(mol·K), c = 2,998·10⁸ m/s.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var g = 9.81, G = 6.674e-11, e0 = 8.8541878128e-12, kC = 1 / (4 * Math.PI * e0), mu0 = 4 * Math.PI * 1e-7, Rg = 8.314462618, c0 = 2.99792458e8;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function n4(v) {
    if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 1e-3 && a < 1e5) return String(+v.toPrecision(4)).replace('-', '−');
    var e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e);
    if (Math.abs(+m.toPrecision(4)) >= 10) { m /= 10; e++; }
    return String(+m.toPrecision(4)).replace('-', '−') + '·10' + String(e).replace('-', '⁻').split('').map(function (ch) { return ch === '⁻' ? ch : SUP[+ch]; }).join('');
  }
  function q(v, u) { return n4(v) + (u ? ' ' + u : ''); }
  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }

  /* ogni modello: dati [chiave, nome, unita', valore], testo(d) e risolvi(d, S) */
  function svolgimento() {
    var passi = [], ris = [];
    return {
      passi: passi, ris: ris,
      p: function (tit, html) { passi.push({ titolo: tit, html: html }); },
      f: function (tit, formula, sost, v, u) { passi.push({ titolo: tit, html: formula + (sost ? ' = ' + sost : '') + ' = <b>' + q(v, u) + '</b>' }); return v; },
      r: function (nome, v, u) { ris.push({ nome: nome, v: v, u: u }); return v; }
    };
  }
  var GAS = { mono: [1.5, 2.5], bi: [2.5, 3.5] };
  function gasNome(d) { return d.gas === 'bi' ? t('biatomico', 'diatomic') : t('monoatomico', 'monatomic'); }

  var MODELLI = [
    /* ───────────── FISICA GENERALE I ───────────── */
    { id: 'mua', corso: 'I', arg: 'cin', nome: ['Moto uniformemente accelerato', 'Uniformly accelerated motion'], dati: [['v0', 'v₀', 'm/s', 20], ['a', 'a', 'm/s²', -4], ['t', 't', 's', 3]],
      testo: function (d) { return [ 'Un’auto viaggia a ' + d.v0 + ' m/s e frena con accelerazione costante ' + d.a + ' m/s². Quanto spazio percorre e quale velocità ha dopo ' + d.t + ' s? Quanto spazio le serve per fermarsi?', 'A car travels at ' + d.v0 + ' m/s and brakes with constant acceleration ' + d.a + ' m/s². How far does it go and how fast is it after ' + d.t + ' s? What is its stopping distance?' ]; },
      risolvi: function (d, S) {
        S.p(t('Leggi orarie', 'Equations of motion'), 'x(t) = v₀t + ½at², v(t) = v₀ + at, v² = v₀² + 2aΔx');
        var x = S.f(t('Spazio', 'Displacement'), 'x = v₀t + ½at²', n4(d.v0) + '·' + n4(d.t) + ' + ½·(' + n4(d.a) + ')·' + n4(d.t) + '²', d.v0 * d.t + 0.5 * d.a * d.t * d.t, 'm');
        var v = S.f(t('Velocità', 'Velocity'), 'v = v₀ + at', n4(d.v0) + ' + (' + n4(d.a) + ')·' + n4(d.t), d.v0 + d.a * d.t, 'm/s');
        S.r('x', x, 'm'); S.r('v', v, 'm/s');
        if (d.a < 0 && d.v0 > 0) { var ds = S.f(t('Spazio di arresto (v = 0)', 'Stopping distance (v = 0)'), 'Δx = v₀²/(2|a|)', n4(d.v0) + '²/(2·' + n4(-d.a) + ')', d.v0 * d.v0 / (-2 * d.a), 'm'); S.r(t('arresto', 'stop'), ds, 'm'); if (v < 0) S.p(t('Attenzione', 'Caution'), t('Il risultato v < 0 dice che l’auto si è già fermata prima di t: in un problema di frenata la formula vale solo fino all’arresto (t = v₀/|a| = ', 'v < 0 means the car stopped before t: in a braking problem the formula holds only up to the stop (t = v₀/|a| = ') + q(d.v0 / -d.a, 's') + ').'); }
      } },
    { id: 'caduta', corso: 'I', arg: 'cin', nome: ['Lancio verticale e caduta', 'Vertical throw and fall'], dati: [['h', t('quota iniziale h', 'initial height h'), 'm', 20], ['v0', t('v₀ (verso l’alto +)', 'v₀ (upwards +)'), 'm/s', 10]],
      testo: function (d) { return [ 'Una pietra è lanciata verso l’alto con velocità ' + d.v0 + ' m/s dal bordo di un edificio alto ' + d.h + ' m. Trovare la quota massima, il tempo di volo e la velocità con cui tocca il suolo.', 'A stone is thrown upwards at ' + d.v0 + ' m/s from the edge of a ' + d.h + ' m tall building. Find the maximum height, the flight time and the impact speed.' ]; },
      risolvi: function (d, S) {
        S.p(t('Modello', 'Model'), t('Asse y verso l’alto, a = −g, origine al suolo: y(t) = h + v₀t − ½gt².', 'y axis upwards, a = −g, origin at the ground: y(t) = h + v₀t − ½gt².'));
        var hm = S.f(t('Quota massima (v = 0)', 'Maximum height (v = 0)'), 'y_max = h + v₀²/(2g)', n4(d.h) + ' + ' + n4(d.v0) + '²/(2·9,81)', d.h + Math.max(0, d.v0) * Math.max(0, d.v0) / (2 * g), 'm');
        var tv = S.f(t('Tempo di volo (y = 0)', 'Flight time (y = 0)'), 't = [v₀ + √(v₀² + 2gh)]/g', '[' + n4(d.v0) + ' + √(' + n4(d.v0) + '² + 2·9,81·' + n4(d.h) + ')]/9,81', (d.v0 + Math.sqrt(d.v0 * d.v0 + 2 * g * d.h)) / g, 's');
        var vi = S.f(t('Velocità al suolo (conservazione dell’energia)', 'Impact speed (energy conservation)'), '|v| = √(v₀² + 2gh)', '√(' + n4(d.v0) + '² + 2·9,81·' + n4(d.h) + ')', Math.sqrt(d.v0 * d.v0 + 2 * g * d.h), 'm/s');
        S.r('y_max', hm, 'm'); S.r(t('tempo', 'time'), tv, 's'); S.r('v', vi, 'm/s');
      } },
    { id: 'proiettile', corso: 'I', arg: 'cin', nome: ['Moto del proiettile', 'Projectile motion'], dati: [['v0', 'v₀', 'm/s', 25], ['th', 'θ', '°', 40], ['h', t('quota di lancio', 'launch height'), 'm', 0]],
      testo: function (d) { return [ 'Un proiettile è lanciato con velocità ' + d.v0 + ' m/s a ' + d.th + '° sull’orizzontale da una quota di ' + d.h + ' m. Trovare tempo di volo, gittata, quota massima e velocità d’impatto.', 'A projectile is launched at ' + d.v0 + ' m/s, ' + d.th + '° above the horizontal, from a height of ' + d.h + ' m. Find the flight time, range, maximum height and impact speed.' ]; },
      risolvi: function (d, S) {
        var vx = d.v0 * Math.cos(rad(d.th)), vy = d.v0 * Math.sin(rad(d.th));
        S.p(t('Componenti', 'Components'), t('Moto uniforme in x, uniformemente accelerato in y: ', 'Uniform motion in x, uniformly accelerated in y: ') + 'v₀ₓ = v₀cos θ = ' + q(vx, 'm/s') + ', v₀ᵧ = v₀sin θ = ' + q(vy, 'm/s'));
        var tv = S.f(t('Tempo di volo', 'Flight time'), 't = [v₀ᵧ + √(v₀ᵧ² + 2gh)]/g', '', (vy + Math.sqrt(vy * vy + 2 * g * d.h)) / g, 's');
        var R = S.f(t('Gittata', 'Range'), 'R = v₀ₓ·t', n4(vx) + '·' + n4(tv), vx * tv, 'm');
        var hm = S.f(t('Quota massima', 'Maximum height'), 'h_max = h + v₀ᵧ²/(2g)', '', d.h + vy * vy / (2 * g), 'm');
        var vi = S.f(t('Velocità d’impatto', 'Impact speed'), 'v = √(v₀² + 2gh)', '', Math.sqrt(d.v0 * d.v0 + 2 * g * d.h), 'm/s');
        if (!d.h) S.p(t('Nota', 'Note'), t('Da terra a terra R = v₀²sin 2θ/g: a parità di v₀ la gittata massima è a 45°.', 'Ground to ground R = v₀²sin 2θ/g: for a given v₀ the maximum range is at 45°.'));
        S.r(t('tempo', 'time'), tv, 's'); S.r('R', R, 'm'); S.r('h_max', hm, 'm'); S.r('v', vi, 'm/s');
      } },
    { id: 'circolare', corso: 'I', arg: 'cin', nome: ['Moto circolare uniforme', 'Uniform circular motion'], dati: [['r', 'r', 'm', 0.5], ['T', t('periodo T', 'period T'), 's', 0.2], ['m', 'm', 'kg', 0.1]],
      testo: function (d) { return [ 'Un corpo di ' + d.m + ' kg percorre una circonferenza di raggio ' + d.r + ' m con periodo ' + d.T + ' s. Calcolare velocità, velocità angolare, accelerazione e forza centripeta.', 'A ' + d.m + ' kg body moves on a circle of radius ' + d.r + ' m with period ' + d.T + ' s. Compute speed, angular velocity, acceleration and centripetal force.' ]; },
      risolvi: function (d, S) {
        var w = S.f('ω', 'ω = 2π/T', '2π/' + n4(d.T), 2 * Math.PI / d.T, 'rad/s'), v = S.f('v', 'v = ωr', n4(w) + '·' + n4(d.r), w * d.r, 'm/s');
        var a = S.f(t('Accelerazione centripeta', 'Centripetal acceleration'), 'a_c = v²/r = ω²r', '', v * v / d.r, 'm/s²'), Fc = S.f(t('Forza centripeta', 'Centripetal force'), 'F = m·a_c', '', d.m * a, 'N');
        S.r('ω', w, 'rad/s'); S.r('v', v, 'm/s'); S.r('a_c', a, 'm/s²'); S.r('F', Fc, 'N');
      } },
    { id: 'piano', corso: 'I', arg: 'din', nome: ['Piano inclinato con attrito', 'Inclined plane with friction'], dati: [['m', 'm', 'kg', 5], ['th', 'θ', '°', 30], ['ms', 'μ_s', '', 0.4], ['md', 'μ_d', '', 0.3]],
      testo: function (d) { return [ 'Un blocco di ' + d.m + ' kg è posato su un piano inclinato di ' + d.th + '° (μ_s = ' + d.ms + ', μ_d = ' + d.md + '). Il blocco scivola? Se sì, con quale accelerazione?', 'A ' + d.m + ' kg block rests on a ' + d.th + '° incline (μ_s = ' + d.ms + ', μ_d = ' + d.md + '). Does it slide? If so, with what acceleration?' ]; },
      risolvi: function (d, S) {
        var th = rad(d.th);
        S.p(t('Diagramma delle forze', 'Free-body diagram'), t('Peso mg, reazione normale N, attrito parallelo al piano. Assi lungo il piano e perpendicolare.', 'Weight mg, normal force N, friction along the plane. Axes along and perpendicular to the plane.'));
        var N = S.f('N', 'N = mg cos θ', n4(d.m) + '·9,81·cos ' + d.th + '°', d.m * g * Math.cos(th), 'N');
        var Pp = S.f(t('Componente parallela del peso', 'Parallel weight component'), 'P∥ = mg sin θ', '', d.m * g * Math.sin(th), 'N');
        var scivola = Math.tan(th) > d.ms;
        S.p(t('Scivola?', 'Does it slide?'), t('Serve P∥ > μ_s N, cioè tan θ > μ_s: ', 'It needs P∥ > μ_s N, i.e. tan θ > μ_s: ') + 'tan θ = ' + n4(Math.tan(th)) + (scivola ? ' > ' : ' ≤ ') + 'μ_s = ' + d.ms + ' ⇒ <b>' + (scivola ? t('scivola', 'it slides') : t('resta fermo (attrito statico ', 'it stays put (static friction ') + q(Pp, 'N') + ')') + '</b>');
        if (scivola) { var a = S.f(t('Accelerazione', 'Acceleration'), 'a = g(sin θ − μ_d cos θ)', '', g * (Math.sin(th) - d.md * Math.cos(th)), 'm/s²'); S.r('a', a, 'm/s²'); } else S.r('a', 0, 'm/s²');
        S.r('N', N, 'N');
      } },
    { id: 'atwood', corso: 'I', arg: 'din', nome: ['Macchina di Atwood', 'Atwood machine'], dati: [['m1', 'm₁', 'kg', 2], ['m2', 'm₂', 'kg', 3]],
      testo: function (d) { return [ 'Due masse m₁ = ' + d.m1 + ' kg e m₂ = ' + d.m2 + ' kg sono appese ai capi di un filo inestensibile che passa su una carrucola ideale. Trovare accelerazione e tensione.', 'Two masses m₁ = ' + d.m1 + ' kg and m₂ = ' + d.m2 + ' kg hang from the ends of an inextensible string over an ideal pulley. Find the acceleration and tension.' ]; },
      risolvi: function (d, S) {
        S.p(t('Equazioni del moto', 'Equations of motion'), 'm₂g − T = m₂a ; T − m₁g = m₁a ' + t('(sommando si elimina T)', '(adding them eliminates T)'));
        var a = S.f('a', 'a = (m₂ − m₁)g/(m₁ + m₂)', '(' + n4(d.m2) + ' − ' + n4(d.m1) + ')·9,81/(' + n4(d.m1 + d.m2) + ')', (d.m2 - d.m1) * g / (d.m1 + d.m2), 'm/s²');
        var T = S.f('T', 'T = 2m₁m₂g/(m₁ + m₂)', '', 2 * d.m1 * d.m2 * g / (d.m1 + d.m2), 'N');
        S.r('a', a, 'm/s²'); S.r('T', T, 'N');
      } },
    { id: 'tavolo', corso: 'I', arg: 'din', nome: ['Blocco sul tavolo e massa appesa', 'Block on table and hanging mass'], dati: [['m1', t('m₁ (sul tavolo)', 'm₁ (on table)'), 'kg', 4], ['m2', t('m₂ (appesa)', 'm₂ (hanging)'), 'kg', 2], ['md', 'μ_d', '', 0.2]],
      testo: function (d) { return [ 'Un blocco di ' + d.m1 + ' kg su un tavolo orizzontale (μ_d = ' + d.md + ') è collegato da un filo, attraverso una carrucola ideale, a una massa appesa di ' + d.m2 + ' kg. Trovare accelerazione e tensione.', 'A ' + d.m1 + ' kg block on a horizontal table (μ_d = ' + d.md + ') is tied, over an ideal pulley, to a hanging ' + d.m2 + ' kg mass. Find the acceleration and tension.' ]; },
      risolvi: function (d, S) {
        S.p(t('Equazioni', 'Equations'), 'T − μ_d m₁g = m₁a ; m₂g − T = m₂a');
        var a = S.f('a', 'a = (m₂ − μ_d m₁)g/(m₁ + m₂)', '', Math.max(0, (d.m2 - d.md * d.m1) * g / (d.m1 + d.m2)), 'm/s²');
        var T = S.f('T', 'T = m₂(g − a)', '', d.m2 * (g - a), 'N');
        if ((d.m2 - d.md * d.m1) <= 0) S.p(t('Nota', 'Note'), t('m₂g non supera l’attrito: il sistema resta fermo (se era fermo).', 'm₂g does not exceed friction: the system stays at rest (if it was at rest).'));
        S.r('a', a, 'm/s²'); S.r('T', T, 'N');
      } },
    { id: 'molla', corso: 'I', arg: 'osc', nome: ['Oscillatore armonico (molla)', 'Harmonic oscillator (spring)'], dati: [['m', 'm', 'kg', 0.5], ['k', 'k', 'N/m', 200], ['A', t('ampiezza A', 'amplitude A'), 'm', 0.05]],
      testo: function (d) { return [ 'Una massa di ' + d.m + ' kg attaccata a una molla di costante ' + d.k + ' N/m oscilla con ampiezza ' + d.A + ' m senza attrito. Trovare periodo, velocità e accelerazione massime, energia.', 'A ' + d.m + ' kg mass on a spring of constant ' + d.k + ' N/m oscillates with amplitude ' + d.A + ' m without friction. Find period, maximum speed and acceleration, energy.' ]; },
      risolvi: function (d, S) {
        var w = S.f('ω', 'ω = √(k/m)', '√(' + n4(d.k) + '/' + n4(d.m) + ')', Math.sqrt(d.k / d.m), 'rad/s'), T = S.f('T', 'T = 2π/ω', '', 2 * Math.PI / w, 's');
        var vm = S.f('v_max', 'v_max = Aω', '', d.A * w, 'm/s'), am = S.f('a_max', 'a_max = Aω²', '', d.A * w * w, 'm/s²'), E = S.f(t('Energia', 'Energy'), 'E = ½kA²', '', 0.5 * d.k * d.A * d.A, 'J');
        S.r('T', T, 's'); S.r('v_max', vm, 'm/s'); S.r('a_max', am, 'm/s²'); S.r('E', E, 'J');
      } },
    { id: 'energia', corso: 'I', arg: 'lav', nome: ['Conservazione dell’energia', 'Energy conservation'], dati: [['m', 'm', 'kg', 2], ['h', t('dislivello h', 'height drop h'), 'm', 5], ['v0', 'v₀', 'm/s', 0], ['La', t('lavoro dell’attrito (positivo)', 'friction work (positive)'), 'J', 20]],
      testo: function (d) { return [ 'Un corpo di ' + d.m + ' kg scende lungo uno scivolo da un dislivello di ' + d.h + ' m partendo con velocità ' + d.v0 + ' m/s; l’attrito dissipa ' + d.La + ' J. Con che velocità arriva in fondo?', 'A ' + d.m + ' kg body slides down a chute of height ' + d.h + ' m starting at ' + d.v0 + ' m/s; friction dissipates ' + d.La + ' J. How fast is it at the bottom?' ]; },
      risolvi: function (d, S) {
        S.p(t('Teorema dell’energia', 'Work-energy theorem'), t('½mv² = ½mv₀² + mgh − L_attrito (le forze non conservative tolgono energia meccanica).', '½mv² = ½mv₀² + mgh − W_friction (non-conservative forces remove mechanical energy).'));
        var Ef = 0.5 * d.m * d.v0 * d.v0 + d.m * g * d.h - d.La;
        if (Ef < 0) { S.p(t('Risultato', 'Result'), t('L’attrito dissipa più energia di quella disponibile: il corpo si ferma prima del fondo.', 'Friction dissipates more energy than available: the body stops before the bottom.')); S.r('v', 0, 'm/s'); return; }
        var v = S.f('v', 'v = √(v₀² + 2gh − 2L/m)', '√(' + n4(d.v0) + '² + 2·9,81·' + n4(d.h) + ' − 2·' + n4(d.La) + '/' + n4(d.m) + ')', Math.sqrt(2 * Ef / d.m), 'm/s');
        S.r('v', v, 'm/s');
      } },
    { id: 'giro', corso: 'I', arg: 'lav', nome: ['Giro della morte', 'Loop-the-loop'], dati: [['R', t('raggio del giro', 'loop radius'), 'm', 2], ['m', 'm', 'kg', 1]],
      testo: function (d) { return [ 'Un carrello di ' + d.m + ' kg parte da fermo su una pista senza attrito che termina con un giro della morte di raggio ' + d.R + ' m. Da che quota minima deve partire per completare il giro?', 'A ' + d.m + ' kg cart starts from rest on a frictionless track ending in a loop of radius ' + d.R + ' m. What minimum starting height lets it complete the loop?' ]; },
      risolvi: function (d, S) {
        S.p(t('Condizione in cima', 'Condition at the top'), t('Nel punto più alto la reazione può annullarsi ma non diventare negativa: mg ≤ mv²/R ⇒ v² ≥ gR.', 'At the top the normal force may vanish but not become negative: mg ≤ mv²/R ⇒ v² ≥ gR.'));
        var vt = S.f(t('Velocità minima in cima', 'Minimum speed at the top'), 'v = √(gR)', '', Math.sqrt(g * d.R), 'm/s');
        var h = S.f(t('Quota minima (energia)', 'Minimum height (energy)'), 'mgh = mg·2R + ½m·gR ⇒ h = 5R/2', '', 2.5 * d.R, 'm');
        S.r('h_min', h, 'm'); S.r('v_cima', vt, 'm/s');
      } },
    { id: 'lavoro', corso: 'I', arg: 'lav', nome: ['Lavoro e potenza', 'Work and power'], dati: [['F', 'F', 'N', 50], ['s', t('spostamento s', 'displacement s'), 'm', 10], ['th', t('angolo forza-spostamento', 'force-displacement angle'), '°', 30], ['t', t('tempo', 'time'), 's', 4]],
      testo: function (d) { return [ 'Una forza di ' + d.F + ' N inclinata di ' + d.th + '° rispetto allo spostamento trascina una cassa per ' + d.s + ' m in ' + d.t + ' s. Calcolare lavoro e potenza media.', 'A ' + d.F + ' N force at ' + d.th + '° to the displacement drags a crate ' + d.s + ' m in ' + d.t + ' s. Compute the work and average power.' ]; },
      risolvi: function (d, S) { var L = S.f(t('Lavoro', 'Work'), 'L = F·s·cos θ', n4(d.F) + '·' + n4(d.s) + '·cos ' + d.th + '°', d.F * d.s * Math.cos(rad(d.th)), 'J'); var P = S.f(t('Potenza media', 'Average power'), 'P = L/t', '', L / d.t, 'W'); S.r('L', L, 'J'); S.r('P', P, 'W'); } },
    { id: 'anelastico', corso: 'I', arg: 'urti', nome: ['Urto completamente anelastico', 'Perfectly inelastic collision'], dati: [['m1', 'm₁', 'kg', 1.5], ['v1', 'v₁', 'm/s', 4], ['m2', 'm₂', 'kg', 2.5], ['v2', 'v₂', 'm/s', -1]],
      testo: function (d) { return [ 'Un corpo di ' + d.m1 + ' kg a ' + d.v1 + ' m/s urta un corpo di ' + d.m2 + ' kg che si muove a ' + d.v2 + ' m/s sulla stessa retta; dopo l’urto restano attaccati. Trovare la velocità finale e l’energia dissipata.', 'A ' + d.m1 + ' kg body at ' + d.v1 + ' m/s hits a ' + d.m2 + ' kg body moving at ' + d.v2 + ' m/s on the same line; they stick together. Find the final velocity and the energy dissipated.' ]; },
      risolvi: function (d, S) {
        S.p(t('Conservazione della quantità di moto', 'Momentum conservation'), t('Nell’urto le forze esterne sono trascurabili: m₁v₁ + m₂v₂ = (m₁ + m₂)V. L’energia cinetica NON si conserva.', 'During the collision external forces are negligible: m₁v₁ + m₂v₂ = (m₁ + m₂)V. Kinetic energy is NOT conserved.'));
        var V = S.f('V', 'V = (m₁v₁ + m₂v₂)/(m₁ + m₂)', '', (d.m1 * d.v1 + d.m2 * d.v2) / (d.m1 + d.m2), 'm/s');
        var dK = S.f(t('Energia dissipata', 'Energy dissipated'), 'ΔK = K_i − K_f', '', 0.5 * d.m1 * d.v1 * d.v1 + 0.5 * d.m2 * d.v2 * d.v2 - 0.5 * (d.m1 + d.m2) * V * V, 'J');
        S.r('V', V, 'm/s'); S.r('ΔK', dK, 'J');
      } },
    { id: 'elastico', corso: 'I', arg: 'urti', nome: ['Urto elastico centrale', 'Head-on elastic collision'], dati: [['m1', 'm₁', 'kg', 1], ['v1', 'v₁', 'm/s', 6], ['m2', 'm₂', 'kg', 2], ['v2', 'v₂', 'm/s', 0]],
      testo: function (d) { return [ 'Urto elastico centrale fra m₁ = ' + d.m1 + ' kg (v₁ = ' + d.v1 + ' m/s) e m₂ = ' + d.m2 + ' kg (v₂ = ' + d.v2 + ' m/s). Trovare le velocità dopo l’urto.', 'Head-on elastic collision between m₁ = ' + d.m1 + ' kg (v₁ = ' + d.v1 + ' m/s) and m₂ = ' + d.m2 + ' kg (v₂ = ' + d.v2 + ' m/s). Find the velocities after the collision.' ]; },
      risolvi: function (d, S) {
        S.p(t('Due conservazioni', 'Two conservation laws'), t('Si conservano quantità di moto ed energia cinetica; risolvendo il sistema:', 'Both momentum and kinetic energy are conserved; solving the system:'));
        var a = S.f('v₁′', 'v₁′ = [(m₁ − m₂)v₁ + 2m₂v₂]/(m₁ + m₂)', '', ((d.m1 - d.m2) * d.v1 + 2 * d.m2 * d.v2) / (d.m1 + d.m2), 'm/s');
        var b = S.f('v₂′', 'v₂′ = [(m₂ − m₁)v₂ + 2m₁v₁]/(m₁ + m₂)', '', ((d.m2 - d.m1) * d.v2 + 2 * d.m1 * d.v1) / (d.m1 + d.m2), 'm/s');
        S.p(t('Controllo', 'Check'), t('Velocità relativa invertita: v₂′ − v₁′ = ', 'Relative velocity reversed: v₂′ − v₁′ = ') + n4(b - a) + ' = −(v₂ − v₁) = ' + n4(d.v1 - d.v2));
        S.r("v₁′", a, 'm/s'); S.r("v₂′", b, 'm/s');
      } },
    { id: 'pendolo', corso: 'I', arg: 'osc', nome: ['Pendolo semplice', 'Simple pendulum'], dati: [['L', t('lunghezza L', 'length L'), 'm', 1.2], ['th', t('ampiezza θ₀', 'amplitude θ₀'), '°', 10]],
      testo: function (d) { return [ 'Un pendolo semplice lungo ' + d.L + ' m è lasciato da fermo a ' + d.th + '° dalla verticale. Trovare il periodo delle piccole oscillazioni e la velocità nel punto più basso.', 'A ' + d.L + ' m simple pendulum is released from rest at ' + d.th + '° from the vertical. Find the small-oscillation period and the speed at the lowest point.' ]; },
      risolvi: function (d, S) {
        var T = S.f(t('Periodo (piccole oscillazioni)', 'Period (small oscillations)'), 'T = 2π√(L/g)', '2π√(' + n4(d.L) + '/9,81)', 2 * Math.PI * Math.sqrt(d.L / g), 's');
        var v = S.f(t('Velocità nel punto più basso (energia, esatta)', 'Speed at the bottom (energy, exact)'), 'v = √(2gL(1 − cos θ₀))', '', Math.sqrt(2 * g * d.L * (1 - Math.cos(rad(d.th)))), 'm/s');
        S.p(t('Nota', 'Note'), t('Il periodo non dipende dalla massa e (per angoli piccoli) dall’ampiezza: isocronismo.', 'The period depends neither on mass nor (for small angles) on amplitude: isochronism.'));
        S.r('T', T, 's'); S.r('v', v, 'm/s');
      } },
    { id: 'orbita', corso: 'I', arg: 'grav', nome: ['Orbita circolare e velocità di fuga', 'Circular orbit and escape velocity'], dati: [['M', t('massa centrale M', 'central mass M'), 'kg', 5.972e24], ['r', t('raggio dell’orbita r', 'orbit radius r'), 'm', 6.771e6]],
      testo: function (d) { return [ 'Un satellite percorre un’orbita circolare di raggio ' + n4(d.r) + ' m attorno a un pianeta di massa ' + n4(d.M) + ' kg. Trovare velocità orbitale, periodo e velocità di fuga da quella quota.', 'A satellite is in a circular orbit of radius ' + n4(d.r) + ' m around a planet of mass ' + n4(d.M) + ' kg. Find the orbital speed, period and escape speed from that radius.' ]; },
      risolvi: function (d, S) {
        S.p(t('Gravità come forza centripeta', 'Gravity as centripetal force'), 'GMm/r² = mv²/r');
        var v = S.f('v', 'v = √(GM/r)', '', Math.sqrt(G * d.M / d.r), 'm/s'), T = S.f('T', 'T = 2πr/v', '', 2 * Math.PI * d.r / v, 's'), vf = S.f(t('Velocità di fuga', 'Escape speed'), 'v_f = √(2GM/r) = √2·v', '', Math.sqrt(2 * G * d.M / d.r), 'm/s');
        S.p(t('In minuti', 'In minutes'), 'T = ' + q(T / 60, 'min'));
        S.r('v', v, 'm/s'); S.r('T', T, 's'); S.r('v_f', vf, 'm/s');
      } },
    { id: 'rotolamento', corso: 'I', arg: 'rig', nome: ['Rotolamento su piano inclinato', 'Rolling down an incline'], dati: [['forma', t('corpo: sfera | cilindro | anello', 'body: sfera | cilindro | anello'), '', 'sfera'], ['h', t('dislivello', 'height'), 'm', 1.5], ['th', 'θ', '°', 20]],
      testo: function (d) { return [ 'Un corpo rigido (' + d.forma + ') rotola senza strisciare lungo un piano inclinato di ' + d.th + '°, partendo da fermo da un’altezza di ' + d.h + ' m. Trovare la velocità in fondo e l’accelerazione.', 'A rigid body (' + d.forma + ') rolls without slipping down a ' + d.th + '° incline, starting from rest at a height of ' + d.h + ' m. Find the speed at the bottom and the acceleration.' ]; },
      risolvi: function (d, S) {
        var beta = { sfera: 0.4, cilindro: 0.5, anello: 1 }[d.forma] || 0.4;
        S.p(t('Momento d’inerzia', 'Moment of inertia'), 'I = β·mR² ' + t('con β = ', 'with β = ') + beta + ' (' + t('sfera piena 2/5, cilindro pieno 1/2, anello 1', 'solid sphere 2/5, solid cylinder 1/2, ring 1') + ')');
        S.p(t('Energia', 'Energy'), t('Rotolamento puro: v = ωR, l’attrito statico non fa lavoro. ', 'Pure rolling: v = ωR, static friction does no work. ') + 'mgh = ½mv² + ½Iω² = ½mv²(1 + β)');
        var v = S.f('v', 'v = √(2gh/(1 + β))', '', Math.sqrt(2 * g * d.h / (1 + beta)), 'm/s'), a = S.f('a', 'a = g sin θ/(1 + β)', '', g * Math.sin(rad(d.th)) / (1 + beta), 'm/s²');
        S.p(t('Confronto', 'Comparison'), t('Un corpo che scivola senza attrito arriverebbe a √(2gh) = ', 'A body sliding without friction would reach √(2gh) = ') + q(Math.sqrt(2 * g * d.h), 'm/s') + t(': parte dell’energia va in rotazione.', ': part of the energy goes into rotation.'));
        S.r('v', v, 'm/s'); S.r('a', a, 'm/s²');
      } },
    { id: 'carrucola', corso: 'I', arg: 'rig', nome: ['Carrucola con massa', 'Massive pulley'], dati: [['M', t('massa della carrucola (disco)', 'pulley mass (disc)'), 'kg', 2], ['m', t('massa appesa', 'hanging mass'), 'kg', 1], ['R', t('raggio', 'radius'), 'm', 0.1]],
      testo: function (d) { return [ 'Un filo avvolto su una carrucola a disco (massa ' + d.M + ' kg, raggio ' + d.R + ' m) sostiene una massa di ' + d.m + ' kg. Trovare accelerazione, tensione e accelerazione angolare.', 'A string wound on a disc pulley (mass ' + d.M + ' kg, radius ' + d.R + ' m) holds a ' + d.m + ' kg mass. Find the acceleration, tension and angular acceleration.' ]; },
      risolvi: function (d, S) {
        S.p(t('Equazioni', 'Equations'), 'mg − T = ma ; T·R = Iα = ½MR²·(a/R) ⇒ T = ½Ma');
        var a = S.f('a', 'a = mg/(m + M/2)', '', d.m * g / (d.m + d.M / 2), 'm/s²'), T = S.f('T', 'T = ½Ma', '', 0.5 * d.M * a, 'N'), al = S.f('α', 'α = a/R', '', a / d.R, 'rad/s²');
        S.r('a', a, 'm/s²'); S.r('T', T, 'N'); S.r('α', al, 'rad/s²');
      } },
    { id: 'stevino', corso: 'I', arg: 'flu', nome: ['Legge di Stevino', 'Stevin’s law'], dati: [['rho', 'ρ', 'kg/m³', 1025], ['h', t('profondità', 'depth'), 'm', 30], ['p0', 'p₀', 'Pa', 101325]],
      testo: function (d) { return [ 'Quale pressione si misura a ' + d.h + ' m di profondità in un liquido di densità ' + d.rho + ' kg/m³, con pressione atmosferica ' + d.p0 + ' Pa?', 'What pressure is measured at a depth of ' + d.h + ' m in a liquid of density ' + d.rho + ' kg/m³, with atmospheric pressure ' + d.p0 + ' Pa?' ]; },
      risolvi: function (d, S) { var p = S.f(t('Pressione', 'Pressure'), 'p = p₀ + ρgh', n4(d.p0) + ' + ' + n4(d.rho) + '·9,81·' + n4(d.h), d.p0 + d.rho * g * d.h, 'Pa'); S.p(t('In atmosfere', 'In atmospheres'), q(p / 101325, 'atm')); S.r('p', p, 'Pa'); } },
    { id: 'archimede', corso: 'I', arg: 'flu', nome: ['Principio di Archimede', 'Archimedes’ principle'], dati: [['rc', t('densità del corpo', 'body density'), 'kg/m³', 700], ['rf', t('densità del fluido', 'fluid density'), 'kg/m³', 1000], ['V', t('volume', 'volume'), 'm³', 0.002]],
      testo: function (d) { return [ 'Un corpo di volume ' + d.V + ' m³ e densità ' + d.rc + ' kg/m³ è messo in un fluido di densità ' + d.rf + ' kg/m³. Galleggia? Che frazione resta immersa (o qual è il peso apparente)?', 'A body of volume ' + d.V + ' m³ and density ' + d.rc + ' kg/m³ is placed in a fluid of density ' + d.rf + ' kg/m³. Does it float? What fraction is submerged (or what is its apparent weight)?' ]; },
      risolvi: function (d, S) {
        var P = S.f(t('Peso', 'Weight'), 'P = ρ_c V g', '', d.rc * d.V * g, 'N'), Sp = S.f(t('Spinta da completamente immerso', 'Buoyancy when fully submerged'), 'S = ρ_f V g', '', d.rf * d.V * g, 'N');
        if (d.rc < d.rf) { var fr = S.f(t('Galleggia: frazione immersa', 'It floats: submerged fraction'), 'V_imm/V = ρ_c/ρ_f', '', d.rc / d.rf, ''); S.r(t('frazione immersa', 'submerged fraction'), fr, ''); }
        else { var pa = S.f(t('Affonda: peso apparente', 'It sinks: apparent weight'), 'P_app = P − S', '', P - Sp, 'N'); S.r(t('peso apparente', 'apparent weight'), pa, 'N'); }
        S.r(t('spinta massima', 'max buoyancy'), Sp, 'N');
      } },
    { id: 'torricelli', corso: 'I', arg: 'flu', nome: ['Teorema di Torricelli', 'Torricelli’s theorem'], dati: [['h', t('profondità del foro', 'hole depth'), 'm', 2], ['A', t('area del foro', 'hole area'), 'm²', 1e-4]],
      testo: function (d) { return [ 'Da un foro di area ' + n4(d.A) + ' m² praticato ' + d.h + ' m sotto il pelo libero di un serbatoio aperto esce acqua. Trovare la velocità di efflusso e la portata.', 'Water flows from a hole of area ' + n4(d.A) + ' m² located ' + d.h + ' m below the free surface of an open tank. Find the outflow speed and the flow rate.' ]; },
      risolvi: function (d, S) { S.p('Bernoulli', t('Fra il pelo libero (v ≈ 0, p₀) e il foro (p₀): ρgh = ½ρv².', 'Between the free surface (v ≈ 0, p₀) and the hole (p₀): ρgh = ½ρv².')); var v = S.f('v', 'v = √(2gh)', '', Math.sqrt(2 * g * d.h), 'm/s'), Qp = S.f(t('Portata', 'Flow rate'), 'Q = A·v', '', d.A * v, 'm³/s'); S.p(t('In litri al secondo', 'In litres per second'), q(Qp * 1000, 'L/s')); S.r('v', v, 'm/s'); S.r('Q', Qp, 'm³/s'); } },
    { id: 'venturi', corso: 'I', arg: 'flu', nome: ['Continuità e Bernoulli (Venturi)', 'Continuity and Bernoulli (Venturi)'], dati: [['A1', 'A₁', 'm²', 0.01], ['A2', 'A₂', 'm²', 0.004], ['v1', 'v₁', 'm/s', 2], ['p1', 'p₁', 'Pa', 150000], ['rho', 'ρ', 'kg/m³', 1000]],
      testo: function (d) { return [ 'In un tubo orizzontale l’acqua passa da una sezione di ' + d.A1 + ' m² (v = ' + d.v1 + ' m/s, p = ' + d.p1 + ' Pa) a una strozzatura di ' + d.A2 + ' m². Trovare velocità e pressione nella strozzatura.', 'In a horizontal pipe water flows from a ' + d.A1 + ' m² section (v = ' + d.v1 + ' m/s, p = ' + d.p1 + ' Pa) into a ' + d.A2 + ' m² constriction. Find the speed and pressure in the constriction.' ]; },
      risolvi: function (d, S) { var v2 = S.f(t('Continuità', 'Continuity'), 'v₂ = A₁v₁/A₂', '', d.A1 * d.v1 / d.A2, 'm/s'); var p2 = S.f('Bernoulli', 'p₂ = p₁ + ½ρ(v₁² − v₂²)', '', d.p1 + 0.5 * d.rho * (d.v1 * d.v1 - v2 * v2), 'Pa'); S.p(t('Effetto Venturi', 'Venturi effect'), t('Dove il fluido accelera la pressione cala.', 'Where the fluid speeds up the pressure drops.')); S.r('v₂', v2, 'm/s'); S.r('p₂', p2, 'Pa'); } },
    { id: 'gasperfetto', corso: 'I', arg: 'term', nome: ['Equazione di stato dei gas perfetti', 'Ideal gas equation of state'], dati: [['n', 'n', 'mol', 2], ['T', 'T', 'K', 300], ['V', 'V', 'm³', 0.05]],
      testo: function (d) { return [ d.n + ' mol di gas perfetto a ' + d.T + ' K occupano ' + d.V + ' m³. Quale pressione esercitano?', d.n + ' mol of ideal gas at ' + d.T + ' K occupy ' + d.V + ' m³. What pressure do they exert?' ]; },
      risolvi: function (d, S) { var p = S.f(t('Pressione', 'Pressure'), 'p = nRT/V', n4(d.n) + '·8,314·' + n4(d.T) + '/' + n4(d.V), d.n * Rg * d.T / d.V, 'Pa'); S.p(t('In atmosfere e bar', 'In atmospheres and bar'), q(p / 101325, 'atm') + ' = ' + q(p / 1e5, 'bar')); S.r('p', p, 'Pa'); } },
    { id: 'isoterma', corso: 'I', arg: 'term', nome: ['Trasformazione isoterma reversibile', 'Reversible isothermal process'], dati: [['n', 'n', 'mol', 1], ['T', 'T', 'K', 300], ['V1', 'V₁', 'm³', 0.01], ['V2', 'V₂', 'm³', 0.03]],
      testo: function (d) { return [ d.n + ' mol di gas perfetto si espandono in modo isotermo e reversibile a ' + d.T + ' K da ' + d.V1 + ' a ' + d.V2 + ' m³. Calcolare lavoro, calore, variazione di energia interna e di entropia.', d.n + ' mol of ideal gas expand isothermally and reversibly at ' + d.T + ' K from ' + d.V1 + ' to ' + d.V2 + ' m³. Compute the work, heat, internal-energy and entropy changes.' ]; },
      risolvi: function (d, S) {
        S.p(t('Gas perfetto a T costante', 'Ideal gas at constant T'), t('U dipende solo da T: ΔU = 0, quindi Q = L (primo principio).', 'U depends only on T: ΔU = 0, hence Q = W (first law).'));
        var L = S.f(t('Lavoro fatto dal gas', 'Work done by the gas'), 'L = nRT ln(V₂/V₁)', '', d.n * Rg * d.T * Math.log(d.V2 / d.V1), 'J'), dS = S.f('ΔS', 'ΔS = Q/T = nR ln(V₂/V₁)', '', d.n * Rg * Math.log(d.V2 / d.V1), 'J/K');
        S.r('L = Q', L, 'J'); S.r('ΔU', 0, 'J'); S.r('ΔS', dS, 'J/K');
      } },
    { id: 'isobara', corso: 'I', arg: 'term', nome: ['Trasformazione isobara', 'Isobaric process'], dati: [['n', 'n', 'mol', 2], ['gas', t('gas: mono | bi', 'gas: mono | bi'), '', 'bi'], ['T1', 'T₁', 'K', 300], ['T2', 'T₂', 'K', 400]],
      testo: function (d) { return [ d.n + ' mol di gas perfetto ' + gasNome(d) + ' sono scaldate a pressione costante da ' + d.T1 + ' K a ' + d.T2 + ' K. Calcolare Q, L, ΔU e ΔS.', d.n + ' mol of ' + gasNome(d) + ' ideal gas are heated at constant pressure from ' + d.T1 + ' K to ' + d.T2 + ' K. Compute Q, W, ΔU and ΔS.' ]; },
      risolvi: function (d, S) {
        var cv = GAS[d.gas === 'bi' ? 'bi' : 'mono'][0] * Rg, cp = cv + Rg, dT = d.T2 - d.T1;
        S.p(t('Calori specifici molari', 'Molar heat capacities'), 'c_V = ' + (d.gas === 'bi' ? '5/2' : '3/2') + ' R = ' + q(cv, 'J/(mol·K)') + ', c_p = c_V + R = ' + q(cp, 'J/(mol·K)'));
        var Q = S.f('Q', 'Q = n c_p ΔT', '', d.n * cp * dT, 'J'), L = S.f('L', 'L = p ΔV = nRΔT', '', d.n * Rg * dT, 'J'), U = S.f('ΔU', 'ΔU = n c_V ΔT = Q − L', '', d.n * cv * dT, 'J'), dS = S.f('ΔS', 'ΔS = n c_p ln(T₂/T₁)', '', d.n * cp * Math.log(d.T2 / d.T1), 'J/K');
        S.r('Q', Q, 'J'); S.r('L', L, 'J'); S.r('ΔU', U, 'J'); S.r('ΔS', dS, 'J/K');
      } },
    { id: 'isocora', corso: 'I', arg: 'term', nome: ['Trasformazione isocora', 'Isochoric process'], dati: [['n', 'n', 'mol', 1], ['gas', t('gas: mono | bi', 'gas: mono | bi'), '', 'mono'], ['T1', 'T₁', 'K', 300], ['T2', 'T₂', 'K', 600]],
      testo: function (d) { return [ d.n + ' mol di gas perfetto ' + gasNome(d) + ' sono scaldate a volume costante da ' + d.T1 + ' K a ' + d.T2 + ' K. Calcolare Q, L, ΔU e ΔS.', d.n + ' mol of ' + gasNome(d) + ' ideal gas are heated at constant volume from ' + d.T1 + ' K to ' + d.T2 + ' K. Compute Q, W, ΔU and ΔS.' ]; },
      risolvi: function (d, S) { var cv = GAS[d.gas === 'bi' ? 'bi' : 'mono'][0] * Rg; S.p(t('Volume costante', 'Constant volume'), t('L = 0, quindi Q = ΔU.', 'W = 0, hence Q = ΔU.')); var Q = S.f('Q = ΔU', 'Q = n c_V ΔT', '', d.n * cv * (d.T2 - d.T1), 'J'), dS = S.f('ΔS', 'ΔS = n c_V ln(T₂/T₁)', '', d.n * cv * Math.log(d.T2 / d.T1), 'J/K'); S.r('Q', Q, 'J'); S.r('L', 0, 'J'); S.r('ΔS', dS, 'J/K'); } },
    { id: 'adiabatica', corso: 'I', arg: 'term', nome: ['Adiabatica reversibile', 'Reversible adiabatic'], dati: [['n', 'n', 'mol', 1], ['gas', t('gas: mono | bi', 'gas: mono | bi'), '', 'bi'], ['T1', 'T₁', 'K', 300], ['V1', 'V₁', 'm³', 0.02], ['V2', 'V₂', 'm³', 0.01]],
      testo: function (d) { return [ d.n + ' mol di gas perfetto ' + gasNome(d) + ' a ' + d.T1 + ' K sono compresse in modo adiabatico reversibile da ' + d.V1 + ' a ' + d.V2 + ' m³. Trovare la temperatura finale, le pressioni e il lavoro.', d.n + ' mol of ' + gasNome(d) + ' ideal gas at ' + d.T1 + ' K are compressed reversibly and adiabatically from ' + d.V1 + ' to ' + d.V2 + ' m³. Find the final temperature, the pressures and the work.' ]; },
      risolvi: function (d, S) {
        var cv = GAS[d.gas === 'bi' ? 'bi' : 'mono'][0] * Rg, gm = (cv + Rg) / cv;
        S.p(t('Adiabatica', 'Adiabatic'), 'Q = 0; pV^γ = cost, TV^(γ−1) = cost; γ = c_p/c_V = ' + n4(gm));
        var T2 = S.f('T₂', 'T₂ = T₁(V₁/V₂)^(γ−1)', '', d.T1 * Math.pow(d.V1 / d.V2, gm - 1), 'K'), p1 = d.n * Rg * d.T1 / d.V1, p2 = d.n * Rg * T2 / d.V2;
        S.p(t('Pressioni', 'Pressures'), 'p₁ = nRT₁/V₁ = ' + q(p1, 'Pa') + ', p₂ = nRT₂/V₂ = ' + q(p2, 'Pa'));
        var L = S.f(t('Lavoro fatto dal gas', 'Work done by the gas'), 'L = −ΔU = n c_V (T₁ − T₂)', '', d.n * cv * (d.T1 - T2), 'J');
        S.r('T₂', T2, 'K'); S.r('p₂', p2, 'Pa'); S.r('L', L, 'J');
      } },
    { id: 'carnot', corso: 'I', arg: 'term', nome: ['Macchina di Carnot', 'Carnot engine'], dati: [['T1', t('T sorgente calda', 'hot reservoir T'), 'K', 500], ['T2', t('T sorgente fredda', 'cold reservoir T'), 'K', 300], ['Q1', t('calore assorbito Q₁', 'heat absorbed Q₁'), 'J', 1000]],
      testo: function (d) { return [ 'Una macchina di Carnot lavora fra ' + d.T1 + ' K e ' + d.T2 + ' K e assorbe ' + d.Q1 + ' J per ciclo. Trovare rendimento, lavoro e calore ceduto.', 'A Carnot engine works between ' + d.T1 + ' K and ' + d.T2 + ' K and absorbs ' + d.Q1 + ' J per cycle. Find the efficiency, work and heat rejected.' ]; },
      risolvi: function (d, S) { var eta = S.f(t('Rendimento', 'Efficiency'), 'η = 1 − T₂/T₁', '', 1 - d.T2 / d.T1, ''), L = S.f(t('Lavoro', 'Work'), 'L = ηQ₁', '', eta * d.Q1, 'J'), Q2 = S.f(t('Calore ceduto', 'Heat rejected'), '|Q₂| = Q₁ − L', '', d.Q1 - L, 'J'); S.p(t('Secondo principio', 'Second law'), t('Nessuna macchina fra le stesse sorgenti ha rendimento maggiore; per il ciclo ΔS_universo = Q₁/T₁ − |Q₂|/T₂ = 0.', 'No engine between the same reservoirs is more efficient; for the cycle ΔS_universe = Q₁/T₁ − |Q₂|/T₂ = 0.')); S.r('η', eta, ''); S.r('L', L, 'J'); S.r('|Q₂|', Q2, 'J'); } },
    { id: 'calorimetria', corso: 'I', arg: 'term', nome: ['Calorimetria ed entropia del mescolamento', 'Calorimetry and mixing entropy'], dati: [['m1', 'm₁', 'kg', 0.2], ['c1', 'c₁', 'J/(kg·K)', 4186], ['T1', 'T₁', 'K', 353], ['m2', 'm₂', 'kg', 0.3], ['c2', 'c₂', 'J/(kg·K)', 4186], ['T2', 'T₂', 'K', 293]],
      testo: function (d) { return [ 'Si mescolano ' + d.m1 + ' kg a ' + d.T1 + ' K (c = ' + d.c1 + ' J/(kg·K)) e ' + d.m2 + ' kg a ' + d.T2 + ' K (c = ' + d.c2 + ' J/(kg·K)) in un recipiente adiabatico. Trovare la temperatura di equilibrio e la variazione di entropia.', d.m1 + ' kg at ' + d.T1 + ' K (c = ' + d.c1 + ' J/(kg·K)) and ' + d.m2 + ' kg at ' + d.T2 + ' K (c = ' + d.c2 + ' J/(kg·K)) are mixed in an adiabatic vessel. Find the equilibrium temperature and the entropy change.' ]; },
      risolvi: function (d, S) {
        var Te = S.f(t('Equilibrio (calore ceduto = assorbito)', 'Equilibrium (heat lost = gained)'), 'T_e = (m₁c₁T₁ + m₂c₂T₂)/(m₁c₁ + m₂c₂)', '', (d.m1 * d.c1 * d.T1 + d.m2 * d.c2 * d.T2) / (d.m1 * d.c1 + d.m2 * d.c2), 'K');
        var s1 = d.m1 * d.c1 * Math.log(Te / d.T1), s2 = d.m2 * d.c2 * Math.log(Te / d.T2);
        S.p(t('Entropia di ciascun corpo', 'Entropy of each body'), 'ΔS₁ = m₁c₁ ln(T_e/T₁) = ' + q(s1, 'J/K') + ', ΔS₂ = m₂c₂ ln(T_e/T₂) = ' + q(s2, 'J/K'));
        var dS = S.f(t('Entropia totale (> 0: processo irreversibile)', 'Total entropy (> 0: irreversible)'), 'ΔS = ΔS₁ + ΔS₂', '', s1 + s2, 'J/K');
        S.r('T_e', Te, 'K'); S.r('ΔS', dS, 'J/K');
      } },
    { id: 'ghiaccio', corso: 'I', arg: 'term', nome: ['Fusione del ghiaccio', 'Melting ice'], dati: [['mg', t('ghiaccio a 0 °C', 'ice at 0 °C'), 'kg', 0.05], ['ma', t('acqua', 'water'), 'kg', 0.3], ['Ta', t('T dell’acqua', 'water T'), '°C', 40]],
      testo: function (d) { return [ d.mg + ' kg di ghiaccio a 0 °C sono messi in ' + d.ma + ' kg d’acqua a ' + d.Ta + ' °C in un calorimetro ideale. Si scioglie tutto? Qual è la temperatura finale?', d.mg + ' kg of ice at 0 °C are put into ' + d.ma + ' kg of water at ' + d.Ta + ' °C in an ideal calorimeter. Does it all melt? What is the final temperature?' ]; },
      risolvi: function (d, S) {
        var Lf = 333.5e3, cw = 4186, Qf = S.f(t('Calore per fondere tutto il ghiaccio', 'Heat to melt all the ice'), 'Q_f = m_g L_f', n4(d.mg) + '·3,335·10⁵', d.mg * Lf, 'J'), Qd = S.f(t('Calore che l’acqua cede scendendo a 0 °C', 'Heat the water gives cooling to 0 °C'), 'Q_a = m_a c ΔT', '', d.ma * cw * d.Ta, 'J');
        if (Qd >= Qf) { var Tf = S.f(t('Si scioglie tutto: T finale', 'All melts: final T'), 'T = (m_a c T_a − m_g L_f)/((m_a + m_g)c)', '', (d.ma * cw * d.Ta - d.mg * Lf) / ((d.ma + d.mg) * cw), '°C'); S.r('T', Tf, '°C'); }
        else { var fuso = S.f(t('Non basta: ghiaccio fuso', 'Not enough: ice melted'), 'm = Q_a/L_f', '', Qd / Lf, 'kg'); S.p(t('Risultato', 'Result'), t('Resta ghiaccio: la temperatura finale è 0 °C.', 'Ice remains: the final temperature is 0 °C.')); S.r('T', 0, '°C'); S.r(t('ghiaccio fuso', 'ice melted'), fuso, 'kg'); }
      } },
    /* ───────────── FISICA GENERALE II ───────────── */
    { id: 'coulomb', corso: 'II', arg: 'ele', nome: ['Legge di Coulomb', 'Coulomb’s law'], dati: [['q1', 'q₁', 'μC', 3], ['q2', 'q₂', 'μC', -5], ['r', t('distanza', 'distance'), 'm', 0.2]],
      testo: function (d) { return [ 'Due cariche puntiformi q₁ = ' + d.q1 + ' μC e q₂ = ' + d.q2 + ' μC sono a ' + d.r + ' m. Trovare la forza, il campo di q₁ nella posizione di q₂ e l’energia potenziale.', 'Two point charges q₁ = ' + d.q1 + ' μC and q₂ = ' + d.q2 + ' μC are ' + d.r + ' m apart. Find the force, the field of q₁ at q₂ and the potential energy.' ]; },
      risolvi: function (d, S) {
        var a = d.q1 * 1e-6, b = d.q2 * 1e-6;
        var Fz = S.f(t('Forza', 'Force'), 'F = k|q₁q₂|/r²', '8,988·10⁹·|' + n4(a) + '·' + n4(b) + '|/' + n4(d.r) + '²', kC * Math.abs(a * b) / (d.r * d.r), 'N');
        S.p(t('Verso', 'Direction'), a * b < 0 ? t('cariche di segno opposto: attrattiva', 'opposite charges: attractive') : t('cariche dello stesso segno: repulsiva', 'like charges: repulsive'));
        var E = S.f(t('Campo di q₁ a distanza r', 'Field of q₁ at distance r'), 'E = k|q₁|/r²', '', kC * Math.abs(a) / (d.r * d.r), 'N/C'), U = S.f(t('Energia potenziale', 'Potential energy'), 'U = kq₁q₂/r', '', kC * a * b / d.r, 'J');
        S.r('F', Fz, 'N'); S.r('E', E, 'N/C'); S.r('U', U, 'J');
      } },
    { id: 'duecariche', corso: 'II', arg: 'ele', nome: ['Campo e potenziale di due cariche', 'Field and potential of two charges'], dati: [['q1', t('q₁ in x = 0', 'q₁ at x = 0'), 'nC', 4], ['q2', t('q₂ in x = d', 'q₂ at x = d'), 'nC', -2], ['d', 'd', 'm', 0.3], ['x', t('punto x sull’asse', 'point x on the axis'), 'm', 0.1]],
      testo: function (d) { return [ 'Una carica di ' + d.q1 + ' nC è nell’origine e una di ' + d.q2 + ' nC in x = ' + d.d + ' m. Trovare campo elettrico e potenziale nel punto x = ' + d.x + ' m dell’asse.', 'A ' + d.q1 + ' nC charge is at the origin and a ' + d.q2 + ' nC charge at x = ' + d.d + ' m. Find the electric field and potential at x = ' + d.x + ' m on the axis.' ]; },
      risolvi: function (d, S) {
        var a = d.q1 * 1e-9, b = d.q2 * 1e-9, r1 = d.x, r2 = d.x - d.d;
        var E1 = kC * a * Math.sign(r1) / (r1 * r1), E2 = kC * b * Math.sign(r2) / (r2 * r2);
        S.p(t('Sovrapposizione', 'Superposition'), t('Ogni carica dà E = kq/r² diretto lungo la congiungente (uscente se q > 0). Componenti lungo x: ', 'Each charge gives E = kq/r² along the joining line (outward if q > 0). x components: ') + 'E₁ = ' + q(E1, 'N/C') + ', E₂ = ' + q(E2, 'N/C'));
        var E = S.f(t('Campo totale', 'Total field'), 'E = E₁ + E₂', '', E1 + E2, 'N/C'), V = S.f(t('Potenziale (scalare: si sommano i valori con il segno)', 'Potential (scalar: values add with their sign)'), 'V = kq₁/|r₁| + kq₂/|r₂|', '', kC * a / Math.abs(r1) + kC * b / Math.abs(r2), 'V');
        S.r('Eₓ', E, 'N/C'); S.r('V', V, 'V');
      } },
    { id: 'gauss', corso: 'II', arg: 'ele', nome: ['Teorema di Gauss', 'Gauss’s law'], dati: [['tipo', t('distribuzione: sfera | sferapiena | filo | piano', 'distribution: sfera | sferapiena | filo | piano'), '', 'sfera'], ['Q', t('carica Q (o λ in C/m, σ in C/m²)', 'charge Q (or λ in C/m, σ in C/m²)'), 'C', 2e-9], ['R', t('raggio R', 'radius R'), 'm', 0.1], ['r', t('distanza r dal centro / dal filo', 'distance r from centre / wire'), 'm', 0.05]],
      testo: function (d) { return [ 'Con il teorema di Gauss trovare il campo elettrico a distanza ' + d.r + ' m per la distribuzione «' + d.tipo + '» con carica ' + n4(d.Q) + (d.tipo === 'sfera' || d.tipo === 'sferapiena' ? ' C e raggio ' + d.R + ' m.' : '.'), 'Use Gauss’s law to find the electric field at distance ' + d.r + ' m for the «' + d.tipo + '» distribution with charge ' + n4(d.Q) + (d.tipo === 'sfera' || d.tipo === 'sferapiena' ? ' C and radius ' + d.R + ' m.' : '.') ]; },
      risolvi: function (d, S) {
        S.p(t('Teorema di Gauss', 'Gauss’s law'), 'Φ(E) = ∮E·dA = Q_int/ε₀. ' + t('Si sceglie una superficie con la simmetria della carica, su cui E è costante e perpendicolare.', 'Choose a surface with the symmetry of the charge, on which E is constant and perpendicular.'));
        var E;
        if (d.tipo === 'filo') E = S.f(t('Filo infinito (cilindro gaussiano)', 'Infinite wire (Gaussian cylinder)'), 'E = λ/(2πε₀r)', '', d.Q / (2 * Math.PI * e0 * d.r), 'N/C');
        else if (d.tipo === 'piano') E = S.f(t('Piano infinito (scatola gaussiana)', 'Infinite plane (Gaussian pillbox)'), 'E = σ/(2ε₀)', '', d.Q / (2 * e0), 'N/C');
        else if (d.r >= d.R) { E = S.f(t('Fuori dalla sfera: come una carica puntiforme', 'Outside the sphere: like a point charge'), 'E = kQ/r²', '', kC * d.Q / (d.r * d.r), 'N/C'); S.f(t('Potenziale', 'Potential'), 'V = kQ/r', '', kC * d.Q / d.r, 'V'); }
        else if (d.tipo === 'sfera') { E = S.f(t('Dentro un conduttore', 'Inside a conductor'), 'E = 0', t('la carica sta sulla superficie', 'the charge sits on the surface'), 0, 'N/C'); S.f(t('Potenziale (costante, pari a quello della superficie)', 'Potential (constant, equal to the surface value)'), 'V = kQ/R', '', kC * d.Q / d.R, 'V'); }
        else { E = S.f(t('Dentro una sfera uniformemente carica', 'Inside a uniformly charged sphere'), 'E = kQr/R³', '', kC * d.Q * d.r / Math.pow(d.R, 3), 'N/C'); S.p(t('Nota', 'Note'), t('Q_int = Q(r/R)³: il campo cresce linearmente con r.', 'Q_int = Q(r/R)³: the field grows linearly with r.')); }
        S.r('E', E, 'N/C');
      } },
    { id: 'condpiano', corso: 'II', arg: 'ele', nome: ['Condensatore piano', 'Parallel-plate capacitor'], dati: [['A', t('area', 'area'), 'm²', 0.02], ['d', t('distanza', 'gap'), 'm', 0.001], ['er', 'ε_r', '', 1], ['V', 'ΔV', 'V', 100]],
      testo: function (d) { return [ 'Un condensatore piano ha armature di ' + d.A + ' m² a ' + d.d + ' m (dielettrico ε_r = ' + d.er + ') ed è caricato a ' + d.V + ' V. Trovare capacità, carica, campo ed energia.', 'A parallel-plate capacitor has ' + d.A + ' m² plates ' + d.d + ' m apart (dielectric ε_r = ' + d.er + ') charged to ' + d.V + ' V. Find capacitance, charge, field and energy.' ]; },
      risolvi: function (d, S) { var Cc = S.f(t('Capacità', 'Capacitance'), 'C = ε₀ε_r A/d', '', e0 * d.er * d.A / d.d, 'F'), Qc = S.f(t('Carica', 'Charge'), 'Q = CΔV', '', Cc * d.V, 'C'), E = S.f(t('Campo', 'Field'), 'E = ΔV/d', '', d.V / d.d, 'V/m'), U = S.f(t('Energia', 'Energy'), 'U = ½CΔV²', '', 0.5 * Cc * d.V * d.V, 'J'); S.r('C', Cc, 'F'); S.r('Q', Qc, 'C'); S.r('E', E, 'V/m'); S.r('U', U, 'J'); } },
    { id: 'condensatori', corso: 'II', arg: 'ele', nome: ['Condensatori in serie e parallelo', 'Capacitors in series and parallel'], dati: [['C1', 'C₁', 'μF', 2], ['C2', 'C₂', 'μF', 3], ['C3', 'C₃', 'μF', 6], ['schema', t('schema: serie | parallelo | misto (C₁ in serie con C₂∥C₃)', 'layout: serie | parallelo | misto (C₁ in series with C₂∥C₃)'), '', 'misto'], ['V', 'ΔV', 'V', 12]],
      testo: function (d) { return [ 'Tre condensatori (C₁ = ' + d.C1 + ', C₂ = ' + d.C2 + ', C₃ = ' + d.C3 + ' μF) sono collegati «' + d.schema + '» a una batteria di ' + d.V + ' V. Trovare la capacità equivalente e la carica fornita dalla batteria.', 'Three capacitors (C₁ = ' + d.C1 + ', C₂ = ' + d.C2 + ', C₃ = ' + d.C3 + ' μF) are connected «' + d.schema + '» to a ' + d.V + ' V battery. Find the equivalent capacitance and the charge supplied.' ]; },
      risolvi: function (d, S) {
        var c1 = d.C1 * 1e-6, c2 = d.C2 * 1e-6, c3 = d.C3 * 1e-6, Ce;
        S.p(t('Regole', 'Rules'), t('Parallelo: le capacità si sommano (stessa ΔV). Serie: si sommano gli inversi (stessa carica).', 'Parallel: capacitances add (same ΔV). Series: reciprocals add (same charge).'));
        if (d.schema === 'serie') Ce = S.f('C_eq', '1/C_eq = 1/C₁ + 1/C₂ + 1/C₃', '', 1 / (1 / c1 + 1 / c2 + 1 / c3), 'F');
        else if (d.schema === 'parallelo') Ce = S.f('C_eq', 'C_eq = C₁ + C₂ + C₃', '', c1 + c2 + c3, 'F');
        else { var c23 = S.f('C₂₃', 'C₂₃ = C₂ + C₃', '', c2 + c3, 'F'); Ce = S.f('C_eq', 'C_eq = C₁C₂₃/(C₁ + C₂₃)', '', c1 * c23 / (c1 + c23), 'F'); var Q1 = Ce * d.V; S.p(t('Tensioni', 'Voltages'), 'ΔV₁ = Q/C₁ = ' + q(Q1 / c1, 'V') + ', ΔV₂₃ = Q/C₂₃ = ' + q(Q1 / c23, 'V')); }
        var Q = S.f(t('Carica dalla batteria', 'Charge from the battery'), 'Q = C_eq ΔV', '', Ce * d.V, 'C');
        S.r('C_eq', Ce, 'F'); S.r('Q', Q, 'C');
      } },
    { id: 'resistenze', corso: 'II', arg: 'cor', nome: ['Resistenze e legge di Ohm', 'Resistors and Ohm’s law'], dati: [['R1', 'R₁', 'Ω', 10], ['R2', 'R₂', 'Ω', 20], ['R3', 'R₃', 'Ω', 30], ['schema', t('schema: serie | parallelo | misto (R₁ in serie con R₂∥R₃)', 'layout: serie | parallelo | misto (R₁ in series with R₂∥R₃)'), '', 'misto'], ['V', 'ΔV', 'V', 24]],
      testo: function (d) { return [ 'Tre resistori (R₁ = ' + d.R1 + ', R₂ = ' + d.R2 + ', R₃ = ' + d.R3 + ' Ω) sono collegati «' + d.schema + '» a un generatore ideale di ' + d.V + ' V. Trovare la resistenza equivalente, la corrente e la potenza dissipata.', 'Three resistors (R₁ = ' + d.R1 + ', R₂ = ' + d.R2 + ', R₃ = ' + d.R3 + ' Ω) are connected «' + d.schema + '» to an ideal ' + d.V + ' V source. Find the equivalent resistance, the current and the power dissipated.' ]; },
      risolvi: function (d, S) {
        var Re;
        S.p(t('Regole', 'Rules'), t('Serie: le resistenze si sommano (stessa corrente). Parallelo: si sommano gli inversi (stessa tensione).', 'Series: resistances add (same current). Parallel: reciprocals add (same voltage).'));
        if (d.schema === 'serie') Re = S.f('R_eq', 'R_eq = R₁ + R₂ + R₃', '', d.R1 + d.R2 + d.R3, 'Ω');
        else if (d.schema === 'parallelo') Re = S.f('R_eq', '1/R_eq = 1/R₁ + 1/R₂ + 1/R₃', '', 1 / (1 / d.R1 + 1 / d.R2 + 1 / d.R3), 'Ω');
        else { var r23 = S.f('R₂₃', 'R₂₃ = R₂R₃/(R₂ + R₃)', '', d.R2 * d.R3 / (d.R2 + d.R3), 'Ω'); Re = S.f('R_eq', 'R_eq = R₁ + R₂₃', '', d.R1 + r23, 'Ω'); var I0 = d.V / Re, V23 = I0 * r23; S.p(t('Correnti nei rami', 'Branch currents'), 'ΔV₂₃ = I·R₂₃ = ' + q(V23, 'V') + ' ⇒ I₂ = ' + q(V23 / d.R2, 'A') + ', I₃ = ' + q(V23 / d.R3, 'A')); }
        var I = S.f(t('Corrente', 'Current'), 'I = ΔV/R_eq', '', d.V / Re, 'A'), P = S.f(t('Potenza', 'Power'), 'P = ΔV·I = ΔV²/R_eq', '', d.V * d.V / Re, 'W');
        S.r('R_eq', Re, 'Ω'); S.r('I', I, 'A'); S.r('P', P, 'W');
      } },
    { id: 'kirchhoff', corso: 'II', arg: 'cor', nome: ['Leggi di Kirchhoff (due maglie)', 'Kirchhoff’s laws (two loops)'], dati: [['E1', 'ℰ₁', 'V', 12], ['E2', 'ℰ₂', 'V', 6], ['R1', 'R₁', 'Ω', 4], ['R2', 'R₂', 'Ω', 2], ['R3', t('R₃ (ramo centrale)', 'R₃ (middle branch)'), 'Ω', 6]],
      testo: function (d) { return [ 'Il circuito ha tre rami in parallelo fra due nodi: a sinistra ℰ₁ = ' + d.E1 + ' V in serie con R₁ = ' + d.R1 + ' Ω, al centro R₃ = ' + d.R3 + ' Ω, a destra ℰ₂ = ' + d.E2 + ' V in serie con R₂ = ' + d.R2 + ' Ω (poli positivi verso il nodo superiore). Trovare le tre correnti.', 'The circuit has three branches between two nodes: on the left ℰ₁ = ' + d.E1 + ' V in series with R₁ = ' + d.R1 + ' Ω, in the middle R₃ = ' + d.R3 + ' Ω, on the right ℰ₂ = ' + d.E2 + ' V in series with R₂ = ' + d.R2 + ' Ω (positive terminals towards the top node). Find the three currents.' ]; },
      risolvi: function (d, S) {
        S.p(t('Equazioni', 'Equations'), t('Nodo: I₃ = I₁ + I₂ (I₁ e I₂ salgono nei rami laterali, I₃ scende nel centrale). Maglia sinistra: ℰ₁ = R₁I₁ + R₃I₃. Maglia destra: ℰ₂ = R₂I₂ + R₃I₃.', 'Node: I₃ = I₁ + I₂ (I₁ and I₂ go up the side branches, I₃ down the middle). Left loop: ℰ₁ = R₁I₁ + R₃I₃. Right loop: ℰ₂ = R₂I₂ + R₃I₃.'));
        var den = d.R1 * d.R2 + d.R1 * d.R3 + d.R2 * d.R3, I1 = (d.E1 * (d.R2 + d.R3) - d.E2 * d.R3) / den, I2 = (d.E2 * (d.R1 + d.R3) - d.E1 * d.R3) / den, I3 = I1 + I2;
        S.p(t('Soluzione del sistema', 'Solving the system'), 'I₁ = [ℰ₁(R₂ + R₃) − ℰ₂R₃]/(R₁R₂ + R₁R₃ + R₂R₃) = <b>' + q(I1, 'A') + '</b><br>I₂ = [ℰ₂(R₁ + R₃) − ℰ₁R₃]/(R₁R₂ + R₁R₃ + R₂R₃) = <b>' + q(I2, 'A') + '</b><br>I₃ = I₁ + I₂ = <b>' + q(I3, 'A') + '</b>');
        if (I1 < 0 || I2 < 0) S.p(t('Segno', 'Sign'), t('Una corrente negativa scorre nel verso opposto a quello scelto: il generatore corrispondente si sta caricando.', 'A negative current flows opposite to the chosen direction: that source is being charged.'));
        S.r('I₁', I1, 'A'); S.r('I₂', I2, 'A'); S.r('I₃', I3, 'A');
      } },
    { id: 'rc', corso: 'II', arg: 'cor', nome: ['Carica di un condensatore (RC)', 'Charging a capacitor (RC)'], dati: [['R', 'R', 'kΩ', 10], ['C', 'C', 'μF', 100], ['E', 'ℰ', 'V', 9], ['t', 't', 's', 1]],
      testo: function (d) { return [ 'Un condensatore di ' + d.C + ' μF, scarico, è collegato a t = 0 a un generatore di ' + d.E + ' V attraverso ' + d.R + ' kΩ. Trovare la costante di tempo, la carica e la corrente dopo ' + d.t + ' s e l’energia finale.', 'An uncharged ' + d.C + ' μF capacitor is connected at t = 0 to a ' + d.E + ' V source through ' + d.R + ' kΩ. Find the time constant, the charge and current after ' + d.t + ' s and the final energy.' ]; },
      risolvi: function (d, S) {
        var R = d.R * 1e3, Cc = d.C * 1e-6, tau = S.f(t('Costante di tempo', 'Time constant'), 'τ = RC', n4(R) + '·' + n4(Cc), R * Cc, 's');
        var Qt = S.f(t('Carica', 'Charge'), 'q(t) = Cℰ(1 − e^(−t/τ))', '', Cc * d.E * (1 - Math.exp(-d.t / tau)), 'C'), It = S.f(t('Corrente', 'Current'), 'i(t) = (ℰ/R)e^(−t/τ)', '', d.E / R * Math.exp(-d.t / tau), 'A'), U = S.f(t('Energia immagazzinata alla fine', 'Final stored energy'), 'U = ½Cℰ²', '', 0.5 * Cc * d.E * d.E, 'J');
        S.p(t('Bilancio', 'Balance'), t('Il generatore fornisce Cℰ²: metà va nel condensatore, metà si dissipa nella resistenza, qualunque sia R.', 'The source supplies Cℰ²: half goes into the capacitor, half is dissipated in the resistor, whatever R.'));
        S.r('τ', tau, 's'); S.r('q', Qt, 'C'); S.r('i', It, 'A'); S.r('U', U, 'J');
      } },
    { id: 'lorentz', corso: 'II', arg: 'mag', nome: ['Carica in campo magnetico', 'Charge in a magnetic field'], dati: [['q', 'q', 'C', 1.602e-19], ['m', 'm', 'kg', 1.673e-27], ['v', 'v', 'm/s', 2e6], ['B', 'B', 'T', 0.5]],
      testo: function (d) { return [ 'Una particella (q = ' + n4(d.q) + ' C, m = ' + n4(d.m) + ' kg) entra con velocità ' + n4(d.v) + ' m/s perpendicolare a un campo magnetico uniforme di ' + d.B + ' T. Trovare forza, raggio della traiettoria e periodo.', 'A particle (q = ' + n4(d.q) + ' C, m = ' + n4(d.m) + ' kg) enters with speed ' + n4(d.v) + ' m/s perpendicular to a uniform ' + d.B + ' T magnetic field. Find the force, the orbit radius and the period.' ]; },
      risolvi: function (d, S) {
        var Fz = S.f(t('Forza di Lorentz', 'Lorentz force'), 'F = |q|vB', '', Math.abs(d.q) * d.v * d.B, 'N');
        S.p(t('Moto circolare', 'Circular motion'), t('La forza è perpendicolare alla velocità: non fa lavoro, cambia solo la direzione. ', 'The force is perpendicular to the velocity: it does no work, it only turns the motion. ') + '|q|vB = mv²/r');
        var r = S.f(t('Raggio', 'Radius'), 'r = mv/(|q|B)', '', d.m * d.v / (Math.abs(d.q) * d.B), 'm'), T = S.f(t('Periodo (indipendente da v)', 'Period (independent of v)'), 'T = 2πm/(|q|B)', '', 2 * Math.PI * d.m / (Math.abs(d.q) * d.B), 's');
        S.r('F', Fz, 'N'); S.r('r', r, 'm'); S.r('T', T, 's');
      } },
    { id: 'filo', corso: 'II', arg: 'mag', nome: ['Filo rettilineo e forza fra fili', 'Straight wire and force between wires'], dati: [['I1', 'I₁', 'A', 10], ['I2', 'I₂', 'A', 5], ['d', t('distanza', 'distance'), 'm', 0.05], ['L', t('lunghezza', 'length'), 'm', 1]],
      testo: function (d) { return [ 'Due fili rettilinei paralleli percorsi da ' + d.I1 + ' A e ' + d.I2 + ' A sono a ' + d.d + ' m. Trovare il campo del primo nella posizione del secondo e la forza su ' + d.L + ' m di filo.', 'Two parallel straight wires carrying ' + d.I1 + ' A and ' + d.I2 + ' A are ' + d.d + ' m apart. Find the field of the first at the second and the force on ' + d.L + ' m of wire.' ]; },
      risolvi: function (d, S) {
        var B = S.f(t('Biot-Savart / Ampère', 'Biot-Savart / Ampère'), 'B = μ₀I₁/(2πd)', '4π·10⁻⁷·' + n4(d.I1) + '/(2π·' + n4(d.d) + ')', mu0 * d.I1 / (2 * Math.PI * d.d), 'T');
        var Fz = S.f(t('Forza', 'Force'), 'F = I₂LB = μ₀I₁I₂L/(2πd)', '', d.I2 * d.L * B, 'N');
        S.p(t('Verso', 'Direction'), t('Correnti concordi si attraggono, discordi si respingono.', 'Parallel currents attract, antiparallel ones repel.'));
        S.r('B', B, 'T'); S.r('F', Fz, 'N');
      } },
    { id: 'solenoide', corso: 'II', arg: 'mag', nome: ['Solenoide', 'Solenoid'], dati: [['N', t('spire', 'turns'), '', 500], ['l', t('lunghezza', 'length'), 'm', 0.25], ['A', t('sezione', 'cross-section'), 'm²', 4e-4], ['I', 'I', 'A', 2]],
      testo: function (d) { return [ 'Un solenoide lungo ' + d.l + ' m, di sezione ' + n4(d.A) + ' m², ha ' + d.N + ' spire percorse da ' + d.I + ' A. Trovare il campo interno, l’induttanza e l’energia immagazzinata.', 'A solenoid ' + d.l + ' m long, of cross-section ' + n4(d.A) + ' m², has ' + d.N + ' turns carrying ' + d.I + ' A. Find the internal field, the inductance and the stored energy.' ]; },
      risolvi: function (d, S) { var B = S.f(t('Campo (legge di Ampère)', 'Field (Ampère’s law)'), 'B = μ₀(N/l)I', '', mu0 * d.N / d.l * d.I, 'T'), L = S.f(t('Induttanza', 'Inductance'), 'L = μ₀N²A/l', '', mu0 * d.N * d.N * d.A / d.l, 'H'), U = S.f(t('Energia', 'Energy'), 'U = ½LI²', '', 0.5 * L * d.I * d.I, 'J'); S.r('B', B, 'T'); S.r('L', L, 'H'); S.r('U', U, 'J'); } },
    { id: 'barretta', corso: 'II', arg: 'ind', nome: ['Barretta mobile (fem mozionale)', 'Moving rod (motional emf)'], dati: [['B', 'B', 'T', 0.4], ['l', t('lunghezza della barretta', 'rod length'), 'm', 0.5], ['v', 'v', 'm/s', 3], ['R', t('resistenza del circuito', 'circuit resistance'), 'Ω', 2]],
      testo: function (d) { return [ 'Una barretta lunga ' + d.l + ' m scorre a ' + d.v + ' m/s su due binari collegati da una resistenza di ' + d.R + ' Ω, in un campo magnetico di ' + d.B + ' T perpendicolare al circuito. Trovare fem, corrente, forza necessaria e potenza.', 'A ' + d.l + ' m rod slides at ' + d.v + ' m/s on two rails joined by a ' + d.R + ' Ω resistor, in a ' + d.B + ' T field perpendicular to the circuit. Find emf, current, required force and power.' ]; },
      risolvi: function (d, S) {
        S.p('Faraday-Lenz', t('Il flusso Φ = Blx cresce con x: ℰ = −dΦ/dt = −Blv. La corrente indotta si oppone al moto (Lenz).', 'The flux Φ = Blx grows with x: ℰ = −dΦ/dt = −Blv. The induced current opposes the motion (Lenz).'));
        var fem = S.f('ℰ', '|ℰ| = Blv', '', d.B * d.l * d.v, 'V'), I = S.f('I', 'I = ℰ/R', '', fem / d.R, 'A'), Fz = S.f(t('Forza per mantenere v costante', 'Force to keep v constant'), 'F = BIl', '', d.B * I * d.l, 'N'), P = S.f(t('Potenza (meccanica = elettrica)', 'Power (mechanical = electrical)'), 'P = Fv = ℰ²/R', '', Fz * d.v, 'W');
        S.r('ℰ', fem, 'V'); S.r('I', I, 'A'); S.r('F', Fz, 'N'); S.r('P', P, 'W');
      } },
    { id: 'flusso', corso: 'II', arg: 'ind', nome: ['Flusso variabile in una bobina', 'Changing flux through a coil'], dati: [['N', t('spire', 'turns'), '', 100], ['A', t('area', 'area'), 'm²', 0.01], ['dB', 'dB/dt', 'T/s', 0.5], ['R', 'R', 'Ω', 5]],
      testo: function (d) { return [ 'Una bobina di ' + d.N + ' spire di area ' + d.A + ' m² è in un campo perpendicolare che varia di ' + d.dB + ' T/s. Trovare la fem indotta e la corrente se la resistenza è ' + d.R + ' Ω.', 'A ' + d.N + '-turn coil of area ' + d.A + ' m² is in a perpendicular field changing at ' + d.dB + ' T/s. Find the induced emf and current if the resistance is ' + d.R + ' Ω.' ]; },
      risolvi: function (d, S) { var fem = S.f(t('Legge di Faraday', 'Faraday’s law'), '|ℰ| = N·A·|dB/dt|', '', d.N * d.A * Math.abs(d.dB), 'V'), I = S.f('I', 'I = ℰ/R', '', fem / d.R, 'A'); S.r('ℰ', fem, 'V'); S.r('I', I, 'A'); } },
    { id: 'rl', corso: 'II', arg: 'ind', nome: ['Circuito RL', 'RL circuit'], dati: [['L', 'L', 'mH', 50], ['R', 'R', 'Ω', 10], ['E', 'ℰ', 'V', 12], ['t', 't', 'ms', 5]],
      testo: function (d) { return [ 'Un’induttanza di ' + d.L + ' mH in serie a ' + d.R + ' Ω è collegata a t = 0 a ' + d.E + ' V. Trovare la costante di tempo, la corrente dopo ' + d.t + ' ms e l’energia magnetica a regime.', 'A ' + d.L + ' mH inductor in series with ' + d.R + ' Ω is connected at t = 0 to ' + d.E + ' V. Find the time constant, the current after ' + d.t + ' ms and the steady-state magnetic energy.' ]; },
      risolvi: function (d, S) { var L = d.L * 1e-3, tt = d.t * 1e-3, tau = S.f(t('Costante di tempo', 'Time constant'), 'τ = L/R', '', L / d.R, 's'), I = S.f(t('Corrente', 'Current'), 'i(t) = (ℰ/R)(1 − e^(−t/τ))', '', d.E / d.R * (1 - Math.exp(-tt / tau)), 'A'), U = S.f(t('Energia a regime', 'Steady-state energy'), 'U = ½L(ℰ/R)²', '', 0.5 * L * Math.pow(d.E / d.R, 2), 'J'); S.r('τ', tau, 's'); S.r('i', I, 'A'); S.r('U', U, 'J'); } },
    { id: 'ondaem', corso: 'II', arg: 'onde', nome: ['Onda elettromagnetica', 'Electromagnetic wave'], dati: [['lam', 'λ', 'nm', 500], ['E0', t('ampiezza E₀', 'amplitude E₀'), 'V/m', 100]],
      testo: function (d) { return [ 'Un’onda elettromagnetica piana nel vuoto ha lunghezza d’onda ' + d.lam + ' nm e campo elettrico di ampiezza ' + d.E0 + ' V/m. Trovare frequenza, ampiezza del campo magnetico e intensità.', 'A plane electromagnetic wave in vacuum has wavelength ' + d.lam + ' nm and electric amplitude ' + d.E0 + ' V/m. Find the frequency, magnetic amplitude and intensity.' ]; },
      risolvi: function (d, S) { var f = S.f(t('Frequenza', 'Frequency'), 'f = c/λ', '', c0 / (d.lam * 1e-9), 'Hz'), B0 = S.f(t('Campo magnetico', 'Magnetic field'), 'B₀ = E₀/c', '', d.E0 / c0, 'T'), I = S.f(t('Intensità (media)', 'Intensity (average)'), 'I = E₀²/(2μ₀c)', '', d.E0 * d.E0 / (2 * mu0 * c0), 'W/m²'); S.r('f', f, 'Hz'); S.r('B₀', B0, 'T'); S.r('I', I, 'W/m²'); } },
    { id: 'snell', corso: 'II', arg: 'ott', nome: ['Rifrazione (Snell) e riflessione totale', 'Refraction (Snell) and total reflection'], dati: [['n1', 'n₁', '', 1.5], ['n2', 'n₂', '', 1.0], ['th', 'θ₁', '°', 30]],
      testo: function (d) { return [ 'Un raggio passa da un mezzo con n₁ = ' + d.n1 + ' a uno con n₂ = ' + d.n2 + ' con angolo d’incidenza ' + d.th + '°. Trovare l’angolo di rifrazione e, se esiste, l’angolo limite.', 'A ray goes from a medium with n₁ = ' + d.n1 + ' to one with n₂ = ' + d.n2 + ' at ' + d.th + '° incidence. Find the refraction angle and, if it exists, the critical angle.' ]; },
      risolvi: function (d, S) {
        S.p(t('Legge di Snell', 'Snell’s law'), 'n₁ sin θ₁ = n₂ sin θ₂');
        var s2 = d.n1 * Math.sin(rad(d.th)) / d.n2;
        if (d.n1 > d.n2) { var lim = S.f(t('Angolo limite', 'Critical angle'), 'θ_L = arcsin(n₂/n₁)', '', deg(Math.asin(d.n2 / d.n1)), '°'); S.r('θ_L', lim, '°'); }
        if (s2 > 1) { S.p(t('Riflessione totale', 'Total internal reflection'), t('sin θ₂ = ', 'sin θ₂ = ') + n4(s2) + ' > 1: ' + t('nessun raggio rifratto, tutta la luce è riflessa.', 'no refracted ray, all the light is reflected.')); S.r('θ₂', NaN, '°'); }
        else { var th2 = S.f(t('Angolo di rifrazione', 'Refraction angle'), 'θ₂ = arcsin(n₁ sin θ₁/n₂)', '', deg(Math.asin(s2)), '°'); S.r('θ₂', th2, '°'); }
      } },
    { id: 'lente', corso: 'II', arg: 'ott', nome: ['Lente sottile', 'Thin lens'], dati: [['f', t('distanza focale (+ convergente)', 'focal length (+ converging)'), 'cm', 10], ['p', t('distanza dell’oggetto', 'object distance'), 'cm', 15]],
      testo: function (d) { return [ 'Un oggetto è a ' + d.p + ' cm da una lente sottile di focale ' + d.f + ' cm. Dove si forma l’immagine? Com’è (reale/virtuale, dritta/capovolta) e quanto è ingrandita?', 'An object is ' + d.p + ' cm from a thin lens of focal length ' + d.f + ' cm. Where is the image? Is it real or virtual, upright or inverted, and how magnified?' ]; },
      risolvi: function (d, S) {
        S.p(t('Equazione dei punti coniugati', 'Thin-lens equation'), '1/p + 1/q = 1/f');
        var qq = S.f(t('Distanza dell’immagine', 'Image distance'), 'q = 1/(1/f − 1/p)', '', 1 / (1 / d.f - 1 / d.p), 'cm'), M = S.f(t('Ingrandimento', 'Magnification'), 'M = −q/p', '', -qq / d.p, '');
        S.p(t('Natura', 'Nature'), (qq > 0 ? t('reale (dall’altra parte della lente)', 'real (on the other side of the lens)') : t('virtuale (dalla parte dell’oggetto)', 'virtual (on the object side)')) + ', ' + (M < 0 ? t('capovolta', 'inverted') : t('dritta', 'upright')) + ', ' + (Math.abs(M) > 1 ? t('ingrandita', 'enlarged') : t('rimpicciolita', 'reduced')));
        S.r('q', qq, 'cm'); S.r('M', M, '');
      } },
    { id: 'young', corso: 'II', arg: 'ott', nome: ['Interferenza (doppia fenditura)', 'Interference (double slit)'], dati: [['lam', 'λ', 'nm', 600], ['d', t('distanza fra le fenditure', 'slit separation'), 'mm', 0.2], ['L', t('distanza dello schermo', 'screen distance'), 'm', 1.5], ['m', t('ordine m', 'order m'), '', 3]],
      testo: function (d) { return [ 'Luce di ' + d.lam + ' nm illumina due fenditure distanti ' + d.d + ' mm; lo schermo è a ' + d.L + ' m. Trovare la distanza fra due frange chiare e la posizione della frangia di ordine ' + d.m + '.', d.lam + ' nm light falls on two slits ' + d.d + ' mm apart; the screen is ' + d.L + ' m away. Find the fringe spacing and the position of the order-' + d.m + ' bright fringe.' ]; },
      risolvi: function (d, S) { var lam = d.lam * 1e-9, dd = d.d * 1e-3; S.p(t('Massimi', 'Maxima'), t('Differenza di cammino d sin θ = mλ; per angoli piccoli y = mλL/d.', 'Path difference d sin θ = mλ; for small angles y = mλL/d.')); var Dy = S.f(t('Interfrangia', 'Fringe spacing'), 'Δy = λL/d', '', lam * d.L / dd, 'm'), y = S.f(t('Frangia di ordine m', 'Order-m fringe'), 'y_m = mλL/d', '', d.m * lam * d.L / dd, 'm'); S.r('Δy', Dy, 'm'); S.r('y_m', y, 'm'); } },
    { id: 'malus', corso: 'II', arg: 'ott', nome: ['Polarizzazione (Malus)', 'Polarisation (Malus)'], dati: [['I0', t('intensità incidente (non polarizzata)', 'incident intensity (unpolarised)'), 'W/m²', 100], ['th', t('angolo fra i due polarizzatori', 'angle between the polarisers'), '°', 60]],
      testo: function (d) { return [ 'Luce non polarizzata di intensità ' + d.I0 + ' W/m² attraversa due polarizzatori i cui assi formano ' + d.th + '°. Quale intensità esce?', 'Unpolarised light of intensity ' + d.I0 + ' W/m² passes two polarisers whose axes are ' + d.th + '° apart. What intensity comes out?' ]; },
      risolvi: function (d, S) { var I1 = S.f(t('Primo polarizzatore', 'First polariser'), 'I₁ = I₀/2', t('(media di cos² su tutte le direzioni)', '(average of cos² over all directions)'), d.I0 / 2, 'W/m²'), I2 = S.f(t('Legge di Malus', 'Malus’s law'), 'I₂ = I₁cos²θ', '', I1 * Math.pow(Math.cos(rad(d.th)), 2), 'W/m²'); S.r('I₁', I1, 'W/m²'); S.r('I₂', I2, 'W/m²'); } },
    /* ───────────── AVANZATO: onde, fisica moderna ───────────── */
    { id: 'forzato', corso: 'A', arg: 'mod', nome: ['Oscillatore smorzato e forzato (risonanza)', 'Damped driven oscillator (resonance)'], dati: [['m', 'm', 'kg', 0.5], ['k', 'k', 'N/m', 200], ['b', t('smorzamento b', 'damping b'), 'kg/s', 2], ['F0', 'F₀', 'N', 1], ['w', t('pulsazione forzante ω', 'driving ω'), 'rad/s', 18]],
      testo: function (d) { return [ 'Una massa di ' + d.m + ' kg su una molla di ' + d.k + ' N/m con smorzamento b = ' + d.b + ' kg/s è forzata da F₀cos ωt (F₀ = ' + d.F0 + ' N, ω = ' + d.w + ' rad/s). Trovare la pulsazione propria, il fattore di qualità, l’ampiezza a regime e la pulsazione di risonanza.', 'A ' + d.m + ' kg mass on a ' + d.k + ' N/m spring with damping b = ' + d.b + ' kg/s is driven by F₀cos ωt (F₀ = ' + d.F0 + ' N, ω = ' + d.w + ' rad/s). Find the natural frequency, quality factor, steady-state amplitude and resonance frequency.' ]; },
      risolvi: function (d, S) {
        var w0 = S.f(t('Pulsazione propria', 'Natural frequency'), 'ω₀ = √(k/m)', '', Math.sqrt(d.k / d.m), 'rad/s'), gam = d.b / (2 * d.m), Qf = S.f(t('Fattore di qualità', 'Quality factor'), 'Q = mω₀/b', '', d.m * w0 / d.b, '');
        S.p(t('Regime di smorzamento', 'Damping regime'), 'γ = b/(2m) = ' + q(gam, 's⁻¹') + (gam < w0 ? t(' < ω₀: sottosmorzato, oscilla con ω₁ = √(ω₀² − γ²) = ', ' < ω₀: underdamped, oscillates at ω₁ = √(ω₀² − γ²) = ') + q(Math.sqrt(w0 * w0 - gam * gam), 'rad/s') : t(' ≥ ω₀: sovrasmorzato o critico', ' ≥ ω₀: overdamped or critical')));
        var A = S.f(t('Ampiezza a regime', 'Steady-state amplitude'), 'A = (F₀/m)/√((ω₀² − ω²)² + (2γω)²)', '', d.F0 / d.m / Math.sqrt(Math.pow(w0 * w0 - d.w * d.w, 2) + Math.pow(2 * gam * d.w, 2)), 'm');
        var wr = S.f(t('Risonanza (massimo dell’ampiezza)', 'Resonance (amplitude maximum)'), 'ω_r = √(ω₀² − 2γ²)', '', Math.sqrt(Math.max(0, w0 * w0 - 2 * gam * gam)), 'rad/s');
        S.r('ω₀', w0, 'rad/s'); S.r('Q', Qf, ''); S.r('A', A, 'm'); S.r('ω_r', wr, 'rad/s');
      } },
    { id: 'corda', corso: 'A', arg: 'onde2', nome: ['Onde su una corda e armoniche', 'Waves on a string and harmonics'], dati: [['T', t('tensione', 'tension'), 'N', 80], ['mu', t('densità lineare', 'linear density'), 'kg/m', 0.005], ['L', t('lunghezza', 'length'), 'm', 0.65], ['n', t('armonica n', 'harmonic n'), '', 3]],
      testo: function (d) { return [ 'Una corda lunga ' + d.L + ' m, fissata agli estremi, ha tensione ' + d.T + ' N e densità lineare ' + d.mu + ' kg/m. Trovare la velocità delle onde, la frequenza fondamentale e quella dell’armonica ' + d.n + '.', 'A ' + d.L + ' m string fixed at both ends has tension ' + d.T + ' N and linear density ' + d.mu + ' kg/m. Find the wave speed, the fundamental and the frequency of harmonic ' + d.n + '.' ]; },
      risolvi: function (d, S) { var v = S.f(t('Velocità', 'Speed'), 'v = √(T/μ)', '', Math.sqrt(d.T / d.mu), 'm/s'), f1 = S.f(t('Fondamentale', 'Fundamental'), 'f₁ = v/(2L)', '', v / (2 * d.L), 'Hz'), fn = S.f(t('Armonica n', 'Harmonic n'), 'fₙ = n·f₁, λₙ = 2L/n', '', d.n * f1, 'Hz'); S.p(t('Onde stazionarie', 'Standing waves'), t('Nodi agli estremi: entrano solo mezze lunghezze d’onda intere.', 'Nodes at the ends: only whole half-wavelengths fit.')); S.r('v', v, 'm/s'); S.r('f₁', f1, 'Hz'); S.r('fₙ', fn, 'Hz'); } },
    { id: 'doppler', corso: 'A', arg: 'onde2', nome: ['Effetto Doppler acustico', 'Acoustic Doppler effect'], dati: [['f', t('frequenza della sorgente', 'source frequency'), 'Hz', 440], ['vs', t('velocità della sorgente (+ verso l’osservatore)', 'source speed (+ towards observer)'), 'm/s', 30], ['vo', t('velocità dell’osservatore (+ verso la sorgente)', 'observer speed (+ towards source)'), 'm/s', 0], ['v', t('velocità del suono', 'speed of sound'), 'm/s', 343]],
      testo: function (d) { return [ 'Una sorgente a ' + d.f + ' Hz si muove a ' + d.vs + ' m/s; l’osservatore a ' + d.vo + ' m/s (positivo = si avvicinano). Quale frequenza si sente?', 'A ' + d.f + ' Hz source moves at ' + d.vs + ' m/s; the observer at ' + d.vo + ' m/s (positive = approaching). What frequency is heard?' ]; },
      risolvi: function (d, S) { var fo = S.f(t('Frequenza percepita', 'Observed frequency'), "f′ = f·(v + v_o)/(v − v_s)", '', d.f * (d.v + d.vo) / (d.v - d.vs), 'Hz'); S.p(t('Allontanamento', 'Receding'), t('Con le velocità di segno opposto: ', 'With opposite-sign speeds: ') + q(d.f * (d.v - d.vo) / (d.v + d.vs), 'Hz')); S.r("f′", fo, 'Hz'); } },
    { id: 'fotoelettrico', corso: 'A', arg: 'mod', nome: ['Effetto fotoelettrico', 'Photoelectric effect'], dati: [['lam', 'λ', 'nm', 250], ['W', t('lavoro di estrazione', 'work function'), 'eV', 4.3]],
      testo: function (d) { return [ 'Luce di ' + d.lam + ' nm colpisce un metallo con lavoro di estrazione ' + d.W + ' eV. Trovare l’energia del fotone, l’energia cinetica massima degli elettroni, il potenziale di arresto e la soglia.', d.lam + ' nm light hits a metal with work function ' + d.W + ' eV. Find the photon energy, maximum electron kinetic energy, stopping potential and threshold.' ]; },
      risolvi: function (d, S) { var hc = 1239.84198, E = S.f(t('Energia del fotone', 'Photon energy'), 'E = hc/λ (hc = 1240 eV·nm)', '', hc / d.lam, 'eV'), K = S.f(t('Energia cinetica massima (Einstein)', 'Maximum kinetic energy (Einstein)'), 'K = E − W', '', E - d.W, 'eV'); if (K <= 0) S.p(t('Nessuna emissione', 'No emission'), t('Il fotone non ha energia sufficiente: nessun elettrone, qualunque sia l’intensità.', 'The photon lacks the energy: no electrons, whatever the intensity.')); else S.f(t('Potenziale di arresto', 'Stopping potential'), 'V_s = K/e', '', K, 'V'); var l0 = S.f(t('Lunghezza d’onda di soglia', 'Threshold wavelength'), 'λ₀ = hc/W', '', hc / d.W, 'nm'); S.r('E', E, 'eV'); S.r('K', Math.max(0, K), 'eV'); S.r('λ₀', l0, 'nm'); } },
    { id: 'compton', corso: 'A', arg: 'mod', nome: ['Effetto Compton', 'Compton effect'], dati: [['lam', t('λ incidente', 'incident λ'), 'pm', 71], ['th', t('angolo di diffusione', 'scattering angle'), '°', 90]],
      testo: function (d) { return [ 'Raggi X di ' + d.lam + ' pm sono diffusi da elettroni liberi a ' + d.th + '°. Trovare la lunghezza d’onda diffusa e l’energia ceduta all’elettrone.', d.lam + ' pm X-rays scatter off free electrons at ' + d.th + '°. Find the scattered wavelength and the energy given to the electron.' ]; },
      risolvi: function (d, S) { var lc = 2.42631, dl = S.f('Δλ', 'Δλ = λ_C(1 − cos θ), λ_C = h/(m_ec) = 2,426 pm', '', lc * (1 - Math.cos(rad(d.th))), 'pm'), l2 = S.f("λ′", "λ′ = λ + Δλ", '', d.lam + dl, 'pm'), hc = 1239.84198e3, K = S.f(t('Energia all’elettrone', 'Energy to the electron'), "K = hc/λ − hc/λ′", '', hc / d.lam - hc / l2, 'eV'); S.r('Δλ', dl, 'pm'); S.r("λ′", l2, 'pm'); S.r('K', K, 'eV'); } },
    { id: 'relativita', corso: 'A', arg: 'mod', nome: ['Relatività ristretta', 'Special relativity'], dati: [['beta', 'v/c', '', 0.8], ['t0', t('tempo proprio', 'proper time'), 's', 1], ['L0', t('lunghezza propria', 'proper length'), 'm', 1], ['m', t('massa a riposo', 'rest mass'), 'kg', 9.109e-31]],
      testo: function (d) { return [ 'Un corpo (massa a riposo ' + n4(d.m) + ' kg) si muove a ' + d.beta + 'c. Trovare il fattore di Lorentz, la dilatazione di un intervallo proprio di ' + d.t0 + ' s, la contrazione di una lunghezza propria di ' + d.L0 + ' m, l’energia totale e cinetica e la quantità di moto.', 'A body (rest mass ' + n4(d.m) + ' kg) moves at ' + d.beta + 'c. Find the Lorentz factor, the dilation of a proper interval of ' + d.t0 + ' s, the contraction of a proper length of ' + d.L0 + ' m, total and kinetic energy and momentum.' ]; },
      risolvi: function (d, S) { var c = c0, g = S.f(t('Fattore di Lorentz', 'Lorentz factor'), 'γ = 1/√(1 − v²/c²)', '', 1 / Math.sqrt(1 - d.beta * d.beta), ''), tt = S.f(t('Dilatazione dei tempi', 'Time dilation'), 'Δt = γΔt₀', '', g * d.t0, 's'), L = S.f(t('Contrazione delle lunghezze', 'Length contraction'), 'L = L₀/γ', '', d.L0 / g, 'm'), E = S.f(t('Energia totale', 'Total energy'), 'E = γmc²', '', g * d.m * c * c, 'J'), K = S.f(t('Energia cinetica', 'Kinetic energy'), 'K = (γ − 1)mc²', '', (g - 1) * d.m * c * c, 'J'), p = S.f(t('Quantità di moto', 'Momentum'), 'p = γmv', '', g * d.m * d.beta * c, 'kg·m/s'); S.p(t('Controllo', 'Check'), 'E² = (pc)² + (mc²)²: ' + n4(E * E) + ' = ' + n4(Math.pow(p * c, 2) + Math.pow(d.m * c * c, 2))); S.r('γ', g, ''); S.r('Δt', tt, 's'); S.r('L', L, 'm'); S.r('K', K, 'J'); } },
    { id: 'corponero', corso: 'A', arg: 'mod', nome: ['Corpo nero (Wien, Stefan-Boltzmann)', 'Blackbody (Wien, Stefan-Boltzmann)'], dati: [['T', 'T', 'K', 5778], ['A', t('area emittente', 'emitting area'), 'm²', 1]],
      testo: function (d) { return [ 'Un corpo nero a ' + d.T + ' K: dove cade il massimo dello spettro e quanta potenza emette per ' + d.A + ' m²?', 'A blackbody at ' + d.T + ' K: where is the spectral peak and how much power does it emit per ' + d.A + ' m²?' ]; },
      risolvi: function (d, S) { var lm = S.f(t('Legge di Wien', 'Wien’s law'), 'λ_max = b/T (b = 2,898·10⁻³ m·K)', '', 2.897771955e-3 / d.T * 1e9, 'nm'), P = S.f('Stefan-Boltzmann', 'P = σAT⁴ (σ = 5,670·10⁻⁸ W/(m²K⁴))', '', 5.670374419e-8 * d.A * Math.pow(d.T, 4), 'W'); S.p(t('Storia', 'History'), t('Per spiegare questa curva Planck dovette quantizzare l’energia: E = hν.', 'To explain this curve Planck had to quantise energy: E = hν.')); S.r('λ_max', lm, 'nm'); S.r('P', P, 'W'); } },
    { id: 'scatola', corso: 'A', arg: 'mod', nome: ['Particella nella scatola (1D)', 'Particle in a box (1D)'], dati: [['L', t('larghezza', 'width'), 'nm', 1], ['n', 'n', '', 1], ['m', t('massa (elettrone)', 'mass (electron)'), 'kg', 9.109e-31]],
      testo: function (d) { return [ 'Un elettrone è confinato in una buca infinita larga ' + d.L + ' nm. Trovare l’energia del livello n = ' + d.n + ', la lunghezza d’onda della transizione n → n + 1 e il valor medio della posizione.', 'An electron is confined in an infinite well ' + d.L + ' nm wide. Find the energy of level n = ' + d.n + ', the wavelength of the n → n + 1 transition and the mean position.' ]; },
      risolvi: function (d, S) { var hh = 6.62607015e-34, L = d.L * 1e-9, E = S.f(t('Energia', 'Energy'), 'Eₙ = n²h²/(8mL²)', '', d.n * d.n * hh * hh / (8 * d.m * L * L) / 1.602176634e-19, 'eV'), dE = (2 * d.n + 1) * hh * hh / (8 * d.m * L * L), lam = S.f(t('Transizione n → n + 1', 'Transition n → n + 1'), 'λ = hc/ΔE, ΔE = (2n + 1)h²/(8mL²)', '', hh * c0 / dE * 1e9, 'nm'); S.p(t('Funzione d’onda', 'Wavefunction'), 'ψₙ = √(2/L)·sin(nπx/L); ⟨x⟩ = L/2 = ' + q(d.L / 2, 'nm') + t('; l’energia minima non è zero (punto zero): conseguenza del principio di indeterminazione.', '; the lowest energy is not zero (zero point): a consequence of the uncertainty principle.')); S.r('Eₙ', E, 'eV'); S.r('λ', lam, 'nm'); } },
    { id: 'tunnel', corso: 'A', arg: 'mod', nome: ['Effetto tunnel', 'Quantum tunnelling'], dati: [['E', t('energia della particella', 'particle energy'), 'eV', 5], ['V0', t('altezza della barriera', 'barrier height'), 'eV', 10], ['a', t('larghezza della barriera', 'barrier width'), 'nm', 0.5]],
      testo: function (d) { return [ 'Un elettrone di ' + d.E + ' eV incontra una barriera rettangolare alta ' + d.V0 + ' eV e larga ' + d.a + ' nm. Qual è la probabilità di attraversarla?', 'An electron of ' + d.E + ' eV meets a rectangular barrier ' + d.V0 + ' eV high and ' + d.a + ' nm wide. What is the probability of crossing it?' ]; },
      risolvi: function (d, S) { var hb = 1.054571817e-34, m = 9.1093837015e-31, eV = 1.602176634e-19; if (d.E >= d.V0) { S.p(t('Sopra la barriera', 'Above the barrier'), t('E ≥ V₀: il problema classico già passa; qui si studia E < V₀.', 'E ≥ V₀: the particle passes classically; study E < V₀ here.')); S.r('T', 1, ''); return; } var k = S.f(t('Costante di decadimento', 'Decay constant'), 'κ = √(2m(V₀ − E))/ħ', '', Math.sqrt(2 * m * (d.V0 - d.E) * eV) / hb, 'm⁻¹'), ka = k * d.a * 1e-9, sh = Math.sinh(ka); var T = S.f(t('Trasmissione esatta', 'Exact transmission'), 'T = [1 + V₀² sinh²(κa)/(4E(V₀ − E))]⁻¹', '', 1 / (1 + d.V0 * d.V0 * sh * sh / (4 * d.E * (d.V0 - d.E))), ''); S.p(t('Approssimazione di barriera spessa', 'Thick-barrier approximation'), 'T ≈ 16(E/V₀)(1 − E/V₀)e^(−2κa) = ' + n4(16 * d.E / d.V0 * (1 - d.E / d.V0) * Math.exp(-2 * ka)) + t(' — dipende esponenzialmente dalla larghezza: è il principio del microscopio a effetto tunnel.', ' — exponentially sensitive to the width: the principle of the scanning tunnelling microscope.')); S.r('T', T, ''); } }
  ];
  var PER_ID = {}; MODELLI.forEach(function (m) { PER_ID[m.id] = m; });
  function risolvi(id, dati) {
    var m = PER_ID[id], d = {}, S = svolgimento();
    m.dati.forEach(function (c) { var v = dati && dati[c[0]] != null ? dati[c[0]] : c[3]; d[c[0]] = typeof c[3] === 'number' ? +String(v).replace(',', '.') : String(v).trim(); });
    m.risolvi(d, S);
    return { passi: S.passi, risultati: S.ris, testo: m.testo(d), dati: d };
  }

  var ARGOMENTI = {
    I: [
      ['cin', ['Cinematica', 'Kinematics'], ['Posizione, velocità, accelerazione; moto rettilineo uniforme e uniformemente accelerato; moto in due dimensioni (proiettile), moto circolare. Si sceglie un sistema di riferimento e si scrivono le leggi orarie per ciascun asse.', 'Position, velocity, acceleration; uniform and uniformly accelerated motion; motion in two dimensions (projectile), circular motion. Choose a reference frame and write the equations of motion for each axis.']],
      ['din', ['Dinamica del punto', 'Particle dynamics'], ['Principi di Newton, forza peso, reazioni vincolari, attrito statico e dinamico, tensione dei fili. Metodo: diagramma di corpo libero per ogni corpo, F = ma su ogni asse, vincoli (stesso filo ⇒ stessa accelerazione).', 'Newton’s laws, weight, constraint forces, static and kinetic friction, string tension. Method: a free-body diagram for each body, F = ma on each axis, constraints (same string ⇒ same acceleration).']],
      ['lav', ['Lavoro ed energia', 'Work and energy'], ['Lavoro, potenza, energia cinetica (teorema delle forze vive), forze conservative ed energia potenziale (peso, molla), conservazione dell’energia meccanica e il lavoro delle forze dissipative.', 'Work, power, kinetic energy (work-energy theorem), conservative forces and potential energy (weight, spring), conservation of mechanical energy and the work of dissipative forces.']],
      ['urti', ['Quantità di moto e urti', 'Momentum and collisions'], ['Sistemi di punti, centro di massa, conservazione della quantità di moto; urti elastici (si conserva anche l’energia cinetica) e anelastici (solo la quantità di moto).', 'Systems of particles, centre of mass, momentum conservation; elastic collisions (kinetic energy also conserved) and inelastic ones (momentum only).']],
      ['rig', ['Corpo rigido', 'Rigid body'], ['Momento di una forza, momento d’inerzia (Huygens-Steiner), seconda equazione cardinale τ = Iα, energia di rotazione, rotolamento puro (v = ωR).', 'Torque, moment of inertia (parallel-axis theorem), τ = Iα, rotational energy, pure rolling (v = ωR).']],
      ['grav', ['Gravitazione', 'Gravitation'], ['Legge di gravitazione universale, campo e potenziale gravitazionale, orbite circolari, leggi di Keplero, velocità di fuga.', 'Universal gravitation, gravitational field and potential, circular orbits, Kepler’s laws, escape velocity.']],
      ['osc', ['Oscillazioni', 'Oscillations'], ['Moto armonico (x = A cos(ωt + φ)), molla, pendolo semplice, energia dell’oscillatore.', 'Harmonic motion (x = A cos(ωt + φ)), spring, simple pendulum, oscillator energy.']],
      ['flu', ['Fluidi', 'Fluids'], ['Pressione, legge di Stevino, principi di Pascal e di Archimede; fluidodinamica: equazione di continuità, teorema di Bernoulli, Torricelli, Venturi.', 'Pressure, Stevin’s law, Pascal’s and Archimedes’ principles; fluid dynamics: continuity equation, Bernoulli’s theorem, Torricelli, Venturi.']],
      ['term', ['Termodinamica', 'Thermodynamics'], ['Temperatura, calore, calorimetria, gas perfetto, primo principio (ΔU = Q − L), trasformazioni (isoterma, isobara, isocora, adiabatica), secondo principio, macchine termiche, ciclo di Carnot, entropia. Verifica nella scheda del tuo anno se fa parte di Fisica I.', 'Temperature, heat, calorimetry, ideal gas, first law (ΔU = Q − W), processes (isothermal, isobaric, isochoric, adiabatic), second law, heat engines, Carnot cycle, entropy. Check your year’s sheet for whether it is part of Physics I.']]
    ],
    II: [
      ['ele', ['Fenomeni elettrici', 'Electric phenomena'], ['Carica, legge di Coulomb, campo elettrico, teorema di Gauss, potenziale ed energia potenziale, conduttori, capacità e condensatori (serie, parallelo), dielettrici, energia del campo.', 'Charge, Coulomb’s law, electric field, Gauss’s law, potential and potential energy, conductors, capacitance and capacitors (series, parallel), dielectrics, field energy.']],
      ['cor', ['Correnti elettriche', 'Electric currents'], ['Intensità di corrente, legge di Ohm, resistività, effetto Joule, generatori e forza elettromotrice, leggi di Kirchhoff, circuito RC.', 'Current, Ohm’s law, resistivity, Joule heating, sources and emf, Kirchhoff’s laws, RC circuit.']],
      ['mag', ['Magnetostatica', 'Magnetostatics'], ['Forza di Lorentz, moto di cariche in campo magnetico, forza su un filo, legge di Biot-Savart, teorema di Ampère, campo di filo e solenoide, forze fra correnti.', 'Lorentz force, charges moving in a magnetic field, force on a wire, Biot-Savart law, Ampère’s law, field of a wire and solenoid, forces between currents.']],
      ['ind', ['Induzione elettromagnetica', 'Electromagnetic induction'], ['Legge di Faraday-Neumann-Lenz, fem mozionale, autoinduzione, circuito RL, energia del campo magnetico.', 'Faraday-Neumann-Lenz law, motional emf, self-inductance, RL circuit, magnetic field energy.']],
      ['onde', ['Onde elettromagnetiche (cenni)', 'Electromagnetic waves (outline)'], ['Equazioni di Maxwell (idea), onde piane, relazione E = cB, velocità della luce, energia e intensità.', 'Maxwell’s equations (idea), plane waves, E = cB, speed of light, energy and intensity.']],
      ['ott', ['Ottica (cenni di ottica fisica)', 'Optics (outline of physical optics)'], ['Riflessione e rifrazione, riflessione totale, lenti sottili; polarizzazione (Malus) e interferenza (Young).', 'Reflection and refraction, total internal reflection, thin lenses; polarisation (Malus) and interference (Young).']]
    ],
    A: [
      ['onde2', ['Oscillazioni e onde meccaniche', 'Oscillations and mechanical waves'], ['Oscillatore smorzato e forzato, risonanza e fattore di qualità; onde su una corda, onde stazionarie e armoniche; effetto Doppler.', 'Damped and driven oscillator, resonance and quality factor; waves on a string, standing waves and harmonics; Doppler effect.']],
      ['mod', ['Fisica moderna e quantistica', 'Modern and quantum physics'], ['Corpo nero e quantizzazione di Planck, effetto fotoelettrico, effetto Compton, relatività ristretta (dilatazione, contrazione, E = γmc²), particella nella scatola, effetto tunnel. È la fisica su cui poggiano la spettroscopia e la chimica quantistica.', 'Blackbody and Planck’s quantisation, photoelectric effect, Compton effect, special relativity (dilation, contraction, E = γmc²), particle in a box, tunnelling. The physics underneath spectroscopy and quantum chemistry.']]
    ]
  };

  var PROBLEMI = {
    I: [
      [['proiettile', { v0: 18, th: 35, h: 1.5 }], ['piano', { m: 3, th: 25, ms: 0.5, md: 0.35 }], ['isobara', { n: 1, gas: 'mono', T1: 280, T2: 420 }]],
      [['atwood', { m1: 1.2, m2: 1.8 }], ['anelastico', { m1: 0.02, v1: 300, m2: 2, v2: 0 }], ['carnot', { T1: 600, T2: 300, Q1: 2000 }]],
      [['rotolamento', { forma: 'cilindro', h: 2, th: 30 }], ['archimede', { rc: 2700, rf: 1000, V: 0.001 }], ['adiabatica', { n: 2, gas: 'bi', T1: 290, V1: 0.04, V2: 0.01 }]],
      [['caduta', { h: 30, v0: 5 }], ['molla', { m: 0.8, k: 320, A: 0.1 }], ['calorimetria', { m1: 0.5, c1: 900, T1: 373, m2: 1, c2: 4186, T2: 293 }]],
      [['tavolo', { m1: 5, m2: 3, md: 0.25 }], ['giro', { R: 1.5, m: 0.5 }], ['ghiaccio', { mg: 0.1, ma: 0.4, Ta: 30 }]],
      [['orbita', { M: 5.972e24, r: 4.2164e7 }], ['venturi', { A1: 0.008, A2: 0.002, v1: 1.5, p1: 120000, rho: 1000 }], ['isoterma', { n: 0.5, T: 350, V1: 0.02, V2: 0.005 }]]
    ],
    II: [
      [['coulomb', { q1: 2, q2: 2, r: 0.1 }], ['resistenze', { R1: 6, R2: 12, R3: 4, schema: 'misto', V: 18 }], ['lorentz', { q: 1.602e-19, m: 9.109e-31, v: 3e6, B: 0.002 }]],
      [['gauss', { tipo: 'sferapiena', Q: 5e-9, R: 0.2, r: 0.1 }], ['rc', { R: 47, C: 22, E: 5, t: 1 }], ['barretta', { B: 0.8, l: 0.3, v: 5, R: 1.5 }]],
      [['condpiano', { A: 0.01, d: 0.0005, er: 4, V: 50 }], ['kirchhoff', { E1: 10, E2: 4, R1: 2, R2: 3, R3: 5 }], ['snell', { n1: 1.33, n2: 1, th: 40 }]],
      [['duecariche', { q1: 5, q2: 5, d: 0.4, x: 0.1 }], ['filo', { I1: 20, I2: 20, d: 0.02, L: 2 }], ['lente', { f: 20, p: 30 }]],
      [['condensatori', { C1: 4, C2: 2, C3: 2, schema: 'misto', V: 10 }], ['solenoide', { N: 1000, l: 0.5, A: 0.002, I: 1.5 }], ['young', { lam: 550, d: 0.15, L: 2, m: 2 }]],
      [['coulomb', { q1: 1, q2: -4, r: 0.3 }], ['rl', { L: 200, R: 40, E: 20, t: 10 }], ['malus', { I0: 400, th: 30 }]]
    ],
    A: [
      [['forzato', { m: 1, k: 400, b: 4, F0: 2, w: 20 }], ['fotoelettrico', { lam: 400, W: 2.3 }], ['relativita', { beta: 0.6, t0: 2, L0: 10, m: 1.673e-27 }]],
      [['corda', { T: 120, mu: 0.002, L: 0.5, n: 2 }], ['compton', { lam: 50, th: 180 }], ['scatola', { L: 0.5, n: 2, m: 9.109e-31 }]],
      [['doppler', { f: 1000, vs: -20, vo: 0, v: 343 }], ['corponero', { T: 3000, A: 0.01 }], ['tunnel', { E: 1, V0: 4, a: 0.3 }]]
    ]
  };

  /* ── l'interfaccia ────────────────────────────────────────────────────── */
  function mostra(cont, id, dati) {
    cont.innerHTML = '';
    var r;
    try { r = risolvi(id, dati); } catch (err) { cont.innerHTML = '<div class="bsiFX-nota bsiFX-ko">⚠ ' + esc(err.message) + '</div>'; return null; }
    cont.appendChild(F.el('div', { 'class': 'bsiFX-eq', style: 'font-family:inherit', html: '<b>' + t('Problema. ', 'Problem. ') + '</b>' + esc(F.tt(r.testo)) }));
    var ol = F.el('ol', { style: 'margin:6px 0 0 0;padding-left:20px' });
    r.passi.forEach(function (p) { ol.appendChild(F.el('li', { style: 'margin:7px 0', html: '<b style="color:#5eead4">' + esc(p.titolo) + '</b><div style="margin-top:2px;line-height:1.6">' + p.html + '</div>' })); });
    cont.appendChild(ol);
    cont.appendChild(F.el('div', { 'class': 'bsiFX-eq', style: 'font-family:inherit', html: '<b>' + t('Risultati: ', 'Results: ') + '</b>' + r.risultati.map(function (x) { return esc(x.nome) + ' = ' + q(x.v, x.u); }).join(' · ') }));
    return r;
  }
  function schedaProgramma(div) {
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Programmi di <b>Fisica Generale I e II</b> per il corso di laurea in Chimica dell’Università di Bari (schede su ', 'Syllabi of <b>General Physics I and II</b> for the Chemistry degree at the University of Bari (sheets on ') + '<a href="https://www.uniba.it/it/corsi/chimica/studiare/piano-di-studi/elenco-insegnamenti-e-docenti-affidatari" target="_blank" rel="noopener" style="color:#5eead4">uniba.it</a>). ' + t('Il dettaglio cambia da un anno all’altro: fa fede la scheda del tuo anno. Testi consigliati: Mazzoldi-Nigro-Voci, Halliday-Resnick.', 'Details change from year to year: your year’s sheet is authoritative. Recommended texts: Mazzoldi-Nigro-Voci, Halliday-Resnick.') }));
    ['I', 'II', 'A'].forEach(function (k) {
      div.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1.1rem;margin-top:12px', testo: k === 'A' ? t('Avanzato e avanzatissimo — onde, fisica moderna e quantistica', 'Advanced and expert — waves, modern and quantum physics') : 'Fisica Generale ' + k + (k === 'I' ? t(' — meccanica, fluidi, termodinamica', ' — mechanics, fluids, thermodynamics') : t(' — elettromagnetismo, cenni di onde e ottica', ' — electromagnetism, outline of waves and optics')) }));
      ARGOMENTI[k].forEach(function (a) {
        var d = F.el('details', { 'class': 'bsiFX-pannello', style: 'margin:6px 0' });
        d.appendChild(F.el('summary', { style: 'cursor:pointer;font-weight:700;color:#e6fffb', testo: F.tt(a[1]) }));
        d.appendChild(F.el('div', { 'class': 'bsiFX-nota', style: 'font-size:.88rem', testo: F.tt(a[2]) }));
        var lista = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' });
        MODELLI.filter(function (m) { return m.arg === a[0]; }).forEach(function (m) { lista.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: F.tt(m.nome) + ' →', onclick: function () { var b = document.querySelectorAll('#sfisesame .bsiFX-schede button')[1]; if (b) b.click(); if (apri) apri(m.id); } })); });
        d.appendChild(lista); div.appendChild(d);
      });
    });
  }
  var apri = null;
  function schedaRisolutore(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { 'class': 'bsiFX-pannello' });
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var id = 'proiettile', campi = F.el('div'), inputs = {};
    var sel = F.scelta(pan, ['Problema', 'Problem'], MODELLI.map(function (m) { return [m.id, ['[' + m.corso + '] ' + m.nome[0], '[' + m.corso + '] ' + m.nome[1]]]; }), id, function (v) { id = v; costruisci(); });
    pan.appendChild(campi);
    F.bottone(pan, ['Risolvi', 'Solve'], calcola);
    function costruisci() {
      campi.innerHTML = ''; inputs = {};
      PER_ID[id].dati.forEach(function (c) {
        campi.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: F.tt(c[1]) + (c[2] ? ' (' + c[2] + ')' : '') }));
        var inp = F.el('input', { type: 'text', value: String(c[3]), 'aria-label': F.tt(c[1]) });
        inp.addEventListener('change', calcola); campi.appendChild(inp); inputs[c[0]] = inp;
      });
      calcola();
    }
    function calcola() { var d = {}; Object.keys(inputs).forEach(function (k) { d[k] = inputs[k].value; }); mostra(dx, id, d); }
    apri = function (k) { id = k; sel.value = k; costruisci(); };
    costruisci();
  }
  function schedaProblemi(div) {
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('<b>Problemi nello stile dello scritto</b>, costruiti sui programmi: non sono i testi ufficiali degli appelli. Prova prima da solo.', '<b>Problems in the style of the written exam</b>, built on the syllabi: they are not the official papers. Try on your own first.') }));
    ['I', 'II', 'A'].forEach(function (k) {
      div.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1.1rem;margin-top:12px', testo: k === 'A' ? t('Avanzato e avanzatissimo', 'Advanced and expert') : 'Fisica Generale ' + k }));
      PROBLEMI[k].forEach(function (ap, i) {
        var d = F.el('details', { 'class': 'bsiFX-pannello', style: 'margin:6px 0' });
        d.appendChild(F.el('summary', { style: 'cursor:pointer;font-weight:700;color:#e6fffb', testo: t('Prova ', 'Paper ') + k + '.' + (i + 1) + ' — ' + ap.map(function (p) { return F.tt(PER_ID[p[0]].nome); }).join(' · ') }));
        ap.forEach(function (p, j) {
          var box = F.el('div', { style: 'border-top:1px solid #16263d;padding:8px 0' }), m = PER_ID[p[0]], dd = {};
          m.dati.forEach(function (c) { dd[c[0]] = p[1][c[0]] != null ? p[1][c[0]] : c[3]; });
          box.appendChild(F.el('div', { html: '<b>' + (j + 1) + '.</b> ' + esc(F.tt(m.testo(dd))) }));
          var sol = F.el('div', { style: 'display:none' });
          F.bottone(box, ['Mostra lo svolgimento', 'Show the solution'], function () { if (sol.style.display === 'none') { sol.style.display = ''; if (!sol.firstChild) mostra(sol, p[0], p[1]); } else sol.style.display = 'none'; });
          box.appendChild(sol); d.appendChild(box);
        });
        div.appendChild(d);
      });
    });
  }

  F.calcolo.esameFisica = { MODELLI: MODELLI, risolvi: risolvi, PROBLEMI: PROBLEMI, ARGOMENTI: ARGOMENTI, costanti: { g: g, G: G, e0: e0, kC: kC, mu0: mu0, R: Rg, c: c0 } };

  F.sezione('sfisesame', {
    titolo: ['🎓 Esame di Fisica (UniBA)', '🎓 Physics exam (UniBA)'],
    sotto: ['Fisica Generale I e II del corso di laurea in Chimica: il programma con il metodo per ogni argomento, quasi sessanta problemi tipo, dalla base alla fisica moderna, che si risolvono con i tuoi dati mostrando leggi, sostituzioni e unità, e prove d’esame svolte.',
            'General Physics I and II of the Chemistry degree: the syllabus with the method for each topic, nearly sixty standard problems, from basics to modern physics, solved with your own data showing laws, substitutions and units, and solved exam papers.'],
    schede: [
      { nome: ['Programma', 'Syllabus'], costruisci: schedaProgramma },
      { nome: ['Risolutore dei problemi', 'Problem solver'], costruisci: schedaRisolutore },
      { nome: ['Prove svolte', 'Solved papers'], costruisci: schedaProblemi }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
