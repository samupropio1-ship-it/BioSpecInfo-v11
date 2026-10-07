/* ═══════════════════════════════════════════════════════════════════════════
   BSI GEOM3D — coordinate tridimensionali da uno SMILES

   PERCHE' SERVE, E PERCHE' NON BASTAVA QUELLO CHE C'ERA

   Il visore 3D dell'applicazione DISEGNA coordinate, non le costruisce: le
   riceve da un file SDF scaricato da PubChem. Questo ha due conseguenze che
   contano.

   1. Una molecola DISEGNATA dall'utente non ha un file su PubChem, quindi non
      si può vedere in tre dimensioni. Si può vedere solo ciò che qualcun
      altro ha già depositato.

   2. La numerazione degli atomi di un SDF di PubChem non ha NIENTE a che
      vedere con quella di RDKit, che è quella usata dal predittore NMR.
      Collegare un picco a un atomo del visore 3D illuminerebbe l'atomo
      sbagliato — e un'assegnazione sbagliata che sembra giusta è peggio di
      nessuna assegnazione.

   Questo modulo costruisce le coordinate PARTENDO DALLO STESSO GRAFO che usa
   il predittore, e garantisce per costruzione che l'atomo `i` qui sia l'atomo
   `i` là. È la condizione senza la quale la sincronia picco↔struttura↔3D non
   si può fare onestamente.

   IL METODO: GEOMETRIA DELLE DISTANZE

   Non si cerca di «costruire» la molecola atomo per atomo camminando il
   grafo: su un anello quel metodo deve chiudere il cerchio e non ci riesce
   senza casi particolari. Si fa invece quello che fanno i programmi seri, in
   piccolo:

   1. Si scrive una MATRICE DI LIMITI: per ogni coppia di atomi, una distanza
      minima e una massima che la topologia impone.
        · legati (1-2)      → la lunghezza di legame, ±2 %
        · a due legami (1-3) → dalla lunghezza e dall'angolo di valenza
        · dentro un anello   → le diagonali del poligono regolare, che
                               impongono la planarità senza doverla chiedere
        · lontani            → solo un minimo, perché due atomi non si
                               compenetrano
   2. Si parte da posizioni casuali ma RIPRODUCIBILI (il generatore è
      seminato dallo SMILES: la stessa molecola dà sempre la stessa forma).
   3. Si scende lungo il gradiente della somma delle violazioni finché non
      resta quasi niente da correggere.

   CHE COSA NON FA, E VA DETTO

   Non è un campo di forze e non minimizza un'energia: minimizza violazioni
   geometriche. Non sceglie il conformero più stabile — di una catena lunga
   dà UNA conformazione ammissibile, non quella giusta. Non gestisce la
   stereochimica: un centro R e il suo enantiomero S escono uguali, e due
   sostituenti cis o trans attorno a un doppio legame possono uscire
   scambiati. Serve a GUARDARE una molecola e a misurarne angoli e distanze
   di legame, non a fare modellistica.

   Tutto questo è misurato dal banco `test_geom3d`, che lo verifica contro i
   valori ideali: benzene planare e C–C a 1,39 Å, cicloesano NON planare,
   angoli tetraedrici a 109,5°, alchini diritti a 180°.

   USO   BSIGeom3D.coordina('CCO')
         → { atomi:[{i, el, x, y, z}], legami:[{a,b,bo}], scarto, iterazioni }

   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Le lunghezze di legame

     Valori di letteratura, in ångström. La chiave è la coppia di elementi in
     ordine alfabetico più l'ordine del legame ('a' per aromatico). Quando una
     coppia non c'è si somma il raggio covalente: è una stima, ma è una stima
     con un criterio, non un numero inventato.
     ═════════════════════════════════════════════════════════════════════════ */
  var LEGAMI = {
    'C-C1': 1.54, 'C-C2': 1.34, 'C-C3': 1.20, 'C-Ca': 1.39,
    'C-N1': 1.47, 'C-N2': 1.28, 'C-N3': 1.16, 'C-Na': 1.34,
    'C-O1': 1.43, 'C-O2': 1.21, 'C-Oa': 1.36,
    'C-S1': 1.82, 'C-S2': 1.60, 'C-Sa': 1.71,
    'C-F1': 1.35, 'C-Cl1': 1.77, 'C-Br1': 1.94, 'C-I1': 2.14,
    'C-H1': 1.09, 'C-P1': 1.84, 'C-Si1': 1.87, 'C-B1': 1.56,
    'N-N1': 1.45, 'N-N2': 1.25, 'N-Na': 1.35,
    'N-O1': 1.40, 'N-O2': 1.21, 'N-H1': 1.01, 'N-S1': 1.68,
    'O-O1': 1.48, 'O-H1': 0.97, 'O-P1': 1.61, 'O-S1': 1.57, 'O-Si1': 1.63,
    'H-S1': 1.34, 'H-P1': 1.44,
    'S-S1': 2.05
  };

  /* raggi di van der Waals, per dire quanto vicini due atomi NON legati
     possono arrivare */
  var VDW = { H: 1.10, B: 1.92, C: 1.70, N: 1.55, O: 1.52, F: 1.47,
    Na: 2.27, Mg: 1.73, Si: 2.10, P: 1.80, S: 1.80, Cl: 1.75, K: 2.75,
    Ca: 2.31, Fe: 2.04, Zn: 2.01, Se: 1.90, Br: 1.85, I: 1.98, Pt: 1.75 };

  /* raggi covalenti, per le coppie che la tabella non prevede */
  var RAGGIO = { H: 0.31, B: 0.84, C: 0.76, N: 0.71, O: 0.66, F: 0.57,
    Na: 1.66, Mg: 1.41, Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, K: 2.03,
    Ca: 1.76, Fe: 1.32, Zn: 1.22, Se: 1.20, Br: 1.20, I: 1.39, Pt: 1.36 };

  function lunghezza(ea, eb, bo, aro) {
    var p = [ea, eb].sort();
    var k = p[0] + '-' + p[1] + (aro ? 'a' : String(bo || 1));
    if (LEGAMI[k] !== undefined) return LEGAMI[k];
    k = p[0] + '-' + p[1] + '1';
    if (LEGAMI[k] !== undefined) return LEGAMI[k];
    var ra = RAGGIO[ea] || 0.77, rb = RAGGIO[eb] || 0.77;
    var d = ra + rb;
    if (aro) return d * 0.93;
    if (bo === 2) return d * 0.88;
    if (bo === 3) return d * 0.78;
    return d;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Gli angoli di valenza

     L'angolo lo decide il NUMERO STERICO: quanti partner σ più quante coppie
     solitarie. Due partner e un legame triplo vogliono 180°, tre partner
     attorno a un sp² vogliono 120°, quattro vogliono 109,5°. L'ossigeno
     dell'acqua ne ha due di partner ma due coppie solitarie, e sta a 104,5°.

     Dentro un anello piccolo l'angolo non è libero: lo impone il poligono, e
     il ciclopropano sta a 60° che lo voglia o no. Per questo l'angolo di un
     atomo d'anello viene preso dal poligono quando l'anello è piccolo.
     ═════════════════════════════════════════════════════════════════════════ */
  function angoloDi(gr, i) {
    var a = gr.atomi[i];
    var nSigma = a.vicini.length + a.h;
    var maxBo = 1, aro = a.aro;
    for (var k = 0; k < a.ordini.length; k++) {
      if (a.ordini[k] > maxBo) maxBo = a.ordini[k];
    }
    if (maxBo === 3 || (a.sim === 'C' && nSigma === 2)) return 180;
    if (aro || maxBo === 2) return 120;
    if (a.sim === 'O' && nSigma === 2) return 104.5;
    if (a.sim === 'N' && nSigma === 3) return 107.0;
    if (a.sim === 'S' && nSigma === 2) return 98.0;
    return 109.47;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · Il grafo e i suoi anelli

     Si riusa `BSINMR.grafoDa`, che è il punto in cui il progetto legge una
     molecola: gli indici che escono di qui sono quelli del predittore, ed è
     esattamente la garanzia che rende lecito il collegamento picco↔atomo.
     ═════════════════════════════════════════════════════════════════════════ */
  function anelliDi(gr) {
    if (globale.BSINMR && globale.BSINMR.anelli) return globale.BSINMR.anelli(gr);
    return [];
  }

  function distanzeTopologiche(gr, max) {
    var n = gr.atomi.length;
    var D = [];
    for (var i = 0; i < n; i++) {
      var d = new Array(n);
      d[i] = 0;
      var coda = [i];
      while (coda.length) {
        var u = coda.shift();
        if (d[u] >= max) continue;
        for (var k = 0; k < gr.atomi[u].vicini.length; k++) {
          var v = gr.atomi[u].vicini[k];
          if (d[v] !== undefined) continue;
          d[v] = d[u] + 1; coda.push(v);
        }
      }
      D.push(d);
    }
    return D;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · La matrice dei limiti
     ═════════════════════════════════════════════════════════════════════════ */
  /* I gruppi di atomi che devono stare su UN PIANO.

     Le distanze non bastano a dirlo. Dentro un anello aromatico le diagonali
     del poligono impongono la planarita' di quell'anello, ma due anelli
     CONDENSATI — il naftalene — condividono un legame e possono piegarsi
     l'uno sull'altro come un libro: ogni diagonale di ogni anello resta
     giusta e il naftalene esce a libro aperto, 0,18 A fuori dal piano.

     Un sistema aromatico e' una componente connessa di atomi aromatici, e va
     trattato come un pezzo unico. Ci si mettono dentro anche gli idrogeni
     attaccati: stanno sul piano anche loro. */
  function planari(gr) {
    var visti = {}, fuori = [];
    for (var i = 0; i < gr.atomi.length; i++) {
      if (!gr.atomi[i].aro || visti[i]) continue;
      var comp = [], coda = [i];
      visti[i] = 1;
      while (coda.length) {
        var u = coda.shift();
        comp.push(u);
        gr.atomi[u].vicini.forEach(function (v) {
          if (gr.atomi[v].aro && !visti[v]) { visti[v] = 1; coda.push(v); }
        });
      }
      if (comp.length < 4) continue;
      var conH = comp.slice();
      comp.forEach(function (u) {
        gr.atomi[u].vicini.forEach(function (v) {
          if (gr.atomi[v].sim === 'H' && conH.indexOf(v) < 0) conH.push(v);
        });
      });
      fuori.push(conH);
    }
    return fuori;
  }

  /* la normale del piano migliore di un gruppo di punti, per iterazione di
     potenza sulla matrice (traccia·I − covarianza): l'autovettore maggiore di
     quella e' l'autovettore minore della covarianza, cioe' la normale */
  function normaleDi(X, lista) {
    var n = lista.length, cx = 0, cy = 0, cz = 0, k;
    for (k = 0; k < n; k++) {
      cx += X[lista[k] * 3]; cy += X[lista[k] * 3 + 1]; cz += X[lista[k] * 3 + 2];
    }
    cx /= n; cy /= n; cz /= n;
    var Sxx = 0, Syy = 0, Szz = 0, Sxy = 0, Sxz = 0, Syz = 0;
    for (k = 0; k < n; k++) {
      var x = X[lista[k] * 3] - cx, y = X[lista[k] * 3 + 1] - cy,
          z = X[lista[k] * 3 + 2] - cz;
      Sxx += x * x; Syy += y * y; Szz += z * z;
      Sxy += x * y; Sxz += x * z; Syz += y * z;
    }
    var tr = Sxx + Syy + Szz;
    var vx = 0.577, vy = 0.577, vz = 0.577;
    for (var it = 0; it < 40; it++) {
      var wx = tr * vx - (Sxx * vx + Sxy * vy + Sxz * vz);
      var wy = tr * vy - (Sxy * vx + Syy * vy + Syz * vz);
      var wz = tr * vz - (Sxz * vx + Syz * vy + Szz * vz);
      var nn = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1e-9;
      vx = wx / nn; vy = wy / nn; vz = wz / nn;
    }
    return { cx: cx, cy: cy, cz: cz, nx: vx, ny: vy, nz: vz };
  }

  /* appiattisce un gruppo verso il suo piano migliore, di una frazione: non
     tutto d'un colpo, altrimenti i legami si rompono e il passo successivo
     deve rifarli da capo */
  function appiattisci(X, lista, quota) {
    var pl = normaleDi(X, lista), peggio = 0;
    for (var k = 0; k < lista.length; k++) {
      var a = lista[k] * 3;
      var d = (X[a] - pl.cx) * pl.nx + (X[a + 1] - pl.cy) * pl.ny +
              (X[a + 2] - pl.cz) * pl.nz;
      if (Math.abs(d) > peggio) peggio = Math.abs(d);
      X[a]     -= quota * d * pl.nx;
      X[a + 1] -= quota * d * pl.ny;
      X[a + 2] -= quota * d * pl.nz;
    }
    return peggio;
  }

  /* Le terne che devono stare in RIGA.

     Un angolo di 180° e' il caso in cui la distanza fra i due estremi e' il
     MASSIMO possibile, e vicino a un massimo la derivata si annulla: quattro
     millesimi di angstrom di scarto valgono sette gradi. Il propino usciva a
     173° con uno scarto che su un angolo tetraedrico non si vedrebbe
     nemmeno. Una distanza, da sola, non sa dire «dritto».

     Si raddrizza quindi per costruzione, come si appiattisce un aromatico:
     si prende la direzione dei due bracci e si rimettono gli estremi in riga,
     conservando le lunghezze. */
  function lineari(gr) {
    var fuori = [];
    for (var i = 0; i < gr.atomi.length; i++) {
      if (angoloDi(gr, i) < 165) continue;
      var v = gr.atomi[i].vicini;
      for (var p = 0; p < v.length; p++) {
        for (var q = p + 1; q < v.length; q++) {
          var terna = [v[p], i, v[q]];
          var rami = ramiDi(gr, terna);
          if (rami) fuori.push({ terna: terna, rami: rami });
        }
      }
    }
    return fuori;
  }

  /* I due RAMI che partono da una terna lineare.

     Raddrizzare un alchino spostando i soli atomi terminali non funziona: in
     CH₃–C≡C–H l'atomo del metile si sposta e i suoi tre idrogeni restano
     dove sono, i legami C–H si allungano, il passo dopo li riaccorcia
     tirando indietro il carbonio, e l'angolo torna piegato. Il propino si
     fermava a 157° con i legami stirati del sette per cento.

     Un ramo va ruotato TUTTO INSIEME, come un corpo rigido: così nessuna
     distanza interna cambia e l'unica cosa che si muove è l'angolo, che è
     quello che si voleva. */
  function ramiDi(gr, terna) {
    function ramo(da, senza) {
      var visti = {}, out = [], coda = [da];
      visti[da] = 1; visti[senza] = 1;
      while (coda.length) {
        var u = coda.shift();
        out.push(u);
        gr.atomi[u].vicini.forEach(function (v) {
          if (!visti[v]) { visti[v] = 1; coda.push(v); }
        });
      }
      return out;
    }
    var ra = ramo(terna[0], terna[1]);
    var rb = ramo(terna[2], terna[1]);
    /* se i due rami si toccano, il centro sta su un anello e non c'è una
       rotazione sensata: si lascia stare invece di storcere l'anello */
    var dentro = {};
    ra.forEach(function (x) { dentro[x] = 1; });
    for (var k = 0; k < rb.length; k++) if (dentro[rb[k]]) return null;
    return { a: ra, b: rb };
  }

  /* rotazione di Rodrigues di un insieme di atomi attorno a un asse passante
     per il centro */
  function ruota(X, lista, centro, ax, ay, az, ang) {
    var c = Math.cos(ang), s2 = Math.sin(ang), uc = 1 - c;
    var cx = X[centro * 3], cy = X[centro * 3 + 1], cz = X[centro * 3 + 2];
    for (var k = 0; k < lista.length; k++) {
      var i = lista[k] * 3;
      var px = X[i] - cx, py = X[i + 1] - cy, pz = X[i + 2] - cz;
      var dot = ax * px + ay * py + az * pz;
      var crx = ay * pz - az * py, cry = az * px - ax * pz, crz = ax * py - ay * px;
      X[i]     = cx + px * c + crx * s2 + ax * dot * uc;
      X[i + 1] = cy + py * c + cry * s2 + ay * dot * uc;
      X[i + 2] = cz + pz * c + crz * s2 + az * dot * uc;
    }
  }

  /* porta la terna verso i 180°, ruotando i due rami in parti uguali.
     Restituisce l'errore angolare che c'era, in radianti. */
  function raddrizza(X, terna, rami, quota) {
    var a = terna[0] * 3, i = terna[1] * 3, b = terna[2] * 3;
    var ux = X[a] - X[i], uy = X[a + 1] - X[i + 1], uz = X[a + 2] - X[i + 2];
    var vx = X[b] - X[i], vy = X[b + 1] - X[i + 1], vz = X[b + 2] - X[i + 2];
    var nu = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1e-9;
    var nv = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1e-9;
    ux /= nu; uy /= nu; uz /= nu; vx /= nv; vy /= nv; vz /= nv;
    var cs = Math.max(-1, Math.min(1, ux * vx + uy * vy + uz * vz));
    var err = Math.PI - Math.acos(cs);
    if (err < 1e-5) return err;
    /* l'asse di rotazione è la normale al piano dei due bracci */
    var ax = uy * vz - uz * vy, ay = uz * vx - ux * vz, az = ux * vy - uy * vx;
    var na = Math.sqrt(ax * ax + ay * ay + az * az);
    if (na < 1e-7) return err;      /* già allineati o antiallineati */
    ax /= na; ay /= na; az /= na;
    var mezzo = quota * err / 2;
    ruota(X, rami.a, terna[1], ax, ay, az, -mezzo);
    ruota(X, rami.b, terna[1], ax, ay, az, mezzo);
    return err;
  }

  function limiti(gr) {
    var n = gr.atomi.length;
    var basso = [], alto = [], peso = [];
    for (var i = 0; i < n; i++) {
      basso.push(new Float64Array(n));
      alto.push(new Float64Array(n));
      peso.push(new Float64Array(n));
      for (var j = 0; j < n; j++) { alto[i][j] = 1e3; }
    }
    function metti(i, j, lo, hi, p) {
      if (i === j) return;
      /* Un limite più STRETTO vince su uno più largo: le regole vanno dalla
         più generica alla più specifica e l'ultima parola è della più
         informata. */
      if (peso[i][j] > p) return;
      basso[i][j] = basso[j][i] = lo;
      alto[i][j] = alto[j][i] = hi;
      peso[i][j] = peso[j][i] = p;
    }

    var D = distanzeTopologiche(gr, 4);
    var cicli = anelliDi(gr);

    /* Dentro un anello l'angolo NON e' quello dell'ibridazione: lo impone il
       poligono. In un anello aromatico a cinque termini — l'imidazolo della
       caffeina, il furano, il pirrolo — l'angolo interno vale 108°, non i 120
       dell'sp². Imponendo 120 a un pentagono si chiede una cosa impossibile,
       e il residuo non scende: la caffeina si fermava con un decimo di
       angstrom di violazione. Qui, quando i tre atomi stanno tutti nello
       stesso ciclo, comanda il ciclo. */
    function anelloComune(i, a, b) {
      for (var k = 0; k < cicli.length; k++) {
        var c = cicli[k];
        if (c.length < 3 || c.length > 6) continue;
        if (c.indexOf(i) >= 0 && c.indexOf(a) >= 0 && c.indexOf(b) >= 0) return c.length;
      }
      return 0;
    }

    /* 4.1 · i non legati: non si compenetrano, e basta */
    for (i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        if (D[i][j] !== undefined && D[i][j] <= 3) continue;
        /* I raggi di van der Waals, non due costanti. Con 1,1 Å per ogni
           idrogeno e 1,6 per ogni atomo pesante, due idrogeni lontani sul
           grafo potevano avvicinarsi a 1,80 Å — un contatto che non esiste.
           Un fattore 0,88 sulla somma dei raggi lascia il contatto stretto
           ma possibile, che e' quello che serve a un modello da guardare. */
        var rr = (VDW[gr.atomi[i].sim] || 1.7) + (VDW[gr.atomi[j].sim] || 1.7);
        metti(i, j, rr * 0.88, 1e3, 1);
      }
    }

    /* 4.2 · i legati (1-2): la lunghezza di legame */
    gr.legami.forEach(function (l) {
      var aro = gr.atomi[l.a].aro && gr.atomi[l.b].aro;
      var d = lunghezza(gr.atomi[l.a].sim, gr.atomi[l.b].sim, l.bo, aro);
      /* ESATTO, non un intervallo. Un intervallo lascia la soluzione
         appoggiata a un bordo — e un legame C–H corto dell'1 % allarga
         l'angolo tetraedrico di un grado e mezzo, perche' la stessa distanza
         H···H vista da due legami piu' corti significa un angolo piu' largo. */
      metti(l.a, l.b, d, d, 10);
    });

    /* 4.3 · a due legami (1-3): l'angolo di valenza, come distanza.

       L'angolo si impone ESATTO, non come intervallo. Con un intervallo di
       ±4° il minimizzatore si fermava sul bordo e non al centro: il metano
       usciva a 115° invece di 109,5 e il propino a 162° invece di 180, pur
       rispettando ogni limite. Un angolo di valenza e' rigido: non e' un
       intervallo, e' un valore. */
    for (i = 0; i < n; i++) {
      var vic = gr.atomi[i].vicini;
      var nvic = vic.length;
      var coppie = [];
      for (var p = 0; p < nvic; p++) {
        for (var q = p + 1; q < nvic; q++) {
          coppie.push({ p: p, q: q, a: vic[p], b: vic[q],
                        m: anelloComune(i, vic[p], vic[q]) });
        }
      }
      /* ── I tre angoli di un atomo PIANO devono fare 360° ────────────────
         Un carbonio sp² con tre vicini sta su un piano, e i suoi tre angoli
         sommano a un giro intero. Imporli indipendentemente, ciascuno dalla
         propria regola, li fa sommare a qualcos'altro: nella caffeina un
         carbonio di giunzione fra l'anello a cinque e quello a sei riceveva
         108° dal primo, 120° dal secondo e altri 120° dall'ibridazione per
         il terzo — 348 invece di 360, una richiesta impossibile che teneva
         il residuo a un decimo di angstrom senza farlo scendere.

         Qui gli angoli che vengono da un anello restano, e cio' che avanza
         si divide fra i rimanenti. */
      var piano = gr.atomi[i].aro || angoloDi(gr, i) === 120;
      var gradiDi = {};
      if (piano && nvic === 3) {
        var somma = 0, liberi = [];
        coppie.forEach(function (c) {
          if (c.m) { var g = (c.m - 2) * 180 / c.m;
                     gradiDi[c.p + ',' + c.q] = g; somma += g; }
          else liberi.push(c);
        });
        if (liberi.length && liberi.length < 3) {
          var resto = (360 - somma) / liberi.length;
          /* un angolo non puo' essere assurdo nemmeno per far tornare la
             somma: fuori da 90-150° si lascia il valore dell'ibridazione e si
             accetta il residuo, invece di storcere la molecola */
          if (resto < 90 || resto > 150) resto = angoloDi(gr, i);
          liberi.forEach(function (c) { gradiDi[c.p + ',' + c.q] = resto; });
        }
      }
      coppie.forEach(function (c) {
        var a = c.a, b = c.b;
        var da = lunghezza(gr.atomi[a].sim, gr.atomi[i].sim,
                           gr.atomi[i].ordini[c.p], gr.atomi[a].aro && gr.atomi[i].aro);
        var db = lunghezza(gr.atomi[b].sim, gr.atomi[i].sim,
                           gr.atomi[i].ordini[c.q], gr.atomi[b].aro && gr.atomi[i].aro);
        var g2 = gradiDi[c.p + ',' + c.q];
        if (g2 === undefined) g2 = c.m ? ((c.m - 2) * 180 / c.m) : angoloDi(gr, i);
        var th = g2 * Math.PI / 180;
        var d13 = Math.sqrt(da * da + db * db - 2 * da * db * Math.cos(th));
        /* A 180° la distanza e' il MASSIMO possibile, e vicino a un massimo
           la derivata si annulla: un millesimo di angstrom di scarto vale
           gradi di angolo. Un angolo quasi diritto conta quanto un legame. */
        metti(a, b, d13, d13, g2 > 165 ? 10 : 5);
      });
    }

    /* 4.4 · dentro un anello: le diagonali del poligono regolare.
       È il modo di imporre la planarità SENZA chiederla: in un poligono
       regolare piano le diagonali hanno una lunghezza precisa, e se le si
       impone la planarità viene da sé. Si applica agli anelli AROMATICI, che
       piani lo sono davvero, e a quelli fino a cinque termini, che non hanno
       abbastanza libertà per non esserlo. Il cicloesano NON ci rientra, ed è
       giusto: non è piano, è a sedia. */
    cicli.forEach(function (c) {
      var m = c.length;
      if (m < 3 || m > 6) return;
      var tuttoAro = c.every(function (x) { return gr.atomi[x].aro; });
      /* Per un anello AROMATICO le diagonali non servono piu': ci sono gli
         angoli del poligono, che lo rendono rigido, e la proiezione sul piano
         del sistema aromatico, che lo rende piano. Imporre ANCHE le diagonali
         del poligono REGOLARE sarebbe una terza condizione in disaccordo con
         le prime due ogni volta che i lati non sono tutti uguali — e in un
         imidazolo, con C–N a 1,34 e C–C a 1,39, non lo sono mai. */
      if (tuttoAro) return;
      if (m > 5) return;
      /* il lato medio dell'anello */
      var lato = 0;
      for (var k = 0; k < m; k++) {
        var x = c[k], y = c[(k + 1) % m];
        var aroL = gr.atomi[x].aro && gr.atomi[y].aro;
        var bo = 1, vv = gr.atomi[x].vicini.indexOf(y);
        if (vv >= 0) bo = gr.atomi[x].ordini[vv];
        lato += lunghezza(gr.atomi[x].sim, gr.atomi[y].sim, bo, aroL);
      }
      lato /= m;
      /* in un poligono regolare di m lati, la distanza fra due vertici
         separati da s lati vale  lato · sin(sπ/m) / sin(π/m) */
      for (var s = 2; s <= Math.floor(m / 2); s++) {
        var d = lato * Math.sin(s * Math.PI / m) / Math.sin(Math.PI / m);
        for (var t = 0; t < m; t++) {
          /* Per un anello AROMATICO la diagonale e' esatta: sono gli angoli
             piu' le diagonali, insieme, a imporre la planarita'. Gli angoli
             da soli non bastano — il cicloesano ha tutti gli angoli a 109,5°
             ed e' a sedia, non piano: e' la distanza fra i due atomi in para
             che distingue un piano da una sedia.

             Per un anello non aromatico a tre, quattro o cinque termini la
             forma e' quasi obbligata ma i legami possono essere diversi fra
             loro, e il poligono regolare e' un'approssimazione: li' si lascia
             un margine invece di imporre una forma che non c'e'. */
          metti(c[t], c[(t + s) % m], d * 0.985, d * 1.015, 7);
        }
      }
    });

    /* 4.5 · a tre legami (1-4): fra la forma eclissata e quella distesa.
       Con rotazione libera la distanza può stare ovunque fra il valore cis e
       quello trans; qui si dà l'intervallo e si lascia che la minimizzazione
       scelga. Attorno a un doppio legame la rotazione non c'è, ma senza
       stereochimica non sappiamo da che parte: l'intervallo resta, ed è
       dichiarato nei limiti del modulo. */
    function d14(d1, d2, d3, t1, t2, fi) {
      /* A in origine, B sull'asse x; I nel piano xy; J ruotato di `fi`
         attorno all'asse del legame A–B. A fi = 0 i due estremi sono dalla
         stessa parte (eclissata, distanza minima), a fi = π opposti
         (distesa, distanza massima). */
      var ix = d1 * Math.cos(t1), iy = d1 * Math.sin(t1);
      var jx = d2 - d3 * Math.cos(t2);
      var jy = d3 * Math.sin(t2) * Math.cos(fi);
      var jz = d3 * Math.sin(t2) * Math.sin(fi);
      return Math.sqrt((ix - jx) * (ix - jx) + (iy - jy) * (iy - jy) + jz * jz);
    }

    /* Per ogni cammino i–a–b–j di tre legami: la distanza possibile va da
       quella eclissata a quella distesa, e la rotazione sceglie. La versione
       precedente metteva una COSTANTE (1,45 Å per legame, qualunque fossero
       gli atomi): per una coppia H···H attorno a un legame C–C l'intervallo
       giusto è circa 2,2–3,1 Å e quella costante ne imponeva 2,8–4,0, cioè
       un limite inferiore più lungo del massimo reale. Era un vincolo
       impossibile, in conflitto con gli angoli, e teneva tutta la molecola in
       tensione: i legami uscivano compressi e gli anelli incurvati. */
    gr.legami.forEach(function (lab) {
      var a = lab.a, b = lab.b;
      gr.atomi[a].vicini.forEach(function (i2, pi) {
        if (i2 === b) return;
        gr.atomi[b].vicini.forEach(function (j2, pj) {
          if (j2 === a || j2 === i2) return;
          if (peso[i2][j2] >= 5) return;         /* già fissato dall'anello */
          var aroAB = gr.atomi[a].aro && gr.atomi[b].aro;
          var d1 = lunghezza(gr.atomi[i2].sim, gr.atomi[a].sim,
                             gr.atomi[a].ordini[pi], gr.atomi[i2].aro && gr.atomi[a].aro);
          var d2 = lunghezza(gr.atomi[a].sim, gr.atomi[b].sim, lab.bo, aroAB);
          var d3 = lunghezza(gr.atomi[b].sim, gr.atomi[j2].sim,
                             gr.atomi[b].ordini[pj], gr.atomi[b].aro && gr.atomi[j2].aro);
          var t1 = angoloDi(gr, a) * Math.PI / 180;
          var t2 = angoloDi(gr, b) * Math.PI / 180;
          var lo = d14(d1, d2, d3, t1, t2, 0);
          var hi = d14(d1, d2, d3, t1, t2, Math.PI);
          metti(i2, j2, Math.min(lo, hi) * 0.97, Math.max(lo, hi) * 1.03, 3);
        });
      });
    });
    return { basso: basso, alto: alto, peso: peso,
             planari: planari(gr), lineari: lineari(gr) };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §5 · L'incastro

     Un generatore seminato DALLO SMILES: la stessa molecola dà sempre la
     stessa forma. Senza questo, riaprire la stessa molecola la mostrerebbe
     ogni volta diversa, e due immagini della stessa cosa non sarebbero
     confrontabili — lo stesso motivo per cui gli spettri di questo progetto
     non contengono rumore casuale.
     ═════════════════════════════════════════════════════════════════════════ */
  function seme(testo) {
    var h = 2166136261;
    for (var i = 0; i < testo.length; i++) {
      h ^= testo.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h || 1;
  }
  function caso(stato) {
    return function () {
      stato ^= stato << 13; stato >>>= 0;
      stato ^= stato >> 17;
      stato ^= stato << 5;  stato >>>= 0;
      return stato / 4294967296;
    };
  }

  /* Il minimizzatore e' una PROIEZIONE ITERATIVA, non una discesa del
     gradiente.

     Il primo tentativo scendeva lungo il gradiente della somma delle
     violazioni al quadrato, con un passo globale adattivo. Funzionava finche'
     i limiti erano larghi; stretti quanto serve per tenere un anello
     aromatico piano, non ci arrivava piu': l'etano usciva col legame a
     1,46 A contro il minimo di 1,52 imposto, cioe' la soluzione violava
     ancora i vincoli dopo seicento passi. Un passo unico per tutta la
     molecola e' il problema: quello che va bene per un legame e' troppo
     grande per una diagonale d'anello.

     Qui ogni vincolo violato viene SODDISFATTO direttamente, spostando i due
     atomi lungo la loro congiungente di meta' violazione ciascuno. E' il
     metodo di Gauss-Seidel, e i vincoli si applicano in ordine di
     IMPORTANZA CRESCENTE: prima i contatti, poi gli angoli, poi gli anelli,
     i legami per ultimi — cosi' l'ultima parola e' sempre della regola piu'
     informata, invece di una media fra regole in disaccordo. */
  function vincoliDa(lim, n) {
    var v = [];
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var p = lim.peso[i][j];
        if (!p) continue;
        v.push({ i: i, j: j, lo: lim.basso[i][j], hi: lim.alto[i][j], p: p });
      }
    }
    v.sort(function (a, b) { return a.p - b.p; });
    return v;
  }

  function incastra(lim, n, rnd, passi, vincoli, planari, lineari) {
    var X = new Float64Array(n * 3);
    var raggio = Math.max(2.5, Math.cbrt(n) * 1.6);
    for (var i = 0; i < n; i++) {
      X[i * 3]     = (rnd() - 0.5) * raggio * 2;
      X[i * 3 + 1] = (rnd() - 0.5) * raggio * 2;
      X[i * 3 + 2] = (rnd() - 0.5) * raggio * 2;
    }
    /* Le correzioni si ACCUMULANO e si applicano mediate, pesate
       sull'importanza del vincolo; non si applicano una per una.

       Applicandole in sequenza, l'ultima cancella le precedenti: in un
       metano le quattro distanze C–H (le piu' importanti, quindi applicate
       per ultime) spostavano gli idrogeni DOPO che i sei vincoli H···H
       avevano sistemato gli angoli, e gli angoli tornavano aperti. Uscivano
       115,5° invece di 109,5, e un alchino a 162° invece di 180.

       Mediando, ogni atomo si sposta UNA volta per passo, verso il
       compromesso fra tutto cio' che lo riguarda, e chi ha piu' peso tira di
       piu'. Nessun vincolo ha l'ultima parola perche' nessuno parla per
       ultimo. */
    var DX = new Float64Array(n * 3), W = new Float64Array(n);
    var peggiore = 0, it = 0;
    for (it = 0; it < passi; it++) {
      DX.fill(0); W.fill(0);
      peggiore = 0;
      for (var k = 0; k < vincoli.length; k++) {
        var c = vincoli[k];
        var a = c.i * 3, b = c.j * 3;
        var dx = X[a] - X[b], dy = X[a + 1] - X[b + 1], dz = X[a + 2] - X[b + 2];
        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 1e-7) {
          /* due atomi esattamente sovrapposti non hanno una direzione lungo
             cui separarsi: se ne prende una qualunque, una volta sola */
          dx = 1e-3; dy = 0; dz = 0; d = 1e-3;
        }
        var obiettivo = (d < c.lo) ? c.lo : (d > c.hi ? c.hi : 0);
        if (!obiettivo) continue;
        var viol = Math.abs(d - obiettivo);
        if (viol > peggiore) peggiore = viol;
        var f = (obiettivo - d) / d / 2;
        var sx = dx * f, sy = dy * f, sz = dz * f, w = c.p;
        DX[a] += w * sx; DX[a + 1] += w * sy; DX[a + 2] += w * sz;
        DX[b] -= w * sx; DX[b + 1] -= w * sy; DX[b + 2] -= w * sz;
        W[c.i] += w; W[c.j] += w;
      }
      if (peggiore < 0.0025 && !(lineari && lineari.length)) break;
      /* Rilassamento: piano all'inizio, quando le posizioni sono ancora
         casuali e le correzioni si contraddicono; poi SOPRA uno, perche' la
         media pesata di per se' corregge meno del dovuto — ogni atomo si
         muove verso un compromesso, e il compromesso e' sempre piu' vicino
         di dove bisogna arrivare. Con il rilassamento a uno il benzene si
         fermava a tremila passi con dodici millesimi di scarto. */
      var om = (it < 40) ? 0.5 : 1.7;
      for (i = 0; i < n; i++) {
        if (!W[i]) continue;
        var g = om / W[i];
        X[i * 3] += DX[i * 3] * g;
        X[i * 3 + 1] += DX[i * 3 + 1] * g;
        X[i * 3 + 2] += DX[i * 3 + 2] * g;
      }
      /* Le proiezioni vengono DOPO lo spostamento, non prima.

         Messe prima, lavoravano su posizioni che il passo successivo
         sovrascriveva con correzioni calcolate sulle posizioni VECCHIE: il
         propino, invece di raddrizzarsi, peggiorava — da 173° a 157°. Una
         proiezione geometrica e una correzione mediata non possono guardare
         due fotografie diverse della stessa molecola. */
      if (planari) {
        for (var z = 0; z < planari.length; z++) {
          appiattisci(X, planari[z], it < 40 ? 0.3 : 0.9);
        }
      }
      /* Le rotazioni sono RIGIDE: non rompono nessuna distanza interna, e si
         possono quindi applicare una per una senza che si disfino a vicenda. */
      if (lineari) {
        for (var y = 0; y < lineari.length; y++) {
          raddrizza(X, lineari[y].terna, lineari[y].rami, it < 40 ? 0.3 : 0.8);
        }
      }
    }

    /* ── La rifinitura, una per volta ────────────────────────────────────
       Vicino alla soluzione conviene smettere di mediare: ogni vincolo
       violato si soddisfa subito, spostando i due atomi di meta' violazione
       ciascuno. Lontano dalla soluzione questo oscilla — ed e' il motivo per
       cui non si parte cosi' — ma vicino converge in pochi giri. */
    for (var rif = 0; rif < 400; rif++) {
      peggiore = 0;
      for (var k2 = 0; k2 < vincoli.length; k2++) {
        var c2 = vincoli[k2];
        var a2 = c2.i * 3, b2 = c2.j * 3;
        var ex = X[a2] - X[b2], ey = X[a2 + 1] - X[b2 + 1], ez = X[a2 + 2] - X[b2 + 2];
        var e = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1e-6;
        var ob = (e < c2.lo) ? c2.lo : (e > c2.hi ? c2.hi : 0);
        if (!ob) continue;
        var vi = Math.abs(e - ob);
        if (vi > peggiore) peggiore = vi;
        var ff = 0.8 * (ob - e) / e / 2;
        X[a2] += ex * ff; X[a2 + 1] += ey * ff; X[a2 + 2] += ez * ff;
        X[b2] -= ex * ff; X[b2 + 1] -= ey * ff; X[b2 + 2] -= ez * ff;
      }
      if (planari) {
        for (var z2 = 0; z2 < planari.length; z2++) {
          var fp2 = appiattisci(X, planari[z2], 0.9);
          if (fp2 > peggiore) peggiore = fp2;
        }
      }
      if (lineari) {
        for (var y2 = 0; y2 < lineari.length; y2++) {
          /* l'errore angolare entra nella convergenza — convertito in
             angstrom sul braccio, perché mescolare radianti e distanze in uno
             stesso numero lo renderebbe illeggibile: lo scarto dichiarato va
             confrontato con una tolleranza, e una tolleranza ha un'unità */
          var er = raddrizza(X, lineari[y2].terna, lineari[y2].rami, 0.8);
          if (er * 1.4 > peggiore) peggiore = er * 1.4;
        }
      }
      if (peggiore < 0.0025) break;
    }
    return { X: X, scarto: Math.round(peggiore * 1000) / 1000, iterazioni: it };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §6 · Gli idrogeni, DOPO gli atomi pesanti

     Gli idrogeni si aggiungono in coda, con indici da `nPesanti` in su. È una
     scelta deliberata: così l'indice di un atomo pesante resta quello del
     predittore NMR, e illuminare «l'atomo 3» vuol dire lo stesso atomo nella
     struttura 2D, nello spettro e qui. Se gli H fossero mescolati, ogni
     indice slitterebbe e il collegamento illuminerebbe l'atomo sbagliato.
     ═════════════════════════════════════════════════════════════════════════ */
  function conIdrogeni(gr) {
    var n = gr.atomi.length;
    var atomi = gr.atomi.map(function (a) {
      return { i: a.i, sim: a.sim, aro: a.aro, h: a.h,
               vicini: a.vicini.slice(), ordini: a.ordini.slice() };
    });
    var legami = gr.legami.map(function (l) { return { a: l.a, b: l.b, bo: l.bo }; });
    var k = n;
    for (var i = 0; i < n; i++) {
      var q = gr.atomi[i].h || 0;
      for (var t = 0; t < q; t++) {
        atomi.push({ i: k, sim: 'H', aro: false, h: 0, vicini: [i], ordini: [1] });
        atomi[i].vicini.push(k); atomi[i].ordini.push(1);
        legami.push({ a: i, b: k, bo: 1 });
        k++;
      }
      /* Gli idrogeni ora sono ATOMI, e `h` deve tornare a zero. Lasciandolo
         pieno, il numero sterico li contava DUE volte: il metano risultava
         con otto partner invece di quattro, non rientrava in nessun caso e
         finiva nel ramo generico a 109,5° — ma con quattro H a 122° misurati,
         perché la tolleranza percentuale sulla distanza lasciava passare di
         tutto. E l'ossigeno di un alcol, con tre partner invece di due,
         perdeva i suoi 104,5° e usciva a 125°. */
      atomi[i].h = 0;
    }
    return { atomi: atomi, legami: legami, nPesanti: n };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §7 · L'ingresso pubblico
     ═════════════════════════════════════════════════════════════════════════ */
  function coordina(smiles, opz) {
    opz = opz || {};
    var R = globale.__rdkit;
    if (!R || !globale.BSINMR) return null;
    if (!smiles || !String(smiles).trim()) return null;
    var mol = null;
    try { mol = R.get_mol(String(smiles)); } catch (e) { return null; }
    if (!mol) return null;
    var fuori = null;
    try {
      var gr = globale.BSINMR.grafoDa(mol);
      var q = null;
      try {
        q = R.get_qmol('[a]');
        var m = mol.get_substruct_matches(q);
        var lista = (m && m !== '{}') ? JSON.parse(m) : [];
        if (Array.isArray(lista)) {
          lista.forEach(function (x) {
            if (x.atoms && x.atoms.length) gr.atomi[x.atoms[0]].aro = true;
          });
        }
      } catch (e) { /* senza aromaticità si lavora sulla forma di Kekulé */ }
      if (q) { try { q.delete(); } catch (e) {} }

      if (!gr.atomi.length) { try { mol.delete(); } catch (e) {} return null; }

      var pieno = (opz.idrogeni === false) ? gr : conIdrogeni(gr);
      var nPesanti = pieno.nPesanti !== undefined ? pieno.nPesanti : gr.atomi.length;
      var n = pieno.atomi.length;
      var lim = limiti(pieno);
      var rnd = caso(seme(String(smiles)));
      /* Tre partenze, si tiene la migliore. Una partenza sola, su una
         molecola con anelli, può incastrarsi in una forma che viola ancora
         qualche limite: provarne tre costa poco e si vede nel banco, dove lo
         scarto dichiarato è quello della migliore. */
      var vinc = vincoliDa(lim, n);
      var best = null;
      for (var t = 0; t < 6; t++) {
        var r = incastra(lim, n, rnd, opz.passi || 3000, vinc,
                         lim.planari, lim.lineari);
        if (!best || r.scarto < best.scarto) best = r;
        if (best.scarto < 0.02) break;
      }
      var X = best.X;

      /* si centra sul baricentro, così il visore non deve indovinare dove
         sta la molecola */
      var cx = 0, cy = 0, cz = 0;
      for (var i = 0; i < n; i++) { cx += X[i * 3]; cy += X[i * 3 + 1]; cz += X[i * 3 + 2]; }
      cx /= n; cy /= n; cz /= n;

      var atomi = [];
      for (i = 0; i < n; i++) {
        atomi.push({ i: i, el: pieno.atomi[i].sim,
                     x: X[i * 3] - cx, y: X[i * 3 + 1] - cy, z: X[i * 3 + 2] - cz });
      }
      fuori = {
        atomi: atomi,
        bonds: pieno.legami.map(function (l) { return { a: l.a, b: l.b, bo: l.bo }; }),
        nPesanti: nPesanti,
        scarto: Math.round(best.scarto * 1000) / 1000,
        iterazioni: best.iterazioni,
        smiles: (function () { try { return mol.get_smiles(); } catch (e) { return smiles; } })(),
        metodo: 'geometria delle distanze: limiti da legami, angoli e anelli; ' +
                'discesa del gradiente sulle violazioni; semina dallo SMILES',
        limiti: 'non sceglie il conformero più stabile e non tratta la ' +
                'stereochimica: enantiomeri e isomeri cis/trans possono uscire ' +
                'scambiati. Il residuo misurato resta sotto 0,03 Å fino a una ' +
                'trentina di atomi e arriva a 0,31 Å su una molecola di 76'
      };
    } catch (e) {
      fuori = { errore: (e && e.message) ? e.message : String(e) };
    }
    try { mol.delete(); } catch (e) {}
    return fuori;
  }

  /* La forma che il visore 3D dell'applicazione si aspetta: `atoms` con
     `el/x/y/z` e `bonds` con `a/b/bo`. Si restituisce la stessa cosa con due
     nomi perché i due consumatori — il visore e il banco — sono stati scritti
     in momenti diversi e nessuno dei due va riscritto per un nome. */
  function perVisore(smiles, opz) {
    var g = coordina(smiles, opz);
    if (!g || g.errore) return null;
    return { atoms: g.atomi.map(function (a) {
               return { el: a.el, x: a.x, y: a.y, z: a.z }; }),
             bonds: g.bonds, nPesanti: g.nPesanti, scarto: g.scarto };
  }

  /* ── Misure, per chi vuole controllare invece di fidarsi ─────────────── */
  function distanza(g, i, j) {
    var a = g.atomi[i], b = g.atomi[j];
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) +
                     (a.z - b.z) * (a.z - b.z));
  }
  function angolo(g, i, j, k) {
    var a = g.atomi[i], b = g.atomi[j], c = g.atomi[k];
    var ux = a.x - b.x, uy = a.y - b.y, uz = a.z - b.z;
    var vx = c.x - b.x, vy = c.y - b.y, vz = c.z - b.z;
    var nu = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1e-9;
    var nv = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1e-9;
    var cs = (ux * vx + uy * vy + uz * vz) / (nu * nv);
    return Math.acos(Math.max(-1, Math.min(1, cs))) * 180 / Math.PI;
  }
  /* quanto un gruppo di atomi si discosta dal suo piano migliore: zero vuol
     dire planare. Serve a dire «il benzene è piano» con un numero. */
  function fuoriDalPiano(g, lista) {
    var n = lista.length;
    if (n < 4) return 0;
    var cx = 0, cy = 0, cz = 0;
    lista.forEach(function (i) { cx += g.atomi[i].x; cy += g.atomi[i].y; cz += g.atomi[i].z; });
    cx /= n; cy /= n; cz /= n;
    /* la normale del piano migliore è l'autovettore minore della matrice di
       covarianza; si ottiene con poche iterazioni inverse — qui basta
       provare le tre normali dei piani coordinati ruotate, e si prende il
       minimo scarto su una griglia fine. È grossolano ma onesto, e per
       decidere «piano o no» è più che sufficiente. */
    var Sxx = 0, Syy = 0, Szz = 0, Sxy = 0, Sxz = 0, Syz = 0;
    lista.forEach(function (i) {
      var x = g.atomi[i].x - cx, y = g.atomi[i].y - cy, z = g.atomi[i].z - cz;
      Sxx += x * x; Syy += y * y; Szz += z * z;
      Sxy += x * y; Sxz += x * z; Syz += y * z;
    });
    /* iterazione di potenza sull'inversa approssimata: si parte da tre
       direzioni e si tiene quella che dà lo scarto minore */
    var best = Infinity;
    var partenze = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1], [1, -1, 1], [1, 1, -1]];
    partenze.forEach(function (v0) {
      var vx = v0[0], vy = v0[1], vz = v0[2];
      for (var it = 0; it < 60; it++) {
        /* w = (tr·I − S)·v  sposta l'autovettore minore in quello maggiore */
        var tr = Sxx + Syy + Szz;
        var wx = tr * vx - (Sxx * vx + Sxy * vy + Sxz * vz);
        var wy = tr * vy - (Sxy * vx + Syy * vy + Syz * vz);
        var wz = tr * vz - (Sxz * vx + Syz * vy + Szz * vz);
        var nn = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1e-9;
        vx = wx / nn; vy = wy / nn; vz = wz / nn;
      }
      var s = 0;
      lista.forEach(function (i) {
        var d = (g.atomi[i].x - cx) * vx + (g.atomi[i].y - cy) * vy +
                (g.atomi[i].z - cz) * vz;
        s += d * d;
      });
      s = Math.sqrt(s / n);
      if (s < best) best = s;
    });
    return best;
  }

  globale.BSIGeom3D = {
    coordina: coordina,
    perVisore: perVisore,
    distanza: distanza,
    angolo: angolo,
    fuoriDalPiano: fuoriDalPiano,
    lunghezza: lunghezza,
    angoloDi: angoloDi,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
