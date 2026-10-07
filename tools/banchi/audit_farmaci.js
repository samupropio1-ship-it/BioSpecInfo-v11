/* I DATI DEI FARMACI DEVONO ESSERE VERI, NON PLAUSIBILI.
   Ogni voce dichiara uno SMILES e un peso molecolare: due affermazioni
   indipendenti sulla stessa molecola. RDKit calcola il peso dalla struttura
   e, se non coincide con quello scritto a mano, almeno uno dei due e'
   sbagliato. E' un controllo che non chiede di fidarsi di nessuno.

   Si legge l'elenco DAL VIVO: nel sorgente i farmaci stanno in tre array
   diversi piu' dei .concat() che ne aggiungono altri a runtime, e leggendo
   solo i letterali se ne perdevano 38 su 143. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(3000);

  const esiti = await pg.evaluate(() => new Promise(res => {
    window.bsiLoadRDKit(function (RD) {
      /* La formula si RICOSTRUISCE contando gli atomi del grafo. Il peso
         calcolato non basta: lenalidomide, palbociclib e aripiprazolo
         portavano uno SMILES che descriveva una molecola DIVERSA — un
         isomero — e un isomero ha lo stesso peso e la stessa formula del
         composto giusto. Il peso tornava, la molecola no.
         Il formato è commonchem: un atomo porta solo i campi che
         differiscono da defaults.atom (z=6, impHs=0). */
      const SIMBOLO = { 1:'H', 5:'B', 6:'C', 7:'N', 8:'O', 9:'F', 11:'Na',
        12:'Mg', 14:'Si', 15:'P', 16:'S', 17:'Cl', 19:'K', 20:'Ca', 26:'Fe',
        30:'Zn', 34:'Se', 35:'Br', 53:'I', 78:'Pt' };
      function formulaDa(mol) {
        const g = JSON.parse(mol.get_json());
        const dif = (g.defaults && g.defaults.atom) || { z: 6, impHs: 0 };
        const c = {};
        (g.molecules[0].atoms || []).forEach(function (a) {
          const sim = SIMBOLO[(a.z !== undefined) ? a.z : dif.z];
          if (!sim) throw new Error('numero atomico fuori tabella');
          c[sim] = (c[sim] || 0) + 1;
          const h = (a.impHs !== undefined) ? a.impHs : dif.impHs;
          if (h) c.H = (c.H || 0) + h;
        });
        const altri = Object.keys(c).filter(e => e !== 'C' && e !== 'H').sort();
        let s = '';
        ['C', 'H'].concat(altri).forEach(function (e) {
          if (c[e]) s += e + (c[e] > 1 ? c[e] : '');
        });
        return s;
      }
      const out = FARM_DATA.map(f => {
        const r = { nome: f.name, cat: f.cat, smi: f.smi || '', mw: parseFloat(f.mw),
                    chembl: f.chembl || null, formulaDich: f.formula || null };
        if (!r.smi) { r.errore = 'nessuno SMILES'; return r; }
        let mol = null;
        try { mol = RD.get_mol(r.smi); } catch (e) { r.errore = 'SMILES non valido'; }
        if (!mol) { if (!r.errore) r.errore = 'SMILES non interpretabile'; return r; }
        try {
          const d = JSON.parse(mol.get_descriptors() || '{}');
          r.calc = d.amw;
        } catch (e) { r.errore = 'descrittori non calcolabili'; }
        if (r.formulaDich) {
          try { r.formulaRic = formulaDa(mol); }
          catch (e) { r.formulaRic = '(' + e.message + ')'; }
        }
        try { mol.delete(); } catch (e) {}
        return r;
      });
      res(out);
    });
  }));

  let gravi = 0, avvisi = 0;
  const p = (s) => console.log(s);

  p('\n── SMILES mancanti o non validi ──');
  const rotti = esiti.filter(e => e.errore);
  if (!rotti.length) p('  ✓ nessuno');
  /* Alcune voci NON HANNO uno SMILES, e per loro l'assenza e' corretta. Ma
     "corretta" va detta con la ragione, altrimenti l'esenzione diventa un
     posto dove nascondere i difetti. Le ragioni sono tre, e sono diverse:
       · macromolecola — un anticorpo o un peptide lungo non si descrive
         sensatamente con uno SMILES (ChEMBL stessa li dichiara come SEQ);
       · associazione — la voce e' una combinazione a dose fissa di DUE
         molecole: un campo singolo e' la forma sbagliata, non un dato
         mancante;
       · miscela — il principio attivo e' una miscela di omologhi, e ChEMBL
         dichiara structure_type NONE: misurato, non supposto.
     Un nome che non figura qui e non ha struttura resta un ERRORE. */
  const SENZA_STRUTTURA = {
    macromolecola: /mab$|mab \(|Insulina|Ciclosporina|glutide|Octreotide|Caspofungina/i,
    associazione: /Entresto|Coartem|\//,
    miscela: /^Ivermectina$/i
  };
  rotti.forEach(e => {
    let ragione = null;
    Object.keys(SENZA_STRUTTURA).forEach(function (k) {
      if (!ragione && SENZA_STRUTTURA[k].test(e.nome)) ragione = k;
    });
    if (ragione) { avvisi++; p('  ⚠ ' + e.nome + ' — ' + e.errore + '  (' + ragione + ': atteso)'); }
    else { gravi++; p('  ✗ ' + e.nome + ' — ' + e.errore); }
  });
  /* la guardia opposta: se l'esenzione coprisse TUTTO, la sezione non
     misurerebbe piu' niente. Il numero di voci con struttura non puo' calare. */
  const BASE_CON_STRUTTURA = 240;
  const conStruttura = esiti.length - rotti.length;
  if (conStruttura < BASE_CON_STRUTTURA) {
    gravi++;
    p('  ✗ le voci CON struttura sono scese a ' + conStruttura +
      ': la soglia dichiarata è ' + BASE_CON_STRUTTURA);
  } else {
    p('  · voci con struttura leggibile: ' + conStruttura +
      ' (soglia ' + BASE_CON_STRUTTURA + ', non può calare)');
  }

  p('\n── Peso dichiarato vs calcolato dalla struttura ──');
  const scarti = [];
  esiti.forEach(e => {
    if (e.errore || !e.calc || !isFinite(e.mw)) return;
    const d = Math.abs(e.calc - e.mw);
    if (d > 0.6) scarti.push({ e, d });
  });
  if (!scarti.length) p('  ✓ tutti coerenti (entro 0,6 u)');
  scarti.sort((a, b2) => b2.d - a.d).forEach(({ e, d }) => {
    gravi++;
    p('  ✗ ' + e.nome.padEnd(26) + ' dichiarato ' + e.mw.toFixed(2) +
      '  calcolato ' + e.calc.toFixed(2) + '  (Δ ' + d.toFixed(2) + ')');
  });

  p('\n── Doppioni ──');
  const visti = {}, dupl = [];
  esiti.forEach(e => {
    const k = e.nome.toLowerCase().trim();
    if (visti[k]) dupl.push(e.nome); else visti[k] = 1;
  });
  if (!dupl.length) p('  ✓ nessun farmaco ripetuto');
  dupl.forEach(d => { gravi++; p('  ✗ ' + d + ' compare due volte'); });

  /* ── La provenienza, con la sua cricca ──────────────────────────────────
     Ogni voce che dichiara un identificativo ChEMBL dichiara anche la
     formula del record. Qui la formula viene RICOSTRUITA dal grafo e
     confrontata: due fonti indipendenti, non una che si conferma da sola.
     E il numero di voci verificate non puo' CALARE: togliere la formula a
     una voce la renderebbe indistinguibile da una scritta a memoria, e
     nessun controllo se ne accorgerebbe. */
  const BASE_VERIFICATE = 36;
  p('\n── Provenienza esterna (ChEMBL) ──');
  const conFonte = esiti.filter(e => e.chembl && e.formulaDich);
  const discordi = conFonte.filter(e => e.formulaRic !== e.formulaDich);
  if (!discordi.length) {
    p('  ✓ ' + conFonte.length + ' voci: la formula ricostruita dal grafo coincide ' +
      'con quella dichiarata da ChEMBL');
  }
  discordi.forEach(e => {
    gravi++;
    p('  ✗ ' + e.nome + '  [' + e.chembl + ']\n      ChEMBL dichiara: ' +
      e.formulaDich + '\n      ricostruita:     ' + e.formulaRic);
  });
  if (conFonte.length < BASE_VERIFICATE) {
    gravi++;
    p('  ✗ le voci con provenienza verificata sono scese a ' + conFonte.length +
      ': la soglia dichiarata è ' + BASE_VERIFICATE);
  } else {
    p('  ✓ voci con provenienza verificata: ' + conFonte.length +
      ' (soglia ' + BASE_VERIFICATE + ', non può calare)');
  }

  await b.close();
  p('\n' + esiti.length + ' farmaci controllati — ' +
    (gravi ? '✗ ' + gravi + ' ERRORI, ' : 'nessun errore, ') + avvisi + ' avvisi');
  process.exit(gravi ? 1 : 0);
})();
