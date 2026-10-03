/* ═══════════════════════════════════════════════════════════════════════════
   test_mol3d — la molecola che si forma, e gli angoli fra i suoi legami

   PERCHE' QUESTO BANCO ESISTE

   Due aggiunte, due modi di sembrare giuste senza esserlo.

   L'ANIMAZIONE. Un'animazione «c'è» o «non c'è» non si vede da un'ispezione
   del codice: un ciclo che gira e disegna sempre la stessa cosa supera
   qualunque controllo sull'esistenza della funzione. Qui si guardano i PIXEL:
   subito dopo l'avvio la tela deve essere quasi vuota — polvere — e due
   secondi dopo deve esserci una molecola. Se i due numeri sono uguali,
   l'animazione non c'è, comunque sia scritto il codice.

   GLI ANGOLI. Un numero con un «°» accanto sembra una misura. Qui gli angoli
   si verificano su geometrie costruite a mano, di cui il valore è noto per
   costruzione: il tetraedro regolare dà 109,4712°, non «circa 109». E si
   pretende che su una struttura PIATTA il programma si rifiuti di mostrarli:
   su coordinate con z = 0 un angolo di legame non è un angolo di legame, e
   mostrarlo sarebbe l'errore peggiore dei due, perché somiglia a un dato.

   USO   node tools/banchi/test_mol3d.js      (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;

function att(d, atteso, avuto){
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vicino(d, atteso, avuto, tolleranza){
  eseguiti++;
  const sc = Math.abs(avuto - atteso);
  if (sc <= tolleranza) { ok++; console.log('  ✓ ' + d + '  → ' + avuto + '° (atteso ' + atteso + '°)'); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tolleranza +
                           '\n      avuto:  ' + avuto); }
}

/* ── Geometrie costruite a mano ───────────────────────────────────────────
   L'angolo atteso è quello che le COORDINATE scritte qui sotto codificano, e
   si ricava a mano con il prodotto scalare: non è una costante di letteratura
   presa in prestito. Per l'ammoniaca le coordinate danno 106,13°, vicino ma
   non uguale al valore sperimentale 106,7°, e il banco verifica il calcolo,
   non la chimica di quella particolare geometria. */
const GEOMETRIE = [
  { nome: 'metano · tetraedro regolare', gradi: 109.4712, geo: 'tetraedrica',
    atoms: [{x:0,y:0,z:0,el:'C'},{x:1,y:1,z:1,el:'H'},{x:1,y:-1,z:-1,el:'H'},
            {x:-1,y:1,z:-1,el:'H'},{x:-1,y:-1,z:1,el:'H'}],
    bonds: [{a:0,b:1,t:1},{a:0,b:2,t:1},{a:0,b:3,t:1},{a:0,b:4,t:1}], quanti: 6 },
  { nome: 'acqua · angolata', gradi: 104.47, geo: 'angolata (sp³)',
    atoms: [{x:0,y:0,z:0,el:'O'},{x:0.7575,y:0.5868,z:0,el:'H'},
            {x:-0.7575,y:0.5868,z:0,el:'H'}],
    bonds: [{a:0,b:1,t:1},{a:0,b:2,t:1}], quanti: 1 },
  { nome: 'anidride carbonica · lineare', gradi: 180, geo: 'lineare',
    atoms: [{x:0,y:0,z:0,el:'C'},{x:1.16,y:0,z:0,el:'O'},{x:-1.16,y:0,z:0,el:'O'}],
    bonds: [{a:0,b:1,t:2},{a:0,b:2,t:2}], quanti: 1 },
  { nome: 'trifluoruro di boro · trigonale planare', gradi: 120, geo: 'trigonale planare',
    atoms: [{x:0,y:0,z:0,el:'B'},{x:1.3,y:0,z:0,el:'F'},
            {x:-0.65,y:1.1258,z:0,el:'F'},{x:-0.65,y:-1.1258,z:0,el:'F'}],
    bonds: [{a:0,b:1,t:1},{a:0,b:2,t:1},{a:0,b:3,t:1}], quanti: 3 },
  { nome: 'ammoniaca · piramidale', gradi: 106.13, geo: 'piramidale trigonale',
    atoms: [{x:0,y:0,z:0.1173,el:'N'},{x:0,y:0.9377,z:-0.2737,el:'H'},
            {x:0.8121,y:-0.4689,z:-0.2737,el:'H'},{x:-0.8121,y:-0.4689,z:-0.2737,el:'H'}],
    bonds: [{a:0,b:1,t:1},{a:0,b:2,t:1},{a:0,b:3,t:1}], quanti: 3 }
];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1100, height: 900 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(5000);

  console.log('La molecola che si forma, e gli angoli fra i suoi legami\n');

  /* ── §1 · Il modulo c'è e prende il posto del renderer ──────────────── */
  console.log('── Il modulo ──');
  const mod = await pg.evaluate(() => ({
    presente: typeof window.BSIMol3D === 'object',
    sostituisce: typeof window.render3DOnCanvas === 'function',
    originaleConservato: typeof window.bsiRender3DOriginale === 'function',
    diverso: window.render3DOnCanvas !== window.bsiRender3DOriginale
  }));
  att('il modulo è caricato', true, mod.presente);
  att('e ha preso il posto di render3DOnCanvas', true, mod.sostituisce && mod.diverso);
  att('conservando l’originale, raggiungibile', true, mod.originaleConservato);

  /* ── §2 · Gli angoli, su geometrie note per costruzione ─────────────── */
  console.log('\n── Gli angoli ──');
  const ang = await pg.evaluate((G) => {
    const M = window.BSIMol3D;
    return G.map(function (p) {
      const r = M.angoliDi({ atoms: p.atoms, bonds: p.bonds });
      const g = r.angoli.map(function (x) { return x.gradi; });
      const medio = g.length ? g.reduce(function (s, v) { return s + v; }, 0) / g.length : NaN;
      const scartoMax = g.length ? Math.max.apply(null, g.map(function (v) {
        return Math.abs(v - medio); })) : 0;
      return { nome: p.nome, quanti: g.length, medio: Math.round(medio * 10000) / 10000,
               dispersione: Math.round(scartoMax * 10000) / 10000,
               geo: r.angoli.length ? M.geometria(r.angoli[0].legami, r.angoli[0].gradi) : null };
    });
  }, GEOMETRIE);

  ang.forEach(function (a, i) {
    const atteso = GEOMETRIE[i];
    vicino(atteso.nome, atteso.gradi, a.medio, 0.05);
    att('  · quanti angoli ha ' + atteso.nome.split(' ·')[0], atteso.quanti, a.quanti);
    att('  · geometria riconosciuta', atteso.geo, a.geo);
  });

  /* ── §3 · La struttura piatta si riconosce, nei due versi ───────────── */
  console.log('\n── Coordinate piatte ──');
  const piana = await pg.evaluate(() => {
    const M = window.BSIMol3D;
    return {
      piatta: M.piatta({ atoms: [{x:0,y:0,z:0},{x:1,y:1,z:0},{x:2,y:0,z:0}] }),
      spaziale: M.piatta({ atoms: [{x:0,y:0,z:0},{x:1,y:1,z:0.6}] })
    };
  });
  att('una struttura con z = 0 è riconosciuta piatta', true, piana.piatta);
  /* la guardia opposta: se dicesse «piatta» a tutto, il rifiuto sarebbe
     inutile e nessun angolo si vedrebbe mai */
  att('e una con z ≠ 0 NON è riconosciuta piatta', false, piana.spaziale);

  /* ── §4 · La nascita: si guardano i pixel, non il codice ────────────── */
  console.log('\n── La formazione ──');
  const nascita = await pg.evaluate(async () => {
    const d = document.createElement('div');
    d.id = 'bancoBox';
    d.style.cssText = 'position:fixed;left:-9999px;top:0;width:460px';
    const c = document.createElement('canvas');
    c.id = 'bancoMol3d'; c.width = 440; c.height = 320;
    d.appendChild(c); document.body.appendChild(d);
    const mol = { atoms: [{x:0,y:0,z:0,el:'C',color:'#aaaaaa'},
                          {x:1,y:1,z:1,el:'H',color:'#ffffff'},
                          {x:1,y:-1,z:-1,el:'H',color:'#ffffff'},
                          {x:-1,y:1,z:-1,el:'H',color:'#ffffff'},
                          {x:-1,y:-1,z:1,el:'H',color:'#ffffff'}],
                  bonds: [{a:0,b:1,t:1},{a:0,b:2,t:1},{a:0,b:3,t:1},{a:0,b:4,t:1}] };
    const v = window.render3DOnCanvas(c, mol);
    const ctx = c.getContext('2d');
    function accesi() {
      const im = ctx.getImageData(0, 0, c.width, c.height).data;
      let a = 0;
      for (let i = 0; i < im.length; i += 4) {
        if (im[i] > 70 || im[i+1] > 70 || im[i+2] > 90) a++;
      }
      return a;
    }
    await new Promise(r => setTimeout(r, 130));
    const presto = accesi();
    await new Promise(r => setTimeout(r, 2200));
    const dopo = accesi();
    /* La barra si legge PRIMA di fermare: `stop()` la rimuove, ed è giusto che
       lo faccia — ma la prima stesura di questo banco leggeva dopo e trovava
       zero pulsanti, poi dichiarava «ognuno ha un nome accessibile» su un
       insieme vuoto. Un controllo che passa perché non ha niente da guardare
       è il difetto che questo progetto insegue da sempre. */
    const barra = d.querySelector('.bsi3d-barra');
    const bottoni = barra ? [].map.call(barra.querySelectorAll('button'), function (x) {
      return { testo: x.textContent.trim(), aria: x.getAttribute('aria-label') || '',
               spento: !!x.disabled };
    }) : [];
    /* e che si FERMI quando glielo si chiede: un ciclo che resta acceso su una
       tela rimossa è una perdita che si paga in batteria */
    v.stop();
    const congelato = accesi();
    await new Promise(r => setTimeout(r, 400));
    const ancora = accesi();
    d.remove();
    return { presto: presto, dopo: dopo, fermo: congelato === ancora,
             bottoni: bottoni, barraEsiste: !!barra, haStop: typeof v.stop === 'function' };
  });
  att('all’avvio la tela è quasi vuota (polvere)', true, nascita.presto < 1200);
  att('due secondi dopo c’è una molecola', true, nascita.dopo > nascita.presto * 2);
  att('il ciclo si ferma quando lo si ferma', true, nascita.fermo);
  console.log('      (' + nascita.presto + ' pixel accesi a 130 ms → ' + nascita.dopo +
              ' a 2,3 s)');

  /* ── §5 · I comandi sono pulsanti veri, con un nome ─────────────────── */
  console.log('\n── I comandi ──');
  att('la barra dei comandi compare accanto alla tela', true, nascita.barraEsiste);
  att('ha due pulsanti', 2, nascita.bottoni.length);
  /* non vacuo: si pretende che i pulsanti ci siano E che ognuno abbia un nome */
  att('ognuno ha un nome accessibile', '2 pulsanti, 0 senza nome',
      nascita.bottoni.length + ' pulsanti, ' +
      nascita.bottoni.filter(x => !x.aria || x.aria.length < 8).length + ' senza nome');
  nascita.bottoni.forEach(x => console.log('      · ' + x.testo + '  [' + x.aria + ']'));

  /* su una struttura piatta il pulsante degli angoli deve essere SPENTO */
  const suPiatta = await pg.evaluate(async () => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:-9999px;top:0;width:460px';
    const c = document.createElement('canvas');
    c.id = 'bancoPiatta'; c.width = 400; c.height = 300;
    d.appendChild(c); document.body.appendChild(d);
    const mol = { atoms: [{x:0,y:0,z:0,el:'O',color:'#ff4444'},
                          {x:1,y:0.6,z:0,el:'H',color:'#ffffff'},
                          {x:-1,y:0.6,z:0,el:'H',color:'#ffffff'}],
                  bonds: [{a:0,b:1,t:1},{a:0,b:2,t:1}] };
    const v = window.render3DOnCanvas(c, mol);
    await new Promise(r => setTimeout(r, 150));
    const barra = d.querySelector('.bsi3d-barra');
    const b2 = barra ? barra.querySelectorAll('button')[1] : null;
    const esito = { spento: b2 ? !!b2.disabled : null,
                    spiega: b2 ? (b2.title || '') : '',
                    avvisoVisibile: barra ? /piana|flat/i.test(barra.textContent) : false };
    v.stop(); d.remove();
    return esito;
  });
  att('su coordinate piatte il pulsante degli angoli è spento', true, suPiatta.spento);
  att('e la ragione è scritta, non taciuta', true,
      suPiatta.spiega.length > 20 && suPiatta.avvisoVisibile);
  console.log('      («' + suPiatta.spiega.slice(0, 72) + '…»)');

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 25) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 25');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
