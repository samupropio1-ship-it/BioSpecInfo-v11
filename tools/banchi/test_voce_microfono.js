#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_voce_microfono — «sento il bip della campanella ma non la voce» (v261)

   PERCHE' QUESTO BANCO ESISTE
   Su Android ogni avvio del riconoscimento vocale suona il bip del sistema e,
   finché il riconoscimento resta acceso, la sintesi vocale non esce. La
   sentinella («Spectra…» sempre in ascolto) restava accesa mentre Spectra
   parlava: l'autore sentiva la campanella e niente voce.
   Qui un riconoscitore e una sintesi FINTI registrano l'ordine degli eventi
   e si pretende, per le tre voci dell'app (console, chat, voce di qualità):
   · il riconoscimento è fermato PRIMA che parta la prima frase;
   · fra la fine del microfono e la voce passa un attimo (Android lo vuole);
   · mentre parla la sentinella non riparte;
   · finita la voce, la sentinella riparte da sola;
   · si dicono tutte le frasi, nessuna cade.
   Il vero telefono resta da provare a mano: il banco prova la logica.

   USO   node tools/banchi/test_voce_microfono.js   (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, a, v) { if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
  const pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => {
    try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {}
    /* (v278) qui si verifica la voce del TELEFONO (muta mentre il microfono è acceso): dalla v278
       la voce predefinita è quella dell'app, quindi si sceglie esplicitamente la voce del telefono. */
    try { localStorage.setItem('bsiVoceTelefono', '1'); } catch (e) {}
    const reg = window.__reg = [];
    const ora = () => Math.round(performance.now());
    /* il riconoscitore finto: avvio e fine registrati; «acceso» finché non si ferma */
    class Rec { constructor() { this.acceso = false; } start() { if (this.acceso) throw new Error('già acceso'); this.acceso = true; reg.push(['rec+', ora()]); window.__micAcceso = (window.__micAcceso || 0) + 1; }
      abort() { if (!this.acceso) return; this.acceso = false; reg.push(['rec-', ora()]); window.__micAcceso--; setTimeout(() => this.onend && this.onend(), 5); } stop() { this.abort(); } }
    window.SpeechRecognition = window.webkitSpeechRecognition = Rec;
    /* la sintesi finta: come Android, una frase detta col microfono acceso resta MUTA */
    const coda = []; let parlando = null;
    const S = { speaking: false, pending: false, paused: false, getVoices: () => [{ name: 'Italiano', lang: 'it-IT', localService: true }], addEventListener() {}, removeEventListener() {}, resume() {},
      cancel() { coda.length = 0; if (parlando) { const u = parlando; parlando = null; S.speaking = false; u.onerror && u.onerror({ error: 'interrupted' }); } },
      speak(u) { coda.push(u); S.pending = true; setTimeout(prossima, 10); } };
    function prossima() { if (parlando || !coda.length) { S.pending = coda.length > 0; return; } const u = parlando = coda.shift(); S.pending = coda.length > 0; S.speaking = true;
      const muta = (window.__micAcceso || 0) > 0; reg.push([muta ? 'MUTA' : 'voce', ora(), u.text]);
      u.onstart && u.onstart({}); setTimeout(() => { if (parlando !== u) return; parlando = null; S.speaking = false; u.onend && u.onend({}); prossima(); }, 60 + u.text.length * 3); }
    Object.defineProperty(window, 'speechSynthesis', { value: S, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraLive && window.speakRobotic && window.BSISpectraVoce), null, { timeout: 60000 });

  async function prova(nome, codice) {
    return pg.evaluate(async ([nome, codice]) => {
      const P = ms => new Promise(r => setTimeout(r, ms)), L = BSISpectraLive;
      L.sentinella.ferma(); await P(100); window.__reg.length = 0; window.__micAcceso = 0;
      L.sentinella.avvia(true); await P(200);
      const t0 = performance.now(); (new Function(codice))();
      for (let i = 0; i < 100; i++) { await P(100); const r = window.__reg; if (r.some(x => x[0] === 'rec+' && x[1] > t0 + 50) && !speechSynthesis.speaking && !speechSynthesis.pending) break; }
      await P(300);
      const r = window.__reg.slice(), primaVoce = r.findIndex(x => x[0] === 'voce' || x[0] === 'MUTA'), fermo = r.findIndex(x => x[0] === 'rec-');
      const frasi = r.filter(x => x[0] === 'voce').length, mute = r.filter(x => x[0] === 'MUTA').length;
      const rip = r.filter((x, i) => x[0] === 'rec+' && i > primaVoce), ultimaVoce = r.map(x => x[0]).lastIndexOf('voce');
      const durante = r.filter((x, i) => x[0] === 'rec+' && i > primaVoce && i < ultimaVoce).length;
      L.sentinella.ferma();
      return { nome, frasi, mute, fermoPrima: fermo >= 0 && fermo < primaVoce, pausa: fermo >= 0 && primaVoce >= 0 ? r[primaVoce][1] - r[fermo][1] : -1, riparte: rip.length > 0 && r.indexOf(rip[0]) > ultimaVoce, durante, seq: r.map(x => x[0]).join(' ') };
    }, [nome, codice]);
  }
  const TESTO = 'Ciao, sono Spectra. Questa è la prima frase. Questa è la seconda. E questa è la terza.';
  for (const [nome, cod] of [['console (Spectra Live)', 'BSISpectraLive.parla(' + JSON.stringify(TESTO) + ')'], ['chat (🔊 Ascolta)', 'window.speakRobotic(' + JSON.stringify(TESTO) + ')'], ['voce di qualità senza chiave (ripiego del sistema)', 'BSISpectraVoce.parla(' + JSON.stringify(TESTO) + ')']]) {
    console.log('\n── ' + nome + ' ──');
    const r = await prova(nome, cod);
    console.log('      sequenza: ' + r.seq);
    vero('il microfono si ferma prima della prima frase', r.fermoPrima);
    vero('fra il microfono spento e la voce passa un attimo (' + r.pausa + ' ms ≥ 300)', r.pausa >= 300);
    att('nessuna frase muta (detta col microfono acceso)', 0, r.mute);
    att('tutte e quattro le frasi dette', 4, r.frasi);
    att('mentre parla la sentinella non riparte', 0, r.durante);
    vero('finita la voce, la sentinella riparte da sola', r.riparte);
  }
  console.log('\n── Senza sentinella non si aspetta ──');
  const s = await pg.evaluate(async () => { const P = ms => new Promise(r => setTimeout(r, ms)); BSISpectraLive.sentinella.ferma(); await P(100); window.__reg.length = 0; const t0 = performance.now(); BSISpectraLive.parla('Una frase sola.'); for (let i = 0; i < 30; i++) { await P(20); if (window.__reg.length) break; } const v = window.__reg.find(x => x[0] === 'voce'); return v ? v[1] - t0 : -1; });
  vero('con la sentinella spenta la voce parte subito (' + Math.round(s) + ' ms)', s >= 0 && s < 200);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
