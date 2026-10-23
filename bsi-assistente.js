/* ═══════════════════════════════════════════════════════════════════════════
   bsi-assistente.js — 🧠 le tre macro-aree: Chimica, Fisica, Matematica
   BioSpecInfo · © Samuele Pio Provenzano

   Tre «app nell'app», ognuna con:

   · un ASSISTENTE a cui si scrive la domanda come la si scriverebbe al
     professore («calcola il pH di una soluzione 0,1 M di acido acetico
     con Ka = 1,8·10⁻⁵», «integra x·e^x da 0 a 1», «un proiettile e'
     lanciato a 20 m/s con un angolo di 30°…»). L'assistente:
       1. capisce CHE COSA si chiede (il tipo di esercizio o il modello di
          problema), con regole per la matematica e un punteggio di parole
          chiave per fisica e chimica;
       2. estrae i DATI dal testo: espressioni, numeri con le unita' (e le
          converte), assegnazioni come «Ka = …», formule chimiche, reazioni;
       3. RISOLVE con i risolutori dell'app (motore simbolico, 23 tipi di
          esercizio di matematica, oltre ottanta modelli di fisica e
          cinquanta di chimica) e mostra lo svolgimento completo;
       4. dice CHE COSA HA CAPITO e quali dati ha dovuto supporre, cosi'
          un'interpretazione sbagliata si vede subito e si corregge;
       5. se e' configurato un fornitore di intelligenza artificiale passa la
          domanda a Spectra, che ha gli stessi risolutori come strumenti.
   · TUTTI GLI STRUMENTI della materia, raccolti dalla barra e cercabili;
   · i LIVELLI, dalle superiori al dottorato.

   Nessuna rete: l'assistente locale funziona offline.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function RS() { return F.calcolo.risolutore.RISOLUTORI; }

  /* ── normalizzazione del testo ─────────────────────────────────────────── */
  var APICI = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  function normalizza(s) {
    s = String(s).replace(/[−–—]/g, '-').replace(/\u00a0/g, ' ');
    /* 1,8·10⁻⁵  1.8x10^-5  1.8*10^-5  → 1.8e-5 */
    s = s.replace(/(\d)\s*[·x×*]\s*10\s*\^?\s*([-+]?\d+|[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function (m, a, e) { return a + 'e' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, function (c) { return APICI[c]; }); });
    s = s.replace(/\b10\s*\^\s*([-+]?\d+)/g, '1e$1').replace(/\b10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function (m, e) { return '1e' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, function (c) { return APICI[c]; }); });
    /* virgola decimale fra cifre */
    s = s.replace(/(\d),(\d)/g, '$1.$2');
    s = s.replace(/\b(masse|massa)\s+solar[ei]\b|\bsolar\s+mass(es)?\b/gi, 'M☉').replace(/\b(raggi|raggio)\s+solar[ei]\b|\bsolar\s+radi(i|us)\b/gi, 'R☉').replace(/\bluminosit[aà]\s+solar[ei]\b/gi, 'L☉');
    s = s.replace(/\b(0?\.\d+)\s*c\b/g, 'v/c = $1');
    return s;
  }
  function minuscolo(s) { return normalizza(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  /* ── le unita' di misura ───────────────────────────────────────────────── */
  var U = {
    'm': ['L', 1], 'cm': ['L', 0.01], 'mm': ['L', 1e-3], 'km': ['L', 1e3], 'μm': ['L', 1e-6], 'um': ['L', 1e-6], 'nm': ['L', 1e-9], 'pm': ['L', 1e-12], 'fm': ['L', 1e-15], 'å': ['L', 1e-10], 'a': null,
    'ua': ['L', 1.495978707e11], 'au': ['L', 1.495978707e11], 'pc': ['L', 3.0857e16], 'mpc': ['L', 3.0857e22], 'ly': ['L', 9.4607e15], 'dm': ['L', 0.1],
    's': ['t', 1], 'ms': ['t', 1e-3], 'μs': ['t', 1e-6], 'min': ['t', 60], 'h': ['t', 3600], 'ore': ['t', 3600], 'giorni': ['t', 86400], 'giorno': ['t', 86400], 'days': ['t', 86400], 'd': ['t', 86400], 'anni': ['t', 3.15576e7], 'anno': ['t', 3.15576e7], 'years': ['t', 3.15576e7], 'yr': ['t', 3.15576e7],
    'kg': ['M', 1], 'g': ['M', 1e-3], 'mg': ['M', 1e-6], 'μg': ['M', 1e-9], 'ug': ['M', 1e-9], 'u': ['Mu', 1], 'm☉': ['Msun', 1], 'msun': ['Msun', 1],
    'k': ['T', 1], '°c': ['TC', 1], '°': ['ang', 1], 'gradi': ['ang', 1], 'rad': ['angr', 1],
    'n': ['F', 1], 'kn': ['F', 1e3], 'j': ['E', 1], 'kj': ['E', 1e3], 'ev': ['eV', 1], 'mev': ['eV', 1e6], 'kev': ['eV', 1e3],
    'kj/mol': ['Em', 1], 'j/mol': ['Em', 1e-3], 'kcal/mol': ['Em', 4.184],
    'pa': ['P', 1], 'kpa': ['P', 1e3], 'atm': ['P', 101325], 'bar': ['P', 1e5], 'mmhg': ['P', 133.322], 'torr': ['P', 133.322],
    'l': ['V', 1e-3], 'ml': ['V', 1e-6], 'm³': ['V', 1], 'm3': ['V', 1], 'cm³': ['V', 1e-6], 'dm³': ['V', 1e-3],
    'm²': ['A', 1], 'cm²': ['A', 1e-4], 'mm²': ['A', 1e-6],
    'mol/l': ['c', 1], 'm.': ['c', 1], 'mm.': ['c', 1e-3], 'μm.': ['c', 1e-6], 'molare': ['c', 1],
    'mol': ['n', 1], 'mmol': ['n', 1e-3],
    'hz': ['f', 1], 'khz': ['f', 1e3], 'mhz': ['f', 1e6], 'ghz': ['f', 1e9],
    't': ['B', 1], 'mt': ['B', 1e-3], 'gauss': ['B', 1e-4],
    'ma': ['I', 1e-3], 'v': ['U', 1], 'mv': ['U', 1e-3], 'kv': ['U', 1e3], 'ω': ['R', 1], 'ohm': ['R', 1], 'kω': ['R', 1e3], 'kohm': ['R', 1e3], 'mω': ['R', 1e6],
    'f': ['Cap', 1], 'μf': ['Cap', 1e-6], 'uf': ['Cap', 1e-6], 'nf': ['Cap', 1e-9], 'pf': ['Cap', 1e-12], 'mh': ['Ind', 1e-3], 'μh': ['Ind', 1e-6],
    'c': ['Q', 1], 'μc': ['Q', 1e-6], 'uc': ['Q', 1e-6], 'nc': ['Q', 1e-9], 'pc.': ['Q', 1e-12],
    'w': ['P', null], 'kw': ['Pw', 1e3],
    'm/s': ['v', 1], 'km/h': ['v', 1 / 3.6], 'km/s': ['v', 1e3], 'cm/s': ['v', 0.01], 'm/s²': ['acc', 1], 'm/s2': ['acc', 1],
    'cm⁻¹': ['k', 1], 'cm-1': ['k', 1], 'n/m': ['kspring', 1], 'kg/m³': ['rho', 1], 'g/ml': ['rho', 1e3], 'g/cm³': ['rho', 1e3], 'g/l': ['gl', 1], 'g/mol': ['Mm', 1],
    'mas': ['par', 1], 'r☉': ['Rsun', 1], 'l☉': ['Lsun', 1], 'gy': ['Gy', 1], 'sv': ['Sv', 1], 'bq': ['Bq', 1], 'ppm': ['ppm', 1], '%': ['pct', 1], 's⁻¹': ['rate', 1], 'm⁻¹': ['invL', 1]
  };
  U.a = ['I', 1];
  /* l'unita' di un campo del modello, ricondotta a una voce della tabella */
  function unitaCampo(u) {
    if (!u) return null;
    var r = String(Array.isArray(u) ? u[0] : u).trim(), s = r.toLowerCase().split(' ')[0];
    var ESATTE = { 'm': ['L', 1], 'M': ['c', 1], 'mM': ['c', 1e-3], 'μM': ['c', 1e-6], 'μM/s': ['cr', 1e-6], 'mH': ['Ind', 1e-3], 'MHz': ['f', 1e6], 'mL': ['V', 1e-6], 'L': ['V', 1e-3], 'A': ['I', 1], 'T': ['B', 1], 'C': ['Q', 1], 'nC': ['Q', 1e-9], 'μC': ['Q', 1e-6], 'ms': ['t', 1e-3], 'mm': ['L', 1e-3], 'M☉': ['Msun', 1], 'R☉': ['Rsun', 1], 'UA': ['L', 1.495978707e11], 'kΩ': ['R', 1e3], 'Ω': ['R', 1], 'ppm (mg/L)': ['ppm', 1] };
    if (ESATTE[r]) return ESATTE[r];
    if (/^(J\/\(|km\/\(|M\/s ·|L\/\(mol|e$)/.test(r)) return null;
    return U[s] || null;
  }
  /* ── estrazione delle quantita' dal testo ──────────────────────────────── */
  var NUM = '(-?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?)';
  function quantita(testo) {
    var s = normalizza(testo), out = [], re = new RegExp(NUM + '\\s*(°c|°|[a-zA-Zμ°Å☉Ωω²³⁻¹/%.]+(?:/[a-zA-Z²³μ]+)?)?', 'g'), m;
    while ((m = re.exec(s))) {
      var v = parseFloat(m[1]), u = (m[2] || '').replace(/\.$/, ''), ul = u.toLowerCase(), info = null;
      /* M maiuscola dopo un numero = molare; m minuscola = metri */
      if (u === 'M') info = ['c', 1]; else if (u === 'mM') info = ['c', 1e-3]; else if (u === 'μM' || u === 'uM') info = ['c', 1e-6];
      else if (u === 'm') info = ['L', 1]; else if (u === 'A' || u === 'Å') info = u === 'A' ? ['I', 1] : ['L', 1e-10];
      else if (u === 'L') info = ['V', 1e-3];
      else info = U[ul] || null;
      if (/^(e|di|a|in|al|del|con|per|da|il|lo|la|of|at|to|and)$/.test(u)) { info = null; u = ''; }
      /* una lettera singola dopo un numero che non e' un'unita' nota (es. «2 x») non e' un'unita' */
      out.push({ v: v, u: info ? u : '', dim: info ? info[0] : null, fat: info ? info[1] : null, pos: m.index, usato: false, testo: m[0] });
    }
    return out;
  }
  function converti(q, uc) {
    if (!uc || q.dim !== uc[0]) return null;
    if (q.dim === 'TC') return q.v;
    return q.fat * q.v / uc[1];
  }

  /* ── che cosa si chiede: MATEMATICA ────────────────────────────────────── */
  function pulisciEspr(s) {
    return String(s).replace(/^\s*(la\s+funzione|the\s+function|f\(x\)\s*=|y\s*=|di|of|del|della)\s+/i, '').replace(/^\s*f\(x\)\s*=\s*/i, '').replace(/\s*(dx|d x)\s*$/i, '').replace(/[.?!]+\s*$/, '').replace(/\s+rispetto\s+a\s+x\s*$/i, '').trim();
  }
  function prova(e) { try { C.leggi(e); return true; } catch (er) { return false; } }
  function estremo(s) { s = String(s).trim().replace(/[.,;]$/, ''); if (/^(\+?∞|\+?inf|\+?infinito|più infinito|piu infinito)$/i.test(s)) return 'inf'; if (/^(-∞|-inf|-infinito|meno infinito)$/i.test(s)) return '-inf'; return s; }
  /* frazioni di polinomi: MCD con l'algoritmo di Euclide e semplificazione */
  function polDiv(a, b) { a = a.slice(); var q = [], db = b.length - 1; for (var i = a.length - 1; i >= db; i--) { var c = a[i] / b[db]; q[i - db] = c; for (var j = 0; j <= db; j++) a[i - db + j] -= c * b[j]; } for (var k = 0; k < q.length; k++) q[k] = q[k] || 0; var r = a.slice(0, db); while (r.length && Math.abs(r[r.length - 1]) < 1e-9) r.pop(); return { q: q, r: r }; }
  function polMCD(a, b) { var g = 0; while (b.length && g++ < 50) { var r = polDiv(a, b).r; a = b; b = r; } var c = a[a.length - 1]; return a.map(function (v) { return v / c; }); }
  function polTesto(c) { var B = F.calcolo.risolutore.belloNum, out = ''; for (var k = c.length - 1; k >= 0; k--) { var v = +c[k].toPrecision(12); if (!v) continue; var av = Math.abs(v), coef = av === 1 && k ? '' : String(B(av)), mon = k === 0 ? '' : k === 1 ? 'x' : 'x^' + k; out += (out ? (v < 0 ? ' - ' : ' + ') : (v < 0 ? '-' : '')) + coef + (coef && mon ? '*' : '') + mon; } return out || '0'; }
  function semplificaFrazione(e) {
    if (e.t !== '*') return null;
    var num = [], den = [];
    e.a.forEach(function (f) { if (f.t === '^' && f.a[1].t === 'n' && f.a[1].n < 0 && f.a[1].d === 1) den.push(f.a[1].n === -1 ? f.a[0] : C.costruisci.pow(f.a[0], C.Q(-f.a[1].n))); else num.push(f); });
    if (!den.length) return null;
    var N = C.coeffPolinomio(num.length === 1 ? num[0] : C.costruisci.mul.apply(null, num.length ? num : [C.Q(1)]), 'x'), D = C.coeffPolinomio(den.length === 1 ? den[0] : C.costruisci.mul.apply(null, den), 'x');
    if (!N || !D || D.length < 2) return null;
    var g = polMCD(N, D);
    if (g.length < 2) { if (N.length >= D.length) { var dv = polDiv(N, D); return { mcd: '1', q: polTesto(dv.q), r: dv.r.length ? polTesto(dv.r) : '0', d: polTesto(D) }; } return null; }
    var n2 = polDiv(N, g).q, d2 = polDiv(D, g).q;
    return { mcd: polTesto(g), num: polTesto(n2), den: polTesto(d2), risultato: d2.length === 1 ? polTesto(n2.map(function (v) { return v / d2[0]; })) : '(' + polTesto(n2) + ')/(' + polTesto(d2) + ')' };
  }
  function matematica(testo) {
    var s = normalizza(testo), l = minuscolo(testo), m;
    if (/autoval|eigenval|diagonaliz/.test(l)) {
      var grezzo = String(testo).replace(/[−–—]/g, '-'); m = /\[\s*\[(.+)\]\s*\]/.exec(grezzo) || /\[(.+)\]/.exec(grezzo) || /:\s*(.+)$/.exec(grezzo);
      if (m) { var mat = m[1].replace(/\]\s*,\s*\[/g, ';').replace(/,/g, ' ').replace(/;/g, '\n'); return { tipo: 'autovalori', titolo: t('Autovalori e diagonalizzazione', 'Eigenvalues and diagonalisation'), r: function () { return RS().autovalori(mat); }, capito: 'A = [' + esc(m[1]) + ']' }; }
    }
    if (/laplace/.test(l) && (m = /(?:laplace)\s*(?:di|of|\{|\()?\s*(?:f\(t\)\s*=)?\s*([^}]+?)\s*\}?\s*$/i.exec(s))) { var ef = pulisciEspr(m[1]); if (prova(ef)) return { tipo: 'laplace', titolo: t('Trasformata di Laplace', 'Laplace transform'), r: function () { return RS().laplace(ef); }, capito: 'f(t) = ' + esc(ef) }; }
    if (/residu/.test(l) && (m = /(?:∫|integrale|integral)?[^0-9a-z(]*(?:di|of)?\s*([^,]+?)\s*(?:dx|da|from|con|,|$)/i.exec(s.replace(/.*residu[a-z]*\s*(?:il|l'|dell'|di|of)?\s*(?:integrale)?/i, '')))) { var er = pulisciEspr(m[1]); if (prova(er)) return { tipo: 'residui', titolo: t('Integrale con i residui', 'Integral by residues'), r: function () { return RS().residui(er); }, capito: '∫ ' + esc(er) + ' dx ' + t('su ℝ', 'over ℝ') }; }
    if (/fourier/.test(l) && (m = /fourier\s*(?:di|of|della funzione)?\s*(?:f\(x\)\s*=)?\s*(.+?)\s*(?:su|on|in)?\s*(?:\[.*\])?\s*$/i.exec(s))) { var eF = pulisciEspr(m[1]); if (prova(eF)) return { tipo: 'fourier', titolo: t('Serie di Fourier', 'Fourier series'), r: function () { return RS().fourier(eF, 6); }, capito: 'f(x) = ' + esc(eF) + t(' su [−π, π]', ' on [−π, π]') }; }
    /* EDO: si portano tutti i termini a sinistra, G(x, y, y′, y″) = 0, e si leggono i coefficienti */
    var ci = [], reCI = /y(′|'|)\s*\(\s*(-?[\d.]+)\s*\)\s*=\s*(-?[\d.e+-]+)/g, mc; while ((mc = reCI.exec(s))) ci.push({ d: mc[1] ? 1 : 0, x: mc[2], v: mc[3] });
    var sE = s.replace(/[″"]/g, "''").replace(/′/g, "'").replace(/dy\/dx/g, "y'").replace(/d\^?2y\/dx\^?2/g, "y''");
    if (/y'/.test(sE) && /=/.test(sE)) {
      var eqE = sE.replace(/^.*(?:risolvi|solve|l'equazione|equazione|equation|\bedo\b|\bode\b|differenziale)\s*:?\s*/i, '').split(/,|;|\bcon\b|\bwith\b/)[0], pE = eqE.split('=');
      if (pE.length === 2) {
        var G = null;
        try { G = C.semplifica(C.costruisci.sub(C.leggi(pE[0].replace(/y''/g, '(ypp)').replace(/y'/g, '(yp)')), C.leggi(pE[1].replace(/y''/g, '(ypp)').replace(/y'/g, '(yp)')))); } catch (e) { G = null; }
        if (G) {
          var D = function (v) { return C.semplifica(C.deriva(G, v)); }, ST = function (e) { return C.stampa(e); };
          var zero = function (e) { return C.semplifica(C.sostituisci(C.sostituisci(C.sostituisci(e, 'ypp', C.Q(0)), 'yp', C.Q(0)), 'y', C.Q(0))); };
          var nIn = function (e, vs) { return vs.every(function (v) { return !C.dipende(e, v); }); };
          var y0 = ci.filter(function (q) { return !q.d; })[0], y1 = ci.filter(function (q) { return q.d; })[0];
          if (C.dipende(G, 'ypp')) {
            var a2 = D('ypp'), b2 = D('yp'), c2 = D('y'), f2 = C.semplifica(C.costruisci.neg(zero(G)));
            if (nIn(a2, ['x', 'y', 'yp', 'ypp']) && nIn(b2, ['x', 'y', 'yp', 'ypp']) && nIn(c2, ['x', 'y', 'yp', 'ypp']) && nIn(f2, ['y', 'yp', 'ypp'])) {
              var A2 = C.valuta(a2), B2 = C.valuta(b2), C2 = C.valuta(c2), F2 = ST(f2);
              return { tipo: 'secondoOrdine', titolo: t('EDO del secondo ordine a coefficienti costanti', 'Second-order constant-coefficient ODE'), r: function () { return RS().secondoOrdine({ a: A2, b: B2, c: C2, f: F2, x0: y0 && y1 ? y0.x : null, y0: y0 ? y0.v : null, y1: y1 ? y1.v : null }); }, capito: A2 + "y″ + (" + B2 + ")y′ + (" + C2 + ')y = ' + esc(F2) + (y0 && y1 ? ', y(' + y0.x + ') = ' + y0.v + ", y′(" + y1.x + ') = ' + y1.v : '') };
            }
          } else if (C.dipende(G, 'yp')) {
            var b1 = D('yp');
            if (nIn(b1, ['y', 'yp'])) {
              /* y′ = R(x, y) */
              var R = C.semplifica(C.costruisci.neg(C.costruisci.div(C.sostituisci(G, 'yp', C.Q(0)), b1)));
              var dR = C.semplifica(C.deriva(R, 'y')), ci0 = y0;
              if (nIn(dR, ['y'])) {
                var aL = C.semplifica(C.costruisci.neg(dR)), bL = C.semplifica(C.sostituisci(R, 'y', C.Q(0)));
                if (ST(bL) !== '0') return { tipo: 'lineare1', titolo: t('EDO lineare del primo ordine', 'First-order linear ODE'), r: function () { return RS().lineare1({ a: ST(aL), b: ST(bL), x0: ci0 ? ci0.x : null, y0: ci0 ? ci0.v : null }); }, capito: "y′ + (" + esc(ST(aL)) + ')·y = ' + esc(ST(bL)) };
              }
              var gx = C.semplifica(C.sostituisci(R, 'y', C.Q(1))), hy = C.semplifica(C.costruisci.div(R, gx));
              if (!C.dipende(hy, 'x') && !C.dipende(gx, 'y') && C.uguali(C.costruisci.mul(gx, hy), R)) return { tipo: 'separabile', titolo: t('EDO a variabili separabili', 'Separable ODE'), r: function () { return RS().separabile({ g: ST(gx), h: ST(hy), x0: ci0 ? ci0.x : null, y0: ci0 ? ci0.v : null }); }, capito: "y′ = (" + esc(ST(gx)) + ')·(' + esc(ST(hy)) + ')' };
            }
          }
        }
      }
    }
    /* integrale definito */
    if ((m = /(?:integr[a-z]*|∫|integral of|integrate)\s*(?:definito\s*)?(?:di|of)?\s*(.+?)\s+(?:da|from|tra|fra|between)\s+(\S+)\s+(?:a|ad|e|to|and)\s+(\S+?)[.?!]?\s*$/i.exec(s))) {
      var ei = pulisciEspr(m[1]), A = estremo(m[2]), Bv = estremo(m[3]);
      if (prova(ei)) return { tipo: 'integraleDefinito', titolo: t('Integrale definito', 'Definite integral'), r: function () { return RS().integraleDefinito(ei, A, Bv); }, capito: '∫ ' + esc(ei) + ' dx ' + t('da ', 'from ') + esc(A) + t(' a ', ' to ') + esc(Bv) };
    }
    if ((m = /(?:integr[a-z]*|∫|primitiv[a-z]*|antiderivative|integrate)\s*(?:indefinito\s*)?(?:di|of)?\s*(.+?)\s*$/i.exec(s))) { var ein = pulisciEspr(m[1]); if (prova(ein)) return { tipo: 'integraleIndefinito', titolo: t('Integrale indefinito', 'Indefinite integral'), r: function () { return RS().integraleIndefinito(ein); }, capito: '∫ ' + esc(ein) + ' dx' }; }
    if ((m = /\blim[a-z]*\s*(?:per|for|as|quando|con)?\s*x\s*(?:che\s*)?(?:->|→|tende\s*(?:a|ad)?|tends\s*to|va\s*(?:a|ad)?|goes\s*to)\s*(\S+?)\s*(?:,|:|\bdi\b|\bof\b|\bdella funzione\b)?\s+(.+?)\s*$/i.exec(s))) { var elp = pulisciEspr(m[2]), x0p = estremo(m[1]); if (prova(elp)) return { tipo: 'limite', titolo: t('Limite', 'Limit'), r: function () { return RS().limite(elp, x0p); }, capito: 'lim x→' + esc(x0p) + ' ' + esc(elp) }; }
    if ((m = /(?:lim[a-z]*)\s*(?:di|of|per)?\s*(.+?)\s*(?:per|quando|as|for|con)\s*x\s*(?:che\s*)?(?:tende|→|->|tends|va)\s*(?:a|ad|to)?\s*(\S+?)[.?!]?\s*$/i.exec(s))) { var el = pulisciEspr(m[1]), x0 = estremo(m[2]); if (prova(el)) return { tipo: 'limite', titolo: t('Limite', 'Limit'), r: function () { return RS().limite(el, x0); }, capito: 'lim x→' + esc(x0) + ' ' + esc(el) }; }
    if ((m = /(?:deriv[a-z]*|differenzia[a-z]*|differentiate)\s*(?:prima|seconda)?\s*(?:di|of)?\s*(.+?)\s*$/i.exec(s))) {
      var ed = pulisciEspr(m[1]);
      if (prova(ed)) return { tipo: 'derivata', titolo: t('Derivata', 'Derivative'), r: function () { var e = C.leggi(ed), passi = [], d = C.deriva(e, 'x', passi); return { passi: [{ titolo: t('Funzione', 'Function'), html: 'f(x) = ' + C.html(e) }].concat(passi.map(function (p) { return { titolo: F.tt(C.REGOLE[p.regola]), html: esc(p.espr) }; }), [{ titolo: t('Risultato', 'Result'), html: "f′(x) = <b>" + C.html(d) + '</b>' + (C.stampa(C.espandi(d)) !== C.stampa(d) ? ' = ' + C.html(C.espandi(d)) : '') + "<br>f″(x) = " + C.html(C.deriva(d, 'x')) }]), risultato: C.stampa(d) }; }, capito: 'f(x) = ' + esc(ed) };
    }
    if ((m = /(?:taylor|mac\s?laurin)\s*(?:di|of)?\s*(.+?)(?:\s+(?:in|centrato in|attorno a|around|at)\s+(?:x\s*=\s*)?(-?[\d.]+))?(?:\s+(?:di\s+)?(?:ordine|order|grado)\s+(\d+))?\s*$/i.exec(s))) { var et = pulisciEspr(m[1].replace(/\s+(?:di\s+)?(?:ordine|order|grado)\s+\d+.*$/i, '')), ot = m[3] || (/(?:ordine|order|grado)\s+(\d+)/i.exec(s) || [0, 5])[1]; if (prova(et)) return { tipo: 'taylor', titolo: t('Polinomio di Taylor', 'Taylor polynomial'), r: function () { return RS().taylor(et, m[2] || '0', +ot); }, capito: esc(et) + t(', centro ', ', centre ') + (m[2] || '0') + t(', ordine ', ', order ') + ot }; }
    if ((m = /(?:studi[a-z]*|analizza|analyse|analyze|grafico di)\s*(?:la\s+funzione|the\s+function)?\s*(?:f\(x\)\s*=)?\s*(.+?)\s*$/i.exec(s))) { var es = pulisciEspr(m[1]); if (prova(es) && C.dipende(C.leggi(es), 'x')) return { tipo: 'studio', titolo: t('Studio di funzione', 'Function analysis'), r: function () { return RS().studio(es); }, capito: 'f(x) = ' + esc(es) }; }
    if ((m = /dominio\s*(?:di|della funzione)?\s*(?:f\(x\)\s*=)?\s*(.+?)\s*$/i.exec(s)) || (m = /domain\s*(?:of)?\s*(.+?)\s*$/i.exec(s))) { var eD = pulisciEspr(m[1]); if (prova(eD)) return { tipo: 'dominio', titolo: t('Dominio', 'Domain'), r: function () { return RS().dominio(eD); }, capito: 'f(x) = ' + esc(eD) }; }
    if (/raggio di convergenza|serie di potenze|power series|radius of convergence/.test(l) && (m = /(?:potenze|series|serie|convergenza)\s*(?:di|of|della serie)?\s*(?:Σ|sum|∑)?\s*(.+?)\s*$/i.exec(s.replace(/^.*(?:serie di potenze|power series|della serie|of the series|convergenza)\s*(?:di|of)?\s*/i, 'serie ')))) {
      var tp = pulisciEspr(m[1]).replace(/\s*per\s+n.*$/i, '').replace(/^(?:di|of|della serie)\s+/i, '');
      if (prova(tp)) { var Et = C.leggi(tp), cn = C.dipende(Et, 'x') ? C.semplifica(C.costruisci.div(Et, C.costruisci.pow(C.simbolo('x'), C.simbolo('n')))) : Et, cS = C.stampa(cn); if (!C.dipende(cn, 'x')) return { tipo: 'seriePotenze', titolo: t('Serie di potenze', 'Power series'), r: function () { return RS().seriePotenze(cS, '0'); }, capito: 'Σ ' + esc(cS) + ' · xⁿ' }; }
    }
    if ((m = /(?:serie|series|Σ|sommatoria)\s*(?:numerica)?\s*(?:di|of|per n da \d+)?\s*(.+?)\s*$/i.exec(s))) { var an = pulisciEspr(m[1]).replace(/\s*per\s+n.*$/i, ''); if (prova(an) && C.dipende(C.leggi(an), 'n')) return { tipo: 'serieNumerica', titolo: t('Serie numerica', 'Numerical series'), r: function () { return RS().serieNumerica(an, /da\s+n?\s*=?\s*0/i.test(s) ? 0 : 1); }, capito: 'aₙ = ' + esc(an) }; }
    if ((m = /(z\s*\^\s*(\d+)\s*=\s*(.+))$/i.exec(s))) { var nz = m[2], w = m[3].trim(); return { tipo: 'complessi', titolo: t('Radici n-esime complesse', 'Complex n-th roots'), r: function () { return RS().complessi({ tipo: 'radici', n: +nz, w: w }); }, capito: 'z^' + nz + ' = ' + esc(w) }; }
    if (/(risolvi|solve|equazione|equation|trova x)/.test(l) && /=/.test(s)) { var eqs = s.replace(/^.*?(risolvi|solve|l'equazione|equazione|equation)\s*:?\s*/i, '').replace(/[.?!]\s*$/, ''); return { tipo: 'equazione', titolo: t('Equazione', 'Equation'), r: function () { var r = F.calcolo.basi.risolvi(eqs); return { passi: [{ titolo: t('Equazione', 'Equation'), html: esc(eqs) }, { titolo: t('Metodo', 'Method'), html: r.grado === 1 ? t('primo grado', 'linear') : r.grado === 2 ? t('secondo grado, Δ = ', 'quadratic, Δ = ') + F.calcolo.risolutore.bello(r.delta) : r.grado ? t('polinomio di grado ', 'polynomial of degree ') + r.grado + ' (Durand-Kerner)' : r.fratta ? t('equazione fratta', 'fractional equation') : t('ricerca numerica degli zeri', 'numerical root search') }, { titolo: t('Soluzioni', 'Solutions'), html: r.radici.map(function (z) { return '<b>' + r.x + ' = ' + (z.im ? F.calcolo.risolutore.bello(z.re) + (z.im > 0 ? ' + ' : ' − ') + F.calcolo.risolutore.bello(Math.abs(z.im)) + 'i' : F.calcolo.risolutore.bello(+z.re.toPrecision(12))) + '</b>'; }).join('<br>') || '—' }], risultato: r.radici.map(function (z) { return z.im ? '' : F.calcolo.risolutore.bello(+z.re.toPrecision(12)); }).filter(Boolean).join('; ') }; }, capito: esc(eqs) }; }
    /* solo un'espressione: semplifica, deriva, integra */
    var nuda = pulisciEspr(s.replace(/^(semplifica|simplify|calcola|compute|quanto fa|valuta)\s*/i, ''));
    var paroleNude = (nuda.match(/[a-zA-Zàèéìòù]{3,}/g) || []).filter(function (w) { return !/^(sin|cos|tan|cot|sec|csc|ln|log|exp|sqrt|abs|asin|acos|atan|arcsin|arccos|arctan|sinh|cosh|tanh|pi|fact|gamma|erf|sign)$/i.test(w); });
    if (prova(nuda) && /[a-z(^*/+\-]/i.test(nuda) && !paroleNude.length && (/[\d^*/+\-()]/.test(nuda))) {
      return { tipo: 'espressione', titolo: t('Espressione', 'Expression'), r: function () {
        var e = C.leggi(nuda), vs = C.simboli(e), p = [{ titolo: t('Forma semplificata', 'Simplified form'), html: C.html(e) + (!/\//.test(C.stampa(e)) && C.stampa(C.espandi(e)) !== C.stampa(e) ? ' = ' + C.html(C.espandi(e)) : '') }];
        var fr = null; try { fr = semplificaFrazione(e); } catch (er) { fr = null; }
        if (fr && fr.risultato) { var ris = C.leggi(fr.risultato); p.push({ titolo: t('Semplificazione della frazione', 'Cancelling the fraction'), html: t('MCD di numeratore e denominatore (algoritmo di Euclide): ', 'GCD of numerator and denominator (Euclid’s algorithm): ') + C.html(C.leggi(fr.mcd)) + '<br>' + t('dividendo entrambi: ', 'dividing both: ') + '<b>' + C.html(ris) + '</b>' + t(' (per x che non annulla il fattore semplificato)', ' (for x not cancelling the removed factor)') }); e = ris; }
        else if (fr) p.push({ titolo: t('Divisione tra polinomi', 'Polynomial division'), html: t('quoziente ', 'quotient ') + C.html(C.leggi(fr.q)) + t(', resto ', ', remainder ') + C.html(C.leggi(fr.r)) + ': ' + C.html(e) + ' = ' + C.html(C.leggi(fr.q)) + (fr.r !== '0' ? ' + ' + C.html(C.leggi('(' + fr.r + ')/(' + fr.d + ')')) : '') });
        if (!vs.length) { var v = C.valuta(e); p.push({ titolo: t('Valore', 'Value'), html: '<b>' + F.calcolo.risolutore.bello(v) + '</b> ≈ ' + (+v.toPrecision(12)) }); return { passi: p, risultato: String(+v.toPrecision(12)) }; }
        var x = vs.indexOf('x') >= 0 ? 'x' : vs[0], d = C.deriva(e, x), I = C.integra(e, x);
        p.push({ titolo: t('Derivata', 'Derivative'), html: 'd/d' + x + ' = ' + C.html(d) });
        p.push({ titolo: t('Primitiva', 'Antiderivative'), html: I ? C.html(I) + ' + c' : t('non elementare', 'not elementary') });
        return { passi: p, risultato: C.stampa(e) };
      }, capito: esc(nuda) };
    }
    return null;
  }

  /* ── che cosa si chiede: FISICA e CHIMICA (modelli) ─────────────────────── */
  var SINONIMI = {
    /* chimica */
    acidodebole: 'acido debole ka acetico formico benzoico lattico hf fluoridrico nitroso ipocloroso dissociazione grado alfa weak acid', basedebole: 'base debole kb ammoniaca nh3 ammina piridina metilammina weak base', phforte: 'acido forte base forte hcl hno3 h2so4 naoh koh hbr strong ph', tampone: 'tampone buffer henderson hasselbalch aggiunta', idrolisi: 'sale idrolisi acetato di sodio nh4cl hydrolysis', titolazione: 'titolazione titolato titolante punto equivalente volume equivalente naoh titration buretta',
    limitante: 'reagente limitante resa reagiscono teorica prodotto limiting yield eccesso', massamolare: 'massa molare peso molecolare moli molecole composizione percentuale molar mass', formulaminima: 'formula minima empirica molecolare composizione percentuale empirical', soluzioni: 'molarita molalita frazione molare soluzione disciolti diluizione diluito molarity preparare servono sciolti', gas: 'gas occupano pressione volume temperatura densita massa molare del gas pv=nrt', dalton: 'miscela pressione parziale dalton frazione molare gas', colligative: 'ebullioscopico crioscopico osmotica colligative congelamento ebollizione van t hoff',
    hess: 'entalpia di reazione hess formazione entropia gibbs combustione spontanea k equilibrio termodinamica', calorimetro: 'calorimetro neutralizzazione innalza temperatura soluzione calore reazione', cinetica: 'ordine reazione costante cinetica emivita dimezzamento concentrazione dopo first order half-life', arrhenius: 'arrhenius energia di attivazione due temperature fattore pre-esponenziale', equilibrio: 'equilibrio kc concentrazioni all equilibrio ice', kpkc: 'kp kc delta n', ksp: 'solubilita ksp prodotto di solubilita sale poco solubile ione comune', precipita: 'precipita precipitato mescolano prodotto ionico', pila: 'pila cella galvanica nernst potenziale catodo anodo daniell fem', elettrolisi: 'elettrolisi faraday corrente deposita depositato', bohr: 'bohr transizione riga spettrale idrogeno balmer lyman', debroglie: 'de broglie lunghezza d onda elettrone accelerato',
    beer: 'lambert beer assorbanza trasmittanza epsilon cuvetta spettrofotometro', gravimetria: 'gravimetria precipitato pesato fattore gravimetrico', edta: 'edta durezza complessometrica nero eriocromo', permanganato: 'permanganato kmno4 ferro redox titolazione fe2+', poliprotico: 'poliprotico fosforico h3po4 diprotico triprotico', distribuzione: 'frazioni distribuzione alfa carbonico', ppm: 'ppm ppb parti per milione', vanthoff: 'van t hoff k due temperature entalpia standard', clapeyron: 'clausius clapeyron tensione di vapore evaporazione', polieni: 'polieni particella nella scatola butadiene esatriene carotene coniugato', rotore: 'rotore rigido costante rotazionale vibrazionale biatomica legame', michaelis: 'michaelis menten enzima inibitore inibizione km vmax', sackur: 'sackur tetrode entropia statistica monoatomico', debye: 'debye huckel forza ionica attivita coefficiente', ossigeno: 'pourbaix ossigeno e-ph', insaturazioni: 'insaturazioni dbe gradi di insaturazione anelli', polarimetria: 'polarimetria rotazione specifica eccesso enantiomerico ee', multistadio: 'sintesi stadi passaggi resa complessiva', estrazione: 'estrazione imbuto separatore kd ripartizione', cromatografia: 'cromatografia piatti teorici risoluzione tempi di ritenzione hplc', isotopi: 'isotopi cloro bromo m+2 spettro di massa', nmrhz: 'nmr ppm hz accoppiamento molteplicita doppietto tripletto quartetto', pI: 'punto isoelettrico amminoacido carica netta elettroforesi', atp: 'atp idrolisi delta g biochimico', lineweaver: 'lineweaver burk km vmax dati velocita', marcus: 'marcus trasferimento elettronico riorganizzazione', kie: 'effetto isotopico cinetico deuterio kh kd', wigner: 'wigner tunnelling frequenza immaginaria',
    /* fisica */
    mua: 'frena accelerazione costante moto rettilineo uniformemente accelerato spazio di arresto auto', caduta: 'lanciato verso l alto caduta libera edificio torre altezza cade lasciato cadere', proiettile: 'proiettile lanciato angolo gittata obliquo pallone palla parabolico', circolare: 'circolare uniforme periodo circonferenza centripeta', piano: 'piano inclinato attrito scivola blocco', atwood: 'atwood carrucola due masse appese filo', tavolo: 'tavolo massa appesa blocco filo carrucola attrito', molla: 'molla oscillatore costante elastica oscilla ampiezza', energia: 'scivolo conservazione energia dislivello attrito dissipa', giro: 'giro della morte loop', lavoro: 'lavoro potenza forza spostamento trascina', anelastico: 'urto anelastico restano attaccati', elastico: 'urto elastico', pendolo: 'pendolo', orbita: 'satellite orbita circolare velocita di fuga', rotolamento: 'rotola rotolamento sfera cilindro anello piano inclinato', carrucola: 'carrucola massa disco momento d inerzia', stevino: 'stevino pressione profondita', archimede: 'archimede galleggia spinta immerso', torricelli: 'torricelli foro efflusso serbatoio', venturi: 'venturi strozzatura tubo bernoulli continuita', gasperfetto: 'gas perfetto pressione moli', isoterma: 'isoterma isotermo espansione', isobara: 'isobara pressione costante', isocora: 'isocora volume costante', adiabatica: 'adiabatica adiabatico compressione', carnot: 'carnot rendimento macchina termica', calorimetria: 'mescolano calorimetria equilibrio termico', ghiaccio: 'ghiaccio fusione',
    coulomb: 'coulomb cariche puntiformi forza elettrica', duecariche: 'campo elettrico potenziale due cariche', gauss: 'gauss sfera filo piano carica', condpiano: 'condensatore piano armature', condensatori: 'condensatori serie parallelo capacita equivalente', resistenze: 'resistenze resistori serie parallelo ohm', kirchhoff: 'kirchhoff maglie nodi circuito', rc: 'rc carica condensatore costante di tempo', lorentz: 'lorentz campo magnetico particella raggio', filo: 'filo rettilineo corrente fili paralleli', solenoide: 'solenoide spire induttanza', barretta: 'barretta binari fem mozionale', flusso: 'flusso bobina faraday induzione', rl: 'rl induttanza', ondaem: 'onda elettromagnetica', snell: 'snell rifrazione riflessione totale angolo limite', lente: 'lente focale immagine', young: 'young doppia fenditura frange interferenza', malus: 'malus polarizzatori polarizzata',
    forzato: 'forzato risonanza smorzato', corda: 'corda armoniche onde stazionarie', doppler: 'doppler sirena frequenza percepita', fotoelettrico: 'fotoelettrico lavoro di estrazione', compton: 'compton diffusione raggi x', relativita: 'relativita dilatazione contrazione lorentz gamma', corponero: 'corpo nero wien stefan', scatola: 'particella nella scatola buca infinita', tunnel: 'tunnel barriera', stella: 'stella luminosita raggi solari', magnitudini: 'magnitudine apparente assoluta', parallasse: 'parallasse', hubble: 'hubble redshift galassia', keplero: 'keplero periodo semiasse massa del sistema', schwarzschild: 'buco nero schwarzschild', jeans: 'jeans nube molecolare collasso', pianeta: 'pianeta albedo temperatura di equilibrio', sequenza: 'sequenza principale vita della stella', velradiale: 'velocita radiale riga del sodio', legame: 'energia di legame difetto di massa nucleone', decadimento: 'decadimento attivita radionuclide becquerel', qvalore: 'q-valore reazione nucleare fusione fissione', datazione: 'datazione carbonio 14 eta reperto', attenuazione: 'attenuazione schermatura spessore', dose: 'dose gray sievert', raggionucleo: 'raggio del nucleo densita nucleare', coulombnucleare: 'barriera coulombiana', heisenberg: 'indeterminazione heisenberg', idrogeno: 'atomo idrogenoide orbitale nodi', oscillatoreq: 'oscillatore armonico quantistico punto zero', rotoreq: 'rotore livello rotazionale popolato', larmor: 'larmor nmr epr spin campo magnetico frequenza', scatola3d: 'scatola cubica degenerazione', indet_scatola: 'valori di aspettazione', boltzmann2: 'popolazioni boltzmann due livelli', variazionale: 'variazionale elio', perturbazione: 'perturbazione campo elettrico oscillatore'
  };
  var SINONIMI_EN = {
    mua: 'car brakes braking accelerates stopping distance speed', caduta: 'dropped falls thrown upward tower building cliff height', proiettile: 'ball launched thrown angle range projectile cannon', circolare: 'circular period revolution', piano: 'incline slope block friction slides', atwood: 'atwood pulley two masses', molla: 'spring oscillates stiffness', energia: 'slide energy height', lavoro: 'work power force', anelastico: 'inelastic stick together', elastico: 'elastic collision', pendolo: 'pendulum', orbita: 'satellite orbit escape', rotolamento: 'rolls rolling sphere cylinder', archimede: 'floats buoyancy submerged', torricelli: 'hole tank outflow', gasperfetto: 'ideal gas pressure moles', carnot: 'carnot efficiency engine', calorimetria: 'mixed water thermal equilibrium', coulomb: 'coulomb point charges', duecariche: 'two charges field potential', condpiano: 'parallel plate capacitor', condensatori: 'capacitors series parallel', resistenze: 'resistors series parallel ohm', rc: 'capacitor charging time constant', lorentz: 'magnetic field particle radius', solenoide: 'solenoid turns', snell: 'refraction critical angle', lente: 'lens focal image', young: 'double slit fringes', doppler: 'siren doppler', fotoelettrico: 'photoelectric work function', relativita: 'relativity time dilation length contraction lorentz factor', corponero: 'blackbody wien', scatola: 'particle box well', tunnel: 'tunnelling barrier', stella: 'star luminosity solar radii', parallasse: 'parallax', hubble: 'redshift galaxy hubble', keplero: 'kepler period semimajor', schwarzschild: 'black hole schwarzschild', legame: 'binding energy mass defect', decadimento: 'decay activity half life', datazione: 'dating carbon age sample', dose: 'dose gray sievert', heisenberg: 'uncertainty heisenberg',
    acidodebole: 'weak acid acetic', basedebole: 'weak base ammonia', phforte: 'strong acid strong base', tampone: 'buffer henderson acetate', titolazione: 'titration titrated equivalence', limitante: 'limiting reagent yield', massamolare: 'molar mass moles', formulaminima: 'empirical formula', soluzioni: 'molarity molality dissolved', gas: 'gas density molar mass', colligative: 'freezing point boiling point osmotic', hess: 'enthalpy reaction gibbs', cinetica: 'rate constant half life order', arrhenius: 'activation energy arrhenius', equilibrio: 'equilibrium ice table', ksp: 'solubility ksp', pila: 'cell nernst cathode anode', elettrolisi: 'electrolysis faraday current deposited', bohr: 'bohr transition hydrogen line', beer: 'absorbance beer lambert', pI: 'isoelectric amino acid'
  };
  function radici(s) { return minuscolo(s).replace(/[^a-z0-9+ ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; }).map(function (w) { return w.slice(0, 6); }); }
  /* il catalogo: i modelli della materia scelta, poi quelli dell'altra (gas, termodinamica, atomo
     sono di entrambe) con un peso un po' minore */
  function catalogo(materia) {
    var out = [], FS = F.calcolo.esameFisica, CS = F.calcolo.esameChimica;
    if (FS) FS.MODELLI.forEach(function (m) { out.push({ materia: 'fisica', m: m, sorg: FS, peso: materia === 'chimica' ? 0.85 : 1 }); });
    if (CS) CS.MODELLI.forEach(function (m) { out.push({ materia: 'chimica', m: m, sorg: CS, peso: materia === 'fisica' ? 0.85 : 1 }); });
    return out;
  }
  var IDF = null;
  function chiaviModello(m) {
    var etich = m.dati.map(function (c) { return F.tt(c[1]); }).join(' ');
    return { forti: radici(m.nome[0] + ' ' + m.nome[1] + ' ' + (SINONIMI[m.id] || '') + ' ' + (SINONIMI_EN[m.id] || '')), deboli: radici(etich) };
  }
  function idf() {
    if (IDF) return IDF;
    var df = {}, cat = catalogo(null);
    cat.forEach(function (c) { var k = chiaviModello(c.m), v = {}; k.forti.concat(k.deboli).forEach(function (w) { if (!v[w]) { v[w] = 1; df[w] = (df[w] || 0) + 1; } }); c.chiavi = k; });
    IDF = { df: df, N: cat.length, cat: cat };
    return IDF;
  }
  function scegliModello(testo, materia) {
    var D = idf(), parole = radici(testo), insieme = {}; parole.forEach(function (w) { insieme[w] = 1; });
    var l = ' ' + minuscolo(testo).replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ') + ' ', migliori = [];
    D.cat.forEach(function (c0) {
      var peso = materia === 'chimica' && c0.materia === 'fisica' || materia === 'fisica' && c0.materia === 'chimica' ? 0.85 : 1;
      var p = 0, viste = {};
      function w(k) { return Math.log(1 + D.N / (D.df[k] || 1)); }
      c0.chiavi.forti.forEach(function (k) { if (insieme[k] && !viste[k]) { viste[k] = 1; p += w(k); } });
      c0.chiavi.deboli.forEach(function (k) { if (insieme[k] && !viste[k]) { viste[k] = 1; p += 0.4 * w(k); } });
      /* le frasi di due parole dei sinonimi («piano inclinato», «punto isoelettrico») pesano di piu' */
      var sin = (SINONIMI[c0.m.id] || '') + ' ' + (SINONIMI_EN[c0.m.id] || '') + ' ' + minuscolo(c0.m.nome[0]) + ' ' + minuscolo(c0.m.nome[1]);
      sin = sin.replace(/[^a-z0-9+ ]/g, ' ').split(/\s+/);
      for (var i = 0; i < sin.length - 1; i++) if (sin[i].length > 2 && sin[i + 1].length > 2 && l.indexOf(' ' + sin[i] + ' ' + sin[i + 1] + ' ') >= 0) p += 2;
      if (l.indexOf(' ' + c0.m.id.toLowerCase() + ' ') >= 0) p += 2;
      if (p > 0) migliori.push({ c: { materia: c0.materia, m: c0.m, sorg: c0.sorg }, p: p * peso });
    });
    migliori.sort(function (a, b) { return b.p - a.p; });
    return migliori;
  }
  /* fra i migliori per parole chiave vince chi «usa» piu' dati del testo e ne inventa meno */
  function riordina(testo, cand) {
    var top = cand.slice(0, 8), massimo = top.length ? top[0].p : 0;
    top.forEach(function (x) {
      var est = estraiDati(testo, x.c.m), dalTesto = 0, supposti = 0;
      x.c.m.dati.forEach(function (c) { var o = est.origine[c[0]]; if (o === 'testo') dalTesto++; else if (o === 'predefinito') supposti++; });
      x.est = est; x.fit = dalTesto; x.tot = x.p >= 0.35 * massimo ? x.p + 1.1 * dalTesto - 0.35 * supposti : -1e9 + x.p;
    });
    top.sort(function (a, b) { return b.tot - a.tot; });
    return top.concat(cand.slice(8));
  }
  var PAROLE = /^(per|di|del|della|con|in|il|la|lo|le|a|e|ed|of|the|for|and|to|ion|ione|da|su|al|se|non|data|dato|nessun|nessuna|none|if|not|given|tra|fra|o|or)$/i;
  function etichette(c) {
    var nomi = [c[0]], lab = Array.isArray(c[1]) ? c[1][0] : String(c[1]);
    function piano(w) { return w.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'.indexOf(d); }).replace(/_/g, ''); }
    if (!/\s/.test(lab.trim())) nomi.push(lab.trim(), piano(lab.trim()));
    else lab.split(/[\s,()]+/).forEach(function (w) { if (w && !PAROLE.test(w) && /^[A-Za-zΔα-ω][_₀-₉0-9a-z′]{0,3}$/.test(w) && (/[_₀-₉0-9′]/.test(w) || w.length === 1 || /^[ΔΑ-Ωα-ω]/.test(w))) nomi.push(w, piano(w)); });
    return nomi.filter(function (v, i, a) { return v && a.indexOf(v) === i; });
  }
  var FORM = '(?:[A-Z][a-z]?\\d*|\\((?:[A-Z][a-z]?\\d*)+\\)\\d*)+(?:\\^?\\d*[+-])?';
  function formulaValida(f) { try { var a = F.calcolo.lineare.leggiFormula(f.replace(/\^?\d*[+-]$/, '')).atomi; return Object.keys(a).length > 0 && Object.keys(a).every(function (el) { return F.calcolo.esameChimica && F.calcolo.esameChimica.MA[el]; }); } catch (e) { return false; } }
  function opzioni(c) { var lab = Array.isArray(c[1]) ? c[1][0] : String(c[1]); if (lab.indexOf('|') < 0) return null; return lab.replace(/^[^:]*:\s*/, '').split('|').map(function (o) { return o.trim().split(/[\s(]/)[0]; }); }
  /* buon senso specifico di alcuni problemi: che cosa vuol dire «frena», «cade», «un elettrone»… */
  var PARTICELLE = { elettron: [1.602176634e-19, 9.1093837e-31], electron: [1.602176634e-19, 9.1093837e-31], proton: [1.602176634e-19, 1.67262192e-27], positron: [1.602176634e-19, 9.1093837e-31], alfa: [3.204353268e-19, 6.6446573e-27], alpha: [3.204353268e-19, 6.6446573e-27], deutone: [1.602176634e-19, 3.3435838e-27], deuteron: [1.602176634e-19, 3.3435838e-27], neutron: [0, 1.67492750e-27], muon: [1.602176634e-19, 1.8835316e-28] };
  function particella(l) { for (var k in PARTICELLE) if (l.indexOf(k) >= 0 || l.indexOf(k.replace(/n$/, 'ne')) >= 0) return PARTICELLE[k]; return null; }
  function manca(o, k) { return o[k] !== 'testo' && o[k] !== 'dedotto'; }
  var RITOCCHI = {
    mua: function (d, o, l) { if (/fren|deceler|si ferma|arrest|brak|decelerat|stops/.test(l)) { if (d.a > 0) d.a = -d.a; if (manca(o, 't') && d.a < 0) { d.t = d.v0 / -d.a; o.t = 'dedotto'; } } },
    caduta: function (d, o, l) { if (manca(o, 'v0') && /\bcade|lasciat[oa] cadere|da fermo|\bdropped|falls|from rest|abbandonat/.test(l)) { d.v0 = 0; o.v0 = 'dedotto'; } },
    lorentz: function (d, o, l) { var p = particella(l); if (p) { if (manca(o, 'q')) { d.q = p[0]; o.q = 'dedotto'; } if (manca(o, 'm')) { d.m = p[1]; o.m = 'dedotto'; } } },
    relativita: function (d, o, l) { var p = particella(l); if (p && manca(o, 'm')) { d.m = p[1]; o.m = 'dedotto'; } },
    debroglie: function (d, o, l) { },
    resistenze: function (d, o) { if (manca(o, 'R3') && o.R1 === 'testo' && o.R2 === 'testo') { if (d.schema === 'parallelo') { d.R3 = Infinity; o.R3 = 'assente'; } else if (d.schema === 'serie') { d.R3 = 0; o.R3 = 'assente'; } } },
    condensatori: function (d, o) { if (manca(o, 'C3') && o.C1 === 'testo' && o.C2 === 'testo') { if (d.schema === 'parallelo') { d.C3 = 0; o.C3 = 'assente'; } else if (d.schema === 'serie') { d.C3 = Infinity; o.C3 = 'assente'; } } },
    tampone: function (d, o, l, q) {
      if (manca(o, 'agg') && !/aggiun|add/.test(l)) { d.agg = 0; o.agg = 'assente'; }
      /* con le sole concentrazioni il pH dipende dal rapporto: si ragiona su 1 L */
      var cc = q.filter(function (x) { return !x.usato && x.dim === 'c'; });
      if (manca(o, 'na') && cc[0]) { d.na = cc[0].v * cc[0].fat; o.na = 'dedotto'; cc[0].usato = true; }
      if (manca(o, 'nb') && cc[1]) { d.nb = cc[1].v * cc[1].fat; o.nb = 'dedotto'; cc[1].usato = true; }
    },
    phforte: function (d, o, l) { if (manca(o, 'tipo') && /naoh|koh|lioh|ba\(oh\)2|ca\(oh\)2|idrossido|base forte|strong base/.test(l)) { d.tipo = 'base'; o.tipo = 'dedotto'; } else if (manca(o, 'tipo')) { o.tipo = 'dedotto'; } }
  };
  function estraiDati(testo, modello) {
    var s = normalizza(testo), q = quantita(testo), dati = {}, origine = {}, l = minuscolo(testo);
    function usa(da, a) { q.forEach(function (x) { if (x.pos >= da && x.pos < a) x.usato = true; }); }
    /* numeri che fanno parte di un nome (carbonio 14, uranio-235, C-14, Fe-56) non sono dati */
    var reIso = /\b(?:(?:carbonio|carbon|uranio|uranium|iodio|iodine|cobalto|cobalt|potassio|potassium|stronzio|strontium|cesio|caesium|cesium|trizio|plutonio|plutonium|radon|torio|thorium|ferro|iron)[\s-]+|(?:[A-Z][a-z]?)-)(\d{1,3})\b/g, mi;
    while ((mi = reIso.exec(s))) usa(mi.index + mi[0].length - mi[1].length, mi.index + mi[0].length);
    var reRx = new RegExp('((?:\\d*\\s*' + FORM + '\\s*\\+\\s*)*\\d*\\s*' + FORM + '\\s*(?:->|→|=>|⟶|⇌|<=>)\\s*(?:\\d*\\s*' + FORM + '\\s*\\+\\s*)*\\d*\\s*' + FORM + ')'), reazione = reRx.exec(s), destra = [];
    if (reazione) { usa(reazione.index, reazione.index + reazione[0].length); destra = reazione[1].split(/->|→|=>|⟶|⇌|<=>/)[1].split('+').map(function (x) { return x.trim().replace(/^\d+\s*/, ''); }); }
    var formule = (s.match(new RegExp('\\b' + FORM, 'g')) || []).filter(function (f) { return f.length > 1 && !/^(Ka|Kb|Kc|Kp|Ksp|Km|Kd|Ea|pH|Hz|Pa|Bq|Gy|Sv|ΔH|In)$/.test(f) && formulaValida(f) && !(reazione && reazione[1].indexOf(f) >= 0); });
    /* coppie «formula: valore» (masse, moli, entalpie di formazione…) */
    var reCop = new RegExp('(' + FORM + '|[+-]\\d)\\s*[:=]\\s*' + NUM, 'g'), coppie = [], mc;
    while ((mc = reCop.exec(s))) coppie.push({ k: mc[1], v: mc[2], da: mc.index, a: mc.index + mc[0].length });
    var reCop2 = new RegExp(NUM + '\\s*(?:g|mol|kJ/mol)?\\s+(?:di|of)\\s+(' + FORM + ')', 'g');
    while ((mc = reCop2.exec(s))) if (formulaValida(mc[2])) coppie.push({ k: mc[2], v: mc[1], da: mc.index, a: mc.index + mc[0].length });
    /* liste di numeri (pKa, rese, Ka1, Ka2…) */
    var liste = [], reL = new RegExp(NUM + '(?:\\s*%?\\s*(?:,|;|e|and)\\s*' + NUM + ')+', 'g');
    while ((mc = reL.exec(s))) liste.push({ t: mc[0].replace(/\s*%/g, '').split(/\s*(?:,|;|\be\b|\band\b)\s*/).filter(Boolean).join(', '), da: mc.index, a: mc.index + mc[0].length });
    /* 0. campi testuali */
    var fi = 0, li = 0, coppieUsate = false;
    modello.dati.forEach(function (c) {
      if (typeof c[3] === 'number') return;
      var def = String(c[3]), op = opzioni(c), lab = minuscolo(F.tt(c[1]));
      if (op) { var o = op.filter(function (x) { return new RegExp('\\b' + x, 'i').test(l); })[0]; if (o) { dati[c[0]] = o; origine[c[0]] = 'testo'; } return; }
      if (/->|→/.test(def)) { if (reazione) { dati[c[0]] = reazione[1].trim().replace(/→|=>|⟶/g, '->'); origine[c[0]] = 'testo'; } return; }
      if (/^[^:,]+:\s*-?[\d.]/.test(def)) { if (coppie.length && !coppieUsate) { coppieUsate = true; dati[c[0]] = coppie.map(function (p) { usa(p.da, p.a); return p.k + ': ' + p.v; }).join(', '); origine[c[0]] = 'testo'; } return; }
      if (/^-?[\d.e+-]+\s*,/.test(def)) { var L = liste[li++]; if (L) { dati[c[0]] = L.t; origine[c[0]] = 'testo'; usa(L.da, L.a); } return; }
      if (/^[A-Z(]/.test(def) && /^[A-Za-z0-9()^+\-·]+$/.test(def)) {
        if (/prodott|product/.test(lab) && destra.length) { dati[c[0]] = destra[0]; origine[c[0]] = 'testo'; return; }
        if (formule[fi]) { dati[c[0]] = formule[fi++]; origine[c[0]] = 'testo'; }
      }
    });
    /* 1. assegnazioni esplicite «nome = valore» */
    modello.dati.forEach(function (c) {
      if (typeof c[3] !== 'number') return;
      etichette(c).forEach(function (lab) {
        if (dati[c[0]] !== undefined) return;
        var corto = lab.length <= 2 && !/[_0-9]/.test(lab);
        var re = new RegExp('(?:^|[\\s,;(])' + lab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (corto ? '\\s*(?:=|:)\\s*' : '\\s*(?:=|:|vale|è|e\\s+di|di)?\\s*') + NUM + '\\s*([a-zA-Zμ°☉Ω/%²³⁻¹]*)', 'gi'), m;
        while ((m = re.exec(s)) && dati[c[0]] === undefined) {
          var pn = m.index + m[0].lastIndexOf(m[1]), qq = q.filter(function (x) { return Math.abs(x.pos - pn) <= 1; })[0];
          if (qq && qq.usato) continue;
          var v = parseFloat(m[1]), uc = unitaCampo(c[2]), qu = quantita(m[1] + ' ' + m[2])[0];
          if (uc && qu && qu.dim && qu.dim !== uc[0]) continue;
          if (uc && qu && qu.dim === uc[0]) v = converti(qu, uc);
          dati[c[0]] = v; origine[c[0]] = 'testo'; if (qq) qq.usato = true;
        }
      });
    });
    /* 2. quantita' con unita' compatibili, nell'ordine */
    modello.dati.forEach(function (c) {
      if (dati[c[0]] !== undefined || typeof c[3] !== 'number') return;
      var uc = unitaCampo(c[2]); if (!uc) return;
      for (var i = 0; i < q.length; i++) if (!q[i].usato && q[i].dim === uc[0]) { var v = converti(q[i], uc); if (v === null) continue; dati[c[0]] = v; origine[c[0]] = 'testo'; q[i].usato = true; break; }
    });
    /* percentuali nei campi adimensionali che sono frazioni (default < 1) */
    modello.dati.forEach(function (c) {
      if (dati[c[0]] !== undefined || typeof c[3] !== 'number' || unitaCampo(c[2]) || !(c[3] > 0 && c[3] < 1)) return;
      var x = q.filter(function (y) { return !y.usato && y.dim === 'pct'; })[0]; if (x) { dati[c[0]] = x.v / 100; origine[c[0]] = 'testo'; x.usato = true; }
    });
    /* 3. numeri senza unita' rimasti, ai campi numerici senza unita' rimasti */
    var liberi = q.filter(function (x) { return !x.usato && !x.dim; });
    modello.dati.forEach(function (c) {
      if (dati[c[0]] !== undefined || typeof c[3] !== 'number' || unitaCampo(c[2])) return;
      var x = liberi.shift(); if (x) { dati[c[0]] = x.v; origine[c[0]] = 'dedotto'; x.usato = true; }
    });
    if (RITOCCHI[modello.id]) RITOCCHI[modello.id](dati, origine, l, q);
    modello.dati.forEach(function (c) { if (dati[c[0]] === undefined) { dati[c[0]] = /0 se non|0: nessun|0 if not|0: none/.test(F.tt(c[1])) ? 0 : c[3]; origine[c[0]] = dati[c[0]] === 0 && c[3] !== 0 ? 'assente' : 'predefinito'; } });
    return { dati: dati, origine: origine };
  }

  /* ── il problema inverso ───────────────────────────────────────────────────
     «quanti grammi servono per…», «che pressione…»: la grandezza chiesta e' un DATO
     del modello e nel testo c'e' invece il valore di un RISULTATO. Si cerca il dato
     che riproduce quel risultato (secanti e bisezione su scala logaritmica). */
  var CHIESTO = [
    [/quant[io] gramm|che massa|quale massa|how many grams|what mass|massa necessaria/, ['M']],
    [/che pressione|quale pressione|what pressure|la pressione\?|pressione finale/, ['P']],
    [/che volume|quale volume|what volume|quanti (ml|litri)|volume necessario/, ['V']],
    [/che temperatura|quale temperatura|what temperature|a che t\b/, ['T', 'TC']],
    [/quanto tempo|dopo quanto|how long|in quanto tempo|tempo necessario/, ['t']],
    [/che concentrazione|quale concentrazione|what concentration|che molarita/, ['c']],
    [/quante moli|how many moles/, ['n']],
    [/che velocita|quale velocita|what speed|what velocity/, ['v']],
    [/che altezza|quale altezza|how high|da che altezza/, ['L']],
    [/che corrente|quale corrente|what current/, ['I']]
  ];
  function inverti(testo, modello, sorg, est) {
    var l = minuscolo(testo), dims = null;
    CHIESTO.forEach(function (c) { if (!dims && c[0].test(l)) dims = c[1]; });
    if (!dims) return null;
    var campo = modello.dati.filter(function (c) { var u = unitaCampo(c[2]); return typeof c[3] === 'number' && u && dims.indexOf(u[0]) >= 0 && est.origine[c[0]] !== 'testo'; })[0];
    if (!campo) return null;
    var base; try { base = sorg.risolvi(modello.id, est.dati); } catch (e) { return null; }
    /* il valore noto di un risultato: una quantita' del testo non usata con la stessa dimensione */
    var q = quantita(testo), usati = {}, bersaglio = null;
    modello.dati.forEach(function (c) { if (est.origine[c[0]] === 'testo' && typeof est.dati[c[0]] === 'number') usati[c[0]] = est.dati[c[0]]; });
    (base.risultati || []).some(function (r) {
      var ur = unitaCampo(r.u); if (!ur || typeof r.v !== 'number') return false;
      var x = q.filter(function (y) { if (y.dim !== ur[0]) return false; var v = converti(y, ur); return !modello.dati.some(function (c) { var uc = unitaCampo(c[2]); return uc && uc[0] === y.dim && est.origine[c[0]] === 'testo' && Math.abs(converti(y, uc) - est.dati[c[0]]) <= 1e-9 * Math.abs(est.dati[c[0]] || 1); }); })[0];
      if (x) { bersaglio = { nome: r.nome, u: r.u, v: converti(x, ur) }; return true; }
      return false;
    });
    if (!bersaglio) return null;
    function g(z) { var d = {}; for (var k in est.dati) d[k] = est.dati[k]; d[campo[0]] = z; try { var r = sorg.risolvi(modello.id, d).risultati.filter(function (y) { return y.nome === bersaglio.nome; })[0]; return r ? r.v - bersaglio.v : NaN; } catch (e) { return NaN; } }
    /* ricerca a griglia logaritmica di un cambio di segno, poi bisezione */
    var x0 = Math.abs(campo[3]) || 1, prec = null, a = null, b = null;
    for (var i = -60; i <= 60; i++) { var z = x0 * Math.pow(10, i / 6), v = g(z); if (!isFinite(v)) continue; if (prec && prec.v * v <= 0) { a = prec.z; b = z; break; } prec = { z: z, v: v }; }
    if (a === null) return null;
    var ga = g(a);
    for (var it = 0; it < 200; it++) { var m = (a + b) / 2, gm = g(m); if (ga * gm <= 0) b = m; else { a = m; ga = gm; } if (Math.abs(b - a) < 1e-12 * Math.abs(m)) break; }
    var sol = (a + b) / 2;
    est.dati[campo[0]] = sol; est.origine[campo[0]] = 'calcolato';
    return { campo: campo, valore: sol, bersaglio: bersaglio };
  }

  /* ── la risposta ───────────────────────────────────────────────────────── */
  function rispondi(testo, materia) {
    if (!String(testo).trim()) return null;
    var out = { domanda: testo };
    if (!materia || materia === 'matematica') {
      var mm = null; try { mm = matematica(testo); } catch (e) { mm = null; }
      if (mm) {
        out.materia = 'matematica'; out.tipo = mm.tipo; out.titolo = mm.titolo; out.capito = mm.capito;
        try { var r = mm.r(); out.passi = r.passi; out.risultato = r.risultato; } catch (e) { out.errore = e.message; }
        if (mm.tipo !== 'espressione' || materia === 'matematica') return out;
      }
      if (materia === 'matematica') return out.titolo ? out : null;
    }
    var cand = riordina(testo, scegliModello(testo, materia === 'matematica' ? null : materia));
    if (!cand.length) return out.titolo ? out : null;
    var best = cand[0].c, est = cand[0].est || estraiDati(testo, best.m), r2;
    out.materia = best.materia; out.tipo = best.m.id; out.titolo = F.tt(best.m.nome); out.dati = est; out.modello = best.m;
    out.alternative = cand.slice(1, 4).map(function (x) { return { id: x.c.m.id, nome: F.tt(x.c.m.nome), materia: x.c.materia }; });
    var inv = inverti(testo, best.m, best.sorg, est);
    try { r2 = best.sorg.risolvi(best.m.id, est.dati); out.passi = r2.passi; out.risultati = r2.risultati; out.testo = F.tt(r2.testo); } catch (e) { out.errore = e.message; }
    if (inv && out.passi) {
      var fmt = function (v) { return Math.abs(v) >= 1e-3 && Math.abs(v) < 1e5 ? String(+v.toPrecision(4)) : v.toExponential(3); };
      out.inverso = inv;
      out.passi.unshift({ titolo: t('Problema inverso', 'Inverse problem'), html: t('Si chiede ', 'The question asks for ') + '<b>' + esc(F.tt(inv.campo[1])) + '</b>' + t(', che nel modello è un dato; il testo fornisce invece ', ', which is an input of the model; the text gives instead ') + esc(inv.bersaglio.nome) + ' = ' + fmt(inv.bersaglio.v) + ' ' + esc(inv.bersaglio.u) + t('. Si risolve il modello all’indietro (bisezione): ', '. The model is solved backwards (bisection): ') + '<b>' + esc(F.tt(inv.campo[1])) + ' = ' + fmt(inv.valore) + ' ' + esc(inv.campo[2]) + '</b>' + t('. Lo svolgimento qui sotto, con questo valore, riproduce il dato del testo.', '. The working below, with this value, reproduces the given result.') });
      out.risultati = [{ nome: F.tt(inv.campo[1]), v: inv.valore, u: inv.campo[2] }].concat(out.risultati || []);
    }
    return out;
  }

  /* ── l'interfaccia: chat, catalogo, livelli ────────────────────────────── */
  var ESEMPI = {
    matematica: ['studia la funzione (x^2+1)/(x^2-1)', 'integra x*e^x da 0 a 1', 'limite di (sin(x)-x)/x^3 per x che tende a 0', 'deriva x^2*sin(3x)', "y'' - 3y' + 2y = e^x, y(0)=0, y'(0)=1", 'serie di n!/n^n', 'autovalori di [[2,1],[1,2]]', 'risolvi x^3 - 6x^2 + 11x - 6 = 0', 'taylor di e^x*sin(x) ordine 5', 'residui 1/(x^4+1)'],
    fisica: ['un proiettile è lanciato a 25 m/s con un angolo di 40°', 'un blocco di 5 kg su un piano inclinato di 30° con μ_s = 0,4 e μ_d = 0,3', 'due cariche di 3 μC e -5 μC a 0,2 m', 'un satellite in orbita circolare di raggio 6,771e6 m attorno a M = 5,972e24 kg', '2 mol di gas biatomico scaldate a pressione costante da 300 K a 400 K', 'effetto fotoelettrico con luce di 250 nm e lavoro di estrazione 4,3 eV', 'una stella di 9940 K con raggio 1,71 R☉', 'energia di legame del nucleo con Z = 26, A = 56, massa 55,934936 u'],
    chimica: ['calcola il pH di una soluzione 0,1 M di acido acetico con Ka = 1,8e-5', 'Al + Cl2 -> AlCl3 con Al: 10 g e Cl2: 30 g, reagente limitante', 'massa molare di Ca3(PO4)2 e moli in 10 g', 'solubilità di AgCl con Ksp = 1,8e-10', 'pila con E° catodo 0,34 V e anodo -0,76 V, n = 2', 'titolazione di 25 mL di acido debole 0,1 M (Ka = 1,8e-5) con NaOH 0,1 M dopo 12,5 mL', 'punto isoelettrico di un amminoacido con pKa 2,19, 9,67, 4,25', 'gradi di insaturazione di C8H9NO2']
  };
  var CATEGORIE = { chimica: ['0', '1', '2', '3', '4'], fisica: ['7'], matematica: ['8'] };
  var EXTRA = { chimica: ['slab3d', 'schiesame', 'scristalli', 'selettrodi', 'sfotosup', 'shf', 'sdinmol', 'stermostat', 'srotovib', 'snucleare'], fisica: ['sqm', 'sconst', 'scfgraf', 'scft', 'smatchim'], matematica: ['slab3d', 'sdistrib', 'scalc', 'scalcav', 'sdatasci', 'smatchim', 'scfgraf'] };
  function strumenti(materia) {
    var visti = {}, out = [];
    CATEGORIE[materia].forEach(function (g) { var pan = document.getElementById('navGroup' + g); if (!pan) return; var tab = document.querySelector('.nav-group-tab[data-group="' + g + '"]'); [].forEach.call(pan.querySelectorAll('.nav-btn[data-s]'), function (b) { var id = b.getAttribute('data-s'); if (visti[id]) return; visti[id] = 1; out.push({ id: id, nome: b.textContent.trim(), gruppo: tab ? tab.textContent.trim() : '' }); }); });
    EXTRA[materia].forEach(function (id) { if (visti[id]) return; var b = document.querySelector('.nav-btn[data-s="' + id + '"]'); if (!b) return; visti[id] = 1; out.push({ id: id, nome: b.textContent.trim(), gruppo: t('collegati', 'related') }); });
    return out;
  }
  function apriSezione(id) {
    var b = document.querySelector('.nav-btn[data-s="' + id + '"]');
    if (!b) return;
    var pan = b.closest('.nav-group-panel'), idx = pan ? [].indexOf.call(document.querySelectorAll('.nav-group-panel'), pan) : -1;
    if (idx >= 0 && typeof globale.switchNavGroup === 'function') globale.switchNavGroup(idx);
    b.click();
  }
  function apriNelRisolutore(materia, id) {
    var sez = materia === 'fisica' ? 'sfisesame' : 'schiesame';
    apriSezione(sez);
    setTimeout(function () { var bt = document.querySelectorAll('#' + sez + ' .bsiFX-schede button')[1]; if (bt) bt.click(); setTimeout(function () { var sel = document.querySelector('#' + sez + ' [role=tabpanel]:not([style*="none"]) select'); if (sel) { sel.value = id; sel.dispatchEvent(new Event('change')); } }, 150); }, 300);
  }
  function chiediSpectra(testo) {
    if (typeof globale.bsiOpenAIHub !== 'function') return false;
    globale.bsiOpenAIHub('chat');
    setTimeout(function () { var i = document.getElementById('bsi-hub-input'); if (i) { i.value = testo; i.dispatchEvent(new Event('input')); i.focus(); } }, 300);
    return true;
  }
  function disegnaRisposta(r, materia) {
    var box = F.el('div', { 'class': 'bsiFX-pannello', style: 'margin:10px 0' });
    box.appendChild(F.el('div', { style: 'color:#9fb1c6;font-size:.82rem', testo: '🙋 ' + r.domanda }));
    if (!r.titolo) {
      box.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Non ho riconosciuto il tipo di esercizio. Prova a riformulare con una parola chiave (deriva, integra, limite, studia, serie, pH, piano inclinato, orbita…) o apri uno strumento qui sotto.', 'I did not recognise the kind of exercise. Rephrase with a keyword (differentiate, integrate, limit, analyse, series, pH, incline, orbit…) or open a tool below.') }));
      var bS = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: t('Chiedi a Spectra (intelligenza artificiale) →', 'Ask Spectra (AI) →'), onclick: function () { chiediSpectra(r.domanda); } });
      box.appendChild(bS); return box;
    }
    box.appendChild(F.el('div', { html: '<b style="color:#5eead4">🧠 ' + esc(r.titolo) + '</b>' + (r.capito ? ' — ' + t('ho capito: ', 'I understood: ') + r.capito : '') }));
    if (r.dati) {
      var righe = r.modello.dati.map(function (c) { var o = r.dati.origine[c[0]], col = o === 'testo' || o === 'calcolato' ? '#5eead4' : o === 'dedotto' || o === 'assente' ? '#ffd24a' : '#ff8a80'; return '<tr><td>' + esc(F.tt(c[1])) + (c[2] && typeof c[2] === 'string' ? ' (' + esc(c[2]) + ')' : '') + '</td><td class="bsiFX-num">' + esc(String(typeof r.dati.dati[c[0]] === 'number' ? +r.dati.dati[c[0]].toPrecision(6) : r.dati.dati[c[0]])) + '</td><td style="color:' + col + ';font-size:.78rem">' + (o === 'testo' ? t('dal testo', 'from text') : o === 'dedotto' ? t('dedotto', 'inferred') : o === 'assente' ? t('non dato: 0', 'not given: 0') : o === 'calcolato' ? t('ricavato (inverso)', 'solved for (inverse)') : t('supposto: verifica', 'assumed: check')) + '</td></tr>'; }).join('');
      var dett = F.el('details', { style: 'margin:6px 0' }); dett.appendChild(F.el('summary', { style: 'cursor:pointer;color:#9fb1c6;font-size:.84rem', testo: t('Dati usati', 'Data used') })); dett.appendChild(F.el('table', { 'class': 'bsiFX-tab', style: 'width:auto', html: righe })); box.appendChild(dett);
      if (r.modello.dati.some(function (c) { return r.dati.origine[c[0]] === 'predefinito'; })) dett.open = true;
    }
    if (r.errore) box.appendChild(F.el('div', { 'class': 'bsiFX-nota bsiFX-ko', testo: '⚠ ' + r.errore }));
    if (r.passi) { var ol = F.el('ol', { style: 'margin:6px 0 0 0;padding-left:20px' }); r.passi.forEach(function (p) { ol.appendChild(F.el('li', { style: 'margin:6px 0', html: '<b style="color:#5eead4">' + esc(p.titolo) + '</b><div style="margin-top:2px;line-height:1.6">' + p.html + '</div>' })); }); box.appendChild(ol); }
    if (r.risultati) box.appendChild(F.el('div', { 'class': 'bsiFX-eq', style: 'font-family:inherit', html: '<b>' + t('Risultati: ', 'Results: ') + '</b>' + r.risultati.map(function (x) { return esc(x.nome) + ' = ' + (typeof x.v === 'number' ? (Math.abs(x.v) >= 1e-3 && Math.abs(x.v) < 1e5 || x.v === 0 ? +x.v.toPrecision(4) : x.v.toExponential(3)) : x.v) + ' ' + esc(x.u || ''); }).join(' · ') }));
    else if (r.risultato) box.appendChild(F.el('div', { 'class': 'bsiFX-eq', html: '<b>' + t('Risultato: ', 'Result: ') + '</b>' + esc(r.risultato) }));
    var az = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px' });
    if (r.modello) az.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: t('Correggi i dati nel risolutore →', 'Edit the data in the solver →'), onclick: function () { apriNelRisolutore(r.materia, r.tipo); } }));
    (r.alternative || []).forEach(function (a) { az.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', style: 'opacity:.8', testo: t('Intendevi: ', 'Did you mean: ') + a.nome + '?', onclick: function () { var cat = catalogo(a.materia).filter(function (x) { return x.m.id === a.id; })[0]; var est = estraiDati(r.domanda, cat.m), rr; var nuova = { domanda: r.domanda, materia: a.materia, tipo: a.id, titolo: a.nome, dati: est, modello: cat.m }; try { rr = cat.sorg.risolvi(a.id, est.dati); nuova.passi = rr.passi; nuova.risultati = rr.risultati; } catch (e) { nuova.errore = e.message; } box.parentNode.insertBefore(disegnaRisposta(nuova, materia), box); box.remove(); } })); });
    az.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', style: 'opacity:.8', testo: t('Chiedi a Spectra →', 'Ask Spectra →'), onclick: function () { chiediSpectra(r.domanda); } }));
    box.appendChild(az);
    return box;
  }
  function schedaAssistente(materia) {
    return function (div) {
      var pan = F.el('div', { 'class': 'bsiFX-pannello' }); div.appendChild(pan);
      pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Scrivi la domanda come la scriveresti al professore. L’assistente riconosce il tipo di esercizio, legge i dati (numeri con le unità, formule, reazioni, espressioni) e risponde con lo <b>svolgimento completo</b>. Funziona senza rete; con un fornitore di IA configurato puoi passare la domanda a Spectra.', 'Write the question as you would to your teacher. The assistant recognises the kind of exercise, reads the data (numbers with units, formulas, reactions, expressions) and answers with the <b>full working</b>. Works offline; with an AI provider configured you can pass the question to Spectra.') }));
      var ta = F.el('textarea', { rows: 3, 'aria-label': t('domanda', 'question'), placeholder: ESEMPI[materia][0], style: 'width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:8px;padding:8px;font-family:inherit;font-size:.95rem' });
      pan.appendChild(ta);
      var risposte = F.el('div');
      function invia() { var q = ta.value.trim(); if (!q) return; var r = rispondi(q, materia); risposte.insertBefore(disegnaRisposta(r || { domanda: q }, materia), risposte.firstChild); }
      F.bottone(pan, ['Risolvi e spiega', 'Solve and explain'], invia);
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); invia(); } });
      var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
      ESEMPI[materia].forEach(function (q) { es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', style: 'font-weight:600;font-size:.76rem', testo: q, onclick: function () { ta.value = q; invia(); } })); });
      div.appendChild(risposte);
    };
  }
  function schedaStrumenti(materia) {
    return function (div) {
      var cerca = F.el('input', { type: 'text', placeholder: t('cerca uno strumento…', 'search a tool…'), 'aria-label': t('cerca', 'search') });
      div.appendChild(cerca);
      var cont = F.el('div'); div.appendChild(cont);
      function disegna() {
        cont.innerHTML = '';
        var q = minuscolo(cerca.value), gruppi = {};
        strumenti(materia).forEach(function (s) { if (q && minuscolo(s.nome).indexOf(q) < 0) return; (gruppi[s.gruppo] = gruppi[s.gruppo] || []).push(s); });
        Object.keys(gruppi).forEach(function (g) {
          cont.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1rem;margin-top:10px', testo: g }));
          var r = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' });
          gruppi[g].forEach(function (s) { r.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: s.nome, onclick: function () { apriSezione(s.id); } })); });
          cont.appendChild(r);
        });
        var n = strumenti(materia).length;
        cont.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: n + t(' strumenti in quest’area, più i risolutori dell’assistente: ', ' tools in this area, plus the assistant’s solvers: ') + (materia === 'matematica' ? Object.keys(RS()).length + t(' tipi di esercizio', ' exercise types') : (materia === 'fisica' ? F.calcolo.esameFisica.MODELLI.length : F.calcolo.esameChimica.MODELLI.length) + t(' modelli di problema', ' problem models')) }));
      }
      cerca.addEventListener('input', disegna); disegna();
    };
  }
  function schedaLivelli(materia) {
    return function (div) {
      var P = F.calcolo.percorsi; if (!P) { div.textContent = '—'; return; }
      var LIV = [['🏫 Scuola superiore', '🏫 High school'], ['🎓 Laurea triennale', '🎓 Bachelor’s degree'], ['🔬 Laurea magistrale', '🔬 Master’s degree'], ['🧪 Dottorato di ricerca', '🧪 PhD']];
      P.MAPPA[materia].forEach(function (L, i) {
        var p = F.el('div', { 'class': 'bsiFX-pannello', style: 'margin:8px 0' });
        p.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1.02rem', testo: F.tt(LIV[i]) }));
        p.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: F.tt(L.cosa) }));
        var r = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' });
        L.sez.forEach(function (id) { var b = document.querySelector('.nav-btn[data-s="' + id + '"]'); if (!b) return; r.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: b.textContent.trim() + ' →', onclick: function () { apriSezione(id); } })); });
        p.appendChild(r); div.appendChild(p);
      });
    };
  }

  F.calcolo.assistente = { rispondi: rispondi, quantita: quantita, scegliModello: scegliModello, estraiDati: estraiDati, matematica: matematica, normalizza: normalizza, ESEMPI: ESEMPI };
  globale.BSIAssistente = F.calcolo.assistente;

  var AREE = [
    ['sareachim', 'chimica', ['⚗️ Area Chimica', '⚗️ Chemistry area'], ['Tutta la chimica dell’app in un posto: un assistente a cui chiedere qualunque problema numerico (dalla stechiometria alla teoria di Marcus) con lo svolgimento, tutti gli strumenti di chimica generale, organica, analitica, fisica, inorganica, spettroscopia, biochimica e farmacologia, e il percorso dalle superiori al dottorato.', 'All the chemistry in the app in one place: an assistant for any numerical problem (from stoichiometry to Marcus theory) with full working, every tool for general, organic, analytical, physical and inorganic chemistry, spectroscopy, biochemistry and pharmacology, and the path from high school to PhD.']],
    ['sareafis', 'fisica', ['⚛️ Area Fisica', '⚛️ Physics area'], ['Tutta la fisica dell’app: l’assistente che risolve problemi di meccanica, termodinamica, elettromagnetismo, ottica, onde, fisica moderna, astrofisica, nucleare e quantistica, le simulazioni (Schrödinger, Hartree-Fock, dinamica molecolare, cristalli) e il percorso per livelli.', 'All the physics in the app: the assistant solving problems in mechanics, thermodynamics, electromagnetism, optics, waves, modern physics, astrophysics, nuclear and quantum physics, the simulations (Schrödinger, Hartree-Fock, molecular dynamics, crystals) and the path by level.']],
    ['sareamat', 'matematica', ['📐 Area Matematica', '📐 Mathematics area'], ['Tutta la matematica dell’app: l’assistente con il motore simbolico (limiti, derivate, integrali, studi di funzione, serie, equazioni differenziali, algebra lineare, residui, Fourier, Laplace, EDP) che scrive lo svolgimento, tutti gli strumenti e il percorso dalle superiori al dottorato.', 'All the mathematics in the app: the assistant with the symbolic engine (limits, derivatives, integrals, function analysis, series, differential equations, linear algebra, residues, Fourier, Laplace, PDEs) writing the full working, every tool and the path from high school to PhD.']]
  ];
  AREE.forEach(function (A) {
    F.sezione(A[0], { titolo: A[2], sotto: A[3], schede: [
      { nome: ['🤖 Assistente', '🤖 Assistant'], costruisci: schedaAssistente(A[1]) },
      { nome: ['🗂️ Tutti gli strumenti', '🗂️ All tools'], costruisci: schedaStrumenti(A[1]) },
      { nome: ['🧭 Livelli', '🧭 Levels'], costruisci: schedaLivelli(A[1]) }
    ] });
  });
})(typeof window !== 'undefined' ? window : globalThis);
