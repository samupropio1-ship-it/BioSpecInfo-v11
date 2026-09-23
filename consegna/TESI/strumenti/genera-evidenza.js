#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   GENERATORE DI EVIDENZA DI VERIFICA — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   PERCHE' ESISTE.
   Un documento che AFFERMA "tutti i test passano" vale quanto la fiducia che
   il lettore ripone in chi lo ha scritto. Un documento che RIPORTA l'output
   testuale di ogni banco, con l'ambiente in cui e' stato prodotto, il commit
   esatto del codice e le impronte SHA-256 dei file verificati, vale perche'
   chiunque puo' rieseguirlo e confrontare.

   Questo programma produce il secondo tipo. Non scrive conclusioni: esegue,
   raccoglie e trascrive. Se un banco fallisce, il fallimento finisce nel
   rapporto esattamente come il successo — un rapporto che puo' solo dire
   "tutto bene" non e' un'attestazione, e' una dichiarazione d'intenti.

   USO
     node tools/genera-evidenza.js              (serve un server su :8899)
     node tools/genera-evidenza.js --veloce     salta i banchi con browser

   Produce  docs/evidence/RAPPORTO-VERIFICA.md
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RADICE = path.resolve(__dirname, '..');
/* ═══════════════════════════════════════════════════════════════════════
   Dove stanno i banchi
   ═══════════════════════════════════════════════════════════════════════
   Fino alla versione v168 la cartella predefinita era l'area di lavoro
   della sessione in cui i banchi erano stati scritti. Funzionava per chi
   li aveva scritti, e per nessun altro: dei 39 banchi citati nel rapporto
   di evidenza, 7 stavano nel repository e 32 no.

   Il che rendeva falsa, senza che nessuno l'avesse notato, la frase su
   cui poggia tutto il resto di questo lavoro — «chiunque può
   rieseguirli». Un terzo che clonava il repository e lanciava il comando
   documentato trovava sette banchi su trentanove, e nessun messaggio che
   glielo dicesse.

   Ora i banchi stanno in `tools/banchi/`, versionati come tutto il resto.
   La variabile d'ambiente resta, per chi li tiene altrove.
   ═══════════════════════════════════════════════════════════════════════ */
const BANCHI_DIR = process.env.BSI_BANCHI || path.join(RADICE, 'tools', 'banchi');
const USCITA = path.join(RADICE, 'docs', 'evidence', 'RAPPORTO-VERIFICA.md');
const VELOCE = process.argv.includes('--veloce');

/* I banchi, raggruppati per cio' che dimostrano. Il raggruppamento non e'
   decorativo: in una matrice di tracciabilita' ogni requisito deve poter
   indicare quale famiglia lo copre. */
const FAMIGLIE = [
  { nome: 'Dati scientifici',
    scopo: 'I dati chimici mostrati sono verificati contro una fonte indipendente.',
    banchi: ['@verifica-farmaci', 'test_spettri', 'test_spettri_ui', 'test_assi',
             'test_assi_canvas', 'test_costanti', 'audit_dati', 'test_simmetria'] },
  { nome: 'Agente AI',
    scopo: 'L\'assistente resta utilizzabile quando il fornitore esterno si guasta.',
    banchi: ['test_nucleo', 'test_ko', 'test_404', 'test_503', 'test_firma',
             'test_attesa', 'test_attesalunga', 'test_tetto', 'browser_ko',
             'browser_prova', 'browser_prov', 'test_doppioinvio', 'caccia_ai'] },
  { nome: 'Stabilita',
    scopo: 'L\'applicazione regge sessioni lunghe, memoria esaurita e rete degradata.',
    banchi: ['audit_stabilita', 'audit_promesse', 'audit_quota', 'test_sw',
             'test_filemanager', 'test_visore3d'] },
  { nome: 'Interfaccia',
    scopo: 'I pannelli e i comandi rispondono come documentato.',
    banchi: ['browser_reset', 'browser_proxy', 'browser_proxyui', 'browser_rdkit',
             'browser_lab', 'browser_frontiera', 'test_aggiorna', 'test_guidaproxy'] },
  { nome: 'Sicurezza e accessibilita',
    scopo: 'Nessuna credenziale pubblicata; le pagine restano usabili con una tecnologia assistiva.',
    banchi: ['@verifica-sicurezza', '@verifica-accessibilita'] },
  { nome: 'Coerenza documentazione/codice',
    scopo: 'Cio che la documentazione promette esiste davvero nel codice.',
    banchi: ['verifica_guida', '@verifica-documenti', '@verifica-affermazioni'] }
];

/* I file di cui si registra l'impronta: sono quelli che contengono la logica
   scientifica e i dati. Un'impronta permette di dire "il rapporto si
   riferisce ESATTAMENTE a questo contenuto", non a un file con lo stesso nome. */
const FILE_IMPRONTA = ['index.html', 'bsi-ai-hub.js', 'bsi-spettri.js', 'sw.js',
                       'rdkit_lab.html', 'astro.html', 'chimorga.html'];

function comando(cmd, args, opz){
  try { return execFileSync(cmd, args, Object.assign({ encoding: 'utf8' }, opz || {})).trim(); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

function ambiente(){
  const git = (a) => { try { return execSync('git ' + a, { cwd: RADICE, encoding: 'utf8' }).trim(); }
                       catch (e) { return '(non disponibile)'; } };
  let cache = '(non letta)';
  try {
    const m = fs.readFileSync(path.join(RADICE, 'sw.js'), 'utf8').match(/CACHE\s*=\s*'([^']+)'/);
    if (m) cache = m[1];
  } catch (e) {}
  let chromium = '(non rilevato)';
  try {
    chromium = comando('/opt/pw-browsers/chromium-1194/chrome-linux/chrome', ['--version']);
  } catch (e) {}
  return {
    istante: new Date().toISOString(),
    commit: git('rev-parse HEAD'),
    ramo: git('rev-parse --abbrev-ref HEAD'),
    pulito: git('status --porcelain') === '' ? 'sì (nessuna modifica non registrata)'
                                             : 'NO — sono presenti modifiche non registrate',
    versione: cache,
    node: process.version,
    piattaforma: process.platform + ' ' + process.arch,
    chromium: chromium,
    playwright: (function(){
      try { return require(path.join(RADICE, 'node_modules', 'playwright-core', 'package.json')).version; }
      catch (e) { try { return require('playwright-core/package.json').version; } catch (e2) { return '(non rilevato)'; } }
    })()
  };
}

function impronte(){
  return FILE_IMPRONTA.map(function(f){
    const p = path.join(RADICE, f);
    try {
      const b = fs.readFileSync(p);
      return { file: f, byte: b.length,
               sha: crypto.createHash('sha256').update(b).digest('hex') };
    } catch (e) { return { file: f, byte: 0, sha: '(file assente)' }; }
  });
}

/* Esegue un banco e ne cattura l'uscita COMPLETA, senza interpretarla:
   l'interpretazione la fa il lettore, e il codice di uscita dice l'esito. */
function esegui(nome){
  /* La chiocciola distingue i banchi che stanno direttamente in `tools/`
     (sono anche strumenti a se' stanti, eseguibili da soli) da quelli in
     `tools/banchi/`. Dalla v168 stanno tutti nel repository: la
     distinzione e' rimasta di collocazione, non piu' di disponibilita'. */
  const interno = nome.charAt(0) === '@';
  const file = interno ? path.join(RADICE, 'tools', nome.slice(1) + '.js')
                       : path.join(BANCHI_DIR, nome + '.js');
  if (!fs.existsSync(file)) return { nome, stato: 'ASSENTE', codice: null, uscita: '', ms: 0 };
  const t0 = Date.now();
  let uscita = '', codice = 0;
  try {
    uscita = execFileSync(process.execPath, [file], {
      cwd: interno ? RADICE : BANCHI_DIR, encoding: 'utf8', timeout: 20 * 60 * 1000,
      maxBuffer: 32 * 1024 * 1024
    });
  } catch (e) {
    uscita = (e.stdout || '') + (e.stderr || '');
    codice = (typeof e.status === 'number') ? e.status : 1;
  }
  return { nome, stato: codice === 0 ? 'SUPERATO' : 'FALLITO', codice,
           uscita: uscita.replace(/\s+$/, ''), ms: Date.now() - t0 };
}

/* L'ultima riga di un banco ne riassume l'esito: la si riporta in tabella
   per dare un colpo d'occhio, ma l'uscita integrale resta in appendice —
   il riassunto non sostituisce l'evidenza, la indicizza. */
function sintesi(u){
  const righe = String(u).split('\n').filter(function(r){ return r.trim(); });
  return righe.length ? righe[righe.length - 1].trim() : '(nessuna uscita)';
}

function main(){
  const amb = ambiente();
  console.log('Evidenza — commit ' + amb.commit.slice(0, 10) + ' · ' + amb.versione);

  const risultati = [];
  FAMIGLIE.forEach(function(fam){
    fam.esiti = [];
    fam.banchi.forEach(function(b){
      if (VELOCE && /^browser_|^audit_(stabilita|promesse|quota|grafici)|^test_(sw|filemanager|visore3d|spettri_ui|assi|aggiorna|guidaproxy|doppioinvio)/.test(b)) {
        fam.esiti.push({ nome: b, stato: 'SALTATO', codice: null, uscita: '', ms: 0 });
        return;
      }
      process.stdout.write('  ' + b.padEnd(22));
      const r = esegui(b);
      fam.esiti.push(r);
      risultati.push(r);
      console.log(r.stato + '  (' + (r.ms / 1000).toFixed(1) + 's)');
    });
  });

  const superati = risultati.filter(function(r){ return r.stato === 'SUPERATO'; }).length;
  const falliti  = risultati.filter(function(r){ return r.stato === 'FALLITO'; }).length;
  const assenti  = risultati.filter(function(r){ return r.stato === 'ASSENTE'; }).length;
  const durata   = risultati.reduce(function(a, r){ return a + r.ms; }, 0);

  let m = '';
  m += '# Rapporto di verifica — evidenza di esecuzione\n\n';
  m += '**BioSpecInfo** · documento generato automaticamente da `tools/genera-evidenza.js`.\n\n';
  m += '> Questo rapporto non contiene affermazioni redatte a mano: riporta l\'uscita\n';
  m += '> testuale di ogni banco di prova, l\'ambiente in cui è stata prodotta, il commit\n';
  m += '> esatto del codice e le impronte SHA-256 dei file verificati. Chiunque disponga\n';
  m += '> del repository può rieseguire la procedura descritta al §5 e confrontare.\n\n';
  m += '---\n\n## 1. Esito complessivo\n\n';
  m += '| | |\n|---|---|\n';
  m += '| **Banchi superati** | ' + superati + ' |\n';
  m += '| **Banchi falliti** | ' + falliti + ' |\n';
  if (assenti) m += '| **Banchi non trovati** | ' + assenti + ' |\n';
  m += '| **Durata totale** | ' + (durata / 1000).toFixed(0) + ' s |\n';
  /* Un banco che non c'e' non e' un banco superato.
     Prima, `assenti` veniva contato e stampato ma non pesava sull'esito: una
     batteria in cui mancavano tutti i banchi avrebbe stampato «CONFORME» con
     zero falliti. E' la forma piu' pura del difetto che questo intero lavoro
     cerca di evitare — un controllo che non misura nulla passa — applicata
     non a un singolo banco ma all'apparato che li governa. */
  m += '| **Esito** | ' + ((falliti || assenti)
        ? '⚠️ **NON CONFORME** — vedere §3'
        : '✅ **CONFORME**') + ' |\n\n';
  if (assenti) {
    m += '> **' + assenti + ' banchi non sono stati trovati** nella cartella `' +
         path.relative(RADICE, BANCHI_DIR) + '`. Un banco assente non è un banco ' +
         'superato: l\'esito complessivo è NON CONFORME finché non vengono ' +
         'eseguiti o rimossi dall\'elenco.\n\n';
  }

  m += '---\n\n## 2. Ambiente di esecuzione\n\n';
  m += '| Campo | Valore |\n|---|---|\n';
  m += '| Istante (UTC) | `' + amb.istante + '` |\n';
  m += '| Commit | `' + amb.commit + '` |\n';
  m += '| Ramo | `' + amb.ramo + '` |\n';
  m += '| Albero di lavoro pulito | ' + amb.pulito + ' |\n';
  m += '| Versione applicazione | `' + amb.versione + '` |\n';
  m += '| Node.js | `' + amb.node + '` |\n';
  m += '| Piattaforma | `' + amb.piattaforma + '` |\n';
  m += '| Chromium | `' + amb.chromium + '` |\n';
  m += '| playwright-core | `' + amb.playwright + '` |\n\n';

  m += '### Impronte dei file verificati\n\n';
  m += 'Il rapporto si riferisce esattamente a questo contenuto.\n\n';
  m += '| File | Byte | SHA-256 |\n|---|---:|---|\n';
  impronte().forEach(function(i){
    m += '| `' + i.file + '` | ' + i.byte.toLocaleString('it-IT') + ' | `' + i.sha + '` |\n';
  });
  m += '\n---\n\n## 3. Esiti per famiglia\n\n';

  FAMIGLIE.forEach(function(fam){
    const f = fam.esiti.filter(function(r){ return r.stato === 'FALLITO'; }).length;
    m += '### ' + fam.nome + (f ? '  ⚠️' : '') + '\n\n';
    m += '_' + fam.scopo + '_\n\n';
    m += '| Banco | Esito | Durata | Sintesi |\n|---|---|---:|---|\n';
    fam.esiti.forEach(function(r){
      const seg = r.stato === 'SUPERATO' ? '✅' : (r.stato === 'FALLITO' ? '❌' : '—');
      m += '| `' + r.nome + '` | ' + seg + ' ' + r.stato + ' | ' +
           (r.ms ? (r.ms / 1000).toFixed(1) + ' s' : '—') + ' | ' +
           sintesi(r.uscita).replace(/\|/g, '\\|').slice(0, 90) + ' |\n';
    });
    m += '\n';
  });

  m += '---\n\n## 4. Uscita integrale dei banchi\n\n';
  m += 'Trascrizione non filtrata, nell\'ordine di esecuzione.\n\n';
  FAMIGLIE.forEach(function(fam){
    fam.esiti.forEach(function(r){
      if (r.stato === 'SALTATO') return;
      m += '<details>\n<summary><code>' + r.nome + '</code> — ' + r.stato +
           ' (codice di uscita ' + (r.codice === null ? 'n/d' : r.codice) + ')</summary>\n\n';
      m += '```\n' + (r.uscita || '(nessuna uscita)') + '\n```\n\n</details>\n\n';
    });
  });

  m += '---\n\n## 5. Come riprodurre questo rapporto\n\n';
  m += '```bash\n';
  m += '# 1. dalla radice del repository, al commit indicato al §2\n';
  m += 'git checkout ' + amb.commit.slice(0, 12) + '\n\n';
  m += '# 2. dipendenze di prova (solo Playwright, nessuna dipendenza di runtime)\n';
  m += 'npm install\n\n';
  m += '# 3. server locale: RDKit WASM richiede contesto HTTP\n';
  m += 'python3 -m http.server 8899 &\n\n';
  m += '# 4. esecuzione\n';
  m += 'node tools/genera-evidenza.js\n';
  m += '```\n\n';
  m += 'I banchi risiedono in `tools/banchi/`, versionati nel repository; la\n';
  m += 'variabile `BSI_BANCHI` permette di indicarne un\'altra. L\'opzione `--veloce` salta i\n';
  m += 'banchi che richiedono un browser, utile per un controllo rapido ma **non\n';
  m += 'sufficiente** per un\'attestazione: quelli sono i banchi che misurano il\n';
  m += 'comportamento reale.\n\n';
  m += '---\n\n## 6. Dichiarazione\n\n';
  m += 'Il presente rapporto è prodotto da un programma che esegue i banchi e ne\n';
  m += 'trascrive l\'uscita senza intervento manuale. Un banco fallito compare nel\n';
  m += 'rapporto con lo stesso rilievo di uno superato, e l\'esito complessivo al §1\n';
  m += 'è calcolato dai codici di uscita, non redatto.\n\n';
  m += 'I limiti noti e dichiarati dei predittori scientifici sono documentati in\n';
  m += '`docs/06-Scientific-Accuracy-Data-Provenance.md` e non sono trattati come\n';
  m += 'difetti da questo rapporto.\n\n';
  m += '_Generato il ' + amb.istante + '._\n';

  fs.mkdirSync(path.dirname(USCITA), { recursive: true });
  fs.writeFileSync(USCITA, m);
  console.log('\n→ ' + path.relative(RADICE, USCITA) + '  (' + superati + ' superati, ' + falliti + ' falliti)');
  process.exit((falliti || assenti) ? 1 : 0);
}

main();
