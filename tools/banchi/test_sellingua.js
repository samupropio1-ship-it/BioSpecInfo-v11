#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_sellingua — il cambio lingua tondo, su due viewport

   PERCHE' QUESTO BANCO ESISTE

   Cambiare lingua deve costare un gesto, non una navigazione (UI-16). Il
   pulsante e' tondo, in alto a destra, all'altezza del titolo — e
   «all'altezza» si MISURA: con `align-self:center` usciva allineato su
   schermo grande e no sul telefono. Si apre in un disco con le quattordici
   lingue su due gusci, che deve restare dentro lo schermo anche a 390 px;
   e si prova nei due versi: la lingua cambia davvero, e tornando
   all'italiano il testo e' identico a prima.

   (Queste prove stavano in test_atomic, il banco del gioco; il gioco e'
   stato tolto dall'applicazione e loro restano qui.)

   USO   node tools/banchi/test_sellingua.js    (serve un server su :8899)
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


  await browser.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 30) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 30');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
