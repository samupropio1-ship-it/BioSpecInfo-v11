/* ═══════════════════════════════════════════════════════════════════════════
   BSI DOCUMENTO — leggere un file, qualunque file, e dire che cosa c'è dentro

   PERCHE' ESISTE

   Il lettore di spettri accettava JCAMP-DX, liste di picchi e immagini. Ma un
   quesito d'esame non arriva così: arriva come un PDF di tre pagine, o come
   la fotografia di un foglio, o come un documento di testo con dentro una
   tabella di spostamenti e un grafico incollato.

   Questo modulo non interpreta niente: APRE il file e ne tira fuori tutto
   quello che c'è — le pagine disegnate una per una, il testo, le immagini —
   e, soprattutto, DICE CHE COSA NON HA POTUTO LEGGERE. È quella seconda metà
   che conta: un lettore che restituisce poco testo senza dire che la pagina
   era una scansione fa credere che il documento fosse quasi vuoto.

   CHE COSA SA APRIRE

   · PDF            — ogni pagina disegnata e il suo strato di testo (PDF.js)
   · immagini       — PNG, JPEG, WebP, GIF: la pagina c'è, il testo no
   · testo          — txt, csv, tsv, md, json, jdx/dx (JCAMP), xml
   · docx, odt      — sono archivi ZIP: si aprono e si legge il documento
   · pptx, xlsx     — stesso meccanismo, testo delle diapositive e delle celle

   CHE COSA NON SA FARE, E LO DICE

   **Non c'è riconoscimento ottico dei caratteri.** Una pagina scansionata, o
   una fotografia di un foglio, contiene PIXEL e non lettere: il testo non si
   può leggere, e il modulo lo dichiara invece di restituire una stringa
   vuota come se il documento non avesse contenuto. Le pagine restano
   visibili e misurabili — da lì passa l'estrazione della traccia dai pixel,
   che esiste già in `bsi-spettrolettore.js`.

   Un formato che non conosce non prova a indovinarlo: dice il tipo, la
   dimensione, e che non sa aprirlo.

   USO   BSIDocumento.leggi(file).then(d => …)
         → { nome, tipo, pagine:[{n, tela, testo, …}], testo, avvisi, … }

   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  var BASE_PDFJS = './vendor/pdfjs/';
  var _pdfjs = null;

  /* PDF.js si carica SOLO quando serve davvero: sono due megabyte e mezzo, e
     chi apre il Centro spettroscopico per guardare uno spettro non deve
     pagarli. Il caricamento si ricorda, così aprire il secondo PDF è
     immediato. */
  function caricaPdfJs() {
    if (_pdfjs) return _pdfjs;
    _pdfjs = import(BASE_PDFJS + 'pdf.min.mjs').then(function (m) {
      m.GlobalWorkerOptions.workerSrc = BASE_PDFJS + 'pdf.worker.min.mjs';
      return m;
    }).catch(function (e) {
      _pdfjs = null;                       /* un guasto non si ricorda */
      throw e;
    });
    return _pdfjs;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Gli archivi ZIP, a mano

     `docx`, `odt`, `pptx` e `xlsx` sono archivi ZIP con dentro dell'XML. Per
     aprirli non serve una libreria: il browser sa già scompattare un flusso
     deflate con `DecompressionStream`, e la struttura di uno ZIP è una
     direttrice in fondo al file che elenca le voci.

     Si legge la direttrice centrale e non le intestazioni locali, perché
     quelle possono dichiarare dimensione zero e rimandare a un descrittore
     che viene DOPO i dati — e per trovarlo bisognerebbe già sapere dove
     finiscono.
     ═════════════════════════════════════════════════════════════════════════ */
  function apriZip(buffer) {
    var d = new DataView(buffer), n = buffer.byteLength;
    /* la fine della direttrice centrale: firma 0x06054b50, negli ultimi 64 KiB */
    var fine = -1, minimo = Math.max(0, n - 66000);
    for (var i = n - 22; i >= minimo; i--) {
      if (d.getUint32(i, true) === 0x06054b50) { fine = i; break; }
    }
    if (fine < 0) return null;
    var quante = d.getUint16(fine + 10, true);
    var inizio = d.getUint32(fine + 16, true);
    var voci = [], p = inizio;
    for (var k = 0; k < quante && p + 46 <= n; k++) {
      if (d.getUint32(p, true) !== 0x02014b50) break;
      var metodo = d.getUint16(p + 10, true);
      var compressa = d.getUint32(p + 20, true);
      var lunNome = d.getUint16(p + 28, true);
      var lunExtra = d.getUint16(p + 30, true);
      var lunCom = d.getUint16(p + 32, true);
      var off = d.getUint32(p + 42, true);
      var nome = new TextDecoder().decode(new Uint8Array(buffer, p + 46, lunNome));
      voci.push({ nome: nome, metodo: metodo, compressa: compressa, off: off });
      p += 46 + lunNome + lunExtra + lunCom;
    }
    return { buffer: buffer, vista: d, voci: voci };
  }

  function estraiDaZip(zip, voce) {
    var d = zip.vista;
    if (d.getUint32(voce.off, true) !== 0x04034b50) return Promise.resolve(null);
    var lunNome = d.getUint16(voce.off + 26, true);
    var lunExtra = d.getUint16(voce.off + 28, true);
    var dati = voce.off + 30 + lunNome + lunExtra;
    var pezzo = new Uint8Array(zip.buffer, dati, voce.compressa);
    if (voce.metodo === 0) return Promise.resolve(pezzo);
    if (voce.metodo !== 8 || typeof DecompressionStream !== 'function') {
      return Promise.resolve(null);
    }
    var fl = new Blob([pezzo]).stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(fl).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }

  /* Il testo di un XML, senza i marcatori. I capoversi di un `docx` sono
     `</w:p>`, quelli di un `odt` `</text:p>`, le diapositive `</a:p>`: si
     trasformano in a capo PRIMA di togliere i marcatori, altrimenti tutto il
     documento diventa una riga sola e le tabelle di spostamenti chimici
     — che si leggono per righe — diventano illeggibili. */
  function testoDaXml(xml) {
    return xml
      .replace(/<(?:w|text|a):tab\b[^>]*\/?>/g, '\t')
      .replace(/<\/(?:w:p|text:p|text:h|a:p)>/g, '\n')
      .replace(/<(?:w:br|text:line-break)\b[^>]*\/?>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, function (_, c) { return String.fromCharCode(+c); })
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
  }

  var PARTI_ZIP = [
    { re: /^word\/document\.xml$/, cosa: 'Word' },
    { re: /^word\/(?:header|footer)\d*\.xml$/, cosa: 'Word' },
    { re: /^content\.xml$/, cosa: 'OpenDocument' },
    { re: /^ppt\/slides\/slide\d+\.xml$/, cosa: 'PowerPoint' },
    { re: /^ppt\/notesSlides\/notesSlide\d+\.xml$/, cosa: 'PowerPoint' },
    { re: /^xl\/sharedStrings\.xml$/, cosa: 'Excel' },
    { re: /^xl\/worksheets\/sheet\d+\.xml$/, cosa: 'Excel' }
  ];

  function leggiArchivio(buffer, avvisi) {
    var zip = apriZip(buffer);
    if (!zip) return Promise.resolve(null);
    var scelte = [], cosa = '';
    zip.voci.forEach(function (v) {
      PARTI_ZIP.forEach(function (p) {
        if (p.re.test(v.nome)) { scelte.push(v); cosa = cosa || p.cosa; }
      });
    });
    if (!scelte.length) return Promise.resolve(null);
    scelte.sort(function (a, b) { return a.nome.localeCompare(b.nome, 'en', { numeric: true }); });
    /* le immagini dentro l'archivio: non si estraggono, ma si CONTANO —
       altrimenti un documento con otto figure sembrerebbe senza figure */
    var figure = zip.voci.filter(function (v) {
      return /\.(png|jpe?g|gif|emf|wmf|svg|webp)$/i.test(v.nome);
    }).length;
    return Promise.all(scelte.map(function (v) {
      return estraiDaZip(zip, v).then(function (b) {
        if (!b) return '';
        return testoDaXml(new TextDecoder().decode(b));
      }).catch(function () { return ''; });
    })).then(function (pezzi) {
      var testo = pezzi.filter(Boolean).join('\n\n').trim();
      if (figure) {
        avvisi.push(t('Il documento contiene ' + figure + ' immagini incorporate: il ' +
                      'loro contenuto non è testo e non viene letto.',
                      'The document contains ' + figure + ' embedded images: their ' +
                      'content is not text and is not read.'));
      }
      return { testo: testo, cosa: cosa, figure: figure };
    });
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Il PDF
     ═════════════════════════════════════════════════════════════════════════ */
  function leggiPdf(buffer, opz, avvisi) {
    return caricaPdfJs().then(function (pdfjs) {
      return pdfjs.getDocument({
        data: buffer,
        standardFontDataUrl: BASE_PDFJS + 'standard_fonts/',
        /* un PDF può contenere JavaScript e moduli esterni: non servono a
           leggerlo e non si eseguono */
        isEvalSupported: false
      }).promise;
    }).then(function (doc) {
      var quante = Math.min(doc.numPages, opz.maxPagine || 40);
      if (doc.numPages > quante) {
        avvisi.push(t('Il documento ha ' + doc.numPages + ' pagine: ne sono state ' +
                      'aperte le prime ' + quante + '.',
                      'The document has ' + doc.numPages + ' pages: the first ' +
                      quante + ' were opened.'));
      }
      var passi = [];
      for (var i = 1; i <= quante; i++) passi.push(i);
      var pagine = [];
      return passi.reduce(function (catena, n) {
        return catena.then(function () {
          return doc.getPage(n).then(function (pg) {
            var scala = opz.scala || 1.6;
            var vp = pg.getViewport({ scale: scala });
            var tela = document.createElement('canvas');
            tela.width = Math.max(1, Math.round(vp.width));
            tela.height = Math.max(1, Math.round(vp.height));
            return pg.render({ canvasContext: tela.getContext('2d'), viewport: vp })
              .promise
              .then(function () { return pg.getTextContent(); })
              .then(function (tc) {
                /* Il testo di un PDF arriva a frammenti con le loro
                   coordinate, NON a righe. Incollarli di fila farebbe una
                   riga sola, e una tabella di spostamenti chimici — che si
                   legge per righe — diventerebbe illeggibile. Si raggruppa
                   per ordinata, con una tolleranza, e si ordina per ascissa. */
                var righe = {};
                tc.items.forEach(function (it) {
                  if (!it.str) return;
                  var y = Math.round((it.transform[5] || 0) / 3) * 3;
                  if (!righe[y]) righe[y] = [];
                  righe[y].push({ x: it.transform[4] || 0, s: it.str });
                });
                var testo = Object.keys(righe)
                  .map(Number).sort(function (a, b) { return b - a; })
                  .map(function (y) {
                    return righe[y].sort(function (a, b) { return a.x - b.x; })
                      .map(function (p) { return p.s; }).join(' ')
                      .replace(/\s{2,}/g, ' ').trim();
                  }).filter(Boolean).join('\n');
                pagine.push({ n: n, tela: tela, testo: testo,
                              larghezza: tela.width, altezza: tela.height });
              });
          });
        });
      }, Promise.resolve()).then(function () {
        var senzaTesto = pagine.filter(function (p) { return p.testo.length < 20; });
        if (senzaTesto.length) {
          avvisi.push(t(
            senzaTesto.length + ' pagine su ' + pagine.length + ' non hanno uno ' +
            'strato di testo: sono immagini (una scansione, o una figura a tutta ' +
            'pagina). Il loro contenuto NON è stato letto — non c’è riconoscimento ' +
            'ottico dei caratteri. Le pagine restano visibili qui sotto.',
            senzaTesto.length + ' pages out of ' + pagine.length + ' have no text ' +
            'layer: they are images (a scan, or a full-page figure). Their content ' +
            'was NOT read — there is no optical character recognition. The pages ' +
            'remain visible below.'));
        }
        return pagine;
      });
    });
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · Le immagini
     ═════════════════════════════════════════════════════════════════════════ */
  function leggiImmagine(file, avvisi) {
    return new Promise(function (ris, no) {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () {
        var tela = document.createElement('canvas');
        tela.width = im.naturalWidth; tela.height = im.naturalHeight;
        tela.getContext('2d').drawImage(im, 0, 0);
        URL.revokeObjectURL(url);
        avvisi.push(t('Un’immagine non contiene testo: quello che c’è scritto ' +
                      'dentro non viene letto, perché non c’è riconoscimento ottico ' +
                      'dei caratteri. Se è la fotografia di uno spettro, la traccia ' +
                      'si può estrarre dai pixel con «Apri un’immagine».',
                      'An image contains no text: whatever is written inside is not ' +
                      'read, because there is no optical character recognition. If it ' +
                      'is a photograph of a spectrum, the trace can be extracted from ' +
                      'the pixels with “Open an image”.'));
        ris([{ n: 1, tela: tela, testo: '',
               larghezza: tela.width, altezza: tela.height }]);
      };
      im.onerror = function () { URL.revokeObjectURL(url); no(new Error('immagine illeggibile')); };
      im.src = url;
    });
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · L'ingresso pubblico
     ═════════════════════════════════════════════════════════════════════════ */
  var TESTUALI = /\.(txt|csv|tsv|md|markdown|json|xml|jdx|dx|jcamp|mol|sdf|smi|log|dat|asc)$/i;
  var IMMAGINI = /\.(png|jpe?g|gif|webp|bmp|avif)$/i;
  var ARCHIVI = /\.(docx|odt|pptx|xlsx|ods|odp)$/i;

  function leggi(file, opz) {
    opz = opz || {};
    if (!file) return Promise.resolve(null);
    var nome = file.name || 'documento';
    var tipo = file.type || '';
    var avvisi = [];
    var base = {
      nome: nome, tipo: tipo, byte: file.size || 0,
      pagine: [], testo: '', avvisi: avvisi, formato: ''
    };

    function conTesto(testo, formato) {
      base.testo = testo; base.formato = formato;
      return base;
    }

    var esito;
    if (/pdf/i.test(tipo) || /\.pdf$/i.test(nome)) {
      base.formato = 'PDF';
      esito = file.arrayBuffer()
        .then(function (b) { return leggiPdf(b, opz, avvisi); })
        .then(function (pagine) {
          base.pagine = pagine;
          base.testo = pagine.map(function (p) { return p.testo; })
            .filter(Boolean).join('\n\n');
          return base;
        })
        .catch(function (e) {
          base.errore = t('Questo PDF non si è aperto: ', 'This PDF did not open: ') +
            ((e && e.message) ? e.message : String(e));
          return base;
        });
    } else if (/^image\//i.test(tipo) || IMMAGINI.test(nome)) {
      base.formato = t('immagine', 'image');
      esito = leggiImmagine(file, avvisi)
        .then(function (p) { base.pagine = p; return base; })
        .catch(function (e) {
          base.errore = t('Questa immagine non si è aperta: ',
                          'This image did not open: ') + e.message;
          return base;
        });
    } else if (ARCHIVI.test(nome) || /officedocument|opendocument/i.test(tipo)) {
      esito = file.arrayBuffer().then(function (b) {
        return leggiArchivio(b, avvisi);
      }).then(function (r) {
        if (!r) {
          base.errore = t('Questo file sembra un documento d’ufficio ma non si è ' +
                          'aperto: l’archivio non contiene le parti attese.',
                          'This file looks like an office document but did not open: ' +
                          'the archive does not contain the expected parts.');
          return base;
        }
        return conTesto(r.testo, r.cosa);
      }).catch(function (e) {
        base.errore = t('Questo documento non si è aperto: ',
                        'This document did not open: ') + e.message;
        return base;
      });
    } else if (/^text\//i.test(tipo) || TESTUALI.test(nome) || !tipo) {
      esito = file.text().then(function (s) {
        /* Un file binario letto come testo diventa un pasticcio di caratteri
           di controllo: invece di mostrarlo, si dice che non è testo. */
        var controllo = (s.match(/[\x00-\x08\x0E-\x1F]/g) || []).length;
        if (controllo > s.length * 0.01) {
          base.errore = t('Questo file non è testo: contiene dati binari. ' +
                          'Il tipo dichiarato è «' + (tipo || t('sconosciuto', 'unknown')) + '».',
                          'This file is not text: it contains binary data. ' +
                          'The declared type is “' + (tipo || 'unknown') + '”.');
          return base;
        }
        return conTesto(s, t('testo', 'text'));
      }).catch(function (e) {
        base.errore = t('Questo file non si è letto: ', 'This file could not be read: ') +
          e.message;
        return base;
      });
    } else {
      base.errore = t('Non so aprire un file di tipo «' + tipo + '». ' +
                      'So aprire: PDF, immagini, testo, CSV, JCAMP-DX, Word, ' +
                      'OpenDocument, PowerPoint ed Excel.',
                      'I cannot open a file of type “' + tipo + '”. ' +
                      'I can open: PDF, images, text, CSV, JCAMP-DX, Word, ' +
                      'OpenDocument, PowerPoint and Excel.');
      esito = Promise.resolve(base);
    }

    return esito.then(function (d) {
      d.nParole = d.testo ? (d.testo.match(/\S+/g) || []).length : 0;
      d.nRighe = d.testo ? d.testo.split('\n').filter(function (r) {
        return r.trim();
      }).length : 0;
      if (!d.errore && !d.testo && !d.pagine.length) {
        d.avvisi.push(t('Il file si è aperto ma è vuoto.',
                        'The file opened but is empty.'));
      }
      return d;
    });
  }

  globale.BSIDocumento = {
    leggi: leggi,
    apriZip: apriZip,
    testoDaXml: testoDaXml,
    caricaPdfJs: caricaPdfJs,
    FORMATI: t('PDF, immagini, testo, CSV, JCAMP-DX, Word (.docx), ' +
               'OpenDocument (.odt), PowerPoint (.pptx), Excel (.xlsx)',
               'PDF, images, text, CSV, JCAMP-DX, Word (.docx), ' +
               'OpenDocument (.odt), PowerPoint (.pptx), Excel (.xlsx)'),
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
