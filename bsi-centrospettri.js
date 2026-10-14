/* ═══════════════════════════════════════════════════════════════════════════
   bsi-centrospettri — una sola casa per gli spettri

   IL PROBLEMA

   Le cose che si fanno con uno spettro stavano in NOVE sezioni separate:

     📊 Spettri Ref.    tabelle di riferimento
     📈 IR Visivi       figure di spettri IR
     ⚗️ Spettro MS       frammentazione
     🔗 NMR 2D/NOE      correlazioni
     🌈 UV-Vis          cromofori
     📡 NMR Pred.       predizione per atomo
     🎯 Quiz Spettri    allenamento
     🧩 Elucida         dalla struttura ai dati
     📉 Lettore spettri leggere uno spettro misurato

   Nove voci per una domanda sola — «ho uno spettro, cosa ci faccio?» — sparse
   su due posti diversi (otto nella barra Spettroscopia, una nel menù ✨). Chi
   cerca la predizione NMR la trova dove non pensa, e chi apre «Spettri Ref.»
   non sa che esiste anche il lettore.

   COME SI RISOLVE SENZA ROMPERE NIENTE

   Non si riscrive niente e non si copia niente: si SPOSTANO i nodi. Una
   `appendChild` MUOVE un elemento, non lo duplica — quindi dopo il
   trasferimento ogni pannello esiste ancora, una volta sola, con il suo
   stesso `id`, dentro una scheda del centro. Tutti i `getElementById` e tutti
   i `[data-s=...]`.click() sparsi per l'applicazione continuano a funzionare,
   perché il bersaglio è ancora quello.

   DUE SCELTE CHE VALE LA PENA SPIEGARE

   1. I PULSANTI DELLA BARRA RESTANO, NASCOSTI. Cancellarli sarebbe stato più
      pulito a vedersi e sbagliato: decine di punti dell'applicazione aprono
      una sezione con `goSection()`, che è `[data-s=...]`.click(). Restano, e
      il centro li intercetta.

   2. LA SCHEDA NON APRE LA SEZIONE: CLICCA IL PULSANTE. Sembra un giro
      inutile e non lo è — il gestore del pulsante fa anche
      l'inizializzazione pigra (`initMS()`, `initUVVis()`, `initNOE()`…). Una
      scheda che mostrasse il pannello da sé aprirebbe sezioni vuote la prima
      volta. Una sola strada, quella che già c'era.

   USO   si innesta da sé; `BSICentroSpettri` per il banco.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  var ID = 'scentrospettri';

  /* L'ordine è quello del lavoro, non quello alfabetico: prima quello che hai
     misurato tu, poi la previsione con cui confrontarlo, poi le tecniche una
     per una, poi i riferimenti, poi l'allenamento. */
  function SCHEDE() {
    return [
      { id: 'sspettrolettore', ic: '📉', nm: t('Leggi il tuo spettro', 'Read your spectrum'),
        nota: t('un file, una fotografia, un PDF', 'a file, a photo, a PDF') },
      { id: 'snmrpred', ic: '📡', nm: t('Prevedi NMR', 'Predict NMR'),
        nota: t('¹H e ¹³C assegnati per atomo', '¹H and ¹³C assigned per atom') },
      { id: 'snoe', ic: '🔗', nm: t('NMR 2D e NOE', '2D NMR and NOE'),
        nota: t('COSY, HSQC, HMBC', 'COSY, HSQC, HMBC') },
      { id: 'sms', ic: '⚗️', nm: t('Massa', 'Mass'),
        nota: t('frammentazione e perdite', 'fragmentation and losses') },
      { id: 'sirvis', ic: '📈', nm: t('IR', 'IR'),
        nota: t('bande e gruppi funzionali', 'bands and functional groups') },
      { id: 'suvvis', ic: '🌈', nm: 'UV-Vis',
        nota: t('cromofori e λmax', 'chromophores and λmax') },
      { id: 'sspec', ic: '📊', nm: t('Tabelle di riferimento', 'Reference tables'),
        nota: t('¹H, ¹³C, IR, costanti J', '¹H, ¹³C, IR, J constants') },
      /* `scentro` è il «CENTRO SPETTROSCOPICO» che esisteva già: una sezione
         completa — editor, tutti gli spettri, gruppi funzionali, confronto —
         che però NON aveva un pulsante di navigazione. Si raggiungeva solo
         da `openLegacyCentro()`, e la voce di menù che si chiamava «Centro
         Spettri» apriva un'altra cosa (l'editor ChemDraw). Era un centro
         spettri orfano, con il suo nome dato a qualcos'altro. Qui diventa
         una scheda, e il nome torna dove deve stare. */
      { id: 'scentro', ic: '🌈', nm: t('Tutto su una molecola', 'Everything on one molecule'),
        nota: t('editor, spettri, gruppi, confronto', 'editor, spectra, groups, comparison') },
      { id: 'selucid', ic: '🧩', nm: t('Elucida una struttura', 'Elucidate a structure'),
        nota: t('dai dati a una proposta', 'from the data to a proposal') },
      { id: 'squizspec', ic: '🎯', nm: t('Allenati', 'Practise'),
        nota: t('riconosci il gruppo dallo spettro', 'recognise the group from the spectrum') }
    ];
  }

  var attiva = null;

  function pulsanteDi(sid) {
    return document.querySelector('.nav-btn[data-s="' + sid + '"]');
  }

  /* ── 1. la sezione ────────────────────────────────────────────────────── */
  function stile() {
    if (document.getElementById('bsiCS-stile')) return;
    var s = document.createElement('style');
    s.id = 'bsiCS-stile';
    s.textContent = [
      '#bsiCS-schede{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}',
      '.bsiCS-sc{display:flex;flex-direction:column;align-items:flex-start;gap:1px;',
      ' border:1px solid #1e3a52;background:#0a1628;color:#cfe2f5;border-radius:11px;',
      ' padding:8px 12px;cursor:pointer;font-size:12.5px;font-weight:700;text-align:left;',
      ' transition:border-color .15s,background .15s}',
      '.bsiCS-sc:hover{border-color:#2f5f82;background:#0d1d33}',
      '.bsiCS-sc.on{border-color:#5eead4;background:linear-gradient(135deg,',
      ' rgba(94,234,212,.17),rgba(124,111,255,.09));color:#eafffb}',
      '.bsiCS-sc small{font-weight:500;font-size:10.5px;color:#8aadcc}',
      '.bsiCS-sc.on small{color:#9fe8da}',
      /* I pannelli spostati sono `.section`, quindi nascosti per difetto: la
         scheda attiva li mostra. Il margine di sezione va tolto, perché qui
         sono CONTENUTO e non più pagine a sé. */
      '#bsiCS-corpo>.section{margin:0;padding:0}',
      '#bsiCS-corpo>.section>.section-title{display:none}'
    ].join('');
    document.head.appendChild(s);
  }

  function costruisci() {
    if (document.getElementById(ID)) return document.getElementById(ID);
    var rif = document.getElementById('sspettrolettore');
    if (!rif || !rif.parentNode) return null;
    var d = document.createElement('div');
    d.id = ID;
    d.className = 'section';
    d.innerHTML =
      '<div class="section-title">🔬 ' + t('CENTRO SPETTRI', 'SPECTRA CENTRE') + '</div>' +
      '<div id="bsiCS-intro" style="color:#9fb3c8;font-size:.9rem;margin-bottom:14px;' +
      'max-width:860px;line-height:1.65"></div>' +
      '<div id="bsiCS-schede"></div>' +
      '<div id="bsiCS-corpo"></div>';
    rif.parentNode.insertBefore(d, rif);
    return d;
  }

  function testi() {
    var i = document.getElementById('bsiCS-intro');
    if (i) {
      i.innerHTML = t(
        'Tutto quello che si fa con uno spettro, in un posto solo. Prima stava in ' +
        '<b>nove sezioni</b> sparse in due menù diversi, per una domanda sola: ' +
        '«ho uno spettro, cosa ci faccio?». Le schede qui sotto sono gli stessi ' +
        'pannelli di prima — <b>spostati</b>, non copiati: non esiste una seconda ' +
        'copia di niente.',
        'Everything you do with a spectrum, in one place. It used to live in ' +
        '<b>nine sections</b> across two different menus, for a single question: ' +
        '"I have a spectrum, what do I do with it?". The tabs below are the same ' +
        'panels as before — <b>moved</b>, not copied: there is no second copy of ' +
        'anything.');
    }
  }

  /* ── 2. le schede ─────────────────────────────────────────────────────── */
  function disegnaSchede() {
    var host = document.getElementById('bsiCS-schede');
    if (!host) return 0;
    host.innerHTML = '';
    var n = 0;
    SCHEDE().forEach(function (s) {
      if (!document.getElementById(s.id)) return;
      var b = document.createElement('button');
      b.className = 'bsiCS-sc' + (s.id === attiva ? ' on' : '');
      b.setAttribute('data-bsi-sc', s.id);
      b.innerHTML = '<span>' + s.ic + ' ' + s.nm + '</span><small>' + s.nota + '</small>';
      /* LA SCHEDA CLICCA IL PULSANTE, non apre il pannello: il gestore del
         pulsante fa anche l'inizializzazione pigra. Una sola strada. */
      b.onclick = function () {
        var p = pulsanteDi(s.id);
        if (p) p.click(); else mostra(s.id);
      };
      host.appendChild(b);
      n++;
    });
    return n;
  }

  /* ── 3. il trasferimento ─────────────────────────────────────────────── */
  function trasferisci() {
    var corpo = document.getElementById('bsiCS-corpo');
    if (!corpo) return 0;
    var n = 0;
    SCHEDE().forEach(function (s) {
      var sez = document.getElementById(s.id);
      if (!sez) return;
      if (sez.parentNode === corpo) { n++; return; }
      /* `appendChild` SPOSTA: dopo questa riga il pannello non esiste più
         dove stava, ed esiste qui. Una sola copia, sempre. */
      corpo.appendChild(sez);
      sez.setAttribute('data-bsi-centro', 'spettri');
      n++;
    });
    return n;
  }

  /* UN PULSANTE NASCOSTO PER CHI NON CE L'HA.
     `scentro` non aveva nessun pulsante di navigazione, e senza pulsante la
     scheda non potrebbe usare l'unica strada buona — quella che fa anche
     l'inizializzazione pigra (`initCentro`, elencata nella mappa degli init
     dell'applicazione). Gliene si crea uno, nascosto: così tutte le schede
     passano per la stessa porta e non c'è un caso speciale da ricordare. */
  function assicuraPulsante(sid, etichetta) {
    if (pulsanteDi(sid)) return true;
    var gruppo = document.getElementById('navGroup1');
    if (!gruppo) return false;
    var b = document.createElement('button');
    b.className = 'nav-btn';
    b.setAttribute('data-s', sid);
    b.setAttribute('data-bsi-creato', 'centro');
    /* NESSUNA ETICHETTA VISIBILE, e non per distrazione: questo pulsante non
       è un elemento d'interfaccia, è un bersaglio per `goSection()`. Con
       dentro il suo identificatore («scentro») diventava un testo di
       scheletro che nessuna lingua traduce — e il banco delle lingue l'ha
       segnalato subito come stringa non tradotta. Un bersaglio non parla. */
    /* L'ETICHETTA C'E', ANCHE SE IL PULSANTE NON SI VEDE.
       Prima ci avevo messo l'identificatore («scentro»), e il banco delle
       lingue l'ha segnalato come testo non tradotto — giustamente: un
       testo nel documento o e' tradotto come tutti gli altri o non e' un
       testo. Poi l'avevo svuotato, e restava comunque un elemento di
       navigazione senza nome. La risposta giusta e' la piu' semplice: il
       pulsante porta lo stesso nome della sua scheda, tradotto dal
       dizionario come ogni altra voce di navigazione. */
    b.textContent = etichetta || sid;
    b.setAttribute('aria-hidden', 'true');
    b.tabIndex = -1;
    b.style.display = 'none';
    gruppo.appendChild(b);
    return true;
  }

  function nascondiPulsanti() {
    var n = 0;
    SCHEDE().forEach(function (s) {
      assicuraPulsante(s.id, s.ic + ' ' + s.nm);
      var b = pulsanteDi(s.id);
      if (!b) return;
      /* nascosto, non rimosso: è il bersaglio di `goSection()` */
      b.style.display = 'none';
      b.setAttribute('aria-hidden', 'true');
      b.setAttribute('data-bsi-spostato', 'centro');
      b.tabIndex = -1;
      n++;
    });
    return n;
  }

  /* ── 4. il pulsante del centro ───────────────────────────────────────── */
  function pulsanteCentro() {
    var b = pulsanteDi(ID);
    if (b) return b;
    var gruppo = document.getElementById('navGroup1');
    if (!gruppo) return null;
    b = document.createElement('button');
    b.className = 'nav-btn';
    b.setAttribute('data-s', ID);
    b.textContent = '🔬 ' + t('Centro spettri', 'Spectra centre');
    b.style.cssText = 'border:1px solid #5eead4;background:linear-gradient(135deg,' +
      'rgba(94,234,212,.16),rgba(124,111,255,.1))';
    b.onclick = function () { apri(attiva || SCHEDE()[0].id); };
    gruppo.insertBefore(b, gruppo.firstChild);
    return b;
  }

  /* ── 5. mostrare ─────────────────────────────────────────────────────── */
  function mostra(sid) {
    var hub = document.getElementById(ID);
    var corpo = document.getElementById('bsiCS-corpo');
    if (!hub || !corpo) return false;
    attiva = sid;
    /* il centro è la sezione aperta */
    [].forEach.call(document.querySelectorAll('.section'), function (x) {
      if (x === hub || x.parentNode === corpo) return;
      x.classList.remove('on');
    });
    hub.classList.add('on');
    hub.style.display = 'block';
    [].forEach.call(document.querySelectorAll('.nav-btn'), function (x) {
      x.classList.remove('on');
    });
    var pc = pulsanteDi(ID);
    if (pc) pc.classList.add('on');
    /* dentro il centro, una scheda sola */
    [].forEach.call(corpo.children, function (x) {
      var suo = (x.id === sid);
      x.classList.toggle('on', suo);
      x.style.display = suo ? 'block' : 'none';
    });
    [].forEach.call(document.querySelectorAll('.bsiCS-sc'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-bsi-sc') === sid);
    });
    return true;
  }

  function apri(sid) {
    var p = pulsanteDi(sid);
    if (p) { p.click(); return true; }      /* il gestore fa anche l'init */
    return mostra(sid);
  }

  /* ── 6. l'intercettazione ────────────────────────────────────────────── */
  /* Il gestore originale dei `.nav-btn` toglie `on` a TUTTE le sezioni e
     mostra quella richiesta. Ora quella sezione sta DENTRO il centro, che
     resta spento: si vedrebbe un pannello in una pagina invisibile. Si
     lascia fare al gestore originale (che inizializza) e subito dopo si
     rimette a posto il contorno. Nessuna ricorsione: `mostra` non clicca. */
  function intercetta() {
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.nav-btn[data-s]') : null;
      if (!b) return;
      var sid = b.getAttribute('data-s');
      if (sid === ID) { setTimeout(function () { mostra(attiva || SCHEDE()[0].id); }, 0); return; }
      var nostra = SCHEDE().some(function (s) { return s.id === sid; });
      if (!nostra) return;
      setTimeout(function () { mostra(sid); }, 0);
    }, false);
  }

  /* ── 7. quando ───────────────────────────────────────────────────────── */
  var fatto = false;
  function applica() {
    stile();
    if (!costruisci()) return false;
    testi();
    nascondiPulsanti();          /* crea i pulsanti mancanti e li nasconde */
    var spostati = trasferisci();
    pulsanteCentro();
    disegnaSchede();
    if (!attiva) attiva = SCHEDE()[0].id;
    fatto = spostati > 0;
    return fatto;
  }

  function avvia() {
    applica();
    intercetta();
    /* la barra può essere ricostruita da altro codice: si riapplica a tratti
       nei primi secondi, poi si smette — come fa `bsi-menu.js` */
    [400, 1200, 2600, 5000].forEach(function (ms) {
      setTimeout(function () { nascondiPulsanti(); pulsanteCentro(); }, ms);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else avvia();

  document.addEventListener('bsi-lingua', function () {
    testi(); disegnaSchede();
    var b = pulsanteDi(ID);
    if (b) b.textContent = '🔬 ' + t('Centro spettri', 'Spectra centre');
  });

  globale.BSICentroSpettri = {
    ID: ID,
    schede: function () { return SCHEDE().map(function (s) { return s.id; }); },
    apri: apri, mostra: mostra, applica: applica,
    /* per il banco: che cosa è dove, misurato nel documento */
    stato: function () {
      var corpo = document.getElementById('bsiCS-corpo');
      var ids = SCHEDE().map(function (s) { return s.id; });
      return {
        sezioneEsiste: !!document.getElementById(ID),
        pulsanteEsiste: !!pulsanteDi(ID),
        dentroIlCentro: corpo ? ids.filter(function (i) {
          var e = document.getElementById(i);
          return !!(e && e.parentNode === corpo);
        }).length : 0,
        /* la prova che non si è duplicato niente */
        copieNelDocumento: ids.map(function (i) {
          return { id: i, quante: document.querySelectorAll('#' + i).length };
        }),
        pulsantiNascosti: ids.filter(function (i) {
          var b = pulsanteDi(i);
          return !!(b && getComputedStyle(b).display === 'none');
        }).length,
        pulsantiAncoraNelDom: ids.filter(function (i) { return !!pulsanteDi(i); }).length,
        schedeDisegnate: document.querySelectorAll('.bsiCS-sc').length,
        attiva: attiva
      };
    },
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
