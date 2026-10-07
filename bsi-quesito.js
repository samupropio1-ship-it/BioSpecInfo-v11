/* ═══════════════════════════════════════════════════════════════════════════
   BSI QUESITO — dal testo di un esercizio ai dati, e dai dati allo svolgimento

   CHE COSA FA

   Un quesito di determinazione strutturale è scritto in prosa, con dentro i
   numeri: «Composto di formula C₉H₁₀O₂. IR (cm⁻¹): 1715, 1600, 1500. ¹H NMR
   (CDCl₃): δ 7,30 (5H, m), 5,10 (2H, s), 2,05 (3H, s)».

   Questo modulo fa due cose, e sono due cose diverse:

   1. RICONOSCE quei numeri nel testo — la formula, i picchi di massa, le
      bande IR, i segnali ¹H e ¹³C — e dice, uno per uno, DA DOVE li ha
      presi. Quello che non riconosce lo dichiara.

   2. Li passa a `bsi-elucida.js`, che è il motore di svolgimento già
      verificato: gradi di insaturazione, numero di carboni da M+1, alogeni
      da M+2, perdite neutre, bande IR assegnate a tutte le possibilità
      compatibili, intervalli di spostamento. Ogni passo porta con sé la
      PROVA e il grado di certezza.

   PERCHE' IL RICONOSCIMENTO E LO SVOLGIMENTO SONO SEPARATI

   Perché sbagliano in modi diversi, e confonderli nasconde l'errore. Se il
   riconoscimento legge «1715» come banda IR quando era una massa, lo
   svolgimento che segue è impeccabile e la risposta è sbagliata. Tenendoli
   distinti, quello che è stato letto si può CONTROLLARE prima di guardare la
   conclusione — ed è per questo che il pannello mostra la tabella dei dati
   riconosciuti sopra lo svolgimento, non sotto.

   CHE COSA NON FA, E VA DETTO FORTE

   **Non «risolve» il quesito al posto di chi studia.** Non c'è nessun modello
   linguistico qui dentro: ci sono espressioni regolari che riconoscono numeri
   e un motore di regole spettroscopiche. Quindi:

   · se il testo scrive i dati in una forma che non è prevista, i dati non
     vengono letti — e il modulo lo dice invece di svolgere a metà;
   · lo svolgimento arriva fino a dove arrivano le regole: gruppi funzionali
     compatibili, frammenti, conteggi. **La struttura finale non la propone**,
     perché proporla vorrebbe dire indovinare;
   · una struttura la si può proporre e il modulo la CONFRONTA con i dati,
     dicendo quali segnali tornano e quali no. Confrontare è una cosa che si
     può fare onestamente; indovinare no.

   USO   BSIQuesito.estrai(testo)        → { formula, ms, ir, h1, c13, … }
         BSIQuesito.svolgi(testo)        → { dati, dossier, passi, avvisi }

   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Normalizzare il testo

     I quesiti stampati usano i pedici tipografici (C₉H₁₀O₂), la virgola
     decimale (7,30), il meno tipografico nei cm⁻¹ e gli apici unicode. Chi
     scrive l'espressione regolare dopo non deve conoscerli tutti: si
     riportano a una forma sola, una volta, qui.
     ═════════════════════════════════════════════════════════════════════════ */
  var PEDICI = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
  var APICI  = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+' };

  function normalizza(testo) {
    return String(testo || '')
      .replace(/[₀-₉]/g, function (c) { return PEDICI[c] || c; })
      .replace(/[⁰-⁹⁻⁺]/g, function (c) { return APICI[c] || c; })
      .replace(/[‐-―−]/g, '-')        /* trattini e meno tipografici */
      .replace(/[   ]/g, ' ')          /* spazi unificatori */
      .replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'")
      .replace(/δ/g, 'd ')                        /* δ → d, per uniformare */
      .replace(/\r\n?/g, '\n');
  }

  /* la virgola decimale solo DENTRO un numero: «7,30» diventa «7.30», ma
     «1715, 1600» resta una lista di due numeri */
  function puntoDecimale(s) {
    return s.replace(/(\d),(\d{1,3})(?!\d)/g, '$1.$2');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · La formula molecolare
     ═════════════════════════════════════════════════════════════════════════ */
  var ELEMENTI = 'C|H|N|O|S|P|F|Cl|Br|I|Si|B|Se|Na|K|Li|Mg|Ca|Zn|Fe';

  function trovaFormula(testo) {
    /* una formula bruta comincia con il carbonio e prosegue con elementi e
       numeri: `C9H10O2`, `C6H5NO2`, `CHCl3`. Si pretende almeno un carbonio e
       un secondo elemento, altrimenti «C9» da solo sarebbe una formula. */
    var re = /\b(C\d{0,3}(?:(?:H|N|O|S|P|F|Cl|Br|I|Si|B|Se)\d{0,3}){1,8})\b/g;
    var trovate = [], m;
    while ((m = re.exec(testo)) !== null) {
      var f = m[1];
      /* scarta le sigle: CDCl3 è il solvente, non il composto; DMSO, CFC… */
      if (/^CDCl3$/i.test(f)) continue;
      if (!/[A-Z]/.test(f.slice(1))) continue;
      /* un contesto che la nomina esplicitamente vale di più */
      var prima = testo.slice(Math.max(0, m.index - 40), m.index).toLowerCase();
      var forte = /formula|composto|compound|molecolare|molecular|bruta|empirica/.test(prima);
      trovate.push({ formula: f, forte: forte, dove: m.index });
    }
    if (!trovate.length) return null;
    var forti = trovate.filter(function (x) { return x.forte; });
    var scelta = (forti.length ? forti : trovate)[0];
    return { valore: scelta.formula,
             perche: scelta.forte
               ? t('nominata come formula del composto nel testo',
                   'named as the compound’s formula in the text')
               : t('riconosciuta come formula bruta nel testo',
                   'recognised as a molecular formula in the text'),
             altre: trovate.map(function (x) { return x.formula; })
               .filter(function (v, i, a) { return a.indexOf(v) === i; }) };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · Le sezioni: IR, MS, ¹H, ¹³C, UV

     Si cerca l'ETICHETTA della tecnica e si legge quello che viene dopo, fino
     alla fine della frase o all'etichetta successiva. Senza questo confine,
     i numeri di una sezione finirebbero in un'altra: le bande IR di un
     carbonile (1715) e una massa (m/z 1715 non esiste, ma 150 sì) sono
     entrambe numeri a tre o quattro cifre, e distinguerli dal solo valore non
     si può.
     ═════════════════════════════════════════════════════════════════════════ */
  var ETICHETTE = [
    { chiave: 'ir',  re: /\b(?:IR|I\.?R\.?|infraross\w*|infrared)\b/i },
    { chiave: 'ms',  re: /\b(?:MS|M\.?S\.?|massa|mass spectr\w*|spettro di massa|m\/z|EI|ESI)\b/i },
    { chiave: 'h1',  re: /(?:\b1H\b|\bH1\b|proton\w*)\s*(?:-|\s)?\s*(?:NMR|RMN)|\bNMR\s*1H\b/i },
    { chiave: 'c13', re: /(?:\b13C\b|\bC13\b)\s*(?:-|\s)?\s*(?:NMR|RMN|DEPT)?|\bDEPT\b/i },
    { chiave: 'uv',  re: /\b(?:UV|UV-?Vis|ultraviolett\w*|ultraviolet)\b/i }
  ];

  function sezioni(testo) {
    var punti = [];
    ETICHETTE.forEach(function (e) {
      var re = new RegExp(e.re.source, 'gi');
      var m;
      while ((m = re.exec(testo)) !== null) {
        punti.push({ chiave: e.chiave, da: m.index, fine: m.index + m[0].length });
      }
    });
    punti.sort(function (a, b) { return a.da - b.da; });
    var fuori = {};
    punti.forEach(function (p, i) {
      var finePezzo = (i + 1 < punti.length) ? punti[i + 1].da : testo.length;
      /* non si attraversa una riga vuota: un capoverso nuovo è un argomento
         nuovo, e senza questo limite una sezione IR a fine pagina si
         prendeva tutto il resto del documento */
      var pezzo = testo.slice(p.fine, finePezzo);
      var vuota = pezzo.search(/\n[ \t]*\n/);
      if (vuota >= 0) pezzo = pezzo.slice(0, vuota);
      if (!fuori[p.chiave]) fuori[p.chiave] = [];
      fuori[p.chiave].push(pezzo);
    });
    return fuori;
  }

  /* ── I numeri di una sezione IR: numeri d'onda plausibili ──────────────── */
  function bandeIR(pezzi) {
    var fuori = [];
    (pezzi || []).forEach(function (p) {
      var re = /\b(\d{3,4})(?:\.\d+)?\b/g, m;
      while ((m = re.exec(p)) !== null) {
        var v = +m[1];
        /* l'intervallo di uno spettro IR: fuori di qui non è una banda */
        if (v >= 400 && v <= 4000) fuori.push(v);
      }
    });
    return fuori.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  /* ── I picchi di massa: «150 (100)», «m/z 150», liste ──────────────────── */
  function picchiMS(pezzi) {
    var fuori = [];
    (pezzi || []).forEach(function (p) {
      var re = /(\d{1,4}(?:\.\d+)?)\s*(?:\(\s*(\d{1,3}(?:\.\d+)?)\s*%?\s*\))?/g, m;
      while ((m = re.exec(p)) !== null) {
        var mz = parseFloat(m[1]);
        if (!isFinite(mz) || mz < 12 || mz > 3000) continue;
        fuori.push({ mz: mz, i: m[2] !== undefined ? parseFloat(m[2]) : 1 });
      }
    });
    return fuori;
  }

  /* ── I segnali ¹H: ppm, integrazione, molteplicità, J ──────────────────── */
  var MULT = '(?:br\\s*)?(?:s|d|t|q|quint|sext|sept|m|dd|ddd|dt|td|qd|sl|bs|singoletto|doppietto|tripletto|quartetto|multipletto)';

  function segnaliH(pezzi) {
    var fuori = [];
    (pezzi || []).forEach(function (p) {
      var testo = puntoDecimale(p);
      /* la forma canonica: «7.30 (5H, m, J = 8.0 Hz)» — in qualunque ordine
         dentro la parentesi, perché i testi non sono d'accordo fra loro */
      var re = /(\d{1,2}(?:\.\d{1,3})?)\s*(?:ppm)?\s*\(([^)]{0,90})\)/g, m;
      while ((m = re.exec(testo)) !== null) {
        var ppm = parseFloat(m[1]);
        if (!isFinite(ppm) || ppm < -2 || ppm > 16) continue;
        var dentro = m[2];
        var nH = null, mult = '', J = [];
        var mi = dentro.match(/(\d{1,2})\s*H\b/i);
        if (mi) nH = +mi[1];
        var mm = dentro.match(new RegExp('(?:^|[,;\\s])(' + MULT + ')(?=[,;\\s)]|$)', 'i'));
        if (mm) mult = mm[1];
        var mj = /J\s*(?:=|:)?\s*([\d.,\s]+)\s*Hz/i.exec(dentro);
        if (mj) {
          J = mj[1].split(/[,;\s]+/).map(parseFloat).filter(isFinite);
        }
        fuori.push({ ppm: ppm, nH: nH, molteplicita: mult, J: J });
      }
      /* la forma nuda: una lista di spostamenti senza parentesi */
      if (!fuori.length) {
        var re2 = /\b(\d{1,2}\.\d{1,3})\b/g, m2;
        while ((m2 = re2.exec(testo)) !== null) {
          var v = parseFloat(m2[1]);
          if (v >= -2 && v <= 16) fuori.push({ ppm: v, nH: null, molteplicita: '', J: [] });
        }
      }
    });
    return fuori;
  }

  /* ── I segnali ¹³C: una lista di spostamenti, con l'eventuale DEPT ─────── */
  function segnaliC(pezzi) {
    var fuori = [];
    (pezzi || []).forEach(function (p) {
      var testo = puntoDecimale(p);
      var re = /\b(\d{1,3}(?:\.\d{1,2})?)\b/g, m;
      while ((m = re.exec(testo)) !== null) {
        var v = parseFloat(m[1]);
        /* l'intervallo del ¹³C: da -10 (TMS e silili) a 230 (chetoni) */
        if (v >= 0 && v <= 230) fuori.push(v);
      }
    });
    return fuori.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · L'estrazione, con la provenienza di ogni dato
     ═════════════════════════════════════════════════════════════════════════ */
  function estrai(testoGrezzo) {
    var testo = normalizza(testoGrezzo);
    var sez = sezioni(testo);
    var provenienza = [], mancanti = [];

    var F = trovaFormula(testo);
    if (F) {
      provenienza.push({ dato: t('formula molecolare', 'molecular formula'),
                         valore: F.valore, perche: F.perche });
      if (F.altre.length > 1) {
        provenienza.push({ dato: t('altre formule nel testo', 'other formulas in the text'),
                           valore: F.altre.join(', '),
                           perche: t('scelta la prima nominata come formula del composto; ' +
                                     'se è sbagliata, correggila a mano',
                                     'the first one named as the compound’s formula was ' +
                                     'chosen; if it is wrong, correct it by hand') });
      }
    } else {
      mancanti.push(t('la formula molecolare', 'the molecular formula'));
    }

    var ir = bandeIR(sez.ir);
    if (ir.length) {
      provenienza.push({ dato: t('bande IR (cm⁻¹)', 'IR bands (cm⁻¹)'),
                         valore: ir.join(', '),
                         perche: t('numeri fra 400 e 4000 dopo l’etichetta IR',
                                   'numbers between 400 and 4000 after the IR label') });
    } else if (sez.ir) {
      mancanti.push(t('bande IR leggibili (l’etichetta c’è, i numeri no)',
                      'readable IR bands (the label is there, the numbers are not)'));
    } else {
      mancanti.push(t('lo spettro IR', 'the IR spectrum'));
    }

    var ms = picchiMS(sez.ms);
    if (ms.length) {
      provenienza.push({ dato: t('picchi di massa (m/z)', 'mass peaks (m/z)'),
                         valore: ms.slice(0, 12).map(function (x) {
                           return x.mz + (x.i !== 1 ? ' (' + x.i + ')' : '');
                         }).join(', ') + (ms.length > 12 ? ' …' : ''),
                         perche: t('numeri dopo l’etichetta MS o m/z; fra parentesi ' +
                                   'l’intensità relativa quando c’è',
                                   'numbers after the MS or m/z label; the relative ' +
                                   'intensity in brackets where present') });
    } else {
      mancanti.push(t('lo spettro di massa', 'the mass spectrum'));
    }

    var h1 = segnaliH(sez.h1);
    if (h1.length) {
      provenienza.push({ dato: t('segnali ¹H', '¹H signals'), valore: h1.length,
                         perche: t('spostamento seguito da parentesi con integrazione, ' +
                                   'molteplicità e J',
                                   'a shift followed by brackets with the integral, ' +
                                   'multiplicity and J') });
    } else {
      mancanti.push(t('lo spettro ¹H', 'the ¹H spectrum'));
    }

    var c13 = segnaliC(sez.c13);
    if (c13.length) {
      provenienza.push({ dato: t('segnali ¹³C', '¹³C signals'), valore: c13.length,
                         perche: t('numeri fra 0 e 230 dopo l’etichetta ¹³C',
                                   'numbers between 0 and 230 after the ¹³C label') });
    } else {
      mancanti.push(t('lo spettro ¹³C', 'the ¹³C spectrum'));
    }

    return {
      formula: F ? F.valore : null,
      ir: ir, ms: ms, h1: h1, c13: c13,
      provenienza: provenienza,
      mancanti: mancanti,
      sezioniTrovate: Object.keys(sez),
      quanti: (F ? 1 : 0) + (ir.length ? 1 : 0) + (ms.length ? 1 : 0) +
              (h1.length ? 1 : 0) + (c13.length ? 1 : 0)
    };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §5 · Lo svolgimento
     ═════════════════════════════════════════════════════════════════════════ */
  function svolgi(testoGrezzo, opz) {
    opz = opz || {};
    var dati = estrai(testoGrezzo);
    var fuori = { dati: dati, dossier: null, avvisi: [] };

    if (!dati.quanti) {
      fuori.avvisi.push(t(
        'In questo testo non ho riconosciuto nessun dato spettroscopico. Non ' +
        'vuol dire che non ci sia: vuol dire che non è scritto in una forma che ' +
        'so leggere. Puoi incollare i dati a mano qui sotto.',
        'I recognised no spectroscopic data in this text. That does not mean ' +
        'there is none: it means it is not written in a form I can read. You can ' +
        'paste the data by hand below.'));
      return fuori;
    }
    if (!globale.BSIElucida) {
      fuori.avvisi.push(t('il motore di elucidazione non è caricato',
                          'the elucidation engine is not loaded'));
      return fuori;
    }

    fuori.dossier = globale.BSIElucida.dossier({
      formula: dati.formula,
      ms: dati.ms,
      ir: dati.ir,
      h1: dati.h1,
      c13: dati.c13
    });

    /* Ciò che MANCA conta quanto ciò che c'è: uno svolgimento fatto su metà
       dei dati può arrivare a una conclusione sbagliata con tutta la sua
       bella catena di passaggi giusti. */
    if (dati.mancanti.length) {
      fuori.avvisi.push(t(
        'Lo svolgimento qui sotto NON ha usato: ' + dati.mancanti.join('; ') +
        '. Se nel documento c’erano, non li ho riconosciuti — controlla la ' +
        'tabella dei dati letti prima di fidarti della conclusione.',
        'The work below did NOT use: ' + dati.mancanti.join('; ') +
        '. If they were in the document, I did not recognise them — check the ' +
        'table of data read before trusting the conclusion.'));
    }
    return fuori;
  }

  /* Il confronto con una struttura proposta: è la cosa onesta che si può
     fare al posto di indovinare. */
  function verifica(smiles, testoGrezzo) {
    if (!globale.BSIElucida || !globale.BSIElucida.confronta) return null;
    var dati = estrai(testoGrezzo);
    return globale.BSIElucida.confronta(smiles, {
      formula: dati.formula, h1: dati.h1, c13: dati.c13, ir: dati.ir, ms: dati.ms
    });
  }

  globale.BSIQuesito = {
    estrai: estrai,
    svolgi: svolgi,
    verifica: verifica,
    normalizza: normalizza,
    sezioni: sezioni,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
