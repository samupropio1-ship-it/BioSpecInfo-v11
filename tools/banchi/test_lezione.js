#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_lezione — una lezione guidata per ogni sezione

   PERCHE' QUESTO BANCO ESISTE
   Richiesta dell'autore: una lezione interattiva «per ogni sezione dell'app»
   (bsi-lezione.js). La lezione non e' scritta a mano: nasce dalla sezione.
   Il banco controlla che:
   · TUTTE le sezioni della barra, nelle tre materie, abbiano una lezione con
     almeno apertura e riepilogo, e che le sezioni con schede abbiano un
     capitolo per scheda;
   · in ogni sezione aperta compaia il pulsante «🎓 Lezione guidata»;
   · il lettore funzioni: avanza, apre le schede, illumina il pezzo di cui
     parla, mostra un cursore al lavoro (il valore cambia davvero) e lo rimette
     dov'era, passa in rassegna le scelte e le rimette com'erano;
   · la verifica dia la spiegazione dopo la risposta;
   · alla chiusura i pulsanti flottanti tornino com'erano e la pagina pure;
   · Spectra la avvii con «fammi lezione»;
   · niente sbordi a 390 px e nessun errore JavaScript.

   USO   node tools/banchi/test_lezione.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('── Una lezione per ogni sezione ──');
  {
    const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSILezione && window.goSection && window.BSIMaterie), null, { timeout: 60000 });
    const R = await pg.evaluate(async () => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms)), out = { tot: 0, senza: [], capitoliSbagliati: [], senzaPulsante: [], conVerifica: 0, conSchede: 0 };
      const ids = [...new Set([...document.querySelectorAll('[id^="navGroup"] .nav-btn')].map(x => x.getAttribute('data-s')))];
      for (const id of ids) {
        const bt = document.querySelector('.nav-btn[data-s="' + id + '"]'), gr = +bt.closest('[id^="navGroup"]').id.replace('navGroup', '');
        for (const k in BSIMaterie.MATERIE) if (BSIMaterie.MATERIE[k].gruppi.indexOf(gr) >= 0 && BSIMaterie.corrente() !== k) BSIMaterie.imposta(k);
        goSection(id); await pausa(350);
        const sez = document.getElementById(id); if (!sez || sez.offsetParent === null) continue;
        out.tot++;
        await pausa(1300);   /* il pulsante si aggiunge entro 1,2 s */
        if (!sez.querySelector('.bsiLZ-avvia')) out.senzaPulsante.push(id);
        const L = BSILezione.costruisci(sez);
        if (!L || L.passi.length < 2 || L.passi[0].tipo !== 'titolo' || L.passi[L.passi.length - 1].tipo !== 'fine') { out.senza.push(id); continue; }
        const nSchede = sez.querySelectorAll('.bsiFX-schede button').length;
        if (nSchede) { out.conSchede++; const attesi = nSchede + 2 + (L.passi.some(p => p.tipo === 'quiz') ? 1 : 0); if (L.capitoli.length !== attesi) out.capitoliSbagliati.push(id + ' ' + L.capitoli.length + '/' + attesi); }
        if (L.passi.some(p => p.tipo === 'quiz')) out.conVerifica++;
      }
      return out;
    });
    console.log('      (' + R.tot + ' sezioni; ' + R.conSchede + ' con schede; ' + R.conVerifica + ' con una domanda di verifica)');
    vero('le sezioni attraversate sono tutte quelle della barra (' + R.tot + ')', R.tot >= 190);
    att('ogni sezione ha la sua lezione (apertura … riepilogo)', '', R.senza.join(', '));
    att('nelle sezioni con schede, un capitolo per scheda', '', R.capitoliSbagliati.slice(0, 8).join(', '));
    att('ogni sezione aperta ha il pulsante «🎓 Lezione guidata»', '', R.senzaPulsante.slice(0, 10).join(', '));
    vero('molte lezioni hanno una domanda di verifica dal kit di studio (' + R.conVerifica + ')', R.conVerifica >= 60);
    att('nessun errore JavaScript attraversando tutte le sezioni', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
  }

  for (const [nome, opz] of [['telefono', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── Il lettore, ' + nome + ' ──');
    const pg = await (await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz))).newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSILezione && window.goSection), null, { timeout: 60000 });
    const R = await pg.evaluate(async () => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      BSIMaterie.imposta('fisica'); goSection('sfisonde'); await pausa(1500);
      const fab = document.getElementById('bsi14-fab'); o.fabPrima = getComputedStyle(fab).visibility;
      [...document.querySelectorAll('.bsiLZ-avvia')].find(x => x.offsetParent).click(); await pausa(600);
      const S = () => BSILezione.stato();
      o.aperta = !!document.getElementById('bsiLZ'); o.fabDurante = getComputedStyle(fab).visibility;
      o.primo = S().tipo; o.titolo = document.querySelector('#bsiLZ .corpo h3') && document.querySelector('#bsiLZ .corpo h3').textContent;
      /* fino al primo cursore: deve aprire la scheda e illuminare il comando */
      let giri = 0; while (S().tipo !== 'cursore' && giri++ < 30) { BSILezione.vai(S().i + 1); await pausa(200); }
      const pan = [...document.querySelectorAll('#sfisonde [role=tabpanel]')].find(p => p.offsetParent);
      const c = [...pan.querySelectorAll('input[type=range]')].find(x => x.offsetParent);
      o.cursore = S().tipo; const v0 = c.value, valori = new Set();
      for (let k = 0; k < 30; k++) { await pausa(150); valori.add(c.value); }
      o.valoriDiversi = valori.size; o.luce = document.getElementById('bsiLZ-luce').classList.contains('on');
      /* si salta avanti a meta' dimostrazione: il cursore deve tornare dov'era */
      BSILezione.vai(S().i + 1); await pausa(300); o.tornato = c.value === v0; o.v0 = v0; o.v1 = c.value;
      /* una scelta: passa le opzioni e torna */
      giri = 0; while (S().tipo !== 'scelta' && S().tipo !== 'fine' && giri++ < 40) { BSILezione.vai(S().i + 1); await pausa(150); }
      if (S().tipo === 'scelta') {
        const sel = [...document.querySelectorAll('#sfisonde [role=tabpanel] select')].find(x => x.offsetParent), i0 = sel.selectedIndex, viste = new Set();
        for (let k = 0; k < 30; k++) { await pausa(200); viste.add(sel.selectedIndex); }
        BSILezione.vai(S().i + 1); await pausa(300); o.scelte = viste.size; o.sceltaTornata = sel.selectedIndex === i0;
      }
      /* la verifica */
      giri = 0; while (S().tipo !== 'quiz' && S().tipo !== 'fine' && giri++ < 60) { BSILezione.vai(S().i + 1); await pausa(120); }
      o.quiz = S().tipo === 'quiz';
      if (o.quiz) { document.querySelector('#bsiLZ .opz button').click(); await pausa(400); o.spiegazione = (document.querySelector('#bsiLZ .sp') || {}).textContent || ''; o.giusta = !!document.querySelector('#bsiLZ .opz .giusta'); }
      giri = 0; while (S().tipo !== 'fine' && giri++ < 10) { BSILezione.vai(S().i + 1); await pausa(150); }
      o.fine = S().tipo; o.ricap = document.querySelectorAll('#bsiLZ .ricap li').length; o.capitoli = S().capitoli.length;
      o.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      document.querySelector('#bsiLZ .x').click(); await pausa(300);
      o.chiusa = !document.getElementById('bsiLZ'); o.fabDopo = getComputedStyle(fab).visibility; o.classe = document.body.classList.contains('bsiLZ-aperto');
      /* Spectra: «fammi lezione» */
      const r = BSISpectraLive.comando('fammi lezione'); await pausa(700);
      o.spectra = !!(r && r.testo) && !!BSILezione.stato(); BSILezione.chiudi();
      return o;
    });
    vero('il pulsante apre la lezione, che parte dall\'apertura («' + R.titolo + '»)', R.aperta && R.primo === 'titolo' && R.titolo);
    vero('durante la lezione i pulsanti flottanti si nascondono (' + R.fabPrima + ' → ' + R.fabDurante + ')', R.fabPrima === 'visible' && R.fabDurante === 'hidden');
    vero('un cursore viene mostrato al lavoro: il valore cambia davvero (' + R.valoriDiversi + ' valori)', R.cursore === 'cursore' && R.valoriDiversi >= 4);
    vero('e il riflettore lo illumina', R.luce);
    vero('saltando avanti a metà, il cursore torna dov\'era (' + R.v0 + ' → ' + R.v1 + ')', R.tornato);
    if (R.scelte != null) vero('una scelta passa in rassegna le opzioni (' + R.scelte + ') e torna com\'era', R.scelte >= 2 && R.sceltaTornata);
    vero('la verifica mostra la risposta giusta e la spiegazione', R.quiz && R.giusta && R.spiegazione.length > 20);
    vero('il riepilogo elenca i capitoli (' + R.ricap + ')', R.fine === 'fine' && R.ricap === R.capitoli - 2);
    att('a ' + (nome === 'telefono' ? '390' : '1280') + ' px niente sborda', 0, R.sborda);
    vero('alla chiusura il pannello sparisce e i pulsanti tornano (' + R.fabDopo + ')', R.chiusa && R.fabDopo === 'visible' && !R.classe);
    vero('Spectra avvia la lezione con «fammi lezione»', R.spectra);
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
