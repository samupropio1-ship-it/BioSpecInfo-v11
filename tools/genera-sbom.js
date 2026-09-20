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
    ruolo: 'Chemioinformatica: interpretazione SMILES, SMARTS, descrittori, disegno 2D.' },
  { file: 'RDKit_minimal.wasm', nome: 'RDKit MinimalLib (WebAssembly)', licenza: 'BSD-3-Clause',
    fornitore: 'RDKit / Greg Landrum', url: 'https://github.com/rdkit/rdkit',
    ruolo: 'Binario WebAssembly del motore chemioinformatico.' },
  { file: 'three.min.js', nome: 'three.js', licenza: 'MIT',
    fornitore: 'mrdoob e collaboratori', url: 'https://threejs.org',
    ruolo: 'Motore di rendering WebGL per le scene 3D.' },
  { file: 'three_bloom.js', nome: 'three.js — UnrealBloomPass', licenza: 'MIT',
    fornitore: 'mrdoob e collaboratori', url: 'https://threejs.org',
    ruolo: 'Effetto di post-produzione per le visualizzazioni astronomiche.' },
  { file: 'gltf_loader.js', nome: 'three.js — GLTFLoader', licenza: 'MIT',
    fornitore: 'mrdoob e collaboratori', url: 'https://threejs.org',
    ruolo: 'Caricamento dei modelli anatomici e molecolari in formato glTF.' },
  { file: '3Dmol-min.js', nome: '3Dmol.js', licenza: 'BSD-3-Clause',
    fornitore: 'University of Pittsburgh / David Koes', url: 'https://3dmol.csb.pitt.edu',
    ruolo: 'Visualizzazione molecolare 3D (PDB, SDF, superfici).' },
  { file: 'smiles-drawer.min.js', nome: 'SmilesDrawer', licenza: 'MIT',
    fornitore: 'Daniel Probst', url: 'https://github.com/reymond-group/smilesDrawer',
    ruolo: 'Disegno 2D delle strutture a partire da SMILES.' },
  { file: 'lib/sql-wasm.js', nome: 'sql.js (JS glue)', licenza: 'MIT',
    fornitore: 'sql.js / SQLite', url: 'https://github.com/sql-js/sql.js',
    ruolo: 'Database SQLite in-browser per le esercitazioni sui dati.' },
  { file: 'lib/sql-wasm.wasm', nome: 'SQLite (WebAssembly)', licenza: 'Public Domain',
    fornitore: 'SQLite Consortium', url: 'https://sqlite.org',
    ruolo: 'Motore SQLite compilato in WebAssembly.' },
  { file: 'lib/dimuon.js', nome: 'Dataset dimuoni (CERN Open Data)', licenza: 'CC0-1.0',
    fornitore: 'CERN Open Data Portal', url: 'https://opendata.cern.ch',
    ruolo: 'Dati sperimentali per l\'esercitazione di fisica delle particelle.' }
];

/* Il codice scritto per questo progetto: non e' una dipendenza, ma un
   revisore deve poterne verificare l'integrita' allo stesso modo. */
const PROPRI = [
  { file: 'index.html',     ruolo: 'Applicazione principale: interfaccia, sezioni didattiche, dati chimici.' },
  { file: 'bsi-ai-hub.js',  ruolo: 'Agente AI «Spectra»: ciclo agentico, strumenti, gestione dei fornitori.' },
  { file: 'bsi-spettri.js', ruolo: 'Motore di predizione spettrale IR/NMR su grafo molecolare.' },
  { file: 'sw.js',          ruolo: 'Service Worker: funzionamento offline e strategia di rete.' },
  { file: 'rdkit_lab.html', ruolo: 'Laboratorio di chemioinformatica.' },
  { file: 'astro.html',     ruolo: 'Modulo di astrochimica.' },
  { file: 'chimorga.html',  ruolo: 'Modulo di chimica organica.' },
  { file: 'proxy/spectra-proxy.js', ruolo: 'Proxy opzionale (Cloudflare Worker) per le chiamate all\'AI.' }
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

  /* ── Markdown ── */
  let m = '';
  m += '# Distinta dei componenti software (SBOM)\n\n';
  m += '**BioSpecInfo** · documento generato da `tools/genera-sbom.js`.\n\n';
  m += '| | |\n|---|---|\n';
  m += '| Versione applicazione | `' + versione + '` |\n';
  m += '| Commit | `' + commit + '` |\n';
  m += '| Generato (UTC) | `' + istante + '` |\n';
  m += '| Formato macchina | [`evidence/sbom.cdx.json`](evidence/sbom.cdx.json) — CycloneDX 1.5 |\n\n';
  m += '> Le impronte SHA-256 si riferiscono ai file effettivamente distribuiti in\n';
  m += '> questo commit. Un revisore può ricalcolarle con `sha256sum <file>` e\n';
  m += '> confrontarle, verificando di avere sotto mano lo stesso artefatto descritto.\n\n';

  m += '---\n\n## 1. Componenti di terze parti distribuiti con l\'applicazione\n\n';
  m += 'Tutti i componenti sono **inclusi nel repository** e serviti dallo stesso\n';
  m += 'dominio: l\'applicazione non carica codice da CDN esterne in fase di\n';
  m += 'esecuzione. È la condizione che le rende utilizzabile offline e che elimina\n';
  m += 'la dipendenza dalla disponibilità di terzi.\n\n';
  m += '| Componente | Versione/File | Licenza | Dimensione | Ruolo |\n';
  m += '|---|---|---|---:|---|\n';
  COMPONENTI.forEach(function(c){
    const i = info(c.file);
    m += '| **' + c.nome + '**<br><sub>' + c.fornitore + '</sub> | `' + c.file + '` | ' +
         c.licenza + ' | ' + kb(i.byte) + ' | ' + c.ruolo + ' |\n';
  });

  m += '\n### Impronte\n\n| File | SHA-256 |\n|---|---|\n';
  COMPONENTI.forEach(function(c){
    const i = info(c.file);
    m += '| `' + c.file + '` | `' + (i.sha || 'file assente') + '` |\n';
  });

  m += '\n---\n\n## 2. Codice proprio del progetto\n\n';
  m += '| File | Dimensione | Ruolo |\n|---|---:|---|\n';
  PROPRI.forEach(function(c){
    const i = info(c.file);
    m += '| `' + c.file + '` | ' + kb(i.byte) + ' | ' + c.ruolo + ' |\n';
  });
  m += '\n### Impronte\n\n| File | SHA-256 |\n|---|---|\n';
  PROPRI.forEach(function(c){
    const i = info(c.file);
    m += '| `' + c.file + '` | `' + (i.sha || 'file assente') + '` |\n';
  });

  m += '\n---\n\n## 3. Dipendenze di sviluppo\n\n';
  if (dev.length){
    m += 'Usate **solo** per l\'esecuzione dei banchi di prova. Non vengono distribuite\n';
    m += 'con l\'applicazione e non sono presenti in produzione.\n\n';
    m += '| Pacchetto | Versione | Licenza |\n|---|---|---|\n';
    dev.forEach(function(d){ m += '| `' + d.nome + '` | ' + d.versione + ' | ' + d.licenza + ' |\n'; });
  } else {
    m += '_Nessuna dipendenza di sviluppo rilevata nel lockfile._\n';
  }

  m += '\n---\n\n## 4. Dipendenze di esecuzione\n\n';
  m += '**Nessuna.** L\'applicazione non ha backend, non installa pacchetti a runtime e\n';
  m += 'non carica script da domini esterni. Le uniche chiamate di rete sono opzionali\n';
  m += 'e dirette a servizi pubblici documentati:\n\n';
  m += '| Servizio | Scopo | Se non raggiungibile |\n|---|---|---|\n';
  m += '| PubChem PUG-REST | nome IUPAC, CAS, pittogrammi GHS, conformeri 3D | l\'app usa i dati locali e lo dichiara |\n';
  m += '| NASA / ESA | immagini e dati astronomici | il modulo mostra i dati tabulati |\n';
  m += '| Fornitori AI (a scelta dell\'utente) | risposte dell\'assistente | l\'assistente lo segnala e propone alternative |\n\n';
  m += 'Nessun dato personale viene trasmesso: le chiavi API, se inserite, restano nel\n';
  m += '`localStorage` del dispositivo, oppure sul proxy dell\'utente (vedi `proxy/`).\n\n';

  m += '---\n\n## 5. Compatibilità delle licenze\n\n';
  m += 'Tutte le licenze dei componenti distribuiti (MIT, BSD-3-Clause, CC0, Public\n';
  m += 'Domain) sono **permissive** e reciprocamente compatibili. Nessun componente è\n';
  m += 'soggetto a licenza copyleft forte (GPL/AGPL): non esistono vincoli di\n';
  m += 'ridistribuzione del codice proprio del progetto.\n\n';
  m += 'Gli obblighi residui sono di **attribuzione**: le note di licenza dei progetti a\n';
  m += 'monte sono riportate in `THIRD_PARTY_NOTICES.md`.\n\n';
  m += '> **La licenza dell\'applicazione è distinta da quelle dei componenti.**\n';
  m += '> Il codice proprio di BioSpecInfo è **proprietario** — *All rights reserved*\n';
  m += '> (vedi [`LICENSE`](../LICENSE)): visibile e valutabile, ma copia, riuso e uso\n';
  m += '> commerciale richiedono autorizzazione scritta dell\'Autore. Le licenze\n';
  m += '> permissive elencate sopra riguardano **soltanto** le librerie di terze parti\n';
  m += '> incluse, e non si estendono all\'applicazione.\n\n';
  m += '_Generato il ' + istante + '._\n';

  fs.writeFileSync(path.join(RADICE, 'docs', '07-SBOM.md'), m);

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
  console.log('→ docs/evidence/sbom.cdx.json  (' + cdx.components.length + ' componenti)');
}

main();
