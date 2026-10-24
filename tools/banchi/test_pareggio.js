#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_pareggio — le dodici sezioni che portano matematica e fisica al
   livello della chimica

   PERCHE' QUESTO BANCO ESISTE

   La richiesta: le tre materie allo stesso livello. Prima di questa versione
   la matematica aveva 15 sezioni e la fisica 23, la chimica piu' di settanta
   in cinque gruppi. Qui entrano otto sezioni di matematica (successioni e
   serie, calcolo delle variazioni, topologia, strutture algebriche, teoria
   dei giochi, logica e calcolabilita', statistica inferenziale, geometrie non
   euclidee) e quattro di fisica (particelle, meccanica analitica, laser e
   ottica quantistica, clima).

   Ogni sezione ha il suo script di verifica in `verifiche/`, che mette ogni
   calcolo davanti a un risultato noto o a un secondo metodo indipendente:
   π²/6, la cicloide piu' veloce di ogni altra curva, χ dei solidi platonici
   dai loro vertici e facce, i 549 946 nodi del tris, i busy beaver, i
   quantili t delle tavole, Girard sulla sfera, l'impulso del pione 29,79
   MeV/c, il periodo esatto del pendolo con l'integrale ellittico, Rabi
   contro Schrodinger, 255 K e 288 K del bilancio radiativo. Questo banco li
   esegue tutti, poi apre le dodici sezioni nel browser su due schermi e
   controlla che le materie abbiano davvero il numero di sezioni dichiarato.

   USO   node tools/banchi/test_pareggio.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const VERIFICHE = path.join(__dirname, 'verifiche');
const MINIMO = 480;

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

/* [script di verifica, id, gruppo, schede] */
const SEZ = [
  ['verifica-smatserie.js', 'smatserie', 8, 4], ['verifica-smatvariaz.js', 'smatvariaz', 8, 4],
  ['verifica-smattopo.js', 'smattopo', 8, 4], ['verifica-smatalgebra.js', 'smatalgebra', 8, 4],
  ['verifica-smatgiochi.js', 'smatgiochi', 8, 4], ['verifica-smatlogica.js', 'smatlogica', 8, 4],
  ['verifica-smatinfer.js', 'smatinfer', 8, 4], ['verifica-smatnoneucl.js', 'smatnoneucl', 8, 3],
  ['verifica-sfispart.js', 'sfispart', 7, 4], ['verifica-sfisanalitica.js', 'sfisanalitica', 7, 4],
  ['verifica-sfislaser.js', 'sfislaser', 7, 4], ['verifica-sfisclima.js', 'sfisclima', 7, 4]
];

(async () => {
  console.log('── Le verifiche dei calcoli ──');
  for (const [s, id] of SEZ) {
    let out = '', codice = 0;
    try { out = execFileSync(process.execPath, [path.join(VERIFICHE, s)], { encoding: 'utf8', timeout: 300000 }); }
    catch (e) { out = (e.stdout || '') + (e.stderr || ''); codice = e.status || 1; }
    /* ogni riga di controllo dello script conta come un controllo qui */
    /* il riepilogo finale dello script: «N superati, M falliti» oppure «N/T controlli superati» */
    const righe = out.split('\n'), m1 = out.match(/(\d+) superati, (\d+) falliti/), m2 = out.match(/(\d+)\/(\d+) controlli superati/);
    const superati = m1 ? +m1[1] : m2 ? +m2[1] : 0, nFalliti = m1 ? +m1[2] : m2 ? +m2[2] - +m2[1] : 1,
          falliti = righe.filter(r => /^\s*(✗|KO|FALLITO)/.test(r)).concat(new Array(Math.max(0, nFalliti - righe.filter(r => /^\s*(✗|KO|FALLITO)/.test(r)).length)).fill('(riepilogo)'));
    ok += superati; ko += falliti.length; eseguiti += superati + falliti.length;
    console.log('  ' + (codice || falliti.length ? '✗' : '✓') + ' ' + id + ': ' + superati + ' controlli superati' + (falliti.length ? ', ' + falliti.length + ' falliti' : ''));
    falliti.slice(0, 5).forEach(r => console.log('      ! ' + r.trim().slice(0, 160)));
    if (codice && !falliti.length) { ko++; eseguiti++; console.log('      ! lo script e\' uscito con codice ' + codice); }
  }

  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async (SEZ) => {
      const gg = document.getElementById('bsi-guide'); if (gg) gg.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms)), out = {};
      for (const [, s, g] of SEZ) {
        document.querySelector('.nav-group-tab[data-group="' + g + '"]').click();
        const b = document.querySelector('#navGroup' + g + ' .nav-btn[data-s="' + s + '"]'); if (!b) { out[s] = { manca: true }; continue; }
        b.click(); await pausa(600);
        const sec = document.getElementById(s), sch = sec.querySelectorAll('.bsiFX-schede button'); let piene = 0, tele = 0, disegnate = 0, avvisi = 0, etichette = true, lenta = 0;
        for (let i = 0; i < sch.length; i++) {
          const t0 = performance.now(); sch[i].click(); lenta = Math.max(lenta, performance.now() - t0); await pausa(2200);
          const pan = [...sec.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent); if (pan.textContent.length > 100) piene++; if (/⚠/.test(pan.textContent)) avvisi++;
          pan.querySelectorAll('canvas').forEach(c => { if (!c.offsetParent) return; tele++; if ((c.getAttribute('aria-label') || '').length < 3) etichette = false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 0; k < d.length; k += 4 * 31) if (d[k] + d[k + 1] + d[k + 2] > 120) n++; if (n > 5) disegnate++; });
        }
        out[s] = { schede: sch.length, piene, tele, disegnate, avvisi, etichette, lenta: Math.round(lenta) };
      }
      /* quante sezioni ha ogni materia: si contano i pulsanti della barra */
      const conta = gs => gs.reduce((a, g) => a + document.querySelectorAll('#navGroup' + g + ' .nav-btn').length, 0);
      out.conteggi = { chimica: conta([0, 1, 2, 3, 4]), fisica: conta([7]), matematica: conta([8]) };
      out.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return out;
    }, SEZ);
    console.log('── ' + nome + ' ──');
    for (const [, s, , n] of SEZ) {
      const x = r[s];
      vero(s + ': ' + n + ' schede piene, nessun avviso, le tele disegnano e hanno un nome', x && !x.manca && x.schede === n && x.piene === n && x.avvisi === 0 && x.disegnate === x.tele && x.tele > 0 && x.etichette);
      if (x && (x.disegnate !== x.tele || !x.etichette || x.piene !== n)) console.log('      ! ' + JSON.stringify(x));
      vero(s + ': ogni scheda si apre in meno di 100 ms', x && x.lenta < 100);
    }
    if (nome === 'schermo grande') {
      console.log('      (sezioni: chimica ' + r.conteggi.chimica + ', fisica ' + r.conteggi.fisica + ', matematica ' + r.conteggi.matematica + ')');
      vero('la matematica ha almeno 25 sezioni (erano 15)', r.conteggi.matematica >= 25);
      vero('la fisica ha almeno 30 sezioni (erano 23)', r.conteggi.fisica >= 30);
    } else att('a 390 px niente sborda', 0, r.sborda);
    att('nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
    await ctx.close();
  }
  const ctxE = await browser.newContext({ serviceWorkers: 'block' });
  const pgE = await ctxE.newPage();
  await pgE.addInitScript(() => { try { localStorage.setItem('bsi_lang', 'en'); localStorage.setItem('bsi-lingua', 'en'); } catch (e) {} });
  await pgE.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pgE.waitForTimeout(5000);
  const tr = await pgE.evaluate(async () => { if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en'); await new Promise(r => setTimeout(r, 1500)); return ['smatserie', 'smatgiochi', 'sfispart', 'sfisclima'].map(s => document.querySelector('.nav-btn[data-s="' + s + '"]').textContent.trim()); });
  att('in inglese: i nomi delle sezioni', '♾️ Sequences and series|♟️ Game theory|⚛️ Particle physics|🌍 Climate physics', tr.join('|'));
  await ctxE.close();
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
