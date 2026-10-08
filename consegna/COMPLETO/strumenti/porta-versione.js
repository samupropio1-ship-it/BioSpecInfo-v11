#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   PORTA-VERSIONE — il cambio di versione, fatto dove va fatto e basta

   PERCHE' ESISTE

   Alzare la versione sembra l'operazione piu' innocua del mondo: si cerca
   `bsi-v190` e si scrive `bsi-v191`. Per tre versioni di fila e' stato fatto
   cosi', e ogni volta ha riscritto anche delle FRASI STORICHE — frasi che
   raccontano un fatto accaduto a una versione passata.

   Il risultato, trovato leggendo i documenti uno per uno:

     · «La password e' stata cambiata alla versione bsi-v191» — falso: alla
       v188. Sta in una dichiarazione di conformita' firmata.
     · «ha spostato quel tag al commit della bsi-v191» — falso, e descrive un
       incidente avvenuto mesi prima.
     · «Le trentasei voci aggiunte in bsi-v191» — erano della v188.
     · «incrementa CACHE (es. bsi-v191 → bsi-v191)» — un esempio che mostra
       una cosa uguale a se stessa.

   Nessun controllo poteva accorgersene: tutte quelle righe citano una
   versione che ESISTE, in un documento che descrive quella versione. Il
   difetto non era nei documenti, era nel MODO di aggiornarli.

   COSA FA QUESTO PROGRAMMA

   Tocca SOLO le righe che DICHIARANO la versione corrente, riconosciute una
   per una da uno schema esplicito: la riga di intestazione, il piede del
   documento, il distintivo del README, il nome dei pacchetti, le due righe
   di codice. Tutto il resto lo LASCIA STARE, e lo ELENCA: se una riga cita
   la vecchia versione e non e' una dichiarazione, è una frase storica oppure
   un'omissione, e in tutti e due i casi la decisione è di chi legge — non di
   una sostituzione cieca.

   USO   node tools/porta-versione.js bsi-v192
         node tools/porta-versione.js bsi-v192 --prova    (non scrive niente)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RADICE = path.resolve(__dirname, '..');
const nuova = process.argv[2];
const prova = process.argv.includes('--prova');

if (!nuova || !/^bsi-v\d{3}$/.test(nuova)) {
  console.error('Uso: node tools/porta-versione.js bsi-vNNN [--prova]');
  process.exit(2);
}

/* la versione corrente la dice il codice, non un argomento: se qualcuno la
   passasse sbagliata, il programma riscriverebbe la cosa sbagliata */
function versioneCorrente() {
  const sw = fs.readFileSync(path.join(RADICE, 'sw.js'), 'utf8');
  const m = sw.match(/CACHE\s*=\s*'(bsi-v\d{3})'/);
  if (!m) { console.error('non trovo CACHE in sw.js'); process.exit(2); }
  return m[1];
}
const vecchia = versioneCorrente();

if (vecchia === nuova) {
  console.error(`la versione è già ${nuova}: niente da fare`);
  process.exit(2);
}
const n = Number(nuova.slice(5)), v = Number(vecchia.slice(5));
if (n <= v) {
  console.error(`${nuova} non viene dopo ${vecchia}: una versione non torna indietro`);
  process.exit(2);
}

/* ── Gli schemi che RICONOSCONO una dichiarazione ─────────────────────────
   Ognuno descrive una riga che dice «questo documento descrive la versione
   X», non una che racconta che cosa è successo alla versione X. La
   differenza è tutta qui, e per questo gli schemi sono scritti per intero
   invece di cercare il solo numero. */
const V = vecchia.replace(/[-]/g, '\\-');
/* Ogni schema porta con sé la PROPRIA sostituzione.

   Prima la sostituzione era una sola, scelta al volo guardando il testo
   dell'espressione regolare — e al primo uso vero ha rotto il distintivo del
   README: shields.io scrive un trattino letterale come `--`, quindi il
   distintivo dice `bsi--v191`, e il controllo che sceglieva la forma giusta
   cercava nel sorgente della regex una stringa che non c'era. È uscito
   `versione-bsi-v192`, che shields.io legge come un'altra cosa, e il
   distintivo è sparito.
   L'ha trovato `verifica-affermazioni`, che confronta il distintivo con il
   codice: è il motivo per cui quel controllo esiste. */
const SCHEMI = [
  /* intestazioni: | **Versione** | `bsi-vNNN` | */
  [new RegExp('(\\|\\s*\\*\\*(?:Versione|Versione documentata|Versione descritta|' +
              'Version|Documented version|Version described)\\*\\*\\s*\\|[^|\\n]*?)' + V, 'g'),
   '$1' + nuova],
  [new RegExp('(\\|\\s*(?:Versione applicazione|Application version)\\s*\\|[^|\\n]*?)' + V, 'g'),
   '$1' + nuova],
  /* pieghe finali: _Documento aggiornato alla versione `bsi-vNNN`._ */
  [new RegExp('((?:_|)(?:Documento aggiornato alla versione|' +
              'Document updated to version|Indice aggiornato alla versione|' +
              'Guida aggiornata alla versione|Guide updated to version|' +
              'Archivio prodotto alla versione|Archive produced at version|' +
              'Versione|Version)\\s+`?)' + V, 'g'),
   '$1' + nuova],
  /* il distintivo del README: shields.io scrive il trattino raddoppiato */
  [new RegExp('(versione-)bsi\\-\\-v' + vecchia.slice(5), 'g'),
   '$1bsi--v' + nuova.slice(5)],
  /* i nomi dei pacchetti di consegna */
  [new RegExp('(BioSpecInfo-(?:AZIENDA|TESI|COMPLETO)-)' + V, 'g'), '$1' + nuova],
  /* il titolo dell'archivio e la dichiarazione di conformità */
  [new RegExp('(# BioSpecInfo — archivio completo `)' + V, 'g'), '$1' + nuova],
  [new RegExp('(Il sottoscritto dichiara che la versione `)' + V, 'g'), '$1' + nuova],
  [new RegExp('(The undersigned declares that version `)' + V, 'g'), '$1' + nuova],
  [new RegExp('(state at version `)' + V, 'g'), '$1' + nuova],
  [new RegExp('(stato alla versione `)' + V, 'g'), '$1' + nuova],
  /* lo SBOM in JSON */
  [new RegExp('("version":\\s*")' + V, 'g'), '$1' + nuova]
];

const CODICE = [
  ['index.html', new RegExp("(BSI_APP_VERSION\\s*=\\s*')" + V), '$1' + nuova],
  ['sw.js', new RegExp("(CACHE\\s*=\\s*')" + V), '$1' + nuova]
];

function tracciati() {
  return execSync('git ls-files', { cwd: RADICE, encoding: 'utf8' })
    .split('\n').filter(Boolean)
    .filter((f) => /\.(md|json|html|js)$/.test(f))
    .filter((f) => !f.startsWith('consegna/'))
    .filter((f) => f !== 'CHANGELOG.md');          /* il changelog è storia */
}

let cambiate = 0, toccati = 0;
const restano = [];

tracciati().forEach(function (rel) {
  const via = path.join(RADICE, rel);
  let testo;
  try { testo = fs.readFileSync(via, 'utf8'); } catch (e) { return; }
  if (testo.indexOf(vecchia) < 0) return;
  let nuovo = testo;

  SCHEMI.forEach(function (coppia) {
    nuovo = nuovo.replace(coppia[0], coppia[1]);
  });
  CODICE.forEach(function (c) {
    if (rel !== c[0]) return;
    nuovo = nuovo.replace(c[1], c[2]);
  });

  if (nuovo !== testo) {
    toccati++;
    cambiate += (testo.split(vecchia).length - 1) - (nuovo.split(vecchia).length - 1);
    if (!prova) fs.writeFileSync(via, nuovo, 'utf8');
  }
  /* ciò che RESTA con la vecchia versione: non è un residuo da ripulire, è
     una frase che parla del passato. Si elenca perché chi pubblica la
     legga, non perché la sostituisca. */
  nuovo.split('\n').forEach(function (riga, i) {
    if (riga.indexOf(vecchia) >= 0) {
      restano.push(rel + ':' + (i + 1) + '  ' + riga.trim().slice(0, 150));
    }
  });
});

console.log((prova ? 'PROVA — ' : '') + vecchia + ' → ' + nuova);
console.log('  ' + cambiate + ' dichiarazioni aggiornate in ' + toccati + ' file');

if (restano.length) {
  console.log('\n  Queste righe citano ancora ' + vecchia + ' e NON sono state toccate.');
  console.log('  Quasi sempre è giusto così: raccontano che cosa è successo a');
  console.log('  quella versione, e riscriverle le renderebbe false. Leggile.\n');
  restano.forEach((r) => console.log('    · ' + r));
} else {
  console.log('\n  Nessuna riga cita più ' + vecchia + '.');
}

if (!prova) {
  /* L'ORDINE CONTA, e prima era sbagliato: «pacchetti && pdf» imbustava i PDF
     della versione PRECEDENTE — testo nuovo e impaginato vecchio nello stesso
     pacchetto. I PDF si fanno PRIMA, i pacchetti DOPO; `genera-pacchetti`
     adesso se ne accorge da sé e si ferma, ma il suggerimento non deve
     portare nella buca. */
  console.log('\n  Ora, in quest’ordine:');
  console.log('    node tools/genera-sbom.js');
  console.log('    node tools/genera-evidenza.js     (la batteria: serve un server su :8899)');
  console.log('    node tools/genera-pdf.js          (prima i PDF…)');
  console.log('    node tools/genera-pacchetti.js    (…poi i pacchetti che li imbustano)');
}
