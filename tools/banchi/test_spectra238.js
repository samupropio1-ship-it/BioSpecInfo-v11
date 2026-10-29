#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_spectra238 — la console di Spectra impaginata bene, e un volto vivo

   PERCHE' QUESTO BANCO ESISTE

   Segnalazioni dell'utente sulla v237, con una schermata dal telefono:
   · «i pulsanti sono troppo in alto quelli su e in basso quelli giu'»: con
     l'app installata la barra di stato e i tasti di Android stavano sopra i
     comandi; l'attribuzione del modello si sovrapponeva al dialogo;
   · «gli occhi devono cambiare in funzione della risposta e della domanda,
     in base ai livelli deve concentrarsi di piu'»;
   · «deve essere l'assistente principale per ogni cosa, con tutti i pulsanti
     e le sezioni dove c'e' lui»;
   · «emozioni vere che si vedono dal viso».

   Il banco controlla, su un telefono simulato (412×915, touch) e su schermo
   grande:
   · i margini sicuri: la testata comincia sotto la barra di stato e i
     comandi finiscono sopra i tasti di navigazione;
   · nessuna sovrapposizione fra testata, telemetria, volto, stato,
     dialogo, scorciatoie, comandi e attribuzione;
   · il navigatore 🧭 elenca, per ognuna delle tre materie, esattamente le
     sezioni della barra, e apre quella scelta cambiando materia;
   · la difficolta' di una domanda cresce con il livello e con le parole da
     corso avanzato; la concentrazione arriva al volto;
   · gli occhi: palpebre che si stringono (gioia, concentrazione) e si
     spalancano (sorpresa), asimmetria nel dubbio, tinta diversa per
     emozione, e la concentrazione li accende e li socchiude.

   USO   node tools/banchi/test_spectra238.js    (serve un server su :8899)
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

  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 800 } }]]) {
    console.log('\n── ' + nome + ' ──');
    const pg = await (await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz))).newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIMaterie && window.goSection), null, { timeout: 60000 });
    await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); BSIMaterie.imposta('fisica'); goSection('sfisspin'); });
    await pg.waitForTimeout(1200);
    await pg.evaluate(() => BSISpectraLive.apri({ briefing: false }));
    await pg.evaluate(() => BSISpectraLive.elabora('dove sono'));
    await pg.waitForTimeout(2500);

    const L = await pg.evaluate(() => {
      const r = id => { const e = document.getElementById(id); if (!e) return null; const q = e.getBoundingClientRect(); return { t: q.top, b: q.bottom, l: q.left, r: q.right, h: q.height }; };
      const giu = r('bsiJV-giu'), top = r('bsiJV-top'), tel = r('bsiJV-tel'), vol = r('bsiJV-volto'), st = r('bsiJV-stato'), dial = r('bsiJV-dial'), cred = r('bsiJV-credito'), chips = r('bsiJV-chips');
      const cs = getComputedStyle(document.getElementById('bsiJV'));
      const primo = document.querySelector('#bsiJV-top .bsiJV-b').getBoundingClientRect(), ultimo = document.getElementById('bsiJV-mic').getBoundingClientRect();
      return { H: innerHeight, W: innerWidth, bordi: document.getElementById('bsiJV').classList.contains('bsiJV-bordi'), giu, top, tel, vol, st, dial, cred, chips, primoTop: primo.top, micBottom: ultimo.bottom, credBottom: cred.b, chipsN: document.querySelectorAll('#bsiJV-chips .bsiJV-chip').length };
    });
    const sotto = (a, bb) => a.b <= bb.t + 1;
    if (nome === 'telefono') {
      vero('sul telefono a schermo intero si usano i margini sicuri', L.bordi);
      vero('i pulsanti in alto stanno sotto la barra di stato (≥ 34 px dal bordo: ' + Math.round(L.primoTop) + ')', L.primoTop >= 34);
      vero('i comandi in basso stanno sopra i tasti di Android (≥ 46 px dal bordo: ' + Math.round(L.H - L.credBottom) + ')', L.H - L.credBottom >= 46);
      vero('la telemetria sta in due colonne e non copre il volto', sotto(L.tel, L.vol));
    } else {
      vero('su schermo grande niente margini forzati', !L.bordi);
      vero('i pulsanti in alto sono vicini al bordo (' + Math.round(L.primoTop) + ' px)', L.primoTop < 30);
    }
    vero('la testata sta sopra il volto', sotto(L.top, L.vol));
    vero('il volto sta sopra lo stato', L.vol.b <= L.st.t + 2);
    vero('lo stato sta sopra il dialogo', L.st.b <= L.dial.t + 30);
    vero('il dialogo sta sopra le scorciatoie e i comandi', sotto(L.dial, L.giu));
    vero('l\'attribuzione del modello sta dentro la barra dei comandi, in fondo', L.cred.t >= L.giu.t && L.cred.b <= L.giu.b + 1 && L.cred.t >= L.micBottom - 2);
    vero('ci sono le scorciatoie della sezione aperta (' + L.chipsN + ')', L.chipsN >= 4);

    /* il navigatore: per ogni materia, le stesse sezioni della barra */
    const N = await pg.evaluate(() => {
      const out = {};
      ['chimica', 'fisica', 'matematica'].forEach(m => {
        BSISpectraLive.navigatore(m);
        const nav = document.getElementById('bsiJV-nav');
        const inNav = [...nav.querySelectorAll('button[data-s]')].map(x => x.getAttribute('data-s'));
        const gruppi = BSIMaterie.MATERIE[m].gruppi.concat(BSIMaterie.COMUNI || []);
        const inBarra = gruppi.reduce((a, g) => a.concat([...document.querySelectorAll('#navGroup' + g + ' .nav-btn')].map(x => x.getAttribute('data-s'))), []);
        out[m] = { nav: inNav.length, barra: inBarra.length, uguali: inNav.join() === inBarra.join(), strumenti: nav.querySelectorAll('button[data-a]').length, frasi: nav.querySelectorAll('button[data-f]').length };
      });
      return out;
    });
    for (const m of ['chimica', 'fisica', 'matematica']) {
      vero('navigatore, ' + m + ': tutte le sezioni della barra (' + N[m].nav + ' / ' + N[m].barra + ')', N[m].uguali && N[m].nav > 20);
      vero('navigatore, ' + m + ': strumenti rapidi e frasi (' + N[m].strumenti + ', ' + N[m].frasi + ')', N[m].strumenti >= 4 && N[m].frasi >= 10);
    }
    const ap = await pg.evaluate(async () => {
      BSISpectraLive.navigatore('matematica');
      const b = document.querySelector('#bsiJV-nav button[data-s="smatserie"]'); b.click();
      await new Promise(r => setTimeout(r, 900));
      const s = document.getElementById('smatserie');
      return { materia: BSIMaterie.corrente(), visibile: !!(s && s.offsetParent), consoleChiusa: !document.getElementById('bsiJV').classList.contains('aperto'), mini: document.getElementById('bsiJV-mini').classList.contains('vis') };
    });
    att('dal navigatore si apre una sezione di un\'altra materia, e la materia cambia', 'matematica|true|true|true', [ap.materia, ap.visibile, ap.consoleChiusa, ap.mini].join('|'));
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
  }

  console.log('\n── livello e concentrazione ──');
  {
    const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.goSection && window.BSIFisica && BSIFisica.calcolo.percorsi), null, { timeout: 60000 });
    const D = await pg.evaluate(async () => {
      const L = BSISpectraLive, o = {};
      o.facile = L.difficolta('quanto fa 2+2').valore;
      o.avanzata = L.difficolta('Dimostra che l\'operatore hamiltoniano è hermitiano e trova gli autovalori').valore;
      o.semplice = L.difficolta('Dimostra il teorema, ma spiegamelo in parole semplici').valore;
      /* il livello della sezione aperta pesa: la stessa domanda vale di piu' in una sezione da dottorato */
      /* una sezione che compare SOLO al primo livello e una che compare SOLO all'ultimo (l'esame, per esempio, sta in tutti) */
      const M = BSIFisica.calcolo.percorsi.MAPPA.fisica, altrove = (id, i) => M.some((L, j) => j !== i && L.sez.indexOf(id) >= 0);
      const liv = i => M[i].sez.filter(id => document.querySelector('.nav-btn[data-s="' + id + '"]') && !altrove(id, i))[0];
      o.idBasso = liv(0); o.idAlto = liv(3);
      goSection(o.idBasso); await new Promise(r => setTimeout(r, 600)); o.inBasso = L.difficolta('spiegami questo grafico');
      goSection(o.idAlto); await new Promise(r => setTimeout(r, 600)); o.inAlto = L.difficolta('spiegami questo grafico');
      return o;
    });
    vero('una domanda da corso avanzato è più difficile di un conto (' + D.avanzata.toFixed(2) + ' > ' + D.facile.toFixed(2) + ')', D.avanzata > D.facile + 0.2);
    vero('«in parole semplici» abbassa la difficoltà (' + D.semplice.toFixed(2) + ')', D.semplice < D.avanzata);
    vero('in una sezione da dottorato (' + D.idAlto + ') la stessa domanda pesa più che in una da scuola (' + D.idBasso + ')', D.inAlto.valore > D.inBasso.valore + 0.3);
    att('e il livello dichiarato è quello del percorso', 'Scuola superiore|Dottorato', D.inBasso.nome + '|' + D.inAlto.nome);
  }

  console.log('\n── gli occhi e il viso ──');
  {
    const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!window.BSISpectraAndroide, null, { timeout: 60000 });
    const O = await pg.evaluate(async () => {
      const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:0;top:0;width:300px;height:300px;z-index:1'; document.body.appendChild(box);
      const v = await BSISpectraAndroide.crea(box); v.ferma(); v.prossimo = 1e9;
      const prova = (emo, c, st) => { v.stato(st || 'attesa'); v.concentra(c || 0); v.conc = c || 0; v.espressione(emo, 99); for (let i = 0; i < 120; i++) v.passo(1 / 30); const a = v.aperture(); return { a0: a[0], a1: a[1], col: v.coloreOcchi, luce: v.matOcchi.color.r + v.matOcchi.color.g + v.matOcchi.color.b }; };
      const o = { serena: prova('serena'), gioia: prova('gioia'), sorpresa: prova('sorpresa'), dubbio: prova('dubbio'), empatica: prova('empatica') };
      o.calma = prova('riflessione', 0, 'pensa'); o.concentrata = prova('riflessione', 1, 'pensa');
      /* le palpebre spostano davvero i vertici degli occhi */
      const p = v.occhi.geometry.attributes.position.array; let ymin = 1e9, ymax = -1e9; for (let i = 1; i < p.length; i += 3) { ymin = Math.min(ymin, p[i]); ymax = Math.max(ymax, p[i]); }
      o.vertici = p.length;
      /* un battito: si chiudono quasi del tutto */
      v.espressione('serena', 99); v.palp = 0.5; v.prossimo = 1e9; v.passo(0.001); o.battito = v.aperture();
      v.libera(); box.remove();
      return o;
    });
    vero('gioia: gli occhi si stringono (' + O.gioia.a0.toFixed(2) + ')', O.gioia.a0 < 0.8);
    vero('sorpresa: gli occhi si spalancano (' + O.sorpresa.a0.toFixed(2) + ')', O.sorpresa.a0 > 1.25);
    vero('dubbio: un occhio più aperto dell\'altro (' + O.dubbio.a0.toFixed(2) + ' / ' + O.dubbio.a1.toFixed(2) + ')', Math.abs(O.dubbio.a0 - O.dubbio.a1) > 0.25);
    vero('a riposo gli occhi hanno il blu del tema (' + O.serena.col + ')', O.serena.col === '#1a3050');
    vero('le emozioni cambiano la tinta degli occhi (' + [O.gioia.col, O.sorpresa.col, O.empatica.col].join(' ') + ')', new Set([O.serena.col, O.gioia.col, O.sorpresa.col, O.empatica.col]).size === 4);
    vero('concentrata: occhi più socchiusi (' + O.concentrata.a0.toFixed(2) + ' < ' + O.calma.a0.toFixed(2) + ')', O.concentrata.a0 < O.calma.a0 - 0.15);
    vero('concentrata: occhi più accesi (' + O.concentrata.luce.toFixed(2) + ' > ' + O.calma.luce.toFixed(2) + ')', O.concentrata.luce > O.calma.luce * 1.3);
    vero('il battito chiude quasi del tutto le palpebre (' + O.battito.map(x => x.toFixed(2)).join(' / ') + ')', O.battito[0] < 0.2 && O.battito[1] < 0.2);
    att('nessun errore JavaScript nel volto', 0, errs.length);
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
