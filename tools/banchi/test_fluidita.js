/* ═══════════════════════════════════════════════════════════════════════════
   test_fluidita — aprire una sezione non deve bloccare la pagina

   PERCHE' QUESTO BANCO ESISTE

   La fluiditA' era l'unica qualità richiesta che nessun banco misurava. Si
   era già intervenuti due volte sul tema — `content-visibility` sugli
   elenchi lunghi, e il ri-addestramento per predizione in chemioinformatica —
   senza lasciare niente che impedisse al difetto di tornare.

   Quando poi si e' misurato davvero, si sono trovati tre difetti che nessuno
   vedeva:

   1. «Viewer 3D PRO» bloccava la pagina 797 ms al primo click. Il profilatore
      lo attribuisce al primo `render()` di 3Dmol, che compila gli shader del
      contesto WebGL: lavoro inevitabile, ma non dentro il click.
   2. «Sintesi» disegnava 296 figure SVG — 5 351 nodi — prima di mostrare
      qualunque cosa, mentre all'apertura se ne vedono tre.
   3. All'apertura di «Sintesi» si programmavano 296 timer a 40 ms di
      distanza: undici secondi e mezzo di risvegli che chiedevano
      `getTotalLength()` su ogni tratto di ogni figura, comprese quelle fuori
      dallo schermo.

   LE DUE DIREZIONI

   Misurare solo il tempo non basta: una pagina che non costruisce niente e'
   fulminea. Per ogni soglia di velocità c'e' qui la prova contraria che il
   lavoro e' stato fatto comunque — il viewer 3D compare, le 296 figure
   esistono tutte, la stampa non esce muta. E il banco conta le sezioni che
   ha attraversato: se un giorno ne percorresse dieci invece di 89, i tempi
   sarebbero ottimi e la misura priva di valore.

   USO   node tools/banchi/test_fluidita.js     (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* ── Base dichiarata ────────────────────────────────────────────────────────
   Le soglie sono volutamente piu' larghe delle misure attuali: questo banco
   gira su rasterizzatore software, e un margine troppo stretto fallirebbe per
   il carico della macchina e non per un difetto. Restano molto sotto ai
   valori da cui si e' partiti, che sono indicati accanto. */
const SOGLIE = {
  sezioniAttese:     89,    /* tutte: la guardia opposta */
  medianaMs:         40,    /* misurata 15 */
  peggioreMs:       260,    /* misurata 162 — era 1166 */
  oltre100ms:         2,    /* misurate 1 — erano 2 */
  figureAttese:     296
};

/* ── Il visore 3D non si misura in millisecondi assoluti ────────────────
   La soglia era `visore3dMs: 80`, con la misura di 14 ms accanto. Con lo
   STESSO codice pubblicato, su container diversi, lo stesso click ha misurato
   14, 22, 98, 105 e 192 ms. Il costo è la compilazione degli shader di 3Dmol,
   e qui WebGL è **SwiftShader**: un rasterizzatore software. Una soglia
   assoluta, in quelle condizioni, misura la macchina e non il codice:
   fallisce dove il codice è identico e passerebbe dove è peggiorato.

   Si è provato a renderla un rapporto su una calibrazione misurata nella
   stessa esecuzione. Non funziona: quando il banco arriva al visore, WebGL
   è già stato usato dalla pagina e la calibrazione misura un costo A CALDO
   (2,9 ms), mentre il visore paga una compilazione A FREDDO. Il rapporto
   oscillava fra 14× e 36× — cioè non misurava niente di stabile.

   Quello che il controllo deve davvero impedire è STRUTTURALE, non temporale:
   il difetto da cui si è partiti era il primo `render()` di 3Dmol chiamato
   DENTRO il gestore del click, che teneva la pagina bloccata 797 ms. Allora
   si afferma quello, e si afferma nei due versi:

     · subito dopo il ritorno del gestore, nello stesso task, il contesto
       WebGL NON deve esistere — se esistesse, la compilazione è tornata
       dentro il click, qualunque sia il tempo sul cronometro;
     · poco dopo DEVE esistere — altrimenti il click è veloce perché non
       costruisce niente, che è un peggioramento travestito.

   Resta un tetto assoluto, dichiarato grossolano: serve solo a intercettare
   una catastrofe, non a misurare la resa. */
const TETTO_VISORE_MS = 400;

let ok = 0, ko = 0, eseguiti = 0;

function att(d, atteso, avuto){
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function sotto(d, limite, avuto){
  eseguiti++;
  if (avuto <= limite) { ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (limite ' + limite + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      limite: ' + limite + '\n      avuto:  ' + avuto); }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1280, height: 900 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(3000);
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

  console.log('Fluidità — il tempo che la pagina resta bloccata a ogni cambio di sezione\n');

  /* ── §1 · Il viewer 3D: veloce ad aprirsi E funzionante ────────────────── */
  console.log('── Viewer 3D PRO ──');
  const visore = await pg.evaluate(() => {
    const tele = () => {
      const d = document.getElementById('glviewer3dpro');
      return d ? d.querySelectorAll('canvas').length : -1;
    };
    const t0 = performance.now();
    document.querySelector('.nav-btn[data-s="s3dpro"]').click();
    /* letto PRIMA di cedere il controllo: siamo ancora nel task del click */
    const durante = tele();
    return { clickMs: Math.round(performance.now() - t0), teleDuranteIlClick: durante };
  });
  /* il verso che conta: la compilazione degli shader non è dentro il click */
  att('il click NON costruisce il contesto WebGL (tele create nel gestore)',
      0, Math.max(0, visore.teleDuranteIlClick));
  sotto('e il gestore resta sotto il tetto grossolano (ms)',
        TETTO_VISORE_MS, visore.clickMs);

  /* La prova contraria. Un click veloce perche' non costruisce niente
     sarebbe un peggioramento travestito da miglioramento: il viewer deve
     comparire comunque, poco dopo. */
  await pg.waitForTimeout(2500);
  const costruito = await pg.evaluate(() => {
    const sec = document.getElementById('s3dpro');
    const div = document.getElementById('glviewer3dpro');
    return {
      nodi: sec ? sec.getElementsByTagName('*').length : 0,
      tela: div ? div.querySelectorAll('canvas').length : 0,
      pulsanti: sec ? sec.querySelectorAll('button').length : 0
    };
  });
  att('il viewer si costruisce comunque: la tela WebGL esiste', true, costruito.tela >= 1);
  att('e i comandi del pannello ci sono', true, costruito.pulsanti >= 10);
  console.log('      (' + costruito.nodi + ' nodi, ' + costruito.tela + ' tela, ' +
              costruito.pulsanti + ' comandi)');

  /* ── §2 · Le figure della sintesi: a fette, ma tutte ───────────────────── */
  console.log('\n── Sintesi: 296 figure ──');
  const apertura = await pg.evaluate(() => {
    const t0 = performance.now();
    document.querySelector('.nav-btn[data-s="ssyn"]').click();
    const ms = Math.round(performance.now() - t0);
    const l = document.getElementById('rxnList');
    return { ms: ms,
             carteSubito: l ? l.querySelectorAll('.rxn-card').length : 0,
             figureSubito: l ? l.querySelectorAll('.rxn-sw svg').length : 0 };
  });
  att('le carte delle reazioni ci sono tutte subito', SOGLIE.figureAttese, apertura.carteSubito);
  /* che il disegno sia DAVVERO differito, non una dichiarazione: all'istante
     dell'apertura le figure disegnate devono essere meno delle carte */
  att('e le figure NON sono ancora tutte disegnate (il differimento esiste)',
      true, apertura.figureSubito < apertura.carteSubito);

  /* e dopo un momento non ne deve restare nessuna vuota: una figura assente
     e' un difetto, la lentezza era solo un fastidio */
  await pg.waitForTimeout(4000);
  const complete = await pg.evaluate(() => {
    const l = document.getElementById('rxnList');
    return { figure: l ? l.querySelectorAll('.rxn-sw svg').length : 0,
             vuote: l ? [].filter.call(l.querySelectorAll('.rxn-sw'), x => !x.firstChild).length : -1 };
  });
  att('poco dopo, ogni figura è disegnata', SOGLIE.figureAttese, complete.figure);
  att('nessuna cornice resta vuota', 0, complete.vuote);
  console.log('      (' + apertura.figureSubito + ' figure all\'apertura → ' +
              complete.figure + ' dopo quattro secondi)');

  /* la stampa non puo' aspettare le fette */
  const stampa = await pg.evaluate(() => {
    window.showRxns('all', '');                    /* ricostruisce: cornici vuote */
    const prima = document.querySelectorAll('#rxnList .rxn-sw svg').length;
    window.dispatchEvent(new Event('beforeprint'));
    return { prima: prima,
             dopo: document.querySelectorAll('#rxnList .rxn-sw svg').length };
  });
  att('alla stampa le figure si disegnano tutte, subito', SOGLIE.figureAttese, stampa.dopo);
  att('e prima dell\'evento di stampa non lo erano', true, stampa.prima < SOGLIE.figureAttese);

  /* la ricerca lavora sui dati, non sulle figure: deve filtrare anche le
     carte la cui figura non e' ancora nata */
  const ricerca = await pg.evaluate(() => {
    window.showRxns('all', 'aldol');
    const n = document.querySelectorAll('#rxnList .rxn-card').length;
    window.showRxns('all', '');
    return { filtrate: n, tutte: document.querySelectorAll('#rxnList .rxn-card').length };
  });
  att('la ricerca filtra anche le carte non ancora disegnate', true,
      ricerca.filtrate > 0 && ricerca.filtrate < ricerca.tutte);
  console.log('      («aldol»: ' + ricerca.filtrate + ' su ' + ricerca.tutte + ')');

  /* ── §3 · Tutte le sezioni, una per una ───────────────────────────────── */
  console.log('\n── I cambi di sezione ──');
  const giro = await pg.evaluate(async () => {
    const ids = [].map.call(document.querySelectorAll('.nav-btn[data-s]'),
                            x => x.getAttribute('data-s'));
    const tempi = [];
    for (const s of ids) {
      const t0 = performance.now();
      const x = document.querySelector('.nav-btn[data-s="' + s + '"]');
      if (x) x.click();
      tempi.push({ s: s, ms: Math.round(performance.now() - t0) });
      await new Promise(r => setTimeout(r, 60));
    }
    tempi.sort((a, b) => b.ms - a.ms);
    return { quante: ids.length, tempi: tempi,
             mediana: tempi[Math.floor(tempi.length / 2)].ms,
             oltre100: tempi.filter(t => t.ms > 100).length };
  });

  /* La guardia opposta. Tempi ottimi misurati su dieci sezioni invece di 89
     sarebbero il difetto piu' insidioso di tutti: un numero perfetto preso su
     meno superficie. */
  att('le sezioni attraversate sono tutte', true, giro.quante >= SOGLIE.sezioniAttese);
  sotto('il cambio di sezione mediano (ms)', SOGLIE.medianaMs, giro.mediana);
  sotto('il cambio di sezione peggiore (ms)', SOGLIE.peggioreMs, giro.tempi[0].ms);
  sotto('quante sezioni superano i 100 ms', SOGLIE.oltre100ms, giro.oltre100);
  console.log('      (' + giro.quante + ' sezioni; le più lente: ' +
              giro.tempi.slice(0, 4).map(t => t.s + ' ' + t.ms + 'ms').join(', ') + ')');

  att('nessun errore JavaScript percorrendo tutta l\'applicazione', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 14) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 14');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
