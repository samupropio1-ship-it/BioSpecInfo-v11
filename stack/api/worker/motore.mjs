/* ═══════════════════════════════════════════════════════════════════════════
   motore.mjs — il MOTORE DELL'APPLICAZIONE, eseguito fuori dal browser

   PERCHE' NON C'E' UNA VERSIONE PYTHON

   La strada ovvia, per dare a un'API in Python la predizione NMR, è
   riscrivere il motore in Python. È anche la strada sbagliata: diventano due
   programmi che fanno la stessa cosa, uno riceve le correzioni e l'altro no,
   e dopo sei mesi danno due numeri diversi per la stessa molecola. Chi guarda
   non sa quale credere, e la risposta onesta è «nessuno dei due».

   RDKit ha una compilazione WebAssembly che gira anche in Node, non solo nel
   browser. Quindi qui non si riscrive niente: si caricano gli STESSI FILE che
   l'applicazione serve ai suoi utenti — `bsi-pretsch.js`, `bsi-nmr.js`,
   `bsi-geom3d.js`, `bsi-nmr2d.js` — e si risponde alle richieste che arrivano
   dall'API. Una correzione a quei file arriva a tutti e due nello stesso
   istante, perché i file sono gli stessi file.

   Quei moduli si attaccano a `globalThis` e non toccano il DOM nelle funzioni
   di calcolo: il disegno su tela sta in funzioni separate, che qui non si
   chiamano.

   PROTOCOLLO

   Una richiesta JSON per riga su stdin, una risposta JSON per riga su stdout.
   Niente HTTP: di quello si occupa FastAPI, che è il pezzo rivolto al mondo.
   ═══════════════════════════════════════════════════════════════════════════ */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { runInThisContext } from 'vm';
import path from 'path';
import readline from 'readline';

const require = createRequire(import.meta.url);
const RADICE = process.env.BSI_RADICE ||
  path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');

const MODULI = ['bsi-pretsch.js', 'bsi-nmr.js', 'bsi-geom3d.js', 'bsi-nmr2d.js'];

const initRDKitModule = require(path.join(RADICE, 'RDKit_minimal.js'));
const RDKit = await initRDKitModule({
  locateFile: (f) => path.join(RADICE, f)
});
globalThis.__rdkit = RDKit;

/* Le impronte dei file caricati vengono restituite da /salute: è così che si
   può VERIFICARE che l'API stia usando gli stessi file dell'applicazione, e
   non una copia dimenticata indietro. */
const impronte = {};
for (const nome of MODULI) {
  const via = path.join(RADICE, nome);
  const testo = readFileSync(via, 'utf8');
  impronte[nome] = createHash('sha256').update(testo).digest('hex').slice(0, 16);
  runInThisContext(testo, { filename: via });
}

function identita(smiles) {
  let mol = null;
  try { mol = RDKit.get_mol(String(smiles)); } catch (e) { return null; }
  if (!mol) return null;
  const out = { smiles: smiles };
  try { out.canonico = mol.get_smiles(); } catch (e) {}
  try { out.inchi = mol.get_inchi(); } catch (e) {}
  try {
    if (out.inchi && typeof RDKit.get_inchikey_for_inchi === 'function') {
      out.chiave = RDKit.get_inchikey_for_inchi(out.inchi);
    }
  } catch (e) {}
  try {
    const d = JSON.parse(mol.get_descriptors());
    out.peso = d.amw; out.esatto = d.exactmw;
    out.logp = d.CrippenClogP; out.tpsa = d.tpsa;
  } catch (e) {}
  /* La formula bruta NON sta fra i descrittori di questa compilazione di
     RDKit — `get_descriptors()` restituisce pesi, logP, TPSA e conteggi, non
     la formula. Si ricava dall'InChI, che per costruzione comincia con lo
     strato di formula: `InChI=1S/C4H8O2/...`. */
  try {
    const f = (out.inchi || '').match(/^InChI=1S?\/([A-Za-z0-9]+)/);
    out.formula = f ? f[1] : '';
  } catch (e) { out.formula = ''; }
  try { mol.delete(); } catch (e) {}
  return out;
}

const AZIONI = {
  salute: () => ({
    rdkit: RDKit.version ? RDKit.version() : null,
    moduli: impronte,
    radice: RADICE
  }),
  identita: (p) => identita(p.smiles),
  nmr: (p) => globalThis.BSINMR.predici(p.smiles, { nucleo: p.nucleo || '13C' }),
  nmr2d: (p) => globalThis.BSINMR2D.prevedi(p.smiles, { tipo: p.tipo || 'HSQC' }),
  geometria: (p) => globalThis.BSIGeom3D.coordina(p.smiles, p.opzioni || {}),
  struttura: (p) => ({
    svg: globalThis.BSINMR.strutturaConAtomi(p.smiles, p.atomi || [],
                                             p.larghezza || 420, p.altezza || 300)
  })
};

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (riga) => {
  if (!riga.trim()) return;
  let richiesta;
  try { richiesta = JSON.parse(riga); }
  catch (e) { process.stdout.write(JSON.stringify({ errore: 'richiesta illeggibile' }) + '\n'); return; }
  const fn = AZIONI[richiesta.azione];
  if (!fn) {
    process.stdout.write(JSON.stringify({
      id: richiesta.id, errore: 'azione sconosciuta: ' + richiesta.azione }) + '\n');
    return;
  }
  let esito;
  try { esito = fn(richiesta.parametri || {}); }
  catch (e) { esito = { errore: (e && e.message) ? e.message : String(e) }; }
  /* Un `null` va dichiarato: chi riceve deve distinguere «non è una molecola»
     da «il motore non ha risposto». */
  process.stdout.write(JSON.stringify({
    id: richiesta.id,
    risultato: esito === undefined ? null : esito,
    nullo: esito === null
  }) + '\n');
});

process.stdout.write(JSON.stringify({ pronto: true, moduli: impronte }) + '\n');
