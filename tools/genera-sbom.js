#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   DISTINTA DEI COMPONENTI SOFTWARE (SBOM) — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   Una SBOM compilata a mano invecchia al primo aggiornamento e nessuno se ne
   accorge. Questa viene GENERATA dai file realmente presenti nel repository:
   ogni voce porta la dimensione e l'impronta SHA-256 del file effettivamente
   distribuito, cosi' che un revisore possa verificare di avere sotto mano lo
   stesso artefatto descritto.

   Produce due formati, perche' servono a due lettori diversi:
     · docs/07-SBOM.md            leggibile, per il dossier
     · docs/evidence/sbom.cdx.json  CycloneDX 1.5, per gli strumenti di audit

   USO   node tools/genera-sbom.js
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const RADICE = path.resolve(__dirname, '..');

/* Ogni componente e' dichiarato con la licenza e il ruolo. Le licenze sono
   quelle dei progetti a monte: vanno aggiornate se si cambia versione. */
const COMPONENTI = [
  { file: 'RDKit_minimal.js',  nome: 'RDKit MinimalLib (JS glue)', licenza: 'BSD-3-Clause',
    fornitore: 'RDKit / Greg Landrum', url: 'https://github.com/rdkit/rdkit',
    ruolo: 'Chemioinformatica: interpretazione SMILES, SMARTS, descrittori, disegno 2D.',
    ruoloEn: 'Cheminformatics: SMILES and SMARTS parsing, descriptors, 2D drawing.' },
  { file: 'RDKit_minimal.wasm', nome: 'RDKit MinimalLib (WebAssembly)', licenza: 'BSD-3-Clause',
    fornitore: 'RDKit / Greg Landrum', url: 'https://github.com/rdkit/rdkit',
    ruolo: 'Binario WebAssembly del motore chemioinformatico.',
    ruoloEn: 'WebAssembly binary of the cheminformatics engine.' },
  { file: 'three.min.js', nome: 'three.js', licenza: 'MIT',
    fornitore: 'mrdoob e collaboratori', url: 'https://threejs.org',
    ruolo: 'Motore di rendering WebGL per le scene 3D.',
    ruoloEn: 'WebGL rendering engine for the 3D scenes.' },
  { file: 'three_bloom.js', nome: 'three.js — UnrealBloomPass', licenza: 'MIT',
    fornitore: 'mrdoob e collaboratori', url: 'https://threejs.org',
    ruolo: 'Effetto di post-produzione per le visualizzazioni astronomiche.',
    ruoloEn: 'Post-processing effect for the astronomical visualisations.' },
  { file: 'gltf_loader.js', nome: 'three.js — GLTFLoader', licenza: 'MIT',
    fornitore: 'mrdoob e collaboratori', url: 'https://threejs.org',
    ruolo: 'Caricamento dei modelli anatomici e molecolari in formato glTF.',
    ruoloEn: 'Loading of anatomical and molecular models in glTF format.' },
  { file: '3Dmol-min.js', nome: '3Dmol.js', licenza: 'BSD-3-Clause',
    fornitore: 'University of Pittsburgh / David Koes', url: 'https://3dmol.csb.pitt.edu',
    ruolo: 'Visualizzazione molecolare 3D (PDB, SDF, superfici).',
    ruoloEn: '3D molecular visualisation (PDB, SDF, surfaces).' },
  { file: 'smiles-drawer.min.js', nome: 'SmilesDrawer', licenza: 'MIT',
    fornitore: 'Daniel Probst', url: 'https://github.com/reymond-group/smilesDrawer',
    ruolo: 'Disegno 2D delle strutture a partire da SMILES.',
    ruoloEn: '2D structure drawing from SMILES.' },
  { file: 'lib/sql-wasm.js', nome: 'sql.js (JS glue)', licenza: 'MIT',
    fornitore: 'sql.js / SQLite', url: 'https://github.com/sql-js/sql.js',
    ruolo: 'Database SQLite in-browser per le esercitazioni sui dati.',
    ruoloEn: 'In-browser SQLite database for the data exercises.' },
  { file: 'lib/sql-wasm.wasm', nome: 'SQLite (WebAssembly)', licenza: 'Public Domain',
    fornitore: 'SQLite Consortium', url: 'https://sqlite.org',
    ruolo: 'Motore SQLite compilato in WebAssembly.',
    ruoloEn: 'SQLite engine compiled to WebAssembly.' },
  { file: 'lib/dimuon.js', nome: 'Dataset dimuoni (CERN Open Data)', licenza: 'CC0-1.0',
    fornitore: 'CERN Open Data Portal', url: 'https://opendata.cern.ch',
    ruolo: 'Dati sperimentali per l\'esercitazione di fisica delle particelle.',
    ruoloEn: 'Experimental data for the particle-physics exercise.' }
];

/* Il codice scritto per questo progetto: non e' una dipendenza, ma un
   revisore deve poterne verificare l'integrita' allo stesso modo. */
const PROPRI = [
  { file: 'index.html',     ruolo: 'Applicazione principale: interfaccia, sezioni didattiche, dati chimici.',
    ruoloEn: 'Main application: interface, teaching sections, chemical data.' },
  { file: 'bsi-ai-hub.js',  ruolo: 'Agente AI «Spectra»: ciclo agentico, strumenti, gestione dei fornitori.',
    ruoloEn: '«Spectra» AI agent: agentic loop, tools, provider management.' },
  { file: 'bsi-spettri.js', ruolo: 'Motore di predizione spettrale IR/NMR su grafo molecolare.',
    ruoloEn: 'IR/NMR spectral prediction engine over the molecular graph.' },
  { file: 'bsi-cheminfo.js', ruolo: 'Motore di chemioinformatica: standardizzazione, impronte, raggruppamento, PCA, modelli QSAR con modello nullo.',
    ruoloEn: 'Cheminformatics engine: standardisation, fingerprints, clustering, PCA, QSAR models with a null model.' },
  { file: 'sw.js',          ruolo: 'Service Worker: funzionamento offline e strategia di rete.',
    ruoloEn: 'Service Worker: offline operation and network strategy.' },
  { file: 'rdkit_lab.html', ruolo: 'Laboratorio di chemioinformatica.', ruoloEn: 'Cheminformatics laboratory.' },
  { file: 'astro.html',     ruolo: 'Modulo di astrochimica.', ruoloEn: 'Astrochemistry module.' },
  { file: 'chimorga.html',  ruolo: 'Modulo di chimica organica.', ruoloEn: 'Organic chemistry module.' },
  { file: 'proxy/spectra-proxy.js', ruolo: 'Proxy opzionale (Cloudflare Worker) per le chiamate all\'AI.',
    ruoloEn: 'Optional proxy (Cloudflare Worker) for the AI calls.' }
];

function info(rel){
  const p = path.join(RADICE, rel);
  try {
    const b = fs.readFileSync(p);
    return { byte: b.length, sha: crypto.createHash('sha256').update(b).digest('hex') };
  } catch (e) { return { byte: 0, sha: null }; }
}

function kb(n){ return n ? (n / 1024).toFixed(0) + ' kB' : '—'; }

function main(){
  let commit = '(non disponibile)', versione = '(non letta)';
  try { commit = execSync('git rev-parse HEAD', { cwd: RADICE, encoding: 'utf8' }).trim(); } catch (e) {}
  try {
    const m = fs.readFileSync(path.join(RADICE, 'sw.js'), 'utf8').match(/CACHE\s*=\s*'([^']+)'/);
    if (m) versione = m[1];
  } catch (e) {}
  const istante = new Date().toISOString();

  // dipendenze di sviluppo, dal lockfile reale
  let dev = [];
  try {
    const lock = JSON.parse(fs.readFileSync(path.join(RADICE, 'package-lock.json'), 'utf8'));
    Object.keys(lock.packages || {}).forEach(function(k){
      if (!k.startsWith('node_modules/')) return;
      dev.push({ nome: k.replace('node_modules/', ''), versione: lock.packages[k].version,
                 licenza: lock.packages[k].license || '(non dichiarata)' });
    });
  } catch (e) {}

  /* ── Markdown, in due lingue ──────────────────────────────────────────
     La versione inglese non e' una cortesia: e' cio' che un revisore non
     italofono legge in sede di due diligence, ed era l'unico documento
     della serie 00-05 a non esistere affatto. Generarla dalla STESSA
     sorgente e' l'unico modo perche' non diverga: le impronte, le
     dimensioni e le licenze sono calcolate una volta sola. */
  const T = {
    it: {
      titolo: 'Distinta dei componenti software (SBOM)',
      sotto: '**BioSpecInfo** · documento generato da `tools/genera-sbom.js`.',
      rVersione: 'Versione applicazione', rCommit: 'Commit', rGenerato: 'Generato (UTC)',
      rMacchina: 'Formato macchina',
      nota: ['> Le impronte SHA-256 si riferiscono ai file effettivamente distribuiti in',
             '> questo commit. Un revisore può ricalcolarle con `sha256sum <file>` e',
             '> confrontarle, verificando di avere sotto mano lo stesso artefatto descritto.'],
      h1: '1. Componenti di terze parti distribuiti con l\'applicazione',
      p1: ['Tutti i componenti sono **inclusi nel repository** e serviti dallo stesso',
           'dominio: l\'applicazione non carica codice da CDN esterne in fase di',
           'esecuzione. È la condizione che le rende utilizzabile offline e che elimina',
           'la dipendenza dalla disponibilità di terzi.'],
      cCompo: 'Componente', cVersFile: 'Versione/File', cLic: 'Licenza', cDim: 'Dimensione',
      cRuolo: 'Ruolo', cFile: 'File', hImpronte: 'Impronte', assente: 'file assente',
      h2: '2. Codice proprio del progetto',
      h3: '3. Dipendenze di sviluppo',
      p3: ['Usate **solo** per l\'esecuzione dei banchi di prova. Non vengono distribuite',
           'con l\'applicazione e non sono presenti in produzione.'],
      cPacch: 'Pacchetto', cVers: 'Versione', nessunaDev: '_Nessuna dipendenza di sviluppo rilevata nel lockfile._',
      h4: '4. Dipendenze di esecuzione',
      p4: ['**Nessuna.** L\'applicazione non ha backend, non installa pacchetti a runtime e',
           'non carica script da domini esterni. Le uniche chiamate di rete sono opzionali',
           'e dirette a servizi pubblici documentati:'],
      cServ: 'Servizio', cScopo: 'Scopo', cKo: 'Se non raggiungibile',
      servizi: [['PubChem PUG-REST', 'nome IUPAC, CAS, pittogrammi GHS, conformeri 3D', 'l\'app usa i dati locali e lo dichiara'],
                ['NASA / ESA', 'immagini e dati astronomici', 'il modulo mostra i dati tabulati'],
                ['Fornitori AI (a scelta dell\'utente)', 'risposte dell\'assistente', 'l\'assistente lo segnala e propone alternative']],
      p4b: ['Nessun dato personale viene trasmesso: le chiavi API, se inserite, restano nel',
            '`localStorage` del dispositivo, oppure sul proxy dell\'utente (vedi `proxy/`).'],
      h5: '5. Compatibilità delle licenze',
      p5: ['Tutte le licenze dei componenti distribuiti (MIT, BSD-3-Clause, CC0, Public',
           'Domain) sono **permissive** e reciprocamente compatibili. Nessun componente è',
           'soggetto a licenza copyleft forte (GPL/AGPL): non esistono vincoli di',
           'ridistribuzione del codice proprio del progetto.', '',
           'Gli obblighi residui sono di **attribuzione**: le note di licenza dei progetti a',
           'monte sono riportate in `THIRD_PARTY_NOTICES.md`.'],
      avviso: ['> **La licenza dell\'applicazione è distinta da quelle dei componenti.**',
               '> Il codice proprio di BioSpecInfo è **proprietario** — *All rights reserved*',
               '> (vedi [`LICENSE`](' + '../LICENSE' + ')): visibile e valutabile, ma copia, riuso e uso',
               '> commerciale richiedono autorizzazione scritta dell\'Autore. Le licenze',
               '> permissive elencate sopra riguardano **soltanto** le librerie di terze parti',
               '> incluse, e non si estendono all\'applicazione.'],
      firma: function(t){ return '_Generato il ' + t + '._'; },
      ruolo: function(c){ return c.ruolo; },
      cdx: 'evidence/sbom.cdx.json',
      licenza: '../LICENSE'
    },
    en: {
      titolo: 'Software Bill of Materials (SBOM)',
      sotto: '**BioSpecInfo** · document generated by `tools/genera-sbom.js`.',
      rVersione: 'Application version', rCommit: 'Commit', rGenerato: 'Generated (UTC)',
      rMacchina: 'Machine-readable format',
      nota: ['> The SHA-256 digests refer to the files actually distributed in this',
             '> commit. A reviewer can recompute them with `sha256sum <file>` and compare,',
             '> confirming they hold the very artefact described here.'],
      h1: '1. Third-party components distributed with the application',
      p1: ['Every component is **included in the repository** and served from the same',
           'origin: the application loads no code from external CDNs at runtime. That is',
           'what makes it usable offline and what removes any dependence on third-party',
           'availability.'],
      cCompo: 'Component', cVersFile: 'Version/File', cLic: 'Licence', cDim: 'Size',
      cRuolo: 'Role', cFile: 'File', hImpronte: 'Digests', assente: 'file missing',
      h2: '2. Code written for this project',
      h3: '3. Development dependencies',
      p3: ['Used **only** to run the verification benches. They are not distributed with',
           'the application and are not present in production.'],
      cPacch: 'Package', cVers: 'Version', nessunaDev: '_No development dependency found in the lockfile._',
      h4: '4. Runtime dependencies',
      p4: ['**None.** The application has no backend, installs no package at runtime and',
           'loads no script from external domains. The only network calls are optional and',
           'go to documented public services:'],
      cServ: 'Service', cScopo: 'Purpose', cKo: 'If unreachable',
      servizi: [['PubChem PUG-REST', 'IUPAC name, CAS, GHS pictograms, 3D conformers', 'the app uses local data and says so'],
                ['NASA / ESA', 'astronomical images and data', 'the module shows the tabulated data'],
                ['AI providers (user\'s choice)', 'assistant answers', 'the assistant reports it and offers alternatives']],
      p4b: ['No personal data is transmitted: API keys, if entered, stay in the device\'s',
            '`localStorage`, or on the user\'s own proxy (see `proxy/`).'],
      h5: '5. Licence compatibility',
      p5: ['All licences of the distributed components (MIT, BSD-3-Clause, CC0, Public',
           'Domain) are **permissive** and mutually compatible. No component is subject to',
           'a strong copyleft licence (GPL/AGPL): there is no redistribution constraint on',
           'the code written for this project.', '',
           'The remaining obligations are of **attribution**: the licence notices of the',
           'upstream projects are reproduced in `THIRD_PARTY_NOTICES.md`.'],
      avviso: ['> **The application\'s licence is distinct from those of its components.**',
               '> The code written for BioSpecInfo is **proprietary** — *All rights reserved*',
               '> (see [`LICENSE`](../../LICENSE)): readable and open to assessment, but copying,',
               '> reuse and commercial use require the Author\'s written permission. The',
               '> permissive licences listed above cover **only** the bundled third-party',
               '> libraries, and do not extend to the application.'],
      firma: function(t){ return '_Generated on ' + t + '._'; },
      ruolo: function(c){ return c.ruoloEn || c.ruolo; },
      cdx: '../evidence/sbom.cdx.json',
      licenza: '../../LICENSE'
    }
  };

  function markdown(L){
    let m = '';
    m += '# ' + L.titolo + '\n\n';
    m += L.sotto + '\n\n';
    m += '| | |\n|---|---|\n';
    m += '| ' + L.rVersione + ' | `' + versione + '` |\n';
    m += '| ' + L.rCommit + ' | `' + commit + '` |\n';
    m += '| ' + L.rGenerato + ' | `' + istante + '` |\n';
    m += '| ' + L.rMacchina + ' | [`' + L.cdx + '`](' + L.cdx + ') — CycloneDX 1.5 |\n\n';
    m += L.nota.join('\n') + '\n\n';

    m += '---\n\n## ' + L.h1 + '\n\n';
    m += L.p1.join('\n') + '\n\n';
    m += '| ' + L.cCompo + ' | ' + L.cVersFile + ' | ' + L.cLic + ' | ' + L.cDim + ' | ' + L.cRuolo + ' |\n';
    m += '|---|---|---|---:|---|\n';
    COMPONENTI.forEach(function(c){
      const i = info(c.file);
      m += '| **' + c.nome + '**<br><sub>' + c.fornitore + '</sub> | `' + c.file + '` | ' +
           c.licenza + ' | ' + kb(i.byte) + ' | ' + L.ruolo(c) + ' |\n';
    });

    m += '\n### ' + L.hImpronte + '\n\n| ' + L.cFile + ' | SHA-256 |\n|---|---|\n';
    COMPONENTI.forEach(function(c){
      const i = info(c.file);
      m += '| `' + c.file + '` | `' + (i.sha || L.assente) + '` |\n';
    });

    m += '\n---\n\n## ' + L.h2 + '\n\n';
    m += '| ' + L.cFile + ' | ' + L.cDim + ' | ' + L.cRuolo + ' |\n|---|---:|---|\n';
    PROPRI.forEach(function(c){
      const i = info(c.file);
      m += '| `' + c.file + '` | ' + kb(i.byte) + ' | ' + L.ruolo(c) + ' |\n';
    });
    m += '\n### ' + L.hImpronte + '\n\n| ' + L.cFile + ' | SHA-256 |\n|---|---|\n';
    PROPRI.forEach(function(c){
      const i = info(c.file);
      m += '| `' + c.file + '` | `' + (i.sha || L.assente) + '` |\n';
    });

    m += '\n---\n\n## ' + L.h3 + '\n\n';
    if (dev.length){
      m += L.p3.join('\n') + '\n\n';
      m += '| ' + L.cPacch + ' | ' + L.cVers + ' | ' + L.cLic + ' |\n|---|---|---|\n';
      dev.forEach(function(d){ m += '| `' + d.nome + '` | ' + d.versione + ' | ' + d.licenza + ' |\n'; });
    } else {
      m += L.nessunaDev + '\n';
    }

    m += '\n---\n\n## ' + L.h4 + '\n\n';
    m += L.p4.join('\n') + '\n\n';
    m += '| ' + L.cServ + ' | ' + L.cScopo + ' | ' + L.cKo + ' |\n|---|---|---|\n';
    L.servizi.forEach(function(r){ m += '| ' + r[0] + ' | ' + r[1] + ' | ' + r[2] + ' |\n'; });
    m += '\n' + L.p4b.join('\n') + '\n\n';

    m += '---\n\n## ' + L.h5 + '\n\n';
    m += L.p5.join('\n') + '\n\n';
    m += L.avviso.join('\n') + '\n\n';
    m += L.firma(istante) + '\n';
    return m;
  }

  fs.writeFileSync(path.join(RADICE, 'docs', '07-SBOM.md'), markdown(T.it));
  fs.mkdirSync(path.join(RADICE, 'docs', 'en'), { recursive: true });
  fs.writeFileSync(path.join(RADICE, 'docs', 'en', '07-SBOM.md'), markdown(T.en));

  /* ── CycloneDX ── */
  const cdx = {
    bomFormat: 'CycloneDX', specVersion: '1.5', version: 1,
    metadata: {
      timestamp: istante,
      /* La licenza dell'APPLICAZIONE e' proprietaria (vedi LICENSE): non va
         confusa con quelle permissive dei componenti di terze parti. Una
         prima stesura di questo generatore dichiarava MIT anche per
         l'applicazione — un errore che in una SBOM consegnata a un cliente
         avrebbe comunicato diritti d'uso che non esistono. */
      component: { type: 'application', name: 'BioSpecInfo', version: versione,
                   description: 'Piattaforma di chemioinformatica interattiva client-side',
                   licenses: [{ license: { name: 'Proprietary — All rights reserved (Samuele Pio Provenzano)' } }] },
      properties: [{ name: 'git.commit', value: commit }]
    },
    components: COMPONENTI.map(function(c){
      const i = info(c.file);
      const v = { type: 'library', name: c.nome, publisher: c.fornitore,
                  description: c.ruolo, externalReferences: [{ type: 'website', url: c.url }],
                  licenses: [{ license: /Public Domain/.test(c.licenza) ? { name: c.licenza } : { id: c.licenza } }] };
      if (i.sha) v.hashes = [{ alg: 'SHA-256', content: i.sha }];
      return v;
    }).concat(dev.map(function(d){
      return { type: 'library', name: d.nome, version: d.versione, scope: 'excluded',
               description: 'Dipendenza di sviluppo: esecuzione dei banchi di prova.',
               licenses: [{ license: { id: d.licenza } }] };
    }))
  };
  fs.mkdirSync(path.join(RADICE, 'docs', 'evidence'), { recursive: true });
  fs.writeFileSync(path.join(RADICE, 'docs', 'evidence', 'sbom.cdx.json'),
                   JSON.stringify(cdx, null, 2));

  console.log('→ docs/07-SBOM.md');
  console.log('→ docs/en/07-SBOM.md');
  console.log('→ docs/evidence/sbom.cdx.json  (' + cdx.components.length + ' componenti)');
}

main();
