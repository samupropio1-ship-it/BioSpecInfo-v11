/* ═══════════════════════════════════════════════════════════════════════
   bsi-risoluzione.js — la risoluzione di tutte le animazioni (v266)
   BioSpecInfo · © Samuele Pio Provenzano

   Un solo punto decide quanti pixel disegnano tutte le tele, 2D e 3D. Dalla
   v266 il massimo è 8K (richiesta dell'autore: «qualità 8K per ogni
   animazione»). I modi, in ordine sul pulsante:

     · «8K» (predefinita) — supercampionamento spinto: 2× i pixel fisici
       dello schermo (fino a 6×), con un tetto di 7680 px sul lato lungo e
       7680×4320 pixel per tela; a schermo intero su un monitor 4K la scena
       si disegna a 8K e viene poi rimpicciolita, così i bordi sono
       perfettamente lisci;
     · «4K» — 1,5× i pixel fisici (fino a 4×), tetto 3840×2160;
     · «Nativa» — esattamente i pixel fisici dello schermo (fino a 4×);
     · «Risparmio» — 1×, per i telefoni lenti o la batteria scarica.

   Sicurezza: il lato di ogni tela 3D è limitato alla dimensione massima di
   texture della GPU (letta dai renderer, altrimenti 8192), così l'8K non
   lascia mai una tela nera su schede deboli. Le vecchie preferenze «ultra»
   restano valide e valgono «4K».

   BSIRisoluzione.dpr(larghezza, altezza) dà il rapporto; imposta(modo) lo
   cambia, lo ricorda e lo applica subito a tutti i renderer e alle tele 2D.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var CHIAVE = 'bsi-risoluzione';
  /* ogni modo: fattore sul DPR fisico, tetto DPR, lato massimo (px), pixel massimi (px²) */
  var DEF = {
    max8k:     { k: 2.0, max: 6, lato: 7680, pixel: 7680 * 4320 },
    ultra:     { k: 1.5, max: 4, lato: 3840, pixel: 3840 * 2160 },
    nativa:    { k: 1.0, max: 4, lato: 3840, pixel: 3840 * 2160 },
    risparmio: { k: 0.0, max: 1, lato: 2560, pixel: 2560 * 1440 }
  };
  var MODI = ['max8k', 'ultra', 'nativa', 'risparmio'];
  var NOMI = { max8k: ['8K', '8K'], ultra: ['4K', '4K'], nativa: ['Nativa', 'Native'], risparmio: ['Risparmio', 'Saver'] };
  var MAXTEX = 8192;   /* aggiornato dai renderer reali */
  function modo() { try { var m = g.localStorage.getItem(CHIAVE); if (m === 'ultra8k') m = 'max8k'; if (DEF[m]) return m; } catch (e) { } return 'max8k'; }
  function nativa() { return Math.max(1, +g.devicePixelRatio || 1); }
  /** il rapporto pixel/CSS da usare per una tela di w × h px CSS (le misure sono facoltative) */
  function dpr(w, h) {
    var d = DEF[modo()], n = nativa(), r = d.k === 0 ? 1 : Math.min(d.max, n * d.k);
    if (w > 0 && h > 0) { r = Math.min(r, Math.max(1, Math.min(d.lato / Math.max(w, h), Math.sqrt(d.pixel / (w * h))))); r = Math.min(r, Math.max(1, MAXTEX / Math.max(w, h))); }
    return Math.round(r * 100) / 100;
  }
  function latoMax() { return DEF[modo()].lato; }
  /* i renderer three.js: si ricordano quando chiamano setPixelRatio, così un cambio di modo li aggiorna tutti */
  var renderer = [];
  function annota(r) { try { var m = r.capabilities && r.capabilities.maxTextureSize; if (m && m > 1024) MAXTEX = Math.min(16384, m); } catch (e) { } }
  function aggancia() {
    var T = g.THREE; if (!T || !T.WebGLRenderer || T.WebGLRenderer.__bsiRis) return !!(T && T.WebGLRenderer && T.WebGLRenderer.__bsiRis);
    var Orig = T.WebGLRenderer;
    function R(p) { var r = new Orig(p); annota(r); renderer.push(r); if (renderer.length > 80) renderer = renderer.filter(function (x) { return x.domElement && x.domElement.isConnected; }); return r; }
    R.prototype = Orig.prototype; R.__bsiRis = true; Object.keys(Orig).forEach(function (k) { R[k] = Orig[k]; });
    try { T.WebGLRenderer = R; } catch (e) { return false; }
    try { if (T.Texture && (T.Texture.DEFAULT_ANISOTROPY || 1) < 16) T.Texture.DEFAULT_ANISOTROPY = 16; } catch (e) { }
    return true;
  }
  if (!aggancia()) {
    try { g.document.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'SCRIPT') aggancia(); }, true); } catch (e) { }
    var k = 0, ti = setInterval(function () { if (aggancia() || ++k > 3600) clearInterval(ti); }, 1000);
  }
  function applica() {
    renderer.forEach(function (r) {
      try { annota(r); if (!r.domElement || !r.domElement.isConnected || r.__bsiFisso) return; var c = r.domElement, w = c.clientWidth, h = c.clientHeight; if (w && h) { r.setPixelRatio(dpr(w, h)); r.setSize(w, h, false); } } catch (e) { }
    });
    try { g.dispatchEvent(new Event('resize')); g.dispatchEvent(new CustomEvent('bsi-risoluzione', { detail: { modo: modo(), dpr: dpr() } })); } catch (e) { }
  }
  function imposta(m) { if (m === 'ultra8k') m = 'max8k'; if (!DEF[m]) return modo(); try { g.localStorage.setItem(CHIAVE, m); } catch (e) { } applica(); return m; }
  function prossimo() { return imposta(MODI[(MODI.indexOf(modo()) + 1) % MODI.length]); }
  function nome(m) { var l = (g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() === 'en') ? 1 : 0; return NOMI[m || modo()][l]; }
  /** una foto PNG alla massima risoluzione del modo (8K per impostazione) di un renderer: disegna(r) fa il render; torna il dataURL */
  function fotoAlta(r, disegna) {
    var c = r.domElement, w = c.clientWidth || c.width, h = c.clientHeight || c.height, pr = r.getPixelRatio(), lato = Math.min(latoMax(), MAXTEX), k = lato / Math.max(w, h);
    r.setPixelRatio(k); r.setSize(w, h, false); disegna(r); var url = c.toDataURL('image/png');
    r.setPixelRatio(pr); r.setSize(w, h, false); disegna(r); return url;
  }
  g.BSIRisoluzione = { aggancia: aggancia, dpr: dpr, modo: modo, imposta: imposta, prossimo: prossimo, nome: nome, nativa: nativa, applica: applica, fotoAlta: fotoAlta, foto4K: fotoAlta, foto8K: fotoAlta, latoMax: latoMax, MODI: MODI, maxTex: function () { return MAXTEX; }, renderer: function () { return renderer.slice(); } };
})(typeof window !== 'undefined' ? window : globalThis);
