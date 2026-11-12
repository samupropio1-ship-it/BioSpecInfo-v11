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

  /* le icone (v252): in 3D e animate, ma leggere — niente WebGL, solo CSS e SVG.
     · fisica: un atomo con tre orbite inclinate che ruotano nello spazio, e un elettrone che corre su ognuna;
     · matematica: una Σ in rilievo (estrusa a strati) che oscilla, con un riflesso;
     · chimica: una beuta di vetro con il liquido che ondeggia e le bollicine che salgono.
     Con «riduci movimento» restano ferme e leggibili. */
  var nIcone = 0;
  function icona(m) {
    var c = MATERIE[m].col, id = 'bsiMat' + (++nIcone);
    if (m === 'fisica') return '<span class="ico3d atomo" aria-hidden="true"><span class="ruota">' +
      [1, 2, 3].map(function (k) { return '<span class="orb o' + k + '"><span class="giro g' + k + '"><i></i></span></span>'; }).join('') + '</span><b class="nucleo"></b></span>';
    if (m === 'matematica') return '<span class="ico3d sigma" aria-hidden="true"><span class="ruota"><b>Σ</b></span></span>';
    return '<span class="ico3d beuta" aria-hidden="true"><svg viewBox="0 0 32 32" width="30" height="30">' +
      '<defs><linearGradient id="' + id + 'v" x1="0" x2="1"><stop offset="0" stop-color="#c8fff6" stop-opacity=".38"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".06"/><stop offset="1" stop-color="#c8fff6" stop-opacity=".3"/></linearGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8affe6"/><stop offset="1" stop-color="#079c86"/></linearGradient>' +
      '<clipPath id="' + id + 'c"><path d="M13.2 4v8.4L6.6 24.6A2.4 2.4 0 0 0 8.7 28h14.6a2.4 2.4 0 0 0 2.1-3.4L18.8 12.4V4z"/></clipPath></defs>' +
      '<g clip-path="url(#' + id + 'c)"><path class="onda" d="M-16 19 q4 -2.2 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0 V40 H-16z" fill="url(#' + id + 'l)"/>' +
      '<circle class="bolla b1" cx="12.5" cy="26" r="1.15" fill="#eafffb"/><circle class="bolla b2" cx="17" cy="26.5" r=".85" fill="#eafffb"/><circle class="bolla b3" cx="20" cy="25.5" r="1" fill="#eafffb"/></g>' +
      '<path d="M13.2 4v8.4L6.6 24.6A2.4 2.4 0 0 0 8.7 28h14.6a2.4 2.4 0 0 0 2.1-3.4L18.8 12.4V4" fill="url(#' + id + 'v)" stroke="' + c + '" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M11.4 4h9.2" stroke="' + c + '" stroke-width="1.9" stroke-linecap="round"/><path d="M10.2 22.2l2.6-6" stroke="#ffffff" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"/></svg></span>';
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
      '.bsi-mat-fab .nome{position:absolute;right:58px;top:50%;transform:translateY(-50%);white-space:nowrap;font:800 12px/1 system-ui,sans-serif;',
      ' color:var(--c);background:rgba(8,21,34,.96);border:1px solid var(--c);border-radius:9px;padding:6px 9px;opacity:0;pointer-events:none;transition:opacity .15s}',
      /* il nome compare solo con un mouse: su un tocco resterebbe appeso */
      '@media (hover:hover){.bsi-mat-fab:hover .nome{opacity:1}}',
      '.bsi-mat-fab:focus-visible .nome{opacity:1}',
      '@media (max-width:480px){.bsi-mat-fab{width:44px;height:44px}#bsi-materie{gap:8px}}',
      /* le icone in 3D */
      '.bsi-mat-fab .ico3d{position:relative;display:block;width:30px;height:30px;perspective:130px}',
      '.atomo .ruota{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(18deg);animation:bsiMatGira 11s linear infinite}',
      '.atomo .orb{position:absolute;inset:1px;border-radius:50%;border:1.6px solid var(--c);transform-style:preserve-3d;box-shadow:0 0 5px var(--f),inset 0 0 4px var(--f)}',
      '.atomo .o1{transform:rotateX(72deg)}.atomo .o2{transform:rotateY(60deg) rotateX(72deg)}.atomo .o3{transform:rotateY(120deg) rotateX(72deg)}',
      '.atomo .giro{position:absolute;inset:-1.6px;animation:bsiMatOrbita 1.7s linear infinite}.atomo .g2{animation-duration:2.3s;animation-direction:reverse}.atomo .g3{animation-duration:2.9s}',
      '.atomo .giro i{position:absolute;left:50%;top:-2.5px;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:#fff;box-shadow:0 0 6px 1px var(--c)}',
      '.atomo .nucleo{position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:radial-gradient(circle at 34% 30%,#fff 0,var(--c) 45%,#3d2c93 100%);box-shadow:0 0 9px var(--c);animation:bsiMatPulsa 2.4s ease-in-out infinite}',
      '.sigma .ruota{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform-style:preserve-3d;animation:bsiMatOscilla 4.6s ease-in-out infinite}',
      '.sigma b{font:900 27px/1 "Times New Roman",Georgia,serif;color:#ffe2a0;text-shadow:1px 1px 0 #e0a43a,2px 2px 0 #c58a26,3px 3px 0 #a5701b,4px 4px 0 #835713,5px 5px 7px rgba(0,0,0,.6),0 0 12px rgba(255,196,90,.45);position:relative;top:-2px;left:-2px}',
      '.sigma .ruota:after{content:"";position:absolute;inset:2px;border-radius:50%;background:linear-gradient(120deg,transparent 40%,rgba(255,255,255,.28) 50%,transparent 60%);background-size:250% 100%;animation:bsiMatRiflesso 4.6s linear infinite;pointer-events:none}',
      '.beuta svg{display:block;overflow:visible;animation:bsiMatDondola 5s ease-in-out infinite;transform-origin:50% 90%}',
      '.beuta .onda{animation:bsiMatOnda 2.2s linear infinite}.beuta .bolla{animation:bsiMatBolla 2.4s ease-in infinite;opacity:0}.beuta .b2{animation-delay:.8s}.beuta .b3{animation-delay:1.6s}',
      '@keyframes bsiMatGira{from{transform:rotateX(18deg) rotateY(0)}to{transform:rotateX(18deg) rotateY(360deg)}}',
      '@keyframes bsiMatOrbita{to{transform:rotate(360deg)}}',
      '@keyframes bsiMatPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}',
      '@keyframes bsiMatOscilla{0%,100%{transform:rotateY(-28deg) translateY(0)}50%{transform:rotateY(28deg) translateY(-1.5px)}}',
      '@keyframes bsiMatRiflesso{0%{background-position:160% 0}100%{background-position:-110% 0}}',
      '@keyframes bsiMatDondola{0%,100%{transform:perspective(90px) rotateZ(-6deg) rotateY(-14deg)}50%{transform:perspective(90px) rotateZ(6deg) rotateY(14deg)}}',
      '@keyframes bsiMatOnda{from{transform:translateX(0)}to{transform:translateX(16px)}}',
      '@keyframes bsiMatBolla{0%{transform:translateY(0);opacity:0}15%{opacity:.95}100%{transform:translateY(-13px);opacity:0}}',
      '@media (prefers-reduced-motion:reduce){.bsi-mat-fab{transition:none}.bsi-mat-fab .ico3d *,.bsi-mat-fab .ico3d svg{animation:none!important}.beuta .bolla{opacity:.8}}',
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
      b.innerHTML = icona(m) + '<span class="nome">' + nome + '</span>';
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
