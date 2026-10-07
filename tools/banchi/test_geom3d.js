/* ═══════════════════════════════════════════════════════════════════════════
   test_geom3d — una geometria si verifica contro i numeri che la chimica sa

   PERCHE' QUESTO BANCO ESISTE

   Un generatore di coordinate non si rompe mai: produce sempre tre numeri per
   atomo, e il visore li disegna. Una molecola può uscire con i legami lunghi
   il doppio, il benzene a sella e due atomi sovrapposti, e sullo schermo
   sembra comunque una molecola — anzi, sembra una molecola interessante.

   L'unico modo di sapere se serve a qualcosa è confrontarla con i valori che
   la chimica misura da cent'anni: un legame C–C sta a 1,54 Å, uno aromatico a
   1,39, un angolo tetraedrico a 109,5°, un alchino è diritto. E soprattutto
   NEI DUE VERSI: il benzene deve risultare piano E il cicloesano NON piano.
   Un banco che chiedesse solo la planarità passerebbe anche a un programma
   che appiattisce tutto.

   LA PROVA PIU' IMPORTANTE DI TUTTE sta in fondo: che l'atomo `i` di questa
   geometria sia lo STESSO atomo `i` del predittore NMR. È la condizione senza
   la quale il collegamento picco↔atomo↔3D illumina l'atomo sbagliato, e un
   atomo sbagliato che sembra giusto è peggio di nessun atomo.

   USO   node tools/banchi/test_geom3d.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vicino(d, atteso, avuto, tol) {
  eseguiti++;
  if (typeof avuto === 'number' && Math.abs(avuto - atteso) <= tol) {
    ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (atteso ' + atteso + ' ± ' + tol + ')');
  } else {
    ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tol +
                      '\n      avuto:  ' + avuto);
  }
}
function sopra(d, limite, avuto) {
  eseguiti++;
  if (typeof avuto === 'number' && avuto >= limite) {
    ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (almeno ' + limite + ')');
  } else { ko++; console.log('  ✗ ' + d + '\n      almeno: ' + limite + '\n      avuto:  ' + avuto); }
}
function sotto(d, limite, avuto) {
  eseguiti++;
  if (typeof avuto === 'number' && avuto <= limite) {
    ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (al più ' + limite + ')');
  } else { ko++; console.log('  ✗ ' + d + '\n      al più: ' + limite + '\n      avuto:  ' + avuto); }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block',
                                         viewport: { width: 1300, height: 1000 } })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming compile failed|falling back to ArrayBuffer instantiation/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });

  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(6000);
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

  console.log('Geometria 3D — costruita dal grafo, misurata contro la chimica\n');

  console.log('── Il motore ──');
  att('BSIGeom3D è caricato', 'object',
      await pg.evaluate(() => typeof window.BSIGeom3D));

  const m = await pg.evaluate(async () => {
    await new Promise(r => window.bsiLoadRDKit(r));
    const G = window.BSIGeom3D;
    const out = {};
    const dai = (smi, opz) => G.coordina(smi, opz);

    /* ── lunghezze di legame ─────────────────────────────────────────────── */
    const etano = dai('CC');
    out.etanoCC = etano ? +G.distanza(etano, 0, 1).toFixed(3) : null;
    const etene = dai('C=C');
    out.eteneCC = etene ? +G.distanza(etene, 0, 1).toFixed(3) : null;
    const etino = dai('C#C');
    out.etinoCC = etino ? +G.distanza(etino, 0, 1).toFixed(3) : null;
    const benz = dai('c1ccccc1');
    out.benzCC = benz ? +G.distanza(benz, 0, 1).toFixed(3) : null;
    const etanolo = dai('CCO');
    out.etanoloCO = etanolo ? +G.distanza(etanolo, 1, 2).toFixed(3) : null;
    out.etanoCH = etano ? +G.distanza(etano, 0, 2).toFixed(3) : null;

    /* ── angoli ──────────────────────────────────────────────────────────── */
    /* il metano: quattro H attorno a un carbonio, angolo tetraedrico */
    const metano = dai('C');
    out.metanoHCH = metano ? +G.angolo(metano, 1, 0, 2).toFixed(1) : null;
    /* il propano: angolo C–C–C */
    const propano = dai('CCC');
    out.propanoCCC = propano ? +G.angolo(propano, 0, 1, 2).toFixed(1) : null;
    /* il benzene: angolo interno dell'anello */
    out.benzCCC = benz ? +G.angolo(benz, 0, 1, 2).toFixed(1) : null;
    /* il propino: un alchino è diritto */
    const propino = dai('CC#C');
    out.propinoCCC = propino ? +G.angolo(propino, 0, 1, 2).toFixed(1) : null;
    /* l'acqua di un alcol: l'ossigeno è piegato, non diritto */
    out.etanoloCOH = etanolo
      ? +G.angolo(etanolo, 1, 2, etanolo.atomi.length - 1).toFixed(1) : null;

    /* ── planarità, nei due versi ────────────────────────────────────────── */
    out.benzPiano = benz ? +G.fuoriDalPiano(benz, [0, 1, 2, 3, 4, 5]).toFixed(3) : null;
    const cicloesano = dai('C1CCCCC1');
    out.cicloesanoPiano = cicloesano
      ? +G.fuoriDalPiano(cicloesano, [0, 1, 2, 3, 4, 5]).toFixed(3) : null;
    const naft = dai('c1ccc2ccccc2c1');
    out.naftPiano = naft
      ? +G.fuoriDalPiano(naft, [0,1,2,3,4,5,6,7,8,9]).toFixed(3) : null;

    /* ── niente atomi sovrapposti, su una molecola vera ──────────────────── */
    const asp = dai('CC(=O)Oc1ccccc1C(=O)O');
    let minimo = 1e9;
    if (asp) {
      /* «Non legati» vuol dire ad almeno TRE legami di distanza. Due
         idrogeni dello stesso metile stanno a 1,78 Å ed è giusto così: sono
         geminali, non si stanno compenetrando. Contandoli, il banco avrebbe
         bocciato una geometria corretta — e un banco che boccia il giusto si
         finisce per ignorarlo. */
      const vic = {};
      asp.atomi.forEach((a, i) => { vic[i] = []; });
      asp.bonds.forEach(l => { vic[l.a].push(l.b); vic[l.b].push(l.a); });
      const topo = (s0) => {
        const d = {}; d[s0] = 0; const q = [s0];
        while (q.length) {
          const u = q.shift();
          if (d[u] >= 3) continue;
          vic[u].forEach(v => { if (d[v] === undefined) { d[v] = d[u] + 1; q.push(v); } });
        }
        return d;
      };
      for (let i = 0; i < asp.atomi.length; i++) {
        const d3 = topo(i);
        for (let j = i + 1; j < asp.atomi.length; j++) {
          if (d3[j] !== undefined && d3[j] <= 2) continue;
          const d = G.distanza(asp, i, j);
          if (d < minimo) minimo = d;
        }
      }
    }
    out.aspirinaMinima = asp ? +minimo.toFixed(3) : null;
    out.aspirinaScarto = asp ? asp.scarto : null;
    out.aspirinaAtomi = asp ? asp.atomi.length : 0;

    /* ── le molecole vere, non i casi di scuola ──────────────────────────
       Un generatore che va bene sul metano e crolla su un farmaco non serve
       a niente: le molecole che si guardano in 3D sono queste. */
    out.grandi = [['caffeina', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C'],
                  ['ibuprofene', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O'],
                  ['naprossene', 'COc1ccc2cc(ccc2c1)C(C)C(=O)O'],
                  ['paracetamolo', 'CC(=O)Nc1ccc(O)cc1'],
                  ['atorvastatina',
                   'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CC[C@@H](O)C[C@@H](O)CC(=O)O']]
      .map(function (c) {
        const t0 = performance.now();
        const g = G.coordina(c[1]);
        const ms = performance.now() - t0;
        if (!g || g.errore) return { nome: c[0], errore: true };
        /* si guardano solo le coppie ad almeno TRE legami: un legame O–H
           sta a 0,97 Å ed è giusto così, e contarlo farebbe bocciare al
           banco una geometria corretta */
        const vc = {};
        g.atomi.forEach((a, i) => { vc[i] = []; });
        g.bonds.forEach(l => { vc[l.a].push(l.b); vc[l.b].push(l.a); });
        let vicini = 1e9;
        for (let i = 0; i < g.atomi.length; i++) {
          const dd = {}; dd[i] = 0; const qq = [i];
          while (qq.length) {
            const u = qq.shift();
            if (dd[u] >= 2) continue;
            vc[u].forEach(v => { if (dd[v] === undefined) { dd[v] = dd[u] + 1; qq.push(v); } });
          }
          for (let j = i + 1; j < g.atomi.length; j++) {
            if (dd[j] !== undefined) continue;
            const d = G.distanza(g, i, j);
            if (d < vicini) vicini = d;
          }
        }
        return { nome: c[0], n: g.atomi.length, scarto: g.scarto,
                 minima: +vicini.toFixed(2), ms: Math.round(ms) };
      });

    /* ── riproducibilità: la stessa molecola, la stessa forma ───────────── */
    const a1 = dai('CCOC(C)=O'), a2 = dai('CCOC(C)=O');
    out.identiche = (a1 && a2)
      ? a1.atomi.every((p, k) => Math.abs(p.x - a2.atomi[k].x) < 1e-12 &&
                                 Math.abs(p.y - a2.atomi[k].y) < 1e-12 &&
                                 Math.abs(p.z - a2.atomi[k].z) < 1e-12)
      : false;
    /* e due molecole DIVERSE non devono uscire uguali: il seme dipende dallo
       SMILES, non è una costante */
    const b1 = dai('CCCCO');
    out.diverse = (a1 && b1) ? (a1.atomi.length !== b1.atomi.length ||
      Math.abs(a1.atomi[0].x - b1.atomi[0].x) > 1e-9) : false;

    /* ── LA PROVA CHE CONTA: gli indici sono quelli del predittore ───────── */
    const prove = ['CC(=O)Oc1ccccc1C(=O)O', 'COc1ccc(cc1)C(C)=O', 'CCCC(=O)OCC',
                   'c1ccc2ccccc2c1', 'O=C1CCCCC1'];
    out.indici = prove.map(function (smi) {
      const g = window.BSIGeom3D.coordina(smi);
      const R = window.__rdkit;
      const mol = R.get_mol(smi);
      const gr = window.BSINMR.grafoDa(mol);
      try { mol.delete(); } catch (e) {}
      if (!g || !gr) return { smi: smi, esito: 'nullo' };
      /* stesso numero di atomi PESANTI, e stesso elemento posizione per
         posizione: se un indice slittasse, qui si vedrebbe subito */
      if (g.nPesanti !== gr.atomi.length) {
        return { smi: smi, esito: 'conteggio ' + g.nPesanti + ' vs ' + gr.atomi.length };
      }
      for (let i = 0; i < gr.atomi.length; i++) {
        if (g.atomi[i].el !== gr.atomi[i].sim) {
          return { smi: smi, esito: 'atomo ' + i + ': ' + g.atomi[i].el +
                                    ' invece di ' + gr.atomi[i].sim };
        }
      }
      /* e gli idrogeni stanno DOPO, mai in mezzo */
      for (let i = 0; i < g.nPesanti; i++) {
        if (g.atomi[i].el === 'H') return { smi: smi, esito: 'un H in posizione ' + i };
      }
      return { smi: smi, esito: 'ok', nP: g.nPesanti, nTot: g.atomi.length };
    });

    /* ── i rifiuti ───────────────────────────────────────────────────────── */
    out.rotto = G.coordina('questo non e uno smiles');
    out.rottoNullo = (out.rotto === null) || !!(out.rotto && out.rotto.errore);
    out.vuoto = G.coordina('') === null ? 'null' : 'oggetto';

    /* ── e la forma che il visore si aspetta ─────────────────────────────── */
    const v = G.perVisore('CCO');
    out.visore = !!(v && v.atoms && v.atoms.length && v.bonds &&
                    typeof v.atoms[0].x === 'number' && v.atoms[0].el);
    return out;
  });

  console.log('\n── Le lunghezze di legame (Å) ──');
  vicino('C–C semplice (etano)', 1.54, m.etanoCC, 0.04);
  vicino('C=C doppio (etene)', 1.34, m.eteneCC, 0.04);
  vicino('C≡C triplo (etino)', 1.20, m.etinoCC, 0.04);
  vicino('C–C aromatico (benzene)', 1.39, m.benzCC, 0.04);
  vicino('C–O (etanolo)', 1.43, m.etanoloCO, 0.05);
  vicino('C–H (etano)', 1.09, m.etanoCH, 0.05);

  console.log('\n── Gli angoli di valenza (gradi) ──');
  vicino('H–C–H tetraedrico (metano)', 109.5, m.metanoHCH, 4);
  vicino('C–C–C (propano)', 109.5, m.propanoCCC, 5);
  vicino('C–C–C interno (benzene)', 120, m.benzCCC, 3);
  vicino('C–C≡C diritto (propino)', 180, m.propinoCCC, 6);
  /* e nei due versi: un ossigeno NON è diritto. Se lo fosse, vorrebbe dire
     che gli angoli vengono da una regola unica invece che dall'intorno. */
  sotto('C–O–H è piegato, non diritto (etanolo)', 125, m.etanoloCOH);
  sopra('  · e nemmeno schiacciato', 95, m.etanoloCOH);

  console.log('\n── La planarità, nei due versi ──');
  sotto('il benzene è piano (scarto dal piano, Å)', 0.05, m.benzPiano);
  sotto('e il naftalene, che è due anelli condensati', 0.08, m.naftPiano);
  /* Questa è la prova contraria, ed è quella che un banco pigro salterebbe:
     se il generatore appiattisse tutto, il benzene passerebbe lo stesso. */
  sopra('ma il cicloesano NON è piano: è a sedia', 0.15, m.cicloesanoPiano);

  console.log('\n── Nessun atomo dentro un altro ──');
  console.log('      (aspirina: ' + m.aspirinaAtomi + ' atomi con gli idrogeni)');
  sopra('la coppia non legata più vicina resta oltre 2,0 Å', 2.0, m.aspirinaMinima);
  sotto('e lo scarto dai limiti resta piccolo', 0.12, m.aspirinaScarto);

  console.log('\n── Le molecole vere ──');
  let rotte = 0, peggiorScarto = 0, peggiorMs = 0, piuVicini = 99;
  m.grandi.forEach(function (x) {
    if (x.errore) { rotte++; console.log('      ✗ ' + x.nome + ': nessuna geometria'); return; }
    console.log('      ' + x.nome.padEnd(16) + x.n + ' atomi · scarto ' +
                x.scarto + ' Å · minima ' + x.minima + ' Å · ' + x.ms + ' ms');
    if (x.scarto > peggiorScarto) peggiorScarto = x.scarto;
    if (x.ms > peggiorMs) peggiorMs = x.ms;
    if (x.minima < piuVicini) piuVicini = x.minima;
  });
  att('ognuna produce una geometria', 0, rotte);
  /* La soglia è quella che il modulo può DAVVERO promettere, misurata: su
     molecole fino a una trentina di atomi il residuo sta sotto i tre
     centesimi; sull'atorvastatina, 76 atomi e una catena lunga, arriva a
     tre decimi, e sta scritto anche nei limiti dichiarati. Promettere di
     più sarebbe falso; promettere di meno renderebbe il banco inutile. */
  sotto('il residuo peggiore resta nel valore dichiarato (Å)', 0.4, peggiorScarto);
  /* nessun atomo DENTRO un altro, nemmeno nella più grande */
  sopra('e nessuna coppia scende sotto 1,5 Å', 1.5, piuVicini);
  sotto('nessuna impiega più di due secondi', 2000, peggiorMs);

  console.log('\n── Riproducibilità ──');
  att('la stessa molecola dà sempre la stessa forma', true, m.identiche);
  att('  · ma molecole diverse non danno la stessa', true, m.diverse);

  console.log('\n── Gli indici sono quelli del predittore NMR ──');
  let sbagliati = 0;
  m.indici.forEach(function (x) {
    if (x.esito !== 'ok') { sbagliati++; console.log('      ✗ ' + x.smi + ': ' + x.esito); }
    else console.log('      ' + x.smi.padEnd(26) + x.nP + ' pesanti + ' +
                     (x.nTot - x.nP) + ' H');
  });
  /* Senza questa uguaglianza il collegamento picco↔atomo↔3D illuminerebbe
     l'atomo sbagliato: il motivo per cui questo modulo esiste. */
  att('ogni atomo pesante ha lo stesso indice e lo stesso elemento', 0, sbagliati);

  console.log('\n── I rifiuti ──');
  att('uno SMILES illeggibile non produce una geometria inventata', true, m.rottoNullo);
  att('e una stringa vuota nemmeno', 'null', m.vuoto);

  console.log('\n── La forma che il visore si aspetta ──');
  att('perVisore dà atoms/bonds con el, x, y, z', true, m.visore);

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 28) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 28');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
