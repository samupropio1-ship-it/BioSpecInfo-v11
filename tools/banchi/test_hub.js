#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_hub — 🧩 Gli hub per argomento (v271)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto «una sezione per argomento, senza ripetizioni». La
   fabbrica bsi-hub.js raccoglie le sezioni collegate in un unico hub,
   SPOSTANDO i pannelli (una sola copia) e NASCONDENDO i pulsanti (che però
   restano nel DOM, così navigazione, catalogo, teoria e Spectra non
   cambiano). Qui si pretende, senza browser e poi sul telefono:
   · il Centro spettri ha inglobato anche Metodi Fisici e la Deconvoluzione;
   · il nuovo Centro di Chimica Organica esiste, con otto schede, e ogni suo
     pannello è UNA sola volta nel documento, dentro l'hub, col pulsante
     nascosto ma ancora raggiungibile;
   · una scheda apre il pannello dentro l'hub; non si duplica niente; non
     sborda; nessun errore JavaScript.

   USO   node tools/banchi/test_hub.js   (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path');
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, a, v) { if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIHub && window.BSICentroSpettri && window.BSICentroOrganica && window.BSICentroBiochimica && window.BSICentroFarmacologia), null, { timeout: 60000 });
  await pg.waitForTimeout(1800);

  console.log('── Il Centro spettri ha inglobato Metodi Fisici e Deconvoluzione ──');
  const sp = await pg.evaluate(() => {
    const ids = window.BSICentroSpettri.schede();
    const st = window.BSICentroSpettri.stato();
    const h = id => { const b = document.querySelector('.nav-btn[data-s="' + id + '"]'); return b && b.style.display === 'none'; };
    return { ids: ids, haMetodi: ids.indexOf('smetodi') >= 0, haDeconv: ids.indexOf('sdeconv') >= 0,
      metodiNascosto: h('smetodi'), deconvNascosto: h('sdeconv'),
      copieMetodi: document.querySelectorAll('#smetodi').length, dentro: st.dentroIlCentro };
  });
  vero('Metodi Fisici è una scheda del Centro spettri', sp.haMetodi);
  vero('la Deconvoluzione è una scheda del Centro spettri', sp.haDeconv);
  vero('i loro pulsanti sono nascosti dalla barra', sp.metodiNascosto && sp.deconvNascosto);
  att('Metodi Fisici esiste una volta sola nel documento', 1, sp.copieMetodi);

  console.log('\n── Il Centro di Chimica Organica ──');
  const org = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = {};
    o.schede = window.BSICentroOrganica.schede();
    o.st = window.BSICentroOrganica.stato();
    const hb = document.querySelector('.nav-btn[data-s="scentrorganica"]');
    o.hubBtn = !!hb; if (hb) hb.click(); await P(600);
    const hub = document.getElementById('scentrorganica');
    o.tabN = hub ? hub.querySelectorAll('.bsiHub-sc').length : 0;
    const tab = hub && hub.querySelector('.bsiHub-sc[data-bsi-sc="sarrowlab"]'); if (tab) tab.click(); await P(700);
    const al = document.getElementById('sarrowlab'), corpo = hub && hub.querySelector('.bsiHub-corpo');
    o.arrowInHub = !!(al && corpo && al.parentNode === corpo && al.style.display === 'block');
    o.copieMax = Math.max.apply(null, o.schede.map(id => document.querySelectorAll('#' + id).length));
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  });
  att('il Centro organica raccoglie otto sezioni', 8, org.schede.length);
  vero('ha un pulsante nella barra', org.hubBtn);
  att('tutte e otto le sezioni sono dentro l\'hub', 8, org.st.dentroIlCentro);
  att('tutti e otto i pulsanti sono nascosti', 8, org.st.pulsantiNascosti);
  att('tutti e otto i pulsanti restano nel DOM (goSection, Spectra)', 8, org.st.pulsantiAncoraNelDom);
  att('nessuna sezione è duplicata (max copie nel documento)', 1, org.copieMax);
  att('otto schede disegnate', 8, org.tabN);
  vero('una scheda apre il pannello DENTRO l\'hub (Arrow Lab)', org.arrowInHub);
  att('non sborda', 0, org.sb);

  console.log('\n── Biochimica e Farmacologia (v272) ──');
  for (const hub of [{ g: 'BSICentroBiochimica', nome: 'Biochimica', n: 18, prova: 'skrebs' }, { g: 'BSICentroFarmacologia', nome: 'Farmacologia', n: 8, prova: 'spkcurve' }]) {
    const h = await pg.evaluate(async (cfg) => {
      const P = ms => new Promise(r => setTimeout(r, ms)), o = {};
      const api = window[cfg.g]; o.st = api.stato();
      const btn = document.querySelector('.nav-btn[data-s="' + api.ID + '"]');
      o.btn = !!btn; if (btn) btn.click(); await P(600);
      const sec = document.getElementById(api.ID);
      const tab = sec && sec.querySelector('.bsiHub-sc[data-bsi-sc="' + cfg.prova + '"]'); if (tab) tab.click(); await P(700);
      const pv = document.getElementById(cfg.prova), corpo = sec && sec.querySelector('.bsiHub-corpo');
      o.provaInHub = !!(pv && corpo && pv.parentNode === corpo && pv.style.display === 'block');
      o.copieMax = Math.max.apply(null, api.schede().map(id => document.querySelectorAll('#' + id).length));
      o.sheet = !!(window.BSITeoriaDati && window.BSITeoriaDati[api.ID]);
      o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return o;
    }, hub);
    att(hub.nome + ': raccoglie ' + hub.n + ' sezioni', hub.n, h.st.dentroIlCentro);
    att(hub.nome + ': tutti i pulsanti nascosti', hub.n, h.st.pulsantiNascosti);
    att(hub.nome + ': nessuna sezione duplicata', 1, h.copieMax);
    vero(hub.nome + ': una scheda apre il pannello dentro l\'hub', h.provaInHub);
    vero(hub.nome + ': ha il pulsante e la scheda di teoria', h.btn && h.sheet);
    att(hub.nome + ': non sborda', 0, h.sb);
  }

  console.log('\n── Pulito ──');
  /* la scheda di teoria dell'hub organica esiste e i conteggi del catalogo tornano */
  const t = await pg.evaluate(() => ({
    sheet: !!(window.BSITeoriaDati && window.BSITeoriaDati['scentrorganica']),
    inCatalogo: window.BSISpiega.catalogo().some(x => x.id === 'scentrorganica'),
    nav: document.querySelectorAll('.nav-btn[data-s]').length
  }));
  vero('il Centro organica ha la sua scheda di teoria', t.sheet);
  vero('il Centro organica è nel catalogo delle sezioni', t.inCatalogo);
  console.log('      (' + t.nav + ' pulsanti di navigazione in tutto)');
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 4).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
