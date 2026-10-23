/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-esame.js — 🎓 l'esame di Istituzioni di Matematiche I e II
   BioSpecInfo · © Samuele Pio Provenzano

   I programmi del corso di laurea in Chimica dell'Universita' di Bari
   (schede degli insegnamenti pubblicate su uniba.it), argomento per
   argomento, con:

   · PROGRAMMA: che cos'e', come si risolve, le formule chiave, e un
     pulsante che apre l'esercizio tipico nel risolutore;
   · RISOLUTORE: si sceglie il tipo di esercizio, si scrivono i dati, e lo
     svolgimento arriva passo per passo (bsi-mat-risolutore.js);
   · APPELLI SVOLTI: tracce nello stile della prova scritta, ciascuna con
     lo svolgimento completo calcolato dal risolutore;
   · SIMULAZIONE: un appello estratto a caso, con il tempo, e le soluzioni
     solo alla fine.

   Le tracce sono costruite sui programmi: NON sono i testi ufficiali degli
   appelli (che il sito dell'universita' non pubblica in forma accessibile
   da qui), e la sezione lo dichiara.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function H(s) { try { return C.html(C.leggi(String(s))); } catch (e) { return esc(s); } }
  function RS() { return F.calcolo.risolutore.RISOLUTORI; }
  /* tra parentesi se e' una somma o una frazione */
  function P(s) { var h = H(s), txt; try { txt = C.stampa(C.leggi(String(s))); } catch (e) { txt = String(s); } return /[\s/]/.test(txt) ? '(' + h + ')' : h; }
  function polinomioTxt(coef, v) { var e = C.leggi(coef.map(function (c, i) { return '(' + c + ')*' + v + '^' + (coef.length - 1 - i); }).join('+')); return C.html(e); }

  /* ── i tipi di esercizio: campi, enunciato, esecuzione ────────────────── */
  var TIPI = {
    complessi: { nome: ['Numeri complessi', 'Complex numbers'], corso: 'I', campi: [['modo', ['tipo: forma | radici | eq2', 'kind: forma | radici | eq2'], 'radici'], ['z', ['z (per «forma»)', 'z (for «forma»)'], '1+i'], ['n', ['n (potenza o indice della radice)', 'n (power or root index)'], '3'], ['w', ['w (per «radici»: zⁿ = w)', 'w (for «radici»: zⁿ = w)'], '8i'], ['abc', ['a, b, c (per «eq2»: az² + bz + c = 0)', 'a, b, c (for «eq2»: az² + bz + c = 0)'], '1, 2, 5']],
      enunciato: function (v) { return v.modo === 'forma' ? t('Scrivere in forma trigonometrica ed esponenziale z = ', 'Write in trigonometric and exponential form z = ') + esc(v.z) + (v.n ? t(' e calcolarne la potenza ', ' and compute its power ') + v.n + t('-esima', 'th') : '') : v.modo === 'radici' ? t('Risolvere in ℂ l’equazione z', 'Solve in ℂ the equation z') + '<sup>' + v.n + '</sup> = ' + esc(v.w) : t('Risolvere in ℂ: ', 'Solve in ℂ: ') + polinomioTxt(v.abc.split(','), 'z') + ' = 0'; },
      esegui: function (v) { if (v.modo === 'forma') return RS().complessi({ tipo: 'forma', z: v.z, n: +v.n || 0 }); if (v.modo === 'radici') return RS().complessi({ tipo: 'radici', n: +v.n, w: v.w }); var q = v.abc.split(',').map(function (s) { return C.valuta(C.leggi(s)); }); return RS().complessi({ tipo: 'eq2', a: q[0], b: q[1], c: q[2] }); } },
    dominio: { nome: ['Dominio', 'Domain'], corso: 'I', campi: [['f', 'f(x)', 'sqrt((x-1)/(x+2))']], enunciato: function (v) { return t('Determinare il dominio di f(x) = ', 'Find the domain of f(x) = ') + H(v.f); }, esegui: function (v) { return RS().dominio(v.f); } },
    limite: { nome: ['Limite', 'Limit'], corso: 'I', campi: [['f', 'f(x)', '(sin(x)-x)/x^3'], ['x0', ['x tende a (numero, inf, -inf)', 'x tends to (number, inf, -inf)'], '0']], enunciato: function (v) { return t('Calcolare ', 'Compute ') + 'lim<sub>x→' + esc(v.x0).replace(/-?inf/, function (s) { return s.charAt(0) === '-' ? '−∞' : '+∞'; }) + '</sub> ' + H(v.f); }, esegui: function (v) { return RS().limite(v.f, v.x0); } },
    studio: { nome: ['Studio di funzione', 'Function analysis'], corso: 'I', campi: [['f', 'f(x)', '(x^2+1)/(x^2-1)']], enunciato: function (v) { return t('Studiare la funzione f(x) = ', 'Analyse the function f(x) = ') + H(v.f) + t(' e tracciarne il grafico.', ' and sketch its graph.'); }, esegui: function (v) { return RS().studio(v.f); }, grafico: 'studio' },
    integraleIndefinito: { nome: ['Integrale indefinito', 'Indefinite integral'], corso: 'I', campi: [['f', 'f(x)', '(x+3)/(x^2-x-2)']], enunciato: function (v) { return t('Calcolare ', 'Compute ') + '∫ ' + H(v.f) + ' dx'; }, esegui: function (v) { return RS().integraleIndefinito(v.f); } },
    integraleDefinito: { nome: ['Integrale definito / improprio', 'Definite / improper integral'], corso: 'I', campi: [['f', 'f(x)', 'x*e^(-x)'], ['a', 'a', '0'], ['b', 'b', 'inf']], enunciato: function (v) { return t('Calcolare (studiandone la convergenza se improprio) ', 'Compute (studying convergence if improper) ') + '∫<sub>' + esc(v.a).replace(/-?inf/, '∞') + '</sub><sup>' + esc(v.b).replace('-inf', '−∞').replace('inf', '+∞') + '</sup> ' + H(v.f) + ' dx'; }, esegui: function (v) { return RS().integraleDefinito(v.f, v.a, v.b); }, grafico: 'area' },
    taylor: { nome: ['Polinomio di Taylor', 'Taylor polynomial'], corso: 'I', campi: [['f', 'f(x)', 'e^x*sin(x)'], ['x0', 'x₀', '0'], ['n', ['ordine n', 'order n'], '5']], enunciato: function (v) { return t('Scrivere il polinomio di Taylor di ordine ', 'Write the Taylor polynomial of order ') + v.n + t(' di f(x) = ', ' of f(x) = ') + H(v.f) + t(' centrato in x₀ = ', ' centred at x₀ = ') + esc(v.x0); }, esegui: function (v) { return RS().taylor(v.f, v.x0, +v.n); } },
    serieNumerica: { nome: ['Serie numerica', 'Numerical series'], corso: 'II', campi: [['an', 'aₙ', 'n!/n^n'], ['n0', ['indice iniziale', 'starting index'], '1']], enunciato: function (v) { return t('Studiare il carattere della serie ', 'Study the character of the series ') + 'Σ<sub>n=' + v.n0 + '</sub><sup>∞</sup> ' + H(v.an); }, esegui: function (v) { return RS().serieNumerica(v.an, +v.n0); }, grafico: 'somme' },
    seriePotenze: { nome: ['Serie di potenze', 'Power series'], corso: 'II', campi: [['cn', 'cₙ', '1/(n*3^n)'], ['x0', 'x₀', '0']], enunciato: function (v) { return t('Determinare l’insieme di convergenza della serie ', 'Find the convergence set of ') + 'Σ ' + P(v.cn) + '·' + (+v.x0 === 0 ? 'x' : '(x − ' + esc(v.x0) + ')') + '<sup>n</sup>'; }, esegui: function (v) { return RS().seriePotenze(v.cn, v.x0); } },
    dueVariabili: { nome: ['Funzioni di due variabili', 'Functions of two variables'], corso: 'II', campi: [['f', 'f(x, y)', 'x^3-3x*y+y^3'], ['P', ['punto (x₀, y₀)', 'point (x₀, y₀)'], '1, 2'], ['v', ['direzione v', 'direction v'], '3, 4']], enunciato: function (v) { return t('Data f(x, y) = ', 'Given f(x, y) = ') + H(v.f) + t(': gradiente, piano tangente e derivata direzionale in (', ': gradient, tangent plane and directional derivative at (') + esc(v.P) + t(') lungo v = (', ') along v = (') + esc(v.v) + t('); punti critici e loro natura.', '); critical points and their nature.'); },
      esegui: function (v) { var p = v.P.split(',').map(function (s) { return C.valuta(C.leggi(s)); }), d = v.v.split(',').map(function (s) { return C.valuta(C.leggi(s)); }); return RS().dueVariabili(v.f, p, d); } },
    maxMinCompatto: { nome: ['Massimi e minimi assoluti', 'Absolute extrema'], corso: 'II', campi: [['f', 'f(x, y)', 'x^2+y^2-2x'], ['dom', ['dominio: rettangolo a,b,c,d | disco cx,cy,r | triangolo x1,y1,x2,y2,x3,y3', 'domain: rettangolo a,b,c,d | disco cx,cy,r | triangolo x1,y1,x2,y2,x3,y3'], 'rettangolo 0,2,-1,1']],
      enunciato: function (v) { return t('Determinare massimo e minimo assoluti di f(x, y) = ', 'Find the absolute maximum and minimum of f(x, y) = ') + H(v.f) + t(' su ', ' on ') + esc(v.dom); },
      esegui: function (v) { var m = /^(\w+)\s+(.*)$/.exec(v.dom.trim()), q = m[2].split(',').map(function (s) { return C.valuta(C.leggi(s)); }), d; if (m[1] === 'rettangolo') d = { tipo: 'rettangolo', a: q[0], b: q[1], c: q[2], d: q[3] }; else if (m[1] === 'disco') d = { tipo: 'disco', cx: q[0], cy: q[1], r: q[2] }; else d = { tipo: 'triangolo', v: [[q[0], q[1]], [q[2], q[3]], [q[4], q[5]]] }; return RS().maxMinCompatto(v.f, d); } },
    integraleDoppio: { nome: ['Integrale doppio', 'Double integral'], corso: 'II', campi: [['f', 'f(x, y)', 'x*y'], ['tipo', ['dominio normale rispetto a: x | y | polari', 'normal domain with respect to: x | y | polari'], 'x'], ['ab', ['estremi esterni a, b', 'outer limits a, b'], '0, 1'], ['g1', ['estremo interno inferiore', 'inner lower limit'], 'x^2'], ['g2', ['estremo interno superiore', 'inner upper limit'], 'x']],
      enunciato: function (v) { var ab = v.ab.split(','); return t('Calcolare ', 'Compute ') + '∬<sub>D</sub> ' + H(v.f) + ' dx dy, D = {' + (v.tipo === 'polari' ? esc(ab[0]) + ' ≤ θ ≤ ' + esc(ab[1]) + ', ' + H(v.g1) + ' ≤ r ≤ ' + H(v.g2) : v.tipo === 'y' ? esc(ab[0]) + ' ≤ y ≤ ' + esc(ab[1]) + ', ' + H(v.g1) + ' ≤ x ≤ ' + H(v.g2) : esc(ab[0]) + ' ≤ x ≤ ' + esc(ab[1]) + ', ' + H(v.g1) + ' ≤ y ≤ ' + H(v.g2)) + '}'; },
      esegui: function (v) { var ab = v.ab.split(','); return RS().integraleDoppio({ f: v.f, tipo: v.tipo.trim(), a: ab[0], b: ab[1], g1: v.g1, g2: v.g2 }); } },
    formeDifferenziali: { nome: ['Forme differenziali', 'Differential forms'], corso: 'II', campi: [['M', 'M(x, y)', '2x*y+1'], ['N', 'N(x, y)', 'x^2+3y^2'], ['curva', ['curva x(t), y(t)', 'curve x(t), y(t)'], 't, t^2'], ['tt', ['t da, a', 't from, to'], '0, 1']],
      enunciato: function (v) { return t('Stabilire se ω = ', 'Determine whether ω = ') + P(v.M) + ' dx + ' + P(v.N) + t(' dy è esatta, trovarne un potenziale e calcolarne l’integrale lungo γ(t) = (', ' dy is exact, find a potential and compute its integral along γ(t) = (') + esc(v.curva) + '), t ∈ [' + esc(v.tt) + ']'; },
      esegui: function (v) { var c = v.curva.split(','), tt = v.tt.split(','); return RS().formeDifferenziali({ M: v.M, N: v.N, xt: c[0], yt: c[1], t0: tt[0], t1: tt[1] }); } },
    lineare1: { nome: ['EDO lineare del 1° ordine', 'First-order linear ODE'], corso: 'II', campi: [['a', 'a(x)', '2'], ['b', 'b(x)', 'e^x'], ['ci', ['dato iniziale x₀, y₀ (vuoto: integrale generale)', 'initial datum x₀, y₀ (empty: general solution)'], '0, 1']],
      enunciato: function (v) { return t('Risolvere ', 'Solve ') + "y′ + " + P(v.a) + '·y = ' + H(v.b) + (v.ci.trim() ? t(' con y(', ' with y(') + esc(v.ci.split(',')[0]) + ') = ' + esc(v.ci.split(',')[1]) : ''); },
      esegui: function (v) { var ci = v.ci.trim() ? v.ci.split(',') : null; return RS().lineare1({ a: v.a, b: v.b, x0: ci ? ci[0] : null, y0: ci ? ci[1] : null }); }, grafico: 'edo1' },
    separabile: { nome: ['EDO a variabili separabili', 'Separable ODE'], corso: 'II', campi: [['g', 'g(x)', 'x'], ['h', 'h(y)', 'y'], ['ci', ['dato iniziale x₀, y₀', 'initial datum x₀, y₀'], '0, 2']],
      enunciato: function (v) { return t('Risolvere il problema di Cauchy ', 'Solve the Cauchy problem ') + "y′ = " + (v.g.trim() === '1' ? '' : P(v.g) + '·') + P(v.h) + (v.ci.trim() ? ', y(' + esc(v.ci.split(',')[0]) + ') = ' + esc(v.ci.split(',')[1]) : ''); },
      esegui: function (v) { var ci = v.ci.trim() ? v.ci.split(',') : null; return RS().separabile({ g: v.g, h: v.h, x0: ci ? ci[0] : null, y0: ci ? ci[1] : null }); } },
    secondoOrdine: { nome: ['EDO del 2° ordine a coefficienti costanti', 'Second-order constant-coefficient ODE'], corso: 'II', campi: [['abc', ['a, b, c (ay″ + by′ + cy)', 'a, b, c (ay″ + by′ + cy)'], '1, -3, 2'], ['f', ['termine noto f(x)', 'forcing term f(x)'], 'e^x'], ['ci', ['Cauchy x₀, y(x₀), y′(x₀) (vuoto: generale)', 'Cauchy x₀, y(x₀), y′(x₀) (empty: general)'], '0, 0, 1']],
      enunciato: function (v) { var q = v.abc.split(','); return t('Risolvere ', 'Solve ') + F.calcolo.risolutore.edoTxt(q.map(function (z) { return C.valuta(C.leggi(z)); })) + ' = ' + H(v.f) + (v.ci.trim() ? t(' con y(', ' with y(') + esc(v.ci.split(',')[0]) + ') = ' + esc(v.ci.split(',')[1]) + ", y′(" + esc(v.ci.split(',')[0]) + ') = ' + esc(v.ci.split(',')[2]) : ''); },
      esegui: function (v) { var q = v.abc.split(',').map(function (s) { return C.valuta(C.leggi(s)); }), ci = v.ci.trim() ? v.ci.split(',') : null; return RS().secondoOrdine({ a: q[0], b: q[1], c: q[2], f: v.f, x0: ci ? ci[0] : null, y0: ci ? ci[1] : null, y1: ci ? ci[2] : null }); }, grafico: 'edo2' },
    autovalori: { nome: ['Autovalori e diagonalizzazione', 'Eigenvalues and diagonalisation'], corso: 'A', campi: [['M', ['matrice (righe separate da ;)', 'matrix (rows separated by ;)'], '2 -1 0; -1 2 -1; 0 -1 2']],
      enunciato: function (v) { return t('Trovare autovalori e autovettori di A = [', 'Find the eigenvalues and eigenvectors of A = [') + esc(v.M) + t('] e dire se è diagonalizzabile.', '] and say whether it is diagonalisable.'); }, esegui: function (v) { return RS().autovalori(v.M.replace(/;/g, '\n')); } },
    sistemaEDO: { nome: ['Sistemi di EDO lineari', 'Linear ODE systems'], corso: 'A', campi: [['A', ['matrice a, b, c, d (x′ = ax + by, y′ = cx + dy)', 'matrix a, b, c, d (x′ = ax + by, y′ = cx + dy)'], '1, 2, 2, 1'], ['X0', ['dato iniziale x(0), y(0)', 'initial datum x(0), y(0)'], '1, 0']],
      enunciato: function (v) { var q = v.A.split(',').map(function (z) { return C.valuta(C.leggi(z)); }), L = F.calcolo.risolutore.lin2; return t('Risolvere il sistema ', 'Solve the system ') + "x′ = " + L(q[0], q[1]) + ", y′ = " + L(q[2], q[3]) + ' ' + t('con', 'with') + ' (x(0), y(0)) = (' + esc(v.X0) + t(') e classificare l’origine.', ') and classify the origin.'); },
      esegui: function (v) { var q = v.A.split(',').map(function (z) { return C.valuta(C.leggi(z)); }), x = v.X0.split(',').map(function (z) { return C.valuta(C.leggi(z)); }); return RS().sistemaEDO({ a: q[0], b: q[1], c: q[2], d: q[3], x0: x[0], y0: x[1] }); } },
    fourier: { nome: ['Serie di Fourier', 'Fourier series'], corso: 'A', campi: [['f', ['f(x) su [−π, π]', 'f(x) on [−π, π]'], 'x'], ['N', ['armoniche', 'harmonics'], '5']],
      enunciato: function (v) { return t('Sviluppare in serie di Fourier la funzione 2π-periodica che su [−π, π] vale f(x) = ', 'Expand in Fourier series the 2π-periodic function equal on [−π, π] to f(x) = ') + H(v.f) + '.'; }, esegui: function (v) { return RS().fourier(v.f, +v.N || 5); } },
    laplace: { nome: ['Trasformata di Laplace', 'Laplace transform'], corso: 'A', campi: [['f', 'f(t)', 't*e^(-t)']],
      enunciato: function (v) { return t('Calcolare la trasformata di Laplace di f(t) = ', 'Compute the Laplace transform of f(t) = ') + H(v.f) + '.'; }, esegui: function (v) { return RS().laplace(v.f); } },
    integraleTriplo: { nome: ['Integrale triplo', 'Triple integral'], corso: 'A', campi: [['f', 'f(x, y, z)', 'x^2+y^2+z^2'], ['tipo', ['coordinate: cartesiane | cilindriche | sferiche', 'coordinates: cartesiane | cilindriche | sferiche'], 'sferiche'], ['lim', ['estremi (ρ,φ,θ / r,θ,z / x,y,z) separati da ;', 'limits (ρ,φ,θ / r,θ,z / x,y,z) separated by ;'], '0,1; 0,pi; 0,2*pi']],
      enunciato: function (v) { return t('Calcolare ', 'Compute ') + '∭ ' + H(v.f) + ' dV ' + t('in coordinate ', 'in coordinates ') + esc(v.tipo) + ', ' + t('estremi ', 'limits ') + esc(v.lim) + '.'; }, esegui: function (v) { return RS().integraleTriplo({ f: v.f, tipo: v.tipo.trim(), lim: v.lim }); } },
    residui: { nome: ['Integrali con i residui', 'Integrals by residues'], corso: 'D', campi: [['f', ['f(x) razionale', 'rational f(x)'], '1/(x^4+1)']],
      enunciato: function (v) { return t('Calcolare con il teorema dei residui ', 'Use the residue theorem to compute ') + '∫₋∞^∞ ' + H(v.f) + ' dx.'; }, esegui: function (v) { return RS().residui(v.f); } },
    calore: { nome: ['Equazione del calore (EDP)', 'Heat equation (PDE)'], corso: 'D', campi: [['f', ['dato iniziale f(x)', 'initial datum f(x)'], 'x*(pi-x)'], ['L', 'L', 'pi'], ['alfa', 'α', '1'], ['x', 'x', '1'], ['t', 't', '0.5']],
      enunciato: function (v) { return t('Risolvere u_t = ', 'Solve u_t = ') + esc(v.alfa) + ' u_xx ' + t('su [0, ', 'on [0, ') + esc(v.L) + t('] con estremi a zero e u(x, 0) = ', '] with zero ends and u(x, 0) = ') + H(v.f) + t('; calcolare u(', '; compute u(') + esc(v.x) + ', ' + esc(v.t) + ').'; },
      esegui: function (v) { return RS().calore({ f: v.f, L: v.L, alfa: C.valuta(C.leggi(v.alfa)), x: C.valuta(C.leggi(v.x)), t: C.valuta(C.leggi(v.t)) }); } }
  };

  /* ── il programma, argomento per argomento ────────────────────────────── */
  var PROGRAMMA = {
    I: [
      { tit: ['Numeri reali, funzioni elementari, induzione', 'Real numbers, elementary functions, induction'], tipo: 'dominio',
        it: 'Insiemi numerici, estremo superiore e inferiore (assioma di completezza), potenze, radicali, logaritmi; funzioni iniettive, suriettive, inverse; il principio di induzione. All’esame servono soprattutto per il <b>dominio</b>: ogni funzione elementare ha le sue condizioni di esistenza.',
        en: 'Number sets, supremum and infimum (completeness), powers, radicals, logarithms; injective, surjective, inverse functions; induction. At the exam they matter mostly for the <b>domain</b>: each elementary function has its existence conditions.',
        metodo: ['Denominatori ≠ 0 · radici di indice pari: radicando ≥ 0 · logaritmi: argomento > 0 · arcsin, arccos: argomento in [−1, 1] · base di una potenza a esponente variabile > 0. Si mettono a sistema e si risolve.', 'Denominators ≠ 0 · even roots: radicand ≥ 0 · logarithms: argument > 0 · arcsin, arccos: argument in [−1, 1] · base of a variable-exponent power > 0. Put them in a system and solve.'] },
      { tit: ['Numeri complessi', 'Complex numbers'], tipo: 'complessi',
        it: 'Forma algebrica a + ib, modulo e argomento, forma trigonometrica r(cos θ + i sin θ) ed esponenziale re<sup>iθ</sup>. Nel prodotto i moduli si moltiplicano e gli argomenti si sommano: da qui la formula di De Moivre per le potenze e quella delle radici n-esime (n radici sui vertici di un poligono regolare).',
        en: 'Algebraic form a + ib, modulus and argument, trigonometric form r(cos θ + i sin θ) and exponential re<sup>iθ</sup>. In a product moduli multiply and arguments add: hence De Moivre’s formula for powers and the n-th root formula (n roots at the vertices of a regular polygon).',
        metodo: ['Per zⁿ = w: scrivi w = ρe^(iφ), poi z_k = ρ^(1/n)·e^(i(φ + 2kπ)/n), k = 0…n−1. Attenzione al quadrante dell’argomento.', 'For zⁿ = w: write w = ρe^(iφ), then z_k = ρ^(1/n)·e^(i(φ + 2kπ)/n), k = 0…n−1. Mind the quadrant of the argument.'] },
      { tit: ['Limiti, successioni, infinitesimi', 'Limits, sequences, infinitesimals'], tipo: 'limite',
        it: 'Definizione di limite, teoremi di unicità, permanenza del segno e del confronto (dei carabinieri), limiti notevoli (sin x/x, (1 + 1/x)<sup>x</sup>, (eˣ − 1)/x, ln(1 + x)/x), forme indeterminate, confronto di infinitesimi e infiniti, asintoti.',
        en: 'Definition of limit, uniqueness, sign permanence and squeeze theorems, standard limits (sin x/x, (1 + 1/x)<sup>x</sup>, (eˣ − 1)/x, ln(1 + x)/x), indeterminate forms, comparison of infinitesimals and infinities, asymptotes.',
        metodo: ['1) Sostituisci: se il risultato è un numero, hai finito. 2) Se è una forma indeterminata (0/0, ∞/∞, ∞ − ∞, 1^∞, 0·∞): limiti notevoli, raccoglimenti, sviluppi di Taylor (il metodo più sicuro per 0/0), de l’Hôpital. 3) Per 1^∞ scrivi f^g = e^(g ln f).', '1) Substitute: if you get a number, you are done. 2) For an indeterminate form (0/0, ∞/∞, ∞ − ∞, 1^∞, 0·∞): standard limits, factoring, Taylor expansions (the safest for 0/0), l’Hôpital. 3) For 1^∞ write f^g = e^(g ln f).'] },
      { tit: ['Continuità e teoremi fondamentali', 'Continuity and fundamental theorems'], tipo: 'limite',
        it: 'Funzioni continue, punti di discontinuità (eliminabile, salto, seconda specie), teorema degli zeri (Bolzano), dei valori intermedi, di Weierstrass (una funzione continua su [a, b] ha massimo e minimo).',
        en: 'Continuous functions, discontinuities (removable, jump, essential), zeros theorem (Bolzano), intermediate values, Weierstrass (a continuous function on [a, b] has maximum and minimum).',
        metodo: ['Per classificare una discontinuità calcola limite destro e sinistro nel punto e confrontali con il valore.', 'To classify a discontinuity compute the left and right limits at the point and compare them with the value.'] },
      { tit: ['Derivate e teoremi del calcolo differenziale', 'Derivatives and theorems of differential calculus'], tipo: 'studio',
        it: 'Derivata come limite del rapporto incrementale, retta tangente, regole di derivazione, teoremi di Fermat, Rolle, Lagrange, de l’Hôpital, monotonia dal segno di f′, convessità dal segno di f″.',
        en: 'Derivative as the limit of the difference quotient, tangent line, differentiation rules, Fermat, Rolle, Lagrange and l’Hôpital theorems, monotonicity from the sign of f′, convexity from the sign of f″.',
        metodo: ['Prodotto (uv)′ = u′v + uv′ · quoziente (u/v)′ = (u′v − uv′)/v² · catena f(g)′ = f′(g)·g′. Gli zeri di f′ sono i candidati estremi; il cambio di segno decide.', 'Product (uv)′ = u′v + uv′ · quotient (u/v)′ = (u′v − uv′)/v² · chain f(g)′ = f′(g)·g′. Zeros of f′ are candidate extrema; the change of sign decides.'] },
      { tit: ['Formula di Taylor', 'Taylor’s formula'], tipo: 'taylor',
        it: 'f(x) = Σ f<sup>(k)</sup>(x₀)/k!·(x − x₀)<sup>k</sup> + resto, con il resto di Peano o(·) o di Lagrange. Gli sviluppi di eˣ, sin x, cos x, ln(1 + x), (1 + x)<sup>α</sup> vanno saputi a memoria: servono per i limiti.',
        en: 'f(x) = Σ f<sup>(k)</sup>(x₀)/k!·(x − x₀)<sup>k</sup> + remainder, Peano o(·) or Lagrange. The expansions of eˣ, sin x, cos x, ln(1 + x), (1 + x)<sup>α</sup> must be known by heart: they are used for limits.',
        metodo: ['Per una funzione composta sostituisci gli sviluppi noti e tronca all’ordine richiesto; per un limite 0/0 sviluppa numeratore e denominatore fino al primo termine non nullo.', 'For a composite function substitute the known expansions and truncate at the required order; for a 0/0 limit expand numerator and denominator up to the first non-zero term.'] },
      { tit: ['Studio di funzione', 'Function analysis'], tipo: 'studio',
        it: 'L’esercizio più classico: dominio, simmetrie, intersezioni con gli assi, segno, limiti agli estremi del dominio e asintoti, derivata prima (monotonia, massimi e minimi), derivata seconda (concavità, flessi), grafico.',
        en: 'The most classic exercise: domain, symmetry, intercepts, sign, limits at the domain endpoints and asymptotes, first derivative (monotonicity, extrema), second derivative (concavity, inflections), graph.',
        metodo: ['Segui sempre lo stesso ordine; scrivi le tabelle dei segni di f, f′ e f″. L’asintoto obliquo y = mx + q: m = lim f/x, q = lim (f − mx).', 'Always follow the same order; write the sign tables of f, f′ and f″. Oblique asymptote y = mx + q: m = lim f/x, q = lim (f − mx).'] },
      { tit: ['Integrali indefiniti e metodi', 'Indefinite integrals and methods'], tipo: 'integraleIndefinito',
        it: 'Primitive, integrali immediati, integrazione per parti, per sostituzione, funzioni razionali (fratti semplici, metodo di Hermite), funzioni trigonometriche e irrazionali con le sostituzioni opportune.',
        en: 'Antiderivatives, standard integrals, integration by parts, by substitution, rational functions (partial fractions, Hermite’s method), trigonometric and irrational functions with suitable substitutions.',
        metodo: ['Prima guarda se è immediato (anche con f′(x)·g(f(x))). Prodotto polinomio × eˣ, sin, cos: per parti con u = polinomio. ln x, arctg x: per parti con dv = dx. Razionali: dividi se serve, scomponi il denominatore, fratti semplici.', 'First check whether it is standard (also as f′(x)·g(f(x))). Polynomial × eˣ, sin, cos: by parts with u = polynomial. ln x, arctan x: by parts with dv = dx. Rational: divide if needed, factor the denominator, partial fractions.'] },
      { tit: ['Integrali definiti e impropri', 'Definite and improper integrals'], tipo: 'integraleDefinito',
        it: 'Integrale di Riemann, proprietà, teorema della media, teorema fondamentale del calcolo (∫<sub>a</sub><sup>b</sup> f = F(b) − F(a)), funzione integrale; integrali impropri su intervalli illimitati o di funzioni illimitate e criteri di convergenza (confronto, confronto asintotico con 1/x<sup>p</sup>).',
        en: 'Riemann integral, properties, mean value theorem, fundamental theorem of calculus (∫<sub>a</sub><sup>b</sup> f = F(b) − F(a)), integral function; improper integrals on unbounded intervals or of unbounded functions and convergence tests (comparison, asymptotic comparison with 1/x<sup>p</sup>).',
        metodo: ['∫₁^∞ 1/x^p converge se e solo se p > 1; ∫₀¹ 1/x^p converge se e solo se p < 1. Per un improprio calcola la primitiva e passa al limite all’estremo.', '∫₁^∞ 1/x^p converges iff p > 1; ∫₀¹ 1/x^p converges iff p < 1. For an improper integral compute the antiderivative and take the limit at the endpoint.'] }
    ],
    II: [
      { tit: ['Serie numeriche', 'Numerical series'], tipo: 'serieNumerica',
        it: 'Somme parziali, convergenza e divergenza, condizione necessaria (aₙ → 0), serie geometrica e armonica generalizzata Σ1/n<sup>p</sup>, criteri del confronto, del confronto asintotico, del rapporto, della radice; serie a segni alterni (criterio di Leibniz); convergenza assoluta.',
        en: 'Partial sums, convergence and divergence, necessary condition (aₙ → 0), geometric and generalised harmonic series Σ1/n<sup>p</sup>, comparison, asymptotic comparison, ratio and root tests; alternating series (Leibniz test); absolute convergence.',
        metodo: ['1) aₙ → 0? Se no, non converge. 2) Termini positivi: fattoriali e potenze n-esime → rapporto o radice; rapporti di polinomi → confronto asintotico con 1/n^p. 3) Segni alterni: Leibniz, poi studia la convergenza assoluta.', '1) aₙ → 0? If not, it does not converge. 2) Positive terms: factorials and n-th powers → ratio or root; ratios of polynomials → asymptotic comparison with 1/n^p. 3) Alternating: Leibniz, then study absolute convergence.'] },
      { tit: ['Successioni e serie di funzioni, serie di potenze', 'Sequences and series of functions, power series'], tipo: 'seriePotenze',
        it: 'Convergenza puntuale e uniforme, teoremi di passaggio al limite; serie di potenze Σcₙ(x − x₀)<sup>n</sup>, raggio di convergenza (criterio del rapporto o della radice sui coefficienti), comportamento agli estremi, serie di Taylor.',
        en: 'Pointwise and uniform convergence, limit-exchange theorems; power series Σcₙ(x − x₀)<sup>n</sup>, radius of convergence (ratio or root test on the coefficients), behaviour at the endpoints, Taylor series.',
        metodo: ['R = 1/lim |c_{n+1}/c_n|. Dentro (|x − x₀| < R) converge assolutamente, fuori diverge; agli estremi si studiano a parte le due serie numeriche.', 'R = 1/lim |c_{n+1}/c_n|. Inside (|x − x₀| < R) it converges absolutely, outside it diverges; at the endpoints study the two numerical series separately.'] },
      { tit: ['Funzioni di più variabili: derivate, gradiente, piano tangente', 'Functions of several variables: derivatives, gradient, tangent plane'], tipo: 'dueVariabili',
        it: 'Dominio nel piano, limiti e continuità, derivate parziali e direzionali, differenziabilità, gradiente (direzione di massima crescita), piano tangente z = f(x₀, y₀) + f<sub>x</sub>(x − x₀) + f<sub>y</sub>(y − y₀).',
        en: 'Domain in the plane, limits and continuity, partial and directional derivatives, differentiability, gradient (direction of steepest ascent), tangent plane z = f(x₀, y₀) + f<sub>x</sub>(x − x₀) + f<sub>y</sub>(y − y₀).',
        metodo: ['La derivata direzionale lungo v è ∇f · v/|v| (per una funzione differenziabile).', 'The directional derivative along v is ∇f · v/|v| (for a differentiable function).'] },
      { tit: ['Massimi e minimi', 'Maxima and minima'], tipo: 'maxMinCompatto',
        it: 'Punti critici (∇f = 0), matrice hessiana: det H > 0 e f<sub>xx</sub> > 0 minimo, det H > 0 e f<sub>xx</sub> < 0 massimo, det H < 0 sella. Estremi assoluti su un compatto (Weierstrass): punti critici interni più lo studio sul bordo.',
        en: 'Critical points (∇f = 0), Hessian: det H > 0 and f<sub>xx</sub> > 0 minimum, det H > 0 and f<sub>xx</sub> < 0 maximum, det H < 0 saddle. Absolute extrema on a compact set (Weierstrass): interior critical points plus the boundary.',
        metodo: ['Sul bordo parametrizza ogni pezzo (lati, circonferenza) e studia la funzione di una variabile che ne viene; poi confronta tutti i valori.', 'On the boundary parametrise each piece (sides, circle) and study the resulting one-variable function; then compare all the values.'] },
      { tit: ['Integrali doppi', 'Double integrals'], tipo: 'integraleDoppio',
        it: 'Integrale su un rettangolo e su domini normali, formule di riduzione (integrali iterati), cambiamento di variabili, in particolare le coordinate polari con lo jacobiano r: dx dy = r dr dθ.',
        en: 'Integral over a rectangle and over normal domains, reduction formulas (iterated integrals), change of variables, in particular polar coordinates with Jacobian r: dx dy = r dr dθ.',
        metodo: ['Disegna il dominio; scegli l’ordine che lo rende normale; integra prima la variabile interna (l’altra è una costante). Cerchi e corone circolari: polari.', 'Draw the domain; choose the order that makes it normal; integrate the inner variable first (the other is a constant). Discs and annuli: polar coordinates.'] },
      { tit: ['Curve e forme differenziali', 'Curves and differential forms'], tipo: 'formeDifferenziali',
        it: 'Curve parametriche, integrali curvilinei, forme differenziali ω = M dx + N dy, forme chiuse (∂M/∂y = ∂N/∂x) ed esatte (esiste U con dU = ω); su un dominio semplicemente connesso chiusa ⇔ esatta, e l’integrale dipende solo dagli estremi.',
        en: 'Parametric curves, line integrals, differential forms ω = M dx + N dy, closed (∂M/∂y = ∂N/∂x) and exact forms (there is U with dU = ω); on a simply connected domain closed ⇔ exact, and the integral depends only on the endpoints.',
        metodo: ['Integrale lungo γ(t) = (x(t), y(t)): ∫ [M(γ)x′ + N(γ)y′] dt. Se la forma è esatta basta U(fine) − U(inizio).', 'Integral along γ(t) = (x(t), y(t)): ∫ [M(γ)x′ + N(γ)y′] dt. If the form is exact U(end) − U(start) suffices.'] },
      { tit: ['Equazioni differenziali del primo ordine', 'First-order differential equations'], tipo: 'lineare1',
        it: 'Problema di Cauchy, esistenza e unicità; equazioni a variabili separabili y′ = g(x)h(y) (attenzione alle soluzioni costanti h(y) = 0); equazioni lineari y′ + a(x)y = b(x) con la formula del fattore integrante.',
        en: 'Cauchy problem, existence and uniqueness; separable equations y′ = g(x)h(y) (watch the constant solutions h(y) = 0); linear equations y′ + a(x)y = b(x) with the integrating-factor formula.',
        metodo: ['Lineare: y = e^(−A)(∫ b e^A dx + c), A = ∫a. Separabile: ∫ dy/h(y) = ∫ g(x) dx + c, poi esplicita se puoi; la costante si fissa con il dato iniziale.', 'Linear: y = e^(−A)(∫ b e^A dx + c), A = ∫a. Separable: ∫ dy/h(y) = ∫ g(x) dx + c, then solve for y if possible; the constant comes from the initial datum.'] },
      { tit: ['Equazioni lineari a coefficienti costanti', 'Constant-coefficient linear equations'], tipo: 'secondoOrdine',
        it: 'ay″ + by′ + cy = f(x): integrale generale = integrale generale dell’omogenea (dalle radici dell’equazione caratteristica) + una soluzione particolare (metodo di somiglianza per f = polinomio · e<sup>αx</sup> · cos/sin βx, moltiplicando per x<sup>m</sup> se α + iβ è radice di molteplicità m).',
        en: 'ay″ + by′ + cy = f(x): general solution = general solution of the homogeneous equation (from the roots of the characteristic equation) + one particular solution (undetermined coefficients for f = polynomial · e<sup>αx</sup> · cos/sin βx, multiplying by x<sup>m</sup> if α + iβ is a root of multiplicity m).',
        metodo: ['Radici reali distinte: c₁e^(λ₁x) + c₂e^(λ₂x); doppia: (c₁ + c₂x)e^(λx); complesse α ± iβ: e^(αx)(c₁cos βx + c₂sin βx).', 'Distinct real roots: c₁e^(λ₁x) + c₂e^(λ₂x); double: (c₁ + c₂x)e^(λx); complex α ± iβ: e^(αx)(c₁cos βx + c₂sin βx).'] }
    ]
    ,A: [
      { tit: ['Algebra lineare: autovalori', 'Linear algebra: eigenvalues'], tipo: 'autovalori', it: 'Autovalori dal polinomio caratteristico det(λI − A) = 0, autospazi come nuclei di A − λI, molteplicità algebrica e geometrica, diagonalizzazione A = PDP⁻¹, teorema spettrale per le matrici simmetriche. In chimica: Hückel, modi normali, matrici di Fock.', en: 'Eigenvalues from the characteristic polynomial det(λI − A) = 0, eigenspaces as null spaces of A − λI, algebraic and geometric multiplicity, diagonalisation A = PDP⁻¹, spectral theorem for symmetric matrices. In chemistry: Hückel, normal modes, Fock matrices.', metodo: ['Diagonalizzabile se e solo se per ogni λ la molteplicità geometrica è uguale all’algebrica.', 'Diagonalisable iff for every λ geometric multiplicity equals algebraic.'] },
      { tit: ['Sistemi di equazioni differenziali lineari', 'Linear systems of differential equations'], tipo: 'sistemaEDO', it: 'X′ = AX si risolve con autovalori e autovettori: X = Σcᵢvᵢe^(λᵢt); con autovalori complessi la soluzione oscilla, con un autovalore doppio compare t·e^(λt). Il segno degli autovalori classifica l’equilibrio (nodo, sella, fuoco, centro). In chimica: cinetiche di reazioni del primo ordine accoppiate.', en: 'X′ = AX is solved with eigenvalues and eigenvectors: X = Σcᵢvᵢe^(λᵢt); complex eigenvalues give oscillation, a double one brings in t·e^(λt). The sign of the eigenvalues classifies the equilibrium (node, saddle, focus, centre). In chemistry: coupled first-order kinetics.', metodo: ['tr A e det A bastano per la classificazione: det < 0 sella; tr² < 4det fuoco o centro; altrimenti nodo.', 'tr A and det A suffice to classify: det < 0 saddle; tr² < 4det focus or centre; otherwise node.'] },
      { tit: ['Serie di Fourier', 'Fourier series'], tipo: 'fourier', it: 'Ogni funzione periodica regolare a tratti è somma di seni e coseni; coefficienti con gli integrali su un periodo, simmetrie (pari: soli coseni, dispari: soli seni), convergenza di Dirichlet, fenomeno di Gibbs, Parseval. In chimica: spettroscopia FT (NMR, IR), cristallografia.', en: 'Every piecewise-smooth periodic function is a sum of sines and cosines; coefficients from integrals over a period, symmetries (even: cosines only, odd: sines only), Dirichlet convergence, Gibbs phenomenon, Parseval. In chemistry: FT spectroscopy (NMR, IR), crystallography.', metodo: ['Prima la simmetria (dimezza il lavoro), poi gli integrali per parti con n generico.', 'Symmetry first (halves the work), then integrals by parts with generic n.'] },
      { tit: ['Trasformata di Laplace', 'Laplace transform'], tipo: 'laplace', it: 'ℒ{f}(s) = ∫₀^∞ f e^(−st) dt trasforma le derivate in prodotti (ℒ{f′} = sF − f(0)) e le equazioni differenziali lineari in equazioni algebriche; si torna indietro con la tabella e i fratti semplici. In chimica: cinetiche, circuiti, risposta di un sistema.', en: 'ℒ{f}(s) = ∫₀^∞ f e^(−st) dt turns derivatives into products (ℒ{f′} = sF − f(0)) and linear ODEs into algebraic equations; invert with the table and partial fractions. In chemistry: kinetics, circuits, system response.', metodo: ['Usa la linearità, la tabella e lo spostamento ℒ{e^(at)f} = F(s − a).', 'Use linearity, the table and the shift ℒ{e^(at)f} = F(s − a).'] },
      { tit: ['Analisi complessa: residui (magistrale, dottorato)', 'Complex analysis: residues (master’s, PhD)'], tipo: 'residui', it: 'Funzioni olomorfe, teorema di Cauchy, serie di Laurent, residui; il teorema dei residui calcola integrali reali impossibili per primitive. In fisica e chimica: funzioni di risposta, relazioni di Kramers-Kronig, propagatori.', en: 'Holomorphic functions, Cauchy’s theorem, Laurent series, residues; the residue theorem evaluates real integrals that have no elementary antiderivative. In physics and chemistry: response functions, Kramers-Kronig relations, propagators.', metodo: ['Poli nel semipiano superiore, Res = P/Q′ per poli semplici, poi 2πi Σ Res.', 'Poles in the upper half-plane, Res = P/Q′ for simple poles, then 2πi Σ Res.'] },
      { tit: ['Equazioni alle derivate parziali (dottorato)', 'Partial differential equations (PhD)'], tipo: 'calore', it: 'Equazione del calore, delle onde, di Laplace; separazione delle variabili, problemi di Sturm-Liouville, serie di Fourier delle autofunzioni. È la matematica della diffusione (leggi di Fick), della conduzione termica e dell’equazione di Schrödinger.', en: 'Heat, wave and Laplace equations; separation of variables, Sturm-Liouville problems, Fourier series of eigenfunctions. The mathematics of diffusion (Fick’s laws), heat conduction and the Schrödinger equation.', metodo: ['u = X(x)T(t), autovalori dalle condizioni al bordo, coefficienti dal dato iniziale.', 'u = X(x)T(t), eigenvalues from boundary conditions, coefficients from the initial datum.'] },
      { tit: ['Integrali tripli', 'Triple integrals'], tipo: 'integraleTriplo', it: 'Volumi e masse in tre dimensioni; coordinate cilindriche (jacobiano r) e sferiche (jacobiano ρ² sin φ). In chimica: normalizzazione degli orbitali atomici, densità elettronica.', en: 'Volumes and masses in three dimensions; cylindrical (Jacobian r) and spherical coordinates (Jacobian ρ² sin φ). In chemistry: normalising atomic orbitals, electron density.', metodo: ['Scegli le coordinate della simmetria del dominio; non dimenticare lo jacobiano.', 'Choose coordinates matching the domain’s symmetry; never forget the Jacobian.'] }
    ]
  };

  /* ── gli appelli svolti ───────────────────────────────────────────────── */
  function E(tipo, v) { return { tipo: tipo, v: v }; }
  var APPELLI = {
    I: [
      [E('studio', { f: '(x^2+1)/(x^2-1)' }), E('limite', { f: '(sin(x)-x)/x^3', x0: '0' }), E('integraleIndefinito', { f: '(x+3)/(x^2-x-2)' }), E('complessi', { modo: 'radici', z: '', n: '3', w: '8i', abc: '' })],
      [E('studio', { f: 'x*e^(-x)' }), E('limite', { f: '(1+2/x)^x', x0: 'inf' }), E('integraleDefinito', { f: 'x*e^(-x)', a: '0', b: 'inf' }), E('dominio', { f: 'sqrt((x-1)/(x+2))' })],
      [E('studio', { f: 'ln(x)/x' }), E('limite', { f: '(e^x-1-x)/x^2', x0: '0' }), E('integraleIndefinito', { f: 'x^2*e^x' }), E('complessi', { modo: 'forma', z: '1+i', n: '8', w: '', abc: '' })],
      [E('studio', { f: 'x^3-3x^2' }), E('limite', { f: '(1-cos(x))/x^2', x0: '0' }), E('integraleDefinito', { f: '1/sqrt(x)', a: '0', b: '1' }), E('complessi', { modo: 'eq2', z: '', n: '', w: '', abc: '1, 2, 5' })],
      [E('studio', { f: '(x^2-1)/(x-2)' }), E('taylor', { f: 'ln(x)', x0: '1', n: '4' }), E('integraleIndefinito', { f: '(2x+1)/(x^2+2x+5)' }), E('dominio', { f: 'ln(x^2-1)' })],
      [E('studio', { f: 'x*ln(x)' }), E('taylor', { f: 'e^x*sin(x)', x0: '0', n: '5' }), E('integraleDefinito', { f: '1/(1+x^2)', a: '-inf', b: 'inf' }), E('limite', { f: 'x*ln(x)', x0: '0' })],
      [E('studio', { f: 'x^2*e^(-x)' }), E('limite', { f: '(x^3+1)/(x+1)', x0: '-1' }), E('integraleIndefinito', { f: 'x*atan(x)' }), E('integraleDefinito', { f: 'ln(x)', a: '0', b: '1' })],
      [E('studio', { f: 'x/(x^2+1)' }), E('limite', { f: '(2x^2+1)/(3x^2-x)', x0: 'inf' }), E('integraleIndefinito', { f: 'e^x*cos(x)' }), E('integraleIndefinito', { f: '1/((x-1)^2*(x+1))' })]
    ],
    II: [
      [E('serieNumerica', { an: 'n!/n^n', n0: '1' }), E('dueVariabili', { f: 'x^3-3x*y+y^3', P: '1, 2', v: '3, 4' }), E('integraleDoppio', { f: 'x*y', tipo: 'x', ab: '0, 1', g1: 'x^2', g2: 'x' }), E('lineare1', { a: '2', b: 'e^x', ci: '0, 1' })],
      [E('serieNumerica', { an: '(-1)^n/n', n0: '1' }), E('seriePotenze', { cn: '1/(n*3^n)', x0: '0' }), E('maxMinCompatto', { f: 'x^2+y^2-2x', dom: 'rettangolo 0,2,-1,1' }), E('secondoOrdine', { abc: '1, -3, 2', f: 'e^x', ci: '0, 0, 1' })],
      [E('serieNumerica', { an: '2^n/n!', n0: '0' }), E('formeDifferenziali', { M: '2x*y+1', N: 'x^2+3y^2', curva: 't, t^2', tt: '0, 1' }), E('integraleDoppio', { f: 'x^2+y^2', tipo: 'polari', ab: '0, 2*pi', g1: '0', g2: '1' }), E('separabile', { g: 'x', h: 'y', ci: '0, 2' })],
      [E('serieNumerica', { an: '1/(n*ln(n))', n0: '2' }), E('seriePotenze', { cn: '1/n^2', x0: '0' }), E('maxMinCompatto', { f: 'x*y', dom: 'disco 0,0,1' }), E('secondoOrdine', { abc: '1, 0, 4', f: 'sin(2x)', ci: '0, 0, 0' })],
      [E('serieNumerica', { an: 'n^2/(n^3+1)', n0: '1' }), E('dueVariabili', { f: 'x^2+x*y+y^2-3x', P: '1, 1', v: '1, 1' }), E('integraleDoppio', { f: 'x+y', tipo: 'y', ab: '0, 1', g1: 'y', g2: '1' }), E('lineare1', { a: '1/x', b: 'x^2', ci: '1, 0' })],
      [E('serieNumerica', { an: 'cos(n)/n^2', n0: '1' }), E('seriePotenze', { cn: 'n*2^n', x0: '0' }), E('formeDifferenziali', { M: '-y', N: 'x', curva: 'cos(t), sin(t)', tt: '0, 2*pi' }), E('secondoOrdine', { abc: '1, 2, 5', f: '0', ci: '0, 1, 0' })],
      [E('serieNumerica', { an: '(-1)^n*n/(n^2+1)', n0: '1' }), E('maxMinCompatto', { f: 'x^2-x*y+y', dom: 'triangolo 0,0,2,0,0,2' }), E('separabile', { g: '2x', h: '1+y^2', ci: '0, 0' }), E('secondoOrdine', { abc: '1, 2, 1', f: 'x^2', ci: '' })],
      [E('serieNumerica', { an: '(n/(n+1))^n', n0: '1' }), E('seriePotenze', { cn: '1/n', x0: '0' }), E('separabile', { g: '1', h: 'y^2', ci: '0, 1' }), E('secondoOrdine', { abc: '1, -2, 1', f: 'e^x', ci: '' })]
    ],
    A: [
      [E('autovalori', { M: '2 -1 0; -1 2 -1; 0 -1 2' }), E('sistemaEDO', { A: '1, 2, 2, 1', X0: '1, 0' }), E('fourier', { f: 'x', N: '5' }), E('laplace', { f: 't*e^(-t)' })],
      [E('autovalori', { M: '2 1; 0 2' }), E('sistemaEDO', { A: '-1, -2, 2, -1', X0: '1, 0' }), E('fourier', { f: 'abs(x)', N: '5' }), E('integraleTriplo', { f: 'x^2+y^2+z^2', tipo: 'sferiche', lim: '0,1; 0,pi; 0,2*pi' })],
      [E('autovalori', { M: '4 1; 2 3' }), E('sistemaEDO', { A: '-1, 1, 0, -1', X0: '1, 1' }), E('laplace', { f: 'e^(-t)*sin(2t)' }), E('integraleTriplo', { f: 'z', tipo: 'cilindriche', lim: '0,2; 0,2*pi; 0,3' })],
      [E('residui', { f: '1/(x^4+1)' }), E('residui', { f: '1/((x^2+1)*(x^2+4))' }), E('calore', { f: 'x*(pi-x)', L: 'pi', alfa: '1', x: '1', t: '0.5' }), E('calore', { f: 'sin(x)', L: 'pi', alfa: '0.5', x: '1.5', t: '1' })]
    ]
  };

  /* ── il disegno dello svolgimento ────────────────────────────────────── */
  function mostraSvolgimento(contenitore, tipo, v) {
    contenitore.innerHTML = '';
    var T = TIPI[tipo], r;
    try { r = T.esegui(v); } catch (err) { contenitore.innerHTML = '<div class="bsiFX-nota bsiFX-ko">⚠ ' + esc(err.message) + '</div>'; return null; }
    var ol = F.el('ol', { style: 'margin:6px 0 0 0;padding-left:20px' });
    r.passi.forEach(function (p) { ol.appendChild(F.el('li', { style: 'margin:8px 0', html: '<b style="color:#5eead4">' + esc(p.titolo) + '</b><div style="margin-top:3px;line-height:1.6">' + p.html + '</div>' })); });
    contenitore.appendChild(ol);
    if (r.risultato) contenitore.appendChild(F.el('div', { 'class': 'bsiFX-eq', html: '<b>' + t('Risultato: ', 'Result: ') + '</b>' + esc(r.risultato) }));
    if (T.grafico) disegnaGrafico(contenitore, T.grafico, v, r);
    return r;
  }
  function disegnaGrafico(contenitore, tipo, v, r) {
    var c = F.tela(contenitore, 0.5);
    try {
      if (tipo === 'studio' || tipo === 'area') {
        var e = C.leggi(v.f), f = C.funzione(e, 'x'), a = -6, b = 6;
        if (tipo === 'area') { var A = /inf/.test(v.a) ? -8 : C.valuta(C.leggi(v.a)), Bb = /inf/.test(v.b) ? 8 : C.valuta(C.leggi(v.b)); a = Math.min(A, Bb) - 1; b = Math.max(A, Bb) + 1; }
        var s = C.campiona(f, a, b, 800), sy = C.scalaY([s.y]);
        F.grafico(c, { serie: [{ x: s.x, y: C.spezza(s.y, sy), col: '#5eead4', larg: 2.5 }], linee: [{ y: 0, col: '#34465f' }], xmin: a, xmax: b, ymin: sy.min, ymax: sy.max, xl: 'x', yl: 'f(x)' });
      } else if (tipo === 'somme') {
        var e2 = C.leggi(v.an), g = C.funzione(e2, 'n'), xs = [], ys = [], S0 = 0;
        for (var k = +v.n0; k < +v.n0 + 60; k++) { S0 += g(k); xs.push(k); ys.push(S0); }
        F.grafico(c, { punti: xs.map(function (x, i) { return { x: x, y: ys[i], col: '#ffd24a', r: 3 }; }), xl: 'N', yl: t('somma parziale S_N', 'partial sum S_N') });
      } else if ((tipo === 'edo1' || tipo === 'edo2') && (r.particolare || r.cauchy)) {
        var sol = C.funzione(r.cauchy || r.particolare, 'x'), x0 = C.valuta(C.leggi(v.ci.split(',')[0])), s2 = C.campiona(sol, x0 - 2, x0 + 3, 600), sy2 = C.scalaY([s2.y]);
        F.grafico(c, { serie: [{ x: s2.x, y: C.spezza(s2.y, sy2), col: '#5eead4', larg: 2.5 }], ymin: sy2.min, ymax: sy2.max, xl: 'x', yl: 'y(x)' });
      } else c.remove();
    } catch (err) { c.remove(); }
  }

  /* ── le schede ────────────────────────────────────────────────────────── */
  var apriNelRisolutore = null;
  function schedaProgramma(div) {
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Programmi dalle schede degli insegnamenti del corso di laurea in <b>Chimica</b> dell’Università di Bari: ', 'Syllabi from the course sheets of the <b>Chemistry</b> degree at the University of Bari: ') +
      '<a href="https://www.uniba.it/it/corsi/chimica/studiare/piano-di-studi/elenco-insegnamenti-e-docenti-affidatari" target="_blank" rel="noopener" style="color:#5eead4">' + t('elenco insegnamenti e programmi', 'courses and syllabi') + '</a>. ' +
      t('Il dettaglio può cambiare da un anno accademico all’altro: fa fede la scheda del tuo anno.', 'Details can change from one academic year to the next: the sheet for your year is authoritative.') }));
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Livelli: <b>base</b> nella sezione 🔢 Basi di matematica; <b>I</b> e <b>II</b> i due corsi; <b>A</b> avanzato e avanzatissimo (algebra lineare, sistemi di EDO, Fourier, Laplace, integrali tripli), utili per Chimica Fisica e la magistrale.', 'Levels: <b>basic</b> in the 🔢 Mathematics basics section; <b>I</b> and <b>II</b> the two courses; <b>A</b> advanced and expert (linear algebra, ODE systems, Fourier, Laplace, triple integrals), useful for Physical Chemistry and the master’s degree.') }));
    ['I', 'II', 'A'].forEach(function (k) {
      div.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1.1rem;margin-top:14px', testo: k === 'A' ? t('Avanzato e avanzatissimo — oltre i due corsi', 'Advanced and expert — beyond the two courses') : 'Istituzioni di Matematiche ' + k + (k === 'I' ? t(' — 1° anno, 1° semestre, 6 CFU', ' — 1st year, 1st semester, 6 ECTS') : t(' — 1° anno, 2° semestre, 6 CFU', ' — 1st year, 2nd semester, 6 ECTS')) }));
      PROGRAMMA[k].forEach(function (arg) {
        var d = F.el('details', { 'class': 'bsiFX-pannello', style: 'margin:6px 0' });
        d.appendChild(F.el('summary', { style: 'cursor:pointer;font-weight:700;color:#e6fffb', testo: F.tt(arg.tit) }));
        d.appendChild(F.el('div', { 'class': 'bsiFX-nota', style: 'font-size:.88rem', html: t(arg.it, arg.en) }));
        d.appendChild(F.el('div', { 'class': 'bsiFX-eq', style: 'font-family:inherit;font-size:.86rem', html: '<b>' + t('Come si fa', 'How to do it') + '</b><br>' + esc(F.tt(arg.metodo)) }));
        F.bottone(d, ['Apri l’esercizio tipico nel risolutore →', 'Open the typical exercise in the solver →'], function () { var b = document.querySelectorAll('#smatesame .bsiFX-schede button')[1]; if (b) b.click(); if (apriNelRisolutore) apriNelRisolutore(arg.tipo); });
        div.appendChild(d);
      });
    });
  }
  function schedaRisolutore(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { 'class': 'bsiFX-pannello', style: 'overflow-x:auto' });
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var tipo = 'studio', campi = F.el('div'), enun = F.el('div', { 'class': 'bsiFX-eq', style: 'font-family:inherit' }), valori = {};
    var sel = F.scelta(pan, ['Tipo di esercizio', 'Exercise type'], Object.keys(TIPI).map(function (k) { return [k, ['[' + TIPI[k].corso + '] ' + TIPI[k].nome[0], '[' + TIPI[k].corso + '] ' + TIPI[k].nome[1]]]; }), tipo, function (v) { tipo = v; costruisciCampi(); });
    pan.appendChild(campi);
    F.bottone(pan, ['Risolvi e spiega', 'Solve and explain'], risolvi);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Scrivi come a mano: <b>x^2</b> o <b>x²</b>, <b>sqrt( )</b> o <b>√</b>, <b>e^x</b>, <b>ln</b>, <b>sen</b>/<b>sin</b>, <b>tg</b>, <b>arctg</b>, <b>pi</b>, <b>inf</b>, <b>n!</b>.', 'Type as by hand: <b>x^2</b> or <b>x²</b>, <b>sqrt( )</b> or <b>√</b>, <b>e^x</b>, <b>ln</b>, <b>sin</b>, <b>tan</b>, <b>atan</b>, <b>pi</b>, <b>inf</b>, <b>n!</b>.') }));
    dx.appendChild(enun); var out = F.el('div'); dx.appendChild(out);
    function costruisciCampi(pre) {
      campi.innerHTML = ''; valori = {};
      TIPI[tipo].campi.forEach(function (c) {
        campi.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: F.tt(c[1]) }));
        var inp = F.el('input', { type: 'text', value: pre && pre[c[0]] != null ? pre[c[0]] : c[2], 'aria-label': F.tt(c[1]) });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') risolvi(); });
        campi.appendChild(inp); valori[c[0]] = inp;
      });
      out.innerHTML = ''; enun.innerHTML = '';
    }
    function risolvi() {
      var v = {}; Object.keys(valori).forEach(function (k) { v[k] = valori[k].value; });
      try { enun.innerHTML = '<b>' + t('Esercizio. ', 'Exercise. ') + '</b>' + TIPI[tipo].enunciato(v); } catch (e) { enun.textContent = ''; }
      out.innerHTML = '<div class="bsiFX-nota">' + t('Calcolo…', 'Computing…') + '</div>';
      setTimeout(function () { mostraSvolgimento(out, tipo, v); }, 20);
    }
    apriNelRisolutore = function (k, pre) { tipo = k; sel.value = k; costruisciCampi(pre); risolvi(); };
    costruisciCampi(); risolvi();
  }
  function schedaAppelli(div) {
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('<b>Tracce nello stile della prova scritta</b>, costruite sui programmi: non sono i testi ufficiali degli appelli. Prova da solo, poi apri lo svolgimento esercizio per esercizio.', '<b>Traces in the style of the written exam</b>, built on the syllabi: they are not the official exam papers. Try on your own, then open the solution exercise by exercise.') }));
    ['I', 'II', 'A'].forEach(function (k) {
      div.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1.1rem;margin-top:12px', testo: k === 'A' ? t('Avanzato e avanzatissimo', 'Advanced and expert') : 'Istituzioni di Matematiche ' + k }));
      APPELLI[k].forEach(function (ap, i) {
        var d = F.el('details', { 'class': 'bsiFX-pannello', style: 'margin:6px 0' });
        d.appendChild(F.el('summary', { style: 'cursor:pointer;font-weight:700;color:#e6fffb', testo: t('Appello ', 'Paper ') + k + '.' + (i + 1) + ' — ' + ap.map(function (es) { return F.tt(TIPI[es.tipo].nome); }).join(' · ') }));
        ap.forEach(function (es, j) {
          var box = F.el('div', { style: 'border-top:1px solid #16263d;padding:8px 0' });
          box.appendChild(F.el('div', { html: '<b>' + (j + 1) + '.</b> ' + TIPI[es.tipo].enunciato(es.v) }));
          var sol = F.el('div', { style: 'display:none' });
          F.bottone(box, ['Mostra lo svolgimento', 'Show the solution'], function () { if (sol.style.display === 'none') { sol.style.display = ''; if (!sol.firstChild) mostraSvolgimento(sol, es.tipo, es.v); } else sol.style.display = 'none'; });
          box.appendChild(sol); d.appendChild(box);
        });
        div.appendChild(d);
      });
    });
  }
  function schedaSimulazione(div) {
    var pan = F.el('div', { 'class': 'bsiFX-pannello' }); div.appendChild(pan);
    var corso = 'I', minuti = 120, timer = null, fine = 0, area = F.el('div'), orologio = F.el('div', { 'class': 'bsiFX-eq', style: 'font-family:inherit;font-size:1.1rem' });
    F.scelta(pan, ['Corso', 'Course'], [['I', 'Istituzioni di Matematiche I'], ['II', 'Istituzioni di Matematiche II'], ['A', ['Avanzato', 'Advanced']]], corso, function (v) { corso = v; });
    F.cursore(pan, ['Tempo (minuti)', 'Time (minutes)'], 30, 180, 15, minuti, function (v) { minuti = v; }, function (v) { return v + ' min'; });
    F.bottone(pan, ['Estrai un appello e parti', 'Draw a paper and start'], parti);
    pan.appendChild(orologio); pan.appendChild(area);
    function parti() {
      clearInterval(timer); area.innerHTML = '';
      /* un esercizio di ciascun «posto» preso da appelli diversi */
      var ap = APPELLI[corso], es = [0, 1, 2, 3].map(function (pos) { return ap[Math.floor(Math.random() * ap.length)][pos]; });
      es.forEach(function (e, j) { area.appendChild(F.el('div', { 'class': 'bsiFX-pannello', style: 'margin:6px 0', html: '<b>' + (j + 1) + '.</b> ' + TIPI[e.tipo].enunciato(e.v) })); });
      var soluzioni = F.el('div', { style: 'display:none' });
      F.bottone(area, ['Consegna e mostra le soluzioni', 'Hand in and show the solutions'], function () { clearInterval(timer); orologio.textContent = t('Consegnato.', 'Handed in.'); soluzioni.style.display = ''; if (!soluzioni.firstChild) es.forEach(function (e, j) { soluzioni.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1rem', testo: t('Esercizio ', 'Exercise ') + (j + 1) })); var c = F.el('div'); soluzioni.appendChild(c); mostraSvolgimento(c, e.tipo, e.v); }); });
      area.appendChild(soluzioni);
      fine = Date.now() + minuti * 60000;
      var tick = function () { var r = Math.max(0, fine - Date.now()), m = Math.floor(r / 60000), s = Math.floor(r / 1000) % 60; if (!area.isConnected) { clearInterval(timer); return; } orologio.textContent = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s; if (!r) { clearInterval(timer); orologio.textContent = t('Tempo scaduto.', 'Time is up.'); } };
      tick(); timer = setInterval(tick, 1000);
    }
  }

  F.calcolo.esameMatematica = { TIPI: TIPI, APPELLI: APPELLI, PROGRAMMA: PROGRAMMA };

  F.sezione('smatesame', {
    titolo: ['🎓 Esame di Matematica (UniBA)', '🎓 Mathematics exam (UniBA)'],
    sotto: ['Istituzioni di Matematiche I e II del corso di laurea in Chimica: il programma spiegato argomento per argomento, un risolutore che scrive lo svolgimento passo per passo di ogni tipo di esercizio, appelli svolti e una simulazione d’esame a tempo.',
            'Istituzioni di Matematiche I and II of the Chemistry degree: the syllabus explained topic by topic, a solver that writes the step-by-step solution of every exercise type, solved papers and a timed exam simulation.'],
    schede: [
      { nome: ['Programma', 'Syllabus'], costruisci: function (div) { schedaProgramma(div); } },
      { nome: ['Risolutore passo per passo', 'Step-by-step solver'], costruisci: function (div) { schedaRisolutore(div); } },
      { nome: ['Appelli svolti', 'Solved papers'], costruisci: schedaAppelli },
      { nome: ['Simulazione d’esame', 'Exam simulation'], costruisci: schedaSimulazione }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
