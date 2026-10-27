/* ═══════════════════════════════════════════════════════════════════════════
   bsi-materie.js — i pulsanti per cambiare materia: chimica, fisica, matematica
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE

   La barra mostrava nove gruppi tutti insieme: chimica, spettroscopia,
   biochimica, farmacologia, chimica fisica, studio, utility, fisica,
   matematica. Chi studia fisica doveva scorrere sei gruppi di chimica per
   arrivare al suo. Ora la barra mostra UNA materia per volta, piu' i due
   gruppi che servono a tutte (📚 Studio e 🛠️ Utility), e si cambia materia
   con due pulsanti rotondi sopra Spectra e ✨: sono sempre le DUE materie in
   cui non ci si trova, ognuna con la sua icona (la beuta per la chimica,
   l'atomo per la fisica, la sigma per la matematica).

   TRE REGOLE

   · Nessuna sezione diventa irraggiungibile: se qualcosa apre una sezione
     di un'altra materia (la ricerca, un collegamento, l'assistente, Spectra),
     la materia cambia da sola, perche' ogni passaggio fra gruppi passa da
     `switchNavGroup`, che qui viene avvolta;
   · la scelta si ricorda (localStorage, con try/catch: se non c'e', si
     riparte dalla chimica e funziona lo stesso);
   · i pulsanti seguono ✨ e Spectra: si nascondono quando un pannello a tutto
     schermo e' aperto, come loro.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var COMUNI = [5, 6];
  var MATERIE = {
    chimica: { gruppi: [0, 1, 2, 3, 4], area: 'sareachim', nm: ['Chimica', 'Chemistry'], col: '#5eead4', fondo: 'rgba(94,234,212,.16)' },
    fisica: { gruppi: [7, 9], area: 'sareafis', nm: ['Fisica', 'Physics'], col: '#9d8cff', fondo: 'rgba(157,140,255,.18)' },
    matematica: { gruppi: [8], area: 'sareamat', nm: ['Matematica', 'Mathematics'], col: '#ffc45a', fondo: 'rgba(255,196,90,.16)' }
  };
  var ORDINE = ['chimica', 'fisica', 'matematica'];
  var CHIAVE = 'bsi-materia';
  var corrente = 'chimica';

  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? en : it; }
  function leggi() { try { var v = localStorage.getItem(CHIAVE); return MATERIE[v] ? v : null; } catch (e) { return null; } }
  function scrivi(v) { try { localStorage.setItem(CHIAVE, v); } catch (e) {} }
  function materiaDi(g) { for (var k in MATERIE) if (MATERIE[k].gruppi.indexOf(+g) >= 0) return k; return null; }

  /* le icone: disegni semplici in SVG, leggibili anche a 22 px */
  function icona(m) {
    var c = MATERIE[m].col;
    if (m === 'fisica') return '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="' + c + '" stroke-width="1.6">' +
      '<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>' +
      '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="2" fill="' + c + '" stroke="none"/></svg>';
    if (m === 'matematica') return '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M17 4H6l6 8-6 8h11"/><path d="M19 15.5l-2.2 3.5" stroke-width="1.4"/></svg>';
    return '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="' + c + '" stroke-width="1.7" stroke-linejoin="round">' +
      '<path d="M9 3h6M10 3v6l-5.5 9.5A1.6 1.6 0 0 0 5.9 21h12.2a1.6 1.6 0 0 0 1.4-2.5L14 9V3"/>' +
      '<path d="M7.3 15h9.4" stroke-width="1.3"/><circle cx="10.5" cy="17.6" r=".9" fill="' + c + '" stroke="none"/><circle cx="13.6" cy="18.4" r=".7" fill="' + c + '" stroke="none"/></svg>';
  }

  function stile() {
    if (document.getElementById('bsi-materie-stile')) return;
    var s = document.createElement('style');
    s.id = 'bsi-materie-stile';
    s.textContent = [
      '#bsi-materie{position:fixed;right:20px;bottom:150px;z-index:99990;display:flex;flex-direction:column;gap:10px;align-items:flex-end}',
      '.bsi-mat-fab{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;',
      ' background:linear-gradient(135deg,rgba(9,20,34,.97),rgba(12,31,51,.97));border:1.5px solid var(--c);padding:0;',
      ' box-shadow:0 6px 20px rgba(0,0,0,.45),0 0 0 0 var(--f);transition:transform .15s,box-shadow .2s;position:relative}',
      '.bsi-mat-fab:hover{transform:scale(1.07);box-shadow:0 6px 22px rgba(0,0,0,.45),0 0 0 6px var(--f)}',
      '.bsi-mat-fab:active{transform:scale(.93)}',
      '.bsi-mat-fab:focus-visible{outline:2px solid var(--c);outline-offset:3px}',
      /* il nome della materia compare accanto al passaggio del mouse */
      '.bsi-mat-fab span{position:absolute;right:58px;top:50%;transform:translateY(-50%);white-space:nowrap;font:800 12px/1 system-ui,sans-serif;',
      ' color:var(--c);background:rgba(8,21,34,.96);border:1px solid var(--c);border-radius:9px;padding:6px 9px;opacity:0;pointer-events:none;transition:opacity .15s}',
      /* il nome compare solo con un mouse: su un tocco resterebbe appeso */
      '@media (hover:hover){.bsi-mat-fab:hover span{opacity:1}}',
      '.bsi-mat-fab:focus-visible span{opacity:1}',
      '@media (max-width:480px){.bsi-mat-fab{width:44px;height:44px}#bsi-materie{gap:8px}}',
      '@media (prefers-reduced-motion:reduce){.bsi-mat-fab{transition:none}}',
      '@media print{#bsi-materie{display:none!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function costruisci() {
    var box = document.getElementById('bsi-materie');
    if (!box) { box = document.createElement('div'); box.id = 'bsi-materie'; box.setAttribute('role', 'group'); document.body.appendChild(box); }
    box.setAttribute('aria-label', t('Cambia materia', 'Change subject'));
    box.innerHTML = '';
    ORDINE.filter(function (m) { return m !== corrente; }).forEach(function (m) {
      var M = MATERIE[m], b = document.createElement('button'), nome = t(M.nm[0], M.nm[1]);
      b.type = 'button';
      b.className = 'bsi-mat-fab';
      b.setAttribute('data-materia', m);
      b.style.setProperty('--c', M.col); b.style.setProperty('--f', M.fondo);
      b.setAttribute('aria-label', t('Passa a ', 'Switch to ') + nome);
      b.title = t('Passa a ', 'Switch to ') + nome;
      b.innerHTML = icona(m) + '<span>' + nome + '</span>';
      b.onclick = function (e) { e.stopPropagation(); imposta(m, true); };
      box.appendChild(b);
    });
    ancora();
  }

  /* mostra nella barra solo i gruppi della materia, piu' quelli comuni */
  function filtra() {
    var vis = MATERIE[corrente].gruppi.concat(COMUNI);
    var tabs = document.querySelectorAll('.nav-group-tab');
    for (var i = 0; i < tabs.length; i++) {
      var g = +tabs[i].getAttribute('data-group');
      tabs[i].style.display = vis.indexOf(g) >= 0 ? '' : 'none';
      /* prima i gruppi della materia, poi Studio e Utility (solo l'ordine a schermo) */
      tabs[i].style.order = COMUNI.indexOf(g) >= 0 ? '1' : '0';
    }
  }

  function imposta(m, apri) {
    if (!MATERIE[m]) return;
    var cambiata = m !== corrente;
    corrente = m;
    scrivi(m);
    filtra();
    costruisci();
    if (apri) {
      originale(MATERIE[m].gruppi[0]);
      var a = document.querySelector('.nav-btn[data-s="' + MATERIE[m].area + '"]');
      if (a) a.click();
      var tabs = document.getElementById('navGroupTabs'); if (tabs) tabs.scrollLeft = 0;
    }
    if (cambiata) { try { document.dispatchEvent(new CustomEvent('bsi-materia', { detail: { materia: m } })); } catch (e) {} }
  }

  /* ogni passaggio di gruppo passa da qui: se il gruppo e' di un'altra
     materia, la materia cambia da sola */
  var originale = function () {};
  function avvolgi() {
    if (typeof globale.switchNavGroup !== 'function' || globale.switchNavGroup._bsiMaterie) return false;
    var orig = globale.switchNavGroup;
    originale = function (g) { return orig.call(globale, g); };
    var nuova = function (g) {
      var m = materiaDi(g);
      if (m && m !== corrente) imposta(m, false);
      return orig.apply(this, arguments);
    };
    nuova._bsiMaterie = true;
    globale.switchNavGroup = nuova;
    /* la ricerca, quando si svuota, torna al gruppo 0: deve tornare al primo
       gruppo della materia in cui si e' */
    if (typeof globale.filterNavSearch === 'function' && !globale.filterNavSearch._bsiMaterie) {
      var fo = globale.filterNavSearch;
      var fn = function (v) { var r = fo.apply(this, arguments); if (!String(v || '').trim()) { originale(MATERIE[corrente].gruppi[0]); filtra(); } else filtra(); return r; };
      fn._bsiMaterie = true;
      globale.filterNavSearch = fn;
    }
    return true;
  }

  /* sopra Spectra, che sta sopra ✨; e nascosti quando loro sono nascosti */
  function ancora() {
    var box = document.getElementById('bsi-materie'), sp = document.getElementById('bsi-spectra-fab') || document.getElementById('bsi14-fab');
    if (!box) return;
    if (sp) {
      var r = sp.getBoundingClientRect(), nascosto = getComputedStyle(sp).display === 'none';
      var vuole = nascosto ? 'none' : 'flex';
      if (box.style.display !== vuole) box.style.display = vuole;
      if (!nascosto && r.height) {
        box.style.bottom = Math.round(globale.innerHeight - r.top + 12) + 'px';
        box.style.right = Math.round(globale.innerWidth - r.right) + 'px';
      }
    }
  }

  function avvia() {
    stile();
    corrente = leggi() || 'chimica';
    avvolgi();
    filtra();
    costruisci();
    /* il gruppo aperto all'avvio deve essere della materia ricordata */
    var attivo = null, tabs = document.querySelectorAll('.nav-group-panel');
    for (var i = 0; i < tabs.length; i++) if (tabs[i].style.display !== 'none' && getComputedStyle(tabs[i]).display !== 'none') { attivo = i; break; }
    if (attivo === null || materiaDi(attivo) !== corrente && COMUNI.indexOf(attivo) < 0) originale(MATERIE[corrente].gruppi[0]);
    /* ✨ e Spectra vengono riposizionati da altri script per qualche secondo:
       ci si riaggancia a loro invece di imporre un numero */
    var n = 0, iv = setInterval(function () { avvolgi(); ancora(); if (++n > 40) clearInterval(iv); }, 1000);
    globale.addEventListener('resize', ancora);
    try {
      var mo = new MutationObserver(ancora), sp = document.getElementById('bsi-spectra-fab');
      if (sp) mo.observe(sp, { attributes: true, attributeFilter: ['style'] });
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(avvia, 0); });
  else setTimeout(avvia, 0);
  document.addEventListener('bsi-lingua', function () { if (document.getElementById('bsi-materie')) costruisci(); });

  globale.BSIMaterie = {
    MATERIE: MATERIE, COMUNI: COMUNI,
    corrente: function () { return corrente; },
    imposta: function (m) { imposta(m, true); },
    materiaDi: materiaDi,
    versione: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
