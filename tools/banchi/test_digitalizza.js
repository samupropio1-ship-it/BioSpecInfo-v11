#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_digitalizza — da una FIGURA di spettro ai numeri

   PERCHE' QUESTO BANCO ESISTE

   Un digitalizzatore di figure sbaglia in silenzio, ed e' il peggiore dei
   modi di sbagliare: da QUALUNQUE immagine esce una curva. Se la curva e'
   agganciata al bordo della cornice, e' una curva. Se e' la griglia invece
   della traccia, e' una curva. Se viene da un logo, e' una curva. Non
   compare nessun errore, e qualcuno ci legge dei picchi.

   Quindi qui si parte da figure COSTRUITE, di cui si conoscono i centri
   delle gaussiane al cm⁻¹, e si pretende che si ritrovino — e, nell'altro
   verso, che da un foglio bianco e da un'icona NON esca niente.

   LE PROVE CHE CONTANO DAVVERO SONO TRE

   · la stessa figura CON e SENZA griglia deve dare gli STESSI picchi.
     Senza questa, «sopravvivo alla griglia» e' un'affermazione a parole.
   · la figura con la CORNICE e le etichette degli assi deve dare i picchi
     giusti, e il ripiego grezzo sulla stessa figura deve darli SBAGLIATI.
     E' la misura di quanto serve questo modulo: se il vecchio andasse
     bene, questo non avrebbe motivo di esistere.
   · una LINEA DI BASE piatta non deve essere confusa con un asse. E' il
     difetto che ha fatto fallire la prima versione di questo modulo: le
     righe molto coperte venivano cancellate, e su uno spettro IR normale
     — piatto per il settanta per cento della larghezza — non si trovava
     piu' nessuna traccia.

   USO   node tools/banchi/test_digitalizza.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* i centri VERI delle gaussiane disegnate: tutto il banco si misura su questi */
const VERI = [1715, 2950, 3400];

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function sotto(d, limite, avuto) {
  eseguiti++;
  if (avuto <= limite) { ok++; console.log('  ✓ ' + d + '  → ' + avuto + ' (limite ' + limite + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      limite: ' + limite + '\n      avuto:  ' + avuto); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await browser.newContext({ serviceWorkers: 'block' })).newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' &&
        !/Failed to load resource|favicon|wasm streaming|ArrayBuffer/.test(m.text())) {
      err.push('console: ' + m.text());
    }
  });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await pg.waitForTimeout(6000);

  const presente = await pg.evaluate(() => !!window.BSIDigitalizza);
  att('il modulo si carica', true, presente);
  if (!presente) { await browser.close(); process.exit(1); }

  /* ───────────────────────────────────────────────────────────────────────
     Tutte le figure si costruiscono nella pagina, dalle STESSE tre
     gaussiane: cosi' le differenze fra i casi vengono dalla figura e non
     dai dati.
     ─────────────────────────────────────────────────────────────────────── */
  const r = await pg.evaluate(async (VERI) => {
    const S = window.BSILettoreSpettri, D = window.BSIDigitalizza;
    const g = (v, c, a, w) => a * Math.exp(-Math.pow(v - c, 2) / (2 * w * w));
    const prof = cm => g(cm, VERI[0], 120, 14) + g(cm, VERI[1], 70, 28) + g(cm, VERI[2], 55, 65);

    function tela(W, H, disegna) {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      disegna(x, W, H);
      return c.toDataURL('image/png');
    }
    async function carica(url) {
      const im = new Image(); im.src = url;
      await new Promise(res => { im.onload = res; });
      return im;
    }
    /* la curva nuda, su 0..W-1, linea di base a H-20 */
    function curvaNuda(x, W, H, tratteggio) {
      x.strokeStyle = '#000'; x.lineWidth = 2;
      if (tratteggio) x.setLineDash([9, 5]);
      x.beginPath();
      for (let i = 0; i < W; i++) {
        const cm = 4000 - 3600 * i / (W - 1);
        const y = H - 20 - prof(cm);
        i ? x.lineTo(i, y) : x.moveTo(i, y);
      }
      x.stroke();
      x.setLineDash([]);
    }
    /* la stessa curva dentro una cornice con le etichette FUORI */
    function conCornice(x, W, H) {
      x.strokeStyle = '#000'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(60, 10); x.lineTo(60, H - 40); x.lineTo(W - 10, H - 40); x.stroke();
      x.beginPath(); x.moveTo(60, 10); x.lineTo(W - 10, 10); x.stroke();
      x.beginPath(); x.moveTo(W - 10, 10); x.lineTo(W - 10, H - 40); x.stroke();
      x.fillStyle = '#000'; x.font = '13px Arial';
      x.fillText('4000', 60, H - 20); x.fillText('400', W - 46, H - 20);
      x.fillText('100', 18, H - 42); x.fillText('0', 44, 18);
      /* dentro la cornice utile: 63..W-14 (dopo lo scostamento di 3 px) */
      const a = 63, b = W - 14;
      x.save(); x.beginPath(); x.rect(a, 13, b - a, H - 56); x.clip();
      x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath();
      for (let i = a; i <= b; i++) {
        const cm = 4000 - 3600 * (i - a) / (b - a);
        const y = H - 46 - prof(cm);
        i === a ? x.moveTo(i, y) : x.lineTo(i, y);
      }
      x.stroke(); x.restore();
    }

    const nuda = await carica(tela(900, 300, (x, W, H) => curvaNuda(x, W, H)));
    const cornicata = await carica(tela(960, 340, conCornice));
    /* DUE GRIGLIE, NON UNA.
       Una griglia GRIGIA non mette in difficolta' nemmeno il «pixel piu'
       scuro»: la traccia e' nera e vince il confronto. La prova di «sopravvivo
       alla griglia» va fatta dove il problema esiste davvero, cioe' con una
       griglia NERA come la traccia — che su carta e nelle scansioni e' il caso
       normale. La griglia grigia resta come caso facile. */
    function griglia(x, W, H, colore) {
      x.strokeStyle = colore; x.lineWidth = 1;
      for (let k = 1; k < 10; k++) { x.beginPath(); x.moveTo(k * W / 10, 0); x.lineTo(k * W / 10, H); x.stroke(); }
      for (let k = 1; k < 6; k++) { x.beginPath(); x.moveTo(0, k * H / 6); x.lineTo(W, k * H / 6); x.stroke(); }
    }
    const grigliata = await carica(tela(900, 300, (x, W, H) => {
      griglia(x, W, H, '#b9b9b9'); curvaNuda(x, W, H);
    }));
    const grigliaNera = await carica(tela(900, 300, (x, W, H) => {
      griglia(x, W, H, '#000'); curvaNuda(x, W, H);
    }));
    /* IL CASO REALE: uno spettro pubblicato ha la cornice E la griglia. È
       anche il caso in cui distinguere un bordo da una riga di griglia conta
       davvero, perché ci sono entrambi. */
    const cornEgriglia = await carica(tela(960, 340, (x, W, H) => {
      /* #777 e non #ccc: una griglia troppo pallida non supera nemmeno la
         soglia dell'inchiostro, non viene VISTA, e allora la prova non
         proverebbe niente — il rilevatore non avrebbe nessuna famiglia da
         distinguere dal bordo. Il banco deve mettere in difficoltà, non
         accomodare. */
      griglia(x, W, H, '#777777');
      conCornice(x, W, H);
    }));
    const tratteggiata = await carica(tela(900, 300, (x, W, H) => curvaNuda(x, W, H, true)));
    const bianca = await carica(tela(900, 300, () => {}));
    /* una figura in %T: le bande SCENDONO da un fondo al 95 % */
    const perT = await carica(tela(900, 300, (x, W, H) => {
      x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath();
      for (let i = 0; i < W; i++) {
        const cm = 4000 - 3600 * i / (W - 1);
        const T = 95 - prof(cm) * 0.6;
        const y = (100 - T) / 100 * (H - 1);
        i ? x.lineTo(i, y) : x.moveTo(i, y);
      }
      x.stroke();
    }));

    function picchiDa(sp) {
      if (!sp || sp.errore) return null;
      const an = S.analizza(sp, { tipo: 'ir' });
      return an.picchi.map(p => p.x).sort((a, b) => a - b);
    }
    function leggi(im, opz) {
      const sp = D.digitalizza(im, Object.assign({ xDa: 4000, xA: 400, unitaX: 'cm-1' }, opz || {}));
      return { sp: sp, picchi: picchiDa(sp) };
    }

    const L_cor = D.luminanza(cornicata), C_cor = D.cornice(L_cor);
    const L_nuda = D.luminanza(nuda), C_nuda = D.cornice(L_nuda);
    const T_nuda = D.traccia(L_nuda, C_nuda);

    const vNuda = leggi(nuda);
    const vCorn = leggi(cornicata);
    const vGrig = leggi(grigliata);
    const vGrigNera = leggi(grigliaNera);
    const vCornGrig = leggi(cornEgriglia);
    const vTrat = leggi(tratteggiata);
    const vBianca = leggi(bianca);
    const vIcona = await (async () => {
      const im = await carica('./icon-192.png');
      return leggi(im);
    })();

    /* IL RIPIEGO GREZZO, sulla stessa figura con la cornice: si toglie il
       modulo dal window e si chiama daImmagine, che allora usa la sua
       vecchia implementazione. */
    const salva = window.BSIDigitalizza;
    delete window.BSIDigitalizza;
    const grezzoCorn = (function () {
      const sp = S.daImmagine(cornicata, { xDa: 4000, xA: 400, unitaX: 'cm-1' });
      return picchiDa(sp);
    })();
    const grezzoGrig = (function () {
      const sp = S.daImmagine(grigliaNera, { xDa: 4000, xA: 400, unitaX: 'cm-1' });
      return picchiDa(sp);
    })();
    window.BSIDigitalizza = salva;

    /* taratura verticale e conversione */
    const conv = D.assorbanzaDaTrasmittanza([100, 50, 10, 1, 0], true);
    /* 100 %T sta in ALTO e 0 in BASSO: `yDa` e' il valore al fondo del
       grafico. Scambiarli — come faceva la prima stesura di questo banco —
       rovescia l'assorbanza e il cercapicchi non trova piu' niente. */
    const vT = leggi(perT, { yDa: 0, yA: 100, yUnita: '%T', adAssorbanza: true });

    /* assi logaritmici */
    const log = D.digitalizza(nuda, { xDa: 100, xA: 1000, logX: true });
    const lineare = D.digitalizza(nuda, { xDa: 100, xA: 1000 });
    const logZero = D.digitalizza(nuda, { xDa: 0, xA: 1000, logX: true });

    /* uscite */
    const spCsv = D.digitalizza(nuda, { xDa: 4000, xA: 400, unitaX: '1/CM' });
    const csv = D.csv(spCsv);
    const jdx = D.jcamp(spCsv);
    const riletto = S.leggi(jdx);

    return {
      cornice: { lati: C_cor.lati, trovata: C_cor.trovata, x0: C_cor.x0, y0: C_cor.y0,
                 x1: C_cor.x1, y1: C_cor.y1 },
      corniceNuda: { trovata: C_nuda.trovata, perche: C_nuda.perche, lati: C_nuda.lati },
      /* il subpixel: quante posizioni NON sono interi */
      subpixel: T_nuda.riga.filter(v => Math.abs(v - Math.round(v)) > 1e-6).length,
      colonneNuda: T_nuda.colonne,
      nuda: vNuda.picchi, corn: vCorn.picchi, grig: vGrig.picchi,
      grigNera: vGrigNera.picchi, trat: vTrat.picchi,
      cornGrig: vCornGrig.picchi,
      cornGrigLati: vCornGrig.sp && vCornGrig.sp.cornice ? vCornGrig.sp.cornice.lati : null,
      cornGrigFam: vCornGrig.sp && vCornGrig.sp.cornice ? vCornGrig.sp.cornice.famiglie : null,
      grezzoCorn: grezzoCorn, grezzoGrig: grezzoGrig,
      bianca: vBianca.sp && vBianca.sp.errore ? String(vBianca.sp.errore).slice(0, 70) : null,
      icona: vIcona.sp && vIcona.sp.errore ? String(vIcona.sp.errore).slice(0, 70) : null,
      conv: conv.y.map(v => +v.toFixed(3)), convSaturi: conv.saturi,
      perT: { picchi: vT.picchi, unitaY: vT.sp && vT.sp.unitaY,
              note: (vT.sp && vT.sp.note || []).join(' | ').slice(0, 160),
              yMax: vT.sp && vT.sp.y ? +Math.max.apply(null, vT.sp.y).toFixed(3) : null },
      log: log && log.x ? { primo: +log.x[0].toFixed(2),
                            mezzo: +log.x[Math.floor(log.x.length / 2)].toFixed(1),
                            ultimo: +log.x[log.x.length - 1].toFixed(1) } : null,
      lineare: lineare && lineare.x
        ? +lineare.x[Math.floor(lineare.x.length / 2)].toFixed(1) : null,
      logZero: logZero && logZero.errore ? String(logZero.errore).slice(0, 80) : null,
      csv: { righe: csv.trim().split('\n').length, testa: csv.split('\n')[0],
             prima: csv.split('\n')[1] },
      jdx: { righe: jdx.trim().split('\n').length,
             haProvenienza: /\$\$/.test(jdx),
             haNpoints: /##NPOINTS=\d+/.test(jdx),
             haFirstLast: /##FIRSTX=/.test(jdx) && /##LASTX=/.test(jdx) },
      riletto: riletto ? { formato: riletto.formato, punti: riletto.x.length,
                           primo: +riletto.x[0].toFixed(3),
                           ultimo: +riletto.x[riletto.x.length - 1].toFixed(3),
                           unitaX: riletto.unitaX } : null,
      spPunti: spCsv.x.length, spPrimo: +spCsv.x[0].toFixed(3),
      spUltimo: +spCsv.x[spCsv.x.length - 1].toFixed(3)
    };
  }, VERI);

  function scartoMax(trovati) {
    if (!trovati || trovati.length !== 3) return Infinity;
    return Math.max.apply(null, trovati.map((v, i) => Math.abs(v - VERI[i])));
  }
  function mostra(trovati) {
    return trovati ? trovati.map(v => v.toFixed(1)).join(', ') : '(niente)';
  }

  /* ── §1 · La cornice ──────────────────────────────────────────────────── */
  console.log('\n── La cornice degli assi ──');
  att('su una figura con gli assi li trova tutti e quattro', 4, r.cornice.lati.length);
  console.log('      (' + r.cornice.lati.join(', ') + ' → ritaglio (' + r.cornice.x0 + ',' +
              r.cornice.y0 + ')–(' + r.cornice.x1 + ',' + r.cornice.y1 + '))');
  /* il ritaglio deve stare OLTRE la linea: l'asse sinistro è a 60 e spesso 2 px,
     quindi un ritaglio che partisse da 59 o 61 sarebbe ancora sulla linea */
  att('  · e il ritaglio sta oltre lo spessore della linea, non sopra', true,
      r.cornice.x0 >= 62 && r.cornice.y0 >= 12);
  /* L'ALTRO VERSO: senza assi non deve inventarsi una cornice. */
  att('su una figura senza assi non ne trova nessuna', false, r.corniceNuda.trovata);
  att('  · e lo dichiara invece di tacere', true,
      /nessun asse|no continuous axis/i.test(r.corniceNuda.perche));
  /* IL DIFETTO CHE HA FATTO FALLIRE LA PRIMA VERSIONE: la linea di base
     piatta di uno spettro IR non è un asse, e non deve essere cancellata. */
  att('una linea di base piatta non viene presa per un asse', true,
      r.nuda !== null && r.nuda.length === 3);

  /* ── §2 · La traccia ──────────────────────────────────────────────────── */
  console.log('\n── La traccia ──');
  /* il subpixel è la ragione d'essere del baricentro: se le posizioni fossero
     tutte intere, staremmo ancora prendendo il pixel più scuro */
  att('le posizioni sono a subpixel, non interi', true, r.subpixel > r.colonneNuda * 0.5);
  console.log('      (' + r.subpixel + ' posizioni non intere su ' + r.colonneNuda + ')');

  sotto('figura nuda: i tre picchi entro 6 cm⁻¹', 6, +scartoMax(r.nuda).toFixed(1));
  console.log('      (' + mostra(r.nuda) + ' · veri ' + VERI.join(', ') + ')');
  sotto('figura con cornice ed etichette: entro 8 cm⁻¹', 8, +scartoMax(r.corn).toFixed(1));
  console.log('      (' + mostra(r.corn) + ')');

  /* LA PROVA CHE IL MODULO SERVE: il ripiego grezzo sulla stessa figura. */
  const scartoGrezzo = scartoMax(r.grezzoCorn);
  att('il ripiego grezzo, sulla stessa figura, sbaglia molto di più', true,
      scartoGrezzo > scartoMax(r.corn) * 3);
  console.log('      (grezzo: ' + mostra(r.grezzoCorn) + ' → scarto ' +
              (isFinite(scartoGrezzo) ? scartoGrezzo.toFixed(1) : 'non trova 3 picchi') +
              ' cm⁻¹ · nuovo: ' + scartoMax(r.corn).toFixed(1) + ' cm⁻¹)');

  /* LA GRIGLIA: gli stessi picchi, non «dei picchi». */
  att('con la griglia i picchi sono gli STESSI della figura senza griglia', true,
      r.grig !== null && r.nuda !== null && r.grig.length === r.nuda.length &&
      r.grig.every((v, i) => Math.abs(v - r.nuda[i]) < 1e-6));
  console.log('      (con griglia: ' + mostra(r.grig) + ')');
  /* la prova dove il problema esiste: griglia NERA come la traccia */
  att('anche con una griglia NERA i picchi restano quelli', true,
      r.grigNera !== null && r.grigNera.length === 3 &&
      scartoMax(r.grigNera) <= 8);
  console.log('      (griglia nera: ' + mostra(r.grigNera) + ')');
  /* QUI UNA MIA AFFERMAZIONE E' STATA SMENTITA DA QUESTO BANCO, e resta
     scritta perché è il genere di cosa che va scritta: avevo messo «il
     ripiego grezzo con la griglia sbaglia». Non sbaglia. Una riga di griglia
     da un pixel, tirata su una coordinata intera, viene resa dal browser
     sfumata al 50 % di grigio (scurezza misurata 127 contro 255 della
     traccia spessa due pixel): il «pixel più scuro» la ignora senza
     accorgersene. Il metodo grezzo cade sulla CORNICE e sulle ETICHETTE,
     non sulla griglia — ed è quella la misura di quanto serve questo
     modulo, già fatta qui sopra. */
  att('il ripiego grezzo, sulla griglia pallida, se la cava comunque', true,
      scartoMax(r.grezzoGrig) <= 8);
  console.log('      (grezzo con griglia: ' + mostra(r.grezzoGrig) + ')');

  /* IL CASO REALE: cornice E griglia nella stessa figura. */
  att('con cornice E griglia insieme, il bordo viene distinto dalla griglia', true,
      r.cornGrigLati !== null && r.cornGrigLati.length === 4);
  console.log('      (lati: ' + (r.cornGrigLati || []).join(', ') +
              ' · famiglie di linee continue: ' +
              (r.cornGrigFam ? r.cornGrigFam.verticali + ' verticali, ' +
               r.cornGrigFam.orizzontali + ' orizzontali' : '?') + ')');
  sotto('  · e i picchi restano entro 8 cm⁻¹', 8, +scartoMax(r.cornGrig).toFixed(1));
  console.log('      (' + mostra(r.cornGrig) + ')');

  sotto('una curva tratteggiata si ricostruisce comunque', 8,
        +scartoMax(r.trat).toFixed(1));
  console.log('      (' + mostra(r.trat) + ')');

  /* I DUE VERSI DEL RIFIUTO: niente curve inventate. */
  att('da un foglio bianco non esce nessuna curva', true, !!r.bianca);
  console.log('      («' + r.bianca + '»)');
  att('e nemmeno dall’icona dell’applicazione', true, !!r.icona);

  /* ── §3 · La taratura ─────────────────────────────────────────────────── */
  console.log('\n── La taratura ──');
  /* A = −log₁₀T: sono valori esatti, non approssimazioni */
  att('100 %T diventa A = 0', 0, r.conv[0]);
  att('50 %T diventa A = 0,301', 0.301, r.conv[1]);
  att('10 %T diventa A = 1', 1, r.conv[2]);
  att('1 %T diventa A = 2', 2, r.conv[3]);
  att('0 %T si ferma a A = 4 invece di divergere', 4, r.conv[4]);
  att('  · e il punto saturato viene contato', 1, r.convSaturi);

  att('una figura in %T si legge e si converte in assorbanza', 'A', r.perT.unitaY);
  att('  · dichiarando la conversione', true, /A = −log|A = -log/.test(r.perT.note));
  sotto('  · con i picchi al posto giusto entro 8 cm⁻¹', 8, +scartoMax(r.perT.picchi).toFixed(1));
  console.log('      (' + mostra(r.perT.picchi) + ' · A massima ' + r.perT.yMax + ')');

  /* L'ASSE LOGARITMICO, nei due versi: a metà figura la mappa logaritmica dà
     la MEDIA GEOMETRICA (√(100·1000) = 316,2), quella lineare dà 550. Se non
     si distinguessero, l'opzione non servirebbe a niente. */
  att('su asse logaritmico il punto di mezzo è la media geometrica', true,
      r.log && Math.abs(r.log.mezzo - 316.2) < 1.5);
  console.log('      (log: ' + (r.log && r.log.mezzo) + ' · atteso 316,2)');
  att('  · e su asse lineare lo stesso punto è la media aritmetica', true,
      r.lineare !== null && Math.abs(r.lineare - 550) < 1.5);
  console.log('      (lineare: ' + r.lineare + ' · atteso 550)');
  att('  · gli estremi restano quelli dati', true,
      r.log && Math.abs(r.log.primo - 100) < 0.01 && Math.abs(r.log.ultimo - 1000) < 0.1);
  att('un asse logaritmico che parte da zero viene rifiutato', true, !!r.logZero);
  console.log('      («' + r.logZero + '»)');

  /* ── §4 · Le uscite ──────────────────────────────────────────────────── */
  console.log('\n── Le uscite ──');
  att('il CSV ha una riga di intestazione e una riga per punto',
      r.spPunti + 1, r.csv.righe);
  att('  · con le unità nell’intestazione', true, /1\/CM/.test(r.csv.testa));
  att('  · e numeri leggibili nella prima riga', true,
      /^-?\d/.test(r.csv.prima) && r.csv.prima.split(',').length === 2);

  att('il JCAMP dichiara NPOINTS', true, r.jdx.haNpoints);
  att('  · e FIRSTX/LASTX, senza i quali il file è formalmente invalido', true,
      r.jdx.haFirstLast);
  att('  · e porta dentro la provenienza (taratura data a mano)', true, r.jdx.haProvenienza);
  /* IL GIRO COMPLETO: il file esportato deve essere rileggibile DA QUESTO
     LETTORE. Un'esportazione che il programma stesso non sa riaprire è una
     promessa non verificata. */
  att('il JCAMP esportato viene riletto dal lettore stesso', 'JCAMP-DX',
      r.riletto && r.riletto.formato);
  att('  · con lo stesso numero di punti', r.spPunti, r.riletto && r.riletto.punti);
  att('  · e gli stessi estremi', true,
      r.riletto && Math.abs(r.riletto.primo - r.spPrimo) < 0.01 &&
      Math.abs(r.riletto.ultimo - r.spUltimo) < 0.01);
  att('  · e con le unità conservate', '1/CM', r.riletto && r.riletto.unitaX);

  /* ── §5 · L'errore dichiarato ─────────────────────────────────────────── */
  console.log('\n── L’errore, dichiarato ──');
  const figure = { 'nuda': r.nuda, 'con cornice': r.corn, 'griglia grigia': r.grig,
                   'griglia nera': r.grigNera, 'cornice + griglia': r.cornGrig,
                   'tratteggiata': r.trat, '%T → A': r.perT.picchi };
  const nomi = Object.keys(figure);
  /* PRIMA di mediare: ogni figura deve aver trovato TRE picchi. Mediare gli
     scarti di una figura che ne ha trovati due confronta il primo picco col
     secondo e produce un numero senza significato — la prima stesura di questo
     banco dichiarava così uno scarto «peggiore» di 1344 cm⁻¹. */
  const complete = nomi.filter(n => figure[n] && figure[n].length === 3);
  att('tutte le figure hanno dato tre picchi', nomi.length, complete.length);
  nomi.filter(n => complete.indexOf(n) < 0)
      .forEach(n => console.log('      ! ' + n + ': ' + mostra(figure[n])));
  const scarti = [];
  complete.forEach(function (n) {
    figure[n].forEach(function (v, i) { scarti.push(Math.abs(v - VERI[i])); });
  });
  const medio = scarti.reduce((a, b) => a + b, 0) / scarti.length;
  const peggiore = Math.max.apply(null, scarti);
  console.log('      ' + scarti.length + ' picchi misurati su ' + complete.length + ' figure diverse');
  sotto('scarto MEDIO sui picchi di tutte le figure (cm⁻¹)', 4, +medio.toFixed(2));
  sotto('scarto PEGGIORE (cm⁻¹)', 8, +peggiore.toFixed(2));
  console.log('      La risoluzione di una colonna è ~4 cm⁻¹ su 900 colonne per 3600 cm⁻¹:');
  console.log('      sotto quel valore non c’è niente da guadagnare, è il limite della figura.');

  att('nessun errore JavaScript', 0, err.length);
  err.slice(0, 5).forEach(e => console.log('      ! ' + e.slice(0, 160)));

  await browser.close();

  /* Un banco che non misura nulla passa. */
  if (eseguiti < 43) {
    ko++;
    console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno 43');
  }

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
