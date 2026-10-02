/* ═══════════════════════════════════════════════════════════════════════════
   test_astro — i dati di astrochimica sono coerenti con sé stessi

   PERCHE' QUESTO BANCO ESISTE

   `astro.html` e' 6 348 nodi, 16 pannelli e tre insiemi di dati — 30 molecole
   interstellari, il catalogo dei corpi celesti, un quiz — e NESSUN banco
   dedicato. Le pagine erano toccate solo da `audit_runtime` e
   `audit_stabilita`, che verificano l'assenza di errori all'avvio: utile, ma
   non dice niente sui NUMERI.

   Il controllo decisivo e' lo stesso dei farmaci: il peso molecolare
   dichiarato deve essere coerente con la formula. E' l'unica forma di
   verifica interna possibile su un dato chimico, e intercetta sia il peso
   battuto male sia la formula sbagliata.

   USO   node tools/banchi/test_astro.js     (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;

function att(d, atteso, avuto){
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1280, height: 900 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });

  await pg.goto(BASE + 'astro.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(3500);

  console.log('Astrochimica — i numeri dichiarati sono coerenti?\n');

  /* ── §1 · Molecole interstellari: peso ⟷ formula ───────────────────── */
  console.log('── Molecole interstellari ──');
  const mol = await pg.evaluate(() => {
    /* Pesi atomici standard IUPAC. Scritti qui e non presi dalla pagina:
       un banco che chiedesse alla pagina i pesi con cui verificarla non
       verificherebbe niente. */
    const A = { H:1.008, D:2.014, C:12.011, N:14.007, O:15.999, F:18.998,
                Na:22.990, Mg:24.305, Al:26.982, Si:28.085, P:30.974, S:32.06,
                Cl:35.45, K:39.098, Ca:40.078, Ti:47.867, Fe:55.845 };
    const PEDICI = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
    function peso(f){
      let s = String(f);
      for (const k in PEDICI) s = s.split(k).join(PEDICI[k]);
      s = s.replace(/[⁺⁻°+\-]/g, '').trim();
      if (!/^[A-Za-z0-9()]+$/.test(s)) return null;
      s = s.replace(/\(([A-Za-z0-9]+)\)(\d*)/g, function (_, g, n) {
        const k = n ? parseInt(n, 10) : 1; let r = '';
        for (let i = 0; i < k; i++) r += g; return r;
      });
      let tot = 0, i = 0;
      while (i < s.length) {
        let el = s[i];
        if (i + 1 < s.length && /[a-z]/.test(s[i + 1]) && A[el + s[i + 1]] !== undefined) { el += s[i + 1]; i++; }
        if (A[el] === undefined) return null;
        i++;
        let num = '';
        while (i < s.length && /\d/.test(s[i])) { num += s[i]; i++; }
        tot += A[el] * (num ? parseInt(num, 10) : 1);
      }
      return tot;
    }
    if (typeof MOLS === 'undefined' || !Array.isArray(MOLS)) return { assente: true };
    const esiti = MOLS.map(function (m) {
      const p = peso(m.f);
      return { nome: m.n, formula: m.f, dichiarato: m.mw,
               calcolato: p === null ? null : Math.round(p * 100) / 100,
               scarto: (p === null || typeof m.mw !== 'number') ? null : Math.abs(p - m.mw) };
    });
    /* campi obbligatori: una voce senza formula o senza peso non e'
       verificabile, e una voce non verificabile in un insieme che si presenta
       come verificato e' un buco */
    const incomplete = MOLS.filter(function (m) {
      return !m.n || !m.f || typeof m.mw !== 'number' || !m.loc || !m.det;
    }).map(function (m) { return m.n || '(senza nome)'; });
    const dupId = (function () {
      const v = {}, d = [];
      MOLS.forEach(function (m) { if (v[m.id]) d.push(m.id); v[m.id] = 1; });
      return d;
    })();
    return {
      assente: false, totale: esiti.length,
      nonAnalizzabili: esiti.filter(function (e) { return e.calcolato === null; })
                            .map(function (e) { return e.nome + ' (' + e.formula + ')'; }),
      fuoriTolleranza: esiti.filter(function (e) { return e.scarto !== null && e.scarto > 0.1; })
                            .map(function (e) { return e.nome + ' ' + e.formula + ': dichiarato ' +
                                   e.dichiarato + ', calcolato ' + e.calcolato; }),
      incomplete: incomplete, dupId: dupId
    };
  });

  if (mol.assente) {
    ko++; eseguiti++;
    console.log('  ✗ l\'insieme MOLS non è raggiungibile: il controllo non può avvenire');
  } else {
    att('le molecole interstellari sono molte', true, mol.totale >= 25);
    att('ogni formula è analizzabile', '', mol.nonAnalizzabili.join(', '));
    att('ogni peso molecolare coincide con la sua formula', '', mol.fuoriTolleranza.join(' | '));
    att('ogni voce ha nome, formula, peso, luogo e modo di rilevamento', '', mol.incomplete.join(', '));
    att('nessun identificativo duplicato', '', mol.dupId.join(', '));
    console.log('      (' + mol.totale + ' molecole verificate contro i pesi atomici IUPAC)');
  }

  /* ── §2 · Il catalogo dei corpi celesti ────────────────────────────── */
  console.log('\n── Catalogo dei corpi celesti ──');
  const corpi = await pg.evaluate(() => {
    if (typeof UNIVERSE_DB === 'undefined' || !Array.isArray(UNIVERSE_DB)) return { assente: true };
    const senzaNome = UNIVERSE_DB.filter(function (c) { return !c || !(c.n || c.name); }).length;
    const campi = Object.keys(UNIVERSE_DB[0] || {});
    /* nomi ripetuti: due schede con lo stesso corpo sono una svista che si
       nota solo contando */
    const v = {}, dup = [];
    UNIVERSE_DB.forEach(function (c) {
      const k = (c.n || c.name || '').trim().toLowerCase();
      if (!k) return;
      if (v[k]) dup.push(k); v[k] = 1;
    });
    return { assente: false, totale: UNIVERSE_DB.length, senzaNome: senzaNome,
             duplicati: [...new Set(dup)], campi: campi };
  });
  if (corpi.assente) {
    ko++; eseguiti++;
    console.log('  ✗ il catalogo UNIVERSE_DB non è raggiungibile');
  } else {
    att('il catalogo ha molte voci', true, corpi.totale >= 20);
    att('ogni voce ha un nome', 0, corpi.senzaNome);
    att('nessun corpo compare due volte', '', corpi.duplicati.join(', '));
    console.log('      (' + corpi.totale + ' corpi · campi: ' + corpi.campi.slice(0, 8).join(', ') + ')');
  }

  /* ── §3 · Il quiz non deve avere domande senza risposta ────────────── */
  console.log('\n── Quiz ──');
  const quiz = await pg.evaluate(() => {
    if (typeof QUIZ === 'undefined' || !Array.isArray(QUIZ)) return { assente: true };
    const rotte = QUIZ.filter(function (q) {
      if (!q) return true;
      const opz = q.o || q.opts || q.options;
      const ris = (q.a !== undefined) ? q.a : q.ans;
      if (!Array.isArray(opz) || opz.length < 2) return true;
      /* la risposta deve essere un indice VALIDO fra le opzioni: un indice
         fuori intervallo rende la domanda impossibile da indovinare, e il
         difetto si vede solo giocandoci */
      return !(typeof ris === 'number' && ris >= 0 && ris < opz.length);
    }).length;
    return { assente: false, totale: QUIZ.length, rotte: rotte };
  });
  if (quiz.assente) {
    console.log('      (nessun insieme QUIZ esposto: controllo non applicabile)');
  } else {
    att('il quiz ha molte domande', true, quiz.totale >= 10);
    att('ogni domanda ha opzioni e una risposta valida fra esse', 0, quiz.rotte);
    console.log('      (' + quiz.totale + ' domande)');
  }

  /* ── §4 · I pannelli si aprono tutti ──────────────────────────────── */
  console.log('\n── I sedici pannelli ──');
  /* La prima stesura di questo controllo selezionava «ogni button o elemento
     con onclick il cui testo contiene un'emoji»: ne trovava 2 058 e li
     cliccava tutti, compresi i pulsanti «Scheda completa» di mille schede.
     Ne uscivano 25 errori «e is not a function» che NON erano della pagina:
     erano del banco. Un controllo che genera i difetti che segnala è peggio
     di nessun controllo.
     Si prendono ora i soli pulsanti della barra di navigazione dei pannelli. */
  const pannelli = await pg.evaluate(async () => {
    const barra = document.querySelector('#tabs,#nav,.tabs,.panel-nav,nav');
    const bottoni = barra
      ? [].slice.call(barra.querySelectorAll('button,a'))
      : [].filter.call(document.querySelectorAll('button'), function (b) {
          const t = (b.textContent || '').trim();
          return t.length > 3 && t.length < 32 && !/Scheda|3D|Cerca/.test(t);
        });
    let aperti = 0;
    for (const b of bottoni.slice(0, 40)) {
      try { b.click(); aperti++; } catch (e) { /* conteggio separato */ }
      await new Promise(r => setTimeout(r, 80));
    }
    return { trovati: Math.min(bottoni.length, 40), aperti: aperti,
             nodi: document.querySelectorAll('*').length };
  });
  att('i pannelli trovati sono molti', true, pannelli.trovati >= 10);
  att('si aprono tutti senza eccezioni', pannelli.trovati, pannelli.aperti);
  console.log('      (' + pannelli.nodi + ' nodi dopo averli percorsi)');

  att('nessun errore JavaScript percorrendo la pagina', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 12) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 12');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
