/* ════════════════════════════════════════════════════════════════════════
   BioSpecInfo · bsi-spectra-lezione-ai.js  (v240)
   © Samuele Pio Provenzano

   LA MODALITA' LEZIONE DELL'AI (lo stile «every-joule» chiesto dall'autore).
   Nella finestra di Spectra (scheda «⚡ Lezione», accanto a Chat, Esame Orale,
   Ripassa Oggi e Genera Guida) Spectra insegna QUALUNQUE argomento di chimica,
   fisica o matematica, al livello scelto, in quattro tempi:

     1. PREDICI   — mette in scena il fenomeno e chiede che cosa succedera': quattro
                    risposte, fra cui le idee sbagliate piu' comuni. Tu scegli.
     2. PROVA     — che cosa succede davvero, con i numeri (e, nelle lezioni del
                    laboratorio, un cursore da muovere: il risultato si ricalcola).
     3. DIMOSTRA  — la derivazione rigorosa, passo per passo.
     4. RIVELA    — perche' la risposta giusta e' giusta e la tua (se diversa) no;
                    i collegamenti fra discipline; quattro esercizi (superiori,
                    triennale, magistrale, ricerca) con la soluzione da aprire.

   Con un fornitore di IA configurato, ogni fase la scrive il modello (la prima in
   JSON controllato: domanda, opzioni, indice della giusta). Senza chiave, o se
   il modello non risponde in forma valida, ci sono le lezioni del laboratorio
   (la caduta, la forma dell'acqua, il problema di Basilea), calcolate qui.
   Spectra col corpo (bsi-spectra-figura.js) la conduce: la figura si sposta
   nella scheda, pensa mentre il modello scrive, spiega, si stupisce se la
   previsione era sbagliata (con garbo), gioisce se era giusta.
   Memoria: bsi-spectra-lezioni-ai-v1 (argomenti, previsioni giuste/sbagliate).

   API: BSILezioneAI.costruisci(pannello), BSILezioneAI.avvia({ argomento,
        materia, livello } | { locale: 'caduta' }), BSILezioneAI.stato()
   ════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var D = globale.document;
  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() !== 'it') ? en : it; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function md(s) { return globale.bsiMarkdownToHtml ? globale.bsiMarkdownToHtml(String(s || '')) : '<p>' + esc(s).replace(/\n/g, '<br>') + '</p>'; }
  function annuncia(tipo, d) { try { D.dispatchEvent(new CustomEvent(tipo, { detail: d })); } catch (e) {} }

  var FASI = [t('Predici', 'Predict'), t('Prova', 'Test'), t('Dimostra', 'Prove'), t('Rivela', 'Reveal')];
  var LIVELLI = [t('Scuola superiore', 'High school'), t('Triennale', 'Bachelor'), t('Magistrale', 'Master'), t('Ricerca', 'Research')];
  var MEM = 'bsi-spectra-lezioni-ai-v1';
  function memoria() { try { return JSON.parse(localStorage.getItem(MEM) || '{}'); } catch (e) { return {}; } }
  function ricorda(chiave, giusta) { try { var m = memoria(); var x = m[chiave] || (m[chiave] = { giuste: 0, sbagliate: 0, quando: 0 }); if (giusta) x.giuste++; else x.sbagliate++; x.quando = Date.now(); localStorage.setItem(MEM, JSON.stringify(m)); } catch (e) {} }

  var ST = { fase: -1, lez: null, scelta: null, storia: [], pan: null, locale: false, attesa: false };

  /* ── il modello (lo stesso fornitore e la stessa chiave della chat) ── */
  function modello() {
    var L = globale.bsiLLM; if (!L || !globale.bsiStreamChat) return null;
    var p = L.provider(), k = p ? L.chiave(p) : null; return p && k ? { p: p, k: k } : null;
  }
  function sistema(lez) {
    return 'Sei Spectra, mentore di ' + lez.materia + ' per uno studente di livello «' + LIVELLI[lez.livello] + '». ' +
      'Insegni con il metodo PREDICI → PROVA → DIMOSTRA → RIVELA: prima lo studente prevede, poi vede che cosa succede davvero ' +
      'con i numeri, poi la derivazione rigorosa, infine il perché e i collegamenti. Rigore scientifico assoluto: niente numeri ' +
      'inventati, unità di misura sempre, cita le assunzioni. Rispondi in ' + (t('it', 'en') === 'it' ? 'italiano' : 'English') + '. ' +
      'Argomento della lezione: ' + lez.argomento + '.';
  }
  function chiedi(testo, suToken) {
    var M = modello(); if (!M) return Promise.reject(new Error('nessun fornitore'));
    ST.storia.push({ role: 'user', content: testo });
    var acc = '';
    return globale.bsiStreamChat(M.p, M.k, ST.storia.slice(-12), sistema(ST.lez), { onToken: function (tok, full) { acc = full; if (suToken) suToken(full); }, onDone: function () {} })
      .then(function () { ST.storia.push({ role: 'assistant', content: acc }); return acc; })
      .catch(function (e) { ST.storia.push({ role: 'assistant', content: '(errore)' }); throw e; });
  }
  /* il JSON della prima fase: si prende il primo oggetto {…} e si controlla la forma */
  function leggiPredici(s) {
    var i = s.indexOf('{'), j = s.lastIndexOf('}'); if (i < 0 || j <= i) return null;
    try {
      var o = JSON.parse(s.slice(i, j + 1));
      if (!o || typeof o.domanda !== 'string' || !Array.isArray(o.opzioni) || o.opzioni.length < 3 || o.opzioni.length > 5) return null;
      var g = +o.giusta; if (!(g >= 0 && g < o.opzioni.length)) return null;
      return { titolo: String(o.titolo || ST.lez.argomento), scena: String(o.scena || ''), domanda: o.domanda, opzioni: o.opzioni.map(function (x, k) { return { testo: String(typeof x === 'string' ? x : x.testo || ''), giusta: k === g, perche: (o.perche && o.perche[k]) || '' }; }) };
    } catch (e) { return null; }
  }

  /* ── le lezioni del laboratorio, offline, con un cursore nella prova ── */
  function locali() { return globale.BSIStudioLezioni ? globale.BSIStudioLezioni.LEZIONI : []; }
  function caricaLocali() {
    if (globale.BSIStudioLezioni) return Promise.resolve();
    return new Promise(function (ok) { var s = D.createElement('script'); s.src = './bsi-spectra-studio-lezioni.js'; s.onload = function () { ok(); }; s.onerror = function () { ok(); }; D.head.appendChild(s); });
  }
  function f(n, d) { return Number(n).toFixed(d).replace('.', ','); }
  var PROVE = {
    caduta: { etichetta: t('velocità di lancio v₀ (m/s)', 'launch speed v₀ (m/s)'), min: 0, max: 20, passo: 1, val: 6,
      calcola: function (v) { var c = globalThis.BSIStudioLezioni.calcolo.caduta(20, v); return { tA: c.tA, tB: c.tB, gittata: c.gittata, testo: t('Lasciata cadere: ', 'Dropped: ') + f(c.tA, 3) + ' s · ' + t('lanciata: ', 'thrown: ') + f(c.tB, 3) + ' s · ' + t('differenza ', 'difference ') + f(Math.abs(c.tA - c.tB) * 1000, 3) + ' ms · ' + t('gittata ', 'range ') + f(c.gittata, 2) + ' m' }; } },
    acqua: { etichetta: t('ingombro dei doppietti solitari (1 = come un legame)', 'lone-pair size (1 = like a bond)'), min: 1, max: 1.6, passo: 0.05, val: 1.25,
      calcola: function (w) { var a = globalThis.BSIStudioLezioni.calcolo.vsepr(2, 2, w, 4000).angolo; return { angolo: a, testo: t('Angolo H–O–H calcolato: ', 'Computed H–O–H angle: ') + f(a, 1) + '° · ' + t('misurato in fase gassosa: 104,5°', 'measured in the gas phase: 104.5°') }; } },
    basilea: { etichetta: t('termini sommati N (10^x)', 'terms summed N (10^x)'), min: 1, max: 5, passo: 0.25, val: 3,
      calcola: function (x) { var N = Math.round(Math.pow(10, x)), C = globalThis.BSIStudioLezioni.calcolo, S = C.parziale(N), L = Math.PI * Math.PI / 6, k = C.coda(N); return { S: S, testo: 'N = ' + N + ' · S_N = ' + f(S, 6) + ' · π²/6 = ' + f(L, 6) + ' · ' + t('manca ', 'missing ') + f(L - S, 6) + ' (' + t('fra ', 'between ') + f(k[0], 6) + t(' e ', ' and ') + f(k[1], 6) + ')' }; } }
  };

  /* ── l'interfaccia ── */
  var CSS = '#bsiLA{display:flex;flex-direction:column;gap:10px;padding:12px 14px;overflow-y:auto;height:100%;box-sizing:border-box}' +
    '#bsiLA .riga{display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
    '#bsiLA input[type=text],#bsiLA select{background:#0d1b2e;border:1px solid #1a3550;border-radius:8px;color:#e9eef6;padding:8px 10px;font:500 14px system-ui;min-height:38px}' +
    '#bsiLA input[type=text]{flex:1;min-width:180px}' +
    '#bsiLA .bt{background:linear-gradient(135deg,#2f6bff,#00c9b7);color:#fff;border:0;border-radius:10px;padding:9px 14px;font:700 13.5px system-ui;cursor:pointer;min-height:38px}' +
    '#bsiLA .bt2{background:rgba(16,32,64,.85);border:1px solid #2a4a70;color:#cfe2ff;border-radius:999px;padding:7px 12px;font:600 12.5px system-ui;cursor:pointer;min-height:34px}' +
    '#bsiLA .fasi{display:flex;gap:4px}#bsiLA .fasi span{flex:1;text-align:center;font:700 11px/1 system-ui;letter-spacing:.06em;text-transform:uppercase;color:#6f84b8;padding:8px 2px;border-radius:8px;background:rgba(143,176,255,.08)}' +
    '#bsiLA .fasi span.on{color:#fff;background:linear-gradient(135deg,rgba(47,107,255,.6),rgba(0,201,183,.4))}#bsiLA .fasi span.fatta{color:#1fd39a}' +
    '#bsiLA .opz{display:grid;gap:8px}#bsiLA .opz button{text-align:left;background:#0d1b2e;border:1px solid #1a3550;color:#e9eef6;border-radius:10px;padding:10px 12px;font:500 14px/1.4 system-ui;cursor:pointer;min-height:44px}' +
    '#bsiLA .opz button.giusta{border-color:#1fd39a;background:rgba(31,211,154,.12)}#bsiLA .opz button.sbagliata{border-color:#ff6b9d;background:rgba(255,107,157,.1)}#bsiLA .opz button.scelta{outline:2px solid #6bcfff}' +
    '#bsiLA .carta{background:rgba(13,27,46,.7);border:1px solid #1a3550;border-radius:12px;padding:12px 14px;color:#dbe7f6;font:400 14.5px/1.55 system-ui}' +
    '#bsiLA .carta h3{margin:0 0 6px;color:#5eead4;font:700 15px system-ui}#bsiLA .f{font:600 14px ui-monospace,monospace;color:#9fe7ff;background:rgba(0,0,0,.25);border-radius:8px;padding:6px 9px;margin:6px 0;overflow-x:auto}' +
    '#bsiLA .cursore{display:grid;gap:6px}#bsiLA .cursore input{width:100%}#bsiLA .misura{font:600 13.5px ui-monospace,monospace;color:#9fe7ff}' +
    '#bsiLA .ese{border-left:3px solid #2f6bff;padding:4px 10px;margin:6px 0}#bsiLA .nota{color:#9fb6dd;font:500 13px/1.45 system-ui}';

  function costruisci(pan) {
    if (!pan) return; ST.pan = pan;
    if (!D.getElementById('bsiLA-stile')) { var s = D.createElement('style'); s.id = 'bsiLA-stile'; s.textContent = CSS; D.head.appendChild(s); }
    pan.innerHTML = '';
    var w = D.createElement('div'); w.id = 'bsiLA'; pan.appendChild(w);
    var testa = D.createElement('div'); testa.className = 'carta';
    testa.innerHTML = '<h3>⚡ ' + t('Lezione con Spectra', 'Lesson with Spectra') + '</h3><div class="nota">' + t('Qualunque argomento, al tuo livello, in quattro tempi: <b>prevedi</b> che cosa succede, lo <b>provi</b> con i numeri, lo <b>dimostri</b>, e Spectra ti <b>rivela</b> il perché e dove porta.', 'Any topic, at your level, in four steps: you <b>predict</b> what happens, you <b>test</b> it with numbers, you <b>prove</b> it, and Spectra <b>reveals</b> why and where it leads.') + '</div>';
    w.appendChild(testa);
    var r1 = D.createElement('div'); r1.className = 'riga';
    r1.innerHTML = '<input type="text" id="bsiLA-arg" aria-label="' + t('Argomento della lezione', 'Lesson topic') + '" placeholder="' + t('Argomento: es. effetto tunnel, tampone acetato, serie di Fourier…', 'Topic: e.g. tunnelling, acetate buffer, Fourier series…') + '">' +
      '<select id="bsiLA-mat" aria-label="' + t('Materia', 'Subject') + '"><option value="chimica">' + t('Chimica', 'Chemistry') + '</option><option value="fisica">' + t('Fisica', 'Physics') + '</option><option value="matematica">' + t('Matematica', 'Mathematics') + '</option></select>' +
      '<select id="bsiLA-liv" aria-label="' + t('Livello', 'Level') + '">' + LIVELLI.map(function (l, i) { return '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="bt" id="bsiLA-via">⚡ ' + t('Inizia la lezione', 'Start the lesson') + '</button>';
    w.appendChild(r1);
    var r2 = D.createElement('div'); r2.className = 'riga'; r2.id = 'bsiLA-locali'; w.appendChild(r2);
    var fasi = D.createElement('div'); fasi.className = 'fasi'; fasi.id = 'bsiLA-fasi'; fasi.setAttribute('aria-label', t('Fasi della lezione', 'Lesson steps'));
    fasi.innerHTML = FASI.map(function (x) { return '<span>' + x + '</span>'; }).join(''); w.appendChild(fasi);
    var corpo = D.createElement('div'); corpo.id = 'bsiLA-corpo'; corpo.setAttribute('aria-live', 'polite'); w.appendChild(corpo);
    D.getElementById('bsiLA-via').onclick = function () {
      var a = D.getElementById('bsiLA-arg').value.trim(); if (!a) { D.getElementById('bsiLA-arg').focus(); return; }
      avvia({ argomento: a, materia: D.getElementById('bsiLA-mat').value, livello: +D.getElementById('bsiLA-liv').value });
    };
    D.getElementById('bsiLA-arg').onkeydown = function (e) { if (e.key === 'Enter') D.getElementById('bsiLA-via').click(); };
    caricaLocali().then(function () {
      var r = D.getElementById('bsiLA-locali'); if (!r) return;
      r.innerHTML = '<span class="nota">' + t('Anche senza rete e senza chiave:', 'Even offline and without a key:') + '</span>';
      locali().forEach(function (L) { var b = D.createElement('button'); b.type = 'button'; b.className = 'bt2'; b.textContent = L.icona + ' ' + L.titolo[0]; b.onclick = function () { avvia({ locale: L.id }); }; r.appendChild(b); });
    });
    corpoIniziale();
  }
  function corpoIniziale() {
    var c = D.getElementById('bsiLA-corpo'); if (!c) return;
    var m = memoria(), n = Object.keys(m).length, g = 0, s = 0; Object.keys(m).forEach(function (k) { g += m[k].giuste; s += m[k].sbagliate; });
    c.innerHTML = '<div class="nota">' + (n ? t('Lezioni fatte: ', 'Lessons done: ') + n + ' · ' + t('previsioni giuste ', 'right predictions ') + g + ', ' + t('da rivedere ', 'to review ') + s + '.' : t('Scrivi un argomento, oppure scegli una lezione del laboratorio.', 'Write a topic, or pick a lab lesson.')) + (modello() ? '' : ' ' + t('Per gli argomenti liberi serve un fornitore di IA (scheda Chat).', 'Free topics need an AI provider (Chat tab).')) + '</div>';
  }
  function segnaFase(i) { ST.fase = i; [].forEach.call(D.querySelectorAll('#bsiLA-fasi span'), function (s, k) { s.classList.toggle('on', k === i); s.classList.toggle('fatta', k < i); }); }
  function carta(titolo, html) { var c = D.createElement('div'); c.className = 'carta'; c.innerHTML = (titolo ? '<h3>' + titolo + '</h3>' : '') + html; return c; }
  function bottone(testo, fn) { var b = D.createElement('button'); b.type = 'button'; b.className = 'bt'; b.textContent = testo; b.onclick = fn; return b; }
  function attesa(c, si) { ST.attesa = si; if (si) annuncia('bsi-spectra-stato', { stato: 'pensa' }); var p = c.querySelector('.pensa'); if (si && !p) { p = D.createElement('div'); p.className = 'nota pensa'; p.textContent = t('Spectra sta preparando…', 'Spectra is preparing…'); c.appendChild(p); } if (!si && p) p.remove(); }
  function dice(testo, emo) { annuncia('bsi-spectra-dice', { testo: testo, emo: emo }); }

  /* ═══ IL FLUSSO ═══ */
  function avvia(o) {
    if (!ST.pan || !D.getElementById('bsiLA-corpo')) { var p = D.getElementById('bsi-pane-lezione'); if (p) costruisci(p); }
    var c = D.getElementById('bsiLA-corpo'); if (!c) return;
    ST.scelta = null; ST.storia = []; c.innerHTML = '';
    if (o.locale) {
      return caricaLocali().then(function () {
        var L = locali().filter(function (x) { return x.id === o.locale; })[0]; if (!L) return;
        ST.locale = true; ST.lez = { id: L.id, argomento: L.titolo[0], materia: L.materia, livello: 1, L: L };
        mostraPredici({ titolo: L.icona + ' ' + L.titolo[0], scena: L.sotto, domanda: L.predici.domanda, opzioni: L.predici.opzioni });
      });
    }
    ST.locale = false; ST.lez = { id: 'ai:' + o.argomento.toLowerCase().slice(0, 60), argomento: o.argomento, materia: o.materia || 'chimica', livello: o.livello == null ? 1 : o.livello };
    if (!modello()) { c.appendChild(carta('', '<div class="nota">' + t('Per un argomento libero serve un fornitore di IA con la sua chiave (scheda 💬 Chat). Intanto puoi fare una lezione del laboratorio qui sopra: funziona offline.', 'A free topic needs an AI provider with its key (💬 Chat tab). Meanwhile you can take a lab lesson above: it works offline.') + '</div>')); dice(t('Per questo argomento mi serve la connessione a un modello. Intanto proviamo una lezione del laboratorio?', 'For this topic I need a model. Shall we try a lab lesson meanwhile?'), 'dubbio'); return; }
    segnaFase(0); attesa(c, true);
    return chiedi('FASE 1 — PREDICI. Crea la scena e la domanda di previsione su «' + o.argomento + '». Rispondi SOLO con un oggetto JSON, senza testo prima o dopo, con questi campi: ' +
      '"titolo" (breve), "scena" (2-3 frasi: il fenomeno o la situazione concreta, con numeri realistici), "domanda" (una previsione chiara), ' +
      '"opzioni" (array di 4 stringhe: la risposta giusta e le 3 idee sbagliate più comuni fra gli studenti, in ordine casuale), "giusta" (indice 0-3 della giusta), ' +
      '"perche" (array di 4 stringhe brevi: perché ciascuna opzione è giusta o sbagliata).').then(function (s) {
      attesa(c, false);
      var P = leggiPredici(s);
      if (!P) { c.appendChild(carta('', '<div class="nota">' + t('Il modello non ha risposto nella forma richiesta. Riprova, oppure scegli una lezione del laboratorio.', 'The model did not answer in the required form. Try again, or pick a lab lesson.') + '</div>')); dice(t('Non mi è venuta bene: riproviamo.', 'That did not come out right: let us retry.'), 'dubbio'); return; }
      mostraPredici(P);
    }).catch(function (e) { attesa(c, false); c.appendChild(carta('', '<div class="nota">⚠ ' + esc(e && e.message || e) + '</div>')); annuncia('bsi-spectra-risposta', { errore: true }); });
  }
  function mostraPredici(P) {
    var c = D.getElementById('bsiLA-corpo'); segnaFase(0); ST.P = P;
    var k = carta(esc(P.titolo), (P.scena ? '<p>' + esc(P.scena) + '</p>' : '') + '<p><b>' + esc(P.domanda) + '</b></p>');
    var box = D.createElement('div'); box.className = 'opz'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', t('Le possibili previsioni', 'Possible predictions'));
    P.opzioni.forEach(function (o, i) { var b = D.createElement('button'); b.type = 'button'; b.textContent = String.fromCharCode(65 + i) + '. ' + o.testo; b.onclick = function () { scegli(i); }; box.appendChild(b); });
    k.appendChild(box); c.appendChild(k);
    dice((P.scena ? P.scena + ' ' : '') + P.domanda, 'curiosa');
  }
  function scegli(i) {
    if (ST.scelta != null) return; ST.scelta = i;
    var P = ST.P, giusta = P.opzioni[i].giusta;
    [].forEach.call(D.querySelectorAll('#bsiLA .opz button'), function (b, k) { b.disabled = true; if (k === i) b.classList.add('scelta'); });
    ricorda(ST.lez.id, giusta);
    prova();
  }
  function prova() {
    var c = D.getElementById('bsiLA-corpo'); segnaFase(1);
    if (ST.locale) {
      var L = ST.lez.L, PR = PROVE[L.id], k = carta('🔬 ' + FASI[1], '<p>' + esc(L.testa.testo) + '</p>');
      if (PR) {
        var cur = D.createElement('div'); cur.className = 'cursore';
        cur.innerHTML = '<label>' + PR.etichetta + ' <b class="val"></b><input type="range" min="' + PR.min + '" max="' + PR.max + '" step="' + PR.passo + '" value="' + PR.val + '"></label><div class="misura" aria-live="polite"></div>';
        var inp = cur.querySelector('input'), mis = cur.querySelector('.misura'), val = cur.querySelector('.val');
        var agg = function () { var r = PR.calcola(+inp.value); val.textContent = inp.value; mis.textContent = r.testo; ST.misura = r; };
        inp.oninput = agg; agg(); k.appendChild(cur);
        var a = D.createElement('a'); a.href = './spectra-studio.html'; a.className = 'bt2'; a.style.display = 'inline-block'; a.style.marginTop = '8px'; a.textContent = '🎓 ' + t('Guardalo accadere in 3D nello studio', 'Watch it happen in 3D in the studio'); k.appendChild(a);
      }
      k.appendChild(bottone('∴ ' + FASI[2], dimostra)); c.appendChild(k);
      dice(L.testa.testo, 'concentrata'); return;
    }
    var k2 = carta('🔬 ' + FASI[1], '<div class="md"></div>'); c.appendChild(k2); attesa(k2, true);
    chiedi('FASE 2 — PROVA. Lo studente ha previsto: «' + ST.P.opzioni[ST.scelta].testo + '». NON dire ancora se è giusto. Mostra che cosa succede davvero: un esperimento o una simulazione concreta, con numeri realistici e una piccola tabella di misure in markdown. Massimo 180 parole.', function (s) { k2.querySelector('.md').innerHTML = md(s); })
      .then(function (s) { attesa(k2, false); k2.appendChild(bottone('∴ ' + FASI[2], dimostra)); dice(s, 'concentrata'); })
      .catch(function (e) { attesa(k2, false); k2.appendChild(carta('', '⚠ ' + esc(e && e.message || e))); annuncia('bsi-spectra-risposta', { errore: true }); });
  }
  function dimostra() {
    var c = D.getElementById('bsiLA-corpo'); segnaFase(2);
    if (ST.locale) {
      var L = ST.lez.L, html = L.dimostra.map(function (p, i) { return '<p>' + (i + 1) + '. ' + esc(p.testo) + '</p>' + (p.formula ? '<div class="f">' + esc(p.formula) + '</div>' : ''); }).join('');
      var k = carta('∴ ' + FASI[2], html); k.appendChild(bottone('✦ ' + FASI[3], rivela)); c.appendChild(k);
      dice(L.dimostra.map(function (p) { return p.testo; }).join(' '), 'determinata'); return;
    }
    var k2 = carta('∴ ' + FASI[2], '<div class="md"></div>'); c.appendChild(k2); attesa(k2, true);
    chiedi('FASE 3 — DIMOSTRA. La derivazione rigorosa, passo per passo, numerata, con le formule (una per riga) e le assunzioni dichiarate, al livello «' + LIVELLI[ST.lez.livello] + '». Massimo 250 parole.', function (s) { k2.querySelector('.md').innerHTML = md(s); })
      .then(function (s) { attesa(k2, false); k2.appendChild(bottone('✦ ' + FASI[3], rivela)); dice(s, 'determinata'); })
      .catch(function (e) { attesa(k2, false); k2.appendChild(carta('', '⚠ ' + esc(e && e.message || e))); annuncia('bsi-spectra-risposta', { errore: true }); });
  }
  function rivela() {
    var c = D.getElementById('bsiLA-corpo'); segnaFase(3);
    var P = ST.P, giusta = P.opzioni[ST.scelta].giusta;
    [].forEach.call(D.querySelectorAll('#bsiLA .opz button'), function (b, k) { b.classList.add(P.opzioni[k].giusta ? 'giusta' : k === ST.scelta ? 'sbagliata' : 'x'); if (P.opzioni[k].perche) b.title = P.opzioni[k].perche; });
    var esito = giusta ? t('La tua previsione era giusta.', 'Your prediction was right.') : t('La tua previsione era un\'altra: è l\'idea più naturale, e capire perché non regge è il punto della lezione.', 'Your prediction was different: it is the most natural idea, and seeing why it fails is the point of the lesson.');
    if (ST.locale) {
      var L = ST.lez.L, R = L.rivela, perche = P.opzioni.map(function (o, k) { return '<p>' + (o.giusta ? '✓ ' : k === ST.scelta ? '✗ ' : '· ') + '<b>' + esc(o.testo) + '</b> — ' + esc(o.perche) + '</p>'; }).join('');
      var html = '<p><b>' + esito + '</b></p>' + perche + '<p>' + esc(R.testo) + '</p>' + (R.collegamenti ? '<p><b>' + t('Collegamenti', 'Connections') + '</b></p><ul>' + R.collegamenti.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        '<p><b>' + t('Esercizi', 'Exercises') + '</b></p>' + R.esercizi.map(function (e) { return '<div class="ese"><b>' + LIVELLI[e.livello] + '</b> — ' + esc(e.testo) + '<details><summary>' + t('Soluzione', 'Solution') + '</summary><div class="f">' + esc(e.soluzione) + '</div></details></div>'; }).join('');
      var k = carta('✦ ' + FASI[3], html); fine(k); c.appendChild(k);
      dice(esito + ' ' + R.testo, giusta ? 'gioia' : 'sorpresa'); return;
    }
    var k2 = carta('✦ ' + FASI[3], '<p><b>' + esito + '</b></p><div class="md"></div>'); c.appendChild(k2); attesa(k2, true);
    chiedi('FASE 4 — RIVELA. Lo studente aveva scelto «' + P.opzioni[ST.scelta].testo + '», che è ' + (giusta ? 'GIUSTA' : 'SBAGLIATA (la giusta è «' + P.opzioni.filter(function (o) { return o.giusta; })[0].testo + '»)') + '. ' +
      'Spiega perché la giusta è giusta e perché ciascuna sbagliata è sbagliata (con empatia, senza sminuire). Poi 2-3 collegamenti con altre discipline (chimica, fisica, matematica, biologia). ' +
      'Poi ESATTAMENTE 4 esercizi, uno per livello (Scuola superiore, Triennale, Magistrale, Ricerca), ciascuno con la soluzione breve dopo «Soluzione:». Massimo 380 parole.', function (s) { k2.querySelector('.md').innerHTML = md(s); })
      .then(function (s) { attesa(k2, false); fine(k2); dice(esito + ' ' + s, giusta ? 'gioia' : 'sorpresa'); })
      .catch(function (e) { attesa(k2, false); k2.appendChild(carta('', '⚠ ' + esc(e && e.message || e))); annuncia('bsi-spectra-risposta', { errore: true }); });
  }
  function fine(k) {
    var r = D.createElement('div'); r.className = 'riga'; r.style.marginTop = '8px';
    var b1 = D.createElement('button'); b1.type = 'button'; b1.className = 'bt2'; b1.textContent = '↺ ' + t('Un\'altra lezione', 'Another lesson'); b1.onclick = function () { segnaFase(-1); corpoIniziale(); var a = D.getElementById('bsiLA-arg'); if (a) a.focus(); };
    r.appendChild(b1); k.appendChild(r);
  }

  globale.BSILezioneAI = { costruisci: costruisci, avvia: avvia, scegli: scegli, prova: prova, dimostra: dimostra, rivela: rivela, leggiPredici: leggiPredici, PROVE: PROVE, MEM: MEM,
    stato: function () { return { fase: ST.fase, locale: ST.locale, scelta: ST.scelta, argomento: ST.lez && ST.lez.argomento, misura: ST.misura || null }; } };
})(typeof window !== 'undefined' ? window : this);
