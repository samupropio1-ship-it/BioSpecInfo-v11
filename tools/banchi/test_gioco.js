#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_gioco — il cambio lingua tondo, e «La corsa degli elementi»

   PERCHE' QUESTO BANCO ESISTE

   Un gioco si rompe in modi che non si vedono guardandolo partire. Le tre
   cose che possono andare male in silenzio sono queste:

   1. UN LIVELLO IMPERCORRIBILE. I livelli sono generati a caso, come
      chiesto. Un vuoto piu' largo di quanto un salto copra, o un gradino
      piu' alto di quanto un salto scavalchi, e' un muro invalicabile — e chi
      gioca non ha modo di sapere che e' rotto il livello e non lui. Il salto
      copre 8,6² / (2·0,62) = 59,6 px, cioe' 3,7 tile: quindi il limite e'
      tre tile di gradino e quattro colonne di vuoto, e si verifica su tutti
      i sessanta livelli (dodici per cinque difficolta').

   2. UNA DOMANDA CON DUE RISPOSTE GIUSTE. Le domande sono generate dalle
      tabelle dell'applicazione, e gli intervalli di gruppi diversi si
      accavallano: «⁴J meta» sta a 1–3 Hz e «⁴J allilico» a 0–3 Hz. Pescando
      i distrattori a caso, la prima stesura li ha messi nella stessa
      domanda. In un gioco didattico una domanda ambigua insegna la cosa
      sbagliata.

   3. UN CICLO CHE NON SI FERMA. Un `requestAnimationFrame` lasciato girare
      in una sezione nascosta consuma batteria per sempre e falsa le misure
      di fluidita' di tutte le altre sezioni.

   E una quarta, che in questo progetto e' gia' costata una versione: una
   SEZIONE INVISIBILE. `getComputedStyle(sezione).display !== 'none'` non
   risponde alla domanda «si vede?» — un antenato nascosto basta a
   nasconderla. La risposta e' un riquadro di dimensione non nulla.

   USO   node tools/banchi/test_gioco.js    (serve un server su :8899)
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

  /* ═══ §1 · IL CAMBIO LINGUA, SU DUE VIEWPORT ═══════════════════════════ */
  console.log('Il cambio lingua, tondo, in alto a destra\n');
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }],
                            ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage();
    const err = [];
    pg.on('pageerror', e => err.push(e.message));
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(6000);
    await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

    console.log('── ' + nome + ' ──');
    const s0 = await pg.evaluate(() => window.BSISelLingua.stato());
    att('il pulsante del cambio lingua c’è e si vede', true,
        s0.pulsanteEsiste && s0.pulsanteVisibile);
    att('  · è tondo', true, s0.tondo);
    att('  · sta in alto', true, s0.inAlto);
    att('  · a destra', true, s0.aDestra);
    /* «all'altezza del titolo» si misura: i due riquadri si sovrappongono */
    att('  · e all’altezza del titolo', true, s0.allAltezzaDelTitolo);
    /* il nome accessibile NON è la bandiera: un lettore di schermo che
       incontra 🇮🇹 legge «bandiera dell'Italia», che non dice che cosa fa */
    att('  · con un nome accessibile che dice che cosa fa', true,
        /lingua|language/i.test(s0.nomeAccessibile || ''));

    const s1 = await pg.evaluate(async () => {
      document.getElementById('bsiSL-btn').click();
      await new Promise(r => setTimeout(r, 650));
      return window.BSISelLingua.stato();
    });
    att('si apre in un disco', true, s1.discoAperto);
    att('  · con tutte le lingue', 14, s1.bandiereNelDisco);
    att('  · su due gusci', 2, s1.gusci);
    /* su un telefono un disco da 260 px ancorato a destra uscirebbe dal bordo */
    att('  · e il disco sta dentro lo schermo', true, s1.dentroLoSchermo);

    const cambio = await pg.evaluate(async () => {
      const prima = document.querySelector('.nav-btn[data-s="smol"]').textContent.trim();
      document.querySelector('.bsiSL-f[data-bsi-lingua="en"]').click();
      await new Promise(r => setTimeout(r, 1400));
      const dopo = document.querySelector('.nav-btn[data-s="smol"]').textContent.trim();
      const bandiera = document.getElementById('bsiSL-btn').textContent;
      /* e si torna indietro: la prova nell'altro verso */
      document.getElementById('bsiSL-btn').click();
      await new Promise(r => setTimeout(r, 450));
      document.querySelector('.bsiSL-f[data-bsi-lingua="it"]').click();
      await new Promise(r => setTimeout(r, 1300));
      const tornato = document.querySelector('.nav-btn[data-s="smol"]').textContent.trim();
      return { prima, dopo, bandiera, tornato,
               lingua: window.BSILingue.corrente(),
               chiuso: !document.getElementById('bsiSL-disco').classList.contains('on') };
    });
    att('scegliendo una bandiera la lingua cambia davvero', true,
        cambio.prima !== cambio.dopo);
    console.log('      («' + cambio.prima + '» → «' + cambio.dopo + '»)');
    att('  · e la bandiera del pulsante segue', '🇬🇧', cambio.bandiera);
    att('  · e il disco si chiude', true, cambio.chiuso);
    /* L'ALTRO VERSO: tornando all'italiano il testo torna identico. Senza
       questo, «cambia» potrebbe voler dire «rompe». */
    att('tornando all’italiano il testo è identico a prima', cambio.prima, cambio.tornato);
    att('nessun errore JavaScript', 0, err.length);
    err.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 140)));
    console.log('');
    await ctx.close();
  }

  /* ═══ il resto su una pagina sola ═══════════════════════════════════════ */
  const ctx = await browser.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1100, height: 950 } });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm|ArrayBuffer|crossref|nobelprize|ERR_/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });

  await pg.waitForTimeout(6500);
  await pg.evaluate(() => {
    const g = document.getElementById('bsi-guide'); if (g) g.remove();
    if (window.BSIGioco) window.BSIGioco.suono(false);
  });

  /* ═══ §2 · LE DOMANDE ══════════════════════════════════════════════════ */
  console.log('── Le domande, generate dai dati dell’applicazione ──');
  const dom = await pg.evaluate(() => {
    const D = window.BSIGiocoDomande;
    if (!D) return { manca: true };
    /* `disponibili()` PROVA ogni generatore: «gira» vuol dire «ha prodotto
       una domanda», non «la sua fonte esiste». La differenza è costata un
       generatore morto che nessuno vedeva. */
    const disp = D.disponibili(14);
    const prove = [['1–3 Hz', [1, 3]], ['2500–3300', [2500, 3300]],
                   ['0.7–1.3', [0.7, 1.3]], ['−12 a −15', [-15, -12]],
                   ['1800–1850 + 1740–1790', [1740, 1850]], ['12–18', [12, 18]]];
    const parser = prove.map(p => ({
      testo: p[0], ok: JSON.stringify(D.intervallo(p[0])) === JSON.stringify(p[1]),
      letto: D.intervallo(p[0]) }));
    /* 600 domande: sane, e nessuna ambigua su intervalli */
    let sane = 0, guasti = [], ambigue = [], usati = {};
    const mappa = { 'ir-banda': ['ir', 'wn', 'group'], 'j-accoppiamento': ['jcoup', 'J', 'type'],
                    'h1-spostamento': ['nmr1h', 'ppm', 'group'],
                    'c13-spostamento': ['nmr13c', 'ppm', 'group'] };
    for (let i = 0; i < 600; i++) {
      const q = D.domanda(1 + (i % 5), i * 13 + 7);
      if (!q) { guasti.push('nessuna domanda al giro ' + i); continue; }
      usati[q.id] = 1;
      if (q.opzioni.indexOf(q.giusta) < 0) { guasti.push('giusta fuori dalle opzioni: ' + q.id); continue; }
      if (new Set(q.opzioni).size !== q.opzioni.length) { guasti.push('opzione ripetuta: ' + q.id); continue; }
      if (!q.spiega || !q.provenienza) { guasti.push('senza spiegazione o provenienza: ' + q.id); continue; }
      sane++;
      if (mappa[q.id]) {
        const [tab, campo, key] = mappa[q.id];
        const righe = SPEC_DATA[tab];
        const gi = (righe.filter(r => r[key] === q.giusta)[0] || {})[campo];
        const sovr = q.opzioni.filter(o => o !== q.giusta).filter(o => {
          const r = (righe.filter(x => x[key] === o)[0] || {})[campo];
          return D.siSovrappongono(r, gi);
        });
        if (sovr.length) ambigue.push(q.id + ' | ' + q.domanda.slice(0, 50));
      }
    }
    const a = D.domanda(3, 4242), b = D.domanda(3, 4242), c = D.domanda(3, 4243);
    return {
      quanti: D.quanti, girano: disp.filter(x => x.gira).length,
      fermi: disp.filter(x => !x.gira).map(x => x.id + ' → ' + (x.errore || x.mancanti.join(','))),
      parser: parser, parserSbagliati: parser.filter(p => !p.ok).length,
      sane: sane, guasti: guasti.slice(0, 5), ambigue: ambigue.length,
      esempiAmbigue: ambigue.slice(0, 3), usati: Object.keys(usati).length,
      ripetibile: a.domanda === b.domanda && a.giusta === b.giusta,
      semeAltro: a.domanda !== c.domanda,
      /* ORDINATI: `Object.keys` non promette un ordine, e confrontare la
         stringa unita così com'è faceva fallire il controllo per il motivo
         sbagliato — tutti e quattro giravano, in un ordine diverso dal mio */
      suIntervalli: Object.keys(mappa).sort().map(k => k + ':' +
        (Object.keys(usati).indexOf(k) >= 0 ? 'sì' : 'NO'))
    };
  });
  att('il modulo delle domande è caricato', undefined, dom.manca);
  sopra('generatori di domande', 15, dom.quanti);
  /* la misura che conta: quanti GIRANO, provati, non quanti hanno la fonte */
  att('ogni generatore produce davvero una domanda', dom.quanti, dom.girano);
  dom.fermi.forEach(x => console.log('      ! ' + x));
  att('il lettore di intervalli legge bene i casi noti', 0, dom.parserSbagliati);
  dom.parser.filter(p => !p.ok).forEach(p =>
    console.log('      ! «' + p.testo + '» → ' + JSON.stringify(p.letto)));
  att('600 domande di fila, tutte sane', 600, dom.sane);
  dom.guasti.forEach(x => console.log('      ! ' + x));
  /* NESSUNA DOMANDA CON DUE RISPOSTE GIUSTE: è il difetto che insegna la
     cosa sbagliata senza che nessuno se ne accorga. */
  att('nessuna domanda su intervalli è ambigua', 0, dom.ambigue);
  dom.esempiAmbigue.forEach(x => console.log('      ! ' + x));
  /* e la guardia che impedisce di «risolvere» l'ambiguità spegnendo i
     generatori: quelli su intervalli devono USCIRE */
  att('  · e i generatori su intervalli girano (non sono stati spenti)',
      'c13-spostamento:sì,h1-spostamento:sì,ir-banda:sì,j-accoppiamento:sì',
      dom.suIntervalli.join(','));
  att('a parità di seme la domanda è la stessa', true, dom.ripetibile);
  att('  · e con un seme diverso cambia', true, dom.semeAltro);
  sopra('generatori usati in 600 estrazioni', 15, dom.usati);

  /* ═══ §3 · I LIVELLI ═══════════════════════════════════════════════════ */
  console.log('\n── I livelli: generati a caso, ma percorribili ──');
  const liv = await pg.evaluate(() => {
    const G = window.BSIGioco;
    const esiti = [];
    G.DIFFICOLTA().forEach(d => {
      for (let L = 1; L <= 12; L++) {
        const l = G.generaLivello(L, d, 20260101);
        /* LA REGOLA CHE RENDE PERCORRIBILE UN LIVELLO: due ancore consecutive
           non più lontane di quanto una fionda copra. Si misura qui per conto
           proprio, non si chiede al generatore se è stato bravo. */
        let salto = 0, fuori = 0;
        for (let k = 1; k < l.ancore.length; k++) {
          const a = l.ancore[k - 1], b = l.ancore[k];
          salto = Math.max(salto, Math.hypot(b.x - a.x, b.y - a.y));
        }
        l.ancore.forEach(a => { if (a.y < 8 || a.y > 262) fuori++; });
        /* un cristallo addosso a un'ancora la renderebbe inutilizzabile */
        let crAddosso = 0;
        l.cristalli.forEach(c => {
          l.ancore.forEach(a => {
            if (Math.hypot(a.x - c.x, a.y - c.y) < 20) crAddosso++;
          });
        });
        esiti.push({ d: d.n, L: L, salto: Math.round(salto), fuori, crAddosso,
                     ancore: l.ancore.length, boss: l.boss, finale: l.finale,
                     controlli: l.controlli.length, nemici: l.nemici.length,
                     elementi: l.elementi.length,
                     sparante: l.elementi.some(e => G.SPARA[e.ab]) });
      }
    });
    const a = G.generaLivello(5, G.DIFFICOLTA()[2], 77), b = G.generaLivello(5, G.DIFFICOLTA()[2], 77);
    /* L'ALTRO VERSO: una catena rotta deve essere SEGNALATA da questa misura,
       altrimenti il controllo qui sopra non sta misurando niente */
    const rotto = G.generaLivello(3, G.DIFFICOLTA()[0], 99);
    rotto.ancore[4].x += 400;
    let saltoRotto = 0;
    for (let k = 1; k < rotto.ancore.length; k++) {
      const u = rotto.ancore[k - 1], v = rotto.ancore[k];
      saltoRotto = Math.max(saltoRotto, Math.hypot(v.x - u.x, v.y - u.y));
    }
    return {
      quanti: esiti.length, DIST_MAX: G.DIST_MAX,
      troppoLontane: esiti.filter(e => e.salto > G.DIST_MAX + 0.5).length,
      peggiorSalto: Math.max.apply(null, esiti.map(e => e.salto)),
      saltoRotto: Math.round(saltoRotto),
      ancoreFuori: esiti.filter(e => e.fuori > 0).length,
      cristalliAddosso: esiti.reduce((n, e) => n + e.crAddosso, 0),
      pocheAncore: esiti.filter(e => e.ancore < 12).length,
      bossSenzaSparante: esiti.filter(e => e.boss && !e.sparante).length,
      senzaDueControlli: esiti.filter(e => e.controlli !== 2).length,
      senzaNemici: esiti.filter(e => e.nemici === 0).length,
      quantiBoss: esiti.filter(e => e.boss && e.d === 3).length,
      finali: esiti.filter(e => e.finale && e.d === 3).length,
      ripetibile: JSON.stringify(a.ancore) === JSON.stringify(b.ancore),
      nemiciCrescono: esiti.filter(e => e.d === 1 && e.L === 12)[0].nemici >
                      esiti.filter(e => e.d === 1 && e.L === 1)[0].nemici
    };
  });
  att('livelli generati (12 × 5 difficoltà)', 60, liv.quanti);
  /* IL LIMITE VIENE DAL MOVIMENTO, NON DA UN GUSTO: è la distanza che si copre
     partendo per la tangente alla velocità massima che un legame regge */
  att('nessuna coppia di ancore più lontana di quanto una fionda copra',
      0, liv.troppoLontane);
  console.log('      (il salto peggiore su 60 livelli: ' + liv.peggiorSalto +
              ' px, il limite è ' + liv.DIST_MAX + ')');
  /* …e la stessa misura, su una catena rotta apposta, DEVE accorgersene */
  att('  · e su una catena rotta apposta la misura se ne accorge', true,
      liv.saltoRotto > liv.DIST_MAX);
  att('nessuna ancora fuori dalla provetta', 0, liv.ancoreFuori);
  att('nessun cristallo addosso a un’ancora', 0, liv.cristalliAddosso);
  att('ogni livello ha una catena di ancore', 0, liv.pocheAncore);
  att('ogni livello ha due punti di controllo', 0, liv.senzaDueControlli);
  att('nessun livello è vuoto di radicali', 0, liv.senzaNemici);
  /* un boss senza un elemento che spari sarebbe invincibile */
  att('ogni livello con boss ha un elemento che spara', 0, liv.bossSenzaSparante);
  att('quattro boss in dodici livelli', 4, liv.quantiBoss);
  att('  · e uno solo è il boss finale', 1, liv.finali);
  att('a parità di seme il livello è identico', true, liv.ripetibile);
  att('e il dodicesimo ha più radicali del primo', true, liv.nemiciCrescono);

  /* ═══ §3bis · LA CHIMICA DENTRO IL MOVIMENTO ═══════════════════════════ */
  console.log('\n── Il movimento viene dai numeri veri ──');
  const fis = await pg.evaluate(() => {
    const G = window.BSIGioco;
    const H = G.profilo('H'), He = G.profilo('He'), Pb = G.profilo('Pb'),
          C = G.profilo('C'), O = G.profilo('O'), Na = G.profilo('Na'),
          Cl = G.profilo('Cl'), U = G.profilo('U'), neutro = G.profilo(null);
    return {
      veri: [H, He, Pb, C, U].filter(p => p.vero).length,
      massaH: H.massa, massaPb: Pb.massa,
      saleH: +H.sale.toFixed(2), salePb: +Pb.sale.toFixed(2),
      saleNeutro: +neutro.sale.toFixed(3),
      /* i gusci sono il PERIODO della tavola, non un numero scelto a mano */
      gusciH: H.gusci, gusciU: U.gusci, periodoU: U.periodo,
      /* la lunghezza del legame viene dai raggi atomici veri */
      legameHH: Math.round(G.lunghezzaLegame(H, H)),
      legameUU: Math.round(G.lunghezzaLegame(U, U)),
      /* il tipo di legame viene dalla differenza di elettronegatività */
      CC: G.tipoLegame(C, C), CO: G.tipoLegame(C, O), NaCl: G.tipoLegame(Na, Cl),
      dCC: +Math.abs(C.en - C.en).toFixed(2),
      dCO: +Math.abs(C.en - O.en).toFixed(2),
      dNaCl: +Math.abs(Na.en - Cl.en).toFixed(2),
      /* quanto regge un legame viene dall'energia di ionizzazione */
      tenutaNa: +Na.tenuta.toFixed(2), tenutaF: +G.profilo('F').tenuta.toFixed(2),
      ionNa: Na.ion, ionF: G.profilo('F').ion
    };
  });
  att('i profili vengono dalla tavola periodica dell’app', 5, fis.veri);
  /* PIÙ LEGGERO DELL'ARIA SALE, PIÙ PESANTE AFFONDA — nei due versi */
  att('l’idrogeno sale', true, fis.saleH > 0.9 && fis.massaH < 1.1);
  att('  · e il piombo affonda', true, fis.salePb < -0.9 && fis.massaPb > 200);
  att('  · e senza elemento non si sale né si affonda', 0, fis.saleNeutro);
  att('i gusci sono il periodo della tavola, non un numero a mano',
      fis.periodoU, fis.gusciU);
  att('  · e l’idrogeno ne ha uno solo', 1, fis.gusciH);
  /* il legame fra due atomi grandi è più lungo di quello fra due piccoli */
  att('il legame viene dai raggi atomici: U–U è più lungo di H–H', true,
      fis.legameUU > fis.legameHH);
  console.log('      (H–H ' + fis.legameHH + ' px · U–U ' + fis.legameUU + ' px)');
  att('C–C è covalente (Δχ ' + fis.dCC + ')', 'covalente', fis.CC);
  att('C–O è polare (Δχ ' + fis.dCO + ')', 'polare', fis.CO);
  att('Na–Cl è ionico (Δχ ' + fis.dNaCl + ')', 'ionico', fis.NaCl);
  /* il fluoro ha l'energia di ionizzazione più alta del sodio: i suoi legami
     reggono di più, e il gioco lo deve dire con i numeri veri */
  att('il legame del fluoro regge più di quello del sodio', true,
      fis.tenutaF > fis.tenutaNa && fis.ionF > fis.ionNa);

  /* ═══ §4 · SI GIOCA ════════════════════════════════════════════════════ */
  console.log('\n── Si gioca: dal titolo alla vittoria ──');
  const gioca = await pg.evaluate(async () => {
    const G = window.BSIGioco;
    G.suono(false);
    document.querySelector('.nav-btn[data-s="sgioco"]').click();
    await new Promise(r => setTimeout(r, 900));
    const out = {};
    const sez = document.getElementById('sgioco');
    const r = sez.getBoundingClientRect();
    /* «SI VEDE» = RIQUADRO NON NULLO, non `display !== 'none'` */
    out.sezioneSiVede = !!(sez.offsetParent && r.width > 50 && r.height > 50);
    out.annidata = !!(sez.parentElement && sez.parentElement.closest('.section'));
    out.schermoIniziale = G.schermo();
    document.getElementById('bsiG-gioca').click();
    await new Promise(r2 => setTimeout(r2, 220));
    out.difficolta = [].map.call(document.querySelectorAll('[data-bsi-dif]'),
      b => b.querySelector('b').textContent);
    document.querySelector('[data-bsi-dif="2"]').click();
    await new Promise(r2 => setTimeout(r2, 220));
    document.getElementById('bsiG-via').click();
    await new Promise(r2 => setTimeout(r2, 220));
    out.inGioco = G.schermo() === 'gioco';

    /* SI GIOCA COME SI GIOCA DAVVERO: ci si lega, si pompa, si lascia. A passi
       deterministici, senza dipendere dai fotogrammi. */
    G.fermaCiclo();
    G.tasti('dx', true);
    let preso = null, domanda = null, legati = 0;
    for (let i = 0; i < 9000; i++) {
      const sc = G.schermo();
      if (sc === 'domanda' || sc === 'esitoDomanda') {
        const q = G.domandaAperta();
        if (q && !('giusto' in q)) { domanda = domanda || { area: q.area, opzioni: q.opzioni.length }; G.rispondi(q.giusta); }
        G.chiudiDomanda();
        G.tasti('dx', true);
        continue;
      }
      if (sc !== 'gioco') break;
      const S = G.stato();
      if (!preso && S.elemento) preso = { sim: S.elemento.sim, nome: S.elemento.nome, ab: S.elemento.ab, Z: S.elemento.Z };
      const p = S.p, liv = S.liv;
      let su;
      if (p.legame === null) {
        const k = G.ancoraVicina(liv, p.x, p.y, G.PORTATA, p.ultimo);
        let mira = null, md = 1e9;
        for (const q2 of liv.ancore) {
          const d = Math.hypot(q2.x - p.x, q2.y - p.y);
          if (q2.x > p.x - 30 && d < md) { md = d; mira = q2; }
        }
        su = (k >= 0) || (mira ? mira.y < p.y - 6 : p.y > G.ALTO - 56);
      } else {
        let pros = null;
        for (const q2 of liv.ancore) if (q2.x > p.x + 14) { pros = q2; break; }
        const vel = Math.hypot(p.vx, p.vy);
        if (!pros) su = !(vel > 2.4 && p.vx > 1.6);
        else {
          const dx = pros.x - p.x, dy = pros.y - p.y, dd = Math.hypot(dx, dy) || 1;
          const dot = (p.vx * dx + p.vy * dy) / (dd * (vel || 1));
          su = !(vel > 2.2 && dot > 0.72);
        }
        legati++;
      }
      G.tasti('su', su);
      G.passo();
    }
    out.fotogrammiLegato = legati;
    const S1 = G.stato();
    out.elementoPreso = preso;
    out.domandaVista = domanda;
    out.livelloRaggiunto = S1 ? S1.livello : null;
    out.punti = S1 ? S1.punti : null;
    out.risposteGiuste = S1 ? S1.risposteGiuste : null;
    return out;
  });
  att('la sezione del gioco si vede davvero (riquadro non nullo)', true, gioca.sezioneSiVede);
  att('  · e non è annidata dentro un’altra sezione', false, gioca.annidata);
  att('si parte dal titolo', 'titolo', gioca.schermoIniziale);
  att('le difficoltà sono cinque, con nomi di chimica', 5, gioca.difficolta.length);
  console.log('      (' + gioca.difficolta.join(' · ') + ')');
  att('dal titolo si arriva in partita', true, gioca.inGioco);
  /* il gioco è il legame: se in cinquemila passi non ci si lega mai, quello
     che segue sta misurando qualcos'altro */
  sopra('  · e ci si muove legandosi agli atomi', 200, gioca.fotogrammiLegato);
  /* IL POTENZIAMENTO E' UN ELEMENTO, e il suo nome viene dalla tavola
     periodica dell'applicazione, non riscritto nel gioco */
  att('girando per la provetta si raccoglie un elemento e si diventa quello', true,
      !!(gioca.elementoPreso && gioca.elementoPreso.sim && gioca.elementoPreso.nome));
  if (gioca.elementoPreso) console.log('      (' + gioca.elementoPreso.sim + ' ' +
    gioca.elementoPreso.nome + ' Z' + gioca.elementoPreso.Z + ' → ' + gioca.elementoPreso.ab + ')');
  att('al punto di controllo arriva una domanda a quattro opzioni', 4,
      gioca.domandaVista ? gioca.domandaVista.opzioni : 0);
  if (gioca.domandaVista) console.log('      (' + gioca.domandaVista.area + ')');
  sopra('rispondendo giusto si avanza di livello', 2, gioca.livelloRaggiunto);
  sopra('e si fanno punti', 1, gioca.punti);

  /* ═══ §4bis · IL PILOTA AUTOMATICO ═════════════════════════════════════
     La prova che un livello si attraversa non è una misura geometrica: è
     qualcuno che lo attraversa. Qui gioca un pilota che sa tre cose e basta —
     si lega a quello che trova, spinge sempre nello stesso verso, lascia
     quando sta andando verso il prossimo atomo abbastanza in fretta — e non
     muore, perché quello che si misura è se il PERCORSO si percorre, non se
     un pilota cieco sopravvive ai radicali.

     I semi sono fissi: senza, ogni esecuzione proverebbe dodici livelli
     diversi e non si saprebbe mai se il gioco è peggiorato.
     ═══════════════════════════════════════════════════════════════════════ */
  console.log('\n── Un pilota che sa tre cose attraversa i livelli ──');
  const pil = await pg.evaluate(() => {
    const G = window.BSIGioco, ALTO = G.ALTO;
    function pilota(nLiv, seme, passi, rompi) {
      /* i tasti si azzerano: un tasto rimasto premuto da una prova precedente
         spinge il pilota nel verso opposto, e la misura diventa un'altra */
      ['sx', 'dx', 'su', 'fuoco'].forEach(function (k) { G.tasti(k, false); });
      G.nuovaPartita(1, seme); G.fermaCiclo();
      G.caricaLivello(nLiv); G.schermo('gioco'); G.fermaCiclo();
      const S = G.stato();
      let maxX = S.p.x, fermoDa = 0, altroVerso = 0;
      for (let i = 0; i < passi; i++) {
        /* per l'altro verso: le ancore si tolgono a ogni passo, perché a ogni
           vita persa il livello si rigenera con la catena intera */
        if (rompi && S.liv.ancore.length > 2) S.liv.ancore = S.liv.ancore.slice(0, 2);
        const sc = G.schermo();
        if (sc === 'domanda' || sc === 'esitoDomanda') {
          const q = G.domandaAperta();
          if (q && !('giusto' in q)) G.rispondi(q.giusta);
          G.chiudiDomanda(); continue;
        }
        if (sc !== 'gioco') break;
        const p = S.p, liv = S.liv;
        let su;
        if (p.legame === null) {
          /* libero: si punta all'altezza dell'ancora più vicina, e si tiene
             premuto per salire o per agganciare */
          const k = G.ancoraVicina(liv, p.x, p.y, G.PORTATA, p.ultimo);
          let mira = null, md = 1e9;
          for (const q2 of liv.ancore) {
            const d = Math.hypot(q2.x - p.x, q2.y - p.y);
            if (q2.x > p.x - 30 && d < md) { md = d; mira = q2; }
          }
          su = (k >= 0) || (mira ? mira.y < p.y - 6 : p.y > ALTO - 56);
        } else {
          /* legato: si lascia quando si sta andando verso il prossimo atomo */
          let pros = null;
          for (const q2 of liv.ancore) if (q2.x > p.x + 14) { pros = q2; break; }
          const vel = Math.hypot(p.vx, p.vy);
          if (!pros) su = !(vel > 2.4 && p.vx > 1.6);
          else {
            const dx = pros.x - p.x, dy = pros.y - p.y, dd = Math.hypot(dx, dy) || 1;
            const dot = (p.vx * dx + p.vy * dy) / (dd * (vel || 1));
            su = !(vel > 2.2 && dot > 0.72);
          }
        }
        /* se per quattro secondi non guadagna un pixel, prova a girare
           dall'altra parte: è quello che farebbe chiunque, e serve a misurare
           il livello invece dell'ostinazione del pilota */
        if (altroVerso > 0) { altroVerso--; G.tasti('dx', false); G.tasti('sx', true); }
        else { G.tasti('dx', true); G.tasti('sx', false); }
        G.tasti('su', su);
        S.p.immune = 999; S.invincibile = 999; S.vite = 9;
        G.passo();
        if (S.p.x > maxX + 0.5) { maxX = S.p.x; fermoDa = 0; }
        else if (++fermoDa > 240) { fermoDa = 0; altroVerso = 150; }
      }
      G.tasti('su', false); G.tasti('dx', false); G.tasti('sx', false);
      return +(maxX / (S.liv ? S.liv.largo : 1)).toFixed(2);
    }
    const corse = [];
    for (const seme of [20260101, 777])
      for (let L = 1; L <= 12; L++) corse.push({ seme: seme, L: L, f: pilota(L, seme, 5200, false) });
    return { corse: corse, rotto: pilota(5, 20260101, 5200, true) };
  });
  const fr = pil.corse.map(c => c.f);
  const bene = fr.filter(f => f >= 0.85).length;
  console.log('      ' + pil.corse.map(c => c.L + ':' + c.f).join(' '));
  /* RIFERIMENTO DICHIARATO: oggi sono 21 corse su 24 oltre l'85%, e la
     peggiore arriva al 36%. Non è «tutte», e dirlo è il punto: il pilota è
     cieco e si impunta. Se un giorno questi numeri scendono, qualcosa si è
     rotto nel movimento o nella generazione dei livelli. */
  sopra('almeno 20 corse su 24 oltre l’85% del livello', 20, bene);
  sopra('  · e nessuna si ferma nel primo terzo', 0.15, Math.min.apply(null, fr));
  /* L'ALTRO VERSO: senza ancore non si va da nessuna parte. Se ci si andasse
     lo stesso, questo gioco non sarebbe quello che dice di essere — ed è
     successo: con i primi numeri il pilota senza ancore arrivava al 91%. */
  att('  · togliendo le ancore il pilota non avanza', true, pil.rotto < 0.4);
  console.log('      (senza ancore: ' + Math.round(pil.rotto * 100) + '% del livello)');

  /* il boss di zona, e il boss finale */
  const boss = await pg.evaluate(async (liv) => {
    const G = window.BSIGioco;
    function combatti(nLiv) {
      const S = G.nuovaPartita(1);
      G.caricaLivello(nLiv);
      G.schermo('gioco'); G.fermaCiclo();
      const gar = S.liv.elementi.filter(e => e.garantito)[0];
      if (!gar) return { errore: 'nessun elemento garantito' };
      S.p.x = gar.x; S.p.y = gar.y; G.passo();
      const el = S.elemento ? S.elemento.sim : null;
      S.p.x = S.boss.x - 90;
      let attivato = false;
      for (let i = 0; i < 6000; i++) {
        const sc = G.schermo();
        if (sc === 'domanda' || sc === 'esitoDomanda') {
          const q = G.domandaAperta();
          if (q && !('giusto' in q)) G.rispondi(q.giusta);
          G.chiudiDomanda(); continue;
        }
        if (sc !== 'gioco') break;
        const St = G.stato();
        if (!St) break;
        if (St.boss && St.boss.attivo) attivato = true;
        G.tasti('fuoco', true);
        if (St.boss) { St.p.x = Math.max(60, St.boss.x - 70); St.p.y = St.boss.y; }
        G.passo();
      }
      const F = G.stato();
      return { elemento: el, attivato: attivato, schermo: G.schermo(),
               livello: F ? F.livello : null,
               esito: F && F.finito ? F.finito.esito : null };
    }
    return { zona: combatti(3), finale: combatti(12) };
  });
  att('il boss di zona si attiva avvicinandosi', true, boss.zona.attivato);
  att('  · e con l’elemento garantito si abbatte', true, boss.zona.livello === 4);
  console.log('      (con ' + boss.zona.elemento + ' → livello ' + boss.zona.livello + ')');
  att('il boss finale chiude il gioco con una vittoria', 'vinto', boss.finale.esito);
  console.log('      (con ' + boss.finale.elemento + ')');

  /* ═══ §5 · NON CONSUMA E NON SBORDA ════════════════════════════════════ */
  console.log('\n── Non consuma batteria, e sta nello schermo ──');
  const ciclo = await pg.evaluate(async () => {
    const G = window.BSIGioco;
    document.querySelector('.nav-btn[data-s="sgioco"]').click();
    await new Promise(r => setTimeout(r, 500));
    G.schermo('gioco'); G.avviaCiclo();
    await new Promise(r => setTimeout(r, 300));
    let n = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (f) { n++; return orig(f); };
    await new Promise(r => setTimeout(r, 500));
    const conVista = n;
    /* si cambia sezione: il ciclo deve fermarsi DA SE' */
    document.querySelector('.nav-btn[data-s="spt"]').click();
    await new Promise(r => setTimeout(r, 900));
    n = 0;
    await new Promise(r => setTimeout(r, 600));
    const senzaVista = n;
    window.requestAnimationFrame = orig;
    return { conVista, senzaVista };
  });
  sopra('con la sezione aperta il gioco gira', 5, ciclo.conVista);
  /* L'ALTRO VERSO, ED E' QUELLO CHE CONTA: chiusa la sezione, zero fotogrammi */
  att('  · e chiusa la sezione si ferma del tutto', 0, ciclo.senzaVista);
  await ctx.close();

  /* il telefono: niente sborda, e i tasti si colpiscono col pollice */
  const ctxT = await browser.newContext({ serviceWorkers: 'block',
                                          viewport: { width: 390, height: 844 } });
  const pgT = await ctxT.newPage();
  await pgT.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgT.waitForTimeout(6500);
  const tel = await pgT.evaluate(async () => {
    const g = document.getElementById('bsi-guide'); if (g) g.remove();
    document.querySelector('.nav-btn[data-s="sgioco"]').click();
    await new Promise(r => setTimeout(r, 1200));
    const s = document.getElementById('sgioco');
    const largo = s.clientWidth, fuori = [];
    s.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > largo + 2 && r.height > 2) {
        let sc = false, n = el.parentElement;
        while (n && n !== s) {
          if (/auto|scroll/.test(getComputedStyle(n).overflowX)) { sc = true; break; }
          n = n.parentElement;
        }
        if (!sc) fuori.push(el.tagName + ' ' + Math.round(r.width));
      }
    });
    const com = [].map.call(document.querySelectorAll('#bsiG-comandi button'), b => {
      const q = b.getBoundingClientRect();
      return { nome: b.getAttribute('aria-label'), w: Math.round(q.width), h: Math.round(q.height) };
    });
    return { largo, fuori, com,
             scorre: document.documentElement.scrollWidth - document.documentElement.clientWidth,
             tela: Math.round(document.getElementById('bsiG-tela').getBoundingClientRect().width) };
  });
  att('a 390 px niente sborda dalla sezione', 0, tel.fuori.length);
  tel.fuori.forEach(x => console.log('      ! ' + x));
  att('  · e la pagina non scorre in orizzontale', 0, tel.scorre);
  att('la tela sta nella larghezza', true, tel.tela > 0 && tel.tela <= tel.largo + 2);
  att('i comandi ci sono tutti', 5, tel.com.length);
  /* 44 px è la misura sotto la quale un pollice sbaglia: non è un'opinione,
     è la soglia delle linee guida di accessibilità */
  att('  · e si colpiscono col pollice (≥ 44 px)', 0,
      tel.com.filter(c => c.w < 44 || c.h < 44).length);
  tel.com.filter(c => c.w < 44 || c.h < 44)
    .forEach(c => console.log('      ! ' + c.nome + ' ' + c.w + '×' + c.h));
  att('  · e ognuno ha un nome accessibile', 0,
      tel.com.filter(c => !c.nome || !c.nome.trim()).length);
  await ctxT.close();

  /* ═══════════════════════════════════════════════════════════════════════
     IL TITOLO DISEGNATO E IL MENU' DI PAUSA

     Questi due si provano DENTRO L'APPLICAZIONE, su una finestra da telefono,
     nei due versi dello schermo. Non si guarda il sorgente: si guarda che cosa
     c'è sulla tela e che cosa si riesce a toccare col dito. Il difetto vero
     che questi controlli hanno trovato — la barra di navigazione sopra il menù
     di pausa — nel sorgente non si vedeva: il menù aveva `z-index:10000` e la
     barra 90, e sembrava a posto.
     ═══════════════════════════════════════════════════════════════════════ */
  for (const [verso, vp] of [['in verticale', { width: 390, height: 844 }],
                             ['in orizzontale', { width: 844, height: 390 }]]) {
    const cx = await browser.newContext({ serviceWorkers: 'block', viewport: vp,
                                          hasTouch: true, isMobile: true });
    const pp = await cx.newPage();
    pp.on('pageerror', e => err.push(e.message));
    await pp.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pp.waitForTimeout(6500);
    const m = await pp.evaluate(async () => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      BSIGioco.suono(false);
      document.querySelector('.nav-btn[data-s="sgioco"]').click();
      await new Promise(r => setTimeout(r, 1400));
      const G = BSIGioco;
      const tela = document.getElementById('bsiG-tela');
      const c2 = tela.getContext('2d');
      function impronta() {
        const d = c2.getImageData(0, 0, G.LARGO, G.ALTO).data;
        let acceso = 0, somma = 0;
        for (let i = 0; i < d.length; i += 4) {
          const v = d[i] + d[i + 1] + d[i + 2];
          if (v > 120) acceso++;
          somma = (somma + v * (i % 7 + 1)) % 1e9;
        }
        return { acceso, somma };
      }
      const a = impronta();
      await new Promise(r => setTimeout(r, 420));
      const b = impronta();
      /* il nome è scritto anche in HTML? non deve esserlo: sta nella grafica */
      const inHtml = new RegExp(G.NOME, 'i').test(
        document.getElementById('bsiG-ui').textContent);
      const senzaLettera = G.NOME.split('').filter(ch => !G.FONT[ch]);

      /* ── la pausa ──────────────────────────────────────────────────── */
      G.nuovaPartita(2); G.schermo('gioco');
      await new Promise(r => setTimeout(r, 400));
      document.getElementById('bsiG-pausa').click();
      await new Promise(r => setTimeout(r, 350));
      const inPausa = G.schermo();
      function tastiMenu() {
        return [].map.call(document.querySelectorAll('#bsiG-ui button'), x => {
          const q = x.getBoundingClientRect();
          const el = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
          return { id: x.id || x.getAttribute('data-bsi-lingua') || x.textContent.trim(),
                   ok: q.top >= 0 && q.bottom <= innerHeight && q.left >= 0 &&
                       q.right <= innerWidth && q.width >= 24 && q.height >= 24 &&
                       !!(el && (el === x || x.contains(el))),
                   /* chi c'è sotto il dito, se non è il pulsante */
                   sopra: (el && el !== x && !x.contains(el))
                     ? (el.id || String(el.className).split(' ')[0] || el.tagName) : null };
        });
      }
      const chiusa = tastiMenu();
      document.getElementById('bsiG-guida').click();
      await new Promise(r => setTimeout(r, 250));
      const testoGuida = (document.getElementById('bsiG-guidaT') || {}).textContent || '';
      const aperta = tastiMenu();
      const card = document.querySelector('.bsiG-pau');
      card.scrollTop = card.scrollHeight;
      await new Promise(r => setTimeout(r, 200));
      const inFondo = tastiMenu();
      const raggiunto = {};
      chiusa.concat(aperta, inFondo).forEach(x => { raggiunto[x.id] = raggiunto[x.id] || x.ok; });
      const copertiDa = chiusa.concat(aperta).filter(x => x.sopra).map(x => x.id + '←' + x.sopra);
      /* il cambio lingua dal menù cambia la lingua dell'intera applicazione */
      const prima = BSILingue.corrente();
      const alt = document.querySelector('[data-bsi-lingua="en"]');
      if (alt) alt.click();
      await new Promise(r => setTimeout(r, 600));
      const dopo = BSILingue.corrente();
      const riprendiEn = (document.getElementById('bsiG-riprendi') || {}).textContent || '';
      BSILingue.imposta(prima);
      await new Promise(r => setTimeout(r, 500));
      G.pausa();
      /* in pausa la fisica è ferma: il punteggio e il personaggio non si muovono */
      const x1 = G.stato().p.x;
      await new Promise(r => setTimeout(r, 400));
      const x2 = G.stato().p.x;
      document.getElementById('bsiG-riprendi').click();
      await new Promise(r => setTimeout(r, 300));
      const tornato = G.schermo();
      return {
        nome: G.NOME, senzaLettera, inHtml,
        accesi: a.acceso, animato: a.somma !== b.somma,
        largoNome: G.largoTesto(G.NOME, 5), LARGO: G.LARGO,
        inPausa, quanti: chiusa.length,
        maiRaggiunti: Object.keys(raggiunto).filter(k => !raggiunto[k]),
        copertiDa, guidaCaratteri: testoGuida.trim().length,
        bandiere: chiusa.filter(x => /^[a-z]{2}$/.test(x.id)).length,
        impostazioni: ['bsiG-suono', 'bsiG-pieno2', 'bsiG-abbandona']
          .filter(id => !document.getElementById(id) && !chiusa.some(x => x.id === id)),
        linguaDopo: dopo, riprendiEn, fermo: x1 === x2, tornato
      };
    });
    att('il gioco ha un nome ' + verso, 'ELEMENTIA', m.nome);
    att('  · e ogni sua lettera esiste nel font', 0, m.senzaLettera.length);
    att('  · e ci sta nella tela', true, m.largoNome <= m.LARGO - 20);
    sopra('  · il titolo è disegnato sulla tela', 8000, m.accesi);
    att('  · ed è animato (due fotogrammi diversi)', true, m.animato);
    /* L'ALTRO VERSO: se il nome fosse anche in HTML sarebbe un doppione */
    att('  · e non è ripetuto in HTML', false, m.inHtml);
    att('il tasto ❚❚ apre il menù di pausa ' + verso, 'pausa', m.inPausa);
    sopra('  · con tutte le voci che servono', 18, m.quanti);
    sopra('  · la guida si apre dentro il menù', 300, m.guidaCaratteri);
    sopra('  · le bandiere delle lingue ci sono', 13, m.bandiere);
    att('  · e suono, schermo pieno e abbandona anche', 0, m.impostazioni.length);
    att('  · il cambio lingua dal menù cambia lingua', 'en', m.linguaDopo);
    att('  · e il menù stesso si traduce', true, /resume/i.test(m.riprendiEn));
    /* IL CONTROLLO CHE HA TROVATO IL DIFETTO: nessun pezzo dell'applicazione
       deve stare sopra il menù. Un pulsante che il dito non raggiunge non c'è */
    att('  · ogni voce si tocca col dito', 0, m.maiRaggiunti.length);
    m.maiRaggiunti.forEach(x => console.log('      ! ' + x + ' non si raggiunge'));
    att('  · e niente dell’app ci sta sopra', 0, m.copertiDa.length);
    m.copertiDa.slice(0, 4).forEach(x => console.log('      ! ' + x));
    att('  · in pausa la partita è ferma', true, m.fermo);
    att('  · e «riprendi» torna a giocare', 'gioco', m.tornato);
    await cx.close();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     IL PERSONAGGIO E L'ICONA

     Il personaggio è un ATOMO: il suo colore, la sua dimensione e il numero
     dei suoi gusci vengono dall'elemento che ha addosso. Qui si guarda la
     TELA: con l'elemento il suo colore c'è, senza l'elemento no.
     ═══════════════════════════════════════════════════════════════════════ */
  const cxS = await browser.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1100, height: 950 } });
  const pgS = await cxS.newPage();
  pgS.on('pageerror', e => err.push(e.message));
  await pgS.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgS.waitForTimeout(6500);
  const sp = await pgS.evaluate(async () => {
    const g = document.getElementById('bsi-guide'); if (g) g.remove();
    BSIGioco.suono(false);
    const nav = document.querySelector('.nav-btn[data-s="sgioco"]');
    nav.click();
    await new Promise(r => setTimeout(r, 1400));
    const G = BSIGioco;
    const ico = G.icona();
    const pb = getComputedStyle(nav, '::before');
    const tb = getComputedStyle(document.querySelector('#sgioco .section-title'), '::before');

    G.nuovaPartita(2); G.schermo('gioco'); G.fermaCiclo();
    const S = G.stato();
    const tela = document.getElementById('bsiG-tela');
    const q = tela.getContext('2d');
    function conta(hex) {
      const r = parseInt(hex.slice(1, 3), 16), v = parseInt(hex.slice(3, 5), 16),
            b2 = parseInt(hex.slice(5, 7), 16);
      const px = Math.round(S.p.x - S.cam), py = Math.round(S.p.y);
      const d = q.getImageData(Math.max(0, px - 14), Math.max(0, py - 14), 28, 28).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] === r && d[i + 1] === v && d[i + 2] === b2) n++;
      }
      return n;
    }
    /* un colore che non compare altrove nella scena: il confronto è esatto */
    const colore = G.COLORI.spara;          /* l'ossigeno */
    S.elemento = null; S.profilo = G.profilo(null); G.disegna();
    const senza = conta(colore);
    S.elemento = { sim: 'O', nome: 'Ossigeno', ab: 'spara', z: 8 };
    S.profilo = G.profilo('O');
    G.disegna();
    const con = conta(colore);
    /* e il corpo cambia davvero con l'elemento: l'uranio è più grosso
       dell'idrogeno, e ha più gusci */
    const H = G.profilo('H'), U = G.profilo('U');
    return {
      icona: ico.slice(0, 22), iconaLunga: ico.length,
      testoNav: nav.textContent.trim(),
      iconaNav: pb.backgroundImage.indexOf('data:image/png') > 0 &&
                parseFloat(pb.width) >= 8,
      iconaTitolo: tb.backgroundImage.indexOf('data:image/png') > 0 &&
                   parseFloat(tb.width) >= 8,
      con, senza, corpoH: H.corpo, corpoU: U.corpo, gusciH: H.gusci, gusciU: U.gusci
    };
  });
  att('l’icona è un’immagine, non un file da scaricare', 'data:image/png;base64,',
      sp.icona);
  sopra('  · e non è vuota', 1500, sp.iconaLunga);
  att('  · il pulsante nella barra la mostra', true, sp.iconaNav);
  att('  · e il titolo della sezione anche', true, sp.iconaTitolo);
  att('  · il pulsante porta il nome del gioco', 'ELEMENTIA', sp.testoNav);
  /* NEI DUE VERSI: con l'elemento addosso il suo colore è sul personaggio… */
  sopra('con un elemento addosso il personaggio ne prende il colore', 12, sp.con);
  /* …e senza elemento quel colore non c'è */
  att('  · e senza elemento quel colore non c’è', 0, sp.senza);
  att('  · e l’uranio è più grosso dell’idrogeno, con più gusci', true,
      sp.corpoU > sp.corpoH && sp.gusciU > sp.gusciH);
  console.log('      (H ' + sp.corpoH + ' px/' + sp.gusciH + ' gusci · U ' +
              sp.corpoU + ' px/' + sp.gusciU + ' gusci)');
  await cxS.close();

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await browser.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 110) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 110');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
