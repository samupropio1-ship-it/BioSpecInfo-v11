/* ════════════════════════════════════════════════════════════════════════
   BioSpecInfo · bsi-spectra-spiega.js  (v240)
   © Samuele Pio Provenzano

   «🧠 SPIEGA»: L'AI CHE SPIEGA TUTTO, IN MODO ESAUSTIVO.
   Richiesta dell'autore: non lezioni, ma «una spiegazione perfetta, completa e
   completamente esaustiva su tutto ciò che riguarda chimica, fisica e matematica,
   a un livello avanzatissimo», che spieghi anche «i grafici in 3D, i grafici degli
   spettri, tutto». Questa scheda della finestra di Spectra fa esattamente questo:

   · LA DOMANDA: qualunque cosa delle tre materie, dal livello di scuola superiore
     al PhD avanzato (frontiera della ricerca). Per ciascun livello il modello
     riceve che cosa ci si aspetta (strumenti matematici, formalismo, letteratura
     primaria, problemi aperti) e non semplifica sotto.
   · LO SCHERMO: con un tocco la spiegazione riguarda cio' che hai aperto. Spectra
     legge la sezione (titolo, scheda, valori di ogni cursore e scelta, il testo e
     le tabelle visibili) e fotografa i grafici e le scene 3D (le scene di
     BSILab3D si ridisegnano prima della foto) e trasforma in immagine i grafici SVG; il testo va al modello sempre,
     l'immagine ai modelli che vedono le immagini (la conversione per fornitore e'
     quella della chat: bsi-ai-hub.js).
   · LA SPIEGAZIONE ha una struttura obbligatoria: in sintesi → che cosa stai
     guardando (lettura QUANTITATIVA del grafico: per uno spettro NMR ogni segnale
     con δ, molteplicita', J, integrale e attribuzione; IR bande e gruppi; MS ione
     molecolare, frammenti e isotopi; UV-Vis λmax, transizioni ed ε; per una scena 3D
     geometria, simmetrie, nodi, punti critici, isosuperfici e significato fisico;
     per un grafico matematico dominio, asintoti, estremi, flessi, convergenza) →
     fondamenti teorici → formalismo e derivazione completa → esempi numerici
     calcolati → casi limite, approssimazioni ed errori comuni → collegamenti fra
     chimica, fisica e matematica → applicazioni e frontiera (letteratura solo se
     certa) → tre domande per verificarsi, con risposta.
   · LA CONVERSAZIONE continua: «approfondisci», «dimostra il passaggio 3»,
     «e se raddoppio la temperatura?».
   · SPECTRA COL CORPO (bsi-spectra-figura.js) la conduce: la figura si sposta
     nella scheda, pensa mentre il modello scrive, poi spiega a voce e a gesti.
   · SENZA MODELLO non si finge: lo si dice, e si mostra cio' che l'app sa da sola
     della sezione aperta (i capitoli della lezione guidata, bsi-lezione.js) e, se
     la domanda e' un esercizio numerico, lo svolgimento dell'assistente locale
     (bsi-assistente.js).

   API: BSISpiega.costruisci(pannello), BSISpiega.chiedi(domanda, { schermo, livello }),
        BSISpiega.schermo() → { testo, tela, svg, grafici }, BSISpiega.immagine(S) → Promise<dataURL>,
        BSISpiega.sistema(livello, materia)
   ════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var D = globale.document;
  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() !== 'it') ? en : it; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function md(s) { return globale.bsiMarkdownToHtml ? globale.bsiMarkdownToHtml(String(s || '')) : '<p>' + esc(s).replace(/\n/g, '<br>') + '</p>'; }
  function annuncia(tipo, d) { try { D.dispatchEvent(new CustomEvent(tipo, { detail: d })); } catch (e) {} }

  /* i livelli: dalle superiori al PhD avanzato */
  var LIVELLI = [t('Scuola superiore', 'High school'), t('Triennale', 'Bachelor'), t('Magistrale', 'Master'), t('Dottorato (PhD)', 'PhD'), t('PhD avanzato · frontiera', 'Advanced PhD · frontier')];
  var PROFONDITA = [
    'scuola superiore: concetti chiari e corretti, algebra e trigonometria, esempi concreti; ma completo, senza omettere nulla di importante',
    'triennale: calcolo differenziale e integrale, vettori, equazioni differenziali, unità SI rigorose, derivazioni complete',
    'magistrale: formalismo completo (meccanica analitica, termodinamica statistica, meccanica quantistica, algebra lineare, analisi complessa, teoria dei gruppi), approssimazioni controllate e ordini di grandezza',
    'dottorato: metodi avanzati (funzioni di Green, teoria delle perturbazioni, seconda quantizzazione, metodi variazionali, analisi funzionale, teoria delle rappresentazioni, metodi numerici con stima dell\'errore) e letteratura primaria (autori, anno, rivista) solo se ne sei certo',
    'PhD avanzato e frontiera della ricerca: lo stato dell\'arte, i problemi aperti e le controversie attuali, i limiti dei modelli correnti, tecniche di punta (integrali sui cammini, rinormalizzazione, teoria dei campi, metodi topologici e geometrici, calcolo ab initio ad alta accuratezza, apprendimento automatico per la scienza), letteratura primaria (solo riferimenti certi, altrimenti dillo) e una domanda di ricerca aperta'
  ];
  var SPUNTI = [
    [t('📈 Spiegami questo grafico', '📈 Explain this graph'), t('Spiegami in modo completo il grafico che ho sullo schermo: ogni elemento, che cosa significa e che cosa se ne ricava.', 'Explain the graph on my screen completely: every element, what it means and what can be inferred.')],
    [t('🧪 Lo spettro, picco per picco', '🧪 The spectrum, peak by peak'), t('Interpreta lo spettro sullo schermo picco per picco: posizione, forma, intensità, attribuzione, e la struttura che ne risulta.', 'Interpret the spectrum on screen peak by peak: position, shape, intensity, assignment, and the resulting structure.')],
    [t('🧊 La scena 3D', '🧊 The 3D scene'), t('Spiega la scena 3D sullo schermo: geometria, simmetrie, nodi, punti critici, superfici, e il loro significato fisico o matematico.', 'Explain the 3D scene on screen: geometry, symmetries, nodes, critical points, surfaces, and their physical or mathematical meaning.')],
    [t('∴ Dimostrazione completa', '∴ Full proof'), t('Dammi la derivazione completa e rigorosa di ciò che vedo, senza saltare passaggi.', 'Give me the complete, rigorous derivation of what I see, without skipping steps.')],
    [t('🔭 Frontiera della ricerca', '🔭 Research frontier'), t('Che cosa si sa oggi, che cosa è ancora aperto e dove sta andando la ricerca su questo argomento?', 'What is known today, what is still open and where is research going on this topic?')]
  ];

  function sistema(livello, materia) {
    return 'Sei Spectra, l\'intelligenza artificiale di BioSpecInfo: esperto di chimica, fisica e matematica al livello dei migliori ricercatori. ' +
      'Il tuo compito è SPIEGARE in modo perfetto, completo e completamente esaustivo, non fare una lezione semplificata. ' +
      'Livello richiesto: «' + LIVELLI[livello] + '» — ' + PROFONDITA[livello] + '. Non semplificare sotto questo livello e non tralasciare nulla di rilevante. ' +
      (materia ? 'Materia prevalente: ' + materia + '. ' : '') +
      'Rigore assoluto: unità di misura sempre, assunzioni dichiarate, numeri calcolati e non inventati; se i dati non bastano, dillo e dì che cosa servirebbe. ' +
      'Struttura obbligatoria, con titoli markdown (##): ' +
      '1. In sintesi (3-5 righe). ' +
      '2. Che cosa stai guardando — SOLO se c\'è lo schermo: descrivi e LEGGI QUANTITATIVAMENTE ogni elemento (assi, unità, scala, curve, valori dei controlli). ' +
      'Per uno spettro: NMR ogni segnale con δ, molteplicità, J, integrale e attribuzione; IR bande (numero d\'onda, intensità, forma) e gruppi funzionali; MS ione molecolare, frammenti, perdite neutre, profilo isotopico; UV-Vis λmax, tipo di transizione, ε; poi la struttura che ne risulta e la sua coerenza. ' +
      'Per una scena 3D: geometria, simmetrie (gruppo puntuale o spaziale), piani e superfici nodali, punti critici, isosuperfici, campi, e il loro significato fisico o matematico. ' +
      'Per un grafico matematico: dominio, simmetrie, asintoti, zeri, estremi, flessi, convergenza, comportamento ai limiti. ' +
      '3. Fondamenti teorici. 4. Formalismo e derivazione completa, passo per passo, numerata. 5. Esempi numerici calcolati (con i valori dello schermo, se ci sono). ' +
      '6. Casi limite, approssimazioni, errori comuni. 7. Collegamenti fra chimica, fisica e matematica. 8. Applicazioni e frontiera della ricerca. ' +
      '9. Per verificare di aver capito: tre domande con la risposta. ' +
      'Alle domande successive (approfondimenti) rispondi direttamente, con lo stesso rigore, senza ripetere tutta la struttura. ' +
      'Rispondi in ' + (t('it', 'en') === 'it' ? 'italiano' : 'English') + '.';
  }

  /* ── lo schermo: testo strutturato + immagine dei grafici e delle scene 3D ── */
  function sezioneAperta() {
    var L = globale.BSISpectraLive, s = L && L.schermo ? L.schermo() : null;
    return s && s.sezione ? s : null;
  }
  function schermo() {
    var L = globale.BSISpectraLive, s = sezioneAperta(); if (!s) return null;
    var sez = D.getElementById(s.sezione), righe = [];
    righe.push('[SCHERMO DELL\'UTENTE] Materia: ' + s.materia + ' · sezione: ' + (s.titolo || s.sezione) + (s.scheda ? ' · scheda: ' + s.scheda : ''));
    if (s.controlli && s.controlli.length) righe.push('Controlli (valori attuali): ' + s.controlli.map(function (c) { return c.etichetta + ' = ' + c.valore + (c.min !== undefined && c.min !== '' ? ' [' + c.min + '…' + c.max + ']' : ''); }).join('; '));
    /* le tabelle visibili (picchi, misure, risultati) per intero, fino a un limite ragionevole */
    var tab = sez ? [].filter.call(sez.querySelectorAll('table'), function (x) { return x.offsetParent !== null; }).slice(0, 4) : [];
    tab.forEach(function (x, i) { var r = [].map.call(x.querySelectorAll('tr'), function (tr) { return [].map.call(tr.children, function (c) { return c.textContent.replace(/\s+/g, ' ').trim(); }).join(' | '); }).slice(0, 40); if (r.length) righe.push('Tabella ' + (i + 1) + ':\n' + r.join('\n')); });
    if (s.testo) righe.push('Testo visibile: ' + s.testo.slice(0, 1400));
    var tele = sez ? [].filter.call(sez.querySelectorAll('canvas'), function (c) { return c.offsetParent !== null && c.width > 40 && c.height > 40 && !c.closest('.bsiSF'); }).length : 0;
    /* i grafici vettoriali (SVG: molti spettri e diagrammi) contano come grafici */
    var vett = sez ? [].filter.call(sez.querySelectorAll('svg'), function (v) { var r = v.getBoundingClientRect(); return r.width > 150 && r.height > 80 && !v.closest('.bsiSF, button'); }).slice(0, 3) : [];
    righe.push('Grafici e scene 3D visibili: ' + (tele + vett.length) + (vett.length ? ' (di cui ' + vett.length + ' vettoriali)' : ''));
    var cv = null;
    if (L && L.cattura) { try { cv = L.cattura(); } catch (e) { cv = null; } }
    return { testo: righe.join('\n'), tela: cv && cv.width > 40 ? cv : null, svg: vett, titolo: s.titolo || s.sezione, materia: s.materia, grafici: tele + vett.length };
  }
  /* l'immagine per il modello: le tele (grafici, scene 3D ridisegnate) e gli SVG trasformati in immagine, uno sotto l'altro */
  function svgInImmagine(v) {
    return new Promise(function (ok) {
      try {
        var r = v.getBoundingClientRect(), c = v.cloneNode(true); c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.setAttribute('width', Math.round(r.width)); c.setAttribute('height', Math.round(r.height));
        var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(c)), im = new Image();
        im.onload = function () { ok({ im: im, w: Math.round(r.width), h: Math.round(r.height) }); }; im.onerror = function () { ok(null); }; im.src = url;
        setTimeout(function () { ok(null); }, 2500);
      } catch (e) { ok(null); }
    });
  }
  function immagineSchermo(S) {
    if (!S) return Promise.resolve(null);
    return Promise.all(S.svg.map(svgInImmagine)).then(function (vv) {
      var pezzi = []; if (S.tela) pezzi.push({ im: S.tela, w: S.tela.width, h: S.tela.height });
      vv.forEach(function (x) { if (x) pezzi.push(x); });
      if (!pezzi.length) return null;
      var W = Math.min(1400, Math.max.apply(null, pezzi.map(function (p) { return p.w; }))), H = 0;
      pezzi.forEach(function (p) { p.k = Math.min(1, W / p.w); H += Math.round(p.h * p.k); });
      var out = D.createElement('canvas'); out.width = W; out.height = Math.min(H, 2400); var q = out.getContext('2d'); q.fillStyle = '#081522'; q.fillRect(0, 0, out.width, out.height);
      var y = 0; pezzi.forEach(function (p) { try { q.drawImage(p.im, 0, y, Math.round(p.w * p.k), Math.round(p.h * p.k)); } catch (e) {} y += Math.round(p.h * p.k); });
      try { return out.toDataURL('image/jpeg', 0.86); } catch (e) { return null; }
    });
  }

  /* ── il modello: lo stesso fornitore e la stessa chiave della chat ── */
  function modello() { var L = globale.bsiLLM; if (!L || !globale.bsiStreamChat) return null; var p = L.provider(), k = p ? L.chiave(p) : null; return p && k ? { p: p, k: k } : null; }

  var ST = { storia: [], livello: 3, materia: null, pan: null, inCorso: false };

  /* ── l'interfaccia ── */
  var CSS = '#bsiSP{display:flex;flex-direction:column;gap:10px;padding:12px 14px;overflow-y:auto;box-sizing:border-box}' +
    '#bsiSP .carta{background:rgba(13,27,46,.72);border:1px solid #1a3550;border-radius:12px;padding:12px 14px;color:#dbe7f6;font:400 14.5px/1.6 system-ui}' +
    '#bsiSP .carta h3{margin:0 0 6px;color:#5eead4;font:700 15px system-ui}#bsiSP .nota{color:#9fb6dd;font:500 13px/1.45 system-ui}' +
    '#bsiSP textarea,#bsiSP select{background:#0d1b2e;border:1px solid #1a3550;border-radius:10px;color:#e9eef6;padding:9px 11px;font:500 14.5px/1.45 system-ui}' +
    '#bsiSP textarea{width:100%;box-sizing:border-box;min-height:64px;resize:vertical}' +
    '#bsiSP .riga{display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
    '#bsiSP .bt{background:linear-gradient(135deg,#2f6bff,#00c9b7);color:#fff;border:0;border-radius:10px;padding:9px 16px;font:800 14px system-ui;cursor:pointer;min-height:40px}' +
    '#bsiSP .bt[disabled]{opacity:.6;cursor:wait}#bsiSP .bt2{background:rgba(16,32,64,.85);border:1px solid #2a4a70;color:#cfe2ff;border-radius:999px;padding:7px 12px;font:600 12.5px system-ui;cursor:pointer;min-height:34px}' +
    '#bsiSP .schermo{display:flex;gap:10px;align-items:center}#bsiSP .schermo img{width:96px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #2a4a70;background:#081522}' +
    '#bsiSP .risposta h2,#bsiSP .risposta .bsi-md-h{font:800 15.5px system-ui;color:#6bcfff;margin:14px 0 6px}#bsiSP .risposta table{border-collapse:collapse;margin:6px 0}#bsiSP .risposta td,#bsiSP .risposta th{border:1px solid #1a3550;padding:4px 8px}' +
    '#bsiSP .domanda{color:#9fb1c6;font:600 13px system-ui;margin-bottom:4px}';

  function costruisci(pan) {
    if (!pan) return; ST.pan = pan;
    if (!D.getElementById('bsiSP-stile')) { var s = D.createElement('style'); s.id = 'bsiSP-stile'; s.textContent = CSS; D.head.appendChild(s); }
    pan.innerHTML = '';
    var w = D.createElement('div'); w.id = 'bsiSP'; pan.appendChild(w);
    w.innerHTML = '<div class="carta"><h3>🧠 ' + t('Spectra spiega tutto', 'Spectra explains everything') + '</h3><div class="nota">' +
      t('Chimica, fisica e matematica, dalle superiori al PhD avanzato: una spiegazione completa ed esaustiva, con la derivazione, i numeri, i collegamenti e la frontiera della ricerca. Può leggere ciò che hai sullo schermo: spettri, grafici e scene 3D.', 'Chemistry, physics and mathematics, from high school to advanced PhD: a complete, exhaustive explanation with derivation, numbers, connections and the research frontier. It can read what is on your screen: spectra, graphs and 3D scenes.') + '</div></div>' +
      '<div class="carta schermo" id="bsiSP-schermo"></div>' +
      '<textarea id="bsiSP-q" aria-label="' + t('Che cosa vuoi capire', 'What do you want to understand') + '" placeholder="' + t('Che cosa vuoi capire? Es.: spiegami questo spettro ¹H-NMR; perché l\'orbitale 3d_z² ha quella forma; la trasformata di Fourier del grafico…', 'What do you want to understand? E.g.: explain this ¹H-NMR spectrum; why the 3d_z² orbital looks like that; the Fourier transform of the graph…') + '"></textarea>' +
      '<div class="riga" id="bsiSP-spunti"></div>' +
      '<div class="riga"><select id="bsiSP-liv" aria-label="' + t('Livello', 'Level') + '">' + LIVELLI.map(function (l, i) { return '<option value="' + i + '"' + (i === ST.livello ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="bt" id="bsiSP-via">🧠 ' + t('Spiega', 'Explain') + '</button>' +
      '<button type="button" class="bt2" id="bsiSP-nuova">↺ ' + t('Nuova spiegazione', 'New explanation') + '</button></div>' +
      '<div id="bsiSP-out" aria-live="polite"></div>';
    var sp = D.getElementById('bsiSP-spunti');
    SPUNTI.forEach(function (x) { var b = D.createElement('button'); b.type = 'button'; b.className = 'bt2'; b.textContent = x[0]; b.onclick = function () { D.getElementById('bsiSP-q').value = x[1]; D.getElementById('bsiSP-usa').checked = true; via(); }; sp.appendChild(b); });
    D.getElementById('bsiSP-via').onclick = via;
    D.getElementById('bsiSP-q').onkeydown = function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) via(); };
    D.getElementById('bsiSP-liv').onchange = function () { ST.livello = +this.value; };
    D.getElementById('bsiSP-nuova').onclick = function () { ST.storia = []; D.getElementById('bsiSP-out').innerHTML = ''; D.getElementById('bsiSP-q').value = ''; aggiornaSchermo(); D.getElementById('bsiSP-q').focus(); };
    aggiornaSchermo();
  }
  /* la carta dello schermo: che cosa e' aperto, con la miniatura; si aggiorna a ogni apertura della scheda */
  function aggiornaSchermo() {
    var box = D.getElementById('bsiSP-schermo'); if (!box) return;
    var s = sezioneAperta();
    if (!s) { box.innerHTML = '<div class="nota">📺 ' + t('Nessuna sezione aperta dietro la finestra: la spiegazione sarà sulla tua domanda. Per far spiegare uno spettro, un grafico o una scena 3D, apri prima la sezione.', 'No section open behind the window: the explanation will be on your question. To have a spectrum, graph or 3D scene explained, open the section first.') + '</div><input type="checkbox" id="bsiSP-usa" hidden>'; return; }
    var S = schermo();
    immagineSchermo(S).then(function (imm) { if (S) { S.immagine = imm; ST.ultimoSchermo = S; } disegnaCarta(box, S); });
  }
  function disegnaCarta(box, S) {
    box.innerHTML = (S && S.immagine ? '<img alt="' + t('I grafici e le scene 3D della sezione', 'The section\'s graphs and 3D scenes') + '" src="' + S.immagine + '">' : '') +
      '<label style="flex:1"><input type="checkbox" id="bsiSP-usa" checked> <b>📺 ' + t('Includi lo schermo', 'Include the screen') + '</b><br><span class="nota">' + esc(S ? S.titolo : '') + ' · ' + (S ? S.grafici : 0) + ' ' + t('grafici/scene 3D', 'graphs/3D scenes') + ' · ' + t('valori dei controlli, tabelle e testo', 'control values, tables and text') + (S && S.immagine ? '' : ' · ' + t('nessuna immagine', 'no image')) + '</span></label>';
  }

  function via() {
    var q = (D.getElementById('bsiSP-q') || {}).value; q = String(q || '').trim();
    var usa = D.getElementById('bsiSP-usa'), conSchermo = !!(usa && usa.checked);
    if (!q && conSchermo) q = SPUNTI[0][1];
    if (!q) { D.getElementById('bsiSP-q').focus(); return; }
    chiedi(q, { schermo: conSchermo, livello: +(D.getElementById('bsiSP-liv') || {}).value || ST.livello });
  }

  function chiedi(domanda, o) {
    o = o || {}; if (ST.inCorso) return Promise.resolve(null);
    if (!ST.pan || !D.getElementById('bsiSP-out')) { var p = D.getElementById('bsi-pane-spiega'); if (p) costruisci(p); }
    var out = D.getElementById('bsiSP-out'); if (!out) return Promise.resolve(null);
    var livello = o.livello == null ? ST.livello : o.livello; ST.livello = livello;
    var S = o.schermo ? schermo() : null; ST.materia = S ? S.materia : ST.materia;
    return immagineSchermo(S).then(function (imm) { if (S) S.immagine = imm; return chiediCon(domanda, S, livello, out); });
  }
  function chiediCon(domanda, S, livello, out) {
    var carta = D.createElement('div'); carta.className = 'carta risposta';
    carta.innerHTML = '<div class="domanda">🙋 ' + esc(domanda) + (S ? ' · 📺 ' + esc(S.titolo) : '') + ' · ' + LIVELLI[livello] + '</div><div class="md"></div>';
    out.insertBefore(carta, out.firstChild);
    var M = modello();
    if (!M) return Promise.resolve(senzaModello(carta, domanda, S));
    var bt = D.getElementById('bsiSP-via'); if (bt) bt.disabled = true;
    ST.inCorso = true; annuncia('bsi-spectra-stato', { stato: 'pensa' });
    var msg = { role: 'user', content: (S ? S.testo + '\n\n' : '') + 'DOMANDA: ' + domanda };
    if (S && S.immagine) msg.files = [{ kind: 'image', mime: 'image/jpeg', name: 'schermo.jpg', data: S.immagine.split(',')[1] }];
    ST.storia.push(msg);
    /* nella cronologia delle domande successive l'immagine non si rimanda: costerebbe a ogni turno senza aggiungere nulla */
    var storia = ST.storia.map(function (m, i) { return i === ST.storia.length - 1 ? m : { role: m.role, content: m.content }; }).slice(-10);
    var acc = '', corpo = carta.querySelector('.md');
    return globale.bsiStreamChat(M.p, M.k, storia, sistema(livello, ST.materia), { onToken: function (tok, full) { acc = full; corpo.innerHTML = md(acc); }, onDone: function () {} })
      .then(function () {
        ST.storia.push({ role: 'assistant', content: acc }); ST.inCorso = false; if (bt) bt.disabled = false;
        annuncia('bsi-spectra-risposta', { testo: acc });
        D.getElementById('bsiSP-q').value = ''; D.getElementById('bsiSP-q').placeholder = t('Approfondisci: «dimostra il passaggio 3», «e se raddoppio la temperatura?»…', 'Go deeper: «prove step 3», «what if I double the temperature?»…');
        return acc;
      })
      .catch(function (e) {
        ST.storia.pop(); ST.inCorso = false; if (bt) bt.disabled = false;
        corpo.innerHTML = '<p>⚠ ' + esc(e && e.message || e) + '</p>'; annuncia('bsi-spectra-risposta', { errore: true }); return null;
      });
  }

  /* senza modello: lo si dice, e si mostra cio' che l'app sa da sola */
  function senzaModello(carta, domanda, S) {
    var corpo = carta.querySelector('.md'), html = '<p><b>' + t('Per la spiegazione completa ed esaustiva serve un modello di intelligenza artificiale (scheda 💬 Chat → fornitore e chiave).', 'A complete, exhaustive explanation needs an AI model (💬 Chat tab → provider and key).') + '</b> ' + t('Intanto, ecco ciò che l\'app sa da sola:', 'Meanwhile, here is what the app knows on its own:') + '</p>';
    var A = globale.BSIAssistente, r = null;
    try { r = A && A.rispondi ? A.rispondi(domanda, S ? S.materia : null) : null; } catch (e) { r = null; }
    if (r && r.titolo && !r.errore) html += '<h2>🧠 ' + esc(r.titolo) + '</h2><p>' + t('L\'assistente locale ha riconosciuto l\'esercizio: lo svolgimento completo è nella sezione dell\'area (scheda Assistente).', 'The local assistant recognised the exercise: the full working is in the area section (Assistant tab).') + '</p>';
    var Lz = globale.BSILezione, sez = S && D.getElementById((sezioneAperta() || {}).sezione), lez = null;
    try { lez = Lz && sez ? Lz.costruisci(sez) : null; } catch (e) { lez = null; }
    if (lez && lez.passi) {
      html += '<h2>📚 ' + esc(S.titolo) + '</h2>';
      lez.passi.filter(function (p) { return p.testo; }).slice(0, 12).forEach(function (p) { html += '<p>' + (p.titolo ? '<b>' + esc(p.titolo) + '.</b> ' : '') + esc(p.testo) + '</p>'; });
    }
    if (S) html += '<h2>📺 ' + t('Sullo schermo', 'On screen') + '</h2><pre style="white-space:pre-wrap;font:12.5px ui-monospace,monospace;color:#9fe7ff">' + esc(S.testo) + '</pre>';
    corpo.innerHTML = html;
    annuncia('bsi-spectra-dice', { testo: t('Per spiegarti tutto mi serve un modello. Intanto ti mostro ciò che so di questa sezione.', 'To explain everything I need a model. Meanwhile here is what I know about this section.'), emo: 'dubbio' });
    return null;
  }

  globale.BSISpiega = { costruisci: costruisci, chiedi: chiedi, schermo: schermo, immagine: immagineSchermo, sistema: sistema, aggiornaSchermo: aggiornaSchermo, LIVELLI: LIVELLI, PROFONDITA: PROFONDITA,
    stato: function () { return { turni: ST.storia.length, livello: ST.livello, inCorso: ST.inCorso }; } };
})(typeof window !== 'undefined' ? window : this);
