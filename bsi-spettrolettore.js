/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spettrolettore.js — leggere uno spettro vero, non guardarne il disegno
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA FA

   L'applicazione aveva tabelle di riferimento, spettri predetti e quiz. Non
   aveva un posto in cui mettere lo spettro CHE HAI MISURATO TU e farci sopra
   le domande che si fanno in laboratorio: dove sono i picchi, quanto valgono,
   che gruppo funzionale è quella banda, qual è il picco base, quale perdita
   neutra spiega quel frammento.

   Questo modulo legge:

     · JCAMP-DX   lo standard IUPAC per lo scambio di spettri (.jdx, .dx).
                  Si leggono sia i blocchi XYDATA compressi in forma
                  (X++(Y..Y)) — con le codifiche ASDF, SQZ, DIF e DUP — sia le
                  tabelle di picchi (XYPOINTS, PEAK TABLE).
     · testo      due colonne x y separate da spazi, virgole o tabulazioni:
                  è il formato in cui esce metà della strumentazione.

   E poi MISURA: linea di base, rumore, picchi con la loro prominenza,
   rapporto segnale/rumore. L'assegnazione delle bande IR e la lettura delle
   perdite neutre in massa vengono da tabelle scritte QUI, non chieste alla
   pagina: un lettore che chiedesse all'app i valori con cui interpretare non
   interpreterebbe niente.

   CHE COSA NON FA, E LO DICE

   Non deduce la struttura. Un insieme di bande IR è compatibile con molte
   molecole, e un programma che da tre picchi tirasse fuori un nome farebbe
   un'affermazione che i dati non reggono. Qui si dice «questa banda è
   compatibile con», e si elencano TUTTE le assegnazioni compatibili, non la
   prima.

   USO   window.BSILettoreSpettri.leggi(testo)  ·  .analizza(spettro, opzioni)

   IL NOME NON E' `BSISpettri`, E C'E' UNA RAGIONE.
   Questo modulo si chiamava `BSISpettri` e si carica DOPO `bsi-spettri.js`,
   che quel nome lo possedeva gia': l'assegnazione lo sovrascriveva, e il
   motore di predizione IR/NMR — `gruppi()`, `irBandListLegacy()`,
   `nmrPeakListLegacy()` — spariva. L'applicazione non segnalava nulla: zero
   errori JavaScript, la pagina si apriva, la sezione nuova funzionava. Tre
   banchi su quattro l'hanno visto (`test_spettri`, `test_spettri_ui`,
   `test_assi`), ed e' per questo che esistono.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · JCAMP-DX
     ═════════════════════════════════════════════════════════════════════════
     Il formato ha trent'anni e lo si incontra ancora ovunque. La parte
     difficile è la compressione ASDF: i valori y non sono scritti in chiaro ma
     codificati con cifre-lettera, differenze e duplicazioni. Scriverlo bene
     significa leggere spettri che altrimenti si aprono solo col programma
     dello strumento. */

  var PMAI = { '@':0, 'A':1, 'B':2, 'C':3, 'D':4, 'E':5, 'F':6, 'G':7, 'H':8, 'I':9 };
  var MENO = { 'a':1, 'b':2, 'c':3, 'd':4, 'e':5, 'f':6, 'g':7, 'h':8, 'i':9 };
  var DIFP = { '%':0, 'J':1, 'K':2, 'L':3, 'M':4, 'N':5, 'O':6, 'P':7, 'Q':8, 'R':9 };
  var DIFM = { 'j':1, 'k':2, 'l':3, 'm':4, 'n':5, 'o':6, 'p':7, 'q':8, 'r':9 };
  var DUP  = { 'S':1, 'T':2, 'U':3, 'V':4, 'W':5, 'X':6, 'Y':7, 'Z':8, 's':9 };

  /* Decodifica una riga ASDF. Restituisce i numeri e, per ciascuno, se era una
     DIFFERENZA rispetto al precedente: serve al controllo di consistenza che
     il formato stesso prevede. */
  function decodificaASDF(riga) {
    var fuori = [], tipi = [], i = 0, n = riga.length;
    while (i < n) {
      var c = riga[i];
      if (c === ' ' || c === '\t' || c === ',') { i++; continue; }
      var segno = 1, cifre = '', tipo = 'normale';
      if (PMAI[c] !== undefined)      { cifre = String(PMAI[c]); tipo = 'normale'; i++; }
      else if (MENO[c] !== undefined) { cifre = String(MENO[c]); segno = -1; tipo = 'normale'; i++; }
      else if (DIFP[c] !== undefined) { cifre = String(DIFP[c]); tipo = 'diff'; i++; }
      else if (DIFM[c] !== undefined) { cifre = String(DIFM[c]); segno = -1; tipo = 'diff'; i++; }
      else if (DUP[c] !== undefined)  { cifre = String(DUP[c]); tipo = 'dup'; i++; }
      else if (c === '-' || c === '+') { segno = (c === '-') ? -1 : 1; i++; continue; }
      else if (c >= '0' && c <= '9') { tipo = 'normale'; }
      else { i++; continue; }
      while (i < n && ((riga[i] >= '0' && riga[i] <= '9') || riga[i] === '.')) {
        cifre += riga[i]; i++;
      }
      if (!cifre) continue;
      fuori.push(segno * parseFloat(cifre));
      tipi.push(tipo);
    }
    return { valori: fuori, tipi: tipi };
  }

  function leggiJCAMP(testo) {
    var righe = String(testo).split(/\r?\n/);
    var meta = {}, datiRighe = [], dentro = false, forma = null;
    for (var i = 0; i < righe.length; i++) {
      var r = righe[i];
      var m = r.match(/^\s*##\s*([^=]+)=\s*(.*)$/);
      if (m) {
        var chiave = m[1].trim().toUpperCase().replace(/[$\s.]/g, '');
        var val = m[2].trim();
        if (chiave === 'XYDATA' || chiave === 'XYPOINTS' || chiave === 'PEAKTABLE') {
          dentro = true; forma = chiave; meta.forma = val; continue;
        }
        if (chiave === 'END') { dentro = false; continue; }
        meta[chiave] = val;
        continue;
      }
      if (dentro && r.trim() && !/^\s*\$\$/.test(r)) datiRighe.push(r);
    }
    if (!forma) return null;

    var x = [], y = [];
    var primo = parseFloat(meta.FIRSTX), ultimo = parseFloat(meta.LASTX);
    var fattoreX = parseFloat(meta.XFACTOR); if (!isFinite(fattoreX)) fattoreX = 1;
    var fattoreY = parseFloat(meta.YFACTOR); if (!isFinite(fattoreY)) fattoreY = 1;
    var nPunti = parseInt(meta.NPOINTS, 10);

    if (forma === 'XYDATA' && /X\+\+/.test(meta.forma || '')) {
      /* forma compressa: la prima colonna è x, il resto sono y in ASDF */
      var ultimoY = null;
      datiRighe.forEach(function (riga) {
        var d = decodificaASDF(riga);
        if (!d.valori.length) return;
        var xr = d.valori[0];
        var vals = d.valori.slice(1), tipi = d.tipi.slice(1);
        var corrente = null;
        for (var k = 0; k < vals.length; k++) {
          if (tipi[k] === 'dup') {
            /* DUP ripete l'ultimo valore prodotto */
            for (var q = 1; q < vals[k]; q++) { y.push(corrente); }
            continue;
          }
          if (tipi[k] === 'diff') {
            if (corrente === null) { corrente = vals[k]; }
            else corrente = corrente + vals[k];
          } else {
            /* un valore normale dopo una serie DIF è il CONTROLLO: deve
               coincidere con quello già calcolato, e se coincide non si
               aggiunge due volte. È il controllo di integrità che il formato
               prevede e che quasi nessun lettore fa. */
            if (corrente !== null && k > 0 && tipi[k - 1] === 'diff' &&
                Math.abs(vals[k] - corrente) < 1e-6) { continue; }
            corrente = vals[k];
          }
          y.push(corrente);
        }
        ultimoY = corrente;
        if (x.length === 0) x.push(xr);
      });
      /* le x si ricostruiscono dall'intervallo dichiarato: è così che il
         formato le rappresenta quando usa X++ */
      var N = y.length;
      x = [];
      if (isFinite(primo) && isFinite(ultimo) && N > 1) {
        var passo = (ultimo - primo) / (N - 1);
        for (var j = 0; j < N; j++) x.push((primo + passo * j) * fattoreX);
      } else {
        for (var j2 = 0; j2 < N; j2++) x.push(j2);
      }
      y = y.map(function (v) { return v * fattoreY; });
    } else {
      /* tabella esplicita: coppie x y */
      datiRighe.forEach(function (riga) {
        var p = riga.trim().split(/[,;\s]+/).filter(function (q) { return q !== ''; });
        for (var k = 0; k + 1 < p.length; k += 2) {
          var a = parseFloat(p[k]), b = parseFloat(p[k + 1]);
          if (isFinite(a) && isFinite(b)) { x.push(a * fattoreX); y.push(b * fattoreY); }
        }
      });
    }
    if (!x.length) return null;
    return {
      formato: 'JCAMP-DX', x: x, y: y,
      titolo: meta.TITLE || '', tipo: (meta.DATATYPE || '').toUpperCase(),
      unitaX: meta.XUNITS || '', unitaY: meta.YUNITS || '',
      puntiDichiarati: isFinite(nPunti) ? nPunti : null,
      meta: meta
    };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Due colonne
     ═════════════════════════════════════════════════════════════════════════ */
  function leggiColonne(testo) {
    var x = [], y = [];
    String(testo).split(/\r?\n/).forEach(function (r) {
      if (/^\s*(#|\/\/|;)/.test(r)) return;
      var p = r.trim().split(/[,;\t\s]+/).filter(function (q) { return q !== ''; });
      if (p.length < 2) return;
      var a = parseFloat(p[0]), b = parseFloat(p[1]);
      if (isFinite(a) && isFinite(b)) { x.push(a); y.push(b); }
    });
    if (x.length < 3) return null;
    return { formato: t('due colonne', 'two columns'), x: x, y: y,
             titolo: '', tipo: '', unitaX: '', unitaY: '' };
  }

  function leggi(testo) {
    if (!testo || !String(testo).trim()) return null;
    if (/##\s*(TITLE|JCAMP)/i.test(testo)) {
      var j = leggiJCAMP(testo);
      if (j) return j;
    }
    return leggiColonne(testo);
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · La misura
     ═════════════════════════════════════════════════════════════════════════
     Linea di base, rumore, picchi. La prominenza è la grandezza che distingue
     un picco da un'increspatura: quanto bisogna scendere dal vertice prima di
     poter risalire più in alto. Senza prominenza, un rilevatore di massimi
     locali su dati rumorosi trova centinaia di «picchi». */

  function mediana(v) {
    var s = v.slice().sort(function (a, b) { return a - b; });
    var n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }

  function lineaDiBase(y, finestra) {
    /* mediana mobile: robusta alle punte, che è esattamente ciò che serve
       quando le punte sono il segnale */
    var n = y.length, out = new Array(n);
    var w = Math.max(3, Math.round(finestra || Math.max(5, n / 20)));
    for (var i = 0; i < n; i++) {
      var a = Math.max(0, i - w), b = Math.min(n, i + w + 1);
      out[i] = mediana(y.slice(a, b));
    }
    return out;
  }

  function rumore(y, base) {
    /* scarto assoluto mediano dei residui, scalato a deviazione standard:
       1,4826 è il fattore per una gaussiana. La deviazione standard semplice
       la gonfierebbero i picchi, che sono il segnale. */
    var res = y.map(function (v, i) { return v - base[i]; });
    var med = mediana(res);
    var mad = mediana(res.map(function (v) { return Math.abs(v - med); }));
    return 1.4826 * mad;
  }

  function trovaPicchi(x, y, opz) {
    opz = opz || {};
    var verso = opz.versoIlBasso ? -1 : 1;
    var yy = y.map(function (v) { return v * verso; });
    var base = lineaDiBase(yy, opz.finestraBase);
    /* RUMORE ZERO NON VUOL DIRE RUMORE PICCOLISSIMO.
       Lo scarto assoluto mediano dei residui vale esattamente 0 quando la
       traccia è liscia: una curva digitalizzata da una figura pulita, o una
       curva calcolata. Dividere per 1e-12 produceva rapporti segnale-rumore
       come 4 996 427 518, stampati con due decimali — una precisione
       inventata su una grandezza che in quel caso NON E' MISURABILE.
       Il surrogato resta per poter confrontare le altezze, ma si segna che
       il rumore non è misurato, e chi stampa i numeri lo dice. */
    var sigmaVera = rumore(yy, base);
    var misurabile = sigmaVera > 0;
    /* senza rumore misurabile la soglia diventa una frazione dell'ampiezza:
       un picco è un picco se si alza di almeno un millesimo dell'escursione */
    var escursione = Math.max.apply(null, yy) - Math.min.apply(null, yy);
    var sigma = misurabile ? sigmaVera : Math.max(escursione * 1e-3, 1e-12);
    var sogliaSNR = opz.snr != null ? opz.snr : 3;
    var picchi = [];
    for (var i = 1; i < yy.length - 1; i++) {
      if (!(yy[i] > yy[i - 1] && yy[i] >= yy[i + 1])) continue;
      var altezza = yy[i] - base[i];
      if (altezza < sogliaSNR * sigma) continue;
      /* prominenza: si scende a destra e a sinistra finché non si risale più
         in alto del vertice */
      var sx = yy[i], dx = yy[i];
      for (var a = i - 1; a >= 0; a--) { if (yy[a] > yy[i]) break; if (yy[a] < sx) sx = yy[a]; }
      for (var b = i + 1; b < yy.length; b++) { if (yy[b] > yy[i]) break; if (yy[b] < dx) dx = yy[b]; }
      var prom = yy[i] - Math.max(sx, dx);
      if (prom < (opz.prominenzaMinima != null ? opz.prominenzaMinima : sogliaSNR * sigma)) continue;
      picchi.push({ i: i, x: x[i], y: y[i], altezza: altezza * verso,
                    prominenza: prom,
                    /* se il rumore non è misurabile l'SNR non esiste: null,
                       non un numero enorme */
                    snr: misurabile ? altezza / sigma : null });
    }
    picchi.sort(function (p, q) { return q.prominenza - p.prominenza; });
    return { picchi: picchi, sigma: misurabile ? sigma : null,
             rumoreMisurabile: misurabile, sogliaUsata: sogliaSNR * sigma, base: base };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · Le bande IR — tabelle scritte qui
     ═════════════════════════════════════════════════════════════════════════
     Intervalli in cm⁻¹ con la loro assegnazione. Si restituiscono TUTTE le
     assegnazioni compatibili con una banda, non la prima: una banda a
     1700 cm⁻¹ è compatibile con un chetone, un'aldeide, un acido e un estere,
     e scegliere per conto di chi guarda sarebbe inventare. */
  var BANDE_IR = [
    [3600, 3200, 'O–H', t('alcol o acqua, banda larga', 'alcohol or water, broad band')],
    [3300, 2500, 'O–H', t('acido carbossilico, molto larga', 'carboxylic acid, very broad')],
    [3500, 3300, 'N–H', t('ammina primaria (due punte) o secondaria (una)',
                          'primary amine (two peaks) or secondary (one)')],
    [3330, 3270, '≡C–H', t('alchino terminale', 'terminal alkyne')],
    [3100, 3000, '=C–H', t('alchene o aromatico', 'alkene or aromatic')],
    [3000, 2850, 'C–H',  t('alcano', 'alkane')],
    [2830, 2695, 'C–H',  t('aldeide (doppietto di Fermi)', 'aldehyde (Fermi doublet)')],
    [2260, 2210, 'C≡N',  t('nitrile', 'nitrile')],
    [2260, 2100, 'C≡C',  t('alchino', 'alkyne')],
    [1820, 1770, 'C=O',  t('cloruro acilico o anidride', 'acyl chloride or anhydride')],
    [1750, 1735, 'C=O',  t('estere', 'ester')],
    [1740, 1720, 'C=O',  t('aldeide', 'aldehyde')],
    [1725, 1700, 'C=O',  t('chetone', 'ketone')],
    [1720, 1680, 'C=O',  t('acido carbossilico', 'carboxylic acid')],
    [1690, 1630, 'C=O',  t('ammide', 'amide')],
    [1680, 1600, 'C=C',  t('alchene', 'alkene')],
    [1600, 1450, 'C=C',  t('anello aromatico', 'aromatic ring')],
    [1560, 1515, 'N–O',  t('nitro, asimmetrico', 'nitro, asymmetric')],
    [1390, 1320, 'N–O',  t('nitro, simmetrico', 'nitro, symmetric')],
    [1320, 1000, 'C–O',  t('alcol, estere, etere o acido', 'alcohol, ester, ether or acid')],
    [1250, 1020, 'C–N',  t('ammina', 'amine')],
    [910,  665,  'N–H',  t('ammina, piegamento fuori dal piano',
                           'amine, out-of-plane bending')],
    [900,  675,  '=C–H', t('aromatico sostituito, fuori dal piano',
                           'substituted aromatic, out-of-plane')],
    [800,  550,  'C–Cl', t('alogenuro alchilico', 'alkyl halide')]
  ];

  function assegnaIR(numeroOnda) {
    var fuori = [];
    BANDE_IR.forEach(function (b) {
      if (numeroOnda <= b[0] && numeroOnda >= b[1]) {
        fuori.push({ legame: b[2], nota: b[3], da: b[1], a: b[0] });
      }
    });
    return fuori;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §5 · Le perdite neutre in spettrometria di massa
     ═════════════════════════════════════════════════════════════════════════
     La differenza fra due picchi è un frammento perso. Riconoscerla è il modo
     in cui si legge uno spettro di massa a mano. */
  var PERDITE = [
    [1,  'H',            t('idrogeno', 'hydrogen')],
    [15, 'CH₃',          t('metile', 'methyl')],
    [17, 'OH',           t('ossidrile', 'hydroxyl')],
    [18, 'H₂O',          t('acqua — alcoli, acidi', 'water — alcohols, acids')],
    [28, 'CO',           t('monossido di carbonio — chetoni, fenoli',
                           'carbon monoxide — ketones, phenols')],
    [28, 'C₂H₄',         t('etilene — riarrangiamento di McLafferty',
                           'ethylene — McLafferty rearrangement')],
    [29, 'CHO',          t('formile — aldeidi', 'formyl — aldehydes')],
    [29, 'C₂H₅',         t('etile', 'ethyl')],
    [31, 'OCH₃',         t('metossile — esteri metilici', 'methoxy — methyl esters')],
    [43, 'C₃H₇',         t('propile', 'propyl')],
    [43, 'CH₃CO',        t('acetile — metilchetoni', 'acetyl — methyl ketones')],
    [44, 'CO₂',          t('anidride carbonica — acidi, esteri',
                           'carbon dioxide — acids, esters')],
    [45, 'COOH',         t('carbossile', 'carboxyl')],
    [46, 'NO₂',          t('nitro', 'nitro')],
    [59, 'COOCH₃',       t('metossicarbonile', 'methoxycarbonyl')],
    [77, 'C₆H₅',         t('fenile', 'phenyl')],
    [91, 'C₇H₇',         t('tropilio — alchilbenzeni', 'tropylium — alkylbenzenes')]
  ];

  function perditeNeutre(picchi, tolleranza) {
    var tol = tolleranza != null ? tolleranza : 0.5;
    var fuori = [];
    for (var i = 0; i < picchi.length && i < 12; i++) {
      for (var j = i + 1; j < picchi.length && j < 12; j++) {
        var d = Math.abs(picchi[i].x - picchi[j].x);
        PERDITE.forEach(function (p) {
          if (Math.abs(d - p[0]) <= tol) {
            fuori.push({ da: Math.max(picchi[i].x, picchi[j].x),
                         a: Math.min(picchi[i].x, picchi[j].x),
                         delta: d, frammento: p[1], nota: p[2] });
          }
        });
      }
    }
    return fuori;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §6 · L'analisi completa
     ═════════════════════════════════════════════════════════════════════════ */
  /* Una CURVA e una LISTA DI PICCHI sono due cose diverse, e trattarle allo
     stesso modo è l'errore che rende inutile un lettore di spettri di massa:
     su una lista ogni riga È un picco, e cercarvi massimi locali con una linea
     di base mobile non trova niente. Si distinguono dal passo: un
     campionamento fitto ha passo piccolo e regolare, una lista no. */
  function eListaDiPicchi(x) {
    if (x.length < 2) return false;
    /* Quante righe, non quanto è largo il passo. La prima stesura diceva
       «passo ≥ 0,9 ⇒ lista», e uno spettro IR campionato ogni 4 cm⁻¹ — che è
       una curva a tutti gli effetti — finiva fra le liste: la tabella delle
       bande provava a scrivere un SNR che per le liste non esiste, e la
       sezione si rompeva. Una curva ha MOLTI punti; una lista di picchi ne ha
       pochi, e quasi sempre irregolari. */
    if (x.length >= 200) return false;
    var passi = [];
    for (var i = 1; i < x.length; i++) passi.push(Math.abs(x[i] - x[i - 1]));
    var med = mediana(passi);
    if (med >= 0.9) return true;
    var dev = mediana(passi.map(function (v) { return Math.abs(v - med); }));
    return med > 0 && dev > med * 0.5;
  }

  function tipoDa(spettro, scelta) {
    if (scelta && scelta !== 'auto') return scelta;
    var d = (spettro.tipo || '').toUpperCase();
    if (/INFRARED|IR/.test(d)) return 'ir';
    if (/MASS/.test(d)) return 'ms';
    if (/NMR/.test(d)) return 'nmr';
    if (/UV|VIS/.test(d)) return 'uv';
    /* dal dominio dei numeri: in assenza di dichiarazione, l'asse lo dice */
    var min = Math.min.apply(null, spettro.x), max = Math.max.apply(null, spettro.x);
    /* una lista di picchi con m/z interi è uno spettro di massa: è la forma in
       cui gli spettri di massa circolano quasi sempre */
    if (eListaDiPicchi(spettro.x) && max > 20 && min >= 0) return 'ms';
    if (min >= 350 && max <= 4500) return 'ir';
    if (min >= -2 && max <= 15) return 'nmr';
    if (min >= 180 && max <= 900) return 'uv';
    if (max > 4500) return 'ms';
    return 'generico';
  }

  function analizza(spettro, opz) {
    opz = opz || {};
    if (!spettro || !spettro.x || spettro.x.length < 3) return null;
    var tipo = tipoDa(spettro, opz.tipo);
    /* L'IR si misura in trasmittanza: i picchi puntano in GIÙ. Cercare massimi
       su una trasmittanza vorrebbe dire trovare il fondo, non le bande. */
    var versoIlBasso = (tipo === 'ir' && /TRANSMITTANCE|%T/i.test(spettro.unitaY || '')) ||
                       (opz.versoIlBasso === true);
    var lista = eListaDiPicchi(spettro.x);
    var r;
    if (lista) {
      /* su una lista i picchi sono i punti: si tengono quelli sopra l'1% del
         massimo, e si dichiara che il rumore NON è stimabile — da sei righe
         non si stima un rumore, e fingere di saperlo sarebbe peggio che
         ammetterlo */
      var maxY = Math.max.apply(null, spettro.y.map(Math.abs)) || 1;
      var soglia = maxY * (opz.sogliaRelativa != null ? opz.sogliaRelativa : 0.01);
      var pk = [];
      spettro.x.forEach(function (xv, i) {
        if (Math.abs(spettro.y[i]) >= soglia)
          pk.push({ i: i, x: xv, y: spettro.y[i], altezza: spettro.y[i],
                    prominenza: Math.abs(spettro.y[i]),
                    snr: null, relativa: Math.abs(spettro.y[i]) / maxY * 100 });
      });
      pk.sort(function (a4, b4) { return b4.prominenza - a4.prominenza; });
      r = { picchi: pk, sigma: null, base: spettro.y.map(function () { return 0; }) };
    } else {
      r = trovaPicchi(spettro.x, spettro.y, {
        versoIlBasso: versoIlBasso, snr: opz.snr, finestraBase: opz.finestraBase
      });
    }
    var esito = {
      tipo: tipo, versoIlBasso: versoIlBasso, listaDiPicchi: lista,
      punti: spettro.x.length, sigma: r.sigma,
      /* tre casi distinti, e vanno detti distinti: il rumore misurato, il
         rumore non misurabile perché la traccia è liscia, e la lista di
         picchi dove di rumore non si parla nemmeno */
      rumoreMisurabile: lista ? null : !!r.rumoreMisurabile,
      sogliaUsata: r.sogliaUsata != null ? r.sogliaUsata : null,
      intervallo: [Math.min.apply(null, spettro.x), Math.max.apply(null, spettro.x)],
      picchi: r.picchi.slice(0, opz.quanti || 30),
      base: r.base
    };
    if (tipo === 'ir') {
      esito.bande = esito.picchi.map(function (p) {
        return { x: p.x, snr: p.snr, assegnazioni: assegnaIR(p.x) };
      });
      esito.nonAssegnate = esito.bande.filter(function (b) { return !b.assegnazioni.length; }).length;
    }
    if (tipo === 'ms') {
      var base = esito.picchi.reduce(function (m, p) {
        return (!m || Math.abs(p.y) > Math.abs(m.y)) ? p : m; }, null);
      esito.piccoBase = base;
      esito.ionePiuPesante = esito.picchi.reduce(function (m, p) {
        return (!m || p.x > m.x) ? p : m; }, null);
      esito.perdite = perditeNeutre(esito.picchi, opz.tolleranzaMassa);
    }
    if (tipo === 'nmr') {
      /* l'integrazione: l'area sotto ogni picco, normalizzata al più piccolo.
         È il numero che in un protone si legge davvero. */
      var aree = esito.picchi.map(function (p) {
        var a = 0;
        for (var k = Math.max(0, p.i - 6); k < Math.min(spettro.x.length, p.i + 7); k++) {
          a += Math.max(0, spettro.y[k] - r.base[k]);
        }
        return { x: p.x, area: a };
      });
      var minArea = aree.reduce(function (m, v) {
        return (v.area > 0 && (m === null || v.area < m)) ? v.area : m; }, null);
      esito.integrazioni = aree.map(function (v) {
        return { x: v.x, area: v.area,
                 relativa: minArea ? +(v.area / minArea).toFixed(2) : null };
      });
    }
    return esito;
  }

  /* ═════════════════════════════════════════════════════════════════════════ */

  /* ═════════════════════════════════════════════════════════════════════════
     §6-bis · Uno spettro da una IMMAGINE

     Succede spesso di avere lo spettro solo come figura: una fotografia del
     registratore, un ritaglio da un articolo, lo schermo dello strumento.
     Qui la traccia si estrae dai PIXEL.

     COME. Si disegna l'immagine su una tela e, colonna per colonna, si cerca
     la riga piu' SCURA rispetto allo sfondo. Il fondo di uno spettro stampato
     e' chiaro e la traccia e' scura: la differenza di luminanza e' il segnale.
     Le colonne dove non c'e' niente di abbastanza scuro restano vuote e
     vengono interpolate dalle vicine, cosi' un tratteggio o una riga
     interrotta non spezza la curva.

     CHE COSA NON PUO' FARE, E VA DETTO FORTE.
     L'immagine non contiene i NUMERI degli assi: una figura non sa di essere
     fra 4000 e 400 cm⁻¹. La scala la deve dare chi legge, ed e' per questo
     che la funzione la PRETENDE invece di indovinarla. Se gli estremi sono
     sbagliati, i picchi usciranno a numeri d'onda sbagliati pur essendo nel
     posto giusto della figura: la forma e' recuperata, la taratura no. E
     un'immagine compressa, rigata o con la griglia marcata porta con se' il
     proprio rumore, che diventa rumore dello spettro.
     ═════════════════════════════════════════════════════════════════════════ */
  function daImmagine(immagine, opz) {
    opz = opz || {};
    /* UNA SOLA CASA PER FUNZIONE.
       Questa funzione era l'implementazione. Ora l'implementazione sta in
       `bsi-digitalizza.js`, che fa la stessa cosa fatta bene: trova la
       cornice degli assi invece di digitalizzare anche le etichette, prende
       il baricentro a subpixel invece del pixel più scuro, sopravvive alla
       griglia, tara anche l'asse verticale e converte la trasmittanza in
       assorbanza. Qui resta il NOME, perché il resto dell'applicazione e i
       banchi lo chiamano così, e perché due implementazioni della stessa
       cosa divergono il giorno dopo.
       Il ripiego sotto serve solo se il modulo non è caricato. */
    if (globale.BSIDigitalizza) return globale.BSIDigitalizza.digitalizza(immagine, opz);
    var W = immagine.naturalWidth || immagine.width;
    var H = immagine.naturalHeight || immagine.height;
    if (!W || !H) return null;
    /* si riduce la larghezza se e' enorme: mille colonne bastano a qualunque
       spettro e tengono la lettura sotto i pochi millisecondi */
    var LARGO = Math.min(W, opz.colonne || 1000);
    var ALTO = Math.max(1, Math.round(H * LARGO / W));
    var tela = document.createElement('canvas');
    tela.width = LARGO; tela.height = ALTO;
    var ctx = tela.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(immagine, 0, 0, LARGO, ALTO);
    var dati;
    try { dati = ctx.getImageData(0, 0, LARGO, ALTO).data; }
    catch (e) { return { errore: t('l’immagine viene da un altro dominio e non si può leggere',
                                   'the image comes from another origin and cannot be read') }; }

    /* luminanza per pixel, e la mediana come stima dello SFONDO */
    var lum = new Float32Array(LARGO * ALTO);
    var campione = [];
    for (var i = 0, k = 0; i < dati.length; i += 4, k++) {
      var l = 0.2126 * dati[i] + 0.7152 * dati[i + 1] + 0.0722 * dati[i + 2];
      /* un pixel trasparente e' sfondo */
      if (dati[i + 3] < 24) l = 255;
      lum[k] = l;
      if ((k % 7) === 0) campione.push(l);
    }
    campione.sort(function (a2, b2) { return a2 - b2; });
    var sfondo = campione.length ? campione[Math.floor(campione.length * 0.9)] : 255;
    var soglia = (opz.soglia !== undefined) ? opz.soglia : (sfondo - 45);

    var riga = new Array(LARGO);
    for (var x = 0; x < LARGO; x++) {
      var migliore = -1, piuScuro = soglia;
      for (var y = 0; y < ALTO; y++) {
        var v = lum[y * LARGO + x];
        if (v < piuScuro) { piuScuro = v; migliore = y; }
      }
      riga[x] = migliore;
    }
    /* le colonne vuote si riempiono interpolando: un tratteggio non deve
       diventare un buco nella curva */
    var primi = riga.filter(function (v) { return v >= 0; }).length;
    if (primi < LARGO * 0.25) {
      return { errore: t('non ho trovato una traccia abbastanza scura: prova a ritagliare ' +
                         'la figura o ad aumentare il contrasto',
                         'no dark enough trace found: try cropping the figure or raising the contrast'),
               colonneConTraccia: primi, colonne: LARGO };
    }
    var ultimo = -1;
    for (var a2 = 0; a2 < LARGO; a2++) {
      if (riga[a2] >= 0) {
        if (ultimo >= 0 && a2 - ultimo > 1) {
          for (var m = ultimo + 1; m < a2; m++) {
            riga[m] = riga[ultimo] + (riga[a2] - riga[ultimo]) * (m - ultimo) / (a2 - ultimo);
          }
        }
        ultimo = a2;
      }
    }
    for (var b2 = 0; b2 < LARGO; b2++) if (riga[b2] < 0) riga[b2] = riga[ultimo >= 0 ? ultimo : 0] || 0;

    /* La scala la DEVE dare chi legge: l'immagine non la contiene. */
    var x0 = (opz.xDa !== undefined) ? +opz.xDa : 0;
    var x1 = (opz.xA !== undefined) ? +opz.xA : (LARGO - 1);
    var xs = [], ys = [];
    for (var c = 0; c < LARGO; c++) {
      xs.push(x0 + (x1 - x0) * c / (LARGO - 1));
      /* y si inverte: sulla figura cresce verso il basso */
      ys.push(ALTO - 1 - riga[c]);
    }
    /* se le x vanno all'indietro (IR: 4000 → 400) si riordinano crescenti,
       perche' tutto il resto del lettore le vuole cosi' */
    if (xs.length > 1 && xs[0] > xs[xs.length - 1]) { xs.reverse(); ys.reverse(); }
    return {
      formato: t('immagine', 'image'), x: xs, y: ys,
      titolo: opz.titolo || '', tipo: opz.tipo || '',
      unitaX: opz.unitaX || '', unitaY: t('scurezza (unità arbitrarie)', 'darkness (arbitrary units)'),
      daImmagine: true, colonne: LARGO, sfondo: Math.round(sfondo), soglia: Math.round(soglia),
      avviso: t('La scala degli assi non sta nell’immagine: è quella che hai indicato. ' +
                'La FORMA della traccia è recuperata dai pixel, la TARATURA no.',
                'The axis scale is not in the image: it is the one you gave. The trace SHAPE ' +
                'is recovered from the pixels, the calibration is not.')
    };
  }

  globale.BSILettoreSpettri = {
    daImmagine: daImmagine,
    leggi: leggi, leggiJCAMP: leggiJCAMP, leggiColonne: leggiColonne,
    decodificaASDF: decodificaASDF,
    trovaPicchi: trovaPicchi, lineaDiBase: lineaDiBase, rumore: rumore,
    assegnaIR: assegnaIR, perditeNeutre: perditeNeutre,
    analizza: analizza, tipoDa: tipoDa, eListaDiPicchi: eListaDiPicchi,
    BANDE_IR: BANDE_IR, PERDITE: PERDITE,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);

/* ═══════════════════════════════════════════════════════════════════════════
   §7 · Il pannello — la sezione «Lettore spettri»
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var S = globale.BSILettoreSpettri;
  if (!S) {
    /* Se il motore non c'e' la sezione resterebbe vuota senza una parola:
       meglio dirlo nella console di chi guarda, che tacere. */
    try { console.error('bsi-spettrolettore: BSILettoreSpettri assente, la sezione non si disegna'); } catch (_e) {}
    return;
  }

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var css = document.createElement('style');
  css.textContent = [
    '.bsiSP-card{background:#11243a;border:1px solid #1e3a52;border-radius:12px;padding:14px 16px;margin-bottom:12px}',
    '.bsiSP-card h4{margin:0 0 8px;color:#1fd39a;font-size:13.5px;font-weight:800}',
    '.bsiSP-card p{margin:0 0 8px;color:#cfe2f5;font-size:12.8px;line-height:1.62}',
    '.bsiSP-in{width:100%;padding:10px 12px;background:#081321;border:1px solid #1e3a52;' +
      'border-radius:10px;color:#e8f4ff;font-size:12px;font-family:ui-monospace,monospace;' +
      'outline:none;box-sizing:border-box;resize:vertical;min-height:90px}',
    '.bsiSP-in:focus{border-color:#1fd39a}',
    '.bsiSP-btn{padding:10px 18px;background:#1fd39a;border:none;border-radius:9px;' +
      'color:#06141f;font-weight:800;font-size:13px;cursor:pointer}',
    '.bsiSP-btn2{padding:9px 14px;background:#16293f;border:1px solid #1e3a52;border-radius:9px;' +
      'color:#bcd3e8;font-weight:700;font-size:12.5px;cursor:pointer}',
    '.bsiSP-btn2:hover{border-color:#1fd39a;color:#e8f4ff}',
    '.bsiSP-tbl{width:100%;border-collapse:collapse;font-size:12px}',
    '.bsiSP-tbl th{background:#15354a;color:#bff3e4;padding:7px 9px;text-align:left;font-weight:800;font-size:11.5px}',
    '.bsiSP-tbl td{padding:6px 9px;border-bottom:1px solid #16293f;color:#cfe2f5;vertical-align:top;line-height:1.5}',
    '.bsiSP-avv{background:#2a1f0c;border:1px solid #6b5420;border-radius:9px;padding:10px 13px;' +
      'color:#f0d79a;font-size:12.2px;line-height:1.6;margin-bottom:10px}',
    '.bsiSP-ok{background:#0c3024;border:1px solid #1aa97a;border-radius:9px;padding:10px 13px;' +
      'color:#9ff0d4;font-size:12.2px;line-height:1.6;margin-bottom:10px}'
  ].join('\n');
  document.head.appendChild(css);

  var ESEMPI = {
    ir: function () {
      /* una banda carbonilica, una C–H e una O–H larga, su rumore */
      var r = ['##TITLE=esempio IR', '##JCAMP-DX=4.24', '##DATA TYPE=INFRARED SPECTRUM',
               '##XUNITS=1/CM', '##YUNITS=ABSORBANCE', '##XFACTOR=1', '##YFACTOR=1'];
      var x = [], y = [], seme = 7;
      function caso() { seme = (seme * 1103515245 + 12345) & 0x7fffffff; return seme / 0x7fffffff - 0.5; }
      function g(v, c, a, w) { return a * Math.exp(-Math.pow(v - c, 2) / (2 * w * w)); }
      for (var v = 500; v <= 4000; v += 4) {
        x.push(v);
        y.push(g(v,1710,0.95,14) + g(v,2960,0.55,30) + g(v,3380,0.40,70) +
               g(v,1240,0.45,25) + 0.02 + caso() * 0.012);
      }
      r.push('##FIRSTX=' + x[0], '##LASTX=' + x[x.length-1], '##NPOINTS=' + x.length,
             '##XYPOINTS=(XY..XY)');
      for (var i = 0; i < x.length; i++) r.push(x[i] + ' ' + y[i].toFixed(4));
      r.push('##END=');
      return r.join('\n');
    },
    ms: function () {
      /* toluene: M+ 92, tropilio 91, perdita di 15 e di 1 */
      var p = [[39,12],[51,18],[65,42],[91,100],[92,68],[93,5]];
      var out = ['# spettro di massa — m/z  intensità'];
      p.forEach(function (q) { out.push(q[0] + '  ' + q[1]); });
      return out.join('\n');
    },
    nmr: function () {
      /* etanolo: tripletto 1,2 (3H) · quartetto 3,7 (2H) · singoletto 2,6 (1H) */
      var x = [], y = [];
      function g(v, c, a, w) { return a * Math.exp(-Math.pow(v - c, 2) / (2 * w * w)); }
      for (var v = 0; v <= 10; v += 0.005) {
        x.push(+v.toFixed(3));
        y.push(g(v,1.20,3.0,0.02) + g(v,3.70,2.0,0.02) + g(v,2.60,1.0,0.02));
      }
      return x.map(function (v, i) { return v + ' ' + y[i].toFixed(4); }).join('\n');
    }
  };

  var spettroCorrente = null, analisiCorrente = null;

  /* ═════════════════════════════════════════════════════════════════════════
     UNA SOLA PORTA D'INGRESSO

     C'erano due schede: «Carica uno spettro», che accettava JCAMP-DX e due
     colonne di numeri, e «Apri un documento», che accettava tutto il resto.
     Due schede separate per la stessa domanda — «ho un file, cosa ci faccio?»
     — e chi arrivava con il PDF di un compito apriva la prima, trovava un
     selettore che mostrava SOLO i `.jdx` e i `.csv`, e si fermava lì: quei
     formati non ce li ha nessuno, escono dagli spettrofotometri.

     Ora la porta è una sola e non filtra niente. Si apre il file e **il
     programma decide che cos'è**, dicendolo: uno spettro si misura, un
     documento si svolge, una fotografia si fa tutte e due le cose perché può
     essere l'uno o l'altro.
     ═════════════════════════════════════════════════════════════════════════ */
  function vista() {
    return '' +
'<div class="bsiSP-card"><h4>' +
  t('📂 Apri un file qualunque, o incolla i dati',
    '📂 Open any file, or paste the data') + '</h4><p>' +
t('Il <b>PDF</b> di un compito, la <b>fotografia</b> di uno spettro o di un ' +
  'foglio, un <b>documento Word</b>, un file <b>JCAMP-DX</b> appena uscito ' +
  'dallo strumento, due colonne di numeri da un foglio di calcolo. ' +
  '<b>Il selettore non filtra niente</b>: apri quello che hai, e ci penso io a ' +
  'capire che cos’è — e a dirtelo.',
  'The <b>PDF</b> of an exam, a <b>photograph</b> of a spectrum or of a sheet, ' +
  'a <b>Word document</b>, a <b>JCAMP-DX</b> file straight from the instrument, ' +
  'two columns of numbers from a spreadsheet. <b>The picker filters nothing</b>: ' +
  'open what you have, and I work out what it is — and tell you.') + '</p>' +
'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">' +
'<input type="file" id="bsiSP-file" style="display:none">' +
'<button class="bsiSP-btn" id="bsiSP-apri">' +
  t('📂 Apri un file', '📂 Open a file') + '</button>' +
/* IL BOTTONE DELL'IMMAGINE E' SEPARATO, E NON E' UN DOPPIONE.
   Su un telefono un `<input type=file>` SENZA `accept` apre il navigatore
   dei file; con `accept="image/*"` apre la GALLERIA e offre la fotocamera.
   Sono due selettori diversi del sistema operativo, non due filtri dello
   stesso. Tenere solo il primo — che è quello che serve per i PDF — vuol
   dire che chi ha lo spettro in una foto non trova la strada per darla:
   l'opzione c'era nel codice e non c'era sullo schermo. */
'<input type="file" id="bsiSP-img" accept="image/*" style="display:none">' +
'<button class="bsiSP-btn" id="bsiSP-apriImg">' +
  t('📷 Foto o immagine di uno spettro', '📷 Photo or image of a spectrum') + '</button>' +
/* l'ingresso dedicato ai documenti resta nascosto: lo usano i banchi e il
   codice che apre un documento da un'altra parte dell'applicazione */
'<input type="file" id="bsiSP-doc" style="display:none">' +
'</div>' +
'<div id="bsiSP-deciso" style="font-size:12px;color:#8aadcc;margin-bottom:10px"></div>' +
'<p style="font-size:12.5px;color:#cfe2f5;margin:0 0 6px">' +
  t('…oppure incolla qui i dati dello spettro o il <b>testo del quesito</b>:',
    '…or paste the spectrum data or the <b>problem text</b> here:') + '</p>' +
'<textarea class="bsiSP-in" id="bsiSP-src" rows="6" spellcheck="false" aria-label="' +
t('Dati dello spettro o testo del quesito', 'Spectrum data or problem text') +
'" placeholder="##TITLE=...&#10;1000 0.12&#10;1002 0.15"></textarea>' +
'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px">' +
'<button class="bsiSP-btn" id="bsiSP-go">' +
  t('Leggi e svolgi', 'Read and work it out') + '</button>' +
'<button class="bsiSP-btn2" data-es="ir">' + t('esempio IR', 'IR example') + '</button>' +
'<button class="bsiSP-btn2" data-es="ms">' + t('esempio MS', 'MS example') + '</button>' +
'<button class="bsiSP-btn2" data-es="nmr">' + t('esempio NMR', 'NMR example') + '</button>' +
'<button class="bsiSP-btn2" id="bsiSP-esQuesito">' +
  t('esempio: un quesito d’esame', 'example: an exam problem') + '</button>' +
'<button class="bsiSP-btn2" id="bsiSP-pulisci">' + t('Pulisci', 'Clear') + '</button>' +
'</div>' +
'<p style="font-size:11px;color:#7a8aa0;margin:9px 0 0">' + t('Formati: ', 'Formats: ') +
  (globale.BSIDocumento ? globale.BSIDocumento.FORMATI : 'PDF, …') + '</p>' +
'</div>' +
'<div class="bsiSP-card" id="bsiSP-scala" style="display:none"><h4>' +
  t('La taratura dell’immagine', 'The image calibration') + '</h4><p>' + t(
  'Una figura non sa di essere fra 4000 e 400 cm⁻¹: i numeri degli assi non ' +
  'stanno nei pixel. La <b>forma</b> della traccia si recupera, la <b>taratura</b> ' +
  'la devi dare tu — e se la sbagli i picchi usciranno a numeri sbagliati pur ' +
  'essendo nel punto giusto della figura. I valori qui sotto sono quelli ai ' +
  '<b>bordi del grafico</b>, non dell’immagine: la cornice degli assi la trovo io.',
  'A figure does not know it spans 4000 to 400 cm⁻¹: the axis numbers are not ' +
  'in the pixels. The trace <b>shape</b> is recovered; the <b>calibration</b> is ' +
  'yours to give — and if you get it wrong the peaks will come out at wrong ' +
  'numbers while sitting in the right place on the figure. The values below are ' +
  'those at the <b>plot edges</b>, not the image edges: I find the axis frame myself.') + '</p>' +
'<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:8px">' +
'<label style="font-size:12px;color:#8aadcc">' + t('x a sinistra', 'x at left') +
  ' <input class="bsiSP-in" id="bsiSP-x0" style="width:88px;display:inline-block" value="4000"></label>' +
'<label style="font-size:12px;color:#8aadcc">' + t('x a destra', 'x at right') +
  ' <input class="bsiSP-in" id="bsiSP-x1" style="width:88px;display:inline-block" value="400"></label>' +
'<label style="font-size:12px;color:#8aadcc">' + t('unità x', 'x unit') +
  ' <input class="bsiSP-in" id="bsiSP-xu" style="width:78px;display:inline-block" value="cm-1"></label>' +
'<label style="font-size:12px;color:#8aadcc"><input type="checkbox" id="bsiSP-logx"> ' +
  t('x logaritmica', 'x logarithmic') + '</label>' +
'</div>' +
'<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:8px">' +
'<label style="font-size:12px;color:#8aadcc">' + t('y in basso', 'y at bottom') +
  ' <input class="bsiSP-in" id="bsiSP-y0" style="width:88px;display:inline-block" placeholder="0"></label>' +
'<label style="font-size:12px;color:#8aadcc">' + t('y in alto', 'y at top') +
  ' <input class="bsiSP-in" id="bsiSP-y1" style="width:88px;display:inline-block" placeholder="100"></label>' +
'<label style="font-size:12px;color:#8aadcc">' + t('unità y', 'y unit') +
  ' <select class="bsiSP-in" id="bsiSP-yu" style="width:132px;display:inline-block">' +
  '<option value="">' + t('non tarata (pixel)', 'not calibrated (pixels)') + '</option>' +
  '<option value="%T">%T</option><option value="T">T (0–1)</option>' +
  '<option value="A">' + t('A (assorbanza)', 'A (absorbance)') + '</option>' +
  '<option value="I">' + t('intensità', 'intensity') + '</option></select></label>' +
'<label style="font-size:12px;color:#8aadcc"><input type="checkbox" id="bsiSP-logy"> ' +
  t('y logaritmica', 'y logarithmic') + '</label>' +
'</div>' +
'<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:8px">' +
'<label style="font-size:12px;color:#8aadcc"><input type="checkbox" id="bsiSP-adA" checked> ' +
  t('converti %T in assorbanza (A = −log₁₀T)', 'convert %T to absorbance (A = −log₁₀T)') + '</label>' +
'<label style="font-size:12px;color:#8aadcc">' + t('cornice', 'frame') +
  ' <select class="bsiSP-in" id="bsiSP-corn" style="width:150px;display:inline-block">' +
  '<option value="auto">' + t('trovala tu', 'find it yourself') + '</option>' +
  '<option value="tutta">' + t('tutta la figura', 'the whole figure') + '</option></select></label>' +
'</div>' +
'<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">' +
'<button class="bsiSP-btn" id="bsiSP-rileggiImg">' + t('rileggi l’immagine', 'read the image again') + '</button>' +
'<button class="bsiSP-btn2" id="bsiSP-csv">' + t('scarica CSV', 'download CSV') + '</button>' +
'<button class="bsiSP-btn2" id="bsiSP-jdx">' + t('scarica JCAMP-DX', 'download JCAMP-DX') + '</button>' +
'</div><div id="bsiSP-imgNota" style="font-size:11px;color:#8aadcc;margin-top:8px;line-height:1.5"></div></div>' +
/* ── LA GUIDA ──────────────────────────────────────────────────────────────
   Chiesta, e giusta da avere: uno strumento che chiede una taratura senza
   spiegare che cos'è la taratura non è usabile. Sta in un `<details>` così
   chi l'ha già letta la chiude e non la trova più in mezzo. */
'<details class="bsiSP-card" id="bsiSP-guida"><summary style="cursor:pointer;' +
  'font-weight:700;color:#5eead4;font-size:14px">' +
  t('📖 Come si usa — guida completa', '📖 How to use it — full guide') + '</summary>' +
'<h4 style="margin-top:12px">' + t('1 · Uno spettro che hai in un file',
                                   '1 · A spectrum you have in a file') + '</h4><p>' +
t('Premi <b>Apri un file</b> e dai il file: un <b>JCAMP-DX</b> (<code>.jdx</code>, ' +
  '<code>.dx</code>) appena uscito dallo strumento, anche nella forma compressa, ' +
  'oppure due colonne di numeri da un foglio di calcolo. Il grafico, i picchi e ' +
  'le assegnazioni compaiono da soli: non c’è niente da premere dopo.',
  'Press <b>Open a file</b> and give it the file: a <b>JCAMP-DX</b> ' +
  '(<code>.jdx</code>, <code>.dx</code>) straight from the instrument, compressed ' +
  'form included, or two columns of numbers from a spreadsheet. The chart, the peaks ' +
  'and the assignments appear by themselves: there is nothing to press afterwards.') +
'</p><h4>' + t('2 · Uno spettro che hai solo come figura',
                '2 · A spectrum you only have as a figure') + '</h4><p>' +
t('Premi <b>Foto o immagine di uno spettro</b>: si apre la galleria del telefono e ' +
  'puoi anche scattare la foto sul momento. Funziona la fotografia del registratore, ' +
  'il ritaglio di un articolo, lo schermo dello strumento. La traccia viene estratta ' +
  'dai <b>pixel</b>, e il grafico compare subito.',
  'Press <b>Photo or image of a spectrum</b>: the phone gallery opens and you can also ' +
  'take the picture there and then. A photograph of the chart recorder works, a crop ' +
  'from a paper, the instrument screen. The trace is extracted from the <b>pixels</b>, ' +
  'and the chart appears at once.') + '</p>' +
'<p><b>' + t('Poi tara gli assi.', 'Then calibrate the axes.') + '</b> ' +
t('È il passaggio che decide se i numeri valgono qualcosa. Scrivi il valore ' +
  'all’estremo <b>sinistro</b> e a quello <b>destro</b> del grafico — per un IR ' +
  'tipicamente 4000 e 400, in quest’ordine, perché l’IR si scrive con i numeri ' +
  'd’onda che <i>decrescono</i>. Per l’asse verticale, se la figura è in <b>%T</b> ' +
  'scegli «%T» e metti 0 in basso e 100 in alto: da lì calcolo l’assorbanza con ' +
  'A = −log₁₀T, che è la definizione. Se lasci l’asse verticale non tarato, la forma ' +
  'e le posizioni dei picchi restano giuste e le <i>intensità</i> no — e te lo scrivo.',
  'This is the step that decides whether the numbers mean anything. Write the value at ' +
  'the <b>left</b> and <b>right</b> edge of the plot — for an IR typically 4000 and 400, ' +
  'in that order, because an IR is written with <i>decreasing</i> wavenumbers. For the ' +
  'vertical axis, if the figure is in <b>%T</b> pick "%T" and put 0 at the bottom and 100 ' +
  'at the top: from there I compute the absorbance with A = −log₁₀T, which is the ' +
  'definition. If you leave the vertical axis uncalibrated the shape and the peak ' +
  'positions stay right and the <i>intensities</i> do not — and I say so.') + '</p>' +
'<h4>' + t('3 · Che cosa faccio da solo', '3 · What I do by myself') + '</h4><ul style="margin:0 0 10px 18px;padding:0">' +
'<li>' + t('<b>Trovo la cornice degli assi</b> e digitalizzo solo quello che c’è dentro: ' +
           'i numeri scritti sugli assi sono pixel scuri come la traccia, e senza questo ' +
           'finirebbero nella curva.',
           '<b>I find the axis frame</b> and digitise only what is inside it: the numbers ' +
           'written on the axes are dark pixels just like the trace, and without this they ' +
           'would end up in the curve.') + '</li>' +
'<li>' + t('<b>Sopravvivo alla griglia.</b> In ogni colonna ci sono due tratti scuri, la ' +
           'griglia e la traccia: scelgo quello vicino a dove la traccia stava un pixel prima.',
           '<b>I survive the grid.</b> In each column there are two dark runs, the grid and ' +
           'the trace: I pick the one near where the trace was a pixel earlier.') + '</li>' +
'<li>' + t('<b>Leggo a subpixel</b>: il centro della linea è il baricentro pesato sulla ' +
           'scurezza, non il pixel più scuro. Su una linea spessa due pixel e sfumata, è ' +
           'mezzo pixel di precisione in più in ogni punto.',
           '<b>I read at sub-pixel</b>: the line centre is the darkness-weighted centroid, ' +
           'not the darkest pixel. On a two-pixel antialiased line that is half a pixel more ' +
           'precision at every point.') + '</li>' +
'<li>' + t('<b>Trovo i picchi</b> per prominenza, con il rumore stimato dallo scarto ' +
           'assoluto mediano, e tengo solo quelli oltre tre volte il rumore.',
           '<b>I find the peaks</b> by prominence, with the noise estimated from the median ' +
           'absolute deviation, keeping only those above three times the noise.') + '</li>' +
'<li>' + t('<b>Disegno il grafico con le convenzioni giuste</b>: l’IR con i numeri d’onda ' +
           'decrescenti, i picchi segnati col loro valore, gli assi con le unità.',
           '<b>I draw the chart with the right conventions</b>: IR with decreasing ' +
           'wavenumbers, peaks marked with their value, axes with units.') + '</li></ul>' +
'<h4>' + t('4 · Che cosa non posso fare', '4 · What I cannot do') + '</h4><ul style="margin:0 0 10px 18px;padding:0">' +
'<li>' + t('<b>Non indovino i numeri degli assi</b>: nell’immagine non ci sono. Se sbagli la ' +
           'taratura, i picchi escono a numeri sbagliati stando nel punto giusto della figura.',
           '<b>I do not guess the axis numbers</b>: they are not in the image. If you get the ' +
           'calibration wrong, the peaks come out at wrong numbers while sitting in the right ' +
           'place on the figure.') + '</li>' +
'<li>' + t('<b>Non correggo la prospettiva.</b> Una foto presa di sbieco porta una ' +
           'deformazione che non raddrizzo: inquadra la figura di fronte.',
           '<b>I do not correct perspective.</b> A photo taken at an angle carries a ' +
           'distortion I do not straighten: frame the figure head-on.') + '</li>' +
'<li>' + t('<b>Non leggo il testo di una scansione</b>: una pagina scansionata contiene ' +
           'pixel, non lettere, e qui non c’è riconoscimento ottico dei caratteri.',
           '<b>I do not read the text of a scan</b>: a scanned page contains pixels, not ' +
           'letters, and there is no optical character recognition here.') + '</li>' +
'<li>' + t('<b>Non deduco la struttura</b> — vedi in fondo: è una scelta, non un limite ' +
           'tecnico.',
           '<b>I do not deduce the structure</b> — see at the bottom: that is a choice, not a ' +
           'technical limit.') + '</li></ul>' +
'<h4>' + t('5 · Quando il risultato esce storto', '5 · When the result comes out wrong') + '</h4>' +
'<table class="bsiSP-tbl"><tr><th>' + t('quello che vedi', 'what you see') + '</th><th>' +
  t('quasi sempre è', 'almost always it is') + '</th></tr>' +
'<tr><td>' + t('la curva è piatta sul bordo', 'the curve is flat along the edge') + '</td><td>' +
  t('la cornice non è stata trovata e la traccia si è agganciata al bordo: scegli ' +
    '«tutta la figura» oppure ritaglia l’immagine al solo grafico',
    'the frame was not found and the trace locked onto the border: pick "the whole figure" ' +
    'or crop the image to the plot only') + '</td></tr>' +
'<tr><td>' + t('i picchi sono a numeri assurdi', 'the peaks are at absurd numbers') + '</td><td>' +
  t('la taratura è invertita: per un IR il primo campo è 4000 e il secondo 400',
    'the calibration is reversed: for an IR the first field is 4000 and the second 400') +
  '</td></tr>' +
'<tr><td>' + t('non trova nessuna traccia', 'it finds no trace at all') + '</td><td>' +
  t('la figura è troppo chiara o la curva è troppo sottile: alza il contrasto, o ' +
    'ritaglia via il bianco intorno',
    'the figure is too pale or the curve too thin: raise the contrast, or crop away the ' +
    'surrounding white') + '</td></tr>' +
'<tr><td>' + t('trova trenta picchi', 'it finds thirty peaks') + '</td><td>' +
  t('l’immagine è compressa o rigata e il suo rumore è diventato rumore dello ' +
    'spettro: una figura più grande e meno compressa cambia tutto',
    'the image is compressed or streaky and its noise became the spectrum noise: a larger, ' +
    'less compressed figure changes everything') + '</td></tr></table>' +
'<h4>' + t('6 · Portare via i numeri', '6 · Taking the numbers away') + '</h4><p>' +
t('<b>scarica CSV</b> dà due colonne, <b>scarica JCAMP-DX</b> un file che qualunque ' +
  'programma di spettroscopia apre — e che questo stesso lettore rilegge identico. ' +
  'Dentro il JCAMP c’è scritto che la taratura è stata data a mano: chi lo apre fra un ' +
  'anno deve sapere che quei numeri vengono da dei pixel.',
  '<b>download CSV</b> gives two columns, <b>download JCAMP-DX</b> a file any ' +
  'spectroscopy program opens — and that this very reader reads back identical. Inside the ' +
  'JCAMP it is written that the calibration was given by hand: whoever opens it in a year ' +
  'must know those numbers come from pixels.') + '</p>' +
'<h4>' + t('7 · Un quesito d’esame', '7 · An exam problem') + '</h4><p>' +
t('Se apri il <b>PDF</b> o la <b>fotografia</b> di un compito, non mi fermo allo ' +
  'spettro: leggo tutto il documento, riconosco i dati spettroscopici che contiene ' +
  '— con scritto accanto <b>da dove li ho presi</b> — e svolgo la traccia passo per ' +
  'passo, dicendo per ogni passaggio la prova e quanto è certo.',
  'If you open the <b>PDF</b> or the <b>photograph</b> of an exam, I do not stop at the ' +
  'spectrum: I read the whole document, recognise the spectroscopic data in it — with ' +
  '<b>where I took each one from</b> written beside it — and work through the problem step ' +
  'by step, stating for each step the evidence and how certain it is.') + '</p></details>' +
'<div id="bsiSP-docStato" style="font-size:12px;color:#8aadcc;margin:0 0 10px"></div>' +
'<div id="bsiSP-docOut"></div>' +
'<div id="bsiSP-out"></div>' +
'<div class="bsiSP-card"><h4>' + t('Che cosa non fa', 'What it does not do') + '</h4><p>' +
t('Non deduce la struttura. Un insieme di bande è compatibile con molte ' +
  'molecole, e un programma che da tre picchi tirasse fuori un nome farebbe ' +
  'un’affermazione che i dati non reggono. Qui si dice «questa banda è ' +
  '<b>compatibile con</b>», e si elencano <b>tutte</b> le assegnazioni possibili, ' +
  'non la prima.',
  'It does not deduce the structure. A set of bands is compatible with many ' +
  'molecules, and a program that produced a name from three peaks would make a ' +
  'claim the data cannot support. Here it says "this band is <b>compatible ' +
  'with</b>", and lists <b>all</b> possible assignments, not the first.') +
'</p></div>';
  }

  function disegna(canvas, sp, an) {
    var ctx = (typeof globale.bsiNitido === 'function') ? globale.bsiNitido(canvas)
                                                        : canvas.getContext('2d');
    if (!ctx) return;
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060d1a'; ctx.fillRect(0, 0, W, H);
    var xmin = Math.min.apply(null, sp.x), xmax = Math.max.apply(null, sp.x);
    var ymin = Math.min.apply(null, sp.y), ymax = Math.max.apply(null, sp.y);
    if (ymax === ymin) ymax = ymin + 1;
    /* l'IR si guarda con i numeri d'onda che DECRESCONO: è la convenzione, e
       disegnarlo al contrario rende lo spettro irriconoscibile a chi lo sa
       leggere */
    var invertiX = (an && an.tipo === 'ir');
    var mx = 44, my = 22;
    function px(v) {
      var f = (v - xmin) / (xmax - xmin);
      if (invertiX) f = 1 - f;
      return mx + f * (W - mx - 10);
    }
    function py(v) { return H - my - (v - ymin) / (ymax - ymin) * (H - my - 14); }
    /* assi */
    ctx.strokeStyle = '#1e3a52'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, 8); ctx.lineTo(mx, H - my); ctx.lineTo(W - 6, H - my); ctx.stroke();
    ctx.font = '9px Arial'; ctx.fillStyle = '#6a8aa4'; ctx.textAlign = 'center';
    for (var k = 0; k <= 5; k++) {
      var v = xmin + (xmax - xmin) * k / 5;
      ctx.fillText(v.toFixed(v > 100 ? 0 : 2), px(v), H - my + 12);
    }
    /* L'ASSE VERTICALE AVEVA LE TACCHE? NO. E un grafico con un asse muto
       non è un grafico scientifico: si vede che qualcosa sale, e non si sa
       di quanto né in che unità. Quattro tacche e l'unità, ruotata, come si
       fa su carta. */
    ctx.textAlign = 'right';
    for (var q = 0; q <= 4; q++) {
      var vy = ymin + (ymax - ymin) * q / 4;
      var ay = Math.abs(vy);
      var et = (ay >= 1000 || (ay > 0 && ay < 0.01)) ? vy.toExponential(1)
             : (ay >= 10 ? vy.toFixed(0) : vy.toFixed(2));
      ctx.fillText(et, mx - 4, py(vy) + 3);
      ctx.strokeStyle = '#132a3e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, py(vy)); ctx.lineTo(W - 6, py(vy)); ctx.stroke();
    }
    if (sp.unitaY) {
      ctx.save();
      ctx.translate(10, (H - my) / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.fillStyle = '#6a8aa4'; ctx.font = '9px Arial';
      ctx.fillText(String(sp.unitaY).slice(0, 34), 0, 0);
      ctx.restore();
    }
    /* la traccia */
    ctx.beginPath();
    for (var i = 0; i < sp.x.length; i++) {
      var X = px(sp.x[i]), Y = py(sp.y[i]);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 1.2; ctx.stroke();
    /* i picchi trovati */
    if (an && an.picchi) {
      ctx.font = 'bold 9.5px Arial';
      an.picchi.slice(0, 12).forEach(function (p) {
        var X = px(p.x), Y = py(p.y);
        ctx.beginPath(); ctx.arc(X, Y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffd166'; ctx.fill();
        ctx.fillStyle = '#ffd166'; ctx.textAlign = 'center';
        ctx.fillText(p.x.toFixed(p.x > 100 ? 0 : 2), X, Y - 7);
      });
    }
    ctx.textAlign = 'left'; ctx.fillStyle = '#6a8aa4'; ctx.font = '9px Arial';
    ctx.fillText((sp.unitaX || '') + (invertiX ? '  ' + t('(decrescente)', '(decreasing)') : ''),
                 mx + 2, H - 4);
  }

  function rendi(sp, an) {
    var out = document.getElementById('bsiSP-out');
    if (!out) return;
    if (!sp) {
      out.innerHTML = '<div class="bsiSP-avv">' +
        t('Non riesco a leggere questi dati: servono un JCAMP-DX o due colonne di numeri.',
          'I cannot read this: a JCAMP-DX file or two columns of numbers are needed.') +
        '</div>';
      return;
    }
    var NOMI = { ir: 'IR', ms: t('massa','mass'), nmr: 'NMR', uv: 'UV-Vis',
                 generico: t('generico','generic') };
    var h = '<div class="bsiSP-card"><h4>' +
      t('Letto', 'Read') + ': ' + esc(sp.formato) +
      (sp.titolo ? ' · ' + esc(sp.titolo) : '') + '</h4><p>' +
      '<b>' + sp.x.length + '</b> ' + t('punti', 'points') + ' · ' +
      t('intervallo', 'range') + ' ' + an.intervallo[0].toFixed(2) + ' – ' +
      an.intervallo[1].toFixed(2) + (sp.unitaX ? ' ' + esc(sp.unitaX) : '') + ' · ' +
      t('riconosciuto come', 'recognised as') + ' <b>' + (NOMI[an.tipo] || an.tipo) + '</b>' +
      (an.versoIlBasso ? ' · ' + t('picchi verso il basso (trasmittanza)',
                                   'peaks pointing down (transmittance)') : '') +
      '</p>';
    if (sp.puntiDichiarati && sp.puntiDichiarati !== sp.x.length) {
      h += '<div class="bsiSP-avv">' +
        t('Il file dichiara ' + sp.puntiDichiarati + ' punti e ne contiene ' + sp.x.length +
          ': la decompressione non torna, e i valori vanno guardati con sospetto.',
          'The file declares ' + sp.puntiDichiarati + ' points and holds ' + sp.x.length +
          ': the decompression does not add up, and the values deserve suspicion.') +
        '</div>';
    }
    h += '<canvas id="bsiSP-tela" width="820" height="260" style="width:100%;height:260px;' +
         'border-radius:9px;border:1px solid #1e3a52;display:block"></canvas>';
    h += '<p style="margin-top:8px;font-size:11.5px;color:#7a96b0">' +
      (an.sigma != null
        ? t('rumore stimato (scarto assoluto mediano)',
            'estimated noise (median absolute deviation)') + ': <b>' +
          an.sigma.toExponential(2) + '</b> · ' + t('picchi oltre 3σ', 'peaks above 3σ')
        : (an.rumoreMisurabile === false
          ? t('la traccia è <b>liscia</b>: lo scarto assoluto mediano dei residui è esattamente ' +
              'zero, quindi il rumore non è misurabile e un rapporto segnale-rumore non esiste. ' +
              'Succede su una curva calcolata o digitalizzata da una figura pulita. I picchi qui ' +
              'sono quelli che si alzano di almeno un millesimo dell’escursione',
              'the trace is <b>smooth</b>: the median absolute deviation of the residuals is ' +
              'exactly zero, so the noise is not measurable and a signal-to-noise ratio does not ' +
              'exist. This happens on a computed curve or one digitised from a clean figure. The ' +
              'peaks here are those rising by at least a thousandth of the span') +
            ' · ' + t('picchi', 'peaks')
          : t('lista di picchi: il rumore non è stimabile da poche righe, e i picchi sono le ' +
              'righe stesse sopra l’1% del massimo',
              'peak list: noise cannot be estimated from a few lines, and the peaks are the ' +
              'lines themselves above 1% of the maximum') + ' · ' + t('picchi', 'peaks'))) +
      ': <b>' + an.picchi.length + '</b></p></div>';

    if (!an.picchi.length) {
      h += '<div class="bsiSP-avv">' +
        t('Nessun picco supera tre volte il rumore. O lo spettro è piatto, o il rumore è ' +
          'troppo alto perché si possa dire qualcosa.',
          'No peak exceeds three times the noise. Either the spectrum is flat, or the noise ' +
          'is too high for anything to be said.') + '</div>';
    } else if (an.tipo === 'ir') {
      h += '<div class="bsiSP-card"><h4>' + t('Le bande', 'The bands') + '</h4>' +
           '<table class="bsiSP-tbl"><tr><th>cm⁻¹</th><th>SNR</th><th>' +
           t('compatibile con', 'compatible with') + '</th></tr>';
      an.bande.slice(0, 14).forEach(function (b) {
        h += '<tr><td><b>' + b.x.toFixed(0) + '</b></td><td>' + (b.snr != null ? b.snr.toFixed(0) : '—') + '</td><td>' +
          (b.assegnazioni.length
            ? b.assegnazioni.map(function (a) {
                return '<b>' + esc(a.legame) + '</b> ' + esc(a.nota) +
                       ' <span style="color:#6a8aa4">(' + a.da + '–' + a.a + ')</span>'; }).join('<br>')
            : '<span style="color:#8aa2b8">' + t('nessuna banda tabulata qui',
                                                 'no band tabulated here') + '</span>') +
          '</td></tr>';
      });
      h += '</table>';
      if (an.nonAssegnate) {
        h += '<p style="font-size:11.5px;color:#7a96b0;margin-top:8px">' +
          an.nonAssegnate + ' ' + t('bande non ricadono in nessun intervallo tabulato: la ' +
            'zona sotto i 1500 cm⁻¹ è l’impronta digitale, e non si assegna banda per banda.',
            'bands fall in no tabulated range: below 1500 cm⁻¹ is the fingerprint region, ' +
            'and it is not assigned band by band.') + '</p>';
      }
      h += '</div>';
    } else if (an.tipo === 'ms') {
      h += '<div class="bsiSP-card"><h4>' + t('Lo spettro di massa', 'The mass spectrum') +
           '</h4><p>' +
        (an.piccoBase ? t('picco base', 'base peak') + ' <b>m/z ' +
           an.piccoBase.x.toFixed(0) + '</b> · ' : '') +
        (an.ionePiuPesante ? t('ione più pesante osservato', 'heaviest ion observed') +
           ' <b>m/z ' + an.ionePiuPesante.x.toFixed(0) + '</b>' : '') +
        '</p><p style="font-size:11.5px;color:#7a96b0">' +
        t('Lo ione più pesante <b>non è per forza</b> lo ione molecolare: se M⁺ si frammenta ' +
          'del tutto, non lo si vede affatto.',
          'The heaviest ion is <b>not necessarily</b> the molecular ion: if M⁺ fragments ' +
          'completely, it is not seen at all.') + '</p>';
      if (an.perdite.length) {
        h += '<table class="bsiSP-tbl"><tr><th>' + t('da','from') + '</th><th>' +
             t('a','to') + '</th><th>Δ</th><th>' + t('perdita compatibile','compatible loss') +
             '</th></tr>';
        an.perdite.slice(0, 14).forEach(function (p) {
          h += '<tr><td>' + p.da.toFixed(0) + '</td><td>' + p.a.toFixed(0) + '</td><td><b>' +
               p.delta.toFixed(0) + '</b></td><td><b>' + esc(p.frammento) + '</b> ' +
               esc(p.nota) + '</td></tr>';
        });
        h += '</table>';
      } else {
        h += '<p>' + t('Nessuna differenza fra i picchi corrisponde a una perdita tabulata.',
                       'No difference between peaks matches a tabulated loss.') + '</p>';
      }
      h += '</div>';
    } else if (an.tipo === 'nmr') {
      h += '<div class="bsiSP-card"><h4>' + t('Integrazioni', 'Integrations') + '</h4>' +
           '<p style="font-size:11.8px">' +
        t('L’area sotto ogni segnale, normalizzata al più piccolo: è il rapporto che in ' +
          'un protone si legge davvero, e va arrotondato a numeri interi di idrogeni.',
          'The area under each signal, normalised to the smallest: it is the ratio you ' +
          'actually read in a proton spectrum, to be rounded to whole numbers of hydrogens.') +
        '</p><table class="bsiSP-tbl"><tr><th>δ (ppm)</th><th>' + t('area','area') +
        '</th><th>' + t('relativa','relative') + '</th></tr>';
      an.integrazioni.slice(0, 14).forEach(function (g2) {
        h += '<tr><td><b>' + g2.x.toFixed(2) + '</b></td><td>' + g2.area.toExponential(2) +
             '</td><td><b>' + (g2.relativa != null ? g2.relativa : '—') + '</b></td></tr>';
      });
      h += '</table></div>';
    } else {
      h += '<div class="bsiSP-card"><h4>' + t('I picchi', 'The peaks') + '</h4>' +
           '<table class="bsiSP-tbl"><tr><th>x</th><th>y</th><th>SNR</th></tr>';
      an.picchi.slice(0, 14).forEach(function (p) {
        h += '<tr><td><b>' + p.x.toFixed(3) + '</b></td><td>' + p.y.toPrecision(4) +
             '</td><td>' + (p.snr != null ? p.snr.toFixed(0) : '—') + '</td></tr>';
      });
      h += '</table></div>';
    }
    out.innerHTML = h;
    var tela = document.getElementById('bsiSP-tela');
    if (tela) disegna(tela, sp, an);
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §7 · Il documento: aprirlo, mostrarlo tutto, svolgerlo

     Tre pezzi distinti, e restano distinti sullo schermo:

       1. CHE COSA C'E' NEL FILE — ogni pagina disegnata, tutto il testo, e
          l'elenco di ciò che NON si è potuto leggere;
       2. CHE COSA HO LETTO — i dati riconosciuti, uno per uno, con scritto
          accanto DA DOVE vengono;
       3. LO SVOLGIMENTO — i passaggi, con la prova e il grado di certezza.

     L'ordine conta. Se il riconoscimento legge «1715» come banda IR quando
     era una massa, lo svolgimento che segue è impeccabile e la conclusione è
     sbagliata: mettendo la tabella dei dati PRIMA, quell'errore si vede
     prima di leggere la risposta. Metterla dopo la nasconderebbe.
     ═════════════════════════════════════════════════════════════════════════ */
  var documentoCorrente = null;

  function esc(x) {
    return String(x === undefined || x === null ? '' : x)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function cartaAvvisi(lista, titolo) {
    if (!lista || !lista.length) return '';
    return '<div class="bsiSP-avv"><b>' + esc(titolo) + '</b><ul style="margin:6px 0 0 18px;' +
      'padding:0">' + lista.map(function (a) {
        return '<li style="margin-bottom:4px">' + esc(a) + '</li>';
      }).join('') + '</ul></div>';
  }

  /* ── 1 · che cosa c'è nel file ─────────────────────────────────────────── */
  function rendiDocumento(d) {
    var h = '<div class="bsiSP-card"><h4>' +
      t('Che cosa c’è nel file', 'What is in the file') + '</h4>';
    h += '<table class="bsiSP-tbl"><tr><th>' + t('nome', 'name') + '</th><td>' +
      esc(d.nome) + '</td></tr><tr><th>' + t('formato', 'format') + '</th><td>' +
      esc(d.formato || d.tipo || '?') + '</td></tr><tr><th>' +
      t('dimensione', 'size') + '</th><td>' +
      (d.byte > 1048576 ? (d.byte / 1048576).toFixed(1) + ' MB'
                        : Math.round(d.byte / 1024) + ' kB') + '</td></tr>';
    if (d.pagine.length) {
      h += '<tr><th>' + t('pagine', 'pages') + '</th><td>' + d.pagine.length + '</td></tr>';
    }
    h += '<tr><th>' + t('testo letto', 'text read') + '</th><td>' + d.nParole + ' ' +
      t('parole in ', 'words in ') + d.nRighe + t(' righe', ' lines') + '</td></tr></table>';
    if (d.errore) {
      h += '<div class="bsiSP-avv" style="margin-top:10px"><b>' +
        esc(d.errore) + '</b></div>';
    }
    h += '</div>';
    h += cartaAvvisi(d.avvisi, t('Quello che NON ho potuto leggere',
                                 'What I could NOT read'));

    if (d.pagine.length) {
      h += '<div class="bsiSP-card"><h4>' + t('Le pagine, tutte',
        'The pages, all of them') + '</h4><div id="bsiSP-pagine" style="display:flex;' +
        'gap:12px;flex-wrap:wrap"></div></div>';
    }
    if (d.testo) {
      h += '<div class="bsiSP-card"><h4>' + t('Il testo, per intero',
        'The text, in full') + '</h4><pre style="white-space:pre-wrap;word-break:break-word;' +
        'max-height:340px;overflow:auto;background:#081321;border:1px solid #1e3a52;' +
        'border-radius:9px;padding:11px;font:11.5px/1.6 ui-monospace,monospace;' +
        'color:#cfe2f5;margin:0">' + esc(d.testo) + '</pre></div>';
    }
    return h;
  }

  /* le tele delle pagine si attaccano DOPO, perché sono oggetti e non HTML:
     passarle per innerHTML le perderebbe */
  function attaccaPagine(d) {
    var box = document.getElementById('bsiSP-pagine');
    if (!box) return;
    box.innerHTML = '';
    d.pagine.forEach(function (p) {
      var cella = document.createElement('div');
      cella.style.cssText = 'flex:0 0 auto;max-width:100%';
      var et = document.createElement('div');
      et.style.cssText = 'font-size:11px;color:#8aadcc;margin-bottom:4px';
      et.textContent = t('pagina ', 'page ') + p.n + ' · ' + p.larghezza + '×' +
        p.altezza + (p.testo ? '' : t('  · nessun testo', '  · no text'));
      cella.appendChild(et);
      p.tela.style.cssText = 'max-width:100%;width:270px;height:auto;border-radius:8px;' +
        'background:#fff;border:1px solid #1e3a52;cursor:zoom-in';
      p.tela.title = t('clicca per ingrandire', 'click to enlarge');
      p.tela.onclick = function () {
        p.tela.style.width = (p.tela.style.width === '270px') ? '100%' : '270px';
      };
      cella.appendChild(p.tela);
      box.appendChild(cella);
    });
  }

  /* ── 2 e 3 · i dati letti, e lo svolgimento ────────────────────────────── */
  function rendiSvolgimento(testo) {
    if (!globale.BSIQuesito) {
      return '<div class="bsiSP-avv">' + t('Il modulo dei quesiti non è caricato.',
                                           'The problem module is not loaded.') + '</div>';
    }
    var r = globale.BSIQuesito.svolgi(testo);
    var d = r.dati;
    var h = '<div class="bsiSP-card"><h4>' +
      t('Che cosa ho letto — controllalo prima di guardare la risposta',
        'What I read — check it before looking at the answer') + '</h4>';
    if (!d.provenienza.length) {
      h += '<p>' + t('Niente di riconoscibile.', 'Nothing recognisable.') + '</p>';
    } else {
      h += '<table class="bsiSP-tbl"><tr><th>' + t('dato', 'datum') + '</th><th>' +
        t('valore', 'value') + '</th><th>' + t('da dove viene', 'where it comes from') +
        '</th></tr>' + d.provenienza.map(function (p) {
          return '<tr><td><b>' + esc(p.dato) + '</b></td><td>' + esc(p.valore) +
            '</td><td>' + esc(p.perche) + '</td></tr>';
        }).join('') + '</table>';
    }
    if (d.h1 && d.h1.length) {
      h += '<table class="bsiSP-tbl" style="margin-top:10px"><tr><th>δ ¹H</th><th>' +
        t('integr.', 'integ.') + '</th><th>' + t('molt.', 'mult.') + '</th><th>J (Hz)</th></tr>' +
        d.h1.map(function (x) {
          return '<tr><td>' + x.ppm + '</td><td>' + (x.nH === null ? '—' : x.nH + 'H') +
            '</td><td>' + esc(x.molteplicita || '—') + '</td><td>' +
            (x.J && x.J.length ? x.J.join(', ') : '—') + '</td></tr>';
        }).join('') + '</table>';
    }
    if (d.c13 && d.c13.length) {
      h += '<p style="margin-top:9px"><b>δ ¹³C:</b> ' + esc(d.c13.join('; ')) + '</p>';
    }
    h += '</div>';

    if (d.mancanti.length) {
      h += cartaAvvisi(d.mancanti.map(function (m) {
        return t('non riconosciuto: ', 'not recognised: ') + m;
      }), t('Quello che manca allo svolgimento', 'What the work is missing'));
    }
    h += cartaAvvisi(r.avvisi, t('Avvertenze', 'Warnings'));

    if (!r.dossier) return h;
    var D = r.dossier;
    h += '<div class="bsiSP-card"><h4>' + t('Lo svolgimento, passo per passo',
      'The work, step by step') + '</h4>';
    if (D.deduzioni && D.deduzioni.length) {
      h += '<table class="bsiSP-tbl"><tr><th style="width:26%">' +
        t('passo', 'step') + '</th><th>' + t('valore', 'value') + '</th><th>' +
        t('come ci si arriva', 'how it is reached') + '</th><th>' +
        t('quanto è certo', 'how certain') + '</th></tr>' +
        D.deduzioni.map(function (x, i) {
          return '<tr><td><b>' + (i + 1) + '. ' + esc(x.che) + '</b></td><td><b>' +
            esc(x.valore) + '</b></td><td>' + esc(x.prova) +
            (x.nota ? '<br><span style="color:#8aadcc">' + esc(x.nota) + '</span>' : '') +
            '</td><td>' + esc(x.certezza || '') + '</td></tr>';
        }).join('') + '</table>';
    }
    if (D.supposizioni && D.supposizioni.length) {
      h += '<h4 style="margin-top:12px">' + t('Le supposizioni — non sono conclusioni',
        'The conjectures — they are not conclusions') + '</h4><ul style="margin:0 0 0 18px;' +
        'color:#cfe2f5;font-size:12.5px;line-height:1.6">' +
        D.supposizioni.map(function (x) {
          if (typeof x === 'string') return '<li>' + esc(x) + '</li>';
          /* Il campo si chiama `perche`, non `prova`: scritto sbagliato,
             ogni supposizione usciva come «Perdita di H —» con il motivo
             vuoto, cioè proprio la metà che la rende una supposizione
             leggibile invece di un'affermazione nuda. */
          return '<li><b>' + esc(x.che) + '</b>' +
            (x.valore !== undefined && x.valore !== '' ? ': ' + esc(x.valore) : '') +
            (x.perche ? '<br><span style="color:#8aadcc">' + esc(x.perche) + '</span>' : '') +
            '</li>';
        }).join('') + '</ul>';
    }
    h += cartaAvvisi(D.avvisi, t('Quello che i dati non reggono',
                                 'What the data do not support'));
    h += '</div>';

    /* la cosa onesta che si può fare al posto di indovinare */
    h += '<div class="bsiSP-card"><h4>' + t('Proponi una struttura e confrontala',
      'Propose a structure and compare it') + '</h4><p>' + t(
      'La struttura finale <b>non viene proposta</b>: proporla vorrebbe dire ' +
      'indovinare, e un insieme di dati spettroscopici è compatibile con più di ' +
      'una molecola. Quello che si può fare onestamente è il contrario — scrivi ' +
      'tu una struttura e il programma dice <b>quali segnali tornano e quali no</b>.',
      'The final structure is <b>not proposed</b>: proposing it would mean ' +
      'guessing, and a set of spectroscopic data is compatible with more than one ' +
      'molecule. What can honestly be done is the opposite — you write a ' +
      'structure and the program says <b>which signals fit and which do not</b>.') +
      '</p><div style="display:flex;gap:7px;flex-wrap:wrap">' +
      '<input class="bsiSP-in" id="bsiSP-prop" style="flex:1 1 220px" ' +
      'placeholder="SMILES — es. CC(=O)OCc1ccccc1" spellcheck="false">' +
      '<button class="bsiSP-btn" id="bsiSP-confronta">' +
      t('confronta con i dati', 'compare with the data') + '</button></div>' +
      '<div id="bsiSP-propOut" style="margin-top:10px"></div></div>';
    return h;
  }

  function rendiConfronto(c) {
    if (!c) return '';
    if (c.errore) return '<div class="bsiSP-avv">' + esc(c.errore) + '</div>';
    var col = (c.fiducia === 'bassa') ? '#2a1f0c' : '#0c3024';
    var h = '<div style="background:' + col + ';border-radius:9px;padding:10px 13px;' +
      'font-size:12.5px;color:#cfe2f5"><b>' + t('Punteggio: ', 'Score: ') +
      esc(c.punteggio) + ' / 100</b> · ' + t('fiducia: ', 'confidence: ') +
      esc(c.fiducia) + '</div>';
    if (c.perche && c.perche.length) {
      h += '<ul style="margin:8px 0 0 18px;font-size:12px;color:#8aadcc">' +
        c.perche.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
    }
    if (c.parti && c.parti.length) {
      h += '<table class="bsiSP-tbl" style="margin-top:9px"><tr><th>' +
        t('controllo', 'check') + '</th><th>' + t('esito', 'outcome') + '</th><th>' +
        t('perché', 'why') + '</th></tr>' + c.parti.map(function (p) {
          return '<tr><td>' + esc(p.che || p.nome || '') + '</td><td>' +
            (p.esito ? '✓' : '✗') + '</td><td>' + esc(p.dettaglio || p.prova || '') +
            '</td></tr>';
        }).join('') + '</table>';
    }
    if (c.avvertenza) {
      h += '<p style="font-size:11.5px;color:#8aadcc;margin-top:8px">' +
        esc(c.avvertenza) + '</p>';
    }
    return h;
  }

  var ESEMPIO_QUESITO =
    'Quesito. Un composto di formula molecolare C9H10O2 dà i seguenti dati.\n\n' +
    'IR (cm-1): 3035, 2955, 1738, 1600, 1498, 1230, 1025, 750, 697.\n\n' +
    'MS m/z (intensita relativa): 150 (22), 108 (100), 107 (28), 91 (45), 65 (12), 43 (60).\n\n' +
    '1H NMR (CDCl3): d 7,35 (5H, m), 5,10 (2H, s), 2,05 (3H, s).\n\n' +
    '13C NMR (CDCl3): d 170,9; 136,0; 128,6; 128,2; 66,3; 21,0.\n\n' +
    'Proponi una struttura compatibile e giustificala con i dati.';

  function svolgiTestoE(testo, nota) {
    var out = document.getElementById('bsiSP-docOut');
    if (!out) return;
    out.innerHTML = (nota || '') + rendiSvolgimento(testo);
    agganciaConfronto(testo);
  }

  function agganciaConfronto(testo) {
    var b = document.getElementById('bsiSP-confronta');
    if (!b) return;
    b.onclick = function () {
      var inp = document.getElementById('bsiSP-prop');
      var box = document.getElementById('bsiSP-propOut');
      if (!inp || !box) return;
      var smi = inp.value.trim();
      if (!smi) { box.innerHTML = ''; return; }
      if (!globale.BSIQuesito || !globale.BSIQuesito.verifica) return;
      var fai = function () {
        box.innerHTML = rendiConfronto(globale.BSIQuesito.verifica(smi, testo));
      };
      if (!globale.__rdkit && globale.bsiLoadRDKit) {
        box.innerHTML = '<span style="color:#8aadcc">' +
          t('carico il motore chimico…', 'loading the chemistry engine…') + '</span>';
        globale.bsiLoadRDKit(fai);
      } else fai();
    };
  }

  function aggancia() {
    var src = document.getElementById('bsiSP-src');
    if (!src) return;
    function leggiOra() {
      spettroCorrente = S.leggi(src.value);
      analisiCorrente = spettroCorrente ? S.analizza(spettroCorrente) : null;
      rendi(spettroCorrente, analisiCorrente);
      return spettroCorrente;
    }
    function dillo(testo) {
      var d = document.getElementById('bsiSP-deciso');
      if (d) d.innerHTML = testo;
    }
    function pulisciUscite() {
      ['bsiSP-out', 'bsiSP-docOut', 'bsiSP-docStato'].forEach(function (id) {
        var e = document.getElementById(id);
        if (e) e.innerHTML = '';
      });
      var sc = document.getElementById('bsiSP-scala');
      if (sc) sc.style.display = 'none';
    }

    /* ── «Leggi e svolgi»: decide da solo che cosa ha davanti ────────────
       Nella casella può esserci uno spettro (numeri in due colonne, un
       JCAMP) oppure il testo di un quesito. Chiedere all'utente di
       dichiararlo con due bottoni diversi era una domanda che il programma
       può farsi da sé: prova a leggerlo come spettro e, se non ne esce
       niente di sensato, lo tratta come testo. */
    function leggiOSvolgi() {
      var testo = src.value.trim();
      if (!testo) {
        dillo('<span style="color:#ffb86b">' +
              t('La casella è vuota: apri un file o incolla qualcosa.',
                'The box is empty: open a file or paste something.') + '</span>');
        return;
      }
      pulisciUscite();
      var sp = S.leggi(testo);
      if (sp && sp.x && sp.x.length >= 5) {
        dillo(t('Letto come <b>spettro</b>: ', 'Read as a <b>spectrum</b>: ') +
              sp.x.length + t(' punti.', ' points.'));
        spettroCorrente = sp;
        analisiCorrente = S.analizza(sp);
        rendi(spettroCorrente, analisiCorrente);
        return;
      }
      dillo(t('Non sono numeri di uno spettro: lo tratto come il ' +
              '<b>testo di un quesito</b>.',
              'These are not spectrum numbers: treating it as <b>problem text</b>.'));
      svolgiTestoE(testo, '');
    }

    document.getElementById('bsiSP-go').onclick = leggiOSvolgi;
    document.getElementById('bsiSP-pulisci').onclick = function () {
      src.value = ''; pulisciUscite(); dillo('');
    };

    /* ── UNA porta sola: si apre il file e si capisce che cos'è ──────────
       Il selettore non ha nessun filtro. Un `accept` che elenca «.jdx,.dx,
       .txt,.csv» su un telefono non restringe la scelta: NASCONDE tutto il
       resto, e chi arriva con il PDF di un compito vede una cartella vuota
       e conclude che l'applicazione è rotta. Lo era, di fatto.

       La decisione si prende dal contenuto quando si può, dal nome quando
       non si può — e si DICE, perché un programma che sceglie in silenzio
       per conto tuo è peggio di uno che ti fa scegliere. */
    var file = document.getElementById('bsiSP-file');
    document.getElementById('bsiSP-apri').onclick = function () { file.click(); };
    file.onchange = function () {
      var f = file.files && file.files[0];
      if (f) apriQualunque(f);
      file.value = '';          /* così riaprire lo stesso file rifà il giro */
    };

    /* «Binario» non è un'opinione: un testo vero non contiene byte nulli, e
       la decodifica UTF-8 di byte non testuali produce U+FFFD. Qualche
       carattere sporco può capitare in un file legittimo (un accento salvato
       in un'altra codifica), quindi la soglia è una frazione, non uno. */
    function binario(testo) {
      if (!testo) return false;
      var campione = testo.slice(0, 4000);
      if (campione.indexOf('\u0000') >= 0) return true;
      var sporchi = (campione.match(/[�]/g) || []).length;
      return campione.length > 0 && sporchi / campione.length > 0.05;
    }

    function apriQualunque(f) {
      var nome = (f.name || '').toLowerCase();
      var tipo = f.type || '';
      pulisciUscite();

      /* 1 · un'immagine può essere tutt'e due le cose: la fotografia di uno
             spettro o la pagina di un compito. Si fanno entrambe. */
      if (/^image\//.test(tipo) || /\.(png|jpe?g|gif|webp|bmp|avif|heic)$/.test(nome)) {
        dillo(t('È un’<b>immagine</b>: ne estraggo la traccia qui sotto, e la ' +
                'mostro anche come pagina. Se è la foto di un foglio scritto, il ' +
                'testo non si legge — non c’è riconoscimento ottico dei caratteri.',
                'It is an <b>image</b>: I extract the trace below, and also show it ' +
                'as a page. If it is a photo of a written sheet, the text cannot be ' +
                'read — there is no optical character recognition.'));
        var u = URL.createObjectURL(f);
        var im = new Image();
        im.onload = function () {
          ultimaImmagine = im;
          leggiImmagine();
          setTimeout(function () { try { URL.revokeObjectURL(u); } catch (e) {} }, 2000);
        };
        im.onerror = function () {
          dillo('<span style="color:#ff8fa3">' +
                t('Questa immagine non si è aperta.', 'This image did not open.') +
                '</span>');
        };
        im.src = u;
        apriComeDocumento(f, true);
        return;
      }

      /* 2 · JCAMP-DX: lo dichiara il formato stesso, non serve indovinare */
      if (/\.(jdx|dx|jcamp)$/.test(nome)) {
        f.text().then(function (testo) {
          src.value = testo;
          var sp = leggiOra();
          dillo(sp
            ? t('Letto come <b>spettro JCAMP-DX</b>: ', 'Read as a <b>JCAMP-DX spectrum</b>: ') +
              sp.x.length + t(' punti.', ' points.')
            : '<span style="color:#ff8fa3">' +
              t('Il file dice di essere JCAMP-DX ma non si è letto.',
                'The file claims to be JCAMP-DX but did not parse.') + '</span>');
        });
        return;
      }

      /* 3 · testo e tabelle: si GUARDA che cosa c'è dentro.
             Un `.csv` può essere due colonne di uno spettro o la tabella di
             un quesito: il nome non lo dice, il contenuto sì. */
      if (/^text\//.test(tipo) || /\.(txt|csv|tsv|dat|asc|md|json|xml)$/.test(nome) ||
          (!tipo && !/\.(pdf|docx|odt|pptx|xlsx|ods|odp)$/.test(nome))) {
        f.text().then(function (testo) {
          /* Un file senza estensione, o un `.txt` che in realtà è un binario,
             qui arriverebbe comunque. Scaricare byte illeggibili nella
             casella di testo non aiuta nessuno: se il contenuto è binario lo
             passo al lettore di documenti, che sa dirlo invece di mostrarlo. */
          if (binario(testo)) { apriComeDocumento(f, false); return; }
          src.value = testo;
          var sp = S.leggi(testo);
          if (sp && sp.x && sp.x.length >= 5) {
            spettroCorrente = sp;
            analisiCorrente = S.analizza(sp);
            rendi(spettroCorrente, analisiCorrente);
            dillo(t('Letto come <b>spettro</b>: ', 'Read as a <b>spectrum</b>: ') +
                  sp.x.length + t(' punti.', ' points.'));
          } else {
            dillo(t('Non ci sono numeri di uno spettro: lo tratto come il ' +
                    '<b>testo di un quesito</b>.',
                    'No spectrum numbers in it: treating it as <b>problem text</b>.'));
            svolgiTestoE(testo, '');
          }
        }).catch(function () {
          apriComeDocumento(f, false);
        });
        return;
      }

      /* 4 · tutto il resto: PDF, Word, OpenDocument, fogli di calcolo */
      dillo(t('È un <b>documento</b>: lo apro, te lo mostro tutto e svolgo ' +
              'quello che contiene.',
              'It is a <b>document</b>: I open it, show you all of it and work ' +
              'through what it contains.'));
      apriComeDocumento(f, false);
    }

    /* L'ingresso dedicato resta, nascosto, per chi vuole FORZARE la lettura
       come documento: i banchi, e il codice che apre un documento da
       un'altra parte dell'applicazione. Non passa da `apriQualunque` —
       altrimenti un `.txt` finirebbe di nuovo nell'instradamento automatico
       e verrebbe trattato come il testo di un quesito, che è un'altra cosa.
       Si chiama «doc»: deve aprire un documento. */
    var docInput = document.getElementById('bsiSP-doc');
    if (docInput) docInput.onchange = function () {
      var f = docInput.files && docInput.files[0];
      if (f) { pulisciUscite(); apriComeDocumento(f, false); }
    };
    /* ── l'immagine ────────────────────────────────────────────────────── */
    var imgFile = document.getElementById('bsiSP-img');
    var ultimaImmagine = null;
    function val(id, pred) {
      var e = document.getElementById(id);
      if (!e) return undefined;
      var v = parseFloat(e.value);
      return isFinite(v) ? v : undefined;
    }
    function acceso(id) {
      var e = document.getElementById(id);
      return !!(e && e.checked);
    }
    function leggiImmagine() {
      if (!ultimaImmagine) return;
      var scala = document.getElementById('bsiSP-scala');
      if (scala) scala.style.display = '';
      var x0 = val('bsiSP-x0'); if (x0 === undefined) x0 = 0;
      var x1 = val('bsiSP-x1'); if (x1 === undefined) x1 = 1;
      var yu = (document.getElementById('bsiSP-yu') || {}).value || '';
      var xu = ((document.getElementById('bsiSP-xu') || {}).value || '').trim();
      var corn = (document.getElementById('bsiSP-corn') || {}).value || 'auto';
      var sp = S.daImmagine(ultimaImmagine, {
        xDa: x0, xA: x1,
        yDa: val('bsiSP-y0'), yA: val('bsiSP-y1'),
        unitaX: xu || ((x0 > x1) ? 'cm-1' : ''),
        yUnita: yu,
        logX: acceso('bsiSP-logx'), logY: acceso('bsiSP-logy'),
        adAssorbanza: acceso('bsiSP-adA'),
        cornice: corn,
        titolo: ultimaImmagine.alt || ''
      });
      var nota = document.getElementById('bsiSP-imgNota');
      if (!sp || sp.errore) {
        if (nota) nota.innerHTML = '<span style="color:#ff6b6b">' +
          ((sp && sp.errore) || t('immagine non leggibile', 'image not readable')) + '</span>';
        spettroCorrente = null;
        return;
      }
      /* LA DIAGNOSI SERVE A CAPIRE PERCHE' IL RISULTATO E' QUELLO.
         Un numero senza il suo come non si può contestare: se la cornice non
         è stata trovata, o se duecento colonne sono state troncate perché la
         griglia si era fusa con la traccia, chi guarda deve poterlo leggere
         qui invece di indovinarlo dal grafico. */
      if (nota) {
        var d = [];
        d.push('<b>' + sp.colonne + '</b> ' + t('colonne', 'columns') +
               ' · ' + t('con traccia', 'with a trace') + ' ' + sp.colonneConTraccia);
        d.push(sp.cornice && sp.cornice.trovata
          ? t('cornice: ', 'frame: ') + sp.cornice.lati.join(', ') +
            ' (' + sp.cornice.x0 + ',' + sp.cornice.y0 + ')–(' +
            sp.cornice.x1 + ',' + sp.cornice.y1 + ')'
          : '<span style="color:#ffb86b">' +
            t('nessuna cornice trovata', 'no frame found') + '</span>');
        d.push(t('sfondo ', 'background ') + sp.sfondo + ' · ' +
               t('soglia ', 'threshold ') + sp.soglia + ' · ' +
               t('tratti per colonna ', 'runs per column ') + sp.trattiPerColonna);
        if (sp.righeMoltoCoperte) {
          d.push(t('righe molto coperte (griglia orizzontale o linea di base): ',
                   'heavily covered rows (horizontal grid or baseline): ') + sp.righeMoltoCoperte);
        }
        if (sp.colonneTroncate) {
          d.push(t('colonne in cui un tratto troppo alto è stato ristretto per continuità: ',
                   'columns where an over-tall run was narrowed by continuity: ') +
                 sp.colonneTroncate);
        }
        nota.innerHTML = d.join(' · ') +
          (sp.note && sp.note.length
            ? '<br><span style="color:#ffb86b">' + sp.note.join('<br>') + '</span>' : '') +
          '<br>' + sp.avviso;
      }
      spettroCorrente = sp;
      analisiCorrente = S.analizza(sp);
      rendi(sp, analisiCorrente);
    }

    /* ── LE USCITE ─────────────────────────────────────────────────────────
       Chi digitalizza uno spettro lo fa per farci qualcosa. Se i numeri
       restano dentro l'applicazione il lavoro è a metà. */
    function scarica(nome, testo, tipo) {
      var b = new Blob([testo], { type: tipo || 'text/plain;charset=utf-8' });
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u; a.download = nome;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { try { URL.revokeObjectURL(u); } catch (e) {} }, 1500);
    }
    function baseNome() {
      var n = (spettroCorrente && spettroCorrente.titolo) || 'spettro';
      return String(n).replace(/[^\w.-]+/g, '_').slice(0, 48) || 'spettro';
    }
    var bCsv = document.getElementById('bsiSP-csv');
    if (bCsv) bCsv.onclick = function () {
      if (!spettroCorrente || !globale.BSIDigitalizza) return;
      scarica(baseNome() + '.csv', globale.BSIDigitalizza.csv(spettroCorrente),
              'text/csv;charset=utf-8');
    };
    var bJdx = document.getElementById('bsiSP-jdx');
    if (bJdx) bJdx.onclick = function () {
      if (!spettroCorrente || !globale.BSIDigitalizza) return;
      scarica(baseNome() + '.jdx', globale.BSIDigitalizza.jcamp(spettroCorrente),
              'chemical/x-jcamp-dx');
    };
    if (imgFile) {
      imgFile.onchange = function () {
        var f = imgFile.files && imgFile.files[0];
        if (!f) return;
        var u = URL.createObjectURL(f);
        var im = new Image();
        im.onload = function () {
          ultimaImmagine = im;
          leggiImmagine();
          setTimeout(function () { try { URL.revokeObjectURL(u); } catch (e) {} }, 1000);
        };
        im.onerror = function () {
          var nota = document.getElementById('bsiSP-imgNota');
          if (nota) nota.textContent = t('non sono riuscito ad aprire l\u2019immagine',
                                         'could not open the image');
        };
        im.src = u;
      };
      var ril = document.getElementById('bsiSP-rileggiImg');
      if (ril) ril.onclick = leggiImmagine;
      /* il bottone visibile che apre la GALLERIA (e offre la fotocamera):
         è un selettore diverso da quello senza filtro, non un doppione */
      var apriImg = document.getElementById('bsiSP-apriImg');
      if (apriImg) apriImg.onclick = function () { imgFile.click(); };
      /* Cambiare la taratura e dover premere «rileggi» è un passaggio in più
         che non serve a niente: la lettura costa pochi millisecondi. Si
         rilegge da sé, e il grafico segue. */
      ['bsiSP-x0', 'bsiSP-x1', 'bsiSP-xu', 'bsiSP-y0', 'bsiSP-y1'].forEach(function (id) {
        var e = document.getElementById(id);
        if (e) e.oninput = function () { if (ultimaImmagine) leggiImmagine(); };
      });
      ['bsiSP-yu', 'bsiSP-corn', 'bsiSP-logx', 'bsiSP-logy', 'bsiSP-adA'].forEach(function (id) {
        var e = document.getElementById(id);
        if (e) e.onchange = function () { if (ultimaImmagine) leggiImmagine(); };
      });
    }

    /* ── Aprire un documento: una funzione, chiamata dal router ─────────
       Prima era il corpo di un `onchange` legato a un bottone che non
       esiste più. Ora è una funzione con un nome, e la chiama chi decide
       che cosa fare del file. */
    function apriComeDocumento(f, silenzioso) {
      var stato = document.getElementById('bsiSP-docStato');
      if (!globale.BSIDocumento) {
        if (stato) stato.innerHTML = '<span style="color:#ff8fa3">' +
          t('il modulo dei documenti non è caricato',
            'the document module is not loaded') + '</span>';
        return;
      }
      if (stato && !silenzioso) {
        stato.textContent = t('apro «', 'opening “') + f.name + t('»…', '”…') +
          (/pdf$/i.test(f.name) ? t('  (un PDF richiede qualche secondo la prima volta)',
                                    '  (a PDF takes a few seconds the first time)') : '');
      }
      globale.BSIDocumento.leggi(f).then(function (d) {
        documentoCorrente = d;
        if (stato) {
          /* Con un guasto lo stato diceva «aperto: … 0 parole»: la parola
             «aperto» accanto a un conteggio a zero fa credere che il file
             fosse vuoto, mentre non si era aperto affatto. */
          if (d.errore) {
            stato.innerHTML = '<span style="color:#ff8fa3">⚠ ' + esc(d.errore) + '</span>';
          } else {
            stato.textContent = t('aperto: ', 'opened: ') + d.nome + ' · ' +
              (d.pagine.length ? d.pagine.length + t(' pagine · ', ' pages · ') : '') +
              d.nParole + t(' parole', ' words');
          }
        }
        var out = document.getElementById('bsiSP-docOut');
        if (!out) return;
        out.innerHTML = rendiDocumento(d) +
          (d.testo ? rendiSvolgimento(d.testo) : '');
        attaccaPagine(d);
        if (d.testo) {
          agganciaConfronto(d.testo);
          if (!src.value.trim()) src.value = d.testo;
        }
        /* Una pagina senza testo è un'immagine: la si può comunque misurare
           con l'estrattore di tracce, che è già qui accanto. */
        if (d.pagine.length && !d.testo) {
          var p0 = d.pagine[0];
          var im = new Image();
          im.onload = function () { ultimaImmagine = im; };
          try { im.src = p0.tela.toDataURL('image/png'); } catch (e) {}
        }
      }).catch(function (e) {
        if (stato) {
          stato.innerHTML = '<span style="color:#ff8fa3">⚠ ' +
            esc(t('non sono riuscito ad aprirlo: ', 'I could not open it: ') +
                ((e && e.message) ? e.message : String(e))) + '</span>';
        }
      });
    }
    var esQ = document.getElementById('bsiSP-esQuesito');
    if (esQ) esQ.onclick = function () {
      src.value = ESEMPIO_QUESITO;
      svolgiTestoE(ESEMPIO_QUESITO, '<div class="bsiSP-ok">' +
        t('Un quesito d’esame tipico, scritto come lo trovi sul foglio. ' +
          'Il testo è finito anche nella casella qui sopra: provaci a modificarlo.',
          'A typical exam problem, written as you find it on the sheet. ' +
          'The text also went into the box above: try changing it.') + '</div>');
    };

    [].forEach.call(document.querySelectorAll('[data-es]'), function (b) {
      b.onclick = function () {
        src.value = ESEMPI[b.getAttribute('data-es')]();
        leggiOra();
      };
    });
  }

  globale.initLettoreSpettri = function () {
    var sec = document.getElementById('sspettrolettore');
    if (!sec) return;
    sec.innerHTML = '<div class="section-title">' +
      t('📉 LETTORE DI SPETTRI — il tuo spettro, misurato',
        '📉 SPECTRUM READER — your spectrum, measured') + '</div>' + vista();
    aggancia();
  };

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.nav-btn[data-s]') : null;
    if (b && b.getAttribute('data-s') === 'sspettrolettore')
      setTimeout(globale.initLettoreSpettri, 60);
  }, true);

  document.addEventListener('bsi-lingua', function () {
    var sec = document.getElementById('sspettrolettore');
    if (sec && sec.children.length) globale.initLettoreSpettri();
  });

})(typeof window !== 'undefined' ? window : globalThis);
