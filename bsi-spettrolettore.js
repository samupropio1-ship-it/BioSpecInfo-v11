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
    var sigma = rumore(yy, base) || 1e-12;
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
                    prominenza: prom, snr: altezza / sigma });
    }
    picchi.sort(function (p, q) { return q.prominenza - p.prominenza; });
    return { picchi: picchi, sigma: sigma, base: base };
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

  globale.BSILettoreSpettri = {
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

  function vista() {
    return '' +
'<div class="bsiSP-card"><h4>' + t('Carica uno spettro', 'Load a spectrum') + '</h4><p>' +
t('Incolla un file <b>JCAMP-DX</b> (.jdx, .dx — lo standard IUPAC) oppure due ' +
  'colonne <code>x&nbsp;y</code>, che è il formato in cui esce metà della ' +
  'strumentazione. Il tipo di spettro viene riconosciuto dal file; se non lo ' +
  'dichiara, dall’intervallo dei numeri.',
  'Paste a <b>JCAMP-DX</b> file (.jdx, .dx — the IUPAC standard) or two ' +
  '<code>x&nbsp;y</code> columns, the format half the instruments produce. The ' +
  'kind of spectrum is read from the file; failing that, from the range of the ' +
  'numbers.') + '</p>' +
'<textarea class="bsiSP-in" id="bsiSP-src" rows="6" spellcheck="false" aria-label="' +
t('Dati dello spettro', 'Spectrum data') + '" placeholder="##TITLE=...&#10;1000 0.12&#10;1002 0.15"></textarea>' +
'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px">' +
'<button class="bsiSP-btn" id="bsiSP-go">' + t('Leggi e misura', 'Read and measure') + '</button>' +
'<input type="file" id="bsiSP-file" accept=".jdx,.dx,.txt,.csv,.jcamp" style="display:none">' +
'<button class="bsiSP-btn2" id="bsiSP-apri">' + t('📂 Apri un file', '📂 Open a file') + '</button>' +
'<button class="bsiSP-btn2" data-es="ir">' + t('esempio IR', 'IR example') + '</button>' +
'<button class="bsiSP-btn2" data-es="ms">' + t('esempio MS', 'MS example') + '</button>' +
'<button class="bsiSP-btn2" data-es="nmr">' + t('esempio NMR', 'NMR example') + '</button>' +
'<button class="bsiSP-btn2" id="bsiSP-pulisci">' + t('Pulisci', 'Clear') + '</button>' +
'</div></div>' +
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
        : t('lista di picchi: il rumore non è stimabile da poche righe, e i picchi sono le ' +
            'righe stesse sopra l\u20191% del massimo',
            'peak list: noise cannot be estimated from a few lines, and the peaks are the ' +
            'lines themselves above 1% of the maximum') + ' · ' + t('picchi', 'peaks')) +
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

  function aggancia() {
    var src = document.getElementById('bsiSP-src');
    if (!src) return;
    function leggiOra() {
      spettroCorrente = S.leggi(src.value);
      analisiCorrente = spettroCorrente ? S.analizza(spettroCorrente) : null;
      rendi(spettroCorrente, analisiCorrente);
    }
    document.getElementById('bsiSP-go').onclick = leggiOra;
    document.getElementById('bsiSP-pulisci').onclick = function () {
      src.value = ''; document.getElementById('bsiSP-out').innerHTML = '';
    };
    var file = document.getElementById('bsiSP-file');
    document.getElementById('bsiSP-apri').onclick = function () { file.click(); };
    file.onchange = function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { src.value = r.result; leggiOra(); };
      r.readAsText(f);
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
