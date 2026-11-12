/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chim-hammett.js — σ L'equazione di Hammett: come un sostituente cambia
   la reattività di un anello aromatico
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v252)
   Richiesta dell'autore: potenziare al massimo la chimica organica, con dati e
   sezioni. Mancava lo strumento quantitativo più usato della chimica organica
   fisica: log(k/k₀) = ρ·σ. Un numero per il sostituente (σ, quanto attira o
   spinge elettroni, dalla posizione meta o para) e uno per la reazione (ρ,
   quanto la reazione ne risente, e con che segno).

   I DATI
   · σm e σp di 24 sostituenti, σp⁺ e σp⁻ dove servono: i valori della
     rassegna di Hansch, Leo e Taft, Chem. Rev. 91 (1991) 165.
   · Cinque reazioni con il loro ρ e il valore del composto non sostituito:
     acidi benzoici (ρ = 1 per definizione, pKa 4,20), fenoli (σ⁻, ρ 2,23,
     pKa 9,99), ioni anilinio (σ⁻, ρ 2,89, pKa 4,60), idrolisi alcalina dei
     benzoati di etile (ρ 2,51), solvolisi dei cloruri di cumile di Brown e
     Okamoto (σ⁺, ρ −4,54). I ρ variano di qualche centesimo da una fonte
     all'altra (solvente, temperatura): sono quelli di Carey–Sundberg e
     Anslyn–Dougherty.

   CHE COSA SI PUO' FARE
   · leggere e confrontare le costanti σ, con una barra che dice chi attira e
     chi dona elettroni;
   · prevedere k/k₀ o il pKa di un derivato sostituito, e vedere dove cade
     sulla retta di Hammett;
   · incollare i propri dati (pKa, costanti di velocità o log k/k₀) e ricavare
     ρ con la retta dei minimi quadrati, R² e lo scarto di ogni punto.

   ONESTA'
   · Hammett vale per sostituenti in meta e para: in orto entrano effetti
     sterici che σ non descrive, e qui l'orto non c'è.
   · Quando la reazione sviluppa una carica in coniugazione diretta con il
     sostituente servono σ⁺ o σ⁻; se per un sostituente non sono tabulati si
     usa σp e lo si dice.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function f2(x) { return (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2); }

  /* ═══ 1. LE COSTANTI ═══════════════════════════════════════════════════ */
  /* [simbolo, nome, σm, σp, σp⁺, σp⁻] — Hansch, Leo, Taft 1991; null = non tabulato */
  var SOSTITUENTI = [
    ['NMe2', 'dimetilammino', -0.16, -0.83, -1.70, null],
    ['NH2', 'ammino', -0.16, -0.66, -1.30, null],
    ['OH', 'ossidrile', 0.12, -0.37, -0.92, null],
    ['OMe', 'metossi', 0.12, -0.27, -0.78, null],
    ['tBu', 'terz-butile', -0.10, -0.20, -0.26, null],
    ['Me', 'metile', -0.07, -0.17, -0.31, null],
    ['Et', 'etile', -0.07, -0.15, -0.30, null],
    ['Ph', 'fenile', 0.06, -0.01, -0.18, null],
    ['NHAc', 'acetammido', 0.21, 0.00, -0.60, null],
    ['SMe', 'metiltio', 0.15, 0.00, -0.60, null],
    ['H', 'idrogeno', 0.00, 0.00, 0.00, 0.00],
    ['F', 'fluoro', 0.34, 0.06, -0.07, null],
    ['I', 'iodio', 0.35, 0.18, 0.14, null],
    ['Cl', 'cloro', 0.37, 0.23, 0.11, null],
    ['Br', 'bromo', 0.39, 0.23, 0.15, null],
    ['OCF3', 'trifluorometossi', 0.38, 0.35, null, null],
    ['CHO', 'formile', 0.35, 0.42, null, 1.03],
    ['CO2Me', 'metossicarbonile', 0.37, 0.45, null, 0.75],
    ['COOH', 'carbossile', 0.37, 0.45, null, 0.77],
    ['COMe', 'acetile', 0.38, 0.50, null, 0.84],
    ['CF3', 'trifluorometile', 0.43, 0.54, 0.61, 0.65],
    ['CN', 'ciano', 0.56, 0.66, 0.66, 1.00],
    ['SO2Me', 'metilsolfonile', 0.60, 0.72, null, 1.13],
    ['NO2', 'nitro', 0.71, 0.78, 0.79, 1.27]
  ];
  var S = {}; SOSTITUENTI.forEach(function (r) { S[r[0].toLowerCase()] = { sim: r[0], nome: r[1], m: r[2], p: r[3], piu: r[4], meno: r[5] }; });
  /* nomi con cui si scrivono nei dati: NO2, Me, CH3, OMe, OCH3, … */
  var ALIAS = { ch3: 'me', och3: 'ome', c2h5: 'et', c6h5: 'ph', n: 'nme2', 'n(ch3)2': 'nme2', nme2: 'nme2', cooch3: 'co2me', coch3: 'come', so2ch3: 'so2me', sch3: 'sme', 'c(ch3)3': 'tbu', 't-bu': 'tbu', nhcoch3: 'nhac', ac: 'come' };
  function trovaSost(x) { var k = String(x || '').trim().toLowerCase().replace(/[₀-₉]/g, function (c) { return String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)); }); k = ALIAS[k] || k; return S[k] || null; }

  /** σ di un sostituente in una posizione ('m' o 'p') per un tipo di reazione ('σ', 'σ+', 'σ-'). */
  function sigma(sost, pos, tipo) {
    var x = typeof sost === 'string' ? trovaSost(sost) : sost; if (!x) return null;
    if (pos === 'm') return { valore: x.m, usato: 'σm', ripiego: false };          /* in meta σ⁺ e σ⁻ coincidono con σm (Brown–Okamoto) */
    if (tipo === 'σ+' && x.piu != null) return { valore: x.piu, usato: 'σp⁺', ripiego: false };
    if (tipo === 'σ-' && x.meno != null) return { valore: x.meno, usato: 'σp⁻', ripiego: false };
    return { valore: x.p, usato: 'σp', ripiego: tipo !== 'σ' };
  }

  /* ═══ 2. LE REAZIONI ═══════════════════════════════════════════════════ */
  var REAZIONI = {
    benzoici: { nome: ['Ionizzazione degli acidi benzoici (acqua, 25 °C)', 'Ionisation of benzoic acids (water, 25 °C)'], rho: 1.00, tipo: 'σ', pK0: 4.20, grandezza: 'pKa' },
    fenoli: { nome: ['Ionizzazione dei fenoli (acqua, 25 °C)', 'Ionisation of phenols (water, 25 °C)'], rho: 2.23, tipo: 'σ-', pK0: 9.99, grandezza: 'pKa' },
    anilinio: { nome: ['Ionizzazione degli ioni anilinio (acqua, 25 °C)', 'Ionisation of anilinium ions (water, 25 °C)'], rho: 2.89, tipo: 'σ-', pK0: 4.60, grandezza: 'pKa' },
    esteri: { nome: ['Idrolisi alcalina dei benzoati di etile (etanolo 85 %, 25 °C)', 'Alkaline hydrolysis of ethyl benzoates (85 % ethanol, 25 °C)'], rho: 2.51, tipo: 'σ', grandezza: 'k' },
    cumile: { nome: ['Solvolisi dei cloruri di cumile (acetone 90 %, 25 °C) — Brown e Okamoto', 'Solvolysis of cumyl chlorides (90 % acetone, 25 °C) — Brown and Okamoto'], rho: -4.54, tipo: 'σ+', grandezza: 'k' }
  };
  /** log(k/k₀) per una reazione e un sostituente. Per gli acidi, anche il pKa previsto. */
  function prevedi(reaz, sost, pos) {
    var R = REAZIONI[reaz], s = sigma(sost, pos, R.tipo); if (!s) return null;
    var lg = R.rho * s.valore, out = { sigma: s.valore, usato: s.usato, ripiego: s.ripiego, logRel: lg, rel: Math.pow(10, lg), rho: R.rho };
    if (R.grandezza === 'pKa') out.pKa = R.pK0 - lg;
    return out;
  }

  /* ═══ 3. RICAVARE ρ DAI DATI ════════════════════════════════════════════ */
  /** Retta dei minimi quadrati y = ρx + q. Restituisce ρ, q, R², scarti. */
  function adatta(punti) {
    var n = punti.length; if (n < 2) return null;
    var sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
    punti.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; syy += p.y * p.y; });
    var d = n * sxx - sx * sx; if (Math.abs(d) < 1e-12) return null;
    var rho = (n * sxy - sx * sy) / d, q = (sy - rho * sx) / n, my = sy / n, sst = 0, sse = 0;
    punti.forEach(function (p) { var e = p.y - (rho * p.x + q); sse += e * e; sst += (p.y - my) * (p.y - my); p.scarto = e; });
    var se = n > 2 ? Math.sqrt(sse / (n - 2) / (sxx - sx * sx / n)) : null;
    return { rho: rho, q: q, r2: sst > 0 ? 1 - sse / sst : 1, n: n, erroreRho: se };
  }
  /** Legge righe «p-NO2 3.44», «m-Cl 3,83», «H 4.20». modo: 'pKa' | 'k' | 'log'. tipo di σ: 'σ' | 'σ+' | 'σ-'. */
  function leggiDati(testo, modo, tipo) {
    var righe = String(testo || '').split(/\n+/), grezzi = [], errori = [];
    righe.forEach(function (r, i) {
      var z = r.trim(); if (!z || /^#/.test(z)) return;
      var m = /^(?:([mp])\s*[-–]\s*)?([A-Za-z0-9()₀-₉-]+)\s+([-+−]?\d+(?:[.,]\d+)?(?:e[-+]?\d+)?)/i.exec(z.replace('−', '-'));
      if (!m) { errori.push('riga ' + (i + 1) + ': non capisco «' + z + '»'); return; }
      var x = trovaSost(m[2]); if (!x) { errori.push('riga ' + (i + 1) + ': sostituente «' + m[2] + '» non in tabella'); return; }
      var pos = (m[1] || 'p').toLowerCase(); if (x.sim === 'H') pos = 'p';
      grezzi.push({ sost: x.sim, pos: pos, v: +m[3].replace(',', '.'), etich: (x.sim === 'H' ? 'H' : pos + '-' + x.sim) });
    });
    var rif = grezzi.filter(function (g) { return g.sost === 'H'; })[0];
    if ((modo === 'pKa' || modo === 'k') && !rif) return { punti: [], errori: errori.concat(['manca la riga del composto non sostituito («H …»): serve come riferimento']) };
    var punti = grezzi.map(function (g) {
      var s = sigma(g.sost, g.pos, tipo), y = modo === 'pKa' ? rif.v - g.v : modo === 'k' ? Math.log10(g.v / rif.v) : g.v;
      return { x: s.valore, y: y, etich: g.etich, usato: s.usato };
    }).filter(function (p) { return isFinite(p.y); });
    return { punti: punti, errori: errori };
  }
  var ESEMPIO = '# pKa di acidi benzoici in acqua a 25 °C\nH 4.20\np-NO2 3.44\nm-NO2 3.45\np-CN 3.55\nm-Cl 3.83\np-Cl 3.98\nm-OMe 4.09\np-Me 4.37\np-OMe 4.47\nm-Me 4.27';

  /* ═══ 4. LE SCHEDE ═════════════════════════════════════════════════════ */
  function schedaCostanti(div) {
    var g = griglia(div), tipo = 'p';
    F.scelta(g.pan, ['Costante', 'Constant'], [['m', 'σ meta'], ['p', 'σ para'], ['piu', 'σ⁺ para (carica positiva in coniugazione)'], ['meno', 'σ⁻ para (carica negativa in coniugazione)']], tipo, function (v) { tipo = v; disegna(); });
    var info = nota(g.pan);
    info.innerHTML = t('σ > 0: il sostituente <b>attira</b> elettroni (barra a destra). σ < 0: li <b>dona</b> (barra a sinistra). In meta conta quasi solo l’effetto induttivo; in para anche la risonanza, per questo OMe è debolmente attrattore in meta (+0,12) e donatore in para (−0,27).', 'σ > 0: the substituent <b>withdraws</b> electrons (bar to the right). σ < 0: it <b>donates</b> them (bar to the left). In meta almost only the inductive effect counts; in para resonance too, which is why OMe is weakly withdrawing in meta (+0.12) and donating in para (−0.27).') +
      '<br><small>Hansch, Leo, Taft, <i>Chem. Rev.</i> 91 (1991) 165.</small>';
    var box = F.el('div', { style: 'overflow-x:auto' }); g.dx.appendChild(box);
    function disegna() {
      var righe = SOSTITUENTI.map(function (r) { var x = S[r[0].toLowerCase()]; return { x: x, v: x[tipo] }; }).filter(function (r) { return r.v != null; }).sort(function (a, b) { return a.v - b.v; });
      var max = Math.max.apply(null, righe.map(function (r) { return Math.abs(r.v); })) || 1;
      var h = '<table class="bsiFX-tab bsiHM-tab"><tr><th>' + t('Sostituente', 'Substituent') + '</th><th>σm</th><th>σp</th><th>σp⁺</th><th>σp⁻</th><th style="min-width:130px">' + t('donatore ← → attrattore', 'donor ← → withdrawing') + '</th></tr>';
      righe.forEach(function (r) {
        var w = Math.abs(r.v) / max * 50, sx = r.v < 0;
        h += '<tr><td><b>' + r.x.sim + '</b> <small>' + r.x.nome + '</small></td>' + ['m', 'p', 'piu', 'meno'].map(function (k) { return '<td' + (k === tipo ? ' style="color:#5eead4;font-weight:700"' : '') + '>' + (r.x[k] == null ? '—' : f2(r.x[k])) + '</td>'; }).join('') +
          '<td><div style="position:relative;height:12px;background:#0d1b2c;border-radius:6px"><div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:#3a5470"></div><div style="position:absolute;top:2px;bottom:2px;border-radius:4px;' + (sx ? 'right:50%;background:#ffb86b' : 'left:50%;background:#5eead4') + ';width:' + w.toFixed(1) + '%"></div></div></td></tr>';
      });
      box.innerHTML = h + '</table>';
    }
    disegna();
  }

  function schedaPrevisione(div) {
    var g = griglia(div), reaz = 'benzoici', sost = 'NO2', pos = 'p';
    F.scelta(g.pan, ['Reazione', 'Reaction'], Object.keys(REAZIONI).map(function (k) { return [k, REAZIONI[k].nome]; }), reaz, function (v) { reaz = v; disegna(); });
    F.scelta(g.pan, ['Sostituente', 'Substituent'], SOSTITUENTI.map(function (r) { return [r[0], r[0] + ' — ' + r[1]]; }), sost, function (v) { sost = v; disegna(); });
    F.scelta(g.pan, ['Posizione', 'Position'], [['p', 'para'], ['m', 'meta']], pos, function (v) { pos = v; disegna(); });
    var info = nota(g.pan), c = F.tela(g.dx, 0.62);
    function disegna() {
      var R = REAZIONI[reaz], p = prevedi(reaz, sost, pos), xs = [], ys = [], pts = [];
      SOSTITUENTI.forEach(function (r) { ['m', 'p'].forEach(function (q) { var s = sigma(r[0], q, R.tipo); pts.push({ x: s.valore, y: R.rho * s.valore, col: '#6bcfff', r: 2.5 }); }); });
      for (var x = -1.8; x <= 1.4; x += 0.05) { xs.push(x); ys.push(R.rho * x); }
      pts.push({ x: p.sigma, y: p.logRel, col: '#ffd24a', r: 6 });
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2 }], punti: pts, xl: ['σ', 'σ'], yl: ['log(k/k₀)', 'log(k/k₀)'] });
      var nomeS = (sost === 'H' ? 'H' : pos + '-' + sost);
      info.innerHTML = '<div class="bsiFX-eq">log(k/k₀) = ρ·σ</div>' + t(R.nome[0], R.nome[1]) + '<br>ρ = <b class="bsiFX-num">' + f2(R.rho) + '</b>, ' + p.usato + '(' + nomeS + ') = <b class="bsiFX-num">' + f2(p.sigma) + '</b>' + (p.ripiego ? ' <small>(' + t('σ⁺/σ⁻ non tabulato: uso σp', 'σ⁺/σ⁻ not tabulated: using σp') + ')</small>' : '') +
        '<br>log(k/k₀) = <b class="bsiFX-num">' + f2(p.logRel) + '</b> → ' + (R.grandezza === 'pKa' ? 'K/K₀' : 'k/k₀') + ' = <b class="bsiFX-num">' + (p.rel >= 100 || p.rel < 0.01 ? p.rel.toExponential(2) : p.rel.toFixed(p.rel < 1 ? 3 : 2)) + '</b>' +
        (p.pKa != null ? '<br>pKa ' + t('previsto', 'predicted') + ' = ' + R.pK0.toFixed(2) + ' − ' + p.logRel.toFixed(2) + ' = <b class="bsiFX-num">' + p.pKa.toFixed(2) + '</b>' : '') +
        '<br><small>' + (R.rho > 0 ? t('ρ > 0: nello stato di transizione (o nel prodotto) si accumula carica negativa, e chi attira elettroni accelera.', 'ρ > 0: negative charge builds up in the transition state (or product), and withdrawing groups speed it up.') : t('ρ < 0: si forma carica positiva (qui un carbocatione benzilico), e chi dona elettroni accelera: per questo serve σ⁺.', 'ρ < 0: positive charge forms (here a benzylic carbocation), and donors speed it up: hence σ⁺.')) + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  function schedaRho(div) {
    var g = griglia(div), modo = 'pKa', tipo = 'σ';
    F.scelta(g.pan, ['I tuoi dati sono', 'Your data are'], [['pKa', 'pKa (serve la riga H)'], ['k', 'costanti di velocità o di equilibrio (serve la riga H)'], ['log', 'log(k/k₀) già calcolati']], modo, function (v) { modo = v; });
    F.scelta(g.pan, ['Costante da usare', 'Constant to use'], [['σ', 'σ (Hammett)'], ['σ+', 'σ⁺ (carica positiva coniugata)'], ['σ-', 'σ⁻ (carica negativa coniugata)']], tipo, function (v) { tipo = v; });
    var ta = F.el('textarea', { rows: 9, 'aria-label': t('Dati: una riga per sostituente, per esempio p-NO2 3.44', 'Data: one line per substituent, e.g. p-NO2 3.44'), style: 'width:100%;box-sizing:border-box;font:13px/1.4 ui-monospace,monospace;background:#071321;color:#e5eef7;border:1px solid #234;border-radius:8px;padding:8px' });
    ta.value = ESEMPIO; g.pan.appendChild(ta);
    F.bottone(g.pan, ['Ricava ρ', 'Fit ρ'], disegna);
    var info = nota(g.pan), c = F.tela(g.dx, 0.62), tab = F.el('div', { style: 'overflow-x:auto' }); g.dx.appendChild(tab);
    function disegna() {
      var L = leggiDati(ta.value, modo, tipo), A = adatta(L.punti);
      if (!A) { info.innerHTML = '<b>' + t('Servono almeno due punti con σ diversi.', 'At least two points with different σ are needed.') + '</b>' + (L.errori.length ? '<br>' + L.errori.join('<br>') : ''); tab.innerHTML = ''; return; }
      var xs = [], ys = [], mn = Math.min.apply(null, L.punti.map(function (p) { return p.x; })) - 0.1, mx = Math.max.apply(null, L.punti.map(function (p) { return p.x; })) + 0.1;
      for (var x = mn; x <= mx + 1e-9; x += (mx - mn) / 40) { xs.push(x); ys.push(A.rho * x + A.q); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2 }], punti: L.punti.map(function (p) { return { x: p.x, y: p.y, col: Math.abs(p.scarto) > 0.15 ? '#ff8fab' : '#ffd24a', r: 5 }; }), xl: [tipo, tipo], yl: ['log(k/k₀)', 'log(k/k₀)'] });
      info.innerHTML = 'ρ = <b class="bsiFX-num">' + A.rho.toFixed(3) + '</b>' + (A.erroreRho != null ? ' ± ' + A.erroreRho.toFixed(3) : '') + ', ' + t('intercetta', 'intercept') + ' = ' + A.q.toFixed(3) + ', R² = <b class="bsiFX-num">' + A.r2.toFixed(4) + '</b> (n = ' + A.n + ')' +
        (L.errori.length ? '<br><small style="color:#ffb86b">' + L.errori.join('<br>') + '</small>' : '') +
        '<br><small>' + t('In rosa i punti lontani più di 0,15 dalla retta: un sostituente in coniugazione diretta (prova σ⁺ o σ⁻), oppure un cambio di meccanismo.', 'In pink the points more than 0.15 from the line: a substituent in direct conjugation (try σ⁺ or σ⁻), or a change of mechanism.') + '</small>';
      tab.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('Sostituente', 'Substituent') + '</th><th>σ</th><th>log(k/k₀)</th><th>' + t('scarto', 'residual') + '</th></tr>' + L.punti.map(function (p) { return '<tr><td>' + p.etich + '</td><td>' + f2(p.x) + ' <small>' + p.usato + '</small></td><td>' + p.y.toFixed(3) + '</td><td>' + (p.scarto >= 0 ? '+' : '') + p.scarto.toFixed(3) + '</td></tr>'; }).join('') + '</table>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.calcolo.hammett = { SOSTITUENTI: SOSTITUENTI, REAZIONI: REAZIONI, trovaSost: trovaSost, sigma: sigma, prevedi: prevedi, adatta: adatta, leggiDati: leggiDati, ESEMPIO: ESEMPIO };
  F.sezione('shammett', {
    titolo: ['σ Hammett: i sostituenti e la reattività', 'σ Hammett: substituents and reactivity'],
    sotto: ['log(k/k₀) = ρ·σ: quanto un sostituente in meta o para accelera o rallenta una reazione, o sposta un pKa. Costanti di letteratura, previsioni e la retta ricavata dai tuoi dati.',
            'log(k/k₀) = ρ·σ: how much a meta or para substituent speeds up or slows down a reaction, or shifts a pKa. Literature constants, predictions and the line fitted to your data.'],
    schede: [
      { nome: ['Le costanti σ', 'The σ constants'], costruisci: schedaCostanti },
      { nome: ['Previsione', 'Prediction'], costruisci: schedaPrevisione },
      { nome: ['Ricava ρ dai tuoi dati', 'Fit ρ to your data'], costruisci: schedaRho }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
