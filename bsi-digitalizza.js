/* ═══════════════════════════════════════════════════════════════════════════
   bsi-digitalizza — da una FIGURA di spettro ai NUMERI

   PERCHE' QUESTO MODULO ESISTE

   Uno spettro, nove volte su dieci, arriva come immagine: la fotografia del
   registratore, il ritaglio di un articolo, lo schermo dello strumento
   fotografato col telefono. I numeri non ci sono: ci sono i pixel.

   Il lettore ne aveva gia' una versione, dentro `bsi-spettrolettore.js`: per
   ogni colonna il pixel piu' scuro. Funziona su una figura pulita e sbaglia
   su tutte le altre, per tre motivi precisi:

     1. digitalizzava anche gli ASSI e i NUMERI degli assi, che sono pixel
        scuri come la traccia. Su una figura con la cornice, la curva usciva
        agganciata al bordo nei primi e negli ultimi pixel;
     2. su una figura con la GRIGLIA, la colonna piu' scura e' la griglia,
        non la traccia;
     3. il pixel piu' scuro e' un INTERO: su una linea spessa due pixel e
        sfumata dall'antialiasing la posizione vera sta in mezzo, e
        arrotondarla butta via mezzo pixel di precisione in ogni punto.

   Qui si fa il lavoro per bene, e si misura quanto si sbaglia.

   COME

   · LA CORNICE si cerca prima di tutto: una riga o una colonna di pixel
     scuri CONTINUA (oltre l'88 % della lunghezza) nel 12 % esterno della
     figura e' un asse, non un pezzo di spettro — una linea di base ha i
     picchi che la interrompono e il rumore che la fa tremare, un asse no.
     Dentro la cornice si digitalizza; fuori ci sono le etichette.

   · LA TRACCIA si estrae a SUBPIXEL: in ogni colonna si prendono i tratti
     contigui di pixel scuri, si scarta quello che la continuita' con la
     colonna precedente esclude, e del tratto scelto si calcola il
     BARICENTRO pesato sulla scurezza. L'antialiasing, che e' un fastidio
     per il pixel piu' scuro, qui diventa informazione: dice da che parte
     della riga sta il centro vero.

   · LA GRIGLIA non si riconosce dalla forma — una griglia verticale e un
     tratto ripido di curva sono la stessa cosa, in una colonna. Si
     riconosce dalla CONTINUITA': se un tratto e' assurdamente alto (oltre
     un quarto dell'altezza del grafico) si guarda solo la parte vicina a
     dove stava la traccia un pixel prima. Questo tiene anche quando la
     griglia e la traccia si toccano.

   · LA TARATURA la da' chi legge, in entrambi gli assi, e puo' essere
     LOGARITMICA: applicare una mappa lineare a un asse logaritmico non da'
     un errore, da' numeri sbagliati dall'aspetto giusto. Si chiede, non si
     indovina.

   · LA TRASMITTANZA si converte in assorbanza quando lo si chiede, con la
     definizione: A = −log₁₀(T). Un IR pubblicato e' quasi sempre in %T, e
     in %T le bande sono MINIMI: confrontare la loro «intensita'» senza
     convertire significa confrontare profondita' di buchi su una scala non
     lineare nell'assorbanza.

   CHE COSA NON PUO' FARE, E VA DETTO FORTE

   L'immagine non contiene i NUMERI degli assi. Se la taratura e' sbagliata,
   i picchi escono a numeri sbagliati pur stando nel punto giusto della
   figura: la FORMA si recupera dai pixel, la TARATURA no. E una fotografia
   presa di sbieco porta una deformazione prospettica che qui non viene
   corretta: la figura va inquadrata di fronte.

   QUANTO SBAGLIA

   Misurato su figure COSTRUITE, di cui si conoscono i centri delle
   gaussiane: vedi `tools/banchi/test_digitalizza.js`, che dichiara l'errore
   in pixel e nelle unita' tarate, con e senza cornice, con e senza griglia.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* Lo stesso idioma dei moduli fratelli, e non per gusto: `corrente` è una
     FUNZIONE. Scriverla senza le parentesi dava sempre un valore diverso da
     'it', e questo modulo rispondeva in inglese a chi usava l'italiano. */
  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  /* Quanto piu' scuro dello sfondo deve essere un pixel per contare come
     inchiostro. 45 su 255 e' circa un 18 % di contrasto: sotto, sono le
     sfumature della carta e la compressione JPEG. */
  var CONTRASTO = 45;

  /* ─────────────────────────────────────────────────────────────────────────
     Luminanza. I coefficienti sono quelli di Rec. 709, gli stessi che usa
     il resto dell'applicazione per i contrasti: il verde pesa sette volte
     il blu perche' l'occhio lo vede cosi'.
     ───────────────────────────────────────────────────────────────────────── */
  function luminanza(immagine, maxColonne) {
    var W = immagine.naturalWidth || immagine.width;
    var H = immagine.naturalHeight || immagine.height;
    if (!W || !H) return null;
    var LARGO = Math.min(W, maxColonne || 1200);
    var ALTO = Math.max(1, Math.round(H * LARGO / W));
    var tela = document.createElement('canvas');
    tela.width = LARGO; tela.height = ALTO;
    var ctx = tela.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(immagine, 0, 0, LARGO, ALTO);
    var dati;
    try { dati = ctx.getImageData(0, 0, LARGO, ALTO).data; }
    catch (e) {
      return { errore: t('l’immagine viene da un altro dominio e non si può leggere',
                         'the image comes from another origin and cannot be read') };
    }
    var lum = new Float32Array(LARGO * ALTO);
    var campione = [];
    for (var i = 0, k = 0; i < dati.length; i += 4, k++) {
      var l = 0.2126 * dati[i] + 0.7152 * dati[i + 1] + 0.0722 * dati[i + 2];
      if (dati[i + 3] < 24) l = 255;        /* un pixel trasparente è carta */
      lum[k] = l;
      if ((k % 7) === 0) campione.push(l);
    }
    campione.sort(function (a, b) { return a - b; });
    /* lo SFONDO è il 90° percentile, non la media: una figura metà nera
       avrebbe una media grigia e una soglia che non separa niente */
    var sfondo = campione.length ? campione[Math.floor(campione.length * 0.9)] : 255;
    return { lum: lum, largo: LARGO, alto: ALTO, sfondo: sfondo };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     LA CORNICE

     Un asse è una linea COMPLETA: copre quasi tutta la larghezza (o
     l'altezza) senza interruzioni. Una linea di base no — i picchi la
     interrompono, il rumore la fa tremare di un pixel, e in una singola
     riga di pixel non resta mai piena. Da qui la soglia alta (88 %) e la
     tolleranza di ±1 pixel, perché un asse stampato è spesso 1 o 2 pixel e
     può cadere a cavallo di due righe.

     E deve stare nel MARGINE: una linea piena in mezzo al grafico è una
     griglia o un riferimento, non il bordo.
     ───────────────────────────────────────────────────────────────────────── */
  function cornice(L, opz) {
    opz = opz || {};
    var lum = L.lum, W = L.largo, H = L.alto;
    var soglia = L.sfondo - CONTRASTO;
    /* `rigaPiena`/`colonnaPiena` restituiscono gia' 0 o la lunghezza del
       segmento: qui basta chiedere che ci sia un segmento. */
    var PIENA = opz.piena || 0.0001;
    var MARGINE = opz.margine || 0.12;

    /* UN ASSE E' UN SEGMENTO CONTINUO, NON UNA RIGA PIENA.
       Prima versione: «frazione di pixel scuri sulla riga ≥ 0,88». Non
       funzionava, e il motivo si vede su qualunque figura vera: un asse non
       attraversa l'IMMAGINE, attraversa il GRAFICO — ai suoi lati ci sono i
       numeri e i margini bianchi. Un asse verticale alto il 97 % del
       grafico può essere alto l'85 % dell'immagine, e cadere sotto la
       soglia.
       Si misura quindi fra il PRIMO e l'ULTIMO pixel scuro della riga: se
       quel segmento è lungo (≥ 60 % del lato) e dentro di sé è coperto
       quasi tutto (≥ 95 %), è una linea tirata. Una linea di base no: i
       picchi la interrompono, e la sua copertura interna crolla. È la stessa
       distinzione di prima, misurata dove ha senso. */
    function segmento(darkAt, lungo) {
      var primo = -1, ultimo = -1, n = 0;
      for (var i = 0; i < lungo; i++) {
        if (darkAt(i)) { if (primo < 0) primo = i; ultimo = i; n++; }
      }
      if (primo < 0) return { span: 0, copertura: 0 };
      var len = ultimo - primo + 1;
      return { span: len / lungo, copertura: n / len };
    }
    function rigaPiena(y) {
      var r = segmento(function (x) {
        return lum[y * W + x] < soglia ||
               (y > 0 && lum[(y - 1) * W + x] < soglia) ||
               (y < H - 1 && lum[(y + 1) * W + x] < soglia);
      }, W);
      return (r.span >= 0.6 && r.copertura >= 0.95) ? r.span : 0;
    }
    function colonnaPiena(x) {
      var r = segmento(function (y) {
        return lum[y * W + x] < soglia ||
               (x > 0 && lum[y * W + x - 1] < soglia) ||
               (x < W - 1 && lum[y * W + x + 1] < soglia);
      }, H);
      return (r.span >= 0.6 && r.copertura >= 0.95) ? r.span : 0;
    }

    /* UN ASSE O UNA RIGA DI GRIGLIA? SI DISTINGUONO DALLA FAMIGLIA.
       Prima versione: «la prima linea continua nel margine è l'asse». Su una
       figura con la griglia e senza assi, la griglia più esterna cadeva nel
       margine e veniva presa per l'asse: il ritaglio partiva da lì, tutta la
       taratura slittava, e i picchi uscivano a 1591, 3147, 3717 invece di
       1715, 2950, 3400. Nessun errore, solo numeri sbagliati.

       La differenza vera è che una GRIGLIA è una famiglia REGOLARE e un
       BORDO no: fra il bordo e la prima riga di griglia la distanza non è
       quella fra due righe di griglia. Quindi: si raccolgono tutte le linee
       continue, si guarda la spaziatura tipica, e la più esterna è un bordo
       solo se la sua distanza dalla vicina se ne discosta di oltre il 30 %.
       Con due sole linee non c'è famiglia e la domanda non si pone. */
    function gruppi(pieno, lungo, scurezza) {
      var trovate = [], i;
      for (i = 0; i < lungo; i++) if (pieno(i) >= PIENA) trovate.push(i);
      /* una linea spessa 2–3 px dà indici contigui: è UNA linea */
      var g = [];
      trovate.forEach(function (v) {
        if (g.length && v - g[g.length - 1][1] <= 3) g[g.length - 1][1] = v;
        else g.push([v, v]);
      });
      /* lo SPESSORE e la SCUREZZA di ogni linea: è così che un occhio
         distingue un bordo da una riga di griglia, e serve perché la
         geometria da sola non basta (vedi `estremi`) */
      return g.map(function (p) {
        var s = 0, n = 0;
        for (var k = p[0]; k <= p[1]; k++) { s += scurezza(k); n++; }
        p.spessore = p[1] - p[0] + 1;
        p.scurezza = n ? s / n : 0;
        return p;
      });
    }
    function scurezzaRiga(y) {
      var s = 0;
      for (var x2 = 0; x2 < W; x2++) s += Math.max(0, L.sfondo - lum[y * W + x2]);
      return s / W;
    }
    function scurezzaColonna(x) {
      var s = 0;
      for (var y2 = 0; y2 < H; y2++) s += Math.max(0, L.sfondo - lum[y2 * W + x]);
      return s / H;
    }
    function medianaDi(v) {
      var o = v.slice().sort(function (a, b) { return a - b; });
      return o.length ? o[Math.floor(o.length / 2)] : 0;
    }
    /* `estremi(g, lungo)` → [indice del bordo esterno iniziale, finale], −1 se
       quella linea è una riga di griglia e non un bordo */
    /* DUE CRITERI IN OR, E CI VOGLIONO ENTRAMBI.

       Il primo è la SPAZIATURA: fra il bordo e la prima riga di griglia la
       distanza non è quella fra due righe di griglia. Funziona, ma non
       sempre: in una figura di prova il bordo destro cadeva a 10 px da dove
       sarebbe caduta la riga di griglia successiva, e per la geometria le
       due ipotesi erano indistinguibili — perché davvero lo sono.

       Il secondo è il PESO DEL TRATTO, ed è quello che usa l'occhio: un
       bordo è tirato più spesso e più nero di una riga di griglia. Su quella
       stessa figura, bordo spesso 3 px e nero pieno contro griglia di 2 px
       al 70 % di grigio.

       Basta che uno dei due dica «bordo». Un falso bordo costa un ritaglio
       sbagliato; un bordo mancato costa solo di digitalizzare un po' di
       margine in più, e si vede. */
    function estremi(g) {
      if (!g.length) return [-1, -1];
      if (g.length <= 2) return [g[0][0], g[g.length - 1][1]];
      var centri = g.map(function (p) { return (p[0] + p[1]) / 2; });
      var diff = [], k;
      for (k = 1; k < centri.length; k++) diff.push(centri[k] - centri[k - 1]);
      var passo = medianaDi(diff) || 1;
      /* la famiglia: le linee interne, cioè tutte tranne le due estreme */
      var interni = g.slice(1, -1);
      var spessoreFam = medianaDi(interni.map(function (p) { return p.spessore; })) || 1;
      var scurezzaFam = medianaDi(interni.map(function (p) { return p.scurezza; })) || 1;
      function bordo(p, d) {
        return Math.abs(d - passo) > passo * 0.3 ||
               p.spessore > spessoreFam ||
               p.scurezza > scurezzaFam * 1.25;
      }
      return [bordo(g[0], diff[0]) ? g[0][0] : -1,
              bordo(g[g.length - 1], diff[diff.length - 1]) ? g[g.length - 1][1] : -1];
    }

    var bordoY = Math.max(1, Math.round(H * MARGINE));
    var bordoX = Math.max(1, Math.round(W * MARGINE));
    var gOr = gruppi(rigaPiena, H, scurezzaRiga);
    var gVe = gruppi(colonnaPiena, W, scurezzaColonna);
    var eOr = estremi(gOr), eVe = estremi(gVe);
    /* e comunque un bordo sta nel MARGINE: una linea isolata in mezzo al
       grafico è un riferimento, non il bordo */
    var alto = (eOr[0] >= 0 && eOr[0] < bordoY) ? eOr[0] : -1;
    var basso = (eOr[1] >= 0 && eOr[1] >= H - bordoY) ? eOr[1] : -1;
    var sinistra = (eVe[0] >= 0 && eVe[0] < bordoX) ? eVe[0] : -1;
    var destra = (eVe[1] >= 0 && eVe[1] >= W - bordoX) ? eVe[1] : -1;
    var famiglie = { orizzontali: gOr.length, verticali: gVe.length };

    /* Gli assi pubblicati sono spesso a L: solo sinistra e basso. Si prende
       quello che c'è e per il resto si usa il bordo dell'immagine. */
    var lati = [];
    if (alto >= 0) lati.push('alto');
    if (basso >= 0) lati.push('basso');
    if (sinistra >= 0) lati.push('sinistra');
    if (destra >= 0) lati.push('destra');

    /* OLTRE LO SPESSORE DELLA LINEA.
       Un asse stampato è spesso due o tre pixel, e con la tolleranza di ±1
       se ne trova il bordo esterno. Fermarsi un pixel dentro vuol dire
       restare SULLA linea: ed è quello che succedeva — la traccia si
       agganciava al bordo superiore e tutta la curva usciva piatta a quel
       valore, con zero picchi. Qui si cammina verso l'interno finché la
       linea continua, e poi si lascia un pixel di respiro. */
    function oltre(da, passo, pieno, limite) {
      var i = da;
      while (i !== limite && pieno(i)) i += passo;
      return i + passo;        /* un pixel di margine dopo la fine della linea */
    }
    var x0 = (sinistra >= 0) ? oltre(sinistra, 1, colonnaPiena, W - 1) : 0;
    var x1 = (destra >= 0) ? oltre(destra, -1, colonnaPiena, 0) : W - 1;
    var y0 = (alto >= 0) ? oltre(alto, 1, rigaPiena, H - 1) : 0;
    var y1 = (basso >= 0) ? oltre(basso, -1, rigaPiena, 0) : H - 1;

    /* Una cornice che lascia un ritaglio implausibile è una cornice
       sbagliata: meglio digitalizzare tutta la figura e dirlo, che
       digitalizzare un francobollo. */
    var plausibile = (x1 - x0) >= W * 0.5 && (y1 - y0) >= H * 0.3;
    if (!lati.length || !plausibile) {
      return { x0: 0, y0: 0, x1: W - 1, y1: H - 1, trovata: false, lati: [],
               famiglie: famiglie,
               perche: lati.length
                 ? t('la cornice trovata lasciava un ritaglio troppo piccolo: uso tutta la figura',
                     'the frame found left too small a crop: using the whole figure')
                 : ((famiglie.verticali > 2 || famiglie.orizzontali > 2)
                   ? t('le linee continue sono una griglia regolare, non un bordo: uso tutta la figura',
                       'the continuous lines are a regular grid, not a border: using the whole figure')
                   : t('nessun asse continuo nei bordi: uso tutta la figura',
                       'no continuous axis at the edges: using the whole figure')) };
    }
    return { x0: x0, y0: y0, x1: x1, y1: y1, trovata: true, lati: lati,
             famiglie: famiglie,
             perche: t('assi trovati: ', 'axes found: ') + lati.join(', ') };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     LE RIGHE MOLTO COPERTE — E PERCHE' NON SI POSSONO TOGLIERE

     Prima versione di questo modulo: «una riga coperta per oltre il 60 % è
     una griglia, la si toglie dalla ricerca; la traccia la ritrovo per
     continuità dalle colonne vicine».

     Era sbagliato, e il banco lo ha detto subito: su una figura normale non
     trovava piu' NESSUNA traccia. Il motivo e' ovvio a dirlo — la LINEA DI
     BASE di uno spettro E' una lunga riga scura. Uno spettro IR passa il
     settanta per cento della sua larghezza piatto sulla linea di base;
     quella riga veniva classificata griglia e cancellata, e «le colonne
     vicine» non la ritrovavano perche' erano piatte sulla STESSA riga.

     Non esiste una soglia che separi una griglia orizzontale da una linea di
     base: sono la stessa cosa geometrica. La griglia si gestisce invece per
     CONTINUITA', come quella verticale — in ogni colonna ci sono due tratti
     scuri, quello della griglia e quello della traccia, e si sceglie quello
     vicino a dove la traccia stava un pixel prima.

     La funzione resta perche' CONTARE le righe molto coperte e' una
     diagnosi utile (dice a chi guarda che la figura ha una griglia), ma il
     suo risultato non tocca l'estrazione.
     ───────────────────────────────────────────────────────────────────────── */
  function griglieOrizzontali(L, c) {
    var lum = L.lum, W = L.largo, soglia = L.sfondo - CONTRASTO;
    var larghezza = c.x1 - c.x0 + 1;
    var fuori = {};
    for (var y = c.y0; y <= c.y1; y++) {
      var n = 0;
      for (var x = c.x0; x <= c.x1; x++) if (lum[y * W + x] < soglia) n++;
      if (n / larghezza > 0.6) fuori[y] = true;
    }
    return fuori;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     LA TRACCIA, A SUBPIXEL

     Per ogni colonna: i tratti contigui di pixel scuri; si scarta quello che
     la continuità esclude; del tratto scelto si prende il baricentro pesato
     sulla scurezza (sfondo − luminanza), che è il centro vero della linea
     anche quando la linea è spessa due pixel e sfumata.
     ───────────────────────────────────────────────────────────────────────── */
  function traccia(L, c, opz) {
    opz = opz || {};
    var lum = L.lum, W = L.largo;
    var soglia = (opz.soglia !== undefined) ? opz.soglia : (L.sfondo - CONTRASTO);
    var altezza = c.y1 - c.y0 + 1;
    var MAX_TRATTO = Math.max(4, altezza * 0.25);
    var FINESTRA = 4;
    var N = c.x1 - c.x0 + 1;

    /* 1 · i tratti contigui di pixel scuri, colonna per colonna */
    var perColonna = new Array(N), nTratti = 0;
    for (var col = 0; col < N; col++) {
      var x = c.x0 + col, tratti = [], da = -1;
      for (var y = c.y0; y <= c.y1; y++) {
        var scuro = lum[y * W + x] < soglia;
        if (scuro && da < 0) da = y;
        else if (!scuro && da >= 0) { tratti.push([da, y - 1]); da = -1; }
      }
      if (da >= 0) tratti.push([da, c.y1]);
      perColonna[col] = tratti;
      nTratti += tratti.length;
    }

    function scurezzaMedia(tr, x) {
      var s = 0, q = 0;
      for (var yy = tr[0]; yy <= tr[1]; yy++) { s += L.sfondo - lum[yy * W + x]; q++; }
      return q ? s / q : 0;
    }

    /* 2 · IL SEME. Da qualche parte bisogna cominciare, e la prima colonna
       non è un buon posto: può cadere su una griglia verticale, che è un
       tratto alto quanto il grafico, e tutta la continuità partirebbe da
       lì. Si cerca quindi la prima colonna in cui TUTTI i tratti sono
       brevi — nessuna griglia verticale in mezzo — e si prende il suo
       tratto più scuro: una griglia stampata è grigia, una traccia è nera. */
    var seme = -1, semeY = null;
    for (var s1 = 0; s1 < N && seme < 0; s1++) {
      var tt = perColonna[s1];
      if (!tt.length) continue;
      var tuttiBrevi = tt.every(function (tr) { return (tr[1] - tr[0] + 1) <= MAX_TRATTO; });
      if (!tuttiBrevi) continue;
      seme = s1;
    }
    if (seme < 0) { for (var s2 = 0; s2 < N && seme < 0; s2++) if (perColonna[s2].length) seme = s2; }

    var riga = new Array(N);
    for (var z = 0; z < N; z++) riga[z] = NaN;
    var nTroncati = 0;

    if (seme >= 0) {
      var xs0 = c.x0 + seme, piuScuro = null, scuroMax = -1;
      perColonna[seme].forEach(function (tr) {
        var sc = scurezzaMedia(tr, xs0);
        if (sc > scuroMax) { scuroMax = sc; piuScuro = tr; }
      });
      semeY = baricentro(piuScuro[0], piuScuro[1], xs0);
      riga[seme] = semeY;

      /* 3 · si scorre verso destra e verso sinistra dal seme: la continuità
         vale in entrambe le direzioni, e partire da un estremo sprecherebbe
         la metà buona dell'informazione */
      percorri(seme, 1);
      percorri(seme, -1);
    }

    function baricentro(a, b, x) {
      /* baricentro pesato sulla scurezza: qui si guadagna il subpixel.
         L'antialiasing, che per il «pixel più scuro» è un fastidio, qui dice
         da che parte della riga sta il centro vero. */
      var peso = 0, somma = 0;
      for (var yv = a; yv <= b; yv++) {
        var p = Math.max(0, L.sfondo - lum[yv * W + x]);
        peso += p; somma += p * yv;
      }
      return peso > 0 ? somma / peso : (a + b) / 2;
    }

    function percorri(dal, passo) {
      var prec = riga[dal];
      /* LA SCUREZZA DI RIFERIMENTO, e perché serve.
         Con la sola continuità una riga di griglia ORIZZONTALE diventa un
         ATTRATTORE: quando la traccia le passa accanto, il tratto della
         griglia è più vicino alla posizione precedente di quanto lo sia la
         traccia che si sta muovendo, viene scelto, e da lì la curva resta
         incollata alla griglia per sempre — perché la griglia è ferma e la
         traccia se ne va. Misurato: su una figura con la griglia i picchi
         uscivano a 1591, 3147, 3717 invece di 1715, 2950, 3400.
         La griglia però è PALLIDA, e la traccia è nera: si preferiscono i
         tratti scuri almeno quanto il 60 % del riferimento, e solo se non
         ce n'è nessuno si guardano tutti. Il riferimento si aggiorna
         strada facendo, così una figura sbiadita non viene esclusa da sé. */
      var scuroRif = scurezzaMedia([Math.floor(prec), Math.ceil(prec)], c.x0 + dal) || 1;
      for (var k = dal + passo; k >= 0 && k < N; k += passo) {
        var tratti2 = perColonna[k];
        if (!tratti2.length) { riga[k] = NaN; continue; }
        var xq = c.x0 + k, scelto = null, minDist = Infinity;
        var candidati = tratti2.filter(function (tr3) {
          return scurezzaMedia(tr3, xq) >= scuroRif * 0.6;
        });
        if (!candidati.length) candidati = tratti2;
        for (var j = 0; j < candidati.length; j++) {
          var tr2 = candidati[j];
          /* la distanza si misura dal TRATTO, non dal suo centro: un tratto
             che contiene la posizione precedente ha distanza zero */
          var d = (prec < tr2[0]) ? tr2[0] - prec : (prec > tr2[1] ? prec - tr2[1] : 0);
          if (d < minDist) { minDist = d; scelto = tr2; }
        }
        var a2 = scelto[0], b2 = scelto[1], troncato = false;
        /* un tratto assurdamente alto è una griglia verticale, o la griglia
           fusa con la traccia: si guarda solo intorno a dove stava la traccia */
        if ((b2 - a2 + 1) > MAX_TRATTO) {
          var na = Math.max(a2, Math.round(prec) - FINESTRA);
          var nb = Math.min(b2, Math.round(prec) + FINESTRA);
          if (nb >= na) { a2 = na; b2 = nb; nTroncati++; troncato = true; }
        }
        var cen = baricentro(a2, b2, xq);
        /* SU UNA COLONNA DI GRIGLIA LA TRACCIA NON E' MISURABILE, e tenerne
           il baricentro troncato non è un'approssimazione: è un gradino. Su
           una curva liscia quei gradini passavano la soglia dei picchi e
           comparivano come SETTE BANDE FALSE, equispaziate come la griglia
           che le aveva prodotte — misurate a 734, 1126, 1517, 1909, 2300,
           2691, 3866 cm⁻¹ accanto alle tre vere. La colonna si segna come
           vuota e si ricostruisce dalle vicine, come si fa per un tratteggio;
           il baricentro serve solo a non perdere la continuità. */
        riga[k] = troncato ? NaN : cen;
        prec = cen;
        /* media mobile lenta: il riferimento segue la figura senza farsi
           trascinare da un singolo tratto anomalo */
        scuroRif = 0.9 * scuroRif + 0.1 * scurezzaMedia([a2, b2], xq);
      }
    }

    /* le colonne vuote si interpolano: un tratteggio o una linea interrotta
       non deve diventare un buco nella curva */
    var piene = 0, i;
    for (i = 0; i < riga.length; i++) if (!isNaN(riga[i])) piene++;
    if (piene < riga.length * 0.25) {
      return { errore: t('non ho trovato una traccia abbastanza scura: prova a ritagliare ' +
                         'la figura o ad aumentare il contrasto',
                         'no dark enough trace found: try cropping the figure or raising the contrast'),
               colonneConTraccia: piene, colonne: riga.length };
    }
    var ultimo = -1;
    for (i = 0; i < riga.length; i++) {
      if (!isNaN(riga[i])) {
        if (ultimo >= 0 && i - ultimo > 1) {
          for (var m = ultimo + 1; m < i; m++) {
            riga[m] = riga[ultimo] + (riga[i] - riga[ultimo]) * (m - ultimo) / (i - ultimo);
          }
        }
        ultimo = i;
      }
    }
    /* le code: prima del primo e dopo l'ultimo punto utile si tiene il valore
       di bordo, perché extrapolare una curva è inventarla */
    var primo = 0; while (primo < riga.length && isNaN(riga[primo])) primo++;
    for (i = 0; i < primo; i++) riga[i] = riga[primo];
    for (i = ultimo + 1; i < riga.length; i++) riga[i] = riga[ultimo];

    return { riga: riga, colonne: riga.length, colonneConTraccia: piene,
             soglia: Math.round(soglia), sfondo: Math.round(L.sfondo),
             trattiPerColonna: +(nTratti / riga.length).toFixed(2),
             colonneTroncate: nTroncati, colonnaSeme: seme,
             /* solo diagnosi: vedi il commento sopra `griglieOrizzontali` */
             righeMoltoCoperte: Object.keys(griglieOrizzontali(L, c)).length };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     LA TARATURA

     Due punti per asse, lineare o logaritmica. Su un asse logaritmico la
     mappa è x = x₀·(x₁/x₀)^t: usare quella lineare non darebbe un errore,
     darebbe numeri sbagliati dall'aspetto giusto, che è peggio.
     ───────────────────────────────────────────────────────────────────────── */
  function mappa(da, a, log) {
    if (log) {
      if (!(da > 0 && a > 0)) return null;      /* il logaritmo di zero non c'è */
      var r = Math.log(a / da);
      return function (f) { return da * Math.exp(r * f); };
    }
    return function (f) { return da + (a - da) * f; };
  }

  /* A = −log₁₀(T). È la definizione, non un'approssimazione.
     %T si divide per 100; sotto lo 0,01 % si ferma, perché il logaritmo di
     zero non esiste e una banda saturata non dice quanto è profonda. */
  function assorbanzaDaTrasmittanza(valori, percento) {
    var MIN = 1e-4, saturi = 0;
    var out = valori.map(function (v) {
      var T = percento ? v / 100 : v;
      if (!(T > MIN)) { T = MIN; saturi++; }
      if (T > 1) T = 1;
      return -Math.log(T) / Math.LN10;
    });
    return { y: out, saturi: saturi };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     IL PASSAGGIO COMPLETO: da immagine a spettro tarato
     ═════════════════════════════════════════════════════════════════════════ */
  function digitalizza(immagine, opz) {
    opz = opz || {};
    var L = luminanza(immagine, opz.colonne);
    if (!L) return null;
    if (L.errore) return { errore: L.errore };

    var c = (opz.cornice && typeof opz.cornice === 'object')
      ? { x0: opz.cornice.x0, y0: opz.cornice.y0, x1: opz.cornice.x1, y1: opz.cornice.y1,
          trovata: true, lati: ['data'], perche: t('cornice indicata a mano',
                                                   'frame given by hand') }
      : (opz.cornice === 'tutta'
          ? { x0: 0, y0: 0, x1: L.largo - 1, y1: L.alto - 1, trovata: false, lati: [],
              perche: t('cornice non cercata: uso tutta la figura',
                        'frame not searched: using the whole figure') }
          : cornice(L, opz));

    var tr = traccia(L, c, opz);
    if (tr.errore) {
      return { errore: tr.errore, colonneConTraccia: tr.colonneConTraccia,
               colonne: tr.colonne, cornice: c };
    }

    var N = tr.colonne;
    /* ── x ── */
    var xDa = (opz.xDa !== undefined) ? +opz.xDa : 0;
    var xA = (opz.xA !== undefined) ? +opz.xA : (N - 1);
    var fx = mappa(xDa, xA, !!opz.logX);
    if (!fx) return { errore: t('un asse logaritmico non può partire da zero o da un numero negativo',
                                'a logarithmic axis cannot start at zero or at a negative number') };
    /* ── y ── in pixel l'origine sta in ALTO, quindi si rovescia: 0 in basso */
    var yDa = (opz.yDa !== undefined) ? +opz.yDa : 0;
    var yA = (opz.yA !== undefined) ? +opz.yA : (c.y1 - c.y0);
    var fy = mappa(yDa, yA, !!opz.logY);
    if (!fy) return { errore: t('un asse logaritmico non può partire da zero o da un numero negativo',
                                'a logarithmic axis cannot start at zero or at a negative number') };

    var xs = [], ys = [], i;
    var alt = (c.y1 - c.y0);
    for (i = 0; i < N; i++) {
      xs.push(fx(N > 1 ? i / (N - 1) : 0));
      ys.push(fy(alt > 0 ? (c.y1 - tr.riga[i]) / alt : 0));
    }
    /* se le x vanno all'indietro (IR: 4000 → 400) si riordinano crescenti,
       perché tutto il resto del lettore le vuole così */
    if (xs.length > 1 && xs[0] > xs[xs.length - 1]) { xs.reverse(); ys.reverse(); }

    /* `yUnita` è l'unità DICHIARATA dell'asse ('%T', 'T', 'A', 'u.a.'): serve
       sia come etichetta sia per decidere se la conversione in assorbanza ha
       senso. Senza taratura verticale resta la scurezza in pixel, e va detto. */
    var unitaY = opz.yUnita || opz.unitaY ||
                 t('scurezza (unità arbitrarie)', 'darkness (arbitrary units)');
    var note = [];
    var saturi = 0;
    if (opz.adAssorbanza && (opz.yUnita === '%T' || opz.yUnita === 'T')) {
      var conv = assorbanzaDaTrasmittanza(ys, opz.yUnita === '%T');
      ys = conv.y; saturi = conv.saturi;
      unitaY = 'A';
      note.push(t('Trasmittanza convertita in assorbanza con A = −log₁₀(T).',
                  'Transmittance converted to absorbance with A = −log₁₀(T).'));
      if (saturi) {
        note.push(t('In ' + saturi + ' punti la trasmittanza letta era ≤ 0,01 %: lì la banda ' +
                    'è saturata e la sua profondità non è misurabile — l’assorbanza è stata ' +
                    'fermata a 4.',
                    'At ' + saturi + ' points the transmittance read was ≤ 0.01 %: there the band ' +
                    'is saturated and its depth is not measurable — the absorbance was capped at 4.'));
      }
    }
    if (!c.trovata) {
      note.push(t('Non ho trovato una cornice di assi: ho digitalizzato tutta la figura. ' +
                  'Se nell’immagine ci sono i numeri degli assi, quei pixel sono entrati ' +
                  'nella lettura — ritaglia la figura al solo grafico.',
                  'No axis frame found: I digitised the whole figure. If the image contains the ' +
                  'axis numbers, those pixels went into the reading — crop the figure to the plot.'));
    }
    if (opz.yDa === undefined || opz.yA === undefined) {
      note.push(t('L’asse verticale non è tarato: i valori sono in pixel, utili per la FORMA ' +
                  'e per le posizioni dei picchi, non come intensità.',
                  'The vertical axis is not calibrated: values are in pixels, useful for the ' +
                  'SHAPE and the peak positions, not as intensities.'));
    }

    return {
      formato: t('immagine', 'image'), x: xs, y: ys,
      titolo: opz.titolo || '', tipo: opz.tipo || '',
      unitaX: opz.unitaX || '', unitaY: unitaY,
      daImmagine: true, colonne: N,
      sfondo: tr.sfondo, soglia: tr.soglia,
      cornice: c,
      trattiPerColonna: tr.trattiPerColonna,
      colonneTroncate: tr.colonneTroncate,
      righeMoltoCoperte: tr.righeMoltoCoperte,
      colonneConTraccia: tr.colonneConTraccia,
      saturi: saturi,
      note: note,
      avviso: t('La scala degli assi non sta nell’immagine: è quella che hai indicato. ' +
                'La FORMA della traccia è recuperata dai pixel, la TARATURA no.',
                'The axis scale is not in the image: it is the one you gave. The trace SHAPE ' +
                'is recovered from the pixels, the calibration is not.')
    };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     USCITE — perché una curva digitalizzata deve poter uscire da qui

     Chi digitalizza uno spettro lo fa per farci qualcosa: sovrapporlo a un
     altro, integrarlo, metterlo in una tesi. Se i numeri restano dentro
     l'applicazione, il lavoro è a metà.
     ═════════════════════════════════════════════════════════════════════════ */
  function csv(sp) {
    var righe = ['x' + (sp.unitaX ? ' (' + sp.unitaX + ')' : '') +
                 ',y' + (sp.unitaY ? ' (' + sp.unitaY + ')' : '')];
    for (var i = 0; i < sp.x.length; i++) {
      righe.push(sp.x[i].toPrecision(8) + ',' + sp.y[i].toPrecision(8));
    }
    return righe.join('\n') + '\n';
  }

  /* JCAMP-DX 4.24, forma (XY..XY): è la più semplice e la legge chiunque.
     I campi obbligatori sono obbligatori: senza FIRSTX/LASTX/NPOINTS il file
     è formalmente invalido, e un file invalido non serve a nessuno. */
  function jcamp(sp) {
    var n = sp.x.length;
    if (!n) return '';
    var r = ['##TITLE=' + (sp.titolo || t('spettro digitalizzato da immagine',
                                          'spectrum digitised from an image')),
             '##JCAMP-DX=4.24',
             '##DATA TYPE=' + (sp.tipo === 'ir' ? 'INFRARED SPECTRUM' : 'SPECTRUM'),
             '##ORIGIN=BioSpecInfo ' + t('digitalizzazione da figura', 'figure digitisation'),
             '##OWNER=',
             '##XUNITS=' + (sp.unitaX || 'ARBITRARY UNITS'),
             '##YUNITS=' + (sp.unitaY || 'ARBITRARY UNITS'),
             '##FIRSTX=' + sp.x[0].toPrecision(8),
             '##LASTX=' + sp.x[n - 1].toPrecision(8),
             '##FIRSTY=' + sp.y[0].toPrecision(8),
             '##NPOINTS=' + n,
             '##XFACTOR=1',
             '##YFACTOR=1',
             /* la provenienza dentro il file: chi lo apre fra un anno deve
                sapere che questi numeri vengono da dei PIXEL */
             '$$ ' + t('Taratura data a mano: la forma viene dai pixel, i numeri degli assi no.',
                       'Calibration given by hand: the shape comes from the pixels, the axis numbers do not.'),
             '##XYDATA=(XY..XY)'];
    for (var i = 0; i < n; i++) {
      r.push(sp.x[i].toPrecision(8) + ' ' + sp.y[i].toPrecision(8));
    }
    r.push('##END=');
    return r.join('\n') + '\n';
  }

  globale.BSIDigitalizza = {
    digitalizza: digitalizza,
    cornice: cornice,
    traccia: traccia,
    luminanza: luminanza,
    assorbanzaDaTrasmittanza: assorbanzaDaTrasmittanza,
    csv: csv, jcamp: jcamp,
    CONTRASTO: CONTRASTO,
    versione: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
