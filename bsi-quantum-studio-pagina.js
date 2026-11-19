/* ═══════════════════════════════════════════════════════════════════════
   bsi-quantum-studio-pagina.js — la pagina, il bridge, lo strumento (v265)
   BioSpecInfo · © Samuele Pio Provenzano

   Costruisce la sezione 🌌 BioSpec Quantum Studio: a sinistra il palco 3D
   (BSILab3D, resa cinema, 4K) con il grafico dentro, la telemetria e i
   cursori; a destra le 13 aree, i moduli e la teoria. Espone il ponte
   window.SPECTRA_3D_BRIDGE e registra lo strumento «quantum_studio».
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;
  var t = F.t, PI = Math.PI;
  function QS() { return g.BSIQuantumStudio; }
  function Q() { return g.BSIQuantumDati; }
  var MENO_MOTO = false; try { MENO_MOTO = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  var VISTA = { palco: null, api: null };

  var RAPPR = { densita: ['🟦 Densità (crio-EM)', '🟦 Density (cryo-EM)'], atomi: ['⚛ Atomi', '⚛ Atoms'], orbitale: ['🌫 Orbitale', '🌫 Orbital'], proiezione: ['📐 Proiezione nD', '📐 nD projection'], schema: ['🔧 Schema', '🔧 Schematic'] };

  function crea(cont) {
    QS().stile(); if (cont._qs) cont._qs.distruggi(); cont.textContent = '';
    var stato = { modulo: Q().moduli()[0], params: {}, rappr: null, pausa: MENO_MOTO };
    var box = F.el('div', { 'class': 'bsiQS' }), sx = F.el('div'), dx = F.el('div');
    box.appendChild(sx); box.appendChild(dx); cont.appendChild(box);
    /* sinistra: palco + telemetria + cursori + comandi */
    var palco = F.el('div', { 'class': 'bsiQS-palco' }), tel = F.el('div', { 'class': 'bsiQS-tel', 'aria-live': 'polite' }), rapprBar = F.el('div', { 'class': 'bsiQS-chips', role: 'group', 'aria-label': t('Rappresentazione', 'Representation') }), sliders = F.el('div', { 'class': 'bsiQS-sl' }), com = F.el('div', { 'class': 'bsiQS-com' });
    [palco, tel, rapprBar, sliders, com].forEach(function (e) { sx.appendChild(e); });
    /* destra: aree, moduli, teoria */
    var aree = F.el('div', { 'class': 'bsiQS-chips', role: 'tablist', 'aria-label': t('Aree scientifiche', 'Scientific areas') }), moduli = F.el('div', { 'class': 'bsiQS-chips' }), teo = F.el('div', { 'class': 'bsiQS-teo', 'aria-live': 'polite' });
    [aree, moduli, teo].forEach(function (e) { dx.appendChild(e); });
    cont.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Onestà', 'Honesty') + '</b> · ' + t('Un sistema integrato: 13 aree, 16 moduli. Le strutture 3D sono SCHEMATICHE (forme e scale approssimate); i grafici e i contatori vengono da modelli calcolati (Michaelis–Menten, Morse, NMR, dose–risposta, PCA vera, Van Deemter, Hodgkin–Huxley, Rabi, n-cubi, Calabi–Yau, Gibbs). I valori marcati INDICATIVO sono ordini di grandezza. Riscritto sul motore 3D locale dell\'app (niente CDN), dal secondo video è nata la 13ª area: fisica quantistica, spazi di Hilbert e stringhe.', 'An integrated system: 13 areas, 16 modules. The 3D structures are SCHEMATIC (approximate shapes and scales); the charts and counters come from computed models (Michaelis–Menten, Morse, NMR, dose–response, real PCA, Van Deemter, Hodgkin–Huxley, Rabi, n-cubes, Calabi–Yau, Gibbs). Values marked INDICATIVE are orders of magnitude. Rewritten on the app\'s local 3D engine (no CDN); the 2nd video gave rise to the 13th area: quantum physics, Hilbert spaces and strings.') }));
    var api = { pronto: false }, vivo = true, S = null, testi = null, kit = null, motore = null, TV = null, tempoFuori = 0;
    api.distruggi = function () { vivo = false; if (S) S.pulisci(); if (testi) testi.distruggi(); VISTA.api = null; }; cont._qs = api; VISTA.api = api;
    var L3 = g.BSILab3D; if (!L3 || !Q()) { palco.textContent = t('Il motore 3D non è disponibile.', 'The 3D engine is not available.'); return api; }
    L3.stile();
    /* le aree e i moduli */
    var tastiArea = {}, tastiMod = {};
    Q().AREE.forEach(function (a) { var b = F.el('button', { type: 'button', role: 'tab', 'aria-pressed': 'false', testo: a.icona + ' ' + F.tt(a.nome).replace(/^\d+\.\s*/, '') }); b.addEventListener('click', function () { apriModulo(a.moduli[0].id); }); tastiArea[a.id] = b; aree.appendChild(b); });

    function apriModulo(id) {
      var r = Q().perId(id); if (!r) return; stato.modulo = r.modulo; stato.rappr = (r.modulo.rappr || ['atomi'])[0];
      stato.params = {}; r.modulo.sliders.forEach(function (s) { stato.params[s.key] = s.val; });
      Object.keys(tastiArea).forEach(function (k) { tastiArea[k].setAttribute('aria-pressed', String(k === r.area.id)); });
      /* moduli dell'area */
      moduli.textContent = ''; tastiMod = {}; r.area.moduli.forEach(function (m) { var b = F.el('button', { type: 'button', 'aria-pressed': String(m.id === id), testo: F.tt(m.titolo).split(/[:(]/)[0] }); b.addEventListener('click', function () { apriModulo(m.id); }); tastiMod[m.id] = b; moduli.appendChild(b); });
      /* rappresentazioni */
      rapprBar.textContent = ''; (r.modulo.rappr || ['atomi']).forEach(function (rp) { var b = F.el('button', { type: 'button', 'aria-pressed': String(rp === stato.rappr), testo: F.tt(RAPPR[rp] || [rp, rp]) }); b.addEventListener('click', function () { stato.rappr = rp; [].forEach.call(rapprBar.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); if (stato._costruisci) stato._costruisci(); }); rapprBar.appendChild(b); });
      /* cursori */
      sliders.textContent = ''; r.modulo.sliders.forEach(function (s) { var val = F.el('b', { testo: fmtVal(s.val, s) }), inp = F.el('input', { type: 'range', min: String(s.min), max: String(s.max), step: String(s.passo), value: String(s.val), 'aria-label': F.tt(s.label) }); inp.addEventListener('input', function () { stato.params[s.key] = +inp.value; val.textContent = fmtVal(+inp.value, s); if ((s.key === 'dimN' || s.key === 'n' || s.key === 'ibrid' || s.key === 'steric') && stato._costruisci) stato._costruisci(); }); sliders.appendChild(F.el('label', {}, [F.el('span', {}, [F.el('span', { testo: F.tt(s.label) }), val]), inp])); s._inp = inp; s._val = val; });
      /* teoria */
      teo.innerHTML = '<h4>' + F.tt(r.modulo.titolo) + '</h4><div class="bsiFX-nota" style="margin:0 0 6px">' + r.area.icona + ' ' + F.tt(r.area.nome) + ' · ' + F.tt(r.modulo.badge) + '</div><div class="bsiQS-eq">' + r.modulo.eq + '</div><p>' + F.tt(r.modulo.teoria.core) + '</p><ul style="margin:6px 0;padding-left:18px">' + r.modulo.teoria.punti.map(function (x) { return '<li>' + F.tt(x) + '</li>'; }).join('') + '</ul><div class="bsiQS-esame"><b>' + t('Focus esame', 'Exam focus') + ':</b> ' + F.tt(r.modulo.teoria.esame) + '</div>';
      var leggi = F.el('button', { type: 'button', 'class': 'bsiQS-com', style: 'min-height:40px;border-radius:9px;border:1px solid #20c997;background:#0b2a24;color:#63e6be;font:600 .84rem system-ui;padding:4px 11px;cursor:pointer;margin-top:6px', testo: t('🔊 Spectra legge il focus d\'esame', '🔊 Spectra reads the exam focus') }); leggi.addEventListener('click', function () { parla(F.tt(r.modulo.teoria.esame)); }); teo.appendChild(leggi);
      (r.modulo.teoria.domande || []).forEach(function (q) { var risp = F.el('div', { testo: '→ ' + F.tt(q.a) }); risp.hidden = true; var b = F.el('button', { type: 'button', 'aria-expanded': 'false', testo: '❓ ' + F.tt(q.q), onclick: function () { risp.hidden = !risp.hidden; b.setAttribute('aria-expanded', String(!risp.hidden)); } }); teo.appendChild(F.el('div', { 'class': 'bsiQS-dom' }, [b, risp])); });
      if (r.modulo.sezione && typeof g.goSection === 'function') { var link = F.el('button', { type: 'button', 'class': 'bsiQS-dom', style: 'margin-top:6px', testo: '↗ ' + t('Sezione dedicata dell\'app', 'Dedicated app section'), onclick: function () { g.goSection(r.modulo.sezione); } }); teo.appendChild(link); }
      stato.sliderDef = r.modulo.sliders;
      if (stato._costruisci) stato._costruisci();
      api.modulo = r.modulo.id;
    }
    function fmtVal(v, s) { return QS().util.fmt(v, s.passo < 1 ? (s.passo <= 0.01 ? 2 : 1) : 0) + (s.unit ? ' ' + s.unit : ''); }

    L3.caricaThree().then(function () {
      if (!vivo) return; var T = g.THREE; testi = QS().creaTesti(T);
      var largo = (g.innerWidth || 400) > 1000; S = new L3.Scena(palco, largo ? 0.62 : 1.1); palco.insertBefore(S.box, palco.firstChild); S.adatta(); S.ren.setClearColor(0x03060d, 1);
      if (S.cinema) try { S.cinema({ forza: 0.35, soglia: 0.78, vignetta: 0.3, esposizione: 0.98 }); } catch (e) { }
      var tit = F.el('div', { 'class': 'bsiQS-tit' }); S.box.appendChild(tit); S.titolo = tit;
      var cv = D.createElement('canvas'); cv.className = 'bsiQS-vivo'; cv.setAttribute('role', 'img'); S.box.appendChild(cv); TV = { cv: cv, q: cv.getContext('2d'), W: 0, H: 0 };
      var bP = F.el('button', { type: 'button', testo: stato.pausa ? '▶' : '⏸', 'aria-label': t('Pausa', 'Pause'), onclick: function () { stato.pausa = !stato.pausa; bP.textContent = stato.pausa ? '▶' : '⏸'; S.avvia(); } }); com.appendChild(bP);
      com.appendChild(F.el('button', { type: 'button', testo: '↺', 'aria-label': t('Reset vista', 'Reset view'), onclick: function () { if (S.vistaIniziale) { S.vista.r = S.vistaIniziale.r; S.vista.th = S.vistaIniziale.th; S.vista.ph = S.vistaIniziale.ph; } S.avvia(); } }));
      var bG = F.el('button', { type: 'button', 'aria-pressed': 'false', testo: '⟳', 'aria-label': t('Rotazione automatica', 'Auto-rotate'), onclick: function () { S.gira = !S.gira; bG.setAttribute('aria-pressed', String(S.gira)); S.avvia(); } }); com.appendChild(bG);
      var grupPrec = null;
      function costruisci() {
        /* NB: non S.pulisci(), che azzererebbe i fotogrammi (il ciclo del grafico): si toglie solo il gruppo precedente */
        if (grupPrec) { S.radice.remove(grupPrec); grupPrec.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); } }); }
        if (testi) { testi.distruggi(); } testi = QS().creaTesti(T);
        var G = new T.Group(); S.aggiungi(G); grupPrec = G; kit = QS().kit(T, G, testi);
        var fn = QS().MOTORI[stato.modulo.motore]; motore = fn ? fn(kit, stato.params, { rappr: stato.rappr }) : null;
        tit.innerHTML = F.tt(stato.modulo.titolo) + '<small>' + stato.modulo.eq + '</small>';
        if (motore && motore.vista) { var v = motore.vista; S.inquadra(dist(v[0]), v[1], v[2]); S.vista.bersaglio.set(0, 0, v[3] || 0); }
        TV.W = 0; S.avvia();
      }
      function dist(r) { var asp = S.cam.aspect || 0.8, fv = S.cam.fov * PI / 180, fmin = Math.min(fv, 2 * Math.atan(Math.tan(fv / 2) * asp)); return r / Math.sin(fmin / 2) * 0.62; }
      stato._costruisci = costruisci;
      function misura() { var dpr = g.BSIRisoluzione ? g.BSIRisoluzione.dpr(S.box.clientWidth - 16, 180) : Math.min(2, g.devicePixelRatio || 1), w = S.box.clientWidth - 16, h = Math.round(Math.min(190, S.ren.domElement.clientHeight * 0.32)); if (w === TV.W && h === TV.H) return; TV.W = w; TV.H = h; cv.style.height = h + 'px'; cv.width = Math.max(1, w * dpr); cv.height = Math.max(1, h * dpr); TV.q.setTransform(dpr, 0, 0, dpr, 0, 0); }
      var ultimoUI = -1;
      S.ogniFotogramma(function (dt) {
        if (!vivo) return false; if (D.hidden) return true; if (!motore) return true;
        var d = stato.pausa ? 0 : Math.min(0.05, dt), tele = motore.passo(d);
        misura(); if (TV.W > 2) { QS().util.cornice(TV.q, TV.W, TV.H); try { motore.grafico(TV.q, TV.W, TV.H); } catch (e) { } }
        var k = Math.round((Date.now()) / 120); if (k !== ultimoUI) { ultimoUI = k; tel.innerHTML = tele.map(function (r) { return '<div>' + r[0] + '<b>' + r[1] + '</b></div>'; }).join(''); api.ultimo = { modulo: stato.modulo.id, tele: tele }; }
        if (!MENO_MOTO && !stato.pausa && S.gira) S.vista.th += dt * 0.12;
        return true;
      });
      F.alRidimensiona(function () { S.adatta(); TV.W = 0; });
      api.pronto = true; api.S = S; api.stato = stato;
      api.imposta = function (chiave, valore) { if (!(chiave in stato.params)) return false; var s = (stato.sliderDef || []).filter(function (x) { return x.key === chiave; })[0]; if (s) { valore = Math.max(s.min, Math.min(s.max, valore)); s._inp.value = String(valore); s._val.textContent = fmtVal(valore, s); } stato.params[chiave] = valore; if (chiave === 'dimN' || chiave === 'n' || chiave === 'ibrid' || chiave === 'steric') costruisci(); S.avvia(); return true; };
      api.apri = apriModulo; api.rappresenta = function (rp) { if ((stato.modulo.rappr || []).indexOf(rp) < 0) return false; stato.rappr = rp; [].forEach.call(rapprBar.children, function (x) { x.setAttribute('aria-pressed', String(x.textContent === F.tt(RAPPR[rp] || [rp, rp]))); }); costruisci(); return true; }; api.pausaSet = function (v) { stato.pausa = v; bP.textContent = v ? '▶' : '⏸'; S.avvia(); };
      apriModulo(stato.modulo.id);
    }).catch(function (e) { palco.textContent = '⚠ ' + e.message; });
    return api;
  }

  function parla(testo) { try { if (g.BSISpectraVoce && g.BSISpectraVoce.parla) { g.BSISpectraVoce.parla(testo); return; } } catch (e) { } try { if (g.speechSynthesis) { g.speechSynthesis.cancel(); var u = new g.SpeechSynthesisUtterance(testo); u.lang = t('it-IT', 'en-GB'); g.speechSynthesis.speak(u); } } catch (e) { } }

  F.sezione('squantum', {
    titolo: ['🌌 BioSpec Quantum Studio', '🌌 BioSpec Quantum Studio'],
    sotto: ['Un unico studio olografico per tredici aree scientifiche: a sinistra il modello 3D con il grafico calcolato dentro il palco, la telemetria e i cursori dei parametri; a destra la teoria, le equazioni, il focus d\'esame e le domande. Dalla biochimica alla fisica quantistica, agli spazi di Hilbert, agli n-cubi e alle varietà di Calabi–Yau delle stringhe.', 'One holographic studio for thirteen scientific areas: on the left the 3D model with the computed chart inside the stage, telemetry and parameter sliders; on the right the theory, equations, exam focus and questions. From biochemistry to quantum physics, Hilbert spaces, n-cubes and the Calabi–Yau manifolds of string theory.'],
    schede: [{ nome: ['🌌 Lo studio', '🌌 The studio'], costruisci: crea }]
  });

  /* ═══ il ponte SPECTRA_3D_BRIDGE ═══════════════════════════════════════ */
  function vaiAllaSezione() { if (typeof g.goSection === 'function') g.goSection('squantum'); }
  function conApi(f, attesa) { var a = VISTA.api; if (a && a.pronto) return f(a); vaiAllaSezione(); var k = 0, ti = setInterval(function () { a = VISTA.api; if (a && a.pronto) { clearInterval(ti); f(a); } else if (++k > 40) clearInterval(ti); }, 200); if (attesa) return attesa; }
  var BRIDGE = {
    elenco: function () { return Q().moduli().map(function (m) { return { id: m.id, titolo: F.tt(m.titolo), area: Q().perId(m.id).area.icona }; }); },
    apri: function (id, i) { if (typeof id === 'string' && Q().AREE.some(function (a) { return a.id === id; })) { var a = Q().AREE.filter(function (x) { return x.id === id; })[0]; id = a.moduli[Math.min(a.moduli.length - 1, i || 0)].id; } if (!Q().perId(id)) return false; vaiAllaSezione(); conApi(function (a) { a.apri(id); }); return true; },
    imposta: function (chiave, valore) { return conApi(function (a) { return a.imposta(chiave, +valore); }, true); },
    rappresentazione: function (rp) { return conApi(function (a) { return a.rappresenta(rp); }, true); },
    pausa: function (v) { return conApi(function (a) { a.pausaSet(!!v); return true; }, true); },
    stato: function () { var a = VISTA.api; return a && a.ultimo ? a.ultimo : null; }
  };
  BRIDGE.openSection = function (area, i) { return BRIDGE.apri(area, i); };
  BRIDGE.setParameter = function (k, v) { return BRIDGE.imposta(k, v); };
  g.SPECTRA_3D_BRIDGE = BRIDGE;
  g.BSIQuantumStudio.crea = crea; g.BSIQuantumStudio.apri = function (id) { BRIDGE.apri(id); };

  /* ═══ lo strumento per Spectra ═════════════════════════════════════════ */
  var STRUMENTO = { name: 'quantum_studio',
    description: 'Apre il «BioSpec Quantum Studio»: uno studio 3D con grafico calcolato per 13 aree e 16 moduli. Moduli (id): bio_atp (ATP sintasi), bio_enzimi (Michaelis–Menten), chem_orbitali (ibridi sp/sp²/sp³ e curva di Morse), org_sn2 (SN2, inversione di Walden), spec_nmr (¹H-NMR, Larmor, J), pharm_dose (dose–risposta e antagonismo), ds_pca (analisi delle componenti principali), molbio_crispr (CRISPR–Cas9, PAM), tox_paracetamolo (nomogramma di Rumack–Matthew), lab_hplc (HPLC, Van Deemter), comp_pes (superficie di energia potenziale), biophys_hh (potenziale d\'azione di Hodgkin–Huxley), qm_qubit (sfera di Bloch, oscillazioni di Rabi), hyper_ncubo (n-cubi, tesseratto), string_cy (Calabi–Yau, quintica), thermo_gibbs (energia libera di Gibbs). Puoi anche impostare un parametro (es. drive, substrate, b0, logDose, dimN, tempK). Usalo SOLO quando l\'utente chiede di vedere o studiare uno di questi argomenti.',
    parameters: { type: 'object', properties: { modulo: { type: 'string', enum: Q() ? Q().moduli().map(function (m) { return m.id; }) : [] }, parametro: { type: 'string' }, valore: { type: 'number' } }, required: ['modulo'] },
    execute: function (a) { a = a || {}; var r = Q().perId(a.modulo); if (!r) return Promise.resolve({ ok: false, error: 'modulo sconosciuto' }); BRIDGE.apri(a.modulo); if (a.parametro != null && a.valore != null) setTimeout(function () { BRIDGE.imposta(a.parametro, a.valore); }, 600); return Promise.resolve({ ok: true, aperto: F.tt(r.modulo.titolo), area: F.tt(r.area.nome), equazione: r.modulo.eq, focusEsame: F.tt(r.modulo.teoria.esame) }); } };
  function registra() { var Ts = g.BSI_AI_TOOLS; if (!Ts || !Ts.push) return false; if (!Ts.some(function (x) { return x.name === STRUMENTO.name; })) Ts.push(STRUMENTO); return true; }
  if (!registra()) { var k = 0, ti = setInterval(function () { if (registra() || ++k > 40) clearInterval(ti); }, 500); }
})(typeof window !== 'undefined' ? window : globalThis);
