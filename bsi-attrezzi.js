/* ═══════════════════════════════════════════════════════════════════════════
   bsi-attrezzi.js — gli strumenti al volo del menu ✨ per fisica e matematica
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE

   Il menu ✨ della chimica ha i suoi strumenti (sintesi, editor di molecole,
   costanti J…). Quando la materia e' la fisica o la matematica il menu deve
   cambiare con lei, e la regola del menu resta quella di sempre: una cosa che
   ha un pulsante nella barra NON sta anche nel menu. Quindi qui non ci sono
   sezioni, ci sono strumenti AL VOLO, in una finestra sopra la pagina, da
   usare senza perdere il punto in cui si stava studiando:

   · 🧮 calcolatrice (esatta: frazioni e radici restano tali, poi il decimale)
   · ∂ derivata e ∫ primitiva di una funzione, con il motore simbolico
   · 📈 grafico di una o piu' funzioni
   · 🔢 costante fisica (CODATA) e 🔁 convertitore di unita'
   · 📐 formula, 📖 glossario e ⚡ quiz lampo, presi dal kit di studio della
     materia

   I dati non sono scritti qui: vengono dal motore simbolico (BSIMatCAS), dal
   modulo delle risorse (BSIFisica.calcolo.unita) e dal kit di studio
   (BSIStudio). Se uno manca, lo strumento lo dice invece di fingere.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? en : it; }
  function tt(c) { return Array.isArray(c) ? t(c[0], c[1]) : c; }
  function esc(x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function cas() { return globale.BSIMatCAS; }
  function calcolo() { return (globale.BSIFisica && globale.BSIFisica.calcolo) || {}; }
  function studio(m) { return globale.BSIStudio && globale.BSIStudio.dati ? globale.BSIStudio.dati(m) : null; }
  function manca(cosa) { return '<div class="bsiAT-ko">' + t('Questo strumento usa ', 'This tool uses ') + esc(cosa) + t(', che non risulta caricato. Ricarica la pagina; se il problema resta, la sezione corrispondente nella barra funziona comunque.', ', which is not loaded. Reload the page; if it persists, the matching section in the bar still works.') + '</div>'; }

  /* ── i calcoli, puri (il banco li prova in node) ─────────────────────── */
  function calcola(testo) {
    var C = cas(); if (!C) return { errore: 'BSIMatCAS' };
    try {
      var e = C.leggi(String(testo).replace(/,/g, '.')), s = C.semplifica(e), v = C.valuta(e, {});
      return { esatto: C.stampa(s), html: C.html(s), valore: v };
    } catch (err) { return { errore: String(err && err.message || err) }; }
  }
  function derivaTesto(testo, x) {
    var C = cas(); if (!C) return { errore: 'BSIMatCAS' };
    try { var e = C.leggi(testo), d = C.semplifica(C.deriva(e, x || 'x')); return { testo: C.stampa(d), html: C.html(d) }; }
    catch (err) { return { errore: String(err && err.message || err) }; }
  }
  function integraTesto(testo, x) {
    var C = cas(); if (!C) return { errore: 'BSIMatCAS' };
    try {
      var e = C.leggi(testo), p = C.integra(e, x || 'x');
      if (!p) return { nessuna: true };
      p = C.semplifica(p);
      return { testo: C.stampa(p), html: C.html(p) };
    } catch (err) { return { errore: String(err && err.message || err) }; }
  }
  function campioni(testo, a, b, n) {
    var C = cas(); if (!C) return null;
    var f = C.funzione(C.leggi(testo), 'x'), xs = [], ys = [];
    for (var i = 0; i <= n; i++) { var x = a + (b - a) * i / n, y; try { y = f(x); } catch (e) { y = NaN; } xs.push(x); ys.push(isFinite(y) ? y : NaN); }
    return { x: xs, y: ys };
  }
  function norm(s) { return String(s || '').toLowerCase().normalize ? String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : String(s || '').toLowerCase(); }
  function cerca(lista, q, campi) {
    q = norm(String(q || '').trim());
    if (!q) return lista.slice(0, 40);
    var parole = q.split(/\s+/);
    return lista.filter(function (v) { var s = norm(campi.map(function (c) { return tt(v[c]) || ''; }).join(' ')); return parole.every(function (p) { return s.indexOf(p) >= 0; }); }).slice(0, 60);
  }
  function quizLampo(m, n, seme) {
    var D = studio(m); if (!D || !D.quiz || !D.quiz.length) return null;
    var r = mulberry32(seme || 1), idx = D.quiz.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp; }
    return idx.slice(0, n || 5).map(function (i) { return D.quiz[i]; });
  }

  /* ── la finestra ─────────────────────────────────────────────────────── */
  function stile() {
    if (document.getElementById('bsiAT-stile')) return;
    var s = document.createElement('style'); s.id = 'bsiAT-stile';
    s.textContent = [
      '#bsiAT{position:fixed;inset:0;z-index:2147483641;display:none;align-items:center;justify-content:center;background:rgba(2,8,18,.78);backdrop-filter:blur(8px)}',
      '#bsiAT.aperto{display:flex}',
      '#bsiAT-p{width:min(640px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;background:#0a1628;border:1px solid var(--c,#5eead4);border-radius:16px;padding:16px 18px;box-shadow:0 20px 60px rgba(0,0,0,.6);box-sizing:border-box}',
      '#bsiAT-h{display:flex;align-items:center;gap:10px;margin-bottom:10px}#bsiAT-h b{flex:1;font-size:16px;color:var(--c,#5eead4)}',
      '#bsiAT-x{background:none;border:1px solid #2a3f5c;color:#c9d3df;border-radius:9px;padding:4px 10px;cursor:pointer;font-size:15px}',
      '#bsiAT input,#bsiAT select{width:100%;box-sizing:border-box;padding:9px 12px;background:#0f2040;border:1px solid #34465f;color:#e8f4ff;border-radius:9px;font-size:14px;margin:4px 0}',
      '.bsiAT-r{display:flex;gap:8px;flex-wrap:wrap}.bsiAT-r>*{flex:1;min-width:120px}',
      '.bsiAT-b{background:#0f2a3a;border:1px solid var(--c,#5eead4);color:#e6fffb;border-radius:9px;padding:8px 12px;cursor:pointer;font-weight:700;font-size:13px}',
      '.bsiAT-out{background:#081c2c;border-left:3px solid var(--c,#5eead4);border-radius:0 9px 9px 0;padding:10px 12px;margin:10px 0;color:#dff3ff;font-size:14px;line-height:1.6;word-break:break-word}',
      '.bsiAT-it{border-bottom:1px solid #16273e;padding:8px 2px;color:#cfe2f5;font-size:13px;line-height:1.5}.bsiAT-it b{color:#e8f4ff}',
      '.bsiAT-f{font:600 15px/1.5 "Cambria Math","STIX Two Math",serif;color:#ffd9a0}',
      '.bsiAT-ko{background:#2b1218;border:1px solid #6d2736;border-radius:9px;padding:10px 12px;color:#ffc9d2;font-size:13px;margin:8px 0}',
      '.bsiAT-op{display:block;width:100%;text-align:left;margin:5px 0;background:#0f1e2e;border:1px solid #1a3550;color:#cfe2f5;border-radius:9px;padding:8px 10px;cursor:pointer;font-size:13px}',
      '.bsiAT-op.si{border-color:#5eead4;background:#0d2a26}.bsiAT-op.no{border-color:#ff8a80;background:#2b1218}',
      '.bsiAT-nota{font-size:11.5px;color:#8aadcc;margin-top:6px;line-height:1.5}'
    ].join('');
    document.head.appendChild(s);
  }
  function finestra(titolo, colore) {
    stile();
    var ov = document.getElementById('bsiAT');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'bsiAT'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      ov.innerHTML = '<div id="bsiAT-p"><div id="bsiAT-h"><b id="bsiAT-t"></b><button id="bsiAT-x" type="button">✕</button></div><div id="bsiAT-c"></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) chiudi(); });
      document.getElementById('bsiAT-x').onclick = chiudi;
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('aperto')) chiudi(); });
    }
    document.getElementById('bsiAT-x').setAttribute('aria-label', t('Chiudi', 'Close'));
    ov.style.setProperty('--c', colore || '#5eead4');
    document.getElementById('bsiAT-t').textContent = titolo;
    ov.setAttribute('aria-label', titolo);
    ov.classList.add('aperto');
    return document.getElementById('bsiAT-c');
  }
  function chiudi() { var ov = document.getElementById('bsiAT'); if (ov) ov.classList.remove('aperto'); }

  /* ── gli strumenti ───────────────────────────────────────────────────── */
  var STRUMENTI = {
    calcolatrice: { ic: '🧮', nm: ['Calcolatrice esatta', 'Exact calculator'], ds: ['frazioni e radici restano esatte, poi il valore decimale', 'fractions and roots stay exact, then the decimal value'],
      apri: function (c) {
        c.innerHTML = '<input id="bsiAT-in" aria-label="' + t('espressione', 'expression') + '" placeholder="2/3 + sqrt(8) · sin(pi/6) …" autocomplete="off" spellcheck="false"><div id="bsiAT-o" class="bsiAT-out" aria-live="polite"></div><div class="bsiAT-nota">' + t('Funzioni: sqrt, sin, cos, tan, asin, acos, atan, exp, ln, log, abs; costanti pi ed e; potenze con ^. Il calcolo è esatto finché può, poi decimale.', 'Functions: sqrt, sin, cos, tan, asin, acos, atan, exp, ln, log, abs; constants pi and e; powers with ^. Exact while possible, then decimal.') + '</div>';
        var i = document.getElementById('bsiAT-in'), o = document.getElementById('bsiAT-o');
        function aggiorna() { if (!cas()) { o.innerHTML = manca(t('il motore simbolico', 'the symbolic engine')); return; } if (!i.value.trim()) { o.textContent = t('Scrivi un’espressione.', 'Type an expression.'); return; } var r = calcola(i.value); o.innerHTML = r.errore ? esc(t('Non riesco a leggerla: ', 'I cannot read it: ') + r.errore) : '<span class="bsiAT-f">' + r.html + '</span><br>≈ <b>' + (isFinite(r.valore) ? Number(r.valore.toPrecision(12)) : '—') + '</b>'; }
        i.oninput = aggiorna; aggiorna(); i.focus();
      } },
    derivata: { ic: '∂', nm: ['Derivata e primitiva', 'Derivative and antiderivative'], ds: ['con il motore simbolico, controllata derivando', 'with the symbolic engine, checked by differentiating'],
      apri: function (c) {
        c.innerHTML = '<div class="bsiAT-r"><input id="bsiAT-in" aria-label="f(x)" placeholder="x^2·sin(x)" autocomplete="off" spellcheck="false"><input id="bsiAT-v" aria-label="' + t('variabile', 'variable') + '" value="x" style="max-width:90px"></div><div id="bsiAT-o" class="bsiAT-out" aria-live="polite"></div><div class="bsiAT-nota">' + t('La primitiva compare solo se, derivandola, si riottiene la funzione: altrimenti lo strumento lo dice.', 'The antiderivative appears only if differentiating it gives back the function: otherwise the tool says so.') + '</div>';
        var i = document.getElementById('bsiAT-in'), v = document.getElementById('bsiAT-v'), o = document.getElementById('bsiAT-o');
        function aggiorna() {
          if (!cas()) { o.innerHTML = manca(t('il motore simbolico', 'the symbolic engine')); return; }
          if (!i.value.trim()) { o.textContent = t('Scrivi una funzione.', 'Type a function.'); return; }
          var d = derivaTesto(i.value, v.value || 'x'), p = integraTesto(i.value, v.value || 'x');
          o.innerHTML = (d.errore ? esc(t('Non riesco a leggerla: ', 'I cannot read it: ') + d.errore) : 'd/d' + esc(v.value) + ' = <span class="bsiAT-f">' + d.html + '</span>') + '<br>' +
            (p.errore ? '' : p.nessuna ? t('Primitiva: non trovata con le regole elementari (non vuol dire che non esista).', 'Antiderivative: not found with elementary rules (it does not mean none exists).') : '∫ d' + esc(v.value) + ' = <span class="bsiAT-f">' + p.html + '</span> + C');
        }
        i.oninput = aggiorna; v.oninput = aggiorna; aggiorna(); i.focus();
      } },
    grafico: { ic: '📈', nm: ['Grafico al volo', 'Quick plot'], ds: ['una o più funzioni separate da ;', 'one or more functions separated by ;'],
      apri: function (c) {
        c.innerHTML = '<input id="bsiAT-in" aria-label="f(x)" value="sin(x); x^2/10" autocomplete="off" spellcheck="false"><div class="bsiAT-r"><input id="bsiAT-a" aria-label="x min" value="-6"><input id="bsiAT-b" aria-label="x max" value="6"></div><div id="bsiAT-g"></div><div id="bsiAT-o" class="bsiAT-nota" aria-live="polite"></div>';
        var F = globale.BSIFisica, g = document.getElementById('bsiAT-g'), o = document.getElementById('bsiAT-o');
        if (!F || !cas()) { g.innerHTML = manca(t('il motore dei grafici', 'the plotting engine')); return; }
        var cv = F.tela(g, 0.62), COL = ['#5eead4', '#ffc45a', '#ff8a80', '#9d8cff', '#6bcfff'];
        function disegna() {
          var a = parseFloat(document.getElementById('bsiAT-a').value), b = parseFloat(document.getElementById('bsiAT-b').value);
          if (!(b > a)) { o.textContent = t('Serve x max > x min.', 'x max must exceed x min.'); return; }
          var serie = [], err = [];
          document.getElementById('bsiAT-in').value.split(';').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 5).forEach(function (s, k) {
            try { var p = campioni(s, a, b, 600); serie.push({ x: p.x, y: p.y, col: COL[k], larg: 2.2, etich: s }); } catch (e) { err.push(s); }
          });
          var fin = []; serie.forEach(function (s) { s.y.forEach(function (y) { if (isFinite(y)) fin.push(y); }); });
          fin.sort(function (p, q) { return p - q; });
          var lo = fin.length ? fin[Math.floor(fin.length * 0.02)] : -1, hi = fin.length ? fin[Math.ceil(fin.length * 0.98) - 1] : 1; if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
          var pad = (hi - lo) * 0.1;
          F.grafico(cv, { serie: serie, xmin: a, xmax: b, ymin: lo - pad, ymax: hi + pad, xl: ['x', 'x'], yl: ['y', 'y'], descr: ['grafico al volo', 'quick plot'], legenda: serie.map(function (s) { return { col: s.col, etich: [s.etich, s.etich] }; }) });
          o.textContent = err.length ? t('Non leggo: ', 'Cannot read: ') + err.join(', ') : t('Trascina sul grafico per leggere i valori.', 'Drag over the plot to read values.');
        }
        ['bsiAT-in', 'bsiAT-a', 'bsiAT-b'].forEach(function (id) { document.getElementById(id).oninput = disegna; });
        setTimeout(disegna, 30);
      } },
    costante: { ic: '🔢', nm: ['Costante fisica', 'Physical constant'], ds: ['valori CODATA, con incertezza', 'CODATA values, with uncertainty'],
      apri: function (c) {
        var U = calcolo().unita;
        if (!U || !U.COSTANTI) { c.innerHTML = manca(t('la tabella delle costanti', 'the constants table')); return; }
        c.innerHTML = '<input id="bsiAT-in" aria-label="' + t('cerca una costante', 'search a constant') + '" placeholder="' + t('Planck, Boltzmann, elettrone…', 'Planck, Boltzmann, electron…') + '" autocomplete="off"><div id="bsiAT-o" aria-live="polite"></div>';
        var i = document.getElementById('bsiAT-in'), o = document.getElementById('bsiAT-o');
        function aggiorna() { o.innerHTML = cerca(U.COSTANTI, i.value, ['nm', 'simbolo', 'k']).map(function (k) { return '<div class="bsiAT-it"><b>' + esc(k.simbolo || k.k) + '</b> — ' + esc(tt(k.nm)) + '<br><span class="bsiAT-f">' + esc(String(k.valore)) + '</span> ' + esc(k.unita || '') + (k.esatta ? ' · <i>' + t('esatta', 'exact') + '</i>' : k.incertezza ? ' · ±' + esc(String(k.incertezza)) : '') + '</div>'; }).join('') || '<div class="bsiAT-nota">' + t('Nessuna costante trovata.', 'No constant found.') + '</div>'; }
        i.oninput = aggiorna; aggiorna(); i.focus();
      } },
    unita: { ic: '🔁', nm: ['Convertitore di unità', 'Unit converter'], ds: ['energia, pressione, lunghezza, temperatura…', 'energy, pressure, length, temperature…'],
      apri: function (c) {
        var U = calcolo().unita;
        if (!U || !U.GRANDEZZE || !U.converti) { c.innerHTML = manca(t('il convertitore di unità', 'the unit converter')); return; }
        var chiavi = Object.keys(U.GRANDEZZE);
        c.innerHTML = '<select id="bsiAT-g" aria-label="' + t('grandezza', 'quantity') + '">' + chiavi.map(function (k) { return '<option value="' + esc(k) + '">' + esc(tt(U.GRANDEZZE[k].nm)) + '</option>'; }).join('') + '</select><div class="bsiAT-r"><input id="bsiAT-v" aria-label="' + t('valore', 'value') + '" value="1"><select id="bsiAT-da" aria-label="' + t('da', 'from') + '"></select><select id="bsiAT-a" aria-label="' + t('a', 'to') + '"></select></div><div id="bsiAT-o" class="bsiAT-out" aria-live="polite"></div>';
        var g = document.getElementById('bsiAT-g'), v = document.getElementById('bsiAT-v'), da = document.getElementById('bsiAT-da'), a = document.getElementById('bsiAT-a'), o = document.getElementById('bsiAT-o');
        function riempi() { var L = U.GRANDEZZE[g.value].unita, h = L.map(function (u) { return '<option value="' + esc(u.k) + '">' + esc(u.k) + (u.nm ? ' — ' + esc(tt(u.nm)) : '') + '</option>'; }).join(''); da.innerHTML = h; a.innerHTML = h; if (L.length > 1) a.selectedIndex = 1; conta(); }
        function conta() { var x = parseFloat(String(v.value).replace(',', '.')); if (!isFinite(x)) { o.textContent = t('Scrivi un numero.', 'Type a number.'); return; } try { var r = U.converti(x, da.value, a.value); o.innerHTML = esc(x) + ' ' + esc(da.value) + ' = <b>' + Number(r.toPrecision(10)) + '</b> ' + esc(a.value); } catch (e) { o.textContent = String(e && e.message || e); } }
        g.onchange = riempi; v.oninput = conta; da.onchange = conta; a.onchange = conta; riempi();
      } },
    formula: { ic: '📐', nm: ['Formula al volo', 'Quick formula'], ds: ['dal formulario della materia', 'from the subject’s formula sheet'],
      apri: function (c, m) {
        var D = studio(m), T = calcolo().tavole, L = [];
        if (D && D.formule) L = L.concat(D.formule.map(function (f) { return { nm: f.nm, f: f.f, note: f.note }; }));
        if (m === 'matematica' && T) ['DERIVATE', 'INTEGRALI', 'SERIE', 'LAPLACE'].forEach(function (k) { (T[k] || []).forEach(function (e) { L.push({ nm: e.nm || k.toLowerCase(), f: e.f, note: e.nota || e.note }); }); });
        if (!L.length) { c.innerHTML = manca(t('il formulario', 'the formula sheet')); return; }
        c.innerHTML = '<input id="bsiAT-in" aria-label="' + t('cerca una formula', 'search a formula') + '" placeholder="' + t('cerca per nome o simbolo…', 'search by name or symbol…') + '" autocomplete="off"><div class="bsiAT-nota">' + L.length + t(' formule disponibili', ' formulas available') + '</div><div id="bsiAT-o" aria-live="polite"></div>';
        var i = document.getElementById('bsiAT-in'), o = document.getElementById('bsiAT-o');
        function aggiorna() { o.innerHTML = cerca(L, i.value, ['nm', 'f', 'note']).map(function (f) { return '<div class="bsiAT-it"><b>' + esc(tt(f.nm)) + '</b><br><span class="bsiAT-f">' + esc(f.f) + '</span>' + (f.note ? '<br><span class="bsiAT-nota">' + esc(f.note) + '</span>' : '') + '</div>'; }).join('') || '<div class="bsiAT-nota">' + t('Nessuna formula trovata.', 'No formula found.') + '</div>'; }
        i.oninput = aggiorna; aggiorna(); i.focus();
      } },
    glossario: { ic: '📖', nm: ['Glossario al volo', 'Quick glossary'], ds: ['definizioni della materia', 'definitions for the subject'],
      apri: function (c, m) {
        var D = studio(m);
        if (!D || !D.glossario) { c.innerHTML = manca(t('il glossario', 'the glossary')); return; }
        c.innerHTML = '<input id="bsiAT-in" aria-label="' + t('cerca un termine', 'search a term') + '" placeholder="' + t('cerca un termine…', 'search a term…') + '" autocomplete="off"><div id="bsiAT-o" aria-live="polite"></div>';
        var i = document.getElementById('bsiAT-in'), o = document.getElementById('bsiAT-o');
        function aggiorna() { o.innerHTML = cerca(D.glossario, i.value, ['t', 'd']).map(function (g) { return '<div class="bsiAT-it"><b>' + esc(g.t) + '</b> — ' + esc(g.d) + '</div>'; }).join('') || '<div class="bsiAT-nota">' + t('Nessun termine trovato.', 'No term found.') + '</div>'; }
        i.oninput = aggiorna; aggiorna(); i.focus();
      } },
    quiz: { ic: '⚡', nm: ['Quiz lampo', 'Flash quiz'], ds: ['cinque domande a caso, subito', 'five random questions, right now'],
      apri: function (c, m) {
        var Q = quizLampo(m, 5, (Date.now() % 100000) + 7);
        if (!Q) { c.innerHTML = manca(t('le domande del quiz', 'the quiz questions')); return; }
        var k = 0, giuste = 0;
        function mostra() {
          if (k >= Q.length) { c.innerHTML = '<div class="bsiAT-out">' + t('Risultato: ', 'Score: ') + '<b>' + giuste + ' / ' + Q.length + '</b></div><button class="bsiAT-b" type="button" id="bsiAT-ancora">' + t('Altre cinque', 'Five more') + '</button>'; document.getElementById('bsiAT-ancora').onclick = function () { STRUMENTI.quiz.apri(c, m); }; return; }
          var q = Q[k];
          c.innerHTML = '<div class="bsiAT-nota">' + (k + 1) + ' / ' + Q.length + '</div><div class="bsiAT-it"><b>' + esc(q.d) + '</b></div>' + q.r.map(function (r, i) { return '<button type="button" class="bsiAT-op" data-i="' + i + '">' + String.fromCharCode(65 + i) + ') ' + esc(r) + '</button>'; }).join('') + '<div id="bsiAT-o" aria-live="polite"></div>';
          [].forEach.call(c.querySelectorAll('.bsiAT-op'), function (b) {
            b.onclick = function () {
              if (c.querySelector('.bsiAT-op.si')) return;
              var i = +b.getAttribute('data-i'); if (i === q.k) giuste++;
              c.querySelector('.bsiAT-op[data-i="' + q.k + '"]').classList.add('si'); if (i !== q.k) b.classList.add('no');
              document.getElementById('bsiAT-o').innerHTML = '<div class="bsiAT-out">' + esc(q.sp) + '</div><button class="bsiAT-b" type="button" id="bsiAT-avanti">' + t('Avanti', 'Next') + '</button>';
              document.getElementById('bsiAT-avanti').onclick = function () { k++; mostra(); };
            };
          });
        }
        mostra();
      } }
  };
  /* quali strumenti per quale materia, nell'ordine del menu */
  var PER_MATERIA = {
    fisica: ['costante', 'unita', 'calcolatrice', 'formula', 'grafico', 'glossario', 'quiz', 'derivata'],
    matematica: ['calcolatrice', 'derivata', 'grafico', 'formula', 'glossario', 'quiz', 'unita'],
    chimica: []
  };
  function apri(chiave, materia) {
    var S = STRUMENTI[chiave]; if (!S) return false;
    var M = globale.BSIMaterie && globale.BSIMaterie.MATERIE && globale.BSIMaterie.MATERIE[materia];
    var c = finestra(S.ic + ' ' + tt(S.nm), M ? M.col : null);
    S.apri(c, materia || 'fisica');
    return true;
  }

  globale.BSIAttrezzi = {
    STRUMENTI: STRUMENTI, PER_MATERIA: PER_MATERIA, apri: apri, chiudi: chiudi,
    calcolo: { calcola: calcola, derivaTesto: derivaTesto, integraTesto: integraTesto, campioni: campioni, cerca: cerca, quizLampo: quizLampo },
    versione: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
