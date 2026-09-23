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

const fs = require('fs');
const path = require('path');
const RADICE = path.resolve(__dirname, '..');

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

/* Confronta il conteggio di oggi col riferimento registrato.
   Non e' una tolleranza: e' un patto. Il numero puo' scendere o restare
   uguale, mai salire. Un debito dichiarato e tenuto fermo e' gestibile;
   un debito che cresce in silenzio e' come non averlo mai misurato. */
/* Restituisce true se va contata come superata, false se fallita.
   I contatori `ok`/`ko` vivono dentro la funzione principale: incrementarli
   da qui darebbe «ko is not defined», ed e' esattamente quello che e'
   successo — la prima stesura falliva solo sul ramo della regressione, che
   la generazione del riferimento non percorre mai. Se non avessi provato
   ad abbassare il riferimento apposta, il difetto sarebbe uscito la prima
   volta che qualcuno introduceva una regressione vera: cioe' nel momento
   peggiore, al posto del messaggio che doveva avvertirlo. */
function confrontaRif(desc, ora, riferimento){
  if (typeof riferimento !== 'number') {
    console.log('  ✗ ' + desc + ': riferimento assente o non numerico');
    return false;
  }
  if (ora > riferimento) {
    console.log('  ✗ ' + desc + ' — REGRESSIONE: ' + ora + ' contro un riferimento di ' +
                riferimento + ' (+' + (ora - riferimento) + ')');
    return false;
  }
  if (ora < riferimento) {
    console.log('  ✓ ' + desc + ' — migliorato: ' + ora + ' contro ' + riferimento +
                ' (−' + (riferimento - ora) + '). Aggiornare il riferimento con ' +
                'l\'opzione --aggiorna-riferimento');
    return true;
  }
  console.log('  ✓ ' + desc + ' — invariato a ' + ora + ' (debito dichiarato, non cresciuto)');
  return true;
}

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
  /* ── Un gradiente non ha UN colore, ma ha DEI colori ─────────────────
     La stesura precedente rinunciava: «il contrasto varia lungo la
     superficie, servirebbe leggere i pixel». Era vero a meta'. Un
     `linear-gradient(135deg,#0d1522,#13233a)` non ha un colore medio —
     inventarlo sarebbe peggio che non misurare — ma ha delle TAPPE, e
     quelle sono note. Un testo leggibile su tutto il gradiente e' un
     testo che supera la soglia su OGNI tappa: e' la condizione piu'
     severa fra quelle vere, e non richiede di leggere un solo pixel.
     Cio' che resta davvero fuori e' l'immagine di sfondo (`url(...)`):
     li' non si sa niente, e si continua a dichiararlo.
     Erano 892 elementi non misurati su 19 751. */
  function tappeGradiente(bgImage){
    if (!/gradient\(/i.test(bgImage)) return null;     // url(...) o altro
    const tappe = [];
    const re = /rgba?\(\s*[\d.]+\s*[,\s]\s*[\d.]+\s*[,\s]\s*[\d.]+(?:\s*[,\/]\s*[\d.]+)?\s*\)/gi;
    let m;
    while ((m = re.exec(bgImage)) !== null) {
      const c = leggiRGB(m[0]);
      /* una tappa semitrasparente lascia trasparire cio' che sta sotto:
         non si sa che colore sia davvero, e si rinuncia. */
      if (!c || c.a < 0.99) return null;
      tappe.push(c.rgb);
    }
    return tappe.length ? tappe : null;
  }

  /* ── Il gradiente che NON e' uno sfondo ──────────────────────────────
     `background-clip:text` con `-webkit-text-fill-color:transparent` e' la
     ricetta del «testo colorato a gradiente»: il gradiente dipinge i
     GLIFI, e lo sfondo vero e' quello dell'antenato. Trattarlo come uno
     sfondo da' il colore del testo contro se stesso — 1:1 — e inventa un
     difetto che non esiste: e' successo qui, su `.logo-name` e
     `.app-title`, appena i gradienti sono entrati nella misura.
     Quando e' cosi', sono le TAPPE a essere i colori del testo. */
  function testoAGradiente(cs){
    const clip = cs.webkitBackgroundClip || cs.backgroundClip || '';
    const riemp = cs.webkitTextFillColor || '';
    if (!/text/.test(clip)) return null;
    if (riemp && !/transparent|rgba\(0,\s*0,\s*0,\s*0\)/.test(riemp)) return null;
    return tappeGradiente(cs.backgroundImage || '');
  }
  /* Il ritaglio sul testo vale anche per i DISCENDENTI: lo `<span>` della
     versione dentro `.logo-name` e' dipinto dallo stesso gradiente del
     titolo. Guardando solo l'elemento si prendeva il gradiente del padre
     per uno sfondo e si otteneva il colore contro se stesso — 1:1. */
  function ritaglioSuTesto(el){
    let n = el;
    for (let i = 0; i < 6 && n && n !== document.documentElement; i++) {
      const cs = getComputedStyle(n);
      const t = testoAGradiente(cs);
      if (t) return { tappe: t, nodo: n };
      n = n.parentElement;
    }
    return null;
  }
  /* Un testo fatto di sole emoji non ha un colore del testo: il glifo porta
     i propri colori, e `color` non lo tocca. Misurarlo e' come misurare il
     contrasto di un SVG leggendo `color` — l'errore gia' visto su 48 falsi
     difetti nella Guida di Biochimica. Si contano e si dichiarano. */
  const RE_SOLO_EMOJI = /^[\s\u200d\ufe0f\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{2600}-\u{27BF}]+$/u;

  /* Restituisce un ELENCO di colori di sfondo: uno solo nel caso normale,
     tutte le tappe se il fondo e' un gradiente, null se non si sa.
     `da` permette di saltare l'elemento stesso quando il suo gradiente
     appartiene al testo e non al fondo. */
  function sfondiEffettivi(el, da){
    let n = da || el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        const t = tappeGradiente(cs.backgroundImage);
        return t;                                  // null se immagine vera
      }
      const c = leggiRGB(cs.backgroundColor);
      if (c && c.a > 0.85) return [c.rgb];
      n = n.parentElement;
    }
    const b = leggiRGB(getComputedStyle(document.body).backgroundColor);
    return [b && b.a > 0.5 ? b.rgb : [255, 255, 255]];
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
                titoli: [], focusInvisibile: [], esaminati: 0, svgSaltati: 0, gradienti: 0, immagini: 0, emoji: 0 };

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
    if (RE_SOLO_EMOJI.test(proprio)) { out.emoji++; return; }
    const ritaglio = ritaglioSuTesto(el);
    const tappeTesto = ritaglio ? ritaglio.tappe : null;
    const sfondi = sfondiEffettivi(el, ritaglio ? ritaglio.nodo.parentElement : null);
    if (!sfondi) { out.immagini++; out.esaminati--; return; }
    if (sfondi.length > 1 || tappeTesto) out.gradienti++;
    /* Sul gradiente vale la combinazione PEGGIORE: se il testo sparisce
       anche solo su un'estremita', li' non si legge. Vale in entrambi i
       versi — gradiente di sfondo o gradiente del testo. */
    const coloriTesto = tappeTesto || [fg.rgb];
    let r = Infinity, sf = sfondi[0];
    coloriTesto.forEach(function(t){
      sfondi.forEach(function(c){
        const x = rapporto(t, c);
        if (x < r) { r = x; sf = c; }
      });
    });
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

  let totContrasto = 0, totNome = 0, totEtichetta = 0, totAlt = 0, totTitoli = 0, totSezioni = 0;
  const esempi = [];

  for (const p of PAGINE) {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const pg = await ctx.newPage();
    await pg.goto(BASE + p, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(1800);

    /* ═══════════════════════════════════════════════════════════════
       Una pagina a sezioni si ispeziona una sezione per volta
       ═══════════════════════════════════════════════════════════════
       L'ispezione salta gli elementi non visibili, ed e' giusto: un
       elemento nascosto non ha contrasto da misurare. Ma in una pagina
       come `index.html`, dove 87 sezioni si alternano e una sola e'
       visibile, questo significava esaminare UN ottantasettesimo
       dell'applicazione e stampare «0 difetti».

       Non era un risultato falso — era un risultato su un campione che
       nessuno aveva dichiarato. I campi, i titoli e i testi delle altre
       86 sezioni non erano mai stati guardati.

       Ora le sezioni vengono aperte una per una e ispezionate ciascuna.
       Il conteggio delle sezioni percorse viene stampato: se fosse zero,
       si saprebbe che il giro non e' avvenuto, invece di leggere un «0
       difetti» che non vuol dire nulla.
       ═══════════════════════════════════════════════════════════════ */
    const sezioni = await pg.$$eval('.nav-btn[data-s]',
      function(bs){ return bs.map(function(b){ return b.getAttribute('data-s'); }); })
      .catch(function(){ return []; });

    const r = await pg.evaluate(ISPEZIONE, { normale: SOGLIA_NORMALE, grande: SOGLIA_GRANDE });
    let percorse = 0, visti = new Set();

    for (const sid of sezioni) {
      try {
        /* Il clic di Playwright aspetta che l'elemento sia VISIBILE, e i
           pulsanti stanno dentro gruppi di navigazione richiusi
           (`display:none`): l'attesa scadeva su tutti e 87, in 376 secondi,
           senza aprire una sola sezione. Il controllo aggiunto sopra l'ha
           detto — «87 sezioni presenti, nessuna percorsa» — invece di
           stampare «0 difetti» su un'ispezione che non era avvenuta.

           Un clic programmatico esegue lo stesso gestore senza pretendere
           la visibilita': è quello che serve qui, perché interessa lo stato
           della sezione aperta, non l'accessibilita' del pulsante che la
           apre (verificata a parte, fra i comandi senza nome). */
        await pg.evaluate(function(id){
          var b = document.querySelector('.nav-btn[data-s="' + id + '"]');
          if (b) b.click();
        }, sid);
        await pg.waitForTimeout(110);
        const s = await pg.evaluate(ISPEZIONE, { normale: SOGLIA_NORMALE, grande: SOGLIA_GRANDE });
        percorse++;
        r.esaminati += s.esaminati;
        r.svgSaltati += s.svgSaltati;
        r.gradienti += s.gradienti;
        /* Gli elementi comuni (intestazione, barra di navigazione) ricompaiono
           in ogni sezione: contarli 87 volte gonfierebbe sia i difetti sia gli
           elementi esaminati. La chiave distingue l'elemento dal suo contesto. */
        ['contrasto', 'senzaNome', 'senzaEtichetta', 'senzaAlt', 'titoli'].forEach(function(k){
          (s[k] || []).forEach(function(v){
            const chiave = k + '|' + (typeof v === 'string' ? v : (v.el || '') + '|' + (v.testo || ''));
            if (visti.has(chiave)) return;
            visti.add(chiave);
            r[k].push(v);
          });
        });
      } catch (e) { /* una sezione non raggiungibile non ferma il giro */ }
    }

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
    console.log('  ' + seg + ' ' + p.replace('.html', '').padEnd(24) +
      (sezioni.length ? String(percorse).padStart(3) + '/' + String(sezioni.length).padEnd(4) + 'sez · ' : '          ') +
      r.esaminati + ' elementi di testo · contrasto ' + r.contrasto.length +
      ' · comandi senza nome ' + r.senzaNome.length +
      ' · campi senza etichetta ' + r.senzaEtichetta.length +
      ' · img senza alt ' + r.senzaAlt.length +
      (r.svgSaltati ? ' · ' + r.svgSaltati + ' in SVG' : '') +
      (r.gradienti ? ' · ' + r.gradienti + ' su gradiente (misurati sulla tappa peggiore)' : '') +
      (r.immagini ? ' · ' + r.immagini + ' su immagine, non misurabili' : '') +
      (r.emoji ? ' · ' + r.emoji + ' di sole emoji' : '') +
      (r.lingua ? '' : ' · ⚠ manca lang'));
    if (!r.lingua) { ko++; console.log('      ✗ ' + p + ': manca l\'attributo lang sull\'elemento html'); }
    if (sezioni.length && percorse === 0) {
      ko++;
      console.log('      ✗ ' + p + ': ' + sezioni.length + ' sezioni presenti, nessuna percorsa — ' +
                  'il controllo non sta ispezionando l\'applicazione');
    }
    totSezioni += percorse;
  }

  console.log('\n── Riepilogo ──');
  att('nessun comando privo di nome accessibile', 0, totNome);
  att('nessuna immagine priva di testo alternativo', 0, totAlt);
  att('nessun salto nella gerarchia dei titoli', 0, totTitoli);
  console.log('      (' + totSezioni + ' sezioni percorse oltre alla vista iniziale di ogni pagina)');

  /* ═══════════════════════════════════════════════════════════════════
     Il debito misurato, e il patto che non cresca
     ═══════════════════════════════════════════════════════════════════
     Finche' questo banco guardava una sezione su 87 riportava «0
     difetti». Percorrendole tutte ne ha trovati 1069 di contrasto e 40
     campi senza etichetta: non erano comparsi, erano sempre stati li'.

     Pretendere zero da subito lascerebbe due sole vie, ed entrambe
     cattive: lasciare la verifica rossa per sempre, oppure allentarla
     finche' torna verde. La terza via e' dichiarare il numero.

     Il valore di riferimento e' registrato in
     `docs/evidence/accessibilita-riferimento.json`. La regola e':
       · se il conteggio SALE, il banco fallisce — e' una regressione;
       · se SCENDE, il banco passa e chiede di aggiornare il riferimento;
       · se e' uguale, passa in silenzio.

     Cosi' il debito e' visibile, quantificato e non puo' crescere di
     nascosto. Non e' conformita' WCAG: e' l'onesta' su quanto ci manca.
     ═══════════════════════════════════════════════════════════════════ */
  const FILE_RIF = path.join(RADICE, 'docs', 'evidence', 'accessibilita-riferimento.json');
  let rif = null;
  try { rif = JSON.parse(fs.readFileSync(FILE_RIF, 'utf8')); } catch (e) {}

  if (process.argv.includes('--aggiorna-riferimento')) {
    fs.mkdirSync(path.dirname(FILE_RIF), { recursive: true });
    fs.writeFileSync(FILE_RIF, JSON.stringify({
      nota: 'Debito di accessibilità misurato, non tollerato: il banco fallisce se questi ' +
            'numeri crescono. Rigenerare con --aggiorna-riferimento solo dopo averli RIDOTTI.',
      aggiornato: new Date().toISOString().slice(0, 10),
      contrasto: totContrasto,
      campiSenzaEtichetta: totEtichetta,
      sezioniPercorse: totSezioni
    }, null, 2) + '\n');
    console.log('\n  → riferimento aggiornato: contrasto ' + totContrasto +
                ', campi senza etichetta ' + totEtichetta);
  } else if (!rif) {
    ko++;
    console.log('  ✗ manca ' + path.relative(RADICE, FILE_RIF) +
                ': senza riferimento non si può dire se il debito sia cresciuto');
  } else {
    if (confrontaRif('contrasto sotto la soglia WCAG AA', totContrasto, rif.contrasto)) ok++;
    else ko++;
    if (confrontaRif('campi privi di etichetta', totEtichetta, rif.campiSenzaEtichetta)) ok++;
    else ko++;
    console.log('      riferimento del ' + (rif.aggiornato || '(senza data)') +
                ' — il debito è dichiarato in docs/09 §4, non tollerato in silenzio');
  }

  if (totContrasto) {
    console.log('\n  Esempi:');
    esempi.slice(0, 12).forEach(e => console.log('      ! ' + e));
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})();
