/* ═══════════════════════════════════════════════════════════════════════════
   bsi-teoria.js — 📖 la teoria di ogni sezione
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v253)
   Richiesta dell'autore: «la teoria di tutte le sezioni della chimica, fisica e
   matematica, scientificamente accurata». Le sezioni avevano un sottotitolo e
   le note dei grafici; la teoria vera stava sparsa (riassunti di Studio, corsi
   della sezione 📖 Teoria). Ora ogni sezione di chimica, fisica e matematica
   ha la sua scheda: idea centrale, i concetti in paragrafi, le formule con il
   significato di ogni simbolo, ipotesi e limiti, gli errori tipici, un
   esercizio svolto, le fonti (manuali e articoli veri) e i collegamenti alle
   sezioni vicine.

   I DATI stanno in bsi-teoria-a…g.js (BSITeoriaDati[id]); questo file è solo
   l'interfaccia:
   · il pulsante «📖 Teoria» sotto il titolo di ogni sezione che ha una scheda,
     accanto a «🎓 Lezione guidata»;
   · la scheda di lettura, a tutto schermo e scorrevole sul telefono, con
     l'esercizio da provare prima di vedere la soluzione e «🔊 Leggi»;
   · l'indice di tutta la teoria, con la ricerca (menu ✨ → 📖 Teoria di tutte
     le sezioni);
   · lo strumento `leggi_teoria` per Spectra: quando gli si chiede un concetto,
     può partire dalla teoria scritta e controllata invece che dalla memoria
     del modello.

   La teoria è scritta in italiano; nelle altre lingue la scheda lo dice.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var D = g.document;
  function dati() { return g.BSITeoriaDati || {}; }
  function inglese() { return !!(g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() !== 'it'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function materiaDi(id) { var b = D.querySelector('.nav-btn[data-s="' + id + '"]'), p = b && b.closest('.nav-group-panel'), gr = p ? +String(p.id).replace(/\D/g, '') : -1; return g.BSIMaterie && g.BSIMaterie.materiaDi ? (g.BSIMaterie.materiaDi(gr) || 'comune') : 'comune'; }
  function nomeSezione(id) { var b = D.querySelector('.nav-btn[data-s="' + id + '"]'); return b ? b.textContent.trim() : id; }
  var COLORE = { chimica: '#5eead4', fisica: '#9d8cff', matematica: '#ffc45a', comune: '#7fb2ff' };

  /* ── lo stile ── */
  function stile() {
    if (D.getElementById('bsiTE-stile')) return;
    var s = D.createElement('style'); s.id = 'bsiTE-stile';
    s.textContent =
      '.bsiTE-avvia{display:inline-flex;align-items:center;gap:6px;margin:6px 8px 6px 0;min-height:38px;padding:6px 14px;border-radius:999px;border:1px solid #3a7bd5;background:linear-gradient(135deg,rgba(58,123,213,.22),rgba(94,234,212,.08));color:#e8f4ff;font:700 .92rem system-ui,sans-serif;cursor:pointer}' +
      '.bsiTE-avvia:focus-visible{outline:2px solid #7fb2ff;outline-offset:2px}' +
      '#bsiTE{position:fixed;inset:0;z-index:100045;background:rgba(3,9,17,.97);overflow-y:auto;-webkit-overflow-scrolling:touch;color:#e6eef7}' +
      '#bsiTE .pagina{max-width:780px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(40px + env(safe-area-inset-bottom,0px));font:400 1.02rem/1.68 system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '#bsiTE .testa{position:sticky;top:0;z-index:2;display:flex;gap:8px;align-items:center;justify-content:space-between;background:rgba(3,9,17,.96);padding:8px 0;border-bottom:1px solid #16304a;margin-bottom:10px}' +
      '#bsiTE .testa .sx{min-width:0;font:800 .78rem/1.2 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--c);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '#bsiTE .testa .dx{display:flex;gap:6px;flex:none}' +
      '#bsiTE button{min-height:40px;border-radius:10px;border:1px solid #2a5f8f;background:#0a2235;color:#e6eef7;font:600 .88rem system-ui,sans-serif;padding:6px 12px;cursor:pointer}' +
      '#bsiTE button:focus-visible,#bsiTE input:focus-visible{outline:2px solid #7fb2ff;outline-offset:2px}' +
      '#bsiTE h1{font:800 1.45rem/1.25 system-ui,sans-serif;margin:6px 0 10px;color:#fff}' +
      '#bsiTE .sintesi{border-left:4px solid var(--c);background:#0a1c2c;border-radius:0 10px 10px 0;padding:10px 14px;margin:0 0 16px;font-size:1.04rem}' +
      '#bsiTE h2{font:800 1.08rem/1.3 system-ui,sans-serif;margin:22px 0 6px;color:var(--c)}' +
      '#bsiTE h3{font:700 1rem/1.35 system-ui,sans-serif;margin:16px 0 4px;color:#fff}' +
      '#bsiTE p{margin:0 0 10px;text-align:left;hyphens:auto;overflow-wrap:anywhere}' +
      '#bsiTE .formule{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}#bsiTE .formula{min-width:0;background:#081827;border:1px solid #17324c;border-radius:10px;padding:8px 12px}' +
      '#bsiTE .formula b{display:block;font:600 1.08rem/1.5 "Cambria Math","STIX Two Math","Times New Roman",serif;color:#fff;overflow-wrap:anywhere;padding-bottom:2px}#bsiTE .formula span{display:block;font-size:.92rem;color:#b9c9da}' +
      '#bsiTE ul{margin:0 0 10px;padding-left:20px}#bsiTE li{margin:4px 0}' +
      '#bsiTE .esercizio{background:#0b1f17;border:1px solid #1f6b52;border-radius:10px;padding:10px 14px}#bsiTE .soluzione{margin-top:8px;padding-top:8px;border-top:1px dashed #1f6b52}' +
      '#bsiTE .fonti li{font-size:.9rem;color:#b9c9da}#bsiTE .chips{display:flex;flex-wrap:wrap;gap:6px}#bsiTE .chips button{min-height:36px;border-radius:999px;font-size:.84rem}' +
      '#bsiTE .avviso{font-size:.85rem;color:#ffd27a;margin:0 0 10px}' +
      '#bsiTE .cerca{width:100%;box-sizing:border-box;min-height:44px;border-radius:10px;border:1px solid #2a5f8f;background:#061524;color:#e6eef7;font:inherit;padding:8px 12px;margin:6px 0 12px}' +
      '#bsiTE .voce{display:block;width:100%;text-align:left;margin:4px 0;padding:8px 12px;border-radius:10px}#bsiTE .voce small{display:block;color:#9fb3c8;font-weight:400}' +
      '@media (min-width:900px){#bsiTE .pagina{font-size:1.06rem}}@media print{#bsiTE{position:static;background:#fff;color:#000}#bsiTE .testa{display:none}}';
    D.head.appendChild(s);
  }

  /* ── il pulsante in ogni sezione ── */
  function pulsanti() {
    var T = dati();
    [].forEach.call(D.querySelectorAll('.section'), function (sez) {
      if (!T[sez.id] || sez.offsetParent === null || sez.getBoundingClientRect().height < 40) return;
      var gia = sez.querySelector('.bsiTE-avvia'); if (gia && gia.closest('.section') === sez) return;
      stile();
      var b = D.createElement('button'); b.type = 'button'; b.className = 'bsiTE-avvia'; b.setAttribute('data-teoria', sez.id);
      b.textContent = inglese() ? '📖 Theory' : '📖 Teoria'; b.setAttribute('aria-label', (inglese() ? 'Read the theory of this section' : 'Leggi la teoria di questa sezione'));
      b.onclick = function () { apri(sez.id); };
      var lz = sez.querySelector('.bsiLZ-avvia'), tit = sez.querySelector('.bsiFX-tit, .section-title');
      if (lz && lz.closest('.section') === sez) lz.insertAdjacentElement('afterend', b);
      else if (tit && tit.closest('.section') === sez) tit.insertAdjacentElement('afterend', b);
      else sez.insertBefore(b, sez.firstChild);
    });
  }

  /* ── la scheda ── */
  var aperta = null, prima = null;
  function contenitore(colore) {
    stile(); chiudi(true);
    var P = D.createElement('div'); P.id = 'bsiTE'; P.setAttribute('role', 'dialog'); P.setAttribute('aria-modal', 'true'); P.style.setProperty('--c', colore || '#7fb2ff');
    P.innerHTML = '<div class="pagina"></div>'; D.body.appendChild(P); aperta = P;
    P.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudi(); });
    return P.firstChild;
  }
  function testata(pag, sinistra, extra) {
    var h = D.createElement('div'); h.className = 'testa';
    h.innerHTML = '<div class="sx"></div><div class="dx"></div>'; h.firstChild.textContent = sinistra;
    (extra || []).forEach(function (b) { h.lastChild.appendChild(b); });
    var x = D.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', inglese() ? 'Close' : 'Chiudi'); x.onclick = function () { chiudi(); }; h.lastChild.appendChild(x);
    pag.appendChild(h); return h;
  }
  function bottone(testo, fn, etich) { var b = D.createElement('button'); b.type = 'button'; b.textContent = testo; if (etich) b.setAttribute('aria-label', etich); b.onclick = fn; return b; }

  /** Apre la teoria della sezione `id`. Restituisce false se non c'è. */
  function apri(id) {
    var x = dati()[id]; if (!x) return false;
    prima = prima || D.activeElement;
    var m = materiaDi(id), pag = contenitore(COLORE[m]);
    var leggi = bottone('🔊', function () { var L = g.BSISpectraLive; if (L && L.parla) L.parla(x.titolo + '. ' + x.sintesi + ' ' + x.paragrafi.map(function (p) { return p.titolo + '. ' + p.testo; }).join(' ')); }, inglese() ? 'Read aloud' : 'Leggi ad alta voce');
    var vai = bottone(inglese() ? 'Section' : 'Sezione', function () { chiudi(); vaiAllaSezione(id); }, inglese() ? 'Go to the section' : 'Vai alla sezione');
    testata(pag, '📖 ' + nomeSezione(id), [leggi, vai]);
    var h = '';
    if (inglese()) h += '<p class="avviso">This theory is written in Italian.</p>';
    h += '<h1>' + esc(x.titolo) + '</h1><div class="sintesi">' + esc(x.sintesi) + '</div>';
    x.paragrafi.forEach(function (p) { h += '<h3>' + esc(p.titolo) + '</h3><p>' + esc(p.testo) + '</p>'; });
    h += '<h2>Formule</h2><div class="formule">' + x.formule.map(function (f) { return '<div class="formula"><b>' + esc(f[0]) + '</b><span>' + esc(f[1]) + '</span></div>'; }).join('') + '</div>';
    h += '<h2>Ipotesi e limiti</h2><ul>' + x.ipotesi.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    h += '<h2>Errori da evitare</h2><ul>' + x.errori.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    h += '<h2>Esercizio svolto</h2><div class="esercizio"><p>' + esc(x.esempio.testo) + '</p><button type="button" class="mostra" aria-expanded="false">Prova da solo, poi mostra la soluzione</button><div class="soluzione" hidden><p><b>' + esc(x.esempio.risultato) + '</b></p></div></div>';
    h += '<h2>Fonti</h2><ul class="fonti">' + x.fonti.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    var coll = (x.collegamenti || []).filter(function (c) { return dati()[c]; });
    if (coll.length) h += '<h2>Collegamenti</h2><div class="chips">' + coll.map(function (c) { return '<button type="button" data-vai="' + esc(c) + '">' + esc(nomeSezione(c)) + '</button>'; }).join('') + '</div>';
    var corpo = D.createElement('div'); corpo.innerHTML = h; pag.appendChild(corpo);
    var mo = corpo.querySelector('.mostra'); mo.onclick = function () { var s = corpo.querySelector('.soluzione'); s.hidden = !s.hidden; mo.setAttribute('aria-expanded', String(!s.hidden)); mo.textContent = s.hidden ? 'Prova da solo, poi mostra la soluzione' : 'Nascondi la soluzione'; };
    [].forEach.call(corpo.querySelectorAll('[data-vai]'), function (b) { b.onclick = function () { apri(b.getAttribute('data-vai')); }; });
    aperta.scrollTop = 0; try { aperta.querySelector('.testa button').focus({ preventScroll: true }); } catch (e) {}
    try { D.dispatchEvent(new CustomEvent('bsi-teoria-aperta', { detail: { id: id } })); } catch (e) {}
    return true;
  }
  function vaiAllaSezione(id) {
    var L = g.BSISpectraLive; if (L && L.calcolo && L.calcolo.apriSezione) { try { L.calcolo.apriSezione(id); return; } catch (e) {} }
    var b = D.querySelector('.nav-btn[data-s="' + id + '"]'); if (b) b.click();
  }
  function chiudi(silenzioso) {
    if (aperta && aperta.parentNode) aperta.parentNode.removeChild(aperta); aperta = null;
    if (!silenzioso && prima && prima.focus) { try { prima.focus({ preventScroll: true }); } catch (e) {} prima = null; }
  }
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && aperta) chiudi(); });

  /* ── l'indice e la ricerca ── */
  function elenco() {
    var T = dati();
    return Object.keys(T).map(function (id) { return { id: id, titolo: T[id].titolo, sezione: nomeSezione(id), materia: materiaDi(id) }; })
      .sort(function (a, b) { return a.materia.localeCompare(b.materia) || a.sezione.localeCompare(b.sezione); });
  }
  /** Le schede che parlano di `q`, la più pertinente per prima (titolo e nome della sezione contano di più del testo). */
  function cerca(q) {
    var p = norm(q).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2; }); if (!p.length) return [];
    var T = dati();
    return Object.keys(T).map(function (id) {
      var x = T[id], alto = norm(x.titolo + ' ' + nomeSezione(id) + ' ' + id), basso = norm(x.sintesi + ' ' + x.paragrafi.map(function (q2) { return q2.titolo + ' ' + q2.testo; }).join(' ') + ' ' + x.formule.map(function (f) { return f.join(' '); }).join(' '));
      var s = 0; p.forEach(function (w) { if (alto.indexOf(w) >= 0) s += 5; var k = basso.split(w).length - 1; s += Math.min(k, 6); });
      return { id: id, punti: s };
    }).filter(function (r) { return r.punti > 0; }).sort(function (a, b) { return b.punti - a.punti; });
  }
  function indice() {
    var pag = contenitore('#7fb2ff'); testata(pag, inglese() ? '📖 Theory of every section' : '📖 Teoria di tutte le sezioni');
    var L = elenco(), per = { chimica: 0, fisica: 0, matematica: 0 };
    L.forEach(function (x) { if (per[x.materia] != null) per[x.materia]++; });
    var intro = D.createElement('p'); intro.textContent = L.length + ' schede: ' + per.chimica + ' di chimica, ' + per.fisica + ' di fisica, ' + per.matematica + ' di matematica. Cerca un concetto o una formula, oppure scorri per materia.'; pag.appendChild(intro);
    var inp = D.createElement('input'); inp.type = 'search'; inp.className = 'cerca'; inp.placeholder = 'Cerca: entropia, curvatura, Michaelis, autovalori…'; inp.setAttribute('aria-label', 'Cerca nella teoria'); pag.appendChild(inp);
    var lista = D.createElement('div'); lista.setAttribute('role', 'list'); pag.appendChild(lista);
    function voce(x) { var b = bottone('', function () { apri(x.id); }); b.className = 'voce'; b.setAttribute('role', 'listitem'); b.innerHTML = esc(x.sezione) + '<small>' + esc(x.titolo) + '</small>'; return b; }
    function mostra() {
      lista.textContent = ''; var q = inp.value.trim();
      if (q) { var r = cerca(q).slice(0, 30); if (!r.length) { var n = D.createElement('p'); n.textContent = 'Niente per «' + q + '».'; lista.appendChild(n); } r.forEach(function (h) { lista.appendChild(voce(L.filter(function (x) { return x.id === h.id; })[0])); }); return; }
      ['chimica', 'fisica', 'matematica', 'comune'].forEach(function (m) {
        var del = L.filter(function (x) { return x.materia === m; }); if (!del.length) return;
        var h2 = D.createElement('h2'); h2.style.color = COLORE[m]; h2.textContent = { chimica: '🧪 Chimica', fisica: '⚛️ Fisica', matematica: 'Σ Matematica', comune: 'Altro' }[m] + ' (' + del.length + ')'; lista.appendChild(h2);
        del.forEach(function (x) { lista.appendChild(voce(x)); });
      });
    }
    inp.addEventListener('input', mostra); mostra();
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 50);
    return aperta;
  }

  /* ── per Spectra ── */
  /** Il testo di una scheda, per il modello o per la voce. */
  function testo(id) {
    var x = dati()[id]; if (!x) return null;
    return x.titolo + '\n' + x.sintesi + '\n\n' + x.paragrafi.map(function (p) { return p.titolo + ': ' + p.testo; }).join('\n\n') +
      '\n\nFormule:\n' + x.formule.map(function (f) { return '• ' + f[0] + ' — ' + f[1]; }).join('\n') + '\n\nIpotesi e limiti:\n' + x.ipotesi.map(function (s) { return '• ' + s; }).join('\n') + '\n\nFonti: ' + x.fonti.join('; ');
  }
  var STRUMENTO = { name: 'leggi_teoria',
    description: "Legge la teoria scritta e controllata di una sezione dell'app (chimica, fisica, matematica): concetti, formule con il significato dei simboli, ipotesi e limiti, fonti. Usalo prima di spiegare un concetto teorico, così parti da un testo verificato; poi spiega con parole tue. Passa l'id della sezione se lo conosci, oppure l'argomento.",
    parameters: { type: 'object', properties: { sezione: { type: 'string', description: 'Id della sezione (es. sschrod) o argomento (es. «entropia», «curvatura dello spaziotempo»).' }, apri: { type: 'boolean', description: 'Se vero, apre anche la scheda sullo schermo dell\'utente.' } }, required: ['sezione'] },
    execute: function (a) {
      var q = String(a && a.sezione || ''), id = dati()[q] ? q : ((cerca(q)[0] || {}).id);
      if (!id) return { ok: false, error: 'nessuna teoria su «' + q + '»' };
      if (a.apri) apri(id);
      return { ok: true, sezione: id, nome: nomeSezione(id), teoria: testo(id), altre: cerca(q).slice(1, 4).map(function (r) { return r.id; }) };
    } };
  function registra() { var T = g.BSI_AI_TOOLS; if (!T || !T.push) return false; if (!T.some(function (x) { return x.name === 'leggi_teoria'; })) T.push(STRUMENTO); return true; }

  /** Comandi a voce o per iscritto: «teoria», «spiegami la teoria», «teoria dell'entropia», «indice della teoria». */
  function comando(frase) {
    var t = norm(frase).replace(/^(ehi |hey |ok )?(spectra|spettra)[\s,]*/, '').replace(/[?!.]+$/, '').trim(), m;
    if (/^(indice della teoria|tutta la teoria|teoria di tutte le sezioni|elenco della teoria)$/.test(t)) { indice(); return { testo: 'Ecco l\'indice di tutta la teoria: cerca un concetto o scegli una sezione.' }; }
    if (/^(teoria|la teoria|spiegami la teoria|mostrami la teoria|apri la teoria|teoria di questa sezione)$/.test(t)) {
      var sez = [].filter.call(D.querySelectorAll('.section'), function (s) { return s.offsetParent !== null && dati()[s.id]; }).pop();
      if (sez && apri(sez.id)) return { testo: 'Ecco la teoria di ' + nomeSezione(sez.id).replace(/^[^\wÀ-ÿ]+/, '') + '.' };
      indice(); return { testo: 'Questa pagina non ha una scheda di teoria: ti apro l\'indice.' };
    }
    if ((m = /^(?:teoria (?:di|del|della|dello|dei|degli|delle|sul|sulla|sui|sulle)|la teoria (?:di|del|della|dello|dei|degli|delle))\s+(.+)$/.exec(t))) {
      var r = cerca(m[1]); if (r.length && apri(r[0].id)) return { testo: 'Ecco la teoria: ' + dati()[r[0].id].titolo + '.' };
      return { testo: 'Non ho una scheda di teoria su «' + m[1] + '». Prova con l\'indice: «indice della teoria».' };
    }
    return null;
  }

  function avvia() {
    if (!registra()) { var k = 0, iv = setInterval(function () { if (registra() || ++k > 40) clearInterval(iv); }, 500); }
    setInterval(pulsanti, 1300); D.addEventListener('click', function () { setTimeout(pulsanti, 300); }, true); setTimeout(pulsanti, 800);
    D.addEventListener('bsi-lingua', function () { [].forEach.call(D.querySelectorAll('.bsiTE-avvia'), function (b) { b.textContent = inglese() ? '📖 Theory' : '📖 Teoria'; }); });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', avvia); else avvia();

  g.BSITeoria = { apri: apri, chiudi: chiudi, indice: indice, cerca: cerca, testo: testo, elenco: elenco, comando: comando, strumento: STRUMENTO, ha: function (id) { return !!dati()[id]; }, pulsanti: pulsanti };
})(typeof window !== 'undefined' ? window : globalThis);
