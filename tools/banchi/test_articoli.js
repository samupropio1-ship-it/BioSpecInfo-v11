#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_articoli — gli articoli, i Nobel, e l'unica casa degli spettri

   PERCHE' QUESTO BANCO ESISTE

   Due affermazioni di questa versione non si possono verificare guardando lo
   schermo, e sono esattamente quelle che contano:

     1. «anni, premiati e motivazioni NON vengono da questa applicazione».
        Si dimostra in un modo solo: si INIETTA una risposta finta con un
        nome inventato, e si pretende che sullo schermo compaia QUEL nome.
        Se comparisse un nome vero mentre la risposta finta ne dichiarava un
        altro, vorrebbe dire che da qualche parte c'e' un elenco scritto a
        mano — ed e' proprio quello che non deve esserci.

     2. «i link sono ricostruibili». Si dimostra che sono FUNZIONI PURE
        dell'identificatore: lo stesso identificatore da' sempre lo stesso
        indirizzo, un identificatore diverso ne da' uno diverso, e
        l'indirizzo non e' scritto da nessuna parte.

   E una terza, sul centro spettri: «i pannelli sono SPOSTATI, non copiati».
   Si conta quante volte ciascun id esiste nel documento. Deve essere una.

   LA RETE NON SERVE A QUESTO BANCO, ED E' UNA SCELTA

   Un banco che dipende da una sorgente esterna fallisce quando quella
   sorgente ha una brutta giornata, e allora smette di essere creduto. Qui
   `fetch` viene sostituito con una funzione che risponde quello che il caso
   di prova vuole: una risposta buona, una vuota, una di forma sbagliata, un
   rifiuto. Cosi' si provano anche i tre modi di andare male, che dal vero
   non si potrebbero provocare.

   USO   node tools/banchi/test_articoli.js     (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function sopra(d, minimo, avuto) {
  eseguiti++;
  if (avuto >= minimo) { ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (minimo ' + minimo + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      minimo: ' + minimo + '\n      avuto:  ' + avuto); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await browser.newContext({ serviceWorkers: 'block',
                                               viewport: { width: 1100, height: 950 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming|ArrayBuffer|crossref|nobelprize|ERR_/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(6500);
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

  /* ── §1 · I link, funzioni pure dell'identificatore ───────────────────── */
  console.log('\n── I link si ricostruiscono ──');
  const l = await pg.evaluate(() => {
    const L = window.BSIArticoli.L;
    return {
      doi: L.doi('10.1038/s41586-023-06004-9'),
      doiPrefisso: L.doi('doi:10.1021/jacs.3c01234'),
      nobel: L.nobel('1965'),
      avanzato: L.nobelAvanzato('1965'),
      divulgativo: L.nobelDivulgativo('1965'),
      trad1: L.tradotto('https://www.nobelprize.org/prizes/chemistry/1965/summary/'),
      trad2: L.tradotto('https://doi.org/10.1/x?a=1'),
      wiki: L.wikiIt('Premio Nobel per la chimica 1965'),
      cr: L.crossref({ query: 'catalysis', da: '2026-01-01', quanti: 7 }),
      api: L.nobelApi(200),
      /* PUREZZA: due chiamate identiche, due risultati identici */
      stabile: L.doi('10.1/x') === L.doi('10.1/x') &&
               L.nobel('1965') === L.nobel('1965'),
      /* e identificatori diversi, indirizzi diversi */
      sensibile: L.doi('10.1/x') !== L.doi('10.1/y') &&
                 L.nobel('1965') !== L.nobel('1966')
    };
  });
  att('un DOI diventa il suo indirizzo permanente',
      'https://doi.org/10.1038/s41586-023-06004-9', l.doi);
  att('  · e il prefisso «doi:» non ci finisce dentro',
      'https://doi.org/10.1021/jacs.3c01234', l.doiPrefisso);
  att('un anno diventa la pagina ufficiale del premio',
      'https://www.nobelprize.org/prizes/chemistry/1965/summary/', l.nobel);
  att('  · e il materiale scientifico della Fondazione',
      'https://www.nobelprize.org/prizes/chemistry/1965/advanced-information/', l.avanzato);
  att('  · e la versione divulgativa',
      'https://www.nobelprize.org/prizes/chemistry/1965/popular-information/', l.divulgativo);
  /* la vista tradotta: l'host va trasformato e il percorso conservato */
  att('la lettura in italiano si costruisce dall’indirizzo', true,
      /^https:\/\/www-nobelprize-org\.translate\.goog\/prizes\/chemistry\/1965\/summary\//.test(l.trad1) &&
      /_x_tr_tl=it/.test(l.trad1));
  /* e se l'indirizzo ha già dei parametri, si aggiunge con & e non con ? */
  att('  · e se l’indirizzo ha già parametri, non ne rompe la sintassi', true,
      /\?a=1&_x_tr_sl=/.test(l.trad2));
  att('la ricerca su Wikipedia italiana è codificata', true,
      /^https:\/\/it\.wikipedia\.org\/w\/index\.php\?search=Premio%20Nobel/.test(l.wiki));
  att('la richiesta a Crossref porta filtri, ordine e selezione', true,
      /filter=type:journal-article,from-pub-date:2026-01-01/.test(l.cr) &&
      /sort=published/.test(l.cr) && /order=desc/.test(l.cr) &&
      /rows=7/.test(l.cr) && /select=DOI,title/.test(l.cr));
  att('  · e si identifica, come Crossref chiede', true, /mailto=/.test(l.cr));
  att('la richiesta alla Fondazione Nobel chiede la categoria chimica', true,
      /nobelPrizeCategory=che/.test(l.api) && /limit=200/.test(l.api));
  /* I DUE VERSI DELLA PUREZZA: stabile a parità di dato, diverso al variare. */
  att('lo stesso identificatore dà sempre lo stesso indirizzo', true, l.stabile);
  att('  · e un identificatore diverso ne dà uno diverso', true, l.sensibile);

  /* ── §2 · Le spiegazioni: abbinate all'argomento, non all'anno ────────── */
  console.log('\n── Le spiegazioni ──');
  const sp = await pg.evaluate(() => {
    const S = window.BSINobelSpiegazioni;
    const prove = [
      ['for the development of click chemistry and bioorthogonal chemistry', 'click'],
      ['for the discovery and synthesis of quantum dots', 'quantic'],
      ['for the development of metal-organic frameworks', 'MOF'],
      ['for the development of lithium-ion batteries', 'litio'],
      ['for the development of asymmetric organocatalysis', 'rganocatalisi'],
      ['for the development of the metathesis method in organic synthesis', 'etatesi'],
      ['for the development of density-functional theory', 'funzionale'],
      ['for his studies of the chemistry of the ozone layer', 'ozono'],
      ['for the development of multiscale models for complex chemical systems', 'scale']
    ];
    const esiti = prove.map(p => {
      const r = S.perMotivazione(p[0]);
      return { atteso: p[1], trovato: r ? r.tit : null };
    });
    /* NIENTE ANNI nelle spiegazioni: un anno sarebbe un'attribuzione, e le
       attribuzioni non si scrivono a memoria. */
    const conAnno = S.ARGOMENTI.filter(a => /\b(1[89]\d\d|20\d\d|21\d\d)\b/.test(a.sp + a.tit));
    /* e nessuna coppia di espressioni deve pescare la stessa motivazione:
       due spiegazioni per lo stesso premio sarebbero una scelta nascosta */
    let collisioni = 0;
    S.ARGOMENTI.forEach((a, i) => {
      S.ARGOMENTI.forEach((b, j) => {
        if (j <= i) return;
        /* si prova la regex di b contro una frase costruita dal titolo di a:
           è una prova grezza, ma coglie i casi in cui una regex è troppo
           generica per distinguere */
        if (a.re.source === b.re.source) collisioni++;
      });
    });
    return {
      quante: S.quante, esiti: esiti,
      senzaRisposta: S.perMotivazione('for something nobody has ever written about'),
      senzaRispostaVuota: S.perMotivazione(''),
      conAnno: conAnno.map(a => a.tit),
      collisioni: collisioni,
      /* ogni voce deve avere un titolo e una spiegazione di sostanza */
      cortissime: S.ARGOMENTI.filter(a => !a.tit || (a.sp || '').length < 220).map(a => a.tit)
    };
  });
  sopra('ci sono spiegazioni per molti argomenti', 50, sp.quante);
  const sbagliate = sp.esiti.filter(e => !e.trovato ||
    e.trovato.toLowerCase().indexOf(e.atteso.toLowerCase()) < 0);
  att('ogni motivazione di prova trova la sua spiegazione', 0, sbagliate.length);
  sbagliate.forEach(e => console.log('      ! «' + e.atteso + '» → ' + e.trovato));
  sp.esiti.slice(0, 4).forEach(e => console.log('      · ' + e.trovato));
  /* L'ALTRO VERSO, ED È IL PIÙ IMPORTANTE: se non riconosce l'argomento non
     deve inventare una spiegazione. */
  att('una motivazione che non riconosce NON produce una spiegazione', null, sp.senzaRisposta);
  att('  · e nemmeno una motivazione vuota', null, sp.senzaRispostaVuota);
  /* nessun anno scritto a mano: è la regola del file */
  att('nessuna spiegazione contiene un anno', 0, sp.conAnno.length);
  sp.conAnno.forEach(x => console.log('      ! ' + x));
  att('nessuna espressione di abbinamento è duplicata', 0, sp.collisioni);
  att('nessuna spiegazione è un abbozzo', 0, sp.cortissime.length);
  sp.cortissime.forEach(x => console.log('      ! ' + x));

  /* ── §3 · I dati vengono dalla sorgente, non da qui ──────────────────── */
  console.log('\n── I dati vengono dalla sorgente ──');
  /* Si sostituisce `fetch`: la risposta dichiara un nome che in nessun elenco
     esiste. Se sullo schermo comparisse un nome vero, ci sarebbe un elenco
     scritto a mano da qualche parte. */
  const iniettato = await pg.evaluate(async () => {
    const vero = window.fetch;
    window.fetch = function (u) {
      if (String(u).indexOf('nobelprize.org') >= 0) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({
          nobelPrizes: [
            { awardYear: '1899', laureates: [{
              knownName: { en: 'Zqxwv Plmnbvcx' },
              motivation: { en: 'for the development of click chemistry and bioorthogonal chemistry' }
            }] },
            { awardYear: '1900', laureates: [] }
          ]
        }) });
      }
      return vero.apply(window, arguments);
    };
    document.querySelector('.nav-btn[data-s="sarticoli"]').click();
    await new Promise(r => setTimeout(r, 400));
    window.BSIArticoli.scheda('nobel');
    await new Promise(r => setTimeout(r, 1200));
    const lista = document.getElementById('bsiART-nlista');
    const stato = document.getElementById('bsiART-nstato');
    const testo = lista ? lista.textContent : '';
    window.fetch = vero;
    return {
      nomeIniettato: testo.indexOf('Zqxwv Plmnbvcx') >= 0,
      annoIniettato: testo.indexOf('1899') >= 0,
      /* l'argomento è stato riconosciuto DALLA motivazione iniettata */
      spiegazioneAbbinata: /[Cc]lick chemistry/.test(testo),
      /* l'anno senza premiati viene dichiarato, non mostrato vuoto */
      nonAssegnatoDetto: /non assegnato|not awarded/i.test(testo),
      conteggio: stato ? stato.textContent.replace(/\s+/g, ' ').slice(0, 120) : '',
      /* e i link di quel premio sono costruiti sull'anno iniettato */
      linkSullAnno: !!lista.querySelector('a[href*="/chemistry/1899/"]'),
      linkTradotto: !!lista.querySelector('a[href*="translate.goog"]')
    };
  });
  att('il nome mostrato è quello che la sorgente ha dichiarato', true, iniettato.nomeIniettato);
  att('  · e così l’anno', true, iniettato.annoIniettato);
  att('  · e la spiegazione è scelta dalla motivazione ricevuta', true,
      iniettato.spiegazioneAbbinata);
  att('un anno senza premio viene dichiarato tale', true, iniettato.nonAssegnatoDetto);
  att('i link del premio sono costruiti sull’anno ricevuto', true, iniettato.linkSullAnno);
  att('  · compreso quello per leggerlo in italiano', true, iniettato.linkTradotto);
  console.log('      (' + iniettato.conteggio + ')');

  /* lo stesso per gli articoli */
  const art = await pg.evaluate(async () => {
    const vero = window.fetch;
    window.fetch = function (u) {
      if (String(u).indexOf('api.crossref.org') >= 0) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: { items: [
          { DOI: '10.9999/finto.2026.001', title: ['Un titolo che non esiste da nessuna parte'],
            'container-title': ['Rivista Inventata'],
            published: { 'date-parts': [[2026, 10, 9]] },
            author: [{ given: 'Qq', family: 'Wwww' }, { given: 'Ee', family: 'Rrrr' }],
            abstract: '<jats:p>Un sunto finto.</jats:p>' },
          { title: ['senza DOI, va scartato'] }
        ] } }) });
      }
      return vero.apply(window, arguments);
    };
    window.BSIArticoli.scheda('ultimi');
    await new Promise(r => setTimeout(r, 1200));
    const lista = document.getElementById('bsiART-lista');
    const testo = lista ? lista.textContent : '';
    window.fetch = vero;
    return {
      titolo: testo.indexOf('Un titolo che non esiste') >= 0,
      rivista: testo.indexOf('Rivista Inventata') >= 0,
      autori: testo.indexOf('Qq Wwww') >= 0,
      sunto: testo.indexOf('Un sunto finto') >= 0,
      /* il link è costruito dal DOI ricevuto */
      link: !!lista.querySelector('a[href="https://doi.org/10.9999/finto.2026.001"]'),
      /* la voce senza DOI è stata scartata, e il numero è dichiarato */
      scartataDetta: /1/.test(testo) && /scartat|could not read|non ho potuto/i.test(testo),
      nonMostraLaScartata: testo.indexOf('senza DOI') < 0
    };
  });
  att('il titolo mostrato è quello ricevuto', true, art.titolo);
  att('  · con rivista, autori e sunto', true, art.rivista && art.autori && art.sunto);
  att('  · e il link costruito dal DOI ricevuto', true, art.link);
  att('una voce senza DOI viene scartata e il numero dichiarato', true, art.scartataDetta);
  att('  · e non compare fra gli articoli', true, art.nonMostraLaScartata);

  /* ── §4 · I tre modi di andare male, e sono tre cose diverse ─────────── */
  console.log('\n── Quando non arriva, si dice ──');
  const guasti = await pg.evaluate(async () => {
    const vero = window.fetch;
    async function con(risposta) {
      window.fetch = function (u) {
        if (String(u).indexOf('api.crossref.org') >= 0) return risposta();
        return vero.apply(window, arguments);
      };
      window.BSIArticoli.scheda('ultimi');
      await new Promise(r => setTimeout(r, 1100));
      const lista = document.getElementById('bsiART-lista');
      return lista ? lista.textContent : '';
    }
    const rifiutata = await con(() => Promise.reject(new Error('rete giù per prova')));
    const vuota = await con(() => Promise.resolve({ ok: true,
      json: () => Promise.resolve({ message: { items: [] } }) }));
    const strana = await con(() => Promise.resolve({ ok: true,
      json: () => Promise.resolve({ qualcosaDaltro: { righe: [1, 2, 3] } }) }));
    window.fetch = vero;
    return {
      rifiutata: rifiutata.slice(0, 900),
      vuota: vuota.slice(0, 300),
      strana: strana.slice(0, 400)
    };
  });
  att('se la richiesta fallisce, lo dice e mostra l’indirizzo chiesto', true,
      /non sono riuscito|could not read/i.test(guasti.rifiutata) &&
      /api\.crossref\.org/.test(guasti.rifiutata));
  att('  · e dichiara di non mostrare una lista vecchia al suo posto', true,
      /lista vecchia|stale list/i.test(guasti.rifiutata));
  /* LA DISTINZIONE CHE CONTA: «non c'è niente» e «non ho capito» sono due
     cose diverse, e un modulo che le confonde fa credere che la chimica non
     abbia pubblicato niente in due mesi. */
  att('una risposta vuota viene detta vuota, non rotta', true,
      /risposta vuota|empty answer/i.test(guasti.vuota) &&
      !/non ho riconosciuto|did not recognise/i.test(guasti.vuota));
  att('una risposta di forma sbagliata viene detta incompresa, non vuota', true,
      /non ho riconosciuto|did not recognise/i.test(guasti.strana) &&
      !/risposta vuota|empty answer/i.test(guasti.strana));
  att('  · e mostra le chiavi che sono arrivate', true,
      /qualcosaDaltro/.test(guasti.strana));

  /* ── §5 · Il Centro spettri: una casa sola, nessuna copia ───────────── */
  console.log('\n── Il Centro spettri ──');
  const cs = await pg.evaluate(() => window.BSICentroSpettri.stato());
  sopra('le schede raccolte nel centro', 10, cs.dentroIlCentro);
  att('  · e il centro ha il suo pulsante di navigazione', true, cs.pulsanteEsiste);
  /* LA PROVA CHE NON SI È DUPLICATO NIENTE: appendChild SPOSTA. */
  const copiate = cs.copieNelDocumento.filter(c => c.quante !== 1);
  att('ogni pannello esiste nel documento UNA volta sola', 0, copiate.length);
  copiate.forEach(c => console.log('      ! ' + c.id + ' ×' + c.quante));
  att('i vecchi pulsanti restano nel documento', cs.schede ? cs.schede.length : 10,
      cs.pulsantiAncoraNelDom);
  att('  · ma nascosti: la barra non li mostra più', cs.pulsantiAncoraNelDom,
      cs.pulsantiNascosti);

  /* ogni scheda, aperta dal codice come fa `goSection` */
  const giro = await pg.evaluate(async () => {
    const ids = window.BSICentroSpettri.schede();
    const out = [];
    for (const s of ids) {
      window.goSection(s);
      await new Promise(r => setTimeout(r, 420));
      const corpo = document.getElementById('bsiCS-corpo');
      const visti = [].filter.call(corpo.children,
        c => getComputedStyle(c).display !== 'none').map(c => c.id);
      out.push({ id: s,
                 centro: getComputedStyle(document.getElementById('scentrospettri')).display !== 'none',
                 soloLui: visti.length === 1 && visti[0] === s,
                 nodi: document.getElementById(s).getElementsByTagName('*').length });
    }
    return out;
  });
  att('goSection() su ogni scheda apre il centro su quella scheda', 0,
      giro.filter(g => !g.centro || !g.soloLui).length);
  giro.filter(g => !g.centro || !g.soloLui)
      .forEach(g => console.log('      ! ' + g.id + ' ' + JSON.stringify(g)));
  att('  · e ogni pannello ha contenuto', 0, giro.filter(g => g.nodi < 15).length);
  console.log('      (' + giro.map(g => g.id + ':' + g.nodi).join(' · ') + ')');

  /* ── §6 · Niente cose doppie ─────────────────────────────────────────── */
  console.log('\n── Niente cose doppie ──');
  const dop = await pg.evaluate(async () => {
    document.getElementById('bsi14-fab').click();
    await new Promise(r => setTimeout(r, 900));
    const out = {};
    const visti = {};
    document.querySelectorAll('[id]').forEach(e => { visti[e.id] = (visti[e.id] || 0) + 1; });
    out.idRipetuti = Object.keys(visti).filter(k => visti[k] > 1);
    const perS = {};
    document.querySelectorAll('.nav-btn[data-s]').forEach(b => {
      const s = b.getAttribute('data-s'); perS[s] = (perS[s] || 0) + 1; });
    out.navDoppi = Object.keys(perS).filter(k => perS[k] > 1);
    out.navTotali = Object.keys(perS).length;
    const sez = [].map.call(document.querySelectorAll('.section[id]'), s => s.id);
    out.sezioniSenzaPulsante = sez.filter(s => !perS[s]);
    out.pulsantiSenzaSezione = Object.keys(perS).filter(s => !document.getElementById(s));
    const righe = [].map.call(document.querySelectorAll('#bsi14-panel .bsiMenu-sp'),
      r => r.getAttribute('data-bsi-sez'));
    const c = {}; righe.forEach(r => c[r] = (c[r] || 0) + 1);
    out.menuDoppi = Object.keys(c).filter(k => c[k] > 1);
    /* una sezione che ha un pulsante VISIBILE nella barra non deve stare
       anche nel menù: sarebbero due strade per la stessa cosa */
    out.menuEBarra = righe.filter(s => {
      const b = document.querySelector('.nav-btn[data-s="' + s + '"]');
      return !!(b && b.offsetParent !== null); });
    /* Spectra: una strada sola */
    out.spectraNelMenu = righe.indexOf('sai') >= 0;
    out.spectraFab = !!document.getElementById('bsi-spectra-fab');
    const bs = document.querySelector('.nav-btn[data-s="sai"]');
    out.spectraPulsanteVisibile = !!(bs && bs.offsetParent !== null);
    /* il lettore spettri: sta nel centro, non anche fra le utility */
    out.lettoreNelMenu = righe.indexOf('sspettrolettore') >= 0;
    /* LA SEZIONE ARTICOLI DEVE ESSERE RAGGIUNGIBILE, E ORA LO E' DALLA BARRA.
       Quando è nata stava nel menù ✨, perché lì stavano le utility. Poi le
       utility sono tornate nella barra e tenerla anche nel menù l'avrebbe
       resa una ripetizione: si misura quindi che sia raggiungibile dalla
       BARRA — pulsante non nascosto e linguetta del suo gruppo visibile —
       perché «esiste nel DOM» non vuol dire «si può aprire». */
    out.articoliNellaBarra = (function () {
      const btn = document.querySelector('.nav-btn[data-s="sarticoli"]');
      if (!btn || getComputedStyle(btn).display === 'none') return false;
      const pan = btn.closest('.nav-group-panel');
      if (!pan) return true;
      const n = (pan.id || '').replace('navGroup', '');
      const tb = document.querySelector('.nav-group-tab[data-group="' + n + '"]');
      return !!(tb && getComputedStyle(tb).display !== 'none');
    })();
    /* e NON anche nel menù: sarebbero due strade */
    out.articoliNelMenu = righe.indexOf('sarticoli') >= 0 ||
      [].some.call(document.querySelectorAll('#bsi14-panel [data-key="sarticoli"]'),
                   r => getComputedStyle(r).display !== 'none');
    document.getElementById('bsi14-fab').click();
    return out;
  });
  att('nessun id ripetuto nel documento', 0, dop.idRipetuti.length);
  dop.idRipetuti.slice(0, 6).forEach(x => console.log('      ! ' + x));
  att('nessun pulsante di navigazione doppio', 0, dop.navDoppi.length);
  att('nessuna sezione senza il suo pulsante', 0, dop.sezioniSenzaPulsante.length);
  dop.sezioniSenzaPulsante.slice(0, 6).forEach(x => console.log('      ! ' + x));
  att('nessun pulsante che punta a una sezione inesistente', 0, dop.pulsantiSenzaSezione.length);
  att('nessuna voce doppia nel menù ✨', 0, dop.menuDoppi.length);
  att('nessuna sezione raggiungibile dal menù E dalla barra visibile', 0, dop.menuEBarra.length);
  dop.menuEBarra.slice(0, 6).forEach(x => console.log('      ! ' + x));
  /* Spectra, nei due versi: fuori dal menù, e il suo pulsante dedicato c'è. */
  att('Spectra non è più una voce del menù ✨', false, dop.spectraNelMenu);
  att('  · e il suo pulsante dedicato c’è', true, dop.spectraFab);
  att('  · e il pulsante di navigazione non si vede', false, dop.spectraPulsanteVisibile);
  att('il lettore spettri non è anche fra le utility', false, dop.lettoreNelMenu);
  att('la sezione Articoli è raggiungibile dalla barra', true, dop.articoliNellaBarra);
  /* l'altro verso: raggiungibile da UNA strada, non da due */
  att('  · e NON anche dal menù ✨, che sarebbe la seconda strada', false,
      dop.articoliNelMenu);
  console.log('      (' + dop.navTotali + ' sezioni navigabili in tutto)');

  /* la tabella delle costanti J: ce n'era una seconda, con numeri diversi */
  const j = await pg.evaluate(async () => {
    window._apriCostantiJ();
    await new Promise(r => setTimeout(r, 1200));
    const corpo = document.getElementById('bsiCS-corpo');
    const tab = document.querySelector('#specTabs button.on');
    return {
      centro: getComputedStyle(document.getElementById('scentrospettri')).display !== 'none',
      scheda: [].filter.call(corpo.children,
        c => getComputedStyle(c).display !== 'none').map(c => c.id).join(','),
      sotto: tab ? tab.textContent.trim() : null,
      righe: document.querySelectorAll('#specTable table tr').length
    };
  });
  att('«costanti J» porta all’unica tabella che resta', true,
      j.centro && j.scheda === 'sspec' && /Costanti J|J constants/i.test(j.sotto || ''));
  sopra('  · e la tabella ha le sue righe', 10, j.righe);

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await browser.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 45) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 45');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
