#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   PACCHETTI DI DOCUMENTAZIONE — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   Tre destinatari, tre esigenze diverse. Consegnare a tutti lo stesso
   malloppo di venti documenti significa che nessuno lo legge: l'azienda
   cerca conformita' e rischio, la commissione cerca metodo scientifico,
   l'autore ha bisogno anche delle note operative che agli altri due non
   servono e che anzi confonderebbero.

   Ogni pacchetto porta una PROPRIA copertina che spiega cosa contiene, in
   che ordine leggerlo e quanto tempo serve. I documenti sono gli stessi
   file del repository — non copie divergenti: se cambia il repository,
   basta rieseguire questo programma.

   USO   node tools/genera-pacchetti.js
   Produce  consegna/AZIENDA/  ·  consegna/TESI/  ·  consegna/COMPLETO/
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RADICE = path.resolve(__dirname, '..');
const USCITA = path.join(RADICE, 'consegna');

function versione(){
  try {
    const m = fs.readFileSync(path.join(RADICE, 'sw.js'), 'utf8').match(/CACHE\s*=\s*'([^']+)'/);
    return m ? m[1] : '(sconosciuta)';
  } catch (e) { return '(sconosciuta)'; }
}
function commit(){
  try { return execSync('git rev-parse --short HEAD', { cwd: RADICE, encoding: 'utf8' }).trim(); }
  catch (e) { return '(non disponibile)'; }
}

const VER = versione();
const SHA = commit();
const OGGI = new Date().toISOString().slice(0, 10);

/* ─────────────────────────────────────────────────────────────────────
   I tre pacchetti
   ───────────────────────────────────────────────────────────────────── */
const PACCHETTI = {

  AZIENDA: {
    titolo: 'Dossier per valutazione aziendale',
    sottotitolo: 'Architettura, verifica, conformità, licenze e rischio.',
    perche: 'Chi valuta in azienda deve poter rispondere a tre domande: come è ' +
            'fatto, come si dimostra che funziona, e che cosa comporta adottarlo. ' +
            'Tutto il resto è rumore.',
    file: [
      ['00-Technical-Dossier.md',              'Sintesi, factsheet, capacità, stack'],
      ['01-Software-Architecture-Document.md', 'Architettura, componenti, flussi dati'],
      ['02-Verification-Validation-Report.md', 'Metodo di verifica e batteria di prova'],
      ['03-Security-Privacy-Compliance.md',    'Local-first, OWASP, GDPR, GAMP 5'],
      ['04-Open-Source-Licenses.md',           'Matrice delle dipendenze'],
      ['07-SBOM.md',                           'Distinta dei componenti con impronte SHA-256'],
      ['08-Traceability-Matrix.md',            'Requisito → implementazione → banco di verifica'],
      ['09-Release-Conformance-Statement.md',  'Destinazione d\'uso, esclusioni, difformità note'],
      ['10-API-Reference.md',                  'Interfacce HTTP e API consumate'],
      ['11-Data-Model.md',                     'Dove risiedono i dati e con quale ciclo di vita'],
      ['12-Deploy-Guide.md',                   'Pubblicazione, ripristino, emergenze'],
      ['15-Test-Documentation.md',             'Come rieseguire le prove']
    ],
    evidenza: true, strumenti: true, pdf: true, licenza: true,
    percorso: [
      ['09-Release-Conformance-Statement.md', 'Che cosa è e che cosa NON è. Le esclusioni sono parte della dichiarazione.', '8 min'],
      ['evidence/RAPPORTO-VERIFICA.md',       'L\'evidenza: uscita integrale dei banchi, ambiente, commit, impronte.', '10 min'],
      ['00-Technical-Dossier.md',             'La sintesi tecnica.', '8 min'],
      ['08-Traceability-Matrix.md',           'Copertura dei requisiti, con le lacune dichiarate.', '7 min'],
      ['07-SBOM.md',                          'Componenti, licenze, compatibilità.', '5 min'],
      ['03-Security-Privacy-Compliance.md',   'Modello di riservatezza e superficie d\'attacco.', '7 min']
    ],
    nota: 'La dichiarazione di conformità (09) è firmata dall\'autore e dichiara ' +
          'esplicitamente di **non** essere una certificazione di terza parte. ' +
          'Attesta che esiste una procedura riproducibile e che i risultati ' +
          'riportati sono quelli realmente ottenuti — compresi i fallimenti.'
  },

  TESI: {
    titolo: 'Dossier per la discussione di tesi',
    sottotitolo: 'Metodo scientifico, validazione, limiti dichiarati.',
    perche: 'Una commissione non valuta quante funzioni ci sono, ma se ciò che ' +
            'l\'applicazione afferma è vero e come lo si dimostra. Il centro di ' +
            'questo pacchetto è il metodo: come un dato scientifico viene ' +
            'verificato, e che cosa succede quando non si riesce a verificarlo.',
    file: [
      ['00-Technical-Dossier.md',                      'Inquadramento del lavoro'],
      ['06-Scientific-Accuracy-Data-Provenance.md',    'Il cuore: come sono verificati i dati chimici'],
      ['02-Verification-Validation-Report.md',         'Validazione dei predittori, benchmark SDBS/NIST'],
      ['01-Software-Architecture-Document.md',         'Scelte architetturali e loro motivazione'],
      ['05-AI-Agent-Architecture.md',                  'L\'agente: ciclo, strumenti, decisioni'],
      ['13-Functional-Specifications.md',              'Obiettivi, regole, limitazioni'],
      ['08-Traceability-Matrix.md',                    'Requisiti e loro verifica'],
      ['15-Test-Documentation.md',                     'Metodo sperimentale della verifica']
    ],
    evidenza: true, strumenti: true, pdf: true, licenza: true,
    percorso: [
      ['06-Scientific-Accuracy-Data-Provenance.md', 'Il principio: ogni dato deve poter essere contraddetto da un secondo dato indipendente.', '15 min'],
      ['02-Verification-Validation-Report.md',      'Benchmark contro SDBS e NIST; la batteria di verifica e le note di metodo.', '12 min'],
      ['00-Technical-Dossier.md',                   'Inquadramento.', '8 min'],
      ['05-AI-Agent-Architecture.md',               'Le decisioni ingegneristiche dell\'agente, con la loro motivazione.', '20 min'],
      ['13-Functional-Specifications.md',           'Regole di business e limitazioni dichiarate.', '10 min']
    ],
    nota: 'Il documento 06 contiene il risultato più difendibile del lavoro: un ' +
          'controllo che ha trovato **89 errori strutturali** su 143 voci ' +
          'preesistenti, e il ragionamento per cui lo scarto di massa non è solo ' +
          'un allarme ma una diagnosi (Δ 0,98 u = citosina ⟷ uracile, sul ' +
          'sofosbuvir). I 25 casi non verificabili sono dichiarati, non nascosti.'
  },

  COMPLETO: {
    titolo: 'Documentazione completa',
    sottotitolo: 'Tutto: i documenti, l\'evidenza, gli strumenti e le note di lavorazione.',
    perche: 'Questo pacchetto è per chi sviluppa l\'applicazione. Contiene anche ' +
            'ciò che agli altri due destinatari non serve: il manuale utente, le ' +
            'guide pratiche, e le note di sessione con le trappole in cui si è ' +
            'già caduti — che sono la parte più difficile da ricostruire.',
    file: null,            // tutto docs/
    evidenza: true, strumenti: true, pdf: true, licenza: true, extra: true,
    percorso: [
      ['DOCUMENTATION.md',                     'L\'indice generale, con i percorsi per ogni tipo di lettore.', '3 min'],
      ['15-Test-Documentation.md',             'Come si esegue la batteria e come si aggiunge un banco.', '12 min'],
      ['12-Deploy-Guide.md',                   'Come si pubblica, e le due righe della versione.', '10 min'],
      ['06-Scientific-Accuracy-Data-Provenance.md', 'Le regole che i dati devono rispettare.', '15 min'],
      ['NOTE-DI-LAVORAZIONE.txt',              'Le trappole già incontrate. Leggerle evita di ripeterle.', '25 min']
    ],
    nota: 'Le note di lavorazione non sono documentazione formale: sono il ' +
          'registro di che cosa è andato storto e perché. Contengono, fra le ' +
          'altre, la regola che vale più di tutte le altre messe insieme — ' +
          '*un banco di prova che non misura nulla passa*.'
  }
};

/* ───────────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════════════
   Copia con riscrittura dei riferimenti
   ═══════════════════════════════════════════════════════════════════════

   Un documento estratto dal repository porta con sé i collegamenti alla
   posizione che aveva LÌ. `docs/08` rimanda a `06-...md` perché entrambi
   stanno in `docs/`; dentro un pacchetto che non contiene il 06 quel
   collegamento non porta da nessuna parte.

   Alla prima generazione erano 50 riferimenti morti su 127. Un documento
   consegnato a un'azienda con cinquanta collegamenti rotti dice una cosa
   sola sul lavoro che lo precede, e non è una cosa buona.

   La regola applicata è unica: ogni collegamento viene risolto in un
   percorso relativo alla RADICE del repository; se quel file è stato
   copiato nel pacchetto, punta alla sua nuova posizione; se non è stato
   copiato, punta al repository pubblico — che è sempre raggiungibile.
   In nessun caso resta un collegamento che non porta da nessuna parte.
   ═══════════════════════════════════════════════════════════════════════ */

const REPO_WEB = 'https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/';

/* mappa: percorso relativo alla radice → percorso dentro il pacchetto */
let mappa = {};

function registra(daAssoluto, aAssoluto, dirPacchetto){
  mappa[path.relative(RADICE, daAssoluto).split(path.sep).join('/')] =
       path.relative(dirPacchetto, aAssoluto).split(path.sep).join('/');
}

/* Due file diversi possono chiamarsi allo stesso modo: `README.md` alla
   radice e `docs/README.md` sono documenti distinti, e appiattendo le
   cartelle il secondo cancellava il primo senza dire nulla. Un file che
   sparisce in silenzio è peggio di un collegamento rotto: nessuno se ne
   accorge. Qui il secondo prende un nome libero, e la mappa registra dove
   è finito, così i collegamenti continuano a trovarlo. */
function nomeLibero(dir, nome){
  if (!fs.existsSync(path.join(dir, nome))) return nome;
  const est = path.extname(nome), base = nome.slice(0, nome.length - est.length);
  for (let i = 2; i < 50; i++) {
    const c = base + '-' + i + est;
    if (!fs.existsSync(path.join(dir, c))) return c;
  }
  return base + '-copia' + est;
}

function copia(da, a, dirPacchetto){
  fs.mkdirSync(path.dirname(a), { recursive: true });
  fs.copyFileSync(da, a);
  if (dirPacchetto) registra(da, a, dirPacchetto);
}
function copiaCartella(da, a, filtro, dirPacchetto){
  if (!fs.existsSync(da)) return 0;
  let n = 0;
  fs.mkdirSync(a, { recursive: true });
  for (const f of fs.readdirSync(da, { withFileTypes: true })) {
    if (f.isDirectory()) continue;
    if (filtro && !filtro(f.name)) continue;
    const dest = path.join(a, f.name);
    fs.copyFileSync(path.join(da, f.name), dest);
    if (dirPacchetto) registra(path.join(da, f.name), dest, dirPacchetto);
    n++;
  }
  return n;
}

/* Riscrive i collegamenti di un file Markdown copiato.
   `origine` è la cartella che il file occupava NEL REPOSITORY: è rispetto
   a quella che i suoi collegamenti relativi vanno risolti. */
function riscrivi(fileNelPacchetto, origineNelRepo){
  let t;
  try { t = fs.readFileSync(fileNelPacchetto, 'utf8'); } catch (e) { return 0; }
  let cambiati = 0;

  const nuovo = t.replace(/(\[[^\]]*\]\()([^)\s]+?)(\))/g, function(tutto, pre, link, post){
    if (/^(https?:|mailto:|#|<)/.test(link)) return tutto;

    /* l'ancora (#sezione) viaggia con il collegamento ma non fa parte del percorso */
    const taglio = link.indexOf('#');
    const percorso = taglio >= 0 ? link.slice(0, taglio) : link;
    const ancora   = taglio >= 0 ? link.slice(taglio)    : '';
    if (!percorso) return tutto;

    /* percorso relativo alla radice del repository */
    const rel = path.normalize(path.join(origineNelRepo, percorso))
                    .split(path.sep).join('/').replace(/^\.\//, '');

    if (Object.prototype.hasOwnProperty.call(mappa, rel)) {
      const dentro = mappa[rel];
      if (dentro !== percorso) cambiati++;
      return pre + dentro + ancora + post;
    }

    /* non è nel pacchetto: rimanda al repository pubblico, dove esiste */
    cambiati++;
    /* GitHub distingue file (`blob`) e cartelle (`tree`): un percorso che
       finisce con `/`, o che sul disco è una cartella, va servito da `tree`
       o il collegamento porta a una pagina di errore. */
    const nudo = rel.replace(/\/$/, '');
    let cartella = /\/$/.test(rel);
    try { cartella = cartella || fs.statSync(path.join(RADICE, nudo)).isDirectory(); }
    catch (e) {}
    return pre + REPO_WEB.replace('/blob/', cartella ? '/tree/' : '/blob/') +
           nudo + ancora + post;
  });

  if (nuovo !== t) fs.writeFileSync(fileNelPacchetto, nuovo);
  return cambiati;
}

/* ── Il controllo che rende la riscrittura verificata e non sperata ──
   Cammina il pacchetto finito e conta i collegamenti interni che non
   portano a un file esistente. Conta anche quanti ne ha esaminati: un
   controllo che non esamina nulla passerebbe comunque, e non varrebbe
   niente. */
function controllaLink(dir){
  const file = [];
  (function cammina(d){
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) cammina(p); else file.push(p);
    }
  })(dir);

  let esaminati = 0;
  const rotti = [];
  file.filter(f => f.endsWith('.md')).forEach(function(f){
    const t = fs.readFileSync(f, 'utf8');
    const re = /\[[^\]]*\]\(([^)\s]+?)\)/g;
    let m;
    while ((m = re.exec(t)) !== null) {
      let l = m[1];
      if (/^(https?:|mailto:|#|<)/.test(l)) continue;
      const taglio = l.indexOf('#');
      if (taglio >= 0) l = l.slice(0, taglio);
      if (!l) continue;
      esaminati++;
      if (!fs.existsSync(path.resolve(path.dirname(f), l)))
        rotti.push(path.relative(dir, f) + ' → ' + l);
    }
  });
  return { esaminati: esaminati, rotti: rotti };
}

function copertina(nome, p){
  let m = '';
  m += '# BioSpecInfo — ' + p.titolo + '\n\n';
  m += '**' + p.sottotitolo + '**\n\n';
  m += '| | |\n|---|---|\n';
  m += '| Autore | Samuele Pio Provenzano |\n';
  m += '| Versione | `' + VER + '` |\n';
  m += '| Commit | `' + SHA + '` |\n';
  m += '| Preparato il | ' + OGGI + ' |\n';
  m += '| Applicazione | https://samupropio1-ship-it.github.io/BioSpecInfo-v11/ |\n';
  m += '| Repository | github.com/samupropio1-ship-it/BioSpecInfo-v11 |\n\n';
  m += '---\n\n## Perché questo pacchetto\n\n' + p.perche + '\n\n';
  m += '---\n\n## In che ordine leggerlo\n\n';
  m += '| # | Documento | Perché | Tempo |\n|---|---|---|---|\n';
  p.percorso.forEach(function(r, i){
    m += '| ' + (i + 1) + ' | [`' + r[0] + '`](' + r[0] + ') | ' + r[1] + ' | ' + r[2] + ' |\n';
  });
  const minuti = p.percorso.reduce(function(a, r){ return a + (parseInt(r[2], 10) || 0); }, 0);
  m += '\n**Totale del percorso consigliato: circa ' + minuti + ' minuti.**\n\n';
  m += '---\n\n## Contenuto\n\n';
  if (p.file) {
    m += '| Documento | Contenuto |\n|---|---|\n';
    p.file.forEach(function(f){ m += '| [`' + f[0] + '`](' + f[0] + ') | ' + f[1] + ' |\n'; });
  } else {
    m += 'Tutti i documenti del repository, più il manuale utente, le guide ' +
         'pratiche e le note di lavorazione.\n';
  }
  if (p.pdf) {
    m += '\n### In PDF\n\n';
    m += 'La cartella `pdf/` contiene gli stessi documenti già impaginati, ' +
         'pronti da allegare a un\'email o da stampare. Ogni piè di pagina ' +
         'riporta versione e commit, così un allegato non può essere scambiato ' +
         'per una versione diversa da quella che descrive.\n\n';
    m += '- **`pdf/BioSpecInfo-Dossier-Completo.it.pdf`** — tutti i documenti ' +
         'in un unico file con indice. È l\'allegato da mandare se se ne manda uno solo.\n';
    m += '- Gli altri file `pdf/NN-*.pdf` sono i singoli documenti.\n\n';
    m += 'Sono **generati** dai Markdown di questo stesso pacchetto ' +
         '(`node tools/genera-pdf.js`): testo e PDF non possono divergere.\n\n';
  }
  m += '\n### Evidenza (generata automaticamente)\n\n';
  m += '| File | Contenuto |\n|---|---|\n';
  m += '| [`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md) | Uscita integrale di ogni banco, ambiente, commit, impronte SHA-256 |\n';
  m += '| [`evidence/deviazioni-note.json`](evidence/deviazioni-note.json) | Registro delle deviazioni accettate, con il motivo |\n';
  m += '| [`evidence/sbom.cdx.json`](evidence/sbom.cdx.json) | SBOM in formato CycloneDX 1.5 |\n\n';
  m += '### Strumenti di verifica\n\n';
  m += 'Nella cartella `strumenti/`. Sono gli stessi che hanno prodotto ' +
       'l\'evidenza: chiunque può rieseguirli.\n\n';
  m += '```bash\n';
  m += 'git clone https://github.com/samupropio1-ship-it/BioSpecInfo-v11\n';
  m += 'cd BioSpecInfo-v11 && npm install\n';
  m += 'python3 -m http.server 8899 &\n';
  m += 'node tools/genera-evidenza.js\n';
  m += '```\n\n';
  m += '---\n\n## Nota\n\n' + p.nota + '\n\n';
  m += '---\n\n_Pacchetto **' + nome + '** · versione `' + VER + '` · commit `' + SHA + '`._\n';
  return m;
}

function main(){
  fs.rmSync(USCITA, { recursive: true, force: true });
  console.log('Pacchetti di documentazione — ' + VER + ' (' + SHA + ')\n');

  let rottiTotali = 0, esaminatiTotali = 0;

  Object.keys(PACCHETTI).forEach(function(nome){
    const p = PACCHETTI[nome];
    const dir = path.join(USCITA, nome);
    fs.mkdirSync(dir, { recursive: true });
    let n = 0;

    mappa = {};                       // una mappa per pacchetto
    const daRiscrivere = [];          // [file nel pacchetto, cartella d'origine nel repo]

    /* I file della radice prendono posto per primi: sono quelli il cui nome
       il lettore si aspetta di trovare tale e quale (README, LICENSE). */
    if (p.extra) {
      ['README.md', 'CHANGELOG.md', 'DOCUMENTATION.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md']
        .forEach(function(f){
          const src = path.join(RADICE, f);
          if (fs.existsSync(src)) {
            const dest = path.join(dir, f);
            copia(src, dest, dir); n++;
            if (f.endsWith('.md')) daRiscrivere.push([dest, '.']);
          }
        });
      // le note di sessione: registro delle trappole, non documentazione formale
      const note = path.join(RADICE, 'prompt_sessione.txt');
      if (fs.existsSync(note)) { copia(note, path.join(dir, 'NOTE-DI-LAVORAZIONE.txt'), dir); n++; }
      const px = path.join(RADICE, 'proxy', 'README.md');
      if (fs.existsSync(px)) {
        const dest = path.join(dir, nomeLibero(dir, 'PROXY-README.md'));
        copia(px, dest, dir); n++;
        daRiscrivere.push([dest, 'proxy']);
      }
    }

    /* La licenza va in ogni pacchetto: chi valuta deve poter leggere a quali
       condizioni potrebbe usare il software, e la risposta non sta altrove. */
    if (p.licenza && !p.extra) {
      ['LICENSE', 'THIRD_PARTY_NOTICES.md'].forEach(function(f){
        const src = path.join(RADICE, f);
        if (fs.existsSync(src)) {
          const dest = path.join(dir, f);
          copia(src, dest, dir); n++;
          if (f.endsWith('.md')) daRiscrivere.push([dest, '.']);
        }
      });
    }

    if (p.file) {
      p.file.forEach(function(f){
        const src = path.join(RADICE, 'docs', f[0]);
        if (fs.existsSync(src)) {
          const dest = path.join(dir, nomeLibero(dir, f[0]));
          copia(src, dest, dir); n++;
          daRiscrivere.push([dest, 'docs']);
        } else console.log('  ⚠ assente: docs/' + f[0]);
      });
    } else {
      fs.readdirSync(path.join(RADICE, 'docs'))
        .filter(f => f.endsWith('.md'))
        .sort()
        .forEach(function(f){
          /* `docs/README.md` è l'indice della documentazione, non il README
             del progetto: appiattendo le cartelle si scontrerebbero. */
          const nome = (f === 'README.md') ? 'INDICE-DOCUMENTAZIONE.md' : f;
          const dest = path.join(dir, nomeLibero(dir, nome));
          copia(path.join(RADICE, 'docs', f), dest, dir); n++;
          daRiscrivere.push([dest, 'docs']);
        });
    }

    if (p.evidenza) {
      n += copiaCartella(path.join(RADICE, 'docs', 'evidence'),
                         path.join(dir, 'evidence'), null, dir);
    }
    if (p.strumenti) {
      n += copiaCartella(path.join(RADICE, 'tools'), path.join(dir, 'strumenti'),
                         f => f.endsWith('.js'), dir);
    }
    /* I PDF: solo quelli dei documenti che il pacchetto contiene davvero, più
       il dossier unico. Allegare il PDF di un documento che nel pacchetto non
       c'è rimetterebbe dentro dalla finestra l'incoerenza appena tolta dalla
       porta. */
    if (p.pdf) {
      const dirPdf = path.join(RADICE, 'docs', 'pdf');
      if (fs.existsSync(dirPdf)) {
        const voluti = new Set();
        Object.keys(mappa).forEach(function(rel){
          const m = rel.match(/^docs\/(.+)\.md$/);
          if (m) voluti.add(m[1] + '.pdf');
        });
        voluti.add('BioSpecInfo-Dossier-Completo.it.pdf');
        fs.mkdirSync(path.join(dir, 'pdf'), { recursive: true });
        fs.readdirSync(dirPdf).filter(f => voluti.has(f)).sort().forEach(function(f){
          copia(path.join(dirPdf, f), path.join(dir, 'pdf', f), dir); n++;
        });
      }
    }
    /* la copertina è scritta qui e i suoi collegamenti sono già interni */
    fs.writeFileSync(path.join(dir, 'LEGGIMI.md'), copertina(nome, p));

    let riscritti = 0;
    daRiscrivere.forEach(function(r){ riscritti += riscrivi(r[0], r[1]); });

    const esito = controllaLink(dir);
    rottiTotali += esito.rotti.length;
    esaminatiTotali += esito.esaminati;

    console.log('  ' + nome.padEnd(10) + String(n).padStart(3) + ' file + copertina  ·  ' +
                String(riscritti).padStart(3) + ' riferimenti riscritti  ·  ' +
                esito.esaminati + ' collegamenti verificati' +
                (esito.rotti.length ? '  ✗ ' + esito.rotti.length + ' ROTTI' : '  ✓'));
    esito.rotti.slice(0, 8).forEach(r => console.log('       ! ' + r));
  });

  /* ── Un archivio per pacchetto ──
     GitHub non offre il download di una cartella: chi riceve il link a
     `consegna/AZIENDA/` deve scaricare i file uno per uno, e non lo fa.
     Un .zip accanto alla cartella e' la differenza fra documentazione
     consultabile e documentazione consegnabile. */
  console.log('');
  var zip = null;
  try { require('child_process').execSync('command -v zip', { stdio: 'ignore' }); zip = true; }
  catch (e) { zip = false; }

  if (zip) {
    Object.keys(PACCHETTI).forEach(function(nome){
      var archivio = 'BioSpecInfo-' + nome + '-' + VER + '.zip';
      try {
        require('child_process').execSync(
          'rm -f ' + JSON.stringify(archivio) + ' && zip -rq ' +
          JSON.stringify(archivio) + ' ' + JSON.stringify(nome),
          { cwd: USCITA });
        var kb = fs.statSync(path.join(USCITA, archivio)).size / 1024;
        console.log('  📦 ' + archivio.padEnd(40) + (kb / 1024).toFixed(1).padStart(5) + ' MB');
      } catch (e) {
        console.log('  ⚠ archivio non creato per ' + nome + ': ' + e.message);
      }
    });
    console.log('');
  } else {
    console.log('  ⚠ `zip` non disponibile: gli archivi non sono stati creati.\n');
  }

  if (esaminatiTotali === 0) {
    console.log('✗ nessun collegamento esaminato: il controllo non sta misurando nulla');
    process.exit(1);
  }
  if (rottiTotali) {
    console.log('✗ ' + rottiTotali + ' collegamenti rotti su ' + esaminatiTotali + ' esaminati');
    process.exit(1);
  }
  console.log('✓ ' + esaminatiTotali + ' collegamenti interni verificati, nessuno rotto');
  console.log('Ogni cartella è autosufficiente e porta la propria copertina.');
}

main();
