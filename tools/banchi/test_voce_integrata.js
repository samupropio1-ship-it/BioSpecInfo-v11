#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_voce_integrata — 🔊 Spectra ha una voce propria, offline, senza installare nulla (v277)

   PERCHE' QUESTO BANCO ESISTE
   L'autore sentiva il «bip» di prova ma non la voce: su molti telefoni e PC
   il browser non ha NESSUNA voce di sistema (speechSynthesis.getVoices() = 0),
   quindi la sintesi del sistema resta muta. Il vincolo era chiaro: «non devi
   scaricare alcun pacchetto vocale manuale sul telefono e non serve nulla di
   esterno». La soluzione è che l'app porti la PROPRIA voce dentro di sé
   (meSpeak = eSpeak compilato in JavaScript), generi un WAV e lo suoni con la
   Web Audio API — lo stesso canale del bip, quello che sul dispositivo
   funziona. Niente voci da installare, niente servizi esterni.

   Questo banco pretende, SIMULANDO il dispositivo senza voci (Chromium headless
   ne ha 0), che: il modulo esista e sia supportato; la qualità vocale diventi
   «integrata»; la voce integrata produca davvero audio decodabile in italiano,
   inglese e per il ripiego del russo (non incluso in meSpeak → inglese); e che
   la catena vocale unica (BSISpectraVoce.parla), usata dall'auto-lettura, vi
   ricada da sola. Niente motore vocale duplicato: si riusa la catena esistente.

   USO   node tools/banchi/test_voce_integrata.js   (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, a, v) { if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  console.log('── Il motore offline è nel repository, senza nulla da installare ──');
  const V = path.join(RADICE, 'vendor', 'mespeak');
  vero('c\'è il bundle meSpeak (motore + wrapper in un file)', fs.existsSync(path.join(V, 'mespeak-bundle.js')));
  vero('c\'è la configurazione eSpeak', fs.existsSync(path.join(V, 'mespeak_config.json')));
  vero('c\'è la voce italiana', fs.existsSync(path.join(V, 'voices', 'it.json')));
  vero('c\'è la voce inglese', fs.existsSync(path.join(V, 'voices', 'en.json')));
  ['es', 'fr', 'de', 'pt-pt', 'el', 'zh'].forEach(function (l) { vero('c\'è la voce ' + l, fs.existsSync(path.join(V, 'voices', l + '.json'))); });

  console.log('\n── Il modulo è cablato nell\'app e nella catena vocale (nessun doppione) ──');
  const idx = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
  vero('index.html carica bsi-spectra-tts-integrata.js', /bsi-spectra-tts-integrata\.js/.test(idx));
  const voce = fs.readFileSync(path.join(RADICE, 'bsi-spectra-voce.js'), 'utf8');
  vero('il ripiego del sistema instrada alla voce integrata quando mancano le voci', /BSISpectraTTSIntegrata/.test(voce) && /vociSistemaUsabili\(\)\s*===\s*0/.test(voce));
  vero('qualita() può restituire «integrata»', /return 'integrata'/.test(voce));
  const hub = fs.readFileSync(path.join(RADICE, 'bsi-ai-hub.js'), 'utf8');
  vero('l\'auto-lettura (speakRobotic) usa la catena per la voce integrata', /q === 'integrata'/.test(hub) && /usaMotore/.test(hub));
  const ttsSrc = fs.readFileSync(path.join(RADICE, 'bsi-spectra-tts-integrata.js'), 'utf8');
  vero('la voce integrata suona sul contesto Web Audio condiviso (come il bip)', /BSISpectraLive\s*&&[^]*ctxAudio/.test(ttsSrc));

  console.log('\n── Nel browser SENZA voci di sistema (come il dispositivo dell\'autore) ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  /* (v277) anche gli ERRORI DI CONSOLE: caricare il bundle della voce non deve sporcare la
     console (es. «unload is not allowed», che i banchi "nessun errore" intercettano). */
  const consErr = []; pg.on('console', m => { if (m.type() === 'error') consErr.push(m.text().slice(0, 160)); });
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraTTSIntegrata && window.BSISpectraVoce), null, { timeout: 60000 });

  const stato = await pg.evaluate(() => ({
    voci: (window.speechSynthesis ? speechSynthesis.getVoices().length : -1),
    esiste: !!window.BSISpectraTTSIntegrata,
    supportata: window.BSISpectraTTSIntegrata.supportata(),
    qualita: window.BSISpectraVoce.qualita(),
    voceSupportata: (typeof window.voceSupportata === 'function') ? window.voceSupportata() : 'n/a',
    dispIt: window.BSISpectraTTSIntegrata.disponibilePer('it'),
    dispEn: window.BSISpectraTTSIntegrata.disponibilePer('en'),
    dispZh: window.BSISpectraTTSIntegrata.disponibilePer('zh'),
    lingue: window.BSISpectraTTSIntegrata.lingue().length
  }));
  att('il browser headless non ha voci di sistema (è il caso da risolvere)', 0, stato.voci);
  vero('il modulo della voce integrata esiste', stato.esiste);
  vero('la voce integrata è supportata (c\'è la Web Audio)', stato.supportata);
  att('la qualità vocale diventa «integrata»', 'integrata', stato.qualita);
  vero('la voce risulta supportata anche senza voci di sistema', stato.voceSupportata === true);
  vero('c\'è la voce per italiano, inglese e cinese', stato.dispIt && stato.dispEn && stato.dispZh);
  vero('sono disponibili almeno 9 lingue', stato.lingue >= 9);

  console.log('\n── La voce integrata produce davvero audio (WAV decodabile) ──');
  const it = await pg.evaluate(() => window.BSISpectraTTSIntegrata.parla('Ciao, sono Spectra. Prova della voce integrata.', 'it', {}));
  vero('italiano: riproduzione riuscita dal motore integrato', it && it.ok === true && it.motore === 'integrata');
  vero('italiano: durata audio plausibile (> 0,5 s)', it && it.durata > 0.5);
  const en = await pg.evaluate(() => window.BSISpectraTTSIntegrata.parla('Hello, this is Spectra speaking.', 'en', {}));
  vero('inglese: riproduzione riuscita', en && en.ok === true && en.motore === 'integrata');
  const ru = await pg.evaluate(() => window.BSISpectraTTSIntegrata.parla('Privet, eto Spectra.', 'ru', {}));
  vero('russo (non incluso in meSpeak): ripiega e non resta muto', ru && (ru.ok === true || ru.annullato === true));

  console.log('\n── La catena vocale unica ci ricade da sola (quella dell\'auto-lettura) ──');
  const catena = await pg.evaluate(() => window.BSISpectraVoce.parla('Seconda prova dalla catena vocale.'));
  vero('BSISpectraVoce.parla usa il motore integrato quando mancano le voci', catena && catena.ok === true && catena.motore === 'integrata');
  const taci = await pg.evaluate(() => { try { window.BSISpectraVoce.ferma(); return true; } catch (e) { return false; } });
  vero('si può fermare senza errori', taci);

  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  att('nessun errore di console caricando e usando la voce integrata', 0, consErr.length); consErr.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
