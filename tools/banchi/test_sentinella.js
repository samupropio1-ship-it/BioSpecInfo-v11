#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_sentinella — la parola «Spectra», sempre in ascolto, senza difetti (v255)

   PERCHE' QUESTO BANCO ESISTE
   L'autore: «risolvi in modo definitivo i bug della funzione sveglia e della
   parola Spectra». Il riconoscimento vocale vero non c'è in un browser senza
   schermo: qui lo si sostituisce con uno finto che si comporta come quello di
   Chrome (si chiude dopo un silenzio, dà errori, passa più alternative), e si
   pretende che la sentinella:
   · riconosca «Spectra» come lo scrive davvero il riconoscimento italiano
     (spectra, spettra, spektra, spectre, specter, spec tra, «ehi Spectra»,
     anche nella seconda o terza alternativa) e NON si svegli per le parole
     che le somigliano e che nell'app si dicono di continuo (spettro, spettri,
     specchio, spettacolo) o per «Spectra» in mezzo a una frase;
   · riparta da sola dopo una chiusura normale, e con attesa crescente dopo
     errori ripetuti (prima girava a vuoto decine di volte al secondo);
   · si metta in pausa mentre la console ascolta (un microfono alla volta) e
     riprenda dopo;
   · riparta quando la pagina torna visibile; ricordi la scelta dopo una
     ricarica; si fermi davvero quando la si spegne;
   · «sveglia Spectra» faccia partire la sequenza di risveglio.

   USO   node tools/banchi/test_sentinella.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }

/* il riconoscimento finto: registra gli avvii, permette di mandare risultati, errori e chiusure */
const FINTO = () => {
  window.__rec = { avvii: 0, istanze: [], ultimo: null };
  function R() { this.lang = ''; this.continuous = false; this.interimResults = false; this.maxAlternatives = 1; this._vivo = false; window.__rec.istanze.push(this); window.__rec.ultimo = this; }
  R.prototype.start = function () { if (this._vivo) throw new Error('InvalidStateError'); this._vivo = true; window.__rec.avvii++; window.__rec.ultimo = this; };
  R.prototype.stop = R.prototype.abort = function () { if (!this._vivo) return; this._vivo = false; const s = this; setTimeout(() => s.onend && s.onend(), 0); };
  R.prototype._dici = function (alternative) { const ris = alternative.map(t => ({ transcript: t, confidence: 0.9 })); ris.isFinal = true; const ev = { resultIndex: 0, results: [ris] }; this.onresult && this.onresult(ev); };
  R.prototype._errore = function (e) { this.onerror && this.onerror({ error: e }); this._vivo = false; const s = this; setTimeout(() => s.onend && s.onend(), 0); };
  R.prototype._fine = function () { this._vivo = false; this.onend && this.onend(); };
  window.SpeechRecognition = R; window.webkitSpeechRecognition = R;
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.addInitScript(FINTO);
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraLive && BSISpectraLive.sentinella), null, { timeout: 60000 });

  console.log('── La parola «Spectra» ──');
  const p = await pg.evaluate(() => {
    const S = BSISpectraLive.sentinella, si = ['Spectra apri la tavola periodica', 'spettra che ore sono', 'Spektra calcola il pH', 'spectre mostrami gli orbitali', 'specter apri la chimica', 'spec tra apri la fisica', 'ehi Spectra dimmi il meteo', 'ok spectra', 'Spectra, apri le lenti gravitazionali'];
    const no = ['lo spettro infrarosso del benzene', 'spettro di massa', 'gli spettri NMR', 'guardo lo specchio', 'che spettacolo', 'apri la sezione di Spectra', 'la spesa di oggi'];
    return { si: si.map(f => [f, S.comando(f)]), no: no.map(f => [f, S.comando(f)]) };
  });
  p.si.forEach(([f, c]) => vero('si sveglia: «' + f + '» → «' + c + '»', c !== null));
  p.no.forEach(([f, c]) => att('non si sveglia: «' + f + '»', 'null', String(c)));
  att('il comando dopo la parola: «Spectra, apri le lenti gravitazionali»', 'apri le lenti gravitazionali', p.si[8][1]);

  console.log('\n── Sempre in ascolto ──');
  const r = await pg.evaluate(async () => {
    const pausa = ms => new Promise(x => setTimeout(x, ms)), L = BSISpectraLive, S = L.sentinella, o = {};
    o.avviata = S.avvia(); o.salvata = localStorage.getItem('bsi-spectra-sentinella'); const a0 = __rec.avvii;
    __rec.ultimo._fine(); await pausa(500); o.riparteDopoSilenzio = __rec.avvii === a0 + 1;
    /* errori ripetuti: l'attesa cresce, non gira a vuoto */
    const a1 = __rec.avvii; for (let i = 0; i < 2; i++) { __rec.ultimo._errore('network'); await pausa(30); }
    await pausa(600); o.avviiInRaffica = __rec.avvii - a1; o.errori = S.stato().errori;
    await pausa(2000); o.dopoAttesa = __rec.avvii - a1;
    /* un risultato azzera gli errori */
    __rec.ultimo._vivo = true; __rec.ultimo._dici(['buongiorno a tutti']); o.azzerati = S.stato().errori === 0;
    /* «Spectra …» nella terza alternativa */
    let elaborato = null; const vecchio = L.elabora; window.__elab = []; document.addEventListener('bsi-spectra-dice', () => {});
    const conta0 = (L.hud && L.hud.storia) ? L.hud.storia.length : 0;
    __rec.ultimo._dici(['spettro di massa', 'spettri di massa', 'Spectra che ore sono']); await pausa(600);
    o.consoleAperta = !!document.querySelector('#bsiJV.aperto, #bsiJV[open], .bsiJV.aperto') || !!(document.getElementById('bsiJV') && document.getElementById('bsiJV').classList.contains('aperto'));
    /* la console ascolta: la sentinella si mette in pausa, poi riprende */
    if (L.ascolta) L.ascolta(); else document.getElementById('bsiJV-mic') && document.getElementById('bsiJV-mic').click();
    await pausa(100); o.inPausa = S.stato().inPausa;
    const consola = __rec.ultimo; consola._fine(); await pausa(900); o.ripresa = !S.stato().inPausa;
    /* la pagina torna visibile: riparte */
    const a2 = __rec.avvii; Object.defineProperty(document, 'hidden', { value: false, configurable: true }); __rec.istanze.forEach(x => x._vivo = false); document.dispatchEvent(new Event('visibilitychange')); await pausa(600); o.visibile = __rec.avvii > a2;
    /* «sveglia Spectra» */
    let risv = false; const R = window.BSISpectraRisveglio, orig = R.risveglio; R.risveglio = function () { risv = true; return {}; };
    const viva = __rec.istanze.filter(x => x.continuous).pop(); viva._vivo = true; viva._dici(['sveglia spectra']); R.risveglio = orig; o.risveglio = risv;
    /* spenta davvero */
    S.ferma(); const a3 = __rec.avvii; __rec.ultimo._fine(); await pausa(800); o.spenta = __rec.avvii === a3 && !S.attiva() && localStorage.getItem('bsi-spectra-sentinella') === null;
    return o;
  });
  vero('si accende e ricorda la scelta', r.avviata && r.salvata === '1');
  vero('dopo una chiusura per silenzio riparte da sola', r.riparteDopoSilenzio);
  vero('con errori di rete di fila non gira a vuoto: ' + r.avviiInRaffica + ' riavvii nel primo mezzo secondo, errori contati ' + r.errori, r.avviiInRaffica === 0 && r.errori >= 2);
  vero('dopo l\'attesa (2 s con 2 errori) riprova comunque (' + r.dopoAttesa + ' riavvii)', r.dopoAttesa >= 1 && r.dopoAttesa <= 2);
  vero('un risultato azzera il conto degli errori', r.azzerati);
  vero('«Spectra …» trovato anche nella terza alternativa: la console si apre', r.consoleAperta);
  vero('mentre la console ascolta la sentinella è in pausa, poi riprende', r.inPausa && r.ripresa);
  vero('quando la pagina torna visibile riparte', r.visibile);
  vero('«sveglia Spectra» fa partire il risveglio', r.risveglio);
  vero('spenta: non riparte e dimentica la scelta', r.spenta);

  console.log('\n── Dopo una ricarica ──');
  await pg.evaluate(() => localStorage.setItem('bsi-spectra-sentinella', '1'));
  await pg.reload({ waitUntil: 'load' });
  await pg.waitForFunction(() => !!(window.BSISpectraLive && BSISpectraLive.sentinella), null, { timeout: 60000 });
  await pg.waitForTimeout(2200);
  await pg.mouse.click(200, 400);
  await pg.waitForTimeout(400);
  const dopo = await pg.evaluate(() => ({ attiva: BSISpectraLive.sentinella.attiva(), avvii: __rec.avvii }));
  vero('la sentinella riparte da sola (permesso già dato) o al primo tocco', dopo.attiva && dopo.avvii >= 1);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
