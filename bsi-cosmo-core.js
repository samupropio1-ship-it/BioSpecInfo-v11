/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-core.js — 🎞️ Simulazioni cosmiche: il motore comune (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Nove simulazioni «cinematiche» chieste dall'autore sul modello di reel di
   divulgazione: devono sembrare un video verticale ma essere SIMULAZIONI vere,
   con la fisica calcolata, l'HUD numerico, i comandi e un «Play cinematico»
   che esegue da solo la sequenza di camera e scene. Qui il motore comune:
   · la scena è una Scena del Laboratorio 3D (three.js r128 già incluso,
     resa «cinema»: bagliore sopra soglia, ACES, vignettatura), quindi ha anche
     il pulsante AR; sfondo nero puro come nei video;
   · formato 9:16 (o 16:9) con le zone sicure: niente HUD nel 15 % in basso né
     nella colonna destra;
   · la TIMELINE a fotogrammi chiave { t, cam: { pos, target, fov }, stato,
     didascalia } interpolata con easeInOutCubic; ▶ cinematico, ⏸, ↺, «esplora»
     (la camera torna libera);
   · l'HUD in monospazio maiuscoletto, le didascalie in serif corsivo con
     dissolvenza di 0,4 s;
   · «Registra»: canvas.captureStream(60) + MediaRecorder → .webm, con la
     risoluzione portata a 1080×1920 durante la registrazione;
   · pausa quando la scheda è nascosta, ma l'inizializzazione non dipende da
     requestAnimationFrame (che nelle schede nascoste non gira).
   Ogni simulazione si registra con BSICosmo.registra(id, def): def.init(ctx)
   riceve { S, T, hud, didascalia, stato, overlay } e restituisce
   { passo(dt, t), timeline, durata, dispose }.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;   /* il registro delle simulazioni e la fisica servono anche senza pagina (banchi in Node) */
  var t = F.t;
  var SIM = [], PER_ID = {};
  function registra(id, def) { def.id = id; if (!PER_ID[id]) SIM.push(def); PER_ID[id] = def; }
  function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function lerp(a, b, s) { return a + (b - a) * s; }
  function lerp3(a, b, s) { return [lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s)]; }
  /** lo stato della timeline al tempo tt: camera interpolata fra i due fotogrammi, didascalia e stato del più recente */
  function campiona(tl, tt) {
    if (!tl || !tl.length) return null;
    var i = 0; while (i < tl.length - 1 && tl[i + 1].t <= tt) i++;
    var a = tl[i], b = tl[Math.min(i + 1, tl.length - 1)], s = b.t > a.t ? Math.max(0, Math.min(1, (tt - a.t) / (b.t - a.t))) : 0, e = easeInOutCubic(s);
    var ca = a.cam || {}, cb = b.cam || ca;
    return { cam: { pos: lerp3(ca.pos || [0, -10, 4], cb.pos || ca.pos || [0, -10, 4], e), target: lerp3(ca.target || [0, 0, 0], cb.target || ca.target || [0, 0, 0], e), fov: lerp(ca.fov || 42, cb.fov || ca.fov || 42, e) }, didascalia: a.didascalia, stato: a.stato || {}, indice: i, s: s };
  }
  function stile() {
    if (D.getElementById('bsiCO-stile')) return;
    var s = D.createElement('style'); s.id = 'bsiCO-stile';
    s.textContent = '.bsiCO-griglia{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:8px 0 14px}' +
      '.bsiCO-card{position:relative;aspect-ratio:9/12;border-radius:12px;border:1px solid #1a3050;background:radial-gradient(120% 90% at 50% 30%,#13284a 0%,#000 75%);color:#e6f2ff;cursor:pointer;overflow:hidden;text-align:left;padding:0}' +
      '.bsiCO-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85}.bsiCO-card span{position:absolute;left:8px;right:8px;bottom:8px;font:italic 600 .95rem/1.2 "Cormorant Garamond","EB Garamond",Georgia,serif;text-shadow:0 1px 3px #000}' +
      '.bsiCO-card b{position:absolute;left:8px;top:6px;font:600 .62rem ui-monospace,Menlo,monospace;letter-spacing:.15em;color:#00c9b7}.bsiCO-card[aria-pressed="true"]{border-color:#00c9b7;box-shadow:0 0 0 2px rgba(0,201,183,.35)}' +
      '.bsiCO-palco{position:relative;margin:0 auto;max-width:100%}.bsiCO-palco .bsi3d-box{background:#000;border-color:#111}.bsiCO-palco .bsi3d-barra{top:auto;bottom:8px;right:6px;flex-direction:column}.bsiCO-palco .bsi3d-dida{display:none}' +
      '.bsiCO-hud{position:absolute;left:10px;top:8px;max-width:62%;pointer-events:none;font:500 10px/1.55 ui-monospace,"JetBrains Mono",Menlo,monospace;letter-spacing:.15em;text-transform:uppercase;color:#a9bfd6;text-shadow:0 1px 2px #000}' +
      '.bsiCO-hud .gr{font:italic 600 22px/1.15 "Cormorant Garamond","EB Garamond",Georgia,serif;letter-spacing:0;text-transform:none;color:#fff}.bsiCO-hud .ac{color:#00c9b7}' +
      '.bsiCO-stato{position:absolute;right:10px;top:10px;max-width:36%;text-align:right;pointer-events:none;font:italic 600 18px/1.2 "Cormorant Garamond",Georgia,serif;color:#5fe3d6;text-shadow:0 1px 3px #000}.bsiCO-stato small{display:block;font:500 9px ui-monospace,Menlo,monospace;letter-spacing:.15em;color:#a9bfd6}' +
      '.bsiCO-dida{position:absolute;left:8%;right:16%;top:46%;text-align:center;pointer-events:none;font:italic 500 clamp(17px,4.2vw,28px)/1.25 "Cormorant Garamond","EB Garamond",Georgia,serif;color:#fff;text-shadow:0 2px 6px #000;opacity:0;transition:opacity .4s}.bsiCO-dida.on{opacity:1}.bsiCO-dida em{color:#5fe3d6;font-style:italic}' +
      '.bsiCO-comandi{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.bsiCO-comandi button{min-height:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;font:600 .85rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}.bsiCO-comandi button[aria-pressed="true"]{border-color:#00c9b7;color:#00c9b7}' +
      '.bsiCO-tela2d{position:absolute;pointer-events:none}';
    D.head.appendChild(s);
  }

  /** costruisce il palco di una simulazione dentro padre */
  function avvia(padre, id, opz) {
    opz = opz || {};
    var def = PER_ID[id]; if (!def) throw new Error('simulazione sconosciuta: ' + id);
    stile(); padre.textContent = '';
    var formato = opz.formato || '9:16', comandi = F.el('div', { 'class': 'bsiCO-comandi', role: 'toolbar', 'aria-label': t('Comandi della simulazione', 'Simulation controls') });
    var palco = F.el('div', { 'class': 'bsiCO-palco' }), pannello = F.el('div', { 'class': 'bsiFX-pannello', style: 'margin-top:8px' });
    padre.appendChild(comandi); padre.appendChild(palco); padre.appendChild(pannello);
    var L3 = g.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); palco.appendChild(attesa);
    var api = { id: id, pronto: false };
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return api; }
    L3.stile();
    function larghezza() { var w = padre.clientWidth || 360, h = (g.innerHeight || 800) * 0.82; return formato === '9:16' ? Math.min(w, h * 9 / 16) : w; }
    L3.caricaThree().then(function () {
      attesa.remove();
      var T = g.THREE, webgl = true;
      try { var prova = D.createElement('canvas'); webgl = !!(prova.getContext('webgl') || prova.getContext('experimental-webgl')); } catch (e) { webgl = false; }
      palco.style.width = larghezza() + 'px';
      if (!webgl && def.fallback2d) { var c2 = F.el('canvas', { style: 'width:100%;aspect-ratio:9/16;background:#000;border-radius:10px' }); palco.appendChild(c2); def.fallback2d(c2); api.pronto = true; return; }
      var S = new L3.Scena(palco, formato === '9:16' ? 16 / 9 : 9 / 16); palco.insertBefore(S.box, palco.firstChild);
      S.ren.setClearColor(0x000000, 1); S.adatta();
      if (S.cinema) try { S.cinema({ forza: def.bagliore || 1.0, soglia: 0.55, vignetta: 0.35, esposizione: 1.0 }); } catch (e) { }
      var hud = F.el('div', { 'class': 'bsiCO-hud', 'aria-live': 'off' }), stato = F.el('div', { 'class': 'bsiCO-stato' }), dida = F.el('div', { 'class': 'bsiCO-dida', 'aria-live': 'polite' });
      S.box.appendChild(hud); S.box.appendChild(stato); S.box.appendChild(dida);
      var overlay = F.el('canvas', { 'class': 'bsiCO-tela2d' }); S.box.appendChild(overlay);
      function misuraOverlay() { var r = S.ren.domElement, dpr = Math.min(2, g.devicePixelRatio || 1); overlay.style.left = '0'; overlay.style.top = '0'; overlay.style.width = r.clientWidth + 'px'; overlay.style.height = r.clientHeight + 'px'; overlay.width = r.clientWidth * dpr; overlay.height = r.clientHeight * dpr; var q = overlay.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); return q; }
      var q2 = misuraOverlay();
      var ultimaDida = null;
      function didascalia(html) { if (html === ultimaDida) return; ultimaDida = html; dida.classList.remove('on'); setTimeout(function () { dida.innerHTML = html || ''; if (html) dida.classList.add('on'); }, html ? 200 : 0); }
      var ctx = { S: S, T: T, hud: hud, stato: stato, didascalia: didascalia, didaEl: dida, overlay: function () { return { q: q2, w: S.ren.domElement.clientWidth, h: S.ren.domElement.clientHeight }; }, pannello: pannello, L3: L3, formato: formato };
      var sim = def.init(ctx), tempo = 0, cinematico = !opz.esplora, inPausa = false;
      /* comandi */
      function bott(testo, f, aria) { var b = F.el('button', { type: 'button', testo: testo, 'aria-label': aria || testo, onclick: function () { f(b); } }); comandi.appendChild(b); return b; }
      var bPlay = bott('▶ ' + t('Cinematico', 'Cinematic'), function () { cinematico = true; inPausa = false; aggiornaTasti(); S.avvia(); });
      var bPausa = bott('⏸', function () { inPausa = !inPausa; aggiornaTasti(); if (!inPausa) S.avvia(); }, t('Pausa', 'Pause'));
      bott('↺', function () { tempo = 0; if (sim.reset) sim.reset(); S.avvia(); }, t('Ricomincia', 'Restart'));
      var bEsplora = bott('🧭 ' + t('Esplora', 'Explore'), function () { cinematico = false; aggiornaTasti(); S.avvia(); });
      var bForm = bott(formato === '9:16' ? '9:16' : '16:9', function () { avvia(padre, id, { formato: formato === '9:16' ? '16:9' : '9:16' }); }, t('Formato', 'Format'));
      var reg = null, bReg = bott('⏺ ' + t('Registra', 'Record'), function () { if (reg) { reg.stop(); return; } registraVideo(); });
      function aggiornaTasti() { bPlay.setAttribute('aria-pressed', String(cinematico && !inPausa)); bPausa.setAttribute('aria-pressed', String(inPausa)); bEsplora.setAttribute('aria-pressed', String(!cinematico)); }
      aggiornaTasti();
      function registraVideo() {
        var c = S.ren.domElement; if (!c.captureStream || !g.MediaRecorder) { bReg.textContent = t('Registrazione non supportata', 'Recording not supported'); return; }
        var prima = S.ren.getPixelRatio(), alt = c.clientHeight || 640; try { S.ren.setPixelRatio(Math.min(3, 1920 / alt)); S.ren.setSize(c.clientWidth, c.clientHeight, false); if (S._post && S._post.ridimensiona) S._post.ridimensiona(); } catch (e) { }
        var tipo = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].filter(function (m) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m); })[0] || 'video/webm';
        var pezzi = []; reg = new MediaRecorder(c.captureStream(60), { mimeType: tipo, videoBitsPerSecond: 12e6 });
        reg.ondataavailable = function (e) { if (e.data && e.data.size) pezzi.push(e.data); };
        reg.onstop = function () { try { S.ren.setPixelRatio(prima); S.ren.setSize(c.clientWidth, c.clientHeight, false); } catch (e) { } var b = new Blob(pezzi, { type: 'video/webm' }), a = D.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'biospecinfo-' + id + '.webm'; D.body.appendChild(a); a.click(); a.remove(); reg = null; bReg.textContent = '⏺ ' + t('Registra', 'Record'); };
        reg.start(250); bReg.textContent = '⏹ ' + t('Ferma e salva', 'Stop and save'); tempo = 0; cinematico = true; inPausa = false; aggiornaTasti(); S.avvia();
        setTimeout(function () { if (reg && reg.state === 'recording') reg.stop(); }, (sim.durata || 20) * 1000 + 300);
      }
      /* il ciclo: la timeline guida la camera in modo cinematico */
      var v = S.vista, dir = new T.Vector3();
      function applicaCamera(cam) {
        v.bersaglio.set(cam.target[0], cam.target[1], cam.target[2]);
        var dx = cam.pos[0] - cam.target[0], dy = cam.pos[1] - cam.target[1], dz = cam.pos[2] - cam.target[2], r = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        v.r = r; v.th = Math.atan2(dy, dx); v.ph = Math.max(0.01, Math.min(Math.PI - 0.01, Math.acos(dz / r)));
        if (Math.abs(S.cam.fov - cam.fov) > 0.01) { S.cam.fov = cam.fov; S.cam.updateProjectionMatrix(); }
      }
      S.ogniFotogramma(function (dt) {
        if (D.hidden) return true;
        if (!inPausa) tempo += dt;
        var dur = sim.durata || 20, tt = sim.ciclo === false ? Math.min(tempo, dur) : tempo % dur;
        var k = campiona(sim.timeline, tt);
        if (k && cinematico) { applicaCamera(k.cam); didascalia(k.didascalia || ''); }
        if (!cinematico) didascalia('');
        if (sim.passo) sim.passo(inPausa ? 0 : dt, tt, k ? k.stato : {}, cinematico);
        return true;
      });
      F.alRidimensiona(function () { palco.style.width = larghezza() + 'px'; S.adatta(); q2 = misuraOverlay(); });
      if (opz.alPronto) opz.alPronto(api);
      api.pronto = true; api.S = S; api.sim = sim; api.tempo = function () { return tempo; }; api.vai = function (x) { tempo = x; S.avvia(); }; api.cinematico = function (c) { cinematico = c; aggiornaTasti(); };
      api.istantanea = function () { S.disegna(); try { return S.ren.domElement.toDataURL('image/jpeg', 0.7); } catch (e) { return ''; } };
      S.avvia();
    }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    return api;
  }

  /** la sezione: griglia di nove schede-anteprima, poi il palco della simulazione scelta */
  function schedaSezione(div) {
    stile();
    var gr = F.el('div', { 'class': 'bsiCO-griglia', role: 'list' }), palco = F.el('div');
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Ogni simulazione è calcolata mentre la guardi: ▶ Cinematico esegue la sequenza di camera, 🧭 Esplora ti lascia la camera, ⏺ Registra salva un video .webm verticale.', 'Every simulation is computed as you watch: ▶ Cinematic runs the camera sequence, 🧭 Explore hands you the camera, ⏺ Record saves a vertical .webm video.') }));
    div.appendChild(gr); div.appendChild(palco);
    var corrente = null, carte = {};
    function apri(id) {
      Object.keys(carte).forEach(function (k) { carte[k].setAttribute('aria-pressed', String(k === id)); });
      corrente = avvia(palco, id, { alPronto: function (a) { setTimeout(function () { var img = a.istantanea && a.istantanea(); if (img && carte[id] && !carte[id].querySelector('img')) { var im = D.createElement('img'); im.alt = ''; im.src = img; carte[id].insertBefore(im, carte[id].firstChild); } }, 1500); } });
      div._cosmo = corrente;
    }
    SIM.slice().sort(function (a, b) { return (a.n || 99) - (b.n || 99); }).forEach(function (s, i) {
      var c = F.el('button', { type: 'button', 'class': 'bsiCO-card', role: 'listitem', 'aria-pressed': 'false', 'aria-label': F.tt(s.titolo) });
      c.appendChild(F.el('b', { testo: String(s.n || i + 1).padStart(2, '0') + ' · ' + (s.etichetta || s.id).toUpperCase() })); c.appendChild(F.el('span', { testo: F.tt(s.titolo) }));
      c.addEventListener('click', function () { apri(s.id); palco.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      carte[s.id] = c; gr.appendChild(c);
    });
    if (SIM.length) apri(SIM.slice().sort(function (a, b) { return (a.n || 99) - (b.n || 99); })[0].id);
    div._apri = apri;
  }

  g.BSICosmo = { registra: registra, avvia: avvia, campiona: campiona, easeInOutCubic: easeInOutCubic, elenco: function () { return SIM.map(function (s) { return s.id; }); }, schedaSezione: schedaSezione };
})(typeof window !== 'undefined' ? window : globalThis);
