#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_teoria — 📖 la teoria di ogni sezione (v253)

   PERCHE' QUESTO BANCO ESISTE
   Richiesta dell'autore: «la teoria di tutte le sezioni della chimica, fisica e
   matematica, scientificamente accurata». Il banco non può giudicare da solo
   l'accuratezza di 145 testi (quella l'hanno controllata gli autori delle
   schede ricalcolando gli esempi, e la revisione a campione); pretende però
   tutto ciò che si può pretendere da una macchina:
   · COPERTURA: ogni sezione di chimica, fisica e matematica che spiega
     qualcosa ha la sua scheda (sono escluse solo le pagine di servizio:
     aree, esplorazioni, quiz, flashcard, riassunti, formulari, glossari,
     esami, risorse); nessuna scheda per sezioni che non esistono;
   · FORMA: titolo, sintesi di 25–90 parole, 3–8 paragrafi, almeno due
     formule con il significato, ipotesi e limiti, errori tipici, un esercizio
     con il risultato, almeno due fonti, collegamenti solo a sezioni vere;
     niente LaTeX, niente segnaposto, fra 300 e 1100 parole;
   · LETTURA: il pulsante «📖 Teoria» compare sotto il titolo, la scheda si
     legge sul telefono senza sbordare, la soluzione dell'esercizio resta
     nascosta finché non la si chiede, i collegamenti portano a un'altra
     scheda, Esc chiude;
   · RICERCA E SPECTRA: l'indice conta le schede per materia, la ricerca trova
     la scheda giusta («wormhole» → spaziotempo, «Michaelis» → cinetica
     enzimatica), i comandi a parole la aprono, lo strumento leggi_teoria la
     passa al modello.

   USO   node tools/banchi/test_teoria.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }
const ESCLUSE = /^(sarea|sespl|sdashboard|slab3d)|(riass|quiz|flash|form|gloss|ris|esame|tavole|cost)$|^squizspec$|^squizmet$|^sguidabio$|^schiris$|^sconst$|^sform$/;

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSITeoria && window.BSITeoriaDati && window.BSISpiega && BSISpiega.catalogo().length > 150 && window.BSI_AI_TOOLS), null, { timeout: 60000 });

  console.log('── Copertura e forma ──');
  const c = await pg.evaluate(src => {
    const ESC = new RegExp(src), T = window.BSITeoriaDati, cat = BSISpiega.catalogo();
    const attese = cat.filter(x => x.materia !== 'comune' && !ESC.test(x.id)).map(x => x.id), tutte = cat.map(x => x.id), o = { attese: attese.length, problemi: [] };
    const parole = s => String(s || '').split(/\s+/).filter(Boolean).length, P = m => o.problemi.push(m);
    attese.forEach(id => { if (!T[id]) P(id + ': manca'); });
    Object.keys(T).forEach(id => {
      const x = T[id]; if (attese.indexOf(id) < 0) P(id + ': scheda per una sezione che non la prevede');
      if (!x.titolo || parole(x.sintesi) < 25 || parole(x.sintesi) > 90) P(id + ': titolo o sintesi');
      if (!Array.isArray(x.paragrafi) || x.paragrafi.length < 3 || x.paragrafi.length > 8 || x.paragrafi.some(p => !p.titolo || parole(p.testo) < 40)) P(id + ': paragrafi');
      if (!Array.isArray(x.formule) || x.formule.length < 2 || x.formule.some(f => !Array.isArray(f) || f.length !== 2 || !f[0] || parole(f[1]) < 4)) P(id + ': formule');
      if (!(x.ipotesi || []).length || !(x.errori || []).length) P(id + ': ipotesi o errori');
      if (!x.esempio || parole(x.esempio.testo) < 15 || !x.esempio.risultato) P(id + ': esempio');
      if (!Array.isArray(x.fonti) || x.fonti.length < 2) P(id + ': fonti');
      (x.collegamenti || []).forEach(k => { if (tutte.indexOf(k) < 0 || !T[k]) P(id + ': collegamento ' + k); if (k === id) P(id + ': collegata a se stessa'); });
      const s = JSON.stringify(x); if (/\$|\\frac|\\cdot|\\[a-z]+\{/.test(s)) P(id + ': LaTeX'); if (/\b(undefined|NaN|TODO|lorem)\b/i.test(s)) P(id + ': segnaposto');
      const tot = parole(x.sintesi) + x.paragrafi.reduce((a, p) => a + parole(p.testo), 0); if (tot < 300 || tot > 1100) P(id + ': lunghezza ' + tot);
    });
    o.schede = Object.keys(T).length; o.parole = Object.keys(T).reduce((a, id) => a + parole(T[id].sintesi) + T[id].paragrafi.reduce((q, p) => q + parole(p.testo), 0), 0);
    o.fonti = new Set([].concat(...Object.keys(T).map(id => T[id].fonti))).size;
    return o;
  }, ESCLUSE.source);
  vero('ogni sezione di chimica, fisica e matematica che spiega qualcosa ha la sua scheda (' + c.schede + ' su ' + c.attese + ')', c.schede === c.attese && c.attese >= 140);
  att('nessun problema di forma nelle schede', '', c.problemi.slice(0, 8).join(' | '));
  vero('in tutto ' + c.parole + ' parole di teoria e ' + c.fonti + ' fonti diverse', c.parole > 60000 && c.fonti > 150);

  console.log('\n── La lettura, sul telefono ──');
  const l = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
    BSISpectraLive.calcolo.apriSezione('sschrod'); await pausa(1500); BSITeoria.pulsanti(); await pausa(100);
    const sez = document.getElementById('sschrod'), bt = sez.querySelector('.bsiTE-avvia'); o.bottone = !!bt && bt.textContent;
    const lz = sez.querySelector('.bsiLZ-avvia'); o.accanto = !lz || lz.nextElementSibling === bt;
    bt.click(); await pausa(200);
    const P = document.getElementById('bsiTE'); o.aperta = !!P && P.getAttribute('role') === 'dialog';
    o.titolo = P.querySelector('h1').textContent; o.formule = P.querySelectorAll('.formula').length; o.paragrafi = P.querySelectorAll('h3').length;
    const sol = P.querySelector('.soluzione'); o.nascosta = sol.hidden; P.querySelector('.mostra').click(); o.mostrata = !sol.hidden;
    o.largo = P.scrollWidth <= P.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1;
    o.scorre = P.scrollHeight > P.clientHeight;
    const chip = P.querySelector('[data-vai]'); o.chip = chip ? chip.getAttribute('data-vai') : null;
    if (chip) { chip.click(); await pausa(150); o.dopo = document.querySelector('#bsiTE h1').textContent; }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await pausa(50); o.chiusa = !document.getElementById('bsiTE');
    /* un giro su sezioni di tipi diversi: il pulsante compare dappertutto */
    o.giro = [];
    for (const id of ['spka', 'smatcalc', 'sfisem', 'skrebs', 'shammett', 'sastrowh', 'smatfrenet', 'sirvis', 'smatnoneucl', 'sfoucault']) {
      BSISpectraLive.calcolo.apriSezione(id); await pausa(900); BSITeoria.pulsanti(); await pausa(80);
      const s = document.getElementById(id), x = s && s.querySelector('.bsiTE-avvia'); o.giro.push(id + (x && x.offsetParent ? '' : ':MANCA'));
    }
    return o;
  });
  vero('il pulsante «' + l.bottone + '» compare sotto il titolo, accanto alla lezione guidata', l.bottone === '📖 Teoria' && l.accanto);
  vero('la scheda si apre come dialogo: «' + l.titolo + '», ' + l.paragrafi + ' paragrafi, ' + l.formule + ' formule', l.aperta && l.titolo.length > 5 && l.formule >= 2 && l.paragrafi >= 3);
  vero('la soluzione dell\'esercizio resta nascosta finché non la si chiede', l.nascosta && l.mostrata);
  vero('si legge sul telefono: scorre e non sborda', l.largo && l.scorre);
  vero('un collegamento apre un\'altra scheda (' + l.chip + ' → «' + l.dopo + '»)', l.chip && l.dopo && l.dopo !== l.titolo);
  vero('Esc chiude', l.chiusa);
  att('il pulsante c\'è in dieci sezioni di tipi diversi', 'spka smatcalc sfisem skrebs shammett sastrowh smatfrenet sirvis smatnoneucl sfoucault', l.giro.join(' '));

  console.log('\n── Indice, ricerca, comandi, Spectra ──');
  const s = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
    BSITeoria.indice(); await pausa(150); const P = document.getElementById('bsiTE');
    o.intro = P.querySelector('p').textContent; o.voci = P.querySelectorAll('.voce').length;
    const inp = P.querySelector('input'); inp.value = 'wormhole'; inp.dispatchEvent(new Event('input')); await pausa(80);
    o.wormhole = (P.querySelector('.voce') || {}).textContent || '';
    o.cerca = { michaelis: (BSITeoria.cerca('Michaelis Menten')[0] || {}).id, schrod: (BSITeoria.cerca('equazione di Schrödinger')[0] || {}).id, autovalori: BSITeoria.cerca('autovalori').slice(0, 5).map(r => r.id), nulla: BSITeoria.cerca('zzzzqqq').length };
    BSITeoria.chiudi();
    const A = BSISpectraAgenda;
    o.cmd1 = A.comando('Spectra, teoria della curvatura dello spaziotempo'); await pausa(80); o.cmd1aperta = (document.querySelector('#bsiTE h1') || {}).textContent; BSITeoria.chiudi();
    o.cmd2 = A.comando('indice della teoria').testo; o.cmd2aperta = !!document.querySelector('#bsiTE .cerca'); BSITeoria.chiudi();
    BSISpectraLive.calcolo.apriSezione('spka'); await pausa(800); o.cmd3 = A.comando('spiegami la teoria').testo; o.cmd3aperta = (document.querySelector('#bsiTE .testa .sx') || {}).textContent; BSITeoria.chiudi();
    const T = window.BSI_AI_TOOLS, st = T.filter(x => x.name === 'leggi_teoria'); o.strumento = st.length; o.totale = T.length;
    const r = st[0].execute({ sezione: 'entropia' }); o.tool = { ok: r.ok, sez: r.sezione, lung: (r.teoria || '').length, formule: /Formule:/.test(r.teoria || ''), fonti: /Fonti:/.test(r.teoria || '') };
    o.toolNo = st[0].execute({ sezione: 'zzzzqqq' }).ok;
    document.getElementById('bsi14-fab').click(); await pausa(250); const riga = document.querySelector('#bsi14-sheet .bsi14-row[data-key="teoria"]'); o.menu = !!riga; if (riga) { riga.click(); await pausa(250); o.menuApre = !!document.querySelector('#bsiTE .cerca'); BSITeoria.chiudi(); }
    return o;
  });
  vero('l\'indice: ' + s.intro, /^\d+ schede: \d+ di chimica, \d+ di fisica, \d+ di matematica/.test(s.intro) && s.voci >= 140);
  vero('«wormhole» trova lo spaziotempo: ' + s.wormhole.slice(0, 50), /Spaziotempo/.test(s.wormhole));
  att('«Michaelis Menten» → cinetica enzimatica', 'smm', s.cerca.michaelis);
  att('«equazione di Schrödinger» → Schrödinger', 'sschrod', s.cerca.schrod);
  vero('«autovalori» porta all\'algebra lineare (' + s.cerca.autovalori.join(', ') + ')', s.cerca.autovalori.some(x => /smatlin|smatsvd/.test(x)));
  att('una parola che non c\'è non trova niente', 0, s.cerca.nulla);
  vero('«teoria della curvatura dello spaziotempo» apre «' + s.cmd1aperta + '»', /Spaziotempo/i.test(s.cmd1aperta || ''));
  vero('«indice della teoria» apre l\'indice', s.cmd2aperta && /indice/.test(s.cmd2));
  vero('«spiegami la teoria» apre quella della sezione aperta (' + s.cmd3aperta + ')', /pKa|Tamponi/i.test(s.cmd3aperta || ''));
  att('lo strumento leggi_teoria registrato una volta, 52 strumenti in tutto', '1 52', s.strumento + ' ' + s.totale);
  vero('leggi_teoria passa al modello la teoria con formule e fonti (' + s.tool.sez + ', ' + s.tool.lung + ' caratteri)', s.tool.ok && s.tool.lung > 1500 && s.tool.formule && s.tool.fonti);
  att('e dice quando non c\'è', false, s.toolNo);
  vero('nel menu ✨ c\'è «📖 Teoria di tutte le sezioni» e apre l\'indice', s.menu && s.menuApre);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
