/* ═══════════════════════════════════════════════════════════════════════════
   verifica_farmaci_v187 — la formula ricostruita contro quella dichiarata

   Uno SMILES sbagliato e' autoconsistente. Quello dell'omeprazolo trovato
   nel laboratorio RDKit lo era: RDKit lo leggeva, calcolava un peso, e il
   peso tornava — con la molecola sbagliata. Nessun controllo interno puo'
   vederlo, perche' tutto deriva dalla stessa struttura.

   Serve un secondo testimone. Qui il testimone e' ChEMBL: ogni struttura
   viene dal suo record, e la formula molecolare che ChEMBL dichiara viene
   confrontata con quella RICOSTRUITA da RDKit contando gli atomi del grafo
   (idrogeni impliciti inclusi). Se le due coincidono, due fonti indipendenti
   descrivono la stessa molecola. Se non coincidono, la voce NON entra.

   USO   node tools/banchi/verifica_farmaci_v187.js
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');
const fs = require('fs');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Il percorso si risolve rispetto a QUESTO file, non alla cartella di lavoro:
   `genera-evidenza` esegue i banchi di `tools/banchi/` con cwd in quella
   cartella, e un percorso relativo alla radice falliva solo dentro la
   batteria ufficiale — passando invece a mano. Un banco che funziona quando
   lo lanci tu e cade quando lo lancia la batteria e' il peggiore dei due. */
const path = require('path');
const DATI = path.resolve(__dirname, '..', 'dati', 'farmaci_v187.json');
const voci = JSON.parse(fs.readFileSync(DATI, 'utf8'));

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(5000);

  const esiti = await pg.evaluate(async (voci) => {
    await new Promise(r => window.bsiLoadRDKit(r));
    const R = window.__rdkit;
    /* la formula si ricostruisce CONTANDO gli atomi del grafo: non si chiede
       a RDKit di stamparla, perche' allora si confronterebbe una stringa con
       un'altra stringa della stessa provenienza.

       Il formato è commonchem: ogni atomo porta SOLO i campi che
       differiscono da `defaults.atom`, dove z vale 6 e impHs vale 0. Un
       atomo scritto `{}` è quindi un carbonio senza idrogeni impliciti, e
       leggere a.element — che non esiste — faceva contare ogni atomo come
       carbonio e nessun idrogeno: 36 formule su 36 risultavano C<n>. */
    const SIMBOLO = { 1:'H', 5:'B', 6:'C', 7:'N', 8:'O', 9:'F', 11:'Na', 12:'Mg',
      14:'Si', 15:'P', 16:'S', 17:'Cl', 19:'K', 20:'Ca', 26:'Fe', 30:'Zn',
      34:'Se', 35:'Br', 53:'I', 78:'Pt' };
    function formulaDa(smi) {
      const m = R.get_mol(smi);
      if (!m) return null;
      const g = JSON.parse(m.get_json());
      m.delete();
      const dif = (g.defaults && g.defaults.atom) || { z: 6, impHs: 0 };
      const conta = {};
      const atomi = g.molecules[0].atoms || [];
      for (let i = 0; i < atomi.length; i++) {
        const a = atomi[i];
        const z = (a.z !== undefined) ? a.z : dif.z;
        const sim = SIMBOLO[z];
        if (!sim) throw new Error('numero atomico non in tabella: ' + z);
        conta[sim] = (conta[sim] || 0) + 1;
        const h = (a.impHs !== undefined) ? a.impHs : dif.impHs;
        if (h) conta.H = (conta.H || 0) + h;
      }
      /* notazione di Hill, come la scrive ChEMBL: C, H, poi in ordine
         alfabetico di simbolo */
      const altri = Object.keys(conta).filter(e => e !== 'C' && e !== 'H').sort();
      let s = '';
      ['C', 'H'].concat(altri).forEach(function (e) {
        if (!conta[e]) return;
        s += e + (conta[e] > 1 ? conta[e] : '');
      });
      return s;
    }
    return voci.map(function (v) {
      let ric = null, errore = null;
      try { ric = formulaDa(v.smi); } catch (e) { errore = e.message; }
      return { n: v.n, id: v.id, dich: v.f, ric: ric, errore: errore,
               uguali: ric === v.f };
    });
  }, voci);

  await b.close();

  let ok = 0, ko = 0;
  esiti.forEach(function (e) {
    if (e.uguali) { ok++; console.log('  ✓ ' + e.n.padEnd(32) + e.dich); }
    else { ko++; console.log('  ✗ ' + e.n + '\n      ChEMBL dichiara: ' + e.dich +
                             '\n      RDKit ricostruisce: ' + (e.ric || '(' + e.errore + ')')); }
  });
  console.log('\n' + ok + '/' + esiti.length + ' formule coincidono' +
              (ko ? '  ·  ' + ko + ' DA SCARTARE' : ''));
  /* un banco che non misura nulla passa */
  if (esiti.length < 30) { console.log('✗ attese almeno 30 voci'); process.exit(1); }
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
