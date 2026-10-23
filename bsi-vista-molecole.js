/* ═══════════════════════════════════════════════════════════════════════════
   bsi-vista-molecole.js — 🧊 la qualità di tutte le viste molecolari 3D
   BioSpecInfo · © Samuele Pio Provenzano

   L'app crea i visori 3Dmol in cinque punti diversi (centro spettri,
   molecola, ChemDraw 3D, macromolecole, schede PubChem). Invece di toccarli
   uno per uno, questo modulo avvolge $3Dmol.createViewer: ogni visore,
   vecchio o futuro, riceve

   · le impostazioni di resa scelte per il dispositivo:
       alta   — antialias e occlusione ambientale (le cavità e i punti di
                contatto fra gli atomi si scuriscono: la forma si legge
                molto meglio che con la sola luce diretta);
       media  — antialias;
       bassa  — niente, per i telefoni lenti;
     «automatica» sceglie da sola: bassa su un rasterizzatore software,
     media sui telefoni, alta altrove. La scelta si cambia dalla barra e
     resta memorizzata;
   · una piccola barra di comandi nell'angolo: rotazione continua,
     ricentra, foto PNG, schermo intero, qualità.

   Se un'impostazione non è supportata dalla scheda grafica, il visore
   viene ricreato senza: non si perde mai la vista.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var D = globale.document;
  if (!D || !globale.$3Dmol || globale.$3Dmol._bsiQualita) return;
  /* $3Dmol e' lo spazio dei nomi di un modulo: le sue proprieta' sono in sola
     lettura. Lo si sostituisce con un Proxy che cambia solo createViewer. */
  var M = globale.$3Dmol, originale = M.createViewer;
  if (typeof Proxy === 'undefined' || typeof originale !== 'function') return;
  var CHIAVE = 'bsi-qualita3d';
  function en() { try { return (localStorage.getItem('bsi_lang') || localStorage.getItem('bsi-lingua') || 'it') !== 'it'; } catch (e) { return false; } }
  function t(it, e) { return en() ? e : it; }

  var _auto = null;
  function automatica() {
    if (_auto) return _auto;
    var lento = false;
    try {
      var c = D.createElement('canvas'), g = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!g) lento = true;
      else { var x = g.getExtension('WEBGL_debug_renderer_info'), r = x ? String(g.getParameter(x.UNMASKED_RENDERER_WEBGL)) : ''; if (/swiftshader|llvmpipe|software/i.test(r)) lento = true; var l = g.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); }
    } catch (e) { lento = true; }
    var telefono = /Android|iPhone|iPad|Mobile/i.test(globale.navigator && navigator.userAgent || '') || Math.min(globale.innerWidth || 1000, globale.innerHeight || 1000) < 600;
    _auto = lento ? 'bassa' : telefono ? 'media' : 'alta';
    return _auto;
  }
  function scelta() { try { return localStorage.getItem(CHIAVE) || 'auto'; } catch (e) { return 'auto'; } }
  function livello() { var s = scelta(); return s === 'auto' ? automatica() : s; }
  function impostazioni(l) {
    if (l === 'alta') return { antialias: true, ambientOcclusion: { strength: 0.9, radius: 6 } };
    if (l === 'media') return { antialias: true };
    return { antialias: false };
  }

  var visori = [];
  function creaVisore(el, cfg) {
    var lv = livello(), base = {}, k, v;
    cfg = cfg || {};
    var imp = impostazioni(lv);
    for (k in imp) base[k] = imp[k];
    for (k in cfg) base[k] = cfg[k];
    try { v = originale.call(M, el, base); }
    catch (e) {
      /* la scheda grafica non regge l'occlusione: si riprova con il minimo */
      try { if (el && el.querySelector) [].forEach.call(el.querySelectorAll('canvas'), function (c) { c.remove(); }); } catch (e2) { }
      v = originale.call(M, el, cfg); lv = 'media';
    }
    try { barra(el, v, lv); } catch (e) { }
    visori.push({ el: el, v: v });
    return v;
  }
  globale.$3Dmol = new Proxy(M, { get: function (o, n) { if (n === 'createViewer') return creaVisore; if (n === '_bsiQualita') return true; return o[n]; } });

  function stile() {
    if (D.getElementById('bsi-vm-stile')) return;
    var s = D.createElement('style'); s.id = 'bsi-vm-stile';
    s.textContent = '.bsi-vm-barra{position:absolute;top:6px;right:6px;z-index:5;display:flex;gap:3px;opacity:.55;transition:opacity .2s}' +
      '.bsi-vm-barra:hover,.bsi-vm-barra:focus-within{opacity:1}' +
      '.bsi-vm-barra button{background:rgba(8,21,34,.88);color:#e6fffb;border:1px solid #2a4a6e;border-radius:7px;min-width:30px;height:28px;padding:0 6px;font-size:14px;line-height:26px;cursor:pointer}' +
      '.bsi-vm-barra button[aria-pressed="true"]{border-color:#5eead4;color:#5eead4}' +
      '@media (hover:none){.bsi-vm-barra{opacity:.85}}';
    D.head.appendChild(s);
  }
  function barra(el, v, lv) {
    if (!el || !el.appendChild || !v) return;
    stile();
    if (globale.getComputedStyle && getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var vecchia = el.querySelector(':scope > .bsi-vm-barra'); if (vecchia) vecchia.remove();
    var b = D.createElement('div'); b.className = 'bsi-vm-barra'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', t('Comandi della vista 3D', '3D view controls'));
    function tasto(ic, nome, f) { var x = D.createElement('button'); x.type = 'button'; x.textContent = ic; x.title = nome; x.setAttribute('aria-label', nome); x.addEventListener('click', function (e) { e.stopPropagation(); f(x); }); b.appendChild(x); return x; }
    var gira = false;
    tasto('⟳', t('Rotazione continua', 'Continuous rotation'), function (x) { gira = !gira; x.setAttribute('aria-pressed', gira ? 'true' : 'false'); try { v.spin(gira ? 'y' : false); } catch (e) { } }).setAttribute('aria-pressed', 'false');
    tasto('⌖', t('Ricentra', 'Recentre'), function () { try { v.zoomTo(); v.render(); } catch (e) { } });
    tasto('📷', t('Salva immagine PNG', 'Save PNG image'), function () {
      try { v.render(); var a = D.createElement('a'); a.href = v.pngURI(); a.download = 'molecola-3d.png'; D.body.appendChild(a); a.click(); a.remove(); } catch (e) { }
    });
    tasto('⛶', t('Schermo intero', 'Full screen'), function () {
      var fs = D.fullscreenElement || D.webkitFullscreenElement;
      try { if (fs) (D.exitFullscreen || D.webkitExitFullscreen).call(D); else (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } catch (e) { }
      setTimeout(function () { try { v.resize(); v.render(); } catch (e) { } }, 300);
    });
    var NOMI = { alta: t('alta', 'high'), media: t('media', 'medium'), bassa: t('bassa', 'low') };
    var q = tasto('✦', '', function () {
      var ordine = ['auto', 'alta', 'media', 'bassa'], s = ordine[(ordine.indexOf(scelta()) + 1) % 4];
      try { localStorage.setItem(CHIAVE, s); } catch (e) { }
      etichetta();
      /* la qualita' vale per i visori creati da ora: si avvisa e si ridisegna */
      try { v.render(); } catch (e) { }
    });
    function etichetta() { var s = scelta(), nome = t('Qualità 3D: ', '3D quality: ') + (s === 'auto' ? t('automatica', 'automatic') + ' (' + NOMI[automatica()] + ')' : NOMI[s]) + t(' — vale per le viste aperte da ora', ' — applies to views opened from now on'); q.title = nome; q.setAttribute('aria-label', nome); }
    etichetta();
    el.appendChild(b);
    el.dataset.bsiQualita = lv;
  }

  globale.BSIVistaMolecole = { livello: livello, automatica: automatica, impostazioni: impostazioni, visori: function () { return visori.length; } };
})(typeof window !== 'undefined' ? window : globalThis);
