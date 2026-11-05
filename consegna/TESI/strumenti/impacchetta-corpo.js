#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   impacchetta-corpo — il corpo di Spectra INCORPORATO nell'app

   PERCHE' ESISTE
   Richiesta dell'autore: il corpo di Spectra deve esserci sempre, per tutti,
   senza doverlo caricare. Il modello (il «Bounty Hunter», gratuito su CGTrader)
   ha la licenza Royalty Free di CGTrader: si puo' usare dentro un prodotto,
   purche' chi usa il prodotto non possa riprenderlo come file a se'. Per questo
   il modello NON si pubblica come .glb: questo programma lo trasforma in un
   blocco impacchettato (models/spectra-corpo.bsi) che solo il codice dell'app
   (bsi-spectra-figura.js) sa aprire, come fanno giochi e app con i modelli che
   incorporano. Non e' una protezione assoluta (nessun modello mostrato su uno
   schermo lo e'), ma il file non e' un modello scaricabile e riutilizzabile.

   FORMATO  «BSIC» (4 byte) · versione (1 byte) · lunghezza (4 byte, LE) ·
            i byte del .glb mescolati con un flusso pseudocasuale (xorshift32)
            dal seme SEME; la stessa funzione li rimette in ordine.

   USO   node tools/impacchetta-corpo.js <corpo.glb> [models/spectra-corpo.bsi]
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const SEME = 0x5bd1e995 ^ 0x5350_4543;   /* lo stesso in bsi-spectra-figura.js */
function mescola(buf, seme) {
  const out = Buffer.alloc(buf.length); let x = seme >>> 0 || 1;
  for (let i = 0; i < buf.length; i++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[i] = buf[i] ^ (x & 0xff); }
  return out;
}
const [ingresso, uscita = 'models/spectra-corpo.bsi'] = process.argv.slice(2);
if (!ingresso) { console.error('uso: node tools/impacchetta-corpo.js <corpo.glb> [uscita.bsi]'); process.exit(1); }
const glb = fs.readFileSync(ingresso);
if (glb.readUInt32LE(0) !== 0x46546c67) { console.error('non e\' un file .glb'); process.exit(1); }
const testa = Buffer.alloc(9); testa.write('BSIC', 0, 'ascii'); testa[4] = 1; testa.writeUInt32LE(glb.length, 5);
fs.writeFileSync(uscita, Buffer.concat([testa, mescola(glb, SEME)]));
/* la prova: si rimette in ordine e si confronta */
const letto = fs.readFileSync(uscita), di = mescola(letto.subarray(9), SEME);
if (!di.equals(glb)) { console.error('✗ verifica fallita'); process.exit(1); }
console.log('✓ ' + uscita + ' (' + (letto.length / 1048576).toFixed(2) + ' MB), verificato: si riapre identico al .glb');
