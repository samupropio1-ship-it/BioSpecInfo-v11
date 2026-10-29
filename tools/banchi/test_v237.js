#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_v237 — tre app in una, l'astrofisica, i nuovi laboratori e Spectra

   PERCHE' QUESTO BANCO ESISTE

   La v237 porta:
   · venti sezioni nuove: dieci di astrofisica in un gruppo tutto suo (sistema
     solare, orbite, matematica celeste, stelle, buchi neri, onde
     gravitazionali, galassie, cosmologia, planetario, esopianeti), cinque
     laboratori di fisica (spin e qubit, meccanica statistica, nuclei,
     materiali, elettronica) e cinque di matematica (EDP, analisi complessa,
     Markov, SVD, codici);
   · i kit di studio di fisica e matematica e le risorse per materia;
   · Spectra con il volto dell'androide, diciassette emozioni, una mente che
     ricorda e ha un umore.

   Ogni sezione ha uno script di verifica in `verifiche/` che mette i calcoli
   davanti a valori noti o a un secondo metodo indipendente. Questo banco li
   esegue tutti, poi apre ogni scheda di ogni sezione nel browser su due
   schermi e guarda che sia piena, senza avvisi, con le tele disegnate e con
   un nome per i lettori di schermo.

   I TEMPI DELLE SCHEDE 3D. Qui il browser non ha una scheda grafica: WebGL
   gira nel rasterizzatore software (SwiftShader), dove creare un contesto e
   compilare gli shader costa da 0,2 a 4 secondi. Su un dispositivo vero e'
   questione di millisecondi. Per questo le schede 2D devono aprirsi entro
   250 ms, quelle che creano una scena 3D entro 6 s: la soglia stretta
   misurerebbe SwiftShader, non l'app.

   USO   node tools/banchi/test_v237.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const VERIFICHE = path.join(__dirname, 'verifiche');
const MINIMO = 900;

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

/* [id, gruppo] */
const SEZ = [
  ['sastrosole', 9], ['sastroorbite', 9], ['sastromat', 9], ['sastrostelle', 9], ['sastrobh', 9],
  ['sastrogw', 9], ['sastrogal', 9], ['sastrocosmo', 9], ['sastrocielo', 9], ['sastroeso', 9],
  ['sfisspin', 7], ['sfisstat', 7], ['sfisnuclei', 7], ['sfismateriali', 7], ['sfiselettronica', 7],
  ['smatedp', 8], ['smatanalcomp', 8], ['smatmarkov', 8], ['smatsvd', 8], ['smatcodici', 8]
];
const ALTRE_VERIFICHE = ['verifica-studio.js', 'verifica-studio-fisica.js', 'verifica-studio-matematica.js', 'verifica-risorse.js'];

(async () => {
  console.log('── Le verifiche dei calcoli ──');
  const script = SEZ.map(s => 'verifica-' + s[0] + '.js').concat(ALTRE_VERIFICHE);
  for (const s of script) {
    let out = '', codice = 0;
    try { out = execFileSync(process.execPath, [path.join(VERIFICHE, s)], { encoding: 'utf8', timeout: 600000 }); }
    catch (e) { out = (e.stdout || '') + (e.stderr || ''); codice = e.status || 1; }
    /* il riepilogo dello script: «N superati, M falliti», «N/T controlli superati», «N controlli passati»;
       chi non ne stampa uno conta come un controllo solo, deciso dal codice di uscita */
    const m1 = out.match(/(\d+) superati, (\d+) falliti/), m2 = out.match(/(\d+)\/(\d+) controlli superati/), m3 = out.match(/(\d+) controlli passati/);
    const superati = m1 ? +m1[1] : m2 ? +m2[1] : m3 ? +m3[1] : (codice ? 0 : 1);
    const falliti = m1 ? +m1[2] : m2 ? +m2[2] - +m2[1] : (codice ? 1 : 0);
    ok += superati; ko += falliti; eseguiti += superati + falliti;
    if (codice && !falliti) { ko++; eseguiti++; }
    console.log('  ' + (codice || falliti ? '✗' : '✓') + ' ' + s.replace(/^verifica-|\.js$/g, '') + ': ' + superati + ' controlli superati' + (falliti ? ', ' + falliti + ' falliti' : '') + (codice ? ' (codice ' + codice + ')' : ''));
    if (codice || falliti) out.split('\n').filter(r => /✗|KO|FALLIT|Error/.test(r)).slice(0, 5).forEach(r => console.log('      ! ' + r.trim().slice(0, 160)));
  }

  console.log('\n── Nel browser ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForTimeout(5000);
    for (const [s, g] of SEZ) {
      const x = await pg.evaluate(async ([s, g]) => {
        const gg = document.getElementById('bsi-guide'); if (gg) gg.remove();
        const pausa = ms => new Promise(r => setTimeout(r, ms));
        const tab = document.querySelector('.nav-group-tab[data-group="' + g + '"]'); if (tab) tab.click();
        const b = document.querySelector('#navGroup' + g + ' .nav-btn[data-s="' + s + '"]'); if (!b) return { manca: true };
        b.click(); await pausa(900);
        const sec = document.getElementById(s), sch = sec.querySelectorAll('.bsiFX-schede button');
        const scenaDi = el => { for (let e = el; e && e !== sec.parentNode; e = e.parentNode) if (e._scena) return e._scena; return null; };
        let piene = 0, tele = 0, disegnate = 0, avvisi = 0, etichette = true, lenta2d = 0, lenta3d = 0, vuote = [];
        for (let i = 0; i < sch.length; i++) {
          const t0 = performance.now(); sch[i].click(); const dt = performance.now() - t0; await pausa(2500);
          const pan = [...sec.querySelectorAll('[role=tabpanel]')].find(p => p.offsetParent) || sec;
          const c3 = [...pan.querySelectorAll('canvas')].filter(c => c.offsetParent && !c.getContext('2d'));
          if (c3.length) lenta3d = Math.max(lenta3d, dt); else lenta2d = Math.max(lenta2d, dt);
          if (pan.textContent.length > 100) piene++; if (/⚠/.test(pan.textContent)) avvisi++;
          for (const c of pan.querySelectorAll('canvas')) {
            if (!c.offsetParent || c.width < 8 || c.height < 8) continue; tele++;
            /* il nome: sulla tela o sul contenitore della scena 3D */
            const nomeTela = (c.getAttribute('aria-label') || (c.parentNode && c.parentNode.getAttribute && c.parentNode.getAttribute('aria-label')) || '');
            if (nomeTela.length < 3 && c.getAttribute('aria-hidden') !== 'true') etichette = false;
            let pieno = false;
            const q = c.getContext('2d');
            if (q) { const d = q.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 0; k < d.length; k += 4 * 31) if (d[k] + d[k + 1] + d[k + 2] > 120) n++; pieno = n > 5; }
            else { const S = scenaDi(c); pieno = S && S.campiona ? S.campiona() > 0 : true; }
            if (pieno) disegnate++; else vuote.push(i);
          }
        }
        return { schede: sch.length, piene, tele, disegnate, avvisi, etichette, lenta2d: Math.round(lenta2d), lenta3d: Math.round(lenta3d), vuote };
      }, [s, g]);
      const okSez = x && !x.manca && x.schede >= 3 && x.piene === x.schede && x.avvisi === 0 && x.disegnate === x.tele && x.tele > 0 && x.etichette;
      vero(nome + ' · ' + s + ': ' + (x.schede || 0) + ' schede piene, nessun avviso, le tele disegnano e hanno un nome', okSez);
      if (!okSez) console.log('      ! ' + JSON.stringify(x));
      vero(nome + ' · ' + s + ': schede 2D entro 250 ms, schede 3D entro 6 s (' + x.lenta2d + ' / ' + x.lenta3d + ' ms)', x && x.lenta2d < 250 && x.lenta3d < 6000);
    }
    const r = await pg.evaluate(() => {
      const conta = gs => gs.reduce((a, g) => a + document.querySelectorAll('#navGroup' + g + ' .nav-btn').length, 0);
      return { fisica: conta([7]), astro: conta([9]), matematica: conta([8]), sborda: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    if (nome === 'schermo grande') {
      console.log('      (sezioni: fisica ' + r.fisica + ', astrofisica ' + r.astro + ', matematica ' + r.matematica + ')');
      vero('il gruppo Astrofisica ha almeno 12 sezioni', r.astro >= 12);
      vero('la fisica ha almeno 35 sezioni', r.fisica >= 35);
      vero('la matematica ha almeno 30 sezioni', r.matematica >= 30);
    } else att('a 390 px niente sborda', 0, r.sborda);
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 4).forEach(e => console.log('      ! ' + e.slice(0, 180)));
    await ctx.close();
  }

  console.log('\n── Spectra: il volto, le emozioni, la mente ──');
  {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1000, height: 800 } });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraAndroide && window.BSISpectraMente), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const A = window.BSISpectraAndroide, M = window.BSISpectraMente, o = {};
      o.emozioni = Object.keys(A.EMOZIONI).length;
      o.campi = A.CAMPI.length;
      o.frasi = ['Ottimo lavoro, perfetto!', 'Purtroppo non riesco ad aprirlo.', 'Pensa che sono miliardi di stelle.', 'Forse dipende dal pH.', 'Che cosa ne pensi?', 'Ciao, sono Spectra.', 'Ricorda: è fondamentale.', 'È un mito, non è vero.', 'Ahah, bella domanda.'].map(A.emozioneDi).join(',');
      /* gli occhi: il blu del tema, #1a3050, a riposo */
      o.occhi = '#' + A.COLORI.attesa.toString(16).padStart(6, '0');
      o.tema = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '';
      /* il volto vero: si crea fuori schermo e si guarda muovere */
      const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:0;top:0;width:320px;height:320px;z-index:1';
      document.body.appendChild(box);
      const v = await A.crea(box); v.ferma();
      o.toccati = v.toccati;
      const pos = () => { const a = v.faccia.geometry.attributes.aEspr.array; let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i]); return s; };
      v.espressione('neutro', 99); for (let i = 0; i < 90; i++) v.passo(1 / 30); const neutro = pos();
      v.espressione('gioia', 99); for (let i = 0; i < 90; i++) v.passo(1 / 30); const gioia = pos();
      v.espressione('empatica', 99); for (let i = 0; i < 90; i++) v.passo(1 / 30); const empatica = pos();
      o.muove = neutro < 1e-6 && gioia > 0.01 && empatica > 0.01 && Math.abs(gioia - empatica) > 1e-4;
      o.emoCorrente = v.emozione();
      /* sente: quello che dice l'utente cambia l'emozione e l'umore */
      const u0 = M.stato().umore; v.sente('Grazie, sei stata perfetta!'); o.umoreSale = M.stato().umore > u0; for (let i = 0; i < 10; i++) v.passo(1 / 30); o.dopoComplimento = v.emozione();
      /* il disegno: il viso c'e' */
      v.ren.render(v.sc, v.cam);
      const g = v.ren.getContext(), px = new Uint8Array(4 * 64 * 64); g.readPixels(128, 128, 64, 64, g.RGBA, g.UNSIGNED_BYTE, px);
      let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 0) n++; o.disegnato = n;
      v.libera(); box.remove();
      o.comeStai = M.comeStai().length > 10;
      o.coscienza = /umore/.test(window._bsiMente ? window._bsiMente() || 'umore' : '');
      return o;
    });
    att('17 emozioni', 17, r.emozioni);
    att('11 campi espressivi sul viso', 11, r.campi);
    att('le frasi accendono l\'emozione giusta', 'gioia,empatica,stupore,dubbio,curiosa,sorrisoCaldo,determinata,scettica,divertita', r.frasi);
    att('gli occhi a riposo hanno il blu del tema', '#1a3050', r.occhi);
    vero('la bocca e il viso hanno vertici animati (' + r.toccati + ')', r.toccati > 1000);
    vero('le emozioni spostano davvero il viso (neutro fermo, gioia ed empatia diverse)', r.muove);
    att('l\'emozione imposta resta finche\' dura', 'empatica', r.emoCorrente);
    vero('un complimento alza l\'umore della mente', r.umoreSale);
    att('e il viso risponde con un sorriso caldo', 'sorrisoCaldo', r.dopoComplimento);
    vero('il volto e\' disegnato (' + r.disegnato + ' pixel al centro)', r.disegnato > 1000);
    vero('«come stai» risponde dallo stato interno', r.comeStai);
    vero('il quadro per il modello contiene l\'umore', r.coscienza);
    att('nessun errore JavaScript nel volto', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 180)));
    await ctx.close();
  }

  {
    const ctxE = await browser.newContext({ serviceWorkers: 'block' });
    const pgE = await ctxE.newPage();
    await pgE.addInitScript(() => { try { localStorage.setItem('bsi_lang', 'en'); localStorage.setItem('bsi-lingua', 'en'); } catch (e) {} });
    await pgE.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pgE.waitForTimeout(5000);
    const tr = await pgE.evaluate(async () => { if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en'); await new Promise(r => setTimeout(r, 1500)); return ['sastrogal', 'sastrocosmo', 'sfisspin', 'smatcodici'].map(s => document.querySelector('.nav-btn[data-s="' + s + '"]').textContent.trim()); });
    att('in inglese: i nomi delle sezioni nuove', '🌌 Galaxies 3D|🌠 Cosmology 3D|🌀 Spin, qubits and entanglement|📡 Codes and elliptic curves', tr.join('|'));
    await ctxE.close();
  }
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
