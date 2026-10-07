/* ═══════════════════════════════════════════════════════════════════════════
   BSI MOLDRAW — si disegna la molecola, esce lo spettro

   CHE COS'E'

   Una sezione dove si disegna una struttura e si ottiene lo spettro NMR
   previsto, con la tabella di assegnazione, e dove cliccando un picco si
   illumina l'atomo che lo produce. La predizione sta in `bsi-nmr.js`, che
   assegna gli spostamenti PER ATOMO: senza indici atomici il collegamento
   picco↔struttura non si potrebbe fare, ed e' quello che trasforma un
   disegno in un'assegnazione.

   PERCHE' NON C'E' UN EDITOR NUOVO

   Il primo tentativo ne scriveva uno: tavolozza degli elementi, legami,
   anelli, annulla e ripeti, menu contestuale. E' stato buttato, perche'
   l'applicazione ne ha GIA' UNO — `initMolEditor`, nella sezione «Centro
   spettroscopico», con la tavolozza, gli anelli eterociclici, le cariche, il
   tocco e la cronologia. Due editor per la stessa cosa significa che uno dei
   due riceve le correzioni e l'altro no, e chi disegna non sa quale usare.
   Il progetto ha una regola per questo: una sola casa per funzione.

   Quello che davvero mancava non era un posto per disegnare, ma uno spettro
   che si potesse INTERROGARE. La scheda ¹³C del Centro prevedeva i picchi con
   espressioni regolari sul TESTO dello SMILES — sei bande generiche, nessuna
   assegnazione, nessuna equivalenza. Questo modulo la sostituisce con il
   motore di `bsi-nmr.js`, che assegna gli spostamenti per ATOMO, e aggiunge
   lo spettro interattivo e la tabella di assegnazione.

   USO   sostituisce `window.ctrC13`; l'originale resta in `ctrC13Legacy`.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Lo stato del disegno, e il molfile che ne esce
     ═════════════════════════════════════════════════════════════════════════ */
  var ELEMENTI = ['C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I', 'H'];
  var COLORE_EL = { C:'#cfe2f5', N:'#4f9dff', O:'#ff6b6b', S:'#ffd93d',
    P:'#ff9f45', F:'#7bf3c4', Cl:'#39d98a', Br:'#c98a52', I:'#b07be8',
    H:'#9fb4c9' };

  function statoVuoto() {
    return { atomi: [], legami: [], passo: 42 };
  }

  /* Il molfile V2000: quattordici righe di intestazione piu' una riga per
     atomo e una per legame. Le coordinate del disegno diventano coordinate
     molecolari dividendo per il passo, cosi' un legame disegnato lungo ~42 px
     vale 1,0 — la lunghezza di legame convenzionale nei molfile. */
  function molfileDa(st) {
    if (!st.atomi.length) return null;
    var r = [];
    r.push('');                                   /* titolo: può  essere vuoto */
    r.push('  BSIMolDraw');
    r.push('');
    function n3(x) { var s = String(x); while (s.length < 3) s = ' ' + s; return s; }
    function f10(x) {
      var s = (Math.round(x * 10000) / 10000).toFixed(4);
      while (s.length < 10) s = ' ' + s;
      return s;
    }
    r.push(n3(st.atomi.length) + n3(st.legami.length) +
           '  0  0  0  0  0  0  0  0999 V2000');
    st.atomi.forEach(function (a) {
      /* y si inverte: sulla tela cresce verso il basso, in un molfile verso
         l'alto. Senza l'inversione ogni struttura usciva specchiata, e la
         stereochimica disegnata sarebbe stata il contrario di quella voluta. */
      var sim = a.el; while (sim.length < 3) sim = sim + ' ';
      r.push(f10(a.x / st.passo) + f10(-a.y / st.passo) + f10(0) + ' ' + sim +
             ' 0' + n3(cartaCarica(a.carica || 0)) + '  0  0  0  0  0  0  0  0  0  0');
    });
    st.legami.forEach(function (l) {
      r.push(n3(l.a + 1) + n3(l.b + 1) + n3(l.ordine || 1) + '  0  0  0  0');
    });
    r.push('M  END');
    return r.join('\n');
  }
  /* nei molfile la carica non e' il numero: 0=nessuna, 1=+3, 2=+2, 3=+1,
     5=-1, 6=-2, 7=-3. Scriverci il numero direttamente dava molecole con
     cariche assurde. */
  function cartaCarica(q) {
    return ({ '3':1, '2':2, '1':3, '0':0, '-1':5, '-2':6, '-3':7 })[String(q)] || 0;
  }

  function vicinoAlPunto(st, x, y, raggio) {
    var trovato = -1, best = raggio * raggio;
    st.atomi.forEach(function (a, i) {
      var d = (a.x - x) * (a.x - x) + (a.y - y) * (a.y - y);
      if (d <= best) { best = d; trovato = i; }
    });
    return trovato;
  }
  function legameVicino(st, x, y, raggio) {
    var trovato = -1, best = raggio;
    st.legami.forEach(function (l, i) {
      var A = st.atomi[l.a], B = st.atomi[l.b];
      if (!A || !B) return;
      var dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy;
      if (!L2) return;
      var u = ((x - A.x) * dx + (y - A.y) * dy) / L2;
      if (u < 0 || u > 1) return;
      var px = A.x + u * dx, py = A.y + u * dy;
      var d = Math.sqrt((px - x) * (px - x) + (py - y) * (py - y));
      if (d < best) { best = d; trovato = i; }
    });
    return trovato;
  }

  function aggiungiAnello(st, cx, cy, lati, aromatico) {
    var r = st.passo / (2 * Math.sin(Math.PI / lati));
    var primi = [];
    for (var k = 0; k < lati; k++) {
      var ang = -Math.PI / 2 + k * 2 * Math.PI / lati;
      st.atomi.push({ el: 'C', x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) });
      primi.push(st.atomi.length - 1);
    }
    for (var j = 0; j < lati; j++) {
      /* un anello aromatico si scrive in forma di Kekule': alternare i
         doppi e' cio' che un molfile V2000 sa esprimere, e RDKit riconosce
         l'aromaticita' da se'. */
      var ord = (aromatico && (j % 2 === 0)) ? 2 : 1;
      st.legami.push({ a: primi[j], b: primi[(j + 1) % lati], ordine: ord });
    }
    return primi;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · Lo spettro interattivo

     Zoom a rettangolo, rotella per l'intensita', doppio clic per tornare
     indietro, clic su un picco per illuminare gli atomi. Le righe si
     disegnano come uno spettro NMR si guarda: ppm che DECRESCONO da sinistra
     a destra.
     ═════════════════════════════════════════════════════════════════════════ */
  function finestraPiena(segnali, nucleo) {
    if (!segnali.length) return (nucleo === '13C') ? [0, 220] : [0, 12];
    var min = Infinity, max = -Infinity;
    segnali.forEach(function (s) {
      if (s.ppm < min) min = s.ppm;
      if (s.ppm > max) max = s.ppm;
    });
    var m = Math.max(5, (max - min) * 0.12);
    return [Math.min(0, min - m), max + m];
  }

  function disegnaSpettro(tela, segnali, vista, nucleo, evidenziato, opz) {
    opz = opz || {};
    var ctx = (typeof globale.bsiNitido === 'function') ? globale.bsiNitido(tela)
                                                        : tela.getContext('2d');
    if (!ctx) return;
    var W = tela.width, H = tela.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060d1a'; ctx.fillRect(0, 0, W, H);
    var mx = 10, my = 26, base = H - my;
    var da = vista[0], a = vista[1];
    /* ppm decrescenti da sinistra a destra: e' la convenzione, e disegnarlo
       al contrario rende lo spettro irriconoscibile a chi lo sa leggere */
    function px(p) { return mx + (a - p) / (a - da) * (W - mx * 2); }

    /* asse */
    ctx.strokeStyle = '#1d3450'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, base); ctx.lineTo(W - mx, base); ctx.stroke();
    ctx.fillStyle = '#8aadcc';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var passo = scegliPasso(a - da);
    for (var v = Math.ceil(da / passo) * passo; v <= a; v += passo) {
      var X = px(v);
      ctx.strokeStyle = '#16293f';
      ctx.beginPath(); ctx.moveTo(X, base); ctx.lineTo(X, base + 4); ctx.stroke();
      ctx.fillText(String(Math.round(v * 10) / 10), X, base + 6);
    }
    ctx.textAlign = 'right';
    ctx.fillText(nucleo === '13C' ? 'ppm (¹³C)' : 'ppm (¹H)', W - mx, 4);

    var altezzaMax = base - 16;
    var intensita = opz.intensita || 1;
    segnali.forEach(function (s) {
      if (s.ppm < da || s.ppm > a) return;
      var X = px(s.ppm);
      /* l'altezza di una riga ¹H rappresenta l'INTEGRAZIONE, che e' l'unica
         cosa che in un ¹H si legge davvero; nel ¹³C non significa niente e
         tutte le righe hanno la stessa altezza */
      var rel = (nucleo === '1H')
        ? Math.min(1, (s.nH || 1) / Math.max(1, opz.nHMax || 1))
        : 0.75;
      var alt = Math.min(altezzaMax, 20 + rel * (altezzaMax - 20) * intensita);
      var acceso = (evidenziato === s.nome);
      ctx.strokeStyle = acceso ? '#ffd93d' : '#00c896';
      ctx.lineWidth = acceso ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(X, base); ctx.lineTo(X, base - alt); ctx.stroke();
      if (opz.etichette) {
        ctx.save();
        ctx.fillStyle = acceso ? '#ffd93d' : '#bff3e4';
        ctx.font = 'bold 10px ui-monospace, monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.translate(X + 3, base - alt - 10);
        ctx.rotate(-Math.PI / 2.6);
        ctx.fillText(s.nome + '  ' + s.ppm.toFixed(1), 0, 0);
        ctx.restore();
      }
      if (opz.segnali) {
        ctx.fillStyle = acceso ? '#ffd93d' : '#7bf3c4';
        ctx.beginPath(); ctx.arc(X, base - alt, 3.2, 0, 6.2832); ctx.fill();
      }
    });
    return { px: px, base: base, mx: mx };
  }
  function scegliPasso(ampiezza) {
    var candidati = [0.2, 0.5, 1, 2, 5, 10, 20, 50];
    for (var i = 0; i < candidati.length; i++) {
      if (ampiezza / candidati[i] <= 12) return candidati[i];
    }
    return 100;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · Le uscite: CSV, JCAMP-DX, PNG

     Un risultato che non esce dallo strumento non si può  controllare e non si
     può  mettere in una relazione. Il JCAMP-DX prodotto qui e' una PEAK TABLE,
     non una curva: e' quello che una lista di segnali previsti e', e scrivere
     `XYDATA` darebbe l'impressione di una misura.
     ═════════════════════════════════════════════════════════════════════════ */
  function csvDa(ris) {
    var righe = [['etichetta', 'ppm', 'nH', 'molteplicita', 'J_Hz', 'atomi', 'assegnazione'].join(',')];
    ris.segnali.forEach(function (s) {
      righe.push([s.nome, s.ppm, (s.nH || ''), (s.molteplicita || ''),
                  (s.J || []).join(';'), '"' + s.atomi.join(' ') + '"',
                  '"' + String(s.etichetta || '').replace(/"/g, '""') + '"'].join(','));
    });
    return righe.join('\n');
  }

  function jcampDa(ris, nome) {
    var r = [];
    r.push('##TITLE=' + (nome || 'BioSpecInfo') + ' — ' +
           (ris.nucleo === '13C' ? '13C NMR previsto' : '1H NMR previsto'));
    r.push('##JCAMP-DX=4.24');
    r.push('##DATA TYPE=NMR PEAK TABLE');
    r.push('##DATA CLASS=PEAK TABLE');
    r.push('##ORIGIN=BioSpecInfo ' + (globale.BSI_APP_VERSION || ''));
    r.push('##OWNER=previsione, non misura');
    r.push('##.OBSERVE NUCLEUS=^' + (ris.nucleo === '13C' ? '13C' : '1H'));
    r.push('##XUNITS=PPM');
    r.push('##YUNITS=ARBITRARY UNITS');
    r.push('##$SMILES=' + (ris.smiles || ''));
    r.push('##$METODO=' + (ris.metodo || ''));
    r.push('##$INCERTEZZA=' + (ris.incertezza || ''));
    r.push('##NPOINTS=' + ris.segnali.length);
    r.push('##PEAK TABLE=(XY..XY)');
    ris.segnali.forEach(function (s) {
      r.push(s.ppm.toFixed(3) + ', ' + (s.nH || 1));
    });
    r.push('##END=');
    return r.join('\n');
  }

  function scarica(nome, testo, tipo) {
    try {
      var b = new Blob([testo], { type: tipo || 'text/plain;charset=utf-8' });
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u; a.download = nome; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400);
      return true;
    } catch (e) { return false; }
  }

  globale.BSIMolDraw = {
    statoVuoto: statoVuoto, molfileDa: molfileDa, aggiungiAnello: aggiungiAnello,
    disegnaSpettro: disegnaSpettro,
    finestraPiena: finestraPiena, csvDa: csvDa, jcampDa: jcampDa,
    cartaCarica: cartaCarica, ELEMENTI: ELEMENTI,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);


/* ═══════════════════════════════════════════════════════════════════════════
   §5 · Il pannello — prende il posto della scheda ¹³C del Centro

   La scheda prevedeva i picchi con `ctrPredict13C`, che e' una sequenza di
   espressioni regolari sul TESTO dello SMILES: `has(/c1ccc/)` → «C aromatici
   128 ppm», `p.push({ppm:25, lbl:'C alifatici'})` sempre. Sei bande per
   qualunque molecola, nessuna assegnazione, nessuna equivalenza, e il difetto
   di fondo che il progetto documenta altrove — riconoscere sulla stringa e
   non sulla struttura.

   Qui la predizione viene da `bsi-nmr.js`, che lavora sul grafo e risponde
   per ATOMO. Da quello si ottengono tre cose che prima non c'erano: il numero
   GIUSTO di segnali, la tabella di assegnazione, e il collegamento fra un
   picco e gli atomi che lo producono.

   L'originale non viene cancellato: resta in `window.ctrC13Legacy`, perche'
   se il motore nuovo non fosse caricato la scheda deve comunque mostrare
   qualcosa invece di restare vuota.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var M = globale.BSIMolDraw;
  if (!M) {
    try { console.error('bsi-moldraw: BSIMolDraw assente, la scheda ¹³C resta quella di prima'); } catch (e) {}
    return;
  }

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var CSS = [
    '.bsiNP-bar{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}',
    '.bsiNP-b{padding:5px 11px;background:#0f2040;border:1px solid #1d3450;border-radius:7px;color:#cfe2f5;cursor:pointer;font-family:var(--font-mono,ui-monospace,monospace);font-size:11.5px}',
    '.bsiNP-b:hover{background:#15304f}',
    '.bsiNP-b.on{background:#00c896;border-color:#00c896;color:#04221a;font-weight:800}',
    '.bsiNP-grid{display:grid;grid-template-columns:1.25fr 1fr;gap:12px;align-items:start}',
    '@media(max-width:900px){.bsiNP-grid{grid-template-columns:1fr}}',
    '.bsiNP-tela{width:100%;border:1px solid #16293f;border-radius:10px;display:block;touch-action:none;cursor:crosshair}',
    '.bsiNP-tbl{width:100%;border-collapse:collapse;font-size:12px}',
    '.bsiNP-tbl th{background:#15354a;color:#bff3e4;padding:6px 8px;text-align:left;font-weight:800;font-size:11px}',
    '.bsiNP-tbl td{padding:5px 8px;border-bottom:1px solid #16293f;color:#cfe2f5;cursor:pointer;vertical-align:top}',
    '.bsiNP-tbl tr.on td{background:#15354a;color:#ffd93d}',
    '.bsiNP-tbl tr:hover td{background:#102137}',
    '.bsiNP-nota{font-size:11px;color:#8aadcc;line-height:1.55;margin-top:6px}',
    '.bsiNP-dep svg{max-width:100%;height:auto;background:#fff;border-radius:8px}',
    '.bsiNP-storia{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0 2px}',
    '.bsiNP-vuota{font-size:11px;color:#7a8aa0}',
    '.bsiNP-chip{font:600 11px/1 ui-monospace,monospace;background:#0e2033;color:#9fd6cc;'
      + 'border:1px solid #1d3c52;border-radius:999px;padding:5px 9px;cursor:pointer}',
    '.bsiNP-chip:hover{background:#15354a;color:#ffd93d}',
    '.bsiNP-chip.on{background:#00c9b7;color:#06212c;border-color:#00c9b7}'
  ].join('');

  function stile() {
    if (document.getElementById('bsiNP-css')) return;
    var s = document.createElement('style');
    s.id = 'bsiNP-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── stato ──────────────────────────────────────────────────────────────── */
  var nucleo = '13C', ris = null, vista = null, acceso = null;
  var etichette = true, segni = true, intensita = 1, zoomDa = null, smilesOra = '';

  /* ── Dove sta il pannello ────────────────────────────────────────────────
     Il pannello puo' essere montato in DUE posti: la scheda ¹³C del Centro
     spettroscopico e la scheda ¹³C dell'editor ChemDraw. Montati entrambi,
     nella pagina esistono due elementi con lo stesso `id` — e
     `getElementById` restituisce il PRIMO in ordine di documento, che non e'
     necessariamente quello che si sta guardando: lo spettro veniva disegnato
     nel pannello sbagliato e quello aperto restava fermo.

     Le ricerche partono quindi dalla RADICE del pannello montato per ultimo,
     che e' quello che l'utente ha appena aperto. Il ripiego su `document`
     serve solo se la radice non e' piu' attaccata alla pagina. */
  var radice = null;

  function q(id) {
    if (radice && radice.isConnected) {
      var e = radice.querySelector('#' + id);
      if (e) return e;
    }
    return document.getElementById(id);
  }

  function smilesCorrente() {
    /* Tre sorgenti, nell'ordine in cui hanno senso: la molecola che il Centro
       sta analizzando, il campo di ricerca, lo SMILES generato dall'editor.
       `_ctrSmiles` non e' esposta fuori dalla sua IIFE, quindi si legge il
       DOM — che e' anche piu' robusto, perche' e' quello che l'utente vede. */
    var h = document.querySelector('#ctrMolHead .mp');
    if (h && h.textContent) {
      var m = h.textContent.match(/^\s*([^\s]+)/);
      if (m && /[A-Za-z]/.test(m[1])) return m[1];
    }
    var i = document.getElementById('ctrSmiles');
    if (i && i.value.trim()) return i.value.trim();
    var e = document.getElementById('mdSmiles');
    if (e && e.textContent && e.textContent !== '(vuoto)') return e.textContent.trim();
    return '';
  }

  function atomiAccesi() {
    if (!ris || !acceso) return [];
    var s = null;
    ris.segnali.forEach(function (x) { if (x.nome === acceso) s = x; });
    return s ? s.atomi : [];
  }

  function vistaHTML() {
    return '<div class="bsiNP-bar">' +
      '<button class="bsiNP-b" data-nuc="1H">¹H</button>' +
      '<button class="bsiNP-b" data-nuc="13C">¹³C</button>' +
      '<button class="bsiNP-b" id="bsiNP-prevedi">' + t('Prevedi', 'Predict') + '</button>' +
      '<button class="bsiNP-b" id="bsiNP-etich">' + t('etichette', 'labels') + '</button>' +
      '<button class="bsiNP-b" id="bsiNP-segni">' + t('segnali', 'signals') + '</button>' +
      '<button class="bsiNP-b" id="bsiNP-csv">CSV</button>' +
      '<button class="bsiNP-b" id="bsiNP-jdx">JCAMP-DX</button>' +
      '<button class="bsiNP-b" id="bsiNP-png">PNG</button>' +
      '</div>' +
      '<div class="bsiNP-storia" id="bsiNP-storia"></div>' +
      '<div class="bsiNP-grid">' +
      '<div><canvas id="bsiNP-tela" class="bsiNP-tela" width="620" height="260" ' +
        'style="height:260px"></canvas>' +
      '<p class="bsiNP-nota" id="bsiNP-metodo"></p></div>' +
      '<div><div class="bsiNP-dep" id="bsiNP-dep"></div>' +
      '<div id="bsiNP-tab" style="margin-top:8px"></div></div></div>';
  }

  function disegna() {
    var tela = q('bsiNP-tela');
    if (!tela) return;
    var segnali = (ris && ris.segnali) ? ris.segnali : [];
    if (!vista) vista = M.finestraPiena(segnali, nucleo);
    var nHMax = 1;
    segnali.forEach(function (s) { if ((s.nH || 0) > nHMax) nHMax = s.nH; });
    M.disegnaSpettro(tela, segnali, vista, nucleo, acceso,
      { etichette: etichette, segnali: segni, intensita: intensita, nHMax: nHMax });
    var m = q('bsiNP-metodo');
    if (!m) return;
    if (ris && ris.errore) {
      m.innerHTML = '<span style="color:#ff6b6b">' +
        t('Il predittore ha incontrato un errore: ', 'The predictor hit an error: ') +
        esc(ris.errore) + '</span>';
    } else if (ris) {
      m.innerHTML = '<b>' + t('Metodo', 'Method') + ':</b> ' + esc(ris.metodo) +
        '<br><b>' + t('Scarto', 'Deviation') + ':</b> ' + esc(ris.incertezza) +
        '<br><span style="color:#7a8aa0">' + t(
        'Trascina un rettangolo per ingrandire · rotella per l’intensità · doppio ' +
        'clic per tornare indietro · clic su un picco o su una riga per illuminare gli atomi',
        'Drag a box to zoom · wheel for intensity · double-click to reset · click a ' +
        'peak or a row to highlight its atoms') + '</span>';
    } else {
      m.textContent = t('Nessuna struttura da prevedere.', 'No structure to predict.');
    }
  }

  function tabella() {
    var d = q('bsiNP-tab');
    if (!d) return;
    if (!ris || !ris.segnali.length) {
      d.innerHTML = '<p class="bsiNP-nota">' + t('Nessun segnale.', 'No signals.') + '</p>';
      return;
    }
    var h = '<table class="bsiNP-tbl"><tr><th>' + t('etich.', 'label') + '</th><th>ppm</th>' +
      (nucleo === '1H'
        ? '<th>' + t('integr.', 'integ.') + '</th><th>' + t('mult.', 'mult.') + '</th><th>J</th>'
        : '<th>' + t('n.C', 'no.C') + '</th>') +
      '<th>' + t('assegnazione', 'assignment') + '</th></tr>';
    ris.segnali.forEach(function (s) {
      h += '<tr data-seg="' + esc(s.nome) + '"' + (acceso === s.nome ? ' class="on"' : '') +
        '><td><b>' + esc(s.nome) + '</b></td><td>' + s.ppm.toFixed(2) + '</td>' +
        (nucleo === '1H'
          ? '<td>' + (s.nH || '') + 'H</td><td>' + esc(s.molteplicita || '') + '</td><td>' +
            (s.J || []).map(function (j) { return j.toFixed(1); }).join(', ') + '</td>'
          : '<td>' + s.n + '</td>') +
        '<td>' + esc(s.etichetta || '') +
        (s.contributi && s.contributi.length
          ? '<br><span style="font-size:10px;color:#7a8aa0">' + esc(s.contributi.join(' · ')) + '</span>'
          : '') + '</td></tr>';
    });
    d.innerHTML = h + '</table>';
    [].forEach.call(d.querySelectorAll('tr[data-seg]'), function (tr) {
      tr.onclick = function () {
        var n = tr.getAttribute('data-seg');
        acceso = (acceso === n) ? null : n;
        tutto();
      };
    });
  }

  function depizione() {
    var d = q('bsiNP-dep');
    if (!d) return;
    if (!smilesOra || !globale.BSINMR) { d.innerHTML = ''; return; }
    var svg = globale.BSINMR.strutturaConAtomi(smilesOra, atomiAccesi(), 420, 240);
    d.innerHTML = svg || '';
  }

  function tutto() { disegna(); tabella(); depizione(); disegnaStoria(); }

  /* ── La cronologia delle molecole ───────────────────────────────────────
     Chi usa questo strumento prova una struttura, poi un'altra, poi torna
     alla prima per confrontare gli spettri. Senza cronologia bisogna
     ridisegnarla, e il confronto — che e' il motivo per cui si prevede uno
     spettro — diventa un lavoro di memoria.

     Di ogni molecola si tiene lo SMILES CANONICO, che e' quello che RDKit
     restituisce e non quello che l'utente ha scritto, piu' l'InChI e la sua
     chiave. L'InChI serve perche' due SMILES diversi possono essere la stessa
     molecola: `OCC` e `CCO` sono l'etanolo entrambi, e senza una forma
     canonica indipendente la cronologia si riempirebbe di doppioni.

     Sta in `localStorage`, dentro un try/catch: in navigazione privata la
     scrittura lancia, e una cronologia che non si salva e' un fastidio, non
     un guasto — lo strumento deve continuare a funzionare. */
  var CHIAVE_STORIA = 'bsi_nmr_storia', MAX_STORIA = 12;
  var storia = [];

  function leggiStoria() {
    try {
      var g = JSON.parse(localStorage.getItem(CHIAVE_STORIA) || '[]');
      storia = Array.isArray(g) ? g.slice(0, MAX_STORIA) : [];
    } catch (e) { storia = []; }
    return storia;
  }
  function salvaStoria() {
    try { localStorage.setItem(CHIAVE_STORIA, JSON.stringify(storia)); }
    catch (e) { /* in privata non si salva: la sessione corrente resta buona */ }
  }

  function identitaDi(smiles) {
    var R = globale.__rdkit, out = { smiles: smiles, inchi: '', chiave: '' };
    if (!R) return out;
    var mol = null;
    try {
      mol = R.get_mol(String(smiles));
      if (!mol) return out;
      try { out.smiles = mol.get_smiles() || smiles; } catch (e) {}
      try { out.inchi = mol.get_inchi() || ''; } catch (e) {}
      try {
        if (out.inchi && typeof R.get_inchikey_for_inchi === 'function') {
          out.chiave = R.get_inchikey_for_inchi(out.inchi) || '';
        }
      } catch (e) {}
    } catch (e) { /* uno SMILES illeggibile non entra in cronologia */ }
    if (mol) { try { mol.delete(); } catch (e) {} }
    return out;
  }

  function ricorda(smiles) {
    var id = identitaDi(smiles);
    if (!id.smiles) return;
    /* Il confronto e' sulla CHIAVE InChI quando c'e', sullo SMILES canonico
       quando non c'e'. Una molecola gia' vista non si aggiunge: si sposta in
       cima, perche' e' quella su cui si sta lavorando adesso. */
    var uguale = function (x) {
      return (id.chiave && x.chiave) ? (x.chiave === id.chiave) : (x.smiles === id.smiles);
    };
    storia = storia.filter(function (x) { return !uguale(x); });
    storia.unshift({ smiles: id.smiles, inchi: id.inchi, chiave: id.chiave,
                     quando: Date.now() });
    if (storia.length > MAX_STORIA) storia.length = MAX_STORIA;
    salvaStoria();
  }

  function disegnaStoria() {
    var d = q('bsiNP-storia');
    if (!d) return;
    if (!storia.length) {
      d.innerHTML = '<span class="bsiNP-vuota">' +
        t('Le molecole previste compaiono qui, per riprenderle senza ridisegnarle.',
          'Predicted molecules appear here, so you can return to them without redrawing.') +
        '</span>';
      return;
    }
    d.innerHTML = '<span class="bsiNP-vuota">' + t('cronologia', 'history') + ':</span>' +
      storia.map(function (x, k) {
        var corto = x.smiles.length > 22 ? (x.smiles.slice(0, 21) + '…') : x.smiles;
        return '<button class="bsiNP-chip' + (x.smiles === smilesOra ? ' on' : '') +
          '" data-st="' + k + '" title="' + esc(x.smiles) +
          (x.inchi ? ('\n' + x.inchi) : '') +
          (x.chiave ? ('\n' + x.chiave) : '') + '">' + esc(corto) + '</button>';
      }).join('') +
      '<button class="bsiNP-chip" id="bsiNP-stCopia">' +
        t('copia InChI', 'copy InChI') + '</button>' +
      '<button class="bsiNP-chip" id="bsiNP-stVuota">' +
        t('svuota', 'clear') + '</button>';
    [].forEach.call(d.querySelectorAll('[data-st]'), function (b) {
      b.onclick = function () {
        var x = storia[+b.getAttribute('data-st')];
        if (x) prevediDi(x.smiles);
      };
    });
    var bc = q('bsiNP-stCopia');
    if (bc) bc.onclick = function () {
      /* Si copia l'InChI della molecola SUL TAVOLO, non il primo della lista:
         il bottone sta accanto alla cronologia ma parla di quello che si sta
         guardando. */
      var qui = storia.filter(function (x) { return x.smiles === smilesOra; })[0] || storia[0];
      var testo = qui ? (qui.inchi || qui.smiles) : '';
      if (!testo) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(testo);
        }
      } catch (e) {}
      bc.textContent = t('copiato', 'copied');
      setTimeout(function () { bc.textContent = t('copia InChI', 'copy InChI'); }, 1200);
    };
    var bv = q('bsiNP-stVuota');
    if (bv) bv.onclick = function () { storia = []; salvaStoria(); disegnaStoria(); };
  }

  function prevediDi(smiles) {
    smilesOra = String(smiles || '');
    if (!smilesOra || !globale.BSINMR) { ris = null; vista = null; tutto(); return; }
    ris = globale.BSINMR.predici(smilesOra, { nucleo: nucleo });
    acceso = null;
    vista = ris ? M.finestraPiena(ris.segnali, nucleo) : null;
    /* In cronologia entra solo cio' che ha prodotto uno spettro: una
       struttura che il predittore non sa leggere non e' una molecola su cui
       si tornera'. */
    if (ris && !ris.errore && ris.segnali.length) ricorda(smilesOra);
    tutto();
  }

  function prevedi() { prevediDi(smilesCorrente()); }

  function aggancia() {
    [].forEach.call(document.querySelectorAll('#ctrC13 [data-nuc]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-nuc') === nucleo);
      b.onclick = function () {
        nucleo = b.getAttribute('data-nuc'); vista = null; prevedi(); aggancia();
      };
    });
    var be = q('bsiNP-etich');
    if (be) { be.classList.toggle('on', etichette);
      be.onclick = function () { etichette = !etichette; aggancia(); disegna(); }; }
    var bs = q('bsiNP-segni');
    if (bs) { bs.classList.toggle('on', segni);
      bs.onclick = function () { segni = !segni; aggancia(); disegna(); }; }
    var bp = q('bsiNP-prevedi');
    if (bp) bp.onclick = prevedi;
    var bc = q('bsiNP-csv');
    if (bc) bc.onclick = function () {
      if (ris) scarica('nmr-' + nucleo + '.csv', M.csvDa(ris), 'text/csv');
    };
    var bj = q('bsiNP-jdx');
    if (bj) bj.onclick = function () {
      if (ris) scarica('nmr-' + nucleo + '.jdx', M.jcampDa(ris, smilesOra), 'chemical/x-jcamp-dx');
    };
    var bg = q('bsiNP-png');
    if (bg) bg.onclick = function () {
      var c = q('bsiNP-tela');
      if (!c || !c.toBlob) return;
      c.toBlob(function (b) {
        if (!b) return;
        var u = URL.createObjectURL(b), a = document.createElement('a');
        a.href = u; a.download = 'spettro-' + nucleo + '.png';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400);
      });
    };

    var tela = q('bsiNP-tela');
    if (!tela) return;
    function cx(ev) {
      var r = tela.getBoundingClientRect();
      return (ev.clientX - r.left) * tela.width / r.width;
    }
    tela.onpointerdown = function (ev) { zoomDa = cx(ev); };
    tela.onpointerup = function (ev) {
      var x = cx(ev), segnali = (ris && ris.segnali) ? ris.segnali : [];
      var mx = 10, W = tela.width;
      function ppmDa(X) {
        return vista[1] - (X - mx) / (W - mx * 2) * (vista[1] - vista[0]);
      }
      if (zoomDa !== null && Math.abs(x - zoomDa) > 14 && vista) {
        var p1 = ppmDa(Math.min(x, zoomDa)), p2 = ppmDa(Math.max(x, zoomDa));
        vista = [Math.min(p1, p2), Math.max(p1, p2)];
        zoomDa = null; disegna(); return;
      }
      zoomDa = null;
      if (!segnali.length || !vista) return;
      var vicino = null, best = 18;
      segnali.forEach(function (s) {
        var X = mx + (vista[1] - s.ppm) / (vista[1] - vista[0]) * (W - mx * 2);
        var d = Math.abs(X - x);
        if (d < best) { best = d; vicino = s.nome; }
      });
      acceso = (vicino && acceso === vicino) ? null : vicino;
      tutto();
    };
    tela.ondblclick = function () {
      vista = M.finestraPiena((ris && ris.segnali) ? ris.segnali : [], nucleo);
      intensita = 1; disegna();
    };
    tela.onwheel = function (ev) {
      ev.preventDefault();
      intensita = Math.max(0.15, Math.min(8, intensita * (ev.deltaY < 0 ? 1.15 : 1 / 1.15)));
      disegna();
    };
  }

  function scarica(nome, testo, tipo) {
    try {
      var b = new Blob([testo], { type: tipo || 'text/plain;charset=utf-8' });
      var u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = nome; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400);
    } catch (e) {}
  }

  function montaC13() {
    var box = document.getElementById('ctrC13');
    if (!box) return;
    stile();
    radice = box;
    leggiStoria();
    box.innerHTML = vistaHTML();
    aggancia();
    if (globale.bsiLoadRDKit) globale.bsiLoadRDKit(prevedi);
    else prevedi();
  }

  /* La sostituzione avviene quando il Centro e' pronto: `ctrC13` viene
     esposta dalla sua IIFE, e sovrascriverla prima che esista non avrebbe
     effetto. Si aspetta che ci sia, e si tiene l'originale. */
  function sostituisci() {
    if (globale.ctrC13 && globale.ctrC13.__bsiNmr) return true;
    if (typeof globale.ctrC13 !== 'function') return false;
    globale.ctrC13Legacy = globale.ctrC13;
    var nuova = function () {
      if (!globale.BSINMR) {
        /* senza il motore nuovo la scheda deve mostrare qualcosa, non restare
           vuota: si torna a quella di prima */
        try { return globale.ctrC13Legacy(); } catch (e) { return; }
      }
      return montaC13();
    };
    nuova.__bsiNmr = true;
    globale.ctrC13 = nuova;
    return true;
  }

  var tentativi = 0;
  (function attendi() {
    if (sostituisci()) return;
    if (++tentativi > 60) return;
    setTimeout(attendi, 250);
  })();

  document.addEventListener('bsi-lingua', function () {
    var box = document.getElementById('ctrC13');
    if (box && box.querySelector('#bsiNP-tela')) montaC13();
  });

  /* Monta il pannello in un contenitore QUALUNQUE, con uno SMILES dato: e'
     cosi' che la scheda ¹³C dell'overlay ChemDraw lo usa, senza che il modulo
     debba sapere com'e' fatto quell'overlay. */
  function montaIn(box, smi) {
    if (!box) return;
    stile();
    radice = box;
    leggiStoria();
    box.innerHTML = vistaHTML();
    aggancia();
    function parti() {
      prevediDi((smi && String(smi).trim()) || smilesCorrente());
    }
    /* il nucleo si puo' cambiare anche qui, e deve ripartire dallo STESSO
       SMILES: senza questo, passando a ¹H si tornava a cercarlo nel DOM del
       Centro, che nell'overlay non c'e' */
    [].forEach.call(box.querySelectorAll('[data-nuc]'), function (b2) {
      b2.onclick = function () {
        nucleo = b2.getAttribute('data-nuc'); vista = null; parti();
        [].forEach.call(box.querySelectorAll('[data-nuc]'), function (b3) {
          b3.classList.toggle('on', b3.getAttribute('data-nuc') === nucleo);
        });
      };
    });
    var bp = box.querySelector('#bsiNP-prevedi');
    if (bp) bp.onclick = parti;
    if (globale.bsiLoadRDKit) globale.bsiLoadRDKit(parti); else parti();
  }

  globale.BSINmrPannello = { monta: montaC13, montaIn: montaIn, prevedi: prevedi,
    smilesCorrente: smilesCorrente, stato: function () {
      /* `errore` e' null quando non ce n'e' uno, mai undefined: chi lo legge
         deve poter distinguere «nessun errore» da «campo assente» senza
         indovinare. */
      return { nucleo: nucleo, segnali: ris ? ris.segnali : [], acceso: acceso,
               vista: vista, smiles: smilesOra,
               storia: storia.slice(),
               errore: (ris && ris.errore) ? ris.errore : null };
    },
    storia: function () { return storia.slice(); },
    prevediDi: prevediDi,
    svuotaStoria: function () { storia = []; salvaStoria(); disegnaStoria(); } };

})(typeof window !== 'undefined' ? window : globalThis);
