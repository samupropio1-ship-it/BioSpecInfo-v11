#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   LA PAGINA NON DEVE SCORRERE IN ORIZZONTALE — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   UI-03 dice «l'app deve funzionare a 390 px di larghezza», e la matrice
   di tracciabilita' lo dava per verificato da `audit_stabilita`, che pero'
   apre le sezioni in viewport telefono e guarda gli errori JavaScript: una
   pagina puo' non avere un solo errore e uscire lo stesso di trenta pixel
   dallo schermo. Il requisito era dichiarato coperto e non era misurato.

   IL DIFETTO CHE L'UTENTE VEDE E' UNO SOLO: il documento scorre in
   orizzontale. Non basta trovare un elemento piu' largo dello schermo —
   una tabella dentro un contenitore che scorre per progetto e' corretta,
   e segnalarla vorrebbe dire riempire l'uscita di rumore finche' nessuno
   la legge piu'. Si misura quindi `scrollWidth` del documento, che e'
   esattamente cio' che fa comparire la barra, e solo DOVE c'e' si cerca
   l'elemento che lo causa.

   Trovato cosi': nella sezione quiz una griglia `1fr 1fr` con schede a
   contenuto non comprimibile portava il documento a 553 px su 390 —
   centosessantatre pixel di testo fuori dallo schermo.

   USO   node tools/banchi/audit_mobile.js     (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const LARGHEZZA = 390;          // iPhone 12/13/14 in punti CSS

/* Cerca, fra gli elementi che sporgono, i piu' ESTERNI: se il padre
   sporge gia', il figlio non aggiunge informazione. Si fermano anche
   quelli dentro un contenitore che scorre o che ritaglia, perche' quelli
   non allargano il documento. */
const CAUSE = function(){
  const de = document.documentElement;
  const w = de.clientWidth, fuori = [];
  document.querySelectorAll('.section.on *').forEach(function(el){
    if (el.ownerSVGElement) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.right <= w + 1) return;
    let n = el.parentElement, coperto = false;
    while (n && n.classList && !n.classList.contains('section')) {
      if (n.getBoundingClientRect().right > w + 1) { coperto = true; break; }
      if (/auto|scroll|hidden/.test(getComputedStyle(n).overflowX)) { coperto = true; break; }
      n = n.parentElement;
    }
    if (coperto) return;
    fuori.push(el.tagName.toLowerCase() +
      (el.className && typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/)[0] : '') +
      '  +' + Math.round(r.right - w) + 'px  «' +
      (el.textContent || '').trim().slice(0, 26) + '»');
  });
  return fuori.slice(0, 3);
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    serviceWorkers: 'block',
    viewport: { width: LARGHEZZA, height: 844 }
  });
  const pg = await ctx.newPage();
  const erroriJs = [];
  pg.on('pageerror', e => erroriJs.push(e.message));

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2600);

  /* Il clic va dato da dentro la pagina: quello di Playwright aspetta che
     l'elemento sia visibile, e i pulsanti di navigazione stanno in gruppi
     richiusi. Con il clic di Playwright questo banco percorrerebbe zero
     sezioni e passerebbe. */
  const sezioni = await pg.$$eval('.nav-btn[data-s]', bs => bs.map(x => x.getAttribute('data-s')));

  let percorse = 0;
  const colpevoli = [];
  for (const s of sezioni) {
    await pg.evaluate(function(id){
      const x = document.querySelector('.nav-btn[data-s="' + id + '"]');
      if (x) x.click();
    }, s);
    await pg.waitForTimeout(220);
    percorse++;
    const oltre = await pg.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (oltre > 1) colpevoli.push({ sezione: s, oltre: Math.round(oltre), cause: await pg.evaluate(CAUSE) });
  }

  await browser.close();

  let ok = 0, ko = 0;
  function att(d, atteso, avuto){
    if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
  }

  console.log('Traboccamento orizzontale a ' + LARGHEZZA + ' px\n');

  /* Un banco che non misura nulla passa: se nessuna sezione e' stata
     percorsa, il risultato «zero traboccamenti» non significa niente. */
  att('sezioni percorse', sezioni.length, percorse);
  att('sezioni in cui la pagina scorre in orizzontale', 0, colpevoli.length);
  att('nessun errore JavaScript', 0, erroriJs.length);

  colpevoli.slice(0, 10).forEach(function(c){
    console.log('      ! ' + c.sezione + '  esce di ' + c.oltre + 'px');
    c.cause.forEach(x => console.log('          ' + x));
  });
  erroriJs.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 120)));

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
