/* ═══════════════════════════════════════════════════════════════════════════
   test_lingue — la lingua e i linguaggi delle molecole

   PERCHE' QUESTO BANCO ESISTE

   Due funzioni nuove, e due modi diversi di mentire senza accorgersene.

   LA LINGUA. Un interruttore che «traduce l'applicazione» è facile da
   scrivere e difficile da mantenere onesto: basta che qualcuno cambi
   un'etichetta italiana e la sua traduzione non si trova piu'. Il difetto non
   si vede — l'etichetta resta in italiano in mezzo all'inglese — a meno che
   qualcuno conti. Qui si conta: la copertura dello scheletro deve restare
   PIENA, e il ritorno all'italiano deve riprodurre il testo di partenza
   carattere per carattere.

   I LINGUAGGI DELLE MOLECOLE. Un convertitore che sbaglia non lo dice: una
   stringa storta somiglia a una stringa giusta. Qui si verifica contro fatti
   esterni — chiavi InChI di letteratura, scritte dentro il banco — e si
   pretende il giro completo: SMILES → molfile → SMILES deve tornare uguale.

   IL NOMINATORE. Nomina una classe ristretta e dichiarata. Si verifica su
   nomi scritti a mano, nelle due lingue, e si pretende che RIFIUTI tutto il
   resto: un nome sbagliato è peggio di nessun nome, e un nominatore che non
   rifiuta mai è un nominatore che inventa.

   USO   node tools/banchi/test_lingue.js      (serve un server su :8899)
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

/* ── Fatti esterni: chiavi InChI di letteratura ────────────────────────────
   Scritte qui e non chieste alla pagina. Un banco che chiedesse al programma
   i valori con cui verificarlo non verificherebbe niente. */
const CHIAVI = [
  ['CC(=O)Oc1ccccc1C(=O)O',         'BSYNRYMUTXBXSQ-UHFFFAOYSA-N', 'aspirina'],
  ['Cn1cnc2c1c(=O)n(C)c(=O)n2C',    'RYYVLZVUVIJVGH-UHFFFAOYSA-N', 'caffeina'],
  ['c1ccccc1',                       'UHOVQNZJYSORNB-UHFFFAOYSA-N', 'benzene'],
  ['CCO',                            'LFQSCWFLJHTTHZ-UHFFFAOYSA-N', 'etanolo'],
  ['C[C@@H](N)C(=O)O',               'QNAYBMKLOCPYGJ-UWTATZPHSA-N', 'L-alanina'],
  ['C/C=C/C',                        'IAQRGUVFOMOMEM-ONEGZZNKSA-N', '(E)-2-butene'],
  ['C/C=C\\C',                       'IAQRGUVFOMOMEM-ARJAWSKDSA-N', '(Z)-2-butene']
];

/* ── Nomi IUPAC scritti a mano, nelle due lingue ──────────────────────────
   La tavola ha già corretto un errore: su CC(Br)C(Cl)C i locanti {2,3} si
   ottengono da entrambi i capi, e la regola dà il numero piu' basso al
   sostituente primo in ordine alfabetico — 2-bromo-3-clorobutano, non il
   contrario, che era quello che avevo scritto io. */
const NOMI = [
  ['CCCC',          'butano',                 'butane'],
  ['CC(C)C',        '2-metilpropano',          '2-methylpropane'],
  ['CCC(C)CC',      '3-metilpentano',          '3-methylpentane'],
  ['CC(C)C(CC)CCC', '3-etil-2-metilesano',     '3-ethyl-2-methylhexane'],
  ['CC(C)(C)C',     '2,2-dimetilpropano',      '2,2-dimethylpropane'],
  ['CO',            'metanolo',                'methanol'],
  ['CCO',           'etanolo',                 'ethanol'],
  ['CC(O)C',        'propan-2-olo',            'propan-2-ol'],
  ['OCCO',          'etan-1,2-diolo',          'ethane-1,2-diol'],
  ['CC=O',          'etanale',                 'ethanal'],
  ['CC(=O)C',       'propan-2-one',            'propan-2-one'],
  ['CCC(=O)CC',     'pentan-3-one',            'pentan-3-one'],
  ['CC(=O)O',       'acido etanoico',          'ethanoic acid'],
  ['CCC(C)C(=O)O',  'acido 2-metilbutanoico',  '2-methylbutanoic acid'],
  ['CCN',           'etanammina',              'ethanamine'],
  ['CCCN',          'propan-1-ammina',         'propan-1-amine'],
  ['C=C',           'etene',                   'ethene'],
  ['CC=CC',         'but-2-ene',               'but-2-ene'],
  ['C=CC=C',        'buta-1,3-diene',          'buta-1,3-diene'],
  ['C#C',           'etino',                   'ethyne'],
  ['CC#C',          'prop-1-ino',              'prop-1-yne'],
  ['ClC(Cl)Cl',     'triclorometano',          'trichloromethane'],
  ['ClCC',          'cloroetano',              'chloroethane'],
  ['CC(Cl)C',       '2-cloropropano',          '2-chloropropane'],
  ['CC(Br)C(Cl)C',  '2-bromo-3-clorobutano',   '2-bromo-3-chlorobutane'],
  ['OCC=C',         'prop-2-en-1-olo',         'prop-2-en-1-ol']
];

/* Casi che DEVE rifiutare. Un nominatore che non rifiuta mai inventa. */
const RIFIUTI = [
  ['c1ccccc1',                'un anello'],
  ['CCOCC',                   'un etere'],
  ['CC(=O)OC',                'un estere'],
  ['OC(=O)CCO',               'due gruppi principali diversi'],
  ['CCCC(C(C)C)CCC',          'un sostituente ramificato sulla catena piu’ lunga'],
  ['[Na+].[Cl-]',             'un elemento fuori classe'],
  ['CC(=O)Oc1ccccc1C(=O)O',   'un anello e piu’ gruppi']
];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1280, height: 950 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(6000);
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

  console.log('Lingua dell’interfaccia e linguaggi delle molecole\n');

  /* ── §1 · I tre moduli ci sono ──────────────────────────────────────── */
  console.log('── I moduli ──');
  const moduli = await pg.evaluate(() => ({
    lingue: typeof window.BSILingue === 'object',
    molingue: typeof window.BSIMolLingue === 'object',
    pannelloLingua: typeof window.bsiApriLingua === 'function',
    pannelloMolingue: typeof window.bsiApriMolingue === 'function',
    vociMenu: [].map.call(document.querySelectorAll('#bsi105-menu .bsi105-mi'),
                          x => (x.textContent || '').trim())
  }));
  att('il motore delle lingue è esposto', true, moduli.lingue);
  att('il motore dei linguaggi molecolari è esposto', true, moduli.molingue);
  att('le due voci sono nel menu ✨', true,
      moduli.vociMenu.some(v => /Lingua|Language/.test(v)) &&
      moduli.vociMenu.some(v => /Linguaggi|Molecular/.test(v)));

  /* ── §2 · La lingua: copertura piena e ritorno esatto ───────────────── */
  console.log('\n── La lingua ──');
  const lingua = await pg.evaluate(() => {
    const prima = [].map.call(document.querySelectorAll('.nav-btn[data-s], .section-title'),
                              x => x.textContent);
    const r = window.BSILingue.imposta('en');
    const dopo = [].map.call(document.querySelectorAll('.nav-btn[data-s], .section-title'),
                             x => x.textContent);
    const cambiati = prima.filter((v, i) => v !== dopo[i]).length;
    window.BSILingue.imposta('it');
    const tornato = [].map.call(document.querySelectorAll('.nav-btn[data-s], .section-title'),
                                x => x.textContent);
    const diversi = prima.filter((v, i) => v !== tornato[i]);
    return { totali: r.totali, tradotti: r.tradotti, restati: r.restati,
             perFamiglia: r.perFamiglia, cambiati: cambiati,
             nonTornati: diversi.slice(0, 5), quantiNonTornati: diversi.length,
             lang: document.documentElement.getAttribute('lang') };
  });
  /* La guardia opposta: una traduzione perfetta misurata su dieci elementi
     invece che su tutto lo scheletro sarebbe un numero perfetto preso su meno
     superficie — lo stesso difetto gia' incontrato due volte in questo lavoro. */
  att('lo scheletro misurato è tutto (≥160 elementi)', true, lingua.totali >= 160);
  att('nessun elemento dello scheletro resta senza traduzione', 0, lingua.restati.length);
  lingua.restati.slice(0, 6).forEach(x => console.log('      ! ' + x));
  att('i pulsanti di navigazione tradotti sono tutti',
      lingua.perFamiglia.navigazione.totali, lingua.perFamiglia.navigazione.tradotti);
  att('i titoli di sezione tradotti sono tutti',
      lingua.perFamiglia.titoli.totali, lingua.perFamiglia.titoli.tradotti);
  /* e la prova che la traduzione FA qualcosa: un dizionario vuoto passerebbe
     «tutto tradotto» senza cambiare una lettera */
  att('passando all’inglese il testo cambia davvero', true, lingua.cambiati >= 100);
  att('tornando all’italiano il testo è identico a prima', 0, lingua.quantiNonTornati);
  lingua.nonTornati.forEach(x => console.log('      ! ' + String(x).slice(0, 60)));
  console.log('      (' + lingua.tradotti + '/' + lingua.totali + ' elementi, ' +
              lingua.cambiati + ' testi cambiati passando a «en»)');

  /* ── §3 · Le conversioni, contro fatti esterni ──────────────────────── */
  console.log('\n── I linguaggi delle molecole ──');
  const conv = await pg.evaluate(async (CHIAVI) => {
    function unaVolta(testo) {
      return new Promise(function (ris) {
        window.BSIMolLingue.converti(testo, { lingua: 'it' }, ris);
      });
    }
    const out = { chiavi: [], giro: [], formule: [], rifiuti: [] };
    for (const c of CHIAVI) {
      const r = await unaVolta(c[0]);
      out.chiavi.push({ nome: c[2], atteso: c[1], avuto: r.uscite.chiaveInchi || '(assente)' });
      /* il giro: SMILES → molfile → SMILES canonico */
      if (r.uscite.molfile) {
        const r2 = await unaVolta(r.uscite.molfile);
        out.giro.push({ nome: c[2], uguale: r2.uscite.smiles === r.uscite.smiles,
                        a: r.uscite.smiles, b: r2.uscite.smiles });
      }
    }
    /* la formula, su casi che si contano a mano */
    for (const p of [['CCO', 'C2H6O'], ['c1ccccc1', 'C6H6'],
                     ['CC(=O)Oc1ccccc1C(=O)O', 'C9H8O4'],
                     ['Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'C8H10N4O2']]) {
      const r = await unaVolta(p[0]);
      out.formule.push({ smi: p[0], atteso: p[1], avuto: r.uscite.formula || '(assente)' });
    }
    /* ciò che non si può convertire deve essere rifiutato, non inventato */
    for (const t of ['InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3',
                     'BSYNRYMUTXBXSQ-UHFFFAOYSA-N',
                     'questa non e una molecola']) {
      const r = await unaVolta(t);
      out.rifiuti.push({ t: t.slice(0, 32), errore: !!r.errore,
                         lingua: r.linguaRiconosciuta });
    }
    return out;
  }, CHIAVI);

  const chiaviSbagliate = conv.chiavi.filter(c => c.atteso !== c.avuto);
  att('ogni chiave InChI coincide con quella di letteratura', '',
      chiaviSbagliate.map(c => c.nome + ': ' + c.avuto).join(' | '));
  const giroRotto = conv.giro.filter(g => !g.uguale);
  att('SMILES → molfile → SMILES torna identico', '',
      giroRotto.map(g => g.nome + ': ' + g.a + ' ≠ ' + g.b).join(' | '));
  const formuleSbagliate = conv.formule.filter(f => f.atteso !== f.avuto);
  att('ogni formula è quella giusta', '',
      formuleSbagliate.map(f => f.smi + ': ' + f.avuto + ' invece di ' + f.atteso).join(' | '));
  att('InChI, chiave e testo libero vengono rifiutati, non inventati',
      3, conv.rifiuti.filter(r => r.errore).length);
  console.log('      (' + conv.chiavi.length + ' chiavi, ' + conv.giro.length +
              ' giri completi, ' + conv.formule.length + ' formule)');

  /* ── §4 · Il nominatore IUPAC ───────────────────────────────────────── */
  console.log('\n── Il nominatore IUPAC ──');
  const nomi = await pg.evaluate(async (dati) => {
    const NOMI = dati[0], RIFIUTI = dati[1];
    function grafo(smi) {
      return new Promise(function (ris) {
        window.BSIMolLingue.converti(smi, { lingua: 'it' }, function (r) {
          ris(r.uscite.molfile ? window.BSIMolLingue.grafoDaMolfile(r.uscite.molfile) : null);
        });
      });
    }
    const sbagliati = [], rifiutiMancati = [];
    for (const riga of NOMI) {
      const g = await grafo(riga[0]);
      if (!g) { sbagliati.push(riga[0] + ': niente grafo'); continue; }
      const it = window.BSIMolLingue.nominaDaGrafo(g, 'it');
      const en = window.BSIMolLingue.nominaDaGrafo(g, 'en');
      if (it.nome !== riga[1]) sbagliati.push(riga[0] + ' IT: «' + (it.nome || it.perche) +
                                              '» invece di «' + riga[1] + '»');
      if (en.nome !== riga[2]) sbagliati.push(riga[0] + ' EN: «' + (en.nome || en.perche) +
                                              '» invece di «' + riga[2] + '»');
    }
    for (const riga of RIFIUTI) {
      const g = await grafo(riga[0]);
      if (!g) continue;
      const r = window.BSIMolLingue.nominaDaGrafo(g, 'it');
      if (r.nome) rifiutiMancati.push(riga[0] + ' (' + riga[1] + ') nominata «' + r.nome + '»');
    }
    return { sbagliati: sbagliati, rifiutiMancati: rifiutiMancati,
             quanti: NOMI.length, quantiRifiuti: RIFIUTI.length };
  }, [NOMI, RIFIUTI]);

  att('ogni nome IUPAC coincide con quello scritto a mano, in due lingue', '',
      nomi.sbagliati.slice(0, 6).join(' | '));
  att('ogni molecola fuori classe viene RIFIUTATA', '',
      nomi.rifiutiMancati.join(' | '));
  console.log('      (' + nomi.quanti + ' nomi × 2 lingue · ' + nomi.quantiRifiuti +
              ' rifiuti attesi)');

  /* ── §5 · I pannelli si aprono e dicono i limiti ────────────────────── */
  console.log('\n── I pannelli ──');
  const pan = await pg.evaluate(async () => {
    window.bsiApriMolingue();
    await new Promise(r => setTimeout(r, 400));
    const corpo = document.getElementById('bsiLG-body');
    const testo = corpo ? corpo.textContent : '';
    const tab = [].map.call(document.querySelectorAll('.bsiLG-tab'), x => x.getAttribute('data-t'));
    /* la guida deve esserci davvero, non essere un titolo vuoto */
    document.querySelector('.bsiLG-tab[data-t="guida"]').click();
    await new Promise(r => setTimeout(r, 200));
    const guida = document.getElementById('bsiLG-guida');
    const tGuida = guida ? guida.textContent : '';
    document.getElementById('bsiLG-x').click();
    return { aperto: !!corpo, tab: tab, lunghezzaGuida: tGuida.length,
             parlaDiSmiles: /SMILES/.test(tGuida), parlaDiInchi: /InChI/.test(tGuida),
             parlaDiSmarts: /SMARTS/.test(tGuida), parlaDiIupac: /IUPAC/.test(tGuida),
             parlaDiMolfile: /molfile/i.test(tGuida),
             diceICosti: /non\s+(lo\s+)?(emette|nomina|si può|si pu)/i.test(tGuida) ||
                         /rifiuta/i.test(tGuida) };
  });
  att('il pannello dei linguaggi ha le sue quattro schede', 4, pan.tab.length);
  att('la guida è scritta, non annunciata', true, pan.lunghezzaGuida > 4000);
  att('la guida copre SMILES, IUPAC, InChI, SMARTS e molfile', true,
      pan.parlaDiSmiles && pan.parlaDiIupac && pan.parlaDiInchi && pan.parlaDiSmarts &&
      pan.parlaDiMolfile);
  /* Il punto d'onore di questa funzione: dichiarare ciò che NON sa fare. */
  att('e dichiara i limiti invece di tacerli', true, pan.diceICosti);
  console.log('      (' + pan.lunghezzaGuida + ' caratteri di guida)');

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 18) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 18');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
