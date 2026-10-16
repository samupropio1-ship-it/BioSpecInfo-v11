#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_atomic — ATOMIC PROTOCOL, e il cambio lingua tondo

   PERCHE' QUESTO BANCO ESISTE

   Un gioco di esplorazione si rompe in modi che non si vedono guardandolo
   partire:

   1. UNA STANZA IRRAGGIUNGIBILE. I venti livelli sono generati da un seme:
      una porta scritta in un verso solo, o un guardiano senza gli elementi
      per batterlo, e un livello diventa impossibile. Qui si generano tutti
      e venti e si percorre il grafo di ognuno, e si contano gli atomi di
      ogni equazione.

   2. UN ENIGMA O UN BOSS CHE SI RISOLVE PREMENDO A CASO. Il guardiano ha una
      debolezza chimica: usare la cosa sbagliata NON deve funzionare. E'
      questo che rende il gioco di chimica, e si misura nei due versi.

   3. UN'IMPOSTAZIONE CHE NON SI RICORDA. Visuale e difficolta' si scelgono e
      devono restare: si scrivono nel deposito locale e si rileggono.

   4. UN CICLO CHE NON SI FERMA. Un `requestAnimationFrame` lasciato girare in
      una sezione nascosta consuma batteria per sempre.

   E una quinta, che in questo progetto e' gia' costata una versione: una
   SEZIONE INVISIBILE. `display !== 'none'` non risponde alla domanda «si
   vede?»: la risposta e' un riquadro di dimensione non nulla.

   USO   node tools/banchi/test_atomic.js    (serve un server su :8899)
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
  const browser = await chromium.launch({ executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader'] });

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


  /* ═══ §3 · I VENTI LIVELLI: SI ARRIVA DAPPERTUTTO? ═════════════════════ */
  console.log('\n── Cento livelli generati: tutti percorribili, tutti vincibili ──');
  const liv = await pg.evaluate(() => {
    const A = window.BSIAtomicLivelli;
    const out = { livelli: 0, irraggiungibili: [], zoppe: [], sovrapposte: [], senza: [],
                  bossMancanti: [], bossInvincibili: [], deterministici: 0, boss: [] };
    for (let n = 1; n <= A.LIVELLI; n++) {
      const L = A.livello(n);
      out.livelli++;
      const perId = {};
      L.stanze.forEach(s => { perId[s.id] = s; });
      /* ogni porta ha la sua gemella: se da A si va in B, da B si torna in A */
      L.stanze.forEach(s => s.porte.forEach(p => {
        const altra = perId[p.a];
        if (!altra || !altra.porte.some(q => q.a === s.id)) out.zoppe.push(n + ':' + s.id + '→' + p.a);
      }));
      /* dalla partenza si arriva a ogni stanza */
      const visti = {}, coda = [L.partenza.stanza];
      while (coda.length) {
        const id = coda.shift(); if (visti[id]) continue; visti[id] = 1;
        perId[id].porte.forEach(p => { if (!visti[p.a]) coda.push(p.a); });
      }
      if (Object.keys(visti).length !== L.stanze.length) out.irraggiungibili.push(n);
      /* nessuna stanza dentro un'altra */
      for (let i = 0; i < L.stanze.length; i++) for (let j = i + 1; j < L.stanze.length; j++) {
        const a = L.stanze[i], b = L.stanze[j];
        if (Math.abs(a.x - b.x) < (a.larg + b.larg) / 2 - 0.1 &&
            Math.abs(a.z - b.z) < (a.prof + b.prof) / 2 - 0.1) out.sovrapposte.push(n);
      }
      const ogg = [].concat(...L.stanze.map(s => s.oggetti));
      const tipi = {}; ogg.forEach(o => { tipi[o.tipo] = (tipi[o.tipo] || 0) + 1; });
      ['banco', 'terminale', 'uscita'].forEach(k => { if (tipi[k] !== 1) out.senza.push(n + ':' + k); });
      if (!!L.boss !== (n % A.PER_ZONA === 0) || (L.boss && tipi.boss !== 1)) out.bossMancanti.push(n);
      if (L.boss) {
        const ar = L.stanze.find(s => s.ruolo === 'boss');
        if (!ar || ar.larg < 14 || ar.prof < 14) out.arenePiccole = (out.arenePiccole || 0) + 1;
        out.modelli = (out.modelli || []).concat(L.boss.modello);
      }
      /* PRIMA DI UN GUARDIANO CI SONO GLI ELEMENTI PER BATTERLO: un
         guardiano invincibile perché il livello non ha messo il sodio è un
         gioco rotto, non difficile */
      if (L.boss) {
        out.boss.push(L.boss.nome + ' (' + L.boss.fasi.length + ' fasi)');
        const el = new Set(ogg.filter(o => o.tipo === 'elemento').map(o => o.sim));
        const R = A.RICETTE();
        L.boss.fasi.forEach(f => {
          if (f.serve === 'qualunque' || /^enigma:/.test(f.serve)) return;
          const r = R.find(x => x.id === f.serve);
          const serve = r ? [].concat(...r.reagenti.map(e => {
            const sub = R.find(x => x.id === e); return sub ? sub.reagenti : [e]; })) : [f.serve];
          serve.forEach(e => { if (!el.has(e)) out.bossInvincibili.push(n + ':' + e); });
        });
      }
      /* lo stesso numero dà lo stesso livello: il seme è il numero */
      if (JSON.stringify(A.livello(n).stanze.map(s => [s.id, s.larg, s.prof])) ===
          JSON.stringify(L.stanze.map(s => [s.id, s.larg, s.prof]))) out.deterministici++;
    }
    /* le registrazioni: trenta, tutte collocate in qualche livello */
    const regs = new Set();
    for (let n = 1; n <= A.LIVELLI; n++) A.livello(n).stanze.forEach(st => st.oggetti.forEach(o => { if (o.tipo === 'registratore') regs.add(o.reg); }));
    out.registrazioni = A.REGISTRAZIONI().length;
    out.regCollocate = regs.size;
    out.regVoci = A.REGISTRAZIONI().every(r => A.VOCI()[r.voce] && r.testo.length > 40);
    /* le equazioni: si contano gli atomi, nei due versi */
    const R = A.RICETTE();
    out.ricette = R.length;
    out.bilanciate = R.filter(A.bilanciata).length;
    const finta = JSON.parse(JSON.stringify(R[1]));
    finta.bilancio[2][0][1] = 1;         /* H₂ + Cl₂ → 1 H … : non torna */
    out.fintaRespinta = !A.bilanciata(finta);
    /* gli enigmi: quattro opzioni diverse, la giusta fra queste, un perché */
    out.enigmiGuasti = [];
    ['riconosci', 'nomina', 'bilancia', 'dna', 'costruisci'].forEach(tp => {
      for (let i = 1; i <= 40; i++) {
        const e = A.enigma(tp, A.Caso(i * 7));
        if (e.tipo === 'costruisci') { if (!e.catena || !e.catena.length) out.enigmiGuasti.push(tp); continue; }
        if (e.opzioni.length !== 4 || new Set(e.opzioni).size !== 4 ||
            e.opzioni.indexOf(e.giusta) < 0 || !e.perche) { out.enigmiGuasti.push(tp + ' ' + e.opzioni.join('|')); break; }
      }
    });
    const dna = A.enigma('dna', A.Caso(5));
    const comp = { A: 'T', T: 'A', G: 'C', C: 'G' };
    out.dnaGiusto = dna.giusta === dna.dna.split('').map(x => comp[x]).join('');
    return out;
  });
  att('i livelli sono cento', 100, liv.livelli);
  att('  · da ogni partenza si arriva a ogni stanza', 0, liv.irraggiungibili.length);
  liv.irraggiungibili.forEach(x => console.log('      ! livello ' + x));
  att('  · ogni porta ha la sua gemella', 0, liv.zoppe.length);
  liv.zoppe.slice(0, 3).forEach(x => console.log('      ! ' + x));
  att('  · nessuna stanza sta dentro un’altra', 0, liv.sovrapposte.length);
  att('  · ognuno con un banco, un terminale e un’uscita', 0, liv.senza.length);
  liv.senza.slice(0, 3).forEach(x => console.log('      ! ' + x));
  att('un guardiano ogni dieci livelli, e solo lì', 0, liv.bossMancanti.length);
  att('  · dieci guardiani, tutti diversi', 10, new Set(liv.modelli).size);
  att('  · e ogni arena è larga almeno 14 m', 0, liv.arenePiccole || 0);
  console.log('      (' + liv.boss.join(' · ') + ')');
  att('  · e prima di ognuno ci sono gli elementi per batterlo', 0, liv.bossInvincibili.length);
  liv.bossInvincibili.slice(0, 3).forEach(x => console.log('      ! manca ' + x));
  att('lo stesso numero dà sempre lo stesso livello', 100, liv.deterministici);
  att('le registrazioni sono trenta', 30, liv.registrazioni);
  att('  · tutte collocate nei livelli', 30, liv.regCollocate);
  att('  · ognuna con la sua voce e un testo vero', true, liv.regVoci);
  sopra('ricette di sintesi', 10, liv.ricette);
  att('  · tutte bilanciate, atomo per atomo', liv.ricette, liv.bilanciate);
  /* L'ALTRO VERSO: il contatore di atomi deve accorgersi di un errore */
  att('  · e un’equazione sbagliata viene respinta', true, liv.fintaRespinta);
  att('gli enigmi generati sono sani (4 opzioni distinte, giusta inclusa)', 0, liv.enigmiGuasti.length);
  liv.enigmiGuasti.slice(0, 3).forEach(x => console.log('      ! ' + x));
  att('  · e il filamento complementare è davvero complementare', true, liv.dnaGiusto);

  /* ═══ §4 · I MURI SONO MURI ════════════════════════════════════════════ */
  console.log('\n── Dentro si cammina, fuori no ──');
  const muri = await pg.evaluate(async () => {
    const A = window.BSIAtomic;
    A.scriviImp('suono', 'spento');
    localStorage.removeItem('bsi-ap-partita'); localStorage.removeItem('bsi-ap-livelloMax');
    document.querySelector('.nav-btn[data-s="sgioco"]').click();
    await new Promise(r => setTimeout(r, 2500));
    A.nuovaPartita(1); A.cominciaPartita();
    await new Promise(r => setTimeout(r, 400));
    const S = A.stato(), M = A.mondo();
    const st = M.zona.stanze[0];
    const out = {};
    out.dentro = A.puoStare(st.x, st.z);
    out.fuori = A.puoStare(st.x + st.larg / 2 + 40, st.z);
    /* contro un muro senza porta non si passa */
    const versi = { nord: [0, -1], sud: [0, 1], est: [1, 0], ovest: [-1, 0] };
    const libero = Object.keys(versi).filter(v => !st.porte.some(p => p.verso === v))[0];
    const [mx, mz] = versi[libero];
    S.pos.x = st.x; S.pos.z = st.z; S.ang = Math.atan2(-mx, -mz);
    A.tasti('su', true);
    for (let i = 0; i < 400; i++) A.passo();
    A.tasti('su', false);
    out.bloccatoDalMuro = A.stanzaDi(S.pos.x, S.pos.z) === st;
    /* e attraverso la porta si cambia stanza */
    const porta = st.porte[0];
    const [px, pz] = versi[porta.verso];
    S.pos.x = st.x; S.pos.z = st.z; S.ang = Math.atan2(-px, -pz);
    A.tasti('su', true);
    for (let i = 0; i < 500 && A.stanzaDi(S.pos.x, S.pos.z) === st; i++) A.passo();
    for (let i = 0; i < 20; i++) A.passo();
    A.tasti('su', false);
    const dove = A.stanzaDi(S.pos.x, S.pos.z);
    out.passataLaPorta = !!(dove && dove.id === porta.a);
    out.stanzaRaggiunta = dove ? dove.nome : null;
    return out;
  });
  att('dentro una stanza si può stare', true, muri.dentro);
  /* L'ALTRO VERSO: fuori dai muri no. Se si potesse, la misura sopra non
     direbbe niente */
  att('  · e fuori dai muri no', false, muri.fuori);
  att('camminando contro un muro non si passa', true, muri.bloccatoDalMuro);
  att('  · e attraversando la porta si arriva nella stanza dall’altra parte', true, muri.passataLaPorta);
  console.log('      (arrivato in ' + muri.stanzaRaggiunta + ')');

  /* ═══ §5 · UN LIVELLO DALL'INIZIO ALLA FINE ════════════════════════════ */
  console.log('\n── Livello 1: elementi, sintesi, terminale, ascensore, salvataggio ──');
  const giro = await pg.evaluate(async () => {
    const A = window.BSIAtomic;
    A.nuovaPartita(1); A.cominciaPartita();
    await new Promise(r => setTimeout(r, 300));
    const S = A.stato(), M = A.mondo(), out = {};
    const tutti = [].concat(...M.zona.stanze.map(st => st.oggetti.map(o => ({ o, st }))));
    function vaiDavanti(x) {
      /* un passo davanti all'oggetto, dal lato libero */
      for (const [dx, dz] of [[0, 1.1], [0, -1.1], [1.1, 0], [-1.1, 0], [0, 1.6], [1.6, 0]]) {
        const px = x.st.x + x.o.x + dx, pz = x.st.z + x.o.z + dz;
        if (A.puoStare(px, pz)) {
          /* e lo si guarda: il bersaglio è quello che si ha davanti */
          S.pos.x = px; S.pos.z = pz; S.ang = Math.atan2(dx, dz); A.passo(); return true;
        }
      }
      S.pos.x = x.st.x + x.o.x; S.pos.z = x.st.z + x.o.z + 1; A.passo(); return false;
    }
    /* tutti gli elementi */
    tutti.filter(x => x.o.tipo === 'elemento').forEach(x => {
      vaiDavanti(x);
      if ((A.bersaglio() || {}).tipo === 'elemento') A.interagisci();
    });
    out.inventario = S.inventario.map(x => x.sim).sort().join(',');
    out.padronanza = S.inventario[0] ? S.inventario[0].padronanza : 0;
    /* la scheda di sintesi */
    const fogli = tutti.filter(x => x.o.tipo === 'foglio' && x.o.ricetta);
    out.schede = fogli.map(x => x.o.ricetta);
    fogli.forEach(x => { vaiDavanti(x); if ((A.bersaglio() || {}).tipo === 'foglio') { A.interagisci(); A.schermo('gioco'); } });
    out.ricetteDopoFoglio = S.ricette.filter(x => x.sbloccata).map(x => x.id);
    /* al banco */
    const banco = tutti.find(x => x.o.tipo === 'banco');
    vaiDavanti(banco);
    out.bersaglioBanco = (A.bersaglio() || {}).tipo;
    const r1 = A.ricettaPer(['H', 'Cl']);
    out.ricettaTrovata = r1 ? r1.formula : null;
    /* L'ALTRO VERSO: una coppia che non reagisce non deve produrre niente */
    out.coppiaAssurda = A.ricettaPer(['H', 'H']);
    out.ignota = A.ricettaPer(['S', 'O', 'H']);     /* esiste, ma non la conosci */
    if (r1) A.sintetizza(r1);
    out.composti = S.composti.map(c => c.id + '×' + c.dosi);
    out.equazioneNelCodex = S.codex.reazioni.length;
    A.schermo('gioco');
    /* il residuo: il sale non lo scioglie, il cloro sì */
    const res = tutti.find(x => x.o.tipo === 'nemico');
    if (res) {
      S.pos.x = res.st.x + res.o.x + 1.6; S.pos.z = res.st.z + res.o.z; S.immune = 999;
      S.composti.push({ id: 'NaCl', dosi: 1 });
      out.saleSulResiduo = A.usaSu('NaCl');
      out.cloroSulResiduo = A.usaSu('Cl');
      out.residuoVivo = res.o.vivo;
      S.immune = 0;
    }
    /* il terminale */
    const term = tutti.find(x => x.o.tipo === 'terminale');
    vaiDavanti(term);
    out.bersaglioTerm = (A.bersaglio() || {}).tipo;
    A.interagisci();
    out.enigma = A.schermo();
    const E = S._enigma;
    out.passiEnigma = E ? E.passi.length : 0;
    out.tipi = E ? E.passi.map(p => p.tipo + (p.struttura ? '+struttura' : '')).join(',') : '';
    /* sbagliando, la paratia resta chiusa */
    const p0 = E.passi[0];
    if (p0.tipo === 'costruisci') E.costruita = ['S'];
    A.rispondiEnigma(p0.tipo === 'costruisci' ? null : p0.opzioni.find(o => o !== p0.giusta));
    out.dopoSbaglio = !!S.fatti[term.o.apre];
    /* l'uscita è oltre la paratia: da chiusa, non si passa */
    const ultima = M.zona.stanze.find(s => s.ruolo === 'uscita');
    const portaChiusa = ultima.porte.find(p => p.chiusa);
    out.chiusaBlocca = !A.puoStare(ultima.x + ({ est: 1, ovest: -1 }[portaChiusa.verso] || 0) * (ultima.larg / 2 - 0.1),
                                   ultima.z + ({ sud: 1, nord: -1 }[portaChiusa.verso] || 0) * (ultima.prof / 2 - 0.1));
    E.passi.forEach(p => {
      if (p.tipo === 'costruisci') { S._enigma.costruita = p.catena.slice(); A.rispondiEnigma(null); }
      else A.rispondiEnigma(p.giusta);
    });
    out.paratia = !!S.fatti[term.o.apre];
    out.schermoDopo = A.schermo();
    out.apre = !A.puoStare(0, 0) || true;
    out.apertaPassa = A.puoStare(ultima.x + ({ est: 1, ovest: -1 }[portaChiusa.verso] || 0) * (ultima.larg / 2 - 0.1),
                                 ultima.z + ({ sud: 1, nord: -1 }[portaChiusa.verso] || 0) * (ultima.prof / 2 - 0.1));
    /* l'ascensore: chiude il livello e salva */
    const usc = tutti.find(x => x.o.tipo === 'uscita');
    S.pos.x = usc.st.x + usc.o.x; S.pos.z = usc.st.z + usc.o.z + 0.3;
    A.passo();
    out.esito = S.finito ? S.finito.esito : null;
    out.prossimo = S.livello;
    out.salvato = JSON.parse(localStorage.getItem('bsi-ap-partita') || '{}').livello;
    out.livelloMax = A.livelloMax();
    out.punti = S.punti;
    /* e riprendendo si ritrova quello che si aveva */
    const inv = S.inventario.length;
    A.nuovaPartita(1);
    out.ripreso = A.riprendi() && A.stato().livello === 2 && A.stato().inventario.length === inv;
    return out;
  });
  att('si raccolgono gli elementi dell’ala', 'Cl,H,Na,O', giro.inventario);
  att('  · ognuno con la sua padronanza', true, giro.padronanza >= 1);
  att('la scheda sblocca la ricetta che porta scritta', true,
      giro.schede.length > 0 && giro.schede.every(x => giro.ricetteDopoFoglio.indexOf(x) >= 0));
  att('al banco ci si arriva', 'banco', giro.bersaglioBanco);
  att('  · e si sintetizza HCl', 'HCl', giro.ricettaTrovata);
  /* L'ALTRO VERSO: due reagenti che non fanno niente non devono fare niente */
  att('  · due reagenti senza ricetta non producono nulla', 'null', String(giro.coppiaAssurda));
  att('  · né una ricetta che esiste ma non conosci ancora', 'null', String(giro.ignota));
  att('  · il composto entra fra quelli che hai', true, /^HCl×\d$/.test((giro.composti || [])[0]));
  sopra('  · e l’equazione finisce nel codex', 1, giro.equazioneNelCodex);
  /* il residuo è organico: conta CHE COSA usi */
  att('il sale non scioglie un residuo', false, giro.saleSulResiduo);
  att('  · il cloro sì', true, giro.cloroSulResiduo);
  att('  · e il residuo sparisce', false, giro.residuoVivo);
  att('il terminale apre un enigma in tre passi', 3, giro.passiEnigma);
  console.log('      (' + giro.tipi + ')');
  /* NEI DUE VERSI: sbagliando la paratia resta chiusa */
  att('  · sbagliando la paratia resta chiusa', false, giro.dopoSbaglio);
  att('  · e da chiusa non si passa', true, giro.chiusaBlocca);
  att('  · rispondendo giusto si apre', true, giro.paratia);
  att('  · e da aperta si passa', true, giro.apertaPassa);
  att('l’ascensore chiude il livello', 'livello', giro.esito);
  att('  · si passa al livello 2', 2, giro.prossimo);
  att('  · il gioco si salva', 2, giro.salvato);
  att('  · il livello raggiunto si ricorda', 2, giro.livelloMax);
  att('  · e riprendendo si ritrova l’inventario', true, giro.ripreso);

  /* ═══ §5b · I GUARDIANI, NEI DUE VERSI ═════════════════════════════════ */
  console.log('\n── I guardiani: conta che cosa usi ──');
  const boss = await pg.evaluate(async () => {
    const A = window.BSIAtomic;
    const out = {};
    async function arena(n) {
      A.nuovaPartita(n); A.cominciaPartita();
      await new Promise(r => setTimeout(r, 300));
      const S = A.stato(), M = A.mondo();
      const st = M.zona.stanze.find(s => s.ruolo === 'boss');
      S.fatti['paratia' + n] = true;
      const v = st.porte[0].verso;
      S.pos.x = st.x + ({ est: 1, ovest: -1 }[v] || 0) * (st.larg / 2 - 1.2);
      S.pos.z = st.z + ({ sud: 1, nord: -1 }[v] || 0) * (st.prof / 2 - 1.2);
      for (let i = 0; i < 5; i++) A.passo();
      S.immune = 99999;
      return { S, M, st };
    }
    /* POMPA 7 */
    let { S, M } = await arena(10);
    out.ricetteDovute = ['HCl'].every(id => S.ricette.find(r => r.id === id).sbloccata);
    out.attivo = !!(S.boss && S.boss.attivo);
    out.nome = S.boss && S.boss._def.nome;
    S.composti.push({ id: 'NaCl', dosi: 9 }, { id: 'HCl', dosi: 9 });
    S.inventario.push({ sim: 'Na', padronanza: 3, usi: 0 });
    const v0 = S.boss.vita;
    A.usaSu('NaCl');
    out.saleNonFa = S.boss.vita === v0;
    A.usaSu('HCl'); A.usaSu('HCl'); A.usaSu('HCl');
    out.fase2 = S.boss.fase;
    const v2 = S.boss.vita;
    A.usaSu('HCl');
    out.acidoInFase2 = S.boss.vita === v2;
    A.usaSu('Na'); A.usaSu('Na'); A.usaSu('Na');
    out.fase3 = S.boss.fase;
    out.uscitaPrima = (() => { const u = M.zona.stanze.find(s => s.ruolo === 'boss').oggetti.find(o => o.tipo === 'uscita');
      const st = M.zona.stanze.find(s => s.ruolo === 'boss'); S.pos.x = st.x + u.x; S.pos.z = st.z + u.z; A.passo(); return S.finito; })();
    A.usaSu('NaCl'); A.usaSu('NaCl'); A.usaSu('NaCl');
    out.abbattuto = !!S.fatti.pompa7;
    out.premio = S.ricette.find(r => r.id === 'NaOH').sbloccata;
    out.consigli = S.codex.consigli.length;
    A.passo();
    out.dopo = S.finito ? S.finito.esito : null;
    /* ELICA: una fase si vince rispondendo, e la risposta sbagliata fa male */
    ({ S } = await arena(40));
    out.elica = S.boss && S.boss._def.nome;
    A.interagisci();
    out.sfida = A.schermo();
    const vE = S.boss.vita, viteE = S.vite;
    S.immune = 0;
    const pE = S._enigma.passi[0];
    A.rispondiEnigma(pE.opzioni.find(o => o !== pE.giusta));
    out.sbagliataFaMale = S.vite === viteE - 1 && S.boss.vita === vE;
    S.immune = 99999;
    A.interagisci();
    A.rispondiEnigma(S._enigma.passi[0].giusta);
    out.giustaColpisce = S.boss.vita === vE - 1;
    out.reagenteInEnigma = A.usaSu('NaOH');
    /* PROTOCOLLO 12: l'ultimo, quattro fasi, e chiude il gioco */
    ({ S } = await arena(100));
    out.ultimo = S.boss && S.boss._def.nome;
    out.fasiUltimo = S.boss._def.fasi.length;
    A.interagisci(); A.rispondiEnigma(S._enigma.passi[0].giusta);
    A.interagisci(); A.rispondiEnigma(S._enigma.passi[0].giusta);
    S.composti.push({ id: 'NaHCO3', dosi: 9 }); S.inventario.push({ sim: 'Ar', padronanza: 1, usi: 0 });
    for (let i = 0; i < 3; i++) A.usaSu('NaHCO3');
    out.argonPrima = S.boss.fase;
    for (let i = 0; i < 3; i++) A.usaSu('Ar');
    for (let i = 0; i < 4; i++) A.usaSu('Ar');
    out.finale = S.finito ? S.finito.esito : null;
    out.schermoFinale = A.schermo();
    return out;
  });
  att('arrivando al livello 10 si conosce già quello che serve', true, boss.ricetteDovute);
  att('il guardiano si attiva avvicinandosi', true, boss.attivo);
  console.log('      (' + boss.nome + ')');
  att('  · il sale non gli fa niente', true, boss.saleNonFa);
  att('  · l’acido scioglie la ruggine e passa alla fase 2', 2, boss.fase2);
  att('  · e in fase 2 l’acido non basta più', true, boss.acidoInFase2);
  att('  · il sodio reagisce col vapore e scopre il rotore', 3, boss.fase3);
  att('  · finché è vivo l’ascensore resta bloccato', null, boss.uscitaPrima);
  att('  · scoperto, si abbatte', true, boss.abbattuto);
  att('  · e lascia la ricetta della soda', true, boss.premio);
  sopra('  · il codex impara perché', 2, boss.consigli);
  att('  · poi l’ascensore porta avanti', 'livello', boss.dopo);
  att('ELICA chiede una risposta', 'enigma', boss.sfida);
  att('  · la risposta sbagliata toglie una vita e non la tocca', true, boss.sbagliataFaMale);
  att('  · quella giusta la colpisce', true, boss.giustaColpisce);
  att('  · e in quella fase un reagente non serve', false, boss.reagenteInEnigma);
  att('l’ultimo guardiano ha quattro fasi', 4, boss.fasiUltimo);
  att('  · il bicarbonato tampona e scopre il nucleo all’argon', 3, boss.argonPrima);
  att('  · e fermarlo chiude il gioco', 'finale', boss.finale);
  att('  · con il finale a schermo', 'esito', boss.schermoFinale);

  /* ═══ §6 · IL MOTORE: REALISTICO DI SERIE, PS1 A SCELTA ════════════════ */
  console.log('\n── Il motore: grafica alta (PS2) di partenza, PS1 a scelta ──');
  const motore = await pg.evaluate(async () => {
    const A = window.BSIAtomic, T = window.THREE;
    const partenza = A.IMP.grafica;
    A.scriviImp('grafica', 'alta'); A.rifai3D();
    await new Promise(r => setTimeout(r, 1200));
    A.nuovaPartita(3); A.cominciaPartita();
    await new Promise(r => setTimeout(r, 800));
    const m = A.motore(), cv = document.getElementById('bsiAP-tela');
    const out = { pronto: A.pronto(), perche: A.perche3d(), partenza };
    out.webgl = !!m.ren.getContext();
    out.aces = m.ren.toneMapping === T.ACESFilmicToneMapping;
    out.srgb = m.ren.outputEncoding === T.sRGBEncoding;
    out.ombre = m.ren.shadowMap.enabled;
    out.ambiente = !!m.scena.environment;
    let pbr = 0, lambert = 0, scatole = 0, mesh = 0, ombreProiettate = 0;
    m.scena.traverse(o => {
      if (!o.isMesh) return;
      mesh++;
      const mt = o.material;
      if (mt.isMeshStandardMaterial) pbr++;
      if (mt.isMeshLambertMaterial) lambert++;
      if (o.castShadow) ombreProiettate++;
    });
    /* il chimico non è fatto di scatole */
    const nodoChimico = m.chimico && m.chimico.nodo;
    let pezzi = 0;
    if (nodoChimico) nodoChimico.traverse(o => { if (o.isMesh) { pezzi++; if (o.geometry.type === 'BoxGeometry' || o.geometry.type === 'BoxBufferGeometry') scatole++; } });
    Object.assign(out, { pbr, lambert, mesh, ombreProiettate, pezzi, scatole });
    out.tela = cv.width + '×' + cv.height;
    out.risoluzionePiena = cv.width >= cv.clientWidth;
    out.nonPixelata = !/pixelated|crisp/.test(getComputedStyle(cv).imageRendering);
    /* si disegnano solo le stanze vicine */
    const st = A.mondo().zona.stanze;
    out.stanzeVisibili = st.filter(s => s._g && s._g.visible).length;
    out.stanzeTotali = st.length;
    out.luci = 0; m.scena.traverse(o => { if (o.isLight) out.luci++; });
    /* LA PRIMA PERSONA: di partenza, con le braccia in una scena loro */
    out.visualePartenza = A.IMP.visuale;
    const vi = m.vista;
    out.vista = !!vi;
    out.ditaVista = vi ? vi.ditaDx.length + 1 : 0;
    let pezziVista = 0; if (m.scenaMani) m.scenaMani.traverse(o => { if (o.isMesh) pezziVista++; });
    out.pezziVista = pezziVista;
    out.camManiAspetto = m.camMani ? Math.abs(m.camMani.aspect - m.camera.aspect) < 0.01 : false;
    /* I MODELLI DELLA PRIMA PERSONA: le braccia del rig con le loro
       animazioni, la mano robotica a sinistra, la pistola nel pugno */
    for (let i = 0; i < 100 && !(m.vista.rig && m.vista.rig.aggancio && m.vista.rig.robot); i++) await new Promise(r => setTimeout(r, 250));
    const vm = m.vista, R = vm.rig;
    out.fpRig = !!R; out.fpPistola = !!(R && R.aggancio); out.fpRobot = !!(R && R.robot);
    out.fpErrore = m.animV.erroreMani || '';
    if (R && R.aggancio) {
      let skin = 0, skinning = 0; m.scenaMani.traverse(o => { if (o.isSkinnedMesh && o.visible) { skin++; if (o.material.skinning) skinning++; } });
      out.fpSkin = skin + '/' + skinning;
      out.fpClip = Object.keys(R.azioni).filter(k => !/_sx$/.test(k)).sort().join(',');
      /* il jab e l'ispezione «solo sinistra»: nessuna traccia sulle ossa
         della destra, che tiene la pistola */
      const clipSx = ['Punch_sx', 'Inspect_sx'].map(k => R.azioni[k] && R.azioni[k].getClip());
      out.fpSoloSx = clipSx.every(c => c && c.tracks.length > 10 && c.tracks.every(t => !/R(\d{3})?_\d+\./.test(t.name)));
      /* il guanto destro e' nitrile: nella texture il blu domina */
      const gm = R.mesh.find(x => x.userData.ruolo === 'guanto');
      const im = gm && gm.material.map && gm.material.map.image;
      if (im && im.getContext) { const d = im.getContext('2d').getImageData(0, 0, im.width, im.height).data; let r = 0, b = 0; for (let i = 0; i < d.length; i += 256) { r += d[i]; b += d[i + 2]; } out.fpNitrile = b > r * 1.5; }
      /* la presa: l'impugnatura sta nell'anello delle dita destre */
      m.scenaMani.updateMatrixWorld(true);
      const w = o => o.getWorldPosition(new T.Vector3());
      const anello = new T.Vector3(); ['f_index', 'f_middle', 'f_ring', 'f_pinky'].forEach(d => [1, 2, 3].forEach(n => anello.add(w(R.dita(1, d, n))))); anello.multiplyScalar(1 / 12);
      const cg = vm.pistola.centro.clone().applyMatrix4(vm.pistola.gruppo.matrixWorld);
      out.fpPresaMm = Math.round(anello.distanceTo(cg) * 1000);
      /* l'indice sopra il mignolo: si impugna, non si tiene in guardia */
      out.fpIndiceSopra = w(R.dita(1, 'f_index', 1)).y > w(R.dita(1, 'f_pinky', 1)).y + 0.02;
      /* la canna verso avanti e il centro */
      const ug = w(vm.dispensatore.ugello), cP = cg.clone();
      const canna = ug.clone().sub(cP).applyMatrix4(new T.Matrix4().extractRotation(m.camMani.matrixWorldInverse)).normalize();
      out.fpCannaAvanti = +(-canna.z).toFixed(2);
      /* la pistola segue la mano: e' figlia dell'osso */
      let pa = R.aggancio.parent; out.fpAgganciata = pa === R.manoDx;
      out.fpProcedurali = (vm.dx.visible ? 1 : 0) + (vm.sx.visible ? 1 : 0);
      /* le animazioni rispondono: camminando pesa Walk, un cambio fa
         partire Equip, un lancio il jab, lo spruzzo fa rinculare */
      const fr = () => new Promise(r => requestAnimationFrame(r));
      /* (il passo si prova sul rig: camminare davvero porterebbe il
         chimico altrove, magari in ascensore) */
      for (let i = 0; i < 30; i++) R.aggiorna({ dt: 0.016, ora: i * 0.016, vel: 0.8, corsa: false, potere: 0, prendi: -1 });
      out.fpWalk = +R.pesi.Walk.toFixed(2);
      for (let i = 0; i < 30; i++) await fr();
      m.animV.cambio = 1; await fr(); await fr(); out.fpEquip = !!R.colpi.Equip;
      const z0 = R.base.position.z; A.spruzzo(); await fr(); await fr(); out.fpRinculo = R.base.position.z > z0 + 0.005;
      /* le dita robotiche sono articolate: cinque dita con i loro perni, e
         prendere le chiude */
      out.fpDitaRobot = R.robotDita ? Object.keys(R.robotDita).length : 0;
      const piega = () => R.robotDita.medio.perni[1].quaternion.angleTo(new T.Quaternion());
      const p0 = piega();
      /* la mano robotica segue il braccio sinistro */
      const r0 = w(R.robot.children[0]).clone(); m.animV.prendi = 1; for (let i = 0; i < 8; i++) await fr();
      out.fpRobotSegue = w(R.robot.children[0]).distanceTo(r0) > 0.003;
      for (let i = 0; i < 10; i++) await fr();
      out.fpDitaChiudono = piega() > p0 + 0.3;
      for (let i = 0; i < 40; i++) await fr();
      out.fpPost = !!(m.post && m.post.rt);
    }
    A.stato().inMano = 'Cl';
    for (let i = 0; i < 30 && m.animV.inMano !== 'Cl'; i++) await new Promise(r => setTimeout(r, 100));
    out.inManoVista = m.animV.inMano;
    A.spruzzo();
    out.goccioline = m.animV.particelle.filter(q => q.vivo).length;
    /* la mano sinistra: un elemento ci vive sopra, e si lancia */
    A.stato().inventario.push({ sim: 'Na', padronanza: 1, usi: 0 });
    A.stato().inMano = 'Na';
    await new Promise(r => setTimeout(r, 900));
    out.potereNa = vi.potere ? vi.potere.stato.tipo : null;
    /* con il potere il palmo sinistro guarda in su; la sfera prende il
       colore dell'elemento (il sodio giallo: rosso e verde sopra il blu) */
    if (vi.rig && vi.rig.robot) {
      m.animV.alta = 1; await new Promise(r => setTimeout(r, 500));
      const pp = new THREE.Vector3(), nn = new THREE.Vector3(); m.G.palmoSx(vi.rig, pp, nn);
      out.fpPalmoSu = +nn.y.toFixed(2);
      out.fpNucleo = !!(vi.potere.nucleo && vi.potere.nucleo.visible);
      const c = vi.potere.nucleo.children[0].material.color;
      out.fpColoreNa = c.r > c.b * 1.3 && c.g > c.b * 1.1;
      out.fpGranelli = !!(vi.rig.granelli && vi.rig.granelli.visible);
    }
    const vivi0 = m.animV.particelle.filter(q => q.vivo).length;
    A.lancio();
    out.lancio = m.animV.particelle.filter(q => q.vivo).length > vivi0;
    A.stato().inMano = 'Cl';
    await new Promise(r => setTimeout(r, 900));
    out.potereCl = vi.potere ? vi.potere.stato.tipo : null;
    /* gli ambienti déco e l'HUD */
    out.ottone = !!(m.G.M.ottone && m.G.M.marmo);
    out.tacche = document.querySelectorAll('#bsiAP-hud .barra.salute i').length;
    out.vitaMax = A.stato().vitaMax;
    /* una registrazione: si ascolta, ha i sottotitoli, finisce nel Codex */
    A.ascolta(6);
    await new Promise(r => setTimeout(r, 300));
    out.nastroOn = document.getElementById('bsiAP-nastro').classList.contains('on');
    out.nastroTesto = /riprendere comunque|resume regardless/i.test(document.getElementById('bsiAP-nastro').textContent);
    out.nastroCodex = A.stato().codex.registrazioni.indexOf(6) >= 0;
    const ang0 = A.stato().ang, angY0 = A.stato().angY;
    A.sguardo(100, 40);
    out.sguardoGira = A.stato().ang < ang0 && A.stato().angY < angY0;
    A.sguardo(0, 99999);
    out.sguardoLimitato = A.stato().angY >= -1.1;
    A.stato().angY = 0;
    /* i bagliori della PS2: sprite additivi su lampade, schermi, nuclei */
    out.aloni = 0; m.scena.traverse(o => { if (o.isSprite && o.userData.alone) out.aloni++; });
    /* il protagonista in alta: occhi modellati, cinque dita, testa fitta */
    const chA = m.chimico;
    out.occhiModellati = (chA.occhi || []).length;
    out.dita = chA.bSx.mano ? chA.bSx.mano.dita.length + (chA.bSx.mano.pollice ? 1 : 0) : 0;
    let triTesta = 0; chA.testa.traverse(o => { if (o.isMesh) triTesta += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    out.triTesta = Math.round(triTesta);
    let triTot = 0; chA.nodo.traverse(o => { if (o.isMesh) triTot += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    out.triTot = Math.round(triTot);
    const luci0 = out.luci;
    /* attraversare tutto il livello non aggiunge luci: si spostano */
    /* (al centro della stanza, ma non sull'ascensore: chiuderebbe il livello) */
    for (const s of st) { A.stato().pos.x = s.x + s.larg / 4; A.stato().pos.z = s.z + s.prof / 4; await new Promise(r => requestAnimationFrame(r)); }
    const livPrima = A.stato().livello;
    let luci1 = 0; m.scena.traverse(o => { if (o.isLight) luci1++; });
    out.luciCostanti = luci0 === luci1;
    /* il PS1, a scelta */
    A.scriviImp('grafica', 'ps1'); A.rifai3D();
    await new Promise(r => setTimeout(r, 1500));
    const cv2 = document.getElementById('bsiAP-tela');
    const m2 = A.motore();
    out.ps1Tela = cv2.width + '×' + cv2.height;
    out.ps1Pixel = /pixelated|crisp/.test(getComputedStyle(cv2).imageRendering);
    let lam2 = 0; m2.scena.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial) lam2++; });
    out.ps1Lambert = lam2;
    out.ps1Partita = !!A.mondo() && A.stato().livello === livPrima && !A.stato().finito;
    /* la PS1 vera: luce sui vertici sfumata (Gouraud), non facce piatte, e
       lo shader con i vertici agganciati e il colore a 15 bit */
    let piatti = 0, conShader = 0;
    m2.scena.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial) {
      if (o.material.flatShading) piatti++; if (o.material.userData.ps1) conShader++; } });
    out.ps1Piatti = piatti; out.ps1Shader = conShader;
    /* le figure: il viso dipinto, le falde del camice, le caviglie */
    const ch = m2.chimico;
    let viso = false; ch.testa.traverse(o => { if (o.isMesh && o.material.map && o.material.map.image && o.material.map.image.width >= 128) viso = true; });
    out.viso = viso; out.falde = !!(ch.falde && ch.falde.sx && ch.falde.dx); out.caviglie = !!(ch.gSx.caviglia && ch.gDx.caviglia);
    let pz = 0, sc2 = 0; ch.nodo.traverse(o => { if (o.isMesh) { pz++; if (/Box/.test(o.geometry.type)) sc2++; } });
    out.ps1Pezzi = pz; out.ps1Scatole = sc2;
    /* i dieci guardiani si costruiscono tutti, e nessuno e' fatto di scatole */
    /* (costruiti con la grafica alta: in PS1 i pezzi piccoli diventano
       parallelepipedi apposta, ed e' il low-poly di quello stile) */
    out.guardiani = (m.G.GUARDIANI_MODELLI || []).map(tp => {
      const g = m.G.guardiano(tp); let n = 0, b = 0;
      g.gruppo.traverse(o => { if (o.isMesh) { n++; if (/Box/.test(o.geometry.type)) b++; } });
      return { tp, n, b, occhi: (g.parti.occhi || []).length };
    });
    /* il chimico avanza guardando dove va, e le ginocchia si piegano nel
       verso giusto (mai all'indietro) */
    const S2 = A.stato();
    /* prima i modelli della prima persona (il loro arrivo e' un fotogramma
       lungo, che falserebbe il passo) */
    for (let i = 0; i < 80 && !(A.motore().vista && A.motore().vista.modello && A.motore().vista.pistola); i++) await new Promise(r => setTimeout(r, 250));
    const chV = A.motore().chimico;     /* il rig del motore attuale */
    /* rivolto verso il centro della stanza: il passo si misura nello spazio
       libero, non contro un muro (dove scivolando cambierebbe verso) */
    const sUlt = A.mondo().zona.stanze[A.mondo().zona.stanze.length - 1];
    S2.pos.x = sUlt.x + sUlt.larg / 4; S2.pos.z = sUlt.z + sUlt.prof / 4;
    S2.ang = Math.atan2(sUlt.larg / 4, sUlt.prof / 4);
    const x0 = S2.pos.x, z0 = S2.pos.z;
    let kMin = 9, kMax = -9;
    A.schermo('gioco'); A.avviaCiclo();
    A.tasti('su', true);
    for (let i = 0; i < 40; i++) {
      await new Promise(r => requestAnimationFrame(r));
      const k1 = chV.gSx.ginocchio.rotation.x, k2 = chV.gDx.ginocchio.rotation.x;
      kMin = Math.min(kMin, k1, k2); kMax = Math.max(kMax, k1, k2);
    }
    A.tasti('su', false);
    const dx = S2.pos.x - x0, dz = S2.pos.z - z0, dl = Math.hypot(dx, dz) || 1e-9;
    const ry = chV.nodo.rotation.y;
    out.verso = (Math.sin(ry) * dx + Math.cos(ry) * dz) / dl;
    out.mosso = Math.hypot(dx, dz);
    out.kMin = kMin; out.kMax = kMax;
    /* LA STABILITA': si attraversano i livelli, guardiani compresi, e la
       memoria della scheda video non deve crescere senza fine */
    const memo = [];
    for (const n of [1, 10, 23, 40, 57, 70, 84, 90, 100, 5]) {
      A.nuovaPartita(n); A.cominciaPartita();
      await new Promise(r => setTimeout(r, 120));
      memo.push(A.motore().ren.info.memory.geometries);
    }
    out.memoria = memo;
    A.scriviImp('grafica', 'alta'); A.rifai3D();
    await new Promise(r => setTimeout(r, 1200));
    out.tornata = A.motore().ren.toneMapping === T.ACESFilmicToneMapping;
    return out;
  });
  att('il motore 3D è partito', true, motore.pronto);
  if (!motore.pronto) console.log('      ! ' + motore.perche);
  att('  · su WebGL', true, motore.webgl);
  att('  · con il tone mapping cinematografico (ACES)', true, motore.aces);
  att('  · in spazio colore sRGB', true, motore.srgb);
  att('  · con le ombre', true, motore.ombre);
  att('  · e i riflessi d’ambiente', true, motore.ambiente);
  sopra('materiali fisici (PBR) in scena', 100, motore.pbr);
  att('  · e nessun materiale piatto', 0, motore.lambert);
  sopra('  · oggetti che proiettano ombra', 50, motore.ombreProiettate);
  sopra('il chimico è fatto di pezzi', 30, motore.pezzi);
  att('  · e nessuno è una scatola', 0, motore.scatole);
  att('la scena si disegna alla risoluzione dello schermo', true, motore.risoluzionePiena);
  console.log('      (' + motore.tela + ')');
  att('  · senza pixel quadrati', true, motore.nonPixelata);
  att('si disegnano solo la stanza e le vicine', true, motore.stanzeVisibili < motore.stanzeTotali);
  sopra('i bagliori (sprite additivi) su luci, schermi e nuclei', 5, motore.aloni);
  console.log('\n── La prima persona ──');
  att('si gioca in prima persona di partenza', 'prima', motore.visualePartenza);
  att('  · con le braccia in una scena loro (non entrano nei muri)', true, motore.vista);
  sopra('  · fatte di molti pezzi', 40, motore.pezziVista);
  att('  · la mano destra ha cinque dita', 5, motore.ditaVista);
  att('  · la telecamera delle braccia segue le proporzioni dello schermo', true, motore.camManiAspetto);
  att('le braccia del rig (models/braccia-atomic.glb) arrivano', true, motore.fpRig);
  if (motore.fpErrore) console.log('      (errore: ' + motore.fpErrore + ')');
  att('  · la pistola a capsula nel pugno destro', true, motore.fpPistola);
  att('  · la mano robotica a sinistra', true, motore.fpRobot);
  att('  · braccia e guanti con lo scheletro, animati dalla GPU', '2/2', motore.fpSkin);
  att('  · le otto animazioni della prima persona', 'Equip,Idle,Inspect,Punch,Punch_2,Run,Unequip,Walk', motore.fpClip);
  att('  · il guanto destro è nitrile (il blu domina nella texture)', true, motore.fpNitrile);
  att('  · il jab e l’ispezione muovono solo il braccio sinistro', true, motore.fpSoloSx);
  att('  · l’impugnatura sta nell’anello delle dita (entro 3 cm)', true, motore.fpPresaMm <= 30);
  console.log('      (' + motore.fpPresaMm + ' mm)');
  att('  · si impugna: l’indice sta sopra il mignolo', true, motore.fpIndiceSopra);
  sopra('  · la canna guarda avanti (coseno)', 0.6, motore.fpCannaAvanti);
  att('  · la pistola è agganciata all’osso della mano', true, motore.fpAgganciata);
  att('  · e le braccia procedurali non si vedono più', 0, motore.fpProcedurali);
  sopra('camminando pesa l’animazione del passo', 0.5, motore.fpWalk);
  att('  · cambiando strumento parte Equip', true, motore.fpEquip);
  att('  · spruzzando le braccia rinculano', true, motore.fpRinculo);
  att('  · la mano robotica segue il braccio', true, motore.fpRobotSegue);
  att('  · con le cinque dita articolate', 5, motore.fpDitaRobot);
  att('  · che si chiudono per prendere', true, motore.fpDitaChiudono);
  att('  · col potere il palmo sinistro guarda in su', true, motore.fpPalmoSu > 0.4);
  att('  · sopra il palmo la sfera del nucleo', true, motore.fpNucleo);
  att('  · del colore dell’elemento (il sodio è giallo)', true, motore.fpColoreNa);
  att('  · e la manica si sgretola in granelli', true, motore.fpGranelli);
  att('la passata finale «PS2 seria» (colore, bagliori, vignettatura, grana)', true, motore.fpPost);
  att('  · lo strumento mostra quello che hai in mano', 'Cl', motore.inManoVista);
  sopra('  · e spruzzando escono le goccioline', 5, motore.goccioline);
  att('con un elemento in mano la sinistra lo tiene vivo: il sodio fa scintille', 'scintille', motore.potereNa);
  att('  · il cloro è vapore', 'vapore', motore.potereCl);
  att('  · e lanciandolo parte la scarica', true, motore.lancio);
  att('gli ambienti hanno ottone e marmo', true, motore.ottone);
  att('l’HUD ha la barra della salute a tacche, una per vita', motore.vitaMax, motore.tacche);
  att('una registrazione si ascolta con i sottotitoli', true, motore.nastroOn);
  att('  · e il sottotitolo è il testo del nastro', true, motore.nastroTesto);
  att('  · e finisce nell’archivio del Codex', true, motore.nastroCodex);
  att('lo sguardo si muove col mouse o col dito', true, motore.sguardoGira);
  att('  · ma non oltre quanto gira una testa', true, motore.sguardoLimitato);
  att('il protagonista ha gli occhi modellati', 2, motore.occhiModellati);
  att('  · e le mani con cinque dita', 5, motore.dita);
  sopra('  · una testa fitta (triangoli)', 3000, motore.triTesta);
  sopra('  · e migliaia di triangoli in tutto', 15000, motore.triTot);
  console.log('      (testa ' + motore.triTesta + ' · figura ' + motore.triTot + ' triangoli)');
  console.log('      (' + motore.stanzeVisibili + ' di ' + motore.stanzeTotali + ')');
  att('  · e le luci non cambiano di numero girando il livello', true, motore.luciCostanti);
  att('la grafica di partenza è l’alta (livello PS2)', 'alta', motore.partenza);
  att('il PS1, a scelta, si disegna a 480×360', '480×360', motore.ps1Tela);
  att('  · con i pixel quadrati', true, motore.ps1Pixel);
  sopra('  · e i materiali piatti', 50, motore.ps1Lambert);
  att('  · e cambiare grafica non perde la partita', true, motore.ps1Partita);
  att('  · e si torna alla grafica alta', true, motore.tornata);
  att('  · luce sui vertici sfumata (Gouraud): nessun materiale a facce piatte', 0, motore.ps1Piatti);
  sopra('  · e lo shader PS1 (vertici agganciati, colore a 15 bit) sui materiali', 50, motore.ps1Shader);
  console.log('\n── Le figure: il protagonista e i dieci guardiani ──');
  att('il protagonista ha il viso dipinto', true, motore.viso);
  att('  · le falde del camice separate, che si muovono', true, motore.falde);
  att('  · e le caviglie', true, motore.caviglie);
  sopra('  · è fatto di pezzi', 40, motore.ps1Pezzi);
  att('i dieci guardiani si costruiscono tutti', 10, motore.guardiani.length);
  att('  · ognuno con almeno venti pezzi', 0, motore.guardiani.filter(g => g.n < 20).length);
  att('  · nessuno fatto di scatole', 0, motore.guardiani.filter(g => g.b > 0).length);
  att('  · e ognuno con qualcosa che si accende quando attacca', 0, motore.guardiani.filter(g => g.occhi < 1).length);
  console.log('      (' + motore.guardiani.map(g => g.tp + ' ' + g.n).join(' · ') + ')');
  sopra('il chimico cammina', 0.3, motore.mosso);
  /* il difetto della v208/v209: avanzava con la faccia verso la telecamera */
  sopra('  · guardando dove va (coseno fra sguardo e passo)', 0.9, motore.verso);
  sopra('  · e le ginocchia si piegano', 0.3, motore.kMax);
  sopra('  · mai all’indietro', -0.02, motore.kMin);
  console.log('\n── La stabilità su cento livelli ──');
  console.log('      (geometrie in memoria: ' + motore.memoria.join(' → ') + ')');
  /* dopo dieci livelli, compresi quattro guardiani, la memoria torna dove
     era: il livello 5 alla fine non deve pesare piu' di un livello normale */
  att('attraversando dieci livelli la memoria non cresce senza fine', true,
      motore.memoria[motore.memoria.length - 1] <= motore.memoria[0] * 1.5 + 40);

  /* ═══ §7 · LE IMPOSTAZIONI SI RICORDANO ════════════════════════════════ */
  console.log('\n── Visuale e difficoltà: scelte e ricordate ──');
  const imp = await pg.evaluate(() => {
    const A = window.BSIAtomic;
    const prima = A.IMP.visuale;
    A.scriviImp('visuale', 'prima');
    A.scriviImp('difficolta', 'esperimento');
    A.IMP.grafica = 'x'; A.leggiImp();
    const dep = { graficaRiletta: A.IMP.grafica,
      visuale: localStorage.getItem('bsi-ap-visuale'),
      difficolta: localStorage.getItem('bsi-ap-difficolta')
    };
    const d = A.diff();
    A.scriviImp('visuale', prima);
    A.scriviImp('difficolta', 'normale');
    return { dep, vite: d.vite, sintesiRapida: d.sintesiRapida,
             difficolte: Object.keys(A.DIFFICOLTA).length,
             viteFacile: A.DIFFICOLTA.facile.vite,
             viteEsperimento: A.DIFFICOLTA.esperimento.vite };
  });
  att('la visuale scelta finisce nel deposito', 'prima', imp.dep.visuale);
  att('  · e la difficoltà pure', 'esperimento', imp.dep.difficolta);
  att('  · e la grafica scelta si rilegge dal deposito', 'alta', imp.dep.graficaRiletta);
  att('le difficoltà sono quattro', 4, imp.difficolte);
  /* NEI DUE VERSI: «Esperimento» non è «Facile con un nome diverso» */
  att('  · e «Esperimento» vieta la sintesi rapida', 0, imp.sintesiRapida);
  att('  · con una vita sola contro cinque', true,
      imp.viteEsperimento === 1 && imp.viteFacile === 5);

  /* ═══ §8 · NON CONSUMA, E STA NELLO SCHERMO ════════════════════════════ */
  console.log('\n── Non consuma batteria, e sta nello schermo ──');
  const ciclo = await pg.evaluate(async () => {
    const A = window.BSIAtomic;
    document.querySelector('.nav-btn[data-s="sgioco"]').click();
    await new Promise(r => setTimeout(r, 400));
    A.nuovaPartita(); A.cominciaPartita();
    let n = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (f) { n++; return orig(f); };
    /* il rendering software del banco (SwiftShader, senza GPU) fa pochi
       fotogrammi al secondo con le ombre: si conta su tre secondi */
    await new Promise(r => setTimeout(r, 3000));
    const conVista = n;
    /* si chiude la sezione: il ciclo deve fermarsi da sé */
    const altra = document.querySelector('.nav-btn[data-s]:not([data-s="sgioco"])');
    altra.click();
    await new Promise(r => setTimeout(r, 400));
    n = 0;
    await new Promise(r => setTimeout(r, 600));
    const senzaVista = n;
    window.requestAnimationFrame = orig;
    return { conVista, senzaVista };
  });
  sopra('con la sezione aperta il gioco gira', 3, ciclo.conVista);
  /* L'ALTRO VERSO, ED E' QUELLO CHE CONTA */
  att('  · e chiusa la sezione si ferma del tutto', 0, ciclo.senzaVista);

  /* ═══ §8c · I LABORATORI (le mappe fornite) ══════════════════════════ */
  console.log('\n── I laboratori: le mappe da percorrere ──');
  const labs = await pg.evaluate(async () => {
    const A = BSIAtomic, L = BSIAtomicLivelli, out = { porte: 0, mappe: {} };
    /* la sezione del gioco aperta: con la sezione chiusa il ciclo si ferma */
    if (getComputedStyle(document.getElementById('sgioco')).display === 'none') {
      document.querySelector('.nav-btn[data-s="sgioco"]').click();
      await new Promise(r => setTimeout(r, 1200));
    }
    /* ogni livello ha la porta del laboratorio, nella stanza del banco */
    for (let n = 1; n <= L.LIVELLI; n++) {
      const lv = L.livello(n), p = lv.stanze.flatMap(s => s.oggetti.filter(o => o.tipo === 'portaLab').map(o => ({ o, s })));
      if (p.length === 1 && p[0].s.oggetti.some(o => o.tipo === 'banco')) out.porte++;
    }
    out.mappeLab = L.MAPPE_LAB.join(',');
    const fr = () => new Promise(r => requestAnimationFrame(r));
    for (const nome of L.MAPPE_LAB) {
      const n = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91].find(k => L.livello(k).stanze.some(s => s.oggetti.some(o => o.tipo === 'portaLab' && o.mappa === nome)));
      A.nuovaPartita(n + 1 <= L.LIVELLI ? n + 1 : n); A.cominciaPartita();
      await new Promise(r => setTimeout(r, 600));
      const S = A.stato(), M = A.mondo(); let pl, sl;
      M.zona.stanze.forEach(st => st.oggetti.forEach(o => { if (o.tipo === 'portaLab') { pl = o; sl = st; } }));
      const r = { mappa: pl ? pl.mappa : '?' };
      if (!pl) { out.mappe[nome] = r; continue; }
      S.pos.x = sl.x + pl.x + Math.sin(pl.ruota) * 1.4; S.pos.z = sl.z + pl.z + Math.cos(pl.ruota) * 1.4; S.ang = pl.ruota;
      for (let i = 0; i < 20 && !/laboratorio|laboratory/i.test((document.getElementById('apH-basso') || {}).textContent || ''); i++) await new Promise(rr => setTimeout(rr, 100));
      r.cartello = /laboratorio|laboratory/i.test(document.getElementById('apH-basso').textContent);
      const x0 = S.pos.x, z0 = S.pos.z;
      A.interagisci();
      for (let i = 0; i < 160 && !A.lab(); i++) await new Promise(rr => setTimeout(rr, 250));
      const Lb = A.lab();
      r.entrato = !!Lb && Lb.nome === r.mappa;
      if (Lb) {
        r.mondoNascosto = !M.radice.visible;
        r.triangoli = 0; Lb.radice.traverse(o => { if (o.isMesh) r.triangoli += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
        r.triangoli = Math.round(r.triangoli);
        /* il pavimento sotto i piedi */
        r.pavimento = A.pavimentoLab(S.pos.x, S.pos.z, 0) !== null;
        /* i muri: davanti, entro 25 m, la griglia finisce (c'e' un muro); e
           camminando non si esce mai dal pavimento */
        let muro = false;
        for (let d = 0.25; d < 25 && !muro; d += 0.25) muro = A.pavimentoLab(S.pos.x - Math.sin(S.ang) * d, S.pos.z - Math.cos(S.ang) * d, S.labSuolo) === null;
        r.fermatoDalMuro = muro;
        let sempre = true;
        A.tasti('su', true);
        for (let i = 0; i < 60; i++) { await fr(); if (A.pavimentoLab(S.pos.x, S.pos.z, S.labSuolo) === null) sempre = false; }
        A.tasti('su', false);
        r.sempreSulPavimento = sempre;
        /* il banco di sintesi: ci si va, si apre */
        const bo = Lb.oggetti.find(o => o.tipo === 'banco');
        S.pos.x = bo.x; S.pos.z = bo.z; await fr(); await fr();
        A.interagisci(); await fr();
        r.banco = A.schermo() === 'sintesi';
        A.schermo('gioco'); A.avviaCiclo();
        /* si torna al livello dalla porta */
        const us = Lb.oggetti.find(o => o.tipo === 'uscitaLab');
        S.pos.x = us.x; S.pos.z = us.z; await fr(); await fr();
        A.interagisci(); await fr();
        r.uscito = !A.lab() && M.radice.visible && Math.hypot(S.pos.x - x0, S.pos.z - z0) < 0.5;
        r.liberoDopo = !!(Lb.radice && !Lb.radice.parent);
      }
      out.mappe[nome] = r;
    }
    /* si richiude la sezione, come l'aveva lasciata il banco prima */
    document.querySelector('.nav-btn[data-s]:not([data-s="sgioco"])').click();
    await new Promise(r => setTimeout(r, 800));
    return out;
  });
  att('ogni livello ha la porta del laboratorio, nella stanza del banco', 100, labs.porte);
  att('i cinque laboratori, uno per ala a turno', 'small,scifi1,flynn,underground,overgrown', labs.mappeLab);
  Object.keys(labs.mappe).forEach(k => {
    const r = labs.mappe[k];
    att('  ' + k + ': davanti alla porta il cartello dice di entrare', true, r.cartello);
    att('  ' + k + ': si entra nella mappa giusta, e il livello si nasconde', true, r.entrato && r.mondoNascosto);
    sopra('  ' + k + ': la mappa è fatta di migliaia di triangoli', 20000, r.triangoli || 0);
    att('  ' + k + ': si sta sul pavimento della mappa', true, r.pavimento);
    att('  ' + k + ': i muri fermano (25 m dritti non si fanno)', true, r.fermatoDalMuro && r.sempreSulPavimento);
    att('  ' + k + ': il banco di sintesi c’è e si apre', true, r.banco);
    att('  ' + k + ': si torna alla porta del livello, e il laboratorio si libera', true, r.uscito && r.liberoDopo);
  });

  /* ═══ §8b · IL PULSANTE FLOTTANTE DEL GIOCO ═══════════════════════════ */
  console.log('\n── Il pulsante del gioco, con ✨ e Spectra ──');
  const fab = await pg.evaluate(async () => {
    const f = document.getElementById('bsi-gioco-fab'), s = document.getElementById('bsi-spectra-fab');
    const nav = document.querySelector('.nav-btn[data-s="sgioco"]');
    const r = f.getBoundingClientRect(), rs = s.getBoundingClientRect();
    const out = { c_e: !!f, visibile: r.width > 40 && r.height > 30 && getComputedStyle(f).visibility === 'visible',
                  sopra: r.bottom <= rs.top + 1, allineato: Math.abs(r.right - rs.right) < 2,
                  nome: f.getAttribute('aria-label') || '', icona: !!f.querySelector('svg'),
                  navNascosto: !!(nav && nav.hidden) };
    f.click();
    await new Promise(r => setTimeout(r, 1500));
    out.apre = getComputedStyle(document.getElementById('sgioco')).display !== 'none';
    const nascosto = el => { const c = getComputedStyle(el); return c.visibility === 'hidden' || c.display === 'none'; };
    out.nascostiInGioco = ['bsi-gioco-fab', 'bsi14-fab', 'bsi-spectra-fab'].every(id => nascosto(document.getElementById(id)));
    out.dettaglio = ['bsi-gioco-fab', 'bsi14-fab', 'bsi-spectra-fab'].map(id => id + ':' +
      getComputedStyle(document.getElementById(id)).visibility).join(' ') + ' corpo:' + document.body.className;
    /* in prima persona A e D vanno di lato */
    const A = window.BSIAtomic;
    A.scriviImp('visuale', 'prima'); A.nuovaPartita(1); A.cominciaPartita();
    await new Promise(r => setTimeout(r, 300));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    out.dLaterale = !!A.tasti().latDx && !A.tasti().dx;
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
    out.dRilasciato = !A.tasti().latDx;
    document.querySelector('.nav-btn[data-s]:not([data-s="sgioco"])').click();
    await new Promise(r => setTimeout(r, 400));
    out.tornano = ['bsi-gioco-fab', 'bsi14-fab', 'bsi-spectra-fab'].every(id => {
      const c = getComputedStyle(document.getElementById(id)); return c.visibility === 'visible' && c.display !== 'none'; });
    return out;
  });
  att('il pulsante del gioco c’è e si vede', true, fab.c_e && fab.visibile);
  att('  · sta sopra Spectra', true, fab.sopra);
  att('  · allineato con lui', true, fab.allineato);
  att('  · con un’icona e un nome accessibile', true, fab.icona && /ATOMIC/.test(fab.nome));
  att('  · e non è più nella barra delle sezioni', true, fab.navNascosto);
  att('premuto, apre il gioco', true, fab.apre);
  att('  · e in gioco i pulsanti flottanti non coprono la scena', true, fab.nascostiInGioco);
  if (!fab.nascostiInGioco) console.log('      ! ' + fab.dettaglio);
  att('  · e uscendo tornano', true, fab.tornano);
  att('in prima persona D va di lato, non gira', true, fab.dLaterale);
  att('  · e lasciandolo si ferma', true, fab.dRilasciato);
  await ctx.close();

  /* ═══ §9 · SUL TELEFONO ════════════════════════════════════════════════ */
  const ctxT = await browser.newContext({ serviceWorkers: 'block',
                                          viewport: { width: 390, height: 844 } });
  const pgT = await ctxT.newPage();
  await pgT.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgT.waitForTimeout(6500);
  const tel = await pgT.evaluate(async () => {
    const g = document.getElementById('bsi-guide'); if (g) g.remove();
    document.querySelector('.nav-btn[data-s="sgioco"]').click();
    await new Promise(r => setTimeout(r, 1800));
    window.BSIAtomic.nuovaPartita(); window.BSIAtomic.cominciaPartita();
    await new Promise(r => setTimeout(r, 400));
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
    const com = [].map.call(document.querySelectorAll('#bsiAP-comandi button'), b => {
      const q = b.getBoundingClientRect();
      return { nome: b.getAttribute('aria-label'), w: Math.round(q.width), h: Math.round(q.height) };
    });
    return { largo, fuori, com,
             scorre: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  att('a 390 px niente sborda dalla sezione', 0, tel.fuori.length);
  tel.fuori.forEach(x => console.log('      ! ' + x));
  att('  · e la pagina non scorre in orizzontale', 0, tel.scorre);
  sopra('i comandi a schermo ci sono tutti', 11, tel.com.length);
  /* 44 px è la soglia sotto la quale un pollice sbaglia */
  att('  · e si colpiscono col pollice (≥ 44 px)', 0,
      tel.com.filter(c => c.w < 44 || c.h < 44).length);
  att('  · ognuno con un nome accessibile', 0,
      tel.com.filter(c => !c.nome || !c.nome.trim()).length);
  await ctxT.close();

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await browser.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 245) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 245');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
