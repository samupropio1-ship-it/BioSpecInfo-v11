#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_elementi3d — ⬡ Tavola periodica e gli elementi in 3D (v255: sostituisce
   la vecchia tavola, sezione spt)

   PERCHE' QUESTO BANCO ESISTE
   L'autore vuole gli elementi «scientificamente accurati al 100 %». Qui si
   prova ciò che si può provare:
   · la configurazione di ognuno dei 118 elementi, espansa dalla tabella
     dell'app, somma a Z elettroni (questo controllo ha trovato un errore vero:
     il laurenzio era «[Rn]5f¹⁴7p¹», 101 elettroni; ora «[Rn]5f¹⁴7s²7p¹»);
     le eccezioni note (Cr, Cu, Pd, Gd, Pt, Au) sono quelle del NIST;
   · le cariche efficaci di Slater dei manuali: Na 3s 2,20; O 2p 4,55;
     Zn 3d 8,85 e 4s 4,35; Fe 3d 6,25 e 4s 3,75;
   · le righe dell'idrogeno dalla formula di Rydberg, convertite in aria con
     l'indice di Edlén: Hα 656,28, Hβ 486,13, Hγ 434,05, Hδ 410,17 nm (NIST);
     le righe D del sodio a 589,00 e 589,59 nm;
   · la densità radiale di Slater: integrale uguale a Z;
   · la pagina: la sezione, la tavola con 118 elementi, il cambio di
     elemento, la sequenza del video, nessun errore, niente sbordi.

   USO   node tools/banchi/test_elementi3d.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.elementi3d), null, { timeout: 60000 });
    if (nome === 'telefono') {
      console.log('── I dati e la fisica ──');
      const r = await pg.evaluate(() => {
        const X = BSIFisica.calcolo.elementi3d, o = {}, bad = [];
        for (let z = 1; z <= 118; z++) { const c = X.configurazione(z), s = Object.values(c).reduce((a, b) => a + b, 0); if (s !== z) bad.push(z + ':' + s); }
        o.somme = bad.join(',');
        const conf = z => { const c = X.configurazione(z); return Object.keys(c).filter(k => /[34567]/.test(k[0])).map(k => k + c[k]).join(' '); };
        o.cr = conf(24); o.cu = conf(29); o.pd = conf(46); o.gd = conf(64); o.pt = conf(78); o.au = conf(79); o.lr = conf(103);
        const ze = (z, s) => X.sottogusci(z).find(g => g.nome === s).zeff;
        o.slater = [ze(11, '3s'), ze(8, '2p'), ze(30, '3d'), ze(30, '4s'), ze(26, '3d'), ze(26, '4s')].map(v => v.toFixed(2)).join(' ');
        const H = X.righeIdrogeno().filter(x => x[0] > 400 && x[0] < 700).map(x => x[0]); o.balmer = H.slice(0, 4).map(v => v.toFixed(2)).join(' ');
        o.edlen = X.indiceAria(589).toFixed(6);
        o.sodio = X.righe('Na').filter(x => x[1] > 0.8).map(x => x[0]).join(' ');
        let s = 0; for (let i = 1; i <= 20000; i++) { const rr = i * 0.002; s += X.densitaRadiale(26, rr) * 0.002; } o.integraleFe = s.toFixed(3);
        o.righeInBanda = Object.keys(X.RIGHE).every(k => X.RIGHE[k].every(x => x[0] >= 200 && x[0] <= 900 && x[1] > 0 && x[1] <= 1));
        return o;
      });
      att('ogni configurazione dei 118 elementi somma a Z elettroni', '', r.somme);
      att('Cr: 3d⁵ 4s¹ (eccezione)', 'true', /3d5/.test(r.cr) && /4s1/.test(r.cr));
      att('Cu: 3d¹⁰ 4s¹; Pd: 4d¹⁰ senza 5s; Au: 5d¹⁰ 6s¹; Pt: 5d⁹ 6s¹', 'true', /3d10/.test(r.cu) && /4s1/.test(r.cu) && /4d10/.test(r.pd) && !/5s/.test(r.pd) && /5d10/.test(r.au) && /6s1/.test(r.au) && /5d9/.test(r.pt) && /6s1/.test(r.pt));
      att('Gd: 4f⁷ 5d¹ 6s²; Lr: 5f¹⁴ 7s² 7p¹ (corretto nella v255)', 'true', /4f7/.test(r.gd) && /5d1/.test(r.gd) && /5f14/.test(r.lr) && /7s2/.test(r.lr) && /7p1/.test(r.lr));
      att('Slater: Na 3s, O 2p, Zn 3d e 4s, Fe 3d e 4s', '2.20 4.55 8.85 4.35 6.25 3.75', r.slater);
      const bal = r.balmer.split(' ').map(Number).sort((a, b) => b - a), NIST = [656.279, 486.135, 434.047, 410.175];
      vero('Balmer in aria (Rydberg + Edlén) entro 0,02 nm dal NIST (656,279; 486,135; 434,047; 410,175): ' + bal.join(' '), bal.every((v, i) => Math.abs(v - NIST[i]) <= 0.02));
      att('indice dell\'aria a 589 nm (Edlén)', '1.000277', r.edlen);
      att('le righe D del sodio', '588.995 589.592', r.sodio);
      att('la densità radiale di Slater del ferro integra a 26 elettroni', '26.000', r.integraleFe);
      vero('tutte le righe scritte stanno fra 200 e 900 nm, con intensità fra 0 e 1', r.righeInBanda);
    }
    console.log('\n── La pagina, ' + nome + ' ──');
    const p = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      const x = BSISpectraLive.calcolo.apriSezione('spt'); await pausa(600); o.aperta = x && x.id; o.nav = !!document.querySelector('.nav-btn[data-s="spt"]');
      const el = document.getElementById('spt'); for (let i = 0; i < 40 && !el.querySelector('.bsi3d-box'); i++) await pausa(250);
      o.celle = el.querySelectorAll('.bsiEL-tavola:not(.bsiEL-grande) button').length;
      const sp = () => (el.querySelector('canvas[aria-label^="Impronta"]') || {}).getAttribute ? el.querySelector('canvas[aria-label^="Impronta"]').getAttribute('aria-label') : '';
      el.querySelector('.bsiEL-tavola button[data-z="11"]').click(); await pausa(800); o.sodio = /Sodio/.test(el.innerText) && /589,00 nm/.test(sp());
      el.querySelector('.bsiEL-tavola button[data-z="63"]').click(); await pausa(800); o.europio = /Europio/.test(el.innerText) && /niente dati inventati/.test(sp()) && /4f/.test(el.innerText);
      o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; o.strano = (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b).{0,20}/) || [null])[0];
      o.ar = !!el.querySelector('.bsiAR-tasto');
      o.schede = el.querySelectorAll('.bsiFX-schede button').length; o.vecchi = /ossidazione/.test(el.innerText) && /fusione/.test(el.innerText) && /Periodo/.test(el.innerText);
      el.querySelectorAll('.bsiFX-schede button')[1].click(); await pausa(700); const g = el.querySelector('.bsiEL-grande'); o.tendenze = !!g && g.querySelectorAll('button').length === 118 && /Elettronegatività/.test(el.innerText);
      [...g.querySelectorAll('button')].find(b => /^Ferro/.test(b.getAttribute('aria-label'))).click(); await pausa(1200); o.ferro = /\bFerro\b/.test(el.innerText) && el.querySelectorAll('.bsiFX-schede button')[0].classList.contains('on');
      return o;
    });
    vero(nome + ' · nella barra, si apre con due schede, la tavola ha 118 elementi (' + p.celle + ')', p.nav && p.aperta === 'spt' && p.celle === 118 && p.schede === 2);
    vero(nome + ' · la tavola delle tendenze: colorata per elettronegatività, un tocco sul ferro apre il ferro in 3D', p.tendenze && p.ferro);
    vero(nome + ' · i dati della vecchia tavola ci sono: ossidazione, fusione, periodo e gruppo', p.vecchi);
    vero(nome + ' · un tocco sul sodio: dati e righe; sull\'europio: dichiara che le righe non ci sono', p.sodio && p.europio);
    vero(nome + ' · la scena ha il pulsante AR', p.ar);
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', p.sb + ' ' + p.strano);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
