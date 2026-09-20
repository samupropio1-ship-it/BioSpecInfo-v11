/* AUDIT STABILITA'
   Non cerca "funziona la prima volta?" — quello lo sanno gia' gli altri banchi.
   Cerca cio' che si rompe DOPO: memoria che cresce, listener che si
   accumulano, timer che non muoiono, UI che resta bloccata dopo un errore,
   localStorage pieno. Sono i guasti che l'utente vede come "l'app si impalla". */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://127.0.0.1:8899/';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME,
    args: ['--no-sandbox', '--js-flags=--expose-gc'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };
  const info = (d, v) => console.log('    · ' + d + ': ' + v);

  async function apri(file, seed) {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const pg = await ctx.newPage();
    const err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => {
      if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text()))
        err.push('console: ' + m.text());
    });
    if (seed) await pg.addInitScript(seed);
    await pg.goto(BASE + file, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(2500);
    return { pg, ctx, err };
  }

  // ─────────────────────────────────────────────────────────────────
  console.log('\n═══ 1. SESSIONE LUNGA: aprire e chiudere ogni scheda 5 volte ═══');
  // Un utente che studia tiene la app aperta per ore e cambia scheda in
  // continuazione. Se ogni apertura lascia dietro di se' un listener o un
  // timer, dopo un'ora la scheda del browser muore.
  {
    const a = await apri('index.html');
    // La navigazione vera passa da [data-s]: goSection(sid) non fa altro che
    // cliccare quel pulsante. Cercare [data-tab] — come facevo prima — trovava
    // zero schede e il banco passava senza misurare NULLA.
    const strumenti = await a.pg.evaluate(() =>
      Array.from(new Set(Array.from(document.querySelectorAll('[data-s]'))
        .map(el => el.getAttribute('data-s')).filter(Boolean))));
    info('schede trovate', strumenti.length + (strumenti.length ? ' (' + strumenti.slice(0, 6).join(', ') + '…)' : ''));

    const misura = () => a.pg.evaluate(() => ({
      timer: (window.__bsiTimerVivi ? window.__bsiTimerVivi() : -1),
      nodi: document.getElementsByTagName('*').length,
      canvas: document.getElementsByTagName('canvas').length,
      mem: (performance.memory ? performance.memory.usedJSHeapSize : 0)
    }));

    // conta timer creati/cancellati installando una sonda PRIMA del giro
    await a.pg.evaluate(() => {
      window.__vivi = { int: 0, tim: 0, raf: 0 };
      const oi = window.setInterval, oci = window.clearInterval;
      window.setInterval = function () { window.__vivi.int++; return oi.apply(window, arguments); };
      window.clearInterval = function () { window.__vivi.int--; return oci.apply(window, arguments); };
      const ot = window.setTimeout, oct = window.clearTimeout;
      window.setTimeout = function () { window.__vivi.tim++; return ot.apply(window, arguments); };
      window.clearTimeout = function () { window.__vivi.tim--; return oct.apply(window, arguments); };
      window.__bsiTimerVivi = () => window.__vivi.int;
    });

    // Il PRIMO giro costruisce: quasi ogni sezione disegna il suo contenuto
    // solo quando la apri. Crescere li' e' normale e va misurato a parte,
    // altrimenti si scambia la costruzione per una perdita. Il segnale vero
    // e' quanto cresce dal secondo giro in poi, a costruzione finita.
    const passi = [await misura()];
    for (let giro = 0; giro < 5; giro++) {
      for (const t of strumenti) {
        await a.pg.evaluate(id => {
          const el = document.querySelector('[data-s="' + id + '"]');
          if (el) el.click();
        }, t);
        await a.pg.waitForTimeout(90);
      }
      await a.pg.waitForTimeout(600);
      passi.push(await misura());
    }
    info('nodi DOM per giro', passi.map(p => p.nodi).join(' → '));
    info('canvas   per giro', passi.map(p => p.canvas).join(' → '));
    info('setInterval vivi (creati-cancellati)', passi[passi.length - 1].timer);
    const costruzione = passi[1].nodi - passi[0].nodi;
    const dopoCostr = passi[passi.length - 1].nodi - passi[1].nodi;
    const perGiro = Math.round(dopoCostr / 4);
    info('costruzione (giro 1)', '+' + costruzione + ' nodi');
    info('dopo la costruzione (giri 2-5)', '+' + dopoCostr + ' nodi  (' + perGiro + '/giro)');
    att('il DOM smette di crescere a costruzione finita (< 150/giro)', true, perGiro < 150);
    att('i canvas non si moltiplicano dopo il primo giro', true,
      passi[passi.length - 1].canvas - passi[1].canvas <= 1);
    // Un saldo negativo NON e' un difetto: significa che l'app cancella anche
    // timer nati prima della sonda. Il guasto e' solo l'accumulo.
    att('gli intervalli non si accumulano (< 25 vivi)', true, passi[passi.length - 1].timer < 25);
    att('nessun errore JS in 5 giri completi', 0, a.err.length);
    a.err.slice(0, 5).forEach(e => console.log('     ! ' + e.slice(0, 180)));
    await a.ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────
  console.log('\n═══ 2. localStorage PIENO: la app deve sopravvivere ═══');
  // Safari iOS da' ~5 MB e li riempie in fretta con le chat salvate. Quando
  // setItem lancia QuotaExceededError, ogni salvataggio non protetto uccide
  // la funzione che lo conteneva — e l'utente vede un pulsante morto.
  {
    const a = await apri('index.html', () => {
      // Riempiamo PRIMA che la app parta, cosi' ogni suo setItem fallisce.
      // Non basta un numero fisso di blocchi: la quota varia col browser
      // (5 MB su Safari, ~10 MB qui). Si scrive finche' non lancia davvero,
      // altrimenti il banco "passa" senza aver mai esaurito nulla.
      try {
        const grosso = 'x'.repeat(500000);
        for (let i = 0; i < 400; i++) localStorage.setItem('__zavorra' + i, grosso);
      } catch (e) { /* pieno: e' esattamente cio' che vogliamo */ }
    });
    const stato = await a.pg.evaluate(() => {
      // Sondare con un byte non prova niente: dopo aver saturato la quota
      // resta sempre un ritaglio libero e il byte ci entra. Si prova con una
      // scrittura delle dimensioni vere di quelle dell'app (una chat salvata).
      let pieno = false;
      try { localStorage.setItem('__prova', 'x'.repeat(300000)); } catch (e) { pieno = true; }
      try { localStorage.removeItem('__prova'); } catch (e) {}
      return { pieno, corpo: document.body.children.length };
    });
    att('lo spazio e\' davvero esaurito (la prova e\' valida)', true, stato.pieno);
    att('la app si disegna lo stesso', true, stato.corpo > 3);
    att('nessun errore JS con la memoria piena', 0, a.err.length);
    a.err.slice(0, 5).forEach(e => console.log('     ! ' + e.slice(0, 180)));
    // e i comandi rispondono ancora?
    const vivo = await a.pg.evaluate(() => {
      try {
        const f = document.getElementById('bsi-spectra-fab');
        if (f) f.click();
        const ov = document.getElementById('bsi-hub-ov');
        return !!(ov && getComputedStyle(ov).display !== 'none');
      } catch (e) { return 'eccezione: ' + e.message; }
    });
    att('Spectra si apre comunque', true, vivo);
    await a.ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────
  console.log('\n═══ 3. CLIC RIPETUTI: doppio invio e pulsanti impazziti ═══');
  {
    const a = await apri('index.html');
    const esito = await a.pg.evaluate(async () => {
      const out = { errori: [] };
      const bersagli = ['bsi-spectra-fab', 'bsi-hub-prova', 'bsi-hub-close'];
      for (const id of bersagli) {
        const el = document.getElementById(id);
        if (!el) { out.errori.push('manca ' + id); continue; }
        try { for (let i = 0; i < 12; i++) el.click(); }
        catch (e) { out.errori.push(id + ': ' + e.message); }
      }
      await new Promise(r => setTimeout(r, 800));
      // dopo la raffica: quanti overlay sono aperti insieme?
      let aperti = 0;
      document.querySelectorAll('[id^="bsi-"][id$="-ov"]').forEach(o => {
        if (getComputedStyle(o).display !== 'none') aperti++;
      });
      out.aperti = aperti;
      return out;
    });
    att('nessuna eccezione dalla raffica di clic', 0, esito.errori.length);
    esito.errori.forEach(e => console.log('     ! ' + e));
    att('non restano due pannelli sovrapposti', true, esito.aperti <= 1);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 5).forEach(e => console.log('     ! ' + e.slice(0, 180)));
    await a.ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────
  console.log('\n═══ 4. DATI SALVATI CORROTTI: JSON.parse su spazzatura ═══');
  // Una chiave a meta' (tab chiusa durante il salvataggio, quota, estensione
  // ficcanaso) non deve impedire l'avvio: il ripristino va isolato.
  {
    const chiavi = ['bsi_api_keys', 'bsi_prov_ko', 'bsi_modelli_ko', 'bsi_tetti',
      'bsi_ai_provider', 'bsi_chat', 'bsi_hub_chat', 'bsi_memoria'];
    const a = await apri('index.html', () => {
      const spazzatura = ['{"non chiuso":', '[[[', 'null', 'undefined', '{]', '', '12', '"stringa"'];
      const chiavi = ['bsi_api_keys', 'bsi_prov_ko', 'bsi_modelli_ko', 'bsi_tetti',
        'bsi_ai_provider', 'bsi_chat', 'bsi_hub_chat', 'bsi_memoria'];
      chiavi.forEach((k, i) => { try { localStorage.setItem(k, spazzatura[i % spazzatura.length]); } catch (e) {} });
    });
    const stato = await a.pg.evaluate(() => {
      const out = { corpo: document.body.children.length, apre: false, eccezione: '' };
      try {
        const f = document.getElementById('bsi-spectra-fab');
        if (f) f.click();
        const ov = document.getElementById('bsi-hub-ov');
        out.apre = !!(ov && getComputedStyle(ov).display !== 'none');
      } catch (e) { out.eccezione = e.message; }
      return out;
    });
    att('la app parte comunque', true, stato.corpo > 3);
    att('Spectra si apre con i dati corrotti', true, stato.apre);
    att('nessuna eccezione', '', stato.eccezione);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 6).forEach(e => console.log('     ! ' + e.slice(0, 180)));
    await a.ctx.close();
  }

  // ─────────────────────────────────────────────────────────────────
  console.log('\n═══ 5. OGNI PAGINA SI APRE PULITA ═══');
  const pagine = ['index.html', 'astro.html', 'chimorga.html', 'accademia.html',
    'rdkit_lab.html', 'simulazioni.html', 'pro.html', 'sr_completo.html',
    'sr_essenziale.html', 'file_manager.html', 'changelog_tesi.html',
    'guidaret.html', 'download.html', 'Biochimica_Guida_Definitiva.html'];
  for (const p of pagine) {
    const a = await apri(p);
    const n = await a.pg.evaluate(() => document.body.getElementsByTagName('*').length);
    const et = a.err.length ? '  ⚠ ' + a.err[0].slice(0, 110) : '';
    att(p.replace('.html', '') + ' — nessun errore all\'avvio (' + n + ' nodi)', 0, a.err.length);
    if (et) console.log('     ' + et);
    await a.ctx.close();
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
