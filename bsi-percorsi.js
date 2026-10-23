/* ═══════════════════════════════════════════════════════════════════════════
   bsi-percorsi.js — 🧭 dalle superiori al dottorato
   BioSpecInfo · © Samuele Pio Provenzano

   Una mappa di studio per chimica, fisica e matematica su quattro livelli
   (scuola superiore, laurea triennale, laurea magistrale, dottorato): per
   ogni livello che cosa si deve saper fare e quali sezioni dell'app servono,
   con un pulsante che ci porta. I nomi dei pulsanti si leggono dalla barra,
   cosi' seguono la lingua scelta e non possono divergere dalla barra.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var LIV = [['🏫 Scuola superiore', '🏫 High school'], ['🎓 Laurea triennale', '🎓 Bachelor’s degree'], ['🔬 Laurea magistrale', '🔬 Master’s degree'], ['🧪 Dottorato di ricerca', '🧪 PhD']];
  var MAPPA = {
    chimica: [
      { cosa: ['Mole, formule e stechiometria, bilanciamento, nomenclatura, tavola periodica, legami e forma delle molecole, gas, soluzioni, pH di base, ossidoriduzioni.', 'The mole, formulas and stoichiometry, balancing, nomenclature, periodic table, bonding and molecular shape, gases, solutions, basic pH, redox.'], sez: ['spt', 'ssteich', 'srxnbal', 'scalc', 'svsepr', 'schiesame', 'smol'] },
      { cosa: ['Equilibri, acidi e basi, solubilità, elettrochimica, cinetica e termodinamica; chimica analitica (titolazioni, spettrofotometria); organica (meccanismi, sintesi, spettroscopia IR/NMR/MS); biochimica.', 'Equilibria, acids and bases, solubility, electrochemistry, kinetics and thermodynamics; analytical chemistry (titrations, spectrophotometry); organic (mechanisms, synthesis, IR/NMR/MS spectroscopy); biochemistry.'], sez: ['schiesame', 'stitr', 'spka', 'snernst', 'skin', 'ssyn', 'sanimmech', 'snmrpred', 'sspec', 'sglyc', 'staratura'] },
      { cosa: ['Chimica fisica avanzata (spettroscopia molecolare, termodinamica statistica, cinetica elettrodica, superfici, fotochimica), chimica inorganica (campo cristallino, simmetria), cristallografia, elucidazione strutturale.', 'Advanced physical chemistry (molecular spectroscopy, statistical thermodynamics, electrode kinetics, surfaces, photochemistry), inorganic chemistry (crystal field, symmetry), crystallography, structure elucidation.'], sez: ['srotovib', 'stermostat', 'selettrodi', 'sfotosup', 'scft', 'ssimm', 'scristalli', 'selucid', 'snoe'] },
      { cosa: ['Chimica quantistica ab initio, dinamica molecolare, teoria di Marcus ed effetti isotopici, chemioinformatica e analisi dei dati, lettura critica della letteratura.', 'Ab initio quantum chemistry, molecular dynamics, Marcus theory and isotope effects, cheminformatics and data analysis, critical reading of the literature.'], sez: ['shf', 'sschrod', 'sdinmol', 'schiesame', 'scheminfo', 'sdatasci', 'smatstat'] }
    ],
    fisica: [
      { cosa: ['Cinematica, dinamica, energia, quantità di moto, gravitazione, fluidi, calore e gas, onde, elettricità e magnetismo di base, ottica geometrica.', 'Kinematics, dynamics, energy, momentum, gravitation, fluids, heat and gases, waves, basic electricity and magnetism, geometrical optics.'], sez: ['sfisesame', 'sconst', 'scfgraf'] },
      { cosa: ['Fisica Generale I e II: meccanica del punto e del corpo rigido, termodinamica, elettromagnetismo, circuiti, induzione, ottica fisica.', 'General Physics I and II: point and rigid-body mechanics, thermodynamics, electromagnetism, circuits, induction, physical optics.'], sez: ['sfisesame', 'sqm', 'smatode'] },
      { cosa: ['Meccanica quantistica (equazione di Schrödinger, oscillatore, atomo di idrogeno), fisica moderna, meccanica statistica, astrofisica, fisica nucleare.', 'Quantum mechanics (Schrödinger equation, oscillator, hydrogen atom), modern physics, statistical mechanics, astrophysics, nuclear physics.'], sez: ['sschrod', 'sfisesame', 'stermostat', 'snucleare', 'srotovib'] },
      { cosa: ['Metodi approssimati (variazionale, perturbazioni), metodi ab initio, simulazioni molecolari, fisica delle radiazioni.', 'Approximation methods (variational, perturbation theory), ab initio methods, molecular simulation, radiation physics.'], sez: ['sfisesame', 'shf', 'sdinmol', 'snucleare'] }
    ],
    matematica: [
      { cosa: ['Algebra, equazioni e disequazioni, potenze e logaritmi, funzioni e grafici, trigonometria, primi limiti e derivate, probabilità.', 'Algebra, equations and inequalities, powers and logarithms, functions and graphs, trigonometry, first limits and derivatives, probability.'], sez: ['smatbasi', 'smatfunz', 'sdistrib'] },
      { cosa: ['Istituzioni di Matematiche I e II: limiti, derivate, integrali, serie, funzioni di più variabili, integrali doppi, equazioni differenziali; algebra lineare; statistica.', 'Calculus I and II: limits, derivatives, integrals, series, functions of several variables, double integrals, differential equations; linear algebra; statistics.'], sez: ['smatesame', 'smatcalc', 'smatlin', 'smatode', 'smatmulti', 'smatstat'] },
      { cosa: ['Autovalori e diagonalizzazione, sistemi di EDO, analisi di Fourier e trasformata di Laplace, integrali tripli, matematica per la chimica (FFT, Hückel, minimi quadrati).', 'Eigenvalues and diagonalisation, ODE systems, Fourier analysis and Laplace transform, triple integrals, mathematics for chemistry (FFT, Hückel, least squares).'], sez: ['smatesame', 'smatlin', 'smatcompl', 'smatchim'] },
      { cosa: ['Analisi complessa (residui), equazioni alle derivate parziali, metodi numerici, statistica avanzata e propagazione delle incertezze.', 'Complex analysis (residues), partial differential equations, numerical methods, advanced statistics and uncertainty propagation.'], sez: ['smatesame', 'smatode', 'smatstat', 'smatmulti'] }
    ]
  };
  function nomeSezione(id) {
    var b = document.querySelector('.nav-btn[data-s="' + id + '"]');
    return b ? b.textContent.trim() : id;
  }
  function apri(id) {
    var b = document.querySelector('.nav-btn[data-s="' + id + '"]');
    if (b) {
      var pan = b.closest('.nav-group-panel');
      if (pan && typeof globale.switchNavGroup === 'function') { var idx = [].indexOf.call(document.querySelectorAll('.nav-group-panel'), pan); if (idx >= 0) globale.switchNavGroup(idx); }
      b.click();
    } else if (typeof globale.goSection === 'function') globale.goSection(id);
  }
  function scheda(ambito) {
    return function (div) {
      MAPPA[ambito].forEach(function (L, i) {
        var p = F.el('div', { 'class': 'bsiFX-pannello', style: 'margin:8px 0' });
        p.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1.05rem', testo: F.tt(LIV[i]) }));
        p.appendChild(F.el('div', { 'class': 'bsiFX-nota', style: 'font-size:.88rem', testo: F.tt(L.cosa) }));
        var r = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' });
        L.sez.forEach(function (id) { if (!document.getElementById(id)) return; r.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: nomeSezione(id) + ' →', onclick: function () { apri(id); } })); });
        p.appendChild(r); div.appendChild(p);
      });
      div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Nelle sezioni d’esame (🎓) i livelli sono segnati nel risolutore: [I]/[II] triennale, [A] magistrale, [D]/[AF]/[N]/[Q] magistrale e dottorato; in chimica B, I, A, A+.', 'In the exam sections (🎓) levels are marked in the solver: [I]/[II] bachelor’s, [A] master’s, [D]/[AF]/[N]/[Q] master’s and PhD; in chemistry B, I, A, A+.') }));
    };
  }
  F.calcolo.percorsi = { MAPPA: MAPPA };
  F.sezione('spercorsi', {
    titolo: ['🧭 Dalle superiori al dottorato', '🧭 From high school to PhD'],
    sotto: ['Chimica, fisica e matematica su quattro livelli: che cosa si deve saper fare a ogni livello e quali strumenti dell’app servono, con un clic per aprirli.',
            'Chemistry, physics and mathematics on four levels: what you need to be able to do at each level and which tools in the app help, one click away.'],
    schede: [
      { nome: ['⚗️ Chimica', '⚗️ Chemistry'], costruisci: scheda('chimica') },
      { nome: ['⚛️ Fisica', '⚛️ Physics'], costruisci: scheda('fisica') },
      { nome: ['📐 Matematica', '📐 Mathematics'], costruisci: scheda('matematica') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
