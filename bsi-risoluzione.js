/* ═══════════════════════════════════════════════════════════════════════
   bsi-risoluzione.js — la risoluzione di tutte le animazioni (v264)
   BioSpecInfo · © Samuele Pio Provenzano

   Prima ogni tela (2D e 3D) limitava i pixel a 2× quelli CSS: su un
   telefono con schermo a 3× l'immagine veniva ingrandita e si vedeva
   sgranata. Qui c'è un solo punto che decide quanti pixel disegnare:

     · «4K» (predefinita) — supercampionamento: 1,5× i pixel fisici dello
       schermo (fino a 4×), i bordi escono lisci anche senza antialiasing;
       con un limite di 3840 px sul lato lungo e 3840×2160 pixel in tutto
       per tela, così a schermo intero su un monitor 4K si disegna in 4K
       e non oltre;
     · «Nativa» — esattamente i pixel fisici dello schermo (fino a 4×);
     · «Risparmio» — 1×, per i telefoni lenti o la batteria scarica.

   BSIRisoluzione.dpr(larghezzaCss, altezzaCss) dà il rapporto da usare;
   imposta(modo) lo cambia, lo ricorda sul dispositivo e lo applica subito
   a tutti i renderer three.js già creati e a tutte le tele 2D (che si
   ridisegnano sull'evento «resize»).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var CHIAVE = 'bsi-risoluzione', MODI = ['ultra', 'nativa', 'risparmio'], LATO = 3840, PIXEL = 3840 * 2160;
  var NOMI = { ultra: ['4K', '4K'], nativa: ['Nativa', 'Native'], risparmio: ['Risparmio', 'Saver'] };
  function modo() { try { var m = g.localStorage.getItem(CHIAVE); if (MODI.indexOf(m) >= 0) return m; } catch (e) { } return 'ultra'; }
  function nativa() { return Math.max(1, +g.devicePixelRatio || 1); }
  /** il rapporto pixel/CSS da usare per una tela di w × h px CSS (le misure sono facoltative) */
  function dpr(w, h) {
    var m = modo(), n = nativa(), r = m === 'ultra' ? Math.min(4, n * 1.5) : m === 'nativa' ? Math.min(4, n) : 1;
    if (w > 0 && h > 0) r = Math.min(r, Math.max(1, Math.min(LATO / Math.max(w, h), Math.sqrt(PIXEL / (w * h)))));
    return Math.round(r * 100) / 100;
  }
  /* i renderer three.js: si ricordano quando chiamano setPixelRatio, così un cambio di modo li aggiorna tutti */
  var renderer = [];
  function aggancia() {
    var T = g.THREE; if (!T || !T.WebGLRenderer || T.WebGLRenderer.__bsiRis) return !!(T && T.WebGLRenderer && T.WebGLRenderer.__bsiRis);
    var Orig = T.WebGLRenderer;
    function R(p) { var r = new Orig(p); renderer.push(r); if (renderer.length > 80) renderer = renderer.filter(function (x) { return x.domElement && x.domElement.isConnected; }); return r; }
    R.prototype = Orig.prototype; R.__bsiRis = true; Object.keys(Orig).forEach(function (k) { R[k] = Orig[k]; });
    try { T.WebGLRenderer = R; } catch (e) { return false; }
    /* texture più nitide viste di sbieco (filtro anisotropo) per tutte le scene */
    try { if (T.Texture && (T.Texture.DEFAULT_ANISOTROPY || 1) < 8) T.Texture.DEFAULT_ANISOTROPY = 8; } catch (e) { }
    return true;
  }
  if (!aggancia()) {
    /* three.js arriva di solito più tardi, caricato al primo uso: lo si aggancia nell'istante in cui il suo <script> finisce
       di caricarsi (prima che chi l'ha chiesto crei la scena), e per sicurezza anche con un controllo ogni secondo */
    try { g.document.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'SCRIPT') aggancia(); }, true); } catch (e) { }
    var k = 0, ti = setInterval(function () { if (aggancia() || ++k > 3600) clearInterval(ti); }, 1000);
  }
  function applica() {
    renderer.forEach(function (r) {
      try { if (!r.domElement || !r.domElement.isConnected || r.__bsiFisso) return; var c = r.domElement, w = c.clientWidth, h = c.clientHeight; if (w && h) { r.setPixelRatio(dpr(w, h)); r.setSize(w, h, false); } } catch (e) { }
    });
    try { g.dispatchEvent(new Event('resize')); g.dispatchEvent(new CustomEvent('bsi-risoluzione', { detail: { modo: modo(), dpr: dpr() } })); } catch (e) { }
  }
  function imposta(m) { if (MODI.indexOf(m) < 0) return modo(); try { g.localStorage.setItem(CHIAVE, m); } catch (e) { } applica(); return m; }
  function prossimo() { return imposta(MODI[(MODI.indexOf(modo()) + 1) % MODI.length]); }
  function nome(m) { var l = (g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() === 'en') ? 1 : 0; return NOMI[m || modo()][l]; }
  /** una foto PNG in 4K di un renderer three.js: disegna(r) deve fare il render; torna il dataURL */
  function foto4K(r, disegna) {
    var c = r.domElement, w = c.clientWidth || c.width, h = c.clientHeight || c.height, pr = r.getPixelRatio(), k = LATO / Math.max(w, h);
    r.setPixelRatio(k); r.setSize(w, h, false); disegna(r); var url = c.toDataURL('image/png');
    r.setPixelRatio(pr); r.setSize(w, h, false); disegna(r); return url;
  }
  g.BSIRisoluzione = { aggancia: aggancia, dpr: dpr, modo: modo, imposta: imposta, prossimo: prossimo, nome: nome, nativa: nativa, applica: applica, foto4K: foto4K, MODI: MODI, LATO: LATO, PIXEL: PIXEL, renderer: function () { return renderer.slice(); } };
})(typeof window !== 'undefined' ? window : globalThis);
