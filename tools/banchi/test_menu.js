#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_menu — Utility nel menù principale, e una strada sola per ogni cosa

   PERCHE' QUESTO BANCO MISURA L'OPPOSTO DI PRIMA

   Per diverse versioni la categoria «🛠️ Utility» era stata TOLTA dalla barra
   di navigazione e portata dentro il menù ✨, e questo banco pretendeva
   esattamente quello: categoria nascosta, voci nel menù.

   Il risultato pratico è stato che le stesse cose si trovavano in DUE posti,
   perché il pannello ✨ ha anche un suo elenco CABLATO di voci e alcune
   aprivano le stesse sezioni: nel pannello comparivano due «Data Science»,
   due «File Manager», due «Articoli», due «Aggiornamenti». Nessun controllo
   lo vedeva, perché nessuno confrontava le due liste fra loro.

   Ora la regola è una e si può misurare:

     se una cosa ha un pulsante raggiungibile nella barra, NON sta nel menù ✨;
     se non ce l'ha, sta solo nel menù ✨.

   LA LEZIONE CHE RESTA, PERCHE' COSTA CARA OGNI VOLTA

   Il difetto storico di questo progetto è una sezione raggiungibile da
   NIENTE: le due sezioni delle lingue erano solo voci del menù, e su
   telefono — dove il menù è sostituito dal pannello a scomparsa — non si
   aprivano affatto. Nessun conteggio lo vedeva, perché le sezioni c'erano e
   i banchi contavano le sezioni.
   Quindi qui non basta che il pulsante esista nel DOM: si pretende che sia
   RAGGIUNGIBILE — cioè che la linguetta del suo gruppo si veda — e che
   cliccandolo la sezione si apra davvero. Su schermo grande e su telefono.

   «RAGGIUNGIBILE NELLA BARRA» NON SI MISURA CON `offsetParent`

   Nella barra un gruppo per volta è mostrato: il pannello degli altri sei è
   `display:none` per progetto. Un pulsante perfettamente raggiungibile —
   basta cambiare linguetta — ha `offsetParent` nullo. La prima stesura della
   regola nel modulo cadeva proprio qui: non toglieva nessuna ripetizione, e
   le quattro restavano tutte.

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
  /* due viewport: la barra e il menù devono funzionare su schermo grande E su
     telefono, che è esattamente dove il difetto storico si nascondeva */
  const misure = {};
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }],
                            ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage();
    const err = [];
    pg.on('pageerror', e => err.push(e.message));
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(6000);
    await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

    misure[nome] = await pg.evaluate(async () => {
      const out = {};
      const M = window.BSIMenu;
      out.moduloCaricato = typeof M;
      if (!M) return out;

      /* la misura giusta di «raggiungibile nella barra»: il pulsante non è
         nascosto di suo, e la linguetta del suo gruppo si vede */
      function raggiungibile(sid) {
        const btn = document.querySelector('.nav-btn[data-s="' + sid + '"]');
        if (!btn) return false;
        if (getComputedStyle(btn).display === 'none') return false;
        const pan = btn.closest('.nav-group-panel');
        if (!pan) return true;
        const n = (pan.id || '').replace('navGroup', '');
        const tab = document.querySelector('.nav-group-tab[data-group="' + n + '"]');
        return !!(tab && getComputedStyle(tab).display !== 'none');
      }

      /* 1 · la categoria Utility è TORNATA nella barra */
      const tab = document.querySelector('.nav-group-tab[data-group="6"]');
      out.tabEsiste = !!tab;
      out.tabVisibile = tab ? (getComputedStyle(tab).display !== 'none') : null;
      out.tabTesto = tab ? tab.textContent.trim() : '';

      /* 2 · tutte le sue voci sono raggiungibili, lingue comprese */
      out.utilityRaggiungibili = M.UTILITY.filter(raggiungibile).length;
      out.utilityTotali = M.UTILITY.length;
      out.lingueRaggiungibili = M.LINGUE.filter(raggiungibile).length;
      out.lingueTotali = M.LINGUE.length;

      /* 3 · le due che hanno una casa migliore NON sono nella barra, ma il
             loro pulsante è ancora nel documento: `goSection()` lo usa */
      out.fuori = Object.keys(M.FUORI).map(s => ({
        s: s,
        nelDom: !!document.querySelector('.nav-btn[data-s="' + s + '"]'),
        raggiungibile: raggiungibile(s)
      }));

      /* 4 · il menù ✨ */
      const fab = document.getElementById('bsi14-fab');
      out.fabEsiste = !!fab;
      out.fabVisibile = fab ? (getComputedStyle(fab).display !== 'none') : null;
      if (fab) { fab.click(); await new Promise(r => setTimeout(r, 900)); }
      const pannello = document.getElementById('bsi14-panel');
      out.pannelloMenu = !!pannello;
      /* se il pannello non si apre si esce lasciando le misure INDEFINITE:
         un controllo che passa perché non ha guardato niente è peggio di uno
         che fallisce */
      if (!pannello) { out.stato = null; return out; }
      out.stato = M.stato();

      /* 5 · cliccare nella barra apre la sezione, davvero. Fra le prove una
             sezione delle lingue, che è il difetto storico. */
      out.aperte = {};
      for (const sid of ['snotes', 'slingua', 'slinguaggi', 'sarticoli', 'sdatasci']) {
        const t6 = document.querySelector('.nav-group-tab[data-group="6"]');
        if (t6) { t6.click(); await new Promise(r => setTimeout(r, 260)); }
        const btn = document.querySelector('.nav-btn[data-s="' + sid + '"]');
        if (!btn) { out.aperte[sid] = 'pulsante assente'; continue; }
        btn.click();
        await new Promise(r => setTimeout(r, 800));
        const sec = document.getElementById(sid);
        out.aperte[sid] = sec ? (getComputedStyle(sec).display !== 'none') : 'sezione assente';
      }
      return out;
    });
    misure[nome].errori = err.length;
    misure[nome].primoErrore = err[0] ? err[0].slice(0, 120) : '';
    await ctx.close();
  }
  await b.close();

  console.log('Utility nel menù principale, e nessuna ripetizione\n');

  Object.keys(misure).forEach(function (nome) {
    const m = misure[nome];
    console.log('── ' + nome + ' ──');
    att('il modulo è caricato', 'object', m.moduloCaricato);
    if (m.moduloCaricato !== 'object') return;

    /* ── la categoria è tornata ─────────────────────────────────────────── */
    att('la categoria Utility esiste', true, m.tabEsiste);
    att('  · ed è VISIBILE nella barra', true, m.tabVisibile);
    console.log('      (' + m.tabTesto + ')');
    att('tutte le voci di Utility sono raggiungibili dalla barra',
        m.utilityTotali, m.utilityRaggiungibili);
    /* il difetto storico: le lingue raggiungibili da niente */
    att('  · e anche le due delle lingue', m.lingueTotali, m.lingueRaggiungibili);

    /* ── le due eccezioni, nei due versi ────────────────────────────────── */
    (m.fuori || []).forEach(function (f) {
      att('«' + f.s + '» non è nella barra (ha una casa migliore)', false, f.raggiungibile);
      att('  · ma il suo pulsante è ancora nel documento, per goSection()',
          true, f.nelDom);
    });

    /* ── il menù non ripete la barra ────────────────────────────────────── */
    att('il pulsante ✨ c’è ed è visibile', true, m.fabEsiste && m.fabVisibile);
    att('e apre il pannello del menù', true, m.pannelloMenu);
    if (!m.stato) {
      att('le misure sul pannello', 'fatte',
          'il pannello non si è aperto: non ho potuto guardare');
      return;
    }
    /* LA REGOLA, MISURATA: nessuna voce visibile del menù apre una sezione
       che la barra mostra già. */
    att('nessuna voce del menù ripete una sezione della barra', 0,
        (m.stato.ripetizioniRimaste || []).length);
    (m.stato.ripetizioniRimaste || []).forEach(x => console.log('      ! ' + x));
    /* né due voci con la stessa etichetta: «due Aggiornamenti» era proprio
       questo caso, e nessun controllo lo vedeva */
    att('  · né due voci con la stessa etichetta', 0,
        (m.stato.etichetteDoppie || []).length);
    (m.stato.etichetteDoppie || []).forEach(x => console.log('      ! ' + x));
    /* e il modulo non inserisce più righe di sezione nel pannello: se ne
       inserisse, sarebbero di nuovo due strade */
    att('  · e il modulo non inserisce righe di sezione', 0, m.stato.righeDiSezione);
    att('il pannello ha le sue voci (strumenti e sovrapposizioni)', true,
        m.stato.vociPannelloVisibili >= 15);
    console.log('      (' + m.stato.vociPannelloVisibili + ' voci nel pannello)');

    /* ── e cliccando si apre ────────────────────────────────────────────── */
    Object.keys(m.aperte || {}).forEach(function (sid) {
      att('cliccando «' + sid + '» nella barra la sezione si apre', true, m.aperte[sid]);
    });
    att('nessun errore JavaScript', 0, m.errori);
    if (m.errori) console.log('      ! ' + m.primoErrore);
    console.log('');
  });

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 36) {
    ko++;
    console.log('  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 36');
  }

  console.log((ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
