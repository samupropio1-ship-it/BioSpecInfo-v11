#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_pronuncia — 🔊 La voce di Spectra pronuncia bene chimica e matematica (v273)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto una voce «fluida e naturale» che non legga simboli,
   markdown o formule grezze in modo innaturale. Il normalizzatore unico
   (perLaVoce, usato da TUTTI i motori vocali) deve: sciogliere le sigle e le
   unità scientifiche, scandire le formule brute, togliere markdown, emoji e
   URL, e lasciare intatti i simboli matematici che ha già a listino. In più
   il system prompt del modello deve chiedergli di scrivere testo
   pronunciabile. Qui si pretende tutto questo, senza inventare un secondo
   motore vocale.

   USO   node tools/banchi/test_pronuncia.js   (serve un server su :8899)
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
function contiene(d, testo, pezzo) { vero(d + '  («' + pezzo + '»)', String(testo).indexOf(pezzo) >= 0); }
function nonContiene(d, testo, pezzo) { vero(d, String(testo).indexOf(pezzo) < 0); }

(async () => {
  console.log('── Il system prompt chiede testo pronunciabile ──');
  const hub = fs.readFileSync(path.join(RADICE, 'bsi-ai-hub.js'), 'utf8');
  vero('BASE_SYSTEM ha la sezione VOCE E PRONUNCIA', /VOCE E PRONUNCIA/.test(hub));
  vero('il modello riceve la lingua attiva del selettore (LINGUA ATTIVA)', /LINGUA ATTIVA/.test(hub) && /Rispondi SEMPRE in/.test(hub));
  vero('il ripiego vocale ha la mappa BCP-47 per tutte le lingue', /el-GR/.test(fs.readFileSync(path.join(RADICE, 'bsi-spectra-voce.js'), 'utf8')) && /ru-RU/.test(fs.readFileSync(path.join(RADICE, 'bsi-spectra-voce.js'), 'utf8')));
  vero('chiede di sciogliere le formule (C 8 H 7 N O)', /C 8 H 7 N O/.test(hub));
  vero('chiede «rapporto massa su carica» e «indice di insaturazione»', /rapporto massa su carica/.test(hub) && /indice di insaturazione/.test(hub));
  vero('vieta markdown ed emoji a voce', /niente markdown/.test(hub) && /niente emoji/.test(hub));

  console.log('\n── Il normalizzatore unico perLaVoce ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSISpectraLive.calcolo && window.BSISpectraLive.calcolo.perLaVoce), null, { timeout: 60000 });
  const R = await pg.evaluate(() => {
    const f = window.BSISpectraLive.calcolo.perLaVoce;
    return {
      formula: f('il composto C8H7NO'),
      formula2: f('glucosio C6H12O6'),
      acr: f('misura di ATP e NADH'),
      cm1: f('1715 cm-1'), cmsup: f('1600 cm⁻¹'), cmpow: f('2200 cm^-1'),
      mz: f('picco m/z 133'),
      hz: f('accoppiamento 7 Hz'), mhz: f('spettrometro 400 MHz'),
      ihd: f('IHD pari a 6'), ppm: f('segnale a 7,26 ppm'),
      nmr1: f('spettro 1H-NMR'), nmr13: f('spettro 13C-NMR'),
      solv: f('in CDCl3 con D2O e DMSO'),
      emoji: f('ecco 🔬 lo spettro ⚗️🎙️'),
      url: f('apri https://example.com/a?b=1 ora'),
      math: f('x² + √2 → ∑ valori, Δ e π'),
      md: f('**grassetto** e `codice` e # titolo')
    };
  });
  contiene('formula bruta scandita', R.formula, 'C 8 H 7 N O');
  contiene('formula con più numeri scandita', R.formula2, 'C 6 H 12 O 6');
  contiene('le sigle si leggono lettera per lettera', R.acr, 'A T P');
  contiene('cm-1 → unità per esteso', R.cm1, 'centimetri alla meno uno');
  contiene('cm⁻¹ (apice) → unità per esteso', R.cmsup, 'centimetri alla meno uno');
  contiene('cm^-1 → unità per esteso', R.cmpow, 'centimetri alla meno uno');
  contiene('m/z → rapporto massa su carica', R.mz, 'rapporto massa su carica');
  contiene('Hz → hertz', R.hz, 'hertz');
  contiene('MHz → megahertz', R.mhz, 'megahertz');
  contiene('IHD → indice di insaturazione', R.ihd, 'indice di insaturazione');
  contiene('ppm → parti per milione', R.ppm, 'parti per milione');
  contiene('1H-NMR → risonanza magnetica protonica', R.nmr1, 'protonica');
  contiene('13C-NMR → del carbonio tredici', R.nmr13, 'carbonio tredici');
  contiene('CDCl3 → cloroformio deuterato', R.solv, 'cloroformio deuterato');
  contiene('D2O → acqua deuterata', R.solv, 'acqua deuterata');
  contiene('DMSO → dimetilsolfossido', R.solv, 'dimetilsolfossido');
  vero('le emoji vengono tolte', !/[🔬⚗️🎙️]/u.test(R.emoji) && R.emoji.indexOf('spettro') >= 0);
  vero('gli URL vengono tolti', R.url.indexOf('http') < 0 && R.url.indexOf('example.com') < 0);
  contiene('i simboli matematici restano (→ letto)', R.math, 'porta a');
  contiene('le potenze restano (² letto)', R.math, 'al quadrato');
  contiene('la radice resta', R.math, 'radice di');
  nonContiene('niente asterischi di markdown', R.md, '*');
  nonContiene('niente cancelletti di markdown', R.md, '#');
  nonContiene('niente apici di codice', R.md, '`');
  console.log('\n── La normalizzazione rispetta la lingua scelta ──');
  const ML = await pg.evaluate(() => {
    const f = window.BSISpectraLive.calcolo.perLaVoce, B = window.BSILingue, o = {};
    B.imposta('es'); o.es = f('banda 1600 cm-1 con C8H7NO e un emoji 🔬');
    B.imposta('it'); o.it = f('banda 1600 cm-1');
    B.imposta('it');
    return o;
  });
  vero('in spagnolo NON mette parole italiane (cm-1 resta simbolo)', ML.es.indexOf('centimetri') < 0);
  vero('ma la pulizia universale vale per tutte le lingue (formula scandita, emoji via)', ML.es.indexOf('C 8 H 7 N O') >= 0 && ML.es.indexOf('🔬') < 0);
  vero('in italiano l\'espansione torna attiva', ML.it.indexOf('centimetri alla meno uno') >= 0);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
