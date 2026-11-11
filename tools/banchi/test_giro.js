#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_giro — il giro di controllo di TUTTE le sezioni e delle pagine a parte

   PERCHE' QUESTO BANCO ESISTE

   Richiesta dell'autore (v249): «deve essere controllato al massimo». I banchi
   provano a fondo le singole funzioni; nessuno apriva, una per una, tutte le
   sezioni dell'app. Fatto una prima volta a mano, il giro ha trovato:
   · sei sezioni che, chieste per identificativo («smo», «scalc», «squiz»,
     «scentro», «sdistr», «sguida»), aprivano un'ALTRA sezione dal nome simile
     («smol», «scalcav», «squizspec», «scentrospettri»…): dall'elenco
     dell'ologramma, da «🧠 Spiega» e dal navigatore si finiva nel posto
     sbagliato;
   · 36 reazioni della banca delle sintesi stampate come «undefined»;
   · quattro pagine a parte che sul telefono sbordavano in orizzontale
     (Chimica Organica di 155 px, Guida alla retrosintesi di 107 px, Accademia
     e i due eserciziari di pochi pixel).
   Questo banco rifà quel giro a ogni versione, a misura di telefono (412 px)
   e di computer (1280 px). Per OGNI sezione del catalogo pretende:
   · che la sezione chiesta sia proprio quella che si apre, ed è visibile;
   · che non sia vuota;
   · che la pagina non sbordi in orizzontale;
   · che nel testo non compaiano «undefined», «NaN», «[object Object]»;
   · nessun errore JavaScript.
   Per le pagine a parte (menu ✨ e collegate): nessuno sbordo, nessun testo
   sospetto, nessun errore JavaScript.

   La rete esterna è chiusa: il banco prova l'app come funziona da sola.

   USO   node tools/banchi/test_giro.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PAGINE = ['astro.html', 'accademia.html', 'chimorga.html', 'rdkit_lab.html', 'pro.html', 'simulazioni.html', 'guidaret.html',
  'changelog_tesi.html', 'sr_completo.html', 'sr_essenziale.html', 'spectra-studio.html', 'download.html', 'Biochimica_Guida_Definitiva.html', 'file_manager.html'];

let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const host = new URL(BASE).hostname.replace(/\./g, '\\.');
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── Tutte le sezioni, ' + nome + ' ──');
    const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await ctx.newPage();
    let errs = []; pg.on('pageerror', e => errs.push(e.message.slice(0, 140)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.route(new RegExp('^https?://(?!' + host + ')'), r => r.abort());
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpiega && window.BSISpectraLive), null, { timeout: 60000 }); await pg.waitForTimeout(2500);
    const cat = await pg.evaluate(() => BSISpiega.catalogo().map(x => ({ id: x.id, nome: x.nome })));
    const avvio = errs.length; errs = [];
    const P = { sbagliata: [], nascosta: [], vuota: [], sborda: [], testo: [], js: [] };
    for (const s of cat) {
      errs = [];
      const r = await pg.evaluate(async id => {
        /* «sai» (Spectra AI) non sta nel navigatore di Spectra, di proposito: e' la sezione di Spectra stesso; si apre dal suo pulsante */
        let x = BSISpectraLive.calcolo.apriSezione(id); if (id === 'sai') { const bt = document.querySelector('.nav-btn[data-s="sai"]'); if (bt) bt.click(); x = { id: 'sai' }; } await new Promise(r => setTimeout(r, 550));
        const el = document.getElementById(id); if (!el) return { manca: true };
        const tx = (el.innerText || '');
        return { aperta: x && x.id, vis: getComputedStyle(el).display !== 'none', testo: tx.replace(/\s+/g, ' ').trim().length, nodi: el.querySelectorAll('*').length,
          sb: document.documentElement.scrollWidth - document.documentElement.clientWidth, strano: (tx.slice(0, 30000).match(/.{0,24}(\bNaN\b|\bundefined\b|\[object Object\]).{0,24}/) || [null])[0] };
      }, s.id).catch(e => ({ ecc: e.message.slice(0, 80) }));
      if (r.manca || r.ecc || r.aperta !== s.id) P.sbagliata.push(s.id + '→' + (r.aperta || r.ecc || 'assente'));
      else {
        if (!r.vis) P.nascosta.push(s.id);
        if (r.testo < 40 && r.nodi < 8) P.vuota.push(s.id);
        if (r.sb > 4) P.sborda.push(s.id + ' +' + r.sb);
        if (r.strano) P.testo.push(s.id + ' «' + r.strano.replace(/\s+/g, ' ') + '»');
      }
      if (errs.length) P.js.push(s.id + ': ' + errs[0]);
    }
    att('le sezioni del catalogo sono tante (' + cat.length + ')', true, cat.length >= 190);
    att('nessun errore JavaScript all\'avvio', 0, avvio);
    att('ogni sezione chiesta per identificativo è quella che si apre', '', P.sbagliata.slice(0, 8).join(' | '));
    att('ogni sezione aperta è visibile', '', P.nascosta.slice(0, 8).join(' | '));
    att('nessuna sezione vuota', '', P.vuota.slice(0, 8).join(' | '));
    att('nessuna sezione fa sbordare la pagina in orizzontale', '', P.sborda.slice(0, 8).join(' | '));
    att('in nessuna sezione compaiono «undefined», «NaN», «[object Object]»', '', P.testo.slice(0, 5).join(' | '));
    att('nessuna sezione dà errori JavaScript', '', P.js.slice(0, 5).join(' | '));
    await ctx.close();

    console.log('\n── Le pagine a parte, ' + nome + ' ──');
    const Q = { sborda: [], testo: [], js: [], vuota: [] };
    for (const f of PAGINE) {
      const c2 = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), p2 = await c2.newPage(), e2 = [];
      p2.on('pageerror', e => e2.push(e.message.slice(0, 120)));
      await p2.route(new RegExp('^https?://(?!' + host + ')'), r => r.abort());
      const r = await p2.goto(BASE + f, { waitUntil: 'load', timeout: 90000 }).then(async () => { await p2.waitForTimeout(2000);
        return p2.evaluate(() => { const tx = document.body.innerText || ''; return { sb: document.documentElement.scrollWidth - document.documentElement.clientWidth, n: document.body.querySelectorAll('*').length, strano: (tx.match(/.{0,24}(\bNaN\b|\bundefined\b|\[object Object\]).{0,24}/) || [null])[0] }; }); }).catch(e => ({ ecc: e.message.slice(0, 80) }));
      if (r.ecc) Q.js.push(f + ': ' + r.ecc);
      if (r.sb > 4) Q.sborda.push(f + ' +' + r.sb);
      if (r.n < 10) Q.vuota.push(f);
      if (r.strano) Q.testo.push(f + ' «' + r.strano.replace(/\s+/g, ' ') + '»');
      if (e2.length) Q.js.push(f + ': ' + e2[0]);
      await c2.close();
    }
    att(PAGINE.length + ' pagine: nessuna sborda in orizzontale', '', Q.sborda.join(' | '));
    att('nessuna pagina vuota', '', Q.vuota.join(' | '));
    att('nessun testo sospetto', '', Q.testo.join(' | '));
    att('nessun errore JavaScript', '', Q.js.slice(0, 5).join(' | '));
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
