/* ═══════════════════════════════════════════════════════════════════════════
   bsi-pannelli-lingua.js — i due pannelli nuovi del menu ✨
   BioSpecInfo · © Samuele Pio Provenzano

     🌍 Lingua                  cambia la lingua dell'applicazione
     🔤 Linguaggi delle molecole  converte fra SMILES, InChI, molfile, SMARTS…
                                  dà il nome, e insegna a scriverli

   Il pannello dichiara sempre tre cose che altrove si tacciono: che cosa è
   tradotto e che cosa no, quali conversioni sono possibili e quali no, e da
   dove viene un nome. Un dato senza provenienza, in chimica, non è un dato.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  var L = function () { return (globale.BSILingue ? globale.BSILingue.corrente() : 'it'); };
  function t(it, en) { return L() === 'en' ? en : it; }

  /* ═════════════════════════════════════════════════════════════════════════
     Stile — coerente col pannello ✨ esistente
     ═════════════════════════════════════════════════════════════════════════ */
  var css = document.createElement('style');
  css.textContent = [
    '#bsiLG-modal{position:fixed;inset:0;z-index:99996;display:none;align-items:center;' +
      'justify-content:center;background:rgba(2,8,16,.80);backdrop-filter:blur(4px);padding:16px}',
    '#bsiLG-modal.open{display:flex}',
    '#bsiLG-box{background:#0c1828;border:1px solid #1e3a52;border-radius:18px;max-width:860px;' +
      'width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 16px 50px rgba(0,0,0,.6)}',
    '#bsiLG-head{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;' +
      'border-bottom:1px solid #1e3a52;position:sticky;top:0;background:#0c1828;z-index:3}',
    '#bsiLG-head h3{margin:0;color:#1fd39a;font-size:1.05rem;font-weight:800}',
    '#bsiLG-x{background:#16293f;border:none;color:#9fb8d0;width:32px;height:32px;' +
      'border-radius:8px;cursor:pointer;font-size:18px}',
    '#bsiLG-x:hover{background:#1e3a52;color:#fff}',
    '#bsiLG-body{padding:18px 20px 24px}',
    '.bsiLG-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}',
    '.bsiLG-tab{padding:9px 15px;border-radius:9px;border:1px solid #1e3a52;background:#11243a;' +
      'color:#bcd3e8;font-size:12.5px;font-weight:700;cursor:pointer}',
    '.bsiLG-tab.on{background:#1aa97a;border-color:#1fd39a;color:#06141f}',
    '.bsiLG-card{background:#11243a;border:1px solid #1e3a52;border-radius:12px;padding:14px 16px;' +
      'margin-bottom:12px}',
    '.bsiLG-card h4{margin:0 0 8px;color:#1fd39a;font-size:13.5px;font-weight:800}',
    '.bsiLG-card p{margin:0 0 8px;color:#cfe2f5;font-size:12.8px;line-height:1.62}',
    '.bsiLG-card ul{margin:0 0 8px 18px;padding:0;color:#cfe2f5;font-size:12.6px;line-height:1.62}',
    '.bsiLG-card li{margin-bottom:4px}',
    '.bsiLG-in{width:100%;padding:11px 13px;background:#081321;border:1px solid #1e3a52;' +
      'border-radius:10px;color:#e8f4ff;font-size:13px;font-family:ui-monospace,monospace;' +
      'outline:none;box-sizing:border-box;resize:vertical}',
    '.bsiLG-in:focus{border-color:#1fd39a}',
    '.bsiLG-btn{padding:10px 18px;background:#1fd39a;border:none;border-radius:9px;color:#06141f;' +
      'font-weight:800;font-size:13px;cursor:pointer}',
    '.bsiLG-btn:disabled{opacity:.5;cursor:default}',
    '.bsiLG-btn2{padding:9px 14px;background:#16293f;border:1px solid #1e3a52;border-radius:9px;' +
      'color:#bcd3e8;font-weight:700;font-size:12.5px;cursor:pointer}',
    '.bsiLG-btn2:hover{border-color:#1fd39a;color:#e8f4ff}',
    '.bsiLG-riga{display:grid;grid-template-columns:150px 1fr auto;gap:10px;align-items:start;' +
      'padding:9px 0;border-bottom:1px solid #16293f}',
    '.bsiLG-riga:last-child{border-bottom:none}',
    '.bsiLG-et{color:#7fd8c0;font-size:11.5px;font-weight:800;text-transform:uppercase;' +
      'letter-spacing:.04em;padding-top:2px}',
    '.bsiLG-val{color:#e8f4ff;font-size:12.4px;font-family:ui-monospace,monospace;' +
      'word-break:break-all;line-height:1.5}',
    '.bsiLG-no{color:#8aa2b8;font-size:12px;font-style:italic;line-height:1.5}',
    '.bsiLG-cp{background:#16293f;border:1px solid #1e3a52;border-radius:7px;color:#9fb8d0;' +
      'font-size:10.5px;font-weight:700;padding:4px 9px;cursor:pointer;white-space:nowrap}',
    '.bsiLG-cp:hover{border-color:#1fd39a;color:#e8f4ff}',
    '.bsiLG-lin{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}',
    '.bsiLG-lingua{display:flex;align-items:center;gap:8px;padding:12px 16px;background:#11243a;' +
      'border:1.5px solid #1e3a52;border-radius:11px;color:#e8f4ff;font-size:13.5px;' +
      'font-weight:700;cursor:pointer;min-width:150px}',
    '.bsiLG-lingua.on{border-color:#1fd39a;background:#0e3528}',
    '.bsiLG-lingua .fl{font-size:20px}',
    '.bsiLG-tab-cnt{display:none}', '.bsiLG-tab-cnt.on{display:block}',
    '.bsiLG-tbl{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}',
    '.bsiLG-tbl th{background:#15354a;color:#bff3e4;padding:7px 9px;text-align:left;' +
      'font-weight:800;font-size:11.5px}',
    '.bsiLG-tbl td{padding:6px 9px;border-bottom:1px solid #16293f;color:#cfe2f5;' +
      'vertical-align:top;line-height:1.5}',
    '.bsiLG-tbl code{color:#9ff0d4;font-size:11.8px}',
    '.bsiLG-avv{background:#2a1f0c;border:1px solid #6b5420;border-radius:9px;padding:10px 13px;' +
      'color:#f0d79a;font-size:12.2px;line-height:1.6;margin-bottom:10px}',
    '.bsiLG-ok{background:#0c3024;border:1px solid #1aa97a;border-radius:9px;padding:10px 13px;' +
      'color:#9ff0d4;font-size:12.2px;line-height:1.6;margin-bottom:10px}',
    '.bsiLG-ex{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}',
    '.bsiLG-exb{background:#0e2135;border:1px solid #1e3a52;border-radius:14px;color:#a8c8e0;' +
      'font-size:11.5px;padding:5px 11px;cursor:pointer;font-family:ui-monospace,monospace}',
    '.bsiLG-exb:hover{border-color:#1fd39a;color:#e8f4ff}',
    '@media print{#bsiLG-modal{display:none!important}}',
    '@media (max-width:640px){.bsiLG-riga{grid-template-columns:1fr;gap:4px}' +
      '.bsiLG-et{padding-top:0}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ═════════════════════════════════════════════════════════════════════════
     La modale
     ═════════════════════════════════════════════════════════════════════════ */
  /* Non c'è più una finestra: le viste vivono nelle due sezioni. */
  /* Dove si scrive: la finestra del menu ✨, oppure una sezione della
     navigazione. Le due funzioni di vista producono HTML e non sanno dove
     finirà — è l'unica ragione per cui si possono montare in due posti senza
     scriverle due volte. */
  var contenitore = null;      /* null = la finestra */

  function corpo() {
    return contenitore || document;
  }
  /* UNA SOLA CASA PER FUNZIONE.
     La prima stesura montava queste viste in due posti: una finestra aperta
     dal menu ✨ e, subito dopo, due sezioni della navigazione. Due posti con
     gli stessi identificativi (`bsiLG-src`, `bsiLG-conv`…) sono un guaio:
     `getElementById` ne serve uno a caso. Si era allora svuotato l'uno quando
     si apriva l'altro — e si è cascati in una trappola che c'era già: un
     ripiego, in fondo all'applicazione, che 800 ms dopo un click sostituisce
     qualunque sezione vuota con «Sezione in costruzione». La sezione svuotata
     diventava un cartello di lavori in corso.

     La risposta non è un terzo accorgimento: è togliere il doppione. Il menu
     ✨ ora PORTA alla sezione invece di aprire una finestra. Un posto solo,
     niente identificativi doppi, niente da svuotare. */
  function apri(titolo, html) {
    if (!contenitore) return;
    contenitore.innerHTML = '<div class="section-title">' + titolo + '</div>' + html;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Pannello «Lingua»
     ═════════════════════════════════════════════════════════════════════════ */
  function pannelloLingua() {
    var B = globale.BSILingue;
    if (!B) {
      apri('Lingua', '<div class="bsiLG-avv">Il motore delle lingue non è caricato.</div>');
      return;
    }
    var cop = B.copertura();
    /* ── Il selezionatore ───────────────────────────────────────────────
       Con dodici lingue un elenco di pulsanti non basta più: serve cercare, e
       serve vedere QUANTO è tradotta ciascuna — misurato applicando davvero il
       dizionario e contando, non letto da un numero scritto a mano. */
    var copPer = B.coperturaPerLingua();
    var html = '<input class="bsiLG-in" id="bsiLG-cerca" spellcheck="false" aria-label="' +
      t('Cerca una lingua', 'Search a language') + '" placeholder="' +
      t('cerca una lingua…', 'search a language…') + '" style="margin-bottom:10px">' +
      '<div class="bsiLG-lin" id="bsiLG-elenco">';
    B.lingue().forEach(function (l) {
      var c = copPer[l.codice] || { tradotti: 0, totali: 0 };
      var pct = c.totali ? Math.round(c.tradotti / c.totali * 100) : 0;
      html += '<button class="bsiLG-lingua' + (l.codice === B.corrente() ? ' on' : '') +
              '" data-l="' + l.codice + '" data-cerca="' +
              esc((l.nome + ' ' + l.codice).toLowerCase()) + '">' +
              '<span class="fl">' + l.bandiera + '</span>' +
              '<span style="flex:1"><span style="display:block">' + esc(l.nome) + '</span>' +
              '<span style="display:block;font-size:10.5px;font-weight:600;color:' +
              (pct === 100 ? '#7fd8c0' : '#d8b878') + '">' +
              (l.nativa ? t('originale', 'original')
                        : c.tradotti + '/' + c.totali + '  ·  ' + pct + '%') +
              '</span></span></button>';
    });
    html += '</div><div id="bsiLG-nessuna" style="display:none;color:#8aa2b8;' +
            'font-size:12px;padding:4px 2px">' +
            t('nessuna lingua con questo nome', 'no language by that name') + '</div>';

    html += '<div class="bsiLG-card"><h4>' +
      t('Che cosa viene tradotto', 'What gets translated') + '</h4><p>' +
      t('L’applicazione è scritta in italiano: 48 000 righe, con i testi scientifici ' +
        'dentro il codice. Questo comando traduce lo <b>scheletro</b> — i comandi con cui ci ' +
        'si muove — e non i contenuti delle sezioni. Dirlo è più utile che promettere una ' +
        'traduzione totale che non ci sarebbe.',
        'The application is written in Italian: 48,000 lines, with the scientific text inside ' +
        'the code. This switch translates the <b>skeleton</b> — the controls you navigate with — ' +
        'and not the contents of the sections. Saying so is more useful than promising a full ' +
        'translation that would not be there.') + '</p>';

    html += '<table class="bsiLG-tbl"><tr><th>' + t('Famiglia', 'Family') + '</th><th>' +
            t('Tradotti', 'Translated') + '</th><th>' + t('In tutto', 'Total') + '</th></tr>';
    var nomiFam = { navigazione: t('pulsanti di navigazione', 'navigation buttons'),
                    titoli: t('titoli di sezione', 'section titles'),
                    menu: t('voci del menu ✨', '✨ menu entries'),
                    marcati: t('elementi marcati', 'marked elements') };
    Object.keys(cop.perFamiglia).forEach(function (f) {
      var r = cop.perFamiglia[f];
      html += '<tr><td>' + (nomiFam[f] || f) + '</td><td><b>' + r.tradotti + '</b></td><td>' +
              r.totali + '</td></tr>';
    });
    html += '<tr><td><b>' + t('totale misurato', 'measured total') + '</b></td><td><b>' +
            cop.tradotti + '</b></td><td><b>' + cop.totali + '</b></td></tr></table>';
    html += '<p style="font-size:11.8px;color:#8aa2b8">' +
      t('Questi numeri sono <b>contati adesso</b> sulla pagina aperta, non dichiarati a mano. ' +
        'Questi due pannelli non compaiono nel conteggio perché non si traducono sostituendo ' +
        'testo: si ridisegnano già nella lingua scelta, voce per voce.',
        'These numbers are <b>counted now</b> on the open page, not declared by hand. These ' +
        'two panels are not in the count because they are not translated by substituting text: ' +
        'they are redrawn in the chosen language, entry by entry.') +
      '</p></div>';

    if (cop.restati.length) {
      html += '<div class="bsiLG-avv"><b>' + cop.restati.length + '</b> ' +
        t('elementi dello scheletro non hanno traduzione e sono rimasti in italiano:',
          'skeleton elements have no translation and stayed in Italian:') + '<br>' +
        esc(cop.restati.slice(0, 8).join(' · ')) +
        (cop.restati.length > 8 ? ' …' : '') + '</div>';
    } else if (B.corrente() !== 'it') {
      html += '<div class="bsiLG-ok">' +
        t('Nessun elemento dello scheletro è rimasto senza traduzione.',
          'No skeleton element was left untranslated.') + '</div>';
    }

    html += '<div class="bsiLG-card"><h4>' + t('Anche la nomenclatura', 'Nomenclature too') +
      '</h4><p>' + t('La lingua scelta vale anche per i nomi che il <b>nominatore IUPAC</b> ' +
        'produce nel pannello «Linguaggi delle molecole»: <code>propan-2-olo</code> in italiano, ' +
        '<code>propan-2-ol</code> in inglese; <code>acido butanoico</code> e ' +
        '<code>butanoic acid</code>.',
        'The chosen language also applies to the names the <b>IUPAC namer</b> produces in the ' +
        '"Molecular languages" panel: <code>propan-2-olo</code> in Italian, ' +
        '<code>propan-2-ol</code> in English; <code>acido butanoico</code> and ' +
        '<code>butanoic acid</code>.') + '</p></div>';

    apri(t('🌍 Lingua', '🌍 Language'), html);

    [].forEach.call(corpo().querySelectorAll('.bsiLG-lingua'), function (b) {
      b.onclick = function () {
        B.imposta(b.getAttribute('data-l'));
        globale.initLinguaSezione();     /* si ridisegna nella lingua nuova */
      };
    });
    var campo = document.getElementById('bsiLG-cerca');
    if (campo) {
      campo.oninput = function () {
        var q = campo.value.trim().toLowerCase();
        var visibili = 0;
        [].forEach.call(document.querySelectorAll('#bsiLG-elenco .bsiLG-lingua'), function (b2) {
          var ok = !q || (b2.getAttribute('data-cerca') || '').indexOf(q) !== -1;
          b2.style.display = ok ? '' : 'none';
          if (ok) visibili++;
        });
        var vuoto = document.getElementById('bsiLG-nessuna');
        if (vuoto) vuoto.style.display = visibili ? 'none' : 'block';
      };
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Pannello «Linguaggi delle molecole»
     ═════════════════════════════════════════════════════════════════════════ */

  var ESEMPI = [
    ['CCO', 'etanolo', 'ethanol'],
    ['CC(=O)Oc1ccccc1C(=O)O', 'aspirina', 'aspirin'],
    ['Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'caffeina', 'caffeine'],
    ['CC(C)C(CC)CCC', '3-etil-2-metilesano', '3-ethyl-2-methylhexane'],
    ['C[C@@H](N)C(=O)O', 'L-alanina', 'L-alanine'],
    ['OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O', 'glucosio', 'glucose']
  ];

  var tabCorrente = 'conv';

  function pannelloMolingue() {
    var html = '<div class="bsiLG-tabs">' +
      '<button class="bsiLG-tab" data-t="conv">' + t('🔄 Convertitore', '🔄 Converter') + '</button>' +
      '<button class="bsiLG-tab" data-t="nome">' + t('🏷️ Nome', '🏷️ Name') + '</button>' +
      '<button class="bsiLG-tab" data-t="guida">' + t('📖 Guida ai linguaggi', '📖 Language guide') + '</button>' +
      '<button class="bsiLG-tab" data-t="quale">' + t('🧭 Quale usare', '🧭 Which to use') + '</button>' +
      '</div>' +
      '<div class="bsiLG-tab-cnt" id="bsiLG-conv">' + vistaConvertitore() + '</div>' +
      '<div class="bsiLG-tab-cnt" id="bsiLG-nome">' + vistaNome() + '</div>' +
      '<div class="bsiLG-tab-cnt" id="bsiLG-guida">' + vistaGuida() + '</div>' +
      '<div class="bsiLG-tab-cnt" id="bsiLG-quale">' + vistaQuale() + '</div>';
    apri(t('🔤 Linguaggi delle molecole', '🔤 Molecular languages'), html);
    agganciaTab();
    agganciaConvertitore();
    agganciaNome();
  }

  function agganciaTab() {
    [].forEach.call(corpo().querySelectorAll('.bsiLG-tab'), function (b) {
      b.onclick = function () { mostraTab(b.getAttribute('data-t')); };
    });
    mostraTab(tabCorrente);
  }
  function mostraTab(id) {
    tabCorrente = id;
    [].forEach.call(document.querySelectorAll('.bsiLG-tab'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-t') === id);
    });
    ['conv', 'nome', 'guida', 'quale'].forEach(function (k) {
      var el = document.getElementById('bsiLG-' + k);
      if (el) el.classList.toggle('on', k === id);
    });
  }

  /* ── 2.1 convertitore ─────────────────────────────────────────────────── */
  function vistaConvertitore() {
    var h = '<div class="bsiLG-card"><h4>' +
      t('Scrivi la molecola come sai', 'Write the molecule however you know it') + '</h4><p>' +
      t('SMILES, molfile, CXSMILES o SMARTS. La lingua dell’ingresso viene ' +
        '<b>riconosciuta</b>, non chiesta.',
        'SMILES, molfile, CXSMILES or SMARTS. The input language is <b>recognised</b>, not asked for.') +
      '</p>' +
      '<textarea class="bsiLG-in" id="bsiLG-src" rows="3" spellcheck="false" ' +
      'aria-label="' + t('Struttura da convertire', 'Structure to convert') +
      '" placeholder="CC(=O)Oc1ccccc1C(=O)O"></textarea>' +
      '<div class="bsiLG-ex">';
    ESEMPI.forEach(function (e) {
      h += '<button class="bsiLG-exb" data-smi="' + esc(e[0]) + '">' +
           esc(L() === 'en' ? e[2] : e[1]) + '</button>';
    });
    h += '</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">' +
      '<button class="bsiLG-btn" id="bsiLG-go">' + t('Converti', 'Convert') + '</button>' +
      '<button class="bsiLG-btn2" id="bsiLG-clr">' + t('Pulisci', 'Clear') + '</button>' +
      '</div></div><div id="bsiLG-out"></div>';
    return h;
  }

  var ETICHETTE = {
    smiles:       ['SMILES canonico', 'Canonical SMILES'],
    molfileAromatico: ['molfile aromatico', 'aromatic molfile'],
    cxsmiles:     ['CXSMILES', 'CXSMILES'],
    smarts:       ['SMARTS', 'SMARTS'],
    cxsmarts:     ['CXSMARTS', 'CXSMARTS'],
    xyz:          ['XYZ', 'XYZ'],
    pdb:          ['PDB', 'PDB'],
    stereo:       ['stereochimica (CIP)', 'stereochemistry (CIP)'],
    inchi:        ['InChI', 'InChI'],
    chiaveInchi:  ['chiave InChI', 'InChI key'],
    formula:      ['formula', 'formula'],
    molfile:      ['molfile V2000', 'molfile V2000'],
    molfileV3000: ['molfile V3000', 'molfile V3000'],
    json:         ['JSON RDKit', 'RDKit JSON']
  };
  var ORDINE = ['formula', 'smiles', 'cxsmiles', 'inchi', 'chiaveInchi', 'stereo',
                'smarts', 'cxsmarts', 'molfile', 'molfileAromatico', 'molfileV3000',
                'xyz', 'pdb', 'json'];

  function agganciaConvertitore() {
    var src = document.getElementById('bsiLG-src');
    var out = document.getElementById('bsiLG-out');
    if (!src) return;
    [].forEach.call(document.querySelectorAll('.bsiLG-exb'), function (b) {
      b.onclick = function () { src.value = b.getAttribute('data-smi'); converti(); };
    });
    document.getElementById('bsiLG-clr').onclick = function () {
      src.value = ''; out.innerHTML = '';
    };
    document.getElementById('bsiLG-go').onclick = converti;
    src.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); converti(); }
    });

    function converti() {
      var testo = src.value;
      if (!testo.trim()) { out.innerHTML = ''; return; }
      if (!globale.BSIMolLingue) {
        out.innerHTML = '<div class="bsiLG-avv">' +
          t('Il motore dei linguaggi non è caricato.', 'The language engine is not loaded.') +
          '</div>';
        return;
      }
      out.innerHTML = '<div class="bsiLG-card"><p>' + t('⏳ Conversione…', '⏳ Converting…') +
                      '</p></div>';
      globale.BSIMolLingue.converti(testo, { lingua: L() }, function (r) {
        out.innerHTML = rendiEsito(r);
        agganciaCopia();
      });
    }
  }

  function agganciaCopia() {
    [].forEach.call(document.querySelectorAll('.bsiLG-cp'), function (b) {
      b.onclick = function () {
        var v = b.getAttribute('data-v') || '';
        var fatto = function () {
          var vecchio = b.textContent;
          b.textContent = t('copiato', 'copied');
          setTimeout(function () { b.textContent = vecchio; }, 1200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(v).then(fatto, function () {});
        } else {
          var ta = document.createElement('textarea');
          ta.value = v; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); fatto(); } catch (e) {}
          ta.remove();
        }
      };
    });
  }

  function rendiEsito(r) {
    var h = '';
    var NOMI_LINGUA = { smiles: 'SMILES', molfile: 'molfile', cxsmiles: 'CXSMILES',
                        smarts: 'SMARTS', inchi: 'InChI', chiave: t('chiave InChI', 'InChI key'),
                        nome: t('nome', 'name') };
    if (r.errore) {
      h += '<div class="bsiLG-avv"><b>' + t('Non si converte.', 'Not convertible.') + '</b> ' +
           esc(r.errore) + (r.suggerimento ? '<br>' + esc(r.suggerimento) : '') + '</div>';
      if (r.linguaRiconosciuta) {
        h += '<div class="bsiLG-card"><p>' + t('Riconosciuto come', 'Recognised as') +
             ': <b>' + esc(NOMI_LINGUA[r.linguaRiconosciuta] || r.linguaRiconosciuta) +
             '</b></p></div>';
      }
      return h;
    }

    h += '<div class="bsiLG-card"><h4>' + t('Riconosciuto come', 'Recognised as') + ' ' +
         esc(NOMI_LINGUA[r.linguaRiconosciuta] || r.linguaRiconosciuta) + '</h4>';
    if (r.massa != null) {
      h += '<p>' + t('massa media', 'average mass') + ' <b>' + (+r.massa).toFixed(3) +
           '</b> g/mol · ' + t('massa esatta', 'exact mass') + ' <b>' +
           (+r.massaEsatta).toFixed(5) + '</b></p>';
    }
    h += '</div>';

    h += '<div class="bsiLG-card"><h4>' + t('La stessa molecola, in ogni linguaggio',
                                            'The same molecule, in every language') + '</h4>';
    ORDINE.forEach(function (k) {
      var v = r.uscite[k];
      if (v == null || v === '') return;
      var breve = (k === 'molfile' || k === 'molfileV3000' || k === 'json');
      var mostra = breve ? (String(v).split('\n').slice(0, 4).join('\n') + '\n…') : v;
      var et = ETICHETTE[k] ? ETICHETTE[k][L() === 'en' ? 1 : 0] : k;
      h += '<div class="bsiLG-riga"><div class="bsiLG-et">' + esc(et) + '</div>' +
           '<div class="bsiLG-val" style="' + (breve ? 'white-space:pre-wrap;font-size:11px' : '') +
           '">' + esc(mostra) + '</div>' +
           '<button class="bsiLG-cp" data-v="' + esc(v) + '">' + t('copia', 'copy') +
           '</button></div>';
    });
    h += '</div>';

    /* il nome, con la provenienza */
    h += '<div class="bsiLG-card"><h4>' + t('Il nome', 'The name') + '</h4>';
    var nl = r.nome && r.nome.locale;
    if (nl && nl.nome) {
      h += '<div class="bsiLG-riga"><div class="bsiLG-et">' +
           t('nominatore locale', 'local namer') + '</div><div class="bsiLG-val">' +
           '<b style="font-family:inherit;font-size:13.5px">' + esc(nl.nome) + '</b>' +
           '<div class="bsiLG-no" style="margin-top:3px">' + esc(nl.avviso) + '</div></div>' +
           '<button class="bsiLG-cp" data-v="' + esc(nl.nome) + '">' + t('copia', 'copy') +
           '</button></div>';
    } else if (nl) {
      h += '<div class="bsiLG-riga"><div class="bsiLG-et">' +
           t('nominatore locale', 'local namer') + '</div><div class="bsiLG-no">' +
           t('non lo nomina: ', 'does not name it: ') + esc(nl.perche) + '</div><div></div></div>';
    }
    if (r.nome && r.nome.archivio) {
      h += '<div class="bsiLG-riga"><div class="bsiLG-et">' +
           t('archivio dell’app', 'app archive') + '</div><div class="bsiLG-val">' +
           '<b style="font-family:inherit;font-size:13.5px">' + esc(r.nome.archivio) + '</b>' +
           '<div class="bsiLG-no" style="margin-top:3px">' +
           t('nome comune, non IUPAC', 'common name, not IUPAC') + '</div></div><div></div></div>';
    }
    h += '<div class="bsiLG-riga"><div class="bsiLG-et">PubChem</div>' +
         '<div class="bsiLG-val" id="bsiLG-pc"><span class="bsiLG-no">' +
         t('il nome IUPAC completo richiede la rete', 'the full IUPAC name needs the network') +
         '</span></div><button class="bsiLG-btn2" id="bsiLG-pcgo" data-smi="' +
         esc(r.uscite.smiles || '') + '">' + t('cerca', 'look up') + '</button></div>';
    h += '</div>';

    /* ciò che non si può fare */
    h += '<div class="bsiLG-card"><h4>' + t('Che cosa non si può fare, e perché',
                                            'What cannot be done, and why') + '</h4><ul>' +
      '<li><b>InChI ' + t('in ingresso', 'as input') + '</b> — ' +
      t('si genera ma questa build di RDKit non lo rilegge: <code>get_mol(InChI)</code> torna nullo.',
        'it is generated but this RDKit build does not read it back: <code>get_mol(InChI)</code> returns null.') +
      '</li><li><b>' + t('chiave InChI in ingresso', 'InChI key as input') + '</b> — ' +
      t('è un digest di 27 caratteri: dalla chiave non si risale alla struttura, ' +
        'per costruzione e non per limite del programma.',
        'it is a 27-character digest: you cannot get the structure back from the key, ' +
        'by construction and not for want of a better program.') +
      '</li><li><b>' + t('SMILES di Kekulé', 'Kekulé SMILES') + '</b> — ' +
      t('questa build non lo emette: con <code>kekuleSmiles</code>, <code>kekulize</code> o ' +
        'entrambe torna sempre la forma aromatica. Il <b>molfile</b>, però, è già scritto in ' +
        'forma di Kekulé — sul benzene gli ordini di legame sono 2,1,2,1,2,1.',
        'this build does not emit one: with <code>kekuleSmiles</code>, <code>kekulize</code> ' +
        'or both it always returns the aromatic form. The <b>molfile</b>, however, is already ' +
        'written in Kekulé form — on benzene the bond orders are 2,1,2,1,2,1.') +
      '</li><li><b>' + t('nome → struttura', 'name → structure') + '</b> — ' +
      t('serve un analizzatore di nomi (OPSIN e simili), che qui non c’è: si usa la ' +
        'scheda «Nome» con la rete.',
        'that needs a name parser (OPSIN and the like), which is not here: use the "Name" ' +
        'tab with the network.') + '</li></ul></div>';
    setTimeout(agganciaPubChem, 0);
    return h;
  }

  function agganciaPubChem() {
    var b = document.getElementById('bsiLG-pcgo');
    if (!b) return;
    b.onclick = function () {
      var smi = b.getAttribute('data-smi');
      var cella = document.getElementById('bsiLG-pc');
      if (!smi) { cella.innerHTML = '<span class="bsiLG-no">—</span>'; return; }
      cella.innerHTML = '<span class="bsiLG-no">' + t('⏳ interrogo PubChem…', '⏳ asking PubChem…') +
                        '</span>';
      globale.BSIMolLingue.nomeDaPubChem(smi, function (r, err) {
        if (!r || !r.nome) {
          cella.innerHTML = '<span class="bsiLG-no">' +
            t('non disponibile', 'not available') + (err ? ' (' + esc(err) + ')' : '') +
            '</span>';
          return;
        }
        cella.innerHTML = '<b style="font-family:inherit;font-size:13.5px">' + esc(r.nome) +
          '</b><div class="bsiLG-no" style="margin-top:3px">' +
          t('nome IUPAC secondo PubChem', 'IUPAC name according to PubChem') + '</div>';
      });
    };
  }

  /* ── 2.2 nome → struttura ─────────────────────────────────────────────── */
  function vistaNome() {
    return '<div class="bsiLG-card"><h4>' + t('Da un nome alla struttura',
                                              'From a name to the structure') + '</h4><p>' +
      t('Un nome non si converte con un calcolo sul grafo: o sta in un archivio, o si chiede ' +
        'a chi lo ha. Qui si cerca prima fra le molecole che l’app ha già in memoria, ' +
        'poi su PubChem se c’è la rete.',
        'A name is not converted by a computation on the graph: either it is in an archive, or ' +
        'you ask someone who has it. Here we first search the molecules the app already holds, ' +
        'then PubChem if the network is there.') + '</p>' +
      '<input class="bsiLG-in" id="bsiLG-nm" spellcheck="false" aria-label="' +
      t('Nome della molecola', 'Molecule name') + '" placeholder="' +
      t('aspirina, caffeina, propan-2-olo…', 'aspirin, caffeine, propan-2-ol…') + '">' +
      '<div style="display:flex;gap:8px;margin-top:10px">' +
      '<button class="bsiLG-btn" id="bsiLG-nmgo">' + t('Cerca', 'Search') + '</button>' +
      '</div></div><div id="bsiLG-nmout"></div>';
  }

  function agganciaNome() {
    var inp = document.getElementById('bsiLG-nm');
    if (!inp) return;
    var out = document.getElementById('bsiLG-nmout');
    function cerca() {
      var q = inp.value.trim();
      if (!q) { out.innerHTML = ''; return; }
      out.innerHTML = '<div class="bsiLG-card"><p>' + t('⏳ cerco…', '⏳ searching…') + '</p></div>';
      /* 1 · l'archivio locale, per nome */
      var locale = cercaNelleBancheDati(q);
      var h = '';
      if (locale) {
        h += '<div class="bsiLG-ok"><b>' + esc(locale.nome) + '</b> — ' +
             t('trovata nell’archivio dell’app', 'found in the app archive') +
             '<div class="bsiLG-val" style="margin-top:6px">' + esc(locale.smiles) + '</div></div>';
      }
      out.innerHTML = h + '<div class="bsiLG-card"><p>' +
        t('⏳ interrogo PubChem…', '⏳ asking PubChem…') + '</p></div>';
      globale.BSIMolLingue.strutturaDaNome(q, function (r, err) {
        var h2 = h;
        if (r && r.smiles) {
          h2 += '<div class="bsiLG-card"><h4>PubChem</h4>' +
            '<div class="bsiLG-riga"><div class="bsiLG-et">SMILES</div>' +
            '<div class="bsiLG-val">' + esc(r.smiles) + '</div>' +
            '<button class="bsiLG-cp" data-v="' + esc(r.smiles) + '">' + t('copia', 'copy') +
            '</button></div>' +
            (r.nomeIupac ? '<div class="bsiLG-riga"><div class="bsiLG-et">' +
              t('nome IUPAC', 'IUPAC name') + '</div><div class="bsiLG-val">' +
              esc(r.nomeIupac) + '</div><div></div></div>' : '') +
            '<div style="margin-top:8px"><button class="bsiLG-btn2" id="bsiLG-porta" data-smi="' +
            esc(r.smiles) + '">' + t('porta nel convertitore', 'send to the converter') +
            '</button></div></div>';
        } else {
          h2 += '<div class="bsiLG-avv">' + t('PubChem non risponde o non conosce questo nome',
            'PubChem does not answer or does not know this name') +
            (err ? ' (' + esc(err) + ')' : '') + '.' +
            (locale ? '' : '<br>' + t('E non è fra le molecole che l’app ha in memoria.',
              'And it is not among the molecules the app holds.')) + '</div>';
        }
        out.innerHTML = h2;
        agganciaCopia();
        var p = document.getElementById('bsiLG-porta');
        if (p) p.onclick = function () {
          mostraTab('conv');
          var s = document.getElementById('bsiLG-src');
          if (s) { s.value = p.getAttribute('data-smi'); document.getElementById('bsiLG-go').click(); }
        };
      });
    }
    document.getElementById('bsiLG-nmgo').onclick = cerca;
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') cerca(); });
  }

  function cercaNelleBancheDati(q) {
    var ql = q.toLowerCase();
    var fonti = [[globale.FARM_DATA, 'name', 'smi'], [globale.AA_DATA, 'name', 'smi'],
                 [globale.MOLS, 'n', 'smi'], [globale.BIOMOL, 'name', 'smi']];
    for (var i = 0; i < fonti.length; i++) {
      var ins = fonti[i][0];
      if (!Array.isArray(ins)) continue;
      for (var j = 0; j < ins.length; j++) {
        var x = ins[j];
        if (!x) continue;
        var nm = x[fonti[i][1]], smi = x[fonti[i][2]];
        if (!nm || !smi) continue;
        if (String(nm).toLowerCase() === ql) return { nome: nm, smiles: smi };
      }
    }
    return null;
  }

  /* ── 2.3 la guida ─────────────────────────────────────────────────────── */
  function vistaGuida() {
    return (L() === 'en') ? guidaEN() : guidaIT();
  }

  function guidaIT() {
    return '' +
'<div class="bsiLG-card"><h4>SMILES — scrivere una molecola su una riga</h4>' +
'<p>SMILES si legge come si percorre la molecola: si parte da un atomo e si cammina. ' +
'Gli idrogeni non si scrivono: si deducono dalla valenza. <code>CCO</code> è etanolo, ' +
'tre atomi scritti e sei idrogeni sottintesi.</p>' +
'<table class="bsiLG-tbl">' +
'<tr><th>Si scrive</th><th>Vuol dire</th><th>Esempio</th></tr>' +
'<tr><td><code>C N O S P F Cl Br I</code></td><td>atomi del sottoinsieme organico, ' +
'idrogeni impliciti</td><td><code>CCO</code> etanolo</td></tr>' +
'<tr><td><code>c n o s</code> minuscole</td><td>atomo <b>aromatico</b></td>' +
'<td><code>c1ccccc1</code> benzene</td></tr>' +
'<tr><td><code>[…]</code></td><td>atomo con qualcosa da dichiarare: carica, isotopo, ' +
'idrogeni espliciti</td><td><code>[Na+]</code>, <code>[13C]</code>, <code>[nH]</code></td></tr>' +
'<tr><td><code>-</code> <code>=</code> <code>#</code></td><td>legame singolo (implicito), ' +
'doppio, triplo</td><td><code>C=C</code> etene, <code>C#N</code> nitrile</td></tr>' +
'<tr><td><code>( )</code></td><td>ramo: si apre, si scrive il ramo, si chiude e si torna ' +
'dove si era</td><td><code>CC(C)C</code> 2-metilpropano</td></tr>' +
'<tr><td>cifre</td><td>chiusura d’anello: la stessa cifra due volte sono i due capi ' +
'dello stesso legame</td><td><code>C1CCCCC1</code> cicloesano</td></tr>' +
'<tr><td><code>.</code></td><td>due pezzi non legati: sali, solvati, complessi</td>' +
'<td><code>[Na+].[Cl-]</code></td></tr>' +
'<tr><td><code>/</code> <code>\\</code></td><td>geometria attorno a un doppio legame ' +
'(<i>cis/trans</i>, E/Z)</td><td><code>C/C=C/C</code> è <i>E</i>; ' +
'<code>C/C=C\\C</code> è <i>Z</i></td></tr>' +
'<tr><td><code>@</code> <code>@@</code></td><td>chiralità: guardando dal primo vicino, ' +
'gli altri in ordine antiorario (<code>@</code>) oppure orario (<code>@@</code>)</td>' +
'<td><code>C[C@@H](N)C(=O)O</code> L-alanina</td></tr>' +
'<tr><td><code>%10</code> e oltre</td><td>anelli numerati oltre il 9</td>' +
'<td><code>C%10CCCCC%10</code></td></tr></table>' +
'<p><b>Tre errori che fanno perdere tempo.</b> Un anello aperto e non chiuso: la cifra ' +
'deve comparire <i>due</i> volte. Un anello aromatico scritto in minuscolo ma non ' +
'chiudibile: <code>c1ccccc1</code> funziona, <code>c1cccc1</code> no, perché cinque ' +
'carboni aromatici neutri non esistono. E le valenze: <code>C(C)(C)(C)(C)C</code> non è ' +
'una molecola, è un carbonio con cinque legami.</p></div>' +

'<div class="bsiLG-card"><h4>Il nome IUPAC — come si costruisce</h4>' +
'<p>Un nome IUPAC non è un’etichetta: è una <b>descrizione</b> che si legge da destra ' +
'verso sinistra. <code>3-etil-2-metilesano</code> dice: lo scheletro è a sei carboni ' +
'(<i>es-</i>), tutti semplici (<i>-ano</i>), e porta un etile al terzo e un metile al ' +
'secondo.</p>' +
'<p>Si compone in quattro mosse, in questo ordine:</p><ul>' +
'<li><b>1 · la catena principale.</b> La più lunga che contenga il gruppo più importante. ' +
'Da essa viene la radice: met(1) et(2) prop(3) but(4) pent(5) es(6) ept(7) ott(8) non(9) ' +
'dec(10).</li>' +
'<li><b>2 · il suffisso</b>, cioè il gruppo principale: ' +
'<code>-olo</code> alcol, <code>-ale</code> aldeide, <code>-one</code> chetone, ' +
'<code>acido …oico</code> acido carbossilico, <code>-ammina</code> ammina. ' +
'Le insaturazioni stanno nell’infisso: <code>-an-</code> nessuna, <code>-en-</code> ' +
'doppio, <code>-in-</code> triplo.</li>' +
'<li><b>3 · la numerazione.</b> Si numera dal capo che dà il numero più basso, in questo ' +
'ordine di priorità: al gruppo principale, poi alle insaturazioni, poi ai sostituenti; a ' +
'pari merito, il numero più basso va al sostituente primo in ordine alfabetico.</li>' +
'<li><b>4 · i prefissi</b>: i sostituenti, in ordine <b>alfabetico</b> (non di posizione), ' +
'ognuno col suo numero. <i>di-, tri-, tetra-</i> moltiplicano ma non contano per ' +
'l’alfabeto: <code>3-etil-2,2-dimetil…</code> — «etil» prima di «metil», e il «di» ' +
'si ignora.</li></ul>' +
'<p><b>Il locante si scrive solo se serve.</b> «cloroetano», non «1-cloroetano»: i due ' +
'carboni dell’etano sono equivalenti. «triclorometano», non «1,1,1-tricloro…». Ma ' +
'«propan-1-olo» e «propan-2-olo» sono due composti diversi, e lì il numero è obbligatorio.</p>' +
'<p><b>La stereochimica è un’altra cosa.</b> <i>R/S</i> ed <i>E/Z</i> si mettono fra ' +
'parentesi davanti: <code>(2S)-2-amminopropanoico</code>, <code>(2E)-but-2-ene</code>. Il ' +
'nominatore di questa app <b>non</b> li deduce e lo dichiara in ogni nome che produce.</p>' +
'<div class="bsiLG-avv"><b>Che cosa nomina il nominatore locale, esattamente.</b> ' +
'Molecole <b>aperte</b> (nessun anello), neutre, di soli C H O N F Cl Br I, con ' +
'<b>un solo tipo</b> di gruppo principale fra acido, aldeide, chetone, ammina primaria e ' +
'alcol (fino a tre), e sostituenti solo alogeni o catene alchiliche <b>non ramificate</b>. ' +
'Fuori da questa classe rifiuta e dice quale condizione è caduta, invece di tirare a ' +
'indovinare: un nome sbagliato è peggio di nessun nome. Per tutto il resto c’è la ' +
'scheda «Nome», che chiede a PubChem.</div></div>' +

'<div class="bsiLG-card"><h4>InChI — l’identificatore a strati</h4>' +
'<p>L’InChI non è fatto per essere letto da un umano, ma per essere <b>unico</b>: due ' +
'persone che partono dalla stessa molecola ottengono la stessa stringa, sempre. È diviso ' +
'in strati separati da <code>/</code>, e ogni strato dice una cosa sola:</p>' +
'<table class="bsiLG-tbl"><tr><th>Strato</th><th>Dice</th></tr>' +
'<tr><td><code>InChI=1S/</code></td><td>versione 1, <b>S</b> = standard</td></tr>' +
'<tr><td><code>C9H8O4</code></td><td>formula bruta</td></tr>' +
'<tr><td><code>/c…</code></td><td>come sono connessi gli atomi (lo scheletro)</td></tr>' +
'<tr><td><code>/h…</code></td><td>dove stanno gli idrogeni, e quali sono mobili</td></tr>' +
'<tr><td><code>/q…</code> <code>/p…</code></td><td>carica totale; protoni aggiunti o ' +
'toltiimpiegati</td></tr>' +
'<tr><td><code>/b…</code></td><td>geometria dei doppi legami (E/Z)</td></tr>' +
'<tr><td><code>/t… /m… /s…</code></td><td>centri stereogenici, parità, tipo di ' +
'stereochimica</td></tr>' +
'<tr><td><code>/i…</code></td><td>isotopi</td></tr></table>' +
'<p>Si vede all’opera sui due 2-buteni: identici in tutto tranne l’ultimo strato, ' +
'<code>/b4-3+</code> contro <code>/b4-3-</code>. È lì, e solo lì, che sta la differenza ' +
'fra <i>E</i> e <i>Z</i>.</p>' +
'<p><b>In questa app l’InChI è un’uscita, non un ingresso</b>: la build di RDKit ' +
'incorporata lo genera ma non lo rilegge. Non è un dettaglio nascosto — il convertitore lo ' +
'scrive fra le cose che non può fare.</p></div>' +

'<div class="bsiLG-card"><h4>Chiave InChI — 27 caratteri, e non si torna indietro</h4>' +
'<p><code>BSYNRYMUTXBXSQ-UHFFFAOYSA-N</code> è l’aspirina. La chiave è un ' +
'<b>digest</b> dell’InChI, fatto per essere cercabile: 14 caratteri per lo scheletro, ' +
'10 per gli altri strati (stereochimica, isotopi), 1 per la versione e la carica.</p>' +
'<p>Due molecole con lo stesso primo blocco sono la stessa struttura a meno di ' +
'stereochimica: i due 2-buteni sopra hanno lo stesso <code>IAQRGUVFOMOMEM</code> e secondo ' +
'blocco diverso. Il blocco si legge, quindi, ed è utile.</p>' +
'<p>Ma dalla chiave <b>non si risale alla molecola</b>: non è una cifratura da rompere, è ' +
'una funzione che butta via informazione. Chi offre un «convertitore da InChIKey a ' +
'struttura» in realtà fa una ricerca in un archivio — e se la molecola non è in archivio, ' +
'non c’è risposta.</p></div>' +

'<div class="bsiLG-card"><h4>SMARTS — non una molecola, una domanda</h4>' +
'<p>SMILES descrive <i>una</i> molecola; SMARTS descrive <i>un insieme</i> di molecole. È ' +
'il linguaggio con cui si cerca: «un carbonile legato a un aromatico», «un carbonio con tre ' +
'idrogeni in un anello a tre».</p>' +
'<table class="bsiLG-tbl"><tr><th>Si scrive</th><th>Significa</th></tr>' +
'<tr><td><code>[#6]</code></td><td>numero atomico 6, aromatico o no</td></tr>' +
'<tr><td><code>[C]</code> / <code>[c]</code></td><td>carbonio alifatico / aromatico</td></tr>' +
'<tr><td><code>[CX4]</code></td><td>carbonio con 4 connessioni</td></tr>' +
'<tr><td><code>[CH3]</code></td><td>carbonio con 3 idrogeni</td></tr>' +
'<tr><td><code>[r3]</code> <code>[R2]</code></td><td>in un anello a 3; in 2 anelli</td></tr>' +
'<tr><td><code>[!C]</code></td><td><b>non</b> carbonio alifatico</td></tr>' +
'<tr><td><code>[C,N]</code></td><td>carbonio <b>o</b> azoto (oppure)</td></tr>' +
'<tr><td><code>[C;R]</code></td><td>carbonio <b>e</b> in anello (e)</td></tr>' +
'<tr><td><code>~</code></td><td>un legame qualunque</td></tr>' +
'<tr><td><code>-!@</code></td><td>legame singolo <b>non</b> in anello — il taglio della ' +
'frammentazione</td></tr>' +
'<tr><td><code>[$(…)]</code></td><td>atomo che sta in un contesto più grande</td></tr></table>' +
'<p>Esempi che l’app usa davvero: <code>[CX3](=O)[OX2H1]</code> è un acido ' +
'carbossilico; <code>[CX4H3][Si]</code> è il metile del TMS, che vale zero ppm per ' +
'definizione; <code>[!$([#0]):1]-&amp;!@[!$([#0]):2]</code> è la regola con cui si taglia ' +
'un legame per fare frammenti.</p></div>' +

'<div class="bsiLG-card"><h4>Molfile e SDF — la tabella, con le coordinate</h4>' +
'<p>Dove SMILES è una riga, il molfile è una <b>tabella</b>: tre righe di intestazione, una ' +
'riga di conteggio, un blocco di atomi (uno per riga, con le coordinate x y z) e un blocco ' +
'di legami (atomo, atomo, ordine).</p>' +
'<p>Serve quando contano le <b>coordinate</b>: un disegno 2D da mostrare, una conformazione ' +
'3D, un file per un programma di modellazione. Un SDF è una pila di molfile separati da ' +
'<code>$$$$</code>, ognuno con i suoi campi dati — è il formato con cui si scambiano ' +
'raccolte di molecole.</p>' +
'<p><b>V2000 e V3000.</b> Il V2000 incolonna i numeri in campi a larghezza fissa, e sopra i ' +
'999 atomi non ci sta; il V3000 scrive etichette e non ha quel limite. Per una molecola ' +
'organica normale sono equivalenti, e il convertitore dà entrambi.</p>' +
'<p>In questa app il molfile è il formato <b>che fa il giro completo</b>: misurato su undici ' +
'molecole, taxolo con undici centri stereogenici compreso, torna sempre allo stesso SMILES ' +
'canonico di partenza.</p></div>' +

'<div class="bsiLG-card"><h4>CXSMILES e JSON — quando SMILES non basta</h4>' +
'<p><b>CXSMILES</b> è SMILES con un’appendice fra barre verticali, per le cose che ' +
'SMILES non sa dire: coordinate, atomi generici, gruppi R, frammenti marcati. Resta ' +
'leggibile da qualunque lettore SMILES, che semplicemente ignora la coda.</p>' +
'<p><b>JSON RDKit</b> (CommonChem) scrive atomi, legami e proprietà come dati strutturati. ' +
'Non è per gli umani: è per passare una molecola a un programma senza riparsare niente.</p></div>';
  }

  function guidaEN() {
    return '' +
'<div class="bsiLG-card"><h4>SMILES — a molecule on one line</h4>' +
'<p>SMILES reads the way you walk a molecule: start at an atom and move. Hydrogens are not ' +
'written — they follow from valence. <code>CCO</code> is ethanol: three atoms written, six ' +
'hydrogens implied.</p>' +
'<table class="bsiLG-tbl"><tr><th>You write</th><th>It means</th><th>Example</th></tr>' +
'<tr><td><code>C N O S P F Cl Br I</code></td><td>organic-subset atoms, implicit hydrogens</td>' +
'<td><code>CCO</code> ethanol</td></tr>' +
'<tr><td>lowercase <code>c n o s</code></td><td><b>aromatic</b> atom</td>' +
'<td><code>c1ccccc1</code> benzene</td></tr>' +
'<tr><td><code>[…]</code></td><td>an atom with something to declare: charge, isotope, ' +
'explicit hydrogens</td><td><code>[Na+]</code>, <code>[13C]</code>, <code>[nH]</code></td></tr>' +
'<tr><td><code>-</code> <code>=</code> <code>#</code></td><td>single (implicit), double, ' +
'triple bond</td><td><code>C=C</code> ethene, <code>C#N</code> nitrile</td></tr>' +
'<tr><td><code>( )</code></td><td>a branch: open it, write it, close it and you are back ' +
'where you were</td><td><code>CC(C)C</code> 2-methylpropane</td></tr>' +
'<tr><td>digits</td><td>ring closure: the same digit twice is the two ends of one bond</td>' +
'<td><code>C1CCCCC1</code> cyclohexane</td></tr>' +
'<tr><td><code>.</code></td><td>two unbonded parts: salts, solvates, complexes</td>' +
'<td><code>[Na+].[Cl-]</code></td></tr>' +
'<tr><td><code>/</code> <code>\\</code></td><td>geometry around a double bond ' +
'(<i>cis/trans</i>, E/Z)</td><td><code>C/C=C/C</code> is <i>E</i>; ' +
'<code>C/C=C\\C</code> is <i>Z</i></td></tr>' +
'<tr><td><code>@</code> <code>@@</code></td><td>chirality: looking from the first neighbour, ' +
'the rest anticlockwise (<code>@</code>) or clockwise (<code>@@</code>)</td>' +
'<td><code>C[C@@H](N)C(=O)O</code> L-alanine</td></tr>' +
'<tr><td><code>%10</code> and up</td><td>ring numbers beyond 9</td>' +
'<td><code>C%10CCCCC%10</code></td></tr></table>' +
'<p><b>Three mistakes that cost time.</b> A ring opened and never closed: the digit must ' +
'appear <i>twice</i>. An aromatic ring written lowercase that cannot close: ' +
'<code>c1ccccc1</code> works, <code>c1cccc1</code> does not, because five neutral aromatic ' +
'carbons do not exist. And valence: <code>C(C)(C)(C)(C)C</code> is not a molecule, it is a ' +
'carbon with five bonds.</p></div>' +

'<div class="bsiLG-card"><h4>The IUPAC name — how it is built</h4>' +
'<p>An IUPAC name is not a label, it is a <b>description</b>, and it reads from right to ' +
'left. <code>3-ethyl-2-methylhexane</code> says: the skeleton has six carbons ' +
'(<i>hex-</i>), all single (<i>-ane</i>), with an ethyl at three and a methyl at two.</p>' +
'<p>It is assembled in four moves, in this order:</p><ul>' +
'<li><b>1 · the parent chain.</b> The longest one containing the most senior group. It gives ' +
'the stem: meth(1) eth(2) prop(3) but(4) pent(5) hex(6) hept(7) oct(8) non(9) dec(10).</li>' +
'<li><b>2 · the suffix</b>, i.e. the principal group: <code>-ol</code> alcohol, ' +
'<code>-al</code> aldehyde, <code>-one</code> ketone, <code>…oic acid</code> carboxylic ' +
'acid, <code>-amine</code> amine. Unsaturation lives in the infix: <code>-an-</code> none, ' +
'<code>-en-</code> double, <code>-yn-</code> triple.</li>' +
'<li><b>3 · the numbering.</b> Number from the end that gives the lowest locant, in this ' +
'order of priority: to the principal group, then to unsaturations, then to substituents; ' +
'on a tie, the lowest number goes to the substituent first in alphabetical order.</li>' +
'<li><b>4 · the prefixes</b>: substituents in <b>alphabetical</b> order (not by position), ' +
'each with its locant. <i>di-, tri-, tetra-</i> multiply but do not count for the alphabet: ' +
'<code>3-ethyl-2,2-dimethyl…</code> — "ethyl" before "methyl", and the "di" is ignored.</li>' +
'</ul>' +
'<p><b>A locant is written only when it is needed.</b> "chloroethane", not ' +
'"1-chloroethane": ethane’s two carbons are equivalent. "trichloromethane", not ' +
'"1,1,1-trichloro…". But "propan-1-ol" and "propan-2-ol" are different compounds, and ' +
'there the number is compulsory.</p>' +
'<p><b>Stereochemistry is a separate matter.</b> <i>R/S</i> and <i>E/Z</i> go in ' +
'parentheses in front: <code>(2S)-2-aminopropanoic acid</code>, ' +
'<code>(2E)-but-2-ene</code>. This app’s namer does <b>not</b> derive them, and says ' +
'so on every name it produces.</p>' +
'<div class="bsiLG-avv"><b>Exactly what the local namer names.</b> <b>Acyclic</b> molecules ' +
'(no rings), neutral, made of C H O N F Cl Br I only, with <b>one kind</b> of principal ' +
'group among acid, aldehyde, ketone, primary amine and alcohol (up to three), and ' +
'substituents that are halogens or <b>unbranched</b> alkyl chains only. Outside that class ' +
'it refuses and says which condition failed, instead of guessing: a wrong name is worse ' +
'than no name. For everything else there is the "Name" tab, which asks PubChem.</div></div>' +

'<div class="bsiLG-card"><h4>InChI — the layered identifier</h4>' +
'<p>InChI is not meant to be read by a human but to be <b>unique</b>: two people starting ' +
'from the same molecule get the same string, always. It is split into layers separated by ' +
'<code>/</code>, each saying one thing:</p>' +
'<table class="bsiLG-tbl"><tr><th>Layer</th><th>Says</th></tr>' +
'<tr><td><code>InChI=1S/</code></td><td>version 1, <b>S</b> = standard</td></tr>' +
'<tr><td><code>C9H8O4</code></td><td>molecular formula</td></tr>' +
'<tr><td><code>/c…</code></td><td>how the atoms are connected (the skeleton)</td></tr>' +
'<tr><td><code>/h…</code></td><td>where the hydrogens are, and which are mobile</td></tr>' +
'<tr><td><code>/q…</code> <code>/p…</code></td><td>total charge; protons added or ' +
'removed</td></tr>' +
'<tr><td><code>/b…</code></td><td>double-bond geometry (E/Z)</td></tr>' +
'<tr><td><code>/t… /m… /s…</code></td><td>stereocentres, parity, kind of ' +
'stereochemistry</td></tr>' +
'<tr><td><code>/i…</code></td><td>isotopes</td></tr></table>' +
'<p>You can see it at work on the two 2-butenes: identical in everything but the last ' +
'layer, <code>/b4-3+</code> against <code>/b4-3-</code>. That, and only that, is where ' +
'<i>E</i> and <i>Z</i> differ.</p>' +
'<p><b>In this app InChI is an output, not an input</b>: the embedded RDKit build generates ' +
'it but does not read it back. That is not hidden — the converter lists it among the things ' +
'it cannot do.</p></div>' +

'<div class="bsiLG-card"><h4>InChI key — 27 characters, and no way back</h4>' +
'<p><code>BSYNRYMUTXBXSQ-UHFFFAOYSA-N</code> is aspirin. The key is a <b>digest</b> of the ' +
'InChI, made to be searchable: 14 characters for the skeleton, 10 for the other layers ' +
'(stereochemistry, isotopes), 1 for version and charge.</p>' +
'<p>Two molecules sharing the first block are the same structure up to stereochemistry: the ' +
'two 2-butenes above share <code>IAQRGUVFOMOMEM</code> and differ in the second block. So ' +
'the block does carry meaning, and it is useful.</p>' +
'<p>But from the key you <b>cannot</b> get the molecule back: it is not a cipher to break, ' +
'it is a function that throws information away. Anyone offering an "InChIKey to structure ' +
'converter" is really doing a lookup in an archive — and if the molecule is not in the ' +
'archive, there is no answer.</p></div>' +

'<div class="bsiLG-card"><h4>SMARTS — not a molecule, a question</h4>' +
'<p>SMILES describes <i>one</i> molecule; SMARTS describes a <i>set</i> of them. It is the ' +
'language you search with: "a carbonyl bonded to an aromatic", "a carbon with three ' +
'hydrogens in a three-membered ring".</p>' +
'<table class="bsiLG-tbl"><tr><th>You write</th><th>It means</th></tr>' +
'<tr><td><code>[#6]</code></td><td>atomic number 6, aromatic or not</td></tr>' +
'<tr><td><code>[C]</code> / <code>[c]</code></td><td>aliphatic / aromatic carbon</td></tr>' +
'<tr><td><code>[CX4]</code></td><td>carbon with 4 connections</td></tr>' +
'<tr><td><code>[CH3]</code></td><td>carbon with 3 hydrogens</td></tr>' +
'<tr><td><code>[r3]</code> <code>[R2]</code></td><td>in a 3-ring; in 2 rings</td></tr>' +
'<tr><td><code>[!C]</code></td><td><b>not</b> an aliphatic carbon</td></tr>' +
'<tr><td><code>[C,N]</code></td><td>carbon <b>or</b> nitrogen</td></tr>' +
'<tr><td><code>[C;R]</code></td><td>carbon <b>and</b> in a ring</td></tr>' +
'<tr><td><code>~</code></td><td>any bond</td></tr>' +
'<tr><td><code>-!@</code></td><td>single bond <b>not</b> in a ring — the fragmentation ' +
'cut</td></tr>' +
'<tr><td><code>[$(…)]</code></td><td>an atom in a larger context</td></tr></table>' +
'<p>Patterns this app actually uses: <code>[CX3](=O)[OX2H1]</code> is a carboxylic acid; ' +
'<code>[CX4H3][Si]</code> is the TMS methyl, zero ppm by definition; ' +
'<code>[!$([#0]):1]-&amp;!@[!$([#0]):2]</code> is the rule that cuts a bond to make ' +
'fragments.</p></div>' +

'<div class="bsiLG-card"><h4>Molfile and SDF — the table, with coordinates</h4>' +
'<p>Where SMILES is a line, a molfile is a <b>table</b>: three header lines, a counts line, ' +
'an atom block (one per line, with x y z) and a bond block (atom, atom, order).</p>' +
'<p>You need it when <b>coordinates</b> matter: a 2D drawing to show, a 3D conformation, a ' +
'file for a modelling program. An SDF is a stack of molfiles separated by ' +
'<code>$$$$</code>, each with its data fields — the format collections travel in.</p>' +
'<p><b>V2000 and V3000.</b> V2000 packs numbers into fixed-width fields and cannot go past ' +
'999 atoms; V3000 writes labels and has no such limit. For an ordinary organic molecule ' +
'they are equivalent, and the converter gives both.</p>' +
'<p>In this app the molfile is the format that <b>round-trips</b>: measured on eleven ' +
'molecules, taxol with eleven stereocentres included, it always returns the canonical ' +
'SMILES it started from.</p></div>' +

'<div class="bsiLG-card"><h4>CXSMILES and JSON — when SMILES is not enough</h4>' +
'<p><b>CXSMILES</b> is SMILES with an appendix between vertical bars, for what SMILES ' +
'cannot say: coordinates, generic atoms, R groups, labelled fragments. Any SMILES reader ' +
'still reads it, simply ignoring the tail.</p>' +
'<p><b>RDKit JSON</b> (CommonChem) writes atoms, bonds and properties as structured data. ' +
'It is not for humans: it is for handing a molecule to a program without re-parsing ' +
'anything.</p></div>';
  }

  /* ── 2.4 quale usare ─────────────────────────────────────────────────── */
  function vistaQuale() {
    var righe = [
      ['SMILES', t('scrivere a mano, incollare, cercare', 'typing, pasting, searching'),
       t('compatto e leggibile; la forma canonica è confrontabile',
         'compact and readable; the canonical form is comparable'),
       t('non porta coordinate', 'carries no coordinates')],
      ['InChI', t('dire «è la stessa molecola» fra archivi diversi',
                  'saying "same molecule" across different archives'),
       t('unico e riproducibile, a strati', 'unique and reproducible, layered'),
       t('illeggibile a occhio; qui solo in uscita', 'unreadable by eye; output only here')],
      [t('chiave InChI', 'InChI key'), t('cercare, indicizzare, confrontare',
                                         'searching, indexing, comparing'),
       t('27 caratteri, ottima come chiave di tabella', '27 characters, an excellent table key'),
       t('non invertibile: non è una struttura', 'not invertible: it is not a structure')],
      ['SMARTS', t('cercare un sottostruttura, filtrare, tagliare',
                   'substructure search, filtering, cutting'),
       t('esprime insiemi, non singole molecole', 'expresses sets, not single molecules'),
       t('non è una molecola: non ha massa né formula',
         'it is not a molecule: no mass, no formula')],
      [t('molfile / SDF', 'molfile / SDF'), t('coordinate, disegni, scambio di raccolte',
                                              'coordinates, drawings, exchanging collections'),
       t('porta la geometria; fa il giro completo', 'carries geometry; round-trips'),
       t('verboso, molte righe per poche informazioni',
         'verbose: many lines for little information')],
      [t('XYZ', 'XYZ'), t('passare coordinate a un programma di calcolo',
                          'handing coordinates to a computational program'),
       t('tre numeri per atomo, nient\u2019altro: lo legge chiunque',
         'three numbers per atom and nothing else: everything reads it'),
       t('nessun legame: la connettività va dedotta',
         'no bonds: connectivity must be inferred')],
      [t('PDB', 'PDB'), t('aprire la molecola in un visualizzatore di strutture',
                          'opening the molecule in a structure viewer'),
       t('standard per le strutture; porta i legami nei CONECT',
         'the standard for structures; carries bonds in CONECT'),
       t('qui con un solo residuo UNL e nomi atomici generati',
         'here with a single UNL residue and generated atom names')],
      [t('nome IUPAC', 'IUPAC name'), t('parlare e scrivere fra persone',
                                        'speaking and writing between people'),
       t('descrive la struttura in parole', 'describes the structure in words'),
       t('ambiguo se abbreviato; difficile da generare a macchina',
         'ambiguous when shortened; hard to generate by machine')]
    ];
    var h = '<div class="bsiLG-card"><h4>' +
      t('Otto linguaggi, otto mestieri', 'Eight languages, eight jobs') + '</h4><p>' +
      t('Non esiste il linguaggio migliore: esiste quello giusto per ciò che devi fare.',
        'There is no best language: there is the right one for what you are doing.') +
      '</p><table class="bsiLG-tbl"><tr><th>' + t('Linguaggio', 'Language') + '</th><th>' +
      t('Quando', 'When') + '</th><th>' + t('Forza', 'Strength') + '</th><th>' +
      t('Limite', 'Limit') + '</th></tr>';
    righe.forEach(function (r) {
      h += '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' +
           esc(r[2]) + '</td><td>' + esc(r[3]) + '</td></tr>';
    });
    h += '</table></div>';
    h += '<div class="bsiLG-card"><h4>' + t('Una regola pratica', 'One practical rule') +
      '</h4><p>' + t('Se devi <b>comunicare con una persona</b>, usa il nome. Se devi ' +
      '<b>comunicare con un programma</b>, usa SMILES. Se devi <b>sapere se due cose sono la ' +
      'stessa cosa</b>, usa la chiave InChI. Se devi <b>disegnare</b>, usa il molfile. Se devi ' +
      '<b>cercare</b>, usa SMARTS.',
      'If you must <b>talk to a person</b>, use the name. If you must <b>talk to a ' +
      'program</b>, use SMILES. If you must <b>know whether two things are the same</b>, use ' +
      'the InChI key. If you must <b>draw</b>, use the molfile. If you must <b>search</b>, ' +
      'use SMARTS.') + '</p><p>' +
      t('E una <b>reazione</b> non è una molecola: <code>reagenti&gt;&gt;prodotti</code> viene ' +
        'riconosciuta e scomposta, perché convertirla come se fosse una cosa sola darebbe un ' +
        'risultato che sembra giusto e non lo è.',
        'And a <b>reaction</b> is not a molecule: <code>reactants&gt;&gt;products</code> is ' +
        'recognised and split, because converting it as one thing would give a result that ' +
        'looks right and is not.') + '</p></div>';
    return h;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · Le voci nel menu ✨
     ═════════════════════════════════════════════════════════════════════════ */
  function aggiungiVoci() {
    var menu = document.getElementById('bsi105-menu');
    if (!menu) { setTimeout(aggiungiVoci, 500); return; }
    if (menu.querySelector('[data-bsilg]')) return;

    function voce(icona, testoIt, azione) {
      var b = document.createElement('div');
      b.className = 'bsi105-mi';
      b.setAttribute('data-bsilg', '1');
      b.innerHTML = '<span class="ic">' + icona + '</span><span>' + testoIt + '</span>';
      b.onclick = function () { menu.classList.remove('open'); azione(); };
      menu.appendChild(b);
      return b;
    }
    voce('🌍', 'Lingua', function () { vaiASezione('slingua'); });
    voce('🔤', 'Linguaggi delle molecole', function () { vaiASezione('slinguaggi'); });
    /* le voci nuove devono seguire la lingua scelta come tutte le altre */
    if (globale.BSILingue) globale.BSILingue.imposta(globale.BSILingue.corrente(),
                                                     { silenzioso: true });
  }

  /* l'archivio dei nomi si costruisce una volta sola, senza bloccare l'avvio */
  function preparaArchivio() {
    if (!globale.BSIMolLingue || globale.BSIMolLingue.archivio) return;
    globale.BSIMolLingue.costruisciArchivio(function (arch, quanti) {
      globale.BSIMolLingue.archivio = arch;
      if (quanti) console.log('BioSpecInfo · archivio nomi: ' + quanti + ' molecole indicizzate');
    });
  }

  /* se la lingua cambia mentre un pannello è aperto, si ridisegna */
  /* se la lingua cambia, la sezione aperta si ridisegna nella lingua nuova */
  document.addEventListener('bsi-lingua', function () {
    ['slingua', 'slinguaggi'].forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec || !sec.children.length) return;
      if (id === 'slingua') globale.initLinguaSezione();
      else globale.initLinguaggiSezione();
    });
  });

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · Le due sezioni della navigazione
     ═════════════════════════════════════════════════════════════════════════
     Le stesse viste, montate dentro `#slingua` e `#slinguaggi`. Il menu ✨
     resta per chi lo usa, ma non è più l'unica porta: su telefono quel menu è
     nascosto, e una funzione raggiungibile solo da lì è una funzione che non
     c'è. */
  function montaSezione(idSezione, disegna) {
    var sec = document.getElementById(idSezione);
    if (!sec) return;
    var prima = contenitore;
    contenitore = sec;
    try { disegna(); } finally { contenitore = prima; }
  }
  globale.initLinguaSezione = function () {
    montaSezione('slingua', pannelloLingua);
  };
  globale.initLinguaggiSezione = function () {
    montaSezione('slinguaggi', pannelloMolingue);
  };

  /* Si ridisegnano quando la loro sezione viene aperta. */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.nav-btn[data-s]') : null;
    if (!b) return;
    var quale = b.getAttribute('data-s');
    if (quale === 'slingua') setTimeout(globale.initLinguaSezione, 60);
    if (quale === 'slinguaggi') setTimeout(globale.initLinguaggiSezione, 60);
  }, true);

  /* Portare alla sezione: si preme il pulsante di navigazione vero, così la
     sezione si apre con il meccanismo dell'applicazione e non con uno nostro. */
  function vaiASezione(id) {
    var b = document.querySelector('.nav-btn[data-s="' + id + '"]');
    if (b) { b.click(); return; }
    if (id === 'slingua') globale.initLinguaSezione();
    else globale.initLinguaggiSezione();
  }

  globale.bsiApriLingua = function () { vaiASezione('slingua'); };
  globale.bsiApriMolingue = function () { vaiASezione('slinguaggi'); };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      aggiungiVoci(); setTimeout(preparaArchivio, 3000);
    });
  } else {
    aggiungiVoci(); setTimeout(preparaArchivio, 3000);
  }

})(typeof window !== 'undefined' ? window : globalThis);
