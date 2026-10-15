/* ═══════════════════════════════════════════════════════════════════════════
   bsi-atomic-livelli.js — i venti livelli di ATOMIC PROTOCOL
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA C'E' QUI

   Solo DATI e funzioni pure: le cinque ali dell'istituto, i venti livelli,
   i cinque guardiani con le loro fasi, le ricette di sintesi e gli enigmi.
   Niente grafica e niente stato di partita. Separarli serve a una cosa che
   vale piu' della pulizia: il banco puo' generare tutti e venti i livelli e
   verificare che da ognuno si arrivi all'uscita, che ogni guardiano si possa
   abbattere con quello che il gioco ti da', e che ogni equazione sia
   bilanciata davvero — senza aprire un solo fotogramma.

   COME E' FATTO UN LIVELLO

   Le stanze stanno su una griglia di colonne e righe di larghezza variabile.
   Due stanze in celle vicine CONDIVIDONO un muro, e la porta e' al centro di
   quel muro: per costruzione le porte combaciano sempre, e non esiste un
   corridoio che finisce nel vuoto. Il percorso principale e' una passeggiata
   casuale ma ripetibile (il seme e' il numero del livello); le stanze
   laterali tengono elementi e appunti, e l'ultima porta e' chiusa da un
   enigma.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function L() { return globale.BSILingue; }
  function ling() { try { return (L() && L().corrente()) ? L().corrente() : 'it'; } catch (e) { return 'it'; } }
  function t(it, en) { return ling() === 'en' ? en : it; }

  function Caso(seme) {
    var s = (seme >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  var LIVELLI = 20;

  /* ═════════════════════════════════════════════════════════════════════
     I POTERI DEGLI ELEMENTI
     Il potere e il perché sono progetto di gioco; i numeri dell'elemento
     arrivano da ELEMENTS, la tavola periodica dell'applicazione.
     ═════════════════════════════════════════════════════════════════════ */
  function POTERI() {
    return {
      H:  { colore: 0x8fdcff, potere: t('Spinta a idrogeno', 'Hydrogen thrust'),
            descr: t('Il più leggero che esista. Con il cloro fa l’acido cloridrico, con l’ossigeno l’acqua ossigenata.',
                     'The lightest there is. With chlorine it makes hydrochloric acid, with oxygen hydrogen peroxide.') },
      Cl: { colore: 0x9cf36b, potere: t('Disinfezione', 'Disinfection'),
            descr: t('Alogeno, forte ossidante. È metà dell’acido cloridrico e metà del sale da cucina.',
                     'A halogen, a strong oxidiser. Half of hydrochloric acid and half of table salt.') },
      Na: { colore: 0xffd24a, potere: t('Reazione violenta', 'Violent reaction'),
            descr: t('Metallo alcalino: con l’acqua libera idrogeno e calore. Fa saltare le valvole.',
                     'Alkali metal: with water it releases hydrogen and heat. It blows valves.') },
      O:  { colore: 0xff7a8a, potere: t('Ossidazione', 'Oxidation'),
            descr: t('Il comburente. Attacca le catene organiche e alimenta ogni combustione.',
                     'The oxidant. It attacks organic chains and feeds every combustion.') },
      C:  { colore: 0x9aa4b0, potere: t('Quattro legami', 'Four bonds'),
            descr: t('La base di tutta la chimica organica: fa quattro legami e costruisce catene.',
                     'The basis of all organic chemistry: it makes four bonds and builds chains.') },
      N:  { colore: 0x7aa8ff, potere: t('Triplo legame', 'Triple bond'),
            descr: t('Nel gas N₂ è legato tre volte: inerte finché non lo si costringe. Con l’idrogeno fa l’ammoniaca.',
                     'In N₂ gas it is triple-bonded: inert until forced. With hydrogen it makes ammonia.') },
      S:  { colore: 0xffe36b, potere: t('Zolfo', 'Sulfur'),
            descr: t('Con ossigeno e acqua dà l’acido solforico, il disidratante più forte del laboratorio.',
                     'With oxygen and water it gives sulfuric acid, the strongest dehydrating agent in the lab.') },
      F:  { colore: 0xd9ff8a, potere: t('Il più elettronegativo', 'The most electronegative'),
            descr: t('Strappa elettroni a tutto: nessun elemento lo batte in elettronegatività.',
                     'It strips electrons from everything: no element beats it in electronegativity.') },
      Fe: { colore: 0xb8c0cc, potere: t('Massa ferrosa', 'Ferrous mass'),
            descr: t('Pesante e magnetico. Si ossida all’aria umida: la ruggine è il suo ossido.',
                     'Heavy and magnetic. It oxidises in damp air: rust is its oxide.') },
      Mg: { colore: 0xf2f2f2, potere: t('Fiamma bianca', 'White flame'),
            descr: t('Brucia con una luce accecante: riduce gli ossidi di altri metalli.',
                     'It burns with a blinding light: it reduces other metals’ oxides.') },
      P:  { colore: 0xff9a5a, potere: t('Scheletro del DNA', 'DNA backbone'),
            descr: t('Il fosfato tiene insieme i nucleotidi: è la spina dorsale di DNA e RNA.',
                     'Phosphate holds nucleotides together: it is the backbone of DNA and RNA.') },
      K:  { colore: 0xd6a2ff, potere: t('Potenziale di membrana', 'Membrane potential'),
            descr: t('Metallo alcalino come il sodio, più reattivo. Nelle cellule regola il potenziale.',
                     'An alkali metal like sodium, more reactive. In cells it sets the potential.') },
      Ca: { colore: 0xeaeaea, potere: t('Struttura', 'Structure'),
            descr: t('Alcalino-terroso: ossa, gusci, calcare. Fa precipitare i fosfati.',
                     'Alkaline earth: bones, shells, limestone. It precipitates phosphates.') },
      Ar: { colore: 0xb48cff, potere: t('Atmosfera inerte', 'Inert atmosphere'),
            descr: t('Gas nobile: non reagisce con niente. Soffoca le combustioni togliendo l’ossigeno.',
                     'A noble gas: it reacts with nothing. It smothers combustion by displacing oxygen.') },
      Au: { colore: 0xffcc33, potere: t('Inattaccabile', 'Untouchable'),
            descr: t('Non si ossida: gli acidi comuni non lo toccano.',
                     'It does not oxidise: common acids do not touch it.') },
      Pb: { colore: 0x8a929c, potere: t('Schermatura', 'Shielding'),
            descr: t('Denso: ferma le radiazioni. Tossico, da maneggiare con i guanti.',
                     'Dense: it stops radiation. Toxic, to be handled with gloves.') }
    };
  }

  /* ═════════════════════════════════════════════════════════════════════
     LE RICETTE

     Ogni equazione e' bilanciata — il banco conta gli atomi a sinistra e a
     destra — e quando un'equazione e' formale (una formazione dagli
     elementi che in laboratorio non si fa cosi') lo dice.
     I reagenti possono essere ELEMENTI o COMPOSTI gia' sintetizzati: il
     bicarbonato si fa dalla soda e dall'anidride carbonica.
     ═════════════════════════════════════════════════════════════════════ */
  function RICETTE() {
    return [
      { id: 'NaCl', formula: 'NaCl', nome: t('Cloruro di sodio', 'Sodium chloride'),
        classe: t('sale', 'salt'), reagenti: ['Na', 'Cl'],
        equazione: '2 Na + Cl₂ → 2 NaCl',
        bilancio: [[['Na', 2]], [['Cl', 2]], [['Na', 2], ['Cl', 2]]],
        usa: t('Stabile e innocuo: zavorra, tampone.', 'Stable and harmless: ballast, buffer.'),
        iniziale: true },
      { id: 'HCl', formula: 'HCl', nome: t('Acido cloridrico', 'Hydrochloric acid'),
        classe: t('acido forte', 'strong acid'), reagenti: ['H', 'Cl'],
        equazione: 'H₂ + Cl₂ → 2 HCl',
        bilancio: [[['H', 2]], [['Cl', 2]], [['H', 2], ['Cl', 2]]],
        usa: t('Scioglie gli ossidi e attacca i metalli.', 'Dissolves oxides and attacks metals.') },
      { id: 'H2O2', formula: 'H₂O₂', nome: t('Perossido di idrogeno', 'Hydrogen peroxide'),
        classe: t('ossidante', 'oxidiser'), reagenti: ['H', 'O'],
        equazione: 'H₂ + O₂ → H₂O₂',
        bilancio: [[['H', 2]], [['O', 2]], [['H', 2], ['O', 2]]],
        usa: t('Ossida e spezza le catene organiche.', 'Oxidises and breaks organic chains.') },
      { id: 'NaOH', formula: 'NaOH', nome: t('Idrossido di sodio', 'Sodium hydroxide'),
        classe: t('base forte', 'strong base'), reagenti: ['Na', 'O', 'H'],
        equazione: '2 Na + 2 H₂O → 2 NaOH + H₂',
        bilancio: [[['Na', 2]], [['H', 4], ['O', 2]], [['Na', 2], ['O', 2], ['H', 2], ['H', 2]]],
        usa: t('Neutralizza gli acidi; separa i filamenti del DNA.',
               'Neutralises acids; separates DNA strands.') },
      { id: 'H2SO4', formula: 'H₂SO₄', nome: t('Acido solforico', 'Sulfuric acid'),
        classe: t('acido disidratante', 'dehydrating acid'), reagenti: ['H', 'S', 'O'],
        equazione: '2 S + 3 O₂ + 2 H₂O → 2 H₂SO₄',
        bilancio: [[['S', 2]], [['O', 6]], [['H', 4], ['O', 2]], [['H', 4], ['S', 2], ['O', 8]]],
        usa: t('Toglie l’acqua alla materia organica e la carbonizza.',
               'Strips water from organic matter and chars it.') },
      { id: 'NH3', formula: 'NH₃', nome: t('Ammoniaca', 'Ammonia'),
        classe: t('base debole', 'weak base'), reagenti: ['N', 'H'],
        equazione: 'N₂ + 3 H₂ → 2 NH₃',
        bilancio: [[['N', 2]], [['H', 6]], [['N', 2], ['H', 6]]],
        usa: t('Base: neutralizza gli acidi senza la violenza della soda.',
               'A base: neutralises acids without the violence of lye.') },
      { id: 'CO2', formula: 'CO₂', nome: t('Anidride carbonica', 'Carbon dioxide'),
        classe: t('gas estinguente', 'extinguishing gas'), reagenti: ['C', 'O'],
        equazione: 'C + O₂ → CO₂',
        bilancio: [[['C', 1]], [['O', 2]], [['C', 1], ['O', 2]]],
        usa: t('Più pesante dell’aria: soffoca le fiamme e le reazioni radicaliche.',
               'Heavier than air: it smothers flames and radical reactions.') },
      { id: 'ASC', formula: 'C₆H₈O₆', nome: t('Acido ascorbico', 'Ascorbic acid'),
        classe: t('antiossidante', 'antioxidant'), reagenti: ['C', 'H', 'O'],
        equazione: '6 C + 4 H₂ + 3 O₂ → C₆H₈O₆ ' + t('(formazione formale)', '(formal formation)'),
        bilancio: [[['C', 6]], [['H', 8]], [['O', 6]], [['C', 6], ['H', 8], ['O', 6]]],
        usa: t('Cede un idrogeno ai radicali e chiude la catena.',
               'Donates a hydrogen to radicals and closes the chain.') },
      { id: 'NaHCO3', formula: 'NaHCO₃', nome: t('Bicarbonato di sodio', 'Sodium bicarbonate'),
        classe: t('tampone', 'buffer'), reagenti: ['NaOH', 'CO2'],
        equazione: 'NaOH + CO₂ → NaHCO₃',
        bilancio: [[['Na', 1], ['O', 1], ['H', 1]], [['C', 1], ['O', 2]],
                   [['Na', 1], ['H', 1], ['C', 1], ['O', 3]]],
        usa: t('Tampona gli acidi senza scaldare: scudo contro gli spruzzi corrosivi.',
               'Buffers acids without heating: a shield against corrosive splashes.') },
      { id: 'MgO', formula: 'MgO', nome: t('Ossido di magnesio', 'Magnesium oxide'),
        classe: t('ossido basico', 'basic oxide'), reagenti: ['Mg', 'O'],
        equazione: '2 Mg + O₂ → 2 MgO',
        bilancio: [[['Mg', 2]], [['O', 2]], [['Mg', 2], ['O', 2]]],
        usa: t('La luce bianca della combustione acceca chi la guarda.',
               'The white light of the combustion blinds whoever watches.') }
    ];
  }

  /* conta gli atomi a sinistra e a destra di una ricetta: e' l'unica prova
     onesta che un'equazione e' bilanciata */
  function bilanciata(r) {
    var lati = r.bilancio;
    var sx = {}, dx = {};
    lati.slice(0, -1).forEach(function (term) {
      term.forEach(function (a) { sx[a[0]] = (sx[a[0]] || 0) + a[1]; });
    });
    lati[lati.length - 1].forEach(function (a) { dx[a[0]] = (dx[a[0]] || 0) + a[1]; });
    var k = Object.keys(sx).concat(Object.keys(dx));
    return k.every(function (e) { return sx[e] === dx[e]; });
  }

  /* ═════════════════════════════════════════════════════════════════════
     LE STRUTTURE MOLECOLARI DEGLI ENIGMI

     Ogni molecola e' descritta come atomi con coordinate e legami — non
     come un'immagine — e una funzione sola la disegna. Cosi' una molecola
     nuova si aggiunge con tre righe di dati.
     ═════════════════════════════════════════════════════════════════════ */
  var STRUTTURE = {
    metanolo:   { atomi: [['CH₃', -40, 10], ['OH', 30, -10]], legami: [[0, 1, 1]], gruppo: 1 },
    etanolo:    { atomi: [['CH₃', -70, 14], ['CH₂', -10, -14], ['OH', 50, 14]],
                  legami: [[0, 1, 1], [1, 2, 1]], gruppo: 2 },
    propan2olo: { atomi: [['CH₃', -70, 14], ['CH', -10, -14], ['CH₃', 50, 14], ['OH', -10, -52]],
                  legami: [[0, 1, 1], [1, 2, 1], [1, 3, 1]], gruppo: 3 },
    propanone:  { atomi: [['CH₃', -70, 14], ['C', -10, -14], ['CH₃', 50, 14], ['O', -10, -54]],
                  legami: [[0, 1, 1], [1, 2, 1], [1, 3, 2]], gruppo: 3 },
    acidoAcetico: { atomi: [['CH₃', -70, 14], ['C', -10, -14], ['OH', 50, 14], ['O', -10, -54]],
                  legami: [[0, 1, 1], [1, 2, 1], [1, 3, 2]], gruppo: [1, 2, 3] },
    etanale:    { atomi: [['CH₃', -60, 14], ['CH', 0, -14], ['O', 50, 10]],
                  legami: [[0, 1, 1], [1, 2, 2]], gruppo: 2 },
    metilammina: { atomi: [['CH₃', -40, 10], ['NH₂', 30, -10]], legami: [[0, 1, 1]], gruppo: 1 },
    acetatoEtile: { atomi: [['CH₃', -110, 14], ['C', -55, -14], ['O', -55, -54], ['O', 0, 14],
                            ['CH₂', 55, -14], ['CH₃', 110, 14]],
                  legami: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1], [4, 5, 1]], gruppo: [1, 2, 3] },
    benzene:    { anello: 6, gruppo: null }
  };

  /* ═════════════════════════════════════════════════════════════════════
     GLI ENIGMI
     Tre famiglie scritte a mano — gruppi funzionali, nomi IUPAC,
     costruzione — e tre generate: bilanciamento, appaiamento delle basi,
     e le domande che vengono da tutto il sito (i 28 generatori).
     ═════════════════════════════════════════════════════════════════════ */
  function RICONOSCI() {
    return [
      { s: 'etanolo', giusta: t('ossidrile (alcol)', 'hydroxyl (alcohol)') },
      { s: 'propanone', giusta: t('carbonile (chetone)', 'carbonyl (ketone)') },
      { s: 'acidoAcetico', giusta: t('carbossile (acido)', 'carboxyl (acid)') },
      { s: 'etanale', giusta: t('carbonile (aldeide)', 'carbonyl (aldehyde)') },
      { s: 'metilammina', giusta: t('ammina', 'amine') },
      { s: 'acetatoEtile', giusta: t('estere', 'ester') }
    ];
  }
  function GRUPPI() {
    return [t('ossidrile (alcol)', 'hydroxyl (alcohol)'), t('carbonile (chetone)', 'carbonyl (ketone)'),
            t('carbossile (acido)', 'carboxyl (acid)'), t('carbonile (aldeide)', 'carbonyl (aldehyde)'),
            t('ammina', 'amine'), t('estere', 'ester')];
  }
  function NOMI() {
    return [
      { s: 'metanolo', giusta: 'metanolo', perche: t('un carbonio (met-), un ossidrile (-olo)', 'one carbon (meth-), a hydroxyl (-ol)') },
      { s: 'etanolo', giusta: 'etanolo', perche: t('due carboni (et-), un ossidrile (-olo)', 'two carbons (eth-), a hydroxyl (-ol)') },
      { s: 'propan2olo', giusta: 'propan-2-olo', perche: t('tre carboni, ossidrile sul carbonio 2', 'three carbons, hydroxyl on carbon 2') },
      { s: 'propanone', giusta: 'propanone', perche: t('tre carboni, carbonile in mezzo: un chetone (-one)', 'three carbons, central carbonyl: a ketone (-one)') },
      { s: 'acidoAcetico', giusta: t('acido etanoico', 'ethanoic acid'), perche: t('due carboni, carbossile: acido etanoico', 'two carbons, carboxyl: ethanoic acid') },
      { s: 'etanale', giusta: 'etanale', perche: t('due carboni, carbonile in fondo: un’aldeide (-ale)', 'two carbons, terminal carbonyl: an aldehyde (-al)') },
      { s: 'metilammina', giusta: t('metanammina', 'methanamine'), perche: t('un carbonio legato a NH₂', 'one carbon bound to NH₂') },
      { s: 'acetatoEtile', giusta: t('etanoato di etile', 'ethyl ethanoate'), perche: t('estere dell’acido etanoico con l’etanolo', 'ester of ethanoic acid with ethanol') }
    ];
  }
  function COSTRUZIONI() {
    return [
      { nome: 'metanolo', catena: ['C', 'O'] },
      { nome: 'etanolo', catena: ['C', 'C', 'O'] },
      { nome: 'metanammina', catena: ['C', 'N'] },
      { nome: 'etanammina', catena: ['C', 'C', 'N'] },
      { nome: 'propan-1-olo', catena: ['C', 'C', 'C', 'O'] },
      { nome: 'metanetiolo', catena: ['C', 'S'] }
    ];
  }
  function BILANCI() {
    return [
      { testo: '_ H₂ + _ O₂ → _ H₂O', coeff: [2, 1, 2] },
      { testo: '_ N₂ + _ H₂ → _ NH₃', coeff: [1, 3, 2] },
      { testo: '_ CH₄ + _ O₂ → _ CO₂ + _ H₂O', coeff: [1, 2, 1, 2] },
      { testo: '_ Fe + _ O₂ → _ Fe₂O₃', coeff: [4, 3, 2] },
      { testo: '_ Na + _ Cl₂ → _ NaCl', coeff: [2, 1, 2] },
      { testo: '_ C₃H₈ + _ O₂ → _ CO₂ + _ H₂O', coeff: [1, 5, 3, 4] },
      { testo: '_ Al + _ HCl → _ AlCl₃ + _ H₂', coeff: [2, 6, 2, 3] }
    ];
  }
  var COMPLEMENTO = { A: 'T', T: 'A', G: 'C', C: 'G' };

  /* un enigma, dato il tipo e il caso: sempre con quattro opzioni (o una
     costruzione), sempre con il perché */
  function enigma(tipo, caso) {
    function scegli(a) { return a[Math.floor(caso() * a.length)]; }
    function mescola(a) {
      a = a.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(caso() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x;
      }
      return a;
    }
    if (tipo === 'riconosci') {
      var r = scegli(RICONOSCI());
      var altri = mescola(GRUPPI().filter(function (g) { return g !== r.giusta; })).slice(0, 3);
      return { tipo: 'scelta', struttura: r.s, evidenzia: true,
               testo: t('Che gruppo funzionale è cerchiato?', 'Which functional group is circled?'),
               opzioni: mescola([r.giusta].concat(altri)), giusta: r.giusta,
               perche: t('Il gruppo cerchiato è: ', 'The circled group is: ') + r.giusta };
    }
    if (tipo === 'nomina') {
      var n = scegli(NOMI());
      var alt = mescola(NOMI().filter(function (x) { return x.giusta !== n.giusta; }))
        .slice(0, 3).map(function (x) { return x.giusta; });
      return { tipo: 'scelta', struttura: n.s,
               testo: t('Qual è il nome IUPAC di questa struttura?', 'What is the IUPAC name of this structure?'),
               opzioni: mescola([n.giusta].concat(alt)), giusta: n.giusta, perche: n.perche };
    }
    if (tipo === 'costruisci') {
      var c = scegli(COSTRUZIONI());
      return { tipo: 'costruisci', struttura: null, catena: c.catena,
               scelte: ['C', 'O', 'N', 'S'],
               testo: t('Costruisci la catena di: ', 'Build the chain of: ') + c.nome +
                      t(' (gli atomi pesanti, da sinistra)', ' (heavy atoms, from the left)'),
               perche: c.nome + ': ' + c.catena.join('–') };
    }
    if (tipo === 'bilancia') {
      var b = scegli(BILANCI());
      var giusta = b.coeff.join(', ');
      /* i distrattori sono coefficienti sbagliati ma plausibili: tutti
         raddoppiati (bilanciati ma non minimi) non e' fra quelli giusti */
      var pool = [];
      while (pool.length < 3) {
        var cand = b.coeff.map(function (k, i) {
          return Math.max(1, k + (i === pool.length % b.coeff.length ? (caso() < 0.5 ? 1 : -1) : 0));
        }).join(', ');
        if (cand !== giusta && pool.indexOf(cand) < 0) pool.push(cand);
        else pool.push(b.coeff.map(function (k) { return k + 1; }).join(', ') + ' ');
      }
      return { tipo: 'scelta', struttura: null, equazione: b.testo,
               testo: t('Bilancia la reazione: quali sono i coefficienti?',
                        'Balance the reaction: which are the coefficients?'),
               opzioni: mescola([giusta].concat(pool.slice(0, 3))), giusta: giusta,
               perche: b.testo.replace(/_/g, function () { return ''; }) + ' → ' + giusta };
    }
    if (tipo === 'dna') {
      var basi = 'ATGC';
      var seq = '';
      for (var i = 0; i < 6; i++) seq += basi[Math.floor(caso() * 4)];
      var comp = seq.split('').map(function (x) { return COMPLEMENTO[x]; }).join('');
      var errate = [];
      /* stessi errori che fa chi sbaglia davvero: copiare il filamento,
         invertirlo, scambiare A-G */
      errate.push(seq);
      errate.push(comp.split('').reverse().join(''));
      errate.push(seq.split('').map(function (x) { return { A: 'G', G: 'A', T: 'C', C: 'T' }[x]; }).join(''));
      errate = errate.filter(function (x, k, a) { return x !== comp && a.indexOf(x) === k; });
      while (errate.length < 3) errate.push(comp.slice(1) + comp[0] + (errate.length));
      return { tipo: 'scelta', struttura: null, dna: seq,
               testo: t('Qual è il filamento complementare di ', 'What is the complementary strand of ') +
                      '5′-' + seq + '-3′?',
               opzioni: mescola([comp].concat(errate.slice(0, 3))), giusta: comp,
               perche: t('A si appaia con T, G con C: ', 'A pairs with T, G with C: ') +
                       seq + ' → ' + comp };
    }
    /* 'sito': una domanda dai 28 generatori, cioè da tutto il resto
       dell'applicazione */
    var D = globale.BSIGiocoDomande;
    if (D) {
      var q = D.domanda(Math.max(1, Math.min(5, Math.ceil(caso() * 5))), Math.floor(caso() * 1e9));
      if (q) return { tipo: 'scelta', struttura: null, testo: q.domanda,
                      opzioni: q.opzioni, giusta: q.giusta, area: q.area,
                      perche: q.spiega || '' };
    }
    return enigma('nomina', caso);
  }

  /* quali enigmi in quale ala: si comincia dai gruppi funzionali e si
     finisce mescolando tutto, compreso il resto del sito */
  var PROGRAMMA = {
    1: ['riconosci', 'nomina', 'costruisci'],
    2: ['nomina', 'bilancia', 'costruisci'],
    3: ['sito', 'bilancia', 'nomina'],
    4: ['dna', 'sito', 'riconosci'],
    5: ['bilancia', 'dna', 'sito']
  };

  /* ═════════════════════════════════════════════════════════════════════
     I CINQUE GUARDIANI

     Ogni fase dice CHE COSA serve e PERCHE'. Una fase «qualunque» e' la
     finestra in cui il guardiano e' scoperto; una fase «enigma» si supera
     rispondendo mentre lui attacca.
     ═════════════════════════════════════════════════════════════════════ */
  function GUARDIANI() {
    return {
      4: { id: 'pompa7', modello: 'pompa', nome: 'POMPA 7',
           natura: t('lega ferrosa, ossidata in superficie', 'ferrous alloy, oxidised on the surface'),
           fasi: [
             { serve: 'HCl', colpi: 3, descr: t('la ruggine', 'the rust'),
               giusto: 'Fe₂O₃ + 6 HCl → 2 FeCl₃ + 3 H₂O',
               sbagliato: t('Sulla ruggine serve un acido.', 'Rust needs an acid.') },
             { serve: 'Na', colpi: 3, descr: t('il vapore', 'the steam'),
               giusto: '2 Na + 2 H₂O → 2 NaOH + H₂',
               sbagliato: t('Serve qualcosa che reagisca con il vapore.', 'You need something that reacts with steam.') },
             { serve: 'qualunque', colpi: 3, descr: t('il rotore', 'the rotor'),
               giusto: t('Il rotore è scoperto.', 'The rotor is exposed.'), sbagliato: '' }
           ],
           premio: 'NaOH' },
      8: { id: 'polimero', modello: 'polimero', nome: t('IL POLIMERO', 'THE POLYMER'),
           natura: t('catena organica reticolata', 'cross-linked organic chain'),
           fasi: [
             { serve: 'H2O2', colpi: 3, descr: t('le catene', 'the chains'),
               giusto: t('Il perossido ossida e spezza le catene.', 'Peroxide oxidises and breaks the chains.'),
               sbagliato: t('Le catene organiche si spezzano ossidandole.', 'Organic chains are broken by oxidising them.') },
             { serve: 'H2SO4', colpi: 3, descr: t('il reticolo', 'the network'),
               giusto: t('L’acido solforico toglie l’acqua e carbonizza.', 'Sulfuric acid strips water and chars it.'),
               sbagliato: t('Il reticolo non si ossida più: va disidratato.', 'The network no longer oxidises: it must be dehydrated.') },
             { serve: 'qualunque', colpi: 3, descr: t('il nucleo', 'the core'),
               giusto: t('Il nucleo è scoperto.', 'The core is exposed.'), sbagliato: '' }
           ],
           premio: 'NH3' },
      12: { id: 'spettro', modello: 'spettro', nome: t('LO SPETTRO', 'THE SPECTRUM'),
            natura: t('specie radicalica con un elettrone spaiato', 'radical species with an unpaired electron'),
            fasi: [
              { serve: 'ASC', colpi: 3, descr: t('la catena radicalica', 'the radical chain'),
                giusto: t('L’ascorbico cede un idrogeno e chiude la catena.', 'Ascorbic acid donates a hydrogen and closes the chain.'),
                sbagliato: t('Un radicale si spegne con un antiossidante.', 'A radical is quenched by an antioxidant.') },
              { serve: 'CO2', colpi: 3, descr: t('la fiamma', 'the flame'),
                giusto: t('L’anidride carbonica toglie l’ossigeno alla fiamma.', 'Carbon dioxide takes the oxygen away from the flame.'),
                sbagliato: t('La fiamma va soffocata.', 'The flame must be smothered.') },
              { serve: 'qualunque', colpi: 3, descr: t('il cristallo', 'the crystal'),
                giusto: t('Il cristallo è scoperto.', 'The crystal is exposed.'), sbagliato: '' }
            ],
            premio: 'NaHCO3' },
      16: { id: 'elica', modello: 'elica', nome: t('ELICA', 'HELIX'),
            natura: t('doppia elica di acido nucleico', 'nucleic-acid double helix'),
            fasi: [
              { serve: 'enigma:dna', colpi: 2, descr: t('l’appaiamento', 'the pairing'),
                giusto: t('Basi complementari: l’elica si apre.', 'Complementary bases: the helix opens.'),
                sbagliato: t('A con T, G con C.', 'A with T, G with C.') },
              { serve: 'NaOH', colpi: 3, descr: t('i filamenti', 'the strands'),
                giusto: t('In ambiente basico i legami a idrogeno cedono: denaturazione.',
                          'In base the hydrogen bonds give way: denaturation.'),
                sbagliato: t('I filamenti si separano in ambiente basico.', 'The strands separate in base.') },
              { serve: 'qualunque', colpi: 3, descr: t('lo scheletro', 'the backbone'),
                giusto: t('Lo scheletro è scoperto.', 'The backbone is exposed.'), sbagliato: '' }
            ],
            premio: 'MgO' },
      20: { id: 'protocollo', modello: 'protocollo', nome: 'PROTOCOLLO 12',
            natura: t('la reazione stessa, fuori controllo', 'the reaction itself, out of control'),
            fasi: [
              { serve: 'enigma:bilancia', colpi: 2, descr: t('l’equazione', 'the equation'),
                giusto: t('Bilanciata: il reattore perde il ritmo.', 'Balanced: the reactor loses its rhythm.'),
                sbagliato: t('Gli atomi devono tornare.', 'The atoms must add up.') },
              { serve: 'NaHCO3', colpi: 3, descr: t('gli spruzzi acidi', 'the acid sprays'),
                giusto: t('Il bicarbonato tampona l’acido senza scaldare.', 'Bicarbonate buffers the acid without heating.'),
                sbagliato: t('Serve un tampone: niente calore.', 'You need a buffer: no heat.') },
              { serve: 'Ar', colpi: 3, descr: t('la fiamma del nucleo', 'the core’s flame'),
                giusto: t('L’argon toglie l’ossigeno: il nucleo soffoca.', 'Argon displaces the oxygen: the core smothers.'),
                sbagliato: t('Il nucleo brucia: va soffocato con un gas inerte.', 'The core burns: smother it with an inert gas.') },
              { serve: 'qualunque', colpi: 4, descr: t('il nucleo', 'the core'),
                giusto: t('Il nucleo è scoperto.', 'The core is exposed.'), sbagliato: '' }
            ],
            premio: null }
    };
  }

  /* ═════════════════════════════════════════════════════════════════════
     LE CINQUE ALI
     ═════════════════════════════════════════════════════════════════════ */
  function ZONE() {
    return [
      { n: 1, nome: t('Ala Ovest · Stoccaggio reagenti', 'West Wing · Reagent storage'),
        elementi: ['H', 'Cl', 'Na', 'O'], ricette: ['HCl', 'H2O2'],
        nebbia: 0x0a0f14, luce: 0xffe8cc },
      { n: 2, nome: t('Ala Nord · Sintesi organica', 'North Wing · Organic synthesis'),
        elementi: ['C', 'N', 'S', 'O', 'H'], ricette: ['H2SO4', 'NH3', 'CO2'],
        nebbia: 0x0c0d12, luce: 0xfff0d8 },
      { n: 3, nome: t('Ala Est · Spettroscopia', 'East Wing · Spectroscopy'),
        elementi: ['F', 'Fe', 'Mg', 'C', 'O', 'H'], ricette: ['ASC', 'MgO'],
        nebbia: 0x0a0c14, luce: 0xdfe8ff },
      { n: 4, nome: t('Ala Sud · Biochimica', 'South Wing · Biochemistry'),
        elementi: ['P', 'K', 'Ca', 'Na', 'O', 'H'], ricette: ['NaHCO3'],
        nebbia: 0x0b100d, luce: 0xe8ffe8 },
      { n: 5, nome: t('Il Nucleo', 'The Core'),
        elementi: ['Ar', 'Au', 'Pb', 'Na', 'C', 'O', 'H'], ricette: [],
        nebbia: 0x120a08, luce: 0xffd8b0 }
    ];
  }

  var NOMI_STANZA = function () {
    return [t('Stoccaggio', 'Storage'), t('Corridoio', 'Corridor'), t('Archivio', 'Archive'),
            t('Laboratorio', 'Laboratory'), t('Magazzino', 'Warehouse'), t('Sala strumenti', 'Instrument room'),
            t('Deposito', 'Depot'), t('Locale tecnico', 'Plant room'), t('Sala controllo', 'Control room'),
            t('Camera bianca', 'Clean room'), t('Cappe', 'Fume hoods'), t('Celle frigo', 'Cold rooms')];
  };

  /* ═════════════════════════════════════════════════════════════════════
     GENERARE UN LIVELLO
     ═════════════════════════════════════════════════════════════════════ */
  function livello(n) {
    n = Math.max(1, Math.min(LIVELLI, n | 0));
    var caso = Caso(n * 2654435761 + 97);
    var zona = ZONE()[Math.ceil(n / 4) - 1];
    var guardiani = GUARDIANI();
    var boss = guardiani[n] || null;

    /* la griglia: colonne e righe di larghezza variabile, cosi' le stanze
       non sono tutte uguali ma due vicine condividono sempre un muro */
    var NC = 6, NR = 6;
    var larg = [], prof = [];
    for (var c = 0; c < NC; c++) larg.push(caso() < 0.3 ? 6 : 10 + Math.round(caso() * 5));
    for (var r = 0; r < NR; r++) prof.push(caso() < 0.3 ? 6 : 10 + Math.round(caso() * 5));
    function cx(c2) { var x = 0; for (var i = 0; i < c2; i++) x += larg[i]; return x + larg[c2] / 2; }
    function cz(r2) { var z = 0; for (var i = 0; i < r2; i++) z += prof[i]; return z + prof[r2] / 2; }

    /* il percorso principale: una passeggiata che non torna sui suoi passi */
    var lunghezza = Math.min(9, 4 + Math.floor(n / 3));
    var percorso = [], occ = {};
    var pos = [Math.floor(caso() * 2), Math.floor(caso() * 2) + 2];
    function libera(p) { return p[0] >= 0 && p[0] < NC && p[1] >= 0 && p[1] < NR && !occ[p[0] + ',' + p[1]]; }
    percorso.push(pos); occ[pos[0] + ',' + pos[1]] = true;
    var tentativi = 0;
    while (percorso.length < lunghezza && tentativi < 200) {
      tentativi++;
      var ult = percorso[percorso.length - 1];
      var dirs = [[1, 0], [0, 1], [0, -1], [-1, 0]].filter(function (d) {
        return libera([ult[0] + d[0], ult[1] + d[1]]);
      });
      if (!dirs.length) break;
      /* si preferisce andare avanti (verso destra): il livello ha una
         direzione, e chi gioca la sente */
      /* il peso si estrae PRIMA di ordinare: un comparatore che chiama il
         caso dà livelli diversi su motori JavaScript diversi, perché ognuno
         ordina confrontando coppie diverse */
      var pesi = dirs.map(function (dd) { return dd[0] + (caso() - 0.5) * 1.4; });
      var migliore = 0;
      for (var q = 1; q < dirs.length; q++) if (pesi[q] > pesi[migliore]) migliore = q;
      var d = dirs[migliore];
      var nuova = [ult[0] + d[0], ult[1] + d[1]];
      percorso.push(nuova); occ[nuova[0] + ',' + nuova[1]] = true;
    }

    /* le stanze laterali: appese al percorso, mai all'ultima */
    var laterali = [];
    var nLat = 1 + Math.floor(caso() * 2) + (n > 8 ? 1 : 0);
    for (var k = 0; k < nLat * 6 && laterali.length < nLat; k++) {
      var base = percorso[Math.floor(caso() * (percorso.length - 1))];
      var dd = [[1, 0], [0, 1], [0, -1], [-1, 0]][Math.floor(caso() * 4)];
      var lp = [base[0] + dd[0], base[1] + dd[1]];
      if (libera(lp)) { laterali.push({ p: lp, padre: base }); occ[lp[0] + ',' + lp[1]] = true; }
    }

    var nomi = NOMI_STANZA();
    var stanze = [];
    function idDi(p) { return 'r' + p[0] + '_' + p[1]; }
    function aggiungi(p, ruolo) {
      var c2 = p[0], r2 = p[1];
      var corridoio = larg[c2] < 8 || prof[r2] < 8;
      stanze.push({
        id: idDi(p), ruolo: ruolo, cella: p,
        nome: (ruolo === 'boss' ? t('Arena', 'Arena') : (corridoio ? t('Corridoio', 'Corridor') :
               nomi[Math.floor(caso() * nomi.length)])) + ' ' + n + '.' + (stanze.length + 1),
        x: cx(c2), z: cz(r2), larg: larg[c2], prof: prof[r2],
        alt: ruolo === 'boss' ? 4.6 : (corridoio ? 3.0 : 3.4),
        porte: [], oggetti: []
      });
    }
    percorso.forEach(function (p, i) {
      aggiungi(p, i === 0 ? 'partenza' : (i === percorso.length - 1 ? (boss ? 'boss' : 'uscita') :
               (i === percorso.length - 2 ? 'terminale' : 'percorso')));
    });
    laterali.forEach(function (l) { aggiungi(l.p, 'laterale'); });
    var perId = {};
    stanze.forEach(function (s) { perId[s.id] = s; });

    /* le porte: una per ogni coppia collegata, scritta in tutti e due i
       versi (il banco controlla che ogni porta abbia la sua gemella) */
    function verso(a, b) {
      if (b[0] > a[0]) return ['est', 'ovest'];
      if (b[0] < a[0]) return ['ovest', 'est'];
      if (b[1] > a[1]) return ['sud', 'nord'];
      return ['nord', 'sud'];
    }
    function collega(pa, pb, chiusa) {
      var v = verso(pa, pb);
      perId[idDi(pa)].porte.push({ verso: v[0], a: idDi(pb), chiusa: chiusa || null });
      perId[idDi(pb)].porte.push({ verso: v[1], a: idDi(pa), chiusa: chiusa || null });
    }
    for (var i2 = 1; i2 < percorso.length; i2++) {
      var chiave = (i2 === percorso.length - 1) ? 'paratia' + n : null;
      collega(percorso[i2 - 1], percorso[i2], chiave);
    }
    laterali.forEach(function (l) { collega(l.padre, l.p, null); });

    /* gli oggetti */
    function dentro(st, margine) {
      var m = margine || 1.4;
      return { x: (caso() - 0.5) * Math.max(0.2, st.larg - 2 * m),
               z: (caso() - 0.5) * Math.max(0.2, st.prof - 2 * m) };
    }
    function lontanoDallePorte(st, p) {
      return st.porte.every(function (pt) {
        var px = pt.verso === 'est' ? st.larg / 2 : (pt.verso === 'ovest' ? -st.larg / 2 : 0);
        var pz = pt.verso === 'sud' ? st.prof / 2 : (pt.verso === 'nord' ? -st.prof / 2 : 0);
        return Math.hypot(p.x - px, p.z - pz) > 2.6;
      }) && Math.hypot(p.x, p.z) > 0.01;
    }
    function posto(st, margine) {
      for (var tt = 0; tt < 30; tt++) {
        var p = dentro(st, margine);
        var ok = lontanoDallePorte(st, p) && st.oggetti.every(function (o) {
          return Math.hypot(o.x - p.x, o.z - p.z) > 1.6;
        });
        if (ok) return p;
      }
      return null;
    }
    function metti(st, o, margine) {
      var p = posto(st, margine);
      if (!p) return false;
      o.x = p.x; o.z = p.z;
      st.oggetti.push(o);
      return true;
    }
    function arredaBordo(st) {
      /* gli arredi stanno lungo i muri, dove li metterebbe chiunque */
      var tipi = ['scaffale', 'scaffale', 'fusto', 'fusto', 'cappa', 'fusti'];
      var quanti = st.larg < 8 || st.prof < 8 ? 1 : 2 + Math.floor(caso() * 3);
      for (var q = 0; q < quanti; q++) {
        var tipo = tipi[Math.floor(caso() * tipi.length)];
        var lato = Math.floor(caso() * 4);
        var o = { tipo: tipo, ruota: 0 };
        if (lato === 0) { o.x = (caso() - 0.5) * (st.larg - 3); o.z = -st.prof / 2 + 0.6; o.ruota = 0; }
        else if (lato === 1) { o.x = (caso() - 0.5) * (st.larg - 3); o.z = st.prof / 2 - 0.6; o.ruota = Math.PI; }
        else if (lato === 2) { o.z = (caso() - 0.5) * (st.prof - 3); o.x = -st.larg / 2 + 0.6; o.ruota = Math.PI / 2; }
        else { o.z = (caso() - 0.5) * (st.prof - 3); o.x = st.larg / 2 - 0.6; o.ruota = -Math.PI / 2; }
        var libero = lontanoDallePorte(st, o) && st.oggetti.every(function (x) {
          return Math.hypot(x.x - o.x, x.z - o.z) > 1.9;
        });
        if (libero) st.oggetti.push(o);
      }
    }

    stanze.forEach(function (st) { if (st.ruolo !== 'boss') arredaBordo(st); });

    /* il banco di sintesi: in una stanza del percorso, mai nell'arena */
    var conBanco = stanze.filter(function (s) {
      return (s.ruolo === 'percorso' || s.ruolo === 'partenza') && s.larg >= 10 && s.prof >= 10;
    })[0] || stanze[0];
    metti(conBanco, { tipo: 'banco', ruota: 0 }, 2.2);

    /* il terminale: nella penultima stanza, e apre l'ultima porta */
    var term = stanze.filter(function (s) { return s.ruolo === 'terminale'; })[0] || stanze[stanze.length - 2];
    var tipiEnigma = PROGRAMMA[zona.n];
    metti(term, { tipo: 'terminale', id: 'term' + n, apre: 'paratia' + n,
                  enigmi: tipiEnigma, seme: n * 7919 + 13 }, 1.8);

    /* gli elementi: quelli dell'ala, due dosi ciascuno, sparsi fra le
       stanze laterali (se ci sono) e il percorso */
    var dove = stanze.filter(function (s) { return s.ruolo !== 'boss'; });
    var lat = stanze.filter(function (s) { return s.ruolo === 'laterale'; });
    var servono = zona.elementi.slice();
    if (boss) {
      /* prima di un guardiano ci sono SEMPRE gli elementi per fare tutto
         quello che serve contro di lui: un guardiano invincibile perché il
         livello non ha messo il sodio è un gioco rotto, non difficile */
      boss.fasi.forEach(function (f) {
        var ric = RICETTE().filter(function (r) { return r.id === f.serve; })[0];
        if (ric) ric.reagenti.forEach(function (e) {
          var sub = RICETTE().filter(function (r) { return r.id === e; })[0];
          (sub ? sub.reagenti : [e]).forEach(function (x) { servono.push(x); });
        });
        else if (POTERI()[f.serve]) servono.push(f.serve);
      });
    }
    servono.forEach(function (sim, k2) {
      var st2 = (lat.length && k2 % 2 === 0) ? lat[k2 % lat.length] : dove[(k2 + 1) % dove.length];
      if (!metti(st2, { tipo: 'elemento', sim: sim, dosi: 2 }, 1.6)) {
        metti(dove[0], { tipo: 'elemento', sim: sim, dosi: 2 }, 1.2);
      }
    });

    /* gli appunti con le ricette dell'ala: uno per livello, a turno */
    var ricZona = zona.ricette;
    if (ricZona.length) {
      var ric2 = ricZona[(n - 1) % 4 % ricZona.length];
      var dove2 = lat[0] || dove[Math.min(1, dove.length - 1)];
      metti(dove2, { tipo: 'foglio', ricetta: ric2 }, 1.4);
    }
    /* e un appunto di trama, nel primo livello di ogni ala */
    if (n % 4 === 1) {
      metti(stanze[0], { tipo: 'foglio', trama: zona.n }, 1.4);
    }

    /* i nemici: crescono con il livello, mai nella stanza di partenza */
    var nNem = Math.min(10, 1 + Math.floor(n * 0.5));
    var conNemici = stanze.filter(function (s) { return s.ruolo !== 'partenza' && s.ruolo !== 'boss'; });
    for (var e = 0; e < nNem && conNemici.length; e++) {
      metti(conNemici[e % conNemici.length], { tipo: 'nemico', forza: 1 + Math.floor(n / 6) }, 1.6);
    }

    /* l'ultima stanza: l'ascensore verso il livello dopo, o il guardiano */
    var ultima = stanze.filter(function (s) { return s.ruolo === 'boss' || s.ruolo === 'uscita'; })[0];
    if (boss) {
      /* l'ascensore sta dalla parte opposta all'ingresso, e il guardiano in
         mezzo: per uscire bisogna passare da lui */
      var ing = (ultima.porte[0] || { verso: 'sud' }).verso;
      var fx = ing === 'est' ? -1 : (ing === 'ovest' ? 1 : 0);
      var fz = ing === 'sud' ? -1 : (ing === 'nord' ? 1 : 0);
      ultima.oggetti = ultima.oggetti.filter(function (o) {
        return Math.hypot(o.x - fx * (ultima.larg / 2 - 1.8), o.z - fz * (ultima.prof / 2 - 1.8)) > 2.4 &&
               Math.hypot(o.x, o.z) > 2.6;
      });
      ultima.oggetti.push({ tipo: 'boss', id: boss.id, x: fx * ultima.larg * 0.08, z: fz * ultima.prof * 0.08 });
      ultima.oggetti.push({ tipo: 'uscita', x: fx * (ultima.larg / 2 - 1.8),
                            z: fz * (ultima.prof / 2 - 1.8), dopoBoss: true });
    } else {
      ultima.oggetti.push({ tipo: 'uscita', x: 0, z: 0 });
    }

    return {
      n: n, zona: zona, nome: zona.nome + ' — ' + t('livello ', 'level ') + n,
      stanze: stanze, boss: boss,
      partenza: { stanza: stanze[0].id, x: 0, z: 0 },
      percorso: percorso.map(idDi)
    };
  }

  globale.BSIAtomicLivelli = {
    LIVELLI: LIVELLI, livello: livello, ZONE: ZONE, GUARDIANI: GUARDIANI,
    RICETTE: RICETTE, POTERI: POTERI, STRUTTURE: STRUTTURE, enigma: enigma,
    bilanciata: bilanciata, PROGRAMMA: PROGRAMMA, Caso: Caso,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
