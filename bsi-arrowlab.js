/* ═══════════════════════════════════════════════════════════════════════
   bsi-arrowlab.js — ✏️ Arrow Lab e Retrosintesi (v269)
   BioSpecInfo · © Samuele Pio Provenzano

   Due strumenti di chimica organica, interamente offline (SVG, niente 3D):

   · ✏️ FRECCE CURVE — una lavagna interattiva dove lo studente disegna le
     frecce del meccanismo (una coppia di elettroni va da una sorgente —
     un doppietto solitario o un legame — a una destinazione) e il banco
     controlla passo per passo che siano quelle giuste. Strumenti: Seleziona,
     Freccia, Atomo, Legame, Catena, Anello, Cancella; coppie solitarie e
     cariche formali; «+ Passo», «Risolvi», «Diagnostica», «Ispettore».
     Due meccanismi: riduzione del propanone con NaBH₄ e SN2 di un
     bromuro primario.

   · 🔀 RETROSINTESI — un pianificatore in stile lavagna: per ogni molecola
     bersaglio, più percorsi alternativi con la disconnessione, i building
     block, il punteggio di chimica verde, un inventario personalizzabile e
     i filtri (solo percorsi verdi, numero massimo di passaggi).

   ONESTA': i meccanismi e i percorsi sono SCHEMATICI e a scopo didattico;
   le posizioni degli atomi sono disegnate, non ottimizzate; i punteggi di
   «chimica verde» sono indicativi (atom economy, catalisi, stechiometria).
   Riscritto in stile locale dell'app (niente moduli ES): lo stato resta sul
   dispositivo (localStorage).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;
  function t(it, en) { return (g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() === 'en') ? en : it; }
  var CHIAVE = 'bsi-arrowlab-v1', ramPiego = {};

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ═══ i meccanismi ══════════════════════════════════════════════════════ */
  var MECC = {
    'propanone-nabh4': {
      id: 'propanone-nabh4',
      titolo: ['Riduzione del propanone (NaBH₄ → propan-2-olo)', 'Propanone reduction (NaBH₄ → propan-2-ol)'],
      sotto: ['Chetone → alcol secondario · addizione nucleofila + protonazione', 'Ketone → secondary alcohol · nucleophilic addition + protonation'],
      dettagli: ['1) H:⁻ (dal NaBH₄) attacca il C=O e forma l\'alcossido; 2) H–OH protona O:⁻ a propan-2-olo.', '1) H:⁻ (from NaBH₄) attacks the C=O and forms the alkoxide; 2) H–OH protonates O:⁻ to propan-2-ol.'],
      passi: [
        { titolo: ['Passo 1: attacco nucleofilo di H:⁻ sul carbonile', 'Step 1: nucleophilic attack of H:⁻ on the carbonyl'],
          nodi: [{ id: 'n1', et: 'H', x: 145, y: 155, q: -1, lp: 1, hyb: 's' }, { id: 'n2', et: 'C', x: 295, y: 155, q: 0, lp: 0, hyb: 'sp2' }, { id: 'n3', et: 'O', x: 295, y: 72, q: 0, lp: 2, hyb: 'sp2' }, { id: 'n4', et: 'CH₃', x: 220, y: 215, q: 0, lp: 0, hyb: 'sp3' }, { id: 'n5', et: 'CH₃', x: 370, y: 215, q: 0, lp: 0, hyb: 'sp3' }],
          legami: [{ id: 'b1', da: 'n2', a: 'n3', o: 2 }, { id: 'b2', da: 'n2', a: 'n4', o: 1 }, { id: 'b3', da: 'n2', a: 'n5', o: 1 }],
          frecce: [], attese: [{ da: 'n1', a: 'n2', d: 'H:⁻ → C (carbonilico)' }, { da: 'b1', a: 'n3', d: 'legame π (C=O) → O' }],
          aiuto: ['Clicca su H:⁻ e poi sul carbonio centrale; poi sul doppio legame C=O e sull\'ossigeno.', 'Click H:⁻ then the central carbon; then the C=O double bond and the oxygen.'] },
        { titolo: ['Passo 2: alcossido O:⁻ formato — protonazione con acqua', 'Step 2: alkoxide O:⁻ formed — protonation with water'],
          nodi: [{ id: 'n2', et: 'C', x: 255, y: 165, q: 0, lp: 0, hyb: 'sp3' }, { id: 'n3', et: 'O', x: 255, y: 82, q: -1, lp: 3, hyb: 'sp3' }, { id: 'n4', et: 'CH₃', x: 185, y: 220, q: 0, lp: 0, hyb: 'sp3' }, { id: 'n5', et: 'CH₃', x: 325, y: 220, q: 0, lp: 0, hyb: 'sp3' }, { id: 'n6', et: 'H', x: 332, y: 138, q: 0, lp: 0, hyb: 's' }, { id: 'n7', et: 'H', x: 395, y: 112, q: 0, lp: 0, hyb: 's' }, { id: 'n8', et: 'OH', x: 472, y: 78, q: 0, lp: 2, hyb: 'sp3' }],
          legami: [{ id: 'b1', da: 'n2', a: 'n3', o: 1 }, { id: 'b2', da: 'n2', a: 'n4', o: 1 }, { id: 'b3', da: 'n2', a: 'n5', o: 1 }, { id: 'b4', da: 'n2', a: 'n6', o: 1 }, { id: 'b5', da: 'n7', a: 'n8', o: 1 }],
          frecce: [], attese: [{ da: 'n3', a: 'n7', d: 'O:⁻ → H (acqua)' }, { da: 'b5', a: 'n8', d: 'legame σ (H–OH) → OH' }],
          aiuto: ['L\'ossigeno negativo preleva il protone dall\'acqua mentre il legame H–OH si rompe sull\'ossigeno.', 'The negative oxygen takes the proton from water while the H–OH bond breaks onto the oxygen.'] },
        { titolo: ['Passo 3: propan-2-olo formato (+ HO:⁻)', 'Step 3: propan-2-ol formed (+ HO:⁻)'],
          nodi: [{ id: 'n2', et: 'C', x: 255, y: 165, q: 0, lp: 0, hyb: 'sp3' }, { id: 'n3', et: 'O', x: 255, y: 85, q: 0, lp: 2, hyb: 'sp3' }, { id: 'n9', et: 'H', x: 325, y: 65, q: 0, lp: 0, hyb: 's' }, { id: 'n4', et: 'CH₃', x: 185, y: 220, q: 0, lp: 0, hyb: 'sp3' }, { id: 'n5', et: 'CH₃', x: 325, y: 220, q: 0, lp: 0, hyb: 'sp3' }, { id: 'n6', et: 'H', x: 332, y: 145, q: 0, lp: 0, hyb: 's' }, { id: 'n8', et: 'HO', x: 465, y: 110, q: -1, lp: 3, hyb: 'sp3' }],
          legami: [{ id: 'b1', da: 'n2', a: 'n3', o: 1 }, { id: 'b6', da: 'n3', a: 'n9', o: 1 }, { id: 'b2', da: 'n2', a: 'n4', o: 1 }, { id: 'b3', da: 'n2', a: 'n5', o: 1 }, { id: 'b4', da: 'n2', a: 'n6', o: 1 }],
          frecce: [], attese: [],
          aiuto: ['Reazione completata: il propanone è stato ridotto a propan-2-olo.', 'Reaction complete: propanone has been reduced to propan-2-ol.'] }
      ]
    },
    'sn2-bromobutano': {
      id: 'sn2-bromobutano',
      titolo: ['Sostituzione SN2 (HO:⁻ + R–Br → R–OH + Br:⁻)', 'SN2 substitution (HO:⁻ + R–Br → R–OH + Br:⁻)'],
      sotto: ['Attacco dal retro in un solo stadio, con inversione di configurazione', 'Backside attack in one step, with inversion of configuration'],
      dettagli: ['Meccanismo bimolecolare concertato: il legame C–O si forma e il C–Br si rompe nello stesso istante.', 'Concerted bimolecular mechanism: the C–O bond forms and the C–Br breaks at the same instant.'],
      passi: [
        { titolo: ['Passo 1: attacco di HO:⁻ ed espulsione di Br:⁻', 'Step 1: HO:⁻ attack and Br:⁻ departure'],
          nodi: [{ id: 's1', et: 'HO', x: 140, y: 145, q: -1, lp: 3, hyb: 'sp3' }, { id: 's2', et: 'C', x: 290, y: 145, q: 0, lp: 0, hyb: 'sp3' }, { id: 's3', et: 'Br', x: 430, y: 145, q: 0, lp: 3, hyb: 'sp3' }, { id: 's4', et: 'C₃H₇', x: 290, y: 225, q: 0, lp: 0, hyb: 'sp3' }],
          legami: [{ id: 'sb1', da: 's2', a: 's3', o: 1 }, { id: 'sb2', da: 's2', a: 's4', o: 1 }],
          frecce: [], attese: [{ da: 's1', a: 's2', d: 'HO:⁻ → C(α)' }, { da: 'sb1', a: 's3', d: 'legame σ (C–Br) → Br' }],
          aiuto: ['Freccia da HO:⁻ al carbonio, e dal legame C–Br all\'atomo di Br.', 'Arrow from HO:⁻ to the carbon, and from the C–Br bond to the Br atom.'] },
        { titolo: ['Passo 2: alcol primario + ione bromuro Br:⁻', 'Step 2: primary alcohol + bromide ion Br:⁻'],
          nodi: [{ id: 's1', et: 'HO', x: 185, y: 145, q: 0, lp: 2, hyb: 'sp3' }, { id: 's2', et: 'C', x: 295, y: 145, q: 0, lp: 0, hyb: 'sp3' }, { id: 's4', et: 'C₃H₇', x: 295, y: 225, q: 0, lp: 0, hyb: 'sp3' }, { id: 's3', et: 'Br', x: 455, y: 145, q: -1, lp: 4, hyb: 'p' }],
          legami: [{ id: 'sb3', da: 's1', a: 's2', o: 1 }, { id: 'sb2', da: 's2', a: 's4', o: 1 }],
          frecce: [], attese: [],
          aiuto: ['Sostituzione SN2 completata, con inversione di Walden.', 'SN2 substitution complete, with Walden inversion.'] }
      ]
    }
  };
  function clonaPassi(id) { return JSON.parse(JSON.stringify(MECC[id].passi)); }

  /* ═══ i bersagli retrosintetici ═════════════════════════════════════════ */
  var BERSAGLI = [
    { id: 'aril-propionico', nome: ['Acido 2-(4-isobutilfenil)propanoico (scheletro aril-propionico)', '2-(4-isobutylphenyl)propanoic acid (aryl-propionic skeleton)'], tag: ['Analisi retrosintetica multi-percorso', 'Multi-route retrosynthetic analysis'],
      percorsi: [
        { id: 'green-cat', titolo: ['Percorso A — acilazione catalitica + riduzione NaBH₄', 'Route A — catalytic acylation + NaBH₄ reduction'], passi: 3, verde: true, punteggio: ['94/100 (alta atom economy, catalisi recuperabile)', '94/100 (high atom economy, recoverable catalysis)'], blocchi: ['Isobutilbenzene', 'Anidride acetica', 'NaBH₄'], disc: ['Taglio C(α)–COOH e FGI alcol → chetone → acilazione para-selettiva.', 'C(α)–COOH cut and alcohol FGI → ketone → para-selective acylation.'], lavagna: [['1. Disconnessione α-carbossilica → 1-(4-isobutilfenil)etan-1-olo.', '1. α-carboxylic disconnection → 1-(4-isobutylphenyl)ethan-1-ol.'], ['2. FGI riduzione carbonilica → 4-isobutilacetofenone (NaBH₄).', '2. Carbonyl FGI reduction → 4-isobutylacetophenone (NaBH₄).'], ['3. Acilazione di Friedel–Crafts catalitica sull\'isobutilbenzene.', '3. Catalytic Friedel–Crafts acylation on isobutylbenzene.']] },
        { id: 'darzens', titolo: ['Percorso B — condensazione di Darzens e decarbossilazione', 'Route B — Darzens condensation and decarboxylation'], passi: 5, verde: false, punteggio: ['55/100 (sali stechiometrici e più passaggi)', '55/100 (stoichiometric salts and more steps)'], blocchi: ['Isobutilbenzene', 'Cloroacetato di etile', 'NaOEt'], disc: ['Omologazione tramite epossiestere glicidico e trasposizione.', 'Homologation via a glycidic epoxy-ester and rearrangement.'], lavagna: [['1. Ossidazione dell\'aldeide intermedia → acido target.', '1. Oxidation of the intermediate aldehyde → target acid.'], ['2. Idrolisi e decarbossilazione dell\'estere glicidico.', '2. Hydrolysis and decarboxylation of the glycidic ester.'], ['3. Condensazione di Darzens sul 4-isobutilacetofenone.', '3. Darzens condensation on 4-isobutylacetophenone.']] }
      ] },
    { id: 'beta-idrossiestere', nome: ['3-idrossi-3-fenilpropanoato di etile (β-idrossiestere)', 'ethyl 3-hydroxy-3-phenylpropanoate (β-hydroxyester)'], tag: ['Disconnessione 1,3-difunzionalizzata', '1,3-difunctional disconnection'],
      percorsi: [
        { id: 'aldol-green', titolo: ['Percorso A — addizione aldolica con enolato di estere', 'Route A — aldol addition with an ester enolate'], passi: 2, verde: true, punteggio: ['89/100 (economia atomica nella formazione C–C)', '89/100 (atom economy in the C–C bond formation)'], blocchi: ['Benzaldeide', 'Acetato di etile'], disc: ['Disconnessione C(α)–C(β): sintone nucleofilo d2 (enolato) + sintone elettrofilo a1 (benzaldeide).', 'C(α)–C(β) disconnection: nucleophilic d2 synthon (enolate) + electrophilic a1 synthon (benzaldehyde).'], lavagna: [['1. Taglio del legame C2–C3 fra il carbonio α-estereo e quello carbinolico.', '1. Cut the C2–C3 bond between the α-ester carbon and the carbinol carbon.'], ['2. Enolato dell\'acetato di etile (LDA, −78 °C) + benzaldeide.', '2. Ethyl acetate enolate (LDA, −78 °C) + benzaldehyde.']] },
        { id: 'reformatsky', titolo: ['Percorso B — reazione di Reformatsky (Zn / α-bromoestere)', 'Route B — Reformatsky reaction (Zn / α-bromoester)'], passi: 2, verde: false, punteggio: ['64/100 (consumo stechiometrico di zinco)', '64/100 (stoichiometric zinc consumption)'], blocchi: ['Benzaldeide', '2-Bromoacetato di etile', 'Zn'], disc: ['Enolato di zinco chemoselettivo sull\'aldeide aromatica.', 'Chemoselective zinc enolate on the aromatic aldehyde.'], lavagna: [['1. Disconnessione C2–C3 → benzaldeide + BrCH₂COOEt.', '1. C2–C3 disconnection → benzaldehyde + BrCH₂COOEt.'], ['2. Inserzione ossidativa dello Zn e addizione sul carbonile.', '2. Oxidative insertion of Zn and addition to the carbonyl.']] }
      ] }
  ];

  /* ═══ stato ═════════════════════════════════════════════════════════════ */
  function statoIniziale() {
    return { vista: 'editor', strumento: 'arrow', elemento: 'H-', preset: 'propanone-nabh4', passoIdx: 0, sorgente: null, nodoSel: null, cassetto: 'inspector',
      banner: ['Strumento Freccia: clicca prima sulla sorgente di elettroni, poi sulla destinazione.', 'Arrow tool: click the electron source first, then the destination.'],
      passi: clonaPassi('propanone-nabh4'), storia: [], futuro: [], salvate: [],
      bersaglio: 'aril-propionico', percorso: null, soloVerde: false, maxPassi: 5, inventario: ['Propanone', 'NaBH₄', 'Isobutilbenzene', 'Benzaldeide', 'Acetato di etile', '1-Bromobutano', 'Etanolo'], nuovoInv: '',
      bersagliEsplorati: ['aril-propionico'], percorsiEsplorati: 2, limiti: { maxBers: 5, maxPerc: 50 } };
  }
  function carica() { try { if (g.localStorage) { var raw = g.localStorage.getItem(CHIAVE); if (raw) { var s = JSON.parse(raw); var i = statoIniziale(); for (var k in s) i[k] = s[k]; i.passi = s.passi || i.passi; return i; } } } catch (e) { } return ramPiego[CHIAVE] || statoIniziale(); }
  function salva(s) { try { if (g.localStorage) { g.localStorage.setItem(CHIAVE, JSON.stringify(s)); return; } } catch (e) { } ramPiego[CHIAVE] = s; }

  /* ═══ la sezione ════════════════════════════════════════════════════════ */
  function costruisci(cont) {
    var stato = carica();
    function tt(v) { return Array.isArray(v) ? t(v[0], v[1]) : v; }
    function spingiStoria() { stato.storia = stato.storia.slice(-19).concat([JSON.stringify({ passi: stato.passi, passoIdx: stato.passoIdx })]); stato.futuro = []; }
    function agg(patch) { for (var k in patch) stato[k] = patch[k]; salva(stato); dipingi(); }
    function coord(passo, id) { var n = passo.nodi.filter(function (x) { return x.id === id; })[0]; if (n) return { x: n.x, y: n.y }; var b = passo.legami.filter(function (x) { return x.id === id; })[0]; if (b) { var a = passo.nodi.filter(function (x) { return x.id === b.da; })[0], c = passo.nodi.filter(function (x) { return x.id === b.a; })[0]; if (a && c) return { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 }; } return null; }
    function valida(passo) {
      if (!passo.attese.length) return { ok: true, msg: t('Stadio finale: nessuna freccia richiesta.', 'Final stage: no arrow required.') };
      var manca = passo.attese.filter(function (e) { return !passo.frecce.some(function (a) { return a.da === e.da && a.a === e.a; }); });
      var extra = passo.frecce.filter(function (a) { return !passo.attese.some(function (e) { return e.da === a.da && e.a === a.a; }); });
      if (!manca.length && !extra.length) return { ok: true, msg: t('Perfetto! Tutte le ' + passo.attese.length + ' frecce sono corrette. Premi «+ Passo».', 'Perfect! All ' + passo.attese.length + ' arrows are correct. Press «+ Step».') };
      var parti = []; if (manca.length) parti.push(t('frecce mancanti: ', 'missing arrows: ') + manca.map(function (m) { return m.d; }).join('; ')); if (extra.length) parti.push(t('frecce da togliere: ', 'arrows to remove: ') + extra.length);
      return { ok: false, msg: parti.join(' · ') };
    }

    function dipingi() {
      var preset = MECC[stato.preset] || MECC['propanone-nabh4'], idx = Math.min(Math.max(0, stato.passoIdx), stato.passi.length - 1), passo = stato.passi[idx];
      var sel = passo.nodi.filter(function (n) { return n.id === stato.nodoSel; })[0] || passo.nodi[0] || null, V = valida(passo);
      cont.innerHTML = '<div class="bsiAL">' +
        '<div class="bsiAL-top"><div class="bsiAL-nome"><strong>' + t('Arrow Lab e Retrosintesi', 'Arrow Lab & RetroSynth') + '</strong><span class="bsiAL-badge">' + t('salvato nel browser · offline', 'saved in browser · offline') + '</span></div>' +
        '<div class="bsiAL-az"><button type="button" data-a="vista" data-v="editor" class="bsiAL-vista' + (stato.vista === 'editor' ? ' on' : '') + '">' + t('✏️ Frecce curve', '✏️ Curved arrows') + '</button>' +
        '<button type="button" data-a="vista" data-v="retro" class="bsiAL-vista' + (stato.vista === 'retro' ? ' on' : '') + '">' + t('🔀 Retrosintesi', '🔀 Retrosynthesis') + '</button>' +
        (stato.vista === 'editor' ? '<button type="button" data-a="solve" class="bsiAL-solve">' + t('Risolvi', 'Solve it') + '</button>' : '') + '</div></div>' +
        (stato.vista === 'editor' ? vistaEditor(preset, passo, idx, sel, V) : vistaRetro()) + '</div>' +
        '<div class="bsiFX-nota">' + t('Strumento didattico: i meccanismi e i percorsi sono schematici, le posizioni sono disegnate; i punteggi di «chimica verde» sono indicativi. Lo stato resta su questo dispositivo.', 'A teaching tool: mechanisms and routes are schematic, positions are drawn; the «green chemistry» scores are indicative. The state stays on this device.') + '</div>';
      lega(preset, passo, idx);
    }

    function vistaEditor(preset, passo, idx, sel, V) {
      var strumenti = [['select', t('Seleziona', 'Select')], ['arrow', t('Freccia', 'Arrow')], ['atom', t('Atomo', 'Atom')], ['bond', t('Legame', 'Bond')], ['chain', t('Catena', 'Chain')], ['ring', t('Anello', 'Ring')], ['erase', t('Cancella', 'Erase')]];
      var elementi = ['H-', 'O', 'N', 'C', 'Br', 'OH'];
      return '<div class="bsiAL-ed">' +
        '<div class="bsiAL-barra"><label>' + t('Reazione', 'Reaction') + ' <select data-r="preset">' + Object.keys(MECC).map(function (k) { return '<option value="' + k + '"' + (k === preset.id ? ' selected' : '') + '>' + esc(tt(MECC[k].titolo)) + '</option>'; }).join('') + '</select></label>' +
        '<span class="bsiAL-min"><button type="button" data-a="undo">' + t('Annulla', 'Undo') + '</button><button type="button" data-a="redo">Redo</button><button type="button" data-a="save">' + t('Le mie reazioni', 'My reactions') + ' (' + stato.salvate.length + ')</button><button type="button" data-a="reset" class="bsiAL-reset">Reset</button></span></div>' +
        '<div class="bsiAL-tool">' + strumenti.map(function (s) { return '<button type="button" data-a="tool" data-t="' + s[0] + '" class="' + (stato.strumento === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') +
        (stato.strumento === 'atom' ? '<span class="bsiAL-el">' + t('Atomo:', 'Atom:') + ' ' + elementi.map(function (e) { return '<button type="button" data-a="el" data-e="' + e + '" class="' + (stato.elemento === e ? 'on' : '') + '">' + e + '</button>'; }).join('') + '</span>' : '<span class="bsiAL-sotto">' + esc(tt(preset.sotto)) + '</span>') + '</div>' +
        '<div class="bsiAL-corpo"><div class="bsiAL-tela"><div class="bsiAL-passotit"><strong>' + esc(tt(passo.titolo)) + '</strong><span>' + t('frecce: ', 'arrows: ') + passo.frecce.length + ' / ' + passo.attese.length + '</span></div>' +
        svg(passo) +
        '<div class="bsiAL-banner' + (V.ok ? ' ok' : '') + '">' + esc(tt(stato.banner)) + '</div></div>' +
        aside(preset, passo, idx, sel, V) + '</div></div>';
    }

    function svg(passo) {
      var s = '<svg data-r="tela" viewBox="0 0 620 290" width="100%" height="290" class="bsiAL-svg"><defs><marker id="bsiALhead" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><polygon points="0 0, 8 3.5, 0 7" fill="#0d9488"/></marker></defs>';
      passo.legami.forEach(function (b) { var a = passo.nodi.filter(function (n) { return n.id === b.da; })[0], c = passo.nodi.filter(function (n) { return n.id === b.a; })[0]; if (!a || !c) return; var dx = c.x - a.x, dy = c.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l * 4, ny = dx / l * 4, src = stato.sorgente === b.id, col = src ? '#0d9488' : '#1e293b';
        s += '<g data-bond="' + b.id + '" style="cursor:pointer"><line x1="' + a.x + '" y1="' + a.y + '" x2="' + c.x + '" y2="' + c.y + '" stroke="transparent" stroke-width="16"/>';
        if (b.o === 2) s += '<line x1="' + (a.x + nx) + '" y1="' + (a.y + ny) + '" x2="' + (c.x + nx) + '" y2="' + (c.y + ny) + '" stroke="' + col + '" stroke-width="2.4"/><line x1="' + (a.x - nx) + '" y1="' + (a.y - ny) + '" x2="' + (c.x - nx) + '" y2="' + (c.y - ny) + '" stroke="' + col + '" stroke-width="2.4"/>';
        else s += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + c.x + '" y2="' + c.y + '" stroke="' + col + '" stroke-width="2.6"/>'; s += '</g>'; });
      passo.frecce.forEach(function (ar, i) { var p1 = coord(passo, ar.da), p2 = coord(passo, ar.a); if (!p1 || !p2) return; var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2 - 44; s += '<g data-arrow="' + i + '" style="cursor:pointer"><path d="M ' + p1.x + ' ' + p1.y + ' Q ' + mx + ' ' + my + ' ' + p2.x + ' ' + p2.y + '" fill="none" stroke="#0d9488" stroke-width="2.6" marker-end="url(#bsiALhead)"/></g>'; });
      passo.nodi.forEach(function (n) { var src = stato.sorgente === n.id, sel = stato.nodoSel === n.id; s += '<g data-node="' + n.id + '" style="cursor:pointer"><circle cx="' + n.x + '" cy="' + n.y + '" r="20" fill="' + (src ? '#ccfbf1' : sel ? '#eff6ff' : '#ffffff') + '" stroke="' + (src ? '#0d9488' : sel ? '#2563eb' : '#94a3b8') + '" stroke-width="' + (src || sel ? 2.4 : 1.5) + '"/><text x="' + n.x + '" y="' + (n.y + 5) + '" text-anchor="middle" font-size="14" font-weight="700" fill="#0f172a">' + esc(n.et) + '</text>';
        if (n.lp > 0) s += '<text x="' + n.x + '" y="' + (n.y - 23) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">' + new Array(Math.min(n.lp, 3) + 1).join(':') + '</text>';
        if (n.q !== 0) s += '<circle cx="' + (n.x + 17) + '" cy="' + (n.y - 15) + '" r="8" fill="#0f172a"/><text x="' + (n.x + 17) + '" y="' + (n.y - 11) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">' + (n.q > 0 ? '+' : '−') + '</text>'; s += '</g>'; });
      return s + '</svg>';
    }

    function aside(preset, passo, idx, sel, V) {
      var tab = ['inspector', 'diagnostics', 'details'], etich = { inspector: t('Ispettore', 'Inspector'), diagnostics: t('Diagnostica', 'Diagnostics'), details: t('Dettagli', 'Details') };
      var corpo = '';
      if (stato.cassetto === 'inspector') corpo = '<h4>' + t('Ispettore della specie', 'Species inspector') + '</h4>' + (sel ? '<p><strong>' + t('Atomo/gruppo:', 'Atom/group:') + '</strong> ' + esc(sel.et) + '</p><p><strong>' + t('ibridazione:', 'hybridisation:') + '</strong> ' + esc(sel.hyb) + '</p><p><strong>' + t('coppie solitarie:', 'lone pairs:') + '</strong> ' + sel.lp + '</p><p><strong>' + t('carica formale:', 'formal charge:') + '</strong> ' + (sel.q > 0 ? '+1' : sel.q) + '</p>' : '<p class="bsiAL-grigio">' + t('Clicca un atomo per ispezionarlo.', 'Click an atom to inspect it.') + '</p>') + '<hr><p class="bsiAL-grigio"><strong>' + t('Guida:', 'Hint:') + '</strong> ' + esc(tt(passo.aiuto)) + '</p>';
      else if (stato.cassetto === 'diagnostics') corpo = '<h4>' + t('Diagnostica delle frecce', 'Arrow diagnostics') + '</h4><p class="' + (V.ok ? 'bsiAL-verde' : 'bsiAL-arancio') + '">' + esc(tt(stato.banner) && V.msg) + '</p><ul><li>' + t('controllo di cariche e ottetto: attivo', 'charge and octet check: on') + '</li><li>' + t('sorgente freccia: solo doppietti o legami', 'arrow source: lone pairs or bonds only') + '</li></ul>';
      else corpo = '<h4>' + t('Dettagli della reazione', 'Reaction details') + '</h4><p>' + esc(tt(preset.dettagli)) + '</p>';
      return '<aside class="bsiAL-aside"><div class="bsiAL-tabs">' + tab.map(function (x) { return '<button type="button" data-a="drawer" data-d="' + x + '" class="' + (stato.cassetto === x ? 'on' : '') + '">' + etich[x] + '</button>'; }).join('') + '</div><div class="bsiAL-card">' + corpo + '</div>' +
        '<div class="bsiAL-timeline"><div class="bsiAL-tl-t">' + t('Passi', 'Steps') + ' (' + (idx + 1) + '/' + stato.passi.length + ')</div><div class="bsiAL-tl">' + stato.passi.map(function (_, i) { return '<button type="button" data-a="goto" data-i="' + i + '" class="' + (i === idx ? 'on' : '') + '">' + t('Passo ', 'Step ') + (i + 1) + '</button>'; }).join('') + '<button type="button" data-a="next" class="bsiAL-next">+ ' + t('Passo', 'Step') + '</button></div></div></aside>';
    }

    function vistaRetro() {
      var bers = BERSAGLI.filter(function (b) { return b.id === stato.bersaglio; })[0] || BERSAGLI[0];
      var perc = bers.percorsi.filter(function (r) { return (!stato.soloVerde || r.verde) && r.passi <= stato.maxPassi; });
      var attivo = perc.filter(function (r) { return r.id === stato.percorso; })[0] || perc[0] || null;
      return '<div class="bsiAL-retro"><div class="bsiAL-retrohead"><strong>' + t('Analisi retrosintetica e percorsi alternativi', 'Retrosynthetic analysis and alternative routes') + '</strong><span>' + t('bersagli: ', 'targets: ') + stato.bersagliEsplorati.length + '/' + stato.limiti.maxBers + ' · ' + t('percorsi: ', 'routes: ') + stato.percorsiEsplorati + '/' + stato.limiti.maxPerc + '</span></div>' +
        '<div class="bsiAL-retrogrid"><aside class="bsiAL-retroaside"><h4>' + t('Molecole bersaglio', 'Target molecules') + '</h4>' + BERSAGLI.map(function (b) { return '<button type="button" data-a="target" data-i="' + b.id + '" class="bsiAL-tbtn' + (b.id === bers.id ? ' on' : '') + '"><div class="bsiAL-tnome">' + esc(tt(b.nome)) + '</div><div class="bsiAL-ttag">' + esc(tt(b.tag)) + '</div></button>'; }).join('') +
        '<label class="bsiAL-chk"><input type="checkbox" data-r="green"' + (stato.soloVerde ? ' checked' : '') + '> ' + t('solo percorsi verdi', 'green routes only') + '</label>' +
        '<label class="bsiAL-rng">' + t('max passaggi: ', 'max steps: ') + '<strong>' + stato.maxPassi + '</strong><input type="range" min="2" max="5" value="' + stato.maxPassi + '" data-r="steps"></label>' +
        '<h4>' + t('Inventario', 'Inventory') + '</h4><div class="bsiAL-inv"><input type="text" data-r="inv" value="' + esc(stato.nuovoInv) + '" placeholder="' + t('aggiungi reagente…', 'add reagent…') + '"><button type="button" data-a="addinv">+</button></div><div class="bsiAL-chips">' + stato.inventario.map(function (i) { return '<span>' + esc(i) + '</span>'; }).join('') + '</div></aside>' +
        '<main class="bsiAL-retromain">' + perc.map(function (r) { var sel = attivo && attivo.id === r.id, cop = r.blocchi.filter(function (b) { return stato.inventario.some(function (inv) { return b.toLowerCase().indexOf(inv.toLowerCase()) >= 0; }); }).length;
          return '<div class="bsiAL-perc' + (sel ? ' on' : '') + '"><div class="bsiAL-perchead"><strong>' + esc(tt(r.titolo)) + '</strong><span class="bsiAL-pill' + (r.verde ? ' verde' : '') + '">' + r.passi + ' step · ' + t('inv. ', 'inv. ') + cop + '/' + r.blocchi.length + '</span></div><div class="bsiAL-blk"><strong>' + t('Building block:', 'Building blocks:') + '</strong> ' + esc(r.blocchi.join(' · ')) + '</div><div class="bsiAL-green"><strong>' + t('Chimica verde:', 'Green chemistry:') + '</strong> ' + esc(tt(r.punteggio)) + '</div><button type="button" data-a="board" data-i="' + r.id + '" class="bsiAL-board' + (sel ? ' on' : '') + '">' + t('Apri sulla lavagna', 'Open on the board') + '</button></div>'; }).join('') +
        (attivo ? '<div class="bsiAL-lavagna"><h4>' + t('Lavagna — ', 'Board — ') + esc(tt(attivo.titolo)) + '</h4><p><strong>' + t('Disconnessione:', 'Disconnection:') + '</strong> ' + esc(tt(attivo.disc)) + '</p><ol>' + attivo.lavagna.map(function (b) { return '<li>' + esc(tt(b)) + '</li>'; }).join('') + '</ol></div>' : '') + '</main></div></div>';
    }

    /* ─── eventi ─── */
    function lega(preset, passo, idx) {
      var ps = cont.querySelector('[data-r="preset"]'); if (ps) ps.addEventListener('change', function (e) { var id = e.target.value; agg({ preset: id, passoIdx: 0, sorgente: null, nodoSel: null, passi: clonaPassi(id), storia: [], futuro: [], banner: [MECC[id] ? 'Nuova reazione caricata. Disegna le frecce del Passo 1.' : '', 'New reaction loaded. Draw the Step 1 arrows.'] }); });
      cont.querySelectorAll('[data-a]').forEach(function (b) { b.addEventListener('click', function () { var a = b.getAttribute('data-a');
        if (a === 'vista') agg({ vista: b.getAttribute('data-v') });
        else if (a === 'tool') agg({ strumento: b.getAttribute('data-t'), sorgente: null, banner: [t('Strumento: ', 'Tool: ') + b.getAttribute('data-t'), b.getAttribute('data-t')] });
        else if (a === 'el') agg({ elemento: b.getAttribute('data-e') });
        else if (a === 'drawer') agg({ cassetto: b.getAttribute('data-d') });
        else if (a === 'goto') agg({ passoIdx: +b.getAttribute('data-i'), sorgente: null });
        else if (a === 'reset') agg({ passoIdx: 0, sorgente: null, passi: clonaPassi(stato.preset), banner: ['Lavagna ripristinata.', 'Board reset.'] });
        else if (a === 'undo' && stato.storia.length) { var pr = JSON.parse(stato.storia[stato.storia.length - 1]); agg({ futuro: stato.futuro.concat([JSON.stringify({ passi: stato.passi, passoIdx: stato.passoIdx })]), storia: stato.storia.slice(0, -1), passi: pr.passi, passoIdx: pr.passoIdx, sorgente: null }); }
        else if (a === 'redo' && stato.futuro.length) { var nx = JSON.parse(stato.futuro[stato.futuro.length - 1]); agg({ storia: stato.storia.concat([JSON.stringify({ passi: stato.passi, passoIdx: stato.passoIdx })]), futuro: stato.futuro.slice(0, -1), passi: nx.passi, passoIdx: nx.passoIdx, sorgente: null }); }
        else if (a === 'save') { var ti = tt(preset.titolo); if (stato.salvate.indexOf(ti) < 0) agg({ salvate: stato.salvate.concat([ti]), banner: [t('Reazione salvata.', 'Reaction saved.'), 'Reaction saved.'] }); }
        else if (a === 'solve') { spingiStoria(); var np = JSON.parse(JSON.stringify(stato.passi)); np[idx].frecce = np[idx].attese.map(function (e) { return { da: e.da, a: e.a }; }); agg({ passi: np, banner: ['Risolvi: frecce corrette applicate.', 'Solve it: correct arrows applied.'] }); }
        else if (a === 'next') { var ch = valida(passo); if (!ch.ok) { agg({ cassetto: 'diagnostics', banner: [t('Completa prima le frecce: ', 'Complete the arrows first: ') + ch.msg, ch.msg] }); return; } if (idx < stato.passi.length - 1) agg({ passoIdx: idx + 1, sorgente: null, banner: [t('Avanzato al Passo ', 'Moved to Step ') + (idx + 2) + '.', ''] }); else agg({ banner: ['Meccanismo completato!', 'Mechanism complete!'] }); }
        else if (a === 'target') { var id = b.getAttribute('data-i'), ne = stato.bersagliEsplorati.indexOf(id) >= 0 ? stato.bersagliEsplorati : (stato.bersagliEsplorati.length < stato.limiti.maxBers ? stato.bersagliEsplorati.concat([id]) : stato.bersagliEsplorati); agg({ bersaglio: id, percorso: null, bersagliEsplorati: ne }); }
        else if (a === 'board') agg({ percorso: b.getAttribute('data-i'), percorsiEsplorati: Math.min(stato.limiti.maxPerc, stato.percorsiEsplorati + 1) });
        else if (a === 'addinv') { var val = (stato.nuovoInv || '').trim(); if (val && stato.inventario.indexOf(val) < 0) agg({ inventario: stato.inventario.concat([val]), nuovoInv: '' }); }
      }); });
      cont.querySelectorAll('[data-node]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); var id = el.getAttribute('data-node');
        if (stato.strumento === 'select') agg({ nodoSel: id });
        else if (stato.strumento === 'arrow') { if (!stato.sorgente) agg({ sorgente: id, nodoSel: id, banner: [t('Sorgente scelta. Ora clicca la destinazione.', 'Source chosen. Now click the destination.'), ''] }); else if (stato.sorgente !== id) { spingiStoria(); var np = JSON.parse(JSON.stringify(stato.passi)); np[idx].frecce.push({ da: stato.sorgente, a: id }); agg({ passi: np, sorgente: null, banner: [t('Freccia aggiunta! Premi Risolvi o «+ Passo».', 'Arrow added! Press Solve it or «+ Step».'), ''] }); } }
        else if (stato.strumento === 'erase') { spingiStoria(); var np2 = JSON.parse(JSON.stringify(stato.passi)); np2[idx].nodi = np2[idx].nodi.filter(function (n) { return n.id !== id; }); np2[idx].legami = np2[idx].legami.filter(function (b) { return b.da !== id && b.a !== id; }); np2[idx].frecce = np2[idx].frecce.filter(function (a) { return a.da !== id && a.a !== id; }); agg({ passi: np2, banner: ['Atomo rimosso.', 'Atom removed.'] }); }
      }); });
      cont.querySelectorAll('[data-bond]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); var id = el.getAttribute('data-bond');
        if (stato.strumento === 'arrow') { if (!stato.sorgente) agg({ sorgente: id, banner: [t('Legame sorgente scelto. Clicca la destinazione.', 'Source bond chosen. Click the destination.'), ''] }); else if (stato.sorgente !== id) { spingiStoria(); var np = JSON.parse(JSON.stringify(stato.passi)); np[idx].frecce.push({ da: stato.sorgente, a: id }); agg({ passi: np, sorgente: null, banner: ['Freccia verso il legame aggiunta.', 'Arrow to the bond added.'] }); } }
        else if (stato.strumento === 'bond') { spingiStoria(); var np2 = JSON.parse(JSON.stringify(stato.passi)); var bb = np2[idx].legami.filter(function (x) { return x.id === id; })[0]; if (bb) bb.o = bb.o === 1 ? 2 : 1; agg({ passi: np2, banner: ['Ordine di legame cambiato.', 'Bond order changed.'] }); }
        else if (stato.strumento === 'erase') { spingiStoria(); var np3 = JSON.parse(JSON.stringify(stato.passi)); np3[idx].legami = np3[idx].legami.filter(function (b) { return b.id !== id; }); agg({ passi: np3, banner: ['Legame rimosso.', 'Bond removed.'] }); }
      }); });
      cont.querySelectorAll('[data-arrow]').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); if (stato.strumento === 'erase') { spingiStoria(); var i = +el.getAttribute('data-arrow'); var np = JSON.parse(JSON.stringify(stato.passi)); np[idx].frecce.splice(i, 1); agg({ passi: np, banner: ['Freccia rimossa.', 'Arrow removed.'] }); } }); });
      var tela = cont.querySelector('[data-r="tela"]'); if (tela) tela.addEventListener('click', function (e) { if (stato.strumento === 'atom') { var r = tela.getBoundingClientRect(), x = Math.round((e.clientX - r.left) / r.width * 620), y = Math.round((e.clientY - r.top) / r.height * 290); spingiStoria(); var np = JSON.parse(JSON.stringify(stato.passi)), el = stato.elemento; np[idx].nodi.push({ id: 'u_' + Date.now(), et: el.replace('-', ''), x: x, y: y, q: el.charAt(el.length - 1) === '-' ? -1 : 0, lp: el === 'H-' ? 1 : (el === 'O' || el === 'OH' ? 2 : 0), hyb: 'sp3' }); agg({ passi: np, banner: [t('Specie ', 'Species ') + el + t(' aggiunta.', ' added.'), ''] }); } });
      var gc = cont.querySelector('[data-r="green"]'); if (gc) gc.addEventListener('change', function (e) { agg({ soloVerde: !!e.target.checked }); });
      var sr = cont.querySelector('[data-r="steps"]'); if (sr) sr.addEventListener('input', function (e) { agg({ maxPassi: +e.target.value }); });
      var iv = cont.querySelector('[data-r="inv"]'); if (iv) iv.addEventListener('input', function (e) { stato.nuovoInv = e.target.value; salva(stato); });
    }
    dipingi();
    cont._al = { stato: function () { return stato; }, dipingi: dipingi,
      apri: function (o) { o = o || {}; if (o.vista) stato.vista = o.vista === 'retro' ? 'retro' : 'editor'; if (o.meccanismo && MECC[o.meccanismo]) { stato.preset = o.meccanismo; stato.passi = clonaPassi(o.meccanismo); stato.passoIdx = 0; stato.sorgente = null; } if (o.bersaglio && BERSAGLI.some(function (b) { return b.id === o.bersaglio; })) stato.bersaglio = o.bersaglio; salva(stato); dipingi(); } };
  }

  function stile() {
    if (D.getElementById('bsiAL-stile')) return; var s = D.createElement('style'); s.id = 'bsiAL-stile';
    s.textContent = '.bsiAL{font-family:system-ui,sans-serif;color:#0f172a}.bsiAL-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;background:#064e3b;color:#fff;padding:12px 16px;border-radius:12px 12px 0 0}.bsiAL-nome{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.bsiAL-nome strong{font-size:1.1rem}.bsiAL-badge{font-size:.72rem;background:rgba(255,255,255,.16);padding:3px 9px;border-radius:999px}' +
      '.bsiAL-az{display:flex;gap:8px;flex-wrap:wrap}.bsiAL-vista{min-height:38px;padding:6px 12px;border-radius:8px;border:1px solid #a7f3d0;font-weight:600;cursor:pointer;background:transparent;color:#fff}.bsiAL-vista.on{background:#10b981}.bsiAL-solve{min-height:38px;padding:6px 14px;border-radius:8px;border:none;background:#f59e0b;color:#111827;font-weight:700;cursor:pointer}' +
      '.bsiAL-ed{border:1px solid #cbd5e1;border-top:none;border-radius:0 0 12px 12px;background:#fff;overflow:hidden}.bsiAL-barra,.bsiAL-tool{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:9px 14px;border-bottom:1px solid #e2e8f0}.bsiAL-barra{background:#f8fafc;justify-content:space-between}.bsiAL-barra select,.bsiAL-retroaside select{min-height:34px;border-radius:8px;border:1px solid #cbd5e1;padding:4px 8px;max-width:100%}.bsiAL-min{display:flex;gap:6px;flex-wrap:wrap}.bsiAL-min button,.bsiAL-tool button,.bsiAL-el button{min-height:34px;border-radius:7px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:.82rem;padding:4px 10px;color:#334155;font-weight:600}.bsiAL-tool button.on{border-color:#059669;background:#ecfdf5;color:#065f46}.bsiAL-el button.on{border-color:#2563eb;background:#eff6ff}.bsiAL-reset{border-color:#fca5a5!important;background:#fef2f2!important;color:#b91c1c!important}.bsiAL-sotto{font-size:.8rem;color:#475569}' +
      '.bsiAL-corpo{display:grid;gap:0}@media(min-width:900px){.bsiAL-corpo{grid-template-columns:1.6fr 1fr}}.bsiAL-tela{padding:12px;min-width:0}.bsiAL-passotit{display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px}.bsiAL-passotit strong{font-size:.92rem}.bsiAL-passotit span{font-size:.76rem;color:#059669;font-weight:600}.bsiAL-svg{background-color:#fcfdfe;background-image:radial-gradient(#cbd5e1 1px,transparent 1px);background-size:18px 18px;border:1px solid #cbd5e1;border-radius:10px;cursor:crosshair;user-select:none;touch-action:manipulation}.bsiAL-banner{margin-top:8px;padding:8px 12px;border-radius:8px;font-size:.84rem;background:#f8fafc;border:1px solid #e2e8f0;color:#334155}.bsiAL-banner.ok{background:#ecfdf5;border-color:#6ee7b7;color:#065f46}' +
      '.bsiAL-aside{border-top:1px solid #e2e8f0;background:#f8fafc;padding:12px;display:flex;flex-direction:column;gap:12px}@media(min-width:900px){.bsiAL-aside{border-top:none;border-left:1px solid #e2e8f0}}.bsiAL-tabs{display:flex;gap:4px;flex-wrap:wrap}.bsiAL-tabs button{min-height:32px;padding:5px 9px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-size:.78rem;font-weight:600;cursor:pointer}.bsiAL-tabs button.on{background:#2563eb;border-color:#2563eb;color:#fff}.bsiAL-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:10px;font-size:.84rem}.bsiAL-card h4{margin:0 0 6px}.bsiAL-card p{margin:3px 0}.bsiAL-card hr{border:none;border-top:1px solid #e2e8f0;margin:8px 0}.bsiAL-card ul{margin:0;padding-left:16px;font-size:.8rem;color:#334155}.bsiAL-grigio{color:#64748b}.bsiAL-verde{color:#059669;font-weight:600}.bsiAL-arancio{color:#b45309;font-weight:600}' +
      '.bsiAL-timeline{border-top:1px solid #e2e8f0;padding-top:10px}.bsiAL-tl-t{font-size:.78rem;font-weight:700;color:#475569;margin-bottom:6px}.bsiAL-tl{display:flex;gap:6px;flex-wrap:wrap}.bsiAL-tl button{min-height:34px;padding:6px 10px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-size:.8rem;font-weight:600;cursor:pointer}.bsiAL-tl button.on{background:#059669;border-color:#059669;color:#fff}.bsiAL-next{flex:1;background:#0f172a!important;color:#fff!important;border:none!important}' +
      '.bsiAL-retro{border:1px solid #cbd5e1;border-top:none;border-radius:0 0 12px 12px;background:#fff;padding:16px}.bsiAL-retrohead{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;background:#f8fafc;padding:10px 12px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:14px;font-size:.85rem}.bsiAL-retrogrid{display:grid;gap:16px}@media(min-width:900px){.bsiAL-retrogrid{grid-template-columns:1fr 2fr}}.bsiAL-retroaside{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px}.bsiAL-retroaside h4{margin:10px 0 8px}.bsiAL-tbtn{display:block;width:100%;text-align:left;padding:9px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;margin-bottom:6px}.bsiAL-tbtn.on{border-color:#059669;background:#ecfdf5}.bsiAL-tnome{font-weight:600;font-size:.88rem}.bsiAL-ttag{font-size:.76rem;color:#475569}.bsiAL-chk{display:flex;align-items:center;gap:6px;font-size:.85rem;margin:8px 0;cursor:pointer}.bsiAL-rng{display:block;font-size:.84rem;margin-bottom:12px}.bsiAL-rng input{width:100%}.bsiAL-inv{display:flex;gap:6px;margin-bottom:8px}.bsiAL-inv input{flex:1;min-height:34px;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px}.bsiAL-inv button{min-width:38px;border-radius:6px;border:none;background:#059669;color:#fff;font-weight:700;cursor:pointer}.bsiAL-chips{display:flex;flex-wrap:wrap;gap:4px}.bsiAL-chips span{font-size:.75rem;background:#fff;border:1px solid #cbd5e1;padding:2px 7px;border-radius:999px}' +
      '.bsiAL-retromain{min-width:0;display:flex;flex-direction:column;gap:10px}.bsiAL-perc{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:12px}.bsiAL-perc.on{border-color:#059669;background:#f0fdf4}.bsiAL-perchead{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;margin-bottom:6px}.bsiAL-pill{font-size:.78rem;padding:2px 8px;border-radius:999px;background:#f1f5f9;color:#334155;font-weight:600}.bsiAL-pill.verde{background:#dcfce7;color:#166534}.bsiAL-blk{font-size:.85rem;color:#334155;margin-bottom:4px}.bsiAL-green{font-size:.83rem;color:#475569;margin-bottom:8px}.bsiAL-board{min-height:36px;padding:6px 12px;border-radius:8px;border:1px solid #059669;background:#fff;color:#059669;font-weight:600;font-size:.83rem;cursor:pointer}.bsiAL-board.on{background:#059669;color:#fff}.bsiAL-lavagna{background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:14px}.bsiAL-lavagna h4{margin:0 0 6px}.bsiAL-lavagna ol{margin:0;padding-left:20px;font-size:.86rem;color:#334155}.bsiAL-lavagna li{margin-bottom:5px}';
    D.head.appendChild(s);
  }

  F.sezione('sarrowlab', {
    titolo: ['✏️ Arrow Lab e Retrosintesi', '✏️ Arrow Lab & RetroSynth'],
    sotto: ['Due strumenti di chimica organica, offline: una lavagna dove disegni le frecce curve del meccanismo e il banco ti dice se sono giuste (riduzione del propanone con NaBH₄, SN2), e un pianificatore retrosintetico in stile lavagna con percorsi alternativi, filtri di chimica verde e inventario.', 'Two organic-chemistry tools, offline: a board where you draw the mechanism\'s curved arrows and it tells you if they\'re right (propanone reduction with NaBH₄, SN2), and a retrosynthesis planner with alternative routes, green-chemistry filters and an inventory.'],
    schede: [{ nome: ['✏️ Lo studio', '✏️ The studio'], costruisci: function (div) { stile(); costruisci(div); } }]
  });

  /* ═══ lo strumento per Spectra ══════════════════════════════════════════ */
  var STRUMENTO = { name: 'arrow_lab',
    description: 'Apre «Arrow Lab e Retrosintesi»: una lavagna per disegnare le frecce curve dei meccanismi (vista editor, con preset propanone-nabh4 o sn2-bromobutano) e un pianificatore retrosintetico (vista retro, con bersaglio aril-propionico o beta-idrossiestere). Usalo quando l\'utente chiede di esercitarsi sulle frecce curve di un meccanismo o di vedere la retrosintesi di una molecola.',
    parameters: { type: 'object', properties: { vista: { type: 'string', enum: ['editor', 'retro'] }, meccanismo: { type: 'string', enum: ['propanone-nabh4', 'sn2-bromobutano'] }, bersaglio: { type: 'string', enum: ['aril-propionico', 'beta-idrossiestere'] } }, required: [] },
    execute: function (a) { a = a || {}; if (typeof g.goSection === 'function') g.goSection('sarrowlab'); setTimeout(function () { var d = D.querySelector('#sarrowlab [role="tabpanel"]'); if (d && d._al) d._al.apri(a); }, 350); return Promise.resolve({ ok: true, aperto: 'sarrowlab', vista: a.vista || 'editor', meccanismo: a.meccanismo || null }); } };
  function registra() { var Ts = g.BSI_AI_TOOLS; if (!Ts || !Ts.push) return false; if (!Ts.some(function (x) { return x.name === STRUMENTO.name; })) Ts.push(STRUMENTO); return true; }
  if (!registra()) { var kk = 0, ti = setInterval(function () { if (registra() || ++kk > 40) clearInterval(ti); }, 500); }

  g.BSIArrowLab = { MECC: MECC, BERSAGLI: BERSAGLI, clonaPassi: clonaPassi, statoIniziale: statoIniziale, CHIAVE: CHIAVE };
})(typeof window !== 'undefined' ? window : globalThis);
