#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   VERIFICA DI ACCESSIBILITA' — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   Il documento 08 dichiarava la conformita' WCAG "verificata a campione".
   Un campione non si ripete uguale e non finisce in un rapporto: questo
   banco controlla ogni pagina, sempre allo stesso modo.

   COSA CONTROLLA, e perche' proprio questo:
     · contrasto del testo (WCAG 1.4.3) — il difetto piu' diffuso e quello
       che esclude piu' persone;
     · nome accessibile dei comandi (4.1.2) — un pulsante che a uno screen
       reader si annuncia come "pulsante" e basta e' inutilizzabile;
     · etichette dei campi (3.3.2);
     · testo alternativo delle immagini (1.1.1);
     · lingua del documento (3.1.1);
     · gerarchia dei titoli (1.3.1);
     · focus visibile da tastiera (2.4.7).

   COSA NON CONTROLLA, e va detto:
     · il testo dentro gli SVG — li' il colore viene da `fill` e lo sfondo e'
       una forma disegnata, non un antenato nel DOM;
     · il testo su sfondi a gradiente o immagine — non hanno UN colore, il
       contrasto varia lungo la superficie.
   In entrambi i casi servirebbe un'analisi dei pixel. Gli elementi saltati
   vengono CONTATI e riportati: una lacuna dichiarata e' diversa da una
   lacuna nascosta.

   Non sostituisce una verifica completa WCAG 2.1 AA — che richiede anche
   giudizio umano — e il documento 08 continua a dirlo. Copre pero' la parte
   meccanica, che e' quella che regredisce senza che nessuno se ne accorga.

   USO   node tools/verifica-accessibilita.js      (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';

const PAGINE = ['index.html', 'astro.html', 'chimorga.html', 'accademia.html',
  'rdkit_lab.html', 'simulazioni.html', 'pro.html', 'sr_completo.html',
  'sr_essenziale.html', 'file_manager.html', 'changelog_tesi.html',
  'download.html', 'Biochimica_Guida_Definitiva.html'];

/* Soglie WCAG 2.1 livello AA: 4,5:1 per il testo normale, 3:1 per il testo
   grande (>=18,66px, oppure >=14px se in grassetto). */
const SOGLIA_NORMALE = 4.5;
const SOGLIA_GRANDE  = 3.0;

const ISPEZIONE = function(soglie){
  const sogliaN = soglie.normale, sogliaG = soglie.grande;
  /* Contrasto secondo la formula WCAG: luminanza relativa dei due colori,
     con la correzione di gamma. Non e' una media dei canali. */
  function luminanza(rgb){
    const c = rgb.map(function(v){
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function leggiRGB(s){
    const m = String(s).match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);
    if (!m) return null;
    return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
  }
  /* Lo sfondo effettivo: si risale finche' non si trova un colore opaco.
     Un elemento trasparente eredita lo sfondo di chi lo contiene, e
     confrontare il testo con "rgba(0,0,0,0)" darebbe risultati senza senso. */
  function sfondoEffettivo(el){
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      /* Un gradiente o un'immagine di sfondo non hanno UN colore: il
         contrasto varia lungo la superficie e servirebbe leggere i pixel.
         Dichiararlo non misurabile e' corretto; fingere un valore no —
         su download.html il confronto dava 1:1, cioe' il colore con se'
         stesso, e segnalava un difetto inesistente. */
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = leggiRGB(cs.backgroundColor);
      if (c && c.a > 0.85) return c.rgb;
      n = n.parentElement;
    }
    const b = leggiRGB(getComputedStyle(document.body).backgroundColor);
    return b && b.a > 0.5 ? b.rgb : [255, 255, 255];
  }
  function rapporto(a, b){
    const la = luminanza(a), lb = luminanza(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function visibile(el){
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  function descrivi(el){
    return el.tagName.toLowerCase() +
      (el.id ? '#' + el.id : '') +
      (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : '');
  }

  const out = { contrasto: [], senzaNome: [], senzaEtichetta: [], senzaAlt: [],
                lingua: document.documentElement.getAttribute('lang') || '',
                titoli: [], focusInvisibile: [], esaminati: 0, svgSaltati: 0, gradienti: 0 };

  /* ── contrasto del testo ── */
  Array.prototype.forEach.call(document.querySelectorAll('body *'), function(el){
    if (!visibile(el)) return;
    /* IL TESTO DENTRO UN SVG NON SI MISURA COSI'.
       In SVG il colore del testo viene da `fill`, non da `color`, e lo sfondo
       e' una forma disegnata, non un antenato nel DOM. Leggendo `color` si
       ottiene un valore ereditato e privo di significato: questo banco
       segnalava 48 falsi difetti nella Guida di Biochimica, dove il colore
       letto era rgb(231,238,251) mentre il fill reale era rgb(15,23,42).
       Si saltano e si DICHIARA quanti sono: una copertura che non c'e' va
       detta, non simulata. */
    if (el.ownerSVGElement || el.tagName.toLowerCase() === 'svg') { out.svgSaltati++; return; }
    // solo elementi con testo proprio, non contenitori
    let proprio = '';
    Array.prototype.forEach.call(el.childNodes, function(n){
      if (n.nodeType === 3) proprio += n.textContent;
    });
    proprio = proprio.trim();
    if (proprio.length < 2) return;
    const cs = getComputedStyle(el);
    const fg = leggiRGB(cs.color);
    if (!fg || fg.a < 0.5) return;
    out.esaminati++;
    const px = parseFloat(cs.fontSize) || 16;
    const grassetto = (parseInt(cs.fontWeight, 10) || 400) >= 700;
    const grande = px >= 18.66 || (px >= 14 && grassetto);
    const soglia = grande ? sogliaG : sogliaN;
    const sf = sfondoEffettivo(el);
    if (!sf) { out.gradienti++; out.esaminati--; return; }
    const r = rapporto(fg.rgb, sf);
    if (r < soglia) {
      out.contrasto.push({ el: descrivi(el), r: +r.toFixed(2), soglia,
                           px: +px.toFixed(0), testo: proprio.slice(0, 40) });
    }
  });

  /* ── comandi senza nome accessibile ── */
  Array.prototype.forEach.call(
    document.querySelectorAll('button, a[href], [role="button"]'), function(el){
    if (!visibile(el)) return;
    const nome = (el.textContent || '').trim() ||
                 el.getAttribute('aria-label') || el.getAttribute('title') ||
                 (el.querySelector('img[alt]') ? el.querySelector('img[alt]').alt : '');
    if (!nome) out.senzaNome.push(descrivi(el));
  });

  /* ── campi senza etichetta ── */
  Array.prototype.forEach.call(
    document.querySelectorAll('input:not([type=hidden]), select, textarea'), function(el){
    if (!visibile(el)) return;
    const etichetta = (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) ||
                      el.closest('label') || el.getAttribute('aria-label') ||
                      el.getAttribute('aria-labelledby') || el.getAttribute('title') ||
                      el.getAttribute('placeholder');
    if (!etichetta) out.senzaEtichetta.push(descrivi(el));
  });

  /* ── immagini senza alternativa testuale ── */
  Array.prototype.forEach.call(document.querySelectorAll('img'), function(el){
    if (!visibile(el)) return;
    // alt="" e' CORRETTO per un'immagine decorativa: dice allo screen reader
    // di ignorarla. Manca solo se l'attributo non c'e' affatto.
    if (!el.hasAttribute('alt') && el.getAttribute('role') !== 'presentation')
      out.senzaAlt.push(descrivi(el) + ' ' + (el.getAttribute('src') || '').slice(-40));
  });

  /* ── gerarchia dei titoli ── */
  const livelli = [];
  Array.prototype.forEach.call(document.querySelectorAll('h1,h2,h3,h4,h5,h6'), function(h){
    if (visibile(h)) livelli.push(+h.tagName[1]);
  });
  for (let i = 1; i < livelli.length; i++) {
    if (livelli[i] - livelli[i - 1] > 1)
      out.titoli.push('h' + livelli[i - 1] + ' → h' + livelli[i]);
  }

  return out;
};

(async () => {
  let chromium;
  try { chromium = require('playwright-core').chromium; }
  catch (e) { console.error('playwright-core non installato: `npm install`.'); process.exit(2); }

  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  console.log('Verifica di accessibilità');
  console.log('WCAG 2.1 AA — contrasto ' + SOGLIA_NORMALE + ':1 (testo normale), ' +
              SOGLIA_GRANDE + ':1 (testo grande)\n');

  let totContrasto = 0, totNome = 0, totEtichetta = 0, totAlt = 0, totTitoli = 0;
  const esempi = [];

  for (const p of PAGINE) {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const pg = await ctx.newPage();
    await pg.goto(BASE + p, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(1800);
    const r = await pg.evaluate(ISPEZIONE, { normale: SOGLIA_NORMALE, grande: SOGLIA_GRANDE });
    await ctx.close();

    totContrasto += r.contrasto.length;
    totNome += r.senzaNome.length;
    totEtichetta += r.senzaEtichetta.length;
    totAlt += r.senzaAlt.length;
    totTitoli += r.titoli.length;
    r.contrasto.slice(0, 3).forEach(c => esempi.push(p + ' · ' + c.el + '  ' + c.r + ':1 (serve ' +
      c.soglia + ':1)  «' + c.testo + '»'));

    const seg = (r.contrasto.length + r.senzaNome.length + r.senzaEtichetta.length +
                 r.senzaAlt.length) === 0 ? '✓' : '·';
    console.log('  ' + seg + ' ' + p.replace('.html', '').padEnd(30) +
      r.esaminati + ' elementi di testo · contrasto ' + r.contrasto.length +
      ' · comandi senza nome ' + r.senzaNome.length +
      ' · campi senza etichetta ' + r.senzaEtichetta.length +
      ' · img senza alt ' + r.senzaAlt.length +
      (r.svgSaltati ? ' · ' + r.svgSaltati + ' in SVG' : '') +
      (r.gradienti ? ' · ' + r.gradienti + ' su gradiente' : '') +
      (r.lingua ? '' : ' · ⚠ manca lang'));
    if (!r.lingua) { ko++; console.log('      ✗ ' + p + ': manca l\'attributo lang sull\'elemento html'); }
  }

  console.log('\n── Riepilogo ──');
  att('nessun comando privo di nome accessibile', 0, totNome);
  att('nessun campo privo di etichetta', 0, totEtichetta);
  att('nessuna immagine priva di testo alternativo', 0, totAlt);
  att('nessun salto nella gerarchia dei titoli', 0, totTitoli);
  att('nessun testo sotto la soglia di contrasto WCAG AA', 0, totContrasto);
  if (totContrasto) {
    console.log('\n  Esempi:');
    esempi.slice(0, 12).forEach(e => console.log('      ! ' + e));
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})();
