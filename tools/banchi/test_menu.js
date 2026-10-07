/* ═══════════════════════════════════════════════════════════════════════════
   test_menu — spostare una categoria nel menù senza farla sparire

   PERCHE' QUESTO BANCO ESISTE

   La categoria «🛠️ Utility» è stata tolta dalla barra di navigazione e messa
   nel menù ✨. È il tipo di spostamento che in questo progetto è già andato
   storto una volta: le due sezioni delle lingue erano SOLO voci del menù, e
   su telefono — dove il menù è nascosto e sostituito dal pannello a
   scomparsa — non si raggiungevano affatto. Nessun conteggio lo vedeva,
   perché le sezioni c'erano e i banchi contavano le sezioni.

   Quindi qui non basta che il pulsante esista nel DOM: si pretende che ogni
   sezione spostata COMPAIA nel menù e che cliccandola si APRA davvero. E si
   pretende anche il contrario — che la categoria non sia più nella barra, e
   che nel menù non compaia roba che non c'entra.

   USO   node tools/banchi/test_menu.js    (serve un server su :8899)
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

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  /* due viewport: il menù ✨ deve funzionare su schermo grande E su telefono,
     che è esattamente dove il difetto precedente si nascondeva */
  const misure = {};
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }],
                            ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage();
    const err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => {
      if (m.type() === 'error' &&
          !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
        err.push('console: ' + m.text());
      }
    });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5500);
    await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

    misure[nome] = await pg.evaluate(async () => {
      const out = {};
      const M = window.BSIMenu;
      out.moduloCaricato = typeof M;
      if (!M) return out;

      /* 1. la categoria non è più nella barra */
      const tab = document.querySelector('.nav-group-tab[data-group="6"]');
      out.tabEsiste = !!tab;
      out.tabVisibile = tab ? (getComputedStyle(tab).display !== 'none') : null;
      const pan = document.getElementById('navGroup6');
      out.pannelloVisibile = pan ? (getComputedStyle(pan).display !== 'none') : null;

      /* 2. ma i pulsanti ci sono ancora: decine di `[data-s=...]`.click()
            sparsi nell'applicazione puntano a loro */
      out.pulsantiNelDom = M.UTILITY.concat(M.LINGUE)
        .filter(s => !!document.querySelector('.nav-btn[data-s="' + s + '"]')).length;
      out.attesi = M.UTILITY.length + M.LINGUE.length;

      /* 3. il menù ✨ */
      const fab = document.getElementById('bsi14-fab');
      out.fabEsiste = !!fab;
      out.fabVisibile = fab ? (getComputedStyle(fab).display !== 'none') : null;
      if (fab) { fab.click(); await new Promise(r => setTimeout(r, 800)); }
      const pannello = document.getElementById('bsi14-panel');
      out.pannelloMenu = !!pannello;
      /* Se il pannello non c'e' si esce, ma lasciando `mancanti` INDEFINITO:
         il primo tentativo tornava qui e il controllo «tutte le voci sono nel
         menu» passava a vuoto, contando zero mancanti su zero voci. Un
         controllo che passa perche' non ha guardato niente e' peggio di uno
         che fallisce. */
      if (!pannello) { out.mancanti = null; return out; }

      const voci = [].map.call(pannello.querySelectorAll('.bsiMenu-sp'),
                               r => r.getAttribute('data-bsi-sez'));
      out.voci = voci;
      out.mancanti = M.UTILITY.concat(M.LINGUE).filter(s => voci.indexOf(s) < 0);
      /* le due intestazioni devono essere DUE e separate */
      out.intestazioni = [].map.call(pannello.querySelectorAll('.bsiMenu-sez'),
                                     r => r.textContent.trim());
      /* le lingue devono stare DOPO l'intestazione delle lingue, non dentro
         Utility: si guarda quale intestazione le precede */
      const nodi = [].slice.call(pannello.querySelectorAll('.bsiMenu-sez, .bsiMenu-sp'));
      let sezCorrente = null;
      out.sotto = {};
      nodi.forEach(function (n) {
        if (n.classList.contains('bsiMenu-sez')) sezCorrente = n.textContent.trim();
        else out.sotto[n.getAttribute('data-bsi-sez')] = sezCorrente;
      });

      /* 4. cliccare una voce apre la sezione, davvero */
      out.aperte = {};
      for (const sid of ['snotes', 'slingua', 'slinguaggi', 'sspettrolettore']) {
        const f2 = document.getElementById('bsi14-fab');
        if (f2) { f2.click(); await new Promise(r => setTimeout(r, 500)); }
        const v = document.querySelector('.bsiMenu-sp[data-bsi-sez="' + sid + '"]');
        if (!v) { out.aperte[sid] = 'voce assente'; continue; }
        v.click();
        await new Promise(r => setTimeout(r, 900));
        const sec = document.getElementById(sid);
        out.aperte[sid] = sec ? sec.classList.contains('on') : 'sezione assente';
      }
      return out;
    });
    misure[nome].errori = err.length;
    misure[nome].primoErrore = err[0] ? err[0].slice(0, 120) : '';
    await ctx.close();
  }
  await b.close();

  console.log('Il menù ✨ — Utility spostata, lingue per conto loro\n');

  Object.keys(misure).forEach(function (nome) {
    const m = misure[nome];
    console.log('── ' + nome + ' ──');
    att('il modulo è caricato', 'object', m.moduloCaricato);
    if (m.moduloCaricato !== 'object') return;

    att('la categoria Utility esiste ancora nel documento', true, m.tabEsiste);
    /* il verso che conta: non si vede più nella barra */
    att('  · ma NON è più visibile nella barra', false, m.tabVisibile);
    att('  · e nemmeno il suo pannello', false, m.pannelloVisibile);
    /* e la guardia opposta: i pulsanti ci sono ancora, perché l'applicazione
       li clicca da decine di punti */
    att('i pulsanti restano nel documento', m.attesi, m.pulsantiNelDom);

    att('il pulsante ✨ c’è ed è visibile', true, m.fabEsiste && m.fabVisibile);
    att('e apre il pannello del menù', true, m.pannelloMenu);
    att('tutte le voci spostate sono nel menù', 'nessuna mancante',
        (m.mancanti === null || m.mancanti === undefined)
          ? 'il pannello non si è aperto: non ho potuto guardare'
          : (m.mancanti.length ? m.mancanti.join(', ') : 'nessuna mancante'));
    att('  · e sono tutte e diciotto', 18, (m.voci || []).length);
    att('con DUE intestazioni separate', 2, (m.intestazioni || []).length);
    console.log('      (' + (m.intestazioni || []).join(' · ') + ')');
    /* il punto della richiesta: le lingue NON sotto Utility */
    att('«Lingua» non sta sotto Utility', true,
        !!(m.sotto && m.sotto.slingua && /Lingue|Languages/.test(m.sotto.slingua)));
    att('«Linguaggi molecole» nemmeno', true,
        !!(m.sotto && m.sotto.slinguaggi && /Lingue|Languages/.test(m.sotto.slinguaggi)));
    att('e uno strumento qualunque sta sotto Utility', true,
        !!(m.sotto && m.sotto.snotes && /Utility/.test(m.sotto.snotes)));

    Object.keys(m.aperte || {}).forEach(function (sid) {
      att('cliccando «' + sid + '» nel menù la sezione si apre', true, m.aperte[sid]);
    });
    att('nessun errore JavaScript', 0, m.errori);
    if (m.errori) console.log('      ! ' + m.primoErrore);
    console.log('');
  });

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 24) {
    ko++;
    console.log('  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 24');
  }

  console.log((ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
