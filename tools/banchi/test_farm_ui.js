/* ═══════════════════════════════════════════════════════════════════════════
   test_farm_ui — l'Atlante Farmaci mostra TUTTI i farmaci che ha

   PERCHE' QUESTO BANCO ESISTE IN QUESTA FORMA

   Esisteva giA' un file con questo nome. Stampava sei numeri e usciva con 0 a
   meno che non ci fossero errori JavaScript: non verificava niente, e NON era
   registrato nella batteria. Mentre taceva, la sezione mostrava 118 farmaci
   su 233.

   La causa era una riga:

       var cats = cat==="all" ? Object.keys(catName) : [cat];

   Le categorie da disegnare venivano dalla mappa delle ETICHETTE, non dai
   dati. Ogni farmaco la cui categoria non figurava in quella mappa non veniva
   mai disegnato: 29 categorie su 47, 115 voci su 233 — e 60 su 178 anche prima
   che si aggiungessero farmaci nuovi.

   Un banco che conta le voci in memoria non vede questo difetto, perche' le
   voci in memoria c'erano tutte. Bisogna contare quelle DISEGNATE, e
   pretendere che i due numeri coincidano.

   USO   node tools/banchi/test_farm_ui.js     (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;

function att(d, atteso, avuto){
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1280, height: 900 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(3000);
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });
  await pg.evaluate(() => {
    const n = document.querySelector('.nav-btn[data-s="sfarm"]');
    if (n) n.click();
  });
  await pg.waitForTimeout(1800);

  console.log('Atlante Farmaci — ogni voce in memoria deve essere disegnata\n');

  const r = await pg.evaluate(() => {
    const dati = (typeof FARM_DATA !== 'undefined' ? FARM_DATA : []);
    const sec = document.getElementById('sfarm');
    const lista = document.getElementById('farmList');
    const testo = lista ? lista.textContent : '';

    /* Il nome di ogni farmaco deve comparire nella lista disegnata. Si cerca
       il nome e non la scheda, perche' la struttura delle schede puo'
       cambiare: il nome no. */
    const nonDisegnati = dati.filter(function (d) {
      return d && d.name && testo.indexOf(d.name) === -1;
    }).map(function (d) { return d.name + ' [' + d.cat + ']'; });

    /* Le categorie presenti nei dati e quelle effettivamente intestate */
    const catDati = {};
    dati.forEach(function (d) { if (d && d.cat) catDati[d.cat] = (catDati[d.cat] || 0) + 1; });

    /* I pesi molecolari mostrati: una scheda che dice «undefined g/mol» e'
       peggio di una scheda assente, perche' sembra un dato. */
    const pesiRotti = (testo.match(/undefined\s*g\/mol/g) || []).length +
                      (testo.match(/NaN\s*g\/mol/g) || []).length;

    return {
      inMemoria: dati.length,
      conStruttura: dati.filter(function (d) { return d && d.smi; }).length,
      categorieNeiDati: Object.keys(catDati).length,
      nonDisegnati: nonDisegnati,
      quantiNonDisegnati: nonDisegnati.length,
      nodi: sec ? sec.getElementsByTagName('*').length : 0,
      listaPresente: !!lista,
      pesiRotti: pesiRotti,
      sezioneVisibile: sec ? getComputedStyle(sec).display !== 'none' : false
    };
  });

  att('la sezione è visibile', true, r.sezioneVisibile);
  att('il contenitore della lista esiste', true, r.listaPresente);
  /* Un insieme vuoto passerebbe «tutti disegnati» senza disegnare niente. */
  att('i farmaci in memoria sono molti', true, r.inMemoria >= 200);
  att('le categorie nei dati sono molte', true, r.categorieNeiDati >= 40);
  att('OGNI farmaco in memoria compare nella lista disegnata', 0, r.quantiNonDisegnati);
  r.nonDisegnati.slice(0, 12).forEach(n => console.log('      ! non disegnato: ' + n));
  att('nessuna scheda mostra un peso molecolare rotto', 0, r.pesiRotti);
  console.log('      (' + r.inMemoria + ' farmaci, ' + r.conStruttura + ' con struttura, ' +
              r.categorieNeiDati + ' categorie, ' + r.nodi + ' nodi nella sezione)');

  /* ── Il filtro per categoria ──────────────────────────────────────────
     Selezionando una categoria si devono vedere le sue voci e NON le altre:
     un filtro che non filtra e uno che filtra tutto sono entrambi rotti. */
  const filtro = await pg.evaluate(() => {
    const dati = (typeof FARM_DATA !== 'undefined' ? FARM_DATA : []);
    const conta = {};
    dati.forEach(function (d) { if (d && d.cat) conta[d.cat] = (conta[d.cat] || 0) + 1; });
    /* si prova sulla categoria piu' popolosa, cosi' il conteggio e' robusto */
    const cat = Object.keys(conta).sort(function (a, b) { return conta[b] - conta[a]; })[0];
    if (typeof showFarm !== 'function') return { assente: true };
    showFarm(cat);
    const testo = document.getElementById('farmList').textContent;
    const dentro = dati.filter(function (d) { return d.cat === cat; });
    const fuori = dati.filter(function (d) { return d.cat !== cat; });
    const risultato = {
      categoria: cat, attesi: dentro.length,
      mancanti: dentro.filter(function (d) { return testo.indexOf(d.name) === -1; }).length,
      intrusi: fuori.filter(function (d) {
        /* un nome che e' sottostringa di un altro non conta come intruso */
        return testo.indexOf(d.name) !== -1 &&
               !dentro.some(function (x) { return x.name.indexOf(d.name) !== -1; });
      }).length
    };
    showFarm('all');
    return risultato;
  });
  if (filtro.assente) {
    ko++; eseguiti++;
    console.log('  ✗ showFarm non è esposta: il filtro non è verificabile');
  } else {
    att('il filtro mostra tutte le voci della categoria scelta', 0, filtro.mancanti);
    att('e nessuna voce di altre categorie', 0, filtro.intrusi);
    console.log('      (categoria «' + filtro.categoria + '», ' + filtro.attesi + ' voci attese)');
  }

  /* ── La prova che conta davvero ────────────────────────────────────────
     Il difetto originale si e' corretto in due modi insieme: aggiungendo le
     29 etichette mancanti E facendo derivare le categorie dai dati. Con le
     etichette a posto, anche la riga difettosa disegna tutto — quindi un
     controllo sui farmaci ESISTENTI non distingue le due correzioni.

     Il caso che resta da sorvegliare e' l'altro: una categoria NUOVA, per cui
     nessuno ha ancora scritto un'etichetta. Si inserisce un farmaco finto con
     una categoria inventata e si pretende che venga disegnato comunque.
     Se un giorno qualcuno tornasse a costruire l'elenco dalle etichette,
     questo controllo lo direbbe; quello sopra no. */
  const inventata = await pg.evaluate(() => {
    if (typeof FARM_DATA === 'undefined' || typeof showFarm !== 'function') return { assente: true };
    const finto = { name: 'ZZ-Molecola-Di-Prova', cat: 'categoria_mai_etichettata',
                    smi: 'CCO', mw: '46.07', moa: 'voce di prova inserita dal banco',
                    indicaz: '—', effetti: '—', classe: 'prova' };
    FARM_DATA.push(finto);
    showFarm('all');
    const disegnato = document.getElementById('farmList').textContent.indexOf(finto.name) !== -1;
    /* si rimette l'insieme come era: un banco non deve lasciare tracce */
    const i = FARM_DATA.indexOf(finto);
    if (i >= 0) FARM_DATA.splice(i, 1);
    showFarm('all');
    const ripulito = document.getElementById('farmList').textContent.indexOf(finto.name) === -1;
    return { disegnato: disegnato, ripulito: ripulito };
  });
  if (inventata.assente) {
    ko++; eseguiti++;
    console.log('  ✗ FARM_DATA o showFarm non raggiungibili: la prova non è eseguibile');
  } else {
    att('un farmaco con una categoria MAI etichettata viene disegnato comunque',
        true, inventata.disegnato);
    att('e il banco non lascia tracce nell\'insieme', true, inventata.ripulito);
  }

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 11) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 11');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
