/* ═══════════════════════════════════════════════════════════════════════════
   audit_storia — nessuna credenziale in NESSUN punto della storia

   PERCHE' QUESTO BANCO ESISTE

   SEC-01 e' verificato da `verifica-sicurezza`, che esamina i file TRACCIATI:
   cioe' lo stato attuale. E' il controllo giusto per rispondere «oggi nel
   repository non c'e' nessuna chiave», ed e' insufficiente per la domanda che
   conta davvero su un repository pubblico.

   Una chiave inserita in un commit e togliata nel successivo passa
   `verifica-sicurezza` per sempre, e resta leggibile per sempre a chiunque
   cloni. Git non dimentica: il contenuto rimosso continua a esistere come
   oggetto raggiungibile dalla storia. Il rimedio, se succede, non e' un
   commit di correzione — e' revocare la chiave.

   Qui si esamina ogni VERSIONE di ogni file di testo mai entrata nel
   repository, non solo l'ultima.

   LA SUPERFICIE E' PARTE DELLA MISURA

   Questo e' esattamente il banco in cui un numero perfetto puo' nascere da
   meno superficie. Un clone superficiale — `--depth 1`, come quello che fa
   una sessione remota — contiene una frazione della storia: il banco
   girerebbe, non troverebbe niente e direbbe «nessuna credenziale in tutta
   la storia» avendone vista un decimo. Per questo si rifiuta di passare su
   un clone superficiale, e dichiara quante versioni ha esaminato.

   E GLI SCHEMI SI PROVANO PRIMA DI FIDARSI

   Uno schema sbagliato non trova niente ed e' indistinguibile da un
   repository pulito. Prima della ricerca ogni schema viene provato nei due
   versi: deve riconoscere un esempio costruito e deve RIFIUTARE un quasi-
   esempio. Fu cosi' che si capi' che `AKIA` da solo non e' uno schema:
   trovava 53 corrispondenze, tutte la stessa stringa `AKIAAAAAAAAAAAAAAAAA`
   — sedici «A» di fila, la zona di zeri di un'immagine in base64.

   USO   node tools/banchi/audit_storia.js       (non serve il server)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..', '..');

let ok = 0, ko = 0, eseguiti = 0;

function att(d, atteso, avuto){
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

/* ── Gli schemi, con il loro esempio e il loro quasi-esempio ───────────────
   L'esempio è costruito qui e non è una credenziale reale; il quasi-esempio
   è ciò che lo schema NON deve prendere. */
const SCHEMI = [
  { nome: 'chiave Google',
    re: /AIza[0-9A-Za-z_\-]{35}/,
    esempio: 'AIza' + 'B'.repeat(35),
    quasi:   'placeholder:"AIza...",' },
  { nome: 'chiave Anthropic',
    re: /sk-ant-api03-[0-9A-Za-z_\-]{20,}/,
    esempio: 'sk-ant-api03-' + 'C'.repeat(24),
    quasi:   'la tua API key Anthropic (sk-ant-...)' },
  { nome: 'chiave OpenAI',
    re: /sk-[A-Za-z0-9]{32,}/,
    esempio: 'sk-' + 'D'.repeat(40),
    quasi:   'sk-breve' },
  { nome: 'token GitHub',
    re: /(?:ghp|gho|ghu|ghs|ghr)_[0-9A-Za-z]{36}/,
    esempio: 'ghp_' + 'E'.repeat(36),
    quasi:   'ghp_corto' },
  { nome: 'token GitHub fine',
    re: /github_pat_[0-9A-Za-z_]{22,}/,
    esempio: 'github_pat_' + 'F'.repeat(30),
    quasi:   'github_pat_' },
  { nome: 'chiave AWS',
    re: /(?:AKIA|ASIA)[0-9A-Z]{16}/,
    /* Un identificativo AWS è casuale: sedici caratteri con molti simboli
       distinti. La zona di zeri di un'immagine in base64 produce invece
       «AKIA» seguito da sedici «A». Si misura la VARIETÀ, non la presenza di
       una cifra: la prima stesura di questo banco chiedeva una cifra con
       `(?=.*\d)`, che in un blob grande è sempre soddisfatto perché la cifra
       sta più avanti nel file. Trovava 53 corrispondenze, tutte la stessa
       stringa, e il quasi-esempio non se ne accorgeva perché era troppo
       corto per contenere cifre. Ora il quasi-esempio porta la sua coda. */
    valido: function (m) {
      var coda = m.slice(4), distinti = Object.create(null);
      for (var i = 0; i < coda.length; i++) distinti[coda[i]] = 1;
      return Object.keys(distinti).length >= 8;
    },
    esempio: 'AKIA' + 'J3QX7PZ2M9KD4RTB',
    quasi:   'AKIA' + 'A'.repeat(16) },
  { nome: 'token Slack',
    re: /xox[baprs]-[0-9A-Za-z\-]{10,}/,
    esempio: 'xoxb-' + '1'.repeat(14),
    quasi:   'xoxb-' },
  { nome: 'chiave Groq',
    re: /gsk_[0-9A-Za-z]{40,}/,
    esempio: 'gsk_' + 'G'.repeat(44),
    quasi:   'gsk_finta' },
  { nome: 'chiave privata',
    re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /* L'esempio si COMPONE invece di scriverlo: scritto per intero finiva nel
       repository come qualunque altra riga, e alla prima esecuzione dopo il
       commit questo banco segnalava una chiave privata nella storia — la
       propria. Uno scanner che inciampa nelle proprie definizioni rende
       «contaminato» ogni repository che lo contenga, e il difetto si traveste
       da ritrovamento. Gli altri esempi erano già composti per costruzione. */
    esempio: '-----BEGIN ' + 'RSA PRIVATE' + ' KEY-----',
    quasi:   '-----BEGIN ' + 'CERTIFICATE-----' }
];

const ESTENSIONI = /\.(html?|js|mjs|cjs|json|md|toml|ya?ml|txt|css|sh|py|xml|svg|csv)$/i;

/* ── Le eccezioni, dichiarate una per una ──────────────────────────────────
   Un ritrovamento spiegato NON si fa sparire allargando lo schema: si scrive
   qui, con il suo motivo, e si continua a vederlo. L'eccezione è il singolo
   oggetto git, non un percorso e non un motivo: un file con lo stesso nome ma
   contenuto diverso ha un'impronta diversa e torna a essere segnalato. */
const ECCEZIONI = {
  'cc1a0ba00d4964a7c90261a3fdb85df5a518ca0c':
    'tools/banchi/audit_storia.js al commit 825ef66 — la prima stesura di QUESTO ' +
    'banco, che scriveva per intero l’esempio di chiave privata invece di ' +
    'comporlo. Non è una credenziale: è la definizione dello schema che la cerca. ' +
    'La stesura successiva compone l’esempio, ma il blob vecchio resta nella ' +
    'storia — che è esattamente ciò che questo banco esiste per ricordare.'
};

/* Una corrispondenza è una credenziale solo se supera anche il giudizio dello
   schema, dove c'è: la forma da sola non basta. */
function corrisponde(schema, testo){
  const m = testo.match(schema.re);
  if (!m) return null;
  if (schema.valido && !schema.valido(m[0])) return null;
  return m[0];
}

/* Gli esempi e i quasi-esempi si provano DENTRO una coda di rumore con cifre,
   come sarebbe in un file vero: è la differenza fra una prova che vale e una
   che si autoassolve. */
const CODA_DI_RUMORE = ' 0123456789 abcdef0123456789 ' + 'Z1'.repeat(40);

function git(args, opz){
  return execFileSync('git', args, Object.assign({ cwd: RADICE, encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024 }, opz || {}));
}

(async () => {
  console.log('Storia del repository — nessuna credenziale in nessuna versione\n');

  /* ── §1 · Gli schemi funzionano? ─────────────────────────────────────── */
  console.log('── Prima: gli schemi si riconoscono fra loro ──');
  const ciechi = [], troppoAvidi = [];
  SCHEMI.forEach(function (s) {
    if (!corrisponde(s, s.esempio + CODA_DI_RUMORE)) ciechi.push(s.nome);
    if (corrisponde(s, s.quasi + CODA_DI_RUMORE))
      troppoAvidi.push(s.nome + ' prende «' + s.quasi.slice(0, 28) + '»');
  });
  att('ogni schema riconosce il proprio esempio', '', ciechi.join(', '));
  att('e nessuno prende il proprio quasi-esempio', '', troppoAvidi.join(' | '));
  console.log('      (' + SCHEMI.length + ' schemi, provati nei due versi)');

  /* ── §2 · La superficie: la storia è tutta qui? ──────────────────────── */
  console.log('\n── La superficie esaminata ──');
  const superficiale = fs.existsSync(path.join(RADICE, '.git', 'shallow'));
  /* Un clone superficiale renderebbe questo banco una bugia tranquillizzante. */
  att('il clone NON è superficiale (altrimenti la storia è parziale)', false, superficiale);
  if (superficiale) {
    console.log('      ! esegui «git fetch --unshallow» e ripeti: così il banco');
    console.log('        guarderebbe una frazione della storia e passerebbe comunque');
  }

  const commit = parseInt(git(['rev-list', '--all', '--count']).trim(), 10);
  const righe = git(['rev-list', '--objects', '--all']).split('\n');
  const blob = [];
  const visti = Object.create(null);
  righe.forEach(function (r) {
    const sp = r.indexOf(' ');
    if (sp < 0) return;
    const sha = r.slice(0, sp), percorso = r.slice(sp + 1);
    if (!ESTENSIONI.test(percorso)) return;
    if (visti[sha]) return;
    visti[sha] = 1; blob.push(sha);
  });

  att('i commit esaminati sono molti', true, commit >= 300);
  att('le versioni di file di testo sono molte', true, blob.length >= 800);
  console.log('      (' + commit + ' commit · ' + blob.length +
              ' versioni distinte di file di testo)');

  /* ── §3 · La ricerca ─────────────────────────────────────────────────── */
  console.log('\n── La ricerca ──');
  const trovate = [], scusate = [];
  await new Promise(function (risolvi, rifiuta) {
    const p = spawn('git', ['cat-file', '--batch'], { cwd: RADICE });
    let coda = Buffer.alloc(0), i = 0, atteso = null;
    p.on('error', rifiuta);
    function chiedi(){
      if (i >= blob.length) { p.stdin.end(); return; }
      p.stdin.write(blob[i++] + '\n');
    }
    p.stdout.on('data', function (d) {
      coda = Buffer.concat([coda, d]);
      for (;;) {
        if (atteso === null) {
          const nl = coda.indexOf(0x0a);
          if (nl < 0) return;
          const testa = coda.slice(0, nl).toString().split(' ');
          coda = coda.slice(nl + 1);
          if (testa.length < 3) { atteso = null; chiedi(); continue; }
          atteso = { sha: testa[0], n: parseInt(testa[2], 10) };
        }
        if (coda.length < atteso.n + 1) return;
        const dati = coda.slice(0, atteso.n).toString('latin1');
        const sha = atteso.sha;
        coda = coda.slice(atteso.n + 1);
        atteso = null;
        SCHEMI.forEach(function (s) {
          const m = corrisponde(s, dati);
          if (!m) return;
          if (ECCEZIONI[sha]) { scusate.push(s.nome + ' nel blob ' + sha.slice(0, 9)); return; }
          trovate.push(s.nome + ': ' + m.slice(0, 12) + '… nel blob ' + sha.slice(0, 9));
        });
        chiedi();
      }
    });
    p.on('close', function () { risolvi(); });
    /* si tengono alcune richieste in volo: il processo non deve aspettare noi */
    for (let k = 0; k < 24; k++) chiedi();
  });

  att('nessuna credenziale in nessuna versione di nessun file', '',
      trovate.slice(0, 6).join(' | '));
  console.log('      (' + blob.length + ' versioni esaminate con ' +
              SCHEMI.length + ' schemi)');

  /* Le eccezioni si MOSTRANO. Una lista che tace somiglia a un controllo che
     non ha trovato niente, ed è il contrario. */
  const attese = Object.keys(ECCEZIONI).length;
  att('le eccezioni dichiarate sono tutte ancora nella storia, nessuna di più',
      attese, scusate.length);
  Object.keys(ECCEZIONI).forEach(function (k) {
    console.log('      · ' + k.slice(0, 9) + ' — ' + ECCEZIONI[k].slice(0, 96) + '…');
  });

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 6) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 6');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(function (e) { console.error(e.message); process.exit(1); });
