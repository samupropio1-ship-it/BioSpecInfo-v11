#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   VERIFICA DI SICUREZZA — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   Il documento 08 (matrice di tracciabilita') dichiarava che i requisiti di
   sicurezza SEC-01 e SEC-03 erano coperti solo da "ispezione documentale" —
   cioe' da qualcuno che guarda. Un'ispezione che dipende dall'attenzione di
   chi la fa non si ripete uguale due volte, e non si puo' mettere in un
   rapporto di evidenza.

   Questo banco li rende automatici. Controlla i file TRACCIATI da git: una
   chiave lasciata in un file ignorato non e' un bel vedere, ma non e'
   pubblicata; una in un file tracciato finisce su GitHub, e i bot che lo
   scandagliano la trovano in poche ore.

   USO   node tools/verifica-sicurezza.js
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RADICE = path.resolve(__dirname, '..');
let ok = 0, ko = 0;

function att(desc, atteso, avuto){
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + desc); }
  else { ko++; console.log('  ✗ ' + desc + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

/* Solo i file tracciati: sono quelli che vengono pubblicati. */
function fileTracciati(){
  try {
    return execSync('git ls-files', { cwd: RADICE, encoding: 'utf8' })
      .split('\n').filter(Boolean)
      .filter(f => !/node_modules|\.(png|jpg|jpeg|gif|wasm|glb|pdf|ico|zip)$/i.test(f))
      .filter(f => { try { return fs.statSync(path.join(RADICE, f)).size < 6 * 1024 * 1024; }
                     catch (e) { return false; } });
  } catch (e) { return []; }
}

/* Forme reali delle chiavi dei fornitori usati dal progetto. Sono prefissi
   specifici, non "sequenze lunghe": cercare 40 caratteri a caso troverebbe
   ogni hash, ogni impronta SHA-256 e ogni stringa base64 del repository. */
const FORME = [
  { nome: 'OpenAI / OpenRouter', re: /\bsk-(?:proj-|or-v1-)?[A-Za-z0-9_-]{32,}/g },
  { nome: 'Anthropic',           re: /\bsk-ant-[A-Za-z0-9_-]{32,}/g },
  { nome: 'Groq',                re: /\bgsk_[A-Za-z0-9]{40,}/g },
  { nome: 'Google AI',           re: /\bAIza[A-Za-z0-9_-]{30,}/g },
  { nome: 'xAI',                 re: /\bxai-[A-Za-z0-9]{40,}/g },
  { nome: 'NVIDIA NIM',          re: /\bnvapi-[A-Za-z0-9_-]{40,}/g },
  { nome: 'GitHub token',        re: /\bgh[pousr]_[A-Za-z0-9]{36,}/g },
  { nome: 'Chiave privata PEM',  re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
];

/* I banchi di prova usano chiavi FINTE di proposito: servono a verificare
   che l'app le tratti come chiavi. Riconoscerle evita falsi allarmi senza
   indebolire il controllo — sono stringhe che nessun fornitore emetterebbe. */
const FINTE = /gsk_finta|gsk_BUONA|gsk_SBAGLIATA|gsk_X|zkey-X|AIza_BUONA|sk-test|chiave-finta|esempio|EXAMPLE|xxxxx|\.\.\./i;

console.log('Verifica di sicurezza\n');
const file = fileTracciati();
console.log('File tracciati esaminati: ' + file.length + '\n');

/* ── SEC-01: nessuna chiave API nei file pubblicati ── */
console.log('── SEC-01 · Chiavi API nei file tracciati ──');
const trovate = [];
file.forEach(function(f){
  let testo;
  try { testo = fs.readFileSync(path.join(RADICE, f), 'utf8'); } catch (e) { return; }
  FORME.forEach(function(forma){
    const m = testo.match(forma.re);
    if (!m) return;
    m.forEach(function(v){
      if (FINTE.test(v)) return;
      trovate.push({ file: f, tipo: forma.nome, frammento: v.slice(0, 12) + '…' });
    });
  });
});
att('nessuna chiave API in un file pubblicato', 0, trovate.length);
trovate.slice(0, 10).forEach(t =>
  console.log('      ! ' + t.file + ' — ' + t.tipo + ' (' + t.frammento + ')'));

/* ── SEC-01b: il file di configurazione del proxy non contiene segreti ── */
console.log('\n── SEC-01b · Configurazione del proxy ──');
let toml = '';
try { toml = fs.readFileSync(path.join(RADICE, 'proxy', 'wrangler.toml'), 'utf8'); } catch (e) {}
att('wrangler.toml esiste', true, toml.length > 0);
// Una chiave scritta li' finirebbe su GitHub: il file e' versionato.
const segretiNelToml = FORME.some(f => { f.re.lastIndex = 0; const m = toml.match(f.re);
                                         return m && m.some(v => !FINTE.test(v)); });
att('non contiene chiavi', false, segretiNelToml);
att('avverte di usare wrangler secret put', true, /secret put/.test(toml));

/* ── SEC-03: nessuna password in chiaro ── */
console.log('\n── SEC-03 · Password in chiaro ──');
const passwordChiaro = [];
file.forEach(function(f){
  let testo;
  try { testo = fs.readFileSync(path.join(RADICE, f), 'utf8'); } catch (e) { return; }
  // assegnazioni del tipo password = "qualcosa" con un valore non vuoto e
  // non evidentemente segnaposto
  const re = /(?:password|passwd|pwd)\s*[:=]\s*['"]([^'"\s]{4,})['"]/gi;
  let m;
  while ((m = re.exec(testo)) !== null) {
    const v = m[1];
    if (/^(\*+|x+|\.+|…|esempio|example|placeholder|tua-?password|inserisci)/i.test(v)) continue;
    if (/^[a-f0-9]{64}$/i.test(v)) continue;          // gia' un hash SHA-256: corretto
    passwordChiaro.push(f + ' → ' + v.slice(0, 4) + '…');
  }
});
att('nessuna password in chiaro nel codice', 0, passwordChiaro.length);
passwordChiaro.slice(0, 6).forEach(p => console.log('      ! ' + p));

// che l'hash ci sia davvero, e sia della forma giusta
let fm = '';
try { fm = fs.readFileSync(path.join(RADICE, 'file_manager.html'), 'utf8'); } catch (e) {}
att('il File Manager confronta un hash SHA-256', true, /[a-f0-9]{64}/.test(fm));

/* ── SEC-05: nessun endpoint di telemetria attivo senza consenso ── */
console.log('\n── SEC-05 · Telemetria ──');
let idx = '';
try { idx = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8'); } catch (e) {}
const tel = idx.match(/BSI_TELEMETRY_URL\s*=\s*'([^']*)'/);
att('la variabile di telemetria esiste', true, !!tel);
att('ed è vuota (nessun invio remoto)', '', tel ? tel[1] : '(assente)');

/* ── SEC-06: nessun codice eseguibile da domini esterni ── */
console.log('\n── SEC-06 · Script da domini esterni ──');
const esterni = [];
['index.html', 'astro.html', 'chimorga.html', 'rdkit_lab.html', 'accademia.html',
 'pro.html', 'sr_completo.html', 'sr_essenziale.html', 'simulazioni.html',
 'file_manager.html'].forEach(function(f){
  let t;
  try { t = fs.readFileSync(path.join(RADICE, f), 'utf8'); } catch (e) { return; }
  const re = /<script[^>]*\ssrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
  let m;
  while ((m = re.exec(t)) !== null) esterni.push(f + ' → ' + m[1]);
});
/* Caricare codice da un dominio di terzi significa che chi controlla quel
   dominio puo' eseguire qualunque cosa nella pagina — e che senza rete
   l'app non parte. Tutte le librerie sono incluse nel repository. */
att('nessuno script caricato da un dominio esterno', 0, esterni.length);
esterni.slice(0, 6).forEach(e => console.log('      ! ' + e));

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
process.exit(ko ? 1 : 0);
