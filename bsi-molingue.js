/* ═══════════════════════════════════════════════════════════════════════════
   bsi-molingue.js — i linguaggi con cui si scrive una molecola
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA FA, E CHE COSA NON PUO' FARE

   Una molecola si scrive in molti modi: SMILES, InChI, chiave InChI, molfile,
   SMARTS, CXSMILES, JSON, formula, nome IUPAC. Questo modulo converte fra
   quelli che RDKit sa trattare in questa build — misurati, non supposti — e
   dichiara gli altri invece di inventarli.

   Misurato su undici molecole, taxolo con undici centri stereogenici
   compreso:

     SMILES    ingresso e uscita        il giro torna identico
     molfile   ingresso e uscita        il giro torna identico (11 su 11)
     CXSMILES  ingresso e uscita
     SMARTS    ingresso (query) e uscita
     InChI     SOLO uscita              get_mol(InChI) torna nullo qui
     chiave    SOLO uscita              e' un digest: non e' invertibile
                                        per natura, nemmeno in teoria
     nome      vedi sotto

   IL NOME E' IL CASO DIFFICILE, E SI DICE

   RDKit non genera nomi IUPAC: non e' una mancanza di questa build, e' che
   la nomenclatura non e' un calcolo sul grafo ma un corpo di regole con
   eccezioni. Qui il nome arriva per tre strade, e si dichiara SEMPRE quale:

     1. «nominatore locale» — un algoritmo che applica le regole IUPAC a una
        classe RISTRETTA e dichiarata (§4). Fuori da quella classe rifiuta e
        dice perche'. Un nome sbagliato e' peggio di nessun nome.
     2. «archivio dell'app» — i nomi comuni delle molecole che l'app ha gia'
        in memoria, trovati per chiave InChI.
     3. «PubChem» — il nome IUPAC vero per qualunque molecola, ma richiede
        la rete; se non c'e', si dice che non c'e'.

   USO   window.BSIMolLingue.converti(testo, opzioni, callback)
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Riconoscere in che lingua è scritto l'ingresso
     ═════════════════════════════════════════════════════════════════════════
     Si guarda la forma, non si tenta e si spera: un molfile ha una riga di
     conteggio, una chiave InChI ha due trattini in posizioni fisse, un InChI
     comincia per «InChI=». Quel che resta è SMILES o un nome. */

  var RE_CHIAVE = /^[A-Z]{14}-[A-Z]{10}-[A-Z]$/;

  function riconosci(testo) {
    /* Il testo GREZZO, non ripulito: un molfile comincia con una riga di
       titolo che può essere vuota, e `trim()` se la mangia spostando in su
       tutte le righe — la riga di conteggio finisce al posto sbagliato e il
       formato non si riconosce più. È un difetto che il banco ha trovato
       facendo il giro SMILES → molfile → SMILES. */
    var grezzo = String(testo == null ? '' : testo);
    var t = grezzo.trim();
    if (!t) return { lingua: null, perche: 'niente da convertire' };

    if (/^InChI=/.test(t)) {
      return { lingua: 'inchi', soloUscita: true,
               perche: 'questa build di RDKit non rilegge l’InChI: ' +
                       'get_mol(InChI) torna nullo' };
    }
    if (RE_CHIAVE.test(t)) {
      return { lingua: 'chiave', soloUscita: true,
               perche: 'la chiave InChI è un digest di 27 caratteri: da essa ' +
                       'non si può risalire alla struttura, per costruzione' };
    }
    /* Un molfile: la quarta riga è la riga di conteggio «aaabbb…V2000/V3000» */
    var righe = grezzo.split(/\r?\n/);
    if (righe.length >= 4 && /V[23]000\s*$/.test(righe[3])) return { lingua: 'molfile' };
    if (righe.length >= 4 && /^\s*\d+\s+\d+/.test(righe[3])) return { lingua: 'molfile' };
    if (/^\s*M\s+END\s*$/m.test(grezzo)) return { lingua: 'molfile' };

    /* CXSMILES: SMILES seguito da un blocco fra |…| */
    if (/\s\|[^|]*\|\s*$/.test(t)) return { lingua: 'cxsmiles' };

    /* SMARTS: i costrutti che in SMILES non esistono */
    if (/\[[^\]]*[#$;&!][^\]]*\]|~|@[<>]/.test(t) && !/^InChI/.test(t)) {
      return { lingua: 'smarts', query: true };
    }

    /* Tutto il resto è SMILES oppure un nome, e la differenza NON si indovina
       con un'espressione regolare: la prima stesura di questa funzione
       scambiava `c1ccccc1` — il benzene — per un nome, perché è fatto di sole
       lettere e cifre e comincia in minuscolo. Lo decide il motore chimico,
       che è l'unico che sappia davvero leggere uno SMILES: qui si segnala solo
       il SOSPETTO, e serve a scrivere il messaggio giusto se la lettura
       fallisce. */
    var sospettoNome = /[ ]/.test(t) || /[àèéìòùÀÈÉÌÒÙ]/.test(t) ||
                       /^(acido|acid|sodium|sodio|potassio|calcio)\b/i.test(t) ||
                       (/^[A-Za-z\-, ]+$/.test(t) && t.length > 7 &&
                        !/^[A-Za-z]{1,4}$/.test(t));
    return { lingua: 'smiles', sospettoNome: sospettoNome };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Il grafo, letto dal molfile
     ═════════════════════════════════════════════════════════════════════════
     Il nominatore lavora sul grafo, non sul SMILES: il molfile V2000 è il
     formato più semplice da leggere senza ambiguità — blocco atomi, blocco
     legami, nessuna sintassi da interpretare. */

  function grafoDaMolfile(mb) {
    var righe = String(mb).split(/\r?\n/);
    if (righe.length < 4) return null;
    var conteggio = righe[3];
    var nAt = parseInt(conteggio.slice(0, 3), 10);
    var nLe = parseInt(conteggio.slice(3, 6), 10);
    if (!isFinite(nAt) || !isFinite(nLe)) return null;
    var atomi = [], legami = [], i;
    for (i = 0; i < nAt; i++) {
      var r = righe[4 + i];
      if (r == null) return null;
      var el = r.slice(31, 34).trim();
      var carica = 0;
      var cc = parseInt(r.slice(36, 39), 10);
      /* il campo carica del V2000: 1=+3, 2=+2, 3=+1, 5=-1, 6=-2, 7=-3 */
      if (cc === 1) carica = 3; else if (cc === 2) carica = 2;
      else if (cc === 3) carica = 1; else if (cc === 5) carica = -1;
      else if (cc === 6) carica = -2; else if (cc === 7) carica = -3;
      atomi.push({ i: i, el: el, carica: carica, vicini: [] });
    }
    for (i = 0; i < nLe; i++) {
      var rl = righe[4 + nAt + i];
      if (rl == null) return null;
      var a = parseInt(rl.slice(0, 3), 10) - 1;
      var bb = parseInt(rl.slice(3, 6), 10) - 1;
      var ord = parseInt(rl.slice(6, 9), 10);
      if (!(a >= 0 && bb >= 0 && a < nAt && bb < nAt)) return null;
      legami.push({ a: a, b: bb, ord: ord });
      atomi[a].vicini.push({ j: bb, ord: ord });
      atomi[bb].vicini.push({ j: a, ord: ord });
    }
    /* le cariche possono stare anche nelle proprietà M  CHG */
    righe.forEach(function (r) {
      if (!/^M {2}CHG/.test(r)) return;
      var p = r.trim().split(/\s+/).slice(3);
      for (var k = 0; k + 1 < p.length; k += 2) {
        var idx = parseInt(p[k], 10) - 1, q = parseInt(p[k + 1], 10);
        if (atomi[idx]) atomi[idx].carica = q;
      }
    });
    return { atomi: atomi, legami: legami };
  }

  function haCicli(g) {
    /* un grafo connesso è un albero se e solo se legami = atomi − 1; con più
       componenti si conta per componente */
    var visto = {}, pile, comp = 0, nodi, archi;
    for (var s = 0; s < g.atomi.length; s++) {
      if (visto[s]) continue;
      comp++; nodi = 0; archi = 0; pile = [s]; visto[s] = 1;
      while (pile.length) {
        var u = pile.pop(); nodi++;
        archi += g.atomi[u].vicini.length;
        g.atomi[u].vicini.forEach(function (v) {
          if (!visto[v.j]) { visto[v.j] = 1; pile.push(v.j); }
        });
      }
      if (archi / 2 > nodi - 1) return true;
    }
    return false;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · Le parole della nomenclatura, in due lingue
     ═════════════════════════════════════════════════════════════════════════ */

  var RADICI = {
    it: ['', 'met', 'et', 'prop', 'but', 'pent', 'es', 'ept', 'ott', 'non', 'dec',
         'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'esadec', 'eptadec',
         'ottadec', 'nonadec', 'icos'],
    en: ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec',
         'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'hexadec', 'heptadec',
         'octadec', 'nonadec', 'icos']
  };
  var MOLTI = ['', '', 'di', 'tri', 'tetra', 'penta', 'esa', 'epta'];
  var MOLTI_EN = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta'];

  var ALOGENI = {
    F:  { it: 'fluoro', en: 'fluoro' },
    Cl: { it: 'cloro',  en: 'chloro' },
    Br: { it: 'bromo',  en: 'bromo' },
    I:  { it: 'iodo',   en: 'iodo' }
  };

  function alchile(n, lingua) {
    var r = RADICI[lingua][n];
    if (!r) return null;
    return r + (lingua === 'it' ? 'il' : 'yl');
  }

  var SUFFISSI = {
    it: { olo: 'olo', ale: 'ale', one: 'one', ammina: 'ammina', acido: 'oico' },
    en: { olo: 'ol',  ale: 'al',  one: 'one', ammina: 'amine',  acido: 'oic acid' }
  };

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · Il nominatore locale — la classe che sa trattare, dichiarata
     ═════════════════════════════════════════════════════════════════════════
     Nomina: molecole ACICLICHE, neutre, di soli C H O N F Cl Br I, con
       · scheletro carbonioso con doppi e tripli legami (fino a tre ciascuno)
       · UN solo tipo di gruppo principale fra
           acido carbossilico · aldeide · chetone · ammina · alcol (fino a 3)
         oppure nessuno (alcano / alchene / alchino)
       · sostituenti: alogeni e catene alchiliche NON ramificate

     Rifiuta tutto il resto, dicendo quale condizione è caduta. Non indica
     stereochimica: R/S ed E/Z non sono dedotti, e il nome lo dichiara.      */

  var ELEMENTI_AMMESSI = { C: 1, H: 1, O: 1, N: 1, F: 1, Cl: 1, Br: 1, I: 1 };

  function nominaDaGrafo(g, lingua) {
    lingua = (lingua === 'en') ? 'en' : 'it';
    function no(motivo) { return { nome: null, perche: motivo }; }

    if (!g || !g.atomi.length) return no('grafo illeggibile');
    if (haCicli(g)) return no(lingua === 'it'
      ? 'la molecola ha un anello: il nominatore locale tratta solo molecole aperte'
      : 'the molecule has a ring: the local namer handles acyclic molecules only');

    var i, a;
    for (i = 0; i < g.atomi.length; i++) {
      a = g.atomi[i];
      if (!ELEMENTI_AMMESSI[a.el]) return no(lingua === 'it'
        ? 'contiene ' + a.el + ', fuori dagli elementi che il nominatore tratta'
        : 'it contains ' + a.el + ', outside the elements the namer handles');
      if (a.carica) return no(lingua === 'it'
        ? 'la molecola è carica: la nomenclatura degli ioni non è coperta'
        : 'the molecule is charged: ion nomenclature is not covered');
    }

    var C = [], idxC = {};
    g.atomi.forEach(function (x) { if (x.el === 'C') { idxC[x.i] = C.length; C.push(x); } });
    if (!C.length) return no(lingua === 'it'
      ? 'non c’è carbonio: serve la nomenclatura inorganica'
      : 'no carbon: this needs inorganic nomenclature');

    /* ── i gruppi funzionali ──────────────────────────────────────────── */
    var gruppi = { acido: [], ale: [], one: [], olo: [], ammina: [] };
    g.atomi.forEach(function (x) {
      if (x.el !== 'C') return;
      var oDoppi = x.vicini.filter(function (v) { return g.atomi[v.j].el === 'O' && v.ord === 2; });
      var oSingoli = x.vicini.filter(function (v) {
        return g.atomi[v.j].el === 'O' && v.ord === 1 && g.atomi[v.j].vicini.length === 1; });
      var cVicini = x.vicini.filter(function (v) { return g.atomi[v.j].el === 'C'; });
      if (oDoppi.length === 1 && oSingoli.length === 1) { gruppi.acido.push(x.i); return; }
      if (oDoppi.length === 1 && cVicini.length <= 1) { gruppi.ale.push(x.i); return; }
      if (oDoppi.length === 1 && cVicini.length === 2) { gruppi.one.push(x.i); return; }
    });
    g.atomi.forEach(function (x) {
      if (x.el !== 'O') return;
      if (x.vicini.length !== 1) return;
      var v = x.vicini[0];
      if (v.ord !== 1) return;
      if (g.atomi[v.j].el !== 'C') return;
      /* l'ossidrile di un acido è già contato nell'acido */
      if (gruppi.acido.indexOf(v.j) >= 0) return;
      gruppi.olo.push(v.j);
    });
    g.atomi.forEach(function (x) {
      if (x.el !== 'N') return;
      var soloSingoli = x.vicini.every(function (v) { return v.ord === 1; });
      var soloC = x.vicini.every(function (v) { return g.atomi[v.j].el === 'C'; });
      if (!soloSingoli || !soloC) return;
      if (x.vicini.length !== 1) return;   /* solo ammine primarie */
      gruppi.ammina.push(x.vicini[0].j);
    });
    /* ogni azoto o ossigeno deve essere stato spiegato da un gruppo */
    var nonSpiegati = g.atomi.filter(function (x) {
      if (x.el !== 'O' && x.el !== 'N') return false;
      if (x.el === 'O') {
        if (x.vicini.length === 1) return false;            /* =O o −OH, visti */
        return true;                                        /* etere o estere */
      }
      return x.vicini.length !== 1;                         /* ammine 2°/3° */
    });
    if (nonSpiegati.length) return no(lingua === 'it'
      ? 'contiene un gruppo che il nominatore non copre (etere, estere, ammide o ammina secondaria)'
      : 'it contains a group the namer does not cover (ether, ester, amide or secondary amine)');

    var presenti = Object.keys(gruppi).filter(function (k) { return gruppi[k].length; });
    if (presenti.length > 1) return no(lingua === 'it'
      ? 'ci sono gruppi principali di tipo diverso (' + presenti.join(', ') +
        '): servirebbe la tavola delle priorità, che non è coperta'
      : 'there are principal groups of different kinds (' + presenti.join(', ') +
        '): that needs the seniority table, which is not covered');
    var tipo = presenti[0] || null;
    if (tipo && tipo !== 'olo' && gruppi[tipo].length > 1) return no(lingua === 'it'
      ? 'ci sono ' + gruppi[tipo].length + ' gruppi ' + tipo + ': coperto un solo gruppo di questo tipo'
      : 'there are ' + gruppi[tipo].length + ' ' + tipo + ' groups: only one is covered');
    if (tipo === 'olo' && gruppi.olo.length > 3) return no(lingua === 'it'
      ? 'più di tre ossidrili: non coperto' : 'more than three hydroxyls: not covered');

    /* ── le catene carboniose possibili ───────────────────────────────── */
    var nC = C.length;
    var adiacenzaC = C.map(function (x) {
      return x.vicini.filter(function (v) { return g.atomi[v.j].el === 'C'; })
                     .map(function (v) { return { c: idxC[v.j], ord: v.ord }; });
    });
    var foglie = [];
    for (i = 0; i < nC; i++) if (adiacenzaC[i].length <= 1) foglie.push(i);
    if (nC === 1) foglie = [0];

    /* tutti i cammini fra due foglie: in un albero il cammino è unico */
    function cammino(da, a) {
      var prec = {}, visto = {}, coda = [da];
      visto[da] = 1;
      while (coda.length) {
        var u = coda.shift();
        if (u === a) break;
        adiacenzaC[u].forEach(function (v) {
          if (!visto[v.c]) { visto[v.c] = 1; prec[v.c] = u; coda.push(v.c); }
        });
      }
      if (da !== a && prec[a] === undefined) return null;
      var p = [a];
      while (p[0] !== da) { p.unshift(prec[p[0]]); if (p.length > nC + 1) return null; }
      return p;
    }
    var candidate = [];
    for (i = 0; i < foglie.length; i++) {
      for (var j2 = i; j2 < foglie.length; j2++) {
        var p = cammino(foglie[i], foglie[j2]);
        if (p) { candidate.push(p); if (p.length > 1) candidate.push(p.slice().reverse()); }
      }
    }
    if (!candidate.length) return no('nessuna catena trovata');

    /* ── i sostituenti di una catena data ─────────────────────────────── */
    function ramo(daC, versoC, inCatena) {
      /* lunghezza e linearità del ramo che parte da versoC, senza tornare in catena */
      var n = 0, pila = [{ c: versoC, p: daC }], max = 0, ramificato = false;
      var visti = {};
      while (pila.length) {
        var u = pila.pop();
        if (visti[u.c]) continue;
        visti[u.c] = 1; n++;
        var figli = adiacenzaC[u.c].filter(function (v) {
          return v.c !== u.p && !inCatena[v.c]; });
        if (figli.length > 1) ramificato = true;
        figli.forEach(function (v) { pila.push({ c: v.c, p: u.c }); });
        if (adiacenzaC[u.c].some(function (v) { return v.ord > 1 && !inCatena[v.c]; }))
          ramificato = true;      /* un ramo insaturo non è un semplice alchile */
      }
      max = n;
      return { n: max, lineare: !ramificato };
    }

    /* La catena principale deve contenere il gruppo principale: è questo che
       definisce quali catene sono in gara, e quindi quale sia «la più lunga». */
    function portaIlGruppo(cat) {
      if (!tipo) return true;
      var inCatena = {};
      cat.forEach(function (c) { inCatena[c] = 1; });
      var ok = gruppi[tipo].every(function (atomoC) {
        var cc = idxC[atomoC];
        return cc !== undefined && inCatena[cc];
      });
      if (!ok) return false;
      /* acido e aldeide devono stare a un estremo: il loro carbonio è C1 */
      if (tipo === 'acido' || tipo === 'ale') {
        var cc2 = idxC[gruppi[tipo][0]];
        if (cat[0] !== cc2 && cat[cat.length - 1] !== cc2) return false;
      }
      return true;
    }

    function valuta(cat) {
      var inCatena = {};
      cat.forEach(function (c) { inCatena[c] = 1; });
      var posizioniGruppo = [];
      if (!portaIlGruppo(cat)) return null;
      /* sostituenti */
      var sost = [], insaturi = { ene: [], ino: [] }, scartata = null;
      cat.forEach(function (c, k) {
        var pos = k + 1;
        /* legami multipli lungo la catena */
        if (k + 1 < cat.length) {
          var l = adiacenzaC[c].filter(function (v) { return v.c === cat[k + 1]; })[0];
          if (l && l.ord === 2) insaturi.ene.push(pos);
          if (l && l.ord === 3) insaturi.ino.push(pos);
        }
        /* sostituenti appesi */
        C[c].vicini.forEach(function (v) {
          var vel = g.atomi[v.j].el;
          if (vel === 'H') return;
          if (vel === 'O' || vel === 'N') return;     /* gruppi, già trattati */
          if (vel !== 'C') {
            if (!ALOGENI[vel]) { scartata = 'alogeno sconosciuto'; return; }
            sost.push({ nome: ALOGENI[vel][lingua], pos: pos, alf: ALOGENI[vel][lingua] });
            return;
          }
          var cc3 = idxC[v.j];
          if (inCatena[cc3]) return;
          var r = ramo(c, cc3, inCatena);
          if (!r.lineare) { scartata = 'ramo ramificato o insaturo'; return; }
          var nm = alchile(r.n, lingua);
          if (!nm) { scartata = 'ramo troppo lungo'; return; }
          sost.push({ nome: nm, pos: pos, alf: nm });
        });
      });
      if (scartata) return null;
      var posGruppo = tipo ? gruppi[tipo].map(function (atomoC) {
        return cat.indexOf(idxC[atomoC]) + 1; }).sort(function (x, y) { return x - y; }) : [];
      posizioniGruppo = posGruppo;
      return { cat: cat, sost: sost, insaturi: insaturi, posGruppo: posizioniGruppo };
    }

    /* ── la catena più lunga non è negoziabile ─────────────────────────────
       La prima stesura filtrava le catene per validità e poi prendeva la più
       lunga fra quelle rimaste. Su CCCC(C(C)C)CCC — 4-isopropileptano — la
       catena di sette veniva scartata perché il sostituente è ramificato, e
       il nominatore ripiegava su una di sei producendo «2-metil-3-propilesano»:
       un nome che non è quello giusto. Un nome sbagliato è peggio di nessun
       nome, quindi la lunghezza massima si decide PRIMA, fra tutte le catene
       che portano il gruppo principale, e se nessuna di quelle è trattabile si
       rifiuta invece di accorciare. */
    var inGara = candidate.filter(portaIlGruppo);
    if (!inGara.length) return no(lingua === 'it'
      ? 'nessuna catena contiene il gruppo principale nella posizione richiesta'
      : 'no chain carries the principal group in the required position');
    var lunghezzaMax = inGara.reduce(function (m3, c) { return Math.max(m3, c.length); }, 0);
    var valide = [];
    inGara.forEach(function (c) {
      if (c.length !== lunghezzaMax) return;
      var v = valuta(c);
      if (v) valide.push(v);
    });
    if (!valide.length) return no(lingua === 'it'
      ? 'la catena principale è di ' + lunghezzaMax + ' carboni, ma porta un sostituente ' +
        'ramificato o insaturo: il nominatore locale copre solo sostituenti lineari'
      : 'the principal chain has ' + lunghezzaMax + ' carbons but carries a branched or ' +
        'unsaturated substituent: the local namer covers linear substituents only');

    /* ── la scelta, nell'ordine delle regole ──────────────────────────── */
    function listaMin(a, b) {
      var n = Math.min(a.length, b.length);
      for (var k = 0; k < n; k++) { if (a[k] !== b[k]) return a[k] - b[k]; }
      return a.length - b.length;
    }
    valide.sort(function (A, B) {
      /* 1. catena più lunga */
      if (A.cat.length !== B.cat.length) return B.cat.length - A.cat.length;
      /* 2. più legami multipli */
      var ia = A.insaturi.ene.length + A.insaturi.ino.length;
      var ib = B.insaturi.ene.length + B.insaturi.ino.length;
      if (ia !== ib) return ib - ia;
      /* 3. locanti più bassi al gruppo principale */
      var d = listaMin(A.posGruppo, B.posGruppo);
      if (d) return d;
      /* 4. locanti più bassi ai legami multipli */
      d = listaMin(A.insaturi.ene.concat(A.insaturi.ino).sort(function (x, y) { return x - y; }),
                   B.insaturi.ene.concat(B.insaturi.ino).sort(function (x, y) { return x - y; }));
      if (d) return d;
      /* 5. più sostituenti */
      if (A.sost.length !== B.sost.length) return B.sost.length - A.sost.length;
      /* 6. locanti più bassi ai sostituenti */
      d = listaMin(A.sost.map(function (s) { return s.pos; }).sort(function (x, y) { return x - y; }),
                   B.sost.map(function (s) { return s.pos; }).sort(function (x, y) { return x - y; }));
      if (d) return d;
      /* 7. il primo in ordine alfabetico prende il locante più basso */
      var aa = A.sost.slice().sort(function (x, y) { return x.pos - y.pos; });
      var bb2 = B.sost.slice().sort(function (x, y) { return x.pos - y.pos; });
      for (var k = 0; k < Math.min(aa.length, bb2.length); k++) {
        if (aa[k].alf !== bb2[k].alf) return aa[k].alf < bb2[k].alf ? -1 : 1;
      }
      return 0;
    });
    var V = valide[0];

    /* ── comporre il nome ─────────────────────────────────────────────── */
    var n = V.cat.length;
    var radice = RADICI[lingua][n];
    if (!radice) return no(lingua === 'it'
      ? 'catena di ' + n + ' carboni: oltre le radici definite'
      : 'a chain of ' + n + ' carbons: beyond the defined stems');

    var molti = (lingua === 'it') ? MOLTI : MOLTI_EN;

    /* prefissi dei sostituenti, raggruppati e in ordine alfabetico */
    var perNome = {};
    V.sost.forEach(function (s) {
      (perNome[s.nome] = perNome[s.nome] || []).push(s.pos);
    });
    var prefissi = Object.keys(perNome).sort().map(function (nm) {
      var pos = perNome[nm].sort(function (a2, b2) { return a2 - b2; });
      /* molti[1] è la stringa vuota, che è falsa: con «||» diventava «1-» e
         usciva «2-1-metilbutano». Si sceglie per indice, non per verità. */
      var m = (pos.length < molti.length) ? molti[pos.length] : (pos.length + '-');
      /* Il locante si scrive solo se distingue. Su un solo carbonio non
         distingue mai («triclorometano»); su due carboni con UN solo
         sostituente i due estremi sono equivalenti («cloroetano»), mentre con
         due sostituenti serve («1-bromo-2-cloroetano»). */
      if (n === 1) return m + nm;
      if (n === 2 && V.sost.length === 1) return nm;
      return pos.join(',') + '-' + m + nm;
    });

    /* insaturazioni */
    var ene = V.insaturi.ene.slice().sort(function (a2, b2) { return a2 - b2; });
    var ino = V.insaturi.ino.slice().sort(function (a2, b2) { return a2 - b2; });
    if (ene.length > 3 || ino.length > 3) return no(lingua === 'it'
      ? 'più di tre insaturazioni dello stesso tipo: non coperto'
      : 'more than three unsaturations of a kind: not covered');

    /* I locanti si scrivono solo se servono a distinguere. Su una catena di
       due carboni il doppio legame può stare in un posto solo: «etene», non
       «et-1-ene». Su un solo carbonio nemmeno i sostituenti hanno bisogno di
       locante: «triclorometano». */
    var locanteInutile = (n <= 2);

    var corpo;
    var infisso;
    var conMoltiplicatore = false;
    var vocaleFinale = 'e';
    if (!ene.length && !ino.length) {
      infisso = 'an';
    } else {
      var parti = [];
      if (ene.length) {
        conMoltiplicatore = conMoltiplicatore || ene.length > 1;
        parti.push((locanteInutile && ene.length === 1 ? '' : ene.join(',') + '-') +
                   (ene.length > 1 ? molti[ene.length] : '') + 'en');
      }
      if (ino.length) {
        conMoltiplicatore = conMoltiplicatore || ino.length > 1;
        parti.push((locanteInutile && ino.length === 1 ? '' : ino.join(',') + '-') +
                   (ino.length > 1 ? molti[ino.length] : '') +
                   (lingua === 'it' ? 'in' : 'yn'));
      }
      infisso = parti.join('-');
      /* La vocale finale segue l'ULTIMA insaturazione, e in italiano un
         alchino finisce in «-ino», non in «-ine»: «etino», «but-1-en-3-ino». */
      vocaleFinale = (lingua === 'it' && ino.length && !ene.length) ? 'o'
                   : (lingua === 'it' && ino.length && ene.length) ? 'o'
                   : 'e';
    }
    /* «buta-1,3-diene»: davanti a un moltiplicatore la radice prende la «a» */
    var radiceInsat = radice + (conMoltiplicatore ? 'a' : '');

    var suff = SUFFISSI[lingua];
    if (!tipo) {
      /* alcano: «butano». alchene/alchino: «but-2-ene», «etene» */
      corpo = (infisso === 'an')
        ? radice + (lingua === 'it' ? 'ano' : 'ane')
        : radiceInsat + (locanteInutile && !conMoltiplicatore ? '' : '-') + infisso + vocaleFinale;
    } else {
      var nomeSuff, locanti = V.posGruppo;
      /* il gambo che precede il suffisso: «butan», oppure «but-3-en» */
      var gambo = (infisso === 'an')
        ? radice + 'an'
        : radiceInsat + (locanteInutile && !conMoltiplicatore ? '' : '-') + infisso;
      if (tipo === 'acido' || tipo === 'ale') {
        /* il carbonio del gruppo è C1 per definizione: il locante non si scrive */
        nomeSuff = (tipo === 'acido') ? suff.acido : suff.ale;
        corpo = gambo + nomeSuff;
        if (tipo === 'acido' && lingua === 'it') corpo = 'acido ' + corpo;
      } else {
        var m2 = molti[locanti.length] || '';
        nomeSuff = (locanti.length > 1 ? m2 : '') + suff[tipo];
        /* in inglese la «e» di «butane» resta davanti a un suffisso che
           comincia per consonante («butane-1,4-diol») e cade davanti a una
           vocale («butan-2-ol»); in italiano la radice resta «butan-» */
        var base = gambo;
        if (lingua === 'en' && /^[^aeiouy]/.test(nomeSuff)) base += 'e';
        corpo = (locanteInutile && locanti.length === 1)
          ? base + nomeSuff
          : base + '-' + locanti.join(',') + '-' + nomeSuff;
      }
    }

    var nome = (prefissi.length ? prefissi.join('-') : '') + corpo;
    if (lingua === 'it' && tipo === 'acido' && prefissi.length) {
      nome = 'acido ' + prefissi.join('-') + corpo.replace(/^acido /, '');
    }

    return {
      nome: nome,
      classe: (lingua === 'it' ? 'nominatore locale' : 'local namer'),
      stereo: false,
      avviso: (lingua === 'it'
        ? 'La stereochimica non è indicata: R/S ed E/Z non sono dedotti.'
        : 'Stereochemistry is not given: R/S and E/Z are not derived.'),
      catena: n,
      gruppo: tipo
    };
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §5 · La conversione
     ═════════════════════════════════════════════════════════════════════════ */

  function conRDKit(fn) {
    if (globale.__rdkit) { fn(globale.__rdkit); return; }
    if (typeof globale.bsiLoadRDKit === 'function') { globale.bsiLoadRDKit(fn); return; }
    fn(null);
  }

  function formulaDaDescrittori(d) {
    try {
      var o = (typeof d === 'string') ? JSON.parse(d) : d;
      return o && (o.formula || o.molFormula) ? (o.formula || o.molFormula) : null;
    } catch (e) { return null; }
  }

  /* la formula si ricostruisce dal grafo: è un dato che non si deve supporre */
  function formulaDaGrafo(g, idrogeniImpliciti) {
    if (!g) return null;
    var c = {};
    g.atomi.forEach(function (a) { c[a.el] = (c[a.el] || 0) + 1; });
    if (idrogeniImpliciti != null) c.H = (c.H || 0) + idrogeniImpliciti;
    var ordine = ['C', 'H'];
    Object.keys(c).sort().forEach(function (k) { if (k !== 'C' && k !== 'H') ordine.push(k); });
    return ordine.filter(function (k) { return c[k]; })
                 .map(function (k) { return k + (c[k] > 1 ? c[k] : ''); }).join('');
  }

  function converti(testo, opzioni, callback) {
    opzioni = opzioni || {};
    var lingua = opzioni.lingua === 'en' ? 'en' : 'it';
    var ric = riconosci(testo);
    var grezzo = String(testo == null ? '' : testo);
    var esito = {
      /* un molfile si passa com'è: ripulirlo lo rompe */
      ingresso: (ric.lingua === 'molfile') ? grezzo : grezzo.trim(),
      linguaRiconosciuta: ric.lingua,
      note: [],
      uscite: {},
      impossibili: {}
    };
    if (!ric.lingua) { esito.errore = ric.perche; callback(esito); return; }
    if (ric.soloUscita) {
      esito.errore = ric.perche;
      callback(esito); return;
    }

    conRDKit(function (R) {
      if (!R) {
        esito.errore = lingua === 'it'
          ? 'Il motore chimico non è disponibile: senza RDKit non si converte niente, e non si inventa.'
          : 'The chemistry engine is unavailable: without RDKit nothing is converted, and nothing is invented.';
        callback(esito); return;
      }
      var m = null;
      try {
        m = (ric.lingua === 'smarts' && typeof R.get_qmol === 'function')
              ? R.get_qmol(esito.ingresso)
              : R.get_mol(esito.ingresso);
      } catch (e) { m = null; esito.dettaglioErrore = e.message; }
      if (!m) {
        if (ric.sospettoNome) {
          esito.linguaRiconosciuta = 'nome';
          esito.errore = lingua === 'it'
            ? 'Il motore non lo legge come struttura: sembra un nome, e un nome non si ' +
              'converte con un calcolo — serve un archivio o la rete.'
            : 'The engine does not read it as a structure: it looks like a name, and a name ' +
              'is not converted by computation — it needs an archive or the network.';
          esito.suggerimento = lingua === 'it'
            ? 'Usa la scheda «Nome»: cerca prima fra le molecole dell’app, poi su PubChem.'
            : 'Use the "Name" tab: it searches the app’s molecules first, then PubChem.';
        } else {
          esito.errore = lingua === 'it'
            ? 'Il motore non riconosce questa struttura: controlla la sintassi.'
            : 'The engine does not recognise this structure: check the syntax.';
        }
        callback(esito); return;
      }

      function prova(chiave, fn) {
        try { var v = fn(); if (v != null && v !== '') esito.uscite[chiave] = v; }
        catch (e) { esito.impossibili[chiave] = e.message.slice(0, 80); }
      }

      prova('smiles', function () { return m.get_smiles(); });
      prova('cxsmiles', function () { return m.get_cxsmiles(); });
      /* Il molfile è già scritto in forma di Kekulé: misurato sul benzene, gli
         ordini di legame sono 2,1,2,1,2,1. La forma aromatica è un'uscita
         diversa e vera (ordine 4), quindi si offre. */
      prova('molfileAromatico', function () { return m.get_aromatic_form(); });
      prova('smarts', function () { return m.get_smarts(); });
      prova('molfile', function () { return m.get_molblock(); });
      prova('molfileV3000', function () { return m.get_v3Kmolblock(); });
      prova('inchi', function () { return m.get_inchi(); });
      prova('json', function () { return m.get_json(); });
      if (esito.uscite.inchi && typeof R.get_inchikey_for_inchi === 'function') {
        prova('chiaveInchi', function () { return R.get_inchikey_for_inchi(esito.uscite.inchi); });
      }
      var desc = null;
      prova('descrittori', function () { desc = m.get_descriptors(); return desc; });
      if (desc) {
        try {
          var d = JSON.parse(desc);
          esito.massa = d.amw; esito.massaEsatta = d.exactmw;
          esito.atomiPesanti = d.NumHeavyAtoms || d.numHeavyAtoms;
        } catch (e) {}
      }
      delete esito.uscite.descrittori;

      /* la formula dal grafo, non da un campo che potrebbe non esserci */
      var g = esito.uscite.molfile ? grafoDaMolfile(esito.uscite.molfile) : null;
      if (g) {
        var hImp = null;
        try {
          var dd = JSON.parse(desc || '{}');
          if (typeof dd.NumHeavyAtoms === 'number' && typeof dd.amw === 'number') hImp = null;
        } catch (e) {}
        esito.uscite.formula = formulaDaGrafoConIdrogeni(g);
      }

      /* ciò che non si può fare, detto */
      /* Uno SMILES di Kekulé non si può dare: misurato, get_smiles con
         kekuleSmiles, kekulize e canonical+kekuleSmiles torna sempre la forma
         aromatica. Mostrare quella stringa sotto l'etichetta «Kekulé» sarebbe
         una riga che dice una cosa falsa, quindi la riga non c'è. */
      esito.impossibili.smilesKekule = lingua === 'it'
        ? 'questa build non emette uno SMILES di Kekulé: tutte le opzioni tornano la forma ' +
          'aromatica. Il molfile, però, è già kekulizzato'
        : 'this build does not emit a Kekulé SMILES: every option returns the aromatic form. ' +
          'The molfile, however, is already kekulised';
      esito.impossibili.inchiInIngresso = lingua === 'it'
        ? 'l’InChI si genera ma questa build non lo rilegge'
        : 'InChI is generated but this build does not read it back';
      esito.impossibili.chiaveInIngresso = lingua === 'it'
        ? 'la chiave InChI è un digest: non è invertibile per costruzione'
        : 'the InChI key is a digest: it is not invertible by construction';

      /* il nome, con la provenienza */
      esito.nome = { locale: null, archivio: null, rete: null };
      if (g) {
        var nn = nominaDaGrafo(g, lingua);
        esito.nome.locale = nn;
      }
      if (esito.uscite.chiaveInchi && typeof globale.BSIMolLingue !== 'undefined' &&
          globale.BSIMolLingue.archivio) {
        esito.nome.archivio = globale.BSIMolLingue.archivio[esito.uscite.chiaveInchi] || null;
      }
      try { m.delete(); } catch (e) {}
      callback(esito);
    });
  }

  /* gli idrogeni impliciti: si contano dalla valenza, perché il molfile di
     RDKit non li scrive e una formula senza idrogeni è una formula sbagliata */
  var VALENZE = { C: 4, N: 3, O: 2, F: 1, Cl: 1, Br: 1, I: 1, S: 2, P: 3, H: 1 };
  function formulaDaGrafoConIdrogeni(g) {
    var c = {}, hTot = 0;
    g.atomi.forEach(function (a) {
      c[a.el] = (c[a.el] || 0) + 1;
      if (a.el === 'H') return;
      var v = VALENZE[a.el];
      if (v == null) return;
      var usata = a.vicini.reduce(function (s, x) { return s + (x.ord === 4 ? 1.5 : x.ord); }, 0);
      var h = v + (a.carica || 0) - usata;
      if (a.el === 'N' && a.carica > 0) h = 4 - usata;
      if (h > 0) hTot += Math.round(h);
    });
    c.H = (c.H || 0) + hTot;
    var ordine = ['C', 'H'];
    Object.keys(c).sort().forEach(function (k) { if (k !== 'C' && k !== 'H') ordine.push(k); });
    return ordine.filter(function (k) { return c[k]; })
                 .map(function (k) { return k + (c[k] > 1 ? c[k] : ''); }).join('');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §6 · L'archivio dei nomi che l'app ha già
     ═════════════════════════════════════════════════════════════════════════
     Si costruisce una volta, dalle banche dati in memoria: farmaci,
     amminoacidi, biomolecole. Dà il nome COMUNE, non quello IUPAC — e il
     pannello lo dichiara, perche' «aspirina» non e' un nome IUPAC. */

  function costruisciArchivio(callback) {
    var voci = [];
    function raccogli(insieme, campoNome, campoSmiles) {
      if (!Array.isArray(insieme)) return;
      insieme.forEach(function (x) {
        if (!x) return;
        var nm = x[campoNome], smi = x[campoSmiles];
        if (nm && smi) voci.push({ nome: nm, smiles: smi });
      });
    }
    raccogli(globale.FARM_DATA, 'name', 'smi');
    raccogli(globale.AA_DATA, 'name', 'smi');
    raccogli(globale.AA_DATA, 'nome', 'smiles');
    raccogli(globale.BIOMOL, 'name', 'smi');
    raccogli(globale.MOLS, 'n', 'smi');
    if (!voci.length) { callback({}, 0); return; }
    conRDKit(function (R) {
      if (!R) { callback({}, 0); return; }
      var arch = {}, fatti = 0;
      voci.forEach(function (v) {
        var m = null;
        try { m = R.get_mol(v.smiles); } catch (e) { return; }
        if (!m) return;
        try {
          var k = R.get_inchikey_for_inchi(m.get_inchi());
          if (k && !arch[k]) { arch[k] = v.nome; fatti++; }
        } catch (e) {}
        try { m.delete(); } catch (e) {}
      });
      callback(arch, fatti);
    });
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §7 · PubChem, quando c'è la rete
     ═════════════════════════════════════════════════════════════════════════ */

  var PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

  function nomeDaPubChem(smiles, callback) {
    if (!globale.fetch) { callback(null, 'fetch non disponibile'); return; }
    var url = PUG + '/compound/smiles/' + encodeURIComponent(smiles) +
              '/property/IUPACName,MolecularFormula/JSON';
    var scaduto = false;
    var t = setTimeout(function () { scaduto = true; callback(null, 'tempo scaduto'); }, 9000);
    globale.fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      if (scaduto) return;
      clearTimeout(t);
      var p = d && d.PropertyTable && d.PropertyTable.Properties &&
              d.PropertyTable.Properties[0];
      callback(p ? { nome: p.IUPACName || null, formula: p.MolecularFormula || null } : null,
               p ? null : 'risposta senza proprietà');
    }).catch(function (e) {
      if (scaduto) return;
      clearTimeout(t);
      callback(null, e.message);
    });
  }

  function strutturaDaNome(nome, callback) {
    if (!globale.fetch) { callback(null, 'fetch non disponibile'); return; }
    var url = PUG + '/compound/name/' + encodeURIComponent(nome) +
              '/property/CanonicalSMILES,IUPACName/JSON';
    var scaduto = false;
    var t = setTimeout(function () { scaduto = true; callback(null, 'tempo scaduto'); }, 9000);
    globale.fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      if (scaduto) return;
      clearTimeout(t);
      var p = d && d.PropertyTable && d.PropertyTable.Properties &&
              d.PropertyTable.Properties[0];
      callback(p ? { smiles: p.CanonicalSMILES || p.SMILES || null,
                     nomeIupac: p.IUPACName || null } : null,
               p ? null : 'nome non trovato');
    }).catch(function (e) {
      if (scaduto) return;
      clearTimeout(t);
      callback(null, e.message);
    });
  }

  /* ═════════════════════════════════════════════════════════════════════════ */

  globale.BSIMolLingue = {
    riconosci: riconosci,
    converti: converti,
    nominaDaGrafo: nominaDaGrafo,
    grafoDaMolfile: grafoDaMolfile,
    formulaDaGrafo: formulaDaGrafoConIdrogeni,
    haCicli: haCicli,
    costruisciArchivio: costruisciArchivio,
    nomeDaPubChem: nomeDaPubChem,
    strutturaDaNome: strutturaDaNome,
    archivio: null,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
