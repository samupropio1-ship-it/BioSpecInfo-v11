#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   VERIFICA DELLA DOCUMENTAZIONE — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   Una documentazione che rimanda a file inesistenti, o che cita numeri di
   versione che nessuno ha piu' aggiornato, smette di essere documentazione e
   diventa un'affermazione non verificabile — il difetto che tutto il resto di
   questo lavoro cerca di evitare.

   Questo controllo verifica che:
     · ogni collegamento relativo punti a un file che esiste;
     · la versione citata nei documenti coincida con quella del codice;
     · i documenti dichiarati nell'indice esistano davvero, e viceversa;
     · gli strumenti citati siano presenti ed eseguibili.

   USO   node tools/verifica-documenti.js
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..');
let ok = 0, ko = 0;

function att(desc, atteso, avuto){
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + desc); }
  else { ko++; console.log('  ✗ ' + desc + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

function versioneCodice(){
  const m = fs.readFileSync(path.join(RADICE, 'sw.js'), 'utf8').match(/CACHE\s*=\s*'([^']+)'/);
  return m ? m[1] : null;
}

/* Raccoglie i documenti Markdown del progetto, escludendo le traduzioni e i
   generati (che si rigenerano, non si correggono a mano). */
function documenti(){
  const out = [];
  const guarda = (dir, prof) => {
    if (prof > 2) return;
    for (const f of fs.readdirSync(path.join(RADICE, dir), { withFileTypes: true })) {
      const rel = path.join(dir, f.name);
      if (f.isDirectory()) {
        if (/node_modules|\.git|^docs\/(en|pdf|candidatura)$/.test(rel)) continue;
        guarda(rel, prof + 1);
      } else if (f.name.endsWith('.md')) out.push(rel);
    }
  };
  out.push('README.md', 'DOCUMENTATION.md', 'CHANGELOG.md');
  guarda('docs', 0);
  guarda('proxy', 0);
  return out.filter((v, i, a) => a.indexOf(v) === i)
            .filter(f => fs.existsSync(path.join(RADICE, f)));
}

console.log('Verifica della documentazione\n');

const ver = versioneCodice();
console.log('Versione del codice (sw.js): ' + ver + '\n');

/* ── 1. i collegamenti relativi puntano a file esistenti ── */
console.log('── Collegamenti interni ──');
const rotti = [];
documenti().forEach(function(doc){
  const testo = fs.readFileSync(path.join(RADICE, doc), 'utf8');
  const dir = path.dirname(path.join(RADICE, doc));
  const re = /\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)/g;
  let m;
  while ((m = re.exec(testo)) !== null) {
    const dest = m[1];
    if (/^(https?:|mailto:|#)/.test(dest)) continue;
    const p = path.resolve(dir, decodeURI(dest));
    if (!fs.existsSync(p)) rotti.push(doc + ' → ' + dest);
  }
});
att('nessun collegamento interno rotto', 0, rotti.length);
rotti.slice(0, 12).forEach(r => console.log('      ! ' + r));

/* ── 2. la versione citata coincide con quella del codice ── */
console.log('\n── Versione dichiarata nei documenti ──');
const disallineati = [];
documenti().forEach(function(doc){
  const testo = fs.readFileSync(path.join(RADICE, doc), 'utf8');
  const versioni = [...new Set((testo.match(/bsi-v\d+/g) || []))];
  // Il changelog cita di proposito tutte le versioni passate.
  /* I documenti GENERATI sono fotografie di un'esecuzione: dichiarano la
     versione a cui sono stati prodotti, ed e' corretto che sia cosi'. In piu'
     il rapporto di verifica viene scritto DOPO i controlli, quindi durante la
     batteria conterrebbe sempre la versione precedente: controllarlo li'
     sarebbe circolare, e faceva fallire la verifica a ogni cambio di
     versione. Che il rapporto sia aggiornato si vede dal commit che dichiara,
     non dal numero di versione. */
  if (/CHANGELOG|RAPPORTO-VERIFICA|07-SBOM/.test(doc)) return;
  const altre = versioni.filter(v => v !== ver);
  if (altre.length) disallineati.push(doc + ' cita ' + altre.join(', '));
});
att('nessun documento cita una versione superata', 0, disallineati.length);
disallineati.forEach(d => console.log('      ! ' + d));

/* ── 3. index.html dichiara la stessa versione di sw.js ── */
console.log('\n── Le due righe della versione ──');
const idx = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8')
  .match(/BSI_APP_VERSION\s*=\s*'([^']+)'/);
att('BSI_APP_VERSION coincide con CACHE', ver, idx ? idx[1] : '(non trovata)');

/* ── 4. gli strumenti citati esistono ── */
console.log('\n── Strumenti citati ──');
['tools/genera-evidenza.js', 'tools/genera-sbom.js', 'tools/verifica-farmaci.js',
 'docs/evidence/deviazioni-note.json', 'docs/evidence/sbom.cdx.json',
 'docs/evidence/RAPPORTO-VERIFICA.md'].forEach(function(f){
  att('esiste ' + f, true, fs.existsSync(path.join(RADICE, f)));
});

/* ── 5. l'indice elenca tutti i documenti numerati, e solo quelli ── */
console.log('\n── Coerenza dell\'indice ──');
const indice = fs.readFileSync(path.join(RADICE, 'DOCUMENTATION.md'), 'utf8');
const suDisco = fs.readdirSync(path.join(RADICE, 'docs'))
  .filter(f => /^\d\d-.*\.md$/.test(f)).sort();
const nonIndicizzati = suDisco.filter(f => indice.indexOf(f) < 0);
att('ogni documento numerato è nell\'indice', 0, nonIndicizzati.length);
nonIndicizzati.forEach(f => console.log('      ! ' + f + ' non compare in DOCUMENTATION.md'));
console.log('      (' + suDisco.length + ' documenti numerati)');

/* ── 6. il registro delle deviazioni e' leggibile e motivato ── */
console.log('\n── Registro delle deviazioni ──');
try {
  const reg = JSON.parse(fs.readFileSync(
    path.join(RADICE, 'docs', 'evidence', 'deviazioni-note.json'), 'utf8'));
  let senzaMotivo = 0, totali = 0;
  ['farmaci_senza_struttura', 'farmaci_biologici'].forEach(function(k){
    (reg[k] && reg[k].voci ? reg[k].voci : []).forEach(function(v){
      totali++;
      if (!v.motivo || v.motivo.length < 10) senzaMotivo++;
    });
  });
  att('ogni deviazione porta un motivo scritto', 0, senzaMotivo);
  console.log('      (' + totali + ' deviazioni registrate)');
} catch (e) {
  ko++; console.log('  ✗ registro non leggibile: ' + e.message);
}

/* ── 7. la matrice di tracciabilita' non si contraddice ──
   Un identificativo di requisito e' una promessa: «questa cosa specifica e'
   verificata da questo banco specifico». Se lo stesso identificativo compare
   due volte, una delle due promesse e' falsa e non si sa quale. Ed e'
   successo davvero: SCI-10 era insieme un requisito verificato al 100 % (la
   simmetria molecolare) e un requisito dichiarato NON verificato (sei
   strutture di farmaci). La tabella riassuntiva, intanto, sommava 36
   requisiti su 37 realmente definiti, perche' contava 9 requisiti
   scientifici quando ne erano stati scritti 10.

   Un errore di conteggio in una tabella di copertura non e' un dettaglio
   formale: e' la cifra che un valutatore legge per prima. */
console.log('\n── Matrice di tracciabilità ──');
try {
  const mat = fs.readFileSync(
    path.join(RADICE, 'docs', '08-Traceability-Matrix.md'), 'utf8');

  /* Gli identificativi definiti sono quelli in grassetto nella prima cella
     di una riga di tabella: `| **SCI-01** | ...`. Citarne uno nel testo non
     lo definisce. */
  const definiti = [];
  const re = /^\|\s*\*\*([A-Z]{2,4}-\d{2})\*\*\s*\|/gm;
  let m;
  while ((m = re.exec(mat)) !== null) definiti.push(m[1]);

  const doppioni = definiti.filter((v, i) => definiti.indexOf(v) !== i);
  att('nessun identificativo di requisito definito due volte', 0,
      [...new Set(doppioni)].length);
  [...new Set(doppioni)].forEach(d => console.log('      ! ' + d + ' definito più volte'));

  /* Il conteggio dichiarato nella tabella riassuntiva deve corrispondere a
     quanti identificativi esistono davvero nel documento. */
  const perFamiglia = {};
  definiti.forEach(function(d){
    const f = d.split('-')[0];
    perFamiglia[f] = (perFamiglia[f] || 0) + 1;
  });

  /* Le famiglie automatizzate sono quelle elencate nella tabella di §7, che
     le nomina esplicitamente: `| Scientifici (SCI-01…10) | 10 | 10 | ...` */
  let sommaDichiarata = 0, sommaReale = 0, disallineate = 0;
  const rTab = /^\|\s*[^|]*\(([A-Z]{2,4})-\d{2}…\d{2}\)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/gm;
  let r, famiglieLette = 0;
  while ((r = rTab.exec(mat)) !== null) {
    famiglieLette++;
    const fam = r[1], dichiarati = +r[2];
    /* i requisiti non automatizzati stanno in §6 e non appartengono al conteggio
       per famiglia: si contano gli identificativi della famiglia meno quelli
       elencati fra i non automatizzati */
    const nonAuto = (mat.split('## 6.')[1] || '').split('## 7.')[0] || '';
    const esclusi = (nonAuto.match(new RegExp('\\*\\*' + fam + '-\\d{2}\\*\\*', 'g')) || []).length;
    const reali = (perFamiglia[fam] || 0) - esclusi;
    sommaDichiarata += dichiarati;
    sommaReale += reali;
    if (dichiarati !== reali) {
      disallineate++;
      console.log('      ! ' + fam + ': la tabella dichiara ' + dichiarati +
                  ', nel documento ce ne sono ' + reali);
    }
  }

  /* Un controllo che non legge nessuna riga passerebbe comunque. */
  att('la tabella di copertura è stata letta', true, famiglieLette >= 5);
  att('ogni famiglia dichiara il numero di requisiti che ha davvero', 0, disallineate);

  const tot = mat.match(/\|\s*\*\*Totale automatizzato\*\*\s*\|\s*\*\*(\d+)\*\*/);
  att('il totale automatizzato coincide con la somma delle famiglie',
      sommaDichiarata, tot ? +tot[1] : '(assente)');
  console.log('      (' + definiti.length + ' identificativi definiti, ' +
              sommaReale + ' automatizzati)');
} catch (e) {
  ko++; console.log('  ✗ matrice non leggibile: ' + e.message);
}

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
process.exit(ko ? 1 : 0);
