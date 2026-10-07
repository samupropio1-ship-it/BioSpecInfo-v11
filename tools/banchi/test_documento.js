/* ═══════════════════════════════════════════════════════════════════════════
   test_documento — aprire un file, leggerlo, svolgerlo: e dire che cosa manca

   PERCHE' QUESTO BANCO ESISTE

   Un lettore di documenti sbaglia in un modo particolarmente insidioso: non
   fallisce, restituisce POCO. Un PDF scansionato dà zero parole di testo, e
   se nessuno lo dice sembra che il documento fosse quasi vuoto. Uno
   svolgimento costruito su metà dei dati arriva a una conclusione con tutta
   la sua bella catena di passaggi giusti, e la conclusione è sbagliata.

   Qui si verifica nei DUE VERSI:

     · che apra davvero — PDF, Word, testo — e che il testo che tira fuori sia
       quello giusto, non una stringa plausibile;
     · che DICHIARI quello che non ha letto: le pagine senza strato di testo,
       le immagini senza riconoscimento ottico, i formati che non conosce, i
       dati spettroscopici che non ha riconosciuto.

   E sul riconoscimento: non basta che trovi i numeri, deve trovare QUELLI
   GIUSTI. Una banda IR a 1738 e una massa a 150 sono tutt'e due numeri; se
   finissero nella sezione sbagliata lo svolgimento sarebbe impeccabile e la
   risposta assurda. Le prove contrarie mettono numeri dove non vanno e
   pretendono che non vengano presi.

   USO   node tools/banchi/test_documento.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');
const path = require('path');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const QUESITI = path.resolve(__dirname, '..', 'dati', 'quesiti');

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function sopra(d, limite, avuto) {
  eseguiti++;
  if (typeof avuto === 'number' && avuto >= limite) {
    ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (almeno ' + limite + ')');
  } else { ko++; console.log('  ✗ ' + d + '\n      almeno: ' + limite + '\n      avuto:  ' + avuto); }
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
  await pg.waitForTimeout(5000);
  await pg.evaluate(() => { const g = document.getElementById('bsi-guide'); if (g) g.remove(); });

  console.log('Documenti — aprire, leggere, svolgere, e dire che cosa manca\n');

  console.log('── I moduli ──');
  const mod = await pg.evaluate(() => ({
    doc: typeof window.BSIDocumento, qst: typeof window.BSIQuesito
  }));
  att('BSIDocumento è caricato', 'object', mod.doc);
  att('BSIQuesito è caricato', 'object', mod.qst);

  /* ── §1 · Il riconoscimento dei dati, nei due versi ───────────────────── */
  console.log('\n── Che cosa riconosce nel testo ──');
  const ric = await pg.evaluate(() => {
    const Q = window.BSIQuesito, out = {};
    const testo =
      "Quesito. Un composto di formula molecolare C9H10O2 dà i seguenti dati.\n\n" +
      "IR (cm-1): 3035, 2955, 1738, 1600, 1498, 1230.\n\n" +
      "MS m/z (intensità relativa): 150 (22), 108 (100), 91 (45), 43 (60).\n\n" +
      "1H NMR (CDCl3): δ 7,35 (5H, m), 5,10 (2H, s), 2,05 (3H, s).\n\n" +
      "13C NMR (CDCl3): δ 170,9; 136,0; 128,6; 128,2; 66,3; 21,0.";
    const d = Q.estrai(testo);
    out.formula = d.formula;
    out.ir = d.ir.join(',');
    out.ms = d.ms.map(x => x.mz).join(',');
    out.msIntensita = d.ms.map(x => x.i).join(',');
    out.nH1 = d.h1.length;
    out.h1 = d.h1.map(x => x.ppm + '/' + x.nH + x.molteplicita).join(' ');
    out.c13 = d.c13.join(',');
    out.mancanti = d.mancanti.length;

    /* ── le prove contrarie ──────────────────────────────────────────────
       1. il SOLVENTE non è il composto: CDCl3 non deve diventare la formula */
    out.solvente = Q.estrai('1H NMR (CDCl3): 7.26 (s)').formula;
    /* 2. una banda IR non può stare fuori dall'intervallo dello strumento */
    out.irFuori = Q.estrai('IR (cm-1): 1715, 99, 9000, 400').ir.join(',');
    /* 3. i numeri di una sezione NON devono finire in un'altra: qui l'unica
          etichetta è IR, quindi le masse non esistono */
    const soloIr = Q.estrai('IR (cm-1): 1715, 1600.');
    out.soloIrMasse = soloIr.ms.length;
    out.soloIrH = soloIr.h1.length;
    /* 4. e un capoverso nuovo chiude la sezione: il numero dopo la riga
          vuota non appartiene all'IR */
    out.sezioneChiusa = Q.estrai('IR (cm-1): 1715\n\nIl punto di fusione è 2222.').ir.join(',');
    /* 5. un testo senza niente di spettroscopico non produce dati */
    const nulla = Q.estrai('Il gatto è sul tetto. Domani piove.');
    out.nienteQuanti = nulla.quanti;
    out.nienteMancanti = nulla.mancanti.length;
    /* 6. δ con la virgola decimale: 7,35 è un numero, «1715, 1600» due */
    out.virgola = Q.estrai('1H NMR: 7,35 (5H, m)').h1.map(x => x.ppm).join(',');
    /* 7. i pedici tipografici di una formula stampata */
    out.pedici = Q.estrai('formula C₉H₁₀O₂').formula;
    return out;
  });
  att('la formula molecolare', 'C9H10O2', ric.formula);
  att('e anche scritta con i pedici tipografici', 'C9H10O2', ric.pedici);
  att('le sei bande IR', '3035,2955,1738,1600,1498,1230', ric.ir);
  att('i quattro picchi di massa', '150,108,91,43', ric.ms);
  att('  · con le loro intensità relative', '22,100,45,60', ric.msIntensita);
  att('i tre segnali ¹H, con integrazione e molteplicità',
      '7.35/5m 5.1/2s 2.05/3s', ric.h1);
  att('i sei segnali ¹³C', '170.9,136,128.6,128.2,66.3,21', ric.c13);
  att('e non manca niente', 0, ric.mancanti);

  console.log('\n   · e quello che NON deve riconoscere');
  /* Il cloroformio deuterato compare in quasi ogni quesito: scambiarlo per il
     composto farebbe sbagliare dalla prima riga. */
  att('CDCl₃ è il solvente, non il composto', null, ric.solvente);
  att('una banda IR fuori da 400-4000 non è una banda', '1715,400', ric.irFuori);
  att('senza etichetta MS non ci sono masse', 0, ric.soloIrMasse);
  att('senza etichetta ¹H non ci sono protoni', 0, ric.soloIrH);
  att('un capoverso nuovo chiude la sezione', '1715', ric.sezioneChiusa);
  att('un testo senza spettri non produce dati', 0, ric.nienteQuanti);
  att('  · e li dichiara tutti mancanti', 5, ric.nienteMancanti);
  att('la virgola decimale è un decimale, non un separatore', '7.35', ric.virgola);

  /* ── §2 · Lo svolgimento ──────────────────────────────────────────────── */
  console.log('\n── Lo svolgimento ──');
  const sv = await pg.evaluate(async () => {
    await new Promise(r => window.bsiLoadRDKit(r));
    const Q = window.BSIQuesito, out = {};
    const testo =
      "Composto di formula molecolare C9H10O2.\n\n" +
      "IR (cm-1): 3035, 1738, 1600, 1498.\n\n" +
      "MS m/z: 150 (22), 108 (100), 91 (45), 43 (60).\n\n" +
      "1H NMR: 7,35 (5H, m), 5,10 (2H, s), 2,05 (3H, s).\n\n" +
      "13C NMR: 170,9; 136,0; 128,6; 128,2; 66,3; 21,0.";
    const r = Q.svolgi(testo);
    out.idi = r.dossier.idi;
    out.deduzioni = r.dossier.deduzioni.length;
    out.supposizioni = r.dossier.supposizioni.length;
    out.protoni = r.dossier.protoniTotali;
    out.massa = Math.round(r.dossier.massaMono * 100) / 100;
    /* ogni passo porta la PROVA e la CERTEZZA: senza, è un'affermazione */
    out.senzaProva = r.dossier.deduzioni.filter(d => !d.prova).length;
    out.senzaCertezza = r.dossier.deduzioni.filter(d => !d.certezza).length;
    out.avvisi = r.avvisi.length;
    /* su un testo senza dati non svolge, e lo dice */
    const vuoto = Q.svolgi('Buongiorno a tutti.');
    out.vuotoDossier = vuoto.dossier;
    out.vuotoAvvisi = vuoto.avvisi.length;
    /* e il confronto con una struttura proposta */
    const c = Q.verifica('CC(=O)OCc1ccccc1', testo);
    out.punteggio = c && c.punteggio;
    const sbagliata = Q.verifica('CCCCCCCCC', testo);
    out.punteggioSbagliato = sbagliata && sbagliata.punteggio;
    return out;
  });
  /* C9H10O2: 1 + (9·2 − 10)/2 = 5 — un anello aromatico (4) più un C=O */
  att('i gradi di insaturazione', 5, sv.idi);
  att('la massa monoisotopica', 150.07, sv.massa);
  att('i protoni dalle integrazioni', 10, sv.protoni);
  sopra('i passi dello svolgimento', 4, sv.deduzioni);
  sopra('e le supposizioni, tenute separate', 4, sv.supposizioni);
  /* Un passo senza prova è un'affermazione, non una deduzione. */
  att('ogni passo dice da dove viene', 0, sv.senzaProva);
  att('e quanto è certo', 0, sv.senzaCertezza);
  att('su un testo senza dati non svolge', null, sv.vuotoDossier);
  att('  · e lo dice invece di tacere', true, sv.vuotoAvvisi > 0);

  console.log('\n   · il confronto con una struttura proposta');
  /* Il benzilacetato È la risposta, e prende 42 su 100 — non di più, perché
     un controllo su cinque non torna davvero: il suo OCH₂ sta a 66,3 ppm e
     il predittore ne dà 73,8. Non è un difetto del confronto, è il limite
     dello schema additivo su un carbonio con DUE sostituenti in α, ed è
     stato questo banco a trovarlo: la molecola è poi entrata nell'insieme di
     validazione di `test_nmr`, e il caso peggiore DICHIARATO è salito da 4,9
     a 7,5 ppm.
     Quindi qui non si pretende un punteggio alto in assoluto — sarebbe
     pretendere che il predittore sia migliore di quello che è. Si pretende
     che la struttura GIUSTA batta nettamente una sbagliata, che è la cosa
     che il confronto serve a fare. */
  att('il benzilacetato, che è la risposta, supera metà dei controlli',
      true, sv.punteggio >= 40);
  console.log('      (' + sv.punteggio + ' / 100)');
  /* La prova che conta: una struttura SBAGLIATA deve prendere molto meno.
     Senza questa, un punteggiatore che dà 100 a tutto passerebbe. */
  att('e il nonano, che non c’entra niente, prende molto meno',
      true, sv.punteggioSbagliato <= sv.punteggio / 3);
  console.log('      (' + sv.punteggioSbagliato + ' / 100)');

  /* ── §3 · I file veri ─────────────────────────────────────────────────── */
  console.log('\n── I file, aperti davvero ──');
  await pg.evaluate(async () => {
    document.querySelector('.nav-btn[data-s="sspettrolettore"]').click();
    await new Promise(r => setTimeout(r, 1200));
  });

  async function apri(file) {
    await pg.setInputFiles('#bsiSP-doc', file);
    await pg.waitForFunction(() => {
      const s = document.getElementById('bsiSP-docStato');
      return s && !/apro|opening/i.test(s.textContent) && s.textContent.length > 4;
    }, { timeout: 60000 }).catch(() => {});
    await pg.waitForTimeout(1200);
    return pg.evaluate(() => {
      const out = document.getElementById('bsiSP-docOut');
      return {
        stato: (document.getElementById('bsiSP-docStato') || {}).textContent || '',
        tele: document.querySelectorAll('#bsiSP-pagine canvas').length,
        testo: !!out.querySelector('pre'),
        lungTesto: (out.querySelector('pre') || {}).textContent
          ? out.querySelector('pre').textContent.length : 0,
        tabelle: out.querySelectorAll('table').length,
        svolgimento: /svolgimento|work, step/i.test(out.textContent),
        avvisi: out.querySelectorAll('.bsiSP-avv').length,
        contenuto: out.textContent
      };
    });
  }

  const pdf = await apri(QUESITI + '/quesito-benzilacetato.pdf');
  att('il PDF si apre e disegna la sua pagina', 1, pdf.tele);
  att('  · e il suo testo viene letto', true, pdf.testo && pdf.lungTesto > 200);
  att('  · con dentro la formula del quesito', true, /C9H10O2/.test(pdf.contenuto));
  att('  · e lo svolgimento compare', true, pdf.svolgimento);
  sopra('  · con le sue tabelle', 3, pdf.tabelle);

  const docx = await apri(QUESITI + '/quesito-benzilacetato.docx');
  /* Un .docx è uno ZIP: si apre senza nessuna libreria, con il
     decompressore che il browser ha già. */
  att('il documento Word si apre', true, /Word|aperto|opened/i.test(docx.stato));
  att('  · e il suo testo viene letto', true, docx.testo && docx.lungTesto > 200);
  att('  · con dentro i dati del quesito', true, /1738/.test(docx.contenuto));
  att('  · e lo svolgimento compare', true, docx.svolgimento);

  const txt = await apri(QUESITI + '/quesito-benzilacetato.txt');
  att('un file di testo si apre', true, txt.testo);
  att('  · e dà lo stesso svolgimento', true, txt.svolgimento);

  /* ── §4 · E quello che NON riesce a leggere, lo DICE ──────────────────── */
  console.log('\n── Quello che non riesce a leggere, lo dice ──');
  const png = await apri(path.resolve(__dirname, '..', '..', 'icon-192.png'));
  att('un’immagine si apre e si vede', 1, png.tele);
  /* La prova che conta davvero di tutto questo banco: senza riconoscimento
     ottico il testo di un’immagine NON si legge, e dirlo è l’unico modo di
     non far credere che il documento fosse vuoto. */
  att('  · e dichiara che non c’è riconoscimento ottico dei caratteri',
      true, /ottico|optical/i.test(png.contenuto));
  att('  · e non inventa uno svolgimento', false, png.svolgimento);

  const rifiuto = await pg.evaluate(async () => {
    const f = new File([new Uint8Array([0, 1, 2, 3, 250, 251])], 'cosa.xyz',
                       { type: 'application/x-strano' });
    const d = await window.BSIDocumento.leggi(f);
    const g = await window.BSIDocumento.leggi(
      new File([new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1])], 'dati.txt',
               { type: 'text/plain' }));
    return { errore: d.errore || '', pagine: d.pagine.length,
             binario: g.errore || '' };
  });
  att('un formato sconosciuto viene rifiutato, non indovinato',
      true, /non so aprire|cannot open/i.test(rifiuto.errore));
  att('  · e non produce pagine finte', 0, rifiuto.pagine);
  att('un file binario chiamato .txt viene riconosciuto come binario',
      true, /binari|binary/i.test(rifiuto.binario));

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await b.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 34) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 34');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
