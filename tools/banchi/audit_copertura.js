#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   QUANTO CODICE ESEGUONO DAVVERO I BANCHI — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   La difformita' D-06 diceva: «Nessuna copertura di codice strumentata —
   non e' noto quale frazione del codice i banchi eseguano». Il motivo
   addotto era che strumentare richiederebbe introdurre una build, che
   l'applicazione non ha.

   Era vero per gli strumenti che riscrivono il sorgente (c8, istanbul):
   quelli hanno bisogno di un passaggio di compilazione. Ma Chromium
   raccoglie la copertura DA SOLO, nel motore, senza toccare un byte del
   file servito — `Profiler.startPreciseCoverage`, che Playwright espone
   come `page.coverage.startJSCoverage()`. Non serve nessuna build: serve
   accorgersi che l'ostacolo era di uno strumento, non del problema.

   COSA MISURA, E COSA NO
   Misura i byte di JavaScript effettivamente ESEGUITI durante un
   percorso completo dell'applicazione: tutte le sezioni aperte una per
   una, i laboratori, il pannello dell'assistente. E' copertura di
   ISTRUZIONI, non di rami: un `if` entrato solo dal lato vero conta come
   coperto. Dirlo e' parte della misura.

   Non e' la copertura della batteria intera — quella richiederebbe di
   strumentare ogni banco — ma del percorso piu' ampio che un banco
   compie. E' un limite inferiore onesto, ed e' la prima volta che al
   posto di «non misurata» c'e' un numero.

   IL PATTO E' LO STESSO DEL DEBITO DI ACCESSIBILITA'
   Il valore viene registrato. Se scende, il banco fallisce: qualcuno ha
   aggiunto codice che nessun percorso tocca, oppure ne ha tolto di
   eseguito. Se sale, lo dice e chiede di aggiornare il riferimento.
   Pretendere una soglia assoluta («80 %») sarebbe una cifra inventata;
   pretendere che non peggiori e' una promessa che si puo' mantenere.

   USO   node tools/banchi/audit_copertura.js
         node tools/banchi/audit_copertura.js --aggiorna-riferimento
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const RADICE = path.resolve(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const RIF = path.join(RADICE, 'docs', 'evidence', 'copertura-riferimento.json');
const AGGIORNA = process.argv.includes('--aggiorna-riferimento');

/* La copertura oscilla di qualche decimo fra un'esecuzione e l'altra:
   tempi di attesa, richieste di rete che arrivano o no. Una tolleranza
   serve, ma stretta — con due punti percentuali si potrebbe cancellare
   una sezione intera senza che il banco fiati. */
const TOLLERANZA = 0.5;

let ok = 0, ko = 0;
function att(d, atteso, avuto){
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

function pct(a, b){ return b ? +(a / b * 100).toFixed(2) : 0; }

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();

  await pg.coverage.startJSCoverage({ resetOnNavigation: false });

  let sezioni = 0, laboratori = 0;

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2600);

  /* Il clic va dato da dentro la pagina: quello di Playwright aspetta che
     l'elemento sia visibile, e i pulsanti stanno in gruppi richiusi. */
  const ids = await pg.$$eval('.nav-btn[data-s]', bs => bs.map(x => x.getAttribute('data-s')));
  for (const id of ids) {
    await pg.evaluate(function(s){
      const x = document.querySelector('.nav-btn[data-s="' + s + '"]');
      if (x) x.click();
    }, id);
    await pg.waitForTimeout(45);
    sezioni++;
  }

  /* i pannelli che vivono fuori dalle sezioni */
  await pg.evaluate(function(){
    ['#bsiAiFab', '.bsi-ai-fab', '[data-bsi-ai]', '#bsiSettingsBtn'].forEach(function(sel){
      const b = document.querySelector(sel);
      if (b) b.click();
    });
  });
  await pg.waitForTimeout(1200);

  /* le altre pagine dell'applicazione */
  for (const p of ['chimorga.html', 'rdkit_lab.html', 'astro.html']) {
    await pg.goto(BASE + p, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(2200);
    laboratori++;
  }

  const copertura = await pg.coverage.stopJSCoverage();
  await browser.close();

  /* ── Come si legge la copertura di V8, e come NON si legge ──────────
     Il primo tentativo sommava gli intervalli con `count > 0` e dava
     **100 % su ogni file**, compresi 3,6 MB di `index.html`. Era il
     banco che non misurava niente: V8 emette, per ogni funzione, un
     intervallo esterno che copre l'intera funzione (o l'intero script,
     per il livello superiore) con `count` pari al numero di volte che vi
     si e' entrati — e poi intervalli INTERNI con `count: 0` per i pezzi
     non eseguiti. Sommando i positivi si somma tutto il file.
     Si fa il contrario: si parte dal totale e si sottrae l'unione degli
     intervalli a `count: 0`, che sono esattamente cio' che non e' stato
     eseguito. Gli intervalli si fondono prima di sottrarli, perche'
     possono sovrapporsi e sottrarli due volte darebbe copertura
     negativa. */
  const perFile = {};
  copertura.forEach(function(voce){
    const nome = (voce.url || '').split('/').pop().split('?')[0] || '(in linea)';
    if (!perFile[nome]) perFile[nome] = { totale: 0, usati: 0 };
    const lung = (voce.source || '').length;
    perFile[nome].totale += lung;

    const vuoti = [];
    (voce.functions || []).forEach(function(f){
      (f.ranges || []).forEach(function(r){
        if (r.count === 0) vuoti.push([r.startOffset, r.endOffset]);
      });
    });
    vuoti.sort((a, b) => a[0] - b[0]);
    let nonEseguiti = 0, fine = -1;
    vuoti.forEach(function(iv){
      const da = Math.max(iv[0], fine);
      if (iv[1] > da) { nonEseguiti += iv[1] - da; fine = iv[1]; }
    });
    perFile[nome].usati += Math.max(0, lung - nonEseguiti);
  });

  const nomi = Object.keys(perFile).filter(n => perFile[n].totale > 2000).sort();
  let totale = 0, usati = 0;
  nomi.forEach(function(n){ totale += perFile[n].totale; usati += perFile[n].usati; });
  const complessiva = pct(usati, totale);

  console.log('Copertura di codice — istruzioni eseguite, non rami\n');
  console.log('  ' + sezioni + ' sezioni percorse · ' + laboratori + ' altre pagine · ' +
              nomi.length + ' file di script\n');
  nomi.forEach(function(n){
    const f = perFile[n];
    console.log('  · ' + n.padEnd(26) +
                String(pct(f.usati, f.totale)).padStart(6) + ' %   (' +
                (f.usati / 1024).toFixed(0) + ' kB su ' + (f.totale / 1024).toFixed(0) + ' kB)');
  });
  console.log('\n  complessiva: ' + complessiva + ' %\n');

  /* ── Un banco che non misura nulla passa ── */
  att('sezioni percorse', ids.length, sezioni);
  att('file di script raccolti', true, nomi.length > 0);
  att('la copertura e\' stata calcolata', true, totale > 0 && complessiva > 0);

  let rif = null;
  try { rif = JSON.parse(fs.readFileSync(RIF, 'utf8')); } catch (e) {}

  if (AGGIORNA || !rif) {
    fs.writeFileSync(RIF, JSON.stringify({
      nota: 'Copertura di codice misurata da Chromium (Profiler.startPreciseCoverage), ' +
            'senza build e senza riscrivere il sorgente. E\' copertura di ISTRUZIONI, non ' +
            'di rami. Il banco fallisce se scende: rigenerare con --aggiorna-riferimento ' +
            'solo dopo averla ALZATA.',
      aggiornato: new Date().toISOString().slice(0, 10),
      complessiva,
      perFile: nomi.reduce(function(a, n){ a[n] = pct(perFile[n].usati, perFile[n].totale); return a; }, {})
    }, null, 2) + '\n');
    console.log('  → riferimento ' + (rif ? 'aggiornato' : 'creato') + ': ' + complessiva + ' %');
  } else {
    const prima = rif.complessiva;
    if (complessiva < prima - TOLLERANZA) {
      ko++;
      console.log('  ✗ copertura di codice — SCESA: ' + complessiva + ' % contro ' + prima +
                  ' % (−' + (prima - complessiva).toFixed(2) + ')');
      console.log('      o e\' stato aggiunto codice che nessun percorso tocca,');
      console.log('      o ne e\' stato tolto di eseguito.');
    } else if (complessiva > prima + TOLLERANZA) {
      ok++;
      console.log('  ✓ copertura di codice — salita: ' + complessiva + ' % contro ' + prima +
                  ' %. Aggiornare il riferimento con --aggiorna-riferimento');
    } else {
      ok++;
      console.log('  ✓ copertura di codice — stabile a ' + complessiva +
                  ' % (riferimento ' + prima + ' %, tolleranza ±' + TOLLERANZA + ')');
    }
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
