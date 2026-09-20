/* UN VISORE, NON UNO PER MOLECOLA.
   Guardare dieci molecole in 3D non deve costare dieci contesti WebGL: il
   browser ne concede una quindicina e poi comincia a spegnere i piu' vecchi.
   Qui si conta quante volte viene creato un visore mentre si sfoglia. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const MOLECOLE = ['CCO', 'CC(=O)O', 'c1ccccc1', 'CCN', 'CC(C)O',
                  'C1CCCCC1', 'CCOCC', 'CC#N', 'CCCCO', 'c1ccncc1'];

(async () => {
  // Senza questi flag Chromium qui non ha WebGL affatto e 3Dmol ripiega su un
// disegno software: il contatore dei contesti resterebbe a zero e il banco
// "passerebbe" senza aver messo alla prova la risorsa che voleva misurare.
  const b = await chromium.launch({ executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  // PubChem non e' raggiungibile da qui: si risponde con un SDF minimo vero,
  // altrimenti il visore non arriverebbe mai a disegnare nulla.
  await pg.route('**://pubchem.ncbi.nlm.nih.gov/**', r => r.fulfill({
    status: 200, contentType: 'chemical/x-mdl-sdfile',
    headers: { 'access-control-allow-origin': '*' },
    body: '\n  prova\n\n  2  1  0  0  0  0  0  0  0  0999 V2000\n' +
      '    0.0000    0.0000    0.0000 C   0  0\n' +
      '    1.5000    0.0000    0.0000 O   0  0\n  1  2  1  0\nM  END\n$$$$\n'
  }));
  /* Contare le chiamate a $3Dmol.createViewer non funziona: la libreria si
     carica DOPO, e rimpiazza l'oggetto su cui era stata messa la sonda —
     zero chiamate contate mentre il visore disegnava benissimo. Si conta
     invece la risorsa vera, il contesto WebGL, con la sonda piantata prima
     che la pagina parta. */
  /* Nota su questo ambiente: qui Chromium non concede WebGL nemmeno con
     swiftshader, e 3Dmol ripiega sul disegno 2D — contare i contesti WebGL
     darebbe zero comunque, cioe' un successo regalato. Si conta allora la
     COSTRUZIONE del visore, che e' la cosa da non ripetere: ogni visore
     nuovo si porta dietro la propria tela. Un visore = una tela creata,
     qualunque sia il motore di disegno sotto. */
  await pg.addInitScript(() => {
    window.__gl = { creati: 0, vivi: 0, tele: 0 };
    const creaOrig = Document.prototype.createElement;
    Document.prototype.createElement = function (tag) {
      const el = creaOrig.apply(this, arguments);
      if (String(tag).toLowerCase() === 'canvas') window.__gl.tele++;
      return el;
    };
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (tipo) {
      const c = orig.apply(this, arguments);
      if (c && /webgl/i.test(String(tipo))) {
        window.__gl.creati++; window.__gl.vivi++;
        this.addEventListener('webglcontextlost', () => { window.__gl.vivi--; });
      }
      return c;
    };
  });
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2500);
  const prima = await pg.evaluate(() => ({ gl: window.__gl.creati, tele: window.__gl.tele }));
  console.log('    · all\'avvio: ' + prima.gl + ' contesti WebGL, ' + prima.tele + ' tele create');

  /* _ctrSmiles vive dentro una IIFE: assegnarlo su window — come faceva la
     prima versione di questo banco — creava una variabile diversa, la
     funzione vedeva ancora la sua (vuota) e usciva subito. Zero visori
     creati, e il banco che si lamentava del posto sbagliato. Si passa dalla
     porta vera: la casella di ricerca e ctrAnalyze, come farebbe l'utente. */
  console.log('\nSi sfogliano ' + MOLECOLE.length + ' molecole diverse nel visore 3D');
  for (const smi of MOLECOLE) {
    await pg.evaluate(s => {
      const inp = document.getElementById('ctrSmiles');
      if (inp) inp.value = s;
      window.ctrAnalyze();
      window.ctrShow3D();
    }, smi);
    await pg.waitForTimeout(400);
  }
  await pg.waitForTimeout(1200);

  const n = await pg.evaluate(() => ({
    creati: window.__gl.creati,
    vivi: window.__gl.vivi,
    tele: document.querySelectorAll('#ctrD3box canvas').length,
    teleCreate: window.__gl.tele,
    caricata: document.getElementById('ctrD3box')._loaded || ''
  }));
  const nuovi = n.creati - prima.gl;
  const teleNuove = n.teleCreate - prima.tele;
  console.log('    · sfogliando: ' + nuovi + ' contesti WebGL, ' + teleNuove
    + ' tele create per ' + MOLECOLE.length + ' molecole');
  console.log('    · canvas rimasti nel riquadro: ' + n.tele);
  console.log('    · ultima molecola disegnata: ' + n.caricata);
  // Il visore va costruito una volta sola: dieci molecole, un contesto.
  att('sfogliare molecole non apre un contesto WebGL per ciascuna', true, nuovi <= 1);
  att('e non costruisce un visore nuovo per ogni molecola', true, teleNuove <= 2);
  att('e nel riquadro resta una sola tela', 1, n.tele);
  att('il visore ha comunque disegnato qualcosa', true, n.caricata.length > 0);
  att('nessun errore JS', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 160)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
