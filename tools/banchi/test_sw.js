/* Il service worker nelle tre condizioni che contano:
   rete a posto, rete assente, rete PESSIMA (il caso piu' frequente e finora
   il peggio gestito), piu' il comportamento quando esce una versione nuova. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://127.0.0.1:8899/';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  // ── 1. il worker si installa e mette in cache ──
  console.log('\n1) Installazione e precarico');
  const ctx = await b.newContext();           // qui il SW deve girare davvero
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.evaluate(() => navigator.serviceWorker.ready);
  await pg.waitForTimeout(4000);
  const cache = await pg.evaluate(async () => {
    const nomi = await caches.keys();
    const c = await caches.open(nomi[0]);
    const k = await c.keys();
    return { nomi, quanti: k.length };
  });
  att('una sola cache, quella corrente', 1, cache.nomi.length);
  att('il nome e\' quello della versione', true, /^bsi-v\d+$/.test(cache.nomi[0]));
  console.log('    · cache: ' + cache.nomi[0] + ' con ' + cache.quanti + ' voci');
  att('il precarico ha messo dentro le pagine', true, cache.quanti > 20);
  att('nessun errore JS', 0, err.length);

  // ── 2. offline: la app deve aprirsi lo stesso ──
  console.log('\n2) Offline completo');
  await ctx.setOffline(true);
  const pg2 = await ctx.newPage();
  const err2 = [];
  pg2.on('pageerror', e => err2.push(e.message));
  const t0 = Date.now();
  await pg2.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 60000 });
  const tOff = Date.now() - t0;
  const vivo = await pg2.evaluate(() => ({
    nodi: document.body.getElementsByTagName('*').length,
    titolo: document.title
  }));
  att('la app si apre senza rete', true, vivo.nodi > 100);
  console.log('    · ' + vivo.nodi + ' nodi in ' + tOff + ' ms — "' + vivo.titolo.slice(0, 40) + '"');
  att('nessun errore JS offline', 0, err2.length);
  err2.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 150)));
  await pg2.close();
  await ctx.setOffline(false);

  // ── 3. RETE PESSIMA: il caso che prima bloccava tutto ──
  console.log('\n3) Rete pessima (risposte a 20 secondi)');
  const pg3 = await ctx.newPage();
  const err3 = [];
  pg3.on('pageerror', e => err3.push(e.message));
  // Non "offline": la richiesta parte e resta appesa, come con una tacca.
  // A livello di CONTESTO, altrimenti le richieste del service worker
  // passerebbero indisturbate e la rete non sarebbe lenta per nessuno.
  let colpi3 = 0;
  await ctx.route('**/*', async r => {
    colpi3++;
    await new Promise(res => setTimeout(res, 20000));
    // Alla fine della sezione qualche gestore sta ancora dormendo: quando si
    // sveglia la rotta e' gia' stata tolta, e abortirla farebbe cadere tutto
    // il banco per un dettaglio che non riguarda l'app.
    try { await r.abort('timedout'); } catch (e) {}
  });
  const t1 = Date.now();
  let apertaInTempo = true;
  try {
    await pg3.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 15000 });
  } catch (e) { apertaInTempo = false; }
  const tLenta = Date.now() - t1;
  const vivo3 = apertaInTempo
    ? await pg3.evaluate(() => document.body.getElementsByTagName('*').length) : 0;
  console.log('    · caricata in ' + tLenta + ' ms con ' + vivo3 + ' nodi — rete bloccata ' + colpi3 + ' volte');
  att('la rete e\' stata bloccata davvero (misura valida)', true, colpi3 > 0);
  att('non si aspettano i 20 secondi della rete', true, tLenta < 14000);
  att('la app viene servita dalla cache', true, vivo3 > 100);
  att('nessun errore JS', 0, err3.length);
  err3.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 150)));
  await pg3.close();
  await ctx.unroute('**/*');

  /* Il tempo di 3) da solo non dimostra che la gara col cronometro funzioni:
     poteva anche essere il worker mai coinvolto e la pagina servita dalla
     cache HTTP del browser. Qui si misura il singolo fetch, dal DENTRO della
     pagina, con la rete appesa: se torna in circa 3,5 s e' il cronometro che
     ha vinto; se torna dopo venti secondi la regola non sta funzionando. */
  console.log('\n3-bis) La gara col cronometro, misurata sul singolo fetch');
  const pg3b = await ctx.newPage();
  await pg3b.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 60000 });
  await pg3b.evaluate(() => navigator.serviceWorker.ready);
  await pg3b.waitForTimeout(1500);
  const controllata = await pg3b.evaluate(() => !!navigator.serviceWorker.controller);
  att('la pagina e\' davvero governata dal service worker', true, controllata);
  /* page.route NON intercetta le richieste che partono dal service worker:
     con quella il banco misurava una rete perfettamente sana e "passava" in
     16 ms senza aver messo alla prova un bel niente. Serve context.route —
     e un contatore, perche' un intercettore che non scatta mai deve far
     fallire la misura invece di regalarle un successo. */
  let colpi = 0;
  await ctx.route('**/three.min.js', async r => {
    colpi++;
    await new Promise(res => setTimeout(res, 20000));
    try { await r.abort('timedout'); } catch (e) {}
  });
  const gara = await pg3b.evaluate(async () => {
    const t = Date.now();
    let esito = 'ok', byte = 0;
    try {
      // URL ESATTO di quello in cache: con un ?qualcosa in coda la voce non
      // verrebbe trovata e si finirebbe per misurare tutt'altro percorso.
      // cache:'no-store' scavalca la cache HTTP del browser ma passa
      // comunque dal service worker: e' lui che si vuole mettere alla prova.
      const r = await fetch('./three.min.js', { cache: 'no-store' });
      esito = r.status; byte = (await r.text()).length;
    } catch (e) { esito = 'errore: ' + e.message; }
    return { ms: Date.now() - t, esito, byte };
  });
  console.log('    · risposta in ' + gara.ms + ' ms (stato ' + gara.esito + ', ' + gara.byte + ' byte)'
    + ' — rete bloccata ' + colpi + ' volte');
  att('la rete e\' stata bloccata davvero (misura valida)', true, colpi > 0);
  att('la copia in cache arriva senza aspettare la rete morta', true, gara.ms < 6000);
  att('ma il cronometro e\' stato aspettato, non scavalcato', true, gara.ms > 2500);
  att('ed e\' il file vero, non una risposta vuota', true, gara.byte > 1000);
  await ctx.unroute('**/three.min.js');
  await pg3b.close();

  // ── 4. nuova versione mentre si sta lavorando ──
  console.log('\n4) Nuova versione: NON deve buttare via il lavoro aperto');
  const pg4 = await ctx.newPage();
  const err4 = [];
  pg4.on('pageerror', e => err4.push(e.message));
  await pg4.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 60000 });
  await pg4.waitForTimeout(2500);
  /* location.reload non si puo' sostituire nelle versioni recenti di Chrome:
     il primo tentativo di questo banco ci ha provato e ha ricaricato per
     davvero, distruggendo il contesto a meta' misura. Si osserva invece la
     ricarica dall'esterno, con un segnale piantato sulla pagina: se dopo la
     chiamata il segnale non c'e' piu', la pagina si e' ricaricata. */
  const segna = () => pg4.evaluate(() => { window.__segnale = 'vivo'; });
  const sopravvissuto = () => pg4.evaluate(() => window.__segnale === 'vivo');

  // caso B per primo: la pagina resta viva e si puo' continuare a misurare.
  console.log('   B) con del lavoro aperto');
  await segna();
  const soloB = await pg4.evaluate(async () => {
    // una nota lunga a meta', come quando si sta studiando
    const ta = document.createElement('textarea');
    ta.id = '__nota';
    ta.value = 'appunti importanti che non voglio assolutamente perdere per un aggiornamento';
    document.body.appendChild(ta);
    window._bsiAggiornamentoPronto();
    await new Promise(r => setTimeout(r, 1600));
    const bar = document.getElementById('bsi-agg-bar');
    return {
      barra: !!bar,
      testoBarra: bar ? bar.textContent.slice(0, 60) : '',
      haBottoni: bar ? bar.querySelectorAll('button').length : 0,
      notaIntatta: ta.value.length
    };
  });
  att('col lavoro aperto NON si ricarica di nascosto', true, await sopravvissuto());
  att('mostra invece la barra di aggiornamento', true, soloB.barra);
  att('con "Aggiorna ora" e "Più tardi"', 2, soloB.haBottoni);
  // conta i caratteri veri invece di un numero scritto a mano (sbagliato al
  // primo colpo: 76, non 74 — il banco deve misurare, non ricordare)
  att('e la nota e\' ancora li\', intatta', true, soloB.notaIntatta > 70);
  console.log('    · barra: ' + soloB.testoBarra);

  // caso A: pagina pulita → deve ricaricarsi da sola, senza chiedere niente
  console.log('   A) senza niente in corso');
  await pg4.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 60000 });
  await pg4.waitForTimeout(2500);
  await segna();
  const barraSubito = await pg4.evaluate(() => {
    window._bsiAggiornamentoPronto();
    return !!document.getElementById('bsi-agg-bar');
  });
  await pg4.waitForTimeout(2500);
  att('senza lavoro aperto si ricarica da sola', false, await sopravvissuto());
  att('e non disturba con nessuna barra', false, barraSubito);
  att('nessun errore JS', 0, err4.length);
  err4.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 150)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
