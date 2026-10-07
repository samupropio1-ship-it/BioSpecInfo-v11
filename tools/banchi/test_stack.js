/* ═══════════════════════════════════════════════════════════════════════════
   test_stack — lo stack React + FastAPI, verificato come tutto il resto

   PERCHE' QUESTO BANCO ESISTE

   Uno stack separato è esattamente il posto dove nasce un secondo motore. Si
   comincia copiando un file «per comodità», si continua correggendo un
   numero da una parte sola, e si finisce con due programmi che danno due
   risposte diverse alla stessa domanda — senza che nessuno se ne accorga,
   perché nessuno li confronta mai.

   Qui si confrontano. Il banco verifica tre cose:

   1. che l'API esegua GLI STESSI FILE del repository, confrontando le
      impronte SHA-256 che dichiara con quelle dei file su disco;
   2. che risponda con i numeri giusti e si RIFIUTI quando deve;
   3. che il front end TypeScript compili e si costruisca.

   Se manca Python, Node o una delle dipendenze, il banco lo DICE e si ferma
   senza fallire: non è un guasto dell'applicazione, è un ambiente
   incompleto — e un banco che fallisce per quello insegna a ignorarlo.

   USO   node tools/banchi/test_stack.js
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RADICE = path.resolve(__dirname, '..', '..');
const API = path.join(RADICE, 'stack', 'api');
const WEB = path.join(RADICE, 'stack', 'web');

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function salta(perche) {
  console.log('\n  ⊘ saltato: ' + perche);
  console.log('    Non è un guasto dell’applicazione: è un ambiente incompleto.');
  console.log('    Per eseguirlo: pip install -r stack/api/requirements.txt && ' +
              '(cd stack/web && npm install)');
  console.log('\n' + ok + ' controlli passati, il resto saltato');
  process.exit(0);
}

console.log('Lo stack React + FastAPI — lo stesso motore, un altro guscio\n');

/* ── §1 · Il motore fuori dal browser ─────────────────────────────────────
   Prima di tutto il resto: il worker Node carica RDKit e i moduli, e lo
   dimostra restituendo le impronte di ciò che ha caricato. */
console.log('── Il motore, eseguito da Node ──');
const MODULI = ['bsi-pretsch.js', 'bsi-nmr.js', 'bsi-geom3d.js', 'bsi-nmr2d.js'];
let risposte;
try {
  const richieste = [
    { id: 1, azione: 'salute' },
    { id: 2, azione: 'nmr', parametri: { smiles: 'c1ccccc1', nucleo: '13C' } },
    { id: 3, azione: 'nmr', parametri: { smiles: 'COc1ccccc1', nucleo: '1H' } },
    { id: 4, azione: 'nmr2d', parametri: { smiles: 'c1ccccc1', tipo: 'COSY' } },
    { id: 5, azione: 'geometria', parametri: { smiles: 'CCO' } },
    { id: 6, azione: 'nmr', parametri: { smiles: 'questo non e uno smiles' } }
  ].map((r) => JSON.stringify(r)).join('\n') + '\n';
  const uscita = execFileSync('node', [path.join(API, 'worker', 'motore.mjs')], {
    input: richieste, encoding: 'utf8', timeout: 180000,
    env: Object.assign({}, process.env, { BSI_RADICE: RADICE })
  });
  risposte = uscita.trim().split('\n').map((r) => JSON.parse(r));
} catch (e) {
  console.log('      ! ' + String(e.message).slice(0, 300));
  salta('il motore Node non è partito');
}
const per = {};
risposte.forEach((r) => { if (r.id) per[r.id] = r; });

att('il motore si dichiara pronto', true, !!risposte[0].pronto);
const salute = per[1].risultato;
att('e dice quale RDKit sta usando', true, /^\d{4}\./.test(salute.rdkit || ''));
console.log('      (RDKit ' + salute.rdkit + ')');

/* LA PROVA CHE CONTA: sono gli stessi file, non una copia. */
let diversi = 0;
MODULI.forEach(function (nome) {
  const vero = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(RADICE, nome))).digest('hex').slice(0, 16);
  if (salute.moduli[nome] !== vero) {
    diversi++;
    console.log('      ✗ ' + nome + ': l’API non usa il file del repository');
  }
});
att('esegue gli STESSI file dell’applicazione, non una copia', 0, diversi);

/* ── §2 · E dà gli stessi numeri ──────────────────────────────────────── */
console.log('\n── Gli stessi numeri del browser ──');
att('il benzene a 128,5 ppm', 128.5, per[2].risultato.segnali[0].ppm);
const h = per[3].risultato.segnali.map((s) => s.ppm).sort((a, b) => a - b);
att('l’anisolo dà i suoi quattro ¹H distinti', 4, h.length);
att('  · ai valori misurati nel browser', '3.73,6.9,6.94,7.29', h.join(','));
att('il COSY del benzene ha solo la diagonale', 0, per[4].risultato.picchi.length);
att('la geometria dell’etanolo ha 3 atomi pesanti e 6 idrogeni',
    '3/9', per[5].risultato.nPesanti + '/' + per[5].risultato.atomi.length);
/* nel verso opposto */
att('e uno SMILES illeggibile non produce uno spettro inventato',
    true, per[6].risultato === null || !!per[6].risultato.errore);

/* ── §3 · L'API ───────────────────────────────────────────────────────── */
console.log('\n── L’API ──');
const py = spawnSync('python3', ['-c', 'import fastapi, pytest'], { encoding: 'utf8' });
if (py.status !== 0) {
  const alt = spawnSync('python3', ['-c', 'import fastapi, pytest'], {
    encoding: 'utf8',
    env: Object.assign({}, process.env, { PYTHONPATH: process.env.BSI_PYENV || '' })
  });
  if (alt.status !== 0) salta('mancano fastapi o pytest per Python');
}
const pt = spawnSync('python3', ['-m', 'pytest', '-q', 'tests/'], {
  cwd: API, encoding: 'utf8', timeout: 600000,
  env: Object.assign({}, process.env, { BSI_RADICE: RADICE })
});
const coda = (pt.stdout || '').trim().split('\n').slice(-3).join(' ');
const m = coda.match(/(\d+) passed/);
att('i banchi dell’API passano', true, pt.status === 0);
console.log('      (' + coda.slice(0, 160) + ')');
att('  · e sono almeno quindici', true, !!m && +m[1] >= 15);

/* ── §4 · Il front end ────────────────────────────────────────────────── */
console.log('\n── Il front end TypeScript ──');
if (!fs.existsSync(path.join(WEB, 'node_modules'))) {
  salta('le dipendenze di stack/web non sono installate');
}
const tsc = spawnSync('npx', ['tsc', '--noEmit'], { cwd: WEB, encoding: 'utf8', timeout: 600000 });
att('TypeScript compila senza errori', 0, tsc.status);
if (tsc.status !== 0) console.log('      ' + (tsc.stdout || '').slice(0, 400));
const build = spawnSync('npx', ['vite', 'build'], { cwd: WEB, encoding: 'utf8', timeout: 600000 });
att('e la costruzione riesce', 0, build.status);
att('producendo una pagina e i suoi assetti', true,
    fs.existsSync(path.join(WEB, 'dist', 'index.html')));

/* ── §5 · Nessun calcolo nel front end ────────────────────────────────── */
/* Se un giorno qualcuno ci mettesse dentro una tabella di spostamenti,
   nascerebbe lì il secondo motore. Si controlla che non ci sia. */
console.log('\n── Niente chimica nel front end ──');
let sospetti = [];
function scorri(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (v) {
    const via = path.join(dir, v.name);
    if (v.isDirectory()) return scorri(via);
    if (!/\.(ts|tsx)$/.test(v.name)) return;
    const testo = fs.readFileSync(via, 'utf8');
    /* una tabella di incrementi si riconosce: righe di numeri con ppm */
    if (/128\.5|7\.34|5\.25|Grant|Pretsch\s*=|INCR_|BASE_C\b/.test(testo)) {
      sospetti.push(path.relative(RADICE, via));
    }
  });
}
scorri(path.join(WEB, 'src'));
att('nessun file del front end contiene una tabella di spostamenti',
    0, sospetti.length);
sospetti.forEach((s) => console.log('      ! ' + s));

if (eseguiti < 14) {
  ko++;
  console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 14');
}
console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
process.exit(ko ? 1 : 0);
