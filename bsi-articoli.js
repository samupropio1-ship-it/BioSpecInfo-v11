/* ═══════════════════════════════════════════════════════════════════════════
   bsi-articoli — gli articoli e i grandi premi di chimica, fisica e
   matematica

   Tre materie, la stessa sezione, lo STESSO livello: per ciascuna gli
   ultimi articoli (Crossref, otto argomenti) e i premi piu' alti con una
   spiegazione scritta per argomento. Chimica e fisica hanno il Nobel, dalla
   Fondazione Nobel; la matematica non ha un Nobel, e i suoi premi maggiori —
   il Premio Abel e la Medaglia Fields — arrivano da Wikidata, che e' una
   banca dati pubblica e interrogabile, con la stessa regola: nessun anno e
   nessun nome scritto qui.

   DUE DECISIONI CHE SPIEGANO TUTTO IL FILE

   1 · NESSUN DATO SCRITTO A MANO. Non c'e' un titolo di articolo, non c'e'
       un anno di premio, non c'e' un nome di premiato dentro questo file.
       Arrivano in diretta da due sorgenti pubbliche e aperte — Crossref per
       gli articoli, la Fondazione Nobel per i premi — nel browser di chi
       legge.

       Il motivo non e' comodita': e' che un elenco di articoli scritto a mano
       sarebbe <b>vecchio il giorno dopo</b>, e un anno di premio scritto a
       memoria sarebbe un errore invisibile. Un titolo sbagliato si vede; un
       anno sbagliato no, sta li' e sembra un dato.

   2 · I LINK SONO RICOSTRUIBILI, cioe' non sono scritti: sono CALCOLATI da
       un identificatore. Il dato e' il DOI, l'anno, il nome; l'indirizzo e'
       una funzione di quel dato. Tre conseguenze pratiche:
         · un indirizzo non puo' essere sbagliato di suo — o l'identificatore
           e' giusto, e allora il link porta dove deve, o e' sbagliato, e
           allora si vede subito;
         · se un sito cambia schema, cambia UNA funzione, non mille righe;
         · un link appena nato (un articolo di ieri) funziona senza che
           nessuno lo abbia aggiunto a una lista.

   QUANDO LA RETE NON C'E'

   Si dice. Non si mostra una lista vecchia spacciata per aggiornata, e non
   si mostra una pagina vuota: compare che cosa si e' provato a chiedere, a
   chi, e perche' non e' arrivato — con l'indirizzo della richiesta, che si
   puo' aprire a mano.

   USO   si innesta da se'; `BSIArticoli` per il banco.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var ID = 'sarticoli';

  /* ═════════════════════════════════════════════════════════════════════════
     I LINK, COME FUNZIONI

     Ogni indirizzo si ricava da un identificatore. Niente indirizzi scritti
     a mano in mezzo al codice: se domani `doi.org` cambia schema, si cambia
     `L.doi` e basta.
     ═════════════════════════════════════════════════════════════════════════ */
  var L = {
    /* il resolver ufficiale dei DOI: un DOI è per definizione permanente */
    doi: function (d) { return 'https://doi.org/' + String(d).replace(/^doi:/i, ''); },
    /* la pagina ufficiale del premio, per anno */
    nobel: function (anno, cat) {
      return 'https://www.nobelprize.org/prizes/' + (cat || 'chemistry') + '/' + anno + '/summary/';
    },
    /* il materiale scientifico che la Fondazione pubblica per ogni premio */
    nobelAvanzato: function (anno, cat) {
      return 'https://www.nobelprize.org/prizes/' + (cat || 'chemistry') + '/' + anno + '/advanced-information/';
    },
    nobelDivulgativo: function (anno, cat) {
      return 'https://www.nobelprize.org/prizes/' + (cat || 'chemistry') + '/' + anno + '/popular-information/';
    },
    /* la scheda di un'entita' di Wikidata, dal suo identificatore Q… */
    wikidata: function (q) { return 'https://www.wikidata.org/wiki/' + String(q).replace(/^.*\//, ''); },
    /* le pagine ufficiali dei due premi della matematica: sono gli enti che
       li assegnano, non elenchi */
    abel: function () { return 'https://abelprize.no/'; },
    fields: function () { return 'https://www.mathunion.org/imu-awards/fields-medal'; },
    /* Wikipedia in italiano: ricerca, non titolo indovinato. Un titolo
       inventato darebbe una pagina inesistente; una ricerca porta sempre a
       qualcosa che si può valutare. */
    wikiIt: function (q) {
      return 'https://it.wikipedia.org/w/index.php?search=' + encodeURIComponent(q);
    },
    /* LEGGERE IN ITALIANO qualunque pagina: la vista tradotta di Google.
       Gli articoli scientifici sono in inglese — questo è un fatto, non una
       scelta dell'applicazione — e questo è il modo di leggerli in italiano
       senza copiarne il contenuto da nessuna parte. */
    tradotto: function (url) {
      var u = String(url).replace(/^https?:\/\//, '');
      var host = u.split('/')[0];
      var resto = u.slice(host.length);
      return 'https://' + host.replace(/\./g, '-') + '.translate.goog' + resto +
             (resto.indexOf('?') >= 0 ? '&' : '?') +
             '_x_tr_sl=auto&_x_tr_tl=it&_x_tr_hl=it';
    },
    /* la richiesta a Crossref: filtri e ordinamento espliciti */
    crossref: function (opz) {
      opz = opz || {};
      var p = [];
      var filtri = ['type:journal-article'];
      if (opz.da) filtri.push('from-pub-date:' + opz.da);
      if (opz.issn) filtri.push('issn:' + opz.issn);
      p.push('filter=' + filtri.join(','));
      if (opz.query) p.push('query.bibliographic=' + encodeURIComponent(opz.query));
      p.push('sort=published');
      p.push('order=desc');
      p.push('rows=' + (opz.quanti || 20));
      p.push('select=DOI,title,author,container-title,published,abstract,URL,subject');
      /* Crossref chiede di identificarsi: è nelle loro condizioni d'uso, e
         chi si identifica viene servito dal gruppo di macchine più veloce */
      p.push('mailto=biospecinfo@users.noreply.github.com');
      return 'https://api.crossref.org/works?' + p.join('&');
    },
    /* la richiesta alla Fondazione Nobel */
    nobelApi: function (quanti, cat) {
      return 'https://api.nobelprize.org/2.1/nobelPrizes?nobelPrizeCategory=' + (cat || 'che') +
             '&limit=' + (quanti || 200) + '&sort=asc&format=json';
    },
    /* la richiesta a Wikidata per i premi della matematica. I premi si
       riconoscono dal NOME inglese, non da un identificatore scritto a
       memoria: un identificatore sbagliato darebbe un altro premio in
       silenzio, un nome sbagliato non da' niente e si vede. Per ogni
       premiato: il nome, l'anno (qualificatore «data»), la motivazione se
       Wikidata la registra, e i campi di ricerca. */
    wikidataPremiMat: function () {
      var q = [
        'SELECT ?nomePremio ?persona ?nome ?anno ?motivazione',
        ' (GROUP_CONCAT(DISTINCT ?campoNome; separator=" | ") AS ?campi) WHERE {',
        ' VALUES ?nomePremio { "Abel Prize"@en "Fields Medal"@en }',
        ' ?premio rdfs:label ?nomePremio .',
        ' ?persona p:P166 ?st . ?st ps:P166 ?premio .',
        ' ?persona rdfs:label ?nome . FILTER(LANG(?nome) = "en")',
        ' OPTIONAL { ?st pq:P585 ?data . }',
        ' BIND(YEAR(?data) AS ?anno)',
        ' OPTIONAL { ?st pq:P6208 ?motivazione . FILTER(LANG(?motivazione) = "en") }',
        ' OPTIONAL { ?persona wdt:P101 ?campo . ?campo rdfs:label ?campoNome .',
        '   FILTER(LANG(?campoNome) = "en") }',
        '} GROUP BY ?nomePremio ?persona ?nome ?anno ?motivazione'
      ].join('\n');
      return 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q);
    }
  };

  /* ═════════════════════════════════════════════════════════════════════════
     LE TRE MATERIE, CON LA STESSA FORMA

     Ogni materia dichiara: le sue otto ricerche negli articoli, il suo premio
     e dove prendere le spiegazioni. Nessuna ha un trattamento di favore: la
     sezione si costruisce da questa tabella.
     ═════════════════════════════════════════════════════════════════════════ */
  var MATERIE = {
    chimica: { ic: '🧪', nm: ['Chimica', 'Chemistry'], cat: 'che', slug: 'chemistry',
      premio: ['Nobel per la chimica', 'Nobel Prize in Chemistry'],
      wiki: 'Premio Nobel per la chimica ',
      spieg: function () { return globale.BSINobelSpiegazioni; } },
    fisica: { ic: '⚛️', nm: ['Fisica', 'Physics'], cat: 'phy', slug: 'physics',
      premio: ['Nobel per la fisica', 'Nobel Prize in Physics'],
      wiki: 'Premio Nobel per la fisica ',
      spieg: function () { return globale.BSINobelSpiegazioniFisica; } },
    matematica: { ic: '📐', nm: ['Matematica', 'Mathematics'], cat: null, slug: null,
      premio: ['Premio Abel e Medaglia Fields', 'Abel Prize and Fields Medal'],
      spieg: function () { return globale.BSIPremiMatematicaSpiegazioni; } }
  };

  /* gli argomenti del primo pannello: sono TERMINI DI RICERCA, non elenchi
     di articoli — quindi non invecchiano */
  function ARGOMENTI(m) {
    m = m || materia;
    if (m === 'fisica') return [
      { k: '', nm: t('tutta la fisica', 'all physics'), q: 'physics' },
      { k: 'quanti', nm: t('fisica quantistica', 'quantum physics'), q: 'quantum entanglement qubit' },
      { k: 'materia', nm: t('materia condensata', 'condensed matter'), q: 'condensed matter superconductivity topological' },
      { k: 'particelle', nm: t('particelle', 'particle physics'), q: 'particle physics collider neutrino' },
      { k: 'astro', nm: t('astrofisica e cosmologia', 'astrophysics and cosmology'), q: 'astrophysics cosmology gravitational waves' },
      { k: 'ottica', nm: t('ottica e laser', 'optics and lasers'), q: 'optics photonics laser' },
      { k: 'nucleare', nm: t('fisica nucleare', 'nuclear physics'), q: 'nuclear physics nuclei' },
      { k: 'complessi', nm: t('fisica statistica', 'statistical physics'), q: 'statistical physics complex systems' }
    ];
    if (m === 'matematica') return [
      { k: '', nm: t('tutta la matematica', 'all mathematics'), q: 'mathematics theorem' },
      { k: 'algebra', nm: t('algebra', 'algebra'), q: 'algebra group representation' },
      { k: 'analisi', nm: t('analisi ed equazioni', 'analysis and PDEs'), q: 'partial differential equations analysis' },
      { k: 'geometria', nm: t('geometria e topologia', 'geometry and topology'), q: 'geometry topology manifold' },
      { k: 'numeri', nm: t('teoria dei numeri', 'number theory'), q: 'number theory primes' },
      { k: 'probabilita', nm: t('probabilità', 'probability'), q: 'probability stochastic random' },
      { k: 'numerica', nm: t('analisi numerica', 'numerical analysis'), q: 'numerical analysis algorithm' },
      { k: 'combinatoria', nm: t('combinatoria e grafi', 'combinatorics and graphs'), q: 'combinatorics graph theory' }
    ];
    return [
      { k: '', nm: t('tutta la chimica', 'all chemistry'), q: 'chemistry' },
      { k: 'nmr', nm: t('spettroscopia e NMR', 'spectroscopy and NMR'),
        q: 'NMR spectroscopy structure elucidation' },
      { k: 'sintesi', nm: t('sintesi organica', 'organic synthesis'),
        q: 'total synthesis organic' },
      { k: 'catalisi', nm: t('catalisi', 'catalysis'), q: 'catalysis catalytic' },
      { k: 'farmaci', nm: t('chimica farmaceutica', 'medicinal chemistry'),
        q: 'medicinal chemistry drug discovery' },
      { k: 'materiali', nm: t('materiali', 'materials'),
        q: 'materials chemistry framework' },
      { k: 'bio', nm: t('biochimica', 'biochemistry'),
        q: 'enzyme protein structure biochemistry' },
      { k: 'calcolo', nm: t('computazionale', 'computational'),
        q: 'computational chemistry DFT machine learning' }
    ];
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LEGGERE DALLE SORGENTI, CON PRUDENZA

     La forma esatta di una risposta altrui non si dà per scontata: si legge
     campo per campo con dei ripieghi, e si CONTA quante voci non si sono
     potute leggere. Un modulo che ne perde la metà in silenzio sembra
     funzionare.
     ═════════════════════════════════════════════════════════════════════════ */
  function prendi(url, timeoutMs) {
    return new Promise(function (ris, rif) {
      var ctl = (typeof AbortController === 'function') ? new AbortController() : null;
      var tm = setTimeout(function () {
        if (ctl) ctl.abort();
        rif(new Error(t('nessuna risposta entro ', 'no answer within ') +
                      Math.round((timeoutMs || 15000) / 1000) + 's'));
      }, timeoutMs || 15000);
      fetch(url, ctl ? { signal: ctl.signal } : undefined)
        .then(function (r) {
          clearTimeout(tm);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(ris, function (e) { clearTimeout(tm); rif(e); });
    });
  }

  function normalizzaArticoli(dati) {
    /* LA FORMA SI RICONOSCE O NON SI RICONOSCE, E NON E' LA STESSA COSA DI
       «VUOTO». Senza questo campo le due situazioni davano lo stesso
       risultato — zero voci — e l'applicazione diceva «non ci sono articoli»
       anche quando la risposta era di tutt'altra natura. «Non c'e' niente» e
       «non ho capito» vanno detti diversi. */
    var forma = !!(dati && dati.message && Array.isArray(dati.message.items));
    var voci = forma ? dati.message.items : [];
    var out = [], scartate = 0;
    voci.forEach(function (v) {
      var doi = v.DOI || '';
      var tit = (v.title && v.title[0]) || '';
      if (!doi || !tit) { scartate++; return; }
      var data = '';
      var p = v.published && v.published['date-parts'] && v.published['date-parts'][0];
      if (p && p.length) data = p.join('-');
      out.push({
        doi: doi, titolo: tit,
        rivista: (v['container-title'] && v['container-title'][0]) || '',
        data: data,
        autori: (v.author || []).slice(0, 6).map(function (a) {
          return [a.given, a.family].filter(Boolean).join(' ');
        }).filter(Boolean),
        quantiAutori: (v.author || []).length,
        /* Crossref restituisce l'abstract in JATS quando c'è: si toglie il
           marcatore, non si riscrive il testo */
        sunto: v.abstract ? String(v.abstract).replace(/<[^>]+>/g, ' ')
                                              .replace(/\s+/g, ' ').trim() : ''
      });
    });
    return { articoli: out, scartate: scartate, totali: voci.length,
             formaRiconosciuta: forma };
  }

  function normalizzaNobel(dati) {
    var lista = dati && (dati.nobelPrizes || dati.nobelPrize);
    var forma = Array.isArray(lista);
    var voci = forma ? lista : [];
    var out = [], scartate = 0;
    voci.forEach(function (v) {
      var anno = v.awardYear || v.year;
      if (!anno) { scartate++; return; }
      var prem = (v.laureates || []).map(function (p) {
        var nome = (p.knownName && (p.knownName.en || p.knownName.se)) ||
                   (p.fullName && (p.fullName.en || p.fullName.se)) ||
                   (p.orgName && (p.orgName.en || p.orgName.se)) || '';
        var mot = (p.motivation && (p.motivation.en || p.motivation.se)) || '';
        return { nome: nome, motivazione: mot, porzione: p.portion || '' };
      }).filter(function (p) { return p.nome; });
      /* la motivazione ufficiale: sta sui premiati, e quando è la stessa per
         tutti si mostra una volta */
      var motivazioni = prem.map(function (p) { return p.motivazione; })
                            .filter(Boolean);
      var unica = motivazioni.length &&
                  motivazioni.every(function (m) { return m === motivazioni[0]; })
                  ? motivazioni[0] : '';
      out.push({
        anno: String(anno), premiati: prem,
        motivazione: unica || motivazioni.join(' · '),
        /* un anno in cui il premio non è stato assegnato: la Fondazione lo
           dichiara, e si dichiara anche qui invece di mostrarlo vuoto */
        nonAssegnato: !prem.length
      });
    });
    return { premi: out, scartate: scartate, totali: voci.length,
             formaRiconosciuta: forma };
  }


  /* I PREMI DELLA MATEMATICA, DA WIKIDATA. La risposta SPARQL e' una lista
     di righe, una per premiato; qui si raggruppano per premio e anno (la
     Medaglia Fields ne ha piu' d'uno per volta). Una riga senza anno o senza
     nome non si indovina: si scarta e si conta. */
  function normalizzaPremiMat(dati) {
    var forma = !!(dati && dati.results && Array.isArray(dati.results.bindings));
    var righe = forma ? dati.results.bindings : [];
    var gruppi = {}, scartate = 0;
    function val(r, k) { return r && r[k] && r[k].value != null ? String(r[k].value) : ''; }
    righe.forEach(function (r) {
      var anno = val(r, 'anno'), nome = val(r, 'nome'), premio = val(r, 'nomePremio');
      if (!/^\d{3,4}$/.test(anno) || !nome || !premio) { scartate++; return; }
      var tipo = /abel/i.test(premio) ? 'abel' : /fields/i.test(premio) ? 'fields' : '';
      if (!tipo) { scartate++; return; }
      var ch = tipo + anno;
      if (!gruppi[ch]) gruppi[ch] = { anno: anno, premio: tipo, premiati: [] };
      var g = gruppi[ch];
      if (g.premiati.some(function (x) { return x.nome === nome; })) return;
      g.premiati.push({
        nome: nome, qid: val(r, 'persona').replace(/^.*\//, ''),
        motivazione: val(r, 'motivazione'),
        campi: val(r, 'campi').split(' | ').filter(Boolean)
      });
    });
    var out = Object.keys(gruppi).map(function (k) { return gruppi[k]; });
    out.sort(function (a, b) { return (+a.anno - +b.anno) || (a.premio < b.premio ? -1 : 1); });
    return { premi: out, scartate: scartate, totali: righe.length, formaRiconosciuta: forma };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     LA SEZIONE
     ═════════════════════════════════════════════════════════════════════════ */
  function stile() {
    if (document.getElementById('bsiART-stile')) return;
    var s = document.createElement('style');
    s.id = 'bsiART-stile';
    s.textContent = [
      '#bsiART-tab{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}',
      '#bsiART-mat{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}',
      '.bsiART-m{border:1px solid #2a3f5c;background:#0b1a2e;color:#e8f4ff;',
      ' border-radius:12px;padding:9px 16px;cursor:pointer;font-size:14px;font-weight:800}',
      '.bsiART-m.on{border-color:#ffc45a;background:linear-gradient(135deg,',
      ' rgba(255,196,90,.18),rgba(124,111,255,.08))}',
      '.bsiART-campi{font-size:11.5px;color:#a9c4dd;margin:4px 0 6px}',
      '.bsiART-t{border:1px solid #1e3a52;background:#0a1628;color:#cfe2f5;',
      ' border-radius:11px;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:700}',
      '.bsiART-t.on{border-color:#5eead4;background:linear-gradient(135deg,',
      ' rgba(94,234,212,.17),rgba(124,111,255,.09));color:#eafffb}',
      '.bsiART-arg{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}',
      '.bsiART-a{border:1px solid #1e3a52;background:#081322;color:#8aadcc;',
      ' border-radius:9px;padding:5px 10px;cursor:pointer;font-size:11.5px;font-weight:700}',
      '.bsiART-a.on{border-color:#7c6fff;color:#cfc8ff;background:#140f30}',
      '.bsiART-card{background:#0a1628;border:1px solid #16273e;border-radius:12px;',
      ' padding:13px 15px;margin-bottom:11px}',
      '.bsiART-card h5{margin:0 0 6px;font-size:14px;color:#e8f4ff;line-height:1.4}',
      '.bsiART-meta{font-size:11.5px;color:#7a96b0;margin-bottom:7px}',
      '.bsiART-sunto{font-size:12.5px;color:#cfe2f5;line-height:1.6;margin:7px 0}',
      '.bsiART-sp{background:#081c2c;border-left:3px solid #5eead4;border-radius:0 9px 9px 0;',
      ' padding:10px 13px;margin:9px 0;font-size:12.8px;color:#dff3ff;line-height:1.68}',
      '.bsiART-sp b{color:#5eead4}',
      '.bsiART-mot{font-size:12.3px;color:#ffd9a0;font-style:italic;line-height:1.55;',
      ' background:#1d1403;border-radius:9px;padding:9px 12px;margin:7px 0}',
      '.bsiART-link{display:inline-block;margin:3px 7px 3px 0;font-size:11.5px;',
      ' color:#5eead4;text-decoration:none;border:1px solid #1e3a52;border-radius:8px;',
      ' padding:4px 9px}',
      '.bsiART-link:hover{border-color:#5eead4;background:#0d2230}',
      '.bsiART-stato{font-size:12px;color:#8aadcc;margin:10px 0;line-height:1.6}',
      '.bsiART-ko{background:#2b1218;border:1px solid #6d2736;border-radius:11px;',
      ' padding:12px 14px;font-size:12.5px;color:#ffc9d2;line-height:1.65}',
      '.bsiART-ko code{background:#140a0d;padding:2px 5px;border-radius:4px;',
      ' font-size:11px;word-break:break-all}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── DOVE SI ATTACCA UNA SEZIONE NUOVA ────────────────────────────────
     Non accanto a una sezione qualunque: accanto a una di PRIMO LIVELLO.
     `bsi-centrospettri.js` SPOSTA dieci pannelli dentro il proprio corpo, e
     fra questi `sspettrolettore`. Ancorandosi a lui — come faceva la prima
     stesura — la sezione nuova finiva DENTRO il corpo del centro, cioe'
     dentro un contenitore nascosto: il suo `display` diceva `block` e lei
     non si vedeva, perche' un antenato era `display:none`.
     E' il difetto che ha reso invisibile la sezione «Articoli» per una
     versione intera. Il controllo che l'aveva lasciata passare guardava
     `getComputedStyle(sezione).display !== 'none'`, che NON risponde alla
     domanda «si vede?»: la risposta e' un riquadro di dimensione non nulla.
     Qui si cerca una sezione che non sia annidata in un'altra. */
  function ancora() {
    var tutte = document.querySelectorAll('.section');
    for (var i = 0; i < tutte.length; i++) {
      var s = tutte[i];
      if (!s.parentElement) continue;
      if (s.parentElement.closest && s.parentElement.closest('.section')) continue;
      return s;
    }
    return null;
  }

  function costruisci() {
    if (document.getElementById(ID)) return document.getElementById(ID);
    var rif = ancora();
    if (!rif || !rif.parentNode) return null;
    var d = document.createElement('div');
    d.id = ID;
    d.className = 'section';
    d.innerHTML =
      '<div class="section-title">📰 ' + t('ARTICOLI', 'ARTICLES') + '</div>' +
      '<div id="bsiART-intro" style="color:#9fb3c8;font-size:.9rem;margin-bottom:14px;' +
      'max-width:880px;line-height:1.65"></div>' +
      '<div id="bsiART-mat" role="tablist"></div>' +
      '<div id="bsiART-tab"></div>' +
      '<div id="bsiART-corpo"></div>';
    /* fuori dal centro spettri: è una sezione sua */
    rif.parentNode.insertBefore(d, rif.nextSibling);
    return d;
  }

  var scheda = 'ultimi';
  var argomento = '';
  var materia = 'chimica';
  var cachePremi = {};

  function intro() {
    var i = document.getElementById('bsiART-intro');
    if (!i) return;
    i.innerHTML = t(
      'Tre materie, la stessa sezione: <b>chimica</b>, <b>fisica</b> e <b>matematica</b>, ' +
      'ciascuna con gli ultimi articoli e i suoi premi più alti — il Nobel per chimica e ' +
      'fisica, il <b>Premio Abel</b> e la <b>Medaglia Fields</b> per la matematica, che il ' +
      'Nobel non ce l’ha. ' +
      'Gli articoli non sono scritti qui dentro: arrivano <b>in diretta</b> da ' +
      '<b>Crossref</b> (la banca dati dei DOI), dalla <b>Fondazione Nobel</b> e da ' +
      '<b>Wikidata</b>. Un elenco ' +
      'scritto a mano sarebbe vecchio domani, e un anno di premio scritto a memoria ' +
      'sarebbe un errore che non si vede. E i link non sono scritti: sono ' +
      '<b>calcolati</b> dall’identificatore — da un DOI, da un anno — quindi un ' +
      'articolo di ieri funziona senza che nessuno lo abbia aggiunto a una lista.',
      'Three subjects, one section: <b>chemistry</b>, <b>physics</b> and ' +
      '<b>mathematics</b>, each with the latest articles and its highest prizes — the ' +
      'Nobel for chemistry and physics, the <b>Abel Prize</b> and the <b>Fields Medal</b> ' +
      'for mathematics, which has no Nobel. ' +
      'The articles are not written in here: they arrive <b>live</b> from ' +
      '<b>Crossref</b> (the DOI registry), from the <b>Nobel Foundation</b> and from ' +
      '<b>Wikidata</b>. A ' +
      'hand-written list would be stale tomorrow, and a prize year written from memory ' +
      'would be an error nobody can see. And the links are not written: they are ' +
      '<b>computed</b> from the identifier — from a DOI, from a year — so yesterday’s ' +
      'paper works without anyone adding it to a list.');
  }

  function disegnaTab() {
    var host = document.getElementById('bsiART-tab');
    if (!host) return;
    host.innerHTML = '';
    var mh = document.getElementById('bsiART-mat');
    if (mh) {
      mh.innerHTML = '';
      Object.keys(MATERIE).forEach(function (k) {
        var M = MATERIE[k], b = document.createElement('button');
        b.className = 'bsiART-m' + (k === materia ? ' on' : '');
        b.setAttribute('data-bsi-mat', k);
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', k === materia ? 'true' : 'false');
        b.textContent = M.ic + ' ' + t(M.nm[0], M.nm[1]);
        b.onclick = function () { materia = k; argomento = ''; disegnaTab(); rendi(); };
        mh.appendChild(b);
      });
    }
    var MM = MATERIE[materia];
    [{ k: 'ultimi', nm: MM.ic + ' ' + t('Ultimi articoli', 'Latest articles') },
     { k: 'nobel', nm: '🏅 ' + t(MM.premio[0], MM.premio[1]) }
    ].forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'bsiART-t' + (s.k === scheda ? ' on' : '');
      b.setAttribute('data-bsi-art', s.k);
      b.textContent = s.nm;
      b.onclick = function () { scheda = s.k; disegnaTab(); rendi(); };
      host.appendChild(b);
    });
  }

  function linkRiga(voci) {
    return voci.map(function (v) {
      return '<a class="bsiART-link" href="' + esc(v.u) + '" target="_blank" ' +
             'rel="noopener noreferrer">' + esc(v.n) + '</a>';
    }).join('');
  }

  /* LA FORMA DI UNA RISPOSTA ALTRUI NON SI VERIFICA A TAVOLINO.
     Questo modulo e' stato scritto dove la rete e' bloccata da una politica:
     i due indirizzi rispondono 403 al tunnel, quindi la forma esatta del JSON
     non ho potuto misurarla. I lettori sono scritti tolleranti (piu' nomi di
     campo accettati), ma se un giorno la forma cambia il risultato sarebbe
     «zero voci» — che somiglia a «non c'e' niente» e invece e' «non ho
     capito». Allora si mostrano le CHIAVI di quello che e' arrivato: chi
     legge vede subito se la sorgente ha risposto un'altra cosa. */
  function chiaviDi(dati, quante) {
    try {
      if (!dati || typeof dati !== 'object') return String(typeof dati);
      var k = Object.keys(dati).slice(0, quante || 8);
      return k.map(function (x) {
        var v = dati[x];
        var tipo = Array.isArray(v) ? 'lista[' + v.length + ']' : typeof v;
        return x + ':' + tipo;
      }).join(', ');
    } catch (e) { return '(illeggibile)'; }
  }

  function panicoForma(url, dati, quanteLette) {
    return '<div class="bsiART-ko"><b>' +
      t('La sorgente ha risposto, e non ho riconosciuto la risposta.',
        'The source answered, and I did not recognise the answer.') + '</b><br>' +
      t('Voci che ho letto: ', 'Records I read: ') + quanteLette + '<br>' +
      t('Chiavi arrivate: ', 'Keys received: ') + '<code>' + esc(chiaviDi(dati)) +
      '</code><br><br>' +
      t('Vuol dire che la forma dei dati e\u2019 cambiata da quando questo lettore \u00e8 ' +
        'stato scritto. <b>Non \u00e8 «non c\u2019\u00e8 niente»</b>: \u00e8 «non ho capito», e sono due ' +
        'cose diverse che vanno dette diverse.',
        'It means the data shape has changed since this reader was written. <b>It is not ' +
        '"there is nothing"</b>: it is "I did not understand", and those are two ' +
        'different things that must be said differently.') + '<br><br>' +
      linkRiga([{ n: t('apri la risposta grezza', 'open the raw answer'), u: url }]) +
      '</div>';
  }

  function panicoRete(url, errore) {
    return '<div class="bsiART-ko"><b>' +
      t('Non sono riuscito a leggere la sorgente.', 'I could not read the source.') +
      '</b><br>' + esc(String(errore && errore.message || errore)) + '<br><br>' +
      t('Ho chiesto questo:', 'This is what I asked for:') +
      '<br><code>' + esc(url) + '</code><br><br>' +
      t('Succede se non c’è rete, se la sorgente è momentaneamente giù, o se una rete ' +
        'con filtri blocca il dominio. <b>Non ti mostro una lista vecchia al posto di ' +
        'quella nuova</b>: l’indirizzo qui sopra si apre a mano e risponde la stessa ' +
        'cosa che avrei letto io.',
        'This happens with no network, with the source temporarily down, or on a ' +
        'filtered network blocking the domain. <b>I will not show you a stale list in ' +
        'place of the current one</b>: the address above can be opened by hand and ' +
        'answers exactly what I would have read.') +
      '<br><br>' + linkRiga([{ n: t('apri la richiesta', 'open the request'), u: url }]) +
      '</div>';
  }

  /* ── scheda 1 · gli ultimi articoli ─────────────────────────────────── */
  function rendiUltimi(corpo) {
    var args = ARGOMENTI();
    var sel = args.filter(function (a) { return a.k === argomento; })[0] || args[0];
    var da = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60)
      .toISOString().slice(0, 10);          /* ultimi 60 giorni */
    var url = L.crossref({ query: sel.q, da: da, quanti: 25 });
    var mat = materia;

    var h = '<div class="bsiART-arg">';
    args.forEach(function (a) {
      h += '<button class="bsiART-a' + (a.k === sel.k ? ' on' : '') +
           '" data-bsi-arg="' + a.k + '">' + esc(a.nm) + '</button>';
    });
    h += '</div><div class="bsiART-stato">' +
      t('Cerco gli articoli pubblicati dal ', 'Looking for articles published since ') +
      da + t(' su «', ' on "') + esc(sel.q) + t('»…', '"…') + '</div>' +
      '<div id="bsiART-lista"></div>';
    corpo.innerHTML = h;
    [].forEach.call(corpo.querySelectorAll('.bsiART-a'), function (b) {
      b.onclick = function () { argomento = b.getAttribute('data-bsi-arg'); rendi(); };
    });

    prendi(url, 18000).then(function (dati) {
      /* se nel frattempo si e' cambiata materia, questa risposta non serve piu' */
      if (materia !== mat) return;
      var n = normalizzaArticoli(dati);
      var lista = document.getElementById('bsiART-lista');
      if (!lista) return;
      if (n.formaRiconosciuta && !n.articoli.length && !n.totali) {
        /* la differenza che conta: ZERO voci nella risposta puo' voler dire
           «non ci sono articoli» (risposta vuota, legittima) oppure «non ho
           riconosciuto la risposta». Si distingue guardando se la risposta
           aveva la forma attesa. */
        lista.innerHTML = '<div class="bsiART-stato">' +
          t('La sorgente ha risposto, e per questo argomento non ci sono articoli ' +
            'negli ultimi sessanta giorni. Non è un guasto: è una risposta vuota.',
            'The source answered, and for this topic there are no articles in the last ' +
            'sixty days. This is not a failure: it is an empty answer.') + '</div>';
        return;
      }
      if (!n.articoli.length) {
        lista.innerHTML = panicoForma(url, dati, n.totali);
        return;
      }
      var hh = '<div class="bsiART-stato"><b>' + n.articoli.length + '</b> ' +
        t('articoli, dal più recente. Ogni titolo porta al suo <b>DOI</b>, che è un ' +
          'indirizzo permanente.',
          'articles, newest first. Each title leads to its <b>DOI</b>, which is a ' +
          'permanent address.') +
        (n.scartate ? '<br>' + t('Voci che non ho potuto leggere (manca il DOI o il ' +
                                 'titolo): ', 'Records I could not read (missing DOI or ' +
                                 'title): ') + n.scartate : '') + '</div>';
      n.articoli.forEach(function (a) {
        var u = L.doi(a.doi);
        hh += '<div class="bsiART-card"><h5><a href="' + esc(u) + '" target="_blank" ' +
          'rel="noopener noreferrer" style="color:#e8f4ff;text-decoration:none">' +
          esc(a.titolo) + '</a></h5><div class="bsiART-meta">' +
          (a.rivista ? '<b>' + esc(a.rivista) + '</b> · ' : '') +
          (a.data ? esc(a.data) + ' · ' : '') +
          esc(a.autori.join(', ')) +
          (a.quantiAutori > a.autori.length
            ? ' <i>' + t('e altri ', 'and ') + (a.quantiAutori - a.autori.length) +
              t('', ' more') + '</i>' : '') +
          '</div>' +
          (a.sunto ? '<div class="bsiART-sunto">' + esc(a.sunto.slice(0, 520)) +
                     (a.sunto.length > 520 ? '…' : '') + '</div>' : '') +
          linkRiga([
            { n: 'DOI · ' + a.doi, u: u },
            { n: '🇮🇹 ' + t('leggilo in italiano', 'read it in Italian'), u: L.tradotto(u) }
          ]) + '</div>';
      });
      lista.innerHTML = hh;
    }).catch(function (e) {
      var lista = document.getElementById('bsiART-lista');
      if (lista) lista.innerHTML = panicoRete(url, e);
    });
  }

  /* ── scheda 2 · i Nobel ─────────────────────────────────────────────── */
  function rendiNobel(corpo) {
    if (materia === 'matematica') return rendiMatematica(corpo);
    var MM = MATERIE[materia], mat = materia;
    var url = L.nobelApi(200, MM.cat);
    corpo.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px">' +
      '<input id="bsiART-cerca" placeholder="' +
      t('cerca per anno, argomento o nome…', 'search by year, topic or name…') +
      '" style="flex:1;min-width:200px;padding:8px 12px;background:#0f2040;' +
      'border:1px solid #34465f;color:#e8f4ff;border-radius:9px;font-size:13px;' +
      'box-sizing:border-box"></div>' +
      '<div class="bsiART-stato" id="bsiART-nstato">' +
      t('Chiedo l’elenco ufficiale alla Fondazione Nobel…',
        'Asking the Nobel Foundation for the official list…') + '</div>' +
      '<div id="bsiART-nlista"></div>';

    function disegna(premi, filtro) {
      var lista = document.getElementById('bsiART-nlista');
      if (!lista) return;
      var S = MM.spieg();
      var f = (filtro || '').trim().toLowerCase();
      var mostrati = 0, conSpiegazione = 0;
      var h = '';
      premi.slice().reverse().forEach(function (p) {
        var testoCerca = (p.anno + ' ' + p.motivazione + ' ' +
          p.premiati.map(function (x) { return x.nome; }).join(' ')).toLowerCase();
        var sp = S ? S.perMotivazione(p.motivazione) : null;
        if (sp) conSpiegazione++;
        if (f && testoCerca.indexOf(f) < 0 &&
            !(sp && sp.tit.toLowerCase().indexOf(f) >= 0)) return;
        mostrati++;
        h += '<div class="bsiART-card"><h5>' + esc(p.anno) +
             (sp ? ' — ' + esc(sp.tit) : '') + '</h5>';
        if (p.nonAssegnato) {
          h += '<div class="bsiART-meta">' +
            t('premio non assegnato in questo anno (così lo dichiara la Fondazione)',
              'prize not awarded this year (as the Foundation states)') + '</div>';
        } else {
          h += '<div class="bsiART-meta">' +
            p.premiati.map(function (x) { return '<b>' + esc(x.nome) + '</b>'; }).join(' · ') +
            '</div>';
        }
        if (p.motivazione) {
          h += '<div class="bsiART-mot">“' + esc(p.motivazione) + '”<br>' +
            '<span style="font-size:10.5px;color:#c9a46a;font-style:normal">' +
            t('motivazione ufficiale, come pubblicata (in inglese)',
              'official motivation, as published (in English)') + '</span></div>';
        }
        if (sp) {
          h += '<div class="bsiART-sp"><b>' +
            t('Che cosa è, spiegato', 'What it is, explained') + '</b> — ' + sp.sp +
            '<br><span style="font-size:10.5px;color:#7a96b0">' +
            t('spiegazione scritta per questa applicazione e abbinata ' +
              '<b>all’argomento della motivazione ufficiale</b>, non all’anno: ' +
              'nessuna attribuzione viene da qui.',
              'explanation written for this application and matched to <b>the topic of ' +
              'the official motivation</b>, not to the year: no attribution comes from ' +
              'here.') + '</span></div>';
        } else {
          h += '<div class="bsiART-stato">' +
            t('Per questo premio non ho una spiegazione scritta: qui sopra c’è la ' +
              'motivazione ufficiale, e sotto il materiale della Fondazione, che è la ' +
              'fonte. Preferisco dirlo che inventare.',
              'For this prize I have no written explanation: above is the official ' +
              'motivation, below the Foundation’s own material, which is the source. I ' +
              'prefer saying so to making something up.') + '</div>';
        }
        var uff = L.nobel(p.anno, MM.slug);
        h += linkRiga([
          { n: '🏅 ' + t('pagina ufficiale', 'official page'), u: uff },
          { n: '🔬 ' + t('materiale scientifico', 'scientific background'),
            u: L.nobelAvanzato(p.anno, MM.slug) },
          { n: '📖 ' + t('versione divulgativa', 'popular version'),
            u: L.nobelDivulgativo(p.anno, MM.slug) },
          { n: '🇮🇹 ' + t('leggi in italiano', 'read in Italian'), u: L.tradotto(uff) },
          { n: '🇮🇹 Wikipedia',
            u: L.wikiIt(MM.wiki + p.anno) }
        ]) + '</div>';
      });
      var st = document.getElementById('bsiART-nstato');
      if (st) {
        st.innerHTML = '<b>' + premi.length + '</b> ' +
          t('premi nell’elenco ufficiale', 'prizes in the official list') +
          ' · <b>' + conSpiegazione + '</b> ' +
          t('con spiegazione scritta', 'with a written explanation') +
          (f ? ' · <b>' + mostrati + '</b> ' + t('mostrati dal filtro', 'shown by the filter') : '') +
          '<br>' + t('Anni, nomi e motivazioni vengono dalla Fondazione Nobel, non da ' +
                     'questa applicazione.',
                     'Years, names and motivations come from the Nobel Foundation, not ' +
                     'from this application.');
      }
      lista.innerHTML = h || '<div class="bsiART-stato">' +
        t('Nessun premio corrisponde al filtro.', 'No prize matches the filter.') + '</div>';
    }

    function conPremi(premi) {
      cachePremi[mat] = premi;
      disegna(premi, '');
      var c = document.getElementById('bsiART-cerca');
      if (c) {
        c.oninput = function () { disegna(premi, c.value); };
      }
    }

    if (cachePremi[mat]) { conPremi(cachePremi[mat]); return; }
    prendi(url, 20000).then(function (dati) {
      if (materia !== mat) return;
      var n = normalizzaNobel(dati);
      if (!n.premi.length) {
        var lista = document.getElementById('bsiART-nlista');
        if (!lista) return;
        lista.innerHTML = n.formaRiconosciuta
          ? '<div class="bsiART-stato">' +
            t('La Fondazione ha risposto con un elenco vuoto. Non è un guasto: è una ' +
              'risposta vuota.',
              'The Foundation answered with an empty list. This is not a failure: it is ' +
              'an empty answer.') + '</div>'
          : panicoForma(url, dati, n.totali);
        return;
      }
      conPremi(n.premi);
    }).catch(function (e) {
      var lista = document.getElementById('bsiART-nlista');
      if (lista) lista.innerHTML = panicoRete(url, e);
    });
  }


  /* ── scheda 2 per la matematica · Abel e Fields ─────────────────────── */
  function rendiMatematica(corpo) {
    var url = L.wikidataPremiMat(), mat = 'matematica';
    corpo.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px">' +
      '<input id="bsiART-cerca" placeholder="' +
      t('cerca per anno, argomento, campo o nome…', 'search by year, topic, field or name…') +
      '" style="flex:1;min-width:200px;padding:8px 12px;background:#0f2040;' +
      'border:1px solid #34465f;color:#e8f4ff;border-radius:9px;font-size:13px;' +
      'box-sizing:border-box">' +
      '<select id="bsiART-quale" aria-label="' + t('premio', 'prize') + '" style="padding:8px 10px;' +
      'background:#0f2040;border:1px solid #34465f;color:#e8f4ff;border-radius:9px;font-size:13px">' +
      '<option value="">' + t('Abel e Fields', 'Abel and Fields') + '</option>' +
      '<option value="abel">' + t('solo Premio Abel', 'Abel Prize only') + '</option>' +
      '<option value="fields">' + t('solo Medaglia Fields', 'Fields Medal only') + '</option>' +
      '</select></div>' +
      '<div class="bsiART-stato" id="bsiART-nstato">' +
      t('Chiedo a Wikidata i premiati del Premio Abel e della Medaglia Fields…',
        'Asking Wikidata for the Abel Prize and Fields Medal laureates…') + '</div>' +
      '<div id="bsiART-nlista"></div>';

    var NOMEPREMIO = { abel: ['Premio Abel', 'Abel Prize'], fields: ['Medaglia Fields', 'Fields Medal'] };
    function disegna(premi, filtro, quale) {
      var lista = document.getElementById('bsiART-nlista');
      if (!lista) return;
      var S = MATERIE.matematica.spieg();
      var f = (filtro || '').trim().toLowerCase();
      var mostrati = 0, conSpiegazione = 0, h = '';
      premi.slice().reverse().forEach(function (p) {
        if (quale && p.premio !== quale) return;
        var np = t(NOMEPREMIO[p.premio][0], NOMEPREMIO[p.premio][1]);
        /* ogni premiato ha il suo argomento: le medaglie dello stesso anno
           premiano lavori diversi */
        var blocchi = p.premiati.map(function (x) {
          var testo = [x.motivazione].concat(x.campi).filter(Boolean).join(' | ');
          return { x: x, sp: S ? S.perMotivazione(testo) : null };
        });
        blocchi.forEach(function (b) { if (b.sp) conSpiegazione++; });
        var cerca = (p.anno + ' ' + np + ' ' + blocchi.map(function (b) {
          return b.x.nome + ' ' + b.x.motivazione + ' ' + b.x.campi.join(' ') + ' ' + (b.sp ? b.sp.tit : '');
        }).join(' ')).toLowerCase();
        if (f && cerca.indexOf(f) < 0) return;
        mostrati++;
        h += '<div class="bsiART-card"><h5>' + esc(p.anno) + ' — ' + esc(np) + '</h5>';
        blocchi.forEach(function (b) {
          var x = b.x;
          h += '<div class="bsiART-meta" style="margin-top:8px"><b>' + esc(x.nome) + '</b>' +
               (b.sp ? ' — ' + esc(b.sp.tit) : '') + '</div>';
          if (x.campi.length) {
            h += '<div class="bsiART-campi">' + t('campi di ricerca: ', 'fields of work: ') +
                 esc(x.campi.join(' · ')) + '</div>';
          }
          if (x.motivazione) {
            h += '<div class="bsiART-mot">“' + esc(x.motivazione) + '”<br>' +
              '<span style="font-size:10.5px;color:#c9a46a;font-style:normal">' +
              t('motivazione come registrata in Wikidata (in inglese)',
                'motivation as recorded in Wikidata (in English)') + '</span></div>';
          }
          if (b.sp) {
            h += '<div class="bsiART-sp"><b>' + t('Che cosa è, spiegato', 'What it is, explained') +
              '</b> — ' + b.sp.sp + '<br><span style="font-size:10.5px;color:#7a96b0">' +
              t('spiegazione scritta per questa applicazione e abbinata <b>all’argomento</b> ' +
                '(motivazione e campi di ricerca registrati), non all’anno né alla persona: ' +
                'nessuna attribuzione viene da qui.',
                'explanation written for this application and matched to <b>the topic</b> ' +
                '(recorded motivation and fields of work), not to the year or the person: no ' +
                'attribution comes from here.') + '</span></div>';
          } else {
            h += '<div class="bsiART-stato">' +
              t('Per questo premiato Wikidata non registra un argomento che riconosco: ' +
                'non invento una spiegazione. Le fonti sono qui sotto.',
                'For this laureate Wikidata records no topic I recognise: I do not make up ' +
                'an explanation. The sources are below.') + '</div>';
          }
          var lk = [];
          if (x.qid) lk.push({ n: '🗂️ Wikidata', u: L.wikidata(x.qid) });
          lk.push({ n: '🇮🇹 Wikipedia', u: L.wikiIt(x.nome) });
          h += linkRiga(lk);
        });
        var uff = p.premio === 'abel' ? L.abel() : L.fields();
        h += '<div style="margin-top:6px">' + linkRiga([
          { n: '🏅 ' + t('ente che assegna il premio', 'awarding body'), u: uff },
          { n: '🇮🇹 ' + t('leggi in italiano', 'read in Italian'), u: L.tradotto(uff) },
          { n: '🇮🇹 ' + t('Wikipedia: il premio', 'Wikipedia: the prize'),
            u: L.wikiIt(t(NOMEPREMIO[p.premio][0], NOMEPREMIO[p.premio][1]) + ' ' + p.anno) }
        ]) + '</div></div>';
      });
      var st = document.getElementById('bsiART-nstato');
      if (st) {
        st.innerHTML = '<b>' + premi.length + '</b> ' +
          t('assegnazioni nell’elenco di Wikidata', 'awards in the Wikidata list') +
          ' · <b>' + conSpiegazione + '</b> ' +
          t('premiati con spiegazione scritta', 'laureates with a written explanation') +
          (f || quale ? ' · <b>' + mostrati + '</b> ' + t('mostrati dal filtro', 'shown by the filter') : '') +
          '<br>' + t('Anni, nomi, motivazioni e campi di ricerca vengono da Wikidata, non da ' +
                     'questa applicazione. La matematica non ha un premio Nobel: questi sono ' +
                     'i suoi due riconoscimenti più alti.',
                     'Years, names, motivations and fields of work come from Wikidata, not ' +
                     'from this application. Mathematics has no Nobel Prize: these are its two ' +
                     'highest honours.');
      }
      lista.innerHTML = h || '<div class="bsiART-stato">' +
        t('Nessun premio corrisponde al filtro.', 'No prize matches the filter.') + '</div>';
    }

    function conPremi(premi) {
      cachePremi[mat] = premi;
      var c = document.getElementById('bsiART-cerca'), q = document.getElementById('bsiART-quale');
      function ridisegna() { disegna(premi, c ? c.value : '', q ? q.value : ''); }
      ridisegna();
      if (c) c.oninput = ridisegna;
      if (q) q.onchange = ridisegna;
    }

    if (cachePremi[mat]) { conPremi(cachePremi[mat]); return; }
    prendi(url, 25000).then(function (dati) {
      if (materia !== mat) return;
      var n = normalizzaPremiMat(dati);
      if (!n.premi.length) {
        var lista = document.getElementById('bsiART-nlista');
        if (!lista) return;
        lista.innerHTML = n.formaRiconosciuta && !n.totali
          ? '<div class="bsiART-stato">' +
            t('Wikidata ha risposto con un elenco vuoto. Non è un guasto: è una risposta vuota.',
              'Wikidata answered with an empty list. This is not a failure: it is an empty answer.') +
            '</div>'
          : panicoForma(url, dati, n.totali);
        return;
      }
      conPremi(n.premi);
    }).catch(function (e) {
      var lista = document.getElementById('bsiART-nlista');
      if (lista) lista.innerHTML = panicoRete(url, e);
    });
  }

  function rendi() {
    var corpo = document.getElementById('bsiART-corpo');
    if (!corpo) return;
    if (scheda === 'nobel') rendiNobel(corpo); else rendiUltimi(corpo);
  }

  /* ── il pulsante ─────────────────────────────────────────────────────── */
  function pulsante() {
    var b = document.querySelector('.nav-btn[data-s="' + ID + '"]');
    if (b) return b;
    /* NEL PRIMO GRUPPO, NON NELL'ULTIMO. La barra mostra un gruppo per volta e
       all'apertura mostra il primo: una sezione appesa in fondo a «Utility»,
       diciannovesima di diciannove, c'è ma non la trova nessuno — ed è
       successo: «la sezione articoli non l'ho trovata». Una sezione che non si
       trova vale quanto una sezione che non c'è. Qui va dove si guarda, e in
       cima al gruppo invece che in coda. */
    /* Dalla v237 l'applicazione e' tre app in una e la barra mostra una
       materia per volta: il primo gruppo e' la chimica, e in fisica o in
       matematica la sezione sparirebbe. Utility e' il gruppo COMUNE alle tre
       materie, sempre visibile: la sezione sta li', in cima. */
    var gruppo = document.getElementById('navGroup6') ||
                 document.getElementById('navGroup0');
    if (!gruppo) return null;
    b = document.createElement('button');
    b.className = 'nav-btn';
    b.setAttribute('data-s', ID);
    b.textContent = '📰 ' + t('Articoli', 'Articles');
    if (gruppo.firstElementChild) gruppo.insertBefore(b, gruppo.firstElementChild.nextSibling);
    else gruppo.appendChild(b);
    return b;
  }

  function applica() {
    stile();
    if (!costruisci()) return false;
    intro();
    disegnaTab();
    pulsante();
    return true;
  }

  function avvia() {
    applica();
    /* il contenuto si costruisce quando la sezione si apre, non all'avvio:
       una richiesta di rete all'apertura dell'applicazione è una richiesta
       che nessuno ha chiesto */
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.nav-btn[data-s="' + ID + '"]') : null;
      if (!b) return;
      setTimeout(rendi, 60);
    }, false);
    [500, 1500, 3200].forEach(function (ms) { setTimeout(pulsante, ms); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else avvia();

  document.addEventListener('bsi-lingua', function () {
    intro(); disegnaTab();
    var b = document.querySelector('.nav-btn[data-s="' + ID + '"]');
    if (b) b.textContent = '📰 ' + t('Articoli', 'Articles');
    if (document.getElementById(ID) &&
        getComputedStyle(document.getElementById(ID)).display !== 'none') rendi();
  });

  globale.BSIArticoli = {
    ID: ID, L: L, ARGOMENTI: ARGOMENTI,
    normalizzaArticoli: normalizzaArticoli,
    normalizzaNobel: normalizzaNobel,
    normalizzaPremiMat: normalizzaPremiMat,
    MATERIE: MATERIE,
    materia: function (k) { if (k && MATERIE[k]) { materia = k; argomento = ''; disegnaTab(); rendi(); } return materia; },
    /* chiamata quando si cambia materia dalla barra: la sezione si allinea, e
       chiede alla rete solo se e' aperta in quel momento */
    imposta: function (k) {
      if (!k || !MATERIE[k] || k === materia) return materia;
      materia = k; argomento = ''; disegnaTab();
      var s = document.getElementById(ID);
      if (s && s.offsetParent !== null) rendi();
      return materia;
    },
    rendi: rendi, applica: applica,
    scheda: function (k) { if (k) { scheda = k; disegnaTab(); rendi(); } return scheda; },
    versione: '2.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
