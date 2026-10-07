/* ═══════════════════════════════════════════════════════════════════════════
   test_elucida — i conti che a mano si fanno sempre, verificati contro
                  compiti d'esame già corretti

   PERCHE' QUESTO BANCO ESISTE

   Un modulo che «aiuta a dedurre la struttura» è facilissimo da scrivere e
   impossibile da smentire: produce ragionamenti plausibili su qualunque dato.
   L'unico modo di sapere se serve è confrontarlo con casi di cui la risposta
   si conosce già.

   Qui i casi sono quesiti di «Metodi Fisici in Chimica Organica», con i conti
   che lo studente ha scritto a mano sul foglio: `IDI: 9−5+1 = 5`,
   `n°C = 9,9/100 × 100 / 1,1 = 9`. Quei numeri sono la verità contro cui si
   misura, e non sono opinabili.

   E c'è una prova che conta più delle altre: il confronto fra una struttura
   GIUSTA e una SBAGLIATA con la stessa formula. Se lo strumento le giudica
   uguali non serve a niente, per bene che ragioni.

   USO   node tools/banchi/test_elucida.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

/* I gradi di insaturazione scritti a mano in cima a ciascun compito. */
const IDI = [
  ['C9H10O2S',  5], ['C14H21NO3', 5], ['C13H17NO2', 6], ['C7H10O3',   3],
  ['C12H16O2',  5], ['C9H12N2O',  5], ['C9H10O2',   5], ['C8H9NO2',   5],
  ['C6H6',      4], ['C6H14',     0], ['C2H2',      2], ['C6H5Cl',    4]
];

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
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

  console.log('Elucidazione — i conti verificati contro compiti già corretti\n');

  const r = await pg.evaluate(async (IDI) => {
    await new Promise(res => window.bsiLoadRDKit(res));
    const E = window.BSIElucida;
    if (!E) return { assente: true };
    const out = {};

    out.idi = IDI.map(c => ({
      f: c[0], atteso: c[1],
      avuto: E.insaturazioni(E.leggiFormula(c[0]).conta)
    }));

    /* n°C dal picco M+1, come sul foglio:
       quesito «derivato aromatico»  M 151 (47,2) · M+1 152 (4,7) → 9
       quesito «sintetizzato in metanolo» M 165 (100) · M+1 166 (9,9) → 9 */
    out.nC = [
      { nome: 'M 151/152', c: E.carboniDaM1(47.2, 4.7, null), atteso: 9 },
      { nome: 'M 165/166', c: E.carboniDaM1(100.0, 9.9, null), atteso: 9 }
    ];
    /* e la correzione per gli eteroatomi: con un azoto il conto cala */
    out.nCconN = E.carboniDaM1(100.0, 9.9, { N: 1 });

    /* M+2 */
    out.m2 = {
      zolfo: E.eteroDaM2(100, 4.4),
      cloro: E.eteroDaM2(100, 32.5),
      bromo: E.eteroDaM2(100, 97.3),
      /* la guardia opposta: un M+2 piccolo NON deve far inventare un alogeno */
      niente: E.eteroDaM2(100, 0.4)
    };

    /* perdite neutre sul 4-amminobenzoato di metile: 151 → 120 è −31, OCH₃ */
    const perd = E.perditeFra([{ mz: 151, i: 47.2 }, { mz: 120, i: 100 },
                               { mz: 92, i: 32.2 }, { mz: 65, i: 23.4 }]);
    out.perdite = perd.map(p => p.da + '→' + p.a + ' ' + p.frammento);
    out.haOCH3 = perd.some(p => p.delta === 31 && /OCH/.test(p.frammento));
    out.haCO = perd.some(p => p.delta === 28);

    /* il dossier completo su un quesito */
    out.dossier = E.dossier({
      formula: 'C₉H₁₀O₂S',
      ms: '182 78\n181 10\n135 100\n134 48.8\n107 28.3\n106 65.1\n79 74.9\n77 83.3',
      c13: '192.04 150.77 146.05 135.55 135.05 118.55 112.97 26.67 15.72',
      h1: '9.52 1 d\n7.65 1 s\n7.04 1 d\n6.59 1 d\n6.43 1 dd\n3.76 2 s\n2.09 3 s'
    });

    /* il confronto fra una struttura giusta e una sbagliata con la STESSA
       formula: è la prova che conta */
    const coppie = [
      { nome: '2-etossibenzaldeide', g: 'CCOc1ccccc1C=O', s: 'CCOc1ccc(C=O)cc1',
        d: { formula: 'C9H10O2',
             c13: '190.1 161.5 136.0 128.3 124.9 120.6 112.6 64.2 14.7' } },
      { nome: '4-amminobenzoato di metile', g: 'COC(=O)c1ccc(N)cc1', s: 'COC(=O)c1ccccc1N',
        d: { formula: 'C8H9NO2', c13: '167.0 151.0 131.6 119.8 113.8 51.6' } }
    ];
    out.confronti = coppie.map(c => {
      const G = E.confronta(c.g, c.d), S = E.confronta(c.s, c.d);
      return { nome: c.nome, giusta: G.punteggio, sbagliata: S.punteggio,
               fiduciaG: G.fiducia,
               orfaniG: G.c13 ? G.c13.orfaniOsservati.length : null,
               orfaniS: S.c13 ? S.c13.orfaniOsservati.length : null };
    });

    /* il caso che il predittore NON sa trattare, e che deve DIRE di non
       sapere trattare invece di far scartare la struttura giusta */
    const fur = E.confronta('O=CC(=Cc1ccco1)CSC',
      { formula: 'C9H10O2S',
        c13: '192.04 150.77 146.05 135.55 135.05 118.55 112.97 26.67 15.72' });
    out.furano = { punteggio: fur.punteggio, fiducia: fur.fiducia,
                   motivi: (fur.perche || []).length, formula: fur.formulaCoincide };

    /* i rifiuti */
    out.rifiuti = {
      smilesRotto: E.confronta('non e uno smiles', { formula: 'C6H6', c13: '128.5' }).errore ? 'errore' : 'nessuno',
      formulaVuota: E.leggiFormula('') === null ? 'null' : 'oggetto',
      formulaIgnota: E.leggiFormula('C6Xy2').ignoti.join(',')
    };
    return out;
  }, IDI);

  if (r.assente) { console.log('  ✗ BSIElucida non è caricato'); process.exit(1); }

  console.log('── Gradi di insaturazione ──');
  let idiKo = 0;
  r.idi.forEach(function (x) {
    if (x.avuto !== x.atteso) { idiKo++; console.log('      ✗ ' + x.f + ': ' + x.avuto + ', atteso ' + x.atteso); }
  });
  att('ogni formula dà l’IDI scritto a mano sul compito', 0, idiKo);
  console.log('      (' + r.idi.map(x => x.f + '=' + x.avuto).join(' · ') + ')');

  console.log('\n── Numero di carboni dal picco M+1 ──');
  r.nC.forEach(function (x) {
    att(x.nome + ' dà ' + x.atteso + ' carboni', x.atteso, x.c.nC);
  });
  /* Due versi: con un azoto nella formula la correzione abbassa il conto.
     Si confronta il valore GREZZO e non quello arrotondato: la correzione
     per un solo azoto vale 0,37 %, cioè 9,0 → 8,7 carboni, che arrotonda
     ancora a 9. Guardando l'intero il controllo passava a vuoto. */
  att('con un azoto la correzione abbassa il conto', true, r.nCconN.nCgrezzo < 9);
  att('  · ma non tanto da cambiare l\u2019intero, con un solo azoto', 9, r.nCconN.nC);
  console.log('      (senza N: 9,0 · con N: ' + r.nCconN.nCgrezzo +
              ', correzione ' + r.nCconN.correzione + ' %)');

  console.log('\n── Eteroatomi dal picco M+2 ──');
  att('4,4 % → zolfo', 'S', r.m2.zolfo.elemento);
  att('32,5 % → cloro', 'Cl', r.m2.cloro.elemento);
  att('97,3 % → bromo', 'Br', r.m2.bromo.elemento);
  /* la guardia opposta: senza M+2 non si inventa un alogeno */
  att('0,4 % → nessun eteroatomo inventato', null, r.m2.niente.elemento);

  console.log('\n── Perdite neutre ──');
  att('151 → 120 è riconosciuta come perdita di OCH₃', true, r.haOCH3);
  att('e 120 → 92 come perdita di CO', true, r.haCO);
  console.log('      (' + r.perdite.slice(0, 5).join(' · ') + ')');

  console.log('\n── Il dossier ──');
  const d = r.dossier;
  att('l’IDI è fra le deduzioni', 5, d.idi);
  att('e i segnali ¹³C sono contati', 9, (d.c13 || []).length);
  att('le integrazioni ¹H sommano i protoni della formula', 10, d.protoniTotali);
  att('ogni deduzione porta la propria prova', true,
      (d.deduzioni || []).length > 0 &&
      (d.deduzioni || []).every(x => !!x.prova && !!x.certezza));
  att('e le supposizioni sono tenute separate dalle deduzioni', true,
      Array.isArray(d.supposizioni) && d.supposizioni.length > 0 &&
      d.supposizioni.every(x => !!x.perche));
  console.log('      (' + (d.deduzioni || []).length + ' deduzioni · ' +
              (d.supposizioni || []).length + ' supposizioni · ' +
              (d.avvisi || []).length + ' avvisi)');

  console.log('\n── Il confronto fra una struttura giusta e una sbagliata ──');
  r.confronti.forEach(function (c) {
    att(c.nome + ': la giusta batte la sbagliata', true, c.giusta > c.sbagliata);
    console.log('      (giusta ' + c.giusta + ' pt, orfani ' + c.orfaniG +
                ' · sbagliata ' + c.sbagliata + ' pt, orfani ' + c.orfaniS + ')');
    att('  · e la giusta non lascia segnali senza carbonio', 0, c.orfaniG);
  });

  console.log('\n── Il caso che il predittore non sa trattare ──');
  /* Qui la struttura è GIUSTA e il punteggio è basso, perché il predittore
     non ha incrementi di posizione per gli eteroaromatici sostituiti. Lo
     strumento deve DIRLO: un punteggio basso senza spiegazione farebbe
     scartare la risposta corretta. */
  att('la formula della struttura giusta coincide', true, r.furano.formula);
  att('il punteggio è basso', true, r.furano.punteggio < 70);
  att('ma la fiducia è dichiarata BASSA', 'bassa', r.furano.fiducia);
  att('  · con il motivo scritto', true, r.furano.motivi > 0);

  console.log('\n── I rifiuti ──');
  att('uno SMILES illeggibile non produce un confronto', 'errore', r.rifiuti.smilesRotto);
  att('una formula vuota non produce una formula', 'null', r.rifiuti.formulaVuota);
  att('e un simbolo inventato viene segnalato', 'Xy', r.rifiuti.formulaIgnota);

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('      ! ' + e.slice(0, 150)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 25) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 25');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
