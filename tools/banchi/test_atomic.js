#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_atomic — ATOMIC PROTOCOL, e il cambio lingua tondo

   PERCHE' QUESTO BANCO ESISTE

   Un gioco di esplorazione si rompe in modi che non si vedono guardandolo
   partire:

   1. UNA STANZA IRRAGGIUNGIBILE. Le stanze sono collegate da porte scritte
      nei dati: una porta dimenticata, o scritta in un verso solo, e un pezzo
      di gioco diventa inarrivabile. Qui si percorre il grafo delle stanze e
      si verifica che dalla partenza si arrivi al guardiano, e che ogni porta
      abbia la sua gemella dall'altra parte.

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


  /* ═══ §3 · IL MONDO: SI ARRIVA DAPPERTUTTO? ════════════════════════════ */
  console.log('\n── La Zona 1: sei stanze, e tutte raggiungibili ──');
  const mondo = await pg.evaluate(() => {
    const A = window.BSIAtomic;
    const z = A.ZONA1();
    const perId = {};
    z.stanze.forEach(s => { perId[s.id] = s; });
    /* ogni porta deve avere la sua gemella: se dalla stanza A si va in B,
       da B si deve poter tornare in A — altrimenti è una trappola */
    let zoppe = [];
    z.stanze.forEach(s => {
      (s.porte || []).forEach(p => {
        const altra = perId[p.a];
        if (!altra) { zoppe.push(s.id + '→' + p.a + ' (non esiste)'); return; }
        const torna = (altra.porte || []).some(q => q.a === s.id);
        if (!torna) zoppe.push(s.id + '→' + p.a + ' (senza ritorno)');
      });
    });
    /* si percorre il grafo dalla partenza: dove si arriva? */
    const visti = {}, coda = [z.partenza.stanza];
    while (coda.length) {
      const id = coda.shift();
      if (visti[id]) continue;
      visti[id] = true;
      (perId[id].porte || []).forEach(p => { if (!visti[p.a]) coda.push(p.a); });
    }
    /* le stanze non devono sovrapporsi: due stanze nello stesso posto sono
       due stanze che si vedono una dentro l'altra */
    let sovrapposte = 0;
    for (let i = 0; i < z.stanze.length; i++) {
      for (let j = i + 1; j < z.stanze.length; j++) {
        const a = z.stanze[i], b = z.stanze[j];
        if (Math.abs(a.x - b.x) < (a.larg + b.larg) / 2 - 0.1 &&
            Math.abs(a.z - b.z) < (a.prof + b.prof) / 2 - 0.1) sovrapposte++;
      }
    }
    const oggetti = {};
    z.stanze.forEach(s => (s.oggetti || []).forEach(o => {
      oggetti[o.tipo] = (oggetti[o.tipo] || 0) + 1;
    }));
    return { stanze: z.stanze.length, zoppe, visitate: Object.keys(visti).length,
             sovrapposte, oggetti,
             elementi: z.stanze.reduce((n, s) => n + (s.oggetti || [])
               .filter(o => o.tipo === 'elemento').length, 0) };
  });
  att('la zona ha le sue sette stanze', 7, mondo.stanze);
  att('  · e si arriva a tutte dalla partenza', mondo.stanze, mondo.visitate);
  att('  · ogni porta ha la sua gemella', 0, mondo.zoppe.length);
  mondo.zoppe.forEach(x => console.log('      ! ' + x));
  att('  · e nessuna stanza sta dentro un’altra', 0, mondo.sovrapposte);
  sopra('ci sono elementi da raccogliere', 3, mondo.elementi);
  att('  · un banco di sintesi', 1, mondo.oggetti.banco || 0);
  att('  · un terminale con l’enigma', 1, mondo.oggetti.terminale || 0);
  att('  · e un guardiano', 1, mondo.oggetti.boss || 0);

  /* ═══ §4 · I MURI SONO MURI ════════════════════════════════════════════ */
  console.log('\n── Dentro si cammina, fuori no ──');
  const muri = await pg.evaluate(async () => {
    const A = window.BSIAtomic;
    A.scriviImp('suono', 'spento');
    document.querySelector('.nav-btn[data-s="sgioco"]').click();
    await new Promise(r => setTimeout(r, 2000));
    A.nuovaPartita(); A.cominciaPartita();
    await new Promise(r => setTimeout(r, 300));
    const S = A.stato(), M = A.mondo();
    const st = M.zona.stanze[0];
    const out = {};
    out.dentro = A.puoStare(st.x, st.z);
    out.fuori = A.puoStare(st.x + st.larg / 2 + 3, st.z);
    /* camminare contro un muro non deve farci passare */
    S.pos.x = st.x; S.pos.z = st.z + st.prof / 2 - 1; S.ang = Math.PI;
    A.tasti('su', true);
    for (let i = 0; i < 200; i++) A.passo();
    A.tasti('su', false);
    out.bloccatoDalMuro = S.pos.z < st.z + st.prof / 2;
    /* e attraversare una porta aperta deve farci cambiare stanza */
    S.pos.x = st.x; S.pos.z = st.z - st.prof / 2 + 1; S.ang = 0;
    A.tasti('su', true);
    for (let i = 0; i < 400; i++) A.passo();
    A.tasti('su', false);
    const dove = A.stanzaDi(S.pos.x, S.pos.z);
    out.passataLaPorta = !!(dove && dove.id !== st.id);
    out.stanzaRaggiunta = dove ? dove.id : null;
    return out;
  });
  att('dentro una stanza si può stare', true, muri.dentro);
  /* L'ALTRO VERSO: fuori dai muri no. Se si potesse, la misura sopra non
     direbbe niente */
  att('  · e fuori dai muri no', false, muri.fuori);
  att('camminando contro un muro non si passa', true, muri.bloccatoDalMuro);
  att('  · e attraversando una porta si cambia stanza', true, muri.passataLaPorta);
  console.log('      (arrivato in ' + muri.stanzaRaggiunta + ')');

  /* ═══ §5 · IL GIRO COMPLETO DELLA ZONA 1 ═══════════════════════════════ */
  console.log('\n── Si gioca: elementi, sintesi, enigma, guardiano ──');
  const giro = await pg.evaluate(async () => {
    const A = window.BSIAtomic;
    A.nuovaPartita(); A.cominciaPartita();
    await new Promise(r => setTimeout(r, 200));
    const S = A.stato(), M = A.mondo(), out = {};
    function vaiA(id, ox, oz) {
      const st = M.zona.stanze.filter(x => x.id === id)[0];
      S.pos.x = st.x + ox; S.pos.z = st.z + oz; A.passo();
    }
    /* l'idrogeno */
    vaiA('stoc1', -3.5, -3.2);
    out.bersaglio = (A.bersaglio() || {}).tipo;
    A.interagisci();
    out.inventario = S.inventario.map(x => x.sim);
    out.padronanza = S.inventario[0] ? S.inventario[0].padronanza : 0;
    /* il foglio con la ricetta */
    vaiA('stoc1', 3.6, -2.5); A.interagisci(); A.schermo('gioco');
    out.ricetteDopoFoglio = S.ricette.filter(x => x.sbloccata).map(x => x.id);
    /* il cloro */
    vaiA('stoc2', 3.6, -2.0); A.interagisci();
    out.inventario2 = S.inventario.map(x => x.sim);
    /* la sintesi */
    vaiA('banco', 0, -1.9);
    out.bersaglioBanco = (A.bersaglio() || {}).tipo;
    const r1 = A.ricettaPer(['H', 'Cl']);
    out.ricettaTrovata = r1 ? r1.formula : null;
    /* L'ALTRO VERSO: una coppia che non reagisce non deve produrre niente */
    out.coppiaAssurda = A.ricettaPer(['H', 'H']);
    if (r1) A.sintetizza(r1);
    out.composti = S.composti.map(c => c.id + '×' + c.dosi);
    out.equazioneNelCodex = S.codex.reazioni.length;
    A.schermo('gioco');
    /* l'enigma: tre passi */
    vaiA('term', 0, -1.9);
    A.interagisci();
    out.enigma = A.schermo();
    out.passiEnigma = S._enigma ? S._enigma.passi.length : 0;
    out.struttureDisegnate = S._enigma
      ? S._enigma.passi.filter(p => p.disegno).length : 0;
    /* sbagliando non si apre niente */
    A.rispondiEnigma(2);
    out.dopoSbaglio = !!S.fatti.paratia1;
    A.rispondiEnigma(0); A.rispondiEnigma(0);
    const E = S._enigma; if (E) E.costruita = ['C', 'C', 'O'];
    A.rispondiEnigma(null);
    out.paratia = !!S.fatti.paratia1;
    out.ricetteDopoEnigma = S.ricette.filter(x => x.sbloccata).map(x => x.id);
    A.schermo('gioco');
    /* il guardiano */
    vaiA('pompe', 0, 2);
    for (let i = 0; i < 40; i++) A.passo();
    out.bossAttivo = !!(S.boss && S.boss.attivo);
    out.fase1 = S.boss ? S.boss.fase : null;
    S.composti.push({ id: 'NaCl', dosi: 9 });
    const vita0 = S.boss.vita;
    A.usaSu('NaCl');
    out.sbagliatoNonFa = (S.boss.vita === vita0);
    A.usaSu('HCl'); A.usaSu('HCl'); A.usaSu('HCl');
    out.fase2 = S.boss ? S.boss.fase : null;
    const vita2 = S.boss.vita;
    A.usaSu('HCl');
    out.acidoInFase2 = (S.boss.vita === vita2);
    S.inventario.push({ sim: 'Na', padronanza: 3, usi: 0 });
    A.usaSu('Na'); A.usaSu('Na'); A.usaSu('Na');
    out.fase3 = S.boss ? S.boss.fase : null;
    A.usaSu('HCl'); A.usaSu('HCl'); A.usaSu('HCl');
    out.esito = S.finito ? S.finito.esito : null;
    out.ricetteFine = S.ricette.filter(x => x.sbloccata).map(x => x.id);
    out.punti = S.punti;
    out.consigli = S.codex.consigli.length;
    return out;
  });
  att('si raccoglie un elemento e finisce in inventario', 'H', (giro.inventario || [])[0]);
  att('  · con la sua padronanza', 1, giro.padronanza);
  att('il foglio sblocca la ricetta dell’acido cloridrico', true,
      (giro.ricetteDopoFoglio || []).indexOf('HCl') >= 0);
  att('  · e nella seconda stanza c’è il cloro', true,
      (giro.inventario2 || []).indexOf('Cl') >= 0);
  att('al banco si sintetizza HCl', 'HCl', giro.ricettaTrovata);
  /* L'ALTRO VERSO: due reagenti che non fanno niente non devono fare niente */
  att('  · e due reagenti senza ricetta non producono nulla', 'null',
      String(giro.coppiaAssurda));
  att('  · il composto entra fra quelli che hai', 'HCl×1', (giro.composti || [])[0]);
  sopra('  · e l’equazione finisce nel codex', 1, giro.equazioneNelCodex);
  att('il terminale apre un enigma in tre passi', 3, giro.passiEnigma);
  att('  · ognuno con la sua struttura disegnata', 3, giro.struttureDisegnate);
  /* NEI DUE VERSI: sbagliando la paratia resta chiusa */
  att('  · sbagliando la paratia resta chiusa', false, giro.dopoSbaglio);
  att('  · rispondendo giusto si apre', true, giro.paratia);
  att('  · e sblocca la ricetta del perossido', true,
      (giro.ricetteDopoEnigma || []).indexOf('H2O2') >= 0);
  att('il guardiano si attiva avvicinandosi', true, giro.bossAttivo);
  /* IL CUORE DEL GIOCO: conta CHE COSA usi */
  att('  · il sale non gli fa niente', true, giro.sbagliatoNonFa);
  att('  · l’acido scioglie la ruggine e passa alla fase 2', 2, giro.fase2);
  att('  · e in fase 2 l’acido non basta più', true, giro.acidoInFase2);
  att('  · il sodio reagisce col vapore e scopre il rotore', 3, giro.fase3);
  att('  · e lì si abbatte', 'vinto', giro.esito);
  att('abbattendolo si sblocca la ricetta della soda', true,
      (giro.ricetteFine || []).indexOf('NaOH') >= 0);
  sopra('  · e il codex impara qualcosa', 1, giro.consigli);
  sopra('  · con i punti della zona', 1000, giro.punti);

  /* ═══ §6 · IL MOTORE PS1 ═══════════════════════════════════════════════ */
  console.log('\n── Il motore: PS1 vero, e un chimico fatto di pezzi ──');
  const motore = await pg.evaluate(() => {
    const A = window.BSIAtomic;
    const cv = document.getElementById('bsiAP-tela');
    const st = getComputedStyle(cv);
    const gl = cv.getContext('webgl2') || cv.getContext('webgl');
    return {
      pronto: A.pronto(), perche: A.perche3d(),
      tela: { w: cv.width, h: cv.height },
      pixelati: /pixelated|crisp/.test(st.imageRendering),
      webgl: !!gl,
      /* la risoluzione interna è quella scelta, non quella dello schermo */
      bassaRisoluzione: cv.width <= 640
    };
  });
  att('il motore 3D è partito', true, motore.pronto);
  if (!motore.pronto) console.log('      ! ' + motore.perche);
  att('  · su WebGL', true, motore.webgl);
  att('  · la scena si disegna a bassa risoluzione', true, motore.bassaRisoluzione);
  console.log('      (' + motore.tela.w + '×' + motore.tela.h + ')');
  att('  · e i pixel restano quadrati', true, motore.pixelati);

  /* ═══ §7 · LE IMPOSTAZIONI SI RICORDANO ════════════════════════════════ */
  console.log('\n── Visuale e difficoltà: scelte e ricordate ──');
  const imp = await pg.evaluate(() => {
    const A = window.BSIAtomic;
    const prima = A.IMP.visuale;
    A.scriviImp('visuale', 'prima');
    A.scriviImp('difficolta', 'esperimento');
    const dep = {
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
    await new Promise(r => setTimeout(r, 500));
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
  sopra('con la sezione aperta il gioco gira', 5, ciclo.conVista);
  /* L'ALTRO VERSO, ED E' QUELLO CHE CONTA */
  att('  · e chiusa la sezione si ferma del tutto', 0, ciclo.senzaVista);
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
  if (eseguiti < 75) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 75');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
