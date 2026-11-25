/* ═══════════════════════════════════════════════════════════════════════════
   bsi-hub.js — la fabbrica degli hub per argomento
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v271)
   Richiesta dell'autore: «una sezione per argomento, senza ripetizioni; tutto
   ciò che è collegato va unificato». La barra aveva molte voci sparse per lo
   stesso tema. Il «Centro spettri» (bsi-centrospettri.js) aveva già risolto
   questo per la spettroscopia: raccoglie in schede le sezioni collegate,
   SPOSTANDO i pannelli (non copiandoli) e NASCONDENDO i loro pulsanti (non
   rimuovendoli, così `goSection()` e Spectra continuano a funzionare).

   Questo file generalizza quello schema in una fabbrica riusabile, così ogni
   nuovo hub (Organica, Biochimica, …) nasce dalla stessa logica provata,
   senza duplicare il codice.

   COSA GARANTISCE
   · una sola copia di ogni pannello (appendChild SPOSTA);
   · i pulsanti delle sotto-sezioni restano nel DOM, nascosti: i conteggi, il
     catalogo, le schede di teoria e la navigazione di Spectra non cambiano;
   · un solo pulsante visibile per argomento, con etichetta tradotta dal
     dizionario delle lingue come ogni altra voce di navigazione.

   USO
     BSIHub.crea({
       id: 'scentrorganica', gruppo: 'navGroup0',
       pulsante: ['⚗️ Chimica organica', '⚗️ Organic chemistry'],
       titolo: ['Chimica organica', 'Organic chemistry'],
       intro: ['…', '…'],
       schede: [ { id:'smecc3d', ic:'🧪', nm:['Meccanismi 3D','3D mechanisms'], nota:['…','…'] }, … ]
     });
   L'etichetta di `pulsante` (in italiano) DEVE stare nei dizionari di
   bsi-lingue.js in tutte le lingue, come «🔬 Centro spettri».
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  var t = F ? F.t : function (it) { return it; };
  var tt = F ? F.tt : function (v) { return Array.isArray(v) ? v[0] : v; };
  var D = document;

  /* ── stile condiviso, iniettato una volta sola ───────────────────────── */
  function stile() {
    if (D.getElementById('bsiHub-stile')) return;
    var s = D.createElement('style');
    s.id = 'bsiHub-stile';
    s.textContent = [
      '.bsiHub-tit{font-weight:800;font-size:1.05rem;color:#eafffb;margin:0 0 4px}',
      '.bsiHub-intro{color:#9fb3c8;font-size:.9rem;margin-bottom:14px;max-width:860px;line-height:1.65}',
      '.bsiHub-schede{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}',
      '.bsiHub-sc{display:flex;flex-direction:column;align-items:flex-start;gap:1px;',
      ' border:1px solid #1e3a52;background:#0a1628;color:#cfe2f5;border-radius:11px;',
      ' padding:8px 12px;cursor:pointer;font-size:12.5px;font-weight:700;text-align:left;',
      ' transition:border-color .15s,background .15s}',
      '.bsiHub-sc:hover{border-color:#2f5f82;background:#0d1d33}',
      '.bsiHub-sc.on{border-color:#5eead4;background:linear-gradient(135deg,',
      ' rgba(94,234,212,.17),rgba(124,111,255,.09));color:#eafffb}',
      '.bsiHub-sc small{font-weight:500;font-size:10.5px;color:#8aadcc}',
      '.bsiHub-sc.on small{color:#9fe8da}',
      '.bsiHub-corpo>.section{margin:0;padding:0}',
      '.bsiHub-corpo>.section>.section-title{display:none}'
    ].join('');
    D.head.appendChild(s);
  }

  function crea(cfg) {
    if (!F) return null;
    var ID = cfg.id;
    var SCHEDE = function () { return cfg.schede; };
    var attiva = null;

    function pulsanteDi(sid) { return D.querySelector('.nav-btn[data-s="' + sid + '"]'); }

    function costruisci() {
      if (D.getElementById(ID)) return D.getElementById(ID);
      /* inserisce il pannello-hub davanti alla prima sotto-sezione che esiste */
      var rif = null, i;
      for (i = 0; i < cfg.schede.length; i++) { rif = D.getElementById(cfg.schede[i].id); if (rif && rif.parentNode) break; rif = null; }
      if (!rif || !rif.parentNode) return null;
      var d = D.createElement('div');
      d.id = ID; d.className = 'section';
      d.innerHTML =
        '<div class="bsiHub-tit" data-bsi-hubtit="1"></div>' +
        '<div class="bsiHub-intro" data-bsi-hubintro="1"></div>' +
        '<div class="bsiHub-schede"></div>' +
        '<div class="bsiHub-corpo"></div>';
      rif.parentNode.insertBefore(d, rif);
      return d;
    }

    function testi() {
      var hub = D.getElementById(ID); if (!hub) return;
      var ti = hub.querySelector('[data-bsi-hubtit]'); if (ti) ti.textContent = tt(cfg.titolo);
      var io = hub.querySelector('[data-bsi-hubintro]'); if (io) io.innerHTML = tt(cfg.intro);
    }

    function host() { var h = D.getElementById(ID); return h ? h.querySelector('.bsiHub-schede') : null; }
    function corpoDi() { var h = D.getElementById(ID); return h ? h.querySelector('.bsiHub-corpo') : null; }

    function disegnaSchede() {
      var h = host(); if (!h) return 0;
      h.innerHTML = ''; var n = 0;
      cfg.schede.forEach(function (s) {
        if (!D.getElementById(s.id)) return;
        var b = D.createElement('button');
        b.className = 'bsiHub-sc' + (s.id === attiva ? ' on' : '');
        b.setAttribute('data-bsi-sc', s.id);
        b.innerHTML = '<span>' + s.ic + ' ' + tt(s.nm) + '</span><small>' + tt(s.nota) + '</small>';
        b.onclick = function () { var p = pulsanteDi(s.id); if (p) p.click(); else mostra(s.id); };
        h.appendChild(b); n++;
      });
      return n;
    }

    function trasferisci() {
      var corpo = corpoDi(); if (!corpo) return 0;
      var n = 0;
      cfg.schede.forEach(function (s) {
        var sez = D.getElementById(s.id); if (!sez) return;
        if (sez.parentNode === corpo) { n++; return; }
        corpo.appendChild(sez);                 /* SPOSTA: una sola copia */
        sez.setAttribute('data-bsi-hub', ID);
        n++;
      });
      return n;
    }

    function assicuraPulsante(sid, etichetta) {
      if (pulsanteDi(sid)) return true;
      var gruppo = D.getElementById(cfg.gruppo) || D.getElementById('navGroup0');
      if (!gruppo) return false;
      var b = D.createElement('button');
      b.className = 'nav-btn';
      b.setAttribute('data-s', sid);
      b.setAttribute('data-bsi-creato', ID);
      b.textContent = etichetta || sid;
      b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; b.style.display = 'none';
      gruppo.appendChild(b);
      return true;
    }

    function nascondiPulsanti() {
      var n = 0;
      cfg.schede.forEach(function (s) {
        assicuraPulsante(s.id, s.ic + ' ' + tt(s.nm));
        var b = pulsanteDi(s.id); if (!b) return;
        b.style.display = 'none'; b.setAttribute('aria-hidden', 'true');
        b.setAttribute('data-bsi-spostato', ID); b.tabIndex = -1; n++;
      });
      return n;
    }

    function pulsanteCentro() {
      var b = pulsanteDi(ID); if (b) { b.textContent = tt(cfg.pulsante); return b; }
      var gruppo = D.getElementById(cfg.gruppo) || D.getElementById('navGroup0');
      if (!gruppo) return null;
      b = D.createElement('button');
      b.className = 'nav-btn';
      b.setAttribute('data-s', ID);
      b.textContent = tt(cfg.pulsante);
      b.style.cssText = 'border:1px solid #5eead4;background:linear-gradient(135deg,' +
        'rgba(94,234,212,.16),rgba(124,111,255,.1))';
      b.onclick = function () { apri(attiva || cfg.schede[0].id); };
      gruppo.insertBefore(b, gruppo.firstChild);
      return b;
    }

    function mostra(sid) {
      var hub = D.getElementById(ID), corpo = corpoDi();
      if (!hub || !corpo) return false;
      attiva = sid;
      [].forEach.call(D.querySelectorAll('.section'), function (x) {
        if (x === hub || x.parentNode === corpo) return;
        x.classList.remove('on');
      });
      hub.classList.add('on'); hub.style.display = 'block';
      [].forEach.call(D.querySelectorAll('.nav-btn'), function (x) { x.classList.remove('on'); });
      var pc = pulsanteDi(ID); if (pc) pc.classList.add('on');
      [].forEach.call(corpo.children, function (x) {
        var suo = (x.id === sid);
        x.classList.toggle('on', suo);
        x.style.display = suo ? 'block' : 'none';
      });
      [].forEach.call(hub.querySelectorAll('.bsiHub-sc'), function (b) {
        b.classList.toggle('on', b.getAttribute('data-bsi-sc') === sid);
      });
      return true;
    }

    function apri(sid) { var p = pulsanteDi(sid); if (p) { p.click(); return true; } return mostra(sid); }

    function nostra(sid) { return cfg.schede.some(function (s) { return s.id === sid; }); }

    function intercetta() {
      D.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('.nav-btn[data-s]') : null;
        if (!b) return;
        var sid = b.getAttribute('data-s');
        if (sid === ID) { setTimeout(function () { mostra(attiva || cfg.schede[0].id); }, 0); return; }
        if (!nostra(sid)) return;
        setTimeout(function () { mostra(sid); }, 0);
      }, false);
    }

    function applica() {
      stile();
      if (!costruisci()) return false;
      testi();
      nascondiPulsanti();
      var spostati = trasferisci();
      pulsanteCentro();
      disegnaSchede();
      if (!attiva) attiva = cfg.schede[0].id;
      return spostati > 0;
    }

    function avvia() {
      applica(); intercetta();
      [400, 1200, 2600, 5000].forEach(function (ms) {
        setTimeout(function () { nascondiPulsanti(); pulsanteCentro(); }, ms);
      });
    }

    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', avvia);
    else avvia();

    D.addEventListener('bsi-lingua', function () { testi(); disegnaSchede(); pulsanteCentro(); });

    return {
      ID: ID,
      schede: function () { return cfg.schede.map(function (s) { return s.id; }); },
      apri: apri, mostra: mostra, applica: applica,
      stato: function () {
        var corpo = corpoDi(), ids = cfg.schede.map(function (s) { return s.id; });
        return {
          sezioneEsiste: !!D.getElementById(ID),
          pulsanteEsiste: !!pulsanteDi(ID),
          dentroIlCentro: corpo ? ids.filter(function (i) { var e = D.getElementById(i); return !!(e && e.parentNode === corpo); }).length : 0,
          copieNelDocumento: ids.map(function (i) { return { id: i, quante: D.querySelectorAll('#' + i).length }; }),
          pulsantiNascosti: ids.filter(function (i) { var b = pulsanteDi(i); return !!(b && getComputedStyle(b).display === 'none'); }).length,
          pulsantiAncoraNelDom: ids.filter(function (i) { return !!pulsanteDi(i); }).length,
          schedeDisegnate: (D.getElementById(ID) || D).querySelectorAll ? (D.getElementById(ID) ? D.getElementById(ID).querySelectorAll('.bsiHub-sc').length : 0) : 0,
          attiva: attiva
        };
      }
    };
  }

  globale.BSIHub = { crea: crea, versione: '1.0' };
})(typeof window !== 'undefined' ? window : globalThis);
