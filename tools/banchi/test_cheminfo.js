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

  /* ── §11 · Nessun errore lungo la strada ──────────────────────────── */
  console.log('\n── Igiene ──');
  const soloVeri = erroriJs.filter(e => !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|Failed to fetch/i.test(e));
  att('nessun errore JavaScript durante le prove', 0, soloVeri.length);
  soloVeri.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 140)));

  await browser.close();

  /* Un banco che non misura nulla passa: se i controlli eseguiti sono
     pochi, qualcosa e' stato saltato in silenzio. */
  if (eseguiti < 45) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 45');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
