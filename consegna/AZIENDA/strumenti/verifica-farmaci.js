#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   VERIFICA DELLA BANCA DATI FARMACOLOGICA — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   IL PRINCIPIO.
   Ogni voce dichiara DUE proprieta' della stessa molecola: la struttura
   (SMILES) e il peso molecolare. Sono affermazioni indipendenti — la prima
   descrive la connettivita' atomica, il secondo e' un numero di letteratura
   — quindi confrontabili. RDKit ricalcola il peso dalla struttura: se i due
   numeri non coincidono, almeno una delle due affermazioni e' sbagliata.
   Il controllo non chiede di fidarsi di nessuna fonte: confronta due numeri.

   DIFETTI CONTRO DEVIAZIONI.
   Una struttura che contraddice il proprio peso e' un DIFETTO e fa fallire
   la verifica. Una struttura ASSENTE puo' essere invece una deviazione
   accettata — un anticorpo monoclonale non ha uno SMILES sensato, e una
   molecola troppo complessa per essere verificata e' meglio lasciarla senza
   struttura che con una struttura inventata. Ma l'accettazione dev'essere
   ESPLICITA: le voci ammesse stanno in docs/evidence/deviazioni-note.json,
   con il motivo, e finiscono nel rapporto. Una voce priva di struttura e non
   registrata la' fa fallire la verifica come qualunque altro difetto.

   USO   node tools/verifica-farmaci.js          (serve un server su :8899)
         node tools/verifica-farmaci.js --json   uscita leggibile da programma
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..');
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL_APP = process.env.BSI_URL || 'http://127.0.0.1:8899/index.html';
const JSON_OUT = process.argv.includes('--json');

/* Tolleranza: 0,6 u copre gli arrotondamenti e le piccole differenze fra
   tabelle di masse atomiche. Un errore vero vale decine di unita'. */
const TOLLERANZA = 0.6;

function registro(){
  try {
    const j = JSON.parse(fs.readFileSync(
      path.join(RADICE, 'docs', 'evidence', 'deviazioni-note.json'), 'utf8'));
    const m = new Map();
    ['farmaci_senza_struttura', 'farmaci_biologici'].forEach(function(k){
      const g = j[k];
      if (!g || !Array.isArray(g.voci)) return;
      g.voci.forEach(function(v){
        m.set(v.nome.toLowerCase().trim(),
              { motivo: v.motivo, difformita: g._difformita, gruppo: k });
      });
    });
    return m;
  } catch (e) {
    console.error('⚠  registro delle deviazioni non leggibile: ' + e.message);
    return new Map();
  }
}

(async () => {
  let chromium;
  try { chromium = require('playwright-core').chromium; }
  catch (e) {
    console.error('playwright-core non installato: eseguire `npm install`.');
    process.exit(2);
  }

  const dev = registro();
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
  await pg.goto(URL_APP, { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(3000);

  const esiti = await pg.evaluate(() => new Promise(res => {
    window.bsiLoadRDKit(function (RD) {
      res(FARM_DATA.map(f => {
        const r = { nome: f.name, cat: f.cat, smi: f.smi || '', mw: parseFloat(f.mw) };
        if (!r.smi) { r.senzaStruttura = true; return r; }
        let mol = null;
        try { mol = RD.get_mol(r.smi); } catch (e) { r.errore = 'SMILES non valido'; }
        if (!mol) { if (!r.errore) r.errore = 'SMILES non interpretabile'; return r; }
        try {
          const d = JSON.parse(mol.get_descriptors() || '{}');
          r.calc = d.amw;
        } catch (e) { r.errore = 'descrittori non calcolabili'; }
        try { mol.delete(); } catch (e) {}
        return r;
      }));
    });
  }));
  await b.close();

  const difetti = [], deviazioni = [], nonRegistrate = [];

  esiti.forEach(function(e){
    const reg = dev.get(e.nome.toLowerCase().trim());
    if (e.senzaStruttura) {
      if (reg) deviazioni.push({ nome: e.nome, motivo: reg.motivo, difformita: reg.difformita });
      else nonRegistrate.push({ nome: e.nome, causa: 'nessuno SMILES e nessuna deviazione registrata' });
      return;
    }
    if (e.errore) { difetti.push({ nome: e.nome, causa: e.errore }); return; }
    if (!isFinite(e.mw)) { difetti.push({ nome: e.nome, causa: 'peso molecolare non dichiarato' }); return; }
    const d = Math.abs(e.calc - e.mw);
    if (d > TOLLERANZA) {
      difetti.push({ nome: e.nome, causa: 'struttura e peso non coincidono',
                     dichiarato: +e.mw.toFixed(2), calcolato: +e.calc.toFixed(2), delta: +d.toFixed(2) });
    }
  });

  // doppioni
  const visti = new Set(), doppioni = [];
  esiti.forEach(function(e){
    const k = e.nome.toLowerCase().trim();
    if (visti.has(k)) doppioni.push(e.nome); else visti.add(k);
  });
  doppioni.forEach(function(n){ difetti.push({ nome: n, causa: 'voce ripetuta' }); });

  const esito = (difetti.length + nonRegistrate.length) === 0;

  if (JSON_OUT) {
    console.log(JSON.stringify({
      totale: esiti.length, conStruttura: esiti.filter(e => e.smi).length,
      difetti, deviazioniDichiarate: deviazioni, deviazioniNonRegistrate: nonRegistrate,
      tolleranza: TOLLERANZA, esito: esito ? 'CONFORME' : 'NON CONFORME'
    }, null, 2));
    process.exit(esito ? 0 : 1);
  }

  console.log('Verifica della banca dati farmacologica');
  console.log('Metodo: peso ricalcolato da RDKit sulla struttura ⟷ peso dichiarato');
  console.log('Tolleranza: ' + TOLLERANZA + ' u\n');
  console.log('Voci esaminate: ' + esiti.length +
              '  (con struttura: ' + esiti.filter(e => e.smi).length + ')\n');

  console.log('── Difetti ──');
  if (!difetti.length) console.log('  ✓ nessuno');
  difetti.forEach(function(d){
    let r = '  ✗ ' + d.nome.padEnd(30) + d.causa;
    if (d.delta !== undefined)
      r += ': dichiarato ' + d.dichiarato + ', calcolato ' + d.calcolato + ' (Δ ' + d.delta + ')';
    console.log(r);
  });

  console.log('\n── Deviazioni dichiarate e accettate ──');
  if (!deviazioni.length) console.log('  (nessuna)');
  deviazioni.forEach(function(d){
    console.log('  ▪ [' + d.difformita + '] ' + d.nome.padEnd(34) + d.motivo);
  });

  if (nonRegistrate.length) {
    console.log('\n── Voci prive di struttura NON registrate fra le deviazioni ──');
    console.log('  Vanno corrette, oppure registrate in docs/evidence/deviazioni-note.json');
    console.log('  con il motivo — che finira\' nel rapporto di verifica.');
    nonRegistrate.forEach(function(d){ console.log('  ✗ ' + d.nome); });
  }

  console.log('\n' + esiti.length + ' voci · ' + difetti.length + ' difetti · ' +
              deviazioni.length + ' deviazioni dichiarate · ' +
              nonRegistrate.length + ' non registrate');
  console.log(esito ? '✓ CONFORME' : '✗ NON CONFORME');
  process.exit(esito ? 0 : 1);
})();
