/* ═══════════════════════════════════════════════════════════════════════════
   bsi-studio.js — il motore dei KIT DI STUDIO (fisica, matematica, chimica)
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA FA

   I dati di studio di una materia (riassunti, domande, flashcard, formule,
   glossario) stanno in un file a parte, per esempio bsi-studio-fisica.js,
   che li consegna qui con `BSIStudio.registra('fisica', DATI)`. Se il file
   dei dati arriva PRIMA del motore, si mette in fila in
   `window.BSIStudioCoda`, e il motore la svuota appena si carica.

   Per ogni materia registrata nascono CINQUE sezioni (con BSIFisica.sezione,
   quindi con la stessa intestazione e le stesse schede delle altre):

   · s<pre>riass  🗺️ riassunti: filtro per argomento, ricerca che non bada
                  agli accenti, «segna come studiato», progressi;
   · s<pre>quiz   ❓ quiz: argomento, livello, 10/20/40 domande mescolate
                  (anche le risposte), tasti 1–4 e Invio, punteggio per
                  argomento, ripasso degli errori, storico dei migliori;
   · s<pre>flash  🃏 flashcard con il metodo di Leitner a cinque scatole;
   · s<pre>form   📐 formulario raggruppato per argomento, con «copia»;
   · s<pre>gloss  📖 glossario in ordine alfabetico, con la barra delle
                  lettere e la ricerca.

   Il prefisso <pre> e' 'fis' per la fisica, 'mat' per la matematica, 'chi'
   per la chimica (per esempio: sfisquiz, smatgloss, schiriass).

   I CALCOLI sono puri ed esposti in `BSIStudio.calcolo` (mulberry32,
   mescola, leitner, punteggio), cosi' il banco li prova in node senza
   disegnare niente; `BSIStudio.valida(dati)` controlla un file di dati e
   restituisce i problemi in italiano (un elenco vuoto vuol dire «va bene»).

   SICUREZZA: i testi dei dati sono HTML, ma passano sempre da `pulisci`,
   che tiene solo p, b, i, ul, li, sub, sup, br e toglie TUTTI gli attributi.

   Lo stato di chi studia (studiati, scatole di Leitner, storico dei quiz)
   sta nel localStorage del browser; ogni lettura e scrittura e' protetta,
   perche' in navigazione privata il deposito puo' mancare o essere pieno.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  var VERSIONE = 'v237';
  var MINIMI = { riassunti: 60, quiz: 300, flash: 250, formule: 200, glossario: 250 };
  var COLLEZIONI = ['riassunti', 'quiz', 'flash', 'formule', 'glossario'];
  var CONSENTITI = { p: 1, b: 1, i: 1, ul: 1, li: 1, sub: 1, sup: 1, br: 1 };
  var RE_TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/g;

  /* le materie note: prefisso degli id e nomi per i titoli */
  var NOTE = {
    fisica: { pre: 'fis', di: 'di fisica', en: 'Physics' },
    matematica: { pre: 'mat', di: 'di matematica', en: 'Mathematics' },
    chimica: { pre: 'chi', di: 'di chimica', en: 'Chemistry' }
  };
  function infoMateria(m) {
    if (NOTE[m]) return NOTE[m];
    var s = String(m);
    return { pre: s.slice(0, 3).toLowerCase(), di: 'di ' + s, en: s.charAt(0).toUpperCase() + s.slice(1) };
  }

  var archivio = {};          /* materia → dati uniti */
  var indici = {};            /* materia → { collezione: { chiave: posizione } } per l'unione */
  var descrizioni = {};       /* materia → { id: descrizione passata a F.sezione } */

  /* ═══ testi: normalizzazione, pulizia dell'HTML ═════════════════════════ */
  function testoDi(v) { return Array.isArray(v) ? v.join(' ') : (v == null ? '' : String(v)); }
  function senzaTag(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, ' '); }
  /* per cercare e confrontare: niente tag, niente accenti, minuscole, spazi compatti */
  function norm(s) {
    var x = senzaTag(testoDi(s));
    try { x = x.normalize('NFD'); } catch (e) { }
    return x.replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function esc(t) {
    return String(t).replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* tiene solo i tag consentiti, senza attributi; il resto del testo e' scappato */
  function pulisci(html) {
    var s = String(html == null ? '' : html)
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|iframe|object|embed|template|svg|math|noscript)\b[\s\S]*?<\/\1\s*>/gi, '');
    var out = '', ultimo = 0, m;
    RE_TAG.lastIndex = 0;
    while ((m = RE_TAG.exec(s))) {
      out += esc(s.slice(ultimo, m.index));
      ultimo = RE_TAG.lastIndex;
      var nome = m[2].toLowerCase();
      if (CONSENTITI[nome]) out += nome === 'br' ? (m[1] ? '' : '<br>') : '<' + m[1] + nome + '>';
    }
    return out + esc(s.slice(ultimo));
  }
  function tagVietati(s) {
    var visti = {}, out = [], m, re = new RegExp(RE_TAG.source, 'g');
    while ((m = re.exec(s))) { var n = m[2].toLowerCase(); if (!CONSENTITI[n] && !visti[n]) { visti[n] = 1; out.push(n); } }
    return out;
  }
  /* testo semplice per gli appunti: apici e pedici restano leggibili */
  function inChiaro(html) {
    return String(html == null ? '' : html)
      .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, '^$1').replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, '_$1')
      .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  }
  function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  /* ═══ calcoli puri ══════════════════════════════════════════════════════ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var r = Math.imul(a ^ a >>> 15, 1 | a);
      r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  }
  /* Fisher-Yates su una COPIA: l'originale non si tocca */
  function mescola(arr, rnd) {
    var a = (arr || []).slice(), r = rnd || Math.random;
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  /* Leitner: giusta → una scatola su (al massimo la 5); sbagliata → di nuovo la 1.
     Lo stato e' { id: scatola }; una carta mai vista e' nella scatola 1.
     Si restituisce un oggetto NUOVO, cosi' chi chiama puo' confrontare prima e dopo */
  function leitner(stato, id, giusta) {
    var n = {}, k;
    for (k in (stato || {})) if (Object.prototype.hasOwnProperty.call(stato, k)) n[k] = stato[k];
    var s = +n[id] || 1;
    n[id] = giusta ? Math.min(5, s + 1) : 1;
    return n;
  }
  function perc(g, t) { return t ? Math.round(100 * g / t) : 0; }
  /* risposte: [{ arg, giusta }] → { giuste, totale, perc, perArg: { arg: { giuste, totale, perc } } } */
  function punteggio(risposte) {
    var R = { giuste: 0, totale: 0, perc: 0, perArg: {} };
    (risposte || []).forEach(function (r) {
      var a = r && r.arg != null ? r.arg : '?', P = R.perArg[a] || (R.perArg[a] = { giuste: 0, totale: 0, perc: 0 });
      R.totale++; P.totale++;
      if (r && r.giusta) { R.giuste++; P.giuste++; }
    });
    R.perc = perc(R.giuste, R.totale);
    Object.keys(R.perArg).forEach(function (a) { var P = R.perArg[a]; P.perc = perc(P.giuste, P.totale); });
    return R;
  }

  /* ═══ il controllo dei dati ═════════════════════════════════════════════ */
  function pieno(v) { return typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 && v.every(function (x) { return typeof x === 'string' && x.trim() !== ''; }) : false; }
  function valida(dati, opz) {
    opz = opz || {};
    var M = [];
    function msg(s) { M.push(s); }
    if (!dati || typeof dati !== 'object') return ['i dati mancano o non sono un oggetto'];
    ['argomenti'].concat(COLLEZIONI).forEach(function (c) { if (!Array.isArray(dati[c])) msg('manca l’elenco «' + c + '» (deve essere un array)'); });
    function lista(c) { return Array.isArray(dati[c]) ? dati[c] : []; }

    /* un campo di testo: presente, testo (o coppia di testi), senza ⚠ e senza tag vietati */
    function campo(dove, nome, v, obbligatorio) {
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) { if (obbligatorio) msg(dove + ': manca il campo «' + nome + '»'); return false; }
      if (typeof v !== 'string' && !(Array.isArray(v) && v.every(function (x) { return typeof x === 'string'; }))) { msg(dove + ': il campo «' + nome + '» deve essere un testo'); return false; }
      var s = testoDi(v);
      if (s.indexOf('⚠') >= 0) msg(dove + ': il campo «' + nome + '» contiene il simbolo «⚠»');
      tagVietati(s).forEach(function (tg) { msg(dove + ': tag non ammesso <' + tg + '> nel campo «' + nome + '» (sono ammessi p, b, i, ul, li, sub, sup, br)'); });
      if (!pieno(v)) { if (obbligatorio) msg(dove + ': il campo «' + nome + '» è vuoto'); return false; }
      return true;
    }

    /* gli argomenti */
    var arg = lista('argomenti'), chiavi = {};
    if (Array.isArray(dati.argomenti) && (arg.length < 8 || arg.length > 14)) msg('gli argomenti sono ' + arg.length + ': devono essere da 8 a 14');
    arg.forEach(function (a, i) {
      var dove = 'argomento n. ' + (i + 1);
      if (!a || typeof a.k !== 'string' || !a.k.trim()) { msg(dove + ': manca la chiave «k»'); return; }
      dove += ' («' + a.k + '»)';
      if (chiavi[a.k]) msg(dove + ': chiave duplicata');
      chiavi[a.k] = 1;
      if (!Array.isArray(a.nm) || a.nm.length !== 2 || !pieno(a.nm)) msg(dove + ': il nome «nm» deve essere una coppia [italiano, inglese] di testi non vuoti');
      else if (testoDi(a.nm).indexOf('⚠') >= 0) msg(dove + ': il nome contiene il simbolo «⚠»');
    });
    function controllaArg(dove, v) {
      if (!pieno(v)) msg(dove + ': manca il campo «arg»');
      else if (!chiavi[v]) msg(dove + ': l’argomento «' + v + '» non è dichiarato in «argomenti»');
    }
    function nonOggetto(dove, x) { if (!x || typeof x !== 'object') { msg(dove + ': non è un oggetto'); return true; } return false; }

    /* i riassunti */
    lista('riassunti').forEach(function (r, i) {
      var dove = 'riassunto n. ' + (i + 1);
      if (nonOggetto(dove, r)) return;
      if (pieno(r.tit)) dove += ' («' + testoDi(r.tit).slice(0, 40) + '»)';
      controllaArg(dove, r.arg);
      campo(dove, 'tit', r.tit, true);
      if (campo(dove, 'testo', r.testo, true)) {
        var it = Array.isArray(r.testo) ? r.testo[0] : r.testo, L = String(it).replace(/<[^>]*>/g, '').length;
        if (L < 600 || L > 1500) msg(dove + ': il testo è lungo ' + L + ' caratteri senza tag, deve stare fra 600 e 1500');
      }
    });

    /* le domande */
    var domande = {}, quiz = lista('quiz');
    quiz.forEach(function (q, i) {
      var dove = 'quiz n. ' + (i + 1);
      if (nonOggetto(dove, q)) return;
      controllaArg(dove, q.arg);
      if (q.liv == null) msg(dove + ': manca il campo «liv»');
      else if ([1, 2, 3].indexOf(q.liv) < 0) msg(dove + ': il livello «liv» deve essere 1, 2 o 3 (è ' + JSON.stringify(q.liv) + ')');
      if (campo(dove, 'd', q.d, true)) {
        var nd = norm(q.d);
        if (domande[nd]) msg(dove + ': domanda duplicata (uguale al quiz n. ' + domande[nd] + ')');
        else domande[nd] = i + 1;
      }
      campo(dove, 'sp', q.sp, true);
      if (!Array.isArray(q.r)) { msg(dove + ': manca il campo «r» (l’elenco delle risposte)'); return; }
      if (q.r.length < 2 || q.r.length > 4) msg(dove + ': le risposte sono ' + q.r.length + ', devono essere da 2 a 4');
      var viste = {};
      q.r.forEach(function (x, j) {
        if (!campo(dove, 'r[' + j + ']', x, true)) return;
        var n = norm(x);
        if (viste[n] != null) msg(dove + ': risposte duplicate (la ' + (viste[n] + 1) + 'ª e la ' + (j + 1) + 'ª sono uguali)');
        else viste[n] = j;
      });
      if (q.k == null) msg(dove + ': manca il campo «k» (l’indice della risposta giusta)');
      else if (typeof q.k !== 'number' || q.k % 1 !== 0 || q.k < 0 || q.k >= q.r.length) msg(dove + ': «k» fuori intervallo (' + JSON.stringify(q.k) + '; deve essere fra 0 e ' + (q.r.length - 1) + ')');
    });

    lista('flash').forEach(function (f, i) {
      var dove = 'flashcard n. ' + (i + 1);
      if (nonOggetto(dove, f)) return;
      controllaArg(dove, f.arg); campo(dove, 'f', f.f, true); campo(dove, 'b', f.b, true);
    });
    lista('formule').forEach(function (f, i) {
      var dove = 'formula n. ' + (i + 1);
      if (nonOggetto(dove, f)) return;
      if (pieno(f.nm)) dove += ' («' + testoDi(f.nm).slice(0, 40) + '»)';
      controllaArg(dove, f.arg); campo(dove, 'nm', f.nm, true); campo(dove, 'f', f.f, true); campo(dove, 'note', f.note, false);
    });
    var termini = {};
    lista('glossario').forEach(function (g, i) {
      var dove = 'termine n. ' + (i + 1);
      if (nonOggetto(dove, g)) return;
      if (campo(dove, 't', g.t, true)) {
        var n = norm(g.t);
        dove += ' («' + testoDi(g.t) + '»)';
        if (termini[n]) msg(dove + ': termine duplicato (uguale al n. ' + termini[n] + ')');
        else termini[n] = i + 1;
      }
      campo(dove, 'd', g.d, true);
    });

    /* le quantita': solo per i file veri, non per le prove */
    if (opz.quantita) {
      COLLEZIONI.forEach(function (c) { var n = lista(c).length; if (n < MINIMI[c]) msg('«' + c + '»: sono ' + n + ', ne servono almeno ' + MINIMI[c]); });
      var coperti = {}, livelli = {}, posizioni = {}, validi = 0;
      quiz.forEach(function (q) {
        if (!q) return;
        coperti[q.arg] = 1; livelli[q.liv] = 1;
        if (typeof q.k === 'number') { posizioni[q.k] = (posizioni[q.k] || 0) + 1; validi++; }
      });
      arg.forEach(function (a) { if (a && a.k && !coperti[a.k]) msg('l’argomento «' + a.k + '» non ha nessuna domanda di quiz'); });
      [1, 2, 3].forEach(function (l) { if (!livelli[l]) msg('nei quiz manca il livello ' + l); });
      Object.keys(posizioni).sort().forEach(function (k) {
        var p = posizioni[k] / validi;
        if (p > 0.4) msg('la risposta giusta è nella posizione ' + (+k + 1) + ' (k = ' + k + ') nel ' + Math.round(p * 100) + ' % dei quiz: non deve superare il 40 %');
      });
    }
    return M;
  }

  /* ═══ l'archivio: registra, unisci, leggi ═══════════════════════════════ */
  function chiaveVoce(c, x) {
    if (!x) return '';
    if (c === 'riassunti') return x.arg + '|' + norm(x.tit);
    if (c === 'quiz') return norm(x.d);
    if (c === 'flash') return norm(x.f) + '|' + norm(x.b);
    if (c === 'formule') return x.arg + '|' + norm(x.nm) + '|' + norm(x.f);
    return norm(x.t);
  }
  function registra(materia, dati) {
    if (!materia || !dati || typeof dati !== 'object') return false;
    var A = archivio[materia], I = indici[materia];
    if (!A) {
      A = archivio[materia] = { argomenti: [], riassunti: [], quiz: [], flash: [], formule: [], glossario: [] };
      I = indici[materia] = { argomenti: {}, riassunti: {}, quiz: {}, flash: {}, formule: {}, glossario: {} };
    }
    /* unione: una voce con la stessa chiave sostituisce la precedente, le altre si aggiungono */
    (dati.argomenti || []).forEach(function (a) {
      if (!a || !a.k) return;
      if (I.argomenti[a.k] != null) A.argomenti[I.argomenti[a.k]] = a;
      else { I.argomenti[a.k] = A.argomenti.length; A.argomenti.push(a); }
    });
    COLLEZIONI.forEach(function (c) {
      (dati[c] || []).forEach(function (x) {
        if (!x) return;
        var k = chiaveVoce(c, x);
        if (I[c][k] != null) A[c][I[c][k]] = x;
        else { I[c][k] = A[c].length; A[c].push(x); }
      });
    });
    preparaSezioni(materia);
    return true;
  }
  function idSezioni(materia) {
    var p = infoMateria(materia).pre;
    return ['s' + p + 'riass', 's' + p + 'quiz', 's' + p + 'flash', 's' + p + 'form', 's' + p + 'gloss'];
  }

  /* ═══ il deposito del browser ═══════════════════════════════════════════ */
  var giro = 0;   /* sale a ogni scrittura: le schede ridisegnano solo se qualcosa e' cambiato */
  function chiaveDeposito(m, nome) { return 'bsi-studio:' + m + ':' + nome; }
  function leggi(m, nome, def) {
    try { var v = globale.localStorage.getItem(chiaveDeposito(m, nome)); if (v == null) return def; var o = JSON.parse(v); return o == null ? def : o; }
    catch (e) { return def; }
  }
  function scrivi(m, nome, val) {
    giro++;
    try { globale.localStorage.setItem(chiaveDeposito(m, nome), JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  /* ═══ l'interfaccia ═════════════════════════════════════════════════════ */
  var F = null;
  function t(it, en) { return F ? F.t(it, en) : it; }
  function tt(c) { return F ? F.tt(c) : (Array.isArray(c) ? c[0] : c); }
  function tx(v) { return Array.isArray(v) ? tt(v) : (v == null ? '' : String(v)); }
  function el(tag, attr, figli) { return F.el(tag, attr, figli); }
  var MENO_MOTO = false;
  try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }

  var STILE = [
    '.bsiST-intro{font-size:.86rem;color:#aebccd;line-height:1.6;margin:0 0 10px}',
    '.bsiST-filtri{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:4px 12px;align-items:end;margin-bottom:6px}',
    '.bsiST-filtri>*{min-width:0}',
    '.bsiFX input[type=search]{width:100%;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px 8px;font-size:.85rem;font-family:inherit;box-sizing:border-box}',
    '.bsiST-conta{font-size:.8rem;color:#8fa3ba;margin:4px 0 10px}',
    '.bsiST-vuoto{font-size:.88rem;color:#aebccd;background:#0a1628;border:1px dashed #1a3050;border-radius:10px;padding:14px;line-height:1.55}',
    '.bsiST-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:12px}',
    '.bsiST-scheda{background:#0a1628;border:1px solid #1a3050;border-radius:12px;padding:12px 14px;min-width:0;overflow-wrap:anywhere}',
    '.bsiST-scheda.fatto{border-color:rgba(94,234,212,.55)}',
    '.bsiST-scheda h3{margin:0 0 4px;font-size:1rem;color:#e6fffb;line-height:1.35}',
    '.bsiST-corpo{font-size:.86rem;color:#c9d3df;line-height:1.6}',
    '.bsiST-corpo p{margin:.4em 0}.bsiST-corpo ul{margin:.4em 0;padding-left:1.3em}',
    '.bsiST-etich{display:inline-block;font-size:.72rem;font-weight:700;color:#7dd3fc;background:rgba(125,211,252,.08);border:1px solid rgba(125,211,252,.3);border-radius:10px;padding:1px 8px;margin:0 4px 4px 0}',
    '.bsiST-bott-piccolo{font-size:.78rem!important;padding:5px 10px!important}',
    '.bsiST-bott-ok{border-color:#5eead4;color:#081522!important;background:#5eead4!important}',
    '.bsiST-riga{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;margin:6px 0}',
    '.bsiST-barra{height:10px;background:#081522;border:1px solid #1a3050;border-radius:6px;overflow:hidden;margin:3px 0 8px}',
    '.bsiST-barra>span{display:block;height:100%;background:linear-gradient(90deg,#14b8a6,#5eead4);border-radius:6px}',
    '.bsiST-prog{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;font-size:.84rem;color:#c9d3df;align-items:baseline}',
    '.bsiST-prog .bsiST-barra{grid-column:1/-1}',
    '.bsiST-prog b{font-variant-numeric:tabular-nums;color:#e6fffb}',
    '.bsiST-quiz{margin-top:12px}',
    '.bsiST-testa{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 10px;font-size:.8rem;color:#8fa3ba}',
    '.bsiST-domanda{font-size:1.02rem;font-weight:700;color:#e6fffb;line-height:1.5;margin:8px 0 10px;outline:none;overflow-wrap:anywhere}',
    '.bsiST-opz{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;background:#0a1628;color:#dbe6f2;border:1px solid #1a3050;border-radius:10px;padding:10px 12px;margin:0 0 8px;font:inherit;font-size:.9rem;line-height:1.45;cursor:pointer;min-height:44px;box-sizing:border-box;overflow-wrap:anywhere}',
    '.bsiST-opz:hover:not(:disabled){border-color:#5eead4}',
    '.bsiST-opz:disabled{cursor:default}',
    '.bsiST-opz>kbd{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:#081522;border:1px solid #34465f;font:700 .78rem/1 system-ui,sans-serif;color:#9fb1c6}',
    '.bsiST-opz>span{min-width:0}',
    '.bsiST-opz.giusta{border-color:#5eead4;background:rgba(94,234,212,.12)}',
    '.bsiST-opz.sbagliata{border-color:#ff8a80;background:rgba(255,138,128,.10)}',
    '.bsiST-esito{min-height:1.2em;font-size:.88rem;line-height:1.55;margin:4px 0 8px;color:#c9d3df;overflow-wrap:anywhere}',
    '.bsiST-esito .si{color:#5eead4;font-weight:800}.bsiST-esito .no{color:#ff8a80;font-weight:800}',
    '.bsiST-tasti{font-size:.76rem;color:#8494a8;margin-top:4px}',
    '.bsiST-grande{font-size:1.6rem;font-weight:800;color:#e6fffb;margin:6px 0}',
    '.bsiST-tab{width:100%;border-collapse:collapse;font-size:.84rem;margin:8px 0;table-layout:fixed}',
    '.bsiST-tab td,.bsiST-tab th{border-bottom:1px solid #16263d;padding:5px 6px;text-align:left;overflow-wrap:anywhere;vertical-align:top}',
    '.bsiST-tab th{color:#9fb1c6;font-weight:700}',
    '.bsiST-tab td.n,.bsiST-tab th.n{text-align:right;font-variant-numeric:tabular-nums;width:5.5em}',
    '.bsiST-errori{margin:8px 0;padding-left:1.2em;font-size:.84rem;line-height:1.55;color:#c9d3df}',
    '.bsiST-errori li{margin-bottom:8px;overflow-wrap:anywhere}',
    /* la carta che si gira: le due facce stanno nella stessa cella della griglia, cosi' l'altezza e' quella della piu' alta */
    '.bsiST-carta{perspective:1200px;cursor:pointer;margin:10px 0;border-radius:14px;outline:none}',
    '.bsiST-carta:focus-visible{box-shadow:0 0 0 3px rgba(94,234,212,.55)}',
    '.bsiST-interno{display:grid;transition:transform .55s cubic-bezier(.2,.7,.2,1);transform-style:preserve-3d}',
    '.bsiST-carta.girata .bsiST-interno{transform:rotateY(180deg)}',
    '.bsiST-faccia{grid-area:1/1;-webkit-backface-visibility:hidden;backface-visibility:hidden;min-height:170px;display:flex;flex-direction:column;justify-content:center;gap:8px;padding:18px;border-radius:14px;border:1px solid #1a3050;background:#0a1628;box-sizing:border-box;min-width:0;overflow-wrap:anywhere}',
    '.bsiST-faccia .bsiST-cosa{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#8494a8}',
    '.bsiST-faccia .bsiST-testo{font-size:1.02rem;line-height:1.55;color:#e6fffb}',
    '.bsiST-retro{transform:rotateY(180deg);background:#0d1f36;border-color:rgba(94,234,212,.6)}',
    '@media (prefers-reduced-motion:reduce){.bsiST-interno{transition:none}}',
    '.bsiST-gruppo{margin:16px 0 6px;font-size:1rem;color:#5eead4;border-bottom:1px solid #1a3050;padding-bottom:4px;scroll-margin-top:70px;outline:none}',
    '.bsiST-formula{background:#081522;border:1px solid #1a3050;border-radius:8px;padding:8px 12px;margin:6px 0;font-family:"Cambria Math",Georgia,serif;color:#e6fffb;font-size:1rem;overflow-wrap:anywhere}',
    '.bsiST-lettere{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 10px;position:sticky;top:0;z-index:2;background:#050d18;padding:6px 0}',
    '.bsiST-lettere button{min-width:32px;min-height:32px;border:1px solid #1a3050;background:#0a1628;color:#5eead4;border-radius:6px;font:700 .82rem/1 system-ui,sans-serif;cursor:pointer;padding:0 6px}',
    '.bsiST-lettere button:disabled{color:#34465f;cursor:default}',
    '.bsiST-gloss{margin:0}',
    '.bsiST-gloss dt{font-weight:800;color:#e6fffb;margin-top:10px;overflow-wrap:anywhere}',
    '.bsiST-gloss dd{margin:2px 0 0;color:#c9d3df;font-size:.86rem;line-height:1.55;overflow-wrap:anywhere}',
    '.bsiST-nascosto{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'
  ].join('\n');
  function stile() {
    if (document.getElementById('bsiST-stile')) return;
    var s = document.createElement('style'); s.id = 'bsiST-stile'; s.textContent = STILE;
    document.head.appendChild(s);
  }

  /* piccoli mattoni */
  function intro(div, coppia) { var p = el('p', { 'class': 'bsiST-intro', testo: tt(coppia) }); div.appendChild(p); return p; }
  function nomeArg(m, k) {
    var A = archivio[m]; if (!A) return k;
    for (var i = 0; i < A.argomenti.length; i++) if (A.argomenti[i].k === k) return tx(A.argomenti[i].nm);
    return k;
  }
  function vociArg(m) { return [['', ['Tutti gli argomenti', 'All topics']]].concat(archivio[m].argomenti.map(function (a) { return [a.k, a.nm]; })); }
  function campoCerca(padre, etichetta, segnaposto, cambia) {
    var i = el('input', { type: 'search', 'aria-label': tt(etichetta), placeholder: tt(segnaposto), autocomplete: 'off', spellcheck: 'false' });
    i.addEventListener('input', function () { cambia(i.value); });
    padre.appendChild(el('div', { 'class': 'bsiFX-cursore' }, [el('label', null, [el('span', { testo: tt(etichetta) })]), i]));
    return i;
  }
  function barra(p, etichetta) {
    var v = Math.max(0, Math.min(100, Math.round(p)));
    return el('div', { 'class': 'bsiST-barra', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(v), 'aria-label': etichetta || (v + ' %') }, [el('span', { style: 'width:' + v + '%' })]);
  }
  function trova(testi, q) {
    var parole = norm(q).split(' ').filter(Boolean);
    if (!parole.length) return true;
    var s = norm(testi.join(' '));
    return parole.every(function (p) { return s.indexOf(p) >= 0; });
  }
  /* un pulsante che chiede conferma al secondo clic, senza finestre modali */
  function azzeratore(padre, testo, azione) {
    var armato = false, tm = null;
    var b = F.bottone(padre, testo, function () {
      if (!armato) { armato = true; b.textContent = t('Sicuro? Clic di nuovo per azzerare', 'Sure? Click again to reset'); tm = setTimeout(function () { armato = false; b.textContent = tt(testo); }, 4000); return; }
      clearTimeout(tm); armato = false; b.textContent = tt(testo); azione();
    });
    return b;
  }
  function seme() { return ((Date.now() & 0x7fffffff) ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0; }
  /* i tasti valgono solo se il pannello e' visibile e non si sta scrivendo in un campo */
  function tastoUtile(e, div) {
    if (e.ctrlKey || e.metaKey || e.altKey || div.offsetParent === null) return false;
    var tg = e.target && e.target.tagName;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(tg) || (e.target && e.target.isContentEditable)) return false;
    return !e.target || e.target === document.body || e.target === document.documentElement || div.contains(e.target);
  }
  function copia(testo, fatto) {
    function vecchio() {
      var ok = false;
      try {
        var a = document.createElement('textarea'); a.value = testo; a.setAttribute('readonly', '');
        a.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
        document.body.appendChild(a); a.select(); ok = document.execCommand('copy'); document.body.removeChild(a);
      } catch (e) { ok = false; }
      fatto(ok);
    }
    try {
      if (globale.navigator && navigator.clipboard && navigator.clipboard.writeText && globale.isSecureContext !== false) {
        navigator.clipboard.writeText(testo).then(function () { fatto(true); }, vecchio);
        return;
      }
    } catch (e) { }
    vecchio();
  }
  function ridisegnaSeServe(div, disegna) {
    var ultimo = -1;
    function f() { if (ultimo === giro) return; ultimo = giro; disegna(); }
    div._ridisegna = [f];
    f();
  }

  /* ═══ 1. RIASSUNTI ══════════════════════════════════════════════════════ */
  function schedaRiassunti(m, div) {
    var A = archivio[m], st = { arg: '', q: '' };
    intro(div, ['Le schede riassuntive della materia, argomento per argomento. Scegli un argomento o cerca una parola (la ricerca non bada ad accenti e maiuscole); quando hai studiato una scheda segnala con «segna come studiato»: i progressi restano su questo dispositivo.',
      'The summary cards of the subject, topic by topic. Pick a topic or search for a word (the search ignores accents and case); once you have studied a card, mark it with “mark as studied”: progress is kept on this device.']);
    var filtri = el('div', { 'class': 'bsiST-filtri' }); div.appendChild(filtri);
    F.scelta(filtri, ['Argomento', 'Topic'], vociArg(m), '', function (v) { st.arg = v; disegna(); });
    campoCerca(filtri, ['Cerca nei riassunti', 'Search the summaries'], ['una parola, per esempio energia', 'a word, e.g. energy'], function (v) { st.q = v; disegna(); });
    var conta = el('div', { 'class': 'bsiST-conta', role: 'status', 'aria-live': 'polite' }), lista = el('div', { 'class': 'bsiST-lista' });
    div.appendChild(conta); div.appendChild(lista);
    function idR(r) { return 'r' + hash(r.arg + '|' + testoDi(r.tit)); }
    function scheda(r, studiati) {
      var id = idR(r), fatto = !!studiati[id];
      var b = el('button', { type: 'button', 'class': 'bsiFX-bott bsiST-bott-piccolo' });
      var c = el('article', { 'class': 'bsiST-scheda' + (fatto ? ' fatto' : '') }, [
        el('span', { 'class': 'bsiST-etich', testo: nomeArg(m, r.arg) }),
        el('h3', { testo: tx(r.tit) }),
        el('div', { 'class': 'bsiST-corpo', html: pulisci(tx(r.testo)) }),
        el('div', { 'class': 'bsiST-riga' }, [b])
      ]);
      function etichetta() {
        b.textContent = fatto ? t('✔ Studiato · annulla', '✔ Studied · undo') : t('☐ Segna come studiato', '☐ Mark as studied');
        b.setAttribute('aria-pressed', fatto ? 'true' : 'false');
        c.classList.toggle('fatto', fatto);
      }
      b.addEventListener('click', function () {
        var S = leggi(m, 'studiati', {});
        fatto = !fatto;
        if (fatto) S[id] = Date.now(); else delete S[id];
        scrivi(m, 'studiati', S); etichetta();
        conta.textContent = testoConta(ultimi, S);
      });
      etichetta();
      return c;
    }
    var ultimi = [];
    function testoConta(voci, S) {
      var n = voci.filter(function (r) { return S[idR(r)]; }).length;
      return voci.length + t(' schede mostrate su ', ' cards shown out of ') + A.riassunti.length + ' · ' + n + t(' già studiate fra queste', ' already studied among these');
    }
    function disegna() {
      var S = leggi(m, 'studiati', {});
      ultimi = A.riassunti.filter(function (r) { return (!st.arg || r.arg === st.arg) && trova([tx(r.tit), tx(r.testo), nomeArg(m, r.arg)], st.q); });
      conta.textContent = testoConta(ultimi, S);
      lista.innerHTML = '';
      ultimi.forEach(function (r) { lista.appendChild(scheda(r, S)); });
      if (!ultimi.length) lista.appendChild(el('p', { 'class': 'bsiST-vuoto', testo: t('Nessun riassunto corrisponde alla ricerca. Prova con una parola più corta, togli il filtro dell’argomento oppure cerca un sinonimo: la ricerca guarda titoli e testi.', 'No summary matches the search. Try a shorter word, remove the topic filter or look for a synonym: the search looks at titles and texts.') }));
    }
    ridisegnaSeServe(div, disegna);
  }

  function schedaProgressi(m, div) {
    var A = archivio[m];
    intro(div, ['Quante schede riassuntive hai segnato come studiate, argomento per argomento. Una scheda segnata non è un esame superato: è un promemoria. Per verificare davvero, passa al quiz della stessa materia.',
      'How many summary cards you have marked as studied, topic by topic. A marked card is not a passed exam: it is a reminder. To check for real, move on to the quiz of the same subject.']);
    var corpo = el('div'); div.appendChild(corpo);
    var piede = el('div', { 'class': 'bsiST-riga' }); div.appendChild(piede);
    azzeratore(piede, ['↺ Azzera i progressi', '↺ Reset progress'], function () { scrivi(m, 'studiati', {}); disegna(); });
    function disegna() {
      var S = leggi(m, 'studiati', {}), tot = 0, fatti = 0;
      corpo.innerHTML = '';
      var g = el('div', { 'class': 'bsiST-prog' });
      A.argomenti.forEach(function (a) {
        var voci = A.riassunti.filter(function (r) { return r.arg === a.k; });
        var n = voci.filter(function (r) { return S['r' + hash(r.arg + '|' + testoDi(r.tit))]; }).length;
        tot += voci.length; fatti += n;
        g.appendChild(el('span', { testo: tx(a.nm) }));
        g.appendChild(el('b', { testo: n + ' / ' + voci.length }));
        g.appendChild(barra(perc(n, voci.length), tx(a.nm) + ': ' + perc(n, voci.length) + ' %'));
      });
      corpo.appendChild(el('div', { 'class': 'bsiST-grande', testo: fatti + ' / ' + tot + ' · ' + perc(fatti, tot) + ' %' }));
      corpo.appendChild(barra(perc(fatti, tot), t('schede studiate in tutto', 'cards studied overall')));
      corpo.appendChild(g);
    }
    ridisegnaSeServe(div, disegna);
  }

  /* ═══ 2. QUIZ ═══════════════════════════════════════════════════════════ */
  var NOMI_LIV = { 1: ['base', 'basic'], 2: ['intermedio', 'intermediate'], 3: ['avanzato', 'advanced'] };
  function schedaQuiz(m, div) {
    var A = archivio[m], st = { arg: '', liv: '0', n: '10' }, R = null;
    intro(div, ['Scegli argomento, livello e numero di domande, poi premi «Inizia». Domande e risposte sono mescolate a ogni giro. Rispondi con un clic o con i tasti 1–4, vai avanti con Invio: dopo ogni risposta trovi la spiegazione, alla fine il punteggio per argomento e il ripasso degli errori.',
      'Pick topic, level and number of questions, then press “Start”. Questions and answers are shuffled every round. Answer with a click or the keys 1–4, move on with Enter: after each answer you get the explanation, at the end the score per topic and a review of your mistakes.']);
    var filtri = el('div', { 'class': 'bsiST-filtri' }); div.appendChild(filtri);
    F.scelta(filtri, ['Argomento', 'Topic'], vociArg(m), '', function (v) { st.arg = v; disponibili(); });
    F.scelta(filtri, ['Livello', 'Level'], [['0', ['Tutti i livelli', 'All levels']], ['1', ['1 · base', '1 · basic']], ['2', ['2 · intermedio', '2 · intermediate']], ['3', ['3 · avanzato', '3 · advanced']]], '0', function (v) { st.liv = v; disponibili(); });
    F.scelta(filtri, ['Domande', 'Questions'], [['10', ['10 domande', '10 questions']], ['20', ['20 domande', '20 questions']], ['40', ['40 domande', '40 questions']]], '10', function (v) { st.n = v; disponibili(); });
    var info = el('div', { 'class': 'bsiST-conta' }); div.appendChild(info);
    var riga = el('div', { 'class': 'bsiST-riga' }); div.appendChild(riga);
    var bInizia = F.bottone(riga, ['▶ Inizia il quiz', '▶ Start the quiz'], function () { inizia(scegli(), false); });
    var area = el('div', { 'class': 'bsiST-quiz' }); div.appendChild(area);

    function insieme() { return A.quiz.filter(function (q) { return (!st.arg || q.arg === st.arg) && (st.liv === '0' || String(q.liv) === st.liv); }); }
    function disponibili() {
      var n = insieme().length;
      info.textContent = n + t(' domande disponibili con questi filtri', ' questions available with these filters') + (n && n < +st.n ? t(': il quiz ne userà ' + n, ': the quiz will use ' + n) : '');
      bInizia.disabled = !n;
    }
    function scegli() { return mescola(insieme(), mulberry32(seme())).slice(0, +st.n); }
    function inizia(domande, ripasso) {
      if (!domande.length) return;
      var rnd = mulberry32(seme());
      R = {
        domande: domande.map(function (q) {
          var ordine = mescola(q.r.map(function (_, j) { return j; }), rnd);
          return { q: q, ordine: ordine, giusta: ordine.indexOf(q.k) };
        }),
        i: 0, scelta: null, risposte: [], ripasso: ripasso, arg: st.arg, liv: st.liv, fase: 'domanda'
      };
      mostra();
    }
    var els = {};
    function mostra() {
      var D = R.domande[R.i], q = D.q;
      area.innerHTML = '';
      area.appendChild(el('div', { 'class': 'bsiST-testa' }, [
        el('span', { testo: t('Domanda ', 'Question ') + (R.i + 1) + t(' di ', ' of ') + R.domande.length + (R.ripasso ? t(' · ripasso degli errori', ' · mistakes review') : '') }),
        el('span', { testo: nomeArg(m, q.arg) + ' · ' + t('livello ', 'level ') + q.liv + (NOMI_LIV[q.liv] ? ' (' + tt(NOMI_LIV[q.liv]) + ')' : '') })
      ]));
      area.appendChild(barra(100 * R.i / R.domande.length, t('avanzamento del quiz', 'quiz progress')));
      els.dom = el('div', { 'class': 'bsiST-domanda', tabindex: '-1', html: pulisci(tx(q.d)) });
      area.appendChild(els.dom);
      els.opz = D.ordine.map(function (j, pos) {
        var b = el('button', { type: 'button', 'class': 'bsiST-opz', onclick: function () { rispondi(pos); } }, [el('kbd', { testo: String(pos + 1) }), el('span', { html: pulisci(tx(q.r[j])) })]);
        area.appendChild(b); return b;
      });
      els.esito = el('div', { 'class': 'bsiST-esito', role: 'status', 'aria-live': 'polite' });
      area.appendChild(els.esito);
      var nav = el('div', { 'class': 'bsiST-riga' }); area.appendChild(nav);
      els.avanti = F.bottone(nav, R.i + 1 < R.domande.length ? ['Avanti ▶', 'Next ▶'] : ['🏁 Vedi il risultato', '🏁 See the result'], avanti);
      els.avanti.disabled = true;
      area.appendChild(el('div', { 'class': 'bsiST-tasti', testo: t('Tasti: 1–' + els.opz.length + ' per rispondere, Invio per andare avanti.', 'Keys: 1–' + els.opz.length + ' to answer, Enter to move on.') }));
      try { els.dom.focus({ preventScroll: true }); } catch (e) { }
    }
    function rispondi(pos) {
      if (!R || R.fase !== 'domanda' || R.scelta !== null) return;
      var D = R.domande[R.i], q = D.q, giusta = pos === D.giusta;
      R.scelta = pos;
      R.risposte.push({ arg: q.arg, giusta: giusta, q: q });
      els.opz.forEach(function (b, j) {
        b.disabled = true;
        if (j === D.giusta) b.classList.add('giusta');
        else if (j === pos) b.classList.add('sbagliata');
        if (j === pos) b.setAttribute('aria-pressed', 'true');
      });
      els.esito.innerHTML = (giusta ? '<span class="si">' + esc(t('✅ Giusto!', '✅ Correct!')) + '</span> '
        : '<span class="no">' + esc(t('❌ Sbagliato.', '❌ Wrong.')) + '</span> ' + esc(t('La risposta giusta è la ', 'The right answer is number ')) + (D.giusta + 1) + ': «' + pulisci(tx(q.r[q.k])) + '». ')
        + pulisci(tx(q.sp));
      els.avanti.disabled = false;
      try { els.avanti.focus({ preventScroll: true }); } catch (e) { }
    }
    function avanti() {
      if (!R || R.fase !== 'domanda' || R.scelta === null) return;
      R.i++; R.scelta = null;
      if (R.i >= R.domande.length) fine(); else mostra();
    }
    function fine() {
      R.fase = 'fine';
      var P = punteggio(R.risposte), errori = R.risposte.filter(function (r) { return !r.giusta; });
      if (!R.ripasso) {
        var S = leggi(m, 'quiz', []);
        if (!Array.isArray(S)) S = [];
        S.push({ quando: Date.now(), arg: R.arg, liv: R.liv, giuste: P.giuste, totale: P.totale, perc: P.perc, perArg: P.perArg });
        scrivi(m, 'quiz', S.slice(-60));
      } else giro++;
      area.innerHTML = '';
      area.appendChild(barra(100, t('quiz finito', 'quiz finished')));
      var titolo = el('div', { 'class': 'bsiST-grande', tabindex: '-1', testo: '🏁 ' + P.giuste + ' / ' + P.totale + ' · ' + P.perc + ' %' });
      area.appendChild(titolo);
      area.appendChild(el('p', { 'class': 'bsiST-intro', role: 'status', testo: P.perc >= 90 ? t('Ottimo: l’argomento è sotto controllo. Prova un livello più alto.', 'Excellent: the topic is under control. Try a higher level.')
        : P.perc >= 60 ? t('Bene, ma c’è ancora qualcosa da ripassare: guarda gli errori qui sotto e rifalli.', 'Good, but something still needs review: look at the mistakes below and redo them.')
        : t('Serve un ripasso: rileggi i riassunti degli argomenti più deboli, poi ripassa gli errori.', 'A review is needed: reread the summaries of the weakest topics, then review your mistakes.') }));
      var tab = el('table', { 'class': 'bsiST-tab' });
      tab.appendChild(el('tr', null, [el('th', { testo: t('Argomento', 'Topic') }), el('th', { 'class': 'n', testo: t('Giuste', 'Right') }), el('th', { 'class': 'n', testo: '%' })]));
      Object.keys(P.perArg).forEach(function (a) {
        var x = P.perArg[a];
        tab.appendChild(el('tr', null, [el('td', { testo: nomeArg(m, a) }), el('td', { 'class': 'n', testo: x.giuste + ' / ' + x.totale }), el('td', { 'class': x.perc >= 60 ? 'n bsiFX-ok' : 'n bsiFX-ko', testo: x.perc + ' %' })]));
      });
      area.appendChild(tab);
      var nav = el('div', { 'class': 'bsiST-riga' }); area.appendChild(nav);
      if (errori.length) {
        F.bottone(nav, ['🔁 Ripassa gli errori (' + errori.length + ')', '🔁 Review the mistakes (' + errori.length + ')'], function () { inizia(errori.map(function (r) { return r.q; }), true); });
        var ul = el('ol', { 'class': 'bsiST-errori' });
        errori.forEach(function (r) {
          ul.appendChild(el('li', { html: '<b>' + pulisci(tx(r.q.d)) + '</b><br>' + esc(t('Risposta giusta: ', 'Right answer: ')) + pulisci(tx(r.q.r[r.q.k])) + '<br>' + pulisci(tx(r.q.sp)) }));
        });
        area.appendChild(el('div', { 'class': 'bsiST-conta', testo: t('Le domande sbagliate, con la risposta giusta e la spiegazione:', 'The questions you got wrong, with the right answer and the explanation:') }));
        area.appendChild(ul);
      }
      F.bottone(nav, ['▶ Nuovo quiz', '▶ New quiz'], function () { inizia(scegli(), false); });
      try { titolo.focus({ preventScroll: true }); } catch (e) { }
    }
    function tasti(e) {
      if (!div.isConnected) { document.removeEventListener('keydown', tasti); return; }
      if (!R || R.fase !== 'domanda' || !tastoUtile(e, div)) return;
      if (/^[1-9]$/.test(e.key)) {
        var p = +e.key - 1;
        if (p < els.opz.length && R.scelta === null) { e.preventDefault(); rispondi(p); }
      } else if (e.key === 'Enter' && R.scelta !== null) { e.preventDefault(); avanti(); }
    }
    document.addEventListener('keydown', tasti);
    disponibili();
    area.appendChild(el('p', { 'class': 'bsiST-vuoto', testo: t('Il quiz non è ancora cominciato. Le domande sono ' + A.quiz.length + ', su tre livelli: 1 per i concetti di base, 2 per l’applicazione, 3 per i problemi che chiedono più passaggi.', 'The quiz has not started yet. There are ' + A.quiz.length + ' questions on three levels: 1 for basic concepts, 2 for application, 3 for problems that need several steps.') }));
  }

  function schedaStorico(m, div) {
    intro(div, ['I tuoi risultati nei quiz di questa materia, salvati su questo dispositivo: il miglior punteggio per ogni argomento (sia nei quiz su un solo argomento sia in quelli misti) e gli ultimi tentativi. I ripassi degli errori non contano nei record.',
      'Your quiz results for this subject, saved on this device: the best score for each topic (both in single-topic and mixed quizzes) and the latest attempts. Mistake reviews do not count towards the records.']);
    var corpo = el('div'); div.appendChild(corpo);
    var piede = el('div', { 'class': 'bsiST-riga' }); div.appendChild(piede);
    azzeratore(piede, ['↺ Azzera lo storico', '↺ Reset history'], function () { scrivi(m, 'quiz', []); disegna(); });
    function data(ms) { try { return new Date(ms).toLocaleDateString(t('it-IT', 'en-GB'), { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
    function disegna() {
      var S = leggi(m, 'quiz', []), A = archivio[m];
      if (!Array.isArray(S)) S = [];
      corpo.innerHTML = '';
      if (!S.length) { corpo.appendChild(el('p', { 'class': 'bsiST-vuoto', testo: t('Nessun quiz completato finora. Fai un quiz nella scheda accanto: qui compariranno il record per argomento e gli ultimi tentativi.', 'No quiz completed yet. Take a quiz in the tab next to this one: the record per topic and your latest attempts will appear here.') })); return; }
      var tab = el('table', { 'class': 'bsiST-tab' });
      tab.appendChild(el('tr', null, [el('th', { testo: t('Argomento', 'Topic') }), el('th', { 'class': 'n', testo: t('Record', 'Best') }), el('th', { 'class': 'n', testo: t('Domande', 'Questions') })]));
      A.argomenti.forEach(function (a) {
        var best = -1, n = 0;
        S.forEach(function (s) { var x = s.perArg && s.perArg[a.k]; if (x && x.totale) { n += x.totale; best = Math.max(best, x.perc); } });
        tab.appendChild(el('tr', null, [el('td', { testo: tx(a.nm) }), el('td', { 'class': best >= 0 ? 'n' : 'n bsiST-conta', testo: best >= 0 ? best + ' %' : '—' }), el('td', { 'class': 'n', testo: String(n) })]));
      });
      var migliore = S.reduce(function (b, s) { return s.perc > b ? s.perc : b; }, 0);
      corpo.appendChild(el('div', { 'class': 'bsiST-grande', testo: '🏆 ' + migliore + ' %' }));
      corpo.appendChild(el('div', { 'class': 'bsiST-conta', testo: S.length + t(' quiz completati; il migliore in assoluto è qui sopra.', ' quizzes completed; the best overall is shown above.') }));
      corpo.appendChild(tab);
      var ul = el('ol', { 'class': 'bsiST-errori', reversed: '' });
      S.slice(-10).reverse().forEach(function (s) {
        ul.appendChild(el('li', { testo: data(s.quando) + ' · ' + (s.arg ? nomeArg(m, s.arg) : t('tutti gli argomenti', 'all topics')) + ' · ' + (s.liv && s.liv !== '0' ? t('livello ', 'level ') + s.liv : t('tutti i livelli', 'all levels')) + ' · ' + s.giuste + ' / ' + s.totale + ' (' + s.perc + ' %)' }));
      });
      corpo.appendChild(el('div', { 'class': 'bsiST-conta', testo: t('Ultimi tentativi:', 'Latest attempts:') }));
      corpo.appendChild(ul);
    }
    ridisegnaSeServe(div, disegna);
  }

  /* ═══ 3. FLASHCARD (Leitner) ════════════════════════════════════════════ */
  function idF(c) { return 'f' + hash(testoDi(c.f) + '|' + testoDi(c.b)); }
  function schedaFlash(m, div) {
    var A = archivio[m], st = { arg: '', carta: null, girata: false, ultima: null }, rnd = mulberry32(seme());
    intro(div, ['Il metodo di Leitner: ogni carta parte dalla scatola 1. Se la sapevi sale di una scatola, se non la sapevi torna nella 1. Le carte delle scatole basse escono più spesso. Gira la carta con un clic o con la barra spaziatrice, poi dì onestamente se la sapevi.',
      'The Leitner method: every card starts in box 1. If you knew it, it moves up one box; if not, it goes back to box 1. Cards in the lower boxes come up more often. Flip the card with a click or the space bar, then say honestly whether you knew it.']);
    var filtri = el('div', { 'class': 'bsiST-filtri' }); div.appendChild(filtri);
    F.scelta(filtri, ['Argomento', 'Topic'], vociArg(m), '', function (v) { st.arg = v; st.ultima = null; nuova(); });
    var info = el('div', { 'class': 'bsiST-conta', role: 'status', 'aria-live': 'polite' }); div.appendChild(info);
    var fronte = el('div', { 'class': 'bsiST-testo' }), retro = el('div', { 'class': 'bsiST-testo' });
    var fF = el('div', { 'class': 'bsiST-faccia' }, [el('div', { 'class': 'bsiST-cosa', testo: t('Fronte · domanda', 'Front · question') }), fronte]);
    var fR = el('div', { 'class': 'bsiST-faccia bsiST-retro', 'aria-hidden': 'true' }, [el('div', { 'class': 'bsiST-cosa', testo: t('Retro · risposta', 'Back · answer') }), retro]);
    var carta = el('div', { 'class': 'bsiST-carta', role: 'button', tabindex: '0', 'aria-label': t('Carta: premi per girarla', 'Card: press to flip it') }, [el('div', { 'class': 'bsiST-interno' }, [fF, fR])]);
    carta.addEventListener('click', gira);
    div.appendChild(carta);
    var annuncio = el('div', { 'class': 'bsiST-nascosto', 'aria-live': 'polite' }); div.appendChild(annuncio);
    var riga = el('div', { 'class': 'bsiST-riga' }); div.appendChild(riga);
    var bGira = F.bottone(riga, ['🔄 Gira', '🔄 Flip'], gira);
    var bSi = F.bottone(riga, ['✅ La sapevo', '✅ I knew it'], function () { valuta(true); });
    var bNo = F.bottone(riga, ['❌ Non la sapevo', '❌ I didn’t know it'], function () { valuta(false); });
    div.appendChild(el('div', { 'class': 'bsiST-tasti', testo: t('Tasti: barra spaziatrice per girare la carta.', 'Keys: space bar to flip the card.') }));

    function mazzo() { return A.flash.filter(function (c) { return !st.arg || c.arg === st.arg; }); }
    /* si pesca con peso 1/2^(scatola−1): la scatola 1 esce sedici volte piu' della 5 */
    function pesca(lista, L) {
      if (lista.length > 1 && st.ultima) lista = lista.filter(function (c) { return c !== st.ultima; });
      var pesi = lista.map(function (c) { return 1 / Math.pow(2, (L[idF(c)] || 1) - 1); }), tot = pesi.reduce(function (a, b) { return a + b; }, 0), x = rnd() * tot;
      for (var i = 0; i < lista.length; i++) { x -= pesi[i]; if (x <= 0) return lista[i]; }
      return lista[lista.length - 1];
    }
    function stato() {
      var L = leggi(m, 'leitner', {}), M = mazzo(), uno = 0, cinque = 0;
      M.forEach(function (c) { var s = L[idF(c)] || 1; if (s === 1) uno++; if (s === 5) cinque++; });
      return { L: L, M: M, uno: uno, cinque: cinque };
    }
    function nuova() {
      var S = stato();
      st.girata = false; carta.classList.remove('girata');
      if (!S.M.length) {
        st.carta = null; fronte.textContent = t('Nessuna carta per questo argomento.', 'No card for this topic.'); retro.textContent = '';
        bGira.disabled = bSi.disabled = bNo.disabled = true; info.textContent = ''; return;
      }
      st.carta = pesca(S.M, S.L);
      fronte.innerHTML = pulisci(tx(st.carta.f)); retro.innerHTML = pulisci(tx(st.carta.b));
      fF.removeAttribute('aria-hidden'); fR.setAttribute('aria-hidden', 'true');
      bGira.disabled = false; bSi.disabled = bNo.disabled = true;
      info.textContent = nomeArg(m, st.carta.arg) + ' · ' + t('scatola ', 'box ') + (S.L[idF(st.carta)] || 1) + t(' di 5', ' of 5') + ' · ' + S.M.length + t(' carte nel mazzo, ', ' cards in the deck, ') + S.uno + t(' nella scatola 1, ', ' in box 1, ') + S.cinque + t(' nella 5', ' in box 5');
    }
    function gira() {
      if (!st.carta) return;
      st.girata = !st.girata;
      carta.classList.toggle('girata', st.girata);
      if (st.girata) { fF.setAttribute('aria-hidden', 'true'); fR.removeAttribute('aria-hidden'); annuncio.textContent = t('Risposta: ', 'Answer: ') + inChiaro(tx(st.carta.b)); bSi.disabled = bNo.disabled = false; }
      else { fR.setAttribute('aria-hidden', 'true'); fF.removeAttribute('aria-hidden'); annuncio.textContent = t('Domanda: ', 'Question: ') + inChiaro(tx(st.carta.f)); }
    }
    function valuta(si) {
      if (!st.carta || !st.girata) return;
      var id = idF(st.carta), L = leggi(m, 'leitner', {}), prima = L[id] || 1, N = leitner(L, id, si);
      scrivi(m, 'leitner', N);
      annuncio.textContent = si ? t('Sale nella scatola ', 'Moves up to box ') + N[id] : t('Torna nella scatola 1', 'Back to box 1');
      st.ultima = st.carta;
      nuova();
      if (prima !== N[id]) info.textContent = (si ? '⬆ ' : '⬇ ') + t('la carta precedente è passata dalla scatola ', 'the previous card went from box ') + prima + t(' alla ', ' to ') + N[id] + ' · ' + info.textContent;
      try { carta.focus({ preventScroll: true }); } catch (e) { }
    }
    function tasti(e) {
      if (!div.isConnected) { document.removeEventListener('keydown', tasti); return; }
      if (!tastoUtile(e, div)) return;
      if (e.key === ' ' || e.key === 'Spacebar') {
        var tg = e.target && e.target.tagName;
        if (tg === 'BUTTON' && e.target !== carta) return;     /* lo spazio su un pulsante lo preme, come sempre */
        e.preventDefault(); gira();
      } else if (e.key === 'Enter' && e.target === carta) { e.preventDefault(); gira(); }
    }
    document.addEventListener('keydown', tasti);
    nuova();
  }

  function schedaScatole(m, div) {
    var A = archivio[m];
    intro(div, ['Le cinque scatole di Leitner di questa materia. Una carta sale di una scatola ogni volta che la sai, e torna nella prima quando la sbagli: quando quasi tutte le carte stanno nella scatola 5, l’argomento è davvero memorizzato.',
      'The five Leitner boxes of this subject. A card moves up one box each time you know it and goes back to the first when you miss it: when nearly all cards sit in box 5, the topic is truly memorised.']);
    var corpo = el('div'); div.appendChild(corpo);
    var piede = el('div', { 'class': 'bsiST-riga' }); div.appendChild(piede);
    azzeratore(piede, ['↺ Rimetti tutte le carte nella scatola 1', '↺ Put all cards back in box 1'], function () { scrivi(m, 'leitner', {}); disegna(); });
    function disegna() {
      var L = leggi(m, 'leitner', {}), conta = [0, 0, 0, 0, 0, 0], tot = A.flash.length;
      A.flash.forEach(function (c) { conta[L[idF(c)] || 1]++; });
      corpo.innerHTML = '';
      var g = el('div', { 'class': 'bsiST-prog' });
      for (var s = 1; s <= 5; s++) {
        var et = t('📦 Scatola ', '📦 Box ') + s + (s === 1 ? t(' · da imparare', ' · to learn') : s === 5 ? t(' · memorizzate', ' · memorised') : '');
        g.appendChild(el('span', { testo: et }));
        g.appendChild(el('b', { testo: String(conta[s]) }));
        g.appendChild(barra(perc(conta[s], tot), et + ': ' + conta[s]));
      }
      corpo.appendChild(g);
      corpo.appendChild(el('div', { 'class': 'bsiST-conta', style: 'margin-top:14px', testo: t('Padronanza per argomento (0 % = tutto nella scatola 1, 100 % = tutto nella 5):', 'Mastery per topic (0 % = all in box 1, 100 % = all in box 5):') }));
      var h = el('div', { 'class': 'bsiST-prog' });
      A.argomenti.forEach(function (a) {
        var voci = A.flash.filter(function (c) { return c.arg === a.k; });
        if (!voci.length) return;
        var p = voci.reduce(function (x, c) { return x + ((L[idF(c)] || 1) - 1) / 4; }, 0) / voci.length * 100;
        h.appendChild(el('span', { testo: tx(a.nm) }));
        h.appendChild(el('b', { testo: Math.round(p) + ' %' }));
        h.appendChild(barra(p, tx(a.nm) + ': ' + Math.round(p) + ' %'));
      });
      corpo.appendChild(h);
    }
    ridisegnaSeServe(div, disegna);
  }

  /* ═══ 4. FORMULARIO ═════════════════════════════════════════════════════ */
  function schedaFormule(m, div) {
    var A = archivio[m], st = { arg: '', q: '' };
    intro(div, ['Tutte le formule della materia, raggruppate per argomento. Cerca per nome, per simbolo o per parola della nota; il pulsante «Copia» mette la formula negli appunti come testo semplice (apici con ^ e pedici con _).',
      'All the formulas of the subject, grouped by topic. Search by name, symbol or a word of the note; the “Copy” button puts the formula on the clipboard as plain text (superscripts with ^ and subscripts with _).']);
    var filtri = el('div', { 'class': 'bsiST-filtri' }); div.appendChild(filtri);
    F.scelta(filtri, ['Argomento', 'Topic'], vociArg(m), '', function (v) { st.arg = v; disegna(); });
    campoCerca(filtri, ['Cerca una formula', 'Search a formula'], ['nome o simbolo', 'name or symbol'], function (v) { st.q = v; disegna(); });
    var conta = el('div', { 'class': 'bsiST-conta', role: 'status', 'aria-live': 'polite' }), corpo = el('div');
    div.appendChild(conta); div.appendChild(corpo);
    function scheda(f) {
      var b = el('button', { type: 'button', 'class': 'bsiFX-bott bsiST-bott-piccolo', 'aria-label': t('Copia la formula: ', 'Copy the formula: ') + inChiaro(tx(f.nm)), testo: t('📋 Copia', '📋 Copy') });
      b.addEventListener('click', function () {
        copia(inChiaro(tx(f.f)), function (ok) {
          b.textContent = ok ? t('✔ Copiata', '✔ Copied') : t('Copia non riuscita: seleziona il testo', 'Copy failed: select the text');
          conta.textContent = ok ? t('Formula copiata negli appunti: ', 'Formula copied to the clipboard: ') + inChiaro(tx(f.nm)) : t('Il browser non permette di copiare: seleziona la formula e copiala a mano.', 'The browser does not allow copying: select the formula and copy it by hand.');
          setTimeout(function () { b.textContent = t('📋 Copia', '📋 Copy'); }, 1800);
        });
      });
      return el('article', { 'class': 'bsiST-scheda' }, [
        el('h3', { html: pulisci(tx(f.nm)) }),
        el('div', { 'class': 'bsiST-formula', html: pulisci(tx(f.f)) }),
        f.note ? el('div', { 'class': 'bsiST-corpo', html: pulisci(tx(f.note)) }) : null,
        el('div', { 'class': 'bsiST-riga' }, [b])
      ]);
    }
    function disegna() {
      corpo.innerHTML = '';
      var n = 0;
      A.argomenti.forEach(function (a) {
        if (st.arg && a.k !== st.arg) return;
        var voci = A.formule.filter(function (f) { return f.arg === a.k && trova([tx(f.nm), inChiaro(tx(f.f)), tx(f.f), tx(f.note)], st.q); });
        if (!voci.length) return;
        n += voci.length;
        corpo.appendChild(el('h3', { 'class': 'bsiST-gruppo', testo: tx(a.nm) + ' · ' + voci.length }));
        var l = el('div', { 'class': 'bsiST-lista' });
        voci.forEach(function (f) { l.appendChild(scheda(f)); });
        corpo.appendChild(l);
      });
      conta.textContent = n + t(' formule mostrate su ', ' formulas shown out of ') + A.formule.length;
      if (!n) corpo.appendChild(el('p', { 'class': 'bsiST-vuoto', testo: t('Nessuna formula corrisponde alla ricerca. Prova con il nome della grandezza (per esempio «energia») o con un simbolo, e controlla il filtro dell’argomento.', 'No formula matches the search. Try the name of the quantity (e.g. “energy”) or a symbol, and check the topic filter.') }));
    }
    disegna();
  }

  /* ═══ 5. GLOSSARIO ══════════════════════════════════════════════════════ */
  function iniziale(s) { var c = norm(s).charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; }
  function schedaGlossario(m, div) {
    var A = archivio[m], st = { q: '' };
    intro(div, ['I termini della materia in ordine alfabetico, con la definizione. Salta a una lettera con la barra qui sotto oppure cerca: la ricerca guarda sia i termini sia le definizioni e non bada agli accenti.',
      'The terms of the subject in alphabetical order, with their definition. Jump to a letter with the bar below or search: the search looks at both terms and definitions and ignores accents.']);
    var filtri = el('div', { 'class': 'bsiST-filtri' }); div.appendChild(filtri);
    campoCerca(filtri, ['Cerca nel glossario', 'Search the glossary'], ['termine o parola della definizione', 'term or word of the definition'], function (v) { st.q = v; disegna(); });
    var conta = el('div', { 'class': 'bsiST-conta', role: 'status', 'aria-live': 'polite' }); div.appendChild(conta);
    var lettere = el('nav', { 'class': 'bsiST-lettere', 'aria-label': t('Indice alfabetico', 'Alphabetical index') }); div.appendChild(lettere);
    var corpo = el('div'); div.appendChild(corpo);
    var ordinati = A.glossario.slice().sort(function (a, b) { return tx(a.t).localeCompare(tx(b.t), t('it', 'en'), { sensitivity: 'base' }); });
    var ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
    function disegna() {
      var voci = ordinati.filter(function (g) { return trova([tx(g.t), tx(g.d)], st.q); }), gruppi = {};
      voci.forEach(function (g) { var l = iniziale(tx(g.t)); (gruppi[l] = gruppi[l] || []).push(g); });
      corpo.innerHTML = ''; lettere.innerHTML = '';
      var titoli = {};
      ALFABETO.forEach(function (l) {
        if (!gruppi[l]) return;
        var h = el('h3', { 'class': 'bsiST-gruppo', tabindex: '-1', testo: l === '#' ? t('Altri', 'Other') : l });
        titoli[l] = h;
        var dl = el('dl', { 'class': 'bsiST-gloss' });
        gruppi[l].forEach(function (g) { dl.appendChild(el('dt', { html: pulisci(tx(g.t)) })); dl.appendChild(el('dd', { html: pulisci(tx(g.d)) })); });
        corpo.appendChild(h); corpo.appendChild(dl);
      });
      ALFABETO.forEach(function (l) {
        var b = el('button', { type: 'button', testo: l, 'aria-label': (l === '#' ? t('Altri simboli', 'Other symbols') : t('Lettera ', 'Letter ') + l) + (gruppi[l] ? ' · ' + gruppi[l].length : '') });
        if (!gruppi[l]) b.disabled = true;
        else b.addEventListener('click', function () {
          try { titoli[l].scrollIntoView({ block: 'start', behavior: MENO_MOTO ? 'auto' : 'smooth' }); } catch (e) { titoli[l].scrollIntoView(); }
          try { titoli[l].focus({ preventScroll: true }); } catch (e) { }
        });
        lettere.appendChild(b);
      });
      conta.textContent = voci.length + t(' termini mostrati su ', ' terms shown out of ') + A.glossario.length;
      if (!voci.length) corpo.appendChild(el('p', { 'class': 'bsiST-vuoto', testo: t('Nessun termine corrisponde alla ricerca. Prova con una parola più corta o con un sinonimo: la ricerca guarda anche dentro le definizioni.', 'No term matches the search. Try a shorter word or a synonym: the search also looks inside the definitions.') }));
    }
    disegna();
  }

  /* ═══ le sezioni ════════════════════════════════════════════════════════ */
  function sottotitoli(m) {
    var A = archivio[m], na = A.argomenti.length, liv = { 1: 0, 2: 0, 3: 0 };
    A.quiz.forEach(function (q) { if (liv[q.liv] != null) liv[q.liv]++; });
    return {
      riass: [A.riassunti.length + ' riassunti su ' + na + ' argomenti: filtra per argomento, cerca senza badare agli accenti, segna come studiato ciò che hai ripassato e segui i progressi.',
        A.riassunti.length + ' summaries across ' + na + ' topics: filter by topic, search ignoring accents, mark what you have reviewed as studied and follow your progress.'],
      quiz: [A.quiz.length + ' domande su ' + na + ' argomenti (' + liv[1] + ' di livello base, ' + liv[2] + ' intermedio, ' + liv[3] + ' avanzato), con spiegazione, punteggio per argomento, ripasso degli errori e storico.',
        A.quiz.length + ' questions across ' + na + ' topics (' + liv[1] + ' basic, ' + liv[2] + ' intermediate, ' + liv[3] + ' advanced), with explanations, score per topic, mistakes review and history.'],
      flash: [A.flash.length + ' flashcard su ' + na + ' argomenti, con il metodo di Leitner a cinque scatole: le carte che non sai tornano più spesso.',
        A.flash.length + ' flashcards across ' + na + ' topics, with the five-box Leitner method: the cards you do not know come back more often.'],
      form: [A.formule.length + ' formule raggruppate in ' + na + ' argomenti, con nome, nota e pulsante per copiarle; si cercano per nome o per simbolo.',
        A.formule.length + ' formulas grouped into ' + na + ' topics, with name, note and a copy button; search them by name or symbol.'],
      gloss: [A.glossario.length + ' termini in ordine alfabetico, con la barra delle lettere e la ricerca nei termini e nelle definizioni.',
        A.glossario.length + ' terms in alphabetical order, with a letter bar and search in terms and definitions.']
    };
  }
  function preparaSezioni(m) {
    F = globale.BSIFisica || null;
    if (!F || !globale.document || !archivio[m]) return false;
    var info = infoMateria(m), ids = idSezioni(m), S = sottotitoli(m);
    if (!descrizioni[m]) {
      var di = info.di, en = info.en;
      var scheda = function (nome, f) { return { nome: nome, costruisci: function (div) { f(m, div); } }; };
      var D = {};
      D[ids[0]] = { titolo: ['🗺️ Riassunti ' + di, '🗺️ ' + en + ' summaries'], schede: [scheda(['📚 Schede', '📚 Cards'], schedaRiassunti), scheda(['✅ Progressi', '✅ Progress'], schedaProgressi)] };
      D[ids[1]] = { titolo: ['❓ Quiz ' + di, '❓ ' + en + ' quiz'], schede: [scheda(['❓ Quiz', '❓ Quiz'], schedaQuiz), scheda(['🏆 Storico', '🏆 History'], schedaStorico)] };
      D[ids[2]] = { titolo: ['🃏 Flashcard ' + di, '🃏 ' + en + ' flashcards'], schede: [scheda(['🃏 Ripasso', '🃏 Review'], schedaFlash), scheda(['📦 Scatole', '📦 Boxes'], schedaScatole)] };
      D[ids[3]] = { titolo: ['📐 Formulario ' + di, '📐 ' + en + ' formula sheet'], schede: [scheda(['📐 Formule', '📐 Formulas'], schedaFormule)] };
      D[ids[4]] = { titolo: ['📖 Glossario ' + di, '📖 ' + en + ' glossary'], schede: [scheda(['📖 Glossario', '📖 Glossary'], schedaGlossario)] };
      descrizioni[m] = D;
      ids.forEach(function (id) { F.sezione(id, D[id]); });
      stile();
    }
    /* i sottotitoli si ricalcolano a ogni registrazione: i conteggi vengono dai dati */
    var D2 = descrizioni[m];
    D2[ids[0]].sotto = S.riass; D2[ids[1]].sotto = S.quiz; D2[ids[2]].sotto = S.flash; D2[ids[3]].sotto = S.form; D2[ids[4]].sotto = S.gloss;
    ricostruisci(m);
    return true;
  }
  /* una sezione gia' costruita si rifa' da capo (dati nuovi o lingua cambiata) */
  function ricostruisci(m) {
    if (!F || !globale.document) return;
    (m ? [m] : Object.keys(descrizioni)).forEach(function (mm) {
      if (!descrizioni[mm]) return;
      idSezioni(mm).forEach(function (id) {
        var sec = document.getElementById(id);
        if (sec && sec.dataset.bsiFx === '1') { sec.dataset.bsiFx = ''; F.apri(id); }
      });
    });
  }
  if (globale.document && document.addEventListener) {
    document.addEventListener('bsi-lingua', function () { ricostruisci(); });
    /* se il motore e' arrivato prima di bsi-fisica-comune.js, le sezioni si registrano quando la pagina e' pronta */
    var tardi = function () { Object.keys(archivio).forEach(function (m) { if (!descrizioni[m]) preparaSezioni(m); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tardi); else setTimeout(tardi, 0);
  }

  globale.BSIStudio = {
    registra: registra,
    dati: function (m) { return archivio[m] || null; },
    materie: function () { return Object.keys(archivio); },
    sezioni: function (m) { return archivio[m] ? idSezioni(m) : []; },
    MINIMI: MINIMI,
    valida: valida,
    pulisci: pulisci,
    norm: norm,
    calcolo: { mulberry32: mulberry32, mescola: mescola, leitner: leitner, punteggio: punteggio },
    versione: VERSIONE
  };

  /* la coda dei file di dati arrivati prima del motore */
  var coda = globale.BSIStudioCoda;
  if (Array.isArray(coda)) {
    while (coda.length) { var f = coda.shift(); try { f(); } catch (e) { if (globale.console) console.error(e); } }
  }
})(typeof window !== 'undefined' ? window : globalThis);
