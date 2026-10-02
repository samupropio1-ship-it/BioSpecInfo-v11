#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   IL BANCO DI LAVORO CHEMIOINFORMATICO — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   `bsi-cheminfo.js` calcola similarita', raggruppa molecole, costruisce
   modelli QSAR e ne dichiara la validita'. Sono tutti numeri che NESSUNO
   guardando lo schermo puo' contraddire: un Tanimoto sbagliato del dieci per
   cento ha lo stesso aspetto di uno giusto, e un R² gonfiato e' anzi piu'
   convincente di uno onesto.

   Per questo ogni formula qui e' confrontata con un valore CALCOLABILE A
   MANO, non con se stessa.

   LA PROVA CHE CONTA PIU' DELLE ALTRE
   Il modulo promette di riconoscere un modello che non vale niente
   (y-scrambling, §9). Quella promessa si verifica in DUE versi:

     · su un segnale imparabile, il modello deve battere i suoi sosia
       casuali — altrimenti la guardia e' troppo severa e boccia tutto;
     · su etichette gia' casuali in partenza, NON deve batterli —
       altrimenti la guardia non guarda niente, e un modello inventato
       passerebbe con la faccia di uno vero.

   Una guardia provata in un verso solo e' meta' guardia. Il caso peggiore
   e' il secondo: e' silenzioso.

   USO   node tools/banchi/test_cheminfo.js     (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════ */
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
function vicino(d, atteso, avuto, tol){
  eseguiti++;
  tol = tol === undefined ? 1e-6 : tol;
  if (avuto !== null && avuto !== undefined && Math.abs(avuto - atteso) <= tol) {
    ok++; console.log('  ✓ ' + d + '  → ' + (+avuto).toFixed(6));
  } else {
    ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ±' + tol + '\n      avuto:  ' + avuto);
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const erroriJs = [];
  pg.on('pageerror', e => erroriJs.push(e.message));

  await pg.goto(BASE + 'rdkit_lab.html', { waitUntil: 'load', timeout: 60000 });
  /* Il modulo vive nella pagina principale: qui lo si inietta sulla pagina
     che ha gia' RDKit caricato, cosi' il banco prova IL FILE, non una copia. */
  await pg.addScriptTag({ url: BASE + 'bsi-cheminfo.js' });
  await pg.waitForFunction(() => window.BSIChem && (window.RDKit || window.RDKitModule), { timeout: 90000 });
  await pg.waitForTimeout(1500);

  console.log('Banco di lavoro chemioinformatico\n');
  console.log('  RDKit ' + await pg.evaluate(() => window.BSIChem.versioneRDKit()) + '\n');

  /* ── §1 · Similarita': valori calcolabili a mano ───────────────────── */
  console.log('── Similarita\' ──');
  const sim = await pg.evaluate(() => {
    /* Si costruiscono due fingerprint a mano, senza passare da RDKit:
       A = {0,1,2}, B = {1,2,3}. In comune 2, unione 4.
       Tanimoto = 2/4 = 0,5   ·   Dice = 2·2/(3+3) = 0,666… */
    function fp(bits, n){
      const parole = new Uint32Array((n + 31) >> 5);
      bits.forEach(b => parole[b >> 5] |= (1 << (b & 31)));
      return { parole, nBits: n, accesi: bits.length };
    }
    const A = fp([0,1,2], 64), B = fp([1,2,3], 64);
    const vuotoA = fp([], 64), vuotoB = fp([], 64);
    const C = fp([0,1,2], 64);
    return {
      tanimoto: window.BSIChem.tanimoto(A, B),
      dice: window.BSIChem.dice(A, B),
      identici: window.BSIChem.tanimoto(A, C),
      disgiunti: window.BSIChem.tanimoto(fp([0,1],64), fp([2,3],64)),
      dueVuoti: window.BSIChem.tanimoto(vuotoA, vuotoB)
    };
  });
  vicino('Tanimoto({0,1,2},{1,2,3}) = 2/4', 0.5, sim.tanimoto);
  vicino('Dice({0,1,2},{1,2,3}) = 4/6', 2/3, sim.dice, 1e-9);
  vicino('Tanimoto di due fingerprint identici', 1, sim.identici);
  vicino('Tanimoto di due fingerprint disgiunti', 0, sim.disgiunti);
  vicino('Tanimoto di due fingerprint VUOTI (0/0 → 1, come RDKit)', 1, sim.dueVuoti);

  /* ── §2 · ROC-AUC, compresi i pari-merito ─────────────────────────── */
  console.log('\n── Metriche ──');
  const met = await pg.evaluate(() => {
    const B = window.BSIChem;
    return {
      perfetta: B.rocAuc([1,1,0,0], [0.9,0.8,0.4,0.3]),
      /* etichette [1,0,1,0], punteggi [4,3,2,1]: i positivi hanno rango 4 e 2,
         somma 6; AUC = (6 − 2·3/2)/(2·2) = 0,75 */
      parziale: B.rocAuc([1,0,1,0], [4,3,2,1]),
      invertita: B.rocAuc([1,1,0,0], [0.1,0.2,0.8,0.9]),
      /* tutti i punteggi uguali: un modello che non distingue niente deve
         valere 0,5. Senza mediare i ranghi dei pari-merito darebbe 1. */
      tuttiUguali: B.rocAuc([1,0,1,0], [5,5,5,5]),
      /* una sola classe: l'AUC non e' definita, e si deve dire */
      unaClasse: B.rocAuc([1,1,1,1], [4,3,2,1]),
      r2perfetto: B.metricheRegressione([1,2,3,4],[1,2,3,4]).r2,
      /* previsione costante pari alla media: R² = 0 per definizione */
      r2nullo: B.metricheRegressione([1,2,3,4],[2.5,2.5,2.5,2.5]).r2,
      rmse: B.metricheRegressione([1,2,3],[2,3,4]).rmse,
      pearson: B.pearson([1,2,3,4],[2,4,6,8]),
      /* matrice 2×2 con tp=2 tn=2 fp=1 fn=1:
         MCC = (4−1)/√(3·3·3·3) = 3/9 = 0,333… */
      mcc: B.metricheClassificazione([1,1,0,0,1,0],[1,1,0,0,0,1],0.5).mcc
    };
  });
  vicino('ROC-AUC di un ordinamento perfetto', 1, met.perfetta);
  vicino('ROC-AUC di [1,0,1,0] con punteggi [4,3,2,1]', 0.75, met.parziale);
  vicino('ROC-AUC di un ordinamento invertito', 0, met.invertita);
  vicino('ROC-AUC con TUTTI i punteggi uguali (pari-merito mediati)', 0.5, met.tuttiUguali);
  att('ROC-AUC con una sola classe: non definita, non inventata', 'null', String(met.unaClasse));
  vicino('R² di una previsione perfetta', 1, met.r2perfetto);
  vicino('R² di una previsione costante pari alla media', 0, met.r2nullo);
  vicino('RMSE con errore costante di 1', 1, met.rmse);
  vicino('Pearson di due serie in proporzione esatta', 1, met.pearson);
  vicino('MCC con tp=2 tn=2 fp=1 fn=1 → 3/9', 1/3, met.mcc, 1e-9);

  /* ── §3 · Algebra ─────────────────────────────────────────────────── */
  console.log('\n── Algebra lineare ──');
  const alg = await pg.evaluate(() => {
    const B = window.BSIChem;
    /* [[2,1],[1,2]] ha autovalori 3 e 1 — si verificano a mano:
       det([[2−λ,1],[1,2−λ]]) = (2−λ)² − 1 = 0 → λ = 3, 1 */
    const e = B.jacobi([[2,1],[1,2]]);
    /* diagonale: gli autovalori SONO la diagonale */
    const d = B.jacobi([[5,0,0],[0,3,0],[0,0,1]]);
    /* sistema 2×2 con λ=0: [[2,0],[0,4]] x = [2,8] → x = [1,2] */
    const x = B.risolvi([[2,0],[0,4]], [2,8], 0);
    /* con regolarizzazione λ=1: [[3,0],[0,5]] x = [3,10] → x = [1,2] */
    const xr = B.risolvi([[2,0],[0,4]], [3,10], 1);
    return {
      lam1: e[0].val, lam2: e[1].val,
      diag: d.map(v => v.val),
      x0: x[0], x1: x[1], xr0: xr[0], xr1: xr[1]
    };
  });
  vicino('Jacobi: autovalore maggiore di [[2,1],[1,2]]', 3, alg.lam1, 1e-9);
  vicino('Jacobi: autovalore minore di [[2,1],[1,2]]', 1, alg.lam2, 1e-9);
  att('Jacobi su matrice diagonale restituisce la diagonale ordinata', '5,3,1', alg.diag.map(v => Math.round(v)).join(','));
  vicino('Sistema lineare, prima incognita', 1, alg.x0, 1e-9);
  vicino('Sistema lineare, seconda incognita', 2, alg.x1, 1e-9);
  vicino('Sistema regolarizzato (λ=1), prima incognita', 1, alg.xr0, 1e-9);
  vicino('Sistema regolarizzato (λ=1), seconda incognita', 2, alg.xr1, 1e-9);

  /* ── §4 · Standardizzazione ───────────────────────────────────────── */
  console.log('\n── Standardizzazione ──');
  const std = await pg.evaluate(() => {
    const B = window.BSIChem;
    const r = B.standardizza([
      { smiles: 'CC(=O)Oc1ccccc1C(=O)O', nome: 'aspirina' },
      { smiles: 'OC(=O)c1ccccc1OC(C)=O', nome: 'aspirina scritta al contrario' },  // stessa molecola
      { smiles: 'CC(=O)[O-].[Na+]', nome: 'acetato di sodio' },                    // sale
      { smiles: 'questo non e uno smiles', nome: 'spazzatura' },
      { smiles: 'c1ccccc1', nome: 'benzene', attivita: '5.2' },
      { smiles: 'CCO', nome: 'etanolo', attivita: 'non-un-numero' }
    ]);
    return {
      accettate: r.molecole.length,
      scartate: r.scartate.length,
      motivi: r.scartate.map(s => s.motivo.split(':')[0].split('(')[0].trim()),
      saleRidotto: r.molecole.filter(m => m.nome === 'acetato di sodio').map(m => m.smiles)[0],
      attivitaLetta: r.molecole.filter(m => m.nome === 'benzene').map(m => m.attivita)[0]
    };
  });
  att('molecole accettate', 3, std.accettate);
  att('righe scartate', 3, std.scartate);
  att('il duplicato scritto in modo diverso viene riconosciuto', true, std.motivi.some(m => /duplicato/.test(m)));
  att('lo SMILES non interpretabile viene scartato', true, std.motivi.some(m => /non interpretabile/.test(m)));
  att('l\'attivita\' non numerica viene scartata', true, std.motivi.some(m => /non numerica/.test(m)));
  att('il controione del sale viene tolto', true, std.saleRidotto !== undefined && std.saleRidotto.indexOf('Na') === -1);
  vicino('l\'attivita\' numerica viene letta', 5.2, std.attivitaLetta, 1e-9);

  /* ── §5 · Fingerprint e scaffold su molecole vere ─────────────────── */
  console.log('\n── Fingerprint e scaffold ──');
  const chem = await pg.evaluate(() => {
    const B = window.BSIChem;
    const asp = B.fingerprint('CC(=O)Oc1ccccc1C(=O)O', 'morgan');
    const sal = B.fingerprint('OC(=O)c1ccccc1O', 'morgan');          // acido salicilico
    const caf = B.fingerprint('Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'morgan'); // caffeina
    const maccs = B.fingerprint('CC(=O)Oc1ccccc1C(=O)O', 'maccs');
    /* due benzeni sostituiti in modo diverso devono avere lo STESSO
       scheletro; il naftalene no. */
    const s1 = B.scaffoldMurcko('CC(=O)Oc1ccccc1C(=O)O');
    const s2 = B.scaffoldMurcko('CCCCc1ccccc1CC');
    const s3 = B.scaffoldMurcko('c1ccc2ccccc2c1');
    const s4 = B.scaffoldMurcko('CCCCCC');                            // aciclica
    return {
      nBits: asp.nBits, accesi: asp.accesi,
      maccsBits: maccs.nBits,
      simAspSal: B.tanimoto(asp, sal),
      simAspCaf: B.tanimoto(asp, caf),
      benzene1: s1 && s1.smiles, benzene2: s2 && s2.smiles,
      naftalene: s3 && s3.smiles,
      aciclica: s4 && s4.aciclica
    };
  });
  att('il fingerprint Morgan ha 2048 bit', 2048, chem.nBits);
  att('il fingerprint di una molecola vera ha dei bit accesi', true, chem.accesi > 10);
  att('MACCS ha 167 posizioni (166 chiavi piu\' lo zero)', 167, chem.maccsBits);
  att('aspirina e acido salicilico sono piu\' simili di aspirina e caffeina',
      true, chem.simAspSal > chem.simAspCaf);
  att('due benzeni sostituiti diversamente hanno lo STESSO scheletro',
      true, chem.benzene1 === chem.benzene2 && !!chem.benzene1);
  att('il naftalene ha uno scheletro DIVERSO dal benzene',
      true, chem.naftalene !== chem.benzene1);
  att('una molecola aciclica e\' dichiarata tale, non le si inventa uno scheletro',
      true, chem.aciclica === true);

  /* ── §6 · Raggruppamento e diversita' ─────────────────────────────── */
  console.log('\n── Raggruppamento ──');
  const grp = await pg.evaluate(() => {
    const B = window.BSIChem;
    function fp(bits, n){
      const parole = new Uint32Array((n + 31) >> 5);
      bits.forEach(b => parole[b >> 5] |= (1 << (b & 31)));
      return { parole, nBits: n, accesi: bits.length };
    }
    /* Due grappoli costruiti a mano: {A,B,C} quasi identici fra loro,
       {D,E} quasi identici fra loro, e nulla in comune fra i grappoli.
       Con soglia 0,5 devono uscire esattamente due gruppi. */
    const fps = [
      fp([0,1,2,3], 64), fp([0,1,2,4], 64), fp([0,1,2,5], 64),
      fp([30,31,32,33], 64), fp([30,31,32,34], 64)
    ];
    const bu = B.butina(fps, 0.5);
    const mm = B.maxmin(fps, 2);
    const mm2 = B.maxmin(fps, 2);
    return {
      nGruppi: bu.gruppi.length,
      dimensioni: bu.gruppi.map(g => g.membri.length).sort((a,b)=>b-a),
      maxmin: mm,
      riproducibile: JSON.stringify(mm) === JSON.stringify(mm2)
    };
  });
  att('Butina trova due grappoli su dati costruiti con due grappoli', 2, grp.nGruppi);
  att('i grappoli hanno le dimensioni attese', '3,2', grp.dimensioni.join(','));
  att('MaxMin sceglie due molecole di grappoli diversi', true,
      grp.maxmin.length === 2 && (grp.maxmin[0] < 3) !== (grp.maxmin[1] < 3));
  att('MaxMin e\' riproducibile: due esecuzioni danno lo stesso insieme', true, grp.riproducibile);

  /* ── §7 · Allarmi strutturali ─────────────────────────────────────── */
  console.log('\n── Allarmi strutturali ──');
  const all = await pg.evaluate(() => {
    const B = window.BSIChem;
    const catecolo = B.allarmi('Oc1ccc(CCN)cc1O');       // dopamina: catecolo
    const pulita = B.allarmi('CC(=O)Oc1ccccc1C(=O)O');   // aspirina: nessun allarme atteso
    const epossido = B.allarmi('C1OC1CCC');
    return {
      catecolo: catecolo.allarmi.map(a => a.id),
      aspirina: pulita.allarmi.map(a => a.id),
      epossido: epossido.allarmi.map(a => a.id),
      esaminati: pulita.esaminati
    };
  });
  att('la dopamina fa scattare l\'allarme catecolo', true, all.catecolo.indexOf('catecolo') !== -1);
  att('l\'epossido viene riconosciuto', true, all.epossido.indexOf('epossido') !== -1);
  att('l\'aspirina non fa scattare allarmi', 0, all.aspirina.length);
  att('gli allarmi esaminati sono tutti quelli in elenco', true, all.esaminati >= 16);

  /* ── §8 · PCA ─────────────────────────────────────────────────────── */
  console.log('\n── PCA ──');
  const p = await pg.evaluate(() => {
    const B = window.BSIChem;
    function fp(bits, n){
      const parole = new Uint32Array((n + 31) >> 5);
      bits.forEach(b => parole[b >> 5] |= (1 << (b & 31)));
      return { parole, nBits: n, accesi: bits.length };
    }
    /* Due gruppi ben separati: la prima componente deve spiegare quasi
       tutta la varianza, e i due gruppi devono stare da parti opposte. */
    const fps = [
      fp([0,1,2,3,4], 64), fp([0,1,2,3,5], 64),
      fp([40,41,42,43,44], 64), fp([40,41,42,43,45], 64)
    ];
    const r = B.pca(fps, 2);
    const x = r.punti.map(q => q[0]);
    return {
      nPunti: r.punti.length,
      pc1: r.varianzaSpiegata[0],
      sommaVar: r.varianzaSpiegata.reduce((a,b)=>a+b,0),
      separati: Math.sign(x[0]) === Math.sign(x[1]) && Math.sign(x[2]) === Math.sign(x[3])
                && Math.sign(x[0]) !== Math.sign(x[2])
    };
  });
  att('la PCA restituisce un punto per molecola', 4, p.nPunti);
  att('la prima componente spiega la maggior parte della varianza', true, p.pc1 > 0.7);
  att('le frazioni di varianza non superano 1', true, p.sommaVar <= 1.0000001);
  att('i due gruppi finiscono da parti opposte sulla prima componente', true, p.separati);

  /* ── §9 · LA PROVA CHE CONTA: il controllo nullo, in DUE versi ────── */
  console.log('\n── Il modello, e il suo controllo nullo ──');
  const mod = await pg.evaluate(() => {
    const B = window.BSIChem;
    /* Insieme con un segnale VERO e imparabile: l'attivita' cresce con il
       numero di atomi di carbonio della catena. E' chimica finta, ma e' un
       segnale reale nei dati, ed e' esattamente cio' che un modello deve
       saper trovare. */
    const imparabile = [];
    for (let n = 1; n <= 14; n++) {
      imparabile.push({ smiles: 'C'.repeat(n) + 'O', nome: 'alcol-C' + n, attivita: n * 0.5 });
      imparabile.push({ smiles: 'C'.repeat(n) + 'N', nome: 'ammina-C' + n, attivita: n * 0.5 + 0.2 });
    }
    /* Lo stesso insieme, ma con attivita' assegnate a caso: qui NON c'e'
       niente da imparare, e il modello non deve poter dire il contrario. */
    const r = (function(){ let a = 7; return function(){ a=(a*1103515245+12345)&0x7fffffff; return a/0x7fffffff; }; })();
    const casuale = imparabile.map(m => ({ smiles: m.smiles, nome: m.nome, attivita: r() * 7 }));

    const mVero = B.costruisciModello(imparabile, { divisione: 'casuale', scramble: 8, seme: 3 });
    const mFinto = B.costruisciModello(casuale,   { divisione: 'casuale', scramble: 8, seme: 3 });

    /* e la divisione per scaffold deve funzionare e dare numeri piu' bassi
       o uguali — mai per costruzione piu' alti in modo sistematico */
    const mScaf = B.costruisciModello(imparabile, { divisione: 'scaffold', scramble: 4, seme: 3 });

    return {
      tipoVero: mVero.tipo,
      r2Vero: mVero.metriche.r2,
      superaVero: mVero.controlloNullo.superaIlCaso,
      margineVero: mVero.controlloNullo.margine,
      ripetizioni: mVero.controlloNullo.ripetizioni,
      r2Finto: mFinto.metriche.r2,
      superaFinto: mFinto.controlloNullo.superaIlCaso,
      nTot: mVero.nTotali, nTr: mVero.nAddestramento, nTe: mVero.nProva,
      scafOk: mScaf.nProva > 0 && mScaf.nAddestramento > 0,
      nScaffold: mScaf.nScaffold
    };
  });
  att('il tipo di problema viene dedotto dai dati', 'regressione', mod.tipoVero);
  att('addestramento e prova coprono tutte le molecole', mod.nTot, mod.nTr + mod.nTe);
  att('il controllo nullo viene ripetuto piu\' volte', 8, mod.ripetizioni);
  att('su un segnale VERO il modello batte tutti i suoi sosia casuali', true, mod.superaVero);
  att('su etichette CASUALI il modello NON batte i suoi sosia', false, mod.superaFinto);
  att('la divisione per scaffold produce due insiemi non vuoti', true, mod.scafOk);
  att('la divisione per scaffold conta i gruppi', true, mod.nScaffold >= 1);
  console.log('      R² sul segnale vero: ' + mod.r2Vero.toFixed(3) +
              '   ·   su etichette casuali: ' + mod.r2Finto.toFixed(3) +
              '   ·   margine sul caso: ' + (mod.margineVero === null ? 'n/d' : mod.margineVero.toFixed(3)));

  /* ── §10 · Salti di attivita' ─────────────────────────────────────── */
  console.log('\n── Salti di attivita\' ──');
  const cliff = await pg.evaluate(() => {
    const B = window.BSIChem;
    /* Due molecole quasi identiche con attivita' molto diversa: e' un salto.
       Una terza, diversa da entrambe, non deve comparire in coppia con loro. */
    const set = [
      { smiles: 'c1ccccc1CCO',  nome: 'A', attivita: 8.0 },
      { smiles: 'c1ccccc1CCN',  nome: 'B', attivita: 4.0 },
      { smiles: 'CCCCCCCCCCCC', nome: 'C', attivita: 6.0 }
    ];
    const s = B.saltiAttivita(set, { sogliaSimilarita: 0.3, sogliaDelta: 1.0 });
    return {
      n: s.length,
      primaCoppia: s.length ? [s[0].a.nome, s[0].b.nome].sort().join('') : '',
      saliPositivo: s.length ? s[0].sali > 0 : false
    };
  });
  att('il salto fra le due molecole simili viene trovato', true, cliff.n >= 1);
  att('la coppia trovata e\' quella attesa', 'AB', cliff.primaCoppia);
  att('l\'indice SALI e\' positivo', true, cliff.saliPositivo);

  /* ── §10-bis · Validazione incrociata raggruppata per scaffold ─────
     Due promesse da verificare, e la seconda e' quella che conta:
       · le pieghe coprono tutte le molecole una volta sola;
       · NESSUNO SCHELETRO sta in due pieghe diverse. Se stesse, la
         validazione sarebbe un k-fold ordinario con un nome piu' bello, e
         l'analogo della stessa serie predirebbe se stesso. */
  console.log('\n── Validazione incrociata per scheletro ──');
  const cv = await pg.evaluate(() => {
    const B = window.BSIChem;
    /* Sei serie chimiche distinte, tre membri ciascuna: diciotto molecole con
       diciotto scheletri? No — i membri di una serie CONDIVIDONO lo
       scheletro. E' esattamente il caso in cui un k-fold ordinario bara. */
    const nuclei = ['c1ccccc1', 'c1ccncc1', 'c1ccc2ccccc2c1', 'C1CCCCC1',
                    'c1cc[nH]c1', 'c1ccoc1'];
    const set = [];
    nuclei.forEach((nu, i) => {
      ['CC', 'CCC', 'CCCC'].forEach((coda, j) => {
        set.push({ smiles: nu + coda, nome: 'S' + i + '-' + j, attivita: 4 + i * 0.7 + j * 0.1 });
      });
    });

    const p = B.pieghePerScaffold(set, 3, 42);
    /* copertura: ogni indice una volta sola */
    const tutti = [].concat.apply([], p.pieghe).sort((a, b) => a - b);
    const attesi = set.map((_, i) => i);
    const copertura = JSON.stringify(tutti) === JSON.stringify(attesi);

    /* nessuno scheletro condiviso fra due pieghe */
    const scafDiPiega = p.pieghe.map(g => new Set(g.map(i => set[i]._scaffold || ('ac' + i))));
    let condivisi = 0;
    for (let a = 0; a < scafDiPiega.length; a++) {
      for (let b = a + 1; b < scafDiPiega.length; b++) {
        scafDiPiega[a].forEach(s => { if (scafDiPiega[b].has(s)) condivisi++; });
      }
    }

    /* riproducibilita': stesso seme, stesse pieghe */
    const p2 = B.pieghePerScaffold(set.map(m => ({ smiles: m.smiles, nome: m.nome, attivita: m.attivita })), 3, 42);
    const uguali = JSON.stringify(p.pieghe) === JSON.stringify(p2.pieghe);

    const v = B.validazioneIncrociata(set, { pieghe: 3, seme: 42 });
    return {
      copertura, condivisi, uguali,
      nPieghe: p.nPieghe, nGruppi: p.nGruppi,
      pieghe: v.pieghe, saltate: v.pieghieSaltate,
      perPiegaN: v.perPiega.length,
      previstiCompleti: v.previsti.filter(x => x !== undefined).length,
      mediaFinita: typeof v.media === 'number' && isFinite(v.media),
      scartoFinito: typeof v.scarto === 'number' && isFinite(v.scarto),
      metrica: v.metrica,
      riunitoFinito: typeof v.riunito.r2 === 'number' && isFinite(v.riunito.r2)
    };
  });
  att('le pieghe coprono ogni molecola una volta sola', true, cv.copertura);
  att('nessuno scheletro sta in due pieghe', 0, cv.condivisi);
  att('con lo stesso seme le pieghe sono le stesse', true, cv.uguali);
  att('i gruppi trovati sono i sei nuclei', 6, cv.nGruppi);
  att('le pieghe chieste sono tre', 3, cv.nPieghe);
  att('tutte le pieghe sono utilizzabili', 0, cv.saltate);
  att('ogni molecola ha una predizione fuori piega', 18, cv.previstiCompleti);
  att('la media fra le pieghe e\' un numero', true, cv.mediaFinita);
  att('la deviazione fra le pieghe e\' un numero', true, cv.scartoFinito);
  att('la metrica di regressione e\' r2', 'r2', cv.metrica);
  att('il punteggio sulle predizioni riunite e\' un numero', true, cv.riunitoFinito);

  /* La media e lo scarto si verificano su valori calcolabili a mano, non
     sul risultato del modello: cosi' un errore nella formula si vede. */
  const ms = await pg.evaluate(() => {
    const B = window.BSIChem;
    const a = B.mediaEScarto([2, 4, 4, 4, 5, 5, 7, 9]);
    const b = B.mediaEScarto([3]);
    const c = B.mediaEScarto([]);
    return { media: a.media, scarto: a.scarto, n: a.n,
             unoSolo: b.scarto, vuotoMedia: c.media, vuotoN: c.n };
  });
  vicino('media di [2,4,4,4,5,5,7,9]', 5, ms.media, 1e-9);
  /* deviazione CAMPIONARIA (n−1): 32/7 = 4,571428…, radice 2,13809… */
  vicino('deviazione campionaria dello stesso insieme', Math.sqrt(32 / 7), ms.scarto, 1e-9);
  att('un valore solo non ha deviazione', 'null', String(ms.unoSolo));
  att('un insieme vuoto non ha media', 'null', String(ms.vuotoMedia));
  att('un insieme vuoto conta zero valori', 0, ms.vuotoN);

  /* ── §10-ter · Esportazione ────────────────────────────────────────
     Un CSV sbagliato e' peggio di nessun CSV: chi lo apre non vede l'errore,
     lo importa. Le due trappole sono il nome che contiene una virgola e la
     colonna che manca. */
  console.log('\n── Esportazione ──');
  const exp = await pg.evaluate(() => {
    const B = window.BSIChem;
    const set = [
      { smiles: 'CC(=O)Oc1ccccc1C(=O)O', originale: 'CC(=O)Oc1ccccc1C(=O)O',
        nome: 'aspirina, acido', attivita: 4.2 },
      { smiles: 'CCO', originale: 'CCO', nome: 'etanolo' }
    ];
    const csv = B.esportaCsv(set, { previsto: [4.0, undefined], allarmi: true, gruppo: [1, 2] });
    const righe = csv.trim().split('\n');
    const intest = righe[0].split(',');
    return {
      righe: righe.length,
      colonne: intest.length,
      colonneUguali: righe.every(r => {
        /* conta i separatori fuori dalle virgolette */
        let n = 1, dentro = false;
        for (const ch of r) { if (ch === '"') dentro = !dentro; else if (ch === ',' && !dentro) n++; }
        return n === intest.length;
      }),
      nomeCitato: /"aspirina, acido"/.test(csv),
      haPrevisto: intest.indexOf('previsto') !== -1,
      haResiduo: intest.indexOf('residuo') !== -1,
      haScaffold: intest.indexOf('scaffold') !== -1,
      haQed: intest.indexOf('qed') !== -1,
      residuoAspirina: righe[1].split(',').slice(-1)[0],
      attivitaVuotaEtanolo: righe[2].split(',')[3] === '',
      finisceConNuovaRiga: csv.slice(-1) === '\n'
    };
  });
  att('il CSV ha una riga per molecola più l\'intestazione', 3, exp.righe);
  att('ogni riga ha lo stesso numero di colonne dell\'intestazione', true, exp.colonneUguali);
  att('un nome con la virgola viene citato', true, exp.nomeCitato);
  att('la colonna dello scaffold c\'e\'', true, exp.haScaffold);
  att('la colonna del QED c\'e\'', true, exp.haQed);
  att('le colonne del previsto e del residuo ci sono', true, exp.haPrevisto && exp.haResiduo);
  att('il residuo dell\'aspirina e\' 4,2 − 4,0', '0.2', exp.residuoAspirina);
  att('una molecola senza attivita\' lascia la cella vuota', true, exp.attivitaVuotaEtanolo);
  att('il file finisce con una riga nuova', true, exp.finisceConNuovaRiga);

  /* Il rapporto di metodo deve contenere cio' che serve a RIFARE l'analisi.
     Verificato sul contenuto, non sulla lunghezza: un rapporto lungo e vuoto
     passerebbe un controllo sulla lunghezza. */
  const rap = await pg.evaluate(() => {
    const B = window.BSIChem;
    const set = [];
    for (let n = 2; n <= 15; n++) {
      set.push({ smiles: 'C'.repeat(n) + 'O', nome: 'a' + n, attivita: n * 0.5 });
    }
    const mod = B.costruisciModello(set, { scramble: 4, seme: 7 });
    const cvv = B.validazioneIncrociata(set, { pieghe: 3, seme: 7 });
    const md = B.rapportoMetodo({ modello: mod, cv: cvv, seme: 7,
                                  nAccettate: set.length, nScartate: 0 });
    return {
      haSeme: /\| Seme \| 7 \|/.test(md),
      haFingerprint: /\| Fingerprint \| morgan \|/.test(md),
      haVerdetto: /verdetto:/.test(md),
      haRipetizioni: /riaddestrato 4\s+volte/.test(md.replace(/\n/g, ' ')),
      haVersioneRdkit: /\| RDKit \| `/.test(md),
      haLimiti: /## Limiti di questa analisi/.test(md),
      haPieghe: /## Validazione incrociata raggruppata per scheletro/.test(md),
      /* «R2» e' il nome di una variabile, non di una metrica: nel rapporto
         che un valutatore legge deve comparire R². */
      metricaScrittaBene: /R\u00b2 per piega:/.test(md) && !/R2 per piega/.test(md),
      diceCheNonEsceNiente: /nessun dato è uscito dal dispositivo/.test(md),
      senzaModello: B.rapportoMetodo({}).indexOf('## Modello') === -1
    };
  });
  att('il rapporto dichiara il seme', true, rap.haSeme);
  att('il rapporto dichiara il fingerprint usato', true, rap.haFingerprint);
  att('il rapporto porta il verdetto del controllo nullo', true, rap.haVerdetto);
  att('il rapporto dice quante ripetizioni ha fatto', true, rap.haRipetizioni);
  att('il rapporto dichiara la versione di RDKit', true, rap.haVersioneRdkit);
  att('il rapporto elenca i limiti', true, rap.haLimiti);
  att('il rapporto include la validazione incrociata', true, rap.haPieghe);
  att('la metrica e\' scritta R² e non R2', true, rap.metricaScrittaBene);
  att('il rapporto dichiara che nessun dato esce dal dispositivo', true, rap.diceCheNonEsceNiente);
  att('senza modello il rapporto non inventa la sezione', true, rap.senzaModello);

  /* ── §10-quinquies · Il laboratorio RDKit usa lo stesso motore ─────
     Questa pagina aveva una propria copia di Tanimoto e, nel pannello
     «Pharma Pro», una «similarita'» calcolata su OTTO BIT di descrittori a
     soglia — «ha anelli aromatici», «peso fra 200 e 500» — presentata con una
     barra percentuale accanto al nome di un farmaco. Caffeina contro
     metformina dava 0,75; su fingerprint di Morgan vale 0,024.

     I fingerprint dei riferimenti erano inoltre scritti a mano, e tre avevano
     il bit «aromatico» sbagliato; lo SMILES dell'omeprazolo non era
     omeprazolo e RDKit lo rifiutava.

     Qui si verifica che non torni: una sola implementazione di Tanimoto, le
     strutture di riferimento vere, e la similarita' che e' quella strutturale.
     La massa monoisotopica e' il modo di accorgersi che sotto il nome giusto
     c'e' la molecola sbagliata — un nome non si puo' confrontare con niente,
     una massa si'. */
  console.log('\n── Il laboratorio RDKit usa lo stesso motore ──');
  const MASSE = {
    'Paracetamolo': 151.0633, 'Ibuprofene': 206.1307, 'Aspirina': 180.0423,
    'Caffeina': 194.0804, 'Morfina': 285.1365, 'Amoxicillina': 365.1045,
    'Metformina': 129.1014, 'Omeprazolo': 345.1147
  };
  const lab = await pg.evaluate((masse) => {
    const R = window.RDKit || window.RDKitModule, B = window.BSIChem;
    if (!window.REF_DRUGS) return { assente: true };
    const strutture = window.REF_DRUGS.map(r => {
      let m = null;
      try { m = R.get_mol(r.smi); } catch (e) { m = null; }
      if (!m || !m.is_valid()) { if (m && m.delete) m.delete(); return { nome: r.name, valido: false }; }
      const d = JSON.parse(m.get_descriptors());
      m.delete();
      const atteso = masse[r.name];
      return { nome: r.name, valido: true, massa: d.exactmw,
               scarto: atteso === undefined ? null : Math.abs(d.exactmw - atteso) };
    });
    /* L'involucro della pagina e il motore devono dare lo STESSO numero: se
       divergono, una delle due risposte e' sbagliata e nessuno lo saprebbe. */
    let maxScarto = 0, confronti = 0;
    for (let i = 0; i < window.REF_DRUGS.length; i++) {
      for (let j = i + 1; j < window.REF_DRUGS.length; j++) {
        let m1 = null, m2 = null;
        try { m1 = R.get_mol(window.REF_DRUGS[i].smi); m2 = R.get_mol(window.REF_DRUGS[j].smi); } catch (e) {}
        if (!m1 || !m2) { if (m1 && m1.delete) m1.delete(); if (m2 && m2.delete) m2.delete(); continue; }
        const viaPagina = window.tanimoto(m1.get_morgan_fp(), m2.get_morgan_fp());
        m1.delete(); m2.delete();
        const viaMotore = B.tanimoto(B.fingerprint(window.REF_DRUGS[i].smi, 'morgan'),
                                     B.fingerprint(window.REF_DRUGS[j].smi, 'morgan'));
        maxScarto = Math.max(maxScarto, Math.abs(viaPagina - viaMotore));
        confronti++;
      }
    }
    const trova = (n) => window.REF_DRUGS.find(r => r.name === n);
    const simil = (a, b) => B.tanimoto(B.fingerprint(trova(a).smi, 'morgan'),
                                       B.fingerprint(trova(b).smi, 'morgan'));
    return {
      assente: false,
      n: strutture.length,
      nonValide: strutture.filter(s => !s.valido).map(s => s.nome),
      massaFuori: strutture.filter(s => s.valido && s.scarto !== null && s.scarto > 0.02)
                           .map(s => s.nome + ' (' + s.massa.toFixed(3) + ')'),
      confronti, maxScarto,
      caffeinaMetformina: simil('Caffeina', 'Metformina'),
      aspirinaParacetamolo: simil('Aspirina', 'Paracetamolo'),
      /* Le due funzioni della similarita' finta non devono piu' esistere:
         lasciarle in giro le rimetterebbe in uso alla prima modifica. */
      restiDellaFinta: typeof window.simpleFP === 'function' ||
                       typeof window.tanimotoSimple === 'function'
    };
  }, MASSE);

  att('la pagina del laboratorio espone le strutture di riferimento', false, lab.assente);
  att('ogni struttura di riferimento e\' leggibile da RDKit', '', (lab.nonValide || []).join(', '));
  att('ogni struttura ha la massa del farmaco che dichiara', '', (lab.massaFuori || []).join(', '));
  att('i confronti eseguiti sono tutte le coppie', 28, lab.confronti);
  vicino('la pagina e il motore danno lo stesso Tanimoto', 0, lab.maxScarto, 1e-12);
  /* Il numero che il pannello mostrava era 0,75. Su fingerprint veri due
     molecole senza frammenti in comune stanno molto sotto. */
  att('caffeina e metformina non si somigliano', true, lab.caffeinaMetformina < 0.1);
  att('aspirina e paracetamolo si somigliano un po\'', true,
      lab.aspirinaParacetamolo > 0.1 && lab.aspirinaParacetamolo < 0.6);
  att('la similarita\' a otto bit e\' stata rimossa, non solo scavalcata', false, lab.restiDellaFinta);
  console.log('      (caffeina/metformina ' + lab.caffeinaMetformina.toFixed(3) +
              ' · aspirina/paracetamolo ' + lab.aspirinaParacetamolo.toFixed(3) + ')');

  /* ── §12 · Frammentazione, coppie corrispondenti, SAR ──────────────────
     MinimalLib non ha FragmentOnBonds: il taglio si ottiene da una reazione
     SMARTS. Qui si verifica che tagli dove deve e NON dove non deve, perche'
     un taglio dentro un anello o su un legame doppio produrrebbe frammenti
     che non esistono e la tabella SAR li mostrerebbe come sostituenti. */
  console.log('\n── Frammentazione ──');
  const fr = await pg.evaluate(() => {
    const B = window.BSIChem;
    const et = B.frammenta('CCOc1ccccc1').map(p => p.slice().sort().join(' + ')).sort();
    return {
      etossibenzene: et,
      nEtossibenzene: et.length,
      nEtossibenzeneGrossa: B.frammenta('CCOc1ccccc1', 'grossa').length,
      benzene: B.frammenta('c1ccccc1').length,
      /* il metano non ha legami da tagliare */
      metano: B.frammenta('C').length,
      /* con la regola grossa il metile terminale non si taglia */
      toluene_fine: B.frammenta('Cc1ccccc1', 'fine').length,
      toluene_grossa: B.frammenta('Cc1ccccc1', 'grossa').length
    };
  });
  /* Regola fine: tre legami singoli aciclici — CH3–CH2, CH2–O, O–arile.
     Regola grossa: due, perché il metile terminale non si taglia. */
  att('con la regola fine l\'etossibenzene da\' tre tagli', 3, fr.nEtossibenzene);
  att('i tre tagli sono quelli attesi',
      '*C + *COc1ccccc1 | *CC + *Oc1ccccc1 | *OCC + *c1ccccc1',
      fr.etossibenzene.join(' | '));
  att('con la regola grossa i tagli sono due', 2, fr.nEtossibenzeneGrossa);
  att('il benzene non ha legami aciclici da tagliare', 0, fr.benzene);
  att('il metano non ha legami da tagliare', 0, fr.metano);
  att('la regola fine taglia il metile terminale del toluene', 1, fr.toluene_fine);
  att('la regola grossa non lo taglia', 0, fr.toluene_grossa);

  /* Le coppie corrispondenti si verificano su una serie COSTRUITA con effetti
     noti: se l'analisi non li ritrova, non e' utilizzabile su dati veri. */
  console.log('\n── Coppie molecolari corrispondenti ──');
  const mmp = await pg.evaluate(() => {
    const B = window.BSIChem;
    const serie = [
      { smiles:'c1ccc(cc1)C(=O)NCC',    nome:'H-a',  attivita:6.0 },
      { smiles:'Clc1ccc(cc1)C(=O)NCC',  nome:'Cl-a', attivita:7.0 },
      { smiles:'Cc1ccc(cc1)C(=O)NCC',   nome:'Me-a', attivita:6.5 },
      { smiles:'c1ccc(cc1)C(=O)NCCC',   nome:'H-b',  attivita:6.2 },
      { smiles:'Clc1ccc(cc1)C(=O)NCCC', nome:'Cl-b', attivita:7.2 },
      { smiles:'Cc1ccc(cc1)C(=O)NCCC',  nome:'Me-b', attivita:6.7 }
    ];
    const r = B.coppieCorrispondenti(serie, { minCoppie: 2 });
    const t = k => r.trasformazioni.find(x => x.trasformazione === k) || null;
    const arrotonda = x => x === null ? null : Math.round(x * 1000) / 1000;
    const cl = t('*c1ccc(Cl)cc1>>*c1ccccc1');
    const me = t('*c1ccc(C)cc1>>*c1ccccc1');
    const mecl = t('*c1ccc(C)cc1>>*c1ccc(Cl)cc1');
    const catena = t('*NCC>>*NCCC');
    return {
      frammentate: r.molecoleFrammentate, coppie: r.coppie,
      cl: cl ? { n: cl.n, med: arrotonda(cl.mediana), conc: cl.concordanti } : null,
      me: me ? { n: me.n, med: arrotonda(me.mediana) } : null,
      mecl: mecl ? { n: mecl.n, med: arrotonda(mecl.mediana) } : null,
      catena: catena ? { n: catena.n, med: arrotonda(catena.mediana) } : null,
      /* la direzione e' normalizzata sull'ordine alfabetico: la chiave
         inversa non deve esistere, altrimenti lo stesso effetto comparirebbe
         due volte con mediane opposte */
      inversaAssente: t('*c1ccccc1>>*c1ccc(Cl)cc1') === null,
      /* con minCoppie alto restano solo le trasformazioni viste piu' volte */
      conSoglia4: B.coppieCorrispondenti(serie, { minCoppie: 4 }).trasformazioni.length
    };
  });
  att('tutte e sei le molecole si frammentano', 6, mmp.frammentate);
  att('clorofenile→fenile vale −1,0 su 2 coppie',
      '2|-1', mmp.cl ? mmp.cl.n + '|' + mmp.cl.med : 'assente');
  att('le due coppie del cloro sono concordanti', 2, mmp.cl ? mmp.cl.conc : 0);
  att('metilfenile→fenile vale −0,5',
      '2|-0.5', mmp.me ? mmp.me.n + '|' + mmp.me.med : 'assente');
  att('metile→cloro vale +0,5',
      '2|0.5', mmp.mecl ? mmp.mecl.n + '|' + mmp.mecl.med : 'assente');
  att('etilammide→propilammide vale +0,2 su 3 coppie',
      '3|0.2', mmp.catena ? mmp.catena.n + '|' + mmp.catena.med : 'assente');
  att('la direzione è normalizzata, l\'inversa non compare', true, mmp.inversaAssente);
  att('la soglia sul numero di coppie filtra davvero', true, mmp.conSoglia4 < 8);

  /* ── §13 · Ricerca per sottostruttura e tabella SAR ─────────────────── */
  console.log('\n── Ricerca per sottostruttura ──');
  const ric = await pg.evaluate(() => {
    const B = window.BSIChem;
    const set = [
      { smiles:'c1ccc(cc1)C(=O)NCC',    nome:'H-Et'  },
      { smiles:'Clc1ccc(cc1)C(=O)NCC',  nome:'Cl-Et' },
      { smiles:'Cc1ccc(cc1)C(=O)NCC',   nome:'Me-Et' },
      { smiles:'Clc1ccc(cc1)C(=O)NCCC', nome:'Cl-Pr' },
      { smiles:'CCO',                   nome:'estranea' }
    ];
    const core = B.ricercaSottostruttura(set, 'c1ccccc1C(=O)N');
    const cloro = B.ricercaSottostruttura(set, '[Cl]');
    const rotta = B.ricercaSottostruttura(set, 'c1ccccc1C(=O)N[[[');
    const due = B.ricercaSottostruttura(
      [{ smiles:'Clc1ccc(Cl)cc1', nome:'diCl' }, { smiles:'Clc1ccccc1', nome:'monoCl' }], '[Cl]');
    return {
      core: core.quante, coreIndici: core.trovate.join(','),
      cloro: cloro.quante, cloroIndici: cloro.trovate.join(','),
      rottaDichiarata: !!rotta.errore,
      occorrenzeDiCl: due.occorrenze[0], occorrenzeMonoCl: due.occorrenze[1],
      frazione: Math.round(core.frazione * 100) / 100
    };
  });
  att('il nucleo benzamidico corrisponde a quattro molecole su cinque', 4, ric.core);
  att('sono le quattro attese', '0,1,2,3', ric.coreIndici);
  att('il cloro corrisponde a due molecole', '1,3', ric.cloroIndici);
  att('una query malformata viene DICHIARATA, non ignorata', true, ric.rottaDichiarata);
  att('il diclorobenzene conta due occorrenze di Cl', 2, ric.occorrenzeDiCl);
  att('il monoclorobenzene ne conta una', 1, ric.occorrenzeMonoCl);
  att('la frazione di corrispondenze è 0,8', 0.8, ric.frazione);

  console.log('\n── Tabella SAR (decomposizione in gruppi R) ──');
  const sar = await pg.evaluate(() => {
    const B = window.BSIChem;
    const serie = [
      { smiles:'c1ccc(cc1)C(=O)NCC',    nome:'H-Et',  attivita:6.0 },
      { smiles:'Clc1ccc(cc1)C(=O)NCC',  nome:'Cl-Et', attivita:7.0 },
      { smiles:'Cc1ccc(cc1)C(=O)NCC',   nome:'Me-Et', attivita:6.5 },
      { smiles:'Clc1ccc(cc1)C(=O)NCCC', nome:'Cl-Pr', attivita:7.2 },
      { smiles:'CCO',                   nome:'estranea', attivita:1.0 }
    ];
    const d = B.decomposizioneRGruppi(serie, 'c1ccc(cc1)C(=O)N');
    const riga = n => { const r = d.righe.find(x => x.mol.nome === n); return r ? r.celle.join('|') : null; };
    const col1 = d.perPosizione[0];
    return {
      colonne: d.colonne, conNucleo: d.conNucleo, senzaNucleo: d.senzaNucleo.join(','),
      H_Et: riga('H-Et'), Cl_Et: riga('Cl-Et'), Me_Et: riga('Me-Et'), Cl_Pr: riga('Cl-Pr'),
      /* l'ordine per attivita' mediana e' la lettura SAR: Cl > Me > H */
      ordineColonna1: col1.voci.map(v => v.sostituente).join(' > '),
      medianeColonna1: col1.voci.map(v => Math.round(v.attivitaMediana * 100) / 100).join(','),
      nucleoAssente: B.decomposizioneRGruppi(serie, 'c1ccccc1[Se]').conNucleo
    };
  });
  att('la tabella ha due colonne di sostituzione', 2, sar.colonne);
  att('quattro molecole portano il nucleo', 4, sar.conNucleo);
  att('la molecola estranea è esclusa, non messa con celle vuote', '4', sar.senzaNucleo);
  att('la molecola non sostituita mostra H', 'H|*CC', sar.H_Et);
  att('il cloro compare nella colonna giusta', '*Cl|*CC', sar.Cl_Et);
  att('il metile compare nella colonna giusta', '*C|*CC', sar.Me_Et);
  att('il propile compare nella seconda colonna', '*Cl|*CCC', sar.Cl_Pr);
  att('la colonna 1 ordina i sostituenti per attività: Cl > Me > H',
      '*Cl > *C > H', sar.ordineColonna1);
  att('le mediane della colonna 1 sono quelle dei dati', '7.1,6.5,6', sar.medianeColonna1);
  att('un nucleo che non c\'è non produce righe', 0, sar.nucleoAssente);

  /* La chiave dello scaffold NON e' uno SMILES, e il campo si chiamava
     `smiles`. Il pannello SAR l'ha usata come query e proponeva
     «6,6,6,6,7,...|0-13:1,...» come nucleo: il nome sbagliato di un campo e'
     un difetto come un altro. Qui si fissa che la chiave serva a RAGGRUPPARE
     e che dichiari di non essere uno SMILES. */
  const sc = await pg.evaluate(() => {
    const B = window.BSIChem, R = window.RDKit || window.RDKitModule;
    const a = B.scaffoldMurcko('Clc1ccc(cc1)C(=O)NCC');
    const b = B.scaffoldMurcko('Cc1ccc(cc1)C(=O)NCCC');
    const c = B.scaffoldMurcko('c1ccncc1C(=O)NCC');
    let leggibile = false;
    try { const m = R.get_mol(a.chiave); leggibile = !!(m && m.is_valid()); if (m) m.delete(); }
    catch (e) { leggibile = false; }
    return {
      dichiaraDiNonEssereSmiles: a.eUnoSmiles === false,
      haIlCampoChiave: typeof a.chiave === 'string' && a.chiave.length > 0,
      aliasCoincide: a.chiave === a.smiles,
      stessoScheletroStessaChiave: a.chiave === b.chiave,
      scheletroDiversoChiaveDiversa: a.chiave !== c.chiave,
      nonEUnoSmilesValido: !leggibile
    };
  });
  att('la chiave dello scaffold dichiara di non essere uno SMILES', true, sc.dichiaraDiNonEssereSmiles);
  att('il campo chiave esiste ed e\' pieno', true, sc.haIlCampoChiave);
  att('smiles resta come alias della chiave', true, sc.aliasCoincide);
  att('due molecole con lo stesso scheletro danno la stessa chiave', true, sc.stessoScheletroStessaChiave);
  att('scheletri diversi danno chiavi diverse', true, sc.scheletroDiversoChiaveDiversa);
  att('la chiave NON si rilegge come SMILES: non va usata come query', true, sc.nonEUnoSmilesValido);

  /* ── §14 · Il rigore statistico ────────────────────────────────────────
     L'arricchimento si verifica sui tre casi in cui il valore giusto si
     calcola a mano: ordinamento perfetto, pessimo, e uno intermedio. Senza
     il caso pessimo non si saprebbe se BEDROC tocca lo zero o scende sotto,
     e un BEDROC negativo e' il segno che manca il termine additivo. */
  console.log('\n── Arricchimento (EF, BEDROC) ──');
  const arr = await pg.evaluate(() => {
    const B = window.BSIChem;
    const r4 = x => x === null ? null : Math.round(x * 10000) / 10000;
    const punt = [10,9,8,7,6,5,4,3,2,1];
    const perfetto = B.arricchimento([1,1,0,0,0,0,0,0,0,0], punt, { frazioni:[0.2,0.5] });
    const pessimo  = B.arricchimento([0,0,0,0,0,0,0,0,1,1], punt, { frazioni:[0.2,0.5] });
    const medio    = B.arricchimento([0,1,0,0,1,0,0,0,0,0], punt, { frazioni:[0.2,0.5] });
    const soloAttivi = B.arricchimento([1,1,1], [3,2,1], {});
    return {
      perf: { auc: r4(perfetto.auc), ef20: r4(perfetto.ef[0].ef),
              efMax20: r4(perfetto.ef[0].efMassimo), bedroc: r4(perfetto.bedroc),
              trovati20: perfetto.ef[0].attiviTrovati, composti20: perfetto.ef[0].composti,
              attesi20: r4(perfetto.ef[0].attesiACaso) },
      pess: { auc: r4(pessimo.auc), ef20: r4(pessimo.ef[0].ef), bedroc: r4(pessimo.bedroc) },
      med:  { auc: r4(medio.auc), ef20: r4(medio.ef[0].ef), ef50: r4(medio.ef[1].ef) },
      senzaInattivi: !!soloAttivi.errore
    };
  });
  att('ordinamento perfetto: AUC 1', 1, arr.perf.auc);
  att('il primo 20 % sono 2 composti', 2, arr.perf.composti20);
  att('e contengono 2 attivi', 2, arr.perf.trovati20);
  vicino('a caso ne sarebbero attesi 0,4', 0.4, arr.perf.attesi20, 1e-9);
  att('EF@20 % = 2/0,4 = 5', 5, arr.perf.ef20);
  att('ed è il massimo possibile a quella frazione', 5, arr.perf.efMax20);
  att('BEDROC di un ordinamento perfetto vale 1', 1, arr.perf.bedroc);
  att('ordinamento pessimo: AUC 0', 0, arr.pess.auc);
  att('EF@20 % = 0', 0, arr.pess.ef20);
  att('BEDROC di un ordinamento pessimo vale 0, non un negativo', 0, arr.pess.bedroc);
  att('attivi ai ranghi 2 e 5: AUC 12/16 = 0,75', 0.75, arr.med.auc);
  att('EF@20 % = 1/0,4 = 2,5', 2.5, arr.med.ef20);
  att('EF@50 % = 2/1,0 = 2', 2, arr.med.ef50);
  att('un insieme senza inattivi viene rifiutato, non calcolato', true, arr.senzaInattivi);

  /* Il confronto fra modelli: la promessa e' «il migliore supera il
     riferimento banale solo se il margine eccede la dispersione». Va provata
     NEI DUE VERSI, esattamente come il modello nullo: una guardia che non
     scatta mai e una guardia che scatta sempre sono lo stesso difetto. */
  console.log('\n── Confronto fra modelli ──');
  const cmp = await pg.evaluate(() => {
    const B = window.BSIChem;
    const nuclei = ['c1ccccc1','c1ccncc1','c1ccc2ccccc2c1','C1CCCCC1','c1cc[nH]c1',
                    'c1ccoc1','c1ccsc1','C1CCNCC1','c1cnc2ccccc2c1','C1CCOC1'];
    const sost = [['C',0],['Cl',1],['C(Cl)(Cl)',2],['C(Cl)(Cl)Cl',3],['CC',0]];
    const forte = [], finto = [];
    let s = 1; const rnd = () => { s = (s*1103515245+12345) % 2147483648; return s/2147483648; };
    nuclei.forEach((nu, i) => sost.forEach((x, j) => {
      forte.push({ smiles: nu + x[0], nome:'f'+i+j, attivita: 4 + x[1]*1.5 });
      finto.push({ smiles: nu + x[0], nome:'x'+i+j, attivita: 4 + rnd()*4.5 });
    }));
    const a = B.confrontoModelli(forte, { pieghe: 5, seme: 42 });
    const b = B.confrontoModelli(finto, { pieghe: 5, seme: 42 });
    const r3 = x => x === null ? null : Math.round(x*1000)/1000;
    return {
      vero: { n: a.nTotali, scaffold: a.nScaffold, modelli: a.modelli.length,
              riferimento: r3(a.modelli[0].media), migliore: a.migliore,
              supera: a.superaIlRiferimento, margine: r3(a.margineSulRiferimento) },
      casuale: { migliore: b.migliore, supera: b.superaIlRiferimento,
                 margine: r3(b.margineSulRiferimento) },
      /* il riferimento banale deve essere il PRIMO modello dell'elenco:
         chi legge la tabella deve incontrarlo prima degli altri */
      primoERiferimento: /Riferimento/.test(a.modelli[0].nome),
      /* le pieghe sono le STESSE per tutti: altrimenti non e' un confronto */
      stessePieghe: a.modelli.every(m => m.pieghe === a.modelli[0].pieghe)
    };
  });
  att('il confronto mette tre modelli a paragone', 3, cmp.vero.modelli);
  att('il primo dell\'elenco è il riferimento banale', true, cmp.primoERiferimento);
  att('tutti i modelli usano le stesse pieghe', true, cmp.stessePieghe);
  att('su un segnale VERO il migliore supera il riferimento', true, cmp.vero.supera);
  att('su etichette CASUALI non lo supera', false, cmp.casuale.supera);
  console.log('      (segnale vero: margine ' + cmp.vero.margine +
              ' · casuale: ' + cmp.casuale.margine + ')');

  /* Intervalli conformi: la garanzia e' di copertura. Si verifica che il
     quantile sia quello della formula conforme — ceil((n+1)(1−α)) — e non un
     percentile qualunque, perche' e' quella correzione a dare la garanzia. */
  console.log('\n── Intervalli di predizione conformi ──');
  const conf = await pg.evaluate(() => {
    const B = window.BSIChem;
    const ins = [];
    for (let n = 3; n <= 22; n++) {
      ins.push({ smiles:'C'.repeat(n)+'O', nome:'ol'+n, attivita:n*0.4 });
      ins.push({ smiles:'C'.repeat(n)+'N', nome:'am'+n, attivita:n*0.4+0.3 });
    }
    const a = B.intervalliConformi(ins, { alfa: 0.1, seme: 42 });
    const b = B.intervalliConformi(ins, { alfa: 0.5, seme: 42 });
    const p = a.predici('CCCCCCCCO');
    const q = a.predici('non-uno-smiles');
    return {
      livello: a.livello, copertura: a.coperturaSullaCalibrazione,
      copreIlLivello: a.coperturaSullaCalibrazione >= a.livello,
      /* a confidenza più bassa l'intervallo deve STRINGERSI: se non lo fa,
         il quantile non sta guardando alfa */
      piuStrettoAl50: b.semiampiezza <= a.semiampiezza,
      intervalloCentrato: p ? Math.abs((p.alto + p.basso) / 2 - p.valore) < 1e-9 : false,
      ampiezzaCoerente: p ? Math.abs((p.alto - p.basso) / 2 - p.semiampiezza) < 1e-9 : false,
      smilesRottoRestituisceNull: q === null,
      nCal: a.nCalibrazione, divisione: a.divisione
    };
  });
  att('la copertura sulla calibrazione raggiunge il livello richiesto', true, conf.copreIlLivello);
  att('al 50 % l\'intervallo è più stretto che al 90 %', true, conf.piuStrettoAl50);
  att('l\'intervallo è centrato sulla predizione', true, conf.intervalloCentrato);
  att('la semiampiezza coincide con metà dell\'intervallo', true, conf.ampiezzaCoerente);
  att('uno SMILES illeggibile non produce un intervallo inventato', true, conf.smilesRottoRestituisceNull);

  /* Curva di apprendimento: serve a dire se più dati aiuterebbero. Si
     verifica che l'insieme di PROVA resti intero mentre si assottiglia
     l'addestramento — altrimenti i punti non sarebbero confrontabili. */
  console.log('\n── Curva di apprendimento ──');
  const cur = await pg.evaluate(() => {
    const B = window.BSIChem;
    const nuclei = ['c1ccccc1','c1ccncc1','c1ccc2ccccc2c1','C1CCCCC1','c1cc[nH]c1',
                    'c1ccoc1','c1ccsc1','C1CCNCC1'];
    const ins = [];
    nuclei.forEach((nu, i) => [['C',0],['Cl',1],['C(Cl)(Cl)',2],['C(Cl)(Cl)Cl',3]]
      .forEach((x, j) => ins.push({ smiles: nu + x[0], nome:'c'+i+j, attivita: 4 + x[1]*1.5 })));
    const c = B.curvaApprendimento(ins, { pieghe: 4, seme: 42, frazioni: [0.25, 0.5, 1.0] });
    const v = c.punti.filter(p => p.media !== null);
    return {
      punti: c.punti.length, valutati: v.length,
      crescente: v.length >= 2 && v[v.length-1].media >= v[0].media,
      ultimoNonPeggiore: v.length >= 2 && v[v.length-1].media >= v[v.length-2].media - 0.2,
      pendenzaDefinita: c.pendenzaFinale !== null,
      verdettoEspresso: c.piuDatiAiuterebbero !== null
    };
  });
  att('la curva valuta tutti i punti chiesti', 3, cur.valutati);
  att('con più addestramento il punteggio non peggiora', true, cur.crescente);
  att('la pendenza finale è calcolata', true, cur.pendenzaDefinita);
  att('il verdetto «più dati aiuterebbero» viene espresso', true, cur.verdettoEspresso);

  /* ── §15 · Esportazione SDF ────────────────────────────────────────────
     Un SDF sbagliato e' peggio di nessun SDF: chi lo riceve lo importa e
     scopre l'errore dopo. Il controllo decisivo e' il ROUND-TRIP: il blocco
     prodotto deve rileggersi e dare lo stesso SMILES canonico. */
  console.log('\n── Esportazione SDF ──');
  const sdf = await pg.evaluate(() => {
    const B = window.BSIChem, R = window.RDKit || window.RDKitModule;
    const set = [
      { smiles:'CC(=O)Oc1ccccc1C(=O)O', originale:'CC(=O)Oc1ccccc1C(=O)O',
        nome:'aspirina, acido', attivita:4.2 },
      { smiles:'CCO', originale:'CCO', nome:'etanolo' },
      { smiles:'QQQQ', originale:'QQQQ', nome:'spazzatura' }
    ];
    const e = B.esportaSdf(set, { previsto:[4.0, undefined, undefined] });
    const voci = e.sdf.split('$$$$\n').filter(x => x.trim());
    const riletti = voci.map(v => {
      let m = null;
      try { m = R.get_mol(v.split('> <')[0]); } catch (err) { m = null; }
      const smi = (m && m.is_valid()) ? m.get_smiles() : null;
      if (m && m.delete) m.delete();
      return smi;
    });
    return {
      scritte: e.scritte, scartate: e.scartate.length,
      motivoScarto: e.scartate.length ? e.scartate[0].motivo : '',
      voci: voci.length,
      roundTrip: riletti.join(' | '),
      nomePrimaRiga: e.sdf.split('\n')[0],
      haAttivita: /> <ATTIVITA>\n4\.2\n/.test(e.sdf),
      haResiduo: /> <RESIDUO>\n0\.2\n/.test(e.sdf),
      /* un nome di campo con spazi spezzerebbe il parsing di chi legge */
      nomiCampoSenzaSpazi: !/> <[^>]*\s[^>]*>/.test(e.sdf),
      /* senza coordinate generate ogni atomo starebbe a (0,0,0) */
      coordinateGenerate: !/^\s+0\.0000\s+0\.0000\s+0\.0000/m.test(
        e.sdf.split('$$$$')[0].split('\n').slice(4, 7).join('\n'))
    };
  });
  att('le due molecole valide vengono scritte', 2, sdf.scritte);
  att('lo SMILES illeggibile è DICHIARATO scartato', 1, sdf.scartate);
  att('con il motivo scritto', 'SMILES non interpretabile', sdf.motivoScarto);
  att('il round-trip restituisce gli stessi SMILES canonici',
      'CC(=O)Oc1ccccc1C(=O)O | CCO', sdf.roundTrip);
  att('il nome sta nella prima riga del blocco', 'aspirina, acido', sdf.nomePrimaRiga);
  att('il campo dell\'attività c\'è', true, sdf.haAttivita);
  att('il residuo è 4,2 − 4,0', true, sdf.haResiduo);
  att('nessun nome di campo contiene spazi', true, sdf.nomiCampoSenzaSpazi);
  att('le coordinate 2D sono state generate', true, sdf.coordinateGenerate);

  /* ── §10-quater · Il contrasto dei pannelli, misurato dove nessun altro
     banco arriva ────────────────────────────────────────────────────────
     `verifica-accessibilita` percorre le 88 sezioni e misura ciò che è
     VISIBILE. Ma i sei pannelli di questa sezione stanno dentro un
     contenitore che resta `display:none` finché l'analisi non è stata
     eseguita: quel banco non li ha mai visti, e il suo «contrasto 0» non
     parla di loro. Un numero perfetto che non copre la superficie nuova è
     esattamente il caso che questo progetto ha già incontrato una volta.

     Qui l'analisi viene eseguita per davvero, e poi si misura. Le formule
     sono riscritte in questo banco e non prese dall'applicazione: un banco
     che chiedesse al codice sotto esame quanto vale il proprio contrasto non
     misurerebbe niente. */
  console.log('\n── Contrasto dei pannelli (dove l\'altro banco non arriva) ──');
  const pg2 = await ctx.newPage();
  const erroriUi = [];
  pg2.on('pageerror', e => erroriUi.push(e.message));
  await pg2.goto(BASE + 'index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg2.waitForTimeout(2500);
  await pg2.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });
  await pg2.evaluate(() => {
    const n = document.querySelector('.nav-btn[data-s="scheminfo"]');
    if (n) n.click();
  });
  await pg2.waitForTimeout(600);
  await pg2.evaluate(() => {
    document.getElementById('chemEsInib').click();
    document.getElementById('chemVai').click();
  });
  /* L'analisi passa per RDKit in WebAssembly: si aspetta il risultato, non un
     tempo fisso. */
  await pg2.waitForFunction(
    () => { const c = document.getElementById('chemCorpo'); return c && c.style.display !== 'none'; },
    { timeout: 90000 });
  await pg2.waitForTimeout(1200);

  /* Si aprono tutti i pannelli a turno: quello nascosto non si misura, e
     lasciarne uno chiuso rifarebbe lo stesso errore in piccolo. */
  const pannelli = ['descr', 'simil', 'spazio', 'cerca', 'sar', 'mmp', 'qsar', 'salti', 'allarmi'];
  let difetti = [], misurati = 0, apertiOk = 0;
  for (const nome of pannelli) {
    const aperto = await pg2.evaluate((n) => {
      const t = document.querySelector('#scheminfo .chem-t[data-p="' + n + '"]');
      if (!t) return false;
      t.click();
      const el = document.getElementById('chemP-' + n);
      return !!(el && el.style.display !== 'none' && el.textContent.trim().length > 20);
    }, nome);
    if (aperto) apertiOk++;
    await pg2.waitForTimeout(350);

    const esito = await pg2.evaluate(() => {
      function canale(v){ v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
      function lum(c){ return 0.2126 * canale(c[0]) + 0.7152 * canale(c[1]) + 0.0722 * canale(c[2]); }
      function rapporto(a, b){
        const la = lum(a), lb = lum(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      }
      function rgb(s){
        const m = String(s).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(',').map(x => parseFloat(x.trim()));
        return { c: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
      }
      /* Un colore con alfa non è il colore che si vede: va composto su ciò
         che sta sotto, altrimenti si giudica una trasparenza come se fosse
         una tinta piena. */
      function fondoEffettivo(el){
        let sopra = [], n = el;
        while (n && n.nodeType === 1) {
          const st = getComputedStyle(n);
          /* Un gradiente ritagliato sul testo dipinge i GLIFI, non il fondo:
             l'elemento non ha un fondo proprio da confrontare. */
          if (st.webkitBackgroundClip === 'text' || st.backgroundClip === 'text') return null;
          if (st.backgroundImage && st.backgroundImage !== 'none') return null;
          const f = rgb(st.backgroundColor);
          if (f && f.a > 0) {
            sopra.push(f);
            if (f.a >= 0.999) break;
          }
          n = n.parentElement;
        }
        let base = [13, 21, 34];          // il fondo della pagina
        for (let i = sopra.length - 1; i >= 0; i--) {
          const s = sopra[i];
          base = [0, 1, 2].map(k => s.c[k] * s.a + base[k] * (1 - s.a));
        }
        return base;
      }

      const fuori = [];
      let n = 0;
      const radice = document.getElementById('scheminfo');
      if (!radice) return { n: 0, fuori: [] };
      const cam = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT);
      const visti = new Set();
      let t;
      while ((t = cam.nextNode())) {
        const testo = t.nodeValue.trim();
        if (!testo) continue;
        /* Le sole emoji non sono testo da leggere. */
        if (!/[0-9A-Za-zÀ-ÿ]/.test(testo)) continue;
        const el = t.parentElement;
        if (!el || visti.has(el)) continue;
        visti.add(el);
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const col = rgb(st.color);
        const fondo = fondoEffettivo(el);
        if (!col || !fondo) continue;
        const grande = parseFloat(st.fontSize) >= 24 ||
                       (parseFloat(st.fontSize) >= 18.66 && +st.fontWeight >= 700);
        const soglia = grande ? 3 : 4.5;
        const composto = [0, 1, 2].map(k => col.c[k] * col.a + fondo[k] * (1 - col.a));
        n++;
        const rap = rapporto(composto, fondo);
        if (rap < soglia) {
          fuori.push({
            testo: testo.slice(0, 40), colore: st.color, fondo: 'rgb(' + fondo.map(Math.round).join(',') + ')',
            rapporto: Math.round(rap * 100) / 100, soglia
          });
        }
      }
      return { n, fuori };
    });
    misurati += esito.n;
    difetti = difetti.concat(esito.fuori.map(d => Object.assign({ pannello: nome }, d)));
  }

  att('tutti e nove i pannelli si aprono con del contenuto', 9, apertiOk);
  /* Un banco che non misura nulla passa: se gli elementi misurati sono
     pochi, i pannelli non si sono aperti e il «zero difetti» è vuoto. */
  att('gli elementi di testo misurati sono molti', true, misurati > 250);
  att('nessun testo dei pannelli sotto la soglia WCAG AA', 0, difetti.length);
  console.log('      (' + misurati + ' elementi di testo misurati nei nove pannelli)');
  difetti.slice(0, 12).forEach(d => console.log('      ! [' + d.pannello + '] ' +
    d.rapporto + ':1 (serve ' + d.soglia + ') ' + d.colore + ' su ' + d.fondo + ' — «' + d.testo + '»'));

  att('nessun errore JavaScript usando la sezione', 0, erroriUi.length);
  erroriUi.slice(0, 4).forEach(e => console.log('      ! ' + e.slice(0, 140)));
  await pg2.close();

  /* ── §11 · Nessun errore lungo la strada ──────────────────────────── */
  console.log('\n── Igiene ──');
  const soloVeri = erroriJs.filter(e => !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|Failed to fetch/i.test(e));
  att('nessun errore JavaScript durante le prove', 0, soloVeri.length);
  soloVeri.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 140)));

  await browser.close();

  /* Un banco che non misura nulla passa: se i controlli eseguiti sono
     pochi, qualcosa e' stato saltato in silenzio. */
  if (eseguiti < 178) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 178');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
