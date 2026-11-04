/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-studio-lezioni.js — le lezioni dello studio di Spectra
   BioSpecInfo · © Samuele Pio Provenzano · contenuti del Team Ingegneria Scientifica

   IL METODO: PREDICI → TESTA → DIMOSTRA → RIVELA
   1. PREDICI  il fenomeno e' in scena, fermo; le scelte sono le idee sbagliate
               piu' comuni nella didattica, piu' quella giusta;
   2. TESTA    la simulazione gira davanti all'utente con un modello vero e i
               numeri misurati in scena;
   3. DIMOSTRA la derivazione rigorosa, passo per passo;
   4. RIVELA   perche' la risposta giusta e' giusta e le altre no, i
               collegamenti fra discipline, esercizi su quattro livelli
               (scuola superiore, triennale, magistrale, ricerca).

   Ogni lezione ha i CALCOLI separati dal DISEGNO (calcolo.*), cosi' i numeri
   che compaiono in scena si verificano da node (tools/banchi/verifiche/
   verifica-studio-spectra.js) contro le soluzioni esatte.

   LE TRE LEZIONI DELLA v239
   · fisica      La caduta: lanciato in orizzontale o lasciato cadere?
   · chimica     La forma dell'acqua: perche' 104,5°?
   · matematica  Il problema di Basilea: quanto fa 1 + 1/4 + 1/9 + …?
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? en : it; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

  /* ═══ CALCOLI ═══════════════════════════════════════════════════════════════ */
  var calcolo = {
    /* due corpi dalla stessa quota h: A lasciato cadere, B lanciato con v0 orizzontale.
       Integrazione di Eulero semi-implicito con passo dt (senz'aria), oppure con
       resistenza quadratica k|v|v se k > 0 (allora i tempi NON sono piu' uguali) */
    caduta: function (h, v0, g, dt, k) {
      g = g || 9.81; dt = dt || 1e-4; k = k || 0;
      function vola(vx0) { var x = 0, y = h, vx = vx0, vy = 0, tt = 0, traccia = [[0, h]]; while (y > 0 && tt < 60) { var v = Math.hypot(vx, vy); vx += -k * v * vx * dt; vy += (-g - k * v * vy) * dt; x += vx * dt; y += vy * dt; tt += dt; if (traccia.length < 400 && (tt / dt) % 50 < 1) traccia.push([x, y]); } var f = y / (vy * dt); /* ultimo passo, interpolato */ return { t: tt + f * dt, x: x + f * vx * dt, traccia: traccia }; }
      var A = vola(0), B = vola(v0);
      return { tA: A.t, tB: B.t, esatto: Math.sqrt(2 * h / g), gittata: B.x, gittataEsatta: v0 * Math.sqrt(2 * h / g), tracciaA: A.traccia, tracciaB: B.traccia };
    },
    /* VSEPR come minimo di energia: n domini elettronici sulla sfera unitaria che si respingono
       con energia w_i w_j / r_ij (coulombiana). Pesi: 1 per i legami, wLP per i doppietti solitari
       (piu' «ingombranti»). Restituisce le posizioni e l'angolo fra i primi due (i legami) */
    vsepr: function (nLegami, nDoppietti, wLP, iter) {
      wLP = wLP == null ? 1.25 : wLP; iter = iter || 20000;
      var n = nLegami + nDoppietti, w = [], P = [], r = mulberry32(5);
      for (var i = 0; i < n; i++) { w.push(i < nLegami ? 1 : wLP); var v = [r() - 0.5, r() - 0.5, r() - 0.5], l = Math.hypot(v[0], v[1], v[2]); P.push([v[0] / l, v[1] / l, v[2] / l]); }
      var E = 0;
      for (var it = 0; it < iter; it++) {
        var F = P.map(function () { return [0, 0, 0]; }); E = 0;
        for (i = 0; i < n; i++) for (var j = 0; j < n; j++) { if (i === j) continue; var d = [P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]], rr = Math.hypot(d[0], d[1], d[2]), f = w[i] * w[j] / (rr * rr); if (i < j) E += w[i] * w[j] / rr; for (var q = 0; q < 3; q++) F[i][q] += f * d[q] / rr; }
        for (i = 0; i < n; i++) { var p = [P[i][0] + 0.002 * F[i][0], P[i][1] + 0.002 * F[i][1], P[i][2] + 0.002 * F[i][2]], ll = Math.hypot(p[0], p[1], p[2]); P[i] = [p[0] / ll, p[1] / ll, p[2] / ll]; }
      }
      var ang = function (a, b) { return Math.acos(Math.max(-1, Math.min(1, P[a][0] * P[b][0] + P[a][1] * P[b][1] + P[a][2] * P[b][2]))) * 180 / Math.PI; };
      return { punti: P, pesi: w, angolo: nLegami >= 2 ? ang(0, 1) : null, energia: E };
    },
    /* la serie di Basilea */
    parziale: function (N) { var s = 0; for (var n = N; n >= 1; n--) s += 1 / (n * n); return s; },   /* dal piu' piccolo: meno arrotondamento */
    armonica: function (N) { var s = 0; for (var n = N; n >= 1; n--) s += 1 / n; return s; },
    /* la coda: 1/(N+1) < Σ_{n>N} 1/n² < 1/N (confronto con l'integrale) */
    coda: function (N) { return [1 / (N + 1), 1 / N]; },
    /* serie di Fourier di x² su [−π, π]: π²/3 + Σ 4(−1)^n cos(nx)/n², valutata in x */
    fourierX2: function (x, N) { var s = Math.PI * Math.PI / 3; for (var n = 1; n <= N; n++) s += 4 * (n % 2 ? -1 : 1) * Math.cos(n * x) / (n * n); return s; },
    mcd: function (a, b) { while (b) { var c = a % b; a = b; b = c; } return a; },
    /* probabilita' che due interi a caso siano coprimi (Monte Carlo, seme fisso) → 6/π² */
    coprimi: function (M, max, seme) { var r = mulberry32(seme || 7), c = 0; for (var i = 0; i < M; i++) { var a = 1 + Math.floor(r() * max), b = 1 + Math.floor(r() * max); if (calcolo.mcd(a, b) === 1) c++; } return c / M; }
  };

  /* ═══ LE LEZIONI ═══════════════════════════════════════════════════════════ */
  var LEZIONI = [
    {
      id: 'caduta', materia: 'fisica', icona: '🪂', titolo: [t('La caduta', 'The fall'), 'The fall'],
      sotto: t('Due sfere dalla stessa altezza: una lasciata cadere, una lanciata in orizzontale a 6 m/s.', 'Two spheres from the same height: one dropped, one thrown horizontally at 6 m/s.'),
      predici: { domanda: t('Dalla stessa altezza di 20 m: quale tocca terra per prima?', 'From the same 20 m height: which one lands first?'),
        opzioni: [
          { testo: t('Quella lasciata cadere: l\'altra deve fare più strada', 'The dropped one: the other has a longer path'), giusta: false, perche: t('Il percorso più lungo è compensato dalla velocità orizzontale, che non toglie né aggiunge nulla alla caduta: la strada in più si fa «di lato», nello stesso tempo.', 'The longer path is covered sideways by the horizontal speed, which neither adds to nor subtracts from the fall.') },
          { testo: t('Quella lanciata: va più veloce', 'The thrown one: it is faster'), giusta: false, perche: t('Va più veloce, ma in orizzontale: la velocità verticale delle due sfere è identica istante per istante.', 'It is faster, but horizontally: the vertical speed of the two is identical at every instant.') },
          { testo: t('Insieme', 'At the same time'), giusta: true, perche: t('Il moto verticale non dipende da quello orizzontale: y(t) = h − ½gt² per entrambe.', 'The vertical motion does not depend on the horizontal one: y(t) = h − ½gt² for both.') },
          { testo: t('Dipende dalla massa', 'It depends on the mass'), giusta: false, perche: t('Senz\'aria l\'accelerazione di caduta è g per ogni massa (Galileo, e l\'equivalenza fra massa inerziale e gravitazionale).', 'Without air the falling acceleration is g for every mass (Galileo; equivalence of inertial and gravitational mass).') }
        ] },
      testa: { testo: t('Le lascio andare insieme. Guarda le due ombre sul pavimento e il cronometro di ciascuna.', 'I release them together. Watch the two shadows on the floor and each one\'s stopwatch.') },
      dimostra: [
        { testo: t('Sulle due sfere agisce solo il peso, verticale: in orizzontale la forza è zero.', 'Only weight acts on the spheres, and it is vertical: horizontally the force is zero.'), formula: 'F = m g (−ŷ)  ⇒  a = (0, −g)' },
        { testo: t('Le due componenti si integrano separatamente, perché le equazioni non le mescolano.', 'The two components integrate separately, because the equations do not mix them.'), formula: 'ẍ = 0,  ÿ = −g' },
        { testo: t('Con le condizioni iniziali x(0) = 0, ẋ(0) = v₀, y(0) = h, ẏ(0) = 0:', 'With initial conditions x(0) = 0, ẋ(0) = v₀, y(0) = h, ẏ(0) = 0:'), formula: 'x(t) = v₀ t,   y(t) = h − ½ g t²' },
        { testo: t('Il tempo di caduta è dove y = 0: v₀ non compare. Per h = 20 m:', 'The fall time is where y = 0: v₀ does not appear. For h = 20 m:'), formula: 't = √(2h/g) = √(40 / 9,81) ≈ 2,019 s' },
        { testo: t('La traiettoria della sfera lanciata è una parabola, e la gittata cresce con v₀ senza cambiare il tempo:', 'The thrown sphere follows a parabola, and the range grows with v₀ without changing the time:'), formula: 'y = h − g x² / (2 v₀²),   R = v₀ √(2h/g) ≈ 12,1 m' }
      ],
      rivela: { testo: t('Il principio di sovrapposizione: quando le equazioni sono lineari e disaccoppiate, i moti si sommano senza disturbarsi. Con l\'aria non è più vero: la resistenza dipende dal modulo della velocità e accoppia le componenti, e la sfera lanciata arriva DOPO.', 'The superposition principle: when the equations are linear and uncoupled, motions add without interfering. With air this fails: drag depends on the speed magnitude and couples the components, and the thrown sphere lands LATER.'),
        collegamenti: [
          t('Fisica → matematica: spazio delle fasi e sistemi lineari; il disaccoppiamento è la diagonalizzazione.', 'Physics → mathematics: phase space and linear systems; uncoupling is diagonalisation.'),
          t('Fisica → relatività: il principio di equivalenza (massa inerziale = gravitazionale) è il seme della relatività generale.', 'Physics → relativity: the equivalence principle is the seed of general relativity.'),
          t('Chimica: lo stesso disaccoppiamento separa i moti di traslazione, rotazione e vibrazione di una molecola.', 'Chemistry: the same uncoupling separates translation, rotation and vibration of a molecule.')
        ],
        esercizi: [
          { livello: 0, testo: t('Da che altezza deve cadere una sfera per toccare terra in 3 s?', 'From what height must a sphere fall to land in 3 s?'), soluzione: 'h = ½ g t² = ½ · 9,81 · 9 ≈ 44,1 m' },
          { livello: 1, testo: t('Un proiettile è lanciato a 45° con 20 m/s da terra. Qual è la gittata? Perché 45° è l\'angolo migliore senz\'aria?', 'A projectile is launched at 45° with 20 m/s. What is the range? Why is 45° optimal without air?'), soluzione: 'R = v² sin 2θ / g = 400/9,81 ≈ 40,8 m; sin 2θ è massimo per 2θ = 90°.' },
          { livello: 2, testo: t('Con resistenza quadratica F = −k m |v| v, mostra che la sfera lanciata arriva dopo quella lasciata cadere.', 'With quadratic drag F = −k m |v| v, show the thrown sphere lands after the dropped one.'), soluzione: t('ÿ = −g − k|v|ẏ: con ẋ ≠ 0 è |v| > |ẏ|, la frenata verticale è maggiore, quindi |ẏ| cresce più lentamente e il tempo di caduta è più lungo. In scena: k = 0,02 m⁻¹ dà tempi diversi.', 'ÿ = −g − k|v|ẏ: with ẋ ≠ 0, |v| > |ẏ|, so vertical braking is larger and the fall takes longer.') },
          { livello: 3, testo: t('Ricerca: nel caso relativistico (un fascio di particelle che «cade» in un campo uniforme) i moti non sono più disaccoppiati. Perché? (Suggerimento: γ dipende da |v|.)', 'Research: relativistically (a particle beam "falling" in a uniform field) the motions couple. Why? (Hint: γ depends on |v|.)'), soluzione: t('dp/dt = F con p = γ m v e γ = 1/√(1 − v²/c²): una velocità orizzontale grande aumenta γ e riduce l\'accelerazione verticale; la particella lanciata cade più lentamente.', 'dp/dt = F with p = γmv: a large horizontal speed increases γ and reduces the vertical acceleration.') }
        ] }
    },
    {
      id: 'acqua', materia: 'chimica', icona: '💧', titolo: [t('La forma dell\'acqua', 'The shape of water'), 'The shape of water'],
      sotto: t('Due idrogeni legati a un ossigeno: lineare, piegata o tetraedrica?', 'Two hydrogens bound to an oxygen: linear, bent or tetrahedral?'),
      predici: { domanda: t('Quanto vale l\'angolo H–O–H nella molecola d\'acqua?', 'What is the H–O–H angle in a water molecule?'),
        opzioni: [
          { testo: '180°', giusta: false, perche: t('Varrebbe se sull\'ossigeno ci fossero solo i due legami. Ma ci sono anche due doppietti solitari: quattro domini elettronici, non due.', 'It would if oxygen had only its two bonds. But there are also two lone pairs: four electron domains, not two.') },
          { testo: '120°', giusta: false, perche: t('È l\'angolo di tre domini su un piano (trigonale, come in BF₃). L\'ossigeno ne ha quattro.', 'That is three domains in a plane (trigonal, as in BF₃). Oxygen has four.') },
          { testo: '109,5°', giusta: false, perche: t('Quasi: è il tetraedro perfetto, giusto per quattro domini uguali (come in CH₄). Ma i doppietti solitari occupano più spazio dei legami e stringono l\'angolo.', 'Close: the perfect tetrahedron, right for four identical domains (CH₄). But lone pairs take more room and squeeze the angle.') },
          { testo: '104,5°', giusta: true, perche: t('Quattro domini disposti quasi a tetraedro; i doppietti solitari, più ingombranti, spingono i due legami a stringersi.', 'Four domains nearly tetrahedral; the bulkier lone pairs push the two bonds closer.') }
        ] },
      testa: { testo: t('Metto quattro domini elettronici attorno all\'ossigeno e li lascio respingersi finché l\'energia è minima. Prima tutti uguali, poi con i doppietti solitari più ingombranti.', 'I place four electron domains around oxygen and let them repel until the energy is minimal. First all equal, then with bulkier lone pairs.') },
      dimostra: [
        { testo: t('Modello: domini elettronici come cariche su una sfera, con energia di repulsione coulombiana.', 'Model: electron domains as charges on a sphere with Coulomb repulsion energy.'), formula: 'E = Σᵢ<ⱼ wᵢ wⱼ / |rᵢ − rⱼ|,   |rᵢ| = 1' },
        { testo: t('Quattro domini uguali: il minimo è il tetraedro regolare (simmetria Td). L\'angolo fra due vertici si ottiene dai vettori (1,1,1) e (1,−1,−1):', 'Four equal domains: the minimum is the regular tetrahedron (Td symmetry). The angle from (1,1,1) and (1,−1,−1):'), formula: 'cos θ = (1 − 1 − 1)/3 = −1/3  ⇒  θ = arccos(−1/3) = 109,47°' },
        { testo: t('Con due doppietti solitari di peso w > 1 la simmetria scende a C₂v: i due legami si avvicinano. Il minimo numerico per w = 1,25:', 'With two lone pairs of weight w > 1 symmetry drops to C₂v: the bonds close in. The numerical minimum for w = 1.25:'), formula: 'θ(H–O–H) ≈ 104,4°   (sperimentale 104,5°)' },
        { testo: t('Onestà del modello: w è CALIBRATO sull\'acqua, non previsto. La prova che il modello dice qualcosa: con lo stesso w, l\'ammoniaca (tre legami, un doppietto) dà 106,7°, misurato 106,7°.', 'Honesty: w is CALIBRATED on water, not predicted. The test: with the same w, ammonia (three bonds, one lone pair) gives 106.7°, measured 106.7°.'), formula: 'NH₃: θ(H–N–H) ≈ 106,7° (previsto, non calibrato)' }
      ],
      rivela: { testo: t('La VSEPR non è una teoria quantistica: è una regola di impacchettamento che funziona perché la repulsione fra coppie di elettroni (Pauli più Coulomb) è il termine dominante. La spiegazione profonda viene dagli orbitali molecolari (diagrammi di Walsh): piegandosi, la molecola stabilizza l\'orbitale occupato più alto.', 'VSEPR is not quantum theory: it is a packing rule that works because pair repulsion (Pauli + Coulomb) dominates. The deep explanation comes from molecular orbitals (Walsh diagrams): bending stabilises the highest occupied orbital.'),
        collegamenti: [
          t('Chimica → fisica: il momento dipolare dell\'acqua (1,85 D) esiste solo perché è piegata; da lì il forno a microonde e la costante dielettrica 80.', 'Chemistry → physics: water\'s dipole (1.85 D) exists only because it is bent; hence microwave heating and dielectric constant 80.'),
          t('Chimica → biologia: legami a idrogeno tetraedrici, ghiaccio meno denso dell\'acqua, laghi che gelano dall\'alto.', 'Chemistry → biology: tetrahedral hydrogen bonds, ice less dense than water, lakes freezing from the top.'),
          t('Chimica → matematica: il problema di Thomson (n cariche sulla sfera) è aperto per n grande ed è un problema di ottimizzazione su varietà.', 'Chemistry → mathematics: the Thomson problem (n charges on a sphere) is open for large n, an optimisation on manifolds.')
        ],
        esercizi: [
          { livello: 0, testo: t('Prevedi la geometria di CO₂, BF₃ e CH₄ contando i domini elettronici.', 'Predict the geometry of CO₂, BF₃ and CH₄ by counting electron domains.'), soluzione: t('CO₂: 2 domini → lineare 180°; BF₃: 3 → trigonale 120°; CH₄: 4 → tetraedrica 109,5°.', 'CO₂: 2 → linear; BF₃: 3 → trigonal; CH₄: 4 → tetrahedral.') },
          { livello: 1, testo: t('Perché H₂S ha un angolo di 92°, molto più stretto dell\'acqua?', 'Why does H₂S have a 92° angle, much narrower than water?'), soluzione: t('Lo zolfo è più grande e meno elettronegativo: i legami S–H usano quasi solo orbitali 3p (a 90°), con poca ibridazione s.', 'Sulfur is larger and less electronegative: S–H bonds use almost pure 3p orbitals (90°), little s mixing.') },
          { livello: 2, testo: t('Con un calcolo Hartree-Fock minimo, qual è il segno di dE/dθ attorno a 180° per H₂O? Collega il risultato al diagramma di Walsh.', 'In a minimal Hartree-Fock calculation, what is the sign of dE/dθ around 180° for H₂O? Relate it to the Walsh diagram.'), soluzione: t('Negativo verso angoli minori: l\'orbitale 1b₁/3a₁ si stabilizza piegandosi (mescolanza s-p), quindi la forma lineare è un massimo.', 'Bending stabilises the 3a₁ orbital (s–p mixing); the linear form is a maximum.') },
          { livello: 3, testo: t('Ricerca: il problema di Thomson per n = 5 ha come minimo la bipiramide triangolare, ma la dimostrazione rigorosa è arrivata solo nel 2010 (Schwartz). Perché il problema è così difficile?', 'Research: the Thomson problem for n = 5 has the triangular bipyramid as minimum, rigorously proved only in 2010 (Schwartz). Why is it so hard?'), soluzione: t('Il paesaggio energetico ha molti minimi locali e simmetrie degeneri; servono stime certificate con aritmetica a intervalli su tutte le configurazioni.', 'Many local minima and degeneracies; it needs certified interval-arithmetic bounds over all configurations.') }
        ] }
    },
    {
      id: 'basilea', materia: 'matematica', icona: '♾️', titolo: [t('Il problema di Basilea', 'The Basel problem'), 'The Basel problem'],
      sotto: t('Sommare all\'infinito 1 + 1/4 + 1/9 + 1/16 + …', 'Adding forever 1 + 1/4 + 1/9 + 1/16 + …'),
      predici: { domanda: t('Quanto fa 1 + 1/4 + 1/9 + 1/16 + … (i reciproci dei quadrati)?', 'What is 1 + 1/4 + 1/9 + 1/16 + … (reciprocals of the squares)?'),
        opzioni: [
          { testo: t('Infinito, come 1 + 1/2 + 1/3 + …', 'Infinity, like 1 + 1/2 + 1/3 + …'), giusta: false, perche: t('La serie armonica diverge perché i termini calano troppo lentamente (come 1/n). Qui calano come 1/n²: abbastanza in fretta da avere una somma finita.', 'The harmonic series diverges because terms fall too slowly (1/n). Here they fall as 1/n²: fast enough.') },
          { testo: '2', giusta: false, perche: t('2 è un limite superiore (confronto con 1/(n(n−1)), che si somma «a cannocchiale»), non il valore.', '2 is an upper bound (comparison with the telescoping 1/(n(n−1))), not the value.') },
          { testo: 'π²/6 ≈ 1,645', giusta: true, perche: t('Il valore trovato da Eulero nel 1734: compare π, che con i quadrati degli interi apparentemente non c\'entra nulla.', 'Euler\'s 1734 value: π appears, though it seems unrelated to squares of integers.') },
          { testo: 'e ≈ 2,718', giusta: false, perche: t('È più grande anche del limite superiore 2.', 'It exceeds even the upper bound 2.') }
        ] },
      testa: { testo: t('Impilo i termini uno sull\'altro: le colonne azzurre sono la nostra serie, quelle arancioni la serie armonica. Guarda dove si fermano.', 'I stack the terms: blue columns are our series, orange ones the harmonic series. Watch where they stop.') },
      dimostra: [
        { testo: t('Convergenza, per confronto: per n ≥ 2, 1/n² < 1/(n(n−1)) = 1/(n−1) − 1/n, e quest\'ultima somma «a cannocchiale».', 'Convergence by comparison: for n ≥ 2, 1/n² < 1/(n(n−1)) = 1/(n−1) − 1/n, which telescopes.'), formula: 'Σ 1/n² < 1 + Σₙ≥₂ [1/(n−1) − 1/n] = 1 + 1 = 2' },
        { testo: t('La coda, dal confronto con l\'integrale di 1/x²: dice quanto manca dopo N termini.', 'The tail, from the integral of 1/x²: how much is missing after N terms.'), formula: '1/(N+1) < Σₙ>N 1/n² < 1/N' },
        { testo: t('Il valore: la serie di Fourier di f(x) = x² su [−π, π] ha coefficienti a₀ = 2π²/3, aₙ = 4(−1)ⁿ/n².', 'The value: the Fourier series of f(x) = x² on [−π, π] has a₀ = 2π²/3, aₙ = 4(−1)ⁿ/n².'), formula: 'x² = π²/3 + Σ 4(−1)ⁿ cos(nx) / n²' },
        { testo: t('In x = π, cos(nπ) = (−1)ⁿ e i segni si cancellano: (f è continua e periodica, la serie converge in ogni punto)', 'At x = π, cos(nπ) = (−1)ⁿ and the signs cancel (f is continuous and periodic, so the series converges pointwise):'), formula: 'π² = π²/3 + 4 Σ 1/n²   ⇒   Σ 1/n² = π²/6' }
      ],
      rivela: { testo: t('Il «π» viene dal cerchio nascosto nella periodicità: la serie di Fourier vive sul cerchio. È il primo valore della funzione zeta di Riemann, ζ(2) = π²/6, e ζ(2k) è sempre un multiplo razionale di π²ᵏ; per gli esponenti dispari non si sa quasi nulla (ζ(3) è irrazionale, Apéry 1978).', 'The "π" comes from the circle hidden in periodicity: Fourier series live on the circle. It is ζ(2) = π²/6; ζ(2k) is always a rational multiple of π²ᵏ, while odd values are mysterious (ζ(3) irrational, Apéry 1978).'),
        collegamenti: [
          t('Matematica → probabilità: due interi a caso sono coprimi con probabilità 1/ζ(2) = 6/π² ≈ 0,608 (lo misuro qui sotto).', 'Mathematics → probability: two random integers are coprime with probability 6/π² ≈ 0.608 (measured below).'),
          t('Matematica → fisica: ζ(4) = π⁴/90 dà la costante di Stefan-Boltzmann del corpo nero; ζ(−3) regolarizzata compare nell\'effetto Casimir.', 'Mathematics → physics: ζ(4) = π⁴/90 gives the Stefan-Boltzmann constant; regularised ζ(−3) appears in the Casimir effect.'),
          t('Matematica → chimica: le somme di reticolo (costante di Madelung) sono serie dello stesso tipo, convergenti solo con l\'ordine giusto.', 'Mathematics → chemistry: lattice sums (Madelung constant) are similar series, convergent only in the right order.')
        ],
        esercizi: [
          { livello: 0, testo: t('Calcola a mano 1 + 1/4 + 1/9 + 1/16. Di quanto si discosta da π²/6?', 'Compute 1 + 1/4 + 1/9 + 1/16 by hand. How far from π²/6?'), soluzione: '1,4236; mancano circa 0,221 (la coda è fra 1/5 = 0,2 e 1/4 = 0,25).' },
          { livello: 1, testo: t('Usa la serie di Fourier di x² in x = 0 per trovare 1 − 1/4 + 1/9 − 1/16 + …', 'Use the Fourier series of x² at x = 0 to find 1 − 1/4 + 1/9 − 1/16 + …'), soluzione: '0 = π²/3 + 4 Σ (−1)ⁿ/n² ⇒ Σ (−1)ⁿ⁺¹/n² = π²/12.' },
          { livello: 2, testo: t('Con l\'identità di Parseval applicata a f(x) = x, ricava ζ(2); con f(x) = x², ricava ζ(4).', 'Using Parseval on f(x) = x, derive ζ(2); on f(x) = x², derive ζ(4).'), soluzione: t('x ha coefficienti bₙ = 2(−1)ⁿ⁺¹/n: (1/π)∫x² = 2π²/3 = Σ 4/n² ⇒ ζ(2) = π²/6. Per x²: ζ(4) = π⁴/90.', 'x has bₙ = 2(−1)ⁿ⁺¹/n: 2π²/3 = Σ 4/n² ⇒ ζ(2) = π²/6; for x²: ζ(4) = π⁴/90.') },
          { livello: 3, testo: t('Ricerca: perché non esiste una formula «alla Eulero» per ζ(3)? Che cosa dice il teorema di Ball–Rivoal sui valori dispari?', 'Research: why is there no Euler-type formula for ζ(3)? What does the Ball–Rivoal theorem say about odd values?'), soluzione: t('Il metodo di Eulero usa la fattorizzazione di sin x, che produce solo potenze pari. Ball–Rivoal (2001): infiniti ζ(2k+1) sono irrazionali, ma per ζ(5) non si sa ancora.', 'Euler\'s method factorises sin x, producing only even powers. Ball–Rivoal (2001): infinitely many ζ(2k+1) are irrational; ζ(5) is still unknown.') }
        ] }
    }
  ];

  /* ═══ LE SCENE 3D ═══════════════════════════════════════════════════════════
     Ogni scena: crea(T, gruppo) → controllore { fase(nome), passo(dt) → misure, bersaglio() }.
     Le dimensioni sono in metri dello studio: il «banco» della lezione e' alto 1 m. */
  function sferaNeon(T, r, col) { return new T.Mesh(new T.SphereGeometry(r, 32, 24), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.35 })); }
  function etichetta(T, testo, col) {
    var c = document.createElement('canvas'), q = c.getContext('2d'); c.width = 512; c.height = 96;
    q.font = 'bold 54px system-ui,sans-serif'; q.fillStyle = col || '#cfe3ff'; q.textBaseline = 'middle'; q.fillText(testo, 8, 48);
    var tx = new T.CanvasTexture(c), s = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthTest: false })); s.scale.set(0.5, 0.094, 1); s.renderOrder = 20;
    s.aggiorna = function (nuovo) { q.clearRect(0, 0, 512, 96); q.fillText(nuovo, 8, 48); tx.needsUpdate = true; }; return s;
  }
  var SCENE = {
    caduta: function (T, g) {
      var S = 1 / 20, h = 20, v0 = 6, base = new T.Vector3(0, 0.0, 0);   /* 20 m reali → 1 m di scena */
      var torre = new T.Mesh(new T.BoxGeometry(0.12, h * S, 0.12), new T.MeshStandardMaterial({ color: 0x23303f, metalness: 0.6, roughness: 0.4 })); torre.position.set(-0.3, h * S / 2, 0); g.add(torre);
      var A = sferaNeon(T, 0.03, 0x2f9bff), B = sferaNeon(T, 0.03, 0xff8a3d); g.add(A); g.add(B);
      var eA = etichetta(T, 't = 0,00 s', '#9fd0ff'), eB = etichetta(T, 't = 0,00 s', '#ffc29a'); eA.position.set(-0.55, 1.12, 0); eB.position.set(0.25, 1.12, 0); g.add(eA); g.add(eB);
      var trA = [], trB = [], linea = function (col) { var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(600 * 3), 3)); geo.setDrawRange(0, 0); var l = new T.Line(geo, new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.8 })); g.add(l); return l; }, lA = linea(0x2f9bff), lB = linea(0xff8a3d);
      var st = { t: 0, va: false, k: 0, fineA: null, fineB: null };
      function pos(vx, tt) { var tf = Math.sqrt(2 * h / 9.81), tc = Math.min(tt, tf); return [-0.24 + vx * tc * S, Math.max(0, h - 0.5 * 9.81 * tc * tc) * S]; }
      function posa() { var a = pos(0, st.t), b = pos(v0, st.t); A.position.set(-0.24, a[1] + 0.03, 0.06); B.position.set(b[0], b[1] + 0.03, -0.06); }
      posa();
      return {
        fase: function (f) { if (f === 'testa') { st.t = 0; st.va = true; trA = []; trB = []; st.fineA = st.fineB = null; } else if (f === 'predici') { st.t = 0; st.va = false; posa(); } },
        passo: function (dt) {
          if (!st.va) return null;
          st.t += dt * 0.8; posa();   /* rallentato: si vede meglio */
          var tf = Math.sqrt(2 * h / 9.81);
          trA.push(A.position.clone()); trB.push(B.position.clone());
          [[lA, trA], [lB, trB]].forEach(function (x) { var a = x[0].geometry.attributes.position.array, n = Math.min(600, x[1].length); for (var i = 0; i < n; i++) { a[3 * i] = x[1][i].x; a[3 * i + 1] = x[1][i].y; a[3 * i + 2] = x[1][i].z; } x[0].geometry.attributes.position.needsUpdate = true; x[0].geometry.setDrawRange(0, n); });
          var tA = Math.min(st.t, tf), tB = Math.min(st.t, tf);
          eA.aggiorna('t = ' + tA.toFixed(2).replace('.', ',') + ' s'); eB.aggiorna('t = ' + tB.toFixed(2).replace('.', ',') + ' s');
          if (st.t >= tf) { st.va = false; var R = calcolo.caduta(h, v0); return { fine: true, tA: R.tA, tB: R.tB, gittata: R.gittata }; }
          return null;
        },
        bersaglio: function () { return B.getWorldPosition(new T.Vector3()); }
      };
    },
    acqua: function (T, g) {
      var O = sferaNeon(T, 0.07, 0xff3b3b); O.position.set(0, 0.55, 0); g.add(O);
      var R = calcolo.vsepr(2, 2, 1, 6000), cur = R.punti.map(function (p) { return p.slice(); });
      var H = [sferaNeon(T, 0.045, 0xf2f6ff), sferaNeon(T, 0.045, 0xf2f6ff)], LP = [0, 1].map(function () { var m = new T.Mesh(new T.SphereGeometry(0.06, 24, 16), new T.MeshStandardMaterial({ color: 0x7c6cff, transparent: true, opacity: 0.45, emissive: 0x4a3dff, emissiveIntensity: 0.5 })); m.scale.set(0.7, 0.7, 1.3); return m; });
      H.concat(LP).forEach(function (m) { g.add(m); });
      var legami = [0, 1].map(function () { var m = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1, 10), new T.MeshStandardMaterial({ color: 0xdfe8ff, metalness: 0.4, roughness: 0.3 })); g.add(m); return m; });
      var arco = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0x6bcfff })); g.add(arco);
      var lab = etichetta(T, '', '#9fe8ff'); lab.position.set(0.18, 0.78, 0); g.add(lab);
      var st = { bersaglio: R.punti, va: false, fase: 0, t: 0 };
      function disegna() {
        var c = O.position, L = 0.22;
        for (var i = 0; i < 2; i++) {
          var p = new T.Vector3(cur[i][0], cur[i][1], cur[i][2]).normalize(); H[i].position.copy(c).addScaledVector(p, L);
          var mid = c.clone().addScaledVector(p, L / 2); legami[i].position.copy(mid); legami[i].scale.set(1, L, 1); legami[i].quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), p);
          var q = new T.Vector3(cur[i + 2][0], cur[i + 2][1], cur[i + 2][2]).normalize(); LP[i].position.copy(c).addScaledVector(q, 0.13); LP[i].quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), q);
        }
        var a = new T.Vector3().fromArray(cur[0]).normalize(), b = new T.Vector3().fromArray(cur[1]).normalize(), ang = Math.acos(Math.max(-1, Math.min(1, a.dot(b)))), pts = [];
        var ax = new T.Vector3().crossVectors(a, b).normalize(); for (var k = 0; k <= 24; k++) pts.push(c.clone().addScaledVector(a.clone().applyAxisAngle(ax, ang * k / 24), 0.1));
        arco.geometry.setFromPoints(pts); lab.aggiorna('H–O–H = ' + (ang * 180 / Math.PI).toFixed(1).replace('.', ',') + '°');
        return ang * 180 / Math.PI;
      }
      disegna();
      return {
        fase: function (f) { if (f === 'testa') { st.va = true; st.fase = 0; st.t = 0; st.bersaglio = calcolo.vsepr(2, 2, 1, 6000).punti; } },
        passo: function (dt) {
          g.rotation.y += dt * 0.25;
          if (!st.va) { disegna(); return null; }
          st.t += dt;
          if (st.fase === 0 && st.t > 3.5) { st.fase = 1; st.t = 0; st.bersaglio = calcolo.vsepr(2, 2, 1.25, 6000).punti; }
          for (var i = 0; i < 4; i++) for (var k = 0; k < 3; k++) cur[i][k] += (st.bersaglio[i][k] - cur[i][k]) * Math.min(1, dt * 2.2);
          var ang = disegna();
          if (st.fase === 1 && st.t > 3.5) { st.va = false; return { fine: true, uguali: calcolo.vsepr(2, 2, 1, 8000).angolo, acqua: calcolo.vsepr(2, 2, 1.25, 8000).angolo, mostrato: ang }; }
          return null;
        },
        bersaglio: function () { return O.getWorldPosition(new T.Vector3()); }
      };
    },
    basilea: function (T, g) {
      var N = 40, colonne = [], arancio = [], scala = 0.45;
      for (var n = 1; n <= N; n++) {
        var m = new T.Mesh(new T.BoxGeometry(0.035, 1, 0.035), new T.MeshStandardMaterial({ color: 0x2f9bff, emissive: 0x1a5bd0, emissiveIntensity: 0.4 })); m.position.set(-0.7 + n * 0.036, 0, 0.05); m.scale.y = 0.0001; g.add(m); colonne.push(m);
        var a = new T.Mesh(new T.BoxGeometry(0.035, 1, 0.035), new T.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xa04a10, emissiveIntensity: 0.35, transparent: true, opacity: 0.6 })); a.position.set(-0.7 + n * 0.036, 0, -0.05); a.scale.y = 0.0001; g.add(a); arancio.push(a);
      }
      var lim = new T.Mesh(new T.BoxGeometry(1.5, 0.004, 0.18), new T.MeshBasicMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.7 })); lim.position.set(0.05, Math.PI * Math.PI / 6 * scala, 0); lim.visible = false; g.add(lim);
      var lab = etichetta(T, 'S = 0', '#9fd0ff'), labL = etichetta(T, 'π²/6 = 1,6449', '#6bcfff'); lab.position.set(-0.3, 1.25, 0); labL.position.set(0.35, Math.PI * Math.PI / 6 * scala + 0.06, 0); labL.visible = false; g.add(lab); g.add(labL);
      var st = { n: 0, t: 0, va: false };
      return {
        fase: function (f) { if (f === 'testa') { st.va = true; st.n = 0; st.t = 0; colonne.concat(arancio).forEach(function (c) { c.scale.y = 0.0001; c.position.y = 0; }); lim.visible = labL.visible = false; } },
        passo: function (dt) {
          if (!st.va) return null;
          st.t += dt; var nn = Math.min(N, Math.floor(st.t * 9));
          for (var i = st.n; i < nn; i++) {
            var S = calcolo.parziale(i + 1), Sh = calcolo.armonica(i + 1);
            colonne[i].scale.y = S * scala; colonne[i].position.y = S * scala / 2;
            arancio[i].scale.y = Math.min(Sh * scala, 2.2); arancio[i].position.y = Math.min(Sh * scala, 2.2) / 2;
          }
          st.n = nn; lab.aggiorna('S' + nn + ' = ' + calcolo.parziale(Math.max(1, nn)).toFixed(4).replace('.', ','));
          if (nn >= N) { st.va = false; lim.visible = labL.visible = true; return { fine: true, S40: calcolo.parziale(40), S1000: calcolo.parziale(1000), H40: calcolo.armonica(40), coprimi: calcolo.coprimi(20000, 1e6, 7) }; }
          return null;
        },
        bersaglio: function () { return colonne[N - 1].getWorldPosition(new T.Vector3()); }
      };
    }
  };

  globale.BSIStudioLezioni = { LEZIONI: LEZIONI, SCENE: SCENE, calcolo: calcolo, versione: '1.0' };
  if (typeof module !== 'undefined' && module.exports) module.exports = globale.BSIStudioLezioni;
})(typeof window !== 'undefined' ? window : globalThis);
