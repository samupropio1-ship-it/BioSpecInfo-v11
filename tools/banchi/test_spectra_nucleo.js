#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_spectra_nucleo — Spectra come nucleo olografico, senza aperture automatiche (v259)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto: al posto della figura umanoide un nucleo olografico
   sobrio, transizioni morbide, luci che non saturano, e soprattutto «ogni
   apertura è conseguenza di un'azione dell'utente». Qui si pretende:
   · nei primi 10 s senza interazione non si apre NULLA (risveglio, guida,
     rete, novità, finestra di Spectra, console, ologramma, menu ✨), nessuna
     voce, nessuna tastiera, per tre profili: nuovo, con conversazioni, con
     «sveglia a ogni apertura» e modalità occhiali accese (lì solo inviti da
     toccare); il pulsante di Spectra non pulsa all'infinito;
   · il nucleo: gli stati con i nomi in italiano e in inglese, transizioni
     senza salti (i parametri inseguono l'obiettivo), didascalia parola per
     parola, tessere accese al massimo 6, avviso in ambra che poi rientra,
     schede di dati, «riduci movimento» che ferma gli anelli;
   · l'ologramma non gira più da solo; l'ologramma interattivo non parla da
     solo (interruttore spento di base, ricordato);
   · senza WebGL il nucleo in 2D, con lo stesso HUD.

   USO   node tools/banchi/test_spectra_nucleo.js    (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }
const spia = () => { window.__parlato = 0; try { const o = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { window.__parlato++; }; } catch (e) {} };
const aperto = () => {
  const q = s => document.querySelector(s), out = [];
  [['#bsiRV', 'risveglio'], ['#bsiRD', 'guida'], ['#bsiRN', 'rete'], ['#bsiRV-novita', 'novità'], ['#bsi-hub-ov.open', 'finestra di Spectra'], ['#bsiJV.aperto', 'console'], ['#bsi-olo-ov.aperto', 'ologramma'], ['#bsi14-sheet.open', 'menu ✨']].forEach(([s, n]) => { if (q(s)) out.push(n); });
  const a = document.activeElement; if (a && /INPUT|TEXTAREA/.test(a.tagName)) out.push('tastiera (' + (a.id || a.tagName) + ')');
  return out;
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  console.log('── Nessuna apertura senza un\'azione dell\'utente (10 s, telefono) ──');
  const profili = [
    ['nuovo', () => {}],
    ['con conversazioni', () => { localStorage.setItem('bsi-spectra-mente-v1', JSON.stringify({ nato: 1, episodi: [{ d: 'a' }, { d: 'b' }, { d: 'c' }, { d: 'd' }], sezioni: {}, sessioni: 4 })); localStorage.removeItem('bsi-spectra-novita-v252'); }],
    ['sveglia e occhiali accesi', () => { localStorage.setItem('bsi-spectra-risveglio-v1', JSON.stringify({ avvioSveglia: true, ascolto: true })); }]
  ];
  for (const [nome, prep] of profili) {
    const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await pg.addInitScript('(' + (p => { try { localStorage.setItem('bsi_guide_v3', '1'); (new Function(p))(); } catch (e) {} }).toString() + ')(' + JSON.stringify('(' + prep.toString() + ')()') + ')');
    await pg.addInitScript(spia);
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForTimeout(10000);
    const r = await pg.evaluate(aperto), parlato = await pg.evaluate(() => window.__parlato);
    att(nome + ' · nulla si apre da solo in 10 s', '', r.join(', '));
    att(nome + ' · nessuna voce senza un gesto', 0, parlato);
    if (nome === 'con conversazioni') {
      const p = await pg.evaluate(async () => { const x = document.getElementById('bsiRV-pallino'); if (!x) return 'manca'; x.click(); await new Promise(r => setTimeout(r, 300)); return !!document.getElementById('bsiRV-novita') ? 'apre' : 'non apre'; });
      att('le novità sono un pallino sul pulsante: toccato, apre la sua finestra', 'apre', p);
    }
    if (nome === 'sveglia e occhiali accesi') {
      const p = await pg.evaluate(() => ({ invito: !!document.getElementById('bsiRV-invito'), chip: !!document.querySelector('#bsiRV-chip.fermo .riprendi') }));
      vero('con le preferenze accese compaiono solo inviti da toccare (sveglia, riprendi l\'ascolto)', p.invito && p.chip);
    }
    if (nome === 'nuovo') {
      const fab = await pg.evaluate(() => { const f = document.getElementById('bsi-spectra-fab'); return f ? getComputedStyle(f).animationName : 'none'; });
      att('il pulsante di Spectra non pulsa all\'infinito', 'none', fab);
    }
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 2).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }

  console.log('\n── Il nucleo olografico ──');
  for (const [nome, opz] of [['schermo grande', { viewport: { width: 1280, height: 860 } }], ['riduci movimento', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }]]) {
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [], richieste = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 160))); pg.on('request', r => { if (/spectra-corpo|spectra-noir|gltf_loader|bsi-spectra-(rig|corpo|androide|robot|volto)\.js/.test(r.url())) richieste.push(r.url()); });
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraFigura && window.BSISpectraNucleo), null, { timeout: 60000 });
    await pg.evaluate(() => document.querySelector('[data-s="sareachim"]').click());
    await pg.waitForFunction(() => { const F = BSISpectraFigura.figura; return F && F.spectra && F.spectra.radice; }, null, { timeout: 60000 });
    await pg.evaluate(() => BSISpectraFigura.figura.box.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), F = BSISpectraFigura.figura, S = F.spectra, o = {}, st = () => F.box.querySelector('.bsiN-stato').textContent;
      await pausa(500); o.online = st();
      /* la transizione: si campiona la velocità degli anelli fotogramma per fotogramma */
      S.stato('online'); await pausa(1000); const v = [], tt = [], t0 = S.t; S.stato('cerca'); for (let i = 0; i < 70; i++) { await new Promise(r => requestAnimationFrame(r)); v.push(S.par.vel); tt.push(S.t); }
      /* la rapidità di variazione (per secondo di animazione), che non dipende da quanto dura un fotogramma */
      o.salto = Math.max(...v.slice(1).map((x, i) => Math.abs(x - v[i]) / Math.max(1e-3, tt[i + 1] - tt[i]))); o.primo = Math.abs(v[0] - 1) / Math.max(1e-3, tt[0] - t0);   /* anche il primo passo, rapportato al tempo trascorso */ o.arriva = v[v.length - 1];
      o.cerca = st();
      S.stato('pensa'); await pausa(2500); o.pensa = st(); o.accese = S.accese.length; o.max6 = true; for (let i = 0; i < 20; i++) { await pausa(80); if (S.accese.length > 6) o.max6 = false; }
      S.dici('Lo spettro mostra una banda larga a tremilaquattrocento numeri d\'onda tipica del legame ossigeno idrogeno'); await pausa(400);
      const d = F.box.querySelector('.bsiN-dida p').textContent.split(/\s+/).length; await pausa(1600); const d2 = F.box.querySelector('.bsiN-dida p').textContent.split(/\s+/).length;
      o.parola = [d, d2]; o.parla = st(); o.aria = !!F.box.querySelector('.bsiN-sr[aria-live="polite"]') && /SPETTRO/i.test(F.box.querySelector('.bsiN-sr').textContent);
      S.taci(); S.avviso('PIOGGIA FORTE · 16:00', 2); await pausa(1200); o.avviso = st(); o.banner = F.box.querySelector('.bsiN-avviso').classList.contains('on'); await pausa(2600); o.dopo = st(); o.bannerVia = !F.box.querySelector('.bsiN-avviso').classList.contains('on');
      S.scheda({ titolo: 'SPECTRA · PROVA', valore: '64%', barre: [['lun', 40]], durata: 2 }); await pausa(400); o.scheda = !!F.box.querySelector('.bsiN-card.on');
      const g0 = S.anelli.map(A => A.gr.rotation.z); await pausa(1000); o.anelliFermi = S.anelli.every((A, i) => Math.abs(A.gr.rotation.z - g0[i]) < 1e-9);
      /* l'ologramma non gira da solo */
      const OL = F.olo, prima = OL.attuale; OL.passo(20); o.olo = [OL.auto, OL.attuale === prima];
      BSILingue && BSILingue.imposta && BSILingue.imposta('en'); S.stato('pensa'); o.en = st(); BSILingue && BSILingue.imposta && BSILingue.imposta('it');
      return o;
    });
    vero(nome + ' · stato iniziale a parole: «' + r.online + '»', /IN LINEA|ONLINE/.test(r.online));
    vero(nome + ' · nessun salto: al cambio di stato la velocità parte dal valore di prima e varia al più di ' + r.salto.toFixed(2) + ' al secondo (easeInOutSine in 0,75 s: massimo 3,35)', r.primo < 3.4 && r.salto < 3.4);
    vero(nome + ' · in 0,75 s raggiunge l\'obiettivo di «cerca» (' + r.arriva.toFixed(2) + ')', Math.abs(r.arriva - 2.6) < 0.05);
    vero(nome + ' · nomi degli stati: ' + [r.cerca, r.pensa, r.parla, r.avviso].join(' · '), /CERCO/.test(r.cerca) && /STO PENSANDO/.test(r.pensa) && /PARLO/.test(r.parla) && /ATTENZIONE/.test(r.avviso));
    vero(nome + ' · in inglese: «' + r.en + '»', /THINKING/.test(r.en));
    vero(nome + ' · tessere accese al massimo 6', r.max6);
    vero(nome + ' · didascalia parola per parola (' + r.parola.join(' → ') + ' parole) e testo intero per i lettori di schermo', r.parola[1] > r.parola[0] && r.aria);
    vero(nome + ' · avviso: ambra e striscione, poi rientra («' + r.dopo + '»)', r.banner && r.bannerVia && /IN LINEA/.test(r.dopo));
    vero(nome + ' · le schede di dati emergono', r.scheda);
    att(nome + ' · ' + (opz.reducedMotion ? 'con «riduci movimento» gli anelli restano fermi' : 'senza, gli anelli girano'), !!opz.reducedMotion, r.anelliFermi);
    att(nome + ' · l\'ologramma non cambia scena da solo', 'false,true', r.olo.join(','));
    att(nome + ' · nessuna richiesta al corpo, al rig o al volto androide', 0, richieste.length);
    if (!opz.reducedMotion) {
      const oi = await pg.evaluate(async () => { const pausa = ms => new Promise(r => setTimeout(r, ms)); localStorage.removeItem('bsi-olo-autovoce'); BSIOloInterattivo.apri('spettri'); await pausa(800); const c = document.getElementById('bsiOI-autovoce'), o = { spento: c && !c.checked }; c.click(); await pausa(100); o.salvato = localStorage.getItem('bsi-olo-autovoce'); c.click(); BSIOloInterattivo.chiudi && BSIOloInterattivo.chiudi(); return o; });
      vero('l\'ologramma interattivo non parla da solo: «Spiega a voce automaticamente» spento di base, e ricordato (' + oi.salvato + ')', oi.spento && oi.salvato === '1');
    }
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }

  console.log('\n── Senza WebGL ──');
  const b2 = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-3d-apis', '--disable-webgl'] });
  { const pg = await (await b2.newContext({ serviceWorkers: 'block' })).newPage(), errs = []; pg.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 }); await pg.waitForFunction(() => !!(window.BSISpectraFigura && window.BSISpectraNucleo), null, { timeout: 60000 });
    await pg.evaluate(() => document.querySelector('[data-s="sareachim"]').click());
    await pg.waitForFunction(() => BSISpectraFigura.figura, null, { timeout: 30000 }).catch(() => {});
    const r = await pg.evaluate(async () => { const F = BSISpectraFigura.figura; if (!F) return null; F.box.scrollIntoView({ block: 'center' }); F.spectra.dici('Ciao, sono Spectra'); await new Promise(r => setTimeout(r, 900)); return { d2: F.spectra instanceof BSISpectraNucleo.Nucleo2D, stato: F.box.querySelector('.bsiN-stato').textContent, dida: F.box.querySelector('.bsiN-dida.on p').textContent }; });
    vero('senza WebGL il nucleo in 2D, con lo stato e la didascalia (' + (r && r.stato) + ')', r && r.d2 && /PARLO/.test(r.stato) && /CIAO/i.test(r.dida));
    att('senza WebGL · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e)); }
  await b2.close(); await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
