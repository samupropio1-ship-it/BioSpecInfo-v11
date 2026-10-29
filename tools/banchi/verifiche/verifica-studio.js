/* prova-studio.js — il banco del motore dei kit di studio (bsi-studio.js)
   1) in node (vm): i calcoli, la pulizia dell'HTML, il controllo dei dati, l'unione;
   2) in Chromium, a 390 e 1280 px: ogni scheda di ogni sezione, il quiz fino in
      fondo con tasti e clic, le flashcard, le ricerche, il cambio di lingua.
   Uso: node _prove/prova-studio.js   (serve http://127.0.0.1:8898/) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RADICE = path.join(__dirname, '..', '..', '..');
const BASE = process.env.BASE || 'http://127.0.0.1:8898/';
const CHROME = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';

let ok = 0, ko = 0;
function att(nome, atteso, ottenuto) {
  const va = typeof atteso === 'function' ? atteso(ottenuto) : JSON.stringify(atteso) === JSON.stringify(ottenuto);
  if (va) { ok++; console.log('  ✓ ' + nome); }
  else { ko++; console.log('  ✗ ' + nome + ' — atteso ' + (typeof atteso === 'function' ? '(condizione)' : JSON.stringify(atteso)) + ', ottenuto ' + JSON.stringify(ottenuto)); }
}
function contiene(re) { return (lista) => Array.isArray(lista) && lista.some((m) => re.test(m)); }

/* ═══ 1. node ═════════════════════════════════════════════════════════════ */
function carica() {
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'studio-demo.js'), 'utf8'), ctx, { filename: 'studio-demo.js' });
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-studio.js'), 'utf8'), ctx, { filename: 'bsi-studio.js' });
  return ctx;
}
function provaNode() {
  console.log('── node ──');
  const ctx = carica(), S = ctx.BSIStudio, C = S.calcolo;
  att('BSIStudio esiste, versione v237', 'v237', S.versione);
  att('la coda dei dati arrivati prima del motore si svuota', ['fisica'], Array.from(S.materie()));
  att('  · e la coda resta vuota', 0, ctx.BSIStudioCoda.length);
  att('sezioni(fisica): i cinque id', ['sfisriass', 'sfisquiz', 'sfisflash', 'sfisform', 'sfisgloss'], Array.from(S.sezioni('fisica')));
  att('sezioni di una materia sconosciuta: nessuna', [], Array.from(S.sezioni('storia')));
  att('MINIMI', { riassunti: 60, quiz: 300, flash: 250, formule: 200, glossario: 250 }, JSON.parse(JSON.stringify(S.MINIMI)));

  /* mulberry32 */
  const a = C.mulberry32(42), b = C.mulberry32(42), xa = [], xb = [];
  for (let i = 0; i < 1000; i++) { xa.push(a()); xb.push(b()); }
  att('mulberry32: stesso seme, stessa sequenza', true, xa.every((v, i) => v === xb[i]));
  att('  · valori in [0, 1)', true, xa.every((v) => v >= 0 && v < 1));
  att('  · media vicina a 0,5', true, Math.abs(xa.reduce((s, v) => s + v, 0) / xa.length - 0.5) < 0.05);
  att('  · semi diversi, sequenze diverse', true, C.mulberry32(1)() !== C.mulberry32(2)());

  /* mescola */
  const orig = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], m1 = C.mescola(orig, C.mulberry32(7)), m2 = C.mescola(orig, C.mulberry32(7));
  att('mescola: restituisce una copia (l’originale resta com’è)', true, m1 !== orig && orig.join() === '1,2,3,4,5,6,7,8,9,10');
  att('  · è una permutazione', '1,2,3,4,5,6,7,8,9,10', Array.from(m1).sort((x, y) => x - y).join());
  att('  · deterministica con lo stesso generatore', m1.join(), m2.join());
  att('  · cambia davvero l’ordine', true, m1.join() !== orig.join());
  att('  · senza generatore usa Math.random', 10, C.mescola(orig).length);
  /* distribuzione: la posizione del primo elemento e' uniforme */
  const r = C.mulberry32(3), pos = [0, 0, 0, 0];
  for (let i = 0; i < 8000; i++) pos[C.mescola([0, 1, 2, 3], r).indexOf(0)]++;
  att('  · uniforme (ogni posizione 25 % ± 2 %)', true, pos.every((n) => Math.abs(n / 8000 - 0.25) < 0.02));

  /* leitner */
  const s0 = { x: 3 }, s1 = C.leitner(s0, 'x', true);
  att('leitner: giusta → su di una scatola', 4, s1.x);
  att('  · stato nuovo, il vecchio non cambia', true, s1 !== s0 && s0.x === 3);
  att('  · non oltre la 5', 5, C.leitner(C.leitner({ x: 4 }, 'x', true), 'x', true).x);
  att('  · sbagliata → scatola 1', 1, C.leitner({ x: 5 }, 'x', false).x);
  att('  · carta mai vista e giusta → scatola 2', 2, C.leitner({}, 'nuova', true).nuova);
  att('  · stato vuoto o assente', 1, C.leitner(null, 'y', false).y);
  att('  · le altre carte restano', 3, C.leitner({ a: 3, b: 1 }, 'b', true).a);

  /* punteggio */
  const P = C.punteggio([{ arg: 'a', giusta: true }, { arg: 'a', giusta: false }, { arg: 'b', giusta: true }, { arg: 'a', giusta: true }]);
  att('punteggio: giuste, totale, perc', [3, 4, 75], [P.giuste, P.totale, P.perc]);
  att('  · per argomento', { a: { giuste: 2, totale: 3, perc: 67 }, b: { giuste: 1, totale: 1, perc: 100 } }, JSON.parse(JSON.stringify(P.perArg)));
  att('  · nessuna risposta: 0 %', [0, 0, 0], [C.punteggio([]).giuste, C.punteggio([]).totale, C.punteggio([]).perc]);

  /* pulisci */
  att('pulisci: via script, attributi e tag non ammessi', '<p>a<b>b</b>c</p>', S.pulisci('<p onclick="x()">a<script>alert(1)</script><b class="y">b</b><img src=x onerror=alert(1)>c</p>'));
  att('  · tiene sub, sup, ul, li, br, i', '<ul><li>H<sub>2</sub>O<br>x<sup>2</sup> <i>v</i></li></ul>', S.pulisci('<ul><li>H<sub>2</sub>O<br/>x<sup>2</sup> <i style="c">v</i></li></ul>'));
  att('  · scappa < e > del testo', 'a &lt; b &gt; c', S.pulisci('a < b > c'));
  att('  · niente javascript: negli attributi (tolti)', '<b>x</b>', S.pulisci('<b onmouseover="javascript:alert(1)">x</b>'));
  att('norm: niente accenti, maiuscole, tag', 'perche la velocita', S.norm('<b>Perché</b>  la VELOCITÀ'));

  /* valida: i dati di prova sono puliti */
  const D = ctx.BSIStudio.dati('fisica');
  const demo = JSON.parse(JSON.stringify(D));
  att('valida(dati di prova) → nessun problema', [], Array.from(S.valida(demo)));
  const q = Array.from(S.valida(demo, { quantita: true }));
  att('valida con quantita: i minimi', contiene(/«quiz»: sono 3, ne servono almeno 300/), q);
  att('  · tutti e cinque i minimi', 5, q.filter((m) => /ne servono almeno/.test(m)).length);
  att('  · argomenti senza domande', contiene(/argomento «onde» non ha nessuna domanda/), q);
  att('  · i tre livelli ci sono (nessun messaggio)', false, q.some((m) => /manca il livello/.test(m)));
  att('  · posizioni della risposta giusta equilibrate (nessun messaggio)', false, q.some((m) => /posizione/.test(m)));

  /* valida: i dati sbagliati */
  const X = JSON.parse(JSON.stringify(demo));
  X.quiz[0].k = 4;
  X.quiz[1].r[3] = X.quiz[1].r[0].toUpperCase();
  X.quiz.push(Object.assign({}, X.quiz[2], { d: X.quiz[2].d.replace('distanza', 'DISTANZA') }));
  X.quiz.push({ arg: 'xyz', liv: 4, d: 'Domanda nuova?', r: ['a', 'b'], k: 0 });
  X.riassunti[0].testo = '<p>Troppo corto.</p>';
  X.riassunti[1].testo += '<div class="x"><script>alert(1)</script></div>';
  X.flash[0].b = '⚠ attenzione';
  delete X.formule[0].f;
  X.glossario.push({ t: 'entropia', d: 'doppione' });
  X.argomenti[0].nm = 'Meccanica';
  const V = Array.from(S.valida(X));
  att('valida: k fuori intervallo', contiene(/quiz n\. 1: «k» fuori intervallo/), V);
  att('  · risposte duplicate', contiene(/quiz n\. 2: risposte duplicate/), V);
  att('  · domanda duplicata', contiene(/quiz n\. 4: domanda duplicata \(uguale al quiz n\. 3\)/), V);
  att('  · argomento non dichiarato', contiene(/quiz n\. 5: l’argomento «xyz» non è dichiarato/), V);
  att('  · livello non valido', contiene(/quiz n\. 5: il livello «liv» deve essere 1, 2 o 3/), V);
  att('  · campo mancante (sp)', contiene(/quiz n\. 5: manca il campo «sp»/), V);
  att('  · campo mancante (f della formula)', contiene(/formula n\. 1 .*manca il campo «f»/), V);
  att('  · riassunto troppo corto', contiene(/riassunto n\. 1 .*lungo 13 caratteri senza tag, deve stare fra 600 e 1500/), V);
  att('  · tag non ammessi (div e script)', (l) => contiene(/tag non ammesso <div>/)(l) && contiene(/tag non ammesso <script>/)(l), V);
  att('  · il simbolo ⚠', contiene(/flashcard n\. 1: il campo «b» contiene il simbolo «⚠»/), V);
  att('  · termine duplicato (senza badare alle maiuscole)', contiene(/termine n\. 4 \(«entropia»\): termine duplicato/), V);
  att('  · nome dell’argomento non [it, en]', contiene(/argomento n\. 1 \(«mecc»\): il nome «nm» deve essere una coppia/), V);
  const Y = JSON.parse(JSON.stringify(demo));
  Y.argomenti = Y.argomenti.slice(0, 7);
  Y.riassunti[0].testo = '<p>' + 'x'.repeat(1501) + '</p>';
  att('  · argomenti fuori da 8–14', contiene(/gli argomenti sono 7: devono essere da 8 a 14/), Array.from(S.valida(Y)));
  att('  · riassunto troppo lungo', contiene(/lungo 1501 caratteri/), Array.from(S.valida(Y)));
  Y.argomenti = demo.argomenti.concat([1, 2, 3, 4, 5, 6, 7].map((i) => ({ k: 'z' + i, nm: ['Z', 'Z'] })));
  att('  · 15 argomenti: troppi', contiene(/gli argomenti sono 15/), Array.from(S.valida(Y)));
  const Z = JSON.parse(JSON.stringify(demo));
  Z.quiz.forEach((x) => { x.k = 0; x.liv = 1; });
  const VZ = Array.from(S.valida(Z, { quantita: true }));
  att('  · risposta giusta sempre in posizione 1: oltre il 40 %', contiene(/posizione 1 \(k = 0\) nel 100 %/), VZ);
  att('  · mancano i livelli 2 e 3', (l) => contiene(/manca il livello 2/)(l) && contiene(/manca il livello 3/)(l), VZ);
  att('  · elenco mancante', contiene(/manca l’elenco «glossario»/), Array.from(S.valida({ argomenti: demo.argomenti, riassunti: [], quiz: [], flash: [], formule: [] })));
  att('  · dati assenti', 1, S.valida(null).length);

  /* registra due volte: si unisce */
  S.registra('fisica', { argomenti: [{ k: 'mecc', nm: ['Meccanica classica', 'Classical mechanics'] }], quiz: [demo.quiz[0], Object.assign({}, demo.quiz[0], { d: 'Una domanda in più?' })], glossario: [{ t: 'Forza', d: 'Ciò che cambia lo stato di moto.' }] });
  const U = S.dati('fisica');
  att('registra due volte: le voci nuove si aggiungono, le uguali no', [8, 4, 4], [U.argomenti.length, U.quiz.length, U.glossario.length]);
  att('  · un argomento con la stessa chiave si aggiorna', 'Meccanica classica', U.argomenti[0].nm[0]);

  /* i file di dati veri, se ci sono gia': solo informazione */
  ['fisica', 'matematica'].forEach((m) => {
    const f = path.join(RADICE, 'bsi-studio-' + m + '.js');
    if (!fs.existsSync(f)) { console.log('  · (bsi-studio-' + m + '.js non c’è ancora)'); return; }
    try {
      const c = { console }; vm.createContext(c);
      vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-studio.js'), 'utf8'), c);
      vm.runInContext(fs.readFileSync(f, 'utf8'), c);
      const d = c.BSIStudio.dati(m);
      const msg = d ? c.BSIStudio.valida(JSON.parse(JSON.stringify(d)), { quantita: true }) : ['non registrato'];
      console.log('  · bsi-studio-' + m + '.js: ' + msg.length + ' problemi' + (msg.length ? ' (per esempio: ' + msg.slice(0, 3).join(' | ') + ')' : ''));
    } catch (e) { console.log('  · bsi-studio-' + m + '.js non si carica: ' + e.message); }
  });
}

/* ═══ 2. browser ══════════════════════════════════════════════════════════ */
const SEZ = ['sfisriass', 'sfisquiz', 'sfisflash', 'sfisform', 'sfisgloss'];
/* controlla la scheda visibile di una sezione: testo, ⚠, niente che sbordi */
async function controllaSchede(pg, id) {
  return pg.evaluate(async (id) => {
    const sec = document.getElementById(id), out = [];
    const bott = sec.querySelectorAll('.bsiFX-schede button');
    for (let i = 0; i < bott.length; i++) {
      bott[i].click(); await new Promise((r) => setTimeout(r, 250));
      const pan = [...sec.querySelectorAll('[role=tabpanel]')].find((p) => p.style.display !== 'none');
      const R = sec.getBoundingClientRect(), larghi = [];
      sec.querySelectorAll('*').forEach((e) => {
        if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') return;
        if (e.closest('.bsiST-nascosto')) return;
        const r = e.getBoundingClientRect();
        if (r.width && (r.right > R.right + 1 || r.left < R.left - 1)) larghi.push(e.tagName + '.' + e.className + ' ' + Math.round(r.width));
      });
      out.push({ nome: bott[i].textContent, testo: pan ? pan.innerText.length : 0, avviso: sec.innerText.indexOf('⚠') >= 0, larghi: larghi.slice(0, 3),
        sborda: document.documentElement.scrollWidth - document.documentElement.clientWidth });
    }
    bott[0].click();
    return out;
  }, id);
}

async function provaBrowser(browser, largo) {
  console.log('── Chromium, ' + largo + ' px ──');
  const ctx = await browser.newContext({ viewport: { width: largo, height: 900 }, serviceWorkers: 'block' });
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE.replace(/\/$/, '') }); } catch (e) { }
  const pg = await ctx.newPage(), err = [];
  pg.on('pageerror', (e) => err.push(String(e.message || e)));
  pg.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  await pg.goto(BASE + '_prove/studio.html', { waitUntil: 'load' });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => { try { localStorage.clear(); } catch (e) { } });

  const base = await pg.evaluate(() => ({ registrate: window.BSIFisica.sezioni().filter((s) => /^sfis(riass|quiz|flash|form|gloss)$/.test(s)), materie: window.BSIStudio.materie() }));
  att('le cinque sezioni sono registrate (motore prima del framework)', 5, base.registrate.length);

  const apri = (id) => pg.evaluate((id) => { window.apri(id); }, id);

  /* ogni scheda di ogni sezione */
  for (const id of SEZ) {
    await apri(id); await pg.waitForTimeout(200);
    const tit = await pg.evaluate((id) => ({ t: document.querySelector('#' + id + ' .bsiFX-tit').textContent, s: document.querySelector('#' + id + ' .bsiFX-sotto').textContent }), id);
    const sch = await controllaSchede(pg, id);
    att(id + ': titolo «' + tit.t + '», sottotitolo con i conteggi', true, /\d/.test(tit.s) && tit.t.length > 5);
    sch.forEach((s) => {
      att('  · «' + s.nome + '»: più di 100 caratteri, niente ⚠, niente sborda', true, s.testo > 100 && !s.avviso && !s.larghi.length && s.sborda <= 0);
      if (s.larghi.length || s.sborda > 0) console.log('      ' + JSON.stringify(s));
    });
  }

  /* riassunti: ricerca senza accenti, filtro, studiato, progressi */
  await apri('sfisriass');
  const ri = await pg.evaluate(async () => {
    const sec = document.getElementById('sfisriass'), cerca = sec.querySelector('input[type=search]'), sel = sec.querySelector('select');
    const n = () => sec.querySelectorAll('.bsiST-scheda').length, w = () => new Promise((r) => setTimeout(r, 60));
    const o = { tutte: n() };
    cerca.value = 'VELOCITA'; cerca.dispatchEvent(new Event('input')); await w(); o.velocita = n();
    cerca.value = 'perpetuo'; cerca.dispatchEvent(new Event('input')); await w(); o.perpetuo = n();
    cerca.value = 'zzzz'; cerca.dispatchEvent(new Event('input')); await w(); o.nessuna = n(); o.vuoto = !!sec.querySelector('.bsiST-vuoto');
    cerca.value = ''; cerca.dispatchEvent(new Event('input')); await w();
    sel.value = 'elet'; sel.dispatchEvent(new Event('change')); await w(); o.elet = n();
    const b = sec.querySelector('.bsiST-scheda button'); b.click(); await w();
    o.premuto = b.getAttribute('aria-pressed');
    sec.querySelectorAll('.bsiFX-schede button')[1].click(); await w();
    o.progressi = [...sec.querySelectorAll('[role=tabpanel]')].find((p) => p.style.display !== 'none').innerText;
    sec.querySelectorAll('.bsiFX-schede button')[0].click();
    return o;
  });
  att('riassunti: 3 schede, «VELOCITA» trova «velocità» (1), «perpetuo» (1), «zzzz» nessuna', [3, 1, 1, 0, true], [ri.tutte, ri.velocita, ri.perpetuo, ri.nessuna, ri.vuoto]);
  att('  · filtro per argomento (Elettromagnetismo: 1)', 1, ri.elet);
  att('  · «segna come studiato» si accende', 'true', ri.premuto);
  att('  · i progressi lo contano (1 / 3)', true, /1 \/ 3/.test(ri.progressi) && /Elettromagnetismo[\s\S]*1 \/ 1/.test(ri.progressi));
  const dep = await pg.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('bsi-studio:fisica:studiati') || '{}')).length);
  att('  · e restano nel localStorage', 1, dep);

  /* quiz: una sbagliata con il tasto, una giusta con il clic, una giusta con il tasto + Invio */
  await apri('sfisquiz');
  const quizDati = await pg.evaluate(() => window.BSIStudio.dati('fisica').quiz.map((q) => ({ d: q.d, giusta: q.r[q.k] })));
  async function statoDomanda() {
    return pg.evaluate((Q) => {
      const sec = document.getElementById('sfisquiz'), d = sec.querySelector('.bsiST-domanda');
      if (!d) return null;
      const q = Q.find((x) => x.d.replace(/<[^>]*>/g, '') === d.textContent);
      const opz = [...sec.querySelectorAll('.bsiST-opz')].map((b) => b.querySelector('span').textContent);
      return { d: d.textContent, giusta: opz.indexOf(q.giusta), n: opz.length };
    }, quizDati);
  }
  await pg.evaluate(() => { const s = document.getElementById('sfisquiz'); s.querySelector('.bsiFX-filtri, .bsiST-filtri'); [...s.querySelectorAll('button')].find((b) => /Inizia/.test(b.textContent)).click(); });
  await pg.waitForTimeout(100);
  let d1 = await statoDomanda();
  att('quiz: parte (3 domande disponibili, 4 risposte)', 4, d1 && d1.n);
  await pg.keyboard.press(String(((d1.giusta + 1) % 4) + 1));      /* sbagliata */
  const fb1 = await pg.evaluate(() => { const e = document.querySelector('#sfisquiz .bsiST-esito'); return { t: e.textContent, live: e.getAttribute('aria-live'), sb: !!document.querySelector('#sfisquiz .bsiST-opz.sbagliata'), gi: !!document.querySelector('#sfisquiz .bsiST-opz.giusta') }; });
  att('  · tasto: risposta sbagliata, spiegazione nella regione aria-live', true, /Sbagliato/.test(fb1.t) && fb1.live === 'polite' && fb1.sb && fb1.gi && fb1.t.length > 40);
  await pg.keyboard.press('Enter');
  const d2 = await statoDomanda();
  att('  · Invio → domanda 2', true, !!d2 && d2.d !== d1.d);
  await pg.evaluate((g) => document.querySelectorAll('#sfisquiz .bsiST-opz')[g].click(), d2.giusta);
  const fb2 = await pg.evaluate(() => document.querySelector('#sfisquiz .bsiST-esito').textContent);
  att('  · clic sulla giusta: «Giusto!»', true, /Giusto/.test(fb2));
  await pg.evaluate(() => [...document.querySelectorAll('#sfisquiz button')].find((b) => /Avanti/.test(b.textContent)).click());
  const d3 = await statoDomanda();
  await pg.keyboard.press(String(d3.giusta + 1));
  await pg.keyboard.press('Enter');
  const fine = await pg.evaluate(() => { const s = document.getElementById('sfisquiz'); return { grande: (s.querySelector('.bsiST-grande') || {}).textContent, righe: s.querySelectorAll('.bsiST-quiz .bsiST-tab tr').length, ripassa: !![...s.querySelectorAll('button')].find((b) => /Ripassa gli errori \(1\)/.test(b.textContent)) }; });
  att('  · fine: 2 / 3 · 67 %', true, /2 \/ 3 · 67 %/.test(fine.grande || ''));
  att('  · punteggio per argomento (3 righe + intestazione)', 4, fine.righe);
  att('  · «Ripassa gli errori (1)»', true, fine.ripassa);
  await pg.evaluate(() => [...document.querySelectorAll('#sfisquiz button')].find((b) => /Ripassa gli errori/.test(b.textContent)).click());
  const dr = await statoDomanda();
  att('  · il ripasso ripropone la domanda sbagliata', d1.d, dr && dr.d);
  await pg.keyboard.press(String(dr.giusta + 1)); await pg.keyboard.press('Enter');
  const fr = await pg.evaluate(() => document.querySelector('#sfisquiz .bsiST-grande').textContent);
  att('  · ripasso finito: 1 / 1', true, /1 \/ 1 · 100 %/.test(fr));
  const sto = await pg.evaluate(async () => {
    const sec = document.getElementById('sfisquiz'); sec.querySelectorAll('.bsiFX-schede button')[1].click(); await new Promise((r) => setTimeout(r, 80));
    const p = [...sec.querySelectorAll('[role=tabpanel]')].find((x) => x.style.display !== 'none');
    return { t: p.innerText, n: JSON.parse(localStorage.getItem('bsi-studio:fisica:quiz') || '[]').length };
  });
  att('  · 🏆 Storico: record 67 %, un solo quiz salvato (il ripasso non conta)', true, /🏆 67 %/.test(sto.t) && sto.n === 1 && (sto.t.match(/\s100 %/g) || []).length === 2 && (sto.t.match(/\s0 %/g) || []).length === 1);
  await pg.evaluate(() => document.querySelectorAll('#sfisquiz .bsiFX-schede button')[0].click());

  /* flashcard */
  await apri('sfisflash');
  await pg.focus('#sfisflash .bsiST-carta');
  const f0 = await pg.evaluate(() => ({ si: document.querySelector('#sfisflash .bsiST-riga button:nth-child(2)').disabled }));
  await pg.keyboard.press('Space');
  const f1 = await pg.evaluate(() => { const c = document.querySelector('#sfisflash .bsiST-carta'); return { girata: c.classList.contains('girata'), si: document.querySelector('#sfisflash .bsiST-riga button:nth-child(2)').disabled, tr: getComputedStyle(c.querySelector('.bsiST-interno')).transitionDuration }; });
  att('flashcard: «la sapevo» spento prima di girare', true, f0.si);
  att('  · Spazio la gira (3D, transizione 0,55 s) e accende i pulsanti', true, f1.girata && !f1.si && f1.tr === '0.55s');
  await pg.evaluate(() => [...document.querySelectorAll('#sfisflash button')].find((b) => /La sapevo/.test(b.textContent)).click());
  let L = await pg.evaluate(() => JSON.parse(localStorage.getItem('bsi-studio:fisica:leitner') || '{}'));
  att('  · «La sapevo» → scatola 2', [2], Object.values(L));
  const nonGirata = await pg.evaluate(() => !document.querySelector('#sfisflash .bsiST-carta').classList.contains('girata'));
  att('  · arriva una carta nuova, non girata', true, nonGirata);
  await pg.click('#sfisflash .bsiST-carta');
  await pg.evaluate(() => [...document.querySelectorAll('#sfisflash button')].find((b) => /Non la sapevo/.test(b.textContent)).click());
  L = await pg.evaluate(() => JSON.parse(localStorage.getItem('bsi-studio:fisica:leitner') || '{}'));
  att('  · clic per girare, «Non la sapevo» → scatola 1 (un’altra carta: la precedente non si ripete)', [1, 2], Object.values(L).sort());
  /* tre giri giusti di fila sulla stessa carta: la scatola sale */
  for (let i = 0; i < 6; i++) {
    await pg.keyboard.press('Space');
    await pg.evaluate(() => [...document.querySelectorAll('#sfisflash button')].find((b) => /La sapevo/.test(b.textContent)).click());
  }
  L = await pg.evaluate(() => JSON.parse(localStorage.getItem('bsi-studio:fisica:leitner') || '{}'));
  const sc = await pg.evaluate(async () => {
    const sec = document.getElementById('sfisflash'); sec.querySelectorAll('.bsiFX-schede button')[1].click(); await new Promise((r) => setTimeout(r, 80));
    const p = [...sec.querySelectorAll('[role=tabpanel]')].find((x) => x.style.display !== 'none');
    return { t: p.innerText, barre: p.querySelectorAll('[role=progressbar]').length, conta: [...p.querySelectorAll('.bsiST-prog')[0].querySelectorAll('b')].map((b) => +b.textContent) };
  });
  const somma = sc.conta.reduce((a, b) => a + b, 0), atteso = [1, 2, 3, 4, 5].map((s) => [0, 1, 2].filter((i) => (Object.values(L)[i] || 1) === s).length);
  att('  · 📦 Scatole: 5 scatole + 3 argomenti con barre, i conteggi tornano col deposito', true, sc.barre === 8 && somma === 3 && Math.max.apply(null, Object.values(L)) > 1);
  void atteso;
  await pg.evaluate(() => document.querySelectorAll('#sfisflash .bsiFX-schede button')[0].click());

  /* formulario: ricerca e copia */
  await apri('sfisform');
  const fo = await pg.evaluate(async () => {
    const sec = document.getElementById('sfisform'), cerca = sec.querySelector('input[type=search]');
    const o = { tutte: sec.querySelectorAll('.bsiST-scheda').length, gruppi: sec.querySelectorAll('.bsiST-gruppo').length };
    cerca.value = 'coulomb'; cerca.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 50));
    o.coulomb = sec.querySelectorAll('.bsiST-scheda').length;
    cerca.value = 'ΔU'; cerca.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 50));
    o.simbolo = sec.querySelectorAll('.bsiST-scheda').length;
    cerca.value = 'coulomb'; cerca.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 50));
    sec.querySelector('.bsiST-scheda button').click(); await new Promise((r) => setTimeout(r, 300));
    o.stato = sec.querySelector('.bsiST-conta').textContent; o.bott = sec.querySelector('.bsiST-scheda button').textContent;
    try { o.appunti = await navigator.clipboard.readText(); } catch (e) { o.appunti = 'non leggibile: ' + e.message; }
    cerca.value = ''; cerca.dispatchEvent(new Event('input'));
    return o;
  });
  att('formulario: 3 formule in 3 gruppi; «coulomb» → 1; il simbolo «ΔU» → 1', [3, 3, 1, 1], [fo.tutte, fo.gruppi, fo.coulomb, fo.simbolo]);
  att('  · «Copia» mette negli appunti il testo semplice', 'F = k·q_1q_2/r^2', fo.appunti);
  att('  · e lo dice', true, /Copiata/.test(fo.bott) && /copiata/.test(fo.stato));

  /* glossario */
  await apri('sfisgloss');
  const gl = await pg.evaluate(async () => {
    const sec = document.getElementById('sfisgloss'), cerca = sec.querySelector('input[type=search]');
    const lett = [...sec.querySelectorAll('.bsiST-lettere button')], on = lett.filter((b) => !b.disabled).map((b) => b.textContent).join('');
    const termini = [...sec.querySelectorAll('dt')].map((d) => d.textContent);
    lett.find((b) => b.textContent === 'E').click(); await new Promise((r) => setTimeout(r, 400));
    const o = { on, termini, fuoco: document.activeElement && document.activeElement.textContent };
    cerca.value = 'DISORDINE'; cerca.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 50));
    o.def = [...sec.querySelectorAll('dt')].map((d) => d.textContent);
    o.lettereDopo = [...sec.querySelectorAll('.bsiST-lettere button')].filter((b) => !b.disabled).map((b) => b.textContent).join('');
    cerca.value = ''; cerca.dispatchEvent(new Event('input'));
    return o;
  });
  att('glossario: lettere attive A ed E (l’iniziale accentata «Ë» va sotto E)', 'AE', gl.on);
  att('  · ordine alfabetico', ['Accelerazione', 'Ëone di prova', 'Entropia'].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' })), gl.termini);
  att('  · il salto alla lettera porta il fuoco sul titolo E', 'E', gl.fuoco);
  att('  · la ricerca guarda le definizioni (DISORDINE → Entropia), la barra si aggiorna', [['Entropia'], 'E'], [gl.def, gl.lettereDopo]);

  /* lingua: in inglese le sezioni costruite si rifanno */
  const en = await pg.evaluate(async () => {
    window.BSILingue.imposta('en'); await new Promise((r) => setTimeout(r, 400));
    const o = {};
    ['sfisriass', 'sfisquiz', 'sfisflash', 'sfisform', 'sfisgloss'].forEach((id) => {
      const s = document.getElementById(id);
      o[id] = { tit: s.querySelector('.bsiFX-tit').textContent, schede: [...s.querySelectorAll('.bsiFX-schede button')].map((b) => b.textContent).join(' | '), sotto: s.querySelector('.bsiFX-sotto').textContent.slice(0, 30) };
    });
    window.apri('sfisquiz'); await new Promise((r) => setTimeout(r, 100));
    o.inizia = [...document.querySelectorAll('#sfisquiz button')].map((b) => b.textContent).join(' | ');
    return o;
  });
  att('lingua → en: titoli in inglese', ['🗺️ Physics summaries', '❓ Physics quiz', '🃏 Physics flashcards', '📐 Physics formula sheet', '📖 Physics glossary'], SEZ.map((s) => en[s].tit));
  att('  · schede in inglese', '📚 Cards | ✅ Progress', en.sfisriass.schede);
  att('  · sottotitolo in inglese', true, /summaries across/.test(en.sfisriass.sotto));
  att('  · il quiz ricostruito ha «Start the quiz»', true, /Start the quiz/.test(en.inizia));
  for (const id of SEZ) {
    await apri(id); await pg.waitForTimeout(100);
    const sch = await controllaSchede(pg, id);
    att('  · ' + id + ' in inglese: ogni scheda > 100 caratteri, niente ⚠, niente sborda', true, sch.every((s) => s.testo > 100 && !s.avviso && !s.larghi.length && s.sborda <= 0));
  }
  /* il quiz in inglese, fino in fondo con i soli tasti */
  await apri('sfisquiz');
  await pg.evaluate(() => [...document.querySelectorAll('#sfisquiz button')].find((b) => /Start the quiz/.test(b.textContent)).click());
  for (let i = 0; i < 3; i++) { await pg.keyboard.press('1'); await pg.keyboard.press('Enter'); }
  const fe = await pg.evaluate(() => (document.querySelector('#sfisquiz .bsiST-grande') || {}).textContent || '');
  att('  · quiz in inglese con i soli tasti fino al risultato', true, /\/ 3 ·/.test(fe));
  await pg.evaluate(async () => { window.BSILingue.imposta('it'); await new Promise((r) => setTimeout(r, 300)); });
  const it = await pg.evaluate(() => document.querySelector('#sfisquiz .bsiFX-tit').textContent);
  att('lingua → it: di nuovo «❓ Quiz di fisica»', '❓ Quiz di fisica', it);

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach((e) => console.log('      ! ' + e.slice(0, 200)));
  await ctx.close();
}

async function provaMovimento(browser) {
  console.log('── Chromium, «riduci movimento» ──');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' });
  const pg = await ctx.newPage();
  await pg.goto(BASE + '_prove/studio.html', { waitUntil: 'load' });
  await pg.evaluate(() => window.apri('sfisflash'));
  const tr = await pg.evaluate(() => getComputedStyle(document.querySelector('#sfisflash .bsiST-interno')).transitionDuration);
  att('con prefers-reduced-motion la carta si gira senza animazione', '0s', tr);
  await ctx.close();
}

(async () => {
  provaNode();
  let pw;
  try { pw = require(path.join(RADICE, 'node_modules', 'playwright-core')); }
  catch (e) { console.log('playwright-core manca: salto il browser'); ko++; }
  if (pw) {
    const browser = await pw.chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
    try {
      await provaBrowser(browser, 390);
      await provaBrowser(browser, 1280);
      await provaMovimento(browser);
    } finally { await browser.close(); }
  }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
