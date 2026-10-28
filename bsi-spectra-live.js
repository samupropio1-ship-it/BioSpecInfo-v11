/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-live.js — Spectra dal vivo: voce, volto, occhi e mani
   BioSpecInfo · © Samuele Pio Provenzano

   COSA AGGIUNGE A SPECTRA

   Spectra sa gia' ragionare, usare strumenti, ricordare e ascoltare «Hey
   Spectra». Qui diventa un assistente da parlarci, non solo da scriverci:

   · una CONSOLE a tutto schermo, con anelli che reagiscono alla voce (il
     microfono passa da un analizzatore Web Audio), lo stato (ascolto,
     elaboro, parlo), la trascrizione dal vivo e una telemetria della
     sessione: ora, materia, sezione aperta, schede da ripassare, fornitore;
   · la CONVERSAZIONE A MANI LIBERE: ascolta, risponde a voce frase per
     frase con la voce italiana migliore che il sistema offre, e torna ad
     ascoltare da sola; «stop» o un tocco la interrompono;
   · i COMANDI LOCALI, che funzionano senza rete e senza chiave: aprire una
     sezione o cambiare materia, calcolare, derivare e integrare, cercare una
     costante, convertire unita', definire un termine, fare un grafico,
     interrogare, dire dove ci si trova, muovere un cursore, cambiare scheda,
     fermare un'animazione. Tutto il resto va al modello, se c'e';
   · la CONSAPEVOLEZZA DELLO SCHERMO: a ogni domanda Spectra riceve dove si
     trova l'utente (materia, sezione, scheda, valori dei cursori, testo
     della nota), e ha strumenti per agire sulla pagina come farebbe la mano
     dell'utente;
   · la PROATTIVITA': aprendo la console fa il punto — saluto, materia,
     flashcard in scadenza, errori dei quiz da ripassare — e lo dice.

   Fantascienza resta l'intelligenza; tutto il resto qui e' vero, e se una
   capacita' del browser manca (riconoscimento vocale, sintesi), lo dice.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? en : it; }
  function lingua() { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? 'en' : 'it'; }
  function esc(x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(s) { s = String(s || '').toLowerCase(); if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); return s.replace(/[^a-z0-9²³⁻\s.,+\-*/^()=]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function materia() { return globale.BSIMaterie ? globale.BSIMaterie.corrente() : 'chimica'; }
  function nomeMateria(m) { var M = globale.BSIMaterie && globale.BSIMaterie.MATERIE[m]; return M ? t(M.nm[0], M.nm[1]) : m; }
  var PRE = { fisica: 'fis', matematica: 'mat', chimica: 'chi' };

  /* ═══ 1. LO SCHERMO: dove si trova l'utente, e cosa vede ═══════════════ */
  function sezioneAttiva() {
    var tutte = document.querySelectorAll('.section');
    for (var i = 0; i < tutte.length; i++) { var s = tutte[i]; if (s.offsetParent !== null && s.getBoundingClientRect().height > 40 && (s.classList.contains('on') || getComputedStyle(s).display !== 'none')) return s; }
    return null;
  }
  function pannelloAttivo(sez) {
    if (!sez) return null;
    var p = [].filter.call(sez.querySelectorAll('[role=tabpanel]'), function (x) { return x.offsetParent !== null; })[0];
    return p || sez;
  }
  function etichettaDi(el) {
    var l = el.getAttribute('aria-label'); if (l) return l;
    var c = el.closest('.bsiFX-cursore, label'); if (c) { var sp = c.querySelector('span'); if (sp) return sp.textContent; return c.textContent; }
    return el.name || el.id || '';
  }
  function leggiSchermo() {
    var sez = sezioneAttiva(), pan = pannelloAttivo(sez), out = { materia: materia(), sezione: null, titolo: null, scheda: null, controlli: [], schede: [], pulsanti: [], testo: '' };
    if (!sez) return out;
    out.sezione = sez.id;
    var tit = sez.querySelector('.section-title, .bsiFX-titolo, h2, h3'); out.titolo = tit ? tit.textContent.trim().slice(0, 120) : null;
    var sch = sez.querySelectorAll('.bsiFX-schede button');
    out.schede = [].map.call(sch, function (b) { return b.textContent.trim(); });
    var on = [].filter.call(sch, function (b) { return b.getAttribute('aria-selected') === 'true' || b.classList.contains('on'); })[0];
    out.scheda = on ? on.textContent.trim() : null;
    if (pan) {
      [].forEach.call(pan.querySelectorAll('input[type=range], select, input[type=number]'), function (c) {
        if (c.offsetParent === null) return;
        var v = { etichetta: etichettaDi(c).trim().slice(0, 80), tipo: c.tagName === 'SELECT' ? 'scelta' : 'cursore', valore: c.value };
        if (c.tagName === 'SELECT') { v.opzioni = [].map.call(c.options, function (o) { return o.textContent.trim(); }).slice(0, 12); v.valore = c.options[c.selectedIndex] ? c.options[c.selectedIndex].textContent.trim() : c.value; }
        else { v.min = c.min; v.max = c.max; v.passo = c.step; }
        out.controlli.push(v);
      });
      out.pulsanti = [].map.call(pan.querySelectorAll('button'), function (b) { return b.offsetParent !== null ? (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 40) : ''; }).filter(Boolean).slice(0, 20);
      var nota = pan.querySelector('.bsiFX-nota'); out.testo = ((nota ? nota.textContent : pan.textContent) || '').replace(/\s+/g, ' ').trim().slice(0, 1400);
    }
    return out;
  }
  /* il contesto che va a Spectra a ogni domanda: breve, perche' costa token */
  function contestoSchermo() {
    var s = leggiSchermo(); if (!s.sezione) return '';
    var r = '\n[SCHERMO DELL\'UTENTE ADESSO — usa questi dati quando dice «qui», «questo», «cosa vedo»]\n' +
      'Materia: ' + s.materia + ' · sezione: ' + (s.titolo || s.sezione) + ' (id ' + s.sezione + ')' + (s.scheda ? ' · scheda: ' + s.scheda : '') + '\n';
    if (s.controlli.length) r += 'Controlli: ' + s.controlli.slice(0, 10).map(function (c) { return c.etichetta + ' = ' + c.valore; }).join('; ') + '\n';
    if (s.testo) r += 'Testo visibile: ' + s.testo.slice(0, 700) + '\n';
    return r;
  }

  /* ═══ 2. LE MANI: agire sulla pagina ═══════════════════════════════════ */
  function trovaPerNome(lista, nome, testo) {
    var q = norm(nome); if (!q) return null;
    var migliore = null, punti = 0;
    lista.forEach(function (el) {
      var s = norm(testo(el)); if (!s) return;
      var p = s === q ? 100 : s.indexOf(q) >= 0 ? 60 + q.length : q.split(' ').filter(function (w) { return w.length > 2 && s.indexOf(w) >= 0; }).length * 10;
      if (p > punti) { punti = p; migliore = el; }
    });
    return punti >= 10 ? migliore : null;
  }
  function impostaControllo(nome, valore) {
    var pan = pannelloAttivo(sezioneAttiva()); if (!pan) return { ok: false, errore: t('nessuna sezione aperta', 'no open section') };
    var cc = [].filter.call(pan.querySelectorAll('input[type=range], select, input[type=number]'), function (c) { return c.offsetParent !== null; });
    var c = trovaPerNome(cc, nome, etichettaDi); if (!c) return { ok: false, errore: t('controllo non trovato: ', 'control not found: ') + nome, disponibili: cc.map(etichettaDi) };
    if (c.tagName === 'SELECT') {
      var o = trovaPerNome([].slice.call(c.options), String(valore), function (x) { return x.textContent; });
      if (!o) return { ok: false, errore: t('opzione non trovata', 'option not found'), opzioni: [].map.call(c.options, function (x) { return x.textContent; }) };
      c.value = o.value; c.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, controllo: etichettaDi(c), valore: o.textContent };
    }
    var v = parseFloat(String(valore).replace(',', '.')); if (!isFinite(v)) return { ok: false, errore: t('valore non numerico', 'not a number') };
    var lo = parseFloat(c.min), hi = parseFloat(c.max); if (isFinite(lo)) v = Math.max(lo, v); if (isFinite(hi)) v = Math.min(hi, v);
    c.value = v; c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, controllo: etichettaDi(c), valore: c.value, limitato: v !== parseFloat(String(valore).replace(',', '.')) };
  }
  function scegliScheda(nome) {
    var sez = sezioneAttiva(); if (!sez) return { ok: false, errore: t('nessuna sezione aperta', 'no open section') };
    var b = trovaPerNome([].slice.call(sez.querySelectorAll('.bsiFX-schede button, [role=tab]')), nome, function (x) { return x.textContent; });
    if (!b) return { ok: false, errore: t('scheda non trovata', 'tab not found') };
    b.click(); return { ok: true, scheda: b.textContent.trim() };
  }
  function premiPulsante(nome) {
    var pan = pannelloAttivo(sezioneAttiva()); if (!pan) return { ok: false, errore: t('nessuna sezione aperta', 'no open section') };
    var b = trovaPerNome([].filter.call(pan.querySelectorAll('button'), function (x) { return x.offsetParent !== null; }), nome, function (x) { return (x.getAttribute('aria-label') || '') + ' ' + x.textContent; });
    if (!b) return { ok: false, errore: t('pulsante non trovato', 'button not found') };
    b.click(); return { ok: true, pulsante: (b.getAttribute('aria-label') || b.textContent).trim() };
  }
  function pausaAnimazioni(ferma) {
    var pan = pannelloAttivo(sezioneAttiva()); if (!pan) return { ok: false };
    var n = 0;
    [].forEach.call(pan.querySelectorAll('.bsiFX-anim button'), function (b) { var s = b.textContent; if ((ferma && /❚❚/.test(s)) || (!ferma && /▶/.test(s))) { b.click(); n++; } });
    return { ok: n > 0, animazioni: n };
  }
  function sezioni() {
    return [].map.call(document.querySelectorAll('.nav-btn[data-s]'), function (b) { return { id: b.getAttribute('data-s'), nome: b.textContent.trim() }; }).filter(function (s) { return s.nome && s.id !== 'sai'; });
  }
  function apriSezione(nome) {
    var L = sezioni(), x = trovaPerNome(L, nome, function (s) { return s.nome + ' ' + s.id; });
    if (!x) return { ok: false, errore: t('sezione non trovata: ', 'section not found: ') + nome };
    if (typeof globale.goSection === 'function') globale.goSection(x.id);
    else { var b = document.querySelector('.nav-btn[data-s="' + x.id + '"]'); if (b) b.click(); }
    return { ok: true, id: x.id, nome: x.nome };
  }
  /* lo stato dello studio, dai salvataggi del kit (BSIStudio) */
  function studio(m) {
    m = m || materia();
    var r = { materia: m, daRipassare: 0, errori: 0, studiati: 0, flashTotali: 0 };
    try {
      var L = JSON.parse(localStorage.getItem('bsi-studio:' + m + ':leitner') || '{}'), D = globale.BSIStudio && globale.BSIStudio.dati(m);
      if (D && D.flash) { r.flashTotali = D.flash.length; r.daRipassare = D.flash.length - Object.keys(L).filter(function (k) { return L[k] >= 4; }).length; }
      var Q = JSON.parse(localStorage.getItem('bsi-studio:' + m + ':quiz') || '{}'); r.errori = (Q.errori || Q.sbagliate || []).length || 0;
      var S = JSON.parse(localStorage.getItem('bsi-studio:' + m + ':studiati') || '{}'); r.studiati = Array.isArray(S) ? S.length : Object.keys(S).length;
    } catch (e) {}
    return r;
  }

  /* gli strumenti nuovi per il modello: le stesse mani, descritte */
  var STRUMENTI = [
    { name: 'leggi_schermo', description: "Legge cosa ha davanti l'utente in questo momento: materia, sezione, scheda aperta, controlli (cursori e scelte con i valori), pulsanti e testo della nota. Usalo prima di rispondere a «qui», «questo grafico», «cosa vedo», o prima di muovere un controllo.", parameters: { type: 'object', properties: {} }, execute: function () { return Object.assign({ ok: true }, leggiSchermo()); } },
    { name: 'imposta_controllo', description: "Muove un cursore o cambia una scelta nella scheda aperta, come farebbe l'utente (la simulazione si aggiorna). Il nome del controllo puo' essere parziale; il valore e' un numero per i cursori o il testo dell'opzione per le scelte.", parameters: { type: 'object', properties: { controllo: { type: 'string' }, valore: { type: 'string' } }, required: ['controllo', 'valore'] }, execute: function (a) { return impostaControllo(a.controllo, a.valore); } },
    { name: 'scegli_scheda', description: "Apre una scheda della sezione aperta (per nome, anche parziale).", parameters: { type: 'object', properties: { scheda: { type: 'string' } }, required: ['scheda'] }, execute: function (a) { return scegliScheda(a.scheda); } },
    { name: 'premi_pulsante', description: "Preme un pulsante della scheda aperta (per testo o etichetta, anche parziale), per esempio «Misura», «Lancia», «Ricomincia».", parameters: { type: 'object', properties: { pulsante: { type: 'string' } }, required: ['pulsante'] }, execute: function (a) { return premiPulsante(a.pulsante); } },
    { name: 'cambia_materia', description: "Passa a un'altra materia dell'app: chimica, fisica o matematica (la barra, il menu e i suggerimenti cambiano con lei).", parameters: { type: 'object', properties: { materia: { type: 'string', enum: ['chimica', 'fisica', 'matematica'] } }, required: ['materia'] }, execute: function (a) { if (!globale.BSIMaterie) return { ok: false }; globale.BSIMaterie.imposta(a.materia); return { ok: true, materia: a.materia }; } },
    { name: 'consulta_kit', description: "Cerca nel materiale di studio dell'app (riassunti, formulario, glossario, domande di quiz) della materia indicata. Usalo PRIMA di spiegare un argomento, una formula o una definizione, e cita che viene da BioSpecInfo: e' materiale verificato.", parameters: { type: 'object', properties: { materia: { type: 'string', enum: ['chimica', 'fisica', 'matematica'] }, tipo: { type: 'string', enum: ['riassunti', 'formule', 'glossario', 'quiz'] }, cerca: { type: 'string' } }, required: ['tipo', 'cerca'] },
      execute: function (a) {
        var m = a.materia || materia(), D = globale.BSIStudio && globale.BSIStudio.dati(m);
        if (!D) return { ok: false, errore: t('nessun kit di studio per ', 'no study kit for ') + m };
        var campi = { riassunti: ['tit', 'testo'], formule: ['nm', 'f', 'note'], glossario: ['t', 'd'], quiz: ['d', 'sp'] }[a.tipo] || ['t'];
        var L = (D[a.tipo] || []), r = cerca(L, a.cerca, campi).slice(0, a.tipo === 'riassunti' ? 3 : 8);
        return { ok: true, materia: m, trovati: r.length, risultati: r.map(function (x) { var o = {}; campi.concat(a.tipo === 'quiz' ? ['r', 'k'] : []).forEach(function (c) { o[c] = typeof x[c] === 'string' ? x[c].replace(/<[^>]+>/g, ' ').slice(0, 1500) : x[c]; }); return o; }) };
      } },
    { name: 'disegna_grafico', description: "Disegna sullo schermo il grafico di una o piu' funzioni di x, in una finestra sopra la pagina (sintassi: sin(x), x^2, exp(-x), ln(x), sqrt(x)...). Usalo quando un grafico aiuta a capire: studio di funzione, confronto di andamenti, leggi fisiche.", parameters: { type: 'object', properties: { funzioni: { type: 'array', items: { type: 'string' } }, xmin: { type: 'number' }, xmax: { type: 'number' } }, required: ['funzioni'] },
      execute: function (a) {
        var A = globale.BSIAttrezzi; if (!A) return { ok: false };
        A.apri('grafico', materia());
        setTimeout(function () { var i = document.getElementById('bsiAT-in'), x0 = document.getElementById('bsiAT-a'), x1 = document.getElementById('bsiAT-b'); if (!i) return; i.value = (a.funzioni || []).join('; '); if (x0 && a.xmin != null) x0.value = a.xmin; if (x1 && a.xmax != null) x1.value = a.xmax; i.dispatchEvent(new Event('input')); }, 80);
        return { ok: true, nota: 'grafico mostrato: commentalo all\'utente (zeri, massimi, asintoti, confronto)' };
      } },
    { name: 'apri_strumento_rapido', description: "Apre uno strumento al volo in una finestra sopra la pagina: calcolatrice esatta, derivata e primitiva, grafico, costante fisica (CODATA), convertitore di unita', formula, glossario, quiz lampo.", parameters: { type: 'object', properties: { strumento: { type: 'string', enum: ['calcolatrice', 'derivata', 'grafico', 'costante', 'unita', 'formula', 'glossario', 'quiz'] } }, required: ['strumento'] },
      execute: function (a) { var A = globale.BSIAttrezzi; if (!A || !A.STRUMENTI[a.strumento]) return { ok: false }; A.apri(a.strumento, materia()); return { ok: true }; } },
    { name: 'stato_studio', description: "Dice come sta andando lo studio dell'utente nella materia: flashcard da ripassare, errori dei quiz da rivedere, riassunti segnati come studiati. Usalo per proporre cosa fare adesso.", parameters: { type: 'object', properties: { materia: { type: 'string', enum: ['chimica', 'fisica', 'matematica'] } } }, execute: function (a) { return Object.assign({ ok: true }, studio(a && a.materia)); } }
  ];
  function registraStrumenti() {
    var T = globale.BSI_AI_TOOLS; if (!T || T._bsiSpectra) return !!T;
    STRUMENTI.forEach(function (s) { if (!T.some(function (x) { return x.name === s.name; })) T.push(s); });
    T._bsiSpectra = true; return true;
  }

  /* ═══ 3. LA VOCE ═══════════════════════════════════════════════════════ */
  var voce = { scelta: null, attiva: true, inCorso: false, coda: [] };
  function scegliVoce() {
    if (!('speechSynthesis' in globale)) return null;
    var L = speechSynthesis.getVoices() || [], lg = lingua() === 'en' ? 'en' : 'it';
    var cand = L.filter(function (v) { return (v.lang || '').toLowerCase().indexOf(lg) === 0; });
    /* Spectra ha il volto di un uomo: si preferisce una voce maschile, poi la qualita' */
    var maschi = /giorgio|diego|cosimo|luca|benigno|gianni|giuseppe|marco|roberto|daniel|david|guy|ryan|thomas|christopher|eric|male|uomo|deep|grave/i;
    var pref = [function (v) { return maschi.test(v.name) && /natural|neural|online/i.test(v.name); }, function (v) { return maschi.test(v.name); }, function (v) { return /natural|neural|online/i.test(v.name); }, function (v) { return /google|microsoft/i.test(v.name); }];
    for (var i = 0; i < pref.length; i++) { var v = cand.filter(pref[i])[0]; if (v) return v; }
    return cand[0] || null;
  }
  /* il testo scritto per gli occhi diventa testo da dire: niente markdown,
     formule lette a parole, sigle comuni sciolte */
  function perLaVoce(s) {
    s = String(s || '');
    s = s.replace(/```[\s\S]*?```/g, ' ').replace(/`([^`]*)`/g, '$1').replace(/\[(.*?)\]\([^)]*\)/g, '$1').replace(/[*_#>|]/g, ' ');
    var it = lingua() !== 'en';
    var R = it ? [[/²/g, ' al quadrato'], [/³/g, ' al cubo'], [/√/g, ' radice di '], [/≈/g, ' circa '], [/≤/g, ' minore o uguale a '], [/≥/g, ' maggiore o uguale a '], [/≠/g, ' diverso da '], [/·|×/g, ' per '], [/−/g, ' meno '], [/→/g, ' porta a '], [/∫/g, ' integrale di '], [/∑/g, ' somma di '], [/π/g, ' pi greco '], [/Δ/g, ' delta '], [/λ/g, ' lambda '], [/μ/g, ' mu '], [/°C/g, ' gradi Celsius'], [/°/g, ' gradi'], [/\be\.g\./g, 'per esempio'], [/ m\/s\b/g, ' metri al secondo'], [/\bkm\b/g, ' chilometri'], [/\beV\b/g, ' elettronvolt'], [/\bJ\b/g, ' joule']]
      : [[/²/g, ' squared'], [/³/g, ' cubed'], [/√/g, ' square root of '], [/≈/g, ' about '], [/·|×/g, ' times '], [/−/g, ' minus '], [/π/g, ' pi '], [/°C/g, ' degrees Celsius']];
    R.forEach(function (r) { s = s.replace(r[0], r[1]); });
    return s.replace(/\s+/g, ' ').trim();
  }
  function frasi(s) { return (perLaVoce(s).match(/[^.!?;:\n]+[.!?;:]*/g) || []).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 1; }); }
  function parla(testo, fatto) {
    if (!('speechSynthesis' in globale) || !voce.attiva) { if (hud.volto && testo) { hud.volto.dici(perLaVoce(testo).slice(0, 220)); setTimeout(function () { if (hud.volto) hud.volto.taci(); }, Math.min(9000, 300 + perLaVoce(testo).length * 70)); } if (fatto) setTimeout(fatto, 0); return false; }
    try { speechSynthesis.cancel(); } catch (e) {}
    var pezzi = frasi(testo).slice(0, 40); if (!pezzi.length) { if (fatto) fatto(); return false; }
    voce.scelta = voce.scelta || scegliVoce(); voce.inCorso = true; stato('parla');
    var i = 0;
    (function prossima() {
      if (!voce.inCorso) return;
      if (i >= pezzi.length) { voce.inCorso = false; if (hud.volto) hud.volto.taci(); stato('attesa'); if (fatto) fatto(); return; }
      var u = new SpeechSynthesisUtterance(pezzi[i++]);
      u.lang = lingua() === 'en' ? 'en-US' : 'it-IT'; if (voce.scelta) u.voice = voce.scelta; u.rate = 0.95; u.pitch = 0.7; u.volume = 1;
      var frase = pezzi[i - 1], partita = false, finita = false;
      /* una sintesi vocale che non parte (nessuna voce installata, audio
         bloccato) non deve fermare il discorso: dopo 1,2 s la frase si
         «recita» con la bocca per il tempo che avrebbe richiesto */
      function avanti() { if (finita) return; finita = true; prossima(); }
      setTimeout(function () {
        if (partita || finita || !voce.inCorso) return;
        try { speechSynthesis.cancel(); } catch (e) {}
        if (hud.volto) hud.volto.dici(frase);
        setTimeout(avanti, Math.min(12000, 250 + frase.length * 70));
      }, 1200);
      u.onstart = function () { partita = true; hud.energia = 1; if (hud.volto) hud.volto.dici(frase); };
      u.onboundary = function (ev) { hud.energia = 0.7 + Math.random() * 0.3; if (hud.volto && ev && ev.charIndex != null) { hud.volto.allinea(ev.charIndex); if (hud.volto.parola && ev.name !== 'sentence') hud.volto.parola(); } };
      u.onend = function () { if (partita) avanti(); }; u.onerror = function () { if (partita) avanti(); };
      speechSynthesis.speak(u);
    })();
    return true;
  }
  function taci() { voce.inCorso = false; try { speechSynthesis.cancel(); } catch (e) {} if (hud.volto) hud.volto.taci(); stato('attesa'); }

  /* ═══ 4. I COMANDI LOCALI (senza rete) ═════════════════════════════════ */
  var UNITA_A_VOCE = { 'elettronvolt': 'eV', 'elettronvolts': 'eV', 'electronvolt': 'eV', 'joule': 'J', 'kilojoule': 'kJ', 'chilojoule': 'kJ', 'calorie': 'cal', 'caloria': 'cal', 'chilocalorie': 'kcal',
    'metri': 'm', 'metro': 'm', 'chilometri': 'km', 'centimetri': 'cm', 'millimetri': 'mm', 'nanometri': 'nm', 'angstrom': 'Å', 'micrometri': 'µm', 'pollici': 'in', 'piedi': 'ft', 'miglia': 'mi',
    'chilogrammi': 'kg', 'grammi': 'g', 'libbre': 'lb', 'secondi': 's', 'minuti': 'min', 'ore': 'h', 'giorni': 'd', 'anni': 'a',
    'pascal': 'Pa', 'atmosfere': 'atm', 'atmosfera': 'atm', 'bar': 'bar', 'millimetri di mercurio': 'mmHg', 'torr': 'Torr', 'kelvin': 'K', 'gradi celsius': '°C', 'celsius': '°C', 'fahrenheit': '°F',
    'watt': 'W', 'kilowatt': 'kW', 'cavalli': 'hp', 'tesla': 'T', 'gauss': 'G', 'radianti': 'rad', 'gradi': '°', 'hartree': 'Eh', 'numeri d onda': 'cm⁻¹', 'kilowattora': 'kWh' };
  function simboloUnita(s) { s = norm(s).replace(/^(di |in |a )/, ''); if (UNITA_A_VOCE[s]) return UNITA_A_VOCE[s]; if (UNITA_A_VOCE[s.replace(/i$/, 'o')]) return UNITA_A_VOCE[s.replace(/i$/, 'o')]; return s; }
  function espressioneParlata(s) {
    return String(s).replace(/,/g, '.').replace(/\bpiu\b|\bpiù\b|\bplus\b/gi, '+').replace(/\bmeno\b|\bminus\b/gi, '-').replace(/\bper\b|\btimes\b/gi, '*').replace(/\bdiviso\b|\bfratto\b|\bover\b/gi, '/')
      .replace(/\balla\b|\belevato a\b|\bto the\b/gi, '^').replace(/\bal quadrato\b|\bsquared\b/gi, '^2').replace(/\bal cubo\b|\bcubed\b/gi, '^3').replace(/\bradice (quadrata )?di\b|\bsquare root of\b/gi, 'sqrt ')
      .replace(/\bpi greco\b/gi, 'pi').replace(/\bseno\b/gi, 'sin').replace(/\bcoseno\b/gi, 'cos').replace(/\btangente\b/gi, 'tan').replace(/\blogaritmo naturale di\b|\blog naturale di\b/gi, 'ln ').replace(/\bdi\b/gi, ' ');
  }
  function cerca(lista, q, campi) { var A = globale.BSIAttrezzi; return A ? A.calcolo.cerca(lista, q, campi) : []; }
  /* la guida: legge la spiegazione della scheda e presenta i comandi uno per
     uno, facendoli lampeggiare mentre ne parla */
  function guida() {
    var sez = sezioneAttiva(), pan = pannelloAttivo(sez); if (!sez || !pan) return null;
    var s = leggiSchermo(), passi = [];
    passi.push({ testo: t('Questa è ', 'This is ') + (s.titolo || s.sezione).replace(/^[^\wÀ-ÿ]+/, '') + (s.scheda ? t(', scheda ', ', tab ') + s.scheda.replace(/^[^\wÀ-ÿ]+/, '') : '') + '.' });
    var nota = pan.querySelector('.bsiFX-nota');
    if (nota && nota.textContent.trim()) passi.push({ testo: nota.textContent.replace(/\s+/g, ' ').trim().slice(0, 900), el: nota });
    [].forEach.call(pan.querySelectorAll('input[type=range], select'), function (c) {
      if (c.offsetParent === null || passi.length > 9) return;
      var et = etichettaDi(c).trim();
      passi.push({ testo: c.tagName === 'SELECT' ? t('Qui scegli ', 'Here you choose ') + et + '.' : t('Con questo cursore regoli ', 'With this slider you set ') + et + t(': adesso vale ', ': now it is ') + c.value + '.', el: c.closest('.bsiFX-cursore, label, div') || c });
    });
    passi.push({ testo: t('Prova a muovere un comando e chiedimi cosa è cambiato: io vedo lo schermo.', 'Try moving a control and ask me what changed: I can see the screen.') });
    return passi;
  }
  function eseguiGuida(passi) {
    var i = 0;
    stileGuida();
    (function prossimo() {
      [].forEach.call(document.querySelectorAll('.bsiJV-evidenzia'), function (e) { e.classList.remove('bsiJV-evidenzia'); });
      if (i >= passi.length) { dopoLaRisposta(); return; }
      var p = passi[i++];
      if (p.el) { p.el.classList.add('bsiJV-evidenzia'); try { p.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }
      dialogo('', p.testo); ultima = p.testo;
      if (!parla(p.testo, prossimo)) setTimeout(prossimo, Math.min(9000, 1200 + p.testo.length * 45));
    })();
  }
  function stileGuida() {
    if (document.getElementById('bsiJV-stile-guida')) return;
    var s = document.createElement('style'); s.id = 'bsiJV-stile-guida';
    s.textContent = '@keyframes bsiJVpulsa{0%,100%{box-shadow:0 0 0 2px rgba(47,107,255,.9),0 0 18px rgba(47,107,255,.6)}50%{box-shadow:0 0 0 4px rgba(47,107,255,.4),0 0 30px rgba(47,107,255,.9)}}' +
      '.bsiJV-evidenzia{border-radius:10px;animation:bsiJVpulsa 1.2s ease-in-out infinite;position:relative;z-index:2}' +
      '@media (prefers-reduced-motion:reduce){.bsiJV-evidenzia{animation:none;box-shadow:0 0 0 3px #2f6bff}}';
    document.head.appendChild(s);
  }

  var COMANDI = [
    { re: /^(cosa ricordi di me|cosa sai di me|chi sono|what do you remember|what do you know about me)/, f: function () { var Mn = globale.BSISpectraMente; return { testo: Mn ? Mn.cosaRicordi() : t('Non ho memoria attiva.', 'I have no active memory.') }; } },
    { re: /^(come stai|come ti senti|tutto bene|how are you)/, f: function () { var Mn = globale.BSISpectraMente; return { testo: Mn ? Mn.comeStai() : t('Bene, grazie.', 'Fine, thanks.') }; } },
    { re: /^(dimentica tutto|cancella la memoria|forget everything)/, f: function () { var Mn = globale.BSISpectraMente; if (Mn) Mn.dimentica(); return { testo: t('Fatto: ho cancellato tutto quello che ricordavo di te. Ricominciamo da capo.', 'Done: I erased everything I remembered about you. Fresh start.') }; } },
    { re: /^(a cosa pensi|cosa pensi|che ne pensi|what are you thinking)/, f: function () { var Mn = globale.BSISpectraMente, p = Mn && Mn.pensieri()[0]; return { testo: p ? p.testo : t('Penso che sia un buon momento per imparare qualcosa di nuovo. Da dove cominciamo?', 'I think it is a good moment to learn something new. Where do we start?') }; } },
    { re: /^(spiegami questa sezione|spiegami questa scheda|spiegami cosa c e qui|fammi da guida|guidami|tour|explain this section|guide me)/, f: function () {
      var p = guida(); if (!p) return { testo: t('Apri prima una sezione: poi te la spiego passo per passo.', 'Open a section first: then I will explain it step by step.') };
      chiudiHud(true); setTimeout(function () { eseguiGuida(p); }, 200); return { testo: '', muto: true }; } },
    { re: /^(stop|basta|zitto|silenzio|fermati|smetti)\b/, f: function () { taci(); return { testo: '', muto: true }; } },
    { re: /^(ripeti|puoi ripetere|repeat)/, f: function () { return { testo: ultima || t('Non ho ancora detto niente.', 'I have not said anything yet.') }; } },
    { re: /^(che ore sono|che ora e|what time is it)/, f: function () { var d = new Date(); return { testo: t('Sono le ', 'It is ') + d.getHours() + (lingua() === 'en' ? ':' : ' e ') + String(d.getMinutes()).padStart(2, '0') + '.' }; } },
    { re: /^(che giorno e|che data e|oggi che giorno|what day)/, f: function () { return { testo: t('Oggi è ', 'Today is ') + new Date().toLocaleDateString(lingua() === 'en' ? 'en-GB' : 'it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '.' }; } },
    { re: /^(dove sono|cosa vedo|cosa c e qui|where am i|what am i looking at)/, f: function () {
      var s = leggiSchermo();
      if (!s.sezione) return { testo: t('Sei nella pagina iniziale, in ', 'You are on the home page, in ') + nomeMateria(s.materia) + '.' };
      return { testo: t('Sei in ', 'You are in ') + nomeMateria(s.materia) + ', ' + (s.titolo || s.sezione) + (s.scheda ? t(', scheda ', ', tab ') + s.scheda : '') + '. ' + (s.controlli.length ? t('Puoi regolare: ', 'You can adjust: ') + s.controlli.slice(0, 5).map(function (c) { return c.etichetta; }).join(', ') + '.' : '') }; } },
    { re: /^(passa a|modalita|vai in|switch to)\s+(la\s+)?(chimica|fisica|matematica|chemistry|physics|mathematics|maths)\b/, f: function (m) {
      var k = { chemistry: 'chimica', physics: 'fisica', mathematics: 'matematica', maths: 'matematica' }[m[3]] || m[3];
      if (globale.BSIMaterie) globale.BSIMaterie.imposta(k); return { testo: t('Passo a ', 'Switching to ') + nomeMateria(k) + '.' }; } },
    { re: /^(calcola|quanto fa|quanto vale|calculate|compute|what is)\s+(.+)$/, prova: true, f: function (m) {
      var A = globale.BSIAttrezzi; if (!A) return null;
      var r = A.calcolo.calcola(espressioneParlata(m[2]));
      if (r.errore) return null;
      return { testo: (isFinite(r.valore) ? t('Fa ', 'It is ') + Number(r.valore.toPrecision(8)) : r.esatto) + (r.esatto && isFinite(r.valore) && r.esatto !== String(Number(r.valore.toPrecision(8))) ? t(', cioè ', ', that is ') + r.esatto : '') + '.', html: '<b>' + esc(m[2]) + '</b> = ' + r.html + (isFinite(r.valore) ? ' ≈ ' + Number(r.valore.toPrecision(10)) : '') }; } },
    { re: /^(deriva|derivata di|la derivata di|derivative of)\s+(.+)$/, f: function (m) {
      var A = globale.BSIAttrezzi; if (!A) return null; var r = A.calcolo.derivaTesto(espressioneParlata(m[2]), 'x'); if (r.errore) return null;
      return { testo: t('La derivata è ', 'The derivative is ') + r.testo + '.', html: 'd/dx [' + esc(m[2]) + '] = ' + r.html }; } },
    { re: /^(integra|integrale di|l integrale di|primitiva di|integral of)\s+(.+)$/, f: function (m) {
      var A = globale.BSIAttrezzi; if (!A) return null; var r = A.calcolo.integraTesto(espressioneParlata(m[2]), 'x'); if (r.errore) return null;
      if (r.nessuna) return { testo: t('Non trovo una primitiva elementare con le regole che conosco.', 'I cannot find an elementary antiderivative with the rules I know.') };
      return { testo: t('Una primitiva è ', 'An antiderivative is ') + r.testo + t(', più una costante.', ', plus a constant.'), html: '∫ ' + esc(m[2]) + ' dx = ' + r.html + ' + C' }; } },
    { re: /^(converti|convert)\s+([\d.,]+)\s+(.+?)\s+(in|a|to)\s+(.+)$/, f: function (m) {
      var U = globale.BSIFisica && globale.BSIFisica.calcolo.unita; if (!U) return null;
      var v = parseFloat(m[2].replace(',', '.')), da = simboloUnita(m[3]), a = simboloUnita(m[5]);
      try { var r = U.converti(v, da, a); return { testo: m[2] + ' ' + m[3] + t(' sono ', ' is ') + Number(r.toPrecision(6)) + ' ' + m[5] + '.', html: esc(m[2] + ' ' + da) + ' = <b>' + Number(r.toPrecision(10)) + '</b> ' + esc(a) }; }
      catch (e) { return { testo: t('Non so convertire ', 'I cannot convert ') + m[3] + t(' in ', ' to ') + m[5] + '.' }; } } },
    { re: /^(costante di|la costante di|quanto vale la costante di|valore della costante di|constant)\s+(.+)$/, f: function (m) {
      var U = globale.BSIFisica && globale.BSIFisica.calcolo.unita; if (!U || !U.COSTANTI) return null;
      var k = cerca(U.COSTANTI, m[2], ['nm', 'simbolo', 'k'])[0]; if (!k) return { testo: t('Non trovo questa costante.', 'I cannot find this constant.') };
      return { testo: (Array.isArray(k.nm) ? t(k.nm[0], k.nm[1]) : k.nm) + ': ' + k.valore + ' ' + (k.unita || '') + (k.esatta ? t(', valore esatto.', ', exact value.') : '.'), html: '<b>' + esc(k.simbolo) + '</b> = ' + esc(k.valore) + ' ' + esc(k.unita || '') }; } },
    { re: /^(cos e|cosa e|che cos e|cosa significa|definisci|definizione di|what is a|what is an|define)\s+(un |una |il |la |lo |l |the |a |an )?(.+)$/, prova: true, f: function (m) {
      var D = globale.BSIStudio && globale.BSIStudio.dati(materia()); if (!D || !D.glossario) return null;
      var g = cerca(D.glossario, m[3], ['t'])[0]; if (!g) return null;
      return { testo: g.t + ': ' + g.d, html: '<b>' + esc(g.t) + '</b> — ' + esc(g.d) }; } },
    { re: /^(fai un grafico di|grafico di|disegna|plot)\s+(.+)$/, f: function (m) {
      var A = globale.BSIAttrezzi; if (!A) return null; chiudiHud(true); A.apri('grafico', materia());
      setTimeout(function () { var i = document.getElementById('bsiAT-in'); if (i) { i.value = espressioneParlata(m[2]); i.dispatchEvent(new Event('input')); } }, 60);
      return { testo: t('Ecco il grafico di ', 'Here is the plot of ') + m[2] + '.' }; } },
    { re: /^(interrogami|fammi un quiz|quiz|test me|quiz me)/, f: function () { var id = 's' + PRE[materia()] + 'quiz'; if (!document.getElementById(id)) id = 'squiz'; chiudiHud(true); apriSezione(id); if (typeof globale.goSection === 'function') globale.goSection(id); return { testo: t('Apro il quiz di ', 'Opening the quiz of ') + nomeMateria(materia()) + t('. In bocca al lupo.', '. Good luck.') }; } },
    { re: /^(ripassa|ripassiamo|flashcard|review)/, f: function () { var id = 's' + PRE[materia()] + 'flash'; chiudiHud(true); if (typeof globale.goSection === 'function') globale.goSection(document.getElementById(id) ? id : 'scustomflash'); return { testo: t('Apro le flashcard.', 'Opening the flashcards.') }; } },
    { re: /^(imposta|metti|porta|set)\s+(il |la |lo |l )?(.+?)\s+(a|su|to)\s+([-\d.,]+|.+)$/, f: function (m) { var r = impostaControllo(m[3], m[5]); return { testo: r.ok ? r.controllo + t(' impostato a ', ' set to ') + r.valore + '.' : r.errore }; } },
    { re: /^(scheda|apri la scheda|vai alla scheda|tab)\s+(.+)$/, f: function (m) { var r = scegliScheda(m[2]); return { testo: r.ok ? t('Scheda ', 'Tab ') + r.scheda + '.' : r.errore }; } },
    { re: /^(pausa|ferma l animazione|metti in pausa|pause)/, f: function () { var r = pausaAnimazioni(true); return { testo: r.ok ? t('In pausa.', 'Paused.') : t('Non vedo animazioni in corso.', 'I see no running animation.') }; } },
    { re: /^(riprendi|continua l animazione|play|resume)/, f: function () { var r = pausaAnimazioni(false); return { testo: r.ok ? t('Riprendo.', 'Resuming.') : t('Non vedo animazioni in pausa.', 'I see no paused animation.') }; } },
    { re: /^(schermo intero|fullscreen)/, f: function () { try { document.documentElement.requestFullscreen(); } catch (e) {} return { testo: t('Schermo intero.', 'Full screen.') }; } },
    { re: /^(apri|vai a|vai alla|vai al|portami a|portami alla|mostrami|open|go to|show me)\s+(la |il |lo |l |le |i |gli |sezione |the )?(.+)$/, prova: true, f: function (m) {
      var A = globale.BSIAttrezzi, n = norm(m[3]);
      if (A) { var k = Object.keys(A.STRUMENTI).filter(function (x) { return n.indexOf(norm(t(A.STRUMENTI[x].nm[0], A.STRUMENTI[x].nm[1])).split(' ')[0]) === 0; })[0]; if (k) { chiudiHud(true); A.apri(k, materia()); return { testo: t('Apro ', 'Opening ') + t(A.STRUMENTI[k].nm[0], A.STRUMENTI[k].nm[1]) + '.' }; } }
      var r = apriSezione(m[3]); if (!r.ok) return null;
      chiudiHud(true); return { testo: t('Apro ', 'Opening ') + r.nome.replace(/^[^\wÀ-ÿ]+/, '') + '.' }; } }
  ];
  function comandoLocale(testo) {
    var q = norm(testo).replace(/^(ehi |hey |ok )?(spectra|spettra)[ ,]*/, '').replace(/^(per favore |puoi |potresti |please |can you )/, '');
    for (var i = 0; i < COMANDI.length; i++) {
      var m = q.match(COMANDI[i].re); if (!m) continue;
      var r = null; try { r = COMANDI[i].f(m); } catch (e) { r = null; }
      if (r) return r;
      if (!COMANDI[i].prova) return { testo: t('Non sono riuscito a farlo.', 'I could not do that.') };
    }
    return null;
  }

  /* ═══ 4b. GLI OCCHI: l'immagine di cio' che l'utente sta guardando ════ */
  /* Le tele visibili della scheda aperta, 2D e 3D, composte in un'immagine
     sola. Le tele WebGL non conservano il disegno dopo la composizione: si
     ridisegna la scena e la si copia nello stesso istante. */
  function catturaSchermo() {
    var pan = pannelloAttivo(sezioneAttiva()); if (!pan) return null;
    var tele = [].filter.call(pan.querySelectorAll('canvas'), function (c) { return c.offsetParent !== null && c.width > 40 && c.height > 40; }).slice(0, 4);
    if (!tele.length) return null;
    var W = 0, H = 0, sc = 1;
    tele.forEach(function (c) { W = Math.max(W, c.width); H += c.height; });
    if (W > 1400) sc = 1400 / W;
    var out = document.createElement('canvas'); out.width = Math.round(W * sc); out.height = Math.round(H * sc);
    var q = out.getContext('2d'); q.fillStyle = '#081522'; q.fillRect(0, 0, out.width, out.height);
    var y = 0, scene = (globale.BSILab3D && globale.BSILab3D.scene && globale.BSILab3D.scene()) || [];
    tele.forEach(function (c) {
      var s = scene.filter(function (x) { return x.ren && x.ren.domElement === c; })[0];
      try { if (s) s.disegna(); q.drawImage(c, 0, y * sc, c.width * sc, c.height * sc); } catch (e) {}
      y += c.height;
    });
    return out;
  }
  function allegaSchermo() {
    return new Promise(function (ok) {
      var c = catturaSchermo(); if (!c || typeof globale._bsiAllegaFile !== 'function' || !c.toBlob) { ok(false); return; }
      c.toBlob(function (b) {
        if (!b) { ok(false); return; }
        try { var f = new File([b], 'schermo-' + (leggiSchermo().sezione || 'app') + '.png', { type: 'image/png' }); globale._bsiAllegaFile([f]); setTimeout(function () { ok(true); }, 400); } catch (e) { ok(false); }
      }, 'image/png');
    });
  }
  var VUOLE_VEDERE = /\b(questo|questa|questi|qui|grafico|grafici|figura|immagine|vedi|vedo|guarda|schermo|simulazione|animazione|spiegami cosa|this|chart|plot|look|see|screen)\b/;

  /* ═══ 5. IL MODELLO: quando il comando locale non basta ════════════════ */
  var attesaModello = null;
  function chiediAlModello(testo) {
    return new Promise(function (ok) {
      if (typeof globale.bsiOpenAIHub !== 'function') { ok(null); return; }
      if (!document.getElementById('bsi-hub-input')) { try { globale.bsiOpenAIHub('chat'); } catch (e) {} }
      var prova = 0;
      (function invia() {
        var inp = document.getElementById('bsi-hub-input'), s = document.getElementById('bsi-hub-send');
        if (!inp || !s) { if (++prova < 40) return setTimeout(invia, 100); ok(null); return; }
        if (typeof globale._bsiSpectraPronta === 'function' && !globale._bsiSpectraPronta()) { ok({ senzaChiave: true }); return; }
        attesaModello = ok;
        inp.value = testo; s.click();
        /* se il turno non parte (chiave mancante, occupato) non si resta appesi */
        setTimeout(function () { if (attesaModello === ok && document.getElementById('bsi-hub-send') && document.getElementById('bsi-hub-send').style.display !== 'none' && !globale._bsiTurnoInCorso) { attesaModello = null; ok(null); } }, 2500);
      })();
    });
  }
  document.addEventListener('bsi-spectra-risposta', function (e) { var f = attesaModello; attesaModello = null; if (f) f({ testo: e.detail && e.detail.testo || '' }); });
  document.addEventListener('bsi-spectra-stato', function (e) { var s = e.detail && e.detail.stato; if (!hud.el) return; if (s === 'pensa' || s === 'strumenti' || s === 'scrive') stato('pensa', e.detail.dettaglio); });

  /* ═══ 6. LA CONSOLE ════════════════════════════════════════════════════ */
  var hud = { el: null, cv: null, energia: 0, stato: 'attesa', ascolto: false, rec: null, audio: null, analizzatore: null, dati: null, tempo: 0, raf: 0, interim: '' };
  var ultima = '';
  function stileHud() {
    if (document.getElementById('bsiJV-stile')) return;
    var s = document.createElement('style'); s.id = 'bsiJV-stile';
    s.textContent = [
      '#bsiJV{position:fixed;inset:0;z-index:2147483642;display:none;background:radial-gradient(ellipse at center,rgba(5,12,34,.94) 0%,rgba(2,7,14,.98) 70%);color:#d6e2ff;font-family:system-ui,sans-serif;overflow:hidden}',
      '#bsiJV.aperto{display:block}',
      /* i pulsanti flottanti dell\'app non devono restare sopra la console */
      /* visibility e non display: altri script scrivono display in linea con !important */
      'body.bsiJV-aperto #bsi14-fab,body.bsiJV-aperto #bsi105-fab,body.bsiJV-aperto [id$="-fab"],body.bsiJV-aperto #bsi-spectra-fab,body.bsiJV-aperto #bsi-materie,body.bsiJV-aperto #bsiJV-mini,body.bsiJV-aperto #bsi-hub-ov{visibility:hidden!important;pointer-events:none!important}',
      '#bsiJV canvas{position:absolute;inset:0;width:100%;height:100%}',
      '#bsiJV-volto{position:absolute;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 40%,#0e1f4a 0%,#050b1e 70%);box-shadow:0 0 50px rgba(47,107,255,.35),inset 0 0 40px rgba(47,107,255,.3);transform:translate(-50%,-50%);pointer-events:none}',
      '#bsiJV-volto svg{position:absolute;left:0;top:-4%;width:100%;height:118%}',
      '#bsiJV-volto::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(47,107,255,.07) 0 1px,transparent 1px 4px);mix-blend-mode:screen}',
      '#bsiJV[data-stato="pensa"] #bsiJV-volto{box-shadow:0 0 50px rgba(74,61,255,.45),inset 0 0 40px rgba(74,61,255,.3)}',
      '#bsiJV-top{position:absolute;top:0;left:0;right:0;display:flex;gap:10px;align-items:center;padding:12px 16px;font:700 12px/1.2 ui-monospace,monospace;letter-spacing:.12em;color:#8fb0ff;text-transform:uppercase}',
      '#bsiJV-top .sp{flex:1}',
      '.bsiJV-b{background:rgba(12,24,60,.6);border:1px solid rgba(143,176,255,.45);color:#d6e2ff;border-radius:10px;padding:8px 12px;cursor:pointer;font:700 12px/1 system-ui;letter-spacing:.04em}',
      '.bsiJV-b:hover,.bsiJV-b:focus-visible{background:rgba(24,44,110,.75);outline:none;border-color:#8fb0ff}',
      '.bsiJV-b.on{background:rgba(47,107,255,.28);border-color:#2f6bff;color:#fff}',
      '#bsiJV-stato{position:absolute;left:50%;top:calc(50% + min(26vh,190px));transform:translateX(-50%);font:800 13px/1 ui-monospace,monospace;letter-spacing:.35em;color:#2f6bff;text-shadow:0 0 12px #2f6bff;white-space:nowrap}',
      '#bsiJV-pensiero{position:absolute;left:50%;top:calc(50% + min(26vh,190px) + 26px);transform:translateX(-50%);width:min(560px,calc(100vw - 40px));text-align:center;font:italic 500 12.5px/1.45 system-ui;color:#9db4f0;opacity:.85}',
      '#bsiJV-credito{position:absolute;right:12px;bottom:66px;font:500 10px/1.3 system-ui;color:#6f84b8;text-align:right}#bsiJV-credito a{color:#8fa8e0}',
      '@media (max-width:480px){#bsiJV-credito{bottom:110px}}',
      '#bsiJV-tel{position:absolute;left:16px;top:56px;font:600 11px/1.7 ui-monospace,monospace;color:#8fa8e0;letter-spacing:.05em;max-width:42vw;text-shadow:0 0 6px rgba(0,0,0,.8)}',
      '#bsiJV-tel b{color:#d6e2ff;font-weight:700}',
      '#bsiJV-dial{position:absolute;left:50%;bottom:86px;transform:translateX(-50%);width:min(760px,calc(100vw - 32px));max-height:30vh;overflow:auto;text-align:center;font-size:15px;line-height:1.55;text-shadow:0 0 8px rgba(0,0,0,.9)}',
      '#bsiJV-dial .u{color:#9aaed8;font-style:italic;margin-bottom:6px}#bsiJV-dial .a{color:#e6edff}#bsiJV-dial .a b{color:#8fb0ff}',
      '#bsiJV-giu{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:14px}',
      '#bsiJV-in{flex:1;min-width:180px;max-width:520px;background:rgba(6,14,40,.8);border:1px solid rgba(143,176,255,.45);color:#e6edff;border-radius:10px;padding:9px 12px;font-size:14px}',
      '#bsiJV-mini{position:fixed;right:20px;z-index:99991;width:46px;height:46px;border-radius:50%;display:none;align-items:center;justify-content:center;cursor:pointer;',
      ' background:radial-gradient(circle,#2f6bff 0%,#035 60%,#012 100%);border:1px solid #8fb0ff;box-shadow:0 0 18px rgba(47,107,255,.7);color:#fff;font:800 13px/1 ui-monospace,monospace}',
      '#bsiJV-mini.vis{display:flex}',
      '@media (max-width:480px){#bsiJV-tel{max-width:60vw;font-size:10px}#bsiJV-dial{font-size:14px;bottom:104px}}',
      '@media (prefers-reduced-motion:reduce){#bsiJV-stato{text-shadow:none}}'
    ].join('');
    document.head.appendChild(s);
  }
  function costruisciHud() {
    if (hud.el) return hud.el;
    stileHud();
    var d = document.createElement('div'); d.id = 'bsiJV'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<canvas aria-hidden="true"></canvas><div id="bsiJV-volto"></div>' +
      '<div id="bsiJV-top"><span>◈ SPECTRA</span><span class="sp"></span>' +
      '<button class="bsiJV-b" id="bsiJV-voce" type="button"></button><button class="bsiJV-b" id="bsiJV-riduci" type="button"></button><button class="bsiJV-b" id="bsiJV-x" type="button">✕</button></div>' +
      '<div id="bsiJV-tel" aria-live="off"></div><div id="bsiJV-stato" aria-live="polite"></div><div id="bsiJV-pensiero" aria-live="off"></div>' +
      '<div id="bsiJV-dial" aria-live="polite"></div><div id="bsiJV-credito"></div>' +
      '<div id="bsiJV-giu"><button class="bsiJV-b" id="bsiJV-mic" type="button"></button><button class="bsiJV-b" id="bsiJV-occhi" type="button"></button><button class="bsiJV-b" id="bsiJV-senti" type="button"></button><input id="bsiJV-in" autocomplete="off"><button class="bsiJV-b" id="bsiJV-invia" type="button">↵</button><button class="bsiJV-b" id="bsiJV-taci" type="button"></button></div>';
    document.body.appendChild(d);
    var mini = document.createElement('button'); mini.id = 'bsiJV-mini'; mini.type = 'button'; mini.textContent = 'J'; document.body.appendChild(mini);
    mini.onclick = function () { apriHud(); };
    voltoSuiPulsanti();
    hud.el = d; hud.cv = d.querySelector('canvas');
    /* il volto: l'androide in 3D; senza WebGL, il ritratto vettoriale */
    var vo = document.getElementById('bsiJV-volto');
    if (globale.BSISpectraRobot && globale.BSISpectraRobot.disponibile()) {
      globale.BSISpectraRobot.crea(vo).then(function (r) { hud.volto = r; r.stato(hud.stato === 'parla' ? 'attesa' : hud.stato); }).catch(function () { if (globale.BSISpectraVolto) hud.volto = globale.BSISpectraVolto.crea(vo); });
    } else if (globale.BSISpectraVolto) hud.volto = globale.BSISpectraVolto.crea(vo);
    document.getElementById('bsiJV-x').onclick = function () { chiudiHud(false); };
    document.getElementById('bsiJV-riduci').onclick = function () { chiudiHud(true); };
    document.getElementById('bsiJV-mic').onclick = function () { hud.ascolto ? fermaAscolto() : avviaAscolto(); };
    document.getElementById('bsiJV-taci').onclick = function () { taci(); };
    document.getElementById('bsiJV-occhi').onclick = function () { hud.occhi = !hud.occhi; testiHud(); };
    document.getElementById('bsiJV-senti').onclick = function () { sentinella.attiva ? fermaSentinella() : avviaSentinella(); testiHud(); };
    document.getElementById('bsiJV-voce').onclick = function () { voce.attiva = !voce.attiva; if (!voce.attiva) taci(); testiHud(); };
    var inp = document.getElementById('bsiJV-in');
    document.getElementById('bsiJV-invia').onclick = function () { var v = inp.value.trim(); if (v) { inp.value = ''; elabora(v); } };
    inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('bsiJV-invia').click(); } };
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudiHud(false); });
    hud.cv.addEventListener('click', function () { if (voce.inCorso) taci(); else if (!hud.ascolto) avviaAscolto(); });
    /* attribuzione richiesta dalla licenza del modello 3D */
    document.getElementById('bsiJV-credito').innerHTML = t('Volto: ', 'Face: ') + '<a href="https://sketchfab.com/3d-models/noir-8edf174437494f0080b4cd5aa0f0509c" target="_blank" rel="noopener">«Noir»</a> ' + t('di', 'by') + ' Skyfox13 · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> · ' + t('modificato', 'modified');
    testiHud();
    return d;
  }
  function testiHud() {
    if (!hud.el) return;
    var set = function (id, s, a) { var e = document.getElementById(id); if (e) { e.textContent = s; if (a) e.setAttribute('aria-label', a); } };
    set('bsiJV-voce', voce.attiva ? '🔊' : '🔇', voce.attiva ? t('Voce attiva: tocca per silenziare', 'Voice on: tap to mute') : t('Voce spenta: tocca per attivare', 'Voice off: tap to turn on'));
    set('bsiJV-riduci', '▾', t('Riduci a icona', 'Minimise'));
    set('bsiJV-x', '✕', t('Chiudi la console', 'Close the console'));
    set('bsiJV-mic', hud.ascolto ? '🎙️ ' + t('ASCOLTO', 'LISTENING') : '🎙️ ' + t('PARLA', 'TALK'), t('Microfono', 'Microphone'));
    set('bsiJV-taci', '■', t('Interrompi la voce', 'Stop speaking'));
    set('bsiJV-occhi', '👁', hud.occhi ? t('Alla prossima domanda allego lo schermo', 'I will attach the screen to the next question') : t('Allega lo schermo alla prossima domanda', 'Attach the screen to the next question'));
    var oc = document.getElementById('bsiJV-occhi'); if (oc) oc.classList.toggle('on', !!hud.occhi);
    set('bsiJV-senti', '👂', sentinella.attiva ? t('Sempre in ascolto: di\' «Spectra…» anche a console chiusa (tocca per spegnere)', 'Always listening: say "Spectra…" even with the console closed (tap to turn off)') : t('Ascolto sempre attivo: di\' «Spectra…» da qualunque punto dell\'app', 'Always listening: say "Spectra…" anywhere in the app'));
    var se = document.getElementById('bsiJV-senti'); if (se) se.classList.toggle('on', sentinella.attiva);
    var i = document.getElementById('bsiJV-in'); if (i) { i.placeholder = t('Scrivi un comando o una domanda…', 'Type a command or a question…'); i.setAttribute('aria-label', t('Comando per Spectra', 'Command for Spectra')); }
    if (hud.el) hud.el.setAttribute('aria-label', t('Console di Spectra', 'Spectra console'));
    var mic = document.getElementById('bsiJV-mic'); if (mic) mic.classList.toggle('on', hud.ascolto);
    stato(hud.stato);
  }
  var NOMI_STATO = { attesa: ['IN ATTESA', 'STANDBY'], ascolta: ['IN ASCOLTO', 'LISTENING'], pensa: ['ELABORO', 'PROCESSING'], parla: ['PARLO', 'SPEAKING'] };
  function stato(s, dett) {
    hud.stato = s || 'attesa';
    if (hud.volto && hud.stato !== 'parla') hud.volto.stato(hud.stato);
    var e = document.getElementById('bsiJV-stato'); if (e) e.textContent = '◉ ' + t(NOMI_STATO[hud.stato][0], NOMI_STATO[hud.stato][1]) + (dett ? ' · ' + String(dett).toUpperCase().slice(0, 28) : '');
  }
  function telemetria() {
    var e = document.getElementById('bsiJV-tel'); if (!e) return;
    var s = leggiSchermo(), st = studio(), d = new Date(), prov = (document.getElementById('bsi-hub-provsel') || {}).value;
    var righe = [
      [t('ORA', 'TIME'), d.toLocaleTimeString(lingua() === 'en' ? 'en-GB' : 'it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })],
      [t('MATERIA', 'SUBJECT'), nomeMateria(s.materia).toUpperCase()],
      [t('SEZIONE', 'SECTION'), s.titolo ? s.titolo.replace(/^[^\wÀ-ÿ]+/, '').slice(0, 34) : '—'],
      [t('SCHEDA', 'TAB'), s.scheda ? s.scheda.replace(/^[^\wÀ-ÿ]+/, '').slice(0, 30) : '—'],
      [t('DA RIPASSARE', 'TO REVIEW'), st.flashTotali ? st.daRipassare + ' / ' + st.flashTotali + ' flashcard' : '—'],
      [t('ERRORI QUIZ', 'QUIZ ERRORS'), String(st.errori)],
      [t('MODELLO', 'MODEL'), prov ? String(prov).toUpperCase().slice(0, 22) : t('COMANDI LOCALI', 'LOCAL COMMANDS')],
      [t('RETE', 'NETWORK'), navigator.onLine === false ? 'OFFLINE' : 'ONLINE']
    ];
    e.innerHTML = righe.map(function (r) { return esc(r[0]) + ' · <b>' + esc(r[1]) + '</b>'; }).join('<br>');
  }
  function dialogo(u, a, html) {
    var e = document.getElementById('bsiJV-dial'); if (!e) return;
    e.innerHTML = (u ? '<div class="u">« ' + esc(u) + ' »</div>' : '') + (a || html ? '<div class="a">' + (html || esc(a)) + '</div>' : '');
    e.scrollTop = e.scrollHeight;
  }

  /* il reattore: anelli, archi, scansione, spettro della voce */
  function disegna(ts) {
    if (!hud.el || !hud.el.classList.contains('aperto')) { hud.raf = 0; return; }
    var cv = hud.cv, dpr = Math.min(2, globale.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var q = cv.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H);
    var lento = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tt = (ts || 0) / 1000, cx = W / 2, cy = H / 2 - Math.min(40, H * 0.05), R = Math.min(W, H) * 0.27;
    /* il volto sta al centro del reattore */
    var vo = document.getElementById('bsiJV-volto');
    if (vo) { var dia = Math.round(R * 1.18); if (vo._dia !== dia) { vo.style.width = vo.style.height = dia + 'px'; vo._dia = dia; } vo.style.left = cx + 'px'; vo.style.top = cy + 'px'; }
    if (hud.el) hud.el.setAttribute('data-stato', hud.stato);
    /* l'energia: microfono vero se c'e', altrimenti la voce che parla, altrimenti il respiro */
    var spettro = null, e = 0.15 + 0.05 * Math.sin(tt * 1.6);
    if (hud.analizzatore && hud.ascolto) { hud.analizzatore.getByteFrequencyData(hud.dati); spettro = hud.dati; var s = 0; for (var i = 0; i < 48; i++) s += hud.dati[i]; e = Math.max(e, s / (48 * 255) * 1.6); if (hud.volto && hud.volto.ascolto) hud.volto.ascolto(s / (48 * 255) * 2); }
    if (voce.inCorso) { hud.energia = Math.max(0.35, hud.energia * 0.94); e = Math.max(e, hud.energia); }
    if (hud.stato === 'pensa') e = Math.max(e, 0.45 + 0.25 * Math.sin(tt * 7));
    var col = hud.stato === 'pensa' ? [92, 76, 255] : hud.stato === 'parla' ? [56, 140, 255] : [40, 104, 255];
    var rgba = function (a) { return 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a + ')'; };
    /* griglia di fondo e scansione */
    q.strokeStyle = 'rgba(47,107,255,0.05)'; q.lineWidth = 1;
    for (var x = (tt * 12) % 40; x < W; x += 40) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x, H); q.stroke(); }
    for (var y = 0; y < H; y += 40) { q.beginPath(); q.moveTo(0, y); q.lineTo(W, y); q.stroke(); }
    if (!lento) { var sy = (tt * 90) % H; var g = q.createLinearGradient(0, sy - 60, 0, sy); g.addColorStop(0, 'rgba(47,107,255,0)'); g.addColorStop(1, 'rgba(47,107,255,0.08)'); q.fillStyle = g; q.fillRect(0, sy - 60, W, 60); }
    /* bagliore centrale */
    var gl = q.createRadialGradient(cx, cy, 0, cx, cy, R * (1.1 + e * 0.5)); gl.addColorStop(0, rgba(0.55 * e + 0.15)); gl.addColorStop(0.35, rgba(0.12)); gl.addColorStop(1, rgba(0)); q.fillStyle = gl; q.beginPath(); q.arc(cx, cy, R * (1.1 + e * 0.5), 0, 2 * Math.PI); q.fill();
    /* anelli e archi rotanti */
    var anelli = [[0.66, 2, 0.9, 6], [0.74, 1.2, -0.6, 3], [0.84, 1.6, 0.35, 12], [0.92, 1, -0.22, 2], [1.0, 3, 0.15, 24]];
    anelli.forEach(function (a, k) {
      var r = R * a[0] * (1 + e * 0.06 * (k + 1)), rot = lento ? 0 : tt * a[2], n = a[3];
      q.strokeStyle = rgba(0.75 - k * 0.1); q.lineWidth = a[1];
      for (var j = 0; j < n; j++) { var a0 = rot + j * 2 * Math.PI / n, a1 = a0 + (2 * Math.PI / n) * (k % 2 ? 0.55 : 0.75); q.beginPath(); q.arc(cx, cy, r, a0, a1); q.stroke(); }
    });
    /* tacche esterne */
    q.strokeStyle = rgba(0.35); q.lineWidth = 1;
    for (var j = 0; j < 120; j++) { var an = j * Math.PI / 60 + (lento ? 0 : -tt * 0.05), r1 = R * 1.12, r2 = r1 + (j % 10 ? 5 : 12); q.beginPath(); q.moveTo(cx + r1 * Math.cos(an), cy + r1 * Math.sin(an)); q.lineTo(cx + r2 * Math.cos(an), cy + r2 * Math.sin(an)); q.stroke(); }
    /* lo spettro attorno al nucleo */
    var N = 96; q.lineWidth = 2;
    for (var b = 0; b < N; b++) {
      var v = spettro ? spettro[Math.floor(b / N * 64)] / 255 : e * (0.35 + 0.65 * Math.abs(Math.sin(b * 0.37 + tt * (voce.inCorso ? 9 : 2))));
      var an2 = b / N * 2 * Math.PI - Math.PI / 2, ra = R * 0.63, rb = ra + 4 + v * R * 0.22;
      q.strokeStyle = rgba(0.35 + 0.6 * v); q.beginPath(); q.moveTo(cx + ra * Math.cos(an2), cy + ra * Math.sin(an2)); q.lineTo(cx + rb * Math.cos(an2), cy + rb * Math.sin(an2)); q.stroke();
    }
    /* nucleo */
    /* trascrizione dal vivo */
    if (hud.interim) { q.fillStyle = 'rgba(200,240,255,.85)'; q.font = '600 14px system-ui'; q.textAlign = 'center'; q.fillText(hud.interim.slice(-70), cx, cy + R * 1.3); }
    if (!(hud.tempo++ % 30)) telemetria();
    if (!(hud.tempo % 900) && globale.BSISpectraMente) { var pz = globale.BSISpectraMente.pensieri()[0], pe = document.getElementById('bsiJV-pensiero'); if (pe) pe.textContent = pz ? '« ' + pz.testo + ' »' : ''; }
    hud.raf = globale.requestAnimationFrame(disegna);
  }

  /* ═══ 7. L'ASCOLTO ═════════════════════════════════════════════════════ */
  function microfonoAudio() {
    if (hud.analizzatore || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
      var AC = globale.AudioContext || globale.webkitAudioContext; if (!AC) return;
      var ac = new AC(), src = ac.createMediaStreamSource(st), an = ac.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = 0.7; src.connect(an);
      hud.audio = { ac: ac, st: st }; hud.analizzatore = an; hud.dati = new Uint8Array(an.frequencyBinCount);
    }).catch(function () {});
  }
  function avviaAscolto() {
    var Rec = globale.SpeechRecognition || globale.webkitSpeechRecognition;
    if (!Rec) { dialogo('', t('Questo browser non riconosce la voce: scrivimi nel campo qui sotto, oppure usa Chrome o Edge.', 'This browser does not recognise speech: type below, or use Chrome or Edge.')); return; }
    if (voce.inCorso) taci();
    microfonoAudio();
    var r = new Rec(); r.lang = lingua() === 'en' ? 'en-US' : 'it-IT'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    r.onresult = function (ev) {
      var fin = '', tmp = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) { if (ev.results[i].isFinal) fin += ev.results[i][0].transcript; else tmp += ev.results[i][0].transcript; }
      hud.interim = tmp;
      if (fin.trim()) { hud.interim = ''; hud.ascolto = false; testiHud(); elabora(fin.trim()); }
    };
    r.onerror = function (ev) { hud.ascolto = false; stato('attesa'); testiHud(); if (ev.error === 'not-allowed') dialogo('', t('Il microfono è stato negato: puoi scrivere nel campo qui sotto.', 'The microphone was denied: you can type below.')); };
    r.onend = function () { if (hud.ascolto) { hud.ascolto = false; testiHud(); stato('attesa'); } };
    hud.rec = r; hud.ascolto = true; stato('ascolta'); testiHud();
    try { r.start(); } catch (e) { hud.ascolto = false; testiHud(); }
  }
  function fermaAscolto() { hud.ascolto = false; if (hud.rec) { try { hud.rec.abort(); } catch (e) {} } stato('attesa'); testiHud(); }
  /* SEMPRE IN ASCOLTO: anche a console chiusa, una frase che comincia con
     «Spectra» o «Spectra» riapre la console ed esegue il comando. Il
     riconoscimento del browser si ferma da solo dopo un silenzio: si riavvia. */
  var sentinella = { rec: null, attiva: false };
  function comandoDaSentinella(s) {
    var m = norm(s).match(/\b(?:ehi |hey |ok )?(?:spectra|spettra|spektra|spetra)\b[ ,]*(.*)$/);
    return m ? m[1].trim() : null;
  }
  function avviaSentinella() {
    var Rec = globale.SpeechRecognition || globale.webkitSpeechRecognition; if (!Rec) return false;
    var r = new Rec(); r.lang = lingua() === 'en' ? 'en-US' : 'it-IT'; r.continuous = true; r.interimResults = false;
    r.onresult = function (ev) {
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (!ev.results[i].isFinal) continue;
        var c = comandoDaSentinella(ev.results[i][0].transcript); if (c === null) continue;
        if (hud.el && hud.el.classList.contains('aperto') && hud.ascolto) continue;   /* la console sta gia' ascoltando */
        apriHud({ briefing: !c }); if (c) elabora(c);
      }
    };
    r.onend = function () { if (sentinella.attiva) { try { r.start(); } catch (e) {} } };
    r.onerror = function (ev) { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { sentinella.attiva = false; testiHud(); } };
    sentinella.rec = r; sentinella.attiva = true;
    try { r.start(); } catch (e) { sentinella.attiva = false; return false; }
    try { localStorage.setItem('bsi-spectra-sentinella', '1'); } catch (e) {}
    return true;
  }
  function fermaSentinella() { sentinella.attiva = false; if (sentinella.rec) { try { sentinella.rec.abort(); } catch (e) {} } try { localStorage.removeItem('bsi-spectra-sentinella'); } catch (e) {} }

  /* in conversazione a mani libere, finita la risposta si torna ad ascoltare */
  function dopoLaRisposta() { if (hud.el && hud.el.classList.contains('aperto') && hud.maniLibere && !hud.ascolto) setTimeout(function () { if (!voce.inCorso && hud.el.classList.contains('aperto')) avviaAscolto(); }, 350); }

  function elabora(testo) {
    dialogo(testo, '', '');
    var loc = comandoLocale(testo);
    if (globale.BSISpectraMente && !(loc && loc.muto)) { try { globale.BSISpectraMente.ricorda(testo, loc ? 'locale' : 'modello'); } catch (e) {} }
    if (loc) {
      if (loc.muto) return;
      ultima = loc.testo; dialogo(testo, loc.testo, loc.html);
      parla(loc.testo, dopoLaRisposta); if (!voce.attiva) { stato('attesa'); dopoLaRisposta(); }
      return;
    }
    stato('pensa');
    var vedere = hud.occhi || VUOLE_VEDERE.test(norm(testo)); hud.occhi = false;
    (vedere ? allegaSchermo() : Promise.resolve(false)).then(function (allegato) {
      if (allegato) dialogo(testo, t('Guardo lo schermo e ci penso…', 'Looking at the screen and thinking…'));
      return chiediAlModello(testo);
    }).then(function (r) {
      if (!r || r.senzaChiave) {
        var msg = r && r.senzaChiave ? t('Per questa domanda mi serve un fornitore di intelligenza artificiale: aprilo da Spectra, impostazioni. Intanto posso aprire sezioni, calcolare, derivare, convertire unità, cercare costanti e definizioni, interrogarti e muovere i comandi delle simulazioni.', 'For this question I need an AI provider: set it in Spectra settings. Meanwhile I can open sections, calculate, differentiate, convert units, look up constants and definitions, quiz you and move the simulation controls.')
          : t('Non sono riuscito a interpellare il modello. Riprova tra poco.', 'I could not reach the model. Try again shortly.');
        ultima = msg; dialogo(testo, msg); parla(msg, dopoLaRisposta); return;
      }
      ultima = r.testo; dialogo(testo, r.testo.slice(0, 1800));
      parla(r.testo, dopoLaRisposta); if (!voce.attiva) { stato('attesa'); dopoLaRisposta(); }
    });
  }

  /* ═══ 8. APRIRE E CHIUDERE ═════════════════════════════════════════════ */
  function briefing() {
    var Mn = globale.BSISpectraMente;
    if (Mn) {
      var m0 = materia(), s0 = studio(m0), sc0 = leggiSchermo(), pz = Mn.pensieri()[0], q = [Mn.saluto()];
      q.push(t('Siamo in ', 'We are in ') + nomeMateria(m0) + (sc0.titolo ? ', ' + sc0.titolo.replace(/^[^\wÀ-ÿ]+/, '') : '') + '.');
      if (pz) q.push(pz.testo); else if (s0.flashTotali && s0.daRipassare) q.push(t('Hai ', 'You have ') + s0.daRipassare + t(' flashcard da consolidare.', ' flashcards to consolidate.'));
      q.push(t('Dimmi pure.', 'Go ahead.'));
      return q.join(' ');
    }
    var o = new Date().getHours(), saluto = o < 6 ? t('Buonanotte', 'Good night') : o < 13 ? t('Buongiorno', 'Good morning') : o < 18 ? t('Buon pomeriggio', 'Good afternoon') : t('Buonasera', 'Good evening');
    var m = materia(), s = studio(m), sc = leggiSchermo(), p = [saluto + '.', t('Siamo in ', 'We are in ') + nomeMateria(m) + (sc.titolo ? ', ' + sc.titolo.replace(/^[^\wÀ-ÿ]+/, '') : '') + '.'];
    if (s.flashTotali) p.push(t('Hai ', 'You have ') + s.daRipassare + t(' flashcard ancora da consolidare', ' flashcards still to consolidate') + '.');
    if (s.errori) p.push(t('Ci sono ', 'There are ') + s.errori + t(' errori di quiz da rivedere: di\' «ripassa» quando vuoi.', ' quiz errors to review: say "review" when you like.'));
    p.push(t('Come posso aiutarti?', 'How can I help?'));
    return p.join(' ');
  }
  function apriHud(opz) {
    costruisciHud(); registraStrumenti();
    hud.el.classList.add('aperto'); document.body.classList.add('bsiJV-aperto'); document.getElementById('bsiJV-mini').classList.remove('vis');
    hud.maniLibere = !opz || opz.maniLibere !== false;
    testiHud(); telemetria();
    if (!hud.raf) hud.raf = globale.requestAnimationFrame(disegna);
    if (!opz || opz.briefing !== false) { var b = briefing(); ultima = b; dialogo('', b); parla(b, dopoLaRisposta); }
    setTimeout(function () { var i = document.getElementById('bsiJV-in'); if (i && !(globale.matchMedia && globale.matchMedia('(pointer:coarse)').matches)) i.focus(); }, 50);
  }
  function chiudiHud(riduci) {
    if (!hud.el) return;
    hud.el.classList.remove('aperto'); document.body.classList.remove('bsiJV-aperto'); fermaAscolto();
    if (!riduci) { taci(); if (hud.audio) { try { hud.audio.st.getTracks().forEach(function (x) { x.stop(); }); hud.audio.ac.close(); } catch (e) {} hud.audio = null; hud.analizzatore = null; } }
    document.getElementById('bsiJV-mini').classList.toggle('vis', !!riduci);
    var mini = document.getElementById('bsiJV-mini');
    if (mini && riduci) { var sp = document.getElementById('bsi-spectra-fab'); if (sp) { var r = sp.getBoundingClientRect(); mini.style.bottom = Math.round(globale.innerHeight - r.top + 12) + 'px'; mini.style.right = Math.round(globale.innerWidth - r.right) + 'px'; } mini.setAttribute('aria-label', t('Riapri la console di Spectra', 'Reopen the Spectra console')); }
  }

  /* il pulsante nella testata di Spectra, e la parola «Spectra» */
  function pulsanteNelHub() {
    var hd = document.getElementById('bsi-hub-topbar2');
    if (!hd || document.getElementById('bsiJV-apri')) return;
    var b = document.createElement('button'); b.id = 'bsiJV-apri'; b.type = 'button'; b.className = 'bsi-hub-btn ghost compatto';
    b.textContent = '◈ Live'; b.title = t('Console vocale a tutto schermo', 'Full-screen voice console');
    b.onclick = function (e) { e.stopPropagation(); apriHud(); };
    hd.appendChild(b);
  }
  /* L'ICONA DI SPECTRA: la fotografia del robot 3D, fatta una volta e
     conservata; finche' non c'e', un androide stilizzato in vettoriale */
  var ritratto = null;
  try { ritratto = localStorage.getItem('bsi-spectra-ritratto-v3'); } catch (e) {}
  function iconaVettoriale(px) {
    return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="bsiRBf" cx="50%" cy="35%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#b9c6d3"/></radialGradient></defs>' +
      '<path d="M14 58 C16 50 24 47 32 47 C40 47 48 50 50 58 Z" fill="#c9d4df"/><rect x="27" y="40" width="10" height="9" fill="#1b222b"/>' +
      '<ellipse cx="32" cy="27" rx="17" ry="19" fill="url(#bsiRBf)"/><path d="M15.5 30 C16 41 23 46 32 46 C41 46 48 41 48.5 30 Z" fill="#1b222b"/>' +
      '<path d="M15.6 22 Q32 17 48.4 22 L48.4 30 Q32 26 15.6 30 Z" fill="#05090e"/>' +
      '<circle cx="25.5" cy="25" r="2.6" fill="#2f6bff"/><circle cx="38.5" cy="25" r="2.6" fill="#2f6bff"/><circle cx="25.5" cy="25" r="5" fill="#2f6bff" opacity=".25"/><circle cx="38.5" cy="25" r="5" fill="#2f6bff" opacity=".25"/>' +
      '<rect x="26" y="37" width="12" height="2" rx="1" fill="#2f6bff" opacity=".85"/></svg>';
  }
  function icona(px) {
    var dentro = ritratto ? '<img src="' + ritratto + '" alt="" width="' + px + '" height="' + px + '" style="width:100%;height:100%;object-fit:cover">' : iconaVettoriale(px);
    return '<span class="bsiVO-ico" style="display:inline-flex;width:' + px + 'px;height:' + px + 'px;border-radius:50%;overflow:hidden;vertical-align:middle;background:radial-gradient(circle at 50% 40%,#0e1f4a,#050b1e);box-shadow:0 0 0 1px rgba(47,107,255,.55)">' + dentro + '</span>';
  }
  function voltoSuiPulsanti() {
    globale.bsiSpectraIcon = function (px) { return icona(px || 24); };
    var slot = document.querySelector('#bsi-spectra-fab .sp-ico'); if (slot) slot.innerHTML = icona(22);
    var mini = document.getElementById('bsiJV-mini'); if (mini) { mini.innerHTML = icona(44); mini.style.overflow = 'hidden'; mini.style.padding = '0'; }
    if (!ritratto && globale.BSISpectraRobot && globale.BSISpectraRobot.disponibile() && !voltoSuiPulsanti.inCorso) {
      voltoSuiPulsanti.inCorso = true;
      setTimeout(function () {
        globale.BSISpectraRobot.foto(160).then(function (url) {
          if (!url || url.length < 2000) return;
          ritratto = url; try { localStorage.setItem('bsi-spectra-ritratto-v3', url); localStorage.removeItem('bsi-spectra-ritratto-v1'); } catch (e) {}
          voltoSuiPulsanti();
        }).catch(function () {});
      }, 2500);
    }
  }
  function avvia() {
    registraStrumenti();
    [300, 1500, 4000].forEach(function (ms) { setTimeout(voltoSuiPulsanti, ms); });
    globale._bsiContestoSchermo = contestoSchermo;
    try { new MutationObserver(function () { if (document.getElementById('bsi-hub-ov')) pulsanteNelHub(); }).observe(document.body, { childList: true }); } catch (e) {}
    if ('speechSynthesis' in globale) { try { speechSynthesis.onvoiceschanged = function () { voce.scelta = scegliVoce(); }; } catch (e) {} }
    document.addEventListener('bsi-lingua', function () { voce.scelta = null; testiHud(); });
    /* scorciatoia: Ctrl+Shift+J (o Cmd) apre la console */
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) { e.preventDefault(); apriHud(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia); else avvia();

  globale.BSISpectraLive = {
    apri: apriHud, chiudi: chiudiHud, comando: comandoLocale, elabora: elabora, parla: parla, taci: taci,
    schermo: leggiSchermo, contesto: contestoSchermo, studio: studio, cattura: catturaSchermo,
    guida: guida, sentinella: { avvia: avviaSentinella, ferma: fermaSentinella, comando: comandoDaSentinella },
    calcolo: { norm: norm, espressioneParlata: espressioneParlata, perLaVoce: perLaVoce, frasi: frasi, simboloUnita: simboloUnita, impostaControllo: impostaControllo, scegliScheda: scegliScheda, apriSezione: apriSezione },
    STRUMENTI: STRUMENTI, versione: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
