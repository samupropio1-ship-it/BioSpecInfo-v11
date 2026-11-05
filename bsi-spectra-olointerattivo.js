/* ════════════════════════════════════════════════════════════════════════
   BioSpecInfo · bsi-spectra-olointerattivo.js  (v242)
   © Samuele Pio Provenzano

   L'OLOGRAMMA INTERATTIVO.
   Richiesta dell'autore: selezionare l'ologramma e interagire; vedere nei grafici
   i passaggi, i dati, che cosa significano e come ci si arriva; nei pianeti e
   nell'universo tutto cio' che li riguarda; negli spettri cambiare tipo e vederli
   modificarsi in base alla traccia e ai dati che si scrivono; in matematica e
   fisica l'ologramma si modifica in tempo reale secondo cio' che si chiede; tutto
   spiegato dalla voce di Spectra e per iscritto, passaggio per passaggio.

   Si apre dal pulsante «⛶ Interagisci» sull'ologramma (nelle sezioni dell'AI,
   nella finestra Spiega, nella console Spectra Live). Una finestra a tutto
   schermo con Spectra col corpo (la figura condivisa), l'ologramma grande e il
   pannello dei passaggi. Quattro modalita':

   🧪 SPETTRI — IR, ¹H-NMR, ¹³C-NMR, massa, UV-Vis. Sei molecole di riferimento
      (acetone, etanolo, acido acetico, benzene, toluene, acetato di etile) con
      valori tipici di letteratura, oppure LA TRACCIA CHE SCRIVI TU («1715 s,
      2950 m» · «2.1 s 3H; 1.2 t 3H J=7» · «58 30, 43 100» · «254 200»). Lo spettro
      si ridisegna mentre scrivi; per l'¹H-NMR si sceglie il campo (MHz) e i
      multipletti si allargano o stringono davvero (J in Hz → ppm). Ogni segnale
      e' un passaggio: posizione, forma, attribuzione e PERCHE' (dalle tabelle
      delle frequenze di gruppo, degli spostamenti chimici, delle perdite neutre).
      Per le molecole: formula, massa molare, grado di insaturazione calcolato.
   🪐 UNIVERSO — gli otto pianeti (dati NASA: semiasse, eccentricita', periodo,
      massa, raggio, lune), in 3D con le orbite di Keplero (equazione di Keplero
      risolta a ogni fotogramma). Scelto un pianeta: periodo dalla terza legge,
      perielio e afelio, velocita' dalla vis-viva, gravita' in superficie,
      velocita' di fuga; oppure un'orbita scritta («a=2 e=0,6»).
   📐 MATEMATICA e ⚛️ FISICA (e chimica dei calcoli) — scrivi la domanda: lo
      svolgimento lo fa l'assistente dell'app (bsi-assistente.js, motore simbolico
      bsi-mat-cas.js), non un modello: i passaggi sono quelli calcolati. Il
      grafico segue: la funzione con la derivata, gli zeri e gli estremi; la
      traiettoria del proiettile con quota massima e gittata; il pendolo che
      oscilla con il suo periodo; per gli altri problemi, i risultati.

   «🔊 Spectra spiega i passaggi»: Spectra li legge uno per uno, il passaggio in
   corso si evidenzia nel testo e nell'ologramma. Toccando un picco, un pianeta o
   un passaggio, si va a quel passaggio.

   API: BSIOloInterattivo.apri(modo, testo), .chiudi(), .stato(), .imposta(testo),
        .SPETTRI, .PIANETI, .spettro(tipo, molecola|traccia), .pianeta(nome|{a,e})
   ════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var D = globale.document;
  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() !== 'it') ? en : it; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(n, d) { return Number(n).toFixed(d).replace('.', ','); }
  function testo(html) { var e = D.createElement('div'); e.innerHTML = html; return e.textContent.replace(/\s+/g, ' ').trim(); }

  /* ═══ GLI SPETTRI ═══ (valori tipici di letteratura, CDCl₃ per l'NMR) */
  var MOLECOLE = {
    acetone: { nome: 'Acetone', formula: 'C3H6O', ir: [[2965, .45, 40, 'C–H sp³ (stretching)'], [1715, .95, 22, 'C=O chetonico (stretching)'], [1420, .45, 25, 'CH₃ (bending asimmetrico)'], [1365, .65, 20, 'CH₃ (bending simmetrico)'], [1220, .75, 30, 'C–C(=O)–C (stretching)']],
      h1: [[2.17, 6, 's', 0, '2 CH₃ equivalenti accanto al C=O']], c13: [[206.7, 'C=O chetonico'], [30.8, 'CH₃']], ms: [[58, 30, 'M⁺·'], [43, 100, 'CH₃CO⁺ (perdita di CH₃·, picco base)'], [15, 15, 'CH₃⁺']], uv: [[279, 15, 'n→π* del C=O (proibita, debole)']] },
    etanolo: { nome: 'Etanolo', formula: 'C2H6O', ir: [[3350, .9, 260, 'O–H con legami a idrogeno (larga)'], [2975, .6, 35, 'C–H sp³'], [2885, .4, 30, 'C–H sp³'], [1380, .35, 25, 'CH₃ (bending)'], [1090, .55, 30, 'C–O'], [1050, .85, 30, 'C–O (stretching)']],
      h1: [[3.69, 2, 'q', 7.0, 'CH₂ legato all\'ossigeno (accoppiato a 3 H del CH₃)'], [2.61, 1, 's', 0, 'OH (scambio rapido: singoletto, posizione variabile)'], [1.22, 3, 't', 7.0, 'CH₃ (accoppiato a 2 H del CH₂)']], c13: [[58.3, 'CH₂–O'], [18.4, 'CH₃']],
      ms: [[46, 25, 'M⁺·'], [45, 45, 'M − H'], [31, 100, 'CH₂=OH⁺ (rottura α, picco base)'], [29, 20, 'C₂H₅⁺ / CHO⁺'], [27, 25, 'C₂H₃⁺']], uv: [[183, 300, 'n→σ* (solo nell\'UV da vuoto: trasparente sopra 210 nm)']] },
    acetico: { nome: 'Acido acetico', formula: 'C2H4O2', ir: [[3000, .8, 380, 'O–H acido, dimeri (larghissima, 2500–3300)'], [1712, .95, 25, 'C=O acido (dimero)'], [1410, .5, 25, 'C–O–H (bending)'], [1295, .7, 30, 'C–O (stretching)'], [940, .45, 40, 'O–H fuori dal piano (dimero)']],
      h1: [[11.4, 1, 'br s', 0, 'COOH (deschermato, scambio)'], [2.10, 3, 's', 0, 'CH₃ accanto al C=O']], c13: [[178.0, 'COOH'], [20.8, 'CH₃']],
      ms: [[60, 75, 'M⁺·'], [45, 90, 'COOH⁺ (perdita di CH₃·)'], [43, 100, 'CH₃CO⁺ (perdita di OH·, picco base)'], [15, 20, 'CH₃⁺']], uv: [[204, 40, 'n→π* del carbossile (debole)']] },
    benzene: { nome: 'Benzene', formula: 'C6H6', ir: [[3035, .45, 30, '=C–H aromatico (sopra 3000)'], [1478, .6, 18, 'C=C dell\'anello'], [1035, .45, 18, 'C–H nel piano'], [674, .95, 18, 'C–H fuori dal piano (anello non sostituito)']],
      h1: [[7.36, 6, 's', 0, '6 H equivalenti dell\'anello (corrente d\'anello: deschermati)']], c13: [[128.4, 'C aromatici (tutti equivalenti)']],
      ms: [[78, 100, 'M⁺· (aromatico stabile: picco base)'], [77, 15, 'C₆H₅⁺'], [52, 20, 'C₄H₄⁺'], [51, 20, 'C₄H₃⁺'], [50, 15, 'C₄H₂⁺']], uv: [[184, 60000, 'π→π* permessa (banda E₁)'], [204, 7400, 'π→π* (banda E₂)'], [254, 204, 'π→π* proibita per simmetria (banda B, struttura fine)']] },
    toluene: { nome: 'Toluene', formula: 'C7H8', ir: [[3030, .45, 30, '=C–H aromatico'], [2920, .45, 30, 'C–H del CH₃'], [1605, .4, 18, 'C=C dell\'anello'], [1495, .6, 18, 'C=C dell\'anello'], [728, .85, 18, 'C–H fuori dal piano (monosostituito)'], [694, .9, 15, 'deformazione dell\'anello (monosostituito)']],
      h1: [[7.25, 5, 'm', 0, '5 H aromatici (quasi equivalenti: multipletto)'], [2.36, 3, 's', 0, 'CH₃ benzilico']], c13: [[137.9, 'C ipso'], [129.0, 'C orto'], [128.2, 'C meta'], [125.3, 'C para'], [21.5, 'CH₃']],
      ms: [[92, 60, 'M⁺·'], [91, 100, 'C₇H₇⁺ tropilio (perdita di H·, picco base)'], [65, 12, 'C₅H₅⁺ (tropilio − C₂H₂)']], uv: [[208, 7900, 'π→π* (banda E₂)'], [261, 225, 'π→π* (banda B)']] },
    etile: { nome: 'Acetato di etile', formula: 'C4H8O2', ir: [[2985, .45, 35, 'C–H sp³'], [1742, .95, 22, 'C=O estereo (più alto dei chetoni)'], [1373, .55, 20, 'CH₃ (bending)'], [1240, .9, 35, 'C–O–C acilico (stretching)'], [1047, .6, 30, 'O–C alchilico']],
      h1: [[4.12, 2, 'q', 7.1, 'OCH₂ (accoppiato al CH₃ vicino)'], [2.05, 3, 's', 0, 'CH₃–C=O'], [1.26, 3, 't', 7.1, 'CH₃ dell\'etile']], c13: [[171.1, 'C=O estereo'], [60.5, 'OCH₂'], [21.0, 'CH₃–C=O'], [14.2, 'CH₃ dell\'etile']],
      ms: [[88, 10, 'M⁺·'], [70, 15, 'M − H₂O'], [61, 15, 'CH₃COOH₂⁺ (doppio riarrangiamento)'], [45, 20, 'OC₂H₅⁺'], [43, 100, 'CH₃CO⁺ (picco base)'], [29, 20, 'C₂H₅⁺']], uv: [[211, 60, 'n→π* dell\'estere (debole)']] }
  };
  var PESI = { C: 12.011, H: 1.008, O: 15.999, N: 14.007 };
  function formula(fm) { var r = {}, re = /([A-Z][a-z]?)(\d*)/g, m; while ((m = re.exec(fm))) { if (!m[1]) break; r[m[1]] = (r[m[1]] || 0) + (m[2] ? +m[2] : 1); } return r; }
  function massa(fm) { var r = formula(fm), s = 0; for (var k in r) s += (PESI[k] || 0) * r[k]; return s; }
  function insaturazione(fm) { var r = formula(fm); return (r.C || 0) - (r.H || 0) / 2 + (r.N || 0) / 2 + 1; }
  /* le tabelle per interpretare una traccia scritta */
  function attribuisciIR(nu, larga) {
    var T = [[3200, 3650, 'O–H (alcoli/fenoli; larga se legata a idrogeno)'], [3300, 3500, 'N–H (ammine/ammidi)'], [3000, 3100, '=C–H (aromatici/alcheni: sopra 3000)'], [2850, 2999, 'C–H sp³ (sotto 3000)'], [2500, 3300, 'O–H acido carbossilico (larghissima)'], [2700, 2850, 'C–H aldeidico (doppietto di Fermi)'], [2210, 2260, 'C≡N nitrile'], [2100, 2260, 'C≡C alchino'], [1735, 1760, 'C=O estere'], [1700, 1734, 'C=O chetone / acido / aldeide'], [1650, 1699, 'C=O coniugato o ammide'], [1620, 1680, 'C=C alchene'], [1450, 1620, 'C=C aromatico'], [1350, 1470, 'C–H (bending)'], [1000, 1300, 'C–O (alcoli, eteri, esteri)'], [650, 900, 'C–H aromatico fuori dal piano']];
    /* la forma conta: gli O–H legati a idrogeno sono larghi; una banda stretta non e' un O–H acido */
    var x = T.filter(function (r) { return nu >= r[0] && nu <= r[1] && (larga || !/O–H/.test(r[2])) && !(larga && /C–H sp³|=C–H/.test(r[2])); }); return x.length ? x.map(function (r) { return r[2]; }).join(' · ') : 'zona delle impronte digitali: vibrazioni dello scheletro, si attribuisce per confronto';
  }
  function attribuisciH(d) { var T = [[0.5, 1.0, 'CH₃ alchilico, lontano da gruppi elettronattrattori'], [1.0, 1.8, 'CH₂/CH alchilici'], [1.8, 2.7, 'H accanto a C=O, arile o C=C (allilici/benzilici)'], [2.7, 4.6, 'H su carbonio legato a O, N o alogeno (deschermati)'], [4.6, 6.8, 'H vinilici'], [6.5, 8.5, 'H aromatici (corrente d\'anello)'], [9.0, 10.5, 'H aldeidico'], [10.0, 13.5, 'H carbossilico (scambio, largo)']]; var x = T.filter(function (r) { return d >= r[0] && d <= r[1]; }); return x.length ? x.map(function (r) { return r[2]; }).join(' · ') : 'zona insolita: controlla il solvente e il riferimento'; }
  function attribuisciC(d) { var T = [[0, 50, 'C sp³'], [50, 90, 'C sp³ legato a O o N'], [65, 90, 'C sp alchinico'], [100, 150, 'C sp² aromatico o alchenico'], [160, 185, 'C=O di acidi, esteri, ammidi'], [185, 220, 'C=O di aldeidi e chetoni']]; var x = T.filter(function (r) { return d >= r[0] && d <= r[1]; }); return x.length ? x.map(function (r) { return r[2]; }).join(' · ') : '—'; }
  function attribuisciMS(m, M) { if (m === M) return 'probabile ione molecolare M⁺· (il picco a m/z più alta)'; var dif = M - m, P = { 1: 'perdita di H·', 15: 'perdita di CH₃·', 17: 'perdita di OH·', 18: 'perdita di H₂O', 28: 'perdita di CO o C₂H₄', 29: 'perdita di CHO· o C₂H₅·', 31: 'perdita di OCH₃·', 43: 'perdita di CH₃CO· o C₃H₇·', 45: 'perdita di COOH· o OC₂H₅·' }; var s = P[dif] ? 'M − ' + dif + ': ' + P[dif] : ''; var I = { 43: 'CH₃CO⁺ (acilio) o C₃H₇⁺', 77: 'C₆H₅⁺ (fenile)', 91: 'C₇H₇⁺ (tropilio)', 105: 'C₆H₅CO⁺ (benzoile)', 31: 'CH₂=OH⁺ (alcoli primari)', 29: 'CHO⁺ / C₂H₅⁺', 57: 'C₄H₉⁺ / C₂H₅CO⁺', 15: 'CH₃⁺' }; return [s, I[m] ? 'ione tipico: ' + I[m] : ''].filter(Boolean).join(' · ') || 'frammento: si interpreta dalle perdite rispetto a M'; }
  function attribuisciUV(l, e) { return (e < 100 ? 'transizione debole (ε < 100): tipicamente n→π*, proibita' : e < 1000 ? 'intensità media: π→π* proibita per simmetria (es. banda B aromatica)' : 'transizione intensa (ε > 10³): π→π* permessa') + (l > 250 ? ' · sopra 250 nm: sistema coniugato o aromatico' : l < 210 ? ' · sotto 210 nm: cromofori isolati' : ''); }
  var MOLT = { s: [1], d: [1, 1], t: [1, 2, 1], q: [1, 3, 3, 1], quint: [1, 4, 6, 4, 1], sext: [1, 5, 10, 10, 5, 1], sept: [1, 6, 15, 20, 15, 6, 1] };
  /* una traccia scritta → lista di segnali */
  function leggiTraccia(tipo, s) {
    s = String(s || '').replace(/,(?=\d)/g, '.'); var parti = s.split(/[;,\n]+/).map(function (x) { return x.trim(); }).filter(Boolean), out = [];
    parti.forEach(function (p) {
      var n = (p.match(/-?\d+(\.\d+)?/g) || []).map(Number); if (!n.length) return;
      if (tipo === 'ir') { var forza = /\bs\b|forte|strong/.test(p) ? .9 : /\bw\b|debole|weak/.test(p) ? .25 : .55, larga = /br|larg|broad/.test(p); out.push([n[0], forza, larga ? 260 : 25, attribuisciIR(n[0], larga)]); }
      else if (tipo === 'h1') { var mm = (p.match(/\b(br s|s|d|t|q|quint|sext|sept|m)\b/) || [, 's'])[1], nh = (p.match(/(\d+)\s*H/i) || [, n[1] && Number.isInteger(n[1]) && n[1] < 20 ? n[1] : 1])[1], J = (p.match(/J\s*=?\s*(\d+(\.\d+)?)/i) || [, mm === 's' || mm === 'br s' || mm === 'm' ? 0 : 7])[1]; out.push([n[0], +nh, mm, +J, attribuisciH(n[0])]); }
      else if (tipo === 'c13') { n.forEach(function (d) { out.push([d, attribuisciC(d)]); }); }
      else if (tipo === 'ms') { out.push([Math.round(n[0]), n[1] != null ? n[1] : 50, '']); }
      else if (tipo === 'uv') { out.push([n[0], n[1] != null ? n[1] : 1000, attribuisciUV(n[0], n[1] != null ? n[1] : 1000)]); }
    });
    if (tipo === 'ms' && out.length) { var M = Math.max.apply(null, out.map(function (x) { return x[0]; })); out.forEach(function (x) { x[2] = attribuisciMS(x[0], M); }); }
    return out;
  }
  /* lo spettro come curva + i segnali come passaggi */
  function spettro(tipo, chi, opz) {
    opz = opz || {}; var mol = MOLECOLE[chi], sig = mol ? mol[tipo] : leggiTraccia(tipo, chi), passi = [], curva = [], assi;
    if (!sig) sig = [];
    if (mol) { var M = massa(mol.formula), DBE = insaturazione(mol.formula); passi.push({ tit: mol.nome + ' · ' + mol.formula.replace(/(\d+)/g, function (d) { return d.split('').map(function (c) { return '₀₁₂₃₄₅₆₇₈₉'[c]; }).join(''); }), html: 'Massa molare ' + f(M, 2) + ' g/mol. Grado di insaturazione = C − H/2 + N/2 + 1 = <b>' + DBE + '</b> (anelli + legami π): ' + (DBE >= 4 ? 'compatibile con un anello aromatico.' : DBE === 1 ? 'un legame π o un anello (qui il C=O).' : DBE === 0 ? 'nessun anello né legame π.' : DBE + ' anelli o legami π.') }); }
    if (tipo === 'ir') {
      assi = { x: [4000, 400], xn: 'numero d\'onda (cm⁻¹)', y: [0, 100], yn: 'trasmittanza (%)' };
      for (var nu = 4000; nu >= 400; nu -= 2) { var T = 100; sig.forEach(function (b) { var g = b[2] / 2; T -= 100 * b[1] * g * g / ((nu - b[0]) * (nu - b[0]) + g * g); }); curva.push([nu, Math.max(0, T)]); }
      sig.forEach(function (b, i) { passi.push({ tit: f(b[0], 0) + ' cm⁻¹ · ' + (b[2] > 150 ? 'larga' : 'stretta') + ', ' + (b[1] > .8 ? 'forte' : b[1] > .4 ? 'media' : 'debole'), html: '<b>' + esc(b[3]) + '</b>. ' + (b[0] > 2500 ? 'Sopra 2500 cm⁻¹ vibrano i legami con l\'idrogeno (atomo leggero: μ piccola, frequenza alta).' : b[0] > 1500 ? 'Fra 1500 e 2500 i legami doppi e tripli: la costante di forza k è grande.' : 'Sotto 1500 la zona delle impronte digitali: legami singoli e deformazioni.') + ' ν̃ = (1/2πc)√(k/μ).', x: b[0] }); });
    } else if (tipo === 'h1') {
      var MHz = opz.MHz || 400; assi = { x: [12, 0], xn: 'δ (ppm) · ' + MHz + ' MHz', y: [0, 1.05], yn: 'intensità' };
      var righe = [];
      sig.forEach(function (s0) { var pat = s0[2] === 'm' ? [1, 3, 4, 3, 1] : s0[2] === 'br s' ? [1] : MOLT[s0[2]] || [1], J = s0[2] === 'm' ? 2.5 : s0[3], tot = pat.reduce(function (a, b) { return a + b; }, 0); pat.forEach(function (w, k) { righe.push([s0[0] + (k - (pat.length - 1) / 2) * J / MHz, s0[1] * w / tot, s0[2] === 'br s' ? 0.04 : Math.max(0.0035, 1.2 / MHz)]); }); });
      var mx = 0; for (var d = 12; d >= 0; d -= 0.002) { var y = 0; righe.forEach(function (r) { var g = r[2] / 2; y += r[1] * g * g / ((d - r[0]) * (d - r[0]) + g * g); }); curva.push([d, y]); if (y > mx) mx = y; }
      curva.forEach(function (p) { p[1] = p[1] / (mx || 1); });
      var righeH = righe;
      sig.forEach(function (s0) { var n = (MOLT[s0[2]] || [1]).length - 1; passi.push({ tit: 'δ ' + f(s0[0], 2) + ' ppm · ' + s0[2] + ' · ' + s0[1] + ' H' + (s0[3] ? ' · J = ' + f(s0[3], 1) + ' Hz' : ''), html: '<b>' + esc(s0[4]) + '</b>. ' + (s0[2] === 'm' ? 'Multipletto: protoni quasi equivalenti con accoppiamenti diversi.' : s0[2] === 'br s' ? 'Singoletto largo: protone che si scambia (OH, NH, COOH).' : n ? 'Regola n + 1: ' + (n + 1) + ' righe → ' + n + ' protoni equivalenti sui carboni vicini; intensità dal triangolo di Pascal (' + (MOLT[s0[2]] || []).join(':') + '). A ' + MHz + ' MHz le righe distano J/ν₀ = ' + f(s0[3] / MHz, 4) + ' ppm.' : 'Singoletto: nessun protone accoppiato sui carboni vicini.') + ' L\'integrale vale ' + s0[1] + ' H.', x: s0[0] }); });
    } else if (tipo === 'c13') {
      assi = { x: [220, 0], xn: 'δ (ppm)', y: [0, 1.05], yn: '' };
      sig.forEach(function (c, i) { curva.push(['bastone', c[0], 0.6 + 0.3 * ((i * 7) % 4) / 3]); passi.push({ tit: 'δ ' + f(c[0], 1) + ' ppm', html: '<b>' + esc(c[1]) + '</b>. ' + attribuisciC(c[0]) + '. In ¹³C ogni carbonio non equivalente dà un segnale (disaccoppiato dai protoni: singoletti).', x: c[0] }); });
    } else if (tipo === 'ms') {
      var Mx = Math.max.apply(null, sig.map(function (m) { return m[0]; }).concat([10])); assi = { x: [0, Math.ceil((Mx + 10) / 10) * 10], xn: 'm/z', y: [0, 105], yn: 'abbondanza relativa (%)' };
      sig.forEach(function (m) { curva.push(['bastone', m[0], m[1]]); passi.push({ tit: 'm/z ' + m[0] + ' · ' + m[1] + '%', html: '<b>' + esc(m[2] || attribuisciMS(m[0], Mx)) + '</b>.' + (m[1] === 100 ? ' È il picco base: lo ione più stabile.' : ''), x: m[0] }); });
    } else if (tipo === 'uv') {
      assi = { x: [180, 400], xn: 'λ (nm)', y: [0, 5], yn: 'log ε' };
      for (var l = 180; l <= 400; l += 0.5) { var A = 0; sig.forEach(function (u) { A = Math.max(A, Math.log10(Math.max(1, u[1])) * Math.exp(-Math.pow((l - u[0]) / 9, 2))); }); curva.push([l, A]); }
      sig.forEach(function (u) { passi.push({ tit: 'λmax ' + f(u[0], 0) + ' nm · ε ≈ ' + u[1], html: '<b>' + esc(u[2]) + '</b>. log ε = ' + f(Math.log10(Math.max(1, u[1])), 2) + '. Legge di Lambert–Beer: A = ε·c·ℓ.', x: u[0] }); });
    }
    return { tipo: tipo, assi: assi, curva: curva, passi: passi, segnali: sig, righe: typeof righeH !== 'undefined' ? righeH : null, MHz: opz.MHz || 400 };
  }

  /* ═══ L'UNIVERSO ═══ (NASA Planetary Fact Sheet; lune note al 2024) */
  var PIANETI = [
    ['Mercurio', 0.387, 0.2056, 0.2408, 0.0553, 0.383, 0, 0xb9b0a3], ['Venere', 0.723, 0.0068, 0.6152, 0.815, 0.949, 0, 0xffd27a], ['Terra', 1.000, 0.0167, 1.0000, 1, 1, 1, 0x6bcfff],
    ['Marte', 1.524, 0.0934, 1.8808, 0.107, 0.532, 2, 0xff7b54], ['Giove', 5.203, 0.0484, 11.862, 317.8, 11.21, 95, 0xffb88a], ['Saturno', 9.537, 0.0539, 29.457, 95.2, 9.45, 146, 0xffe2a0],
    ['Urano', 19.19, 0.0473, 84.011, 14.5, 4.01, 28, 0x9fe7ff], ['Nettuno', 30.07, 0.0086, 164.79, 17.1, 3.88, 16, 0x6b8cff]
  ];
  var GM = 1.32712e20, UA = 1.495979e11;
  function pianeta(x) {
    var p = typeof x === 'string' ? PIANETI.filter(function (q) { return q[0].toLowerCase() === x.toLowerCase(); })[0] : null, a, e, nome, extra = null;
    if (p) { nome = p[0]; a = p[1]; e = p[2]; extra = { T: p[3], M: p[4], R: p[5], lune: p[6] }; } else { a = x.a; e = x.e; nome = t('Orbita scritta', 'Written orbit'); }
    var T = Math.pow(a, 1.5), q = a * (1 - e), Q = a * (1 + e), vis = function (r) { return Math.sqrt(GM * (2 / (r * UA) - 1 / (a * UA))) / 1000; }, vq = vis(q), vQ = vis(Q), vm = 2 * Math.PI * a * UA / (T * 3.15576e7) / 1000;
    var passi = [
      { tit: 'Terza legge di Keplero', html: 'T² = a³ (T in anni, a in UA, attorno al Sole): T = a^1,5 = ' + f(a, 3) + '^1,5 = <b>' + f(T, 3) + ' anni</b>' + (extra ? ' (misurato: ' + f(extra.T, 3) + ' anni).' : '.') },
      { tit: 'Perielio e afelio', html: 'q = a(1 − e) = <b>' + f(q, 3) + ' UA</b> (' + f(q * UA / 1e9, 1) + ' milioni di km) · Q = a(1 + e) = <b>' + f(Q, 3) + ' UA</b> (' + f(Q * UA / 1e9, 1) + ' milioni di km).' },
      { tit: 'Velocità: l\'equazione vis-viva', html: 'v² = GM☉(2/r − 1/a), GM☉ = 1,327·10²⁰ m³/s². Al perielio <b>' + f(vq, 2) + ' km/s</b>, all\'afelio <b>' + f(vQ, 2) + ' km/s</b>: il rapporto ' + f(vq / vQ, 3) + ' = (1+e)/(1−e) = ' + f((1 + e) / (1 - e), 3) + ' (seconda legge). Velocità media ≈ ' + f(vm, 2) + ' km/s.' }
    ];
    if (extra) {
      var g = 9.81 * extra.M / (extra.R * extra.R), ve = 11.19 * Math.sqrt(extra.M / extra.R);
      passi.push({ tit: 'Gravità in superficie', html: 'g = G·M/R² = 9,81 · (M/M⊕)/(R/R⊕)² = 9,81 · ' + f(extra.M, 3) + '/' + f(extra.R, 3) + '² = <b>' + f(g, 2) + ' m/s²</b>.' });
      passi.push({ tit: 'Velocità di fuga', html: 'v_f = √(2GM/R) = 11,19 km/s · √(M/R) = <b>' + f(ve, 2) + ' km/s</b>.' });
      passi.push({ tit: 'Dati', html: 'Massa ' + f(extra.M, 3) + ' M⊕ · raggio ' + f(extra.R, 3) + ' R⊕ · eccentricità ' + f(e, 4) + ' · lune note ' + extra.lune + ' (2024).' });
    }
    return { nome: nome, a: a, e: e, T: T, q: q, Q: Q, vq: vq, vQ: vQ, passi: passi, colore: p ? p[7] : 0x00c9b7 };
  }

  /* ═══ LA FINESTRA ═══ */
  var CSS = '#bsi-olo-ov{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(120% 90% at 50% 0%,#0b1a36 0%,#050a16 60%,#03060f 100%);color:#e9eef6;display:none;font:400 14.5px/1.55 system-ui}' +
    '#bsi-olo-ov.aperto{display:grid;grid-template-columns:minmax(300px,380px) 1fr;grid-template-rows:auto 1fr;grid-template-areas:"testa testa" "lato tela"}' +
    '#bsiOI-testa{grid-area:testa;display:flex;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid rgba(107,207,255,.2);flex-wrap:wrap}' +
    '#bsiOI-testa b{font:800 12px ui-monospace,monospace;letter-spacing:.18em;color:#6bcfff;margin-right:auto}' +
    '#bsi-olo-ov button,#bsi-olo-ov select,#bsi-olo-ov input{font:600 13px system-ui;border-radius:10px;min-height:36px}#bsi-olo-ov .tab,#bsi-olo-ov .b2{background:rgba(16,32,64,.85);border:1px solid #2a4a70;color:#cfe2ff;padding:6px 11px;cursor:pointer}' +
    '#bsi-olo-ov .tab.on{background:linear-gradient(135deg,#1d4ed8,#0e7490);color:#fff;border-color:transparent}#bsi-olo-ov .bt{background:linear-gradient(135deg,#1d4ed8,#0e7490);color:#fff;border:0;padding:8px 13px;cursor:pointer}' +
    '#bsiOI-lato{grid-area:lato;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:10px;border-right:1px solid rgba(107,207,255,.15)}' +
    '#bsiOI-figura{height:230px;flex:0 0 auto}#bsiOI-figura .bsiSF{height:100%;min-height:0;margin:0}#bsiOI-figura .bsiSF-az,#bsiOI-figura .bsiSF-oi{display:none}' +
    '#bsiOI-tela{grid-area:tela;position:relative;min-height:0}#bsiOI-tela canvas{position:absolute;inset:0;width:100%;height:100%}' +
    '#bsi-olo-ov .ctrl{display:flex;gap:6px;flex-wrap:wrap;align-items:center}#bsi-olo-ov input[type=text],#bsi-olo-ov select{background:#0d1b2e;border:1px solid #1a3550;color:#e9eef6;padding:6px 9px}#bsi-olo-ov input[type=text]{flex:1;min-width:150px}' +
    '#bsiOI-passi{display:flex;flex-direction:column;gap:6px}#bsiOI-passi .p{background:rgba(13,27,46,.75);border:1px solid #1a3550;border-radius:10px;padding:8px 10px;cursor:pointer}#bsiOI-passi .p.on{border-color:#00c9b7;box-shadow:0 0 0 1px rgba(0,201,183,.4)}' +
    '#bsiOI-passi .p h4{margin:0 0 3px;font:700 13.5px system-ui;color:#5eead4}#bsi-olo-ov .nota{color:#9fb6dd;font-size:13px}' +
    '@media (max-width:820px){#bsi-olo-ov.aperto{grid-template-columns:1fr;grid-template-rows:auto 190px 38vh 1fr;grid-template-areas:"testa" "fig" "tela" "lato"}#bsiOI-figura{grid-area:fig;height:auto;padding:6px 10px 0}#bsiOI-lato{border-right:0;border-top:1px solid rgba(107,207,255,.15)}}';
  var ST = { aperto: false, modo: 'spettri', tipo: 'h1', chi: 'etanolo', MHz: 400, dati: null, sel: -1, voce: false, pianeta: 'Terra', domanda: '', autoVoce: true };
  var el = {};
  function costruisci() {
    if (el.box) return;
    var s = D.createElement('style'); s.textContent = CSS; D.head.appendChild(s);
    var b = el.box = D.createElement('div'); b.id = 'bsi-olo-ov';   /* l'app nasconde da sola i pulsanti flottanti quando una finestra «bsi-…-ov» e' aperta */ b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', t('Ologramma interattivo di Spectra', 'Spectra\'s interactive hologram'));
    b.innerHTML = '<div id="bsiOI-testa"><b>◈ ' + t('OLOGRAMMA INTERATTIVO', 'INTERACTIVE HOLOGRAM') + '</b>' +
      [['spettri', '🧪 ' + t('Spettri', 'Spectra')], ['universo', '🪐 ' + t('Universo', 'Universe')], ['matematica', '📐 ' + t('Matematica', 'Mathematics')], ['fisica', '⚛️ ' + t('Fisica e chimica', 'Physics & chemistry')]].map(function (m) { return '<button type="button" class="tab" data-modo="' + m[0] + '">' + m[1] + '</button>'; }).join('') +
      '<button type="button" class="b2" id="bsiOI-x" aria-label="' + t('Chiudi', 'Close') + '">✕</button></div>' +
      '<div id="bsiOI-figura"></div><div id="bsiOI-tela"><canvas id="bsiOI-2d" aria-hidden="true"></canvas></div>' +
      '<div id="bsiOI-lato"><div id="bsiOI-ctrl"></div><div class="ctrl"><button type="button" class="bt" id="bsiOI-voce">🔊 ' + t('Spectra spiega i passaggi', 'Spectra explains the steps') + '</button><button type="button" class="b2" id="bsiOI-ai">🧠 ' + t('Approfondisci', 'Go deeper') + '</button></div><div id="bsiOI-passi" aria-live="polite"></div></div>';
    D.body.appendChild(b);
    /* sul telefono la figura sta sopra l'ologramma (la griglia la mette nella sua area) */
    if (globale.matchMedia && globale.matchMedia('(max-width:820px)').matches) { /* niente: le aree della griglia */ }
    else { D.getElementById('bsiOI-lato').insertBefore(D.getElementById('bsiOI-figura'), D.getElementById('bsiOI-lato').firstChild); }
    D.getElementById('bsiOI-x').onclick = chiudi;
    [].forEach.call(b.querySelectorAll('.tab'), function (x) { x.onclick = function () { modo(x.getAttribute('data-modo')); }; });
    D.getElementById('bsiOI-voce').onclick = function () { ST.voce ? fermaVoce() : spiegaPassaggi(); };
    D.getElementById('bsiOI-ai').onclick = approfondisci;
    var cv = D.getElementById('bsiOI-2d'); cv.addEventListener('click', tocco);
    D.addEventListener('keydown', function (e) { if (ST.aperto && e.key === 'Escape') chiudi(); });
    if (globale.ResizeObserver) new ResizeObserver(function () { disegna(); }).observe(D.getElementById('bsiOI-tela')); else globale.addEventListener('resize', disegna);
  }
  function apri(m, txt) {
    costruisci(); el.box.classList.add('aperto'); ST.aperto = true; if (globale._bsiSyncFabs) globale._bsiSyncFabs();
    modo(m || ST.modo, txt);
    try { D.dispatchEvent(new CustomEvent('bsi-olo-interattivo', { detail: { aperto: true } })); } catch (e) {}
  }
  function chiudi() { if (!el.box) return; clearTimeout(tVoce); fermaVoce(); el.box.classList.remove('aperto'); ST.aperto = false; fermaUniverso(); if (globale._bsiSyncFabs) globale._bsiSyncFabs(); try { D.dispatchEvent(new CustomEvent('bsi-olo-interattivo', { detail: { aperto: false } })); } catch (e) {} }
  function modo(m, txt) {
    ST.modo = m; ST.sel = -1; fermaVoce();
    [].forEach.call(el.box.querySelectorAll('.tab'), function (x) { x.classList.toggle('on', x.getAttribute('data-modo') === m); });
    var c = D.getElementById('bsiOI-ctrl');
    if (m === 'spettri') {
      c.innerHTML = '<div class="ctrl"><select id="bsiOI-tipo" aria-label="' + t('Tipo di spettro', 'Spectrum type') + '"><option value="ir">IR</option><option value="h1">¹H-NMR</option><option value="c13">¹³C-NMR</option><option value="ms">' + t('Massa (EI)', 'Mass (EI)') + '</option><option value="uv">UV-Vis</option></select>' +
        '<select id="bsiOI-mol" aria-label="' + t('Molecola', 'Molecule') + '">' + Object.keys(MOLECOLE).map(function (k) { return '<option value="' + k + '">' + MOLECOLE[k].nome + '</option>'; }).join('') + '<option value="">' + t('✍️ La mia traccia…', '✍️ My trace…') + '</option></select>' +
        '<label id="bsiOI-campo" class="nota">' + t('Campo', 'Field') + ' <select id="bsiOI-mhz"><option>60</option><option>100</option><option>300</option><option selected>400</option><option>600</option></select> MHz</label></div>' +
        '<input type="text" id="bsiOI-traccia" aria-label="' + t('Traccia: i tuoi segnali', 'Trace: your signals') + '" placeholder=""><div class="nota" id="bsiOI-aiuto"></div>';
      var tp = D.getElementById('bsiOI-tipo'), mo = D.getElementById('bsiOI-mol'), tr = D.getElementById('bsiOI-traccia'), mh = D.getElementById('bsiOI-mhz');
      tp.value = ST.tipo; mo.value = ST.chi && MOLECOLE[ST.chi] ? ST.chi : ''; mh.value = String(ST.MHz);
      var aggiorna = function () {
        ST.tipo = tp.value; ST.MHz = +mh.value; D.getElementById('bsiOI-campo').style.display = ST.tipo === 'h1' ? '' : 'none';
        var es = { ir: '1715 s, 2950 m, 3300 br', h1: '2.17 s 6H; 1.2 t 3H J=7; 4.1 q 2H J=7', c13: '206.7, 30.8', ms: '58 30, 43 100, 15 15', uv: '254 200, 204 7400' }[ST.tipo];
        tr.placeholder = t('Scrivi la traccia, es.: ', 'Write the trace, e.g.: ') + es; D.getElementById('bsiOI-aiuto').textContent = mo.value ? t('Scegli «La mia traccia…» o scrivi qui sotto: lo spettro si ridisegna mentre scrivi.', 'Choose «My trace…» or type below: the spectrum redraws as you type.') : t('Formato: ', 'Format: ') + es;
        if (tr.value.trim() && !mo.value) ST.chi = tr.value; else if (mo.value) ST.chi = mo.value;
        calcolaSpettro();
      };
      tp.onchange = aggiorna; mh.onchange = aggiorna; mo.onchange = function () { if (mo.value) tr.value = ''; aggiorna(); };
      tr.oninput = function () { if (tr.value.trim()) mo.value = ''; aggiorna(); };
      if (txt) { var k = Object.keys(MOLECOLE).filter(function (q) { return new RegExp(q.slice(0, 5), 'i').test(txt); })[0]; if (k) { mo.value = k; } else { tr.value = txt; mo.value = ''; } if (/ir\b|infraross/i.test(txt)) tp.value = 'ir'; else if (/13c|carbonio/i.test(txt)) tp.value = 'c13'; else if (/massa|ms\b/i.test(txt)) tp.value = 'ms'; else if (/uv/i.test(txt)) tp.value = 'uv'; else if (/nmr|1h|protone/i.test(txt)) tp.value = 'h1'; }
      aggiorna(); mostraTela('2d');
    } else if (m === 'universo') {
      c.innerHTML = '<div class="ctrl"><select id="bsiOI-pia" aria-label="' + t('Pianeta', 'Planet') + '">' + PIANETI.map(function (p) { return '<option>' + p[0] + '</option>'; }).join('') + '<option value="">' + t('✍️ Un\'orbita mia…', '✍️ My orbit…') + '</option></select></div><input type="text" id="bsiOI-orb" placeholder="' + t('es.: a=2 e=0,6  (a in UA)', 'e.g.: a=2 e=0.6 (a in AU)') + '" aria-label="' + t('Orbita: semiasse ed eccentricità', 'Orbit: semi-major axis and eccentricity') + '"><div class="nota">' + t('Scala delle distanze compressa (√a) per vedere insieme pianeti interni ed esterni. Tocca un pianeta.', 'Distance scale compressed (√a) to see inner and outer planets together. Tap a planet.') + '</div>';
      var pi = D.getElementById('bsiOI-pia'), ob = D.getElementById('bsiOI-orb');
      var agg2 = function () { var mm = (ob.value.replace(/,/g, '.').match(/a\s*=\s*([\d.]+).*?e\s*=\s*([\d.]+)/i)); if (!pi.value && mm && +mm[2] < 1 && +mm[1] > 0) ST.pianeta = { a: +mm[1], e: +mm[2] }; else ST.pianeta = pi.value || 'Terra'; calcolaUniverso(); };
      pi.onchange = function () { if (pi.value) ob.value = ''; agg2(); }; ob.oninput = function () { if (ob.value.trim()) pi.value = ''; agg2(); };
      if (txt) { var nm = PIANETI.filter(function (p) { return new RegExp(p[0].slice(0, 4), 'i').test(txt); })[0]; if (nm) pi.value = nm[0]; }
      else if (typeof ST.pianeta === 'string') pi.value = ST.pianeta;
      agg2(); mostraTela('3d');
    } else {
      var esempi = m === 'matematica' ? [t('studia f(x)=x^3-3x', 'studia f(x)=x^3-3x'), 'deriva sin(x)*x^2', t('integra x*e^x', 'integra x*e^x'), 'limite di sin(x)/x per x→0'] : [t('un proiettile lanciato a 20 m/s con un angolo di 30°', 'un proiettile lanciato a 20 m/s con un angolo di 30°'), t('pendolo lungo 2 m: periodo', 'pendolo lungo 2 m: periodo'), 'pH di HCl 0,01 M', t('caduta libera da 45 m', 'caduta libera da 45 m')];
      c.innerHTML = '<div class="ctrl"><input type="text" id="bsiOI-q" aria-label="' + t('La tua domanda', 'Your question') + '" placeholder="' + esc(esempi[0]) + '"><button type="button" class="bt" id="bsiOI-vai">▶</button></div><div class="ctrl">' + esempi.map(function (e) { return '<button type="button" class="b2 es">' + esc(e) + '</button>'; }).join('') + '</div>';
      var q = D.getElementById('bsiOI-q'), via = function () { ST.domanda = q.value.trim() || esempi[0]; calcolaDomanda(); };
      D.getElementById('bsiOI-vai').onclick = via; q.onkeydown = function (e) { if (e.key === 'Enter') via(); };
      [].forEach.call(c.querySelectorAll('.es'), function (b) { b.onclick = function () { q.value = b.textContent; via(); }; });
      q.value = txt || (ST.domanda && ST.modoDomanda === m ? ST.domanda : esempi[0]); ST.modoDomanda = m; via(); mostraTela('2d');
    }
  }

  /* ── i calcoli e i passaggi ── */
  function calcolaSpettro() {
    var S = spettro(ST.tipo, ST.chi, { MHz: ST.MHz }); ST.dati = { tipo: 'spettro', S: S }; ST.sel = -1;
    if (ST.tipo === 'h1') { var pr = S.passi.findIndex(function (p) { return p.x != null; }); ST.sel = pr; }
    passi(S.passi.length ? S.passi : [{ tit: t('Nessun segnale', 'No signal'), html: t('Scrivi almeno un segnale nel formato indicato.', 'Write at least one signal in the format shown.') }]);
    if (ST.sel >= 0) [].forEach.call(D.querySelectorAll('#bsiOI-passi .p'), function (d, k) { d.classList.toggle('on', k === ST.sel); });
    disegna(); tema('spettro');
  }
  function calcolaUniverso() { var P = pianeta(ST.pianeta); ST.dati = { tipo: 'universo', P: P }; ST.sel = -1; passi(P.passi); avviaUniverso(); tema('pianeti'); }
  function calcolaDomanda() {
    var A = globale.BSIAssistente, q = ST.domanda, mat = ST.modo === 'matematica' ? 'matematica' : (/\bph\b|mol|acid|base|tampone|reazion|stechiom|concentraz/i.test(q) ? 'chimica' : 'fisica');
    var r = null; try { r = A && A.rispondi ? A.rispondi(q, mat) : null; } catch (e) { r = null; }
    var P = r && r.passi ? r.passi.map(function (p) { return { tit: p.titolo, html: p.html }; }) : [];
    if (!r || !r.titolo) P = [{ tit: t('Non riconosciuto', 'Not recognised'), html: t('L\'assistente dell\'app non ha riconosciuto il problema: riformula con una parola chiave (studia, deriva, integra, limite, proiettile, pendolo, pH…) oppure usa «🧠 Approfondisci».', 'The app\'s assistant did not recognise the problem: rephrase with a keyword, or use «🧠 Go deeper».') }];
    else P.unshift({ tit: '🧠 ' + r.titolo, html: (r.capito ? t('Ho capito: ', 'I understood: ') + r.capito : esc(q)) });
    var vis = null, CAS = globale.BSIMatCAS;
    if (mat === 'matematica' && CAS) {
      var m = q.match(/f\s*\(\s*x\s*\)\s*=\s*([^;]+)$/i) || q.match(/(?:studia|deriva|integra|disegna|grafico di)\s+(.+?)(?:\s+(?:per|da|tra)\b.*)?$/i) || q.match(/limite di\s+(.+?)\s+per\b/i), ex = m ? m[1].replace(/f\s*\(\s*x\s*\)\s*=/i, '').trim() : null;
      if (ex) { try { var e = CAS.leggi(ex), fx = CAS.funzione(e, 'x'), d = CAS.deriva(e, 'x'), dfx = CAS.funzione(d, 'x'); vis = { tipo: 'funzione', f: fx, df: dfx, nome: CAS.stampa(e), dnome: CAS.stampa(d), zeri: CAS.zeri(fx, -6, 6, 1200), crit: CAS.zeri(dfx, -6, 6, 1200) }; } catch (er) { vis = null; } }
    } else if (r && r.modello && r.risultati) {
      var R = {}; r.risultati.forEach(function (x) { R[x.nome] = x.v; });
      if (r.modello.id === 'proiettile' && R.tempo && R.R) { var vx = R.R / R.tempo, vy = Math.sqrt(2 * 9.81 * (R.h_max || 0)), h = 9.81 * R.tempo * R.tempo / 2 - vy * R.tempo; vis = { tipo: 'proiettile', vx: vx, vy: vy, h: Math.max(0, h), T: R.tempo, R: R.R, hmax: R.h_max }; }
      else if (r.modello.id === 'pendolo' && R.T) vis = { tipo: 'pendolo', T: R.T, L: 9.81 * Math.pow(R.T / (2 * Math.PI), 2) };
      else vis = { tipo: 'risultati', R: r.risultati };
    }
    ST.dati = { tipo: 'domanda', r: r, vis: vis }; ST.sel = -1; passi(P); disegna(); tema(mat === 'matematica' ? 'superficie' : 'onda');
  }
  function tema(scena) { var F = globale.BSISpectraFigura && globale.BSISpectraFigura.figura; if (F && F.olo) { F.olo.auto = false; F.olo.mostra(scena); } }
  /* (v242) richiesta dell'autore: «spiegato tutto a voce di Spectra». A ogni nuovo calcolo, appena i dati smettono di cambiare
     (1,4 s dopo l'ultima modifica), Spectra dice i passaggi da sola; «⏹ Ferma» la interrompe */
  var tVoce = 0;
  function voceAutomatica() {
    clearTimeout(tVoce); if (!ST.autoVoce || !ST.aperto) return;
    if (ST.voce) fermaVoce();
    tVoce = setTimeout(function () { if (ST.aperto && ST.autoVoce && !ST.voce) spiegaPassaggi(); }, 1400);
  }
  function passi(P) {
    ST.passi = P; voceAutomatica(); var box = D.getElementById('bsiOI-passi'); box.innerHTML = '';
    P.forEach(function (p, i) { var d = D.createElement('div'); d.className = 'p'; d.setAttribute('role', 'button'); d.tabIndex = 0; d.innerHTML = '<h4>' + (i + 1) + '. ' + esc(p.tit) + '</h4><div>' + p.html + '</div>'; d.onclick = function () { scegli(i, true); }; d.onkeydown = function (e) { if (e.key === 'Enter') scegli(i, true); }; box.appendChild(d); });
  }
  function scegli(i, parla) {
    ST.sel = i; [].forEach.call(D.querySelectorAll('#bsiOI-passi .p'), function (d, k) { d.classList.toggle('on', k === i); if (k === i) try { d.scrollIntoView({ block: 'nearest' }); } catch (e) {} });
    disegna(); if (ST.dati && ST.dati.tipo === 'universo') evidenziaUniverso();
    if (parla && ST.passi[i]) dici(ST.passi[i]);
  }
  function dici(p, fatto) {
    var s = p.tit + '. ' + testo(p.html), L = globale.BSISpectraLive;
    if (L && L.parla) L.parla(s, fatto); else { try { D.dispatchEvent(new CustomEvent('bsi-spectra-dice', { detail: { testo: s } })); } catch (e) {} if (fatto) setTimeout(fatto, Math.min(9000, 400 + s.length * 55)); }
  }
  function spiegaPassaggi() {
    if (!ST.passi || !ST.passi.length) return; ST.voce = true; D.getElementById('bsiOI-voce').textContent = '⏹ ' + t('Ferma', 'Stop');
    var i = 0; (function prossimo() { if (!ST.voce || !ST.aperto) return; if (i >= ST.passi.length) return fermaVoce(); scegli(i, false); dici(ST.passi[i], function () { i++; setTimeout(prossimo, 350); }); })();
  }
  function fermaVoce() { ST.voce = false; var b = D.getElementById('bsiOI-voce'); if (b) b.textContent = '🔊 ' + t('Spectra spiega i passaggi', 'Spectra explains the steps'); var L = globale.BSISpectraLive; if (L && L.taci) try { L.taci(); } catch (e) {} }
  function approfondisci() {
    var d = ST.dati, q = d && d.tipo === 'spettro' ? 'Interpreta in modo completo questo spettro ' + ({ ir: 'IR', h1: '¹H-NMR', c13: '¹³C-NMR', ms: 'di massa', uv: 'UV-Vis' })[ST.tipo] + ': ' + (MOLECOLE[ST.chi] ? MOLECOLE[ST.chi].nome : ST.chi) + '. Segnali: ' + d.S.passi.map(function (p) { return p.tit; }).join('; ')
      : d && d.tipo === 'universo' ? 'Spiegami tutto dell\'orbita: ' + d.P.nome + ' (a = ' + d.P.a + ' UA, e = ' + d.P.e + ')' : ST.domanda;
    chiudi(); if (globale.bsiOpenAIHub && globale.BSISpiega) { globale.bsiOpenAIHub('spiega'); setTimeout(function () { globale.BSISpiega.chiedi(q, { nonAprire: true }); }, 600); }
  }

  /* ── il disegno 2D: spettri, funzioni, proiettile, pendolo ── */
  function mostraTela(q) { var c2 = D.getElementById('bsiOI-2d'); if (c2) c2.style.display = q === '2d' ? '' : 'none'; if (q !== '3d') { fermaUniverso(); disegna(); } }
  var COL = { asse: 'rgba(159,182,221,.55)', griglia: 'rgba(47,107,255,.14)', curva: '#00c9b7', sel: '#ffd27a', testo: '#cfe2ff', d: '#6b8cff' };
  function disegna() {
    if (!ST.aperto || !ST.dati || ST.dati.tipo === 'universo') return;
    var cv = D.getElementById('bsiOI-2d'), W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    var dpr = Math.min(2.5, globale.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H); g.shadowColor = 'rgba(0,201,183,.6)';
    var m = { l: 56, r: 18, t: 22, b: 46 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
    function assi(ax, ay, nx, ny) {
      g.strokeStyle = COL.griglia; g.lineWidth = 1; for (var i = 0; i <= 8; i++) { var x = m.l + pw * i / 8; g.beginPath(); g.moveTo(x, m.t); g.lineTo(x, m.t + ph); g.stroke(); }
      for (i = 0; i <= 5; i++) { var y = m.t + ph * i / 5; g.beginPath(); g.moveTo(m.l, y); g.lineTo(m.l + pw, y); g.stroke(); }
      g.strokeStyle = COL.asse; g.strokeRect(m.l, m.t, pw, ph); g.fillStyle = COL.testo; g.font = '11px system-ui'; g.textAlign = 'center';
      for (i = 0; i <= 8; i++) { var v = ax[0] + (ax[1] - ax[0]) * i / 8; g.fillText(Math.abs(v) >= 100 ? Math.round(v) : (Math.round(v * 10) / 10).toString().replace('.', ','), m.l + pw * i / 8, m.t + ph + 15); }
      g.textAlign = 'right'; for (i = 0; i <= 5; i++) { var v2 = ay[1] - (ay[1] - ay[0]) * i / 5; g.fillText((Math.abs(v2) >= 10 ? Math.round(v2) : Math.round(v2 * 100) / 100).toString().replace('.', ','), m.l - 6, m.t + ph * i / 5 + 4); }
      g.textAlign = 'center'; g.font = '600 12px system-ui'; g.fillText(nx, m.l + pw / 2, H - 8); g.save(); g.translate(13, m.t + ph / 2); g.rotate(-Math.PI / 2); g.fillText(ny, 0, 0); g.restore();
    }
    var X = function (v, ax) { return m.l + pw * (v - ax[0]) / (ax[1] - ax[0]); }, Y = function (v, ay) { return m.t + ph * (1 - (v - ay[0]) / (ay[1] - ay[0])); };
    ST.mappa = [];
    if (ST.dati.tipo === 'spettro') {
      var S = ST.dati.S, A = S.assi; assi(A.x, A.y, A.xn, A.yn); g.shadowBlur = 8; g.strokeStyle = COL.curva; g.lineWidth = 1.8;
      if (S.curva.length && S.curva[0][0] === 'bastone') { S.curva.forEach(function (c, i) { g.strokeStyle = i === ST.sel - (S.passi.length - S.curva.length) ? COL.sel : COL.curva; g.lineWidth = 3; g.beginPath(); g.moveTo(X(c[1], A.x), Y(0, A.y)); g.lineTo(X(c[1], A.x), Y(c[2], A.y)); g.stroke(); }); }
      else { g.beginPath(); S.curva.forEach(function (p, i) { var x = X(p[0], A.x), y = Y(p[1], A.y); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); }
      g.shadowBlur = 0;
      /* ¹H-NMR: il riquadro ingrandito del segnale scelto (a tutta scala un multipletto e' largo pochi pixel) */
      var ps = S.passi[ST.sel];
      if (S.tipo === 'h1' && ps && ps.x != null && S.righe) {
        var vic = S.righe.filter(function (r) { return Math.abs(r[0] - ps.x) < 0.2; }), lo = Math.min.apply(null, vic.map(function (r) { return r[0]; })), hi = Math.max.apply(null, vic.map(function (r) { return r[0]; })), mz = Math.max(0.04, (hi - lo) * 0.8);
        var za = [hi + mz, lo - mz], iw = Math.min(300, pw * 0.42), ih = Math.min(170, ph * 0.42), ix = ps.x > 6 ? m.l + pw - iw - 10 : m.l + 10, iy = m.t + 40;
        g.fillStyle = 'rgba(4,10,24,.92)'; g.fillRect(ix, iy, iw, ih); g.strokeStyle = COL.sel; g.strokeRect(ix, iy, iw, ih);
        var ymax = 0, pts = []; for (var k2 = 0; k2 <= 400; k2++) { var dd = za[0] + (za[1] - za[0]) * k2 / 400, yv = 0; vic.forEach(function (r) { var gg = r[2] / 2; yv += r[1] * gg * gg / ((dd - r[0]) * (dd - r[0]) + gg * gg); }); pts.push([dd, yv]); if (yv > ymax) ymax = yv; }
        g.strokeStyle = COL.curva; g.lineWidth = 1.8; g.beginPath(); pts.forEach(function (q2, k3) { var px2 = ix + iw * (q2[0] - za[0]) / (za[1] - za[0]), py2 = iy + ih - 18 - (ih - 34) * q2[1] / (ymax || 1); if (k3) g.lineTo(px2, py2); else g.moveTo(px2, py2); }); g.stroke();
        g.fillStyle = COL.sel; g.font = '700 11.5px system-ui'; g.textAlign = 'left'; g.fillText(t('ingrandito: ', 'zoom: ') + f(za[0], 3) + ' → ' + f(za[1], 3) + ' ppm', ix + 8, iy + 14);
        g.fillStyle = COL.testo; g.font = '11px system-ui'; g.fillText(t('righe a J/ν₀ = ', 'lines at J/ν₀ = ') + (S.segnali.filter(function (q) { return q[0] === ps.x; })[0] || [0, 0, '', 0])[3] + ' Hz / ' + S.MHz + ' MHz', ix + 8, iy + ih - 5);
      }
      S.passi.forEach(function (p, i) { if (p.x == null) return; var x = X(p.x, A.x); ST.mappa.push([x, i]); g.fillStyle = i === ST.sel ? COL.sel : 'rgba(107,207,255,.85)'; g.beginPath(); g.arc(x, m.t + 8, i === ST.sel ? 6 : 4, 0, 7); g.fill(); if (i === ST.sel) { g.strokeStyle = 'rgba(255,210,122,.6)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x, m.t); g.lineTo(x, m.t + ph); g.stroke(); g.setLineDash([]); g.fillStyle = COL.sel; g.font = '700 12px system-ui'; g.textAlign = x > W - 160 ? 'right' : 'left'; g.fillText(p.tit, x + (x > W - 160 ? -8 : 8), m.t + 26); } });
      return;
    }
    var v = ST.dati.vis;
    if (!v) { g.fillStyle = COL.testo; g.font = '600 15px system-ui'; g.textAlign = 'center'; g.fillText(t('I passaggi sono nel pannello: tocca «🔊» per sentirli da Spectra', 'The steps are in the panel'), W / 2, H / 2); return; }
    if (v.tipo === 'funzione') {
      /* la finestra si adatta ai punti notevoli (zeri e punti stazionari), con margine; senza punti notevoli [−6, 6] */
      var nott = v.zeri.concat(v.crit).filter(isFinite), ax2 = nott.length ? [Math.max(-10, Math.min.apply(null, nott) - 2.5), Math.min(10, Math.max.apply(null, nott) + 2.5)] : [-6, 6];
      if (ax2[1] - ax2[0] < 4) { var cm = (ax2[0] + ax2[1]) / 2; ax2 = [cm - 2, cm + 2]; }
      var ys = []; for (var xx = ax2[0]; xx <= ax2[1]; xx += (ax2[1] - ax2[0]) / 1200) { var yy = v.f(xx); if (isFinite(yy)) ys.push(yy); }
      ys.sort(function (a, b) { return a - b; }); var lo = ys[Math.floor(ys.length * 0.04)], hi = ys[Math.floor(ys.length * 0.96)]; if (!isFinite(lo)) lo = -5; if (!isFinite(hi)) hi = 5; if (hi - lo < 1) { lo -= 1; hi += 1; } var pad = (hi - lo) * 0.15, ay2 = [lo - pad, hi + pad];
      assi(ax2, ay2, 'x', 'y'); [[v.f, COL.curva], [v.df, COL.d]].forEach(function (c) { g.strokeStyle = c[1]; g.lineWidth = c[1] === COL.curva ? 2.4 : 1.4; g.shadowBlur = c[1] === COL.curva ? 8 : 0; g.beginPath(); var su = false; for (var x = ax2[0]; x <= ax2[1]; x += (ax2[1] - ax2[0]) / 1500) { var y = c[0](x); if (!isFinite(y) || y < ay2[0] - 1e3 || y > ay2[1] + 1e3) { su = false; continue; } var px = X(x, ax2), py = Math.max(-1e4, Math.min(1e4, Y(y, ay2))); if (su) g.lineTo(px, py); else { g.moveTo(px, py); su = true; } } g.stroke(); });
      g.shadowBlur = 0; if (ay2[0] < 0 && ay2[1] > 0) { g.strokeStyle = COL.asse; g.beginPath(); g.moveTo(m.l, Y(0, ay2)); g.lineTo(m.l + pw, Y(0, ay2)); g.stroke(); }
      v.zeri.filter(function (z) { return z >= ax2[0] && z <= ax2[1]; }).forEach(function (z) { g.fillStyle = '#ff9fd2'; g.beginPath(); g.arc(X(z, ax2), Y(0, ay2), 5, 0, 7); g.fill(); });
      v.crit.filter(function (z) { return z >= ax2[0] && z <= ax2[1]; }).forEach(function (z) { var y = v.f(z); if (!isFinite(y)) return; g.fillStyle = COL.sel; g.beginPath(); g.arc(X(z, ax2), Y(y, ay2), 5, 0, 7); g.fill(); g.font = '600 11px system-ui'; g.textAlign = 'center'; g.fillText('(' + f(z, 2) + '; ' + f(y, 2) + ')', X(z, ax2), Y(y, ay2) - 9); });
      g.textAlign = 'left'; g.font = '700 12.5px system-ui'; g.fillStyle = COL.curva; g.fillText('f(x) = ' + v.nome, m.l + 8, m.t + 16); g.fillStyle = COL.d; g.fillText('f′(x) = ' + v.dnome, m.l + 8, m.t + 32); g.fillStyle = '#ff9fd2'; g.fillText('● ' + t('zeri', 'zeros'), m.l + 8, m.t + 48); g.fillStyle = COL.sel; g.fillText('● ' + t('punti stazionari (f′ = 0)', 'stationary points (f′ = 0)'), m.l + 70, m.t + 48);
    } else if (v.tipo === 'proiettile') {
      var ax3 = [0, v.R * 1.08], ay3 = [0, (v.h + v.hmax) * 1.25 || 1]; assi(ax3, ay3, 'x (m)', 'y (m)');
      g.strokeStyle = COL.curva; g.lineWidth = 2.4; g.shadowBlur = 8; g.beginPath(); for (var k = 0; k <= 200; k++) { var tt = v.T * k / 200, x3 = v.vx * tt, y3 = v.h + v.vy * tt - 4.905 * tt * tt; if (k) g.lineTo(X(x3, ax3), Y(y3, ay3)); else g.moveTo(X(x3, ax3), Y(y3, ay3)); } g.stroke(); g.shadowBlur = 0;
      var ta = (performance.now() / 1000) % (v.T + 0.8), tc = Math.min(ta, v.T); g.fillStyle = '#fff'; g.beginPath(); g.arc(X(v.vx * tc, ax3), Y(v.h + v.vy * tc - 4.905 * tc * tc, ay3), 6, 0, 7); g.fill();
      var tm = v.vy / 9.81; g.fillStyle = COL.sel; g.font = '600 12px system-ui'; g.textAlign = 'center'; g.fillText('h_max = ' + f(v.hmax, 2) + ' m', X(v.vx * tm, ax3), Y(v.h + v.hmax, ay3) - 10); g.fillText('R = ' + f(v.R, 2) + ' m · t = ' + f(v.T, 2) + ' s', X(v.R, ax3) - 40, Y(0, ay3) - 10);
      animaPoi();
    } else if (v.tipo === 'pendolo') {
      var cx = W / 2, cy = m.t + 20, Lp = Math.min(ph * 0.8, pw * 0.45), th = 0.35 * Math.cos(2 * Math.PI * (performance.now() / 1000) / v.T), bx = cx + Lp * Math.sin(th), by = cy + Lp * Math.cos(th);
      g.strokeStyle = COL.asse; g.beginPath(); g.moveTo(cx - 60, cy); g.lineTo(cx + 60, cy); g.stroke(); g.strokeStyle = COL.curva; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(bx, by); g.stroke(); g.shadowBlur = 12; g.fillStyle = COL.curva; g.beginPath(); g.arc(bx, by, 14, 0, 7); g.fill(); g.shadowBlur = 0;
      g.fillStyle = COL.testo; g.font = '700 14px system-ui'; g.textAlign = 'center'; g.fillText('T = 2π√(L/g) = ' + f(v.T, 3) + ' s · L = ' + f(v.L, 2) + ' m', W / 2, H - 14); animaPoi();
    } else if (v.tipo === 'risultati') {
      g.textAlign = 'center'; g.fillStyle = COL.testo; v.R.forEach(function (x, i) { var y = m.t + 30 + i * 46; g.font = '800 26px system-ui'; g.fillStyle = COL.curva; g.fillText(x.nome + ' = ' + (Math.abs(x.v) < 1e-3 || Math.abs(x.v) > 1e5 ? x.v.toExponential(3) : f(x.v, 4)) + ' ' + (x.u || ''), W / 2, y + 20); });
    }
  }
  var animando = false; function animaPoi() { if (animando) return; animando = true; requestAnimationFrame(function () { animando = false; if (ST.aperto && ST.dati && ST.dati.vis && (ST.dati.vis.tipo === 'proiettile' || ST.dati.vis.tipo === 'pendolo')) disegna(); }); }
  function tocco(e) {
    if (!ST.mappa || !ST.mappa.length) return; var r = e.target.getBoundingClientRect(), x = e.clientX - r.left, best = null, dmin = 30;
    ST.mappa.forEach(function (p) { var d = Math.abs(p[0] - x); if (d < dmin) { dmin = d; best = p[1]; } }); if (best != null) scegli(best, true);
  }

  /* ── l'universo in 3D ── */
  var U = null;
  function avviaUniverso() {
    var T = globale.THREE, box = D.getElementById('bsiOI-tela'); if (!T) return;
    if (!U) {
      var ren = new T.WebGLRenderer({ antialias: true, alpha: true }); ren.setPixelRatio(Math.min(2.5, globale.devicePixelRatio || 1)); ren.domElement.id = 'bsiOI-3d'; box.appendChild(ren.domElement);
      var sc = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, 0.01, 200); sc.add(new T.AmbientLight(0xffffff, 0.6));
      var sole = new T.Mesh(new T.SphereGeometry(0.16, 32, 24), new T.MeshBasicMaterial({ color: 0xffd27a })); sc.add(sole); sc.add(new T.Mesh(new T.SphereGeometry(0.26, 32, 24), new T.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.18, blending: T.AdditiveBlending, depthWrite: false })));
      U = { T: T, ren: ren, sc: sc, cam: cam, gruppi: [], t: 0, az: 0.6, el: 0.55, r: 9 };
      var tr = null; ren.domElement.addEventListener('pointerdown', function (e) { tr = { x: e.clientX, y: e.clientY, az: U.az, el: U.el, mosso: false }; });
      globale.addEventListener('pointerup', function (e) { if (tr && !tr.mosso) sceltaPianeta(e); tr = null; });
      globale.addEventListener('pointermove', function (e) { if (!tr) return; if (Math.abs(e.clientX - tr.x) + Math.abs(e.clientY - tr.y) > 6) tr.mosso = true; U.az = tr.az - (e.clientX - tr.x) * 0.006; U.el = Math.max(0.05, Math.min(1.4, tr.el + (e.clientY - tr.y) * 0.004)); });
      ren.domElement.addEventListener('wheel', function (e) { U.r = Math.max(3, Math.min(20, U.r * (1 + Math.sign(e.deltaY) * 0.08))); e.preventDefault(); }, { passive: false });
    }
    U.ren.domElement.style.display = '';
    U.gruppi.forEach(function (g) { U.sc.remove(g.grp); }); U.gruppi = [];
    var lista = PIANETI.map(function (p) { return { nome: p[0], a: p[1], e: p[2], col: p[7], T: p[3] }; }), P = ST.dati.P;
    if (typeof ST.pianeta !== 'string') lista.push({ nome: P.nome, a: P.a, e: P.e, col: 0x00c9b7, T: P.T, mia: true });
    lista.forEach(function (q) {
      var T = U.T, grp = new T.Group(), s = function (r) { return 1.2 * Math.sqrt(r); }, pts = [], b = q.a * Math.sqrt(1 - q.e * q.e);
      for (var k = 0; k <= 160; k++) { var E = k / 160 * Math.PI * 2, x = q.a * (Math.cos(E) - q.e), z = b * Math.sin(E), r = Math.hypot(x, z); pts.push(new T.Vector3(x / r * s(r), 0, z / r * s(r))); }
      var sel = q.nome === P.nome, ln = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: q.col, transparent: true, opacity: sel ? 0.95 : 0.35 })); grp.add(ln);
      var pl = new T.Mesh(new T.SphereGeometry(sel ? 0.12 : 0.075, 20, 14), new T.MeshBasicMaterial({ color: q.col })); pl.userData.nome = q.nome; grp.add(pl);
      U.sc.add(grp); U.gruppi.push({ q: q, grp: grp, pl: pl, s: s, b: b, sel: sel });
    });
    if (!U.raf) { var prec = 0; (function giro(ora) { if (!ST.aperto || ST.modo !== 'universo') { U.raf = 0; return; } U.raf = requestAnimationFrame(giro); var dt = prec ? Math.min(0.1, (ora - prec) / 1000) : 0.016; prec = ora; U.t += dt * 0.25;
      U.gruppi.forEach(function (g) { var q = g.q, M = 2 * Math.PI * U.t / q.T, E = M; for (var k = 0; k < 6; k++) E -= (E - q.e * Math.sin(E) - M) / (1 - q.e * Math.cos(E)); var x = q.a * (Math.cos(E) - q.e), z = g.b * Math.sin(E), r = Math.hypot(x, z); g.pl.position.set(x / r * g.s(r), 0, z / r * g.s(r)); });
      var w = box.clientWidth, h = box.clientHeight; if (U.w !== w || U.h !== h) { U.ren.setSize(w, h, false); U.cam.aspect = w / h; U.cam.updateProjectionMatrix(); U.w = w; U.h = h; }
      U.cam.position.set(U.r * Math.sin(U.az) * Math.cos(U.el), U.r * Math.sin(U.el), U.r * Math.cos(U.az) * Math.cos(U.el)); U.cam.lookAt(0, 0, 0); U.ren.render(U.sc, U.cam); })(0); }
  }
  function fermaUniverso() { if (U) U.ren.domElement.style.display = 'none'; }
  function evidenziaUniverso() { /* il passaggio scelto: nessun cambio di geometria; il pianeta scelto e' gia' in evidenza */ }
  function sceltaPianeta(e) {
    if (!U) return; var T = U.T, r = U.ren.domElement.getBoundingClientRect(), mouse = new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), rc = new T.Raycaster(); rc.setFromCamera(mouse, U.cam);
    var hit = rc.intersectObjects(U.gruppi.map(function (g) { return g.pl; }))[0]; if (!hit) return; var n = hit.object.userData.nome, pi = D.getElementById('bsiOI-pia'); if (pi && PIANETI.some(function (p) { return p[0] === n; })) { pi.value = n; ST.pianeta = n; calcolaUniverso(); dici(ST.passi[0]); }
  }

  globale.BSIOloInterattivo = { apri: apri, chiudi: chiudi, modo: modo, SPETTRI: MOLECOLE, PIANETI: PIANETI, spettro: spettro, pianeta: pianeta, leggiTraccia: leggiTraccia, massa: massa, insaturazione: insaturazione,
    imposta: function (s) { var q = D.getElementById('bsiOI-traccia') || D.getElementById('bsiOI-q') || D.getElementById('bsiOI-orb'); if (q) { q.value = s; (q.oninput || function () {})(); var v = D.getElementById('bsiOI-vai'); if (v && q.id === 'bsiOI-q') v.click(); } },
    voceAutomatica: function (si) { ST.autoVoce = si !== false; if (!ST.autoVoce) { clearTimeout(tVoce); if (ST.voce) fermaVoce(); } },
    scegli: scegli, stato: function () { return { aperto: ST.aperto, modo: ST.modo, tipo: ST.tipo, chi: ST.chi, MHz: ST.MHz, passi: (ST.passi || []).map(function (p) { return p.tit; }), sel: ST.sel, dati: ST.dati }; } };
})(typeof window !== 'undefined' ? window : globalThis);
