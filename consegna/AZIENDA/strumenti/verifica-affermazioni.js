#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   VERIFICA DELLE AFFERMAZIONI NUMERICHE — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   Il dossier tecnico si apre con dei numeri: «63 malattie (23 tumori)»,
   «46 strategie», «25 moduli», «178 farmaci», «87 sezioni». Sono la prima
   cosa che legge chi valuta, e bastano perche' tutto il resto venga
   creduto o messo in dubbio.

   Finora nessuno li controllava. Scritti una volta, restavano: l'app
   cresceva, i numeri no. E infatti `chimorga.html` dichiarava «25 moduli»
   in cima alla pagina e «17 moduli» piu' sotto — due affermazioni sullo
   stesso oggetto, nello stesso file, una delle due falsa.

   Questo banco confronta ogni numero dichiarato nei documenti con quello
   MISURATO nell'applicazione viva. Non stima: apre la pagina, apre la
   sezione, conta.

   UNA LEZIONE, PAGATA
   Scrivendo questo banco avevo gia' concluso che «63 malattie» fosse
   falso: nel sorgente avevo trovato un array `DISEASES` con 12 voci.
   Stavo per «correggere» il documento. Misurando nel DOM ho scoperto che
   il menu ne elenca davvero 63 — l'array che avevo trovato era un altro,
   piu' piccolo. Un conteggio sul sorgente non e' una misura: e' un
   indizio. Per questo qui si misura sempre sull'applicazione in
   esecuzione.

   USO   node tools/verifica-affermazioni.js     (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const RADICE = path.resolve(__dirname, '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0;

function att(desc, atteso, avuto){
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + desc + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + desc + '\n      dichiarato:  ' + atteso +
                           '\n      misurato:    ' + avuto); }
}

/* ─────────────────────────────────────────────────────────────────────
   Le affermazioni da controllare.

   `cerca` e' l'espressione che estrae il numero dichiarato dai documenti;
   `misura` lo ricava dall'applicazione viva. Un'affermazione che nessun
   documento contiene fa fallire il banco: significa che qualcuno l'ha
   tolta e il controllo sta girando a vuoto.
   ───────────────────────────────────────────────────────────────────── */
const AFFERMAZIONI = [
  {
    nome: 'sezioni navigabili',
    cerca: /\*\*(\d+)\s+sezioni\*\*|(\d+)\s+sezioni,\s+dati chimici|conta\s+\*\*(\d+)\s+sezioni\*\*/,
    dove: ['README.md', 'docs/13-Functional-Specifications.md'],
    misura: (pg) => pg.evaluate(() => document.querySelectorAll('.nav-btn[data-s]').length)
  },
  {
    nome: 'farmaci in banca dati',
    cerca: /\*\*(\d+)\s+farmaci\*\*|(\d+)\s+farmaci,\s+atlante/,
    dove: ['docs/13-Functional-Specifications.md', 'README.md'],
    misura: async (pg) => {
      await pg.evaluate(() => { const b = document.querySelector('.nav-btn[data-s="sfarm"]'); if (b) b.click(); });
      await pg.waitForTimeout(900);
      return pg.evaluate(() => (window.FARM_DATA || []).length);
    }
  },
  {
    nome: 'malattie nell\'atlante 3D',
    cerca: /(\d+)\s+malattie/,
    dove: ['docs/00-Technical-Dossier.md'],
    cercaEn: /(\d+)\s+diseases/,
    doveEn: ['docs/en/00-Technical-Dossier.md', 'docs/en/01-Software-Architecture-Document.md'],
    misura: async (pg) => {
      await pg.evaluate(() => { const b = document.querySelector('.nav-btn[data-s="sfarm"]'); if (b) b.click(); });
      await pg.waitForTimeout(900);
      return pg.evaluate(() => {
        const s = document.getElementById('atlasDisease');
        return s ? s.options.length : 0;
      });
    }
  },
  {
    nome: 'malattie oncologiche',
    cerca: /\((\d+)\s+tumori\)/,
    dove: ['docs/00-Technical-Dossier.md'],
    cercaEn: /(\d+)\s+tumou?rs/,
    doveEn: ['docs/en/00-Technical-Dossier.md', 'docs/en/01-Software-Architecture-Document.md'],
    misura: async (pg) => {
      await pg.evaluate(() => { const b = document.querySelector('.nav-btn[data-s="sfarm"]'); if (b) b.click(); });
      await pg.waitForTimeout(900);
      return pg.evaluate(() => {
        const s = document.getElementById('atlasDisease');
        if (!s) return 0;
        const re = /tumor|cancro|carcinom|leucem|linfom|mielom|sarcom|melanom|neoplas|glioma|blastom|epatocarc/i;
        return [].filter.call(s.options, o => re.test(o.textContent)).length;
      });
    }
  },
  {
    /* Il documento 05 ne dichiarava 32 mentre erano 35, e tre strumenti
       — analizza_molecola, disegna_molecola, mostra_spettri — non
       comparivano nemmeno nell'elenco. Un lettore che voglia sapere di
       cosa e' capace l'agente legge proprio quel numero. */
    nome: 'strumenti dell\'agente',
    cerca: /\*\*(\d+) strumenti\*\*|I (\d+) strumenti|schema dei (\d+) strumenti/,
    dove: ['docs/05-AI-Agent-Architecture.md', 'docs/13-Functional-Specifications.md'],
    cercaEn: /The (\d+) tools|schema of all (\d+) tools/,
    doveEn: ['docs/en/05-AI-Agent-Architecture.md'],
    misura: (pg) => pg.evaluate(() => (window.BSI_AI_TOOLS || []).length)
  },
  {
    nome: 'strategie di retrosintesi',
    cerca: /(\d+)\s+strategie/,
    dove: ['docs/00-Technical-Dossier.md', 'docs/01-Software-Architecture-Document.md'],
    cercaEn: /(\d+)\s+strategies/,
    doveEn: ['docs/en/00-Technical-Dossier.md'],
    misura: async (pg) => {
      await pg.evaluate(() => { const b = document.querySelector('.nav-btn[data-s="sretro"]'); if (b) b.click(); });
      await pg.waitForTimeout(1200);
      return pg.evaluate(() => document.querySelectorAll('.section.on .rv16-card').length);
    }
  }
];

/* La chimica organica sta su una pagina a se': si misura li'. */
const AFFERMAZIONI_ALTRE_PAGINE = [
  {
    nome: 'moduli di chimica organica',
    pagina: 'chimorga.html',
    cerca: /(\d+)\s+moduli/,
    dove: ['docs/00-Technical-Dossier.md'],
    cercaEn: /(\d+)\s+modules/,
    doveEn: ['docs/en/00-Technical-Dossier.md', 'docs/en/01-Software-Architecture-Document.md'],
    misura: (pg) => pg.evaluate(() => document.querySelectorAll('nav a').length)
  }
];

/* ─────────────────────────────────────────────────────────────────────
   I badge del README
   ─────────────────────────────────────────────────────────────────────
   Sono la prima cosa che vede chi apre il repository — prima del titolo,
   prima di qualunque documento. Erano fermi a `bsi-v165` e «34 banchi
   superati» mentre la versione era la 169 e i banchi 40.

   Un numero sbagliato in fondo a un documento e' una svista. Lo stesso
   numero sbagliato nel primo pixel della pagina e' il biglietto da
   visita.
   ───────────────────────────────────────────────────────────────────── */
function verificaBadge(){
  console.log('\n── Badge del README ──');
  let t;
  try { t = fs.readFileSync(path.join(RADICE, 'README.md'), 'utf8'); }
  catch (e) { ko++; console.log('  ✗ README.md non leggibile'); return; }

  let versioneCodice = '(non letta)';
  try {
    const m = fs.readFileSync(path.join(RADICE, 'sw.js'), 'utf8').match(/CACHE\s*=\s*'([^']+)'/);
    if (m) versioneCodice = m[1];
  } catch (e) {}

  const bv = t.match(/badge\/versione-(bsi--v\d+)-/);
  /* L'ordine conta per il messaggio, non per l'esito: il BADGE è ciò che il
     documento dichiara, il codice è la misura. Scritto al contrario, il banco
     falliva dicendo «dichiarato: <il valore vero>». */
  att('il badge della versione è allineato al codice',
      bv ? bv[1] : '(badge assente)', versioneCodice.replace('-', '--'));

  /* Quanti banchi dichiara la batteria: si conta l'elenco reale, non si
     crede al numero scritto. */
  let banchiReali = 0;
  try {
    const g = fs.readFileSync(path.join(RADICE, 'tools', 'genera-evidenza.js'), 'utf8');
    const blocco = g.slice(g.indexOf('const FAMIGLIE'), g.indexOf('const FILE_IMPRONTA'));
    /* il trattino fa parte dei nomi: '@verifica-farmaci' e i suoi quattro
       fratelli sfuggivano alla classe di caratteri, e il conteggio dava 35
       invece di 40 */
    banchiReali = (blocco.match(/'[@a-z_0-9-]+'/gi) || [])
      .filter(s => /^'(@|test_|audit_|browser_|caccia_|verifica)/i.test(s)).length;
  } catch (e) {}

  const bb = t.match(/badge\/banchi-(\d+)%20superati/);
  att('il badge dei banchi coincide con la batteria',
      bb ? +bb[1] : '(badge assente)', banchiReali);

  /* Un badge «0 difetti di contrasto» e' un'affermazione forte messa nel
     primo pixel della pagina: deve venire dalla misura registrata, non
     dalla memoria di chi ha scritto il README. Se il debito risale, il
     badge diventa falso e questo controllo lo dice. */
  let contrastoReale = '(riferimento non letto)';
  try {
    contrastoReale = JSON.parse(fs.readFileSync(
      path.join(RADICE, 'docs', 'evidence', 'accessibilita-riferimento.json'), 'utf8')).contrasto;
  } catch (e) {}
  const bc = t.match(/badge\/contrasto%20WCAG%20AA-(\d+)%20difetti/);
  att('il badge del contrasto coincide con la misura registrata',
      bc ? +bc[1] : '(badge assente)', contrastoReale);
}

/* Estrae il numero dichiarato, e pretende che i documenti siano
   d'accordo fra loro: due documenti che dicono cose diverse sullo stesso
   oggetto sono un difetto anche se uno dei due ha ragione. */
/* La traduzione inglese conta come gli altri documenti.
   Non e' una cortesia verso il lettore non italofono: e' l'insieme di
   documenti che un valutatore straniero legge PER INTERO, e se dice 84
   sezioni mentre l'italiano ne dice 87 una delle due versioni sta
   mentendo. La deriva c'era davvero — `docs/en/05` e' rimasto a «84
   sections» e a `bsi-v146` per tre versioni, e nessun banco la vedeva
   perche' guardava solo l'italiano. */
function dichiarato(aff){
  const valori = new Map();
  const fonti = aff.dove.map(f => ({ file: f, re: aff.cerca }))
    .concat((aff.doveEn || []).map(f => ({ file: f, re: aff.cercaEn || aff.cerca })));
  fonti.forEach(function(s){
    let t;
    try { t = fs.readFileSync(path.join(RADICE, s.file), 'utf8'); } catch (e) { return; }
    const m = t.match(s.re);
    if (!m) return;
    const v = m.slice(1).find(x => x !== undefined);
    if (v === undefined) return;
    if (!valori.has(v)) valori.set(v, []);
    valori.get(v).push(s.file);
  });
  return valori;
}

(async () => {
  console.log('Verifica delle affermazioni numeriche');
  console.log('Ogni numero dichiarato nei documenti è confrontato con quello');
  console.log('misurato nell\'applicazione in esecuzione.\n');

  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ serviceWorkers: 'block' });

  const pg = await ctx.newPage();
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2200);

  let esaminate = 0;

  for (const aff of AFFERMAZIONI.concat(AFFERMAZIONI_ALTRE_PAGINE)) {
    const valori = dichiarato(aff);

    if (valori.size === 0) {
      ko++;
      console.log('  ✗ ' + aff.nome + ': nessun documento la dichiara — ' +
                  'il controllo sta girando a vuoto');
      continue;
    }
    if (valori.size > 1) {
      ko++;
      console.log('  ✗ ' + aff.nome + ': i documenti non concordano fra loro');
      valori.forEach((file, v) => console.log('      ' + v + ' in ' + file.join(', ')));
      continue;
    }

    let p = pg;
    if (aff.pagina) {
      p = await ctx.newPage();
      await p.goto(BASE + aff.pagina, { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(2000);
    }

    let misurato;
    try { misurato = await aff.misura(p); }
    catch (e) { misurato = '(misura fallita: ' + e.message.split('\n')[0] + ')'; }

    if (aff.pagina) await p.close();

    const v = [...valori.keys()][0];
    att(aff.nome, v, misurato);
    esaminate++;
  }

  await browser.close();

  verificaBadge();

  /* Un banco che non esamina nulla passerebbe comunque. */
  console.log('\n── Riepilogo ──');
  if (esaminate === 0) {
    console.log('✗ nessuna affermazione esaminata: il controllo non sta misurando nulla');
    process.exit(1);
  }
  console.log('  affermazioni confrontate con la misura: ' + esaminate);
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(function(e){ console.error(e); process.exit(1); });
